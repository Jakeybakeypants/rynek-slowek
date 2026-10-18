
// ===================================================================
// word buttons + the word card
// ===================================================================
function wordBtn(surface, cls = "w", ctx = null) {
  const key = keyOf(surface);
  const b = h("button", { class: cls, type: "button", lang: "pl", dataset: { key, s: String(status(key)) } }, surface);
  b.addEventListener("click", ev => { ev.stopPropagation(); openCard(surface, b, ctx); });
  return b;
}
let cardState = null;
const card = $("#card");
function openCard(surface, anchor, ctx) {
  const info = lookup(surface);
  if (!info || !LEX[info.lemma]) return;
  cardState = { surface, key: keyOf(surface), lemma: info.lemma, form: info.form, anchor, ctx };
  renderCard();
  card.hidden = false;
  positionCard(anchor);
  if (!st.tips.word) { st.tips.word = true; $("#d-tip").hidden = true; save(); }
}
function renderCard() {
  const { surface, key, lemma, form, ctx } = cardState;
  const [gloss, pos, note] = LEX[lemma];
  const r = st.words[key] || { seen: 0, ok: 0 }, s = status(key), phrase = findPhrase(ctx);
  card.dataset.s = String(s);
  card.replaceChildren(...[
    h("div", { class: "c-top" },
      h("span", { class: "c-word", lang: "pl" }, surface),
      h("button", { class: "icon-btn small", type: "button", "aria-label": "Listen", onclick: () => speak(surface) }, svgSpeaker()),
      h("button", { class: "icon-btn small", type: "button", "aria-label": "Close", onclick: closeCard }, "×")),
    form ? h("p", { class: "c-form" }, "→ ", h("b", { lang: "pl" }, displayLemma(lemma)), " · ", form) : null,
    h("p", { class: "c-pos" }, pos),
    h("p", { class: "c-gloss" }, gloss),
    phrase ? h("p", { class: "c-phrase" }, h("b", { lang: "pl" }, phrase.pl), " = ", phrase.en) : null,
    note ? h("p", { class: "c-note" }, note) : null,
    h("div", { class: "seg", role: "group", "aria-label": "Sort this word" },
      [0, 1, 2].map(k => h("button", { type: "button", dataset: { s: String(k) }, "aria-pressed": String(s === k), onclick: () => setStatus(key, k) },
        h("span", { class: "k" }, String(k + 1)), STATUS_NAMES[k]))),
    h("p", { class: "c-meta" }, `Seen ${r.seen || 0}×` + (r.ok ? ` · delivered ${r.ok}×` : "") + (form ? " · only this form changes colour" : ""))].filter(Boolean));
}
function positionCard(anchor) {
  const r = anchor.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
  let top = r.top - ch - 10;
  if (top < 60) top = Math.min(r.bottom + 10, innerHeight - ch - 12);
  const left = clamp(r.left + r.width / 2 - cw / 2, 16, Math.max(16, innerWidth - cw - 16));
  card.style.left = left + "px"; card.style.top = Math.max(12, top) + "px";
}
function closeCard() { card.hidden = true; cardState = null; }
document.addEventListener("pointerdown", e => {
  if (!card.hidden && !card.contains(e.target) && !e.target.closest("[data-key]")) closeCard();
  const pop = $("#settings");
  if (!pop.hidden && !pop.contains(e.target) && !e.target.closest("#btn-settings")) pop.hidden = true;
}, true);

// ===================================================================
// dialogue
// ===================================================================
const dlg = { open: false, npc: null, lines: [], i: 0, actions: null, onEnd: null };
function startDialogue(npcId, lines, opts = {}) {
  closeCard();
  Object.assign(dlg, { open: true, npc: npcId, lines, i: 0, actions: opts.actions || null, onEnd: opts.onEnd || null });
  $("#d-name").textContent = NPCS[npcId].name;
  $("#d-role").textContent = NPCS[npcId].role;
  $("#dialogue").hidden = false;
  $("#d-tip").hidden = !!st.tips.word;
  updateTouchUI();
  showLine();
}
function showLine() {
  const [pl, en] = dlg.lines[dlg.i];
  const toks = tokenize(pl), words = toks.filter(t => t.w).map(t => t.t.toLowerCase());
  const line = $("#d-line"); line.replaceChildren();
  let wi = 0;
  toks.forEach((tk, i) => {
    const node = tk.w && tk.lemma ? wordBtn(tk.t, "w", { words, index: wi }) : h("span", { class: "p" }, tk.t);
    if (tk.w) wi++;
    node.style.setProperty("--i", i);
    line.append(node);
  });
  markSeen(toks.filter(t => t.lemma).map(t => keyOf(t.t)));
  const tr = $("#d-tr"); tr.textContent = en; tr.hidden = !st.settings.tr && !dlg.trOnce;
  $("#d-trbtn").setAttribute("aria-pressed", String(!tr.hidden));
  $("#d-step").textContent = dlg.lines.length > 1 ? `${dlg.i + 1} / ${dlg.lines.length}` : "";
  const last = dlg.i === dlg.lines.length - 1, extra = $("#d-extra");
  extra.replaceChildren();
  if (last && dlg.actions) {
    dlg.actions.forEach((a, k) => extra.append(h("button", {
      type: "button", class: a.word ? "w answer" : k === 0 ? "primary" : "chip-btn",
      lang: a.word ? "pl" : null, dataset: a.word ? { key: a.word, s: String(status(a.word)) } : null,
      onclick: () => { endDialogue(); a.fn?.(); },
    }, a.label)));
    $("#d-next").hidden = true;
  } else { $("#d-next").hidden = false; $("#d-next").textContent = last ? "Done" : "Next"; }
  if (st.settings.auto) speak(pl); else sfx.talk();
}
function nextLine() { if (dlg.i < dlg.lines.length - 1) { dlg.i++; dlg.trOnce = false; showLine(); } else endDialogue(); }
function endDialogue() {
  if (!dlg.open) return;
  dlg.open = false; dlg.trOnce = false; $("#dialogue").hidden = true; closeCard();
  if (canSpeak) speechSynthesis.cancel();
  const cb = dlg.onEnd; dlg.onEnd = null; dlg.npc = null;
  updateTouchUI(); renderTracker();
  cb?.();
}
function toggleTr() { const tr = $("#d-tr"); tr.hidden = !tr.hidden; dlg.trOnce = !tr.hidden; $("#d-trbtn").setAttribute("aria-pressed", String(!tr.hidden)); }
$("#d-next").addEventListener("click", nextLine);
$("#d-trbtn").addEventListener("click", toggleTr);
$("#d-speak").addEventListener("click", () => dlg.open && speak(dlg.lines[dlg.i][0]));

// ===================================================================
// errands
// ===================================================================
function fillOrder(npcId) {
  const s = npcState(npcId), ask = NPCS[npcId].orders.ask;
  return fillTemplate(ask[s.tmpl % ask.length], ITEMS[s.order]);
}
function newOrder(npcId) {
  const N = NPCS[npcId], s = npcState(npcId);
  const pool = N.orders.pool.filter(id => id !== s.last && (!ITEMS[id].story));
  const weighted = pool.flatMap(id => Array(status(ITEMS[id].word) === 2 ? 1 : 3).fill(id));
  s.order = pick(weighted); s.last = s.order; s.tmpl = Math.floor(Math.random() * N.orders.ask.length);
  return fillOrder(npcId);
}
function reward(n) { st.coins += n; sfx.coin(); }
function wordDelivered(id) {
  const key = ITEMS[id].word; rec(key).ok++;
  if (status(key) === 2) return;
  const word = ITEMS[id].word;
  toast(h("span", {}, h("b", { class: "chip", dataset: { key, s: String(status(key)) } }, word), " delivered. Sort it?"), {
    actions: [{ label: "Learning", s: 1, fn: () => setStatus(key, 1) }, { label: "Known", s: 2, fn: () => setStatus(key, 2) }], ms: 6000 });
}
function wantedBy(npcId) {
  const N = NPCS[npcId], s = npcState(npcId), out = [];
  if (N.receive && npcState(N.receive.from).stage === "active") out.push(N.receive.item);
  if (s.stage === "active" && N.quest && !N.gives) out.push(N.quest.item);
  if (s.stage === "done" && s.order) out.push(s.order);
  return out;
}
function npcMark(npcId) {
  const N = NPCS[npcId], s = npcState(npcId), want = wantedBy(npcId);
  if (st.carry && want.includes(st.carry)) return "?";
  if (s.stage === "new") return "!";
  if (s.stage === "done" && N.orders && !s.order) return "!";
  if (s.stage === "done" && N.quiz) return "!";
  if (N.thanks && s.stage === "done" && !s.thanked) return "!";
  return "";
}
// one of Zuzia's sums: three number words to tap, plus a way out
function quizTurn(id, lead = []) {
  const a = 1 + Math.floor(Math.random() * QUIZ_MAX), b = 1 + Math.floor(Math.random() * QUIZ_MAX), sum = a + b;
  const opts = new Set([sum]);
  while (opts.size < 3) opts.add(clamp(sum + Math.floor(Math.random() * 7) - 3, 2, 10));
  const answer = n => () => {
    const right = n === sum;
    if (right) { reward(3); sfx.ok(); } else sfx.no();
    save(); refreshCounts();
    const next = quizTurn(id, [quizResult(right, sum), pick(NPCS[id].quiz.more)]);
    startDialogue(id, next.lines, { actions: next.actions });
  };
  const actions = shuffle([...opts]).map(n => ({ label: NUMBERS[n], word: NUMBERS[n], fn: answer(n) }));
  actions.push({ label: "That's enough" });
  return { lines: [...lead, quizQuestion(a, b)], actions };
}
function talk(id) {
  const N = NPCS[id], s = npcState(id), carry = st.carry, lines = [], after = [];
  let actions = null;
  const finishQuest = (qid, Q) => {
    lines.push(...NPCS[qid].done || []);
    consumeCarry(); npcState(qid).stage = "done"; reward(Q.reward); wordDelivered(Q.item);
    after.push(() => { sfx.ok(); toast(`Errand done for ${NPCS[qid].name}. +${Q.reward} zł`); });
  };
  const followUp = () => {
    if (N.orders) lines.push(newOrder(id));
    if (N.quiz) { const q = quizTurn(id); lines.push(...q.lines); actions = q.actions; }
    if (N.music) after.push(() => sfx.tune());
  };
  if (N.receive && npcState(N.receive.from).stage === "active" && carry === N.receive.item) {
    // meeting someone for the first time with their delivery in hand: say hello, and keep their own errand open
    if (s.stage === "new") { lines.push(...N.intro); s.stage = N.quest ? "active" : "done"; }
    lines.push(...N.receive.lines);
    const from = N.receive.from, Q = NPCS[from].quest;
    consumeCarry(); npcState(from).stage = "done"; reward(Q.reward); wordDelivered(Q.item);
    after.push(() => { sfx.ok(); toast(`Delivered for ${NPCS[from].name}. +${Q.reward} zł`); });
  } else if (s.stage === "new") {
    lines.push(...N.intro);
    if (N.quest) {
      s.stage = "active";
      if (N.gives) { giveCarry(N.gives); after.push(() => toast(h("span", {}, `${N.name} gave you `, wordChip(N.gives), `. Take it to ${NPCS[N.quest.deliverTo].name}.`))); }
      else if (carry === N.quest.item) finishQuest(id, N.quest);
    } else s.stage = "done";
    if (s.stage === "done") followUp();
  } else if (s.stage === "active") {
    if (N.gives) {
      if (carry === N.gives) lines.push(N.remind);
      else { lines.push(...N.regive); giveCarry(N.gives); }
    } else if (carry === N.quest.item) {
      finishQuest(id, N.quest);
      followUp();
    } else if (carry) { lines.push(N.wrong, thisIs(carry), N.remind); sfx.no(); }
    else lines.push(N.remind);
  } else {
    if (N.thanks && !s.thanked) { lines.push(...N.thanks); s.thanked = true; }
    if (N.quiz) { const q = quizTurn(id, [pick(N.quiz.start)]); lines.push(...q.lines); actions = q.actions; }
    else if (N.orders) {
      if (s.order && carry === s.order) {
        lines.push(pick(N.orders.ok)); consumeCarry(); reward(5); wordDelivered(s.order); s.order = null;
        after.push(() => sfx.ok());
        lines.push(newOrder(id));
      } else if (s.order && carry) { lines.push(N.wrong, thisIs(carry), fillOrder(id)); sfx.no(); }
      else if (s.order) lines.push(fillOrder(id));
      else lines.push(newOrder(id));
    } else {
      lines.push(pick(N.after));
      if (N.music) after.push(() => sfx.tune());
      if (N.review) {
        if (Object.values(st.words).some(r => r.s === 1)) {
          lines.push(REVIEW_LINES.offer);
          actions = [{ label: "Review my words", fn: () => openReview("learning") }, { label: "Not now" }];
        } else lines.push(REVIEW_LINES.none);
      }
    }
  }
  save(); refreshCounts(); renderTracker();
  startDialogue(id, lines, { actions, onEnd: () => after.forEach(f => f()) });
}
function giveCarry(id) { if (st.carry && st.carry !== id) placeItem(st.carry, true); removeItem(id); st.carry = id; setCarryVisual(); sfx.pop(); }
function consumeCarry() {
  const id = st.carry; if (!id) return;
  st.carry = null; setCarryVisual();
  if (!ITEMS[id].story) setTimeout(() => placeItem(id, true), 900);
}
function pickUp(id) {
  if (st.carry) placeItem(st.carry, true);
  removeItem(id); st.carry = id; setCarryVisual(); sfx.pop();
  markSeen([ITEMS[id].word]);
  save(); renderTracker();
}
function putBack() { if (!st.carry) return; const id = st.carry; st.carry = null; placeItem(id, true); setCarryVisual(); sfx.tick(); save(); renderTracker(); }
$("#btn-drop").addEventListener("click", putBack);

// ===================================================================
// tracker, HUD, toasts, prompt
// ===================================================================
const wordChip = (id) => wordBtn(ITEMS[id].word, "chip");
function headingWord(sel, word) { $(sel).replaceChildren(wordBtn(word[0].toUpperCase() + word.slice(1), "w")); }
function renderTracker() {
  const ul = $("#tasks"); ul.replaceChildren();
  let n = 0;
  for (const id of NPC_ORDER) {
    const N = NPCS[id], s = npcState(id);
    if (s.stage === "active" && N.quest) { const [a, b] = N.quest.task; ul.append(h("li", {}, a, " ", wordChip(N.quest.item), b ? " " + b : "")); n++; }
    if (s.stage === "done" && s.order) { ul.append(h("li", {}, wordChip(s.order), ` for ${N.name}`)); n++; }
  }
  if (!n) ul.append(h("li", { class: "muted" }, "Talk to someone with a ! over their head."));
  const unmet = NPC_ORDER.filter(id => npcState(id).stage === "new").map(id => NPCS[id].name);
  const names = unmet.length > 4 ? `${unmet.slice(0, 3).join(", ")} and ${unmet.length - 3} more` : unmet.join(", ");
  $("#unmet").textContent = unmet.length ? `Not met yet: ${names}` : "You've met everyone on the square.";
  $("#tracker-toggle").textContent = $("#tracker").classList.contains("open") ? "Hide" : `Show ${n || ""}`.trim();
  for (const o of Object.values(npcObjs)) o.mark.textContent = npcMark(o.id);
  if (npcObjs.jozef) npcObjs.jozef.parts.specs.visible = npcState("jozef").stage === "done"; // he wears them once found
  const cw = $("#carry-word");
  if (st.carry) { cw.replaceChildren(wordChip(st.carry)); $("#carry").hidden = false; } else $("#carry").hidden = true;
}
$("#tracker-toggle").addEventListener("click", () => { const t = $("#tracker"); t.classList.toggle("open"); $("#tracker-toggle").setAttribute("aria-expanded", String(t.classList.contains("open"))); renderTracker(); });
function toast(content, { actions, ms = 3400 } = {}) {
  const el = h("div", { class: "toast glaze" }, content);
  if (actions) el.append(h("span", { class: "acts" }, actions.map(a => h("button", { type: "button", dataset: { s: String(a.s) }, onclick: () => { a.fn(); el.remove(); } }, a.label))));
  $("#toasts").append(el);
  while ($("#toasts").children.length > 3) $("#toasts").firstChild.remove();
  setTimeout(() => el.remove(), ms);
}
let promptKey = "";
function setPrompt(near) {
  const p = $("#prompt"), act = $("#act");
  const key = near && !dlg.open && introClosed ? near.kind + near.id : "";
  if (key === promptKey) return;
  promptKey = key;
  if (!key) { p.hidden = true; act.disabled = !dlg.open; act.textContent = dlg.open ? "Next" : "Talk"; return; }
  const verb = near.kind === "npc" ? "Talk to" : "Pick up";
  p.replaceChildren(h("kbd", {}, "E"), verb + " ", near.kind === "npc" ? h("b", {}, NPCS[near.id].name) : wordChip(near.id));
  p.hidden = false; act.disabled = false; act.textContent = near.kind === "npc" ? "Talk" : "Pick up";
}

// ===================================================================
// word list (Słownik)
// ===================================================================
let vFilter = "all";
function renderVocab() {
  const c = counts(), q = $("#v-search").value.trim().toLowerCase();
  const bar = $("#v-bar").children, tot = c.total || 1;
  bar[0].style.width = (c.known / tot * 100) + "%"; bar[1].style.width = (c.learning / tot * 100) + "%"; bar[2].style.width = (c.fresh / tot * 100) + "%";
  $("#v-summary").textContent = `${c.known} known, ${c.learning} learning, ${c.fresh} new. You've met ${c.met} of the ${c.total} words on the square.`;
  const met = Object.keys(st.words).filter(k => lookup(k) && ((st.words[k].seen || 0) > 0 || status(k) > 0));
  const list = met.filter(k => vFilter === "all" || String(status(k)) === vFilter)
    .filter(k => !q || k.includes(q) || meaningOf(k).gloss.toLowerCase().includes(q))
    .sort((a, b) => a.localeCompare(b, "pl"));
  const ul = $("#v-list");
  ul.replaceChildren(...list.map(l => {
    const s = status(l);
    return h("li", { class: "v-row" }, wordBtn(displayWord(l), "w"), h("span", { class: "v-gloss" }, meaningOf(l).gloss),
      h("span", { class: "v-dots", role: "group", "aria-label": `Sort ${l}` }, [0, 1, 2].map(k =>
        h("button", { type: "button", class: "dot", dataset: { s: String(k) }, "aria-pressed": String(s === k), "aria-label": STATUS_NAMES[k], title: STATUS_NAMES[k], onclick: () => setStatus(l, k) }))));
  }));
  if (!list.length) ul.append(h("li", { class: "v-empty" }, met.length ? "No words match." : "No words yet. Talk to people on the square and every word they say lands here."));
  const nl = c.learning, nn = c.fresh;
  $("#v-review").textContent = `Review learning words (${nl})`; $("#v-review").disabled = !nl;
  $("#v-review-new").textContent = `Sort new words (${nn})`; $("#v-review-new").disabled = !nn;
}
function toggleVocab(force) {
  const v = $("#vocab"), open = force ?? v.hidden;
  v.hidden = !open; if (open) { renderVocab(); $("#settings").hidden = true; } else closeCard();
}
$("#v-filters").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  vFilter = b.dataset.f; $$("#v-filters button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderVocab();
});
$("#v-search").addEventListener("input", renderVocab);
$("#v-review").addEventListener("click", () => openReview("learning"));
$("#v-review-new").addEventListener("click", () => openReview("new"));
$("#counts").addEventListener("click", () => toggleVocab());
$("#btn-vocab").addEventListener("click", () => toggleVocab());
$$("[data-close]").forEach(b => b.addEventListener("click", () => { const id = b.dataset.close; if (id === "vocab") toggleVocab(false); else closeReview(); }));

// ===================================================================
// review (Powtórka)
// ===================================================================
let rv = null;
function openReview(kind) {
  const deck = shuffle(Object.keys(st.words).filter(k => lookup(k) && (kind === "learning" ? status(k) === 1 : status(k) === 0 && (st.words[k].seen || 0) > 0)));
  if (!deck.length) { toast(kind === "learning" ? "No orange words to review yet. Mark some words as Learning first." : "No new words to sort right now."); return; }
  rv = { deck, i: 0, shown: false, kind, known: 0 };
  closeCard(); toggleVocab(false); $("#review").hidden = false; renderReview();
}
function closeReview() { $("#review").hidden = true; rv = null; closeCard(); }
function renderReview() {
  const body = $("#r-body");
  if (rv.i >= rv.deck.length) {
    $("#r-step").textContent = "";
    body.replaceChildren(h("div", { class: "r-card" },
      h("p", { class: "r-gloss" }, "Done!"),
      h("p", { class: "r-note" }, rv.known ? `${rv.known} ${rv.known === 1 ? "word" : "words"} turned green.` : "Keep going. They'll stick."),
      h("div", { class: "r-btns", dataset: { s: "2" } }, h("button", { type: "button", class: "fill", onclick: closeReview }, "Back to the square"))));
    return;
  }
  const l = rv.deck[rv.i], { gloss, pos, note } = meaningOf(l), s = status(l);
  $("#r-step").textContent = `${rv.i + 1} / ${rv.deck.length}`;
  const word = h("div", { class: "r-word", dataset: { s: String(s) }, lang: "pl" }, displayWord(l));
  const top = [word, h("button", { class: "icon-btn small", type: "button", "aria-label": "Listen", onclick: () => speak(l) }, svgSpeaker())];
  if (!rv.shown) {
    body.replaceChildren(h("div", { class: "r-card" }, ...top, h("p", { class: "r-note" }, "Do you remember what it means?"),
      h("div", { class: "r-btns", dataset: { s: "1" } }, h("button", { type: "button", class: "fill", onclick: revealReview }, "Show meaning"))));
    speak(l); body.querySelector(".fill")?.focus();
    return;
  }
  const choose = k => { setStatus(l, k); if (k === 2) rv.known++; rv.i++; rv.shown = false; renderReview(); };
  body.replaceChildren(h("div", { class: "r-card" }, ...top, h("p", { class: "r-pos" }, pos), h("p", { class: "r-gloss" }, gloss), note ? h("p", { class: "r-note" }, note) : null,
    h("div", { class: "r-btns" },
      rv.kind === "new" ? h("button", { type: "button", dataset: { s: "0" }, onclick: () => choose(0) }, "Skip") : null,
      h("button", { type: "button", dataset: { s: "1" }, onclick: () => choose(1) }, rv.kind === "new" ? "Start learning" : "Not yet"),
      h("button", { type: "button", class: "fill", dataset: { s: "2" }, onclick: () => choose(2) }, "I know it"))));
  body.querySelector(".fill")?.focus();
}
function revealReview() { if (rv && !rv.shown) { rv.shown = true; renderReview(); } }

// ===================================================================
// settings
// ===================================================================
function syncSettingsUI() {
  $("#s-auto").checked = st.settings.auto; $("#s-tr").checked = st.settings.tr; $("#s-hide").checked = st.settings.hideKnown;
  $("#s-sfx").checked = st.settings.sfx; $("#s-rate").value = st.settings.rate; setSync(syncNote); loadVoices();
}
$("#btn-settings").addEventListener("click", () => { const p = $("#settings"); p.hidden = !p.hidden; if (!p.hidden) { syncSettingsUI(); toggleVocab(false); } });
for (const [id, key] of [["s-auto", "auto"], ["s-tr", "tr"], ["s-hide", "hideKnown"], ["s-sfx", "sfx"]])
  $("#" + id).addEventListener("change", e => { st.settings[key] = e.target.checked; save(); if (key === "hideKnown") refreshWordViews(); });
$("#s-rate").addEventListener("change", e => { st.settings.rate = +e.target.value; save(); speak("Dzień dobry!"); });
let resetArmed = 0;
$("#s-reset").addEventListener("click", e => {
  if (Date.now() - resetArmed > 4000) { resetArmed = Date.now(); e.target.textContent = "Click again to erase everything"; setTimeout(() => { e.target.textContent = "Reset all progress"; }, 4000); return; }
  resetArmed = 0; e.target.textContent = "Reset all progress";
  const keep = { ...st.settings };
  st = freshState(); st.settings = keep; st.started = true; save(); afterStateLoaded(); toast("Progress erased. Every word is purple again.");
});

// ===================================================================
// intro
// ===================================================================
let introClosed = false;
function showIntro() {
  introClosed = false; $("#intro").hidden = false;
  const c = counts();
  $("#start").textContent = st.started ? "Back to the square" : "Start playing";
  $("#intro-progress").textContent = st.started ? `${c.known} known · ${c.learning} learning · ${st.coins} zł` : "";
  updateTouchUI();
}
function closeIntro() {
  if (introClosed) return;
  introClosed = true; $("#intro").hidden = true; audio();
  if (canSpeak) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch {} }
  const first = !st.started;
  st.started = true; save(); updateTouchUI();
  if (first) setTimeout(() => toast("Józef by the fountain has a ! over his head. Walk up and talk to him."), 600);
  $("#scene").focus();
}
$("#start").addEventListener("click", closeIntro);
$("#btn-help").addEventListener("click", showIntro);
