// Checks the Polish content without a browser: every word anyone says, every label and
// every errand line must resolve to a dictionary entry, so nothing on screen is an
// uncoloured, unclickable word.
import { test as nodeTest } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import { readdirSync } from "node:fs";

// the language files, the frequency lists, the selector and the word helpers, as the page joins them
const dir = new URL("../src/js/", import.meta.url);
const files = readdirSync(dir).filter(f => /^0[0-2]-.*\.js$/.test(f)).sort();
const src = files.map(f => readFileSync(new URL(f, dir), "utf8")).join("\n");
const load = lang => {
  const ctx = vm.createContext({ RYNEK_LANG: lang });
  vm.runInContext(src + "\n;globalThis.out = { LANG, LANGS, L10N, LEX, FORMS, PHRASES, ITEMS, NPCS, NPC_ORDER, UI, LABELS, NUMBERS, lookup, tokenize, findPhrase, validateLexicon, gameWords, keyOf };", ctx);
  return ctx.out;
};
const { L10N: ALL } = load("pl");
// the Polish words the scene code puts on labels and painted signs
const scene = ["05-world.js", "06-props.js"].map(f => readFileSync(new URL(f, dir), "utf8")).join("\n");
const SCENE_WORDS = new Set([
  ...[...scene.matchAll(/addWordLabel\(\{ word: "([^"]+)"/g)].map(m => m[1]),
  ...[...scene.matchAll(/(?:signTex|tr)\("([^"]+)"/g)].map(m => m[1]),
  ...[...scene.matchAll(/\[\["(\S+)", -?\d+\](?:, \["(\S+)", -?\d+\])*/g)].flatMap(m => m[0].match(/"([^"]+)"/g).map(x => x.slice(1, -1))),
  "kawa", "herbata", "sok", "lody",
].filter(w => !w.startsWith("#"))); // drop colour codes caught by the pattern

const LANGUAGES = Object.keys(ALL);

for (const lang of LANGUAGES) {
const { LANG, LEX, FORMS, PHRASES, ITEMS, NPCS, NPC_ORDER, UI, LABELS, NUMBERS, lookup, tokenize, findPhrase, validateLexicon, gameWords, keyOf } = load(lang);
const test = (name, fn) => nodeTest(`${lang}: ${name}`, fn);
test("the language loaded is the one asked for", () => assert.equal(LANG, lang));

test("every word in every line, label and errand has a dictionary entry", () => {
  const { missing, clashes } = validateLexicon();
  assert.deepEqual([...missing], [], "words with no entry: add them to LEX or FORMS");
  assert.deepEqual([...clashes], [], "a FORMS key that is also a LEX lemma hides the lemma");
});

test("every form points at a real lemma", () => {
  for (const [form, [lemma]] of Object.entries(FORMS)) assert.ok(LEX[lemma], `${form} → ${lemma} is not in LEX`);
});

test("items and errand pools are consistent", () => {
  for (const it of Object.values(ITEMS)) {
    assert.ok(LEX[it.lemma], `item ${it.id} has no lemma entry`);
    for (const k of ["acc", "gen", "en", "the"]) assert.ok(it[k], `item ${it.id} is missing ${k}`);
  }
  for (const id of NPC_ORDER) {
    const N = NPCS[id];
    assert.ok(N, `${id} is in NPC_ORDER but not NPCS`);
    if (N.quest) assert.ok(ITEMS[N.quest.item], `${id}'s quest item is not an item`);
    for (const p of N.orders?.pool ?? []) assert.ok(ITEMS[p], `${id} orders ${p}, which is not an item`);
    for (const [pl, en] of N.orders?.ask ?? []) {
      assert.match(pl, /\{(acc|gen|nom)\}/, `${id} order "${pl}" names no item`);
      assert.match(en, /\{(en|the)\}/, `${id} order "${en}" names no item`);
    }
  }
});

test("the interface words, labels and signs are real words", () => {
  const words = [UI.level, ...Object.values(UI.headings), ...UI.examples, ...NUMBERS];
  for (const w of words) assert.ok(lookup(w), `${w} (shown in the interface) has no dictionary entry`);
  for (const [pl, w] of Object.entries(LABELS)) if (pl === pl.toLowerCase()) for (const t of tokenize(w).filter(t => t.w)) assert.ok(t.lemma, `label ${pl} → ${w}: ${t.t} has no entry`);
  if (lang === "pl") return;
  // every label and sign the scene code writes in Polish needs this language's word
  for (const pl of SCENE_WORDS) assert.ok(LABELS[pl] || LABELS[pl.toLowerCase()], `no ${lang} word for the label or sign "${pl}"`);
});

test("every phrase is made of real words", () => {
  for (const p of PHRASES) for (const w of p.w) assert.ok(lookup(w), `phrase "${p.pl}" has unknown word ${w}`);
});

if (lang === "pl") test("lookup, tokenize and phrases behave", () => {
  assert.equal(lookup("Dziękuję").lemma, "dziękować");
  assert.equal(lookup("gruszkę").lemma, "gruszka");
  assert.equal(lookup("Józef").lemma, "józef");
  const toks = tokenize("Dzień dobry! Mam na imię Józef.");
  assert.deepEqual([...toks.filter(t => t.w).map(t => t.lemma)], ["dzień", "dobry", "mieć", "na", "imię", "józef"]);
  assert.equal(findPhrase({ words: ["dzień", "dobry", "mam"], index: 1 }).pl, "dzień dobry");
  assert.equal(findPhrase({ words: ["mam", "na", "imię", "józef"], index: 2 }).pl, "mam na imię");
  assert.equal(findPhrase({ words: ["teraz"], index: 0 }), null);
});

if (lang === "pl") test("each written form is its own word, so learning one form doesn't mark the others", () => {
  const words = gameWords();
  for (const w of ["mam", "masz", "gruszka", "gruszkę", "gruszki", "jest", "są"]) assert.ok(words.has(w), `${w} should be a word of its own`);
  assert.equal(keyOf("Dziękuję"), "dziękuję");
  assert.notEqual(keyOf("mam"), keyOf("masz"));
  assert.equal(lookup("mam").lemma, lookup("masz").lemma, "both still show what they mean via mieć");
});
}
