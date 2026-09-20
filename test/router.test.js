const assert = require("assert");
const router = require("../src/router");

// --- router: polls location, so the self-check drives check() directly rather than
// waiting on a timer ---
const fakeRouterWindow = {
  location: { pathname: "/hallgato_ng/dashboard" },
  setInterval() {},
};
router.install(fakeRouterWindow);
assert.ok(router.matches("/hallgato_ng/dashboard", fakeRouterWindow));

let seenPath;
let fireCount = 0;
router.onChange(path => {
  seenPath = path;
  fireCount++;
});

// an unchanged path must stay quiet - otherwise every poll would look like a navigation
assert.strictEqual(router.check(fakeRouterWindow), false);
assert.strictEqual(fireCount, 0, "a poll with no navigation must not fire");

fakeRouterWindow.location.pathname = "/hallgato_ng/subjects/registration";
assert.strictEqual(router.check(fakeRouterWindow), true);
assert.strictEqual(seenPath, "/hallgato_ng/subjects/registration");
assert.strictEqual(fireCount, 1);
assert.strictEqual(router.check(fakeRouterWindow), false, "the same path must not fire twice");
assert.ok(router.matches("/hallgato_ng/subjects/registration", fakeRouterWindow));
assert.ok(!router.matches("/hallgato_ng/dashboard", fakeRouterWindow));

// One feature failing must not prevent later route observers from running.
let reachedAfterThrow = false;
router.onChange(() => {
  throw new Error("a feature blew up");
});
router.onChange(() => {
  reachedAfterThrow = true;
});
fakeRouterWindow.location.pathname = "/hallgato_ng/subjects/list";
assert.strictEqual(router.check(fakeRouterWindow), true);
assert.ok(reachedAfterThrow, "a throwing route observer must not swallow the next one");
