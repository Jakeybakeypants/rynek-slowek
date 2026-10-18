
// ===================================================================
// helpers
// ===================================================================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}
function showFatal(msg) { const f = document.getElementById("fatal"); f.textContent = msg; f.hidden = false; }
const SPEAKER_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>';
const svgSpeaker = () => { const s = document.createElement("span"); s.innerHTML = SPEAKER_SVG; s.style.display = "grid"; return s; };


// ===================================================================
// words
// ===================================================================
const STATUS_NAMES = ["New", "Learning", "Known"];
const WORD_RE = LANGS[LANG].words ?? /\p{L}+/gu;
function lookup(surface) {
  const k = surface.toLowerCase();
  if (FORMS[k]) return { lemma: FORMS[k][0], form: FORMS[k][1] };
  if (LEX[k]) return { lemma: k, form: null };
  return null;
}
function tokenize(text) {
  const out = []; let last = 0;
  for (const m of text.matchAll(WORD_RE)) {
    if (m.index > last) out.push({ t: text.slice(last, m.index) });
    const info = lookup(m[0]);
    out.push({ t: m[0], w: true, lemma: info?.lemma ?? null });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}
// names are written with a capital; so are nouns in languages that capitalise them (German)
const capitalised = l => LEX[l]?.[1] === "name" || (UI.capitaliseNouns && LEX[l]?.[1]?.startsWith("noun"));
const displayLemma = l => capitalised(l) ? l[0].toUpperCase() + l.slice(1) : l;
function findPhrase(ctx) {
  if (!ctx) return null;
  const { words, index } = ctx;
  for (const p of PHRASES) {
    const n = p.w.length;
    for (let s = index - n + 1; s <= index; s++) {
      if (s < 0 || s + n > words.length) continue;
      let ok = true;
      for (let k = 0; k < n; k++) if (words[s + k] !== p.w[k]) { ok = false; break; }
      if (ok) return p;
    }
  }
  return null;
}
// an order template with one item's forms filled in: {why} {acc} {gen} {nom} in Polish, {whyEn} {en} {the} in English
function fillTemplate([pl, en], it) {
  return [pl.replace("{why}", it.why?.[0] ?? "").replace("{acc}", it.acc).replace("{gen}", it.gen).replace("{nom}", it.nom ?? it.word).trim(),
          en.replace("{whyEn}", it.why?.[1] ?? "").replace("{en}", it.en).replace("{the}", it.the).trim()];
}
// Zuzia's sums: a + b with a, b from 1 to 5, so every answer is a number word from 2 to 10
const QUIZ_MAX = 5;
const quizQuestion = (a, b) => QUIZ.question(a, b);
const quizResult = (right, sum) => QUIZ.result(right, sum);
// every Polish sentence the game can show (labels aside)
// every Polish sentence the game can show (labels aside), each with who says it
function gameLines() {
  const out = [];
  for (const N of Object.values(NPCS)) {
    const check = t => out.push([t, N.name]);
    for (const key of ["intro", "done", "after", "thanks", "regive"]) (N[key] || []).forEach(l => check(l[0]));
    for (const key of ["remind", "wrong"]) if (N[key]) check(N[key][0]);
    N.receive?.lines.forEach(l => check(l[0]));
    if (N.orders) { N.orders.ok.forEach(l => check(l[0])); for (const id of N.orders.pool) N.orders.ask.forEach(a => check(fillTemplate(a, ITEMS[id])[0])); }
    if (N.quiz) {
      [...N.quiz.start, ...N.quiz.more].forEach(l => check(l[0]));
      for (let a = 1; a <= QUIZ_MAX; a++) for (let b = 1; b <= QUIZ_MAX; b++) { check(quizQuestion(a, b)[0]); check(quizResult(true, a + b)[0]); check(quizResult(false, a + b)[0]); }
    }
    (N.chats || []).flat().forEach(l => check(l[0]));
  }
  Object.keys(ITEMS).forEach(id => { out.push([thisIs(id)[0], ""]); out.push([ITEMS[id].word, "a label"]); });
  Object.values(REVIEW_LINES).forEach(l => out.push([l[0], NPCS.jozef.name]));
  return out;
}
const gameTexts = () => gameLines().map(([t]) => t);
// form -> the people who say it (for the frequency list)
function wordSources() {
  const map = new Map();
  for (const [t, who] of gameLines()) for (const tk of tokenize(t)) if (tk.w) {
    const k = tk.t.toLowerCase(); if (!map.has(k)) map.set(k, new Set());
    if (who) map.get(k).add(who);
  }
  return map;
}
// Words are learned form by form, the way a child picks them up: mam and masz are two
// separate words with their own colour. A word's key is its lower-case written form.
const keyOf = w => w.toLowerCase();
// what a form means, for lists: the dictionary word's meaning plus, for an inflected form, what this form is
function meaningOf(key) {
  const info = lookup(key), [gloss, pos, note] = LEX[info.lemma];
  return { gloss: info.form ? `${gloss} · ${info.form}` : gloss, pos, note, lemma: info.lemma };
}
const displayWord = key => capitalised(lookup(key)?.lemma) ? key[0].toUpperCase() + key.slice(1) : key;
function gameWords() { const set = new Set(); for (const t of gameTexts()) for (const tk of tokenize(t)) if (tk.w) set.add(keyOf(tk.t)); return set; }
function validateLexicon() {
  const missing = new Set();
  for (const t of gameTexts()) for (const tk of tokenize(t)) if (tk.w && !tk.lemma) missing.add(tk.t);
  for (const it of Object.values(ITEMS)) if (!LEX[it.lemma]) missing.add(it.lemma);
  const clashes = Object.keys(FORMS).filter(f => LEX[f]);
  return { missing: [...missing], clashes };
}

