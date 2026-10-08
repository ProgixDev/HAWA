import {
  DEFAULT_KDF_ITERATIONS,
  MAX_KDF_ITERATIONS,
  checkPassphrase,
  derivePassphraseKey,
  normalizePassphrase,
  randomSaltHex,
} from '../passphraseKdf';

describe('passphrase key derivation (PBKDF2-HMAC-SHA256)', () => {
  it('matches the published RFC 7914 test vector (passwd / salt / 1 iteration)', async () => {
    const key = await derivePassphraseKey('passwd', 'salt', 1);
    expect(Buffer.from(key).toString('hex')).toBe('55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc');
  });

  it('is deterministic for the same passphrase + salt + cost, and differs for any change', async () => {
    const salt = randomSaltHex();
    const a = await derivePassphraseKey('correct horse battery', salt, 1000);
    expect(Buffer.from(await derivePassphraseKey('correct horse battery', salt, 1000)).toString('hex')).toBe(Buffer.from(a).toString('hex'));
    for (const other of [
      await derivePassphraseKey('correct horse batterY', salt, 1000),
      await derivePassphraseKey('correct horse battery', randomSaltHex(), 1000),
      await derivePassphraseKey('correct horse battery', salt, 1001),
    ]) {
      expect(Buffer.from(other).toString('hex')).not.toBe(Buffer.from(a).toString('hex'));
    }
    expect(a).toHaveLength(32);
  });

  it('normalises Unicode so the same typed passphrase gives the same key on any keyboard', async () => {
    expect(normalizePassphrase('ﬁnale têtue')).toBe('finale têtue');
    const salt = randomSaltHex();
    const composed = await derivePassphraseKey('téte de linotte', salt, 1000); // e + combining accent
    const precomposed = await derivePassphraseKey('téte de linotte', salt, 1000);
    expect(Buffer.from(composed).toString('hex')).toBe(Buffer.from(precomposed).toString('hex'));
  });

  it('refuses impossible or abusive costs', async () => {
    await expect(derivePassphraseKey('x'.repeat(12), 'salt', 0)).rejects.toThrow('invalid KDF cost');
    await expect(derivePassphraseKey('x'.repeat(12), 'salt', MAX_KDF_ITERATIONS + 1)).rejects.toThrow('invalid KDF cost');
    await expect(derivePassphraseKey('x'.repeat(12), 'salt', 1.5)).rejects.toThrow('invalid KDF cost');
  });

  it('uses an OWASP-class default cost and a fresh 16-byte salt every time', () => {
    expect(DEFAULT_KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    const salts = new Set(Array.from({length: 50}, randomSaltHex));
    expect(salts.size).toBe(50);
    expect(randomSaltHex()).toMatch(/^[0-9a-f]{32}$/);
  });

  it('accepts a long passphrase and refuses short or single-character ones', () => {
    expect(checkPassphrase('une phrase assez longue')).toEqual({ok: true});
    expect(checkPassphrase('court')).toEqual({ok: false, reason: 'too-short'});
    expect(checkPassphrase('aaaaaaaaaaaaaaa')).toEqual({ok: false, reason: 'too-repetitive'});
    expect(checkPassphrase('abababababab')).toEqual({ok: false, reason: 'too-repetitive'});
  });
});
