import fs from "fs"; import vm from "vm";
const dir = new URL("../../src/js/", import.meta.url).pathname;
const D = new URL("../../translate-work/", import.meta.url).pathname; // working files, git-ignored
const files = fs.readdirSync(dir).filter(f => /^0[0-2]-.*\.js$/.test(f)).sort();
const ctx = vm.createContext({ RYNEK_LANG: "pl" });
vm.runInContext(files.map(f => fs.readFileSync(dir + f, "utf8")).join("\n") + ";globalThis.o={LEX,FORMS,PHRASES,ITEMS,NPCS,NPC_ORDER,UI,NUMBERS,REVIEW_LINES,lookup}", ctx);
const { LEX, PHRASES, ITEMS, NPCS, NPC_ORDER, UI, NUMBERS, REVIEW_LINES, lookup } = ctx.o;
const scene = ["05-world.js", "06-props.js"].map(f => fs.readFileSync(dir + f, "utf8")).join("\n");
const sceneWords = [...new Set([...[...scene.matchAll(/addWordLabel\(\{ word: "([^"]+)"/g)].map(m => m[1]), ...[...scene.matchAll(/(?:signTex|tr)\("([^"]+)"/g)].map(m => m[1]),
  ...[...scene.matchAll(/\[\["(\S+)", -?\d+\](?:, \["(\S+)", -?\d+\])*/g)].flatMap(m => m[0].match(/"([^"]+)"/g).map(x => x.slice(1, -1))), "kawa", "herbata", "sok", "lody"])].filter(w => !w.startsWith("#"));
const gloss = w => { const l = lookup(w.toLowerCase()); return l ? LEX[l.lemma][0] : ""; };
const pack = {
  items: Object.fromEntries(Object.values(ITEMS).map(it => [it.id, { polish: { word: it.word, nom: it.nom ?? it.word, acc: it.acc, gen: it.gen, plural: !!it.pl }, en: it.en, the: it.the, why: it.why ?? null, story: it.story ?? null }])),
  labels: Object.fromEntries(sceneWords.map(w => [w, gloss(w) || "(a sign: translate the whole text)"])),
  phrases: PHRASES.map(p => [p.pl, p.en]),
  ui: UI, numbers: NUMBERS, review: REVIEW_LINES,
  npcs: Object.fromEntries(NPC_ORDER.map(id => { const N = NPCS[id]; const o = {};
    for (const [k, v] of Object.entries(N)) if (typeof v !== "function") o[k] = v;
    return [id, o]; })),
};
// node tools/translate/pack.mjs: writes the Polish source for translators into translate-work/
fs.mkdirSync(D, { recursive: true });
fs.writeFileSync(D + "polish-pack.json", JSON.stringify(pack, null, 1));
const { npcs, ...globals } = pack;
fs.writeFileSync(D + "polish-globals.json", JSON.stringify(globals, null, 1));
const groups = JSON.parse(fs.readFileSync(new URL("groups.json", import.meta.url), "utf8"));
for (const [g, ids] of Object.entries(groups)) fs.writeFileSync(D + `polish-npcs-${g}.json`, JSON.stringify(Object.fromEntries(ids.map(id => [id, npcs[id]])), null, 1));
const count = N => JSON.stringify(N).match(/\["[^"]*", "[^"]*"\]|\["[^"]*","[^"]*"\]/g)?.length ?? 0;
console.log(NPC_ORDER.map(id => `${id}:${count(pack.npcs[id])}`).join(" "));
console.log("items", Object.keys(pack.items).length, "labels", sceneWords.length, "phrases", PHRASES.length);
