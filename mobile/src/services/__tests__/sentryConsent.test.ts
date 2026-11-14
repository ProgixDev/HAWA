// Sentry must never start without the person's agreement, and must stop when she withdraws it.

const KEY = '@awa/security/crash-reports-v1';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  close: jest.fn(() => Promise.resolve(true)),
}));

type Fresh = {
  sentryService: typeof import('../sentry');
  Sentry: {init: jest.Mock; close: jest.Mock};
  storage: typeof import('@react-native-async-storage/async-storage').default;
};

// The service keeps a module-level "started" flag: every test gets a fresh copy of it and of the store.
function loadFresh(): Fresh {
  jest.resetModules();
  const sentryService = require('../sentry');
  const Sentry = require('@sentry/react-native');
  const storage = require('@react-native-async-storage/async-storage').default;
  return {sentryService, Sentry, storage};
}

const globalWithDev = globalThis as unknown as {__DEV__: boolean};
const initialDev = globalWithDev.__DEV__;

beforeEach(() => {
  globalWithDev.__DEV__ = false; // Sentry deliberately never starts in development
});

afterEach(() => {
  globalWithDev.__DEV__ = initialDev;
  jest.restoreAllMocks();
});

describe('initSentry — consent gate', () => {
  it('does not start when she was never asked', async () => {
    const {sentryService, Sentry} = loadFresh();
    await sentryService.initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not start when she declined', async () => {
    const {sentryService, Sentry, storage} = loadFresh();
    await storage.setItem(KEY, 'declined');
    await sentryService.initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not start when the stored choice cannot be read', async () => {
    const {sentryService, Sentry, storage} = loadFresh();
    jest.spyOn(storage, 'getItem').mockRejectedValue(new Error('storage unavailable'));
    await sentryService.initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not start in development even with consent', async () => {
    globalWithDev.__DEV__ = true;
    const {sentryService, Sentry, storage} = loadFresh();
    await storage.setItem(KEY, 'granted');
    await sentryService.initSentry();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts once, with the privacy options, when she agreed', async () => {
    const {sentryService, Sentry, storage} = loadFresh();
    await storage.setItem(KEY, 'granted');
    await sentryService.initSentry();
    await sentryService.initSentry();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    const options = Sentry.init.mock.calls[0][0];
    expect(options.dsn).toBe(sentryService.SENTRY_DSN);
    expect(options).toMatchObject({sendDefaultPii: false, attachScreenshot: false, attachViewHierarchy: false, tracesSampleRate: 0, maxBreadcrumbs: 0});
  });
});

describe('setCrashReportsEnabled — applied immediately', () => {
  it('turning it on stores the choice and starts the SDK', async () => {
    const {sentryService, Sentry, storage} = loadFresh();
    await sentryService.setCrashReportsEnabled(true);
    expect(await storage.getItem(KEY)).toBe('granted');
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it('turning it off stores the refusal and stops a running SDK', async () => {
    const {sentryService, Sentry, storage} = loadFresh();
    await sentryService.setCrashReportsEnabled(true);
    await sentryService.setCrashReportsEnabled(false);
    expect(await storage.getItem(KEY)).toBe('declined');
    expect(Sentry.close).toHaveBeenCalledTimes(1);
  });

  it('refusing when the SDK never started stores the refusal and closes nothing', async () => {
    const {sentryService, Sentry, storage} = loadFresh();
    await sentryService.setCrashReportsEnabled(false);
    expect(await storage.getItem(KEY)).toBe('declined');
    expect(Sentry.close).not.toHaveBeenCalled();
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('can be turned on again after having been turned off', async () => {
    const {sentryService, Sentry} = loadFresh();
    await sentryService.setCrashReportsEnabled(true);
    await sentryService.setCrashReportsEnabled(false);
    await sentryService.setCrashReportsEnabled(true);
    expect(Sentry.init).toHaveBeenCalledTimes(2);
  });
});
