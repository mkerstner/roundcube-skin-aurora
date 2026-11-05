#!/usr/bin/env node
/**
 * Draws thumbnail.png, the picture Roundcube shows for Aurora in Settings →
 * User Interface → Interface skin: a tiny Aurora window with the task rail, the
 * header wash, unread dots, a selected row, the avatar and a primary button.
 * Rerun it when the palette changes:
 *
 *   node skins/aurora/dev/thumbnail.js
 *
 * No image library: shapes are painted on a 4× buffer, box-filtered down for
 * anti-aliasing, and encoded with Node's own zlib. Roundcube displays the image
 * at 64×64; it is drawn at 128×128 to stay sharp on high-density screens.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 128, SS = 4, W = SIZE * SS;
const buf = new Float32Array(W * W * 3);

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const put = (x, y, c, a) => {
    if (x < 0 || y < 0 || x >= W || y >= W) return;
    const i = (y * W + x) * 3;
    for (let k = 0; k < 3; k++) buf[i + k] = c[k] * a + buf[i + k] * (1 - a);
};
// paint every sub-pixel of the box for which test(x, y) holds, coordinates in final pixels
const paint = (x0, y0, x1, y1, test, colour, alpha = 1) => {
    for (let y = Math.floor(y0 * SS); y < Math.ceil(y1 * SS); y++) {
        for (let x = Math.floor(x0 * SS); x < Math.ceil(x1 * SS); x++) {
            const px = (x + 0.5) / SS, py = (y + 0.5) / SS;
            if (test(px, py)) {
                const c = typeof colour === 'function' ? colour(px, py) : colour;
                put(x, y, c, typeof alpha === 'function' ? alpha(px, py) : alpha);
            }
        }
    }
};
const rect = (x, y, w, h, c, a) => paint(x, y, x + w, y + h, () => true, c, a);
const roundRect = (x, y, w, h, r, c, a) => paint(x, y, x + w, y + h, (px, py) => {
    const dx = Math.max(x + r - px, px - (x + w - r), 0), dy = Math.max(y + r - py, py - (y + h - r), 0);
    return dx * dx + dy * dy <= r * r;
}, c, a);
const circle = (cx, cy, r, c, a) => paint(cx - r, cy - r, cx + r, cy + r, (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r, c, a);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const vertical = (y0, y1, a, b) => (px, py) => mix(a, b, Math.min(1, Math.max(0, (py - y0) / (y1 - y0))));

// palette (tokens.less)
const INK = hex('#282456'), MUTED = hex('#6a6786'), FAINT = hex('#a9a6c4'), LINE = hex('#e7e4f2'), HAIR = hex('#f0eef8');
const ACCENT = hex('#5b5bf5'), TINT = hex('#efeffe'), LIGHT = hex('#8b8cff'), SPARK = hex('#0d9488'), RED = hex('#ff7b72');
const WHITE = [255, 255, 255];

// canvas
rect(0, 0, SIZE, SIZE, hex('#fbfaff'));

// task rail
const railW = 22;
rect(0, 0, railW, SIZE, vertical(0, SIZE, hex('#1e1b3a'), hex('#171430')));
roundRect(6, 9, 10, 10, 3, LIGHT);
roundRect(4, 26, 14, 14, 3, hex('#302b5d'));
roundRect(7, 29, 8, 8, 2, WHITE);
roundRect(7, 47, 8, 8, 2, WHITE, 0.72);
roundRect(7, 62, 8, 8, 2, WHITE, 0.72);
circle(11, 114, 4, RED);

// message list
const listX = railW, listW = 52, rowH = 19;
rect(listX, 0, listW, SIZE, WHITE);

// header wash across both columns, indigo left, teal right
const glow = (cx, r, a) => (px, py) => a * Math.max(0, 1 - Math.hypot(px - cx, py) / r);
rect(railW, 0, SIZE - railW, 14, ACCENT, glow(railW + 14, 62, 0.2));
rect(railW, 0, SIZE - railW, 14, SPARK, glow(SIZE - 10, 44, 0.18));
rect(railW, 14, SIZE - railW, 1, LINE);

for (let i = 0; i < 6; i++) {
    const y = 15 + i * rowH, selected = i === 1, unread = i < 4;
    if (selected) {
        rect(listX, y, listW, rowH, TINT);
        rect(listX, y, 2, rowH, ACCENT);
    }
    if (unread) circle(listX + 7, y + 12.5, 2.2, SPARK);
    roundRect(listX + 12, y + 4.5, 24 - (i % 2) * 5, 2.5, 1.2, FAINT);
    roundRect(listX + 12, y + 11, 34 - (i % 3) * 4, 3, 1.5, unread ? INK : FAINT);
    if (!selected) rect(listX, y + rowH - 1, listW, 1, HAIR);
}
rect(listX + listW, 0, 1, SIZE, LINE);

// message pane: subject, avatar, meta, body text
const px0 = listX + listW + 7;
roundRect(px0, 21, 40, 4, 2, INK);
circle(px0 + 7, 38, 7, (x, y) => mix(ACCENT, hex('#8b5cf6'), Math.min(1, Math.max(0, ((x - px0) + (y - 31)) / 28))));
circle(px0 + 7, 35.8, 2.3, WHITE, 0.92);
paint(px0 + 2, 38, px0 + 12, 42, (x, y) => ((x - px0 - 7) / 4) ** 2 + ((y - 41.8) / 2.6) ** 2 <= 1, WHITE, 0.92);
roundRect(px0 + 18, 33, 22, 2.5, 1.2, MUTED);
roundRect(px0 + 18, 39, 16, 2.5, 1.2, FAINT);
for (let i = 0; i < 4; i++) roundRect(px0, 54 + i * 7, i === 3 ? 26 : 40, 2.5, 1.2, hex('#cfcce2'));

// primary button: soft glow, gradient, top highlight
for (let g = 4; g >= 1; g--) roundRect(px0 - g + 0.5, 96 - g + 2.5, 30 + 2 * g - 1, 12 + 2 * g - 1, 4 + g, ACCENT, 0.06);
roundRect(px0, 96, 30, 12, 3.5, vertical(96, 108, hex('#645ce8'), hex('#4f46e5')));
rect(px0 + 3, 96, 24, 0.75, WHITE, 0.28);

// box-filter down to the final size
const raw = Buffer.alloc((SIZE * 3 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
    const row = y * (SIZE * 3 + 1);
    raw[row] = 0;   // PNG filter: none
    for (let x = 0; x < SIZE; x++) {
        for (let k = 0; k < 3; k++) {
            let sum = 0;
            for (let sy = 0; sy < SS; sy++) {
                for (let sx = 0; sx < SS; sx++) sum += buf[(((y * SS + sy) * W + (x * SS + sx)) * 3) + k];
            }
            raw[row + 1 + x * 3 + k] = Math.round(sum / (SS * SS));
        }
    }
}

// PNG encoding
const crcTable = Array.from({ length: 256 }, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
});
const crc32 = b => { let c = 0xffffffff; for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
    const head = Buffer.alloc(4), tail = Buffer.alloc(4), body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    head.writeUInt32BE(data.length);
    tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;    // bit depth
ihdr[9] = 2;    // colour type: RGB
const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
]);

const out = path.resolve(__dirname, '..', 'thumbnail.png');
fs.writeFileSync(out, png);
console.log(`${path.basename(out)}: ${SIZE}x${SIZE}, ${png.length} bytes`);
