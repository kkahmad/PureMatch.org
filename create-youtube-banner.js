const fs = require('fs');
const zlib = require('zlib');

const width = 2048;
const height = 1152;
const outputPath = 'public/youtube-banner.png';

const topColor = { r: 217, g: 122, b: 142 };
const bottomColor = { r: 107, g: 163, b: 214 };
const accentColor = { r: 255, g: 255, b: 255 };
const shadowColor = { r: 14, g: 25, b: 49, a: 200 };

const pixels = Buffer.alloc(width * height * 4);

function blend(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function setPixel(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  pixels[idx] = color.r;
  pixels[idx + 1] = color.g;
  pixels[idx + 2] = color.b;
  pixels[idx + 3] = color.a === undefined ? 255 : color.a;
}

function drawRect(x, y, w, h, color) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      setPixel(xx, yy, color);
    }
  }
}

function drawCircle(cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y0 = Math.max(0, cy - radius); y0 < Math.min(height, cy + radius); y0++) {
    const dy = y0 - cy;
    const dxLimit = Math.sqrt(r2 - dy * dy) || 0;
    const xStart = Math.max(0, Math.floor(cx - dxLimit));
    const xEnd = Math.min(width - 1, Math.ceil(cx + dxLimit));
    for (let x0 = xStart; x0 <= xEnd; x0++) {
      const dx = x0 - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.max(0, 1 - dist / radius);
      const existingIdx = (y0 * width + x0) * 4;
      const existing = {
        r: pixels[existingIdx],
        g: pixels[existingIdx + 1],
        b: pixels[existingIdx + 2],
        a: pixels[existingIdx + 3] / 255
      };
      const srcA = (color.a === undefined ? 255 : color.a) / 255 * alpha * 0.35;
      const outA = srcA + existing.a * (1 - srcA);
      if (outA > 0) {
        pixels[existingIdx] = Math.round((color.r * srcA + existing.r * existing.a * (1 - srcA)) / outA);
        pixels[existingIdx + 1] = Math.round((color.g * srcA + existing.g * existing.a * (1 - srcA)) / outA);
        pixels[existingIdx + 2] = Math.round((color.b * srcA + existing.b * existing.a * (1 - srcA)) / outA);
        pixels[existingIdx + 3] = Math.round(outA * 255);
      }
    }
  }
}

for (let y = 0; y < height; y++) {
  const t = y / (height - 1);
  for (let x = 0; x < width; x++) {
    const u = x / (width - 1);
    const r = blend(topColor.r, bottomColor.r, t * 0.7 + u * 0.3);
    const g = blend(topColor.g, bottomColor.g, t * 0.7 + u * 0.3);
    const b = blend(topColor.b, bottomColor.b, t * 0.7 + u * 0.3);
    setPixel(x, y, { r, g, b });
  }
}

const circles = [
  { x: width * 0.22, y: height * 0.28, r: 320 },
  { x: width * 0.82, y: height * 0.32, r: 260 },
  { x: width * 0.55, y: height * 0.68, r: 420 },
  { x: width * 0.28, y: height * 0.75, r: 220 }
];

circles.forEach((circle) => drawCircle(circle.x, circle.y, circle.r, { r: 255, g: 255, b: 255, a: 180 }));

function drawRoundedRect(x, y, w, h, radius, color) {
  const r = Math.min(radius, w / 2, h / 2);
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const dx = Math.min(xx - x, x + w - 1 - xx);
      const dy = Math.min(yy - y, y + h - 1 - yy);
      const dist = Math.sqrt((dx - r) ** 2 + (dy - r) ** 2);
      if (dx >= r || dy >= r || dist <= r) {
        setPixel(xx, yy, color);
      }
    }
  }
}

const font = {
  A: [' 111 ', '1   1', '1   1', '11111', '1   1', '1   1', '1   1'],
  C: [' 1111', '1    ', '1    ', '1    ', '1    ', '1    ', ' 1111'],
  E: ['11111', '1    ', '1    ', '1111 ', '1    ', '1    ', '11111'],
  G: [' 1111', '1    ', '1 111', '1   1', '1   1', '1   1', ' 1111'],
  H: ['1   1', '1   1', '1   1', '11111', '1   1', '1   1', '1   1'],
  I: [' 111 ', '  1  ', '  1  ', '  1  ', '  1  ', '  1  ', ' 111 '],
  L: ['1    ', '1    ', '1    ', '1    ', '1    ', '1    ', '11111'],
  M: ['1   1', '11 11', '1 1 1', '1   1', '1   1', '1   1', '1   1'],
  N: ['1   1', '11  1', '1 1 1', '1  11', '1   1', '1   1', '1   1'],
  O: [' 111 ', '1   1', '1   1', '1   1', '1   1', '1   1', ' 111 '],
  P: ['1111 ', '1   1', '1   1', '1111 ', '1    ', '1    ', '1    '],
  R: ['1111 ', '1   1', '1   1', '1111 ', '1  1 ', '1   1', '1   1'],
  S: [' 1111', '1    ', '1    ', ' 111 ', '    1', '    1', '1111 '],
  T: ['11111', '  1  ', '  1  ', '  1  ', '  1  ', '  1  ', '  1  '],
  U: ['1   1', '1   1', '1   1', '1   1', '1   1', '1   1', ' 111 '],
  Y: ['1   1', '1   1', ' 1 1 ', '  1  ', '  1  ', '  1  ', '  1  '],
  R: ['1111 ', '1   1', '1   1', '1111 ', '1  1 ', '1   1', '1   1'],
  ':': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  '.': ['     ', '     ', '     ', '     ', '     ', '  11 ', '  11 ']
};

function drawText(text, x, y, scale, color, shadow = false) {
  const letterSpacing = 2;
  let offsetX = x;

  text.toUpperCase().split('').forEach((char) => {
    const pattern = font[char] || ['     ', '     ', '     ', '     ', '     ', '     ', '     '];
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        if (pattern[row][col] === '1') {
          const px = offsetX + col * scale;
          const py = y + row * scale;
          drawRect(px + (shadow ? 6 : 0), py + (shadow ? 6 : 0), scale, scale, color);
        }
      }
    }
    offsetX += pattern[0].length * scale + letterSpacing;
  });
}

// Draw logo text and subtitle
const title = 'PureMatch.org'.toUpperCase();
const subtitle = 'Muslim Rishta Consultation'.toUpperCase();
const titleScale = 28;
const subtitleScale = 14;
const titleWidth = title.split('').reduce((acc, char) => {
  const pattern = font[char] || ['     '];
  return acc + pattern[0].length * titleScale + 2;
}, 0);
const subtitleWidth = subtitle.split('').reduce((acc, char) => {
  const pattern = font[char] || ['     '];
  return acc + pattern[0].length * subtitleScale + 1;
}, 0);
const titleX = Math.round((width - titleWidth) / 2);
const titleY = Math.round(height * 0.26);
const subtitleX = Math.round((width - subtitleWidth) / 2);
const subtitleY = titleY + 220;

const panelPadding = 60;
const panelWidth = titleWidth + panelPadding * 2;
const panelHeight = 220;
const panelX = Math.round((width - panelWidth) / 2);
const panelY = titleY - 60;

drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 40, { r: 15, g: 23, b: 42, a: 210 });
drawRoundedRect(panelX + 8, panelY + 8, panelWidth - 16, panelHeight - 16, 32, { r: 28, g: 39, b: 65, a: 200 });

drawText(title, titleX, titleY, titleScale, accentColor);
drawText(subtitle, subtitleX, subtitleY, subtitleScale, accentColor);

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(crcValue, 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crc]);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    crc32.table = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) {
  raw[y * (width * 4 + 1)] = 0;
  pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, y * width * 4 + width * 4);
}

const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  header,
  createChunk('IHDR', ihdr),
  createChunk('IDAT', idat),
  createChunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync(outputPath, png);
console.log(`Created banner: ${outputPath} (${(png.length / 1024 / 1024).toFixed(2)} MB)`);
