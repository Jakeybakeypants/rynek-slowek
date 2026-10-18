
// ===================================================================
// props around the square
// ===================================================================
const WOOD = "#9A6A3E", WOOD_D = "#6E4A2B", IRON = "#2D3A33";
function bench(x, z, rot) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(1.8, 0.05, 0.14), M(WOOD), 0, 0.46, -0.16 + i * 0.16));
  for (let i = 0; i < 2; i++) g.add(mesh(new THREE.BoxGeometry(1.8, 0.12, 0.04), M(WOOD), 0, 0.68 + i * 0.18, -0.26));
  for (const s of [-0.75, 0.75]) { g.add(mesh(new THREE.BoxGeometry(0.06, 0.46, 0.46), M(IRON), s, 0.23, 0)); g.add(mesh(new THREE.BoxGeometry(0.06, 0.5, 0.05), M(IRON), s, 0.7, -0.26)); }
  const c = Math.cos(rot), s = Math.sin(rot);
  addCircle(x + c * 0.5, z - s * 0.5, 0.45); addCircle(x - c * 0.5, z + s * 0.5, 0.45);
  addWordLabel({ word: "ławka", anchor: g, y: 1.25, max: 6, kind: "small" });
}
function tree(x, z, k = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(k); scene.add(g);
  g.add(mesh(new THREE.CylinderGeometry(0.17, 0.26, 2.4, 7), M("#6B4A30"), 0, 1.2, 0));
  const greens = ["#4E8A3E", "#5E9C45", "#447A36"];
  [[0, 3.1, 0, 1.5], [0.6, 3.8, 0.3, 1.1], [-0.5, 4.2, -0.2, 0.95], [0.1, 4.8, 0.1, 0.75]].forEach(([a, b, c, r], i) =>
    g.add(mesh(new THREE.IcosahedronGeometry(r, 0), M(greens[i % 3]), a, b, c)));
  addCircle(x, z, 0.45 * k);
  addWordLabel({ word: "drzewo", anchor: g, y: 5.9, max: 8, kind: "small" });
}
function lamp(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 8), M(IRON), 0, 0.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.3, 8), M(IRON), 0, 1.8, 0));
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.48, 0.34), lampGlass, 0, 3.65, 0, false));
  g.add(mesh(new THREE.ConeGeometry(0.3, 0.26, 4), M(IRON), 0, 4.0, 0));
  const pl = new THREE.PointLight(0xffc873, 0, 11, 1.6); pl.position.set(0, 3.5, 0); g.add(pl); lampLights.push(pl);
  addCircle(x, z, 0.25);
  addWordLabel({ word: "latarnia", anchor: g, y: 4.5, max: 5, kind: "small" });
}
function table(x, z, umbrella, labelTable) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16), M("#F2EEE6"), 0, 0.76, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.74, 8), M(IRON), 0, 0.38, 0));
  for (const a of [0.4, 0.4 + Math.PI]) {
    const ch = new THREE.Group(); ch.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85); ch.rotation.y = -a + Math.PI / 2;
    ch.add(mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), M("#B84A3A"), 0, 0.46, 0));
    ch.add(mesh(new THREE.BoxGeometry(0.42, 0.42, 0.04), M("#B84A3A"), 0, 0.7, 0.2));
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) ch.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 5), M(IRON), dx, 0.23, dz));
    g.add(ch);
  }
  if (umbrella) {
    g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 6), M("#E8E2D6"), 0, 1.2, 0));
    const um = new THREE.MeshStandardMaterial({ map: stripeTex("#F3EAD3", "#2F6B4F"), roughness: 0.9, side: THREE.DoubleSide });
    g.add(mesh(new THREE.ConeGeometry(1.7, 0.6, 8, 1, true), um, 0, 2.4, 0));
    if (umbrella === "label") addWordLabel({ word: "parasol", anchor: g, y: 3.05, max: 8, kind: "small" });
  }
  if (labelTable) addWordLabel({ word: "stół", anchor: g, y: 1.25, max: 6, kind: "small" });
  addCircle(x, z, 0.95);
}
function counter(cx, cz, alongZ, len, color) {
  const g = new THREE.Group(); g.position.set(cx, 0, cz); if (alongZ) g.rotation.y = Math.PI / 2; scene.add(g);
  g.add(mesh(new THREE.BoxGeometry(len, 0.08, 0.9), M(WOOD), 0, 0.92, 0));
  g.add(mesh(new THREE.BoxGeometry(len - 0.1, 0.84, 0.8), M(color), 0, 0.46, 0));
  return g;
}
function buildStall() {
  const g = new THREE.Group(); g.position.set(-14, 0, 2); scene.add(g);
  g.add(mesh(new THREE.BoxGeometry(4.4, 0.1, 1.6), M(WOOD), 0, 0.92, 0));
  g.add(mesh(new THREE.BoxGeometry(4.3, 0.8, 0.08), M(WOOD_D), 0, 0.5, 0.78));
  for (const [dx, dz] of [[-2.15, -0.75], [2.15, -0.75], [-2.15, 0.75], [2.15, 0.75]]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), M(WOOD_D), dx, 1.3, dz));
  const awn = mesh(new THREE.BoxGeometry(4.9, 0.06, 2.3), new THREE.MeshStandardMaterial({ map: stripeTex("#3F8F4F", "#F4F1E6"), roughness: 0.9 }), 0, 2.62, 0.1);
  awn.rotation.x = 0.16; g.add(awn);
  const fruit = ["#C8352E", "#C9CC4A", "#4B2463", "#F1D034", "#EE7A22", "#6EA33F"];
  for (let c = 0; c < 4; c++) {
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.26, 0.7), M("#C79A62"), -1.6 + c * 1.07, 1.1, -0.2));
    for (let k = 0; k < 7; k++) g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M(fruit[(c + k) % fruit.length]), -1.6 + c * 1.07 + (k % 4 - 1.5) * 0.18, 1.28 + (k > 3 ? 0.06 : 0), -0.2 + (k > 3 ? 0.12 : -0.12), false));
  }
  const wood = M("#4A3020");
  const board = new THREE.Mesh(new THREE.BoxGeometry(3, 0.48, 0.1), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: signTex("WARZYWNIAK", "#3F8F4F", "#FFFFFF") }), wood]);
  board.position.set(0, 2.3, 1.22); g.add(board);
  addWordLabel({ word: "warzywniak", pos: new THREE.Vector3(-14, 3.05, 3.3), max: 26, kind: "sign" });
  addWordLabel({ word: "stragan", pos: new THREE.Vector3(-16.6, 1.5, 2.9), max: 7, kind: "small" });
  addBox(-16.3, -11.7, 1.1, 2.9);
  [["jabłko", -16.6, 4.6], ["gruszka", -15.4, 5.6], ["śliwka", -14.2, 4.6], ["cytryna", -13.0, 5.6], ["marchewka", -11.8, 4.7]]
    .forEach(([id, x, z]) => { HOMES[id] = new THREE.Vector3(x, 0.3, z); });
}
function buildShops() {
  const b = SHOP.piekarnia.a, c = SHOP.kawiarnia.a, k = SHOP.kwiaciarnia.a;
  counter(-25.5, b + 3.0, true, 3.6, "#F0E2C8");
  ["chleb", "bułka", "ciastko", "drożdżówka", "szarlotka"].forEach((id, i) => { HOMES[id] = new THREE.Vector3(-25.5, 1.12, b + 3.0 + (i - 2) * 0.7); });
  addBox(-26.0, -25.0, b + 1.2, b + 4.8);
  counter(25.4, c + 3.1, true, 3.6, "#2F6B4F");
  ["kawa", "herbata", "woda", "sok", "mleko"].forEach((id, i) => { HOMES[id] = new THREE.Vector3(25.4, 1.12, c + 3.1 + (i - 2) * 0.7); });
  addBox(24.9, 25.9, c + 1.3, c + 4.9);
  table(20.0, c - 3.2, "label"); table(19.6, c + 2.2, true); table(16.8, c - 0.4, true, true);
  const bucket = M("#9AA6AE", { m: 0.4, r: 0.5 });
  ["róża", "lilia", "stokrotka", "orchidea"].forEach((id, i) => {
    const x = k + 1.6 + i * 1.0;
    scene.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.46, 12), bucket, x, 0.23, 25.5));
    HOMES[id] = new THREE.Vector3(x, 0.75, 25.5);
  });
  for (const [dx, col] of [[-2.4, "#E25A6B"], [-3.4, "#F2C14E"]]) {
    scene.add(mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.46, 12), bucket, k + dx, 0.23, 25.5));
    for (let f = 0; f < 6; f++) scene.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), M(col), k + dx + Math.cos(f) * 0.14, 0.62 + (f % 2) * 0.1, 25.5 + Math.sin(f) * 0.14, false));
  }
  addBox(k + 1.2, k + 5.0, 25.2, 25.9); addBox(k - 3.8, k - 2.0, 25.2, 25.9);
  const sb = new THREE.Group(); sb.position.set(15.5, 0, 14.5); scene.add(sb);
  sb.add(mesh(new THREE.BoxGeometry(3.4, 0.06, 3.4), M("#E9D39A"), 0, 0.12, 0, false));
  for (const [x, z, w, d] of [[0, -1.75, 3.6, 0.15], [0, 1.75, 3.6, 0.15], [-1.75, 0, 0.15, 3.6], [1.75, 0, 0.15, 3.6]]) sb.add(mesh(new THREE.BoxGeometry(w, 0.3, d), M(WOOD), x, 0.15, z));
  addWordLabel({ word: "piaskownica", anchor: sb, y: 0.9, max: 8, kind: "small" });
  HOMES.lalka = new THREE.Vector3(14.7, 0.32, 15.4); HOMES.miś = new THREE.Vector3(17.9, 0.3, 12.2); HOMES.latawiec = new THREE.Vector3(18.6, 0.2, 17.0);
  HOMES.piłka = new THREE.Vector3(2.5, 0.28, -19.5); HOMES.okulary = new THREE.Vector3(-2.6, 0.92, 3.9); HOMES.klucze = new THREE.Vector3(-19.6, 0.12, 14.6);
}
function buildProps() {
  bench(6.9, 11.3, -2.4); bench(-6.9, 11.3, 2.4); bench(9.6, -1.6, -0.5); bench(-9.6, -1.6, 0.5); bench(-19.6, 14.6, Math.PI / 2); bench(20.2, 11.4, -Math.PI / 2);
  [[-21.5, 21.5, 1.1], [-8.5, 22, 0.95], [8.5, 22, 1], [21.5, 21.2, 1.1], [-21.5, -19, 1.15], [21.5, -19, 1.05], [-11, -20.5, 0.9], [11, -20.5, 0.95], [-21.5, 2, 1], [22, 17, 0.9]]
    .forEach(([x, z, k]) => tree(x, z, k));
  [[-9.5, 7.5], [9.5, 7.5], [-3.8, 14.8], [3.8, 14.8], [-17, -3.5], [17, -3.5], [-15, 18.5], [15, 19.5], [-9, -16], [9, -16]].forEach(([x, z]) => lamp(x, z));
}
function buildClouds() {
  const R = rng(42), mat = M("#FFFFFF", { e: 0xffffff, ei: 0.25, r: 1 });
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 4; k++) g.add(mesh(new THREE.IcosahedronGeometry(3 + R() * 3, 0), mat, k * 3.5 - 5, R() * 1.5, R() * 3, false));
    g.position.set(-150 + R() * 300, 55 + R() * 25, -150 + R() * 300); g.scale.y = 0.55; scene.add(g); clouds.push(g);
  }
}
const clouds = [];

// ===================================================================
// people
// ===================================================================
function makePerson(o) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const skin = M(o.skin ?? "#EBC09C"), shirt = M(o.shirt), pants = M(o.pants ?? "#3B4252"), hair = M(o.hair ?? "#3B2A20"), shoe = M("#2B2B2B");
  body.add(mesh(new THREE.CapsuleGeometry(0.27, 0.5, 4, 10), shirt, 0, 1.08, 0));
  const legs = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(0.12 * s, 0.78, 0); p.add(mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.72, 8), pants, 0, -0.36, 0)); p.add(mesh(new THREE.BoxGeometry(0.15, 0.08, 0.26), shoe, 0, -0.74, 0.04)); g.add(p); return p; });
  const arms = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(0.34 * s, 1.36, 0); p.add(mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.58, 8), shirt, 0, -0.29, 0)); p.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), skin, 0, -0.6, 0)); body.add(p); return p; });
  const head = new THREE.Group(); head.position.y = 1.66; body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.21, 16, 12), skin));
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.028, 6, 5), M("#1A1A1A"), 0.075 * s, 0.03, 0.185, false));
  const mouth = mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 10, Math.PI), M("#7A2E2E"), 0, -0.07, 0.19, false); mouth.rotation.z = Math.PI; head.add(mouth);
  if (!o.bald) { const hr = mesh(new THREE.SphereGeometry(0.225, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hair); hr.rotation.x = -0.3; head.add(hr); }
  if (o.apron) body.add(mesh(new THREE.BoxGeometry(0.44, 0.62, 0.04), M(o.apron), 0, 0.95, 0.27));
  if (o.moustache) head.add(mesh(new THREE.BoxGeometry(0.15, 0.035, 0.04), M(o.moustache), 0, -0.04, 0.2, false));
  if (o.hat === "toque") { head.add(mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.18, 12), M("#FFFFFF"), 0, 0.22, 0)); const t = mesh(new THREE.SphereGeometry(0.21, 12, 8), M("#FFFFFF"), 0, 0.33, 0); t.scale.y = 0.6; head.add(t); }
  if (o.hat === "cap") { head.add(mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.08, 14), M(o.hatColor), 0, 0.17, -0.01)); head.add(mesh(new THREE.BoxGeometry(0.22, 0.03, 0.14), M(o.hatColor), 0, 0.15, 0.2)); }
  if (o.hat === "kidcap") { const c = mesh(new THREE.SphereGeometry(0.228, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), M(o.hatColor)); head.add(c); head.add(mesh(new THREE.BoxGeometry(0.2, 0.025, 0.16), M(o.hatColor), 0, 0.12, -0.25)); }
  if (o.hat === "scarf") { const c = mesh(new THREE.SphereGeometry(0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), M(o.hatColor)); c.rotation.x = -0.5; head.add(c); head.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), M(o.hatColor), 0, -0.2, 0.12)); }
  if (o.ponytail) head.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), hair, 0, 0.02, -0.24));
  if (o.flower) head.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), M(o.flower), 0.17, 0.12, 0.06, false));
  if (o.cane) arms[1].add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6), M("#6B4A30"), 0, -0.6, 0.06));
  if (o.backpack) body.add(mesh(new THREE.BoxGeometry(0.38, 0.44, 0.18), M(o.backpack), 0, 1.12, -0.3));
  const specs = new THREE.Group(); specs.visible = false; head.add(specs);
  for (const s of [-1, 1]) specs.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), M("#222222"), 0.075 * s, 0.03, 0.2, false));
  g.scale.setScalar(o.scale ?? 1);
  g.userData.parts = { body, legs, arms, head, specs };
  return g;
}
function makeCat() {
  const g = new THREE.Group(), fur = M("#8E98A4"), white = M("#F2F2F2");
  const body = mesh(new THREE.SphereGeometry(0.3, 12, 10), fur, 0, 0.3, 0); body.scale.set(0.8, 0.72, 1.25); g.add(body);
  g.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), white, 0, 0.32, 0.26));
  const head = new THREE.Group(); head.position.set(0, 0.56, 0.32); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), fur));
  for (const s of [-1, 1]) { const e = mesh(new THREE.ConeGeometry(0.07, 0.15, 4), fur, 0.11 * s, 0.18, 0); e.rotation.z = -0.25 * s; head.add(e); head.add(mesh(new THREE.SphereGeometry(0.03, 6, 5), M("#7BC86C", { e: 0x2a5a20, ei: 0.4 }), 0.075 * s, 0.03, 0.17, false)); }
  head.add(mesh(new THREE.SphereGeometry(0.025, 6, 5), M("#E58A9A"), 0, -0.03, 0.2, false));
  const tail = new THREE.Group(); tail.position.set(0, 0.32, -0.34); g.add(tail);
  for (let i = 0; i < 6; i++) tail.add(mesh(new THREE.SphereGeometry(0.055 - i * 0.004, 6, 5), fur, 0, i * 0.07, -i * 0.04));
  for (const [x, z] of [[-0.12, 0.2], [0.12, 0.2], [-0.12, -0.2], [0.12, -0.2]]) g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6), fur, x, 0.08, z));
  g.userData.parts = { head, tail };
  return g;
}
const LOOKS = {
  jozef: { shirt: "#7A6A55", pants: "#4A4A52", hair: "#E6E6E6", hat: "cap", hatColor: "#5B5141", moustache: "#EDEDED", cane: true, skin: "#E8B896" },
  marek: { shirt: "#E8E0D0", apron: "#3F8F4F", hair: "#2B1D14", moustache: "#2B1D14" },
  basia: { shirt: "#F7F3EC", apron: "#EADFCF", hair: "#8A4B2A", hat: "toque", pants: "#6B4B3A" },
  ola: { shirt: "#E05A47", apron: "#2E2E2E", hair: "#C8913A", ponytail: true, pants: "#2C3446" },
  kuba: { shirt: "#F2C230", pants: "#3C6FB0", hair: "#6B3F1F", hat: "kidcap", hatColor: "#D33A3A", scale: 0.68 },
  zosia: { shirt: "#4BA3A0", pants: "#3B4252", hair: "#4A2B1A", hat: "scarf", hatColor: "#C83C3C", flower: "#F2C14E" },
};
const npcObjs = {};
function placeNPCs() {
  const b = SHOP.piekarnia.a, c = SHOP.kawiarnia.a, k = SHOP.kwiaciarnia.a;
  const spots = { jozef: [5.2, 11.0], filemon: [2.4, -4.45], marek: [-10.9, 2.2], basia: [-24.9, b - 0.6], ola: [25.0, c - 0.6], kuba: [12.4, 12.8], zosia: [k - 0.6, 25.0] };
  for (const id of NPC_ORDER) {
    const [x, z] = spots[id], N = NPCS[id];
    const g = N.cat ? makeCat() : makePerson(LOOKS[id]);
    const y = N.cat ? 0.4 : 0;
    g.position.set(x, y, z);
    const base = Math.atan2(0 - x, 8 - z);
    g.rotation.y = base; scene.add(g);
    g.userData.target = { kind: "npc", id }; clickables.push(g);
    const mark = h("span", { class: "mark" }), btn = h("button", { class: "npc-tag", type: "button", "aria-label": `${N.name}, ${N.role}` }, mark, h("span", { class: "nm" }, N.name));
    btn.addEventListener("click", ev => { ev.stopPropagation(); tryInteract({ kind: "npc", id }); });
    const el = h("div", { class: "lbl", hidden: true }, btn); labelLayer.append(el);
    const L = { anchor: g, y: N.cat ? 1.25 : 2.3 * (LOOKS[id]?.scale ?? 1), max: 34, el, btn, shown: false, occ: false, slot: labels.length % 4 };
    labels.push(L);
    npcObjs[id] = { id, group: g, parts: g.userData.parts, x, z, base, heading: base, phase: Math.random() * 10, mark, cat: !!N.cat, kid: !!N.kid };
    addCircle(x, z, N.cat ? 0.4 : 0.45);
  }
}

// ===================================================================
// items
// ===================================================================
function itemModel(id) {
  const g = new THREE.Group();
  const add = (geo, color, x = 0, y = 0, z = 0, o) => { const m = mesh(geo, M(color, o), x, y, z, false); g.add(m); return m; };
  const stem = (y, hgt = 0.08) => add(new THREE.CylinderGeometry(0.012, 0.012, hgt, 5), "#5A3B1E", 0, y, 0);
  const flowerStem = () => add(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), "#4E8A3E", 0, 0.05, 0);
  switch (id) {
    case "jabłko": add(new THREE.SphereGeometry(0.14, 14, 10), "#C8352E"); stem(0.16); add(new THREE.SphereGeometry(0.05, 8, 6), "#4E9A3A", 0.05, 0.17, 0).scale.set(1, 0.35, 0.6); break;
    case "gruszka": add(new THREE.SphereGeometry(0.13, 14, 10), "#C9CC4A"); add(new THREE.SphereGeometry(0.085, 12, 9), "#C9CC4A", 0, 0.13, 0); stem(0.25); break;
    case "śliwka": add(new THREE.SphereGeometry(0.1, 14, 10), "#4B2463").scale.set(1, 1.15, 0.9); stem(0.13, 0.06); break;
    case "cytryna": add(new THREE.SphereGeometry(0.1, 14, 10), "#F1D034").scale.set(1.35, 1, 1); for (const s of [-1, 1]) add(new THREE.ConeGeometry(0.03, 0.05, 8), "#F1D034", s * 0.145, 0, 0).rotation.z = -s * Math.PI / 2; break;
    case "marchewka": add(new THREE.ConeGeometry(0.065, 0.36, 10), "#EE7A22").rotation.z = -Math.PI / 2; for (const a of [-0.4, 0, 0.4]) { const l = add(new THREE.ConeGeometry(0.02, 0.16, 5), "#4E9A3A", -0.24, a * 0.1, 0); l.rotation.z = Math.PI / 2 + a; } break;
    case "chleb": { const b = add(new THREE.CapsuleGeometry(0.12, 0.22, 4, 10), "#B77A3E"); b.rotation.z = Math.PI / 2; b.scale.set(0.8, 1, 1); for (let i = -1; i <= 1; i++) add(new THREE.BoxGeometry(0.02, 0.012, 0.16), "#E3B77E", i * 0.09, 0.1, 0).rotation.y = 0.5; } break;
    case "bułka": add(new THREE.SphereGeometry(0.11, 12, 8), "#D9A35E").scale.set(1.2, 0.7, 1); add(new THREE.BoxGeometry(0.16, 0.012, 0.02), "#F0D2A0", 0, 0.075, 0); break;
    case "ciastko": for (let i = 0; i < 2; i++) { add(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 14), "#D6A867", 0, i * 0.04, 0); for (let k = 0; k < 4; k++) add(new THREE.SphereGeometry(0.014, 5, 4), "#4A2C1A", Math.cos(k * 1.7) * 0.06, i * 0.04 + 0.02, Math.sin(k * 1.7) * 0.06); } break;
    case "drożdżówka": add(new THREE.CylinderGeometry(0.13, 0.12, 0.07, 16), "#E0A956"); add(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), "#F7EFE0", 0, 0.045, 0); for (let k = 0; k < 8; k++) add(new THREE.BoxGeometry(0.02, 0.02, 0.02), "#F3D9A8", Math.cos(k) * 0.1, 0.05, Math.sin(k) * 0.1); break;
    case "szarlotka": add(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 16, 1, false, 0, 1.1), "#E2B46A"); add(new THREE.CylinderGeometry(0.171, 0.171, 0.03, 16, 1, false, 0, 1.1), "#F6E7C8", 0, 0.065, 0); add(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 18), "#FFFFFF", 0, -0.055, 0); break;
    case "kawa": add(new THREE.CylinderGeometry(0.13, 0.13, 0.015, 18), "#FFFFFF", 0, -0.06, 0); add(new THREE.CylinderGeometry(0.075, 0.06, 0.11, 14), "#FFFFFF"); add(new THREE.CylinderGeometry(0.068, 0.068, 0.01, 14), "#5A3820", 0, 0.05, 0); add(new THREE.TorusGeometry(0.035, 0.012, 6, 10), "#FFFFFF", 0.09, 0, 0); break;
    case "herbata": add(new THREE.CylinderGeometry(0.065, 0.06, 0.16, 14), "#C77C2B", 0, 0, 0, { t: true, o: 0.8, r: 0.2 }); add(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14, 1, true), "#B8BEC4", 0, -0.03, 0, { m: 0.7, r: 0.3, ds: true }); add(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 12), "#F1D034", 0, 0.085, 0); break;
    case "woda": add(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), "#8CC8EE", 0, 0, 0, { t: true, o: 0.75, r: 0.15 }); add(new THREE.CylinderGeometry(0.025, 0.05, 0.06, 10), "#8CC8EE", 0, 0.14, 0, { t: true, o: 0.75 }); add(new THREE.CylinderGeometry(0.027, 0.027, 0.03, 10), "#2F6FD0", 0, 0.185, 0); break;
    case "sok": add(new THREE.CylinderGeometry(0.06, 0.05, 0.17, 14), "#F59A1E", 0, 0, 0, { t: true, o: 0.9, r: 0.2 }); add(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 5), "#E04A4A", 0.02, 0.1, 0).rotation.z = 0.2; break;
    case "mleko": add(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 14), "#FAFAFA"); add(new THREE.CylinderGeometry(0.035, 0.065, 0.07, 12), "#FAFAFA", 0, 0.135, 0); add(new THREE.CylinderGeometry(0.037, 0.037, 0.03, 12), "#2F6FD0", 0, 0.18, 0); add(new THREE.BoxGeometry(0.1, 0.06, 0.01), "#2F6FD0", 0, 0, 0.07); break;
    case "piłka": add(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), "#D33A3A"); add(new THREE.SphereGeometry(0.17, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), "#FFFFFF"); add(new THREE.TorusGeometry(0.17, 0.012, 6, 24), "#F2C230").rotation.x = Math.PI / 2; break;
    case "lalka": add(new THREE.ConeGeometry(0.1, 0.22, 10), "#E86FA0", 0, -0.02, 0); add(new THREE.SphereGeometry(0.06, 10, 8), "#F1C7A5", 0, 0.14, 0); add(new THREE.SphereGeometry(0.065, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), "#F2C14E", 0, 0.15, -0.005); break;
    case "miś": { const f = "#9B6A3E"; add(new THREE.SphereGeometry(0.12, 10, 8), f, 0, 0, 0); add(new THREE.SphereGeometry(0.09, 10, 8), f, 0, 0.17, 0); for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.035, 6, 5), f, s * 0.065, 0.25, 0); add(new THREE.SphereGeometry(0.045, 6, 5), f, s * 0.12, 0.02, 0.03); add(new THREE.SphereGeometry(0.045, 6, 5), f, s * 0.07, -0.1, 0.05); } add(new THREE.SphereGeometry(0.04, 6, 5), "#E8C9A0", 0, 0.155, 0.075); add(new THREE.SphereGeometry(0.014, 5, 4), "#1A1A1A", 0, 0.17, 0.11); } break;
    case "latawiec": { const s = new THREE.Shape(); s.moveTo(0, 0.26); s.lineTo(0.17, 0); s.lineTo(0, -0.34); s.lineTo(-0.17, 0); s.closePath(); const k = add(new THREE.ShapeGeometry(s), "#E04A4A", 0, 0, 0, { ds: true }); k.rotation.x = -Math.PI / 2 + 0.3; add(new THREE.BoxGeometry(0.34, 0.01, 0.01), "#F2C230", 0, 0.01, 0); for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.04, 0.01, 0.025), ["#F2C230", "#2F6FD0"][i % 2], 0.02 * (i % 2), 0, 0.38 + i * 0.1); } break;
    case "róża": flowerStem(); add(new THREE.SphereGeometry(0.07, 10, 8), "#C8253A", 0, 0.32, 0).scale.set(1, 1.1, 1); add(new THREE.SphereGeometry(0.04, 6, 5), "#4E8A3E", 0.04, 0.12, 0).scale.set(1.6, 0.4, 0.8); break;
    case "lilia": flowerStem(); for (let i = 0; i < 6; i++) { const p = add(new THREE.ConeGeometry(0.03, 0.14, 5), "#FBF7EE", Math.cos(i) * 0.05, 0.34, Math.sin(i) * 0.05); p.rotation.set(Math.sin(i) * 0.9, 0, -Math.cos(i) * 0.9); } add(new THREE.SphereGeometry(0.02, 6, 5), "#EE7A22", 0, 0.34, 0); break;
    case "stokrotka": flowerStem(); for (let i = 0; i < 10; i++) add(new THREE.BoxGeometry(0.09, 0.01, 0.025), "#FFFFFF", Math.cos(i / 10 * Math.PI * 2) * 0.05, 0.31, Math.sin(i / 10 * Math.PI * 2) * 0.05).rotation.y = -i / 10 * Math.PI * 2; add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), "#F2C230", 0, 0.315, 0); break;
    case "orchidea": flowerStem(); for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.05, 8, 6), "#C04FA8", 0.03 * (i - 1), 0.22 + i * 0.07, 0.05).scale.set(1.3, 1, 0.4); break;
    case "okulary": for (const s of [-1, 1]) { add(new THREE.TorusGeometry(0.06, 0.012, 6, 16), "#2A2A2A", s * 0.075, 0, 0); add(new THREE.BoxGeometry(0.01, 0.01, 0.15), "#2A2A2A", s * 0.135, 0, -0.07); } add(new THREE.BoxGeometry(0.04, 0.01, 0.01), "#2A2A2A", 0, 0.02, 0); break;
    case "klucze": add(new THREE.TorusGeometry(0.05, 0.01, 6, 14), "#C9A227", 0, 0, 0, { m: 0.7, r: 0.3 }).rotation.x = Math.PI / 2; for (const a of [0.4, -0.5]) { const k = new THREE.Group(); k.rotation.y = a; k.add(mesh(new THREE.BoxGeometry(0.16, 0.012, 0.02), M("#C9A227", { m: 0.7, r: 0.3 }), 0.12, 0, 0, false)); k.add(mesh(new THREE.BoxGeometry(0.03, 0.012, 0.05), M("#C9A227", { m: 0.7, r: 0.3 }), 0.18, 0, 0.02, false)); g.add(k); } break;
  }
  return g;
}
const ITEM_SCALE = { piłka: 1.2, róża: 1.25, lilia: 1.25, stokrotka: 1.25, orchidea: 1.25, okulary: 1.6, klucze: 1.6 };
const itemObjs = {};
const ringMat = new THREE.MeshBasicMaterial({ color: 0xe9b53b, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
function placeItems() {
  for (const id of Object.keys(ITEMS)) {
    const home = HOMES[id], g = new THREE.Group();
    const model = itemModel(id); model.scale.setScalar(ITEM_SCALE[id] ?? 1.5); g.add(model);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.34, 28), ringMat); ring.rotation.x = -Math.PI / 2;
    const surface = home.y < 0.5 ? 0.02 : home.y > 1 ? 0.97 : id === "okulary" ? 0.84 : 0.48;
    ring.position.y = surface - home.y;
    g.add(ring);
    g.position.copy(home); scene.add(g);
    g.userData.target = { kind: "item", id }; clickables.push(g);
    const L = addWordLabel({ word: ITEMS[id].word, lemma: ITEMS[id].lemma, anchor: g, y: 0.55, max: 15 });
    itemObjs[id] = { id, group: g, model, ring, label: L, available: true, phase: Math.random() * 6, pop: 1 };
  }
}
function placeItem(id, animate) { const o = itemObjs[id]; if (!o) return; o.available = true; o.group.visible = true; o.group.position.copy(HOMES[id]); o.pop = animate ? 0 : 1; }
function removeItem(id) { const o = itemObjs[id]; if (!o) return; o.available = false; o.group.visible = false; }
let carryMesh = null;
function setCarryVisual() {
  if (carryMesh) { player.group.remove(carryMesh); carryMesh = null; }
  if (st.carry) { carryMesh = itemModel(st.carry); carryMesh.scale.setScalar((ITEM_SCALE[st.carry] ?? 1.5) * 0.85); carryMesh.position.set(0, 1.15, 0.42); player.group.add(carryMesh); }
  renderTracker();
}
function syncWorldFromState() {
  for (const id of Object.keys(ITEMS)) {
    const story = ITEMS[id].story, gone = story && npcState(story).stage === "done";
    if (gone || st.carry === id) removeItem(id); else placeItem(id, false);
  }
  const o = npcObjs.jozef; if (o) o.parts.specs.visible = npcState("jozef").stage === "done";
  setCarryVisual();
}

// ===================================================================
// pigeons (gołębie)
// ===================================================================
const pigeons = [];
let pigeonLabel = null;
function buildPigeons() {
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group(), grey = M("#8C93A3"), dark = M("#5E6577");
    const b = mesh(new THREE.SphereGeometry(0.12, 10, 8), grey, 0, 0.16, 0, false); b.scale.set(0.85, 0.8, 1.3); g.add(b);
    const head = new THREE.Group(); head.position.set(0, 0.28, 0.12); g.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.065, 8, 6), dark, 0, 0, 0, false));
    const beak = mesh(new THREE.ConeGeometry(0.018, 0.05, 5), M("#E2B44A"), 0, -0.005, 0.07, false); beak.rotation.x = Math.PI / 2; head.add(beak);
    const wings = [-1, 1].map(s => { const w = mesh(new THREE.BoxGeometry(0.2, 0.02, 0.18), dark, s * 0.1, 0.2, -0.02, false); g.add(w); return w; });
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.02, 0.12), dark, 0, 0.17, -0.18, false));
    const a = Math.random() * Math.PI * 2, r = 4.5 + Math.random() * 3.5;
    g.position.set(Math.cos(a) * r, 0, 6 + Math.sin(a) * r); g.rotation.y = Math.random() * 6; scene.add(g);
    pigeons.push({ g, head, wings, state: "idle", t: Math.random() * 3, from: new THREE.Vector3(), to: new THREE.Vector3(), dur: 1 });
  }
  pigeonLabel = addWordLabel({ word: "gołąb", anchor: pigeons[0].g, y: 0.6, max: 7, kind: "small" });
}
function updatePigeons(dt, T) {
  let nearest = null, nd = 99;
  for (const p of pigeons) {
    const dx = p.g.position.x - player.pos.x, dz = p.g.position.z - player.pos.z, d = Math.hypot(dx, dz);
    if (p.state === "idle") {
      p.t -= dt; p.head.position.y = 0.28 - Math.max(0, Math.sin(T * 6 + p.t * 3)) * 0.07;
      if (d < 2.3) {
        const a = Math.random() * Math.PI * 2, r = 4.5 + Math.random() * 4;
        p.from.copy(p.g.position); p.to.set(Math.cos(a) * r, 0, 6 + Math.sin(a) * r); p.state = "fly"; p.t = 0; p.dur = 1.4 + Math.random() * 0.6;
        p.g.rotation.y = Math.atan2(p.to.x - p.from.x, p.to.z - p.from.z);
      } else if (p.t < 0) { p.t = 1.5 + Math.random() * 3; p.g.rotation.y += (Math.random() - 0.5) * 1.6; const s = 0.25; p.g.position.x += Math.sin(p.g.rotation.y) * s; p.g.position.z += Math.cos(p.g.rotation.y) * s; if (Math.hypot(p.g.position.x, p.g.position.z - 6) < 3.8) p.g.position.z += 0.4; }
    } else {
      p.t += dt; const k = Math.min(1, p.t / p.dur);
      p.g.position.lerpVectors(p.from, p.to, k); p.g.position.y = Math.sin(k * Math.PI) * 2.6;
      const flap = Math.sin(T * 30) * 0.9; p.wings[0].rotation.z = flap; p.wings[1].rotation.z = -flap;
      if (k >= 1) { p.state = "idle"; p.t = 2; p.wings.forEach(w => (w.rotation.z = 0)); p.g.position.y = 0; }
    }
    if (d < nd) { nd = d; nearest = p; }
  }
  if (pigeonLabel && nearest) pigeonLabel.anchor = nearest.g;
}
