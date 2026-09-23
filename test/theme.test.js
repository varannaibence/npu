const assert = require("assert");
const theme = require("../src/theme");
const settings = require("../src/settings");

// Neptun's own navy (#213055) is, within rounding, what its own blue maps to.
const navy = [1, 3, 5].map(i => parseInt(theme.darkShade(theme.NEPTUN_PRIMARY).slice(i, i + 2), 16));
[33, 48, 85].forEach((channel, i) => assert.ok(Math.abs(navy[i] - channel) <= 2, `navy channel ${i}: ${navy[i]}`));
const [r, g, b] = [1, 3, 5].map(i => parseInt(theme.darkShade("#c2185b").slice(i, i + 2), 16));
assert.ok(r > g && r > b && r < 110, "a dark shade keeps the hue and gets dark");

const palette = { primary: "#c2185b", navy: "#4a1a2e" };
assert.strictEqual(theme.recolour("#0943D9", palette), "#c2185b");
assert.strictEqual(theme.recolour("1px solid rgb(9, 67, 217)", palette), "1px solid rgb(194, 24, 91)");
assert.strictEqual(theme.recolour("rgba(9, 67, 217, 0.5)", palette), "rgba(194, 24, 91, 0.5)");
assert.strictEqual(theme.recolour("rgb(33, 48, 85)", palette), "rgb(74, 26, 46)");
assert.strictEqual(theme.recolour("rgb(9, 67, 2170)", palette), "rgb(9, 67, 2170)");

// A CSSOM-shaped fake: only declarations naming a brand colour become templates,
// and @media wrappers survive the round trip.
function styleRule(selectorText, decls) {
  const style = Object.keys(decls);
  style.getPropertyValue = prop => decls[prop].split("!")[0];
  style.getPropertyPriority = prop => (decls[prop].includes("!") ? "important" : "");
  return { selectorText, style };
}
const templates = theme.collectTemplates([
  styleRule(":root", { "--mdc-x": "#0943d9", "--other": "#ffffff" }),
  styleRule(".footer", { "background-color": "rgb(33, 48, 85)", color: "rgb(255, 255, 255)" }),
  { conditionText: "(max-width: 600px)", cssRules: [styleRule(".btn", { color: "rgb(9, 67, 217)!important" })] },
  { name: "spin", cssRules: [] },
]);
assert.strictEqual(templates.length, 3);
assert.strictEqual(
  theme.renderCss(templates, "#c2185b"),
  [
    ":root{--mdc-x:#c2185b}",
    `.footer{background-color:rgb(${[1, 3, 5].map(i => parseInt(theme.darkShade("#c2185b").slice(i, i + 2), 16)).join(", ")})}`,
    "@media (max-width: 600px){.btn{color:rgb(194, 24, 91) !important}}",
  ].join("\n")
);

// The colour survives pruning only as a valid hex.
assert.deepStrictEqual(settings.pruneFlags({ "theme.color": "#C2185B" }, []), { "theme.color": "#c2185b" });
assert.deepStrictEqual(settings.pruneFlags({ "theme.color": "red; x" }, []), {});
assert.strictEqual(settings.themeColor({}), null);
