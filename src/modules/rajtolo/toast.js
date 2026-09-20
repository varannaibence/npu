// Our own toast stack, in the same corner as the app's push notifications.
const tokens = require("../../neptunTokens");
const utils = require("../../utils");

const TOAST_ID = "npu-toast-stack";
const TOAST_MS = 4000;

const TOAST_TOP = 88;

const TOAST_GAP = 12;
const TOAST_RIGHT = 20;
let toastCssInjected = false;

function injectToastCss() {
  if (toastCssInjected) {
    return;
  }
  toastCssInjected = true;
  utils.injectCss(`[data-npu-toast-close]:focus-visible{outline:2px solid ${tokens.focus};outline-offset:2px;}`);
}

// Both stacks land in the same corner, and the row switch fires one of each at the
// same moment. Ours slides left to sit beside theirs, and only drops below when there
// is no room. Re-measured while showing, since theirs can appear after ours.
function positionStack(stack) {
  const native = document.querySelector(".push-notifications-wrapper .push-notifications");
  const rect = native && native.getBoundingClientRect();
  if (!rect || rect.height === 0) {
    stack.style.right = `${TOAST_RIGHT}px`;
    stack.style.top = `${TOAST_TOP}px`;
    return;
  }
  const beside = rect.width + TOAST_RIGHT + TOAST_GAP;
  const ourWidth = stack.getBoundingClientRect().width || 300;
  if (beside + ourWidth + TOAST_GAP <= window.innerWidth) {
    stack.style.right = `${beside}px`;
    stack.style.top = `${TOAST_TOP}px`;
  } else {
    // too narrow to sit side by side - go under it rather than over it
    stack.style.right = `${TOAST_RIGHT}px`;
    stack.style.top = `${rect.bottom + TOAST_GAP}px`;
  }
}

function toastStack() {
  let stack = document.getElementById(TOAST_ID);
  if (!stack) {
    stack = document.createElement("div");
    stack.id = TOAST_ID;
    stack.style.cssText =
      "position:fixed;right:20px;z-index:10002;display:flex;flex-direction:column;" +
      "gap:10px;align-items:flex-end;pointer-events:none;font-family:inherit";
    document.body.appendChild(stack);
    // A reposition loop rather than observing a component we do not control.
    // Runs only while something is showing. It used to tick forever, for the whole
    // life of the page, long after the last toast had gone.
    stack.__npuTimer = null;
  }
  if (!stack.__npuTimer) {
    stack.__npuTimer = setInterval(() => {
      if (stack.children.length === 0) {
        clearInterval(stack.__npuTimer);
        stack.__npuTimer = null;
        return;
      }
      positionStack(stack);
    }, 500);
  }
  positionStack(stack);
  return stack;
}

// Three tones, not two: a waiting-list placement is neither a win nor a failure, and
// a green tick beside it would read as a seat.
const TOAST_TONES = {
  ok: { mark: "✓", color: "#1a9e5c" },
  warn: { mark: "≈", color: "#f2994a" },
  error: { mark: "!", color: "#c0392b" },
};

function showToast(text, tone) {
  injectToastCss();
  const card = document.createElement("div");
  card.setAttribute("role", tone === "error" ? "alert" : "status");
  card.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  card.style.cssText =
    "pointer-events:auto;width:min(380px,calc(100vw - 40px));box-sizing:border-box;border-radius:8px;" +
    `box-shadow:0 8px 24px rgba(0,0,0,.16);background:${tokens.surface};color:${tokens.text};font-size:14px;` +
    "border:1px solid rgba(33,48,85,.14);" +
    `border:1px solid color-mix(in srgb, ${tokens.text} 14%, transparent)`;

  const body = document.createElement("div");
  body.style.cssText = "display:flex;gap:10px;align-items:flex-start;padding:12px 14px";
  const mark = document.createElement("span");
  const skin = TOAST_TONES[tone] || TOAST_TONES.error;
  mark.textContent = skin.mark;
  mark.style.cssText = `font-weight:900;color:${skin.color}`;
  const msg = document.createElement("span");
  msg.style.cssText = "min-width:0;overflow-wrap:anywhere;";
  msg.textContent = text;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "✕";
  close.setAttribute("aria-label", "Bezárás");
  close.setAttribute("data-npu-toast-close", "");
  close.style.cssText =
    "margin-left:auto;width:32px;height:32px;display:flex;flex:0 0 32px;align-items:center;justify-content:center;" +
    "border:0;background:none;cursor:pointer;color:inherit;font-size:16px;line-height:1;padding:0";
  close.addEventListener("click", () => card.remove());
  body.appendChild(mark);
  body.appendChild(msg);
  body.appendChild(close);
  card.appendChild(body);
  toastStack().appendChild(card);
  setTimeout(() => card.remove(), TOAST_MS);
}

module.exports = { showToast };
