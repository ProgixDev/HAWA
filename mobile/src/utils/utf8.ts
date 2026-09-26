/* eslint-disable no-bitwise -- UTF-8 decoding is bit manipulation by definition */
// UTF-8 decoding without `TextDecoder`.
//
// React Native's Hermes runtime (the release build of this app, hermes
// 2025-07-24 / RN 0.80.2) provides `TextEncoder` but NOT `TextDecoder`. The
// local AES-GCM encryption (privateJournalEncryption / privateNotesEncryption /
// atRestFieldEncryption) used @noble/ciphers' `bytesToUtf8`, which is
// `new TextDecoder().decode(bytes)`: on a real device every decryption threw
// "Property 'TextDecoder' doesn't exist" after the ciphertext had already been
// authenticated. Callers treat a decrypt failure as "unreadable", so encrypted
// data was saved fine but could never be read back (CONCEIVE-01: a saved
// "Rapports" never showed as completed nor counted in the statistics). Node and
// Jest both have TextDecoder, which is why no automated test caught it.
//
// This is a spec-conformant (WHATWG "UTF-8 decode") implementation: same output
// as `new TextDecoder('utf-8').decode(bytes)` for valid AND invalid input
// (U+FFFD replacement of maximal subparts, a leading BOM is dropped).

const REPLACEMENT = 0xfffd;
const CHUNK = 8192;

export function decodeUtf8(bytes: Uint8Array): string {
  let start = 0;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    start = 3; // TextDecoder (ignoreBOM = false) strips a leading BOM
  }

  let out = '';
  let units: number[] = [];
  const flush = () => {
    if (units.length) {
      out += String.fromCharCode(...units);
      units = [];
    }
  };
  const push = (codePoint: number) => {
    if (codePoint > 0xffff) {
      const offset = codePoint - 0x10000;
      units.push(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    } else {
      units.push(codePoint);
    }
    if (units.length >= CHUNK) {flush();}
  };

  let codePoint = 0;
  let bytesSeen = 0;
  let bytesNeeded = 0;
  let lower = 0x80;
  let upper = 0xbf;

  let index = start;
  while (index < bytes.length) {
    const byte = bytes[index];
    if (bytesNeeded === 0) {
      if (byte <= 0x7f) {
        push(byte);
      } else if (byte >= 0xc2 && byte <= 0xdf) {
        bytesNeeded = 1;
        codePoint = byte & 0x1f;
      } else if (byte >= 0xe0 && byte <= 0xef) {
        if (byte === 0xe0) {lower = 0xa0;}
        if (byte === 0xed) {upper = 0x9f;}
        bytesNeeded = 2;
        codePoint = byte & 0xf;
      } else if (byte >= 0xf0 && byte <= 0xf4) {
        if (byte === 0xf0) {lower = 0x90;}
        if (byte === 0xf4) {upper = 0x8f;}
        bytesNeeded = 3;
        codePoint = byte & 0x7;
      } else {
        push(REPLACEMENT);
      }
      index += 1;
    } else if (byte < lower || byte > upper) {
      // Invalid continuation: emit U+FFFD for what was read so far and
      // reprocess THIS byte from the initial state.
      codePoint = 0;
      bytesNeeded = 0;
      bytesSeen = 0;
      lower = 0x80;
      upper = 0xbf;
      push(REPLACEMENT);
    } else {
      lower = 0x80;
      upper = 0xbf;
      codePoint = (codePoint << 6) | (byte & 0x3f);
      bytesSeen += 1;
      index += 1;
      if (bytesSeen === bytesNeeded) {
        push(codePoint);
        codePoint = 0;
        bytesNeeded = 0;
        bytesSeen = 0;
      }
    }
  }
  if (bytesNeeded !== 0) {push(REPLACEMENT);} // truncated sequence at the end
  flush();
  return out;
}
