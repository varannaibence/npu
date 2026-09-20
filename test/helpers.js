// Just enough of a browser to prove the wrappers do what they claim. No framework.

// Stands in for the real XMLHttpRequest.
class FakeXHR {
  constructor() {
    this.responseType = "json";
    this._listeners = {};
  }

  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }

  open(method, url) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader() {}

  send() {
    this.response = { data: [{ id: 1, isFull: false }], notification: [] };
    (this._listeners.load || []).forEach(fn => fn());
  }
}

// A row whose only children are leaf nodes carrying text, which is all the
// code-matching helpers look at.
function fakeRow(leafTexts) {
  const leaves = leafTexts.map(text => ({ children: [], textContent: text }));
  return { querySelectorAll: () => leaves };
}

// Swaps in fake GM/location for a storage check and always puts the originals back.
async function withFakeGlobals(GM, location, body) {
  const previousGM = global.GM;
  const previousLocation = global.location;
  global.GM = GM;
  global.location = location;
  try {
    return await body();
  } finally {
    if (typeof previousGM === "undefined") {
      delete global.GM;
    } else {
      global.GM = previousGM;
    }
    if (typeof previousLocation === "undefined") {
      delete global.location;
    } else {
      global.location = previousLocation;
    }
  }
}

module.exports = { FakeXHR, fakeRow, withFakeGlobals };
