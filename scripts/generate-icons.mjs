// Genera los iconos PWA sin dependencias externas (solo el modulo nativo node:zlib).
// Dibuja un fondo degradado + una mancuerna blanca y escribe los PNG en public/.
//
//   node scripts/generate-icons.mjs
//
// Se ejecuta tambien en `npm run build` (script prebuild).

import zlib from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------- CRC32 / PNG

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
}

// rgba: Uint8Array de tamano width*height*4
function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // scanlines con filtro 0 (none)
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // count

  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size; // width
  entry[1] = size >= 256 ? 0 : size; // height
  entry[2] = 0; // palette
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuffer.length, 8); // bytes
  entry.writeUInt32LE(22, 12); // offset

  return Buffer.concat([header, entry, pngBuffer]);
}

// ---------------------------------------------------------------- dibujo

const BG_TOP = [0x11, 0x15, 0x13];
const BG_BOTTOM = [0x07, 0x09, 0x08];
const ACCENT = [0x46, 0xd1, 0x7f]; // verde terminal
const BAR = ACCENT;

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Devuelve un rasterizador para una imagen size x size.
function makeCanvas(size, { transparentBg = false } = {}) {
  const px = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const r = lerp(BG_TOP[0], BG_BOTTOM[0], t);
    const g = lerp(BG_TOP[1], BG_BOTTOM[1], t);
    const b = lerp(BG_TOP[2], BG_BOTTOM[2], t);
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = transparentBg ? 0 : 255;
    }
  }

  function fillRect(nx, ny, nw, nh, color, radius = 0) {
    const x0 = Math.round(nx * size);
    const y0 = Math.round(ny * size);
    const w = Math.round(nw * size);
    const h = Math.round(nh * size);
    const rad = Math.round(radius * size);
    for (let y = y0; y < y0 + h; y++) {
      if (y < 0 || y >= size) continue;
      for (let x = x0; x < x0 + w; x++) {
        if (x < 0 || x >= size) continue;
        if (rad > 0) {
          // esquinas redondeadas
          const dx = Math.min(x - x0, x0 + w - 1 - x);
          const dy = Math.min(y - y0, y0 + h - 1 - y);
          if (dx < rad && dy < rad) {
            const cx = rad - dx;
            const cy = rad - dy;
            if (cx * cx + cy * cy > rad * rad) continue;
          }
        }
        const i = (y * size + x) * 4;
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = 255;
      }
    }
  }

  // Pinta un pixel normalizado si cae dentro del canvas.
  function plot(nx, ny, color) {
    const x = Math.round(nx * size);
    const y = Math.round(ny * size);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = color[0];
    px[i + 1] = color[1];
    px[i + 2] = color[2];
    px[i + 3] = 255;
  }

  // Dibuja un prompt de terminal:  >_   `scale` encoge para el icono maskable.
  function drawPrompt(scale = 1) {
    const s = scale;
    const cy = 0.5;
    const yTop = cy - 0.22 * s;
    const yBot = cy + 0.22 * s;
    const xBase = 0.5 - 0.2 * s; // extremos del chevron
    const xApex = 0.5 + 0.12 * s; // punta del chevron
    const thick = 0.115 * s;
    const step = 0.4 / size;

    // chevron ">" como una banda horizontal que sigue una V girada
    for (let y = yTop; y <= yBot; y += step) {
      const p = 1 - Math.abs(y - cy) / (0.22 * s); // 0 en los extremos, 1 en la punta
      const cxg = xBase + (xApex - xBase) * p;
      for (let dx = -thick / 2; dx <= thick / 2; dx += step) {
        plot(cxg + dx, y, ACCENT);
      }
    }

    // cursor "_" a la derecha
    fillRect(0.5 + 0.03 * s, cy + 0.13 * s, 0.24 * s, 0.06 * s, BAR, 0);
  }

  return {
    px,
    drawPrompt,
    png: () => encodePng(size, size, px),
  };
}

// ---------------------------------------------------------------- salida

function write(name, buf) {
  writeFileSync(join(OUT_DIR, name), buf);
  console.log("  public/" + name + "  (" + buf.length + " bytes)");
}

console.log("Generando iconos en public/ ...");

for (const size of [192, 512]) {
  const c = makeCanvas(size);
  c.drawPrompt(1);
  write(`pwa-${size}.png`, c.png());
}

// maskable: fondo a sangre + glifo dentro de la zona segura
{
  const c = makeCanvas(512);
  c.drawPrompt(0.72);
  write("pwa-maskable-512.png", c.png());
}

// apple-touch-icon: 180x180, sin transparencia (iOS recorta las esquinas)
{
  const c = makeCanvas(180);
  c.drawPrompt(1);
  write("apple-touch-icon.png", c.png());
}

// favicon.ico con un PNG de 32x32 embebido
{
  const c = makeCanvas(32);
  c.drawPrompt(1);
  write("favicon.ico", encodeIco(c.png(), 32));
}

console.log("Listo.");
