// Measured anchors and tuning knobs shared across the Rajtoló's files.
const ROUTE = "/hallgato_ng/subjects/registration";
// Measured, stable (reused by hideFullCourses/courseAutoList).
const FILTER_BUTTON_ID = "filter-table";
const LAUNCHER_ID = "npu-rajtolo-launcher";
const PLANNER_ID = "npu-rajtolo-planner";
const PLANS_KEY = "rajtoloPlans";

const SUBJECTS_ENDPOINT = "SubjectApplication/SchedulableSubjects";
const COURSES_ENDPOINT = "SubjectApplication/GetSubjectsCourses";
const SIGNIN_ENDPOINT = "SubjectApplication/SubjectSignin";
// Not called by the app's own traffic on this page; this module originates it.
const PERIODS_ENDPOINT = "Periods/GetPeriods";
// The same response creditBreakdown rides for the header. It issues the GET; this
// module only listens, rather than importing it.
const CREDITS_ENDPOINT = "SubjectApplication/ScheduledSubjectsWithScheduledCourses";
const API_BASE = "/hallgato_ng/api/";

// Bounded: 1 try + 3 retries against a race-condition "full" - the course was open
// when we read it and filled by the time our POST landed.
const MAX_ATTEMPTS = 4;
const DEFAULT_DELAY_SECONDS = 2;
// A deadlock breaker, not a patience limit: XHR fires "error" for network failures,
// never for a hang. Deliberately long - a real registration can spin for ~90s, and a
// timed-out POST cannot be retried, so the timeout must never kill a request that
// was about to answer.
const REQUEST_TIMEOUT_MS = 180000;

// Ranking courses: submission order is irrelevant, points decide. Shown wherever a
// course is listed, so the ranking editor never implies a control that does nothing.
const RANKING_NOTE = () => " — rangsoros: a sorrend itt nem számít, pontszám dönt";
// Where httpRequest parks the HTTP status for classifyResponse. Prefixed so it can
// never collide with a real field in the response body.
const STATUS_KEY = "__npuStatus";

module.exports = {
  ROUTE,
  FILTER_BUTTON_ID,
  LAUNCHER_ID,
  PLANNER_ID,
  PLANS_KEY,
  SUBJECTS_ENDPOINT,
  COURSES_ENDPOINT,
  SIGNIN_ENDPOINT,
  PERIODS_ENDPOINT,
  CREDITS_ENDPOINT,
  API_BASE,
  MAX_ATTEMPTS,
  DEFAULT_DELAY_SECONDS,
  REQUEST_TIMEOUT_MS,
  RANKING_NOTE,
  STATUS_KEY,
};
