import AsyncStorage from '@react-native-async-storage/async-storage';
import {I18nManager} from 'react-native';

// Kurdish (Kurmanji, 'kmr') and Hebrew ('he') were removed from AWA. A phone that stored one of them must start in a supported language
// (never crash on an unknown code) and must lose the forced right-to-left direction the Hebrew build stored natively.

const KEY = '@awa/appearance/language-v1';

jest.mock('../../utils/deviceLanguage', () => ({readDeviceLocaleTags: jest.fn(async () => ['en-US'])}));

describe('removed languages (kmr, he)', () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem(KEY);
    jest.resetModules();
  });

  it.each(['kmr', 'he', 'ku', 'iw', 'he-IL', 'kurmanji', 'hebrew'])('%s is no longer a supported language code', code => {
    const prefs = require('../../state/themePreferences') as typeof import('../../state/themePreferences');
    expect(prefs.normalizeAppLanguage(code)).toBeNull();
  });

  it.each(['kmr', 'he'])('a stored %s starts the app in a supported language and is rewritten', async code => {
    await AsyncStorage.setItem(KEY, code);
    const i18n = (require('../index') as typeof import('../index')).default;
    const boot = require('../appLanguage') as typeof import('../appLanguage');
    const prefs = require('../../state/themePreferences') as typeof import('../../state/themePreferences');
    await boot.initializeAppLanguage();
    // the test phone reports en-US, which is its own language since the en-US variant
    expect(prefs.getAppLanguage()).toBe('en-US');
    expect(i18n.language).toBe('en-US');
    expect(await AsyncStorage.getItem(KEY)).not.toBe(code);
  });

  it('startup writes the layout direction of the language in force (left-to-right: RTL not allowed, not forced; Arabic is the only right-to-left language)', async () => {
    const allow = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const force = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});
    (require('../index') as typeof import('../index'));
    await (require('../appLanguage') as typeof import('../appLanguage')).initializeAppLanguage();
    expect(allow).toHaveBeenCalledWith(false);
    expect(force).toHaveBeenCalledWith(false);
    allow.mockRestore();
    force.mockRestore();
  });
});
