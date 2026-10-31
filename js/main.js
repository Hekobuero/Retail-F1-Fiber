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
   FAHRZEUGE (10 Stück, prozedural nach den Fotos)
   type: box = Koffer-Transporter, bulli = VW-Bus, suv = BMW X6 + Anhänger
   ===================================================================== */
const TRUCKS = [
  { key: 'exposer', name: 'EXPOSER', desc: 'Fiat Ducato mit großer offener Seitenklappe und Kundenstopper – der Beratungs-Klassiker.', speed: 6, accel: 7, handling: 8, type: 'box', cab: 'fiat', rims: 'silver', flap: true, aboard: true, ac: true, snd: 'diesel' },
  { key: 'papamobil', name: 'PAPAMOBIL', desc: 'Telekom-Papamobil: VW T4 mit Glaskabine. „Unsere Glasfaser verbindet“ – „Glasfaser voraus!“', speed: 5, accel: 7, handling: 9, type: 'papa', rims: 'hubcap', snd: 'diesel' },
  { key: 'bulli', name: 'BULLI GLASFASER', desc: 'Moderner Kompakt-Van: „Mit Highspeed für euch auf Tour“. Flink und wendig.', speed: 6, accel: 9, handling: 7, type: 'van', rims: 'hubcap', snd: 'boxer' },
  { key: 'fiat', name: 'FIAT GLASFASER TRUCK', desc: 'Geschlossener Ducato-Koffer mit Dach-Klimaanlage. Solide wie ein FTTH-Anschluss.', speed: 7, accel: 6, handling: 7, type: 'box', cab: 'fiat', rims: 'silver', ac: true, snd: 'diesel' },
  { key: 'bmw', name: 'BMW X6 MIT ANHÄNGER', desc: 'BMW X6 in Graumetallic mit Glasfaser-Würfel auf dem Anhänger. Brutal schnell, Anhänger schiebt.', speed: 10, accel: 8, handling: 4, type: 'suv', rims: 'black', snd: 'v8' },
  { key: 'trabi', name: 'TRABI GLASFASER', desc: 'Trabant 601 in Magenta mit Zweitakt-Sound. Nicht schnell, aber wendig wie ein Glasfaser-Monteur.', speed: 3, accel: 7, handling: 10, type: 'trabi', rims: 'silver', snd: 'twostroke' },
  { key: 'master', name: 'RENAULT MASTER GLASFASER', desc: 'Hochdach-Master mit Glitzer-Lichtstreifen: „Glasfaser kommt!“ vorn, „Glasfaser voraus!“ hinten.', speed: 8, accel: 5, handling: 7, type: 'master', rims: 'magenta', snd: 'diesel' },
  { key: 'sprinter', name: 'SPRINTER KOFFER', desc: 'Mercedes Sprinter mit offener Hecktür und Treppe – Beratung von hinten.', speed: 8, accel: 6, handling: 6, type: 'box', cab: 'mercedes', rims: 'silver', rearOpen: true, ac: true, snd: 'diesel' },
  { key: 'highspeed', name: 'HIGHSPEED-MOBIL', desc: 'Rundes Wohnmobil-Design. „Hier kommt Ihr Highspeed-Anschluss.“', speed: 9, accel: 5, handling: 6, type: 'box', cab: 'fiat', rims: 'silver', rounded: true, livery: 'highspeed', flag: true, snd: 'diesel' },
  { key: 'ueberhol', name: 'ÜBERHOLSPUR', desc: 'Schwarze Felgen, Spoiler, Streifen. Hinten: „Jetzt auf die Überholspur wechseln!“', speed: 9, accel: 7, handling: 5, type: 'box', cab: 'fiat', rims: 'black', stripes: true, spoiler: true, rearText: ['Jetzt auf die', 'Überholspur', 'wechseln!'], snd: 'diesel' }
];
function statsOf(v) {
  // Tempo 5 ≈ 140 km/h … Tempo 10 ≈ 176 km/h (mit Windschatten +8 %)
  return { top: 29 + v.speed * 2.0, accel: 7 + v.accel * 1.05, steer: 0.95 + v.handling * 0.11, grip: 0.5 + v.handling * 0.05 };
}

const at = (m, p) => (m.position.set(p[0], p[1], p[2]), m);
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
function makeWheel(rims, r = 0.47) {
  const g = new THREE.Group();
  const k = rims + r;
  g.add(new THREE.Mesh(M('tireGeo' + r, () => new THREE.CylinderGeometry(r, r, 0.34, 14).rotateZ(Math.PI / 2)), M('tire', () => lam(0x1b1b1e))));
  const rimMat = rims === 'black' ? M('rimB', () => lam(0x222226)) : rims === 'magenta' ? M('rimM', () => lam(0xff3d9a)) : rims === 'hubcap' ? M('rimH', () => lam(0xc4c8ce)) : M('rimS', () => lam(0xd4d8de));
  g.add(new THREE.Mesh(M('rimGeo' + r, () => new THREE.CylinderGeometry(r * 0.64, r * 0.64, 0.36, 10).rotateZ(Math.PI / 2)), rimMat));
  const spokeMat = rims === 'black' ? M('spokeB', () => lam(0x8a8e96)) : M('spokeS', () => lam(0x7a7e86));
  for (let s = 0; s < 5; s++) {
    const sp = new THREE.Mesh(M('spokeGeo' + r, () => new THREE.BoxGeometry(0.38, 0.07, r * 0.85)), spokeMat);
    sp.rotation.x = s * Math.PI / 5; g.add(sp);
  }
  return g;
}

/* Lackierungen */
function swirlSideTexture(front, door) {
  const W = 920, H = 600, c = canvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#f7f7f9'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#E20074';
  g.beginPath(); g.moveTo(0, H * 0.55); g.bezierCurveTo(W * 0.3, H * 0.2, W * 0.55, H * 1.0, W, H * 0.45); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = '#ff7cc0'; g.beginPath(); g.moveTo(0, H * 0.62); g.bezierCurveTo(W * 0.3, H * 0.3, W * 0.55, H * 1.05, W, H * 0.55); g.lineTo(W, H * 0.6); g.bezierCurveTo(W * 0.55, H * 1.1, W * 0.3, H * 0.36, 0, H * 0.7); g.fill();
  const ox = door ? 0 : (front === 'left' ? W * 0.2 : 0);
  drawT(g, ox + 90, 110, 80, '#E20074');
  g.fillStyle = '#E20074'; g.font = 'bold 64px "Trebuchet MS",Verdana,sans-serif'; g.fillText('GLASFASER', ox + 150, 140);
  g.fillStyle = '#333'; g.font = 'bold 34px "Trebuchet MS",Verdana,sans-serif';
  g.fillText('Jetzt einsteigen –', ox + 52, 220); g.fillText('wir beraten dich gerne!', ox + 52, 262);
  drawQR(g, ox + 60, 470, 80, 3);
  if (door) doorOpening(g, W, H);
  return tex(c);
}
function doorOpening(g, W, H) {
  const dx = W * 0.66, dw = W * 0.3;
  g.fillStyle = '#d8d8de'; g.fillRect(dx - 10, 60, dw + 20, H - 70);
  const ig = g.createLinearGradient(0, 70, 0, H - 20); ig.addColorStop(0, '#fffdf6'); ig.addColorStop(1, '#d9d4ca');
  g.fillStyle = ig; g.fillRect(dx, 70, dw, H - 90);
  g.fillStyle = '#2a2a30'; g.fillRect(dx + dw * 0.45, 130, dw * 0.42, 90);
  g.fillStyle = '#4aa0e0'; g.fillRect(dx + dw * 0.48, 138, dw * 0.36, 74);
  g.fillStyle = '#f2f2f2'; g.fillRect(dx + 14, 330, dw * 0.45, 180);
  g.fillStyle = '#E20074'; g.fillRect(dx + 14, 330, dw * 0.45, 16);
  g.fillStyle = '#ffe9a8'; g.fillRect(dx + 30, 80, dw - 60, 8);
}
function highspeedSideTexture(front, door) {
  const W = 920, H = 600, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  const ox = front === 'left' ? W * 0.12 : 0;
  g.fillStyle = 'rgba(255,255,255,.16)'; for (let k = 0; k < 6; k++) g.fillRect(0, 300 + k * 26, W, 8 - k);
  drawT(g, ox + 90, 120, 76);
  g.fillStyle = '#fff'; g.font = 'italic bold 50px "Trebuchet MS",Verdana,sans-serif';
  g.fillText('Hier kommt Ihr', ox + 150, 110); g.fillText('Highspeed-Anschluss', ox + 150, 168);
  g.font = '28px "Trebuchet MS",Verdana,sans-serif'; g.fillText('Glasfaser · Schnell. Stabil. Zukunftssicher.', ox + 60, 236);
  drawFiberBundle(g, ox + 640, 470, 50);
  drawQR(g, ox + 60, 440, 84, 9);
  if (door) doorOpening(g, W, H);
  return tex(c);
}
function sideFor(v, front, door) {
  if (v.livery === 'swirl') return swirlSideTexture(front, door);
  if (v.livery === 'highspeed') return highspeedSideTexture(front, door);
  return sideTexture(front, door, v);
}
function rearTextTexture(lines) {
  const W = 512, H = 520, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  drawT(g, W / 2, 90, 80);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = 'bold 58px "Trebuchet MS",Verdana,sans-serif'; lines.forEach((l, i) => g.fillText(l, W / 2, 210 + i * 70));
  g.fillStyle = '#d00'; g.fillRect(30, H - 90, 50, 26); g.fillRect(W - 80, H - 90, 50, 26);
  return tex(c);
}
function rearOpenTexture() {
  const W = 512, H = 520, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  g.fillStyle = '#e9e4da'; g.fillRect(40, 30, W - 80, H - 50);
  g.fillStyle = '#c9c2b4'; g.fillRect(40, H - 120, W - 80, 100);
  g.fillStyle = '#2a2a30'; g.fillRect(170, 80, 170, 100); g.fillStyle = '#4aa0e0'; g.fillRect(180, 88, 150, 84);
  g.fillStyle = '#E20074'; g.fillRect(70, 260, 150, 14); g.fillRect(W - 220, 260, 150, 14);
  return tex(c);
}
function containerTexture(rearSide) {
  const W = 512, H = 512, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  g.fillStyle = '#fff'; g.font = 'bold 30px "Trebuchet MS",Verdana,sans-serif'; g.fillText('Wir verbinden Euch mit', 30, 60);
  drawT(g, 66, 112, 56); g.font = 'bold 64px "Trebuchet MS",Verdana,sans-serif'; g.fillText('GLASFASER', 104, 136);
  g.font = '24px "Trebuchet MS",Verdana,sans-serif'; g.fillText('Schnell. Stabil. Zukunftssicher.', 34, 180);
  drawFiberBundle(g, rearSide ? 330 : 300, 340, 54);
  // hellblauer Button "Jetzt hier in Eurer Stadt!"
  g.fillStyle = '#5ec8f0'; g.beginPath(); g.arc(rearSide ? 120 : 410, 300, 74, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 22px "Trebuchet MS",sans-serif';
  ['Jetzt hier', 'in Eurer', 'Stadt!'].forEach((l, i) => g.fillText(l, rearSide ? 120 : 410, 278 + i * 24)); g.textAlign = 'left';
  drawQR(g, 36, 410, 66, rearSide ? 4 : 8);
  return tex(c);
}
function vanSideTexture(front) {
  // Kompakt-Van: Fläche = Seite ohne Motorhaube. Fahrerhaus-Fenster vorn.
  const W = 1024, H = 420, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  const F = x => front === 'left' ? x : W - x; // x von vorn gemessen
  // Fenster vorn (Fahrertür)
  g.fillStyle = '#1d2c3c'; g.beginPath(); const fx0 = F(10), fx1 = F(200); g.moveTo(fx0, 20); g.lineTo(fx1, 20); g.lineTo(fx1, 170); g.lineTo(fx0, 170); g.fill();
  // Swoosh
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 10; g.beginPath(); g.moveTo(F(220), 400); g.bezierCurveTo(F(400), 300, F(600), 380, F(1010), 260); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(F(240), 370); g.bezierCurveTo(F(420), 280, F(600), 350, F(1010), 235); g.stroke();
  drawFiberBundle(g, F(560), 260, 56);
  g.fillStyle = '#fff'; g.textAlign = front === 'left' ? 'right' : 'left';
  const tx = F(990);
  drawT(g, front === 'left' ? tx - 330 : tx + 330 - 330 + 40, 80, 60);
  g.font = 'bold 62px "Trebuchet MS",Verdana,sans-serif'; g.fillText('GLASFASER', front === 'left' ? tx : tx + 70, 104);
  g.font = 'bold 26px "Trebuchet MS",Verdana,sans-serif'; g.fillText('Mit Highspeed für euch auf Tour', front === 'left' ? tx : tx + 70, 146);
  g.textAlign = 'left'; g.font = '22px "Trebuchet MS",sans-serif';
  const dx = front === 'left' ? 30 : W - 230;
  g.fillText('highspeedvorort.de', dx, 230); g.fillText('Tel. 0800 / 482 00 10', dx, 258);
  return tex(c);
}
function vanRearTexture() {
  const W = 512, H = 420, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  g.fillStyle = '#111'; g.fillRect(30, 14, W - 60, 150); g.fillStyle = '#26323e'; g.fillRect(44, 24, W / 2 - 54, 130); g.fillRect(W / 2 + 10, 24, W / 2 - 54, 130);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(W / 2 - 2, 0, 4, H);
  drawT(g, W / 2 + 60, 220, 70);
  drawQR(g, W - 120, 190, 60, 6);
  g.fillStyle = '#fff'; g.font = 'bold 30px "Trebuchet MS",sans-serif'; g.fillText('Mit Highspeed', W / 2 + 14, 300); g.fillText('für euch auf Tour', W / 2 + 14, 334);
  g.font = '20px "Trebuchet MS",sans-serif'; g.fillText('Tel. 0800 / 482 00 10', 40, 400); g.fillText('highspeedvorort.de', W / 2 + 40, 400);
  g.fillStyle = '#fff'; g.fillRect(150, 240, 120, 30); g.fillStyle = '#123'; g.font = 'bold 20px Arial'; g.fillText('SU·AR 235', 158, 262);
  return tex(c);
}
function darkGlassTexture(lines, withT, rear) {
  const W = 1024, H = 420, c = canvas(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2a3038'); gr.addColorStop(1, '#0e1116');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(W * 0.15, 0); g.lineTo(W * 0.45, 0); g.lineTo(W * 0.25, H); g.lineTo(0, H); g.fill();
  g.strokeStyle = '#000'; g.lineWidth = 18; g.strokeRect(0, 0, W, H);
  if (!rear) { g.fillStyle = '#000'; for (const x of [W * 0.34, W * 0.67]) g.fillRect(x - 6, 0, 12, H); }
  g.fillStyle = '#fff';
  const x0 = withT ? 300 : 80;
  if (withT) drawT(g, 170, H / 2, 210);
  g.font = 'bold ' + (rear ? 92 : 84) + 'px "Trebuchet MS",Verdana,sans-serif';
  lines.forEach((l, i) => g.fillText(l, x0, H / 2 - (lines.length - 1) * 48 + i * 96 + 30));
  return tex(c);
}
function plainSideTexture(front, opts = {}) {
  const W = 512, H = 256, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  const F = x => front === 'left' ? x : W - x;
  g.fillStyle = '#1d2c3c'; g.fillRect(Math.min(F(30), F(250)), 18, 220, 110);
  drawT(g, F(140), 190, 56);
  return tex(c);
}
function sparkleBg(g, W, H, seed) {
  magentaBg(g, W, H);
  const r = rng(seed);
  for (let k = 0; k < 7; k++) { const y = r() * H; const gr = g.createLinearGradient(0, y, W, y + 80); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,190,230,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, y, W, 14 + r() * 14); }
  for (let k = 0; k < 120; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; const s = 1 + r() * 3; g.fillRect(r() * W, r() * H, s, s); }
}
function masterSideTexture(front) {
  const W = 1024, H = 470, c = canvas(W, H), g = c.getContext('2d');
  sparkleBg(g, W, H, front === 'left' ? 3 : 4);
  const F = x => front === 'left' ? x : W - x;
  g.fillStyle = '#1d2c3c'; g.fillRect(Math.min(F(10), F(170)), 40, 160, 150);   // Fahrertür-Fenster
  // Schiebetür
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.strokeRect(Math.min(F(200), F(430)), 30, 230, H - 60);
  g.fillStyle = '#1d2c3c'; g.fillRect(Math.min(F(230), F(400)), 60, 170, 120);
  // Panel "UNSERE GLASFASER VERBINDET"
  const px = Math.min(F(470), F(860));
  g.fillStyle = 'rgba(150,0,80,.55)'; g.fillRect(px, 50, 390, 190); g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeRect(px, 50, 390, 190);
  drawT(g, px + 70, 145, 90);
  g.fillStyle = '#fff'; g.font = 'bold 44px "Trebuchet MS",Verdana,sans-serif';
  ['UNSERE', 'GLASFASER', 'VERBINDET'].forEach((l, i) => g.fillText(l, px + 140, 100 + i * 50));
  g.fillStyle = '#3a3c42'; g.fillRect(0, H - 50, W, 50);
  return tex(c);
}
function masterRearTexture() {
  const W = 512, H = 470, c = canvas(W, H), g = c.getContext('2d');
  sparkleBg(g, W, H, 7);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(W / 2 - 2, 0, 4, H - 50);
  g.fillStyle = '#fff'; g.font = 'bold 50px "Trebuchet MS",Verdana,sans-serif'; g.textAlign = 'center';
  g.fillText('GLASFASER', W / 2, 110); g.fillText('VORAUS!', W / 2, 170);
  drawT(g, W / 2, 260, 70);
  g.fillStyle = '#3a3c42'; g.fillRect(0, H - 50, W, 50);
  g.fillStyle = '#fff'; g.fillRect(W / 2 - 60, H - 100, 120, 28);
  return tex(c);
}
function hoodTextTexture(text) {
  const c = canvas(512, 128), g = c.getContext('2d');
  g.fillStyle = '#E20074'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#fff'; g.font = 'bold 64px "Trebuchet MS",Verdana,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
  return tex(c);
}
function flagTexture() {
  const c = canvas(128, 384), g = c.getContext('2d');
  g.fillStyle = '#E20074'; g.fillRect(0, 0, 128, 384);
  drawT(g, 64, 90, 70);
  g.save(); g.translate(64, 250); g.rotate(-Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 34px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.fillText('GLASFASER', 0, 12); g.restore();
  return tex(c);
}

function makeTruck(vi, opts = {}) {
  const v = TRUCKS[((vi % TRUCKS.length) + TRUCKS.length) % TRUCKS.length];
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const parts = { root, body, wheels: [], v };
  if (v.type === 'van') buildVan(parts);
  else if (v.type === 'papa') buildPapa(parts);
  else if (v.type === 'master') buildMaster(parts);
  else if (v.type === 'trabi') buildTrabi(parts);
  else if (v.type === 'suv') buildSuv(parts);
  else buildBox(parts, opts);
  const sh = new THREE.Mesh(M('shGeo', () => new THREE.PlaneGeometry(3.0, 6.6).rotateX(-Math.PI / 2)), M('shMat', () => new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })));
  sh.position.y = 0.04; root.add(sh);
  root.userData = { wheels: parts.wheels, body, variant: v, trailer: parts.trailer || null, flag: parts.flag || null, lastH: null };
  if (!opts.display) addHeadlights(root, body);
  return root;
}
function addWheels(parts, list, rims, r = 0.47, parent = null) {
  for (const [wx, wz, front] of list) {
    const holder = new THREE.Group(); holder.position.set(wx, r, wz);
    const w = makeWheel(rims, r); holder.add(w); (parent || parts.root).add(holder);
    parts.wheels.push({ holder, wheel: w, front, r });
  }
}
const COMMON = () => ({
  mg: M('magenta', () => lam(MAGENTA)), mgDark: M('magentaDark', () => lam(0x9a0050)), dark: M('dark', () => lam(0x222226)),
  white: M('white', () => lam(0xf2f2f2)),
  glass: M('glass', () => new THREE.MeshLambertMaterial({ color: 0x1d2c3c, emissive: 0x0a1420 })),
  hl: M('hl', () => new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xfff2c0 })),
  tail: M('tail', () => new THREE.MeshLambertMaterial({ color: 0xff2020, emissive: 0x880000 })),
  tlogo: M('tlogo', () => new THREE.MeshLambertMaterial({ map: tLogoTexture(), transparent: true }))
});

function buildBox(P, opts) {
  const { body, v } = P, C = COMMON();
  const bodyCol = v.livery === 'swirl' ? M('swWhite', () => lam(0xf7f7f9)) : C.mg;
  const sideL = M('sideL_' + v.key, () => new THREE.MeshLambertMaterial({ map: sideFor(v, 'left', false) }));
  const sideR = M('sideR_' + v.key, () => new THREE.MeshLambertMaterial({ map: sideFor(v, 'right', v.key !== 'fiat') }));
  const rear = v.rearText ? M('rearT_' + v.key, () => new THREE.MeshLambertMaterial({ map: rearTextTexture(v.rearText) }))
    : v.rearOpen ? M('rearOpen', () => new THREE.MeshLambertMaterial({ map: rearOpenTexture() }))
      : M('rear', () => new THREE.MeshLambertMaterial({ map: rearTexture() }));
  const boxH = v.rounded ? 2.5 : 2.35;
  const box = new THREE.Mesh(M('boxGeo' + boxH, () => new THREE.BoxGeometry(2.3, boxH, 3.6)), [sideL, sideR, bodyCol, C.dark, bodyCol, rear]);
  box.position.set(0, 0.62 + boxH / 2, -1.2); body.add(box);
  if (v.rounded) {
    // runde Kanten + Alkoven wie beim Wohnmobil
    const top = new THREE.Mesh(M('rTopGeo', () => new THREE.CylinderGeometry(1.15, 1.15, 3.6, 12, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(-Math.PI / 2)), C.mg);
    top.scale.set(1, 0.28, 1); top.position.set(0, 0.62 + boxH, -1.2); body.add(top);
    const alc = new THREE.Mesh(M('alcGeo', () => profileGeo([[0.6, 2.2], [1.3, 2.2], [1.95, 2.55], [2.05, 2.85], [1.7, 3.2], [0.6, 3.25]], 2.25)), C.mg); body.add(alc);
    const alcWin = new THREE.Mesh(M('alcWGeo', () => new THREE.PlaneGeometry(1.4, 0.3)), C.glass); alcWin.position.set(0, 2.98, 1.86); alcWin.rotation.x = -0.9; body.add(alcWin);
  } else {
    const luton = new THREE.Mesh(M('lutonGeo', () => profileGeo([[0.6, 2.25], [1.45, 2.25], [1.75, 2.42], [1.82, 2.72], [1.62, 2.97], [0.6, 2.97]], 2.2)), bodyCol);
    body.add(luton);
  }
  // Fahrerhaus je nach Marke
  const cabMat = C.mg;
  let cabPts, wsY = 1.83, wsZ = 1.97, wsRot = -0.73, nose = 2.88;
  if (v.cab === 'renault') { cabPts = [[0.6, 0.42], [2.78, 0.42], [2.86, 1.1], [2.7, 1.42], [2.3, 1.55], [1.62, 2.24], [0.6, 2.24]]; wsY = 1.9; wsZ = 1.96; wsRot = -0.8; nose = 2.8; }
  else if (v.cab === 'mercedes') { cabPts = [[0.6, 0.42], [3.15, 0.42], [3.2, 0.9], [3.0, 1.2], [2.4, 1.36], [1.6, 2.24], [0.6, 2.24]]; wsY = 1.8; wsZ = 2.0; wsRot = -0.85; nose = 3.12; }
  else cabPts = [[0.6, 0.42], [2.88, 0.42], [2.95, 0.95], [2.78, 1.27], [2.32, 1.42], [1.58, 2.24], [0.6, 2.24]];
  body.add(new THREE.Mesh(M('cabGeo_' + (v.cab || 'fiat'), () => profileGeo(cabPts, 2.12)), cabMat));
  const ws = new THREE.Mesh(M('wsGeo', () => new THREE.PlaneGeometry(1.95, 1.04)), C.glass);
  ws.position.set(0, wsY, wsZ); ws.rotation.x = wsRot; ws.translateZ(0.015); body.add(ws);
  for (const sx of [1, -1]) {
    const sw = new THREE.Mesh(M('swGeo', () => new THREE.PlaneGeometry(0.85, 0.62)), C.glass);
    sw.position.set(sx * 1.065, 1.78, 1.25); sw.rotation.y = sx * Math.PI / 2; body.add(sw);
    const tl = new THREE.Mesh(M('tGeo', () => new THREE.PlaneGeometry(0.42, 0.42)), C.tlogo);
    tl.position.set(sx * 1.068, 1.05, 1.2); tl.rotation.y = sx * Math.PI / 2; body.add(tl);
    const mir = new THREE.Mesh(M('mirGeo', () => new THREE.BoxGeometry(0.12, 0.32, 0.2)), C.dark); mir.position.set(sx * 1.2, 1.8, 1.72); body.add(mir);
    const hl = new THREE.Mesh(M('hlGeo', () => new THREE.BoxGeometry(0.42, 0.16, 0.06)), C.hl); hl.position.set(sx * 0.68, 1.18, nose - 0.05); hl.rotation.x = -0.5; body.add(hl);
    const tail = new THREE.Mesh(M('tailGeo', () => new THREE.BoxGeometry(0.3, 0.18, 0.05)), C.tail); tail.position.set(sx * 0.85, 0.85, -3.03); body.add(tail);
  }
  const grillW = v.cab === 'renault' ? 1.5 : v.cab === 'mercedes' ? 0.9 : 1.0;
  const grill = new THREE.Mesh(M('grillGeo' + grillW, () => new THREE.BoxGeometry(grillW, v.cab === 'renault' ? 0.5 : 0.3, 0.06)), C.dark); grill.position.set(0, 0.9, nose + 0.05); body.add(grill);
  if (v.cab === 'mercedes') { const star = new THREE.Mesh(M('starGeo', () => new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12).rotateX(Math.PI / 2)), M('chrome', () => lam(0xe0e4ea))); star.position.set(0, 0.95, nose + 0.1); body.add(star); }
  if (v.cab === 'renault') { const rl = new THREE.Mesh(M('rnGeo', () => new THREE.BoxGeometry(0.22, 0.28, 0.04)), M('chrome', () => lam(0xe0e4ea))); rl.position.set(0, 0.95, nose + 0.1); rl.rotation.z = Math.PI / 4; body.add(rl); }
  const bump = new THREE.Mesh(M('bumpGeo', () => new THREE.BoxGeometry(2.16, 0.3, 0.2)), C.mgDark); bump.position.set(0, 0.55, nose + 0.02); body.add(bump);
  body.add(at(new THREE.Mesh(M('chGeo', () => new THREE.BoxGeometry(1.9, 0.25, 5.6)), C.dark), [0, 0.5, -0.1]));
  // Extras
  if (v.ac) { const ac = new THREE.Mesh(M('acGeo', () => new THREE.BoxGeometry(0.95, 0.28, 0.75)), C.white); ac.position.set(0, 0.62 + boxH + 0.14, -1.6); body.add(ac); }
  if (v.flap) {
    // große Seitenklappe (rechts = Türseite, -x), nach oben geöffnet
    const flap = new THREE.Group();
    const outer = new THREE.Mesh(M('flapGeo', () => new THREE.BoxGeometry(1.7, 0.06, 2.4)), v.livery === 'swirl' ? M('swWhite', () => lam(0xf7f7f9)) : C.mg);
    outer.position.set(-0.85, 0, 0); flap.add(outer);
    const inner = new THREE.Mesh(M('flapInGeo', () => new THREE.PlaneGeometry(1.6, 2.3).rotateX(Math.PI / 2)), M('flapIn', () => lam(0xd8d8de, { side: THREE.DoubleSide })));
    inner.position.set(-0.85, -0.04, 0); flap.add(inner);
    const lamp = new THREE.Mesh(M('flapLampGeo', () => new THREE.BoxGeometry(0.08, 0.05, 2.0)), M('lampMat', () => new THREE.MeshBasicMaterial({ color: 0xfff2c0 }))); lamp.position.set(-1.5, -0.06, 0); flap.add(lamp);
    flap.position.set(-1.16, 0.62 + boxH - 0.02, -0.9); flap.rotation.z = -0.22; body.add(flap);
  }
  if (v.stairs) {
    for (let s = 0; s < 3; s++) { const st = new THREE.Mesh(M('stairGeo', () => new THREE.BoxGeometry(0.42, 0.1, 1.0)), M('alu', () => lam(0xb8bcc4))); st.position.set(-1.38 - s * 0.36, 0.58 - s * 0.19, -0.6); body.add(st); }
  } else { const step = new THREE.Mesh(M('stepGeo', () => new THREE.BoxGeometry(0.4, 0.12, 1.0)), C.dark); step.position.set(-1.3, 0.42, -0.3); body.add(step); }
  if (v.rearOpen) {
    for (const sx of [1, -1]) { const d = new THREE.Mesh(M('rdGeo', () => new THREE.BoxGeometry(1.12, 2.2, 0.05)), C.mg); d.position.set(sx * 1.72, 1.8, -3.0); d.rotation.y = sx * 1.35; body.add(d); }
    for (let s = 0; s < 3; s++) { const st = new THREE.Mesh(M('rstairGeo', () => new THREE.BoxGeometry(1.2, 0.1, 0.38)), M('alu', () => lam(0xb8bcc4))); st.position.set(0, 0.58 - s * 0.18, -3.2 - s * 0.32); body.add(st); }
  }
  if (v.spoiler) {
    body.add(at(new THREE.Mesh(M('spGeo', () => new THREE.BoxGeometry(2.2, 0.08, 0.6)), C.dark), [0, 3.25, -2.75]));
    for (const sx of [0.8, -0.8]) body.add(at(new THREE.Mesh(M('spPGeo', () => new THREE.BoxGeometry(0.08, 0.28, 0.2)), C.dark), [sx, 3.1, -2.75]));
  }
  if (v.spool) {
    const sp = new THREE.Group(), wood = M('wood', () => lam(0xb07a42));
    for (const sx of [0.55, -0.55]) { const d = new THREE.Mesh(M('spoolD', () => new THREE.CylinderGeometry(0.62, 0.62, 0.08, 14).rotateZ(Math.PI / 2)), wood); d.position.x = sx; sp.add(d); }
    sp.add(new THREE.Mesh(M('spoolC', () => new THREE.CylinderGeometry(0.46, 0.46, 1.04, 14).rotateZ(Math.PI / 2)), M('cable', () => lam(0xff4fa8))));
    sp.position.set(0, 3.62, -1.7); body.add(sp);
  }
  if (v.flag) {
    const fg = new THREE.Group();
    fg.add(at(new THREE.Mesh(M('poleGeo', () => new THREE.CylinderGeometry(0.04, 0.04, 3.0, 6)), M('alu', () => lam(0xb8bcc4))), [0, 1.5, 0]));
    const sail = new THREE.Mesh(M('sailGeo', () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0, 2.6); s.quadraticCurveTo(0.9, 2.7, 0.8, 1.4); s.quadraticCurveTo(0.7, 0.4, 0, 0); const g = new THREE.ShapeGeometry(s); const uv = g.attributes.uv; const p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 0.9, p.getY(i) / 2.7); return g; }), M('flagMat', () => new THREE.MeshLambertMaterial({ map: flagTexture(), side: THREE.DoubleSide })));
    sail.position.set(0.02, 0.3, 0); sail.rotation.y = Math.PI / 2; fg.add(sail);
    fg.position.set(0, 3.0, -2.6); body.add(fg); P.flag = sail;
  }
  addWheels(P, [[1.02, 2.15, true], [-1.02, 2.15, true], [1.02, -1.95, false], [-1.02, -1.95, false]], v.rims);
  if (opts.display && v.aboard) {
    const ab = new THREE.Group();
    const pm = M('aboardMat', () => new THREE.MeshLambertMaterial({ map: signTexture(['GLASFASER', 'Jetzt beraten', 'lassen!'], '#E20074', '#fff', 256, 340, false) }));
    for (const s of [1, -1]) { const p = new THREE.Mesh(M('abGeo', () => new THREE.PlaneGeometry(0.8, 1.15)), pm); p.position.set(0, 0.62, s * 0.22); p.rotation.x = s * 0.33; p.rotation.y = s > 0 ? 0 : Math.PI; ab.add(p); }
    ab.position.set(-2.9, 0, 0.8); ab.rotation.y = Math.PI / 2; P.root.add(ab);
  }
}

// Fahrerhaus-Front (Motorhaube + Frontscheibe) als Profil, von zb (Aufbaufront) bis zn (Nase)
function frontCab(P, o) {
  const { body } = P, C = COMMON();
  const { zb, zn, yHood, yTop, w, mat, bumperMat, y0 = 0.4, hoodText } = o;
  const zh = zn - (zn - zb) * 0.22, zw = zb + (zn - zb) * (o.wsFrac || 0.35);
  body.add(new THREE.Mesh(M('fc_' + o.key, () => profileGeo([[zb, y0], [zn, y0], [zn + 0.03, yHood - 0.3], [zh, yHood], [zw, yTop], [zb, yTop]], w)), mat));
  // Frontscheibe
  const ws = new THREE.Mesh(M('fcws_' + o.key, () => new THREE.PlaneGeometry(w * 0.9, Math.hypot(zh - zw, yTop - yHood) * 0.92)), C.glass);
  ws.position.set(0, (yHood + yTop) / 2, (zh + zw) / 2); ws.rotation.x = -Math.atan2(zh - zw, yTop - yHood); ws.translateZ(0.02); body.add(ws);
  if (hoodText) {
    const hp = new THREE.Mesh(M('fcht_' + o.key, () => new THREE.PlaneGeometry(w * 0.7, 0.32)), M('hood_' + hoodText, () => new THREE.MeshLambertMaterial({ map: hoodTextTexture(hoodText) })));
    hp.position.set(0, yHood + 0.02 - (yHood - (yHood - 0.3)) * 0.45, zh + (zn - zh) * 0.45); hp.rotation.x = -Math.PI / 2 + Math.atan2(0.3, zn - zh); hp.translateZ(0.02); body.add(hp);
  }
  for (const sx of [1, -1]) {
    const hl = new THREE.Mesh(M('hlGeo', () => new THREE.BoxGeometry(0.42, 0.16, 0.06)), C.hl); hl.position.set(sx * w * 0.32, yHood - 0.38, zn + 0.02); body.add(hl);
    const mir = new THREE.Mesh(M('mirGeo', () => new THREE.BoxGeometry(0.12, 0.32, 0.2)), C.dark); mir.position.set(sx * (w / 2 + 0.1), yHood + 0.2, zw - 0.1); body.add(mir);
  }
  body.add(at(new THREE.Mesh(M('fcgr_' + o.key, () => new THREE.BoxGeometry(w * 0.45, 0.22, 0.05)), C.dark), [0, yHood - 0.55, zn + 0.03]));
  body.add(at(new THREE.Mesh(M('fcbu_' + o.key, () => new THREE.BoxGeometry(w + 0.06, 0.32, 0.22)), bumperMat || C.dark), [0, y0 + 0.14, zn + 0.02]));
  if (o.logo === 'renault') { const rl = new THREE.Mesh(M('rnGeo', () => new THREE.BoxGeometry(0.2, 0.2, 0.04)), M('chrome', () => lam(0xe0e4ea))); rl.position.set(0, yHood - 0.5, zn + 0.07); rl.rotation.z = Math.PI / 4; body.add(rl); }
}
function rearLights(P, z, y, xs) { const C = COMMON(); for (const sx of [1, -1]) P.body.add(at(new THREE.Mesh(M('tailV', () => new THREE.BoxGeometry(0.18, 0.4, 0.05)), C.tail), [sx * xs, y, z])); }
function buildVan(P) {
  const { body } = P, C = COMMON();
  const L = M('vanL', () => new THREE.MeshLambertMaterial({ map: vanSideTexture('left') }));
  const R = M('vanR', () => new THREE.MeshLambertMaterial({ map: vanSideTexture('right') }));
  const B = M('vanB', () => new THREE.MeshLambertMaterial({ map: vanRearTexture() }));
  const box = new THREE.Mesh(M('vanBox', () => new THREE.BoxGeometry(1.95, 1.62, 3.7)), [L, R, C.mg, C.dark, C.mg, B]);
  box.position.set(0, 0.36 + 0.81, -0.75); body.add(box);
  frontCab(P, { key: 'van', zb: 1.1, zn: 2.45, yHood: 1.12, yTop: 1.98, w: 1.95, mat: C.mg, y0: 0.36, wsFrac: 0.15 });
  body.add(at(new THREE.Mesh(M('vanBumpR', () => new THREE.BoxGeometry(2.0, 0.3, 0.2)), C.dark), [0, 0.5, -2.62]));
  body.add(at(new THREE.Mesh(M('vanSkirt', () => new THREE.BoxGeometry(2.0, 0.16, 4.9)), C.dark), [0, 0.42, -0.1]));
  for (const sx of [1, -1]) { const t = new THREE.Mesh(M('tGeoS', () => new THREE.PlaneGeometry(0.36, 0.36)), C.tlogo); t.position.set(sx * 0.985, 0.95, 0.6); t.rotation.y = sx * Math.PI / 2; body.add(t); }
  // Dachträger hinten
  body.add(at(new THREE.Mesh(M('vanRack', () => new THREE.BoxGeometry(1.7, 0.06, 1.6)), C.dark), [0, 2.08, -1.6]));
  for (const z of [-0.9, -2.3]) body.add(at(new THREE.Mesh(M('vanRackB', () => new THREE.BoxGeometry(1.8, 0.1, 0.08)), C.dark), [0, 2.02, z]));
  rearLights(P, -2.61, 1.25, 0.86);
  addWheels(P, [[0.92, 1.65, true], [-0.92, 1.65, true], [0.92, -1.6, false], [-0.92, -1.6, false]], 'hubcap', 0.4);
}
function buildPapa(P) {
  const { body } = P, C = COMMON();
  const cabL = M('papaCabL', () => new THREE.MeshLambertMaterial({ map: plainSideTexture('left') }));
  const cabR = M('papaCabR', () => new THREE.MeshLambertMaterial({ map: plainSideTexture('right') }));
  const gS = M('papaGlassS', () => new THREE.MeshLambertMaterial({ map: darkGlassTexture(['UNSERE', 'GLASFASER', 'VERBINDET'], true, false) }));
  const gB = M('papaGlassB', () => new THREE.MeshLambertMaterial({ map: darkGlassTexture(['GLASFASER', 'VORAUS!'], false, true) }));
  const blk = M('black', () => lam(0x111114));
  // Fahrerhaus (VW T4)
  const cab = new THREE.Mesh(M('papaCab', () => new THREE.BoxGeometry(1.95, 1.5, 1.3)), [cabL, cabR, C.mg, C.dark, C.mg, C.mg]); cab.position.set(0, 0.36 + 0.75, 0.95); body.add(cab);
  frontCab(P, { key: 'papa', zb: 1.6, zn: 2.5, yHood: 1.1, yTop: 1.86, w: 1.95, mat: C.mg, y0: 0.36, wsFrac: 0.05, hoodText: 'GLASFASER' });
  // Heck: unten Magenta, oben Glaskabine
  const low = new THREE.Mesh(M('papaLow', () => new THREE.BoxGeometry(1.95, 0.8, 2.85)), C.mg); low.position.set(0, 0.36 + 0.4, -1.12); body.add(low);
  const glassBox = new THREE.Mesh(M('papaGlassBox', () => new THREE.BoxGeometry(2.0, 1.3, 2.95)), [gS, gS, blk, blk, blk, gB]); glassBox.position.set(0, 1.16 + 0.65, -1.12); body.add(glassBox);
  body.add(at(new THREE.Mesh(M('papaRoofRim', () => new THREE.BoxGeometry(2.06, 0.08, 3.0)), blk), [0, 2.48, -1.12]));
  body.add(at(new THREE.Mesh(M('papaBumpR', () => new THREE.BoxGeometry(2.0, 0.28, 0.2)), C.dark), [0, 0.5, -2.62]));
  body.add(at(new THREE.Mesh(M('papaSkirt', () => new THREE.BoxGeometry(2.0, 0.16, 5.0)), C.dark), [0, 0.42, -0.1]));
  for (const sx of [1, -1]) { const t = new THREE.Mesh(M('tGeoS', () => new THREE.PlaneGeometry(0.36, 0.36)), C.tlogo); t.position.set(sx * 0.985, 0.8, 0.95); t.rotation.y = sx * Math.PI / 2; body.add(t); }
  rearLights(P, -2.56, 0.9, 0.85);
  addWheels(P, [[0.92, 1.75, true], [-0.92, 1.75, true], [0.92, -1.55, false], [-0.92, -1.55, false]], 'hubcap', 0.4);
}
function buildMaster(P) {
  const { body } = P, C = COMMON();
  const L = M('mL', () => new THREE.MeshLambertMaterial({ map: masterSideTexture('left') }));
  const R = M('mR', () => new THREE.MeshLambertMaterial({ map: masterSideTexture('right') }));
  const B = M('mB', () => new THREE.MeshLambertMaterial({ map: masterRearTexture() }));
  const grey = M('trimGrey', () => lam(0x3a3c42));
  const box = new THREE.Mesh(M('mBox', () => new THREE.BoxGeometry(2.05, 2.4, 4.0)), [L, R, C.mg, C.dark, C.mg, B]);
  box.position.set(0, 0.4 + 1.2, -1.0); body.add(box);
  frontCab(P, { key: 'master', zb: 1.0, zn: 2.55, yHood: 1.25, yTop: 2.3, w: 2.0, mat: C.mg, bumperMat: grey, y0: 0.4, wsFrac: 0.2, hoodText: 'GLASFASER KOMMT!', logo: 'renault' });
  // Hochdach-Übergang
  body.add(new THREE.Mesh(M('mRoofFront', () => profileGeo([[0.95, 2.3], [1.45, 2.3], [1.0, 2.8], [0.95, 2.8]], 2.05)), C.mg));
  body.add(at(new THREE.Mesh(M('mBumpR', () => new THREE.BoxGeometry(2.1, 0.3, 0.2)), grey), [0, 0.55, -3.06]));
  rearLights(P, -3.01, 1.15, 0.9);
  addWheels(P, [[0.98, 1.85, true], [-0.98, 1.85, true], [0.98, -2.1, false], [-0.98, -2.1, false]], 'magenta', 0.44);
}
function buildSuv(P) {
  const { body, root } = P, C = COMMON();
  const grey = M('bmwGrey', () => new THREE.MeshPhongMaterial({ color: 0x7c838d, specular: 0x9aa4b0, shininess: 60 }));
  const lower = new THREE.Mesh(M('suvLow', () => new THREE.BoxGeometry(2.0, 0.78, 4.9)), grey); lower.position.set(0, 0.95, 0); body.add(lower);
  // Coupé-Dachlinie (X6): Profil in (z,y)
  const cabin = new THREE.Mesh(M('suvCab', () => profileGeo([[-2.35, 1.3], [1.15, 1.3], [0.25, 2.05], [-0.9, 2.08], [-2.0, 1.62]], 1.78)), grey); body.add(cabin);
  const glassSide = new THREE.Mesh(M('suvGlass', () => profileGeo([[-2.0, 1.38], [1.0, 1.38], [0.22, 1.95], [-0.85, 1.98], [-1.85, 1.6]], 1.82)), C.glass); body.add(glassSide);
  // Motorhaube leicht abgesenkt, Niere
  for (const sx of [0.2, -0.2]) { const k = new THREE.Mesh(M('kidGeo', () => new THREE.BoxGeometry(0.32, 0.36, 0.06)), C.dark); k.position.set(sx, 1.05, 2.46); body.add(k); }
  for (const sx of [1, -1]) {
    const hl = new THREE.Mesh(M('suvHl', () => new THREE.BoxGeometry(0.5, 0.12, 0.06)), C.hl); hl.position.set(sx * 0.68, 1.16, 2.46); body.add(hl);
    const tl = new THREE.Mesh(M('suvTl', () => new THREE.BoxGeometry(0.55, 0.14, 0.05)), C.tail); tl.position.set(sx * 0.66, 1.22, -2.46); body.add(tl);
    const mir = new THREE.Mesh(M('mirGeoS', () => new THREE.BoxGeometry(0.1, 0.16, 0.24)), grey); mir.position.set(sx * 1.06, 1.45, 0.9); body.add(mir);
    const t = new THREE.Mesh(M('tGeoS', () => new THREE.PlaneGeometry(0.36, 0.36)), C.tlogo); t.position.set(sx * 1.005, 1.0, -0.2); t.rotation.y = sx * Math.PI / 2; body.add(t);
  }
  body.add(at(new THREE.Mesh(M('suvSkirt', () => new THREE.BoxGeometry(2.04, 0.22, 4.95)), C.dark), [0, 0.56, 0]));
  addWheels(P, [[0.98, 1.6, true], [-0.98, 1.6, true], [0.98, -1.55, false], [-0.98, -1.55, false]], 'black', 0.5);
  // Anhänger: verzinkter Kastenanhänger mit Deichsel + Stützrad, darauf der Glasfaser-Würfel
  const hitch = new THREE.Group(); hitch.position.set(0, 0, -2.75); root.add(hitch);
  const tr = new THREE.Group(); hitch.add(tr);
  const galv = M('galv', () => lam(0xa9afb6));
  const cS = M('cubeS', () => new THREE.MeshLambertMaterial({ map: containerTexture(false) }));
  const cB = M('cubeB', () => new THREE.MeshLambertMaterial({ map: containerTexture(true) }));
  const bed = new THREE.Mesh(M('trBed', () => new THREE.BoxGeometry(2.1, 0.36, 2.6)), galv); bed.position.set(0, 0.78, -2.5); tr.add(bed);
  const cube = new THREE.Mesh(M('cubeGeo', () => new THREE.BoxGeometry(2.0, 2.1, 2.3)), [cS, cS, C.mg, C.dark, cS, cB]); cube.position.set(0, 0.96 + 1.05, -2.5); tr.add(cube);
  tr.add(at(new THREE.Mesh(M('drawbar', () => new THREE.BoxGeometry(0.14, 0.12, 1.3)), galv), [0, 0.6, -0.6]));
  tr.add(at(new THREE.Mesh(M('jockey', () => new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6)), C.dark), [0.12, 0.35, -0.5]));
  tr.add(at(new THREE.Mesh(M('jockeyW', () => new THREE.CylinderGeometry(0.1, 0.1, 0.06, 10).rotateZ(Math.PI / 2)), C.dark), [0.12, 0.1, -0.5]));
  for (const sx of [1, -1]) tr.add(at(new THREE.Mesh(M('fender', () => new THREE.BoxGeometry(0.3, 0.06, 0.9)), galv), [sx * 1.13, 0.98, -2.5]));
  addWheels(P, [[1.13, -2.5, false], [-1.13, -2.5, false]], 'silver', 0.36, tr);
  rearLights({ body: tr }, -3.66, 0.75, 0.85);
  P.trailer = hitch;
}

function trabiSideTexture(front) {
  const W = 512, H = 256, c = canvas(W, H), g = c.getContext('2d');
  magentaBg(g, W, H);
  g.fillStyle = '#fff'; g.fillRect(0, H * 0.62, W, 10);
  const ox = front === 'left' ? 40 : 150;
  drawT(g, ox + 34, 120, 44);
  g.font = 'bold 46px "Trebuchet MS",Verdana,sans-serif'; g.fillText('GLASFASER', ox + 66, 138);
  g.font = '20px "Trebuchet MS",Verdana,sans-serif'; g.fillText('Schnell. Stabil. Zukunftssicher.', ox + 10, 200);
  return tex(c);
}
function buildTrabi(P) {
  const { body } = P, C = COMMON();
  const sL = M('trabiL', () => new THREE.MeshLambertMaterial({ map: trabiSideTexture('left') }));
  const sR = M('trabiR', () => new THREE.MeshLambertMaterial({ map: trabiSideTexture('right') }));
  const cream = M('trabiCream', () => lam(0xf3ecd8));
  // flache Wanne + kleine Kabine (Trabant 601)
  const low = new THREE.Mesh(M('trLow', () => new THREE.BoxGeometry(1.6, 0.62, 3.6)), [sL, sR, C.mg, C.dark, C.mg, C.mg]); low.position.set(0, 0.68, 0); body.add(low);
  const hood = new THREE.Mesh(M('trHood', () => profileGeo([[1.1, 0.99], [1.8, 0.99], [1.8, 0.86], [1.1, 1.04]], 1.56)), C.mg); body.add(hood);
  const cab = new THREE.Mesh(M('trCab', () => profileGeo([[-1.65, 0.99], [0.95, 0.99], [0.45, 1.55], [-1.3, 1.58], [-1.62, 1.2]], 1.5)), cream); body.add(cab);
  const gl = new THREE.Mesh(M('trGlass', () => profileGeo([[-1.5, 1.04], [0.85, 1.04], [0.4, 1.5], [-1.25, 1.52], [-1.52, 1.22]], 1.54)), C.glass); body.add(gl);
  const roof = new THREE.Mesh(M('trRoof', () => new THREE.BoxGeometry(1.48, 0.06, 1.7)), cream); roof.position.set(0, 1.59, -0.42); body.add(roof);
  for (const sx of [1, -1]) {
    const hl = new THREE.Mesh(M('trHl', () => new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10).rotateX(Math.PI / 2)), C.hl); hl.position.set(sx * 0.55, 0.82, 1.81); body.add(hl);
    const tl = new THREE.Mesh(M('trTl', () => new THREE.BoxGeometry(0.22, 0.14, 0.04)), C.tail); tl.position.set(sx * 0.55, 0.85, -1.81); body.add(tl);
    const t = new THREE.Mesh(M('tGeoT', () => new THREE.PlaneGeometry(0.3, 0.3)), C.tlogo); t.position.set(sx * 0.81, 1.25, -0.1); t.rotation.y = sx * Math.PI / 2; body.add(t);
  }
  body.add(at(new THREE.Mesh(M('trBump', () => new THREE.BoxGeometry(1.7, 0.14, 0.14)), M('chrome', () => lam(0xe0e4ea))), [0, 0.48, 1.84]));
  body.add(at(new THREE.Mesh(M('trBumpR', () => new THREE.BoxGeometry(1.7, 0.14, 0.14)), M('chrome', () => lam(0xe0e4ea))), [0, 0.48, -1.84]));
  // Auspuff-Wölkchen-Halter (Zweitakt!)
  body.add(at(new THREE.Mesh(M('trExh', () => new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6).rotateX(Math.PI / 2)), C.dark), [0.5, 0.35, -1.9]));
  addWheels(P, [[0.74, 1.2, true], [-0.74, 1.2, true], [0.74, -1.2, false], [-0.74, -1.2, false]], 'silver', 0.34);
  P.body.scale.setScalar(1.05);
}
function animateTruck(m, speed, steer, dt, heading) {
  for (const w of m.userData.wheels) {
    w.wheel.rotation.x += speed * dt / (w.r || 0.47);
    if (w.front) w.holder.rotation.y = steer * 0.45;
  }
  const ud = m.userData;
  if (ud.trailer && heading !== undefined) {
    // Anhängerwinkel relativ zum Zugfahrzeug: folgt der Drehung verzögert
    if (ud.lastH === null) ud.lastH = heading;
    const yaw = wrapAng(heading - ud.lastH); ud.lastH = heading;
    let a = ud.trailer.rotation.y - yaw;
    a -= a * Math.min(1, Math.abs(speed) * dt / 3.4);
    ud.trailer.rotation.y = clamp(a, -1.1, 1.1);
  }
  if (ud.flag) ud.flag.rotation.y = Math.PI / 2 + Math.sin(performance.now() * 0.006) * 0.12 + Math.min(0.5, Math.abs(speed) * 0.01);
}

/* =====================================================================
   STRECKE: "Glasfaser-Ring" – Metropole + Landstraße
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

let world = null, world_blitz = null;
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

  // Metropole (Osten) + Felder (Westen)
  buildCityAndLights(group, placed, freeAt, along, r);
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
      if (isCity(x, z) || !freeAt(x, z, Math.max(w, d) * 0.6)) continue;
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
  for (let k = 0; k < 1400 && treeSpots.length < 190; k++) {
    const x = (r() - 0.5) * 560 - 60, z = (r() - 0.5) * 460 + 90;
    const rad = 2.5;
    if (isCity(x, z) || !freeAt(x, z, rad)) continue;
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
  // Blitzer (Starenkasten) auf der längsten Geraden
  {
    const curv = i => { const a = track.tan[(i + N) % N], c = track.tan[(i + 6) % N]; return Math.abs(a.x * c.z - a.z * c.x); };
    let best = 0, bestLen = 0, run = 0;
    for (let i = 0; i < N * 2; i++) { if (curv(i % N) < 0.03) { run++; if (run > bestLen) { bestLen = run; best = i % N; } } else run = 0; }
    // Blitzer bei ca. 70 % der Geraden, nicht zu nah am Start
    let bi = (best - Math.floor(bestLen * 0.3) + N) % N;
    if (bi < 25 || bi > N - 25) bi = (bi + 40) % N;
    const off = -(HW + 2.6); // rechte Straßenseite
    const [x, z, rot] = along(bi, off);
    const g = new THREE.Group();
    const grey = lam(0x8a9098), dk = lam(0x2a2c30);
    g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 8), grey), [0, 1.3, 0]));
    const kasten = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.8), grey); kasten.position.set(0, 3.2, 0); g.add(kasten);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.9), dk); roof.position.set(0, 3.9, 0); g.add(roof);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12).rotateX(Math.PI / 2), dk); lens.position.set(0.1, 3.35, 0.42); g.add(lens);
    const flashM = new THREE.MeshBasicMaterial({ color: 0x552222 });
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.06), flashM); fl.position.set(0, 2.8, 0.42); g.add(fl);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.82), lam(0xffffff)); stripe.position.set(0, 2.62, 0); g.add(stripe);
    // Kasten schaut den anfahrenden Fahrzeugen entgegen
    g.position.set(x, 0, z); g.rotation.y = rot + Math.PI; group.add(g);
    placed.push({ x, z, r: 1.2 });
    // Warnschild 120 ca. 70 m vorher
    const wi = (bi - 44 + N) % N, [wx, wz, wr] = along(wi, -(HW + 2.4));
    const c = canvas(256, 320), sg = c.getContext('2d');
    sg.fillStyle = '#fff'; sg.fillRect(0, 0, 256, 320);
    sg.fillStyle = '#d00'; sg.beginPath(); sg.arc(128, 128, 118, 0, Math.PI * 2); sg.fill(); sg.fillStyle = '#fff'; sg.beginPath(); sg.arc(128, 128, 92, 0, Math.PI * 2); sg.fill();
    sg.fillStyle = '#111'; sg.font = 'bold 96px Arial,sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('120', 128, 134);
    sg.font = 'bold 40px Arial,sans-serif'; sg.fillText('📸 BLITZER', 128, 288);
    const sign = new THREE.Group();
    sign.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), grey), [0, 1.2, 0]));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshLambertMaterial({ map: tex(c), side: THREE.DoubleSide })); plate.position.set(0, 3.2, 0); sign.add(plate);
    sign.position.set(wx, 0, wz); sign.rotation.y = wr + Math.PI; group.add(sign);
    world_blitz = { idx: bi, x, z, flashM, warnIdx: wi };
  }
  // Straßenlaternen auf der ganzen Runde
  buildLamps(group, along);
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
  world = { group, items, blockers: placed, blitz: world_blitz };
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
   AUDIO (prozedurales WebAudio, keine Dateien)
   ===================================================================== */
const MASTER_VOL = 0.45;
const audio = { ctx: null, master: null, sfxBus: null, muted: ls.get('rf1_muted', '0') === '1', eng: null, squeal: null, unlocked: false };
const ENGINE_CLASSES = {
  diesel: { t1: 'sawtooth', t2: 'triangle', base: 34, mul: 2.3, sub: 0.5, lp: 420, vol: 0.04 },
  boxer: { t1: 'triangle', t2: 'square', base: 42, mul: 3.0, sub: 0.5, lp: 520, vol: 0.035 },
  v8: { t1: 'sawtooth', t2: 'triangle', base: 46, mul: 3.6, sub: 0.502, lp: 700, vol: 0.04 },
  twostroke: { t1: 'square', t2: 'triangle', base: 70, mul: 5.0, sub: 1.01, lp: 1300, vol: 0.028 }
};
function noiseBuffer(sec) {
  const a = audio.ctx, n = Math.floor(a.sampleRate * sec), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
function ensureAudio() {
  try {
    if (!audio.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const a = audio.ctx = new AC();
      audio.master = a.createGain(); audio.master.gain.value = audio.muted ? 0 : MASTER_VOL;
      const comp = a.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      audio.master.connect(comp); comp.connect(a.destination);
      audio.noise = noiseBuffer(2);
      // Motor: 2 Oszillatoren + Tiefpass
      const o1 = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = 'lowpass'; f.Q.value = 0.7; g.gain.value = 0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(audio.master); o1.start(); o2.start();
      audio.eng = { o1, o2, f, g, cls: null };
      setEngineClass('diesel');
      // Reifenquietschen: Rauschen durch Bandpass, Lautstärke geregelt
      const ns = a.createBufferSource(); ns.buffer = audio.noise; ns.loop = true;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 9;
      const sg = a.createGain(); sg.gain.value = 0; ns.connect(bp); bp.connect(sg); sg.connect(audio.master); ns.start();
      audio.squeal = { g: sg, bp };
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    if (!audio.unlocked) { // iOS: einmal einen stummen Puffer abspielen
      const s = audio.ctx.createBufferSource(); s.buffer = audio.ctx.createBuffer(1, 1, 22050); s.connect(audio.ctx.destination); s.start(0); audio.unlocked = true;
    }
  } catch (e) {}
}
['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, ensureAudio, { passive: true }));
function setEngineClass(cls) {
  const e = audio.eng; if (!e) return; const c = ENGINE_CLASSES[cls] || ENGINE_CLASSES.diesel;
  if (e.cls === c) return; e.cls = c; e.o1.type = c.t1; e.o2.type = c.t2; e.f.frequency.value = c.lp;
}
function updateEngineAudio(speed, steer, active, spin) {
  const e = audio.eng; if (!e) return; const t = audio.ctx.currentTime, c = e.cls, sp = Math.abs(speed);
  // einfache "Gänge": Drehzahl steigt, fällt beim Schalten etwas zurück
  const gear = Math.min(4, Math.floor(sp / 13)), rpm = (sp - gear * 13) / 13 * 0.6 + gear * 0.22;
  const f = c.base + (rpm * 40 + sp * 0.9) * c.mul * 0.45;
  e.o1.frequency.setTargetAtTime(f, t, 0.06); e.o2.frequency.setTargetAtTime(f * c.sub, t, 0.06);
  // leiser & weicher: Lautstärke steigt nur sanft, Filter öffnet begrenzt (keine harten Höhen bei hoher Drehzahl)
  e.g.gain.setTargetAtTime(active ? c.vol + Math.min(sp, 45) * 0.0004 : 0, t, 0.15);
  e.f.frequency.setTargetAtTime(Math.min(c.lp + sp * 9, c.lp * 2.2), t, 0.12);
  const sq = active && (spin || (Math.abs(steer) > 0.7 && sp > 20)) ? (spin ? 0.12 : 0.05 + (Math.abs(steer) - 0.7) * 0.2) : 0;
  audio.squeal.g.gain.setTargetAtTime(sq, t, 0.05);
  audio.squeal.bp.frequency.setTargetAtTime(2300 + sp * 12, t, 0.1);
}
function tone(f, dur, type = 'square', vol = 0.12, slide = null, delay = 0, vib = 0) {
  const a = audio.ctx; if (!a) return;
  try {
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    if (vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 6; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(audio.master); o.start(t); o.stop(t + dur + 0.05);
  } catch (e) {}
}
const beep = tone;
function noise(dur, vol, f0, f1, type = 'bandpass', delay = 0, q = 1) {
  const a = audio.ctx; if (!a) return;
  try {
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + delay;
    s.buffer = audio.noise; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(audio.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  } catch (e) {}
}
const sfx = {
  count() { tone(440, 0.22, 'square', 0.11); },
  go() { tone(880, 0.55, 'square', 0.13); tone(1320, 0.55, 'triangle', 0.06); },
  pickup() { [784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.12, 'triangle', 0.09, null, i * 0.05)); },
  fire() { noise(0.4, 0.3, 700, 3200, 'bandpass', 0, 2); noise(0.25, 0.18, 3000, 900, 'bandpass', 0.12, 3); },
  hit() { noise(0.5, 0.35, 900, 120); tone(220, 0.4, 'sawtooth', 0.09, 60); },
  crash() { noise(0.6, 0.5, 1400, 80, 'lowpass'); [180, 260, 140].forEach((f, i) => tone(f, 0.14, 'square', 0.07, f * 0.6, i * 0.05)); noise(0.3, 0.2, 5000, 2000, 'highpass', 0.05); },
  bump() { tone(120, 0.12, 'square', 0.07, 70); },
  horn() { tone(392, 0.38, 'square', 0.06); tone(494, 0.38, 'square', 0.05); },
  blitz() { noise(0.035, 0.5, 6000, 4000, 'highpass'); tone(2400, 0.25, 'sine', 0.07, 7000, 0.02); noise(0.05, 0.3, 3000, 2000, 'bandpass', 0.09); },
  ring() { for (let r = 0; r < 2; r++) for (let k = 0; k < 10; k++) { tone(1046, 0.04, 'square', 0.05, null, r * 0.9 + k * 0.05); tone(1318, 0.04, 'square', 0.04, null, r * 0.9 + k * 0.05 + 0.025); } },
  lap() { [523, 659, 784].forEach((f, i) => tone(f, 0.13, 'square', 0.09, null, i * 0.09)); },
  finish() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.7 : 0.17, 'square', 0.09, null, i * 0.14)); [262, 330, 392].forEach(f => tone(f, 1.2, 'triangle', 0.05, null, 0.7)); },
  dsq() { [392, 370, 349].forEach((f, i) => tone(f, 0.42, 'sawtooth', 0.09, null, i * 0.45)); tone(330, 1.1, 'sawtooth', 0.09, 300, 1.35, 9); }
};
function setMute(m) { audio.muted = m; ls.set('rf1_muted', m ? '1' : '0'); if (audio.master) audio.master.gain.value = m ? 0 : MASTER_VOL; $('btnMute').textContent = m ? '🔇' : '🔊'; if (m && window.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {} }

/* =====================================================================
   FAHRZEUGE
   ===================================================================== */
class Vehicle {
  constructor(opts) {
    this.id = opts.id; this.name = opts.name; this.vi = ((opts.vi | 0) % TRUCKS.length + TRUCKS.length) % TRUCKS.length; this.isLocal = !!opts.isLocal; this.isAI = !!opts.isAI; this.remote = !!opts.remote;
    this.variant = TRUCKS[this.vi]; this.stats = statsOf(this.variant);
    this.x = 0; this.z = 0; this.h = 0; this.speed = 0; this.steer = 0; this.steerVis = 0;
    this.idx = -1; this.lap = 0; this.armed = true; this.prog = 0; this.lapStart = 0; this.lapTimes = []; this.best = Infinity;
    this.finished = false; this.finishTime = 0; this.spinT = 0; this.invulnT = 0; this.ammo = 1; this.fireCD = 2 + Math.random() * 3;
    this.wrongT = 0; this.offroad = false; this.draft = false; this.crashCD = 0;
    this.strikes = 0; this.blitzLap = -1; this.dsq = false; this.dsqT = 0; this.careful = Math.random() < 0.85;
    this.mesh = makeTruck(this.vi); scene.add(this.mesh);
    if (!this.isLocal) { this.tag = nameTagSprite(this.name, this.remote ? '#00c2e8' : '#E20074'); this.tag.position.y = 4.6; this.mesh.add(this.tag); }
    this.buf = []; // Snapshots für Remote-Interpolation
    this.skill = opts.skill || 0.9; this.lane = (Math.random() - 0.5) * 6; this.lanePh = Math.random() * 6;
  }
  get out() { return this.finished || this.dsq || this.left; }
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
      // Blitzer passiert? (vorwärts über den Index des Blitzers)
      const bz = world.blitz;
      if (bz && !this.remote && !this.finished && !this.dsq) {
        const step = (this.idx - prev + N) % N, d = (bz.idx - prev + N) % N;
        if (step < N / 2 && d < step && d >= 0) {
          if (this.isAI && !race.mp) this.careful = Math.random() < 0.85; // neue Runde, neues Glück
          if (Math.abs(this.speed) * 3.6 > 120 && this.blitzLap !== this.lap && race.state === 'run') { this.blitzLap = this.lap; onBlitz(this); }
        }
      }
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
  hit() {
    if (this.invulnT > 0 || this.dsq) return false;
    this.spinT = 1.1; this.invulnT = 2.6; this.speed *= 0.25;
    return true;
  }
  physics(dt, inp) {
    const st = this.stats;
    if (this.crashCD > 0) this.crashCD -= dt;
    if (this.dsq) { this.speed *= Math.pow(0.05, dt); inp = { gas: 0, brake: 0, steer: 0 }; }
    if (this.spinT > 0) { this.spinT -= dt; inp = { gas: 0, brake: 0, steer: 0 }; this.speed *= Math.pow(0.4, dt); }
    if (this.invulnT > 0) this.invulnT -= dt;
    const i = this.idx < 0 ? 0 : this.idx;
    const lat = lateral(i, this.x, this.z);
    this.offroad = Math.abs(lat) > HW + 1.3;
    const top = st.top * (this.offroad ? 0.55 : 1) * (this.draft ? 1.08 : 1) * (this.isAI ? this.skill * race.aiBoost(this) : 1);
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
    const i2 = nearestIdx(this.x, this.z, this.idx), lat2 = lateral(i2, this.x, this.z);
    if (Math.abs(lat2) > WALL) {
      const l = track.left[i2], push = (Math.abs(lat2) - WALL) * Math.sign(lat2);
      this.x -= l.x * push; this.z -= l.z * push; this.speed *= 0.82;
      const t = track.tan[i2], th = Math.atan2(t.x, t.z), d = wrapAng(th - this.h);
      if (Math.abs(d) < Math.PI / 2) this.h += d * 0.08;
      if (this.isLocal && sp > 8 && Math.random() < 0.2) sfx.bump();
    }
    this.updateProgress(false);
    const t = track.tan[this.idx], fwd = Math.sin(this.h) * t.x + Math.cos(this.h) * t.z;
    this.wrongT = (fwd < -0.3 && this.speed > 3) ? this.wrongT + dt : 0;
  }
  aiInput(dt) {
    const N = track.N, look = Math.floor(8 + Math.abs(this.speed) * 0.35);
    const ti = (this.idx + look) % N, p = track.pts[ti], l = track.left[ti];
    this.lanePh += dt * 0.4;
    // Ausweichen: Truck direkt voraus -> Spur wechseln
    for (const o of race.vehicles) {
      if (o === this || o.out) continue;
      const dx = o.x - this.x, dz = o.z - this.z, fwd = dx * Math.sin(this.h) + dz * Math.cos(this.h);
      const side = dx * Math.cos(this.h) - dz * Math.sin(this.h);
      if (fwd > 0 && fwd < 16 && Math.abs(side) < 3.2 && this.speed > o.speed - 2) { this.lane += (side > 0 ? -1 : 1) * dt * 9; }
    }
    this.lane = clamp(this.lane, -HW + 2, HW - 2);
    const lane = clamp(this.lane + Math.sin(this.lanePh) * 1.5, -HW + 2, HW - 2);
    const tx = p.x + l.x * lane, tz = p.z + l.z * lane;
    const want = Math.atan2(tx - this.x, tz - this.z), d = wrapAng(want - this.h);
    const a = track.tan[this.idx], b = track.tan[(this.idx + 18) % N];
    const curv = Math.abs(a.x * b.z - a.z * b.x);
    let slow = curv > 0.5 && this.speed > this.stats.top * 0.7;
    let brake = slow && Math.random() < 0.25;
    // vor dem Blitzer meistens abbremsen
    const bz = world.blitz;
    if (bz && this.careful && !this.isLocal) {
      const toB = (bz.idx - this.idx + N) % N;
      if (toB < 60 && this.speed > 31) { slow = true; brake = this.speed > 32.5; }
    }
    return { gas: !slow || Math.random() < 0.3 ? 1 : 0, brake: brake ? 1 : 0, steer: clamp(-d * 2.4, -1, 1) };
  }
  render(dt) {
    let spin = 0;
    if (this.spinT > 0) spin = (1 - this.spinT / 1.1) * Math.PI * 4;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.h + spin;
    this.steerVis += (-this.steer - this.steerVis) * Math.min(1, dt * 10);
    animateTruck(this.mesh, this.speed, this.steerVis, dt, this.h);
    const body = this.mesh.userData.body;
    body.rotation.z = lerp(body.rotation.z, -this.steer * Math.min(1, Math.abs(this.speed) / 25) * 0.05, 0.2);
    body.position.y = this.offroad ? Math.sin(performance.now() * 0.03) * 0.04 : 0;
    if (this.dsq) {
      // disqualifiziert: anhalten, absinken und verschwinden
      this.dsqT += dt; const k = clamp(1 - this.dsqT / 2.2, 0, 1);
      this.mesh.position.y = -(1 - k) * 2.5; this.mesh.scale.setScalar(0.4 + 0.6 * k);
      this.mesh.visible = k > 0 && Math.floor(performance.now() / 120) % 2 === 0;
      return;
    }
    // weit entfernte Trucks (im Nebel) gar nicht erst zeichnen
    const far = !this.isLocal && (this.x - camera.position.x) ** 2 + (this.z - camera.position.z) ** 2 > (scene.fog.far * 0.92) ** 2;
    this.mesh.visible = !far && !this.left && !(this.invulnT > 0 && this.spinT <= 0 && Math.floor(performance.now() / 90) % 2 === 0);
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
      if (v.id === q.owner || v.invulnT > 0 || v.out) continue;
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
      if (v.id === q.owner || v.out) continue;
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
        else if (q.owner === race.me.id) { toast('TREFFER! ' + hitV.name + ' hat unterschrieben!'); sfx.hit(); countMyHit(); }
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
  if (v.aboard || v.flap) {
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
const AI_NAMES = ['KUPFER-KARL', 'FUNKLOCH-FRANZI', 'DSL-DIETER', 'KOAX-KLAUS', 'MODEM-MONI', 'ISDN-INGE', 'BANDBREITE-BERND', 'LATENZ-LOTTE', 'PING-PAUL', 'ROUTER-RUDI'];
const SOLO_AI = clamp(parseInt(PARAMS.get('ai') || '6', 10) || 6, 0, 7);
const race = {
  active: false, mp: false, vehicles: [], me: null, myHits: 0, reported: false, countedHits: new Set(), state: 'idle', time: 0, goAt: 0, cdShown: -1, finishedAt: 0, rid: null,
  aiBoost(v) { const me = this.me; if (!me) return 1; const d = me.prog - v.prog; return d > 40 ? 1.08 : d < -70 ? 0.92 : 1; }
};
let shakeT = 0, camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), lastNet = 0, resultShown = false;
function clearRace() {
  for (const v of race.vehicles) v.dispose();
  for (const q of projectiles.slice()) removeProjectile(q.id);
  race.vehicles = []; race.me = null; race.active = false; race.state = 'idle'; resultShown = false; race.myHits = 0; race.reported = false; race.countedHits = new Set();
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
  const mySlot = Math.min(SOLO_AI, 4);
  initVehicle(me, mySlot); race.me = me;
  const names = AI_NAMES.slice().sort(() => Math.random() - 0.5);
  for (let k = 0, slot = 0; k < SOLO_AI; k++, slot++) {
    if (slot === mySlot) slot++;
    const v = new Vehicle({ id: 'ai' + k, name: names[k], vi: Math.floor(Math.random() * TRUCKS.length), isAI: true, skill: 0.87 + Math.random() * 0.09 });
    initVehicle(v, slot);
  }
  beginCountdown(3200);
}
function beginCountdown(ms) {
  race.active = true; race.state = 'countdown'; race.goAt = performance.now() + ms; race.time = 0; race.cdShown = -1;
  Radio.next = performance.now() + 15000; Radio.pending = false; normanNext = 0; setEngineClass(race.me ? race.me.variant.snd : 'diesel'); updateBlitzHud();
  for (const v of race.vehicles) { v.lapStart = 0; }
  snapCamera(); updateItemHud();
  showScreen(null); $('hud').classList.remove('hidden'); if (isTouch || PARAMS.has('touchui')) $('touch').classList.remove('hidden');
  $('countdown').classList.remove('hidden');
  checkRotate();
}
// Senderate an Spielerzahl anpassen (Supabase-Realtime-Kontingent: jede Nachricht wird an alle verteilt)
function netHz() { const n = race.vehicles.filter(v => !v.isAI && !v.left).length; return n <= 2 ? NET_HZ : n <= 4 ? 8 : 5; }
function racingOrder() {
  return race.vehicles.slice().filter(v => !v.left).sort((a, b) => {
    if (a.dsq !== b.dsq) return a.dsq ? 1 : -1;
    if (a.dsq && b.dsq) return b.prog - a.prog;
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
    reportOwnResult(pos === 1);
    if (race.mp) { const fp = { i: v.id, n: v.name, t: Math.round(v.finishTime), b: isFinite(v.best) ? Math.round(v.best) : null }; for (const ms of [0, 900, 2500, 5000]) setTimeout(() => { if (race.active) Net.send('fin', fp); }, ms); }
    setTimeout(showResults, 1600);
  }
}
function showResults() {
  resultShown = true;
  renderResults();
  showScreen('scr-result');
  $('touch').classList.add('hidden'); resetTouch();
  $('btnAgain').textContent = race.mp ? '👥 ZUR LOBBY' : '🔁 NOCHMAL';
  if (race.mp) scheduleLobbyReturn();
}
// Multiplayer: nach dem Rennen automatisch zurück in die Lobby –
// sobald alle im Ziel/DSQ/ausgestiegen sind (mind. 6 s Ergebnis), spätestens nach 25 s
let lobbyReturnTimer = 0;
function scheduleLobbyReturn() {
  clearInterval(lobbyReturnTimer);
  const rid = race.rid, t0 = performance.now();
  const tick = () => {
    if (!race.active || !race.mp || race.rid !== rid || curScreen !== 'scr-result') { clearInterval(lobbyReturnTimer); $('resAuto').textContent = ''; return; }
    const el = (performance.now() - t0) / 1000;
    const allDone = race.vehicles.every(v => v.finished || v.dsq || v.left);
    const left = Math.ceil(allDone ? Math.max(0, 6 - el) : Math.max(0, 25 - el));
    $('resAuto').textContent = allDone ? 'Zurück zur Lobby in ' + left + ' s …' : 'Warte auf die anderen Fahrer … (Lobby in ' + left + ' s)';
    if (left <= 0) { clearInterval(lobbyReturnTimer); $('resAuto').textContent = ''; quitRace(); }
  };
  tick(); lobbyReturnTimer = setInterval(tick, 500);
}
function renderResults() {
  const order = racingOrder();
  const me = race.me;
  const pos = order.indexOf(me) + 1;
  $('resTitle').textContent = me && me.dsq ? '🚫 DISQUALIFIZIERT' : me && me.finished ? (pos === 1 ? '🏆 SIEG!' : 'PLATZ ' + pos) : 'ERGEBNIS';
  $('resSub').textContent = (me && isFinite(me.best) ? 'Beste Runde: ' + fmtTime(me.best) + ' · ' : '') + (race.mp ? 'Multiplayer-Rennen' : 'Solo gegen KI');
  const rows = order.map((v, k) => `<tr class="${v.isLocal ? 'me' : ''}${v.dsq ? ' dsq' : ''}"><td>${v.dsq ? '–' : (k + 1) + '.'}</td><td>${escapeHtml(v.name)}${v.isAI ? ' <small>🤖</small>' : ''}${v.strikes && !v.dsq ? ' <small>📸' + v.strikes + '</small>' : ''}</td><td class="t">${v.dsq ? 'DSQ (' + BLITZ_MAX + 'x geblitzt)' : v.finished ? fmtTime(v.finishTime) : 'unterwegs… R' + Math.max(1, Math.min(LAPS, v.lap))}</td></tr>`);
  for (const v of race.vehicles.filter(v => v.left)) rows.push(`<tr><td>–</td><td>${escapeHtml(v.name)}</td><td class="t">ausgestiegen</td></tr>`);
  $('resTable').innerHTML = rows.join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function localInput() {
  if (AUTODRIVE || (race.me && race.me.finished)) return race.me.aiInput(1 / 60);
  if (race.me && race.me.dsq) return { gas: 0, brake: 1, steer: 0 };
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
  // Kollisionen: zwei Kreise pro Fahrzeug (vorn/hinten), Auseinanderdrücken + Crash
  const vs = race.vehicles;
  for (const v of vs) if (!v.remote) v.draft = false;
  for (let a = 0; a < vs.length; a++) for (let b = a + 1; b < vs.length; b++) {
    const A = vs[a], B = vs[b]; if (A.left || B.left || A.dsq || B.dsq) continue;
    const cdx = B.x - A.x, cdz = B.z - A.z, cd = Math.hypot(cdx, cdz);
    if (cd > 18) continue;
    // Windschatten
    for (const [P, Q] of [[A, B], [B, A]]) {
      if (P.remote || P.speed < 20) continue;
      const dx = Q.x - P.x, dz = Q.z - P.z, f = dx * Math.sin(P.h) + dz * Math.cos(P.h), s = dx * Math.cos(P.h) - dz * Math.sin(P.h);
      if (f > 4 && f < 16 && Math.abs(s) < 2.4) P.draft = true;
    }
    let pen = 0, nx = 0, nz = 0;
    const sa = Math.sin(A.h), ca = Math.cos(A.h), sb = Math.sin(B.h), cb = Math.cos(B.h);
    for (const oa of [1.6, -1.6]) for (const ob of [1.6, -1.6]) {
      const dx = (B.x + sb * ob) - (A.x + sa * oa), dz = (B.z + cb * ob) - (A.z + ca * oa), d = Math.hypot(dx, dz), p = 2.7 - d;
      if (p > pen && d > 0.001) { pen = p; nx = dx / d; nz = dz / d; }
    }
    if (pen > 0) {
      const aMov = !A.remote, bMov = !B.remote;
      const fa = aMov && bMov ? 0.5 : aMov ? 1 : 0, fb = aMov && bMov ? 0.5 : bMov ? 1 : 0;
      A.x -= nx * pen * fa; A.z -= nz * pen * fa; B.x += nx * pen * fb; B.z += nz * pen * fb;
      const rv = Math.hypot(sa * A.speed - sb * B.speed, ca * A.speed - cb * B.speed);
      if (rv > 3.5 && A.crashCD <= 0 && B.crashCD <= 0 && race.time > 3000) onCrash(A, B);
      else { if (aMov) A.speed *= 0.97; if (bMov) B.speed *= 0.97; }
    } else if (me && (A === me || B === me) && cd < 6 && hornCD <= 0) {
      const o = A === me ? B : A, rv = Math.abs(me.speed - o.speed);
      if (me.speed > 15 && rv > 6) { sfx.horn(); hornCD = 4; }
    }
  }
  if (hornCD > 0) hornCD -= dt;
  // Norman ruft an (ab 150 km/h, höchstens alle 15 s)
  if (me && !me.out && Math.abs(me.speed) * 3.6 >= 150 && now > normanNext) { showNorman(); normanNext = now + 18000; }
  checkPoliceRadio(now);
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
  if (race.mp && me && now - lastNet > 1000 / netHz()) {
    lastNet = now;
    Net.send('st', { i: me.id, x: +me.x.toFixed(2), z: +me.z.toFixed(2), h: +me.h.toFixed(3), s: +me.speed.toFixed(1), p: me.prog, l: me.lap, sp: +Math.max(0, me.spinT).toFixed(2), f: me.finished ? 1 : 0, ft: me.finished ? Math.round(me.finishTime) : 0, b: me.strikes, q: me.dsq ? 1 : 0 });
  }
  if (resultShown && Math.floor(now / 500) !== Math.floor((now - dt * 1000) / 500)) renderResults();
}
function aiFire(v, dt) {
  v.fireCD -= dt;
  if (v.ammo <= 0 || v.fireCD > 0 || v.spinT > 0 || v.dsq) return;
  for (const o of race.vehicles) {
    if (o === v || o.invulnT > 0 || o.out) continue;
    const dx = o.x - v.x, dz = o.z - v.z, d = Math.hypot(dx, dz);
    if (d < 8 || d > 42) continue;
    if (Math.abs(wrapAng(Math.atan2(dx, dz) - v.h)) < 0.22) { fireFrom(v); v.fireCD = 4 + Math.random() * 5; return; }
  }
}
Vehicle.prototype.interp = function (now) {
  const b = this.buf; if (!b.length) return;
  const rt = now - Math.round(1700 / netHz());
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
  const co = window.__camOverride; if (co) { camera.position.set(co[0], co[1], co[2]); camera.lookAt(co[3], co[4], co[5]); return; }
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
  const kmh = Math.round(Math.abs(me.speed) * 3.6); setText('hudSpeed', kmh + ' ');
  const fast = kmh >= 150; if (hudCache.fast !== fast) { hudCache.fast = fast; $('hudSpeed').classList.toggle('fast', fast); }
  $('wrongWay').classList.toggle('hidden', me.wrongT < 1 || me.out);
  $('hudDraft').classList.toggle('hidden', !me.draft);
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

/* Crash, Blitzer, Norman */
let hornCD = 0, normanNext = 0, normanTimer = 0;
function onCrash(A, B) {
  A.crashCD = B.crashCD = 1.2;
  const near = A.isLocal || B.isLocal || distToLocal(A) < 70;
  if (near) sfx.crash();
  if (A.isLocal || B.isLocal) shakeT = 0.6;
  burst((A.x + B.x) / 2, (A.z + B.z) / 2);
  for (const [P, Q] of [[A, B], [B, A]]) {
    if (P.remote) continue; // fremde Clients entscheiden selbst
    if (P.hit()) {
      if (P.isLocal) { toast('💥 Crash mit ' + Q.name + '!', 1800); window.__crashes = (window.__crashes || 0) + 1; }
    }
    if (race.mp && P.isLocal && Q.remote) Net.send('crash', { a: P.id, an: P.name, b: Q.id });
  }
}
function onRemoteCrash(p) {
  const me = race.me; if (!me || p.b !== me.id) return;
  const o = race.vehicles.find(v => v.id === p.a);
  me.crashCD = 1.2;
  if (me.hit()) { sfx.crash(); shakeT = 0.6; toast('💥 Crash mit ' + (p.an || (o && o.name) || '?') + '!', 1800); window.__crashes = (window.__crashes || 0) + 1; }
}
function flashBlitzer() {
  const bz = world.blitz; if (!bz) return;
  bz.flashM.color.setHex(0xffffff); setTimeout(() => bz.flashM.color.setHex(0x552222), 160);
}
const BLITZ_MAX = 2; // Disqualifikation nach 2x geblitzt
function onBlitz(v) {
  v.strikes++;
  flashBlitzer();
  if (v.isLocal) {
    sfx.blitz();
    const f = $('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    toast('📸 GEBLITZT! (' + v.strikes + '/' + BLITZ_MAX + ')', 2000); updateBlitzHud();
    if (race.mp) Net.send('bl', { i: v.id, n: v.strikes });
  } else if (distToLocal(v) < 90) sfx.blitz();
  if (v.strikes >= BLITZ_MAX) disqualify(v);
}
function disqualify(v) {
  if (v.dsq) return;
  v.dsq = true; v.dsqT = 0; v.strikes = Math.max(BLITZ_MAX, v.strikes);
  if (v.isLocal) {
    sfx.dsq(); toast('🚫 Disqualifiziert – ' + BLITZ_MAX + 'x geblitzt!', 3200); updateBlitzHud();
    reportOwnResult(false);
    if (race.mp) Net.send('dsq', { i: v.id, n: v.name });
    setTimeout(() => { if (race.active && race.me === v) showResults(); }, 2600);
  } else toast('🚫 ' + v.name + ' disqualifiziert – ' + BLITZ_MAX + 'x geblitzt!', 2000);
  if (resultShown) renderResults();
}
function updateBlitzHud() {
  const me = race.me, n = me ? me.strikes : 0;
  const el = $('hudBlitz'); el.textContent = '📸 ' + n + '/' + BLITZ_MAX; el.classList.toggle('warn', n >= BLITZ_MAX - 1);
}
function showNorman() {
  if (Radio.active) { normanQueued = true; return; }   // nicht über den Polizeifunk
  duckMusic(3.6);
  const el = $('norman');
  el.classList.remove('hidden'); void el.offsetWidth; el.classList.add('show');
  sfx.ring(); window.__norman = (window.__norman || 0) + 1;
  clearTimeout(normanTimer);
  normanTimer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.classList.add('hidden'); if (Radio.pending) policeRadio(); }, 500); }, 3200);
}

/* =====================================================================
   METROPOLE, LANDSTRASSE, STRASSENLATERNEN, HIMMEL & TAGESZEIT
   – alles mit zusammengeführter Geometrie / InstancedMesh (wenige Draw Calls)
   ===================================================================== */
function isCity(x, z) { return x > 58 && x < 460 && z > -200 && z < 360; }
const TRACK_C = { x: 30, z: 100 };
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------- Fassaden-Texturen (8x8 Fenster pro Kachel = 24 m x 24 m) ----------
function facadeTextures(kind, seed) {
  const r = rng(seed), S = 256, C = 32;
  const c = canvas(S, S), g = c.getContext('2d'), e = canvas(S, S), ge = e.getContext('2d');
  const bg = { office: '#c9ccd2', glass: '#24435f', dark: '#3b3f48', warm: '#d8c6ae' }[kind];
  g.fillStyle = bg; g.fillRect(0, 0, S, S); ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const x = col * C, y = row * C;
    let wx = x + 5, wy = y + 7, ww = C - 10, wh = C - 13;
    if (kind === 'glass') { wx = x + 1; wy = y + 2; ww = C - 2; wh = C - 4; }
    const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
    if (kind === 'glass') { gr.addColorStop(0, '#5f8fb8'); gr.addColorStop(1, '#2b5276'); }
    else { gr.addColorStop(0, '#5d7896'); gr.addColorStop(1, '#2c3c52'); }
    g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
    if (kind !== 'glass') { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(wx, wy, ww, 2); }
    const lit = r() < (kind === 'glass' ? 0.5 : 0.6);
    if (lit) {
      const cols = kind === 'glass' ? ['#dff0ff', '#bfe0ff', '#fff6dc'] : ['#ffd88a', '#ffe9b8', '#fff3d6', '#ffc070'];
      ge.fillStyle = cols[Math.floor(r() * cols.length)]; ge.globalAlpha = 0.65 + r() * 0.35;
      ge.fillRect(wx + 1, wy + 1, ww - 2, wh - 2); ge.globalAlpha = 1;
      if (r() < 0.25) { ge.fillStyle = 'rgba(0,0,0,.55)'; ge.fillRect(wx + ww * 0.5, wy + 1, ww * 0.5 - 1, wh - 2); } // halb zugezogener Vorhang
    }
  }
  if (kind === 'glass') { g.fillStyle = 'rgba(200,220,240,.55)'; for (let k = 0; k <= 8; k++) { g.fillRect(k * C - 1, 0, 2, S); g.fillRect(0, k * C - 1, S, 2); } }
  else { g.fillStyle = 'rgba(0,0,0,.10)'; for (let k = 0; k <= 8; k++) g.fillRect(0, k * C, S, 3); }
  const t1 = tex(c, { repeat: [1, 1] }), t2 = tex(e, { repeat: [1, 1] });
  t1.anisotropy = t2.anisotropy = 4;
  return { map: t1, emi: t2 };
}
// ---------- Geometrie-Batch (zusammengeführte Quader) ----------
function GeoBatch() { return { pos: [], nor: [], uv: [], idx: [] }; }
function batchQuad(B, a, b, c, d, n, uvs) {
  const o = B.pos.length / 3;
  for (const p of [a, b, c, d]) B.pos.push(p[0], p[1], p[2]);
  for (let k = 0; k < 4; k++) B.nor.push(n[0], n[1], n[2]);
  B.uv.push(...uvs); B.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
}
// Gebäude: 4 Seiten (Fenster-UV in Metern / tile) + Dach in eigenen Batch
function batchBuilding(B, R, x, z, rot, w, d, h, tile, u0, y0 = 0) {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const T = (lx, y, lz) => [x + lx * cs + lz * sn, y, z - lx * sn + lz * cs];
  const N_ = (nx, nz) => [nx * cs + nz * sn, 0, -nx * sn + nz * cs];
  const hw = w / 2, hd = d / 2, v0 = y0 / tile, v1 = (y0 + h) / tile;
  const faces = [[0, 1, hw, hd, w], [1, 0, hd, hw, d], [0, -1, hw, hd, w], [-1, 0, hd, hw, d]];
  let u = u0;
  for (const [nx, nz, he, hn, L] of faces) {
    const rx = nz, rz = -nx; // rechts = up x n
    const cx = nx * hn, cz = nz * hn;
    const A = T(cx - rx * he, y0, cz - rz * he), Bp = T(cx + rx * he, y0, cz + rz * he), Cp = T(cx + rx * he, y0 + h, cz + rz * he), D = T(cx - rx * he, y0 + h, cz - rz * he);
    const u1 = u + L / tile;
    batchQuad(B, A, Bp, Cp, D, N_(nx, nz), [u, v0, u1, v0, u1, v1, u, v1]); u = u1 + 0.37;
  }
  if (R) batchQuad(R, T(-hw, y0 + h, -hd), T(-hw, y0 + h, hd), T(hw, y0 + h, hd), T(hw, y0 + h, -hd), [0, 1, 0], [0, 0, 0, 1, 1, 1, 1, 0]);
}
function batchMesh(B, mat) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  geo.setIndex(B.idx); geo.computeBoundingSphere();
  return new THREE.Mesh(geo, mat);
}
// ---------- HEKO-Logo (assets/heko-logo.svg von heko-bs.de) als beleuchtete Tafel ----------
function hekoSignMat() {
  const c = canvas(1024, 368), g = c.getContext('2d');
  const panel = () => {
    g.clearRect(0, 0, 1024, 368);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 368);
    g.fillStyle = '#262455'; g.fillRect(0, 0, 1024, 14); g.fillRect(0, 354, 1024, 14);
    g.fillStyle = '#009fe3'; g.fillRect(0, 14, 1024, 6); g.fillRect(0, 348, 1024, 6);
  };
  panel();
  // Ersatz, falls das SVG nicht lädt: Nachbau in den Markenfarben
  g.fillStyle = '#262455'; g.font = '900 230px "Arial Black",Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HEKO', 512, 190);
  const t = tex(c); t.anisotropy = 4;
  const img = new Image();
  img.onload = () => { panel(); const w = 860, h = w * 101.83 / 414.88; g.drawImage(img, (1024 - w) / 2, (368 - h) / 2, w, h); t.needsUpdate = true; window.__hekoLogo = 'svg'; };
  img.onerror = () => { window.__hekoLogo = 'fallback'; };
  img.src = 'assets/heko-logo.svg';
  const m = new THREE.MeshLambertMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.15, side: THREE.FrontSide, fog: false });
  return m;
}
// ---------- Werbetafeln ----------
function adTexture(k) {
  const c = canvas(1024, 448), g = c.getContext('2d');
  const W = 1024, H = 448;
  const font = (s, w = 'bold') => `${w} ${s}px "Trebuchet MS",Arial,sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (k === 0) {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#E20074'); gr.addColorStop(1, '#7a003f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(-50, 330 + i * 6); g.bezierCurveTo(300, 200 + i * 9, 600, 420 - i * 5, 1100, 120 + i * 11); g.stroke(); }
    drawT(g, 130, 150, 150); g.fillStyle = '#fff'; g.font = font(130); g.fillText('GLASFASER', 600, 150);
    g.font = font(54, '600'); g.fillText('Bis zu 1000 MBit/s · Jetzt verfügbar', W / 2, 330);
  } else if (k === 1) {
    g.fillStyle = '#111018'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#E20074'; g.font = font(150); g.fillText('MagentaTV', W / 2, 180);
    g.fillStyle = '#fff'; g.font = font(58, '600'); g.fillText('Alles. Überall. In 4K über Glasfaser.', W / 2, 330);
  } else if (k === 2) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = '#E20074'; g.fillRect(0, 0, W, 90); g.fillRect(0, H - 60, W, 60);
    drawT(g, 90, 45, 60); g.fillStyle = '#fff'; g.font = font(48); g.fillText('HIGHSPEED VOR ORT', 560, 47);
    g.fillStyle = '#E20074'; g.font = font(110); g.fillText('highspeedvorort.de', W / 2, 210);
    g.fillStyle = '#333'; g.font = font(60, '600'); g.fillText('Tel. 0800 / 482 00 10', W / 2, 320);
  } else if (k === 3) {
    g.fillStyle = '#ffd500'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#111'; g.font = font(64); g.fillText('📞 NORMAN SAGT:', W / 2, 90);
    g.font = font(150); g.fillText('MAX. 150!', W / 2, 225);
    g.font = font(50, '600'); g.fillText('Der Vermieter hört mit.', W / 2, 360);
  } else {
    g.fillStyle = '#E20074'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(40, 40, W - 80, H - 80);
    g.fillStyle = '#E20074'; g.font = font(92); g.fillText('HA-ONLY VERTRAG', W / 2, 150);
    g.fillStyle = '#222'; g.font = font(58, '600'); g.fillText('Jetzt unterschreiben – schneller', W / 2, 270); g.fillText('als die Konkurrenz!', W / 2, 340);
  }
  return tex(c);
}
function radialTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,.35)') {
  const c = canvas(128, 128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c);
}
function beamTexture() {
  const c = canvas(128, 256), g = c.getContext('2d');
  for (let y = 0; y < 256; y++) {
    const t = y / 255, half = 18 + t * 46, a = Math.pow(1 - t, 1.6) * 0.95;
    const gr = g.createLinearGradient(64 - half, 0, 64 + half, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(64 - half, 255 - y, half * 2, 1);
  }
  return tex(c);
}
function concreteTexture() {
  const c = canvas(256, 256), g = c.getContext('2d'), r = rng(77);
  g.fillStyle = '#8f9399'; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 2500; k++) { const v = 120 + r() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.25)`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  g.fillStyle = 'rgba(60,62,66,.5)'; for (let k = 0; k <= 4; k++) { g.fillRect(k * 64, 0, 2, 256); g.fillRect(0, k * 64, 256, 2); }
  return tex(c, { repeat: [90, 90] });
}
function fieldTexture(kind) {
  const c = canvas(128, 128), g = c.getContext('2d');
  const [a, b] = [['#d8b84a', '#c9a53c'], ['#5f9a3c', '#4f8a32'], ['#7a5a3a', '#6a4c30'], ['#b9c94a', '#a5b63c']][kind];
  g.fillStyle = a; g.fillRect(0, 0, 128, 128); g.fillStyle = b; for (let y = 0; y < 128; y += 8) g.fillRect(0, y, 128, 4);
  return tex(c, { repeat: [1, 1] });
}

// =====================================================================
const TOD_MATS = { windows: [], skyline: [], lampHead: null, pool: null, cone: null, ads: [], beam: null, aviation: null, traffic: [] };
function buildCityAndLights(group, placed, freeAt, along, r) {
  const N = track.N;
  // --- Stadtboden (Beton) ---
  {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 560).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: concreteTexture(), polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 }));
    g.position.set(58 + 200, -0.025, -200 + 280); g.renderOrder = -1; group.add(g);
    // Beton-Muster passend zur Stadtfläche (90x90 Wiederholung)
    g.material.map.repeat.set(400 / 6, 560 / 6);
  }
  const cityIdx = [];
  for (let i = 0; i < N; i++) { const p = track.pts[i]; if (isCity(p.x, p.z)) cityIdx.push(i); }
  // --- Hochstraße / Brücke über die Strecke ---
  {
    const curv = i => { const a = track.tan[(i + N) % N], c = track.tan[(i + 8) % N]; return Math.abs(a.x * c.z - a.z * c.x); };
    let bi = -1;
    let bc = 1e9;
    for (const i of cityIdx) { if (i < N * 0.1 || i > N * 0.5) continue; const c = curv(i - 12) + curv(i - 4) + curv(i + 4); if (c < bc) { bc = c; bi = i; } }
    if (bi >= 0) {
      const p = track.pts[bi], l = track.left[bi], rot = Math.atan2(track.tan[bi].x, track.tan[bi].z);
      const g = new THREE.Group();
      const conc = lam(0xb9bcc2), dk = lam(0x55585f);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(140, 1.3, 10), conc); deck.position.y = 9.2; g.add(deck);
      const asph = new THREE.Mesh(new THREE.BoxGeometry(140, 0.08, 8.6), dk); asph.position.y = 9.9; g.add(asph);
      for (const s of [1, -1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(140, 1.0, 0.3), conc); rail.position.set(0, 10.4, s * 4.85); g.add(rail); }
      const signM = new THREE.MeshLambertMaterial({ map: signTexture(['GLASFASER-AUTOBAHN', 'Schnell. Stabil. Zukunftssicher.'], '#E20074', '#fff', 1024, 128), emissive: 0xffffff, emissiveIntensity: 0.2 });
      signM.emissiveMap = signM.map; TOD_MATS.ads.push(signM);
      for (const s of [1, -1]) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(2 * HW + 4, 2.1), signM); sg.position.set(0, 9.1, s * 5.06); if (s < 0) sg.rotation.y = Math.PI; g.add(sg); }
      const pil = new THREE.CylinderGeometry(0.9, 1.1, 8.6, 10);
      for (const lat of [HW + 8.5, -(HW + 8.5), 40, -40, 68, -68]) { const m = new THREE.Mesh(pil, conc); m.position.set(lat, 4.3, 0); g.add(m); placed.push({ x: p.x + l.x * lat, z: p.z + l.z * lat, r: 1.6 }); }
      g.position.set(p.x, 0, p.z); g.rotation.y = rot; group.add(g); // lokales x = Querrichtung (links)
      // Platz entlang der Brücke freihalten (keine Gebäude hinein), Fahrbahn selbst bleibt frei
      for (let lat = HW + 12; lat <= 72; lat += 8) for (const sg of [1, -1]) placed.push({ x: p.x + l.x * lat * sg, z: p.z + l.z * lat * sg, r: 7 });
      window.__overpass = bi;
    }
  }
  // --- Gebäude ---
  const kinds = ['office', 'glass', 'dark', 'warm'];
  const fac = kinds.map((k, n) => facadeTextures(k, 100 + n));
  const facMats = fac.map((t, n) => {
    const m = new THREE.MeshLambertMaterial({ map: t.map, emissiveMap: t.emi, emissive: 0xffffff, emissiveIntensity: 0 });
    TOD_MATS.windows.push(m); return m;
  });
  // Batches pro Material UND 110-m-Zelle: so greifen Frustum-Culling und Front-to-Back-Sortierung (weniger Overdraw)
  const cells = new Map();
  const cellOf = (kind, x, z) => { const key = kind + ':' + Math.floor(x / 110) + ':' + Math.floor(z / 110); let b = cells.get(key); if (!b) cells.set(key, b = { kind, B: GeoBatch() }); return b.B; };
  const roofB = GeoBatch();
  const aviation = [];
  const tileOf = k => k === 1 ? 20 : 24;
  function building(x, z, rot, w, d, h, kind) {
    batchBuilding(cellOf(kind, x, z), roofB, x, z, rot, w, d, h, tileOf(kind), Math.floor(r() * 8) / 8);
    // Sockel-Etage mit Ladenfront: etwas breiter, warm beleuchtet
    if (h > 18 && r() < 0.7) batchBuilding(cellOf(3, x, z), roofB, x, z, rot, w + 0.6, d + 0.6, 4.2, 8.4, Math.floor(r() * 8) / 8);
    // gestaffelte Hochhaus-Krone
    if (h > 55 && r() < 0.6) { const h2 = Math.max(2, Math.min(h * (0.18 + r() * 0.2), 76 - h)); batchBuilding(cellOf(kind, x, z), roofB, x, z, rot, w * 0.62, d * 0.62, h2, tileOf(kind), r(), h); h += h2; }
    if (h > 50) aviation.push([x, h + 1.6, z]);
    placed.push({ x, z, r: Math.max(w, d) * 0.62 });
    return h;
  }
  // 0) HEKO-Tower: höchstes Hochhaus der Stadt, nah an der Strecke, Logo als Leuchtreklame an der Krone
  {
    // Standort: in Verlängerung der Start-Geraden (man fährt direkt darauf zu), Sichtachse bleibt frei
    const i = cityIdx[0];
    if (i != null) {
      const W_ = 46, p0 = track.pts[i], t0 = track.tan[i];
      let x = 0, z = 0;
      for (let D = 160; D < 420; D += 10) {
        x = p0.x + t0.x * D; z = p0.z + t0.z * D;
        const q = track.pts[nearestIdx(x, z)]; if (Math.hypot(q.x - x, q.z - z) > HW + 40) break;
      }
      // etwas seitlich versetzt, damit das Logo nicht hinter der HUD-Mitte (Zeit/Item) verschwindet
      { const l0 = track.left[i]; for (const off of [-45, 45, -30, 30]) { const nx = x + l0.x * off, nz = z + l0.z * off, q = track.pts[nearestIdx(nx, nz)]; if (Math.hypot(q.x - nx, q.z - nz) > HW + 30) { x = nx; z = nz; window.__hekoOff = off; break; } } }
      const rot = Math.atan2(t0.x, t0.z);
      for (let s = 0; s < 1; s += 0.04) { const cx = lerp(p0.x - t0.x * 120, x, s), cz = lerp(p0.z - t0.z * 120, z, s); const q = track.pts[nearestIdx(cx, cz)]; if (Math.hypot(q.x - cx, q.z - cz) > HW + 4) placed.push({ x: cx, z: cz, r: 10 }); }
      const H_ = 78;
      batchBuilding(cellOf(1, x, z), roofB, x, z, rot, W_, W_, H_, 20, 0);
      batchBuilding(cellOf(3, x, z), roofB, x, z, rot, W_ + 0.8, W_ + 0.8, 5, 8.4, 0);
      const sw = W_ * 1.02, sh = sw * 0.36;
      // Krone: Leuchtkasten über dem Dach (Logo auf allen 4 Seiten) + Antenne
      batchBuilding(cellOf(2, x, z), roofB, x, z, rot, W_ - 1, W_ - 1, sh + 1.5, 24, 0, H_);
      batchBuilding(cellOf(2, x, z), roofB, x, z, rot, 0.8, 0.8, 26, 24, 0, H_ + sh + 1.5);
      aviation.push([x, H_ + sh + 28, z]);
      placed.push({ x, z, r: W_ * 0.62 });
      const sm = hekoSignMat(); TOD_MATS.ads.push(sm);
      const geo = new THREE.PlaneGeometry(sw, sh);
      const cs = Math.cos(rot), sn = Math.sin(rot);
      for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const m = new THREE.Mesh(geo, sm), o = (W_ - 1) / 2 + 0.3;
        const lx = nx * o, lz = nz * o;
        m.position.set(x + lx * cs + lz * sn, H_ + 1 + sh / 2, z - lx * sn + lz * cs);
        m.rotation.y = rot + Math.atan2(nx, nz); group.add(m);
      }
      window.__hekoTower = { i: (i - 60 + N) % N, x: +x.toFixed(1), z: +z.toFixed(1), h: H_ + sh };
    }
  }
  // 1) Straßenfront: Gebäude direkt am Gehweg
  for (let n = 0; n < cityIdx.length; n += 7) {
    const i = cityIdx[n];
    for (const side of [1, -1]) {
      if (r() < 0.12) continue;
      const w = 12 + r() * 9, d = 11 + r() * 8;
      const [x, z, rot] = along(i, side * (HW + 6.8 + d / 2));
      if (!isCity(x, z) || !freeAt(x, z, Math.max(w, d) * 0.5)) continue;
      const hi = r(); const h = hi < 0.55 ? 14 + r() * 18 : hi < 0.88 ? 26 + r() * 22 : 46 + r() * 18;
      building(x, z, rot, w, d, h, hi > 0.6 ? 1 : Math.floor(r() * 3) === 1 ? 2 : (r() < 0.5 ? 0 : 2));
    }
  }
  // 2) Blöcke im Raster dahinter (höher, je weiter von der Strecke)
  for (let gx = 66; gx < 452; gx += 23) for (let gz = -190; gz < 352; gz += 23) {
    const x = gx + (r() - 0.5) * 6, z = gz + (r() - 0.5) * 6;
    const w = 11 + r() * 8, d = 11 + r() * 8;
    { const p = track.pts[nearestIdx(x, z)]; if (Math.hypot(p.x - x, p.z - z) > 130) continue; } // weiter weg übernimmt die Skyline
    if (!freeAt(x, z, Math.max(w, d) * 0.55)) continue;
    const dc = Math.hypot(x - 175, z - 90);
    let h = (18 + r() * 40) * (1 + 1.6 * clamp(1 - dc / 260, 0, 1)) * (r() < 0.12 ? 1.8 : 1);
    { const p = track.pts[nearestIdx(x, z)], dt_ = Math.hypot(p.x - x, p.z - z); if (dt_ < 60) h = Math.min(h, 62); }
    building(x, z, 0, w, d, Math.min(h, 68), r() < 0.45 ? 1 : r() < 0.5 ? 0 : 2);
  }
  for (const { kind, B } of cells.values()) group.add(batchMesh(B, facMats[kind]));
  window.__cityCells = cells.size;
  group.add(batchMesh(roofB, lam(0x4a4d54)));
  // Flugwarnlichter
  if (aviation.length) {
    const avM = new THREE.MeshBasicMaterial({ color: 0xff2a2a }); TOD_MATS.aviation = avM;
    const av = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 6, 4), avM, aviation.length);
    const m4 = new THREE.Matrix4(); aviation.forEach(([x, y, z], k) => { m4.makeTranslation(x, y, z); av.setMatrixAt(k, m4); }); group.add(av);
  }
  // --- Skyline in der Ferne (Ring, Richtung Stadt dichter und höher) ---
  {
    const sk = [GeoBatch(), GeoBatch()], skR = GeoBatch();
    for (let k = 0; k < 210; k++) {
      const a = r() * Math.PI * 2, east = Math.cos(a); // +x = Stadtseite
      if (east < -0.2 && r() < 0.55) continue;
      const rad = 560 + r() * 160;
      const x = TRACK_C.x + Math.cos(a) * rad, z = TRACK_C.z + Math.sin(a) * rad;
      const h = (east > 0 ? 70 + r() * 190 * (0.5 + east * 0.5) : 30 + r() * 80);
      const w = 18 + r() * 26;
      batchBuilding(sk[r() < 0.5 ? 0 : 1], skR, x, z, a, w, w * (0.7 + r() * 0.5), h, 30, r());
    }
    const mk = n => { const m = new THREE.MeshLambertMaterial({ map: fac[n].map, emissiveMap: fac[n].emi, emissive: 0xffffff, emissiveIntensity: 0, fog: false, color: 0x9fb4cc }); TOD_MATS.skyline.push(m); return m; };
    group.add(batchMesh(sk[0], mk(0)), batchMesh(sk[1], mk(1)));
    const rm = new THREE.MeshLambertMaterial({ color: 0x5a6070, fog: false }); TOD_MATS.skyline.push(rm); rm.userData.roof = true;
    group.add(batchMesh(skR, rm));
  }
  // --- Werbetafeln (beleuchtet) ---
  const adMats = [0, 1, 2, 3, 4].map(k => { const t = adTexture(k); const m = new THREE.MeshLambertMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.15 }); TOD_MATS.ads.push(m); return m; });
  {
    const legG = new THREE.CylinderGeometry(0.25, 0.3, 6, 8), legM = lam(0x6a6e76), frameM = lam(0x2a2c30);
    let k = 0;
    for (let n = 10; n < cityIdx.length; n += Math.max(12, Math.floor(cityIdx.length / 7))) {
      const i = cityIdx[n], side = k % 2 ? 1 : -1;
      const [x, z, rot] = along(i, side * (HW + 9.5));
      if (!freeAt(x, z, 3)) { k++; continue; }
      const g = new THREE.Group();
      for (const s of [-3.5, 3.5]) g.add(at(new THREE.Mesh(legG, legM), [s, 3, 0]));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(12.6, 5.6, 0.35), frameM), [0, 8.6, -0.2]));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.25), adMats[k % adMats.length]); face.position.set(0, 8.6, 0); g.add(face);
      g.position.set(x, 0, z); g.rotation.y = rot + Math.PI - side * 0.45; group.add(g);
      placed.push({ x, z, r: 3 }); k++;
    }
    // Dach-Werbung auf Gebäuden direkt am Gehweg wäre teuer im Platzieren – stattdessen große Fassaden-Screens
    let s = 0;
    for (let n = 30; n < cityIdx.length && s < 5; n += 45) {
      const i = cityIdx[n], side = s % 2 ? -1 : 1;
      const [x, z, rot] = along(i, side * (HW + 6.6));
      const near = placed.find(q => Math.hypot(q.x - (x + track.left[i].x * side * 6), q.z - (z + track.left[i].z * side * 6)) < 4);
      if (!near) continue;
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(9, 4), adMats[(s + 2) % adMats.length]);
      screen.position.set(x, 9 + s % 2 * 4, z); screen.rotation.y = rot + (side > 0 ? -Math.PI / 2 : Math.PI / 2); group.add(screen); s++;
    }
  }
  // --- Straßenmöbel in der Stadt: Poller, Bänke, Mülleimer, Ampeln ---
  {
    const bol = [], ben = [], bin = [];
    for (let n = 0; n < cityIdx.length; n += 3) {
      const i = cityIdx[n];
      for (const side of [1, -1]) {
        bol.push(along(i, side * (HW + 1.7)));
        if (n % 27 === 0) ben.push(along(i + 1, side * (HW + 3.6)));
        if (n % 27 === 12) bin.push(along(i, side * (HW + 3.7)));
      }
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3(), ey = new THREE.Euler();
    const inst = (geo, mat, list, y) => { const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach(([x, z, rot], k) => { q.setFromEuler(ey.set(0, rot, 0)); m4.compose(pv.set(x, y, z), q, sc); im.setMatrixAt(k, m4); }); group.add(im); };
    inst(new THREE.CylinderGeometry(0.12, 0.14, 0.9, 6), lam(0x30333a), bol, 0.45);
    inst(new THREE.BoxGeometry(0.6, 0.5, 2.0), lam(0x7a5233), ben, 0.45);
    inst(new THREE.CylinderGeometry(0.32, 0.28, 0.9, 8), lam(MAGENTA), bin, 0.45);
    // Ampeln (nur Deko)
    const red = new THREE.MeshBasicMaterial({ color: 0xff3030 }), green = new THREE.MeshBasicMaterial({ color: 0x30ff70 }), off = lam(0x222222);
    TOD_MATS.traffic.push(red, green);
    for (const f of [0.2, 0.55, 0.85]) {
      const i = cityIdx[Math.floor(cityIdx.length * f)]; if (i == null) continue;
      for (const side of [1, -1]) {
        const [x, z, rot] = along(i, side * (HW + 2.0));
        const g = new THREE.Group();
        g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 6), lam(0x3a3d44)), [0, 2.1, 0]));
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.3, 0.35), lam(0x1a1a1a)), [0, 4.6, 0]));
        const ls = [[5.0, side > 0 ? red : off], [4.6, off], [4.2, side > 0 ? off : green]];
        for (const [y, m] of ls) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), m), [0, y, -0.19]));
        g.position.set(x, 0, z); g.rotation.y = rot; group.add(g);
      }
    }
  }
  // --- Landstraße: Felder ---
  {
    const fb = [0, 1, 2, 3].map(() => GeoBatch());
    for (let k = 0; k < 400 && fb.reduce((s, b) => s + b.idx.length, 0) < 60 * 6; k++) {
      const x = -330 + r() * 380, z = -150 + r() * 480;
      if (isCity(x, z)) continue;
      const w = 30 + r() * 40, d = 24 + r() * 36;
      if (!freeAt(x, z, Math.max(w, d) * 0.55)) continue;
      const rot = r() * Math.PI, cs = Math.cos(rot), sn = Math.sin(rot), y = -0.03;
      const T = (lx, lz) => [x + lx * cs + lz * sn, y, z - lx * sn + lz * cs];
      const rep = d / 12;
      batchQuad(fb[Math.floor(r() * 4)], T(-w / 2, -d / 2), T(-w / 2, d / 2), T(w / 2, d / 2), T(w / 2, -d / 2), [0, 1, 0], [0, 0, 0, rep, w / 12, rep, w / 12, 0]);
      placed.push({ x, z, r: 0.1 }); // nur fürs Nicht-Überlappen grob; Bäume dürfen am Feldrand stehen
    }
    fb.forEach((b, k) => { if (!b.pos.length) return; const t = fieldTexture(k); t.wrapS = t.wrapT = THREE.RepeatWrapping; const m = batchMesh(b, new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 6 })); m.renderOrder = -1; group.add(m); });
  }
}
let world_blitz_idx_hint = null;
function buildLamps(group, along) {
  const N = track.N;
  // --- Straßenlaternen entlang der GESAMTEN Strecke (nur Emissive + additive Lichtkegel, keine echten Lichter) ---
  {
    const lamps = [];
    for (let i = 3; i < N - 3; i += 11) {
      const side = (Math.floor(i / 11) % 2) ? 1 : -1;
      if (world_blitz && (Math.abs(i - world_blitz.idx) < 4 || Math.abs(i - world_blitz.warnIdx) < 3)) continue;
      lamps.push([i, side]);
    }
    const n = lamps.length;
    const poleM = lam(0x5b6068), headM = new THREE.MeshBasicMaterial({ color: 0xb8bcc4 });
    const poolT = radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,.45)');
    const poolM = new THREE.MeshBasicMaterial({ map: poolT, color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, fog: true });
    const coneM = new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,255,255,.9)', 'rgba(255,255,255,.3)'), color: 0xffe2b0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    TOD_MATS.lampHead = headM; TOD_MATS.pool = poolM; TOD_MATS.cone = coneM;
    const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.16, 8.4, 6), poleM, n);
    const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 3.6), poleM, n);
    const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.18, 1.1), headM, n);
    const pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), poolM, n);
    const cone = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 4.2, 7.9, 12, 1, true), coneM, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3(), ey = new THREE.Euler();
    lamps.forEach(([i, side], k) => {
      const l = track.left[i];
      const [bx, bz] = along(i, side * (HW + 2.3)), [hx, hz] = along(i, side * (HW - 1.1)), [ax, az] = along(i, side * (HW + 0.6));
      const ly = Math.atan2(l.x, l.z);
      q.setFromEuler(ey.set(0, 0, 0));
      m4.compose(pv.set(bx, 4.2, bz), q, sc.set(1, 1, 1)); pole.setMatrixAt(k, m4);
      q.setFromEuler(ey.set(0, ly, 0));
      m4.compose(pv.set(ax, 8.35, az), q, sc.set(1, 1, 1)); arm.setMatrixAt(k, m4);
      m4.compose(pv.set(hx, 8.25, hz), q, sc.set(1, 1, 1)); head.setMatrixAt(k, m4);
      m4.compose(pv.set(hx, 4.2, hz), q, sc.set(1, 1, 1)); cone.setMatrixAt(k, m4);
      q.setFromEuler(ey.set(0, 0, 0));
      m4.compose(pv.set(hx - l.x * side * 0.8, 0.075, hz - l.z * side * 0.8), q, sc.set(19, 1, 19)); pool.setMatrixAt(k, m4);
    });
    pool.renderOrder = 2; cone.renderOrder = 3;
    group.add(pole, arm, head, pool, cone);
    window.__lamps = n;
  }
}


// =====================================================================
//  HIMMEL + TAGESZEIT (folgt der lokalen Uhr; ?hour=N erzwingt eine Uhrzeit)
// =====================================================================
const FORCED_HOUR = PARAMS.has('hour') ? clamp(parseFloat(PARAMS.get('hour')) || 0, 0, 24) : null;
const TOD = { hour: 12, sun: 0, dayF: 1, goldF: 0, nightF: 0, lampF: 0, winF: 0, forced: FORCED_HOUR, last: -1e9, dir: new THREE.Vector3(0, 1, 0), moonDir: new THREE.Vector3() };
function sunInfo(date, hour) {
  let rise, set, maxEl;
  if (TOD.forced != null) { rise = 6.0; set = 19.6; maxEl = 56; }  // fester Sommertag für Tests/Screenshots
  else {
    const start = new Date(date.getFullYear(), 0, 1), doy = (date - start) / 864e5;
    const dayLen = 12 + 4.6 * Math.cos(2 * Math.PI * (doy - 172) / 365);
    const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset(), jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    const dst = date.getTimezoneOffset() < Math.max(jan, jul) ? 1 : 0;
    const noon = 12.2 + dst;
    rise = noon - dayLen / 2; set = noon + dayLen / 2; maxEl = 15 + 47 * clamp((dayLen - 7.6) / 9.2, 0, 1);
  }
  let el, az;
  if (hour >= rise && hour <= set) { const ph = (hour - rise) / (set - rise); el = maxEl * Math.sin(Math.PI * ph); az = Math.PI * ph; }
  else { const nl = 24 - (set - rise), nh = ((hour - set) + 24) % 24, ph = nh / nl; el = -50 * Math.sin(Math.PI * ph); az = Math.PI + Math.PI * ph; }
  return { el, az, rise, set };
}
const SKY_PAL = {
  day: { top: new THREE.Color(0x3d86dc), hor: new THREE.Color(0xc4e4f7), hemiS: new THREE.Color(0xffffff), hemiG: new THREE.Color(0x5a7a4a), hemiI: 1.15, sun: new THREE.Color(0xfff4e0), sunI: 1.6, sky: new THREE.Color(0x9fb4cc) },
  gold: { top: new THREE.Color(0x34488f), hor: new THREE.Color(0xff9a5c), hemiS: new THREE.Color(0xffc8a0), hemiG: new THREE.Color(0x4a3a40), hemiI: 0.95, sun: new THREE.Color(0xff8c40), sunI: 1.35, sky: new THREE.Color(0x6a5878) },
  night: { top: new THREE.Color(0x02040d), hor: new THREE.Color(0x0f1634), hemiS: new THREE.Color(0x6474b8), hemiG: new THREE.Color(0x181824), hemiI: 0.55, sun: new THREE.Color(0x9fb4ff), sunI: 0.32, sky: new THREE.Color(0x0c0f1c) },
};
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function mix3(key, out) { out.copy(SKY_PAL.night[key]).lerp(SKY_PAL.day[key], TOD.dayF); return out.lerp(SKY_PAL.gold[key], TOD.goldF * 0.85); }
function mixN(key) { return lerp(lerp(SKY_PAL.night[key], SKY_PAL.day[key], TOD.dayF), SKY_PAL.gold[key], TOD.goldF * 0.85); }
let skyDome = null, stars = null, sunDisc = null, moonDisc = null, hemiLight = null;
function buildSky() {
  hemiLight = scene.children.find(o => o.isHemisphereLight);
  const geo = new THREE.SphereGeometry(1300, 28, 14);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
  skyDome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  skyDome.renderOrder = -10; skyDome.frustumCulled = false; scene.add(skyDome);
  const sp = [], r = rng(99);
  for (let k = 0; k < 900; k++) { const a = r() * Math.PI * 2, y = 0.08 + r() * 0.92, h = Math.sqrt(1 - y * y); sp.push(Math.cos(a) * h * 1250, y * 1250, Math.sin(a) * h * 1250); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: isMobile ? 1.6 : 1.9, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  stars.renderOrder = -9; stars.frustumCulled = false; skyDome.add(stars);
  sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,255,240,1)', 'rgba(255,220,150,.5)'), transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  const mc = canvas(128, 128), mg = mc.getContext('2d');
  mg.fillStyle = '#eef0ff'; mg.beginPath(); mg.arc(64, 64, 40, 0, Math.PI * 2); mg.fill();
  mg.fillStyle = 'rgba(150,160,190,.55)'; for (const [x, y, s] of [[52, 54, 9], [74, 70, 7], [60, 80, 5], [80, 50, 4]]) { mg.beginPath(); mg.arc(x, y, s, 0, Math.PI * 2); mg.fill(); }
  const halo = mg.createRadialGradient(64, 64, 38, 64, 64, 64); halo.addColorStop(0, 'rgba(200,210,255,.35)'); halo.addColorStop(1, 'rgba(200,210,255,0)'); mg.fillStyle = halo; mg.fillRect(0, 0, 128, 128);
  moonDisc = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: tex(mc), transparent: true, fog: false, depthWrite: false }));
  sunDisc.renderOrder = moonDisc.renderOrder = -8; skyDome.add(sunDisc, moonDisc);
  camera.far = 1500; camera.updateProjectionMatrix();
  updateTimeOfDay(true);
}
function updateTimeOfDay(force) {
  const now = performance.now();
  if (!force && now - TOD.last < 1000) return;
  TOD.last = now;
  const d = new Date();
  const hour = TOD.forced != null ? TOD.forced : d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const si = sunInfo(d, hour);
  const s = si.el;
  Object.assign(TOD, { hour, sun: s, dayF: smooth(-6, 10, s), goldF: s > -9 ? clamp(1 - Math.abs(s - 4) / 12, 0, 1) : 0, nightF: 1 - smooth(-12, -3, s), lampF: 1 - smooth(2, 14, s), winF: 1 - smooth(0, 14, s) });
  const ce = Math.cos(s * Math.PI / 180), se = Math.sin(s * Math.PI / 180);
  TOD.dir.set(Math.cos(si.az) * ce, se, Math.sin(si.az) * ce).normalize();
  const mb = si.az - Math.PI; TOD.moonDir.set(-Math.cos(mb) * 0.7, 0.35 + 0.5 * Math.sin(Math.max(0, Math.min(Math.PI, mb))), -0.45).normalize();
  // Licht
  const top = mix3('top', new THREE.Color()), hor = mix3('hor', new THREE.Color());
  scene.background.copy(hor); scene.fog.color.copy(hor);
  scene.fog.near = lerp(55, 90, TOD.dayF); scene.fog.far = lerp(isMobile ? 260 : 320, isMobile ? 330 : 420, TOD.dayF);
  if (hemiLight) { mix3('hemiS', hemiLight.color); mix3('hemiG', hemiLight.groundColor); hemiLight.intensity = mixN('hemiI'); }
  mix3('sun', sun.color); sun.intensity = mixN('sunI');
  const L = s > -4 ? TOD.dir : TOD.moonDir; sun.position.copy(L).multiplyScalar(200);
  // Himmelskuppel einfärben
  if (skyDome) {
    const pos = skyDome.geometry.attributes.position, col = skyDome.geometry.attributes.color, v = new THREE.Vector3(), glow = new THREE.Color(0xffb070);
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).normalize();
      const t = Math.pow(clamp(v.y, 0, 1), 0.55);
      _c1.copy(hor).lerp(top, t);
      if (v.y < 0) _c1.copy(hor).multiplyScalar(0.85);
      const sd = Math.max(0, v.dot(TOD.dir));
      if (TOD.goldF > 0) _c1.lerp(glow, Math.pow(sd, 6) * TOD.goldF * 0.8);
      col.setXYZ(k, _c1.r, _c1.g, _c1.b);
    }
    col.needsUpdate = true;
    stars.material.opacity = TOD.nightF * 0.95;
    sunDisc.visible = s > -6; sunDisc.material.opacity = smooth(-6, 2, s);
    sunDisc.position.copy(TOD.dir).multiplyScalar(1150); sunDisc.lookAt(0, 0, 0);
    moonDisc.visible = TOD.nightF > 0.05; moonDisc.material.opacity = TOD.nightF;
    moonDisc.position.copy(TOD.moonDir).multiplyScalar(1100); moonDisc.lookAt(0, 0, 0);
  }
  // Fenster, Skyline, Laternen, Werbung, Scheinwerfer
  // Tagsüber Fenster-Leuchttextur ganz abschalten (spart Fragment-Arbeit); Shader wird nur beim Wechsel neu gebaut
  const winOn = TOD.winF > 0.01;
  for (const m of TOD_MATS.windows.concat(TOD_MATS.skyline)) {
    if (m.userData.roof) continue;
    if (!m.userData.emi) m.userData.emi = m.emissiveMap;
    const want = winOn ? m.userData.emi : null;
    if (m.emissiveMap !== want) { m.emissiveMap = want; m.emissive.setHex(winOn ? 0xffffff : 0x000000); m.needsUpdate = true; }
  }
  for (const m of TOD_MATS.windows) m.emissiveIntensity = TOD.winF * 1.05;
  const skyCol = mix3('sky', new THREE.Color());
  for (const m of TOD_MATS.skyline) { if (m.userData.roof) m.color.copy(skyCol).multiplyScalar(0.7); else { m.color.copy(skyCol); m.emissiveIntensity = TOD.winF * 0.55; } }
  if (TOD_MATS.lampHead) TOD_MATS.lampHead.color.setHex(0xb8bcc4).lerp(_c2.setHex(0xfff0c8), TOD.lampF);
  if (TOD_MATS.pool) { TOD_MATS.pool.opacity = TOD.lampF * 0.8; TOD_MATS.pool.visible = TOD.lampF > 0.02; }
  if (TOD_MATS.cone) { TOD_MATS.cone.opacity = TOD.lampF * 0.075; TOD_MATS.cone.visible = TOD.lampF > 0.05; }
  for (const m of TOD_MATS.ads) m.emissiveIntensity = 0.12 + TOD.lampF * 0.75;
  if (TOD_MATS.aviation) TOD_MATS.aviation.color.setHex(TOD.winF > 0.3 ? 0xff2a2a : 0x8a3030);
  const gm = glowMat(); gm.opacity = TOD.lampF; gm.visible = TOD.lampF > 0.05;
  const hb = headBeamMat(); hb.opacity = TOD.lampF * 0.8; hb.visible = TOD.lampF > 0.05;
  const C = COMMON(); C.hl.emissiveIntensity = 1 + TOD.lampF * 1.5; C.tail.emissiveIntensity = 1 + TOD.lampF * 2.2;
  window.__tod = { hour: +hour.toFixed(2), sun: +s.toFixed(1), dayF: +TOD.dayF.toFixed(2), goldF: +TOD.goldF.toFixed(2), nightF: +TOD.nightF.toFixed(2), lampF: +TOD.lampF.toFixed(2) };
}
function updateSky() {
  if (!skyDome) return;
  skyDome.position.set(camera.position.x, 0, camera.position.z);
  updateTimeOfDay(false);
}
window.__setHour = h => { TOD.forced = h == null ? null : +h; updateTimeOfDay(true); return window.__tod; };
// Scheinwerfer-Lichtkegel auf der Straße (additiv, ein gemeinsames Material)
function headBeamMat() { return M('headBeam', () => new THREE.MeshBasicMaterial({ map: beamTexture(), color: 0xfff1d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 })); }
function glowMat() { return M('hlGlow', () => new THREE.SpriteMaterial({ map: radialTexture('rgba(255,255,245,1)', 'rgba(255,240,200,.35)'), color: 0xfff6dd, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); }
function addHeadlights(root, body) {
  const box = new THREE.Box3().setFromObject(body);
  const zf = box.max.z, hw = Math.min(1.1, (box.max.x - box.min.x) / 2);
  const beam = new THREE.Mesh(M('headBeamGeo', () => new THREE.PlaneGeometry(7, 17).rotateX(-Math.PI / 2)), headBeamMat());
  beam.position.set(0, 0.1, zf + 8.2); beam.renderOrder = 2; root.add(beam);
  const glowM = glowMat();
  root.userData.glows = [];
  for (const s of [1, -1]) { const sp = new THREE.Sprite(glowM); sp.scale.set(1.3, 1.3, 1); sp.position.set(s * hw * 0.72, 0.95, zf + 0.15); root.add(sp); root.userData.glows.push(sp); }
}

/* =====================================================================
   MUSIK (eigene Chiptune-Komposition, prozedural) + POLIZEIFUNK
   ===================================================================== */
const MUSIC_VOL = 0.17;
const music = { on: ls.get('rf1_music', '1') !== '0', bus: null, theme: null, step: 0, next: 0, timer: 0, pulse: null, duckUntil: 0 };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// Rennen: C-Dur, 150 BPM, 8 Takte (A: C G Am F · B: F G C G)
const THEMES = {
  race: {
    bpm: 150,
    chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65], [57, 60, 65], [59, 62, 67], [60, 64, 67], [59, 62, 67]],
    bass: [48, 43, 45, 41, 41, 43, 48, 43],
    lead: [
      [[0, 72, 2], [2, 76, 2], [4, 79, 3], [8, 76, 1], [9, 77, 1], [10, 79, 2], [12, 84, 4]],
      [[0, 83, 2], [2, 79, 2], [4, 74, 2], [6, 79, 2], [8, 81, 3], [12, 79, 4]],
      [[0, 76, 2], [2, 72, 2], [4, 69, 2], [6, 72, 1], [7, 74, 1], [8, 76, 4], [12, 74, 2], [14, 72, 2]],
      [[0, 72, 3], [4, 69, 2], [6, 72, 2], [8, 77, 3], [12, 76, 2], [14, 74, 2]],
      [[0, 77, 2], [2, 81, 2], [4, 84, 4], [8, 81, 2], [10, 77, 2], [12, 81, 4]],
      [[0, 79, 2], [2, 83, 2], [4, 86, 4], [8, 83, 2], [10, 79, 2], [12, 74, 4]],
      [[0, 76, 1], [1, 77, 1], [2, 79, 2], [4, 84, 2], [6, 79, 2], [8, 76, 2], [10, 79, 2], [12, 72, 4]],
      [[0, 74, 2], [2, 79, 2], [4, 83, 2], [6, 86, 2], [8, 84, 6], [14, 83, 2]]
    ],
    leadWave: 'pulse', drums: 'race'
  },
  // Menü: F-Dur, 108 BPM, gemütlicher (F C Dm Bb)
  menu: {
    bpm: 108,
    chords: [[65, 69, 72], [64, 67, 72], [62, 65, 69], [62, 65, 70]],
    bass: [41, 36, 38, 34],
    lead: [
      [[0, 69, 4], [4, 72, 4], [8, 77, 6], [14, 76, 2]],
      [[0, 74, 4], [4, 72, 4], [8, 67, 8]],
      [[0, 69, 2], [2, 70, 2], [4, 72, 4], [8, 74, 4], [12, 72, 4]],
      [[0, 70, 4], [4, 69, 4], [8, 65, 8]]
    ],
    leadWave: 'triangle', drums: 'soft'
  }
};
function musicInit() {
  const a = audio.ctx; if (!a || music.bus) return;
  music.bus = a.createGain(); music.bus.gain.value = music.on ? MUSIC_VOL : 0; music.bus.connect(audio.master);
  // 25-%-Pulswelle (typischer Chiptune-Klang)
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
  music.pulse = a.createPeriodicWave(re, im);
  music.timer = setInterval(musicTick, 40);
}
function mNote(f, t, dur, type, vol, dest) {
  const a = audio.ctx, o = a.createOscillator(), g = a.createGain();
  if (type === 'pulse') o.setPeriodicWave(music.pulse); else o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.setValueAtTime(vol, t + Math.max(0.01, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || music.bus); o.start(t); o.stop(t + dur + 0.02);
}
function mNoise(t, dur, vol, type, freq) {
  const a = audio.ctx, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = audio.noise; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(music.bus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}
function mKick(t, vol) { const a = audio.ctx, o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); g.connect(music.bus); o.start(t); o.stop(t + 0.2); }
function musicTick() {
  const a = audio.ctx; if (!a || !music.bus || a.state !== 'running') return;
  const want = music.on && !audio.muted ? music.theme : null;
  if (!want) { music.next = 0; return; }
  const th = THEMES[want], sd = 60 / th.bpm / 4, bars = th.chords.length;
  if (!music.next || music.next < a.currentTime - 0.2) { music.next = a.currentTime + 0.06; music.step = 0; }
  while (music.next < a.currentTime + 0.18) {
    const t = music.next, s = music.step % (bars * 16), bar = Math.floor(s / 16), st = s % 16;
    for (const [p, m, len] of th.lead[bar]) if (p === st) mNote(mtof(m), t, len * sd * 0.95, th.leadWave === 'pulse' ? 'pulse' : 'triangle', th.leadWave === 'pulse' ? 0.11 : 0.16);
    // Bass: Achtel, Grundton / Oktave, Quinte auf Zählzeit 4
    if (st % 2 === 0) { const r = th.bass[bar], m = st === 12 ? r + 7 : (st % 4 === 2 ? r + 12 : r); mNote(mtof(m), t, sd * 1.7, 'triangle', 0.2); }
    // Akkord-Stakkato auf den Offbeats
    if (st % 4 === 2) for (const m of th.chords[bar]) mNote(mtof(m), t, sd * 0.8, 'square', th.drums === 'race' ? 0.018 : 0.012);
    // Schlagzeug
    if (th.drums === 'race') {
      if (st === 0 || st === 8 || (st === 10 && bar % 2)) mKick(t, 0.32);
      if (st === 4 || st === 12) mNoise(t, 0.12, 0.16, 'bandpass', 1800);
      if (st % 2 === 0) mNoise(t, 0.03, 0.05, 'highpass', 7000);
    } else {
      if (st === 0 || st === 8) mKick(t, 0.18);
      if (st === 4 || st === 12) mNoise(t, 0.05, 0.05, 'highpass', 6000);
    }
    music.next += sd; music.step++;
  }
}
function updateMusic() {
  if (!audio.ctx) return; musicInit();
  music.theme = race.active && race.state !== 'idle' && curScreen !== 'scr-result' ? 'race' : 'menu';
  // Ducking unter Popups (Norman, Polizeifunk)
  const t = audio.ctx.currentTime, ducked = performance.now() < music.duckUntil;
  const target = music.on && !audio.muted ? MUSIC_VOL * (ducked ? 0.3 : 1) : 0;
  if (Math.abs(music.bus.gain.value - target) > 0.002) music.bus.gain.setTargetAtTime(target, t, 0.15);
}
function duckMusic(sec) { music.duckUntil = Math.max(music.duckUntil, performance.now() + sec * 1000); }
function setMusic(on) {
  music.on = on; ls.set('rf1_music', on ? '1' : '0');
  for (const id of ['btnMusic', 'btnMusicMenu']) { const b = $(id); if (b) { b.textContent = on ? '🎵' : '🎵̸'; b.classList.toggle('off', !on); } }
  updateMusic();
}

// ---------------- Polizeifunk ----------------
const RADIO_LINES = [
  'Einheit 12 an Zentrale, wir haben ein illegales Fiber-Truck-Rennen!',
  'Zentrale an alle Einheiten: magentafarbene Transporter mit überhöhter Geschwindigkeit!',
  'Einheit 7 hier, die verlegen da Glasfaser mit 140 Sachen!',
  'Hier Einheit 12, ein Trabi hat uns gerade überholt…',
  'Zentrale, wir brauchen Verstärkung, die haben HA-Only-Verträge dabei!'
];
const Radio = { active: false, pending: false, next: 0, fastSince: 0, idx: Math.floor(Math.random() * RADIO_LINES.length), timer: 0, static: null, voice: null };
function radioStatic(on) {
  const a = audio.ctx; if (!a) return;
  if (on && !Radio.static) {
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    s.buffer = audio.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 1.4; g.gain.value = 0.035;
    lfo.frequency.value = 9; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain); // knisterndes Pumpen
    s.connect(f); f.connect(g); g.connect(audio.master); s.start(); lfo.start();
    Radio.static = { s, lfo, g };
  } else if (!on && Radio.static) {
    const st = Radio.static; Radio.static = null;
    try { st.g.gain.setTargetAtTime(0, a.currentTime, 0.05); st.s.stop(a.currentTime + 0.3); st.lfo.stop(a.currentTime + 0.3); } catch (e) {}
  }
}
function squelch(delay = 0) { noise(0.16, 0.22, 2600, 900, 'bandpass', delay, 2); tone(1250, 0.09, 'square', 0.05, null, delay + 0.14); }
function pickGermanVoice() {
  if (Radio.voice || !window.speechSynthesis) return Radio.voice;
  const vs = speechSynthesis.getVoices() || [];
  Radio.voice = vs.find(v => /^de(-|_)DE/i.test(v.lang)) || vs.find(v => /^de/i.test(v.lang)) || null;
  return Radio.voice;
}
if (window.speechSynthesis) { try { speechSynthesis.onvoiceschanged = () => { Radio.voice = null; pickGermanVoice(); }; } catch (e) {} }
function normanShowing() { const n = $('norman'); return n && n.classList.contains('show'); }
function policeRadio(force) {
  if (Radio.active) return false;
  if (normanShowing()) { Radio.pending = true; return false; }   // nicht über Norman – danach abspielen
  Radio.active = true; Radio.pending = false;
  const line = RADIO_LINES[Radio.idx++ % RADIO_LINES.length];
  const unit = (line.match(/Einheit (\d+)/) || [])[1];
  const el = $('radio');
  $('radioFrom').textContent = unit ? 'Einheit ' + unit : 'Zentrale';
  $('radioMsg').textContent = '„' + line + '“';
  el.classList.remove('hidden'); void el.offsetWidth; el.classList.add('show');
  window.__radio = (window.__radio || 0) + 1; (window.__radioLog = window.__radioLog || []).push(line);
  const est = 1.2 + line.length * 0.065;
  duckMusic(est + 1.2);
  squelch(); radioStatic(true);
  let ended = false;
  const end = () => {
    if (ended) return; ended = true;
    radioStatic(false); squelch(0.02);
    clearTimeout(Radio.timer);
    Radio.timer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.classList.add('hidden'); Radio.active = false; if (normanQueued) { normanQueued = false; showNorman(); } }, 450); }, 600);
  };
  // Sprachausgabe (de-DE) – sie lässt sich nicht filtern, daher Rauschen + Squelch drumherum
  if (window.speechSynthesis && !audio.muted) {
    try {
      const u = new SpeechSynthesisUtterance(line); u.lang = 'de-DE'; const v = pickGermanVoice(); if (v) u.voice = v;
      u.rate = 1.08; u.pitch = 0.75; u.volume = 0.9;
      u.onend = () => setTimeout(end, 150); u.onerror = () => {};
      setTimeout(() => { try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }, 380);
    } catch (e) {}
  }
  setTimeout(end, est * 1000 + 900); // Sicherheitsnetz (oder ohne Sprachausgabe: Untertitel-Dauer)
  return true;
}
// alle 0,5 s prüfen: ≥ 4 Fahrer gleichzeitig über 130 km/h → ab und zu Funkspruch (Abklingzeit ~45 s)
let radioCheckT = 0;
function checkPoliceRadio(now) {
  if (now - radioCheckT < 500) return; radioCheckT = now;
  if (Radio.pending && !normanShowing() && !Radio.active) { policeRadio(); return; }
  if (race.state !== 'run' || Radio.active || now < Radio.next) return;
  const fast = race.vehicles.filter(v => !v.out && !v.left && Math.abs(v.speed) * 3.6 > 130).length;
  window.__fastCount = fast;
  if (fast >= 4) {
    if (!Radio.fastSince) Radio.fastSince = now;
    if (now - Radio.fastSince > 1500) {
      Radio.fastSince = 0;
      if (Math.random() < 0.65) { if (policeRadio() || Radio.pending) Radio.next = now + 45000; }
      else Radio.next = now + 12000; // diesmal nicht – später wieder würfeln
    }
  } else Radio.fastSince = 0;
}
let normanQueued = false;

/* =====================================================================
   MULTIPLAYER (Supabase Realtime: Presence + Broadcast, keine Tabellen)
   ===================================================================== */
const Net = {
  sb: null, ch: null, code: null, me: null, players: [], connected: false, synced: false, syncedAt: 0,
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
    this.synced = false; this.syncedAt = 0;
    const ch = this.ch = sb.channel('rf1f-' + code, { config: { broadcast: { self: false }, presence: { key: this.me.id } } });
    ch.on('presence', { event: 'sync' }, () => this.onPresence());
    for (const ev of ['start', 'st', 'fire', 'hit', 'fin', 'crash', 'bl', 'dsq']) ch.on('broadcast', { event: ev }, m => this.onMsg(ev, m.payload));
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('Zeitüberschreitung')), 12000);
      ch.subscribe(async s => {
        if (s === 'SUBSCRIBED') { clearTimeout(to); this.connected = true; await ch.track(this.me); res(); }
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') { clearTimeout(to); rej(new Error(s)); }
      });
    });
  },
  async leave() {
    const ch = this.ch; this.ch = null; this.connected = false; this.players = []; this.synced = false;
    if (ch) { try { await ch.untrack(); } catch (e) {} try { await this.sb.removeChannel(ch); } catch (e) {} }
  },
  // nur über den offenen Websocket senden (kein REST-Fallback, der bei Ratenlimit 429 liefert)
  send(event, payload) { const ch = this.ch; if (ch && this.connected && ch.state === 'joined') ch.send({ type: 'broadcast', event, payload }).catch(() => {}); },
  setStatus(s) { if (!this.me) return; this.me.status = s; if (this.ch) this.ch.track(this.me).catch(() => {}); },
  hostId() { const p = this.players.slice().sort((a, b) => a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : 1)); return p.length ? p[0].id : null; },
  // Host = frühester joinedAt laut Server-Presence (Gleichstand: kleinere id). Erst nach Sync + kurzer Wartezeit,
  // damit ein Neuling sich nicht kurz selbst für den Host hält.
  hostReady() { return this.synced && Date.now() - this.syncedAt > 2000; },
  // zusätzlich muss die Host-Rolle ~1,2 s stabil sein (Presence-Listen kommen beim Beitritt teils stückweise)
  isHost() {
    const cand = !!this.me && this.synced && this.hostId() === this.me.id;
    if (!cand) { this.hostSince = 0; return false; }
    if (!this.hostSince) { this.hostSince = Date.now(); setTimeout(renderLobby, 1300); }
    return this.hostReady() && Date.now() - this.hostSince > 1200;
  },
  onPresence() {
    const st = this.ch.presenceState(), list = [];
    for (const k in st) { const m = st[k][0]; if (m && m.id) list.push(m); }
    if (this.me && list.find(p => p.id === this.me.id)) {
      if (!this.synced) { this.synced = true; this.syncedAt = Date.now(); setTimeout(renderLobby, 2100); }
    }
    this.players = list;
    // ausgestiegene Mitspieler im laufenden Rennen markieren
    if (race.active && race.mp) {
      for (const v of race.vehicles) {
        if (!v.remote || v.left || v.finished) continue;
        const p = list.find(q => q.id === v.id);
        if (race.state !== 'run' || race.time < 3000) continue;
        const gone = !p || p.status !== 'racing' || p.rid !== race.rid;
        // kurze Verbindungsaussetzer (Presence-Rejoin) nicht sofort als Ausstieg werten
        if (gone && !(p && p.status === 'lobby') && performance.now() - (v.lastSeen || 0) < 6000) { clearTimeout(v.leftTO); v.leftTO = setTimeout(() => { if (this.ch) this.onPresence(); }, 6500); continue; }
        if (gone) { v.left = true; v.mesh.visible = false; toast(v.name + ' hat das Rennen verlassen'); }
      }
    }
    renderLobby();
  },
  onMsg(ev, p) {
    if (!p) return;
    if (ev === 'start') {
      if (!p.grid.some(g => g.id === this.me.id)) return;
      // Konflikt (zwei Starts gleichzeitig): der Start des "älteren" Hosts gewinnt
      if (race.active && race.mp && race.rid !== p.rid) {
        const k = race.hostKey || [0, ''];
        if (!(p.hj < k[0] || (p.hj === k[0] && p.h < k[1])) || race.state === 'run') return;
      }
      startMp(p); return;
    }
    if (!race.active || !race.mp) return;
    if (ev === 'crash') { onRemoteCrash(p); return; }
    const v = race.vehicles.find(q => q.id === (p.i || p.o || p.t));
    if (ev === 'st') {
      if (!v || !v.remote) return;
      if (v.left) { v.left = false; v.mesh.visible = true; }
      v.buf.push({ t: performance.now(), x: p.x, z: p.z, h: p.h, s: p.s });
      if (v.buf.length > 30) v.buf.shift();
      v.prog = p.p; v.lap = p.l; v.lastSeen = performance.now();
      if (p.sp > 0 && v.spinT <= 0) { v.spinT = p.sp; v.invulnT = 2.6; }
      if (p.f && (!v.finished || !v.finishTime)) { v.finished = true; if (p.ft) v.finishTime = p.ft; if (resultShown) renderResults(); }
      if (p.b > v.strikes) v.strikes = p.b;
      if (p.q && !v.dsq) disqualify(v);
    } else if (ev === 'fire') {
      if (!projectiles.find(q => q.id === p.id)) {
        spawnProjectile({ id: p.id, owner: p.o, ownerName: p.n, x: p.x, z: p.z, h: p.h, v: p.v });
        const o = race.vehicles.find(q => q.id === p.o); if (o && distToLocal(o) < 80) sfx.fire();
      }
    } else if (ev === 'hit') {
      removeProjectile(p.pid);
      const t = race.vehicles.find(q => q.id === p.t);
      if (t && t.remote && t.spinT <= 0) { t.spinT = 1.1; t.invulnT = 2.6; }
      if (p.o === this.me.id && t && t.remote && !race.countedHits.has(p.pid)) { race.countedHits.add(p.pid); toast('TREFFER! ' + p.tn + ' hat unterschrieben!'); sfx.hit(); countMyHit(); }
      window.__hits = (window.__hits || 0) + 1;
    } else if (ev === 'bl') {
      if (v && p.n > v.strikes) { v.strikes = p.n; flashBlitzer(); if (distToLocal(v) < 90) sfx.blitz(); toast('📸 ' + v.name + ' geblitzt! (' + p.n + '/' + BLITZ_MAX + ')', 1400); if (p.n >= BLITZ_MAX) disqualify(v); }
    } else if (ev === 'dsq') {
      if (v) disqualify(v);
    } else if (ev === 'fin') {
      if (v && !(v.finished && v.finishTime === p.t)) { v.finished = true; v.finishTime = p.t; if (isFinite(p.b)) v.best = p.b; if (resultShown) renderResults(); }
    }
  }
};
// Es gibt genau EINE offene Lobby (keine Raum-Codes). Nur für automatische Tests (?autodrive) lässt sie sich
// per ?testlobby=NAME auf einen eigenen Kanal legen, damit Testläufe echte Spieler nicht stören.
const OPEN_LOBBY = (AUTODRIVE && PARAMS.get('testlobby')) ? 'TEST' + String(PARAMS.get('testlobby')).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) : 'PUBLIC';
const MAX_MP = 8;
let joining = false;
async function enterLobby() {
  if (joining) return; joining = true;
  ensureAudio();
  toast('Verbinde mit der offenen Lobby …', 1500);
  try {
    await Net.join(OPEN_LOBBY);
    showScreen('scr-lobby'); renderLobby();
  } catch (e) {
    toast('⚠️ Lobby nicht erreichbar – Internet prüfen und nochmal versuchen.', 3200);
    await Net.leave();
  } finally { joining = false; }
}
function lobbyView() {
  const ps = Net.players.slice().sort((a, b) => a.joinedAt - b.joinedAt || (a.id < b.id ? -1 : 1));
  const hid = Net.hostId();
  const waiting = ps.filter(p => p.status === 'lobby');
  const grid = waiting.slice(0, MAX_MP);
  const racing = ps.filter(p => p.status === 'racing');
  return { ps, hid, waiting, grid, racing, hostP: ps.find(p => p.id === hid) };
}
function renderLobby() {
  if (!Net.me) return;
  const L = lobbyView(), me = Net.me;
  $('lobbyCount').textContent = L.ps.length + ' / ' + MAX_MP;
  const inGrid = new Set(L.grid.map(p => p.id));
  $('lobbyList').innerHTML = L.ps.map(p => {
    const tag = p.status === 'racing' ? ' · im Rennen 🏁' : (p.status === 'lobby' && !inGrid.has(p.id) ? ' · wartet (voll)' : '');
    return `<li class="${p.id === me.id ? 'me' : ''}${p.id === L.hid ? ' host' : ''}">${p.id === L.hid ? '👑 ' : ''}${escapeHtml(p.name)}${p.id === me.id ? ' <b>(du)</b>' : ''} <small>${escapeHtml((TRUCKS[p.truck] || TRUCKS[0]).name)}${tag}</small></li>`;
  }).join('');
  const host = Net.isHost(), btn = $('btnStartMp');
  btn.classList.toggle('hidden', !host);
  if (!Net.hostReady()) { $('lobbyStatus').textContent = 'Synchronisiere Lobby …'; btn.disabled = true; return; }
  const n = L.grid.length;
  btn.disabled = n < 2;
  btn.textContent = n >= 2 ? '🏁 RENNEN STARTEN (' + n + (n === 2 ? ' · 1vs1' : '') + ')' : '⏳ Warte auf Mitspieler…';
  const meWaitingFull = me.status === 'lobby' && !inGrid.has(me.id);
  let msg;
  if (meWaitingFull) msg = 'Lobby voll – Rennen läuft/voll. Du bist dabei, sobald ein Platz frei ist.';
  else if (L.racing.length && !L.racing.some(p => p.id === me.id)) msg = host ? 'Rennen läuft noch (' + L.racing.length + ' im Rennen) – du kannst mit den Wartenden starten oder kurz warten.' : 'Rennen läuft – du bist beim nächsten dabei.';
  else if (host) msg = n >= 2 ? 'Du bist Host 👑 – starte, wenn alle da sind.' : 'Warte auf Mitspieler… (ab 2 Spielern geht’s los)';
  else msg = 'Warte, bis ' + (L.hostP ? L.hostP.name : 'der Host') + ' 👑 das Rennen startet …';
  $('lobbyStatus').textContent = msg;
  window.__lobby = { n: L.ps.length, grid: n, host, hostId: L.hid, racing: L.racing.length, msg, startEnabled: host && !btn.disabled };
}
function hostStart() {
  if (!Net.isHost() || !Net.hostReady()) return;
  const L = lobbyView();
  if (L.grid.length < 2) { renderLobby(); return; }   // ab 1vs1
  const grid = L.grid.map(p => ({ id: p.id, n: p.name, v: p.truck }));
  const payload = { rid: 'r' + uid(), grid, cd: 4000, laps: LAPS, h: Net.me.id, hj: Net.me.joinedAt };
  Net.send('start', payload);
  startMp(payload);
}
function startMp(p) {
  if (race.active && race.rid === p.rid) return;
  ensureAudio();
  clearRace();
  race.mp = true; race.rid = p.rid; race.hostKey = [p.hj || 0, p.h || ''];
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
  $('truckIdx').innerHTML = (selVi + 1) + ' / ' + TRUCKS.length + ' <span>' + TRUCKS.map((_, k) => k === selVi ? '●' : '○').join('') + '</span>';
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
{ // Wischen auf der Auswahl
  let sx = null, sid = null;
  glCanvas.addEventListener('pointerdown', e => { if (curScreen === 'scr-select') { sx = e.clientX; sid = e.pointerId; } });
  glCanvas.addEventListener('pointerup', e => { if (curScreen === 'scr-select' && sid === e.pointerId && sx !== null) { const d = e.clientX - sx; if (Math.abs(d) > 40) changeTruck(d < 0 ? 1 : -1); } sx = null; });
  $('scr-select').addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sx = e.clientX; sid = e.pointerId; });
  $('scr-select').addEventListener('pointerup', e => { if (e.target.closest('button') || sx === null || sid !== e.pointerId) return; const d = e.clientX - sx; if (Math.abs(d) > 40) changeTruck(d < 0 ? 1 : -1); sx = null; });
}
click('btnSolo', () => { goFullscreen(); startSolo(); });
click('btnMulti', () => { goFullscreen(); enterLobby(); });
click('btnStartMp', () => { goFullscreen(); hostStart(); });
click('btnLeave', async () => { await Net.leave(); showScreen('scr-select'); });
window.__openLobby = OPEN_LOBBY;
click('btnPause', () => { if (!race.active) return; paused = !race.mp; showScreen('scr-pause'); $('touch').classList.add('hidden'); resetTouch(); });
click('btnResume', () => { paused = false; showScreen(null); if (isTouch || PARAMS.has('touchui')) $('touch').classList.remove('hidden'); lastT = performance.now(); });
click('btnQuit', () => { paused = false; quitRace(); });
click('btnMute', () => setMute(!audio.muted));
click('btnMusic', () => setMusic(!music.on)); click('btnMusicMenu', () => setMusic(!music.on)); setMusic(music.on);
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
  if (e.code === 'KeyN') setMusic(!music.on);
  if (e.code === 'KeyH' && race.active && !e.repeat) sfx.horn();
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
    if (paused) { race.goAt += dt * 1000; updateEngineAudio(0, 0, false, false); updateSky(); renderer.render(scene, camera); return; }
    // feste Teilschritte für stabile Physik
    acc += dt; let n = 0;
    while (acc > 1 / 60 && n < 5) { stepRace(1 / 60); acc -= 1 / 60; n++; }
    if (n === 5) acc = 0;
    updateParts(dt); updateCamera(dt); updateHud();
    if (race.me) updateEngineAudio(race.me.speed, race.me.steer, (race.state === 'run' || race.state === 'countdown') && !race.me.dsq, race.me.spinT > 0);
    updateMusic();
    updateSky(); renderer.render(scene, camera); window.__drawCalls = renderer.info.render.calls + '/' + renderer.info.render.triangles;
  } else {
    updateEngineAudio(0, 0, false, false);
    updateMusic();
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
buildSky();
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
  state() { const me = race.me; return { active: race.active, mp: race.mp, state: race.state, time: race.time, fps, screen: curScreen, me: me && { id: me.id, vi: me.vi, strikes: me.strikes, dsq: me.dsq, draft: me.draft, kmh: Math.round(Math.abs(me.speed) * 3.6), lap: me.lap, prog: me.prog, x: me.x, z: me.z, speed: me.speed, ammo: me.ammo, finished: me.finished, spinT: me.spinT, pos: racingOrder().indexOf(me) + 1 }, vehicles: race.vehicles.map(v => ({ id: v.id, name: v.name, vi: v.vi, strikes: v.strikes, dsq: v.dsq, remote: v.remote, ai: v.isAI, x: v.x, z: v.z, lap: v.lap, finished: v.finished, spinT: v.spinT, left: !!v.left })), players: Net.players.map(p => ({ id: p.id, name: p.name, status: p.status })) }; },
  teleportBehind(id, dist = 14) { const t = race.vehicles.find(v => v.id === id), me = race.me; if (!t || !me) return false; const i = t.idx, back = (i - Math.round(dist / 1.6) + track.N) % track.N, l = lateral(i, t.x, t.z); me.place(back, l); me.lap = t.lap; me.updateProgress(true); snapCamera(); return true; },
  ram(id, gap = 6, speed = 26) { const t = race.vehicles.find(v => v.id === id), me = race.me; if (!t || !me) return false; const back = (t.idx - Math.round(gap / 1.6) + track.N) % track.N; me.place(back, lateral(t.idx, t.x, t.z)); me.lap = t.lap; me.updateProgress(true); me.speed = speed; me.invulnT = 0; me.crashCD = 0; snapCamera(); return true; },
  toBlitz(dist = 40) { const me = race.me, bz = world.blitz; const i = (bz.idx - Math.round(dist / 1.6) + track.N) % track.N; me.place(i, 0); me.lap = Math.max(1, me.lap); me.updateProgress(true); snapCamera(); return i; },
  get blitz() { return world.blitz && { idx: world.blitz.idx, N: track.N }; },
  placeAt(frac, lat = 0) { const me = race.me; if (!me) return false; const i = frac === 'heko' ? ((window.__hekoTower ? window.__hekoTower.i : 300) - 120 + track.N) % track.N : frac === 'over' ? ((window.__overpass || 200) - 24 + track.N) % track.N : Math.floor(track.N * frac) % track.N; me.place(i, lat); me.updateProgress(true); snapCamera(); return { i, x: me.x, z: me.z, city: isCity(me.x, me.z) }; },
  towerView(back = 110, fromFrac = null, y = 4) { const t = window.__hekoTower; if (!t) return null; const i = fromFrac != null ? Math.floor(track.N * fromFrac) : (t.i - back + track.N) % track.N, p = track.pts[i]; window.__camOverride = [p.x, y, p.z, t.x, t.h * 0.75, t.z]; return { i, d: Math.round(Math.hypot(p.x - t.x, p.z - t.z)) }; },
  camFree() { window.__camOverride = null; },
  radio() { return policeRadio(true); }, norman() { showNorman(); }, music() { return { on: music.on, theme: music.theme, step: music.step, ctx: audio.ctx && audio.ctx.state }; },
  tod() { return window.__tod; }, setHour(h) { return window.__setHour(h); },
  giveAmmo(n = 3) { if (race.me) { race.me.ammo = n; updateItemHud(); } },
  fire() { doFire(); },
  hold(id) { const v = race.vehicles.find(q => q.id === id); if (v) { v.held = true; } }
};

/* =====================================================================
   BESTENLISTEN (Supabase: Tabelle f1_stats + RPC f1_add_result)
   Einrichtung: supabase-setup.sql. Fehlt die Tabelle, zeigt das Spiel
   "Bestenliste noch nicht eingerichtet" und läuft normal weiter.
   ===================================================================== */
// In Test-/Debug-Läufen (autodrive, ai, laps) niemals echte Ergebnisse melden – außer ausdrücklich mit ?stats
const STATS_OFF = PARAMS.has('nostats') || ((AUTODRIVE || PARAMS.has('laps') || PARAMS.has('ai')) && !PARAMS.has('stats'));
const Board = {
  cache: null, cacheAt: 0, tab: 'wins', loading: null,
  missing(err) {
    if (!err) return false;
    const c = String(err.code || ''), m = String(err.message || '') + ' ' + String(err.details || '');
    return ['PGRST205', 'PGRST202', 'PGRST200', '42P01', '42883', '404'].includes(c) || /does not exist|schema cache|Could not find/i.test(m);
  },
  async fetch(force) {
    if (!force && this.cache && Date.now() - this.cacheAt < 30000) return this.cache;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const sb = await Net.lib();
        const q = col => sb.from('f1_stats').select('player_name,wins,ha_hits,truck').gt(col, 0).order(col, { ascending: false }).order('updated_at', { ascending: true }).limit(15);
        const [w, h] = await Promise.all([q('wins'), q('ha_hits')]);
        const err = w.error || h.error;
        if (err) return { state: this.missing(err) ? 'missing' : 'error', msg: err.message };
        this.cache = { state: 'ok', wins: w.data || [], hits: h.data || [] }; this.cacheAt = Date.now();
        return this.cache;
      } catch (e) { return { state: 'error', msg: String(e && e.message || e) }; }
      finally { this.loading = null; }
    })();
    return this.loading;
  },
  async report(won, hits, truck) {
    window.__statsReports = (window.__statsReports || []).concat([{ won, hits, truck, name: playerName }]);
    if (STATS_OFF || !playerName) return { state: 'off' };
    try {
      const sb = await Net.lib();
      const { error } = await sb.rpc('f1_add_result', { p_name: playerName, p_won: !!won, p_hits: Math.max(0, hits | 0), p_truck: truck });
      if (error) return { state: this.missing(error) ? 'missing' : 'error', msg: error.message };
      this.cacheAt = 0; return { state: 'ok' };
    } catch (e) { return { state: 'error', msg: String(e && e.message || e) }; }
  },
  async render(target, compact) {
    const el = $(target);
    el.innerHTML = '<div class="lb-msg">Lade Bestenliste …</div>';
    const r = await this.fetch(false);
    if (r.state === 'missing') { el.innerHTML = '<div class="lb-msg">🛠️ Bestenliste noch nicht eingerichtet</div>'; return r; }
    if (r.state !== 'ok') { el.innerHTML = '<div class="lb-msg">📡 Bestenliste gerade nicht erreichbar</div>'; return r; }
    const me = (playerName || '').toLowerCase();
    const list = (rows, col, unit) => rows.length ? rows.map((p, k) => `<tr class="${String(p.player_name).toLowerCase() === me ? 'me' : ''}"><td>${k + 1}.</td><td>${escapeHtml(p.player_name)}${p.truck ? ' <small>' + escapeHtml(p.truck) + '</small>' : ''}</td><td class="t">${p[col]} ${unit}</td></tr>`).join('') : '<tr><td colspan="3" class="lb-empty">Noch keine Einträge – sei die/der Erste!</td></tr>';
    const wins = `<div class="lb-col${this.tab === 'wins' ? ' on' : ''}" data-tab="wins"><h3>🏆 MEISTE SIEGE</h3><table class="restable">${list(r.wins, 'wins', r.wins.length && 'x')}</table></div>`;
    const hits = `<div class="lb-col${this.tab === 'hits' ? ' on' : ''}" data-tab="hits"><h3>📄 MEISTE HA-ONLY-TREFFER</h3><table class="restable">${list(r.hits, 'ha_hits', '')}</table></div>`;
    el.innerHTML = (compact ? '' : '') + `<div class="lb-tabs"><button class="chip${this.tab === 'wins' ? ' on' : ''}" data-tab="wins">🏆 Siege</button><button class="chip${this.tab === 'hits' ? ' on' : ''}" data-tab="hits">📄 Treffer</button></div><div class="lb-cols">${wins}${hits}</div>`;
    for (const b of el.querySelectorAll('.lb-tabs button')) b.addEventListener('click', e => { e.preventDefault(); this.tab = b.dataset.tab; for (const x of el.querySelectorAll('[data-tab]')) x.classList.toggle('on', x.dataset.tab === this.tab); });
    return r;
  },
};
// Ergebnis genau EINMAL pro Rennen melden – nur der eigene Client für den eigenen Truck
function reportOwnResult(won) {
  if (!race.me || race.reported) return;
  if (race.vehicles.length < 2) return;           // ohne Gegner zählt nichts
  race.reported = true;
  const hits = race.myHits | 0, truck = (TRUCKS[race.me.vi] || TRUCKS[0]).name;
  const note = $('resStats');
  if (note) note.textContent = STATS_OFF ? '' : 'Wird gespeichert …';
  Board.report(won, hits, truck).then(r => {
    if (!note) return;
    note.textContent = r.state === 'ok' ? '✔ Gespeichert: ' + (won ? '+1 Sieg · ' : '') + hits + ' HA-Only-Treffer' : r.state === 'missing' ? 'Bestenliste noch nicht eingerichtet' : r.state === 'off' ? '' : 'Ergebnis konnte nicht gespeichert werden';
  });
}
function countMyHit() { if (race.active && race.state === 'run' && race.me && !race.me.finished && !race.me.dsq) race.myHits = (race.myHits | 0) + 1; }
let boardBack = 'scr-select';
function openBoard(from) { boardBack = from || 'scr-select'; showScreen('scr-board'); Board.cacheAt = 0; Board.render('boardBody'); }
click('btnBoard', () => openBoard('scr-select'));
click('btnResBoard', () => openBoard('scr-result'));
click('btnBoardBack', () => showScreen(boardBack));
window.__board = Board;
