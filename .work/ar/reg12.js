const fs=require('fs');process.chdir('D:/HAWA/mobile');
const SP='D:/HAWA/.work/ar/';
const langs=require(SP+'langs.js');
const lit=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,'\\n')+"'";
function edit(file,fn){const p='src/'+file;let s=fs.readFileSync(p,'utf8');const crlf=s.includes('\r\n');if(crlf)s=s.replace(/\r\n/g,'\n');const o=s;s=fn(s);if(s===o)throw new Error('no change '+file);fs.writeFileSync(p,crlf?s.replace(/\n/g,'\r\n'):s);}
function rep(s,a,b){if(!s.includes(a))throw new Error('missing: '+a.slice(0,70));return s.replace(a,()=>b);}
const codes=langs.map(l=>l.code);
const extra={};for(const l of langs){try{extra[l.code]=JSON.parse(fs.readFileSync(SP+`out_${l.code}/extra_01.json`,'utf8'));}catch(e){extra[l.code]=null;}}
const en0=JSON.parse(fs.readFileSync(SP+'jobs2/extra_01.json','utf8'));
// ICU weekday names (Monday first)
const wk=(l,style)=>[0,1,2,3,4,5,6].map(i=>new Intl.DateTimeFormat(l.locale,{weekday:style}).format(new Date(2026,2,2+i)));

edit('state/themePreferences.ts',s=>{
 s=rep(s,"| 'lo' | 'ar';","| 'lo' | 'ar' | "+codes.map(c=>"'"+c+"'").join(' | ')+";");
 s=rep(s,"|| value === 'ar';","|| value === 'ar' || "+codes.map(c=>"value === '"+c+"'").join(' || ')+";");
 const regions={kab:['dz'],om:['et','ke'],ti:['er','et','ethi','ethi-er','ethi-et'],rw:['rw'],rn:['bi'],ig:['ng'],yo:['ng','bj'],zu:['za'],xh:['za'],sn:['zw'],ln:['cd','cg','ao','cf'],ff:['latn','latn-sn','sn','gn','mr','ml','ne','cm']};
 const entries=[];for(const c of codes)for(const r of regions[c])entries.push("'"+c+'-'+r+"': '"+c+"'");
 s=rep(s,"const EN_US_ALIASES","/** The twelve African languages added after Arabic (kab om ti rw rn ig yo zu xh sn ln ff): stored values written with a region or script. Every 'xx-*' device tag also\n * reaches them through the bare-language retry of languageFromLocaleTag. */\nconst AFRICAN_ALIASES: Record<string, AwaAppLanguage> = {"+entries.join(', ')+"};\n\nconst EN_US_ALIASES");
 s=rep(s,"  if (typeof value === 'string' && AR_ALIASES.has(","  if (typeof value === 'string') {\n    const african = AFRICAN_ALIASES[value.trim().toLowerCase().replace(/_/g, '-')];\n    if (african) {\n      return african;\n    }\n  }\n  if (typeof value === 'string' && AR_ALIASES.has(");
 return s;});
edit('i18n/editorialLanguage.ts',s=>{
 s=rep(s,"| 'lo' | 'ar';","| 'lo' | 'ar' | "+codes.map(c=>"'"+c+"'").join(' | ')+";");
 s=rep(s,"  // Arabic (ar, ar-SA","  // The twelve African languages (kab om ti rw rn ig yo zu xh sn ln ff, with any region / script subtags) resolve to their own block.\n  if (typeof language === 'string' && /^("+codes.join('|')+")([-_][a-z0-9]+)*$/i.test(language.trim())) {\n    return language.trim().split(/[-_]/)[0].toLowerCase() as EditorialLanguage;\n  }\n  // Arabic (ar, ar-SA");
 return s;});
edit('i18n/index.ts',s=>{
 s=rep(s,"import {ar} from './locales/ar';\n","import {ar} from './locales/ar';\n"+codes.map(c=>`import {${c}} from './locales/${c}';\n`).join(''));
 s=rep(s,"    ar: {translation: ar},\n","    ar: {translation: ar},\n    // kab om ti rw rn ig yo zu xh sn ln ff: complete dictionaries (AI-written, native review required); English is their safety net.\n"+codes.map(c=>`    ${c}: {translation: ${c}},\n`).join(''));
 return s;});
edit('utils/cycleMath.ts',s=>{
 s=rep(s,"export const WEEK_DAYS_ID =",langs.map(l=>`export const WEEK_DAYS_${l.code.toUpperCase()} = [${wk(l,'short').map(lit).join(', ')}];\n`).join('')+"export const WEEK_DAYS_ID =");
 s=rep(s,"  if (language === 'ar') {return WEEK_DAYS_AR;}\n","  if (language === 'ar') {return WEEK_DAYS_AR;}\n"+langs.map(l=>`  if (language === '${l.code}') {return WEEK_DAYS_${l.code.toUpperCase()};}\n`).join(''));
 s=rep(s,"  if (language === 'ar') {return 'ar-u-nu-latn';}\n","  if (language === 'ar') {return 'ar-u-nu-latn';}\n"+langs.map(l=>`  if (language === '${l.code}') {return '${l.locale}';}\n`).join(''));
 const LAT=['Muharram','Safar','Rabiʿ al-Awwal','Rabiʿ al-Thani','Jumada al-Awwal','Jumada al-Thani','Rajab','Shaʿban','Ramadan','Shawwal','Dhu al-Qiʿda','Dhu al-Hijja'];
 const ETH=['ሙሓረም','ሰፈር','ረቢዕ ኣል-ኣወል','ረቢዕ ኣል-ኣኺር','ጀማድ ኣል-ኣወል','ጀማድ ኣል-ኣኺር','ረጀብ','ሸዕባን','ረመዳን','ሸዋል','ዙል-ቅዕዳ','ዙል-ሂጃ'];
 s=rep(s,"const COMPOSED_HIJRI: Record<string, ComposedHijri | undefined> = {",
  "// Twelve African languages (kab om ti rw rn ig yo zu xh sn ln ff): ICU has no Hijri month names for them, so the Hijri date is composed from the numeric Islamic calendar parts\n// (Western digits) with the common transliterated month names (Latin; Ethiopic for Tigrinya) and the era mark H. NATIVE REVIEW REQUIRED for the month spellings.\nconst LATIN_HIJRI_MONTHS = ["+LAT.map(lit).join(', ')+"];\nconst ETHIOPIC_HIJRI_MONTHS = ["+ETH.map(lit).join(', ')+"];\nconst africanHijri = (months: readonly string[]): ComposedHijri => ({\n  months,\n  date: (year, month, day) => `${day} ${month} ${year} H`,\n  monthYear: (year, month) => `${month} ${year} H`,\n});\nconst COMPOSED_HIJRI: Record<string, ComposedHijri | undefined> = {\n"+langs.map(l=>`  ${l.code}: africanHijri(${l.code==='ti'?'ETHIOPIC_HIJRI_MONTHS':'LATIN_HIJRI_MONTHS'}),\n`).join(''));
 return s;});
for(const [file,asConst] of [['screens/CycleInformationScreen.tsx',false],['screens/pregnancy/PregnancyMedicalInformationScreen.tsx',true]]){
 edit(file,s=>{
  s=rep(s,"const WEEK_DAYS_AR = ","\n".slice(1)+langs.map(l=>`const WEEK_DAYS_${l.code.toUpperCase()} = [${wk(l,'narrow').map(lit).join(', ')}]${asConst?' as const':''};\n`).join('')+"const WEEK_DAYS_AR = ");
  s=rep(s,"  if (language === 'ar') {return WEEK_DAYS_AR;}\n","  if (language === 'ar') {return WEEK_DAYS_AR;}\n"+langs.map(l=>`  if (language === '${l.code}') {return WEEK_DAYS_${l.code.toUpperCase()};}\n`).join(''));
  return s;});}
edit('screens/AppearanceScreen.tsx',s=>{
 s=rep(s,"  ar: {label: 'العربية',","  "+langs.map(l=>`${l.code}: {label: ${lit(l.endonym)}, subtitle: ${lit((extra[l.code]&&extra[l.code].selectorSubtitle)||('Use AWA in '+l.en))}},\n  `).join('')+"ar: {label: 'العربية',");
 s=rep(s,"  ar: 'arabicName',\n","  ar: 'arabicName',\n"+langs.map(l=>`  ${l.code}: '${l.key}',\n`).join(''));
 s=rep(s,"  {id: 'ar', flag: '🇸🇦', ...LANGUAGE_SELF_LABELS.ar},\n","  {id: 'ar', flag: '🇸🇦', ...LANGUAGE_SELF_LABELS.ar},\n"+langs.map(l=>`  {id: '${l.code}', flag: '${l.flag}', ...LANGUAGE_SELF_LABELS.${l.code}},\n`).join(''));
 return s;});
edit('screens/PersonalInformationScreen.tsx',s=>{
 s=rep(s,"    getAppLanguage() === 'ar'\n","    "+langs.map(l=>`getAppLanguage() === '${l.code}'\n      ? t('appearance.language.${l.key}')\n      : `).join('')+"getAppLanguage() === 'ar'\n");
 return s;});
edit('screens/LegalDocumentScreen.tsx',s=>{
 s=rep(s,"| 'lo' | 'ar';","| 'lo' | 'ar' | "+codes.map(c=>"'"+c+"'").join(' | ')+";");
 const arr=(kind,l)=>{const src=(extra[l.code]&&extra[l.code][kind])||en0[kind];return `  ${l.code}: [\n`+src.map(x=>`    {title: ${lit(x.title)}, body: ${lit(x.body)}},\n`).join('')+'  ],\n';};
 let n=0;
 s=s.replace(/^  ar: \[\n/gm,m=>{n++;const kind=n===1?'terms':'privacy';return langs.map(l=>arr(kind,l)).join('')+m;});
 if(n!==2)throw new Error('legal ar blocks '+n);
 s=rep(s,"  if (language === 'ar') {return 'ar';}\n","  if (language === 'ar') {return 'ar';}\n"+langs.map(l=>`  if (language === '${l.code}') {return '${l.code}';}\n`).join(''));
 return s;});
edit('i18n/editorialImages.ts',s=>{
 s=rep(s,"  readonly ar?: ImageSourcePropType;\n","  readonly ar?: ImageSourcePropType;\n"+codes.map(c=>`  readonly ${c}?: ImageSourcePropType;\n`).join(''));
 let i=0;
 s=s.replace(/^    ar: '.*',\n/gm,m=>{const idx=i++;return m+langs.map(l=>`    ${l.code}: ${lit((extra[l.code]&&extra[l.code].imageAlts&&extra[l.code].imageAlts[idx])||en0.imageAlts[idx])},\n`).join('');});
 if(i!==3)throw new Error('alts '+i);
 return s;});
edit('data/pregnancyWeekData.ts',s=>rep(s,"    ar: PregnancyWeekEditorialContent;\n","    ar: PregnancyWeekEditorialContent;\n"+codes.map(c=>`    ${c}: PregnancyWeekEditorialContent;\n`).join('')));
edit('screens/library/UnderstandCycleArticleScreen.tsx',s=>rep(s,"i18n.language === 'ar' ? 'ar' :","i18n.language === 'ar' ? 'ar' : "+codes.map(c=>`i18n.language === '${c}' ? '${c}' :`).join(' ')+" "));
console.log('registered',codes.length,'languages; extra outputs present:',Object.entries(extra).filter(([,v])=>v).map(([k])=>k).join(','));
