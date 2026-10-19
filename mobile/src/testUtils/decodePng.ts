import fs from 'fs';
import zlib from 'zlib';

// Test helper: decodes the 8-bit, non-interlaced truecolour (RGB) PNGs the journal hero banners are stored as, so a test can
// measure contrast against the artwork's REAL pixels. Throws on any other PNG layout.

export type RgbImage = {width: number; height: number; data: Buffer};

export function decodePng(file: string): RgbImage {
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(1, 4).toString('ascii') !== 'PNG') {
    throw new Error(`${file} is not a PNG`);
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat: Buffer[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8 || body[9] !== 2 || body[12] !== 0) {
        throw new Error(`${file}: expected 8-bit RGB, not interlaced`);
      }
    } else if (type === 'IDAT') {
      idat.push(body);
    }
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 3;
  const data = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= 3 ? data[y * stride + x - 3] : 0;
      const up = y > 0 ? data[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= 3 ? data[(y - 1) * stride + x - 3] : 0;
      let value = line[x];
      if (filter === 1) {value += left;}
      else if (filter === 2) {value += up;}
      else if (filter === 3) {value += Math.floor((left + up) / 2);}
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value += pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      }
      data[y * stride + x] = value % 256;
    }
  }
  return {width, height, data};
}

/** The pixel at (x, y) as [r, g, b]. */
export const pixelAt = (image: RgbImage, x: number, y: number): [number, number, number] => {
  const column = Math.min(Math.max(Math.floor(x), 0), image.width - 1);
  const row = Math.min(Math.max(Math.floor(y), 0), image.height - 1);
  const index = (row * image.width + column) * 3;
  return [image.data[index], image.data[index + 1], image.data[index + 2]];
};
