#!/usr/bin/env node
// Usage: node scripts/register-language.js <code> <NativeName> <flag> <locale> "<Mon,Tue,Wed,Thu,Fri,Sat,Sun>" "<M,T,W,T,F,S,S>"
// Patches the 6 mechanical registration files. Review the diff before proceeding.
// Does NOT create the dictionary, article blocks, legal docs, or test files — see ADD_LANGUAGE.md.
'use strict';

const fs = require('fs');
const path = require('path');

const [,, code, nativeName, flag, locale, weekdays3, weekdays1] = process.argv;
if (!code || !nativeName || !flag || !locale || !weekdays3 || !weekdays1) {
  console.error('Usage: register-language.js <code> <NativeName> <flag> <locale> "Mon,Tue,Wed,Thu,Fri,Sat,Sun" "M,T,W,T,F,S,S"');
  console.error('Example: register-language.js nl Nederlands 🇳🇱 nl-NL "Ma,Di,Wo,Do,Vr,Za,Zo" "M,D,W,D,V,Z,Z"');
  process.exit(2);
}

const ROOT = path.join(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

function patch(file, pattern, replacement, description) {
  const full = path.join(ROOT, file);
  const src = fs.readFileSync(full, 'utf8');
  if (!pattern.test(src)) {
    console.error(`  SKIP ${file}: pattern not found — ${description}`);
    return false;
  }
  if (src.includes(replacement.slice(0, 20))) {
    console.log(`  SKIP ${file}: already contains this registration`);
    return false;
  }
  fs.writeFileSync(full, src.replace(pattern, replacement));
  console.log(`  PATCH ${file}: ${description}`);
  return true;
}

const wd3 = weekdays3.split(',');
const wd1 = weekdays1.split(',');
if (wd3.length !== 7 || wd1.length !== 7) { console.error('Weekday arrays must have exactly 7 entries'); process.exit(2); }

const prevCode = 'bn'; // update this when a new language becomes the "last" one

console.log(`\nRegistering language: ${code} (${nativeName} ${flag}, locale ${locale})\n`);

// 1. themePreferences.ts — AwaAppLanguage union + alias set + normalizeAppLanguage
patch(
  'src/state/themePreferences.ts',
  new RegExp(`(\\| '${prevCode}')`),
  `| '${prevCode}' | '${code}'`,
  'AwaAppLanguage union',
);
patch(
  'src/state/themePreferences.ts',
  /(const BN_ALIASES[^\n]+\n)/,
  `$1const ${code.toUpperCase()}_ALIASES = new Set(['${code}-${locale.split('-')[1]?.toLowerCase() ?? ''}']);\n`,
  'alias set',
);

// 2. i18n/index.ts — import + resource
patch(
  'src/i18n/index.ts',
  /(import \{bn\} from '\.\/locales\/bn';)/,
  `$1\nimport {${code}} from './locales/${code}';`,
  'import',
);
patch(
  'src/i18n/index.ts',
  /(bn: \{translation: bn\})/,
  `$1,\n    ${code}: {translation: ${code}}`,
  'resource entry',
);

// 3. editorialLanguage.ts — type + resolver
patch(
  'src/i18n/editorialLanguage.ts',
  /('bn')/,
  `'bn' | '${code}'`,
  'EditorialLanguage type',
);

// 4. cycleMath.ts — WEEK_DAYS + dateFormatLocale
const wd3Str = JSON.stringify(wd3).replace(/"/g, "'");
patch(
  'src/utils/cycleMath.ts',
  /(export const WEEK_DAYS_BN[^\n]+\n)/,
  `$1export const WEEK_DAYS_${code.toUpperCase()} = ${wd3Str};\n`,
  'WEEK_DAYS constant',
);

// AppearanceScreen — tell user to do manually (too many variations to reliably patch)
console.log(`\n  MANUAL: AppearanceScreen.tsx — add to LANGUAGE_SELF_LABELS, LANGUAGE_NAME_KEYS, LANGUAGE_OPTIONS`);
console.log(`    {id: '${code}', flag: '${flag}', label: '${nativeName}', subtitle: '...'}`);

// LegalDocumentScreen — tell user to do manually
console.log(`  MANUAL: LegalDocumentScreen.tsx — add '${code}' to LegalLanguage, TERMS.${code}, PRIVACY.${code}, resolveLegalLanguage`);

// PersonalInformationScreen — tell user to do manually
console.log(`  MANUAL: PersonalInformationScreen.tsx — add getAppLanguage() === '${code}' ? t('appearance.language.${code}Name') : branch`);

console.log(`\nDone. Next: create src/i18n/locales/${code}.ts then run: node scripts/check-language-parity.js ${code}`);
