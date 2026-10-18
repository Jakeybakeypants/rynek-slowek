
// ===================================================================
// player + camera
// ===================================================================
const player = { pos: new THREE.Vector3(0, 0, 19.5), heading: Math.PI, speed: 0, phase: 0, group: null, parts: null };
const cam = { yaw: 0, pitch: 0.42, dist: 8.5, cur: 8.5, target: new THREE.Vector3(0, 1.5, 19.5) };
function buildPlayer() {
  player.group = makePerson({ shirt: "#2B4FB8", pants: "#2C2F3A", hair: "#3B2A20", backpack: "#E9B53B", skin: "#E8B896" });
  player.parts = player.group.userData.parts;
  scene.add(player.group);
}
const angLerp = (a, b, t) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; };
function collide(p, r) {
  for (let pass = 0; pass < 2; pass++) {
    for (const b of boxColliders) {
      const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x += dx / d * (r - d); p.z += dz / d * (r - d); }
      else {
        const m = Math.min(p.x - b.x0, b.x1 - p.x, p.z - b.z0, b.z1 - p.z);
        if (m === p.x - b.x0) p.x = b.x0 - r; else if (m === b.x1 - p.x) p.x = b.x1 + r; else if (m === p.z - b.z0) p.z = b.z0 - r; else p.z = b.z1 + r;
      }
    }
    for (const c of circleColliders) {
      const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = r + c.r;
      if (d < m && d > 1e-6) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
    }
  }
  p.x = clamp(p.x, -26.6, 26.6); p.z = clamp(p.z, -26.6, 26.6);
}
const keys = new Set();
const stick = { x: 0, y: 0, id: null };
const movementBlocked = () => dlg.open || !introClosed || !$("#review").hidden;
function updatePlayer(dt, T) {
  let ix = 0, iz = 0;
  if (!movementBlocked()) {
    if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) iz += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) iz -= 1;
    ix += stick.x; iz -= stick.y;
  }
  const len = Math.hypot(ix, iz);
  if (len > 1) { ix /= len; iz /= len; }
  const run = keys.has("ShiftLeft") || keys.has("ShiftRight") || Math.hypot(stick.x, stick.y) > 0.92;
  const target = len > 0.05 ? (run ? 7.2 : 4.3) * Math.min(1, len) : 0;
  player.speed += (target - player.speed) * (1 - Math.exp(-dt * 10));
  if (len > 0.05) {
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    const mx = fx * iz + rx * ix, mz = fz * iz + rz * ix, ml = Math.hypot(mx, mz) || 1;
    player.pos.x += mx / ml * player.speed * dt; player.pos.z += mz / ml * player.speed * dt;
    player.heading = angLerp(player.heading, Math.atan2(mx, mz), 1 - Math.exp(-dt * 12));
  } else if (dlg.open && npcObjs[dlg.npc]) {
    const o = npcObjs[dlg.npc]; player.heading = angLerp(player.heading, Math.atan2(o.x - player.pos.x, o.z - player.pos.z), 1 - Math.exp(-dt * 6));
  }
  collide(player.pos, 0.4);
  player.group.position.copy(player.pos); player.group.rotation.y = player.heading;
  const p = player.parts, k = clamp(player.speed / 4.3, 0, 1.6);
  player.phase += dt * (3 + player.speed * 2);
  const sw = Math.sin(player.phase) * 0.6 * Math.min(1, k);
  p.legs[0].rotation.x = sw; p.legs[1].rotation.x = -sw;
  const holding = st.bag.length > 0;
  p.arms[0].rotation.x = holding ? -1.1 : -sw * 0.8; p.arms[1].rotation.x = holding ? -1.1 : sw * 0.8;
  p.body.position.y = (p.bodyY ?? 0) + Math.abs(Math.sin(player.phase)) * 0.05 * Math.min(1, k) + Math.sin(T * 1.6) * 0.004;
  if (p.shins) {
    // knees bend as each foot swings through; elbows stay a little bent
    const w = Math.min(1, k);
    p.shins[0].rotation.x = Math.max(0, Math.sin(player.phase - 1.3)) * 1.0 * w;
    p.shins[1].rotation.x = Math.max(0, Math.sin(player.phase - 1.3 + Math.PI)) * 1.0 * w;
    for (const f of p.forearms) f.rotation.x = holding ? -0.6 : -0.15 - 0.35 * w;
  }
}
const ray = new THREE.Ray(), hit = new THREE.Vector3(), tmp = new THREE.Vector3(), off = new THREE.Vector3();
function updateCamera(dt, T) {
  if (!introClosed) {
    cam.yaw += dt * 0.06;
    tmp.set(0, 4, 4);
    cam.target.lerp(tmp, 1 - Math.exp(-dt * 2));
    off.set(Math.sin(cam.yaw) * Math.cos(0.38), Math.sin(0.38), Math.cos(cam.yaw) * Math.cos(0.38));
    camera.position.copy(cam.target).addScaledVector(off, 26);
    camera.lookAt(cam.target);
    return;
  }
  const o = dlg.open && npcObjs[dlg.npc];
  if (o) tmp.set((player.pos.x + o.x) / 2, 1.4, (player.pos.z + o.z) / 2); else tmp.set(player.pos.x, 1.5, player.pos.z);
  cam.target.lerp(tmp, 1 - Math.exp(-dt * 8));
  cam.cur += ((o ? 6 : cam.dist) - cam.cur) * (1 - Math.exp(-dt * 4));
  off.set(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
  let d = cam.cur;
  ray.origin.copy(cam.target); ray.direction.copy(off);
  for (const b of occluders) if (ray.intersectBox(b, hit)) { const hd = hit.distanceTo(cam.target); if (hd < d) d = Math.max(1.6, hd - 0.4); }
  camera.position.copy(cam.target).addScaledVector(off, d);
  if (camera.position.y < 0.4) camera.position.y = 0.4;
  camera.lookAt(cam.target);
}

// ===================================================================
// NPCs + items animation, interaction
// ===================================================================
function updateNPCs(dt, T) {
  for (const o of Object.values(npcObjs)) {
    const dx = player.pos.x - o.x, dz = player.pos.z - o.z, d = Math.hypot(dx, dz), talking = dlg.open && dlg.npc === o.id;
    const want = d < 5 || talking ? Math.atan2(dx, dz) : o.base;
    o.heading = angLerp(o.heading, want, 1 - Math.exp(-dt * 4)); o.group.rotation.y = o.heading;
    const tt = T + o.phase, p = o.parts;
    if (o.dog) {
      const happy = npcState(o.id).stage === "done";
      p.tail.rotation.y = Math.sin(tt * (talking ? 16 : happy ? 11 : 4)) * (happy || talking ? 0.7 : 0.35);
      p.head.rotation.z = talking ? Math.sin(T * 2.4) * 0.2 : 0;
      continue;
    }
    if (o.cat) {
      const asleep = npcState("filemon").stage === "done" && !talking;
      p.tail.rotation.y = Math.sin(tt * (asleep ? 0.8 : 2.2)) * 0.5;
      p.head.rotation.x = asleep ? 0.45 : Math.sin(tt * 0.7) * 0.08;
      continue;
    }
    p.body.position.y = (p.bodyY ?? 0) + Math.sin(tt * 1.8) * 0.008;
    p.head.rotation.y = Math.sin(tt * 0.5) * 0.15;
    const waving = o.id === "marek" && Math.sin(tt * 0.4) > 0.93;
    if (talking) { p.arms[1].rotation.x = -0.5 + Math.sin(T * 5) * 0.25; p.arms[0].rotation.x = Math.sin(T * 3) * 0.1; }
    else if (waving) { p.arms[1].rotation.x = -2.6; p.arms[1].rotation.z = Math.sin(T * 9) * 0.3; }
    else { p.arms[0].rotation.x = Math.sin(tt * 1.2) * 0.05; p.arms[1].rotation.x = -Math.sin(tt * 1.2) * 0.05; p.arms[1].rotation.z = 0; }
    if (p.forearms) {
      p.forearms[1].rotation.x = talking ? -0.7 + Math.sin(T * 4) * 0.3 : waving ? -0.5 : -0.15;
      p.forearms[0].rotation.x = o.id === "staszek" || talking ? -0.9 : -0.15; // Staszek holds his accordion
      if (o.id === "staszek") p.arms[0].rotation.x = p.arms[1].rotation.x = -0.35;
    }
    if (o.kid) o.group.position.y = Math.abs(Math.sin(tt * 3.2)) * (talking ? 0 : 0.06);
  }
}
function updateItems(dt, T) {
  for (const o of Object.values(itemObjs)) {
    if (!o.available) continue;
    o.pop = Math.min(1, o.pop + dt * 3);
    const s = o.pop < 1 ? 1 + Math.sin(o.pop * Math.PI) * 0.35 : 1;
    o.model.scale.setScalar((ITEM_SCALE[o.id] ?? 1.5) * Math.min(1, o.pop * 1.4) * s);
    o.model.position.y = Math.sin(T * 2.2 + o.phase) * 0.04;
    o.model.rotation.y += dt * 0.6;
    o.ring.material.opacity = 0.35 + Math.sin(T * 3) * 0.15;
  }
}
let near = null;
function findNear() {
  let best = null, bd = 99;
  for (const o of Object.values(npcObjs)) { const d = Math.hypot(o.x - player.pos.x, o.z - player.pos.z); if (d < 2.7 && d < bd) { bd = d; best = { kind: "npc", id: o.id }; } }
  for (const o of Object.values(itemObjs)) {
    if (!o.available) continue;
    const d = Math.hypot(o.group.position.x - player.pos.x, o.group.position.z - player.pos.z);
    if (d < 1.6 && d - 0.6 < bd) { bd = d - 0.6; best = { kind: "item", id: o.id }; }
  }
  return best;
}
function updateInteract() {
  const n = introClosed && !movementBlocked() ? findNear() : null;
  if (near?.kind === "item" && (n?.id !== near.id)) itemObjs[near.id]?.label.btn.classList.remove("near");
  if (n?.kind === "item") itemObjs[n.id].label.btn.classList.add("near");
  near = n; setPrompt(n);
}
function interact() {
  if (!introClosed) return closeIntro();
  if (dlg.open) return nextLine();
  if (!$("#review").hidden) return revealReview();
  if (near) tryInteract(near);
}
function tryInteract(t) {
  if (!introClosed || dlg.open) return;
  const pos = t.kind === "npc" ? new THREE.Vector3(npcObjs[t.id].x, 0, npcObjs[t.id].z) : itemObjs[t.id].group.position;
  const d = Math.hypot(pos.x - player.pos.x, pos.z - player.pos.z);
  if (d > (t.kind === "npc" ? 3.2 : 2.2)) { toast(t.kind === "npc" ? `Walk closer to talk to ${NPCS[t.id].name}.` : "Walk closer to pick that up."); return; }
  if (t.kind === "npc") talk(t.id); else if (itemObjs[t.id].available) pickUp(t.id);
}

// ===================================================================
// world labels
// ===================================================================
const lv = new THREE.Vector3();
function updateLabels(frame) {
  const W = innerWidth, H = innerHeight, cp = camera.position;
  for (const L of labels) {
    let show = true;
    if (L.anchor) { if (!L.anchor.visible) show = false; else { L.anchor.getWorldPosition(lv); lv.y += L.y; } } else lv.copy(L.pos);
    const d = show ? Math.hypot(lv.x - player.pos.x, lv.z - player.pos.z) : 0;
    if (show && (d > L.max || !introClosed && L.max < 30)) show = false;
    if (show) {
      const cd = lv.distanceTo(cp);
      if ((frame & 3) === L.slot || !L.shown) {
        ray.origin.copy(cp); ray.direction.copy(lv).sub(cp).normalize(); L.occ = false;
        for (const b of occluders) if (ray.intersectBox(b, hit) && hit.distanceTo(cp) < cd - 0.6) { L.occ = true; break; }
      }
      if (L.occ) show = false;
    }
    if (show) { lv.project(camera); if (lv.z > 1 || lv.z < -1) show = false; }
    if (!show) { if (L.shown) { L.el.hidden = true; L.shown = false; } continue; }
    if (!L.shown) { L.el.hidden = false; L.shown = true; if (L.key && d < 6 && !L.met) { L.met = true; markSeen([L.key]); } }
    else if (L.key && !L.met && d < 6) { L.met = true; markSeen([L.key]); }
    const x = (lv.x * 0.5 + 0.5) * W, y = (-lv.y * 0.5 + 0.5) * H;
    L.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-100%)`;
    L.el.style.opacity = Math.min(1, (L.max - d) / 2.5).toFixed(2);
    L.el.style.zIndex = String(2000 - Math.round(d * 10));
  }
}

// ===================================================================
// minimap
// ===================================================================
const mm = $("#minimap"), mmc = mm.getContext("2d");
let palette = {};
function readPalette() { const cs = getComputedStyle(document.documentElement); for (const k of ["glaze", "glaze-2", "rim", "ink", "ink-2", "gold"]) palette[k] = cs.getPropertyValue("--" + k).trim(); }
function drawMinimap() {
  const css = mm.clientWidth; if (!css) return;
  const dpr = Math.min(2, devicePixelRatio || 1), S = Math.round(css * dpr);
  if (mm.width !== S) { mm.width = S; mm.height = S; }
  const g = mmc, sc = S / 2 / 34, X = x => S / 2 + x * sc, Z = z => S / 2 + z * sc;
  g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); g.clip();
  g.fillStyle = palette.rim; g.globalAlpha = 0.28; g.fillRect(0, 0, S, S); g.globalAlpha = 1;
  g.fillStyle = palette.glaze; g.fillRect(X(-27), Z(-27), 54 * sc, 54 * sc);
  g.fillStyle = palette["glaze-2"]; g.fillRect(X(-7.2), Z(-14.2), 14.4 * sc, 9.4 * sc); g.fillRect(X(-16.3), Z(1.1), 4.6 * sc, 1.8 * sc);
  g.beginPath(); g.arc(X(0), Z(6), 3.4 * sc, 0, Math.PI * 2); g.fillStyle = "#5FA8D3"; g.fill();
  for (const o of Object.values(npcObjs)) {
    const m = o.mark.textContent;
    g.beginPath(); g.arc(X(o.x), Z(o.z), (m ? 3.4 : 2.4) * dpr, 0, Math.PI * 2); g.fillStyle = m ? palette.gold : palette["ink-2"]; g.fill();
  }
  g.save(); g.translate(X(player.pos.x), Z(player.pos.z)); g.rotate(-player.heading + Math.PI);
  g.beginPath(); g.moveTo(0, -6 * dpr); g.lineTo(4.5 * dpr, 4.5 * dpr); g.lineTo(0, 2 * dpr); g.lineTo(-4.5 * dpr, 4.5 * dpr); g.closePath(); g.fillStyle = palette.rim; g.fill();
  g.restore(); g.restore();
}

// ===================================================================
// theme: daytime for light, dusk with lit lamps for dark
// ===================================================================
function isDark() { const t = document.documentElement.dataset.theme; return t === "dark" ? true : t === "light" ? false : matchMedia("(prefers-color-scheme: dark)").matches; }
function applySceneTheme() {
  const dark = isDark();
  skyMat.uniforms.top.value.set(dark ? 0x16224f : 0x5f9ee6);
  skyMat.uniforms.mid.value.set(dark ? 0xe39066 : 0xdcebf8);
  skyMat.uniforms.bottom.value.set(dark ? 0x3a3550 : 0xb8c4cf);
  scene.fog.color.set(dark ? 0x6a5a78 : 0xdde9f5);
  hemi.color.set(dark ? 0x7d86c4 : 0xcfe3ff); hemi.groundColor.set(dark ? 0x3a2e33 : 0x8c7a5e); hemi.intensity = dark ? 0.9 : 1.5;
  sun.color.set(dark ? 0xffa36b : 0xfff1d6); sun.intensity = dark ? 1.25 : 2.6; sun.position.set(dark ? -40 : 32, dark ? 22 : 48, dark ? 18 : 22);
  lampGlass.emissiveIntensity = dark ? 2.2 : 0.15;
  lampLights.forEach(l => (l.intensity = dark ? 7 : 0));
  renderer.toneMappingExposure = dark ? 1.15 : 1.05;
  readPalette();
}
new MutationObserver(applySceneTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applySceneTheme);

// ===================================================================
// input
// ===================================================================
addEventListener("keydown", e => {
  if (e.target.matches?.("input, textarea, select")) { if (e.key === "Escape") e.target.blur(); return; }
  const k = e.key.toLowerCase();
  if (k === "escape") {
    if (!card.hidden) closeCard(); else if (!$("#review").hidden) closeReview(); else if (!$("#settings").hidden) $("#settings").hidden = true;
    else if (!$("#bag").hidden) toggleBag(false);
    else if (!$("#vocab").hidden) toggleVocab(false); else if (dlg.open) endDialogue();
    return;
  }
  if (cardState && ["1", "2", "3"].includes(k)) { setStatus(cardState.key, +k - 1); return; }
  const onButton = !!e.target.closest?.("button");
  if (k === "e" || ((k === " " || k === "enter") && !onButton)) { e.preventDefault(); if (!e.repeat) interact(); return; }
  if (!introClosed) return;
  if (k === "v") { toggleVocab(); return; }
  if (k === "g") { putBack(); return; }
  if (k === "i" || k === "b") { toggleBag(); return; }
  if (dlg.open && k === "t") { toggleTr(); return; }
  if (dlg.open && k === "r") { speak(dlg.lines[dlg.i][0]); return; }
  if (e.code.startsWith("Arrow")) e.preventDefault();
  keys.add(e.code);
});
addEventListener("keyup", e => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
let drag = null;
canvas.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch") document.body.classList.add("touch");
  updateTouchUI();
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging");
});
canvas.addEventListener("pointermove", e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  if (!introClosed) return;
  const k = e.pointerType === "touch" ? 0.008 : 0.006;
  cam.yaw -= dx * k; cam.pitch = clamp(cam.pitch + dy * k * 0.8, 0.12, 1.2);
});
const endDrag = e => {
  if (!drag || e.pointerId !== drag.id) return;
  const tap = drag.moved < 8; drag = null; canvas.classList.remove("dragging");
  if (tap && introClosed && !dlg.open) {
    const rc = new THREE.Raycaster(), ndc = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    rc.setFromCamera(ndc, camera);
    const hits = rc.intersectObjects(clickables.filter(c => c.visible), true);
    for (const hh of hits) { let o = hh.object; while (o && !o.userData.target) o = o.parent; if (o) { tryInteract(o.userData.target); break; } }
  }
};
canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("wheel", e => { e.preventDefault(); cam.dist = clamp(cam.dist + e.deltaY * 0.01, 4, 15); }, { passive: false });
const stickEl = $("#stick"), knob = $("#knob");
stickEl.addEventListener("pointerdown", e => { stick.id = e.pointerId; stickEl.setPointerCapture(e.pointerId); moveStick(e); });
stickEl.addEventListener("pointermove", e => { if (e.pointerId === stick.id) moveStick(e); });
const stopStick = e => { if (e.pointerId !== stick.id) return; stick.id = null; stick.x = stick.y = 0; knob.style.transform = ""; };
stickEl.addEventListener("pointerup", stopStick); stickEl.addEventListener("pointercancel", stopStick);
function moveStick(e) {
  const r = stickEl.getBoundingClientRect(), R = r.width / 2;
  let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R); const d = Math.hypot(dx, dy);
  if (d > R) { dx *= R / d; dy *= R / d; }
  stick.x = dx / R; stick.y = dy / R; knob.style.transform = `translate(${dx * 0.6}px, ${dy * 0.6}px)`;
}
$("#act").addEventListener("click", interact);
function updateTouchUI() {
  const touch = document.body.classList.contains("touch") || MOBILE;
  if (touch) document.body.classList.add("touch");
  $("#touch").hidden = !touch || !introClosed;
  $("#stick").hidden = dlg.open;
  promptKey = "~"; setPrompt(near);
}

// ===================================================================
// loop + boot
// ===================================================================
function resize() {
  const w = innerWidth, hh = innerHeight;
  renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
let last = performance.now(), frame = 0, T = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; frame++; T += dt;
  updatePlayer(dt, T); updateNPCs(dt, T); updateItems(dt, T); updatePigeons(dt, T); updateFountain(dt);
  for (const c of clouds) { c.position.x += dt * 1.2; if (c.position.x > 170) c.position.x = -170; }
  updateCamera(dt, T);
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
  updateLabels(frame); updateInteract();
  if (frame % 6 === 0) drawMinimap();
}
function afterStateLoaded() {
  syncWorldFromState(); syncSettingsUI(); refreshWordViews(); renderTracker(); refreshCounts();
  if (!introClosed) showIntro();
}
function boot(hot) {
  st = normalize(loadLocal());
  headingWord("#tracker-title", "zadania"); headingWord("#vocab-title", "słownik"); headingWord("#review-title", "powtórka"); headingWord("#bag-title", "torba");
  buildGround(); buildRows(); buildBackdrop(); buildRatusz(); buildChurch(); buildFountain(); buildStall(); buildShops(); buildProps(); buildClouds();
  buildPlayer(); placeNPCs(); placeItems(); buildPigeons();
  if (hot && typeof hot.px === "number") { player.pos.set(hot.px, 0, hot.pz); cam.yaw = hot.yaw ?? 0; player.heading = hot.heading ?? Math.PI; }
  cam.target.set(0, 4, 4);
  applySceneTheme(); resize(); afterStateLoaded(); setSync(syncNote);
  requestAnimationFrame(t => { last = t; loop(t); });
  connectRemote();
  try { window.claude?.hot?.snapshot?.(() => ({ px: player.pos.x, pz: player.pos.z, yaw: cam.yaw, heading: player.heading })); } catch {}
}
let booted = false;
const bootOnce = data => { if (booted) return; booted = true; boot(data || {}); };
try {
  if (window.claude?.hot?.ready) { window.claude.hot.ready(bootOnce); setTimeout(() => bootOnce(window.claude?.hot?.data ?? {}), 1500); }
  else bootOnce(window.claude?.hot?.data ?? {});
} catch { bootOnce({}); }
window.__rynek = { modelledPeople: !!PEOPLE, get st() { return st; }, validateLexicon, talk, player, cam, npcObjs, itemObjs, interact, pickUp, setStatus, HOMES };
