const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repositoryRoot = path.resolve(__dirname, "..");
const skippedDirectories = new Set([".git", "dist", "node_modules"]);

function markdownFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && !skippedDirectories.has(entry.name)) {
      files.push(...markdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

const markdownLink = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))/g;
const brokenLinks = [];

for (const file of markdownFiles(repositoryRoot)) {
  const source = fs.readFileSync(file, "utf8");
  let match;
  markdownLink.lastIndex = 0;
  while ((match = markdownLink.exec(source)) !== null) {
    const target = match[1] || match[2];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) continue;

    const targetPath = target.split(/[?#]/, 1)[0];
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(targetPath);
    } catch (error) {
      brokenLinks.push(`${path.relative(repositoryRoot, file)} -> ${target}: ${error.message}`);
      continue;
    }
    if (!fs.existsSync(path.resolve(path.dirname(file), decodedPath))) {
      brokenLinks.push(`${path.relative(repositoryRoot, file)} -> ${target}`);
    }
  }
}

assert.deepStrictEqual(brokenLinks, [], `broken relative Markdown links:\n${brokenLinks.join("\n")}`);
