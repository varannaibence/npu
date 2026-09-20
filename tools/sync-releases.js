const fs = require("fs");
const path = require("path");

const START = "<!-- releases:start -->";
const END = "<!-- releases:end -->";
const README_PATH = path.join(__dirname, "..", "README.md");

function stableReleases(releases) {
  if (!Array.isArray(releases)) {
    throw new Error("The release input must be a JSON array.");
  }
  return releases
    .filter(release => release && release.draft !== true && release.prerelease !== true && release.tag_name)
    .slice(0, 3);
}

function tableText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function encodeSegment(value) {
  return encodeURIComponent(String(value));
}

function publishedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function renderReleaseBlock(releases, repository) {
  const rows = stableReleases(releases).map(release => {
    const tag = tableText(release.tag_name);
    const releaseUrl =
      release.html_url || `https://github.com/${repository}/releases/tag/${encodeSegment(release.tag_name)}`;
    const installUrl = `https://github.com/${repository}/releases/download/${encodeSegment(release.tag_name)}/npu.user.js`;
    return `| [${tag}](${releaseUrl}) | ${publishedDate(release.published_at)} | [Telepítés](${installUrl}) |`;
  });

  const body = rows.length ? rows : ["| Még nincs publikált stabil kiadás |  |  |"];
  return [
    START,
    "## Legfrissebb kiadások",
    "",
    "A legutóbbi három stabil kiadás. A **Telepítés** link Tampermonkey mellett",
    "közvetlenül telepíthető.",
    "",
    "| Verzió | Megjelent | Telepítés |",
    "| --- | --- | --- |",
    ...body,
    "",
    `[Összes kiadás megtekintése](https://github.com/${repository}/releases)`,
    END,
  ].join("\n");
}

function replaceReleaseBlock(source, replacement) {
  const start = source.indexOf(START);
  const end = source.indexOf(END, start + START.length);
  if (start < 0 || end < 0) {
    throw new Error("README.md is missing the release sync markers.");
  }
  return `${source.slice(0, start)}${replacement}${source.slice(end + END.length)}`;
}

function syncReadme(releases, repository, readmePath) {
  const source = fs.readFileSync(readmePath, "utf8");
  const next = replaceReleaseBlock(source, renderReleaseBlock(releases, repository));
  if (next !== source) {
    fs.writeFileSync(readmePath, next);
    return true;
  }
  return false;
}

if (require.main === module) {
  try {
    const repository = process.env.GITHUB_REPOSITORY || "varannaibence/npu";
    const releases = JSON.parse(fs.readFileSync(0, "utf8"));
    const changed = syncReadme(releases, repository, README_PATH);
    console.log(changed ? "README release list updated." : "README release list already current.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { END, START, renderReleaseBlock, replaceReleaseBlock, stableReleases };
