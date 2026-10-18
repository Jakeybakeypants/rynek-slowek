// dist/ is committed so the game can be opened straight from the repo; this fails when
// someone edits src/ and forgets `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "../build.mjs";

test("dist/ matches src/", () => {
  for (const [path, text] of Object.entries(build())) {
    const onDisk = readFileSync(new URL("../" + path, import.meta.url), "utf8");
    assert.ok(onDisk === text, `${path} is out of date. Run: npm run build`);
  }
});

test("the artifact build has no document skeleton and the standalone one does", () => {
  const out = build();
  assert.doesNotMatch(out["dist/artifact.html"], /<!doctype|<html|<head>|<body>/i);
  assert.match(out["dist/artifact.html"], /^<title>Rynek Słówek<\/title>/);
  assert.match(out["dist/index.html"], /^<!doctype html>/);
  assert.match(out["dist/index.html"], /<meta charset="utf-8">/);
});

test("the only remote script is the pinned three.js build", () => {
  const html = build()["dist/index.html"];
  const urls = [...html.matchAll(/https:\/\/[^\s"'`)]+/g)].map(m => m[0]);
  for (const u of urls) assert.ok(/^https:\/\/(cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/|fonts\.googleapis\.com|fonts\.gstatic\.com)/.test(u), `unexpected URL ${u}`);
});
