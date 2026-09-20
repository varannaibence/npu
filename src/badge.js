// Neptun's own badge component, reused rather than imitated.
//
// The classes are `_nghost-*` scoped and that hash changes every build, so naming
// them styles nothing - a live badge has to be cloned. The modifier can then be
// swapped on the clone, because the scoping attribute travels with it.
const BADGE_BASE_CLASS = "neptun-badge";

// Measured variants. The traffic-light reading is the point: green nothing gone,
// amber going, red gone.
const VARIANT_CLASS = {
  free: "neptun-badge--secondary", // #213055 on #00dea4
  partial: "neptun-badge--warning", // #222 on #f2994a
  full: "neptun-badge--error", // #fff on #a62c2c
  neutral: "neptun-badge--background-elements", // #222 on #f2f3fb
};
const ALL_VARIANT_CLASSES = Object.keys(VARIANT_CLASS).map(key => VARIANT_CLASS[key]);

// Any badge on the page that is not one of ours - ours all carry a data-npu-* flag.
function reference() {
  return document.querySelector(
    "neptun-badge:not([data-npu-occupancy]):not([data-npu-subject-occupancy]):not([data-npu-conflict]):" +
      "not([data-npu-seats]):not([data-npu-row-conflict]):not([data-npu-enrolled]):not([data-npu-count])"
  );
}

// For a page with no badge to clone. Built from the measured palette, not invented
// colours - a plausible badge, not a real one.
function fallback(variant) {
  const badge = document.createElement("span");
  const skins = {
    free: "background:#00dea4;color:#213055;",
    partial: "background:#f2994a;color:#222;",
    full: "background:#a62c2c;color:#fff;",
    neutral: "background:#f2f3fb;color:#222;",
  };
  badge.style.cssText = `display:inline-flex;align-items:center;height:24px;border-radius:25px;padding:2px 8px 0;font-size:13px;font-weight:700;line-height:1;white-space:nowrap;${skins[variant] || skins.neutral}`;
  return badge;
}

function build(variant) {
  const source = reference();
  if (!source) {
    return fallback(variant);
  }
  const badge = source.cloneNode(false);
  badge.removeAttribute("id");
  // Keep only the component's own class: the rest is host-page layout.
  badge.className = BADGE_BASE_CLASS;
  return badge;
}

// Creates the badge on first sight and removes it when there is nothing to say.
// Every write is guarded by an equality check: this runs from a MutationObserver, and
// an unconditional write is itself a mutation.
function paint(host, anchor, flag, label, variant, title) {
  let badge = host.querySelector(`[${flag}]`);
  if (!label || !variant || !anchor) {
    if (badge) {
      badge.remove();
    }
    return;
  }
  if (!badge) {
    badge = build(variant);
    badge.setAttribute(flag, "");
    badge.style.width = "fit-content";
    badge.style.maxWidth = "100%";
    badge.style.overflow = "hidden";
    badge.style.textOverflow = "ellipsis";
    badge.style.flex = "0 0 auto";
    badge.style.whiteSpace = "nowrap";
    anchor.appendChild(badge);
  }
  const wanted = VARIANT_CLASS[variant];
  if (!badge.classList.contains(wanted)) {
    ALL_VARIANT_CLASSES.forEach(name => badge.classList.remove(name));
    badge.classList.add(wanted);
  }
  if (badge.textContent !== label) {
    badge.textContent = label;
  }
  if (badge.title !== (title || "")) {
    badge.title = title || "";
  }
}

module.exports = { build, paint, VARIANT_CLASS };
