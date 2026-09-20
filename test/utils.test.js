const assert = require("assert");
const utils = require("../src/utils");

// --- utils.cloneButton: the clone must not inherit a dead state ---
// Angular disables #filter-table while its form is pristine or a request is in
// flight. A clone taken at that moment kept the attribute and stayed unclickable
// forever - this shipped once, hence the assert.
function fakeClassList(initial) {
  const set = new Set(initial);
  return {
    set,
    remove(name) {
      set.delete(name);
    },
    contains(name) {
      return set.has(name);
    },
  };
}
const liveButton = {
  tagName: "BUTTON",
  disabled: true,
  attrs: { id: "filter-table", disabled: "", type: "submit" },
  cloneNode(deep) {
    return Object.assign({}, liveButton, {
      deep,
      classList: fakeClassList(["flat", "primary", "loading", "disabled"]),
      removeAttribute(name) {
        delete this.attrs[name];
      },
    });
  },
};
const cloned = utils.cloneButton(liveButton);
assert.strictEqual(cloned.disabled, false, "a clone of a disabled button must come back alive");
assert.strictEqual(cloned.attrs.disabled, undefined, "the attribute has to go too, not just the property");
assert.strictEqual(cloned.attrs.id, undefined, "the id would be duplicated otherwise");
assert.strictEqual(cloned.type, "button", "type=submit would submit the form the original belongs to");
// deep, so the `.neptun-button__label` span comes along: the host button's own colour
// is its background colour, so a caption written onto the host is invisible
assert.strictEqual(cloned.deep, true, "a shallow clone loses the label span and the caption turns invisible");
// `loading` swaps the caption for a spinner via ::before - cloning the login submit
// at the moment the login finishes produced a button that span forever
assert.ok(!cloned.classList.contains("loading"), "a frozen spinner is not styling, it is stale state");
assert.ok(!cloned.classList.contains("disabled"), "same for the disabled class");
assert.ok(cloned.classList.contains("primary"), "real styling classes must survive");
assert.ok(cloned.classList.contains("flat"), "real styling classes must survive");

// a source without a classList (a bare fake, or a stripped-down element) must not throw
const noClassList = utils.cloneButton({
  attrs: {},
  cloneNode: () => ({ attrs: {}, removeAttribute() {} }),
});
assert.strictEqual(noClassList.type, "button");

// --- utils.setButtonLabel: a Neptun button hides its caption in a span ---
// A cloned button carries `.neptun-button__label` plus icon spans; setting
// textContent on the root would wipe the icons out along with the old caption.
const labelSpan = { className: "neptun-button__label", textContent: "Bejelentkezés" };
const iconSpan = { className: "neptun-button__prefix-icon", textContent: "*" };
const clonedNeptunButton = {
  children: [iconSpan, labelSpan],
  querySelector: sel => (sel === ".neptun-button__label" ? labelSpan : null),
};
utils.setButtonLabel(clonedNeptunButton, "Indítás");
assert.strictEqual(labelSpan.textContent, "Indítás", "the caption lives in the span, not on the button");
assert.strictEqual(clonedNeptunButton.children.length, 2, "the icon span must survive a relabel");
assert.strictEqual(clonedNeptunButton.textContent, undefined, "the root's own text must be left alone");

// a plain button (the fallback path) has no label span, so the text goes on the root
const plainButton = { querySelector: () => null, textContent: "" };
utils.setButtonLabel(plainButton, "Bezár");
assert.strictEqual(plainButton.textContent, "Bezár");

// Styles are injected at document-start, when <head> may not exist yet. Falling
// back to <html> keeps one early module from preventing every later module loading.
const previousDocument = global.document;
const mountedStyles = [];
global.document = {
  head: null,
  documentElement: { appendChild: style => mountedStyles.push(style) },
  createElement: () => ({ textContent: "" }),
};
const earlyStyle = utils.injectCss(".npu-test { display: block; }");
assert.strictEqual(mountedStyles[0], earlyStyle);
assert.strictEqual(earlyStyle.textContent, ".npu-test { display: block; }");
if (previousDocument === undefined) delete global.document;
else global.document = previousDocument;
