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
    da: PregnancyWeekEditorialContent;
    sv?: PregnancyWeekEditorialContent;
    nb: PregnancyWeekEditorialContent;
    pl: PregnancyWeekEditorialContent;
    uk: PregnancyWeekEditorialContent;
    cs: PregnancyWeekEditorialContent;
    sk: PregnancyWeekEditorialContent;
    hu: PregnancyWeekEditorialContent;
    ro: PregnancyWeekEditorialContent;
    bg: PregnancyWeekEditorialContent;
    sr: PregnancyWeekEditorialContent;
    hr: PregnancyWeekEditorialContent;
    bs: PregnancyWeekEditorialContent;
    sl: PregnancyWeekEditorialContent;
    ne: PregnancyWeekEditorialContent;
    si: PregnancyWeekEditorialContent;
    th: PregnancyWeekEditorialContent;
    vi: PregnancyWeekEditorialContent;
    uz: PregnancyWeekEditorialContent;
    az: PregnancyWeekEditorialContent;
    ka: PregnancyWeekEditorialContent;
    hy: PregnancyWeekEditorialContent;
    tg: PregnancyWeekEditorialContent;
    ky: PregnancyWeekEditorialContent;
    tk: PregnancyWeekEditorialContent;
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
      nb: {
        babyDescription:
          'Svangerskapet dateres fra første dag av siste mens, etter medisinsk konvensjon. På dette stadiet har befruktningen vanligvis ennå ikke funnet sted.',
        bodyChanges: [
          'Denne perioden kommer vanligvis før unnfangelsen; det er vanligvis ennå ingen kroppslige endringer knyttet til svangerskapet.',
        ],
        toKnow: [
          'Å regne svangerskapet fra siste mens gir en standardisert måte å beregne termindato på, selv om unnfangelsen i virkeligheten skjer litt senere.',
          'Det er vanlig å ikke merke noen endring på dette stadiet.',
        ],
      },
      pl: {
        babyDescription:
          'Ciążę liczy się od pierwszego dnia ostatniej miesiączki, zgodnie z konwencją medyczną. Na tym etapie zapłodnienie zazwyczaj jeszcze nie nastąpiło.',
        bodyChanges: [
          'Ten okres zazwyczaj poprzedza poczęcie; zwykle nie ma jeszcze żadnych zmian fizycznych związanych z ciążą.',
        ],
        toKnow: [
          'Liczenie ciąży od ostatniej miesiączki daje ustandaryzowany sposób oszacowania terminu porodu, mimo że poczęcie następuje w rzeczywistości nieco później.',
          'To częste, że na tym etapie nie zauważa się żadnych zmian.',
        ],
      },
      uk: {
        babyDescription:
          'Вагітність датується від першого дня останньої менструації, згідно з медичною конвенцією. На цьому етапі запліднення зазвичай ще не відбулося.',
        bodyChanges: [
          'Цей період зазвичай передує зачаттю; зазвичай ще немає жодних фізичних змін, пов’язаних із вагітністю.',
        ],
        toKnow: [
          'Відлік вагітності від останньої менструації дає стандартизований спосіб оцінки терміну пологів, хоча зачаття фактично відбувається трохи пізніше.',
          'Нормально, що на цьому етапі не помічаєш жодних змін.',
        ],
      },
      cs: {
        babyDescription:
          'Těhotenství se podle lékařské konvence datuje od prvního dne poslední menstruace. V této fázi obvykle ještě nedošlo k oplodnění.',
        bodyChanges: [
          'Toto období obvykle předchází početí; zpravidla zatím nedochází k žádným tělesným změnám souvisejícím s těhotenstvím.',
        ],
        toKnow: [
          'Počítání těhotenství od poslední menstruace poskytuje standardizovaný způsob odhadu termínu porodu, i když k početí ve skutečnosti dochází o něco později.',
          'Je běžné, že si v této fázi nevšimnete žádné změny.',
        ],
      },
      sk: {
        babyDescription:
          'Tehotenstvo sa podľa lekárskej konvencie datuje od prvého dňa poslednej menštruácie. V tejto fáze zvyčajne ešte nedošlo k oplodneniu.',
        bodyChanges: [
          'Toto obdobie zvyčajne predchádza počatiu; zvyčajne zatiaľ nie je žiadna telesná zmena súvisiaca s tehotenstvom.',
        ],
        toKnow: [
          'Počítanie tehotenstva od poslednej menštruácie poskytuje štandardizovaný spôsob odhadu termínu pôrodu, hoci k počatiu v skutočnosti dochádza o niečo neskôr.',
          'Je bežné, že si v tejto fáze nevšimnete žiadnu zmenu.',
        ],
      },
      hu: {
        babyDescription:
          'A terhességet az orvosi megállapodás szerint az utolsó menstruáció első napjától számítják. Ebben a szakaszban a megtermékenyítés általában még nem történt meg.',
        bodyChanges: [
          'Ez az időszak általában a fogantatás előtt van; a terhességgel összefüggő testi változás általában még nincs.',
        ],
        toKnow: [
          'A terhesség utolsó menstruációtól való számítása szabványosított módot ad a kiírt időpont becslésére, bár a fogantatás valójában kicsit később történik.',
          'Gyakori, hogy ebben a szakaszban semmilyen változást nem veszel észre.',
        ],
      },
      ro: {
        babyDescription:
          'Sarcina este datată de la prima zi a ultimei menstruații, prin convenție medicală. În această etapă, fecundarea nu a avut încă loc, în general.',
        bodyChanges: [
          'Această perioadă precede în general concepția; de obicei nu există încă nicio schimbare fizică legată de sarcină.',
        ],
        toKnow: [
          'Calcularea sarcinii de la ultima menstruație oferă un mod standardizat de a estima data nașterii, chiar dacă concepția are loc de fapt ceva mai târziu.',
          'Este frecvent să nu observi nicio schimbare în această etapă.',
        ],
      },
      bg: {
        babyDescription:
          'Бременността се датира от първия ден на последната менструация по медицинска конвенция. На този етап оплождането обикновено още не е настъпило.',
        bodyChanges: [
          'Този период обикновено предхожда зачеването; обикновено още няма физическа промяна, свързана с бременността.',
        ],
        toKnow: [
          'Броенето на бременността от последната менструация дава стандартизиран начин за изчисляване на термина, макар че зачеването всъщност настъпва малко по-късно.',
          'Често е да не забележиш никаква промяна на този етап.',
        ],
      },
      sr: {
        babyDescription:
          'Трудноћа се датира од првог дана последње менструације по медицинској конвенцији. У овој фази оплођење обично још није настало.',
        bodyChanges: [
          'Овај период обично претходи зачећу; обично још нема физичке промене повезане са трудноћом.',
        ],
        toKnow: [
          'Рачунање трудноће од последње менструације даје стандардизован начин за процену термина порођаја, мада се зачеће заправо дешава нешто касније.',
          'Често је да не приметиш никакву промену у овој фази.',
        ],
      },
      hr: {
        babyDescription:
          'Trudnoća se prema medicinskoj konvenciji datira od prvog dana posljednje menstruacije. U ovoj fazi oplodnja obično još nije nastupila.',
        bodyChanges: [
          'Ovo razdoblje obično prethodi začeću; uglavnom još nema tjelesnih promjena povezanih s trudnoćom.',
        ],
        toKnow: [
          'Računanje trudnoće od posljednje menstruacije daje standardizirani način procjene termina poroda, iako se začeće zapravo događa nešto kasnije.',
          'Često se u ovoj fazi ne primijeti nikakva promjena.',
        ],
      },
      bs: {
        babyDescription:
          'Trudnoća se prema medicinskoj konvenciji datira od prvog dana posljednje menstruacije. U ovoj fazi oplodnja obično još nije nastupila.',
        bodyChanges: [
          'Ovo razdoblje obično prethodi začeću; uglavnom još nema tjelesnih promjena povezanih s trudnoćom.',
        ],
        toKnow: [
          'Računanje trudnoće od posljednje menstruacije daje standardizirani način procjene termina porođaja, iako se začeće zapravo događa nešta kasnije.',
          'Često se u ovoj fazi ne primijeti nikakva promjena.',
        ],
      },
      sl: {
        babyDescription:
          'Nosečnost se po medicinski konvenciji datira od prvega dne zadnje menstruacije. V tej fazi oploditev običajno še ni nastopila.',
        bodyChanges: [
          'To obdobje običajno predhaja spočetju; običajno še ni telesnih sprememb, povezanih z nosečnostjo.',
        ],
        toKnow: [
          'Štetje nosečnosti od zadnje menstruacije daje standardiziran način za oceno termina poroda, čeprav se spočetje dejansko zgodi nekoliko pozneje.',
          'Pogosto je, da v tej fazi ne opaziš nobene spremembe.',
        ],
      },
      ne: {
        babyDescription:
          'चिकित्सकीय परम्पराअनुसार गर्भावस्थाको मिति तपाईंको पछिल्लो महिनावारीको पहिलो दिनबाट गणना गरिन्छ। यस चरणमा निषेचन सामान्यतया अझै भएको हुँदैन।',
        bodyChanges: [
          'यो अवधि सामान्यतया गर्भधारणभन्दा पहिले आउँछ; गर्भावस्थासँग सम्बन्धित कुनै शारीरिक परिवर्तन सामान्यतया अझै हुँदैन।',
        ],
        toKnow: [
          'पछिल्लो महिनावारीबाट गर्भावस्था गन्नाले सम्भावित प्रसव मिति अनुमान गर्ने एउटा मानक तरिका दिन्छ, यद्यपि गर्भधारण वास्तवमा केही पछि हुन्छ।',
          'यस चरणमा कुनै परिवर्तन नदेखिनु सामान्य कुरा हो।',
        ],
      },
      si: {
        babyDescription:
          'වෛද්‍ය සම්මුතියට අනුව, ගර්භණී කාලය ගණනය කරන්නේ ඔබේ අවසාන ඔසප්වල පළමු දිනයෙනි. මෙම අවධියේදී, සංසේචනය සාමාන්‍යයෙන් තවම සිදු වී නැත.',
        bodyChanges: [
          'මෙම කාලය සාමාන්‍යයෙන් ගර්භ ගැනීමට පෙර පැමිණේ; ගර්භණී කාලයට සම්බන්ධ ශාරීරික වෙනසක් සාමාන්‍යයෙන් තවම නැත.',
        ],
        toKnow: [
          'අවසාන ඔසප් සිට ගර්භණී කාලය ගණනය කිරීම, ගර්භ ගැනීම සැබවින්ම ටිකක් පසුව සිදු වුවද, දරු ප්‍රසූත දිනයක් ඇස්තමේන්තු කිරීමට සම්මත ක්‍රමයක් ලබා දෙයි.',
          'මෙම අවධියේ කිසිදු වෙනසක් නොදැනීම සාමාන්‍යයි.',
        ],
      },
      th: {
        babyDescription:
          'ตามหลักการทางการแพทย์ การตั้งครรภ์นับจากวันแรกของประจำเดือนครั้งล่าสุดของคุณ ในระยะนี้ โดยทั่วไปการปฏิสนธิยังไม่เกิดขึ้น',
        bodyChanges: [
          'ช่วงนี้โดยทั่วไปอยู่ก่อนการปฏิสนธิ มักยังไม่มีการเปลี่ยนแปลงทางกายที่เกี่ยวกับการตั้งครรภ์',
        ],
        toKnow: [
          'การนับอายุครรภ์จากประจำเดือนครั้งล่าสุดเป็นวิธีมาตรฐานในการประมาณวันกำหนดคลอด แม้การปฏิสนธิจริงจะเกิดขึ้นช้ากว่านั้นเล็กน้อย',
          'เป็นเรื่องปกติที่จะไม่สังเกตเห็นการเปลี่ยนแปลงใด ๆ ในระยะนี้',
        ],
      },
      vi: {
        babyDescription:
          'Theo quy ước y khoa, thai kỳ được tính từ ngày đầu tiên của kỳ kinh cuối cùng. Ở giai đoạn này, quá trình thụ tinh thường chưa diễn ra.',
        bodyChanges: [
          'Giai đoạn này thường diễn ra trước khi thụ thai; thường chưa có thay đổi thể chất nào liên quan đến thai kỳ.',
        ],
        toKnow: [
          'Việc tính thai kỳ từ kỳ kinh cuối cùng cho một cách chuẩn hóa để ước tính ngày dự sinh, dù việc thụ thai thực tế xảy ra muộn hơn một chút.',
          'Không nhận thấy thay đổi nào ở giai đoạn này là điều phổ biến.',
        ],
      },
      uz: {
        babyDescription:
          'Tibbiy konventsiyaga koʻra, homiladorlik oxirgi hayzingizning birinchi kunidan hisoblanadi. Bu bosqichda urugʻlanish odatda hali sodir boʻlmagan.',
        bodyChanges: [
          'Bu davr odatda homilador boʻlishdan oldin keladi; odatda homiladorlik bilan bogʻliq jismoniy oʻzgarish hali boʻlmaydi.',
        ],
        toKnow: [
          'Homiladorlikni oxirgi hayzdan hisoblash taxminiy tugʻish sanasini baholashning standartlashtirilgan usulini beradi, garchi urugʻlanish aslida biroz keyinroq sodir boʻlsa ham.',
          'Bu bosqichda hech qanday oʻzgarishni sezmaslik keng tarqalgan.',
        ],
      },
      az: {
        babyDescription:
          'Tibbi konvensiyaya görə hamiləlik son aybaşınızın ilk günündən hesablanır. Bu mərhələdə mayalanma adətən hələ baş verməyib.',
        bodyChanges: [
          'Bu dövr adətən hamilə qalmazdan əvvəl gəlir; adətən hamiləliklə bağlı fiziki dəyişiklik hələ olmur.',
        ],
        toKnow: [
          'Hamiləliyi son aybaşından hesablamaq, mayalanma əslində bir qədər sonra baş versə də, təxmini doğuş tarixini qiymətləndirmək üçün standartlaşdırılmış üsul verir.',
          'Bu mərhələdə heç bir dəyişikliyi hiss etməmək geniş yayılıb.',
        ],
      },
      ka: {
        babyDescription:
          'სამედიცინო პრინციპით ორსულობა თქვენი ბოლო მენსტრუაციის პირველი დღიდან ითვლება. ამ ეტაპზე განაყოფიერება, როგორც წესი, ჯერ არ მომხდარა.',
        bodyChanges: [
          'ეს პერიოდი, როგორც წესი, ჩასახვამდე მოდის; ორსულობასთან დაკავშირებული ფიზიკური ცვლილება ჩვეულებრივ ჯერ არ არის.',
        ],
        toKnow: [
          'ორსულობის ბოლო მენსტრუაციიდან დათვლა მშობიარობის სავარაუდო თარიღის შეფასების სტანდარტიზებულ გზას იძლევა, მიუხედავად იმისა, რომ ჩასახვა სინამდვილეში ცოტა მოგვიანებით ხდება.',
          'ხშირია, რომ ამ ეტაპზე არანაირ ცვლილებას არ ამჩნევთ.',
        ],
      },
      hy: {
        babyDescription:
          'Բժշկական կարգով հղիությունը հաշվվում է ձեր վերջին դաշտանի առաջին օրից: Այս փուլում բեղմնավորումը սովորաբար դեռ տեղի չի ունեցել:',
        bodyChanges: [
          'Այս ժամանակահատվածը սովորաբար նախորդում է հղիացմանը. հղիության հետ կապված ֆիզիկական փոփոխություն սովորաբար դեռ չկա:',
        ],
        toKnow: [
          'Հղիությունը վերջին դաշտանից հաշվելը տալիս է ծննդաբերության ամսաթիվը գնահատելու ստանդարտացված եղանակ, թեև հղիացումն իրականում տեղի է ունենում մի փոքր ավելի ուշ:',
          'Տարածված է, որ այս փուլում որևէ փոփոխություն չնկատվի:',
        ],
      },
      tg: {
        babyDescription:
          'Ҳомиладорӣ аз рӯзи аввали ҳайзи охирини шумо, мувофиқи ҳисоби тиббӣ, ҳисоб карда мешавад. Дар ин марҳила бордоршавӣ одатан ҳанӯз рух надодааст.',
        bodyChanges: [
          'Ин давра одатан пеш аз ҳомиладоршавӣ аст; одатан ҳанӯз ягон тағйироти ҷисмонии марбут ба ҳомиладорӣ нест.',
        ],
        toKnow: [
          'Ҳисоб кардани ҳомиладорӣ аз ҳайзи охирин усули стандартии тахмин кардани санаи таваллуд медиҳад, гарчанде ки ҳомиладоршавӣ дар асл андаке дертар рух медиҳад.',
          'Маъмул аст, ки дар ин марҳила ягон тағйирот мушоҳида нашавад.',
        ],
      },
      ky: {
        babyDescription:
          'Курсактуулук медициналык макулдашуу боюнча акыркы етек киримдин биринчи күнүнөн эсептелет. Бул этапта уруктануу көбүнчө азырынча болгон эмес.',
        bodyChanges: [
          'Бул мезгил адатта боюна бүтүүдөн мурун келет; курсактуулукка байланыштуу физикалык өзгөрүү адатта азырынча жок.',
        ],
        toKnow: [
          'Курсактуулукту акыркы етек киримден эсептөө боюна бүтүү иш жүзүндө бир аз кечирээк болсо да, төрөт күнүн болжолдоонун стандарттык жолун берет.',
          'Бул этапта эч кандай өзгөрүүнү байкабоо кеңири таралган.',
        ],
      },
      tk: {
        babyDescription:
          'Göwrelilik lukmançylyk şertnamasy boýunça soňky aýbaşyňyzyň ilkinji gününden hasaplanýar. Bu tapgyrda tohumlanma adatça heniz bolmady.',
        bodyChanges: [
          'Bu döwür adatça göwreli bolmakdan öň gelýär; göwrelilige degişli fiziki üýtgeşme adatça heniz ýok.',
        ],
        toKnow: [
          'Göwreliligi soňky aýbaşydan hasaplamak, göwreli bolmak aslynda birneme soň bolsa-da, doglan senäni bahalamagyň standart usulyny berýär.',
          'Bu tapgyrda hiç hili üýtgeşmäni duýmazlyk umumy zat.',
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
      da: {
        babyDescription: 'Graviditeten dateres fra den første dag i din sidste menstruation, per medicinsk konvention. På dette stadie er befrugtningen generelt endnu ikke sket.',
        bodyChanges: [
          'Denne periode foregår normalt inden undfangelsen; der er som regel endnu ingen graviditetsrelaterede fysiske forandringer.',
        ],
        toKnow: [
          'At tælle graviditeten fra den sidste menstruation giver en standardiseret måde at beregne en termindato på, selvom undfangelsen faktisk sker lidt senere.',
          'Det er normalt ikke at mærke nogen forandring på dette stadie.',
        ],
      },
      sv: {
        babyDescription: 'Graviditeten dateres fran den förste dag i din sidste menstruation, per medicinsk konvention. På dette stadie ar befrugtningen generelt endnu inte sket.',
        bodyChanges: [
          'Denne periode foregår normalt inden undfangelsen; der ar som regel endnu ingen graviditetsrelaterede fysiske forandringer.',
        ],
        toKnow: [
          'At tälle graviditeten fran den sidste menstruation giver en standardiseret måde at beregne en termindato på, selvom undfangelsen faktisk sker lidt senere.',
          'Det ar normalt inte at märke nogen forandring på dette stadie.',
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
      nb: {
        babyDescription:
          'Eggløsning og en eventuell befruktning skjer vanligvis rundt dette tidspunktet, avhengig av hver enkelts sykluslengde.',
        bodyChanges: [
          'Tidspunktet for eggløsningen kan variere avhengig av sykluslengden, noe som påvirker den faktiske mulige unnfangelsesdatoen.',
          'Det er vanligvis ennå ingen svangerskapsspesifikke kroppslige endringer på dette stadiet.',
        ],
        toKnow: ['Det nøyaktige tidspunktet for eggløsningen varierer fra person til person, og derfor er denne perioden fortsatt et estimat.'],
      },
      pl: {
        babyDescription:
          'Owulacja i ewentualne zapłodnienie zazwyczaj następują mniej więcej w tym czasie, w zależności od długości cyklu danej osoby.',
        bodyChanges: [
          'Moment owulacji może się różnić w zależności od długości cyklu, co wpływa na rzeczywistą możliwą datę poczęcia.',
          'Na tym etapie zazwyczaj nie ma jeszcze zmian fizycznych specyficznych dla ciąży.',
        ],
        toKnow: ['Dokładny moment owulacji różni się u poszczególnych osób, dlatego ten okres pozostaje szacunkowy.'],
      },
      uk: {
        babyDescription:
          'Овуляція та можливе запліднення зазвичай відбуваються приблизно в цей час, залежно від тривалості циклу кожної жінки.',
        bodyChanges: [
          'Момент овуляції може відрізнятися залежно від тривалості циклу, що впливає на фактичну можливу дату зачаття.',
          'На цьому етапі зазвичай ще немає фізичних змін, специфічних для вагітності.',
        ],
        toKnow: ['Точний момент овуляції різниться в різних жінок, тому цей період залишається орієнтовним.'],
      },
      cs: {
        babyDescription:
          'Ovulace a případné oplodnění obvykle nastávají přibližně v této době, podle délky cyklu každé ženy.',
        bodyChanges: [
          'Okamžik ovulace se může lišit podle délky cyklu, což ovlivňuje skutečné možné datum početí.',
          'V této fázi obvykle zatím nedochází k žádným tělesným změnám specifickým pro těhotenství.',
        ],
        toKnow: ['Přesný okamžik ovulace se u jednotlivých žen liší, proto toto období zůstává orientační.'],
      },
      sk: {
        babyDescription:
          'Ovulácia a prípadné oplodnenie zvyčajne nastávajú približne v tomto čase, podľa dĺžky cyklu každej ženy.',
        bodyChanges: [
          'Načasovanie ovulácie sa môže líšiť podľa dĺžky cyklu, čo ovplyvňuje skutočný možný dátum počatia.',
          'V tejto fáze zvyčajne zatiaľ nie je žiadna telesná zmena špecifická pre tehotenstvo.',
        ],
        toKnow: [
          'Presné načasovanie ovulácie sa líši od ženy k žene, preto toto obdobie zostáva odhadom.',
        ],
      },
      hu: {
        babyDescription:
          'A peteérés és az esetleges megtermékenyítés általában ebben az időben történik, az egyes nők ciklushosszától függően.',
        bodyChanges: [
          'A peteérés időzítése a ciklus hosszától függően változhat, ami befolyásolja a tényleges lehetséges fogantatási dátumot.',
          'Ebben a szakaszban általában még nincs terhességre jellemző testi változás.',
        ],
        toKnow: [
          'A peteérés pontos időzítése nőnként eltér, ezért ez az időszak becslés marad.',
        ],
      },
      ro: {
        babyDescription:
          'Ovulația și o eventuală fecundare au loc în general în această perioadă, în funcție de durata ciclului fiecărei persoane.',
        bodyChanges: [
          'Momentul ovulației poate varia în funcție de durata ciclului, ceea ce influențează data reală posibilă a concepției.',
          'În general, nu există încă nicio schimbare fizică specifică sarcinii în această etapă.',
        ],
        toKnow: [
          'Momentul exact al ovulației variază de la o persoană la alta, de aceea această perioadă rămâne o estimare.',
        ],
      },
      bg: {
        babyDescription:
          'Овулацията и евентуалното оплождане обикновено настъпват около този момент, в зависимост от продължителността на цикъла на всеки човек.',
        bodyChanges: [
          'Моментът на овулацията може да варира според продължителността на цикъла, което влияе на реалната възможна дата на зачеване.',
          'Обикновено още няма специфична за бременността физическа промяна на този етап.',
        ],
        toKnow: [
          'Точният момент на овулацията варира от човек на човек, затова този период остава приблизителна оценка.',
        ],
      },
      sr: {
        babyDescription:
          'Овулација и евентуално оплођење обично настају око овог времена, зависно од трајања циклуса сваке особе.',
        bodyChanges: [
          'Тренутак овулације може варирати зависно од трајања циклуса, што утиче на стварни могући датум зачећа.',
          'Обично још нема физичке промене специфичне за трудноћу у овој фази.',
        ],
        toKnow: [
          'Тачан тренутак овулације варира од особе до особе, зато овај период остаје процена.',
        ],
      },
      hr: {
        babyDescription:
          'Ovulacija i moguća oplodnja obično nastupaju otprilike u ovo vrijeme, ovisno o duljini ciklusa svake osobe.',
        bodyChanges: [
          'Trenutak ovulacije može varirati ovisno o duljini ciklusa, što utječe na stvarni mogući datum začeća.',
          'U ovoj fazi obično još nema tjelesne promjene specifične za trudnoću.',
        ],
        toKnow: [
          'Točan trenutak ovulacije razlikuje se od osobe do osobe, zato ovo razdoblje ostaje procjena.',
        ],
      },
      bs: {
        babyDescription:
          'Ovulacija i moguća oplodnja obično nastupaju otprilike u ovo vrijeme, ovisno o duljini ciklusa svake osobe.',
        bodyChanges: [
          'Trenutak ovulacije može varirati ovisno o duljini ciklusa, što utječe na stvarni mogući datum začeća.',
          'U ovoj fazi obično još nema tjelesne promjene specifične za trudnoću.',
        ],
        toKnow: [
          'Točan trenutak ovulacije razlikuje se od osobe do osobe, zato ovo razdoblje ostaje procjena.',
        ],
      },
      sl: {
        babyDescription:
          'Ovulacija in morebitna oploditev običajno nastopita približno v tem času, odvisno od dolžine cikla vsake osebe.',
        bodyChanges: [
          'Trenutek ovulacije se lahko spreminja glede na dolžino cikla, kar vpliva na dejanski možni datum spočetja.',
          'V tej fazi običajno še ni telesne spremembe, specifične za nosečnost.',
        ],
        toKnow: [
          'Natančen trenutek ovulacije se razlikuje od osebe do osebe, zato to obdobje ostaja ocena.',
        ],
      },
      ne: {
        babyDescription:
          'अण्डोत्सर्ग र सम्भावित निषेचन सामान्यतया यही समयतिर हुन्छन्, हरेक व्यक्तिको चक्रको अवधिअनुसार।',
        bodyChanges: [
          'अण्डोत्सर्गको समय चक्रको अवधिअनुसार फरक हुन सक्छ, जसले गर्भधारणको वास्तविक सम्भावित मितिलाई असर गर्छ।',
          'यस चरणमा सामान्यतया अझै गर्भावस्था-विशेष कुनै शारीरिक परिवर्तन हुँदैन।',
        ],
        toKnow: [
          'अण्डोत्सर्गको सही समय व्यक्तिपिच्छे फरक हुन्छ, त्यसैले यो अवधि अनुमान मात्र रहन्छ।',
        ],
      },
      si: {
        babyDescription:
          'ඩිම්බ මෝචනය සහ ඇතිවිය හැකි සංසේචනය සාමාන්‍යයෙන් මෙම කාලය වටා සිදුවේ, සෑම පුද්ගලයකුගේම චක්‍රයේ දිග අනුව.',
        bodyChanges: [
          'ඩිම්බ මෝචනයේ වේලාව චක්‍රයේ දිග අනුව වෙනස් විය හැකි අතර, එය ගර්භ ගැනීමේ සැබෑ හැකි දිනයට බලපායි.',
          'මෙම අවධියේදී ගර්භණී කාලයට විශේෂිත ශාරීරික වෙනසක් සාමාන්‍යයෙන් තවම නැත.',
        ],
        toKnow: [
          'ඩිම්බ මෝචනයේ නිශ්චිත වේලාව පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වේ, එබැවින් මෙම කාලය ඇස්තමේන්තුවක් ලෙස පවතී.',
        ],
      },
      th: {
        babyDescription:
          'การตกไข่และการปฏิสนธิที่อาจเกิดขึ้น โดยทั่วไปเกิดขึ้นราวช่วงนี้ ตามความยาวรอบเดือนของแต่ละคน',
        bodyChanges: [
          'เวลาของการตกไข่อาจต่างกันตามความยาวรอบเดือน ซึ่งส่งผลต่อวันที่เป็นไปได้จริงของการปฏิสนธิ',
          'โดยทั่วไปยังไม่มีการเปลี่ยนแปลงทางกายเฉพาะของการตั้งครรภ์ในระยะนี้',
        ],
        toKnow: [
          'เวลาที่แน่นอนของการตกไข่แตกต่างกันในแต่ละคน จึงทำให้ช่วงนี้ยังคงเป็นเพียงค่าประมาณ',
        ],
      },
      vi: {
        babyDescription:
          'Rụng trứng và quá trình thụ tinh có thể xảy ra thường diễn ra vào khoảng thời gian này, tùy theo độ dài chu kỳ của mỗi người.',
        bodyChanges: [
          'Thời điểm rụng trứng có thể khác nhau tùy theo độ dài chu kỳ, điều này ảnh hưởng đến ngày thụ thai có thể xảy ra trên thực tế.',
          'Ở giai đoạn này thường chưa có thay đổi thể chất đặc trưng nào của thai kỳ.',
        ],
        toKnow: [
          'Thời điểm rụng trứng chính xác khác nhau giữa từng người, vì vậy giai đoạn này vẫn chỉ là một ước tính.',
        ],
      },
      uz: {
        babyDescription:
          'Ovulyatsiya va mumkin boʻlgan urugʻlanish odatda shu vaqt atrofida sodir boʻladi, har bir odamning sikl uzunligiga qarab.',
        bodyChanges: [
          'Ovulyatsiya vaqti sikl uzunligiga qarab farq qilishi mumkin, bu urugʻlanishning haqiqiy mumkin boʻlgan sanasiga taʼsir qiladi.',
          'Bu bosqichda odatda homiladorlikka xos jismoniy oʻzgarish hali boʻlmaydi.',
        ],
        toKnow: [
          'Ovulyatsiyaning aniq vaqti odamdan odamga farq qiladi, shuning uchun bu davr taxmin boʻlib qoladi.',
        ],
      },
      az: {
        babyDescription:
          'Ovulyasiya və mümkün mayalanma adətən hər şəxsin dövr uzunluğundan asılı olaraq bu vaxt ətrafında baş verir.',
        bodyChanges: [
          'Ovulyasiya vaxtı dövr uzunluğundan asılı olaraq dəyişə bilər ki, bu da mayalanmanın faktiki mümkün tarixinə təsir edir.',
          'Bu mərhələdə adətən hamiləliyə xas fiziki dəyişiklik hələ olmur.',
        ],
        toKnow: [
          'Ovulyasiyanın dəqiq vaxtı şəxsdən şəxsə dəyişir, buna görə bu dövr təxmini olaraq qalır.',
        ],
      },
      ka: {
        babyDescription:
          'ოვულაცია და შესაძლო განაყოფიერება, როგორც წესი, დაახლოებით ამ დროს ხდება, თითოეული ადამიანის ციკლის ხანგრძლივობის მიხედვით.',
        bodyChanges: [
          'ოვულაციის დრო ციკლის ხანგრძლივობის მიხედვით შეიძლება განსხვავდებოდეს, რაც ჩასახვის რეალურ შესაძლო თარიღზე მოქმედებს.',
          'ამ ეტაპზე ორსულობისთვის დამახასიათებელი ფიზიკური ცვლილება, როგორც წესი, ჯერ არ არის.',
        ],
        toKnow: [
          'ოვულაციის ზუსტი დრო ადამიანიდან ადამიანამდე განსხვავდება, ამიტომ ეს პერიოდი შეფასებად რჩება.',
        ],
      },
      hy: {
        babyDescription:
          'Ձվազատումը և հնարավոր բեղմնավորումը սովորաբար տեղի են ունենում մոտ այս ժամանակ՝ կախված յուրաքանչյուր անձի ցիկլի տևողությունից:',
        bodyChanges: [
          'Ձվազատման ժամանակը կարող է տարբերվել՝ կախված ցիկլի տևողությունից, ինչը ազդում է հղիացման իրական հնարավոր ամսաթվի վրա:',
          'Այս փուլում հղիությանը հատուկ ֆիզիկական փոփոխություն սովորաբար դեռ չկա:',
        ],
        toKnow: [
          'Ձվազատման ճշգրիտ ժամանակը տարբերվում է մարդուց մարդ, ուստի այս ժամանակահատվածը մնում է գնահատական:',
        ],
      },
      tg: {
        babyDescription:
          'Овуляция ва бордоршавии имконпазир одатан дар атрофи ҳамин вақт, вобаста ба дарозии давраи ҳар шахс, рух медиҳад.',
        bodyChanges: [
          'Вақти овуляция вобаста ба дарозии давра метавонад гуногун бошад, ки ба санаи воқеии имконпазири ҳомиладоршавӣ таъсир мерасонад.',
          'Дар ин марҳила одатан ҳанӯз ягон тағйироти ҷисмонии хоси ҳомиладорӣ нест.',
        ],
        toKnow: [
          'Вақти дақиқи овуляция аз шахс ба шахс фарқ мекунад, аз ин рӯ ин давра тахминӣ боқӣ мемонад.',
        ],
      },
      ky: {
        babyDescription:
          'Овуляция жана мүмкүн болгон уруктануу адатта ушул убакта, ар бир адамдын цикл узактыгына жараша болот.',
        bodyChanges: [
          'Овуляциянын убактысы цикл узактыгына жараша айырмаланышы мүмкүн, бул боюна бүтүүнүн чыныгы мүмкүн болгон күнүнө таасир этет.',
          'Бул этапта курсактуулукка тиешелүү физикалык өзгөрүү адатта азырынча жок.',
        ],
        toKnow: [
          'Овуляциянын так убактысы адамдан адамга айырмаланат, ошондуктан бул мезгил болжолдоо бойдон калат.',
        ],
      },
      tk: {
        babyDescription:
          'Ovulýasiýa we mümkin tohumlanma adatça şu wagt töwereginde, her adamyň sikl uzynlygyna baglylykda bolýar.',
        bodyChanges: [
          'Ovulýasiýanyň wagty sikl uzynlygyna görä tapawutlanyp biler, bu göwreli bolmagyň hakyky mümkin senesine täsir edýär.',
          'Bu tapgyrda göwrelilige mahsus fiziki üýtgeşme adatça heniz ýok.',
        ],
        toKnow: [
          'Ovulýasiýanyň takyk wagty adamdan adama tapawutlanýar, şonuň üçin bu döwür baha bolup galýar.',
        ],
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
      da: {
        babyDescription: 'Ægløsning og mulig befrugtning sker normalt på dette tidspunkt, afhængigt af den enkeltes cykluslængde.',
        bodyChanges: [
          'Tidspunktet for ægløsning kan variere afhængigt af cykluslængden, hvilket påvirker den faktiske mulige dato for undfangelse.',
          'Der er generelt endnu ingen graviditetsspecifikke fysiske forandringer på dette stadie.',
        ],
        toKnow: [
          'Det nøjagtige tidspunkt for ægløsning varierer fra person til person, og derfor er denne periode stadig et skøn.',
        ],
      },
      sv: {
        babyDescription: 'Äglösning och mulig befrugtning sker normalt på dette tidspunkt, afhängigt av den enkeltes cykluslängde.',
        bodyChanges: [
          'Tidspunktet for äglösning kan variere afhängigt av cykluslängden, hvilket påvirker den faktiske mulige dato for undfangelse.',
          'Der ar generelt endnu ingen graviditetsspecifikke fysiske forandringer på dette stadie.',
        ],
        toKnow: [
          'Det nöjagtige tidspunkt for äglösning varierer fran person till person, och derfor ar denne periode fortfarande et skön.',
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
      nb: {
        babyDescription:
          'Hvis befruktning har funnet sted, begynner egget å dele seg og forflytte seg mot livmoren, men ingenting kan ennå påvises med en graviditetstest.',
        bodyChanges: [
          'Denne uken ligger fortsatt innenfor den medisinske dateringsperioden rundt unnfangelsen; ingen kroppslige tegn er vanligvis merkbare på dette stadiet.',
        ],
        toKnow: ['De fleste graviditetstester på urin blir pålitelige fra omtrent uken etter, når implantasjonen har begynt.'],
      },
      pl: {
        babyDescription:
          'Jeśli doszło do zapłodnienia, komórka jajowa zaczyna się dzielić i przemieszczać w stronę macicy, ale testem ciążowym nie można jeszcze niczego wykryć.',
        bodyChanges: [
          'Ten tydzień nadal mieści się w medycznym okresie datowania wokół poczęcia; zazwyczaj na tym etapie nie jest zauważalny żaden objaw fizyczny.',
        ],
        toKnow: ['Większość testów ciążowych z moczu staje się wiarygodna mniej więcej od następnego tygodnia, gdy rozpocznie się implantacja.'],
      },
      uk: {
        babyDescription:
          'Якщо запліднення відбулося, яйцеклітина починає ділитися й рухатися в бік матки, але тестом на вагітність поки нічого не можна виявити.',
        bodyChanges: [
          'Цей тиждень усе ще входить у медичний період датування навколо зачаття; зазвичай на цьому етапі жодної фізичної ознаки не відчувається.',
        ],
        toKnow: ['Більшість тестів на вагітність із сечі стають надійними приблизно з наступного тижня, коли розпочнеться імплантація.'],
      },
      cs: {
        babyDescription:
          'Pokud došlo k oplodnění, vajíčko se začíná dělit a postupuje směrem k děloze, ale těhotenským testem zatím nelze nic zachytit.',
        bodyChanges: [
          'Tento týden stále spadá do lékařského období datování kolem početí; v této fázi obvykle není znatelný žádný tělesný příznak.',
        ],
        toKnow: ['Většina těhotenských testů z moči se stává spolehlivou přibližně od následujícího týdne, až začne uhnízdění.'],
      },
      sk: {
        babyDescription:
          'Ak došlo k oplodneniu, vajíčko sa začína deliť a presúvať smerom k maternici, ale tehotenským testom sa zatiaľ nedá nič zistiť.',
        bodyChanges: [
          'Tento týždeň ešte patrí do lekárskeho obdobia datovania okolo počatia; v tejto fáze zvyčajne nie je pozorovateľný žiadny telesný príznak.',
        ],
        toKnow: [
          'Väčšina tehotenských testov z moču sa stáva spoľahlivou približne od nasledujúceho týždňa, keď sa implantácia začne.',
        ],
      },
      hu: {
        babyDescription:
          'Ha megtörtént a megtermékenyítés, a petesejt osztódni kezd, és a méh felé halad, de terhességi teszttel még semmi sem mutatható ki.',
        bodyChanges: [
          'Ez a hét még a fogantatás körüli orvosi datálási időszakba tartozik; ebben a szakaszban általában nem észlelhető testi jel.',
        ],
        toKnow: [
          'A legtöbb vizeletes terhességi teszt nagyjából a következő héttől válik megbízhatóvá, amikor a beágyazódás megkezdődött.',
        ],
      },
      ro: {
        babyDescription:
          'Dacă fecundarea a avut loc, ovulul începe să se dividă și înaintează spre uter, dar încă nu se poate detecta nimic printr-un test de sarcină.',
        bodyChanges: [
          'Această săptămână se încadrează încă în perioada medicală de datare din jurul concepției; în general, niciun semn fizic nu este perceptibil în această etapă.',
        ],
        toKnow: [
          'Majoritatea testelor de sarcină urinare devin fiabile începând cu săptămâna următoare, după ce nidația a început.',
        ],
      },
      bg: {
        babyDescription:
          'Ако е настъпило оплождане, яйцеклетката започва да се дели и да се придвижва към матката, но още нищо не се открива с тест за бременност.',
        bodyChanges: [
          'Тази седмица все още попада в медицинския период на датиране около зачеването; обикновено не се забелязва никакъв физически признак на този етап.',
        ],
        toKnow: [
          'Повечето уринни тестове за бременност стават надеждни от около следващата седмица, след като е започнала имплантацията.',
        ],
      },
      sr: {
        babyDescription:
          'Ако је оплођење настало, јајна ћелија почиње да се дели и креће ка материци, али тестом за трудноћу још ништа није откривено.',
        bodyChanges: [
          'Ова недеља још спада у медицински период датирања око зачећа; обично се у овој фази не примећује никакав физички знак.',
        ],
        toKnow: [
          'Већина тестова за трудноћу из урина постаје поуздана од отприлике следеће недеље, пошто је имплантација започела.',
        ],
      },
      hr: {
        babyDescription:
          'Ako je oplodnja nastupila, jajna stanica se počinje dijeliti i kreće prema maternici, ali testom na trudnoću još se ništa ne otkriva.',
        bodyChanges: [
          'Ovaj tjedan još spada u medicinsko razdoblje datiranja oko začeća; u ovoj fazi obično se ne primjećuje nikakav tjelesni znak.',
        ],
        toKnow: [
          'Većina testova na trudnoću iz mokraće postaje pouzdana otprilike od sljedećeg tjedna, nakon što je implantacija započela.',
        ],
      },
      bs: {
        babyDescription:
          'Ako je oplodnja nastupila, jajna stanica se počinje dijeliti i kreće prema maternici, ali testom na trudnoću još se ništa ne otkriva.',
        bodyChanges: [
          'Ova sedmica još spada u medicinsko razdoblje datiranja oko začeća; u ovoj fazi obično se ne primjećuje nikakav tjelesni znak.',
        ],
        toKnow: [
          'Većina testova na trudnoću iz mokraće postaje pouzdana otprilike od sljedećeg sedmice, nakon što je implantacija započela.',
        ],
      },
      sl: {
        babyDescription:
          'Če je oploditev nastopila, se jajčna celica začne deliti in potuje proti maternici, vendar se s testom nosečnosti še nič ne zazna.',
        bodyChanges: [
          'Ta teden še sodi v medicinsko obdobje datiranja okoli spočetja; v tej fazi se običajno ne opazi noben telesni znak.',
        ],
        toKnow: [
          'Večina testov nosečnosti iz seča postane zanesljiva približno od naslednjega tedna, ko se je implantacija začela.',
        ],
      },
      ne: {
        babyDescription:
          'निषेचन भएको भए, अण्डा विभाजित हुन थाल्छ र गर्भाशयतिर सर्छ, तर गर्भावस्था परीक्षणले अझै केही पत्ता लगाउँदैन।',
        bodyChanges: [
          'यो हप्ता अझै गर्भधारणको वरिपरिको चिकित्सकीय मिति निर्धारणको अवधिभित्र पर्छ; यस चरणमा सामान्यतया कुनै शारीरिक संकेत देखिँदैन।',
        ],
        toKnow: [
          'अधिकांश पिसाबको गर्भावस्था परीक्षण अर्को हप्तादेखि, गर्भस्थापना सुरु भएपछि, भरपर्दो हुन्छ।',
        ],
      },
      si: {
        babyDescription:
          'සංසේචනය සිදු වී ඇත්නම්, ඩිම්බය බෙදීමට සහ ගර්භාෂය දෙසට ගමන් කිරීමට පටන් ගනී, නමුත් ගර්භණී පරීක්ෂණයකින් තවම කිසිවක් හඳුනාගත නොහැක.',
        bodyChanges: [
          'මෙම සතිය තවමත් ගර්භ ගැනීම වටා වෛද්‍ය දිනනිර්ණය කාලයට අයත් වේ; මෙම අවධියේදී කිසිදු ශාරීරික සලකුණක් සාමාන්‍යයෙන් කැපී නොපෙනේ.',
        ],
        toKnow: [
          'බොහෝ මුත්‍රා ගර්භණී පරීක්ෂණ, ගර්භාෂයේ තැන්පත් වීම ආරම්භ වූ පසු, ඊළඟ සතියේ පමණ සිට විශ්වාසදායක වේ.',
        ],
      },
      th: {
        babyDescription:
          'หากเกิดการปฏิสนธิ ไข่เริ่มแบ่งตัวและเคลื่อนไปยังมดลูก แต่ชุดตรวจการตั้งครรภ์ยังตรวจไม่พบ',
        bodyChanges: [
          'สัปดาห์นี้ยังอยู่ในช่วงกำหนดอายุครรภ์ทางการแพทย์รอบการปฏิสนธิ โดยทั่วไปยังไม่มีสัญญาณทางกายที่สังเกตได้ในระยะนี้',
        ],
        toKnow: [
          'ชุดตรวจการตั้งครรภ์ทางปัสสาวะส่วนใหญ่เชื่อถือได้ตั้งแต่ราวสัปดาห์ถัดไป เมื่อการฝังตัวเริ่มขึ้นแล้ว',
        ],
      },
      vi: {
        babyDescription:
          'Nếu quá trình thụ tinh đã diễn ra, trứng bắt đầu phân chia và di chuyển về phía tử cung, nhưng que thử thai chưa phát hiện được gì.',
        bodyChanges: [
          'Tuần này vẫn nằm trong giai đoạn xác định tuổi thai y khoa quanh thời điểm thụ thai; ở giai đoạn này thường chưa nhận thấy dấu hiệu thể chất nào.',
        ],
        toKnow: [
          'Hầu hết các que thử thai bằng nước tiểu trở nên đáng tin cậy từ khoảng tuần tiếp theo, khi sự làm tổ đã bắt đầu.',
        ],
      },
      uz: {
        babyDescription:
          'Agar urugʻlanish sodir boʻlgan boʻlsa, tuxum hujayra boʻlina boshlaydi va bachadon tomon harakatlanadi, ammo homiladorlik testi bilan hali hech narsa aniqlanmaydi.',
        bodyChanges: [
          'Bu hafta hali urugʻlanish atrofidagi tibbiy muddatni aniqlash davriga kiradi; bu bosqichda odatda hech qanday jismoniy belgi sezilmaydi.',
        ],
        toKnow: [
          'Siydik homiladorlik testlarining aksariyati implantatsiya boshlangandan keyin, taxminan keyingi haftadan ishonchli boʻladi.',
        ],
      },
      az: {
        babyDescription:
          'Mayalanma baş veribsə, yumurtahüceyrə bölünməyə və uşaqlığa doğru hərəkət etməyə başlayır, lakin hamiləlik testi ilə hələ heç nə aşkar edilə bilməz.',
        bodyChanges: [
          'Bu həftə hələ də mayalanma ətrafındakı tibbi tarixləndirmə dövrünə daxildir; bu mərhələdə adətən heç bir fiziki əlamət hiss olunmur.',
        ],
        toKnow: [
          'Sidik hamiləlik testlərinin əksəriyyəti implantasiya başladıqdan sonra təxminən növbəti həftədən etibarlı olur.',
        ],
      },
      ka: {
        babyDescription:
          'თუ განაყოფიერება მოხდა, კვერცხუჯრედი იწყებს გაყოფას და საშვილოსნოსკენ მოძრაობას, მაგრამ ორსულობის ტესტით ჯერ არაფერი აღმოჩნდება.',
        bodyChanges: [
          'ეს კვირა ჯერ კიდევ ჩასახვის გარშემო სამედიცინო დათარიღების პერიოდში შედის; ამ ეტაპზე ფიზიკური ნიშანი, როგორც წესი, არ იგრძნობა.',
        ],
        toKnow: [
          'შარდის ორსულობის ტესტების უმეტესობა მომდევნო კვირიდან ხდება სანდო, იმპლანტაციის დაწყების შემდეგ.',
        ],
      },
      hy: {
        babyDescription:
          'Եթե բեղմնավորումը տեղի է ունեցել, ձվաբջիջը սկսում է բաժանվել և շարժվել դեպի արգանդ, սակայն հղիության թեստով դեռ ոչինչ հայտնաբերելի չէ:',
        bodyChanges: [
          'Այս շաբաթը դեռ մտնում է հղիացման շուրջ բժշկական ժամկետավորման շրջանի մեջ. այս փուլում սովորաբար նկատելի ֆիզիկական նշան չկա:',
        ],
        toKnow: [
          'Մեզով հղիության թեստերի մեծ մասը դառնում է հուսալի մոտ հաջորդ շաբաթից, երբ իմպլանտացիան սկսվել է:',
        ],
      },
      tg: {
        babyDescription:
          'Агар бордоршавӣ рух дода бошад, тухмҳуҷайра ба тақсим шудан ва ҳаракат ба сӯи бачадон оғоз мекунад, вале санҷиши ҳомиладорӣ ҳанӯз чизеро ошкор намекунад.',
        bodyChanges: [
          'Ин ҳафта ҳанӯз ба давраи ҳисоби тиббии атрофи ҳомиладоршавӣ дохил мешавад; дар ин марҳила одатан ягон нишонаи ҷисмонӣ намоён нест.',
        ],
        toKnow: [
          'Аксари санҷишҳои пешоби ҳомиладорӣ аз ҳафтаи оянда, вақте ки имплантатсия оғоз шуд, боэътимод мешаванд.',
        ],
      },
      ky: {
        babyDescription:
          'Эгер уруктануу болгон болсо, жумурткалуу клетка бөлүнүп, жатынга карай жыла баштайт, бирок курсактуулук тести менен азырынча эч нерсе аныкталбайт.',
        bodyChanges: [
          'Бул жума дагы эле боюна бүтүүнүн тегерегиндеги медициналык мөөнөттөө мезгилине кирет; бул этапта эч кандай физикалык белги адатта байкалбайт.',
        ],
        toKnow: [
          'Көпчүлүк заара курсактуулук тесттери имплантация башталгандан кийин, кийинки жумадан тартып ишенимдүү болот.',
        ],
      },
      tk: {
        babyDescription:
          'Tohumlanma bolan bolsa, ýumurtga bölünip, ýatga tarap hereket edip başlaýar, ýöne göwrelilik synagy bilen heniz hiç zat anyklanmaýar.',
        bodyChanges: [
          'Bu hepde heniz göwreli bolmagyň töwereginde lukmançylyk wagt kesgitleme döwrüne girýär; bu tapgyrda hiç hili fiziki alamat adatça duýulmaýar.',
        ],
        toKnow: [
          'Peşew göwrelilik synaglarynyň köpüsi implantasiýa başlanandan soň, takmynan indiki hepdeden ygtybarly bolýar.',
        ],
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
      da: {
        babyDescription: 'Hvis befrugtning er sket, begynder ægget at dele sig og bevæge sig mod livmoderen, men intet kan endnu detekteres af en graviditetstest.',
        bodyChanges: [
          'Denne uge falder stadig inden for den medicinske dateringsperiode omkring undfangelsen; der kan generelt ikke mærkes nogen fysiske tegn på dette stadie.',
        ],
        toKnow: [
          'De fleste urinbaserede graviditetstests bliver pålidelige fra og med den følgende uge, når implantationen er begyndt.',
        ],
      },
      sv: {
        babyDescription: 'Hvis befrugtning ar sket, begynder ägget at dele sig och beväge sig mod livmoderen, men intet kan endnu detekteres av en graviditetstest.',
        bodyChanges: [
          'Denne vecka falder fortfarande inden for den medicinske dateringsperiode omkring undfangelsen; der kan generelt inte märkes nogen fysiske tegn på dette stadie.',
        ],
        toKnow: [
          'De fleste urinbaserede graviditetstests bliver pålidelige fran och med den fölgende uge, når implantationen ar begyndt.',
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
      nb: {
        babyDescription:
          'Embryoet har nettopp festet seg i livmorveggen. Fostersekken og plommesekken, som vil gi det næring de aller første dagene, er i ferd med å dannes.',
        length: 'Omtrent 2 mm',
        comparison: 'Valmuefrø',
        bodyChanges: [
          'Noen merker ingen tegn ennå på dette svært tidlige stadiet.',
          'En graviditetstest på urin kan vanligvis påvise graviditet fra denne uken.',
        ],
        toKnow: ['Dette er vanligvis tidspunktet da en graviditetstest kan begynne å gi et positivt resultat.'],
      },
      pl: {
        babyDescription:
          'Zarodek właśnie zagnieździł się w ścianie macicy. Tworzą się pęcherzyk owodniowy i pęcherzyk żółtkowy, które będą go odżywiać w pierwszych dniach.',
        length: 'Około 2 mm',
        comparison: 'Ziarno maku',
        bodyChanges: [
          'Niektóre osoby na tym bardzo wczesnym etapie nie zauważają jeszcze żadnych objawów.',
          'Test ciążowy z moczu może zazwyczaj wykryć ciążę od tego tygodnia.',
        ],
        toKnow: ['To zwykły moment, w którym test ciążowy może zacząć dawać wynik dodatni.'],
      },
      uk: {
        babyDescription:
          'Ембріон щойно імплантувався в стінку матки. Формуються амніотичний міхур і жовтковий мішок, які будуть живити його в перші дні.',
        length: 'Приблизно 2 мм',
        comparison: 'Макове зерня',
        bodyChanges: [
          'Деякі жінки на цьому дуже ранньому етапі ще не помічають жодних ознак.',
          'Тест на вагітність із сечі зазвичай може виявити вагітність з цього тижня.',
        ],
        toKnow: ['Це звичайний момент, коли тест на вагітність може почати давати позитивний результат.'],
      },
      cs: {
        babyDescription:
          'Embryo se právě uhnízdilo ve stěně dělohy. Tvoří se plodový vak a žloutkový váček, které ho budou živit v prvních dnech.',
        length: 'Asi 2 mm',
        comparison: 'Mákové semínko',
        bodyChanges: [
          'Některé ženy si v této velmi rané fázi ještě nevšimnou žádných příznaků.',
          'Těhotenský test z moči obvykle dokáže těhotenství zachytit od tohoto týdne.',
        ],
        toKnow: ['Je to obvyklá doba, kdy může těhotenský test začít ukazovat pozitivní výsledek.'],
      },
      sk: {
        babyDescription:
          'Embryo sa práve uhniezdilo v stene maternice. Tvorí sa plodový vak a žĺtkový vak, ktoré ho budú v úplne prvých dňoch živiť.',
        length: 'Približne 2 mm',
        comparison: 'Makové semienko',
        bodyChanges: [
          'Niektoré ženy si v tejto veľmi skorej fáze ešte nevšimnú žiadny znak.',
          'Tehotenský test z moču môže tehotenstvo zvyčajne zistiť od tohto týždňa.',
        ],
        toKnow: [
          'Je to obvyklý čas, keď môže tehotenský test začať dávať pozitívny výsledok.',
        ],
      },
      hu: {
        babyDescription:
          'Az embrió éppen beágyazódott a méh falába. Kialakul a magzatburok és a szikzacskó, amelyek az első napokban táplálják.',
        length: 'Körülbelül 2 mm',
        comparison: 'Mákszem',
        bodyChanges: [
          'Egyes nők ebben a nagyon korai szakaszban még nem vesznek észre semmilyen jelet.',
          'A vizeletes terhességi teszt általában ettől a héttől ki tudja mutatni a terhességet.',
        ],
        toKnow: [
          'Ez az a szokásos időpont, amikor a terhességi teszt pozitív eredményt kezdhet adni.',
        ],
      },
      ro: {
        babyDescription:
          'Embrionul tocmai s-a implantat în peretele uterin. Se formează sacul amniotic și sacul vitelin, care îl vor hrăni în primele zile.',
        length: 'Aproximativ 2 mm',
        comparison: 'Sămânță de mac',
        bodyChanges: [
          'Unele persoane nu observă încă niciun semn în această etapă foarte timpurie.',
          'Un test de sarcină urinar poate detecta în general sarcina începând cu această săptămână.',
        ],
        toKnow: [
          'Acesta este momentul obișnuit în care un test de sarcină poate începe să dea un rezultat pozitiv.',
        ],
      },
      bg: {
        babyDescription:
          'Ембрионът току-що се е имплантирал в стената на матката. Формират се амниотичната торбичка и жълтъчната торбичка, които ще го хранят през първите дни.',
        length: 'Около 2 мм',
        comparison: 'Маково семе',
        bodyChanges: [
          'Някои хора още не забелязват никакъв признак на този много ранен етап.',
          'Уринният тест за бременност обикновено може да открие бременността от тази седмица нататък.',
        ],
        toKnow: [
          'Това е обичайният момент, в който тестът за бременност може да започне да дава положителен резултат.',
        ],
      },
      sr: {
        babyDescription:
          'Ембрион се управо имплантирао у зид материце. Формирају се амнионска кеса и жуманчана кеса, које ће га хранити првих дана.',
        length: 'Око 2 мм',
        comparison: 'Семе мака',
        bodyChanges: [
          'Неке особе у овој веома раној фази још не примећују никакав знак.',
          'Тест за трудноћу из урина обично може открити трудноћу од ове недеље.',
        ],
        toKnow: [
          'Ово је уобичајено време када тест за трудноћу може почети да даје позитиван резултат.',
        ],
      },
      hr: {
        babyDescription:
          'Embrij se upravo ugnijezdio u stijenku maternice. Oblikuju se plodna ovojnica i žumanjčana vrećica, koje će ga hraniti prvih dana.',
        length: 'Oko 2 mm',
        comparison: 'Zrno maka',
        bodyChanges: [
          'Neke osobe u ovoj vrlo ranoj fazi još ne primjećuju nikakav znak.',
          'Test na trudnoću iz mokraće obično može otkriti trudnoću od ovog tjedna.',
        ],
        toKnow: [
          'Ovo je uobičajeno vrijeme kada test na trudnoću može početi davati pozitivan rezultat.',
        ],
      },
      bs: {
        babyDescription:
          'Embrij se upravo ugnijezdio u stijenku maternice. Oblikuju se plodna ovojnica i žumanjčana vrećica, koje će ga hraniti prvih dana.',
        length: 'Oko 2 mm',
        comparison: 'Zrno maka',
        bodyChanges: [
          'Neke osobe u ovoj vrlo ranoj fazi još ne primjećuju nikakav znak.',
          'Test na trudnoću iz mokraće obično može otkriti trudnoću od ove sedmice.',
        ],
        toKnow: [
          'Ovo je uobičajeno vrijeme kada test na trudnoću može početi davati pozitivan rezultat.',
        ],
      },
      sl: {
        babyDescription:
          'Zarodek se je pravkar ugnezdil v steno maternice. Oblikujeta se plodovna ovojnica in rumenjakova vrečka, ki ga bosta hranili prve dni.',
        length: 'Približno 2 mm',
        comparison: 'Makovo zrno',
        bodyChanges: [
          'Nekatere osebe v tej zelo zgodnji fazi še ne opazijo nobenega znaka.',
          'Test nosečnosti iz seča lahko običajno zazna nosečnost od tega tedna.',
        ],
        toKnow: [
          'To je običajen čas, ko lahko test nosečnosti začne kazati pozitiven rezultat.',
        ],
      },
      ne: {
        babyDescription:
          'भ्रूण भर्खरै गर्भाशयको भित्तामा बसेको छ। उल्ब थैली र पहिला केही दिन यसलाई पोषण दिने पित्त थैली बन्दै छन्।',
        length: 'करिब 2 मिमि',
        comparison: 'खसखसको दाना',
        bodyChanges: [
          'केही मानिसले यो निकै सुरुको चरणमा अझै कुनै संकेत देख्दैनन्।',
          'पिसाबको गर्भावस्था परीक्षणले यो हप्तादेखि सामान्यतया गर्भावस्था पत्ता लगाउन सक्छ।',
        ],
        toKnow: [
          'यो सामान्य समय हो जब गर्भावस्था परीक्षणले सकारात्मक नतिजा दिन सुरु गर्न सक्छ।',
        ],
      },
      si: {
        babyDescription:
          'කළලය ගර්භාෂ බිත්තියේ තැන්පත් වී ඇත. පළමු දින කිහිපයේ එයට පෝෂණය සපයන ඇම්නියොටික් පටලය සහ කහ මදය පටලය සෑදෙමින් පවතී.',
        length: 'මි.මී. 2 පමණ',
        comparison: 'පොපි ඇටයක්',
        bodyChanges: [
          'සමහර පුද්ගලයන් මෙම ඉතා මුල් අවධියේ කිසිදු සලකුණක් තවම නොදකිති.',
          'මුත්‍රා ගර්භණී පරීක්ෂණයකට මෙම සතියේ සිට ගර්භණී කාලය සාමාන්‍යයෙන් හඳුනාගත හැක.',
        ],
        toKnow: [
          'ගර්භණී පරීක්ෂණයකට ධනාත්මක ප්‍රතිඵලයක් දීමට පටන් ගත හැකි සුපුරුදු වේලාව මෙයයි.',
        ],
      },
      th: {
        babyDescription:
          'ตัวอ่อนเพิ่งฝังตัวในผนังมดลูก ถุงน้ำคร่ำและถุงไข่แดงซึ่งจะให้อาหารแก่ตัวอ่อนในวันแรก ๆ กำลังก่อตัว',
        length: 'ประมาณ 2 มม.',
        comparison: 'เมล็ดป๊อปปี้',
        bodyChanges: [
          'บางคนยังไม่สังเกตเห็นสัญญาณใด ๆ ในระยะแรกสุดนี้',
          'โดยทั่วไปชุดตรวจการตั้งครรภ์ทางปัสสาวะตรวจพบการตั้งครรภ์ได้ตั้งแต่สัปดาห์นี้เป็นต้นไป',
        ],
        toKnow: [
          'นี่คือช่วงเวลาปกติที่ชุดตรวจการตั้งครรภ์เริ่มให้ผลบวกได้',
        ],
      },
      vi: {
        babyDescription:
          'Phôi thai vừa làm tổ vào thành tử cung. Túi ối và túi noãn hoàng, sẽ nuôi dưỡng nó trong những ngày đầu tiên, đang hình thành.',
        length: 'Khoảng 2 mm',
        comparison: 'Hạt anh túc',
        bodyChanges: [
          'Một số người chưa nhận thấy dấu hiệu nào ở giai đoạn rất sớm này.',
          'Que thử thai bằng nước tiểu thường có thể phát hiện thai kỳ từ tuần này trở đi.',
        ],
        toKnow: [
          'Đây là thời điểm thường thấy que thử thai có thể bắt đầu cho kết quả dương tính.',
        ],
      },
      uz: {
        babyDescription:
          'Embrion bachadon devoriga endigina oʻrnashdi. Dastlabki kunlarda uni oziqlantiradigan amnion pufagi va sarigʻlik qopchasi shakllanmoqda.',
        length: 'Taxminan 2 mm',
        comparison: 'Mak urugʻi',
        bodyChanges: [
          'Baʼzi odamlar bu juda erta bosqichda hali hech qanday belgini sezmaydi.',
          'Siydik homiladorlik testi odatda shu haftadan boshlab homiladorlikni aniqlay oladi.',
        ],
        toKnow: [
          'Bu homiladorlik testi ijobiy natija bera boshlashi mumkin boʻlgan odatiy vaqt.',
        ],
      },
      az: {
        babyDescription:
          'Embrion uşaqlıq divarında implantasiya olunub. Ən ilk günlərdə onu qidalandıracaq amnion kisəsi və sarılıq kisəsi formalaşır.',
        length: 'Təxminən 2 mm',
        comparison: 'Xaşxaş toxumu',
        bodyChanges: [
          'Bəziləri bu çox erkən mərhələdə hələ heç bir əlamət hiss etmir.',
          'Sidik hamiləlik testi adətən bu həftədən etibarən hamiləliyi aşkar edə bilir.',
        ],
        toKnow: [
          'Bu, hamiləlik testinin müsbət nəticə verməyə başlaya biləcəyi adi vaxtdır.',
        ],
      },
      ka: {
        babyDescription:
          'ემბრიონი ახლახან დამაგრდა საშვილოსნოს კედელზე. ყალიბდება ამნიონური პარკი და ყვითრის პარკი, რომლებიც პირველ დღეებში მას გამოკვებავს.',
        length: 'დაახლოებით 2 მმ',
        comparison: 'ყაყაჩოს მარცვალი',
        bodyChanges: [
          'ზოგი ამ ძალიან ადრეულ ეტაპზე ჯერ არანაირ ნიშანს არ ამჩნევს.',
          'შარდის ორსულობის ტესტს, როგორც წესი, ამ კვირიდან უკვე შეუძლია ორსულობის აღმოჩენა.',
        ],
        toKnow: [
          'ეს ჩვეულებრივი დროა, როცა ორსულობის ტესტმა შეიძლება დადებითი შედეგის ჩვენება დაიწყოს.',
        ],
      },
      hy: {
        babyDescription:
          'Սաղմը հենց նոր ամրացել է արգանդի պատին: Ձևավորվում են ամնիոտիկ պարկը և դեղնուցային պարկը, որոնք առաջին օրերին կսնուցեն այն:',
        length: 'Մոտ 2 մմ',
        comparison: 'Կակաչի սերմ',
        bodyChanges: [
          'Որոշ մարդիկ այս շատ վաղ փուլում դեռ ոչ մի նշան չեն նկատում:',
          'Մեզով հղիության թեստը սովորաբար կարող է հայտնաբերել հղիությունը այս շաբաթից սկսած:',
        ],
        toKnow: [
          'Սա սովորական ժամանակն է, երբ հղիության թեստը կարող է սկսել դրական արդյունք տալ:',
        ],
      },
      tg: {
        babyDescription:
          'Ҷанин ҳамин ҳоло дар девораи бачадон ҷойгир шуд. Халтаи амниотикӣ ва халтаи зардоб, ки дар рӯзҳои аввал онро ғизо хоҳанд дод, ташаккул меёбанд.',
        length: 'Тақрибан 2 мм',
        comparison: 'Донаи кӯкнор',
        bodyChanges: [
          'Баъзе одамон дар ин марҳилаи хеле барвақт ҳанӯз ягон нишонаро пай намебаранд.',
          'Санҷиши пешоби ҳомиладорӣ одатан метавонад ҳомиладориро аз ҳамин ҳафта ошкор кунад.',
        ],
        toKnow: [
          'Ин вақти маъмулест, ки санҷиши ҳомиладорӣ метавонад натиҷаи мусбат диҳад.',
        ],
      },
      ky: {
        babyDescription:
          'Эмбрион жатындын дубалына жаңы эле орношту. Алгачкы күндөрдө аны азыктандыра турган амниотикалык баштык жана сарысы баштыгы түзүлүүдө.',
        length: 'Болжол менен 2 мм',
        comparison: 'Кара кашкаш уругу',
        bodyChanges: [
          'Айрым адамдар бул абдан эрте этапта азырынча эч кандай белги байкабайт.',
          'Заара курсактуулук тести бул жумадан баштап курсактуулукту адатта аныктай алат.',
        ],
        toKnow: [
          'Бул курсактуулук тести оң жыйынтык бере баштай турган адаттагы убакыт.',
        ],
      },
      tk: {
        babyDescription:
          'Embrion ýatgy diwaryna ýaňy ornaşdy. Ilkinji günlerde ony iýmitlendirjek amniotik haltajyk we sary haltajyk emele gelýär.',
        length: 'Takmynan 2 mm',
        comparison: 'Mak tohumy',
        bodyChanges: [
          'Käbir adamlar bu gaty ir tapgyrda heniz hiç hili alamat duýmaýar.',
          'Peşew göwrelilik synagy adatça şu hepdeden başlap göwreliligi anyklap biler.',
        ],
        toKnow: [
          'Bu göwrelilik synagynyň oňyn netije berip başlap biljek adaty wagty.',
        ],
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
      da: {
        babyDescription: 'Fosteret er netop implanteret i livmodervæggen. Fostervandsposen og blommesækken, som vil ernære det i de allerførste dage, dannes.',
        length: 'Ca. 2 mm',
        comparison: 'Valmuefrø',
        bodyChanges: [
          'Nogle mærker endnu intet tegn på dette meget tidlige stadie.',
          'En urinbaseret graviditetstest kan generelt påvise graviditet fra denne uge.',
        ],
        toKnow: [
          'Det er det sædvanlige tidspunkt, hvor en graviditetstest kan begynde at vise et positivt resultat.',
        ],
      },
      sv: {
        babyDescription: 'Fosteret ar netop implanteret i livmoderväggen. Fostervandsposen och blommesäkken, som vil ernäre det i de allerförste dage, dannes.',
        length: 'Ca. 2 mm',
        comparison: 'Valmuefrö',
        bodyChanges: [
          'Nogle märker endnu intet tegn på dette mycket tidlige stadie.',
          'En urinbaseret graviditetstest kan generelt påvise graviditet fran denne uge.',
        ],
        toKnow: [
          'Det ar det sädvanlige tidspunkt, hvor en graviditetstest kan begynde at vise et positivt resultat.',
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
      nb: {
        babyDescription:
          'Nervesystemet begynner å dannes, og hjertet, fortsatt bitte lite, er i ferd med å slå for første gang.',
        length: 'Omtrent 2 mm',
        comparison: 'Sesamfrø',
        bodyChanges: ['Uvanlig tretthet, lett kvalme eller ømme bryster kan dukke opp.'],
        toKnow: ['Dette er anbefalt tidspunkt for å bestille time hos helsepersonell for å starte svangerskapsomsorgen.'],
      },
      pl: {
        babyDescription:
          'Zaczyna się kształtować układ nerwowy, a serce, wciąż maleńkie, ma po raz pierwszy zabić.',
        length: 'Około 2 mm',
        comparison: 'Ziarno sezamu',
        bodyChanges: ['Mogą pojawić się nietypowe zmęczenie, lekkie nudności lub tkliwość piersi.'],
        toKnow: ['To zalecany moment na umówienie wizyty u specjalisty, aby rozpocząć opiekę w ciąży.'],
      },
      uk: {
        babyDescription:
          'Починає формуватися нервова система, а серце, ще крихітне, ось-ось уперше заб’ється.',
        length: 'Приблизно 2 мм',
        comparison: 'Зернятко кунжуту',
        bodyChanges: ['Можуть з’явитися незвична втома, легка нудота або болючість грудей.'],
        toKnow: ['Це рекомендований час записатися на візит до медичного фахівця, щоб розпочати догляд під час вагітності.'],
      },
      cs: {
        babyDescription:
          'Začíná se tvořit nervový systém a srdíčko, stále drobné, se chystá poprvé zabít.',
        length: 'Asi 2 mm',
        comparison: 'Sezamové semínko',
        bodyChanges: ['Může se objevit neobvyklá únava, mírná nevolnost nebo citlivost prsou.'],
        toKnow: ['Je to doporučená doba, kdy se objednat k zdravotnickému pracovníkovi a zahájit těhotenskou péči.'],
      },
      sk: {
        babyDescription:
          'Začína sa tvoriť nervový systém a srdce, ešte drobné, sa chystá prvýkrát zabiť.',
        length: 'Približne 2 mm',
        comparison: 'Sezamové semienko',
        bodyChanges: [
          'Môže sa objaviť nezvyčajná únava, mierna nevoľnosť alebo citlivosť prsníkov.',
        ],
        toKnow: [
          'Je to odporúčaný čas na objednanie sa k zdravotníckemu pracovníkovi, aby sa začala starostlivosť v tehotenstve.',
        ],
      },
      hu: {
        babyDescription:
          'Kialakulni kezd az idegrendszer, és a szív, még aprócska, készül először dobbanni.',
        length: 'Körülbelül 2 mm',
        comparison: 'Szezámmag',
        bodyChanges: [
          'Szokatlan fáradtság, enyhe hányinger vagy mellfeszülés jelentkezhet.',
        ],
        toKnow: [
          'Ez az ajánlott időpont arra, hogy egészségügyi szakemberhez időpontot kérj a terhesgondozás megkezdéséhez.',
        ],
      },
      ro: {
        babyDescription:
          'Sistemul nervos începe să se formeze, iar inima, încă minusculă, este pe cale să bată pentru prima dată.',
        length: 'Aproximativ 2 mm',
        comparison: 'Sămânță de susan',
        bodyChanges: [
          'Pot apărea oboseală neobișnuită, greață ușoară sau sensibilitate a sânilor.',
        ],
        toKnow: [
          'Acesta este momentul recomandat pentru a face o programare la un profesionist din domeniul sănătății pentru a începe urmărirea sarcinii.',
        ],
      },
      bg: {
        babyDescription:
          'Нервната система започва да се формира, а сърцето, все още мъничко, е на път да затупти за първи път.',
        length: 'Около 2 мм',
        comparison: 'Сусамово семе',
        bodyChanges: [
          'Може да се появят необичайна умора, леко гадене или чувствителност на гърдите.',
        ],
        toKnow: [
          'Това е препоръчителният момент да си запишеш час при здравен специалист, за да започне проследяването на бременността.',
        ],
      },
      sr: {
        babyDescription:
          'Нервни систем почиње да се формира, а срце, још мало, спрема се да закуца први пут.',
        length: 'Око 2 мм',
        comparison: 'Семе сусама',
        bodyChanges: [
          'Могу се појавити необичан умор, блага мучнина или осетљивост дојки.',
        ],
        toKnow: [
          'Ово је препоручени тренутак да заказеш преглед код здравственог радника да би почело праћење трудноће.',
        ],
      },
      hr: {
        babyDescription:
          'Živčani sustav se počinje oblikovati, a srce, još maleno, sprema se prvi put zakucati.',
        length: 'Oko 2 mm',
        comparison: 'Zrno sezama',
        bodyChanges: [
          'Mogu se pojaviti neobičan umor, blaga mučnina ili osjetljivost grudi.',
        ],
        toKnow: [
          'Ovo je preporučeni trenutak za zakazivanje pregleda kod zdravstvenog djelatnika radi početka praćenja trudnoće.',
        ],
      },
      bs: {
        babyDescription:
          'Živčani sistem se počinje oblikovati, a srce, još maleno, sprema se prvi put zakucati.',
        length: 'Oko 2 mm',
        comparison: 'Zrno sezama',
        bodyChanges: [
          'Mogu se pojaviti neobičan umor, blaga mučnina ili osjetljivost grudi.',
        ],
        toKnow: [
          'Ovo je preporučeni trenutak za zakazivanje pregleda kod zdravstvenog radnika radi početka praćenja trudnoće.',
        ],
      },
      sl: {
        babyDescription:
          'Živčni sistem se začne oblikovati, srce, še majhno, pa se pripravlja, da prvič zabije.',
        length: 'Približno 2 mm',
        comparison: 'Sezamovo seme',
        bodyChanges: [
          'Pojavijo se lahko nenavadna utrujenost, blaga slabost ali občutljivost prsi.',
        ],
        toKnow: [
          'To je priporočen trenutek, da se naročiš na pregled pri zdravstvenem delavcu za začetek spremljanja nosečnosti.',
        ],
      },
      ne: {
        babyDescription:
          'स्नायु प्रणाली बन्न थाल्छ, र अझै सानो मुटु पहिलो पटक धड्कन लाग्दै छ।',
        length: 'करिब 2 मिमि',
        comparison: 'तिलको दाना',
        bodyChanges: [
          'असामान्य थकान, हल्का वाकवाकी, वा स्तनमा दुखाइ देखिन सक्छ।',
        ],
        toKnow: [
          'गर्भावस्थाको हेरचाह सुरु गर्न स्वास्थ्यकर्मीसँग भेटघाट तय गर्ने यो सिफारिस गरिएको समय हो।',
        ],
      },
      si: {
        babyDescription:
          'ස්නායු පද්ධතිය සෑදීමට පටන් ගන්නා අතර, තවමත් කුඩා හදවත පළමු වරට ගැහීමට ආසන්නයි.',
        length: 'මි.මී. 2 පමණ',
        comparison: 'තල ඇටයක්',
        bodyChanges: [
          'අසාමාන්‍ය වෙහෙස, සුළු ඔක්කාරය, හෝ පියයුරු වේදනාව දිස්විය හැක.',
        ],
        toKnow: [
          'ගර්භණී සත්කාර ආරම්භ කිරීමට සෞඛ්‍ය වෘත්තිකයෙකු සමඟ හමුවීමක් ලබාගැනීමට නිර්දේශිත වේලාව මෙයයි.',
        ],
      },
      th: {
        babyDescription:
          'ระบบประสาทเริ่มก่อตัว และหัวใจซึ่งยังเล็กมากกำลังจะเต้นเป็นครั้งแรก',
        length: 'ประมาณ 2 มม.',
        comparison: 'เมล็ดงา',
        bodyChanges: [
          'อาจมีอาการเหนื่อยล้าผิดปกติ คลื่นไส้เล็กน้อย หรือเต้านมคัด',
        ],
        toKnow: [
          'นี่คือเวลาที่แนะนำให้นัดพบบุคลากรทางการแพทย์เพื่อเริ่มการดูแลครรภ์',
        ],
      },
      vi: {
        babyDescription:
          'Hệ thần kinh bắt đầu hình thành, và trái tim, vẫn còn rất nhỏ, sắp đập lần đầu tiên.',
        length: 'Khoảng 2 mm',
        comparison: 'Hạt mè',
        bodyChanges: [
          'Có thể xuất hiện mệt mỏi bất thường, buồn nôn nhẹ hoặc căng tức ngực.',
        ],
        toKnow: [
          'Đây là thời điểm được khuyến nghị để đặt lịch hẹn với nhân viên y tế nhằm bắt đầu theo dõi thai kỳ.',
        ],
      },
      uz: {
        babyDescription:
          'Asab tizimi shakllana boshlaydi, hali kichkina yurak esa birinchi marta urishga tayyorlanmoqda.',
        length: 'Taxminan 2 mm',
        comparison: 'Kunjut urugʻi',
        bodyChanges: [
          'Odatdan tashqari charchoq, yengil koʻngil aynishi yoki koʻkrakning sezgirligi paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Bu homiladorlik nazoratini boshlash uchun sogʻliqni saqlash mutaxassisiga yozilishning tavsiya etilgan vaqti.',
        ],
      },
      az: {
        babyDescription:
          'Sinir sistemi formalaşmağa başlayır və hələ kiçik olan ürək ilk dəfə döyünmək üzrədir.',
        length: 'Təxminən 2 mm',
        comparison: 'Küncüt toxumu',
        bodyChanges: [
          'Qeyri-adi yorğunluq, yüngül ürəkbulanma və ya döşün həssaslığı görünə bilər.',
        ],
        toKnow: [
          'Bu, hamiləlik qayğısına başlamaq üçün tibb işçisinə qəbula yazılmaq üçün tövsiyə olunan vaxtdır.',
        ],
      },
      ka: {
        babyDescription:
          'ნერვული სისტემა ყალიბდება, ხოლო გული, ჯერ კიდევ ძალიან პატარა, პირველად ფეთქვის წინაა.',
        length: 'დაახლოებით 2 მმ',
        comparison: 'სეზამის მარცვალი',
        bodyChanges: [
          'შეიძლება გამოჩნდეს უჩვეულო დაღლილობა, მსუბუქი გულისრევა ან მკერდის სიმტკივნე.',
        ],
        toKnow: [
          'ეს რეკომენდებული დროა, რომ ჯანდაცვის სპეციალისტთან ვიზიტი დაინიშნოს ორსულობის მეთვალყურეობის დასაწყებად.',
        ],
      },
      hy: {
        babyDescription:
          'Նյարդային համակարգը սկսում է ձևավորվել, և սիրտը, դեռ փոքրիկ, պատրաստվում է առաջին անգամ բաբախել:',
        length: 'Մոտ 2 մմ',
        comparison: 'Քունջութի հատիկ',
        bodyChanges: [
          'Կարող են հայտնվել անսովոր հոգնածություն, թեթև սրտխառնոց կամ կրծքի ցավոտություն:',
        ],
        toKnow: [
          'Սա առողջապահության մասնագետի մոտ այց նշանակելու խորհուրդ տրվող ժամանակն է՝ հղիության խնամքը սկսելու համար:',
        ],
      },
      tg: {
        babyDescription:
          'Системаи асаб ташаккул меёбад ва дил, ки ҳанӯз хурдакак аст, ба зудӣ бори аввал метапад.',
        length: 'Тақрибан 2 мм',
        comparison: 'Донаи кунҷид',
        bodyChanges: [
          'Хастагии ғайриоддӣ, беҳузурии сабук ё ҳассосияти пистон метавонад пайдо шавад.',
        ],
        toKnow: [
          'Ин вақти тавсияшуда барои навбат гирифтан ба мутахассиси соҳаи тиб барои оғози нигоҳубини ҳомиладорӣ аст.',
        ],
      },
      ky: {
        babyDescription:
          'Нерв системасы түзүлө баштайт, ал эми дагы эле кичинекей жүрөк алгачкы жолу согуп баштоого жакын.',
        length: 'Болжол менен 2 мм',
        comparison: 'Күнжүт уругу',
        bodyChanges: [
          'Адаттан тыш чарчоо, жеңил көңүл айлануу же көкүрөктүн сезгичтиги пайда болушу мүмкүн.',
        ],
        toKnow: [
          'Бул курсактуулукка кам көрүүнү баштоо үчүн ден соолук сактоо адисине жазылуунун сунушталган убактысы.',
        ],
      },
      tk: {
        babyDescription:
          'Nerw ulgamy emele gelip başlaýar we heniz kiçijik ýürek ilkinji gezek urmaga taýýarlanýar.',
        length: 'Takmynan 2 mm',
        comparison: 'Kunjut tohumy',
        bodyChanges: [
          'Adaty däl ýadawlyk, ýeňil ýüregiň bulanmagy ýa-da döşüň duýgurlygy peýda bolup biler.',
        ],
        toKnow: [
          'Bu göwrelilik idegini başlamak üçin saglyk hünärmeni bilen kabul ediş ýazdyrmak maslahat berilýän wagt.',
        ],
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
      da: {
        babyDescription: 'Nervesystemet begynder at dannes, og hjertet, stadig lille, er ved at slå for første gang.',
        length: 'Ca. 2 mm',
        comparison: 'Sesamfrø',
        bodyChanges: [
          'Usædvanlig træthed, let kvalme eller ømme bryster kan begynde at optræde.',
        ],
        toKnow: [
          'Det er det anbefalede tidspunkt at bestille en tid hos en sundhedsprofessionel for at starte graviditetsforløbet.',
        ],
      },
      sv: {
        babyDescription: 'Nervesystemet begynder at dannes, och hjertet, fortfarande lille, ar ved at slå for förste gang.',
        length: 'Ca. 2 mm',
        comparison: 'Sesamfrö',
        bodyChanges: [
          'Usädvanlig träthed, let kvalme eller ömme bryster kan begynde at opträde.',
        ],
        toKnow: [
          'Det ar det anbefalede tidspunkt at bestille en tid hos en sundhedsprofessionel for at starte graviditetsforlöbet.',
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
      nb: {
        babyDescription:
          'Knoppene til armer og ben dukker opp, sammen med små fordypninger der ørene skal dannes. Hjertet kan noen ganger allerede påvises på ultralyd.',
        length: 'Omtrent 6 mm',
        comparison: 'Ert',
        bodyChanges: ['Kvalme og tretthet kan forsterkes for noen i denne perioden.'],
        toKnow: ['Hjerteaktivitet kan noen ganger være synlig allerede denne uken på en tidlig ultralyd.'],
      },
      pl: {
        babyDescription:
          'Pojawiają się zawiązki rąk i nóg oraz małe wgłębienia, w których uformują się uszy. Serce można czasem wykryć już w badaniu USG.',
        length: 'Około 6 mm',
        comparison: 'Groszek',
        bodyChanges: ['Nudności i zmęczenie mogą w tym okresie nasilić się u niektórych osób.'],
        toKnow: ['Czynność serca może być czasem widoczna już w tym tygodniu we wczesnym badaniu USG.'],
      },
      uk: {
        babyDescription:
          'З’являються зачатки рук і ніг, а також маленькі заглиблення, де сформуються вуха. Серце іноді можна виявити вже на УЗД.',
        length: 'Приблизно 6 мм',
        comparison: 'Горошина',
        bodyChanges: ['Нудота й втома в цей період у деяких жінок можуть посилитися.'],
        toKnow: ['Серцева діяльність іноді може бути видна вже цього тижня на ранньому УЗД.'],
      },
      cs: {
        babyDescription:
          'Objevují se základy paží a nohou i malé prohlubně, kde se vytvoří uši. Srdce lze někdy zachytit již na ultrazvuku.',
        length: 'Asi 6 mm',
        comparison: 'Hrášek',
        bodyChanges: ['Nevolnost a únava se mohou v tomto období u některých žen zesílit.'],
        toKnow: ['Srdeční činnost může být někdy viditelná už tento týden na časném ultrazvuku.'],
      },
      sk: {
        babyDescription:
          'Objavujú sa zárodky rúk a nôh a malé priehlbiny, kde sa vytvoria uši. Srdce možno niekedy zistiť už na ultrazvuku.',
        length: 'Približne 6 mm',
        comparison: 'Hrášok',
        bodyChanges: [
          'Nevoľnosť a únava sa môžu u niektorých žien v tomto období zosilniť.',
        ],
        toKnow: [
          'Srdcová činnosť môže byť niekedy viditeľná už tento týždeň na skorom ultrazvuku.',
        ],
      },
      hu: {
        babyDescription:
          'Megjelennek a karok és lábak bimbói, valamint a kis bemélyedések, ahol a fülek ki fognak alakulni. A szív néha már kimutatható ultrahangon.',
        length: 'Körülbelül 6 mm',
        comparison: 'Borsószem',
        bodyChanges: [
          'A hányinger és a fáradtság egyes nőknél ebben az időszakban felerősödhet.',
        ],
        toKnow: [
          'A szívműködés néha már ezen a héten látható lehet egy korai ultrahangon.',
        ],
      },
      ro: {
        babyDescription:
          'Apar mugurii brațelor și picioarelor, împreună cu mici adâncituri în locul în care se vor forma urechile. Inima poate fi uneori deja detectată la ecografie.',
        length: 'Aproximativ 6 mm',
        comparison: 'Mazăre',
        bodyChanges: [
          'Greața și oboseala se pot intensifica pentru unele persoane în această perioadă.',
        ],
        toKnow: [
          'Activitatea inimii poate fi uneori vizibilă încă din această săptămână la o ecografie precoce.',
        ],
      },
      bg: {
        babyDescription:
          'Появяват се зачатъците на ръцете и краката, заедно с малки вдлъбнатини там, където ще се оформят ушите. Сърцето понякога вече може да се открие на ехография.',
        length: 'Около 6 мм',
        comparison: 'Грахово зърно',
        bodyChanges: [
          'Гаденето и умората могат да се засилят при някои хора през този период.',
        ],
        toKnow: [
          'Сърдечната дейност понякога може да се види още от тази седмица на ранна ехография.',
        ],
      },
      sr: {
        babyDescription:
          'Појављују се зачеци руку и ногу, заједно са малим удубљењима где ће се формирати уши. Срце се понекад већ може открити на ултразвуку.',
        length: 'Око 6 мм',
        comparison: 'Грашак',
        bodyChanges: [
          'Мучнина и умор могу се појачати код неких особа током овог периода.',
        ],
        toKnow: [
          'Срчана активност понекад може бити видљива већ од ове недеље на раном ултразвуку.',
        ],
      },
      hr: {
        babyDescription:
          'Pojavljuju se začeci ruku i nogu te mala udubljenja na mjestu gdje će se oblikovati uši. Srce se ponekad već može otkriti na ultrazvuku.',
        length: 'Oko 6 mm',
        comparison: 'Grašak',
        bodyChanges: [
          'Mučnina i umor mogu se kod nekih osoba pojačati tijekom ovog razdoblja.',
        ],
        toKnow: [
          'Srčana aktivnost ponekad može biti vidljiva već od ovog tjedna na ranom ultrazvuku.',
        ],
      },
      bs: {
        babyDescription:
          'Pojavljuju se začeci ruku i nogu te mala udubljenja na mjestu gdje će se oblikovati uši. Srce se ponekad već može otkriti na ultrazvuku.',
        length: 'Oko 6 mm',
        comparison: 'Grašak',
        bodyChanges: [
          'Mučnina i umor mogu se kod nekih osoba pojačati tokom ovog razdoblja.',
        ],
        toKnow: [
          'Srčana aktivnost ponekad može biti vidljiva već od ove sedmice na ranom ultrazvuku.',
        ],
      },
      sl: {
        babyDescription:
          'Pojavijo se zasnove rok in nog ter majhna vdolbinica, kjer se bodo oblikovala ušesa. Srce je včasih že mogoče zaznati na ultrazvoku.',
        length: 'Približno 6 mm',
        comparison: 'Grah',
        bodyChanges: [
          'Slabost in utrujenost se lahko pri nekaterih osebah v tem obdobju okrepita.',
        ],
        toKnow: [
          'Srčna dejavnost je lahko včasih vidna že od tega tedna na zgodnjem ultrazvoku.',
        ],
      },
      ne: {
        babyDescription:
          'हात र खुट्टाका अङ्कुरहरू देखिन्छन्, साथै कानहरू बन्ने ठाउँमा साना खाल्डाहरू। मुटु कहिलेकाहीँ अल्ट्रासाउन्डमा पहिल्यै पत्ता लगाउन सकिन्छ।',
        length: 'करिब 6 मिमि',
        comparison: 'केराउ',
        bodyChanges: [
          'यस अवधिमा केही मानिसमा वाकवाकी र थकान बढ्न सक्छ।',
        ],
        toKnow: [
          'मुटुको गतिविधि कहिलेकाहीँ चाँडो अल्ट्रासाउन्डमा यही हप्तादेखि नै देखिन सक्छ।',
        ],
      },
      si: {
        babyDescription:
          'අත් සහ කකුල්වල අංකුර දිස්වන අතර, කන් සෑදෙන කුඩා අවපාත ද පෙනේ. හදවත සමහර විට දැනටමත් අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයෙන් හඳුනාගත හැක.',
        length: 'මි.මී. 6 පමණ',
        comparison: 'කඩල ඇටයක්',
        bodyChanges: [
          'මෙම කාලය තුළ සමහර පුද්ගලයන්ට ඔක්කාරය සහ වෙහෙස තීව්‍ර විය හැක.',
        ],
        toKnow: [
          'මුල් අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයකදී හදවතේ ක්‍රියාකාරිත්වය මෙම සතියේ සිටම සමහර විට දෘශ්‍යමාන විය හැක.',
        ],
      },
      th: {
        babyDescription:
          'ตุ่มแขนและขาปรากฏขึ้น พร้อมรอยบุ๋มเล็ก ๆ ที่หูจะก่อตัว บางครั้งอาจตรวจพบหัวใจจากอัลตราซาวนด์ได้แล้ว',
        length: 'ประมาณ 6 มม.',
        comparison: 'ถั่วลันเตา',
        bodyChanges: [
          'อาการคลื่นไส้และเหนื่อยล้าอาจรุนแรงขึ้นในบางคนในช่วงนี้',
        ],
        toKnow: [
          'บางครั้งเห็นการทำงานของหัวใจได้ตั้งแต่สัปดาห์นี้จากอัลตราซาวนด์ระยะแรก',
        ],
      },
      vi: {
        babyDescription:
          'Các chồi tay và chân xuất hiện, cùng những vết lõm nhỏ nơi tai sẽ hình thành. Tim đôi khi đã có thể được phát hiện trên siêu âm.',
        length: 'Khoảng 6 mm',
        comparison: 'Hạt đậu Hà Lan',
        bodyChanges: [
          'Buồn nôn và mệt mỏi có thể tăng lên ở một số người trong giai đoạn này.',
        ],
        toKnow: [
          'Hoạt động của tim đôi khi có thể nhìn thấy sớm nhất từ tuần này trên siêu âm sớm.',
        ],
      },
      uz: {
        babyDescription:
          'Qoʻl va oyoq kurtaklari paydo boʻladi, shuningdek, quloqlar shakllanadigan kichik chuqurchalar. Yurak baʼzan allaqachon UZI da aniqlanishi mumkin.',
        length: 'Taxminan 6 mm',
        comparison: 'Noʻxat',
        bodyChanges: [
          'Koʻngil aynishi va charchoq baʼzi odamlarda bu davrda kuchayishi mumkin.',
        ],
        toKnow: [
          'Yurak faoliyati baʼzan erta UZI da shu haftadanoq koʻrinishi mumkin.',
        ],
      },
      az: {
        babyDescription:
          'Qol və ayaq tumurcuqları, eləcə də qulaqların formalaşacağı kiçik çökəkliklər görünür. Ürək bəzən artıq ultrasəsdə aşkar edilə bilir.',
        length: 'Təxminən 6 mm',
        comparison: 'Noxud',
        bodyChanges: [
          'Ürəkbulanma və yorğunluq bu dövrdə bəzi insanlarda güclənə bilər.',
        ],
        toKnow: [
          'Ürək fəaliyyəti bəzən erkən ultrasəsdə daha bu həftədən görünə bilər.',
        ],
      },
      ka: {
        babyDescription:
          'ჩნდება ხელებისა და ფეხების კვირტები, ასევე პატარა ჩაღრმავებები, სადაც ყურები ჩამოყალიბდება. გული ზოგჯერ უკვე ულტრაბგერაზე ჩანს.',
        length: 'დაახლოებით 6 მმ',
        comparison: 'ბარდა',
        bodyChanges: [
          'გულისრევა და დაღლილობა ამ პერიოდში ზოგისთვის შეიძლება გაძლიერდეს.',
        ],
        toKnow: [
          'გულის აქტივობა ზოგჯერ უკვე ამ კვირას შეიძლება ადრეულ ულტრაბგერაზე ჩანდეს.',
        ],
      },
      hy: {
        babyDescription:
          'Հայտնվում են ձեռքերի և ոտքերի բողբոջները, ինչպես նաև փոքր փոսիկներ, որտեղ կձևավորվեն ականջները: Սիրտը երբեմն արդեն կարող է հայտնաբերվել ուլտրաձայնային հետազոտության ժամանակ:',
        length: 'Մոտ 6 մմ',
        comparison: 'Ոլոռ',
        bodyChanges: [
          'Սրտխառնոցը և հոգնածությունը որոշ մարդկանց մոտ կարող են ուժեղանալ այս ժամանակահատվածում:',
        ],
        toKnow: [
          'Սրտի գործունեությունը երբեմն կարող է տեսանելի լինել արդեն այս շաբաթից վաղ ուլտրաձայնային հետազոտության ժամանակ:',
        ],
      },
      tg: {
        babyDescription:
          'Муғчаҳои дастҳо ва пойҳо пайдо мешаванд, ҳамроҳ бо чуқуриҳои хурде, ки гӯшҳо дар онҳо ташаккул меёбанд. Дилро баъзан аллакай дар ултрасадо ошкор кардан мумкин аст.',
        length: 'Тақрибан 6 мм',
        comparison: 'Нахӯдаки сабз',
        bodyChanges: [
          'Беҳузурӣ ва хастагӣ барои баъзеҳо дар ин давра метавонад шадидтар шавад.',
        ],
        toKnow: [
          'Фаъолияти дилро баъзан аллакай аз ҳамин ҳафта дар ултрасадои барвақт дидан мумкин аст.',
        ],
      },
      ky: {
        babyDescription:
          'Колдун жана буттун бүчүрлөрү пайда болот, ошондой эле кулактар түзүлө турган кичинекей чуңкурлар. Жүрөктү кээде эле УЗИде аныктоого болот.',
        length: 'Болжол менен 6 мм',
        comparison: 'Буурчак',
        bodyChanges: [
          'Көңүл айлануу жана чарчоо бул мезгилде айрым адамдарда күчөшү мүмкүн.',
        ],
        toKnow: [
          'Жүрөк иши кээде эрте УЗИде бул жумадан эле көрүнүшү мүмкүн.',
        ],
      },
      tk: {
        babyDescription:
          'Eliň we aýagyň tumurjyklary, şeýle hem gulaklaryň emele geljek ýerlerinde kiçijik çukurjyklar peýda bolýar. Ýürek käwagt eýýäm UZI-de anyklanyp bilner.',
        length: 'Takmynan 6 mm',
        comparison: 'Nohut',
        bodyChanges: [
          'Ýüregiň bulanmagy we ýadawlyk käbir adamlar üçin bu döwürde güýçlenip biler.',
        ],
        toKnow: [
          'Ýüregiň işjeňligi ir UZI-de şu hepdeden başlap käwagt görünip biler.',
        ],
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
      da: {
        babyDescription: 'Arm- og benknopper dukker op, og der ses små fordybninger, hvor ørerne vil dannes. Hjerteaktivitet kan sommetimes allerede detekteres ved en ultralyd.',
        length: 'Ca. 6 mm',
        comparison: 'Ært',
        bodyChanges: [
          'Kvalme og træthed kan tiltage for nogle i denne periode.',
        ],
        toKnow: [
          'Hjerteaktivitet kan sommetimes ses allerede i denne uge ved en tidlig ultralyd.',
        ],
      },
      sv: {
        babyDescription: 'Arm- och benknopper dukker op, och der ses små fordybninger, hvor örerne vil dannes. Hjerteaktivitet kan sommetimes redan detekteres ved en ultralyd.',
        length: 'Ca. 6 mm',
        comparison: 'Ärt',
        bodyChanges: [
          'Kvalme och träthed kan tiltage for nogle i denne periode.',
        ],
        toKnow: [
          'Hjerteaktivitet kan sommetimes ses redan i denne vecka ved en tidlig ultralyd.',
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
      nb: {
        babyDescription:
          'Hjernen utvikler seg raskere enn resten av kroppen, noe som gir en fremtredende panne. Små håndknopper begynner å dukke opp i enden av armene.',
        length: 'Omtrent 10 mm',
        comparison: 'Drue',
        bodyChanges: ['Spesielle matlyster, eller tvert imot aversjon mot visse matvarer, er mulig.'],
        toKnow: ['Nevralrøret, som gir opphav til hjernen og ryggmargen, fortsetter å lukke seg i løpet av disse ukene.'],
      },
      pl: {
        babyDescription:
          'Mózg rozwija się szybciej niż reszta ciała, co nadaje wyraźnie zarysowane czoło. Na końcach ramion zaczynają pojawiać się małe zawiązki dłoni.',
        length: 'Około 10 mm',
        comparison: 'Winogrono',
        bodyChanges: ['Możliwe są szczególne zachcianki na jedzenie lub przeciwnie, niechęć do niektórych produktów.'],
        toKnow: ['Cewa nerwowa, z której powstają mózg i rdzeń kręgowy, nadal zamyka się w ciągu tych tygodni.'],
      },
      uk: {
        babyDescription:
          'Мозок розвивається швидше за решту тіла, що надає чолу виразного контуру. На кінцях рук починають з’являтися маленькі зачатки кистей.',
        length: 'Приблизно 10 мм',
        comparison: 'Виноградина',
        bodyChanges: ['Можливі особливі зачіпки до їжі або, навпаки, відраза до певних продуктів.'],
        toKnow: ['Нервова трубка, з якої утворюються мозок і спинний мозок, продовжує закриватися протягом цих тижнів.'],
      },
      cs: {
        babyDescription:
          'Mozek se vyvíjí rychleji než zbytek těla, což dává výraznější čelo. Na koncích paží se začínají objevovat malé základy rukou.',
        length: 'Asi 10 mm',
        comparison: 'Hroznové víno',
        bodyChanges: ['Jsou možné zvláštní chutě na jídlo, nebo naopak odpor k některým potravinám.'],
        toKnow: ['Nervová trubice, z níž vzniká mozek a mícha, se během těchto týdnů dál uzavírá.'],
      },
      sk: {
        babyDescription:
          'Mozog sa vyvíja rýchlejšie ako zvyšok tela, čo dáva čelu výrazný tvar. Na koncoch rúk sa začínajú objavovať malé zárodky dlaní.',
        length: 'Približne 10 mm',
        comparison: 'Hrozno',
        bodyChanges: [
          'Možné sú osobitné chute na jedlo alebo naopak odpor k niektorým potravinám.',
        ],
        toKnow: [
          'Nervová trubica, z ktorej vzniká mozog a miecha, sa počas týchto týždňov naďalej uzatvára.',
        ],
      },
      hu: {
        babyDescription:
          'Az agy gyorsabban fejlődik, mint a test többi része, ami kiemelkedő homlokot ad. A karok végén kis kézbimbók kezdenek megjelenni.',
        length: 'Körülbelül 10 mm',
        comparison: 'Szőlőszem',
        bodyChanges: [
          'Különleges ételvágyak, vagy éppen ellenkezőleg, bizonyos ételek iránti ellenszenv lehetséges.',
        ],
        toKnow: [
          'Az idegcső, amelyből az agy és a gerincvelő kialakul, ezekben a hetekben tovább záródik.',
        ],
      },
      ro: {
        babyDescription:
          'Creierul se dezvoltă mai repede decât restul corpului, dând o frunte proeminentă. La capătul brațelor încep să apară mici muguri ai mâinilor.',
        length: 'Aproximativ 10 mm',
        comparison: 'Strugure',
        bodyChanges: [
          'Sunt posibile pofte alimentare deosebite sau, dimpotrivă, aversiuni față de anumite alimente.',
        ],
        toKnow: [
          'Tubul neural, din care se formează creierul și măduva spinării, continuă să se închidă în aceste săptămâni.',
        ],
      },
      bg: {
        babyDescription:
          'Мозъкът се развива по-бързо от останалата част от тялото, което придава изпъкнало чело. В краищата на ръцете започват да се появяват малки зачатъци на дланите.',
        length: 'Около 10 мм',
        comparison: 'Гроздово зърно',
        bodyChanges: [
          'Възможни са особени желания за определени храни или, обратно, отвращение към някои от тях.',
        ],
        toKnow: [
          'Невралната тръба, от която се образуват мозъкът и гръбначният мозък, продължава да се затваря през тези седмици.',
        ],
      },
      sr: {
        babyDescription:
          'Мозак се развија брже од остатка тела, што даје истакнуто чело. На крајевима руку почињу да се појављују мали зачеци шака.',
        length: 'Око 10 мм',
        comparison: 'Зрно грожђа',
        bodyChanges: [
          'Могуће су посебне жеље за одређеном храном или, обрнуто, одбојност према некој.',
        ],
        toKnow: [
          'Неурална цев, из које настају мозак и кичмена мождина, наставља да се затвара током ових недеља.',
        ],
      },
      hr: {
        babyDescription:
          'Mozak se razvija brže od ostatka tijela, što daje istaknuto čelo. Na krajevima ruku počinju se pojavljivati mali začeci šaka.',
        length: 'Oko 10 mm',
        comparison: 'Zrno grožđa',
        bodyChanges: [
          'Moguća je posebna žudnja za određenom hranom ili, obrnuto, odbojnost prema nekoj.',
        ],
        toKnow: [
          'Neuralna cijev, iz koje nastaju mozak i leđna moždina, nastavlja se zatvarati tijekom ovih tjedana.',
        ],
      },
      bs: {
        babyDescription:
          'Mozak se razvija brže od ostatka tijela, što daje istaknuto čelo. Na krajevima ruku počinju se pojavljivati mali začeci šaka.',
        length: 'Oko 10 mm',
        comparison: 'Zrno grožđa',
        bodyChanges: [
          'Moguća je posebna žudnja za određenom hranom ili, obrnuto, odbojnost prema nekoj.',
        ],
        toKnow: [
          'Neuralna cijev, iz koje nastaju mozak i leđna moždina, nastavlja se zatvarati tokom ovih sedmica.',
        ],
      },
      sl: {
        babyDescription:
          'Možgani se razvijajo hitreje od preostalega telesa, kar daje izrazito čelo. Na koncih rok se začnejo pojavljati majhne zasnove dlani.',
        length: 'Približno 10 mm',
        comparison: 'Grozdna jagoda',
        bodyChanges: [
          'Možno je posebno hrepenenje po določeni hrani ali, nasprotno, odpor do neke hrane.',
        ],
        toKnow: [
          'Nevralna cev, iz katere nastaneta možgani in hrbtenjača, se še naprej zapira v teh tednih.',
        ],
      },
      ne: {
        babyDescription:
          'मस्तिष्क बाँकी शरीरभन्दा छिटो विकसित हुन्छ, जसले अग्लो निधार दिन्छ। हातका छेउमा साना हत्केलाका अङ्कुरहरू देखिन थाल्छन्।',
        length: 'करिब 10 मिमि',
        comparison: 'अङ्गुर',
        bodyChanges: [
          'विशेष खानेकुराको चाहना, वा उल्टो केही खानेकुराप्रति अरुचि सम्भव छ।',
        ],
        toKnow: [
          'मस्तिष्क र मेरुदण्डलाई जन्म दिने स्नायु नली यी हप्ताहरूमा बन्द हुँदै जान्छ।',
        ],
      },
      si: {
        babyDescription:
          'මොළය ශරීරයේ ඉතිරි කොටසට වඩා වේගයෙන් වර්ධනය වන අතර, කැපී පෙනෙන නළලක් ලබා දෙයි. අත්වල කෙළවරේ කුඩා අත් අංකුර දිස්වීමට පටන් ගනී.',
        length: 'මි.මී. 10 පමණ',
        comparison: 'මිදි ගෙඩියක්',
        bodyChanges: [
          'විශේෂ ආහාර ආශාවන්, හෝ ප්‍රතිවිරුද්ධව සමහර ආහාර කෙරෙහි පිළිකුලක් ඇතිවීමට පුළුවන්.',
        ],
        toKnow: [
          'මොළය සහ කොඳු ඇට පෙළ ඇති කරන ස්නායු නාලය මෙම සති තුළ වැසීම දිගටම කරගෙන යයි.',
        ],
      },
      th: {
        babyDescription:
          'สมองพัฒนาเร็วกว่าส่วนอื่นของร่างกาย ทำให้หน้าผากโหนก ตุ่มมือเล็ก ๆ เริ่มปรากฏที่ปลายแขน',
        length: 'ประมาณ 10 มม.',
        comparison: 'องุ่น',
        bodyChanges: [
          'อาจอยากอาหารบางอย่างเป็นพิเศษ หรือในทางกลับกันรังเกียจอาหารบางอย่าง',
        ],
        toKnow: [
          'ท่อประสาทซึ่งเป็นต้นกำเนิดของสมองและไขสันหลังยังคงปิดตัวในช่วงสัปดาห์เหล่านี้',
        ],
      },
      vi: {
        babyDescription:
          'Não phát triển nhanh hơn phần còn lại của cơ thể, tạo nên vầng trán nổi bật. Các chồi bàn tay nhỏ bắt đầu xuất hiện ở đầu các cánh tay.',
        length: 'Khoảng 10 mm',
        comparison: 'Quả nho',
        bodyChanges: [
          'Có thể thèm một số món ăn đặc biệt, hoặc ngược lại ghét một số món.',
        ],
        toKnow: [
          'Ống thần kinh, nơi hình thành não và tủy sống, tiếp tục khép lại trong những tuần này.',
        ],
      },
      uz: {
        babyDescription:
          'Miya tananing qolgan qismidan tezroq rivojlanadi, bu peshonaning boʻrtib turishiga olib keladi. Qoʻl uchlarida mayda kaft kurtaklari paydo boʻla boshlaydi.',
        length: 'Taxminan 10 mm',
        comparison: 'Uzum',
        bodyChanges: [
          'Alohida ovqatga ishtiyoq yoki, aksincha, baʼzi ovqatlarga nafrat mumkin.',
        ],
        toKnow: [
          'Miya va orqa miyani hosil qiladigan asab naychasi bu haftalarda yopilishda davom etadi.',
        ],
      },
      az: {
        babyDescription:
          'Beyin bədənin qalan hissəsindən daha sürətlə inkişaf edir və alnı qabarıq göstərir. Qolların ucunda kiçik əl tumurcuqları görünməyə başlayır.',
        length: 'Təxminən 10 mm',
        comparison: 'Üzüm',
        bodyChanges: [
          'Xüsusi qida istəkləri və ya əksinə, bəzi qidalara iyrənmə mümkündür.',
        ],
        toKnow: [
          'Beyin və onurğa beyni əmələ gətirən neyral boru bu həftələr ərzində qapanmağa davam edir.',
        ],
      },
      ka: {
        babyDescription:
          'ტვინი დანარჩენ სხეულზე უფრო სწრაფად ვითარდება, რაც თვალსაჩინო შუბლს ქმნის. ხელების ბოლოებზე ჩნდება ხელის პატარა კვირტები.',
        length: 'დაახლოებით 10 მმ',
        comparison: 'ყურძენი',
        bodyChanges: [
          'შესაძლებელია გარკვეული საკვების განსაკუთრებული სურვილი ან, პირიქით, ზიზღი.',
        ],
        toKnow: [
          'ნერვული მილი, საიდანაც ტვინი და ზურგის ტვინი ყალიბდება, ამ კვირებში კვლავ იხურება.',
        ],
      },
      hy: {
        babyDescription:
          'Ուղեղը զարգանում է մարմնի մնացած մասից ավելի արագ՝ տալով ցցված ճակատ: Ձեռքերի ծայրերին սկսում են հայտնվել ափերի փոքր բողբոջներ:',
        length: 'Մոտ 10 մմ',
        comparison: 'Խաղող',
        bodyChanges: [
          'Հնարավոր են սննդային առանձնահատուկ ցանկություններ կամ, ընդհակառակը, որոշ սննդի նկատմամբ զզվանք:',
        ],
        toKnow: [
          'Նյարդային խողովակը, որից առաջանում են ուղեղը և ողնուղեղը, շարունակում է փակվել այս շաբաթների ընթացքում:',
        ],
      },
      tg: {
        babyDescription:
          'Майна назар ба боқимондаи бадан зудтар инкишоф меёбад, ки пешонии намоён медиҳад. Муғчаҳои хурди даст дар нӯги дастҳо пайдо шудан мегиранд.',
        length: 'Тақрибан 10 мм',
        comparison: 'Ангур',
        bodyChanges: [
          'Хоҳиши хӯрокҳои мушаххас ё баръакс нафрат аз баъзе хӯрокҳо имконпазир аст.',
        ],
        toKnow: [
          'Найи асаб, ки майна ва тири пушт аз он ба вуҷуд меояд, дар ин ҳафтаҳо баста шуданро идома медиҳад.',
        ],
      },
      ky: {
        babyDescription:
          'Мээ дененин калган бөлүгүнөн ылдамыраак өнүгөт, бул чокчойгон манглайды берет. Колдун учтарында кичинекей кол бүчүрлөрү пайда боло баштайт.',
        length: 'Болжол менен 10 мм',
        comparison: 'Жүзүм',
        bodyChanges: [
          'Өзгөчө тамакка болгон каалоолор же, тескерисинче, айрым тамактардан жийиркенүү мүмкүн.',
        ],
        toKnow: [
          'Мээни жана жүлүндү пайда кылган нерв түтүкчөсү бул жумаларда жабылууну улантат.',
        ],
      },
      tk: {
        babyDescription:
          'Beýni bedeniň galan bölegine garanyňda çalt ösýär, bu uly maňlaý berýär. Goluň ujunda kiçijik el tumurjyklary peýda bolup başlaýar.',
        length: 'Takmynan 10 mm',
        comparison: 'Üzüm',
        bodyChanges: [
          'Aýratyn iýmit islegleri ýa-da tersine käbir iýmitlere ýigrenmek mümkin.',
        ],
        toKnow: [
          'Beýni we oňurga ýiliginiň ýüze çykýan nerw turbasy bu hepdelerde ýapylmagyny dowam etdirýär.',
        ],
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
      da: {
        babyDescription: 'Hjernen udvikles hurtigere end resten af kroppen, hvilket giver en fremtrædende pande. Små håndknopper begynder at dukke op i enden af armene.',
        length: 'Ca. 10 mm',
        comparison: 'Vindrue',
        bodyChanges: [
          'Særlige madtrang, eller omvendt aversioner mod bestemte fødevarer, er mulige.',
        ],
        toKnow: [
          'Neuralrøret, som giver anledning til hjerne og rygmarv, fortsætter med at lukke sig i disse uger.',
        ],
      },
      sv: {
        babyDescription: 'Hjernen udvikles hurtigere end resten av kroppen, hvilket giver en fremträdende pande. Små håndknopper begynder at dukke op i enden av armene.',
        length: 'Ca. 10 mm',
        comparison: 'Vindrue',
        bodyChanges: [
          'Särlige madtrang, eller omvendt aversioner mod bestemte födevarer, ar mulige.',
        ],
        toKnow: [
          'Neuralröret, som giver anledning till hjerne och rygmarv, fortsätter med at lukke sig i disse veckor.',
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
      nb: {
        babyDescription:
          'Embryoet kalles nå et foster. Armene blir lengre, hodet begynner å rette seg litt opp, og morkaken fortsetter å dannes.',
        length: 'Omtrent 16 mm',
        comparison: 'Bringebær',
        bodyChanges: ['Følsomhet for lukt og morgenkvalme er vanlig på dette stadiet, men ikke universelt.'],
        toKnow: ['Den første dateringsultralyden planlegges vanligvis mellom uke 8 og uke 14.'],
      },
      pl: {
        babyDescription:
          'Zarodek nazywa się teraz płodem. Ramiona się wydłużają, głowa zaczyna się lekko prostować, a łożysko nadal się tworzy.',
        length: 'Około 16 mm',
        comparison: 'Malina',
        bodyChanges: ['Wrażliwość na zapachy i poranne nudności są na tym etapie częste, choć nie powszechne.'],
        toKnow: ['Pierwsze badanie USG datujące ciążę jest zazwyczaj planowane między 8. a 14. tygodniem.'],
      },
      uk: {
        babyDescription:
          'Ембріон тепер називається плодом. Руки подовжуються, голова починає злегка випрямлятися, а плацента продовжує формуватися.',
        length: 'Приблизно 16 мм',
        comparison: 'Малина',
        bodyChanges: ['Чутливість до запахів і ранкова нудота на цьому етапі поширені, хоча й не повсюдні.'],
        toKnow: ['Перше УЗД для датування зазвичай планують між 8-м і 14-м тижнем.'],
      },
      cs: {
        babyDescription:
          'Embryo se nyní nazývá plod. Paže se prodlužují, hlavička se začíná mírně napřimovat a placenta se dál vytváří.',
        length: 'Asi 16 mm',
        comparison: 'Malina',
        bodyChanges: ['Citlivost na pachy a ranní nevolnost jsou v této fázi běžné, i když ne u všech.'],
        toKnow: ['První ultrazvuk k datování se obvykle plánuje mezi 8. a 14. týdnem.'],
      },
      sk: {
        babyDescription:
          'Embryo sa teraz nazýva plod. Ruky sa predlžujú, hlava sa začína mierne vzpriamovať a placenta sa naďalej tvorí.',
        length: 'Približne 16 mm',
        comparison: 'Malina',
        bodyChanges: [
          'Citlivosť na pachy a ranná nevoľnosť sú v tejto fáze časté, hoci nie všeobecné.',
        ],
        toKnow: [
          'Prvý ultrazvuk na určenie veku tehotenstva sa zvyčajne plánuje medzi 8. a 14. týždňom.',
        ],
      },
      hu: {
        babyDescription:
          'Az embriót mostantól magzatnak nevezik. A karok hosszabbodnak, a fej kissé kiegyenesedni kezd, és a lepény tovább fejlődik.',
        length: 'Körülbelül 16 mm',
        comparison: 'Málna',
        bodyChanges: [
          'Az illatokra való érzékenység és a reggeli rosszullét ebben a szakaszban gyakori, bár nem általános.',
        ],
        toKnow: [
          'Az első, korvizsgáló ultrahangot általában a 8. és a 14. hét között tervezik.',
        ],
      },
      ro: {
        babyDescription:
          'Embrionul este acum numit făt. Brațele se alungesc, capul începe să se îndrepte ușor, iar placenta continuă să se formeze.',
        length: 'Aproximativ 16 mm',
        comparison: 'Zmeură',
        bodyChanges: [
          'Sensibilitatea la mirosuri și greața matinală sunt frecvente în această etapă, deși nu universale.',
        ],
        toKnow: [
          'Prima ecografie de datare este programată în general între săptămâna 8 și săptămâna 14.',
        ],
      },
      bg: {
        babyDescription:
          'Ембрионът вече се нарича плод. Ръцете се удължават, главата започва леко да се изправя, а плацентата продължава да се формира.',
        length: 'Около 16 мм',
        comparison: 'Малина',
        bodyChanges: [
          'Чувствителността към миризми и сутрешното гадене са чести на този етап, макар и не универсални.',
        ],
        toKnow: [
          'Първата ехография за датиране обикновено се планира между 8-ата и 14-ата седмица.',
        ],
      },
      sr: {
        babyDescription:
          'Ембрион се сада назива плод. Руке се издужују, глава почиње благо да се исправља, а плацента наставља да се формира.',
        length: 'Око 16 мм',
        comparison: 'Малина',
        bodyChanges: [
          'Осетљивост на мирисе и јутарња мучнина су честе у овој фази, мада не универзалне.',
        ],
        toKnow: [
          'Први ултразвук за датирање обично се заказује између 8. и 14. недеље.',
        ],
      },
      hr: {
        babyDescription:
          'Embrij se sada naziva fetus. Ruke se produljuju, glava se počinje blago uspravljati, a posteljica se nastavlja oblikovati.',
        length: 'Oko 16 mm',
        comparison: 'Malina',
        bodyChanges: [
          'Osjetljivost na mirise i jutarnja mučnina česte su u ovoj fazi, iako nisu univerzalne.',
        ],
        toKnow: [
          'Prvi ultrazvuk za datiranje obično se zakazuje između 8. i 14. tjedna.',
        ],
      },
      bs: {
        babyDescription:
          'Embrij se sada naziva fetus. Ruke se produljuju, glava se počinje blago uspravljati, a posteljica se nastavlja oblikovati.',
        length: 'Oko 16 mm',
        comparison: 'Malina',
        bodyChanges: [
          'Osjetljivost na mirise i jutarnja mučnina česte su u ovoj fazi, iako nisu univerzalne.',
        ],
        toKnow: [
          'Prvi ultrazvuk za datiranje obično se zakazuje između 8. i 14. sedmice.',
        ],
      },
      sl: {
        babyDescription:
          'Zarodek se zdaj imenuje plod. Roke se podaljšujejo, glava se začne rahlo vzravnavati, posteljica pa se še naprej oblikuje.',
        length: 'Približno 16 mm',
        comparison: 'Malina',
        bodyChanges: [
          'Občutljivost za vonjave in jutranja slabost sta pogosti v tej fazi, čeprav nista univerzalni.',
        ],
        toKnow: [
          'Prvi ultrazvok za datiranje se običajno naroči med 8. in 14. tednom.',
        ],
      },
      ne: {
        babyDescription:
          'भ्रूणलाई अब गर्भस्थ शिशु भनिन्छ। हातहरू लामा हुँदै छन्, टाउको अलिकति सीधा हुन थाल्छ, र प्लासेन्टा बन्दै छ।',
        length: 'करिब 16 मिमि',
        comparison: 'रास्पबेरी',
        bodyChanges: [
          'गन्धप्रति संवेदनशीलता र बिहानको वाकवाकी यस चरणमा सामान्य हुन्छन्, यद्यपि सबैमा हुँदैनन्।',
        ],
        toKnow: [
          'मिति निर्धारणको पहिलो अल्ट्रासाउन्ड सामान्यतया हप्ता 8 र हप्ता 14 बीच तय गरिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'කළලය දැන් කලලයක් ලෙස හැඳින්වේ. අත් දිගු වෙමින් පවතී, හිස තරමක් කෙළින් වීමට පටන් ගනී, සහ ප්‍රසව සහයක් (වැදෑමහ) සෑදීම දිගටම කරගෙන යයි.',
        length: 'මි.මී. 16 පමණ',
        comparison: 'රස්බෙරි ගෙඩියක්',
        bodyChanges: [
          'ගඳ සුවඳට සංවේදීතාව සහ උදෑසන ඔක්කාරය මෙම අවධියේ පොදු වේ, සර්වත්‍රික නොවුනත්.',
        ],
        toKnow: [
          'පළමු දිනනිර්ණය අල්ට්‍රාසවුන්ඩ් පරීක්ෂණය සාමාන්‍යයෙන් 8 වන සතිය සහ 14 වන සතිය අතර නියම කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ตอนนี้ตัวอ่อนเรียกว่าทารกในครรภ์ แขนยาวขึ้น ศีรษะเริ่มตั้งตรงเล็กน้อย และรกยังคงก่อตัวต่อไป',
        length: 'ประมาณ 16 มม.',
        comparison: 'ราสป์เบอร์รี',
        bodyChanges: [
          'ความไวต่อกลิ่นและแพ้ท้องพบบ่อยในระยะนี้ แม้ไม่ใช่ทุกคน',
        ],
        toKnow: [
          'อัลตราซาวนด์กำหนดอายุครรภ์ครั้งแรกโดยทั่วไปนัดระหว่างสัปดาห์ที่ 8 ถึงสัปดาห์ที่ 14',
        ],
      },
      vi: {
        babyDescription:
          'Phôi thai bây giờ được gọi là thai nhi. Cánh tay đang dài ra, đầu bắt đầu thẳng lên một chút và nhau thai tiếp tục hình thành.',
        length: 'Khoảng 16 mm',
        comparison: 'Quả mâm xôi',
        bodyChanges: [
          'Nhạy cảm với mùi và ốm nghén là phổ biến ở giai đoạn này, dù không phải ai cũng có.',
        ],
        toKnow: [
          'Lần siêu âm xác định tuổi thai đầu tiên thường được lên lịch trong khoảng từ tuần 8 đến tuần 14.',
        ],
      },
      uz: {
        babyDescription:
          'Embrion endi homila deb ataladi. Qoʻllar uzayadi, bosh biroz tiklana boshlaydi va yoʻldosh shakllanishda davom etadi.',
        length: 'Taxminan 16 mm',
        comparison: 'Malina',
        bodyChanges: [
          'Hidlarga sezgirlik va ertalabki koʻngil aynishi bu bosqichda keng tarqalgan, garchi hammada emas.',
        ],
        toKnow: [
          'Birinchi muddatni aniqlash UZI odatda 8-haftadan 14-haftagacha rejalashtiriladi.',
        ],
      },
      az: {
        babyDescription:
          'Embrion artıq cücə adlanır. Qollar uzanır, baş bir qədər düzəlməyə başlayır, plasenta isə formalaşmağa davam edir.',
        length: 'Təxminən 16 mm',
        comparison: 'Moruq',
        bodyChanges: [
          'İylərə həssaslıq və səhər ürəkbulanması bu mərhələdə geniş yayılıb, lakin hamıda deyil.',
        ],
        toKnow: [
          'Birinci tarixləndirici ultrasəs adətən 8-ci ilə 14-cü həftələr arasında planlaşdırılır.',
        ],
      },
      ka: {
        babyDescription:
          'ემბრიონს ახლა ნაყოფი ეწოდება. ხელები გრძელდება, თავი ოდნავ იმართება და პლაცენტა კვლავ ყალიბდება.',
        length: 'დაახლოებით 16 მმ',
        comparison: 'ჟოლო',
        bodyChanges: [
          'სუნებისადმი მგრძნობელობა და დილის გულისრევა ამ ეტაპზე ხშირია, თუმცა არა უნივერსალური.',
        ],
        toKnow: [
          'პირველი დათარიღების ულტრაბგერა ზოგადად მე-8 და მე-14 კვირებს შორის იგეგმება.',
        ],
      },
      hy: {
        babyDescription:
          'Սաղմն այժմ կոչվում է պտուղ: Ձեռքերը երկարում են, գլուխը սկսում է թեթևակի ուղղվել, և ընկերքը շարունակում է ձևավորվել:',
        length: 'Մոտ 16 մմ',
        comparison: 'Ազնվամորի',
        bodyChanges: [
          'Հոտերի նկատմամբ զգայունությունը և առավոտյան սրտխառնոցը տարածված են այս փուլում, թեև ոչ համընդհանուր:',
        ],
        toKnow: [
          'Ժամկետի որոշման առաջին ուլտրաձայնային հետազոտությունը սովորաբար նախատեսվում է 8-ից 14-րդ շաբաթների միջև:',
        ],
      },
      tg: {
        babyDescription:
          'Ҷанин акнун ҳомила номида мешавад. Дастҳо дароз мешаванд, сар андаке рост шудан мегирад ва машима ташаккул ёфтанро идома медиҳад.',
        length: 'Тақрибан 16 мм',
        comparison: 'Малина',
        bodyChanges: [
          'Ҳассосият ба бӯйҳо ва беҳузурии субҳ дар ин марҳила маъмуланд, гарчанде ки умумӣ нестанд.',
        ],
        toKnow: [
          'Аввалин ултрасадои муайянкунии мӯҳлат одатан байни ҳафтаи 8 ва ҳафтаи 14 банақша гирифта мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Эмбрион эми түйүлдүк деп аталат. Колдор узарып, баш бир аз түздөлө баштайт жана плацента түзүлүүнү улантат.',
        length: 'Болжол менен 16 мм',
        comparison: 'Малина',
        bodyChanges: [
          'Жыттарга сезгичтик жана эртең мененки көңүл айлануу бул этапта кеңири таралган, бирок баарында эмес.',
        ],
        toKnow: [
          'Биринчи мөөнөттү аныктоочу УЗИ адатта 8-жума менен 14-жуманын ортосунда пландалат.',
        ],
      },
      tk: {
        babyDescription:
          'Embrion indi horuş diýlip atlandyrylýar. Eller uzalýar, kelle az-kem gönelip başlaýar we plasenta emele gelmegini dowam etdirýär.',
        length: 'Takmynan 16 mm',
        comparison: 'Malina',
        bodyChanges: [
          'Ysa duýgurlyk we irden ýüregiň bulanmagy bu tapgyrda umumy, emma hemmelerde däl.',
        ],
        toKnow: [
          'Ilkinji wagt kesgitleýji UZI adatça 8-nji bilen 14-nji hepdäniň arasynda meýilleşdirilýär.',
        ],
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
      da: {
        babyDescription: 'Fosteret kaldes nu et foster. Armene strækker sig, hovedet begynder at rette sig lidt op, og moderkagen fortsætter med at dannes.',
        length: 'Ca. 16 mm',
        comparison: 'Hindbær',
        bodyChanges: [
          'Lugtfølsomhed og morgenkvalme er almindelige på dette stadie, men ikke universelle.',
        ],
        toKnow: [
          'Den første dateringsultralyd planlægges generelt mellem uge 8 og uge 14.',
        ],
      },
      sv: {
        babyDescription: 'Fosteret kaldes nu et foster. Armene sträkker sig, hovedet begynder at rette sig lidt op, och moderkagen fortsätter med at dannes.',
        length: 'Ca. 16 mm',
        comparison: 'Hindbär',
        bodyChanges: [
          'Lugtfölsomhed och morgenkvalme ar almindelige på dette stadie, men inte universelle.',
        ],
        toKnow: [
          'Den förste dateringsultralyd planlägges generelt mellem vecka 8 och vecka 14.',
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
      nb: {
        babyDescription:
          'Ansiktstrekkene blir tydeligere, øyelokkene beskytter øynene, og hendene og føttene tar form med de fremtidige fingrene og tærne.',
        length: 'Omtrent 22 mm',
        comparison: 'Jordbær',
        bodyChanges: ['Tydelig tretthet og kvalme kan fortsatt være til stede; de har ofte en tendens til å avta mot slutten av første trimester.'],
        toKnow: ['Kjønnsorganene begynner så vidt å differensiere seg, men kjønnet kan vanligvis ikke påvises før mye senere, ved morfologiultralyden.'],
      },
      pl: {
        babyDescription:
          'Rysy twarzy stają się wyraźniejsze, powieki chronią oczy, a dłonie i stopy nabierają kształtu z przyszłymi palcami.',
        length: 'Około 22 mm',
        comparison: 'Truskawka',
        bodyChanges: ['Wyraźne zmęczenie i nudności mogą nadal występować; często słabną pod koniec pierwszego trymestru.'],
        toKnow: ['Narządy płciowe dopiero zaczynają się różnicować, ale płeć zazwyczaj nie jest możliwa do określenia aż do znacznie późniejszego etapu, podczas USG połówkowego.'],
      },
      uk: {
        babyDescription:
          'Риси обличчя стають виразнішими, повіки захищають очі, а кисті й стопи набувають форми з майбутніми пальцями.',
        length: 'Приблизно 22 мм',
        comparison: 'Полуниця',
        bodyChanges: ['Виразна втома й нудота можуть ще зберігатися; вони часто слабшають до кінця першого триместру.'],
        toKnow: ['Статеві органи лише починають диференціюватися, але стать зазвичай неможливо визначити аж до значно пізнішого етапу, під час УЗД анатомії плода.'],
      },
      cs: {
        babyDescription:
          'Rysy obličeje jsou výraznější, víčka chrání oči a ruce i nohy nabývají tvaru s budoucími prsty.',
        length: 'Asi 22 mm',
        comparison: 'Jahoda',
        bodyChanges: ['Výrazná únava a nevolnost mohou stále přetrvávat; často mívají tendenci ustupovat ke konci prvního trimestru.'],
        toKnow: ['Pohlavní orgány se teprve začínají diferencovat, ale pohlaví obvykle nelze určit až do mnohem pozdější fáze, při morfologickém ultrazvuku.'],
      },
      sk: {
        babyDescription:
          'Črty tváre sa stávajú výraznejšími, viečka chránia oči a ruky a nohy nadobúdajú tvar s budúcimi prstami.',
        length: 'Približne 22 mm',
        comparison: 'Jahoda',
        bodyChanges: [
          'Výrazná únava a nevoľnosť môžu ešte pretrvávať; často majú tendenciu ustupovať ku koncu prvého trimestra.',
        ],
        toKnow: [
          'Pohlavné orgány sa len začínajú diferencovať, ale pohlavie sa zvyčajne nedá určiť až oveľa neskôr, pri morfologickom ultrazvuku.',
        ],
      },
      hu: {
        babyDescription:
          'Az arcvonások határozottabbá válnak, a szemhéjak védik a szemet, a kezek és a lábak pedig formálódnak a leendő ujjakkal.',
        length: 'Körülbelül 22 mm',
        comparison: 'Eper',
        bodyChanges: [
          'Kifejezett fáradtság és hányinger még fennállhat; az első trimeszter vége felé gyakran enyhülnek.',
        ],
        toKnow: [
          'A nemi szervek még csak kezdenek differenciálódni, de a nem általában csak jóval később, a morfológiai ultrahangon állapítható meg.',
        ],
      },
      ro: {
        babyDescription:
          'Trăsăturile feței devin mai definite, pleoapele protejează ochii, iar mâinile și picioarele prind formă, odată cu viitoarele degete.',
        length: 'Aproximativ 22 mm',
        comparison: 'Căpșună',
        bodyChanges: [
          'Oboseala marcată și greața pot fi încă prezente; ele tind adesea să se atenueze spre sfârșitul primului trimestru.',
        ],
        toKnow: [
          'Organele genitale abia încep să se diferențieze, dar sexul nu poate fi de obicei identificat decât mult mai târziu, la ecografia morfologică.',
        ],
      },
      bg: {
        babyDescription:
          'Чертите на лицето стават по-ясно очертани, клепачите предпазват очите, а ръцете и краката придобиват форма заедно с бъдещите пръсти.',
        length: 'Около 22 мм',
        comparison: 'Ягода',
        bodyChanges: [
          'Изразената умора и гадене може все още да присъстват; те често имат склонност да отшумяват към края на първия триместър.',
        ],
        toKnow: [
          'Половите органи едва започват да се диференцират, но полът обикновено не може да се определи много по-късно, на морфологичната ехография.',
        ],
      },
      sr: {
        babyDescription:
          'Црте лица постају јасније, капци штите очи, а шаке и стопала добијају облик са будућим прстима.',
        length: 'Око 22 мм',
        comparison: 'Јагода',
        bodyChanges: [
          'Изражен умор и мучнина могу још бити присутни; често теже да јењавају до краја првог триместра.',
        ],
        toKnow: [
          'Полни органи тек почињу да се диференцирају, али се пол обично не може одредити много касније, на морфолошком ултразвуку.',
        ],
      },
      hr: {
        babyDescription:
          'Crte lica postaju jasnije, kapci štite oči, a šake i stopala dobivaju oblik s budućim prstima.',
        length: 'Oko 22 mm',
        comparison: 'Jagoda',
        bodyChanges: [
          'Izražen umor i mučnina mogu još biti prisutni; često teže popuštaju pred kraj prvog trimestra.',
        ],
        toKnow: [
          'Spolni organi tek se počinju diferencirati, ali se spol obično ne može odrediti puno kasnije, na morfološkom ultrazvuku.',
        ],
      },
      bs: {
        babyDescription:
          'Crte lica postaju jasnije, kapci štite oči, a šake i stopala dobivaju oblik s budućim prstima.',
        length: 'Oko 22 mm',
        comparison: 'Jagoda',
        bodyChanges: [
          'Izražen umor i mučnina mogu još biti prisutni; često teže popuštaju pred kraj prvog trimestra.',
        ],
        toKnow: [
          'Spolni organi tek se počinju diferencirati, ali se spol obično ne može odrediti puno kasnije, na morfološkom ultrazvuku.',
        ],
      },
      sl: {
        babyDescription:
          'Obrazne črte postajajo jasnejše, veke ščitijo oči, dlani in stopala pa dobivajo obliko z bodočimi prsti.',
        length: 'Približno 22 mm',
        comparison: 'Jagoda',
        bodyChanges: [
          'Izrazita utrujenost in slabost lahko še vedno trajata; pogosto težje popustita pred koncem prvega trimesečja.',
        ],
        toKnow: [
          'Spolni organi se šele začenjajo diferencirati, vendar se spol običajno ne more določiti precej pozneje, na morfološkem ultrazvoku.',
        ],
      },
      ne: {
        babyDescription:
          'अनुहारका विशेषताहरू बढी स्पष्ट हुन्छन्, परेलाले आँखा जोगाउँछन्, र हात तथा खुट्टाले भविष्यका औँलाहरूसहित आकार लिँदै छन्।',
        length: 'करिब 22 मिमि',
        comparison: 'स्ट्रबेरी',
        bodyChanges: [
          'ठूलो थकान र वाकवाकी अझै रहन सक्छन्; ती प्रायः पहिलो त्रैमासिकको अन्त्यतिर हल्का हुने प्रवृत्ति देखाउँछन्।',
        ],
        toKnow: [
          'जननाङ्गहरू भर्खरै फरक हुन थालेका छन्, तर लिङ्ग सामान्यतया धेरै पछि, आकारिकीय अल्ट्रासाउन्डमा मात्र पहिचान हुन्छ।',
        ],
      },
      si: {
        babyDescription:
          'මුහුණේ ලක්ෂණ වඩා පැහැදිලි වන අතර, ඇසි පිය ඇස් ආරක්ෂා කරයි, සහ අත් සහ පාද අනාගත ඇඟිලි සමඟ හැඩගැසෙමින් පවතී.',
        length: 'මි.මී. 22 පමණ',
        comparison: 'ස්ට්‍රෝබෙරි ගෙඩියක්',
        bodyChanges: [
          'කැපී පෙනෙන වෙහෙස සහ ඔක්කාරය තවමත් පැවතිය හැක; ඒවා බොහෝ විට පළමු ත්‍රෛමාසිකය අවසානය වන විට සමනය වීමට නැඹුරු වේ.',
        ],
        toKnow: [
          'ලිංගික අවයව වෙන්කර හඳුනාගැනීමට අවශ්‍ය අවයව සෑදීමට පටන් ගනී, නමුත් ලිංගය සාමාන්‍යයෙන් බොහෝ කලකට පසුව, ව්‍යුහ අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයේදී පමණක් හඳුනාගත හැක.',
        ],
      },
      th: {
        babyDescription:
          'ลักษณะใบหน้าชัดขึ้น เปลือกตาปกป้องดวงตา และมือกับเท้ากำลังก่อรูปพร้อมนิ้วมือนิ้วเท้าในอนาคต',
        length: 'ประมาณ 22 มม.',
        comparison: 'สตรอว์เบอร์รี',
        bodyChanges: [
          'อาจยังเหนื่อยล้าและคลื่นไส้มาก มักมีแนวโน้มบรรเทาลงเมื่อสิ้นสุดไตรมาสแรก',
        ],
        toKnow: [
          'อวัยวะเพศเพิ่งเริ่มแยกความแตกต่าง แต่โดยทั่วไปยังระบุเพศไม่ได้จนกระทั่งภายหลังมาก ที่อัลตราซาวนด์ดูโครงสร้าง',
        ],
      },
      vi: {
        babyDescription:
          'Các đường nét khuôn mặt rõ ràng hơn, mí mắt bảo vệ đôi mắt, bàn tay và bàn chân đang thành hình cùng các ngón tay và ngón chân tương lai.',
        length: 'Khoảng 22 mm',
        comparison: 'Quả dâu tây',
        bodyChanges: [
          'Mệt mỏi và buồn nôn rõ rệt có thể vẫn còn; chúng thường có xu hướng giảm dần vào cuối tam cá nguyệt thứ nhất.',
        ],
        toKnow: [
          'Các cơ quan sinh dục mới bắt đầu phân hóa, nhưng giới tính thường chưa thể xác định cho đến muộn hơn nhiều, ở lần siêu âm hình thái.',
        ],
      },
      uz: {
        babyDescription:
          'Yuz belgilari aniqroq boʻladi, qovoqlar koʻzlarni himoya qiladi, qoʻl va oyoqlar kelajakdagi barmoqlar bilan shakllanmoqda.',
        length: 'Taxminan 22 mm',
        comparison: 'Qulupnay',
        bodyChanges: [
          'Sezilarli charchoq va koʻngil aynishi hali ham boʻlishi mumkin; ular koʻpincha birinchi trimestr oxiriga kelib yengillashadi.',
        ],
        toKnow: [
          'Jinsiy aʼzolar endigina farqlana boshlaydi, lekin jins odatda ancha keyinroq, morfologik UZI da aniqlanadi.',
        ],
      },
      az: {
        babyDescription:
          'Üz cizgiləri daha aydın olur, göz qapaqları gözləri qoruyur, əllər və ayaqlar gələcək barmaqlarla birlikdə forma alır.',
        length: 'Təxminən 22 mm',
        comparison: 'Çiyələk',
        bodyChanges: [
          'Nəzərəçarpan yorğunluq və ürəkbulanma hələ də ola bilər; onlar çox vaxt birinci trimestrin sonuna doğru azalmağa meyllidir.',
        ],
        toKnow: [
          'Cinsiyyət orqanları yenicə fərqlənməyə başlayır, lakin cinsiyyət adətən xeyli sonra, anatomik ultrasəsdə müəyyən edilə bilir.',
        ],
      },
      ka: {
        babyDescription:
          'სახის ნაკვთები უფრო გამოკვეთილი ხდება, ქუთუთოები თვალებს იცავს, ხოლო ხელები და ფეხები ყალიბდება მომავალი თითებით.',
        length: 'დაახლოებით 22 მმ',
        comparison: 'მარწყვი',
        bodyChanges: [
          'გამოხატული დაღლილობა და გულისრევა კვლავ შეიძლება იყოს; ისინი ხშირად პირველი ტრიმესტრის ბოლოსკენ ნელდება.',
        ],
        toKnow: [
          'სასქესო ორგანოები ახლახან იწყებს დიფერენციაციას, მაგრამ სქესი ზოგადად გაცილებით გვიან, ანატომიურ ულტრაბგერაზე ხდება დადგენადი.',
        ],
      },
      hy: {
        babyDescription:
          'Դեմքի գծերը դառնում են ավելի հստակ, կոպերը պաշտպանում են աչքերը, իսկ ձեռքերն ու ոտքերը ձևավորվում են՝ ապագա մատներով:',
        length: 'Մոտ 22 մմ',
        comparison: 'Ելակ',
        bodyChanges: [
          'Արտահայտված հոգնածությունն ու սրտխառնոցը դեռ կարող են առկա լինել. դրանք հաճախ հակված են թեթևանալ առաջին եռամսյակի վերջում:',
        ],
        toKnow: [
          'Սեռական օրգանները հենց նոր սկսում են տարբերակվել, բայց սեռը սովորաբար հնարավոր չէ որոշել մինչև շատ ավելի ուշ՝ մորֆոլոգիական ուլտրաձայնային հետազոտության ժամանակ:',
        ],
      },
      tg: {
        babyDescription:
          'Хусусиятҳои рӯй возеҳтар мешаванд, пилкҳо чашмонро муҳофизат мекунанд ва дастҳо ва пойҳо бо ангуштони оянда шакл мегиранд.',
        length: 'Тақрибан 22 мм',
        comparison: 'Қулфинай',
        bodyChanges: [
          'Хастагӣ ва беҳузурии назаррас ҳанӯз метавонанд мавҷуд бошанд; онҳо аксар вақт майл доранд то охири триместри аввал сабук шаванд.',
        ],
        toKnow: [
          'Узвҳои таносулӣ танҳо оғози тафриқшавӣ мекунанд, вале ҷинс одатан то хеле дертар, дар ултрасадои анатомӣ, муайян карда намешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Бет белгилери даанараак болот, кабактар көздү коргойт, ал эми колдор менен буттар келечектеги манжалар менен бирге формасын алууда.',
        length: 'Болжол менен 22 мм',
        comparison: 'Кулпунай',
        bodyChanges: [
          'Байкалаарлык чарчоо жана көңүл айлануу дагы эле болушу мүмкүн; алар көбүнчө биринчи триместрдин аягында басаңдайт.',
        ],
        toKnow: [
          'Жыныстык органдар жаңы эле айырмалана баштайт, бирок жынысы адатта андан бир кыйла кийин, анатомиялык УЗИде гана аныкталат.',
        ],
      },
      tk: {
        babyDescription:
          'Ýüz aýratynlyklary has aýdyň bolýar, gabaklar gözleri goraýar, eller we aýaklar geljekki barmaklar bilen şekillenýär.',
        length: 'Takmynan 22 mm',
        comparison: 'Ýer çigelegi',
        bodyChanges: [
          'Aýdyň ýadawlyk we ýüregiň bulanmagy henizem bolup biler; olar köplenç birinji trimestriň ahyryna çenli peselýär.',
        ],
        toKnow: [
          'Jynsy agzalar ýaňy tapawutlanyp başlaýar, ýöne jyns adatça diňe has soň, anatomiýa UZI-sinde kesgitlenýär.',
        ],
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
      da: {
        babyDescription: 'Ansigtstrækkene bliver mere tydelige, øjenlågene beskytter øjnene, og hænder og fødder tager form med de kommende fingre og tæer.',
        length: 'Ca. 22 mm',
        comparison: 'Jordbær',
        bodyChanges: [
          'Udtalt træthed og kvalme kan stadig forekomme; de aftager ofte mod slutningen af første trimester.',
        ],
        toKnow: [
          'Kønsorganerne er netop ved at differentiere sig, men kønnet kan generelt ikke bestemmes før meget senere ved anatomiultralyd.',
        ],
      },
      sv: {
        babyDescription: 'Ansigtsträkkene bliver mere tydelige, öjenlågene beskytter öjnene, och händer och födder tager form med de kommende fingre och täer.',
        length: 'Ca. 22 mm',
        comparison: 'Jordbär',
        bodyChanges: [
          'Udtalt träthed och kvalme kan fortfarande forekomme; de aftager ofte mod slutningen av förste trimester.',
        ],
        toKnow: [
          'Könsorganerne ar netop ved at differentiere sig, men könnet kan generelt inte bestemmes för mycket senere ved anatomiultralyd.',
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
      nb: {
        babyDescription:
          'Ansiktet blir mer gjenkjennelig, øyelokkene reagerer på lys, og hjertet slår i høyt tempo, omtrent tre ganger raskere enn hos en voksen.',
        length: 'Omtrent 30 mm',
        comparison: 'Liten aprikos',
        bodyChanges: ['Livvidden din kan begynne å endre seg litt, selv om magen vanligvis ikke er synlig ennå.'],
        toKnow: ['Kombinert screening i første trimester, når den tilbys, gjøres vanligvis mellom uke 11 og uke 14.'],
      },
      pl: {
        babyDescription:
          'Twarz staje się bardziej rozpoznawalna, powieki reagują na światło, a serce bije w szybkim tempie, około trzy razy szybciej niż u osoby dorosłej.',
        length: 'Około 30 mm',
        comparison: 'Mała morela',
        bodyChanges: ['Obwód Twojej talii może zacząć się nieznacznie zmieniać, choć brzuch zazwyczaj nie jest jeszcze widoczny.'],
        toKnow: ['Łączne badanie przesiewowe w pierwszym trymestrze, jeśli jest oferowane, jest zazwyczaj wykonywane między 11. a 14. tygodniem.'],
      },
      uk: {
        babyDescription:
          'Обличчя стає більш упізнаваним, повіки реагують на світло, а серце б’ється швидко, приблизно втричі швидше, ніж у дорослого.',
        length: 'Приблизно 30 мм',
        comparison: 'Маленький абрикос',
        bodyChanges: ['Об’єм вашої талії може почати трохи змінюватися, хоча живіт зазвичай ще не видно.'],
        toKnow: ['Комбінований скринінг першого триместру, якщо його пропонують, зазвичай проводять між 11-м і 14-м тижнем.'],
      },
      cs: {
        babyDescription:
          'Obličej je rozpoznatelnější, víčka reagují na světlo a srdce bije rychlým tempem, asi třikrát rychleji než u dospělého.',
        length: 'Asi 30 mm',
        comparison: 'Malá meruňka',
        bodyChanges: ['Váš pas se může začít mírně měnit, i když břicho obvykle ještě není vidět.'],
        toKnow: ['Kombinovaný screening v prvním trimestru, pokud je nabízen, se obvykle provádí mezi 11. a 14. týdnem.'],
      },
      sk: {
        babyDescription:
          'Tvár sa stáva rozpoznateľnejšou, viečka reagujú na svetlo a srdce bije rýchlym tempom, približne trikrát rýchlejšie ako u dospelého.',
        length: 'Približne 30 mm',
        comparison: 'Malá marhuľa',
        bodyChanges: [
          'Váš pás sa môže začať mierne meniť, hoci brucho zvyčajne ešte nie je viditeľné.',
        ],
        toKnow: [
          'Kombinovaný skríning v prvom trimestri, ak sa ponúka, sa zvyčajne robí medzi 11. a 14. týždňom.',
        ],
      },
      hu: {
        babyDescription:
          'Az arc felismerhetőbbé válik, a szemhéjak reagálnak a fényre, és a szív gyors ütemben ver, nagyjából háromszor gyorsabban, mint egy felnőtté.',
        length: 'Körülbelül 30 mm',
        comparison: 'Kis sárgabarack',
        bodyChanges: [
          'A derékbőséged kissé változni kezdhet, bár a has általában még nem látható.',
        ],
        toKnow: [
          'A kombinált első trimeszteri szűrést, ha felajánlják, általában a 11. és a 14. hét között végzik.',
        ],
      },
      ro: {
        babyDescription:
          'Fața devine mai recognoscibilă, pleoapele reacționează la lumină, iar inima bate într-un ritm rapid, de aproximativ trei ori mai repede decât a unui adult.',
        length: 'Aproximativ 30 mm',
        comparison: 'Caisă mică',
        bodyChanges: [
          'Talia ta poate începe să se schimbe ușor, chiar dacă burta nu este în general vizibilă încă.',
        ],
        toKnow: [
          'Screeningul combinat din primul trimestru, atunci când este propus, se face în general între săptămâna 11 și săptămâna 14.',
        ],
      },
      bg: {
        babyDescription:
          'Лицето става по-разпознаваемо, клепачите реагират на светлина, а сърцето бие с бърз ритъм, около три пъти по-бърз от този на възрастен.',
        length: 'Около 30 мм',
        comparison: 'Малка кайсия',
        bodyChanges: [
          'Талията ти може да започне леко да се променя, макар коремът обикновено още да не се вижда.',
        ],
        toKnow: [
          'Комбинираният скрининг през първия триместър, когато е предложен, обикновено се прави между 11-ата и 14-ата седмица.',
        ],
      },
      sr: {
        babyDescription:
          'Лице постаје препознатљивије, капци реагују на светлост, а срце куца брзим ритмом, око три пута бржим од срца одраслог.',
        length: 'Око 30 мм',
        comparison: 'Мала кајсија',
        bodyChanges: [
          'Твој струк може почети благо да се мења, мада стомак обично још није видљив.',
        ],
        toKnow: [
          'Комбиновани скрининг у првом триместру, када се предложи, обично се ради између 11. и 14. недеље.',
        ],
      },
      hr: {
        babyDescription:
          'Lice postaje prepoznatljivije, kapci reagiraju na svjetlost, a srce kuca brzim ritmom, otprilike tri puta bržim od srca odrasle osobe.',
        length: 'Oko 30 mm',
        comparison: 'Mala marelica',
        bodyChanges: [
          'Struk ti se može početi neznatno mijenjati, iako trbuh obično još nije vidljiv.',
        ],
        toKnow: [
          'Kombinirani probir u prvom trimestru, kad se predloži, obično se radi između 11. i 14. tjedna.',
        ],
      },
      bs: {
        babyDescription:
          'Lice postaje prepoznatljivije, kapci reagiraju na svjetlost, a srce kuca brzim ritmom, otprilike tri puta bržim od srca odrasle osobe.',
        length: 'Oko 30 mm',
        comparison: 'Mala marelica',
        bodyChanges: [
          'Struk ti se može početi neznatno mijenjati, iako trbuh obično još nije vidljiv.',
        ],
        toKnow: [
          'Kombinirani probir u prvom trimestru, kad se predloži, obično se radi između 11. i 14. sedmice.',
        ],
      },
      sl: {
        babyDescription:
          'Obraz postaja bolj prepoznaven, veke se odzivajo na svetlobo, srce pa bije s hitrim ritmom, približno trikrat hitrejšim od srca odraslega.',
        length: 'Približno 30 mm',
        comparison: 'Mala marelica',
        bodyChanges: [
          'Tvoj pas se lahko začne rahlo spreminjati, čeprav trebuh običajno še ni viden.',
        ],
        toKnow: [
          'Kombinirano presejanje v prvem trimesečju, kadar se predlaga, se običajno opravi med 11. in 14. tednom.',
        ],
      },
      ne: {
        babyDescription:
          'अनुहार बढी चिनिने हुन्छ, परेलाहरूले उज्यालोप्रति प्रतिक्रिया दिन्छन्, र मुटु वयस्कको भन्दा करिब तीन गुणा छिटो गतिमा धड्कन्छ।',
        length: 'करिब 30 मिमि',
        comparison: 'सानो खुर्पानी',
        bodyChanges: [
          'तपाईंको कम्मर अलिकति बदलिन थाल्न सक्छ, यद्यपि पेट सामान्यतया अझै देखिँदैन।',
        ],
        toKnow: [
          'पहिलो त्रैमासिकको संयुक्त जाँच, प्रस्ताव गरिएको अवस्थामा, सामान्यतया हप्ता 11 र हप्ता 14 बीच गरिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'මුහුණ වඩා හඳුනාගත හැකි වන අතර, ඇසි පිය ආලෝකයට ප්‍රතිචාර දක්වයි, සහ හදවත වේගවත් වේගයකින් ගැහේ, වැඩිහිටියෙකුගේ වේගය මෙන් තුන් ගුණයක් පමණ.',
        length: 'මි.මී. 30 පමණ',
        comparison: 'කුඩා ඇප්‍රිකොට් ගෙඩියක්',
        bodyChanges: [
          'බඩ සාමාන්‍යයෙන් තවමත් දෘශ්‍යමාන නොවුනත්, ඔබේ ඉණ තරමක් වෙනස් වීමට පටන් ගත හැක.',
        ],
        toKnow: [
          'පළමු ත්‍රෛමාසික ඒකාබද්ධ පරීක්ෂාව, ඉදිරිපත් කරන විට, සාමාන්‍යයෙන් 11 වන සතිය සහ 14 වන සතිය අතර සිදු කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ใบหน้าเริ่มจดจำได้มากขึ้น เปลือกตาตอบสนองต่อแสง และหัวใจเต้นในอัตราเร็ว ราวสามเท่าของผู้ใหญ่',
        length: 'ประมาณ 30 มม.',
        comparison: 'แอปริคอตลูกเล็ก',
        bodyChanges: [
          'รอบเอวของคุณอาจเริ่มเปลี่ยนเล็กน้อย แม้โดยทั่วไปยังมองไม่เห็นหน้าท้อง',
        ],
        toKnow: [
          'การตรวจคัดกรองรวมในไตรมาสแรก เมื่อมีให้ โดยทั่วไปทำระหว่างสัปดาห์ที่ 11 ถึงสัปดาห์ที่ 14',
        ],
      },
      vi: {
        babyDescription:
          'Khuôn mặt trở nên dễ nhận ra hơn, mí mắt phản ứng với ánh sáng và tim đập với nhịp nhanh, khoảng nhanh gấp ba lần người lớn.',
        length: 'Khoảng 30 mm',
        comparison: 'Quả mơ nhỏ',
        bodyChanges: [
          'Vòng eo của bạn có thể bắt đầu thay đổi nhẹ, dù bụng thường chưa nhìn thấy rõ.',
        ],
        toKnow: [
          'Sàng lọc kết hợp tam cá nguyệt thứ nhất, khi được đề xuất, thường được thực hiện trong khoảng từ tuần 11 đến tuần 14.',
        ],
      },
      uz: {
        babyDescription:
          'Yuz tanishroq boʻladi, qovoqlar yorugʻlikka javob beradi va yurak tez, kattalarnikidan taxminan uch barobar tezroq uradi.',
        length: 'Taxminan 30 mm',
        comparison: 'Kichik oʻrik',
        bodyChanges: [
          'Belingiz ozgina oʻzgara boshlashi mumkin, garchi qorin odatda hali koʻrinmasa ham.',
        ],
        toKnow: [
          'Birinchi trimestrning kombinatsiyalangan skrining, taklif qilinganda, odatda 11-haftadan 14-haftagacha oʻtkaziladi.',
        ],
      },
      az: {
        babyDescription:
          'Üz daha tanınan olur, göz qapaqları işığa reaksiya verir və ürək böyüklərinkindən təxminən üç dəfə sürətli, yüksək tempdə döyünür.',
        length: 'Təxminən 30 mm',
        comparison: 'Kiçik ərik',
        bodyChanges: [
          'Qarın adətən hələ görünməsə də, bel çevrəniz bir qədər dəyişməyə başlaya bilər.',
        ],
        toKnow: [
          'Birinci trimestrin kombinə edilmiş skrininqi, təklif olunduqda, adətən 11-ci ilə 14-cü həftələr arasında aparılır.',
        ],
      },
      ka: {
        babyDescription:
          'სახე უფრო ამოსაცნობი ხდება, ქუთუთოები სინათლეზე რეაგირებს, გული კი სწრაფ რიტმს ფეთქავს, დაახლოებით სამჯერ უფრო სწრაფად, ვიდრე ზრდასრულის.',
        length: 'დაახლოებით 30 მმ',
        comparison: 'პატარა გარგარი',
        bodyChanges: [
          'თქვენი წელი შეიძლება მცირედ იცვლებოდეს, თუმცა მუცელი ზოგადად ჯერ არ ჩანს.',
        ],
        toKnow: [
          'პირველი ტრიმესტრის კომბინირებული სკრინინგი, როცა შეთავაზებულია, ზოგადად მე-11 და მე-14 კვირებს შორის ტარდება.',
        ],
      },
      hy: {
        babyDescription:
          'Դեմքը դառնում է ավելի ճանաչելի, կոպերը արձագանքում են լույսին, իսկ սիրտը բաբախում է արագ տեմպով՝ չափահասի սրտից մոտ երեք անգամ արագ:',
        length: 'Մոտ 30 մմ',
        comparison: 'Փոքր ծիրան',
        bodyChanges: [
          'Ձեր գոտկատեղը կարող է սկսել թեթևակի փոխվել, թեև որովայնը սովորաբար դեռ տեսանելի չէ:',
        ],
        toKnow: [
          'Առաջին եռամսյակի համակցված սկրինինգը, երբ առաջարկվում է, սովորաբար կատարվում է 11-ից 14-րդ շաբաթների միջև:',
        ],
      },
      tg: {
        babyDescription:
          'Рӯй шиносотар мешавад, пилкҳо ба рӯшноӣ вокуниш нишон медиҳанд ва дил бо суръати баланд, тақрибан се маротиба зудтар аз дили калонсол, метапад.',
        length: 'Тақрибан 30 мм',
        comparison: 'Зардолуи хурд',
        bodyChanges: [
          'Камари шумо метавонад андаке тағйир ёфтанро оғоз кунад, гарчанде ки шикам одатан ҳанӯз намоён нест.',
        ],
        toKnow: [
          'Ташхиси омехтаи триместри аввал, вақте ки пешниҳод мешавад, одатан байни ҳафтаи 11 ва ҳафтаи 14 анҷом дода мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Бет тааныларлык болот, кабактар жарыкка реакция берет жана жүрөк ылдам ритмде, чоңдукуна караганда болжол менен үч эсе ылдамыраак согот.',
        length: 'Болжол менен 30 мм',
        comparison: 'Кичинекей өрүк',
        bodyChanges: [
          'Курсак адатта азырынча көрүнбөсө да, белиңиздин формасы бир аз өзгөрүп башташы мүмкүн.',
        ],
        toKnow: [
          'Сунушталса, биринчи триместрдин айкалышкан скринингин адатта 11-жума менен 14-жуманын ортосунда жасашат.',
        ],
      },
      tk: {
        babyDescription:
          'Ýüz has tanalýan bolýar, gabaklar ýagtylyga jogap berýär we ýürek uly adamyňkydan takmynan üç esse çalt urýar.',
        length: 'Takmynan 30 mm',
        comparison: 'Kiçi erik',
        bodyChanges: [
          'Biliňiz az-kem üýtgäp başlap biler, garyn heniz adatça görünmese-de.',
        ],
        toKnow: [
          'Teklip edilende, utgaşdyrylan birinji trimestr barlagy adatça 11-nji bilen 14-nji hepdäniň arasynda geçirilýär.',
        ],
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
      da: {
        babyDescription: 'Ansigtet bliver mere genkendeligt, øjenlågene reagerer på lys, og hjertet slår hurtigt – ca. tre gange hurtigere end en voksens.',
        length: 'Ca. 30 mm',
        comparison: 'Lille abrikos',
        bodyChanges: [
          'Dit taljemål kan begynde at ændre sig lidt, selvom maven generelt ikke er synlig endnu.',
        ],
        toKnow: [
          'Kombineret første-trimester-screening, når det tilbydes, foretages generelt mellem uge 11 og uge 14.',
        ],
      },
      sv: {
        babyDescription: 'Ansigtet bliver mere genkendeligt, öjenlågene reagerer på lys, och hjertet slår hurtigt – ca. tre gange hurtigere end en voksens.',
        length: 'Ca. 30 mm',
        comparison: 'Lille abrikos',
        bodyChanges: [
          'Dit taljemål kan begynde at ändre sig lidt, selvom maven generelt inte ar synlig endnu.',
        ],
        toKnow: [
          'Kombineret förste-trimester-screening, når det tilbydes, foretages generelt mellem vecka 11 och vecka 14.',
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
      nb: {
        babyDescription:
          'Fingrene og tærne skiller seg fra hverandre, bitte små negler dukker opp, og morkaken tar gradvis over etter plommesekken i å gi fosteret næring.',
        length: 'Omtrent 41 mm',
        comparison: 'Fiken',
        bodyChanges: ['Du kan merke humørsvingninger, knyttet særlig til hormonelle endringer.'],
        toKnow: ['Babyens bevegelser er i ferd med å begynne, men de kjennes vanligvis ikke ennå på dette stadiet.'],
      },
      pl: {
        babyDescription:
          'Palce u rąk i nóg się oddzielają, pojawiają się maleńkie paznokcie, a łożysko stopniowo przejmuje od pęcherzyka żółtkowego odżywianie płodu.',
        length: 'Około 41 mm',
        comparison: 'Figa',
        bodyChanges: ['Możesz zauważyć wahania nastroju, związane w szczególności ze zmianami hormonalnymi.'],
        toKnow: ['Ruchy dziecka zaczynają się, ale na tym etapie zazwyczaj nie są jeszcze odczuwalne.'],
      },
      uk: {
        babyDescription:
          'Пальці рук і ніг відокремлюються, з’являються крихітні нігті, а плацента поступово перебирає від жовткового мішка живлення плода.',
        length: 'Приблизно 41 мм',
        comparison: 'Інжир',
        bodyChanges: ['Ви можете помічати перепади настрою, пов’язані, зокрема, з гормональними змінами.'],
        toKnow: ['Рухи дитини починаються, але на цьому етапі зазвичай ще не відчуваються.'],
      },
      cs: {
        babyDescription:
          'Prsty na rukou i nohou se oddělují, objevují se drobné nehty a placenta postupně přebírá od žloutkového váčku výživu plodu.',
        length: 'Asi 41 mm',
        comparison: 'Fík',
        bodyChanges: ['Můžete si všimnout výkyvů nálady, souvisejících zejména s hormonálními změnami.'],
        toKnow: ['Pohyby miminka začínají, ale v této fázi se obvykle ještě necítí.'],
      },
      sk: {
        babyDescription:
          'Prsty na rukách a nohách sa oddeľujú, objavujú sa drobné nechty a placenta postupne preberá od žĺtkového vaku úlohu vyživovať plod.',
        length: 'Približne 41 mm',
        comparison: 'Figa',
        bodyChanges: [
          'Môžete si všimnúť výkyvy nálady, ktoré súvisia najmä s hormonálnymi zmenami.',
        ],
        toKnow: [
          'Pohyby bábätka sa začínajú, ale v tejto fáze sa zvyčajne ešte nepociťujú.',
        ],
      },
      hu: {
        babyDescription:
          'Az ujjak és lábujjak elkülönülnek, apró körmök jelennek meg, és a lepény fokozatosan átveszi a szikzacskótól a magzat táplálását.',
        length: 'Körülbelül 41 mm',
        comparison: 'Füge',
        bodyChanges: [
          'Hangulatingadozásokat vehetsz észre, amelyek különösen a hormonális változásokhoz kapcsolódnak.',
        ],
        toKnow: [
          'A baba mozgásai megkezdődnek, de ebben a szakaszban általában még nem érezhetők.',
        ],
      },
      ro: {
        babyDescription:
          'Degetele de la mâini și de la picioare se separă, apar unghii minuscule, iar placenta preia treptat de la sacul vitelin rolul de a hrăni fătul.',
        length: 'Aproximativ 41 mm',
        comparison: 'Smochină',
        bodyChanges: [
          'Poți observa schimbări de dispoziție, legate în special de schimbările hormonale.',
        ],
        toKnow: [
          'Mișcările bebelușului încep, dar în general nu sunt simțite încă în această etapă.',
        ],
      },
      bg: {
        babyDescription:
          'Пръстите на ръцете и краката се разделят, появяват се мъничките нокти, а плацентата постепенно поема от жълтъчната торбичка храненето на плода.',
        length: 'Около 41 мм',
        comparison: 'Смокиня',
        bodyChanges: [
          'Можеш да забележиш промени в настроението, свързани по-специално с хормоналните промени.',
        ],
        toKnow: [
          'Движенията на бебето започват, но обикновено още не се усещат на този етап.',
        ],
      },
      sr: {
        babyDescription:
          'Прсти на рукама и ногама се раздвајају, појављују се мали нокти, а плацента постепено преузима од жуманчане кесе храњење плода.',
        length: 'Око 41 мм',
        comparison: 'Смоква',
        bodyChanges: [
          'Можеш приметити промене расположења, повезане нарочито са хормонским променама.',
        ],
        toKnow: [
          'Покрети бебе почињу, али се обично још не осећају у овој фази.',
        ],
      },
      hr: {
        babyDescription:
          'Prsti na rukama i nogama se odvajaju, pojavljuju se mali nokti, a posteljica postupno preuzima od žumanjčane vrećice hranjenje fetusa.',
        length: 'Oko 41 mm',
        comparison: 'Smokva',
        bodyChanges: [
          'Možeš primijetiti promjene raspoloženja, povezane osobito s hormonskim promjenama.',
        ],
        toKnow: [
          'Bebini pokreti počinju, ali se u ovoj fazi obično još ne osjećaju.',
        ],
      },
      bs: {
        babyDescription:
          'Prsti na rukama i nogama se odvajaju, pojavljuju se mali nokti, a posteljica postupno preuzima od žumanjčane vrećice hranjenje fetusa.',
        length: 'Oko 41 mm',
        comparison: 'Smokva',
        bodyChanges: [
          'Možeš primijetiti promjene raspoloženja, povezane osobito s hormonskim promjenama.',
        ],
        toKnow: [
          'Bebini pokreti počinju, ali se u ovoj fazi obično još ne osjećaju.',
        ],
      },
      sl: {
        babyDescription:
          'Prsti na rokah in nogah se ločijo, pojavijo se majhni nohti, posteljica pa postopoma prevzema od rumenjakove vrečke hranjenje ploda.',
        length: 'Približno 41 mm',
        comparison: 'Figa',
        bodyChanges: [
          'Lahko opaziš spremembe razpoloženja, povezane zlasti s hormonskimi spremembami.',
        ],
        toKnow: [
          'Dojenčkovi gibi se začnejo, vendar se v tej fazi običajno še ne čutijo.',
        ],
      },
      ne: {
        babyDescription:
          'हात र खुट्टाका औँलाहरू छुट्टिन्छन्, साना नङहरू देखिन्छन्, र प्लासेन्टाले बिस्तारै गर्भस्थ शिशुलाई पोषण दिन पित्त थैलीबाट जिम्मेवारी लिँदै छ।',
        length: 'करिब 41 मिमि',
        comparison: 'अञ्जीर',
        bodyChanges: [
          'तपाईंले मनोदशामा उतारचढाव देख्न सक्नुहुन्छ, जुन विशेष गरी हर्मोनल परिवर्तनसँग जोडिएको हुन्छ।',
        ],
        toKnow: [
          'शिशुका चालहरू सुरु हुँदै छन्, तर यस चरणमा सामान्यतया अझै महसुस हुँदैनन्।',
        ],
      },
      si: {
        babyDescription:
          'ඇඟිලි සහ පාද ඇඟිලි වෙන් වන අතර, කුඩා නියපොතු දිස්වන අතර, වැදෑමහ කළලයට පෝෂණය සැපයීමේදී කහ මදය පටලයෙන් ක්‍රමයෙන් භාර ගනී.',
        length: 'මි.මී. 41 පමණ',
        comparison: 'අත්තික්කා ගෙඩියක්',
        bodyChanges: [
          'විශේෂයෙන් හෝමෝන වෙනස්කම් සමඟ සම්බන්ධ මනෝභාව උච්චාවචනය ඔබට දැකිය හැක.',
        ],
        toKnow: [
          'දරුවාගේ චලනයන් ආරම්භ වේ, නමුත් මෙම අවධියේදී ඒවා සාමාන්‍යයෙන් තවම නොදැනේ.',
        ],
      },
      th: {
        babyDescription:
          'นิ้วมือนิ้วเท้าแยกจากกัน เล็บเล็ก ๆ ปรากฏ และรกค่อย ๆ รับหน้าที่ให้อาหารทารกในครรภ์แทนถุงไข่แดง',
        length: 'ประมาณ 41 มม.',
        comparison: 'มะเดื่อ',
        bodyChanges: [
          'คุณอาจสังเกตเห็นอารมณ์แปรปรวน ซึ่งเกี่ยวข้องกับการเปลี่ยนแปลงของฮอร์โมนโดยเฉพาะ',
        ],
        toKnow: [
          'ทารกเริ่มเคลื่อนไหวแล้ว แต่โดยทั่วไปยังไม่รู้สึกได้ในระยะนี้',
        ],
      },
      vi: {
        babyDescription:
          'Các ngón tay và ngón chân tách ra, móng tay nhỏ xíu xuất hiện và nhau thai dần thay thế túi noãn hoàng trong việc nuôi dưỡng thai nhi.',
        length: 'Khoảng 41 mm',
        comparison: 'Quả sung',
        bodyChanges: [
          'Bạn có thể nhận thấy tâm trạng thay đổi thất thường, liên quan đặc biệt đến những thay đổi nội tiết.',
        ],
        toKnow: [
          'Các cử động của em bé đang bắt đầu, nhưng thường chưa cảm nhận được ở giai đoạn này.',
        ],
      },
      uz: {
        babyDescription:
          'Qoʻl va oyoq barmoqlari ajraladi, mayda tirnoqlar paydo boʻladi va yoʻldosh homilani oziqlantirishda asta-sekin sarigʻlik qopchasi oʻrnini egallaydi.',
        length: 'Taxminan 41 mm',
        comparison: 'Anjir',
        bodyChanges: [
          'Xususan, gormonal oʻzgarishlar bilan bogʻliq kayfiyatning keskin oʻzgarishini sezishingiz mumkin.',
        ],
        toKnow: [
          'Chaqaloqning harakatlari boshlanmoqda, lekin bu bosqichda odatda hali sezilmaydi.',
        ],
      },
      az: {
        babyDescription:
          'Əl və ayaq barmaqları ayrılır, kiçik dırnaqlar görünür və plasenta cücənin qidalanmasında tədricən sarılıq kisəsini əvəz edir.',
        length: 'Təxminən 41 mm',
        comparison: 'Əncir',
        bodyChanges: [
          'Xüsusilə hormonal dəyişikliklərlə bağlı əhval dəyişkənliyi hiss edə bilərsiniz.',
        ],
        toKnow: [
          'Körpənin hərəkətləri başlayır, lakin bu mərhələdə adətən hələ hiss olunmur.',
        ],
      },
      ka: {
        babyDescription:
          'თითები ერთმანეთს ცალკევდება, ჩნდება პატარა ფრჩხილები და პლაცენტა ეტაპობრივად ცვლის ყვითრის პარკს ნაყოფის კვებაში.',
        length: 'დაახლოებით 41 მმ',
        comparison: 'ლეღვი',
        bodyChanges: [
          'შეიძლება ხასიათის ცვალებადობა შეამჩნიოთ, რაც განსაკუთრებით ჰორმონულ ცვლილებებს უკავშირდება.',
        ],
        toKnow: [
          'ბავშვის მოძრაობები იწყება, მაგრამ ამ ეტაპზე ისინი, როგორც წესი, ჯერ არ იგრძნობა.',
        ],
      },
      hy: {
        babyDescription:
          'Ձեռքերի և ոտքերի մատները բաժանվում են, հայտնվում են փոքրիկ եղունգներ, և ընկերքը աստիճանաբար դեղնուցային պարկից վերցնում է պտղի սնուցումը:',
        length: 'Մոտ 41 մմ',
        comparison: 'Թուզ',
        bodyChanges: [
          'Կարող եք նկատել տրամադրության տատանումներ, որոնք կապված են մասնավորապես հորմոնալ փոփոխությունների հետ:',
        ],
        toKnow: [
          'Երեխայի շարժումները սկսվում են, սակայն այս փուլում սովորաբար դեռ չեն զգացվում:',
        ],
      },
      tg: {
        babyDescription:
          'Ангуштони даст ва по ҷудо мешаванд, нохунҳои хурд пайдо мешаванд ва машима тадриҷан ҷои халтаи зардобро дар ғизо додани ҳомила мегирад.',
        length: 'Тақрибан 41 мм',
        comparison: 'Анҷир',
        bodyChanges: [
          'Шумо метавонед тағйироти кайфиятро мушоҳида кунед, ки махсусан бо тағйироти гормонӣ алоқаманд аст.',
        ],
        toKnow: [
          'Ҳаракатҳои тифл оғоз мешаванд, вале одатан дар ин марҳила ҳанӯз ҳис намешаванд.',
        ],
      },
      ky: {
        babyDescription:
          'Манжалар менен буттун манжалары бөлүнөт, кичинекей тырмактар пайда болот, ал эми плацента түйүлдүктү азыктандырууда сарысы баштыгынын ордун акырындап ээлейт.',
        length: 'Болжол менен 41 мм',
        comparison: 'Инжир',
        bodyChanges: [
          'Атап айтканда гормондук өзгөрүүлөргө байланышкан маанайдын термелүүлөрүн байкашыңыз мүмкүн.',
        ],
        toKnow: [
          'Ымыркайдын кыймылдары башталып жатат, бирок бул этапта алар адатта азырынча сезилбейт.',
        ],
      },
      tk: {
        babyDescription:
          'Barmaklar aýrylýar, kiçijik dyrnaklar peýda bolýar we plasenta horuşy iýmitlendirmekde sary haltajygyň ornuny ýuwaş-ýuwaşdan eýeleýär.',
        length: 'Takmynan 41 mm',
        comparison: 'Injir',
        bodyChanges: [
          'Aýratyn-da gormonal üýtgeşmeler bilen baglanyşykly keýp üýtgeşmelerini görüp bilersiňiz.',
        ],
        toKnow: [
          'Bäbegiň hereketleri başlaýar, ýöne olar bu tapgyrda adatça heniz duýulmaýar.',
        ],
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
      da: {
        babyDescription: 'Fingre og tæer adskilles, små negle dukker op, og moderkagen overtager gradvist blommesækkens funktion som ernæringskilde for fosteret.',
        length: 'Ca. 41 mm',
        comparison: 'Figen',
        bodyChanges: [
          'Du kan opleve humørsvingninger, der i særdeleshed er forbundet med hormonelle forandringer.',
        ],
        toKnow: [
          'Fosterets bevægelser er begyndt, men de kan generelt ikke mærkes på dette stadie endnu.',
        ],
      },
      sv: {
        babyDescription: 'Fingre och täer adskilles, små negle dukker op, och moderkagen overtager gradvist blommesäkkens funktion som ernäringskilde for fosteret.',
        length: 'Ca. 41 mm',
        comparison: 'Figen',
        bodyChanges: [
          'Du kan opleve humörsvingninger, der i särdeleshed ar forbundet med hormonelle forandringer.',
        ],
        toKnow: [
          'Fosterets bevägelser ar begyndt, men de kan generelt inte märkes på dette stadie endnu.',
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
      nb: {
        babyDescription:
          'De indre organene og musklene har vokst godt, og skjelettet begynner å forbeines. Kjønnsorganene er dannet, men er ikke synlige på ultralyd ennå.',
        length: 'Omtrent 5,4 cm',
        comparison: 'Plomme',
        bodyChanges: ['Kvalmen har ofte en tendens til å avta gradvis rundt denne tiden, selv om dette varierer mye fra person til person.'],
        toKnow: ['Slutten av første trimester forbindes ofte med lavere risiko for spontanabort sammenlignet med ukene før.'],
      },
      pl: {
        babyDescription:
          'Narządy wewnętrzne i mięśnie dobrze się rozwinęły, a szkielet zaczyna kostnieć. Narządy rozrodcze się uformowały, choć nie są jeszcze widoczne w USG.',
        length: 'Około 5,4 cm',
        comparison: 'Śliwka',
        bodyChanges: ['Nudności często zaczynają stopniowo słabnąć mniej więcej w tym czasie, choć bardzo różni się to u poszczególnych osób.'],
        toKnow: ['Koniec pierwszego trymestru jest często kojarzony z mniejszym ryzykiem poronienia w porównaniu z poprzednimi tygodniami.'],
      },
      uk: {
        babyDescription:
          'Внутрішні органи й м’язи добре розвинулися, а скелет починає окостеніти. Репродуктивні органи сформувалися, хоча ще не видимі на УЗД.',
        length: 'Приблизно 5,4 см',
        comparison: 'Слива',
        bodyChanges: ['Нудота часто починає поступово слабшати приблизно в цей час, хоча це дуже різниться в різних людей.'],
        toKnow: ['Кінець першого триместру часто пов’язують із нижчим ризиком викидня порівняно з попередніми тижнями.'],
      },
      cs: {
        babyDescription:
          'Vnitřní orgány a svaly dobře vyrostly a kostra začíná osifikovat. Pohlavní orgány se vytvořily, i když na ultrazvuku ještě nejsou vidět.',
        length: 'Asi 5,4 cm',
        comparison: 'Švestka',
        bodyChanges: ['Nevolnost má často tendenci kolem této doby postupně ustupovat, i když se to u jednotlivých žen velmi liší.'],
        toKnow: ['Konec prvního trimestru se často spojuje s nižším rizikem potratu ve srovnání s předchozími týdny.'],
      },
      sk: {
        babyDescription:
          'Vnútorné orgány a svaly dobre vyrástli a kostra sa začína osifikovať. Reprodukčné orgány sa vytvorili, hoci na ultrazvuku ešte nie sú viditeľné.',
        length: 'Približne 5,4 cm',
        comparison: 'Slivka',
        bodyChanges: [
          'Nevoľnosť má okolo tohto času často tendenciu postupne ustupovať, hoci sa to od ženy k žene veľmi líši.',
        ],
        toKnow: [
          'Koniec prvého trimestra sa často spája s nižším rizikom potratu v porovnaní s predchádzajúcimi týždňami.',
        ],
      },
      hu: {
        babyDescription:
          'A belső szervek és az izmok jól kifejlődtek, és a csontváz csontosodni kezd. A nemi szervek kialakultak, bár ultrahangon még nem láthatók.',
        length: 'Körülbelül 5,4 cm',
        comparison: 'Szilva',
        bodyChanges: [
          'A hányinger e tájt gyakran fokozatosan enyhülni kezd, bár ez nőnként nagyon eltérő.',
        ],
        toKnow: [
          'Az első trimeszter vége gyakran alacsonyabb vetélési kockázattal jár az azt megelőző hetekhez képest.',
        ],
      },
      ro: {
        babyDescription:
          'Organele interne și mușchii s-au dezvoltat bine, iar scheletul începe să se osifice. Organele reproductive s-au format, deși nu sunt încă vizibile la ecografie.',
        length: 'Aproximativ 5,4 cm',
        comparison: 'Prună',
        bodyChanges: [
          'Greața tinde adesea să se atenueze treptat în jurul acestui moment, deși aceasta variază mult de la o persoană la alta.',
        ],
        toKnow: [
          'Sfârșitul primului trimestru este adesea asociat cu un risc mai mic de avort spontan în comparație cu săptămânile precedente.',
        ],
      },
      bg: {
        babyDescription:
          'Вътрешните органи и мускулите са се развили добре, а скелетът започва да осифицира. Репродуктивните органи са се оформили, макар още да не се виждат на ехография.',
        length: 'Около 5,4 см',
        comparison: 'Слива',
        bodyChanges: [
          'Гаденето често има склонност постепенно да отшумява около този момент, макар това да варира много от човек на човек.',
        ],
        toKnow: [
          'Краят на първия триместър често се свързва с по-нисък риск от спонтанен аборт в сравнение с предходните седмици.',
        ],
      },
      sr: {
        babyDescription:
          'Унутрашњи органи и мишићи су се добро развили, а скелет почиње да окошта. Репродуктивни органи су се формирали, мада још нису видљиви на ултразвуку.',
        length: 'Око 5,4 цм',
        comparison: 'Шљива',
        bodyChanges: [
          'Мучнина често има тенденцију да постепено јењава око овог времена, мада то увелико варира од особе до особе.',
        ],
        toKnow: [
          'Крај првог триместра често се повезује са нижим ризиком од спонтаног побачаја у поређењу са претходним недељама.',
        ],
      },
      hr: {
        babyDescription:
          'Unutarnji organi i mišići dobro su se razvili, a kostur počinje okoštavati. Reproduktivni organi su se oblikovali, iako još nisu vidljivi na ultrazvuku.',
        length: 'Oko 5,4 cm',
        comparison: 'Šljiva',
        bodyChanges: [
          'Mučnina često ima tendenciju postupno popuštati oko ovog vremena, iako se to jako razlikuje od osobe do osobe.',
        ],
        toKnow: [
          'Kraj prvog trimestra često se povezuje s nižim rizikom od spontanog pobačaja u usporedbi s prethodnim tjednima.',
        ],
      },
      bs: {
        babyDescription:
          'Unutarnji organi i mišići dobro su se razvili, a kostur počinje okoštavati. Reproduktivni organi su se oblikovali, iako još nisu vidljivi na ultrazvuku.',
        length: 'Oko 5,4 cm',
        comparison: 'Šljiva',
        bodyChanges: [
          'Mučnina često ima tendenciju postupno popuštati oko ovog vremena, iako se to jako razlikuje od osobe do osobe.',
        ],
        toKnow: [
          'Kraj prvog trimestra često se povezuje s nižim rizikom od spontanog pobačaja u usporedbi s prethodnim sedmicama.',
        ],
      },
      sl: {
        babyDescription:
          'Notranji organi in mišice so se dobro razvili, okostje pa se začne okostenevati. Reproduktivni organi so se oblikovali, čeprav še niso vidni na ultrazvoku.',
        length: 'Približno 5,4 cm',
        comparison: 'Sliva',
        bodyChanges: [
          'Slabost ima pogosto tendenco postopoma popuščati okoli tega časa, čeprav se to močno razlikuje od osebe do osebe.',
        ],
        toKnow: [
          'Konec prvega trimesečja se pogosto povezuje z nižjim tveganjem za spontani splav v primerjavi s prejšnjimi tedni.',
        ],
      },
      ne: {
        babyDescription:
          'आन्तरिक अङ्ग र मांसपेशीहरू राम्ररी बढेका छन्, र कङ्काल कडा हुन थालेको छ। प्रजनन अङ्गहरू बनिसकेका छन्, यद्यपि अल्ट्रासाउन्डमा अझै देखिँदैनन्।',
        length: 'करिब 5.4 सेमी',
        comparison: 'आलुबखडा',
        bodyChanges: [
          'वाकवाकी प्रायः यही समयतिर बिस्तारै हल्का हुने प्रवृत्ति देखाउँछ, यद्यपि यो व्यक्तिपिच्छे निकै फरक हुन्छ।',
        ],
        toKnow: [
          'पहिलो त्रैमासिकको अन्त्यलाई अघिल्ला हप्ताहरूको तुलनामा गर्भपतनको कम जोखिमसँग जोडिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'අභ්‍යන්තර අවයව සහ මාංශ පේශි හොඳින් වර්ධනය වී ඇති අතර, ඇටසැකිල්ල අස්ථිකරණය වීමට පටන් ගනී. ප්‍රජනන අවයව සෑදී ඇත, නමුත් ඒවා තවම අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයේ දෘශ්‍යමාන නොවේ.',
        length: 'සෙ.මී. 5.4 පමණ',
        comparison: 'ප්ලම් ගෙඩියක්',
        bodyChanges: [
          'ඔක්කාරය බොහෝ විට මෙම කාලය වටා ක්‍රමයෙන් සමනය වීමට නැඹුරු වේ, නමුත් මෙය පුද්ගලයාගෙන් පුද්ගලයාට බොහෝ සේ වෙනස් වේ.',
        ],
        toKnow: [
          'පළමු ත්‍රෛමාසිකයේ අවසානය බොහෝ විට පෙර සතිවලට සාපේක්ෂව අඩු ගබ්සා අවදානමක් සමඟ සම්බන්ධ වේ.',
        ],
      },
      th: {
        babyDescription:
          'อวัยวะภายในและกล้ามเนื้อเติบโตดี และโครงกระดูกเริ่มแข็งตัว อวัยวะสืบพันธุ์ก่อตัวแล้ว แม้ยังมองไม่เห็นจากอัลตราซาวนด์',
        length: 'ประมาณ 5.4 ซม.',
        comparison: 'ลูกพลัม',
        bodyChanges: [
          'อาการคลื่นไส้มักมีแนวโน้มค่อย ๆ บรรเทาลงราวช่วงนี้ แม้จะแตกต่างกันมากในแต่ละคน',
        ],
        toKnow: [
          'ปลายไตรมาสแรกมักเกี่ยวข้องกับความเสี่ยงการแท้งบุตรที่ต่ำกว่าเมื่อเทียบกับสัปดาห์ก่อนหน้า',
        ],
      },
      vi: {
        babyDescription:
          'Các cơ quan nội tạng và cơ bắp đã phát triển tốt, và bộ xương bắt đầu cốt hóa. Các cơ quan sinh sản đã hình thành, dù chưa nhìn thấy được trên siêu âm.',
        length: 'Khoảng 5,4 cm',
        comparison: 'Quả mận',
        bodyChanges: [
          'Buồn nôn thường có xu hướng giảm dần vào khoảng thời gian này, dù điều này khác nhau rất nhiều giữa từng người.',
        ],
        toKnow: [
          'Cuối tam cá nguyệt thứ nhất thường gắn với nguy cơ sảy thai thấp hơn so với những tuần trước đó.',
        ],
      },
      uz: {
        babyDescription:
          'Ichki aʼzolar va mushaklar yaxshi oʻsdi, skelet suyaklana boshlamoqda. Reproduktiv aʼzolar shakllandi, ammo UZI da hali koʻrinmaydi.',
        length: 'Taxminan 5,4 sm',
        comparison: 'Olxoʻri',
        bodyChanges: [
          'Koʻngil aynishi odatda shu vaqt atrofida asta-sekin yengillashadi, garchi bu odamdan odamga juda farq qilsa ham.',
        ],
        toKnow: [
          'Birinchi trimestrning oxiri koʻpincha oldingi haftalarga nisbatan homila tushish xavfining pastroq boʻlishi bilan bogʻlanadi.',
        ],
      },
      az: {
        babyDescription:
          'Daxili orqanlar və əzələlər yaxşı böyüyüb, skelet isə sümükləşməyə başlayır. Reproduktiv orqanlar formalaşıb, lakin ultrasəsdə hələ görünmür.',
        length: 'Təxminən 5,4 sm',
        comparison: 'Gavalı',
        bodyChanges: [
          'Ürəkbulanma çox vaxt bu vaxt ətrafında tədricən azalmağa meyllidir, lakin bu, şəxsdən şəxsə çox dəyişir.',
        ],
        toKnow: [
          'Birinci trimestrin sonu çox vaxt əvvəlki həftələrlə müqayisədə daha aşağı düşük riski ilə əlaqələndirilir.',
        ],
      },
      ka: {
        babyDescription:
          'შინაგანი ორგანოები და კუნთები კარგად გაიზარდა და ჩონჩხი ოსიფიკაციას იწყებს. რეპროდუქციული ორგანოები ჩამოყალიბდა, თუმცა ულტრაბგერაზე ჯერ არ ჩანს.',
        length: 'დაახლოებით 5,4 სმ',
        comparison: 'ქლიავი',
        bodyChanges: [
          'გულისრევა ხშირად ამ დროისთვის ეტაპობრივად ნელდება, თუმცა ეს ადამიანიდან ადამიანამდე ძლიერ განსხვავდება.',
        ],
        toKnow: [
          'პირველი ტრიმესტრის დასასრული ხშირად წინა კვირებთან შედარებით ორსულობის თვითნებური შეწყვეტის უფრო დაბალ რისკს უკავშირდება.',
        ],
      },
      hy: {
        babyDescription:
          'Ներքին օրգաններն ու մկանները լավ աճել են, և կմախքը սկսում է ոսկրանալ: Վերարտադրողական օրգանները ձևավորվել են, թեև ուլտրաձայնային հետազոտությամբ դեռ տեսանելի չեն:',
        length: 'Մոտ 5,4 սմ',
        comparison: 'Սալոր',
        bodyChanges: [
          'Սրտխառնոցը հաճախ հակված է աստիճանաբար թեթևանալ մոտ այս ժամանակ, թեև դա խիստ տարբերվում է մարդուց մարդ:',
        ],
        toKnow: [
          'Առաջին եռամսյակի ավարտը հաճախ կապվում է նախորդ շաբաթների համեմատ վիժման ավելի ցածր վտանգի հետ:',
        ],
      },
      tg: {
        babyDescription:
          'Узвҳои дохилӣ ва мушакҳо хуб рушд кардаанд ва скелет оғоз ба устухон шудан мекунад. Узвҳои таносулӣ ташаккул ёфтаанд, гарчанде ки дар ултрасадо ҳанӯз намоён нестанд.',
        length: 'Тақрибан 5,4 см',
        comparison: 'Олу',
        bodyChanges: [
          'Беҳузурӣ аксар вақт майл дорад дар атрофи ҳамин вақт тадриҷан сабук шавад, гарчанде ки ин аз шахс ба шахс хеле фарқ мекунад.',
        ],
        toKnow: [
          'Охири триместри аввал аксар вақт бо хатари камтари вижиш нисбат ба ҳафтаҳои пештара алоқаманд аст.',
        ],
      },
      ky: {
        babyDescription:
          'Ички органдар менен булчуңдар жакшы өстү, ал эми скелет катый баштады. Көбөйүү органдары түзүлдү, бирок алар УЗИде азырынча көрүнбөйт.',
        length: 'Болжол менен 5,4 см',
        comparison: 'Алча',
        bodyChanges: [
          'Көңүл айлануу көбүнчө ушул убакта акырындап басаңдайт, бирок бул адамдан адамга абдан айырмаланат.',
        ],
        toKnow: [
          'Биринчи триместрдин аякташы көбүнчө мурунку жумаларга салыштырмалуу курсактуулук үзүлүү коркунучунун төмөндөшү менен байланышат.',
        ],
      },
      tk: {
        babyDescription:
          'Içki agzalar we myşsalar gowy ösdi, süýekleşme başlaýar. Köpelýiş agzalary emele geldi, ýöne olar heniz UZI-de görünmeýär.',
        length: 'Takmynan 5,4 sm',
        comparison: 'Alça',
        bodyChanges: [
          'Ýüregiň bulanmagy köplenç bu wagt töwereginde ýuwaş-ýuwaşdan peselýär, bu adamdan adama köp tapawutlansa-da.',
        ],
        toKnow: [
          'Birinji trimestriň ahyry öňki hepdeler bilen deňeşdirilende göwreliligiň ýitirilmek howpunyň pesligi bilen köplenç baglanyşdyrylýar.',
        ],
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
      da: {
        babyDescription: 'De indre organer og muskler er vokset godt, og skelettet begynder at ossificere. Kønsorganerne er dannet, men kan endnu ikke ses ved ultralyd.',
        length: 'Ca. 5,4 cm',
        comparison: 'Blomme',
        bodyChanges: [
          'Kvalme har en tendens til gradvist at aftage på dette tidspunkt, selvom det varierer meget fra person til person.',
        ],
        toKnow: [
          'Slutningen af første trimester er ofte forbundet med en lavere risiko for abort sammenlignet med de foregående uger.',
        ],
      },
      sv: {
        babyDescription: 'De indre organer och muskler ar vokset godt, och skelettet begynder at ossificere. Könsorganerne ar dannet, men kan endnu inte ses ved ultralyd.',
        length: 'Ca. 5,4 cm',
        comparison: 'Blomme',
        bodyChanges: [
          'Kvalme har en tendens till gradvist at aftage på dette tidspunkt, selvom det varierer mycket fran person till person.',
        ],
        toKnow: [
          'Slutningen av förste trimester ar ofte forbundet med en lavere risiko for abort sammenlignet med de foregående veckor.',
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
      nb: {
        babyDescription:
          'Bevegelsene, som fortsatt er rykkvise, blir litt mer koordinerte. Noen babyer viser allerede en sugerefleks med tommelen.',
        length: 'Omtrent 7,4 cm',
        comparison: 'Fersken',
        bodyChanges: ['Mange får gradvis litt mer energi igjen når andre trimester nærmer seg.'],
        toKnow: ['Første trimester slutter vanligvis rundt denne uken; oppfølgingen fortsetter med timer som ligger lenger fra hverandre.'],
      },
      pl: {
        babyDescription:
          'Ruchy, wciąż szarpane, stają się nieco bardziej skoordynowane. Niektóre dzieci wykazują już odruch ssania kciuka.',
        length: 'Około 7,4 cm',
        comparison: 'Brzoskwinia',
        bodyChanges: ['Wiele osób stopniowo odzyskuje nieco więcej energii w miarę zbliżania się drugiego trymestru.'],
        toKnow: ['Pierwszy trymestr kończy się zazwyczaj mniej więcej w tym tygodniu; opieka jest kontynuowana z rzadszymi wizytami.'],
      },
      uk: {
        babyDescription:
          'Рухи, ще смикливі, стають трохи більш скоординованими. Деякі діти вже демонструють смоктальний рефлекс великого пальця.',
        length: 'Приблизно 7,4 см',
        comparison: 'Персик',
        bodyChanges: ['Багато хто поступово відновлює трохи більше енергії з наближенням другого триместру.'],
        toKnow: ['Перший триместр зазвичай закінчується приблизно цього тижня; догляд продовжується з рідшими візитами.'],
      },
      cs: {
        babyDescription:
          'Pohyby, stále trhavé, se stávají o něco koordinovanějšími. Některá miminka již vykazují sací reflex palce.',
        length: 'Asi 7,4 cm',
        comparison: 'Broskev',
        bodyChanges: ['Mnoho žen postupně získává o něco více energie s blížícím se druhým trimestrem.'],
        toKnow: ['První trimestr obvykle končí kolem tohoto týdne; péče pokračuje s řidšími návštěvami.'],
      },
      sk: {
        babyDescription:
          'Pohyby, ešte trhavé, sa stávajú o niečo koordinovanejšími. Niektoré bábätká už vykazujú reflex cicania palca.',
        length: 'Približne 7,4 cm',
        comparison: 'Broskyňa',
        bodyChanges: [
          'Mnohé ženy s blížiacim sa druhým trimestrom postupne získavajú o niečo viac energie.',
        ],
        toKnow: [
          'Prvý trimester sa zvyčajne končí okolo tohto týždňa; starostlivosť pokračuje s viac rozloženými návštevami.',
        ],
      },
      hu: {
        babyDescription:
          'A mozgások, még rángatóak, kissé koordináltabbá válnak. Egyes babáknál már megjelenik az ujjszopási reflex.',
        length: 'Körülbelül 7,4 cm',
        comparison: 'Őszibarack',
        bodyChanges: [
          'Sok nő fokozatosan visszanyer némi energiát a második trimeszter közeledtével.',
        ],
        toKnow: [
          'Az első trimeszter általában e hét körül ér véget; a gondozás ritkábban elosztott időpontokkal folytatódik.',
        ],
      },
      ro: {
        babyDescription:
          'Mișcările, încă sacadate, devin puțin mai coordonate. Unii bebeluși prezintă deja reflexul de a-și suge degetul mare.',
        length: 'Aproximativ 7,4 cm',
        comparison: 'Piersică',
        bodyChanges: [
          'Multe persoane își recapătă treptat ceva mai multă energie pe măsură ce se apropie al doilea trimestru.',
        ],
        toKnow: [
          'Primul trimestru se încheie în general în jurul acestei săptămâni; urmărirea continuă cu consultații mai distanțate.',
        ],
      },
      bg: {
        babyDescription:
          'Движенията, все още резки, стават малко по-координирани. Някои бебета вече показват рефлекса за смучене на палец.',
        length: 'Около 7,4 см',
        comparison: 'Праскова',
        bodyChanges: [
          'Много хора постепенно възвръщат малко повече енергия с наближаването на втория триместър.',
        ],
        toKnow: [
          'Първият триместър обикновено завършва около тази седмица; проследяването продължава с по-рядко разположени прегледи.',
        ],
      },
      sr: {
        babyDescription:
          'Покрети, још нагли, постају нешто координисанији. Неке бебе већ показују рефлекс сисања палца.',
        length: 'Око 7,4 цм',
        comparison: 'Бресква',
        bodyChanges: [
          'Многи људи постепено враћају мало више енергије како се други триместар приближава.',
        ],
        toKnow: [
          'Први триместар обично завршава око ове недеље; нега се наставља са ређе размакнутим прегледима.',
        ],
      },
      hr: {
        babyDescription:
          'Pokreti, još nagli, postaju nešto koordiniraniji. Neke bebe već pokazuju refleks sisanja palca.',
        length: 'Oko 7,4 cm',
        comparison: 'Breskva',
        bodyChanges: [
          'Mnoge osobe postupno vraćaju malo više energije kako se približava drugi trimestar.',
        ],
        toKnow: [
          'Prvi trimestar obično završava oko ovog tjedna; skrb se nastavlja s rjeđe razmaknutim pregledima.',
        ],
      },
      bs: {
        babyDescription:
          'Pokreti, još nagli, postaju nešta koordiniraniji. Neke bebe već pokazuju refleks sisanja palca.',
        length: 'Oko 7,4 cm',
        comparison: 'Breskva',
        bodyChanges: [
          'Mnoge osobe postupno vraćaju malo više energije kako se približava drugi trimestar.',
        ],
        toKnow: [
          'Prvi trimestar obično završava oko ove sedmice; skrb se nastavlja s rjeđe razmaknutim pregledima.',
        ],
      },
      sl: {
        babyDescription:
          'Gibi, še sunkoviti, postajajo nekoliko bolj koordinirani. Nekateri dojenčki že kažejo refleks sesanja palca.',
        length: 'Približno 7,4 cm',
        comparison: 'Breskev',
        bodyChanges: [
          'Mnoge osebe postopoma povrnejo malo več energije, ko se bliža drugo trimesečje.',
        ],
        toKnow: [
          'Prvo trimesečje običajno konča okoli tega tedna; oskrba se nadaljuje z redkeje razmaknjenimi pregledi.',
        ],
      },
      ne: {
        babyDescription:
          'चालहरू, अझै झट्का-झट्कासहित, अलिकति बढी समन्वित हुँदै जान्छन्। केही शिशुहरूले पहिल्यै औँला चुस्ने रिफ्लेक्स देखाउँछन्।',
        length: 'करिब 7.4 सेमी',
        comparison: 'आरु',
        bodyChanges: [
          'दोस्रो त्रैमासिक नजिकिँदा धेरै मानिसले बिस्तारै अलिकति बढी ऊर्जा फिर्ता पाउँछन्।',
        ],
        toKnow: [
          'पहिलो त्रैमासिक सामान्यतया यही हप्ताको वरिपरि सकिन्छ; हेरचाह अझ टाढा-टाढाका भेटघाटसहित जारी रहन्छ।',
        ],
      },
      si: {
        babyDescription:
          'තවමත් කැඩී කැඩී යන චලනයන් ටිකක් වඩා සම්බන්ධීකරණය වේ. සමහර දරුවන් දැනටමත් මාපට ඇඟිල්ල උරා බොන ප්‍රතීකාරයක් පෙන්වයි.',
        length: 'සෙ.මී. 7.4 පමණ',
        comparison: 'පීච් ගෙඩියක්',
        bodyChanges: [
          'දෙවන ත්‍රෛමාසිකය ළං වන විට බොහෝ පුද්ගලයන්ට ක්‍රමයෙන් ටිකක් වැඩි ශක්තියක් නැවත ලැබේ.',
        ],
        toKnow: [
          'පළමු ත්‍රෛමාසිකය සාමාන්‍යයෙන් මෙම සතිය වටා අවසන් වේ; සත්කාර වඩා පුළුල් ලෙස පරතරය ඇති හමුවීම් සමඟ දිගටම පවතී.',
        ],
      },
      th: {
        babyDescription:
          'การเคลื่อนไหวที่ยังกระตุกเริ่มประสานกันมากขึ้นเล็กน้อย ทารกบางคนแสดงปฏิกิริยาดูดนิ้วหัวแม่มือแล้ว',
        length: 'ประมาณ 7.4 ซม.',
        comparison: 'ลูกพีช',
        bodyChanges: [
          'หลายคนค่อย ๆ กลับมามีพลังงานมากขึ้นเล็กน้อยเมื่อใกล้ไตรมาสที่สอง',
        ],
        toKnow: [
          'ไตรมาสแรกโดยทั่วไปสิ้นสุดราวสัปดาห์นี้ การดูแลดำเนินต่อไปด้วยการนัดหมายที่ห่างขึ้น',
        ],
      },
      vi: {
        babyDescription:
          'Các cử động, vẫn còn giật cục, trở nên phối hợp hơn một chút. Một số em bé đã có phản xạ mút ngón tay cái.',
        length: 'Khoảng 7,4 cm',
        comparison: 'Quả đào',
        bodyChanges: [
          'Nhiều người dần lấy lại thêm một chút năng lượng khi tam cá nguyệt thứ hai đến gần.',
        ],
        toKnow: [
          'Tam cá nguyệt thứ nhất thường kết thúc vào khoảng tuần này; việc chăm sóc tiếp tục với các buổi hẹn thưa hơn.',
        ],
      },
      uz: {
        babyDescription:
          'Hali keskin harakatlar biroz muvofiqlashgan boʻladi. Baʼzi chaqaloqlar allaqachon bosh barmoqni emish refleksini koʻrsatadi.',
        length: 'Taxminan 7,4 sm',
        comparison: 'Shaftoli',
        bodyChanges: [
          'Koʻp odamlar ikkinchi trimestr yaqinlashgani sari asta-sekin biroz koʻproq energiyani qaytarib oladi.',
        ],
        toKnow: [
          'Birinchi trimestr odatda shu hafta atrofida tugaydi; parvarish kamroq tez-tez qabullar bilan davom etadi.',
        ],
      },
      az: {
        babyDescription:
          'Hələ də kəskin olan hərəkətlər bir qədər daha koordinasiyalı olur. Bəzi körpələr artıq baş barmağı əmmə refleksi göstərir.',
        length: 'Təxminən 7,4 sm',
        comparison: 'Şaftalı',
        bodyChanges: [
          'Bir çox insan ikinci trimestr yaxınlaşdıqca tədricən bir qədər daha çox enerji bərpa edir.',
        ],
        toKnow: [
          'Birinci trimestr adətən bu həftə ətrafında bitir; qayğı daha seyrək qəbullarla davam edir.',
        ],
      },
      ka: {
        babyDescription:
          'მოძრაობები, ჯერ კიდევ მკვეთრი, ცოტა უფრო კოორდინირებული ხდება. ზოგ ბავშვს უკვე აქვს ცერა თითის წოვის რეფლექსი.',
        length: 'დაახლოებით 7,4 სმ',
        comparison: 'ატამი',
        bodyChanges: [
          'ბევრი ადამიანი მეორე ტრიმესტრის მოახლოებისას ეტაპობრივად ცოტა მეტ ენერგიას იბრუნებს.',
        ],
        toKnow: [
          'პირველი ტრიმესტრი, როგორც წესი, დაახლოებით ამ კვირას მთავრდება; მეთვალყურეობა უფრო დაშორებული ვიზიტებით გრძელდება.',
        ],
      },
      hy: {
        babyDescription:
          'Շարժումները, դեռ կտրտված, դառնում են մի փոքր ավելի համակարգված: Որոշ երեխաներ արդեն ցուցաբերում են մատը ծծելու ռեֆլեքս:',
        length: 'Մոտ 7,4 սմ',
        comparison: 'Դեղձ',
        bodyChanges: [
          'Շատ մարդիկ աստիճանաբար վերականգնում են մի փոքր ավելի շատ էներգիա՝ երկրորդ եռամսյակին մոտենալիս:',
        ],
        toKnow: [
          'Առաջին եռամսյակը սովորաբար ավարտվում է մոտ այս շաբաթում. խնամքը շարունակվում է ավելի հազվադեպ այցերով:',
        ],
      },
      tg: {
        babyDescription:
          'Ҳаракатҳо, ки ҳанӯз якбора ҳастанд, андаке ҳамоҳангтар мешаванд. Баъзе тифлҳо аллакай рефлекси мукидани ангушти калонро нишон медиҳанд.',
        length: 'Тақрибан 7,4 см',
        comparison: 'Шафтолу',
        bodyChanges: [
          'Бисёр одамон ҳангоми наздик шудани триместри дуюм тадриҷан андаке қувваи бештарро бозмеёбанд.',
        ],
        toKnow: [
          'Триместри аввал одатан дар атрофи ҳамин ҳафта ба охир мерасад; нигоҳубин бо қабулҳои дурфосилатар идома меёбад.',
        ],
      },
      ky: {
        babyDescription:
          'Дагы эле тартылган кыймылдар бир аз координацияланган болот. Айрым ымыркайлар буга чейин эле бармакты эмүү рефлексин көрсөтөт.',
        length: 'Болжол менен 7,4 см',
        comparison: 'Шабдалы',
        bodyChanges: [
          'Көптөгөн адамдар экинчи триместр жакындаган сайын бир аз көбүрөөк энергияны акырындап кайра табат.',
        ],
        toKnow: [
          'Биринчи триместр адатта ушул жумада аяктайт; кам көрүү сейректеген кабыл алуулар менен уланат.',
        ],
      },
      tk: {
        babyDescription:
          'Heniz sarsgyn hereketler az-kem has utgaşdyrylan bolýar. Käbir bäbekler eýýäm başparmaklaryny emmek refleksini görkezýär.',
        length: 'Takmynan 7,4 sm',
        comparison: 'Şetdaly',
        bodyChanges: [
          'Köp adam ikinji trimestre ýakynlaşanda ýuwaş-ýuwaşdan birneme has köp energiýa gaýtaryp alýar.',
        ],
        toKnow: [
          'Birinji trimestr adatça şu hepde töwereginde gutarýar; ideg has seýrek aralykly kabul edişler bilen dowam edýär.',
        ],
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
      da: {
        babyDescription: 'Bevægelserne, der stadig er lidt uforsigtige, bliver lidt mere koordinerede. Nogle babyer viser allerede en tommelfinger-sutte-refleks.',
        length: 'Ca. 7,4 cm',
        comparison: 'Fersken',
        bodyChanges: [
          'Mange genvinder gradvist lidt mere energi, efterhånden som andet trimester nærmer sig.',
        ],
        toKnow: [
          'Første trimester slutter generelt omkring denne uge; plejen fortsætter med mere spredte aftaler.',
        ],
      },
      sv: {
        babyDescription: 'Bevägelserne, der fortfarande ar lidt uforsigtige, bliver lidt mere koordinerede. Nogle babyer viser redan en tommelfinger-sutte-refleks.',
        length: 'Ca. 7,4 cm',
        comparison: 'Fersken',
        bodyChanges: [
          'Mange genvinder gradvist lidt mere energi, efterhånden som andet trimester närmer sig.',
        ],
        toKnow: [
          'Förste trimester slutter generelt omkring denne uge; plejen fortsätter med mere spredte aftaler.',
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
      nb: {
        babyDescription:
          'Hodet blir rundere og mer forholdsmessig i forhold til resten av kroppen. Fosteret svelger litt fostervann, som passerer gjennom magesekken og nyrene.',
        length: 'Omtrent 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['Magen begynner å runde seg mer synlig for noen.'],
        toKnow: ['Helsepersonell kan noen ganger begynne å høre hjerteslagene med et ultralydapparat plassert på magen.'],
      },
      pl: {
        babyDescription:
          'Głowa staje się bardziej zaokrąglona i lepiej współmierna do reszty ciała. Płód połyka trochę płynu owodniowego, który przechodzi przez żołądek i nerki.',
        length: 'Około 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['U niektórych osób brzuch zaczyna się wyraźniej zaokrąglać.'],
        toKnow: ['Specjalista może czasem zacząć słyszeć bicie serca za pomocą aparatu USG przyłożonego do brzucha.'],
      },
      uk: {
        babyDescription:
          'Голова стає більш округлою й краще пропорційною до решти тіла. Плід ковтає трохи навколоплідних вод, які проходять через шлунок і нирки.',
        length: 'Приблизно 8,5 см',
        comparison: 'Ківі',
        bodyChanges: ['У деяких жінок живіт починає виразніше округлюватися.'],
        toKnow: ['Фахівець іноді може почати чути серцебиття за допомогою УЗ-апарата, прикладеного до живота.'],
      },
      cs: {
        babyDescription:
          'Hlava je zakulacenější a lépe úměrná zbytku těla. Plod polyká trochu plodové vody, která prochází žaludkem a ledvinami.',
        length: 'Asi 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: ['U některých žen se břicho začíná výrazněji zakulacovat.'],
        toKnow: ['Zdravotnický pracovník může někdy začít slyšet tlukot srdce pomocí ultrazvukového přístroje přiloženého na břicho.'],
      },
      sk: {
        babyDescription:
          'Hlava sa stáva guľatejšou a úmernejšou zvyšku tela. Plod prehĺta trochu plodovej vody, ktorá prechádza žalúdkom a obličkami.',
        length: 'Približne 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Brucho sa u niektorých žien začína viditeľnejšie zaoblovať.',
        ],
        toKnow: [
          'Zdravotnícky pracovník môže niekedy začať počuť tlkot srdca ultrazvukovým prístrojom priloženým na brucho.',
        ],
      },
      hu: {
        babyDescription:
          'A fej kerekebbé és a test többi részéhez arányosabbá válik. A magzat nyel egy kevés magzatvizet, amely áthalad a gyomron és a vesén.',
        length: 'Körülbelül 8,5 cm',
        comparison: 'Kivi',
        bodyChanges: [
          'A has egyes nőknél láthatóbban kezd kerekedni.',
        ],
        toKnow: [
          'Az egészségügyi szakember néha már hallhatja a szívverést a hasra helyezett ultrahangos eszközzel.',
        ],
      },
      ro: {
        babyDescription:
          'Capul devine mai rotunjit și mai proporționat cu restul corpului. Fătul înghite puțin lichid amniotic, care trece prin stomac și rinichi.',
        length: 'Aproximativ 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Burta începe să se rotunjească mai vizibil la unele persoane.',
        ],
        toKnow: [
          'Un profesionist din domeniul sănătății poate începe uneori să audă bătăile inimii cu un aparat cu ultrasunete așezat pe burtă.',
        ],
      },
      bg: {
        babyDescription:
          'Главата става по-закръглена и по-пропорционална спрямо останалата част от тялото. Плодът поглъща малко амниотична течност, която минава през стомаха и бъбреците.',
        length: 'Около 8,5 см',
        comparison: 'Киви',
        bodyChanges: [
          'Коремът започва да се закръглява по-видимо при някои хора.',
        ],
        toKnow: [
          'Здравен специалист понякога може да започне да чува сърдечния ритъм с ултразвуков апарат, поставен върху корема.',
        ],
      },
      sr: {
        babyDescription:
          'Глава постаје заобљенија и пропорционалнија у односу на остатак тела. Плод гута мало амнионске течности, која пролази кроз стомак и бубреге.',
        length: 'Око 8,5 цм',
        comparison: 'Киви',
        bodyChanges: [
          'Стомак почиње да се видљивије заобљује код неких особа.',
        ],
        toKnow: [
          'Здравствени радник понекад може почети да чује откуцаје срца ултразвучним апаратом постављеним на стомак.',
        ],
      },
      hr: {
        babyDescription:
          'Glava postaje zaobljenija i proporcionalnija u odnosu na ostatak tijela. Fetus guta malo plodne vode, koja prolazi kroz želudac i bubrege.',
        length: 'Oko 8,5 cm',
        comparison: 'Kivi',
        bodyChanges: [
          'Trbuh se kod nekih osoba počinje vidljivije zaobljavati.',
        ],
        toKnow: [
          'Zdravstveni djelatnik ponekad može početi čuti otkucaje srca ultrazvučnim aparatom postavljenim na trbuh.',
        ],
      },
      bs: {
        babyDescription:
          'Glava postaje zaobljenija i proporcionalnija u odnosu na ostatak tijela. Fetus guta malo plodne vode, koja prolazi kroz želudac i bubrege.',
        length: 'Oko 8,5 cm',
        comparison: 'Kivi',
        bodyChanges: [
          'Trbuh se kod nekih osoba počinje vidljivije zaobljavati.',
        ],
        toKnow: [
          'Zdravstveni radnik ponekad može početi čuti otkucaje srca ultrazvučnim aparatom postavljenim na trbuh.',
        ],
      },
      sl: {
        babyDescription:
          'Glava postaja bolj zaobljena in sorazmernejša glede na preostalo telo. Plod požira malo plodovnice, ki prehaja skozi želodec in ledvici.',
        length: 'Približno 8,5 cm',
        comparison: 'Kivi',
        bodyChanges: [
          'Trebuh se pri nekaterih osebah začne vidneje zaobljati.',
        ],
        toKnow: [
          'Zdravstveni delavec lahko včasih začne slišati srčni utrip z ultrazvočno napravo, nameščeno na trebuh.',
        ],
      },
      ne: {
        babyDescription:
          'टाउको बढी गोलो र बाँकी शरीरसँग बढी अनुपातिक हुन्छ। गर्भस्थ शिशुले अलिकति उल्बको तरल निल्छ, जुन पेट र मृगौलाहरूबाट जान्छ।',
        length: 'करिब 8.5 सेमी',
        comparison: 'कीवी',
        bodyChanges: [
          'केही मानिसमा पेट बढी स्पष्ट रूपमा गोलो हुन थाल्छ।',
        ],
        toKnow: [
          'स्वास्थ्यकर्मीले कहिलेकाहीँ पेटमा राखिएको अल्ट्रासाउन्ड उपकरणबाट मुटुको धड्कन सुन्न थाल्न सक्छन्।',
        ],
      },
      si: {
        babyDescription:
          'හිස වඩා වටකුරු වන අතර ශරීරයේ ඉතිරි කොටස සමඟ වඩා සමානුපාතික වේ. කලලය ඇම්නියොටික් තරලය ටිකක් ගිලින අතර, එය ආමාශය සහ වකුගඩු හරහා ගමන් කරයි.',
        length: 'සෙ.මී. 8.5 පමණ',
        comparison: 'කිවී ගෙඩියක්',
        bodyChanges: [
          'සමහර පුද්ගලයන්ට බඩ වඩා දෘශ්‍යමාන ලෙස වටකුරු වීමට පටන් ගනී.',
        ],
        toKnow: [
          'සෞඛ්‍ය වෘත්තිකයෙකුට සමහර විට බඩ මත තබන අල්ට්‍රාසවුන්ඩ් උපාංගයකින් හදවත් ස්පන්දනය ඇසීමට පටන් ගත හැක.',
        ],
      },
      th: {
        babyDescription:
          'ศีรษะกลมขึ้นและได้สัดส่วนกับร่างกายส่วนอื่นมากขึ้น ทารกในครรภ์กลืนน้ำคร่ำเล็กน้อย ซึ่งผ่านกระเพาะและไต',
        length: 'ประมาณ 8.5 ซม.',
        comparison: 'กีวี',
        bodyChanges: [
          'หน้าท้องเริ่มโค้งมนชัดเจนขึ้นในบางคน',
        ],
        toKnow: [
          'บางครั้งบุคลากรทางการแพทย์เริ่มได้ยินเสียงหัวใจเต้นด้วยอุปกรณ์อัลตราซาวนด์ที่วางบนหน้าท้อง',
        ],
      },
      vi: {
        babyDescription:
          'Đầu trở nên tròn hơn và cân đối hơn với phần còn lại của cơ thể. Thai nhi nuốt một ít nước ối, nước này đi qua dạ dày và thận.',
        length: 'Khoảng 8,5 cm',
        comparison: 'Quả kiwi',
        bodyChanges: [
          'Bụng bắt đầu tròn lên rõ rệt hơn ở một số người.',
        ],
        toKnow: [
          'Nhân viên y tế đôi khi có thể bắt đầu nghe thấy nhịp tim bằng thiết bị siêu âm đặt trên bụng.',
        ],
      },
      uz: {
        babyDescription:
          'Bosh yumaloqroq va tananing qolgan qismiga mutanosibroq boʻladi. Homila ozgina amnion suyuqligini yutadi, u oshqozon va buyraklardan oʻtadi.',
        length: 'Taxminan 8,5 sm',
        comparison: 'Kivi',
        bodyChanges: [
          'Baʼzi odamlarda qorin yaqqolroq yumaloqlana boshlaydi.',
        ],
        toKnow: [
          'Sogʻliqni saqlash mutaxassisi baʼzan qoringa qoʻyilgan UZI qurilmasi bilan yurak urishini eshita boshlashi mumkin.',
        ],
      },
      az: {
        babyDescription:
          'Baş daha yumru və bədənin qalan hissəsi ilə daha mütənasib olur. Cücə bir qədər amnion mayesini udur və o, mədədən və böyrəklərdən keçir.',
        length: 'Təxminən 8,5 sm',
        comparison: 'Kivi',
        bodyChanges: [
          'Bəzi insanlarda qarın daha nəzərəçarpacaq şəkildə yumrulanmağa başlayır.',
        ],
        toKnow: [
          'Tibb işçisi bəzən qarına qoyulan ultrasəs cihazı ilə ürək döyüntüsünü eşitməyə başlaya bilər.',
        ],
      },
      ka: {
        babyDescription:
          'თავი უფრო მომრგვალო და სხეულის დანარჩენ ნაწილთან უფრო პროპორციული ხდება. ნაყოფი ოდნავ ყლაპავს ამნიონურ სითხეს, რომელიც კუჭსა და თირკმელებს გადის.',
        length: 'დაახლოებით 8,5 სმ',
        comparison: 'კივი',
        bodyChanges: [
          'მუცელი ზოგისთვის უფრო თვალსაჩინოდ იწყებს მომრგვალებას.',
        ],
        toKnow: [
          'ჯანდაცვის სპეციალისტი ზოგჯერ მუცელზე მიდებული ულტრაბგერითი აპარატით გულისცემის მოსმენას იწყებს.',
        ],
      },
      hy: {
        babyDescription:
          'Գլուխը դառնում է ավելի կլորավուն և ավելի համամասնական մարմնի մնացած մասի հետ: Պտուղը կուլ է տալիս մի փոքր ամնիոտիկ հեղուկ, որն անցնում է ստամոքսով և երիկամներով:',
        length: 'Մոտ 8,5 սմ',
        comparison: 'Կիվի',
        bodyChanges: [
          'Որովայնը որոշ մարդկանց մոտ սկսում է ավելի տեսանելիորեն կլորանալ:',
        ],
        toKnow: [
          'Առողջապահության մասնագետը երբեմն կարող է սկսել լսել սրտի բաբախյունը որովայնի վրա դրված ուլտրաձայնային սարքով:',
        ],
      },
      tg: {
        babyDescription:
          'Сар мудаввартар ва ба боқимондаи бадан мутаносибтар мешавад. Ҳомила андаке моеи амниотикиро фурӯ мебарад, ки аз меъда ва гурдаҳо мегузарад.',
        length: 'Тақрибан 8,5 см',
        comparison: 'Киви',
        bodyChanges: [
          'Шикам барои баъзеҳо ба таври намоёнтар мудаввар шудан мегирад.',
        ],
        toKnow: [
          'Мутахассиси соҳаи тиб баъзан метавонад набзи дилро бо дастгоҳи ултрасадо, ки ба шикам гузошта мешавад, шунавад.',
        ],
      },
      ky: {
        babyDescription:
          'Баш тегеректеп, дененин калган бөлүгү менен пропорционалдуураак болот. Түйүлдүк бир аз амниотикалык суюктукту жутат, ал ашказан менен бөйрөк аркылуу өтөт.',
        length: 'Болжол менен 8,5 см',
        comparison: 'Киви',
        bodyChanges: [
          'Айрым адамдарда курсак көбүрөөк байкаларлык тегеректөөгө баштайт.',
        ],
        toKnow: [
          'Ден соолук сактоо адиси кээде курсакка коюлган УЗИ аппараты менен жүрөк согушун угууну баштай алат.',
        ],
      },
      tk: {
        babyDescription:
          'Kelle has tegelek we bedeniň galan bölegi bilen has deň ölçegli bolýar. Horuş az mukdarda amniotik suwuklygy ýuwdýar, ol aşgazandan we böwrekden geçýär.',
        length: 'Takmynan 8,5 sm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Garyn käbir adamlarda has aýdyň tegeleklenip başlaýar.',
        ],
        toKnow: [
          'Saglyk hünärmeni garnyň üstüne goýlan UZI enjamy bilen ýüregiň urgusyny käwagt diňläp başlap biler.',
        ],
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
      da: {
        babyDescription: 'Hovedet bliver mere rundt og mere proportionelt med resten af kroppen. Fosteret synker lidt fostervand, som passerer gennem mave og nyrer.',
        length: 'Ca. 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Maven begynder at blive mere synligt rund for nogle.',
        ],
        toKnow: [
          'En sundhedsprofessionel kan sommetimes begynde at høre hjertelyden med en ultralydsenhed placeret på maven.',
        ],
      },
      sv: {
        babyDescription: 'Hovedet bliver mere rundt och mere proportionelt med resten av kroppen. Fosteret synker lidt fostervand, som passerer gennem mave och nyrer.',
        length: 'Ca. 8,5 cm',
        comparison: 'Kiwi',
        bodyChanges: [
          'Maven begynder at blive mere synligt rund for nogle.',
        ],
        toKnow: [
          'En sundhedsprofessionel kan sommetimes begynde at höre hjertelyden med en ultralydsenhed placeret på maven.',
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
      nb: {
        babyDescription:
          'Et fint dunhår kalt lanugo dekker gradvis huden, og øyenbryn og øyevipper begynner å dukke opp. Øynene blir følsomme for lys.',
        length: 'Omtrent 10,1 cm',
        comparison: 'Eple',
        bodyChanges: ['Appetitten din kan endre seg, noen ganger med nye matlyster eller aversjoner.'],
        toKnow: ['Hørselen begynner å utvikle seg rundt denne tiden: stemmen din og kroppens indre lyder blir gradvis hørbare.'],
      },
      pl: {
        babyDescription:
          'Delikatny meszek zwany lanugo stopniowo pokrywa skórę, a brwi i rzęsy zaczynają się pojawiać. Oczy stają się wrażliwe na światło.',
        length: 'Około 10,1 cm',
        comparison: 'Jabłko',
        bodyChanges: ['Twój apetyt może się zmieniać, czasem z nowymi zachciankami lub niechęcią do niektórych produktów.'],
        toKnow: ['Słuch zaczyna się rozwijać mniej więcej w tym czasie: Twój głos i wewnętrzne dźwięki ciała stają się stopniowo słyszalne.'],
      },
      uk: {
        babyDescription:
          'Ніжний пушок, що називається лануго, поступово вкриває шкіру, а брови та вії починають з’являтися. Очі стають чутливими до світла.',
        length: 'Приблизно 10,1 см',
        comparison: 'Яблуко',
        bodyChanges: ['Ваш апетит може змінюватися, іноді з новими зачіпками до їжі чи відразою до певних продуктів.'],
        toKnow: ['Слух починає розвиватися приблизно в цей час: ваш голос і внутрішні звуки тіла поступово стають чутними.'],
      },
      cs: {
        babyDescription:
          'Jemné chmýří zvané lanugo postupně pokrývá kůži a začínají se objevovat obočí a řasy. Oči se stávají citlivými na světlo.',
        length: 'Asi 10,1 cm',
        comparison: 'Jablko',
        bodyChanges: ['Vaše chuť k jídlu se může měnit, někdy s novými chutěmi nebo odporem k některým potravinám.'],
        toKnow: ['Sluch se začíná vyvíjet kolem této doby: váš hlas a vnitřní zvuky těla se postupně stávají slyšitelnými.'],
      },
      sk: {
        babyDescription:
          'Jemný páperový porast zvaný lanugo postupne pokrýva kožu a začínajú sa objavovať obočie a mihalnice. Oči sa stávajú citlivými na svetlo.',
        length: 'Približne 10,1 cm',
        comparison: 'Jablko',
        bodyChanges: [
          'Vaša chuť do jedla sa môže zmeniť, niekedy s novými túžbami po jedle alebo odporom.',
        ],
        toKnow: [
          'Sluch sa začína vyvíjať okolo tohto času: váš hlas a vnútorné zvuky tela sa postupne stávajú vnímateľnými.',
        ],
      },
      hu: {
        babyDescription:
          'Lanugónak nevezett finom pehely fokozatosan beborítja a bőrt, és megjelenik a szemöldök és a szempilla. A szemek fényérzékennyé válnak.',
        length: 'Körülbelül 10,1 cm',
        comparison: 'Alma',
        bodyChanges: [
          'Az étvágyad megváltozhat, néha új ételvágyakkal vagy ellenszenvekkel.',
        ],
        toKnow: [
          'A hallás e tájt kezd fejlődni: a hangod és a test belső hangjai fokozatosan érzékelhetővé válnak.',
        ],
      },
      ro: {
        babyDescription:
          'Un puf fin, numit lanugo, acoperă treptat pielea, iar sprâncenele și genele încep să apară. Ochii devin sensibili la lumină.',
        length: 'Aproximativ 10,1 cm',
        comparison: 'Măr',
        bodyChanges: [
          'Pofta ta de mâncare se poate schimba, uneori cu pofte sau aversiuni alimentare noi.',
        ],
        toKnow: [
          'Auzul începe să se dezvolte în jurul acestui moment: vocea ta și sunetele interne ale corpului devin treptat perceptibile.',
        ],
      },
      bg: {
        babyDescription:
          'Фин мъх, наречен лануго, постепенно покрива кожата, а веждите и миглите започват да се появяват. Очите стават чувствителни към светлина.',
        length: 'Около 10,1 см',
        comparison: 'Ябълка',
        bodyChanges: [
          'Апетитът ти може да се промени, понякога с нови желания за храни или отвращения.',
        ],
        toKnow: [
          'Слухът започва да се развива около този момент: гласът ти и вътрешните звуци на тялото постепенно стават доловими.',
        ],
      },
      sr: {
        babyDescription:
          'Фина пахуљица звана лануго постепено покрива кожу, а обрве и трепавице почињу да се појављују. Очи постају осетљиве на светлост.',
        length: 'Око 10,1 цм',
        comparison: 'Јабука',
        bodyChanges: [
          'Твој апетит се може променити, понекад са новим жељама за храном или одбојностима.',
        ],
        toKnow: [
          'Слух почиње да се развија око овог времена: твој глас и унутрашњи звуци тела постепено постају уочљиви.',
        ],
      },
      hr: {
        babyDescription:
          'Fina paperjasta dlačica zvana lanugo postupno prekriva kožu, a obrve i trepavice počinju se pojavljivati. Oči postaju osjetljive na svjetlost.',
        length: 'Oko 10,1 cm',
        comparison: 'Jabuka',
        bodyChanges: [
          'Tvoj se apetit može promijeniti, ponekad s novom žudnjom za hranom ili odbojnostima.',
        ],
        toKnow: [
          'Sluh se počinje razvijati oko ovog vremena: tvoj glas i unutarnji zvukovi tijela postupno postaju zamjetni.',
        ],
      },
      bs: {
        babyDescription:
          'Fina paperjasta dlačica zvana lanugo postupno prekriva kožu, a obrve i trepavice počinju se pojavljivati. Oči postaju osjetljive na svjetlost.',
        length: 'Oko 10,1 cm',
        comparison: 'Jabuka',
        bodyChanges: [
          'Tvoj se apetit može promijeniti, ponekad s novom žudnjom za hranom ili odbojnostima.',
        ],
        toKnow: [
          'Sluh se počinje razvijati oko ovog vremena: tvoj glas i unutarnji zvukovi tijela postupno postaju zamjetni.',
        ],
      },
      sl: {
        babyDescription:
          'Fina puhasta dlačica, imenovana lanugo, postopoma prekriva kožo, obrvi in trepalnice pa se začnejo pojavljati. Oči postanejo občutljive na svetlobo.',
        length: 'Približno 10,1 cm',
        comparison: 'Jabolko',
        bodyChanges: [
          'Tvoj apetit se lahko spremeni, včasih z novim hrepenenjem po hrani ali odporom.',
        ],
        toKnow: [
          'Sluh se začne razvijati okoli tega časa: tvoj glas in notranji zvoki telesa postopoma postanejo zaznavni.',
        ],
      },
      ne: {
        babyDescription:
          'लानुगो भनिने मसिनो रौँले बिस्तारै छालालाई ढाक्छ, र भौँ तथा परेलाहरू देखिन थाल्छन्। आँखाहरू उज्यालोप्रति संवेदनशील हुन्छन्।',
        length: 'करिब 10.1 सेमी',
        comparison: 'स्याउ',
        bodyChanges: [
          'तपाईंको भोक बदलिन सक्छ, कहिलेकाहीँ खानेकुराको नयाँ चाहना वा अरुचिसहित।',
        ],
        toKnow: [
          'सुन्ने क्षमता यही समयतिर विकसित हुन थाल्छ: तपाईंको आवाज र शरीरका आन्तरिक आवाजहरू बिस्तारै सुनिन थाल्छन्।',
        ],
      },
      si: {
        babyDescription:
          'ලැනුගෝ ලෙස හැඳින්වෙන සියුම් රෝම ක්‍රමයෙන් සම ආවරණය කරන අතර, ඇහිබැම සහ ඇස් පිය රෝම දිස්වීමට පටන් ගනී. ඇස් ආලෝකයට සංවේදී වේ.',
        length: 'සෙ.මී. 10.1 පමණ',
        comparison: 'ඇපල් ගෙඩියක්',
        bodyChanges: [
          'ඔබේ ආහාර රුචිය වෙනස් විය හැක, සමහර විට නව ආහාර ආශාවන් හෝ පිළිකුල් සමඟ.',
        ],
        toKnow: [
          'ශ්‍රවණය මෙම කාලය වටා වර්ධනය වීමට පටන් ගනී: ඔබේ කටහඬ සහ ශරීරයේ අභ්‍යන්තර ශබ්ද ක්‍රමයෙන් වැටහෙනු ඇත.',
        ],
      },
      th: {
        babyDescription:
          'ขนอ่อนละเอียดที่เรียกว่าลานูโกค่อย ๆ ปกคลุมผิวหนัง และคิ้วกับขนตาเริ่มปรากฏ ดวงตาไวต่อแสง',
        length: 'ประมาณ 10.1 ซม.',
        comparison: 'แอปเปิล',
        bodyChanges: [
          'ความอยากอาหารของคุณอาจเปลี่ยนไป บางครั้งมีความอยากหรือรังเกียจอาหารแบบใหม่',
        ],
        toKnow: [
          'การได้ยินเริ่มพัฒนาราวช่วงนี้: เสียงของคุณและเสียงภายในร่างกายค่อย ๆ รับรู้ได้',
        ],
      },
      vi: {
        babyDescription:
          'Một lớp lông tơ mịn gọi là lanugo dần phủ lên da, lông mày và lông mi bắt đầu xuất hiện. Đôi mắt trở nên nhạy cảm với ánh sáng.',
        length: 'Khoảng 10,1 cm',
        comparison: 'Quả táo',
        bodyChanges: [
          'Cảm giác thèm ăn của bạn có thể thay đổi, đôi khi với những món thèm hoặc ghét mới.',
        ],
        toKnow: [
          'Thính giác bắt đầu phát triển vào khoảng thời gian này: giọng nói của bạn và những âm thanh bên trong cơ thể dần được cảm nhận.',
        ],
      },
      uz: {
        babyDescription:
          'Lanugo deb ataladigan mayin tuk teri ustini asta-sekin qoplaydi, qosh va kiprik paydo boʻla boshlaydi. Koʻzlar yorugʻlikka sezgir boʻladi.',
        length: 'Taxminan 10,1 sm',
        comparison: 'Olma',
        bodyChanges: [
          'Ishtahangiz oʻzgarishi mumkin, baʼzan yangi ovqatga ishtiyoq yoki nafrat bilan.',
        ],
        toKnow: [
          'Eshitish shu vaqt atrofida rivojlana boshlaydi: ovozingiz va tananing ichki tovushlari asta-sekin sezila boshlaydi.',
        ],
      },
      az: {
        babyDescription:
          'Lanuqo adlanan incə tük dərini tədricən örtür, qaş və kirpiklər görünməyə başlayır. Gözlər işığa həssas olur.',
        length: 'Təxminən 10,1 sm',
        comparison: 'Alma',
        bodyChanges: [
          'İştahınız dəyişə bilər, bəzən yeni qida istəkləri və ya iyrənmələr olur.',
        ],
        toKnow: [
          'Eşitmə bu vaxt ətrafında inkişaf etməyə başlayır: səsiniz və bədənin daxili səsləri tədricən qavranılır.',
        ],
      },
      ka: {
        babyDescription:
          'ლანუგო ეწოდებული წვრილი ბუსუსი ეტაპობრივად ფარავს კანს და ჩნდება წარბები და წამწამები. თვალები სინათლის მიმართ მგრძნობიარე ხდება.',
        length: 'დაახლოებით 10,1 სმ',
        comparison: 'ვაშლი',
        bodyChanges: [
          'თქვენი მადა შეიძლება შეიცვალოს, ზოგჯერ ახალი საკვების სურვილით ან ზიზღით.',
        ],
        toKnow: [
          'სმენა დაახლოებით ამ დროს იწყებს განვითარებას: თქვენი ხმა და სხეულის შიდა ხმები ეტაპობრივად იგრძნობა.',
        ],
      },
      hy: {
        babyDescription:
          'Բարակ աղվամազ, որը կոչվում է լանուգո, աստիճանաբար ծածկում է մաշկը, և սկսում են հայտնվել հոնքերն ու թարթիչները: Աչքերը դառնում են զգայուն լույսի նկատմամբ:',
        length: 'Մոտ 10,1 սմ',
        comparison: 'Խնձոր',
        bodyChanges: [
          'Ձեր ախորժակը կարող է փոխվել՝ երբեմն նոր սննդային ցանկություններով կամ զզվանքով:',
        ],
        toKnow: [
          'Լսողությունը սկսում է զարգանալ մոտ այս ժամանակ. ձեր ձայնը և մարմնի ներքին հնչյունները աստիճանաբար դառնում են ընկալելի:',
        ],
      },
      tg: {
        babyDescription:
          'Мӯйи нозуке бо номи лануго тадриҷан пӯстро мепӯшонад ва абрӯвон ва мижгонҳо пайдо шудан мегиранд. Чашмон ба рӯшноӣ ҳассос мешаванд.',
        length: 'Тақрибан 10,1 см',
        comparison: 'Себ',
        bodyChanges: [
          'Иштиҳои шумо метавонад тағйир ёбад, баъзан бо хоҳишҳои нав ё нафрат аз баъзе хӯрокҳо.',
        ],
        toKnow: [
          'Шунавоӣ дар атрофи ҳамин вақт инкишоф ёфтанро оғоз мекунад: овози шумо ва садоҳои дохилии бадан тадриҷан шунаво мешаванд.',
        ],
      },
      ky: {
        babyDescription:
          'Теринин үстүн ланугу деп аталган жука түкчөлөр акырындап каптайт, ал эми каштар менен кирпиктер пайда боло баштайт. Көздөр жарыкка сезгич болот.',
        length: 'Болжол менен 10,1 см',
        comparison: 'Алма',
        bodyChanges: [
          'Табитиңиз өзгөрүшү мүмкүн, кээде жаңы тамакка болгон каалоолор же жийиркенүүлөр менен.',
        ],
        toKnow: [
          'Угуу ушул убакта өнүгө баштайт: үнүңүз жана дененин ички добуштары акырындап сезилет.',
        ],
      },
      tk: {
        babyDescription:
          'Lanugo diýlip atlandyrylýan inçe ýumşak tüý derini ýuwaş-ýuwaşdan örtýär, gaşlar we kirpikler peýda bolup başlaýar. Gözler ýagtylyga duýgur bolýar.',
        length: 'Takmynan 10,1 sm',
        comparison: 'Alma',
        bodyChanges: [
          'Iýmit islegiňiz üýtgäp biler, käwagt täze iýmit isleglerine ýa-da ýigrenmelere eltýär.',
        ],
        toKnow: [
          'Eşitmek şu wagt töwereginde ösüp başlaýar: sesiňiz we bedeniň içki sesleri ýuwaş-ýuwaşdan duýulýar.',
        ],
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
      da: {
        babyDescription: 'En fin fnuld kaldet lanugo dækker gradvist huden, og øjenbryn og øjenvipper begynder at dukke op. Øjnene bliver følsomme over for lys.',
        length: 'Ca. 10,1 cm',
        comparison: 'Æble',
        bodyChanges: [
          'Din appetit kan ændre sig, sommetimes med nye madtrang eller aversioner.',
        ],
        toKnow: [
          'Hørelsen begynder at udvikle sig på dette tidspunkt: din stemme og kroppens indre lyde bliver gradvist hørbare.',
        ],
      },
      sv: {
        babyDescription: 'En fin fnuld kaldet lanugo däkker gradvist huden, och öjenbryn och öjenvipper begynder at dukke op. Öjnene bliver fölsomme over for lys.',
        length: 'Ca. 10,1 cm',
        comparison: 'Äble',
        bodyChanges: [
          'Din appetit kan ändre sig, sommetimes med nye madtrang eller aversioner.',
        ],
        toKnow: [
          'Hörelsen begynder at udvikle sig på dette tidspunkt: din stemme och kroppens indre lyde bliver gradvist hörbare.',
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
      nb: {
        babyDescription: 'Nervesystemet gjør bevegelser i armer og ben mulige. Hendene kan lukke seg til små never.',
        length: 'Omtrent 11,6 cm',
        comparison: 'Avokado',
        bodyChanges: ['Noen begynner å kjenne svært lette bevegelser fra omtrent dette tidspunktet, ofte beskrevet som flagring.'],
        toKnow: ['Å kjenne de første bevegelsene varierer mye fra ett svangerskap til et annet, særlig avhengig av om det er et første svangerskap.'],
      },
      pl: {
        babyDescription: 'Układ nerwowy umożliwia ruchy rąk i nóg. Dłonie mogą zaciskać się w małe piąstki.',
        length: 'Około 11,6 cm',
        comparison: 'Awokado',
        bodyChanges: ['Niektóre osoby zaczynają odczuwać bardzo delikatne ruchy mniej więcej od tego czasu, często opisywane jako trzepotanie.'],
        toKnow: ['Odczuwanie pierwszych ruchów bardzo różni się w poszczególnych ciążach, zwłaszcza w zależności od tego, czy to pierwsza ciąża.'],
      },
      uk: {
        babyDescription: 'Нервова система уможливлює рухи рук і ніг. Кисті можуть стискатися в маленькі кулачки.',
        length: 'Приблизно 11,6 см',
        comparison: 'Авокадо',
        bodyChanges: ['Деякі жінки починають відчувати дуже легкі рухи приблизно з цього часу, які часто описують як тріпотіння.'],
        toKnow: ['Відчуття перших рухів дуже різниться в різних вагітностях, зокрема залежно від того, чи це перша вагітність.'],
      },
      cs: {
        babyDescription: 'Nervový systém umožňuje pohyby paží a nohou. Ruce se mohou zavírat do malých pěstiček.',
        length: 'Asi 11,6 cm',
        comparison: 'Avokádo',
        bodyChanges: ['Některé ženy začínají cítit velmi lehké pohyby přibližně od této doby, často popisované jako třepotání.'],
        toKnow: ['Pociťování prvních pohybů se u jednotlivých těhotenství velmi liší, zejména podle toho, zda jde o první těhotenství.'],
      },
      sk: {
        babyDescription:
          'Nervový systém umožňuje pohyby rúk a nôh. Ruky sa môžu zovrieť do malých pästí.',
        length: 'Približne 11,6 cm',
        comparison: 'Avokádo',
        bodyChanges: [
          'Niektoré ženy začínajú približne od tohto času pociťovať veľmi jemné pohyby, často opisované ako chvenie.',
        ],
        toKnow: [
          'Pocit prvých pohybov sa medzi tehotenstvami veľmi líši, najmä podľa toho, či ide o prvé tehotenstvo.',
        ],
      },
      hu: {
        babyDescription:
          'Az idegrendszer lehetővé teszi a kar- és lábmozgásokat. A kezek kis ökölbe zárulhatnak.',
        length: 'Körülbelül 11,6 cm',
        comparison: 'Avokádó',
        bodyChanges: [
          'Egyes nők körülbelül ebben az időben kezdenek érezni nagyon enyhe mozgásokat, amelyeket gyakran csapkodásként írnak le.',
        ],
        toKnow: [
          'Az első mozgások érzése terhességenként nagyon eltérő, különösen attól függően, hogy az első terhesség-e.',
        ],
      },
      ro: {
        babyDescription:
          'Sistemul nervos permite mișcări ale brațelor și picioarelor. Mâinile se pot strânge în pumni mici.',
        length: 'Aproximativ 11,6 cm',
        comparison: 'Avocado',
        bodyChanges: [
          'Unele persoane încep să simtă mișcări foarte ușoare încă de pe la acest moment, adesea descrise ca un fluturat.',
        ],
        toKnow: [
          'Simțirea primelor mișcări variază mult de la o sarcină la alta, în special în funcție de faptul că este sau nu prima sarcină.',
        ],
      },
      bg: {
        babyDescription:
          'Нервната система позволява движения на ръцете и краката. Ръчичките могат да се свиват в малки юмручета.',
        length: 'Около 11,6 см',
        comparison: 'Авокадо',
        bodyChanges: [
          'Някои хора започват да усещат много леки движения от около този момент, често описвани като потрепване.',
        ],
        toKnow: [
          'Усещането на първите движения варира много от бременност на бременност, особено според това дали е първа бременност.',
        ],
      },
      sr: {
        babyDescription:
          'Нервни систем омогућава покрете руку и ногу. Шаке могу да се стисну у мале песнице.',
        length: 'Око 11,6 цм',
        comparison: 'Авокадо',
        bodyChanges: [
          'Неки људи почињу да осећају веома лагане покрете од отприлике овог времена, често описиване као лепршање.',
        ],
        toKnow: [
          'Осећање првих покрета увелико варира од трудноће до трудноће, нарочито зависно од тога да ли је реч о првој трудноћи.',
        ],
      },
      hr: {
        babyDescription:
          'Živčani sustav omogućuje pokrete ruku i nogu. Šake se mogu stisnuti u male šake.',
        length: 'Oko 11,6 cm',
        comparison: 'Avokado',
        bodyChanges: [
          'Neke osobe počinju osjećati vrlo lagane pokrete otprilike od ovog vremena, često opisivane kao lepršanje.',
        ],
        toKnow: [
          'Osjećanje prvih pokreta jako varira od trudnoće do trudnoće, osobito ovisno o tome je li riječ o prvoj trudnoći.',
        ],
      },
      bs: {
        babyDescription:
          'Živčani sistem omogućuje pokrete ruku i nogu. Šake se mogu stisnuti u male šake.',
        length: 'Oko 11,6 cm',
        comparison: 'Avokado',
        bodyChanges: [
          'Neke osobe počinju osjećati vrlo lagane pokrete otprilike od ovog vremena, često opisivane kao lepršanje.',
        ],
        toKnow: [
          'Osjećanje prvih pokreta jako varira od trudnoće do trudnoće, osobito ovisno o tome je li riječ o prvoj trudnoći.',
        ],
      },
      sl: {
        babyDescription:
          'Živčni sistem omogoča gibe rok in nog. Dlani se lahko stisnejo v majhne pesti.',
        length: 'Približno 11,6 cm',
        comparison: 'Avokado',
        bodyChanges: [
          'Nekatere osebe začnejo čutiti zelo lahke gibe približno od tega časa, pogosto opisane kot frfotanje.',
        ],
        toKnow: [
          'Občutenje prvih gibov se zelo razlikuje od nosečnosti do nosečnosti, zlasti glede na to, ali gre za prvo nosečnost.',
        ],
      },
      ne: {
        babyDescription:
          'स्नायु प्रणालीले हात र खुट्टाका चाल सम्भव बनाउँछ। हातहरू साना मुट्ठीमा बन्द हुन सक्छन्।',
        length: 'करिब 11.6 सेमी',
        comparison: 'एभोकाडो',
        bodyChanges: [
          'केही मानिसले यही समयदेखि निकै हल्का चालहरू महसुस गर्न थाल्छन्, प्रायः फड्फडाहटका रूपमा वर्णन गरिने।',
        ],
        toKnow: [
          'पहिलो चालहरू महसुस गर्ने कुरा एक गर्भावस्थादेखि अर्कोमा निकै फरक हुन्छ, विशेष गरी यो पहिलो गर्भावस्था हो कि होइन भन्नेमा।',
        ],
      },
      si: {
        babyDescription:
          'ස්නායු පද්ධතිය අත් සහ කකුල් චලනයන්ට ඉඩ සලසයි. අත් කුඩා මිටි බවට වැසිය හැක.',
        length: 'සෙ.මී. 11.6 පමණ',
        comparison: 'අලිගැටපේර ගෙඩියක්',
        bodyChanges: [
          'සමහර පුද්ගලයන්ට මෙම කාලයේ සිට, බොහෝ විට සැලෙන සටහනක් ලෙස විස්තර කෙරෙන, ඉතා සැහැල්ලු චලනයන් දැනීමට පටන් ගනී.',
        ],
        toKnow: [
          'පළමු චලනයන් දැනීම විශේෂයෙන් එය පළමු ගර්භණී කාලයක්ද යන්න අනුව එක් ගර්භණී කාලයක සිට තවත් ගර්භණී කාලයකට බොහෝ සේ වෙනස් වේ.',
        ],
      },
      th: {
        babyDescription:
          'ระบบประสาทช่วยให้เคลื่อนไหวแขนและขาได้ มือกำเป็นกำปั้นเล็ก ๆ ได้',
        length: 'ประมาณ 11.6 ซม.',
        comparison: 'อะโวคาโด',
        bodyChanges: [
          'บางคนเริ่มรู้สึกถึงการเคลื่อนไหวเบามากตั้งแต่ราวช่วงนี้ มักอธิบายว่าเหมือนปีกผีเสื้อกระพือ',
        ],
        toKnow: [
          'การรู้สึกถึงการเคลื่อนไหวครั้งแรกแตกต่างกันมากในแต่ละการตั้งครรภ์ โดยเฉพาะขึ้นกับว่าเป็นการตั้งครรภ์ครั้งแรกหรือไม่',
        ],
      },
      vi: {
        babyDescription:
          'Hệ thần kinh cho phép cử động tay và chân. Hai bàn tay có thể nắm lại thành những nắm đấm nhỏ.',
        length: 'Khoảng 11,6 cm',
        comparison: 'Quả bơ',
        bodyChanges: [
          'Một số người bắt đầu cảm thấy những cử động rất nhẹ từ khoảng thời gian này, thường được mô tả như cảm giác đập nhẹ.',
        ],
        toKnow: [
          'Việc cảm nhận những cử động đầu tiên khác nhau rất nhiều giữa các thai kỳ, đặc biệt tùy thuộc vào việc đó có phải là thai kỳ đầu tiên hay không.',
        ],
      },
      uz: {
        babyDescription:
          'Asab tizimi qoʻl va oyoq harakatlariga imkon beradi. Qoʻllar mayda mushtga yumilishi mumkin.',
        length: 'Taxminan 11,6 sm',
        comparison: 'Avokado',
        bodyChanges: [
          'Baʼzi odamlar shu vaqtdan boshlab juda yengil harakatlarni sezadi, koʻpincha pir-pirlash deb taʼriflanadi.',
        ],
        toKnow: [
          'Dastlabki harakatlarni sezish bir homiladorlikdan boshqasiga juda farq qiladi, xususan, bu birinchi homiladorlik ekanligiga qarab.',
        ],
      },
      az: {
        babyDescription:
          'Sinir sistemi qol və ayaq hərəkətlərinə imkan verir. Əllər kiçik yumruqlar halında bükülə bilir.',
        length: 'Təxminən 11,6 sm',
        comparison: 'Avokado',
        bodyChanges: [
          'Bəzi insanlar bu vaxtdan başlayaraq çox yüngül, çox vaxt qanad çırpıntısı kimi təsvir edilən hərəkətləri hiss etməyə başlayır.',
        ],
        toKnow: [
          'İlk hərəkətləri hiss etmək bir hamiləlikdən digərinə, xüsusilə ilk hamiləlik olub-olmamasından asılı olaraq çox dəyişir.',
        ],
      },
      ka: {
        babyDescription:
          'ნერვული სისტემა ხელებისა და ფეხების მოძრაობის საშუალებას იძლევა. ხელები პატარა მუშტებად შეიძლება დაიხუჭოს.',
        length: 'დაახლოებით 11,6 სმ',
        comparison: 'ავოკადო',
        bodyChanges: [
          'ზოგი ადამიანი დაახლოებით ამ დროიდან ძალიან მსუბუქ მოძრაობებს იწყებს გრძნობას, რომლებიც ხშირად გაფართხალებად აღიწერება.',
        ],
        toKnow: [
          'პირველი მოძრაობების შეგრძნება ერთი ორსულობიდან მეორემდე ძლიერ განსხვავდება, განსაკუთრებით იმის მიხედვით, პირველი ორსულობაა თუ არა.',
        ],
      },
      hy: {
        babyDescription:
          'Նյարդային համակարգը թույլ է տալիս ձեռքերի և ոտքերի շարժումներ: Ձեռքերը կարող են փակվել փոքրիկ բռունցքների մեջ:',
        length: 'Մոտ 11,6 սմ',
        comparison: 'Ավոկադո',
        bodyChanges: [
          'Որոշ մարդիկ սկսում են զգալ շատ թեթև շարժումներ մոտ այս ժամանակից, որոնք հաճախ նկարագրվում են որպես թրթռոց:',
        ],
        toKnow: [
          'Առաջին շարժումների զգալը խիստ տարբերվում է մի հղիությունից մյուսը, մասնավորապես կախված նրանից՝ առաջին հղիությունն է, թե ոչ:',
        ],
      },
      tg: {
        babyDescription:
          'Системаи асаб ҳаракатҳои дастҳо ва пойҳоро имкон медиҳад. Дастҳо метавонанд ба мушти хурд бастан гиранд.',
        length: 'Тақрибан 11,6 см',
        comparison: 'Авокадо',
        bodyChanges: [
          'Баъзе одамон аз атрофи ҳамин вақт ҳаракатҳои хеле сабукро, ки аксар вақт ҳамчун пар-пар кардан тавсиф мешаванд, эҳсос карданро оғоз мекунанд.',
        ],
        toKnow: [
          'Ҳис кардани аввалин ҳаракатҳо аз як ҳомиладорӣ то ҳомиладории дигар хеле фарқ мекунад, хусусан вобаста ба он ки ҳомиладории аввал аст ё не.',
        ],
      },
      ky: {
        babyDescription:
          'Нерв системасы кол жана буттун кыймылдарына мүмкүндүк берет. Колдор кичинекей муштумга жумулушу мүмкүн.',
        length: 'Болжол менен 11,6 см',
        comparison: 'Авокадо',
        bodyChanges: [
          'Айрым адамдар ушул убактан баштап өтө жеңил кыймылдарды сезе башташат, көбүнчө дүрбүлдөө деп сүрөттөлөт.',
        ],
        toKnow: [
          'Алгачкы кыймылдарды сезүү бир курсактуулуктан экинчисине абдан айырмаланат, айрыкча биринчи курсактуулук экенине жараша.',
        ],
      },
      tk: {
        babyDescription:
          'Nerw ulgamy el-aýak hereketlerine mümkinçilik berýär. Eller kiçijik ýumruga ýumulyp bilner.',
        length: 'Takmynan 11,6 sm',
        comparison: 'Awokado',
        bodyChanges: [
          'Käbir adamlar şu wagtdan başlap, köplenç ganat kakmak diýlip suratlandyrylýan, gaty ýeňil hereketleri duýup başlaýar.',
        ],
        toKnow: [
          'Ilkinji hereketleri duýmak göwreliligiň biri bilen beýlekisiniň arasynda, aýratyn-da ilkinji göwreliligiň bolmagyna baglylykda, köp tapawutlanýar.',
        ],
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
      da: {
        babyDescription: 'Nervesystemet muliggør bevægelser af arme og ben. Hænderne kan lukkes til små næver.',
        length: 'Ca. 11,6 cm',
        comparison: 'Avocado',
        bodyChanges: [
          'Nogle begynder at mærke meget lette bevægelser fra omkring dette tidspunkt, ofte beskrevet som en vingeslagen.',
        ],
        toKnow: [
          'Tidspunktet for de første bevægelser varierer meget fra graviditet til graviditet, særligt afhængigt af om det er en første graviditet.',
        ],
      },
      sv: {
        babyDescription: 'Nervesystemet muliggör bevägelser av arme och ben. Händerne kan lukkes till små näver.',
        length: 'Ca. 11,6 cm',
        comparison: 'Avocado',
        bodyChanges: [
          'Nogle begynder at märke mycket lette bevägelser fran omkring dette tidspunkt, ofte beskrevet som en vingeslagen.',
        ],
        toKnow: [
          'Tidspunktet for de förste bevägelser varierer mycket fran graviditet till graviditet, särligt afhängigt av om det ar en förste graviditet.',
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
      nb: {
        babyDescription:
          'Øynene, som fortsatt er lukket, kan bevege seg, og babyen reagerer nå på høye lyder. Fingeravtrykkene begynner å dannes.',
        length: 'Omtrent 12 cm',
        comparison: 'Granateple',
        bodyChanges: ['Lett ryggsmerte kan dukke opp når tyngdepunktet ditt forskyves.'],
        toKnow: ['Lyder utenfra begynner å bli oppfattet, dempet, gjennom fostervannet.'],
      },
      pl: {
        babyDescription:
          'Oczy, wciąż zamknięte, mogą się poruszać, a dziecko reaguje teraz na głośne dźwięki. Zaczynają się kształtować odciski palców.',
        length: 'Około 12 cm',
        comparison: 'Granat',
        bodyChanges: ['Może pojawić się lekki ból pleców w miarę przesuwania się środka ciężkości.'],
        toKnow: ['Dźwięki z zewnątrz zaczynają być odbierane, w stłumionej postaci, przez płyn owodniowy.'],
      },
      uk: {
        babyDescription:
          'Очі, ще закриті, можуть рухатися, а дитина тепер реагує на гучні звуки. Починають формуватися відбитки пальців.',
        length: 'Приблизно 12 см',
        comparison: 'Гранат',
        bodyChanges: ['Може з’явитися легкий біль у спині в міру зміщення центру ваги.'],
        toKnow: ['Звуки ззовні починають сприйматися, у приглушеному вигляді, крізь навколоплідні води.'],
      },
      cs: {
        babyDescription:
          'Oči, stále zavřené, se mohou pohybovat a miminko nyní reaguje na hlasité zvuky. Začínají se tvořit otisky prstů.',
        length: 'Asi 12 cm',
        comparison: 'Granátové jablko',
        bodyChanges: ['Může se objevit mírná bolest zad, jak se posouvá těžiště.'],
        toKnow: ['Zvuky zvenčí se začínají vnímat, tlumeně, přes plodovou vodu.'],
      },
      sk: {
        babyDescription:
          'Oči, ešte zatvorené, sa môžu pohybovať a bábätko teraz reaguje na hlasné zvuky. Začínajú sa tvoriť odtlačky prstov.',
        length: 'Približne 12 cm',
        comparison: 'Granátové jablko',
        bodyChanges: [
          'Môže sa objaviť mierna bolesť chrbta, keď sa posúva vaše ťažisko.',
        ],
        toKnow: [
          'Vonkajšie zvuky sa začínajú vnímať, tlmene, cez plodovú vodu.',
        ],
      },
      hu: {
        babyDescription:
          'A szemek, még csukottak, mozoghatnak, és a baba mostantól reagál a hangos zajokra. Az ujjlenyomatok kialakulni kezdenek.',
        length: 'Körülbelül 12 cm',
        comparison: 'Gránátalma',
        bodyChanges: [
          'Enyhe hátfájdalom jelentkezhet, ahogy a súlypontod eltolódik.',
        ],
        toKnow: [
          'A külső hangok tompítva, a magzatvizen keresztül kezdenek érzékelhetővé válni.',
        ],
      },
      ro: {
        babyDescription:
          'Ochii, încă închiși, se pot mișca, iar bebelușul reacționează acum la sunetele puternice. Amprentele încep să se formeze.',
        length: 'Aproximativ 12 cm',
        comparison: 'Rodie',
        bodyChanges: [
          'O durere de spate ușoară poate apărea pe măsură ce centrul tău de greutate se deplasează.',
        ],
        toKnow: [
          'Sunetele din exterior încep să fie percepute, în formă înfundată, prin lichidul amniotic.',
        ],
      },
      bg: {
        babyDescription:
          'Очите, все още затворени, могат да се движат, а бебето вече реагира на силни звуци. Започват да се формират отпечатъците от пръстите.',
        length: 'Около 12 см',
        comparison: 'Нар',
        bodyChanges: [
          'Може да се появи лека болка в гърба, докато центърът на тежестта ти се измества.',
        ],
        toKnow: [
          'Външните звуци започват да се долавят, приглушени, през амниотичната течност.',
        ],
      },
      sr: {
        babyDescription:
          'Очи, још затворене, могу се кретати, а беба сада реагује на гласне звукове. Отисци прстију почињу да се формирају.',
        length: 'Око 12 цм',
        comparison: 'Нар',
        bodyChanges: [
          'Може се појавити блага бол у леђима како се твој центар тежине помера.',
        ],
        toKnow: [
          'Спољашњи звуци почињу да се чују, пригушено, кроз амнионску течност.',
        ],
      },
      hr: {
        babyDescription:
          'Oči, još zatvorene, mogu se pomicati, a beba sada reagira na glasne zvukove. Otisci prstiju počinju se oblikovati.',
        length: 'Oko 12 cm',
        comparison: 'Nar',
        bodyChanges: [
          'Može se pojaviti blaga bol u leđima kako se tvoje težište pomiče.',
        ],
        toKnow: [
          'Vanjski zvukovi počinju se čuti, prigušeno, kroz plodnu vodu.',
        ],
      },
      bs: {
        babyDescription:
          'Oči, još zatvorene, mogu se pomicati, a beba sada reagira na glasne zvukove. Otisci prstiju počinju se oblikovati.',
        length: 'Oko 12 cm',
        comparison: 'Nar',
        bodyChanges: [
          'Može se pojaviti blaga bol u leđima kako se tvoje težište pomiče.',
        ],
        toKnow: [
          'Vanjski zvukovi počinju se čuti, prigušeno, kroz plodnu vodu.',
        ],
      },
      sl: {
        babyDescription:
          'Oči, še zaprte, se lahko premikajo, dojenček pa se zdaj odziva na glasne zvoke. Prstni odtisi se začnejo oblikovati.',
        length: 'Približno 12 cm',
        comparison: 'Granatno jabolko',
        bodyChanges: [
          'Lahko se pojavi blaga bolečina v hrbtu, ko se tvoje težišče premika.',
        ],
        toKnow: [
          'Zunanji zvoki se začnejo slišati, pridušeno, skozi plodovnico.',
        ],
      },
      ne: {
        babyDescription:
          'आँखाहरू, अझै बन्द, चल्न सक्छन्, र शिशुले अब ठूला आवाजहरूप्रति प्रतिक्रिया दिन्छ। औँठाछापहरू बन्न थाल्छन्।',
        length: 'करिब 12 सेमी',
        comparison: 'अनार',
        bodyChanges: [
          'तपाईंको गुरुत्व केन्द्र सर्दा हल्का ढाडको दुखाइ देखिन सक्छ।',
        ],
        toKnow: [
          'बाहिरका आवाजहरू उल्बको तरलमार्फत, धमिलो रूपमा, पहिचान हुन थालेका छन्।',
        ],
      },
      si: {
        babyDescription:
          'තවමත් වසා ඇති ඇස්වලට චලනය විය හැකි අතර, දරුවා දැන් ශබ්ද නාදවලට ප්‍රතිචාර දක්වයි. ඇඟිලි සලකුණු සෑදීමට පටන් ගනී.',
        length: 'සෙ.මී. 12 පමණ',
        comparison: 'දෙළුම් ගෙඩියක්',
        bodyChanges: [
          'ඔබේ ගුරුත්ව කේන්ද්‍රය මාරු වන විට සුළු පිට වේදනාවක් දිස්විය හැක.',
        ],
        toKnow: [
          'පිටත ශබ්ද ඇම්නියොටික් තරලය හරහා, අපැහැදිලි ස්වරූපයෙන්, වැටහීමට පටන් ගනී.',
        ],
      },
      th: {
        babyDescription:
          'ดวงตาซึ่งยังปิดอยู่ขยับได้ และตอนนี้ทารกตอบสนองต่อเสียงดัง ลายนิ้วมือเริ่มก่อตัว',
        length: 'ประมาณ 12 ซม.',
        comparison: 'ทับทิม',
        bodyChanges: [
          'อาจมีอาการปวดหลังเล็กน้อยเมื่อจุดศูนย์ถ่วงของคุณเปลี่ยนไป',
        ],
        toKnow: [
          'เสียงจากภายนอกเริ่มรับรู้ได้ในรูปแบบที่อู้อี้ผ่านน้ำคร่ำ',
        ],
      },
      vi: {
        babyDescription:
          'Đôi mắt, vẫn còn nhắm, có thể cử động, và em bé giờ đây phản ứng với những tiếng động lớn. Vân tay bắt đầu hình thành.',
        length: 'Khoảng 12 cm',
        comparison: 'Quả lựu',
        bodyChanges: [
          'Có thể xuất hiện đau lưng nhẹ khi trọng tâm cơ thể bạn thay đổi.',
        ],
        toKnow: [
          'Âm thanh bên ngoài bắt đầu được cảm nhận, ở dạng bị nghe lùng bùng, qua nước ối.',
        ],
      },
      uz: {
        babyDescription:
          'Hali yumuq koʻzlar harakatlana oladi va chaqaloq endi baland tovushlarga javob beradi. Barmoq izlari shakllana boshlaydi.',
        length: 'Taxminan 12 sm',
        comparison: 'Anor',
        bodyChanges: [
          'Ogʻirlik markazingiz siljiganda yengil bel ogʻrigʻi paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Tashqi tovushlar amnion suyuqligi orqali bosiq holda sezila boshlaydi.',
        ],
      },
      az: {
        babyDescription:
          'Hələ də qapalı olan gözlər hərəkət edə bilir və körpə artıq yüksək səslərə reaksiya verir. Barmaq izləri formalaşmağa başlayır.',
        length: 'Təxminən 12 sm',
        comparison: 'Nar',
        bodyChanges: [
          'Ağırlıq mərkəziniz dəyişdikcə yüngül bel ağrısı görünə bilər.',
        ],
        toKnow: [
          'Xarici səslər amnion mayesi vasitəsilə boğuq şəkildə qavranılmağa başlayır.',
        ],
      },
      ka: {
        babyDescription:
          'თვალები, ჯერ კიდევ დახუჭული, შეიძლება მოძრაობდეს და ბავშვი ახლა ხმამაღალ ხმებზე რეაგირებს. იწყება თითის ანაბეჭდების ფორმირება.',
        length: 'დაახლოებით 12 სმ',
        comparison: 'ბროწეული',
        bodyChanges: [
          'მსუბუქი ზურგის ტკივილი შეიძლება გამოჩნდეს, რადგან სიმძიმის ცენტრი გადაინაცვლებს.',
        ],
        toKnow: [
          'გარე ხმები ამნიონური სითხის გავლით, მიყრუებული სახით, იწყებს აღქმას.',
        ],
      },
      hy: {
        babyDescription:
          'Աչքերը, դեռ փակ, կարող են շարժվել, և երեխան այժմ արձագանքում է բարձր հնչյուններին: Սկսում են ձևավորվել մատնահետքերը:',
        length: 'Մոտ 12 սմ',
        comparison: 'Նուռ',
        bodyChanges: [
          'Մեջքի թեթև ցավ կարող է հայտնվել, երբ ձեր ծանրության կենտրոնը տեղաշարժվում է:',
        ],
        toKnow: [
          'Արտաքին հնչյունները սկսում են ընկալվել՝ խլացված ձևով, ամնիոտիկ հեղուկի միջոցով:',
        ],
      },
      tg: {
        babyDescription:
          'Чашмон, ки ҳанӯз баста ҳастанд, метавонанд ҳаракат кунанд ва тифл акнун ба садоҳои баланд вокуниш нишон медиҳад. Нақшҳои ангушт ташаккул ёфтан мегиранд.',
        length: 'Тақрибан 12 см',
        comparison: 'Анор',
        bodyChanges: [
          'Дарди сабуки пушт метавонад ҳангоми ҷойивазкунии маркази вазнинии шумо пайдо шавад.',
        ],
        toKnow: [
          'Садоҳои беруна ба таври нарм тавассути моеи амниотикӣ дарк шудан мегиранд.',
        ],
      },
      ky: {
        babyDescription:
          'Дагы эле жабык көздөр кыймылдай алат, ал эми ымыркай эми катуу добуштарга реакция берет. Манжа издери түзүлө баштайт.',
        length: 'Болжол менен 12 см',
        comparison: 'Анар',
        bodyChanges: [
          'Оордук борборуңуз жылган сайын жеңил бел оорусу пайда болушу мүмкүн.',
        ],
        toKnow: [
          'Тышкы добуштар амниотикалык суюктук аркылуу басаңдап сезилип баштайт.',
        ],
      },
      tk: {
        babyDescription:
          'Heniz ýumuk gözler hereket edip bilýär we bäbek indi gaty seslere jogap berýär. Barmak yzlary emele gelip başlaýar.',
        length: 'Takmynan 12 sm',
        comparison: 'Nar',
        bodyChanges: [
          'Agramyň merkezi süýşende ýeňil bil agyrysy peýda bolup biler.',
        ],
        toKnow: [
          'Daşarky sesler amniotik suwuklyk arkaly basylan görnüşde duýulyp başlaýar.',
        ],
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
      da: {
        babyDescription: 'Øjnene, stadig lukkede, kan bevæge sig, og babyen reagerer nu på høje lyde. Fingeraftryk begynder at dannes.',
        length: 'Ca. 12 cm',
        comparison: 'Granatæble',
        bodyChanges: [
          'Let rygsmerter kan opstå, efterhånden som dit tyngdepunkt forskydes.',
        ],
        toKnow: [
          'Udefra kommende lyde begynder at blive opfattet, i dæmpet form, gennem fostervandet.',
        ],
      },
      sv: {
        babyDescription: 'Öjnene, fortfarande lukkede, kan beväge sig, och babyen reagerer nu på höje lyde. Fingeraftryk begynder at dannes.',
        length: 'Ca. 12 cm',
        comparison: 'Granatäble',
        bodyChanges: [
          'Let rygsmerter kan opstå, efterhånden som dit tyngdepunkt forskydes.',
        ],
        toKnow: [
          'Udefra kommende lyde begynder at blive opfattet, i dämpet form, gennem fostervandet.',
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
      nb: {
        babyDescription:
          'Hørsel, følesans, svelging og sugerefleks fortsetter å utvikle seg. Babyen blir stadig mer aktiv, med flere bevegelser i armer og ben.',
        length: 'Omtrent 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: ['Magen er ofte tydelig synlig på dette stadiet, og tyngdepunktet ditt fortsetter å forskyves.'],
        toKnow: ['Morfologiultralyden, som undersøker babyens helhetlige utvikling, tilbys vanligvis mellom uke 18 og uke 21.'],
      },
      pl: {
        babyDescription:
          'Nadal rozwijają się słuch, dotyk, połykanie i odruch ssania. Dziecko jest coraz bardziej aktywne, z większą liczbą ruchów rąk i nóg.',
        length: 'Około 14,2 cm',
        comparison: 'Papryka',
        bodyChanges: ['Brzuch jest na tym etapie często wyraźnie widoczny, a Twój środek ciężkości nadal się przesuwa.'],
        toKnow: ['USG połówkowe, które ocenia ogólny rozwój dziecka, jest zazwyczaj oferowane między 18. a 21. tygodniem.'],
      },
      uk: {
        babyDescription:
          'Слух, дотик, ковтання та смоктальний рефлекс продовжують розвиватися. Дитина стає дедалі активнішою, з більшою кількістю рухів рук і ніг.',
        length: 'Приблизно 14,2 см',
        comparison: 'Болгарський перець',
        bodyChanges: ['Живіт на цьому етапі часто добре помітний, а ваш центр ваги продовжує зміщуватися.'],
        toKnow: ['УЗД анатомії плода, яке оцінює загальний розвиток дитини, зазвичай пропонують між 18-м і 21-м тижнем.'],
      },
      cs: {
        babyDescription:
          'Sluch, hmat, polykání a sací reflex se dál vyvíjejí. Miminko je stále aktivnější, s více pohyby paží a nohou.',
        length: 'Asi 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: ['Břicho je v této fázi často dobře viditelné a vaše těžiště se dál posouvá.'],
        toKnow: ['Morfologický ultrazvuk, který posuzuje celkový vývoj miminka, se obvykle nabízí mezi 18. a 21. týdnem.'],
      },
      sk: {
        babyDescription:
          'Sluch, dotyk, prehĺtanie a cicací reflex sa naďalej vyvíjajú. Bábätko je čoraz aktívnejšie, s väčším počtom pohybov rúk a nôh.',
        length: 'Približne 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: [
          'Brucho je v tejto fáze často zreteľne viditeľné a vaše ťažisko sa naďalej posúva.',
        ],
        toKnow: [
          'Morfologický ultrazvuk, ktorý vyšetruje celkový vývoj bábätka, sa zvyčajne ponúka medzi 18. a 21. týždňom.',
        ],
      },
      hu: {
        babyDescription:
          'A hallás, a tapintás, a nyelés és a szopóreflex tovább fejlődik. A baba egyre aktívabb, több kar- és lábmozgással.',
        length: 'Körülbelül 14,2 cm',
        comparison: 'Kaliforniai paprika',
        bodyChanges: [
          'A has ebben a szakaszban gyakran jól látható, és a súlypontod tovább tolódik.',
        ],
        toKnow: [
          'A baba általános fejlődését vizsgáló morfológiai ultrahangot általában a 18. és a 21. hét között ajánlják fel.',
        ],
      },
      ro: {
        babyDescription:
          'Auzul, simțul tactil, înghițitul și reflexul de supt continuă să se dezvolte. Bebelușul devine din ce în ce mai activ, cu mai multe mișcări ale brațelor și picioarelor.',
        length: 'Aproximativ 14,2 cm',
        comparison: 'Ardei gras',
        bodyChanges: [
          'Burta este adesea clar vizibilă în această etapă, iar centrul tău de greutate continuă să se deplaseze.',
        ],
        toKnow: [
          'Ecografia morfologică, care examinează dezvoltarea generală a bebelușului, este propusă în general între săptămâna 18 și săptămâna 21.',
        ],
      },
      bg: {
        babyDescription:
          'Слухът, докосването, преглъщането и рефлексът за смучене продължават да се развиват. Бебето става все по-активно, с повече движения на ръцете и краката.',
        length: 'Около 14,2 см',
        comparison: 'Чушка',
        bodyChanges: [
          'Коремът често е ясно видим на този етап, а центърът на тежестта ти продължава да се измества.',
        ],
        toKnow: [
          'Морфологичната ехография, която изследва цялостното развитие на бебето, обикновено се предлага между 18-ата и 21-ата седмица.',
        ],
      },
      sr: {
        babyDescription:
          'Слух, додир, гутање и рефлекс сисања настављају да се развијају. Беба постаје све активнија, са више покрета руку и ногу.',
        length: 'Око 14,2 цм',
        comparison: 'Паприка',
        bodyChanges: [
          'Стомак је у овој фази често јасно видљив, а твој центар тежине наставља да се помера.',
        ],
        toKnow: [
          'Морфолошки ултразвук, који прегледа опште развиће бебе, обично се нуди између 18. и 21. недеље.',
        ],
      },
      hr: {
        babyDescription:
          'Sluh, dodir, gutanje i refleks sisanja nastavljaju se razvijati. Beba postaje sve aktivnija, s više pokreta ruku i nogu.',
        length: 'Oko 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: [
          'Trbuh je u ovoj fazi često jasno vidljiv, a tvoje težište se i dalje pomiče.',
        ],
        toKnow: [
          'Morfološki ultrazvuk, koji pregledava opći razvoj bebe, obično se nudi između 18. i 21. tjedna.',
        ],
      },
      bs: {
        babyDescription:
          'Sluh, dodir, gutanje i refleks sisanja nastavljaju se razvijati. Beba postaje sve aktivnija, s više pokreta ruku i nogu.',
        length: 'Oko 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: [
          'Trbuh je u ovoj fazi često jasno vidljiv, a tvoje težište se i dalje pomiče.',
        ],
        toKnow: [
          'Morfološki ultrazvuk, koji pregledava opći razvoj bebe, obično se nudi između 18. i 21. sedmice.',
        ],
      },
      sl: {
        babyDescription:
          'Sluh, otip, požiranje in refleks sesanja se še naprej razvijajo. Dojenček postaja vse bolj aktiven, z več gibi rok in nog.',
        length: 'Približno 14,2 cm',
        comparison: 'Paprika',
        bodyChanges: [
          'Trebuh je v tej fazi pogosto jasno viden, tvoje težišče pa se še naprej premika.',
        ],
        toKnow: [
          'Morfološki ultrazvok, ki pregleda splošni razvoj dojenčka, se običajno ponudi med 18. in 21. tednom.',
        ],
      },
      ne: {
        babyDescription:
          'सुन्ने, छुने, निल्ने र चुस्ने रिफ्लेक्स विकसित हुँदै जान्छन्। शिशु झन्झन् सक्रिय हुँदै छ, हात र खुट्टाका बढी चालसहित।',
        length: 'करिब 14.2 सेमी',
        comparison: 'भेडे खुर्सानी',
        bodyChanges: [
          'यस चरणमा पेट प्रायः स्पष्ट देखिन्छ, र तपाईंको गुरुत्व केन्द्र सर्दै जान्छ।',
        ],
        toKnow: [
          'शिशुको समग्र विकास जाँच्ने आकारिकीय अल्ट्रासाउन्ड सामान्यतया हप्ता 18 र हप्ता 21 बीच प्रस्ताव गरिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'ශ්‍රවණය, ස්පර්ශය, ගිලීම සහ උරා බීමේ ප්‍රතීකාරය වර්ධනය වීම දිගටම කරගෙන යයි. දරුවා වැඩි වැඩියෙන් ක්‍රියාශීලී වෙමින්, වැඩි අත් සහ කකුල් චලනයන් සහිතව.',
        length: 'සෙ.මී. 14.2 පමණ',
        comparison: 'මෙක්සිකානු මිරිස් ගෙඩියක්',
        bodyChanges: [
          'බඩ මෙම අවධියේදී බොහෝ විට පැහැදිලිව දෘශ්‍යමාන වන අතර, ඔබේ ගුරුත්ව කේන්ද්‍රය දිගටම මාරු වේ.',
        ],
        toKnow: [
          'දරුවාගේ සමස්ත වර්ධනය පරීක්ෂා කරන ව්‍යුහ අල්ට්‍රාසවුන්ඩ් පරීක්ෂණය සාමාන්‍යයෙන් 18 වන සතිය සහ 21 වන සතිය අතර ඉදිරිපත් කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'การได้ยิน การสัมผัส การกลืน และปฏิกิริยาการดูดยังคงพัฒนาต่อไป ทารกกระฉับกระเฉงขึ้นเรื่อย ๆ โดยเคลื่อนไหวแขนขามากขึ้น',
        length: 'ประมาณ 14.2 ซม.',
        comparison: 'พริกหวาน',
        bodyChanges: [
          'หน้าท้องมักเห็นได้ชัดในระยะนี้ และจุดศูนย์ถ่วงของคุณยังคงเปลี่ยนไป',
        ],
        toKnow: [
          'อัลตราซาวนด์ดูโครงสร้างทารก ซึ่งตรวจพัฒนาการโดยรวมของทารก โดยทั่วไปนัดระหว่างสัปดาห์ที่ 18 ถึงสัปดาห์ที่ 21',
        ],
      },
      vi: {
        babyDescription:
          'Thính giác, xúc giác, nuốt và phản xạ mút tiếp tục phát triển. Em bé ngày càng hoạt động nhiều hơn, với nhiều cử động tay và chân hơn.',
        length: 'Khoảng 14,2 cm',
        comparison: 'Quả ớt chuông',
        bodyChanges: [
          'Bụng thường đã nhìn thấy rõ ở giai đoạn này, và trọng tâm cơ thể bạn tiếp tục thay đổi.',
        ],
        toKnow: [
          'Siêu âm hình thái, kiểm tra sự phát triển tổng thể của em bé, thường được đề xuất trong khoảng từ tuần 18 đến tuần 21.',
        ],
      },
      uz: {
        babyDescription:
          'Eshitish, tuyush, yutish va emish refleksi rivojlanishda davom etadi. Chaqaloq tobora faolroq boʻlib bormoqda, qoʻl va oyoq harakatlari koʻpaymoqda.',
        length: 'Taxminan 14,2 sm',
        comparison: 'Bolgar qalampiri',
        bodyChanges: [
          'Qorin bu bosqichda koʻpincha aniq koʻrinadi va ogʻirlik markazingiz siljishda davom etadi.',
        ],
        toKnow: [
          'Chaqaloqning umumiy rivojlanishini tekshiradigan morfologik UZI odatda 18-haftadan 21-haftagacha taklif qilinadi.',
        ],
      },
      az: {
        babyDescription:
          'Eşitmə, toxunma, udma və əmmə refleksi inkişaf etməyə davam edir. Körpə getdikcə daha aktiv olur, qol və ayaq hərəkətləri artır.',
        length: 'Təxminən 14,2 sm',
        comparison: 'Bolqar bibəri',
        bodyChanges: [
          'Qarın bu mərhələdə çox vaxt aydın görünür və ağırlıq mərkəziniz dəyişməkdə davam edir.',
        ],
        toKnow: [
          'Körpənin ümumi inkişafını yoxlayan anatomik ultrasəs adətən 18-ci ilə 21-ci həftələr arasında təklif olunur.',
        ],
      },
      ka: {
        babyDescription:
          'სმენა, შეხება, ყლაპვა და წოვის რეფლექსი კვლავ ვითარდება. ბავშვი სულ უფრო აქტიური ხდება, ხელებისა და ფეხების მეტი მოძრაობით.',
        length: 'დაახლოებით 14,2 სმ',
        comparison: 'ბულგარული წიწაკა',
        bodyChanges: [
          'მუცელი ამ ეტაპზე ხშირად მკაფიოდ ჩანს და თქვენი სიმძიმის ცენტრი კვლავ გადაინაცვლებს.',
        ],
        toKnow: [
          'ანატომიური ულტრაბგერა, რომელიც ბავშვის საერთო განვითარებას იკვლევს, ზოგადად მე-18 და 21-ე კვირებს შორის გვთავაზობენ.',
        ],
      },
      hy: {
        babyDescription:
          'Լսողությունը, հպումը, կուլ տալը և ծծելու ռեֆլեքսը շարունակում են զարգանալ: Երեխան դառնում է ավելի ու ավելի ակտիվ՝ ձեռքերի և ոտքերի ավելի շատ շարժումներով:',
        length: 'Մոտ 14,2 սմ',
        comparison: 'Բիբար',
        bodyChanges: [
          'Որովայնը այս փուլում հաճախ հստակ տեսանելի է, և ձեր ծանրության կենտրոնը շարունակում է տեղաշարժվել:',
        ],
        toKnow: [
          'Մորֆոլոգիական ուլտրաձայնային հետազոտությունը, որը ուսումնասիրում է երեխայի ընդհանուր զարգացումը, սովորաբար առաջարկվում է 18-ից 21-րդ շաբաթների միջև:',
        ],
      },
      tg: {
        babyDescription:
          'Шунавоӣ, ламс, фурӯбарӣ ва рефлекси мукидан инкишоф ёфтанро идома медиҳанд. Тифл торафт фаъолтар мешавад, бо ҳаракатҳои бештари дастҳо ва пойҳо.',
        length: 'Тақрибан 14,2 см',
        comparison: 'Қаламфури булғорӣ',
        bodyChanges: [
          'Шикам дар ин марҳила аксар вақт ба таври возеҳ намоён аст ва маркази вазнинии шумо ҷойивазкуниро идома медиҳад.',
        ],
        toKnow: [
          'Ултрасадои анатомӣ, ки инкишофи умумии тифлро муоина мекунад, одатан байни ҳафтаи 18 ва ҳафтаи 21 пешниҳод мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Угуу, сезүү, жутуу жана эмүү рефлекси өнүгүүнү улантат. Ымыркай барган сайын активдүү болуп, кол жана буттарын көбүрөөк кыймылдатат.',
        length: 'Болжол менен 14,2 см',
        comparison: 'Болгар калемпири',
        bodyChanges: [
          'Курсак бул этапта көбүнчө даана көрүнөт жана оордук борборуңуз жылууну улантат.',
        ],
        toKnow: [
          'Ымыркайдын жалпы өнүгүшүн текшерген анатомиялык УЗИ адатта 18-жума менен 21-жуманын ортосунда сунушталат.',
        ],
      },
      tk: {
        babyDescription:
          'Eşitmek, degmek, ýuwtmak we emmek refleksi ösmegini dowam etdirýär. Bäbek barha işjeň bolýar, el-aýak hereketleri köpelýär.',
        length: 'Takmynan 14,2 sm',
        comparison: 'Bolgar burçy',
        bodyChanges: [
          'Garyn bu tapgyrda köplenç aýdyň görünýär we agramyň merkezi süýşmegini dowam etdirýär.',
        ],
        toKnow: [
          'Bäbegiň umumy ösüşini barlaýan anatomiýa UZI-si adatça 18-nji bilen 21-nji hepdäniň arasynda teklip edilýär.',
        ],
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
      da: {
        babyDescription: 'Hørelse, berøring, synkning og sugerefleks fortsætter med at udvikle sig. Babyen bliver mere og mere aktiv med flere arm- og benbevægelser.',
        length: 'Ca. 14,2 cm',
        comparison: 'Peberfrugt',
        bodyChanges: [
          'Maven er ofte tydeligt synlig på dette stadie, og dit tyngdepunkt forskydes fortsat.',
        ],
        toKnow: [
          'Anatomiultralyd, som undersøger babyens samlede udvikling, tilbydes generelt mellem uge 18 og uge 21.',
        ],
      },
      sv: {
        babyDescription: 'Hörelse, beröring, synkning och sugerefleks fortsätter med at udvikle sig. Babyen bliver mere och mere aktiv med flere arm- och benbevägelser.',
        length: 'Ca. 14,2 cm',
        comparison: 'Peberfrugt',
        bodyChanges: [
          'Maven ar ofte tydeligt synlig på dette stadie, och dit tyngdepunkt forskydes fortsat.',
        ],
        toKnow: [
          'Anatomiultralyd, som undersöger babyens samlede udvikling, tilbydes generelt mellem vecka 18 och vecka 21.',
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
      nb: {
        babyDescription:
          'De fremtidige permanente tennene begynner å dannes bak melketennene som forberedes, og babyen fortsetter å legge gradvis på seg.',
        length: 'Omtrent 15,3 cm',
        comparison: 'Stor tomat',
        bodyChanges: ['En trekkende fornemmelse på sidene av magen (smerte i runde leddbånd) kan forekomme når livmoren vokser.'],
        toKnow: ['Dette er et vanlig tidspunkt for å begynne å kjenne babyens bevegelser tydeligere.'],
      },
      pl: {
        babyDescription:
          'Za zawiązkami zębów mlecznych zaczynają się kształtować przyszłe zęby stałe, a dziecko nadal stopniowo przybiera na wadze.',
        length: 'Około 15,3 cm',
        comparison: 'Duży pomidor',
        bodyChanges: ['W miarę wzrostu macicy może wystąpić uczucie ciągnięcia po bokach brzucha (ból więzadeł obłych).'],
        toKnow: ['To częsty moment, w którym zaczyna się wyraźniej czuć ruchy dziecka.'],
      },
      uk: {
        babyDescription:
          'За зачатками молочних зубів починають формуватися майбутні постійні зуби, а дитина продовжує поступово набирати вагу.',
        length: 'Приблизно 15,3 см',
        comparison: 'Великий помідор',
        bodyChanges: ['У міру росту матки може виникати відчуття тягнення по боках живота (біль круглих зв’язок).'],
        toKnow: ['Це частий момент, коли рухи дитини починають відчуватися виразніше.'],
      },
      cs: {
        babyDescription:
          'Za základy dočasných zoubků se začínají tvořit budoucí stálé zuby a miminko dál postupně přibírá na váze.',
        length: 'Asi 15,3 cm',
        comparison: 'Velké rajče',
        bodyChanges: ['Jak děloha roste, může se objevit pocit tahání po stranách břicha (bolest kulatých vazů).'],
        toKnow: ['Je to častá doba, kdy se pohyby miminka začínají cítit zřetelněji.'],
      },
      sk: {
        babyDescription:
          'Budúce trvalé zuby sa začínajú tvoriť za mliečnymi zubami, ktoré sa pripravujú, a bábätko naďalej postupne priberá.',
        length: 'Približne 15,3 cm',
        comparison: 'Veľké rajčiatko',
        bodyChanges: [
          'S rastom maternice sa môže objaviť ťahavý pocit po bokoch brucha (bolesť okrúhlych väzov).',
        ],
        toKnow: [
          'Je to bežný čas, keď sa začínajú výraznejšie pociťovať pohyby bábätka.',
        ],
      },
      hu: {
        babyDescription:
          'A leendő maradó fogak kezdenek kialakulni a készülő tejfogak mögött, és a baba tovább fokozatosan hízik.',
        length: 'Körülbelül 15,3 cm',
        comparison: 'Nagy paradicsom',
        bodyChanges: [
          'A méh növekedésével húzó érzés léphet fel a has oldalain (kerek szalag fájdalom).',
        ],
        toKnow: [
          'Ez egy gyakori időpont, amikor a baba mozgásait határozottabban kezded érezni.',
        ],
      },
      ro: {
        babyDescription:
          'Viitorii dinți permanenți încep să se formeze în spatele dinților de lapte care se pregătesc, iar bebelușul continuă să se îngrașe treptat.',
        length: 'Aproximativ 15,3 cm',
        comparison: 'Roșie mare',
        bodyChanges: [
          'O senzație de tragere pe părțile laterale ale burții (durerea ligamentului rotund) poate apărea pe măsură ce uterul crește.',
        ],
        toKnow: [
          'Acesta este un moment frecvent în care începi să simți mișcările bebelușului mai distinct.',
        ],
      },
      bg: {
        babyDescription:
          'Бъдещите постоянни зъби започват да се формират зад подготвяните млечни зъби, а бебето продължава постепенно да наддава.',
        length: 'Около 15,3 см',
        comparison: 'Голям домат',
        bodyChanges: [
          'Може да се появи усещане за опъване по страните на корема (болка в кръглите връзки), докато матката расте.',
        ],
        toKnow: [
          'Това е често срещан момент, в който започваш да усещаш движенията на бебето по-отчетливо.',
        ],
      },
      sr: {
        babyDescription:
          'Будући стални зуби почињу да се формирају иза млечних зуба који се припремају, а беба наставља постепено да добија на тежини.',
        length: 'Око 15,3 цм',
        comparison: 'Велики парадајз',
        bodyChanges: [
          'Може се јавити осећај затезања са страна стомака (бол у кружним везама) како материца расте.',
        ],
        toKnow: [
          'Ово је уобичајено време када почињеш да осећаш покрете бебе одређеније.',
        ],
      },
      hr: {
        babyDescription:
          'Budući trajni zubi počinju se oblikovati iza mliječnih zubi koji se pripremaju, a beba se nastavlja postupno debljati.',
        length: 'Oko 15,3 cm',
        comparison: 'Velika rajčica',
        bodyChanges: [
          'Može se javiti osjećaj zatezanja sa strana trbuha (bol u okruglim ligamentima) kako maternica raste.',
        ],
        toKnow: [
          'Ovo je uobičajeno vrijeme kada počinješ određenije osjećati bebine pokrete.',
        ],
      },
      bs: {
        babyDescription:
          'Budući trajni zubi počinju se oblikovati iza mliječnih zubi koji se pripremaju, a beba se nastavlja postupno debljati.',
        length: 'Oko 15,3 cm',
        comparison: 'Veliki paradajz',
        bodyChanges: [
          'Može se javiti osjećaj zatezanja sa strana trbuha (bol u okruglim ligamentima) kako maternica raste.',
        ],
        toKnow: [
          'Ovo je uobičajeno vrijeme kada počinješ određenije osjećati bebine pokrete.',
        ],
      },
      sl: {
        babyDescription:
          'Bodoči stalni zobje se začnejo oblikovati za mlečnimi zobmi, ki se pripravljajo, dojenček pa se še naprej postopoma redi.',
        length: 'Približno 15,3 cm',
        comparison: 'Velik paradižnik',
        bodyChanges: [
          'Lahko se pojavi občutek napetosti ob straneh trebuha (bolečina v okroglih ligamentih), ko maternica raste.',
        ],
        toKnow: [
          'To je običajen čas, ko začneš določneje čutiti dojenčkove gibe.',
        ],
      },
      ne: {
        babyDescription:
          'भविष्यका स्थायी दाँतहरू तयार हुँदै गरेका दूधे दाँतहरूको पछाडि बन्न थाल्छन्, र शिशुको तौल बिस्तारै बढिरहन्छ।',
        length: 'करिब 15.3 सेमी',
        comparison: 'ठूलो गोलभेँडा',
        bodyChanges: [
          'गर्भाशय बढ्दा पेटका छेउमा तानिने अनुभूति (राउन्ड लिगामेन्ट दुखाइ) हुन सक्छ।',
        ],
        toKnow: [
          'शिशुका चालहरू बढी स्पष्ट रूपमा महसुस गर्न थाल्ने यो सामान्य समय हो।',
        ],
      },
      si: {
        babyDescription:
          'සූදානම් කෙරෙන කිරි දත් පිටුපස අනාගත ස්ථිර දත් සෑදීමට පටන් ගන්නා අතර, දරුවා ක්‍රමයෙන් බර ලබා ගැනීම දිගටම කරගෙන යයි.',
        length: 'සෙ.මී. 15.3 පමණ',
        comparison: 'විශාල තක්කාලි ගෙඩියක්',
        bodyChanges: [
          'ගර්භාෂය වර්ධනය වන විට බඩේ දෙපස ඇදීමේ හැඟීමක් (වෘත්තාකාර බන්ධනී වේදනාව) ඇතිවිය හැක.',
        ],
        toKnow: [
          'දරුවාගේ චලනයන් වඩා පැහැදිලිව දැනීමට පටන් ගැනීමට මෙය පොදු කාලයකි.',
        ],
      },
      th: {
        babyDescription:
          'ฟันแท้ในอนาคตเริ่มก่อตัวหลังฟันน้ำนมที่กำลังเตรียมไว้ และทารกยังคงน้ำหนักขึ้นทีละน้อย',
        length: 'ประมาณ 15.3 ซม.',
        comparison: 'มะเขือเทศลูกใหญ่',
        bodyChanges: [
          'อาจรู้สึกตึงที่สองข้างของหน้าท้อง (ปวดเอ็นยึดมดลูก) เมื่อมดลูกขยายใหญ่ขึ้น',
        ],
        toKnow: [
          'นี่เป็นช่วงที่พบบ่อยที่คุณเริ่มรู้สึกถึงการเคลื่อนไหวของทารกได้ชัดเจนขึ้น',
        ],
      },
      vi: {
        babyDescription:
          'Răng vĩnh viễn trong tương lai bắt đầu hình thành phía sau những chiếc răng sữa đang được chuẩn bị, và em bé tiếp tục tăng cân dần dần.',
        length: 'Khoảng 15,3 cm',
        comparison: 'Quả cà chua lớn',
        bodyChanges: [
          'Có thể xuất hiện cảm giác căng kéo ở hai bên bụng (đau dây chằng tròn) khi tử cung lớn lên.',
        ],
        toKnow: [
          'Đây là thời điểm thường thấy bạn bắt đầu cảm nhận rõ hơn các cử động của em bé.',
        ],
      },
      uz: {
        babyDescription:
          'Kelajakdagi doimiy tishlar tayyorlanayotgan sut tishlari orqasida shakllana boshlaydi va chaqaloq asta-sekin vazn olishda davom etadi.',
        length: 'Taxminan 15,3 sm',
        comparison: 'Katta pomidor',
        bodyChanges: [
          'Bachadon oʻsishi bilan qorinning yon tomonlarida tortishish hissi (dumaloq boylam ogʻrigʻi) paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Bu chaqaloq harakatlarini aniqroq sezishni boshlash uchun keng tarqalgan vaqt.',
        ],
      },
      az: {
        babyDescription:
          'Gələcək daimi dişlər hazırlanan süd dişlərinin arxasında formalaşmağa başlayır və körpə tədricən çəki yığmağa davam edir.',
        length: 'Təxminən 15,3 sm',
        comparison: 'İri pomidor',
        bodyChanges: [
          'Uşaqlıq böyüdükcə qarının yanlarında dartılma hissi (yuvarlaq bağ ağrısı) ola bilər.',
        ],
        toKnow: [
          'Bu, körpənin hərəkətlərini daha aydın hiss etməyə başlamaq üçün adi vaxtdır.',
        ],
      },
      ka: {
        babyDescription:
          'მომავალი მუდმივი კბილები ყალიბდება მზადების პროცესში მყოფი რძის კბილების უკან და ბავშვი ეტაპობრივად აგრძელებს წონაში მატებას.',
        length: 'დაახლოებით 15,3 სმ',
        comparison: 'დიდი პომიდორი',
        bodyChanges: [
          'მუცლის გვერდებზე გაწევის შეგრძნება (მრგვალი იოგის ტკივილი) შეიძლება მოხდეს, რადგან საშვილოსნო იზრდება.',
        ],
        toKnow: [
          'ეს გავრცელებული დროა, როცა ბავშვის მოძრაობების უფრო მკაფიოდ გრძნობა იწყება.',
        ],
      },
      hy: {
        babyDescription:
          'Ապագա մշտական ատամները սկսում են ձևավորվել պատրաստվող կաթնատամների ետևում, և երեխան շարունակում է աստիճանաբար քաշ հավաքել:',
        length: 'Մոտ 15,3 սմ',
        comparison: 'Խոշոր լոլիկ',
        bodyChanges: [
          'Որովայնի կողքերին ձգվածության զգացում (կլոր կապանի ցավ) կարող է առաջանալ, երբ արգանդը մեծանում է:',
        ],
        toKnow: [
          'Սա տարածված ժամանակ է՝ երեխայի շարժումներն ավելի հստակ զգալու սկսելու համար:',
        ],
      },
      tg: {
        babyDescription:
          'Дандонҳои доимии оянда дар паси дандонҳои шир, ки омода мешаванд, ташаккул ёфтан мегиранд ва тифл тадриҷан вазн гирифтанро идома медиҳад.',
        length: 'Тақрибан 15,3 см',
        comparison: 'Помидори калон',
        bodyChanges: [
          'Эҳсоси кашиш дар паҳлуҳои шикам (дарди пайвандҳои мудаввар) метавонад ҳангоми калон шудани бачадон рух диҳад.',
        ],
        toKnow: [
          'Ин вақти маъмул барои оғози ҳис кардани ҳаракатҳои тифл ба таври возеҳтар аст.',
        ],
      },
      ky: {
        babyDescription:
          'Келечектеги туруктуу тиштер даярдалып жаткан сүт тиштеринин артында түзүлө баштайт, ал эми ымыркай акырындап салмак алууну улантат.',
        length: 'Болжол менен 15,3 см',
        comparison: 'Чоң помидор',
        bodyChanges: [
          'Жатын өскөн сайын курсактын капталдарында тартылуу сезими (тегерек байламта оорусу) болушу мүмкүн.',
        ],
        toKnow: [
          'Бул ымыркайдын кыймылдарын даанараак сезе баштоонун кеңири таралган убактысы.',
        ],
      },
      tk: {
        babyDescription:
          'Geljekki hemişelik dişler taýýarlanýan süýt dişleriniň arkasynda emele gelip başlaýar we bäbek ýuwaş-ýuwaşdan agram goşmagyny dowam etdirýär.',
        length: 'Takmynan 15,3 sm',
        comparison: 'Uly pomidor',
        bodyChanges: [
          'Ýatgy ösýärkä garnyň gapdallarynda çekiş duýgusy (tegelek baglaryň agyrysy) bolup biler.',
        ],
        toKnow: [
          'Bu bäbegiň hereketlerini has aýdyň duýup başlamagyň umumy wagty.',
        ],
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
      da: {
        babyDescription: 'De fremtidige permanente tænder begynder at dannes bag de mælketænder, der forberedes, og babyen fortsætter gradvist med at tage på i vægt.',
        length: 'Ca. 15,3 cm',
        comparison: 'Stor tomat',
        bodyChanges: [
          'En trækken på siderne af maven (rundligamentsmerte) kan opstå, efterhånden som livmoderen vokser.',
        ],
        toKnow: [
          'Dette er et almindeligt tidspunkt at begynde at mærke babyens bevægelser mere tydeligt.',
        ],
      },
      sv: {
        babyDescription: 'De fremtidige permanente tänder begynder at dannes bag de mälketänder, der forberedes, och babyen fortsätter gradvist med at tage på i vägt.',
        length: 'Ca. 15,3 cm',
        comparison: 'Stor tomat',
        bodyChanges: [
          'En träkken på siderne av maven (rundligamentsmerte) kan opstå, efterhånden som livmoderen vokser.',
        ],
        toKnow: [
          'Dette ar et almindeligt tidspunkt at begynde at märke babyens bevägelser mere tydeligt.',
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
      nb: {
        babyDescription:
          'Fra denne uken måles lengden fra hode til hæl i stedet for fra hode til rumpe, siden bena nå kan strekkes ut og måles – dette forklarer et synlig hopp i referansestørrelsen sammenlignet med de foregående ukene.',
        length: 'Omtrent 25,6 cm',
        comparison: 'Banan',
        bodyChanges: ['Den fint rundede magen din kan begynne å påvirke balansen og holdningen din.'],
        toKnow: ['Midtpunktet av svangerskapet markeres ofte med en fullstendig kontroll hos helsepersonellet som følger deg opp.'],
      },
      pl: {
        babyDescription:
          'Od tego tygodnia długość mierzy się od głowy do pięty, a nie od głowy do pośladków, ponieważ nogi mogą być już wyprostowane i zmierzone — to tłumaczy widoczny skok wielkości odniesienia w porównaniu z poprzednimi tygodniami.',
        length: 'Około 25,6 cm',
        comparison: 'Banan',
        bodyChanges: ['Twój ładnie zaokrąglony brzuch może zacząć wpływać na równowagę i postawę.'],
        toKnow: ['Połowa ciąży jest często oznaczana pełną kontrolą u specjalisty prowadzącego Twoją opiekę.'],
      },
      uk: {
        babyDescription:
          'Від цього тижня довжину вимірюють від голови до п’яти, а не від голови до сідниць, оскільки ноги вже можуть бути випрямлені й виміряні — це пояснює помітний стрибок орієнтовного розміру порівняно з попередніми тижнями.',
        length: 'Приблизно 25,6 см',
        comparison: 'Банан',
        bodyChanges: ['Ваш гарно округлений живіт може почати впливати на рівновагу й поставу.'],
        toKnow: ['Середину вагітності часто відзначають повним оглядом у медичного фахівця, який веде ваш догляд.'],
      },
      cs: {
        babyDescription:
          'Od tohoto týdne se délka měří od hlavy k patě, nikoli od hlavy k zadečku, protože nohy lze nyní natáhnout a změřit — to vysvětluje viditelný skok referenční velikosti oproti předchozím týdnům.',
        length: 'Asi 25,6 cm',
        comparison: 'Banán',
        bodyChanges: ['Vaše hezky zakulacené břicho může začít ovlivňovat rovnováhu a držení těla.'],
        toKnow: ['Polovina těhotenství bývá často označena úplnou kontrolou u zdravotnického pracovníka, který vás sleduje.'],
      },
      sk: {
        babyDescription:
          'Od tohto týždňa sa dĺžka meria od hlavy po pätu, nie od hlavy po zadoček, pretože nohy sa už dajú natiahnuť a zmerať — to vysvetľuje viditeľný skok referenčnej veľkosti oproti predchádzajúcim týždňom.',
        length: 'Približne 25,6 cm',
        comparison: 'Banán',
        bodyChanges: [
          'Vaše pekne zaoblené brucho môže začať ovplyvňovať vašu rovnováhu a držanie tela.',
        ],
        toKnow: [
          'Polovicu tehotenstva často sprevádza kompletná kontrola u zdravotníckeho pracovníka, ktorý sleduje vašu starostlivosť.',
        ],
      },
      hu: {
        babyDescription:
          'Ettől a héttől kezdve a hosszt a fejtetőtől a sarokig mérik, nem a fejtetőtől a fenékig, mivel a lábak már kinyújthatók és mérhetők — ez megmagyarázza a referenciaméret látható ugrását az előző hetekhez képest.',
        length: 'Körülbelül 25,6 cm',
        comparison: 'Banán',
        bodyChanges: [
          'A szépen lekerekedett hasad kezdheti befolyásolni az egyensúlyodat és a testtartásodat.',
        ],
        toKnow: [
          'A terhesség felét gyakran teljes ellenőrzés jelzi a gondozásodat követő egészségügyi szakembernél.',
        ],
      },
      ro: {
        babyDescription:
          'Începând cu această săptămână, lungimea se măsoară de la cap la călcâi, nu de la cap la fese, deoarece picioarele pot fi acum întinse și măsurate — aceasta explică un salt vizibil al mărimii de referință față de săptămânile precedente.',
        length: 'Aproximativ 25,6 cm',
        comparison: 'Banană',
        bodyChanges: [
          'Burta ta frumos rotunjită poate începe să îți afecteze echilibrul și postura.',
        ],
        toKnow: [
          'Jumătatea sarcinii este adesea marcată de un control complet la profesionistul din domeniul sănătății care îți urmărește sarcina.',
        ],
      },
      bg: {
        babyDescription:
          'От тази седмица нататък дължината се измерва от главата до петата, а не от главата до седалището, тъй като краката вече могат да се разгънат и измерят — това обяснява видимия скок в референтния размер спрямо предишните седмици.',
        length: 'Около 25,6 см',
        comparison: 'Банан',
        bodyChanges: [
          'Хубаво закръгленият ти корем може да започне да влияе на равновесието и стойката ти.',
        ],
        toKnow: [
          'Средата на бременността често се отбелязва с пълен преглед при здравния специалист, който те проследява.',
        ],
      },
      sr: {
        babyDescription:
          'Од ове недеље дужина се мери од главе до пете, а не од главе до седалишта, јер се ноге сада могу испружити и измерити — ово објашњава видљив скок референтне величине у односу на претходне недеље.',
        length: 'Око 25,6 цм',
        comparison: 'Банана',
        bodyChanges: [
          'Твој лепо заобљени стомак може почети да утиче на равнотежу и држање тела.',
        ],
        toKnow: [
          'Средина трудноће често се обележава потпуним прегледом код здравственог радника који те прати.',
        ],
      },
      hr: {
        babyDescription:
          'Od ovog tjedna duljina se mjeri od tjemena do pete, a ne od tjemena do sjedne kosti, jer se noge sada mogu ispružiti i izmjeriti — to objašnjava vidljiv skok referentne veličine u odnosu na prethodne tjedne.',
        length: 'Oko 25,6 cm',
        comparison: 'Banana',
        bodyChanges: [
          'Tvoj lijepo zaobljen trbuh može početi utjecati na ravnotežu i držanje tijela.',
        ],
        toKnow: [
          'Sredina trudnoće često se obilježava potpunim pregledom kod zdravstvenog djelatnika koji te prati.',
        ],
      },
      bs: {
        babyDescription:
          'Od ove sedmice duljina se mjeri od tjemena do pete, a ne od tjemena do sjedne kosti, jer se noge sada mogu ispružiti i izmjeriti — to objašnjava vidljiv skok referentne veličine u odnosu na prethodne sedmice.',
        length: 'Oko 25,6 cm',
        comparison: 'Banana',
        bodyChanges: [
          'Tvoj lijepo zaobljen trbuh može početi utjecati na ravnotežu i držanje tijela.',
        ],
        toKnow: [
          'Sredina trudnoće često se obilježava potpunim pregledom kod zdravstvenog radnika koji te prati.',
        ],
      },
      sl: {
        babyDescription:
          'Od tega tedna se dolžina meri od temena do pete, ne od temena do trtice, ker se noge zdaj lahko iztegnejo in izmerijo — to pojasnjuje vidni skok referenčne velikosti glede na prejšnje tedne.',
        length: 'Približno 25,6 cm',
        comparison: 'Banana',
        bodyChanges: [
          'Tvoj lepo zaobljen trebuh lahko začne vplivati na ravnotežje in telesno držo.',
        ],
        toKnow: [
          'Sredina nosečnosti se pogosto zaznamuje s popolnim pregledom pri zdravstvenem delavcu, ki te spremlja.',
        ],
      },
      ne: {
        babyDescription:
          'यो हप्तादेखि, लम्बाइ टाउकोदेखि तल्लो भागसम्म होइन, टाउकोदेखि कुर्कुच्चासम्म नापिन्छ, किनभने खुट्टाहरू अब तन्काएर नाप्न सकिन्छ — यसले अघिल्ला हप्ताहरूको तुलनामा सन्दर्भ आकारमा देखिने उछाल व्याख्या गर्छ।',
        length: 'करिब 25.6 सेमी',
        comparison: 'केरा',
        bodyChanges: [
          'तपाईंको राम्ररी गोलो भएको पेटले तपाईंको सन्तुलन र आसनलाई असर गर्न थाल्न सक्छ।',
        ],
        toKnow: [
          'गर्भावस्थाको मध्यबिन्दु प्रायः तपाईंको हेरचाह गर्ने स्वास्थ्यकर्मीसँगको पूर्ण जाँचद्वारा चिह्नित हुन्छ।',
        ],
      },
      si: {
        babyDescription:
          'මෙම සතියේ සිට, දිග මනින්නේ හිස සිට ආසනය දක්වා නොව හිස සිට විළුඹ දක්වා වේ, මන්ද කකුල් දැන් දිගු කර මැනිය හැකි බැවින් — මෙයින් පෙර සතිවලට සාපේක්ෂව යොමු ප්‍රමාණයේ දෘශ්‍යමාන පිම්මක් පැහැදිලි කෙරේ.',
        length: 'සෙ.මී. 25.6 පමණ',
        comparison: 'කෙසෙල් ගෙඩියක්',
        bodyChanges: [
          'ඔබේ ලස්සනට වටකුරු බඩ ඔබේ සමතුලිතතාවයට සහ ඉරියව්වට බලපෑමට පටන් ගත හැක.',
        ],
        toKnow: [
          'ගර්භණී කාලයේ මැද ලක්ෂ්‍යය බොහෝ විට ඔබේ සත්කාර අනුගමනය කරන සෞඛ්‍ය වෘත්තිකයා සමඟ සම්පූර්ණ පරීක්ෂාවකින් සලකුණු කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ตั้งแต่สัปดาห์นี้เป็นต้นไป วัดความยาวจากศีรษะถึงส้นเท้า แทนที่จะวัดจากศีรษะถึงก้น เพราะตอนนี้ขาเหยียดและวัดได้ — ซึ่งอธิบายว่าทำไมขนาดอ้างอิงจึงกระโดดขึ้นอย่างเห็นได้ชัดเมื่อเทียบกับสัปดาห์ก่อนหน้า',
        length: 'ประมาณ 25.6 ซม.',
        comparison: 'กล้วย',
        bodyChanges: [
          'หน้าท้องที่โค้งมนสวยงามของคุณอาจเริ่มส่งผลต่อการทรงตัวและท่าทาง',
        ],
        toKnow: [
          'จุดกึ่งกลางของการตั้งครรภ์มักมีการตรวจร่างกายครบถ้วนกับบุคลากรทางการแพทย์ที่ดูแลคุณ',
        ],
      },
      vi: {
        babyDescription:
          'Từ tuần này trở đi, chiều dài được đo từ đầu đến gót chân thay vì từ đầu đến mông, vì chân giờ đây có thể duỗi ra và đo được — điều này giải thích sự tăng vọt rõ rệt của kích thước tham chiếu so với những tuần trước.',
        length: 'Khoảng 25,6 cm',
        comparison: 'Quả chuối',
        bodyChanges: [
          'Chiếc bụng tròn xinh của bạn có thể bắt đầu ảnh hưởng đến thăng bằng và tư thế.',
        ],
        toKnow: [
          'Điểm giữa của thai kỳ thường được đánh dấu bằng một lần kiểm tra toàn diện với nhân viên y tế đang theo dõi bạn.',
        ],
      },
      uz: {
        babyDescription:
          'Shu haftadan boshlab uzunlik bosh va dumbadan emas, bosh va tovondan oʻlchanadi, chunki endi oyoqlarni choʻzib oʻlchash mumkin — bu avvalgi haftalarga nisbatan tayanch oʻlchamdagi koʻrinadigan sakrashni tushuntiradi.',
        length: 'Taxminan 25,6 sm',
        comparison: 'Banan',
        bodyChanges: [
          'Chiroyli yumaloq qorningiz muvozanat va qomatingizga taʼsir qila boshlashi mumkin.',
        ],
        toKnow: [
          'Homiladorlikning oʻrtasi koʻpincha parvarishingizni olib boruvchi sogʻliqni saqlash mutaxassisi bilan toʻliq tekshiruv bilan nishonlanadi.',
        ],
      },
      az: {
        babyDescription:
          'Bu həftədən etibarən uzunluq baş-oturacaq əvəzinə baş-dabana qədər ölçülür, çünki ayaqlar artıq uzadıla və ölçülə bilər — bu, əvvəlki həftələrlə müqayisədə istinad ölçüsündə görünən sıçrayışı izah edir.',
        length: 'Təxminən 25,6 sm',
        comparison: 'Banan',
        bodyChanges: [
          'Gözəl yumrulanmış qarnınız tarazlığınıza və duruşunuza təsir etməyə başlaya bilər.',
        ],
        toKnow: [
          'Hamiləliyin ortası çox vaxt qayğınıza nəzarət edən tibb işçisi ilə tam yoxlama ilə qeyd olunur.',
        ],
      },
      ka: {
        babyDescription:
          'ამ კვირიდან სიგრძე თავიდან ქუსლამდე იზომება და არა თავიდან დუნდულებამდე, რადგან ფეხები უკვე შეიძლება გაიშალოს და იზომოს — ეს ხსნის წინა კვირებთან შედარებით საორიენტაციო ზომის თვალსაჩინო ნახტომს.',
        length: 'დაახლოებით 25,6 სმ',
        comparison: 'ბანანი',
        bodyChanges: [
          'თქვენი ლამაზად მომრგვალებული მუცელი შეიძლება თქვენს წონასწორობასა და ტანადობაზე იწყებდეს გავლენას.',
        ],
        toKnow: [
          'ორსულობის შუა წერტილი ხშირად აღინიშნება თქვენს მეთვალყურე ჯანდაცვის სპეციალისტთან სრული შემოწმებით.',
        ],
      },
      hy: {
        babyDescription:
          'Այս շաբաթից սկսած՝ երկարությունը չափվում է գլխից մինչև գարշապարը, այլ ոչ թե գլխից մինչև հետույք, քանի որ ոտքերն այժմ կարող են ուղղվել և չափվել. սա բացատրում է հղման չափի տեսանելի թռիչքը նախորդ շաբաթների համեմատ:',
        length: 'Մոտ 25,6 սմ',
        comparison: 'Բանան',
        bodyChanges: [
          'Ձեր գեղեցիկ կլորացած որովայնը կարող է սկսել ազդել ձեր հավասարակշռության և կեցվածքի վրա:',
        ],
        toKnow: [
          'Հղիության կեսը հաճախ նշվում է ձեր խնամքը վարող առողջապահության մասնագետի մոտ ամբողջական հետազոտությամբ:',
        ],
      },
      tg: {
        babyDescription:
          'Аз ҳамин ҳафта дарозӣ аз сар то пошна андоза карда мешавад, на аз сар то нишастгоҳ, зеро пойҳо акнун метавонанд дароз карда шаванд ва андоза шаванд — ин ҷаҳиши намоёни андозаи истинодиро нисбат ба ҳафтаҳои пештара шарҳ медиҳад.',
        length: 'Тақрибан 25,6 см',
        comparison: 'Банан',
        bodyChanges: [
          'Шиками хуб мудаввари шумо метавонад ба мувозинат ва вазъияти бадани шумо таъсир расонад.',
        ],
        toKnow: [
          'Нимаи ҳомиладорӣ аксар вақт бо муоинаи пурраи мутахассиси соҳаи тибе, ки нигоҳубини шуморо пайгирӣ мекунад, қайд карда мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Бул жумадан баштап узундук баштан куймулчакка эмес, баштан согончокко чейин өлчөнөт, анткени буттарды эми түздөп өлчөөгө болот — бул мурунку жумаларга салыштырмалуу шилтеме өлчөмүндөгү көрүнүүчү секирикти түшүндүрөт.',
        length: 'Болжол менен 25,6 см',
        comparison: 'Банан',
        bodyChanges: [
          'Жакшы тегеректелген курсагыңыз тең салмактуулугуңузга жана абалыңызга таасир эте баштайт.',
        ],
        toKnow: [
          'Курсактуулуктун ортосу көбүнчө сизге кам көрүп жаткан ден соолук сактоо адиси менен толук текшерүү менен белгиленет.',
        ],
      },
      tk: {
        babyDescription:
          'Şu hepdeden başlap uzynlyk kelleden aşaklyga däl-de, kelleden tapana çenli ölçelýär, sebäbi aýaklary indi uzadyp ölçemek mümkin — bu öňki hepdeler bilen deňeşdirilende salgylanma ölçegindäki aýdyň böküşi düşündirýär.',
        length: 'Takmynan 25,6 sm',
        comparison: 'Banan',
        bodyChanges: [
          'Owadan tegelek garnyňyz deňagramlylygyňyza we dury duruşyňyza täsir edip başlap biler.',
        ],
        toKnow: [
          'Göwreliligiň ortasy köplenç idegiňize eýerýän saglyk hünärmeni bilen doly barlag bilen bellenilýär.',
        ],
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
      da: {
        babyDescription: 'Fra denne uge måles længden fra hoved til hæl i stedet for hoved til sæde, da benene nu kan strækkes ud og måles – det forklarer et synligt spring i referencemålet sammenlignet med tidligere uger.',
        length: 'Ca. 25,6 cm',
        comparison: 'Banan',
        bodyChanges: [
          'Din smukt rundede mave kan begynde at påvirke din balance og holdning.',
        ],
        toKnow: [
          'Midten af graviditeten er ofte markeret af en grundig konsultation hos den sundhedsprofessionel, der følger dit forløb.',
        ],
      },
      sv: {
        babyDescription: 'Fra denne vecka måles längden fran hoved till häl i stedet for hoved till säde, da benene nu kan sträkkes ud och måles – det forklarer et synligt spring i referencemålet sammenlignet med tidligere veckor.',
        length: 'Ca. 25,6 cm',
        comparison: 'Banan',
        bodyChanges: [
          'Din smukt rundede mave kan begynde at påvirke din balance och holdning.',
        ],
        toKnow: [
          'Midten av graviditeten ar ofte markeret av en grundig konsultation hos den sundhedsprofessionel, der fölger dit forlöb.',
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
      nb: {
        babyDescription: 'Bevegelsene blir tydeligere og mer koordinerte, og det er vanlig å begynne å kjenne dem tydelig i denne perioden.',
        length: 'Omtrent 26,7 cm',
        comparison: 'Gulrot',
        bodyChanges: ['Lett kortpustethet ved anstrengelse kan dukke opp når livmoren tar mer plass.'],
        toKnow: ['Å bli kjent med babyens vanlige bevegelsesmønster gjør det lettere å legge merke til en uvanlig endring.'],
      },
      pl: {
        babyDescription: 'Ruchy stają się wyraźniejsze i bardziej skoordynowane, a w tym okresie często zaczyna się je wyraźnie czuć.',
        length: 'Około 26,7 cm',
        comparison: 'Marchewka',
        bodyChanges: ['Lekka duszność przy wysiłku może się pojawić, gdy macica zajmuje więcej miejsca.'],
        toKnow: ['Poznanie zwykłego wzorca ruchów dziecka ułatwia zauważenie nietypowej zmiany.'],
      },
      uk: {
        babyDescription: 'Рухи стають чіткішими й більш скоординованими, і в цей період часто починають виразно їх відчувати.',
        length: 'Приблизно 26,7 см',
        comparison: 'Морква',
        bodyChanges: ['Легка задишка при навантаженні може з’явитися, коли матка займає більше місця.'],
        toKnow: ['Знання звичного характеру рухів вашої дитини полегшує помічення нетипової зміни.'],
      },
      cs: {
        babyDescription: 'Pohyby jsou zřetelnější a koordinovanější a v tomto období je běžné začít je zřetelně cítit.',
        length: 'Asi 26,7 cm',
        comparison: 'Mrkev',
        bodyChanges: ['Může se objevit mírná dušnost při námaze, jak děloha zaujímá více místa.'],
        toKnow: ['Poznání obvyklého vzorce pohybů miminka usnadňuje všimnout si neobvyklé změny.'],
      },
      sk: {
        babyDescription:
          'Pohyby sa stávajú zreteľnejšími a koordinovanejšími a je bežné, že ich v tomto období začnete zreteľne pociťovať.',
        length: 'Približne 26,7 cm',
        comparison: 'Mrkva',
        bodyChanges: [
          'Pri námahe sa môže objaviť mierna dýchavičnosť, keď maternica zaberá viac miesta.',
        ],
        toKnow: [
          'Zoznámenie sa s obvyklým vzorcom pohybov vášho bábätka uľahčuje všimnúť si nezvyčajnú zmenu.',
        ],
      },
      hu: {
        babyDescription:
          'A mozgások világosabbá és koordináltabbá válnak, és gyakori, hogy ebben az időszakban kezded őket egyértelműen érezni.',
        length: 'Körülbelül 26,7 cm',
        comparison: 'Sárgarépa',
        bodyChanges: [
          'Megterhelés közben enyhe légszomj jelentkezhet, ahogy a méh több helyet foglal el.',
        ],
        toKnow: [
          'A baba szokásos mozgásmintájának megismerése megkönnyíti egy szokatlan változás észrevételét.',
        ],
      },
      ro: {
        babyDescription:
          'Mișcările devin mai clare și mai coordonate, iar este frecvent să începi să le simți clar în această perioadă.',
        length: 'Aproximativ 26,7 cm',
        comparison: 'Morcov',
        bodyChanges: [
          'O ușoară lipsă de aer la efort poate apărea pe măsură ce uterul ocupă mai mult loc.',
        ],
        toKnow: [
          'Familiarizarea cu tiparul obișnuit de mișcare al bebelușului face mai ușoară observarea unei schimbări neobișnuite.',
        ],
      },
      bg: {
        babyDescription:
          'Движенията стават по-ясни и по-координирани и е обичайно да започнеш да ги усещаш отчетливо през този период.',
        length: 'Около 26,7 см',
        comparison: 'Морков',
        bodyChanges: [
          'Може да се появи лек задух при усилие, докато матката заема повече място.',
        ],
        toKnow: [
          'Опознаването на обичайния модел на движения на бебето улеснява забелязването на необичайна промяна.',
        ],
      },
      sr: {
        babyDescription:
          'Покрети постају јаснији и координисанији и уобичајено је да их у овом периоду почнеш јасно осећати.',
        length: 'Око 26,7 цм',
        comparison: 'Шаргарепа',
        bodyChanges: [
          'Може се појавити лаган недостатак даха при напору како материца заузима више места.',
        ],
        toKnow: [
          'Упознавање уобичајеног обрасца покрета бебе олакшава уочавање необичне промене.',
        ],
      },
      hr: {
        babyDescription:
          'Pokreti postaju jasniji i koordiniraniji i uobičajeno je da ih u ovom razdoblju počneš jasno osjećati.',
        length: 'Oko 26,7 cm',
        comparison: 'Mrkva',
        bodyChanges: [
          'Može se pojaviti lagan nedostatak zraka pri naporu kako maternica zauzima više prostora.',
        ],
        toKnow: [
          'Upoznavanje uobičajenog obrasca bebinih pokreta olakšava uočavanje neobične promjene.',
        ],
      },
      bs: {
        babyDescription:
          'Pokreti postaju jasniji i koordiniraniji i uobičajeno je da ih u ovom razdoblju počneš jasno osjećati.',
        length: 'Oko 26,7 cm',
        comparison: 'Mrkva',
        bodyChanges: [
          'Može se pojaviti lagan nedostatak zraka pri naporu kako maternica zauzima više prostora.',
        ],
        toKnow: [
          'Upoznavanje uobičajenog obrasca bebinih pokreta olakšava uočavanje neobične promjene.',
        ],
      },
      sl: {
        babyDescription:
          'Gibi postajajo jasnejši in bolj koordinirani, običajno pa je, da jih v tem obdobju začneš jasno čutiti.',
        length: 'Približno 26,7 cm',
        comparison: 'Korenje',
        bodyChanges: [
          'Pri naporu se lahko pojavi rahlo pomanjkanje zraka, ko maternica zavzema več prostora.',
        ],
        toKnow: [
          'Poznavanje običajnega vzorca dojenčkovih gibov olajša opazitev nenavadne spremembe.',
        ],
      },
      ne: {
        babyDescription:
          'चालहरू बढी स्पष्ट र समन्वित हुन्छन्, र यो अवधिमा तिनलाई स्पष्ट रूपमा महसुस गर्न थाल्नु सामान्य हो।',
        length: 'करिब 26.7 सेमी',
        comparison: 'गाजर',
        bodyChanges: [
          'गर्भाशयले बढी ठाउँ लिँदा परिश्रममा हल्का सास फेर्न गाह्रो देखिन सक्छ।',
        ],
        toKnow: [
          'आफ्नो शिशुको सामान्य चालको ढाँचा चिन्नाले असामान्य परिवर्तन थाहा पाउन सजिलो बनाउँछ।',
        ],
      },
      si: {
        babyDescription:
          'චලනයන් වඩා පැහැදිලි සහ වඩා සම්බන්ධීකරණය වන අතර, මෙම කාලය තුළ ඒවා පැහැදිලිව දැනීමට පටන් ගැනීම සාමාන්‍යයි.',
        length: 'සෙ.මී. 26.7 පමණ',
        comparison: 'කැරට් එකක්',
        bodyChanges: [
          'ගර්භාෂය වැඩි ඉඩක් ගන්නා විට වෙහෙසෙන විට සුළු හුස්ම හිරවීමක් දිස්විය හැක.',
        ],
        toKnow: [
          'ඔබේ දරුවාගේ සුපුරුදු චලන රටාව හුරුපුරුදු වීම අසාමාන්‍ය වෙනසක් නිරීක්ෂණය කිරීම පහසු කරයි.',
        ],
      },
      th: {
        babyDescription:
          'การเคลื่อนไหวชัดและประสานกันมากขึ้น และเป็นเรื่องปกติที่จะเริ่มรู้สึกได้ชัดเจนในช่วงนี้',
        length: 'ประมาณ 26.7 ซม.',
        comparison: 'แครอท',
        bodyChanges: [
          'อาจหายใจลำบากเล็กน้อยเมื่อออกแรง เพราะมดลูกใช้พื้นที่มากขึ้น',
        ],
        toKnow: [
          'การคุ้นเคยกับรูปแบบการเคลื่อนไหวตามปกติของทารกช่วยให้สังเกตการเปลี่ยนแปลงผิดปกติได้ง่ายขึ้น',
        ],
      },
      vi: {
        babyDescription:
          'Các cử động trở nên rõ ràng và phối hợp hơn, và việc bắt đầu cảm nhận rõ ràng chúng trong giai đoạn này là điều phổ biến.',
        length: 'Khoảng 26,7 cm',
        comparison: 'Củ cà rốt',
        bodyChanges: [
          'Có thể xuất hiện hơi khó thở nhẹ khi gắng sức vì tử cung chiếm nhiều chỗ hơn.',
        ],
        toKnow: [
          'Làm quen với quy luật cử động thông thường của em bé giúp dễ nhận ra một thay đổi bất thường.',
        ],
      },
      uz: {
        babyDescription:
          'Harakatlar aniqroq va muvofiqlashgan boʻladi va bu davrda ularni yaqqol sezish boshlanishi keng tarqalgan.',
        length: 'Taxminan 26,7 sm',
        comparison: 'Sabzi',
        bodyChanges: [
          'Bachadon koʻproq joy egallaganda zoʻriqish paytida yengil nafas qisilishi paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Chaqaloqning odatiy harakat qonuniyati bilan tanishish odatdan tashqari oʻzgarishni payqashni osonlashtiradi.',
        ],
      },
      az: {
        babyDescription:
          'Hərəkətlər daha aydın və koordinasiyalı olur və bu dövrdə onları aydın hiss etməyə başlamaq adi haldır.',
        length: 'Təxminən 26,7 sm',
        comparison: 'Kök',
        bodyChanges: [
          'Uşaqlıq daha çox yer tutdıqca güc sərfi zamanı yüngül nəfəs darlığı ola bilər.',
        ],
        toKnow: [
          'Körpənizin adi hərəkət qanunauyğunluğunu tanımaq qeyri-adi dəyişikliyi hiss etməyi asanlaşdırır.',
        ],
      },
      ka: {
        babyDescription:
          'მოძრაობები უფრო მკაფიო და კოორდინირებული ხდება და ხშირია, რომ ამ პერიოდში მათ მკაფიოდ გრძნობა იწყებენ.',
        length: 'დაახლოებით 26,7 სმ',
        comparison: 'სტაფილო',
        bodyChanges: [
          'დატვირთვისას მსუბუქი სუნთქვის უკმარისობა შეიძლება გამოჩნდეს, რადგან საშვილოსნო მეტ სივრცეს იკავებს.',
        ],
        toKnow: [
          'თქვენი ბავშვის ჩვეულებრივი მოძრაობის სურათის გაცნობა უჩვეულო ცვლილების შემჩნევას ამარტივებს.',
        ],
      },
      hy: {
        babyDescription:
          'Շարժումները դառնում են ավելի հստակ և համակարգված, և տարածված է դրանք այս ժամանակահատվածում հստակ զգալ սկսելը:',
        length: 'Մոտ 26,7 սմ',
        comparison: 'Գազար',
        bodyChanges: [
          'Ջանքի ժամանակ թեթև շնչահեղձություն կարող է հայտնվել, երբ արգանդը ավելի շատ տարածք է զբաղեցնում:',
        ],
        toKnow: [
          'Ձեր երեխայի սովորական շարժման օրինաչափությանը ծանոթանալը հեշտացնում է անսովոր փոփոխությունը նկատելը:',
        ],
      },
      tg: {
        babyDescription:
          'Ҳаракатҳо возеҳтар ва ҳамоҳангтар мешаванд ва маъмул аст, ки дар ин давра онҳоро ба таври равшан ҳис карданро оғоз кунед.',
        length: 'Тақрибан 26,7 см',
        comparison: 'Сабзӣ',
        bodyChanges: [
          'Тангии сабуки нафас ҳангоми кӯшиш метавонад ҳангоме пайдо шавад, ки бачадон ҷои бештар мегирад.',
        ],
        toKnow: [
          'Шинос шудан бо намунаи одатии ҳаракатҳои тифли худ мушоҳидаи тағйироти ғайриоддиро осонтар мекунад.',
        ],
      },
      ky: {
        babyDescription:
          'Кыймылдар даанараак жана координацияланган болот, ошондуктан бул мезгилде аларды даана сезе баштоо кеңири таралган.',
        length: 'Болжол менен 26,7 см',
        comparison: 'Сабиз',
        bodyChanges: [
          'Жатын көбүрөөк орун ээлегенде, күч түшкөндө жеңил дем жетишсиздиги пайда болушу мүмкүн.',
        ],
        toKnow: [
          'Ымыркайыңыздын адаттагы кыймыл мыйзам ченемдүүлүгүн билүү адаттан тыш өзгөрүүнү байкоону жеңилдетет.',
        ],
      },
      tk: {
        babyDescription:
          'Hereketler has aýdyň we has utgaşdyrylan bolýar, şu döwürde olary aýdyň duýup başlamak umumy zat.',
        length: 'Takmynan 26,7 sm',
        comparison: 'Käşir',
        bodyChanges: [
          'Ýatgy has köp ýer eýelände, güýç sarp edilende ýeňil dem ýetmezçiligi peýda bolup biler.',
        ],
        toKnow: [
          'Bäbegiň adaty hereket nusgasy bilen tanyş bolmak adaty däl üýtgeşmäni görmegi aňsatlaşdyrýar.',
        ],
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
      da: {
        babyDescription: 'Bevægelserne bliver klarere og mere koordinerede, og det er almindeligt at begynde at mærke dem tydeligt i denne periode.',
        length: 'Ca. 26,7 cm',
        comparison: 'Gulerod',
        bodyChanges: [
          'Let åndenød ved anstrengelse kan opstå, efterhånden som livmoderen fylder mere.',
        ],
        toKnow: [
          'At lære din babys sædvanlige bevægelsesmønster at kende gør det lettere at bemærke en usædvanlig ændring.',
        ],
      },
      sv: {
        babyDescription: 'Bevägelserne bliver klarere och mere koordinerede, och det ar almindeligt at begynde at märke dem tydeligt i denne periode.',
        length: 'Ca. 26,7 cm',
        comparison: 'Gulerod',
        bodyChanges: [
          'Let åndenöd ved anstrengelse kan opstå, efterhånden som livmoderen fylder mere.',
        ],
        toKnow: [
          'At läre din babys sädvanlige bevägelsesmönster at kende gör det lettere at bemärke en usädvanlig ändring.',
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
      nb: {
        babyDescription:
          'Lungene fortsetter å utvikle seg, og babyen øver på små pustebevegelser. Smaksløkene dannes også.',
        length: 'Omtrent 27,8 cm',
        comparison: 'Søtpotet',
        bodyChanges: ['Leggkramper, særlig om natten, er mulig for noen.'],
        toKnow: ['Det du spiser, kan påvirke fostervannet, som babyen jevnlig svelger.'],
      },
      pl: {
        babyDescription:
          'Płuca nadal się rozwijają, a dziecko ćwiczy drobne ruchy oddechowe. Tworzą się też kubki smakowe.',
        length: 'Około 27,8 cm',
        comparison: 'Batat',
        bodyChanges: ['U niektórych osób możliwe są skurcze łydek, zwłaszcza w nocy.'],
        toKnow: ['To, co jesz, może wpływać na płyn owodniowy, który dziecko regularnie połyka.'],
      },
      uk: {
        babyDescription:
          'Легені продовжують розвиватися, а дитина вправляється в невеликих дихальних рухах. Також формуються смакові рецептори.',
        length: 'Приблизно 27,8 см',
        comparison: 'Батат',
        bodyChanges: ['У деяких жінок можливі судоми в литках, особливо вночі.'],
        toKnow: ['Те, що ви їсте, може впливати на навколоплідні води, які дитина регулярно ковтає.'],
      },
      cs: {
        babyDescription:
          'Plíce se dál vyvíjejí a miminko si nacvičuje drobné dýchací pohyby. Tvoří se také chuťové pohárky.',
        length: 'Asi 27,8 cm',
        comparison: 'Batát',
        bodyChanges: ['U některých žen jsou možné křeče v lýtkách, zejména v noci.'],
        toKnow: ['To, co jíte, může ovlivňovat plodovou vodu, kterou miminko pravidelně polyká.'],
      },
      sk: {
        babyDescription:
          'Pľúca sa naďalej vyvíjajú a bábätko nacvičuje drobné dýchacie pohyby. Tvoria sa aj chuťové poháriky.',
        length: 'Približne 27,8 cm',
        comparison: 'Sladký zemiak',
        bodyChanges: [
          'U niektorých žien sú možné kŕče v nohách, najmä v noci.',
        ],
        toKnow: [
          'To, čo jete, môže ovplyvniť plodovú vodu, ktorú bábätko pravidelne prehĺta.',
        ],
      },
      hu: {
        babyDescription:
          'A tüdő tovább fejlődik, és a baba kis légzőmozgásokat gyakorol. Az ízlelőbimbók is kialakulnak.',
        length: 'Körülbelül 27,8 cm',
        comparison: 'Édesburgonya',
        bodyChanges: [
          'Egyes nőknél lehetségesek lábgörcsök, különösen éjszaka.',
        ],
        toKnow: [
          'Amit eszel, az befolyásolhatja a magzatvizet, amelyet a baba rendszeresen nyel.',
        ],
      },
      ro: {
        babyDescription:
          'Plămânii continuă să se dezvolte, iar bebelușul exersează mici mișcări de respirație. Se formează și papilele gustative.',
        length: 'Aproximativ 27,8 cm',
        comparison: 'Cartof dulce',
        bodyChanges: [
          'Crampele la picioare, în special noaptea, sunt posibile la unele persoane.',
        ],
        toKnow: [
          'Ceea ce mănânci poate influența lichidul amniotic, pe care bebelușul îl înghite în mod regulat.',
        ],
      },
      bg: {
        babyDescription:
          'Белите дробове продължават да се развиват, а бебето упражнява малки дихателни движения. Формират се и вкусовите рецептори.',
        length: 'Около 27,8 см',
        comparison: 'Сладък картоф',
        bodyChanges: [
          'Възможни са крампи в краката, особено през нощта, при някои хора.',
        ],
        toKnow: [
          'Това, което ядеш, може да влияе на амниотичната течност, която бебето редовно поглъща.',
        ],
      },
      sr: {
        babyDescription:
          'Плућа настављају да се развијају, а беба вежба мале дихатне покрете. Формирају се и пупољци укуса.',
        length: 'Око 27,8 цм',
        comparison: 'Слатки кромпир',
        bodyChanges: [
          'Могући су грчеви у ногама, нарочито ноћу, код неких особа.',
        ],
        toKnow: [
          'Оно што једеш може утицати на амнионску течност коју беба редовно гута.',
        ],
      },
      hr: {
        babyDescription:
          'Pluća se nastavljaju razvijati, a beba vježba male dišne pokrete. Oblikuju se i okusni pupoljci.',
        length: 'Oko 27,8 cm',
        comparison: 'Batat',
        bodyChanges: [
          'Mogući su grčevi u nogama, osobito noću, kod nekih osoba.',
        ],
        toKnow: [
          'Ono što jedeš može utjecati na plodnu vodu koju beba redovito guta.',
        ],
      },
      bs: {
        babyDescription:
          'Pluća se nastavljaju razvijati, a beba vježba male dišne pokrete. Oblikuju se i okusni pupoljci.',
        length: 'Oko 27,8 cm',
        comparison: 'Batat',
        bodyChanges: [
          'Mogući su grčevi u nogama, osobito noću, kod nekih osoba.',
        ],
        toKnow: [
          'Ono što jedeš može utjecati na plodnu vodu koju beba redovito guta.',
        ],
      },
      sl: {
        babyDescription:
          'Pljuča se še naprej razvijajo, dojenček pa vadi majhne dihalne gibe. Oblikujejo se tudi okušalni brbončici.',
        length: 'Približno 27,8 cm',
        comparison: 'Sladki krompir',
        bodyChanges: [
          'Pri nekaterih osebah so mogoči krči v nogah, zlasti ponoči.',
        ],
        toKnow: [
          'Kar ješ, lahko vpliva na plodovnico, ki jo dojenček redno požira.',
        ],
      },
      ne: {
        babyDescription:
          'फोक्सो विकसित हुँदै जान्छन्, र शिशुले साना सास फेर्ने चालहरूको अभ्यास गर्छ। स्वादका कोषहरू पनि बन्दै छन्।',
        length: 'करिब 27.8 सेमी',
        comparison: 'सखरखण्ड',
        bodyChanges: [
          'केही मानिसमा, विशेष गरी राति, खुट्टा खुम्चिने सम्भव छ।',
        ],
        toKnow: [
          'तपाईंले जे खानुहुन्छ त्यसले उल्बको तरललाई प्रभाव पार्न सक्छ, जसलाई शिशुले नियमित रूपमा निल्छ।',
        ],
      },
      si: {
        babyDescription:
          'පෙණහලු වර්ධනය වීම දිගටම කරගෙන යන අතර, දරුවා කුඩා හුස්ම ගැනීමේ චලනයන් පුහුණු කරයි. රස කුංචි ද සෑදෙමින් පවතී.',
        length: 'සෙ.මී. 27.8 පමණ',
        comparison: 'බතල ගෙඩියක්',
        bodyChanges: [
          'සමහර පුද්ගලයන්ට, විශේෂයෙන් රාත්‍රියේ, කකුල් මාංශ පේශි ඇදීම් ඇතිවීමට පුළුවන්.',
        ],
        toKnow: [
          'ඔබ අනුභව කරන දේට දරුවා නිතිපතා ගිලින ඇම්නියොටික් තරලයට බලපෑ හැක.',
        ],
      },
      th: {
        babyDescription:
          'ปอดยังคงพัฒนาต่อไป และทารกฝึกการเคลื่อนไหวหายใจเล็ก ๆ ตุ่มรับรสก็กำลังก่อตัวด้วย',
        length: 'ประมาณ 27.8 ซม.',
        comparison: 'มันเทศ',
        bodyChanges: [
          'ตะคริวที่ขา โดยเฉพาะตอนกลางคืน เกิดขึ้นได้ในบางคน',
        ],
        toKnow: [
          'สิ่งที่คุณกินอาจมีอิทธิพลต่อน้ำคร่ำ ซึ่งทารกกลืนเป็นประจำ',
        ],
      },
      vi: {
        babyDescription:
          'Phổi tiếp tục phát triển, và em bé tập những động tác thở nhỏ. Các nụ vị giác cũng đang hình thành.',
        length: 'Khoảng 27,8 cm',
        comparison: 'Khoai lang',
        bodyChanges: [
          'Chuột rút ở chân, đặc biệt vào ban đêm, có thể xảy ra ở một số người.',
        ],
        toKnow: [
          'Những gì bạn ăn có thể ảnh hưởng đến nước ối, thứ mà em bé thường xuyên nuốt.',
        ],
      },
      uz: {
        babyDescription:
          'Oʻpkalar rivojlanishda davom etadi va chaqaloq mayda nafas olish harakatlarini mashq qiladi. Taʼm kurtaklari ham shakllanmoqda.',
        length: 'Taxminan 27,8 sm',
        comparison: 'Shirin kartoshka',
        bodyChanges: [
          'Baʼzi odamlarda oyoq qisqarishlari, ayniqsa tunda, mumkin.',
        ],
        toKnow: [
          'Yeganingiz chaqaloq muntazam yutadigan amnion suyuqligiga taʼsir qilishi mumkin.',
        ],
      },
      az: {
        babyDescription:
          'Ağciyərlər inkişaf etməyə davam edir və körpə kiçik nəfəs hərəkətləri məşq edir. Dad reseptorları da formalaşır.',
        length: 'Təxminən 27,8 sm',
        comparison: 'Şirin kartof',
        bodyChanges: [
          'Bəzi insanlarda ayaq qıcolmaları, xüsusilə gecələr mümkündür.',
        ],
        toKnow: [
          'Yediyiniz qida körpənin müntəzəm uddığı amnion mayesinə təsir edə bilər.',
        ],
      },
      ka: {
        babyDescription:
          'ფილტვები კვლავ ვითარდება და ბავშვი სუნთქვის პატარა მოძრაობებს ვარჯიშობს. ასევე ყალიბდება გემოვნების რეცეპტორები.',
        length: 'დაახლოებით 27,8 სმ',
        comparison: 'ტკბილი კარტოფილი',
        bodyChanges: [
          'ფეხის კრუნჩხვები, განსაკუთრებით ღამით, ზოგისთვის შესაძლებელია.',
        ],
        toKnow: [
          'იმან, რასაც ჭამთ, შეიძლება ამნიონურ სითხეზე იმოქმედოს, რომელსაც ბავშვი რეგულარულად ყლაპავს.',
        ],
      },
      hy: {
        babyDescription:
          'Թոքերը շարունակում են զարգանալ, և երեխան կատարում է շնչառական փոքր շարժումներ: Ձևավորվում են նաև համի բշտիկները:',
        length: 'Մոտ 27,8 սմ',
        comparison: 'Քաղցր կարտոֆիլ',
        bodyChanges: [
          'Որոշ մարդկանց մոտ հնարավոր են ոտքերի ջղաձգումներ, հատկապես գիշերը:',
        ],
        toKnow: [
          'Այն, ինչ ուտում եք, կարող է ազդել ամնիոտիկ հեղուկի վրա, որը երեխան կանոնավոր կուլ է տալիս:',
        ],
      },
      tg: {
        babyDescription:
          'Шушҳо инкишоф ёфтанро идома медиҳанд ва тифл ҳаракатҳои хурди нафаскаширо машқ мекунад. Ғӯдаҳои чашоӣ низ ташаккул меёбанд.',
        length: 'Тақрибан 27,8 см',
        comparison: 'Картошкаи ширин',
        bodyChanges: [
          'Кашишхӯрии пойҳо, хусусан дар шаб, барои баъзеҳо имконпазир аст.',
        ],
        toKnow: [
          'Он чи мехӯред, метавонад ба моеи амниотикӣ, ки тифл мунтазам фурӯ мебарад, таъсир расонад.',
        ],
      },
      ky: {
        babyDescription:
          'Өпкө өнүгүүнү улантат, ал эми ымыркай кичинекей дем алуу кыймылдарын машыктырат. Даам бүчүрлөрү да түзүлүүдө.',
        length: 'Болжол менен 27,8 см',
        comparison: 'Таттуу картөшкө',
        bodyChanges: [
          'Айрым адамдарда буттагы спазмдар, айрыкча түнкүсүн, мүмкүн.',
        ],
        toKnow: [
          'Эмне жегениңиз ымыркай үзгүлтүксүз жуткан амниотикалык суюктукка таасир этиши мүмкүн.',
        ],
      },
      tk: {
        babyDescription:
          'Öýkenler ösmegini dowam etdirýär we bäbek kiçijik dem alyş hereketlerini türgenleşýär. Tagam kabul edijiler hem emele gelýär.',
        length: 'Takmynan 27,8 sm',
        comparison: 'Süýji kartoşka',
        bodyChanges: [
          'Aýak çekişmeleri, aýratyn-da gijelerine, käbir adamlar üçin mümkin.',
        ],
        toKnow: [
          'Iýýän zatlaryňyz bäbegiň yzygiderli ýuwdýan amniotik suwuklygyna täsir edip biler.',
        ],
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
      da: {
        babyDescription: 'Lungerne fortsætter med at udvikle sig, og babyen øver sig i små vejrtrækningsbevægelser. Smagsløg dannes også.',
        length: 'Ca. 27,8 cm',
        comparison: 'Sød kartoffel',
        bodyChanges: [
          'Benkramper, særligt om natten, kan forekomme for nogle.',
        ],
        toKnow: [
          'Det du spiser kan påvirke fostervandet, som babyen jævnligt synker.',
        ],
      },
      sv: {
        babyDescription: 'Lungerne fortsätter med at udvikle sig, och babyen över sig i små vejrträkningsbevägelser. Smagslög dannes også.',
        length: 'Ca. 27,8 cm',
        comparison: 'Söd kartoffel',
        bodyChanges: [
          'Benkramper, särligt om natten, kan forekomme for nogle.',
        ],
        toKnow: [
          'Det du spiser kan påvirke fostervandet, som babyen jävnligt synker.',
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
      nb: {
        babyDescription:
          'Lemmene er nå godt proporsjonert. Babyen øver på å puste og begynner å veksle mellom søvn- og våkenfaser.',
        length: 'Omtrent 28,9 cm',
        comparison: 'Stor mango',
        bodyChanges: ['Mer uttalte ryggsmerter kan dukke opp med gradvis vektøkning.'],
        toKnow: ['Å observere babyens aktive og rolige perioder hjelper deg å lære babyens egen rytme.'],
      },
      pl: {
        babyDescription:
          'Kończyny są już dobrze proporcjonalne. Dziecko ćwiczy oddychanie i zaczyna na przemian zasypiać i się wybudzać.',
        length: 'Około 28,9 cm',
        comparison: 'Duże mango',
        bodyChanges: ['Przy stopniowym przybieraniu na wadze może pojawić się wyraźniejszy ból pleców.'],
        toKnow: ['Obserwowanie okresów aktywności i spokoju dziecka pomaga poznać jego własny rytm.'],
      },
      uk: {
        babyDescription:
          'Кінцівки вже добре пропорційні. Дитина вправляється в диханні й починає чергувати фази сну та неспання.',
        length: 'Приблизно 28,9 см',
        comparison: 'Велике манго',
        bodyChanges: ['Із поступовим набором ваги може з’явитися виразніший біль у спині.'],
        toKnow: ['Спостереження за періодами активності й спокою дитини допомагає пізнати її власний ритм.'],
      },
      cs: {
        babyDescription:
          'Končetiny jsou nyní dobře proporcionální. Miminko si nacvičuje dýchání a začíná střídat fáze spánku a bdění.',
        length: 'Asi 28,9 cm',
        comparison: 'Velké mango',
        bodyChanges: ['S postupným přibýváním na váze se může objevit výraznější bolest zad.'],
        toKnow: ['Sledování aktivních a klidných období miminka vám pomáhá poznat jeho vlastní rytmus.'],
      },
      sk: {
        babyDescription:
          'Končatiny sú už dobre proporčné. Bábätko nacvičuje dýchanie a začína striedať fázy spánku a bdenia.',
        length: 'Približne 28,9 cm',
        comparison: 'Veľké mango',
        bodyChanges: [
          'S postupným priberaním sa môže objaviť výraznejšia bolesť chrbta.',
        ],
        toKnow: [
          'Sledovanie aktívnych a pokojných období bábätka vám pomáha spoznať jeho vlastný rytmus.',
        ],
      },
      hu: {
        babyDescription:
          'A végtagok már jó arányúak. A baba légzést gyakorol, és elkezdi váltogatni az alvás és az ébrenlét szakaszait.',
        length: 'Körülbelül 28,9 cm',
        comparison: 'Nagy mangó',
        bodyChanges: [
          'A fokozatos súlygyarapodással kifejezettebb hátfájdalom jelentkezhet.',
        ],
        toKnow: [
          'A baba aktív és nyugodt időszakainak megfigyelése segít megismerni a saját ritmusát.',
        ],
      },
      ro: {
        babyDescription:
          'Membrele sunt acum bine proporționate. Bebelușul exersează respirația și începe să alterneze fazele de somn și de veghe.',
        length: 'Aproximativ 28,9 cm',
        comparison: 'Mango mare',
        bodyChanges: [
          'O durere de spate mai pronunțată poate apărea odată cu creșterea treptată în greutate.',
        ],
        toKnow: [
          'Observarea perioadelor active și liniștite ale bebelușului te ajută să-i înveți propriul ritm.',
        ],
      },
      bg: {
        babyDescription:
          'Крайниците вече са добре пропорционални. Бебето упражнява дишане и започва да редува фази на сън и бодърстване.',
        length: 'Около 28,9 см',
        comparison: 'Голямо манго',
        bodyChanges: [
          'С постепенното наддаване на тегло може да се появи по-изразена болка в гърба.',
        ],
        toKnow: [
          'Наблюдението на активните и спокойните периоди на бебето ти помага да научиш собствения му ритъм.',
        ],
      },
      sr: {
        babyDescription:
          'Удови су сада добро пропорционални. Беба вежба дисање и почиње да смењује фазе сна и будности.',
        length: 'Око 28,9 цм',
        comparison: 'Велико манго',
        bodyChanges: [
          'Уз постепено добијање на тежини може се појавити израженији бол у леђима.',
        ],
        toKnow: [
          'Посматрање активних и мирних периода бебе помаже ти да научиш њен сопствени ритам.',
        ],
      },
      hr: {
        babyDescription:
          'Udovi su sada dobro proporcionalni. Beba vježba disanje i počinje izmjenjivati faze sna i budnosti.',
        length: 'Oko 28,9 cm',
        comparison: 'Veliki mango',
        bodyChanges: [
          'Uz postupno dobivanje na težini može se pojaviti izraženija bol u leđima.',
        ],
        toKnow: [
          'Promatranje bebinih aktivnih i mirnih razdoblja pomaže ti upoznati njezin vlastiti ritam.',
        ],
      },
      bs: {
        babyDescription:
          'Udovi su sada dobro proporcionalni. Beba vježba disanje i počinje izmjenjivati faze sna i budnosti.',
        length: 'Oko 28,9 cm',
        comparison: 'Veliki mango',
        bodyChanges: [
          'Uz postupno dobivanje na težini može se pojaviti izraženija bol u leđima.',
        ],
        toKnow: [
          'Promatranje bebinih aktivnih i mirnih razdoblja pomaže ti upoznati njezin vlastiti ritam.',
        ],
      },
      sl: {
        babyDescription:
          'Udi so zdaj dobro sorazmerni. Dojenček vadi dihanje in začenja izmenjevati faze spanja in budnosti.',
        length: 'Približno 28,9 cm',
        comparison: 'Veliki mango',
        bodyChanges: [
          'Ob postopnem pridobivanju teže se lahko pojavi izrazitejša bolečina v hrbtu.',
        ],
        toKnow: [
          'Opazovanje dojenčkovih aktivnih in mirnih obdobij ti pomaga spoznati njegov lasten ritem.',
        ],
      },
      ne: {
        babyDescription:
          'अङ्गहरू अब राम्ररी अनुपातिक छन्। शिशुले सास फेर्ने अभ्यास गर्छ र निद्रा तथा जागरणका चरणहरू पालैपालो गर्न थाल्छ।',
        length: 'करिब 28.9 सेमी',
        comparison: 'ठूलो आँप',
        bodyChanges: [
          'बिस्तारै तौल बढ्दा ढाडको दुखाइ बढी स्पष्ट देखिन सक्छ।',
        ],
        toKnow: [
          'शिशुका सक्रिय र शान्त अवधिहरू अवलोकन गर्नाले तपाईंलाई उनको आफ्नै लय चिन्न मद्दत गर्छ।',
        ],
      },
      si: {
        babyDescription:
          'අත් පාද දැන් හොඳින් සමානුපාතිකයි. දරුවා හුස්ම ගැනීම පුහුණු කරන අතර නින්ද සහ අවදි වීමේ අවධි මාරුවෙන් මාරුවට භාවිතා කිරීමට පටන් ගනී.',
        length: 'සෙ.මී. 28.9 පමණ',
        comparison: 'විශාල අඹ ගෙඩියක්',
        bodyChanges: [
          'ක්‍රමානුකූල බර වැඩිවීමත් සමඟ වඩා කැපී පෙනෙන පිට වේදනාවක් දිස්විය හැක.',
        ],
        toKnow: [
          'දරුවාගේ ක්‍රියාශීලී සහ නිහඬ කාල නිරීක්ෂණය කිරීම ඔවුන්ගේම රිද්මය ඉගෙන ගැනීමට උපකාරී වේ.',
        ],
      },
      th: {
        babyDescription:
          'แขนขาได้สัดส่วนดีแล้ว ทารกฝึกหายใจและเริ่มสลับระยะหลับและตื่น',
        length: 'ประมาณ 28.9 ซม.',
        comparison: 'มะม่วงลูกใหญ่',
        bodyChanges: [
          'อาจมีอาการปวดหลังชัดเจนขึ้นเมื่อน้ำหนักขึ้นทีละน้อย',
        ],
        toKnow: [
          'การสังเกตช่วงที่ทารกตื่นตัวและสงบช่วยให้คุณเรียนรู้จังหวะของทารกเอง',
        ],
      },
      vi: {
        babyDescription:
          'Các chi giờ đây đã cân đối tốt. Em bé tập thở và bắt đầu xen kẽ các giai đoạn ngủ và thức.',
        length: 'Khoảng 28,9 cm',
        comparison: 'Quả xoài lớn',
        bodyChanges: [
          'Đau lưng rõ rệt hơn có thể xuất hiện khi tăng cân dần dần.',
        ],
        toKnow: [
          'Quan sát những lúc em bé hoạt động và yên tĩnh giúp bạn học được nhịp điệu riêng của bé.',
        ],
      },
      uz: {
        babyDescription:
          'Qoʻl-oyoqlar endi yaxshi mutanosib. Chaqaloq nafas olishni mashq qiladi va uyqu hamda uygʻoqlik bosqichlarini almashtira boshlaydi.',
        length: 'Taxminan 28,9 sm',
        comparison: 'Katta mango',
        bodyChanges: [
          'Vaznning asta-sekin ortishi bilan yaqqolroq bel ogʻrigʻi paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Chaqaloqning faol va sokin davrlarini kuzatish uning oʻz ritmini oʻrganishga yordam beradi.',
        ],
      },
      az: {
        babyDescription:
          'Əzalar artıq yaxşı mütənasibdir. Körpə nəfəs almağı məşq edir və yuxu və oyaqlıq fazalarını növbələşdirməyə başlayır.',
        length: 'Təxminən 28,9 sm',
        comparison: 'İri manqo',
        bodyChanges: [
          'Tədricən çəki artımı ilə daha bariz bel ağrısı görünə bilər.',
        ],
        toKnow: [
          'Körpənin aktiv və sakit dövrlərini müşahidə etmək onun öz ritmini öyrənməyə kömək edir.',
        ],
      },
      ka: {
        babyDescription:
          'კიდურები ახლა კარგად პროპორციულია. ბავშვი სუნთქვას ვარჯიშობს და იწყებს ძილისა და სიფხიზლის ფაზების მონაცვლეობას.',
        length: 'დაახლოებით 28,9 სმ',
        comparison: 'დიდი მანგო',
        bodyChanges: [
          'უფრო გამოხატული ზურგის ტკივილი შეიძლება გამოჩნდეს წონის ეტაპობრივი მატებისას.',
        ],
        toKnow: [
          'ბავშვის აქტიური და მშვიდი პერიოდების დაკვირვება გეხმარებათ მისი საკუთარი რიტმის გაცნობაში.',
        ],
      },
      hy: {
        babyDescription:
          'Վերջույթներն այժմ լավ համամասնական են: Երեխան վարժվում է շնչել և սկսում է հերթափոխել քնի և արթնության փուլերը:',
        length: 'Մոտ 28,9 սմ',
        comparison: 'Խոշոր մանգո',
        bodyChanges: [
          'Քաշի աստիճանական ավելացման հետ կարող է հայտնվել ավելի արտահայտված մեջքի ցավ:',
        ],
        toKnow: [
          'Երեխայի ակտիվ և հանգիստ ժամանակահատվածները դիտարկելը օգնում է սովորել նրա սեփական ռիթմը:',
        ],
      },
      tg: {
        babyDescription:
          'Аъзо акнун хуб мутаносибанд. Тифл нафаскаширо машқ мекунад ва иваз кардани марҳилаҳои хоб ва бедориро оғоз мекунад.',
        length: 'Тақрибан 28,9 см',
        comparison: 'Манғои калон',
        bodyChanges: [
          'Дарди шадидтари пушт метавонад бо афзоиши тадриҷии вазн пайдо шавад.',
        ],
        toKnow: [
          'Мушоҳидаи давраҳои фаъол ва ороми тифл ба шумо кумак мекунад суръати худи ӯро биомӯзед.',
        ],
      },
      ky: {
        babyDescription:
          'Буттар менен колдор эми жакшы пропорционалдуу. Ымыркай дем алууну машыктырып, уйку менен ойгонуу фазаларын алмаштыра баштайт.',
        length: 'Болжол менен 28,9 см',
        comparison: 'Чоң манго',
        bodyChanges: [
          'Салмак акырындап кошулган сайын бел оорусу көбүрөөк байкалышы мүмкүн.',
        ],
        toKnow: [
          'Ымыркайдын активдүү жана тынч мезгилдерин байкоо анын өз ритмин үйрөнүүгө жардам берет.',
        ],
      },
      tk: {
        babyDescription:
          'El-aýaklar indi gowy deň ölçegli. Bäbek dem almagy türgenleşýär we uky bilen oýaklyk tapgyrlaryny çalşyrmaga başlaýar.',
        length: 'Takmynan 28,9 sm',
        comparison: 'Uly mango',
        bodyChanges: [
          'Ýuwaş-ýuwaşdan agram goşmak bilen has aýdyň bil agyrysy peýda bolup biler.',
        ],
        toKnow: [
          'Bäbegiň işjeň we asuda döwürlerini synlamak onuň öz ritmini öwrenmäge kömek edýär.',
        ],
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
      da: {
        babyDescription: 'Lemmerne er nu velproportionerede. Babyen øver sig i vejrtrækning og begynder at skifte mellem søvn- og vågenfaser.',
        length: 'Ca. 28,9 cm',
        comparison: 'Stor mango',
        bodyChanges: [
          'Mere udtalt rygsmerter kan opstå med gradvis vægtøgning.',
        ],
        toKnow: [
          'At observere babyens aktive og rolige perioder hjælper dig med at lære dens rytme at kende.',
        ],
      },
      sv: {
        babyDescription: 'Lemmerne ar nu velproportionerede. Babyen över sig i vejrträkning och begynder at skifte mellem sövn- och vågenfaser.',
        length: 'Ca. 28,9 cm',
        comparison: 'Stor mango',
        bodyChanges: [
          'Mere udtalt rygsmerter kan opstå med gradvis vägtögning.',
        ],
        toKnow: [
          'At observere babyens aktive och rolige perioder hjälper dig med at läre dens rytme at kende.',
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
      nb: {
        babyDescription:
          'Babyen når grensen for levedyktighet: ved en svært tidlig fødsel på dette stadiet kan spesialisert medisinsk nyfødtomsorg gjøre overlevelse mulig, med passende støtte.',
        length: 'Omtrent 30 cm',
        comparison: 'Maiskolbe',
        bodyChanges: ['Økt trykk på blæren og hyppig vannlatingsbehov kan dukke opp.'],
        toKnow: ['Screening for svangerskapsdiabetes tilbys vanligvis rundt denne tiden.'],
      },
      pl: {
        babyDescription:
          'Dziecko osiąga próg przeżywalności: w razie bardzo przedwczesnego porodu na tym etapie specjalistyczna opieka neonatologiczna może umożliwić przeżycie, przy odpowiednim wsparciu.',
        length: 'Około 30 cm',
        comparison: 'Kolba kukurydzy',
        bodyChanges: ['Może pojawić się zwiększony ucisk na pęcherz i częste parcie na mocz.'],
        toKnow: ['Badanie przesiewowe w kierunku cukrzycy ciążowej jest zazwyczaj oferowane mniej więcej w tym czasie.'],
      },
      uk: {
        babyDescription:
          'Дитина досягає порога життєздатності: у разі дуже передчасних пологів на цьому етапі спеціалізована неонатальна допомога може забезпечити виживання за відповідної підтримки.',
        length: 'Приблизно 30 см',
        comparison: 'Качан кукурудзи',
        bodyChanges: ['Може з’явитися підвищений тиск на сечовий міхур і часті позиви до сечовипускання.'],
        toKnow: ['Скринінг гестаційного діабету зазвичай пропонують приблизно в цей час.'],
      },
      cs: {
        babyDescription:
          'Miminko dosahuje hranice životaschopnosti: při velmi předčasném porodu v této fázi může specializovaná neonatologická péče umožnit přežití s vhodnou podporou.',
        length: 'Asi 30 cm',
        comparison: 'Kukuřičný klas',
        bodyChanges: ['Může se objevit zvýšený tlak na močový měchýř a časté nutkání na močení.'],
        toKnow: ['Screening těhotenské cukrovky se obvykle nabízí přibližně v této době.'],
      },
      sk: {
        babyDescription:
          'Bábätko dosahuje hranicu životaschopnosti: v prípade veľmi predčasného pôrodu v tejto fáze môže špecializovaná neonatologická lekárska starostlivosť umožniť prežitie, s vhodnou podporou.',
        length: 'Približne 30 cm',
        comparison: 'Kukuričný klas',
        bodyChanges: [
          'Môže sa objaviť zvýšený tlak na močový mechúr a časté nutkanie na močenie.',
        ],
        toKnow: [
          'Skríning gestačného diabetu sa zvyčajne ponúka okolo tohto času.',
        ],
      },
      hu: {
        babyDescription:
          'A baba eléri az életképesség küszöbét: ebben a szakaszban bekövetkező nagyon koraszülés esetén a specializált újszülöttellátás megfelelő támogatással lehetővé teheti a túlélést.',
        length: 'Körülbelül 30 cm',
        comparison: 'Kukoricacső',
        bodyChanges: [
          'Fokozott nyomás a hólyagra és gyakori vizelési inger jelentkezhet.',
        ],
        toKnow: [
          'A terhességi cukorbetegség szűrését általában e tájt ajánlják fel.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul atinge pragul de viabilitate: în cazul unei nașteri foarte premature în această etapă, îngrijirile medicale neonatale specializate pot permite supraviețuirea, cu un sprijin adecvat.',
        length: 'Aproximativ 30 cm',
        comparison: 'Știulete de porumb',
        bodyChanges: [
          'Pot apărea o presiune crescută asupra vezicii urinare și nevoi frecvente de a urina.',
        ],
        toKnow: [
          'Depistarea diabetului gestațional este propusă în general în jurul acestui moment.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето достига прага на жизнеспособност: при много преждевременно раждане на този етап специализираната неонатална медицинска грижа може да позволи оцеляване, с подходяща подкрепа.',
        length: 'Около 30 см',
        comparison: 'Кочан царевица',
        bodyChanges: [
          'Може да се появи засилен натиск върху пикочния мехур и чести позиви за уриниране.',
        ],
        toKnow: [
          'Скринингът за гестационен диабет обикновено се предлага около този момент.',
        ],
      },
      sr: {
        babyDescription:
          'Беба достиже праг одрживости: у случају веома превремног порођаја у овој фази, специјализована неонатална медицинска нега може омогућити преживљавање, уз одговарајућу подршку.',
        length: 'Око 30 цм',
        comparison: 'Клип кукуруза',
        bodyChanges: [
          'Може се појавити појачан притисак на мокраћну бешику и чести позиви на уринирање.',
        ],
        toKnow: [
          'Скрининг на гестациони дијабетес обично се нуди око овог времена.',
        ],
      },
      hr: {
        babyDescription:
          'Beba dostiže prag održivosti: u slučaju vrlo prijevremenog poroda u ovoj fazi, specijalizirana neonatološka medicinska skrb može omogućiti preživljavanje, uz odgovarajuću podršku.',
        length: 'Oko 30 cm',
        comparison: 'Klip kukuruza',
        bodyChanges: [
          'Može se pojaviti pojačan pritisak na mokraćni mjehur i česti nagon na mokrenje.',
        ],
        toKnow: [
          'Probir na gestacijski dijabetes obično se nudi oko ovog vremena.',
        ],
      },
      bs: {
        babyDescription:
          'Beba dostiže prag održivosti: u slučaju vrlo prijevremenog porođaja u ovoj fazi, specijalizirana neonatološka medicinska skrb može omogućiti preživljavanje, uz odgovarajuću podršku.',
        length: 'Oko 30 cm',
        comparison: 'Klip kukuruza',
        bodyChanges: [
          'Može se pojaviti pojačan pritisak na mokraćni mjehur i česti nagon na mokrenje.',
        ],
        toKnow: [
          'Probir na gestacijski dijabetes obično se nudi oko ovog vremena.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček doseže prag sposobnosti preživetja: v primeru zelo prezgodnjega poroda v tej fazi lahko specializirana neonatalna medicinska oskrba omogoči preživetje, z ustrezno podporo.',
        length: 'Približno 30 cm',
        comparison: 'Koruzni storž',
        bodyChanges: [
          'Lahko se pojavi povečan pritisk na sečni mehur in pogost nagon na uriniranje.',
        ],
        toKnow: [
          'Presejanje za gestacijski diabetes se običajno ponudi okoli tega časa.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु बाँच्न सक्ने सीमामा पुग्छ: यस चरणमा निकै अपरिपक्व जन्म भएको अवस्थामा, विशेषज्ञ नवजात चिकित्सकीय हेरचाहले उपयुक्त साथसहित बाँच्न सम्भव बनाउन सक्छ।',
        length: 'करिब 30 सेमी',
        comparison: 'मकैको घोगा',
        bodyChanges: [
          'मूत्राशयमा दबाब बढ्न र बारम्बार पिसाब लाग्न सक्छ।',
        ],
        toKnow: [
          'गर्भकालीन मधुमेहको जाँच सामान्यतया यही समयतिर प्रस्ताव गरिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා ජීවත් විය හැකි සීමාවට ළඟා වේ: මෙම අවධියේදී ඉතා කල් ඉකුත් ප්‍රසූතියකදී, විශේෂිත නව-ජාත වෛද්‍ය සත්කාරයට සුදුසු සහාය සමඟ ජීවිතය ඉතිරි කර ගැනීමට ඉඩ දිය හැක.',
        length: 'සෙ.මී. 30 පමණ',
        comparison: 'බඩ ඉරිඟු කරලක්',
        bodyChanges: [
          'මුත්‍රාශයට වැඩි පීඩනයක් සහ නිතර මුත්‍රා කිරීමේ ආශාවක් දිස්විය හැක.',
        ],
        toKnow: [
          'ගර්භණී දියවැඩියාව පරීක්ෂාව සාමාන්‍යයෙන් මෙම කාලය වටා ඉදිරිපත් කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ทารกถึงเกณฑ์ที่อยู่รอดได้: หากคลอดก่อนกำหนดมากในระยะนี้ การดูแลทางการแพทย์เฉพาะทางด้านทารกแรกเกิดช่วยให้รอดชีวิตได้ ด้วยการสนับสนุนที่เหมาะสม',
        length: 'ประมาณ 30 ซม.',
        comparison: 'ฝักข้าวโพด',
        bodyChanges: [
          'อาจมีแรงกดต่อกระเพาะปัสสาวะมากขึ้นและปวดปัสสาวะบ่อย',
        ],
        toKnow: [
          'โดยทั่วไปการคัดกรองเบาหวานขณะตั้งครรภ์นัดราวช่วงนี้',
        ],
      },
      vi: {
        babyDescription:
          'Em bé đạt ngưỡng có thể sống được: nếu sinh non rất sớm ở giai đoạn này, chăm sóc y tế sơ sinh chuyên khoa có thể giúp bé sống sót, với sự hỗ trợ phù hợp.',
        length: 'Khoảng 30 cm',
        comparison: 'Bắp ngô',
        bodyChanges: [
          'Áp lực lên bàng quang tăng lên và có thể xuất hiện cảm giác buồn tiểu thường xuyên.',
        ],
        toKnow: [
          'Tầm soát tiểu đường thai kỳ thường được đề xuất vào khoảng thời gian này.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq hayotga layoqatlilik chegarasiga yetadi: bu bosqichda juda erta tugʻilgan taqdirda, ixtisoslashgan neonatal tibbiy yordam mos qoʻllab-quvvatlash bilan omon qolish imkonini berishi mumkin.',
        length: 'Taxminan 30 sm',
        comparison: 'Makkajoʻxori sunbulasi',
        bodyChanges: [
          'Siydik pufagiga bosimning ortishi va tez-tez siyish hojati paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Gestatsion diabet skrining odatda shu vaqt atrofida taklif qilinadi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə yaşaya bilmə həddinə çatır: bu mərhələdə çox vaxtından əvvəl doğuş halında ixtisaslaşdırılmış neonatal tibbi qayğı uyğun dəstəklə sağ qalmağa imkan verə bilər.',
        length: 'Təxminən 30 sm',
        comparison: 'Qarğıdalı qozası',
        bodyChanges: [
          'Sidik kisəsinə təzyiqin artması və tez-tez sidik ifrazı istəyi görünə bilər.',
        ],
        toKnow: [
          'Gestasion diabet skrininqi adətən bu vaxt ətrafında təklif olunur.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი სიცოცხლისუნარიანობის ზღვარს აღწევს: ამ ეტაპზე ძალიან ნაადრევი მშობიარობის შემთხვევაში სპეციალიზებულ ნეონატალურ სამედიცინო დახმარებას შეუძლია გადარჩენის საშუალება მისცეს, სათანადო მხარდაჭერით.',
        length: 'დაახლოებით 30 სმ',
        comparison: 'სიმინდის ტარო',
        bodyChanges: [
          'შარდის ბუშტზე გაზრდილი წნევა და შარდვის ხშირი სურვილი შეიძლება გამოჩნდეს.',
        ],
        toKnow: [
          'გესტაციური დიაბეტის სკრინინგს ზოგადად დაახლოებით ამ დროს გვთავაზობენ.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան հասնում է կենսունակության շեմին. այս փուլում շատ վաղաժամ ծննդաբերության դեպքում մասնագիտացված նորածնային բժշկական խնամքը կարող է հնարավորություն տալ գոյատևելու՝ պատշաճ աջակցությամբ:',
        length: 'Մոտ 30 սմ',
        comparison: 'Եգիպտացորենի հասկ',
        bodyChanges: [
          'Միզապարկի վրա ճնշման ավելացում և հաճախակի միզելու ցանկություն կարող են հայտնվել:',
        ],
        toKnow: [
          'Հղիության շաքարախտի սկրինինգը սովորաբար առաջարկվում է մոտ այս ժամանակ:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл ба ҳадди зиндамонӣ мерасад: дар сурати таваллуди хеле барвақт дар ин марҳила нигоҳубини тиббии махсуси навзодон метавонад ба зинда мондан имкон диҳад, бо дастгирии мувофиқ.',
        length: 'Тақрибан 30 см',
        comparison: 'Ҳосили ҷуворимакка',
        bodyChanges: [
          'Афзоиши фишор ба масона ва хоҳиши зуд-зуд пешобкунӣ метавонад пайдо шавад.',
        ],
        toKnow: [
          'Ташхиси диабети ҳомиладорӣ одатан дар атрофи ҳамин вақт пешниҳод мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай жашоого жөндөмдүүлүк босогосуна жетет: бул этапта абдан эрте төрөлгөн учурда адистештирилген неонаталдык медициналык кам көрүү ылайыктуу колдоо менен аман калууга мүмкүндүк бере алат.',
        length: 'Болжол менен 30 см',
        comparison: 'Жүгөрү собугу',
        bodyChanges: [
          'Табарсыкка басымдын көбөйүшү жана заара кылууга тез-тез каалоо пайда болушу мүмкүн.',
        ],
        toKnow: [
          'Курсактуулук диабетин скринингдөө адатта ушул убакта сунушталат.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek ýaşamak ukybynyň çäklerine ýetýär: bu tapgyrda gaty ir dogrumda, hünärleşdirilen neonatal lukmançylyk idegi laýyk goldaw bilen ýaşamaga mümkinçilik berip biler.',
        length: 'Takmynan 30 sm',
        comparison: 'Mekgejöwen',
        bodyChanges: [
          'Sidik haltasyna basyşyň artmagy we ýygy sidik çykarmak islegi peýda bolup biler.',
        ],
        toKnow: [
          'Göwreliligiň şekerli diabeti barlagy adatça şu wagt töwereginde teklip edilýär.',
        ],
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
      da: {
        babyDescription: 'Babyen når grænsen for overlevelsesdygtighed: i tilfælde af en meget for tidlig fødsel på dette stadie kan specialiseret neonatal medicinsk pleje muliggøre overlevelse med relevant støtte.',
        length: 'Ca. 30 cm',
        comparison: 'Majskolbe',
        bodyChanges: [
          'Øget pres på blæren og hyppige vandladningstrang kan opstå.',
        ],
        toKnow: [
          'Screening for svangerskabsdiabetes tilbydes generelt på dette tidspunkt.',
        ],
      },
      sv: {
        babyDescription: 'Babyen når gränsen for overlevelsesdygtighed: i tilfälde av en mycket for tidlig födsel på dette stadie kan specialiseret neonatal medicinsk pleje muliggöre overlevelse med relevant stötte.',
        length: 'Ca. 30 cm',
        comparison: 'Majskolbe',
        bodyChanges: [
          'Öget pres på blären och hyppige vandladningstrang kan opstå.',
        ],
        toKnow: [
          'Screening for svangerskabsdiabetes tilbydes generelt på dette tidspunkt.',
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
      nb: {
        babyDescription:
          'Babyen reagerer nå på høye lyder med et støkk eller et spark, og av og til kan hikke kjennes. Den tisser jevnlig i fostervannet.',
        length: 'Omtrent 34,6 cm',
        comparison: 'Squash',
        bodyChanges: ['Halsbrann eller sure oppstøt kan bli hyppigere.'],
        toKnow: ['Fosterhikke som kjennes av og til, regnes vanligvis som normalt.'],
      },
      pl: {
        babyDescription:
          'Dziecko reaguje teraz na głośne dźwięki podskokiem lub kopnięciem, a czasem można poczuć czkawkę. Regularnie oddaje mocz do płynu owodniowego.',
        length: 'Około 34,6 cm',
        comparison: 'Cukinia',
        bodyChanges: ['Zgaga lub cofanie się kwasu żołądkowego może stać się częstsze.'],
        toKnow: ['Czkawka płodu odczuwana od czasu do czasu jest zazwyczaj uważana za normalną.'],
      },
      uk: {
        babyDescription:
          'Дитина тепер реагує на гучні звуки здриганням або штовханням, а іноді можна відчути гикавку. Вона регулярно виділяє сечу в навколоплідні води.',
        length: 'Приблизно 34,6 см',
        comparison: 'Кабачок',
        bodyChanges: ['Печія або рефлюкс кислоти можуть ставати частішими.'],
        toKnow: ['Гикавка плода, що відчувається час від часу, зазвичай вважається нормальною.'],
      },
      cs: {
        babyDescription:
          'Miminko nyní reaguje na hlasité zvuky škubnutím nebo kopnutím a občas lze ucítit škytavku. Pravidelně močí do plodové vody.',
        length: 'Asi 34,6 cm',
        comparison: 'Cuketa',
        bodyChanges: ['Pálení žáhy nebo reflux žaludeční kyseliny se mohou stát častějšími.'],
        toKnow: ['Škytavka plodu, kterou občas cítíte, se obecně považuje za normální.'],
      },
      sk: {
        babyDescription:
          'Bábätko teraz reaguje na hlasné zvuky strhnutím alebo kopnutím a môže sa občas objaviť škytavka. Pravidelne močí do plodovej vody.',
        length: 'Približne 34,6 cm',
        comparison: 'Cuketa',
        bodyChanges: [
          'Pálenie záhy alebo kyslý reflux sa môžu stať častejšími.',
        ],
        toKnow: [
          'Plodová škytavka, ktorú občas pociťujete, sa vo všeobecnosti považuje za normálnu.',
        ],
      },
      hu: {
        babyDescription:
          'A baba mostantól hangos zajokra összerezzenéssel vagy rúgással reagál, és alkalmanként csuklás is érezhető. Rendszeresen vizel a magzatvízbe.',
        length: 'Körülbelül 34,6 cm',
        comparison: 'Cukkini',
        bodyChanges: [
          'A gyomorégés vagy a savas reflux gyakoribbá válhat.',
        ],
        toKnow: [
          'Az időnként érzett magzati csuklás általában normálisnak tekinthető.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul reacționează acum la zgomotele puternice printr-un tresărit sau o lovitură, iar uneori se poate simți sughițul. Urinează în mod regulat în lichidul amniotic.',
        length: 'Aproximativ 34,6 cm',
        comparison: 'Dovlecel',
        bodyChanges: [
          'Arsurile la stomac sau refluxul acid pot deveni mai frecvente.',
        ],
        toKnow: [
          'Sughițul fetal simțit din când în când este considerat în general normal.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето вече реагира на силни шумове с трепване или ритник и понякога може да се усети хълцане. То уринира редовно в амниотичната течност.',
        length: 'Около 34,6 см',
        comparison: 'Тиквичка',
        bodyChanges: [
          'Киселини или стомашен рефлукс могат да станат по-чести.',
        ],
        toKnow: [
          'Хълцането на плода, усещано от време на време, обикновено се смята за нормално.',
        ],
      },
      sr: {
        babyDescription:
          'Беба сада реагује на гласне шумове трзајем или ударцем, а понекад се може осетити штуцање. Редовно уринира у амнионску течност.',
        length: 'Око 34,6 цм',
        comparison: 'Тиквица',
        bodyChanges: [
          'Горушица или рефлукс киселине могу постати чешћи.',
        ],
        toKnow: [
          'Штуцање плода које се понекад осећа обично се сматра нормалним.',
        ],
      },
      hr: {
        babyDescription:
          'Beba sada reagira na glasne zvukove trzajem ili udarcem, a ponekad se može osjetiti štucanje. Redovito mokri u plodnu vodu.',
        length: 'Oko 34,6 cm',
        comparison: 'Tikvica',
        bodyChanges: [
          'Žgaravica ili refluks kiseline mogu postati češći.',
        ],
        toKnow: [
          'Štucanje ploda koje se ponekad osjeća obično se smatra normalnim.',
        ],
      },
      bs: {
        babyDescription:
          'Beba sada reagira na glasne zvukove trzajem ili udarcem, a ponekad se može osjetiti štucanje. Redovito mokri u plodnu vodu.',
        length: 'Oko 34,6 cm',
        comparison: 'Tikvica',
        bodyChanges: [
          'Žgaravica ili refluks kiseline mogu postati češći.',
        ],
        toKnow: [
          'Štucanje ploda koje se ponekad osjeća obično se smatra normalnim.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček se zdaj odziva na glasne zvoke s trzljajem ali brcom, včasih pa se lahko čuti škrebet. Redno urinira v plodovnico.',
        length: 'Približno 34,6 cm',
        comparison: 'Bučka',
        bodyChanges: [
          'Zgaga ali kislinski refluks lahko postaneta pogostejša.',
        ],
        toKnow: [
          'Škrebet ploda, ki se včasih čuti, se običajno šteje za normalnega.',
        ],
      },
      ne: {
        babyDescription:
          'शिशुले अब ठूला आवाजहरूप्रति झस्किएर वा लात हानेर प्रतिक्रिया दिन्छ, र कहिलेकाहीँ हिचकी महसुस हुन सक्छ। उनी उल्बको तरलमा नियमित रूपमा पिसाब गर्छन्।',
        length: 'करिब 34.6 सेमी',
        comparison: 'ज्याउकिनी',
        bodyChanges: [
          'छातीमा पोल्ने वा एसिड रिफ्लक्स बढी बारम्बार हुन सक्छ।',
        ],
        toKnow: [
          'कहिलेकाहीँ महसुस हुने गर्भस्थ शिशुको हिचकी सामान्यतया सामान्य मानिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා දැන් උස් ශබ්දවලට හදිසි ගැස්මකින් හෝ පයින් ගැසීමකින් ප්‍රතිචාර දක්වයි, සහ ඉඳහිට සැටි ගැසීම දැනිය හැක. ඔවුන් ඇම්නියොටික් තරලයට නිතිපතා මුත්‍රා කරයි.',
        length: 'සෙ.මී. 34.6 පමණ',
        comparison: 'සුකිණි ගෙඩියක්',
        bodyChanges: [
          'ළය දැවීම හෝ ආම්ලික ආපසු ගලනය වඩා නිතර විය හැක.',
        ],
        toKnow: [
          'කලලයේ ඉඳහිට දැනෙන සැටි ගැසීම් සාමාන්‍යයෙන් සාමාන්‍ය ලෙස සැලකේ.',
        ],
      },
      th: {
        babyDescription:
          'ตอนนี้ทารกตอบสนองต่อเสียงดังด้วยการสะดุ้งหรือเตะ และอาจรู้สึกถึงการสะอึกเป็นครั้งคราว ทารกปัสสาวะลงในน้ำคร่ำเป็นประจำ',
        length: 'ประมาณ 34.6 ซม.',
        comparison: 'ซูกินี',
        bodyChanges: [
          'อาการแสบร้อนกลางอกหรือกรดไหลย้อนอาจพบบ่อยขึ้น',
        ],
        toKnow: [
          'การสะอึกของทารกในครรภ์ที่รู้สึกเป็นครั้งคราวโดยทั่วไปถือว่าปกติ',
        ],
      },
      vi: {
        babyDescription:
          'Em bé giờ đây phản ứng với tiếng động lớn bằng cách giật mình hoặc đạp, và đôi khi có thể cảm nhận được những cơn nấc. Bé thường xuyên đi tiểu vào nước ối.',
        length: 'Khoảng 34,6 cm',
        comparison: 'Quả bí ngòi',
        bodyChanges: [
          'Ợ nóng hoặc trào ngược axit có thể trở nên thường xuyên hơn.',
        ],
        toKnow: [
          'Những cơn nấc của thai nhi thỉnh thoảng cảm nhận được nhìn chung được coi là bình thường.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq endi baland shovqinlarga choʻchish yoki tepish bilan javob beradi va vaqti-vaqti bilan hiqichoq sezilishi mumkin. U amnion suyuqligiga muntazam siydik chiqaradi.',
        length: 'Taxminan 34,6 sm',
        comparison: 'Qovoqcha',
        bodyChanges: [
          'Jigʻildon qaynashi yoki kislotali reflyuks tez-tez boʻlishi mumkin.',
        ],
        toKnow: [
          'Vaqti-vaqti bilan sezilgan homila hiqichogʻi odatda normal hisoblanadi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə artıq yüksək səslərə diksinmə və ya təpik ilə reaksiya verir və bəzən hıçqırıq hiss oluna bilər. O, amnion mayesinə müntəzəm sidik ifraz edir.',
        length: 'Təxminən 34,6 sm',
        comparison: 'Zucchini',
        bodyChanges: [
          'Ürək yanması və ya turşu reflüksü daha tez-tez ola bilər.',
        ],
        toKnow: [
          'Vaxtaşırı hiss olunan cücə hıçqırığı adətən normal sayılır.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი ახლა ხმამაღალ ხმაზე შეკრთომით ან დარტყმით რეაგირებს და ზოგჯერ სლოკინი შეიძლება იგრძნოთ. ის რეგულარულად შარდავს ამნიონურ სითხეში.',
        length: 'დაახლოებით 34,6 სმ',
        comparison: 'ყაბაყი',
        bodyChanges: [
          'გულძმარვა ან მჟავას რეფლუქსი შეიძლება უფრო ხშირი გახდეს.',
        ],
        toKnow: [
          'ნაყოფის სლოკინი, რომელიც დროდადრო იგრძნობა, ზოგადად ნორმალურად ითვლება.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան այժմ արձագանքում է բարձր աղմուկներին ցնցումով կամ աքացիով, և երբեմն կարող է զգացվել ջղաձգական հեկեկոց: Նա կանոնավոր միզում է ամնիոտիկ հեղուկի մեջ:',
        length: 'Մոտ 34,6 սմ',
        comparison: 'Դդմիկ',
        bodyChanges: [
          'Այրոցը կամ թթվային ռեֆլյուքսը կարող է դառնալ ավելի հաճախակի:',
        ],
        toKnow: [
          'Պտղի ժամանակ առ ժամանակ զգացվող հեկեկոցը սովորաբար համարվում է նորմալ:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл акнун ба садоҳои баланд бо ларзиш ё лагад вокуниш нишон медиҳад ва сакка баъзан метавонад ҳис шавад. Ӯ мунтазам ба моеи амниотикӣ пешоб мекунад.',
        length: 'Тақрибан 34,6 см',
        comparison: 'Кабачок',
        bodyChanges: [
          'Синасӯзӣ ё рефлюкси кислотаӣ метавонад зуд-зудтар шавад.',
        ],
        toKnow: [
          'Саккаи ҳомила, ки гоҳ-гоҳ ҳис мешавад, одатан муқаррарӣ ҳисоб мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай эми катуу добуштарга чочуу же тепкилөө менен реакция берет, жана кээде илеп сезилиши мүмкүн. Ал амниотикалык суюктукка үзгүлтүксүз заара кылат.',
        length: 'Болжол менен 34,6 см',
        comparison: 'Кабак',
        bodyChanges: [
          'Кабынуу же кычкыл рефлюкс көбүрөөк жышташы мүмкүн.',
        ],
        toKnow: [
          'Мезгил-мезгили менен сезилген түйүлдүктүн илеби жалпысынан кадимки деп эсептелет.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek indi gaty sesler üçin gaçmak ýa-da depmek bilen jogap berýär we wagtal-wagtal ykylyk duýulyp biler. Ol amniotik suwuklyga yzygiderli sidik çykarýar.',
        length: 'Takmynan 34,6 sm',
        comparison: 'Kabaçok',
        bodyChanges: [
          'Ýürek ýanmasy ýa-da aşgazan turşy yzyna akmagy ýygylaşyp biler.',
        ],
        toKnow: [
          'Wagtal-wagtal duýulýan horuş ykylyklary umuman adaty hasaplanýar.',
        ],
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
      da: {
        babyDescription: 'Babyen reagerer nu på høje lyde med et sæt eller et spark, og lejligvise hikke kan mærkes. Den urinerer jævnligt ud i fostervandet.',
        length: 'Ca. 34,6 cm',
        comparison: 'Zucchini',
        bodyChanges: [
          'Halsbrand eller sure opstød kan blive hyppigere.',
        ],
        toKnow: [
          'Fosterhikke, der mærkes en gang imellem, anses generelt for normalt.',
        ],
      },
      sv: {
        babyDescription: 'Babyen reagerer nu på höje lyde med et sät eller et spark, och lejligvise hikke kan märkes. Den urinerer jävnligt ud i fostervandet.',
        length: 'Ca. 34,6 cm',
        comparison: 'Zucchini',
        bodyChanges: [
          'Halsbrand eller sure opstöd kan blive hyppigere.',
        ],
        toKnow: [
          'Fosterhikke, der märkes en gang imellem, anses generelt for normalt.',
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
      nb: {
        babyDescription: 'Øynene åpner seg for første gang. Den endelige fargen er vanligvis ikke kjent før flere måneder etter fødselen.',
        length: 'Omtrent 35,6 cm',
        comparison: 'Agurk',
        bodyChanges: ['Lett hevelse i anklene eller føttene kan dukke opp, særlig mot slutten av dagen.'],
        toKnow: ['Tredje trimester nærmer seg, og den medisinske oppfølgingen blir vanligvis hyppigere.'],
      },
      pl: {
        babyDescription: 'Oczy otwierają się po raz pierwszy. Ich ostateczny kolor zazwyczaj nie jest znany aż do kilku miesięcy po porodzie.',
        length: 'Około 35,6 cm',
        comparison: 'Ogórek',
        bodyChanges: ['Może pojawić się lekki obrzęk kostek lub stóp, zwłaszcza pod koniec dnia.'],
        toKnow: ['Zbliża się trzeci trymestr, a opieka medyczna staje się zazwyczaj częstsza.'],
      },
      uk: {
        babyDescription: 'Очі розплющуються вперше. Їхній остаточний колір зазвичай невідомий аж до кількох місяців після пологів.',
        length: 'Приблизно 35,6 см',
        comparison: 'Огірок',
        bodyChanges: ['Може з’явитися легкий набряк щиколоток або стоп, особливо наприкінці дня.'],
        toKnow: ['Наближається третій триместр, а медичний нагляд зазвичай стає частішим.'],
      },
      cs: {
        babyDescription: 'Oči se poprvé otevírají. Jejich konečná barva se obvykle zjistí až několik měsíců po porodu.',
        length: 'Asi 35,6 cm',
        comparison: 'Okurka',
        bodyChanges: ['Může se objevit mírný otok kotníků nebo chodidel, zejména ke konci dne.'],
        toKnow: ['Blíží se třetí trimestr a lékařské sledování se obvykle stává častějším.'],
      },
      sk: {
        babyDescription:
          'Oči sa po prvýkrát otvárajú. Ich konečná farba sa zvyčajne zistí až niekoľko mesiacov po pôrode.',
        length: 'Približne 35,6 cm',
        comparison: 'Uhorka',
        bodyChanges: [
          'Môže sa objaviť mierny opuch členkov alebo nôh, najmä ku koncu dňa.',
        ],
        toKnow: [
          'Blíži sa tretí trimester a lekárske sledovanie sa zvyčajne stáva častejším.',
        ],
      },
      hu: {
        babyDescription:
          'A szemek először nyílnak ki. Végleges színük általában csak a születés után néhány hónappal derül ki.',
        length: 'Körülbelül 35,6 cm',
        comparison: 'Uborka',
        bodyChanges: [
          'A boka vagy a láb enyhe duzzanata jelentkezhet, különösen a nap végén.',
        ],
        toKnow: [
          'Közeleg a harmadik trimeszter, és az orvosi követés általában gyakoribbá válik.',
        ],
      },
      ro: {
        babyDescription:
          'Ochii se deschid pentru prima dată. Culoarea lor finală nu va fi cunoscută în general decât după câteva luni de la naștere.',
        length: 'Aproximativ 35,6 cm',
        comparison: 'Castravete',
        bodyChanges: [
          'Poate apărea o ușoară umflare a gleznelor sau a picioarelor, în special spre sfârșitul zilei.',
        ],
        toKnow: [
          'Al treilea trimestru se apropie, iar urmărirea medicală devine în general mai frecventă.',
        ],
      },
      bg: {
        babyDescription:
          'Очите се отварят за първи път. Окончателният им цвят обикновено няма да е известен до няколко месеца след раждането.',
        length: 'Около 35,6 см',
        comparison: 'Краставица',
        bodyChanges: [
          'Може да се появи леко подуване на глезените или стъпалата, особено към края на деня.',
        ],
        toKnow: [
          'Третият триместър наближава, а медицинското проследяване обикновено става по-често.',
        ],
      },
      sr: {
        babyDescription:
          'Очи се отварају по први пут. Њихова коначна боја обично неће бити позната до неколико месеци после порођаја.',
        length: 'Око 35,6 цм',
        comparison: 'Краставац',
        bodyChanges: [
          'Може се појавити лаган оток глежњева или стопала, нарочито пред крај дана.',
        ],
        toKnow: [
          'Трећи триместар се приближава, а медицинско праћење обично постаје чешће.',
        ],
      },
      hr: {
        babyDescription:
          'Oči se otvaraju prvi put. Njihova konačna boja obično neće biti poznata do nekoliko mjeseci nakon poroda.',
        length: 'Oko 35,6 cm',
        comparison: 'Krastavac',
        bodyChanges: [
          'Može se pojaviti lagano oticanje gležnjeva ili stopala, osobito pred kraj dana.',
        ],
        toKnow: [
          'Treći trimestar se približava, a liječničko praćenje obično postaje češće.',
        ],
      },
      bs: {
        babyDescription:
          'Oči se otvaraju prvi put. Njihova konačna boja obično neće biti poznata do nekoliko mjeseci nakon porođaja.',
        length: 'Oko 35,6 cm',
        comparison: 'Krastavac',
        bodyChanges: [
          'Može se pojaviti lagano oticanje gležnjeva ili stopala, osobito pred kraj dana.',
        ],
        toKnow: [
          'Treći trimestar se približava, a ljekarsko praćenje obično postaje češće.',
        ],
      },
      sl: {
        babyDescription:
          'Oči se prvič odprejo. Njihova končna barva običajno ne bo znana do nekaj mesecev po porodu.',
        length: 'Približno 35,6 cm',
        comparison: 'Kumara',
        bodyChanges: [
          'Lahko se pojavi rahlo otekanje gležnjev ali stopal, zlasti proti koncu dneva.',
        ],
        toKnow: [
          'Tretje trimesečje se bliža, zdravniško spremljanje pa običajno postane pogostejše.',
        ],
      },
      ne: {
        babyDescription:
          'आँखाहरू पहिलो पटक खुल्छन्। तिनको अन्तिम रङ सामान्यतया जन्मपछि धेरै महिनासम्म थाहा हुँदैन।',
        length: 'करिब 35.6 सेमी',
        comparison: 'काँक्रो',
        bodyChanges: [
          'खुट्टाको गोली वा पैतालामा हल्का सुन्निने देखिन सक्छ, विशेष गरी दिनको अन्त्यतिर।',
        ],
        toKnow: [
          'तेस्रो त्रैमासिक नजिकिँदै छ, चिकित्सकीय फलोअप सामान्यतया बढी बारम्बार हुँदै।',
        ],
      },
      si: {
        babyDescription:
          'ඇස් පළමු වරට විවෘත වේ. ඔවුන්ගේ අවසාන වර්ණය සාමාන්‍යයෙන් උපතින් මාස කිහිපයකට පසුව පමණක් දැනගත හැක.',
        length: 'සෙ.මී. 35.6 පමණ',
        comparison: 'පිපිඤ්ඤා ගෙඩියක්',
        bodyChanges: [
          'විශේෂයෙන් දවස අවසානය වන විට, වළලුකරවල හෝ පාදවල සුළු ඉදිමීමක් දිස්විය හැක.',
        ],
        toKnow: [
          'තෙවන ත්‍රෛමාසිකය ළං වන අතර, වෛද්‍ය පසු විපරම සාමාන්‍යයෙන් වඩා නිතර වේ.',
        ],
      },
      th: {
        babyDescription:
          'ดวงตาเปิดเป็นครั้งแรก สีสุดท้ายโดยทั่วไปจะทราบหลังคลอดหลายเดือน',
        length: 'ประมาณ 35.6 ซม.',
        comparison: 'แตงกวา',
        bodyChanges: [
          'อาจมีอาการบวมเล็กน้อยที่ข้อเท้าหรือเท้า โดยเฉพาะปลายวัน',
        ],
        toKnow: [
          'ไตรมาสที่สามใกล้เข้ามา โดยการติดตามทางการแพทย์มักถี่ขึ้น',
        ],
      },
      vi: {
        babyDescription:
          'Đôi mắt mở ra lần đầu tiên. Màu mắt cuối cùng của bé thường chưa biết cho đến vài tháng sau khi sinh.',
        length: 'Khoảng 35,6 cm',
        comparison: 'Quả dưa chuột',
        bodyChanges: [
          'Có thể xuất hiện sưng nhẹ ở mắt cá chân hoặc bàn chân, đặc biệt vào cuối ngày.',
        ],
        toKnow: [
          'Tam cá nguyệt thứ ba đang đến gần, với việc theo dõi y tế thường trở nên thường xuyên hơn.',
        ],
      },
      uz: {
        babyDescription:
          'Koʻzlar birinchi marta ochiladi. Ularning yakuniy rangi odatda tugʻilgandan keyin bir necha oy oʻtgach maʼlum boʻladi.',
        length: 'Taxminan 35,6 sm',
        comparison: 'Bodring',
        bodyChanges: [
          'Oyoq boʻgʻimlari yoki oyoqlarning yengil shishi, ayniqsa kun oxiriga kelib, paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Uchinchi trimestr yaqinlashmoqda, tibbiy nazorat odatda tez-tezlashadi.',
        ],
      },
      az: {
        babyDescription:
          'Gözlər ilk dəfə açılır. Onların son rəngi adətən doğuşdan bir neçə ay sonra məlum olur.',
        length: 'Təxminən 35,6 sm',
        comparison: 'Xıyar',
        bodyChanges: [
          'Topuqlarda və ya ayaqlarda yüngül şişkinlik, xüsusilə günün sonuna doğru görünə bilər.',
        ],
        toKnow: [
          'Üçüncü trimestr yaxınlaşır, tibbi nəzarət adətən tez-tez olmağa başlayır.',
        ],
      },
      ka: {
        babyDescription:
          'თვალები პირველად იხსნება. მათი საბოლოო ფერი ზოგადად მხოლოდ დაბადებიდან რამდენიმე თვის შემდეგ გახდება ცნობილი.',
        length: 'დაახლოებით 35,6 სმ',
        comparison: 'კიტრი',
        bodyChanges: [
          'კოჭების ან ტერფების მსუბუქი შეშუპება შეიძლება გამოჩნდეს, განსაკუთრებით დღის ბოლოს.',
        ],
        toKnow: [
          'მესამე ტრიმესტრი უახლოვდება, სამედიცინო მეთვალყურეობა ზოგადად უფრო ხშირი ხდება.',
        ],
      },
      hy: {
        babyDescription:
          'Աչքերը բացվում են առաջին անգամ: Դրանց վերջնական գույնը սովորաբար հայտնի չի լինի ծնվելուց մի քանի ամիս անց:',
        length: 'Մոտ 35,6 սմ',
        comparison: 'Վարունգ',
        bodyChanges: [
          'Կոճերի կամ ոտնաթաթերի թեթև այտուց կարող է հայտնվել, հատկապես օրվա վերջում:',
        ],
        toKnow: [
          'Երրորդ եռամսյակը մոտենում է, բժշկական հսկողությունը սովորաբար դառնում է ավելի հաճախակի:',
        ],
      },
      tg: {
        babyDescription:
          'Чашмон бори аввал кушода мешаванд. Рангҳои ниҳоии онҳо одатан то чанд моҳ пас аз таваллуд маълум нахоҳад шуд.',
        length: 'Тақрибан 35,6 см',
        comparison: 'Бодиринг',
        bodyChanges: [
          'Варами сабуки тағоякҳо ё пойҳо метавонад пайдо шавад, хусусан ба охири рӯз.',
        ],
        toKnow: [
          'Триместри севум наздик мешавад ва назорати тиббӣ одатан зуд-зудтар мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Көздөр биринчи жолу ачылат. Алардын акыркы түсү төрөттөн кийин бир нече айдан кийин гана белгилүү болот.',
        length: 'Болжол менен 35,6 см',
        comparison: 'Бадыраң',
        bodyChanges: [
          'Тобук чормолорунун же буттун жеңил шишиги, айрыкча күндүн аягында, пайда болушу мүмкүн.',
        ],
        toKnow: [
          'Үчүнчү триместр жакындап келет, медициналык көзөмөл жалпысынан жыштайт.',
        ],
      },
      tk: {
        babyDescription:
          'Gözler ilkinji gezek açylýar. Olaryň soňky reňki adatça diňe dograndan birnäçe aý soň belli bolar.',
        length: 'Takmynan 35,6 sm',
        comparison: 'Hyýar',
        bodyChanges: [
          'Aýak topugynyň ýa-da aýaklaryň ýeňil çişmegi, aýratyn-da günüň ahyrynda, peýda bolup biler.',
        ],
        toKnow: [
          'Üçünji trimestr ýakynlaşýar, lukmançylyk yzarlamasy adatça ýygylaşýar.',
        ],
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
      da: {
        babyDescription: 'Øjnene åbner sig for første gang. Deres endelige farve vil generelt ikke kendes før flere måneder efter fødslen.',
        length: 'Ca. 35,6 cm',
        comparison: 'Agurk',
        bodyChanges: [
          'Let hævelse af ankler eller fødder kan opstå, særligt ved dagens slutning.',
        ],
        toKnow: [
          'Tredje trimester nærmer sig, og den medicinske opfølgning bliver generelt hyppigere.',
        ],
      },
      sv: {
        babyDescription: 'Öjnene åbner sig for förste gang. Deres endelige farve vil generelt inte kendes för flere måneder efter födslen.',
        length: 'Ca. 35,6 cm',
        comparison: 'Agurk',
        bodyChanges: [
          'Let hävelse av ankler eller födder kan opstå, särligt ved dagens slutning.',
        ],
        toKnow: [
          'Tredje trimester närmer sig, och den medicinske opfölgning bliver generelt hyppigere.',
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
      nb: {
        babyDescription:
          'Lungene blir i stand til å sette i gang pustingen, og babyen fortsetter å fylle ut etter hvert som fett legges inn under huden.',
        length: 'Omtrent 36,6 cm',
        comparison: 'Blomkål',
        bodyChanges: ['Tretthet kan komme tilbake når kroppen din bærer en stadig økende vekt.'],
        toKnow: ['Starten på tredje trimester er ofte et godt tidspunkt for å begynne å tenke på fødselsplanen din.'],
      },
      pl: {
        babyDescription:
          'Płuca stają się zdolne do rozpoczęcia oddychania, a dziecko nadal się zaokrągla, gdy pod skórą odkłada się tkanka tłuszczowa.',
        length: 'Około 36,6 cm',
        comparison: 'Kalafior',
        bodyChanges: ['Zmęczenie może wrócić, gdy Twoje ciało dźwiga coraz większy ciężar.'],
        toKnow: ['Początek trzeciego trymestru to często dobry moment, by zacząć myśleć o planie porodu.'],
      },
      uk: {
        babyDescription:
          'Легені стають здатними розпочати дихання, а дитина продовжує округлюватися, коли під шкірою відкладається жирова тканина.',
        length: 'Приблизно 36,6 см',
        comparison: 'Цвітна капуста',
        bodyChanges: ['Втома може повернутися, коли ваше тіло несе дедалі більшу вагу.'],
        toKnow: ['Початок третього триместру — часто слушний момент, щоб почати думати про план пологів.'],
      },
      cs: {
        babyDescription:
          'Plíce se stávají schopnými zahájit dýchání a miminko dál nabírá na objemu, jak se pod kůží ukládá tuk.',
        length: 'Asi 36,6 cm',
        comparison: 'Květák',
        bodyChanges: ['Únava se může vrátit, jak vaše tělo nese stále větší váhu.'],
        toKnow: ['Začátek třetího trimestru je často dobrá doba, kdy začít přemýšlet o porodním plánu.'],
      },
      sk: {
        babyDescription:
          'Pľúca sa stávajú schopnými spustiť dýchanie a bábätko sa naďalej zaobľuje, ako sa pod kožou ukladá tuk.',
        length: 'Približne 36,6 cm',
        comparison: 'Karfiol',
        bodyChanges: [
          'Únava sa môže vrátiť, keď vaše telo nesie čoraz väčšiu hmotnosť.',
        ],
        toKnow: [
          'Začiatok tretieho trimestra je často dobrým časom začať premýšľať o pôrodnom pláne.',
        ],
      },
      hu: {
        babyDescription:
          'A tüdő képessé válik a légzés megindítására, és a baba tovább gömbölyödik, ahogy a bőr alatt zsír rakódik le.',
        length: 'Körülbelül 36,6 cm',
        comparison: 'Karfiol',
        bodyChanges: [
          'A fáradtság visszatérhet, ahogy a tested egyre nagyobb súlyt hordoz.',
        ],
        toKnow: [
          'A harmadik trimeszter kezdete gyakran jó alkalom arra, hogy elkezdj gondolkodni a szülési tervedről.',
        ],
      },
      ro: {
        babyDescription:
          'Plămânii devin capabili să inițieze respirația, iar bebelușul continuă să se rotunjească pe măsură ce grăsimea se depune sub piele.',
        length: 'Aproximativ 36,6 cm',
        comparison: 'Conopidă',
        bodyChanges: [
          'Oboseala poate reveni pe măsură ce corpul tău poartă o greutate tot mai mare.',
        ],
        toKnow: [
          'Începutul celui de-al treilea trimestru este adesea un moment bun pentru a începe să te gândești la planul tău de naștere.',
        ],
      },
      bg: {
        babyDescription:
          'Белите дробове стават способни да започнат дишане, а бебето продължава да се закръглява, докато под кожата се натрупват мастни запаси.',
        length: 'Около 36,6 см',
        comparison: 'Карфиол',
        bodyChanges: [
          'Умората може да се върне, докато тялото ти носи нарастващо тегло.',
        ],
        toKnow: [
          'Началото на третия триместър често е добър момент да започнеш да мислиш за плана си за раждането.',
        ],
      },
      sr: {
        babyDescription:
          'Плућа постају способна да започну дисање, а беба наставља да се заобљује док се масно ткиво таложи испод коже.',
        length: 'Око 36,6 цм',
        comparison: 'Карфиол',
        bodyChanges: [
          'Умор се може вратити пошто твоје тело носи све већу тежину.',
        ],
        toKnow: [
          'Почетак трећег триместра често је добар тренутак да почнеш да размишљаш о свом плану порођаја.',
        ],
      },
      hr: {
        babyDescription:
          'Pluća postaju sposobna započeti disanje, a beba se nastavlja zaobljavati dok se masno tkivo taloži ispod kože.',
        length: 'Oko 36,6 cm',
        comparison: 'Cvjetača',
        bodyChanges: [
          'Umor se može vratiti jer tvoje tijelo nosi sve veću težinu.',
        ],
        toKnow: [
          'Početak trećeg trimestra često je dobar trenutak da počneš razmišljati o svom planu poroda.',
        ],
      },
      bs: {
        babyDescription:
          'Pluća postaju sposobna započeti disanje, a beba se nastavlja zaobljavati dok se masno tkivo taloži ispod kože.',
        length: 'Oko 36,6 cm',
        comparison: 'Karfiol',
        bodyChanges: [
          'Umor se može vratiti jer tvoje tijelo nosi sve veću težinu.',
        ],
        toKnow: [
          'Početak trećeg trimestra često je dobar trenutak da počneš razmišljati o svom planu porođaja.',
        ],
      },
      sl: {
        babyDescription:
          'Pljuča postanejo sposobna začeti dihanje, dojenček pa se še naprej zaobljuje, medtem ko se maščobno tkivo nalaga pod kožo.',
        length: 'Približno 36,6 cm',
        comparison: 'Cvetača',
        bodyChanges: [
          'Utrujenost se lahko vrne, ker tvoje telo nosi vse večjo težo.',
        ],
        toKnow: [
          'Začetek tretjega trimesečja je pogosto dober trenutek, da začneš razmišljati o svojem načrtu poroda.',
        ],
      },
      ne: {
        babyDescription:
          'फोक्सो सास फेर्न सुरु गर्न सक्षम हुन्छन्, र छालामुनि बोसो जम्मा हुँदा शिशु अझै गोलो हुँदै जान्छ।',
        length: 'करिब 36.6 सेमी',
        comparison: 'काउली',
        bodyChanges: [
          'तपाईंको शरीरले बढ्दो तौल बोक्दा थकान फर्कन सक्छ।',
        ],
        toKnow: [
          'तेस्रो त्रैमासिकको सुरुवात प्रायः आफ्नो प्रसव योजनाबारे सोच्न थाल्ने राम्रो समय हो।',
        ],
      },
      si: {
        babyDescription:
          'පෙණහලුවලට හුස්ම ගැනීම ආරම්භ කිරීමට හැකියාව ලැබේ, සහ සම යට මේද තැන්පත් වන විට දරුවා පිරී යාම දිගටම කරගෙන යයි.',
        length: 'සෙ.මී. 36.6 පමණ',
        comparison: 'මල් ගෝවා ගෙඩියක්',
        bodyChanges: [
          'ඔබේ ශරීරය වැඩෙන බරක් දරන විට වෙහෙස නැවත පැමිණිය හැක.',
        ],
        toKnow: [
          'තෙවන ත්‍රෛමාසිකයේ ආරම්භය ඔබේ ප්‍රසූත සැලැස්ම ගැන සිතීම ආරම්භ කිරීමට බොහෝ විට හොඳ වේලාවකි.',
        ],
      },
      th: {
        babyDescription:
          'ปอดสามารถเริ่มหายใจได้ และทารกยังคงอวบขึ้นเมื่อไขมันสะสมใต้ผิวหนัง',
        length: 'ประมาณ 36.6 ซม.',
        comparison: 'ดอกกะหล่ำ',
        bodyChanges: [
          'ความเหนื่อยล้าอาจกลับมาเมื่อร่างกายแบกน้ำหนักที่เพิ่มขึ้น',
        ],
        toKnow: [
          'ต้นไตรมาสที่สามมักเป็นเวลาที่ดีที่จะเริ่มคิดเรื่องแผนการคลอดของคุณ',
        ],
      },
      vi: {
        babyDescription:
          'Phổi trở nên có khả năng bắt đầu hô hấp, và em bé tiếp tục đầy đặn hơn khi mỡ tích tụ dưới da.',
        length: 'Khoảng 36,6 cm',
        comparison: 'Súp lơ',
        bodyChanges: [
          'Mệt mỏi có thể quay lại khi cơ thể bạn mang trọng lượng ngày càng tăng.',
        ],
        toKnow: [
          'Đầu tam cá nguyệt thứ ba thường là thời điểm tốt để bắt đầu nghĩ đến kế hoạch sinh của bạn.',
        ],
      },
      uz: {
        babyDescription:
          'Oʻpkalar nafas olishni boshlashga qodir boʻladi va chaqaloq teri ostida yogʻ toʻplanishi bilan toʻlishishda davom etadi.',
        length: 'Taxminan 36,6 sm',
        comparison: 'Gulkaram',
        bodyChanges: [
          'Tanangiz ortib borayotgan ogʻirlikni koʻtarayotgani sababli charchoq qaytishi mumkin.',
        ],
        toKnow: [
          'Uchinchi trimestr boshlanishi koʻpincha tugʻruq rejangiz haqida oʻylashni boshlash uchun yaxshi vaqt.',
        ],
      },
      az: {
        babyDescription:
          'Ağciyərlər nəfəsi başlatmaq qabiliyyəti qazanır və piy dəri altında toplandıqca körpə dolmağa davam edir.',
        length: 'Təxminən 36,6 sm',
        comparison: 'Gül kələm',
        bodyChanges: [
          'Bədəniniz artan çəki daşıdıqca yorğunluq geri qayıda bilər.',
        ],
        toKnow: [
          'Üçüncü trimestrin başlanğıcı doğuş planınız barədə düşünməyə başlamaq üçün çox vaxt yaxşı vaxtdır.',
        ],
      },
      ka: {
        babyDescription:
          'ფილტვები სუნთქვის დაწყების უნარს იძენს და ბავშვი აგრძელებს შევსებას, რადგან კანქვეშ ცხიმი გროვდება.',
        length: 'დაახლოებით 36,6 სმ',
        comparison: 'ყვავილოვანი კომბოსტო',
        bodyChanges: [
          'დაღლილობა შეიძლება დაბრუნდეს, რადგან თქვენი სხეული მზარდ წონას ატარებს.',
        ],
        toKnow: [
          'მესამე ტრიმესტრის დასაწყისი ხშირად კარგი დროა, რომ მშობიარობის გეგმაზე ფიქრი დაიწყოთ.',
        ],
      },
      hy: {
        babyDescription:
          'Թոքերը դառնում են շնչառություն սկսելու ընդունակ, և երեխան շարունակում է լցվել, քանի որ մաշկի տակ ճարպային նստվածքներ են կուտակվում:',
        length: 'Մոտ 36,6 սմ',
        comparison: 'Ծաղկակաղամբ',
        bodyChanges: [
          'Հոգնածությունը կարող է վերադառնալ, քանի որ ձեր մարմինը կրում է աճող քաշ:',
        ],
        toKnow: [
          'Երրորդ եռամսյակի սկիզբը հաճախ լավ ժամանակ է՝ ձեր ծննդաբերության պլանի մասին մտածելու սկսելու համար:',
        ],
      },
      tg: {
        babyDescription:
          'Шушҳо қобилияти оғози нафаскаширо пайдо мекунанд ва тифл ҳангоми ҷамъ шудани равған дар зери пӯст пур шуданро идома медиҳад.',
        length: 'Тақрибан 36,6 см',
        comparison: 'Гулкарам',
        bodyChanges: [
          'Хастагӣ метавонад баргардад, ҳангоме ки бадани шумо миқдори афзояндаи вазнро мебардорад.',
        ],
        toKnow: [
          'Оғози триместри севум аксар вақт вақти хубест барои фикр кардан дар бораи нақшаи таваллуди шумо.',
        ],
      },
      ky: {
        babyDescription:
          'Өпкө дем алууну баштоого жөндөмдүү болот, ал эми ымыркай тери астында май топтолгон сайын толууну улантат.',
        length: 'Болжол менен 36,6 см',
        comparison: 'Түймөчө капуста',
        bodyChanges: [
          'Денеңиз өсүп жаткан салмакты көтөргөндө чарчоо кайра пайда болушу мүмкүн.',
        ],
        toKnow: [
          'Үчүнчү триместрдин башталышы төрөт планыңыз жөнүндө ойлоно баштоо үчүн көбүнчө жакшы убакыт.',
        ],
      },
      tk: {
        babyDescription:
          'Öýkenler dem almagy başlamaga ukyply bolýar we bäbek deri aşagynda ýag toplanmagy bilen dolmagyny dowam etdirýär.',
        length: 'Takmynan 36,6 sm',
        comparison: 'Gül kelem',
        bodyChanges: [
          'Bedeniňiz barha artýan agramy göterýärkä ýadawlyk gaýdyp gelip biler.',
        ],
        toKnow: [
          'Üçünji trimestriň başy köplenç dogrum meýilnamaňyz hakda pikir etmäge başlamak üçin gowy wagt.',
        ],
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
      da: {
        babyDescription: 'Lungerne bliver i stand til at starte vejrtrækning, og babyen fortsætter med at fylde ud efterhånden som fedt aflejres under huden.',
        length: 'Ca. 36,6 cm',
        comparison: 'Blomkål',
        bodyChanges: [
          'Træthed kan vende tilbage, efterhånden som din krop bærer en voksende mængde vægt.',
        ],
        toKnow: [
          'Starten af tredje trimester er ofte et godt tidspunkt at begynde at tænke på din fødselsplan.',
        ],
      },
      sv: {
        babyDescription: 'Lungerne bliver i stand till at starte vejrträkning, och babyen fortsätter med at fylde ud efterhånden som fedt aflejres under huden.',
        length: 'Ca. 36,6 cm',
        comparison: 'Blomkål',
        bodyChanges: [
          'Träthed kan vende tilbage, efterhånden som din krop bärer en voksende mängde vägt.',
        ],
        toKnow: [
          'Starten av tredje trimester ar ofte et godt tidspunkt at begynde at tänke på din födselsplan.',
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
      nb: {
        babyDescription:
          'Hjertefrekvensen, som var raskere helt tidlig i svangerskapet, har stabilisert seg på omtrent 130 til 140 slag i minuttet og kan nå høres med et stetoskop.',
        length: 'Omtrent 37,6 cm',
        comparison: 'Aubergine',
        bodyChanges: ['Kortpustethet eller halsbrann kan bli hyppigere når livmoren tar mer plass.'],
        toKnow: ['Tredje trimester begynner vanligvis rundt denne uken, og timene blir hyppigere.'],
      },
      pl: {
        babyDescription:
          'Tętno, szybsze na samym początku ciąży, ustabilizowało się na poziomie około 130–140 uderzeń na minutę i można je teraz usłyszeć stetoskopem.',
        length: 'Około 37,6 cm',
        comparison: 'Bakłażan',
        bodyChanges: ['Duszność lub zgaga mogą stać się częstsze, gdy macica zajmuje więcej miejsca.'],
        toKnow: ['Trzeci trymestr zaczyna się zazwyczaj mniej więcej w tym tygodniu, a wizyty stają się częstsze.'],
      },
      uk: {
        babyDescription:
          'Серцебиття, швидше на самому початку вагітності, стабілізувалося на рівні приблизно 130–140 ударів на хвилину й тепер його можна почути стетоскопом.',
        length: 'Приблизно 37,6 см',
        comparison: 'Баклажан',
        bodyChanges: ['Задишка або печія можуть ставати частішими, коли матка займає більше місця.'],
        toKnow: ['Третій триместр зазвичай починається приблизно цього тижня, а візити стають частішими.'],
      },
      cs: {
        babyDescription:
          'Srdeční frekvence, na samém počátku těhotenství rychlejší, se ustálila na zhruba 130 až 140 úderech za minutu a nyní ji lze slyšet stetoskopem.',
        length: 'Asi 37,6 cm',
        comparison: 'Lilek',
        bodyChanges: ['Dušnost nebo pálení žáhy se mohou stát častějšími, jak děloha zabírá více místa.'],
        toKnow: ['Třetí trimestr obvykle začíná kolem tohoto týdne, s častějšími návštěvami.'],
      },
      sk: {
        babyDescription:
          'Srdcová frekvencia, rýchlejšia na úplnom začiatku tehotenstva, sa ustálila na približne 130 až 140 úderoch za minútu a dá sa teraz počuť fonendoskopom.',
        length: 'Približne 37,6 cm',
        comparison: 'Baklažán',
        bodyChanges: [
          'Dýchavičnosť alebo pálenie záhy sa môžu stať častejšími, keď maternica zaberá viac miesta.',
        ],
        toKnow: [
          'Tretí trimester sa zvyčajne začína okolo tohto týždňa, s častejšími návštevami.',
        ],
      },
      hu: {
        babyDescription:
          'A szívritmus, amely a terhesség nagyon korai szakaszában gyorsabb volt, percenként körülbelül 130–140 ütésre állt be, és mostantól sztetoszkóppal hallható.',
        length: 'Körülbelül 37,6 cm',
        comparison: 'Padlizsán',
        bodyChanges: [
          'A légszomj vagy a gyomorégés gyakoribbá válhat, ahogy a méh több helyet foglal el.',
        ],
        toKnow: [
          'A harmadik trimeszter általában e hét körül kezdődik, gyakoribb időpontokkal.',
        ],
      },
      ro: {
        babyDescription:
          'Ritmul cardiac, mai rapid la începutul sarcinii, s-a stabilizat în jurul a 130 până la 140 de bătăi pe minut și poate fi acum auzit cu un stetoscop.',
        length: 'Aproximativ 37,6 cm',
        comparison: 'Vânătă',
        bodyChanges: [
          'Lipsa de aer sau arsurile la stomac pot deveni mai frecvente pe măsură ce uterul ocupă mai mult loc.',
        ],
        toKnow: [
          'Al treilea trimestru începe în general în jurul acestei săptămâni, cu consultații tot mai frecvente.',
        ],
      },
      bg: {
        babyDescription:
          'Сърдечният ритъм, по-бърз в самото начало на бременността, се е стабилизирал около 130 до 140 удара в минута и вече може да се чуе със стетоскоп.',
        length: 'Около 37,6 см',
        comparison: 'Патладжан',
        bodyChanges: [
          'Задухът или киселините могат да станат по-чести, докато матката заема повече място.',
        ],
        toKnow: [
          'Третият триместър обикновено започва около тази седмица, като прегледите стават по-чести.',
        ],
      },
      sr: {
        babyDescription:
          'Срчани ритам, бржи на самом почетку трудноће, стабилизовао се на око 130 до 140 откуцаја у минути и сада се може чути стетоскопом.',
        length: 'Око 37,6 цм',
        comparison: 'Плави патлиџан',
        bodyChanges: [
          'Недостатак даха или горушица могу постати чешћи како материца заузима више места.',
        ],
        toKnow: [
          'Трећи триместар обично почиње око ове недеље, а прегледи постају чешћи.',
        ],
      },
      hr: {
        babyDescription:
          'Srčani ritam, brži na samom početku trudnoće, stabilizirao se na oko 130 do 140 otkucaja u minuti i sada se može čuti stetoskopom.',
        length: 'Oko 37,6 cm',
        comparison: 'Patlidžan',
        bodyChanges: [
          'Nedostatak zraka ili žgaravica mogu postati češći kako maternica zauzima više prostora.',
        ],
        toKnow: [
          'Treći trimestar obično počinje oko ovog tjedna, a pregledi postaju češći.',
        ],
      },
      bs: {
        babyDescription:
          'Srčani ritam, brži na samom početku trudnoće, stabilizirao se na oko 130 do 140 otkucaja u minuti i sada se može čuti stetoskopom.',
        length: 'Oko 37,6 cm',
        comparison: 'Patlidžan',
        bodyChanges: [
          'Nedostatak zraka ili žgaravica mogu postati češći kako maternica zauzima više prostora.',
        ],
        toKnow: [
          'Treći trimestar obično počinje oko ove sedmice, a pregledi postaju češći.',
        ],
      },
      sl: {
        babyDescription:
          'Srčni ritem, hitrejši na samem začetku nosečnosti, se je stabiliziral na približno 130 do 140 utripov na minuto in ga je zdaj mogoče slišati s stetoskopom.',
        length: 'Približno 37,6 cm',
        comparison: 'Jajčevec',
        bodyChanges: [
          'Pomanjkanje zraka ali zgaga lahko postaneta pogostejša, ko maternica zavzema več prostora.',
        ],
        toKnow: [
          'Tretje trimesečje običajno začne okoli tega tedna, pregledi pa postanejo pogostejši.',
        ],
      },
      ne: {
        babyDescription:
          'गर्भावस्थाको एकदमै सुरुमा छिटो रहेको मुटुको गति करिब प्रति मिनेट 130 देखि 140 धड्कनमा स्थिर भएको छ र अब स्टेथोस्कोपले सुन्न सकिन्छ।',
        length: 'करिब 37.6 सेमी',
        comparison: 'भण्टा',
        bodyChanges: [
          'गर्भाशयले बढी ठाउँ लिँदा सास फेर्न गाह्रो वा छातीमा पोल्ने बढी बारम्बार हुन सक्छ।',
        ],
        toKnow: [
          'तेस्रो त्रैमासिक सामान्यतया यही हप्ताको वरिपरि सुरु हुन्छ, भेटघाटहरू बढी बारम्बार हुँदै।',
        ],
      },
      si: {
        babyDescription:
          'ඉතා මුල් ගර්භණී කාලයේ වේගවත්ව තිබූ හෘද ස්පන්දන වේගය විනාඩියකට ස්පන්දන 130 සිට 140 දක්වා ස්ථාවර වී ඇති අතර දැන් ස්ටෙතොස්කෝපයකින් ඇසිය හැක.',
        length: 'සෙ.මී. 37.6 පමණ',
        comparison: 'වම්බටු ගෙඩියක්',
        bodyChanges: [
          'ගර්භාෂය වැඩි ඉඩක් ගන්නා විට හුස්ම හිරවීම හෝ ළය දැවීම වඩා නිතර විය හැක.',
        ],
        toKnow: [
          'තෙවන ත්‍රෛමාසිකය සාමාන්‍යයෙන් මෙම සතිය වටා ආරම්භ වන අතර, හමුවීම් වඩා නිතර වේ.',
        ],
      },
      th: {
        babyDescription:
          'อัตราการเต้นของหัวใจซึ่งเร็วกว่าในช่วงต้นของการตั้งครรภ์ คงที่ที่ราว 130 ถึง 140 ครั้งต่อนาที และตอนนี้ได้ยินด้วยหูฟังแพทย์ได้',
        length: 'ประมาณ 37.6 ซม.',
        comparison: 'มะเขือยาว',
        bodyChanges: [
          'อาการหายใจลำบากหรือแสบร้อนกลางอกอาจพบบ่อยขึ้นเมื่อมดลูกใช้พื้นที่มากขึ้น',
        ],
        toKnow: [
          'โดยทั่วไปไตรมาสที่สามเริ่มราวสัปดาห์นี้ โดยการนัดหมายถี่ขึ้น',
        ],
      },
      vi: {
        babyDescription:
          'Nhịp tim, nhanh hơn ở giai đoạn rất sớm của thai kỳ, đã ổn định ở khoảng 130 đến 140 nhịp mỗi phút và giờ có thể nghe được bằng ống nghe.',
        length: 'Khoảng 37,6 cm',
        comparison: 'Quả cà tím',
        bodyChanges: [
          'Khó thở hoặc ợ nóng có thể trở nên thường xuyên hơn khi tử cung chiếm nhiều chỗ hơn.',
        ],
        toKnow: [
          'Tam cá nguyệt thứ ba thường bắt đầu vào khoảng tuần này, với các buổi hẹn trở nên thường xuyên hơn.',
        ],
      },
      uz: {
        babyDescription:
          'Homiladorlikning juda erta davrida tezroq boʻlgan yurak urishi daqiqasiga taxminan 130 dan 140 gacha barqarorlashdi va endi stetoskop bilan eshitilishi mumkin.',
        length: 'Taxminan 37,6 sm',
        comparison: 'Baqlajon',
        bodyChanges: [
          'Bachadon koʻproq joy egallagani sari nafas qisilishi yoki jigʻildon qaynashi tez-tez boʻlishi mumkin.',
        ],
        toKnow: [
          'Uchinchi trimestr odatda shu hafta atrofida boshlanadi, qabullar tez-tezlashadi.',
        ],
      },
      az: {
        babyDescription:
          'Ən erkən hamiləlikdə daha sürətli olan ürək dərəcəsi dəqiqədə təxminən 130–140 döyüntüdə sabitləşib və indi stetoskopla eşidilə bilər.',
        length: 'Təxminən 37,6 sm',
        comparison: 'Badımcan',
        bodyChanges: [
          'Uşaqlıq daha çox yer tutdıqca nəfəs darlığı və ya ürək yanması daha tez-tez ola bilər.',
        ],
        toKnow: [
          'Üçüncü trimestr adətən bu həftə ətrafında başlayır, qəbullar isə tez-tez olur.',
        ],
      },
      ka: {
        babyDescription:
          'გულისცემის სიხშირე, რომელიც ძალიან ადრეულ ორსულობაში უფრო სწრაფი იყო, წუთში დაახლოებით 130-დან 140 დარტყმამდე დასტაბილურდა და ახლა სტეტოსკოპით ისმის.',
        length: 'დაახლოებით 37,6 სმ',
        comparison: 'ბადრიჯანი',
        bodyChanges: [
          'სუნთქვის უკმარისობა ან გულძმარვა შეიძლება უფრო ხშირი გახდეს, რადგან საშვილოსნო მეტ სივრცეს იკავებს.',
        ],
        toKnow: [
          'მესამე ტრიმესტრი ზოგადად დაახლოებით ამ კვირას იწყება, ვიზიტები უფრო ხშირი ხდება.',
        ],
      },
      hy: {
        babyDescription:
          'Սրտի զարկերը, որոնք հղիության շատ վաղ շրջանում ավելի արագ էին, կայունացել են րոպեում մոտ 130–140 զարկի շուրջ և այժմ կարող են լսվել ստետոսկոպով:',
        length: 'Մոտ 37,6 սմ',
        comparison: 'Սմբուկ',
        bodyChanges: [
          'Շնչահեղձությունը կամ այրոցը կարող է դառնալ ավելի հաճախակի, քանի որ արգանդը ավելի շատ տարածք է զբաղեցնում:',
        ],
        toKnow: [
          'Երրորդ եռամսյակը սովորաբար սկսվում է մոտ այս շաբաթում՝ այցերի ավելի հաճախակի դառնալով:',
        ],
      },
      tg: {
        babyDescription:
          'Суръати набзи дил, ки дар аввали ҳомиладорӣ зудтар буд, ба тақрибан 130 то 140 зарба дар як дақиқа устувор шудааст ва акнун бо стетоскоп шунида мешавад.',
        length: 'Тақрибан 37,6 см',
        comparison: 'Бодинҷон',
        bodyChanges: [
          'Тангии нафас ё синасӯзӣ метавонад зуд-зудтар шавад, ҳангоме ки бачадон ҷои бештар мегирад.',
        ],
        toKnow: [
          'Триместри севум одатан дар атрофи ҳамин ҳафта оғоз мешавад ва қабулҳо зуд-зудтар мешаванд.',
        ],
      },
      ky: {
        babyDescription:
          'Абдан эрте курсактуулукта ылдамыраак болгон жүрөк согушу мүнөтүнө болжол менен 130–140 согууга турукташты жана эми стетоскоп менен угулат.',
        length: 'Болжол менен 37,6 см',
        comparison: 'Баклажан',
        bodyChanges: [
          'Жатын көбүрөөк орун ээлегенде дем жетишсиздиги же кабынуу жышташы мүмкүн.',
        ],
        toKnow: [
          'Үчүнчү триместр адатта ушул жумада башталат, кабыл алуулар жыштайт.',
        ],
      },
      tk: {
        babyDescription:
          'Göwreliligiň gaty irki döwründe çalt bolan ýürek urgusy minutda takmynan 130–140 urguda durnuklaşdy we indi stetoskop bilen diňlenip bilner.',
        length: 'Takmynan 37,6 sm',
        comparison: 'Badyrjan',
        bodyChanges: [
          'Ýatgy has köp ýer eýelände dem ýetmezçiligi ýa-da ýürek ýanmasy ýygylaşyp biler.',
        ],
        toKnow: [
          'Üçünji trimestr adatça şu hepde töwereginde başlaýar, kabul edişler barha ýygylaşýar.',
        ],
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
      da: {
        babyDescription: 'Hjertefrekvensen, der var hurtigere tidligt i graviditeten, har stabiliseret sig på ca. 130 til 140 slag i minuttet og kan nu høres med et stetoskop.',
        length: 'Ca. 37,6 cm',
        comparison: 'Aubergine',
        bodyChanges: [
          'Åndenød eller halsbrand kan blive hyppigere, efterhånden som livmoderen fylder mere.',
        ],
        toKnow: [
          'Tredje trimester begynder generelt omkring denne uge, og aftalerne bliver hyppigere.',
        ],
      },
      sv: {
        babyDescription: 'Hjertefrekvensen, der var hurtigere tidligt i graviditeten, har stabiliseret sig på ca. 130 till 140 slag i minuttet och kan nu höres med et stetoskop.',
        length: 'Ca. 37,6 cm',
        comparison: 'Aubergine',
        bodyChanges: [
          'Åndenöd eller halsbrand kan blive hyppigere, efterhånden som livmoderen fylder mere.',
        ],
        toKnow: [
          'Tredje trimester begynder generelt omkring denne uge, och aftalerne bliver hyppigere.',
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
      nb: {
        babyDescription:
          'Babyen er allerede godt utformet; de kommende ukene går hovedsakelig med til organmodning og vektøkning. Det tynne beskyttende belegget som dekker huden, begynner å bli tatt opp igjen.',
        length: 'Omtrent 38,6 cm',
        comparison: 'Butternutgresskar',
        bodyChanges: ['Det kan bli vanskeligere å finne søvn på grunn av den voksende magen.'],
        toKnow: ['Å hvile på venstre side anbefales ofte sent i svangerskapet for å støtte blodsirkulasjonen.'],
      },
      pl: {
        babyDescription:
          'Dziecko jest już dobrze ukształtowane; najbliższe tygodnie będą poświęcone głównie dojrzewaniu narządów i przybieraniu na wadze. Cienka warstwa ochronna pokrywająca jego skórę zaczyna się wchłaniać.',
        length: 'Około 38,6 cm',
        comparison: 'Dynia piżmowa',
        bodyChanges: ['Z powodu rosnącego brzucha trudniej może być zasnąć.'],
        toKnow: ['Odpoczynek na lewym boku jest często zalecany pod koniec ciąży, aby wspierać krążenie.'],
      },
      uk: {
        babyDescription:
          'Дитина вже добре сформована; найближчі тижні будуть присвячені головно дозріванню органів і набору ваги. Тонке захисне покриття її шкіри починає розсмоктуватися.',
        length: 'Приблизно 38,6 см',
        comparison: 'Гарбуз баттернат',
        bodyChanges: ['Через зростаючий живіт заснути може стати важче.'],
        toKnow: ['Відпочинок на лівому боці часто рекомендують наприкінці вагітності для підтримки кровообігу.'],
      },
      cs: {
        babyDescription:
          'Miminko je již dobře vytvořené; následující týdny budou věnovány hlavně dozrávání orgánů a přibývání na váze. Tenký ochranný povlak pokrývající jeho kůži se začíná vstřebávat.',
        length: 'Asi 38,6 cm',
        comparison: 'Máslová dýně',
        bodyChanges: ['Kvůli rostoucímu břichu může být těžší usnout.'],
        toKnow: ['Odpočinek na levém boku se na konci těhotenství často doporučuje pro podporu krevního oběhu.'],
      },
      sk: {
        babyDescription:
          'Bábätko je už dobre vytvorené; nasledujúce týždne budú venované najmä dozrievaniu orgánov a priberaniu. Tenký ochranný povlak pokrývajúci jeho kožu sa začína vstrebávať.',
        length: 'Približne 38,6 cm',
        comparison: 'Maslová tekvica',
        bodyChanges: [
          'Nájsť spánok môže byť ťažšie kvôli rastúcemu bruchu.',
        ],
        toKnow: [
          'Odpočinok na ľavom boku sa v neskorom tehotenstve často odporúča na podporu krvného obehu.',
        ],
      },
      hu: {
        babyDescription:
          'A baba már jól formált; a következő hetek főként a szervek érésére és a súlygyarapodásra szolgálnak. A bőrét fedő vékony védőréteg kezd felszívódni.',
        length: 'Körülbelül 38,6 cm',
        comparison: 'Vajtök',
        bodyChanges: [
          'Az alvást nehezebb lehet megtalálni a növekvő hasad miatt.',
        ],
        toKnow: [
          'A bal oldalon fekvés a késői terhességben gyakran ajánlott a keringés támogatására.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul este deja bine format; următoarele săptămâni vor fi dedicate în principal maturării organelor și creșterii în greutate. Stratul subțire de protecție care îi acoperă pielea începe să fie resorbit.',
        length: 'Aproximativ 38,6 cm',
        comparison: 'Dovleac muscat',
        bodyChanges: [
          'Somnul poate deveni mai greu de găsit din cauza burții tale tot mai mari.',
        ],
        toKnow: [
          'Odihna pe partea stângă este adesea recomandată la sfârșitul sarcinii pentru a susține circulația.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето вече е добре оформено; следващите седмици ще бъдат посветени главно на съзряването на органите и наддаването на тегло. Тънкото защитно покритие на кожата му започва да се резорбира.',
        length: 'Около 38,6 см',
        comparison: 'Тиква мускатна',
        bodyChanges: [
          'Сънят може да стане по-труден за намиране заради растящия ти корем.',
        ],
        toKnow: [
          'Почивката настрани върху лявата страна често се препоръчва в края на бременността, за да се подпомогне кръвообращението.',
        ],
      },
      sr: {
        babyDescription:
          'Беба је већ добро формирана; наредне недеље биће углавном посвећене сазревању органа и добијању на тежини. Танак заштитни омотач који прекрива њену кожу почиње да се ресорбује.',
        length: 'Око 38,6 цм',
        comparison: 'Бундева путер',
        bodyChanges: [
          'Сан може постати теже наћи због твог растућег стомака.',
        ],
        toKnow: [
          'Одмор на левој страни често се препоручује пред крај трудноће да се подржи крвоток.',
        ],
      },
      hr: {
        babyDescription:
          'Beba je već dobro oblikovana; sljedeći tjedni bit će uglavnom posvećeni sazrijevanju organa i dobivanju na težini. Tanak zaštitni omotač koji prekriva njezinu kožu počinje se resorbirati.',
        length: 'Oko 38,6 cm',
        comparison: 'Tikva maslenica',
        bodyChanges: [
          'San može postati teže naći zbog tvog rastućeg trbuha.',
        ],
        toKnow: [
          'Odmor na lijevoj strani često se preporučuje pred kraj trudnoće radi podupiranja protoka krvi.',
        ],
      },
      bs: {
        babyDescription:
          'Beba je već dobro oblikovana; sljedeći sedmice bit će uglavnom posvećeni sazrijevanju organa i dobivanju na težini. Tanak zaštitni omotač koji prekriva njezinu kožu počinje se resorbirati.',
        length: 'Oko 38,6 cm',
        comparison: 'Tikva maslenica',
        bodyChanges: [
          'San može postati teže naći zbog tvog rastućeg trbuha.',
        ],
        toKnow: [
          'Odmor na lijevoj strani često se preporučuje pred kraj trudnoće radi podupiranja protoka krvi.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček je že dobro oblikovan; naslednji tedni bodo večinoma posvečeni zorenju organov in pridobivanju teže. Tanka zaščitna ovojnica, ki prekriva njegovo kožo, se začne resorbirati.',
        length: 'Približno 38,6 cm',
        comparison: 'Orehova buča',
        bodyChanges: [
          'Spanje je lahko težje zaradi tvojega rastočega trebuha.',
        ],
        toKnow: [
          'Počitek na levi strani se proti koncu nosečnosti pogosto priporoča za podporo krvnemu obtoku.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु पहिल्यै राम्ररी बनिसकेको छ; आगामी हप्ताहरू मुख्यतया अङ्गहरू परिपक्व हुन र तौल बढाउनमा समर्पित हुनेछन्। उनको छालालाई ढाक्ने पातलो सुरक्षात्मक तह फेरि सोसिन थाल्छ।',
        length: 'करिब 38.6 सेमी',
        comparison: 'बटरनट फर्सी',
        bodyChanges: [
          'तपाईंको बढ्दो पेटका कारण निद्रा पाउन गाह्रो हुन सक्छ।',
        ],
        toKnow: [
          'गर्भावस्थाको पछिल्लो चरणमा रक्तसञ्चारलाई साथ दिन बायाँ करवटमा आराम गर्न प्रायः सिफारिस गरिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා දැනටමත් හොඳින් සෑදී ඇත; ඉදිරි සති ප්‍රධාන වශයෙන් අවයව පරිණත වීම සහ බර වැඩිවීම සඳහා කැපවනු ඇත. ඔවුන්ගේ සම ආවරණය කරන තුනී ආරක්ෂක ආලේපනය නැවත අවශෝෂණය වීමට පටන් ගනී.',
        length: 'සෙ.මී. 38.6 පමණ',
        comparison: 'බටර්නට් වට්ටක්කා ගෙඩියක්',
        bodyChanges: [
          'ඔබේ වැඩෙන බඩ නිසා නින්ද සොයා ගැනීම අපහසු විය හැක.',
        ],
        toKnow: [
          'රුධිර සංසරණයට සහාය වීමට ගර්භණී කාලයේ අවසාන කාලයේදී ඔබේ වම් පැත්තෙන් විවේක ගැනීම බොහෝ විට නිර්දේශ කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ทารกก่อตัวดีแล้ว สัปดาห์ต่อไปจะอุทิศให้กับการเจริญของอวัยวะและน้ำหนักที่เพิ่มขึ้นเป็นหลัก ชั้นเคลือบป้องกันบาง ๆ ที่ปกคลุมผิวหนังเริ่มถูกดูดซึมกลับ',
        length: 'ประมาณ 38.6 ซม.',
        comparison: 'ฟักทองบัตเตอร์นัต',
        bodyChanges: [
          'การนอนอาจหาได้ยากขึ้นเพราะหน้าท้องที่ใหญ่ขึ้น',
        ],
        toKnow: [
          'การนอนตะแคงซ้ายมักแนะนำในช่วงท้ายของการตั้งครรภ์เพื่อสนับสนุนการไหลเวียนเลือด',
        ],
      },
      vi: {
        babyDescription:
          'Em bé đã hình thành tốt; những tuần tới chủ yếu dành cho sự trưởng thành của các cơ quan và tăng cân. Lớp phủ bảo vệ mỏng trên da bắt đầu được tái hấp thu.',
        length: 'Khoảng 38,6 cm',
        comparison: 'Bí đỏ butternut',
        bodyChanges: [
          'Việc ngủ có thể trở nên khó khăn hơn vì chiếc bụng ngày càng lớn.',
        ],
        toKnow: [
          'Nằm nghiêng bên trái thường được khuyên vào cuối thai kỳ để hỗ trợ tuần hoàn.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq allaqachon yaxshi shakllangan; keyingi haftalar asosan aʼzolarning yetilishi va vazn olishga bagʻishlanadi. Terisini qoplagan yupqa himoya qatlami qayta soʻrila boshlaydi.',
        length: 'Taxminan 38,6 sm',
        comparison: 'Butternat qovoq',
        bodyChanges: [
          'Oʻsib borayotgan qorningiz tufayli uyqu topish qiyinlashishi mumkin.',
        ],
        toKnow: [
          'Homiladorlikning oxirida qon aylanishini qoʻllab-quvvatlash uchun chap yonboshda dam olish koʻpincha tavsiya etiladi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə artıq yaxşı formalaşıb; sonrakı həftələr əsasən orqanların yetişməsinə və çəki artımına həsr olunacaq. Dərisini örtən nazik qoruyucu təbəqə təkrar sorulmağa başlayır.',
        length: 'Təxminən 38,6 sm',
        comparison: 'Muskat qabağı',
        bodyChanges: [
          'Böyüyən qarnınıza görə yuxu tapmaq çətinləşə bilər.',
        ],
        toKnow: [
          'Hamiləliyin son dövründə qan dövranını dəstəkləmək üçün sol tərəfdə istirahət etmək çox vaxt tövsiyə olunur.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი უკვე კარგად ჩამოყალიბებულია; მომდევნო კვირები ძირითადად ორგანოების მომწიფებას და წონაში მატებას დაეთმობა. კანის დამფარავი თხელი დამცავი ფენა ეტაპობრივად შეიწოვება.',
        length: 'დაახლოებით 38,6 სმ',
        comparison: 'ბატერნატის გოგრა',
        bodyChanges: [
          'ძილის პოვნა შეიძლება უფრო გაძნელდეს თქვენი მზარდი მუცლის გამო.',
        ],
        toKnow: [
          'ორსულობის გვიან ეტაპზე მარცხენა გვერდზე დასვენება ხშირად რეკომენდებულია სისხლის მიმოქცევის მხარდასაჭერად.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան արդեն լավ ձևավորված է. առաջիկա շաբաթները հիմնականում նվիրված կլինեն օրգանների հասունացմանը և քաշ հավաքելուն: Նրա մաշկը ծածկող բարակ պաշտպանիչ շերտը սկսում է վերաներծծվել:',
        length: 'Մոտ 38,6 սմ',
        comparison: 'Դդում',
        bodyChanges: [
          'Քունը կարող է ավելի դժվար գտնվել՝ ձեր աճող որովայնի պատճառով:',
        ],
        toKnow: [
          'Հղիության ուշ փուլում հաճախ խորհուրդ է տրվում հանգստանալ ձախ կողքի վրա՝ արյան շրջանառությանն աջակցելու համար:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл аллакай хуб ташаккул ёфтааст; ҳафтаҳои оянда асосан ба расидани узвҳо ва вазн гирифтан бахшида мешаванд. Қабати борики муҳофизатӣ, ки пӯсти ӯро мепӯшонад, оғоз ба ҷаббида шудан мекунад.',
        length: 'Тақрибан 38,6 см',
        comparison: 'Кадуи ширин',
        bodyChanges: [
          'Хоб ёфтан метавонад аз сабаби шиками афзояндаи шумо душвортар шавад.',
        ],
        toKnow: [
          'Дар охири ҳомиладорӣ аксар вақт тавсия дода мешавад, ки дар паҳлуи чап истироҳат кунед, то гардиши хунро дастгирӣ кунад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай буга чейин эле жакшы түзүлгөн; кийинки жумалар негизинен органдардын жетилишине жана салмак алууга арналат. Терисин каптаган жука коргоочу катмар кайра сиңе баштайт.',
        length: 'Болжол менен 38,6 см',
        comparison: 'Жаңгак кабагы',
        bodyChanges: [
          'Курсагыңыз чоңойгондуктан уйку табуу кыйындашы мүмкүн.',
        ],
        toKnow: [
          'Курсактуулуктун акырында кан айлануусун колдоо үчүн сол капталыңызга жатып эс алуу көбүнчө сунушталат.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek eýýäm gowy emele geldi; indiki hepdeler esasan agzalaryň ýetişmegine we agram goşmaga bagyşlanar. Derisini örtýän inçe goraýjy gatlak ýuwaş-ýuwaşdan ýene siňip başlaýar.',
        length: 'Takmynan 38,6 sm',
        comparison: 'Gawun (butternut)',
        bodyChanges: [
          'Ösýän garnyňyz sebäpli uky tapmak kynlaşyp biler.',
        ],
        toKnow: [
          'Çep tarapda ýatmak göwreliligiň ahyrynda gan aýlanyşyna goldaw bermek üçin köplenç maslahat berilýär.',
        ],
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
      da: {
        babyDescription: 'Babyen er allerede velformet; de kommende uger vil primært være dedikeret til organmodning og vægtøgning. Det tynde beskyttende overtræk på huden begynder at blive genoptaget.',
        length: 'Ca. 38,6 cm',
        comparison: 'Butternutsquash',
        bodyChanges: [
          'Søvn kan blive sværere at finde på grund af din voksende mave.',
        ],
        toKnow: [
          'At hvile på venstre side anbefales ofte sent i graviditeten for at støtte kredsløbet.',
        ],
      },
      sv: {
        babyDescription: 'Babyen ar redan velformet; de kommende veckor vil primärt väre dedikeret till organmodning och vägtögning. Det tynde beskyttende overträk på huden begynder at blive genoptaget.',
        length: 'Ca. 38,6 cm',
        comparison: 'Butternutsquash',
        bodyChanges: [
          'Sövn kan blive svärere at finde på grund av din voksende mave.',
        ],
        toKnow: [
          'At hvile på venstre side anbefales ofte sent i graviditeten for at stötte kredslöbet.',
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
      nb: {
        babyDescription:
          'Synet fortsetter å utvikle seg; ved fødselen vil babyen kunne skjelne ansikter i nærheten, før den gradvis lærer å følge bevegelige gjenstander.',
        length: 'Omtrent 39,9 cm',
        comparison: 'Kål',
        bodyChanges: ['En følelse av tyngde i korsryggen eller bekkenet kan øke.'],
        toKnow: ['Svangerskapskontrollene blir vanligvis hyppigere fra dette stadiet.'],
      },
      pl: {
        babyDescription:
          'Wzrok nadal się rozwija; po urodzeniu dziecko będzie w stanie dostrzegać twarze z bliska, zanim stopniowo nauczy się śledzić poruszające się przedmioty.',
        length: 'Około 39,9 cm',
        comparison: 'Kapusta',
        bodyChanges: ['Uczucie ciężkości w dolnej części pleców lub w miednicy może się nasilić.'],
        toKnow: ['Wizyty w ramach opieki prenatalnej stają się zazwyczaj częstsze od tego etapu.'],
      },
      uk: {
        babyDescription:
          'Зір продовжує розвиватися; під час народження дитина зможе розрізняти обличчя поблизу, перш ніж поступово навчиться стежити за рухомими предметами.',
        length: 'Приблизно 39,9 см',
        comparison: 'Капуста',
        bodyChanges: ['Відчуття важкості в попереку або в тазі може посилюватися.'],
        toKnow: ['Візити в рамках пренатального нагляду зазвичай стають частішими від цього етапу.'],
      },
      cs: {
        babyDescription:
          'Zrak se dál vyvíjí; při narození bude miminko schopno rozeznat obličeje nablízku, než se postupně naučí sledovat pohybující se předměty.',
        length: 'Asi 39,9 cm',
        comparison: 'Zelí',
        bodyChanges: ['Pocit tíhy v dolní části zad nebo v pánvi se může zvyšovat.'],
        toKnow: ['Prenatální návštěvy se od této fáze obvykle stávají častějšími.'],
      },
      sk: {
        babyDescription:
          'Zrak sa naďalej vyvíja; po narodení bude bábätko schopné rozoznať blízke tváre, kým sa postupne naučí sledovať pohybujúce sa predmety.',
        length: 'Približne 39,9 cm',
        comparison: 'Kapusta',
        bodyChanges: [
          'Pocit ťažoby v krížoch alebo panve sa môže zvýšiť.',
        ],
        toKnow: [
          'Prenatálne návštevy sa od tejto fázy zvyčajne stávajú častejšími.',
        ],
      },
      hu: {
        babyDescription:
          'A látás tovább fejlődik; a születéskor a baba képes lesz kivenni a közeli arcokat, mielőtt fokozatosan megtanulja követni a mozgó tárgyakat.',
        length: 'Körülbelül 39,9 cm',
        comparison: 'Káposzta',
        bodyChanges: [
          'A derék vagy a medence nehézségérzete fokozódhat.',
        ],
        toKnow: [
          'A terhesgondozási időpontok ettől a szakasztól általában gyakoribbá válnak.',
        ],
      },
      ro: {
        babyDescription:
          'Vederea continuă să se dezvolte; la naștere, bebelușul va putea distinge fețele apropiate, înainte de a învăța treptat să urmărească obiectele în mișcare.',
        length: 'Aproximativ 39,9 cm',
        comparison: 'Varză',
        bodyChanges: [
          'O senzație de greutate în zona lombară sau în bazin se poate accentua.',
        ],
        toKnow: [
          'Consultațiile prenatale devin în general mai frecvente începând cu această etapă.',
        ],
      },
      bg: {
        babyDescription:
          'Зрението продължава да се развива; при раждането бебето ще може да различава близки лица, преди постепенно да се научи да следи движещи се предмети.',
        length: 'Около 39,9 см',
        comparison: 'Зеле',
        bodyChanges: [
          'Чувството на тежест в кръста или таза може да се засили.',
        ],
        toKnow: [
          'Пренаталните прегледи обикновено стават по-чести от този етап нататък.',
        ],
      },
      sr: {
        babyDescription:
          'Вид наставља да се развија; при рођењу, беба ће моћи да разликује лица близу, пре него што постепено научи да прати покретне предмете.',
        length: 'Око 39,9 цм',
        comparison: 'Купус',
        bodyChanges: [
          'Осећај тежине у крстима или карлици може се повећати.',
        ],
        toKnow: [
          'Пренатални прегледи обично постају чешћи од ове фазе надаље.',
        ],
      },
      hr: {
        babyDescription:
          'Vid se nastavlja razvijati; pri rođenju beba će moći razlikovati lica izbliza, prije nego što postupno nauči pratiti pokretne predmete.',
        length: 'Oko 39,9 cm',
        comparison: 'Kupus',
        bodyChanges: [
          'Osjećaj težine u križima ili zdjelici može se pojačati.',
        ],
        toKnow: [
          'Prenatalni pregledi obično postaju češći od ove faze nadalje.',
        ],
      },
      bs: {
        babyDescription:
          'Vid se nastavlja razvijati; pri rođenju beba će moći razlikovati lica izbliza, prije nego što postupno nauči pratiti pokretne predmete.',
        length: 'Oko 39,9 cm',
        comparison: 'Kupus',
        bodyChanges: [
          'Osjećaj težine u križima ili zdjelici može se pojačati.',
        ],
        toKnow: [
          'Prenatalni pregledi obično postaju češći od ove faze nadalje.',
        ],
      },
      sl: {
        babyDescription:
          'Vid se še naprej razvija; ob rojstvu bo dojenček lahko razločeval obraze od blizu, preden se postopoma nauči slediti premikajočim se predmetom.',
        length: 'Približno 39,9 cm',
        comparison: 'Zelje',
        bodyChanges: [
          'Občutek teže v križu ali mednožju se lahko poveča.',
        ],
        toKnow: [
          'Predporodni pregledi običajno postanejo pogostejši od te faze naprej.',
        ],
      },
      ne: {
        babyDescription:
          'दृष्टि विकसित हुँदै जान्छ; जन्मका बेला शिशुले नजिकका अनुहार छुट्ट्याउन सक्छ, चल्ने वस्तुहरू पछ्याउन बिस्तारै सिक्नुअघि।',
        length: 'करिब 39.9 सेमी',
        comparison: 'बन्दागोभी',
        bodyChanges: [
          'तल्लो ढाड वा पेल्भिसमा भारीपनको अनुभूति बढ्न सक्छ।',
        ],
        toKnow: [
          'प्रसवपूर्व भेटघाटहरू यो चरणदेखि सामान्यतया बढी बारम्बार हुन्छन्।',
        ],
      },
      si: {
        babyDescription:
          'දෘෂ්ටිය වර්ධනය වීම දිගටම කරගෙන යයි; උපතේදී, දරුවාට ළඟ මුහුණු හඳුනාගත හැකි වන අතර, පසුව චලනය වන වස්තු අනුගමනය කිරීමට ක්‍රමයෙන් ඉගෙන ගනී.',
        length: 'සෙ.මී. 39.9 පමණ',
        comparison: 'ගෝවා ගෙඩියක්',
        bodyChanges: [
          'පහළ පිටේ හෝ ශ්‍රෝණියේ බරක් දැනීම වැඩි විය හැක.',
        ],
        toKnow: [
          'ප්‍රසව පූර්ව හමුවීම් මෙම අවධියේ සිට සාමාන්‍යයෙන් වඩා නිතර වේ.',
        ],
      },
      th: {
        babyDescription:
          'การมองเห็นยังคงพัฒนาต่อไป เมื่อแรกเกิดทารกจะมองเห็นใบหน้าใกล้ ๆ ได้ ก่อนจะค่อย ๆ เรียนรู้ที่จะติดตามวัตถุที่เคลื่อนไหว',
        length: 'ประมาณ 39.9 ซม.',
        comparison: 'กะหล่ำปลี',
        bodyChanges: [
          'ความรู้สึกหนักที่หลังส่วนล่างหรืออุ้งเชิงกรานอาจเพิ่มขึ้น',
        ],
        toKnow: [
          'โดยทั่วไปการนัดตรวจครรภ์ถี่ขึ้นตั้งแต่ระยะนี้เป็นต้นไป',
        ],
      },
      vi: {
        babyDescription:
          'Thị lực tiếp tục phát triển; khi chào đời, em bé sẽ có thể nhận ra những khuôn mặt ở gần, trước khi dần học cách theo dõi các vật chuyển động.',
        length: 'Khoảng 39,9 cm',
        comparison: 'Cải bắp',
        bodyChanges: [
          'Cảm giác nặng ở lưng dưới hoặc vùng chậu có thể tăng lên.',
        ],
        toKnow: [
          'Các buổi khám thai thường trở nên thường xuyên hơn từ giai đoạn này trở đi.',
        ],
      },
      uz: {
        babyDescription:
          'Koʻrish rivojlanishda davom etadi; tugʻilganda chaqaloq yaqin yuzlarni ajrata oladi, keyin asta-sekin harakatlanayotgan narsalarni kuzatishni oʻrganadi.',
        length: 'Taxminan 39,9 sm',
        comparison: 'Karam',
        bodyChanges: [
          'Bel yoki chanoqning pastki qismida ogʻirlik hissi kuchayishi mumkin.',
        ],
        toKnow: [
          'Tugʻruqdan oldingi qabullar odatda shu bosqichdan boshlab tez-tezlashadi.',
        ],
      },
      az: {
        babyDescription:
          'Görmə inkişaf etməyə davam edir; doğulanda körpə yaxın üzləri seçə biləcək, sonra tədricən hərəkət edən əşyaları izləməyi öyrənəcək.',
        length: 'Təxminən 39,9 sm',
        comparison: 'Kələm',
        bodyChanges: [
          'Belin aşağı hissəsində və ya çanaqda ağırlıq hissi artmış ola bilər.',
        ],
        toKnow: [
          'Doğuşdan əvvəlki qəbullar bu mərhələdən etibarən adətən daha tez-tez olur.',
        ],
      },
      ka: {
        babyDescription:
          'მხედველობა კვლავ ვითარდება; დაბადებისას ბავშვი ახლომდებარე სახეებს გაარჩევს, სანამ ეტაპობრივად მოძრავი ობიექტების თვალყურის დევნას ისწავლის.',
        length: 'დაახლოებით 39,9 სმ',
        comparison: 'კომბოსტო',
        bodyChanges: [
          'წელის ქვედა ნაწილში ან მენჯში სიმძიმის შეგრძნება შეიძლება გაიზარდოს.',
        ],
        toKnow: [
          'ორსულობის მეთვალყურეობის ვიზიტები ამ ეტაპიდან ზოგადად უფრო ხშირი ხდება.',
        ],
      },
      hy: {
        babyDescription:
          'Տեսողությունը շարունակում է զարգանալ. ծննդյան պահին երեխան կկարողանա զանազանել մոտակա դեմքերը՝ նախքան աստիճանաբար սովորելը հետևել շարժվող առարկաներին:',
        length: 'Մոտ 39,9 սմ',
        comparison: 'Կաղամբ',
        bodyChanges: [
          'Գոտկատեղում կամ կոնքում ծանրության զգացումը կարող է ավելանալ:',
        ],
        toKnow: [
          'Նախածննդյան այցերը սովորաբար դառնում են ավելի հաճախակի այս փուլից սկսած:',
        ],
      },
      tg: {
        babyDescription:
          'Биноӣ инкишоф ёфтанро идома медиҳад; ҳангоми таваллуд тифл метавонад чеҳраҳои наздикро фарқ кунад, пеш аз он ки тадриҷан пайгирии ашёи ҳаракаткунандаро биомӯзад.',
        length: 'Тақрибан 39,9 см',
        comparison: 'Карам',
        bodyChanges: [
          'Эҳсоси вазнинӣ дар қисми поёни пушт ё коса метавонад афзояд.',
        ],
        toKnow: [
          'Қабулҳои пеш аз таваллуд аз ҳамин марҳила одатан зуд-зудтар мешаванд.',
        ],
      },
      ky: {
        babyDescription:
          'Көрүү өнүгүүнү улантат; төрөлгөндө ымыркай жакын жердеги жүздөрдү айырмалай алат, андан кийин кыймылдаган нерселерди көзү менен ээрчүүнү акырындап үйрөнөт.',
        length: 'Болжол менен 39,9 см',
        comparison: 'Капуста',
        bodyChanges: [
          'Белдин ылдый жагындагы же жамбаштагы оордук сезими күчөшү мүмкүн.',
        ],
        toKnow: [
          'Төрөткө чейинки кабыл алуулар бул этаптан баштап адатта жыштайт.',
        ],
      },
      tk: {
        babyDescription:
          'Görüş ösmegini dowam etdirýär; doglanda bäbek ýakyn ýüzleri tapawutlandyryp biler, soňra ýuwaş-ýuwaşdan hereket edýän zatlary yzarlamagy öwrener.',
        length: 'Takmynan 39,9 sm',
        comparison: 'Kelem',
        bodyChanges: [
          'Biliň aşaky böleginde ýa-da çanakda agyrlyk duýgusy artyp biler.',
        ],
        toKnow: [
          'Göwrelilik kabul edişleri umuman şu tapgyrdan başlap ýygylaşýar.',
        ],
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
      da: {
        babyDescription: 'Synet fortsætter med at udvikle sig; ved fødslen vil babyen kunne skelne ansigter i nærheden, inden den gradvist lærer at følge bevægende objekter.',
        length: 'Ca. 39,9 cm',
        comparison: 'Kålhoved',
        bodyChanges: [
          'En følelse af tyngde i lænden eller bækkenet kan tiltage.',
        ],
        toKnow: [
          'Svangerskabskonsultationer bliver generelt hyppigere fra dette stadie og frem.',
        ],
      },
      sv: {
        babyDescription: 'Synet fortsätter med at udvikle sig; ved födslen vil babyen kunne skelne ansigter i närheden, inden den gradvist lärer at fölge bevägende objekter.',
        length: 'Ca. 39,9 cm',
        comparison: 'Kålhoved',
        bodyChanges: [
          'En fölelse av tyngde i länden eller bäkkenet kan tiltage.',
        ],
        toKnow: [
          'Svangerskabskonsultationer bliver generelt hyppigere fran dette stadie och frem.',
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
      nb: {
        babyDescription:
          'Babyen beveger seg aktivt, suger av og til på fingrene og kan gjøre store bevegelser. Huden blir mindre rynkete etter hvert som fett legges på.',
        length: 'Omtrent 41,1 cm',
        comparison: 'Kokosnøtt',
        bodyChanges: ['Øvingsrier, kjent som Braxton Hicks, kan begynne å kjennes av og til.'],
        toKnow: ['Babyen begynner å kjenne igjen visse kjente stemmer som høres jevnlig utenfra.'],
      },
      pl: {
        babyDescription:
          'Dziecko porusza się aktywnie, czasem ssie palce i potrafi wykonywać szerokie ruchy. Jego skóra staje się mniej pomarszczona w miarę odkładania się tkanki tłuszczowej.',
        length: 'Około 41,1 cm',
        comparison: 'Kokos',
        bodyChanges: ['Skurcze przepowiadające, znane jako skurcze Braxtona-Hicksa, mogą być od czasu do czasu odczuwalne.'],
        toKnow: ['Dziecko zaczyna rozpoznawać niektóre znajome głosy, regularnie słyszane z zewnątrz.'],
      },
      uk: {
        babyDescription:
          'Дитина активно рухається, іноді смокче пальці й може робити широкі рухи. Її шкіра стає менш зморшкуватою в міру накопичення жирової тканини.',
        length: 'Приблизно 41,1 см',
        comparison: 'Кокос',
        bodyChanges: ['Тренувальні перейми, відомі як перейми Брекстона-Гікса, можуть час від часу відчуватися.'],
        toKnow: ['Дитина починає впізнавати деякі знайомі голоси, які регулярно чує ззовні.'],
      },
      cs: {
        babyDescription:
          'Miminko se aktivně pohybuje, někdy saje prsty a dokáže dělat rozmáchlé pohyby. Jeho kůže je méně svraštělá, jak se hromadí tuk.',
        length: 'Asi 41,1 cm',
        comparison: 'Kokos',
        bodyChanges: ['Cvičné stahy, známé jako Braxton-Hicksovy, se mohou začít občas projevovat.'],
        toKnow: ['Miminko začíná poznávat některé známé hlasy, které pravidelně slyší zvenčí.'],
      },
      sk: {
        babyDescription:
          'Bábätko sa aktívne pohybuje, niekedy cicia prsty a dokáže robiť široké pohyby. Jeho koža sa stáva menej vrásčitou, ako sa hromadí tuk.',
        length: 'Približne 41,1 cm',
        comparison: 'Kokos',
        bodyChanges: [
          'Nácvikové sťahy, známe ako Braxtonove-Hicksove, sa môžu začať občas pociťovať.',
        ],
        toKnow: [
          'Bábätko začína rozpoznávať niektoré známe hlasy, ktoré pravidelne počuje zvonka.',
        ],
      },
      hu: {
        babyDescription:
          'A baba aktívan mozog, néha szopja az ujjait, és széles mozdulatokra képes. A bőre kevésbé ráncos lesz, ahogy a zsír felhalmozódik.',
        length: 'Körülbelül 41,1 cm',
        comparison: 'Kókuszdió',
        bodyChanges: [
          'A gyakorló összehúzódások, más néven Braxton Hicks-összehúzódások, alkalmanként kezdhetnek érezhetővé válni.',
        ],
        toKnow: [
          'A baba kezd felismerni bizonyos ismerős hangokat, amelyeket rendszeresen hall kívülről.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul se mișcă activ, își suge uneori degetele și poate face mișcări ample. Pielea lui devine mai puțin încrețită pe măsură ce se acumulează grăsime.',
        length: 'Aproximativ 41,1 cm',
        comparison: 'Nucă de cocos',
        bodyChanges: [
          'Contracțiile de antrenament, cunoscute ca Braxton Hicks, pot începe să fie simțite ocazional.',
        ],
        toKnow: [
          'Bebelușul începe să recunoască anumite voci familiare auzite regulat din exterior.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето се движи активно, понякога суче пръстите си и може да прави широки движения. Кожата му става по-малко сбръчкана, докато се натрупва мазнина.',
        length: 'Около 41,1 см',
        comparison: 'Кокосов орех',
        bodyChanges: [
          'Тренировъчните контракции, известни като контракции на Брекстън-Хикс, могат да започнат да се усещат от време на време.',
        ],
        toKnow: [
          'Бебето започва да разпознава някои познати гласове, чувани редовно отвън.',
        ],
      },
      sr: {
        babyDescription:
          'Беба се активно креће, понекад суче прсте и може правити широке покрете. Њена кожа постаје мање набрана док се таложи масноћа.',
        length: 'Око 41,1 цм',
        comparison: 'Кокосов орах',
        bodyChanges: [
          'Тренажне контракције, познате као Брекстон-Хиксове, могу почети да се повремено осећају.',
        ],
        toKnow: [
          'Беба почиње да препознаје неке познате гласове који се редовно чују споља.',
        ],
      },
      hr: {
        babyDescription:
          'Beba se aktivno kreće, ponekad uvija prste i može praviti široke pokrete. Njezina koža postaje manje naborana dok se taloži masnoća.',
        length: 'Oko 41,1 cm',
        comparison: 'Kokosov orah',
        bodyChanges: [
          'Pripremne kontrakcije, poznate kao Braxton Hicksove, mogu se početi povremeno osjećati.',
        ],
        toKnow: [
          'Beba počinje prepoznavati neke poznate glasove koji se redovito čuju izvana.',
        ],
      },
      bs: {
        babyDescription:
          'Beba se aktivno kreće, ponekad uvija prste i može praviti široke pokrete. Njezina koža postaje manje naborana dok se taloži masnoća.',
        length: 'Oko 41,1 cm',
        comparison: 'Kokosov orah',
        bodyChanges: [
          'Pripremne kontrakcije, poznate kao Braxton Hicksove, mogu se početi povremeno osjećati.',
        ],
        toKnow: [
          'Beba počinje prepoznavati neke poznate glasove koji se redovito čuju izvana.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček se aktivno giblje, včasih vrti prste in lahko dela široke gibe. Njegova koža postaja manj nagubana, ko se nalaga maščoba.',
        length: 'Približno 41,1 cm',
        comparison: 'Kokosov oreh',
        bodyChanges: [
          'Pripravljalni popadki, znani kot Braxton Hicksovi, se lahko začnejo občasno čutiti.',
        ],
        toKnow: [
          'Dojenček začne prepoznavati nekatere znane glasove, ki se redno slišijo od zunaj.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु सक्रिय रूपमा चल्छ, कहिलेकाहीँ औँला चुस्छ, र फराकिला चालहरू गर्न सक्छ। बोसो जम्मा हुँदै जाँदा उनको छाला कम चाउरिएको हुन्छ।',
        length: 'करिब 41.1 सेमी',
        comparison: 'नरिवल',
        bodyChanges: [
          'ब्राक्सटन हिक्स भनिने अभ्यास खुम्चाइहरू कहिलेकाहीँ महसुस हुन थाल्न सक्छन्।',
        ],
        toKnow: [
          'शिशुले बाहिरबाट नियमित सुनिने केही परिचित आवाजहरू चिन्न थाल्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා ක්‍රියාශීලීව චලනය වන අතර, සමහර විට ඔවුන්ගේ ඇඟිලි උරා බොයි, සහ පුළුල් චලනයන් කළ හැක. මේද එකතු වන විට ඔවුන්ගේ සම අඩු රැළි වේ.',
        length: 'සෙ.මී. 41.1 පමණ',
        comparison: 'පොල් ගෙඩියක්',
        bodyChanges: [
          'බ්‍රැක්ස්ටන් හික්ස් ලෙස හැඳින්වෙන පුහුණු සංකෝචන ඉඳහිට දැනීමට පටන් ගත හැක.',
        ],
        toKnow: [
          'පිටතින් නිතිපතා ඇසෙන සමහර හුරුපුරුදු කටහඬවල් හඳුනාගැනීමට දරුවා පටන් ගනී.',
        ],
      },
      th: {
        babyDescription:
          'ทารกเคลื่อนไหวอย่างกระฉับกระเฉง บางครั้งดูดนิ้ว และเคลื่อนไหวกว้างได้ ผิวหนังย่นน้อยลงเมื่อไขมันสะสม',
        length: 'ประมาณ 41.1 ซม.',
        comparison: 'มะพร้าว',
        bodyChanges: [
          'การบีบตัวของมดลูกเตรียมคลอด หรือที่เรียกว่าแบรกซ์ตันฮิกส์ อาจเริ่มรู้สึกเป็นครั้งคราว',
        ],
        toKnow: [
          'ทารกเริ่มจำเสียงที่คุ้นเคยบางเสียงที่ได้ยินเป็นประจำจากภายนอก',
        ],
      },
      vi: {
        babyDescription:
          'Em bé cử động tích cực, đôi khi mút ngón tay và có thể thực hiện những cử động rộng. Da bé bớt nhăn hơn khi mỡ tích tụ.',
        length: 'Khoảng 41,1 cm',
        comparison: 'Quả dừa',
        bodyChanges: [
          'Các cơn co thắt luyện tập, gọi là Braxton Hicks, có thể bắt đầu thỉnh thoảng được cảm nhận.',
        ],
        toKnow: [
          'Em bé bắt đầu nhận ra một số giọng nói quen thuộc thường xuyên nghe được từ bên ngoài.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq faol harakatlanadi, baʼzan barmoqlarini soʻradi va keng harakatlar qila oladi. Yogʻ toʻplangani sari terisi kamroq ajinli boʻladi.',
        length: 'Taxminan 41,1 sm',
        comparison: 'Kokos yongʻogʻi',
        bodyChanges: [
          'Braxton Hicks deb ataladigan mashq qisqarishlari vaqti-vaqti bilan sezila boshlashi mumkin.',
        ],
        toKnow: [
          'Chaqaloq tashqaridan muntazam eshitiladigan baʼzi tanish ovozlarni taniy boshlaydi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə aktiv hərəkət edir, bəzən barmaqlarını əmir və geniş hərəkətlər edə bilir. Piy toplandıqca dərisi daha az qırışlı olur.',
        length: 'Təxminən 41,1 sm',
        comparison: 'Hindistan qozu',
        bodyChanges: [
          'Brakston-Hiks adlanan məşq yığılmaları arabir hiss olunmağa başlaya bilər.',
        ],
        toKnow: [
          'Körpə xaricdən müntəzəm eşidilən bəzi tanış səsləri tanımağa başlayır.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი აქტიურად მოძრაობს, ზოგჯერ თითებს წოვს და ფართო მოძრაობების გაკეთება შეუძლია. მისი კანი ნაკლებად დანაოჭებული ხდება, რადგან ცხიმი გროვდება.',
        length: 'დაახლოებით 41,1 სმ',
        comparison: 'ქოქოსი',
        bodyChanges: [
          'სავარჯიშო შეკუმშვები, რომლებიც ბრაქსტონ-ჰიქსის სახელით არის ცნობილი, შეიძლება დროდადრო იგრძნობოდეს.',
        ],
        toKnow: [
          'ბავშვი იწყებს გარკვეული ნაცნობი ხმების ამოცნობას, რომლებსაც გარედან რეგულარულად ისმენს.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան ակտիվորեն շարժվում է, երբեմն ծծում է մատները և կարող է կատարել լայն շարժումներ: Նրա մաշկը դառնում է պակաս կնճռոտ՝ ճարպի կուտակմանը զուգընթաց:',
        length: 'Մոտ 41,1 սմ',
        comparison: 'Կոկոս',
        bodyChanges: [
          'Վարժական կծկումները, որոնք հայտնի են որպես Բրաքստոն-Հիքսի, կարող են սկսել երբեմն զգացվել:',
        ],
        toKnow: [
          'Երեխան սկսում է ճանաչել որոշ ծանոթ ձայներ, որոնք կանոնավոր լսվում են դրսից:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл фаъолона ҳаракат мекунад, баъзан ангуштонашро мемукад ва метавонад ҳаракатҳои васеъ кунад. Пӯсташ бо ҷамъ шудани равған камтар пурчин мешавад.',
        length: 'Тақрибан 41,1 см',
        comparison: 'Норҷил',
        bodyChanges: [
          'Кашишҳои машқӣ, ки бо номи Брэкстон-Хикс маъруфанд, метавонанд гоҳ-гоҳ ҳис шудан гиранд.',
        ],
        toKnow: [
          'Тифл баъзе овозҳои шиносеро, ки мунтазам аз берун шунида мешаванд, шинохтанро оғоз мекунад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай активдүү кыймылдайт, кээде манжаларын эмет жана кеңири кыймылдарды жасай алат. Май топтолгон сайын терисинин бырыштары азаят.',
        length: 'Болжол менен 41,1 см',
        comparison: 'Кокос',
        bodyChanges: [
          'Брэкстон-Хикс деп аталган машыгуу жыйрылуулары анда-санда сезилип башташы мүмкүн.',
        ],
        toKnow: [
          'Ымыркай тышкы дүйнөдөн үзгүлтүксүз угулган айрым тааныш үндөрдү таанып баштайт.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek işjeň hereket edýär, käwagt barmaklaryny emýär we giň hereketleri edip biler. Ýag toplanmagy bilen derisi az çytylýar.',
        length: 'Takmynan 41,1 sm',
        comparison: 'Kokos',
        bodyChanges: [
          'Braxton Hicks diýlip bilinýän türgenleşik gysylmalary wagtal-wagtal duýulyp başlap biler.',
        ],
        toKnow: [
          'Bäbek daşardan yzygiderli eşidilýän käbir tanyş sesleri tanamaga başlaýar.',
        ],
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
      da: {
        babyDescription: 'Babyen bevæger sig aktivt, suger sommetimes sine fingre og kan lave brede bevægelser. Huden bliver mindre rynket efterhånden som fedt samler sig.',
        length: 'Ca. 41,1 cm',
        comparison: 'Kokosnød',
        bodyChanges: [
          'Øveveer, kendte som Braxton Hicks, kan begynde at mærkes lejlighedsvis.',
        ],
        toKnow: [
          'Babyen begynder at genkende visse kendte stemmer, der jævnligt høres udefra.',
        ],
      },
      sv: {
        babyDescription: 'Babyen beväger sig aktivt, suger sommetimes sine fingre och kan lave brede bevägelser. Huden bliver mindre rynket efterhånden som fedt samler sig.',
        length: 'Ca. 41,1 cm',
        comparison: 'Kokosnöd',
        bodyChanges: [
          'Öveveer, kendte som Braxton Hicks, kan begynde at märkes lejlighedsvis.',
        ],
        toKnow: [
          'Babyen begynder at genkende visse kendte stemmer, der jävnligt höres udefra.',
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
      nb: {
        babyDescription:
          'Babyen er allerede godt utformet og legger seg gradvis med hodet ned som forberedelse til fødselen. Den fortsetter hovedsakelig å legge på seg i de gjenværende ukene.',
        length: 'Omtrent 42,4 cm',
        comparison: 'Stangselleri',
        bodyChanges: ['Mer merkbar vektøkning er vanlig i denne perioden, knyttet til babyens vekst.'],
        toKnow: ['Hodet-ned-stilling (hodeleie) blir vanligere når termin nærmer seg.'],
      },
      pl: {
        babyDescription:
          'Dziecko jest już dobrze ukształtowane i stopniowo układa się główką w dół w ramach przygotowania do porodu. W pozostałych tygodniach przede wszystkim nadal przybiera na wadze.',
        length: 'Około 42,4 cm',
        comparison: 'Pęczek selera',
        bodyChanges: ['Wyraźniejszy przyrost wagi jest w tym okresie częsty, związany ze wzrostem dziecka.'],
        toKnow: ['Ułożenie główką w dół (ułożenie podłużne główkowe) staje się częstsze w miarę zbliżania się terminu.'],
      },
      uk: {
        babyDescription:
          'Дитина вже добре сформована й поступово розташовується головкою вниз у рамках підготовки до пологів. У решті тижнів вона насамперед продовжує набирати вагу.',
        length: 'Приблизно 42,4 см',
        comparison: 'Пучок селери',
        bodyChanges: ['Виразніший набір ваги в цей період поширений, пов’язаний із ростом дитини.'],
        toKnow: ['Положення головкою вниз (головне передлежання) стає частішим у міру наближення терміну.'],
      },
      cs: {
        babyDescription:
          'Miminko je již dobře vytvořené a postupně se v rámci přípravy na porod usazuje hlavičkou dolů. Během zbývajících týdnů hlavně dál přibírá na váze.',
        length: 'Asi 42,4 cm',
        comparison: 'Svazek celeru',
        bodyChanges: ['Výraznější přibývání na váze je v tomto období běžné a souvisí s růstem miminka.'],
        toKnow: ['Poloha hlavičkou dolů (hlavičkové držení) je s blížícím se termínem častější.'],
      },
      sk: {
        babyDescription:
          'Bábätko je už dobre vytvorené a postupne sa usádza hlavičkou nadol v rámci prípravy na pôrod. V zostávajúcich týždňoch najmä naďalej priberá.',
        length: 'Približne 42,4 cm',
        comparison: 'Zväzok zeleru',
        bodyChanges: [
          'Výraznejší prírastok hmotnosti je v tomto období bežný, súvisí s rastom bábätka.',
        ],
        toKnow: [
          'Poloha hlavičkou nadol je s blížiacim sa termínom čoraz bežnejšia.',
        ],
      },
      hu: {
        babyDescription:
          'A baba már jól formált, és fokozatosan fejjel lefelé helyezkedik a szülésre készülve. A hátralévő hetekben főként tovább hízik.',
        length: 'Körülbelül 42,4 cm',
        comparison: 'Zellerköteg',
        bodyChanges: [
          'A kifejezettebb súlygyarapodás ebben az időszakban gyakori, a baba növekedéséhez kapcsolódik.',
        ],
        toKnow: [
          'A fejjel lefelé fekvés a kiírt időpont közeledtével egyre gyakoribbá válik.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul este deja bine format și se așază treptat cu capul în jos, în pregătirea nașterii. În săptămânile rămase continuă mai ales să se îngrașe.',
        length: 'Aproximativ 42,4 cm',
        comparison: 'Legătură de țelină',
        bodyChanges: [
          'O creștere în greutate mai vizibilă este frecventă în această perioadă, legată de creșterea bebelușului.',
        ],
        toKnow: [
          'Poziția cu capul în jos (prezentația craniană) devine mai frecventă pe măsură ce se apropie termenul.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето вече е добре оформено и постепенно се настанява с главата надолу, в подготовка за раждането. През оставащите седмици то основно продължава да наддава.',
        length: 'Около 42,4 см',
        comparison: 'Връзка целина',
        bodyChanges: [
          'По-забележимо наддаване на тегло е често през този период, свързано с растежа на бебето.',
        ],
        toKnow: [
          'Положението с главата надолу (главично предлежание) става по-често с наближаването на термина.',
        ],
      },
      sr: {
        babyDescription:
          'Беба је већ добро формирана и постепено се смешта главом надоле у припреми за порођај. Током преосталих недеља углавном наставља да добија на тежини.',
        length: 'Око 42,4 цм',
        comparison: 'Свежањ целера',
        bodyChanges: [
          'Приметније добијање на тежини је често током овог периода, повезано са растом бебе.',
        ],
        toKnow: [
          'Положај главом надоле (главно предлежање) постаје чешћи како се термин приближава.',
        ],
      },
      hr: {
        babyDescription:
          'Beba je već dobro oblikovana i postupno se smješta glavom prema dolje u pripremi za porod. Tijekom preostalih tjedana uglavnom se nastavlja debljati.',
        length: 'Oko 42,4 cm',
        comparison: 'Svežanj celera',
        bodyChanges: [
          'Primjetnije dobivanje na težini često je u ovom razdoblju, povezano s rastom bebe.',
        ],
        toKnow: [
          'Položaj glavom prema dolje (glavična prezentacija) postaje češći kako se termin približava.',
        ],
      },
      bs: {
        babyDescription:
          'Beba je već dobro oblikovana i postupno se smješta glavom prema dolje u pripremi za porođaj. Tokom preostalih sedmica uglavnom se nastavlja debljati.',
        length: 'Oko 42,4 cm',
        comparison: 'Svežanj celera',
        bodyChanges: [
          'Primjetnije dobivanje na težini često je u ovom razdoblju, povezano s rastom bebe.',
        ],
        toKnow: [
          'Položaj glavom prema dolje (glavična prezentacija) postaje češći kako se termin približava.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček je že dobro oblikovan in se postopoma namešča z glavo navzdol v pripravi na porod. V preostalih tednih se večinoma še naprej redi.',
        length: 'Približno 42,4 cm',
        comparison: 'Šop zelene',
        bodyChanges: [
          'Opaznejše pridobivanje teže je v tem obdobju pogosto, povezano z rastjo dojenčka.',
        ],
        toKnow: [
          'Položaj z glavo navzdol (glavična prezentacija) postaja pogostejši, ko se termin bliža.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु पहिल्यै राम्ररी बनिसकेको छ र बिस्तारै प्रसवको तयारीमा टाउको तल पारेर बस्दै छ। बाँकी हप्ताहरूमा उनी मुख्यतया तौल बढाउँदै जान्छ।',
        length: 'करिब 42.4 सेमी',
        comparison: 'सेलेरीको गुच्छा',
        bodyChanges: [
          'शिशुको वृद्धिसँग जोडिएर यो अवधिमा बढी स्पष्ट तौल वृद्धि सामान्य हुन्छ।',
        ],
        toKnow: [
          'प्रसव मिति नजिकिँदा टाउको तल पारेको अवस्था (सेफालिक प्रस्तुति) बढी सामान्य हुन्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා දැනටමත් හොඳින් සෑදී ඇති අතර, උපතට සූදානම් වීමට ක්‍රමයෙන් හිස පහළට හැරී සිටී. ඉතිරි සති තුළ ඔවුන් ප්‍රධාන වශයෙන් බර ලබා ගැනීම දිගටම කරගෙන යයි.',
        length: 'සෙ.මී. 42.4 පමණ',
        comparison: 'සෙලරි මිටියක්',
        bodyChanges: [
          'දරුවාගේ වර්ධනයට සම්බන්ධ, වඩා කැපී පෙනෙන බර වැඩිවීමක් මෙම කාලය තුළ පොදුයි.',
        ],
        toKnow: [
          'කාලය ළං වන විට හිස පහළට ඉරියව්ව (හිස් ඉදිරිපත් කිරීම) වඩා පොදු වේ.',
        ],
      },
      th: {
        babyDescription:
          'ทารกก่อตัวดีแล้วและค่อย ๆ เข้าท่าศีรษะลงเพื่อเตรียมคลอด ในสัปดาห์ที่เหลือจะน้ำหนักขึ้นเป็นหลัก',
        length: 'ประมาณ 42.4 ซม.',
        comparison: 'ผักขึ้นฉ่ายหนึ่งกำ',
        bodyChanges: [
          'น้ำหนักขึ้นชัดเจนขึ้นพบบ่อยในช่วงนี้ เกี่ยวข้องกับการเติบโตของทารก',
        ],
        toKnow: [
          'ท่าศีรษะลง (ท่าหัวนำ) พบบ่อยขึ้นเมื่อใกล้ครบกำหนด',
        ],
      },
      vi: {
        babyDescription:
          'Em bé đã hình thành tốt và dần dần quay đầu xuống để chuẩn bị cho cuộc sinh. Bé chủ yếu tiếp tục tăng cân trong những tuần còn lại.',
        length: 'Khoảng 42,4 cm',
        comparison: 'Một bó cần tây',
        bodyChanges: [
          'Tăng cân rõ rệt hơn là điều phổ biến trong giai đoạn này, liên quan đến sự phát triển của em bé.',
        ],
        toKnow: [
          'Ngôi đầu (ngôi chỏm) trở nên phổ biến hơn khi gần đến ngày sinh.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq allaqachon yaxshi shakllangan va tugʻruqqa tayyorgarlik sifatida asta-sekin boshi pastga joylashmoqda. Qolgan haftalarda u asosan vazn olishda davom etadi.',
        length: 'Taxminan 42,4 sm',
        comparison: 'Bir bogʻ selderey',
        bodyChanges: [
          'Bu davrda chaqaloqning oʻsishi bilan bogʻliq yaqqolroq vazn ortishi keng tarqalgan.',
        ],
        toKnow: [
          'Boshi pastga joylashuvi (bosh kelishi) muddat yaqinlashgani sari koʻproq uchraydi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə artıq yaxşı formalaşıb və doğuşa hazırlıq üçün tədricən başı aşağı vəziyyət alır. Qalan həftələrdə əsasən çəki yığmağa davam edir.',
        length: 'Təxminən 42,4 sm',
        comparison: 'Kərəviz dəstəsi',
        bodyChanges: [
          'Körpənin böyüməsi ilə bağlı bu dövrdə daha nəzərəçarpan çəki artımı geniş yayılıb.',
        ],
        toKnow: [
          'Başı aşağı vəziyyət (sefalik gəliş) vaxt yaxınlaşdıqca daha çox rast gəlinir.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი უკვე კარგად ჩამოყალიბებულია და ეტაპობრივად თავით ქვემოთ მოთავსდება მშობიარობისთვის მოსამზადებლად. დარჩენილი კვირების განმავლობაში ის ძირითადად წონაში იმატებს.',
        length: 'დაახლოებით 42,4 სმ',
        comparison: 'ნიახურის კონა',
        bodyChanges: [
          'უფრო შესამჩნევი წონის მატება ამ პერიოდში ხშირია და ბავშვის ზრდას უკავშირდება.',
        ],
        toKnow: [
          'თავით ქვემოთ მდებარეობა (თავის წინამდებარეობა) სავარაუდო ვადის მოახლოებასთან ერთად უფრო ხშირი ხდება.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան արդեն լավ ձևավորված է և աստիճանաբար տեղավորվում է գլխով ներքև՝ ծննդաբերությանը պատրաստվելու համար: Նա մնացած շաբաթների ընթացքում հիմնականում շարունակում է քաշ հավաքել:',
        length: 'Մոտ 42,4 սմ',
        comparison: 'Նեխուրի խուրձ',
        bodyChanges: [
          'Այս ժամանակահատվածում ավելի նկատելի քաշի ավելացումը տարածված է՝ կապված երեխայի աճի հետ:',
        ],
        toKnow: [
          'Գլխով ներքև դիրքը (գլխային նախադրություն) դառնում է ավելի տարածված, երբ ժամկետը մոտենում է:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл аллакай хуб ташаккул ёфтааст ва тадриҷан барои таваллуд бо сар ба поён ҷойгир мешавад. Дар ҳафтаҳои боқимонда ӯ асосан вазн гирифтанро идома медиҳад.',
        length: 'Тақрибан 42,4 см',
        comparison: 'Бастаи карафс',
        bodyChanges: [
          'Афзоиши намоёнтари вазн дар ин давра, ки бо рушди тифл алоқаманд аст, маъмул аст.',
        ],
        toKnow: [
          'Ҷойгиршавии сар ба поён (пешнамоиши сарӣ) ҳангоми наздик шудани мӯҳлат маъмултар мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай буга чейин эле жакшы түзүлгөн жана төрөткө даярдануу үчүн башын ылдый кылып акырындап орношот. Калган жумаларда негизинен салмак алууну улантат.',
        length: 'Болжол менен 42,4 см',
        comparison: 'Сельдерей данеги',
        bodyChanges: [
          'Бул мезгилде ымыркайдын өсүшүнө байланышкан салмак алуу көбүрөөк байкалышы кеңири таралган.',
        ],
        toKnow: [
          'Мөөнөт жакындаган сайын башы ылдый жайгашуу (баш көрүнүшү) көбүрөөк кездешет.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek eýýäm gowy emele geldi we dogruma taýýarlyk üçin kellesi aşak ýuwaş-ýuwaşdan ornaşýar. Ol galan hepdelerde esasan agram goşmagyny dowam etdirýär.',
        length: 'Takmynan 42,4 sm',
        comparison: 'Kereviz bukjasy',
        bodyChanges: [
          'Bu döwürde bäbegiň ösüşi bilen baglanyşykly has aýdyň agram goşmak umumy.',
        ],
        toKnow: [
          'Kellesi aşak ýerleşiş (sefalik ýerleşiş) möhlet ýakynlaşdygyça has ýygylaşýar.',
        ],
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
      da: {
        babyDescription: 'Babyen er allerede velformet og placerer sig gradvist med hovedet nedad som forberedelse til fødslen. Den fortsætter primært med at tage på i de resterende uger.',
        length: 'Ca. 42,4 cm',
        comparison: 'Et bundt selleri',
        bodyChanges: [
          'Mere mærkbar vægtøgning er almindelig i denne periode, forbundet med babyens vækst.',
        ],
        toKnow: [
          'Hoved-ned-position (kraniepræsentation) bliver mere almindelig, efterhånden som terminen nærmer sig.',
        ],
      },
      sv: {
        babyDescription: 'Babyen ar redan velformet och placerer sig gradvist med hovedet nedad som forberedelse till födslen. Den fortsätter primärt med at tage på i de resterende veckor.',
        length: 'Ca. 42,4 cm',
        comparison: 'Et bundt selleri',
        bodyChanges: [
          'Mere märkbar vägtögning ar almindelig i denne periode, forbundet med babyens väkst.',
        ],
        toKnow: [
          'Hoved-ned-position (kraniepräsentation) bliver mere almindelig, efterhånden som terminen närmer sig.',
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
      nb: {
        babyDescription:
          'Hjernen og nervesystemet er nå godt utviklet. Beina fortsetter å herde, bortsett fra hodeskallens, som forblir fleksible for å gjøre passasjen lettere under fødselen.',
        length: 'Omtrent 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: ['Vansker med å finne en behagelig sovestilling er vanlig på dette stadiet.'],
        toKnow: ['Fleksibiliteten i hodeskallens bein ved fødselen er midlertidig og lukker seg gradvis i løpet av det første året.'],
      },
      pl: {
        babyDescription:
          'Mózg i układ nerwowy są już dobrze rozwinięte. Kości nadal twardnieją, z wyjątkiem kości czaszki, które pozostają elastyczne, by ułatwić przejście podczas porodu.',
        length: 'Około 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: ['Trudności ze znalezieniem wygodnej pozycji do spania są na tym etapie częste.'],
        toKnow: ['Elastyczność kości czaszki przy porodzie jest tymczasowa i stopniowo zamyka się w ciągu pierwszego roku.'],
      },
      uk: {
        babyDescription:
          'Мозок і нервова система вже добре розвинені. Кістки продовжують твердішати, крім кісток черепа, які залишаються гнучкими, щоб полегшити проходження під час пологів.',
        length: 'Приблизно 43,7 см',
        comparison: 'Ананас',
        bodyChanges: ['Труднощі зі знаходженням зручної пози для сну на цьому етапі поширені.'],
        toKnow: ['Гнучкість кісток черепа під час народження тимчасова й поступово зникає протягом першого року.'],
      },
      cs: {
        babyDescription:
          'Mozek a nervový systém jsou nyní dobře vyvinuté. Kosti dál tvrdnou, kromě kostí lebky, které zůstávají pružné, aby se usnadnil průchod při porodu.',
        length: 'Asi 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: ['Potíže s nalezením pohodlné polohy ke spánku jsou v této fázi běžné.'],
        toKnow: ['Pružnost kostí lebky při narození je dočasná a během prvního roku se postupně uzavírá.'],
      },
      sk: {
        babyDescription:
          'Mozog a nervový systém sú už dobre vyvinuté. Kosti sa naďalej spevňujú, okrem kostí lebky, ktoré zostávajú pružné, aby uľahčili prechod počas pôrodu.',
        length: 'Približne 43,7 cm',
        comparison: 'Ananás',
        bodyChanges: [
          'Ťažkosti s nájdením pohodlnej polohy na spanie sú v tejto fáze bežné.',
        ],
        toKnow: [
          'Pružnosť kostí lebky pri narodení je dočasná a postupne sa počas prvého roka uzatvára.',
        ],
      },
      hu: {
        babyDescription:
          'Az agy és az idegrendszer már jól kifejlődött. A csontok tovább keményednek, kivéve a koponyacsontokat, amelyek rugalmasak maradnak, hogy megkönnyítsék az áthaladást a szülés során.',
        length: 'Körülbelül 43,7 cm',
        comparison: 'Ananász',
        bodyChanges: [
          'A kényelmes alvóhelyzet megtalálásának nehézsége ebben a szakaszban gyakori.',
        ],
        toKnow: [
          'A koponyacsontok születéskor való rugalmassága átmeneti, és az első év során fokozatosan záródik.',
        ],
      },
      ro: {
        babyDescription:
          'Creierul și sistemul nervos sunt acum bine dezvoltate. Oasele continuă să se întărească, cu excepția celor ale craniului, care rămân flexibile pentru a-i ușura trecerea în timpul nașterii.',
        length: 'Aproximativ 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Dificultatea de a găsi o poziție confortabilă de somn este frecventă în această etapă.',
        ],
        toKnow: [
          'Flexibilitatea oaselor craniului la naștere este temporară și se închide treptat pe parcursul primului an.',
        ],
      },
      bg: {
        babyDescription:
          'Мозъкът и нервната система вече са добре развити. Костите продължават да се втвърдяват, с изключение на костите на черепа, които остават гъвкави, за да улеснят преминаването при раждането.',
        length: 'Около 43,7 см',
        comparison: 'Ананас',
        bodyChanges: [
          'Затруднението да намериш удобна поза за сън е често на този етап.',
        ],
        toKnow: [
          'Гъвкавостта на костите на черепа при раждането е временна и постепенно се затваря през първата година.',
        ],
      },
      sr: {
        babyDescription:
          'Мозак и нервни систем су сада добро развијени. Кости настављају да очвршћавају, осим костију лобање, које остају флексибилне да олакшају пролазак током порођаја.',
        length: 'Око 43,7 цм',
        comparison: 'Ананас',
        bodyChanges: [
          'Тешкоћа да пронађеш удобан положај за спавање је честа у овој фази.',
        ],
        toKnow: [
          'Флексибилност костију лобање при рођењу је привремена и постепено се затвара током прве године.',
        ],
      },
      hr: {
        babyDescription:
          'Mozak i živčani sustav sada su dobro razvijeni. Kosti nastavljaju očvršćivati, osim kostiju lubanje, koje ostaju fleksibilne da olakšaju prolazak tijekom poroda.',
        length: 'Oko 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Teškoća pronalaženja udobnog položaja za spavanje česta je u ovoj fazi.',
        ],
        toKnow: [
          'Fleksibilnost kostiju lubanje pri rođenju je privremena i postupno se zatvara tijekom prve godine.',
        ],
      },
      bs: {
        babyDescription:
          'Mozak i nervni sistem sada su dobro razvijeni. Kosti nastavljaju očvršćivati, osim kostiju lubanje, koje ostaju fleksibilne da olakšaju prolazak tokom porođaja.',
        length: 'Oko 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Teškoća pronalaženja udobnog položaja za spavanje česta je u ovoj fazi.',
        ],
        toKnow: [
          'Fleksibilnost kostiju lubanje pri rođenju je privremena i postupno se zatvara tokom prve godine.',
        ],
      },
      sl: {
        babyDescription:
          'Možgani in živčni sistem so zdaj dobro razviti. Kosti se še naprej utrjujejo, razen lobanjskih kosti, ki ostajajo prožne, da olajšajo prehod med porodom.',
        length: 'Približno 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Težava pri iskanju udobnega položaja za spanje je v tej fazi pogosta.',
        ],
        toKnow: [
          'Prožnost lobanjskih kosti ob rojstvu je začasna in se postopoma zapira v prvem letu.',
        ],
      },
      ne: {
        babyDescription:
          'मस्तिष्क र स्नायु प्रणाली अब राम्ररी विकसित छन्। हड्डीहरू कडा हुँदै जान्छन्, खोपडीका हड्डीबाहेक, जो जन्मको क्रममा पार हुन सजिलो बनाउन लचिलो रहन्छन्।',
        length: 'करिब 43.7 सेमी',
        comparison: 'भुइँकटहर',
        bodyChanges: [
          'यस चरणमा सुत्नका लागि सहज स्थिति भेट्टाउन कठिनाइ सामान्य हो।',
        ],
        toKnow: [
          'जन्मका बेला खोपडीका हड्डीहरूको लचिलोपन अस्थायी हो र पहिलो वर्षमा बिस्तारै बन्द हुन्छ।',
        ],
      },
      si: {
        babyDescription:
          'මොළය සහ ස්නායු පද්ධතිය දැන් හොඳින් වර්ධනය වී ඇත. ප්‍රසූතියේදී ගමන් කිරීම පහසු කිරීමට නම්‍යශීලීව පවතින හිස් කබලේ ඒවා හැර අස්ථි තද වීම දිගටම කරගෙන යයි.',
        length: 'සෙ.මී. 43.7 පමණ',
        comparison: 'අන්නාසි ගෙඩියක්',
        bodyChanges: [
          'මෙම අවධියේදී සුවපහසු නිදාගන්නා ඉරියව්වක් සොයාගැනීමේ අපහසුව පොදුයි.',
        ],
        toKnow: [
          'උපතේදී හිස් කබල් අස්ථිවල නම්‍යශීලී බව තාවකාලික වන අතර පළමු වසර තුළ ක්‍රමයෙන් වැසෙයි.',
        ],
      },
      th: {
        babyDescription:
          'สมองและระบบประสาทพัฒนาดีแล้ว กระดูกยังคงแข็งตัวต่อไป ยกเว้นกระดูกกะโหลกที่ยังยืดหยุ่นเพื่อให้ผ่านได้ง่ายขึ้นระหว่างการคลอด',
        length: 'ประมาณ 43.7 ซม.',
        comparison: 'สับปะรด',
        bodyChanges: [
          'การหาท่านอนที่สบายยากเป็นเรื่องที่พบบ่อยในระยะนี้',
        ],
        toKnow: [
          'ความยืดหยุ่นของกระดูกกะโหลกเมื่อแรกเกิดเป็นเพียงชั่วคราวและค่อย ๆ ปิดในปีแรก',
        ],
      },
      vi: {
        babyDescription:
          'Não và hệ thần kinh giờ đây đã phát triển tốt. Xương tiếp tục cứng lại, trừ xương sọ vẫn còn mềm dẻo để dễ đi qua hơn trong lúc sinh.',
        length: 'Khoảng 43,7 cm',
        comparison: 'Quả dứa',
        bodyChanges: [
          'Khó tìm được tư thế ngủ thoải mái là điều phổ biến ở giai đoạn này.',
        ],
        toKnow: [
          'Sự mềm dẻo của xương sọ khi sinh chỉ là tạm thời và dần khép lại trong năm đầu tiên.',
        ],
      },
      uz: {
        babyDescription:
          'Miya va asab tizimi endi yaxshi rivojlangan. Suyaklar qotishda davom etadi, tugʻruq paytida oʻtishni osonlashtirish uchun egiluvchan qoladigan bosh suyagidan tashqari.',
        length: 'Taxminan 43,7 sm',
        comparison: 'Ananas',
        bodyChanges: [
          'Bu bosqichda uxlash uchun qulay holat topishda qiyinchilik keng tarqalgan.',
        ],
        toKnow: [
          'Bosh suyagi suyaklarining tugʻilishdagi egiluvchanligi vaqtinchalik va birinchi yil davomida asta-sekin yopiladi.',
        ],
      },
      az: {
        babyDescription:
          'Beyin və sinir sistemi artıq yaxşı inkişaf edib. Sümüklər bərkiməyə davam edir, doğuş zamanı keçidi asanlaşdırmaq üçün çevik qalan kəllə sümükləri istisna olmaqla.',
        length: 'Təxminən 43,7 sm',
        comparison: 'Ananas',
        bodyChanges: [
          'Rahat yuxu vəziyyəti tapmaqda çətinlik bu mərhələdə geniş yayılıb.',
        ],
        toKnow: [
          'Kəllə sümüklərinin doğuş zamanı çevikliyi müvəqqətidir və ilk il ərzində tədricən bağlanır.',
        ],
      },
      ka: {
        babyDescription:
          'ტვინი და ნერვული სისტემა ახლა კარგად არის განვითარებული. ძვლები აგრძელებს გამაგრებას, თავის ქალის ძვლების გარდა, რომლებიც მოქნილი რჩება, რომ მშობიარობისას გავლა გაიადვილოს.',
        length: 'დაახლოებით 43,7 სმ',
        comparison: 'ანანასი',
        bodyChanges: [
          'კომფორტული საძინებელი პოზის პოვნის სირთულე ამ ეტაპზე ხშირია.',
        ],
        toKnow: [
          'თავის ქალის ძვლების მოქნილობა დაბადებისას დროებითია და სიცოცხლის პირველ წელს ეტაპობრივად იხურება.',
        ],
      },
      hy: {
        babyDescription:
          'Ուղեղը և նյարդային համակարգն այժմ լավ զարգացած են: Ոսկորները շարունակում են կարծրանալ, բացի գանգի ոսկորներից, որոնք մնում են ճկուն՝ ծննդաբերության ժամանակ անցումը հեշտացնելու համար:',
        length: 'Մոտ 43,7 սմ',
        comparison: 'Արքայախնձոր',
        bodyChanges: [
          'Քնելու հարմար դիրք գտնելու դժվարությունը տարածված է այս փուլում:',
        ],
        toKnow: [
          'Ծննդյան պահին գանգի ոսկորների ճկունությունը ժամանակավոր է և աստիճանաբար փակվում է առաջին տարվա ընթացքում:',
        ],
      },
      tg: {
        babyDescription:
          'Майна ва системаи асаб акнун хуб инкишоф ёфтаанд. Устухонҳо сахт шуданро идома медиҳанд, ба истиснои устухонҳои косахонаи сар, ки чандир мемонанд, то гузаштан ҳангоми таваллудро осон кунанд.',
        length: 'Тақрибан 43,7 см',
        comparison: 'Ананас',
        bodyChanges: [
          'Душворӣ дар ёфтани вазъияти роҳати хоб дар ин марҳила маъмул аст.',
        ],
        toKnow: [
          'Чандирии устухонҳои косахонаи сар ҳангоми таваллуд муваққатӣ аст ва дар давоми соли аввал тадриҷан баста мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Мээ жана нерв системасы эми жакшы өнүккөн. Сөөктөр катып, баш сөөктөн башкасы, ал төрөт учурунда өтүүнү жеңилдетүү үчүн ийкемдүү бойдон калат.',
        length: 'Болжол менен 43,7 см',
        comparison: 'Ананас',
        bodyChanges: [
          'Бул этапта ыңгайлуу уйку абалын табуудагы кыйынчылык кеңири таралган.',
        ],
        toKnow: [
          'Төрөлгөндө баш сөөктөрдүн ийкемдүүлүгү убактылуу жана биринчи жылда акырындап жабылат.',
        ],
      },
      tk: {
        babyDescription:
          'Beýni we nerw ulgamy indi gowy ösdi. Süýekler gataşmagyny dowam etdirýär, kelle süňklerinden başga, olar dogrum wagtynda geçmegi aňsatlaşdyrmak üçin çeýe galýar.',
        length: 'Takmynan 43,7 sm',
        comparison: 'Ananas',
        bodyChanges: [
          'Rahat ýatmak ýagdaýyny tapmakda kynçylyk bu tapgyrda umumy.',
        ],
        toKnow: [
          'Doglanda kelle süňkleriniň çeýeligi wagtlaýyn we birinji ýylda ýuwaş-ýuwaşdan ýapylýar.',
        ],
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
      da: {
        babyDescription: 'Hjernen og nervesystemet er nu veludviklet. Knoglerne fortsætter med at hærde, undtagen kranieknoglerne, som forbliver fleksible for at gøre det lettere at passere igennem under fødslen.',
        length: 'Ca. 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Vanskeligheder med at finde en komfortabel sovestilling er almindeligt på dette stadie.',
        ],
        toKnow: [
          'Fleksibiliteten af kranieknoglerne ved fødslen er midlertidig og lukker gradvist i løbet af det første år.',
        ],
      },
      sv: {
        babyDescription: 'Hjernen och nervesystemet ar nu veludviklet. Knoglerne fortsätter med at härde, undtagen kranieknoglerne, som forbliver fleksible for at göre det lettere at passere igennem under födslen.',
        length: 'Ca. 43,7 cm',
        comparison: 'Ananas',
        bodyChanges: [
          'Vanskeligheder med at finde en komfortabel sovestilling ar almindeligt på dette stadie.',
        ],
        toKnow: [
          'Fleksibiliteten av kranieknoglerne ved födslen ar midlertidig och lukker gradvist i löbet av det förste år.',
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
      nb: {
        babyDescription: 'Babyen, sammenkrøllet på grunn av plassmangel, holder vanligvis bena foldet mot brystet mens den fortsetter å bevege seg jevnlig.',
        length: 'Omtrent 45 cm',
        comparison: 'Cantaloupemelon',
        bodyChanges: ['Til tross for den reduserte plassen er babyens bevegelser og formen på magen din som regel fortsatt merkbare.'],
        toKnow: ['Å fortsette å følge med på babyens vanlige bevegelser er fortsatt relevant helt frem til fødselen.'],
      },
      pl: {
        babyDescription: 'Dziecko, skulone z braku miejsca, zazwyczaj trzyma nogi podkulone w stronę klatki piersiowej, nadal regularnie się poruszając.',
        length: 'Około 45 cm',
        comparison: 'Melon kantalupa',
        bodyChanges: ['Mimo mniejszej ilości miejsca ruchy dziecka i zmieniający się kształt Twojego brzucha zazwyczaj nadal są zauważalne.'],
        toKnow: ['Zwracanie uwagi na zwykłe ruchy dziecka pozostaje istotne aż do porodu.'],
      },
      uk: {
        babyDescription: 'Дитина, скулена через брак місця, зазвичай тримає ноги підігнутими до грудей, продовжуючи регулярно рухатися.',
        length: 'Приблизно 45 см',
        comparison: 'Диня канталупа',
        bodyChanges: ['Попри меншу кількість місця, рухи дитини й змінна форма вашого живота зазвичай усе ще помітні.'],
        toKnow: ['Увага до звичних рухів дитини залишається актуальною аж до пологів.'],
      },
      cs: {
        babyDescription: 'Miminko, schoulené kvůli nedostatku místa, obvykle drží nožičky přitažené k hrudi a přitom se dál pravidelně pohybuje.',
        length: 'Asi 45 cm',
        comparison: 'Cantaloupe meloun',
        bodyChanges: ['Navzdory menšímu prostoru zůstávají pohyby miminka a měnící se tvar vašeho břicha obvykle stále znatelné.'],
        toKnow: ['Pozornost vůči obvyklým pohybům miminka zůstává aktuální až do porodu.'],
      },
      sk: {
        babyDescription:
          'Bábätko, stočené z nedostatku miesta, si zvyčajne drží nohy pokrčené k hrudi a naďalej sa pravidelne pohybuje.',
        length: 'Približne 45 cm',
        comparison: 'Cukrový melón',
        bodyChanges: [
          'Napriek zníženému priestoru zostávajú pohyby bábätka a meniaci sa tvar vášho brucha zvyčajne postrehnuteľné.',
        ],
        toKnow: [
          'Venovať pozornosť obvyklým pohybom bábätka zostáva dôležité až do pôrodu.',
        ],
      },
      hu: {
        babyDescription:
          'A baba, helyhiány miatt összegömbölyödve, általában a mellkasához húzva tartja a lábait, miközben rendszeresen mozog.',
        length: 'Körülbelül 45 cm',
        comparison: 'Sárgadinnye',
        bodyChanges: [
          'A csökkent hely ellenére a baba mozgásai és a hasad változó alakja általában észrevehetők maradnak.',
        ],
        toKnow: [
          'A baba szokásos mozgásainak figyelése a szülésig érvényes marad.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul, ghemuit din lipsă de spațiu, își ține în general picioarele îndoite spre piept, continuând în același timp să se miște în mod regulat.',
        length: 'Aproximativ 45 cm',
        comparison: 'Pepene galben',
        bodyChanges: [
          'În ciuda spațiului redus, mișcările bebelușului și forma în schimbare a burții tale rămân în general vizibile.',
        ],
        toKnow: [
          'Atenția acordată mișcărilor obișnuite ale bebelușului rămâne importantă până la naștere.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето, свито от липса на място, обикновено държи краката си сгънати към гърдите, докато продължава да се движи редовно.',
        length: 'Около 45 см',
        comparison: 'Пъпеш канталуп',
        bodyChanges: [
          'Въпреки намаленото място, движенията на бебето и променящата се форма на корема ти обикновено остават забележими.',
        ],
        toKnow: [
          'Продължаването на вниманието към обичайните движения на бебето остава уместно чак до раждането.',
        ],
      },
      sr: {
        babyDescription:
          'Беба, склупчана због недостатка места, обично држи ноге савијене према грудима док наставља редовно да се креће.',
        length: 'Око 45 цм',
        comparison: 'Диња канталуп',
        bodyChanges: [
          'Упркос смањеном простору, покрети бебе и променљив облик твог стомака обично остају приметни.',
        ],
        toKnow: [
          'Настављање пажње на уобичајене покрете бебе остаје релевантно све до порођаја.',
        ],
      },
      hr: {
        babyDescription:
          'Beba, sklupčana zbog nedostatka prostora, obično drži noge savijene prema prsima dok se nastavlja redovito kretati.',
        length: 'Oko 45 cm',
        comparison: 'Dinja',
        bodyChanges: [
          'Unatoč smanjenom prostoru, bebini pokreti i promjenjiv oblik tvog trbuha obično ostaju primjetni.',
        ],
        toKnow: [
          'Nastavak pozornosti prema uobičajenim bebinim pokretima ostaje relevantan sve do poroda.',
        ],
      },
      bs: {
        babyDescription:
          'Beba, sklupčana zbog nedostatka prostora, obično drži noge savijene prema prsima dok se nastavlja redovito kretati.',
        length: 'Oko 45 cm',
        comparison: 'Dinja',
        bodyChanges: [
          'Unatoč smanjenom prostoru, bebini pokreti i promjenjiv oblik tvog trbuha obično ostaju primjetni.',
        ],
        toKnow: [
          'Nastavak pozornosti prema uobičajenim bebinim pokretima ostaje relevantan sve do porođaja.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček, stisnjen zaradi pomanjkanja prostora, običajno drži noge pokrčene proti prsim, medtem ko se redno giblje.',
        length: 'Približno 45 cm',
        comparison: 'Melona',
        bodyChanges: [
          'Kljub zmanjšanemu prostoru dojenčkovi gibi in spremenljiva oblika tvojega trebuha običajno ostajajo opazni.',
        ],
        toKnow: [
          'Nadaljevanje pozornosti do običajnih dojenčkovih gibov ostaja pomembno vse do poroda.',
        ],
      },
      ne: {
        babyDescription:
          'ठाउँको कमीले खुम्चिएको शिशुले सामान्यतया नियमित रूपमा चल्दै गर्दा आफ्ना खुट्टाहरू छातीतिर पट्याएर राख्छ।',
        length: 'करिब 45 सेमी',
        comparison: 'खरबुजा',
        bodyChanges: [
          'ठाउँ घटे पनि, शिशुका चालहरू र तपाईंको पेटको बदलिँदो आकार सामान्यतया देखिइरहन्छन्।',
        ],
        toKnow: [
          'प्रसवसम्म शिशुका सामान्य चालहरूमा ध्यान दिइरहनु सान्दर्भिक रहन्छ।',
        ],
      },
      si: {
        babyDescription:
          'ඉඩ නොමැතිකම නිසා නැමී සිටින දරුවා, නිතිපතා චලනය වන අතරතුර, සාමාන්‍යයෙන් ඔවුන්ගේ කකුල් පපුව දෙසට නමා තබාගනී.',
        length: 'සෙ.මී. 45 පමණ',
        comparison: 'කැන්ටලූප් ගෙඩියක්',
        bodyChanges: [
          'අඩු වූ ඉඩ තිබියදීත්, දරුවාගේ චලනයන් සහ ඔබේ බඩේ වෙනස් වන හැඩය සාමාන්‍යයෙන් කැපී පෙනෙයි.',
        ],
        toKnow: [
          'දරුවාගේ සුපුරුදු චලනයන් කෙරෙහි අවධානය යොමු කිරීම දිගටම කිරීම උපත දක්වාම අදාළව පවතී.',
        ],
      },
      th: {
        babyDescription:
          'ทารกซึ่งขดตัวเพราะขาดพื้นที่ โดยทั่วไปงอขาเข้าหาหน้าอกขณะเคลื่อนไหวอย่างสม่ำเสมอต่อไป',
        length: 'ประมาณ 45 ซม.',
        comparison: 'แคนตาลูป',
        bodyChanges: [
          'แม้พื้นที่ลดลง การเคลื่อนไหวของทารกและรูปร่างของหน้าท้องที่เปลี่ยนไปมักยังสังเกตเห็นได้',
        ],
        toKnow: [
          'การใส่ใจการเคลื่อนไหวตามปกติของทารกต่อไปยังคงสำคัญจนถึงวันคลอด',
        ],
      },
      vi: {
        babyDescription:
          'Em bé, cuộn tròn vì thiếu chỗ, thường giữ chân co về phía ngực trong khi vẫn tiếp tục cử động đều đặn.',
        length: 'Khoảng 45 cm',
        comparison: 'Dưa lưới',
        bodyChanges: [
          'Dù chỗ trống giảm đi, các cử động của em bé và hình dạng thay đổi của bụng bạn thường vẫn rõ rệt.',
        ],
        toKnow: [
          'Tiếp tục chú ý đến các cử động thông thường của em bé vẫn quan trọng cho đến tận ngày sinh.',
        ],
      },
      uz: {
        babyDescription:
          'Joy yetishmasligi sababli buklanib olgan chaqaloq odatda muntazam harakatlanishda davom etar ekan, oyoqlarini koʻkrak tomon buklagan holda ushlaydi.',
        length: 'Taxminan 45 sm',
        comparison: 'Qovun (kantalupa)',
        bodyChanges: [
          'Joy kamayganiga qaramay, chaqaloqning harakatlari va qorningizning oʻzgaruvchan shakli odatda sezilarli boʻlib qoladi.',
        ],
        toKnow: [
          'Chaqaloqning odatiy harakatlariga eʼtibor berishda davom etish tugʻruqqacha dolzarb boʻlib qoladi.',
        ],
      },
      az: {
        babyDescription:
          'Yer çatışmazlığına görə büzüşmüş körpə adətən müntəzəm hərəkət etməyə davam edərək ayaqlarını sinəsinə doğru bükülü saxlayır.',
        length: 'Təxminən 45 sm',
        comparison: 'Qovun',
        bodyChanges: [
          'Yer azalsa da, körpənin hərəkətləri və qarnınızın dəyişən forması adətən nəzərə çarpan qalır.',
        ],
        toKnow: [
          'Körpənin adi hərəkətlərinə diqqət yetirməyə davam etmək doğuşa qədər aktual qalır.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი, სივრცის ნაკლებობის გამო მოკუნტული, ფეხებს ზოგადად მკერდისკენ მოკეცილს ინარჩუნებს და ამავდროულად რეგულარულად აგრძელებს მოძრაობას.',
        length: 'დაახლოებით 45 სმ',
        comparison: 'კანტალუპის ნესვი',
        bodyChanges: [
          'შემცირებული სივრცის მიუხედავად, ბავშვის მოძრაობები და თქვენი მუცლის ცვალებადი ფორმა, როგორც წესი, შესამჩნევი რჩება.',
        ],
        toKnow: [
          'ბავშვის ჩვეულებრივ მოძრაობებზე ყურადღების გამახვილება მშობიარობამდე აქტუალური რჩება.',
        ],
      },
      hy: {
        babyDescription:
          'Տարածքի պակասի պատճառով կծկված երեխան սովորաբար պահում է ոտքերը կրծքին ծալած՝ շարունակելով կանոնավոր շարժվել:',
        length: 'Մոտ 45 սմ',
        comparison: 'Կանտալուպ սեխ',
        bodyChanges: [
          'Չնայած նվազած տարածքին՝ երեխայի շարժումները և ձեր որովայնի փոփոխվող ձևը սովորաբար մնում են նկատելի:',
        ],
        toKnow: [
          'Երեխայի սովորական շարժումներին ուշադրություն դարձնելը մնում է տեղին մինչև ծննդաբերությունը:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл, ки аз камбуди ҷой печида аст, одатан пойҳояшро ба сӯи сина бардошта нигоҳ медорад ва ҳамзамон мунтазам ҳаракат карданро идома медиҳад.',
        length: 'Тақрибан 45 см',
        comparison: 'Харбуза',
        bodyChanges: [
          'Бо вуҷуди ҷойи камшуда, ҳаракатҳои тифл ва тағйирёбии шакли шикам одатан намоён мемонанд.',
        ],
        toKnow: [
          'Идомаи таваҷҷӯҳ ба ҳаракатҳои одатии тифл то худи таваллуд мувофиқ боқӣ мемонад.',
        ],
      },
      ky: {
        babyDescription:
          'Орун жетишсиздигинен бүрүшүп калган ымыркай адатта буттарын көкүрөгүнө карай бүгүп кармайт, ошол эле учурда үзгүлтүксүз кыймылдайт.',
        length: 'Болжол менен 45 см',
        comparison: 'Кантолуп коону',
        bodyChanges: [
          'Орун азайганына карабастан, ымыркайдын кыймылдары жана курсагыңыздын өзгөрүп жаткан формасы адатта байкалат.',
        ],
        toKnow: [
          'Ымыркайдын адаттагы кыймылдарына көңүл буруунун төрөткө чейин мааниси бар.',
        ],
      },
      tk: {
        babyDescription:
          'Ýer ýetmezçiliginden büzülen bäbek aýaklaryny adatça döşüne tarap bükülen saklaýar, yzygiderli hereket etmegini dowam etdirýär.',
        length: 'Takmynan 45 sm',
        comparison: 'Gawun',
        bodyChanges: [
          'Ýeriň azalmagyna garamazdan, bäbegiň hereketleri we garnyňyzyň üýtgeýän görnüşi adatça duýulyp galýar.',
        ],
        toKnow: [
          'Bäbegiň adaty hereketlerine üns bermegi dowam etdirmek dogrumyň özüne çenli degişli bolup galýar.',
        ],
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
      da: {
        babyDescription: 'Babyen, sammenrullet på grund af pladsmangel, holder generelt benene bøjet mod brystet, mens den fortsætter med at bevæge sig jævnligt.',
        length: 'Ca. 45 cm',
        comparison: 'Cantaloupe-melon',
        bodyChanges: [
          'Trods den reducerede plads er babyens bevægelser og mavens skiftende form normalt stadig mærkbare.',
        ],
        toKnow: [
          'At fortsætte med at være opmærksom på babyens sædvanlige bevægelser er fortsat relevant helt op til fødslen.',
        ],
      },
      sv: {
        babyDescription: 'Babyen, sammenrullet på grund av pladsmangel, holder generelt benene böjet mod brystet, mens den fortsätter med at beväge sig jävnligt.',
        length: 'Ca. 45 cm',
        comparison: 'Cantaloupe-melon',
        bodyChanges: [
          'Trods den reducerede plads ar babyens bevägelser och mavens skiftende form normalt fortfarande märkbare.',
        ],
        toKnow: [
          'At fortsätte med at väre opmärksom på babyens sädvanlige bevägelser ar fortsat relevant helt op till födslen.',
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
      nb: {
        babyDescription: 'Babyen fortsetter å fylle ut, noe som vil hjelpe den å regulere temperaturen når den er født. Plassen som er tilgjengelig i livmoren, blir mer begrenset.',
        length: 'Omtrent 46,2 cm',
        comparison: 'Honningmelon',
        bodyChanges: ['Mer uttalt trykk i bekkenet kan dukke opp etter hvert som babyen gradvis synker ned.'],
        toKnow: ['Til tross for den begrensede plassen bør babyen fortsette å bevege seg med en regelmessighet som ligner de foregående ukene.'],
      },
      pl: {
        babyDescription: 'Dziecko nadal się zaokrągla, co pomoże mu regulować temperaturę po urodzeniu. Dostępne miejsce w macicy staje się bardziej ograniczone.',
        length: 'Około 46,2 cm',
        comparison: 'Melon miodowy',
        bodyChanges: ['Może pojawić się wyraźniejszy ucisk w miednicy, gdy dziecko stopniowo się obniża.'],
        toKnow: ['Mimo ograniczonej ilości miejsca dziecko powinno nadal poruszać się z regularnością podobną do poprzednich tygodni.'],
      },
      uk: {
        babyDescription: 'Дитина продовжує округлюватися, що допоможе їй регулювати температуру після народження. Доступне місце в матці стає обмеженішим.',
        length: 'Приблизно 46,2 см',
        comparison: 'Диня медова',
        bodyChanges: ['Може з’явитися виразніший тиск у тазі, коли дитина поступово опускається.'],
        toKnow: ['Попри обмежене місце, дитина має й далі рухатися з регулярністю, подібною до попередніх тижнів.'],
      },
      cs: {
        babyDescription: 'Miminko dál zakulacuje, což mu po narození pomůže regulovat teplotu. Dostupné místo v děloze se stává omezenějším.',
        length: 'Asi 46,2 cm',
        comparison: 'Medový meloun',
        bodyChanges: ['Může se objevit výraznější tlak v pánvi, jak miminko postupně sestupuje.'],
        toKnow: ['Navzdory omezenému místu by se miminko mělo dál pohybovat s pravidelností podobnou předchozím týdnům.'],
      },
      sk: {
        babyDescription:
          'Bábätko sa naďalej zaobľuje, čo mu po narodení pomôže regulovať teplotu. Dostupné miesto v maternici sa stáva obmedzenejším.',
        length: 'Približne 46,2 cm',
        comparison: 'Medový melón',
        bodyChanges: [
          'Môže sa objaviť výraznejší tlak v panve, keď bábätko postupne klesá.',
        ],
        toKnow: [
          'Napriek obmedzenému miestu by sa bábätko malo naďalej pohybovať s pravidelnosťou podobnou predchádzajúcim týždňom.',
        ],
      },
      hu: {
        babyDescription:
          'A baba tovább gömbölyödik, ami segíteni fog neki a hőmérsékletének szabályozásában a születés után. A méhben rendelkezésre álló hely korlátozottabbá válik.',
        length: 'Körülbelül 46,2 cm',
        comparison: 'Mézdinnye',
        bodyChanges: [
          'Kifejezettebb medencei nyomás jelentkezhet, ahogy a baba fokozatosan lejjebb ereszkedik.',
        ],
        toKnow: [
          'A korlátozott hely ellenére a babának az előző hetekhez hasonló rendszerességgel kell mozognia.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul continuă să se rotunjească, ceea ce îl va ajuta să-și regleze temperatura după naștere. Spațiul disponibil în uter devine mai limitat.',
        length: 'Aproximativ 46,2 cm',
        comparison: 'Pepene miere',
        bodyChanges: [
          'O presiune pelviană mai pronunțată poate apărea pe măsură ce bebelușul coboară treptat.',
        ],
        toKnow: [
          'În ciuda spațiului limitat, bebelușul ar trebui să continue să se miște cu o regularitate similară cu cea din săptămânile precedente.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето продължава да се закръглява, което ще му помогне да регулира температурата си след раждането. Наличното място в матката става по-ограничено.',
        length: 'Около 46,2 см',
        comparison: 'Пъпеш медена роса',
        bodyChanges: [
          'По-изразен натиск в таза може да се появи, докато бебето постепенно се спуска.',
        ],
        toKnow: [
          'Въпреки ограниченото място, бебето трябва да продължава да се движи с редовност, подобна на предишните седмици.',
        ],
      },
      sr: {
        babyDescription:
          'Беба наставља да се заобљује, што ће јој помоћи да регулише температуру када се роди. Расположиво место у материци постаје ограниченије.',
        length: 'Око 46,2 цм',
        comparison: 'Диња медена роса',
        bodyChanges: [
          'Може се појавити израженији притисак у карлици како се беба постепено спушта.',
        ],
        toKnow: [
          'Упркос ограниченом простору, беба би требало да се наставља да се креће са редовношћу сличном претходним недељама.',
        ],
      },
      hr: {
        babyDescription:
          'Beba se nastavlja zaobljavati, što će joj pomoći regulirati temperaturu kad se rodi. Raspoloživi prostor u maternici postaje ograničeniji.',
        length: 'Oko 46,2 cm',
        comparison: 'Medena dinja',
        bodyChanges: [
          'Može se pojaviti izraženiji pritisak u zdjelici kako se beba postupno spušta.',
        ],
        toKnow: [
          'Unatoč ograničenom prostoru, beba bi se trebala nastaviti kretati s redovitošću sličnom prethodnim tjednima.',
        ],
      },
      bs: {
        babyDescription:
          'Beba se nastavlja zaobljavati, što će joj pomoći regulirati temperaturu kad se rodi. Raspoloživi prostor u maternici postaje ograničeniji.',
        length: 'Oko 46,2 cm',
        comparison: 'Medena dinja',
        bodyChanges: [
          'Može se pojaviti izraženiji pritisak u zdjelici kako se beba postupno spušta.',
        ],
        toKnow: [
          'Unatoč ograničenom prostoru, beba bi se trebala nastaviti kretati s redovitošću sličnom prethodnim sedmicama.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček se še naprej zaobljuje, kar mu bo pomagalo uravnavati temperaturo, ko se rodi. Razpoložljivi prostor v maternici postaja omejenejši.',
        length: 'Približno 46,2 cm',
        comparison: 'Medena melona',
        bodyChanges: [
          'Lahko se pojavi izrazitejši pritisk v medenici, ko se dojenček postopoma spušča.',
        ],
        toKnow: [
          'Kljub omejenemu prostoru bi se dojenček moral še naprej gibati z redovnostjo, podobno prejšnjim tednom.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु बढ्दै जान्छ, जसले जन्मपछि उनको तापक्रम नियमन गर्न मद्दत गर्नेछ। गर्भाशयमा उपलब्ध ठाउँ बढी सीमित हुन्छ।',
        length: 'करिब 46.2 सेमी',
        comparison: 'हनीड्यू खरबुजा',
        bodyChanges: [
          'शिशु बिस्तारै तल झर्दा पेल्भिक दबाब बढी स्पष्ट देखिन सक्छ।',
        ],
        toKnow: [
          'ठाउँ सीमित भए पनि, शिशुले अघिल्ला हप्ताहरूजस्तै नियमितताका साथ चलिरहनुपर्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා පිරී යාම දිගටම කරගෙන යන අතර, එය උපතින් පසු ඔවුන්ගේ උෂ්ණත්වය නියාමනය කිරීමට උපකාරී වනු ඇත. ගර්භාෂයේ පවතින ඉඩ වඩා සීමිත වේ.',
        length: 'සෙ.මී. 46.2 පමණ',
        comparison: 'හනිඩිව් ගෙඩියක්',
        bodyChanges: [
          'දරුවා ක්‍රමයෙන් පහළට බැසීමත් සමඟ වඩා කැපී පෙනෙන ශ්‍රෝණි පීඩනයක් දිස්විය හැක.',
        ],
        toKnow: [
          'සීමිත ඉඩ තිබියදීත්, දරුවා පෙර සතිවලට සමාන නිතිපතා බවකින් චලනය වීම දිගටම කළ යුතුයි.',
        ],
      },
      th: {
        babyDescription:
          'ทารกยังคงอวบขึ้น ซึ่งจะช่วยควบคุมอุณหภูมิเมื่อคลอดแล้ว พื้นที่ว่างในมดลูกจำกัดมากขึ้น',
        length: 'ประมาณ 46.2 ซม.',
        comparison: 'เมลอนฮันนีดิว',
        bodyChanges: [
          'อาจมีแรงกดที่อุ้งเชิงกรานชัดเจนขึ้นเมื่อทารกค่อย ๆ เคลื่อนต่ำลง',
        ],
        toKnow: [
          'แม้พื้นที่จำกัด ทารกควรเคลื่อนไหวต่อไปด้วยความสม่ำเสมอที่คล้ายกับสัปดาห์ก่อนหน้า',
        ],
      },
      vi: {
        babyDescription:
          'Em bé tiếp tục đầy đặn hơn, điều này sẽ giúp bé điều hòa thân nhiệt sau khi chào đời. Khoảng trống trong tử cung trở nên hạn chế hơn.',
        length: 'Khoảng 46,2 cm',
        comparison: 'Dưa mật',
        bodyChanges: [
          'Áp lực vùng chậu rõ rệt hơn có thể xuất hiện khi em bé dần tụt xuống.',
        ],
        toKnow: [
          'Dù chỗ trống hạn chế, em bé vẫn nên tiếp tục cử động với sự đều đặn tương tự những tuần trước.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq toʻlishishda davom etadi, bu tugʻilgandan keyin haroratini tartibga solishga yordam beradi. Bachadondagi mavjud joy yanada cheklanadi.',
        length: 'Taxminan 46,2 sm',
        comparison: 'Asal qovun',
        bodyChanges: [
          'Chaqaloq asta-sekin pastga tushganda chanoqdagi bosim yaqqolroq paydo boʻlishi mumkin.',
        ],
        toKnow: [
          'Joy cheklanganiga qaramay, chaqaloq oldingi haftalarga oʻxshash muntazamlikda harakatlanishda davom etishi kerak.',
        ],
      },
      az: {
        babyDescription:
          'Körpə dolmağa davam edir ki, bu da doğulduqdan sonra temperaturunu tənzimləməyə kömək edəcək. Uşaqlıqdakı mövcud yer daha məhdud olur.',
        length: 'Təxminən 46,2 sm',
        comparison: 'Bal qovunu',
        bodyChanges: [
          'Körpə tədricən aşağı endikcə daha bariz çanaq təzyiqi ola bilər.',
        ],
        toKnow: [
          'Məhdud yerə baxmayaraq körpə əvvəlki həftələrə bənzər müntəzəmliklə hərəkət etməyə davam etməlidir.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი აგრძელებს შევსებას, რაც დაბადების შემდეგ ტემპერატურის რეგულირებაში დაეხმარება. საშვილოსნოში არსებული სივრცე უფრო შეზღუდული ხდება.',
        length: 'დაახლოებით 46,2 სმ',
        comparison: 'ბაღის ნესვი',
        bodyChanges: [
          'უფრო გამოხატული წნევა მენჯზე შეიძლება გამოჩნდეს, რადგან ბავშვი ეტაპობრივად ეშვება.',
        ],
        toKnow: [
          'შეზღუდული სივრცის მიუხედავად, ბავშვი წინა კვირების მსგავსი რეგულარულობით უნდა აგრძელებდეს მოძრაობას.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան շարունակում է լցվել, ինչը կօգնի նրան կարգավորել իր ջերմաստիճանը ծնվելուց հետո: Արգանդում հասանելի տարածքը դառնում է ավելի սահմանափակ:',
        length: 'Մոտ 46,2 սմ',
        comparison: 'Մեղրասեխ',
        bodyChanges: [
          'Ավելի արտահայտված կոնքային ճնշում կարող է հայտնվել, երբ երեխան աստիճանաբար իջնում է:',
        ],
        toKnow: [
          'Չնայած սահմանափակ տարածքին՝ երեխան պետք է շարունակի շարժվել նախորդ շաբաթների նման կանոնավորությամբ:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл пурра шуданро идома медиҳад, ки ба танзими ҳарорати ӯ пас аз таваллуд кумак мекунад. Ҷойи дастрас дар бачадон маҳдудтар мешавад.',
        length: 'Тақрибан 46,2 см',
        comparison: 'Харбузаи сафед',
        bodyChanges: [
          'Фишори шадидтари коса метавонад ҳангоми тадриҷан поён рафтани тифл пайдо шавад.',
        ],
        toKnow: [
          'Бо вуҷуди ҷойи маҳдуд, тифл бояд бо мунтазамии монанд ба ҳафтаҳои пештара ҳаракат карданро идома диҳад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай толууну улантат, бул төрөлгөндөн кийин дене температурасын жөнгө салууга жардам берет. Жатындагы жеткиликтүү орун чектелүүрөөк болот.',
        length: 'Болжол менен 46,2 см',
        comparison: 'Балдуу коон',
        bodyChanges: [
          'Ымыркай акырындап ылдый түшкөн сайын жамбаш басымы көбүрөөк байкалышы мүмкүн.',
        ],
        toKnow: [
          'Орун чектелген болсо да, ымыркай мурунку жумаларга окшош үзгүлтүксүздүк менен кыймылдоону улантышы керек.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek dolmagyny dowam etdirýär, bu dograndan soň temperaturasyny sazlamaga kömek eder. Ýatgydaky elýeterli ýer has çäkli bolýar.',
        length: 'Takmynan 46,2 sm',
        comparison: 'Ak gawun',
        bodyChanges: [
          'Bäbek ýuwaş-ýuwaşdan aşak düşende çanakda has aýdyň basyş peýda bolup biler.',
        ],
        toKnow: [
          'Çäkli ýere garamazdan, bäbek öňki hepdelere meňzeş yzygiderlilik bilen hereket etmegini dowam etdirmeli.',
        ],
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
      da: {
        babyDescription: 'Babyen fortsætter med at fylde ud, hvilket vil hjælpe den med at regulere sin temperatur, når den er født. Den tilgængelige plads i livmoderen bliver mere begrænset.',
        length: 'Ca. 46,2 cm',
        comparison: 'Honningmelon',
        bodyChanges: [
          'Mere udtalt bækkentryk kan opstå, efterhånden som babyen gradvist sænker sig.',
        ],
        toKnow: [
          'Trods den begrænsede plads bør babyen fortsætte med at bevæge sig med en regelmæssighed svarende til tidligere uger.',
        ],
      },
      sv: {
        babyDescription: 'Babyen fortsätter med at fylde ud, hvilket vil hjälpe den med at regulere sin temperatur, når den ar födt. Den tilgängelige plads i livmoderen bliver mere begränset.',
        length: 'Ca. 46,2 cm',
        comparison: 'Honningmelon',
        bodyChanges: [
          'Mere udtalt bäkkentryk kan opstå, efterhånden som babyen gradvist sänker sig.',
        ],
        toKnow: [
          'Trods den begränsede plads bör babyen fortsätte med at beväge sig med en regelmässighed svarende till tidligere veckor.',
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
      nb: {
        babyDescription:
          'Lungene har vanligvis modnet nok til å gjøre selvstendig pusting mulig, og babyen er i stand til å suge og fordøye.',
        length: 'Omtrent 47,4 cm',
        comparison: 'Romanosalat',
        bodyChanges: ['Du kan av og til kjenne deg mer andpusten, siden livmoren tar mye plass under ribbeina.'],
        toKnow: ['Svangerskapet regnes som fullbåret mellom uke 37 og uke 42.'],
      },
      pl: {
        babyDescription:
          'Płuca są zazwyczaj na tyle dojrzałe, że umożliwiają samodzielne oddychanie, a dziecko potrafi ssać i trawić.',
        length: 'Około 47,4 cm',
        comparison: 'Sałata rzymska',
        bodyChanges: ['Czasem możesz odczuwać większą duszność, ponieważ macica zajmuje dużo miejsca pod żebrami.'],
        toKnow: ['Ciążę uważa się za donoszoną między 37. a 42. tygodniem.'],
      },
      uk: {
        babyDescription:
          'Легені зазвичай достатньо дозріли, щоб забезпечити самостійне дихання, а дитина вміє смоктати й перетравлювати.',
        length: 'Приблизно 47,4 см',
        comparison: 'Салат ромен',
        bodyChanges: ['Іноді ви можете відчувати більшу задишку, оскільки матка займає багато місця під ребрами.'],
        toKnow: ['Вагітність вважається доношеною між 37-м і 42-м тижнем.'],
      },
      cs: {
        babyDescription:
          'Plíce jsou obvykle dostatečně vyzrálé, aby umožnily samostatné dýchání, a miminko umí sát a trávit.',
        length: 'Asi 47,4 cm',
        comparison: 'Římský salát',
        bodyChanges: ['Občas můžete pociťovat větší dušnost, protože děloha zabírá hodně místa pod žebry.'],
        toKnow: ['Těhotenství se považuje za donošené mezi 37. a 42. týdnem.'],
      },
      sk: {
        babyDescription:
          'Pľúca sú vo všeobecnosti dostatočne zrelé na samostatné dýchanie a bábätko je schopné cicať a tráviť.',
        length: 'Približne 47,4 cm',
        comparison: 'Rímsky šalát',
        bodyChanges: [
          'Niekedy môžete pociťovať väčšiu dýchavičnosť, pretože maternica zaberá veľa miesta pod rebrami.',
        ],
        toKnow: [
          'Tehotenstvo sa považuje za donosené medzi 37. a 42. týždňom.',
        ],
      },
      hu: {
        babyDescription:
          'A tüdő általában eléggé érett az önálló légzéshez, és a baba képes szopni és emészteni.',
        length: 'Körülbelül 47,4 cm',
        comparison: 'Római saláta',
        bodyChanges: [
          'Néha nehezebben vehetsz levegőt, mivel a méh sok helyet foglal el a bordák alatt.',
        ],
        toKnow: [
          'A terhesség a 37. és a 42. hét között tekinthető kiviselt terhességnek.',
        ],
      },
      ro: {
        babyDescription:
          'Plămânii sunt în general suficient de maturi pentru a permite respirația independentă, iar bebelușul poate suge și digera.',
        length: 'Aproximativ 47,4 cm',
        comparison: 'Salată romană',
        bodyChanges: [
          'Uneori poți avea mai puțin aer, deoarece uterul ocupă mult loc sub coaste.',
        ],
        toKnow: [
          'Sarcina este considerată la termen între săptămâna 37 și săptămâna 42.',
        ],
      },
      bg: {
        babyDescription:
          'Белите дробове обикновено са узрели достатъчно, за да позволят самостоятелно дишане, а бебето е способно да суче и да смила.',
        length: 'Около 47,4 см',
        comparison: 'Римска маруля',
        bodyChanges: [
          'Понякога може да усещаш по-голям задух, тъй като матката заема много място под ребрата.',
        ],
        toKnow: [
          'Бременността се смята за доносена между 37-ата и 42-рата седмица.',
        ],
      },
      sr: {
        babyDescription:
          'Плућа су обично довољно сазрела да омогуће самостално дисање, а беба је способна да сиса и вари.',
        length: 'Око 47,4 цм',
        comparison: 'Римска зелена салата',
        bodyChanges: [
          'Понекад можеш осећати већи недостатак даха, јер материца заузима много места испод ребара.',
        ],
        toKnow: [
          'Трудноћа се сматра доношеном између 37. и 42. недеље.',
        ],
      },
      hr: {
        babyDescription:
          'Pluća su obično dovoljno sazrela da omoguće samostalno disanje, a beba je sposobna sisati i probavljati.',
        length: 'Oko 47,4 cm',
        comparison: 'Rimska salata',
        bodyChanges: [
          'Ponekad možeš osjećati veći nedostatak zraka jer maternica zauzima mnogo prostora ispod rebara.',
        ],
        toKnow: [
          'Trudnoća se smatra donošenom između 37. i 42. tjedna.',
        ],
      },
      bs: {
        babyDescription:
          'Pluća su obično dovoljno sazrela da omoguće samostalno disanje, a beba je sposobna sisati i probavljati.',
        length: 'Oko 47,4 cm',
        comparison: 'Rimska salata',
        bodyChanges: [
          'Ponekad možeš osjećati veći nedostatak zraka jer maternica zauzima mnogo prostora ispod rebara.',
        ],
        toKnow: [
          'Trudnoća se smatra donošenom između 37. i 42. sedmice.',
        ],
      },
      sl: {
        babyDescription:
          'Pljuča so običajno dovolj dozorela, da omogočajo samostojno dihanje, dojenček pa je sposoben sesati in prebavljati.',
        length: 'Približno 47,4 cm',
        comparison: 'Rimska solata',
        bodyChanges: [
          'Včasih lahko čutiš večje pomanjkanje zraka, ker maternica zavzema veliko prostora pod rebri.',
        ],
        toKnow: [
          'Nosečnost se šteje za donošeno med 37. in 42. tednom.',
        ],
      },
      ne: {
        babyDescription:
          'फोक्सो सामान्यतया स्वतन्त्र रूपमा सास फेर्न दिने गरी पर्याप्त परिपक्व भइसकेका हुन्छन्, र शिशु चुस्न र पचाउन सक्षम हुन्छ।',
        length: 'करिब 47.4 सेमी',
        comparison: 'रोमेन सलाद',
        bodyChanges: [
          'गर्भाशयले करङमुनि धेरै ठाउँ लिँदा तपाईंलाई कहिलेकाहीँ अझ बढी सास फेर्न गाह्रो महसुस हुन सक्छ।',
        ],
        toKnow: [
          'हप्ता 37 र हप्ता 42 बीच गर्भावस्था पूर्ण अवधिको मानिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'පෙණහලු සාමාන්‍යයෙන් ස්වාධීනව හුස්ම ගැනීමට ඉඩ දීමට ප්‍රමාණවත් ලෙස පරිණත වී ඇති අතර, දරුවාට උරා බොන්නට සහ ජීර්ණය කරන්නට හැකියාව ඇත.',
        length: 'සෙ.මී. 47.4 පමණ',
        comparison: 'රොමේන් ලෙටිස් ගෙඩියක්',
        bodyChanges: [
          'ගර්භාෂය ඉළ ඇට යට විශාල ඉඩක් ගන්නා නිසා ඔබට සමහර විට වඩා හුස්ම හිරවීමක් දැනිය හැක.',
        ],
        toKnow: [
          'ගර්භණී කාලය 37 වන සතිය සහ 42 වන සතිය අතර සම්පූර්ණ කාලය ලෙස සැලකේ.',
        ],
      },
      th: {
        babyDescription:
          'ปอดโดยทั่วไปเจริญพอที่จะหายใจเองได้ และทารกดูดและย่อยได้',
        length: 'ประมาณ 47.4 ซม.',
        comparison: 'ผักกาดหอมโรเมน',
        bodyChanges: [
          'บางครั้งคุณอาจรู้สึกหายใจลำบากมากขึ้น เพราะมดลูกใช้พื้นที่มากใต้ซี่โครง',
        ],
        toKnow: [
          'การตั้งครรภ์ถือว่าครบกำหนดระหว่างสัปดาห์ที่ 37 ถึงสัปดาห์ที่ 42',
        ],
      },
      vi: {
        babyDescription:
          'Phổi nhìn chung đã trưởng thành đủ để cho phép tự thở, và em bé có thể bú và tiêu hóa.',
        length: 'Khoảng 47,4 cm',
        comparison: 'Rau xà lách romaine',
        bodyChanges: [
          'Đôi khi bạn có thể cảm thấy khó thở hơn, vì tử cung chiếm nhiều chỗ dưới xương sườn.',
        ],
        toKnow: [
          'Thai kỳ được coi là đủ tháng từ tuần 37 đến tuần 42.',
        ],
      },
      uz: {
        babyDescription:
          'Oʻpkalar odatda mustaqil nafas olishga imkon beradigan darajada yetilgan va chaqaloq emishi hamda hazm qilishi mumkin.',
        length: 'Taxminan 47,4 sm',
        comparison: 'Romen salati',
        bodyChanges: [
          'Bachadon qovurgʻalar ostida koʻp joy egallagani uchun baʼzan nafas qisilishini koʻproq sezishingiz mumkin.',
        ],
        toKnow: [
          'Homiladorlik 37-haftadan 42-haftagacha toʻlgan muddat hisoblanadi.',
        ],
      },
      az: {
        babyDescription:
          'Ağciyərlər adətən müstəqil nəfəs almağa imkan verəcək qədər yetişib və körpə əmə və həzm edə bilir.',
        length: 'Təxminən 47,4 sm',
        comparison: 'Romen salatı',
        bodyChanges: [
          'Uşaqlıq qabırğaların altında çox yer tutdığı üçün bəzən daha çox nəfəs darlığı hiss edə bilərsiniz.',
        ],
        toKnow: [
          'Hamiləlik 37-ci ilə 42-ci həftələr arasında tam müddətli sayılır.',
        ],
      },
      ka: {
        babyDescription:
          'ფილტვები, როგორც წესი, საკმარისად მომწიფდა დამოუკიდებელი სუნთქვისთვის და ბავშვს წოვისა და მონელების უნარი აქვს.',
        length: 'დაახლოებით 47,4 სმ',
        comparison: 'რომაული სალათი',
        bodyChanges: [
          'ზოგჯერ შეიძლება უფრო მეტად შეგეკუმშოთ სუნთქვა, რადგან საშვილოსნო ნეკნების ქვეშ დიდ სივრცეს იკავებს.',
        ],
        toKnow: [
          'ორსულობა სრულვადიანად ითვლება 37-ე და 42-ე კვირებს შორის.',
        ],
      },
      hy: {
        babyDescription:
          'Թոքերը սովորաբար հասունացել են բավարար չափով՝ ինքնուրույն շնչառություն թույլ տալու համար, և երեխան ընդունակ է ծծել և մարսել:',
        length: 'Մոտ 47,4 սմ',
        comparison: 'Հռոմեական կաղամբ',
        bodyChanges: [
          'Երբեմն կարող եք ավելի շնչահեղձ զգալ, քանի որ արգանդը շատ տարածք է զբաղեցնում կողոսկրերի տակ:',
        ],
        toKnow: [
          'Հղիությունը համարվում է լրիվ ժամկետի 37-ից 42-րդ շաբաթների միջև:',
        ],
      },
      tg: {
        babyDescription:
          'Шушҳо одатан ба қадри кофӣ расидаанд, то нафаскашии мустақилро имкон диҳанд ва тифл қобилияти мукидан ва ҳазм кардан дорад.',
        length: 'Тақрибан 47,4 см',
        comparison: 'Хоҳи романо',
        bodyChanges: [
          'Шумо баъзан метавонед тангии бештари нафасро ҳис кунед, зеро бачадон дар зери қабурғаҳо ҷои зиёд мегирад.',
        ],
        toKnow: [
          'Ҳомиладорӣ байни ҳафтаи 37 ва ҳафтаи 42 пурра ҳисобида мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Өпкө жалпысынан өз алдынча дем алууга мүмкүндүк берерлик деңгээлде жетилген, ал эми ымыркай эмип, сиңирүүгө жөндөмдүү.',
        length: 'Болжол менен 47,4 см',
        comparison: 'Ромэн салаты',
        bodyChanges: [
          'Жатын кабыргалардын астында көп орун ээлегендиктен, кээде дем кыскарып калышы мүмкүн.',
        ],
        toKnow: [
          'Курсактуулук 37-жума менен 42-жуманын ортосунда толук мөөнөттүү деп эсептелет.',
        ],
      },
      tk: {
        babyDescription:
          'Öýkenler adatça özbaşdak dem almaga mümkinçilik berjek derejede ýetişdi we bäbek emip we siňdirip bilýär.',
        length: 'Takmynan 47,4 sm',
        comparison: 'Romen salaty',
        bodyChanges: [
          'Ýatgy gabyrganyň aşagynda köp ýer eýelänligi üçin käwagt has az dem alýan ýaly duýup bilersiňiz.',
        ],
        toKnow: [
          'Göwrelilik 37-nji hepde bilen 42-nji hepdäniň arasynda doly möhlet hasaplanýar.',
        ],
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
      da: {
        babyDescription: 'Lungerne er generelt modnet nok til at muliggøre selvstændig vejrtrækning, og babyen er i stand til at sutte og fordøje.',
        length: 'Ca. 47,4 cm',
        comparison: 'Romainesalat',
        bodyChanges: [
          'Du kan sommetimes føle dig kortåndet, da livmoderen fylder meget under ribbenene.',
        ],
        toKnow: [
          'Graviditeten anses for fuldgående mellem uge 37 og uge 42.',
        ],
      },
      sv: {
        babyDescription: 'Lungerne ar generelt modnet nok till at muliggöre selvständig vejrträkning, och babyen ar i stand till at sutte och fordöje.',
        length: 'Ca. 47,4 cm',
        comparison: 'Romainesalat',
        bodyChanges: [
          'Du kan sommetimes föle dig kortåndet, da livmoderen fylder mycket under ribbenene.',
        ],
        toKnow: [
          'Graviditeten anses for fuldgående mellem vecka 37 och vecka 42.',
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
      nb: {
        babyDescription: 'Babyen regnes som moden nok til å bli født. Det store flertallet av babyer ligger nå med hodet ned.',
        length: 'Omtrent 48,6 cm',
        comparison: 'Purre',
        bodyChanges: ['En følelse av økende trykk i bekkenet er vanlig når babyen går ned i bekkenet.'],
        toKnow: ['Fra og med denne uken regnes termin som nådd, og fødselen kan skje når som helst.'],
      },
      pl: {
        babyDescription: 'Dziecko uważa się za wystarczająco dojrzałe do urodzenia. Zdecydowana większość dzieci układa się już główką w dół.',
        length: 'Około 48,6 cm',
        comparison: 'Por',
        bodyChanges: ['Uczucie narastającego ucisku w miednicy jest częste, gdy dziecko wstawia się do miednicy.'],
        toKnow: ['Od tego tygodnia uważa się, że termin został osiągnięty, a poród może nastąpić w każdej chwili.'],
      },
      uk: {
        babyDescription: 'Дитину вважають достатньо зрілою для народження. Переважна більшість дітей тепер розташована головкою вниз.',
        length: 'Приблизно 48,6 см',
        comparison: 'Цибуля-порей',
        bodyChanges: ['Відчуття наростаючого тиску в тазі поширене, коли дитина вставляється в таз.'],
        toKnow: ['Від цього тижня вважається, що термін досягнуто, і пологи можуть розпочатися будь-коли.'],
      },
      cs: {
        babyDescription: 'Miminko se považuje za dostatečně zralé k narození. Velká většina miminek je nyní v poloze hlavičkou dolů.',
        length: 'Asi 48,6 cm',
        comparison: 'Pórek',
        bodyChanges: ['Pocit narůstajícího tlaku v pánvi je běžný, jak se miminko zasouvá do pánve.'],
        toKnow: ['Od tohoto týdne se termín považuje za dosažený a porod může začít kdykoli.'],
      },
      sk: {
        babyDescription:
          'Bábätko sa považuje za dostatočne zrelé na narodenie. Veľká väčšina bábätiek je teraz uložená hlavičkou nadol.',
        length: 'Približne 48,6 cm',
        comparison: 'Pór',
        bodyChanges: [
          'Pocit rastúceho tlaku v panve je bežný, keď sa bábätko zasúva do panvy.',
        ],
        toKnow: [
          'Od tohto týždňa sa termín považuje za dosiahnutý a pôrod môže nastať kedykoľvek.',
        ],
      },
      hu: {
        babyDescription:
          'A baba elég éretten születhet. A babák nagy többsége most fejjel lefelé helyezkedik el.',
        length: 'Körülbelül 48,6 cm',
        comparison: 'Póréhagyma',
        bodyChanges: [
          'A növekvő medencei nyomás érzése gyakori, ahogy a baba beáll a medencébe.',
        ],
        toKnow: [
          'Ettől a héttől a kiírt időpont elértnek tekinthető, és a szülés bármikor megkezdődhet.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul este considerat suficient de matur pentru a se naște. Marea majoritate a bebelușilor sunt acum poziționați cu capul în jos.',
        length: 'Aproximativ 48,6 cm',
        comparison: 'Praz',
        bodyChanges: [
          'O senzație de presiune pelviană tot mai mare este frecventă pe măsură ce bebelușul se angajează în bazin.',
        ],
        toKnow: [
          'Începând cu această săptămână, termenul este considerat atins, iar nașterea poate avea loc în orice moment.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето се смята за достатъчно зряло, за да се роди. Голямото мнозинство от бебетата вече са позиционирани с главата надолу.',
        length: 'Около 48,6 см',
        comparison: 'Праз',
        bodyChanges: [
          'Усещането за нарастващ натиск в таза е често, докато бебето се вклинява в таза.',
        ],
        toKnow: [
          'От тази седмица терминът се смята за достигнат и раждането може да настъпи по всяко време.',
        ],
      },
      sr: {
        babyDescription:
          'Беба се сматра довољно зрелом да се роди. Огромна већина беба је сада постављена главом надоле.',
        length: 'Око 48,6 цм',
        comparison: 'Праз',
        bodyChanges: [
          'Осећај растућег притиска у карлици је чест како се беба уклињава у карлицу.',
        ],
        toKnow: [
          'Од ове недеље термин се сматра достигнутим и порођај може наступити у било ком тренутку.',
        ],
      },
      hr: {
        babyDescription:
          'Beba se smatra dovoljno zrelom da se rodi. Golema većina beba sada je postavljena glavom prema dolje.',
        length: 'Oko 48,6 cm',
        comparison: 'Poriluk',
        bodyChanges: [
          'Osjećaj rastućeg pritiska u zdjelici čest je kako se beba uglavljuje u zdjelicu.',
        ],
        toKnow: [
          'Od ovog tjedna termin se smatra dosegnutim i porod može nastupiti u bilo kojem trenutku.',
        ],
      },
      bs: {
        babyDescription:
          'Beba se smatra dovoljno zrelom da se rodi. Golema većina beba sada je postavljena glavom prema dolje.',
        length: 'Oko 48,6 cm',
        comparison: 'Poriluk',
        bodyChanges: [
          'Osjećaj rastućeg pritiska u zdjelici čest je kako se beba uglavljuje u zdjelicu.',
        ],
        toKnow: [
          'Od ove sedmice termin se smatra dosegnutim i porođaj može nastupiti u bilo kojem trenutku.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček se šteje za dovolj zrelega, da se rodi. Velika večina dojenčkov je zdaj nameščenih z glavo navzdol.',
        length: 'Približno 48,6 cm',
        comparison: 'Por',
        bodyChanges: [
          'Občutek naraščajočega pritiska v medenici je pogost, ko se dojenček zagozdi v medenico.',
        ],
        toKnow: [
          'Od tega tedna se termin šteje za dosežen in porod lahko nastopi kadar koli.',
        ],
      },
      ne: {
        babyDescription:
          'शिशुलाई जन्मिन पर्याप्त परिपक्व मानिन्छ। अधिकांश शिशुहरू अब टाउको तल पारेर बसेका हुन्छन्।',
        length: 'करिब 48.6 सेमी',
        comparison: 'लिक',
        bodyChanges: [
          'शिशु पेल्भिसमा बस्दा पेल्भिक दबाब बढ्दै गएको अनुभूति सामान्य हुन्छ।',
        ],
        toKnow: [
          'यो हप्तादेखि, पूर्ण अवधि पुगेको मानिन्छ र जन्म जुनसुकै बेला हुन सक्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා උපත ලැබීමට ප්‍රමාණවත් ලෙස පරිණත යැයි සැලකේ. දරුවන්ගෙන් විශාල බහුතරයක් දැන් හිස පහළට ඉරියව්වේ සිටී.',
        length: 'සෙ.මී. 48.6 පමණ',
        comparison: 'ලීක්ස් ගෙඩියක්',
        bodyChanges: [
          'දරුවා ශ්‍රෝණියේ ස්ථාපිත වන විට ශ්‍රෝණි පීඩනය වැඩි වන හැඟීමක් පොදුයි.',
        ],
        toKnow: [
          'මෙම සතියෙන් පටන්, කාලය ළඟා වී ඇතැයි සැලකෙන අතර ඕනෑම වේලාවක ප්‍රසූතිය සිදුවිය හැක.',
        ],
      },
      th: {
        babyDescription:
          'ทารกถือว่าเจริญพอที่จะคลอดได้ ทารกส่วนใหญ่อยู่ในท่าศีรษะลงแล้ว',
        length: 'ประมาณ 48.6 ซม.',
        comparison: 'กระเทียมต้น',
        bodyChanges: [
          'ความรู้สึกกดที่อุ้งเชิงกรานเพิ่มขึ้นพบบ่อยเมื่อทารกเข้าสู่อุ้งเชิงกราน',
        ],
        toKnow: [
          'ตั้งแต่สัปดาห์นี้เป็นต้นไป ถือว่าครบกำหนดแล้วและการคลอดเกิดขึ้นได้ทุกเมื่อ',
        ],
      },
      vi: {
        babyDescription:
          'Em bé được coi là đã trưởng thành đủ để chào đời. Phần lớn các em bé giờ đây đã ở ngôi đầu.',
        length: 'Khoảng 48,6 cm',
        comparison: 'Tỏi tây',
        bodyChanges: [
          'Cảm giác áp lực vùng chậu ngày càng tăng là điều phổ biến khi em bé lọt vào khung chậu.',
        ],
        toKnow: [
          'Từ tuần này trở đi, thai kỳ được coi là đủ tháng và cuộc sinh có thể xảy ra bất cứ lúc nào.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq tugʻilish uchun yetarli darajada yetilgan hisoblanadi. Chaqaloqlarning katta qismi endi boshi pastga joylashgan.',
        length: 'Taxminan 48,6 sm',
        comparison: 'Pirasa',
        bodyChanges: [
          'Chaqaloq chanoqqa tushganda chanoq bosimining ortib borishi hissi keng tarqalgan.',
        ],
        toKnow: [
          'Shu haftadan boshlab muddat yetgan hisoblanadi va tugʻruq istalgan vaqtda sodir boʻlishi mumkin.',
        ],
      },
      az: {
        babyDescription:
          'Körpə doğulmaq üçün kifayət qədər yetkin sayılır. Körpələrin böyük əksəriyyəti artıq başı aşağı vəziyyətdədir.',
        length: 'Təxminən 48,6 sm',
        comparison: 'Pırasa',
        bodyChanges: [
          'Körpə çanağa daxil olduqca artan çanaq təzyiqi hissi geniş yayılıb.',
        ],
        toKnow: [
          'Bu həftədən etibarən müddət çatılmış sayılır və doğuş istənilən vaxt baş verə bilər.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი დასაბადებლად საკმარისად მომწიფებულად ითვლება. ბავშვების დიდი უმრავლესობა ახლა თავით ქვემოთ არის მოთავსებული.',
        length: 'დაახლოებით 48,6 სმ',
        comparison: 'პრასი',
        bodyChanges: [
          'მზარდი წნევის შეგრძნება მენჯზე ხშირია, რადგან ბავშვი მენჯში ჩაიმაგრება.',
        ],
        toKnow: [
          'ამ კვირიდან ვადა მიღწეულად ითვლება და მშობიარობა ნებისმიერ დროს შეიძლება მოხდეს.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան համարվում է ծնվելու համար բավարար հասուն: Երեխաների մեծ մասն այժմ տեղավորված է գլխով ներքև:',
        length: 'Մոտ 48,6 սմ',
        comparison: 'Պրաս',
        bodyChanges: [
          'Կոնքային աճող ճնշման զգացումը տարածված է, երբ երեխան ամրանում է կոնքում:',
        ],
        toKnow: [
          'Այս շաբաթից սկսած՝ ժամկետը համարվում է հասած, և ծննդաբերությունը կարող է տեղի ունենալ ցանկացած պահի:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл ба қадри кофӣ расида барои таваллуд ҳисоб мешавад. Аксари мутлақи тифлҳо акнун бо сар ба поён ҷойгиранд.',
        length: 'Тақрибан 48,6 см',
        comparison: 'Пиёзи сабз',
        bodyChanges: [
          'Эҳсоси афзояндаи фишори коса ҳангоме, ки тифл ба коса дохил мешавад, маъмул аст.',
        ],
        toKnow: [
          'Аз ҳамин ҳафта мӯҳлат расидашуда ҳисоб мешавад ва таваллуд метавонад ҳар вақт рух диҳад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай төрөлүүгө жетиштүү жетилген деп эсептелет. Ымыркайлардын басымдуу көпчүлүгү эми башын ылдый кылып жайгашкан.',
        length: 'Болжол менен 48,6 см',
        comparison: 'Пияз-порей',
        bodyChanges: [
          'Ымыркай жамбашка кирген сайын жамбаш басымынын күчөөсү сезими кеңири таралган.',
        ],
        toKnow: [
          'Бул жумадан баштап мөөнөткө жетилди деп эсептелет жана төрөт каалаган убакта болушу мүмкүн.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek doglup boljak derejede ýetişen hasaplanýar. Bäbekleriň aglaba köpüsi indi kellesi aşak ýerleşdirilen.',
        length: 'Takmynan 48,6 sm',
        comparison: 'Pyýaz-sarymsak (porey)',
        bodyChanges: [
          'Bäbek çanakda ornaşanda barha artýan çanak basyşy duýgusy umumy.',
        ],
        toKnow: [
          'Şu hepdeden başlap möhlet ýetildi diýlip hasaplanýar we dogrum islendik wagt bolup biler.',
        ],
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
      da: {
        babyDescription: 'Babyen anses for moden nok til at blive født. Det store flertal af babyer er nu placeret med hovedet nedad.',
        length: 'Ca. 48,6 cm',
        comparison: 'Porre',
        bodyChanges: [
          'En følelse af voksende bækkentryk er almindelig, efterhånden som babyen sætter sig fast i bækkenet.',
        ],
        toKnow: [
          'Fra denne uge anses terminen for nået, og fødslen kan ske til enhver tid.',
        ],
      },
      sv: {
        babyDescription: 'Babyen anses for moden nok till at blive födt. Det store flertal av babyer ar nu placeret med hovedet nedad.',
        length: 'Ca. 48,6 cm',
        comparison: 'Porre',
        bodyChanges: [
          'En fölelse av voksende bäkkentryk ar almindelig, efterhånden som babyen sätter sig fast i bäkkenet.',
        ],
        toKnow: [
          'Fra denne vecka anses terminen for nået, och födslen kan ske till enhver tid.',
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
      nb: {
        babyDescription: 'Det fine dunhåret som dekket huden, har stort sett forsvunnet, og tarmene samler opp mekonium, den nyfødtes første avføring.',
        length: 'Omtrent 49,8 cm',
        comparison: 'Rabarbrastilk',
        bodyChanges: ['Å bli kjent med tegnene på at fødselen er i gang, kan være nyttig når fødselen nærmer seg.'],
        toKnow: ['En planlagt fødsel, når den vurderes uten medisinsk indikasjon, anbefales vanligvis ikke før uke 39.'],
      },
      pl: {
        babyDescription: 'Delikatny meszek, który pokrywał skórę, w dużej mierze zniknął, a w jelitach gromadzi się smółka, pierwszy stolec noworodka.',
        length: 'Około 49,8 cm',
        comparison: 'Łodyga rabarbaru',
        bodyChanges: ['Zapoznanie się z objawami porodu może być przydatne w miarę zbliżania się porodu.'],
        toKnow: ['Planowy poród, rozważany bez wskazań medycznych, zazwyczaj nie jest zalecany przed 39. tygodniem.'],
      },
      uk: {
        babyDescription: 'Ніжний пушок, що вкривав шкіру, здебільшого зник, а в кишечнику накопичується меконій, перший стілець новонародженого.',
        length: 'Приблизно 49,8 см',
        comparison: 'Стебло ревеню',
        bodyChanges: ['Знайомство з ознаками пологів може бути корисним у міру наближення пологів.'],
        toKnow: ['Планові пологи без медичних показань зазвичай не рекомендують до 39-го тижня.'],
      },
      cs: {
        babyDescription: 'Jemné chmýří, které pokrývalo kůži, z velké části zmizelo a ve střevech se hromadí smolka (mekonium), první stolice novorozence.',
        length: 'Asi 49,8 cm',
        comparison: 'Stonek rebarbory',
        bodyChanges: ['Seznámení s příznaky porodu může být užitečné s blížícím se porodem.'],
        toKnow: ['Plánovaný porod bez lékařské indikace se obecně nedoporučuje před 39. týdnem.'],
      },
      sk: {
        babyDescription:
          'Jemný páperový porast, ktorý pokrýval kožu, z veľkej časti zmizol a v črevách sa hromadí smolka, prvá stolica novorodenca.',
        length: 'Približne 49,8 cm',
        comparison: 'Rebarbora',
        bodyChanges: [
          'Zoznámenie sa so znakmi pôrodu môže byť užitočné, keď sa pôrod blíži.',
        ],
        toKnow: [
          'Plánovaný pôrod bez lekárskej indikácie sa vo všeobecnosti neodporúča pred 39. týždňom.',
        ],
      },
      hu: {
        babyDescription:
          'A bőrt borító finom pehely nagyrészt eltűnt, és a belekben felhalmozódik a magzatszurok, az újszülött első széklete.',
        length: 'Körülbelül 49,8 cm',
        comparison: 'Rebarbara szár',
        bodyChanges: [
          'A szülés jeleinek megismerése hasznos lehet a szülés közeledtével.',
        ],
        toKnow: [
          'Az orvosi indikáció nélküli tervezett szülés általában nem ajánlott a 39. hét előtt.',
        ],
      },
      ro: {
        babyDescription:
          'Puful fin care acoperea pielea a dispărut în mare parte, iar în intestine se acumulează meconiul, primul scaun al nou-născutului.',
        length: 'Aproximativ 49,8 cm',
        comparison: 'Tulpină de rubarbă',
        bodyChanges: [
          'Familiarizarea cu semnele travaliului poate fi utilă pe măsură ce nașterea se apropie.',
        ],
        toKnow: [
          'O naștere programată, atunci când este luată în considerare fără indicație medicală, nu este în general recomandată înainte de săptămâna 39.',
        ],
      },
      bg: {
        babyDescription:
          'Финият мъх, който покриваше кожата, до голяма степен е изчезнал, а червата натрупват меконий, първите изпражнения на новороденото.',
        length: 'Около 49,8 см',
        comparison: 'Стрък ревен',
        bodyChanges: [
          'Запознаването с признаците на раждането може да е полезно с наближаването му.',
        ],
        toKnow: [
          'Планираното раждане, когато се обмисля без медицинско показание, обикновено не се препоръчва преди 39-ата седмица.',
        ],
      },
      sr: {
        babyDescription:
          'Фина пахуљица која је прекривала кожу углавном је нестала, а црева накупљају меконијум, прву столицу новорођенчета.',
        length: 'Око 49,8 цм',
        comparison: 'Стабљика рабарбаре',
        bodyChanges: [
          'Упознавање са знацима порођаја може бити корисно како се порођај приближава.',
        ],
        toKnow: [
          'Планирани порођај, када се разматра без медицинске индикације, обично се не препоручује пре 39. недеље.',
        ],
      },
      hr: {
        babyDescription:
          'Fina paperjasta dlačica koja je prekrivala kožu uglavnom je nestala, a crijeva nakupljaju mekonij, prvu stolicu novorođenčeta.',
        length: 'Oko 49,8 cm',
        comparison: 'Stabljika rabarbare',
        bodyChanges: [
          'Upoznavanje sa znakovima poroda može biti korisno kako se porod približava.',
        ],
        toKnow: [
          'Planirani porod, kad se razmatra bez medicinske indikacije, obično se ne preporučuje prije 39. tjedna.',
        ],
      },
      bs: {
        babyDescription:
          'Fina paperjasta dlačica koja je prekrivala kožu uglavnom je nestala, a crijeva nakupljaju mekonij, prvu stolicu novorođenčeta.',
        length: 'Oko 49,8 cm',
        comparison: 'Stabljika rabarbare',
        bodyChanges: [
          'Upoznavanje sa znakovima porođaja može biti korisno kako se porođaj približava.',
        ],
        toKnow: [
          'Planirani porođaj, kad se razmatra bez medicinske indikacije, obično se ne preporučuje prije 39. sedmice.',
        ],
      },
      sl: {
        babyDescription:
          'Fina puhasta dlačica, ki je prekrivala kožo, je večinoma izginila, črevesje pa nabira mekonij, prvo blato novorojenčka.',
        length: 'Približno 49,8 cm',
        comparison: 'Steblo rabarbare',
        bodyChanges: [
          'Poznavanje znakov poroda je lahko koristno, ko se porod bliža.',
        ],
        toKnow: [
          'Načrtovani porod, kadar se razmišlja brez medicinske indikacije, se običajno ne priporoča pred 39. tednom.',
        ],
      },
      ne: {
        babyDescription:
          'छालालाई ढाकेको मसिनो रौँ प्रायः हराइसकेको छ, र आन्द्राहरूमा मेकोनियम जम्मा हुँदै छ, जुन नवजात शिशुको पहिलो दिसा हो।',
        length: 'करिब 49.8 सेमी',
        comparison: 'चुकको डाँठ',
        bodyChanges: [
          'प्रसव नजिकिँदा प्रसवका संकेतहरू चिन्नु उपयोगी हुन सक्छ।',
        ],
        toKnow: [
          'चिकित्सकीय कारणबिना विचार गरिएको तोकिएको प्रसव सामान्यतया हप्ता 39 अघि सिफारिस गरिँदैन।',
        ],
      },
      si: {
        babyDescription:
          'සම ආවරණය කළ සියුම් රෝම බොහෝ දුරට අතුරුදහන් වී ඇති අතර, බඩවැල්වල අලුත උපන් දරුවාගේ පළමු මළ ද්‍රව්‍යය වන මෙකෝනියම් එකතු වෙමින් පවතී.',
        length: 'සෙ.මී. 49.8 පමණ',
        comparison: 'රුබාබ් දණ්ඩක්',
        bodyChanges: [
          'ප්‍රසූතිය ළං වන විට ප්‍රසව වේදනාවේ සලකුණු හුරුපුරුදු වීම ප්‍රයෝජනවත් විය හැක.',
        ],
        toKnow: [
          'වෛද්‍ය ඇඟවීමක් නොමැතිව සලකා බැලූ විට, කාලසටහන්ගත ප්‍රසූතියක් 39 වන සතියට පෙර සාමාන්‍යයෙන් නිර්දේශ නොකෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ขนอ่อนละเอียดที่ปกคลุมผิวหนังหายไปเกือบหมดแล้ว และลำไส้สะสมขี้เทา ซึ่งเป็นอุจจาระครั้งแรกของทารกแรกเกิด',
        length: 'ประมาณ 49.8 ซม.',
        comparison: 'ก้านรูบาร์บ',
        bodyChanges: [
          'การคุ้นเคยกับสัญญาณของการเจ็บครรภ์คลอดมีประโยชน์เมื่อใกล้คลอด',
        ],
        toKnow: [
          'การคลอดที่กำหนดล่วงหน้า เมื่อพิจารณาโดยไม่มีข้อบ่งชี้ทางการแพทย์ โดยทั่วไปไม่แนะนำก่อนสัปดาห์ที่ 39',
        ],
      },
      vi: {
        babyDescription:
          'Lớp lông tơ mịn từng phủ trên da gần như đã biến mất, và ruột đang tích tụ phân su, phân đầu tiên của trẻ sơ sinh.',
        length: 'Khoảng 49,8 cm',
        comparison: 'Cọng đại hoàng',
        bodyChanges: [
          'Làm quen với các dấu hiệu chuyển dạ có thể hữu ích khi cuộc sinh đến gần.',
        ],
        toKnow: [
          'Việc sinh theo lịch, khi được cân nhắc mà không có chỉ định y khoa, nhìn chung không được khuyến nghị trước tuần 39.',
        ],
      },
      uz: {
        babyDescription:
          'Terini qoplagan mayin tuk asosan yoʻqolgan va ichaklarda mekoniy, yangi tugʻilgan chaqaloqning birinchi axlati toʻplanmoqda.',
        length: 'Taxminan 49,8 sm',
        comparison: 'Rovoch poyasi',
        bodyChanges: [
          'Tugʻruq yaqinlashganda tugʻruq belgilari bilan tanishish foydali boʻlishi mumkin.',
        ],
        toKnow: [
          'Tibbiy koʻrsatmasiz koʻrib chiqilgan rejalashtirilgan tugʻruq odatda 39-haftagacha tavsiya etilmaydi.',
        ],
      },
      az: {
        babyDescription:
          'Dərini örtən incə tük əsasən yoxa çıxıb və bağırsaqlarda yeni doğulmuşun ilk nəcisi olan mekonium toplanır.',
        length: 'Təxminən 49,8 sm',
        comparison: 'Raven sapı',
        bodyChanges: [
          'Doğuş yaxınlaşdıqca doğuş əlamətlərini tanımaq faydalı ola bilər.',
        ],
        toKnow: [
          'Tibbi göstəriş olmadan planlaşdırılan doğuş adətən 39-cu həftədən əvvəl tövsiyə olunmur.',
        ],
      },
      ka: {
        babyDescription:
          'კანის დამფარავი წვრილი ბუსუსი დიდწილად გაქრა და ნაწლავებში გროვდება მეკონიუმი, ახალშობილის პირველი განავალი.',
        length: 'დაახლოებით 49,8 სმ',
        comparison: 'რუბარბის ღერო',
        bodyChanges: [
          'მშობიარობის ნიშნების გაცნობა სასარგებლო შეიძლება იყოს მშობიარობის მოახლოებისას.',
        ],
        toKnow: [
          'დაგეგმილი მშობიარობა, სამედიცინო ჩვენების გარეშე განხილვისას, ზოგადად 39-ე კვირამდე რეკომენდებული არ არის.',
        ],
      },
      hy: {
        babyDescription:
          'Մաշկը ծածկող բարակ աղվամազը մեծապես անհետացել է, և աղիքներում կուտակվում է մեկոնիումը՝ նորածնի առաջին կղանքը:',
        length: 'Մոտ 49,8 սմ',
        comparison: 'Ռեհանի ցողուն',
        bodyChanges: [
          'Ծննդաբերության նշաններին ծանոթանալը կարող է օգտակար լինել, երբ ծննդաբերությունը մոտենում է:',
        ],
        toKnow: [
          'Նախատեսված ծննդաբերությունը, երբ դիտարկվում է առանց բժշկական ցուցման, սովորաբար խորհուրդ չի տրվում 39-րդ շաբաթից առաջ:',
        ],
      },
      tg: {
        babyDescription:
          'Мӯйи нозуке, ки пӯстро мепӯшонд, асосан нопадид шудааст ва рӯдаҳо меконийро, аввалин наҷосати навзод, ҷамъ мекунанд.',
        length: 'Тақрибан 49,8 см',
        comparison: 'Пояи ровоч',
        bodyChanges: [
          'Шинос шудан бо нишонаҳои таваллуд ҳангоми наздик шудани таваллуд метавонад муфид бошад.',
        ],
        toKnow: [
          'Таваллуди банақшагирифташуда, вақте ки бидуни нишондоди тиббӣ баррасӣ мешавад, одатан пеш аз ҳафтаи 39 тавсия дода намешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Терини каптаган жука түкчөлөр көбүнчө жоголду, ал эми ичегилерде мекониум, жаңы төрөлгөндүн биринчи заңы, топтолууда.',
        length: 'Болжол менен 49,8 см',
        comparison: 'Ревень сабагы',
        bodyChanges: [
          'Төрөт жакындаган сайын төрөт белгилери менен таанышуу пайдалуу болушу мүмкүн.',
        ],
        toKnow: [
          'Медициналык көрсөтмөсүз каралган пландуу төрөт 39-жумага чейин жалпысынан сунушталбайт.',
        ],
      },
      tk: {
        babyDescription:
          'Derini örten inçe ýumşak tüý aglaba ýitdi we içegelerde mekoniý, täze doglan bäbegiň ilkinji nejasaty, toplanýar.',
        length: 'Takmynan 49,8 sm',
        comparison: 'Ravent baldagy',
        bodyChanges: [
          'Dogrum ýakynlaşanda dogrum alamatlary bilen tanyş bolmak peýdaly bolup biler.',
        ],
        toKnow: [
          'Lukmançylyk görkezmesiz göz öňünde tutulan meýilleşdirilen dogrum umuman 39-njy hepdeden öň maslahat berilmeýär.',
        ],
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
      da: {
        babyDescription: 'Den fine fnuld, der dækkede huden, er stort set forsvundet, og tarmene samler mekonium, den nyfødtes første afføring.',
        length: 'Ca. 49,8 cm',
        comparison: 'Rabarberstilk',
        bodyChanges: [
          'At lære fødselstegnene at kende kan være nyttigt, efterhånden som fødslen nærmer sig.',
        ],
        toKnow: [
          'En planlagt fødsel, når den overvejes uden medicinsk indikation, anbefales generelt ikke før uge 39.',
        ],
      },
      sv: {
        babyDescription: 'Den fine fnuld, der däkkede huden, ar stort set forsvundet, och tarmene samler mekonium, den nyfödtes förste afföring.',
        length: 'Ca. 49,8 cm',
        comparison: 'Rabarberstilk',
        bodyChanges: [
          'At läre födselstegnene at kende kan väre nyttigt, efterhånden som födslen närmer sig.',
        ],
        toKnow: [
          'En planlagt födsel, når den overvejes uden medicinsk indikation, anbefales generelt inte för vecka 39.',
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
      nb: {
        babyDescription:
          'Huden, som tidligere var tynnere, har blitt tykkere og beskytter nå babyen bedre. Et beskyttende belegg, fosterfettet (vernix), gjør også passasjen lettere under fødselen.',
        length: 'Omtrent 50,7 cm',
        comparison: 'Vannmelon',
        bodyChanges: ['Utålmodighet og en viss tretthet er vanlig når termindatoen nærmer seg.'],
        toKnow: ['Den nyfødtes blodsirkulasjon fortsetter å tilpasse seg rett etter fødselen, noe som midlertidig kan gi hendene eller føttene et svakt blåaktig skjær.'],
      },
      pl: {
        babyDescription:
          'Skóra, wcześniej cieńsza, pogrubiała i lepiej chroni dziecko. Warstwa ochronna, czyli maź płodowa (vernix), ułatwia też jego przejście podczas porodu.',
        length: 'Około 50,7 cm',
        comparison: 'Arbuz',
        bodyChanges: ['Niecierpliwość i pewne zmęczenie są częste w miarę zbliżania się terminu porodu.'],
        toKnow: ['Krążenie krwi noworodka nadal dostosowuje się tuż po porodzie, co może tymczasowo nadawać dłoniom lub stopom lekko niebieskawy odcień.'],
      },
      uk: {
        babyDescription:
          'Шкіра, раніше тонша, потовщала й тепер краще захищає дитину. Захисне покриття, первородна змазка (vernix), також полегшує її проходження під час пологів.',
        length: 'Приблизно 50,7 см',
        comparison: 'Кавун',
        bodyChanges: ['Нетерпіння й певна втома поширені в міру наближення терміну пологів.'],
        toKnow: ['Кровообіг новонародженого продовжує пристосовуватися одразу після народження, що може тимчасово надавати рукам або стопам злегка синюватого відтінку.'],
      },
      cs: {
        babyDescription:
          'Kůže, dříve tenčí, zesílila a nyní miminko lépe chrání. Ochranný povlak, mázek (vernix), také usnadňuje jeho průchod při porodu.',
        length: 'Asi 50,7 cm',
        comparison: 'Vodní meloun',
        bodyChanges: ['Netrpělivost a určitá únava jsou běžné s blížícím se termínem porodu.'],
        toKnow: ['Krevní oběh novorozence se těsně po narození dál přizpůsobuje, což může dočasně dát rukám nebo nohám mírně namodralý odstín.'],
      },
      sk: {
        babyDescription:
          'Koža, predtým tenšia, zhrubla a bábätko teraz lepšie chráni. Ochranný povlak, mázok, mu tiež uľahčuje prechod počas pôrodu.',
        length: 'Približne 50,7 cm',
        comparison: 'Vodný melón',
        bodyChanges: [
          'Netrpezlivosť a určitá únava sú s blížiacim sa termínom bežné.',
        ],
        toKnow: [
          'Krvný obeh novorodenca sa hneď po narodení naďalej prispôsobuje, čo môže dočasne dať rukám alebo nohám mierne modrastý odtieň.',
        ],
      },
      hu: {
        babyDescription:
          'A korábban vékonyabb bőr megvastagodott, és most jobban védi a babát. A védőréteg, a magzatmáz, a szülés alatti áthaladását is megkönnyíti.',
        length: 'Körülbelül 50,7 cm',
        comparison: 'Görögdinnye',
        bodyChanges: [
          'A türelmetlenség és némi fáradtság a kiírt időpont közeledtével gyakori.',
        ],
        toKnow: [
          'Az újszülött vérkeringése közvetlenül a születés után tovább alkalmazkodik, ami átmenetileg enyhén kékes árnyalatot adhat a kezeknek vagy lábaknak.',
        ],
      },
      ro: {
        babyDescription:
          'Pielea, anterior mai subțire, s-a îngroșat și îl protejează acum mai bine pe bebeluș. Un strat protector, vernix, îi ușurează și trecerea în timpul nașterii.',
        length: 'Aproximativ 50,7 cm',
        comparison: 'Pepene verde',
        bodyChanges: [
          'Nerăbdarea și o anumită oboseală sunt frecvente pe măsură ce se apropie data estimată a nașterii.',
        ],
        toKnow: [
          'Circulația sângelui nou-născutului continuă să se ajusteze imediat după naștere, ceea ce poate da temporar mâinilor sau picioarelor o ușoară nuanță albăstruie.',
        ],
      },
      bg: {
        babyDescription:
          'Кожата, преди по-тънка, се е удебелила и вече предпазва бебето по-добре. Защитно покритие, верникс, улеснява и преминаването му при раждането.',
        length: 'Около 50,7 см',
        comparison: 'Диня',
        bodyChanges: [
          'Нетърпението и известна умора са чести с наближаването на термина.',
        ],
        toKnow: [
          'Кръвообращението на новороденото продължава да се приспособява веднага след раждането, което може временно да придаде леко синкав оттенък на ръцете или краката.',
        ],
      },
      sr: {
        babyDescription:
          'Кожа, раније тања, постала је дебља и сада боље штити бебу. Заштитни омотач, верникс, олакшава и њен пролазак током порођаја.',
        length: 'Око 50,7 цм',
        comparison: 'Лубеница',
        bodyChanges: [
          'Нестрпљење и известан умор су чести како се термин приближава.',
        ],
        toKnow: [
          'Крвоток новорођенчета наставља да се прилагођава одмах после порођаја, што може привремено дати благо плавкасту нијансу рукама или ногама.',
        ],
      },
      hr: {
        babyDescription:
          'Koža, prije tanja, postala je deblja i sada bolje štiti bebu. Zaštitni omotač, vernix, olakšava i njezin prolazak tijekom poroda.',
        length: 'Oko 50,7 cm',
        comparison: 'Lubenica',
        bodyChanges: [
          'Nestrpljenje i određeni umor česti su kako se termin približava.',
        ],
        toKnow: [
          'Krvotok novorođenčeta nastavlja se prilagođavati odmah nakon poroda, što može privremeno dati blagu plavkastu nijansu rukama ili nogama.',
        ],
      },
      bs: {
        babyDescription:
          'Koža, prije tanja, postala je deblja i sada bolje štiti bebu. Zaštitni omotač, vernix, olakšava i njezin prolazak tokom porođaja.',
        length: 'Oko 50,7 cm',
        comparison: 'Lubenica',
        bodyChanges: [
          'Nestrpljenje i određeni umor česti su kako se termin približava.',
        ],
        toKnow: [
          'Krvotok novorođenčeta nastavlja se prilagođavati odmah nakon porođaja, što može privremeno dati blagu plavkastu nijansu rukama ili nogama.',
        ],
      },
      sl: {
        babyDescription:
          'Koža, prej tanjša, je postala debelejša in zdaj bolje ščiti dojenčka. Zaščitna ovojnica, vernix, olajša tudi njegov prehod med porodom.',
        length: 'Približno 50,7 cm',
        comparison: 'Lubenica',
        bodyChanges: [
          'Nestrpnost in določena utrujenost sta pogosti, ko se termin bliža.',
        ],
        toKnow: [
          'Krvni obtok novorojenčka se takoj po porodu še naprej prilagaja, kar lahko začasno da blago modrikast odtenek rokam ali nogam.',
        ],
      },
      ne: {
        babyDescription:
          'छाला, पहिले पातलो, बाक्लो भएको छ र अब शिशुलाई राम्ररी जोगाउँछ। भर्निक्स भनिने सुरक्षात्मक तहले जन्मको क्रममा उनको मार्ग पनि सजिलो बनाउँछ।',
        length: 'करिब 50.7 सेमी',
        comparison: 'तरबुज',
        bodyChanges: [
          'प्रसव मिति नजिकिँदा अधैर्यता र केही थकान सामान्य हुन्छ।',
        ],
        toKnow: [
          'नवजात शिशुको रक्तसञ्चार जन्मपछि तुरुन्तै मिल्दै जान्छ, जसले अस्थायी रूपमा हात वा खुट्टालाई हल्का निलो रङ दिन सक्छ।',
        ],
      },
      si: {
        babyDescription:
          'කලින් තුනී වූ සම, ඝන වී දැන් දරුවා වඩා හොඳින් ආරක්ෂා කරයි. ආරක්ෂක ආලේපනයක් වන වර්නික්ස් ද, ප්‍රසූතිය අතරතුර ඔවුන්ගේ ගමන පහසු කරයි.',
        length: 'සෙ.මී. 50.7 පමණ',
        comparison: 'කොමඩු ගෙඩියක්',
        bodyChanges: [
          'නියමිත දිනය ළං වන විට නොඉවසිලිමත්කම සහ යම් වෙහෙසක් පොදුයි.',
        ],
        toKnow: [
          'අලුත උපන් දරුවාගේ රුධිර සංසරණය උපතින් පසු වහාම හැඩගැසීම දිගටම කරගෙන යන අතර, එය තාවකාලිකව අත් හෝ පාද තරමක් නිල් පැහැයක් ලබා දිය හැක.',
        ],
      },
      th: {
        babyDescription:
          'ผิวหนังซึ่งบางกว่าก่อนหน้านี้หนาขึ้นและตอนนี้ปกป้องทารกได้ดีขึ้น ชั้นเคลือบป้องกันที่เรียกว่าไขทารกยังช่วยให้ผ่านได้ง่ายขึ้นระหว่างการคลอด',
        length: 'ประมาณ 50.7 ซม.',
        comparison: 'แตงโม',
        bodyChanges: [
          'ความใจร้อนและความเหนื่อยล้าในระดับหนึ่งพบบ่อยเมื่อใกล้วันกำหนดคลอด',
        ],
        toKnow: [
          'การไหลเวียนเลือดของทารกแรกเกิดยังคงปรับตัวหลังคลอดทันที ซึ่งอาจทำให้มือหรือเท้ามีสีเขียวคล้ำเล็กน้อยชั่วคราว',
        ],
      },
      vi: {
        babyDescription:
          'Da, trước đây mỏng hơn, đã dày lên và giờ bảo vệ em bé tốt hơn. Một lớp phủ bảo vệ, chất gây (vernix), cũng giúp bé dễ đi qua hơn trong lúc sinh.',
        length: 'Khoảng 50,7 cm',
        comparison: 'Dưa hấu',
        bodyChanges: [
          'Sự nôn nóng và một mức độ mệt mỏi nhất định là phổ biến khi gần đến ngày dự sinh.',
        ],
        toKnow: [
          'Tuần hoàn máu của trẻ sơ sinh tiếp tục điều chỉnh ngay sau khi sinh, điều này có thể tạm thời khiến bàn tay hoặc bàn chân hơi tím xanh.',
        ],
      },
      uz: {
        babyDescription:
          'Avval yupqaroq boʻlgan teri qalinlashdi va endi chaqaloqni yaxshiroq himoya qiladi. Himoya qoplamasi — vernix (dastlabki yogʻ) — tugʻruq paytida oʻtishini ham osonlashtiradi.',
        length: 'Taxminan 50,7 sm',
        comparison: 'Tarvuz',
        bodyChanges: [
          'Taxminiy tugʻish sanasi yaqinlashganda sabrsizlik va maʼlum darajadagi charchoq keng tarqalgan.',
        ],
        toKnow: [
          'Yangi tugʻilgan chaqaloqning qon aylanishi tugʻilgandan keyin darhol moslashishda davom etadi, bu qoʻl yoki oyoqlarga vaqtincha biroz koʻkimtir tus berishi mumkin.',
        ],
      },
      az: {
        babyDescription:
          'Əvvəllər nazik olan dəri qalınlaşıb və indi körpəni daha yaxşı qoruyur. Qoruyucu təbəqə olan vernix də doğuş zamanı keçidi asanlaşdırır.',
        length: 'Təxminən 50,7 sm',
        comparison: 'Qarpız',
        bodyChanges: [
          'Gözlənilən doğuş tarixi yaxınlaşdıqca səbirsizlik və müəyyən qədər yorğunluq geniş yayılıb.',
        ],
        toKnow: [
          'Yeni doğulmuşun qan dövranı doğuşdan dərhal sonra tənzimlənməyə davam edir ki, bu da əl və ya ayaqlara müvəqqəti bir qədər mavimtıl çalar verə bilər.',
        ],
      },
      ka: {
        babyDescription:
          'კანი, რომელიც ადრე უფრო თხელი იყო, გასქელდა და ახლა ბავშვს უკეთ იცავს. დამცავი ფენა, ვერნიქსი, ასევე ამარტივებს მის გავლას მშობიარობისას.',
        length: 'დაახლოებით 50,7 სმ',
        comparison: 'საზამთრო',
        bodyChanges: [
          'მოუთმენლობა და გარკვეული დაღლილობა ხშირია სავარაუდო თარიღის მოახლოებისას.',
        ],
        toKnow: [
          'ახალშობილის სისხლის მიმოქცევა დაბადებისთანავე კვლავ ადაპტირდება, რამაც ხელებსა თუ ფეხებს დროებით ოდნავ მოლურჯო ელფერი შეიძლება მისცეს.',
        ],
      },
      hy: {
        babyDescription:
          'Մաշկը, որը նախկինում ավելի բարակ էր, հաստացել է և այժմ ավելի լավ է պաշտպանում երեխային: Պաշտպանիչ շերտը՝ վերնիքսը, նաև հեշտացնում է նրա անցումը ծննդաբերության ժամանակ:',
        length: 'Մոտ 50,7 սմ',
        comparison: 'Ձմերուկ',
        bodyChanges: [
          'Անհամբերությունը և որոշակի հոգնածությունը տարածված են, երբ սպասվելիք ամսաթիվը մոտենում է:',
        ],
        toKnow: [
          'Նորածնի արյան շրջանառությունը շարունակում է հարմարվել ծննդաբերությունից անմիջապես հետո, ինչը կարող է ժամանակավորապես ձեռքերին կամ ոտքերին թեթևակի կապտավուն երանգ տալ:',
        ],
      },
      tg: {
        babyDescription:
          'Пӯст, ки пештар борик буд, ғафс шудааст ва акнун тифлро беҳтар муҳофизат мекунад. Қабати муҳофизатӣ, верникс, инчунин гузаштани ӯро ҳангоми таваллуд осон мекунад.',
        length: 'Тақрибан 50,7 см',
        comparison: 'Тарбуз',
        bodyChanges: [
          'Беқарорӣ ва андаке хастагӣ ҳангоми наздик шудани санаи таваллуд маъмул аст.',
        ],
        toKnow: [
          'Гардиши хуни навзод пас аз таваллуд мутобиқ шуданро идома медиҳад, ки метавонад муваққатан ба дастҳо ё пойҳо ранги андаке кабудмонанд диҳад.',
        ],
      },
      ky: {
        babyDescription:
          'Мурда ичкерээк болгон тери калыңдап, эми ымыркайды жакшыраак коргойт. Коргоочу катмар — верникс — ошондой эле төрөт учурунда өтүүнү жеңилдетет.',
        length: 'Болжол менен 50,7 см',
        comparison: 'Дарбыз',
        bodyChanges: [
          'Төрөт күнү жакындаган сайын чыдамсыздык жана белгилүү бир чарчоо кеңири таралган.',
        ],
        toKnow: [
          'Жаңы төрөлгөндүн кан айлануусу төрөттөн кийин эле тууралана берет, бул колдор менен буттарга убактылуу бир аз көгүш түс бериши мүмкүн.',
        ],
      },
      tk: {
        babyDescription:
          'Öň inçe bolan deri galyňlaşdy we indi bäbegi has gowy goraýar. Goraýjy gatlak, wernikis, dogrum wagtynda onuň geçişini hem aňsatlaşdyrýar.',
        length: 'Takmynan 50,7 sm',
        comparison: 'Garpyz',
        bodyChanges: [
          'Dogrum senesi ýakynlaşanda sabyrsyzlyk we belli bir derejede ýadawlyk umumy.',
        ],
        toKnow: [
          'Täze doglan bäbegiň gan aýlanyşy dograndan soň derrew sazlanmagyny dowam etdirýär, bu eller ýa-da aýaklara wagtlaýyn az-kem gökümtil reňk berip biler.',
        ],
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
      da: {
        babyDescription: 'Huden, der tidligere var tyndere, er blevet tykkere og beskytter nu babyen bedre. Et beskyttende overtræk, vernix, letter også dens passage under fødslen.',
        length: 'Ca. 50,7 cm',
        comparison: 'Vandmelon',
        bodyChanges: [
          'Utålmodighed og en vis træthed er almindelig, efterhånden som termindatoen nærmer sig.',
        ],
        toKnow: [
          'Den nyfødtes blodcirkulation fortsætter med at tilpasse sig lige efter fødslen, hvilket midlertidigt kan give hænder eller fødder en let blålig farve.',
        ],
      },
      sv: {
        babyDescription: 'Huden, der tidligere var tyndere, ar blevet tykkere och beskytter nu babyen bedre. Et beskyttende overträk, vernix, letter også dens passage under födslen.',
        length: 'Ca. 50,7 cm',
        comparison: 'Vandmelon',
        bodyChanges: [
          'Utålmodighed och en vis träthed ar almindelig, efterhånden som termindatoen närmer sig.',
        ],
        toKnow: [
          'Den nyfödtes blodcirkulation fortsätter med at tilpasse sig lige efter födslen, hvilket midlertidigt kan give händer eller födder en let blålig farve.',
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
      nb: {
        babyDescription:
          'Babyen er fullt utviklet og klar til å bli født. Termindatoen er et estimat: mange fødsler skjer i dagene rundt den, før eller etter.',
        length: 'Omtrent 51,2 cm',
        comparison: 'Gresskar',
        bodyChanges: ['Å vente på tegn på at fødselen er i gang (regelmessige rier, vannavgang) er vanlig i denne perioden.'],
        toKnow: ['Å gå litt over termin er fortsatt vanlig og betyr ikke nødvendigvis at det er et problem; tettere oppfølging tilbys vanligvis.'],
      },
      pl: {
        babyDescription:
          'Dziecko jest w pełni rozwinięte i gotowe do narodzin. Termin porodu jest szacunkowy: wiele porodów odbywa się w dniach wokół niego, przed nim lub po nim.',
        length: 'Około 51,2 cm',
        comparison: 'Dynia',
        bodyChanges: ['Oczekiwanie na objawy porodu (regularne skurcze, odejście wód płodowych) jest w tym okresie częste.'],
        toKnow: ['Niewielkie przekroczenie terminu porodu nadal jest częste i niekoniecznie oznacza problem; zazwyczaj proponowana jest ściślejsza kontrola.'],
      },
      uk: {
        babyDescription:
          'Дитина повністю розвинена й готова до народження. Термін пологів орієнтовний: багато пологів відбувається в дні навколо нього, до або після.',
        length: 'Приблизно 51,2 см',
        comparison: 'Гарбуз',
        bodyChanges: ['Очікування ознак пологів (регулярні перейми, відходження вод) поширене в цей період.'],
        toKnow: ['Невелике перенесення вагітності залишається поширеним і не обов’язково означає проблему; зазвичай пропонують ретельніший нагляд.'],
      },
      cs: {
        babyDescription:
          'Miminko je plně vyvinuté a připravené na narození. Termín porodu je odhad: mnoho porodů proběhne v dnech kolem něj, před ním nebo po něm.',
        length: 'Asi 51,2 cm',
        comparison: 'Dýně',
        bodyChanges: ['Čekání na příznaky porodu (pravidelné stahy, odtok plodové vody) je v tomto období běžné.'],
        toKnow: ['Mírné překročení termínu zůstává běžné a nemusí nutně znamenat problém; obecně se nabízí pečlivější sledování.'],
      },
      sk: {
        babyDescription:
          'Bábätko je plne vyvinuté a pripravené na narodenie. Termín pôrodu je odhad: mnohé pôrody nastávajú v dňoch okolo neho, pred ním alebo po ňom.',
        length: 'Približne 51,2 cm',
        comparison: 'Tekvica',
        bodyChanges: [
          'Čakanie na znaky pôrodu (pravidelné sťahy, odtok plodovej vody) je v tomto období bežné.',
        ],
        toKnow: [
          'Mierne prekročenie termínu je bežné a nemusí nutne znamenať problém; zvyčajne sa ponúka dôkladnejšie sledovanie.',
        ],
      },
      hu: {
        babyDescription:
          'A baba teljesen kifejlődött és készen áll a születésre. A kiírt időpont becslés: sok szülés a körülötte lévő napokban történik, előtte vagy utána.',
        length: 'Körülbelül 51,2 cm',
        comparison: 'Sütőtök',
        bodyChanges: [
          'A szülés jeleire (rendszeres összehúzódások, burokrepedés) való várakozás ebben az időszakban gyakori.',
        ],
        toKnow: [
          'A kiírt időpont enyhe túllépése továbbra is gyakori, és nem feltétlenül jelent problémát; általában szorosabb megfigyelést ajánlanak.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul este complet dezvoltat și gata să se nască. Data estimată a nașterii este o estimare: multe nașteri au loc în zilele din jurul ei, înainte sau după.',
        length: 'Aproximativ 51,2 cm',
        comparison: 'Dovleac',
        bodyChanges: [
          'Așteptarea semnelor travaliului (contracții regulate, ruperea membranelor) este frecventă în această perioadă.',
        ],
        toKnow: [
          'Depășirea ușoară a datei estimate a nașterii rămâne frecventă și nu înseamnă neapărat că există o problemă; în general se propune o monitorizare mai atentă.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето е напълно развито и готово да се роди. Терминът е приблизителна оценка: много раждания настъпват в дните около него, преди или след него.',
        length: 'Около 51,2 см',
        comparison: 'Тиква',
        bodyChanges: [
          'Чакането на признаци на раждане (редовни контракции, изтичане на околоплодните води) е често през този период.',
        ],
        toKnow: [
          'Леко преминаване на термина остава често и не означава непременно, че има проблем; обикновено се предлага по-тясно проследяване.',
        ],
      },
      sr: {
        babyDescription:
          'Беба је потпуно развијена и спремна да се роди. Термин је процена: многи порођаји се дешавају у данима око њега, пре или после.',
        length: 'Око 51,2 цм',
        comparison: 'Бундева',
        bodyChanges: [
          'Чекање знакова порођаја (редовне контракције, пуцање воде) је уобичајено током овог периода.',
        ],
        toKnow: [
          'Мало прекорачење термина остаје уобичајено и не значи нужно да постоји проблем; обично се нуди тешње праћење.',
        ],
      },
      hr: {
        babyDescription:
          'Beba je potpuno razvijena i spremna da se rodi. Termin je procjena: mnogi se porodi događaju u danima oko njega, prije ili poslije.',
        length: 'Oko 51,2 cm',
        comparison: 'Bundeva',
        bodyChanges: [
          'Čekanje znakova poroda (redoviti trudovi, pucanje vodenjaka) uobičajeno je tijekom ovog razdoblja.',
        ],
        toKnow: [
          'Malo prekoračenje termina ostaje uobičajeno i ne znači nužno da postoji problem; obično se nudi pomnije praćenje.',
        ],
      },
      bs: {
        babyDescription:
          'Beba je potpuno razvijena i spremna da se rodi. Termin je procjena: mnogi se porođaji događaju u danima oko njega, prije ili poslije.',
        length: 'Oko 51,2 cm',
        comparison: 'Bundeva',
        bodyChanges: [
          'Čekanje znakova porođaja (redoviti trudovi, pucanje vodenjaka) uobičajeno je tokom ovog razdoblja.',
        ],
        toKnow: [
          'Malo prekoračenje termina ostaje uobičajeno i ne znači nužno da postoji problem; obično se nudi pomnije praćenje.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček je popolnoma razvit in pripravljen, da se rodi. Termin je ocena: mnogi porodi se zgodijo v dneh okoli njega, prej ali pozneje.',
        length: 'Približno 51,2 cm',
        comparison: 'Buča',
        bodyChanges: [
          'Čakanje na znake poroda (redni popadki, počenje mehurja) je v tem obdobju običajno.',
        ],
        toKnow: [
          'Majhna prekoračitev termina ostaja običajna in ne pomeni nujno, da obstaja težava; običajno se ponudi pozornejše spremljanje.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु पूर्ण रूपमा विकसित र जन्मिन तयार छ। सम्भावित प्रसव मिति एउटा अनुमान हो: धेरै जन्म यसको वरिपरिका दिनहरूमा, अघि वा पछि, हुन्छन्।',
        length: 'करिब 51.2 सेमी',
        comparison: 'फर्सी',
        bodyChanges: [
          'यस अवधिमा प्रसवका संकेतहरू (नियमित खुम्चाइ, पानीको थैली फुट्ने) को प्रतीक्षा गर्नु सामान्य हो।',
        ],
        toKnow: [
          'सम्भावित मितिभन्दा अलिकति पछि जानु सामान्य नै रहन्छ र अनिवार्य रूपमा समस्या छ भन्ने जनाउँदैन; सामान्यतया नजिकबाट निगरानी प्रस्ताव गरिन्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා සම්පූර්ණයෙන්ම වර්ධනය වී උපත ලැබීමට සූදානම්. නියමිත දිනය ඇස්තමේන්තුවකි: බොහෝ ප්‍රසූති එය වටා දිනවල, පෙර හෝ පසු, සිදුවේ.',
        length: 'සෙ.මී. 51.2 පමණ',
        comparison: 'වට්ටක්කා ගෙඩියක්',
        bodyChanges: [
          'ප්‍රසව වේදනාවේ සලකුණු (නිතිපතා සංකෝචන, ජලය බිඳීම) බලාපොරොත්තුවෙන් සිටීම මෙම කාලය තුළ පොදුයි.',
        ],
        toKnow: [
          'නියමිත දිනය තරමක් ඉක්මවා යාම තවමත් පොදු වන අතර ගැටලුවක් ඇති බව අනිවාර්යයෙන්ම අදහස් නොවේ; සමීප අධීක්ෂණයක් සාමාන්‍යයෙන් ඉදිරිපත් කෙරේ.',
        ],
      },
      th: {
        babyDescription:
          'ทารกพัฒนาเต็มที่และพร้อมคลอด วันกำหนดคลอดเป็นเพียงค่าประมาณ: การคลอดหลายครั้งเกิดในช่วงวันรอบ ๆ วันนั้น ทั้งก่อนและหลัง',
        length: 'ประมาณ 51.2 ซม.',
        comparison: 'ฟักทอง',
        bodyChanges: [
          'การรอสัญญาณของการเจ็บครรภ์คลอด (มดลูกบีบตัวสม่ำเสมอ น้ำเดิน) พบบ่อยในช่วงนี้',
        ],
        toKnow: [
          'การเลยวันกำหนดคลอดเล็กน้อยยังพบบ่อยและไม่ได้หมายความว่ามีปัญหาเสมอไป โดยทั่วไปมีการเสนอให้ติดตามใกล้ชิดขึ้น',
        ],
      },
      vi: {
        babyDescription:
          'Em bé đã phát triển hoàn chỉnh và sẵn sàng chào đời. Ngày dự sinh chỉ là một ước tính: nhiều cuộc sinh xảy ra trong những ngày quanh đó, trước hoặc sau.',
        length: 'Khoảng 51,2 cm',
        comparison: 'Quả bí ngô',
        bodyChanges: [
          'Chờ đợi các dấu hiệu chuyển dạ (co thắt đều đặn, vỡ ối) là điều phổ biến trong giai đoạn này.',
        ],
        toKnow: [
          'Quá ngày dự sinh một chút vẫn là điều phổ biến và không nhất thiết có nghĩa là có vấn đề; thường được đề xuất theo dõi sát hơn.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq toʻliq rivojlangan va tugʻilishga tayyor. Taxminiy tugʻish sanasi taxmin: koʻp tugʻruqlar uning atrofidagi kunlarda, oldin yoki keyin sodir boʻladi.',
        length: 'Taxminan 51,2 sm',
        comparison: 'Qovoq',
        bodyChanges: [
          'Bu davrda tugʻruq belgilarini (muntazam qisqarishlar, suv ketishi) kutish keng tarqalgan.',
        ],
        toKnow: [
          'Taxminiy tugʻish sanasidan biroz oʻtib ketish keng tarqalgan va albatta muammo borligini anglatmaydi; odatda yaqinroq nazorat taklif qilinadi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə tam inkişaf edib və doğulmağa hazırdır. Gözlənilən doğuş tarixi təxmindir: bir çox doğuş ondan əvvəl və ya sonrakı günlərdə baş verir.',
        length: 'Təxminən 51,2 sm',
        comparison: 'Qabaq',
        bodyChanges: [
          'Bu dövrdə doğuş əlamətlərini (müntəzəm yığılmalar, ətrafdakı suların axması) gözləmək geniş yayılıb.',
        ],
        toKnow: [
          'Gözlənilən doğuş tarixini bir qədər keçmək hələ də geniş yayılıb və mütləq problem olduğunu bildirmir; adətən daha yaxın nəzarət təklif olunur.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი სრულად განვითარებულია და დასაბადებლად მზადაა. სავარაუდო თარიღი შეფასებაა: ბევრი მშობიარობა მის გარშემო დღეებში ხდება, მასამდე ან მის შემდეგ.',
        length: 'დაახლოებით 51,2 სმ',
        comparison: 'გოგრა',
        bodyChanges: [
          'მშობიარობის ნიშნების (რეგულარული შეკუმშვები, წყლების დენა) მოლოდინი ამ პერიოდში ხშირია.',
        ],
        toKnow: [
          'სავარაუდო თარიღის ოდნავ გადაცილება ხშირია და აუცილებლად პრობლემას არ ნიშნავს; ზოგადად უფრო ახლო მეთვალყურეობას გვთავაზობენ.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան լիովին զարգացած է և պատրաստ է ծնվելու: Սպասվելիք ամսաթիվը գնահատական է. շատ ծննդաբերություններ տեղի են ունենում դրա շուրջ օրերին՝ շուտ կամ ուշ:',
        length: 'Մոտ 51,2 սմ',
        comparison: 'Մեծ դդում',
        bodyChanges: [
          'Այս ժամանակահատվածում տարածված է ծննդաբերության նշանների (կանոնավոր կծկումներ, ջրերի արտահոսք) սպասումը:',
        ],
        toKnow: [
          'Սպասվելիք ամսաթիվը թեթևակի գերազանցելը մնում է տարածված և պարտադիր չի նշանակում խնդիր. սովորաբար առաջարկվում է ավելի մոտ հսկողություն:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл комилан инкишоф ёфтааст ва барои таваллуд омода аст. Санаи таваллуд тахминӣ аст: бисёр таваллудҳо дар рӯзҳои атрофи он, пеш ё баъд, рух медиҳанд.',
        length: 'Тақрибан 51,2 см',
        comparison: 'Каду',
        bodyChanges: [
          'Интизор шудан барои нишонаҳои таваллуд (кашишҳои мунтазам, шикастани обҳои ҳомила) дар ин давра маъмул аст.',
        ],
        toKnow: [
          'Андаке аз санаи таваллуд гузаштан маъмул боқӣ мемонад ва ҳатман маънои мушкилро надорад; назорати наздиктар одатан пешниҳод мешавад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай толук өнүккөн жана төрөлүүгө даяр. Төрөт күнү — болжолдоо: көптөгөн төрөттөр ага чейин же андан кийин, анын тегерегиндеги күндөрдө болот.',
        length: 'Болжол менен 51,2 см',
        comparison: 'Ашкабак',
        bodyChanges: [
          'Төрөт белгилерин (үзгүлтүксүз жыйрылуулар, суунун кетиши) күтүү бул мезгилде кеңири таралган.',
        ],
        toKnow: [
          'Төрөт күнүнөн бир аз ашып кетүү кеңири таралган бойдон калат жана сөзсүз көйгөй бар дегенди билдирбейт; жалпысынан кылдат көзөмөл сунушталат.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek doly ösdi we doglup boljak derejede taýýar. Dogrum senesi baha: köp dogrum onuň töwereginde, öň ýa-da soň, günlerde bolýar.',
        length: 'Takmynan 51,2 sm',
        comparison: 'Kädi',
        bodyChanges: [
          'Bu döwürde dogrum alamatlaryna (yzygiderli gysylmalar, suwuň gitmegi) garaşmak umumy.',
        ],
        toKnow: [
          'Dogrum senesinden az-kem geçmek umumy bolup galýar we hökman kynçylygyň barlygyny aňlatmaýar; has ýakyn yzarlama adatça teklip edilýär.',
        ],
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
      da: {
        babyDescription: 'Babyen er fuldt udviklet og klar til at blive født. Termindatoen er et skøn: mange fødsler sker i dagene omkring den, før eller efter.',
        length: 'Ca. 51,2 cm',
        comparison: 'Græskar',
        bodyChanges: [
          'At vente på fødselstegn (regelmæssige veer, hindesprængning) er almindeligt i denne periode.',
        ],
        toKnow: [
          'At gå lidt over terminen er fortsat almindeligt og betyder ikke nødvendigvis, at der er et problem; tættere overvågning tilbydes generelt.',
        ],
      },
      sv: {
        babyDescription: 'Babyen ar fuldt udviklet och klar till at blive födt. Termindatoen ar et skön: mange födsler sker i dagene omkring den, för eller efter.',
        length: 'Ca. 51,2 cm',
        comparison: 'Gräskar',
        bodyChanges: [
          'At vente på födselstegn (regelmässige veer, hindesprängning) ar almindeligt i denne periode.',
        ],
        toKnow: [
          'At gå lidt over terminen ar fortsat almindeligt och betyder inte nödvendigvis, at der ar et problem; tättere overvågning tilbydes generelt.',
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
      nb: {
        babyDescription:
          'Babyen er fortsatt fullt utviklet. Utover termindatoen tilbys vanligvis tettere oppfølging for å kontrollere babyens velvære.',
        bodyChanges: ['Den langvarige ventingen kan følges av økt tretthet og utålmodighet.'],
        toKnow: ['Å gå over termin fører vanligvis til økt oppfølging fra det medisinske teamet.'],
      },
      pl: {
        babyDescription:
          'Dziecko nadal jest w pełni rozwinięte. Po terminie porodu zazwyczaj proponowana jest ściślejsza kontrola, aby sprawdzić dobrostan dziecka.',
        bodyChanges: ['Przedłużające się oczekiwanie może wiązać się ze zwiększonym zmęczeniem i niecierpliwością.'],
        toKnow: ['Przekroczenie terminu zazwyczaj prowadzi do zwiększonego nadzoru ze strony zespołu medycznego.'],
      },
      uk: {
        babyDescription:
          'Дитина й далі повністю розвинена. Після терміну пологів зазвичай пропонують ретельніший нагляд, щоб перевірити добробут дитини.',
        bodyChanges: ['Тривале очікування може супроводжуватися посиленою втомою й нетерпінням.'],
        toKnow: ['Перенесення вагітності зазвичай призводить до посиленого нагляду з боку медичної команди.'],
      },
      cs: {
        babyDescription:
          'Miminko zůstává plně vyvinuté. Po termínu porodu se obecně nabízí pečlivější sledování, aby se ověřila pohoda miminka.',
        bodyChanges: ['Dlouhé čekání může být doprovázeno zvýšenou únavou a netrpělivostí.'],
        toKnow: ['Přenášení těhotenství obecně vede ke zvýšenému sledování ze strany zdravotnického týmu.'],
      },
      sk: {
        babyDescription:
          'Bábätko zostáva plne vyvinuté. Po termíne pôrodu sa zvyčajne ponúka dôkladnejšie sledovanie na kontrolu pohody bábätka.',
        bodyChanges: [
          'Predĺžené čakanie môže sprevádzať zvýšená únava a netrpezlivosť.',
        ],
        toKnow: [
          'Prekročenie termínu zvyčajne vedie k zvýšenému sledovaniu zdravotníckym tímom.',
        ],
      },
      hu: {
        babyDescription:
          'A baba teljesen kifejlődött marad. A kiírt időpont után általában szorosabb megfigyelést ajánlanak a baba jólétének ellenőrzésére.',
        bodyChanges: [
          'A hosszú várakozás fokozott fáradtsággal és türelmetlenséggel járhat.',
        ],
        toKnow: [
          'A kiírt időpont túllépése általában az egészségügyi csapat fokozott megfigyeléséhez vezet.',
        ],
      },
      ro: {
        babyDescription:
          'Bebelușul rămâne complet dezvoltat. După data estimată a nașterii, se propune în general o monitorizare mai atentă pentru a verifica starea de bine a bebelușului.',
        bodyChanges: [
          'Așteptarea prelungită poate fi însoțită de o oboseală și o nerăbdare crescute.',
        ],
        toKnow: [
          'Depășirea termenului duce în general la o monitorizare sporită din partea echipei medicale.',
        ],
      },
      bg: {
        babyDescription:
          'Бебето остава напълно развито. След термина обикновено се предлага по-тясно проследяване, за да се провери благосъстоянието на бебето.',
        bodyChanges: [
          'Продължителното чакане може да идва със засилена умора и нетърпение.',
        ],
        toKnow: [
          'Преминаването на термина обикновено води до засилено проследяване от медицинския екип.',
        ],
      },
      sr: {
        babyDescription:
          'Беба остаје потпуно развијена. После термина обично се нуди тешње праћење да се провери благостање бебе.',
        bodyChanges: [
          'Продужено чекање може доћи са појачаним умором и нестрпљењем.',
        ],
        toKnow: [
          'Прекорачење термина обично води појачаном праћењу од стране медицинског тима.',
        ],
      },
      hr: {
        babyDescription:
          'Beba ostaje potpuno razvijena. Nakon termina obično se nudi pomnije praćenje radi provjere bebine dobrobiti.',
        bodyChanges: [
          'Dulje čekanje može doći s pojačanim umorom i nestrpljenjem.',
        ],
        toKnow: [
          'Prekoračenje termina obično dovodi do pojačanog praćenja od strane medicinskog tima.',
        ],
      },
      bs: {
        babyDescription:
          'Beba ostaje potpuno razvijena. Nakon termina obično se nudi pomnije praćenje radi provjere bebine dobrobiti.',
        bodyChanges: [
          'Dulje čekanje može doći s pojačanim umorom i nestrpljenjem.',
        ],
        toKnow: [
          'Prekoračenje termina obično dovodi do pojačanog praćenja od strane medicinskog tima.',
        ],
      },
      sl: {
        babyDescription:
          'Dojenček ostaja popolnoma razvit. Po terminu se običajno ponudi pozornejše spremljanje za preverjanje dojenčkovega dobrega počutja.',
        bodyChanges: [
          'Daljše čakanje lahko pride z okrepljeno utrujenostjo in nestrpnostjo.',
        ],
        toKnow: [
          'Prekoračitev termina običajno vodi do okrepljenega spremljanja s strani medicinske ekipe.',
        ],
      },
      ne: {
        babyDescription:
          'शिशु पूर्ण रूपमा विकसित नै रहन्छ। सम्भावित मितिपछि, शिशुको भलाइ जाँच्न सामान्यतया नजिकबाट निगरानी प्रस्ताव गरिन्छ।',
        bodyChanges: [
          'लामो प्रतीक्षासँगै बढ्दो थकान र अधैर्यता आउन सक्छ।',
        ],
        toKnow: [
          'अवधि नाघ्दा सामान्यतया चिकित्सकीय टोलीद्वारा निगरानी बढाइन्छ।',
        ],
      },
      si: {
        babyDescription:
          'දරුවා සම්පූර්ණයෙන්ම වර්ධනය වී පවතී. නියමිත දිනයෙන් ඔබ්බට, දරුවාගේ යහපැවැත්ම පරීක්ෂා කිරීමට සමීප අධීක්ෂණයක් සාමාන්‍යයෙන් ඉදිරිපත් කෙරේ.',
        bodyChanges: [
          'දිගු බලා සිටීම වැඩි වෙහෙසක් සහ නොඉවසිලිමත්කමක් සමඟ පැමිණිය හැක.',
        ],
        toKnow: [
          'කාලය ඉක්මවා යාම සාමාන්‍යයෙන් වෛද්‍ය කණ්ඩායම විසින් අධීක්ෂණය වැඩි කිරීමට හේතු වේ.',
        ],
      },
      th: {
        babyDescription:
          'ทารกยังคงพัฒนาเต็มที่ เมื่อเลยวันกำหนดคลอด โดยทั่วไปมีการเสนอให้ติดตามใกล้ชิดขึ้นเพื่อตรวจความเป็นอยู่ของทารก',
        bodyChanges: [
          'การรอที่ยืดเยื้ออาจมาพร้อมกับความเหนื่อยล้าและความใจร้อนที่เพิ่มขึ้น',
        ],
        toKnow: [
          'การเลยกำหนดโดยทั่วไปนำไปสู่การติดตามที่เพิ่มขึ้นโดยทีมแพทย์',
        ],
      },
      vi: {
        babyDescription:
          'Em bé vẫn phát triển hoàn chỉnh. Sau ngày dự sinh, thường được đề xuất theo dõi sát hơn để kiểm tra sức khỏe của em bé.',
        bodyChanges: [
          'Thời gian chờ đợi kéo dài có thể đi kèm mệt mỏi và nôn nóng tăng lên.',
        ],
        toKnow: [
          'Quá ngày dự sinh thường dẫn đến việc đội ngũ y tế tăng cường theo dõi.',
        ],
      },
      uz: {
        babyDescription:
          'Chaqaloq toʻliq rivojlangan holda qoladi. Taxminiy tugʻish sanasidan keyin chaqaloq farovonligini tekshirish uchun odatda yaqinroq nazorat taklif qilinadi.',
        bodyChanges: [
          'Uzoq kutish charchoq va sabrsizlikning ortishi bilan birga kelishi mumkin.',
        ],
        toKnow: [
          'Muddatdan oshib ketish odatda tibbiy jamoa tomonidan nazoratning kuchaytirilishiga olib keladi.',
        ],
      },
      az: {
        babyDescription:
          'Körpə tam inkişaf etmiş qalır. Gözlənilən doğuş tarixindən sonra körpənin rifahını yoxlamaq üçün adətən daha yaxın nəzarət təklif olunur.',
        bodyChanges: [
          'Uzun gözləmə artan yorğunluq və səbirsizliklə müşayiət oluna bilər.',
        ],
        toKnow: [
          'Müddəti keçmək adətən tibbi komanda tərəfindən nəzarətin artırılmasına səbəb olur.',
        ],
      },
      ka: {
        babyDescription:
          'ბავშვი სრულად განვითარებული რჩება. სავარაუდო თარიღის შემდეგ ზოგადად უფრო ახლო მეთვალყურეობას გვთავაზობენ ბავშვის კეთილდღეობის შესამოწმებლად.',
        bodyChanges: [
          'ხანგრძლივ მოლოდინს შეიძლება გაზრდილი დაღლილობა და მოუთმენლობა ახლდეს.',
        ],
        toKnow: [
          'ვადის გადაცილება ზოგადად სამედიცინო გუნდის მიერ გაძლიერებულ მეთვალყურეობას იწვევს.',
        ],
      },
      hy: {
        babyDescription:
          'Երեխան մնում է լիովին զարգացած: Սպասվելիք ամսաթվից հետո սովորաբար առաջարկվում է ավելի մոտ հսկողություն՝ երեխայի բարեկեցությունը ստուգելու համար:',
        bodyChanges: [
          'Երկարատև սպասումը կարող է ուղեկցվել ավելացած հոգնածությամբ և անհամբերությամբ:',
        ],
        toKnow: [
          'Ժամկետը գերազանցելը սովորաբար հանգեցնում է բժշկական թիմի կողմից ավելացված հսկողության:',
        ],
      },
      tg: {
        babyDescription:
          'Тифл комилан инкишофёфта боқӣ мемонад. Пас аз санаи таваллуд назорати наздиктар одатан пешниҳод мешавад, то некӯаҳволии тифл санҷида шавад.',
        bodyChanges: [
          'Интизории дароз метавонад бо хастагӣ ва беқарории афзоянда ҳамроҳ шавад.',
        ],
        toKnow: [
          'Аз мӯҳлат гузаштан одатан ба афзоиши назорат аз ҷониби гурӯҳи тиббӣ оварда мерасонад.',
        ],
      },
      ky: {
        babyDescription:
          'Ымыркай толук өнүккөн бойдон калат. Төрөт күнүнөн кийин ымыркайдын жыргалчылыгын текшерүү үчүн жалпысынан кылдат көзөмөл сунушталат.',
        bodyChanges: [
          'Узакка созулган күтүү чарчоонун жана чыдамсыздыктын күчөшү менен коштолушу мүмкүн.',
        ],
        toKnow: [
          'Мөөнөттөн ашуу жалпысынан медициналык команданын көзөмөлүнүн күчөшүнө алып келет.',
        ],
      },
      tk: {
        babyDescription:
          'Bäbek doly ösen galýar. Dogrum senesinden soň, bäbegiň abadançylygyny barlamak üçin has ýakyn yzarlama adatça teklip edilýär.',
        bodyChanges: [
          'Uzaga çeken garaşmak artan ýadawlyk we sabyrsyzlyk bilen bile bolup biler.',
        ],
        toKnow: [
          'Möhletden geçmek adatça lukmançylyk topary tarapyndan artdyrylan yzarlama eltýär.',
        ],
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
      da: {
        babyDescription: 'Babyen er stadig fuldt udviklet. Efter den forventede fødselsdato tilbydes der generelt tættere opfølgning for at overvåge babyens velvære.',
        bodyChanges: [
          'Den forlængede ventetid kan ledsages af øget træthed og utålmodighed.',
        ],
        toKnow: [
          'At gå over termin fører generelt til øget overvågning fra det medicinske team.',
        ],
      },
      sv: {
        babyDescription: 'Babyen ar fortfarande fuldt udviklet. Efter den forventede födselsdato tilbydes der generelt tättere opfölgning for at overvåge babyens velväre.',
        bodyChanges: [
          'Den forlängede ventetid kan ledsages av öget träthed och utålmodighed.',
        ],
        toKnow: [
          'At gå over termin förer generelt till öget overvågning fran det medicinske team.',
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
