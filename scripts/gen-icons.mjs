// Generates pixel-art PNG icons (no deps). Run: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const G = [
  "................",
  "................",
  "................",
  "..##........##..",
  ".#YY#......#YY#.",
  ".#YY##....##YY#.",
  ".#YY#R####R#YY#.",
  ".#YY#RWWWWR#YY#.",
  ".#YY#RRRRRR#YY#.",
  ".#YY##....##YY#.",
  ".#YY#......#YY#.",
  "..##........##..",
  "................",
  "....C.C..C.C....",
  "................",
  "................",
];
const PAL = { ".": [11, 13, 23], "#": [0, 0, 0], Y: [255, 225, 77], R: [255, 63, 108], W: [255, 255, 255], C: [61, 242, 255] };

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const s = size / 16;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const col = PAL[G[Math.floor(y / s)][Math.floor(x / s)]];
      col.forEach((v, i) => (raw[y * (size * 3 + 1) + 1 + x * 3 + i] = v));
    }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
mkdirSync("public", { recursive: true });
for (const s of [180, 192, 512]) writeFileSync(`public/icon-${s}.png`, png(s));
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">`;
G.forEach((row, y) => [...row].forEach((ch, x) => { const [r, g, b] = PAL[ch]; svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`; }));
writeFileSync("public/icon.svg", svg + "</svg>");
console.log("icons ok");
