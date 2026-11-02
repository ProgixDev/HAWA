// American English ('en-US') spelling = the English text ('en') with its British spellings replaced. AWA ships ONE English text; the US variant is
// derived from it by this word list instead of being duplicated: library articles (ptBrEditorial.ts), pregnancy-week texts and the dictionary overlay
// (locales/enUS.ts, generated with the same list) all use it. Whole words only, case preserved (litre → liter, Litre → Liter, LITRE → LITER); a string
// with no British spelling is returned unchanged.
const US_SPELLING: Readonly<Record<string, string>> = {
  litre: 'liter',
  litres: 'liters',
  fibre: 'fiber',
  fibres: 'fibers',
  organisation: 'organization',
  organisations: 'organizations',
  foetus: 'fetus',
  foetuses: 'fetuses',
  foetal: 'fetal',
  pyjama: 'pajama',
  pyjamas: 'pajamas',
  programme: 'program',
  programmes: 'programs',
  centre: 'center',
  centres: 'centers',
  caesarean: 'cesarean',
  behaviour: 'behavior',
  behaviours: 'behaviors',
  catalogue: 'catalog',
  cancelled: 'canceled',
  cancelling: 'canceling',
  colour: 'color',
  colours: 'colors',
  coloured: 'colored',
  oestrogen: 'estrogen',
  anaemia: 'anemia',
  paediatric: 'pediatric',
  paediatrician: 'pediatrician',
  gynaecologist: 'gynecologist',
  gynaecology: 'gynecology',
  haemoglobin: 'hemoglobin',
  oedema: 'edema',
  favour: 'favor',
  favourite: 'favorite',
  labour: 'labor',
  tumour: 'tumor',
  odour: 'odor',
  neighbour: 'neighbor',
  ageing: 'aging',
  whilst: 'while',
  recognise: 'recognize',
  recognised: 'recognized',
  realise: 'realize',
  realised: 'realized',
  organise: 'organize',
  organised: 'organized',
  personalise: 'personalize',
  personalised: 'personalized',
  prioritise: 'prioritize',
  summarise: 'summarize',
  minimise: 'minimize',
  stabilise: 'stabilize',
  apologise: 'apologize',
  customise: 'customize',
  analyse: 'analyze',
  analysed: 'analyzed',
  travelled: 'traveled',
  travelling: 'traveling',
  grey: 'gray',
  tyre: 'tire',
  tyres: 'tires',
  metre: 'meter',
  metres: 'meters',
  practise: 'practice',
  sceptical: 'skeptical',
  judgement: 'judgment',
  sulphur: 'sulfur',
  mould: 'mold',
  manoeuvre: 'maneuver',
  anaesthesia: 'anesthesia',
  anaesthetic: 'anesthetic',
  haemorrhage: 'hemorrhage',
  leukaemia: 'leukemia',
  faeces: 'feces',
  theatre: 'theater',
  enrol: 'enroll',
  fulfil: 'fulfill',
  licence: 'license',
  defence: 'defense',
};

const US_SPELLING_PATTERN = new RegExp(`\\b(${Object.keys(US_SPELLING).join('|')})\\b`, 'gi');

/** One string with its British spellings replaced by the American ones. */
export function toUsSpelling(text: string): string {
  return text.replace(US_SPELLING_PATTERN, word => {
    const us = US_SPELLING[word.toLowerCase()];
    if (word.length > 1 && word === word.toUpperCase()) {return us.toUpperCase();}
    return word[0] === word[0].toUpperCase() ? us[0].toUpperCase() + us.slice(1) : us;
  });
}

/** A deep copy of an English content object (strings, arrays, plain objects) in which every string is in American spelling. */
export function applyUsSpelling<T>(value: T): T {
  if (typeof value === 'string') {return toUsSpelling(value) as unknown as T;}
  if (Array.isArray(value)) {return value.map(item => applyUsSpelling(item)) as unknown as T;}
  if (value && typeof value === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {copy[key] = applyUsSpelling(item);}
    return copy as T;
  }
  return value;
}
