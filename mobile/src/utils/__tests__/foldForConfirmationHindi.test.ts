import {foldForConfirmation} from '../textCase';
import {hi} from '../../i18n/locales/hi';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// The typed confirmation word of the two destructive flows ("DELETE", "SUPPRIMER", "SİL", "हटाएं" …) is compared after a
// language-aware fold. Hindi has no letter case, but a nasal vowel is written with the chandrabindu (ँ) or the anusvara (ं)
// and a nukta letter can be one code point or two, so those are folded: the same word typed either way is accepted.

describe('foldForConfirmation — Hindi', () => {
  const word = (hi as {dataPrivacy: {deleteAccount: {confirmWord: string}}}).dataPrivacy.deleteAccount.confirmWord;

  it('the dictionary word is the everyday anusvara spelling and is the same in both destructive flows', () => {
    expect(word).toBe('हटाएं');
    expect((hi as {backupUtility: {delete: {confirmWord: string}}}).backupUtility.delete.confirmWord).toBe(word);
  });

  it('accepts the anusvara and the chandrabindu spelling, with or without surrounding spaces', () => {
    for (const typed of ['हटाएं', 'हटाएँ', '  हटाएं  ', ' हटाएँ']) {
      expect([typed, foldForConfirmation(typed, 'hi') === foldForConfirmation(word, 'hi')]).toEqual([typed, true]);
    }
  });

  it('treats a precomposed nukta letter and its two-code-point spelling as the same', () => {
    expect(foldForConfirmation('क़', 'hi')).toBe(foldForConfirmation('क़', 'hi'));
  });

  it('still refuses a different word, an empty entry and the English word', () => {
    for (const typed of ['हटाओ', 'हटा', '', '   ', 'DELETE', 'delete', 'हटाएं।']) {
      expect([typed, foldForConfirmation(typed, 'hi') === foldForConfirmation(word, 'hi')]).toEqual([typed, false]);
    }
  });

  it('folds with the active language by default', async () => {
    await setAppLanguage('hi');
    expect(foldForConfirmation('हटाएँ')).toBe(foldForConfirmation('हटाएं'));
    await resetAppLanguageForTests();
  });

  it('leaves every other language exactly as it was (case folding, Turkish İ/ı)', () => {
    expect(foldForConfirmation('  supprimer ', 'fr')).toBe('SUPPRIMER');
    expect(foldForConfirmation('delete', 'en')).toBe('DELETE');
    expect(foldForConfirmation('sil', 'tr')).toBe(foldForConfirmation('SİL', 'tr'));
    expect(foldForConfirmation('SIL', 'tr')).toBe(foldForConfirmation('sil', 'tr'));
    expect(foldForConfirmation('удалить', 'ru')).toBe('УДАЛИТЬ');
    expect(foldForConfirmation('hapus', 'id')).toBe('HAPUS');
    // Devanagari given to another language is not folded
    expect(foldForConfirmation('हटाएँ', 'fr')).not.toBe(foldForConfirmation('हटाएं', 'fr'));
  });
});
