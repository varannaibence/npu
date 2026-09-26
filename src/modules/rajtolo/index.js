// "Rajtoló" - scheduled automatic course registration. The user ranks subjects and,
// within each, the acceptable courses per group; at the set moment the script walks
// the list and fires SubjectSignin POSTs itself.
//
// Four hazards drive every non-obvious choice here: the clock, the session, pace, and
// ranking-only courses. Nothing fires without an explicit button press.
//
// This file holds only the wiring: the shared state, the interceptor handlers that
// feed it, and mounting. The parts live next door -
//   plan.js      the plan's data and every pure transformation of it
//   protocol.js  what the server's answers mean, which combination to send next
//   engine.js    the run itself, with its effects injected
//   net.js       this module's own authenticated calls
//   ui.js        the planner dialog
//   rows.js      the switch and badge added to the page
const interceptor = require("../../interceptor");
const router = require("../../router");
const storage = require("../../storage");
const utils = require("../../utils");
const { ROUTE, FILTER_BUTTON_ID, LAUNCHER_ID, PLANNER_ID } = require("./constants");
const { SUBJECTS_ENDPOINT, COURSES_ENDPOINT, CREDITS_ENDPOINT } = require("./constants");
const plan = require("./plan");
const protocol = require("./protocol");
const engine = require("./engine");
const ui = require("./ui");
const rows = require("./rows");
const { showToast } = require("../../toast");
const registrationData = require("../../registrationData");

const { collectSubjects, collectCourses, registeredCredits, emptyPlan, loadPlan } = plan;
const { statusLabel, toastTone, msUntilTarget, wallClockToEpoch, formatCountdown } = protocol;
const { createController, scheduleRun, summarize } = engine;
const { render, openPlanner, buildLauncher, loadPeriods, loadPlannedCourses, selectedPeriod, dialogQuery } = ui;
const { decorateCourseRows, decorateSubjectRows, rememberSubjectFromUrl } = rows;

// Shown in the settings panel; `id` is also the key the switch is stored under.
const meta = {
  id: "rajtolo",
  name: "Rajtoló",
  description: "Ütemezett tárgyfelvétel: saját tárgy- és kurzussorrend, amit a megadott időpontban sorban beküld.",
  // Only the credit forecast needs this; the run itself does not.
  needs: [
    {
      capability: "scheduledSubjects",
      to: "a kredit-előrejelzéshez",
    },
  ],
};

function shouldActivate() {
  return true;
}

function subjectStatusElement(state, subjectId) {
  if (!state.dialog) {
    return null;
  }
  return Array.from(state.dialog.content.querySelectorAll("[data-npu-subject-status]")).find(
    element => element.getAttribute("data-npu-subject-status") === subjectId
  );
}

// Two lifetimes, hence two functions.
//
// The state, its handlers and its observer must exist exactly ONCE per page load:
// registering them twice gives two independent states, each repainting the row switch
// from its own copy of the plan - the switch flickered dozens of times per click.
//
// The launcher BUTTON has the opposite lifetime: Angular owns the toolbar and throws
// it away on every route change, so it must be re-insertable. Sharing one latch meant
// the button was gone after navigating away and back, until a full reload.
let plannerState = null;

function ensureState() {
  if (plannerState) {
    return plannerState;
  }
  const created = {
    // Null while the dialog is closed. A run keeps going either way, so everything
    // that paints checks this first.
    dialog: null,
    plan: emptyPlan(null),
    subjectCatalog: new Map(),
    courseCatalog: new Map(),
    courseLoads: new Set(),
    courseLoadErrors: new Set(),
    courseLoadQueue: null,
    subjectStatus: new Map(),
    running: false,
    statusText: "",
    controller: null,
    // Kept off `plan` on purpose, so it never round-trips through storage: in-memory
    // only, refetched next time the planner opens.
    periods: null,
    periodsTermId: null,
    periodsLoadingTermId: null,
    periodsStatus: "idle",
    periodsError: null,
    periodsErrorReason: null,
    selectedPeriodId: null,
    catalogTermId: null,
    planLoadedForIdentity: null,
    courseCatalogGeneration: 0,
    authAtStart: null,
    // Null until a response has been seen; this module never issues that request
    // itself, only rides creditBreakdown's.
    registeredCredits: null,
    onStartStop: () => onStartStop(plannerState),
  };
  // Claimed before a single handler is registered: a second ensureState() must find
  // it already set.
  plannerState = created;

  function resetForTerm(state, termId) {
    if (state.running && state.controller) {
      state.controller.stop();
      state.statusText = "Leállítás folyamatban…";
    }
    state.catalogTermId = termId || null;
    state.courseCatalogGeneration++;
    state.plan = emptyPlan(termId);
    state.planLoadedForIdentity = null;
    state.subjectCatalog = new Map();
    state.courseCatalog = new Map();
    state.courseLoads.clear();
    state.courseLoadErrors.clear();
    state.subjectStatus = new Map();
    state.periods = null;
    state.periodsTermId = null;
    state.periodsLoadingTermId = null;
    state.periodsStatus = "idle";
    state.periodsError = null;
    state.periodsErrorReason = null;
    state.selectedPeriodId = null;
  }

  function adoptStoredPlan(state, termId) {
    const identity = utils.getNeptunCode();
    if (!termId || !identity || state.plan.subjects.length > 0 || state.planLoadedForIdentity === identity) {
      return;
    }
    storage
      .initialize()
      .then(() => {
        if (
          utils.getNeptunCode() !== identity ||
          state.plan.subjects.length > 0 ||
          state.planLoadedForIdentity === identity
        ) {
          return;
        }
        state.plan = loadPlan(termId);
        state.planLoadedForIdentity = identity;
        render(state);
        if (state.dialog) {
          loadPlannedCourses(state);
        }
      })
      .catch(() => {
        // No persisted plan is safer than guessing that storage is ready.
      });
  }

  utils.onNeptunCodeChange((code, previous) => {
    if (!plannerState) {
      return;
    }
    if (!code || (previous && previous !== code)) {
      resetForTerm(plannerState, null);
      plannerState.statusText = code
        ? "Új felhasználó érzékelve; a terv újratöltése folyamatban."
        : "A munkamenet lejárt; a terv törölve a memóriából.";
    } else if (code) {
      // Initial identity capture can race the subject response. Keep that page's
      // catalogue, but never carry a pre-identity plan into the identified user.
      plannerState.plan = emptyPlan(plannerState.catalogTermId);
      plannerState.planLoadedForIdentity = null;
      const first = plannerState.subjectCatalog.values().next().value;
      adoptStoredPlan(plannerState, (first && first.termId) || plannerState.catalogTermId);
    }
    render(plannerState);
  });

  interceptor.onResponse(CREDITS_ENDPOINT, (json, info) => {
    if (!registrationData.isSuccessfulCollection(json, info && info.status)) {
      return;
    }
    plannerState.registeredCredits = registeredCredits(json);
    render(plannerState);
  });
  interceptor.onResponse(SUBJECTS_ENDPOINT, (json, info) => {
    if (!registrationData.isSuccessfulCollection(json, info && info.status)) {
      return;
    }
    const incoming = Array.isArray(json && json.data)
      ? json.data.find(row => row && typeof row.termId === "string" && row.termId)
      : null;
    if (incoming && plannerState.catalogTermId && plannerState.catalogTermId !== incoming.termId) {
      resetForTerm(plannerState, incoming.termId);
    } else if (incoming && !plannerState.catalogTermId) {
      plannerState.catalogTermId = incoming.termId;
    }
    plannerState.subjectCatalog = collectSubjects(json, plannerState.subjectCatalog);
    const first = plannerState.subjectCatalog.values().next().value;
    // Only adopt the stored plan while ours is untouched: a later refresh - the
    // course checkbox triggers one - would overwrite what the user just picked.
    if (first && plannerState.plan.subjects.length === 0) {
      adoptStoredPlan(plannerState, first.termId);
    }
    render(plannerState);
    if (plannerState.dialog) {
      loadPlannedCourses(plannerState);
    }
  });
  interceptor.onAuthChange(auth => {
    if (plannerState.running && auth !== plannerState.authAtStart) {
      if (plannerState.controller) {
        plannerState.controller.stop();
      }
      plannerState.statusText = auth
        ? "Új munkamenet érzékelve; a futás leállt."
        : "A munkamenet lejárt; a futás leállt.";
      render(plannerState);
    }
    if (auth && plannerState.dialog) {
      if (plannerState.periodsErrorReason === "auth-required") {
        loadPeriods(plannerState, true);
      }
      if (plannerState.courseLoadErrors.size > 0) {
        loadPlannedCourses(plannerState, true);
      }
    }
  });
  interceptor.onResponse(COURSES_ENDPOINT, (json, info) => {
    if (!registrationData.isSuccessfulCollection(json, info && info.status)) {
      return;
    }
    const incoming = Array.isArray(json && json.data)
      ? json.data.find(row => row && typeof row.termId === "string" && row.termId)
      : null;
    if (incoming && plannerState.catalogTermId && plannerState.catalogTermId !== incoming.termId) {
      resetForTerm(plannerState, incoming.termId);
    } else if (incoming && !plannerState.catalogTermId) {
      plannerState.catalogTermId = incoming.termId;
    }
    plannerState.courseCatalog = collectCourses(json, plannerState.courseCatalog);
    // The URL carries all four ids SubjectSignin needs, so the row switch does not
    // depend on the subject also being in the SchedulableSubjects catalogue.
    rememberSubjectFromUrl(plannerState, info && info.url);
    decorateCourseRows(plannerState);
    decorateSubjectRows(plannerState);
    render(plannerState);
  });

  // Rows are re-rendered as subjects expand and collapse, so the switches have to be
  // re-attached on any DOM change. decorateCourseRows is a no-op once a row carries
  // one, which keeps this from retriggering itself.
  let pending = false;
  new MutationObserver(() => {
    if (pending) {
      return;
    }
    pending = true;
    setTimeout(() => {
      pending = false;
      if (location.pathname === ROUTE) {
        decorateCourseRows(plannerState);
        decorateSubjectRows(plannerState);
      }
    }, 0);
  }).observe(document.documentElement, { childList: true, subtree: true });

  return plannerState;
}

// Re-inserted whenever Angular gives us a toolbar. Idempotent, so the observer can
// call it on every DOM change.
function mount() {
  const filterButton = document.getElementById(FILTER_BUTTON_ID);
  if (!filterButton || !filterButton.parentElement || document.getElementById(LAUNCHER_ID)) {
    return;
  }
  try {
    ensureState();
    const launcher = buildLauncher(filterButton);
    launcher.addEventListener("click", () => {
      if (plannerState.dialog) {
        plannerState.dialog.close();
        return;
      }
      openPlanner(plannerState);
    });
    // Keep the add-on action beside the native search action. Appending after it
    // makes both custom controls wrap into a second, visually detached toolbar row.
    filterButton.parentElement.insertBefore(launcher, filterButton);

    render(plannerState);
  } catch (e) {
    // fail quietly: no launcher, never a throw inside Angular's rendering.
  }
}

function onStartStop(state) {
  if (state.running) {
    // The non-negotiable safety rail: a visible Stop that actually stops. It
    // prevents anything further from being scheduled - an attempt already in
    // flight has already reached the server and can't be un-sent, only its
    // *next* step is what Stop actually cancels.
    if (state.controller) {
      state.controller.stop();
    }
    state.statusText = "Leállítás folyamatban…";
    render(state);
    return;
  }
  if (!interceptor.getAuthHeader()) {
    state.statusText = "Nincs érzékelt bejelentkezés - jelentkezz be, majd nyisd meg újra ezt az oldalt.";
    render(state);
    return;
  }
  if (state.plan.subjects.length === 0) {
    state.statusText = "Adj hozzá legalább egy tárgyat a listához.";
    render(state);
    return;
  }
  const target = wallClockToEpoch(state.plan.startAt);
  if (Number.isNaN(target)) {
    state.statusText = "Adj meg egy érvényes nyitási időpontot.";
    render(state);
    return;
  }
  // An already-past closing time makes the run pointless. A closed-period response
  // is intentionally classified as unknown until its exact shape is measured, so
  // report the clear local fact before making any request.
  const period = selectedPeriod(state);
  const closeTarget = period ? wallClockToEpoch(period.toDate) : NaN;
  if (!Number.isNaN(closeTarget) && msUntilTarget(closeTarget, interceptor.getServerOffsetMs(), Date.now()) <= 0) {
    state.statusText = "A kiválasztott tárgyjelentkezési időszak már lezárult.";
    render(state);
    return;
  }
  state.controller = createController();
  state.authAtStart = interceptor.getAuthHeader();
  state.running = true;
  state.statusText = "Ütemezve…";
  state.subjectStatus = new Map();
  render(state);

  scheduleRun(target, state.plan, state.controller, {
    onTick: wait => {
      const statusLine = dialogQuery(state, `#${PLANNER_ID}-status`);
      if (statusLine) {
        statusLine.textContent = `Indulásig: ${formatCountdown(wait)}`;
      }
    },
    onEvent: (subject, kind, message) => {
      state.subjectStatus.set(subject.subjectId, kind);
      if (kind !== "running") {
        showToast(`${subject.title || "Ismeretlen tárgy"}: ${statusLabel(kind, message)}`, toastTone(kind));
      }
      const el = subjectStatusElement(state, subject.subjectId);
      if (el) {
        el.textContent = statusLabel(kind, message);
      }
    },
    onDone: outcomes => {
      state.running = false;
      state.authAtStart = null;
      state.statusText =
        outcomes.length === 0 && state.controller && state.controller.stopped
          ? "Leállítva a felhasználó által."
          : summarize(outcomes);
      state.controller = null;
      render(state);
    },
  });
}

function initialize() {
  let scheduled = false;
  function tick() {
    scheduled = false;
    if (location.pathname !== ROUTE) {
      return;
    }
    mount();
  }
  function scheduleTick() {
    if (scheduled) {
      return;
    }
    scheduled = true;
    setTimeout(tick, 0);
  }
  // Router-gated plus an observer: the filter button can arrive after a direct load
  // just as easily as after an in-app navigation.
  router.onChange(path => {
    if (path !== ROUTE && plannerState && plannerState.running) {
      if (plannerState.dialog) {
        plannerState.dialog.close();
      } else if (plannerState.controller) {
        plannerState.controller.stop();
        plannerState.statusText = "Leállítás folyamatban…";
      }
    }
    scheduleTick();
  });
  new MutationObserver(scheduleTick).observe(document.documentElement, { childList: true, subtree: true });
  scheduleTick();
}

module.exports = {
  meta,
  shouldActivate,
  initialize,
  // pure logic, re-exported so selfcheck.js has one entry point
  collectSubjects: plan.collectSubjects,
  collectCourses: plan.collectCourses,
  collectPeriods: plan.collectPeriods,
  periodLoadResult: plan.periodLoadResult,
  registeredCredits: plan.registeredCredits,
  plannedCredits: plan.plannedCredits,
  mergeCredits: plan.mergeCredits,
  totalCredits: plan.totalCredits,
  toMinutes: plan.toMinutes,
  slotsOverlap: plan.slotsOverlap,
  findPlanConflicts: plan.findPlanConflicts,
  toDateTimeLocal: plan.toDateTimeLocal,
  emptyPlan: plan.emptyPlan,
  addSubject: plan.addSubject,
  removeSubject: plan.removeSubject,
  pruneGroups: plan.pruneGroups,
  toggleCourseInPlan: plan.toggleCourseInPlan,
  isCourseInPlan: plan.isCourseInPlan,
  moveUp: plan.moveUp,
  moveDown: plan.moveDown,
  swapCourses: plan.swapCourses,
  plannedCount: rows.plannedCount,
  subjectCodeIn: rows.subjectCodeIn,
  classifyResponse: protocol.classifyResponse,
  chooseCombination: protocol.chooseCombination,
  validateCourseList: protocol.validateCourseList,
  toastTone: protocol.toastTone,
  msUntilTarget: protocol.msUntilTarget,
  wallClockToEpoch: protocol.wallClockToEpoch,
  defaultPeriod: protocol.defaultPeriod,
  formatCountdown: protocol.formatCountdown,
  statusLabel: protocol.statusLabel,
  courseLabel: protocol.courseLabel,
  runSubject: engine.runSubject,
  runPlan: engine.runPlan,
  summarize: engine.summarize,
  submissionOutcome: protocol.submissionOutcome,
  createController: engine.createController,
};
