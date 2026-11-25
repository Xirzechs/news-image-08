// "The World Today" — a newspaper front page summing up Tuesday 24 November 2026.
// Original program: draws the whole image in code with a tiny rasterizer and a
// hand-written 5x7 bitmap font, then writes a deterministic PNG to /output/entry.png.
// Node 22, standard library only. No network, no randomness, no dates at runtime:
// the same bytes come out of every run.
//
// Stories (all first reported on 24 Nov 2026, checked against live news):
//  1. Fourteen nations affirm the ICJ ruling that Myanmar committed genocide
//     against the Rohingya; the UK also imposes new sanctions.
//  2. China launches Shenzhou 24 — two Chinese astronauts and Pakistan's
//     Zeeshan Ali, the first foreign astronaut aboard Tiangong.
//  3. UN chief Guterres urges a multilateral AI-risk framework within a year.
//  4. The US CIA and ODNI suffer a cyber breach of unclassified information.
//  5. A 5.6-magnitude earthquake strikes Nepal's Koshi province, near China.
//  6. Also: a Russian strike kills 2 in Ukraine; US weighs tariffs on China
//     and the EU; a Houthi drone injures 11 in Riyadh; North Korea expels a
//     Swiss envoy; Solomon Islands names Australia its security partner.
//  Markets at the 24 Nov close: S&P 500 +4.7%, Nasdaq +6.5%, gold $3,620.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// 5x7 bitmap font (uppercase + digits + punctuation), one glyph = 7 rows.
// ---------------------------------------------------------------------------
type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '—': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const CHAR_W = 5;
const CHAR_H = 7;
const CHAR_ADV = 6; // glyph width + 1px gap, before scaling

// ---------------------------------------------------------------------------
// Canvas: a plain RGB buffer with tiny drawing primitives.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;
type RGB = [number, number, number];

const PAPER: RGB = [247, 243, 232];
const INK: RGB = [20, 20, 20];
const RED: RGB = [178, 32, 44];
const NAVY: RGB = [28, 58, 92];
const RULE: RGB = [150, 143, 128];
const TINT: RGB = [238, 233, 219];
const SKY: RGB = [222, 231, 240];
const GOLD: RGB = [176, 132, 32];

class Canvas {
  buf = Buffer.alloc(W * H * 3);
  constructor() {
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = PAPER[0];
      this.buf[i * 3 + 1] = PAPER[1];
      this.buf[i * 3 + 2] = PAPER[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }
  hline(x0: number, x1: number, y: number, c: RGB, th = 1): void {
    for (let t = 0; t < th; t++) for (let x = x0; x <= x1; x++) this.set(x, y + t, c);
  }
  vline(x: number, y0: number, y1: number, c: RGB, th = 1): void {
    for (let t = 0; t < th; t++) for (let y = y0; y <= y1; y++) this.set(x + t, y, c);
  }
  // Bresenham line.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, th = 1): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      if (th <= 1) this.set(x, y, c);
      else this.rect(x - ((th / 2) | 0), y - ((th / 2) | 0), th, th, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB, fill: boolean): void {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        if (fill ? d <= r * r : d <= r * r && d >= (r - 2) * (r - 2)) {
          this.set(cx + x, cy + y, c);
        }
      }
    }
  }
  // Filled triangle by scanline.
  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, c: RGB): void {
    const minY = Math.min(ay, by, cy);
    const maxY = Math.max(ay, by, cy);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      const edges: Array<[number, number, number, number]> = [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]];
      for (const [x0, y0, x1, y1] of edges) {
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        for (let x = Math.ceil(lo); x <= Math.floor(hi); x++) this.set(x, y, c);
      }
    }
  }
  frame(x: number, y: number, w: number, h: number, c: RGB, th = 2): void {
    this.hline(x, x + w, y, c, th);
    this.hline(x, x + w, y + h - th, c, th);
    this.vline(x, y, y + h, c, th);
    this.vline(x + w - th, y, y + h, c, th);
  }
  // --- text ---------------------------------------------------------------
  textWidth(s: string, scale: number): number {
    return s.length * CHAR_ADV * scale - scale;
  }
  drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
    const g = FONT[ch] ?? FONT['?'];
    for (let r = 0; r < CHAR_H; r++) {
      for (let col = 0; col < CHAR_W; col++) {
        if (g[r][col] === '1') {
          this.rect(x + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      this.drawChar(ch, cx, y, scale, c);
      cx += CHAR_ADV * scale;
    }
  }
  textCentered(s: string, y: number, scale: number, c: RGB, x0 = 0, x1 = W): void {
    const w = this.textWidth(s, scale);
    this.text(s, x0 + Math.floor((x1 - x0 - w) / 2), y, scale, c);
  }
  // Word-wrap; returns the y just below the last line drawn.
  paragraph(s: string, x: number, y: number, maxW: number, scale: number, c: RGB, lineGap = 4): number {
    const words = s.split(' ');
    const spaceW = CHAR_ADV * scale;
    let line = '';
    let cy = y;
    const lineH = CHAR_H * scale + lineGap;
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (this.textWidth(trial, scale) <= maxW || !line) {
        line = trial;
      } else {
        this.text(line, x, cy, scale, c);
        cy += lineH;
        line = word;
      }
    }
    if (line) this.text(line, x, cy, scale, c);
    return cy + lineH;
  }
}

// ---------------------------------------------------------------------------
// Minimal deterministic PNG encoder (filter 0, zlib level 9).
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}
function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    cv.buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Pictograms (all drawn from primitives, no copied art).
// ---------------------------------------------------------------------------
function drawScales(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const top = y + 14;
  const beamY = y + 34;
  const baseY = y + h - 26;
  cv.line(cx, top, cx, baseY, INK, 4); // pole
  cv.line(x + 22, beamY, x + w - 22, beamY, INK, 4); // beam
  cv.circle(cx, top, 7, GOLD, true);
  cv.rect(cx - 26, baseY, 52, 6, INK); // base
  cv.rect(cx - 16, baseY + 6, 32, 5, INK);
  for (const side of [-1, 1]) {
    const px = cx + side * Math.floor((w - 44) / 2);
    cv.line(cx + side * 8, beamY, px, beamY + 30, INK, 3);
    cv.line(cx - side * 8, beamY, px, beamY + 30, INK, 3);
    // pan: shallow bowl
    cv.tri(px - 26, beamY + 30, px + 26, beamY + 30, px, beamY + 52, NAVY);
    cv.hline(px - 26, px + 26, beamY + 30, NAVY, 3);
  }
}

function drawRocket(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const noseY = y + 8;
  const bodyTop = y + 34;
  const bodyBot = y + h - 34;
  // stars
  cv.set(x + 12, y + 16, GOLD); cv.set(x + 13, y + 16, GOLD);
  cv.set(x + w - 14, y + 26, GOLD); cv.set(x + w - 13, y + 26, GOLD);
  cv.set(x + 18, y + h - 20, GOLD);
  // body
  cv.rect(cx - 13, bodyTop, 26, bodyBot - bodyTop, NAVY);
  cv.tri(cx - 13, bodyTop, cx + 13, bodyTop, cx, noseY, RED); // nose
  cv.circle(cx, bodyTop + 22, 6, PAPER, true);
  cv.circle(cx, bodyTop + 22, 6, NAVY, false);
  // fins
  cv.tri(cx - 13, bodyBot - 18, cx - 13, bodyBot, cx - 30, bodyBot + 4, RED);
  cv.tri(cx + 13, bodyBot - 18, cx + 13, bodyBot, cx + 30, bodyBot + 4, RED);
  // flame
  cv.tri(cx - 8, bodyBot, cx + 8, bodyBot, cx, bodyBot + 22, GOLD);
  cv.tri(cx - 4, bodyBot, cx + 4, bodyBot, cx, bodyBot + 13, RED);
  // window stripe
  cv.rect(cx - 13, bodyTop + 40, 26, 4, GOLD);
}

function drawGlobe(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2) - 4;
  const r = Math.min(w, h) / 2 - 10;
  cv.circle(cx, cy, r, SKY, true);
  cv.circle(cx, cy, r, NAVY, false);
  // meridians + parallels
  for (let k = -2; k <= 2; k++) {
    const yy = cy + Math.floor((k * r) / 2.6);
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - (yy - cy) * (yy - cy))));
    cv.hline(cx - half, cx + half, yy, NAVY, 1);
  }
  for (let k = -1; k <= 1; k++) {
    const xx = cx + Math.floor((k * r) / 2.2);
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - (xx - cx) * (xx - cx))));
    cv.vline(xx, cy - half, cy + half, NAVY, 1);
  }
  // land blobs (stylised)
  cv.circle(cx - 12, cy - 10, 9, RED, true);
  cv.circle(cx + 14, cy + 8, 11, RED, true);
  cv.circle(cx + 4, cy - 16, 6, RED, true);
}

function drawShield(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const top = y + 10;
  const bot = y + h - 12;
  // shield outline (filled navy, paper inner)
  cv.tri(cx - 34, top, cx + 34, top, cx, top + 26, NAVY);
  cv.rect(cx - 34, top + 14, 68, bot - top - 40, NAVY);
  cv.tri(cx - 34, bot - 26, cx + 34, bot - 26, cx, bot, NAVY);
  cv.tri(cx - 27, top + 6, cx + 27, top + 6, cx, top + 26, PAPER);
  cv.rect(cx - 27, top + 16, 54, bot - top - 44, PAPER);
  cv.tri(cx - 27, bot - 28, cx + 27, bot - 28, cx, bot - 6, PAPER);
  // keyhole
  cv.circle(cx, top + 34, 8, RED, true);
  cv.tri(cx - 5, top + 40, cx + 5, top + 40, cx, top + 62, RED);
  // crack
  cv.line(cx + 22, top + 12, cx + 14, top + 30, RED, 3);
  cv.line(cx + 14, top + 30, cx + 22, top + 44, RED, 3);
}

function drawQuake(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const baseY = y + h - 18;
  // two mountain peaks
  cv.tri(x + 6, baseY, x + 44, y + 18, x + 82, baseY, NAVY);
  cv.tri(x + 34, baseY, x + 78, y + 34, x + 108, baseY, INK);
  // snow caps
  cv.tri(x + 36, y + 30, x + 52, y + 18, x + 44, y + 30, PAPER);
  cv.tri(x + 70, y + 44, x + 86, y + 34, x + 78, y + 44, PAPER);
  // ground crack (zigzag)
  let px = x + 8;
  let py = baseY + 2;
  const pts: Array<[number, number]> = [[px, py]];
  for (let i = 0; i < 5; i++) {
    px += 18;
    py = baseY + 2 + (i % 2 === 0 ? 8 : -2);
    pts.push([px, py]);
  }
  for (let i = 0; i + 1 < pts.length; i++) {
    cv.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], RED, 3);
  }
  // shaking lines above peaks
  cv.hline(x + 30, x + 42, y + 6, RED, 3);
  cv.hline(x + 62, x + 74, y + 12, RED, 3);
}

// ---------------------------------------------------------------------------
// Page layout — a newspaper front page, 1024 x 1024.
// ---------------------------------------------------------------------------
const M = 30; // margin
const R = W - M; // right edge

function buildPage(): Canvas {
  const cv = new Canvas();

  // ---- masthead ------------------------------------------------------------
  cv.textCentered('THE WORLD TODAY', 26, 9, INK);
  cv.hline(M, R, 116, RED, 4);
  cv.textCentered('TUESDAY, 24 NOVEMBER 2026', 130, 3, RED);
  cv.hline(M, R, 162, INK, 2);

  // ---- lead story: ICJ / Rohingya -----------------------------------------
  const leadY = 178;
  cv.text('TOP STORY  —  MYANMAR', M, leadY, 2, RED);
  const headEnd = cv.paragraph(
    '14 NATIONS BACK ICJ RULING: MYANMAR COMMITTED GENOCIDE OF ROHINGYA',
    M, leadY + 26, 600, 4, INK, 6,
  );
  cv.paragraph(
    "THE UK, SPAIN, CANADA, AUSTRALIA AND TEN MORE STATES AFFIRMED THE COURT'S FINDING ON MONDAY. LONDON ALSO IMPOSED NEW SANCTIONS ON SENIOR MYANMAR MILITARY FIGURES.",
    M, headEnd + 6, 600, 2, INK, 5,
  );
  // lead illustration: scales of justice
  const illX = 668;
  const illY = leadY;
  const illW = R - illX;
  const illH = 218;
  cv.rect(illX, illY, illW, illH, SKY);
  cv.frame(illX, illY, illW, illH, INK, 2);
  drawScales(cv, illX + 18, illY + 8, illW - 36, illH - 52);
  cv.textCentered("THE HAGUE — THE ICJ RULING", illY + illH - 26, 2, INK, illX + 6, illX + illW - 6);

  cv.hline(M, R, 424, INK, 2);

  // ---- two-column rows ------------------------------------------------------
  const colW = 467;
  const col2X = M + colW + 30;

  function column(
    x: number, y: number, kicker: string, headline: string, body: string,
    draw: (cv: Canvas, px: number, py: number, pw: number, ph: number) => void,
  ): void {
    cv.text(kicker, x, y, 2, RED);
    const picX = x + colW - 118;
    const picY = y + 22;
    cv.rect(picX, picY, 118, 118, SKY);
    cv.frame(picX, picY, 118, 118, INK, 2);
    draw(cv, picX + 4, picY + 4, 110, 110);
    const hEnd = cv.paragraph(headline, x, y + 24, colW - 132, 3, INK, 5);
    cv.paragraph(body, x, Math.max(hEnd, y + 152), colW, 2, INK, 5);
  }

  column(M, 442, 'SPACE  —  CHINA', 'SHENZHOU 24 LIFTS OFF WITH FIRST FOREIGN ASTRONAUT ABOARD',
    "TWO CHINESE ASTRONAUTS AND PAKISTAN'S ZEESHAN ALI ARE BOUND FOR THE TIANGONG STATION — THE FIRST FOREIGN CREW MEMBER ABOARD CHINA'S ORBITAL OUTPOST.",
    drawRocket);
  column(col2X, 442, 'TECH  —  UNITED NATIONS', 'UN CHIEF URGES GLOBAL AI RULES WITHIN A YEAR',
    'SECRETARY-GENERAL GUTERRES CALLED ON STATES TO AGREE A MULTILATERAL FRAMEWORK TO MANAGE AI RISKS, AS HIS TERM NEARS ITS END.',
    drawGlobe);

  cv.hline(M, R, 668, RULE, 1);

  column(M, 686, 'SECURITY  —  USA', 'CIA AND ODNI HIT BY CYBER BREACH',
    'SOME UNCLASSIFIED INFORMATION WAS EXPOSED, A SOURCE TOLD REUTERS. THE EXTENT OF THE COMPROMISE WAS NOT DISCLOSED.',
    drawShield);
  column(col2X, 686, 'ASIA  —  NEPAL', 'QUAKE OF 5.6 SHAKES NEPAL NEAR CHINA BORDER',
    'THE TREMOR STRUCK KOSHI PROVINCE ON TUESDAY. NO CASUALTY TOLL WAS CONFIRMED IN FIRST REPORTS.',
    drawQuake);

  cv.hline(M, R, 912, INK, 2);

  // ---- also today + markets --------------------------------------------------
  cv.text('ALSO TODAY', M, 928, 2, RED);
  cv.paragraph(
    'RUSSIA STRIKE KILLS 2 IN UKRAINE — US TARIFFS LOOM — HOUTHI DRONE HITS RIYADH — N. KOREA EXPELS SWISS ENVOY — SOLOMON ISLANDS PICKS AUSTRALIA.',
    M, 950, R - M, 2, INK, 4,
  );
  cv.hline(M, R, 996, RULE, 1);
  cv.textCentered('MARKETS: S&P 500 +4.7%  —  NASDAQ +6.5%  —  GOLD $3,620  —  BRENT $86.7', 1004, 2, NAVY);

  return cv;
}

// ---------------------------------------------------------------------------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePNG(buildPage());
writeFileSync(join(outDir, 'entry.png'), png);
