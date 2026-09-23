const assert = require("assert");
const { slotsFromNote, setNoteSlotsEnabled, courseSlots } = require("../src/timetable");

// The note from the GitHub discussion that asked for this.
assert.deepStrictEqual(slotsFromNote("Hétfő 14-15, A1/216"), [
  { day: 1, start: 840, end: 900, rooms: "A1/216", dayLabel: "Hétfő", fromNote: true },
]);

const two = slotsFromNote("kedden 8:15–9.45; Csütörtök 10-12, B2 előadó");
assert.deepStrictEqual(
  two.map(slot => [slot.day, slot.start, slot.end, slot.rooms]),
  [
    [2, 495, 585, ""],
    [4, 600, 720, "B2 előadó"],
  ]
);

// The next day after a comma is not a room.
assert.strictEqual(slotsFromNote("Hétfő 14-15, Kedd 10-12")[0].rooms, "");
assert.strictEqual(slotsFromNote("Hétfő 14-15, Kedd 10-12").length, 2);

// Week ranges, non-times and empty notes stay empty.
assert.deepStrictEqual(slotsFromNote("Szerda 3-5. héten"), []);
assert.deepStrictEqual(slotsFromNote("Péntek 15-14"), []);
assert.deepStrictEqual(slotsFromNote("Konzultáció egyeztetés szerint"), []);
assert.deepStrictEqual(slotsFromNote(null), []);

// Off by default: the settings switch has to turn it on.
assert.deepStrictEqual(courseSlots({ note: "Hétfő 14-15" }), []);
setNoteSlotsEnabled(true);

// Neptun's own schedule wins; the note is only a fallback.
const info = { dayOfWeek: 3, startTime: "10:00", endTime: "12:00", rooms: "X" };
assert.strictEqual(courseSlots({ classInstanceInfos: [info], note: "Hétfő 14-15" })[0].day, 3);
assert.strictEqual(courseSlots({ classInstanceInfos: [], note: "Hétfő 14-15" })[0].fromNote, true);
assert.strictEqual(courseSlots({ note: "Hétfő 14-15" }, [info])[0].day, 3);
setNoteSlotsEnabled(false);
