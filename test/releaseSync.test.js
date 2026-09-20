const assert = require("assert");
const { renderReleaseBlock, replaceReleaseBlock, stableReleases, START, END } = require("../tools/sync-releases");

const releases = [
  {
    tag_name: "v3.0.0",
    name: "v3.0.0",
    published_at: "2026-09-20T00:00:00Z",
    html_url: "https://github.com/varannaibence/npu/releases/tag/v3.0.0",
  },
  { tag_name: "v4.0.0-rc.1", name: "Pre-release", prerelease: true },
  {
    tag_name: "v2.4.1",
    name: "Legacy release | kept",
    html_url: "https://github.com/varannaibence/npu/releases/tag/v2.4.1",
  },
  {
    tag_name: "v2.4.0",
    name: "v2.4.0",
    html_url: "https://github.com/varannaibence/npu/releases/tag/v2.4.0",
  },
  { tag_name: "v2.3.0", name: "Too old", html_url: "https://example.invalid/v2.3.0" },
];

assert.strictEqual(stableReleases(releases).length, 3, "the README shows at most three stable releases");
const block = renderReleaseBlock(releases, "varannaibence/npu");
assert.ok(block.includes("2026"), "published release dates are shown");
assert.ok(!block.includes("v2.3.0"), "older releases are omitted");
assert.ok(!block.includes("v4.0.0-rc.1"), "pre-releases are omitted");

const source = `before\n${START}\nold\n${END}\nafter`;
assert.strictEqual(replaceReleaseBlock(source, block), `before\n${block}\nafter`);
