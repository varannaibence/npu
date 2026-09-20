// The small set of Neptun CSS custom properties measured on the live NG shell.
// Keep these as CSS values, not resolved colours: the host theme must still win.
// The fallback is only for document-start or a host layout that omits a token.
const tokens = Object.freeze({
  text: "var(--mat-menu-item-label-text-color,#213055)",
  surface: "var(--mdc-dialog-container-color,#fff)",
  subtleSurface: "var(--mat-option-hover-state-layer-color,#f2f3fb)",
  primary: "var(--mdc-radio-selected-icon-color,#0943d9)",
  focus: "var(--mdc-outlined-text-field-focus-outline-color,#0943d9)",
});

module.exports = tokens;
