
// ===================================================================
// word buttons + the word card
// ===================================================================
function wordBtn(surface, cls = "w", ctx = null) {
  const key = keyOf(surface);
  const b = h("button", { class: cls, type: "button", lang: LANG, dataset: { key, s: String(status(key)) } }, surface);
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
      h("span", { class: "c-word", lang: LANG }, surface),
      h("button", { class: "icon-btn small", type: "button", "aria-label": "Listen", onclick: () => speak(surface) }, svgSpeaker()),
      h("button", { class: "icon-btn small", type: "button", "aria-label": "Close", onclick: closeCard }, "×")),
    form ? h("p", { class: "c-form" }, "→ ", h("b", { lang: LANG }, displayLemma(lemma)), " · ", form) : null,
    h("p", { class: "c-pos" }, pos),
    h("p", { class: "c-gloss" }, gloss),
    phrase ? h("p", { class: "c-phrase" }, h("b", { lang: LANG }, phrase.pl), " = ", phrase.en) : null,
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
      lang: a.word ? LANG : null, dataset: a.word ? { key: a.word, s: String(status(a.word)) } : null,
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
$("#d-leave").addEventListener("click", endDialogue);
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
function reward(n) { st.coins += n; gainXP(n); sfx.coin(); }
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
  if (st.bag.some(id => want.includes(id))) return "?";
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
  const N = NPCS[id], s = npcState(id), lines = [], after = [];
  const has = item => st.bag.includes(item), other = st.bag.at(-1); // the last thing you picked up, for "that's not it"
  if (s.stage === "new") gainXP(5); // meeting someone
  let actions = null;
  const finishQuest = (qid, Q) => {
    lines.push(...NPCS[qid].done || []);
    consume(Q.item); npcState(qid).stage = "done"; reward(Q.reward); wordDelivered(Q.item);
    after.push(() => { sfx.ok(); toast(`Errand done for ${NPCS[qid].name}. +${Q.reward} ${CURRENCY}`); });
  };
  const followUp = () => {
    if (N.orders) lines.push(newOrder(id));
    if (N.quiz) { const q = quizTurn(id); lines.push(...q.lines); actions = q.actions; }
    if (N.music) after.push(() => sfx.tune());
  };
  if (N.receive && npcState(N.receive.from).stage === "active" && has(N.receive.item)) {
    // meeting someone for the first time with their delivery in hand: say hello, and keep their own errand open
    if (s.stage === "new") { lines.push(...N.intro); s.stage = N.quest ? "active" : "done"; }
    lines.push(...N.receive.lines);
    const from = N.receive.from, Q = NPCS[from].quest;
    consume(N.receive.item); npcState(from).stage = "done"; reward(Q.reward); wordDelivered(Q.item);
    after.push(() => { sfx.ok(); toast(`Delivered for ${NPCS[from].name}. +${Q.reward} ${CURRENCY}`); });
  } else if (s.stage === "new") {
    lines.push(...N.intro);
    if (N.quest) {
      s.stage = "active";
      if (N.gives) { giveCarry(N.gives); after.push(() => toast(h("span", {}, `${N.name} gave you `, wordChip(N.gives), `. Take it to ${NPCS[N.quest.deliverTo].name}.`))); }
      else if (has(N.quest.item)) finishQuest(id, N.quest);
    } else s.stage = "done";
    if (s.stage === "done") followUp();
  } else if (s.stage === "active") {
    if (N.gives) {
      if (has(N.gives)) lines.push(N.remind);
      else { lines.push(...N.regive); giveCarry(N.gives); }
    } else if (has(N.quest.item)) {
      finishQuest(id, N.quest);
      followUp();
    } else if (other) { lines.push(N.wrong, thisIs(other), N.remind); sfx.no(); }
    else lines.push(N.remind);
  } else {
    if (N.thanks && !s.thanked) { lines.push(...N.thanks); s.thanked = true; }
    if (N.quiz) { const q = quizTurn(id, [pick(N.quiz.start)]); lines.push(...q.lines); actions = q.actions; }
    else if (N.orders) {
      if (s.order && has(s.order)) {
        lines.push(pick(N.orders.ok)); consume(s.order); reward(5); wordDelivered(s.order); s.order = null;
        after.push(() => sfx.ok());
        lines.push(newOrder(id));
      } else if (s.order && other) { lines.push(N.wrong, thisIs(other), fillOrder(id)); sfx.no(); }
      else if (s.order) lines.push(fillOrder(id));
      else lines.push(newOrder(id));
    } else {
      if (N.chats) { lines.push(...N.chats[(s.chat || 0) % N.chats.length]); s.chat = (s.chat || 0) + 1; } // a new conversation each visit
      else lines.push(pick(N.after));
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
// the bag (torba): up to BAG_SIZE things; people take what they need when you talk to them
function giveCarry(id) {
  if (st.bag.includes(id)) return;
  if (st.bag.length >= BAG_SIZE) { const out = st.bag.shift(); placeItem(out, true); toast(`Your bag was full, so ${ITEMS[out].word} went back.`); }
  st.bag.push(id); removeItem(id); setCarryVisual(); sfx.pop();
}
function consume(id) {
  const i = st.bag.indexOf(id); if (i < 0) return;
  st.bag.splice(i, 1); setCarryVisual();
  if (!ITEMS[id].story) setTimeout(() => placeItem(id, true), 900);
}
function pickUp(id) {
  if (st.bag.length >= BAG_SIZE) { sfx.no(); toast("Your bag is full. Put something back first (press I)."); return; }
  removeItem(id); st.bag.push(id); setCarryVisual(); sfx.pop();
  markSeen([ITEMS[id].word]);
  save(); renderTracker();
}
function putBack(id = st.bag.at(-1)) {
  const i = st.bag.indexOf(id); if (i < 0) return;
  st.bag.splice(i, 1); placeItem(id, true); setCarryVisual(); sfx.tick(); save(); renderTracker();
}
function renderBag() {
  $("#bag-slots").replaceChildren(...st.bag.map(id => h("img", { src: itemThumb(id), alt: ITEMS[id].word, width: "30", height: "30" })));
  $("#bag-count").textContent = `${st.bag.length}/${BAG_SIZE}`;
  $("#bagbar").hidden = !introClosed;
  $("#bag-list").replaceChildren(...Array.from({ length: BAG_SIZE }, (_, i) => {
    const id = st.bag[i];
    return id
      ? h("li", { class: "slot" }, h("img", { src: itemThumb(id), alt: "", width: "44", height: "44" }), wordChip(id), h("button", { type: "button", class: "ghost", onclick: () => putBack(id) }, "Put back"))
      : h("li", { class: "slot empty" }, h("span", {}, "empty"));
  }));
}
function toggleBag(force) { const b = $("#bag"), open = force ?? b.hidden; b.hidden = !open; if (open) { renderBag(); $("#settings").hidden = true; } }
$("#bagbar").addEventListener("click", () => toggleBag());
function renderXP() {
  const { level, into, need } = levelOf(st.xp);
  $("#xp-level").replaceChildren(wordBtn(UI.level[0].toUpperCase() + UI.level.slice(1), "w"), ` ${level}`);
  $("#xp-fill").style.width = (into / need * 100).toFixed(1) + "%";
  $("#xp-num").textContent = `${into} / ${need} XP`;
}

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
  renderBag(); renderXP();
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
// most common first; words outside the top 3000 after, in alphabetical order
const rankOf = k => FREQ_RANK.get(k) ?? Infinity;
const byFrequency = (a, b) => rankOf(a) - rankOf(b) || a.localeCompare(b, "pl");
let vTab = "mine", fPage = 0, sources = null;
$("#v-tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  vTab = b.dataset.tab; $$("#v-tabs button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderVocab();
});
$("#f-pages").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; fPage = +b.dataset.page; renderFreq(); $("#f-list").scrollTop = 0; });
function renderFreq() {
  if (!sources) { sources = wordSources(); for (const L of labels) if (L.key) { if (!sources.has(L.key)) sources.set(L.key, new Set()); sources.get(L.key).add("a label"); } }
  const inGame = w => sources.has(w) && !!lookup(w);
  $("#f-pages").replaceChildren(...Array.from({ length: Math.ceil(FREQ.length / 100) }, (_, p) => {
    const n = FREQ.slice(p * 100, p * 100 + 100).filter(inGame).length;
    return h("button", { type: "button", dataset: { page: String(p) }, "aria-pressed": String(p === fPage), title: `${n} of these 100 are in the game` }, `${p * 100 + 1}–${p * 100 + 100}`);
  }));
  $("#f-pages").children[fPage]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  const from = fPage * 100, page = FREQ.slice(from, from + 100);
  const have = page.filter(inGame), known = have.filter(w => status(w) === 2).length, learning = have.filter(w => status(w) === 1).length;
  $("#f-summary").textContent = `${have.length} of these 100 are in the game. You know ${known} and are learning ${learning}.`;
  $("#f-list").replaceChildren(...page.map((w, i) => {
    const there = inGame(w), who = there ? [...sources.get(w)] : [];
    const where = !there ? "not in the game yet" : who.length ? (who.length > 3 ? `${who.slice(0, 3).join(", ")} +${who.length - 3}` : who.join(", ")) : "in the game";
    return h("li", { class: "f-row" + (there ? "" : " missing") },
      h("span", { class: "f-rank" }, String(from + i + 1)),
      there ? wordBtn(w, "w") : h("span", { class: "f-missing", lang: LANG }, w),
      h("span", { class: "f-gloss" }, there ? meaningOf(w).gloss : ""),
      h("span", { class: "f-where" }, where));
  }));
}
function renderVocab() {
  $("#v-mine").hidden = vTab !== "mine"; $("#v-freq").hidden = vTab !== "freq";
  if (vTab === "freq") return renderFreq();
  const c = counts(), q = $("#v-search").value.trim().toLowerCase();
  const bar = $("#v-bar").children, tot = c.total || 1;
  bar[0].style.width = (c.known / tot * 100) + "%"; bar[1].style.width = (c.learning / tot * 100) + "%"; bar[2].style.width = (c.fresh / tot * 100) + "%";
  $("#v-summary").textContent = `${c.known} known, ${c.learning} learning, ${c.fresh} new. You've met ${c.met} of the ${c.total} words on the square.`;
  const met = Object.keys(st.words).filter(k => lookup(k) && ((st.words[k].seen || 0) > 0 || status(k) > 0));
  const list = met.filter(k => vFilter === "all" || String(status(k)) === vFilter)
    .filter(k => !q || k.includes(q) || meaningOf(k).gloss.toLowerCase().includes(q))
    .sort(byFrequency);
  const ul = $("#v-list");
  ul.replaceChildren(...list.map(l => {
    const s = status(l);
    return h("li", { class: "v-row" }, wordBtn(displayWord(l), "w"), h("span", { class: "v-gloss" }, FREQ_RANK.has(l) ? h("b", { class: "v-rank", title: "How common it is: 1 is the most common word in Polish" }, `#${FREQ_RANK.get(l)}`) : null, meaningOf(l).gloss),
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
$$("[data-close]").forEach(b => b.addEventListener("click", () => { const id = b.dataset.close; if (id === "vocab") toggleVocab(false); else if (id === "bag") toggleBag(false); else closeReview(); }));

// ===================================================================
// review (Powtórka)
// ===================================================================
let rv = null;
function openReview(kind) {
  const deck = (Object.keys(st.words).filter(k => lookup(k) && (kind === "learning" ? status(k) === 1 : status(k) === 0 && (st.words[k].seen || 0) > 0))).sort(byFrequency); // most common first
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
  const word = h("div", { class: "r-word", dataset: { s: String(s) }, lang: LANG }, displayWord(l));
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
// the language: every text outside the people's lines that names it, and the switcher
function applyLanguageText() {
  const name = LANGS[LANG].name;
  document.documentElement.lang = "en";
  $$(".lang-name").forEach(el => (el.textContent = name));
  $("#d-line").lang = LANG; $("#currency").textContent = CURRENCY;
  $("#coins-box").title = `${LANGS[LANG].money[0].toUpperCase() + LANGS[LANG].money.slice(1)} earned from errands`;
  $("#v-search").placeholder = `Search ${name} or English`;
  UI.examples.forEach((w, i) => { const el = $("#ex-" + i); el.textContent = w; el.lang = LANG; });
  $("#s-lang").replaceChildren(...Object.entries(LANGS).filter(([code]) => L10N[code]).map(([code, l]) => h("option", { value: code, selected: code === LANG }, `${l.name} (${l.native})`)));
}
$("#s-lang").addEventListener("change", e => {
  try { localStorage.setItem(LANG_KEY, e.target.value); } catch {}
  location.hash = "lang=" + e.target.value;
  location.reload();
});
$("#s-rate").addEventListener("change", e => { st.settings.rate = +e.target.value; save(); speak(UI.hello); });
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
  $("#intro-progress").textContent = st.started ? `${c.known} known · ${c.learning} learning · ${st.coins} ${CURRENCY}` : "";
  updateTouchUI();
}
function closeIntro() {
  if (introClosed) return;
  introClosed = true; $("#intro").hidden = true; audio();
  if (canSpeak) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch {} }
  const first = !st.started;
  st.started = true; save(); updateTouchUI(); renderBag();
  if (first) setTimeout(() => toast(`${NPCS.jozef.name} by the fountain has a ! over his head. Walk up and talk to him.`), 600);
  $("#scene").focus();
}
$("#start").addEventListener("click", closeIntro);
$("#btn-help").addEventListener("click", showIntro);
