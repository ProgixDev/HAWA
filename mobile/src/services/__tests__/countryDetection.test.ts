import {detectCountryCode} from '../countryDetection';

// Approximate, IP-based country detection (LocationScreen.tsx's initial map
// suggestion only) — every scenario here must resolve, never throw, and
// never hang: a network problem must fall back to the neutral London
// default (see config/countryLocations.ts), not block onboarding.

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});

describe('detectCountryCode', () => {
  it('resolves the ISO country code from a valid response', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({country_code: 'fr', city: 'Paris'}),
    })) as unknown as typeof fetch;

    await expect(detectCountryCode()).resolves.toBe('FR');
  });

  it('returns null when the service responds with an HTTP error', async () => {
    global.fetch = jest.fn(async () => ({ok: false, status: 500, json: async () => ({})})) as unknown as typeof fetch;

    await expect(detectCountryCode()).resolves.toBeNull();
  });

  it('returns null on a malformed/unexpected response body', async () => {
    global.fetch = jest.fn(async () => ({ok: true, json: async () => ({unexpected: true})})) as unknown as typeof fetch;

    await expect(detectCountryCode()).resolves.toBeNull();
  });

  it('returns null when the response body is not valid JSON', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => {
        throw new Error('invalid json');
      },
    })) as unknown as typeof fetch;

    await expect(detectCountryCode()).resolves.toBeNull();
  });

  it('returns null when the device is offline / the request rejects', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('Network request failed');
    }) as unknown as typeof fetch;

    await expect(detectCountryCode()).resolves.toBeNull();
  });

  it('returns null when the request times out', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(
      (_url: string, options?: {signal?: AbortSignal}) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    ) as unknown as typeof fetch;

    const pending = detectCountryCode();
    await jest.advanceTimersByTimeAsync(6000);

    await expect(pending).resolves.toBeNull();
  });

  it('never throws — always resolves to a value the caller can use directly', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('boom');
    }) as unknown as typeof fetch;

    await expect(detectCountryCode()).resolves.toBeNull();
  });
});
