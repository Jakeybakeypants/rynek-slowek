#!/usr/bin/env node
// Writes the game's content for Unreal Engine into the plugin, unreal/Plugins/RynekSlowek/Data/<language>/:
// CSV files (one per table, the first column is the row name) and one JSON file with everything.
// The column names match the structs in the plugin's RynekDataTypes.h; the plugin reads rynek-data.json.
//
//   npm install                 (once: playwright-core, plus three.js to serve locally)
//   npm run export:unreal          (every language; or name some: npm run export:unreal -- de es)
//
// It runs the built page in headless Chromium (like the smoke test), so positions are exactly
// where the game puts things. Chromium: set CHROMIUM to an executable, or it uses the cloud
// container's headless shell.
//
// Coordinates: the game uses metres with Y up (three.js). Unreal uses centimetres with Z up,
// so X = x * 100, Y = z * 100, Z = y * 100. Yaw is in degrees around Unreal's Z axis.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { build } from "../build.mjs";

const html = build()["dist/index.html"];
const exe = process.env.CHROMIUM || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browser = await chromium.launch({ executablePath: exe, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
await context.route("**/*", r => {
  const u = r.request().url();
  if (u === "https://rynek.test/") return r.fulfill({ contentType: "text/html; charset=utf-8", body: html });
  const three = u.match(/three@0\.160\.0\/(.*)$/);
  if (three) return r.fulfill({ contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: readFileSync(new URL("../node_modules/three/" + three[1], import.meta.url)) });
  return r.abort();
});
// the page knows its languages; ask it once, then export each in a fresh page
let langs = process.argv.slice(2);
if (!langs.length) {
  const p = await context.newPage();
  await p.goto("https://rynek.test/");
  await p.waitForFunction(() => window.__rynek?.LANGS, null, { timeout: 120000 });
  langs = await p.evaluate(() => Object.keys(window.__rynek.LANGS));
  await p.close();
}
for (const lang of langs) {
const OUT = new URL(`../unreal/Plugins/RynekSlowek/Data/${lang}/`, import.meta.url);
mkdirSync(OUT, { recursive: true });
const page = await context.newPage();
await page.goto(`https://rynek.test/#lang=${lang}`);
await page.waitForFunction(() => window.__rynek?.npcObjs && Object.keys(window.__rynek.npcObjs).length > 0, null, { timeout: 120000 });

// everything is read inside the page, where the game's own data and scene live
const data = await page.evaluate(() => {
  const r = window.__rynek;
  const ue = (x, y, z) => ({ X: Math.round(x * 1000) / 10, Y: Math.round(z * 1000) / 10, Z: Math.round(y * 1000) / 10 });
  const yaw = a => Math.round(((90 - a * 180 / Math.PI) % 360 + 360) % 360 * 10) / 10;
  const rank = new Map(r.FREQ.map((w, i) => [w, i + 1]));
  const lines = [];
  const add = (who, section, conv, pairs) => pairs.forEach(([pl, en], i) => lines.push({ Name: `${who}_${section}_${conv}_${i}`, Character: who, Section: section, Conversation: conv, Line: i, Text: pl, English: en }));
  const orders = [];
  for (const [id, N] of Object.entries(r.NPCS)) {
    for (const s of ["intro", "done", "after", "thanks", "regive"]) if (N[s]) add(id, s, 0, N[s]);
    for (const s of ["remind", "wrong"]) if (N[s]) add(id, s, 0, [N[s]]);
    if (N.receive) add(id, "receive", 0, N.receive.lines);
    if (N.quiz) { add(id, "quiz_start", 0, N.quiz.start); add(id, "quiz_more", 0, N.quiz.more); }
    (N.chats || []).forEach((c, k) => add(id, "chat", k, c));
    if (N.orders) {
      N.orders.ask.forEach(([pl, en], i) => orders.push({ Name: `${id}_ask_${i}`, Character: id, Kind: "ask", Text: pl, English: en, ItemPool: N.orders.pool.join(" ") }));
      N.orders.ok.forEach(([pl, en], i) => orders.push({ Name: `${id}_ok_${i}`, Character: id, Kind: "ok", Text: pl, English: en, ItemPool: N.orders.pool.join(" ") }));
    }
  }
  Object.entries(r.REVIEW_LINES).forEach(([k, [pl, en]]) => lines.push({ Name: `review_${k}`, Character: "jozef", Section: "review_" + k, Conversation: 0, Line: 0, Text: pl, English: en }));
  const characters = Object.entries(r.NPCS).map(([id, N]) => {
    const o = r.npcObjs[id], L = r.LOOKS[id] || {}, p = ue(o.x, 0, o.z);
    return {
      Name: id, DisplayName: N.name, Role: N.role, Kind: N.cat ? "cat" : N.dog ? "dog" : N.kid ? "child" : "adult",
      X: p.X, Y: p.Y, Z: p.Z, Yaw: yaw(o.base), Scale: L.scale ?? 1,
      Shirt: L.shirt ?? "", Pants: L.pants ?? "", Hair: L.hair ?? "", HairStyle: [...(L.style || []), L.ponytail && "hair_ponytail", L.pigtails && "hair_pigtails"].filter(Boolean).join(" "),
      Hat: L.hat ?? "", HatColor: L.hatColor ?? "", Moustache: L.moustache ?? "", Glasses: !!L.glasses, Apron: L.apron ?? "", Skirt: L.skirt ?? "",
      Bag: L.backpack ? "backpack" : L.satchel ? "satchel" : "", BagColor: L.backpack ?? L.satchel ?? "", Prop: L.cane ? "cane" : L.accordion ? "accordion" : L.flowers ? "flowers" : "",
      QuestItem: N.quest?.item ?? "", QuestReward: N.quest?.reward ?? 0, ReceivesFrom: N.receive?.from ?? "", ReceivesItem: N.receive?.item ?? "",
      HasOrders: !!N.orders, HasQuiz: !!N.quiz, HasMusic: !!N.music, ChatCount: (N.chats || []).length,
    };
  });
  const items = Object.values(r.ITEMS).map(it => {
    const h = r.HOMES[it.id], p = h ? ue(h.x, h.y, h.z) : { X: 0, Y: 0, Z: 0 };
    return { Name: it.id, Word: it.word, Lemma: it.lemma, Nominative: it.nom ?? it.word, Accusative: it.acc, Genitive: it.gen, English: it.en, EnglishThe: it.the,
      Plural: !!it.pl, WhyText: it.why?.[0] ?? "", WhyEnglish: it.why?.[1] ?? "", StoryCharacter: it.story ?? "", HomeX: p.X, HomeY: p.Y, HomeZ: p.Z };
  });
  const v = new (r.player.pos.constructor)();
  const labels = r.labels.filter(L => L.word).map((L, i) => {
    if (L.anchor) { L.anchor.getWorldPosition(v); v.y += L.y; } else v.copy(L.pos);
    const p = ue(v.x, v.y, v.z);
    return { Name: `label_${i}`, Word: L.word, Kind: (L.btn.className.match(/\b(sign|small)\b/) || [""])[0], X: p.X, Y: p.Y, Z: p.Z };
  });
  const words = Object.entries(r.LEX).map(([lemma, [en, pos, note]]) => ({ Name: lemma, English: en, PartOfSpeech: pos, Note: note ?? "", FrequencyRank: rank.get(lemma) ?? 0 }));
  const gameWords = [...new Set([...r.gameWords(), ...labels.map(L => L.Word.toLowerCase())])];
  return { lang: r.LANG, gameWords, characters, lines, orders, items, labels, words, forms: Object.entries(r.FORMS).map(([f, [lemma, form]]) => ({ Name: f, Lemma: lemma, Form: form, FrequencyRank: rank.get(f) ?? 0 })),
    phrases: r.PHRASES.map((p, i) => ({ Name: `phrase_${i}`, Text: p.pl, English: p.en })), frequency: r.FREQ.map((w, i) => ({ Name: String(i + 1), Rank: i + 1, Form: w })) };
});
await page.close();
if (data.lang !== lang) throw new Error(`asked for ${lang}, the page loaded ${data.lang}`);

// every word on screen, keyed by its lower-case written form, the way the game tracks progress
const inGame = new Set(data.gameWords);
const lex = new Map(data.words.map(w => [w.Name, w])), forms = new Map(data.forms.map(f => [f.Name, f]));
const rank = new Map(data.frequency.map(f => [f.Form, f.Rank]));
data.wordForms = [...inGame].sort((a, b) => (rank.get(a) ?? 1e9) - (rank.get(b) ?? 1e9) || a.localeCompare(b, lang)).map(k => {
  const f = forms.get(k), lemma = f ? f.Lemma : k, w = lex.get(lemma) ?? {};
  return { Name: k, Lemma: lemma, English: w.English ?? "", Form: f?.Form ?? "", PartOfSpeech: w.PartOfSpeech ?? "", Note: w.Note ?? "", FrequencyRank: rank.get(k) ?? 0 };
});
for (const f of data.frequency) f.InGame = inGame.has(f.Form);

// Unreal reads UTF-8 CSV; a byte-order mark makes sure letters like ą, ü and ñ come through on every platform
const cell = v => typeof v === "boolean" ? (v ? "True" : "False") : typeof v === "number" ? String(v) : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
const csv = rows => "﻿" + [Object.keys(rows[0]).join(","), ...rows.map(r => Object.values(r).map(cell).join(","))].join("\n") + "\n";
const tables = { WordForms: data.wordForms, Words: data.words, Forms: data.forms, Phrases: data.phrases, Frequency: data.frequency, Characters: data.characters, Dialogue: data.lines, Orders: data.orders, Items: data.items, Labels: data.labels };
for (const [name, rows] of Object.entries(tables)) writeFileSync(new URL(`${name}.csv`, OUT), csv(rows));
writeFileSync(new URL("rynek-data.json", OUT), JSON.stringify(tables, null, 1) + "\n");
console.log(lang + ": " + Object.entries(tables).map(([n, r]) => `${n}: ${r.length}`).join(", "));
}
await browser.close();
