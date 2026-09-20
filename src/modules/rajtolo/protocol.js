// What the server's answers mean, and which combination to send next. Pure.
const { STATUS_KEY, RANKING_NOTE } = require("./constants");

// The only rejection text ever measured.
const REQUIREMENT_MESSAGE = "Végső tárgykövetelmény nem teljesült";

// What the server says when registration is not open. Matched on a fragment so
// punctuation changes do not break it.
const NOT_OPEN_HINT = "nincs tárgyjelentkezési időszak";

// Only the measured response envelope is accepted. SubjectSignin's successful
// business payload is not measured yet, so an empty notification array means only
// "the request was answered without a known business error"; the UI must still ask
// the user to verify the result in Neptun.
function classifyResponse(body) {
  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray(body.notification) ||
    !Object.prototype.hasOwnProperty.call(body, "data")
  ) {
    return {
      kind: "unknown",
      message: "Érvénytelen vagy ismeretlen szerverválasz.",
    };
  }
  const errors = body.notification.filter(n => n && n.type === 3);
  const status = body && body[STATUS_KEY];
  if (errors.length === 0) {
    if (typeof status === "number" && status !== 0 && (status < 200 || status > 299)) {
      return {
        kind: "unknown",
        message: `Ismeretlen szerverválasz (HTTP ${status}).`,
      };
    }
    if (body.notification.length > 0) {
      return {
        kind: "unknown",
        message: "Ismeretlen szerverértesítés.",
      };
    }
    return { kind: "submitted" };
  }
  const message = errors[0].description || "";
  const lowered = message.toLowerCase();
  if (lowered.indexOf(NOT_OPEN_HINT) !== -1) {
    return { kind: "notOpen", message };
  }
  if (message === REQUIREMENT_MESSAGE) {
    return { kind: "requirement", message };
  }
  return { kind: "unknown", message };
}

function validateCourseList(body) {
  const result = classifyResponse(body);
  if (result.kind !== "submitted") {
    return result;
  }
  if (!Array.isArray(body.data)) {
    return {
      kind: "unknown",
      message: "Érvénytelen kurzuslista érkezett.",
    };
  }
  return { kind: "ok" };
}

// One courseId per group, highest-ranked first, skipping anything full or already
function chooseCombination(groups, courseIndex, excluded) {
  const courseIds = [];
  for (const group of groups) {
    const pick = group.ranking.find(id => {
      if (excluded.has(id)) {
        return false;
      }
      const course = courseIndex.get(id);
      return Boolean(course) && course.isFull === false && course.isSigned !== true && course.isOnWaitingList !== true;
    });
    if (!pick) {
      return null;
    }
    courseIds.push(pick);
  }
  return courseIds;
}

// How many local ms remain until the local clock reaches the point the server clock
// would read `targetEpochMs`. Falls back to offset 0 before any response has told us.
function msUntilTarget(targetEpochMs, serverOffsetMs, nowMs) {
  const offset = typeof serverOffsetMs === "number" ? serverOffsetMs : 0;
  return targetEpochMs - offset - nowMs;
}

function formatCountdown(ms) {
  if (ms <= 0) {
    return "indul…";
  }
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours) {
    parts.push(`${hours}ó`);
  }
  if (hours || minutes) {
    parts.push(`${minutes}p`);
  }
  parts.push(`${seconds}mp`);
  return parts.join(" ");
}

const STATUS_LABELS = {
  idle: () => "Vár",
  running: () => "Folyamatban…",
  submitted: () => "Beküldve — ellenőrizd a Neptunban",
  requirement: () => "Követelmény nem teljesült",
  full: () => "Betelt (a próbálkozások kimerültek)",
  exhausted: () => "Nincs elérhető kurzus",
  unconfigured: () => "Nincs rangsorolva kurzus ehhez a tárgyhoz — kihagyva",
  notOpen: () => "Még nincs tárgyjelentkezési időszak",
  unknown: () => "Ismeretlen hiba — a teljes futás leállt",
  stopped: () => "Leállítva",
};

// Which tone a run outcome deserves. "waitlisted" is deliberately its own tone.
function toastTone(kind) {
  return kind === "submitted" ? "warn" : "error";
}

function statusLabel(kind, message) {
  const known = STATUS_LABELS[kind];
  const label = known ? known() : kind;
  return message ? `${label}: ${message}` : label;
}

function courseLabel(course) {
  return `${course.code || "Kurzusadat betöltése…"}${course.isRankingCourse ? RANKING_NOTE() : ""}`;
}

module.exports = {
  classifyResponse,
  validateCourseList,
  chooseCombination,
  msUntilTarget,
  formatCountdown,
  statusLabel,
  courseLabel,
  toastTone,
  REQUIREMENT_MESSAGE,
  NOT_OPEN_HINT,
};
