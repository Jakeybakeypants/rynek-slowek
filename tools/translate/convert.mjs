// node convert.mjs <lang> : merges lang/<lang>/globals.json, npcs-*.json, dict-*.json into src/js/01-data-<lang>.js
import fs from "fs";
const D = new URL("../../translate-work/", import.meta.url).pathname; // working files, git-ignored
const lang = process.argv[2], dir = D + lang + "/";
const pl = JSON.parse(fs.readFileSync(D + "polish-pack.json", "utf8"));
const names = JSON.parse(fs.readFileSync(new URL("names.json", import.meta.url), "utf8"))[lang];
const plNames = Object.fromEntries(Object.entries(pl.npcs).map(([id, n]) => [id, n.name]));
const g = JSON.parse(fs.readFileSync(dir + "globals.json", "utf8"));
const read = pre => fs.readdirSync(dir).filter(f => f.startsWith(pre) && f.endsWith(".json")).sort().map(f => JSON.parse(fs.readFileSync(dir + f, "utf8")));
const npcText = Object.assign({}, ...read("npcs-"));
const LEX = {}, FORMS = {};
for (const d of read("dict-")) {
  for (const [k, v] of Object.entries(d.lex || {})) { const key = k.toLowerCase(); if (!LEX[key]) LEX[key] = v.filter((x, i) => i < 2 || x); }
  for (const [k, v] of Object.entries(d.forms || {})) { const key = k.toLowerCase(); if (!FORMS[key]) FORMS[key] = [v[0].toLowerCase(), v[1]]; }
}
for (const k of Object.keys(FORMS)) if (LEX[k]) delete FORMS[k];             // a lemma is its own entry
for (const [k, [lem]] of Object.entries(FORMS)) if (!LEX[lem]) console.warn("form without lemma:", k, "→", lem);
const renameEn = t => Object.entries(plNames).reduce((s, [id, n]) => s.replaceAll(n, names[id]), t);
const NPCS = {};
for (const [id, P] of Object.entries(pl.npcs)) {
  const T = npcText[id]; if (!T) { console.warn("no text for", id); continue; }
  const N = { name: names[id], role: renameEn(P.role) };
  for (const f of ["cat", "dog", "kid", "music", "review"]) if (P[f]) N[f] = P[f];
  for (const f of ["intro", "remind", "wrong", "done", "after", "thanks", "regive"]) if (P[f]) N[f] = T[f] ?? P[f];
  if (P.quest) N.quest = { ...P.quest, task: [`Find ${names[id]}'s`, P.quest.task[1]] };
  if (P.receive) N.receive = { ...P.receive, lines: T.receive?.lines ?? T.receive };
  if (P.orders) N.orders = { pool: P.orders.pool, ask: T.orders.ask, ok: T.orders.ok };
  if (P.quiz) N.quiz = { ...P.quiz, start: T.quiz.start, more: T.quiz.more };
  if (P.chats || T.chats) N.chats = T.chats ?? [];
  NPCS[id] = N;
}
// extra chats written to bring in common words: more-*.json is { id: [chat, ...] }
for (const m of read("more-")) for (const [id, chats] of Object.entries(m)) if (NPCS[id]?.chats) NPCS[id].chats.push(...chats); else console.warn("more chats for", id, "who has none");
const ITEMS = {};
for (const [id, P] of Object.entries(pl.items)) {
  const t = g.items[id]; if (!t) { console.warn("no item", id); continue; }
  ITEMS[id] = { id, word: t.word, lemma: t.lemma.toLowerCase(), ind: t.ind, nom: t.nom, acc: t.acc, gen: t.gen, en: P.en, the: P.the, ...(t.plural ? { pl: true } : {}), ...(t.why ? { why: t.why } : {}), ...(P.story ? { story: P.story } : {}) };
}
const J = v => JSON.stringify(v, null, 0).replace(/","/g, '", "').replace(/\],\[/g, "], [");
const block = (name, obj) => `const ${name} = {\n${Object.entries(obj).map(([k, v]) => `  ${JSON.stringify(k)}: ${J(v)},`).join("\n")}\n};\n`;
const LANGNAME = { de: "German", es: "Spanish", fr: "French" }[lang];
const out = `// ===================================================================
// ${LANGNAME}: built from the Polish game by translation, then filled out from the ${LANGNAME}
// frequency list. Same people, places and errands as Polish; the ids stay Polish.
// ===================================================================
L10N.${lang} = () => {
// dictionary form -> [English, part of speech, note]
${block("LEX", LEX)}
// written form -> [dictionary form, what this form is]
${block("FORMS", FORMS)}
const PHRASES = ${J(g.phrases)}.map(([pl, en]) => ({ pl, en, w: pl.toLowerCase().match(LANGS.${lang}.words ?? /\\p{L}+/gu) }));
// items: word is the label; ind / nom / acc / gen are the noun phrases the lines and orders use
${block("ITEMS", ITEMS)}
const thisIs = id => {
  const it = ITEMS[id];
  return it.pl ? [${J(g.thisIs.many)}.replace("{ind}", it.ind), \`Those are \${it.the}.\`] : [${J(g.thisIs.one)}.replace("{ind}", it.ind), \`That's \${it.en}.\`];
};
${block("NPCS", NPCS)}
const NUMBERS = ${J(g.numbers)};
const REVIEW_LINES = ${J(g.review)};
const cap = w => w[0].toUpperCase() + w.slice(1);
const QUIZ = {
  question: (a, b) => [${J(g.quiz.question)}.replace("{a}", NUMBERS[a]).replace("{b}", NUMBERS[b]), \`What's \${a} plus \${b}?\`],
  result: (right, sum) => right
    ? [${J(g.quiz.right)}.replace("{Sum}", cap(NUMBERS[sum])), \`Yes! \${sum}. Well done!\`]
    : [${J(g.quiz.wrong)}.replace("{sum}", NUMBERS[sum]), \`No, it's \${sum}.\`],
};
const UI = ${J({ ...g.ui, ...(lang === "de" ? { capitaliseNouns: true } : {}) })};
const LABELS = ${J(g.labels)};
return { LEX, FORMS, PHRASES, ITEMS, NPCS, NUMBERS, REVIEW_LINES, thisIs, QUIZ, UI, LABELS };
};
`;
// one apostrophe, the straight one, so c'est always splits into the same two words
fs.writeFileSync(new URL(`../../src/js/01-data-${lang}.js`, import.meta.url), out.replaceAll("\u2019", "'"));
console.log(lang, "LEX", Object.keys(LEX).length, "FORMS", Object.keys(FORMS).length, "NPCS", Object.keys(NPCS).length, "ITEMS", Object.keys(ITEMS).length);
