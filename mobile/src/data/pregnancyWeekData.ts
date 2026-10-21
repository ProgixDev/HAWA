import type {ImageSourcePropType} from 'react-native';

import {resolveEditorialLanguage, type EditorialLanguage} from '../i18n/editorialLanguage';
import {brazilianWeekContent} from '../i18n/ptBrEditorial';

// ============================================================
// CENTRALIZED WEEK-BY-WEEK PREGNANCY REFERENCE DATA
// ============================================================
//
// The ONE place general, educational, week-by-week fetal/maternal
// reference content lives. PregnancyDashboard's "Ton bébé" card and
// PregnancyWeekScreen both read this file via getPregnancyWeekData(week,
// lang), so they can never disagree and this content is never duplicated.
//
// This is NOT user-specific medical data. Every value below is a general
// population-level reference figure (never the user's own ultrasound
// measurement) and is phrased accordingly ("environ", "moyen(ne)" /
// "about", "average").
//
// SOURCE REGISTRY
// ----------------------------------------------------------------
// NHS_S4L   — NHS Start4Life, "Your pregnancy week by week"
//             (nhs.uk/start4life/pregnancy/week-by-week) — fetal length and
//             the fruit/vegetable size comparison for weeks 4–40 were
//             verified directly against this source (fetched per-week) and
//             then paraphrased below; the comparisons reuse NHS's own
//             published mapping rather than an invented one.
// OB_DATING — Standard obstetric last-menstrual-period (LMP) dating
//             convention (the same convention already implemented in
//             computePregnancyStatus, consistent with NHS/ACOG patient
//             guidance): gestation is counted from the first day of the
//             last period, so weeks 1–2 predate ovulation/fertilization.
//
// MEASUREMENT CONSISTENCY NOTE (see task requirement on not silently
// mixing measurement systems): NHS measures the fetus head-to-bottom
// (crown-rump) through week 19, then switches to head-to-heel from week 20
// onward once the legs can be seen extended — this produces a real, one-time
// jump in the published length figures at week 20, not an error. The week
// 20 entry's description says so explicitly rather than hiding it.
// `weight` is intentionally left undefined for every week: the verified
// source above does not publish a specific gram figure per week, and no
// number is fabricated here to fill that gap.
// `comparison` is intentionally omitted for weeks 1–3 and 41 (no fetus/no
// published figure yet) and for weeks 4–5 uses NHS's own "poppy seed" /
// "sesame seed" wording rather than a fruit, matching what NHS itself says
// at that stage.
//
// PHASE 7L (bilingual editorial content): the French editorial text below
// is unchanged from before this phase. The English text is a careful,
// non-literal medical translation — never a stronger claim than the French
// (e.g. "peut" always renders as "may/can", never "will"), with every
// numeric value (length, week numbers, durations) preserved exactly, only
// reformatted to English decimal/locale conventions (comma → period).
// `week`, `babyImage`, and `sourceRefs` are language-neutral and are never
// duplicated per language — see PregnancyWeekEntry below.
//
// SPANISH EDITORIAL CONTENT: the `es` object per week is a complete,
// independent translation of the French original (the source language),
// never of the English text. Same careful, non-literal medical-translation
// discipline as English: "peut"/"peuvent" always render as "puede"/"pueden"
// (never a stronger claim), every numeric value is preserved exactly (only
// the decimal separator is localized, comma stays a comma as in French —
// matching established Spanish numeric formatting elsewhere in the app, e.g.
// "64,2 kg" in src/i18n/locales/es.ts), and each week's `es` object has
// exactly the same fields present as that week's `fr`/`en` objects (no
// invented `comparison` for weeks 1–3/41, no `weight` anywhere).
// ============================================================

export type PregnancyWeekData = {
  week: number;
  /** Decorative fetal/pregnancy illustration for this week. Never claim it is
   * an exact medical visualization of the user's own pregnancy. */
  babyImage?: ImageSourcePropType;
  /** General educational description of fetal development at this week. */
  babyDescription?: string;
  /** General/average reference length (e.g. "Environ 5,4 cm") — a
   * population reference, never the user's own measured value. */
  length?: string;
  /** General/average reference weight. Left undefined project-wide — see
   * source registry note above. */
  weight?: string;
  /** General size comparison, reused from the verified source above. */
  comparison?: string;
  /** General, possible maternal body changes at this stage — phrased as
   * possibilities, never as claims about what this specific user feels.
   * The user's own real symptoms belong to the Pregnancy Journal. */
  bodyChanges?: string[];
  /** General "did you know" / educational, non-diagnostic facts. */
  toKnow?: string[];
  /** Internal source traceability — never rendered in the UI. */
  sourceRefs?: string[];
};

type PregnancyWeekEditorialContent = {
  babyDescription?: string;
  length?: string;
  comparison?: string;
  bodyChanges?: string[];
  toKnow?: string[];
};

type PregnancyWeekEntry = {
  week: number;
  babyImage?: ImageSourcePropType;
  sourceRefs?: string[];
  content: {
    fr: PregnancyWeekEditorialContent;
    en: PregnancyWeekEditorialContent;
    es: PregnancyWeekEditorialContent;
    it: PregnancyWeekEditorialContent;
    tr: PregnancyWeekEditorialContent;
    ru: PregnancyWeekEditorialContent;
    de: PregnancyWeekEditorialContent;
    zh: PregnancyWeekEditorialContent;
    id: PregnancyWeekEditorialContent;
    hi: PregnancyWeekEditorialContent;
    sq: PregnancyWeekEditorialContent;
    ja: PregnancyWeekEditorialContent;
    ko: PregnancyWeekEditorialContent;
    'pt-PT': PregnancyWeekEditorialContent;
    bn: PregnancyWeekEditorialContent;
  };
};

const PREGNANCY_WEEK_DATA: readonly PregnancyWeekEntry[] = [
  // ---------------------------------------------------------- weeks 1–3
  // No embryo/fetus exists yet to describe — see OB_DATING note above.
  {
    week: 1,
    babyImage: require('../assets/images/pregnancy/development/week-01.png'),
    sourceRefs: ['OB_DATING'],
    content: {
      fr: {
        babyDescription:
          'La grossesse est datée à partir du premier jour de tes dernières règles, par convention médicale. À ce stade, la fécondation n’a généralement pas encore eu lieu.',
        bodyChanges: [
          'Cette période précède généralement la conception ; il n’y a habituellement pas encore de changement physique lié à la grossesse.',
        ],
        toKnow: [
          'Compter la grossesse depuis les dernières règles permet d’estimer une date prévue d’accouchement de façon standardisée, même si la conception survient un peu plus tard.',
          'Il est courant de ne remarquer aucun changement à ce stade.',
        ],
      },
      en: {
        babyDescription:
          'Pregnancy is dated from the first day of your last period, by medical convention. At this stage, fertilization has generally not yet taken place.',
        bodyChanges: [
          'This period generally comes before conception; there usually isn’t yet any pregnancy-related physical change.',
        ],
        toKnow: [
          'Counting pregnancy from the last period gives a standardized way of estimating a due date, even though conception actually happens a bit later.',
          'It’s common not to notice any change at this stage.',
        ],
      },
      es: {
        babyDescription:
          'El embarazo se calcula a partir del primer día de tu última regla, por convención médica. En esta etapa, la fecundación generalmente todavía no ha tenido lugar.',
        bodyChanges: [
          'Este periodo suele preceder a la concepción; habitualmente todavía no hay ningún cambio físico relacionado con el embarazo.',
        ],
        toKnow: [
          'Contar el embarazo desde la última regla permite estimar una fecha prevista de parto de forma estandarizada, aunque la concepción ocurra en realidad un poco más tarde.',
          'Es habitual no notar ningún cambio en esta etapa.',
        ],
      },
      it: {
        babyDescription: 'Per convenzione medica, la gravidanza si data a partire dal primo giorno dell’ultima mestruazione. In questa fase, di solito, la fecondazione non è ancora avvenuta.',
        bodyChanges: [
          'Questo periodo precede in genere il concepimento; di solito non c’è ancora alcun cambiamento fisico legato alla gravidanza.',
        ],
        toKnow: [
          'Contare la gravidanza dall’ultima mestruazione offre un modo standardizzato per stimare la data presunta del parto, anche se il concepimento avviene in realtà un po’ più tardi.',
          'È normale non notare alcun cambiamento in questa fase.',
        ],
      },
      tr: {
        babyDescription: 'Tıbbi kurala göre gebelik, son adet döneminin ilk gününden itibaren hesaplanır. Bu aşamada döllenme genellikle henüz gerçekleşmemiştir.',
        bodyChanges: [
          'Bu dönem genellikle gebe kalmadan öncesine denk gelir; gebelikle ilgili bedensel bir değişiklik çoğunlukla henüz görülmez.',
        ],
        toKnow: [
          'Gebeliği son adet döneminden itibaren saymak, gebe kalma aslında biraz daha sonra gerçekleşse de tahmini doğum tarihini hesaplamak için standart bir yol sağlar.',
          'Bu aşamada herhangi bir değişiklik fark etmemek yaygındır.',
        ],
      },
      ru: {
        babyDescription:
          'По медицинской договорённости беременность отсчитывается от первого дня последних месячных. На этом этапе оплодотворение, как правило, ещё не произошло.',
        bodyChanges: [
          'Этот период обычно предшествует зачатию; физических изменений, связанных с беременностью, как правило, ещё нет.',
        ],
        toKnow: [
          'Отсчёт беременности от последних месячных позволяет единым способом рассчитать предполагаемую дату родов, хотя зачатие на самом деле происходит немного позже.',
          'На этом этапе нередко не замечать никаких изменений.',
        ],
      },
      de: {
        babyDescription:
          'Die Schwangerschaft wird nach medizinischer Konvention ab dem ersten Tag deiner letzten Periode gezählt. In dieser Phase hat in der Regel noch keine Befruchtung stattgefunden.',
        bodyChanges: [
          'Diese Zeit liegt in der Regel vor der Empfängnis; körperliche Veränderungen durch die Schwangerschaft gibt es meist noch nicht.',
        ],
        toKnow: [
          'Wenn man die Schwangerschaft ab der letzten Periode zählt, lässt sich der Entbindungstermin einheitlich berechnen – auch wenn die Empfängnis tatsächlich etwas später stattfindet.',
          'Es ist ganz normal, in dieser Phase noch keine Veränderung zu bemerken.',
        ],
      },
      zh: {
        babyDescription: '按医学惯例，孕周从末次月经的第一天开始计算。这一阶段通常还没有发生受精。',
        bodyChanges: [
          '这段时间通常在受孕之前，一般还不会出现与怀孕相关的身体变化。',
        ],
        toKnow: [
          '从末次月经开始计算孕周，可以用统一的方式估算预产期，尽管实际受孕会稍晚一些。',
          '这一阶段没有任何变化是很常见的。',
        ],
      },
      id: {
        babyDescription: 'Kehamilan dihitung mulai dari hari pertama haid terakhirmu, sesuai kesepakatan medis. Pada tahap ini, pembuahan umumnya belum terjadi.',
        bodyChanges: [
          'Masa ini umumnya terjadi sebelum pembuahan; biasanya belum ada perubahan fisik yang berkaitan dengan kehamilan.',
        ],
        toKnow: [
          'Menghitung kehamilan dari haid terakhir memberi cara yang terstandar untuk memperkirakan tanggal persalinan, meskipun pembuahan sebenarnya terjadi sedikit lebih lambat.',
          'Wajar jika kamu belum merasakan perubahan apa pun pada tahap ini.',
        ],
      },
      hi: {
        babyDescription: 'चिकित्सा परंपरा के अनुसार गर्भावस्था की गिनती आपके आख़िरी पीरियड के पहले दिन से की जाती है। इस चरण में आम तौर पर निषेचन अभी नहीं हुआ होता।',
        bodyChanges: [
          'यह समय आम तौर पर गर्भधारण से पहले का होता है; गर्भावस्था से जुड़ा कोई शारीरिक बदलाव अभी प्रायः नहीं होता।',
        ],
        toKnow: [
          'आख़िरी पीरियड से गर्भावस्था की गिनती करने से डिलीवरी की संभावित तारीख़ का अनुमान लगाने का एक मानक तरीक़ा मिलता है, भले ही गर्भधारण असल में कुछ समय बाद होता है।',
          'इस चरण में कोई बदलाव महसूस न होना आम बात है।',
        ],
      },
      sq: {
        babyDescription: 'Shtatzënia llogaritet nga dita e parë e menstruacioneve të fundit, sipas konventës mjekësore. Në këtë fazë, pjellimi zakonisht nuk ka ndodhur ende.',
        bodyChanges: [
          'Kjo periudhë zakonisht vjen para konceptimit; zakonisht nuk ka ende ndonjë ndryshim fizik të lidhur me shtatzëninë.',
        ],
        toKnow: [
          'Llogaritja e shtatzënisë nga menstruacionet e fundit jep një mënyrë të standardizuar për të vlerësuar datën e lindjes, edhe pse konceptimi ndodh në fakt pak më vonë.',
          'Është e zakonshme të mos vërehet asnjë ndryshim në këtë fazë.',
        ],
      },
      ja: {
        babyDescription: '妊娠週数は、医学的な慣例により、最後の生理の初日から数えます。この時期は、通常まだ受精は起きていません。',
        bodyChanges: [
          'この時期は通常、妊娠成立の前にあたり、妊娠による体の変化はまだほとんどありません。',
        ],
        toKnow: [
          '最後の生理から妊娠週数を数えることで、実際の妊娠成立はもう少し後でも、出産予定日を一定の基準で見積もることができます。',
          'この時期には特に変化に気づかないのが一般的です。',
        ],
      },
      ko: {
        babyDescription: '임신 주수는 의학적 관례에 따라 마지막 생리 첫날부터 계산해요. 이 시기에는 대개 아직 수정이 일어나지 않았어요.',
        bodyChanges: [
          '이 기간은 보통 임신이 되기 전이라, 임신으로 인한 몸의 변화는 대개 아직 없어요.',
        ],
        toKnow: [
          '마지막 생리부터 임신 주수를 세면 실제 임신은 조금 더 늦게 이루어지더라도 출산 예정일을 일정한 기준으로 추정할 수 있어요.',
          '이 시기에는 아무런 변화를 느끼지 못하는 경우가 흔해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Por convenção médica, a gravidez conta-se a partir do primeiro dia do último período. Nesta fase, a fecundação geralmente ainda não ocorreu.',
        bodyChanges: [
          'Este período geralmente antecede a conceção; habitualmente ainda não há qualquer alteração física associada à gravidez.',
        ],
        toKnow: [
          'Contar a gravidez a partir do último período permite estimar a data prevista do parto de forma padronizada, ainda que a conceção ocorra, na verdade, um pouco mais tarde.',
          'É comum não notar qualquer alteração nesta fase.',
        ],
      },
      bn: {
        babyDescription: 'চিকিৎসা রীতি অনুযায়ী গর্ভাবস্থার হিসাব শুরু হয় আপনার শেষ মাসিকের প্রথম দিন থেকে। এই পর্যায়ে সাধারণত নিষেক এখনও ঘটেনি।',
        bodyChanges: [
          'এই সময়টি সাধারণত গর্ভধারণের আগে পড়ে; গর্ভাবস্থার সঙ্গে সম্পর্কিত কোনো শারীরিক পরিবর্তন সাধারণত এখনও থাকে না।',
        ],
        toKnow: [
          'গর্ভধারণ আসলে কিছুটা পরে ঘটলেও শেষ মাসিক থেকে গর্ভাবস্থা গণনা করলে প্রসবের সম্ভাব্য তারিখ অনুমান করার একটি প্রমিত উপায় পাওয়া যায়।',
          'এই পর্যায়ে কোনো পরিবর্তন টের না পাওয়া সাধারণ ব্যাপার।',
        ],
      },
    },
  },
  {
    week: 2,
    babyImage: require('../assets/images/pregnancy/development/week-02.png'),
    sourceRefs: ['OB_DATING'],
    content: {
      fr: {
        babyDescription:
          'L’ovulation et une éventuelle fécondation surviennent généralement autour de cette période, selon la durée du cycle de chacune.',
        bodyChanges: [
          'Le moment de l’ovulation peut varier selon la durée du cycle, ce qui influence la date réelle possible de conception.',
          'Il n’y a généralement pas encore de changement physique spécifique à la grossesse à ce stade.',
        ],
        toKnow: ['Le moment exact de l’ovulation varie d’une personne à l’autre, ce qui explique pourquoi cette période reste une estimation.'],
      },
      en: {
        babyDescription:
          'Ovulation and possible fertilization generally occur around this time, depending on each person’s cycle length.',
        bodyChanges: [
          'The timing of ovulation can vary depending on cycle length, which affects the actual possible date of conception.',
          'There is generally no pregnancy-specific physical change yet at this stage.',
        ],
        toKnow: ['The exact timing of ovulation varies from person to person, which is why this period remains an estimate.'],
      },
      es: {
        babyDescription:
          'La ovulación y una posible fecundación suelen producirse alrededor de este periodo, según la duración del ciclo de cada mujer.',
        bodyChanges: [
          'El momento de la ovulación puede variar según la duración del ciclo, lo que influye en la fecha real posible de la concepción.',
          'En esta etapa generalmente todavía no hay ningún cambio físico específico del embarazo.',
        ],
        toKnow: ['El momento exacto de la ovulación varía de una persona a otra, lo que explica por qué este periodo sigue siendo una estimación.'],
      },
      it: {
        babyDescription: 'L’ovulazione e l’eventuale fecondazione avvengono in genere in questo periodo, a seconda della durata del ciclo di ciascuna donna.',
        bodyChanges: [
          'Il momento dell’ovulazione può variare in base alla durata del ciclo, e questo influisce sulla data effettiva del possibile concepimento.',
          'In questa fase, di solito non c’è ancora alcun cambiamento fisico specifico della gravidanza.',
        ],
        toKnow: [
          'Il momento esatto dell’ovulazione varia da donna a donna, ed è per questo che questo periodo resta una stima.',
        ],
      },
      tr: {
        babyDescription: 'Yumurtlama ve olası döllenme genellikle bu sıralarda gerçekleşir; bu, kişinin döngü uzunluğuna göre değişir.',
        bodyChanges: [
          'Yumurtlamanın zamanı döngü uzunluğuna göre değişebilir ve bu da gebe kalmanın gerçek olası tarihini etkiler.',
          'Bu aşamada henüz gebeliğe özgü bir bedensel değişiklik genellikle yoktur.',
        ],
        toKnow: [
          'Yumurtlamanın tam zamanı kişiden kişiye değişir; bu yüzden bu dönem bir tahmin olarak kalır.',
        ],
      },
      ru: {
        babyDescription:
          'Овуляция и возможное оплодотворение, как правило, происходят примерно в этот период — в зависимости от длины цикла у каждой женщины.',
        bodyChanges: [
          'Время овуляции может отличаться в зависимости от длины цикла, и это влияет на фактическую возможную дату зачатия.',
          'На этом этапе, как правило, ещё нет физических изменений, характерных именно для беременности.',
        ],
        toKnow: [
          'Точное время овуляции у разных женщин различается, поэтому этот период остаётся приблизительной оценкой.',
        ],
      },
      de: {
        babyDescription:
          'Der Eisprung und eine mögliche Befruchtung finden in der Regel um diese Zeit statt – je nach Zykluslänge der einzelnen Frau.',
        bodyChanges: [
          'Der Zeitpunkt des Eisprungs kann je nach Zykluslänge variieren, was sich auf den tatsächlich möglichen Tag der Empfängnis auswirkt.',
          'In dieser Phase gibt es in der Regel noch keine körperlichen Veränderungen, die für die Schwangerschaft typisch sind.',
        ],
        toKnow: [
          'Der genaue Zeitpunkt des Eisprungs ist von Frau zu Frau verschieden – deshalb bleibt dieser Zeitraum eine Schätzung.',
        ],
      },
      zh: {
        babyDescription: '排卵和可能的受精通常发生在这个时期，具体取决于每个人的周期长度。',
        bodyChanges: [
          '排卵时间会因周期长度而不同，这会影响实际可能的受孕日期。',
          '这一阶段通常还没有怀孕特有的身体变化。',
        ],
        toKnow: [
          '排卵的确切时间因人而异，所以这段时间仍然只是估算。',
        ],
      },
      id: {
        babyDescription: 'Ovulasi dan kemungkinan pembuahan umumnya terjadi sekitar waktu ini, tergantung pada panjang siklus masing-masing.',
        bodyChanges: [
          'Waktu ovulasi bisa berbeda-beda tergantung panjang siklus, sehingga memengaruhi tanggal pembuahan yang mungkin sebenarnya.',
          'Pada tahap ini umumnya belum ada perubahan fisik khusus akibat kehamilan.',
        ],
        toKnow: [
          'Waktu ovulasi yang tepat berbeda dari satu orang ke orang lain, sehingga masa ini tetap berupa perkiraan.',
        ],
      },
      hi: {
        babyDescription: 'ओव्यूलेशन (अंडोत्सर्ग) और संभावित निषेचन आम तौर पर इसी समय के आसपास होते हैं, जो हर महिला के चक्र की लंबाई पर निर्भर करता है।',
        bodyChanges: [
          'ओव्यूलेशन का समय चक्र की लंबाई के अनुसार अलग-अलग हो सकता है, जिससे गर्भधारण की संभावित तारीख़ पर असर पड़ता है।',
          'इस चरण में आम तौर पर गर्भावस्था से जुड़ा कोई ख़ास शारीरिक बदलाव अभी नहीं होता।',
        ],
        toKnow: [
          'ओव्यूलेशन का सटीक समय हर महिला में अलग होता है, इसलिए यह अवधि केवल एक अनुमान ही रहती है।',
        ],
      },
      sq: {
        babyDescription: 'Ovulacioni dhe pjellimi i mundshëm zakonisht ndodhin rreth kësaj kohe, në varësi të gjatësisë së ciklit të secilës grua.',
        bodyChanges: [
          'Koha e ovulacionit mund të ndryshojë sipas gjatësisë së ciklit, gjë që ndikon në datën e mundshme të konceptimit.',
          'Zakonisht nuk ka ende ndonjë ndryshim fizik specifik të shtatzënisë në këtë fazë.',
        ],
        toKnow: [
          'Koha e saktë e ovulacionit ndryshon nga një grua te tjetra, prandaj kjo periudhë mbetet një vlerësim.',
        ],
      },
      ja: {
        babyDescription: '排卵と、場合によっては受精が、おおよそこの頃に起こります。時期は人それぞれの周期の長さによって異なります。',
        bodyChanges: [
          '排卵の時期は周期の長さによって変わり、実際に妊娠が成立しうる日にも影響します。',
          'この時期は通常、妊娠特有の体の変化はまだありません。',
        ],
        toKnow: [
          '排卵の正確な時期には個人差があるため、この期間はあくまで目安です。',
        ],
      },
      ko: {
        babyDescription: '배란과 수정 가능성은 보통 이 무렵에 생기며, 사람마다 주기 길이에 따라 달라요.',
        bodyChanges: [
          '배란 시기는 주기 길이에 따라 달라질 수 있고, 이는 실제로 임신이 가능한 날짜에도 영향을 줘요.',
          '이 시기에는 임신으로 인한 몸의 변화가 대개 아직 없어요.',
        ],
        toKnow: [
          '정확한 배란 시기는 사람마다 달라서 이 기간은 어디까지나 추정이에요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A ovulação e uma possível fecundação ocorrem geralmente por volta desta altura, consoante a duração do ciclo de cada mulher.',
        bodyChanges: [
          'O momento da ovulação pode variar consoante a duração do ciclo, o que influencia a data real em que a conceção pode ocorrer.',
          'Geralmente ainda não há qualquer alteração física específica da gravidez nesta fase.',
        ],
        toKnow: [
          'O momento exato da ovulação varia de mulher para mulher, por isso este período continua a ser uma estimativa.',
        ],
      },
      bn: {
        babyDescription: 'প্রত্যেকের চক্রের দৈর্ঘ্যের ওপর নির্ভর করে সাধারণত এই সময়ের কাছাকাছি ডিম্বস্ফোটন এবং সম্ভাব্য নিষেক ঘটে।',
        bodyChanges: [
          'চক্রের দৈর্ঘ্য অনুযায়ী ডিম্বস্ফোটনের সময় ভিন্ন হতে পারে, যা গর্ভধারণের প্রকৃত সম্ভাব্য তারিখকে প্রভাবিত করে।',
          'এই পর্যায়ে সাধারণত গর্ভাবস্থার নির্দিষ্ট কোনো শারীরিক পরিবর্তন এখনও থাকে না।',
        ],
        toKnow: [
          'ডিম্বস্ফোটনের সঠিক সময় এক ব্যক্তি থেকে অন্য ব্যক্তিতে ভিন্ন হয়, তাই এই সময়কালটি একটি অনুমানই থেকে যায়।',
        ],
      },
    },
  },
  {
    week: 3,
    babyImage: require('../assets/images/pregnancy/development/week-03.png'),
    sourceRefs: ['OB_DATING'],
    content: {
      fr: {
        babyDescription:
          'Si une fécondation a eu lieu, l’œuf commence à se diviser et à migrer vers l’utérus, mais rien n’est encore détectable par un test de grossesse.',
        bodyChanges: [
          'Cette semaine se situe encore dans la période de datation médicale entourant la conception ; aucun signe physique n’est généralement perceptible à ce stade.',
        ],
        toKnow: ['La plupart des tests de grossesse urinaires deviennent fiables à partir de la semaine suivante environ, une fois l’implantation amorcée.'],
      },
      en: {
        babyDescription:
          'If fertilization has occurred, the egg begins dividing and moving toward the uterus, but nothing is detectable yet by a pregnancy test.',
        bodyChanges: [
          'This week still falls within the medical dating period surrounding conception; no physical sign is generally noticeable at this stage.',
        ],
        toKnow: ['Most urine pregnancy tests become reliable from around the following week, once implantation has begun.'],
      },
      es: {
        babyDescription:
          'Si ha habido fecundación, el óvulo fecundado comienza a dividirse y a desplazarse hacia el útero, pero todavía no se puede detectar nada con una prueba de embarazo.',
        bodyChanges: [
          'Esta semana todavía se sitúa dentro del periodo de datación médica en torno a la concepción; en esta etapa generalmente no hay ningún signo físico perceptible.',
        ],
        toKnow: ['La mayoría de las pruebas de embarazo en orina empiezan a ser fiables aproximadamente a partir de la semana siguiente, una vez iniciada la implantación.'],
      },
      it: {
        babyDescription: 'Se la fecondazione è avvenuta, l’ovulo inizia a dividersi e a spostarsi verso l’utero, ma per ora un test di gravidanza non rileva ancora nulla.',
        bodyChanges: [
          'Questa settimana rientra ancora nel periodo di datazione medica che circonda il concepimento; in genere in questa fase non si nota alcun segno fisico.',
        ],
        toKnow: [
          'La maggior parte dei test di gravidanza sulle urine diventa affidabile a partire dalla settimana successiva circa, quando l’impianto è iniziato.',
        ],
      },
      tr: {
        babyDescription: 'Döllenme gerçekleştiyse yumurta bölünmeye ve rahme doğru ilerlemeye başlar, ancak gebelik testiyle henüz bir şey saptanamaz.',
        bodyChanges: [
          'Bu hafta hâlâ gebe kalma çevresindeki tıbbi tarihleme dönemine denk gelir; bu aşamada genellikle fark edilen bir bedensel belirti yoktur.',
        ],
        toKnow: [
          'İdrar yoluyla yapılan gebelik testlerinin çoğu, yerleşme başladıktan sonra, yaklaşık bir sonraki haftadan itibaren güvenilir hâle gelir.',
        ],
      },
      ru: {
        babyDescription:
          'Если оплодотворение произошло, яйцеклетка начинает делиться и продвигаться к матке, но тест на беременность пока ничего не покажет.',
        bodyChanges: [
          'Эта неделя всё ещё относится к периоду медицинского отсчёта вокруг зачатия; физических признаков на этом этапе, как правило, не заметно.',
        ],
        toKnow: [
          'Большинство тестов на беременность по моче становятся надёжными примерно со следующей недели, когда начинается имплантация.',
        ],
      },
      de: {
        babyDescription:
          'Wenn eine Befruchtung stattgefunden hat, beginnt sich die Eizelle zu teilen und wandert in Richtung Gebärmutter. Ein Schwangerschaftstest kann aber noch nichts nachweisen.',
        bodyChanges: [
          'Diese Woche liegt noch im medizinischen Zeitraum rund um die Empfängnis; in dieser Phase ist in der Regel noch kein körperliches Anzeichen spürbar.',
        ],
        toKnow: [
          'Die meisten Schwangerschaftstests mit Urin werden etwa ab der folgenden Woche zuverlässig, sobald die Einnistung begonnen hat.',
        ],
      },
      zh: {
        babyDescription: '如果已经受精，受精卵会开始分裂并向子宫移动，但验孕还检测不到。',
        bodyChanges: [
          '这一周仍处于围绕受孕的医学计算期内，通常不会有明显的身体信号。',
        ],
        toKnow: [
          '大多数尿液验孕试纸要到下周前后、着床开始之后才比较可靠。',
        ],
      },
      id: {
        babyDescription: 'Jika pembuahan telah terjadi, sel telur mulai membelah dan bergerak menuju rahim, tetapi belum bisa terdeteksi oleh tes kehamilan.',
        bodyChanges: [
          'Minggu ini masih termasuk masa penghitungan medis di sekitar pembuahan; umumnya belum ada tanda fisik yang terasa pada tahap ini.',
        ],
        toKnow: [
          'Sebagian besar tes kehamilan urine baru dapat diandalkan mulai sekitar minggu berikutnya, setelah implantasi dimulai.',
        ],
      },
      hi: {
        babyDescription: 'अगर निषेचन हो चुका है, तो अंडा विभाजित होना शुरू करता है और गर्भाशय की ओर बढ़ता है, लेकिन प्रेगनेंसी टेस्ट में अभी कुछ पता नहीं चलता।',
        bodyChanges: [
          'यह सप्ताह अभी भी गर्भधारण के आसपास की चिकित्सा गणना की अवधि में आता है; इस चरण में आम तौर पर कोई शारीरिक संकेत महसूस नहीं होता।',
        ],
        toKnow: [
          'यूरिन से होने वाले ज़्यादातर प्रेगनेंसी टेस्ट अगले सप्ताह के आसपास, इम्प्लांटेशन शुरू होने के बाद भरोसेमंद हो जाते हैं।',
        ],
      },
      sq: {
        babyDescription: 'Nëse pjellimi ka ndodhur, veza fillon të ndahet dhe të lëvizë drejt mitrës, por testi i shtatzënisë nuk mund të zbulojë ende asgjë.',
        bodyChanges: [
          'Kjo javë bën ende pjesë në periudhën mjekësore të llogaritjes që rrethon konceptimin; zakonisht nuk vërehet asnjë shenjë fizike në këtë fazë.',
        ],
        toKnow: [
          'Shumica e testeve të shtatzënisë me urinë bëhen të besueshme nga java e ardhshme, kur ngjitja e embrionit ka filluar.',
        ],
      },
      ja: {
        babyDescription: '受精が起きていれば、受精卵は分裂しながら子宮へ向かって進み始めますが、妊娠検査薬ではまだ検出できません。',
        bodyChanges: [
          'この週も、妊娠の成立前後にあたる医学上の数え方の期間に含まれます。通常、この時期に体の兆候はほとんど感じられません。',
        ],
        toKnow: [
          '尿による妊娠検査薬の多くは、着床が始まる翌週頃から信頼できる結果が出るようになります。',
        ],
      },
      ko: {
        babyDescription: '수정이 되었다면 난자가 분열하면서 자궁 쪽으로 이동하기 시작하지만, 아직 임신 테스트로는 확인되지 않아요.',
        bodyChanges: [
          '이번 주는 아직 임신 시기를 의학적으로 계산하는 기간에 속해요. 이 시기에는 대개 눈에 띄는 신체 징후가 없어요.',
        ],
        toKnow: [
          '소변 임신 테스트는 대부분 착상이 시작된 다음 주쯤부터 신뢰할 수 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Se a fecundação ocorreu, o óvulo começa a dividir-se e a deslocar-se em direção ao útero, mas um teste de gravidez ainda não consegue detetar nada.',
        bodyChanges: [
          'Esta semana ainda se insere no período de datação médica em torno da conceção; geralmente não se nota nenhum sinal físico nesta fase.',
        ],
        toKnow: [
          'A maioria dos testes de gravidez à urina torna-se fiável a partir da semana seguinte, depois de a implantação ter começado.',
        ],
      },
      bn: {
        babyDescription: 'নিষেক ঘটে থাকলে ডিম্বাণু বিভক্ত হতে শুরু করে এবং জরায়ুর দিকে এগোতে থাকে, কিন্তু গর্ভাবস্থা পরীক্ষায় এখনও কিছু ধরা পড়ে না।',
        bodyChanges: [
          'এই সপ্তাহটিও গর্ভধারণকে ঘিরে চিকিৎসাগত হিসাবের সময়ের মধ্যেই পড়ে; এই পর্যায়ে সাধারণত কোনো শারীরিক লক্ষণ টের পাওয়া যায় না।',
        ],
        toKnow: [
          'বেশিরভাগ প্রস্রাব-ভিত্তিক গর্ভাবস্থা পরীক্ষা পরবর্তী সপ্তাহ থেকে, অর্থাৎ ভ্রূণ জরায়ুতে বসতে শুরু করার পর, নির্ভরযোগ্য হয়।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- weeks 4–7 (embryo)
  {
    week: 4,
    babyImage: require('../assets/images/pregnancy/development/week-04.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'L’embryon vient de s’implanter dans la paroi de l’utérus. Le sac amniotique et le sac vitellin, qui le nourrira au tout début, se mettent en place.',
        length: 'Environ 2 mm',
        comparison: 'Graine de pavot',
        bodyChanges: [
          'Certaines personnes ne remarquent encore aucun signe à ce stade très précoce.',
          'Un test de grossesse urinaire peut généralement détecter la grossesse à partir de cette semaine.',
        ],
        toKnow: ['C’est le moment habituel où un test de grossesse peut commencer à donner un résultat positif.'],
      },
      en: {
        babyDescription:
          'The embryo has just implanted in the uterine wall. The amniotic sac and the yolk sac, which will nourish it in the very first days, are forming.',
        length: 'About 2 mm',
        comparison: 'Poppy seed',
        bodyChanges: [
          'Some people don’t notice any sign yet at this very early stage.',
          'A urine pregnancy test can generally detect pregnancy from this week onward.',
        ],
        toKnow: ['This is the usual time when a pregnancy test can start giving a positive result.'],
      },
      es: {
        babyDescription:
          'El embrión acaba de implantarse en la pared del útero. El saco amniótico y el saco vitelino, que lo nutrirá al principio, se están formando.',
        length: 'Aproximadamente 2 mm',
        comparison: 'Semilla de amapola',
        bodyChanges: [
          'Algunas personas todavía no notan ningún signo en esta etapa tan temprana.',
          'Una prueba de embarazo en orina generalmente puede detectar el embarazo a partir de esta semana.',
        ],
        toKnow: ['Este es el momento habitual en el que una prueba de embarazo puede empezar a dar un resultado positivo.'],
      },
      it: {
        babyDescription: 'L’embrione si è appena impiantato nella parete dell’utero. Si stanno formando il sacco amniotico e il sacco vitellino, che lo nutrirà nei primissimi giorni.',
        length: 'Circa 2 mm',
        comparison: 'Seme di papavero',
        bodyChanges: [
          'Alcune donne non notano ancora alcun segno in questa fase così precoce.',
          'Un test di gravidanza sulle urine può in genere rilevare la gravidanza a partire da questa settimana.',
        ],
        toKnow: [
          'È il momento in cui, di solito, un test di gravidanza può iniziare a dare un risultato positivo.',
        ],
      },
      tr: {
        babyDescription: 'Embriyo rahim duvarına yeni yerleşti. İlk günlerde onu besleyecek olan amniyon kesesi ve vitellus kesesi oluşuyor.',
        length: 'Yaklaşık 2 mm',
        comparison: 'Haşhaş tohumu',
        bodyChanges: [
          'Bazı kişiler bu çok erken aşamada henüz hiçbir belirti fark etmez.',
          'İdrar yoluyla yapılan bir gebelik testi, gebeliği genellikle bu haftadan itibaren saptayabilir.',
        ],
        toKnow: [
          'Bu, bir gebelik testinin pozitif sonuç vermeye başlayabildiği olağan zamandır.',
        ],
      },
      ru: {
        babyDescription:
          'Эмбрион только что закрепился в стенке матки. Формируются амниотический мешок и желточный мешок, которые будут питать его в первые дни.',
        length:
          'Около 2 мм',
        comparison:
          'Маковое зёрнышко',
        bodyChanges: [
          'Некоторые женщины на этом совсем раннем этапе ещё не замечают никаких признаков.',
          'Тест на беременность по моче, как правило, может выявить беременность начиная с этой недели.',
        ],
        toKnow: [
          'Обычно именно в это время тест на беременность может начать показывать положительный результат.',
        ],
      },
      de: {
        babyDescription:
          'Der Embryo hat sich gerade in der Gebärmutterschleimhaut eingenistet. Die Fruchtblase und der Dottersack, der ihn in den allerersten Tagen ernährt, bilden sich.',
        length:
          'Etwa 2 mm',
        comparison:
          'Mohnsamen',
        bodyChanges: [
          'Manche Frauen bemerken in dieser sehr frühen Phase noch keinerlei Anzeichen.',
          'Ein Schwangerschaftstest mit Urin kann die Schwangerschaft in der Regel ab dieser Woche nachweisen.',
        ],
        toKnow: [
          'Das ist der übliche Zeitpunkt, ab dem ein Schwangerschaftstest ein positives Ergebnis anzeigen kann.',
        ],
      },
      zh: {
        babyDescription: '胚胎刚刚着床在子宫壁上。羊膜囊和卵黄囊正在形成，它们会在最初几天为胚胎提供营养。',
        length: '约 2 毫米',
        comparison: '罂粟籽',
        bodyChanges: [
          '在这个非常早的阶段，有些人还没有任何感觉。',
          '从这一周起，尿液验孕通常就能检测到怀孕。',
        ],
        toKnow: [
          '这通常是验孕可以开始出现阳性结果的时间。',
        ],
      },
      id: {
        babyDescription: 'Embrio baru saja menempel pada dinding rahim. Kantung ketuban dan kantung kuning telur, yang akan menyuplai nutrisi pada hari-hari pertama, mulai terbentuk.',
        length: 'Sekitar 2 mm',
        comparison: 'Biji poppy',
        bodyChanges: [
          'Sebagian orang belum merasakan tanda apa pun pada tahap yang sangat awal ini.',
          'Tes kehamilan urine umumnya dapat mendeteksi kehamilan mulai minggu ini.',
        ],
        toKnow: [
          'Inilah waktu yang biasanya sudah memungkinkan tes kehamilan memberikan hasil positif.',
        ],
      },
      hi: {
        babyDescription: 'भ्रूण अभी-अभी गर्भाशय की दीवार में स्थापित (इम्प्लांट) हुआ है। उल्ब थैली (एम्नियोटिक सैक) और योक सैक बन रहे हैं, जो शुरुआती कुछ दिनों में उसे पोषण देंगे।',
        length: 'लगभग 2 mm',
        comparison: 'खसखस का दाना',
        bodyChanges: [
          'इस बिल्कुल शुरुआती चरण में कुछ महिलाओं को अभी कोई संकेत महसूस नहीं होता।',
          'यूरिन प्रेगनेंसी टेस्ट से आम तौर पर इसी सप्ताह से गर्भावस्था का पता चल सकता है।',
        ],
        toKnow: [
          'यह वह सामान्य समय है जब प्रेगनेंसी टेस्ट पॉज़िटिव आना शुरू हो सकता है।',
        ],
      },
      sq: {
        babyDescription: 'Embrioni sapo është ngjitur në murin e mitrës. Po formohen qesja amniotike dhe qesja e verdhëzës, që do ta ushqejë atë në ditët e para.',
        length: 'Rreth 2 mm',
        comparison: 'Farë lulekuqeje',
        bodyChanges: [
          'Disa gra nuk vërejnë ende asnjë shenjë në këtë fazë shumë të hershme.',
          'Një test shtatzënie me urinë zakonisht mund ta zbulojë shtatzëninë nga kjo javë e tutje.',
        ],
        toKnow: [
          'Kjo është koha e zakonshme kur një test shtatzënie mund të fillojë të japë rezultat pozitiv.',
        ],
      },
      ja: {
        babyDescription: '胚が子宮の壁に着床したところです。羊膜腔と、ごく初期の数日間に胚へ栄養を届ける卵黄嚢ができ始めています。',
        length: '約2mm',
        comparison: 'ケシの実',
        bodyChanges: [
          'ごく初期のこの時期は、まだ何も兆候に気づかない人もいます。',
          '尿による妊娠検査薬では、通常この週から妊娠を検出できます。',
        ],
        toKnow: [
          '妊娠検査薬で陽性の結果が出始めるのは、一般的にこの時期です。',
        ],
      },
      ko: {
        babyDescription: '배아가 막 자궁벽에 착상했어요. 처음 며칠 동안 배아에 영양을 공급할 양막낭과 난황낭이 만들어지고 있어요.',
        length: '약 2mm',
        comparison: '양귀비 씨',
        bodyChanges: [
          '아주 이른 시기라 아직 아무 징후도 느끼지 못하는 경우도 있어요.',
          '소변 임신 테스트로는 대개 이번 주부터 임신을 확인할 수 있어요.',
        ],
        toKnow: [
          '임신 테스트에서 양성 결과가 나오기 시작하는 보통의 시기예요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O embrião acabou de se implantar na parede do útero. Formam-se a bolsa amniótica e o saco vitelino, que o vai nutrir nos primeiros dias.',
        length: 'Cerca de 2 mm',
        comparison: 'Semente de papoila',
        bodyChanges: [
          'Algumas mulheres ainda não notam qualquer sinal nesta fase muito precoce.',
          'Um teste de gravidez à urina geralmente consegue detetar a gravidez a partir desta semana.',
        ],
        toKnow: [
          'Esta é a altura habitual em que um teste de gravidez pode começar a dar resultado positivo.',
        ],
      },
      bn: {
        babyDescription: 'ভ্রূণ সবে জরায়ুর দেয়ালে বসেছে। অ্যামনিওটিক থলি এবং কুসুম থলি তৈরি হচ্ছে, যা একেবারে প্রথম কয়েক দিন ভ্রূণকে পুষ্টি জোগাবে।',
        length: 'প্রায় 2 মিমি',
        comparison: 'পপি বীজ',
        bodyChanges: [
          'এই একেবারে প্রাথমিক পর্যায়ে কেউ কেউ এখনও কোনো লক্ষণ টের পান না।',
          'প্রস্রাব-ভিত্তিক গর্ভাবস্থা পরীক্ষায় সাধারণত এই সপ্তাহ থেকে গর্ভাবস্থা ধরা পড়তে পারে।',
        ],
        toKnow: [
          'সাধারণত এই সময় থেকেই গর্ভাবস্থা পরীক্ষার ফল পজিটিভ আসতে শুরু করতে পারে।',
        ],
      },
    },
  },
  {
    week: 5,
    babyImage: require('../assets/images/pregnancy/development/week-05.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le système nerveux commence à se former et le cœur, encore minuscule, s’apprête à battre pour la première fois.',
        length: 'Environ 2 mm',
        comparison: 'Graine de sésame',
        bodyChanges: ['Une fatigue inhabituelle, des nausées légères ou une sensibilité de la poitrine peuvent apparaître.'],
        toKnow: ['C’est le moment recommandé pour prendre rendez-vous avec un professionnel de santé afin de démarrer le suivi de grossesse.'],
      },
      en: {
        babyDescription:
          'The nervous system begins to form, and the heart, still tiny, is about to beat for the first time.',
        length: 'About 2 mm',
        comparison: 'Sesame seed',
        bodyChanges: ['Unusual fatigue, mild nausea, or breast tenderness may appear.'],
        toKnow: ['This is the recommended time to make an appointment with a healthcare professional to start pregnancy care.'],
      },
      es: {
        babyDescription:
          'El sistema nervioso comienza a formarse y el corazón, todavía diminuto, está a punto de latir por primera vez.',
        length: 'Aproximadamente 2 mm',
        comparison: 'Semilla de sésamo',
        bodyChanges: ['Puede aparecer un cansancio inusual, náuseas leves o sensibilidad en el pecho.'],
        toKnow: ['Este es el momento recomendado para pedir cita con un profesional de la salud y comenzar el seguimiento del embarazo.'],
      },
      it: {
        babyDescription: 'Il sistema nervoso comincia a formarsi e il cuore, ancora minuscolo, sta per battere per la prima volta.',
        length: 'Circa 2 mm',
        comparison: 'Seme di sesamo',
        bodyChanges: [
          'Possono comparire stanchezza insolita, lieve nausea o tensione al seno.',
        ],
        toKnow: [
          'È il momento consigliato per fissare un appuntamento con un professionista sanitario e iniziare il percorso di assistenza in gravidanza.',
        ],
      },
      tr: {
        babyDescription: 'Sinir sistemi oluşmaya başlıyor ve henüz çok küçük olan kalp ilk kez atmak üzere.',
        length: 'Yaklaşık 2 mm',
        comparison: 'Susam tanesi',
        bodyChanges: [
          'Alışılmadık yorgunluk, hafif mide bulantısı veya göğüslerde hassasiyet ortaya çıkabilir.',
        ],
        toKnow: [
          'Gebelik takibine başlamak için bir sağlık profesyoneliyle randevu almanın önerildiği zaman budur.',
        ],
      },
      ru: {
        babyDescription:
          'Начинает формироваться нервная система, а крошечное сердце вот-вот сделает первое сокращение.',
        length:
          'Около 2 мм',
        comparison:
          'Зёрнышко кунжута',
        bodyChanges: [
          'Может появиться необычная усталость, лёгкая тошнота или чувствительность груди.',
        ],
        toKnow: [
          'Сейчас рекомендуется записаться на приём к специалисту, чтобы начать наблюдение за беременностью.',
        ],
      },
      de: {
        babyDescription:
          'Das Nervensystem beginnt sich zu bilden, und das noch winzige Herz steht kurz davor, zum ersten Mal zu schlagen.',
        length:
          'Etwa 2 mm',
        comparison:
          'Sesamkorn',
        bodyChanges: [
          'Ungewöhnliche Müdigkeit, leichte Übelkeit oder Spannungsgefühle in der Brust können auftreten.',
        ],
        toKnow: [
          'Jetzt ist der empfohlene Zeitpunkt, einen Termin bei medizinischem Fachpersonal zu vereinbaren, um die Schwangerenvorsorge zu beginnen.',
        ],
      },
      zh: {
        babyDescription: '神经系统开始形成，小小的心脏即将第一次跳动。',
        length: '约 2 毫米',
        comparison: '芝麻粒',
        bodyChanges: [
          '可能会出现异常的疲倦、轻微的恶心或乳房胀痛。',
        ],
        toKnow: [
          '建议在这个时候预约医疗专业人员，开始孕期检查。',
        ],
      },
      id: {
        babyDescription: 'Sistem saraf mulai terbentuk, dan jantung yang masih sangat kecil akan segera berdetak untuk pertama kalinya.',
        length: 'Sekitar 2 mm',
        comparison: 'Biji wijen',
        bodyChanges: [
          'Kelelahan yang tidak biasa, mual ringan, atau payudara terasa nyeri bisa muncul.',
        ],
        toKnow: [
          'Inilah waktu yang dianjurkan untuk membuat janji dengan tenaga kesehatan guna memulai pemeriksaan kehamilan.',
        ],
      },
      hi: {
        babyDescription: 'तंत्रिका तंत्र बनना शुरू होता है, और नन्हा-सा दिल पहली बार धड़कने ही वाला है।',
        length: 'लगभग 2 mm',
        comparison: 'तिल का दाना',
        bodyChanges: [
          'असामान्य थकान, हल्की मितली या स्तनों में कोमलता महसूस हो सकती है।',
        ],
        toKnow: [
          'गर्भावस्था की देखभाल शुरू करने के लिए स्वास्थ्य विशेषज्ञ से अपॉइंटमेंट लेने का यह अनुशंसित समय है।',
        ],
      },
      sq: {
        babyDescription: 'Sistemi nervor fillon të formohet dhe zemra, ende shumë e vogël, është gati të rrah për herë të parë.',
        length: 'Rreth 2 mm',
        comparison: 'Farë susami',
        bodyChanges: [
          'Mund të shfaqen lodhje e pazakontë, të përziera të lehta ose ndjeshmëri në gjoks.',
        ],
        toKnow: [
          'Kjo është koha e rekomanduar për të caktuar një takim me një profesionist të shëndetësisë për të nisur kujdesin gjatë shtatzënisë.',
        ],
      },
      ja: {
        babyDescription: '神経系ができ始め、まだとても小さな心臓が、初めて拍動しようとしています。',
        length: '約2mm',
        comparison: 'ゴマ粒',
        bodyChanges: [
          'いつもと違う疲れ、軽い吐き気、胸の張りなどが現れることがあります。',
        ],
        toKnow: [
          '妊婦健診を始めるために、医療従事者の予約を取ることをおすすめする時期です。',
        ],
      },
      ko: {
        babyDescription: '신경계가 형성되기 시작하고, 아직 아주 작은 심장이 처음으로 뛸 준비를 하고 있어요.',
        length: '약 2mm',
        comparison: '참깨',
        bodyChanges: [
          '평소와 다른 피로감, 가벼운 메스꺼움, 가슴 통증이 나타날 수 있어요.',
        ],
        toKnow: [
          '의료 전문가와 진료 예약을 잡고 임신 검진을 시작하기에 좋은 시기예요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O sistema nervoso começa a formar-se e o coração, ainda minúsculo, está prestes a bater pela primeira vez.',
        length: 'Cerca de 2 mm',
        comparison: 'Semente de sésamo',
        bodyChanges: [
          'Podem surgir cansaço fora do habitual, náuseas ligeiras ou sensibilidade nos seios.',
        ],
        toKnow: [
          'Esta é a altura recomendada para marcar uma consulta com um profissional de saúde e iniciar a vigilância da gravidez.',
        ],
      },
      bn: {
        babyDescription: 'স্নায়ুতন্ত্র গড়ে উঠতে শুরু করেছে, আর এখনও অতি ক্ষুদ্র হৃৎপিণ্ড প্রথমবারের মতো স্পন্দিত হতে যাচ্ছে।',
        length: 'প্রায় 2 মিমি',
        comparison: 'তিলের দানা',
        bodyChanges: [
          'অস্বাভাবিক ক্লান্তি, হালকা বমি বমি ভাব বা স্তনে ব্যথাভাব দেখা দিতে পারে।',
        ],
        toKnow: [
          'গর্ভাবস্থার যত্ন শুরু করার জন্য স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে অ্যাপয়েন্টমেন্ট নেওয়ার জন্য এটি উপযুক্ত সময়।',
        ],
      },
    },
  },
  {
    week: 6,
    babyImage: require('../assets/images/pregnancy/development/week-06.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les ébauches des bras et des jambes apparaissent, ainsi que de petites indentations là où les oreilles se formeront. Le cœur peut parfois déjà être détecté par échographie.',
        length: 'Environ 6 mm',
        comparison: 'Petit pois',
        bodyChanges: ['Les nausées et la fatigue peuvent s’intensifier chez certaines personnes durant cette période.'],
        toKnow: ['Une activité cardiaque peut parfois être visible dès cette semaine lors d’une échographie précoce.'],
      },
      en: {
        babyDescription:
          'The buds of the arms and legs appear, along with small indentations where the ears will form. The heart can sometimes already be detected on ultrasound.',
        length: 'About 6 mm',
        comparison: 'Pea',
        bodyChanges: ['Nausea and fatigue may intensify for some people during this period.'],
        toKnow: ['Heart activity can sometimes be visible as early as this week on an early ultrasound.'],
      },
      es: {
        babyDescription:
          'Aparecen los primeros esbozos de los brazos y las piernas, así como pequeñas marcas donde se formarán las orejas. A veces ya puede detectarse el corazón mediante una ecografía.',
        length: 'Aproximadamente 6 mm',
        comparison: 'Guisante',
        bodyChanges: ['Las náuseas y el cansancio pueden intensificarse en algunas personas durante este periodo.'],
        toKnow: ['A veces puede verse actividad cardiaca ya desde esta semana en una ecografía precoz.'],
      },
      it: {
        babyDescription: 'Compaiono i primi abbozzi di braccia e gambe, insieme a piccole rientranze dove si formeranno le orecchie. Il cuore può a volte essere già rilevato con l’ecografia.',
        length: 'Circa 6 mm',
        comparison: 'Pisello',
        bodyChanges: [
          'In questo periodo, per alcune donne nausea e stanchezza possono intensificarsi.',
        ],
        toKnow: [
          'L’attività del cuore può a volte essere visibile già da questa settimana con un’ecografia precoce.',
        ],
      },
      tr: {
        babyDescription: 'Kol ve bacak tomurcukları belirir, kulakların oluşacağı yerde küçük çukurcuklar görülür. Kalp bazen ultrasonda şimdiden saptanabilir.',
        length: 'Yaklaşık 6 mm',
        comparison: 'Bezelye',
        bodyChanges: [
          'Bu dönemde bazı kişilerde mide bulantısı ve yorgunluk artabilir.',
        ],
        toKnow: [
          'Kalp aktivitesi, erken yapılan bir ultrasonda bazen bu haftadan itibaren görülebilir.',
        ],
      },
      ru: {
        babyDescription:
          'Появляются зачатки рук и ног, а также небольшие углубления на месте будущих ушей. Сердце иногда уже можно обнаружить на УЗИ.',
        length:
          'Около 6 мм',
        comparison:
          'Горошина',
        bodyChanges: [
          'У некоторых женщин в этот период тошнота и усталость могут усиливаться.',
        ],
        toKnow: [
          'Сердечную деятельность иногда можно увидеть уже на этой неделе при раннем УЗИ.',
        ],
      },
      de: {
        babyDescription:
          'Die Anlagen von Armen und Beinen erscheinen, ebenso kleine Einbuchtungen, aus denen sich später die Ohren bilden. Das Herz lässt sich manchmal schon im Ultraschall erkennen.',
        length:
          'Etwa 6 mm',
        comparison:
          'Erbse',
        bodyChanges: [
          'Übelkeit und Müdigkeit können in dieser Zeit bei manchen Frauen stärker werden.',
        ],
        toKnow: [
          'Die Herztätigkeit kann bei einem frühen Ultraschall manchmal schon ab dieser Woche sichtbar sein.',
        ],
      },
      zh: {
        babyDescription: '手臂和腿的小芽出现了，耳朵将来形成的位置出现小小的凹陷。有时在超声检查中已经能看到心脏。',
        length: '约 6 毫米',
        comparison: '豌豆',
        bodyChanges: [
          '在这段时间，有些人的恶心和疲倦可能会加重。',
        ],
        toKnow: [
          '早期超声检查有时最早在这一周就能看到心脏活动。',
        ],
      },
      id: {
        babyDescription: 'Tunas lengan dan kaki mulai muncul, bersama lekukan kecil tempat telinga akan terbentuk. Jantung terkadang sudah dapat terdeteksi lewat USG.',
        length: 'Sekitar 6 mm',
        comparison: 'Kacang polong',
        bodyChanges: [
          'Mual dan kelelahan bisa makin terasa pada sebagian orang selama masa ini.',
        ],
        toKnow: [
          'Aktivitas jantung terkadang sudah dapat terlihat sejak minggu ini pada USG dini.',
        ],
      },
      hi: {
        babyDescription: 'बाँहों और पैरों की कलियाँ दिखने लगती हैं, साथ ही उन जगहों पर छोटे गड्ढे बनते हैं जहाँ कान बनेंगे। दिल की धड़कन कभी-कभी अल्ट्रासाउंड में पहले से दिख सकती है।',
        length: 'लगभग 6 mm',
        comparison: 'मटर का दाना',
        bodyChanges: [
          'इस दौरान कुछ महिलाओं में मितली और थकान बढ़ सकती है।',
        ],
        toKnow: [
          'शुरुआती अल्ट्रासाउंड में दिल की गतिविधि कभी-कभी इसी सप्ताह से दिखाई दे सकती है।',
        ],
      },
      sq: {
        babyDescription: 'Shfaqen filizat e krahëve dhe të këmbëve, së bashku me gropëza të vogla ku do të formohen veshët. Zemra ndonjëherë mund të zbulohet tashmë në ekografi.',
        length: 'Rreth 6 mm',
        comparison: 'Bizele',
        bodyChanges: [
          'Të përzierat dhe lodhja mund të shtohen për disa gra gjatë kësaj periudhe.',
        ],
        toKnow: [
          'Aktiviteti i zemrës ndonjëherë mund të duket që nga kjo javë në një ekografi të hershme.',
        ],
      },
      ja: {
        babyDescription: '腕や脚のもとになる芽が現れ、耳ができる部分には小さなくぼみができます。心臓の拍動が、すでに超音波検査で確認できることもあります。',
        length: '約6mm',
        comparison: 'エンドウ豆',
        bodyChanges: [
          'この時期は、吐き気や疲れが強くなる人もいます。',
        ],
        toKnow: [
          '早期の超音波検査では、この週から心拍が確認できることがあります。',
        ],
      },
      ko: {
        babyDescription: '팔과 다리의 싹이 나타나고, 귀가 만들어질 자리에는 작은 홈이 생겨요. 초음파로 심장 박동이 벌써 확인되기도 해요.',
        length: '약 6mm',
        comparison: '완두콩',
        bodyChanges: [
          '이 시기에는 메스꺼움과 피로가 심해지는 사람도 있어요.',
        ],
        toKnow: [
          '초기 초음파에서는 이번 주부터 심장 활동이 보이기도 해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Surgem os rudimentos dos braços e das pernas, bem como pequenas reentrâncias onde se formarão as orelhas. O coração já pode, por vezes, ser detetado na ecografia.',
        length: 'Cerca de 6 mm',
        comparison: 'Ervilha',
        bodyChanges: [
          'As náuseas e o cansaço podem intensificar-se em algumas mulheres durante este período.',
        ],
        toKnow: [
          'A atividade cardíaca pode, por vezes, ser visível logo a partir desta semana numa ecografia precoce.',
        ],
      },
      bn: {
        babyDescription: 'হাত ও পায়ের কুঁড়ি দেখা দেয়, সঙ্গে কানের ভবিষ্যৎ স্থানে ছোট ছোট খাঁজ তৈরি হয়। হৃৎপিণ্ড কখনও কখনও আলট্রাসাউন্ডে আগেই ধরা পড়তে পারে।',
        length: 'প্রায় 6 মিমি',
        comparison: 'মটরশুঁটি',
        bodyChanges: [
          'এই সময়ে কারও কারও ক্ষেত্রে বমি বমি ভাব ও ক্লান্তি বেড়ে যেতে পারে।',
        ],
        toKnow: [
          'প্রাথমিক আলট্রাসাউন্ডে কখনও কখনও এই সপ্তাহ থেকেই হৃৎস্পন্দন দেখা যেতে পারে।',
        ],
      },
    },
  },
  {
    week: 7,
    babyImage: require('../assets/images/pregnancy/development/week-07.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le cerveau se développe plus vite que le reste du corps, donnant un front proéminent. De petites ébauches de mains commencent à apparaître au bout des bras.',
        length: 'Environ 10 mm',
        comparison: 'Grain de raisin',
        bodyChanges: ['Des envies alimentaires particulières ou, au contraire, des aversions pour certains aliments sont possibles.'],
        toKnow: ['Le tube neural, à l’origine du cerveau et de la moelle épinière, poursuit sa fermeture durant ces semaines.'],
      },
      en: {
        babyDescription:
          'The brain develops faster than the rest of the body, giving a prominent forehead. Small hand buds begin to appear at the ends of the arms.',
        length: 'About 10 mm',
        comparison: 'Grape',
        bodyChanges: ['Particular food cravings, or conversely aversions to certain foods, are possible.'],
        toKnow: ['The neural tube, which gives rise to the brain and spinal cord, continues closing during these weeks.'],
      },
      es: {
        babyDescription:
          'El cerebro se desarrolla más rápido que el resto del cuerpo, lo que da una frente prominente. Empiezan a aparecer pequeños esbozos de manos en el extremo de los brazos.',
        length: 'Aproximadamente 10 mm',
        comparison: 'Grano de uva',
        bodyChanges: ['Son posibles antojos alimentarios particulares o, por el contrario, aversiones a ciertos alimentos.'],
        toKnow: ['El tubo neural, origen del cerebro y la médula espinal, continúa cerrándose durante estas semanas.'],
      },
      it: {
        babyDescription: 'Il cervello si sviluppa più velocemente del resto del corpo, dando al bambino una fronte prominente. Alle estremità delle braccia iniziano a comparire i piccoli abbozzi delle mani.',
        length: 'Circa 10 mm',
        comparison: 'Acino d’uva',
        bodyChanges: [
          'Sono possibili voglie particolari oppure, al contrario, avversioni per certi cibi.',
        ],
        toKnow: [
          'Il tubo neurale, da cui hanno origine il cervello e il midollo spinale, continua a chiudersi durante queste settimane.',
        ],
      },
      tr: {
        babyDescription: 'Beyin vücudun geri kalanından daha hızlı gelişir ve bu da belirgin bir alın görünümü verir. Kolların uçlarında küçük el tomurcukları belirmeye başlar.',
        length: 'Yaklaşık 10 mm',
        comparison: 'Üzüm',
        bodyChanges: [
          'Belirli yiyeceklere karşı istek ya da tersine bazı yiyeceklerden hoşlanmama görülebilir.',
        ],
        toKnow: [
          'Beyin ve omuriliği oluşturan nöral tüp, bu haftalarda kapanmaya devam eder.',
        ],
      },
      ru: {
        babyDescription:
          'Мозг развивается быстрее остального тела, из-за чего лоб кажется выступающим. На концах рук начинают появляться маленькие зачатки кистей.',
        length:
          'Около 10 мм',
        comparison:
          'Виноградина',
        bodyChanges: [
          'Возможны особые пищевые пристрастия или, наоборот, отвращение к некоторым продуктам.',
        ],
        toKnow: [
          'Нервная трубка, из которой формируются головной и спинной мозг, продолжает закрываться в течение этих недель.',
        ],
      },
      de: {
        babyDescription:
          'Das Gehirn entwickelt sich schneller als der übrige Körper, wodurch die Stirn deutlich hervortritt. An den Enden der Arme beginnen sich kleine Handanlagen zu zeigen.',
        length:
          'Etwa 10 mm',
        comparison:
          'Weintraube',
        bodyChanges: [
          'Besonderer Heißhunger auf bestimmte Lebensmittel oder auch Abneigungen gegen manche Speisen sind möglich.',
        ],
        toKnow: [
          'Das Neuralrohr, aus dem Gehirn und Rückenmark entstehen, schließt sich in diesen Wochen weiter.',
        ],
      },
      zh: {
        babyDescription: '大脑的发育比身体其他部分更快，所以前额显得突出。手臂末端开始出现小小的手芽。',
        length: '约 10 毫米',
        comparison: '葡萄',
        bodyChanges: [
          '可能会特别想吃某些食物，或者相反，对某些食物感到抗拒。',
        ],
        toKnow: [
          '神经管会发育成大脑和脊髓，在这几周里仍在继续闭合。',
        ],
      },
      id: {
        babyDescription: 'Otak berkembang lebih cepat daripada bagian tubuh lainnya, sehingga dahi tampak menonjol. Tunas tangan yang kecil mulai muncul di ujung lengan.',
        length: 'Sekitar 10 mm',
        comparison: 'Anggur',
        bodyChanges: [
          'Keinginan makan makanan tertentu, atau sebaliknya rasa tidak suka pada makanan tertentu, mungkin saja terjadi.',
        ],
        toKnow: [
          'Tabung saraf, yang akan menjadi otak dan sumsum tulang belakang, terus menutup selama minggu-minggu ini.',
        ],
      },
      hi: {
        babyDescription: 'दिमाग़ शरीर के बाक़ी हिस्सों से तेज़ी से विकसित होता है, जिससे माथा उभरा हुआ दिखता है। बाँहों के सिरों पर हाथों की छोटी कलियाँ दिखने लगती हैं।',
        length: 'लगभग 10 mm',
        comparison: 'अंगूर',
        bodyChanges: [
          'खाने की कुछ ख़ास चीज़ों की इच्छा, या इसके उलट कुछ चीज़ों से अरुचि होना संभव है।',
        ],
        toKnow: [
          'न्यूरल ट्यूब, जिससे दिमाग़ और रीढ़ की हड्डी की नस (स्पाइनल कॉर्ड) बनती है, इन सप्ताहों में बंद होती रहती है।',
        ],
      },
      sq: {
        babyDescription: 'Truri zhvillohet më shpejt se pjesa tjetër e trupit, duke dhënë një ballë të dukshme. Në skajet e krahëve fillojnë të shfaqen filizat e vegjël të duarve.',
        length: 'Rreth 10 mm',
        comparison: 'Rrush',
        bodyChanges: [
          'Janë të mundshme dëshira të veçanta për ushqime, ose përkundrazi ndjesi neverie ndaj disa ushqimeve.',
        ],
        toKnow: [
          'Tubi nervor, nga i cili formohen truri dhe palca kurrizore, vazhdon të mbyllet gjatë këtyre javëve.',
        ],
      },
      ja: {
        babyDescription: '脳は体のほかの部分より速く発達するため、額が目立つ姿になります。腕の先には、手のもとになる小さな芽が現れ始めます。',
        length: '約10mm',
        comparison: 'ブドウ',
        bodyChanges: [
          '特定の食べ物が無性に食べたくなったり、逆に苦手になったりすることがあります。',
        ],
        toKnow: [
          '脳と脊髄のもとになる神経管は、この数週間のあいだに閉じ続けていきます。',
        ],
      },
      ko: {
        babyDescription: '뇌가 몸의 다른 부분보다 빠르게 발달해서 이마가 도드라져 보여요. 팔 끝에는 작은 손 싹이 나타나기 시작해요.',
        length: '약 10mm',
        comparison: '포도',
        bodyChanges: [
          '특정 음식이 당기거나, 반대로 특정 음식이 싫어질 수 있어요.',
        ],
        toKnow: [
          '뇌와 척수가 만들어지는 신경관은 이 몇 주 동안 계속 닫히고 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O cérebro desenvolve-se mais depressa do que o resto do corpo, o que dá uma testa proeminente. Começam a surgir pequenos rudimentos das mãos nas extremidades dos braços.',
        length: 'Cerca de 10 mm',
        comparison: 'Uva',
        bodyChanges: [
          'São possíveis desejos alimentares específicos ou, pelo contrário, aversão a certos alimentos.',
        ],
        toKnow: [
          'O tubo neural, que dá origem ao cérebro e à medula espinhal, continua a fechar-se durante estas semanas.',
        ],
      },
      bn: {
        babyDescription: 'দেহের বাকি অংশের চেয়ে মস্তিষ্ক দ্রুত বিকশিত হয়, ফলে কপাল উঁচু দেখায়। বাহুর প্রান্তে হাতের ছোট কুঁড়ি দেখা দিতে শুরু করে।',
        length: 'প্রায় 10 মিমি',
        comparison: 'আঙুর',
        bodyChanges: [
          'নির্দিষ্ট কিছু খাবারের প্রতি তীব্র ইচ্ছা, অথবা উল্টো কিছু খাবারের প্রতি অরুচি হতে পারে।',
        ],
        toKnow: [
          'যে নিউরাল টিউব থেকে মস্তিষ্ক ও মেরুদণ্ড তৈরি হয়, এই সপ্তাহগুলোতে তা বন্ধ হওয়ার প্রক্রিয়া চলতে থাকে।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- weeks 8–13 (first trimester, fetus)
  {
    week: 8,
    babyImage: require('../assets/images/pregnancy/development/week-08.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'L’embryon est désormais appelé fœtus. Les bras s’allongent, la tête commence à se redresser légèrement et le placenta poursuit sa formation.',
        length: 'Environ 16 mm',
        comparison: 'Framboise',
        bodyChanges: ['La sensibilité aux odeurs et les nausées matinales sont fréquentes à ce stade, sans être systématiques.'],
        toKnow: ['La première échographie de datation est généralement programmée entre la semaine 8 et la semaine 14.'],
      },
      en: {
        babyDescription:
          'The embryo is now called a fetus. The arms are lengthening, the head begins to straighten slightly, and the placenta continues forming.',
        length: 'About 16 mm',
        comparison: 'Raspberry',
        bodyChanges: ['Sensitivity to smells and morning sickness are common at this stage, though not universal.'],
        toKnow: ['The first dating ultrasound is generally scheduled between week 8 and week 14.'],
      },
      es: {
        babyDescription:
          'El embrión pasa ahora a llamarse feto. Los brazos se alargan, la cabeza empieza a enderezarse ligeramente y la placenta continúa formándose.',
        length: 'Aproximadamente 16 mm',
        comparison: 'Frambuesa',
        bodyChanges: ['La sensibilidad a los olores y las náuseas matutinas son frecuentes en esta etapa, sin ser sistemáticas.'],
        toKnow: ['La primera ecografía de datación suele programarse entre la semana 8 y la semana 14.'],
      },
      it: {
        babyDescription: 'L’embrione ora viene chiamato feto. Le braccia si allungano, la testa comincia a raddrizzarsi leggermente e la placenta continua a formarsi.',
        length: 'Circa 16 mm',
        comparison: 'Lampone',
        bodyChanges: [
          'In questa fase sono frequenti, anche se non per tutte, la sensibilità agli odori e la nausea mattutina.',
        ],
        toKnow: [
          'La prima ecografia di datazione è in genere programmata tra la settimana 8 e la settimana 14.',
        ],
      },
      tr: {
        babyDescription: 'Embriyo artık fetüs olarak adlandırılır. Kollar uzuyor, baş hafifçe doğrulmaya başlıyor ve plasenta oluşmaya devam ediyor.',
        length: 'Yaklaşık 16 mm',
        comparison: 'Ahududu',
        bodyChanges: [
          'Kokulara karşı hassasiyet ve sabah bulantısı bu aşamada yaygındır, ancak herkeste görülmez.',
        ],
        toKnow: [
          'Tarihlemeyi belirleyen ilk ultrason genellikle 8. ile 14. haftalar arasında planlanır.',
        ],
      },
      ru: {
        babyDescription:
          'Эмбрион теперь называется плодом. Руки удлиняются, голова начинает слегка выпрямляться, а плацента продолжает формироваться.',
        length:
          'Около 16 мм',
        comparison:
          'Малина',
        bodyChanges: [
          'Чувствительность к запахам и утренняя тошнота на этом этапе распространены, но бывают не у всех.',
        ],
        toKnow: [
          'Первое УЗИ для уточнения срока обычно назначают между 8-й и 14-й неделями.',
        ],
      },
      de: {
        babyDescription:
          'Der Embryo wird jetzt Fötus genannt. Die Arme werden länger, der Kopf richtet sich leicht auf, und die Plazenta bildet sich weiter aus.',
        length:
          'Etwa 16 mm',
        comparison:
          'Himbeere',
        bodyChanges: [
          'Geruchsempfindlichkeit und morgendliche Übelkeit sind in dieser Phase häufig, aber nicht bei allen Frauen.',
        ],
        toKnow: [
          'Der erste Ultraschall zur Bestimmung des Schwangerschaftsalters findet in der Regel zwischen der 8. und der 14. SSW statt.',
        ],
      },
      zh: {
        babyDescription: '胚胎现在称为胎儿。手臂在变长，头部开始略微挺直，胎盘还在继续形成。',
        length: '约 16 毫米',
        comparison: '覆盆子',
        bodyChanges: [
          '对气味敏感和孕吐在这个阶段很常见，但并不是每个人都会有。',
        ],
        toKnow: [
          '第一次核对孕周的超声检查通常安排在孕 8 周到孕 14 周之间。',
        ],
      },
      id: {
        babyDescription: 'Embrio kini disebut janin. Lengan makin panjang, kepala mulai sedikit menegak, dan plasenta terus terbentuk.',
        length: 'Sekitar 16 mm',
        comparison: 'Raspberi',
        bodyChanges: [
          'Sensitivitas terhadap bau dan mual di pagi hari umum terjadi pada tahap ini, meski tidak dialami semua orang.',
        ],
        toKnow: [
          'USG pertama untuk menentukan usia kehamilan umumnya dijadwalkan antara minggu ke-8 dan minggu ke-14.',
        ],
      },
      hi: {
        babyDescription: 'अब भ्रूण को फ़ीटस (गर्भस्थ शिशु) कहा जाता है। बाँहें लंबी हो रही हैं, सिर थोड़ा सीधा होने लगता है और प्लेसेंटा बनता रहता है।',
        length: 'लगभग 16 mm',
        comparison: 'रसभरी',
        bodyChanges: [
          'इस चरण में गंध के प्रति संवेदनशीलता और मॉर्निंग सिकनेस आम हैं, हालाँकि सभी को नहीं होतीं।',
        ],
        toKnow: [
          'पहला डेटिंग अल्ट्रासाउंड आम तौर पर 8वें और 14वें सप्ताह के बीच करवाया जाता है।',
        ],
      },
      sq: {
        babyDescription: 'Embrioni tani quhet fetus. Krahët po zgjaten, koka fillon të drejtohet pak dhe placenta vazhdon të formohet.',
        length: 'Rreth 16 mm',
        comparison: 'Mjedër',
        bodyChanges: [
          'Ndjeshmëria ndaj erërave dhe të përzierat e mëngjesit janë të zakonshme në këtë fazë, megjithëse jo për të gjitha gratë.',
        ],
        toKnow: [
          'Ekografia e parë e datimit zakonisht planifikohet midis javës 8 dhe javës 14.',
        ],
      },
      ja: {
        babyDescription: '胚はここから「胎児」と呼ばれるようになります。腕が伸び、頭が少しずつ起きてきて、胎盤もできあがっていきます。',
        length: '約16mm',
        comparison: 'ラズベリー',
        bodyChanges: [
          'においに敏感になったり、つわりが出たりすることがよくありますが、全員にあるわけではありません。',
        ],
        toKnow: [
          '最初の妊娠週数を確認する超音波検査は、通常、妊娠8週から14週のあいだに予定されます。',
        ],
      },
      ko: {
        babyDescription: '이제 배아는 태아라고 불러요. 팔이 길어지고, 머리가 조금씩 펴지기 시작하며, 태반이 계속 만들어지고 있어요.',
        length: '약 16mm',
        comparison: '라즈베리',
        bodyChanges: [
          '이 시기에는 냄새에 민감해지고 입덧이 흔하지만, 모든 사람에게 나타나는 것은 아니에요.',
        ],
        toKnow: [
          '첫 번째 임신 주수 확인 초음파는 보통 8주에서 14주 사이에 예약해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O embrião passa agora a chamar-se feto. Os braços alongam-se, a cabeça começa a endireitar-se ligeiramente e a placenta continua a formar-se.',
        length: 'Cerca de 16 mm',
        comparison: 'Framboesa',
        bodyChanges: [
          'A sensibilidade aos cheiros e os enjoos matinais são comuns nesta fase, embora não sejam universais.',
        ],
        toKnow: [
          'A primeira ecografia de datação é geralmente marcada entre a semana 8 e a semana 14.',
        ],
      },
      bn: {
        babyDescription: 'এখন থেকে ভ্রূণকে ফিটাস বলা হয়। বাহু লম্বা হচ্ছে, মাথা সামান্য সোজা হতে শুরু করেছে এবং গর্ভফুল গঠন চলতে থাকে।',
        length: 'প্রায় 16 মিমি',
        comparison: 'রাস্পবেরি',
        bodyChanges: [
          'এই পর্যায়ে গন্ধের প্রতি সংবেদনশীলতা ও সকালবেলার বমি বমি ভাব সাধারণ, তবে সবার হয় না।',
        ],
        toKnow: [
          'গর্ভকাল নির্ণয়ের প্রথম আলট্রাসাউন্ড সাধারণত 8ম থেকে 14তম সপ্তাহের মধ্যে করার সময় নির্ধারণ করা হয়।',
        ],
      },
    },
  },
  {
    week: 9,
    babyImage: require('../assets/images/pregnancy/development/week-09.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les traits du visage se précisent, les paupières protègent les yeux, et les mains et les pieds se dessinent avec les futurs doigts et orteils.',
        length: 'Environ 22 mm',
        comparison: 'Fraise',
        bodyChanges: ['Une fatigue marquée et des nausées peuvent encore être présentes ; elles tendent souvent à s’atténuer d’ici la fin du premier trimestre.'],
        toKnow: ['Les organes génitaux commencent tout juste à se différencier, mais le sexe n’est en général identifiable que bien plus tard, lors de l’échographie morphologique.'],
      },
      en: {
        babyDescription:
          'Facial features become more defined, the eyelids protect the eyes, and the hands and feet are taking shape with the future fingers and toes.',
        length: 'About 22 mm',
        comparison: 'Strawberry',
        bodyChanges: ['Marked fatigue and nausea may still be present; they often tend to ease off by the end of the first trimester.'],
        toKnow: ['The genital organs are just beginning to differentiate, but the sex generally isn’t identifiable until much later, at the anatomy ultrasound.'],
      },
      es: {
        babyDescription:
          'Los rasgos del rostro se precisan, los párpados protegen los ojos, y las manos y los pies van tomando forma con los futuros dedos.',
        length: 'Aproximadamente 22 mm',
        comparison: 'Fresa',
        bodyChanges: ['Todavía puede haber un cansancio marcado y náuseas; suelen tender a atenuarse hacia el final del primer trimestre.'],
        toKnow: ['Los órganos genitales apenas empiezan a diferenciarse, pero el sexo generalmente solo es identificable mucho más tarde, en la ecografía morfológica.'],
      },
      it: {
        babyDescription: 'I tratti del viso diventano più definiti, le palpebre proteggono gli occhi e le mani e i piedi prendono forma, con le future dita.',
        length: 'Circa 22 mm',
        comparison: 'Fragola',
        bodyChanges: [
          'Stanchezza marcata e nausea possono essere ancora presenti; spesso tendono ad attenuarsi verso la fine del primo trimestre.',
        ],
        toKnow: [
          'Gli organi genitali stanno appena iniziando a differenziarsi, ma in genere il sesso non è identificabile fino a molto più tardi, con l’ecografia morfologica.',
        ],
      },
      tr: {
        babyDescription: 'Yüz hatları belirginleşir, göz kapakları gözleri korur; eller ve ayaklar, gelecekteki parmaklarla birlikte şekil almaktadır.',
        length: 'Yaklaşık 22 mm',
        comparison: 'Çilek',
        bodyChanges: [
          'Belirgin yorgunluk ve bulantı hâlâ sürebilir; birinci trimesterin sonuna doğru çoğunlukla hafifleme eğilimindedir.',
        ],
        toKnow: [
          'Cinsel organlar farklılaşmaya yeni başlıyor, ancak cinsiyet genellikle çok daha sonra, anatomi ultrasonunda anlaşılabilir.',
        ],
      },
      ru: {
        babyDescription:
          'Черты лица становятся более чёткими, веки защищают глаза, а кисти и стопы обретают форму — формируются будущие пальцы рук и ног.',
        length:
          'Около 22 мм',
        comparison:
          'Клубника',
        bodyChanges: [
          'Выраженная усталость и тошнота могут сохраняться; к концу первого триместра они нередко ослабевают.',
        ],
        toKnow: [
          'Половые органы только начинают дифференцироваться, но пол, как правило, можно определить гораздо позже — на УЗИ для оценки анатомии плода.',
        ],
      },
      de: {
        babyDescription:
          'Die Gesichtszüge werden deutlicher, die Augenlider schützen die Augen, und Hände und Füße nehmen mit den künftigen Fingern und Zehen Gestalt an.',
        length:
          'Etwa 22 mm',
        comparison:
          'Erdbeere',
        bodyChanges: [
          'Deutliche Müdigkeit und Übelkeit können noch anhalten; oft lassen sie gegen Ende des ersten Trimesters nach.',
        ],
        toKnow: [
          'Die Geschlechtsorgane beginnen sich gerade erst zu differenzieren. Das Geschlecht lässt sich in der Regel aber erst viel später beim Feinultraschall erkennen.',
        ],
      },
      zh: {
        babyDescription: '面部特征更加清晰，眼睑保护着眼睛，手和脚正在成形，将来的手指和脚趾也初具雏形。',
        length: '约 22 毫米',
        comparison: '草莓',
        bodyChanges: [
          '明显的疲倦和恶心可能仍然存在，到孕早期结束时往往会逐渐减轻。',
        ],
        toKnow: [
          '生殖器官刚刚开始分化，但通常要到很久以后的系统超声检查时才能看出性别。',
        ],
      },
      id: {
        babyDescription: 'Fitur wajah makin jelas, kelopak mata melindungi mata, dan tangan serta kaki mulai terbentuk bersama calon jari tangan dan jari kaki.',
        length: 'Sekitar 22 mm',
        comparison: 'Stroberi',
        bodyChanges: [
          'Kelelahan dan mual yang cukup terasa mungkin masih ada; keduanya sering mulai mereda menjelang akhir trimester pertama.',
        ],
        toKnow: [
          'Organ kelamin baru mulai berdiferensiasi, tetapi jenis kelamin umumnya baru dapat diketahui jauh kemudian, saat USG morfologi.',
        ],
      },
      hi: {
        babyDescription: 'चेहरे की बनावट और साफ़ होती है, पलकें आँखों की रक्षा करती हैं, और हाथ-पैर भविष्य की उँगलियों के साथ आकार ले रहे हैं।',
        length: 'लगभग 22 mm',
        comparison: 'स्ट्रॉबेरी',
        bodyChanges: [
          'तेज़ थकान और मितली अब भी हो सकती है; पहली तिमाही के अंत तक ये अक्सर कम होने लगती हैं।',
        ],
        toKnow: [
          'जननांग अभी विभेदित होना शुरू ही हुए हैं, लेकिन शिशु का लिंग आम तौर पर बहुत बाद में, एनाटॉमी अल्ट्रासाउंड में ही पहचाना जा सकता है।',
        ],
      },
      sq: {
        babyDescription: 'Tiparet e fytyrës bëhen më të përcaktuara, qepallat mbrojnë sytë dhe duart e këmbët po marrin formë me gishtat e ardhshëm të duarve dhe të këmbëve.',
        length: 'Rreth 22 mm',
        comparison: 'Luleshtrydhe',
        bodyChanges: [
          'Lodhja e theksuar dhe të përzierat mund të jenë ende të pranishme; shpesh priren të zbuten nga fundi i tremujorit të parë.',
        ],
        toKnow: [
          'Organet gjenitale sapo kanë filluar të diferencohen, por gjinia zakonisht nuk dallohet deri shumë më vonë, në ekografinë e anatomisë.',
        ],
      },
      ja: {
        babyDescription: '顔立ちがはっきりしてきて、まぶたが目を守るようになり、手足には将来の指のもとができ、形を整えつつあります。',
        length: '約22mm',
        comparison: 'イチゴ',
        bodyChanges: [
          '強い疲れや吐き気がまだ続くことがありますが、妊娠初期の終わりにかけて和らいでいくことが多いです。',
        ],
        toKnow: [
          '生殖器は分化が始まったばかりで、性別は通常、ずっと後の胎児の形態を調べる超音波検査（形態スクリーニング）まで判別できません。',
        ],
      },
      ko: {
        babyDescription: '얼굴의 윤곽이 또렷해지고, 눈꺼풀이 눈을 보호하며, 손과 발에는 앞으로 손가락과 발가락이 될 부분이 자리 잡고 있어요.',
        length: '약 22mm',
        comparison: '딸기',
        bodyChanges: [
          '심한 피로와 메스꺼움이 아직 이어질 수 있지만, 임신 초기가 끝날 무렵에는 대개 가라앉는 경향이 있어요.',
        ],
        toKnow: [
          '생식기가 막 분화하기 시작하지만, 성별은 보통 훨씬 뒤에 정밀 초음파에서야 확인할 수 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os traços do rosto tornam-se mais definidos, as pálpebras protegem os olhos e as mãos e os pés ganham forma, com os futuros dedos.',
        length: 'Cerca de 22 mm',
        comparison: 'Morango',
        bodyChanges: [
          'O cansaço acentuado e as náuseas podem ainda estar presentes; muitas vezes tendem a atenuar-se no final do primeiro trimestre.',
        ],
        toKnow: [
          'Os órgãos genitais apenas começam a diferenciar-se, mas o sexo geralmente só é identificável bastante depois, na ecografia morfológica.',
        ],
      },
      bn: {
        babyDescription: 'মুখের গড়ন আরও স্পষ্ট হয়, চোখের পাতা চোখকে ঢেকে রাখে, এবং হাত ও পা ভবিষ্যতের আঙুলসহ আকার পেতে থাকে।',
        length: 'প্রায় 22 মিমি',
        comparison: 'স্ট্রবেরি',
        bodyChanges: [
          'তীব্র ক্লান্তি ও বমি বমি ভাব এখনও থাকতে পারে; প্রথম ত্রৈমাসিকের শেষ দিকে এগুলো প্রায়ই কমে আসে।',
        ],
        toKnow: [
          'যৌনাঙ্গ আলাদা হতে সবে শুরু করেছে, কিন্তু শিশুর লিঙ্গ সাধারণত অনেক পরে, অ্যানাটমি আলট্রাসাউন্ডের আগে শনাক্ত করা যায় না।',
        ],
      },
    },
  },
  {
    week: 10,
    babyImage: require('../assets/images/pregnancy/development/week-10.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le visage devient plus reconnaissable, les paupières réagissent à la lumière et le cœur bat à un rythme rapide, environ trois fois plus vite que celui d’un adulte.',
        length: 'Environ 30 mm',
        comparison: 'Petit abricot',
        bodyChanges: ['Le tour de taille peut commencer à légèrement évoluer, même si le ventre n’est généralement pas encore visible.'],
        toKnow: ['Le dépistage combiné du premier trimestre, quand il est proposé, se fait généralement entre la semaine 11 et la semaine 14.'],
      },
      en: {
        babyDescription:
          'The face becomes more recognizable, the eyelids react to light, and the heart beats at a fast rate, about three times faster than an adult’s.',
        length: 'About 30 mm',
        comparison: 'Small apricot',
        bodyChanges: ['Your waistline may start to change slightly, even though the belly generally isn’t visible yet.'],
        toKnow: ['Combined first-trimester screening, when offered, is generally done between week 11 and week 14.'],
      },
      es: {
        babyDescription:
          'El rostro se vuelve más reconocible, los párpados reaccionan a la luz y el corazón late a un ritmo rápido, aproximadamente tres veces más rápido que el de un adulto.',
        length: 'Aproximadamente 30 mm',
        comparison: 'Albaricoque pequeño',
        bodyChanges: ['Tu contorno de cintura puede empezar a cambiar ligeramente, aunque el vientre generalmente todavía no es visible.'],
        toKnow: ['El cribado combinado del primer trimestre, cuando se ofrece, suele realizarse entre la semana 11 y la semana 14.'],
      },
      it: {
        babyDescription: 'Il viso diventa più riconoscibile, le palpebre reagiscono alla luce e il cuore batte a un ritmo veloce, circa tre volte più rapido di quello di un adulto.',
        length: 'Circa 30 mm',
        comparison: 'Piccola albicocca',
        bodyChanges: [
          'La vita può iniziare a cambiare leggermente, anche se in genere la pancia non è ancora visibile.',
        ],
        toKnow: [
          'Il test combinato del primo trimestre, quando viene proposto, si esegue in genere tra la settimana 11 e la settimana 14.',
        ],
      },
      tr: {
        babyDescription: 'Yüz daha tanınabilir hâle gelir, göz kapakları ışığa tepki verir ve kalp, bir yetişkininkinden yaklaşık üç kat daha hızlı, hızlı bir tempoyla atar.',
        length: 'Yaklaşık 30 mm',
        comparison: 'Küçük kayısı',
        bodyChanges: [
          'Karın genellikle henüz görünmese de bel çevrenizde hafif bir değişiklik başlayabilir.',
        ],
        toKnow: [
          'Birinci trimester birleşik tarama testi, sunulduğunda, genellikle 11. ile 14. haftalar arasında yapılır.',
        ],
      },
      ru: {
        babyDescription:
          'Лицо становится более узнаваемым, веки реагируют на свет, а сердце бьётся в быстром ритме — примерно втрое чаще, чем у взрослого.',
        length:
          'Около 30 мм',
        comparison:
          'Небольшой абрикос',
        bodyChanges: [
          'Талия может начать немного меняться, хотя живот, как правило, ещё не заметен.',
        ],
        toKnow: [
          'Комбинированный скрининг первого триместра, если его предлагают, обычно проводят между 11-й и 14-й неделями.',
        ],
      },
      de: {
        babyDescription:
          'Das Gesicht wird erkennbarer, die Augenlider reagieren auf Licht, und das Herz schlägt sehr schnell – etwa dreimal so schnell wie das eines Erwachsenen.',
        length:
          'Etwa 30 mm',
        comparison:
          'Kleine Aprikose',
        bodyChanges: [
          'Deine Taille kann sich allmählich leicht verändern, auch wenn der Bauch in der Regel noch nicht sichtbar ist.',
        ],
        toKnow: [
          'Das kombinierte Ersttrimester-Screening wird, wenn es angeboten wird, in der Regel zwischen der 11. und der 14. SSW durchgeführt.',
        ],
      },
      zh: {
        babyDescription: '面部更容易辨认，眼睑对光有反应，心跳很快，大约是成年人的三倍。',
        length: '约 30 毫米',
        comparison: '小杏',
        bodyChanges: [
          '腰围可能会开始有些轻微变化，不过肚子通常还看不出来。',
        ],
        toKnow: [
          '孕早期联合筛查（如果提供的话）通常在孕 11 周到孕 14 周之间进行。',
        ],
      },
      id: {
        babyDescription: 'Wajah makin mudah dikenali, kelopak mata bereaksi terhadap cahaya, dan jantung berdetak cepat, sekitar tiga kali lebih cepat daripada jantung orang dewasa.',
        length: 'Sekitar 30 mm',
        comparison: 'Aprikot kecil',
        bodyChanges: [
          'Lingkar pinggangmu mungkin mulai sedikit berubah, meskipun perut umumnya belum terlihat.',
        ],
        toKnow: [
          'Skrining kombinasi trimester pertama, jika ditawarkan, umumnya dilakukan antara minggu ke-11 dan minggu ke-14.',
        ],
      },
      hi: {
        babyDescription: 'चेहरा और पहचानने लायक होता जाता है, पलकें रोशनी पर प्रतिक्रिया करती हैं, और दिल तेज़ गति से धड़कता है, यानी किसी वयस्क के दिल से लगभग तीन गुना तेज़।',
        length: 'लगभग 30 mm',
        comparison: 'छोटी ख़ुबानी',
        bodyChanges: [
          'आपकी कमर में हल्का बदलाव शुरू हो सकता है, भले ही पेट आम तौर पर अभी दिखाई नहीं देता।',
        ],
        toKnow: [
          'पहली तिमाही की संयुक्त स्क्रीनिंग, जब उपलब्ध कराई जाती है, आम तौर पर 11वें और 14वें सप्ताह के बीच की जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Fytyra bëhet më e dallueshme, qepallat reagojnë ndaj dritës dhe zemra rreh me ritëm të shpejtë, rreth tri herë më shpejt se ajo e një të rrituri.',
        length: 'Rreth 30 mm',
        comparison: 'Kajsi e vogël',
        bodyChanges: [
          'Beli yt mund të fillojë të ndryshojë pak, edhe pse barku zakonisht nuk duket ende.',
        ],
        toKnow: [
          'Skriningu i kombinuar i tremujorit të parë, kur ofrohet, zakonisht bëhet midis javës 11 dhe javës 14.',
        ],
      },
      ja: {
        babyDescription: '顔立ちがさらに整い、まぶたは光に反応するようになります。心臓は大人のおよそ3倍の速さで拍動しています。',
        length: '約30mm',
        comparison: '小さなアンズ',
        bodyChanges: [
          'お腹はまだ目立たないのが一般的ですが、ウエストまわりが少し変わり始めることがあります。',
        ],
        toKnow: [
          '妊娠初期の複合スクリーニング検査は、実施される場合、通常、妊娠11週から14週のあいだに行われます。',
        ],
      },
      ko: {
        babyDescription: '얼굴이 더 알아볼 만해지고, 눈꺼풀이 빛에 반응하며, 심장은 어른보다 약 세 배 빠른 속도로 뛰어요.',
        length: '약 30mm',
        comparison: '작은 살구',
        bodyChanges: [
          '아직 배가 눈에 띄지는 않지만, 허리선이 조금씩 달라지기 시작할 수 있어요.',
        ],
        toKnow: [
          '임신 초기 통합 선별검사를 권유받는 경우, 보통 11주에서 14주 사이에 받아요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O rosto fica mais reconhecível, as pálpebras reagem à luz e o coração bate a um ritmo rápido, cerca do triplo da velocidade do coração de um adulto.',
        length: 'Cerca de 30 mm',
        comparison: 'Alperce pequeno',
        bodyChanges: [
          'A cintura pode começar a alterar-se ligeiramente, embora a barriga ainda não seja geralmente visível.',
        ],
        toKnow: [
          'O rastreio combinado do primeiro trimestre, quando é proposto, é geralmente feito entre a semana 11 e a semana 14.',
        ],
      },
      bn: {
        babyDescription: 'মুখ আরও চেনা যায়, চোখের পাতা আলোতে সাড়া দেয়, এবং হৃৎপিণ্ড দ্রুত গতিতে স্পন্দিত হয়, যা প্রাপ্তবয়স্কের হৃৎস্পন্দনের প্রায় তিন গুণ দ্রুত।',
        length: 'প্রায় 30 মিমি',
        comparison: 'ছোট এপ্রিকট',
        bodyChanges: [
          'পেট সাধারণত এখনও দৃশ্যমান না হলেও আপনার কোমরের মাপ সামান্য বদলাতে শুরু করতে পারে।',
        ],
        toKnow: [
          'প্রথম ত্রৈমাসিকের সম্মিলিত স্ক্রিনিং, দেওয়া হলে, সাধারণত 11তম থেকে 14তম সপ্তাহের মধ্যে করা হয়।',
        ],
      },
    },
  },
  {
    week: 11,
    babyImage: require('../assets/images/pregnancy/development/week-11.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les doigts et les orteils se séparent, de minuscules ongles apparaissent, et le placenta prend progressivement le relais du sac vitellin pour nourrir le fœtus.',
        length: 'Environ 41 mm',
        comparison: 'Figue',
        bodyChanges: ['Il est possible de ressentir des variations d’humeur, liées notamment aux changements hormonaux.'],
        toKnow: ['Les mouvements du bébé commencent, mais ils ne sont généralement pas encore ressentis à ce stade.'],
      },
      en: {
        babyDescription:
          'The fingers and toes separate, tiny nails appear, and the placenta gradually takes over from the yolk sac in nourishing the fetus.',
        length: 'About 41 mm',
        comparison: 'Fig',
        bodyChanges: ['You may notice mood swings, linked in particular to hormonal changes.'],
        toKnow: ['The baby’s movements are beginning, but they generally aren’t felt yet at this stage.'],
      },
      es: {
        babyDescription:
          'Los dedos de las manos y los pies se separan, aparecen diminutas uñas, y la placenta va asumiendo progresivamente el papel del saco vitelino para nutrir al feto.',
        length: 'Aproximadamente 41 mm',
        comparison: 'Higo',
        bodyChanges: ['Es posible notar cambios de humor, relacionados en particular con las variaciones hormonales.'],
        toKnow: ['Los movimientos del bebé comienzan, pero generalmente todavía no se sienten en esta etapa.'],
      },
      it: {
        babyDescription: 'Le dita delle mani e dei piedi si separano, compaiono minuscole unghie e la placenta subentra gradualmente al sacco vitellino nel nutrire il feto.',
        length: 'Circa 41 mm',
        comparison: 'Fico',
        bodyChanges: [
          'Potresti notare sbalzi d’umore, legati in particolare ai cambiamenti ormonali.',
        ],
        toKnow: [
          'I movimenti del bambino stanno iniziando, ma in genere in questa fase non si avvertono ancora.',
        ],
      },
      tr: {
        babyDescription: 'Parmaklar ayrılır, küçücük tırnaklar belirir ve plasenta, fetüsü beslemede vitellus kesesinden yavaş yavaş görevi devralır.',
        length: 'Yaklaşık 41 mm',
        comparison: 'İncir',
        bodyChanges: [
          'Özellikle hormonal değişikliklere bağlı olarak ruh hali dalgalanmaları fark edebilirsin.',
        ],
        toKnow: [
          'Bebeğin hareketleri başlıyor, ancak bu aşamada genellikle henüz hissedilmez.',
        ],
      },
      ru: {
        babyDescription:
          'Пальцы рук и ног разделяются, появляются крошечные ногти, а плацента постепенно берёт на себя питание плода от желточного мешка.',
        length:
          'Около 41 мм',
        comparison:
          'Инжир',
        bodyChanges: [
          'Вы можете замечать перепады настроения, связанные в том числе с гормональными изменениями.',
        ],
        toKnow: [
          'Малыш уже начинает двигаться, но на этом этапе движения, как правило, ещё не ощущаются.',
        ],
      },
      de: {
        babyDescription:
          'Finger und Zehen trennen sich, winzige Nägel erscheinen, und die Plazenta übernimmt nach und nach vom Dottersack die Versorgung des Fötus.',
        length:
          'Etwa 41 mm',
        comparison:
          'Feige',
        bodyChanges: [
          'Du kannst Stimmungsschwankungen bemerken, die unter anderem mit den hormonellen Veränderungen zusammenhängen.',
        ],
        toKnow: [
          'Die Bewegungen des Babys beginnen, sind in dieser Phase aber in der Regel noch nicht zu spüren.',
        ],
      },
      zh: {
        babyDescription: '手指和脚趾分开了，小小的指甲出现，胎盘逐渐接替卵黄囊，为胎儿提供营养。',
        length: '约 41 毫米',
        comparison: '无花果',
        bodyChanges: [
          '你可能会注意到情绪起伏，这尤其与激素变化有关。',
        ],
        toKnow: [
          '宝宝已经开始活动，但这个阶段通常还感觉不到。',
        ],
      },
      id: {
        babyDescription: 'Jari tangan dan jari kaki mulai terpisah, kuku-kuku kecil muncul, dan plasenta berangsur menggantikan kantung kuning telur dalam menyuplai nutrisi bagi janin.',
        length: 'Sekitar 41 mm',
        comparison: 'Ara',
        bodyChanges: [
          'Kamu mungkin merasakan suasana hati yang naik turun, yang berkaitan terutama dengan perubahan hormon.',
        ],
        toKnow: [
          'Gerakan bayi sudah dimulai, tetapi umumnya belum terasa pada tahap ini.',
        ],
      },
      hi: {
        babyDescription: 'हाथ-पैर की उँगलियाँ अलग-अलग होती हैं, नन्हे नाख़ून दिखने लगते हैं, और प्लेसेंटा धीरे-धीरे योक सैक की जगह लेकर शिशु को पोषण देने लगता है।',
        length: 'लगभग 41 mm',
        comparison: 'अंजीर',
        bodyChanges: [
          'आपको मूड में उतार-चढ़ाव महसूस हो सकता है, जो ख़ासकर हार्मोन के बदलावों से जुड़ा होता है।',
        ],
        toKnow: [
          'शिशु की हलचल शुरू हो रही है, लेकिन इस चरण में आम तौर पर महसूस नहीं होती।',
        ],
      },
      sq: {
        babyDescription: 'Gishtat e duarve dhe të këmbëve ndahen, shfaqen thonj të vegjël dhe placenta merr gradualisht përsipër nga qesja e verdhëzës ushqimin e fetusit.',
        length: 'Rreth 41 mm',
        comparison: 'Fik',
        bodyChanges: [
          'Mund të vërejsh ndryshime të disponimit, të lidhura veçanërisht me ndryshimet hormonale.',
        ],
        toKnow: [
          'Lëvizjet e bebes kanë filluar, por zakonisht nuk ndihen ende në këtë fazë.',
        ],
      },
      ja: {
        babyDescription: '手足の指が分かれ、小さな爪ができ始めます。胎児に栄養を届ける役割は、卵黄嚢から少しずつ胎盤へと引き継がれていきます。',
        length: '約41mm',
        comparison: 'イチジク',
        bodyChanges: [
          'ホルモンの変化などの影響で、気分の浮き沈みを感じることがあります。',
        ],
        toKnow: [
          '赤ちゃんの動きは始まっていますが、この時期にはまだ感じられないのが一般的です。',
        ],
      },
      ko: {
        babyDescription: '손가락과 발가락이 서로 분리되고, 아주 작은 손발톱이 나타나며, 태아에게 영양을 주는 역할이 난황낭에서 점차 태반으로 넘어가요.',
        length: '약 41mm',
        comparison: '무화과',
        bodyChanges: [
          '특히 호르몬 변화 때문에 기분이 오르내릴 수 있어요.',
        ],
        toKnow: [
          '아기의 움직임이 시작되지만, 이 시기에는 보통 아직 느껴지지 않아요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os dedos das mãos e dos pés separam-se, surgem minúsculas unhas e a placenta vai assumindo gradualmente, em vez do saco vitelino, a nutrição do feto.',
        length: 'Cerca de 41 mm',
        comparison: 'Figo',
        bodyChanges: [
          'Pode notar alterações de humor, ligadas em particular às mudanças hormonais.',
        ],
        toKnow: [
          'Os movimentos do bebé estão a começar, mas geralmente ainda não se sentem nesta fase.',
        ],
      },
      bn: {
        babyDescription: 'হাত ও পায়ের আঙুল আলাদা হয়, ক্ষুদ্র নখ দেখা দেয়, এবং ফিটাসকে পুষ্টি জোগানোর কাজে গর্ভফুল ধীরে ধীরে কুসুম থলির জায়গা নেয়।',
        length: 'প্রায় 41 মিমি',
        comparison: 'ডুমুর',
        bodyChanges: [
          'বিশেষ করে হরমোনের পরিবর্তনের কারণে আপনি মেজাজের ওঠানামা লক্ষ করতে পারেন।',
        ],
        toKnow: [
          'শিশুর নড়াচড়া শুরু হয়েছে, কিন্তু এই পর্যায়ে সাধারণত তা এখনও অনুভব করা যায় না।',
        ],
      },
    },
  },
  {
    week: 12,
    babyImage: require('../assets/images/pregnancy/development/week-12.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les organes internes et les muscles ont bien grandi, et le squelette commence à s’ossifier. Les organes reproducteurs se sont formés, sans être encore visibles à l’échographie.',
        length: 'Environ 5,4 cm',
        comparison: 'Prune',
        bodyChanges: ['Les nausées ont souvent tendance à s’atténuer progressivement autour de cette période, bien que cela varie beaucoup d’une personne à l’autre.'],
        toKnow: ['La fin du premier trimestre est souvent associée à une baisse du risque de fausse couche par rapport aux semaines précédentes.'],
      },
      en: {
        babyDescription:
          'The internal organs and muscles have grown well, and the skeleton is starting to ossify. The reproductive organs have formed, though they aren’t visible on ultrasound yet.',
        length: 'About 5.4 cm',
        comparison: 'Plum',
        bodyChanges: ['Nausea often tends to gradually ease around this time, though this varies a lot from person to person.'],
        toKnow: ['The end of the first trimester is often associated with a lower miscarriage risk compared with the preceding weeks.'],
      },
      es: {
        babyDescription:
          'Los órganos internos y los músculos han crecido bien, y el esqueleto empieza a osificarse. Los órganos reproductores se han formado, aunque todavía no son visibles en la ecografía.',
        length: 'Aproximadamente 5,4 cm',
        comparison: 'Ciruela',
        bodyChanges: ['Las náuseas suelen tender a atenuarse progresivamente en torno a este periodo, aunque esto varía mucho de una persona a otra.'],
        toKnow: ['El final del primer trimestre suele asociarse a una disminución del riesgo de aborto espontáneo en comparación con las semanas anteriores.'],
      },
      it: {
        babyDescription: 'Gli organi interni e i muscoli sono cresciuti bene e lo scheletro comincia a ossificarsi. Gli organi riproduttivi si sono formati, anche se non sono ancora visibili all’ecografia.',
        length: 'Circa 5,4 cm',
        comparison: 'Prugna',
        bodyChanges: [
          'La nausea tende spesso ad attenuarsi gradualmente in questo periodo, anche se varia molto da donna a donna.',
        ],
        toKnow: [
          'La fine del primo trimestre viene spesso associata a un rischio di aborto spontaneo più basso rispetto alle settimane precedenti.',
        ],
      },
      tr: {
        babyDescription: 'İç organlar ve kaslar iyice gelişti, iskelet kemikleşmeye başlıyor. Üreme organları oluştu, ancak ultrasonda henüz görülmüyor.',
        length: 'Yaklaşık 5,4 cm',
        comparison: 'Erik',
        bodyChanges: [
          'Bulantı bu sıralarda çoğunlukla yavaş yavaş hafifleme eğilimindedir, ancak bu kişiden kişiye çok değişir.',
        ],
        toKnow: [
          'Birinci trimesterin sonu, öncesindeki haftalara kıyasla çoğunlukla daha düşük bir düşük riskiyle ilişkilendirilir.',
        ],
      },
      ru: {
        babyDescription:
          'Внутренние органы и мышцы хорошо выросли, скелет начинает окостеневать. Репродуктивные органы сформировались, хотя на УЗИ их пока не видно.',
        length:
          'Около 5,4 см',
        comparison:
          'Слива',
        bodyChanges: [
          'Тошнота в это время нередко постепенно проходит, хотя у разных женщин это сильно различается.',
        ],
        toKnow: [
          'Конец первого триместра часто связывают с более низким риском выкидыша по сравнению с предыдущими неделями.',
        ],
      },
      de: {
        babyDescription:
          'Die inneren Organe und die Muskeln sind gut gewachsen, und das Skelett beginnt zu verknöchern. Die Fortpflanzungsorgane sind angelegt, im Ultraschall aber noch nicht erkennbar.',
        length:
          'Etwa 5,4 cm',
        comparison:
          'Pflaume',
        bodyChanges: [
          'Die Übelkeit lässt um diese Zeit oft allmählich nach, wobei das von Frau zu Frau sehr unterschiedlich ist.',
        ],
        toKnow: [
          'Das Ende des ersten Trimesters wird häufig mit einem geringeren Fehlgeburtsrisiko im Vergleich zu den vorangegangenen Wochen in Verbindung gebracht.',
        ],
      },
      zh: {
        babyDescription: '内脏器官和肌肉已经长得不错，骨骼开始骨化。生殖器官已经形成，不过在超声检查中还看不到。',
        length: '约 5.4 厘米',
        comparison: '李子',
        bodyChanges: [
          '恶心往往会在这个时期逐渐缓解，不过因人而异，差别很大。',
        ],
        toKnow: [
          '孕早期结束时，流产风险通常被认为比之前几周要低。',
        ],
      },
      id: {
        babyDescription: 'Organ dalam dan otot telah tumbuh dengan baik, dan kerangka mulai mengeras. Organ reproduksi sudah terbentuk, meski belum terlihat pada USG.',
        length: 'Sekitar 5,4 cm',
        comparison: 'Plum',
        bodyChanges: [
          'Mual sering mulai mereda secara bertahap sekitar waktu ini, meski hal ini sangat berbeda dari satu orang ke orang lain.',
        ],
        toKnow: [
          'Akhir trimester pertama sering dikaitkan dengan risiko keguguran yang lebih rendah dibandingkan minggu-minggu sebelumnya.',
        ],
      },
      hi: {
        babyDescription: 'भीतरी अंग और मांसपेशियाँ अच्छी तरह बढ़ चुकी हैं, और कंकाल की हड्डियाँ सख़्त होना शुरू हो रही हैं। प्रजनन अंग बन चुके हैं, हालाँकि वे अभी अल्ट्रासाउंड में दिखाई नहीं देते।',
        length: 'लगभग 5.4 cm',
        comparison: 'आलू बुखारा',
        bodyChanges: [
          'मितली अक्सर इसी समय के आसपास धीरे-धीरे कम होने लगती है, हालाँकि यह हर महिला में काफ़ी अलग होता है।',
        ],
        toKnow: [
          'पहली तिमाही का अंत अक्सर पिछले सप्ताहों की तुलना में गर्भपात के कम जोखिम से जोड़ा जाता है।',
        ],
      },
      sq: {
        babyDescription: 'Organet e brendshme dhe muskujt janë rritur mirë dhe skeleti ka filluar të ngurtësohet (osifikohet). Organet riprodhuese janë formuar, edhe pse nuk duken ende në ekografi.',
        length: 'Rreth 5.4 cm',
        comparison: 'Kumbull',
        bodyChanges: [
          'Të përzierat shpesh priren të zbuten gradualisht rreth kësaj kohe, megjithëse kjo ndryshon shumë nga një grua te tjetra.',
        ],
        toKnow: [
          'Fundi i tremujorit të parë shpesh lidhet me një rrezik më të ulët aborti spontan krahasuar me javët e mëparshme.',
        ],
      },
      ja: {
        babyDescription: '内臓や筋肉がしっかり育ち、骨格では骨化が始まっています。生殖器はできあがっていますが、超音波検査ではまだ見えません。',
        length: '約5.4cm',
        comparison: 'プラム',
        bodyChanges: [
          'この頃から吐き気が少しずつ和らいでくることが多いですが、個人差がとても大きいです。',
        ],
        toKnow: [
          '妊娠初期の終わりは、それまでの週と比べて流産のリスクが低くなる時期とされることが多いです。',
        ],
      },
      ko: {
        babyDescription: '내장 기관과 근육이 잘 자랐고, 골격이 단단해지기(골화) 시작해요. 생식 기관이 형성되었지만 아직 초음파로는 보이지 않아요.',
        length: '약 5.4cm',
        comparison: '자두',
        bodyChanges: [
          '이 무렵부터 메스꺼움이 점차 가라앉는 경우가 많지만, 사람마다 많이 달라요.',
        ],
        toKnow: [
          '임신 초기가 끝나는 시기에는 그 이전 몇 주에 비해 유산 위험이 낮아지는 것으로 알려져 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os órgãos internos e os músculos cresceram bem e o esqueleto começa a ossificar-se. Os órgãos reprodutores já se formaram, embora ainda não sejam visíveis na ecografia.',
        length: 'Cerca de 5,4 cm',
        comparison: 'Ameixa',
        bodyChanges: [
          'As náuseas tendem frequentemente a atenuar-se gradualmente por volta desta altura, embora isto varie muito de mulher para mulher.',
        ],
        toKnow: [
          'O fim do primeiro trimestre é frequentemente associado a um menor risco de aborto espontâneo em comparação com as semanas anteriores.',
        ],
      },
      bn: {
        babyDescription: 'অভ্যন্তরীণ অঙ্গ ও পেশি ভালোভাবে বেড়েছে এবং কঙ্কাল শক্ত হতে শুরু করেছে। প্রজনন অঙ্গ গঠিত হয়েছে, যদিও আলট্রাসাউন্ডে তা এখনও দেখা যায় না।',
        length: 'প্রায় 5.4 সেমি',
        comparison: 'আলুবুখারা',
        bodyChanges: [
          'এই সময়ের কাছাকাছি বমি বমি ভাব প্রায়ই ধীরে ধীরে কমে আসে, যদিও এটি একজন থেকে আরেকজনে অনেক ভিন্ন হয়।',
        ],
        toKnow: [
          'প্রথম ত্রৈমাসিকের শেষ দিকে, আগের সপ্তাহগুলোর তুলনায় গর্ভপাতের ঝুঁকি প্রায়ই কম থাকে।',
        ],
      },
    },
  },
  {
    week: 13,
    babyImage: require('../assets/images/pregnancy/development/week-13.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les mouvements, encore saccadés, deviennent un peu plus coordonnés. Certains bébés esquissent déjà un réflexe de succion du pouce.',
        length: 'Environ 7,4 cm',
        comparison: 'Pêche',
        bodyChanges: ['Beaucoup de personnes retrouvent progressivement un peu plus d’énergie à l’approche du deuxième trimestre.'],
        toKnow: ['Le premier trimestre se termine généralement autour de cette semaine ; le suivi se poursuit avec des rendez-vous plus espacés.'],
      },
      en: {
        babyDescription:
          'Movements, still jerky, become a little more coordinated. Some babies already show a thumb-sucking reflex.',
        length: 'About 7.4 cm',
        comparison: 'Peach',
        bodyChanges: ['Many people gradually regain a bit more energy as the second trimester approaches.'],
        toKnow: ['The first trimester generally ends around this week; care continues with more widely spaced appointments.'],
      },
      es: {
        babyDescription:
          'Los movimientos, todavía entrecortados, se vuelven un poco más coordinados. Algunos bebés ya esbozan un reflejo de succión del pulgar.',
        length: 'Aproximadamente 7,4 cm',
        comparison: 'Melocotón',
        bodyChanges: ['Muchas personas recuperan progresivamente algo más de energía a medida que se acerca el segundo trimestre.'],
        toKnow: ['El primer trimestre suele terminar alrededor de esta semana; el seguimiento continúa con consultas más espaciadas.'],
      },
      it: {
        babyDescription: 'I movimenti, ancora a scatti, diventano un po’ più coordinati. Alcuni bambini mostrano già il riflesso di succhiarsi il pollice.',
        length: 'Circa 7,4 cm',
        comparison: 'Pesca',
        bodyChanges: [
          'Molte donne recuperano gradualmente un po’ più di energia con l’avvicinarsi del secondo trimestre.',
        ],
        toKnow: [
          'Il primo trimestre termina in genere intorno a questa settimana; l’assistenza prosegue con appuntamenti più distanziati.',
        ],
      },
      tr: {
        babyDescription: 'Hâlâ sarsıntılı olan hareketler biraz daha eşgüdümlü hâle gelir. Bazı bebeklerde parmak emme refleksi şimdiden görülür.',
        length: 'Yaklaşık 7,4 cm',
        comparison: 'Şeftali',
        bodyChanges: [
          'Birçok kişi ikinci trimestere yaklaşırken enerjisinin biraz daha geri geldiğini hisseder.',
        ],
        toKnow: [
          'Birinci trimester genellikle bu hafta civarında sona erer; takip, daha seyrek aralıklarla yapılan randevularla sürer.',
        ],
      },
      ru: {
        babyDescription:
          'Движения, пока ещё резкие, становятся немного более скоординированными. Некоторые малыши уже демонстрируют сосательный рефлекс и сосут большой палец.',
        length:
          'Около 7,4 см',
        comparison:
          'Персик',
        bodyChanges: [
          'Многие женщины постепенно чувствуют себя немного бодрее по мере приближения второго триместра.',
        ],
        toKnow: [
          'Первый триместр, как правило, заканчивается примерно на этой неделе; наблюдение продолжается с более редкими визитами.',
        ],
      },
      de: {
        babyDescription:
          'Die noch ruckartigen Bewegungen werden etwas koordinierter. Manche Babys zeigen bereits einen Daumenlutsch-Reflex.',
        length:
          'Etwa 7,4 cm',
        comparison:
          'Pfirsich',
        bodyChanges: [
          'Viele Frauen gewinnen mit dem näher rückenden zweiten Trimester nach und nach wieder etwas mehr Energie.',
        ],
        toKnow: [
          'Das erste Trimester endet in der Regel um diese Woche; die Vorsorge wird mit zeitlich weiter auseinanderliegenden Terminen fortgesetzt.',
        ],
      },
      zh: {
        babyDescription: '动作仍然有些抽动，但变得更协调了一点。有些宝宝已经出现吮吸拇指的反射。',
        length: '约 7.4 厘米',
        comparison: '桃子',
        bodyChanges: [
          '随着孕中期临近，很多人的精力会逐渐恢复一些。',
        ],
        toKnow: [
          '孕早期通常在这一周前后结束，之后的产检间隔会拉长一些。',
        ],
      },
      id: {
        babyDescription: 'Gerakan yang masih kaku menjadi sedikit lebih terkoordinasi. Beberapa bayi bahkan sudah menunjukkan refleks mengisap jempol.',
        length: 'Sekitar 7,4 cm',
        comparison: 'Persik',
        bodyChanges: [
          'Banyak orang berangsur-angsur memiliki sedikit lebih banyak energi menjelang trimester kedua.',
        ],
        toKnow: [
          'Trimester pertama umumnya berakhir sekitar minggu ini; pemeriksaan kehamilan berlanjut dengan jadwal kunjungan yang lebih jarang.',
        ],
      },
      hi: {
        babyDescription: 'झटकेदार हलचलें अब थोड़ी और तालमेल वाली हो जाती हैं। कुछ शिशुओं में अँगूठा चूसने की प्रतिक्रिया पहले से दिखने लगती है।',
        length: 'लगभग 7.4 cm',
        comparison: 'आड़ू',
        bodyChanges: [
          'दूसरी तिमाही नज़दीक आने पर कई महिलाओं में धीरे-धीरे कुछ ज़्यादा ऊर्जा लौट आती है।',
        ],
        toKnow: [
          'पहली तिमाही आम तौर पर इसी सप्ताह के आसपास पूरी होती है; देखभाल जारी रहती है, लेकिन अपॉइंटमेंट के बीच अब ज़्यादा अंतर होता है।',
        ],
      },
      sq: {
        babyDescription: 'Lëvizjet, ende të ndërprera, bëhen pak më të koordinuara. Disa bebe tregojnë tashmë refleksin e thithjes së gishtit të madh.',
        length: 'Rreth 7.4 cm',
        comparison: 'Pjeshkë',
        bodyChanges: [
          'Shumë gra rifitojnë gradualisht pak më shumë energji teksa afron tremujori i dytë.',
        ],
        toKnow: [
          'Tremujori i parë zakonisht mbaron rreth kësaj jave; kujdesi vazhdon me takime më të rralla.',
        ],
      },
      ja: {
        babyDescription: 'ぎこちなかった動きが、少しずつ協調して動くようになります。すでに指しゃぶりの反射が見られる赤ちゃんもいます。',
        length: '約7.4cm',
        comparison: 'モモ',
        bodyChanges: [
          '妊娠中期が近づくにつれて、少しずつ元気が戻ってくる人が多いです。',
        ],
        toKnow: [
          '妊娠初期は通常この週頃に終わり、その後は健診の間隔が広がりながら妊娠中のケアが続きます。',
        ],
      },
      ko: {
        babyDescription: '아직 갑작스럽던 움직임이 조금 더 부드럽게 조절되기 시작해요. 벌써 엄지손가락을 빠는 반사를 보이는 아기도 있어요.',
        length: '약 7.4cm',
        comparison: '복숭아',
        bodyChanges: [
          '임신 중기가 다가오면서 점차 기력을 조금 되찾는 사람이 많아요.',
        ],
        toKnow: [
          '임신 초기는 대개 이번 주 무렵에 끝나며, 이후에는 진료 간격이 더 넓어지면서 검진이 이어져요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os movimentos, ainda bruscos, tornam-se um pouco mais coordenados. Alguns bebés já mostram o reflexo de sucção do polegar.',
        length: 'Cerca de 7,4 cm',
        comparison: 'Pêssego',
        bodyChanges: [
          'Muitas mulheres recuperam gradualmente um pouco mais de energia à medida que o segundo trimestre se aproxima.',
        ],
        toKnow: [
          'O primeiro trimestre termina geralmente por volta desta semana; a vigilância prossegue com consultas mais espaçadas.',
        ],
      },
      bn: {
        babyDescription: 'এখনও ঝাঁকুনিযুক্ত নড়াচড়া কিছুটা বেশি সমন্বিত হয়ে ওঠে। কিছু শিশুর মধ্যে আঙুল চোষার প্রতিবর্ত ক্রিয়া ইতিমধ্যেই দেখা যায়।',
        length: 'প্রায় 7.4 সেমি',
        comparison: 'পীচ',
        bodyChanges: [
          'দ্বিতীয় ত্রৈমাসিক ঘনিয়ে আসার সঙ্গে সঙ্গে অনেকে ধীরে ধীরে আরও কিছুটা শক্তি ফিরে পান।',
        ],
        toKnow: [
          'প্রথম ত্রৈমাসিক সাধারণত এই সপ্তাহের কাছাকাছি শেষ হয়; এরপর আরও বিরতি দিয়ে অ্যাপয়েন্টমেন্টের মাধ্যমে যত্ন চলতে থাকে।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- weeks 14–19 (early second trimester)
  {
    week: 14,
    babyImage: require('../assets/images/pregnancy/development/week-14.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'La tête s’arrondit et se proportionne davantage avec le reste du corps. Le fœtus avale un peu de liquide amniotique, qui transite par l’estomac et les reins.',
        length: 'Environ 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['Le ventre commence à s’arrondir plus visiblement chez certaines personnes.'],
        toKnow: ['Un professionnel de santé peut parfois commencer à entendre le rythme cardiaque avec un appareil à ultrasons posé sur le ventre.'],
      },
      en: {
        babyDescription:
          'The head becomes more rounded and more proportionate with the rest of the body. The fetus swallows a little amniotic fluid, which passes through the stomach and kidneys.',
        length: 'About 8.5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['The belly starts to round out more visibly for some people.'],
        toKnow: ['A healthcare professional can sometimes start hearing the heartbeat with an ultrasound device placed on the belly.'],
      },
      es: {
        babyDescription:
          'La cabeza se redondea y se proporciona cada vez más con el resto del cuerpo. El feto traga un poco de líquido amniótico, que pasa por el estómago y los riñones.',
        length: 'Aproximadamente 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['El vientre empieza a redondearse de forma más visible en algunas personas.'],
        toKnow: ['Un profesional de la salud a veces puede empezar a oír el ritmo cardiaco con un aparato de ultrasonidos colocado sobre el vientre.'],
      },
      it: {
        babyDescription: 'La testa diventa più rotonda e più proporzionata al resto del corpo. Il feto ingerisce un po’ di liquido amniotico, che passa attraverso lo stomaco e i reni.',
        length: 'Circa 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Per alcune donne la pancia inizia ad arrotondarsi in modo più visibile.',
        ],
        toKnow: [
          'Un professionista sanitario può a volte iniziare a sentire il battito cardiaco con un apparecchio a ultrasuoni appoggiato sulla pancia.',
        ],
      },
      tr: {
        babyDescription: 'Baş daha yuvarlak hâle gelir ve vücudun geri kalanıyla daha orantılı olur. Fetüs biraz amniyon sıvısı yutar; bu sıvı mideden ve böbreklerden geçer.',
        length: 'Yaklaşık 8,5 cm',
        comparison: 'Kivi',
        bodyChanges: [
          'Bazı kişilerde karın daha belirgin biçimde yuvarlaklaşmaya başlar.',
        ],
        toKnow: [
          'Bir sağlık profesyoneli, karnın üzerine yerleştirilen bir ultrason cihazıyla kalp atışını bazen duymaya başlayabilir.',
        ],
      },
      ru: {
        babyDescription:
          'Голова становится более округлой и лучше соотносится с пропорциями тела. Плод проглатывает немного околоплодных вод, которые проходят через желудок и почки.',
        length:
          'Около 8,5 см',
        comparison:
          'Киви',
        bodyChanges: [
          'У некоторых женщин живот начинает заметнее округляться.',
        ],
        toKnow: [
          'Специалист иногда может начать слышать сердцебиение с помощью ультразвукового прибора, приложенного к животу.',
        ],
      },
      de: {
        babyDescription:
          'Der Kopf wird runder und steht in besserem Verhältnis zum übrigen Körper. Der Fötus schluckt ein wenig Fruchtwasser, das durch Magen und Nieren läuft.',
        length:
          'Etwa 8,5 cm',
        comparison:
          'Kiwi',
        bodyChanges: [
          'Bei manchen Frauen beginnt sich der Bauch deutlicher zu runden.',
        ],
        toKnow: [
          'Medizinisches Fachpersonal kann den Herzschlag manchmal schon mit einem Ultraschallgerät auf dem Bauch hören.',
        ],
      },
      zh: {
        babyDescription: '头部变得更圆，与身体其他部分更成比例。胎儿会吞咽少量羊水，羊水会经过胃和肾脏。',
        length: '约 8.5 厘米',
        comparison: '猕猴桃',
        bodyChanges: [
          '对有些人来说，肚子开始更明显地隆起。',
        ],
        toKnow: [
          '医疗专业人员有时可以用放在肚子上的超声设备开始听到胎心。',
        ],
      },
      id: {
        babyDescription: 'Kepala menjadi lebih bulat dan lebih proporsional dengan tubuh. Janin menelan sedikit air ketuban, yang kemudian melewati lambung dan ginjal.',
        length: 'Sekitar 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Perut mulai tampak lebih membulat pada sebagian orang.',
        ],
        toKnow: [
          'Tenaga kesehatan terkadang sudah mulai bisa mendengar detak jantung bayi dengan alat USG yang ditempelkan di perut.',
        ],
      },
      hi: {
        babyDescription: 'सिर और गोल होता है और शरीर के बाक़ी हिस्सों के साथ ज़्यादा अनुपात में आ जाता है। शिशु थोड़ा उल्ब द्रव (एम्नियोटिक फ़्लूइड) निगलता है, जो पेट और गुर्दों से होकर गुज़रता है।',
        length: 'लगभग 8.5 cm',
        comparison: 'कीवी',
        bodyChanges: [
          'कुछ महिलाओं में पेट अब ज़्यादा साफ़ तौर पर उभरने लगता है।',
        ],
        toKnow: [
          'पेट पर रखे अल्ट्रासाउंड उपकरण से स्वास्थ्य विशेषज्ञ कभी-कभी शिशु की धड़कन सुनना शुरू कर सकते हैं।',
        ],
      },
      sq: {
        babyDescription: 'Koka bëhet më e rrumbullakët dhe më proporcionale me pjesën tjetër të trupit. Fetusi gëlltit pak lëng amniotik, i cili kalon nëpër stomak dhe veshka.',
        length: 'Rreth 8.5 cm',
        comparison: 'Kivi',
        bodyChanges: [
          'Barku fillon të rrumbullakoset më dukshëm për disa gra.',
        ],
        toKnow: [
          'Një profesionist i shëndetësisë ndonjëherë mund të fillojë të dëgjojë rrahjet e zemrës me një aparat ekografie të vendosur mbi bark.',
        ],
      },
      ja: {
        babyDescription: '頭が丸みを帯び、体とのバランスが整ってきます。胎児は羊水を少しずつ飲み込み、それが胃や腎臓を通っていきます。',
        length: '約8.5cm',
        comparison: 'キウイ',
        bodyChanges: [
          'お腹の丸みがはっきりしてくる人もいます。',
        ],
        toKnow: [
          '医療従事者が、お腹に当てた超音波の機器で、赤ちゃんの心音を聞き取り始めることがあります。',
        ],
      },
      ko: {
        babyDescription: '머리가 더 둥글어지고 몸과의 비율이 맞아가요. 태아는 양수를 조금씩 삼키고, 양수는 위와 신장을 거쳐 지나가요.',
        length: '약 8.5cm',
        comparison: '키위',
        bodyChanges: [
          '일부 사람은 배가 눈에 띄게 둥글어지기 시작해요.',
        ],
        toKnow: [
          '의료 전문가가 배 위에 초음파 기기를 대면 심장 박동 소리를 듣기 시작할 수 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A cabeça arredonda-se e fica proporcional ao resto do corpo. O feto engole um pouco de líquido amniótico, que passa pelo estômago e pelos rins.',
        length: 'Cerca de 8,5 cm',
        comparison: 'Quivi',
        bodyChanges: [
          'A barriga começa a arredondar-se de forma mais visível em algumas mulheres.',
        ],
        toKnow: [
          'Um profissional de saúde pode, por vezes, começar a ouvir o batimento cardíaco com um aparelho de ecografia colocado sobre a barriga.',
        ],
      },
      bn: {
        babyDescription: 'মাথা আরও গোলাকার হয় এবং দেহের বাকি অংশের সঙ্গে আরও সামঞ্জস্যপূর্ণ হয়। ফিটাস অল্প পরিমাণে অ্যামনিওটিক তরল গিলে ফেলে, যা পাকস্থলী ও কিডনির মধ্য দিয়ে যায়।',
        length: 'প্রায় 8.5 সেমি',
        comparison: 'কিউই',
        bodyChanges: [
          'কারও কারও ক্ষেত্রে পেট আরও স্পষ্টভাবে গোলাকার হতে শুরু করে।',
        ],
        toKnow: [
          'পেটের ওপর আলট্রাসাউন্ড যন্ত্র রেখে স্বাস্থ্যসেবা পেশাজীবী কখনও কখনও হৃৎস্পন্দন শুনতে শুরু করতে পারেন।',
        ],
      },
    },
  },
  {
    week: 15,
    babyImage: require('../assets/images/pregnancy/development/week-15.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Un fin duvet appelé lanugo recouvre progressivement la peau, et les sourcils ainsi que les cils commencent à apparaître. Les yeux deviennent sensibles à la lumière.',
        length: 'Environ 10,1 cm',
        comparison: 'Pomme',
        bodyChanges: ['L’appétit peut évoluer, avec parfois de nouvelles envies ou aversions alimentaires.'],
        toKnow: ['L’audition commence à se développer vers cette période : la voix et les bruits internes du corps deviennent progressivement perceptibles.'],
      },
      en: {
        babyDescription:
          'A fine down called lanugo gradually covers the skin, and eyebrows and eyelashes begin to appear. The eyes become sensitive to light.',
        length: 'About 10.1 cm',
        comparison: 'Apple',
        bodyChanges: ['Your appetite may change, sometimes with new food cravings or aversions.'],
        toKnow: ['Hearing begins developing around this time: your voice and the body’s internal sounds gradually become perceptible.'],
      },
      es: {
        babyDescription:
          'Un vello fino llamado lanugo va cubriendo progresivamente la piel, y empiezan a aparecer las cejas y las pestañas. Los ojos se vuelven sensibles a la luz.',
        length: 'Aproximadamente 10,1 cm',
        comparison: 'Manzana',
        bodyChanges: ['El apetito puede cambiar, a veces con nuevos antojos o aversiones alimentarias.'],
        toKnow: ['La audición empieza a desarrollarse hacia este periodo: tu voz y los sonidos internos del cuerpo se vuelven progresivamente perceptibles.'],
      },
      it: {
        babyDescription: 'Una lanugine sottile chiamata lanugo ricopre gradualmente la pelle e iniziano a comparire sopracciglia e ciglia. Gli occhi diventano sensibili alla luce.',
        length: 'Circa 10,1 cm',
        comparison: 'Mela',
        bodyChanges: [
          'Il tuo appetito può cambiare, a volte con nuove voglie o avversioni per certi cibi.',
        ],
        toKnow: [
          'L’udito comincia a svilupparsi in questo periodo: la tua voce e i suoni interni del corpo diventano gradualmente percepibili.',
        ],
      },
      tr: {
        babyDescription: 'Lanugo adı verilen ince bir tüy tabakası cildi yavaş yavaş kaplar; kaşlar ve kirpikler belirmeye başlar. Gözler ışığa duyarlı hâle gelir.',
        length: 'Yaklaşık 10,1 cm',
        comparison: 'Elma',
        bodyChanges: [
          'İştahın değişebilir; bazen yeni yiyecek istekleri ya da hoşlanmamalar ortaya çıkar.',
        ],
        toKnow: [
          'İşitme bu sıralarda gelişmeye başlar: sesin ve vücudun iç sesleri yavaş yavaş algılanabilir hâle gelir.',
        ],
      },
      ru: {
        babyDescription:
          'Кожу постепенно покрывает нежный пушок — лануго, начинают появляться брови и ресницы. Глаза становятся чувствительными к свету.',
        length:
          'Около 10,1 см',
        comparison:
          'Яблоко',
        bodyChanges: [
          'Аппетит может меняться, иногда появляются новые пищевые пристрастия или отвращение к некоторым продуктам.',
        ],
        toKnow: [
          'Примерно в это время начинает развиваться слух: ваш голос и внутренние звуки тела постепенно становятся различимыми.',
        ],
      },
      de: {
        babyDescription:
          'Ein feiner Flaum, die sogenannte Lanugo, bedeckt nach und nach die Haut, und Augenbrauen und Wimpern beginnen zu wachsen. Die Augen werden lichtempfindlich.',
        length:
          'Etwa 10,1 cm',
        comparison:
          'Apfel',
        bodyChanges: [
          'Dein Appetit kann sich verändern, manchmal mit neuem Heißhunger oder neuen Abneigungen.',
        ],
        toKnow: [
          'Das Gehör beginnt sich um diese Zeit zu entwickeln: Deine Stimme und die Geräusche im Inneren deines Körpers werden nach und nach wahrnehmbar.',
        ],
      },
      zh: {
        babyDescription: '一层叫做胎毛的细软绒毛逐渐覆盖皮肤，眉毛和睫毛开始出现。眼睛开始对光敏感。',
        length: '约 10.1 厘米',
        comparison: '苹果',
        bodyChanges: [
          '你的食欲可能会改变，有时会出现新的食物渴望或抗拒。',
        ],
        toKnow: [
          '听觉大约在这个时候开始发育：你的声音和身体内部的声音会逐渐被听到。',
        ],
      },
      id: {
        babyDescription: 'Bulu halus yang disebut lanugo berangsur menutupi kulit, dan alis serta bulu mata mulai muncul. Mata menjadi peka terhadap cahaya.',
        length: 'Sekitar 10,1 cm',
        comparison: 'Apel',
        bodyChanges: [
          'Nafsu makanmu bisa berubah, terkadang dengan keinginan atau rasa tidak suka baru pada makanan tertentu.',
        ],
        toKnow: [
          'Pendengaran mulai berkembang sekitar waktu ini: suaramu dan bunyi-bunyi dari dalam tubuh berangsur dapat ditangkap.',
        ],
      },
      hi: {
        babyDescription: 'त्वचा पर लैनुगो नाम के बारीक रोएँ धीरे-धीरे आ जाते हैं, और भौहें व पलकें उभरने लगती हैं। आँखें रोशनी के प्रति संवेदनशील हो जाती हैं।',
        length: 'लगभग 10.1 cm',
        comparison: 'सेब',
        bodyChanges: [
          'आपकी भूख बदल सकती है, कभी-कभी खाने की नई इच्छाएँ या कुछ चीज़ों से अरुचि भी हो सकती है।',
        ],
        toKnow: [
          'इसी समय के आसपास सुनने की क्षमता विकसित होने लगती है: आपकी आवाज़ और शरीर की भीतरी आवाज़ें धीरे-धीरे सुनाई देने लगती हैं।',
        ],
      },
      sq: {
        babyDescription: 'Një push i hollë, i quajtur lanugo, mbulon gradualisht lëkurën, ndërsa vetullat dhe qerpikët fillojnë të shfaqen. Sytë bëhen të ndjeshëm ndaj dritës.',
        length: 'Rreth 10,1 cm',
        comparison: 'Mollë',
        bodyChanges: [
          'Oreksi yt mund të ndryshojë, ndonjëherë me dëshira të reja për ushqime ose me neveri ndaj disa prej tyre.',
        ],
        toKnow: [
          'Dëgjimi fillon të zhvillohet rreth kësaj kohe: zëri yt dhe tingujt e brendshëm të trupit bëhen gradualisht të perceptueshëm.',
        ],
      },
      ja: {
        babyDescription: 'ランゴと呼ばれる細かい産毛が少しずつ皮膚をおおい、眉毛やまつ毛も生え始めます。目は光に敏感になります。',
        length: '約10.1cm',
        comparison: 'りんご',
        bodyChanges: [
          '食欲が変わることがあり、新しく食べたくなるものや苦手になるものが出てくる場合もあります。',
        ],
        toKnow: [
          'このころから聴覚が発達し始め、ご自身の声や体の中の音が少しずつ聞こえるようになります。',
        ],
      },
      ko: {
        babyDescription: '라누고라는 가는 솜털이 피부를 서서히 덮고, 눈썹과 속눈썹이 나기 시작해요. 눈은 빛에 민감해져요.',
        length: '약 10.1cm',
        comparison: '사과',
        bodyChanges: [
          '식욕이 달라질 수 있고, 새로 당기는 음식이나 싫어지는 음식이 생기기도 해요.',
        ],
        toKnow: [
          '이 무렵부터 청각이 발달하기 시작해요. 엄마의 목소리와 몸속 소리가 서서히 들리게 돼요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Uma penugem fina, chamada lanugo, vai cobrindo gradualmente a pele, e começam a surgir sobrancelhas e pestanas. Os olhos tornam-se sensíveis à luz.',
        length: 'Cerca de 10,1 cm',
        comparison: 'Maçã',
        bodyChanges: [
          'O seu apetite pode mudar, por vezes com novos desejos ou aversões alimentares.',
        ],
        toKnow: [
          'A audição começa a desenvolver-se por esta altura: a sua voz e os sons internos do corpo tornam-se gradualmente percetíveis.',
        ],
      },
      bn: {
        babyDescription: 'ল্যানুগো নামের একটি সূক্ষ্ম লোম ধীরে ধীরে ত্বক ঢেকে দেয়, আর ভ্রু ও চোখের পাপড়ি দেখা দিতে শুরু করে। চোখ আলোর প্রতি সংবেদনশীল হয়ে ওঠে।',
        length: 'প্রায় 10.1 সেমি',
        comparison: 'আপেল',
        bodyChanges: [
          'আপনার ক্ষুধায় পরিবর্তন আসতে পারে, কখনো নতুন খাবারের প্রতি লোভ বা অরুচি দেখা দিতে পারে।',
        ],
        toKnow: [
          'এই সময়ের কাছাকাছি শোনার ক্ষমতা গড়ে উঠতে শুরু করে: আপনার কণ্ঠস্বর ও শরীরের ভেতরের শব্দ ধীরে ধীরে শিশুর কাছে বোধগম্য হতে থাকে।',
        ],
      },
    },
  },
  {
    week: 16,
    babyImage: require('../assets/images/pregnancy/development/week-16.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le système nerveux permet des mouvements des bras et des jambes. Les mains peuvent se refermer en petits poings.',
        length: 'Environ 11,6 cm',
        comparison: 'Avocat',
        bodyChanges: ['Certaines personnes commencent à ressentir de très légers mouvements à partir de cette période, souvent décrits comme des papillonnements.'],
        toKnow: ['Ressentir les premiers mouvements varie beaucoup d’une grossesse à l’autre, en particulier selon qu’il s’agit d’une première grossesse.'],
      },
      en: {
        babyDescription: 'The nervous system allows arm and leg movements. The hands can close into little fists.',
        length: 'About 11.6 cm',
        comparison: 'Avocado',
        bodyChanges: ['Some people start feeling very light movements from around this time, often described as fluttering.'],
        toKnow: ['Feeling the first movements varies a lot from one pregnancy to another, particularly depending on whether it’s a first pregnancy.'],
      },
      es: {
        babyDescription: 'El sistema nervioso permite movimientos de los brazos y las piernas. Las manos pueden cerrarse formando pequeños puños.',
        length: 'Aproximadamente 11,6 cm',
        comparison: 'Aguacate',
        bodyChanges: ['Algunas personas empiezan a notar movimientos muy ligeros a partir de este periodo, a menudo descritos como un aleteo.'],
        toKnow: ['Sentir los primeros movimientos varía mucho de un embarazo a otro, en particular según se trate o no de un primer embarazo.'],
      },
      it: {
        babyDescription: 'Il sistema nervoso permette i movimenti di braccia e gambe. Le mani possono chiudersi in piccoli pugni.',
        length: 'Circa 11,6 cm',
        comparison: 'Avocado',
        bodyChanges: [
          'Alcune donne iniziano ad avvertire movimenti molto leggeri a partire da questo periodo, spesso descritti come un battito d’ali.',
        ],
        toKnow: [
          'Avvertire i primi movimenti varia molto da una gravidanza all’altra, in particolare a seconda che si tratti o meno di una prima gravidanza.',
        ],
      },
      tr: {
        babyDescription: 'Sinir sistemi kol ve bacak hareketlerine olanak tanır. Eller küçük yumruklar hâlinde kapanabilir.',
        length: 'Yaklaşık 11,6 cm',
        comparison: 'Avokado',
        bodyChanges: [
          'Bazı kişiler bu sıralarda, çoğunlukla kanat çırpmasına benzetilen çok hafif hareketleri hissetmeye başlar.',
        ],
        toKnow: [
          'İlk hareketlerin hissedilmesi, özellikle ilk gebelik olup olmamasına bağlı olarak bir gebelikten diğerine çok değişir.',
        ],
      },
      ru: {
        babyDescription:
          'Нервная система позволяет двигать руками и ногами. Кисти могут сжиматься в маленькие кулачки.',
        length:
          'Около 11,6 см',
        comparison:
          'Авокадо',
        bodyChanges: [
          'Некоторые женщины начинают ощущать очень лёгкие движения примерно с этого времени — их часто описывают как трепетание.',
        ],
        toKnow: [
          'Время, когда женщина впервые ощущает шевеления, сильно различается от одной беременности к другой, в частности в зависимости от того, первая ли это беременность.',
        ],
      },
      de: {
        babyDescription:
          'Das Nervensystem ermöglicht Bewegungen von Armen und Beinen. Die Hände können sich zu kleinen Fäusten schließen.',
        length:
          'Etwa 11,6 cm',
        comparison:
          'Avocado',
        bodyChanges: [
          'Manche Frauen spüren ab etwa dieser Zeit sehr leichte Bewegungen, die oft als Flattern beschrieben werden.',
        ],
        toKnow: [
          'Wann man die ersten Bewegungen spürt, ist von Schwangerschaft zu Schwangerschaft sehr verschieden – unter anderem davon abhängig, ob es die erste Schwangerschaft ist.',
        ],
      },
      zh: {
        babyDescription: '神经系统已经能让手臂和腿活动。小手可以握成小拳头。',
        length: '约 11.6 厘米',
        comparison: '牛油果',
        bodyChanges: [
          '有些人大约从这个时候开始感觉到非常轻微的胎动，常被形容为轻轻的扑动。',
        ],
        toKnow: [
          '第一次感觉到胎动的时间因每次怀孕而差别很大，尤其取决于是不是第一次怀孕。',
        ],
      },
      id: {
        babyDescription: 'Sistem saraf memungkinkan gerakan lengan dan kaki. Tangan sudah bisa mengepal menjadi kepalan kecil.',
        length: 'Sekitar 11,6 cm',
        comparison: 'Alpukat',
        bodyChanges: [
          'Sebagian orang mulai merasakan gerakan yang sangat ringan sejak sekitar waktu ini, yang sering digambarkan seperti kepakan halus.',
        ],
        toKnow: [
          'Waktu pertama kali merasakan gerakan bayi sangat bervariasi dari satu kehamilan ke kehamilan lain, terutama tergantung apakah ini kehamilan pertama.',
        ],
      },
      hi: {
        babyDescription: 'तंत्रिका तंत्र की मदद से बाँहों और पैरों की हरकत होने लगती है। हाथ छोटी-छोटी मुट्ठियों में बंद हो सकते हैं।',
        length: 'लगभग 11.6 cm',
        comparison: 'एवोकाडो',
        bodyChanges: [
          'कुछ महिलाएँ इसी समय के आसपास बहुत हल्की हलचल महसूस करने लगती हैं, जिसे अक्सर फड़फड़ाहट जैसा बताया जाता है।',
        ],
        toKnow: [
          'पहली हलचल महसूस होना हर गर्भावस्था में काफ़ी अलग होता है, ख़ासकर इस पर निर्भर करता है कि यह पहली गर्भावस्था है या नहीं।',
        ],
      },
      sq: {
        babyDescription: 'Sistemi nervor lejon lëvizjet e krahëve dhe këmbëve. Duart mund të mbyllen si grushte të vegjël.',
        length: 'Rreth 11,6 cm',
        comparison: 'Avokado',
        bodyChanges: [
          'Disa gra fillojnë të ndjejnë lëvizje shumë të lehta nga kjo kohë, që shpesh përshkruhen si dridhje të buta, si fluturim.',
        ],
        toKnow: [
          'Ndjenja e lëvizjeve të para ndryshon shumë nga një shtatzëni te tjetra, sidomos në varësi të faktit nëse është shtatzënia e parë.',
        ],
      },
      ja: {
        babyDescription: '神経系が発達して、腕や脚を動かせるようになります。手は小さなこぶしを握ることができます。',
        length: '約11.6cm',
        comparison: 'アボカド',
        bodyChanges: [
          'このころから、ごく軽い動きを感じ始める人もいます。ふわふわと羽ばたくような感覚と表現されることが多いようです。',
        ],
        toKnow: [
          '初めての胎動を感じる時期は、妊娠ごとに大きく異なります。特に初めての妊娠かどうかによっても変わります。',
        ],
      },
      ko: {
        babyDescription: '신경계가 발달해 팔다리를 움직일 수 있어요. 손은 작은 주먹을 쥘 수 있어요.',
        length: '약 11.6cm',
        comparison: '아보카도',
        bodyChanges: [
          '이 무렵부터 아주 가벼운 움직임을 느끼기 시작하는 사람도 있어요. 흔히 뱃속이 간질거리는 느낌이라고 해요.',
        ],
        toKnow: [
          '첫 태동을 느끼는 시기는 임신마다 많이 달라요. 특히 첫 임신인지에 따라 차이가 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O sistema nervoso permite os movimentos dos braços e das pernas. As mãos podem fechar-se em pequenos punhos.',
        length: 'Cerca de 11,6 cm',
        comparison: 'Abacate',
        bodyChanges: [
          'Algumas pessoas começam a sentir movimentos muito ligeiros a partir desta altura, frequentemente descritos como um esvoaçar.',
        ],
        toKnow: [
          'Sentir os primeiros movimentos varia muito de uma gravidez para outra, em particular consoante se trate ou não de uma primeira gravidez.',
        ],
      },
      bn: {
        babyDescription: 'স্নায়ুতন্ত্রের কারণে হাত ও পায়ের নড়াচড়া সম্ভব হয়। হাত ছোট মুঠিতে বন্ধ হতে পারে।',
        length: 'প্রায় 11.6 সেমি',
        comparison: 'অ্যাভোকাডো',
        bodyChanges: [
          'কেউ কেউ এই সময় থেকে খুব মৃদু নড়াচড়া টের পেতে শুরু করেন, যা প্রায়ই পাখনা ঝাপটানোর মতো বলে বর্ণনা করা হয়।',
        ],
        toKnow: [
          'প্রথম নড়াচড়া টের পাওয়া এক গর্ভাবস্থা থেকে আরেক গর্ভাবস্থায় অনেক আলাদা হয়, বিশেষ করে এটি প্রথম গর্ভাবস্থা কি না তার ওপর নির্ভর করে।',
        ],
      },
    },
  },
  {
    week: 17,
    babyImage: require('../assets/images/pregnancy/development/week-17.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les yeux, encore fermés, peuvent bouger, et le bébé réagit désormais aux sons forts. Les empreintes digitales commencent à se dessiner.',
        length: 'Environ 12 cm',
        comparison: 'Grenade',
        bodyChanges: ['Des maux de dos légers peuvent apparaître à mesure que le centre de gravité change.'],
        toKnow: ['Les bruits extérieurs commencent à être perçus, de façon atténuée, à travers le liquide amniotique.'],
      },
      en: {
        babyDescription:
          'The eyes, still closed, can move, and the baby now reacts to loud sounds. Fingerprints are starting to form.',
        length: 'About 12 cm',
        comparison: 'Pomegranate',
        bodyChanges: ['Mild back pain may appear as your center of gravity shifts.'],
        toKnow: ['Outside sounds are starting to be perceived, in muffled form, through the amniotic fluid.'],
      },
      es: {
        babyDescription:
          'Los ojos, todavía cerrados, pueden moverse, y el bebé ahora reacciona a los sonidos fuertes. Las huellas digitales empiezan a formarse.',
        length: 'Aproximadamente 12 cm',
        comparison: 'Granada',
        bodyChanges: ['Pueden aparecer dolores de espalda leves a medida que cambia tu centro de gravedad.'],
        toKnow: ['Los sonidos externos empiezan a percibirse, de forma amortiguada, a través del líquido amniótico.'],
      },
      it: {
        babyDescription: 'Gli occhi, ancora chiusi, possono muoversi e il bambino ora reagisce ai suoni forti. Le impronte digitali iniziano a formarsi.',
        length: 'Circa 12 cm',
        comparison: 'Melograno',
        bodyChanges: [
          'Può comparire un lieve mal di schiena, dovuto allo spostamento del tuo baricentro.',
        ],
        toKnow: [
          'I suoni esterni iniziano a essere percepiti, in forma attutita, attraverso il liquido amniotico.',
        ],
      },
      tr: {
        babyDescription: 'Hâlâ kapalı olan gözler hareket edebilir ve bebek artık yüksek seslere tepki verir. Parmak izleri oluşmaya başlıyor.',
        length: 'Yaklaşık 12 cm',
        comparison: 'Nar',
        bodyChanges: [
          'Ağırlık merkezin değiştikçe hafif bir bel ağrısı ortaya çıkabilir.',
        ],
        toKnow: [
          'Dıştaki sesler, amniyon sıvısı aracılığıyla boğuk bir biçimde algılanmaya başlıyor.',
        ],
      },
      ru: {
        babyDescription:
          'Глаза, пока ещё закрытые, могут двигаться, а малыш уже реагирует на громкие звуки. Начинают формироваться отпечатки пальцев.',
        length:
          'Около 12 см',
        comparison:
          'Гранат',
        bodyChanges: [
          'Может появиться лёгкая боль в спине из-за смещения центра тяжести.',
        ],
        toKnow: [
          'Внешние звуки начинают восприниматься — приглушённо, сквозь околоплодные воды.',
        ],
      },
      de: {
        babyDescription:
          'Die noch geschlossenen Augen können sich bewegen, und das Baby reagiert jetzt auf laute Geräusche. Die Fingerabdrücke beginnen sich zu bilden.',
        length:
          'Etwa 12 cm',
        comparison:
          'Granatapfel',
        bodyChanges: [
          'Leichte Rückenschmerzen können auftreten, weil sich dein Körperschwerpunkt verlagert.',
        ],
        toKnow: [
          'Geräusche von außen werden durch das Fruchtwasser allmählich gedämpft wahrgenommen.',
        ],
      },
      zh: {
        babyDescription: '眼睛仍然闭着，但可以转动，宝宝现在会对很大的声音有反应。指纹开始形成。',
        length: '约 12 厘米',
        comparison: '石榴',
        bodyChanges: [
          '随着重心发生变化，可能会出现轻微的背痛。',
        ],
        toKnow: [
          '外界的声音开始透过羊水，以模糊的方式被宝宝听到。',
        ],
      },
      id: {
        babyDescription: 'Mata, yang masih tertutup, bisa bergerak, dan bayi kini bereaksi terhadap suara keras. Sidik jari mulai terbentuk.',
        length: 'Sekitar 12 cm',
        comparison: 'Delima',
        bodyChanges: [
          'Nyeri punggung ringan bisa muncul seiring bergesernya pusat gravitasimu.',
        ],
        toKnow: [
          'Suara dari luar mulai terdengar, secara samar, melalui air ketuban.',
        ],
      },
      hi: {
        babyDescription: 'आँखें अभी बंद हैं, फिर भी हिल सकती हैं, और शिशु अब तेज़ आवाज़ों पर प्रतिक्रिया देता है। उँगलियों के निशान बनने शुरू हो रहे हैं।',
        length: 'लगभग 12 cm',
        comparison: 'अनार',
        bodyChanges: [
          'गुरुत्व केंद्र बदलने के कारण पीठ में हल्का दर्द हो सकता है।',
        ],
        toKnow: [
          'बाहर की आवाज़ें उल्बीय द्रव (एम्नियोटिक फ़्लूइड) के ज़रिए दबी हुई सी सुनाई देने लगती हैं।',
        ],
      },
      sq: {
        babyDescription: 'Sytë, ende të mbyllur, mund të lëvizin, dhe bebja tani reagon ndaj tingujve të fortë. Gjurmët e gishtave po fillojnë të formohen.',
        length: 'Rreth 12 cm',
        comparison: 'Shegë',
        bodyChanges: [
          'Një dhimbje e lehtë shpine mund të shfaqet ndërsa qendra jote e gravitetit zhvendoset.',
        ],
        toKnow: [
          'Tingujt e jashtëm fillojnë të perceptohen, të zbutur, përmes lëngut amniotik.',
        ],
      },
      ja: {
        babyDescription: 'まだ閉じたままの目を動かせるようになり、大きな音にも反応するようになります。指紋ができ始めます。',
        length: '約12cm',
        comparison: 'ざくろ',
        bodyChanges: [
          '重心が変わることで、軽い腰や背中の痛みが出ることがあります。',
        ],
        toKnow: [
          '外の音が、羊水を通してこもった音として聞こえ始めます。',
        ],
      },
      ko: {
        babyDescription: '아직 감겨 있는 눈이 움직일 수 있고, 이제 큰 소리에 반응해요. 지문이 만들어지기 시작해요.',
        length: '약 12cm',
        comparison: '석류',
        bodyChanges: [
          '몸의 무게중심이 바뀌면서 가벼운 허리 통증이 생길 수 있어요.',
        ],
        toKnow: [
          '바깥 소리가 양수를 통해 먹먹하게나마 들리기 시작해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os olhos, ainda fechados, conseguem mexer-se, e o bebé já reage a sons fortes. As impressões digitais começam a formar-se.',
        length: 'Cerca de 12 cm',
        comparison: 'Romã',
        bodyChanges: [
          'Pode surgir uma dor ligeira nas costas à medida que o seu centro de gravidade se desloca.',
        ],
        toKnow: [
          'Os sons do exterior começam a ser percebidos, de forma abafada, através do líquido amniótico.',
        ],
      },
      bn: {
        babyDescription: 'চোখ এখনো বন্ধ থাকলেও নড়তে পারে, আর শিশু এখন জোরালো শব্দে সাড়া দেয়। আঙুলের ছাপ তৈরি হতে শুরু করেছে।',
        length: 'প্রায় 12 সেমি',
        comparison: 'ডালিম',
        bodyChanges: [
          'শরীরের ভারকেন্দ্র সরে যাওয়ায় হালকা পিঠব্যথা দেখা দিতে পারে।',
        ],
        toKnow: [
          'বাইরের শব্দ অ্যামনিওটিক তরলের মধ্য দিয়ে অস্পষ্টভাবে শিশুর কাছে পৌঁছাতে শুরু করে।',
        ],
      },
    },
  },
  {
    week: 18,
    babyImage: require('../assets/images/pregnancy/development/week-18.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'L’audition, le toucher, la déglutition et le réflexe de succion continuent de se développer. Le bébé devient de plus en plus actif, avec davantage de mouvements des bras et des jambes.',
        length: 'Environ 14,2 cm',
        comparison: 'Poivron',
        bodyChanges: ['Le ventre est souvent bien visible à ce stade, et le centre de gravité continue de se déplacer.'],
        toKnow: ['L’échographie morphologique, qui examine le développement général du bébé, est généralement proposée entre la semaine 18 et la semaine 21.'],
      },
      en: {
        babyDescription:
          'Hearing, touch, swallowing, and the sucking reflex continue developing. The baby is becoming more and more active, with more arm and leg movements.',
        length: 'About 14.2 cm',
        comparison: 'Bell pepper',
        bodyChanges: ['The belly is often clearly visible at this stage, and your center of gravity keeps shifting.'],
        toKnow: ['The anatomy ultrasound, which examines the baby’s overall development, is generally offered between week 18 and week 21.'],
      },
      es: {
        babyDescription:
          'La audición, el tacto, la deglución y el reflejo de succión siguen desarrollándose. El bebé se vuelve cada vez más activo, con más movimientos de brazos y piernas.',
        length: 'Aproximadamente 14,2 cm',
        comparison: 'Pimiento',
        bodyChanges: ['El vientre suele ser bien visible en esta etapa, y tu centro de gravedad continúa desplazándose.'],
        toKnow: ['La ecografía morfológica, que examina el desarrollo general del bebé, suele ofrecerse entre la semana 18 y la semana 21.'],
      },
      it: {
        babyDescription: 'Udito, tatto, deglutizione e riflesso di suzione continuano a svilupparsi. Il bambino è sempre più attivo, con più movimenti di braccia e gambe.',
        length: 'Circa 14,2 cm',
        comparison: 'Peperone',
        bodyChanges: [
          'In questa fase la pancia è spesso ben visibile e il tuo baricentro continua a spostarsi.',
        ],
        toKnow: [
          'L’ecografia morfologica, che esamina lo sviluppo complessivo del bambino, viene in genere proposta tra la settimana 18 e la settimana 21.',
        ],
      },
      tr: {
        babyDescription: 'İşitme, dokunma, yutma ve emme refleksi gelişmeye devam eder. Bebek giderek daha aktif hâle geliyor, kol ve bacak hareketleri artıyor.',
        length: 'Yaklaşık 14,2 cm',
        comparison: 'Dolmalık biber',
        bodyChanges: [
          'Karın bu aşamada çoğunlukla belirgin biçimde görünür ve ağırlık merkezin değişmeye devam eder.',
        ],
        toKnow: [
          'Bebeğin genel gelişimini inceleyen anatomi ultrasonu genellikle 18. ile 21. haftalar arasında sunulur.',
        ],
      },
      ru: {
        babyDescription:
          'Продолжают развиваться слух, осязание, глотание и сосательный рефлекс. Малыш становится всё активнее, движений руками и ногами становится больше.',
        length:
          'Около 14,2 см',
        comparison:
          'Болгарский перец',
        bodyChanges: [
          'На этом этапе живот часто уже хорошо заметен, а центр тяжести продолжает смещаться.',
        ],
        toKnow: [
          'УЗИ для оценки анатомии плода, которое позволяет оценить общее развитие малыша, обычно предлагают между 18-й и 21-й неделями.',
        ],
      },
      de: {
        babyDescription:
          'Gehör, Tastsinn, Schluckreflex und Saugreflex entwickeln sich weiter. Das Baby wird immer aktiver und bewegt Arme und Beine häufiger.',
        length:
          'Etwa 14,2 cm',
        comparison:
          'Paprika',
        bodyChanges: [
          'Der Bauch ist in dieser Phase oft deutlich sichtbar, und dein Körperschwerpunkt verlagert sich weiter.',
        ],
        toKnow: [
          'Der Feinultraschall, bei dem die gesamte Entwicklung des Babys untersucht wird, wird in der Regel zwischen der 18. und der 21. SSW angeboten.',
        ],
      },
      zh: {
        babyDescription: '听觉、触觉、吞咽和吮吸反射继续发育。宝宝越来越活跃，手臂和腿的动作也更多了。',
        length: '约 14.2 厘米',
        comparison: '甜椒',
        bodyChanges: [
          '这个阶段肚子通常已经很明显，你的重心也在持续变化。',
        ],
        toKnow: [
          '检查宝宝整体发育情况的系统超声检查，通常安排在孕 18 周到孕 21 周之间。',
        ],
      },
      id: {
        babyDescription: 'Pendengaran, indra peraba, kemampuan menelan, dan refleks mengisap terus berkembang. Bayi makin aktif, dengan lebih banyak gerakan lengan dan kaki.',
        length: 'Sekitar 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: [
          'Perut sering sudah terlihat jelas pada tahap ini, dan pusat gravitasimu terus bergeser.',
        ],
        toKnow: [
          'USG morfologi, yang memeriksa perkembangan keseluruhan bayi, umumnya ditawarkan antara minggu ke-18 dan minggu ke-21.',
        ],
      },
      hi: {
        babyDescription: 'सुनने, छूने, निगलने और चूसने की प्रतिक्रिया का विकास जारी रहता है। शिशु और ज़्यादा सक्रिय होता जाता है, बाँहों और पैरों की हरकतें बढ़ जाती हैं।',
        length: 'लगभग 14.2 cm',
        comparison: 'शिमला मिर्च',
        bodyChanges: [
          'इस अवस्था में पेट अक्सर साफ़ दिखने लगता है, और आपका गुरुत्व केंद्र बदलता रहता है।',
        ],
        toKnow: [
          'एनाटॉमी अल्ट्रासाउंड, जिसमें शिशु के समग्र विकास की जाँच होती है, आमतौर पर 18वें से 21वें सप्ताह के बीच कराने की सलाह दी जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Dëgjimi, prekja, gëlltitja dhe refleksi i thithjes vazhdojnë të zhvillohen. Bebja bëhet gjithnjë e më aktive, me më shumë lëvizje të krahëve dhe të këmbëve.',
        length: 'Rreth 14,2 cm',
        comparison: 'Spec dolli',
        bodyChanges: [
          'Barku shpesh duket qartë në këtë fazë, dhe qendra jote e gravitetit vazhdon të zhvendoset.',
        ],
        toKnow: [
          'Ekografia morfologjike, që shqyrton zhvillimin e përgjithshëm të bebes, ofrohet zakonisht mes javës 18 dhe javës 21.',
        ],
      },
      ja: {
        babyDescription: '聴覚、触覚、飲み込む力、吸う反射の発達が続きます。腕や脚の動きが増え、赤ちゃんはますます活発になっていきます。',
        length: '約14.2cm',
        comparison: 'ピーマン',
        bodyChanges: [
          'この時期はおなかがはっきり目立つことが多く、重心の変化も続きます。',
        ],
        toKnow: [
          '赤ちゃんの全体的な発育を調べる精密超音波検査（形態異常スクリーニング）は、一般に妊娠18週から21週の間に勧められます。',
        ],
      },
      ko: {
        babyDescription: '청각, 촉각, 삼키기, 빨기 반사가 계속 발달해요. 아기는 점점 더 활발해지고 팔다리를 더 많이 움직여요.',
        length: '약 14.2cm',
        comparison: '파프리카',
        bodyChanges: [
          '이 시기에는 배가 눈에 띄게 나오는 경우가 많고, 몸의 무게중심도 계속 바뀌어요.',
        ],
        toKnow: [
          '아기의 전반적인 발달을 살펴보는 정밀 초음파 검사는 보통 18주에서 21주 사이에 받도록 안내해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A audição, o tato, a deglutição e o reflexo de sucção continuam a desenvolver-se. O bebé vai ficando cada vez mais ativo, com movimentos de braços e pernas em maior número.',
        length: 'Cerca de 14,2 cm',
        comparison: 'Pimento',
        bodyChanges: [
          'Nesta fase, a barriga é frequentemente bem visível e o seu centro de gravidade continua a deslocar-se.',
        ],
        toKnow: [
          'A ecografia morfológica, que examina o desenvolvimento global do bebé, é geralmente proposta entre a semana 18 e a semana 21.',
        ],
      },
      bn: {
        babyDescription: 'শোনা, স্পর্শ, গেলা এবং চোষার প্রতিবর্তক্রিয়া বিকশিত হতে থাকে। শিশু ক্রমেই আরও সক্রিয় হয়ে উঠছে, হাত ও পায়ের নড়াচড়া বাড়ছে।',
        length: 'প্রায় 14.2 সেমি',
        comparison: 'ক্যাপসিকাম',
        bodyChanges: [
          'এই পর্যায়ে পেট প্রায়ই স্পষ্ট দেখা যায়, আর আপনার শরীরের ভারকেন্দ্র সরতে থাকে।',
        ],
        toKnow: [
          'শিশুর সার্বিক বিকাশ পরীক্ষা করার জন্য অ্যানাটমি আলট্রাসাউন্ড সাধারণত 18 থেকে 21 সপ্তাহের মধ্যে করার পরামর্শ দেওয়া হয়।',
        ],
      },
    },
  },
  {
    week: 19,
    babyImage: require('../assets/images/pregnancy/development/week-19.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les futures dents définitives commencent à se former derrière les dents de lait en préparation, et le bébé continue de prendre du poids progressivement.',
        length: 'Environ 15,3 cm',
        comparison: 'Grosse tomate',
        bodyChanges: ['Une sensation de tiraillement sur les côtés du ventre (douleurs ligamentaires) peut survenir avec la croissance de l’utérus.'],
        toKnow: ['C’est une période fréquente pour commencer à ressentir plus distinctement les mouvements du bébé.'],
      },
      en: {
        babyDescription:
          'The future permanent teeth begin forming behind the baby teeth being prepared, and the baby continues gradually gaining weight.',
        length: 'About 15.3 cm',
        comparison: 'Large tomato',
        bodyChanges: ['A pulling sensation on the sides of the belly (round ligament pain) may occur as the uterus grows.'],
        toKnow: ['This is a common time to start feeling the baby’s movements more distinctly.'],
      },
      es: {
        babyDescription:
          'Los futuros dientes definitivos empiezan a formarse detrás de los dientes de leche en preparación, y el bebé sigue ganando peso progresivamente.',
        length: 'Aproximadamente 15,3 cm',
        comparison: 'Tomate grande',
        bodyChanges: ['Puede aparecer una sensación de tirón en los laterales del vientre (dolor ligamentoso) a medida que crece el útero.'],
        toKnow: ['Este es un periodo frecuente para empezar a sentir con más claridad los movimientos del bebé.'],
      },
      it: {
        babyDescription: 'I futuri denti permanenti iniziano a formarsi dietro i denti da latte in preparazione, e il bambino continua ad aumentare gradualmente di peso.',
        length: 'Circa 15,3 cm',
        comparison: 'Pomodoro grande',
        bodyChanges: [
          'Con la crescita dell’utero può comparire una sensazione di tiraggio ai lati della pancia (dolore ai legamenti rotondi).',
        ],
        toKnow: [
          'È un momento frequente in cui si iniziano ad avvertire più distintamente i movimenti del bambino.',
        ],
      },
      tr: {
        babyDescription: 'Gelecekteki kalıcı dişler, hazırlanmakta olan süt dişlerinin arkasında oluşmaya başlar ve bebek yavaş yavaş kilo almaya devam eder.',
        length: 'Yaklaşık 15,3 cm',
        comparison: 'Büyük domates',
        bodyChanges: [
          'Rahim büyüdükçe karnın yanlarında çekilme hissi (yuvarlak bağ ağrısı) ortaya çıkabilir.',
        ],
        toKnow: [
          'Bebeğin hareketlerini daha belirgin hissetmeye başlamak için yaygın bir zamandır.',
        ],
      },
      ru: {
        babyDescription:
          'За молочными зубами, которые готовятся к прорезыванию, начинают формироваться будущие постоянные зубы, а малыш продолжает постепенно набирать вес.',
        length:
          'Около 15,3 см',
        comparison:
          'Крупный помидор',
        bodyChanges: [
          'По мере роста матки может возникать ощущение тянущей боли по бокам живота (боль в круглых связках).',
        ],
        toKnow: [
          'Обычно именно в это время движения малыша начинают ощущаться отчётливее.',
        ],
      },
      de: {
        babyDescription:
          'Hinter den Milchzahnanlagen beginnen sich die künftigen bleibenden Zähne zu bilden, und das Baby nimmt weiter nach und nach an Gewicht zu.',
        length:
          'Etwa 15,3 cm',
        comparison:
          'Große Tomate',
        bodyChanges: [
          'Ein Ziehen an den Seiten des Bauches (Mutterbandschmerzen) kann auftreten, während die Gebärmutter wächst.',
        ],
        toKnow: [
          'Um diese Zeit beginnen viele Frauen, die Bewegungen des Babys deutlicher zu spüren.',
        ],
      },
      zh: {
        babyDescription: '未来的恒牙开始在正在准备的乳牙后面形成，宝宝的体重也在继续逐渐增加。',
        length: '约 15.3 厘米',
        comparison: '大番茄',
        bodyChanges: [
          '随着子宫增大，肚子两侧可能会有牵拉感（圆韧带痛）。',
        ],
        toKnow: [
          '这通常是开始更明显地感觉到宝宝胎动的时期。',
        ],
      },
      id: {
        babyDescription: 'Calon gigi permanen mulai terbentuk di balik gigi susu yang sedang dipersiapkan, dan berat badan bayi terus bertambah secara bertahap.',
        length: 'Sekitar 15,3 cm',
        comparison: 'Tomat besar',
        bodyChanges: [
          'Sensasi tertarik di sisi perut (nyeri ligamen bulat) bisa terjadi seiring membesarnya rahim.',
        ],
        toKnow: [
          'Inilah waktu yang umum untuk mulai merasakan gerakan bayi dengan lebih jelas.',
        ],
      },
      hi: {
        babyDescription: 'भविष्य के स्थायी दाँत दूध के दाँतों के पीछे बनना शुरू हो जाते हैं, और शिशु का वज़न धीरे-धीरे बढ़ता रहता है।',
        length: 'लगभग 15.3 cm',
        comparison: 'बड़ा टमाटर',
        bodyChanges: [
          'गर्भाशय बढ़ने के साथ पेट के दोनों ओर खिंचाव जैसा एहसास (राउंड लिगामेंट का दर्द) हो सकता है।',
        ],
        toKnow: [
          'यह वह समय है जब आम तौर पर शिशु की हलचल ज़्यादा साफ़ महसूस होने लगती है।',
        ],
      },
      sq: {
        babyDescription: 'Dhëmbët e ardhshëm të përhershëm fillojnë të formohen pas dhëmbëve të qumështit që po përgatiten, dhe bebja vazhdon të shtojë gradualisht peshë.',
        length: 'Rreth 15,3 cm',
        comparison: 'Domate e madhe',
        bodyChanges: [
          'Mund të ndjesh një tërheqje në anët e barkut (dhimbje e ligamentit të rrumbullakët) ndërsa mitra rritet.',
        ],
        toKnow: [
          'Kjo është një kohë e zakonshme për të nisur t’i ndjesh më qartë lëvizjet e bebes.',
        ],
      },
      ja: {
        babyDescription: '乳歯の準備が進む奥で、将来の永久歯のもとができ始めます。体重も少しずつ増え続けます。',
        length: '約15.3cm',
        comparison: '大きなトマト',
        bodyChanges: [
          '子宮が大きくなるにつれて、おなかの両側が引っ張られるような感覚（円靭帯痛）が出ることがあります。',
        ],
        toKnow: [
          '赤ちゃんの動きをよりはっきり感じ始める人が多い時期です。',
        ],
      },
      ko: {
        babyDescription: '젖니가 준비되는 자리 뒤쪽에서 앞으로 날 영구치가 만들어지기 시작해요. 아기는 계속 조금씩 체중이 늘어요.',
        length: '약 15.3cm',
        comparison: '큰 토마토',
        bodyChanges: [
          '자궁이 커지면서 배 양옆이 당기는 느낌(원인대 통증)이 생길 수 있어요.',
        ],
        toKnow: [
          '보통 이 무렵부터 아기의 움직임을 더 또렷하게 느끼기 시작해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os futuros dentes definitivos começam a formar-se por trás dos dentes de leite em preparação, e o bebé continua a ganhar peso gradualmente.',
        length: 'Cerca de 15,3 cm',
        comparison: 'Tomate grande',
        bodyChanges: [
          'Pode ocorrer uma sensação de repuxar nos lados da barriga (dor dos ligamentos redondos) à medida que o útero cresce.',
        ],
        toKnow: [
          'Esta é uma altura comum para começar a sentir os movimentos do bebé de forma mais nítida.',
        ],
      },
      bn: {
        babyDescription: 'দুধদাঁতের পেছনে ভবিষ্যতের স্থায়ী দাঁত তৈরি হতে শুরু করে, আর শিশুর ওজন ধীরে ধীরে বাড়তে থাকে।',
        length: 'প্রায় 15.3 সেমি',
        comparison: 'বড় টমেটো',
        bodyChanges: [
          'জরায়ু বড় হওয়ার সঙ্গে পেটের দুই পাশে টান টান অনুভূতি (গোল লিগামেন্টের ব্যথা) হতে পারে।',
        ],
        toKnow: [
          'শিশুর নড়াচড়া আরও স্পষ্টভাবে টের পাওয়া শুরু হওয়ার জন্য এটি একটি সাধারণ সময়।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- weeks 20–27 (mid second trimester)
  {
    week: 20,
    babyImage: require('../assets/images/pregnancy/development/week-20.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'À partir de cette semaine, la longueur est mesurée de la tête aux talons plutôt que de la tête au bas du dos, car les jambes sont désormais dépliées et mesurables — ce qui explique une augmentation visible de la taille de référence par rapport aux semaines précédentes.',
        length: 'Environ 25,6 cm',
        comparison: 'Banane',
        bodyChanges: ['Le ventre bien arrondi peut commencer à modifier l’équilibre et la posture.'],
        toKnow: ['La mi-grossesse est souvent marquée par un bilan complet avec le professionnel de santé assurant le suivi.'],
      },
      en: {
        babyDescription:
          'From this week onward, length is measured from head to heel rather than head to bottom, since the legs can now be extended and measured — this explains a visible jump in the reference size compared with previous weeks.',
        length: 'About 25.6 cm',
        comparison: 'Banana',
        bodyChanges: ['Your nicely rounded belly may start to affect your balance and posture.'],
        toKnow: ['The midpoint of pregnancy is often marked by a full check-up with the healthcare professional following your care.'],
      },
      es: {
        babyDescription:
          'A partir de esta semana, la longitud se mide de la cabeza a los talones en lugar de la cabeza a la parte baja de la espalda, ya que las piernas ahora están extendidas y se pueden medir — esto explica un aumento visible de la talla de referencia respecto a las semanas anteriores.',
        length: 'Aproximadamente 25,6 cm',
        comparison: 'Plátano',
        bodyChanges: ['El vientre bien redondeado puede empezar a modificar tu equilibrio y tu postura.'],
        toKnow: ['La mitad del embarazo suele marcarse con un chequeo completo con el profesional de la salud que lleva tu seguimiento.'],
      },
      it: {
        babyDescription: 'Da questa settimana la lunghezza viene misurata dalla testa al tallone anziché dalla testa al sedere, perché ora le gambe possono essere distese e misurate: questo spiega un evidente salto della misura di riferimento rispetto alle settimane precedenti.',
        length: 'Circa 25,6 cm',
        comparison: 'Banana',
        bodyChanges: [
          'La tua pancia ormai ben arrotondata può iniziare a influire sull’equilibrio e sulla postura.',
        ],
        toKnow: [
          'La metà della gravidanza è spesso segnata da un controllo completo con il professionista sanitario che ti segue.',
        ],
      },
      tr: {
        babyDescription: 'Bu haftadan itibaren boy, başın tepesinden kalçaya değil, başın tepesinden topuğa kadar ölçülür; çünkü bacaklar artık uzatılıp ölçülebilir. Bu, önceki haftalara kıyasla referans boyda görünür bir sıçramayı açıklar.',
        length: 'Yaklaşık 25,6 cm',
        comparison: 'Muz',
        bodyChanges: [
          'Güzelce yuvarlaklaşan karnın dengeni ve duruşunu etkilemeye başlayabilir.',
        ],
        toKnow: [
          'Gebeliğin yarısı çoğunlukla, takibini yapan sağlık profesyonelinin yaptığı kapsamlı bir kontrolle işaretlenir.',
        ],
      },
      ru: {
        babyDescription:
          'Начиная с этой недели рост измеряют от макушки до пяток, а не от макушки до копчика, поскольку ноги теперь можно вытянуть и измерить — этим объясняется заметный скачок справочного значения по сравнению с предыдущими неделями.',
        length:
          'Около 25,6 см',
        comparison:
          'Банан',
        bodyChanges: [
          'Ваш округлившийся живот может начать влиять на равновесие и осанку.',
        ],
        toKnow: [
          'Середину беременности часто отмечают полным обследованием у специалиста, который наблюдает вашу беременность.',
        ],
      },
      de: {
        babyDescription:
          'Ab dieser Woche wird die Länge vom Kopf bis zur Ferse statt vom Kopf bis zum Steiß gemessen, weil sich die Beine jetzt strecken und messen lassen – das erklärt den sichtbaren Sprung in der Referenzgröße im Vergleich zu den Vorwochen.',
        length:
          'Etwa 25,6 cm',
        comparison:
          'Banane',
        bodyChanges: [
          'Dein schön gerundeter Bauch kann dein Gleichgewicht und deine Haltung zu beeinflussen beginnen.',
        ],
        toKnow: [
          'Die Mitte der Schwangerschaft wird oft durch eine umfassende Kontrolle bei dem medizinischen Fachpersonal markiert, das deine Vorsorge begleitet.',
        ],
      },
      zh: {
        babyDescription: '从这一周起，长度改为从头量到脚跟，而不是从头量到臀部，因为现在双腿可以伸直并被测量——这也解释了参考尺寸与前几周相比为什么会明显跳升。',
        length: '约 25.6 厘米',
        comparison: '香蕉',
        bodyChanges: [
          '圆润的肚子可能会开始影响你的平衡和姿势。',
        ],
        toKnow: [
          '孕期过半时，通常会由负责你孕期照护的医疗专业人员做一次全面检查。',
        ],
      },
      id: {
        babyDescription: 'Mulai minggu ini, panjang diukur dari kepala hingga tumit, bukan dari kepala hingga bokong, karena kaki kini bisa diluruskan dan diukur — inilah yang menjelaskan lonjakan ukuran acuan yang tampak dibandingkan minggu-minggu sebelumnya.',
        length: 'Sekitar 25,6 cm',
        comparison: 'Pisang',
        bodyChanges: [
          'Perutmu yang membulat indah mungkin mulai memengaruhi keseimbangan dan posturmu.',
        ],
        toKnow: [
          'Pertengahan kehamilan sering ditandai dengan pemeriksaan menyeluruh oleh tenaga kesehatan yang mendampingi kehamilanmu.',
        ],
      },
      hi: {
        babyDescription: 'इस सप्ताह से लंबाई सिर से एड़ी तक नापी जाती है, पहले की तरह सिर से नितंब तक नहीं, क्योंकि अब पैर सीधे किए जा सकते हैं और नापे जा सकते हैं। इसी वजह से पिछले सप्ताहों की तुलना में संदर्भ आकार में साफ़ उछाल दिखता है।',
        length: 'लगभग 25.6 cm',
        comparison: 'केला',
        bodyChanges: [
          'आपका सुंदर गोल पेट आपके संतुलन और चलने-बैठने के ढंग पर असर डाल सकता है।',
        ],
        toKnow: [
          'गर्भावस्था के आधे पड़ाव पर अक्सर आपकी देखभाल कर रहे स्वास्थ्य विशेषज्ञ के साथ पूरी जाँच कराई जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Nga kjo javë e tutje, gjatësia matet nga koka te thembra dhe jo më nga koka te vithet, pasi këmbët tani mund të shtrihen dhe të maten — kjo shpjegon një ndryshim të dukshëm në madhësinë e referencës krahasuar me javët e mëparshme.',
        length: 'Rreth 25,6 cm',
        comparison: 'Banane',
        bodyChanges: [
          'Barku yt i rrumbullakosur bukur mund të fillojë të ndikojë te ekuilibri dhe qëndrimi i trupit.',
        ],
        toKnow: [
          'Mesi i shtatzënisë shpesh shënohet me një kontroll të plotë te profesionisti i shëndetësisë që të ndjek.',
        ],
      },
      ja: {
        babyDescription: 'この週からは、頭からおしりまでではなく、頭からかかとまでを測ります。脚を伸ばして測れるようになるためで、これまでの週と比べて目安の大きさが目に見えて大きくなるのはこのためです。',
        length: '約25.6cm',
        comparison: 'バナナ',
        bodyChanges: [
          '丸みを帯びてきたおなかが、バランスや姿勢に影響し始めることがあります。',
        ],
        toKnow: [
          '妊娠の折り返し地点には、担当の医療従事者による総合的な健診が行われることが多いです。',
        ],
      },
      ko: {
        babyDescription: '이번 주부터는 다리를 펴서 잴 수 있게 되어, 머리에서 엉덩이까지가 아니라 머리에서 발뒤꿈치까지의 길이를 재요. 그래서 이전 주차보다 기준 크기가 눈에 띄게 커져요.',
        length: '약 25.6cm',
        comparison: '바나나',
        bodyChanges: [
          '동그랗게 나온 배 때문에 균형과 자세에 영향을 받기 시작할 수 있어요.',
        ],
        toKnow: [
          '임신 중반에는 진료를 맡은 의료 전문가와 함께 전반적인 검진을 받는 경우가 많아요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A partir desta semana, o comprimento passa a ser medido da cabeça ao calcanhar e não da cabeça ao rabiote, visto que as pernas já podem ser esticadas e medidas — isto explica um salto visível no tamanho de referência em comparação com as semanas anteriores.',
        length: 'Cerca de 25,6 cm',
        comparison: 'Banana',
        bodyChanges: [
          'A sua barriga bem redonda pode começar a afetar o equilíbrio e a postura.',
        ],
        toKnow: [
          'O meio da gravidez é frequentemente assinalado por uma consulta de revisão completa com o profissional de saúde que a acompanha.',
        ],
      },
      bn: {
        babyDescription: 'এই সপ্তাহ থেকে দৈর্ঘ্য মাথা থেকে নিতম্ব পর্যন্ত না মেপে মাথা থেকে গোড়ালি পর্যন্ত মাপা হয়, কারণ এখন পা সোজা করে মাপা যায়। এ কারণেই আগের সপ্তাহগুলোর তুলনায় রেফারেন্স আকারে চোখে পড়ার মতো লাফ দেখা যায়।',
        length: 'প্রায় 25.6 সেমি',
        comparison: 'কলা',
        bodyChanges: [
          'আপনার সুন্দর গোলাকার পেট শরীরের ভারসাম্য ও দাঁড়ানোর ভঙ্গিতে প্রভাব ফেলতে শুরু করতে পারে।',
        ],
        toKnow: [
          'গর্ভাবস্থার মধ্যবর্তী সময়কে প্রায়ই আপনার যত্ন নেওয়া স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে একটি পূর্ণাঙ্গ চেক-আপের মাধ্যমে চিহ্নিত করা হয়।',
        ],
      },
    },
  },
  {
    week: 21,
    babyImage: require('../assets/images/pregnancy/development/week-21.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Les mouvements deviennent plus francs et coordonnés, et il est fréquent de commencer à bien les ressentir durant cette période.',
        length: 'Environ 26,7 cm',
        comparison: 'Carotte',
        bodyChanges: ['Un léger essoufflement à l’effort peut apparaître à mesure que l’utérus prend de la place.'],
        toKnow: ['Se familiariser avec le rythme habituel des mouvements du bébé permet de mieux repérer un changement inhabituel.'],
      },
      en: {
        babyDescription: 'Movements become clearer and more coordinated, and it’s common to start feeling them clearly during this period.',
        length: 'About 26.7 cm',
        comparison: 'Carrot',
        bodyChanges: ['Mild shortness of breath on exertion may appear as the uterus takes up more space.'],
        toKnow: ['Getting familiar with your baby’s usual movement pattern makes it easier to notice an unusual change.'],
      },
      es: {
        babyDescription: 'Los movimientos se vuelven más claros y coordinados, y es frecuente empezar a sentirlos bien durante este periodo.',
        length: 'Aproximadamente 26,7 cm',
        comparison: 'Zanahoria',
        bodyChanges: ['Puede aparecer una ligera falta de aliento al hacer esfuerzos, a medida que el útero ocupa más espacio.'],
        toKnow: ['Familiarizarte con el ritmo habitual de los movimientos del bebé te ayuda a detectar mejor un cambio inusual.'],
      },
      it: {
        babyDescription: 'I movimenti diventano più chiari e più coordinati ed è normale iniziare ad avvertirli chiaramente in questo periodo.',
        length: 'Circa 26,7 cm',
        comparison: 'Carota',
        bodyChanges: [
          'Può comparire un lieve affanno sotto sforzo, perché l’utero occupa più spazio.',
        ],
        toKnow: [
          'Familiarizzare con il ritmo abituale dei movimenti del tuo bambino rende più facile accorgersi di un cambiamento insolito.',
        ],
      },
      tr: {
        babyDescription: 'Hareketler daha belirgin ve eşgüdümlü hâle gelir; bu dönemde onları net biçimde hissetmeye başlamak yaygındır.',
        length: 'Yaklaşık 26,7 cm',
        comparison: 'Havuç',
        bodyChanges: [
          'Rahim daha fazla yer kapladıkça eforla birlikte hafif bir nefes darlığı ortaya çıkabilir.',
        ],
        toKnow: [
          'Bebeğinin olağan hareket düzenini tanımak, olağan dışı bir değişikliği fark etmeyi kolaylaştırır.',
        ],
      },
      ru: {
        babyDescription:
          'Движения становятся более отчётливыми и скоординированными, и в этот период их нередко начинают ощущать ясно.',
        length:
          'Около 26,7 см',
        comparison:
          'Морковь',
        bodyChanges: [
          'По мере того как матка занимает больше места, может появляться лёгкая одышка при нагрузке.',
        ],
        toKnow: [
          'Если вы знакомы с привычным режимом движений малыша, проще заметить необычное изменение.',
        ],
      },
      de: {
        babyDescription:
          'Die Bewegungen werden klarer und besser koordiniert, und es ist üblich, sie in dieser Zeit deutlich zu spüren.',
        length:
          'Etwa 26,7 cm',
        comparison:
          'Karotte',
        bodyChanges: [
          'Leichte Atemnot bei Anstrengung kann auftreten, weil die Gebärmutter mehr Platz einnimmt.',
        ],
        toKnow: [
          'Wenn du das gewohnte Bewegungsmuster deines Babys kennst, fällt es dir leichter, eine ungewöhnliche Veränderung zu bemerken.',
        ],
      },
      zh: {
        babyDescription: '宝宝的动作变得更清晰、更协调，这段时间通常能明显感觉到胎动。',
        length: '约 26.7 厘米',
        comparison: '胡萝卜',
        bodyChanges: [
          '随着子宫占据更多空间，活动时可能会出现轻微的气短。',
        ],
        toKnow: [
          '熟悉宝宝平时的胎动规律，更容易察觉到异常的变化。',
        ],
      },
      id: {
        babyDescription: 'Gerakan makin jelas dan terkoordinasi, dan wajar jika kamu mulai merasakannya dengan jelas pada masa ini.',
        length: 'Sekitar 26,7 cm',
        comparison: 'Wortel',
        bodyChanges: [
          'Sesak napas ringan saat beraktivitas bisa muncul seiring rahim yang memakan lebih banyak ruang.',
        ],
        toKnow: [
          'Mengenali pola gerakan bayi yang biasa membuatmu lebih mudah menyadari perubahan yang tidak biasa.',
        ],
      },
      hi: {
        babyDescription: 'हरकतें ज़्यादा साफ़ और तालमेल वाली हो जाती हैं, और इस दौरान उन्हें साफ़ महसूस करना आम बात है।',
        length: 'लगभग 26.7 cm',
        comparison: 'गाजर',
        bodyChanges: [
          'गर्भाशय के ज़्यादा जगह घेरने से मेहनत करने पर हल्की साँस फूल सकती है।',
        ],
        toKnow: [
          'अपने शिशु की हलचल के सामान्य पैटर्न से परिचित होने पर किसी असामान्य बदलाव को पहचानना आसान हो जाता है।',
        ],
      },
      sq: {
        babyDescription: 'Lëvizjet bëhen më të qarta dhe më të koordinuara, dhe është e zakonshme që t’i ndjesh qartë gjatë kësaj periudhe.',
        length: 'Rreth 26,7 cm',
        comparison: 'Karrotë',
        bodyChanges: [
          'Mund të shfaqet një gulçim i lehtë gjatë përpjekjes fizike, ndërsa mitra zë më shumë hapësirë.',
        ],
        toKnow: [
          'Të njohësh ritmin e zakonshëm të lëvizjeve të bebes e bën më të lehtë të vëresh një ndryshim të pazakontë.',
        ],
      },
      ja: {
        babyDescription: '動きがよりはっきりと、よりなめらかになります。この時期に、動きをはっきり感じ始める人が多くいます。',
        length: '約26.7cm',
        comparison: 'にんじん',
        bodyChanges: [
          '子宮が広がってくるにつれて、体を動かしたときに軽い息切れを感じることがあります。',
        ],
        toKnow: [
          '赤ちゃんのいつもの動き方に慣れておくと、普段と違う変化に気づきやすくなります。',
        ],
      },
      ko: {
        babyDescription: '움직임이 더 뚜렷하고 조화로워져요. 이 시기에 태동을 또렷하게 느끼기 시작하는 경우가 많아요.',
        length: '약 26.7cm',
        comparison: '당근',
        bodyChanges: [
          '자궁이 더 많은 공간을 차지하면서 움직일 때 가볍게 숨이 찰 수 있어요.',
        ],
        toKnow: [
          '아기가 평소 움직이는 패턴을 알아 두면 평소와 다른 변화를 알아차리기 쉬워요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os movimentos tornam-se mais nítidos e melhor coordenados, e é comum começar a senti-los claramente durante este período.',
        length: 'Cerca de 26,7 cm',
        comparison: 'Cenoura',
        bodyChanges: [
          'Pode surgir uma ligeira falta de ar ao esforço à medida que o útero ocupa mais espaço.',
        ],
        toKnow: [
          'Familiarizar-se com o padrão habitual de movimentos do seu bebé facilita a perceção de uma alteração fora do normal.',
        ],
      },
      bn: {
        babyDescription: 'নড়াচড়া আরও স্পষ্ট ও সমন্বিত হয়ে ওঠে, আর এই সময়ে সেগুলো পরিষ্কারভাবে টের পাওয়া শুরু হওয়া খুবই সাধারণ।',
        length: 'প্রায় 26.7 সেমি',
        comparison: 'গাজর',
        bodyChanges: [
          'জরায়ু বেশি জায়গা নেওয়ায় পরিশ্রম করলে হালকা শ্বাসকষ্ট দেখা দিতে পারে।',
        ],
        toKnow: [
          'আপনার শিশুর স্বাভাবিক নড়াচড়ার ধরনের সঙ্গে পরিচিত হলে অস্বাভাবিক কোনো পরিবর্তন লক্ষ করা সহজ হয়।',
        ],
      },
    },
  },
  {
    week: 22,
    babyImage: require('../assets/images/pregnancy/development/week-22.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les poumons continuent de se développer et le bébé s’exerce à de petits mouvements respiratoires. Les bourgeons du goût se forment également.',
        length: 'Environ 27,8 cm',
        comparison: 'Patate douce',
        bodyChanges: ['Des crampes dans les jambes, notamment la nuit, sont possibles chez certaines personnes.'],
        toKnow: ['Ce que tu manges peut influencer le liquide amniotique, que le bébé avale régulièrement.'],
      },
      en: {
        babyDescription:
          'The lungs continue developing, and the baby practices small breathing movements. Taste buds are also forming.',
        length: 'About 27.8 cm',
        comparison: 'Sweet potato',
        bodyChanges: ['Leg cramps, particularly at night, are possible for some people.'],
        toKnow: ['What you eat can influence the amniotic fluid, which the baby regularly swallows.'],
      },
      es: {
        babyDescription:
          'Los pulmones continúan desarrollándose y el bebé practica pequeños movimientos respiratorios. Las papilas gustativas también se están formando.',
        length: 'Aproximadamente 27,8 cm',
        comparison: 'Boniato',
        bodyChanges: ['Pueden aparecer calambres en las piernas, sobre todo por la noche, en algunas personas.'],
        toKnow: ['Lo que comes puede influir en el líquido amniótico, que el bebé traga regularmente.'],
      },
      it: {
        babyDescription: 'I polmoni continuano a svilupparsi e il bambino si esercita con piccoli movimenti respiratori. Si stanno formando anche le papille gustative.',
        length: 'Circa 27,8 cm',
        comparison: 'Patata dolce',
        bodyChanges: [
          'Per alcune donne sono possibili crampi alle gambe, soprattutto di notte.',
        ],
        toKnow: [
          'Ciò che mangi può influenzare il liquido amniotico, che il bambino deglutisce regolarmente.',
        ],
      },
      tr: {
        babyDescription: 'Akciğerler gelişmeye devam eder ve bebek küçük nefes alma hareketleri yapar. Tat tomurcukları da oluşuyor.',
        length: 'Yaklaşık 27,8 cm',
        comparison: 'Tatlı patates',
        bodyChanges: [
          'Bazı kişilerde, özellikle geceleri bacak krampları görülebilir.',
        ],
        toKnow: [
          'Yediklerin, bebeğin düzenli olarak yuttuğu amniyon sıvısını etkileyebilir.',
        ],
      },
      ru: {
        babyDescription:
          'Лёгкие продолжают развиваться, малыш тренирует небольшие дыхательные движения. Также формируются вкусовые рецепторы.',
        length:
          'Около 27,8 см',
        comparison:
          'Батат',
        bodyChanges: [
          'У некоторых женщин возможны судороги в ногах, особенно по ночам.',
        ],
        toKnow: [
          'То, что вы едите, может влиять на околоплодные воды, которые малыш регулярно проглатывает.',
        ],
      },
      de: {
        babyDescription:
          'Die Lunge entwickelt sich weiter, und das Baby übt kleine Atembewegungen. Auch die Geschmacksknospen bilden sich aus.',
        length:
          'Etwa 27,8 cm',
        comparison:
          'Süßkartoffel',
        bodyChanges: [
          'Wadenkrämpfe, besonders nachts, sind bei manchen Frauen möglich.',
        ],
        toKnow: [
          'Was du isst, kann das Fruchtwasser beeinflussen, das das Baby regelmäßig schluckt.',
        ],
      },
      zh: {
        babyDescription: '肺部继续发育，宝宝会练习轻微的呼吸动作，味蕾也在形成。',
        length: '约 27.8 厘米',
        comparison: '红薯',
        bodyChanges: [
          '有些人可能会出现腿部抽筋，尤其是在夜间。',
        ],
        toKnow: [
          '你吃的食物可能会影响羊水，而宝宝会经常吞咽羊水。',
        ],
      },
      id: {
        babyDescription: 'Paru-paru terus berkembang, dan bayi berlatih gerakan bernapas kecil. Kuncup pengecap juga sedang terbentuk.',
        length: 'Sekitar 27,8 cm',
        comparison: 'Ubi jalar',
        bodyChanges: [
          'Kram kaki, terutama pada malam hari, mungkin terjadi pada sebagian orang.',
        ],
        toKnow: [
          'Apa yang kamu makan dapat memengaruhi air ketuban, yang rutin ditelan oleh bayi.',
        ],
      },
      hi: {
        babyDescription: 'फेफड़ों का विकास जारी रहता है, और शिशु साँस लेने की छोटी-छोटी हरकतों का अभ्यास करता है। स्वाद की कलियाँ भी बन रही हैं।',
        length: 'लगभग 27.8 cm',
        comparison: 'शकरकंद',
        bodyChanges: [
          'कुछ महिलाओं को पैरों में ऐंठन हो सकती है, ख़ासकर रात में।',
        ],
        toKnow: [
          'आप जो खाती हैं, उसका असर उल्बीय द्रव (एम्नियोटिक फ़्लूइड) पर पड़ सकता है, जिसे शिशु नियमित रूप से निगलता है।',
        ],
      },
      sq: {
        babyDescription: 'Mushkëritë vazhdojnë të zhvillohen, dhe bebja ushtron lëvizje të vogla frymëmarrjeje. Edhe papilat e shijes po formohen.',
        length: 'Rreth 27,8 cm',
        comparison: 'Patate e ëmbël',
        bodyChanges: [
          'Kramba në këmbë, sidomos natën, janë të mundshme për disa gra.',
        ],
        toKnow: [
          'Ajo që ha mund të ndikojë te lëngu amniotik, të cilin bebja e gëlltit rregullisht.',
        ],
      },
      ja: {
        babyDescription: '肺の発達が続き、赤ちゃんは小さな呼吸の動きを練習します。味蕾もできてきます。',
        length: '約27.8cm',
        comparison: 'さつまいも',
        bodyChanges: [
          '特に夜に、脚がつることがある人もいます。',
        ],
        toKnow: [
          '食べたものが、赤ちゃんが日常的に飲み込んでいる羊水に影響することがあります。',
        ],
      },
      ko: {
        babyDescription: '폐가 계속 발달하고, 아기는 작은 호흡 연습을 해요. 미뢰도 만들어지고 있어요.',
        length: '약 27.8cm',
        comparison: '고구마',
        bodyChanges: [
          '특히 밤에 다리에 쥐가 나는 사람도 있어요.',
        ],
        toKnow: [
          '먹는 음식이 아기가 규칙적으로 삼키는 양수에 영향을 줄 수 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os pulmões continuam a desenvolver-se e o bebé pratica pequenos movimentos respiratórios. As papilas gustativas também estão a formar-se.',
        length: 'Cerca de 27,8 cm',
        comparison: 'Batata-doce',
        bodyChanges: [
          'Cãibras nas pernas, em particular à noite, são possíveis em algumas pessoas.',
        ],
        toKnow: [
          'A sua alimentação pode influenciar o líquido amniótico, que o bebé engole regularmente.',
        ],
      },
      bn: {
        babyDescription: 'ফুসফুস বিকশিত হতে থাকে, আর শিশু ছোট ছোট শ্বাস নেওয়ার অনুশীলন করে। স্বাদকোরকও তৈরি হচ্ছে।',
        length: 'প্রায় 27.8 সেমি',
        comparison: 'মিষ্টি আলু',
        bodyChanges: [
          'কারও কারও পায়ে খিঁচুনি হতে পারে, বিশেষ করে রাতে।',
        ],
        toKnow: [
          'আপনি যা খান তা অ্যামনিওটিক তরলকে প্রভাবিত করতে পারে, যা শিশু নিয়মিত গিলে থাকে।',
        ],
      },
    },
  },
  {
    week: 23,
    babyImage: require('../assets/images/pregnancy/development/week-23.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les membres sont désormais bien proportionnés. Le bébé s’exerce à respirer et commence à alterner des phases de sommeil et d’éveil.',
        length: 'Environ 28,9 cm',
        comparison: 'Grosse mangue',
        bodyChanges: ['Des maux de dos plus marqués peuvent apparaître avec la prise de poids progressive.'],
        toKnow: ['Observer les périodes d’activité et de calme du bébé aide à connaître son rythme propre.'],
      },
      en: {
        babyDescription:
          'The limbs are now well proportioned. The baby practices breathing and begins alternating sleep and wake phases.',
        length: 'About 28.9 cm',
        comparison: 'Large mango',
        bodyChanges: ['More pronounced back pain may appear with gradual weight gain.'],
        toKnow: ['Observing the baby’s active and quiet periods helps you learn their own rhythm.'],
      },
      es: {
        babyDescription:
          'Los miembros ya están bien proporcionados. El bebé practica la respiración y empieza a alternar fases de sueño y de vigilia.',
        length: 'Aproximadamente 28,9 cm',
        comparison: 'Mango grande',
        bodyChanges: ['Pueden aparecer dolores de espalda más marcados con el aumento de peso progresivo.'],
        toKnow: ['Observar los periodos de actividad y de calma del bebé te ayuda a conocer su propio ritmo.'],
      },
      it: {
        babyDescription: 'Gli arti sono ormai ben proporzionati. Il bambino si esercita a respirare e inizia ad alternare fasi di sonno e di veglia.',
        length: 'Circa 28,9 cm',
        comparison: 'Mango grande',
        bodyChanges: [
          'Con l’aumento graduale di peso può comparire un mal di schiena più marcato.',
        ],
        toKnow: [
          'Osservare i periodi di attività e di quiete del bambino ti aiuta a conoscere il suo ritmo.',
        ],
      },
      tr: {
        babyDescription: 'Uzuvlar artık iyi orantılıdır. Bebek nefes almayı dener ve uyku ile uyanıklık evrelerini art arda yaşamaya başlar.',
        length: 'Yaklaşık 28,9 cm',
        comparison: 'Büyük mango',
        bodyChanges: [
          'Kademeli kilo alımıyla birlikte daha belirgin bir bel ağrısı ortaya çıkabilir.',
        ],
        toKnow: [
          'Bebeğin aktif ve sakin dönemlerini gözlemlemek, onun kendi ritmini öğrenmene yardımcı olur.',
        ],
      },
      ru: {
        babyDescription:
          'Конечности теперь хорошо пропорциональны. Малыш тренирует дыхание и начинает чередовать периоды сна и бодрствования.',
        length:
          'Около 28,9 см',
        comparison:
          'Большое манго',
        bodyChanges: [
          'По мере постепенной прибавки в весе может усиливаться боль в спине.',
        ],
        toKnow: [
          'Наблюдая за периодами активности и покоя малыша, вы лучше узнаёте его собственный ритм.',
        ],
      },
      de: {
        babyDescription:
          'Die Gliedmaßen sind jetzt gut proportioniert. Das Baby übt das Atmen und beginnt, zwischen Schlaf- und Wachphasen zu wechseln.',
        length:
          'Etwa 28,9 cm',
        comparison:
          'Große Mango',
        bodyChanges: [
          'Stärkere Rückenschmerzen können mit der allmählichen Gewichtszunahme auftreten.',
        ],
        toKnow: [
          'Wenn du die aktiven und ruhigen Phasen deines Babys beobachtest, lernst du seinen ganz eigenen Rhythmus kennen.',
        ],
      },
      zh: {
        babyDescription: '四肢比例已经协调。宝宝会练习呼吸，并开始交替出现睡眠和清醒的阶段。',
        length: '约 28.9 厘米',
        comparison: '大芒果',
        bodyChanges: [
          '随着体重逐渐增加，可能会出现更明显的背痛。',
        ],
        toKnow: [
          '观察宝宝活跃和安静的时段，可以帮你了解他自己的节奏。',
        ],
      },
      id: {
        babyDescription: 'Anggota tubuh kini sudah proporsional. Bayi berlatih bernapas dan mulai bergantian antara fase tidur dan terjaga.',
        length: 'Sekitar 28,9 cm',
        comparison: 'Mangga besar',
        bodyChanges: [
          'Nyeri punggung yang lebih terasa bisa muncul seiring bertambahnya berat badan secara bertahap.',
        ],
        toKnow: [
          'Mengamati masa aktif dan masa tenang bayi membantumu mengenali ritmenya sendiri.',
        ],
      },
      hi: {
        babyDescription: 'हाथ-पैर अब अच्छी तरह अनुपात में हैं। शिशु साँस लेने का अभ्यास करता है और नींद व जागने के चरण बारी-बारी से आने लगते हैं।',
        length: 'लगभग 28.9 cm',
        comparison: 'बड़ा आम',
        bodyChanges: [
          'वज़न धीरे-धीरे बढ़ने के साथ पीठ में ज़्यादा दर्द हो सकता है।',
        ],
        toKnow: [
          'शिशु के सक्रिय और शांत समय पर ध्यान देने से आप उसकी अपनी लय को समझ पाती हैं।',
        ],
      },
      sq: {
        babyDescription: 'Gjymtyrët tani janë mirë të proporcionuara. Bebja ushtron frymëmarrjen dhe fillon të ndërrojë fazat e gjumit me ato të zgjimit.',
        length: 'Rreth 28,9 cm',
        comparison: 'Mango e madhe',
        bodyChanges: [
          'Një dhimbje më e theksuar shpine mund të shfaqet me shtimin gradual në peshë.',
        ],
        toKnow: [
          'Vëzhgimi i periudhave aktive dhe të qeta të bebes të ndihmon të mësosh ritmin e saj.',
        ],
      },
      ja: {
        babyDescription: '手足のバランスがとれてきます。赤ちゃんは呼吸の練習をし、眠っている時間と起きている時間を交互に繰り返し始めます。',
        length: '約28.9cm',
        comparison: '大きなマンゴー',
        bodyChanges: [
          '体重が少しずつ増えるにつれて、腰や背中の痛みが強くなることがあります。',
        ],
        toKnow: [
          '赤ちゃんが活発な時間と静かな時間を観察すると、その子ならではのリズムがわかってきます。',
        ],
      },
      ko: {
        babyDescription: '팔다리의 비율이 이제 잘 잡혀요. 아기는 호흡 연습을 하고, 자는 시간과 깨어 있는 시간이 번갈아 나타나기 시작해요.',
        length: '약 28.9cm',
        comparison: '큰 망고',
        bodyChanges: [
          '체중이 서서히 늘면서 허리 통증이 더 심해질 수 있어요.',
        ],
        toKnow: [
          '아기가 활발한 때와 조용한 때를 관찰하면 아기만의 리듬을 알아 가는 데 도움이 돼요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os membros já estão bem proporcionados. O bebé pratica a respiração e começa a alternar fases de sono e de vigília.',
        length: 'Cerca de 28,9 cm',
        comparison: 'Manga grande',
        bodyChanges: [
          'Pode surgir uma dor nas costas mais acentuada com o aumento gradual de peso.',
        ],
        toKnow: [
          'Observar os períodos ativos e tranquilos do bebé ajuda a conhecer o seu ritmo próprio.',
        ],
      },
      bn: {
        babyDescription: 'হাত-পা এখন বেশ সুসামঞ্জস্য আকারের। শিশু শ্বাস নেওয়ার অনুশীলন করে এবং ঘুম ও জেগে থাকার পর্যায় পর্যায়ক্রমে আসতে শুরু করে।',
        length: 'প্রায় 28.9 সেমি',
        comparison: 'বড় আম',
        bodyChanges: [
          'ধীরে ধীরে ওজন বাড়ার সঙ্গে আরও তীব্র পিঠব্যথা দেখা দিতে পারে।',
        ],
        toKnow: [
          'শিশুর সক্রিয় ও শান্ত সময়গুলো লক্ষ করলে তার নিজস্ব ছন্দ বুঝতে সুবিধা হয়।',
        ],
      },
    },
  },
  {
    week: 24,
    babyImage: require('../assets/images/pregnancy/development/week-24.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé atteint le seuil de viabilité : en cas de naissance très prématurée à ce stade, une prise en charge médicale spécialisée en néonatalogie peut permettre la survie, avec un accompagnement adapté.',
        length: 'Environ 30 cm',
        comparison: 'Épi de maïs',
        bodyChanges: ['Une pression accrue sur la vessie et des envies fréquentes d’uriner peuvent apparaître.'],
        toKnow: ['Le dépistage du diabète gestationnel est généralement proposé autour de cette période.'],
      },
      en: {
        babyDescription:
          'The baby reaches the threshold of viability: in the event of a very premature birth at this stage, specialized neonatal medical care can allow for survival, with appropriate support.',
        length: 'About 30 cm',
        comparison: 'Ear of corn',
        bodyChanges: ['Increased pressure on the bladder and frequent urges to urinate may appear.'],
        toKnow: ['Gestational diabetes screening is generally offered around this time.'],
      },
      es: {
        babyDescription:
          'El bebé alcanza el umbral de viabilidad: en caso de un nacimiento muy prematuro en esta etapa, una atención médica especializada en neonatología puede permitir la supervivencia, con un acompañamiento adecuado.',
        length: 'Aproximadamente 30 cm',
        comparison: 'Mazorca de maíz',
        bodyChanges: ['Puede aparecer una presión mayor sobre la vejiga y ganas frecuentes de orinar.'],
        toKnow: ['El cribado de la diabetes gestacional suele ofrecerse en torno a este periodo.'],
      },
      it: {
        babyDescription: 'Il bambino raggiunge la soglia di vitalità: in caso di nascita molto prematura in questa fase, cure neonatali specialistiche possono permettere la sopravvivenza, con un supporto adeguato.',
        length: 'Circa 30 cm',
        comparison: 'Pannocchia',
        bodyChanges: [
          'Possono comparire una maggiore pressione sulla vescica e frequenti stimoli a urinare.',
        ],
        toKnow: [
          'Lo screening del diabete gestazionale viene in genere proposto intorno a questo periodo.',
        ],
      },
      tr: {
        babyDescription: 'Bebek yaşayabilirlik eşiğine ulaşır: bu aşamada çok erken bir doğum olması hâlinde, uzmanlaşmış yenidoğan tıbbi bakımı uygun desteğle hayatta kalmayı mümkün kılabilir.',
        length: 'Yaklaşık 30 cm',
        comparison: 'Mısır koçanı',
        bodyChanges: [
          'Mesane üzerindeki baskı artabilir ve sık sık idrar yapma isteği ortaya çıkabilir.',
        ],
        toKnow: [
          'Gebelik diyabeti taraması genellikle bu sıralarda sunulur.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш достигает порога жизнеспособности: при очень преждевременных родах на этом сроке специализированная неонатальная медицинская помощь может позволить ему выжить при соответствующей поддержке.',
        length:
          'Около 30 см',
        comparison:
          'Кукурузный початок',
        bodyChanges: [
          'Может появиться усиленное давление на мочевой пузырь и частые позывы к мочеиспусканию.',
        ],
        toKnow: [
          'Скрининг на гестационный диабет обычно предлагают примерно в это время.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby erreicht die Grenze der Lebensfähigkeit: Bei einer sehr frühen Geburt in dieser Phase kann eine spezialisierte neonatologische Versorgung mit entsprechender Unterstützung das Überleben ermöglichen.',
        length:
          'Etwa 30 cm',
        comparison:
          'Maiskolben',
        bodyChanges: [
          'Ein verstärkter Druck auf die Blase und häufiger Harndrang können auftreten.',
        ],
        toKnow: [
          'Das Screening auf Schwangerschaftsdiabetes wird in der Regel um diese Zeit angeboten.',
        ],
      },
      zh: {
        babyDescription: '宝宝到达了存活能力的临界点：在这一阶段如果极早产，专业的新生儿医疗护理配合适当的支持，可以让宝宝存活。',
        length: '约 30 厘米',
        comparison: '玉米',
        bodyChanges: [
          '膀胱受到的压力可能增加，也可能出现尿频。',
        ],
        toKnow: [
          '妊娠期糖尿病筛查通常在这个时期进行。',
        ],
      },
      id: {
        babyDescription: 'Bayi mencapai ambang viabilitas: jika lahir sangat prematur pada tahap ini, perawatan medis neonatal khusus dapat membuatnya bertahan hidup, dengan dukungan yang sesuai.',
        length: 'Sekitar 30 cm',
        comparison: 'Tongkol jagung',
        bodyChanges: [
          'Tekanan yang meningkat pada kandung kemih dan dorongan sering buang air kecil bisa muncul.',
        ],
        toKnow: [
          'Skrining diabetes gestasional umumnya ditawarkan sekitar waktu ini.',
        ],
      },
      hi: {
        babyDescription: 'शिशु जीवन-क्षमता की सीमा तक पहुँच जाता है: इस अवस्था में बहुत समय से पहले जन्म होने पर, विशेष नवजात चिकित्सा देखभाल और उचित सहारे के साथ शिशु के जीवित रहने की संभावना बन सकती है।',
        length: 'लगभग 30 cm',
        comparison: 'भुट्टा',
        bodyChanges: [
          'मूत्राशय पर दबाव बढ़ सकता है और बार-बार पेशाब जाने की ज़रूरत महसूस हो सकती है।',
        ],
        toKnow: [
          'गर्भकालीन मधुमेह की जाँच आमतौर पर इसी समय के आसपास कराने की सलाह दी जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Bebja arrin pragun e jetesës jashtë mitrës: në rast të një lindjeje shumë të parakohshme në këtë fazë, kujdesi mjekësor i specializuar neonatal mund të lejojë mbijetesën, me mbështetje të përshtatshme.',
        length: 'Rreth 30 cm',
        comparison: 'Kalli misri',
        bodyChanges: [
          'Mund të shfaqen shtypje më e madhe mbi fshikëzën urinare dhe nxitje të shpeshta për të urinuar.',
        ],
        toKnow: [
          'Testi i diabetit gjestacional ofrohet zakonisht rreth kësaj kohe.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんは生存可能とされる時期に入ります。この段階でごく早く生まれた場合でも、新生児の専門的な医療ケアと適切なサポートによって、命を救える可能性があります。',
        length: '約30cm',
        comparison: 'とうもろこし',
        bodyChanges: [
          '膀胱への圧迫が強まり、頻繁にトイレに行きたくなることがあります。',
        ],
        toKnow: [
          '妊娠糖尿病のスクリーニングは、一般にこのころに勧められます。',
        ],
      },
      ko: {
        babyDescription: '아기가 생존 가능 시기에 이르렀어요. 이 시기에 매우 이른 조산이 일어나더라도 전문 신생아 의료 치료와 적절한 지원이 있으면 생존할 수 있어요.',
        length: '약 30cm',
        comparison: '옥수수',
        bodyChanges: [
          '방광이 더 눌리면서 소변이 자주 마려울 수 있어요.',
        ],
        toKnow: [
          '임신성 당뇨병 선별 검사는 보통 이 무렵에 받도록 안내해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé atinge o limiar de viabilidade: em caso de nascimento muito prematuro nesta fase, os cuidados médicos neonatais especializados podem permitir a sobrevivência, com o apoio adequado.',
        length: 'Cerca de 30 cm',
        comparison: 'Espiga de milho',
        bodyChanges: [
          'Podem surgir maior pressão na bexiga e vontade frequente de urinar.',
        ],
        toKnow: [
          'O rastreio da diabetes gestacional é geralmente proposto por volta desta altura.',
        ],
      },
      bn: {
        babyDescription: 'শিশু বেঁচে থাকার সক্ষমতার সীমায় পৌঁছায়: এই পর্যায়ে খুব আগে জন্ম হলে বিশেষায়িত নবজাতক চিকিৎসা সেবা ও উপযুক্ত সহায়তার মাধ্যমে শিশুর বেঁচে থাকা সম্ভব হতে পারে।',
        length: 'প্রায় 30 সেমি',
        comparison: 'ভুট্টা',
        bodyChanges: [
          'মূত্রথলির ওপর চাপ বাড়তে পারে এবং ঘন ঘন প্রস্রাবের বেগ দেখা দিতে পারে।',
        ],
        toKnow: [
          'গর্ভকালীন ডায়াবেটিসের স্ক্রিনিং সাধারণত এই সময়ের কাছাকাছি করার পরামর্শ দেওয়া হয়।',
        ],
      },
    },
  },
  {
    week: 25,
    babyImage: require('../assets/images/pregnancy/development/week-25.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé réagit désormais aux bruits forts par un sursaut ou un coup de pied, et un hoquet occasionnel peut être ressenti. Il urine régulièrement dans le liquide amniotique.',
        length: 'Environ 34,6 cm',
        comparison: 'Courgette',
        bodyChanges: ['Des brûlures d’estomac ou des remontées acides peuvent devenir plus fréquentes.'],
        toKnow: ['Un hoquet fœtal ressenti de temps en temps est généralement considéré comme normal.'],
      },
      en: {
        babyDescription:
          'The baby now reacts to loud noises with a startle or a kick, and occasional hiccups may be felt. They urinate regularly into the amniotic fluid.',
        length: 'About 34.6 cm',
        comparison: 'Zucchini',
        bodyChanges: ['Heartburn or acid reflux may become more frequent.'],
        toKnow: ['Fetal hiccups felt from time to time are generally considered normal.'],
      },
      es: {
        babyDescription:
          'El bebé ahora reacciona a los ruidos fuertes con un sobresalto o una patada, y a veces puede sentirse hipo ocasional. Orina regularmente en el líquido amniótico.',
        length: 'Aproximadamente 34,6 cm',
        comparison: 'Calabacín',
        bodyChanges: ['Pueden volverse más frecuentes los ardores de estómago o los reflujos ácidos.'],
        toKnow: ['Sentir hipo fetal de vez en cuando generalmente se considera normal.'],
      },
      it: {
        babyDescription: 'Ora il bambino reagisce ai rumori forti con un sobbalzo o un calcio e a volte si possono avvertire dei singhiozzi. Urina regolarmente nel liquido amniotico.',
        length: 'Circa 34,6 cm',
        comparison: 'Zucchina',
        bodyChanges: [
          'Bruciore di stomaco o reflusso acido possono diventare più frequenti.',
        ],
        toKnow: [
          'I singhiozzi del feto avvertiti di tanto in tanto sono in genere considerati normali.',
        ],
      },
      tr: {
        babyDescription: 'Bebek artık yüksek seslere sıçrayarak ya da tekmeyle tepki verir ve ara sıra hıçkırık hissedilebilir. Düzenli olarak amniyon sıvısına idrar yapar.',
        length: 'Yaklaşık 34,6 cm',
        comparison: 'Sakız kabağı',
        bodyChanges: [
          'Mide yanması ya da asit reflüsü daha sık görülebilir.',
        ],
        toKnow: [
          'Zaman zaman hissedilen fetal hıçkırıklar genellikle normal kabul edilir.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш теперь реагирует на громкие звуки вздрагиванием или толчком, иногда можно почувствовать его икоту. Он регулярно мочится в околоплодные воды.',
        length:
          'Около 34,6 см',
        comparison:
          'Цуккини',
        bodyChanges: [
          'Изжога или кислотный рефлюкс могут стать чаще.',
        ],
        toKnow: [
          'Время от времени ощущаемая икота плода, как правило, считается нормальной.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby reagiert jetzt auf laute Geräusche mit einem Zusammenzucken oder einem Tritt, und gelegentlich kann man Schluckauf spüren. Es lässt regelmäßig Urin ins Fruchtwasser ab.',
        length:
          'Etwa 34,6 cm',
        comparison:
          'Zucchini',
        bodyChanges: [
          'Sodbrennen oder saures Aufstoßen können häufiger werden.',
        ],
        toKnow: [
          'Wenn du hin und wieder den Schluckauf des Babys spürst, gilt das in der Regel als normal.',
        ],
      },
      zh: {
        babyDescription: '宝宝现在听到很大的声音会受惊或踢腿，你偶尔还能感觉到打嗝。宝宝会定期把尿排入羊水中。',
        length: '约 34.6 厘米',
        comparison: '西葫芦',
        bodyChanges: [
          '烧心或反酸可能会变得更频繁。',
        ],
        toKnow: [
          '偶尔感觉到胎儿打嗝，一般被认为是正常的。',
        ],
      },
      id: {
        babyDescription: 'Bayi kini bereaksi terhadap suara keras dengan terkejut atau menendang, dan sesekali cegukan bisa terasa. Bayi buang air kecil secara teratur ke dalam air ketuban.',
        length: 'Sekitar 34,6 cm',
        comparison: 'Zukini',
        bodyChanges: [
          'Rasa panas di dada atau refluks asam lambung bisa makin sering terjadi.',
        ],
        toKnow: [
          'Cegukan janin yang sesekali terasa umumnya dianggap normal.',
        ],
      },
      hi: {
        babyDescription: 'शिशु अब तेज़ आवाज़ों पर चौंककर या लात मारकर प्रतिक्रिया देता है, और कभी-कभी हिचकी महसूस हो सकती है। वह नियमित रूप से उल्बीय द्रव में पेशाब करता है।',
        length: 'लगभग 34.6 cm',
        comparison: 'तोरी',
        bodyChanges: [
          'सीने में जलन या एसिड रिफ़्लक्स ज़्यादा बार हो सकता है।',
        ],
        toKnow: [
          'बीच-बीच में महसूस होने वाली शिशु की हिचकी को आमतौर पर सामान्य माना जाता है।',
        ],
      },
      sq: {
        babyDescription: 'Bebja tani reagon ndaj zhurmave të forta me një spërdredhje ose me një shqelm, dhe mund të ndjehen herë pas here lemzat. Ajo urinon rregullisht në lëngun amniotik.',
        length: 'Rreth 34,6 cm',
        comparison: 'Kungulleshkë',
        bodyChanges: [
          'Djegia e stomakut ose refluksi acid mund të bëhen më të shpeshta.',
        ],
        toKnow: [
          'Lemzat e fetusit që ndjehen herë pas here konsiderohen zakonisht normale.',
        ],
      },
      ja: {
        babyDescription: '大きな音にびくっと驚いたり、キックで反応したりするようになります。ときどきしゃっくりを感じることもあります。羊水の中に定期的におしっこをしています。',
        length: '約34.6cm',
        comparison: 'ズッキーニ',
        bodyChanges: [
          '胸やけや胃酸の逆流が、増えることがあります。',
        ],
        toKnow: [
          'ときどき感じる胎児のしゃっくりは、一般に正常なものと考えられています。',
        ],
      },
      ko: {
        babyDescription: '아기가 이제 큰 소리에 깜짝 놀라거나 발로 차며 반응해요. 가끔 딸꾹질이 느껴질 수도 있어요. 아기는 양수 속에 규칙적으로 소변을 봐요.',
        length: '약 34.6cm',
        comparison: '애호박',
        bodyChanges: [
          '속쓰림이나 위산 역류가 더 잦아질 수 있어요.',
        ],
        toKnow: [
          '가끔 느껴지는 태아의 딸꾹질은 보통 정상으로 여겨져요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé reage agora a ruídos fortes com um sobressalto ou um pontapé, e podem sentir-se soluços ocasionais. Urina regularmente para o líquido amniótico.',
        length: 'Cerca de 34,6 cm',
        comparison: 'Curgete',
        bodyChanges: [
          'A azia ou o refluxo ácido podem tornar-se mais frequentes.',
        ],
        toKnow: [
          'Os soluços fetais sentidos de vez em quando são geralmente considerados normais.',
        ],
      },
      bn: {
        babyDescription: 'শিশু এখন জোরালো শব্দে চমকে ওঠে বা লাথি মারে, আর মাঝে মাঝে হিক্কার মতো নড়াচড়া টের পাওয়া যেতে পারে। সে নিয়মিত অ্যামনিওটিক তরলে প্রস্রাব করে।',
        length: 'প্রায় 34.6 সেমি',
        comparison: 'জুকিনি',
        bodyChanges: [
          'বুক জ্বালাপোড়া বা অ্যাসিড রিফ্লাক্স আরও ঘন ঘন হতে পারে।',
        ],
        toKnow: [
          'মাঝে মাঝে শিশুর হিক্কা টের পাওয়া সাধারণত স্বাভাবিক বলে বিবেচিত হয়।',
        ],
      },
    },
  },
  {
    week: 26,
    babyImage: require('../assets/images/pregnancy/development/week-26.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Les yeux s’ouvrent pour la première fois. La couleur définitive des yeux ne sera généralement connue que plusieurs mois après la naissance.',
        length: 'Environ 35,6 cm',
        comparison: 'Concombre',
        bodyChanges: ['Un gonflement léger des chevilles ou des pieds peut apparaître, en particulier en fin de journée.'],
        toKnow: ['Le troisième trimestre approche, avec un suivi médical qui devient généralement plus fréquent.'],
      },
      en: {
        babyDescription: 'The eyes open for the first time. Their final color generally won’t be known until several months after birth.',
        length: 'About 35.6 cm',
        comparison: 'Cucumber',
        bodyChanges: ['Mild swelling of the ankles or feet may appear, particularly by the end of the day.'],
        toKnow: ['The third trimester is approaching, with medical follow-up generally becoming more frequent.'],
      },
      es: {
        babyDescription:
          'Los ojos se abren por primera vez. El color definitivo de los ojos generalmente no se conocerá hasta varios meses después del nacimiento.',
        length: 'Aproximadamente 35,6 cm',
        comparison: 'Pepino',
        bodyChanges: ['Puede aparecer una hinchazón leve en los tobillos o los pies, especialmente al final del día.'],
        toKnow: ['El tercer trimestre se acerca, con un seguimiento médico que generalmente se vuelve más frecuente.'],
      },
      it: {
        babyDescription: 'Gli occhi si aprono per la prima volta. Il loro colore definitivo, in genere, non si conoscerà se non diversi mesi dopo la nascita.',
        length: 'Circa 35,6 cm',
        comparison: 'Cetriolo',
        bodyChanges: [
          'Può comparire un lieve gonfiore a caviglie o piedi, soprattutto verso la fine della giornata.',
        ],
        toKnow: [
          'Il terzo trimestre si avvicina e in genere il controllo medico diventa più frequente.',
        ],
      },
      tr: {
        babyDescription: 'Gözler ilk kez açılır. Gözlerin nihai rengi genellikle doğumdan ancak birkaç ay sonra belli olur.',
        length: 'Yaklaşık 35,6 cm',
        comparison: 'Salatalık',
        bodyChanges: [
          'Özellikle günün sonuna doğru ayak bileklerinde ya da ayaklarda hafif şişlik ortaya çıkabilir.',
        ],
        toKnow: [
          'Üçüncü trimester yaklaşıyor ve tıbbi takip genellikle daha sık hâle geliyor.',
        ],
      },
      ru: {
        babyDescription:
          'Глаза открываются впервые. Окончательный цвет глаз, как правило, становится известен лишь через несколько месяцев после рождения.',
        length:
          'Около 35,6 см',
        comparison:
          'Огурец',
        bodyChanges: [
          'Может появиться лёгкая отёчность лодыжек или стоп, особенно к концу дня.',
        ],
        toKnow: [
          'Приближается третий триместр, и медицинское наблюдение, как правило, становится чаще.',
        ],
      },
      de: {
        babyDescription:
          'Die Augen öffnen sich zum ersten Mal. Die endgültige Augenfarbe zeigt sich in der Regel erst einige Monate nach der Geburt.',
        length:
          'Etwa 35,6 cm',
        comparison:
          'Gurke',
        bodyChanges: [
          'Leichte Schwellungen an Knöcheln oder Füßen können auftreten, besonders gegen Abend.',
        ],
        toKnow: [
          'Das dritte Trimester rückt näher, und die medizinische Betreuung wird in der Regel häufiger.',
        ],
      },
      zh: {
        babyDescription: '眼睛第一次睁开。宝宝眼睛最终的颜色，通常要到出生后几个月才能确定。',
        length: '约 35.6 厘米',
        comparison: '黄瓜',
        bodyChanges: [
          '脚踝或脚部可能会出现轻微水肿，尤其是在一天快结束的时候。',
        ],
        toKnow: [
          '孕晚期即将到来，产检通常会变得更频繁。',
        ],
      },
      id: {
        babyDescription: 'Mata terbuka untuk pertama kalinya. Warna matanya yang sebenarnya umumnya baru diketahui beberapa bulan setelah lahir.',
        length: 'Sekitar 35,6 cm',
        comparison: 'Mentimun',
        bodyChanges: [
          'Pembengkakan ringan pada pergelangan kaki atau telapak kaki bisa muncul, terutama menjelang akhir hari.',
        ],
        toKnow: [
          'Trimester ketiga sudah dekat, dengan pemeriksaan medis yang umumnya menjadi lebih sering.',
        ],
      },
      hi: {
        babyDescription: 'आँखें पहली बार खुलती हैं। उनका अंतिम रंग आमतौर पर जन्म के कई महीनों बाद ही पता चलता है।',
        length: 'लगभग 35.6 cm',
        comparison: 'खीरा',
        bodyChanges: [
          'टखनों या पैरों में हल्की सूजन आ सकती है, ख़ासकर दिन के अंत में।',
        ],
        toKnow: [
          'तीसरी तिमाही नज़दीक आ रही है, और चिकित्सकीय जाँच आमतौर पर पहले से ज़्यादा बार होने लगती है।',
        ],
      },
      sq: {
        babyDescription: 'Sytë hapen për herë të parë. Ngjyra e tyre përfundimtare zakonisht nuk njihet deri disa muaj pas lindjes.',
        length: 'Rreth 35,6 cm',
        comparison: 'Kastravec',
        bodyChanges: [
          'Mund të shfaqet një ënjtje e lehtë e kyçeve ose e këmbëve, sidomos nga fundi i ditës.',
        ],
        toKnow: [
          'Tremujori i tretë po afron, me ndjekjen mjekësore që zakonisht bëhet më e shpeshtë.',
        ],
      },
      ja: {
        babyDescription: '目が初めて開きます。最終的な目の色は、一般に生後数か月たつまでわかりません。',
        length: '約35.6cm',
        comparison: 'きゅうり',
        bodyChanges: [
          '特に夕方になると、足首や足に軽いむくみが出ることがあります。',
        ],
        toKnow: [
          '妊娠後期が近づき、医療機関での健診も一般に回数が増えていきます。',
        ],
      },
      ko: {
        babyDescription: '눈을 처음으로 떠요. 눈동자의 최종 색은 보통 태어난 뒤 몇 달이 지나야 알 수 있어요.',
        length: '약 35.6cm',
        comparison: '오이',
        bodyChanges: [
          '특히 하루가 끝날 무렵 발목이나 발이 살짝 부을 수 있어요.',
        ],
        toKnow: [
          '곧 임신 후기가 다가와요. 보통 이때부터 진료 일정이 더 잦아져요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os olhos abrem-se pela primeira vez. A sua cor definitiva geralmente só é conhecida vários meses após o nascimento.',
        length: 'Cerca de 35,6 cm',
        comparison: 'Pepino',
        bodyChanges: [
          'Pode surgir um ligeiro inchaço nos tornozelos ou nos pés, em particular ao fim do dia.',
        ],
        toKnow: [
          'O terceiro trimestre aproxima-se, e o acompanhamento médico torna-se geralmente mais frequente.',
        ],
      },
      bn: {
        babyDescription: 'চোখ প্রথমবারের মতো খোলে। চোখের চূড়ান্ত রং সাধারণত জন্মের কয়েক মাস পর্যন্ত জানা যায় না।',
        length: 'প্রায় 35.6 সেমি',
        comparison: 'শসা',
        bodyChanges: [
          'গোড়ালি বা পায়ে হালকা ফোলা দেখা দিতে পারে, বিশেষ করে দিনের শেষে।',
        ],
        toKnow: [
          'তৃতীয় ত্রৈমাসিক ঘনিয়ে আসছে, আর এই সময়ে চিকিৎসা ফলো-আপ সাধারণত আরও ঘন ঘন হয়।',
        ],
      },
    },
  },
  {
    week: 27,
    babyImage: require('../assets/images/pregnancy/development/week-27.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les poumons deviennent capables d’amorcer une respiration, et le bébé continue de prendre en rondeur à mesure que la graisse se dépose sous la peau.',
        length: 'Environ 36,6 cm',
        comparison: 'Chou-fleur',
        bodyChanges: ['La fatigue peut revenir à mesure que le corps porte un poids croissant.'],
        toKnow: ['Le début du troisième trimestre est souvent l’occasion de commencer à réfléchir au projet de naissance.'],
      },
      en: {
        babyDescription:
          'The lungs become capable of initiating breathing, and the baby continues filling out as fat deposits under the skin.',
        length: 'About 36.6 cm',
        comparison: 'Cauliflower',
        bodyChanges: ['Fatigue may return as your body carries a growing amount of weight.'],
        toKnow: ['The start of the third trimester is often a good time to start thinking about your birth plan.'],
      },
      es: {
        babyDescription:
          'Los pulmones empiezan a ser capaces de iniciar una respiración, y el bebé sigue ganando redondez a medida que se deposita grasa bajo la piel.',
        length: 'Aproximadamente 36,6 cm',
        comparison: 'Coliflor',
        bodyChanges: ['El cansancio puede volver a medida que tu cuerpo carga con un peso creciente.'],
        toKnow: ['El inicio del tercer trimestre suele ser una buena ocasión para empezar a pensar en tu plan de parto.'],
      },
      it: {
        babyDescription: 'I polmoni diventano capaci di avviare la respirazione e il bambino continua a riempirsi man mano che il grasso si accumula sotto la pelle.',
        length: 'Circa 36,6 cm',
        comparison: 'Cavolfiore',
        bodyChanges: [
          'La stanchezza può ripresentarsi perché il tuo corpo porta un peso sempre maggiore.',
        ],
        toKnow: [
          'L’inizio del terzo trimestre è spesso un buon momento per iniziare a pensare al tuo piano del parto.',
        ],
      },
      tr: {
        babyDescription: 'Akciğerler nefes almayı başlatabilecek duruma gelir ve cilt altında yağ biriktikçe bebek dolgunlaşmaya devam eder.',
        length: 'Yaklaşık 36,6 cm',
        comparison: 'Karnabahar',
        bodyChanges: [
          'Vücudun giderek artan bir ağırlık taşıdığı için yorgunluk geri dönebilir.',
        ],
        toKnow: [
          'Üçüncü trimesterin başlangıcı, doğum planını düşünmeye başlamak için çoğunlukla iyi bir zamandır.',
        ],
      },
      ru: {
        babyDescription:
          'Лёгкие становятся способными запускать дыхание, а малыш продолжает набирать вес — под кожей откладывается жир.',
        length:
          'Около 36,6 см',
        comparison:
          'Цветная капуста',
        bodyChanges: [
          'Усталость может вернуться, так как ваше тело несёт всё больший вес.',
        ],
        toKnow: [
          'Начало третьего триместра — часто хорошее время, чтобы задуматься о плане родов.',
        ],
      },
      de: {
        babyDescription:
          'Die Lunge wird fähig, die Atmung einzuleiten, und das Baby rundet sich weiter ab, weil sich unter der Haut Fett einlagert.',
        length:
          'Etwa 36,6 cm',
        comparison:
          'Blumenkohl',
        bodyChanges: [
          'Die Müdigkeit kann zurückkehren, weil dein Körper immer mehr Gewicht trägt.',
        ],
        toKnow: [
          'Der Beginn des dritten Trimesters ist oft ein guter Zeitpunkt, um sich Gedanken über die Geburtsplanung zu machen.',
        ],
      },
      zh: {
        babyDescription: '肺部逐渐具备启动呼吸的能力，宝宝皮下的脂肪不断积累，身体继续变得丰满。',
        length: '约 36.6 厘米',
        comparison: '花椰菜',
        bodyChanges: [
          '身体负担的重量不断增加，疲倦感可能会再次出现。',
        ],
        toKnow: [
          '孕晚期刚开始时，往往是开始考虑分娩计划的好时机。',
        ],
      },
      id: {
        babyDescription: 'Paru-paru menjadi mampu memulai pernapasan, dan bayi terus berisi seiring penumpukan lemak di bawah kulit.',
        length: 'Sekitar 36,6 cm',
        comparison: 'Kembang kol',
        bodyChanges: [
          'Kelelahan mungkin kembali muncul karena tubuhmu menanggung beban yang makin bertambah.',
        ],
        toKnow: [
          'Awal trimester ketiga sering menjadi waktu yang tepat untuk mulai memikirkan rencana persalinanmu.',
        ],
      },
      hi: {
        babyDescription: 'फेफड़े साँस शुरू करने के काबिल होने लगते हैं, और त्वचा के नीचे चर्बी जमा होने से शिशु भरा-भरा होता जाता है।',
        length: 'लगभग 36.6 cm',
        comparison: 'फूलगोभी',
        bodyChanges: [
          'आपके शरीर पर बढ़ते वज़न का बोझ होने से थकान फिर लौट सकती है।',
        ],
        toKnow: [
          'तीसरी तिमाही की शुरुआत अक्सर अपनी डिलीवरी की योजना के बारे में सोचना शुरू करने का अच्छा समय होता है।',
        ],
      },
      sq: {
        babyDescription: 'Mushkëritë bëhen të afta të nisin frymëmarrjen, dhe bebja vazhdon të plotësohet ndërsa yndyra grumbullohet nën lëkurë.',
        length: 'Rreth 36,6 cm',
        comparison: 'Lulelakër',
        bodyChanges: [
          'Lodhja mund të kthehet, ndërsa trupi yt mban një peshë gjithnjë në rritje.',
        ],
        toKnow: [
          'Fillimi i tremujorit të tretë është shpesh një kohë e mirë për të nisur të mendosh për planin tënd të lindjes.',
        ],
      },
      ja: {
        babyDescription: '肺が呼吸を始められるようになり、皮膚の下に脂肪がついて、赤ちゃんはふっくらしていきます。',
        length: '約36.6cm',
        comparison: 'カリフラワー',
        bodyChanges: [
          '体が支える重さが増えていくにつれて、疲れがまた出てくることがあります。',
        ],
        toKnow: [
          '妊娠後期の始まりは、バースプラン（出産の希望）について考え始めるのによい時期であることが多いです。',
        ],
      },
      ko: {
        babyDescription: '폐가 스스로 호흡을 시작할 수 있을 만큼 발달해요. 피부 밑에 지방이 쌓이면서 아기는 계속 통통해져요.',
        length: '약 36.6cm',
        comparison: '콜리플라워',
        bodyChanges: [
          '몸이 점점 늘어나는 무게를 감당하면서 피로가 다시 느껴질 수 있어요.',
        ],
        toKnow: [
          '임신 후기가 시작되는 이 무렵은 출산 계획을 생각해 보기 좋은 때예요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os pulmões tornam-se capazes de iniciar a respiração, e o bebé continua a ganhar volume à medida que se acumulam reservas de gordura sob a pele.',
        length: 'Cerca de 36,6 cm',
        comparison: 'Couve-flor',
        bodyChanges: [
          'O cansaço pode regressar à medida que o seu corpo carrega um peso cada vez maior.',
        ],
        toKnow: [
          'O início do terceiro trimestre é muitas vezes uma boa altura para começar a pensar no seu plano de parto.',
        ],
      },
      bn: {
        babyDescription: 'ফুসফুস শ্বাস নেওয়া শুরু করার সক্ষমতা অর্জন করে, আর ত্বকের নিচে চর্বি জমতে থাকায় শিশু আরও পুষ্ট হয়ে ওঠে।',
        length: 'প্রায় 36.6 সেমি',
        comparison: 'ফুলকপি',
        bodyChanges: [
          'শরীর ক্রমবর্ধমান ওজন বহন করায় ক্লান্তি আবার ফিরে আসতে পারে।',
        ],
        toKnow: [
          'তৃতীয় ত্রৈমাসিকের শুরু প্রায়ই আপনার প্রসবের পরিকল্পনা নিয়ে ভাবতে শুরু করার একটি ভালো সময়।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- weeks 28–33 (early third trimester)
  {
    week: 28,
    babyImage: require('../assets/images/pregnancy/development/week-28.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le rythme cardiaque, plus rapide en tout début de grossesse, s’est stabilisé autour de 130 à 140 battements par minute et peut désormais s’entendre au stéthoscope.',
        length: 'Environ 37,6 cm',
        comparison: 'Aubergine',
        bodyChanges: ['Un essoufflement ou des brûlures d’estomac peuvent devenir plus fréquents à mesure que l’utérus prend de la place.'],
        toKnow: ['Le troisième trimestre débute généralement autour de cette semaine, avec des consultations qui se rapprochent.'],
      },
      en: {
        babyDescription:
          'The heart rate, faster in very early pregnancy, has stabilized at around 130 to 140 beats per minute and can now be heard with a stethoscope.',
        length: 'About 37.6 cm',
        comparison: 'Eggplant',
        bodyChanges: ['Shortness of breath or heartburn may become more frequent as the uterus takes up more space.'],
        toKnow: ['The third trimester generally begins around this week, with appointments becoming more frequent.'],
      },
      es: {
        babyDescription:
          'El ritmo cardiaco, más rápido al principio del embarazo, se ha estabilizado en torno a 130 a 140 latidos por minuto y ahora puede oírse con un estetoscopio.',
        length: 'Aproximadamente 37,6 cm',
        comparison: 'Berenjena',
        bodyChanges: ['La falta de aliento o los ardores de estómago pueden volverse más frecuentes a medida que el útero ocupa más espacio.'],
        toKnow: ['El tercer trimestre suele comenzar alrededor de esta semana, con consultas que se vuelven más seguidas.'],
      },
      it: {
        babyDescription: 'Il battito cardiaco, più rapido all’inizio della gravidanza, si è stabilizzato intorno a 130-140 battiti al minuto e ora può essere ascoltato con uno stetoscopio.',
        length: 'Circa 37,6 cm',
        comparison: 'Melanzana',
        bodyChanges: [
          'Affanno o bruciore di stomaco possono diventare più frequenti perché l’utero occupa più spazio.',
        ],
        toKnow: [
          'Il terzo trimestre inizia in genere intorno a questa settimana, con appuntamenti sempre più frequenti.',
        ],
      },
      tr: {
        babyDescription: 'Gebeliğin çok erken döneminde daha hızlı olan kalp hızı dakikada yaklaşık 130 ile 140 atıma oturmuştur ve artık steteskopla duyulabilir.',
        length: 'Yaklaşık 37,6 cm',
        comparison: 'Patlıcan',
        bodyChanges: [
          'Rahim daha fazla yer kapladıkça nefes darlığı ya da mide yanması daha sık görülebilir.',
        ],
        toKnow: [
          'Üçüncü trimester genellikle bu hafta civarında başlar ve randevular sıklaşır.',
        ],
      },
      ru: {
        babyDescription:
          'Частота сердцебиения, более высокая на самых ранних сроках, стабилизировалась на уровне около 130–140 ударов в минуту, и теперь её можно услышать стетоскопом.',
        length:
          'Около 37,6 см',
        comparison:
          'Баклажан',
        bodyChanges: [
          'Одышка или изжога могут стать чаще по мере того, как матка занимает больше места.',
        ],
        toKnow: [
          'Третий триместр, как правило, начинается примерно на этой неделе, и визиты становятся чаще.',
        ],
      },
      de: {
        babyDescription:
          'Die Herzfrequenz, die in der Frühschwangerschaft höher war, hat sich bei etwa 130 bis 140 Schlägen pro Minute eingependelt und lässt sich jetzt mit einem Stethoskop hören.',
        length:
          'Etwa 37,6 cm',
        comparison:
          'Aubergine',
        bodyChanges: [
          'Atemnot oder Sodbrennen können häufiger werden, weil die Gebärmutter mehr Platz einnimmt.',
        ],
        toKnow: [
          'Das dritte Trimester beginnt in der Regel um diese Woche, und die Vorsorgetermine werden häufiger.',
        ],
      },
      zh: {
        babyDescription: '孕早期较快的心率现在已经稳定在每分钟约 130 到 140 次，用听诊器就能听到。',
        length: '约 37.6 厘米',
        comparison: '茄子',
        bodyChanges: [
          '随着子宫占据更多空间，气短或烧心可能会变得更频繁。',
        ],
        toKnow: [
          '孕晚期通常从这一周前后开始，产检也会变得更频繁。',
        ],
      },
      id: {
        babyDescription: 'Detak jantung, yang lebih cepat pada awal kehamilan, telah stabil di sekitar 130 hingga 140 denyut per menit dan kini dapat didengar dengan stetoskop.',
        length: 'Sekitar 37,6 cm',
        comparison: 'Terong',
        bodyChanges: [
          'Sesak napas atau rasa panas di dada bisa makin sering terjadi seiring rahim yang memakan lebih banyak ruang.',
        ],
        toKnow: [
          'Trimester ketiga umumnya dimulai sekitar minggu ini, dengan jadwal kunjungan yang makin sering.',
        ],
      },
      hi: {
        babyDescription: 'गर्भावस्था की शुरुआत में तेज़ रहने वाली दिल की धड़कन अब स्थिर होकर लगभग 130 से 140 धड़कन प्रति मिनट हो गई है और अब स्टेथोस्कोप से सुनी जा सकती है।',
        length: 'लगभग 37.6 cm',
        comparison: 'बैंगन',
        bodyChanges: [
          'गर्भाशय के ज़्यादा जगह घेरने से साँस फूलना या सीने में जलन ज़्यादा बार हो सकती है।',
        ],
        toKnow: [
          'तीसरी तिमाही आमतौर पर इसी सप्ताह के आसपास शुरू होती है, और अपॉइंटमेंट पहले से ज़्यादा बार होने लगते हैं।',
        ],
      },
      sq: {
        babyDescription: 'Rrahjet e zemrës, më të shpejta në fillimin e shtatzënisë, janë stabilizuar rreth 130 deri në 140 rrahje në minutë dhe tani mund të dëgjohen me stetoskop.',
        length: 'Rreth 37,6 cm',
        comparison: 'Patëllxhan',
        bodyChanges: [
          'Gulçimi ose djegia e stomakut mund të bëhen më të shpeshta ndërsa mitra zë më shumë hapësirë.',
        ],
        toKnow: [
          'Tremujori i tretë zakonisht fillon rreth kësaj jave, me takimet mjekësore që bëhen më të shpeshta.',
        ],
      },
      ja: {
        babyDescription: '妊娠のごく初期には速かった心拍数が、毎分130〜140回ほどで安定し、聴診器でも聞こえるようになります。',
        length: '約37.6cm',
        comparison: 'なす',
        bodyChanges: [
          '子宮が広がるにつれて、息切れや胸やけが増えることがあります。',
        ],
        toKnow: [
          '妊娠後期は一般にこの週ごろから始まり、健診の回数も増えていきます。',
        ],
      },
      ko: {
        babyDescription: '임신 아주 초기에는 더 빨랐던 심박수가 분당 약 130~140회로 안정되었고, 이제 청진기로 들을 수 있어요.',
        length: '약 37.6cm',
        comparison: '가지',
        bodyChanges: [
          '자궁이 더 많은 공간을 차지하면서 숨이 차거나 속쓰림이 더 잦아질 수 있어요.',
        ],
        toKnow: [
          '보통 이 무렵부터 임신 후기가 시작되고, 진료 일정이 더 잦아져요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A frequência cardíaca, mais rápida no início da gravidez, estabilizou nos 130 a 140 batimentos por minuto e já pode ser ouvida com um estetoscópio.',
        length: 'Cerca de 37,6 cm',
        comparison: 'Beringela',
        bodyChanges: [
          'A falta de ar ou a azia podem tornar-se mais frequentes à medida que o útero ocupa um espaço maior.',
        ],
        toKnow: [
          'O terceiro trimestre começa geralmente por volta desta semana, com consultas cada vez mais frequentes.',
        ],
      },
      bn: {
        babyDescription: 'গর্ভাবস্থার একেবারে শুরুতে দ্রুত থাকা হৃদস্পন্দন এখন প্রতি মিনিটে প্রায় 130 থেকে 140 বিটে স্থির হয়েছে এবং এখন স্টেথোস্কোপ দিয়ে শোনা যায়।',
        length: 'প্রায় 37.6 সেমি',
        comparison: 'বেগুন',
        bodyChanges: [
          'জরায়ু বেশি জায়গা নেওয়ায় শ্বাসকষ্ট বা বুক জ্বালাপোড়া আরও ঘন ঘন হতে পারে।',
        ],
        toKnow: [
          'তৃতীয় ত্রৈমাসিক সাধারণত এই সপ্তাহের কাছাকাছি শুরু হয়, আর এ সময় অ্যাপয়েন্টমেন্ট আরও ঘন ঘন হয়ে ওঠে।',
        ],
      },
    },
  },
  {
    week: 29,
    babyImage: require('../assets/images/pregnancy/development/week-29.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé est déjà bien formé ; les prochaines semaines seront surtout consacrées à la maturation des organes et à la prise de poids. Le fin enduit protecteur qui recouvre sa peau commence à se résorber.',
        length: 'Environ 38,6 cm',
        comparison: 'Courge butternut',
        bodyChanges: ['Le sommeil peut devenir plus difficile à trouver, en raison de la taille grandissante du ventre.'],
        toKnow: ['Se reposer sur le côté gauche est souvent conseillé en fin de grossesse pour favoriser la circulation.'],
      },
      en: {
        babyDescription:
          'The baby is already well formed; the coming weeks will mainly be devoted to organ maturation and weight gain. The thin protective coating covering their skin begins to be reabsorbed.',
        length: 'About 38.6 cm',
        comparison: 'Butternut squash',
        bodyChanges: ['Sleep may become harder to find because of your growing belly.'],
        toKnow: ['Resting on your left side is often recommended in late pregnancy to support circulation.'],
      },
      es: {
        babyDescription:
          'El bebé ya está bien formado; las próximas semanas se dedicarán sobre todo a la maduración de los órganos y al aumento de peso. La fina capa protectora que cubre su piel empieza a reabsorberse.',
        length: 'Aproximadamente 38,6 cm',
        comparison: 'Calabaza butternut',
        bodyChanges: ['Puede costar más conciliar el sueño, debido al tamaño cada vez mayor del vientre.'],
        toKnow: ['Descansar sobre el lado izquierdo suele recomendarse al final del embarazo para favorecer la circulación.'],
      },
      it: {
        babyDescription: 'Il bambino è già ben formato; le prossime settimane saranno dedicate soprattutto alla maturazione degli organi e all’aumento di peso. Il sottile rivestimento protettivo che ricopre la sua pelle comincia a essere riassorbito.',
        length: 'Circa 38,6 cm',
        comparison: 'Zucca butternut',
        bodyChanges: [
          'Può diventare più difficile dormire a causa della pancia sempre più grande.',
        ],
        toKnow: [
          'Nella gravidanza avanzata si consiglia spesso di riposare sul fianco sinistro per favorire la circolazione.',
        ],
      },
      tr: {
        babyDescription: 'Bebek şimdiden iyi biçimde oluşmuştur; önümüzdeki haftalar ağırlıklı olarak organların olgunlaşmasına ve kilo almaya ayrılacak. Cildini kaplayan ince koruyucu tabaka yeniden emilmeye başlar.',
        length: 'Yaklaşık 38,6 cm',
        comparison: 'Butternut kabağı',
        bodyChanges: [
          'Büyüyen karnın yüzünden uyumak zorlaşabilir.',
        ],
        toKnow: [
          'Gebeliğin sonlarında dolaşımı desteklemek için sol yana yatarak dinlenmek çoğunlukla önerilir.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш уже хорошо сформирован; ближайшие недели будут посвящены в основном созреванию органов и набору веса. Тонкая защитная оболочка, покрывающая его кожу, начинает рассасываться.',
        length:
          'Около 38,6 см',
        comparison:
          'Мускатная тыква',
        bodyChanges: [
          'Из-за растущего живота уснуть может стать труднее.',
        ],
        toKnow: [
          'На поздних сроках беременности часто рекомендуют отдыхать на левом боку — это поддерживает кровообращение.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby ist bereits gut ausgebildet; die kommenden Wochen dienen vor allem der Reifung der Organe und der Gewichtszunahme. Die dünne Schutzschicht, die seine Haut bedeckt, beginnt sich allmählich zurückzubilden.',
        length:
          'Etwa 38,6 cm',
        comparison:
          'Butternusskürbis',
        bodyChanges: [
          'Das Einschlafen und Durchschlafen kann wegen deines wachsenden Bauches schwieriger werden.',
        ],
        toKnow: [
          'In der späten Schwangerschaft wird oft empfohlen, auf der linken Seite zu ruhen, um den Kreislauf zu unterstützen.',
        ],
      },
      zh: {
        babyDescription: '宝宝已经发育得很完整，接下来的几周主要是器官成熟和体重增加。覆盖在皮肤上的那层薄薄的保护层开始被吸收。',
        length: '约 38.6 厘米',
        comparison: '奶油南瓜',
        bodyChanges: [
          '肚子越来越大，可能会更难入睡。',
        ],
        toKnow: [
          '孕晚期通常建议向左侧卧休息，以帮助血液循环。',
        ],
      },
      id: {
        babyDescription: 'Bayi sudah terbentuk dengan baik; minggu-minggu mendatang terutama dipakai untuk pematangan organ dan penambahan berat badan. Lapisan pelindung tipis yang menutupi kulitnya mulai terserap kembali.',
        length: 'Sekitar 38,6 cm',
        comparison: 'Labu butternut',
        bodyChanges: [
          'Tidur mungkin makin sulit didapat karena perutmu yang makin besar.',
        ],
        toKnow: [
          'Beristirahat dengan berbaring miring ke kiri sering dianjurkan pada akhir kehamilan untuk membantu sirkulasi darah.',
        ],
      },
      hi: {
        babyDescription: 'शिशु अब काफ़ी हद तक पूरी तरह बन चुका है; आने वाले सप्ताह मुख्य रूप से अंगों के परिपक्व होने और वज़न बढ़ने में लगेंगे। उसकी त्वचा को ढकने वाली पतली सुरक्षात्मक परत धीरे-धीरे सोखी जाने लगती है।',
        length: 'लगभग 38.6 सेमी',
        comparison: 'बटरनट कद्दू',
        bodyChanges: [
          'बढ़ते पेट के कारण नींद आना और कठिन हो सकता है।',
        ],
        toKnow: [
          'गर्भावस्था के आख़िरी दिनों में बाईं करवट लेकर आराम करना अक्सर सुझाया जाता है, ताकि रक्त संचार को सहारा मिले।',
        ],
      },
      sq: {
        babyDescription: 'Bebi është tashmë i formuar mirë; javët e ardhshme do t\'i kushtohen kryesisht pjekjes së organeve dhe shtimit në peshë. Shtresa e hollë mbrojtëse që mbulon lëkurën e tij fillon të përthithet.',
        length: 'Rreth 38.6 cm',
        comparison: 'Kungull butternut',
        bodyChanges: [
          'Gjumi mund të bëhet më i vështirë për shkak të barkut që po rritet.',
        ],
        toKnow: [
          'Pushimi në anën e majtë rekomandohet shpesh në fund të shtatzënisë për të mbështetur qarkullimin e gjakut.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんはすでにしっかりと形づくられていて、これからの数週間は主に臓器の成熟と体重の増加に使われます。皮膚を覆っている薄い保護膜は、少しずつ吸収され始めます。',
        length: '約38.6cm',
        comparison: 'バターナッツかぼちゃ',
        bodyChanges: [
          'おなかが大きくなるにつれて、眠りにくくなることがあります。',
        ],
        toKnow: [
          '妊娠後期は、血流を支えるために左側を下にして休むことがよくすすめられます。',
        ],
      },
      ko: {
        babyDescription: '아기는 이미 모양이 잘 갖춰졌고, 앞으로 몇 주는 주로 장기가 성숙하고 몸무게가 늘어나는 시기예요. 피부를 덮고 있던 얇은 보호막이 서서히 흡수되기 시작해요.',
        length: '약 38.6cm',
        comparison: '버터넛 스쿼시',
        bodyChanges: [
          '배가 커지면서 잠들기가 더 어려워질 수 있어요.',
        ],
        toKnow: [
          '임신 후기에는 혈액 순환을 돕기 위해 왼쪽으로 누워 쉬는 것이 좋다고 권하는 경우가 많아요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé já está bem formado; as próximas semanas serão dedicadas sobretudo à maturação dos órgãos e ao ganho de peso. O fino revestimento protetor que cobre a sua pele começa a ser reabsorvido.',
        length: 'Cerca de 38,6 cm',
        comparison: 'Abóbora-menina',
        bodyChanges: [
          'Pode tornar-se mais difícil dormir bem por causa da barriga que cresce.',
        ],
        toKnow: [
          'No final da gravidez, recomenda-se com frequência descansar deitada sobre o lado esquerdo, para favorecer a circulação.',
        ],
      },
      bn: {
        babyDescription: 'শিশুর গঠন ইতিমধ্যেই পূর্ণাঙ্গ; আসন্ন সপ্তাহগুলো মূলত অঙ্গপ্রত্যঙ্গের পরিপক্বতা ও ওজন বৃদ্ধিতে কাটবে। ত্বক ঢেকে রাখা পাতলা সুরক্ষা স্তরটি ধীরে ধীরে শরীরে শোষিত হতে শুরু করে।',
        length: 'প্রায় 38.6 সেমি',
        comparison: 'বাটারনাট স্কোয়াশ',
        bodyChanges: [
          'পেট বড় হয়ে যাওয়ায় ঘুম আসা কঠিন হয়ে উঠতে পারে।',
        ],
        toKnow: [
          'গর্ভাবস্থার শেষ দিকে রক্তসঞ্চালনে সহায়তার জন্য বাঁ পাশ ফিরে বিশ্রাম নেওয়ার পরামর্শ প্রায়ই দেওয়া হয়।',
        ],
      },
    },
  },
  {
    week: 30,
    babyImage: require('../assets/images/pregnancy/development/week-30.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'La vision continue de se développer ; à la naissance, le bébé pourra distinguer les visages proches, avant de progressivement apprendre à suivre des objets en mouvement.',
        length: 'Environ 39,9 cm',
        comparison: 'Chou',
        bodyChanges: ['Une sensation de lourdeur dans le bas du dos ou le bassin peut s’accentuer.'],
        toKnow: ['Les consultations prénatales deviennent généralement plus rapprochées à partir de ce stade.'],
      },
      en: {
        babyDescription:
          'Vision continues developing; at birth, the baby will be able to make out nearby faces, before gradually learning to track moving objects.',
        length: 'About 39.9 cm',
        comparison: 'Cabbage',
        bodyChanges: ['A feeling of heaviness in the lower back or pelvis may increase.'],
        toKnow: ['Prenatal appointments generally become more frequent from this stage onward.'],
      },
      es: {
        babyDescription:
          'La visión sigue desarrollándose; al nacer, el bebé podrá distinguir los rostros cercanos, antes de aprender progresivamente a seguir objetos en movimiento.',
        length: 'Aproximadamente 39,9 cm',
        comparison: 'Col',
        bodyChanges: ['Puede acentuarse una sensación de pesadez en la parte baja de la espalda o en la pelvis.'],
        toKnow: ['Las consultas prenatales generalmente se vuelven más seguidas a partir de esta etapa.'],
      },
      it: {
        babyDescription: 'La vista continua a svilupparsi; alla nascita il bambino sarà in grado di distinguere i volti vicini, per poi imparare gradualmente a seguire gli oggetti in movimento.',
        length: 'Circa 39,9 cm',
        comparison: 'Cavolo',
        bodyChanges: [
          'Una sensazione di pesantezza nella parte bassa della schiena o nel bacino può aumentare.',
        ],
        toKnow: [
          'Da questa fase in poi, le visite prenatali in genere diventano più frequenti.',
        ],
      },
      tr: {
        babyDescription: 'Görme gelişmeye devam eder; bebek doğduğunda yakındaki yüzleri seçebilecek, ardından hareket eden nesneleri takip etmeyi yavaş yavaş öğrenecektir.',
        length: 'Yaklaşık 39,9 cm',
        comparison: 'Lahana',
        bodyChanges: [
          'Belin alt kısmında ya da leğen kemiğinde ağırlık hissi artabilir.',
        ],
        toKnow: [
          'Doğum öncesi randevular genellikle bu aşamadan itibaren sıklaşır.',
        ],
      },
      ru: {
        babyDescription:
          'Зрение продолжает развиваться; при рождении малыш сможет различать лица вблизи, а затем постепенно научится следить за движущимися предметами.',
        length:
          'Около 39,9 см',
        comparison:
          'Капуста',
        bodyChanges: [
          'Ощущение тяжести в пояснице или тазу может усилиться.',
        ],
        toKnow: [
          'Начиная с этого срока визиты в рамках наблюдения за беременностью, как правило, становятся чаще.',
        ],
      },
      de: {
        babyDescription:
          'Das Sehvermögen entwickelt sich weiter; bei der Geburt kann das Baby Gesichter in der Nähe erkennen, bevor es nach und nach lernt, sich bewegenden Gegenständen mit den Augen zu folgen.',
        length:
          'Etwa 39,9 cm',
        comparison:
          'Kohlkopf',
        bodyChanges: [
          'Ein Gefühl von Schwere im unteren Rücken oder im Becken kann zunehmen.',
        ],
        toKnow: [
          'Die Vorsorgetermine werden ab dieser Phase in der Regel häufiger.',
        ],
      },
      zh: {
        babyDescription: '视力继续发育；出生时，宝宝能够看清近处的面孔，之后会逐渐学会追视移动的物体。',
        length: '约 39.9 厘米',
        comparison: '卷心菜',
        bodyChanges: [
          '下背部或骨盆的沉重感可能会加重。',
        ],
        toKnow: [
          '从这个阶段起，产检通常会变得更频繁。',
        ],
      },
      id: {
        babyDescription: 'Penglihatan terus berkembang; saat lahir, bayi akan mampu mengenali wajah yang berada dekat dengannya, sebelum berangsur belajar mengikuti benda yang bergerak.',
        length: 'Sekitar 39,9 cm',
        comparison: 'Kubis',
        bodyChanges: [
          'Rasa berat di punggung bawah atau panggul bisa makin terasa.',
        ],
        toKnow: [
          'Kunjungan pemeriksaan kehamilan umumnya menjadi lebih sering mulai tahap ini.',
        ],
      },
      hi: {
        babyDescription: 'दृष्टि का विकास जारी रहता है; जन्म के समय शिशु पास के चेहरों को पहचान सकेगा, और फिर धीरे-धीरे हिलती चीज़ों को नज़रों से फ़ॉलो करना सीखेगा।',
        length: 'लगभग 39.9 सेमी',
        comparison: 'पत्ता गोभी',
        bodyChanges: [
          'पीठ के निचले हिस्से या पेल्विस में भारीपन का एहसास बढ़ सकता है।',
        ],
        toKnow: [
          'इस चरण से प्रसवपूर्व जाँच की मुलाक़ातें आम तौर पर ज़्यादा बार होने लगती हैं।',
        ],
      },
      sq: {
        babyDescription: 'Shikimi vazhdon të zhvillohet; në lindje, bebi do të mund të dallojë fytyrat e afërta, përpara se të mësojë gradualisht të ndjekë objektet në lëvizje.',
        length: 'Rreth 39.9 cm',
        comparison: 'Lakër',
        bodyChanges: [
          'Ndjenja e rëndesës në pjesën e poshtme të shpinës ose në legen mund të shtohet.',
        ],
        toKnow: [
          'Vizitat e kontrollit para lindjes zakonisht bëhen më të shpeshta që nga ky stad.',
        ],
      },
      ja: {
        babyDescription: '視力は発達を続けています。生まれたときには近くの顔をぼんやり見分けられるようになり、その後、動くものを少しずつ目で追えるようになっていきます。',
        length: '約39.9cm',
        comparison: 'キャベツ',
        bodyChanges: [
          '腰や骨盤の重だるさが強くなることがあります。',
        ],
        toKnow: [
          '妊婦健診は、この時期から一般に回数が増えていきます。',
        ],
      },
      ko: {
        babyDescription: '시력이 계속 발달해요. 태어날 때는 가까이 있는 얼굴을 알아볼 수 있고, 이후 조금씩 움직이는 물체를 눈으로 따라가는 법을 배워요.',
        length: '약 39.9cm',
        comparison: '양배추',
        bodyChanges: [
          '허리나 골반이 묵직한 느낌이 더 심해질 수 있어요.',
        ],
        toKnow: [
          '이 시기부터는 산전 진료 간격이 대체로 더 짧아져요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A visão continua a desenvolver-se; ao nascer, o bebé conseguirá distinguir rostos próximos, antes de aprender gradualmente a seguir objetos em movimento.',
        length: 'Cerca de 39,9 cm',
        comparison: 'Couve',
        bodyChanges: [
          'A sensação de peso na zona lombar ou na bacia pode aumentar.',
        ],
        toKnow: [
          'As consultas de vigilância pré-natal tornam-se geralmente mais frequentes a partir desta fase.',
        ],
      },
      bn: {
        babyDescription: 'দৃষ্টিশক্তির বিকাশ চলতে থাকে; জন্মের সময় শিশু কাছের মুখ আবছাভাবে চিনতে পারবে, তারপর ধীরে ধীরে চলমান বস্তুর দিকে চোখ রাখতে শিখবে।',
        length: 'প্রায় 39.9 সেমি',
        comparison: 'বাঁধাকপি',
        bodyChanges: [
          'পিঠের নিচের অংশে বা শ্রোণিতে ভারী লাগার অনুভূতি বাড়তে পারে।',
        ],
        toKnow: [
          'এই পর্যায় থেকে প্রসবপূর্ব চেকআপ সাধারণত আরও ঘন ঘন হয়ে থাকে।',
        ],
      },
    },
  },
  {
    week: 31,
    babyImage: require('../assets/images/pregnancy/development/week-31.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé bouge activement, suce parfois ses doigts et peut faire des mouvements amples. Sa peau devient moins fripée à mesure que la graisse s’accumule.',
        length: 'Environ 41,1 cm',
        comparison: 'Noix de coco',
        bodyChanges: ['Des contractions d’entraînement, dites de Braxton Hicks, peuvent commencer à se faire sentir occasionnellement.'],
        toKnow: ['Le bébé commence à reconnaître certaines voix familières entendues régulièrement depuis l’extérieur.'],
      },
      en: {
        babyDescription:
          'The baby moves actively, sometimes sucks their fingers, and can make broad movements. Their skin becomes less wrinkled as fat accumulates.',
        length: 'About 41.1 cm',
        comparison: 'Coconut',
        bodyChanges: ['Practice contractions, known as Braxton Hicks, may start being felt occasionally.'],
        toKnow: ['The baby is starting to recognize certain familiar voices heard regularly from outside.'],
      },
      es: {
        babyDescription:
          'El bebé se mueve activamente, a veces se chupa los dedos y puede hacer movimientos amplios. Su piel se vuelve menos arrugada a medida que se acumula grasa.',
        length: 'Aproximadamente 41,1 cm',
        comparison: 'Coco',
        bodyChanges: ['Pueden empezar a sentirse ocasionalmente contracciones de entrenamiento, llamadas de Braxton Hicks.'],
        toKnow: ['El bebé empieza a reconocer algunas voces familiares que oye regularmente desde el exterior.'],
      },
      it: {
        babyDescription: 'Il bambino si muove attivamente, a volte si succhia le dita e può fare movimenti ampi. La sua pelle diventa meno rugosa man mano che si accumula il grasso.',
        length: 'Circa 41,1 cm',
        comparison: 'Noce di cocco',
        bodyChanges: [
          'Le contrazioni di allenamento, note come contrazioni di Braxton Hicks, possono iniziare a farsi sentire di tanto in tanto.',
        ],
        toKnow: [
          'Il bambino comincia a riconoscere alcune voci familiari che sente regolarmente dall’esterno.',
        ],
      },
      tr: {
        babyDescription: 'Bebek aktif biçimde hareket eder, bazen parmaklarını emer ve geniş hareketler yapabilir. Yağ biriktikçe cildi daha az buruşuk olur.',
        length: 'Yaklaşık 41,1 cm',
        comparison: 'Hindistan cevizi',
        bodyChanges: [
          'Braxton Hicks adı verilen alıştırma kasılmaları ara sıra hissedilmeye başlayabilir.',
        ],
        toKnow: [
          'Bebek, dışarıdan düzenli olarak duyduğu bazı tanıdık sesleri tanımaya başlıyor.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш активно двигается, иногда сосёт пальцы и может делать широкие движения. Его кожа становится менее морщинистой по мере накопления жира.',
        length:
          'Около 41,1 см',
        comparison:
          'Кокос',
        bodyChanges: [
          'Тренировочные схватки, известные как схватки Брэкстона-Хикса, могут время от времени ощущаться.',
        ],
        toKnow: [
          'Малыш начинает узнавать некоторые знакомые голоса, которые регулярно слышит снаружи.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby bewegt sich lebhaft, lutscht manchmal an den Fingern und kann weit ausholende Bewegungen machen. Seine Haut wird glatter, weil sich mehr Fett einlagert.',
        length:
          'Etwa 41,1 cm',
        comparison:
          'Kokosnuss',
        bodyChanges: [
          'Übungswehen, sogenannte Braxton-Hicks-Kontraktionen, können gelegentlich spürbar werden.',
        ],
        toKnow: [
          'Das Baby beginnt, bestimmte vertraute Stimmen zu erkennen, die es regelmäßig von außen hört.',
        ],
      },
      zh: {
        babyDescription: '宝宝活动很活跃，有时会吮吸手指，也能做出幅度较大的动作。随着脂肪积累，皮肤的皱纹会减少。',
        length: '约 41.1 厘米',
        comparison: '椰子',
        bodyChanges: [
          '你可能会偶尔感觉到被称为“假性宫缩”（Braxton Hicks）的练习性宫缩。',
        ],
        toKnow: [
          '宝宝开始能够辨认外界经常听到的某些熟悉的声音。',
        ],
      },
      id: {
        babyDescription: 'Bayi bergerak aktif, terkadang mengisap jarinya, dan bisa melakukan gerakan yang luas. Kulitnya menjadi lebih tidak keriput seiring menumpuknya lemak.',
        length: 'Sekitar 41,1 cm',
        comparison: 'Kelapa',
        bodyChanges: [
          'Kontraksi latihan, yang dikenal sebagai Braxton Hicks, mungkin mulai sesekali terasa.',
        ],
        toKnow: [
          'Bayi mulai mengenali suara-suara akrab tertentu yang sering didengarnya dari luar.',
        ],
      },
      hi: {
        babyDescription: 'शिशु सक्रिय रूप से हिलता-डुलता है, कभी-कभी अपनी उँगलियाँ चूसता है और बड़ी हरकतें कर सकता है। चर्बी जमा होने से उसकी त्वचा की झुर्रियाँ कम होती जाती हैं।',
        length: 'लगभग 41.1 सेमी',
        comparison: 'नारियल',
        bodyChanges: [
          'अभ्यास संकुचन, जिन्हें ब्रैक्सटन हिक्स कहा जाता है, कभी-कभार महसूस होने लग सकते हैं।',
        ],
        toKnow: [
          'शिशु बाहर से नियमित रूप से सुनाई देने वाली कुछ जानी-पहचानी आवाज़ों को पहचानने लगता है।',
        ],
      },
      sq: {
        babyDescription: 'Bebi lëviz aktivisht, ndonjëherë thith gishtat dhe mund të bëjë lëvizje të gjera. Lëkura e tij bëhet më pak e rrudhosur ndërsa grumbullohet yndyra.',
        length: 'Rreth 41.1 cm',
        comparison: 'Arrë kokosi',
        bodyChanges: [
          'Kontraksionet stërvitëse, të njohura si Braxton Hicks, mund të fillojnë të ndihen herë pas here.',
        ],
        toKnow: [
          'Bebi po fillon të njohë disa zëra të njohur që dëgjon rregullisht nga jashtë.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんは活発に動き、ときどき指をしゃぶり、大きな動きもできます。脂肪がつくにつれて、皮膚のしわが少なくなっていきます。',
        length: '約41.1cm',
        comparison: 'ココナッツ',
        bodyChanges: [
          'ブラクストン・ヒックスと呼ばれる練習のための収縮（前駆陣痛）を、ときどき感じ始めることがあります。',
        ],
        toKnow: [
          '赤ちゃんは、外からいつも聞こえてくる身近な声を少しずつ聞き分け始めています。',
        ],
      },
      ko: {
        babyDescription: '아기는 활발하게 움직이고, 가끔 손가락을 빨기도 하며, 큰 동작도 할 수 있어요. 지방이 쌓이면서 피부 주름이 줄어들어요.',
        length: '약 41.1cm',
        comparison: '코코넛',
        bodyChanges: [
          '브랙스턴 힉스라고 하는 연습 수축이 가끔 느껴지기 시작할 수 있어요.',
        ],
        toKnow: [
          '아기는 밖에서 자주 들리는 익숙한 목소리를 알아보기 시작해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé mexe-se ativamente, por vezes chupa os dedos e consegue fazer movimentos amplos. A sua pele fica menos enrugada à medida que se acumula gordura.',
        length: 'Cerca de 41,1 cm',
        comparison: 'Coco',
        bodyChanges: [
          'As contrações de treino, conhecidas como contrações de Braxton Hicks, podem começar a sentir-se ocasionalmente.',
        ],
        toKnow: [
          'O bebé começa a reconhecer certas vozes familiares ouvidas regularmente do exterior.',
        ],
      },
      bn: {
        babyDescription: 'শিশু সক্রিয়ভাবে নড়াচড়া করে, কখনো কখনো আঙুল চোষে এবং বড় বড় নড়াচড়া করতে পারে। চর্বি জমতে থাকায় তার ত্বকের ভাঁজ কমে আসে।',
        length: 'প্রায় 41.1 সেমি',
        comparison: 'নারকেল',
        bodyChanges: [
          'ব্র্যাক্সটন হিক্স নামে পরিচিত অনুশীলন সংকোচন মাঝেমধ্যে অনুভূত হতে শুরু করতে পারে।',
        ],
        toKnow: [
          'বাইরে থেকে নিয়মিত শোনা কিছু পরিচিত কণ্ঠস্বর শিশু চিনতে শুরু করছে।',
        ],
      },
    },
  },
  {
    week: 32,
    babyImage: require('../assets/images/pregnancy/development/week-32.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé est déjà bien formé et se positionne peu à peu tête en bas en vue de la naissance. Il continue surtout à prendre du poids durant les semaines restantes.',
        length: 'Environ 42,4 cm',
        comparison: 'Botte de céleri',
        bodyChanges: ['Une prise de poids plus marquée est courante durant cette période, en lien avec la croissance du bébé.'],
        toKnow: ['Le positionnement tête en bas (présentation céphalique) devient plus fréquent à l’approche du terme.'],
      },
      en: {
        babyDescription:
          'The baby is already well formed and is gradually settling head-down in preparation for birth. They mainly continue gaining weight during the remaining weeks.',
        length: 'About 42.4 cm',
        comparison: 'Bunch of celery',
        bodyChanges: ['More noticeable weight gain is common during this period, linked to the baby’s growth.'],
        toKnow: ['Head-down positioning (cephalic presentation) becomes more common as term approaches.'],
      },
      es: {
        babyDescription:
          'El bebé ya está bien formado y se va colocando poco a poco con la cabeza hacia abajo de cara al nacimiento. Durante las semanas restantes, sobre todo continúa ganando peso.',
        length: 'Aproximadamente 42,4 cm',
        comparison: 'Manojo de apio',
        bodyChanges: ['Un aumento de peso más marcado es habitual durante este periodo, relacionado con el crecimiento del bebé.'],
        toKnow: ['La colocación con la cabeza hacia abajo (presentación cefálica) se vuelve más frecuente a medida que se acerca el término.'],
      },
      it: {
        babyDescription: 'Il bambino è già ben formato e si sistema gradualmente a testa in giù in preparazione alla nascita. Nelle settimane che restano continua soprattutto a prendere peso.',
        length: 'Circa 42,4 cm',
        comparison: 'Mazzo di sedano',
        bodyChanges: [
          'In questo periodo è frequente un aumento di peso più evidente, legato alla crescita del bambino.',
        ],
        toKnow: [
          'La posizione a testa in giù (presentazione cefalica) diventa più comune man mano che ci si avvicina al termine.',
        ],
      },
      tr: {
        babyDescription: 'Bebek şimdiden iyi biçimde oluşmuştur ve doğuma hazırlık olarak yavaş yavaş başı aşağıda olacak şekilde yerleşir. Kalan haftalarda ağırlıklı olarak kilo almaya devam eder.',
        length: 'Yaklaşık 42,4 cm',
        comparison: 'Bir demet kereviz',
        bodyChanges: [
          'Bu dönemde, bebeğin büyümesine bağlı olarak daha belirgin bir kilo artışı yaygındır.',
        ],
        toKnow: [
          'Doğum zamanı yaklaştıkça baş aşağı duruş (sefalik prezentasyon) daha yaygın hâle gelir.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш уже хорошо сформирован и постепенно располагается головой вниз, готовясь к рождению. В оставшиеся недели он в основном продолжает набирать вес.',
        length:
          'Около 42,4 см',
        comparison:
          'Пучок сельдерея',
        bodyChanges: [
          'В этот период часто заметнее прибавка в весе, связанная с ростом малыша.',
        ],
        toKnow: [
          'Головное предлежание (положение головой вниз) встречается всё чаще по мере приближения срока родов.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby ist bereits gut ausgebildet und dreht sich allmählich mit dem Kopf nach unten, um sich auf die Geburt vorzubereiten. In den verbleibenden Wochen nimmt es vor allem weiter an Gewicht zu.',
        length:
          'Etwa 42,4 cm',
        comparison:
          'Bund Staudensellerie',
        bodyChanges: [
          'Eine deutlichere Gewichtszunahme ist in dieser Zeit häufig und hängt mit dem Wachstum des Babys zusammen.',
        ],
        toKnow: [
          'Die Lage mit dem Kopf nach unten (Schädellage) wird mit näher rückendem Termin häufiger.',
        ],
      },
      zh: {
        babyDescription: '宝宝已经发育得很完整，正逐渐调整为头朝下的姿势，为出生做准备。接下来的几周，宝宝主要继续增加体重。',
        length: '约 42.4 厘米',
        comparison: '一把芹菜',
        bodyChanges: [
          '这段时间体重增加往往更明显，这与宝宝的生长有关。',
        ],
        toKnow: [
          '随着预产期临近，头朝下的胎位（头位）会越来越常见。',
        ],
      },
      id: {
        babyDescription: 'Bayi sudah terbentuk dengan baik dan berangsur mengambil posisi kepala di bawah sebagai persiapan lahir. Selama minggu-minggu yang tersisa, bayi terutama terus bertambah berat badannya.',
        length: 'Sekitar 42,4 cm',
        comparison: 'Seikat seledri',
        bodyChanges: [
          'Penambahan berat badan yang lebih terasa umum terjadi pada masa ini, berkaitan dengan pertumbuhan bayi.',
        ],
        toKnow: [
          'Posisi kepala di bawah (presentasi kepala) makin umum seiring mendekati waktu persalinan.',
        ],
      },
      hi: {
        babyDescription: 'शिशु अब काफ़ी हद तक पूरी तरह बन चुका है और जन्म की तैयारी में धीरे-धीरे सिर नीचे की ओर करके अपनी जगह बना रहा है। बाक़ी सप्ताहों में वह मुख्य रूप से वज़न बढ़ाता रहता है।',
        length: 'लगभग 42.4 सेमी',
        comparison: 'सेलरी का गुच्छा',
        bodyChanges: [
          'इस दौरान शिशु के बढ़ने के कारण वज़न का ज़्यादा बढ़ना आम बात है।',
        ],
        toKnow: [
          'प्रसव का समय पास आने पर सिर नीचे की स्थिति (सेफ़ेलिक प्रेज़ेंटेशन) ज़्यादा आम हो जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Bebi është tashmë i formuar mirë dhe po zë gradualisht pozicionin me kokën poshtë në përgatitje për lindjen. Gjatë javëve të mbetura vazhdon kryesisht të shtohet në peshë.',
        length: 'Rreth 42.4 cm',
        comparison: 'Tufë selinoje',
        bodyChanges: [
          'Shtimi më i dukshëm në peshë është i zakonshëm gjatë kësaj periudhe, i lidhur me rritjen e bebit.',
        ],
        toKnow: [
          'Pozicioni me kokën poshtë (prezantimi cefalik) bëhet më i zakonshëm ndërsa i afrohemi afatit.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんはすでにしっかりと形づくられていて、出産に備えて少しずつ頭を下に向けた位置に落ち着いていきます。残りの数週間は、主に体重を増やしていきます。',
        length: '約42.4cm',
        comparison: 'セロリひと束',
        bodyChanges: [
          '赤ちゃんの成長に伴って、この時期は体重の増え方がはっきりしてくることがよくあります。',
        ],
        toKnow: [
          '出産予定日が近づくにつれて、頭が下を向いた状態（頭位）の赤ちゃんが多くなります。',
        ],
      },
      ko: {
        babyDescription: '아기는 이미 모양이 잘 갖춰졌고, 출산을 준비하며 머리를 아래로 향한 자세로 조금씩 자리를 잡아요. 남은 몇 주 동안은 주로 몸무게가 늘어나요.',
        length: '약 42.4cm',
        comparison: '셀러리 한 단',
        bodyChanges: [
          '아기가 자라면서 이 시기에는 체중이 눈에 띄게 느는 경우가 흔해요.',
        ],
        toKnow: [
          '출산 예정일이 가까워질수록 머리가 아래를 향한 자세(두위)가 더 흔해져요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé já está bem formado e vai-se posicionando gradualmente de cabeça para baixo, em preparação para o parto. Durante as semanas que faltam, continua sobretudo a ganhar peso.',
        length: 'Cerca de 42,4 cm',
        comparison: 'Molho de aipo',
        bodyChanges: [
          'Um ganho de peso mais notório é comum neste período, associado ao crescimento do bebé.',
        ],
        toKnow: [
          'A posição de cabeça para baixo (apresentação cefálica) torna-se mais comum à medida que o termo se aproxima.',
        ],
      },
      bn: {
        babyDescription: 'শিশুর গঠন ইতিমধ্যেই পূর্ণাঙ্গ এবং প্রসবের প্রস্তুতিতে সে ধীরে ধীরে মাথা নিচের দিকে করে অবস্থান নিচ্ছে। বাকি সপ্তাহগুলোতে সে মূলত ওজন বাড়াতে থাকে।',
        length: 'প্রায় 42.4 সেমি',
        comparison: 'এক আঁটি ডাঁটাশাক',
        bodyChanges: [
          'এই সময়ে শিশুর বৃদ্ধির কারণে ওজন তুলনামূলক বেশি বাড়া স্বাভাবিক।',
        ],
        toKnow: [
          'প্রসবের সময় যত ঘনিয়ে আসে, মাথা নিচের দিকে থাকা অবস্থান (সেফালিক প্রেজেন্টেশন) তত বেশি দেখা যায়।',
        ],
      },
    },
  },
  {
    week: 33,
    babyImage: require('../assets/images/pregnancy/development/week-33.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le cerveau et le système nerveux sont désormais bien développés. Les os continuent de se durcir, à l’exception de ceux du crâne, qui restent souples pour faciliter le passage lors de la naissance.',
        length: 'Environ 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: ['Une gêne pour trouver une position confortable pour dormir est fréquente à ce stade.'],
        toKnow: ['La souplesse des os du crâne à la naissance est temporaire et se referme progressivement durant la première année.'],
      },
      en: {
        babyDescription:
          'The brain and nervous system are now well developed. The bones continue hardening, except for those of the skull, which stay flexible to make it easier to pass through during birth.',
        length: 'About 43.7 cm',
        comparison: 'Pineapple',
        bodyChanges: ['Difficulty finding a comfortable sleeping position is common at this stage.'],
        toKnow: ['The flexibility of the skull bones at birth is temporary and gradually closes up during the first year.'],
      },
      es: {
        babyDescription:
          'El cerebro y el sistema nervioso ya están bien desarrollados. Los huesos continúan endureciéndose, a excepción de los del cráneo, que permanecen flexibles para facilitar el paso durante el nacimiento.',
        length: 'Aproximadamente 43,7 cm',
        comparison: 'Piña',
        bodyChanges: ['Es frecuente en esta etapa tener dificultad para encontrar una posición cómoda para dormir.'],
        toKnow: ['La flexibilidad de los huesos del cráneo al nacer es temporal y se va cerrando progresivamente durante el primer año.'],
      },
      it: {
        babyDescription: 'Il cervello e il sistema nervoso sono ormai ben sviluppati. Le ossa continuano a indurirsi, tranne quelle del cranio, che restano flessibili per facilitarne il passaggio durante il parto.',
        length: 'Circa 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'In questa fase è frequente avere difficoltà a trovare una posizione comoda per dormire.',
        ],
        toKnow: [
          'La flessibilità delle ossa del cranio alla nascita è temporanea e si chiude gradualmente nel corso del primo anno.',
        ],
      },
      tr: {
        babyDescription: 'Beyin ve sinir sistemi artık iyi gelişmiştir. Kemikler sertleşmeye devam eder; doğum sırasında geçişi kolaylaştırmak için esnek kalan kafatası kemikleri hariç.',
        length: 'Yaklaşık 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Bu aşamada rahat bir uyku pozisyonu bulmakta zorlanmak yaygındır.',
        ],
        toKnow: [
          'Kafatası kemiklerinin doğumdaki esnekliği geçicidir ve ilk yıl içinde yavaş yavaş kapanır.',
        ],
      },
      ru: {
        babyDescription:
          'Мозг и нервная система теперь хорошо развиты. Кости продолжают твердеть, кроме костей черепа, которые остаются гибкими, чтобы облегчить прохождение при родах.',
        length:
          'Около 43,7 см',
        comparison:
          'Ананас',
        bodyChanges: [
          'На этом этапе нередко трудно найти удобное положение для сна.',
        ],
        toKnow: [
          'Гибкость костей черепа при рождении временна и постепенно исчезает в течение первого года жизни.',
        ],
      },
      de: {
        babyDescription:
          'Gehirn und Nervensystem sind jetzt gut entwickelt. Die Knochen härten weiter aus – mit Ausnahme der Schädelknochen, die beweglich bleiben, damit der Kopf bei der Geburt leichter hindurchgleiten kann.',
        length:
          'Etwa 43,7 cm',
        comparison:
          'Ananas',
        bodyChanges: [
          'Schwierigkeiten, eine bequeme Schlafposition zu finden, sind in dieser Phase häufig.',
        ],
        toKnow: [
          'Die Beweglichkeit der Schädelknochen bei der Geburt ist vorübergehend und schließt sich im Lauf des ersten Lebensjahres allmählich.',
        ],
      },
      zh: {
        babyDescription: '大脑和神经系统现在已经发育得很好。骨骼继续变硬，只有头骨仍保持柔韧，以便分娩时更容易通过产道。',
        length: '约 43.7 厘米',
        comparison: '菠萝',
        bodyChanges: [
          '这个阶段，很难找到舒服的睡姿是常见的。',
        ],
        toKnow: [
          '宝宝出生时头骨的柔韧性是暂时的，会在出生后第一年逐渐闭合。',
        ],
      },
      id: {
        babyDescription: 'Otak dan sistem saraf kini sudah berkembang dengan baik. Tulang terus mengeras, kecuali tulang tengkorak yang tetap lentur agar lebih mudah melewati jalan lahir saat persalinan.',
        length: 'Sekitar 43,7 cm',
        comparison: 'Nanas',
        bodyChanges: [
          'Kesulitan menemukan posisi tidur yang nyaman umum terjadi pada tahap ini.',
        ],
        toKnow: [
          'Kelenturan tulang tengkorak saat lahir bersifat sementara dan berangsur menutup selama tahun pertama.',
        ],
      },
      hi: {
        babyDescription: 'मस्तिष्क और तंत्रिका तंत्र अब अच्छी तरह विकसित हो चुके हैं। हड्डियाँ सख़्त होती जा रही हैं, सिर की हड्डियों को छोड़कर, जो लचीली बनी रहती हैं ताकि जन्म के समय बाहर निकलना आसान हो।',
        length: 'लगभग 43.7 सेमी',
        comparison: 'अनानास',
        bodyChanges: [
          'इस चरण में सोने की आरामदायक स्थिति ढूँढने में कठिनाई होना आम है।',
        ],
        toKnow: [
          'जन्म के समय सिर की हड्डियों का लचीलापन अस्थायी होता है और पहले साल के दौरान धीरे-धीरे बंद हो जाता है।',
        ],
      },
      sq: {
        babyDescription: 'Truri dhe sistemi nervor janë tashmë të zhvilluar mirë. Kockat vazhdojnë të forcohen, përveç atyre të kafkës, të cilat mbeten fleksibël për ta lehtësuar kalimin gjatë lindjes.',
        length: 'Rreth 43.7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Vështirësia për të gjetur një pozicion të rehatshëm për gjumë është e zakonshme në këtë stad.',
        ],
        toKnow: [
          'Fleksibiliteti i kockave të kafkës në lindje është i përkohshëm dhe mbyllet gradualisht gjatë vitit të parë.',
        ],
      },
      ja: {
        babyDescription: '脳と神経系はかなり発達しています。骨は固くなり続けますが、頭蓋骨だけは、出産のときに通りやすいように柔らかいままです。',
        length: '約43.7cm',
        comparison: 'パイナップル',
        bodyChanges: [
          'この時期は、楽な寝姿勢が見つけにくくなることがよくあります。',
        ],
        toKnow: [
          '生まれたときの頭蓋骨の柔らかさは一時的なもので、生後1年のあいだに少しずつ閉じていきます。',
        ],
      },
      ko: {
        babyDescription: '뇌와 신경계가 이제 잘 발달했어요. 뼈는 계속 단단해지지만, 두개골은 출산할 때 더 쉽게 지나갈 수 있도록 유연한 상태로 남아 있어요.',
        length: '약 43.7cm',
        comparison: '파인애플',
        bodyChanges: [
          '이 시기에는 편안하게 잘 수 있는 자세를 찾기 어려운 경우가 흔해요.',
        ],
        toKnow: [
          '태어날 때 두개골이 유연한 것은 일시적이며, 생후 1년 동안 서서히 닫혀요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O cérebro e o sistema nervoso estão agora bem desenvolvidos. Os ossos continuam a endurecer, com exceção dos do crânio, que se mantêm flexíveis para facilitar a passagem durante o parto.',
        length: 'Cerca de 43,7 cm',
        comparison: 'Ananás',
        bodyChanges: [
          'É comum haver dificuldade em encontrar uma posição confortável para dormir nesta fase.',
        ],
        toKnow: [
          'A flexibilidade dos ossos do crânio ao nascer é temporária e vai-se fechando gradualmente durante o primeiro ano.',
        ],
      },
      bn: {
        babyDescription: 'মস্তিষ্ক ও স্নায়ুতন্ত্র এখন বেশ বিকশিত। হাড় শক্ত হতে থাকে, তবে মাথার খুলির হাড় নমনীয় থাকে, যাতে প্রসবের সময় সহজে বেরিয়ে আসা যায়।',
        length: 'প্রায় 43.7 সেমি',
        comparison: 'আনারস',
        bodyChanges: [
          'এই পর্যায়ে ঘুমানোর আরামদায়ক ভঙ্গি খুঁজে পেতে অসুবিধা হওয়া স্বাভাবিক।',
        ],
        toKnow: [
          'জন্মের সময় খুলির হাড়ের নমনীয়তা সাময়িক এবং জীবনের প্রথম বছরে তা ধীরে ধীরে জোড়া লেগে যায়।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- weeks 34–40 (late third trimester)
  {
    week: 34,
    babyImage: require('../assets/images/pregnancy/development/week-34.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le bébé, recroquevillé faute de place, garde généralement les jambes repliées vers la poitrine tout en continuant à bouger régulièrement.',
        length: 'Environ 45 cm',
        comparison: 'Melon cantaloup',
        bodyChanges: ['Malgré l’espace réduit, les mouvements du bébé et les changements de forme du ventre restent habituellement perceptibles.'],
        toKnow: ['Continuer à surveiller les mouvements habituels du bébé reste pertinent jusqu’à l’accouchement.'],
      },
      en: {
        babyDescription: 'The baby, curled up for lack of space, generally keeps their legs folded toward the chest while continuing to move regularly.',
        length: 'About 45 cm',
        comparison: 'Cantaloupe melon',
        bodyChanges: ['Despite the reduced space, the baby’s movements and the changing shape of your belly usually remain noticeable.'],
        toKnow: ['Continuing to pay attention to the baby’s usual movements remains relevant right up until birth.'],
      },
      es: {
        babyDescription: 'El bebé, acurrucado por falta de espacio, generalmente mantiene las piernas replegadas hacia el pecho mientras sigue moviéndose con regularidad.',
        length: 'Aproximadamente 45 cm',
        comparison: 'Melón cantalupo',
        bodyChanges: ['A pesar del espacio reducido, los movimientos del bebé y los cambios de forma del vientre suelen seguir siendo perceptibles.'],
        toKnow: ['Seguir prestando atención a los movimientos habituales del bebé sigue siendo pertinente hasta el parto.'],
      },
      it: {
        babyDescription: 'Il bambino, raggomitolato per mancanza di spazio, tiene in genere le gambe piegate verso il petto continuando a muoversi regolarmente.',
        length: 'Circa 45 cm',
        comparison: 'Melone cantalupo',
        bodyChanges: [
          'Nonostante lo spazio ridotto, i movimenti del bambino e il cambiamento della forma della tua pancia di solito restano percepibili.',
        ],
        toKnow: [
          'Continuare a prestare attenzione ai movimenti abituali del bambino resta importante fino alla nascita.',
        ],
      },
      tr: {
        babyDescription: 'Yer darlığı nedeniyle kıvrılmış olan bebek, düzenli olarak hareket etmeye devam ederken genellikle bacaklarını göğsüne doğru katlı tutar.',
        length: 'Yaklaşık 45 cm',
        comparison: 'Kavun',
        bodyChanges: [
          'Azalan yere rağmen bebeğin hareketleri ve karnının değişen şekli genellikle fark edilir olmaya devam eder.',
        ],
        toKnow: [
          'Bebeğin olağan hareketlerine dikkat etmeye devam etmek, doğuma kadar önemini korur.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш, свернувшийся из-за нехватки места, как правило, держит ноги согнутыми к груди, продолжая регулярно двигаться.',
        length:
          'Около 45 см',
        comparison:
          'Дыня канталупа',
        bodyChanges: [
          'Несмотря на уменьшившееся пространство, движения малыша и меняющаяся форма вашего живота, как правило, остаются заметными.',
        ],
        toKnow: [
          'Следить за привычными движениями малыша по-прежнему важно вплоть до самых родов.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby liegt aus Platzmangel zusammengerollt und hält die Beine in der Regel zur Brust angezogen, bewegt sich aber weiterhin regelmäßig.',
        length:
          'Etwa 45 cm',
        comparison:
          'Cantaloupe-Melone',
        bodyChanges: [
          'Trotz des geringeren Platzes bleiben die Bewegungen des Babys und die sich verändernde Form deines Bauches in der Regel gut spürbar.',
        ],
        toKnow: [
          'Auf die gewohnten Bewegungen des Babys zu achten, bleibt bis zur Geburt wichtig.',
        ],
      },
      zh: {
        babyDescription: '由于空间有限，宝宝蜷缩着，双腿通常向胸部弯曲，同时仍会规律地活动。',
        length: '约 45 厘米',
        comparison: '哈密瓜',
        bodyChanges: [
          '尽管空间变小，宝宝的动作和你肚子形状的变化通常仍然很明显。',
        ],
        toKnow: [
          '一直到分娩，持续关注宝宝平时的胎动仍然很重要。',
        ],
      },
      id: {
        babyDescription: 'Bayi, yang meringkuk karena kurang ruang, umumnya menjaga kakinya tetap terlipat ke arah dada sambil terus bergerak secara teratur.',
        length: 'Sekitar 45 cm',
        comparison: 'Melon kantaloup',
        bodyChanges: [
          'Meski ruang makin sempit, gerakan bayi dan perubahan bentuk perutmu biasanya tetap terasa jelas.',
        ],
        toKnow: [
          'Terus memperhatikan gerakan bayi yang biasa tetap penting hingga saat persalinan.',
        ],
      },
      hi: {
        babyDescription: 'जगह की कमी के कारण सिमटा हुआ शिशु आम तौर पर अपने पैर छाती की ओर मोड़े रखता है, फिर भी नियमित रूप से हिलता-डुलता रहता है।',
        length: 'लगभग 45 सेमी',
        comparison: 'खरबूजा (कैंटालूप)',
        bodyChanges: [
          'जगह कम होने के बावजूद शिशु की हलचल और आपके पेट के बदलते आकार का एहसास आम तौर पर बना रहता है।',
        ],
        toKnow: [
          'शिशु की रोज़ की हलचल पर ध्यान देते रहना जन्म तक ज़रूरी बना रहता है।',
        ],
      },
      sq: {
        babyDescription: 'Bebi, i mbledhur kruspull për mungesë hapësire, zakonisht i mban këmbët të përkulura drejt gjoksit ndërsa vazhdon të lëvizë rregullisht.',
        length: 'Rreth 45 cm',
        comparison: 'Pjepër kantalup',
        bodyChanges: [
          'Pavarësisht hapësirës së reduktuar, lëvizjet e bebit dhe forma e barkut tënd që ndryshon zakonisht vazhdojnë të jenë të dukshme.',
        ],
        toKnow: [
          'Vëmendja ndaj lëvizjeve të zakonshme të bebit mbetet e rëndësishme deri në lindje.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんは、場所が狭くなって体を丸め、ふつう足を胸の方に折りたたんだまま、変わらず規則的に動いています。',
        length: '約45cm',
        comparison: 'カンタロープメロン',
        bodyChanges: [
          'スペースが狭くなっても、赤ちゃんの動きや、おなかの形の変化は、たいてい感じ取れます。',
        ],
        toKnow: [
          '赤ちゃんのふだんの動きに気を配り続けることは、出産直前まで大切です。',
        ],
      },
      ko: {
        babyDescription: '공간이 좁아 몸을 웅크린 아기는 보통 다리를 가슴 쪽으로 접은 채, 꾸준히 움직임을 이어가요.',
        length: '약 45cm',
        comparison: '캔탈루프 멜론',
        bodyChanges: [
          '공간이 줄어들어도 아기의 움직임과 달라지는 배의 모양은 대체로 계속 느낄 수 있어요.',
        ],
        toKnow: [
          '아기의 평소 움직임에 계속 관심을 기울이는 것은 출산 직전까지 중요해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé, enroscado por falta de espaço, mantém geralmente as pernas dobradas junto ao peito, enquanto continua a mexer-se com regularidade.',
        length: 'Cerca de 45 cm',
        comparison: 'Melão cantalupe',
        bodyChanges: [
          'Apesar do espaço reduzido, os movimentos do bebé e a forma cambiante da sua barriga continuam, normalmente, a ser bem visíveis.',
        ],
        toKnow: [
          'Continuar atenta aos movimentos habituais do bebé mantém-se pertinente até ao parto.',
        ],
      },
      bn: {
        babyDescription: 'জায়গার অভাবে গুটিসুটি হয়ে থাকা শিশু সাধারণত পা বুকের দিকে ভাঁজ করে রাখে এবং নিয়মিত নড়াচড়া করতে থাকে।',
        length: 'প্রায় 45 সেমি',
        comparison: 'খরমুজ',
        bodyChanges: [
          'জায়গা কমে গেলেও শিশুর নড়াচড়া এবং আপনার পেটের বদলে যাওয়া আকার সাধারণত বোঝা যায়।',
        ],
        toKnow: [
          'শিশুর স্বাভাবিক নড়াচড়ার দিকে নজর রাখা প্রসব পর্যন্ত গুরুত্বপূর্ণ থাকে।',
        ],
      },
    },
  },
  {
    week: 35,
    babyImage: require('../assets/images/pregnancy/development/week-35.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le bébé continue de s’arrondir, ce qui l’aidera à réguler sa température une fois né. L’espace disponible dans l’utérus devient plus limité.',
        length: 'Environ 46,2 cm',
        comparison: 'Melon miel',
        bodyChanges: ['Une pression pelvienne plus marquée peut apparaître à mesure que le bébé descend progressivement.'],
        toKnow: ['Malgré l’espace restreint, le bébé doit continuer à bouger avec une régularité similaire aux semaines précédentes.'],
      },
      en: {
        babyDescription: 'The baby keeps filling out, which will help them regulate their temperature once born. The available space in the uterus becomes more limited.',
        length: 'About 46.2 cm',
        comparison: 'Honeydew melon',
        bodyChanges: ['More pronounced pelvic pressure may appear as the baby gradually descends.'],
        toKnow: ['Despite the limited space, the baby should continue moving with a regularity similar to previous weeks.'],
      },
      es: {
        babyDescription: 'El bebé sigue ganando redondez, lo que le ayudará a regular su temperatura una vez nacido. El espacio disponible en el útero se vuelve más limitado.',
        length: 'Aproximadamente 46,2 cm',
        comparison: 'Melón dulce',
        bodyChanges: ['Puede aparecer una presión pélvica más marcada a medida que el bebé desciende progresivamente.'],
        toKnow: ['A pesar del espacio reducido, el bebé debe seguir moviéndose con una regularidad similar a la de las semanas anteriores.'],
      },
      it: {
        babyDescription: 'Il bambino continua a riempirsi, cosa che lo aiuterà a regolare la temperatura una volta nato. Lo spazio disponibile nell’utero diventa più limitato.',
        length: 'Circa 46,2 cm',
        comparison: 'Melone bianco',
        bodyChanges: [
          'Man mano che il bambino scende gradualmente, può comparire una pressione pelvica più marcata.',
        ],
        toKnow: [
          'Nonostante lo spazio limitato, il bambino dovrebbe continuare a muoversi con una regolarità simile a quella delle settimane precedenti.',
        ],
      },
      tr: {
        babyDescription: 'Bebek dolgunlaşmaya devam eder; bu, doğduktan sonra vücut ısısını düzenlemesine yardımcı olacaktır. Rahimdeki boş alan daha da kısıtlı hâle gelir.',
        length: 'Yaklaşık 46,2 cm',
        comparison: 'Bal kavunu',
        bodyChanges: [
          'Bebek yavaş yavaş aşağı indikçe daha belirgin bir leğen kemiği baskısı ortaya çıkabilir.',
        ],
        toKnow: [
          'Kısıtlı yere rağmen bebeğin önceki haftalara benzer bir düzenlilikle hareket etmeye devam etmesi gerekir.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш продолжает полнеть, что поможет ему регулировать температуру тела после рождения. Свободного места в матке становится меньше.',
        length:
          'Около 46,2 см',
        comparison:
          'Медовая дыня',
        bodyChanges: [
          'По мере того как малыш постепенно опускается, может усилиться давление в области таза.',
        ],
        toKnow: [
          'Несмотря на ограниченное пространство, малыш должен продолжать двигаться так же регулярно, как и в предыдущие недели.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby rundet sich weiter ab, was ihm nach der Geburt hilft, seine Körpertemperatur zu regulieren. Der verfügbare Platz in der Gebärmutter wird knapper.',
        length:
          'Etwa 46,2 cm',
        comparison:
          'Honigmelone',
        bodyChanges: [
          'Ein stärkerer Druck im Becken kann auftreten, wenn das Baby allmählich tiefer rutscht.',
        ],
        toKnow: [
          'Trotz des begrenzten Platzes sollte sich das Baby weiterhin ähnlich regelmäßig bewegen wie in den Wochen zuvor.',
        ],
      },
      zh: {
        babyDescription: '宝宝继续长得丰满，这将帮助他出生后调节体温。子宫内可用的空间变得更加有限。',
        length: '约 46.2 厘米',
        comparison: '蜜瓜',
        bodyChanges: [
          '随着宝宝逐渐下降，可能会出现更明显的骨盆压迫感。',
        ],
        toKnow: [
          '尽管空间有限，宝宝仍应保持与前几周相近的活动规律。',
        ],
      },
      id: {
        babyDescription: 'Bayi terus bertambah berisi, yang akan membantunya mengatur suhu tubuh setelah lahir. Ruang yang tersedia di dalam rahim makin terbatas.',
        length: 'Sekitar 46,2 cm',
        comparison: 'Melon honeydew',
        bodyChanges: [
          'Tekanan di panggul yang lebih terasa bisa muncul seiring bayi berangsur turun.',
        ],
        toKnow: [
          'Meski ruang terbatas, bayi seharusnya tetap bergerak dengan keteraturan yang mirip dengan minggu-minggu sebelumnya.',
        ],
      },
      hi: {
        babyDescription: 'शिशु का शरीर भरता जा रहा है, जिससे जन्म के बाद उसे अपना तापमान नियंत्रित करने में मदद मिलेगी। गर्भाशय में उपलब्ध जगह और कम हो जाती है।',
        length: 'लगभग 46.2 सेमी',
        comparison: 'हनीड्यू खरबूजा',
        bodyChanges: [
          'जैसे-जैसे शिशु धीरे-धीरे नीचे की ओर आता है, पेल्विस पर दबाव ज़्यादा महसूस हो सकता है।',
        ],
        toKnow: [
          'सीमित जगह के बावजूद शिशु की हलचल पिछले सप्ताहों जैसी ही नियमितता से जारी रहनी चाहिए।',
        ],
      },
      sq: {
        babyDescription: 'Bebi vazhdon të plotësohet, gjë që do ta ndihmojë të rregullojë temperaturën pasi të lindë. Hapësira e disponueshme në mitër bëhet më e kufizuar.',
        length: 'Rreth 46.2 cm',
        comparison: 'Pjepër mjalti',
        bodyChanges: [
          'Presioni më i theksuar në legen mund të shfaqet ndërsa bebi zbret gradualisht.',
        ],
        toKnow: [
          'Pavarësisht hapësirës së kufizuar, bebi duhet të vazhdojë të lëvizë me një rregullsi të ngjashme me javët e mëparshme.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんはふっくらとしてきて、生まれてからの体温調節に役立ちます。子宮の中のスペースは、さらに限られてきます。',
        length: '約46.2cm',
        comparison: 'ハニーデューメロン',
        bodyChanges: [
          '赤ちゃんが少しずつ下がってくるにつれて、骨盤への圧迫感がより強くなることがあります。',
        ],
        toKnow: [
          'スペースが限られていても、赤ちゃんはこれまでの週と同じくらいの規則性で動き続けるはずです。',
        ],
      },
      ko: {
        babyDescription: '아기는 계속 통통해지고 있어요. 이는 태어난 뒤 체온을 조절하는 데 도움이 돼요. 자궁 안에 남은 공간은 점점 더 좁아져요.',
        length: '약 46.2cm',
        comparison: '허니듀 멜론',
        bodyChanges: [
          '아기가 서서히 아래로 내려오면서 골반 압박감이 더 뚜렷해질 수 있어요.',
        ],
        toKnow: [
          '공간이 좁아도 아기는 이전 몇 주와 비슷한 규칙성으로 계속 움직여야 해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé continua a ganhar volume, o que o ajudará a regular a temperatura depois de nascer. O espaço disponível no útero torna-se mais limitado.',
        length: 'Cerca de 46,2 cm',
        comparison: 'Melão-branco',
        bodyChanges: [
          'Pode surgir uma pressão pélvica mais pronunciada à medida que o bebé vai descendo.',
        ],
        toKnow: [
          'Apesar do espaço limitado, o bebé deve continuar a mexer-se com uma regularidade semelhante à das semanas anteriores.',
        ],
      },
      bn: {
        babyDescription: 'শিশুর শরীর ভরাট হতে থাকে, যা জন্মের পর তার তাপমাত্রা নিয়ন্ত্রণে সাহায্য করবে। জরায়ুতে থাকা জায়গা আরও সীমিত হয়ে আসে।',
        length: 'প্রায় 46.2 সেমি',
        comparison: 'হানিডিউ তরমুজ',
        bodyChanges: [
          'শিশু ধীরে ধীরে নিচের দিকে নেমে এলে শ্রোণিতে চাপ আরও স্পষ্টভাবে অনুভূত হতে পারে।',
        ],
        toKnow: [
          'জায়গা সীমিত হলেও শিশু আগের সপ্তাহগুলোর মতোই নিয়মিতভাবে নড়াচড়া করতে থাকার কথা।',
        ],
      },
    },
  },
  {
    week: 36,
    babyImage: require('../assets/images/pregnancy/development/week-36.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Les poumons ont généralement suffisamment mûri pour permettre une respiration autonome, et le bébé est capable de téter et de digérer.',
        length: 'Environ 47,4 cm',
        comparison: 'Laitue romaine',
        bodyChanges: ['Une respiration parfois plus courte peut être ressentie, l’utérus prenant beaucoup de place sous les côtes.'],
        toKnow: ['La grossesse est considérée à terme entre la semaine 37 et la semaine 42.'],
      },
      en: {
        babyDescription:
          'The lungs have generally matured enough to allow independent breathing, and the baby is able to suck and digest.',
        length: 'About 47.4 cm',
        comparison: 'Romaine lettuce',
        bodyChanges: ['You may sometimes feel shorter of breath, as the uterus takes up a lot of space under the ribs.'],
        toKnow: ['Pregnancy is considered full term between week 37 and week 42.'],
      },
      es: {
        babyDescription:
          'Los pulmones generalmente han madurado lo suficiente para permitir una respiración autónoma, y el bebé es capaz de succionar y digerir.',
        length: 'Aproximadamente 47,4 cm',
        comparison: 'Lechuga romana',
        bodyChanges: ['A veces puedes sentir una respiración más corta, ya que el útero ocupa mucho espacio bajo las costillas.'],
        toKnow: ['El embarazo se considera a término entre la semana 37 y la semana 42.'],
      },
      it: {
        babyDescription: 'I polmoni sono in genere abbastanza maturi da permettere la respirazione autonoma e il bambino è in grado di succhiare e digerire.',
        length: 'Circa 47,4 cm',
        comparison: 'Lattuga romana',
        bodyChanges: [
          'A volte puoi sentirti più affannata, perché l’utero occupa molto spazio sotto le costole.',
        ],
        toKnow: [
          'La gravidanza è considerata a termine tra la settimana 37 e la settimana 42.',
        ],
      },
      tr: {
        babyDescription: 'Akciğerler genellikle bağımsız nefes almaya izin verecek kadar olgunlaşmıştır ve bebek emebilir ve sindirebilir.',
        length: 'Yaklaşık 47,4 cm',
        comparison: 'Marul',
        bodyChanges: [
          'Rahim kaburgaların altında çok yer kapladığı için zaman zaman nefesin daha kısa kaldığını hissedebilirsin.',
        ],
        toKnow: [
          'Gebelik, 37. ile 42. haftalar arasında term (tam gün) olarak kabul edilir.',
        ],
      },
      ru: {
        babyDescription:
          'Лёгкие, как правило, уже достаточно зрелые для самостоятельного дыхания, а малыш способен сосать и переваривать пищу.',
        length:
          'Около 47,4 см',
        comparison:
          'Салат ромэн',
        bodyChanges: [
          'Иногда вам может не хватать воздуха, так как матка занимает много места под рёбрами.',
        ],
        toKnow: [
          'Беременность считается доношенной в период с 37-й по 42-ю неделю.',
        ],
      },
      de: {
        babyDescription:
          'Die Lunge ist in der Regel so weit ausgereift, dass das Baby selbstständig atmen kann, und es ist in der Lage zu saugen und zu verdauen.',
        length:
          'Etwa 47,4 cm',
        comparison:
          'Romanasalat',
        bodyChanges: [
          'Du kannst dich manchmal kurzatmiger fühlen, weil die Gebärmutter viel Platz unter den Rippen einnimmt.',
        ],
        toKnow: [
          'Eine Schwangerschaft gilt zwischen der 37. und der 42. SSW als termingerecht.',
        ],
      },
      zh: {
        babyDescription: '肺部通常已经成熟到可以独立呼吸，宝宝也能够吮吸和消化。',
        length: '约 47.4 厘米',
        comparison: '罗马生菜',
        bodyChanges: [
          '子宫在肋骨下占据了很大空间，你有时可能会觉得更气短。',
        ],
        toKnow: [
          '孕 37 周到孕 42 周之间被认为是足月妊娠。',
        ],
      },
      id: {
        babyDescription: 'Paru-paru umumnya sudah cukup matang untuk memungkinkan pernapasan mandiri, dan bayi mampu mengisap serta mencerna.',
        length: 'Sekitar 47,4 cm',
        comparison: 'Selada romaine',
        bodyChanges: [
          'Kamu mungkin sesekali merasa lebih sesak napas, karena rahim memakan banyak ruang di bawah tulang rusuk.',
        ],
        toKnow: [
          'Kehamilan dianggap cukup bulan antara minggu ke-37 dan minggu ke-42.',
        ],
      },
      hi: {
        babyDescription: 'फेफड़े आम तौर पर इतने परिपक्व हो चुके होते हैं कि शिशु अपने आप साँस ले सके, और वह दूध चूसने और पचाने में सक्षम होता है।',
        length: 'लगभग 47.4 सेमी',
        comparison: 'रोमेन लेट्यूस',
        bodyChanges: [
          'कभी-कभी साँस फूलने जैसा लग सकता है, क्योंकि गर्भाशय पसलियों के नीचे काफ़ी जगह घेर लेता है।',
        ],
        toKnow: [
          'गर्भावस्था को 37वें से 42वें सप्ताह के बीच पूर्ण अवधि (फ़ुल टर्म) माना जाता है।',
        ],
      },
      sq: {
        babyDescription: 'Mushkëritë zakonisht kanë arritur një pjekuri të mjaftueshme për të lejuar frymëmarrjen e pavarur, dhe bebi është i aftë të thithë dhe të tretë.',
        length: 'Rreth 47.4 cm',
        comparison: 'Marule romaine',
        bodyChanges: [
          'Nganjëherë mund të të merret fryma më shpejt, pasi mitra zë shumë vend nën brinjë.',
        ],
        toKnow: [
          'Shtatzënia konsiderohet në afat të plotë ndërmjet javës 37 dhe javës 42.',
        ],
      },
      ja: {
        babyDescription: '肺は、自力で呼吸できる程度までにはおおむね成熟していて、赤ちゃんは吸ったり消化したりすることもできます。',
        length: '約47.4cm',
        comparison: 'ロメインレタス',
        bodyChanges: [
          '子宮が肋骨の下で大きな場所を占めるため、ときどき息苦しく感じることがあります。',
        ],
        toKnow: [
          '妊娠37週から42週のあいだは、正期産とされます。',
        ],
      },
      ko: {
        babyDescription: '폐는 대체로 스스로 숨 쉴 수 있을 만큼 성숙했고, 아기는 젖을 빨고 소화할 수 있어요.',
        length: '약 47.4cm',
        comparison: '로메인 상추',
        bodyChanges: [
          '자궁이 갈비뼈 아래 공간을 많이 차지해서 가끔 숨이 더 차게 느껴질 수 있어요.',
        ],
        toKnow: [
          '임신 37주부터 42주 사이를 만삭으로 봐요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'Os pulmões estão geralmente maduros o suficiente para permitir a respiração autónoma, e o bebé é capaz de sugar e digerir.',
        length: 'Cerca de 47,4 cm',
        comparison: 'Alface romana',
        bodyChanges: [
          'Pode, por vezes, sentir falta de ar com mais facilidade, uma vez que o útero ocupa muito espaço sob as costelas.',
        ],
        toKnow: [
          'A gravidez é considerada de termo entre a semana 37 e a semana 42.',
        ],
      },
      bn: {
        babyDescription: 'ফুসফুস সাধারণত স্বাধীনভাবে শ্বাস নেওয়ার মতো যথেষ্ট পরিণত হয়ে যায় এবং শিশু চুষতে ও হজম করতে সক্ষম হয়।',
        length: 'প্রায় 47.4 সেমি',
        comparison: 'রোমেইন লেটুস',
        bodyChanges: [
          'জরায়ু পাঁজরের নিচে অনেকটা জায়গা নেওয়ায় কখনো কখনো আপনার শ্বাসকষ্টের মতো মনে হতে পারে।',
        ],
        toKnow: [
          'গর্ভাবস্থা 37তম থেকে 42তম সপ্তাহের মধ্যে পূর্ণ মেয়াদের বলে গণ্য করা হয়।',
        ],
      },
    },
  },
  {
    week: 37,
    babyImage: require('../assets/images/pregnancy/development/week-37.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le bébé est considéré comme suffisamment mature pour naître. La grande majorité des bébés se positionnent désormais tête en bas.',
        length: 'Environ 48,6 cm',
        comparison: 'Poireau',
        bodyChanges: ['Une sensation de pression pelvienne croissante est fréquente à mesure que le bébé s’engage dans le bassin.'],
        toKnow: ['À partir de cette semaine, le terme est considéré comme atteint et la naissance peut survenir à tout moment.'],
      },
      en: {
        babyDescription: 'The baby is considered mature enough to be born. The large majority of babies are now positioned head-down.',
        length: 'About 48.6 cm',
        comparison: 'Leek',
        bodyChanges: ['A feeling of growing pelvic pressure is common as the baby engages in the pelvis.'],
        toKnow: ['From this week on, term is considered reached and birth can happen at any time.'],
      },
      es: {
        babyDescription: 'El bebé se considera suficientemente maduro para nacer. La gran mayoría de los bebés ya se colocan con la cabeza hacia abajo.',
        length: 'Aproximadamente 48,6 cm',
        comparison: 'Puerro',
        bodyChanges: ['Es frecuente sentir una presión pélvica creciente a medida que el bebé se encaja en la pelvis.'],
        toKnow: ['A partir de esta semana, se considera alcanzado el término y el nacimiento puede producirse en cualquier momento.'],
      },
      it: {
        babyDescription: 'Il bambino è considerato abbastanza maturo per nascere. La grande maggioranza dei bambini ora è posizionata a testa in giù.',
        length: 'Circa 48,6 cm',
        comparison: 'Porro',
        bodyChanges: [
          'Una sensazione di pressione pelvica crescente è frequente, man mano che il bambino si impegna nel bacino.',
        ],
        toKnow: [
          'Da questa settimana il termine è considerato raggiunto e il parto può avvenire in qualsiasi momento.',
        ],
      },
      tr: {
        babyDescription: 'Bebek doğmak için yeterince olgun kabul edilir. Bebeklerin büyük çoğunluğu artık başı aşağıda konumdadır.',
        length: 'Yaklaşık 48,6 cm',
        comparison: 'Pırasa',
        bodyChanges: [
          'Bebek leğen kemiğine oturdukça artan bir leğen kemiği baskısı hissi yaygındır.',
        ],
        toKnow: [
          'Bu haftadan itibaren term olarak kabul edilir ve doğum her an gerçekleşebilir.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш считается достаточно зрелым для рождения. Подавляющее большинство малышей теперь расположены головой вниз.',
        length:
          'Около 48,6 см',
        comparison:
          'Лук-порей',
        bodyChanges: [
          'Ощущение нарастающего давления в тазу распространено, когда малыш опускается в таз.',
        ],
        toKnow: [
          'Начиная с этой недели срок считается доношенным, и роды могут начаться в любой момент.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby gilt als reif genug, um geboren zu werden. Der Großteil der Babys liegt jetzt mit dem Kopf nach unten.',
        length:
          'Etwa 48,6 cm',
        comparison:
          'Lauch',
        bodyChanges: [
          'Ein zunehmendes Druckgefühl im Becken ist häufig, wenn das Baby ins Becken eintritt.',
        ],
        toKnow: [
          'Ab dieser Woche gilt der Termin als erreicht, und die Geburt kann jederzeit beginnen.',
        ],
      },
      zh: {
        babyDescription: '宝宝已被认为成熟到可以出生。绝大多数宝宝现在都是头朝下的姿势。',
        length: '约 48.6 厘米',
        comparison: '韭葱',
        bodyChanges: [
          '随着宝宝入盆，骨盆压迫感逐渐增强是常见的。',
        ],
        toKnow: [
          '从这一周起，就被认为已经足月，随时都可能分娩。',
        ],
      },
      id: {
        babyDescription: 'Bayi dianggap sudah cukup matang untuk dilahirkan. Sebagian besar bayi kini berada dalam posisi kepala di bawah.',
        length: 'Sekitar 48,6 cm',
        comparison: 'Daun bawang besar',
        bodyChanges: [
          'Rasa tekanan di panggul yang makin besar umum terjadi saat bayi masuk ke dalam panggul.',
        ],
        toKnow: [
          'Mulai minggu ini, usia kehamilan dianggap sudah cukup bulan dan persalinan bisa terjadi kapan saja.',
        ],
      },
      hi: {
        babyDescription: 'शिशु को जन्म लेने के लिए पर्याप्त परिपक्व माना जाता है। अब ज़्यादातर शिशु सिर नीचे की स्थिति में होते हैं।',
        length: 'लगभग 48.6 सेमी',
        comparison: 'लीक (गंदना)',
        bodyChanges: [
          'शिशु के पेल्विस में उतरने (एंगेज होने) के साथ पेल्विस पर बढ़ते दबाव का एहसास आम है।',
        ],
        toKnow: [
          'इस सप्ताह से पूर्ण अवधि मानी जाती है और प्रसव कभी भी हो सकता है।',
        ],
      },
      sq: {
        babyDescription: 'Bebi konsiderohet i pjekur sa duhet për t\'u lindur. Shumica dërrmuese e bebeve janë tani të pozicionuara me kokën poshtë.',
        length: 'Rreth 48.6 cm',
        comparison: 'Presh',
        bodyChanges: [
          'Ndjenja e presionit në rritje në legen është e zakonshme ndërsa bebi zhytet në legen.',
        ],
        toKnow: [
          'Nga kjo javë e tutje, afati konsiderohet i arritur dhe lindja mund të ndodhë në çdo kohë.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんは、生まれても大丈夫なほど成熟したと考えられています。大多数の赤ちゃんは、すでに頭を下に向けた位置にいます。',
        length: '約48.6cm',
        comparison: 'リーキ（西洋ネギ）',
        bodyChanges: [
          '赤ちゃんが骨盤に入り込むにつれて、骨盤への圧迫感が増していくのはよくあることです。',
        ],
        toKnow: [
          'この週からは正期産に入ったとされ、いつ出産が始まってもおかしくありません。',
        ],
      },
      ko: {
        babyDescription: '아기는 태어날 수 있을 만큼 충분히 성숙했다고 봐요. 이제 대부분의 아기는 머리가 아래를 향해 있어요.',
        length: '약 48.6cm',
        comparison: '대파',
        bodyChanges: [
          '아기가 골반 안으로 내려오면서 골반 압박감이 점점 커지는 경우가 흔해요.',
        ],
        toKnow: [
          '이번 주부터는 만삭에 이른 것으로 보며, 출산은 언제든 일어날 수 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé é considerado suficientemente maduro para nascer. A grande maioria dos bebés está agora posicionada de cabeça para baixo.',
        length: 'Cerca de 48,6 cm',
        comparison: 'Alho-francês',
        bodyChanges: [
          'É comum sentir uma pressão pélvica crescente à medida que o bebé encaixa na bacia.',
        ],
        toKnow: [
          'A partir desta semana, considera-se que o termo foi atingido e o parto pode acontecer a qualquer momento.',
        ],
      },
      bn: {
        babyDescription: 'শিশু জন্মের জন্য যথেষ্ট পরিণত বলে গণ্য করা হয়। বেশিরভাগ শিশু এখন মাথা নিচের দিকে করে অবস্থান করছে।',
        length: 'প্রায় 48.6 সেমি',
        comparison: 'লিক',
        bodyChanges: [
          'শিশু শ্রোণিতে নেমে এলে শ্রোণিতে ক্রমবর্ধমান চাপের অনুভূতি স্বাভাবিক।',
        ],
        toKnow: [
          'এই সপ্তাহ থেকে পূর্ণ মেয়াদ পূর্ণ হয়েছে বলে ধরা হয় এবং প্রসব যেকোনো সময় হতে পারে।',
        ],
      },
    },
  },
  {
    week: 38,
    babyImage: require('../assets/images/pregnancy/development/week-38.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription: 'Le duvet fin qui recouvrait la peau a en grande partie disparu, et les intestins accumulent le méconium, les premières selles du nouveau-né.',
        length: 'Environ 49,8 cm',
        comparison: 'Tige de rhubarbe',
        bodyChanges: ['Se familiariser avec les signes annonçant le travail peut être utile à l’approche de la naissance.'],
        toKnow: ['Un accouchement programmé, lorsqu’il est envisagé sans indication médicale, n’est généralement pas recommandé avant la 39e semaine.'],
      },
      en: {
        babyDescription: 'The fine down that covered the skin has largely disappeared, and the intestines are accumulating meconium, the newborn’s first stool.',
        length: 'About 49.8 cm',
        comparison: 'Rhubarb stalk',
        bodyChanges: ['Getting familiar with the signs of labor can be useful as birth approaches.'],
        toKnow: ['A scheduled birth, when considered without a medical indication, is generally not recommended before week 39.'],
      },
      es: {
        babyDescription:
          'El vello fino que cubría la piel ha desaparecido en su mayor parte, y los intestinos acumulan meconio, las primeras heces del recién nacido.',
        length: 'Aproximadamente 49,8 cm',
        comparison: 'Tallo de ruibarbo',
        bodyChanges: ['Familiarizarte con los signos que anuncian el trabajo de parto puede ser útil a medida que se acerca el nacimiento.'],
        toKnow: ['Un parto programado, cuando se plantea sin indicación médica, generalmente no se recomienda antes de la semana 39.'],
      },
      it: {
        babyDescription: 'La lanugine sottile che ricopriva la pelle è in gran parte scomparsa e nell’intestino si accumula il meconio, le prime feci del neonato.',
        length: 'Circa 49,8 cm',
        comparison: 'Gambo di rabarbaro',
        bodyChanges: [
          'Familiarizzare con i segni del travaglio può essere utile man mano che la nascita si avvicina.',
        ],
        toKnow: [
          'Un parto programmato, quando non c’è un’indicazione medica, in genere non è consigliato prima della settimana 39.',
        ],
      },
      tr: {
        babyDescription: 'Cildi kaplayan ince tüyler büyük ölçüde kaybolmuştur ve bağırsaklarda yenidoğanın ilk dışkısı olan mekonyum birikmektedir.',
        length: 'Yaklaşık 49,8 cm',
        comparison: 'Işkın sapı',
        bodyChanges: [
          'Doğum yaklaşırken doğum eyleminin belirtilerini tanımak yararlı olabilir.',
        ],
        toKnow: [
          'Tıbbi bir endikasyon olmadan düşünülen planlı bir doğum, genellikle 39. haftadan önce önerilmez.',
        ],
      },
      ru: {
        babyDescription:
          'Тонкий пушок, покрывавший кожу, в основном исчез, а в кишечнике накапливается меконий — первый стул новорождённого.',
        length:
          'Около 49,8 см',
        comparison:
          'Стебель ревеня',
        bodyChanges: [
          'Познакомиться с признаками родов может быть полезно по мере приближения родов.',
        ],
        toKnow: [
          'Плановые роды без медицинских показаний, как правило, не рекомендуются до 39-й недели.',
        ],
      },
      de: {
        babyDescription:
          'Der feine Flaum, der die Haut bedeckte, ist größtenteils verschwunden, und im Darm sammelt sich Mekonium, der erste Stuhl des Neugeborenen.',
        length:
          'Etwa 49,8 cm',
        comparison:
          'Rhabarberstange',
        bodyChanges: [
          'Wenn die Geburt näher rückt, kann es hilfreich sein, sich mit den Anzeichen der Wehen vertraut zu machen.',
        ],
        toKnow: [
          'Eine geplante Geburt ohne medizinische Indikation wird in der Regel nicht vor der 39. SSW empfohlen.',
        ],
      },
      zh: {
        babyDescription: '原本覆盖在皮肤上的细小绒毛已基本消失，肠道里正在积累胎便，也就是新生儿的第一次大便。',
        length: '约 49.8 厘米',
        comparison: '大黄茎',
        bodyChanges: [
          '随着分娩临近，了解临产的征兆会很有帮助。',
        ],
        toKnow: [
          '没有医学指征的计划性分娩，通常不建议安排在孕 39 周之前。',
        ],
      },
      id: {
        babyDescription: 'Bulu halus yang menutupi kulit sebagian besar sudah hilang, dan usus mengumpulkan mekonium, tinja pertama bayi baru lahir.',
        length: 'Sekitar 49,8 cm',
        comparison: 'Batang rhubarb',
        bodyChanges: [
          'Mengenali tanda-tanda persalinan bisa berguna seiring mendekatnya hari kelahiran.',
        ],
        toKnow: [
          'Persalinan terjadwal tanpa indikasi medis umumnya tidak dianjurkan sebelum minggu ke-39.',
        ],
      },
      hi: {
        babyDescription: 'त्वचा को ढकने वाले बारीक रोएँ अब ज़्यादातर ग़ायब हो चुके हैं, और आँतों में मेकोनियम इकट्ठा हो रहा है, जो नवजात का पहला मल होता है।',
        length: 'लगभग 49.8 सेमी',
        comparison: 'रूबार्ब का डंठल',
        bodyChanges: [
          'प्रसव का समय पास आने पर प्रसव के संकेतों से परिचित होना उपयोगी हो सकता है।',
        ],
        toKnow: [
          'बिना किसी चिकित्सकीय कारण के पहले से तय की गई डिलीवरी आम तौर पर 39वें सप्ताह से पहले करने की सलाह नहीं दी जाती।',
        ],
      },
      sq: {
        babyDescription: 'Push-i i hollë që mbulonte lëkurën është zhdukur në masë të madhe, dhe zorrët po grumbullojnë mekonium, jashtëqitjen e parë të të porsalindurit.',
        length: 'Rreth 49.8 cm',
        comparison: 'Kërcell rebarbere',
        bodyChanges: [
          'Njohja me shenjat e lindjes mund të jetë e dobishme ndërsa lindja po afrohet.',
        ],
        toKnow: [
          'Një lindje e planifikuar, kur shqyrtohet pa tregues mjekësor, zakonisht nuk rekomandohet para javës 39.',
        ],
      },
      ja: {
        babyDescription: '皮膚を覆っていた細かい産毛はほとんどなくなり、腸には新生児の最初の便である胎便がたまってきています。',
        length: '約49.8cm',
        comparison: 'ルバーブの茎',
        bodyChanges: [
          '出産が近づくにつれて、陣痛のサインについて知っておくと役に立ちます。',
        ],
        toKnow: [
          '医学的な理由がない予定出産は、一般に39週より前にはすすめられません。',
        ],
      },
      ko: {
        babyDescription: '피부를 덮고 있던 가는 솜털은 대부분 사라졌고, 장에는 신생아의 첫 대변인 태변이 쌓이고 있어요.',
        length: '약 49.8cm',
        comparison: '루바브 줄기',
        bodyChanges: [
          '출산이 가까워질수록 진통의 신호를 미리 알아 두면 도움이 될 수 있어요.',
        ],
        toKnow: [
          '의학적인 이유가 없는 예정 출산은 일반적으로 39주 이전에는 권장하지 않아요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A penugem fina que cobria a pele desapareceu em grande parte, e os intestinos estão a acumular mecónio, as primeiras fezes do recém-nascido.',
        length: 'Cerca de 49,8 cm',
        comparison: 'Talo de ruibarbo',
        bodyChanges: [
          'Familiarizar-se com os sinais do trabalho de parto pode ser útil à medida que o parto se aproxima.',
        ],
        toKnow: [
          'Um parto programado, quando considerado sem indicação médica, geralmente não é recomendado antes da semana 39.',
        ],
      },
      bn: {
        babyDescription: 'ত্বক ঢেকে রাখা সূক্ষ্ম লোম অনেকটাই মিলিয়ে গেছে এবং অন্ত্রে মেকোনিয়াম জমছে, যা নবজাতকের প্রথম মল।',
        length: 'প্রায় 49.8 সেমি',
        comparison: 'একটি মাঝারি লাউ',
        bodyChanges: [
          'প্রসব ঘনিয়ে এলে প্রসববেদনার লক্ষণগুলো সম্পর্কে পরিচিত হয়ে থাকা কাজে লাগতে পারে।',
        ],
        toKnow: [
          'চিকিৎসাগত কারণ ছাড়া নির্ধারিত দিনে প্রসব করানো সাধারণত 39তম সপ্তাহের আগে সুপারিশ করা হয় না।',
        ],
      },
    },
  },
  {
    week: 39,
    babyImage: require('../assets/images/pregnancy/development/week-39.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'La peau, auparavant plus fine, s’est épaissie et protège désormais mieux le bébé. Un enduit protecteur, le vernix, facilite aussi son passage lors de la naissance.',
        length: 'Environ 50,7 cm',
        comparison: 'Pastèque',
        bodyChanges: ['L’impatience et une certaine fatigue sont fréquentes à l’approche de la date prévue.'],
        toKnow: ['La circulation sanguine du nouveau-né continue de s’ajuster juste après la naissance, ce qui peut donner temporairement des mains ou des pieds légèrement bleutés.'],
      },
      en: {
        babyDescription:
          'The skin, previously thinner, has thickened and now protects the baby better. A protective coating, the vernix, also eases their passage during birth.',
        length: 'About 50.7 cm',
        comparison: 'Watermelon',
        bodyChanges: ['Impatience and a certain amount of fatigue are common as the due date approaches.'],
        toKnow: ['The newborn’s blood circulation continues adjusting just after birth, which can temporarily give the hands or feet a slightly bluish tinge.'],
      },
      es: {
        babyDescription:
          'La piel, antes más fina, se ha engrosado y ahora protege mejor al bebé. Una capa protectora, el vérnix, también facilita su paso durante el nacimiento.',
        length: 'Aproximadamente 50,7 cm',
        comparison: 'Sandía',
        bodyChanges: ['La impaciencia y un cierto cansancio son frecuentes a medida que se acerca la fecha prevista.'],
        toKnow: ['La circulación sanguínea del recién nacido continúa ajustándose justo después del nacimiento, lo que puede dar temporalmente un tono ligeramente azulado a las manos o los pies.'],
      },
      it: {
        babyDescription: 'La pelle, prima più sottile, si è ispessita e ora protegge meglio il bambino. Un rivestimento protettivo, la vernice caseosa, ne facilita inoltre il passaggio durante il parto.',
        length: 'Circa 50,7 cm',
        comparison: 'Anguria',
        bodyChanges: [
          'Impazienza e una certa stanchezza sono frequenti con l’avvicinarsi della data presunta del parto.',
        ],
        toKnow: [
          'La circolazione sanguigna del neonato continua ad adattarsi subito dopo la nascita, e questo può dare temporaneamente a mani o piedi una leggera sfumatura bluastra.',
        ],
      },
      tr: {
        babyDescription: 'Daha önce daha ince olan cilt kalınlaşmıştır ve artık bebeği daha iyi korur. Vernix adı verilen koruyucu bir tabaka da doğum sırasında geçişini kolaylaştırır.',
        length: 'Yaklaşık 50,7 cm',
        comparison: 'Karpuz',
        bodyChanges: [
          'Tahmini doğum tarihi yaklaştıkça sabırsızlık ve bir miktar yorgunluk yaygındır.',
        ],
        toKnow: [
          'Yenidoğanın kan dolaşımı doğumdan hemen sonra uyum sağlamaya devam eder; bu, ellere ya da ayaklara geçici olarak hafif morumsu bir renk verebilir.',
        ],
      },
      ru: {
        babyDescription:
          'Кожа, прежде более тонкая, стала плотнее и лучше защищает малыша. Защитная оболочка — первородная смазка — также облегчает его прохождение при родах.',
        length:
          'Около 50,7 см',
        comparison:
          'Арбуз',
        bodyChanges: [
          'Нетерпение и некоторая усталость обычны по мере приближения предполагаемой даты родов.',
        ],
        toKnow: [
          'Кровообращение новорождённого продолжает перестраиваться сразу после рождения, из-за чего руки или ноги могут временно иметь слегка синеватый оттенок.',
        ],
      },
      de: {
        babyDescription:
          'Die zuvor dünnere Haut ist dicker geworden und schützt das Baby jetzt besser. Eine Schutzschicht, die Käseschmiere (Vernix), erleichtert ihm außerdem den Weg durch den Geburtskanal.',
        length:
          'Etwa 50,7 cm',
        comparison:
          'Wassermelone',
        bodyChanges: [
          'Ungeduld und eine gewisse Müdigkeit sind häufig, wenn der Entbindungstermin näher rückt.',
        ],
        toKnow: [
          'Der Blutkreislauf des Neugeborenen stellt sich direkt nach der Geburt weiter um, was Händen oder Füßen vorübergehend einen leicht bläulichen Schimmer geben kann.',
        ],
      },
      zh: {
        babyDescription: '之前较薄的皮肤已经变厚，现在能更好地保护宝宝。一层叫作胎脂的保护层，也会让分娩时更容易通过产道。',
        length: '约 50.7 厘米',
        comparison: '西瓜',
        bodyChanges: [
          '随着预产期临近，感到焦急和有些疲倦是常见的。',
        ],
        toKnow: [
          '新生儿的血液循环在出生后仍在调整，这可能会让手或脚暂时带点淡淡的青紫色。',
        ],
      },
      id: {
        babyDescription: 'Kulit yang sebelumnya lebih tipis kini sudah menebal dan melindungi bayi dengan lebih baik. Lapisan pelindung yang disebut vernix juga memudahkan bayi saat melewati jalan lahir.',
        length: 'Sekitar 50,7 cm',
        comparison: 'Semangka',
        bodyChanges: [
          'Rasa tidak sabar dan kelelahan tertentu umum terjadi menjelang hari perkiraan lahir.',
        ],
        toKnow: [
          'Sirkulasi darah bayi baru lahir terus menyesuaikan diri tepat setelah lahir, yang dapat membuat tangan atau kakinya sementara tampak sedikit kebiruan.',
        ],
      },
      hi: {
        babyDescription: 'पहले पतली रही त्वचा अब मोटी हो गई है और शिशु की बेहतर सुरक्षा करती है। वर्निक्स नाम की एक सुरक्षात्मक परत जन्म के समय उसके बाहर आने को भी आसान बनाती है।',
        length: 'लगभग 50.7 सेमी',
        comparison: 'तरबूज़',
        bodyChanges: [
          'डिलीवरी की तारीख़ पास आने पर बेचैनी और कुछ थकान होना आम है।',
        ],
        toKnow: [
          'जन्म के ठीक बाद नवजात का रक्त संचार अपने आप को ढालता रहता है, जिससे हाथ या पैर अस्थायी रूप से हल्के नीले दिख सकते हैं।',
        ],
      },
      sq: {
        babyDescription: 'Lëkura, më parë më e hollë, është trashur dhe tani e mbron më mirë bebin. Një shtresë mbrojtëse, vernix-i, e lehtëson edhe kalimin e tij gjatë lindjes.',
        length: 'Rreth 50.7 cm',
        comparison: 'Shalqi',
        bodyChanges: [
          'Padurimi dhe një farë lodhjeje janë të zakonshme ndërsa afrohet data e pritshme e lindjes.',
        ],
        toKnow: [
          'Qarkullimi i gjakut i të porsalindurit vazhdon të përshtatet menjëherë pas lindjes, gjë që përkohësisht mund t\'u japë duarve ose këmbëve një nuancë paksa të kaltërosh.',
        ],
      },
      ja: {
        babyDescription: '以前は薄かった皮膚が厚くなり、赤ちゃんをよりよく守るようになっています。胎脂と呼ばれる保護膜は、出産のときに赤ちゃんが産道を通りやすくする働きもします。',
        length: '約50.7cm',
        comparison: 'スイカ',
        bodyChanges: [
          '出産予定日が近づくと、待ちきれない気持ちや、ある程度の疲れを感じるのはよくあることです。',
        ],
        toKnow: [
          '生まれた直後は新生児の血液循環がまだ調整されている途中で、手足が一時的にうっすら青みがかって見えることがあります。',
        ],
      },
      ko: {
        babyDescription: '전에는 더 얇았던 피부가 두꺼워져서 이제 아기를 더 잘 보호해 줘요. 태지라는 보호막은 출산할 때 아기가 더 쉽게 나오도록 도와주기도 해요.',
        length: '약 50.7cm',
        comparison: '수박',
        bodyChanges: [
          '출산 예정일이 다가오면 초조함과 어느 정도의 피로를 느끼는 경우가 흔해요.',
        ],
        toKnow: [
          '신생아의 혈액 순환은 태어난 직후에도 계속 적응하는 중이라서, 일시적으로 손이나 발이 약간 푸르스름해 보일 수 있어요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'A pele, antes mais fina, engrossou e protege agora melhor o bebé. Um revestimento protetor, o vérnix, facilita também a sua passagem durante o parto.',
        length: 'Cerca de 50,7 cm',
        comparison: 'Melancia',
        bodyChanges: [
          'A impaciência e algum cansaço são comuns à medida que a data prevista do parto se aproxima.',
        ],
        toKnow: [
          'A circulação sanguínea do recém-nascido continua a ajustar-se logo após o nascimento, o que pode dar temporariamente às mãos ou aos pés uma ligeira tonalidade azulada.',
        ],
      },
      bn: {
        babyDescription: 'আগে যে ত্বক পাতলা ছিল তা এখন পুরু হয়েছে এবং শিশুকে আরও ভালোভাবে সুরক্ষা দেয়। ভার্নিক্স নামের একটি সুরক্ষা স্তর জন্মের সময় তার বেরিয়ে আসাও সহজ করে।',
        length: 'প্রায় 50.7 সেমি',
        comparison: 'তরমুজ',
        bodyChanges: [
          'প্রসবের সম্ভাব্য তারিখ ঘনিয়ে এলে অধৈর্য লাগা এবং কিছুটা ক্লান্তি অনুভব করা স্বাভাবিক।',
        ],
        toKnow: [
          'জন্মের ঠিক পরে নবজাতকের রক্তসঞ্চালন নিজেকে মানিয়ে নিতে থাকে, যার ফলে হাত বা পায়ে সাময়িকভাবে হালকা নীলচে আভা দেখা যেতে পারে।',
        ],
      },
    },
  },
  {
    week: 40,
    babyImage: require('../assets/images/pregnancy/development/week-40.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé est pleinement développé et prêt à naître. La date prévue d’accouchement est une estimation : beaucoup de naissances ont lieu dans les jours qui l’entourent, avant ou après.',
        length: 'Environ 51,2 cm',
        comparison: 'Citrouille',
        bodyChanges: ['L’attente de signes de travail (contractions régulières, perte des eaux) est fréquente durant cette période.'],
        toKnow: ['Dépasser légèrement la date prévue reste courant et ne signifie pas nécessairement qu’il y a un problème ; un suivi rapproché est généralement proposé.'],
      },
      en: {
        babyDescription:
          'The baby is fully developed and ready to be born. The due date is an estimate: many births happen in the days surrounding it, before or after.',
        length: 'About 51.2 cm',
        comparison: 'Pumpkin',
        bodyChanges: ['Waiting for signs of labor (regular contractions, water breaking) is common during this period.'],
        toKnow: ['Going slightly past the due date remains common and doesn’t necessarily mean there’s a problem; closer monitoring is generally offered.'],
      },
      es: {
        babyDescription:
          'El bebé está totalmente desarrollado y listo para nacer. La fecha prevista de parto es una estimación: muchos nacimientos ocurren en los días que la rodean, antes o después.',
        length: 'Aproximadamente 51,2 cm',
        comparison: 'Calabaza',
        bodyChanges: ['Es frecuente durante este periodo esperar signos de trabajo de parto (contracciones regulares, rotura de aguas).'],
        toKnow: ['Superar ligeramente la fecha prevista sigue siendo habitual y no significa necesariamente que haya un problema; generalmente se propone un seguimiento más cercano.'],
      },
      it: {
        babyDescription: 'Il bambino è completamente sviluppato e pronto a nascere. La data presunta del parto è una stima: molte nascite avvengono nei giorni che la circondano, prima o dopo.',
        length: 'Circa 51,2 cm',
        comparison: 'Zucca',
        bodyChanges: [
          'In questo periodo è frequente attendere i segni del travaglio (contrazioni regolari, rottura delle acque).',
        ],
        toKnow: [
          'Superare di poco la data presunta del parto resta comune e non significa necessariamente che ci sia un problema; in genere viene proposto un monitoraggio più ravvicinato.',
        ],
      },
      tr: {
        babyDescription: 'Bebek tam gelişmiştir ve doğmaya hazırdır. Tahmini doğum tarihi bir tahmindir: birçok doğum, öncesinde ya da sonrasında, bu tarihin çevresindeki günlerde gerçekleşir.',
        length: 'Yaklaşık 51,2 cm',
        comparison: 'Bal kabağı',
        bodyChanges: [
          'Bu dönemde doğum eyleminin belirtilerini (düzenli kasılmalar, suyun gelmesi) beklemek yaygındır.',
        ],
        toKnow: [
          'Tahmini doğum tarihini biraz geçmek yaygındır ve mutlaka bir sorun olduğu anlamına gelmez; genellikle daha yakın izlem önerilir.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш полностью развит и готов родиться. Предполагаемая дата родов — это оценка: многие роды происходят в дни вокруг неё, до или после.',
        length:
          'Около 51,2 см',
        comparison:
          'Тыква',
        bodyChanges: [
          'В этот период обычно ждут признаков начала родов (регулярные схватки, излитие околоплодных вод).',
        ],
        toKnow: [
          'Небольшая переношенность относительно предполагаемой даты родов — обычное явление и не обязательно означает проблему; как правило, предлагают более тщательное наблюдение.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby ist vollständig entwickelt und bereit, geboren zu werden. Der Entbindungstermin ist eine Schätzung: Viele Geburten finden in den Tagen davor oder danach statt.',
        length:
          'Etwa 51,2 cm',
        comparison:
          'Kürbis',
        bodyChanges: [
          'In dieser Zeit wartet man häufig auf die Anzeichen der Wehen (regelmäßige Kontraktionen, Blasensprung).',
        ],
        toKnow: [
          'Den Entbindungstermin leicht zu überschreiten ist weiterhin häufig und bedeutet nicht unbedingt, dass ein Problem vorliegt; in der Regel wird eine engere Überwachung angeboten.',
        ],
      },
      zh: {
        babyDescription: '宝宝已经完全发育好，随时准备出生。预产期只是一个估计：许多宝宝会在预产期前后几天出生，可能早一些，也可能晚一些。',
        length: '约 51.2 厘米',
        comparison: '南瓜',
        bodyChanges: [
          '这段时间里，等待临产的征兆（规律宫缩、破水）是很常见的。',
        ],
        toKnow: [
          '稍微超过预产期仍然很常见，不一定意味着有问题；通常会安排更密切的监测。',
        ],
      },
      id: {
        babyDescription: 'Bayi sudah berkembang sepenuhnya dan siap dilahirkan. Hari perkiraan lahir hanyalah perkiraan: banyak persalinan terjadi pada hari-hari di sekitarnya, sebelum atau sesudahnya.',
        length: 'Sekitar 51,2 cm',
        comparison: 'Labu',
        bodyChanges: [
          'Menunggu tanda-tanda persalinan (kontraksi teratur, ketuban pecah) umum dialami pada masa ini.',
        ],
        toKnow: [
          'Melewati hari perkiraan lahir sedikit masih umum terjadi dan belum tentu berarti ada masalah; pemantauan yang lebih ketat umumnya ditawarkan.',
        ],
      },
      hi: {
        babyDescription: 'शिशु पूरी तरह विकसित है और जन्म के लिए तैयार है। डिलीवरी की तारीख़ एक अनुमान है: बहुत से जन्म उसके आसपास के दिनों में होते हैं, उससे पहले या बाद में।',
        length: 'लगभग 51.2 सेमी',
        comparison: 'कद्दू',
        bodyChanges: [
          'इस दौरान प्रसव के संकेतों (नियमित संकुचन, पानी की थैली फटना) का इंतज़ार करना आम है।',
        ],
        toKnow: [
          'डिलीवरी की तारीख़ से थोड़ा आगे निकल जाना आम बात है और इसका मतलब ज़रूरी नहीं कि कोई समस्या हो; आम तौर पर नज़दीकी निगरानी की पेशकश की जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Bebi është plotësisht i zhvilluar dhe gati për t\'u lindur. Data e pritshme e lindjes është një vlerësim: shumë lindje ndodhin në ditët përreth saj, para ose pas.',
        length: 'Rreth 51.2 cm',
        comparison: 'Kungull',
        bodyChanges: [
          'Pritja e shenjave të lindjes (kontraksione të rregullta, çarja e ujërave) është e zakonshme gjatë kësaj periudhe.',
        ],
        toKnow: [
          'Kalimi pak përtej datës së pritshme mbetet i zakonshëm dhe nuk do të thotë domosdoshmërisht se ka një problem; zakonisht ofrohet monitorim më i afërt.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんは完全に成長し、生まれる準備が整っています。出産予定日はあくまで目安で、多くの出産は、その前後の数日のあいだに起こります。',
        length: '約51.2cm',
        comparison: 'かぼちゃ',
        bodyChanges: [
          'この時期は、陣痛のサイン（規則的な収縮、破水）を待つことがよくあります。',
        ],
        toKnow: [
          '出産予定日を少し過ぎることはよくあり、必ずしも問題があるという意味ではありません。通常は、より注意深い経過観察が提案されます。',
        ],
      },
      ko: {
        babyDescription: '아기는 모든 발달을 마치고 태어날 준비가 되었어요. 출산 예정일은 추정일이라서, 많은 출산이 예정일 전후 며칠 사이에 일어나요.',
        length: '약 51.2cm',
        comparison: '호박',
        bodyChanges: [
          '이 시기에는 진통의 신호(규칙적인 수축, 양수 터짐)를 기다리는 경우가 흔해요.',
        ],
        toKnow: [
          '예정일을 조금 넘기는 것은 흔한 일이며 반드시 문제가 있다는 뜻은 아니에요. 보통 더 가까운 관찰을 권해요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé está totalmente desenvolvido e pronto para nascer. A data prevista do parto é uma estimativa: muitos partos acontecem nos dias em redor dela, antes ou depois.',
        length: 'Cerca de 51,2 cm',
        comparison: 'Abóbora',
        bodyChanges: [
          'Aguardar os sinais do trabalho de parto (contrações regulares, rutura da bolsa de águas) é comum neste período.',
        ],
        toKnow: [
          'Ultrapassar ligeiramente a data prevista do parto continua a ser comum e não significa necessariamente que haja um problema; geralmente é proposta uma vigilância mais próxima.',
        ],
      },
      bn: {
        babyDescription: 'শিশু সম্পূর্ণ বিকশিত এবং জন্মের জন্য প্রস্তুত। প্রসবের সম্ভাব্য তারিখ একটি অনুমান মাত্র: অনেক শিশুর জন্ম এই তারিখের আগে বা পরে, আশপাশের কয়েক দিনের মধ্যে হয়।',
        length: 'প্রায় 51.2 সেমি',
        comparison: 'কুমড়া',
        bodyChanges: [
          'এই সময়ে প্রসববেদনার লক্ষণের (নিয়মিত সংকোচন, পানি ভাঙা) অপেক্ষায় থাকা স্বাভাবিক।',
        ],
        toKnow: [
          'প্রসবের সম্ভাব্য তারিখ কিছুটা পেরিয়ে যাওয়া সাধারণ ব্যাপার এবং এর মানে সবসময় কোনো সমস্যা আছে তা নয়; সাধারণত আরও নিবিড় পর্যবেক্ষণের ব্যবস্থা করা হয়।',
        ],
      },
    },
  },

  // ---------------------------------------------------------- week 41 (post-term)
  // No NHS Start4Life page exists beyond week 40 with a published length
  // figure — none is fabricated here.
  {
    week: 41,
    babyImage: require('../assets/images/pregnancy/development/week-41.png'),
    sourceRefs: ['NHS_S4L'],
    content: {
      fr: {
        babyDescription:
          'Le bébé reste pleinement développé. Au-delà de la date prévue, un suivi plus rapproché est généralement proposé pour surveiller le bien-être du bébé.',
        bodyChanges: ['L’attente prolongée peut s’accompagner d’une fatigue et d’une impatience accrues.'],
        toKnow: ['Un dépassement de terme fait généralement l’objet d’une surveillance renforcée par l’équipe médicale.'],
      },
      en: {
        babyDescription:
          'The baby remains fully developed. Beyond the due date, closer monitoring is generally offered to check on the baby’s wellbeing.',
        bodyChanges: ['The prolonged wait may come with increased fatigue and impatience.'],
        toKnow: ['Going past term generally leads to increased monitoring by the medical team.'],
      },
      es: {
        babyDescription:
          'El bebé sigue totalmente desarrollado. Más allá de la fecha prevista, generalmente se propone un seguimiento más cercano para vigilar el bienestar del bebé.',
        bodyChanges: ['La espera prolongada puede ir acompañada de un mayor cansancio e impaciencia.'],
        toKnow: ['Sobrepasar el término generalmente es objeto de una vigilancia reforzada por parte del equipo médico.'],
      },
      it: {
        babyDescription: 'Il bambino è ancora completamente sviluppato. Oltre la data presunta del parto, in genere viene proposto un monitoraggio più ravvicinato per controllare il benessere del bambino.',
        bodyChanges: [
          'L’attesa prolungata può accompagnarsi a maggiore stanchezza e impazienza.',
        ],
        toKnow: [
          'Superare il termine porta in genere a un monitoraggio più intenso da parte dell’équipe medica.',
        ],
      },
      tr: {
        babyDescription: 'Bebek tam gelişmiş olarak kalır. Tahmini doğum tarihinden sonra, bebeğin iyilik hâlini kontrol etmek için genellikle daha yakın izlem önerilir.',
        bodyChanges: [
          'Uzayan bekleyiş, artan yorgunluk ve sabırsızlıkla birlikte gelebilir.',
        ],
        toKnow: [
          'Termi geçmek genellikle tıbbi ekip tarafından izlemin artırılmasına yol açar.',
        ],
      },
      ru: {
        babyDescription:
          'Малыш по-прежнему полностью развит. После предполагаемой даты родов, как правило, предлагают более тщательное наблюдение, чтобы следить за благополучием малыша.',
        bodyChanges: [
          'Затянувшееся ожидание может сопровождаться усилившейся усталостью и нетерпением.',
        ],
        toKnow: [
          'Перенашивание, как правило, приводит к усиленному наблюдению со стороны медицинской команды.',
        ],
      },
      de: {
        babyDescription:
          'Das Baby ist weiterhin vollständig entwickelt. Nach dem Entbindungstermin wird in der Regel eine engere Überwachung angeboten, um das Wohlergehen des Babys zu kontrollieren.',
        bodyChanges: [
          'Das verlängerte Warten kann mit zunehmender Müdigkeit und Ungeduld einhergehen.',
        ],
        toKnow: [
          'Wenn der Termin überschritten wird, führt das in der Regel zu einer verstärkten Überwachung durch das medizinische Team.',
        ],
      },
      zh: {
        babyDescription: '宝宝仍然发育完全。超过预产期后，通常会安排更密切的监测，以确认宝宝的状况。',
        bodyChanges: [
          '漫长的等待可能会伴随着更明显的疲倦和焦急。',
        ],
        toKnow: [
          '超过足月后，医疗团队通常会加强监测。',
        ],
      },
      id: {
        babyDescription: 'Bayi tetap sudah berkembang sepenuhnya. Setelah lewat hari perkiraan lahir, pemantauan yang lebih ketat umumnya ditawarkan untuk memeriksa kesejahteraan bayi.',
        bodyChanges: [
          'Penantian yang berkepanjangan bisa disertai kelelahan yang meningkat dan rasa tidak sabar.',
        ],
        toKnow: [
          'Melewati usia cukup bulan umumnya membuat tim medis meningkatkan pemantauan.',
        ],
      },
      hi: {
        babyDescription: 'शिशु पूरी तरह विकसित बना रहता है। डिलीवरी की तारीख़ के बाद शिशु की सेहत जाँचने के लिए आम तौर पर नज़दीकी निगरानी की पेशकश की जाती है।',
        bodyChanges: [
          'लंबे इंतज़ार के साथ थकान और बेचैनी बढ़ सकती है।',
        ],
        toKnow: [
          'पूर्ण अवधि से आगे निकल जाने पर आम तौर पर चिकित्सा टीम द्वारा निगरानी बढ़ा दी जाती है।',
        ],
      },
      sq: {
        babyDescription: 'Bebi mbetet plotësisht i zhvilluar. Pas datës së pritshme të lindjes, zakonisht ofrohet monitorim më i afërt për të kontrolluar mirëqenien e bebit.',
        bodyChanges: [
          'Pritja e zgjatur mund të shoqërohet me lodhje dhe padurim më të madh.',
        ],
        toKnow: [
          'Kalimi përtej afatit zakonisht çon në monitorim më të shtuar nga ekipi mjekësor.',
        ],
      },
      ja: {
        babyDescription: '赤ちゃんは引き続き完全に成長した状態です。出産予定日を過ぎた場合は、赤ちゃんの健康状態を確認するため、通常、より注意深い経過観察が提案されます。',
        bodyChanges: [
          '待つ期間が長引くと、疲れや待ちきれない気持ちが強くなることがあります。',
        ],
        toKnow: [
          '正期産を過ぎると、一般に医療チームによる経過観察が強化されます。',
        ],
      },
      ko: {
        babyDescription: '아기는 여전히 모든 발달을 마친 상태예요. 출산 예정일이 지나면 아기가 건강한지 확인하기 위해 보통 더 가까운 관찰을 권해요.',
        bodyChanges: [
          '기다림이 길어지면 피로와 초조함이 더 커질 수 있어요.',
        ],
        toKnow: [
          '만삭을 넘기면 의료진이 대체로 더 자주 살펴봐요.',
        ],
      },
      'pt-PT': {
        babyDescription: 'O bebé continua totalmente desenvolvido. Depois da data prevista do parto, é geralmente proposta uma vigilância mais próxima para verificar o bem-estar do bebé.',
        bodyChanges: [
          'A espera prolongada pode vir acompanhada de maior cansaço e impaciência.',
        ],
        toKnow: [
          'Ultrapassar o termo leva geralmente a uma vigilância reforçada por parte da equipa médica.',
        ],
      },
      bn: {
        babyDescription: 'শিশু সম্পূর্ণ বিকশিত অবস্থাতেই থাকে। প্রসবের সম্ভাব্য তারিখ পেরিয়ে গেলে শিশুর সুস্থতা যাচাই করতে সাধারণত আরও ঘনিষ্ঠ পর্যবেক্ষণের ব্যবস্থা করা হয়।',
        bodyChanges: [
          'দীর্ঘ অপেক্ষার সঙ্গে ক্লান্তি ও অধৈর্য ভাব বাড়তে পারে।',
        ],
        toKnow: [
          'পূর্ণ মেয়াদ পেরিয়ে গেলে সাধারণত চিকিৎসা দল আরও বেশি পর্যবেক্ষণ করে থাকে।',
        ],
      },
    },
  },
];

// PHASE 7M / Spanish editorial content: default matches the app's
// English-first default (all real callers — PregnancyDashboard.tsx,
// PregnancyWeekScreen.tsx — already pass an explicit, normalized `lang`
// derived from i18n.language, so this default is only ever exercised by a
// caller that omits it, e.g. a test). Resolution is explicit per language via
// resolveEditorialLanguage(): 'fr' -> French, 'es' -> Spanish, 'it' -> Italian,
// 'tr' -> Turkish, 'ru' -> Russian, 'de' -> German, anything else (including 'en' and any unrecognized/future value) -> English.
// English is the fallback for an unknown language — never French.
export function getPregnancyWeekData(week: number, lang: EditorialLanguage = 'en'): PregnancyWeekData | undefined {
  const entry = PREGNANCY_WEEK_DATA.find(item => item.week === week);
  if (!entry) {
    return undefined;
  }
  const language = resolveEditorialLanguage(lang);
  // Brazilian Portuguese = the Portugal text with this week's overlay (ptBrEditorialOverlay.ts)
  const content = language === 'pt-BR' ? brazilianWeekContent(week, entry.content['pt-PT']) : entry.content[language];
  return {
    week: entry.week,
    babyImage: entry.babyImage,
    sourceRefs: entry.sourceRefs,
    ...content,
  };
}
