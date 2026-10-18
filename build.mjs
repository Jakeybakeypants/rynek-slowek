#!/usr/bin/env node
// Builds the game from src/ into two files, with no dependencies:
//   dist/index.html     a complete page: open it in a browser, or serve the dist folder
//   dist/artifact.html  the same page without the document skeleton, which is the shape
//                       a claude.ai artifact is published in (the host adds the skeleton)
// The files in src/js/ are joined, in name order, into ONE module script, so they share
// a single scope: a function in 04-ui.js can call one defined in 07-loop.js.
//
//   node build.mjs           write dist/
//   node build.mjs --check   exit 1 if dist/ is out of date with src/
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(join(ROOT, p), "utf8");

// The same small reset the artifact host puts around a page, so both builds look alike.
const RESET = ":root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
  + "body{margin:0;font:14px/1.4 system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}";

export function build() {
  const head = read("src/head.html").trimEnd();
  const body = read("src/body.html").trimEnd();
  const js = readdirSync(join(ROOT, "src/js")).filter(f => f.endsWith(".js")).sort()
    .map(f => `// ---- src/js/${f} ----\n` + read("src/js/" + f).trim() + "\n").join("\n");
  const script = `<script type="module">\n${js}</script>`;
  const artifact = `${head}\n${body}\n${script}\n`;
  const index = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n`
    + `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n`
    + `<style>${RESET}</style>\n${head}\n</head>\n<body>\n${body}\n${script}\n</body>\n</html>\n`;
  return { "dist/index.html": index, "dist/artifact.html": artifact };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = build();
  if (process.argv.includes("--check")) {
    const stale = Object.entries(out).filter(([p, text]) => { try { return read(p) !== text; } catch { return true; } }).map(([p]) => p);
    if (stale.length) { console.error(`Out of date: ${stale.join(", ")}. Run: npm run build`); process.exit(1); }
    console.log("dist/ is up to date");
  } else {
    mkdirSync(join(ROOT, "dist"), { recursive: true });
    for (const [p, text] of Object.entries(out)) writeFileSync(join(ROOT, p), text);
    console.log("Built " + Object.keys(out).join(" and "));
  }
}
