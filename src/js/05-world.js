
// the 3D engine, pinned; loaded before any world code runs
let THREE;
try {
  THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
} catch (e) {
  showFatal("The 3D engine couldn't load. Check your connection and reload the page.");
  throw e;
}

// ===================================================================
// 3D: renderer, sky, light
// ===================================================================
const canvas = $("#scene");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
  showFatal("This game needs WebGL, which this browser or device has turned off.");
  throw e;
}
const MOBILE = matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700;
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.6 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);

const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } },
  vertexShader: "varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
  fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float y = normalize(vP - cameraPosition).y; vec3 c = y > 0.0 ? mix(mid, top, pow(clamp(y,0.0,1.0), 0.6)) : mix(mid, bottom, clamp(-y*5.0,0.0,1.0)); gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}",
  side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat);
sky.renderOrder = -1; scene.add(sky);
scene.fog = new THREE.Fog(0xdde9f5, 70, 260);
const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8c7a5e, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
sun.position.set(32, 48, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 1, far: 160 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target);

// ===================================================================
// materials + canvas textures
// ===================================================================
const matCache = new Map();
function M(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({
    color, roughness: o.r ?? 0.85, metalness: o.m ?? 0, flatShading: o.flat ?? true,
    emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.o ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  }));
  return matCache.get(key);
}
function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m;
}
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rr = (g, x, y, w, h, r) => { if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); } else g.fillRect(x, y, w, h); };
function cobbleTex(base, gap, seed, repeat) {
  const R = rng(seed);
  return canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = gap; g.fillRect(0, 0, W, H);
    const c = new THREE.Color(base);
    for (let row = 0, y = 0; y < H; row++, y += 24) {
      for (let x = -16 + (row % 2) * 16; x < W; x += 32) {
        const k = 0.86 + R() * 0.24, t = c.clone().multiplyScalar(k);
        g.fillStyle = "#" + t.getHexString(); rr(g, x + 2 + R() * 2, y + 2 + R() * 2, 27, 19, 7);
        g.fillStyle = "rgba(255,255,255,.10)"; rr(g, x + 5, y + 4, 18, 4, 2);
      }
    }
  }, repeat);
}
function facadeTex(w, h, color, kind, R) {
  const ppm = 36;
  return canvasTex(Math.round(w * ppm), Math.round(h * ppm), (g, W, H) => {
    const X = m => m * ppm, Y = m => m * ppm;
    g.fillStyle = color; g.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 90; i++) { g.fillStyle = R() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"; g.fillRect(R() * W, R() * H, 2, 2); }
    const gf = kind === "civic" ? 4.2 : 3.6;
    g.fillStyle = "rgba(40,30,20,.10)"; g.fillRect(0, H - Y(gf), W, Y(gf));
    g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(0, H - Y(gf) - Y(0.14), W, Y(0.16));
    const floors = Math.max(1, Math.floor((h - gf - 0.6) / 2.8)), fh = (h - gf - 0.6) / floors;
    const cols = kind === "civic" ? 5 : Math.max(2, Math.round(w / 1.9));
    const shutters = kind !== "civic" && R() < 0.35, boxes = kind !== "civic" && R() < 0.55;
    const win = (cx, top, ww, wh, arch) => {
      g.fillStyle = "#F7F3EA"; g.fillRect(X(cx - ww / 2 - 0.09), Y(top - 0.09), X(ww + 0.18), Y(wh + 0.18));
      if (arch) { g.beginPath(); g.arc(X(cx), Y(top), X(ww / 2 + 0.09), Math.PI, 0); g.fill(); }
      const grd = g.createLinearGradient(0, Y(top), 0, Y(top + wh)); grd.addColorStop(0, "#4A6189"); grd.addColorStop(1, "#22324F");
      g.fillStyle = grd; g.fillRect(X(cx - ww / 2), Y(top), X(ww), Y(wh));
      if (arch) { g.beginPath(); g.arc(X(cx), Y(top), X(ww / 2), Math.PI, 0); g.fill(); }
      g.fillStyle = "#F7F3EA"; g.fillRect(X(cx - 0.03), Y(top), X(0.06), Y(wh)); g.fillRect(X(cx - ww / 2), Y(top + wh * 0.4), X(ww), Y(0.05));
      g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.moveTo(X(cx - ww / 2), Y(top + wh * 0.7)); g.lineTo(X(cx - ww * 0.05), Y(top)); g.lineTo(X(cx + ww * 0.2), Y(top)); g.lineTo(X(cx - ww / 2), Y(top + wh)); g.closePath(); g.fill();
    };
    for (let f = 0; f < floors; f++) {
      const top = 0.6 + f * fh + fh * 0.24, wh = fh * 0.56;
      for (let i = 0; i < cols; i++) {
        const cx = (i + 0.5) * w / cols, ww = Math.min(0.95, w / cols * 0.5);
        win(cx, top, ww, wh, kind === "civic");
        if (shutters) { g.fillStyle = "#3E6B4A"; g.fillRect(X(cx - ww / 2 - 0.32), Y(top), X(0.22), Y(wh)); g.fillRect(X(cx + ww / 2 + 0.1), Y(top), X(0.22), Y(wh)); }
        g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(X(cx - ww / 2 - 0.16), Y(top - 0.24), X(ww + 0.32), Y(0.09));
        if (boxes && f === floors - 1) {
          g.fillStyle = "#6B4A2E"; g.fillRect(X(cx - ww / 2 - 0.05), Y(top + wh + 0.06), X(ww + 0.1), Y(0.16));
          for (let k = 0; k < 5; k++) { g.fillStyle = ["#D84A4A", "#F2C14E", "#E86FA0"][k % 3]; g.beginPath(); g.arc(X(cx - ww / 2 + (k + 0.5) * ww / 5), Y(top + wh + 0.04), X(0.08), 0, Math.PI * 2); g.fill(); }
        }
      }
      if (f > 0) { g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect(0, Y(0.6 + f * fh) - 1, W, 2); }
    }
    const dw = kind === "civic" ? 2.0 : 1.25, dh = kind === "civic" ? 3.3 : 2.5, dcx = w / 2;
    g.fillStyle = "#EFE6D2"; g.beginPath(); g.moveTo(X(dcx - dw / 2 - 0.15), H); g.lineTo(X(dcx - dw / 2 - 0.15), H - Y(dh - dw / 2)); g.arc(X(dcx), H - Y(dh - dw / 2), X(dw / 2 + 0.15), Math.PI, 0); g.lineTo(X(dcx + dw / 2 + 0.15), H); g.fill();
    g.fillStyle = "#5B3A24"; g.beginPath(); g.moveTo(X(dcx - dw / 2), H); g.lineTo(X(dcx - dw / 2), H - Y(dh - dw / 2)); g.arc(X(dcx), H - Y(dh - dw / 2), X(dw / 2), Math.PI, 0); g.lineTo(X(dcx + dw / 2), H); g.fill();
    g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(X(dcx - 0.02), H - Y(dh - dw / 2), X(0.04), Y(dh - dw / 2));
    const sw = kind === "shop" ? 1.5 : 0.9, sh = kind === "shop" ? 1.9 : 1.4;
    for (const side of [-1, 1]) {
      const cx = dcx + side * (dw / 2 + 0.45 + sw / 2);
      if (cx - sw / 2 < 0.25 || cx + sw / 2 > w - 0.25) continue;
      win(cx, h - gf + 0.85, sw, sh, kind === "civic");
    }
  });
}
function signTex(text, bg = "#2F4A3A", fg = "#F4E3B5") {
  const tex = canvasTex(512, 96, () => {});
  const draw = () => {
    const g = tex.image.getContext("2d");
    g.fillStyle = bg; g.fillRect(0, 0, 512, 96);
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(8, 8, 496, 80);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `800 ${text.length > 9 ? 46 : 54}px "Baloo 2", "Trebuchet MS", sans-serif`;
    g.fillText(text, 256, 52);
    tex.needsUpdate = true;
  };
  draw(); signRedraws.push(draw);
  return tex;
}
const signRedraws = [];
document.fonts?.ready.then(() => signRedraws.forEach(f => f()));
const stripeTex = (a, b) => canvasTex(128, 32, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 16, 0, 16, 32); } });

// ===================================================================
// world bookkeeping: colliders, occluders, labels, interactables
// ===================================================================
const boxColliders = [], circleColliders = [], occluders = [], clickables = [];
const addBox = (x0, x1, z0, z1) => boxColliders.push({ x0, x1, z0, z1 });
const addCircle = (x, z, r) => circleColliders.push({ x, z, r });
const addOccluder = obj => { obj.updateMatrixWorld(true); occluders.push(new THREE.Box3().setFromObject(obj)); };
const labels = [];
const labelLayer = $("#labels");
function labelText(L) { return L.key && st.settings.hideKnown && status(L.key) === 2 ? "?" : L.word; }
function addWordLabel({ word, anchor, pos, y = 0, max = 10, kind = "", near = null }) {
  const key = keyOf(word);
  const L = { word, key, anchor, pos, y, max, shown: false, occ: false, slot: labels.length % 4, near };
  const btn = h("button", { class: "wl " + kind, type: "button", lang: "pl", dataset: { key, s: String(status(key)) } });
  btn.addEventListener("click", ev => { ev.stopPropagation(); openCard(word, btn, null); });
  L.btn = btn; btn.textContent = labelText(L);
  L.el = h("div", { class: "lbl", hidden: true }, btn);
  labelLayer.append(L.el); labels.push(L);
  return L;
}
const PALETTE = ["#E9B44C", "#E5826B", "#9FC5B8", "#8DB3D9", "#F2E3C6", "#C9A3D4", "#D96C5F", "#A7C77E", "#F0C9A0", "#E8D27A", "#B7D3E8", "#F3B7A1"];
const ROOFS = ["#A84B32", "#8E3B2A", "#B9603F", "#9A4A3A", "#5B6577"];
const SHOP = {};
const HOMES = {};

// ===================================================================
// ground
// ===================================================================
function buildGround() {
  const ground = mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: cobbleTex("#B9AE9C", "#7C7365", 3, 30), roughness: 0.95 }), 0, 0, 0, false);
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const ring = mesh(new THREE.RingGeometry(3.4, 7.2, 56), new THREE.MeshStandardMaterial({ map: cobbleTex("#D8CDB8", "#958B7B", 5, 3), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 }), 0, 0.005, 6, false);
  ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const slab = new THREE.MeshStandardMaterial({ map: cobbleTex("#9D9384", "#6A6256", 9, 4), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 });
  for (const [x, z, w, d] of [[0, -25.8, 54, 2.4], [0, 25.8, 54, 2.4], [-25.8, 0, 2.4, 49.2], [25.8, 0, 2.4, 49.2]]) {
    const s = mesh(new THREE.PlaneGeometry(w, d), slab, x, 0.006, z, false); s.rotation.x = -Math.PI / 2; scene.add(s);
  }
}

// ===================================================================
// houses
// ===================================================================
const triShape = (w, ht) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, ht); s.closePath(); return s; };
function stepShape(w) {
  const hw = w / 2, top = w * 0.14, hs = w * 0.17, steps = 3, dx = (hw - top) / steps, P = [[hw, 0]];
  let x = hw, y = 0;
  for (let i = 0; i < steps; i++) { y += hs; P.push([x, y]); x -= dx; P.push([x, y]); }
  y += hs; P.push([x, y]);
  const s = new THREE.Shape(); s.moveTo(-hw, 0);
  for (const p of P) s.lineTo(p[0], p[1]);
  for (const p of P.slice().reverse()) s.lineTo(-p[0], p[1]);
  return s;
}
function roundShape(w) {
  const hw = w / 2, s = new THREE.Shape();
  s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, w * 0.12);
  s.quadraticCurveTo(hw, w * 0.34, hw * 0.5, w * 0.36); s.lineTo(hw * 0.5, w * 0.52);
  s.quadraticCurveTo(hw * 0.45, w * 0.72, 0, w * 0.74); s.quadraticCurveTo(-hw * 0.45, w * 0.72, -hw * 0.5, w * 0.52);
  s.lineTo(-hw * 0.5, w * 0.36); s.quadraticCurveTo(-hw, w * 0.34, -hw, w * 0.12); s.closePath();
  return s;
}
function makeHouse({ w, h, d, color, roof, type, shop, R }) {
  const g = new THREE.Group(), wall = M(color);
  const facade = new THREE.MeshStandardMaterial({ map: facadeTex(w, h, color, shop ? "shop" : "house", R), roughness: 0.95 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [wall, wall, wall, wall, facade, wall]);
  walls.position.set(0, h / 2, -d / 2); walls.castShadow = walls.receiveShadow = true; g.add(walls); g.userData.walls = walls;
  g.add(mesh(new THREE.BoxGeometry(w + 0.25, 0.28, 0.4), M("#F3EDE1"), 0, h - 0.12, 0.06));
  const roofMat = M(roof);
  if (type === "flat") {
    g.add(mesh(new THREE.BoxGeometry(w, 1.1, 0.4), wall, 0, h + 0.55, -0.2));
    const n = Math.max(3, Math.round(w / 1.1));
    for (let i = 0; i < n; i++) g.add(mesh(new THREE.BoxGeometry(0.45, 0.5, 0.4), wall, -w / 2 + (i + 0.5) * w / n, h + 1.35, -0.2));
    const rp = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape(w * 0.98, 1.6), { depth: d - 0.6, bevelEnabled: false }), [wall, roofMat]);
    rp.position.set(0, h, -d); rp.castShadow = true; g.add(rp);
  } else {
    const rh = type === "tri" ? w * 0.55 : w * 0.42;
    const rp = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape(w, rh), { depth: d, bevelEnabled: false }), [wall, roofMat]);
    rp.position.set(0, h, -d); rp.castShadow = true; rp.receiveShadow = true; g.add(rp);
    if (type !== "tri") {
      const orn = mesh(new THREE.ExtrudeGeometry(type === "step" ? stepShape(w) : roundShape(w), { depth: 0.4, bevelEnabled: false }), wall, 0, h, -0.4);
      g.add(orn);
    }
    g.add(mesh(new THREE.CircleGeometry(Math.min(0.42, w * 0.07), 20), M("#2A3A5C"), 0, h + rh * 0.36, 0.02, false));
  }
  if (shop) {
    const bw = Math.min(w - 0.8, 3.8), wood = M("#4A3020");
    g.add(new THREE.Mesh(new THREE.BoxGeometry(bw, 0.62, 0.12), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: signTex(shop.toUpperCase()), roughness: 0.8 }), wood]));
    g.children.at(-1).position.set(0, 3.5, 0.08);
    const awn = SHOP_AWNINGS[shop];
    if (awn) {
      const am = new THREE.MeshStandardMaterial({ map: stripeTex(awn[0], awn[1]), roughness: 0.9 });
      const a = mesh(new THREE.BoxGeometry(Math.min(w - 0.4, 4.8), 0.06, 1.4), [M(awn[0]), M(awn[0]), am, am, am, am], 0, 2.78, 0.62);
      a.rotation.x = 0.36; g.add(a);
    }
  }
  return g;
}
const SHOP_AWNINGS = { piekarnia: ["#C8452F", "#F6EFE3"], kawiarnia: ["#2F6B4F", "#F3EAD3"], kwiaciarnia: ["#D8668E", "#FBEFF3"], apteka: ["#3A7F7A", "#EEF6F4"] };
const SIDES = {
  N: { rot: 0, at: (a, d) => [a, -27 + d] },
  S: { rot: Math.PI, at: (a, d) => [a, 27 - d] },
  W: { rot: Math.PI / 2, at: (a, d) => [-27 + d, a] },
  E: { rot: -Math.PI / 2, at: (a, d) => [27 - d, a] },
};
const SHOP_WANT = { N: [["apteka", -16], ["księgarnia", 16]], S: [["kwiaciarnia", -12], ["poczta", 12]], W: [["piekarnia", -6]], E: [["kawiarnia", 6]] };
function buildRows() {
  let seed = 11;
  for (const [side, def] of Object.entries(SIDES)) {
    const R = rng(seed += 17), ws = [];
    let sum = 0;
    while (sum < 54 - 7.6) { const w = 5.2 + R() * 2.4; ws.push(w); sum += w; }
    const rest = 54 - sum; if (rest < 4.6) ws[ws.length - 1] += rest; else ws.push(rest);
    let a0 = -27;
    const houses = ws.map(w => { const c = a0 + w / 2; a0 += w; return { w, a: c }; });
    for (const [name, target] of SHOP_WANT[side]) {
      let best = null;
      for (const hh of houses) if (!hh.shop && (!best || Math.abs(hh.a - target) < Math.abs(best.a - target))) best = hh;
      best.shop = name; SHOP[name] = { side, a: best.a, w: best.w };
    }
    houses.forEach((hh, i) => {
      const height = 9 + R() * 5, type = ["tri", "step", "round", "flat", "tri", "round"][Math.floor(R() * 6)];
      const g = makeHouse({ w: hh.w, h: height, d: 9, color: PALETTE[Math.floor(R() * PALETTE.length)], roof: ROOFS[Math.floor(R() * ROOFS.length)], type, shop: hh.shop, R });
      const [x, z] = def.at(hh.a, 0); g.position.set(x, 0, z); g.rotation.y = def.rot; scene.add(g);
      addOccluder(g.userData.walls);
      if (hh.shop) {
        const [sx, sz] = def.at(hh.a, 0.3);
        addWordLabel({ word: hh.shop, pos: new THREE.Vector3(sx, 4.15, sz), max: 26, kind: "sign" });
      }
    });
  }
  addBox(-40, 40, -40, -27); addBox(-40, 40, 27, 40); addBox(-40, -27, -40, 40); addBox(27, 40, -40, 40);
  for (const [x, z] of [[-31.5, -31.5], [31.5, -31.5], [-31.5, 31.5], [31.5, 31.5]]) {
    const b = mesh(new THREE.BoxGeometry(9, 12, 9), M(PALETTE[(x + z + 80) % PALETTE.length | 0]), x, 6, z); scene.add(b);
    const r = mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), M("#9A4A3A")); r.geometry.rotateY(Math.PI / 4); r.scale.set(9.4, 3, 9.4); r.position.set(x, 13.5, z); scene.add(r);
  }
}
function buildBackdrop() {
  const R = rng(99), mats = ["#C9B9A3", "#B8C3CC", "#D3B9A8", "#C2C9B4", "#D8CFC0"];
  for (let i = 0; i < 34; i++) {
    const ang = R() * Math.PI * 2, dist = 46 + R() * 40, x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
    if (x > -24 && x < 4 && z < -36 && z > -72) continue;
    const w = 6 + R() * 8, d = 6 + R() * 8, hgt = 8 + R() * 12;
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(w, hgt, d), M(mats[i % mats.length]), 0, hgt / 2, 0, false));
    const rp = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape(w, w * 0.45), { depth: d, bevelEnabled: false }), [M(mats[i % mats.length]), M(ROOFS[i % 4])]);
    rp.position.set(0, hgt, -d / 2); g.add(rp);
    g.position.set(x, 0, z); g.rotation.y = R() * Math.PI; scene.add(g);
  }
}

// ===================================================================
// landmarks
// ===================================================================
function buildRatusz() {
  const g = new THREE.Group(); g.position.set(0, 0, -9.5); scene.add(g);
  const w = 14, ht = 8, d = 9, cream = "#F1E4C8", wall = M(cream);
  const hall = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), [wall, wall, wall, wall, new THREE.MeshStandardMaterial({ map: facadeTex(w, ht, cream, "civic", rng(5)), roughness: 0.95 }), wall]);
  hall.position.y = ht / 2; hall.castShadow = hall.receiveShadow = true; g.add(hall);
  g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), M("#E2D3B2"), 0, ht, 0));
  const roof = mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), M("#9C4430")); roof.geometry.rotateY(Math.PI / 4); roof.scale.set(w + 0.4, 3.4, d + 0.4); roof.position.y = ht + 1.85; g.add(roof);
  const tw = M("#EBDDBD"), tx = -3.5, tz = 0.4;
  const tower = mesh(new THREE.BoxGeometry(3.6, 21, 3.6), tw, tx, 10.5, tz); g.add(tower);
  const clock = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => {
    c.fillStyle = "#F7F1E1"; c.beginPath(); c.arc(64, 64, 60, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "#1F3C91"; c.lineWidth = 6; c.stroke();
    c.fillStyle = "#1F3C91"; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); }
    c.strokeStyle = "#1A1A1A"; c.lineCap = "round"; c.lineWidth = 6; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 30); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
  }), roughness: 0.6 });
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(1.25, 28), clock), a = k * Math.PI / 2;
    f.position.set(tx + Math.sin(a) * 1.82, 16.5, tz + Math.cos(a) * 1.82); f.rotation.y = a; g.add(f);
  }
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; const wnd = mesh(new THREE.BoxGeometry(0.7, 1.6, 0.05), M("#2A3A5C"), tx + Math.sin(a) * 1.82, 12.5, tz + Math.cos(a) * 1.82, false); wnd.rotation.y = a; g.add(wnd); }
  g.add(mesh(new THREE.BoxGeometry(4.4, 0.4, 4.4), M("#E2D3B2"), tx, 21.2, tz));
  g.add(mesh(new THREE.BoxGeometry(2.6, 2.4, 2.6), tw, tx, 22.6, tz));
  g.add(mesh(new THREE.ConeGeometry(1.8, 1.4, 8), M("#5E9E86"), tx, 24.5, tz));
  g.add(mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.4, 8), M("#5E9E86"), tx, 25.9, tz));
  g.add(mesh(new THREE.ConeGeometry(1.1, 6.5, 8), M("#5E9E86"), tx, 29.8, tz));
  g.add(mesh(new THREE.SphereGeometry(0.28, 10, 8), M("#E9B53B", { m: 0.6, r: 0.3 }), tx, 33.2, tz));
  const stone = M("#D9D0BE");
  g.add(mesh(new THREE.BoxGeometry(6.4, 0.2, 1.4), stone, 0, 0.1, d / 2 + 0.7));
  g.add(mesh(new THREE.BoxGeometry(5.6, 0.4, 0.7), stone, 0, 0.2, d / 2 + 0.35));
  const wood = M("#4A3020");
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 0.12), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: signTex("RATUSZ", "#1F3C91", "#F4E3B5") }), wood]);
  board.position.set(0, 5.2, d / 2 + 0.07); g.add(board);
  addWordLabel({ word: "ratusz", pos: new THREE.Vector3(0, 5.9, -9.5 + d / 2 + 0.3), max: 30, kind: "sign" });
  addWordLabel({ word: "zegar", pos: new THREE.Vector3(tx, 18.2, -9.5 + tz + 2.0), max: 40, kind: "small" });
  addWordLabel({ word: "schody", pos: new THREE.Vector3(-2.0, 0.95, -9.5 + d / 2 + 1.0), max: 7, kind: "small" });
  addOccluder(hall); addOccluder(tower);
  addBox(-7.2, 7.2, -14.2, -4.8); addBox(-3.2, 3.2, -4.8, -3.9);
}
function buildChurch() {
  const g = new THREE.Group(); g.position.set(-10, 0, -44); scene.add(g);
  const brick = M("#A44D36"), roof = M("#4E3B33"), cop = M("#4F8A72");
  g.add(mesh(new THREE.BoxGeometry(9, 18, 26), brick, 0, 9, -13));
  const rp = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape(9, 6), { depth: 26, bevelEnabled: false }), [brick, roof]); rp.position.set(0, 18, -26); g.add(rp);
  g.add(mesh(new THREE.BoxGeometry(5, 34, 5), brick, -4.2, 17, 0));
  g.add(mesh(new THREE.ConeGeometry(3.4, 12, 8), cop, -4.2, 40, 0));
  for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) g.add(mesh(new THREE.ConeGeometry(0.55, 4, 6), cop, -4.2 + dx, 36, dz));
  g.add(mesh(new THREE.SphereGeometry(0.5, 10, 8), M("#E9B53B", { m: 0.6, r: 0.3 }), -4.2, 46.4, 0));
  g.add(mesh(new THREE.BoxGeometry(4.4, 28, 4.4), brick, 4, 14, 0));
  const dome = mesh(new THREE.SphereGeometry(2.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cop, 4, 28, 0); g.add(dome);
  g.add(mesh(new THREE.ConeGeometry(0.7, 4, 8), cop, 4, 32, 0));
  for (const x of [-4.2, 4]) for (const y of [12, 22]) g.add(mesh(new THREE.BoxGeometry(0.9, 3.2, 0.1), M("#2A3A5C"), x, y, 2.55, false));
  addWordLabel({ word: "kościół", pos: new THREE.Vector3(-14.2, 48, -44), max: 140 });
}
const lampGlass = new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffc873, emissiveIntensity: 0.15, roughness: 0.4 });
const lampLights = [];
function buildFountain() {
  const g = new THREE.Group(); g.position.set(0, 0, 6); scene.add(g);
  const stone = M("#D9D2C3"), dark = M("#BDB4A3");
  g.add(mesh(new THREE.CylinderGeometry(3.3, 3.45, 0.6, 40, 1, true), M("#D2C9B8", { ds: true }), 0, 0.3, 0));
  const rim = mesh(new THREE.TorusGeometry(3.3, 0.2, 8, 48), stone, 0, 0.62, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  const water = new THREE.MeshStandardMaterial({ color: 0x5fa8d3, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88 });
  const pool = mesh(new THREE.CircleGeometry(3.3, 40), water, 0, 0.46, 0, false); pool.rotation.x = -Math.PI / 2; g.add(pool);
  g.add(mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.7, 12), dark, 0, 1.1, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.25, 0.5, 0.4, 20), stone, 0, 1.95, 0));
  const bowlW = mesh(new THREE.CircleGeometry(1.15, 20), water, 0, 2.13, 0, false); bowlW.rotation.x = -Math.PI / 2; g.add(bowlW);
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.5, 10), dark, 0, 2.4, 0));
  g.add(mesh(new THREE.SphereGeometry(0.22, 10, 8), stone, 0, 2.7, 0));
  const N = 180, pos = new Float32Array(N * 3), drops = [];
  for (let i = 0; i < N; i++) drops.push({ a: Math.random() * Math.PI * 2, p: Math.random(), outer: i % 3 !== 0 });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd8efff, size: 0.09, transparent: true, opacity: 0.85 }));
  g.add(pts);
  fountain = { geo, pos, drops };
  addWordLabel({ word: "fontanna", anchor: g, y: 3.3, max: 15 });
  addCircle(0, 6, 3.55);
}
let fountain = null;
function updateFountain(dt) {
  if (!fountain) return;
  const { pos, drops, geo } = fountain;
  drops.forEach((d, i) => {
    d.p = (d.p + dt / (d.outer ? 0.9 : 0.75)) % 1;
    let x, y, z;
    if (d.outer) { const t = d.p * 0.9, r = 1.2 + 1.7 * t; x = Math.cos(d.a) * r; z = Math.sin(d.a) * r; y = 2.1 + 1.6 * t - 4.9 * t * t; if (y < 0.46) y = 0.46; }
    else { const t = d.p * 0.75, r = 1.3 * t; x = Math.cos(d.a) * r; z = Math.sin(d.a) * r; y = 2.85 + 2.4 * t - 4.9 * t * t; if (y < 2.13) y = 2.13; }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
  });
  geo.attributes.position.needsUpdate = true;
}
