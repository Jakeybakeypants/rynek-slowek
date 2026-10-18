// node missing.mjs <lang> [parts=4]: top-3000 forms no line uses yet, split into fill lists
import fs from "fs"; import vm from "vm";
const D = new URL("../../translate-work/", import.meta.url).pathname; // working files, git-ignored
const lang = process.argv[2], parts = +(process.argv[3] || 4), tag = process.argv[4] || "m";
const dir = new URL("../../src/js/", import.meta.url).pathname;
const files = fs.readdirSync(dir).filter(f => /^0[0-2]-.*\.js$/.test(f)).sort();
const ctx = vm.createContext({ RYNEK_LANG: lang });
vm.runInContext(files.map(f => fs.readFileSync(dir + f, "utf8")).join("\n") + ";globalThis.o={gameLines,tokenize,FREQ}", ctx);
const { gameLines, tokenize, FREQ } = ctx.o;
const used = new Set();
for (const [t] of gameLines()) for (const tk of tokenize(t)) if (tk.w) used.add(tk.t.toLowerCase());
const miss = FREQ.map((w, i) => [w, i + 1]).filter(([w]) => !used.has(w));
const top = n => FREQ.slice(0, n).filter(w => used.has(w)).length;
console.log(lang, "covered top1000", top(1000), "top2000", top(2000), "top3000", top(3000), "missing", miss.length);
if (process.argv[3]) for (let p = 0; p < parts; p++) fs.writeFileSync(`${D}${lang}/fill-${tag}${p + 1}.txt`, miss.filter((_, i) => i % parts === p).map(([w, r]) => `${r} ${w}`).join("\n") + "\n");
