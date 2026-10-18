// ===================================================================
// state + saving (this browser always; the viewer's Claude account when the page can reach it)
// ===================================================================
const SAVE_KEY = "rynek-slowek:v1";
const DEFAULT_SETTINGS = { auto: true, tr: false, hideKnown: false, sfx: true, rate: 0.9 };
const freshState = () => ({ v: 1, words: {}, npc: {}, coins: 0, bag: [], xp: 0, settings: { ...DEFAULT_SETTINGS }, tips: {}, started: false, updatedAt: 0 });
function normalize(d) {
  const s = freshState();
  if (!d || typeof d !== "object") return s;
  if (d.words && typeof d.words === "object") for (const [l, r] of Object.entries(d.words)) {
    if (!lookup(l) || !r || typeof r !== "object") continue;
    const status = clamp(Math.round(+r.s || 0), 0, 2);
    s.words[l] = { s: status, seen: Math.max(0, +r.seen || 0), ok: Math.max(0, +r.ok || 0), max: clamp(Math.round(+r.max || 0), status, 2) };
  }
  if (d.npc && typeof d.npc === "object") for (const id of NPC_ORDER) if (d.npc[id]) {
    const n = d.npc[id];
    s.npc[id] = { stage: ["new", "active", "done"].includes(n.stage) ? n.stage : "new", order: ITEMS[n.order] ? n.order : null, tmpl: +n.tmpl || 0, thanked: !!n.thanked };
  }
  s.coins = Math.max(0, +d.coins || 0);
  // the bag replaced carrying one thing in your hands
  s.bag = (Array.isArray(d.bag) ? d.bag : d.carry ? [d.carry] : []).filter((id, i, a) => ITEMS[id] && a.indexOf(id) === i).slice(0, BAG_SIZE);
  s.xp = Math.max(0, +d.xp || 0);
  s.settings = { ...DEFAULT_SETTINGS, ...(d.settings && typeof d.settings === "object" ? d.settings : {}) };
  s.tips = d.tips && typeof d.tips === "object" ? { ...d.tips } : {};
  s.started = !!d.started;
  s.updatedAt = +d.updatedAt || 0;
  return s;
}
function loadLocal() { try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
let st = freshState();
let remote = null, remoteTimer = 0, remoteBusy = false, remoteDirty = false, syncNote = "Progress is saved in this browser.";
function save() {
  st.updatedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch {}
  if (remote) { remoteDirty = true; clearTimeout(remoteTimer); remoteTimer = setTimeout(flushRemote, 1500); }
}
async function flushRemote() {
  if (!remote || remoteBusy || !remoteDirty) return;
  remoteBusy = true; remoteDirty = false;
  try { await remote.set(JSON.parse(JSON.stringify(st))); setSync("Progress is saved to your Claude account."); }
  catch (e) {
    if (["invalid_argument", "revoked", "not_granted", "capability_disabled", "capability_removed"].includes(e?.code)) { remote = null; setSync("Progress is saved in this browser only."); }
    else { remoteDirty = true; setSync("Couldn't reach your account just now. Progress is safe in this browser and will sync again."); }
  } finally {
    remoteBusy = false;
    if (remoteDirty && remote) { clearTimeout(remoteTimer); remoteTimer = setTimeout(flushRemote, 4000); }
  }
}
function setSync(t) { syncNote = t; const el = $("#s-sync"); if (el) el.textContent = t; }
async function connectRemote() {
  const c = window.claude;
  if (!c?.use) return;
  try {
    const [db, user] = await Promise.all([c.use("db"), c.use("user")]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    const ref = db.doc("data/users/" + uid + "/progress");
    const snap = await ref.get();
    remote = ref;
    setSync("Progress is saved to your Claude account.");
    const theirs = snap.exists ? snap.data() : null;
    if (theirs && (+theirs.updatedAt || 0) > st.updatedAt) {
      st = normalize(theirs);
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch {}
      afterStateLoaded();
    } else if (st.updatedAt > 0) { remoteDirty = true; flushRemote(); }
  } catch { remote = null; }
}

const BAG_SIZE = 6;
// XP: errands and sums pay the same as their coins; sorting a form pays once per step it climbs
const XP_FOR_STATUS = [0, 2, 5];
const xpNeed = level => 100 + (level - 1) * 50;
function levelOf(xp) { let level = 1; while (xp >= xpNeed(level)) { xp -= xpNeed(level); level++; } return { level, into: xp, need: xpNeed(level) }; }
function gainXP(n) {
  if (!n) return;
  const before = levelOf(st.xp).level;
  st.xp += n;
  const now = levelOf(st.xp).level;
  renderXP();
  if (now > before) { sfx.ok(); toast(h("span", {}, "Level up! ", h("b", {}, `Poziom ${now}`))); }
}
const rec = l => (st.words[l] ??= { s: 0, seen: 0, ok: 0 });
const status = l => st.words[l]?.s ?? 0;
const npcState = id => (st.npc[id] ??= { stage: "new", order: null, tmpl: 0, thanked: false });
function setStatus(key, s) {
  if (!lookup(key)) return;
  const before = status(key);
  const r = rec(key);
  r.s = s;
  if (s > (r.max || 0)) { gainXP(XP_FOR_STATUS[s] - XP_FOR_STATUS[r.max || 0]); r.max = s; }
  save(); refreshWordViews();
  if (s === 2 && before !== 2) sfx.known(); else sfx.tick();
}
function markSeen(keys) {
  let fresh = 0;
  for (const k of new Set(keys)) if (lookup(k)) { if (!rec(k).seen) fresh++; rec(k).seen++; }
  if (fresh) gainXP(fresh); // a new word met: 1 XP
  save(); refreshCounts();
}
let totalWords = 0; // every distinct form on the square, counted once the labels exist
function counts() {
  let known = 0, learning = 0, fresh = 0, met = 0;
  for (const [k, r] of Object.entries(st.words)) {
    if (!lookup(k)) continue;
    if (r.s === 2) known++; else if (r.s === 1) learning++; else if (r.seen > 0) fresh++;
    if (r.seen > 0 || r.s > 0) met++;
  }
  totalWords ||= new Set([...gameWords(), ...labels.filter(L => L.key).map(L => L.key)]).size;
  return { known, learning, fresh, met, total: Math.max(totalWords, met) };
}
function refreshCounts() {
  const c = counts();
  $("#c-known").textContent = c.known; $("#c-learning").textContent = c.learning; $("#c-new").textContent = c.fresh;
  $("#coins").textContent = st.coins;
}
function refreshWordViews() {
  for (const el of $$("[data-key]")) el.dataset.s = String(status(el.dataset.key));
  for (const L of labels) if (L.key) L.btn.textContent = labelText(L);
  refreshCounts();
  if (cardState) renderCard();
  if (!$("#vocab").hidden) renderVocab();
}

// ===================================================================
// sound: speech + little synth effects
// ===================================================================
let plVoice = null;
const canSpeak = "speechSynthesis" in window;
function loadVoices() {
  if (!canSpeak) return;
  const vs = speechSynthesis.getVoices();
  plVoice = vs.find(v => /^pl(-|_|$)/i.test(v.lang)) || null;
  const el = $("#s-voice");
  if (el) el.textContent = !canSpeak ? "This browser can't read text aloud."
    : plVoice ? `Voice: ${plVoice.name}` : vs.length ? "No Polish voice found on this device, so lines are read with the default voice." : "";
}
if (canSpeak) { loadVoices(); speechSynthesis.addEventListener?.("voiceschanged", loadVoices); }
function speak(text) {
  if (!canSpeak) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\.\.\./g, "…"));
    u.lang = "pl-PL"; if (plVoice) u.voice = plVoice; u.rate = st.settings.rate;
    speechSynthesis.speak(u);
  } catch {}
}
let actx = null;
function audio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; } }
  if (actx?.state === "suspended") actx.resume().catch(() => {});
  return actx;
}
function tone(f, d = 0.12, type = "sine", v = 0.07, when = 0) {
  if (!st.settings.sfx) return;
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + d + 0.03);
}
const sfx = {
  pop() { tone(620, 0.09, "triangle"); tone(930, 0.09, "triangle", 0.05, 0.05); },
  ok() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "triangle", 0.06, i * 0.07)); },
  no() { tone(240, 0.16, "triangle", 0.06); tone(190, 0.2, "triangle", 0.05, 0.1); },
  tick() { tone(880, 0.05, "square", 0.018); },
  coin() { tone(1318, 0.08, "square", 0.025); tone(1760, 0.14, "square", 0.025, 0.07); },
  known() { [784, 988, 1318].forEach((f, i) => tone(f, 0.16, "sine", 0.06, i * 0.05)); },
  talk() { tone(440, 0.06, "sine", 0.03); },
  // Staszek's accordion: two slightly detuned reeds per note
  tune() { [392, 523, 523, 587, 659, 587, 523, 494, 523, 392, 523].forEach((f, i) => { tone(f, 0.34, "sawtooth", 0.022, i * 0.26); tone(f * 1.006, 0.34, "sawtooth", 0.016, i * 0.26); }); },
};
