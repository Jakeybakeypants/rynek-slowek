
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
const WORD_RE = /\p{L}+/gu;
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
const displayLemma = l => LEX[l]?.[1] === "name" ? l[0].toUpperCase() + l.slice(1) : l;
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
function validateLexicon() {
  const missing = new Set(), check = t => tokenize(t).forEach(tk => { if (tk.w && !tk.lemma) missing.add(tk.t); });
  const fill = (tpl, it) => tpl.replace("{acc}", it.acc).replace("{gen}", it.gen).replace("{nom}", it.word);
  for (const N of Object.values(NPCS)) {
    for (const key of ["intro", "done", "after", "thanks", "regive"]) (N[key] || []).forEach(l => check(l[0]));
    for (const key of ["remind", "wrong"]) if (N[key]) check(N[key][0]);
    N.receive?.lines.forEach(l => check(l[0]));
    if (N.orders) { N.orders.ok.forEach(l => check(l[0])); for (const id of N.orders.pool) N.orders.ask.forEach(a => check(fill(a[0], ITEMS[id]))); }
  }
  Object.keys(ITEMS).forEach(id => { check(thisIs(id)[0]); if (!LEX[ITEMS[id].lemma]) missing.add(ITEMS[id].lemma); });
  Object.values(REVIEW_LINES).forEach(l => check(l[0]));
  const clashes = Object.keys(FORMS).filter(f => LEX[f]);
  return { missing: [...missing], clashes };
}

