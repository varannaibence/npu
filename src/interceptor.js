// Rides the Angular app's own requests instead of making our own: a same-origin
// call without the app's Authorization header gets 401. Endpoints are matched on the
// path after this prefix, e.g. "SubjectApplication/SchedulableSubjects".
const API_PREFIX = "/hallgato_ng/api/";

const requestHandlers = [];
const responseHandlers = [];
const authHandlers = [];
let nextRequestId = 0;

// The Authorization header Angular last set on one of its own XHRs. Modules that
// must originate an authenticated call read it back from here. We never go looking
// for the underlying token ourselves - only echo what the app already sent.
let lastAuthHeader = null;
// A 401-ed value stays hidden from our modules until the app supplies a genuinely
// different one. This never alters the page's own request - it only stops us
// starting a new NPU call with a value already known to be dead.
let blockedAuthHeader = null;

function normaliseAuth(value) {
  return typeof value === "string" && value.trim() ? value : null;
}

// Best-effort: a feature must never break the page's own XHR by failing here.
function setAuthHeader(value, metadata, force) {
  const next = normaliseAuth(value);
  if (!force && blockedAuthHeader && next === blockedAuthHeader) {
    return;
  }
  if (blockedAuthHeader && next && next !== blockedAuthHeader) {
    blockedAuthHeader = null;
  }
  if (!force && next === lastAuthHeader) {
    return;
  }
  lastAuthHeader = next;
  authHandlers.slice().forEach(handler => {
    try {
      handler(next, metadata || null);
    } catch (e) {
      // An observer is advisory and must not interrupt the app request.
    }
  });
}

// Null before the app's first authenticated call.
function getAuthHeader() {
  return lastAuthHeader;
}

// Logout can show up as a route change before the next API request, so modules need
// a way to discard the captured value rather than replay an old token.
function clearAuthHeader() {
  blockedAuthHeader = null;
  setAuthHeader(null, { source: "explicit-clear" }, true);
}

// Retires the captured value only if the failed request used the one we currently
// know: a late 401 from an older request must not invalidate a newer session.
function invalidateAuthHeader(value, metadata) {
  const failed = normaliseAuth(value);
  if (!failed || failed !== lastAuthHeader) {
    return false;
  }
  blockedAuthHeader = failed;
  setAuthHeader(null, Object.assign({ source: "http-401", status: 401 }, metadata || {}), true);
  return true;
}

// Permits one new observation after the user has re-authenticated. Invents nothing:
// the next value can only come from the page's own request header.
function allowAuthRetry() {
  blockedAuthHeader = null;
  lastAuthHeader = null;
}

// Fed only by headers on the page's own requests, never by token storage.
function onAuthChange(fn) {
  if (typeof fn !== "function") {
    return () => {};
  }
  authHandlers.push(fn);
  return () => {
    const index = authHandlers.indexOf(fn);
    if (index >= 0) {
      authHandlers.splice(index, 1);
    }
  };
}

// Server-clock offset (serverTime - Date.now()), sampled from the `Date` header
// every response carries. rajtolo schedules against this rather than the local
// clock, which can be seconds to minutes out.
let serverOffsetMs = null;

// Null before any response has told us.
function getServerOffsetMs() {
  return serverOffsetMs;
}

// Guarded: a response without the header must not break request handling.
function recordServerDate(dateHeader) {
  const parsed = typeof dateHeader === "string" ? Date.parse(dateHeader) : NaN;
  if (!Number.isNaN(parsed)) {
    serverOffsetMs = parsed - Date.now();
  }
}

// "Controller/Action", or null if this is not an API call.
function getEndpoint(url) {
  if (typeof url !== "string") {
    return null;
  }
  const raw = url.trim();
  const absolute = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw);
  if (absolute && typeof location === "undefined") {
    return null;
  }
  try {
    const base = typeof location !== "undefined" && location.origin ? location.origin : "http://npu.invalid";
    const parsed = new URL(raw, base);
    if (typeof location !== "undefined" && location.origin && parsed.origin !== location.origin) {
      return null;
    }
    if (!parsed.pathname.startsWith(API_PREFIX)) {
      return null;
    }
    return parsed.pathname.slice(API_PREFIX.length);
  } catch (e) {
    return null;
  }
}

function matches(pattern, endpoint) {
  return pattern instanceof RegExp ? pattern.test(endpoint) : pattern === endpoint;
}

// Return a new URL string from fn to rewrite it; anything else leaves it alone.
function onRequest(pattern, fn) {
  requestHandlers.push({ pattern, fn });
}

function onResponse(pattern, fn) {
  responseHandlers.push({ pattern, fn });
}

function rewriteUrl(url, metadata) {
  const endpoint = getEndpoint(url);
  if (!endpoint) {
    return url;
  }
  let result = url;
  requestHandlers.forEach(handler => {
    if (!matches(handler.pattern, endpoint)) {
      return;
    }
    // This runs INSIDE the page's own XMLHttpRequest.open(), so an exception here
    // breaks Angular's request, not just our feature.
    try {
      const next = handler.fn(result, endpoint, metadata || null);
      if (typeof next === "string") {
        result = next;
      }
    } catch (e) {
      // advisory only
    }
  });
  return result;
}

function dispatchResponse(url, json, metadata) {
  const endpoint = getEndpoint(url);
  if (!endpoint || typeof json === "undefined") {
    return;
  }
  responseHandlers.forEach(handler => {
    if (!matches(handler.pattern, endpoint)) {
      return;
    }
    // Also: these run in a shared loop, so one throwing used to take every later
    // handler's response with it.
    try {
      handler.fn(json, Object.assign({ url, endpoint }, metadata || {}));
    } catch (e) {
      // advisory only
    }
  });
}

// HttpClient is measured to use XHR, not fetch.
function patchXhr(target) {
  const XHR = target.XMLHttpRequest;
  if (!XHR || XHR.__npuPatched) {
    return;
  }
  const open = XHR.prototype.open;
  XHR.prototype.open = function (method, url, ...rest) {
    this.__npuRequestId = ++nextRequestId;
    this.__npuAuthHeader = null;
    this.__npuUrl = rewriteUrl(url, { requestId: this.__npuRequestId });
    return open.call(this, method, this.__npuUrl, ...rest);
  };
  const setRequestHeader = XHR.prototype.setRequestHeader;
  XHR.prototype.setRequestHeader = function (name, value) {
    if (typeof name === "string" && name.toLowerCase() === "authorization") {
      this.__npuAuthHeader = typeof value === "string" && value.trim() ? value : null;
      if (getEndpoint(this.__npuUrl || this.url)) {
        setAuthHeader(this.__npuAuthHeader, {
          requestId: this.__npuRequestId,
          url: this.__npuUrl || this.url,
          source: "xhr-header",
        });
      }
    }
    return setRequestHeader.call(this, name, value);
  };
  const send = XHR.prototype.send;
  XHR.prototype.send = function (...args) {
    // Angular sends Authorization on every measured API call; if it does not, this
    // is the observable logout boundary, so clear what we captured.
    if (getEndpoint(this.__npuUrl || this.url)) {
      setAuthHeader(this.__npuAuthHeader, {
        requestId: this.__npuRequestId,
        url: this.__npuUrl || this.url,
        source: "xhr-send",
      });
    }
    this.addEventListener("load", () => {
      if (typeof this.getResponseHeader === "function") {
        recordServerDate(this.getResponseHeader("Date"));
      }
      const status = Number(this.status);
      if (status === 401 && getEndpoint(this.__npuUrl || this.url)) {
        invalidateAuthHeader(this.__npuAuthHeader, {
          requestId: this.__npuRequestId,
          url: this.__npuUrl || this.url,
          source: "xhr-401",
        });
      }
      let json;
      try {
        json = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
      } catch (e) {
        return;
      }
      dispatchResponse(this.__npuUrl || "", json, {
        requestId: this.__npuRequestId,
        authHeader: this.__npuAuthHeader,
        status,
      });
    });
    return send.apply(this, args);
  };
  XHR.__npuPatched = true;
}

// A cheap safety net. Tampermonkey sandboxes `window`, so assigning fetch there
// never reaches the page - hence unsafeWindow. Patching XHR works only because that
// goes through a shared prototype.
//
// Only string URLs are rewritten; a Request object passes through unchanged.
function patchFetch(target) {
  const host = typeof unsafeWindow !== "undefined" ? unsafeWindow : target;
  const original = host.fetch;
  if (!original || original.__npuPatched) {
    return;
  }
  const wrapped = function (input, init) {
    const requestId = ++nextRequestId;
    const originalUrl = typeof input === "string" ? input : input && input.url;
    const authHeader = readFetchAuth(input, init);
    if (getEndpoint(originalUrl)) {
      setAuthHeader(authHeader, { requestId, url: originalUrl, source: "fetch" });
    }
    const url = typeof input === "string" ? rewriteUrl(input, { requestId }) : input;
    return original.call(host, url, init).then(res => {
      const status = Number(res && res.status);
      if (status === 401 && getEndpoint(originalUrl)) {
        invalidateAuthHeader(authHeader, {
          requestId,
          url: originalUrl,
          source: "fetch-401",
        });
      }
      if (res.headers && typeof res.headers.get === "function") {
        recordServerDate(res.headers.get("Date"));
      }
      res
        .clone()
        .json()
        .then(json =>
          dispatchResponse(typeof url === "string" ? url : url.url, json, {
            requestId,
            authHeader,
            status,
          })
        )
        .catch(() => {});
      return res;
    });
  };
  wrapped.__npuPatched = true;
  host.fetch = wrapped;
}

function readFetchHeaders(headers) {
  if (!headers) {
    return null;
  }
  if (typeof headers.get === "function") {
    return normaliseAuth(headers.get("Authorization"));
  }
  if (Array.isArray(headers)) {
    const entry = headers.find(
      item => Array.isArray(item) && typeof item[0] === "string" && item[0].toLowerCase() === "authorization"
    );
    return entry ? normaliseAuth(entry[1]) : null;
  }
  if (typeof headers === "object") {
    const key = Object.keys(headers).find(name => name.toLowerCase() === "authorization");
    return key ? normaliseAuth(headers[key]) : null;
  }
  return null;
}

function readFetchAuth(input, init) {
  const initAuth = readFetchHeaders(init && init.headers);
  if (initAuth) {
    return initAuth;
  }
  return readFetchHeaders(input && input.headers);
}

// Call as early as possible - before Angular issues its first request.
function install(target = typeof window !== "undefined" ? window : global) {
  patchXhr(target);
  patchFetch(target);
}

module.exports = {
  install,
  onRequest,
  onResponse,
  getAuthHeader,
  clearAuthHeader,
  invalidateAuthHeader,
  allowAuthRetry,
  onAuthChange,
  getServerOffsetMs,
};
