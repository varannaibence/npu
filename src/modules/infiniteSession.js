// Keeps the session alive, idle tab included, by making Neptun renew it itself.
//
// Measured on unideb (docs/API.md, GetNewTokens): Neptun logs out 15 minutes after
// the page's last own API request, and only such a request resets that countdown. So
// this never calls Account/GetNewTokens itself: that renewed the cookie but left the
// countdown running, and racing the page's own renewal got a 401 after which the
// session most likely was revoked. Instead, shortly before the logout would come, it
// presses the page's "Tárgy keresése" button; the page renews if needed, then searches.
// Anyone actually using the page sends requests, so their view is never reloaded.
//
// ponytail: only the course registration page has a measured, harmless trigger;
// synthetic mouse and key events do not wake Neptun's own renewal. Elsewhere an idle
// session still expires.
const interceptor = require("../interceptor");
const router = require("../router");
const { ROUTE } = require("./rajtolo/constants");
const { freshenAuth } = require("./rajtolo/net");

// A hidden tab runs this once a minute, so this lands 12.5-13.5 minutes into the
// quiet: before Neptun's 15-minute logout, and past its own 2-minute warning only
// when the tab is throttled.
const CHECK_INTERVAL_MS = 30 * 1000;
const QUIET_BEFORE_PRESS_MS = 12.5 * 60 * 1000;
const RETRY_MS = 60 * 1000;

// Shown in the settings panel; `id` is also the key the switch is stored under.
const meta = {
  id: "infiniteSession",
  group: "comfort",
  name: "Munkamenet életben tartása",
  description:
    "A tárgyfelvételi oldalon tétlen fülnél is megakadályozza a kiléptetést: 12,5 perc tétlenség után megnyomja a Neptun saját Tárgy keresése gombját. Más oldalon a munkamenet lejárhat.",
  defaultEnabled: false,
};

// Pure. Press only when the page has been quiet long enough that Neptun is about to
// log out anyway, and not again right after a press that brought nothing.
function keepAliveDue(nowMs, lastPageRequestAt, lastAttemptAt) {
  if (typeof lastPageRequestAt !== "number" || nowMs - lastPageRequestAt < QUIET_BEFORE_PRESS_MS) {
    return false;
  }
  return typeof lastAttemptAt !== "number" || nowMs - lastAttemptAt >= RETRY_MS;
}

function shouldActivate() {
  return true;
}

function initialize() {
  let lastAttemptAt = null;
  setInterval(() => {
    const now = Date.now();
    if (router.getPath() !== ROUTE || !keepAliveDue(now, interceptor.getLastPageRequestAt(), lastAttemptAt)) {
      return;
    }
    lastAttemptAt = now;
    freshenAuth();
  }, CHECK_INTERVAL_MS);
}

module.exports = { meta, shouldActivate, initialize, keepAliveDue };
