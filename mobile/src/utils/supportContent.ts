export type ObjectiveId =
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'menopause'
  | 'pregnancy'
  | 'postpartum'
  | 'loss';

export type FaqCategory =
  | 'Suivre mon cycle'
  | 'Essayer de concevoir'
  | 'Contraception'
  | 'Cycles irréguliers / SOPK'
  | 'Périménopause / Ménopause'
  | 'Suivi de grossesse'
  | 'Post-partum'
  | 'Après une fausse couche'
  | 'Repères spirituels'
  | 'Journal quotidien'
  | 'Données & confidentialité';

export type FaqId =
  | 'cycle-record-period'
  | 'cycle-edit-period'
  | 'cycle-predictions'
  | 'cycle-flow'
  | 'cycle-calendar'
  | 'conceive-fertile-window'
  | 'conceive-ovulation'
  | 'conceive-temperature'
  | 'conceive-cervical-mucus'
  | 'conceive-lh-test'
  | 'conceive-intercourse'
  | 'contraception-method'
  | 'contraception-pill-reminder'
  | 'contraception-forgotten-pill'
  | 'contraception-history'
  | 'contraception-predictions'
  | 'irregular-long-cycle'
  | 'irregular-symptoms'
  | 'irregular-acne-hair'
  | 'irregular-weight'
  | 'irregular-predictions'
  | 'menopause-symptoms'
  | 'menopause-hot-flashes'
  | 'menopause-sleep'
  | 'menopause-hormonal-treatment'
  | 'menopause-labs'
  | 'pregnancy-due-date'
  | 'pregnancy-weekly'
  | 'pregnancy-appointments'
  | 'pregnancy-reminders'
  | 'pregnancy-journal'
  | 'postpartum-lochia'
  | 'postpartum-cycle-return'
  | 'postpartum-breastfeeding'
  | 'postpartum-recovery'
  | 'postpartum-nifas'
  | 'loss-bleeding'
  | 'loss-cycle-return'
  | 'loss-symptoms'
  | 'loss-notes'
  | 'loss-conceive-again'
  | 'spiritual-hijri'
  | 'spiritual-purity'
  | 'spiritual-prayer-return'
  | 'spiritual-qadaa'
  | 'spiritual-nifas'
  | 'spiritual-istihada'
  | 'journal-what-can-track'
  | 'journal-intimacy'
  | 'journal-private-photos'
  | 'security-private-data'
  | 'security-export'
  | 'security-delete';

export type FaqItem = {
  id: FaqId;
  icon: string;
  question: string;
  subtitle: string;
  answer: string;
  category: FaqCategory;
  objective?: ObjectiveId;
  featured?: boolean;
};

/** A function compatible with react-i18next's useTranslation() `t` — every
 * consumer here is a screen component, so this is always the real `t`, never
 * the `i18n.t` singleton (unlike the non-component reminder-scheduling
 * files). */
export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// `category` stays the ORIGINAL French literal here — a stable internal
// identifier (used for filtering: SPIRITUAL_FAQ_ITEMS, getFaqByCategory(),
// etc.), never renamed. Its DISPLAYED label is looked up separately via
// faqCategoryLabel() below, from notifications-independent help.categories.*
// keys, so English readers never see this French identifier on screen.
type FaqItemBase = Omit<FaqItem, 'question' | 'subtitle' | 'answer'>;

const FAQ_ITEMS_BASE: FaqItemBase[] = [
  // ============================================================
  // 1. SUIVRE MON CYCLE
  // ============================================================
  {id: 'cycle-record-period', icon: 'water-outline', category: 'Suivre mon cycle', objective: 'cycle', featured: true},
  {id: 'cycle-edit-period', icon: 'calendar-edit', category: 'Suivre mon cycle', objective: 'cycle'},
  {id: 'cycle-predictions', icon: 'chart-bell-curve', category: 'Suivre mon cycle', objective: 'cycle'},
  {id: 'cycle-flow', icon: 'water', category: 'Suivre mon cycle', objective: 'cycle'},
  {id: 'cycle-calendar', icon: 'calendar-month-outline', category: 'Suivre mon cycle', objective: 'cycle'},

  // ============================================================
  // 2. ESSAYER DE CONCEVOIR
  // ============================================================
  {id: 'conceive-fertile-window', icon: 'leaf', category: 'Essayer de concevoir', objective: 'conceive', featured: true},
  {id: 'conceive-ovulation', icon: 'egg-outline', category: 'Essayer de concevoir', objective: 'conceive'},
  {id: 'conceive-temperature', icon: 'thermometer', category: 'Essayer de concevoir', objective: 'conceive'},
  {id: 'conceive-cervical-mucus', icon: 'water-opacity', category: 'Essayer de concevoir', objective: 'conceive'},
  {id: 'conceive-lh-test', icon: 'test-tube', category: 'Essayer de concevoir', objective: 'conceive'},
  {id: 'conceive-intercourse', icon: 'heart-outline', category: 'Essayer de concevoir', objective: 'conceive'},

  // ============================================================
  // 3. CONTRACEPTION
  // ============================================================
  {id: 'contraception-method', icon: 'shield-check-outline', category: 'Contraception', objective: 'contraception', featured: true},
  {id: 'contraception-pill-reminder', icon: 'bell-outline', category: 'Contraception', objective: 'contraception'},
  {id: 'contraception-forgotten-pill', icon: 'pill-off', category: 'Contraception', objective: 'contraception'},
  {id: 'contraception-history', icon: 'history', category: 'Contraception', objective: 'contraception'},
  {id: 'contraception-predictions', icon: 'calendar-question', category: 'Contraception', objective: 'contraception'},

  // ============================================================
  // 4. CYCLES IRRÉGULIERS / SOPK
  // ============================================================
  {id: 'irregular-long-cycle', icon: 'chart-timeline-variant', category: 'Cycles irréguliers / SOPK', objective: 'irregular', featured: true},
  {id: 'irregular-symptoms', icon: 'heart-pulse', category: 'Cycles irréguliers / SOPK', objective: 'irregular'},
  {id: 'irregular-acne-hair', icon: 'face-woman-outline', category: 'Cycles irréguliers / SOPK', objective: 'irregular'},
  {id: 'irregular-weight', icon: 'scale-bathroom', category: 'Cycles irréguliers / SOPK', objective: 'irregular'},
  {id: 'irregular-predictions', icon: 'chart-line-variant', category: 'Cycles irréguliers / SOPK', objective: 'irregular'},

  // ============================================================
  // 5. PÉRIMÉNOPAUSE / MÉNOPAUSE
  // ============================================================
  {id: 'menopause-symptoms', icon: 'flower-outline', category: 'Périménopause / Ménopause', objective: 'menopause', featured: true},
  {id: 'menopause-hot-flashes', icon: 'weather-sunny-alert', category: 'Périménopause / Ménopause', objective: 'menopause'},
  {id: 'menopause-sleep', icon: 'weather-night', category: 'Périménopause / Ménopause', objective: 'menopause'},
  {id: 'menopause-hormonal-treatment', icon: 'pill', category: 'Périménopause / Ménopause', objective: 'menopause'},
  {id: 'menopause-labs', icon: 'test-tube', category: 'Périménopause / Ménopause', objective: 'menopause'},

  // ============================================================
  // 6. GROSSESSE
  // ============================================================
  {id: 'pregnancy-due-date', icon: 'calendar-clock', category: 'Suivi de grossesse', objective: 'pregnancy', featured: true},
  {id: 'pregnancy-weekly', icon: 'calendar-week', category: 'Suivi de grossesse', objective: 'pregnancy'},
  {id: 'pregnancy-appointments', icon: 'calendar-account-outline', category: 'Suivi de grossesse', objective: 'pregnancy'},
  {id: 'pregnancy-reminders', icon: 'bell-ring-outline', category: 'Suivi de grossesse', objective: 'pregnancy'},
  {id: 'pregnancy-journal', icon: 'notebook-heart-outline', category: 'Suivi de grossesse', objective: 'pregnancy'},

  // ============================================================
  // 7. POST-PARTUM
  // ============================================================
  {id: 'postpartum-lochia', icon: 'water-outline', category: 'Post-partum', objective: 'postpartum', featured: true},
  {id: 'postpartum-cycle-return', icon: 'calendar-refresh-outline', category: 'Post-partum', objective: 'postpartum'},
  {id: 'postpartum-breastfeeding', icon: 'baby-bottle-outline', category: 'Post-partum', objective: 'postpartum'},
  {id: 'postpartum-recovery', icon: 'heart-pulse', category: 'Post-partum', objective: 'postpartum'},
  {id: 'postpartum-nifas', icon: 'mosque', category: 'Post-partum', objective: 'postpartum'},

  // ============================================================
  // 8. APRÈS UNE FAUSSE COUCHE
  // ============================================================
  {id: 'loss-bleeding', icon: 'water-outline', category: 'Après une fausse couche', objective: 'loss', featured: true},
  {id: 'loss-cycle-return', icon: 'calendar-refresh-outline', category: 'Après une fausse couche', objective: 'loss'},
  {id: 'loss-symptoms', icon: 'heart-pulse', category: 'Après une fausse couche', objective: 'loss'},
  {id: 'loss-notes', icon: 'notebook-edit-outline', category: 'Après une fausse couche', objective: 'loss'},
  {id: 'loss-conceive-again', icon: 'heart-plus-outline', category: 'Après une fausse couche', objective: 'loss'},

  // ============================================================
  // REPÈRES SPIRITUELS
  // ============================================================
  {id: 'spiritual-hijri', icon: 'moon-waning-crescent', category: 'Repères spirituels', featured: true},
  {id: 'spiritual-purity', icon: 'water-check-outline', category: 'Repères spirituels'},
  {id: 'spiritual-prayer-return', icon: 'mosque', category: 'Repères spirituels'},
  {id: 'spiritual-qadaa', icon: 'food-apple-outline', category: 'Repères spirituels'},
  {id: 'spiritual-nifas', icon: 'baby-face-outline', category: 'Repères spirituels'},
  {id: 'spiritual-istihada', icon: 'book-open-page-variant-outline', category: 'Repères spirituels'},

  // ============================================================
  // JOURNAL QUOTIDIEN
  // ============================================================
  {id: 'journal-what-can-track', icon: 'notebook-edit-outline', category: 'Journal quotidien'},
  {id: 'journal-intimacy', icon: 'heart-outline', category: 'Journal quotidien'},
  {id: 'journal-private-photos', icon: 'camera-lock-outline', category: 'Journal quotidien'},

  // ============================================================
  // DONNÉES & CONFIDENTIALITÉ
  // ============================================================
  {id: 'security-private-data', icon: 'shield-lock-outline', category: 'Données & confidentialité', featured: true},
  {id: 'security-export', icon: 'export-variant', category: 'Données & confidentialité'},
  {id: 'security-delete', icon: 'delete-outline', category: 'Données & confidentialité'},
];

const FAQ_CATEGORY_KEYS: Record<FaqCategory, string> = {
  'Suivre mon cycle': 'cycle',
  'Essayer de concevoir': 'conceive',
  Contraception: 'contraception',
  'Cycles irréguliers / SOPK': 'irregular',
  'Périménopause / Ménopause': 'menopause',
  'Suivi de grossesse': 'pregnancy',
  'Post-partum': 'postpartum',
  'Après une fausse couche': 'loss',
  'Repères spirituels': 'spiritual',
  'Journal quotidien': 'journal',
  'Données & confidentialité': 'privacy',
};

/** The DISPLAYED label for a FaqCategory identifier — never the identifier
 * itself, which stays the original French literal (see FaqItemBase above). */
export function faqCategoryLabel(category: FaqCategory, t: TranslateFn): string {
  return t(`help.categories.${FAQ_CATEGORY_KEYS[category]}`);
}

/** Builds the full FAQ list with its current-language question/subtitle/
 * answer text, from the shared, language-independent FAQ_ITEMS_BASE. Called
 * fresh by every consuming screen's own useTranslation() `t` — never cached
 * across a language change. */
export function getFaqItems(t: TranslateFn): FaqItem[] {
  return FAQ_ITEMS_BASE.map(base => ({
    ...base,
    question: t(`help.faq.${base.id}.question`),
    subtitle: t(`help.faq.${base.id}.subtitle`),
    answer: t(`help.faq.${base.id}.answer`),
  }));
}

// A managed daughter profile's functional objective is always "Suivre mon
// cycle" (see CLAUDE.md §4 objective isolation) — her "Aide & support" is
// limited to this menstrual-cycle-tracking topic set: every FAQ item whose
// `objective` is 'cycle', plus the one general journal item explaining what
// the daily journal can track (she keeps the full journal, minus Vie
// intime). Every other objective/feature-specific topic (pregnancy, AWA à
// deux, spiritual markers, premium marketing, etc.) is excluded — never
// deleted from getFaqItems() itself, only filtered out of what she's
// offered. 'journal-what-can-track's shared subtitle/answer mentions "vie
// intime" — accurate for the mother (who keeps that feature) but never true
// for a managed daughter profile (Vie intime is hidden for her — see
// DailyJournalCard.tsx's hideIntimacy prop). Rather than editing the shared
// item (which would also change the mother's own Help wording), this is a
// daughter-only override of that one item's display copy (help.faq.
// journal-what-can-track.subtitleDaughter/answerDaughter) — same id/icon/
// category/question, real available features only.
function journalFaqForDaughter(t: TranslateFn): FaqItem {
  const base = getFaqItems(t).find(item => item.id === 'journal-what-can-track') as FaqItem;
  return {
    ...base,
    subtitle: t('help.faq.journal-what-can-track.subtitleDaughter'),
    answer: t('help.faq.journal-what-can-track.answerDaughter'),
  };
}

export function getCycleTrackingFaqItems(t: TranslateFn): FaqItem[] {
  return getFaqItems(t)
    .filter(item => item.objective === 'cycle')
    .concat(journalFaqForDaughter(t));
}

export function getFeaturedFaqItems(t: TranslateFn): FaqItem[] {
  return getFaqItems(t).filter(item => item.featured);
}

export function getObjectiveFaqItems(t: TranslateFn): FaqItem[] {
  return getFaqItems(t).filter(item => Boolean(item.objective));
}

export function getSpiritualFaqItems(t: TranslateFn): FaqItem[] {
  return getFaqItems(t).filter(item => item.category === 'Repères spirituels');
}

export function getJournalFaqItems(t: TranslateFn): FaqItem[] {
  return getFaqItems(t).filter(item => item.category === 'Journal quotidien');
}

export function getPrivacyFaqItems(t: TranslateFn): FaqItem[] {
  return getFaqItems(t).filter(item => item.category === 'Données & confidentialité');
}

export function getFaqById(t: TranslateFn, id: FaqId): FaqItem | undefined {
  return getFaqItems(t).find(item => item.id === id);
}

export function getFaqByCategory(t: TranslateFn, category: FaqCategory): FaqItem[] {
  return getFaqItems(t).filter(item => item.category === category);
}

export function getFaqByObjective(t: TranslateFn, objective: ObjectiveId): FaqItem[] {
  return getFaqItems(t).filter(item => item.objective === objective);
}

// ============================================================
// GUIDES
// ============================================================

export type GuideId =
  | 'getting-started'
  | 'cycle'
  | 'conceive'
  | 'contraception'
  | 'irregular'
  | 'menopause'
  | 'pregnancy'
  | 'postpartum'
  | 'loss'
  | 'calendar'
  | 'journal'
  | 'spiritual'
  | 'privacy';

export type GuideTone =
  | 'purple'
  | 'green'
  | 'blue'
  | 'rose'
  | 'gold';

export type GuideItem = {
  id: GuideId;
  icon: string;
  title: string;
  text: string;
  tone: GuideTone;
};

// A GuideItem's `category` field existed pre-Phase-5 purely as an internal
// grouping value — SupportResourcesScreens.tsx's GuidesScreen never renders
// it — so it is dropped here rather than translated: there is nothing on
// screen it could leave stale.
type GuideItemBase = Omit<GuideItem, 'title' | 'text'>;

const GUIDE_ITEMS_BASE: readonly GuideItemBase[] = [
  {id: 'getting-started', icon: 'rocket-launch-outline', tone: 'purple'},
  {id: 'cycle', icon: 'calendar-heart', tone: 'rose'},
  {id: 'conceive', icon: 'heart-plus-outline', tone: 'green'},
  {id: 'contraception', icon: 'shield-check-outline', tone: 'blue'},
  {id: 'irregular', icon: 'chart-timeline-variant', tone: 'purple'},
  {id: 'menopause', icon: 'flower-outline', tone: 'gold'},
  {id: 'pregnancy', icon: 'human-pregnant', tone: 'rose'},
  {id: 'postpartum', icon: 'baby-face-outline', tone: 'green'},
  {id: 'loss', icon: 'weather-cloudy-alert', tone: 'blue'},
  {id: 'calendar', icon: 'calendar-month-outline', tone: 'purple'},
  {id: 'journal', icon: 'notebook-edit-outline', tone: 'rose'},
  {id: 'spiritual', icon: 'mosque', tone: 'gold'},
  {id: 'privacy', icon: 'shield-lock-outline', tone: 'blue'},
] as const;

/** Builds the full guides list with its current-language title/text, from
 * the shared, language-independent GUIDE_ITEMS_BASE. */
export function getGuideItems(t: TranslateFn): readonly GuideItem[] {
  return GUIDE_ITEMS_BASE.map(base => ({
    ...base,
    title: t(`help.guides.${base.id}.title`),
    text: t(`help.guides.${base.id}.text`),
  }));
}

export function getGuideById(t: TranslateFn, id: GuideId): GuideItem | undefined {
  return getGuideItems(t).find(item => item.id === id);
}
