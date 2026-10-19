#!/usr/bin/env node
// Writes the game's 3D scene as glTF files Unreal Engine can import, into unreal/Scene/:
//   rynek-town.glb   everything that stays put: ground, houses, shops, the park, café, bus stop, school
//   rynek-props.glb  the things that move or get picked up, one node each, named by id: every item
//                    (okulary, mleko, ...) and the bus, each at the origin
// People are already a model of their own, assets/people.glb.
//
//   npm run export:scene
//
// Like export-unreal.mjs it runs the built page in headless Chromium and uses three.js's own glTF
// exporter, so the files match what the game draws. glTF is metres with Y up; Unreal's importer turns
// that into centimetres with Z up, the same mapping as the data tables (X = x, Y = z, Z = y).
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { build } from "../build.mjs";

const OUT = new URL("../unreal/Scene/", import.meta.url);
mkdirSync(OUT, { recursive: true });
const html = build()["dist/index.html"];
const exe = process.env.CHROMIUM || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browser = await chromium.launch({ executablePath: exe, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
page.on("pageerror", e => console.error("page error:", e.message));
await page.route("**/*", r => {
  const u = r.request().url();
  if (u === "https://rynek.test/") return r.fulfill({ contentType: "text/html; charset=utf-8", body: html });
  const three = u.match(/three@0\.160\.0\/(.*)$/);
  if (three) return r.fulfill({ contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: readFileSync(new URL("../node_modules/three/" + three[1], import.meta.url)) });
  return r.abort();
});
await page.goto("https://rynek.test/");
await page.waitForFunction(() => window.__rynek?.npcObjs && Object.keys(window.__rynek.npcObjs).length > 0, null, { timeout: 120000 });

const files = await page.evaluate(async () => {
  const { GLTFExporter } = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/exporters/GLTFExporter.js");
  const THREE = await import("three");
  const r = window.__rynek, scene = r.scene;
  // everything that moves, is picked up, or belongs to the web page only
  const skip = new Set([r.sky, r.player.group, r.bus?.g, ...Object.values(r.npcObjs).map(o => o.group), ...Object.values(r.itemObjs).map(o => o.group), ...r.pigeons.map(p => p.g)]);
  const town = new THREE.Group(); town.name = "RynekTown";
  for (const o of scene.children) {
    if (skip.has(o) || o.isLight || o.isPoints) continue;
    const c = o.clone(true);
    c.traverse(n => { if (n.isPoints || n.isLight) n.visible = false; });
    town.add(c);
  }
  const props = new THREE.Group(); props.name = "RynekProps";
  for (const [id, o] of Object.entries(r.itemObjs)) {
    const c = o.model.clone(true); c.name = id; c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); props.add(c);
  }
  if (r.bus) { const b = r.bus.g.clone(true); b.name = "bus"; b.position.set(0, 0, 0); b.rotation.set(0, 0, 0); props.add(b); }
  const ex = new GLTFExporter();
  const glb = async obj => { const buf = await ex.parseAsync(obj, { binary: true, onlyVisible: true }); return Array.from(new Uint8Array(buf)); };
  let meshes = 0; town.traverse(n => { if (n.isMesh && n.visible) meshes++; });
  return { town: await glb(town), props: await glb(props), meshes, props_n: props.children.length };
});
await browser.close();
writeFileSync(new URL("rynek-town.glb", OUT), Buffer.from(files.town));
writeFileSync(new URL("rynek-props.glb", OUT), Buffer.from(files.props));
console.log(`rynek-town.glb: ${files.meshes} meshes, ${(files.town.length / 1e6).toFixed(1)} MB; rynek-props.glb: ${files.props_n} props, ${(files.props.length / 1e6).toFixed(1)} MB`);
