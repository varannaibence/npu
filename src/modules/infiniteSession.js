// Discreet keep-alive. The session is a ~15 min rolling window that any real API
// call resets, so this hits the app's own refresh endpoint only when warranted:
//
//   near expiry AND recently active  -> one request
//   otherwise                        -> let it expire
//
// The timer drives a local, free *check*; the network call it may trigger is always
// conditional on real activity. A blind periodic ping is the bot-shaped pattern this
// exists to avoid.
const interceptor = require("../interceptor");

// A refresh only counts as riding real usage if the user acted within this window.
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;
// How close to expiry we start caring at all.
const REFRESH_MARGIN_MS = 2 * 60 * 1000;
// Fallback only, until the first response tells us the real number.
const DEFAULT_TIMEOUT_MINUTES = 15;
// These events fire far more often than the timestamp needs updating.
const ACTIVITY_THROTTLE_MS = 5000;
// How often "should I refresh now?" is re-evaluated.
const CHECK_INTERVAL_MS = 30 * 1000;
const REFRESH_TIMEOUT_MS = 30 * 1000;
// The app's own refresh endpoint: POST {} → { accessToken, sessionTimeoutInMinutes }.
const REFRESH_ENDPOINT = "/hallgato_ng/api/Account/GetNewTokens";

let lastActivityAt = null;
let sessionTimeoutMinutes = DEFAULT_TIMEOUT_MINUTES;
let sessionExpiresAt = Date.now() + sessionTimeoutMinutes * 60 * 1000;
let refreshInFlight = false;
let activityThrottled = false;

// Shown in the settings panel; `id` is also the key the switch is stored under.
const meta = {
  id: "infiniteSession",
  name: "Munkamenet életben tartása",
  description: "Közeli lejáratkor, valódi használat mellett megújítja a munkamenetet. Tétlen lapot nem tart életben.",
  defaultEnabled: false,
};

function shouldActivate() {
  return true;
}

// Time is passed in rather than read, so this is checkable without a real clock.
function shouldRefresh(now, expiresAt, lastActivity, activeWindowMs, marginMs) {
  return typeof lastActivity === "number" && expiresAt - now < marginMs && now - lastActivity < activeWindowMs;
}

// sessionTimeoutInMinutes arrives top-level from GetNewTokens and under .data from
// Authenticate. Falls back to whatever we already knew.
function readTimeoutMinutes(body, previousMinutes) {
  const fromTop = body && typeof body.sessionTimeoutInMinutes === "number" ? body.sessionTimeoutInMinutes : null;
  const fromData =
    body && body.data && typeof body.data.sessionTimeoutInMinutes === "number"
      ? body.data.sessionTimeoutInMinutes
      : null;
  const minutes = fromTop || fromData;
  return minutes > 0 ? minutes : previousMinutes;
}

// Carries the Authorization header captured off the app's own requests; a
// same-origin call without it gets 401. No-ops if we have not seen one yet.
function refresh() {
  const auth = interceptor.getAuthHeader();
  if (!auth || refreshInFlight) {
    return;
  }
  refreshInFlight = true;
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", REFRESH_ENDPOINT);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", auth);
    xhr.timeout = REFRESH_TIMEOUT_MS;
    xhr.addEventListener("loadend", () => {
      refreshInFlight = false;
    });
    xhr.send("{}");
  } catch (e) {
    refreshInFlight = false;
  }
}

function onActivity() {
  if (activityThrottled) {
    return;
  }
  activityThrottled = true;
  setTimeout(() => {
    activityThrottled = false;
  }, ACTIVITY_THROTTLE_MS);
  lastActivityAt = Date.now();
}

// A genuinely idle session (tab left open overnight) is allowed to expire. Keeping
// one alive needs idle traffic, which is the pattern this module exists to avoid.
// A trade-off to keep, not a bug to fix.
function initialize() {
  ["visibilitychange", "pointerdown", "keydown", "scroll"].forEach(type => {
    document.addEventListener(type, onActivity, { passive: true, capture: true });
  });

  // Any response is itself the signal that the server's window just reset.
  interceptor.onResponse(/./, body => {
    sessionTimeoutMinutes = readTimeoutMinutes(body, sessionTimeoutMinutes);
    const nextExpiresAt = Date.now() + sessionTimeoutMinutes * 60 * 1000;
    sessionExpiresAt = nextExpiresAt;
  });

  setInterval(() => {
    const now = Date.now();
    if (shouldRefresh(now, sessionExpiresAt, lastActivityAt, ACTIVE_WINDOW_MS, REFRESH_MARGIN_MS)) {
      refresh();
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = {
  meta,
  shouldActivate,
  initialize,
  shouldRefresh,
  refresh,
  readTimeoutMinutes,
};
