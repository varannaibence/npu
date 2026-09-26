// The run itself. Every network and timing effect arrives through `deps`, so the
// whole engine - including "Stop actually stops" - is testable with fakes.
const interceptor = require("../../interceptor");
const { collectCourses } = require("./plan");
const {
  classifyResponse,
  validateCourseList,
  chooseCombination,
  submissionOutcome,
  msUntilTarget,
} = require("./protocol");
const { liveGet, livePost, liveDelay } = require("./net");
const { MAX_ATTEMPTS } = require("./constants");

// --- The run engine. Every network and timing effect is injected via `deps`, so the
// whole thing - including "Stop actually stops" - is testable with fakes. ---

// One more read of the same course list right after a submission was answered, so
// the result can say "felvéve" or "várólistán" instead of only "beküldve". Stop is
// respected, since it means no further requests, and a failed or unreadable answer
// never halts the run: the outcome simply stays "submitted".
async function verifySubmission(subject, courseIds, deps) {
  const submitted = { kind: "submitted" };
  if (deps.controller.stopped) {
    return submitted;
  }
  let body;
  try {
    body = await deps.get(subject);
  } catch (e) {
    return submitted;
  }
  if (validateCourseList(body).kind !== "ok") {
    return submitted;
  }
  const courseIndex = collectCourses(body).get(subject.subjectId) || new Map();
  const kind = submissionOutcome(courseIndex, courseIds);
  return kind ? { kind } : submitted;
}

// Compose the best still-available combination, POST, classify, then either stop or
// retry the next-best up to MAX_ATTEMPTS. Never posts a subject with nothing ranked.
async function runSubject(subject, deps) {
  if (!subject.groups || subject.groups.length === 0) {
    return { kind: "unconfigured" };
  }
  const excluded = new Set();
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (deps.controller.stopped) {
      return { kind: "stopped" };
    }
    const coursesBody = await deps.get(subject);
    const catalog = validateCourseList(coursesBody);
    if (catalog.kind !== "ok") {
      return catalog;
    }
    const courseIndex = collectCourses(coursesBody).get(subject.subjectId) || new Map();
    const courseIds = chooseCombination(subject.groups, courseIndex, excluded);
    if (!courseIds) {
      return { kind: "exhausted" };
    }
    if (deps.controller.stopped) {
      return { kind: "stopped" };
    }
    const body = await deps.post(subject, courseIds);
    const result = classifyResponse(body);
    if (result.kind === "submitted") {
      return verifySubmission(subject, courseIds, deps);
    }
    if (result.kind === "requirement" || result.kind === "unknown" || result.kind === "notOpen") {
      return result;
    }
    // "full": next-ranked combination, if attempts remain (bounded).
    courseIds.forEach(id => excluded.add(id));
    if (attempt < MAX_ATTEMPTS - 1) {
      await deps.delay();
    }
  }
  return { kind: "full" };
}

// Walks the priority-ordered subject list. An "unknown" classification halts the
// ENTIRE run: ploughing on through a response nobody understands is worse than
// stopping and showing the text. Every other terminal state advances to the next
// subject. Stop is checked at every loop boundary, including inside runSubject.
async function runPlan(plan, deps) {
  const outcomes = [];
  for (const subject of plan.subjects) {
    if (deps.controller.stopped) {
      outcomes.push({ subject, kind: "stopped" });
      break;
    }
    deps.onEvent(subject, "running");
    const outcome = await runSubject(subject, deps);
    outcomes.push(Object.assign({ subject }, outcome));
    deps.onEvent(subject, outcome.kind, outcome.message);
    // Registration being shut is not about this subject, so there is no point
    // walking the rest of the queue into the same wall.
    if (outcome.kind === "unknown" || outcome.kind === "notOpen") {
      break;
    }
    if (deps.controller.stopped) {
      break;
    }
    await deps.delay(); // pace between subjects too (sequential, never parallel)
  }
  return outcomes;
}

function summarize(outcomes) {
  const count = kind => outcomes.filter(o => o.kind === kind).length;
  if (outcomes.some(o => o.kind === "notOpen")) {
    return "A tárgyjelentkezési időszak még nincs nyitva.";
  }
  const registered = count("registered");
  const waitlisted = count("waitlisted");
  const sent = count("submitted") + registered + waitlisted;
  const details = [registered ? `${registered} felvéve` : "", waitlisted ? `${waitlisted} várólistán` : ""].filter(
    Boolean
  );
  const sentText = `${sent}/${outcomes.length} tárgy beküldve${details.length ? `, ebből ${details.join(", ")}` : ""}`;
  const haltedByUnknown = outcomes.some(o => o.kind === "unknown");
  return haltedByUnknown
    ? `Leállt ismeretlen hiba miatt (${sentText}; ellenőrizd a Neptunban).`
    : `Kész: ${sentText}; ellenőrizd a Neptunban.`;
}

function createController() {
  const controller = { stopped: false, timer: null };
  controller.stop = function stop() {
    controller.stopped = true;
    if (controller.timer !== null) {
      clearTimeout(controller.timer);
      controller.timer = null;
    }
  };
  return controller;
}

// Schedules against the server-corrected clock. The last seconds are local timer
// checks only: a pre-flight GET here used to fire several duplicate requests before
// the run and added load without improving the server-side decision.
//
// Detecting the ACTUAL opening (an institution can open late) would need a measured
// closed-vs-open response shape, which we do not have. So this does only the safe
// half. The real safety net is downstream: every attempt is classified for real, so
// firing early or late fails safe rather than looping.
function scheduleRun(targetEpochMs, plan, controller, callbacks) {
  let finished = false;
  function finish(outcomes) {
    if (finished) {
      return;
    }
    finished = true;
    callbacks.onDone(outcomes);
  }

  function tick() {
    if (controller.stopped) {
      finish([]);
      return;
    }
    const wait = msUntilTarget(targetEpochMs, interceptor.getServerOffsetMs(), Date.now());
    callbacks.onTick(wait);
    if (wait <= 0) {
      begin();
      return;
    }
    const nextCheckIn = wait > 5000 ? 2000 : 1000;
    controller.timer = setTimeout(() => {
      controller.timer = null;
      tick();
    }, nextCheckIn);
  }
  function begin() {
    if (controller.stopped) {
      finish([]);
      return;
    }
    const deps = {
      get: liveGet,
      post: livePost,
      delay: liveDelay(plan.delaySeconds),
      onEvent: callbacks.onEvent,
      controller,
    };
    runPlan(plan, deps)
      .then(finish)
      .catch(error => {
        finish([
          {
            kind: "unknown",
            message: error && error.message ? error.message : "Ismeretlen futási hiba.",
          },
        ]);
      });
  }
  tick();
}

module.exports = { runSubject, runPlan, summarize, createController, scheduleRun };
