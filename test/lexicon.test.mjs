// Checks the Polish content without a browser: every word anyone says, every label and
// every errand line must resolve to a dictionary entry, so nothing on screen is an
// uncoloured, unclickable word.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = ["01-data.js", "02-words.js"].map(f => readFileSync(new URL("../src/js/" + f, import.meta.url), "utf8")).join("\n");
const ctx = vm.createContext({});
vm.runInContext(src + "\n;globalThis.out = { LEX, FORMS, PHRASES, ITEMS, NPCS, NPC_ORDER, lookup, tokenize, findPhrase, validateLexicon, gameWords, keyOf };", ctx);
const { LEX, FORMS, PHRASES, ITEMS, NPCS, NPC_ORDER, lookup, tokenize, findPhrase, validateLexicon, gameWords, keyOf } = ctx.out;

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

test("every phrase is made of real words", () => {
  for (const p of PHRASES) for (const w of p.w) assert.ok(lookup(w), `phrase "${p.pl}" has unknown word ${w}`);
});

test("lookup, tokenize and phrases behave", () => {
  assert.equal(lookup("Dziękuję").lemma, "dziękować");
  assert.equal(lookup("gruszkę").lemma, "gruszka");
  assert.equal(lookup("Józef").lemma, "józef");
  const toks = tokenize("Dzień dobry! Mam na imię Józef.");
  assert.deepEqual([...toks.filter(t => t.w).map(t => t.lemma)], ["dzień", "dobry", "mieć", "na", "imię", "józef"]);
  assert.equal(findPhrase({ words: ["dzień", "dobry", "mam"], index: 1 }).pl, "dzień dobry");
  assert.equal(findPhrase({ words: ["mam", "na", "imię", "józef"], index: 2 }).pl, "mam na imię");
  assert.equal(findPhrase({ words: ["teraz"], index: 0 }), null);
});

test("each written form is its own word, so learning one form doesn't mark the others", () => {
  const words = gameWords();
  for (const w of ["mam", "masz", "gruszka", "gruszkę", "gruszki", "jest", "są"]) assert.ok(words.has(w), `${w} should be a word of its own`);
  assert.equal(keyOf("Dziękuję"), "dziękuję");
  assert.notEqual(keyOf("mam"), keyOf("masz"));
  assert.equal(lookup("mam").lemma, lookup("masz").lemma, "both still show what they mean via mieć");
});
