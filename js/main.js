// Retail F1 Fiber – 3D-Glasfaser-Truck-Rennen
import * as THREE from 'three';

/* =====================================================================
   KONFIGURATION
   ===================================================================== */
const SUPABASE_URL = 'https://ihqcgjndnjxxgeqheoei.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0YKvFqXx8JX_xGH6ZcloRg_1Lrb_Ngz'; // öffentlicher (publishable) Key
const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
const PARAMS = new URLSearchParams(location.search);
const LAPS = Math.max(1, Math.min(9, parseInt(PARAMS.get('laps') || '3', 10) || 3));
const AUTODRIVE = PARAMS.has('autodrive');   // Testhilfe: eigener Truck fährt per KI
const NET_HZ = 12;
const MAGENTA = 0xE20074;

/* =====================================================================
   HILFSFUNKTIONEN
   ===================================================================== */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const wrapAng = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mem = {};
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {} return k in mem ? mem[k] : d; },
  set(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} }
};
function cleanName(s) {
  s = String(s || '').toUpperCase().replace(/ß/g, 'SS');
  return s.replace(/[^A-Z0-9ÄÖÜ !?.,:\-\/'+()&_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}
function fmtTime(ms) {
  if (!isFinite(ms) || ms < 0) return '--:--.--';
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, c = Math.floor(ms / 10) % 100;
  return m + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0');
}
const $ = id => document.getElementById(id);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const isMobile = isTouch && Math.min(screen.width, screen.height) < 900;
function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }

/* =====================================================================
   CANVAS-TEXTUREN
   ===================================================================== */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, opts = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  if (opts.nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; }
  return t;
}
// Telekom-"T" (vereinfacht): T mit zwei Quadraten
function drawT(g, x, y, s, col = '#fff') {
  g.fillStyle = col;
  g.fillRect(x - s * 0.5, y - s * 0.5, s, s * 0.2);            // Balken
  g.fillRect(x - s * 0.1, y - s * 0.5, s * 0.2, s);            // Stamm
  g.fillRect(x - s * 0.5, y + s * 0.02, s * 0.2, s * 0.2);     // Quadrat links
  g.fillRect(x + s * 0.3, y + s * 0.02, s * 0.2, s * 0.2);     // Quadrat rechts
}
function drawQR(g, x, y, s, seed) {
  const r = rng(seed), n = 21, c = s / n;
  g.fillStyle = '#fff'; g.fillRect(x - c * 2, y - c * 2, s + c * 4, s + c * 4);
  g.fillStyle = '#111';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (r() > 0.52) g.fillRect(x + i * c, y + j * c, c, c);
  for (const [fx, fy] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    g.fillStyle = '#111'; g.fillRect(x + fx * c, y + fy * c, 7 * c, 7 * c);
    g.fillStyle = '#fff'; g.fillRect(x + (fx + 1) * c, y + (fy + 1) * c, 5 * c, 5 * c);
    g.fillStyle = '#111'; g.fillRect(x + (fx + 2) * c, y + (fy + 2) * c, 3 * c, 3 * c);
  }
}
function magentaBg(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#ec2a8a'); gr.addColorStop(1, '#c8006a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
function drawFiberBundle(g, cx, cy, r) {
  // Kabel-Swoosh
  g.save();
  const sw = g.createLinearGradient(0, cy, cx, cy);
  sw.addColorStop(0, 'rgba(120,0,60,0)'); sw.addColorStop(0.6, 'rgba(110,0,58,.85)'); sw.addColorStop(1, '#5a0030');
  g.strokeStyle = sw; g.lineWidth = r * 0.9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-40, cy + r * 1.9); g.bezierCurveTo(cx * 0.4, cy + r * 1.8, cx * 0.7, cy + r * 1.2, cx - r * 0.3, cy + r * 0.2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = r * 0.12;
  g.beginPath(); g.moveTo(-40, cy + r * 1.55); g.bezierCurveTo(cx * 0.4, cy + r * 1.45, cx * 0.7, cy + r * 0.9, cx - r * 0.4, cy - r * 0.05); g.stroke();
  // Kabelende mit Fasern
  g.fillStyle = '#4a0028'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d9d9e0'; g.beginPath(); g.arc(cx, cy, r * 0.82, 0, Math.PI * 2); g.fill();
  const tubes = [[0, 0], [-0.4, -0.25], [0.4, -0.25], [-0.35, 0.35], [0.35, 0.35], [0, -0.5]];
  tubes.forEach(([dx, dy], k) => {
    const tx = cx + dx * r, ty = cy + dy * r, tr = r * (k === 0 ? 0.24 : 0.18);
    const len = r * (0.6 + k * 0.12);
    g.fillStyle = '#9a9aa6'; g.fillRect(tx - tr, ty - len, tr * 2, len);
    const gr = g.createRadialGradient(tx - tr * 0.3, ty - len - tr * 0.3, 1, tx, ty - len, tr);
    gr.addColorStop(0, '#fff'); gr.addColorStop(1, k % 2 ? '#ff6fb5' : '#b8b8c4');
    g.fillStyle = gr; g.beginPath(); g.arc(tx, ty - len, tr, 0, Math.PI * 2); g.fill();
  });
  g.restore();
}
// Seitenwand des Koffers. front: 'left' | 'right' (wo das Fahrerhaus ist); door: Tür einzeichnen
function sideTexture(front, door, variant) {
  const W = 920, H = 600, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  const graphicsW = door ? W * 0.62 : W;
  const ox = (front === 'left' && !door) ? W * 0.18 : 0;
  drawFiberBundle(g, ox + graphicsW * 0.74, 210, 62);
  g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  g.font = 'bold 38px "Trebuchet MS",Verdana,sans-serif';
  g.fillText('Wir verbinden euch mit', ox + 52, 110);
  drawT(g, ox + 88, 172, 58);
  g.font = 'bold 70px "Trebuchet MS",Verdana,sans-serif';
  g.fillText('GLASFASER', ox + 128, 198);
  g.font = '30px "Trebuchet MS",Verdana,sans-serif';
  g.fillText('Schnell. Stabil. Zukunftssicher.', ox + 54, 248);
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
  g.strokeRect(ox + 44, 130, 470, 132);
  drawQR(g, ox + 60, 430, 84, 7);
  g.font = '18px "Trebuchet MS",Verdana,sans-serif';
  g.fillText('Infos unter telekom.de/glasfaser', ox + 172, 462);
  g.fillText('im Telekom Shop oder unter 0800 22 66100', ox + 172, 488);
  if (variant.stripes) {
    g.fillStyle = '#fff'; g.fillRect(0, H - 70, W, 14); g.fillRect(0, H - 48, W, 6);
    g.font = 'italic bold 90px "Trebuchet MS",Verdana,sans-serif'; g.fillStyle = 'rgba(255,255,255,.9)';
    g.fillText('#1', door ? graphicsW - 150 : W - 190, H - 100);
  }
  if (door) {
    // geöffnete Seitentür mit Beratungsraum
    const dx = W * 0.66, dw = W * 0.3;
    g.fillStyle = '#d8d8de'; g.fillRect(dx - 10, 60, dw + 20, H - 70);
    const ig = g.createLinearGradient(0, 70, 0, H - 20);
    ig.addColorStop(0, '#fffdf6'); ig.addColorStop(1, '#d9d4ca');
    g.fillStyle = ig; g.fillRect(dx, 70, dw, H - 90);
    g.fillStyle = '#2a2a30'; g.fillRect(dx + dw * 0.45, 130, dw * 0.42, 90);       // Bildschirm
    g.fillStyle = '#4aa0e0'; g.fillRect(dx + dw * 0.48, 138, dw * 0.36, 74);
    g.fillStyle = '#f2f2f2'; g.fillRect(dx + 14, 330, dw * 0.45, 180);             // Tresen
    g.fillStyle = '#E20074'; g.fillRect(dx + 14, 330, dw * 0.45, 16);
    g.fillStyle = '#ffe9a8'; g.fillRect(dx + 30, 80, dw - 60, 8);                  // Licht
    g.fillStyle = '#9a9aa2'; g.fillRect(dx + dw - 16, 240, 6, 200);                // Haltestange
    g.fillStyle = 'rgba(150,200,240,.25)'; g.fillRect(dx, 70, dw * 0.35, H - 90);  // Glas
  }
  return tex(c);
}
function rearTexture() {
  const W = 512, H = 520, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  drawT(g, W / 2, 150, 120);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = 'bold 66px "Trebuchet MS",Verdana,sans-serif'; g.fillText('GLASFASER', W / 2, 290);
  g.font = '28px "Trebuchet MS",Verdana,sans-serif'; g.fillText('Schnell. Stabil. Zukunftssicher.', W / 2, 336);
  g.fillStyle = '#ff7a00'; g.fillRect(30, H - 60, 50, 22); g.fillRect(W - 80, H - 60, 50, 22);
  g.fillStyle = '#d00'; g.fillRect(30, H - 90, 50, 26); g.fillRect(W - 80, H - 90, 50, 26);
  return tex(c);
}
function tLogoTexture() {
  const c = canvas(128, 128), g = c.getContext('2d');
  drawT(g, 64, 64, 90);
  return tex(c);
}
function asphaltTexture() {
  const c = canvas(128, 256), g = c.getContext('2d');
  g.fillStyle = '#4a4a50'; g.fillRect(0, 0, 128, 256);
  const r = rng(3);
  for (let i = 0; i < 900; i++) { const v = 60 + Math.floor(r() * 40); g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 256), 2, 2); }
  g.fillStyle = '#f4f4f4'; g.fillRect(61, 0, 6, 120);              // Mittellinie gestrichelt
  g.fillStyle = '#e8e8e8'; g.fillRect(4, 0, 4, 256); g.fillRect(120, 0, 4, 256); // Randlinien
  return tex(c, { repeat: [1, 1], nearest: true });
}
function curbTexture() {
  const c = canvas(16, 64), g = c.getContext('2d');
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 16, 64);
  g.fillStyle = '#E20074'; g.fillRect(0, 0, 16, 32);
  return tex(c, { repeat: [1, 1], nearest: true });
}
function grassTexture() {
  const c = canvas(128, 128), g = c.getContext('2d');
  g.fillStyle = '#5c9e3e'; g.fillRect(0, 0, 128, 128);
  const r = rng(9);
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() > 0.5 ? '#6aae48' : '#4f8c35'; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 2, 2); }
  for (let i = 0; i < 40; i++) { g.fillStyle = r() > 0.5 ? '#ffffff' : '#ffe066'; g.fillRect(Math.floor(r() * 128), Math.floor(r() * 128), 1, 1); }
  return tex(c, { repeat: [90, 90], nearest: true });
}
function pflasterTexture() {
  const c = canvas(64, 64), g = c.getContext('2d');
  g.fillStyle = '#8a8580'; g.fillRect(0, 0, 64, 64);
  const r = rng(12);
  for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? -4 : 0; x < 64; x += 8) { const v = 120 + Math.floor(r() * 40); g.fillStyle = `rgb(${v},${v - 6},${v - 12})`; g.fillRect(x + 1, y + 1, 6, 6); }
  return tex(c, { repeat: [1, 1], nearest: true });
}
function fachwerkTexture(seed, wallCol) {
  const W = 256, H = 256, c = canvas(W, H), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = wallCol; g.fillRect(0, 0, W, H);
  g.fillStyle = '#4a2c1c';
  g.fillRect(0, 0, W, 10); g.fillRect(0, H / 2 - 5, W, 10); g.fillRect(0, H - 10, W, 10);
  for (let x = 0; x <= W; x += 64) g.fillRect(x - 5, 0, 10, H);
  g.strokeStyle = '#4a2c1c'; g.lineWidth = 8;
  for (let x = 0; x < W; x += 64) for (let fl = 0; fl < 2; fl++) {
    const y0 = fl * H / 2, y1 = y0 + H / 2;
    if (r() > 0.45) { g.beginPath(); if (r() > 0.5) { g.moveTo(x, y1); g.lineTo(x + 64, y0); } else { g.moveTo(x, y0); g.lineTo(x + 64, y1); } g.stroke(); }
    else {
      g.fillStyle = '#9ccbe8'; g.fillRect(x + 18, y0 + 30, 28, 44);
      g.fillStyle = '#fff'; g.fillRect(x + 31, y0 + 30, 3, 44); g.fillRect(x + 18, y0 + 50, 28, 3);
      g.fillStyle = '#4a2c1c';
      if (r() > 0.5) { g.fillStyle = '#d23a6a'; g.fillRect(x + 16, y0 + 76, 32, 6); g.fillStyle = '#4a2c1c'; }
    }
  }
  return tex(c);
}
function roofTexture(col) {
  const c = canvas(64, 64), g = c.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y + 6, 64, 2); for (let x = (y / 8) % 2 ? 4 : 0; x < 64; x += 8) g.fillRect(x, y, 1, 8); }
  return tex(c, { repeat: [3, 2], nearest: true });
}
function signTexture(lines, bg = '#E20074', fg = '#fff', w = 512, h = 128, withT = true) {
  const c = canvas(w, h), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  let x0 = 20;
  if (withT) { drawT(g, h * 0.5, h * 0.5, h * 0.62, fg); x0 = h * 0.95; }
  g.fillStyle = fg; g.textBaseline = 'middle';
  const fs = Math.floor(h / (lines.length + 0.6));
  lines.forEach((ln, i) => { g.font = `bold ${i === 0 ? fs : Math.floor(fs * 0.7)}px "Trebuchet MS",Verdana,sans-serif`; g.fillText(ln, x0, h * (i + 0.8) / (lines.length + 0.6)); });
  return tex(c);
}
function paperTexture() {
  const c = canvas(128, 168), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 168);
  g.fillStyle = '#E20074'; g.fillRect(0, 0, 128, 40);
  g.fillStyle = '#fff'; g.font = 'bold 26px "Trebuchet MS",Verdana,sans-serif'; g.textAlign = 'center'; g.fillText('HA-Only', 64, 29);
  g.fillStyle = '#bbb'; for (let y = 56; y < 130; y += 11) g.fillRect(14, y, 100 - (y % 3) * 8, 4);
  g.strokeStyle = '#1a3a8a'; g.lineWidth = 3; g.beginPath(); g.moveTo(16, 150); g.bezierCurveTo(40, 130, 50, 165, 70, 145); g.bezierCurveTo(80, 135, 95, 160, 112, 142); g.stroke();
  g.fillStyle = '#E20074'; g.font = 'bold 12px sans-serif'; g.fillText('VERTRAG', 64, 164);
  return tex(c);
}
function itemBoxTexture() {
  const c = canvas(128, 128), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#ff4fa8'); gr.addColorStop(1, '#E20074');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(6, 6, 116, 116);
  g.fillStyle = '#fff'; g.font = 'bold 84px "Trebuchet MS",Verdana,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 70);
  return tex(c);
}
function nameTagSprite(text, color = '#E20074') {
  const c = canvas(256, 64), g = c.getContext('2d');
  g.font = 'bold 30px "Trebuchet MS",Verdana,sans-serif';
  const w = Math.min(250, g.measureText(text).width + 24);
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(128 - w / 2, 8, w, 46);
  g.fillStyle = color; g.fillRect(128 - w / 2, 50, w, 4);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 31);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(c), depthTest: false, transparent: true }));
  s.scale.set(3.4, 0.85, 1); s.renderOrder = 10;
  return s;
}

/* =====================================================================
   TRUCK-VARIANTEN
   ===================================================================== */
const TRUCKS = [
  { key: 'classic', name: 'GLASFASER CLASSIC', desc: 'Der Klassiker vom Supermarkt-Parkplatz. Silberne Felgen, Tür auf, Kaffee an.', speed: 7, accel: 6, handling: 7, rims: 'silver', awning: false, ac: true },
  { key: 'markise', name: 'SHOWTRUCK MARKISE', desc: 'Mit ausgefahrener Markise und Kundenstopper – Beratung im Vorbeifahren.', speed: 6, accel: 7, handling: 8, rims: 'silver', awning: true, ac: true, aboard: true },
  { key: 'speed', name: 'SPEED-FASER #1', desc: 'Schwarze Felgen, Rennstreifen, Spoiler. 1 GBit/s auch auf der Straße.', speed: 9, accel: 7, handling: 5, rims: 'black', awning: false, ac: false, stripes: true, spoiler: true },
  { key: 'giga', name: 'GIGABIT-MOBIL', desc: 'Mit Glasfaser-Kabeltrommel auf dem Dach. Zieht an wie ein frischer Anschluss.', speed: 6, accel: 9, handling: 6, rims: 'black', awning: false, ac: true, spool: true }
];
function statsOf(v) {
  return { top: 27 + v.speed * 2.1, accel: 7 + v.accel * 1.05, steer: 0.95 + v.handling * 0.11, grip: 0.5 + v.handling * 0.05 };
}

/* =====================================================================
   TRUCK-MODELL (prozedural, Front = +z)
   ===================================================================== */
const matCache = {};
function M(key, make) { return matCache[key] || (matCache[key] = make()); }
const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const texCache = {};
function T(key, make) { return texCache[key] || (texCache[key] = make()); }

function profileGeo(points, depth) {
  const sh = new THREE.Shape();
  sh.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]);
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  geo.rotateY(-Math.PI / 2);
  geo.translate(depth / 2, 0, 0);
  return geo;
}
function makeWheel(rims) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(M('tireGeo', () => new THREE.CylinderGeometry(0.47, 0.47, 0.34, 14).rotateZ(Math.PI / 2)), M('tire', () => lam(0x1b1b1e)));
  g.add(tire);
  const rimMat = rims === 'black' ? M('rimB', () => lam(0x222226)) : M('rimS', () => lam(0xd4d8de));
  const rim = new THREE.Mesh(M('rimGeo', () => new THREE.CylinderGeometry(0.3, 0.3, 0.36, 10).rotateZ(Math.PI / 2)), rimMat);
  g.add(rim);
  const spokeMat = rims === 'black' ? M('spokeB', () => lam(0x8a8e96)) : M('spokeS', () => lam(0x7a7e86));
  for (let k = 0; k < 5; k++) {
    const sp = new THREE.Mesh(M('spokeGeo', () => new THREE.BoxGeometry(0.38, 0.07, 0.4)), spokeMat);
    sp.rotation.x = k * Math.PI / 5; g.add(sp);
  }
  return g;
}
function makeTruck(vi, opts = {}) {
  const v = TRUCKS[vi % TRUCKS.length];
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const mg = M('magenta', () => lam(MAGENTA));
  const mgDark = M('magentaDark', () => lam(0x9a0050));
  const dark = M('dark', () => lam(0x222226));
  const glass = M('glass', () => new THREE.MeshLambertMaterial({ color: 0x1d2c3c, emissive: 0x0a1420 }));
  // Koffer: Materialien [+x links, -x rechts(Tür), +y, -y, +z, -z]
  const sideL = M('sideL_' + v.key, () => new THREE.MeshLambertMaterial({ map: sideTexture('left', false, v) }));
  const sideR = M('sideR_' + v.key, () => new THREE.MeshLambertMaterial({ map: sideTexture('right', true, v) }));
  const rear = M('rear', () => new THREE.MeshLambertMaterial({ map: rearTexture() }));
  const box = new THREE.Mesh(M('boxGeo', () => new THREE.BoxGeometry(2.3, 2.35, 3.6)), [sideL, sideR, mg, dark, mg, rear]);
  box.position.set(0, 0.62 + 1.175, -1.2); body.add(box);
  // Luton über dem Fahrerhaus
  const luton = new THREE.Mesh(M('lutonGeo', () => profileGeo([[0.6, 2.25], [1.45, 2.25], [1.75, 2.42], [1.82, 2.72], [1.62, 2.97], [0.6, 2.97]], 2.2)), mg);
  body.add(luton);
  // Fahrerhaus
  const cab = new THREE.Mesh(M('cabGeo', () => profileGeo([[0.6, 0.42], [2.88, 0.42], [2.95, 0.95], [2.78, 1.27], [2.32, 1.42], [1.58, 2.24], [0.6, 2.24]], 2.12)), mg);
  body.add(cab);
  const ws = new THREE.Mesh(M('wsGeo', () => new THREE.PlaneGeometry(1.95, 1.04)), glass);
  ws.position.set(0, 1.83, 1.97); ws.rotation.x = -0.73; ws.translateZ(0.015); body.add(ws);
  for (const sx of [1, -1]) {
    const sw = new THREE.Mesh(M('swGeo', () => new THREE.PlaneGeometry(0.85, 0.62)), glass);
    sw.position.set(sx * 1.065, 1.78, 1.25); sw.rotation.y = sx * Math.PI / 2; body.add(sw);
    const tl = new THREE.Mesh(M('tGeo', () => new THREE.PlaneGeometry(0.42, 0.42)), M('tlogo', () => new THREE.MeshLambertMaterial({ map: tLogoTexture(), transparent: true })));
    tl.position.set(sx * 1.068, 1.05, 1.2); tl.rotation.y = sx * Math.PI / 2; body.add(tl);
    const mir = new THREE.Mesh(M('mirGeo', () => new THREE.BoxGeometry(0.12, 0.32, 0.2)), dark);
    mir.position.set(sx * 1.2, 1.8, 1.72); body.add(mir);
    const hl = new THREE.Mesh(M('hlGeo', () => new THREE.BoxGeometry(0.42, 0.16, 0.06)), M('hl', () => new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xfff2c0 })));
    hl.position.set(sx * 0.68, 1.18, 2.83); hl.rotation.x = -0.5; body.add(hl);
    const tail = new THREE.Mesh(M('tailGeo', () => new THREE.BoxGeometry(0.3, 0.18, 0.05)), M('tail', () => new THREE.MeshLambertMaterial({ color: 0xff2020, emissive: 0x880000 })));
    tail.position.set(sx * 0.85, 0.85, -3.03); body.add(tail);
  }
  const grill = new THREE.Mesh(M('grillGeo', () => new THREE.BoxGeometry(1.0, 0.3, 0.06)), dark); grill.position.set(0, 0.9, 2.93); body.add(grill);
  const bump = new THREE.Mesh(M('bumpGeo', () => new THREE.BoxGeometry(2.16, 0.3, 0.2)), mgDark); bump.position.set(0, 0.55, 2.9); body.add(bump);
  const chassis = new THREE.Mesh(M('chGeo', () => new THREE.BoxGeometry(1.9, 0.25, 5.6)), dark); chassis.position.set(0, 0.5, -0.1); body.add(chassis);
  // Tritt unter der Tür
  const step = new THREE.Mesh(M('stepGeo', () => new THREE.BoxGeometry(0.4, 0.12, 1.0)), dark); step.position.set(-1.3, 0.42, -0.3); body.add(step);
  // Extras
  if (v.ac) { const ac = new THREE.Mesh(M('acGeo', () => new THREE.BoxGeometry(0.95, 0.28, 0.75)), M('white', () => lam(0xf2f2f2))); ac.position.set(0, 3.11, -1.6); body.add(ac); }
  if (v.awning) {
    const aw = new THREE.Group();
    const cloth = new THREE.Mesh(M('awGeo', () => new THREE.BoxGeometry(1.5, 0.05, 1.9)), M('awMat', () => lam(0xd8d8de)));
    cloth.position.set(-0.75, 0, 0); aw.add(cloth);
    const edge = new THREE.Mesh(M('awEdgeGeo', () => new THREE.BoxGeometry(0.06, 0.22, 1.9)), mg); edge.position.set(-1.5, -0.08, 0); aw.add(edge);
    aw.position.set(-1.16, 2.85, -0.3); aw.rotation.z = -0.18; body.add(aw);
  }
  if (v.spoiler) {
    const sp = new THREE.Mesh(M('spGeo', () => new THREE.BoxGeometry(2.2, 0.08, 0.6)), dark); sp.position.set(0, 3.25, -2.75); body.add(sp);
    for (const sx of [0.8, -0.8]) { const p = new THREE.Mesh(M('spPGeo', () => new THREE.BoxGeometry(0.08, 0.28, 0.2)), dark); p.position.set(sx, 3.1, -2.75); body.add(p); }
  }
  if (v.spool) {
    const sp = new THREE.Group();
    const wood = M('wood', () => lam(0xb07a42));
    for (const sx of [0.55, -0.55]) { const d = new THREE.Mesh(M('spoolD', () => new THREE.CylinderGeometry(0.62, 0.62, 0.08, 14).rotateZ(Math.PI / 2)), wood); d.position.x = sx; sp.add(d); }
    const core = new THREE.Mesh(M('spoolC', () => new THREE.CylinderGeometry(0.46, 0.46, 1.04, 14).rotateZ(Math.PI / 2)), M('cable', () => lam(0xff4fa8))); sp.add(core);
    sp.position.set(0, 3.62, -1.7); body.add(sp);
  }
  // Räder
  const wheels = [];
  for (const [wx, wz, front] of [[1.02, 2.15, true], [-1.02, 2.15, true], [1.02, -1.95, false], [-1.02, -1.95, false]]) {
    const holder = new THREE.Group(); holder.position.set(wx, 0.47, wz);
    const w = makeWheel(v.rims); holder.add(w); root.add(holder);
    wheels.push({ holder, wheel: w, front });
  }
  // Schatten-Fleck
  const sh = new THREE.Mesh(M('shGeo', () => new THREE.PlaneGeometry(3.0, 6.6).rotateX(-Math.PI / 2)), M('shMat', () => new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })));
  sh.position.y = 0.04; root.add(sh);
  if (opts.display && v.aboard) {
    const ab = new THREE.Group();
    const pm = M('aboardMat', () => new THREE.MeshLambertMaterial({ map: signTexture(['GLASFASER', 'Jetzt beraten', 'lassen!'], '#E20074', '#fff', 256, 340, false) }));
    for (const s of [1, -1]) { const p = new THREE.Mesh(M('abGeo', () => new THREE.PlaneGeometry(0.8, 1.15)), [pm][0]); p.position.set(0, 0.62, s * 0.22); p.rotation.x = s * 0.33; p.rotation.y = s > 0 ? 0 : Math.PI; ab.add(p); }
    ab.position.set(-2.6, 0, 0.8); ab.rotation.y = Math.PI / 2; root.add(ab);
  }
  root.userData = { wheels, body, variant: v };
  return root;
}
function animateTruck(m, speed, steer, dt) {
  for (const w of m.userData.wheels) {
    w.wheel.rotation.x += speed * dt / 0.47;
    if (w.front) w.holder.rotation.y = steer * 0.45;
  }
}

/* =====================================================================
   STRECKE: "Glasfaser-Ring Kleinstadt"
   ===================================================================== */
const HW = 8.5;               // halbe Fahrbahnbreite
const WALL = HW + 6;          // weiche Begrenzung
const CTRL = [[0, 0], [70, -10], [140, -2], [190, 40], [200, 105], [160, 150], [100, 160], [62, 128], [22, 158], [-38, 186], [-100, 170], [-142, 122], [-150, 60], [-118, 16], [-60, -4]];
const track = { N: 0, pts: [], tan: [], left: [], len: 0, cum: [] };
function buildTrackData() {
  const curve = new THREE.CatmullRomCurve3(CTRL.map(([x, z]) => new THREE.Vector3(x * 1.15, 0, z * 1.15)), true, 'centripetal');
  const L = curve.getLength();
  const N = Math.round(L / 1.6);
  const pts = curve.getSpacedPoints(N).slice(0, N);
  track.N = N; track.pts = pts; track.len = L; track.cum = [];
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N];
    const t = new THREE.Vector3().subVectors(b, a).normalize();
    track.tan.push(t);
    track.left.push(new THREE.Vector3(t.z, 0, -t.x));
    track.cum.push(i * L / N);
  }
}
function nearestIdx(x, z, hint) {
  const N = track.N; let best = -1, bd = 1e18;
  const scan = (from, to) => { for (let k = from; k <= to; k++) { const i = ((k % N) + N) % N, p = track.pts[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = i; } } };
  if (hint == null || hint < 0) scan(0, N - 1); else { scan(hint - 20, hint + 30); if (bd > 900) scan(0, N - 1); }
  return best;
}
function lateral(i, x, z) { const p = track.pts[i], l = track.left[i]; return (x - p.x) * l.x + (z - p.z) * l.z; }

let world = null;
function buildWorld(scene) {
  const group = new THREE.Group(); scene.add(group);
  const N = track.N;
  // Boden
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: grassTexture(), polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8 }));
  ground.position.y = -0.04; ground.renderOrder = -1; group.add(ground);
  // Straße + Bordsteine
  function strip(off0, off1, y, mat, vScale) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const k = i % N, p = track.pts[k], l = track.left[k], v = i * track.len / N / vScale;
      pos.push(p.x + l.x * off0, y, p.z + l.z * off0, p.x + l.x * off1, y, p.z + l.z * off1);
      uv.push(0, v, 1, v);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); group.add(m); return m;
  }
  strip(HW, -HW, 0.03, new THREE.MeshLambertMaterial({ map: asphaltTexture() }), 12);
  const curb = new THREE.MeshLambertMaterial({ map: curbTexture() });
  strip(HW + 1.3, HW, 0.05, curb, 4); strip(-HW, -HW - 1.3, 0.05, curb, 4);
  // Pflaster-Gehweg (außen)
  const pfl = new THREE.MeshLambertMaterial({ map: pflasterTexture() });
  strip(HW + 4.5, HW + 1.3, 0.035, pfl, 3); strip(-HW - 1.3, -HW - 4.5, 0.035, pfl, 3);

  // Start/Ziel
  const sc = canvas(128, 32), sg = sc.getContext('2d');
  for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { sg.fillStyle = (x + y) % 2 ? '#111' : '#fff'; sg.fillRect(x * 8, y * 8, 8, 8); }
  const p0 = track.pts[0], t0 = track.tan[0], l0 = track.left[0];
  const startLine = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, 2.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex(sc, { nearest: true }) }));
  startLine.position.set(p0.x, 0.06, p0.z); startLine.rotation.set(0, Math.atan2(t0.x, t0.z), 0); group.add(startLine);
  const arch = new THREE.Group();
  const pillarMat = lam(0xf2f2f2);
  for (const s of [1, -1]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), pillarMat); pl.position.set(s * (HW + 2), 4, 0); arch.add(pl); }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 + 5, 2.2, 0.5), [lam(MAGENTA), lam(MAGENTA), lam(MAGENTA), lam(MAGENTA),
    new THREE.MeshLambertMaterial({ map: signTexture(['RETAIL F1 FIBER', 'Start · Ziel · Glasfaser'], '#E20074', '#fff', 1024, 128) }),
    new THREE.MeshLambertMaterial({ map: signTexture(['RETAIL F1 FIBER', 'Schnell. Stabil. Zukunftssicher.'], '#E20074', '#fff', 1024, 128) })]);
  banner.position.y = 8.6; arch.add(banner);
  arch.position.set(p0.x, 0, p0.z); arch.rotation.y = Math.atan2(t0.x, t0.z); group.add(arch);

  // Platzierungs-Check: frei von der Strecke?
  const r = rng(2026);
  const placed = [];
  function freeAt(x, z, rad) {
    const i = nearestIdx(x, z);
    const p = track.pts[i];
    if (Math.hypot(p.x - x, p.z - z) < HW + 5 + rad) return false;
    for (const q of placed) if (Math.hypot(q.x - x, q.z - z) < q.r + rad) return false;
    return true;
  }
  function along(i, off) { const p = track.pts[i % N], l = track.left[i % N]; return [p.x + l.x * off, p.z + l.z * off, Math.atan2(track.tan[i % N].x, track.tan[i % N].z)]; }

  // Häuser (Fachwerk) entlang der Strecke
  const walls = ['#f4efe2', '#f3e3c4', '#efd9d0', '#e8eef0'].map((c, k) => new THREE.MeshLambertMaterial({ map: fachwerkTexture(10 + k, c) }));
  const roofs = ['#b04a32', '#8a3a2a', '#5a5a64'].map(c => new THREE.MeshLambertMaterial({ map: roofTexture(c) }));
  const roofGeo = (() => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 0.55); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g; })();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  function house(x, z, rot, w, d, h, wi, ri) {
    const g = new THREE.Group();
    const b = new THREE.Mesh(boxGeo, walls[wi]); b.scale.set(w, h, d); b.position.y = h / 2; g.add(b);
    const rf = new THREE.Mesh(roofGeo, roofs[ri]); rf.scale.set(w + 0.8, h * 0.9, d + 0.6); rf.position.y = h; g.add(rf);
    g.position.set(x, 0, z); g.rotation.y = rot; group.add(g);
    placed.push({ x, z, r: Math.max(w, d) * 0.6 });
  }
  for (let i = 4; i < N; i += 7) {
    for (const side of [1, -1]) {
      if (r() < 0.38) continue;
      const off = side * (HW + 13 + r() * 10);
      const [x, z, rot] = along(i, off);
      const w = 7 + r() * 4, d = 6 + r() * 3, h = 5 + r() * 3;
      if (!freeAt(x, z, Math.max(w, d) * 0.6)) continue;
      house(x, z, rot, w, d, h, Math.floor(r() * walls.length), Math.floor(r() * roofs.length));
    }
  }
  // Telekom Shop am Start
  {
    const [x, z, rot] = along(N - 18, -(HW + 16));
    const g = new THREE.Group();
    const b = new THREE.Mesh(boxGeo, lam(0xf4f4f6)); b.scale.set(16, 6, 9); b.position.y = 3; g.add(b);
    const glassF = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0x9fd0ee, emissive: 0x1a3040 })); glassF.scale.set(13, 3.4, 9.1); glassF.position.y = 2; g.add(glassF);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.8), new THREE.MeshLambertMaterial({ map: signTexture(['Telekom Shop'], '#E20074', '#fff', 768, 100) }));
    sign.position.set(0, 4.9, 4.56); g.add(sign);
    const sign2 = sign.clone(); sign2.position.z = -4.56; sign2.rotation.y = Math.PI; g.add(sign2);
    g.position.set(x, 0, z); g.rotation.y = rot + Math.PI / 2; group.add(g);
    placed.push({ x, z, r: 10 });
  }
  // Kirche mit Turm
  {
    const [x, z, rot] = along(Math.floor(N * 0.62), HW + 26);
    if (freeAt(x, z, 8)) {
      const g = new THREE.Group();
      const nave = new THREE.Mesh(boxGeo, lam(0xf2ede4)); nave.scale.set(8, 7, 14); nave.position.y = 3.5; g.add(nave);
      const rf = new THREE.Mesh(roofGeo, roofs[2]); rf.scale.set(9, 5, 15); rf.position.y = 7; g.add(rf);
      const tower = new THREE.Mesh(boxGeo, lam(0xece6da)); tower.scale.set(4, 16, 4); tower.position.set(0, 8, 8); g.add(tower);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(3, 7, 4), lam(0x3f7a5a)); spire.position.set(0, 19.5, 8); spire.rotation.y = Math.PI / 4; g.add(spire);
      g.position.set(x, 0, z); g.rotation.y = rot; group.add(g); placed.push({ x, z, r: 9 });
    }
  }
  // Glasfaser-Baustellen: Kabeltrommeln, Pylonen, Absperrungen
  const spoolG = new THREE.Group();
  const wood = lam(0xb07a42), cableMat = lam(0xff4fa8);
  const discGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.18, 14), coreGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.5, 14);
  function spool(x, z, rot) {
    const g = new THREE.Group();
    for (const s of [0.8, -0.8]) { const d = new THREE.Mesh(discGeo, wood); d.rotation.z = Math.PI / 2; d.position.set(s, 1.3, 0); g.add(d); }
    const c = new THREE.Mesh(coreGeo, cableMat); c.rotation.z = Math.PI / 2; c.position.y = 1.3; g.add(c);
    g.position.set(x, 0, z); g.rotation.y = rot; spoolG.add(g);
  }
  group.add(spoolG);
  const coneSpots = [];
  for (const f of [0.15, 0.34, 0.55, 0.72, 0.88]) {
    const i = Math.floor(N * f);
    const side = f * 10 % 2 > 1 ? 1 : -1;
    const [x, z, rot] = along(i, side * (HW + 7.5));
    spool(x, z, rot); spool(...along(i + 4, side * (HW + 8.5)).slice(0, 2), rot + 0.6);
    placed.push({ x, z, r: 4 });
    for (let k = -6; k <= 10; k += 2) coneSpots.push(along(i + k, side * (HW + 2.6)));
    // Absperrschranke
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 6), new THREE.MeshLambertMaterial({ map: curbTexture() }));
    const [bx, bz, br] = along(i + 2, side * (HW + 4.6)); bar.position.set(bx, 0.9, bz); bar.rotation.y = br; group.add(bar);
  }
  // zusätzliche Pylonen an Kurven-Innenseiten
  for (let i = 0; i < N; i += 3) {
    const a = track.tan[i], b = track.tan[(i + 6) % N];
    const curv = a.x * b.z - a.z * b.x;
    if (Math.abs(curv) > 0.09 && i % 6 === 0) coneSpots.push(along(i, (curv > 0 ? 1 : -1) * -(HW + 2.4)));
  }
  const coneGeo = new THREE.ConeGeometry(0.38, 1.0, 8);
  const coneMat = lam(0xff6a00);
  const cones = new THREE.InstancedMesh(coneGeo, coneMat, coneSpots.length);
  const stripeGeo = new THREE.CylinderGeometry(0.2, 0.27, 0.18, 8);
  const stripes = new THREE.InstancedMesh(stripeGeo, lam(0xffffff), coneSpots.length);
  const mtx = new THREE.Matrix4();
  coneSpots.forEach(([x, z], k) => { mtx.makeTranslation(x, 0.5, z); cones.setMatrixAt(k, mtx); mtx.makeTranslation(x, 0.62, z); stripes.setMatrixAt(k, mtx); });
  group.add(cones, stripes);
  // Bäume (instanziert)
  const treeSpots = [];
  for (let k = 0; k < 900 && treeSpots.length < 170; k++) {
    const x = (r() - 0.5) * 520 + 30, z = (r() - 0.5) * 420 + 80;
    const rad = 2.5;
    if (!freeAt(x, z, rad)) continue;
    placed.push({ x, z, r: rad }); treeSpots.push([x, z, 0.8 + r() * 0.7, r()]);
  }
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 2.4, 6), lam(0x6b4a2e), treeSpots.length);
  const crownA = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.2, 0), lam(0x3f8f3a, { flatShading: true }), treeSpots.length);
  const crownB = new THREE.InstancedMesh(new THREE.ConeGeometry(2.0, 5.5, 7), lam(0x2a6a34, { flatShading: true }), treeSpots.length);
  const sc3 = new THREE.Vector3(), q = new THREE.Quaternion(), pv = new THREE.Vector3();
  let na = 0, nb = 0;
  treeSpots.forEach(([x, z, s, kind], k) => {
    mtx.compose(pv.set(x, 1.2 * s, z), q, sc3.set(s, s, s)); trunk.setMatrixAt(k, mtx);
    if (kind > 0.45) { mtx.compose(pv.set(x, 3.6 * s, z), q, sc3.set(s, s * 1.1, s)); crownA.setMatrixAt(na++, mtx); }
    else { mtx.compose(pv.set(x, 4.6 * s, z), q, sc3.set(s, s, s)); crownB.setMatrixAt(nb++, mtx); }
  });
  crownA.count = na; crownB.count = nb;
  group.add(trunk, crownA, crownB);
  // Werbe-Banner "Glasfaser kommt!"
  for (const f of [0.08, 0.42, 0.8]) {
    const [x, z, rot] = along(Math.floor(N * f), HW + 5.2);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 7), [new THREE.MeshLambertMaterial({ map: signTexture(['Glasfaser kommt!', 'Jetzt anmelden'], '#E20074', '#fff', 512, 120) }), new THREE.MeshLambertMaterial({ map: signTexture(['Glasfaser kommt!', 'Jetzt anmelden'], '#E20074', '#fff', 512, 120) }), lam(MAGENTA), lam(MAGENTA), lam(MAGENTA), lam(MAGENTA)]);
    b.position.set(x, 1.2, z); b.rotation.y = rot; group.add(b);
  }
  // Item-Boxen
  const items = [];
  const ibGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5), ibMat = new THREE.MeshLambertMaterial({ map: itemBoxTexture(), emissive: 0x3a0020 });
  for (const f of [0.22, 0.5, 0.79]) {
    const i = Math.floor(N * f);
    for (const off of [-5, 0, 5]) {
      const [x, z] = along(i, off);
      const m = new THREE.Mesh(ibGeo, ibMat); m.position.set(x, 1.4, z); group.add(m);
      items.push({ x, z, mesh: m, respawn: 0 });
    }
  }
  world = { group, items, blockers: placed };
  return world;
}

/* Minimap */
const mini = { ctx: null, scale: 1, ox: 0, oz: 0, bg: null };
function buildMinimap() {
  const c = $('minimap'); mini.ctx = c.getContext('2d');
  let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
  for (const p of track.pts) { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); minz = Math.min(minz, p.z); maxz = Math.max(maxz, p.z); }
  mini.scale = 104 / Math.max(maxx - minx, maxz - minz); mini.ox = minx; mini.oz = minz;
  mini.offX = 8 + (104 - (maxx - minx) * mini.scale) / 2; mini.offZ = 8 + (104 - (maxz - minz) * mini.scale) / 2;
  const bg = canvas(120, 120), g = bg.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5; g.beginPath();
  track.pts.forEach((p, i) => { const [x, y] = miniXY(p.x, p.z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke();
  const [sx, sy] = miniXY(track.pts[0].x, track.pts[0].z); g.fillStyle = '#E20074'; g.fillRect(sx - 4, sy - 4, 8, 8);
  mini.bg = bg;
}
function miniXY(x, z) { return [mini.offX + (x - mini.ox) * mini.scale, mini.offZ + (z - mini.oz) * mini.scale]; }

/* =====================================================================
   AUDIO (WebAudio, startet bei erster Eingabe)
   ===================================================================== */
const audio = { ctx: null, master: null, eng: null, engGain: null, muted: ls.get('rf1_muted', '0') === '1' };
function ensureAudio() {
  try {
    if (!audio.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const a = audio.ctx = new AC();
      audio.master = a.createGain(); audio.master.gain.value = audio.muted ? 0 : 0.5; audio.master.connect(a.destination);
      const o1 = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
      o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 50; o2.frequency.value = 25;
      f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(audio.master); o1.start(); o2.start();
      audio.eng = [o1, o2]; audio.engGain = g; audio.engFilter = f;
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
  } catch (e) {}
}
function beep(f, dur, type = 'square', vol = 0.12, slide = null, delay = 0) {
  const a = audio.ctx; if (!a) return;
  try {
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(audio.master); o.start(t); o.stop(t + dur + 0.05);
  } catch (e) {}
}
function noiseBurst(dur, vol, f0, f1) {
  const a = audio.ctx; if (!a) return;
  try {
    const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
    s.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(audio.master); s.start();
  } catch (e) {}
}
const sfx = {
  count() { beep(440, 0.25, 'square', 0.12); }, go() { beep(880, 0.5, 'square', 0.14); },
  pickup() { [660, 880, 1320].forEach((f, i) => beep(f, 0.08, 'square', 0.08, null, i * 0.06)); },
  fire() { noiseBurst(0.35, 0.25, 3000, 600); beep(900, 0.2, 'triangle', 0.08, 300); },
  hit() { noiseBurst(0.5, 0.35, 900, 120); beep(220, 0.4, 'sawtooth', 0.1, 60); },
  bump() { beep(120, 0.12, 'square', 0.08, 70); },
  lap() { [523, 784].forEach((f, i) => beep(f, 0.12, 'square', 0.1, null, i * 0.1)); },
  finish() { [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.18, 'square', 0.1, null, i * 0.13)); }
};
function setMute(m) { audio.muted = m; ls.set('rf1_muted', m ? '1' : '0'); if (audio.master) audio.master.gain.value = m ? 0 : 0.5; $('btnMute').textContent = m ? '🔇' : '🔊'; }

/* =====================================================================
   FAHRZEUGE
   ===================================================================== */
class Vehicle {
  constructor(opts) {
    this.id = opts.id; this.name = opts.name; this.vi = opts.vi; this.isLocal = !!opts.isLocal; this.isAI = !!opts.isAI; this.remote = !!opts.remote;
    this.stats = statsOf(TRUCKS[this.vi % TRUCKS.length]);
    this.x = 0; this.z = 0; this.h = 0; this.speed = 0; this.steer = 0; this.steerVis = 0;
    this.idx = -1; this.lap = 0; this.armed = true; this.prog = 0; this.lapStart = 0; this.lapTimes = []; this.best = Infinity;
    this.finished = false; this.finishTime = 0; this.spinT = 0; this.invulnT = 0; this.ammo = 1; this.fireCD = 2 + Math.random() * 3;
    this.wrongT = 0; this.offroad = false;
    this.mesh = makeTruck(this.vi); scene.add(this.mesh);
    if (!this.isLocal) { this.tag = nameTagSprite(this.name, this.remote ? '#00c2e8' : '#E20074'); this.tag.position.y = 4.6; this.mesh.add(this.tag); }
    this.buf = []; // Snapshots für Remote-Interpolation
    // KI-Persönlichkeit
    this.skill = opts.skill || 0.9; this.lane = (Math.random() - 0.5) * 6; this.lanePh = Math.random() * 6;
  }
  dispose() { scene.remove(this.mesh); }
  place(i, off) {
    const p = track.pts[i], l = track.left[i], t = track.tan[i];
    this.x = p.x + l.x * off; this.z = p.z + l.z * off; this.h = Math.atan2(t.x, t.z); this.idx = i; this.speed = 0;
    this.updateProgress(true);
  }
  updateProgress(init) {
    const prev = this.idx;
    this.idx = nearestIdx(this.x, this.z, this.idx);
    const N = track.N;
    if (!init && prev >= 0) {
      if (prev > N * 0.85 && this.idx < N * 0.15 && this.armed) { this.armed = false; this.onLap(); }
      else if (prev < N * 0.15 && this.idx > N * 0.85 && !this.armed) { this.lap--; this.armed = true; }
      if (this.idx > N * 0.4 && this.idx < N * 0.6) this.armed = true;
    }
    this.prog = this.lap * N + this.idx;
  }
  onLap() {
    const now = race.time;
    if (this.lap > 0) { const lt = now - this.lapStart; this.lapTimes.push(lt); if (lt < this.best) this.best = lt; }
    this.lap++; this.lapStart = now;
    if (this.lap > LAPS && !this.finished) { this.finished = true; this.finishTime = now; onVehicleFinished(this); }
    else if (this.isLocal && this.lap > 1) { sfx.lap(); toast(this.lap === LAPS ? 'LETZTE RUNDE!' : 'RUNDE ' + this.lap + '/' + LAPS); }
  }
  hit(byName) {
    if (this.invulnT > 0) return false;
    this.spinT = 1.1; this.invulnT = 2.6; this.speed *= 0.25;
    return true;
  }
  physics(dt, inp) {
    const st = this.stats;
    if (this.spinT > 0) { this.spinT -= dt; inp = { gas: 0, brake: 0, steer: 0 }; this.speed *= Math.pow(0.4, dt); }
    if (this.invulnT > 0) this.invulnT -= dt;
    const i = this.idx < 0 ? 0 : this.idx;
    const lat = lateral(i, this.x, this.z);
    this.offroad = Math.abs(lat) > HW + 1.3;
    const top = st.top * (this.offroad ? 0.55 : 1) * (this.isAI ? this.skill * race.aiBoost(this) : 1);
    // Lenkung glätten
    this.steer += (inp.steer - this.steer) * Math.min(1, dt * 8);
    if (inp.gas) this.speed += st.accel * dt * (1 - 0.55 * Math.max(0, this.speed) / top);
    if (inp.brake) { if (this.speed > 0.5) this.speed -= 26 * dt; else this.speed = Math.max(-9, this.speed - 7 * dt); }
    if (!inp.gas && !inp.brake) this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), (2.2 + Math.abs(this.speed) * 0.08) * dt);
    if (this.speed > top) this.speed = Math.max(top, this.speed - 22 * dt);
    if (this.offroad) this.speed -= this.speed * 0.6 * dt;
    const sp = Math.abs(this.speed);
    const yaw = this.steer * st.steer * clamp(sp / 9, 0, 1) * (1 - 0.32 * clamp(sp / st.top, 0, 1)) * Math.sign(this.speed || 1);
    this.h -= yaw * dt;
    this.x += Math.sin(this.h) * this.speed * dt; this.z += Math.cos(this.h) * this.speed * dt;
    // weiche Wand
    const i2 = nearestIdx(this.x, this.z, this.idx), lat2 = lateral(i2, this.x, this.z);
    if (Math.abs(lat2) > WALL) {
      const l = track.left[i2], push = (Math.abs(lat2) - WALL) * Math.sign(lat2);
      this.x -= l.x * push; this.z -= l.z * push; this.speed *= 0.82;
      const t = track.tan[i2], th = Math.atan2(t.x, t.z), d = wrapAng(th - this.h);
      if (Math.abs(d) < Math.PI / 2) this.h += d * 0.08;
      if (this.isLocal && sp > 8 && Math.random() < 0.2) sfx.bump();
    }
    this.updateProgress(false);
    // falsche Richtung?
    const t = track.tan[this.idx], fwd = Math.sin(this.h) * t.x + Math.cos(this.h) * t.z;
    this.wrongT = (fwd < -0.3 && this.speed > 3) ? this.wrongT + dt : 0;
  }
  aiInput(dt) {
    const N = track.N, look = Math.floor(8 + Math.abs(this.speed) * 0.35);
    const ti = (this.idx + look) % N, p = track.pts[ti], l = track.left[ti];
    this.lanePh += dt * 0.4;
    const lane = clamp(this.lane + Math.sin(this.lanePh) * 2, -HW + 2, HW - 2);
    const tx = p.x + l.x * lane, tz = p.z + l.z * lane;
    const want = Math.atan2(tx - this.x, tz - this.z), d = wrapAng(want - this.h);
    // Kurvenstärke voraus
    const a = track.tan[this.idx], b = track.tan[(this.idx + 18) % N];
    const curv = Math.abs(a.x * b.z - a.z * b.x);
    const slow = curv > 0.5 && this.speed > this.stats.top * 0.7;
    return { gas: !slow || Math.random() < 0.3 ? 1 : 0, brake: slow && Math.random() < 0.25 ? 1 : 0, steer: clamp(-d * 2.4, -1, 1) };
  }
  render(dt) {
    let spin = 0;
    if (this.spinT > 0) spin = (1 - this.spinT / 1.1) * Math.PI * 4;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.h + spin;
    this.steerVis += (-this.steer - this.steerVis) * Math.min(1, dt * 10);
    animateTruck(this.mesh, this.speed, this.steerVis, dt);
    const body = this.mesh.userData.body;
    body.rotation.z = lerp(body.rotation.z, -this.steer * Math.min(1, Math.abs(this.speed) / 25) * 0.05, 0.2);
    body.position.y = this.offroad ? Math.sin(performance.now() * 0.03) * 0.04 : 0;
    this.mesh.visible = !(this.invulnT > 0 && this.spinT <= 0 && Math.floor(performance.now() / 90) % 2 === 0);
  }
}

/* =====================================================================
   HA-ONLY VERTRAG (Geschoss)
   ===================================================================== */
const projectiles = [];
let paperGeo = null, paperMat = null;
function spawnProjectile(p) {
  if (!paperGeo) { paperGeo = new THREE.PlaneGeometry(1.1, 1.45); paperMat = new THREE.MeshBasicMaterial({ map: paperTexture(), side: THREE.DoubleSide }); }
  const m = new THREE.Group();
  const sheet = new THREE.Mesh(paperGeo, paperMat); m.add(sheet);
  const glow = new THREE.Mesh(paperGeo, new THREE.MeshBasicMaterial({ color: 0xff4fa8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); glow.scale.set(1.35, 1.35, 1); glow.position.z = -0.02; m.add(glow);
  m.position.set(p.x, 2.4, p.z); m.scale.setScalar(1.7); scene.add(m);
  const pr = { ...p, mesh: m, sheet, life: 2.8, trail: 0 };
  projectiles.push(pr); return pr;
}
function removeProjectile(id) {
  const k = projectiles.findIndex(q => q.id === id); if (k < 0) return;
  const q = projectiles[k]; scene.remove(q.mesh); projectiles.splice(k, 1);
  burst(q.x, q.z);
}
function fireFrom(v) {
  if (v.ammo <= 0 || v.finished && !v.isAI) return null;
  v.ammo--;
  const p = { id: v.id + '-' + uid(), owner: v.id, ownerName: v.name, x: v.x + Math.sin(v.h) * 3.6, z: v.z + Math.cos(v.h) * 3.6, h: v.h, v: Math.max(0, v.speed) + 40 };
  spawnProjectile(p);
  if (v.isLocal || distToLocal(v) < 60) sfx.fire();
  if (race.mp && v.isLocal) Net.send('fire', { id: p.id, o: p.owner, n: p.ownerName, x: +p.x.toFixed(2), z: +p.z.toFixed(2), h: +p.h.toFixed(3), v: +p.v.toFixed(1) });
  if (v.isLocal) updateItemHud();
  return p;
}
function distToLocal(v) { const me = race.me; return me ? Math.hypot(me.x - v.x, me.z - v.z) : 1e9; }
function updateProjectiles(dt) {
  for (let k = projectiles.length - 1; k >= 0; k--) {
    const q = projectiles[k];
    q.life -= dt;
    // leichte Zielsuche nach Trucks vor dem Vertrag
    let best = null, bd = 55;
    for (const v of race.vehicles) {
      if (v.id === q.owner || v.invulnT > 0 || v.finished) continue;
      const dx = v.x - q.x, dz = v.z - q.z, d = Math.hypot(dx, dz);
      if (d > bd) continue;
      const ang = Math.abs(wrapAng(Math.atan2(dx, dz) - q.h));
      if (ang < 0.6) { bd = d; best = v; }
    }
    if (best) { const want = Math.atan2(best.x - q.x, best.z - q.z), d = wrapAng(want - q.h); q.h += clamp(d, -2.2 * dt, 2.2 * dt); }
    q.x += Math.sin(q.h) * q.v * dt; q.z += Math.cos(q.h) * q.v * dt;
    q.mesh.position.set(q.x, 2.4 + Math.sin(q.life * 14) * 0.3, q.z);
    q.mesh.rotation.set(Math.sin(q.life * 9) * 0.5, q.h + q.life * 8, Math.cos(q.life * 7) * 0.4);
    q.trail += dt; if (q.trail > 0.04) { q.trail = 0; sparkle(q.x, q.z); }
    // Treffer?
    let hitV = null;
    for (const v of race.vehicles) {
      if (v.id === q.owner || v.finished) continue;
      if (Math.hypot(v.x - q.x, v.z - q.z) < 2.7) { hitV = v; break; }
    }
    if (hitV) {
      if (race.mp) {
        // Autorität: der getroffene Client entscheidet
        if (hitV.isLocal) { if (hitV.hit(q.ownerName)) { onLocalHit(q.ownerName); Net.send('hit', { pid: q.id, t: hitV.id, tn: hitV.name, o: q.owner }); } removeProjectile(q.id); }
        else if (hitV.remote) { if (hitV.invulnT <= 0) removeProjectile(q.id); } // optisch entfernen, Bestätigung kommt per 'hit'
        continue;
      }
      if (hitV.hit(q.ownerName)) {
        if (hitV.isLocal) onLocalHit(q.ownerName);
        else if (q.owner === race.me.id) { toast('TREFFER! ' + hitV.name + ' hat unterschrieben!'); sfx.hit(); }
      }
      removeProjectile(q.id); continue;
    }
    if (q.life <= 0) removeProjectile(q.id);
  }
}
function onLocalHit(by) { sfx.hit(); toast('Von HA-Only Vertrag getroffen! (' + by + ')', 2200); shakeT = 0.5; }

/* kleine Partikel */
const parts = [];
let partGeo = null;
function sparkle(x, z) { spawnPart(x, 1.5, z, [0xff4fa8, 0xffffff, 0xffd0ea][Math.floor(Math.random() * 3)], 0.35, 0.2); }
function burst(x, z) { for (let i = 0; i < 14; i++) spawnPart(x, 1.5, z, i % 2 ? 0xffffff : 0xE20074, 0.7, 0.5); }
const partMats = {};
function spawnPart(x, y, z, col, life, spread) {
  if (parts.length > 160) return;
  if (!partGeo) partGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const mat = partMats[col] || (partMats[col] = new THREE.MeshBasicMaterial({ color: col }));
  const m = new THREE.Mesh(partGeo, mat); m.position.set(x, y, z); scene.add(m);
  parts.push({ m, vx: (Math.random() - 0.5) * spread * 12, vy: Math.random() * spread * 10, vz: (Math.random() - 0.5) * spread * 12, life });
}
function updateParts(dt) {
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k]; p.life -= dt;
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.vy -= 9 * dt;
    if (p.life <= 0 || p.m.position.y < 0) { scene.remove(p.m); parts.splice(k, 1); }
  }
}

/* =====================================================================
   SZENE / RENDERER
   ===================================================================== */
const glCanvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const SKY = 0xa8d4f2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 90, isMobile ? 260 : 340);
scene.add(new THREE.HemisphereLight(0xffffff, 0x5a7a4a, 1.15));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.6); sun.position.set(80, 160, 40); scene.add(sun);
const camera = new THREE.PerspectiveCamera(66, 1, 0.5, 600);

// Garage-Szene für die Truckauswahl
const garage = new THREE.Scene();
{
  const bg = canvas(4, 256), g = bg.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#2a0618'); gr.addColorStop(0.6, '#7a0040'); gr.addColorStop(1, '#E20074');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256); garage.background = tex(bg);
  garage.add(new THREE.HemisphereLight(0xffffff, 0x552244, 1.3));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(6, 10, 8); garage.add(d);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 40).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: pflasterTexture() }));
  floor.material.map.repeat.set(6, 6); garage.add(floor);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: signTexture([''], '#ff4fa8', '#fff', 256, 160, true) }));
  mat.position.set(-2.4, 0.02, -0.4); mat.rotation.y = Math.PI / 2;
  garage.userData.mat = mat;
}
const garageCam = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
let garageTruck = null, garageTurn = null;
function showGarageTruck(vi) {
  if (garageTurn) garage.remove(garageTurn);
  garageTurn = new THREE.Group();
  garageTruck = makeTruck(vi, { display: true }); garageTurn.add(garageTruck); garageTurn.add(garage.userData.mat);
  const v = TRUCKS[vi];
  if (v.aboard || v.awning) {
    for (const [x, z] of [[-3.6, 2.4], [-3.4, -2.6]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8), lam(0xff6a00)); c.position.set(x, 0.4, z); garageTurn.add(c); }
  }
  garage.add(garageTurn);
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 80 : 64; camera.updateProjectionMatrix();
  garageCam.aspect = w / h; garageCam.updateProjectionMatrix();
  checkRotate();
}
window.addEventListener('resize', resize);

/* =====================================================================
   RENNEN
   ===================================================================== */
const AI_NAMES = ['KUPFER-KARL', 'FUNKLOCH-FRANZI', 'DSL-DIETER', 'KOAX-KLAUS', 'MODEM-MONI', 'ISDN-INGE', 'BANDBREITE-BERND'];
const race = {
  active: false, mp: false, vehicles: [], me: null, state: 'idle', time: 0, goAt: 0, cdShown: -1, finishedAt: 0, rid: null,
  aiBoost(v) { const me = this.me; if (!me) return 1; const d = me.prog - v.prog; return d > 40 ? 1.08 : d < -70 ? 0.92 : 1; }
};
let shakeT = 0, camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), lastNet = 0, resultShown = false;
function clearRace() {
  for (const v of race.vehicles) v.dispose();
  for (const q of projectiles.slice()) removeProjectile(q.id);
  race.vehicles = []; race.me = null; race.active = false; race.state = 'idle'; resultShown = false;
  for (const it of world.items) { it.respawn = 0; it.mesh.visible = true; }
}
function gridSlot(k) { const N = track.N; return [((N - 5 - Math.floor(k / 2) * 6) % N + N) % N, k % 2 ? -3.6 : 3.6]; }
function initVehicle(v, k) { const [i, off] = gridSlot(k); v.place(i, off); race.vehicles.push(v); }
function snapCamera() {
  const me = race.me; if (!me) return;
  camHead = me.h;
  const dir = new THREE.Vector3(Math.sin(me.h), 0, Math.cos(me.h));
  camPos.set(me.x, 0, me.z).addScaledVector(dir, -9.2).setY(4.3);
  camLook.set(me.x, 1.9, me.z).addScaledVector(dir, 6);
  camOff.set(camPos.x - me.x, camPos.y, camPos.z - me.z); camLookOff.set(camLook.x - me.x, camLook.y, camLook.z - me.z);
  camera.position.copy(camPos); camera.lookAt(camLook);
}
function startSolo() {
  clearRace();
  race.mp = false; race.rid = 'solo-' + uid();
  const me = new Vehicle({ id: 'me', name: playerName, vi: selVi, isLocal: true });
  initVehicle(me, 3); race.me = me;
  const names = AI_NAMES.slice().sort(() => Math.random() - 0.5);
  for (let k = 0; k < 3; k++) {
    const v = new Vehicle({ id: 'ai' + k, name: names[k], vi: (selVi + 1 + k) % TRUCKS.length, isAI: true, skill: 0.88 + k * 0.035 });
    initVehicle(v, k);
  }
  beginCountdown(3200);
}
function beginCountdown(ms) {
  race.active = true; race.state = 'countdown'; race.goAt = performance.now() + ms; race.time = 0; race.cdShown = -1;
  for (const v of race.vehicles) { v.lapStart = 0; }
  snapCamera(); updateItemHud();
  showScreen(null); $('hud').classList.remove('hidden'); if (isTouch || PARAMS.has('touchui')) $('touch').classList.remove('hidden');
  $('countdown').classList.remove('hidden');
  checkRotate();
}
function racingOrder() {
  return race.vehicles.slice().filter(v => !v.left).sort((a, b) => {
    if (a.finished && b.finished) return a.finishTime - b.finishTime;
    if (a.finished) return -1; if (b.finished) return 1;
    return b.prog - a.prog;
  });
}
function onVehicleFinished(v) {
  if (v.isLocal) {
    sfx.finish(); race.finishedAt = performance.now();
    const pos = racingOrder().indexOf(v) + 1;
    toast(pos === 1 ? 'SIEG! 🏆 GIGABIT-SPEED!' : 'ZIEL! PLATZ ' + pos, 2500);
    if (race.mp) Net.send('fin', { i: v.id, n: v.name, t: Math.round(v.finishTime), b: isFinite(v.best) ? Math.round(v.best) : null });
    setTimeout(showResults, 1600);
  }
}
function showResults() {
  resultShown = true;
  renderResults();
  showScreen('scr-result');
  $('touch').classList.add('hidden'); resetTouch();
  $('btnAgain').textContent = race.mp ? '👥 ZUR LOBBY' : '🔁 NOCHMAL';
}
function renderResults() {
  const order = racingOrder();
  const me = race.me;
  const pos = order.indexOf(me) + 1;
  $('resTitle').textContent = me && me.finished ? (pos === 1 ? '🏆 SIEG!' : 'PLATZ ' + pos) : 'ERGEBNIS';
  $('resSub').textContent = (me && isFinite(me.best) ? 'Beste Runde: ' + fmtTime(me.best) + ' · ' : '') + (race.mp ? 'Multiplayer-Rennen' : 'Solo gegen KI');
  const rows = order.map((v, k) => `<tr class="${v.isLocal ? 'me' : ''}"><td>${k + 1}.</td><td>${escapeHtml(v.name)}${v.isAI ? ' <small>🤖</small>' : ''}</td><td class="t">${v.finished ? fmtTime(v.finishTime) : 'unterwegs… R' + Math.max(1, Math.min(LAPS, v.lap))}</td></tr>`);
  for (const v of race.vehicles.filter(v => v.left)) rows.push(`<tr><td>–</td><td>${escapeHtml(v.name)}</td><td class="t">ausgestiegen</td></tr>`);
  $('resTable').innerHTML = rows.join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function localInput() {
  if (AUTODRIVE || (race.me && race.me.finished)) return race.me.aiInput(1 / 60);
  const k = keys;
  let steer = 0;
  if (k.left) steer -= 1;
  if (k.right) steer += 1;
  steer = clamp(steer + touchState.steer, -1, 1);
  return { gas: (k.up || touchState.gas) ? 1 : 0, brake: (k.down || touchState.brake) ? 1 : 0, steer };
}
function stepRace(dt) {
  const now = performance.now();
  if (race.state === 'countdown') {
    const left = race.goAt - now;
    const n = Math.ceil(left / 1000);
    if (n !== race.cdShown) {
      race.cdShown = n;
      if (n > 0 && n <= 3) { $('countdown').textContent = n; sfx.count(); }
      else if (n <= 0) { $('countdown').textContent = 'LOS!'; sfx.go(); setTimeout(() => $('countdown').classList.add('hidden'), 800); }
    }
    if (left <= 0) race.state = 'run';
    for (const v of race.vehicles) v.render(dt);
    return;
  }
  race.time = now - race.goAt;
  const me = race.me;
  for (const v of race.vehicles) {
    if (v.remote || v.left) continue;
    if (v.held) { v.speed = 0; if (v.spinT > 0) v.spinT -= dt; if (v.invulnT > 0) v.invulnT -= dt; continue; }
    const inp = v.isLocal ? localInput() : v.aiInput(dt);
    v.physics(dt, inp);
    if (v.isAI && !race.mp) aiFire(v, dt);
    if (AUTODRIVE && v.isLocal) aiFire(v, dt);
  }
  // Kollisionen zwischen Trucks
  const vs = race.vehicles;
  for (let a = 0; a < vs.length; a++) for (let b = a + 1; b < vs.length; b++) {
    const A = vs[a], B = vs[b]; if (A.left || B.left) continue;
    const dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz), R = 2.7;
    if (d < R && d > 0.001) {
      const push = (R - d) / d;
      const aMov = !A.remote, bMov = !B.remote;
      const fa = aMov && bMov ? 0.5 : aMov ? 1 : 0, fb = aMov && bMov ? 0.5 : bMov ? 1 : 0;
      A.x -= dx * push * fa; A.z -= dz * push * fa; B.x += dx * push * fb; B.z += dz * push * fb;
      if (aMov) A.speed *= 0.97; if (bMov) B.speed *= 0.97;
      if ((A.isLocal || B.isLocal) && Math.random() < 0.15) sfx.bump();
    }
  }
  // Item-Boxen
  for (const it of world.items) {
    if (it.respawn > 0) { it.respawn -= dt; if (it.respawn <= 0) it.mesh.visible = true; else continue; }
    it.mesh.rotation.y += dt * 1.6; it.mesh.rotation.x += dt * 0.7; it.mesh.position.y = 1.4 + Math.sin(now * 0.004 + it.x) * 0.2;
    for (const v of vs) {
      if (v.remote || v.left) continue;
      if (Math.hypot(v.x - it.x, v.z - it.z) < 2.5) {
        it.respawn = 5; it.mesh.visible = false; burst(it.x, it.z);
        if (v.ammo < 3) v.ammo++;
        if (v.isLocal) { sfx.pickup(); toast('📄 HA-Only Vertrag eingesammelt!'); updateItemHud(); }
        break;
      }
    }
  }
  updateProjectiles(dt);
  for (const v of vs) {
    if (v.remote) { v.interp(now); v.idx = nearestIdx(v.x, v.z, v.idx); if (v.spinT > 0) v.spinT -= dt; if (v.invulnT > 0) v.invulnT -= dt; }
    v.render(dt);
  }
  // Netz senden
  if (race.mp && me && now - lastNet > 1000 / NET_HZ) {
    lastNet = now;
    Net.send('st', { i: me.id, x: +me.x.toFixed(2), z: +me.z.toFixed(2), h: +me.h.toFixed(3), s: +me.speed.toFixed(1), p: me.prog, l: me.lap, sp: +Math.max(0, me.spinT).toFixed(2), f: me.finished ? 1 : 0 });
  }
  if (resultShown && Math.floor(now / 500) !== Math.floor((now - dt * 1000) / 500)) renderResults();
}
function aiFire(v, dt) {
  v.fireCD -= dt;
  if (v.ammo <= 0 || v.fireCD > 0 || v.spinT > 0) return;
  for (const o of race.vehicles) {
    if (o === v || o.invulnT > 0 || o.finished || o.left) continue;
    const dx = o.x - v.x, dz = o.z - v.z, d = Math.hypot(dx, dz);
    if (d < 8 || d > 42) continue;
    if (Math.abs(wrapAng(Math.atan2(dx, dz) - v.h)) < 0.22) { fireFrom(v); v.fireCD = 4 + Math.random() * 5; return; }
  }
}
Vehicle.prototype.interp = function (now) {
  const b = this.buf; if (!b.length) return;
  const rt = now - 140;
  while (b.length > 2 && b[1].t <= rt) b.shift();
  let s;
  if (b.length >= 2 && b[0].t <= rt && rt <= b[1].t) {
    const A = b[0], B = b[1], t = (rt - A.t) / Math.max(1, B.t - A.t);
    this.x = lerp(A.x, B.x, t); this.z = lerp(A.z, B.z, t); this.h = A.h + wrapAng(B.h - A.h) * t; this.speed = lerp(A.s, B.s, t);
  } else {
    s = b[b.length - 1];
    const ex = clamp((rt - s.t) / 1000, 0, 0.3);
    this.x = s.x + Math.sin(s.h) * s.s * ex; this.z = s.z + Math.cos(s.h) * s.s * ex; this.h = s.h; this.speed = s.s;
  }
};
// Verfolgerkamera: immer hinter dem EIGENEN Truck (race.me), leicht erhöht,
// mit Nachlauf, Blick nach vorn und mehr Abstand/FOV bei Tempo.
const camTmp = { tp: new THREE.Vector3(), tl: new THREE.Vector3() };
let camHead = 0; const camOff = new THREE.Vector3(), camLookOff = new THREE.Vector3();
function camBlocked(x, z) {
  for (const q of world.blockers) { const dx = x - q.x, dz = z - q.z; if (dx * dx + dz * dz < q.r * q.r) return true; }
  return false;
}
function updateCamera(dt) {
  const me = race.me; if (!me) return;
  const sp = Math.max(0, me.speed), sN = clamp(sp / 45, 0, 1);
  // Kamerarichtung folgt der Fahrtrichtung mit leichtem Nachlauf (bei Dreher nicht mitdrehen)
  if (me.spinT <= 0) camHead += wrapAng(me.h - camHead) * (1 - Math.exp(-dt * 5));
  const portrait = camera.aspect < 1;
  let back = (portrait ? 12 : 9.2) + sN * 2.6, up = (portrait ? 5.6 : 4.3) + sN * 0.7;
  const sx = Math.sin(camHead), sz = Math.cos(camHead);
  // nicht in Häuser/Bäume fahren: Abstand verkürzen, falls der Kamerapunkt in einem Hindernis läge
  for (let k = 0; k < 6 && camBlocked(me.x - sx * back, me.z - sz * back); k++) { back *= 0.78; up += 0.5; }
  const tp = camTmp.tp.set(me.x - sx * back, up, me.z - sz * back);
  // Look-ahead: Punkt vor dem Truck, damit die Straße oberhalb der Touch-Buttons sichtbar ist
  const ahead = 6 + sN * 6;
  const tl = camTmp.tl.set(me.x + sx * ahead, portrait ? 1.4 : 1.9, me.z + sz * ahead);
  // Nachlauf relativ zum Truck (sonst wächst der Abstand mit dem Tempo)
  tp.x -= me.x; tp.z -= me.z; tl.x -= me.x; tl.z -= me.z;
  camOff.lerp(tp, 1 - Math.exp(-dt * 6)); camLookOff.lerp(tl, 1 - Math.exp(-dt * 10));
  camPos.set(me.x + camOff.x, camOff.y, me.z + camOff.z); camLook.set(me.x + camLookOff.x, camLookOff.y, me.z + camLookOff.z);
  camera.position.copy(camPos);
  if (shakeT > 0) { shakeT -= dt; camera.position.x += (Math.random() - 0.5) * shakeT; camera.position.y += (Math.random() - 0.5) * shakeT; }
  camera.lookAt(camLook);
  const fov = (portrait ? 80 : 64) + sN * 8;
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
}
let hudCache = {};
function setText(id, t) { if (hudCache[id] !== t) { hudCache[id] = t; $(id).textContent = t; } }
function updateHud() {
  const me = race.me; if (!me) return;
  const order = racingOrder();
  setText('hudLap', 'RUNDE ' + clamp(me.lap, 1, LAPS) + '/' + LAPS);
  setText('hudPos', 'POS ' + (order.indexOf(me) + 1) + '/' + order.length);
  const t = race.state === 'run' ? (me.finished ? me.finishTime : race.time) : 0;
  setText('hudTime', fmtTime(t));
  setText('hudLapTime', 'RUNDE ' + fmtTime(me.lap >= 1 && !me.finished ? race.time - me.lapStart : 0));
  setText('hudBest', isFinite(me.best) ? 'BESTE ' + fmtTime(me.best) : '');
  setText('hudSpeed', Math.round(Math.abs(me.speed) * 3.6) + ' ');
  $('wrongWay').classList.toggle('hidden', me.wrongT < 1);
  // Minimap
  const g = mini.ctx; g.clearRect(0, 0, 120, 120); g.drawImage(mini.bg, 0, 0);
  for (const v of race.vehicles) {
    if (v.left) continue;
    const [x, y] = miniXY(v.x, v.z);
    g.fillStyle = v.isLocal ? '#ffde00' : v.remote ? '#00c2e8' : '#E20074';
    g.beginPath(); g.arc(x, y, v.isLocal ? 4.5 : 3.5, 0, Math.PI * 2); g.fill();
    if (v.isLocal) { g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke(); }
  }
}
function updateItemHud() {
  const me = race.me; const n = me ? me.ammo : 0;
  $('itemCount').textContent = 'x' + n;
  $('itemSlot').classList.toggle('empty', n <= 0);
  $('tFire').style.opacity = n > 0 ? 1 : 0.4;
}
let toastTimer = 0;
function toast(msg, ms = 1500) { const t = $('toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), ms); window.__lastToast = msg; (window.__toasts = window.__toasts || []).push(msg); (window.__toastLog = window.__toastLog || []).push([Date.now(), msg]); }

/* =====================================================================
   MULTIPLAYER (Supabase Realtime: Presence + Broadcast, keine Tabellen)
   ===================================================================== */
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const Net = {
  sb: null, ch: null, code: null, me: null, players: [], connected: false,
  async lib() {
    if (this.sb) return this.sb;
    const mod = await import(SUPABASE_ESM);
    this.sb = mod.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 40 } } });
    return this.sb;
  },
  async join(code) {
    await this.leave();
    const sb = await this.lib();
    this.code = code;
    this.me = { id: 'p' + uid(), name: playerName, truck: selVi, joinedAt: Date.now(), status: 'lobby' };
    const ch = this.ch = sb.channel('rf1f-' + code, { config: { broadcast: { self: false }, presence: { key: this.me.id } } });
    ch.on('presence', { event: 'sync' }, () => this.onPresence());
    for (const ev of ['start', 'st', 'fire', 'hit', 'fin']) ch.on('broadcast', { event: ev }, m => this.onMsg(ev, m.payload));
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('Zeitüberschreitung')), 12000);
      ch.subscribe(async s => {
        if (s === 'SUBSCRIBED') { clearTimeout(to); this.connected = true; await ch.track(this.me); res(); }
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') { clearTimeout(to); rej(new Error(s)); }
      });
    });
  },
  async leave() {
    const ch = this.ch; this.ch = null; this.connected = false; this.players = [];
    if (ch) { try { await ch.untrack(); } catch (e) {} try { await this.sb.removeChannel(ch); } catch (e) {} }
  },
  send(event, payload) { if (this.ch && this.connected) this.ch.send({ type: 'broadcast', event, payload }).catch(() => {}); },
  setStatus(s) { if (!this.me) return; this.me.status = s; if (this.ch) this.ch.track(this.me).catch(() => {}); },
  hostId() { const p = this.players.slice().sort((a, b) => a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : 1)); return p.length ? p[0].id : null; },
  isHost() { return this.me && this.hostId() === this.me.id; },
  onPresence() {
    const st = this.ch.presenceState(), list = [];
    for (const k in st) { const m = st[k][0]; if (m && m.id) list.push(m); }
    if (this.me && !list.find(p => p.id === this.me.id)) list.push(this.me);
    this.players = list;
    // ausgestiegene Mitspieler im laufenden Rennen markieren
    if (race.active && race.mp) {
      for (const v of race.vehicles) {
        if (!v.remote || v.left || v.finished) continue;
        const p = list.find(q => q.id === v.id);
        if (race.state !== 'run' || race.time < 3000) continue;
        if (!p || p.status !== 'racing' || p.rid !== race.rid) { v.left = true; v.mesh.visible = false; toast(v.name + ' hat das Rennen verlassen'); }
      }
    }
    renderLobby();
  },
  onMsg(ev, p) {
    if (!p) return;
    if (ev === 'start') { if (p.grid.some(g => g.id === this.me.id)) startMp(p); return; }
    if (!race.active || !race.mp) return;
    const v = race.vehicles.find(q => q.id === (p.i || p.o || p.t));
    if (ev === 'st') {
      if (!v || !v.remote) return;
      v.buf.push({ t: performance.now(), x: p.x, z: p.z, h: p.h, s: p.s });
      if (v.buf.length > 30) v.buf.shift();
      v.prog = p.p; v.lap = p.l; v.lastSeen = performance.now();
      if (p.sp > 0 && v.spinT <= 0) { v.spinT = p.sp; v.invulnT = 2.6; }
      if (p.f && !v.finished) v.finished = true;
    } else if (ev === 'fire') {
      if (!projectiles.find(q => q.id === p.id)) {
        spawnProjectile({ id: p.id, owner: p.o, ownerName: p.n, x: p.x, z: p.z, h: p.h, v: p.v });
        const o = race.vehicles.find(q => q.id === p.o); if (o && distToLocal(o) < 80) sfx.fire();
      }
    } else if (ev === 'hit') {
      removeProjectile(p.pid);
      const t = race.vehicles.find(q => q.id === p.t);
      if (t && t.remote && t.spinT <= 0) { t.spinT = 1.1; t.invulnT = 2.6; }
      if (p.o === this.me.id) { toast('TREFFER! ' + p.tn + ' hat unterschrieben!'); sfx.hit(); }
      window.__hits = (window.__hits || 0) + 1;
    } else if (ev === 'fin') {
      if (v) { v.finished = true; v.finishTime = p.t; if (isFinite(p.b)) v.best = p.b; }
      if (resultShown) renderResults();
    }
  }
};
function randomCode() { let s = ''; for (let i = 0; i < 4; i++) s += CODE_ABC[Math.floor(Math.random() * CODE_ABC.length)]; return s; }
async function enterRoom(code) {
  ensureAudio();
  $('mpMsg').textContent = 'Verbinde mit Raum ' + (code === 'PUBLIC' ? '„Schnelles Rennen“' : code) + ' …';
  try {
    await Net.join(code);
    showScreen('scr-lobby'); renderLobby();
  } catch (e) {
    $('mpMsg').textContent = '⚠️ Verbindung fehlgeschlagen (' + (e.message || e) + '). Internet prüfen und nochmal versuchen.';
    await Net.leave();
  }
}
function renderLobby() {
  if (!Net.me) return;
  $('lobbyCode').textContent = Net.code === 'PUBLIC' ? 'SCHNELLES RENNEN' : Net.code;
  $('lobbyHint').textContent = Net.code === 'PUBLIC' ? 'Öffentlicher Raum – jeder kann mitfahren.' : 'Gib diesen Code an deine Freunde weiter!';
  const hid = Net.hostId();
  const ps = Net.players.slice().sort((a, b) => a.joinedAt - b.joinedAt);
  $('lobbyList').innerHTML = ps.map(p => `<li class="${p.id === Net.me.id ? 'me' : ''}">${p.id === hid ? '👑 ' : ''}${escapeHtml(p.name)} <small>${escapeHtml((TRUCKS[p.truck] || TRUCKS[0]).name)}${p.status === 'racing' ? ' · im Rennen 🏁' : ''}</small></li>`).join('');
  const host = Net.isHost(), hostP = ps.find(p => p.id === hid);
  const ready = ps.filter(p => p.status === 'lobby').length;
  $('btnStartMp').classList.toggle('hidden', !host);
  $('btnStartMp').textContent = ready > 1 ? '🏁 RENNEN STARTEN (' + Math.min(8, ready) + ')' : '🏁 ALLEINE STARTEN';
  $('lobbyStatus').textContent = host ? (ready > 1 ? 'Du bist Host – starte, wenn alle da sind.' : 'Warte auf Mitspieler … oder starte schon mal.')
    : (hostP && hostP.status === 'racing' ? 'Ein Rennen läuft gerade – du bist beim nächsten dabei.' : 'Warte, bis der Host 👑 das Rennen startet …');
}
function hostStart() {
  if (!Net.isHost()) return;
  const grid = Net.players.filter(p => p.status === 'lobby').sort((a, b) => a.joinedAt - b.joinedAt).slice(0, 8).map(p => ({ id: p.id, n: p.name, v: p.truck }));
  const payload = { rid: 'r' + uid(), grid, cd: 4000, laps: LAPS };
  Net.send('start', payload);
  startMp(payload);
}
function startMp(p) {
  if (race.active && race.rid === p.rid) return;
  ensureAudio();
  clearRace();
  race.mp = true; race.rid = p.rid;
  p.grid.forEach((g, k) => {
    const local = g.id === Net.me.id;
    const v = new Vehicle({ id: g.id, name: local ? playerName : g.n, vi: local ? selVi : (g.v | 0), isLocal: local, remote: !local });
    initVehicle(v, k);
    if (local) race.me = v;
  });
  Net.me.rid = p.rid; Net.setStatus('racing');
  beginCountdown(p.cd);
}
async function quitRace() {
  const wasMp = race.mp;
  clearRace(); resetTouch(); $('hud').classList.add('hidden'); $('touch').classList.add('hidden'); $('countdown').classList.add('hidden'); $('wrongWay').classList.add('hidden');
  if (wasMp && Net.ch) { Net.setStatus('lobby'); showScreen('scr-lobby'); renderLobby(); }
  else showScreen('scr-select');
}

/* =====================================================================
   UI / BILDSCHIRME
   ===================================================================== */
let playerName = cleanName(ls.get('rf1_name', '') || ls.get('rff_name', '') || '');
let selVi = clamp(parseInt(ls.get('rf1_truck', '0'), 10) || 0, 0, TRUCKS.length - 1);
let curScreen = null;
function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.add('hidden');
  curScreen = id;
  if (id) $(id).classList.remove('hidden');
  if (id === 'scr-select') updateSelect();
}
function updateSelect() {
  const v = TRUCKS[selVi];
  $('nameLbl').textContent = playerName || '???';
  $('truckName').textContent = v.name; $('truckDesc').textContent = v.desc;
  $('stSpeed').style.width = v.speed * 10 + '%'; $('stAccel').style.width = v.accel * 10 + '%'; $('stHandling').style.width = v.handling * 10 + '%';
  showGarageTruck(selVi);
}
function changeTruck(d) { selVi = (selVi + d + TRUCKS.length) % TRUCKS.length; ls.set('rf1_truck', String(selVi)); beep(520 + selVi * 80, 0.08); updateSelect(); }
function submitName() {
  const n = cleanName($('nameInput').value);
  if (n.length < 2) { $('nameInput').classList.add('shake'); setTimeout(() => $('nameInput').classList.remove('shake'), 400); return; }
  playerName = n; ls.set('rf1_name', n); ensureAudio(); showScreen('scr-select');
}
function goFullscreen() {
  if (!isMobile) return;
  try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {}
}
let rotateDismissed = false;
function checkRotate() {
  const show = isTouch && !rotateDismissed && window.innerHeight > window.innerWidth && race.active;
  $('rotate').classList.toggle('hidden', !show);
}
const click = (id, fn) => $(id).addEventListener('click', e => { e.preventDefault(); ensureAudio(); fn(e); });
click('nameOk', submitName);
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });
click('btnName', () => { $('nameInput').value = playerName; showScreen('scr-name'); setTimeout(() => $('nameInput').focus(), 50); });
click('prevTruck', () => changeTruck(-1)); click('nextTruck', () => changeTruck(1));
click('btnSolo', () => { goFullscreen(); startSolo(); });
click('btnMulti', () => { $('mpMsg').textContent = ''; showScreen('scr-mp'); });
click('btnMpBack', () => showScreen('scr-select'));
click('btnQuick', () => enterRoom('PUBLIC'));
click('btnCreate', () => enterRoom(randomCode()));
click('btnJoin', () => {
  const c = ($('codeInput').value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (c.length !== 4) { $('mpMsg').textContent = 'Bitte einen 4-stelligen Raum-Code eingeben.'; return; }
  enterRoom(c);
});
$('codeInput').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
click('btnStartMp', () => { goFullscreen(); hostStart(); });
click('btnLeave', async () => { await Net.leave(); showScreen('scr-select'); });
click('btnPause', () => { if (!race.active) return; paused = !race.mp; showScreen('scr-pause'); $('touch').classList.add('hidden'); resetTouch(); });
click('btnResume', () => { paused = false; showScreen(null); if (isTouch || PARAMS.has('touchui')) $('touch').classList.remove('hidden'); lastT = performance.now(); });
click('btnQuit', () => { paused = false; quitRace(); });
click('btnMute', () => setMute(!audio.muted));
click('btnAgain', () => { if (race.mp) quitRace(); else startSolo(); });
click('btnMenu', async () => { const mp = race.mp; await quitRace(); if (mp) { await Net.leave(); } showScreen('scr-select'); });
click('rotOk', () => { rotateDismissed = true; checkRotate(); });

/* Eingabe */
const keys = { left: false, right: false, up: false, down: false };
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
window.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  const k = KEYMAP[e.code]; if (k) { keys[k] = true; e.preventDefault(); }
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) doFire(); }
  if (e.code === 'Escape' || e.code === 'KeyP') { if (race.active && curScreen === null) $('btnPause').click(); else if (curScreen === 'scr-pause') $('btnResume').click(); }
  if (e.code === 'KeyM') setMute(!audio.muted);
  if (curScreen === 'scr-select') { if (e.code === 'ArrowLeft') changeTruck(-1); if (e.code === 'ArrowRight') changeTruck(1); if (e.code === 'Enter') { startSolo(); } }
  ensureAudio();
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; resetTouch(); });
function doFire() {
  if (!race.active || race.state !== 'run' || !race.me || race.me.finished || race.me.spinT > 0) return;
  if (race.me.ammo <= 0) { toast('Kein Vertrag dabei – fahr durch eine ?-Box!'); return; }
  fireFrom(race.me);
}
// Touch: links analoger Stick (Lenken, nach unten ziehen = Bremse/Rückwärts), rechts GAS + FEUER
const touchState = { steer: 0, gas: false, brake: false, stickId: null, gasIds: new Set() };
{
  const zone = $('tStickZone'), base = $('tStick'), knob = $('tKnob');
  let cx = 0, cy = 0;
  const R = () => base.getBoundingClientRect().width * 0.42;
  const center = () => { const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; };
  const move = e => {
    const rad = R(); let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > rad) { dx *= rad / d; dy *= rad / d; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    let sx = dx / rad; const dz = 0.1;
    sx = Math.abs(sx) < dz ? 0 : Math.sign(sx) * (Math.abs(sx) - dz) / (1 - dz);
    touchState.steer = clamp(sx * Math.abs(sx) * 0.35 + sx * 0.65, -1, 1); // leicht progressiv
    touchState.brake = dy / rad > 0.55;
    base.classList.toggle('brake', touchState.brake);
  };
  const reset = () => { touchState.stickId = null; touchState.steer = 0; touchState.brake = false; knob.style.transform = 'translate(-50%,-50%)'; base.classList.remove('on', 'brake'); base.style.left = base.style.top = base.style.bottom = ''; };
  zone.addEventListener('pointerdown', e => {
    e.preventDefault(); ensureAudio();
    if (touchState.stickId !== null) return;
    touchState.stickId = e.pointerId; try { zone.setPointerCapture(e.pointerId); } catch (_) {}
    base.classList.add('on'); center();
    // schwebender Stick: weit daneben getippt -> Stick springt unter den Daumen
    if (Math.hypot(e.clientX - cx, e.clientY - cy) > R() * 1.3) {
      const zr = zone.getBoundingClientRect(), half = base.offsetWidth / 2;
      const x = clamp(e.clientX - zr.left, half, zr.width - half), y = clamp(e.clientY - zr.top, half, zr.height - half);
      base.style.left = x + 'px'; base.style.top = y + 'px'; base.style.bottom = 'auto'; center();
    }
    move(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === touchState.stickId) { e.preventDefault(); move(e); } });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(ev, e => { if (e.pointerId === touchState.stickId) reset(); });
  touchState.resetStick = reset;

  const gas = $('tGas');
  gas.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); touchState.gasIds.add(e.pointerId); try { gas.setPointerCapture(e.pointerId); } catch (_) {} touchState.gas = true; gas.classList.add('on'); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) gas.addEventListener(ev, e => { touchState.gasIds.delete(e.pointerId); if (!touchState.gasIds.size) { touchState.gas = false; gas.classList.remove('on'); } });

  const fire = $('tFire');
  fire.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); doFire(); fire.classList.add('on'); if (navigator.vibrate) navigator.vibrate(15); setTimeout(() => fire.classList.remove('on'), 150); });
  for (const el of [zone, gas, fire, $('touch')]) { el.addEventListener('contextmenu', e => e.preventDefault()); el.addEventListener('touchstart', e => e.preventDefault(), { passive: false }); }
}
function resetTouch() { touchState.resetStick && touchState.resetStick(); touchState.gas = false; touchState.gasIds.clear(); $('tGas').classList.remove('on'); }
document.addEventListener('contextmenu', e => { if (race.active) e.preventDefault(); });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (race.active) e.preventDefault(); }, { passive: false });

/* =====================================================================
   HAUPTSCHLEIFE
   ===================================================================== */
let lastT = performance.now(), paused = false, acc = 0, fpsN = 0, fpsT = 0, fps = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  fpsN++; fpsT += dt; if (fpsT > 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
  if (race.active) {
    if (paused) { race.goAt += dt * 1000; renderer.render(scene, camera); return; }
    // feste Teilschritte für stabile Physik
    acc += dt; let n = 0;
    while (acc > 1 / 60 && n < 5) { stepRace(1 / 60); acc -= 1 / 60; n++; }
    if (n === 5) acc = 0;
    updateParts(dt); updateCamera(dt); updateHud();
    if (audio.engGain && race.me) {
      const sp = Math.abs(race.me.speed);
      audio.engGain.gain.setTargetAtTime(race.state === 'run' || race.state === 'countdown' ? 0.07 + sp * 0.002 : 0, audio.ctx.currentTime, 0.1);
      audio.eng[0].frequency.setTargetAtTime(45 + sp * 3.2, audio.ctx.currentTime, 0.08); audio.eng[1].frequency.setTargetAtTime(22 + sp * 1.6, audio.ctx.currentTime, 0.08);
    }
    renderer.render(scene, camera);
  } else {
    if (audio.engGain) audio.engGain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.1);
    if (garageTurn) garageTurn.rotation.y += dt * 0.55;
    // Kamera so, dass der Truck links/mittig sichtbar ist
    const asp = garageCam.aspect;
    garageCam.position.set(9.5, 3.6, 9.5).multiplyScalar(asp < 1.2 ? 1.35 : 1);
    garageCam.lookAt(asp > 1.4 ? -1.6 : 0, 1.4, asp > 1.4 ? 1.6 : 0);
    renderer.render(garage, garageCam);
  }
}

/* Start */
buildTrackData();
scene.add(buildWorld(scene).group);
buildMinimap();
resize();
setMute(audio.muted);
$('nameInput').value = playerName;
showScreen(playerName ? 'scr-select' : 'scr-name');
$('loading').classList.add('hidden');
requestAnimationFrame(frame);

// Debug-/Test-Schnittstelle
window.__rf1 = {
  get race() { return race; }, get net() { return Net; }, projectiles, TRUCKS,
  cam() { return { x: camera.position.x, y: camera.position.y, z: camera.position.z, fov: camera.fov }; },
  state() { const me = race.me; return { active: race.active, mp: race.mp, state: race.state, time: race.time, fps, screen: curScreen, me: me && { id: me.id, lap: me.lap, prog: me.prog, x: me.x, z: me.z, speed: me.speed, ammo: me.ammo, finished: me.finished, spinT: me.spinT, pos: racingOrder().indexOf(me) + 1 }, vehicles: race.vehicles.map(v => ({ id: v.id, name: v.name, remote: v.remote, ai: v.isAI, x: v.x, z: v.z, lap: v.lap, finished: v.finished, spinT: v.spinT, left: !!v.left })), players: Net.players.map(p => ({ id: p.id, name: p.name, status: p.status })) }; },
  teleportBehind(id, dist = 14) { const t = race.vehicles.find(v => v.id === id), me = race.me; if (!t || !me) return false; const i = t.idx, back = (i - Math.round(dist / 1.6) + track.N) % track.N, l = lateral(i, t.x, t.z); me.place(back, l); me.lap = t.lap; me.updateProgress(true); snapCamera(); return true; },
  giveAmmo(n = 3) { if (race.me) { race.me.ammo = n; updateItemHud(); } },
  fire() { doFire(); },
  hold(id) { const v = race.vehicles.find(q => q.id === id); if (v) { v.held = true; } }
};
