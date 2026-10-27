// The single place that decides which language an editorial content object
// (a Library article's CONTENT, the pregnancy week reference data) is shown in.
// Explicit opt-ins for the languages that have real editorial text; anything
// else — an unrecognized or not-yet-loaded value included — resolves to
// English, never to French or Spanish.
export type EditorialLanguage = 'fr' | 'en' | 'es' | 'it' | 'tr' | 'ru' | 'de' | 'zh' | 'id' | 'hi' | 'sq' | 'ja' | 'ko' | 'pt-PT' | 'pt-BR' | 'bn' | 'da' | 'sv' | 'nb' | 'pl' | 'uk' | 'cs' | 'sk' | 'hu' | 'ro' | 'bg' | 'sr' | 'hr' | 'bs' | 'sl' | 'ne' | 'si' | 'th' | 'vi' | 'uz' | 'az' | 'ka' | 'hy' | 'tg' | 'ky' | 'tk';

export function resolveEditorialLanguage(language: string | null | undefined): EditorialLanguage {
  // Simplified Chinese aliases (zh-CN, zh-Hans …) resolve to the canonical 'zh' block.
  if (typeof language === 'string' && /^zh([-_](cn|hans|sg|hans-cn|hans-sg))?$/i.test(language.trim())) {
    return 'zh';
  }
  // Indonesian aliases (id-ID, and the legacy Java code 'in') resolve to the canonical 'id' block.
  if (typeof language === 'string' && /^(id|in)([-_]id)?$/i.test(language.trim())) {
    return 'id';
  }
  // Hindi (hi, hi-IN, hi-Deva) resolves to the canonical 'hi' block; 'hi-Latn' (Roman-letter Hindi) is not Devanagari Hindi.
  if (typeof language === 'string' && /^hi([-_](in|deva|deva-in))?$/i.test(language.trim())) {
    return 'hi';
  }
  // Albanian (sq, sq-AL, sq-XK …) resolves to the canonical 'sq' block.
  if (typeof language === 'string' && /^sq([-_](al|xk|mk|me|latn|latn-al))?$/i.test(language.trim())) {
    return 'sq';
  }
  // Japanese (ja, ja-JP, ja-Jpan …) resolves to the canonical 'ja' block.
  if (typeof language === 'string' && /^ja([-_](jp|jpan|jpan-jp))?$/i.test(language.trim())) {
    return 'ja';
  }
  // Korean (ko, ko-KR, ko-Hang …) resolves to the canonical 'ko' block.
  if (typeof language === 'string' && /^ko([-_](kr|kp|kore|kore-kr|hang|hang-kr))?$/i.test(language.trim())) {
    return 'ko';
  }
  // Bengali (bn, bn-BD, bn-IN, bn-Beng …) resolves to the canonical 'bn' block.
  if (typeof language === 'string' && /^bn([-_](bd|in|beng|beng-bd|beng-in))?$/i.test(language.trim())) {
    return 'bn';
  }
  // Danish (da, da-DK, da-FO, da-GL) resolves to the canonical 'da' block.
  if (typeof language === 'string' && /^da([-_](dk|fo|gl))?$/i.test(language.trim())) {
    return 'da';
  }
  // Swedish (sv, sv-SE, sv-FI, sv-AX) resolves to the canonical 'sv' block.
  if (typeof language === 'string' && /^sv([-_](se|fi|ax))?$/i.test(language.trim())) {
    return 'sv';
  }
  // Norwegian Bokmål (nb, nb-NO, and the macrolanguage 'no' / 'no-NO' Android reports for it) resolves to the canonical 'nb' block. Nynorsk (nn) is not Bokmål and falls to English.
  if (typeof language === 'string' && /^(nb|no)([-_](no|sj))?$/i.test(language.trim())) {
    return 'nb';
  }
  // Ukrainian (uk, uk-UA) resolves to the canonical 'uk' block.
  if (typeof language === 'string' && /^uk([-_]ua)?$/i.test(language.trim())) {
    return 'uk';
  }
  // Polish (pl, pl-PL) resolves to the canonical 'pl' block.
  if (typeof language === 'string' && /^pl([-_]pl)?$/i.test(language.trim())) {
    return 'pl';
  }
  // Czech (cs, cs-CZ) resolves to the canonical 'cs' block.
  if (typeof language === 'string' && /^cs([-_]cz)?$/i.test(language.trim())) {
    return 'cs';
  }
  // Slovak (sk, sk-SK) resolves to the canonical 'sk' block.
  if (typeof language === 'string' && /^sk([-_]sk)?$/i.test(language.trim())) {
    return 'sk';
  }
  // Hungarian (hu, hu-HU) resolves to the canonical 'hu' block.
  if (typeof language === 'string' && /^hu([-_]hu)?$/i.test(language.trim())) {
    return 'hu';
  }
  // Romanian (ro, ro-RO) resolves to the canonical 'ro' block.
  if (typeof language === 'string' && /^ro([-_]ro)?$/i.test(language.trim())) {
    return 'ro';
  }
  // Bulgarian (bg, bg-BG) resolves to the canonical 'bg' block.
  if (typeof language === 'string' && /^bg([-_]bg)?$/i.test(language.trim())) {
    return 'bg';
  }
  // Serbian (sr, sr-RS) resolves to the canonical 'sr' block.
  if (typeof language === 'string' && /^sr([-_](rs|cyrl|latn|me|ba))*$/i.test(language.trim())) {
    return 'sr';
  }
  // Croatian (hr, hr-HR) resolves to the canonical 'hr' block.
  if (typeof language === 'string' && /^hr([-_](hr|ba))?$/i.test(language.trim())) {
    return 'hr';
  }
  // Bosnian (bs, bs-BA) resolves to the canonical 'bs' block.
  if (typeof language === 'string' && /^bs([-_](ba|latn|cyrl))*$/i.test(language.trim())) {
    return 'bs';
  }
  // Slovenian (sl, sl-SI) resolves to the canonical 'sl' block.
  if (typeof language === 'string' && /^sl([-_]si)?$/i.test(language.trim())) {
    return 'sl';
  }
  // Nepali (ne, ne-NP-u-nu-latn) resolves to the canonical 'ne' block.
  if (typeof language === 'string' && /^ne([-_](np|in))?$/i.test(language.trim())) {
    return 'ne';
  }
  // Sinhala (si, si-LK) resolves to the canonical 'si' block.
  if (typeof language === 'string' && /^si([-_]lk)?$/i.test(language.trim())) {
    return 'si';
  }
  // Thai (th, th-TH-u-ca-gregory) resolves to the canonical 'th' block.
  if (typeof language === 'string' && /^th([-_]th)?$/i.test(language.trim())) {
    return 'th';
  }
  // Vietnamese (vi, vi-VN) resolves to the canonical 'vi' block.
  if (typeof language === 'string' && /^vi([-_]vn)?$/i.test(language.trim())) {
    return 'vi';
  }
  // Uzbek (uz, uz-UZ) resolves to the canonical 'uz' block.
  if (typeof language === 'string' && /^uz([-_]latn)?([-_]uz)?$/i.test(language.trim())) {
    return 'uz';
  }
  // Azerbaijani (az, az-AZ) resolves to the canonical 'az' block.
  if (typeof language === 'string' && /^az([-_]latn)?([-_]az)?$/i.test(language.trim())) {
    return 'az';
  }
  // Georgian (ka, ka-GE) resolves to the canonical 'ka' block.
  if (typeof language === 'string' && /^ka([-_]geor)?([-_]ge)?$/i.test(language.trim())) {
    return 'ka';
  }
  // Armenian (hy, hy-AM) resolves to the canonical 'hy' block.
  if (typeof language === 'string' && /^hy([-_]arm)?([-_]am)?$/i.test(language.trim())) {
    return 'hy';
  }
  // Tajik (tg, tg-TJ) resolves to the canonical 'tg' block.
  if (typeof language === 'string' && /^tg([-_]cyrl)?([-_]tj)?$/i.test(language.trim())) {
    return 'tg';
  }
  // Kyrgyz (ky, ky-KG) resolves to the canonical 'ky' block.
  if (typeof language === 'string' && /^ky([-_]cyrl)?([-_]kg)?$/i.test(language.trim())) {
    return 'ky';
  }
  // Turkmen (tk, tk-TM) resolves to the canonical 'tk' block.
  if (typeof language === 'string' && /^tk([-_]latn)?([-_]tm)?$/i.test(language.trim())) {
    return 'tk';
  }
  // Portuguese: Brazil ('pt-BR', 'pt_BR', 'pt-Latn-BR') has its own variant over the Portugal text; Portugal, the bare 'pt' and the other
  // Portuguese-speaking countries resolve to 'pt-PT'.
  if (typeof language === 'string' && /^pt([-_]latn)?[-_]br(?:[-_].*)?$/i.test(language.trim())) {
    return 'pt-BR';
  }
  if (typeof language === 'string' && /^pt([-_][a-z]{2,4})*$/i.test(language.trim())) {
    return 'pt-PT';
  }
  if (language === 'fr' || language === 'es' || language === 'it' || language === 'tr' || language === 'ru' || language === 'de' || language === 'zh' || language === 'id' || language === 'da' || language === 'sv' || language === 'nb' || language === 'pl' || language === 'uk' || language === 'cs' || language === 'sk' || language === 'hu' || language === 'ro' || language === 'bg' || language === 'sr' || language === 'hr' || language === 'bs' || language === 'sl' || language === 'ne' || language === 'si' || language === 'th' || language === 'vi' || language === 'uz' || language === 'az' || language === 'ka' || language === 'hy' || language === 'tg' || language === 'ky' || language === 'tk') {return language;}
  return 'en';
}
