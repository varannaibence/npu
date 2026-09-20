// Pure timetable decisions shared by the Rajtoló and the subject-registration
// conflict hints. These functions know nothing about the DOM, storage or network.

const TIME_RE = /^(\d{1,2}):(\d{2})$/;

// "16:00" -> 960. Null for anything unparseable, so malformed server data cannot
// silently turn into a midnight class.
function toMinutes(hhmm) {
  const match = typeof hhmm === "string" && TIME_RE.exec(hhmm);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

// dayOfWeek is the language-neutral comparison key. dayOfWeekText is only a label;
// it is never used to decide whether two classes collide.
function normaliseSlot(info) {
  if (!info) {
    return null;
  }
  const day = info.dayOfWeek;
  const start = toMinutes(info.startTime);
  const end = toMinutes(info.endTime);
  if (typeof day !== "number" || start === null || end === null || end <= start) {
    return null;
  }
  return { day, start, end, rooms: info.rooms || "", dayLabel: info.dayOfWeekText || "" };
}

// Half-open intervals: a class ending at 18:00 and another beginning at 18:00 are
// back-to-back, not a conflict.
function slotsOverlap(a, b) {
  if (!a || !b || a.day === undefined || a.day === null || b.day === undefined || b.day === null) {
    return false;
  }
  if (typeof a.start !== "number" || typeof a.end !== "number") {
    return false;
  }
  if (typeof b.start !== "number" || typeof b.end !== "number") {
    return false;
  }
  return a.day === b.day && a.start < b.end && b.start < a.end;
}

// Every clashing pair among picks shaped as { course: { id, slots } }. A pair is
// reported once even if more than one of its slots overlaps.
function findPlanConflicts(picks) {
  const conflicts = [];
  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      const a = picks[i];
      const b = picks[j];
      if (!a || !b || !a.course || !b.course || a.course.id === b.course.id) {
        continue;
      }
      const slotsA = a.course.slots || [];
      const slotsB = b.course.slots || [];
      let hit = null;
      for (let x = 0; x < slotsA.length && !hit; x++) {
        for (let y = 0; y < slotsB.length && !hit; y++) {
          if (slotsOverlap(slotsA[x], slotsB[y])) {
            hit = { slotA: slotsA[x], slotB: slotsB[y] };
          }
        }
      }
      if (hit) {
        conflicts.push({ a, b, slotA: hit.slotA, slotB: hit.slotB });
      }
    }
  }
  return conflicts;
}

module.exports = { toMinutes, normaliseSlot, slotsOverlap, findPlanConflicts };
