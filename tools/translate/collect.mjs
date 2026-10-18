// node collect.mjs <lang> [chunkSize]: after convert.mjs, lists every word the language's lines and labels
// use that has no dictionary entry yet, with example lines, split into dictionary chunks
import fs from "fs"; import vm from "vm";
const D = new URL("../../translate-work/", import.meta.url).pathname; // working files, git-ignored
const lang = process.argv[2], size = +(process.argv[3] || 450), tag = process.argv[4] || "a";
const dir = new URL("../../src/js/", import.meta.url).pathname;
const files = fs.readdirSync(dir).filter(f => /^0[0-2]-.*\.js$/.test(f)).sort();
const ctx = vm.createContext({ RYNEK_LANG: lang });
vm.runInContext(files.map(f => fs.readFileSync(dir + f, "utf8")).join("\n") + ";globalThis.o={gameLines,tokenize,lookup,LABELS,UI,NUMBERS,FREQ_RANK,ITEMS,PHRASES,LEX}", ctx);
const { gameLines, tokenize, lookup, LABELS, UI, NUMBERS, FREQ_RANK, ITEMS, PHRASES, LEX } = ctx.o;
const ex = new Map();
const note = (w, line) => { const k = w.toLowerCase(); if (lookup(k)) return; if (!ex.has(k)) ex.set(k, []); const a = ex.get(k); if (a.length < 2 && line && !a.some(x => x[0] === line[0])) a.push(line); };
for (const [t] of gameLines()) for (const tk of tokenize(t)) if (tk.w) note(tk.t, null);
// examples with English: walk the NPC data for real pairs
const lines = [];
const walk = v => { if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") lines.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
const npcFiles = fs.readdirSync(D + lang).filter(f => f.startsWith("npcs-") || f.startsWith("more-")).map(f => JSON.parse(fs.readFileSync(D + lang + "/" + f, "utf8")));
npcFiles.forEach(walk);
for (const l of lines) for (const tk of tokenize(l[0])) if (tk.w && ex.has(tk.t.toLowerCase())) note(tk.t, l);
for (const w of [...Object.values(LABELS), ...Object.values(UI.headings), UI.level, ...UI.examples, ...NUMBERS]) for (const tk of tokenize(w)) if (tk.w) note(tk.t, [w, "(a label or interface word)"]);
// item lemmas must be dictionary forms of their own, and phrases must be made of known words
for (const it of Object.values(ITEMS)) if (!LEX[it.lemma]) { ex.delete(it.lemma); ex.set(it.lemma, [[it.nom, `(an item: ${it.en}; must be a lemma in lex)`]]); }
for (const p of PHRASES) for (const w of p.w) note(w, [p.pl, p.en]);
const all = [...ex.entries()].map(([w, e]) => ({ word: w, rank: FREQ_RANK.get(w) ?? null, examples: e }));
all.sort((a, b) => a.word.localeCompare(b.word, lang));
const chunks = [];
for (let i = 0; i < all.length; i += size) chunks.push(all.slice(i, i + size));
chunks.forEach((c, i) => fs.writeFileSync(`${D}${lang}/words-${tag}${i + 1}.json`, JSON.stringify(c, null, 0)));
console.log(lang, all.length, "words without entries,", chunks.length, "chunks");
