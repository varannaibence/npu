// Writes dist/npu.dev.user.js - a stub you install into Tampermonkey ONCE.
//
// It contains no code of its own. It only `@require`s the built file straight off
// disk, and Tampermonkey re-reads a file:// require each time the script runs. So the
// loop becomes: save -> webpack rebuilds -> reload the Neptun tab. No reinstalling,
// no pasting a URL, no version bumping.
//
// The metadata is generated from src/meta.txt rather than copied, so the dev stub
// cannot drift out of sync with the real script's @include/@grant/@run-at - a
// difference there would make the dev build behave unlike the shipped one, which is
// the one thing a dev build must never do.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const builtFile = path.join(root, "dist", "npu.user.js");

const meta = fs
  .readFileSync(path.join(root, "src", "meta.txt"), "utf8")
  // 0.0.0 so Tampermonkey never believes an update is available, and so the version
  // shown in the footer and on the login page reads as "this is the dev build".
  .replace("<version>", "0.0.0")
  .replace(/^\/\/ @name .*$/m, "// @name           Neptun PowerUp! (dev)")
  // The download URL would point Tampermonkey at the published release; the require
  // points it at what you just built instead.
  .replace(/^\/\/ @downloadURL.*$/m, `// @require        file://${builtFile}`);

if (!/@require {8}file:\/\//.test(meta)) {
  throw new Error("meta.txt no longer has an @downloadURL line to swap for @require");
}

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist", "npu.dev.user.js");
fs.writeFileSync(out, meta);

process.stdout.write(`dev loader: ${out}\n  -> requires ${builtFile}\n`);
