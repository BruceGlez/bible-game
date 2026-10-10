import fs from 'fs';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateIcon(size, filename) {
  const width = size;
  const height = size;
  const rowLength = width * 4;
  const rawData = Buffer.alloc((rowLength + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowLength + 1);
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Gold parchment / ancient badge aesthetic
      if (dist <= radius) {
        // Inner gradient
        const t = dist / radius;
        const r = Math.round(197 * (1 - t * 0.3)); // Warm gold
        const g = Math.round(155 * (1 - t * 0.3));
        const b = Math.round(39 * (1 - t * 0.2));

        // Subtle cross / dove symbol in center
        const isCross = (Math.abs(dx) < width * 0.05 && dy > -height * 0.25 && dy < height * 0.25) ||
                        (Math.abs(dy + height * 0.05) < height * 0.05 && dx > -width * 0.2 && dx < width * 0.2);

        if (isCross) {
          rawData[pxOffset] = 255;     // White/radiant center
          rawData[pxOffset + 1] = 250;
          rawData[pxOffset + 2] = 230;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Dark background #12100e
        rawData[pxOffset] = 18;
        rawData[pxOffset + 1] = 16;
        rawData[pxOffset + 2] = 14;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filename, pngBuffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

generateIcon(192, 'public/icon-192.png');
generateIcon(512, 'public/icon-512.png');
generateIcon(180, 'public/apple-touch-icon.png');
generateIcon(64, 'public/favicon.png');
