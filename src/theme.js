// The user's accent colour in place of Neptun's blue.
//
// Neptun has two brand colours, measured on the live NG shell: the primary blue
// (#0943d9, behind ~90 Material custom properties and ~40 fixed rules) and the navy
// of the header, menu button and footer (#213055, ~80 fixed rules). Neither is a
// single variable, so overriding one property would recolour only half the page.
//
// Instead every same-origin stylesheet is read once, and each declaration that
// mentions either colour becomes a template. The chosen colour is then rendered into
// one <style> of ours, re-emitting those declarations under their original selector
// and @media condition. Equal specificity, later in the document: ours wins, without
// !important, so Neptun's own :hover/:disabled rules keep their precedence order.
// Angular adds component styles as the user navigates, so new sheets are read as
// they arrive and our element is kept last.
//
// Neptun's blue-tinted surfaces and accents (hover layers, the dashboard band, the
// user button, link blue) follow too: each keeps its own saturation and lightness
// relative to the primary blue, only the hue becomes the chosen one.

const NEPTUN_PRIMARY = "#0943d9";
const NEPTUN_NAVY = "#213055";
const STYLE_ID = "npu-theme";

// Chosen to keep white text readable on them (all >= 5:1).
const PRESETS = Object.freeze([
  { name: "Neptun kék", color: NEPTUN_PRIMARY },
  { name: "Smaragd", color: "#0f7a55" },
  { name: "Türkiz", color: "#08788a" },
  { name: "Lila", color: "#6a3bd1" },
  { name: "Málna", color: "#c2185b" },
  { name: "Bordó", color: "#a3244a" },
  { name: "Narancs", color: "#b5500a" },
  { name: "Grafit", color: "#3d4450" },
]);

function hexToRgb(hex) {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
  return `#${rgb
    .map(v =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function rgbToHsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return [0, 0, l];
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb([h, s, l]) {
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

// Measured on the live NG shell, ordered by use: surfaces, hover layers, outline
// and link blue. All are tints of the primary blue.
const TINTS = ["#f2f3fb", "#f8f9ff", "#dce3f0", "#4d94ff", "#c6cafc", "#e8e9f6"];

// `source` relates to Neptun's blue as the result relates to `hex`: same lightness,
// saturation scaled by the same ratio, the chosen hue.
function shadeLike(hex, source) {
  const [h, s] = rgbToHsl(hexToRgb(hex));
  const [, sourceS, sourceL] = rgbToHsl(hexToRgb(source));
  const [, primaryS] = rgbToHsl(hexToRgb(NEPTUN_PRIMARY));
  return rgbToHex(hslToRgb([h, Math.min(1, s * (sourceS / primaryS)), sourceL]));
}

// Neptun's navy is its blue at about half the saturation and 23% lightness. The same
// relation applied to the chosen colour keeps header and footer in the family.
function darkShade(hex) {
  return shadeLike(hex, NEPTUN_NAVY);
}

// The header's message counter is Neptun's mint badge (#00dea4 behind navy text).
// Mint also means "free" on course badges, so it is not mapped globally; only this
// badge gets a light shade of the chosen hue, which keeps the navy text readable.
// The same counter repeats in the user menu's "Üzenetek" item.
const COUNTER_SELECTOR = [
  ".neptun-badge.neptun-badge--secondary.user-menu__badge",
  ".mat-mdc-menu-item .neptun-badge.neptun-badge--secondary",
].join(",");

function lightShade(hex) {
  const [h, s] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, s, 0.72]));
}

// Both spellings the CSSOM can hand back: hex as authored (custom properties keep
// their text) and rgb()/rgba() as serialised for ordinary properties.
function colourPattern(hex) {
  const [r, g, b] = hexToRgb(hex);
  return new RegExp(`${hex}\\b|rgba?\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*(,\\s*[\\d.]+%?\\s*)?\\)`, "gi");
}

const SOURCES = [NEPTUN_PRIMARY, NEPTUN_NAVY, ...TINTS].map(hex => ({ hex, pattern: colourPattern(hex) }));

function mentionsSource(value) {
  return SOURCES.some(source => {
    source.pattern.lastIndex = 0;
    return source.pattern.test(value);
  });
}

function recolour(value, palette) {
  return SOURCES.reduce(
    (text, source) =>
      text.replace(source.pattern, (match, alpha) => {
        const target = palette[source.hex];
        if (!alpha) {
          return match.startsWith("#") ? target : `rgb(${hexToRgb(target).join(", ")})`;
        }
        return `rgba(${hexToRgb(target).join(", ")}${alpha})`;
      }),
    value
  );
}

// Templates from one CSSRuleList: [{ wrap: ["@media x"], selector, decls: [[prop, value, priority]] }].
// Grouping rules are followed; keyframes and anything unreadable are skipped.
function collectTemplates(rules, wrap = [], into = []) {
  Array.from(rules || []).forEach(rule => {
    if (rule.style && rule.selectorText) {
      const decls = [];
      Array.from(rule.style).forEach(prop => {
        const value = rule.style.getPropertyValue(prop);
        if (mentionsSource(value)) {
          decls.push([prop, value.trim(), rule.style.getPropertyPriority(prop)]);
        }
      });
      if (decls.length > 0) {
        into.push({ wrap, selector: rule.selectorText, decls });
      }
      return;
    }
    if (rule.cssRules && rule.conditionText !== undefined) {
      const at = rule.constructor && /Supports/.test(rule.constructor.name) ? "@supports" : "@media";
      collectTemplates(rule.cssRules, wrap.concat(`${at} ${rule.conditionText}`), into);
    }
  });
  return into;
}

// Source colour -> its replacement for the chosen colour.
function paletteFor(colour) {
  return Object.fromEntries(SOURCES.map(({ hex }) => [hex, hex === NEPTUN_PRIMARY ? colour : shadeLike(colour, hex)]));
}

function renderCss(templates, colour) {
  const palette = paletteFor(colour);
  const rules = templates.map(template => {
    const body = template.decls
      .map(([prop, value, priority]) => `${prop}:${recolour(value, palette)}${priority ? " !important" : ""}`)
      .join(";");
    return template.wrap.reduceRight((inner, at) => `${at}{${inner}}`, `${template.selector}{${body}}`);
  });
  return rules.concat(`${COUNTER_SELECTOR}{background-color:${lightShade(colour)}}`).join("\n");
}

// --- DOM side -------------------------------------------------------------------

const sheetTemplates = new Map();
let current = null;
let styleElement = null;
let observer = null;

function readSheet(sheet) {
  if (!sheet || sheetTemplates.has(sheet) || (sheet.ownerNode && sheet.ownerNode.id === STYLE_ID)) {
    return;
  }
  try {
    sheetTemplates.set(sheet, collectTemplates(sheet.cssRules));
  } catch (e) {
    // Cross-origin or not yet loaded: nothing of Neptun's we could recolour.
  }
}

function paint() {
  if (!current) {
    if (styleElement) {
      styleElement.remove();
    }
    return;
  }
  Array.from(document.styleSheets).forEach(readSheet);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = STYLE_ID;
  }
  const templates = [].concat(...sheetTemplates.values());
  const css = renderCss(templates, current);
  if (styleElement.textContent !== css) {
    styleElement.textContent = css;
  }
  const parent = document.head || document.documentElement;
  if (parent.lastElementChild !== styleElement) {
    parent.appendChild(styleElement);
  }
}

function watch() {
  if (observer) {
    return;
  }
  let scheduled = false;
  const schedule = () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      paint();
    });
  };
  observer = new MutationObserver(mutations => {
    const added = mutations.some(mutation =>
      Array.from(mutation.addedNodes).some(node => node !== styleElement && /^(STYLE|LINK)$/.test(node.nodeName))
    );
    if (added) {
      schedule();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  // A <link> is readable only once loaded.
  document.addEventListener("load", event => event.target && event.target.nodeName === "LINK" && schedule(), true);
  document.addEventListener("DOMContentLoaded", schedule);
}

// null restores Neptun's own colours. Also used for the settings panel's live preview.
function apply(colour) {
  current = colour && colour.toLowerCase() !== NEPTUN_PRIMARY ? colour.toLowerCase() : null;
  if (current) {
    watch();
  }
  paint();
}

module.exports = {
  NEPTUN_PRIMARY,
  PRESETS,
  darkShade,
  lightShade,
  paletteFor,
  recolour,
  collectTemplates,
  renderCss,
  apply,
};
