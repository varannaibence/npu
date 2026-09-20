const assert = require("assert");
const occupancy = require("../src/modules/occupancy");
const creditBreakdown = require("../src/modules/creditBreakdown");

const occupancyState = {
  termId: "term-a",
  courseState: new Map([["A-01", {}]]),
  subjectCatalog: new Map([["subject-a", {}]]),
  subjectSummary: new Map([["subject-a", {}]]),
};
assert.strictEqual(occupancy.resetCache(occupancyState, "term-a"), false);
assert.strictEqual(occupancyState.courseState.size, 1, "the same term keeps its cache");
assert.strictEqual(occupancy.resetCache(occupancyState, "term-b"), true);
assert.strictEqual(occupancyState.courseState.size, 0, "a new term clears course states");
assert.strictEqual(occupancyState.subjectCatalog.size, 0, "a new term clears subject labels");
assert.strictEqual(occupancyState.subjectSummary.size, 0, "a new term clears subject summaries");

const creditState = { termId: "1", totals: new Map([["Kötelező", 5]]), asked: true };
assert.strictEqual(creditBreakdown.resetState(creditState, "1"), false);
assert.strictEqual(creditState.totals.size, 1, "the same term keeps its totals");
assert.strictEqual(creditBreakdown.resetState(creditState, "2"), true);
assert.strictEqual(creditState.totals.size, 0, "a new term clears the breakdown");
assert.strictEqual(creditState.asked, false, "a new term permits one fresh request");
assert.strictEqual(creditBreakdown.termIdFromUrl("?request.termId=42&sort=asc"), "42");
assert.strictEqual(creditBreakdown.termIdFromUrl("?request.termId=wrong"), null);
