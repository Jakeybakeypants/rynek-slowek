
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
  buildPainter(); buildPost(); buildBookstand(); buildClothesStall(); buildHopscotch();
  HOMES.skakanka = new THREE.Vector3(-1.5, 0.1, 10.5); HOMES.nuty = new THREE.Vector3(-20.6, 0.1, 2.9);
  HOMES.torba = new THREE.Vector3(16.4, 0.25, 17.2); HOMES.kość = new THREE.Vector3(-20.7, 0.12, 20.7); HOMES.pędzel = new THREE.Vector3(-7.9, 0.12, -8.0);
}
const SURFACE = {};
const PAINT = { czerwona: "#C8352E", niebieska: "#2F6FD0", żółta: "#F1D034", zielona: "#3F9A4A", biała: "#F7F7F2" };
function buildPainter() {
  const t = new THREE.Group(); t.position.set(12.6, 0, -0.9); scene.add(t);
  t.add(mesh(new THREE.BoxGeometry(3.6, 0.06, 0.8), M(WOOD), 0, 0.5, 0));
  for (const [dx, dz] of [[-1.7, -0.32], [1.7, -0.32], [-1.7, 0.32], [1.7, 0.32]]) t.add(mesh(new THREE.BoxGeometry(0.06, 0.48, 0.06), M(WOOD_D), dx, 0.24, dz));
  Object.keys(PAINT).forEach((id, i) => { HOMES[id] = new THREE.Vector3(11.2 + i * 0.7, 0.66, -0.9); SURFACE[id] = 0.54; });
  addBox(10.8, 14.4, -1.3, -0.5);
  const e = new THREE.Group(); e.position.set(14.2, 0, 1.4); e.rotation.y = Math.atan2(0 - 14.2, 6 - 1.4); scene.add(e);
  for (const [x, z, rx, rz] of [[-0.35, 0.1, -0.12, -0.12], [0.35, 0.1, -0.12, 0.12], [0, -0.35, 0.3, 0]]) {
    const leg = mesh(new THREE.BoxGeometry(0.04, 1.75, 0.04), M(WOOD_D), x, 0.85, z); leg.rotation.set(rx, 0, rz); e.add(leg);
  }
  const painting = new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(160, 120, (c, W, H) => {
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#5F9EE6"); sky.addColorStop(1, "#CFE3F7"); c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = "#F1D034"; c.beginPath(); c.arc(126, 28, 15, 0, Math.PI * 2); c.fill();
    [["#E5826B", 8], ["#9FC5B8", 40], ["#E9B44C", 72], ["#8DB3D9", 104]].forEach(([col, x], i) => {
      c.fillStyle = col; c.fillRect(x, 54 - i % 2 * 8, 30, 50); c.fillStyle = "#A84B32"; c.beginPath(); c.moveTo(x, 54 - i % 2 * 8); c.lineTo(x + 15, 38 - i % 2 * 8); c.lineTo(x + 30, 54 - i % 2 * 8); c.fill();
      c.fillStyle = "#F7F3EA"; c.fillRect(x + 8, 66, 5, 7); c.fillRect(x + 18, 66, 5, 7);
    });
    c.fillStyle = "#B9AE9C"; c.fillRect(0, 100, W, 20);
  }) });
  const wood = M("#F2EEE6");
  const canv = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 0.03), [wood, wood, wood, wood, painting, wood]); canv.position.set(0, 1.3, 0.16); canv.rotation.x = -0.12; canv.castShadow = true; e.add(canv);
  e.add(mesh(new THREE.BoxGeometry(0.9, 0.04, 0.1), M(WOOD_D), 0, 0.92, 0.2));
  addCircle(14.2, 1.4, 0.55);
  addWordLabel({ word: "obraz", anchor: e, y: 2.3, max: 7, kind: "small" });
  addWordLabel({ word: "sztaluga", anchor: e, y: 0.45, max: 6, kind: "small" });
}
function buildPost() {
  const p = SHOP.poczta.a;
  counter(p + 2.6, 25.5, false, 3.0, "#C8352E");
  ["paczka", "koperta", "pocztówka", "list"].forEach((id, i) => { HOMES[id] = new THREE.Vector3(p + 1.55 + i * 0.7, 1.12, 25.5); });
  addBox(p + 1.0, p + 4.2, 25.0, 26.0);
  const bike = new THREE.Group(); bike.position.set(p - 2.7, 0, 25.6); scene.add(bike);
  const frame = M("#2F4E8C"), tyre = M("#222222");
  for (const x of [-0.5, 0.5]) {
    bike.add(mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 20), tyre, x, 0.34, 0));
    const hub = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 6), M("#B8BEC4", { m: 0.6 }), x, 0.34, 0); hub.rotation.x = Math.PI / 2; bike.add(hub);
  }
  for (const [x, y, w, h, rz] of [[0, 0.55, 0.85, 0.04, 0], [-0.25, 0.48, 0.5, 0.04, 0.9], [0.32, 0.5, 0.42, 0.04, -1.0]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.04), frame, x, y, 0); b.rotation.z = rz; bike.add(b); }
  bike.add(mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), frame, -0.22, 0.72, 0));
  bike.add(mesh(new THREE.BoxGeometry(0.22, 0.05, 0.12), M("#2B2B2B"), -0.22, 0.9, 0));
  bike.add(mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), frame, 0.42, 0.74, 0));
  bike.add(mesh(new THREE.BoxGeometry(0.04, 0.04, 0.46), M("#2B2B2B"), 0.42, 0.95, 0));
  bike.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), M("#B98A55"), 0.62, 0.82, 0));
  addBox(p - 3.4, p - 2.0, 25.3, 25.9);
  addWordLabel({ word: "rower", anchor: bike, y: 1.35, max: 7, kind: "small" });
  const box = new THREE.Group(); box.position.set(p + 5.3, 0, 25.6); scene.add(box);
  box.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), M(IRON), 0, 0.45, 0));
  box.add(mesh(new THREE.BoxGeometry(0.44, 0.52, 0.32), M("#C8352E"), 0, 1.15, 0));
  box.add(mesh(new THREE.BoxGeometry(0.26, 0.03, 0.02), M("#2B2B2B"), 0, 1.28, -0.17, false));
  box.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.38), M("#A82A24"), 0, 1.44, 0));
  addCircle(p + 5.3, 25.6, 0.35);
  addWordLabel({ word: "skrzynka", anchor: box, y: 1.9, max: 7, kind: "small" });
}
function buildClothesStall() {
  const g = new THREE.Group(); g.position.set(-15.5, 0, -11.2); scene.add(g);
  counter(-15.5, -11.2, false, 4.4, "#3A6EA5");
  for (const [dx, dz] of [[-2.2, -0.45], [2.2, -0.45], [-2.2, 0.45], [2.2, 0.45]]) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), M(WOOD_D), dx, 1.3, dz));
  const awn = mesh(new THREE.BoxGeometry(4.8, 0.06, 1.6), new THREE.MeshStandardMaterial({ map: stripeTex("#3A6EA5", "#F4F1E6"), roughness: 0.9 }), 0, 2.62, 0); awn.rotation.x = -0.12; g.add(awn);
  const rail = mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.2, 6), M(IRON), 0, 2.1, -0.4); rail.rotation.z = Math.PI / 2; g.add(rail);
  ["#E5826B", "#F2E3C6", "#8DB3D9", "#A7C77E", "#E9B44C"].forEach((col, i) => g.add(mesh(new THREE.BoxGeometry(0.42, 0.6, 0.05), M(col), -1.7 + i * 0.85, 1.72, -0.4)));
  const wood = M("#4A3020");
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.1), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: signTex("UBRANIA", "#3A6EA5", "#FFFFFF") }), wood]);
  board.position.set(0, 2.32, 0.82); g.add(board);
  addWordLabel({ word: "ubrania", pos: new THREE.Vector3(-15.5, 3.05, -10.3), max: 26, kind: "sign" });
  ["czapka", "kurtka", "parasolka", "rękawiczki", "koszula", "sukienka"].forEach((id, i) => { HOMES[id] = new THREE.Vector3(-17.25 + i * 0.7, 1.12, -11.2); });
  addBox(-17.8, -13.2, -11.7, -10.7);
}
function buildHopscotch() {
  const tex = canvasTex(128, 320, (c, W, H) => {
    c.clearRect(0, 0, W, H); c.strokeStyle = "rgba(255,255,255,.92)"; c.lineWidth = 5; c.fillStyle = "rgba(255,255,255,.92)";
    c.font = "800 34px 'Baloo 2', 'Trebuchet MS', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    // 1 2 [3 4] 5 [6 7] 8 from the bottom
    const rows = [[1], [2], [3, 4], [5], [6, 7], [8]], rh = H / rows.length;
    rows.forEach((r, k) => {
      const y = H - (k + 1) * rh, cw = r.length === 1 ? 64 : 58;
      r.forEach((n, j) => { const x = r.length === 1 ? W / 2 - cw / 2 : 6 + j * cw; c.strokeRect(x, y + 3, cw, rh - 6); c.fillText(String(n), x + cw / 2, y + rh / 2 + 2); });
    });
  });
  const m = mesh(new THREE.PlaneGeometry(1.6, 4.0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), -3.0, 0.012, 22.2, false);
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI; scene.add(m);
  addWordLabel({ word: "klasy", pos: new THREE.Vector3(-3.0, 0.6, 22.2), max: 7, kind: "small" });
}
function buildBookstand() {
  const k = SHOP.księgarnia.a;
  counter(k - 2.6, -25.5, false, 3.0, "#7A4E2D");
  ["książka", "mapa", "gazeta", "kredka"].forEach((id, i) => { HOMES[id] = new THREE.Vector3(k - 1.55 - i * 0.7, 1.12, -25.5); });
  addBox(k - 4.2, k - 1.0, -26.0, -25.0);
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
// the pieces a person can wear; node names come from blender/people.py
const PIECES = ["hair_short", "hair_bun", "hair_ponytail", "hair_pigtails", "hair_sides", "moustache", "glasses",
  "hat_toque", "hat_cap", "hat_kidcap", "hat_beret", "hat_scarf", "apron", "skirt", "backpack", "satchel", "cane", "accordion"];
const pieceOf = name => PIECES.find(p => name === p || name.startsWith(p + "_"));
const personMats = new Map();
function personFromModel(o) {
  const g = new THREE.Group(), model = PEOPLE.clone(true);
  g.add(model);
  const colors = {
    skin: o.skin ?? "#EBC09C", shirt: o.shirt, pants: o.pants ?? "#3B4252", hair: o.hair ?? "#3B2A20", hat: o.hatColor ?? "#5B5141",
    apron: o.apron ?? "#F4EFE6", skirt: o.skirt ?? "#6B4B3A", bag: o.backpack ?? o.satchel ?? "#7A4E2D",
  };
  const wear = new Set(o.style ?? ["hair_short"]);
  if (o.ponytail) wear.add("hair_ponytail");
  if (o.pigtails) wear.add("hair_pigtails");
  if (o.hat) wear.add("hat_" + o.hat);
  for (const k of ["moustache", "glasses", "apron", "skirt", "backpack", "satchel", "cane", "accordion"]) if (o[k]) wear.add(k);
  const hidden = [];
  model.traverse(n => {
    const piece = pieceOf(n.name);
    if (piece && !wear.has(piece) && piece !== "glasses") hidden.push(n);
    if (!n.isMesh) return;
    n.castShadow = true; n.receiveShadow = true;
    const c = colors[n.material.name];
    if (c) {
      const key = n.material.name + c;
      if (!personMats.has(key)) personMats.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
      n.material = personMats.get(key);
    }
  });
  hidden.forEach(n => (n.visible = false));
  const get = name => model.getObjectByName(name);
  // glasses go in one group so Józef can put his on when they're found
  const head = get("head"), specs = new THREE.Group();
  head.add(specs);
  ["glasses_l", "glasses_r", "glasses_bridge"].map(get).forEach(n => specs.add(n));
  specs.visible = !!o.glasses;
  g.scale.setScalar(o.scale ?? 1);
  g.userData.parts = {
    body: get("torso"), bodyY: get("torso").position.y, head, specs,
    legs: [get("leg_r"), get("leg_l")], shins: [get("shin_r"), get("shin_l")],
    arms: [get("arm_r"), get("arm_l")], forearms: [get("forearm_r"), get("forearm_l")],
  };
  return g;
}
function makePerson(o) {
  if (PEOPLE) return personFromModel(o);
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
  if (o.pigtails) for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), hair, 0.2 * s, 0.02, -0.08));
  if (o.accordion) {
    const acc = new THREE.Group(); acc.position.set(0, 1.0, 0.32); body.add(acc);
    acc.add(mesh(new THREE.BoxGeometry(0.1, 0.34, 0.2), M("#B23A3A"), -0.17, 0, 0));
    acc.add(mesh(new THREE.BoxGeometry(0.1, 0.34, 0.2), M("#B23A3A"), 0.17, 0, 0));
    for (let i = 0; i < 5; i++) acc.add(mesh(new THREE.BoxGeometry(0.045, 0.32, 0.19), M(i % 2 ? "#2B2B2B" : "#F2EEE6"), -0.1 + i * 0.05, 0, 0));
    acc.add(mesh(new THREE.BoxGeometry(0.03, 0.3, 0.16), M("#FFFFFF"), -0.235, 0, 0, false));
  }
  if (o.flower) head.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), M(o.flower), 0.17, 0.12, 0.06, false));
  if (o.hat === "beret") { const b = mesh(new THREE.SphereGeometry(0.25, 14, 8), M(o.hatColor), 0.03, 0.17, -0.01); b.scale.y = 0.32; head.add(b); head.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 5), M(o.hatColor), 0.03, 0.24, 0)); }
  if (o.satchel) {
    body.add(mesh(new THREE.BoxGeometry(0.1, 0.26, 0.3), M(o.satchel), 0.33, 0.86, 0.02));
    const strap = mesh(new THREE.BoxGeometry(0.05, 0.75, 0.03), M(o.satchel), 0.02, 1.22, 0.26, false); strap.rotation.z = 0.75; body.add(strap);
  }
  if (o.cane) arms[1].add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 6), M("#6B4A30"), 0, -0.6, 0.06));
  if (o.backpack) body.add(mesh(new THREE.BoxGeometry(0.38, 0.44, 0.18), M(o.backpack), 0, 1.12, -0.3));
  const specs = new THREE.Group(); specs.visible = !!o.glasses; head.add(specs);
  for (const s of [-1, 1]) specs.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), M("#222222"), 0.075 * s, 0.03, 0.2, false));
  g.scale.setScalar(o.scale ?? 1);
  g.userData.parts = { body, legs, arms, head, specs };
  return g;
}
function makeDog() {
  const g = new THREE.Group(), fur = M("#9B6A3E"), light = M("#E8D2B0"), dark = M("#5A3B22");
  const body = mesh(new THREE.SphereGeometry(0.3, 12, 10), fur, 0, 0.44, 0); body.scale.set(0.75, 0.7, 1.35); g.add(body);
  for (const [x, z] of [[-0.13, 0.25], [0.13, 0.25], [-0.13, -0.25], [0.13, -0.25]]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.34, 6), fur, x, 0.17, z));
  const head = new THREE.Group(); head.position.set(0, 0.72, 0.42); g.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.19, 12, 10), fur));
  const muzzle = mesh(new THREE.SphereGeometry(0.11, 10, 8), light, 0, -0.05, 0.15); muzzle.scale.set(1, 0.8, 1.2); head.add(muzzle);
  head.add(mesh(new THREE.SphereGeometry(0.04, 8, 6), M("#1A1A1A"), 0, -0.01, 0.28, false));
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.028, 6, 5), M("#1A1A1A"), 0.075 * s, 0.07, 0.15, false));
    const ear = mesh(new THREE.BoxGeometry(0.07, 0.2, 0.05), dark, 0.17 * s, 0.0, -0.02); ear.rotation.z = 0.3 * s; head.add(ear);
  }
  head.add(mesh(new THREE.BoxGeometry(0.05, 0.02, 0.06), M("#E58A9A"), 0, -0.12, 0.2, false));
  const tail = new THREE.Group(); tail.position.set(0, 0.56, -0.4); g.add(tail);
  const t = mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.28, 6), fur, 0, 0.11, -0.06); t.rotation.x = -0.6; tail.add(t);
  g.userData.parts = { head, tail };
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
  jozef: { shirt: "#7A6A55", pants: "#4A4A52", hair: "#E6E6E6", style: ["hair_sides"], hat: "cap", hatColor: "#5B5141", moustache: "#EDEDED", cane: true, skin: "#E8B896" },
  marek: { shirt: "#E8E0D0", apron: "#3F8F4F", hair: "#2B1D14", moustache: "#2B1D14" },
  basia: { shirt: "#F7F3EC", apron: "#EADFCF", hair: "#8A4B2A", hat: "toque", hatColor: "#FFFFFF", pants: "#D9C7B4", skirt: "#E9DFD0" },
  ola: { shirt: "#E05A47", apron: "#2E2E2E", hair: "#C8913A", ponytail: true, pants: "#2C3446" },
  kuba: { shirt: "#F2C230", pants: "#3C6FB0", hair: "#6B3F1F", hat: "kidcap", hatColor: "#D33A3A", scale: 0.68 },
  zosia: { shirt: "#4BA3A0", pants: "#3B4252", hair: "#4A2B1A", hat: "scarf", hatColor: "#C83C3C", skirt: "#2F7A77" },
  ewa: { shirt: "#3E6FA8", apron: "#F4EFE6", hair: "#2B1D14", hat: "beret", hatColor: "#B23A3A", pants: "#2C3446" },
  tadeusz: { shirt: "#2F4E8C", pants: "#2C3446", hair: "#5A4636", hat: "cap", hatColor: "#2F4E8C", moustache: "#5A4636", satchel: "#7A4E2D" },
  halina: { shirt: "#B5654A", pants: "#4A4A52", hair: "#9A9A9A", style: ["hair_short", "hair_bun"], glasses: true, skirt: "#5A4A42" },
  zuzia: { shirt: "#E86FA0", pants: "#F2EEE6", hair: "#C8913A", pigtails: true, scale: 0.66, skirt: "#E86FA0" },
  staszek: { shirt: "#7A2E2E", pants: "#2C2F3A", hair: "#3B2A20", hat: "cap", hatColor: "#2B2B2B", moustache: "#3B2A20", accordion: true },
  bogdan: { shirt: "#E8E0D0", apron: "#3A6EA5", hair: "#5A4636", moustache: "#5A4636" },
  krysia: { shirt: "#8C5A8A", pants: "#4A4A52", hair: "#BDBDBD", hat: "scarf", hatColor: "#3F6FA0", glasses: true, skirt: "#4A3A5A" },
};
const npcObjs = {};
function placeNPCs() {
  const b = SHOP.piekarnia.a, c = SHOP.kawiarnia.a, k = SHOP.kwiaciarnia.a;
  const spots = { jozef: [5.2, 11.0], filemon: [2.4, -4.45], marek: [-10.9, 2.2], basia: [-24.9, b - 0.6], ola: [25.0, c - 0.6], kuba: [12.4, 12.8], zosia: [k - 0.6, 25.0],
    ewa: [12.0, 0.45], tadeusz: [SHOP.poczta.a - 0.6, 25.0], halina: [SHOP.księgarnia.a + 0.6, -25.0], burek: [-17.0, 21.0],
    zuzia: [-4.7, 21.0], staszek: [-8.8, -4.2], bogdan: [-12.4, -11.6], krysia: [-5.2, 11.0] };
  for (const id of NPC_ORDER) {
    const [x, z] = spots[id], N = NPCS[id];
    const g = N.cat ? makeCat() : N.dog ? makeDog() : makePerson(LOOKS[id]);
    const y = N.cat ? 0.4 : 0;
    g.position.set(x, y, z);
    const base = Math.atan2(0 - x, 8 - z);
    g.rotation.y = base; scene.add(g);
    g.userData.target = { kind: "npc", id }; clickables.push(g);
    const mark = h("span", { class: "mark" }), btn = h("button", { class: "npc-tag", type: "button", "aria-label": `${N.name}, ${N.role}` }, mark, h("span", { class: "nm" }, N.name));
    btn.addEventListener("click", ev => { ev.stopPropagation(); tryInteract({ kind: "npc", id }); });
    const el = h("div", { class: "lbl", hidden: true }, btn); labelLayer.append(el);
    const L = { anchor: g, y: N.cat ? 1.25 : N.dog ? 1.35 : 2.3 * (LOOKS[id]?.scale ?? 1), max: 34, el, btn, shown: false, occ: false, slot: labels.length % 4 };
    labels.push(L);
    npcObjs[id] = { id, group: g, parts: g.userData.parts, x, z, base, heading: base, phase: Math.random() * 10, mark, cat: !!N.cat, dog: !!N.dog, kid: !!N.kid };
    addCircle(x, z, N.cat ? 0.4 : N.dog ? 0.5 : 0.45);
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
    case "pędzel": { const b = new THREE.Group(); b.rotation.z = Math.PI / 2 - 0.25; g.add(b);
      b.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.26, 6), M("#B5603A"), 0, 0, 0, false));
      b.add(mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.05, 8), M("#B8BEC4", { m: 0.6, r: 0.35 }), 0, 0.15, 0, false));
      b.add(mesh(new THREE.ConeGeometry(0.02, 0.07, 8), M("#2F6FD0"), 0, 0.21, 0, false)); } break;
    case "list": case "koperta":
      add(new THREE.BoxGeometry(0.24, 0.012, 0.16), id === "list" ? "#FAF7F0" : "#EED9A8");
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.15, 0.004, 0.008), "#C9B98F", s * 0.06, 0.008, -0.03).rotation.y = s * 0.55;
      if (id === "list") add(new THREE.BoxGeometry(0.04, 0.004, 0.05), "#C8352E", 0.085, 0.008, 0.045);
      break;
    case "pocztówka": add(new THREE.BoxGeometry(0.22, 0.01, 0.15), "#FFFFFF"); add(new THREE.BoxGeometry(0.2, 0.004, 0.13), "#8DB3D9", 0, 0.007, 0); add(new THREE.BoxGeometry(0.2, 0.005, 0.05), "#7FB069", 0, 0.008, 0.04); add(new THREE.BoxGeometry(0.03, 0.006, 0.03), "#F1D034", 0.06, 0.009, -0.03); break;
    case "paczka": add(new THREE.BoxGeometry(0.22, 0.16, 0.18), "#B98A55"); add(new THREE.BoxGeometry(0.225, 0.165, 0.014), "#EDE3CF"); add(new THREE.BoxGeometry(0.014, 0.165, 0.185), "#EDE3CF"); break;
    case "książka": add(new THREE.BoxGeometry(0.18, 0.05, 0.24), "#B23A3A"); add(new THREE.BoxGeometry(0.17, 0.042, 0.226), "#F5EFE0", 0.008, 0, 0); break;
    case "mapa": add(new THREE.BoxGeometry(0.22, 0.012, 0.16), "#EADCB8"); add(new THREE.BoxGeometry(0.09, 0.004, 0.07), "#7FB069", -0.04, 0.008, -0.02); add(new THREE.BoxGeometry(0.2, 0.004, 0.014), "#4F8FD0", 0.01, 0.009, 0.03).rotation.y = 0.35; break;
    case "gazeta": add(new THREE.BoxGeometry(0.2, 0.02, 0.26), "#ECEBE6"); add(new THREE.BoxGeometry(0.17, 0.004, 0.035), "#2A2A2A", 0, 0.012, -0.095); for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.17, 0.003, 0.012), "#9A9A9A", 0, 0.012, -0.04 + i * 0.035); break;
    case "kredka": { const c = new THREE.Group(); c.rotation.z = Math.PI / 2; g.add(c);
      c.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), M("#2F6FD0"), 0, 0, 0, false));
      c.add(mesh(new THREE.ConeGeometry(0.012, 0.03, 6), M("#F2D9B0"), 0, 0.115, 0, false));
      c.add(mesh(new THREE.ConeGeometry(0.005, 0.012, 6), M("#2F6FD0"), 0, 0.13, 0, false)); } break;
    case "torba":
      add(new THREE.BoxGeometry(0.26, 0.2, 0.12), "#E3D3B0");
      for (const s of [-1, 1]) add(new THREE.TorusGeometry(0.05, 0.01, 4, 10, Math.PI), "#8A6A40", s * 0.06, 0.1, 0);
      add(new THREE.BoxGeometry(0.06, 0.06, 0.09), "#2F6FD0", -0.05, 0.11, 0); add(new THREE.BoxGeometry(0.05, 0.08, 0.09), "#B23A3A", 0.03, 0.12, 0);
      break;
    case "kość":
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), "#F2EDE0").rotation.z = Math.PI / 2;
      for (const x of [-0.1, 0.1]) for (const z of [-0.022, 0.022]) add(new THREE.SphereGeometry(0.035, 8, 6), "#F2EDE0", x, 0, z);
      break;
    case "skakanka":
      add(new THREE.TorusGeometry(0.17, 0.008, 4, 28, Math.PI * 1.6), "#D33A3A").rotation.x = Math.PI / 2;
      for (const a of [0, Math.PI * 1.6]) add(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), "#C79A62", Math.cos(a) * 0.17, 0, -Math.sin(a) * 0.17).rotation.z = Math.PI / 2;
      break;
    case "nuty":
      add(new THREE.BoxGeometry(0.22, 0.008, 0.3), "#FBF8EF");
      for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.19, 0.003, 0.004), "#3A3A3A", 0, 0.006, -0.06 + i * 0.012);
      for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.008, 5, 4), "#1A1A1A", -0.07 + i * 0.035, 0.008, -0.06 + ((i * 3) % 5) * 0.012);
      break;
    case "czapka":
      add(new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), "#C8352E");
      add(new THREE.TorusGeometry(0.115, 0.022, 6, 18), "#F2EEE6").rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(0.04, 8, 6), "#F2EEE6", 0, 0.13, 0);
      break;
    case "kurtka":
      add(new THREE.BoxGeometry(0.26, 0.06, 0.22), "#2F6FD0");
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.05, 0.2), "#2A62B8", s * 0.15, 0, 0.01);
      add(new THREE.BoxGeometry(0.004, 0.062, 0.2), "#C9CED4", 0, 0.002, 0.01);
      add(new THREE.BoxGeometry(0.14, 0.03, 0.04), "#2A62B8", 0, 0.04, -0.1);
      break;
    case "parasolka": { const u = new THREE.Group(); u.rotation.z = Math.PI / 2; g.add(u);
      u.add(mesh(new THREE.ConeGeometry(0.045, 0.36, 8), M("#2F4E8C"), 0, 0, 0, false));
      u.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 5), M("#2B2B2B"), 0, 0.22, 0, false));
      const hk = mesh(new THREE.TorusGeometry(0.03, 0.008, 4, 10, Math.PI), M("#6B4A30"), 0.03, -0.2, 0, false); hk.rotation.z = Math.PI; u.add(hk); } break;
    case "rękawiczki":
      for (const s of [-1, 1]) {
        add(new THREE.CapsuleGeometry(0.04, 0.08, 4, 8), "#C8352E", s * 0.06, 0, 0).rotation.x = Math.PI / 2;
        add(new THREE.SphereGeometry(0.022, 6, 5), "#C8352E", s * 0.1, 0, -0.01);
        add(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 10), "#F2EEE6", s * 0.06, 0, 0.075).rotation.x = Math.PI / 2;
      }
      break;
    case "koszula":
      add(new THREE.BoxGeometry(0.24, 0.04, 0.2), "#F7F7F2");
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.06, 0.01, 0.05), "#E6E6E0", s * 0.035, 0.024, -0.085).rotation.y = s * 0.5;
      for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.007, 5, 4), "#8A9096", 0, 0.022, -0.04 + i * 0.05);
      break;
    case "sukienka":
      add(new THREE.ConeGeometry(0.13, 0.26, 12), "#E86FA0", 0, -0.02, 0);
      add(new THREE.CylinderGeometry(0.055, 0.07, 0.08, 10), "#E86FA0", 0, 0.12, 0);
      add(new THREE.TorusGeometry(0.06, 0.008, 4, 12), "#F2EEE6", 0, 0.09, 0).rotation.x = Math.PI / 2;
      break;
    default:
      if (PAINT[id]) {
        add(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16), "#B8BEC4", 0, 0, 0, { m: 0.6, r: 0.35 });
        add(new THREE.CylinderGeometry(0.086, 0.086, 0.012, 16), PAINT[id], 0, 0.064, 0);
        add(new THREE.BoxGeometry(0.03, 0.05, 0.008), PAINT[id], 0.04, 0.035, 0.088);
        add(new THREE.TorusGeometry(0.07, 0.006, 4, 12, Math.PI), "#8A9096", 0, 0.07, 0);
      }
  }
  return g;
}
const ITEM_SCALE = { skakanka: 1.5, nuty: 1.6, rękawiczki: 1.5, piłka: 1.2, róża: 1.25, lilia: 1.25, stokrotka: 1.25, orchidea: 1.25, okulary: 1.6, klucze: 1.6, pędzel: 1.6, kredka: 1.8, paczka: 1.4, kość: 1.6 };
const itemObjs = {};
const ringMat = new THREE.MeshBasicMaterial({ color: 0xe9b53b, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
function placeItems() {
  Object.keys(ITEMS).forEach((id, i) => {
    const home = HOMES[id], g = new THREE.Group();
    const model = itemModel(id); model.scale.setScalar(ITEM_SCALE[id] ?? 1.5); g.add(model);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.34, 28), ringMat); ring.rotation.x = -Math.PI / 2;
    const surface = SURFACE[id] ?? (home.y < 0.5 ? 0.02 : home.y > 1 ? 0.97 : id === "okulary" ? 0.84 : 0.48);
    ring.position.y = surface - home.y;
    g.add(ring);
    g.position.copy(home); scene.add(g);
    g.userData.target = { kind: "item", id }; clickables.push(g);
    // neighbours on a counter alternate heights so their labels don't cover each other
    const L = addWordLabel({ word: ITEMS[id].word, anchor: g, y: 0.55 + (i % 2) * 0.34, max: 15 });
    itemObjs[id] = { id, group: g, model, ring, label: L, available: true, phase: Math.random() * 6, pop: 1 };
  });
}
function placeItem(id, animate) { const o = itemObjs[id]; if (!o) return; o.available = true; o.group.visible = true; o.group.position.copy(HOMES[id]); o.pop = animate ? 0 : 1; }
function removeItem(id) { const o = itemObjs[id]; if (!o) return; o.available = false; o.group.visible = false; }
// small pictures of items for the bag, rendered once each
let thumbKit = null;
const thumbs = {};
function itemThumb(id) {
  if (id in thumbs) return thumbs[id];
  try {
    if (!thumbKit) {
      const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      r.setSize(96, 96, false);
      const sc = new THREE.Scene(), sun = new THREE.DirectionalLight(0xffffff, 2.2);
      sun.position.set(1, 2, 2); sc.add(sun, new THREE.HemisphereLight(0xffffff, 0x8c7a5e, 1.6));
      thumbKit = { r, sc, cam: new THREE.PerspectiveCamera(30, 1, 0.01, 20) };
    }
    const { r, sc, cam } = thumbKit, m = itemModel(id), holder = new THREE.Group();
    holder.add(m); holder.rotation.set(0.45, -0.6, 0); sc.add(holder);
    const box = new THREE.Box3().setFromObject(holder), size = box.getSize(new THREE.Vector3()).length() || 1;
    holder.position.sub(box.getCenter(new THREE.Vector3()));
    cam.position.set(0, 0, size * 1.9); cam.lookAt(0, 0, 0);
    r.render(sc, cam);
    thumbs[id] = r.domElement.toDataURL("image/png");
    sc.remove(holder);
  } catch { thumbs[id] = ""; }
  return thumbs[id];
}
let carryMesh = null;
function setCarryVisual() {
  if (carryMesh) { player.group.remove(carryMesh); carryMesh = null; }
  const held = st.bag.at(-1); // you hold the last thing you picked up; the rest are in the bag
  if (held) { carryMesh = itemModel(held); carryMesh.scale.setScalar((ITEM_SCALE[held] ?? 1.5) * 0.85); carryMesh.position.set(0, 1.15, 0.42); player.group.add(carryMesh); }
  renderTracker();
}
function syncWorldFromState() {
  for (const id of Object.keys(ITEMS)) {
    const story = ITEMS[id].story, gone = story && npcState(story).stage === "done";
    if (gone || st.bag.includes(id)) removeItem(id); else placeItem(id, false);
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
