// Arabic copy (ar, العربية): clear Modern Standard Arabic for a women's health application, written for a feminine-singular reader («دورتكِ» style, no
// diacritics), NOT a word-for-word rendering of en.ts. Same key set and the same {{placeholders}} as the other dictionaries, plus the extra CLDR plural forms Arabic
// needs: every X_one / X_other family also carries X_zero, X_two, X_few and X_many (the shared plural rule is pluralRules.ts arabicCardinal; i18next reads the
// six categories zero / one / two / few / many / other). Western digits 0-9 are used everywhere (like every number AWA shows). «AWA» and «PDF/CSV/JSON/PIN/Face ID»
// stay Latin; endonyms are identical in every dictionary. Medical terminology follows common Arabic usage (الحيض، الإباضة، الحمل، النفاس …); religious-practice wording
// (الصلاة، الصيام، القضاء، الاستحاضة …) is educational and neutral and invents no ruling.
// REVIEW REQUIRED: not reviewed by a native Arabic medical translator or by a scholar — medical and religious wording must be validated before release.
export const ar = {
  common: {
    continue: 'متابعة',
    cancel: 'إلغاء',
    save: 'حفظ',
    apply: 'تطبيق',
    back: 'رجوع',
    seeAll: 'عرض الكل',
    close: 'إغلاق',
    add: 'إضافة',
    goodToKnow: 'من المفيد معرفته',
    yes: 'نعم',
    no: 'لا',
    dateToCheck: 'تاريخ للتحقق'
  },
  navigation: {
    home: 'الرئيسية',
    calendar: 'التقويم',
    statistics: 'الإحصاءات',
    profile: 'الملف الشخصي'
  },
  about: {
    logoA11y: 'شعار AWA',
    title: 'حول AWA',
    subtitle: 'تعرّفي أكثر على تطبيقك 💜',
    linkUnavailable: 'هذا الرابط غير متاح حاليًا.',
    emailNotConfigured: 'لم يتم تعيين عنوان بريد إلكتروني.',
    emailAppUnavailable: 'تعذّر فتح تطبيق البريد الإلكتروني.',
    linkOpenFailed: 'تعذّر فتح هذا الرابط.',
    versionBadge: 'الإصدار {{version}}',
    appDescription: 'يرافقك AWA كل يوم لتفهمي جسمك وتتابعي دورتك وتعتني بنفسك بطمأنينة.',
    sectionAppInfo: 'معلومات التطبيق',
    rowVersion: 'الإصدار',
    rowPublicationDate: 'تاريخ الإصدار',
    rowPublicationDateEmpty: 'غير متوفر',
    rowDesignedWith: 'صُمّم بكل',
    rowDesignedWithValue: '💜 من فريق AWA',
    rowWebsite: 'الموقع الإلكتروني',
    rowWebsiteEmpty: 'غير مضبوط',
    rowEmail: 'البريد الإلكتروني',
    rowEmailEmpty: 'غير مضبوط',
    sectionAbout: 'نبذة',
    missionTitle: 'رسالتنا',
    missionText: 'مساعدة كل امرأة على فهم جسمها ودورتها وصحتها بشكل أفضل لتعيش في انسجام مع نفسها.',
    privacyValueTitle: 'خصوصيتك',
    privacyValueText: 'خصوصيتك أولويتنا المطلقة. تبقى جميع بياناتك محمية داخل التطبيق.',
    valuesTitle: 'قيمنا',
    valuesText: 'العناية والاحترام والخصوصية وتمكين المرأة في صميم كل ما نقوم به.',
    sectionLegal: 'قانوني',
    termsOfUse: 'شروط الاستخدام',
    privacyPolicy: 'سياسة الخصوصية',
    viewDocument: 'عرض المستند',
    communityTitle: 'شكرًا لكونك جزءًا من مجتمع AWA 💜',
    communityText: 'لنعتنِ بأنفسنا معًا.',
    versionModalTitle: 'AWA',
    versionLabel: 'الإصدار {{version}}',
    buildLabel: 'البناء {{build}}',
    teamModalTitle: 'فريق AWA',
    teamText: 'نصمّم AWA بعناية واحترام وحرص على الخصوصية.',
    close: 'إغلاق'
  },
  libraryArticle: {
    shareA11y: 'مشاركة',
    bookmarkA11y: 'حفظ في المفضلة'
  },
  legalDocument: {
    provisionalNotice: 'محتوى مؤقت — يلزم مراجعة قانونية قبل النشر.'
  },
  privacyCover: {
    a11y: 'AWA محمي',
    subtitle: 'مساحتك تبقى خاصة'
  },
  journalEntryDate: {
    futureEntryMessage: 'لا يمكنك حفظ تسجيل متابعة لتاريخ مستقبلي.'
  },
  inlineCalendarPicker: {
    previousMonthA11y: 'الشهر السابق',
    nextMonthA11y: 'الشهر التالي',
    dayA11y: '{{day}} {{month}}'
  },
  birthDatePicker: {
    backToYearA11y: 'الرجوع إلى سنة {{year}}',
    backToMonthA11y: 'الرجوع إلى {{month}}',
    chooseYear: 'اختاري السنة',
    chooseMonth: 'اختاري الشهر'
  },
  objectives: {
    cycle: 'متابعة دورتي',
    conceive: 'محاولة الحمل',
    contraception: 'منع الحمل',
    irregular: 'دورة غير منتظمة (متلازمة تكيّس المبايض)',
    menopause: 'ما قبل انقطاع الطمث / انقطاع الطمث',
    pregnancy: 'متابعة حملي',
    postpartum: 'ما بعد الولادة',
    loss: 'بعد فقدان الحمل'
  },
  cyclePhase: {
    menstruation: 'مرحلة الحيض',
    follicular: 'المرحلة الجريبية',
    fertile: 'فترة الخصوبة',
    ovulation: 'الإباضة',
    luteal: 'المرحلة الأصفرية',
    pregnancy: 'الحمل',
    postpartum: 'ما بعد الولادة'
  },
  averageCycle: {
    variableLabel: 'دورة متغيّرة',
    variableValue: '{{min}}–{{max}} يومًا',
    variableSubtitle: 'نطاق تقديري',
    measuredLabel: 'متوسط المدة',
    measuredSubtitle: 'بناءً على دوراتك المسجّلة',
    usualLabel: 'المدة المعتادة',
    notProvided: 'غير متوفر',
    notProvidedSubtitle: 'أكملي إعداد دورتك',
    declaredSubtitle: 'بناءً على ما أخبرتِنا به',
    estimatedSubtitle: 'تقدير مؤقت',
    days_one: '{{count}} يوم',
    days_other: '{{count}} يوم',
    days_zero: '{{count}} يوم',
    days_two: 'يومان',
    days_few: '{{count}} أيام',
    days_many: '{{count}} يومًا'
  },
  appearance: {
    headerTitle: 'المظهر',
    subtitle: 'خصّصي مظهر تطبيق AWA\nبما يناسب تفضيلاتك.',
    themeSection: 'السمة',
    modeSystem: 'النظام',
    modeLight: 'فاتح',
    modeDark: 'داكن',
    palettesSection: 'لوحات الألوان',
    seeAllPalettes: 'عرض كل السمات',
    trueBlackTitle: 'وضع الأسود الحقيقي',
    trueBlackSubtitle: 'أسود حقيقي لمزيد من الراحة',
    displaySection: 'العرض',
    languageRowTitle: 'لغة التطبيق',
    infoText: 'يمكنك تغيير المظهر في أي وقت من الإعدادات.',
    themeAccessibility: 'سمة {{name}}',
    premiumLocked: 'بريميوم، مقفل',
    premium: 'بريميوم',
    selected: 'محدد',
    language: {
      title: 'لغة التطبيق',
      description: 'اختاري اللغة المستخدمة في AWA.',
      frenchName: 'Français',
      englishName: 'English',
      spanishName: 'Español',
      italianName: 'Italiano',
      turkishName: 'Türkçe',
      russianName: 'Русский',
      germanName: 'Deutsch',
      chineseName: '简体中文',
      indonesianName: 'Bahasa Indonesia',
      hindiName: 'हिन्दी',
      albanianName: 'Shqip',
      japaneseName: '日本語',
      koreanName: '한국어',
      portugueseName: 'Português (Portugal)',
      portugueseBrazilName: 'Português (Brasil)',
      englishUSName: 'English (US)',
      traditionalChineseName: '繁體中文',
      arabicName: 'العربية',
      kabyleName: 'Taqbaylit',
      oromoName: 'Afaan Oromoo',
      tigrinyaName: 'ትግርኛ',
      kinyarwandaName: 'Ikinyarwanda',
      kirundiName: 'Ikirundi',
      igboName: 'Igbo',
      yorubaName: 'Yorùbá',
      zuluName: 'isiZulu',
      xhosaName: 'isiXhosa',
      shonaName: 'chiShona',
      lingalaName: 'Lingála',
      fulfuldeName: 'Fulfulde',
      bengaliName: 'বাংলা',
      danishName: 'Dansk',
      swedishName: 'Svenska',
      norwegianName: 'Norsk bokmål',
      polishName: 'Polski',
      ukrainianName: 'Українська',
      czechName: 'Čeština',
      slovakName: 'Slovenčina',
      hungarianName: 'Magyar',
      romanianName: 'Română',
      bulgarianName: 'Български',
      serbianName: 'Српски',
      croatianName: 'Hrvatski',
      bosnianName: 'Bosanski',
      slovenianName: 'Slovenščina',
      nepaliName: 'नेपाली',
      sinhalaName: 'සිංහල',
      thaiName: 'ไทย',
      vietnameseName: 'Tiếng Việt',
      uzbekName: 'Oʻzbekcha',
      azerbaijaniName: 'Azərbaycanca',
      georgianName: 'ქართული',
      armenianName: 'Հայերեն',
      tajikName: 'Тоҷикӣ',
      kyrgyzName: 'Кыргызча',
      turkmenName: 'Türkmençe',
      malayName: 'Bahasa Melayu',
      somaliName: 'Soomaali',
      swahiliName: 'Kiswahili',
      kazakhName: 'Қазақ тілі',
      wolofName: 'Wolof',
      hausaName: 'Hausa',
      amharicName: 'Amharic',
      dutchName: 'Nederlands',
      finnishName: 'Suomi',
      greekName: 'Ελληνικά',
      filipinoName: 'Filipino',
      tamilName: 'தமிழ்',
      teluguName: 'తెలుగు',
      marathiName: 'मराठी',
      gujaratiName: 'ગુજરાતી',
      punjabiName: 'ਪੰਜਾਬੀ',
      burmeseName: 'မြန်မာ',
      khmerName: 'ខ្មែរ',
      laoName: 'ລາວ',
      systemName: 'افتراضي النظام',
      systemDescription: 'استخدام لغة الجهاز'
    }
  },
  cycleHome: {
    greeting: 'السلام عليكم،',
    subtitleOwner: 'جسمك، إيقاعك، إيمانك ✨',
    subtitleDaughter: 'الملف الشخصي لابنتي',
    nextPeriodLabel: 'الحيض القادم',
    fertileWindowLabel: 'فترة الخصوبة',
    ovulationLabel: 'الإباضة المتوقعة',
    myPeriodStartedCta: 'بدأ حيضي',
    herPeriodStartedCta: 'بدأ حيضها الأول',
    preFirstPeriod: {
      title: 'لم يُسجَّل أي حيض بعد',
      subtitle: 'ستبدأ متابعة دورتها عند حدوث حيضها الأول.',
      subtitleOwner: 'سجّلي بداية حيضك لتبدأ متابعتك.',
      question: 'متى بدأ حيضها الأول؟'
    },
    education: {
      title: 'التحضير لحيضها الأول',
      body: 'تحصل كل فتاة على حيضها الأول في وقت مختلف. يتيح لك AWA بدء المتابعة فور حدوثه.'
    },
    todayLabel: 'اليوم',
    energyChipLabel: 'الطاقة',
    moodChipLabel: 'المزاج',
    tipChipLabel: 'نصيحة اليوم',
    phase: {
      menstruation: {
        message: 'قد تشعرين بانخفاض طاقتك الآن — خذي وقتًا للراحة وارفقي بنفسك.',
        energy: 'منخفضة',
        mood: 'حساس',
        tip: 'الراحة والدفء'
      },
      follicular: {
        message: 'تعود طاقتك تدريجيًا — وقت مناسب لتعيدي التواصل مع نفسك.',
        energy: 'في ازدياد',
        mood: 'هادئ',
        tip: 'اشربي الماء بانتظام'
      },
      fertile: {
        message: 'بدأت فترة الخصوبة — أصغي إلى إشارات جسمك.',
        energy: 'مرتفعة',
        mood: 'واثق',
        tip: 'أصغي إلى نفسك'
      },
      ovulation: {
        message: 'من المتوقع أن تحدث الإباضة اليوم، وطاقتك في ذروتها.',
        energy: 'مرتفعة',
        mood: 'مشرق',
        tip: 'تحرّكي برفق'
      },
      luteal: {
        message: 'يستعد جسمك لدورة جديدة — ارفقي بنفسك.',
        energy: 'متغيرة',
        mood: 'تأمّلي',
        tip: 'اللطف والهدوء'
      },
      pregnancy: {
        message: 'يدعم جسمك كل خطوة بعناية — اعتني بنفسك جيدًا.',
        energy: 'متغيرة',
        mood: 'منتبه',
        tip: 'راحة منتظمة'
      },
      postpartum: {
        message: 'يواصل جسمك التعافي — امنحي نفسك الصبر.',
        energy: 'هادئة',
        mood: 'صبور',
        tip: 'الدعم والراحة'
      }
    },
    mood: {
      veryGood: 'جيد جدًا',
      good: 'جيد',
      neutral: 'عادي',
      stressed: 'متوتر',
      irritable: 'سريع الانفعال',
      anxious: 'قلق',
      sad: 'حزين',
      tired: 'متعب',
      motivated: 'متحمس'
    },
    moodTip: {
      veryGood: 'استثمري هذه الطاقة',
      good: 'عزّزي هذا الشعور الجيد',
      neutral: 'أصغي إلى احتياجاتك',
      stressed: 'تنفّسي وهدّئي الإيقاع',
      irritable: 'الهدوء واللطف',
      anxious: 'اهدئي برفق',
      sad: 'الراحة والدعم',
      tired: 'استريحي واشربي الماء',
      motivated: 'ابدئي العمل'
    },
    energyLevel: {
      "1": 'منخفضة جدًا',
      "2": 'منخفضة',
      "3": 'متوسطة',
      "4": 'مرتفعة',
      "5": 'مرتفعة جدًا'
    },
    quickActions: {
      title: 'إجراءات سريعة',
      subtitle: 'اضغطي مطولًا للتخصيص',
      reorderHint: 'اضغطي على بطاقة أخرى لتبديل مكانها',
      optionsFor: 'خيارات {{label}}',
      done: 'تم',
      customize: 'تخصيص',
      prayerTimes: 'مواقيت\nالصلاة',
      library: 'المكتبة',
      dailyJournal: 'اليوميات',
      hijriCalendar: 'التقويم الهجري',
      qadaa: 'قضاء الصيام',
      statistics: 'الإحصاءات'
    },
    overview: {
      title: 'نظرة عامة على دورتك',
      seeMore: 'عرض المزيد'
    },
    nextPeriod: {
      inDays_one: 'بعد يوم واحد',
      inDays_other: 'بعد {{count}} يوم',
      inDays_zero: 'بعد {{count}} يوم',
      inDays_two: 'بعد يومين',
      inDays_few: 'بعد {{count}} أيام',
      inDays_many: 'بعد {{count}} يومًا',
      late: 'الحيض متأخر',
      window: 'النطاق: {{range}}',
      windowInProgress: 'النطاق التقديري قائم حاليًا'
    },
    notEstimable: 'يتعذّر تقديره',
    variableCycle: 'دورة متغيّرة',
    insufficientData: 'بيانات غير كافية',
    observationInProgress: 'المراقبة جارية',
    dataToComplete: 'بيانات للإكمال',
    monthOfTotal: 'الشهر {{month}} من {{total}}',
    cycleObservation: 'مراقبة الدورة'
  },
  homeHeader: {
    notifications: 'الإشعارات',
    notificationsUnread_one: 'إشعار واحد غير مقروء',
    notificationsUnread_other: '{{count}} إشعار غير مقروء',
    notificationsUnread_zero: 'لا توجد إشعارات غير مقروءة',
    notificationsUnread_two: 'إشعاران غير مقروءين',
    notificationsUnread_few: '{{count}} إشعارات غير مقروءة',
    notificationsUnread_many: '{{count}} إشعارًا غير مقروء',
    openProfile: 'فتح ملفي الشخصي'
  },
  motivationCard: {
    title: 'اعتني بنفسك،\n فأنتِ غالية ✨',
    subtitle: 'كل خطوة صغيرة لها قيمتها.'
  },
  objectiveArticles: {
    title: 'لمرافقتك',
    seeAll: 'عرض الكل',
    readingMinutes: 'قراءة {{count}} د',
    latestTitle: 'أحدث المقالات'
  },
  spiritualGuidance: {
    title: 'العلامات الروحية',
    active: 'نشط',
    menstruating: 'في فترة الحيض',
    pure: 'طاهرة',
    locationPlaceholder: 'حدّدي موقعك للحصول على مواقيت صلاة دقيقة',
    nextPrayerLabel: 'الصلاة القادمة',
    hijriDateLabel: 'التاريخ الهجري',
    upToDate: 'محدّث',
    daysCount_one: '{{count}} يوم',
    daysCount_other: '{{count}} يوم',
    daysCount_zero: '{{count}} يوم',
    daysCount_two: 'يومان',
    daysCount_few: '{{count}} أيام',
    daysCount_many: '{{count}} يومًا',
    locationRequired: 'الموقع مطلوب',
    calculating: 'جارٍ الحساب…',
    prayerTimesUnavailable: 'مواقيت الصلاة غير متاحة مؤقتًا',
    unavailable: 'غير متاح',
    purityRestoredAt: 'عادت الطهارة في {{time}}',
    prayerDue: 'حان وقت {{prayerName}}',
    firstPrayerAfterPurity: 'أول صلاة بعد الطهارة: {{prayerName}} · {{time}}',
    accessibilityCycle: 'العلامات الروحية. الحالة: {{status}}.',
    accessibilityOther: 'العلامات الروحية.',
    nifasLabel: 'النفاس',
    understandNifas: 'فهم النفاس',
    nifasDisclaimer: 'قد تختلف الأحكام الدينية بين المذاهب.',
    nifasReminderTitle: 'علامة النفاس',
    nifasReminderAccessibility: 'عرض علامة النفاس',
    consult: 'عرض',
    learnMore: 'اعرفي المزيد',
    nifasReferenceReachedHeadline: 'تم بلوغ علامة {{days}} يومًا التي يعتمدها AWA',
    nifasReferenceApproachingHeadline: 'تقترب علامة {{days}} يومًا التي يعتمدها AWA'
  },
  dailyJournal: {
    title: 'يوميات اليوم',
    symptoms: 'الأعراض',
    mood: 'المزاج',
    activity: 'النشاط',
    sleep: 'النوم',
    hydration: 'شرب الماء',
    menstrualFlow: 'تدفّق الحيض',
    intimacy: 'الصحة الحميمة',
    intimacySubtitle: 'العلاقة الحميمة والحماية وما شعرتِ به',
    notes: 'الملاحظات',
    completedOf: 'اكتمل {{completed}} / {{total}}',
    completedSuffix: '، مكتمل'
  },
  journalMood: {
    saveMood: 'حفظ المزاج',
    dateWithCycleDay: '{{date}} · يوم الدورة {{day}}',
    heroTitle: 'كيف تشعرين\nاليوم؟',
    heroSubtitle: 'خذي لحظة لتتعرّفي\nعلى ما تشعرين به.',
    mainMoodSectionTitle: 'المزاج الرئيسي',
    levelsSectionTitle: 'مستويات اليوم',
    stressLabel: 'التوتر',
    irritabilityLabel: 'سرعة الانفعال',
    motivationLabel: 'الحماس',
    commentSectionTitle: 'تعليق',
    optional: '(اختياري)',
    commentAccessibility: 'تعليق حول مزاجك',
    commentPlaceholder: 'اكتبي هنا ما تشعرين به أو ما تودّين تدوينه...',
    kindnessTitle: 'كل شعور له قيمته.',
    kindnessText: 'أصغي إلى نفسك بلطف.',
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ مزاجك الآن.',
    savedToast: 'تم حفظ المزاج بنجاح ✨',
    levelOutOfFive: '{{label}} {{level}} من 5',
    clearSubject: 'هذا المزاج'
  },
  journalHydration: {
    todayWithCycleDay: 'اليوم • يوم الدورة {{day}}',
    today: 'اليوم',
    customizeGoal: 'تخصيص الهدف',
    dailyGoalTitle: 'الهدف اليومي',
    glassesCount_one: 'كوب واحد',
    glassesCount_other: '{{count}} كوب',
    glassesCount_zero: '{{count}} كوب',
    glassesCount_two: 'كوبان',
    glassesCount_few: '{{count}} أكواب',
    glassesCount_many: '{{count}} كوبًا',
    customizeGoalDaily: 'خصّصي هدفك اليومي',
    personalize: 'تخصيص',
    bottleGlassAlt: 'زجاجة وكوب ماء',
    glassesOutOf: '{{current}} أكواب من {{goal}}',
    counterFraction: '{{current}} / {{goal}} أكواب',
    goalReached: 'تحقق الهدف ✨',
    addGlass: 'إضافة كوب',
    addOneGlass: 'إضافة كوب واحد',
    clearSubject: 'شرب الماء',
    historyTitle: 'السجل',
    noRecordThisWeek: 'لم تُسجَّل أي أكواب هذا الأسبوع بعد.',
    adviceTitle: 'نصائح اليوم',
    adviceText: 'شرب كمية كافية من الماء يساعد على تخفيف الانتفاخ وتحسين طاقتك.',
    dayNoRecord: '{{day}}: لا توجد بيانات',
    dayGlasses_one: '{{day}}: كوب واحد',
    dayGlasses_other: '{{day}}: {{count}} كوب',
    dayGlasses_zero: '{{day}}: {{count}} كوب',
    dayGlasses_two: '{{day}}: كوبان',
    dayGlasses_few: '{{day}}: {{count}} أكواب',
    dayGlasses_many: '{{day}}: {{count}} كوبًا',
    goalSheetSubtitle: 'اختاري عدد الأكواب التي تشربينها كل يوم.',
    customValueLabel: 'قيمة مخصصة',
    customGlassesAccessibility: 'عدد مخصص من الأكواب',
    customPlaceholderExample: 'مثال: 12',
    saveGoalButton: 'حفظ الهدف'
  },
  periodEndBottomSheet: {
    title: 'متى انتهى حيضك؟',
    description: 'يساعد ذلك على إبقاء دورتك وعلاماتك المتعلقة بالصلاة محدّثة.',
    endDateLabel: 'تاريخ الانتهاء',
    endTimeLabel: 'وقت الانتهاء',
    confirmEnd: 'تأكيد انتهاء الحيض'
  },
  journalMenstrualFlow: {
    today: 'اليوم',
    todayWithCycleDay: 'اليوم • يوم الدورة {{day}}',
    dateAtTime: '{{date}} في {{time}}',
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ التدفّق الآن.',
    periodInProgress: 'الحيض جارٍ',
    since: 'منذ {{date}}',
    periodEnded: 'انتهى حيضي',
    heroTitle: 'كيف هو تدفّقك اليوم؟',
    intensitySectionTitle: 'غزارة التدفّق',
    intensityAccessibility: 'الغزارة {{label}}',
    intensity: {
      spotting: 'نزف خفيف',
      light: 'خفيف',
      moderate: 'متوسط',
      heavy: 'غزير',
      veryHeavy: 'غزير\nجدًا'
    },
    colorSectionTitle: 'لون التدفّق',
    colorAccessibility: 'لون التدفّق {{color}}',
    clotsSectionTitle: 'الجلطات',
    clotsAccessibility: 'الجلطات {{label}}',
    clots: {
      none: 'لا توجد',
      small: 'صغيرة',
      medium: 'متوسطة',
      large: 'كبيرة'
    },
    protectionSectionTitle: 'وسيلة الحماية المستخدمة',
    protectionAccessibility: 'وسيلة الحماية {{label}}',
    protection: {
      pad: 'فوطة صحية',
      tampon: 'سدادة قطنية',
      cup: 'كأس الحيض',
      underwear: 'ملابس داخلية للحيض'
    },
    commentSectionTitle: 'تعليق',
    commentAccessibility: 'تعليق اختياري',
    commentPlaceholder: 'اكتبي هنا ما تودّين تدوينه...',
    saveFlow: 'حفظ تدفّق الحيض',
    flowSavedToast: 'تم حفظ التدفّق بنجاح ✨',
    periodEndSavedToast: 'تم حفظ انتهاء الحيض ✨'
  },
  journalSymptoms: {
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ أعراضك الآن.',
    saveSymptoms: 'حفظ الأعراض',
    heroTitle: 'أصغي إلى جسمك',
    heroSubtitle: 'اختاري الأعراض التي\nتشعرين بها اليوم.',
    symptomsFeltTitle: 'الأعراض المحسوسة',
    symptomsFeltSubtitle: 'اختاري كل عرض تشعرين به اليوم.',
    selectedCount_one: 'محدد: {{count}}',
    selectedCount_other: 'محدد: {{count}}',
    selectedCount_zero: 'محدد: {{count}}',
    selectedCount_two: 'محدد: اثنان',
    selectedCount_few: 'محدد: {{count}}',
    selectedCount_many: 'محدد: {{count}}',
    addedToJournal: 'أُضيف إلى يومياتك',
    tapToSelect: 'اضغطي للاختيار',
    intensitySectionTitle: 'الشدة',
    intensitySectionSubtitle: 'اختاري المستوى الذي يصف ما تشعرين به على أفضل وجه.',
    intensityAccessibility: 'الشدة {{label}}. {{description}}',
    intensity: {
      mild: {
        label: 'خفيفة',
        description: 'موجودة لكن يسهل التعامل معها'
      },
      moderate: {
        label: 'متوسطة',
        description: 'تعيق بعض الأنشطة'
      },
      strong: {
        label: 'قوية',
        description: 'يصعب تجاهلها في الحياة اليومية'
      },
      veryStrong: {
        label: 'قوية جدًا',
        description: 'مؤلمة جدًا أو معيقة'
      }
    },
    locationSectionTitle: 'الموضع',
    locationSectionSubtitle: 'أين تشعرين بهذه الأعراض\nبشكل رئيسي؟',
    bodyZone: 'منطقة الجسم',
    selectedZone: 'المنطقة المحددة',
    additionalNotesTitle: 'ملاحظات إضافية',
    additionalNotesSubtitle: 'أضيفي تعليقًا إن رغبتِ.',
    notesPlaceholder: 'اكتبي هنا...',
    saveMySymptoms: 'حفظ أعراضي',
    clearSubject: 'هذه الأعراض',
    savedToast: 'تم حفظ الأعراض بنجاح ✨'
  },
  journalActivity: {
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ نشاطك الآن.',
    dateWithCycleDay: '{{date}} · يوم الدورة {{day}}',
    heroTitle: 'تحرّكي من أجل عافيتك ✦',
    heroText: 'يساعد النشاط البدني على تخفيف التوتر وتحسين المزاج وتخفيف الأعراض.',
    typeSectionTitle: 'نوع النشاط',
    typeSectionHint: 'اختاري النشاط الذي قمتِ به',
    durationSectionTitle: 'المدة',
    durationSectionHint: 'كم من الوقت تحرّكتِ؟',
    decreaseDuration: 'تقليل المدة',
    increaseDuration: 'زيادة المدة',
    minutes: 'دقيقة',
    intensitySectionTitle: 'الشدة',
    intensitySectionHint: 'ما مستوى مجهودك؟',
    intensityLightDescription: 'مجهود خفيف',
    intensityModerateDescription: 'مجهود متوسط',
    intensityHighDescription: 'مجهود شديد',
    feelingSectionTitle: 'كيف تشعرين بعد نشاطك؟',
    feelingAccessibility: 'الشعور بعد النشاط: {{label}}',
    commentHint: 'أضيفي تعليقًا إن رغبتِ.',
    kindnessText: 'كل خطوة لها قيمتها. أثني على نفسك لاعتنائك بها اليوم! 💜',
    saveActivity: 'حفظ النشاط',
    clearSubject: 'هذا النشاط',
    savedToast: 'تم حفظ النشاط بنجاح ✨'
  },
  journalSleep: {
    invalidTimesTitle: 'أوقات غير صحيحة',
    invalidTimesMessage: 'استخدمي الصيغة HH:MM، مثل 22:45.',
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ نومك الآن.',
    dateWithCycleDay: '{{date}} · يوم الدورة {{day}}',
    heroTitle: 'اعتني براحتك، فجسمك يشكرك. ♡',
    heroText: 'النوم الجيد يدعم طاقتك ومزاجك وتوازنك الهرموني.',
    sleepHoursTitle: 'ساعات النوم',
    bedtimeLabel: 'وقت النوم',
    wakeTimeLabel: 'وقت الاستيقاظ',
    totalDuration: 'المدة الإجمالية',
    durationPlaceholder: '-- س -- د',
    recommendedGoal: 'الهدف الموصى به',
    recommendedGoalValue: '7 - 9 س ⓘ',
    qualityTitle: 'جودة النوم',
    qualityAccessibility: 'جودة النوم: {{label}}',
    awakeningsTitle: 'الاستيقاظ ليلًا',
    awakeningsSubtitle: 'كم مرة استيقظتِ؟',
    decreaseAwakenings: 'تقليل عدد مرات الاستيقاظ',
    increaseAwakenings: 'زيادة عدد مرات الاستيقاظ',
    timesThisNight: 'مرات هذه الليلة',
    awakeningsTip: 'من الطبيعي أن تستيقظي بضع مرات.\nيضبط جسمك نفسه تدريجيًا.',
    wakeFeelingTitle: 'الشعور عند الاستيقاظ',
    wakeFatigueTitle: 'الإرهاق',
    wakeFatigueAccessibility: 'الإرهاق: {{label}}',
    wakeFeelingSubtitle: 'كيف تشعرين عند الاستيقاظ؟',
    wakeFeelingAccessibility: 'الشعور عند الاستيقاظ: {{label}}',
    wakeFeelingTip: 'أصغي إلى جسمك واسمحي لنفسك\nبالراحة إن شعرتِ بحاجتك إليها.',
    notePlaceholder: 'اكتبي هنا ما تودّين تدوينه...',
    clearSubject: 'تسجيل النوم هذا',
    savedToast: 'تم حفظ النوم بنجاح ✨',
    closeTimeList: 'إغلاق قائمة الأوقات',
    selectATime: 'اختاري وقتًا'
  },
  journalNote: {
    personalNoteTitle: 'ملاحظة شخصية',
    writeAFewWords: 'اكتبي بضع كلمات قبل الحفظ.',
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ ملاحظتك الآن.',
    personalNotesTitle: 'الملاحظات الشخصية',
    showNote: 'إظهار الملاحظة',
    hideNote: 'إخفاء الملاحظة',
    show: 'إظهار',
    hide: 'إخفاء',
    heroTitle: 'مساحتك الخاصة بك وحدك ♡',
    heroText: 'دوّني ما تودّين تذكّره اليوم: شعورك وملاحظاتك والتغيّرات في بشرتك أو شعرك أو أي عرض آخر.',
    privateBadge: 'خاص وآمن بنسبة 100%',
    todaysNoteTitle: 'ملاحظة اليوم',
    noteHidden: 'الملاحظة مخفية',
    privatePhotosTitle: 'الصور الخاصة',
    privatePhotosHint: 'تابعي التغيّرات في بشرتك أو شعرك أو أحد الأعراض.',
    photosAddedCount_one: 'أُضيفت صورة واحدة',
    photosAddedCount_other: 'أُضيفت {{count}} صورة',
    photosAddedCount_zero: 'لم تُضف أي صورة ({{count}})',
    photosAddedCount_two: 'تمت إضافة صورتين',
    photosAddedCount_few: 'تمت إضافة {{count}} صور',
    photosAddedCount_many: 'تمت إضافة {{count}} صورة',
    tapToViewReplaceDelete: 'اضغطي للعرض أو الاستبدال أو الحذف.',
    addPrivatePhotos: 'إضافة صور خاصة',
    photosStayOnDevice: 'تبقى صورك على جهازك فقط.',
    dataProtectedTitle: 'بياناتك محمية',
    dataProtectedText: 'تُحفظ جميع ملاحظاتك وصورك على جهازك فقط. لا يمكن لأحد غيرك الوصول إليها.',
    dateLabel: 'التاريخ',
    timeLabel: 'الوقت',
    cycleDayLabel: 'يوم الدورة',
    cycleDayValue: 'اليوم {{day}}',
    saveMyNote: 'حفظ ملاحظتي',
    clearSubject: 'هذه الملاحظة',
    savedToast: 'تم حفظ الملاحظة بنجاح ✨'
  },
  journalPrivatePhotos: {
    cameraUnavailable: 'الكاميرا غير متاحة على هذا الجهاز.',
    permissionDenied: 'اسمحي بالوصول إلى الكاميرا أو المعرض من الإعدادات لإضافة صورة.',
    genericPickerError: 'تعذّر فتح أداة اختيار الصور الآن.',
    savedTitle: 'تم حفظ الصور',
    savedWithCopyFailure: 'تم الحفظ، لكن تعذّر تخزين بعض الصور بشكل دائم — حاولي مجددًا عند الحاجة.',
    savedSuccessfully: 'تم تحديث صورك في اليوميات.',
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر الحفظ الآن.',
    hide: 'إخفاء',
    subtitle: 'تابعي تغيّراتك المرئية بسرّية — حب الشباب، الشعر، أعراض البشرة.',
    privateSpaceEyebrow: 'مساحة خاصة',
    myPhotos: 'صوري',
    photoCount: '{{count}} / {{max}} صورة',
    addAPrivatePhoto: 'إضافة صورة خاصة',
    emptyStateText: 'اختاري صورة موجودة أو التقطي صورة جديدة لمتابعة تغيّراتك.',
    chooseASource: 'اختاري المصدر',
    chooseASourceTitle: 'اختاري المصدر',
    gallery: 'المعرض',
    chooseFromGallery: 'اختيار من المعرض',
    camera: 'الكاميرا',
    takeANewPhoto: 'التقاط صورة جديدة',
    addAPhoto: 'إضافة صورة',
    securityText: 'تُحفظ صورك محليًا في المساحة الخاصة بالتطبيق.',
    photoNoLongerAvailable: 'لم تعد هذه الصورة متاحة على هذا الجهاز.',
    replace: 'استبدال',
    chooseAnotherPhoto: 'اختيار صورة أخرى',
    delete: 'حذف',
    removeFromJournal: 'إزالة من اليوميات',
    photoUnavailable: 'الصورة غير متاحة',
    viewPhoto: 'عرض الصورة'
  },
  journalIntimacy: {
    errorTitle: 'خطأ',
    errorMessage: 'تعذّر حفظ هذه المعلومات الآن.',
    title: 'الصحة الحميمة',
    hideAndLock: 'إخفاء هذه المعلومات وقفلها',
    heroTitle: 'خصوصيتك، مساحتك ♡',
    heroText: 'دوّني ما تشعرين به بكل ثقة.\nهذا القسم خاص ومحمي.',
    learnMore: 'معرفة المزيد',
    cannotReadPrivateData: 'تعذّرت قراءة هذه البيانات الخاصة.',
    reportTodayTitle: 'العلاقة الحميمة اليوم',
    reportTodaySubtitle: 'هل حدثت علاقة حميمة اليوم؟',
    privateBadge: 'خاص',
    yes: 'نعم',
    no: 'لا',
    timeLabel: 'الوقت',
    detailsHidden: 'التفاصيل مخفية.',
    libidoTitle: 'الرغبة الجنسية',
    libidoSubtitle: 'كيف تقيّمين رغبتك الجنسية اليوم؟',
    relatedSymptomsTitle: 'أعراض مرتبطة',
    multipleChoicesPossible: 'يمكن اختيار أكثر من إجابة.',
    commentSubtitle: 'اكتبي هنا ما تودين تدوينه.',
    notePlaceholder: 'اكتبي تعليقك هنا...',
    securityText: 'هذا القسم محمي برمز منفصل أو بـ Face ID.\nلا يمكن لأحد غيرك الوصول إليه.',
    saveIntimacy: 'حفظ معلومات الصحة الحميمة',
    clearSubject: 'هذه المعلومات',
    savedToast: 'تم حفظ الصحة الحميمة بنجاح ✨',
    closeList: 'إغلاق القائمة',
    chooseATime: 'اختاري وقتًا',
    selectDesiredTime: 'حدّدي الوقت المطلوب'
  },
  journalCervicalMucus: {
    title: 'مخاط عنق الرحم',
    heroLabel: 'لاحظي كيف يتغيّر\nخلال دورتك',
    sectionTitle: 'القوام الملاحَظ',
    observationOfTheDay: 'ملاحظة اليوم',
    chooseAspectTitle: 'كيف يبدو اليوم؟',
    chooseAspectSubtitle: 'اختاري الخيار الأقرب إلى ما تلاحظينه.',
    evolvesInfo: 'قد يتغيّر هذا خلال دورتك.',
    commentSectionTitle: 'تعليق',
    addDetailTitle: 'أضيفي تفصيلًا إن أردتِ',
    addDetailSubtitle: 'يمكنك تدوين إحساس أو لون أو أي تفصيل مفيد آخر.',
    noteLabel: 'ملاحظة (اختياري)',
    notePlaceholder: 'أضيفي ملاحظة…',
    tipTitle: 'انتبهي إلى التغيّرات قبل كل شيء',
    tipText: 'قد يتغيّر مظهر مخاط عنق الرحم خلال دورتك. هذه الملاحظات شخصية وليست تشخيصًا طبيًا.',
    saveToastTitle: 'تم حفظ الملاحظة',
    saveToastMessage: 'تمت إضافة ملاحظة مخاط عنق الرحم إلى يومياتك.',
    clearToastTitle: 'تم مسح الإدخال',
    clearToastMessage: 'تم حذف ملاحظة اليوم.',
    clearSubject: 'هذه الملاحظة',
    aspectAccessibility: 'قوام {{label}}',
    types: {
      dry: 'جاف',
      sticky: 'لزج',
      creamy: 'كريمي',
      watery: 'مائي',
      eggWhite: 'بياض البيض'
    },
    observations: {
      dry: {
        title: 'إحساس جاف نسبيًا',
        description: 'لوحظ مخاط قليل جدًا أو لا شيء اليوم.'
      },
      sticky: {
        title: 'قوام لزج',
        description: 'لوحظ قوام أسمك وأكثر لزوجة.'
      },
      creamy: {
        title: 'قوام كريمي',
        description: 'لوحظ قوام ناعم معتم كريمي.'
      },
      watery: {
        title: 'قوام مائي',
        description: 'لوحظ قوام أكثر سيولة ومائية.'
      },
      eggWhite: {
        title: 'قوام مطّاطي',
        description: 'لوحظ مخاط أكثر مطاطية وأكثر صفاءً.'
      }
    }
  },
  journalLHTest: {
    title: 'اختبار LH',
    heroLabel: 'تابعي ارتفاع LH\nفي الوقت المناسب',
    resultSectionTitle: 'نتيجة الاختبار',
    resultSelectedPrefix: 'النتيجة المختارة:',
    resultQuestionTitle: 'ما النتيجة التي تظهر لك؟',
    resultQuestionSubtitle: 'اختاري النتيجة الظاهرة على اختبار LH.',
    resultAccessibility: 'نتيجة {{label}}',
    detailsSectionTitle: 'تفاصيل الاختبار',
    detailQuestionTitle: 'متى أجريتِ الاختبار؟',
    detailQuestionSubtitle: 'اختاري الوقت الذي أجريتِ فيه اختبارك.',
    timeFieldLabel: 'وقت الاختبار',
    timeSelectorAccessibility: 'اختيار وقت الاختبار',
    timeSelectedCaption: 'تم اختيار الوقت',
    timeSelectCaption: 'اختاري وقتًا',
    timeValuePlaceholder: 'اضغطي للاختيار',
    noteLabel: 'تعليق (اختياري)',
    notePlaceholder: 'أضيفي ملاحظة…',
    tipTitle: 'فهم نتيجتك',
    tipText: 'قد تدل النتيجة الإيجابية على ارتفاع الهرمون الملوتن (LH). وهي ليست تشخيصًا طبيًا.',
    saveToastTitle: 'تم حفظ اختبار LH',
    saveToastMessage: 'تمت إضافة نتيجتك إلى يومياتك.',
    clearToastTitle: 'تم مسح الإدخال',
    clearToastMessage: 'تم حذف اختبار LH لهذا اليوم.',
    clearSubject: 'هذا الاختبار',
    confirmTime: 'تأكيد الوقت',
    timeSheetEyebrow: 'وقت الاختبار',
    timeSheetTitle: 'اختاري وقتًا',
    results: {
      negative: 'سلبية',
      positive: 'إيجابية',
      invalid: 'غير صالحة'
    },
    states: {
      positive: {
        eyebrow: 'ارتفاع محتمل في LH',
        message: 'اختبارك إيجابي',
        helper: 'قد تعكس هذه النتيجة ارتفاعًا في مستوى LH.'
      },
      invalid: {
        eyebrow: 'اختبار يحتاج إلى تحقق',
        message: 'النتيجة غير صالحة',
        helper: 'يمكنك إعادة الاختبار وفق تعليمات الشركة المصنّعة.'
      },
      negative: {
        eyebrow: 'لم يُرصد ارتفاع',
        message: 'اختبارك سلبي',
        helper: 'لا يُرصد ارتفاع في LH بهذا الاختبار حاليًا.'
      }
    }
  },
  journalTemperature: {
    title: 'درجة حرارة الجسم القاعدية',
    heroLabel: 'قراءتك الصباحية',
    rangeError: 'أدخلي درجة حرارة بين {{min}} و{{max}} °{{unit}}.',
    saveToastTitle: 'تم حفظ درجة الحرارة',
    saveToastMessage: 'تمت إضافة درجة حرارة جسمك القاعدية إلى يومياتك.',
    clearToastTitle: 'تم مسح الإدخال',
    clearToastMessage: 'تم حذف درجة حرارة هذا اليوم.',
    addMorningReading: 'أضيفي قراءتك الصباحية',
    checkValue: 'تحقّقي من القيمة التي أدخلتِها',
    readyToSave: 'جاهزة للحفظ',
    sectionTitle: 'درجة حرارتي',
    measurementOfTheDay: 'قراءة اليوم',
    added: 'تمت الإضافة',
    temperatureLabel: 'درجة الحرارة',
    placeholderCelsius: '36.50',
    placeholderFahrenheit: '97.70',
    unitLabel: 'الوحدة',
    timeOfMeasurementLabel: 'وقت القياس',
    timeOfMeasurementEyebrow: 'وقت القياس',
    chooseMeasurementTime: 'اختاري وقت القياس',
    measuredAt: 'تم القياس عند',
    chooseATime: 'اختاري وقتًا',
    tapToSelect: 'اضغطي للاختيار',
    methodSectionTitle: 'الطريقة والتعليق',
    methodTitle: 'طريقة القياس',
    methodSubtitle: 'اختاري الطريقة التي استخدمتِها هذا الصباح.',
    commentLabel: 'تعليق (اختياري)',
    notePlaceholder: 'أضيفي ملاحظة…',
    tipTitle: 'نصيحة',
    tipText: 'قيسي حرارتك فور الاستيقاظ، قبل مغادرة السرير، ويفضّل في الوقت نفسه كل يوم.',
    clearSubject: 'درجة الحرارة هذه',
    closeTimePicker: 'إغلاق أداة اختيار الوقت',
    whatTimeQuestion: 'في أي وقت؟',
    confirmTime: 'تأكيد الوقت'
  },
  journalCycleEvolution: {
    title: 'تطوّر الدورة',
    heroLabel: 'دورتك اليوم',
    currentPhaseTitle: 'المرحلة الحالية',
    notEnoughDataTitle: 'لا توجد بيانات كافية بعد',
    notEnoughDataText: 'سجّلي بداية آخر حيض لديك لمشاهدة تطوّر دورتك.',
    observationInProgress: 'نرصد دورتك',
    dayUnit: 'يوم',
    dayOfTotal: 'اليوم {{day}} من {{total}}',
    dayBeyondTotal: 'اليوم {{day}} · بعد {{total}} يومًا',
    cycleProgressLabel: 'تقدّم الدورة',
    markersTitle: 'معالم الدورة',
    estimatedFertileWindow: 'فترة الخصوبة المقدّرة',
    estimatedNextPeriod: 'موعد الحيض القادم المقدّر',
    aboutEstimatesTitle: 'حول هذه التقديرات',
    aboutEstimatesText: 'تُحسب هذه المعالم من فترات حيضك المسجّلة وتبقى تقديرات.',
    phase: {
      menstruation: 'الحيض',
      follicular: 'المرحلة الجريبية',
      fertile: 'فترة الخصوبة',
      ovulation: 'الإباضة المقدّرة',
      luteal: 'المرحلة الأصفرية'
    },
    phaseDescription: {
      menstruation: 'دورتك حاليًا في مرحلة الحيض.',
      follicular: 'يستعد جسمك تدريجيًا للإباضة.',
      fertile: 'أنتِ في فترة الخصوبة المقدّرة.',
      ovulation: 'يُقدَّر أن تحدث الإباضة في هذا الوقت تقريبًا.',
      luteal: 'دورتك في مرحلة ما بعد الإباضة.'
    }
  },
  journalConceptionReports: {
    title: 'التقارير',
    dateWithCycleDay: '{{date}} · اليوم {{day}}',
    mask: 'إخفاء',
    heroTitle: 'متابعة سرّية',
    heroText: 'تبقى معلوماتك محمية وفق إعدادات الخصوصية لديك.',
    privateSpace: 'مساحة خاصة',
    reportTodaySubtitle: 'هل تودين تسجيل تقرير؟',
    protectionUsedQuestion: 'هل استُخدمت وسيلة وقاية؟',
    commentSectionTitle: 'تعليق',
    securityText: 'يستخدم هذا القسم رمزك الخاص أو القياسات الحيوية. تبقى معلوماتك محمية وفق إعداداتك.',
    saveToastTitle: 'تم حفظ التقرير',
    saveToastMessage: 'تمت إضافة معلوماتك إلى يومياتك.'
  },
  cycleInformation: {
    title: 'حول\nدورتك',
    habitsTitle: 'عادات\nدورتك',
    subtitle: 'تساعدنا هذه المعلومات على\nفهمك ودعمك بشكل أفضل.',
    habitsSubtitle: 'طول الدورة وطول الحيض والانتظام. لا يتغيّر آخر حيض لديك ولا سجلّك.',
    periodStartDateLabel: 'تاريخ بداية آخر حيض لديك',
    choosePeriodStartDate: 'اختاري تاريخ بداية آخر حيض لديك',
    periodEndedQuestion: 'هل انتهى آخر حيض لديك؟',
    periodEndDateLabel: 'تاريخ نهاية آخر حيض لديك',
    choosePeriodEndDate: 'اختاري تاريخ نهاية آخر حيض لديك',
    usualPeriodDurationLabel: 'المدة المعتادة لحيضك',
    usedToEstimateNextPeriod: 'تُستخدم لتقدير موعد حيضك القادم.',
    usualCycleDurationLabel: 'المدة المعتادة لدورتك',
    cycleRegularQuestion: 'هل دورتك منتظمة عادةً؟',
    next: 'التالي',
    futureDateError: 'لا يمكن أن يكون هذا التاريخ في المستقبل.',
    missingEndDateError: 'أدخلي تاريخ نهاية آخر حيض لديك.',
    endBeforeStartError: 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية.'
  },
  cycleReminders: {
    title: 'تذكيراتك',
    subtitleEdit: 'اختاري التذكيرات التي تدعم متابعتك.',
    subtitleOnboarding: 'اختاري التذكيرات التي قد تدعم متابعتك. يمكنك تغييرها في أي وقت من ملفك الشخصي.',
    upcomingPeriodTitle: 'الحيض القادم',
    upcomingPeriodDescription: 'احصلي على تذكير قبل موعد حيضك القادم المقدّر.',
    unavailableNote: 'يتوفر بعد تسجيل أول حيض لها.',
    daysBefore_one: 'قبل {{count}} يوم',
    daysBefore_other: 'قبل {{count}} يوم',
    daysBefore_zero: 'قبل {{count}} يوم',
    daysBefore_two: 'قبل يومين',
    daysBefore_few: 'قبل {{count}} أيام',
    daysBefore_many: 'قبل {{count}} يومًا',
    periodStartCheckTitle: 'التحقق من بداية الحيض',
    periodStartCheckDescription: 'تنبيه لطيف إذا حلّ الموعد المقدّر دون تسجيل بداية الحيض.',
    dailyJournalDescription: 'تذكير بسيط لإكمال متابعتك لهذا اليوم.',
    reminderTimeAccessibility: 'وقت التذكير، {{time}}',
    chooseReminderTime: 'اختاري وقت التذكير',
    fertilityTitle: 'الإباضة وفترة الخصوبة',
    fertilityDescription: 'احصلي على تذكيرات استنادًا إلى تقديرات دورتك.',
    dailyJournalTimeError: 'اختاري وقتًا لتذكير يومياتك.',
    permissionNoticeText: 'فعّلي الإشعارات من إعدادات هاتفك لتصلك تذكيراتك.',
    openNotificationSettings: 'فتح إعدادات الإشعارات',
    openSettings: 'فتح الإعدادات',
    infoText: 'مواعيد الحيض وفترة الخصوبة والإباضة تقديرات مبنية على المعلومات المسجّلة في AWA.',
    skip: 'تخطّي'
  },
  dataSafety: {
    banner: {
      title: 'تعذّرت قراءة بعض البيانات المحمية',
      body: 'لم تُحذف سجلاتك ولم تتغيّر.',
      action: 'عرض الخيارات'
    },
    recovery: {
      title: 'البيانات المحمية غير متاحة',
      intro: 'تعذّر على AWA فتح بعض سجلاتك المشفّرة. وقد تُركت كما هي تمامًا.',
      keyLost: 'مفتاح الحماية الخاص بهذا الهاتف لم يعد متاحًا، لذا لا يمكن فتح السجلات المشفّرة. قد يحدث هذا بعد إعادة ضبط الهاتف أو تغيير إعدادات أمانه.',
      authFailed: 'تعذّر التحقق من بعض السجلات فتُركت دون مساس.',
      other: 'تعذّرت قراءة بعض السجلات لسبب آخر.',
      safeNote: 'ما دام هذا الوضع قائمًا، لا يكتب AWA فوق تلك السجلات ولا يعرض تقديرات مبنية على بيانات مفقودة.',
      retry: 'حاولي مجددًا',
      restore: 'الاستعادة من نسخة احتياطية',
      newKey: 'إنشاء مفتاح حماية جديد',
      discard: 'مسح السجلات غير المقروءة',
      newKeyTitle: 'إنشاء مفتاح حماية جديد؟',
      newKeyBody: 'ستُحمى السجلات الجديدة بمفتاح جديد. أما السجلات غير المقروءة حاليًا فتبقى غير مقروءة ما لم تستعيدي نسخة احتياطية.',
      discardTitle: 'مسح السجلات غير المقروءة؟',
      discardBody: 'لم يعد بالإمكان فتح هذه السجلات. ولا يمكن التراجع عن مسحها. استعادة نسخة احتياطية هي الطريقة الوحيدة لاسترجاعها.',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      retried: 'تم التحقق مجددًا.',
      stillUnavailable: 'لا تزال غير متاحة.',
      keyCreated: 'تم إنشاء مفتاح جديد.',
      discarded: 'تم مسح السجلات غير المقروءة.',
      nothing: 'يمكن قراءة كل شيء. لا شيء يحتاج إلى استرداد.'
    }
  },
  saveFailure: {
    title: 'تعذّر الحفظ',
    failedBody: 'تعذّر حفظ تغييراتك. ما أدخلتِه محفوظ مؤقتًا: يُرجى المحاولة مجددًا بعد قليل.',
    unavailableBody: 'بياناتك المحمية غير مقروءة حاليًا، لذا لا يكتب AWA فوقها ولم يتم حفظ هذا التغيير. ما أدخلتِه محفوظ مؤقتًا. افتحي خيارات الاسترداد ثم حاولي مجددًا.',
    ok: 'حسنًا',
    recoveryAction: 'عرض الخيارات'
  },
  portableBackup: {
    entryTitle: 'نسخة احتياطية مشفّرة',
    entrySubtitle: 'محمية بعبارة المرور الخاصة بك. استعيديها على هذا الهاتف أو على هاتف آخر.',
    screenTitle: 'نسخة احتياطية مشفّرة',
    createTitle: 'إنشاء نسخة احتياطية',
    createIntro: 'تُختم بياناتك بعبارة مرور لا تعرفينها سواك، فيمكن استعادة الملف على هاتف آخر.',
    passphraseLabel: 'عبارة المرور',
    confirmLabel: 'تأكيد عبارة المرور',
    passphraseHint: '10 أحرف على الأقل. عدة كلمات تصنع عبارة مرور جيدة.',
    weakTooShort: 'عبارة المرور قصيرة جدًا.',
    weakRepetitive: 'عبارة المرور متكررة جدًا.',
    mismatch: 'عبارتا المرور غير متطابقتين.',
    lossWarning: 'إذا فقدتِ عبارة المرور هذه، فلا يمكن استرداد النسخة الاحتياطية. ولا يستطيع أحد، بمن فيهم AWA، إعادة تعيينها.',
    photosNote: 'الصور الخاصة غير مشمولة في هذه النسخة الاحتياطية.',
    create: 'إنشاء النسخة الاحتياطية ومشاركتها',
    creating: 'جارٍ حماية بياناتك…',
    shareTitle: 'نسخة AWA الاحتياطية المشفّرة',
    created: 'تم إنشاء النسخة الاحتياطية.',
    errorUnreadable: 'تتعذّر قراءة بعض السجلات على هذا الهاتف، لذا لا يمكن إنشاء نسخة احتياطية كاملة. لم يتغيّر أي شيء.',
    errorGeneric: 'تعذّر إنشاء النسخة الاحتياطية. لم يتغيّر أي شيء.',
    restoreTitle: 'استعادة نسخة احتياطية',
    restoreIntro: 'اختاري ملف نسخة احتياطية أنشأتِه سابقًا وأدخلي عبارة المرور الخاصة به.',
    pick: 'اختيار ملف نسخة احتياطية',
    pickedOwner: 'نسخة احتياطية بتاريخ {{date}}',
    pickedProfile: 'نسخة احتياطية لملف شخصي مُدار، {{date}}',
    restorePassphrase: 'عبارة مرور النسخة الاحتياطية',
    restore: 'استعادة هذه النسخة',
    restoring: 'جارٍ الاستعادة…',
    confirmTitle: 'استعادة هذه النسخة الاحتياطية؟',
    confirmBody: 'ستحل بيانات النسخة الاحتياطية محل البيانات المطابقة على هذا الهاتف. أما السجلات غير الموجودة في النسخة فتبقى كما هي.',
    confirm: 'استعادة',
    cancel: 'إلغاء',
    success: 'تمت استعادة النسخة الاحتياطية ({{count}} سجل).',
    errorNotBackup: 'هذا الملف ليس نسخة احتياطية من AWA.',
    errorVersion: 'أُنشئت هذه النسخة الاحتياطية بإصدار أحدث من AWA.',
    errorInvalid: 'ملف النسخة الاحتياطية هذا تالف.',
    errorWrong: 'عبارة المرور خاطئة أو الملف تالف. لم يتغيّر أي شيء.',
    errorProfileMissing: 'تعود هذه النسخة الاحتياطية إلى ملف شخصي غير موجود على هذا الهاتف. استعيدي النسخة الرئيسية أولًا.',
    errorStorage: 'تعذّر إكمال الاستعادة. تم الاحتفاظ ببياناتك السابقة.'
  },
  statistics: {
    flowLabels: {
      light: 'خفيف',
      moderate: 'متوسط',
      heavy: 'غزير',
      veryHeavy: 'غزير جدًا',
      none: 'لا يوجد'
    },
    missingAverageCycleData: {
      unconfirmedEnds: 'تواريخ بداية حيضك مسجّلة، لكن لم تُؤكَّد نهايتها بعد. أكّدي موعد انتهاء حيضك لإدراجه في هذه الإحصائية.',
      keepLogging: 'واصلي تسجيل فترات حيضك ليظهر متوسط طول دورتك.'
    },
    headerSubtitle: 'افهمي جسمك من خلال اتجاهاتك',
    unavailableTitle: 'يتعذّر عرض إحصاءاتك الآن',
    unavailableDetail: 'تتعذّر قراءة بعض سجلاتك المحمية حاليًا. لم يُحذف شيء، ولا يُجرى أي تقدير من بيانات مفقودة.',
    loading: 'جارٍ تحميل إحصاءاتك',
    emptyAllTitle: 'لا توجد إحصاءات بعد',
    emptyAllDetail: 'ستظهر إحصاءاتك بمجرد أن تبدئي بتسجيل بياناتك.',
    cycleDetailsTitle: 'انتظام الدورة',
    cycleDetailsSubtitle: 'من فترات حيضك المؤكَّدة',
    shortestCycle_one: 'أقصر دورة: {{count}} يوم',
    shortestCycle_other: 'أقصر دورة: {{count}} يوم',
    shortestCycle_zero: 'أقصر دورة: {{count}} يوم',
    shortestCycle_two: 'أقصر دورة: {{count}} يومان',
    shortestCycle_few: 'أقصر دورة: {{count}} أيام',
    shortestCycle_many: 'أقصر دورة: {{count}} يومًا',
    longestCycle_one: 'أطول دورة: {{count}} يوم',
    longestCycle_other: 'أطول دورة: {{count}} يوم',
    longestCycle_zero: 'أطول دورة: {{count}} يوم',
    longestCycle_two: 'أطول دورة: {{count}} يومان',
    longestCycle_few: 'أطول دورة: {{count}} أيام',
    longestCycle_many: 'أطول دورة: {{count}} يومًا',
    averagePeriodDuration_one: 'متوسط مدة الحيض: {{count}} يوم',
    averagePeriodDuration_other: 'متوسط مدة الحيض: {{count}} يوم',
    averagePeriodDuration_zero: 'متوسط مدة الحيض: {{count}} يوم',
    averagePeriodDuration_two: 'متوسط مدة الحيض: {{count}} يومان',
    averagePeriodDuration_few: 'متوسط مدة الحيض: {{count}} أيام',
    averagePeriodDuration_many: 'متوسط مدة الحيض: {{count}} يومًا',
    periodDurationUnavailableTitle: 'مدة الحيض غير متاحة بعد',
    periodDurationNeedsEnd: 'أكّدي موعد انتهاء حيضك لرؤية متوسط مدته.',
    moodTitle: 'المزاج',
    moodSubtitle: 'المزاج الذي سجّلتِه',
    moodEmptyTitle: 'لا يوجد مزاج مسجّل',
    moodEmptyDetail: 'سجّلي مزاجك في اليوميات لتراه هنا.',
    moodLabels: {
      veryGood: 'جيد جدًا',
      good: 'جيد',
      neutral: 'محايد',
      stressed: 'متوتر',
      irritable: 'سريع الانفعال',
      anxious: 'قلق',
      sad: 'حزين',
      tired: 'متعب',
      motivated: 'متحمّس'
    },
    periods: {
      months_one: '{{count}} شهر',
      months_other: '{{count}} شهر',
      months_zero: '{{count}} شهر',
      months_two: '{{count}} شهران',
      months_few: '{{count}} أشهر',
      months_many: '{{count}} شهرًا'
    },
    periodRequiresPremium: '{{period}}، يتطلب بريميوم',
    cycleOverviewTitle: 'نظرة عامة على الدورة',
    summaryOver: 'ملخص خلال {{period}}',
    averageCycleDurationAccessibility: 'متوسط طول الدورة: {{days}} يوم. بناءً على {{cyclesAnalyzed}} و{{trackedDays}} خلال {{period}}.',
    averageCycleDurationEyebrow: 'متوسط طول الدورة',
    days: 'أيام',
    daysPlural_one: '{{count}} يوم',
    daysPlural_other: '{{count}} يوم',
    daysPlural_zero: '{{count}} يوم',
    daysPlural_two: '{{count}} يومان',
    daysPlural_few: '{{count}} أيام',
    daysPlural_many: '{{count}} يومًا',
    daysAbbreviated: '{{count}} يوم',
    cyclesAnalyzed_one: 'تحليل {{count}} دورة',
    cyclesAnalyzed_other: 'تحليل {{count}} دورة',
    cyclesAnalyzed_zero: 'تحليل {{count}} دورة',
    cyclesAnalyzed_two: 'تحليل {{count}} دورتين',
    cyclesAnalyzed_few: 'تحليل {{count}} دورات',
    cyclesAnalyzed_many: 'تحليل {{count}} دورة',
    daysLogged_one: 'تسجيل {{count}} يوم',
    daysLogged_other: 'تسجيل {{count}} يوم',
    daysLogged_zero: 'تسجيل {{count}} يوم',
    daysLogged_two: 'تسجيل {{count}} يومين',
    daysLogged_few: 'تسجيل {{count}} أيام',
    daysLogged_many: 'تسجيل {{count}} يومًا',
    basedOnCyclesAndDays: 'بناءً على {{cyclesAnalyzed}} و{{trackedDays}} خلال {{period}}.',
    notEnoughCyclesTitle: 'لا توجد دورات مسجّلة كافية بعد',
    monthByMonthOver: 'التفصيل شهرًا بشهر خلال {{period}}',
    recordedIntensityBreakdown: 'توزيع الشدّة المسجّلة',
    flowEvolutionTitle: 'تطوّر التدفّق',
    daysWithFlow_one: '{{count}} يوم مع تدفّق',
    daysWithFlow_other: '{{count}} يوم مع تدفّق',
    daysWithFlow_zero: '{{count}} يوم مع تدفّق',
    daysWithFlow_two: '{{count}} يومان مع تدفّق',
    daysWithFlow_few: '{{count}} أيام مع تدفّق',
    daysWithFlow_many: '{{count}} يومًا مع تدفّق',
    monthFlowAccessibility: '{{month}}: {{daysWithFlow}}. {{distribution}}',
    flowLabelDays_one: '{{label}} {{count}} يوم',
    flowLabelDays_other: '{{label}} {{count}} يوم',
    flowLabelDays_zero: '{{label}} {{count}} يوم',
    flowLabelDays_two: '{{label}} {{count}} يومان',
    flowLabelDays_few: '{{label}} {{count}} أيام',
    flowLabelDays_many: '{{label}} {{count}} يومًا',
    flowLabelDaysColon_one: '{{label}}: {{count}} يوم',
    flowLabelDaysColon_other: '{{label}}: {{count}} يوم',
    flowLabelDaysColon_zero: '{{label}}: {{count}} يوم',
    flowLabelDaysColon_two: '{{label}}: {{count}} يومان',
    flowLabelDaysColon_few: '{{label}}: {{count}} أيام',
    flowLabelDaysColon_many: '{{label}}: {{count}} يومًا',
    noFlowThisPeriod: 'لم يُسجَّل أي تدفّق لهذه الفترة بعد.',
    noFlowDataYetTitle: 'لا توجد بيانات تدفّق بعد',
    logFlowToSeeStatistic: 'سجّلي تدفّقك في اليوميات ليظهر هذا الإحصاء.',
    noFlowThisMonthTitle: 'لا تدفّق مسجّل هذا الشهر',
    frequencyAndEvolutionOver: 'التكرار والتطوّر خلال {{period}}',
    mostRecordedSymptoms: 'الأعراض الأكثر تسجيلًا',
    mostFrequentSymptomsTitle: 'الأعراض الأكثر تكرارًا',
    rankedSymptomAccessibility: '{{rank}}. {{name}}: {{days}}',
    logSymptomsToSeeStatistic: 'سجّلي أعراضك في اليوميات ليظهر هذا الإحصاء.',
    noSymptomsThisPeriodTitle: 'لا أعراض مسجّلة لهذه الفترة',
    noSymptomsThisMonthTitle: 'لا أعراض مسجّلة هذا الشهر',
    monthByMonthEvolution: 'التطوّر شهرًا بشهر',
    monthSymptomAccessibility: '{{month}}: {{symptoms}}',
    symptomDays: '{{name}} {{days}}',
    medicalHint: 'هذه الاتجاهات، المبنية على بياناتك الفعلية، قد تساعدك على وصف تاريخك الصحي بوضوح أكبر في موعد طبي. وهي لا تغني عن المشورة الطبية.'
  },
  dailyJournalSheet: {
    defaultTitle: 'يوميات اليوم',
    defaultSubtitle: 'كيف تشعرين اليوم؟',
    closeJournal: 'إغلاق اليوميات',
    openEntryHint: 'يفتح إدخال {{category}}',
    contraceptionSubtitle: 'متابعة منع الحمل لديك، يومًا بيوم.',
    irregularSubtitle: 'متابعتك، بالوتيرة التي تناسبك.',
    menopauseSubtitle: 'متابعة ما قبل انقطاع الطمث / انقطاع الطمث، يومًا بيوم.',
    pregnancySubtitle: 'خذي بضع ثوانٍ لتدوين ما تشعرين به اليوم.',
    postpartumSubtitle: 'خذي لحظة لنفسك اليوم.',
    miscarriageSubtitle: 'خذي لحظة لنفسك اليوم.',
    conceiveSubtitle: 'متابعة خصوبتك، يومًا بيوم.',
    periodActionSubtitle: 'سجّلي بداية حيضك',
    periodActionTitle: 'الحيض',
    pregnancyItems: {
      symptoms: {
        title: 'الأعراض التي تشعرين بها',
        subtitle: 'دوّني إحساساتك الجسدية'
      },
      weight: {
        title: 'الوزن',
        subtitle: 'سجّلي قياسًا بالكغ'
      },
      mood: {
        title: 'المزاج',
        subtitle: 'كيف تشعرين اليوم؟'
      },
      sleep: {
        title: 'النوم',
        subtitle: 'مدة نومك وجودته'
      },
      medicalInfo: {
        title: 'معلوماتي الطبية الشخصية',
        subtitle: 'مساحة هادئة وخاصة'
      }
    },
    chooseTrackingTitle: 'اختاري ما تريدين تتبّعه',
    chooseTrackingSubtitle: 'حدّدي الفئات التي تريدين تتبّعها',
    items: {
      symptom: {
        title: 'عَرَض',
        subtitle: 'سجّلي أعراضك الجسدية'
      },
      mood: {
        title: 'المزاج',
        subtitle: 'كيف تشعرين اليوم؟'
      },
      activity: {
        title: 'النشاط البدني',
        subtitle: 'حركتك ونشاطك اليوم'
      },
      sleep: {
        title: 'النوم',
        subtitle: 'مدة نومك وجودته'
      },
      hydration: {
        title: 'شرب الماء',
        subtitle: 'تتبّعي كمية الماء التي تشربينها'
      },
      menstrualFlow: {
        title: 'تدفّق الحيض',
        subtitle: 'شدّة تدفّقك وخصائصه'
      },
      intimacy: {
        title: 'الصحة الحميمة',
        subtitle: 'العلاقة الحميمة والحماية وكيف شعرتِ'
      },
      note: {
        title: 'ملاحظة شخصية',
        subtitle: 'اكتبي أفكارك وأضيفي صورًا خاصة'
      }
    }
  },
  periodStartSheet: {
    todayLabel: 'اليوم، {{date}}',
    titleToday: 'هل بدأ حيضك اليوم؟',
    titleOther: 'هل بدأ حيضك في {{date}}؟',
    descriptionToday: 'أكّدي تاريخ بداية حيضك الجديد.',
    descriptionOther: 'أكّدي هذا التاريخ كبداية لحيضك، أو اختاري تاريخًا آخر.',
    fieldLabel: 'تاريخ البداية',
    confirmToday: 'نعم، اليوم',
    confirmOther: 'نعم، في {{date}}',
    chooseAnotherDate: 'اختيار تاريخ آخر',
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ…'
  },
  journalScreenLayout: {
    todayDate: 'اليوم · {{date}}',
    privacyFooter: 'بياناتك محفوظة بخصوصية وأمان وفق إعداداتك.'
  },
  privateSectionAuth: {
    fingerprint: 'البصمة',
    biometrics: 'القياسات الحيوية',
    useBiometryLabel: 'استخدام {{device}}',
    promptTitle: 'المساحة الخاصة في AWA',
    promptSubtitle: 'أكّدي هويتك للمتابعة',
    promptCancel: 'إلغاء'
  },
  privateIntimacyUnlock: {
    purpose: {
      cycle: 'حياتك الحميمة تبقى خاصة تمامًا.',
      conception: 'سجلاتك الحميمة تبقى خاصة تمامًا.',
      cycleNotes: 'ملاحظاتك الشخصية تبقى خاصة تمامًا.',
      contraceptionNotes: 'ملاحظات اليوم تبقى خاصة تمامًا.',
      menopauseNotes: 'ملاحظات اليوم تبقى خاصة تمامًا.',
      photos: 'صورك تبقى خاصة تمامًا.',
      miscarriageNotes: 'ملاحظاتك الشخصية تبقى خاصة تمامًا.',
      export: 'أكّدي هويتك قبل تصدير البيانات الحساسة.'
    },
    title: 'المساحة الخاصة',
    subtitle: 'افتحي القفل برمزك الخاص\nأو بالقياسات الحيوية.',
    backToJournal: 'العودة إلى اليوميات',
    useBiometrics: 'استخدام القياسات الحيوية',
    biometricHint: 'يفتح شاشة فتح القفل بـ Face ID',
    unlockWithBiometrics: 'فتح القفل بالقياسات الحيوية',
    pinHint: 'يفتح لوحة الرمز الخاص',
    enterPin: 'أدخلي رمزك الخاص',
    setUpPin: 'إعداد رمز خاص',
    usePinSubtitle: 'استخدمي رمزك المكوّن من 6 أرقام',
    createPinSubtitle: 'أنشئي رمزًا آمنًا من 6 أرقام',
    privacyTitle: 'خصوصيتك أولويتنا',
    privacyText: 'بياناتك تبقى خاصة ولا يمكن لأحد الوصول إليها غيرك.'
  },
  privateIntimacyPin: {
    incorrectCode: 'الرمز غير صحيح. حاولي مرة أخرى.',
    confirmNewCode: 'أكّدي رمزك الجديد.',
    codesDontMatch: 'الرمزان غير متطابقين. ابدئي من جديد.',
    genericError: 'حدث خطأ ما. حاولي مرة أخرى.',
    enterYourCode: 'أدخلي رمزك الخاص',
    confirmYourCode: 'أكّدي رمزك',
    createYourCode: 'أنشئي رمزك الخاص',
    secureCodeSubtitle: 'رمز آمن من 6 أرقام',
    digitsEntered: 'تم إدخال {{count}} من الأرقام',
    deleteKey: 'حذف'
  },
  privateIntimacyFaceId: {
    lookAtPhone: 'انظري إلى هاتفك لفتح قفل\nهذه المساحة الخاصة.',
    placeFinger: 'ضعي إصبعك على المستشعر لفتح قفل\nهذه المساحة الخاصة.',
    useBiometrics: 'استخدمي القياسات الحيوية لفتح قفل\nهذه المساحة الخاصة.',
    authNotRecognized: 'لم يتم التعرّف على المصادقة. حاولي مرة أخرى.',
    verifying: 'جارٍ التحقق…',
    usePinCode: 'استخدام الرمز الخاص',
    usePinCodeInstead: 'استخدمي رمزك الخاص بدلًا من ذلك'
  },
  clearEntryButton: {
    confirmTitle: 'مسح هذا الإدخال؟',
    confirmMessage: 'أنتِ على وشك حذف {{subject}} المسجّل لهذا اليوم نهائيًا.',
    clear: 'مسح',
    clearThisEntry: 'مسح هذا الإدخال'
  },
  calendar: {
    title: 'التقويم',
    subtitle: 'تابعي دورتك بسهولة ✨',
    filters: 'التصفية',
    legend: 'دليل الألوان',
    periodAlertTitle: 'الحيض',
    periodAlertSelectDay: 'حدّدي يومًا واحدًا على الأقل من حيضك.',
    nonContinuousTitle: 'التحديد غير متصل',
    nonContinuousMessage: 'يجب أن تشكّل أيام الحيض نطاقًا متصلًا.',
    editErrorTitle: 'تعذّر حفظ التغييرات',
    editErrorOverlap: 'يتداخل هذا الحيض مع حيض مسجّل سابقًا.',
    editErrorGeneric: 'تحقّقي من التواريخ التي حددتِها.',
    periodLate: 'الحيض متأخر',
    nextPeriodEstimated: 'الحيض القادم (تقديري)',
    windowPassedSince: 'انقضت الفترة منذ {{date}}',
    noNewPeriodRecorded: 'لم يُسجَّل حيض جديد',
    observingCycles: 'AWA تراقب دوراتك',
    fertileWindowEstimated: 'فترة الخصوبة (تقديري)',
    ovulationEstimated: 'الإباضة (تقديري)',
    noPeriodThisDay: 'لا حيض مسجّل في هذا اليوم',
    predictionsPendingFirstPeriod: 'ستتوفر توقعات الدورة بعد تسجيل أول حيض لها ووجود بيانات كافية.',
    predictionsPendingFirstPeriodOwner: 'ستتوفر توقعات الدورة بعد تسجيل حيضك ووجود بيانات كافية.',
    predictionsPendingMoreData: 'ستظهر توقعات الدورة بعد تسجيل عدد كافٍ من فترات الحيض.',
    periodStart: 'بداية الحيض',
    periodEnd: 'نهاية الحيض',
    editPeriodTitle: 'تعديل حيضي',
    daysSelected_one: 'تم تحديد {{count}} يوم',
    daysSelected_other: 'تم تحديد {{count}} يوم',
    daysSelected_zero: 'تم تحديد {{count}} يوم',
    daysSelected_two: 'تم تحديد {{count}} يومين',
    daysSelected_few: 'تم تحديد {{count}} أيام',
    daysSelected_many: 'تم تحديد {{count}} يومًا',
    predictionsTitle: 'توقعات مخصّصة',
    predictionsCaption: 'توقعات محسوبة من دوراتك المسجّلة.',
    confidenceHigh: 'ثقة عالية',
    confidenceModerate: 'ثقة متوسطة',
    confidenceLimited: 'ثقة محدودة',
    timelineTitle: 'الجدول الزمني لدورتك',
    monthHistoryTitle: 'سجلّ الشهر',
    periodRange: 'الحيض {{range}}',
    dayCard: {
      cycleDayBadge: 'يوم الدورة {{day}}',
      phase: {
        menstruation: {
          label: 'مرحلة الحيض',
          subtitle: 'خصوبة منخفضة'
        },
        follicular: {
          label: 'المرحلة الجريبية',
          subtitle: 'خصوبة متزايدة'
        },
        fertile: {
          label: 'فترة الخصوبة',
          subtitle: 'خصوبة عالية'
        },
        ovulation: {
          label: 'مرحلة الإباضة',
          subtitle: 'خصوبة عالية'
        },
        luteal: {
          label: 'المرحلة الأصفرية',
          subtitle: 'خصوبة منخفضة'
        }
      },
      phaseUnavailable: {
        label: 'المرحلة غير مقدَّرة',
        subtitle: 'دورة متغيّرة: لا توقع دقيق'
      },
      flow: {
        none: 'لا شيء',
        light: 'خفيف',
        moderate: 'متوسط',
        heavy: 'غزير',
        veryHeavy: 'غزير جدًا'
      },
      notProvided: 'غير مُدخَل',
      rows: {
        flowLabel: 'شدّة التدفّق',
        symptomsNone: 'لا شيء',
        activityNone: 'لا شيء',
        intimacyYes: 'نعم',
        intimacyNo: 'لا',
        intimacyPreferNotToSay: 'أفضّل عدم الإجابة',
        viewNote: 'عرض الملاحظة',
        noNote: 'لا توجد ملاحظة'
      },
      periodSectionTitle: 'الحيض',
      editing: 'قيد التعديل',
      edit: 'تعديل',
      periodUnrecorded: 'لا حيض مسجّل لهذه الدورة',
      periodDurationLabel: 'مدة الحيض',
      declareCta: 'بدأ حيضي في هذا اليوم'
    },
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    modeGregorian: 'ميلادي',
    modeHijri: 'هجري',
    modeDouble: 'مزدوج',
    dayKind: {
      period: 'حيض',
      fertile: 'خصوبة',
      ovulation: 'إباضة',
      normal: 'يوم عادي'
    },
    legendPeriod: 'الحيض',
    legendFertile: 'الخصوبة',
    legendRamadan: 'رمضان',
    legendDhoulHijja: 'ذو الحجة',
    closeFilters: 'إغلاق التصفية',
    filtersTitle: 'تصفية التقويم',
    filtersSubtitle: 'اختاري المعلومات المعروضة في تقويمك.',
    closeLegend: 'إغلاق دليل الألوان',
    legendSheet: {
      title: 'دليل ألوان التقويم',
      subtitle: 'معنى الألوان والعلامات في تقويمك.',
      ramadanDescription: 'يقع هذا اليوم ضمن شهر رمضان (الصيام).',
      dhoulHijjaDescription: 'يقع هذا اليوم ضمن شهر ذي الحجة.',
      periodDescription: 'الأيام المسجّلة كحيض لديك.',
      fertileDescription: 'الفترة التي تكون فيها فرصة الحمل في أعلى مستوياتها.',
      ovulationDescription: 'اليوم المقدَّر للإباضة في دورتك.',
      moodDescription: 'تم تسجيل مزاج لهذا اليوم.',
      notesSymptomsLabel: 'الملاحظات / الأعراض',
      notesSymptomsDescription: 'تم تسجيل ملاحظة أو عَرَض أو إدخال يومي آخر (نشاط، نوم، شرب الماء، صحة حميمة) لهذا اليوم.',
      todayDescription: 'يحدّد اليوم الحالي في تقويمك.'
    }
  },
  managedProfile: {
    intro: {
      title: 'أضيفي الملف الشخصي\nلابنتك',
      description: 'تابعي دورة ابنتك في\nمساحة آمنة تناسب سنّها.',
      benefitPrivacyTitle: 'مساحة خاصة وآمنة',
      benefitPrivacySubtitle: 'بياناتها منفصلة\nعن ملفك الشخصي.',
      benefitTrackingTitle: 'متابعة كاملة للدورة',
      benefitTrackingSubtitle: 'الحيض والأعراض والمزاج\nوغير ذلك.',
      benefitAdaptedTitle: 'تجربة مصمّمة لها',
      benefitAdaptedSubtitle: 'محتوى وميزات\nمصمّمة خصيصًا لها.'
    },
    daughterInfo: {
      title: 'عن ابنتك',
      description: 'يساعدنا هذا على تخصيص مساحتها.',
      firstNameLabel: 'الاسم الأول',
      firstNameAccessibilityLabel: 'الاسم الأول لابنتك',
      firstNamePlaceholder: 'مثلًا: لينا',
      birthDateLabel: 'تاريخ الميلاد',
      birthDatePlaceholder: 'اختاري تاريخًا',
      age_one: 'العمر: {{count}} سنة',
      age_other: 'العمر: {{count}} سنة',
      age_zero: 'العمر: {{count}} سنة',
      age_two: 'العمر: {{count}} سنتان',
      age_few: 'العمر: {{count}} سنوات',
      age_many: 'العمر: {{count}} سنة',
      editPhoto: 'تعديل صورة الملف الشخصي',
      photoSheetTitle: 'صورة الملف الشخصي',
      photoSheetSubtitle: 'اختاري صورة لملفها الشخصي.',
      takePhoto: 'التقاط صورة',
      chooseFromGallery: 'اختيار من المعرض',
      photoErrorTitle: 'صورة الملف الشخصي',
      photoErrorAccess: 'تعذّر الوصول إلى الكاميرا أو المعرض حاليًا.',
      photoErrorGeneric: 'حدث خطأ ما. حاولي مرة أخرى.'
    },
    firstPeriod: {
      title: 'هل جاءها حيضها الأول؟',
      description: 'يساعدنا هذا على ملاءمة تجربتها.',
      yes: 'نعم',
      yesSubtitle: 'جاءها حيضها الأول بالفعل.',
      no: 'لا',
      noSubtitle: 'لم يأتِها حيضها الأول بعد.',
      creating: 'جارٍ الإنشاء…'
    },
    cycleSetup: {
      title: 'عن دورتها',
      description: 'يمكنك تحديث هذه المعلومات في أي وقت لاحقًا.',
      lastPeriodLabel: 'تاريخ بداية آخر حيض',
      lastPeriodPlaceholder: 'اختاري تاريخًا',
      periodLengthLabel: 'مدة الحيض المعتادة',
      cycleLengthLabel: 'طول الدورة المعتاد',
      days_one: '{{count}} يوم',
      days_other: '{{count}} يوم',
      days_zero: '{{count}} يوم',
      days_two: '{{count}} يومان',
      days_few: '{{count}} أيام',
      days_many: '{{count}} يومًا',
      decrease: 'إنقاص',
      increase: 'زيادة',
      regularityLabel: 'انتظام الدورة',
      regular: 'منتظمة',
      irregular: 'غير منتظمة',
      unknown: 'لست متأكدة',
      helperText: 'ستتمكنين من تحديث هذه المعلومات لاحقًا.',
      savedValuesNote: 'ستُحفظ المدد المعروضة (الحيض: {{period}}، الدورة: {{cycle}}) عند الضغط على «{{button}}». يمكنك تغييرها لاحقًا.',
      futureDateWarning: 'لا يمكن أن يكون هذا التاريخ في المستقبل.',
      creating: 'جارٍ الإنشاء…',
      createProfile: 'إنشاء الملف الشخصي'
    },
    success: {
      pill: 'تم إنشاء الملف الشخصي',
      title: 'تم إنشاء الملف الشخصي لـ {{firstName}}!',
      subtitle: 'يمكنك الآن الدخول إلى مساحتها والبدء بتسجيل معلوماتها.',
      goToProfile: 'الانتقال إلى الملف الشخصي لـ {{firstName}}',
      stayOnMyProfile: 'البقاء في ملفي الشخصي'
    },
    deleteModal: {
      closeAccessibility: 'إغلاق دون حذف',
      title: 'حذف هذا الملف الشخصي؟',
      body: 'هل أنتِ متأكدة من حذف الملف الشخصي لـ {{firstName}}؟',
      reassurance: 'سيتم حذف المعلومات المحفوظة لهذا الملف الشخصي.',
      cancelAccessibility: 'إلغاء',
      cancelText: 'إلغاء',
      confirmAccessibilityNamed: 'تأكيد حذف الملف الشخصي لـ {{firstName}}',
      confirmAccessibility: 'تأكيد الحذف',
      confirmText: 'حذف الملف الشخصي',
      deleting: 'جارٍ الحذف…',
      failedTitle: 'لم يُحذف الملف الشخصي بالكامل',
      failedBody: 'تعذّر حذف الملف الشخصي بالكامل. لم يتم المساس بأي شيء آخر — حاولي مرة أخرى.'
    }
  },
  profile: {
    aboutAwaSubtitle: 'الإصدار والإشعارات القانونية والخصوصية وقيم التطبيق',
    aboutAwaTitle: 'حول AWA',
    appearanceSubtitle: 'السمات والألوان والعرض واللغة',
    awaADeuxSectionTitle: 'AWA معًا',
    awaADeuxSubtitle: 'شاركي معلومات مختارة مع الشريك',
    awaADeuxTitle: 'AWA معًا',
    backupSubtitle: 'النسخ الاحتياطي السحابي واستعادة بياناتك',
    backupTitle: 'النسخ الاحتياطي',
    currentlyValue: 'حاليًا: {{value}}',
    cycleLengthLabel: 'طول الدورة',
    cycleRegularityLabel: 'انتظام الدورة',
    dataProtected: 'البيانات محمية',
    disabledSingular: 'معطّل',    editAvatarAccessibility: 'تغيير صورة الملف الشخصي',
    editProfile: 'تعديل الملف الشخصي',headerSubtitle: 'أدِيري معلوماتك وتفضيلاتك',
    helpSupportSubtitle: 'الأسئلة الشائعة والإبلاغ عن مشكلة والتواصل',
    helpSupportTitle: 'المساعدة والدعم',
    hijriDateLabel: 'التاريخ الهجري',
    identitySubtitle: 'معلومات الملف الشخصي والتفضيلات',
    lastPeriodLabel: 'آخر حيض',
    managedProfileEyebrow: 'ملف شخصي مُدار',
    moreSectionSubtitle: 'المساعدة والمعلومات حول AWA وإدارة جلستك.',
    moreSectionTitle: 'المزيد',
    myInformationSubtitle: 'كل معلوماتك المهمة، منظّمة ببساطة.',
    myInformationTitle: 'معلوماتي',
    myObjective: 'هدفي',
    myProfileEyebrow: 'ملفي الشخصي',
    none: 'لا شيء',
    notConfigured: 'غير مُعدّ',
    notProvided: 'غير مُدخَل',
    notProvidedFeminine: 'غير مُدخَلة',
    predictionsUnavailable: 'التوقعات غير متاحة — البيانات غير كافية',
    notProvidedPlural: 'غير مُدخَلة',
    notificationsAndReminders: 'الإشعارات والتذكيرات',
    periodLengthLabel: 'مدة الحيض',
    periodLengthShortLabel: 'مدة الحيض',
    privacySecuritySubtitle: 'رمز PIN والقياسات الحيوية والوضع الخفي وحماية البيانات',
    privacySecurityTitle: 'الخصوصية والأمان',
    privateModeEyebrow: 'الوضع الخاص',
    signOut: 'تسجيل الخروج',
    cycle: {
      remindersSubtitle: 'الحيض واليوميات والإباضة وفترة الخصوبة'
    },conceive: {
      indicatorsSubtitle: 'الحرارة ومخاط عنق الرحم واختبارات LH والعلاقة الحميمة',
      indicatorsTitle: 'المؤشرات المتتبَّعة',
      manageReminders: 'إدارة تذكيرات الحمل الخاصة بي',
      ovulationAwarenessSubtitle: 'أتعلّم كيف ألاحظ إباضتي',
      ovulationAwarenessTitle: 'الوعي بالإباضة',
      tryingDurationSubtitle: 'منذ متى أحاول الحمل',
      tryingDurationTitle: 'مدة المحاولة'
    },
    contraception: {
      currentMethodLabel: 'الوسيلة الحالية',
      remindersDisabled: 'معطّلة',
      remindersEnabled: 'مفعّلة',
      remindersLabel: 'التذكيرات',
      remindersSubtitle: 'تذكيرات مرتبطة بوسيلة منع الحمل لديك',
      remindersUnavailable: 'غير متاحة',
      trackingStartLabel: 'بداية المتابعة',
      treatmentBreakLabel: 'فترة التوقف عن العلاج',
      treatmentStartLabel: 'بداية العلاج',
      withBreak: 'مع فترة توقف',
      withoutBreak: 'دون فترة توقف'
    },
    cycleDurationEditor: {
      subtitle: 'كم يومًا تدوم دورتها عادةً؟',
      title: 'طول الدورة'
    },
    durationStepper: {
      decrease: 'إنقاص',
      increase: 'زيادة',
      unit: 'أيام'
    },
    irregular: {
      cycleTypeLabel: 'نوع الدورة',
      noTrackedItems: 'لا عناصر متتبَّعة',
      remindersSubtitle: 'اليوميات وفترات الحيض غير المسجّلة',
      trackedItemsCount_one: '{{count}} عنصر متتبَّع',
      trackedItemsCount_other: '{{count}} عنصر متتبَّع',
      trackedItemsCount_zero: '{{count}} عنصر متتبَّع',
      trackedItemsCount_two: 'عنصران متتبَّعان',
      trackedItemsCount_few: '{{count}} عناصر متتبَّعة',
      trackedItemsCount_many: '{{count}} عنصرًا متتبَّعًا',
      trackedItemsLabel: 'العناصر المتتبَّعة',
      cyclePattern: {
        irregular: 'غير منتظمة',
        regular: 'منتظمة إلى حدٍّ ما',
        unknown: 'لست متأكدة بعد',
        veryVariable: 'شديدة التغيّر'
      }
    },
    logoutDialog: {
      body: 'هل أنتِ متأكدة من رغبتك في تسجيل الخروج من حساب AWA؟',
      confirmAccessibilityLabel: 'تأكيد تسجيل الخروج',
      reassurance: 'يمكنك تسجيل الدخول مجددًا في أي وقت.',
      title: 'تسجيل الخروج؟'
    },
    managedProfileInfoModal: {
      ageLabel: 'العمر',
      birthDateLabel: 'تاريخ الميلاد',
      firstNameLabel: 'الاسم الأول',
      linkedAccountInfo: 'ليس لهذا الملف المُدار حساب AWA خاص به — تبقى معلوماتها مرتبطة بحسابك ويمكن تعديلها من «إدارة الملفات الشخصية».',
      subtitle: 'معلومات {{name}}.',
      thisProfile: 'هذا الملف الشخصي'
    },
    managedProfiles: {
      addDaughterProfile: 'إضافة ملف ابنتي',
      addProfile: 'إضافة ملف شخصي',
      deleteProfileOf: 'حذف ملف {{name}}',
      swipeDeleteLabel: 'حذف',
      myDaughter: 'ابنتي',
      myProfile: 'ملفي الشخصي',
      profileOf: 'ملف {{name}}',
      sheetSubtitle: 'تابعي دورتك أو ملفًا شخصيًا تقومين بإدارته.',
      sheetTitle: 'إدارة الملفات الشخصية'
    },
    menopause: {
      currentStageLabel: 'المرحلة الحالية',
      hormonalTreatmentLabel: 'العلاج الهرموني',
      labTrackingLabel: 'التحاليل المتتبَّعة',
      noSymptomsTracked: 'لا أعراض متتبَّعة',
      remindersSubtitle: 'المتابعة اليومية وتذكير العلاج',
      symptomsTrackedCount_one: 'عرَض واحد متتبَّع',
      symptomsTrackedCount_other: '{{count}} عرَض متتبَّع',
      symptomsTrackedCount_zero: 'لا أعراض متتبَّعة',
      symptomsTrackedCount_two: 'عرَضان متتبَّعان',
      symptomsTrackedCount_few: '{{count}} أعراض متتبَّعة',
      symptomsTrackedCount_many: '{{count}} عرَضًا متتبَّعًا',
      trackedSymptomsLabel: 'الأعراض المتتبَّعة',
      hormonalTreatment: {
        no: 'غير متتبَّع',
        notNow: 'ليس الآن',
        track: 'المتابعة مفعّلة'
      },
      labTracking: {
        both: 'FSH والإستراديول',
        estradiol: 'الإستراديول',
        none: 'ليس الآن'
      },
      stage: {
        menopause: 'انقطاع الطمث',
        perimenopause: 'ما قبل انقطاع الطمث',
        unsure: 'غير محدّدة'
      }
    },
    miscarriage: {
      currentBleedingLabel: 'النزف الحالي',
      cycleReturnLabel: 'عودة الدورة',
      dateLabel: 'تاريخ الفقدان',
      eventDateLabel: 'تاريخ الحدث',
      periodReturnDateLabel: 'تاريخ عودة الحيض',
      provideOrCorrectDate: 'أدخلي التاريخ أو صحّحيه',
      remindersSubtitle: 'تذكير لطيف لتخصيص لحظة لمتابعتك',
      tryingAgainLabel: 'محاولة جديدة',
      bleedingStatus: {
        variable: 'متغيّر'
      },
      cycleReturn: {
        notYet: 'ليس بعد',
        unknown: 'لست متأكدة'
      },
      tryingAgain: {
        notNow: 'ليس الآن',
        ready: 'نعم، أشعر بالاستعداد',
        soon: 'قريبًا'
      }
    },
    objectivePicker: {
      subtitle: 'اختاري الهدف الأنسب لوضعك.',
      title: 'تغيير هدفي',
      subtitles: {
        conceive: 'متابعة خصوبتي وإباضتي',
        contraception: 'متابعة دورتي مع منع الحمل',
        cycle: 'متابعة حيضي وفهم دورتي',
        irregular: 'فهم دوراتي غير المنتظمة بشكل أفضل',
        loss: 'متابعة جسمي وتعافيّ',
        menopause: 'متابعة عافيتي خلال هذه المرحلة',
        postpartum: 'متابعة تعافيّ بعد الولادة',
        pregnancy: 'مرافقة مراحل حملي المختلفة'
      }
    },
    periodDurationEditor: {
      subtitle: 'كم يوم يستمر حيضها عادةً؟',
      title: 'مدة الحيض'
    },
    personalInfo: {daughterSubtitle: 'الاسم الأول، تاريخ الميلاد…',
      ownerSubtitle: 'الاسم، البريد الإلكتروني، تاريخ الميلاد…',
      title: 'المعلومات الشخصية'
    },
    photoModal: {
      cameraGalleryError: 'تعذّر الوصول إلى الكاميرا أو المعرض حاليًا.',
      chooseFromGallery: 'اختيار من المعرض',
      editTitle: 'تعديل الصورة',
      genericError: 'حدث خطأ ما. يُرجى المحاولة مرة أخرى.',
      removePhoto: 'إزالة الصورة',
      revertToDefaultSubtitle: 'العودة إلى الصورة الرمزية الافتراضية',
      selectExistingSubtitle: 'اختيار صورة موجودة',
      takePhoto: 'التقاط صورة',
      title: 'صورة الملف الشخصي',
      useCameraSubtitle: 'استخدام الكاميرا'
    },
    postpartum: {
      babyFeedingLabel: 'تغذية الرضيع',
      correctDeliveryDate: 'تصحيح تاريخ ولادتي',
      cycleReturnSubtitle: 'أضيفي تاريخ أول حيض لك أو عدّليه أو امسحيه',
      deliveryDateLabel: 'تاريخ الولادة',
      deliveryLabel: 'الولادة',
      deliveryTypeLabel: 'نوع الولادة',
      feedingLabel: 'التغذية',
      feedingSubtitle: 'الرضاعة الطبيعية وتغذية الرضيع',
      myDeliveryLabel: 'ولادتي',
      remindersSubtitle: 'إدارة تذكير المتابعة اليومية',
      deliveryType: {
        emergencyCsection: 'قيصرية طارئة',
        plannedCsection: 'قيصرية مخطّط لها',
        preferNotToSay: 'أفضّل عدم الإفصاح',
        vaginal: 'ولادة طبيعية'
      },
      feedingType: {
        exclusiveBottle: 'رضاعة بالزجاجة فقط',
        exclusiveBreastfeeding: 'رضاعة طبيعية حصرية',
        mixed: 'رضاعة مختلطة (ثدي + زجاجة)',
        unknown: 'لست متأكدة بعد'
      }
    },
    pregnancy: {
      datingSubtitle: 'تاريخ البداية أو تاريخ الولادة المتوقع أو الحمل',
      datingTitle: 'تحديد تاريخ حملي',
      remindersSubtitle: 'الحمل والمواعيد والفحوصات وتذكيرات مخصّصة',
      trackingPreferencesSubtitle: 'اختاري فئات متابعتي اليومية',
      trackingPreferencesTitle: 'تفضيلات المتابعة'
    },
    premiumCard: {
      accessibilityHint: 'يفتح نظرة عامة على AWA بريميوم',
      accessibilityLabel: 'اكتشفي AWA بريميوم',
      activeSubscription: 'الاشتراك نشط',
      activeSubtitle: 'شكرًا لدعمك AWA — اشتراكك نشط.',
      discoverPremium: 'اكتشفي بريميوم',
      inactiveSubtitle: 'افتحي أدوات متقدمة لتذهبي أبعد في متابعتك.',
      features: {
        additionalThemes: 'سمات مرئية إضافية',
        advancedStatistics: 'إحصاءات متقدمة',
        inDepthEducationalContent: 'محتوى تثقيفي معمّق',
        pdfCsvExport: 'تصدير PDF وCSV',
        unlimitedHistory: 'سجل غير محدود'
      }
    },
    regularity: {
      dontKnowYet: 'لست متأكدة بعد',
      irregular: 'غير منتظمة',
      ratherRegular: 'منتظمة إلى حدٍّ ما'
    },
    regularityEditor: {
      subtitle: 'هل دورتها منتظمة عادةً؟',
      title: 'انتظام الدورة'
    },
    security: {
      configure: 'إعداد',
      lockRecommendedText: 'احمي وصولك برمز PIN أو بالقياسات الحيوية.',
      lockRecommendedTitle: 'يُنصح بالقفل'
    },
    spiritualMarkers: {
      active: 'مفعّلة',
      canChangeAnytime: 'يمكنك تغيير هذا الاختيار في أي وقت من ملفك الشخصي.',
      disabledPlural: 'معطّلة',
      enabledPlural: 'مفعّلة',
      hideFeatures: 'إخفاء الميزات الروحية',
      inactive: 'غير مفعّلة',
      manageMarkers: 'إدارة العلامات',
      markersStateLabel: 'حالة العلامات',
      modalSubtitle: 'فعّلي الميزات الروحية في AWA أو عطّليها.',
      noDeactivate: 'لا، عطّليها',
      relatedFeaturesTitle: 'الميزات المرتبطة',
      sectionTitle: 'العلامات الروحية',
      showFeatures: 'إظهار الميزات الروحية',
      summaryText: 'التقويم الهجري والصلوات والطهارة والصيام والتذكيرات.',
      yesActivate: 'نعم، فعّليها',
      fasting: {
        description: 'رمضان وأيام الصيام الواجب قضاؤها',
        label: 'الصيام (رمضان، أيام القضاء)'
      },
      hijriCalendar: {
        description: 'التواريخ والمناسبات من التقويم الإسلامي',
        label: 'التقويم الهجري'
      },
      prayerReminders: {
        description: 'احصلي على تذكيرات بصلواتك',
        label: 'تذكيرات الصلاة'
      },
      prayersPurity: {
        description: 'تابعي الصلوات وحالة الطهارة',
        label: 'الصلوات وحالة الطهارة'
      }
    }
  },
  inAppNotifications: {
    clearAll: 'مسح الكل',
    clearAllMessage: 'هذا يمسح سجلّك داخل AWA فقط.',
    clearAllTitle: 'مسح الإشعارات؟',
    closeNotifications: 'إغلاق الإشعارات',
    deleteNotification: 'حذف هذا الإشعار',
    emptyText: 'ستظهر هنا تذكيراتك المهمة.',
    emptyTitle: 'لا إشعارات',
    moreActions: 'المزيد من الإجراءات',
    readAll: 'تحديد الكل كمقروء',
    title: 'الإشعارات',
    today: 'اليوم · {{time}}',
    yesterday: 'أمس · {{time}}',
    category: {
      cycleReminder: 'الدورة الشهرية',
      irregular: 'متلازمة تكيّس المبايض',
      menopause: 'انقطاع الطمث',
      nifas: 'النفاس',
      postpartum: 'ما بعد الولادة',
      pregnancy: 'الحمل',
      qadaa: 'الصيام (القضاء)'
    }
  },
  conceiveDashboard: {
    headerSubtitle: 'على طريق حلمك ✨',
    hero: {
      badge: {
        menstruation: 'الحيض',
        follicular: 'المرحلة الجريبية',
        fertile: 'فترة الخصوبة',
        ovulation: 'الإباضة',
        luteal: 'بعد الإباضة'
      },
      title: {
        menstruation: 'الدورة جارية',
        follicular: 'الخصوبة في ارتفاع',
        fertile: 'خصوبة عالية',
        ovulation: 'الإباضة اليوم',
        luteal: 'المرحلة الأصفرية'
      },
      description: {
        menstruation: 'وقت للراحة قبل بقية دورتك.',
        follicular: 'جسمك يستعد — واصلي متابعتك اليومية.',
        fertile: 'أنتِ اليوم في أكثر أوقاتك خصوبة.',
        ovulation: 'إباضتك مقدّرة لهذا اليوم.',
        luteal: 'انتهت فترة خصوبتك في هذه الدورة.'
      }
    },
    advice: {
      menstruation: 'اغتنمي هذا الوقت للعناية بنفسك قبل بقية دورتك.',
      follicular: 'واصلي متابعتك اليومية — فترة خصوبتك تقترب.',
      fertile: 'هذا وقت مناسب لزيادة فرصك — اعتني بنفسك وأصغي إلى جسمك.',
      ovulation: 'قد يساعد اختبار LH اليوم على تأكيد هذه الذروة.',
      luteal: 'أثناء انتظار حيضك القادم، اعتني بنفسك.'
    },
    ring: {
      dayEyebrow: 'اليوم',
      cycleDays_one: 'دورة من يوم واحد',
      cycleDays_other: 'دورة من {{count}} يوم',
      cycleDays_zero: 'دورة من {{count}} يوم',
      cycleDays_two: 'دورة من يومين',
      cycleDays_few: 'دورة من {{count}} أيام',
      cycleDays_many: 'دورة من {{count}} يومًا'
    },
    timelineLegend: {
      period: 'الحيض',
      fertile: 'الخصوبة',
      ovulation: 'الإباضة',
      luteal: 'الأصفرية'
    },
    nextPeriodLabel: 'الحيض القادم المتوقع',
    viewCalendar: 'عرض التقويم',
    insufficientData: {
      title: 'أعدّي دورتك',
      text: 'نحتاج بعض التفاصيل لتقدير فترة خصوبتك.',
      cta: 'إعداد دورتي'
    },
    evolutionCard: {
      accessibilityLabel: 'عرض تطوّر الدورة',
      subtitleWithStatus: 'اليوم {{day}} · {{status}}',
      subtitleConfigure: 'أعدّي دورتك لعرضه'
    },
    dailyJournalTitle: 'متابعة اليوم',
    adviceCard: {
      title: 'نصائح لليوم'
    }
  },
  conceiveCalendar: {
    subtitle: 'دورتك وخصوبتك في لمحة',
    categories: {
      menstruation: {
        label: 'الحيض',
        description: 'أيام الحيض، محسوبة من دورتك.'
      },
      fertile: {
        description: 'الفترة الأنسب للحمل.'
      },
      ovulation: {
        description: 'يوم الإباضة المقدَّر لهذه الدورة.'
      },
      temperature: {
        description: 'درجة الحرارة المسجّلة في يومياتك.'
      },
      cervicalMucus: {
        description: 'ملاحظة مخاط عنق الرحم لديك.'
      },
      lhTest: {
        description: 'تظهر علامة «LH+» في التقويم عند الاختبار الإيجابي. وتبقى جميع نتائجك ظاهرة في تفاصيل اليوم.'
      },
      intimacy: {
        description: 'علاقة مسجّلة في يومياتك، بسرّية.'
      }
    },
    phaseLabel: {
      menstruation: 'الحيض',
      follicular: 'المرحلة الجريبية',
      fertile: 'فترة الخصوبة',
      ovulation: 'الإباضة',
      luteal: 'المرحلة الأصفرية',
      pregnancy: 'الحمل',
      postpartum: 'ما بعد الولادة'
    },
    mucusLabel: {
      dry: 'جاف',
      sticky: 'لزج',
      creamy: 'كريمي',
      watery: 'مائي',
      eggWhite: 'شفاف وقابل للتمدد'
    },
    lhLabel: {
      negative: 'سلبي',
      positive: 'إيجابي',
      invalid: 'غير صالح'
    },
    dayAccessibility: {
      menstruation: '، حيض',
      fertile: '، فترة الخصوبة',
      ovulation: '، إباضة مقدَّرة',
      ramadan: '، رمضان',
      dhoulHijja: '، ذو الحجة'
    },
    todayLegend: 'اليوم',
    selectedStatus: {
      fertilityStatus: 'حالة الخصوبة'
    },
    emptyState: {
      configureCycle: 'أعدّي دورتك لرؤية يوم دورتك وفترة خصوبتك.',
      noFilters: 'فعّلي مرشّحًا واحدًا على الأقل لرؤية متابعة هذا اليوم.'
    },
    intimacyRecorded: 'مسجّلة',
    configureCycleCta: 'إعداد دورتي',
    openJournalDayHint: 'يفتح يوميات هذا اليوم',
    addToJournal: 'إضافة إلى اليوميات',
    filtersSheet: {
      title: 'مرشّحات التقويم',
      subtitle: 'اختاري المعلومات التي تظهر في تقويمك.'
    },
    legendSheet: {
      title: 'دليل التقويم',
      subtitle: 'افهمي الألوان والعلامات المستخدمة.',
      ramadanDescription: 'يقع هذا اليوم ضمن شهر رمضان (الصيام).',
      dhoulHijjaDescription: 'يقع هذا اليوم ضمن شهر ذي الحجة.',
      todayTitle: 'اليوم',
      todayDescription: 'الإطار الأسود المتقطع يحدّد تاريخ اليوم.',
      closeAccessibility: 'إغلاق الدليل'
    }
  },
  conceiveStatistics: {
    headerSubtitle: 'دورتك وخصوبتك',
    objectiveLabel: 'الهدف الحالي',
    emptyTitle: 'لا بيانات بعد',
    tabs: {
      summary: 'الملخص',
      temperature: 'الحرارة',
      fertility: 'الخصوبة',
      cycle: 'الدورة'
    },
    summary: {
      overviewTitle: 'نظرة عامة',
      overviewSubtitle: 'هذه الدورة في لمحة',
      temperaturesRecorded: 'درجات الحرارة المسجّلة',
      positiveLhTests: 'اختبارات LH الإيجابية',
      temperatureEvolutionTitle: 'تطوّر درجة الحرارة',
      temperatureEvolutionSubtitle: 'أحدث قياساتك',
      temperatureEmptyText: 'سجّلي درجة حرارة جسمك القاعدية في يومياتك لرؤية تطوّرها.',
      intercourseThisCycle: 'العلاقات في هذه الدورة',
      adviceTitle: 'مرجع شخصي، لا تشخيص',
      adviceText: 'هذه التقديرات مرجع شخصي مبني على متابعتك. لا تضمن حدوث الحمل ولا تغني عن الاستشارة الطبية.'
    },
    temperature: {
      emptyText: 'سجّلي درجة حرارة جسمك القاعدية كل صباح لمتابعة تطوّرها.',
      latest: 'أحدث درجة حرارة',
      recordedReadings: 'القياسات المسجّلة',
      average: 'المتوسط',
      minMax: 'الأدنى / الأعلى',
      evolutionTitle: 'تطوّر درجة الحرارة',
      lastReading: 'آخر قياس: {{date}}',
      infoText: 'يُضبط مقياس الرسم البياني وفق قياساتك الخاصة لتسهيل رؤية التغيّرات — وتبقى القيم الدقيقة معروضة أعلاه، بوحدة °{{unit}}.',
      infoConvertedSuffix: ' تُحوَّل القياسات المُدخلة بالوحدة الأخرى للعرض (بياناتك نفسها لا تتغيّر).'
    },
    fertility: {
      emptyText: 'سجّلي اختبارات الإباضة وملاحظات مخاط عنق الرحم لرؤية اتجاهاتك هنا.',
      lastLhTest: 'آخر اختبار LH',
      lhResultsTitle: 'نتائج اختبار LH',
      lastTest: 'آخر اختبار: {{date}}',
      accordingToEntries: 'بناءً على إدخالاتك',
      lhEmptyText: 'سجّلي اختبارات الإباضة لرؤية توزيعها.',
      lhEvolutionAccessibility: 'تطوّر اختبار LH خلال {{period}}',
      lhEvolutionTitle: 'تطوّر اختبار LH',
      lhEvolutionSubtitle: 'نتائجك المسجّلة عبر الزمن.',
      lhEvolutionEmptyText: 'لا توجد بيانات كافية بعد لعرض تطوّر اختبار LH.',
      lhEvolutionInfo_one: 'ارتفاع العمود = عدد اختبارات LH الإيجابية المسجّلة هذا الشهر، من أصل اختبار واحد إجمالًا خلال {{period}}.',
      lhEvolutionInfo_other: 'ارتفاع العمود = عدد اختبارات LH الإيجابية المسجّلة هذا الشهر، من أصل {{count}} اختبار إجمالًا خلال {{period}}.',
      lhEvolutionInfo_zero: 'ارتفاع العمود = عدد اختبارات LH الإيجابية المسجّلة هذا الشهر، من أصل {{count}} اختبار إجمالًا خلال {{period}}.',
      lhEvolutionInfo_two: 'ارتفاع العمود = عدد اختبارات LH الإيجابية المسجّلة هذا الشهر، من أصل اختبارين إجمالًا خلال {{period}}.',
      lhEvolutionInfo_few: 'ارتفاع العمود = عدد اختبارات LH الإيجابية المسجّلة هذا الشهر، من أصل {{count}} اختبارات إجمالًا خلال {{period}}.',
      lhEvolutionInfo_many: 'ارتفاع العمود = عدد اختبارات LH الإيجابية المسجّلة هذا الشهر، من أصل {{count}} اختبارًا إجمالًا خلال {{period}}.',
      lastObservation: 'آخر ملاحظة: {{date}} · {{label}}',
      mucusEmptyText: 'سجّلي ملاحظات مخاط عنق الرحم لرؤية توزيعها.',
      mucusEvolutionAccessibility: 'تطوّر مخاط عنق الرحم خلال {{period}}',
      mucusEvolutionTitle: 'تطوّر مخاط عنق الرحم',
      mucusEvolutionSubtitle: 'ملاحظاتك المسجّلة عبر الزمن.',
      mucusEvolutionEmptyText: 'لا توجد بيانات كافية بعد لعرض تطوّر مخاط عنق الرحم.',
      mucusEvolutionInfo: 'دليل بصري: كلما ارتفع العمود اقتربت الملاحظة من النوع «{{eggWhite}}» — من اليسار إلى اليمين: {{dry}}، {{sticky}}، {{creamy}}، {{watery}}، {{eggWhite}}.',
      disclaimer: 'هذه المتابعة مرجع شخصي. الاختبار الإيجابي ليس ضمانًا لحدوث الحمل.'
    },
    cycle: {
      averageCycleDurationLabel: 'متوسط طول الدورة',
      shortestLongest: 'الأقصر / الأطول',
      shortestLongestValue: '{{shortest}} / {{longest}} يوم',
      evolutionSubtitle: 'طول دوراتك الأخيرة',
      evolutionEmptyText: 'سجّلي بداية حيضك لرؤية كيف يتطوّر طول دورتك.',
      infoText: 'قد يتغيّر طول دورتك طبيعيًا من شهر إلى آخر — تساعدك هذه المتابعة على ملاحظة أنماطك الخاصة.'
    }
  },
  conceptionOnboarding: {
    shell: {
      backAccessibility: 'العودة إلى الخطوة السابقة',
      next: 'التالي'
    },
    tryingDuration: {
      title: 'منذ متى وأنتِ تحاولين الحمل؟',
      subtitle: 'اختاري المدة التي تناسب وضعك.',
      options: {
        underThreeMonths: 'أقل من 3 أشهر',
        threeToSixMonths: 'من 3 إلى 6 أشهر',
        sixToTwelveMonths: 'من 6 إلى 12 شهرًا',
        overOneYear: 'أكثر من سنة',
        startingNow: 'أبدأ الآن فقط'
      },
      info: 'لكل رحلة خصوصيتها. AWA هنا لمرافقتك في كل خطوة.'
    },
    ovulationAwareness: {
      title: 'هل تستطيعين عادةً معرفة وقت إباضتك؟',
      subtitle: 'يساعدنا هذا على تقديم أفضل متابعة لك.',
      options: {
        often: {
          label: 'نعم، غالبًا',
          description: 'أجيد إلى حدٍّ ما ملاحظة علامات إباضتي.'
        },
        sometimes: {
          label: 'أحيانًا',
          description: 'لست متأكدة دائمًا، لكن لديّ بعض المؤشرات.'
        },
        notReally: {
          label: 'لا، ليس حقًا',
          description: 'لا أعرف كيف أتعرّف على إباضتي.'
        }
      },
      info: 'لا تقلقي إن لم تعرفي بعد. سيساعدك AWA على ملاحظة دورتك مع الوقت.'
    },
    indicators: {
      title: 'ما المؤشرات التي تودّين متابعتها؟',
      subtitle: 'اختاري ما يساعدك أكثر على فهم خصوبتك.',
      options: {
        temperature: {
          description: 'قيسي حرارتك كل صباح لمتابعة تطوّرها.'
        },
        cervicalMucus: {
          description: 'لاحظي كيف يتغيّر على مدار دورتك.'
        },
        lhTests: {
          label: 'اختبارات الإباضة (LH)',
          description: 'سجّلي اختبارات LH لمتابعة ذروة إباضتك.'
        },
        intercourse: {
          description: 'سجّلي هذه المعلومة بسرّية وكتمان.'
        }
      },
      trackAll: {
        label: 'متابعة كل المؤشرات',
        description: 'أريد متابعة كاملة ومفصّلة.'
      },
      info: 'تبقى المعلومات المتعلقة بحياتك الحميمة خاصة، ويمكن حمايتها بإعدادات الخصوصية.'
    },
    reminders: {
      title: 'تذكيرات مخصّصة',
      subtitle: 'اختاري فقط التذكيرات المفيدة لك فعلًا.',
      options: {
        fertileWindow: {
          description: 'ينبّهك عند اقتراب فترة خصوبتك أو بدئها.',
          detail: 'ستصلك رسالة تذكير مع اقتراب فترة خصوبتك.'
        },
        estimatedOvulation: {
          description: 'ينبّهك في حدود اليوم المقدَّر لإباضتك.',
          detail: 'تذكير بسيط في حدود يوم إباضتك المقدَّر.'
        },
        dailyJournal: {
          description: 'تذكير يومي واحد لإكمال متابعتك.',
          detail: 'درجة حرارة الجسم القاعدية، مخاط عنق الرحم، اختبار LH، العلاقات وملاحظات أخرى.'
        },
        temperature: {
          description: 'تذكير كل صباح لقياس حرارتك.',
          detail: 'مثالي كي لا تنسي القياس عند الاستيقاظ، قبل مغادرة السرير.'
        },
        lhTest: {
          description: 'تذكير خلال فترة خصوبتك لإجراء اختبار الإباضة.',
          detail: 'تذكير بإجراء اختبار LH في الوقت المناسب.'
        }
      },
      journalIncludedText: 'يمكن أن تجمع يومياتك درجة حرارة الجسم القاعدية ومخاط عنق الرحم واختبارات LH والعلاقات وسائر ملاحظاتك.',
      privacyTitle: 'تذكيرات متحفّظة',
      privacyText: 'يمكن إبقاء المحتوى الحساس مخفيًا وفق إعدادات الخصوصية.',
      settingsNotice: 'يمكنك تغيير هذه التفضيلات في أي وقت من الإعدادات.',
      editSubtitle: 'اختاري التذكيرات التي ترافقك في رحلة الحمل.',
      saving: 'جارٍ الحفظ…'
    }
  },
  conceptionJournalConfig: {
    temperature: {
      label: 'درجة حرارة الجسم\nالقاعدية',
      subtitle: 'سجّلي حرارتك الصباحية'
    },
    cervicalMucus: {
      label: 'مخاط\nعنق الرحم',
      subtitle: 'لاحظي تطوّره ودوّنيه'
    },
    lhTest: {
      label: 'اختبار LH',
      subtitle: 'نتيجة اختبار الإباضة'
    },
    intimacy: {
      label: 'العلاقات',
      subtitle: 'العلاقات والحماية وشعورك'
    }
  },
  contraceptionLabels: {
    method: {
      pill: 'حبوب منع الحمل',
      ring: 'الحلقة المهبلية',
      patch: 'لصقة منع الحمل',
      other: 'علاج هرموني آخر'
    },
    reminderContent: {
      pill: {
        subtitle: 'اختاري هل تريدين تلقي تذكيرات بتناول حبوبك.',
        cardTitle: 'تذكيرات تناول\nالحبوب اليومي',
        cardDescription: 'احصلي على إشعار كل يوم كي لا تنسي حبوبك.'
      },
      ring: {
        subtitle: 'اختاري هل تريدين تلقي تذكيرات بشأن حلقتك المهبلية.',
        cardTitle: 'تذكيرات\nحلقتك المهبلية',
        cardDescription: 'فعّلي التذكيرات المتعلقة باستخدام حلقتك.'
      },
      patch: {
        subtitle: 'اختاري هل تريدين تلقي تذكيرات بشأن لصقة منع الحمل.',
        cardTitle: 'تذكيرات\nلصقة منع الحمل',
        cardDescription: 'فعّلي التذكيرات المتعلقة بتغيير لصقتك.'
      },
      other: {
        subtitle: 'اختاري هل تريدين تلقي تذكيرات بشأن علاجك.',
        cardTitle: 'تذكيرات\nعلاجك',
        cardDescription: 'فعّلي التذكيرات المتعلقة بعلاجك الهرموني.'
      },
      default: {
        subtitle: 'اختاري هل تريدين تلقي تذكيرات بشأن وسيلة منع الحمل.',
        cardTitle: 'تذكيرات\nوسيلتك',
        cardDescription: 'فعّلي التذكيرات المتعلقة بوسيلة منع الحمل.'
      }
    },
    intakeActionLabel: {
      pill: 'جرعة اليوم',
      ring: 'استخدام الحلقة',
      patch: 'استخدام اللصقة',
      other: 'استخدام العلاج'
    },
    defaultIntakeActionLabel: 'جرعة / استخدام اليوم',
    intakeStatusLabels: {
      taken: 'تم تناولها',
      missed: 'فائتة',
      late: 'متأخرة'
    },
    heroActionLabels: {
      pill: {
        taken: 'تم التناول',
        late: 'متأخرة',
        missed: 'نسيتها'
      }
    },
    eventLabels: {
      ring_insertion: 'تم إدخال الحلقة',
      ring_removal: 'تم إخراج الحلقة',
      ring_replacement: 'تم استبدال الحلقة',
      patch_application: 'تم وضع اللصقة',
      patch_removal: 'تم نزع اللصقة',
      patch_replacement: 'تم استبدال اللصقة'
    },
    eventSummary: {
      empty: 'لم يُسجَّل بعد',
      count_one: 'حدث واحد مسجّل',
      count_other: '{{count}} حدث مسجّل',
      count_zero: '{{count}} أحداث مسجّلة',
      count_two: 'حدثان ({{count}}) مسجّلان',
      count_few: '{{count}} أحداث مسجّلة',
      count_many: '{{count}} حدثًا مسجّلًا'
    }
  },
  contraceptionJournalConfig: {
    intake: {
      journalSubtitle: 'سجّلي متابعة اليوم'
    },
    feelings: {
      label: 'كيف تشعرين',
      journalSubtitle: 'دوّني ما شعرتِ به اليوم'
    },
    notes: {
      label: 'ملاحظات اليوم',
      journalSubtitle: 'أضيفي ملاحظة شخصية'
    }
  },
  contraceptionDashboard: {
    headerSubtitle: 'متابعتك، بكل خصوصية.',
    todayBadge: 'اليوم',
    ring: {
      dayCaption: 'اليوم',
      dayDetail: 'من {{total}}',
      packAccessibility: 'اليوم {{day}} من {{total}}، الشريط قيد الاستخدام',
      trackingAccessibility: '{{status}}، المتابعة جارية',
      breakFootnote: 'فترة الانقطاع',
      packFootnote: 'الشريط قيد الاستخدام',
      trackingFootnote: 'المتابعة جارية'
    },
    reminders: {
      enabled: 'التذكيرات مفعّلة',
      unavailable: 'التذكيرات غير متاحة',
      disabled: 'التذكيرات متوقفة'
    },
    hero: {
      title: {
        taken: 'تم تسجيل \nالحبة',
        late: 'تم تسجيل التأخر',
        missed: 'تم تسجيل جرعة منسية',
        breakDay: 'يوم انقطاع',
        toTake: 'حبة اليوم'
      },
      subtitle: {
        taken: 'تم تسجيل تناول اليوم.',
        late: 'تم تسجيل تناول اليوم المتأخر.',
        missed: 'تم تسجيل جرعة اليوم المنسية.',
        breakDay: 'فترة الانقطاع محددة في جدولك.',
        toTake: 'لا تنسي تسجيل تناولك اليوم.',
        remindersEnabled: 'تذكيراتك مفعّلة.',
        remindersUnavailable: 'التذكيرات غير متاحة بعد لهذه الوسيلة.',
        remindersDisabled: 'تذكيراتك متوقفة.'
      }
    },
    circleStatus: {
      recorded: 'مسجّل',
      todo: 'للتسجيل',
      taken: 'تم التناول',
      late: 'متأخر',
      missed: 'منسي',
      breakDay: 'انقطاع'
    },
    method: {
      eyebrow: 'وسيلتي',
      editAccessibility: 'تعديل وسيلة منع الحمل',
      editLabel: 'تعديل وسيلتي',
      packStartLabel: 'تاريخ بدء الشريط',
      trackingStartLabel: 'تاريخ بدء المتابعة',
      scheduleAccessibility: 'جدول الحبوب',
      scheduleLabel: 'جدول الحبوب',
      scheduleCyclicValue: '{{active}} يوم تناول + {{breakDays}} يوم انقطاع',
      scheduleContinuousValue: 'تناول متواصل',
      configureBadge: 'إعداد',
      scheduleCyclicSummary: '{{active}} يوم من الحبوب + {{breakDays}} يوم انقطاع',
      scheduleContinuousSummary: 'تناول متواصل دون انقطاع مجدول',
      scheduleUnknownSummary: 'جدول الحبوب غير محدد'
    },
    daily: {
      subtitle: 'يوميات منع الحمل لهذا اليوم',
      intakeState: {
        breakDay: 'يوم انقطاع',
        recorded: 'مسجّل',
        late: 'متأخر',
        missed: 'تم الإبلاغ عن جرعة منسية',
        toProvide: 'بانتظار التعبئة'
      },
      feelingsCount_one: '{{count}} عنصر',
      feelingsCount_other: '{{count}} عنصر',
      feelingsCount_zero: '{{count}} عناصر',
      feelingsCount_two: 'عنصران ({{count}})',
      feelingsCount_few: '{{count}} عناصر',
      feelingsCount_many: '{{count}} عنصرًا',
      feelingsToProvide: 'بانتظار التعبئة',
      noteAdded: 'تمت إضافة ملاحظة',
      addNote: 'إضافة ملاحظة'
    },
    history: {
      title: 'السجل',
      subtitle: 'أحدث الأحداث',
      empty: 'لا توجد أحداث مسجّلة بعد.',
      viewAll: 'عرض السجل الكامل',
      intakeTitle: 'سجل التناول',
      intakeSubtitle: 'آخر 7 أيام',
      dayStatus: {
        taken: 'تم التناول',
        late: 'متأخر',
        missed: 'منسي',
        none: '—'
      }
    },
    historyModal: {
      closeAccessibility: 'إغلاق السجل',
      eventsTitle: 'سجل الأحداث',
      eventsSubtitle: 'جميع أحداثك المسجّلة',
      intakeTitle: 'سجل التناول',
      intakeSubtitle: 'جميع مرات تناولك المسجّلة',
      closeAccessibilityShort: 'إغلاق',
      emptyTitle: 'لا يوجد سجل بعد',
      emptyEventsText: 'ستظهر أحداثك هنا بعد تسجيلها.',
      emptyIntakeText: 'ستظهر مرات تناولك وجرعاتك المنسية هنا بعد تسجيلها.',
      deleteHint: 'يفتح خيارات الحذف',
      editDeleteHint: 'يفتح خيارات التعديل والحذف',
      premiumHint: 'مع بريميوم، اطّلعي على سجلك الكامل دون حد 30 يومًا.',
      premiumUnlockAccessibility: 'فتح السجل الكامل مع بريميوم'
    },
    recordStatus: {
      taken: 'تم التناول',
      late: 'تم تسجيل التأخر',
      missed: 'تم تسجيل جرعة منسية'
    },
    deleteRecordConfirm: {
      title: 'حذف هذا التسجيل؟',
      message: '{{date}} — لا يمكن التراجع عن هذا الإجراء.'
    },
    deleteEventConfirm: {
      title: 'حذف هذا الحدث؟',
      message: '{{label}} — {{date}} — لا يمكن التراجع عن هذا الإجراء.'
    },
    deleteButton: 'حذف',
    recordAction: {
      subtitle: 'عدّلي هذا التسجيل أو احذفيه',
      deleteLabel: 'حذف هذا التسجيل'
    }
  },
  contraceptionCalendar: {
    title: 'التقويم',
    subtitle: 'تابعي منع الحمل يومًا بيوم',
    filtersLabel: 'المرشحات',
    legendLabel: 'دليل الرموز',
    prevMonthAccessibility: 'الشهر السابق',
    nextMonthAccessibility: 'الشهر التالي',
    legend: {
      taken: 'تم التناول',
      late: 'متأخر',
      missed: 'منسي',
      notRecorded: 'غير مسجّل',
      today: 'اليوم',
      ramadan: 'رمضان',
      dhoulHijja: 'ذو الحجة'
    },
    dayAccessibility: {
      taken: '، تم التناول',
      late: '، متأخر',
      missed: '، منسي',
      ramadan: '، رمضان',
      dhoulHijja: '، ذو الحجة'
    },
    selected: {
      method: 'الوسيلة',
      packBadge: 'اليوم {{day}}/{{total}}',
      noEvent: 'لا يوجد حدث مسجّل',
      recordedAt: 'سُجّل في {{time}}',
      recorded: 'مسجّل',
      takenAt: 'تم التناول في {{time}}',
      taken: 'تم التناول',
      late: 'متأخر',
      missed: 'منسي',
      notRecorded: 'غير مسجّل',
      breakDay: 'يوم انقطاع',
      feelingsLabel: 'كيف شعرتِ',
      feelingsCount_one: '{{count}} عنصر',
      feelingsCount_other: '{{count}} عنصر',
      feelingsCount_zero: '{{count}} عناصر',
      feelingsCount_two: 'عنصران ({{count}})',
      feelingsCount_few: '{{count}} عناصر',
      feelingsCount_many: '{{count}} عنصرًا',
      notProvided: 'غير محدد',
      remindersLabel: 'التذكيرات',
      remindersEnabled: 'مفعّلة',
      remindersUnavailable: 'غير متاحة',
      remindersDisabled: 'متوقفة',
      editAccessibility: 'تعديل متابعة اليوم',
      edit: 'تعديل',
      editFeelingsAccessibility: 'تعديل مشاعر هذا اليوم',
      fillFeelingsAccessibility: 'تعبئة مشاعر هذا اليوم',
      editFeelings: 'تعديل مشاعر هذا اليوم',
      fillFeelings: 'تعبئة مشاعر هذا اليوم'
    },
    summary: {
      title: 'ملخص هذا الشهر',
      emptyEvents: 'لا توجد أحداث مسجّلة هذا الشهر.',
      taken: 'تم التناول',
      late: 'متأخر',
      missed: 'منسي',
      notRecorded: 'غير مسجّل',
      regularity: 'الانتظام',
      disclaimer: 'بناءً على تسجيلاتك الخاصة.'
    },
    sheet: {
      filtersTitle: 'المرشحات',
      filtersSubtitle: 'اختاري العلامات التي تريدين عرضها في تقويمك.',
      trackingGroupTitle: 'متابعة منع الحمل',
      spiritualGroupTitle: 'العلامات الروحية',
      done: 'تم',
      legendTitle: 'دليل الرموز',
      legendSubtitle: 'افهمي علامات تقويمك.',
      close: 'إغلاق',
      todayTitle: 'اليوم',
      todayDescription: 'الإطار البنفسجي المتقطع يحدد تاريخ اليوم.',
      ramadanDescription: 'هذا اليوم يقع ضمن شهر رمضان.',
      dhoulHijjaDescription: 'هذا اليوم يقع ضمن شهر ذي الحجة.'
    },
    filterRows: {
      takenTitle: 'تم تناول الحبة',
      takenDescription: 'عرض الأيام التي سُجّل فيها تناولك',
      lateTitle: 'متأخر',
      lateDescription: 'عرض الأيام التي أُبلغ فيها عن تناول متأخر',
      missedTitle: 'منسي',
      missedDescription: 'عرض الأيام التي أُبلغ فيها عن جرعة منسية',
      ramadanTitle: 'رمضان',
      ramadanDescription: 'عرض علامة شهر رمضان',
      dhoulHijjaTitle: 'ذو الحجة',
      dhoulHijjaDescription: 'عرض علامة شهر ذي الحجة',
      eventDescription: 'عرض الأيام التي سُجّل فيها «{{label}}»'
    },
    legendRows: {
      takenTitle: 'تم تناول الحبة',
      takenDescription: 'سُجّل تناول في ذلك اليوم.',
      lateTitle: 'متأخر',
      lateDescription: 'أُبلغ عن تناول متأخر في ذلك اليوم.',
      missedTitle: 'منسي',
      missedDescription: 'أُبلغ عن جرعة منسية في ذلك اليوم.',
      eventDescription: 'سُجّل «{{label}}» في ذلك اليوم.'
    }
  },
  contraceptionStatistics: {
    header: {
      title: 'الإحصاءات',
      subtitle: 'اطّلعي على عاداتك في المتابعة عبر الوقت.'
    },
    periods: {
      oneMonth: 'شهر واحد',
      threeMonths: '3 أشهر',
      sixMonths: '6 أشهر',
      twelveMonths: '12 شهرًا'
    },
    empty: {
      title: 'ستظهر إحصاءاتك هنا',
      text: 'سجّلي مرات تناولك وجرعاتك المنسية لبضعة أيام لتكتشفي اتجاهاتك.'
    },
    hero: {
      eyebrow: 'متابعتك',
      regularityLabel: 'الانتظام',
      neutral: 'لا توجد بيانات كافية بعد',
      disclaimer: 'بناءً على تسجيلاتك الخاصة.',
      takenCount_one: 'تناول واحد مسجّل',
      takenCount_other: '{{count}} تناول مسجّل',
      takenCount_zero: '{{count}} مرات تناول',
      takenCount_two: 'مرتا تناول ({{count}})',
      takenCount_few: '{{count}} مرات تناول',
      takenCount_many: '{{count}} مرة تناول',
      lateCount_one: '{{count}} متأخر',
      lateCount_other: '{{count}} متأخر',
      lateCount_zero: '{{count}} متأخر',
      lateCount_two: '{{count}} متأخران',
      lateCount_few: '{{count}} متأخرة',
      lateCount_many: '{{count}} متأخرًا',
      missedCount_one: '{{count}} منسي',
      missedCount_other: '{{count}} منسي',
      missedCount_zero: '{{count}} منسي',
      missedCount_two: '{{count}} منسيان',
      missedCount_few: '{{count}} منسية',
      missedCount_many: '{{count}} منسيًّا'
    },
    noDataInPeriod: 'لا توجد بيانات مسجّلة لهذه الفترة. جرّبي فترة أطول.',
    distribution: {
      title: 'التوزيع',
      takenLabel: 'مرات التناول',
      lateLabel: 'متأخر',
      missedLabel: 'منسي'
    },
    evolution: {
      title: 'التطور',
      byWeek: 'حسب الأسبوع',
      byMonth: 'حسب الشهر',
      takenLegend: 'تم التناول',
      lateLegend: 'متأخر',
      missedLegend: 'منسي'
    },
    streak: {
      label: 'أفضل سلسلة',
      value_one: 'يوم واحد متتالٍ',
      value_other: '{{count}} يوم متتالية',
      value_zero: '{{count}} أيام متتالية',
      value_two: 'يومان متتاليان ({{count}})',
      value_few: '{{count}} أيام متتالية',
      value_many: '{{count}} يومًا متتاليًا'
    },
    tracking: {
      title: 'المتابعة',
      durationLabel: 'مدة المتابعة',
      durationValue_one: 'يوم واحد',
      durationValue_other: '{{count}} يوم',
      durationValue_zero: '{{count}} أيام',
      durationValue_two: 'يومان ({{count}})',
      durationValue_few: '{{count}} أيام',
      durationValue_many: '{{count}} يومًا',
      durationNotProvided: 'غير محدد'
    },
    events: {
      title: 'الأحداث المسجّلة',
      emptyTitle: 'لا توجد أحداث مسجّلة',
      emptyText: 'سجّلي أحداثك ({{types}}) لتكتشفي إحصاءاتك هنا.'
    },
    noMethod: {
      title: 'المتابعة التفصيلية قريبًا',
      text: 'ستتوفر المتابعة التفصيلية بعد اختيارك لوسيلة منع الحمل.'
    },
    method: {
      title: 'وسيلتي',
      sinceLabel: 'منذ {{date}}',
      startNotProvided: 'تاريخ البدء غير محدد',
      remindersLabel: 'التذكيرات',
      remindersEnabled: 'مفعّلة',
      remindersUnavailable: 'غير متاحة',
      remindersDisabled: 'متوقفة'
    }
  },
  contraceptionJournalEntry: {
    todayEyebrow: 'متابعة اليوم',
    private: 'خاص',
    today: {
      title: 'اليوم',
      subtitle: 'اختاري ما يناسب يومك أكثر'
    },
    todayLabel: 'اليوم  •  {{date}}',
    intake: {
      statusSubtitle: 'سجّلي متابعة اليوم',
      takenSubtitle: 'سجّلي هذا الاستخدام على أنه تم اليوم',
      lateSubtitle: 'دوّني تناولًا متأخرًا',
      missedSubtitle: 'أبلغي ببساطة عن جرعة منسية لهذا اليوم',
      infoTitle: 'متابعتك',
      infoText: 'تساعدك هذه المتابعة على الاحتفاظ بسجل واضح، يومًا بعد يوم.'
    },
    event: {
      optionSubtitle: 'أضيفي هذا الحدث إلى متابعة اليوم',
      alreadyRecorded: 'سُجّل اليوم بالفعل: {{list}}'
    },
    feelings: {
      heroTitle: 'كيف تشعرين؟',
      heroSubtitle: 'اختاري ما شعرتِ به {{dayWord}} — يبقى هذا سجلًّا شخصيًا، وليس تشخيصًا أبدًا.',
      sectionTitle: 'كيف شعرتِ',
      sectionSubtitle: 'يمكنك اختيار أكثر من عنصر',
      selectedCount_one: 'تم اختيار عنصر واحد',
      selectedCount_other: 'تم اختيار {{count}} عنصر',
      selectedCount_zero: 'تم اختيار {{count}} عناصر',
      selectedCount_two: 'تم اختيار عنصرين ({{count}})',
      selectedCount_few: 'تم اختيار {{count}} عناصر',
      selectedCount_many: 'تم اختيار {{count}} عنصرًا',
      infoTitle: 'متابعة شخصية',
      infoText: 'هذه المتابعة لكِ — ولا تتضمن أي تفسير طبي.',
      dayWordToday: 'اليوم',
      dayWordPast: 'في ذلك اليوم'
    },
    notes: {
      heroTitle: 'مساحتك الشخصية',
      heroSubtitle: 'مكان خاص لما تريدين الاحتفاظ به.',
      sectionTitle: 'ما أودّ تدوينه',
      sectionSubtitle: 'اكتبي بحرية، وبالوتيرة التي تناسبك',
      placeholder: 'أضيفي ملاحظة شخصية عن يومك…'
    },
    breakDay: {
      title: 'يوم انقطاع',
      infoText: 'لا يُنتظر تناول اليوم وفق جدولك. يمكنك مع ذلك تدوين ما شعرتِ به أو إضافة ملاحظة.',
      alreadyRecordedTitle: 'مسجّل',
      alreadyRecorded: 'سُجّلت حالة لهذا اليوم بالفعل: {{status}}.'
    },
    errors: {
      chooseBeforeSaving: 'اختاري إجابة قبل الحفظ.',
      futureDate: 'لا يمكنك تسجيل متابعة لتاريخ مستقبلي.',
      chooseAtLeastOne: 'اختاري عنصرًا واحدًا على الأقل قبل الحفظ.',
      addNoteBeforeSaving: 'أضيفي ملاحظة قبل الحفظ.'
    }
  },
  contraceptionMethod: {
    title: 'ما وسيلة منع الحمل التي تستخدمينها؟',
    subtitle: 'اختاري الوسيلة التي تناسب متابعتك الحالية أكثر.',
    options: {
      pillDescription: 'متابعة التناول اليومي',
      ringDescription: 'تذكيرات الإدخال والإزالة',
      patchDescription: 'تغيير اللصقة',
      otherDescription: 'وسيلة هرمونية أخرى'
    }
  },
  contraceptionInformation: {
    title: 'بعض التفاصيل\nعن وسيلة منع الحمل',
    subtitle: 'تبقى إجاباتك خاصة وتساعدنا على تخصيص متابعتك.',
    startDateQuestions: {
      pill: 'منذ متى تتناولين الحبوب؟',
      ring: 'منذ متى تستخدمين الحلقة المهبلية؟',
      patch: 'منذ متى تستخدمين لصقة منع الحمل؟',
      other: 'منذ متى تتبعين هذا العلاج؟',
      default: 'منذ متى تستخدمين هذه الوسيلة؟'
    },
    datePlaceholder: 'اختاري تاريخًا',
    dateNotProvidedAccessibility: 'غير محدد',
    treatmentBreakQuestion: 'هل لديك فترة انقطاع أو\nتوقف في علاجك؟'
  },
  pillSchedule: {
    title: 'جدول حبوبك',
    subtitle: 'خصّصي متابعتك لتناسب علاجك.',
    activeDays: {
      title: 'أيام التناول',
      subtitle: 'عدد الأيام التي تتناولين فيها الحبوب'
    },
    breakDays: {
      title: 'أيام الانقطاع',
      subtitle: 'عدد أيام الانقطاع',
      footnote: 'فترة الانقطاع محددة في جدولك.'
    },
    decreaseAccessibility: 'إنقاص يوم واحد',
    increaseAccessibility: 'زيادة يوم واحد',
    summary: {
      title: 'جدولك',
      intakeLabel: 'التناول',
      breakLabel: 'الانقطاع',
      totalLabel: 'الدورة الكاملة',
      daysValue: '{{count}} يوم'
    },
    unknown: {
      accessibility: 'لا أعرف جدولي بعد',
      text: 'لا أعرف جدولي بعد',
      subtext: 'يمكنك تعبئته لاحقًا.'
    },
    continuous: {
      title: 'تناول متواصل',
      subtitle: 'تتناولين الحبوب دون فترة انقطاع، بناءً على إجابتك السابقة.',
      footnote: 'يتابع AWA تناولك دون عدّ تنازلي للشريط، إذ لا توجد مدة دورة ثابتة لهذا الجدول.'
    }
  },
  contraceptionReminders: {
    title: 'تذكيراتك',
    toggleLabel: 'تفعيل التذكيرات',
    timeLabel: 'وقت التذكير',
    chooseTime: 'اختاري وقتًا',
    timeAccessibility: {
      withValue: 'وقت التذكير، {{time}}',
      empty: 'اختاري وقت التذكير'
    },
    errorChooseTime: 'اختاري وقتًا لتفعيل التذكيرات.',
    unavailableInfo: 'التذكيرات المجدولة غير متاحة بعد لهذه الوسيلة. يمكنك تسجيل استخدامك مباشرة من لوحة المتابعة.',
    settingsInfo: 'يمكنك تغيير هذا الإعداد في أي وقت من الإعدادات.',
    finish: 'إنهاء'
  },
  irregularJournalConfig: {
    acne: {
      label: 'حب الشباب',
      dashboardSubtitle: 'بشرتك اليوم',
      journalSubtitle: 'دوّني حالة بشرتك اليوم.'
    },
    hairGrowth: {
      label: 'نمو الشعر',
      dashboardSubtitle: 'تابعي تغيّرات نمو الشعر',
      journalSubtitle: 'تابعي تغيّرات نمو الشعر.'
    },
    weight: {
      label: 'الوزن',
      dashboardSubtitle: 'سجّلي تغيّر وزنك',
      journalSubtitle: 'سجّلي تغيّر وزنك.'
    },
    pain: {
      label: 'الألم',
      dashboardSubtitle: 'الألم أو الانزعاج الذي شعرتِ به',
      journalSubtitle: 'الألم أو الانزعاج الذي شعرتِ به اليوم.'
    },
    mood: {
      label: 'المزاج',
      dashboardSubtitle: 'كيف تشعرين اليوم؟',
      journalSubtitle: 'كيف تشعرين اليوم؟'
    },
    fatigue: {
      label: 'الإرهاق والأعراض',
      dashboardSubtitle: 'الإرهاق والأعراض المرتبطة به',
      journalSubtitle: 'الإرهاق والأعراض المرتبطة به اليوم.'
    }
  },
  irregularJournalOverview: {
    title: 'اليوميات',
    calendarAccessibility: 'عرض التقويم',
    progressTitle: 'متابعتك اليومية',
    progressDescription: 'كل تفصيل صغير مهم. خذي لحظة لمتابعتك.',
    completedLabel: 'مكتمل',
    periodLabel: 'الحيض',
    periodPlaceholder: 'سجّلي بداية حيضك',
    periodSpotting: 'نزف خفيف',
    periodYes: 'نعم',
    flow: {
      light: 'خفيف',
      moderate: 'متوسط',
      heavy: 'غزير',
      veryHeavy: 'غزير جدًا',
      none: 'لا حيض'
    },
    rowDoneAccessibility: '{{label}}، تم التسجيل'
  },
  irregularOnboarding: {
    shell: {
      backAccessibility: 'العودة إلى الخطوة السابقة',
      next: 'التالي'
    },
    cyclePattern: {
      title: 'كيف تكون دوراتك عادةً؟',
      subtitle: 'يساعدنا هذا على تكييف متابعتك — وليس لإطلاق أي تشخيص أبدًا.',
      options: {
        regular: {
          label: 'منتظمة نوعًا ما',
          description: 'تعود دوراتي بتواتر متقارب تقريبًا.'
        },
        irregular: {
          label: 'غير منتظمة',
          description: 'تختلف مدة دورتي بشكل ملحوظ من شهر إلى آخر.'
        },
        veryVariable: {
          label: 'شديدة التفاوت',
          description: 'قد تكون دوراتي قصيرة جدًا أو طويلة جدًا، دون نمط واضح.'
        },
        unknown: {
          label: 'لا أعرف بعد',
          description: 'أفضّل الملاحظة مع AWA قبل أن أقرر.'
        }
      },
      info: 'كل دورة مختلفة. AWA هنا ليساعدك على فهم دورتك بشكل أفضل، وبالوتيرة التي تناسبك.'
    },
    lastPeriod: {
      title: 'متى بدأ آخر حيض لديك؟',
      subtitle: 'تبقى هذه المعلومة إرشادية — ولا تحدد أبدًا وجود تأخر.',
      dateSelectedAccessibility: 'التاريخ المختار: {{date}}',
      dateFieldLabel: 'اختاري تاريخًا',
      datePlaceholder: 'DD / MM / YYYY',
      skipLabel: 'لا أعرف / أفضّل إدخاله لاحقًا',
      skipDescription: 'أفضّل إدخال هذه المعلومة لاحقًا، من اليوميات.',
      info: 'لا بأس إن كنتِ لا تعرفين بعد. يمكنك إضافتها في أي وقت لاحقًا.',
      pickerTitle: 'آخر حيض',
      pickerSubtitle: 'اختاري اليوم الأول من آخر حيض لديك.'
    },
    trackedItems: {
      title: 'ماذا تودّين أن تتابعي؟',
      subtitle: 'اختاري ما يهمك. يمكنك تغييره في أي وقت.',
      options: {
        acne: 'حب الشباب',
        hairGrowth: 'نمو الشعر',
        weight: 'الوزن',
        pain: 'الألم',
        mood: 'المزاج',
        fatigue: 'الإرهاق',
        otherSymptoms: {
          label: 'أعراض أخرى',
          description: 'الغثيان، ألم الثديين، الانتفاخ، إلخ.'
        }
      },
      info: 'ستجدين دائمًا يومياتك الكاملة، مهما كان اختيارك هنا.'
    },
    reminders: {
      title: 'ما التذكيرات التي تودّين تلقيها؟',
      subtitleOnboarding: 'اختاري فقط التذكيرات المفيدة لكِ حقًا. يمكنك تغييرها في أي وقت من ملفك الشخصي.',
      subtitleEdit: 'اختاري التذكيرات التي تدعمك في متابعتك.',
      dailyJournal: {
        label: 'اليوميات',
        description: 'كيف تشعرين اليوم؟ تذكّري تحديث متابعتك.',
        timeLabel: 'وقت التذكير',
        timeSelectedAccessibility: 'وقت التذكير، {{time}}',
        chooseTimeAccessibility: 'اختاري وقت التذكير',
        choosePlaceholder: 'اختاري وقتًا'
      },
      unrecordedPeriod: {
        label: 'حيض غير مسجّل',
        description: 'لم تسجّلي حيضًا جديدًا بعد. تذكّري تحديث متابعتك إن كان قد بدأ.'
      },
      errorMissingTime: 'اختاري وقتًا لتذكير اليوميات.',
      permissionNotice: 'فعّلي الإشعارات من إعدادات هاتفك لتلقي تذكيراتك.',
      saving: 'جارٍ الحفظ…'
    }
  },
  irregularCalendar: {
    title: 'التقويم',
    subtitle: 'متابعة تكيّس المبايض عبر الوقت',
    filtersLabel: 'المرشحات',
    legendLabel: 'دليل الرموز',
    prevMonthAccessibility: 'الشهر السابق',
    nextMonthAccessibility: 'الشهر التالي',
    todayLabel: 'اليوم',
    ramadanLabel: 'رمضان',
    dhoulHijjaLabel: 'ذو الحجة',
    categories: {
      period: 'الحيض',
      acne: 'حب الشباب',
      hairGrowth: 'نمو الشعر',
      weight: 'الوزن',
      pain: 'الألم',
      mood: 'المزاج',
      fatigue: 'الإرهاق والأعراض'
    },
    flow: {
      light: 'خفيف',
      moderate: 'متوسط',
      heavy: 'غزير',
      veryHeavy: 'غزير جدًا',
      none: 'لا شيء'
    },
    dayAccessibility: {
      trackingRecorded: '، تم تسجيل المتابعة',
      categoriesCount_one: ' (فئة واحدة)',
      categoriesCount_other: ' ({{count}} فئة)',
      categoriesCount_zero: ' (0 فئة)',
      categoriesCount_two: ' (فئتان)',
      categoriesCount_few: ' ({{count}} فئات)',
      categoriesCount_many: ' ({{count}} فئة)',
      ramadan: '، رمضان',
      dhoulHijja: '، ذو الحجة'
    },
    selected: {
      yes: 'نعم',
      no: 'لا',
      spotting: 'نزف خفيف',
      fatigueWithSymptoms_one: '{{value}} · عرض واحد مرتبط',
      fatigueWithSymptoms_other: '{{value}} · {{count}} عرض مرتبط',
      fatigueWithSymptoms_zero: '{{value}} · لا أعراض مرتبطة',
      fatigueWithSymptoms_two: '{{value}} · عرضان مرتبطان',
      fatigueWithSymptoms_few: '{{value}} · {{count}} أعراض مرتبطة',
      fatigueWithSymptoms_many: '{{value}} · {{count}} عرضًا مرتبطًا',
      editPeriod: 'تعديل حيض هذا اليوم',
      fillPeriod: 'تسجيل حيض هذا اليوم',
      editToday: 'تعديل',
      editTodayAccessibility: 'تعديل متابعة اليوم'
    },
    pastCategory: {
      title: 'متابعة اليوم',
      editAccessibility: 'تعديل {{label}} لهذا اليوم',
      fillAccessibility: 'تسجيل {{label}} لهذا اليوم'
    },
    emptyState: {
      title: 'لا توجد متابعة لهذا اليوم',
      text: 'لم يُسجَّل أي شيء لهذا التاريخ بعد.'
    },
    summary: {
      title: 'ملخص هذا الشهر',
      periodDays: 'أيام الحيض',
      acneDays: 'أيام ظهور حب الشباب',
      painDays: 'أيام الألم',
      fatigueDays: 'أيام الإرهاق',
      empty: 'لا تتوفر بيانات كافية لهذا الشهر بعد.'
    },
    sheet: {
      closeAccessibility: 'إغلاق',
      filtersTitle: 'عوامل التصفية',
      filtersSubtitle: 'اختاري العلامات التي تريدين عرضها في تقويمك.',
      trackingGroupTitle: 'متابعة متلازمة تكيّس المبايض',
      spiritualGroupTitle: 'العلامات الروحية',
      done: 'تم',
      legendTitle: 'دليل الرموز',
      legendSubtitle: 'تعرّفي على معاني علامات تقويمك.',
      todayTitle: 'اليوم',
      todayDescription: 'يشير الإطار البنفسجي المتقطع إلى تاريخ اليوم.',
      ramadanTitle: 'رمضان',
      ramadanDescription: 'علامة شهر رمضان.',
      dhoulHijjaTitle: 'ذو الحجة',
      dhoulHijjaDescription: 'علامة أيام ذي الحجة.',
      closeLegendAccessibility: 'إغلاق دليل الرموز',
      close: 'إغلاق'
    },
    filterRows: {
      periodDescription: 'عرض أيام الحيض المسجّلة',
      acneDescription: 'عرض الأيام التي سُجّل فيها حب الشباب',
      hairGrowthDescription: 'عرض الأيام التي سُجّل فيها نمو الشعر',
      weightDescription: 'عرض الأيام التي سُجّل فيها الوزن',
      painDescription: 'عرض الأيام التي سُجّل فيها الألم',
      moodDescription: 'عرض الأيام التي سُجّل فيها المزاج',
      fatigueDescription: 'عرض الأيام التي سُجّل فيها الإرهاق',
      ramadanDescription: 'عرض علامة شهر رمضان',
      dhoulHijjaDescription: 'عرض علامة شهر ذي الحجة'
    },
    legendRows: {
      periodDescription: 'سُجّل يوم حيض (يوميات الحيض).',
      acneDescription: 'سُجّلت متابعة حب الشباب في ذلك اليوم.',
      hairGrowthDescription: 'سُجّلت متابعة نمو الشعر في ذلك اليوم.',
      weightDescription: 'سُجّل الوزن في ذلك اليوم.',
      painDescription: 'سُجّل ألم أو انزعاج في ذلك اليوم.',
      moodDescription: 'سُجّل المزاج لذلك التاريخ.',
      fatigueDescription: 'سُجّلت متابعة الإرهاق في ذلك اليوم.'
    }
  },
  irregularStatistics: {
    header: {
      title: 'الإحصاءات',
      subtitle: 'تعرّفي على تطوّر دورتك وملاحظاتك مع مرور الوقت'
    },
    periods: {
      oneMonth: 'شهر واحد',
      threeMonths: '3 أشهر',
      sixMonths: '6 أشهر',
      twelveMonths: '12 شهرًا'
    },
    categories: {
      acne: 'حب الشباب',
      hairGrowth: 'نمو الشعر',
      pain: 'الألم',
      mood: 'المزاج',
      fatigue: 'الإرهاق والأعراض'
    },
    common: {
      thisMonth: 'هذا الشهر',
      daysCount_one: 'يوم واحد',
      daysCount_other: '{{count}} يوم',
      daysCount_zero: '0 يوم',
      daysCount_two: 'يومان',
      daysCount_few: '{{count}} أيام',
      daysCount_many: '{{count}} يومًا',
      daysAbbrev_one: '{{count}} ي',
      daysAbbrev_other: '{{count}} ي',
      daysAbbrev_zero: '{{count}} ي',
      daysAbbrev_two: '{{count}} ي',
      daysAbbrev_few: '{{count}} ي',
      daysAbbrev_many: '{{count}} ي',
      trackedDaysLabel_one: 'يوم مسجّل',
      trackedDaysLabel_other: 'يوم مسجّل',
      trackedDaysLabel_zero: 'يوم مسجّل',
      trackedDaysLabel_two: 'يومان مسجّلان',
      trackedDaysLabel_few: 'أيام مسجّلة',
      trackedDaysLabel_many: 'يومًا مسجّلًا',
      trackedDaysCount_one: 'يوم واحد مسجّل',
      trackedDaysCount_other: '{{count}} يوم مسجّل',
      trackedDaysCount_zero: '0 يوم مسجّل',
      trackedDaysCount_two: 'يومان مسجّلان',
      trackedDaysCount_few: '{{count}} أيام مسجّلة',
      trackedDaysCount_many: '{{count}} يومًا مسجّلًا',
      cyclesCount_one: 'دورة واحدة مسجّلة',
      cyclesCount_other: '{{count}} دورة مسجّلة',
      cyclesCount_zero: '0 دورة مسجّلة',
      cyclesCount_two: 'دورتان مسجّلتان',
      cyclesCount_few: '{{count}} دورات مسجّلة',
      cyclesCount_many: '{{count}} دورة مسجّلة'
    },
    cycleOverview: {
      sectionTitle: 'نظرة عامة على الدورة',
      summaryOver: 'ملخص خلال {{months}}',
      hero: {
        eyebrow: 'طول دوراتك المرصود',
        unit: 'يوم',
        footnote: 'استنادًا إلى {{cycles}} و{{days}} خلال {{months}}. قد تختلف دوراتك — هذا المعيار يصف ما تم رصده فقط، دون أي حكم.'
      },
      empty: {
        eyebrow: 'نظرة عامة على الدورة',
        title: 'لم تُسجَّل دورات كافية بعد',
        text: 'واصلي تسجيل فترات حيضك. سيعرض AWA هنا متوسط الطول المرصود عندما تتوفر دورات كافية.',
        pill: 'سجلّك يتكوّن تدريجيًا',
        hint: 'لا تُعدّ الدورة الطويلة تأخرًا بشكل تلقائي.'
      }
    },
    symptoms: {
      title: 'الأعراض',
      subtitleLongitudinal: 'نظرة عامة خلال {{months}}',
      subtitleMonth: 'نظرتك المرئية لهذا الشهر',
      overview: '{{withSymptom}} فيها ملاحظة واحدة على الأقل (حب الشباب أو نمو الشعر أو الألم أو الإرهاق) من أصل {{tracked}}.',
      snapshot: {
        trackedLabel: 'الأيام المسجّلة',
        withObservationLabel: 'أيام فيها ملاحظات',
        coverageLabel: 'نسبة التغطية بالمتابعة'
      },
      emptyTitle: 'لا توجد ملاحظات مسجّلة هذا الشهر',
      emptyDetail: 'سجّلي متابعتك اليومية لتظهر هذه الإحصائية.'
    },
    category: {
      subtitleLongitudinal: 'التوزيع حسب الشهر خلال {{months}}',
      subtitleMonth: 'عرض هذا الشهر',
      evolutionTitle: 'التطوّر حسب الشهر',
      emptyTitle: 'لا توجد بيانات مسجّلة هذا الشهر',
      emptyDetail: 'سجّلي هذه الملاحظة في اليوميات اليومية لتظهر هذه الإحصائية.'
    },
    associated: {
      title: 'الأعراض المرتبطة',
      subtitle: 'الاختيارات الأكثر تكرارًا من يوميات الإرهاق والأعراض'
    },
    weight: {
      title: 'الوزن',
      subtitleLongitudinal: 'القياسات المسجّلة حسب الشهر خلال {{months}}',
      subtitleMonth: 'القياسات المسجّلة هذا الشهر',
      measurementsCount_one: 'قياس واحد',
      measurementsCount_other: '{{count}} قياس',
      measurementsCount_zero: '0 قياس',
      measurementsCount_two: 'قياسان',
      measurementsCount_few: '{{count}} قياسات',
      measurementsCount_many: '{{count}} قياسًا',
      recordedLabel_one: 'قياس مسجّل',
      recordedLabel_other: 'قياس مسجّل',
      recordedLabel_zero: 'قياس مسجّل',
      recordedLabel_two: 'قياسان مسجّلان',
      recordedLabel_few: 'قياسات مسجّلة',
      recordedLabel_many: 'قياسًا مسجّلًا'
    },
    medicalHint: 'يمكن أن تساعدك هذه المعايير، المبنية على بياناتك الفعلية، في وصف سجلّك خلال موعد طبي. فهي لا تضع أي تشخيص ولا تغني عن الاستشارة الطبية.'
  },
  irregularDashboard: {
    headerSubtitle: 'متابعتك، بكل خصوصية.',
    badge: 'وضع متلازمة تكيّس المبايض',
    title: 'الدورات غير المنتظمة',
    subtitle: 'متابعة مكيّفة وفق ملفك',
    description: 'يرافقك AWA في متابعة أعراضك وفهم جسمك بشكل أفضل.',
    ring: {
      dayAccessibility: 'اليوم {{day}} من دورتك، المتابعة جارية',
      unsetAccessibility: 'الدورة لم تُحدَّد بعد، المتابعة جارية',
      dayCaption: 'اليوم',
      dayDetail: 'من دورتك',
      footnote: 'المتابعة جارية',
      statusUnset: 'الدورة لم تُحدَّد بعد'
    },
    callout: 'في وضع متلازمة تكيّس المبايض، لا تُعامل الدورة الطويلة تلقائيًا على أنها تأخر.',
    daily: {
      openAccessibility: 'فتح يوميات اليوم',
      title: 'متابعة اليوم',
      subtitle: 'دوّني ما يهمّك اليوم، بإيقاعك الخاص.',
      completedLabel: 'مكتمل',
      sectionLabel: 'متابعتي',
      period: {
        label: 'الحيض',
        subtitle: 'سجّلي بداية حيضك'
      },
      completeButton: 'إكمال يومياتي'
    }
  },
  irregularJournalEntry: {
    todayEyebrow: 'متابعة متلازمة تكيّس المبايض',
    todaySubtitle: 'المتابعة اليومية',
    optional: 'اختياري',
    areasTitle: 'المناطق المتأثرة',
    dayWord: {
      today: 'اليوم',
      past: 'في ذلك اليوم'
    },
    categories: {
      period: {
        title: 'الحيض',
        prompt: 'سجّلي تدفّق الدم وشعورك {{day}}.',
        saveLabel: 'حفظ حيضي',
        toastTitle: 'تم حفظ الحيض'
      },
      acne: {
        title: 'حب الشباب',
        prompt: 'دوّني ببساطة حالة بشرتك {{day}}.',
        saveLabel: 'حفظ متابعتي',
        toastTitle: 'تم حفظ حب الشباب'
      },
      hairGrowth: {
        title: 'نمو الشعر',
        prompt: 'دوّني أي تغيّرات تودّين متابعتها، بإيقاعك الخاص.',
        saveLabel: 'حفظ متابعتي',
        toastTitle: 'تم حفظ نمو الشعر'
      },
      weight: {
        title: 'الوزن',
        prompt: 'سجّلي قياس اليوم، دون أي حكم.',
        saveLabel: 'حفظ وزني',
        toastTitle: 'تم حفظ الوزن'
      },
      pain: {
        title: 'الألم',
        prompt: 'دوّني ما تشعرين به {{day}}.',
        saveLabel: 'حفظ ألمي',
        toastTitle: 'تم حفظ الألم'
      },
      mood: {
        title: 'المزاج',
        prompt: 'كيف تشعرين {{day}}؟',
        saveLabel: 'حفظ مزاجي',
        toastTitle: 'تم حفظ المزاج'
      },
      fatigue: {
        title: 'الإرهاق والأعراض',
        prompt: 'خذي لحظة لتطمئني على يومك.',
        saveLabel: 'حفظ متابعتي',
        toastTitle: 'تم حفظ الإرهاق والأعراض'
      }
    },
    period: {
      status: {
        yes: 'نعم',
        no: 'لا',
        spotting: 'نزف خفيف'
      },
      questionToday: 'هل لديك الحيض اليوم؟',
      questionPast: 'هل كان لديك الحيض في ذلك اليوم؟',
      flowIntensityTitle: 'شدة التدفّق',
      associatedPainTitle: 'هل هناك ألم مصاحب؟'
    },
    acne: {
      skinStateTitle: 'بشرتك {{day}}'
    },
    hairGrowth: {
      levelTitle: 'المستوى {{day}}',
      helperText: 'اختاري المناطق التي تودّين متابعتها.'
    },
    weight: {
      titleToday: 'وزنك اليوم',
      titlePast: 'وزنك في ذلك اليوم',
      placeholder: 'مثال: 64.2 كغ',
      accessibilityLabel: 'وزن اليوم',
      variationLabel: 'التغيّر منذ آخر قياس:',
      feelingTitle: 'كيف تشعرين تجاه وزنك؟'
    },
    pain: {
      whichPainTitle: 'ما الألم الذي تشعرين به؟',
      intensityTitle: 'الشدة'
    },
    mood: {
      questionToday: 'كيف تشعرين اليوم؟',
      questionPast: 'كيف كنتِ تشعرين في ذلك اليوم؟',
      kindnessTitle: 'كل شعور مشروع',
      kindnessText: 'اعتني بنفسك، بإيقاعك الخاص.'
    },
    fatigue: {
      levelTitleToday: 'مستوى إرهاقك اليوم',
      levelTitlePast: 'مستوى إرهاقك في ذلك اليوم',
      symptomsTitle: 'الأعراض المرتبطة',
      symptomsDescription: 'اختاري كل ما ينطبق عليك {{day}}.'
    },
    notes: {
      title: 'ملاحظات',
      accessibilityLabel: 'ملاحظة شخصية',
      placeholder: 'أضيفي ملاحظة…'
    },
    errors: {
      futureDate: 'لا يمكنك تسجيل متابعة لتاريخ مستقبلي.',
      periodStatusToday: 'اختاري هل لديك الحيض اليوم قبل الحفظ.',
      periodStatusPast: 'اختاري هل كان لديك الحيض في ذلك اليوم قبل الحفظ.',
      periodFlow: 'اختاري شدة التدفّق قبل الحفظ.',
      chooseAnswer: 'اختاري إجابة قبل الحفظ.'
    },
    toastMessage: 'تم تحديث متابعتك اليومية.'
  },
  menopauseLabTracking: {
    eyebrow: 'بياناتك، بإيقاعك',
    title: 'هل تودّين متابعة\nنتائج تحاليلك؟',
    subtitle: 'يمكن لـ AWA أن يساعدك على تتبّع تغيّر نتائجك مع الوقت، دون تفسيرها نيابةً عنك.',
    optionsTitle: 'ما أودّ متابعته',
    helperText: 'يمكنك تغيير هذا الاختيار لاحقًا من تفضيلاتك.',
    startButton: 'ابدئي متابعتي',
    options: {
      fsh: {
        title: 'FSH',
        subtitle: 'الهرمون المنبّه للجريب'
      },
      estradiol: {
        title: 'الإستراديول',
        subtitle: 'تتبّعي تغيّر نتائجك مع الوقت'
      },
      both: {
        title: 'كلاهما',
        subtitle: 'FSH والإستراديول'
      },
      none: {
        title: 'ليس الآن',
        subtitle: 'أفضّل أن أقرر لاحقًا'
      }
    }
  },
  menopauseReminders: {
    title: 'الانتظام في متابعتي',
    subtitle: 'فعّلي فقط التذكيرات المفيدة لك. يمكنك تغييرها لاحقًا.',
    editSubtitleWithTreatment: 'أدِيري تذكير المتابعة اليومية وتذكير علاجك.',
    editSubtitleDailyOnly: 'أدِيري تذكير المتابعة اليومية.',
    timeAccessibility: 'وقت التذكير، {{time}}',
    chooseTimeAccessibility: 'اختيار وقت التذكير',
    timeQuestionLabel: 'في أي وقت تودّين أن نذكّرك؟',
    chooseTimePlaceholder: 'اختاري وقتًا',
    timeRowLabel: 'الوقت',
    choosePlaceholderShort: 'اختاري',
    permissionNotice: 'فعّلي الإشعارات من إعدادات هاتفك لتصلك تذكيراتك.',
    infoText: 'يمكنك تغيير هذه الإعدادات في أي وقت من تفضيلاتك.',
    skip: 'ليس الآن',
    dailyTracking: {
      cardTitle: 'تذكير المتابعة اليومية',
      cardDescription: 'تذكير لطيف لإكمال متابعتك لهذا اليوم.',
      editRowTitle: 'المتابعة اليومية',
      editRowSubtitle: 'تذكير لإكمال متابعتك لهذا اليوم.',
      missingTimeError: 'اختاري وقتًا لتذكير المتابعة اليومية.'
    },
    treatment: {
      cardTitle: 'تذكير العلاج',
      cardDescription: 'إن رغبتِ، يمكن لـ AWA أن يذكّرك بعلاجك.',
      editRowSubtitle: 'تذكير كي لا تنسي علاجك.',
      missingTimeError: 'اختاري وقتًا لتذكير العلاج.'
    }
  },
  menopauseStage: {
    eyebrow: 'عافيتك في تطوّر',
    title: 'أين أنتِ\nفي هذه المرحلة؟',
    subtitle: 'اختاري ببساطة الوضع الأقرب إليك اليوم. يمكنك تغييره دائمًا لاحقًا.',
    optionsTitle: 'ما يناسبني',
    options: {
      perimenopause: {
        title: 'ما قبل انقطاع الطمث',
        subtitle: 'ألاحظ تغيّرات منذ فترة'
      },
      menopause: {
        title: 'انقطاع الطمث',
        subtitle: 'توقف حيضي'
      },
      unsure: {
        title: 'لا أعرف بعد',
        subtitle: 'أودّ ببساطة أن ألاحظ شعوري'
      }
    },
    helperText: 'لا توجد إجابة خاطئة.',
    saving: 'جارٍ الحفظ…'
  },
  menopauseSymptoms: {
    eyebrow: 'متابعة شخصية',
    title: 'ما الأعراض التي تودّين متابعتها؟',
    subtitle: 'اختاري ما ينطبق عليك اليوم. يمكنك اختيار عدة أعراض.',
    summary: {
      title: 'الأعراض المختارة',
      none: 'لا شيء حاليًا',
      selectedCount_one: 'تم اختيار عرض واحد',
      selectedCount_other: 'تم اختيار {{count}}',
      selectedCount_zero: 'تم اختيار {{count}}',
      selectedCount_two: 'تم اختيار عرضين',
      selectedCount_few: 'تم اختيار {{count}} أعراض',
      selectedCount_many: 'تم اختيار {{count}} عرضًا'
    },
    options: {
      title: 'أعراضي',
      clear: 'مسح',
      hot_flashes: {
        title: 'الهبّات الساخنة',
        subtitle: 'شعور مفاجئ بالحرارة'
      },
      night_sweats: {
        title: 'التعرّق الليلي',
        subtitle: 'التعرّق أثناء النوم'
      },
      sleep_disturbances: {
        title: 'اضطرابات النوم',
        subtitle: 'صعوبة في النوم أو في الاستمرار فيه'
      },
      fatigue: {
        title: 'الإرهاق',
        subtitle: 'طاقة أصعب في الحصول عليها'
      },
      mood_changes: {
        title: 'تقلّبات المزاج',
        subtitle: 'مشاعر أكثر تغيّرًا'
      },
      brain_fog: {
        title: 'ضبابية الذهن',
        subtitle: 'تركيز أو ذاكرة أقل حدّة'
      }
    },
    helper: 'يمكنك تغيير اختياراتك لاحقًا.',
    saving: 'جارٍ الحفظ…'
  },
  menopauseHormonalTreatment: {
    eyebrow: 'متابعتك المخصّصة',
    title: 'هل تتلقّين\nعلاجًا هرمونيًا؟',
    subtitle: 'إن رغبتِ، يمكن لـ AWA أن يدرج هذه المتابعة ضمن تجربتك ويكيّفها وفق احتياجاتك.',
    optionsTitle: 'اختياري',
    options: {
      track: {
        title: 'نعم، أودّ متابعته في AWA',
        subtitle: 'يمكنك ضبط التفاصيل لاحقًا'
      },
      no: {
        title: 'لا',
        subtitle: 'لا أتلقّى علاجًا هرمونيًا'
      },
      not_now: {
        title: 'ليس الآن',
        subtitle: 'أفضّل أن أقرر لاحقًا'
      }
    },
    helperText: 'يمكنك تغيير هذا الاختيار لاحقًا.',
    saving: 'جارٍ الحفظ…'
  },
  menopauseStatistics: {
    header: {
      title: 'الإحصاءات',
      subtitle: 'متابعة ما قبل انقطاع الطمث / انقطاع الطمث، في لمحة.'
    },
    periods: {
      oneMonth: 'شهر واحد',
      threeMonths: '3 أشهر',
      sixMonths: '6 أشهر',
      twelveMonths: '12 شهرًا'
    },
    empty: {
      title: 'لا تتوفر بيانات كافية بعد',
      text: 'أضيفي بعض التسجيلات لتظهر اتجاهاتك.'
    },
    labOnly: {
      title: 'لا توجد متابعة يومية لهذه الفترة',
      text: 'سُجّلت نتائج التحاليل فقط لهذه الفترة؛ وهي معروضة أدناه.'
    },
    overview: {
      cardTitle: 'نظرة عامة',
      daysTracked: 'الأيام المتابَعة',
      daysWithSymptoms: 'أيام فيها أعراض',
      averageSleep: 'متوسط النوم',
      treatmentTracked: 'تسجيلات العلاج'
    },
    symptoms: {
      cardTitle: 'الأعراض الأكثر تكرارًا',
      emptyTitle: 'لا شيء للعرض',
      emptyText: 'لا توجد أعراض مسجّلة لهذه الفترة.',
      dayCount_one: 'يوم واحد',
      dayCount_other: '{{count}} يوم',
      dayCount_zero: '0 يوم',
      dayCount_two: 'يومان',
      dayCount_few: '{{count}} أيام',
      dayCount_many: '{{count}} يومًا',
      progressHint: 'التكرار النسبي للفترة المختارة — أداة متابعة بسيطة، وليست مؤشرًا طبيًا.',
      evolutionAccessibility: 'اتجاهات الأعراض خلال {{period}}',
      evolutionTitle: 'اتجاهات الأعراض',
      evolutionEmpty: 'لا تتوفر بيانات كافية بعد لعرض اتجاه لهذه الفترة.',
      evolutionHint: 'ارتفاع العمود = عدد أيام ظهور هذا العرض، شهرًا بعد شهر.'
    },
    mood: {
      cardTitle: 'المزاج',
      emptyText: 'لا تتوفر بيانات كافية لهذه الفترة بعد.',
      dayCount_one: 'يوم واحد',
      dayCount_other: '{{count}} يوم',
      dayCount_zero: '0 يوم',
      dayCount_two: 'يومان',
      dayCount_few: '{{count}} أيام',
      dayCount_many: '{{count}} يومًا',
      evolutionAccessibility: 'اتجاه المزاج خلال {{period}}',
      monthlyLabel: 'الاتجاه شهرًا بعد شهر',
      monthlyEmpty: 'لا تتوفر بيانات كافية بعد لعرض اتجاه.',
      monthlySummary: '{{label}} · {{dominant}}/{{total}} ي'
    },
    sleep: {
      cardTitle: 'النوم',
      averageLabel: 'متوسط المدة المسجّلة',
      notProvided: 'غير مُدخَل',
      evolutionEmpty: 'لا تتوفر بيانات كافية بعد لعرض اتجاه النوم.',
      evolutionAccessibility: 'اتجاه النوم خلال {{period}}',
      evolutionHint: 'متوسط مدة النوم المسجّلة، شهرًا بعد شهر.'
    },
    energy: {
      cardTitle: 'الطاقة',
      emptyText: 'لا تتوفر بيانات كافية لهذه الفترة بعد.',
      dayCount_one: 'يوم واحد',
      dayCount_other: '{{count}} يوم',
      dayCount_zero: '{{count}} يوم',
      dayCount_two: 'يومان ({{count}})',
      dayCount_few: '{{count}} أيام',
      dayCount_many: '{{count}} يومًا',
      evolutionEmpty: 'لا توجد بيانات كافية بعد لعرض اتجاه الطاقة.',
      evolutionAccessibility: 'اتجاه الطاقة خلال {{period}}',
      evolutionHint: 'دليل مرئي (منخفض ← مرتفع)؛ المستوى الغالب حسب الشهر: {{summary}}.',
      trendItem: '{{month}}: {{level}}'
    },
    treatment: {
      cardTitle: 'العلاج الهرموني',
      emptyText: 'لا توجد متابعة للعلاج مسجّلة لهذه الفترة.',
      takenLabel: 'أيام تناول العلاج',
      notTakenLabel: 'أيام عدم تناول العلاج'
    },
    lab: {
      cardTitle: 'سجل نتائج التحاليل',
      periodHint: 'نتائج {{period}} · «أحدث نتيجة» = الأحدث في هذه الفترة.',
      resultCount_one: 'نتيجة واحدة',
      resultCount_other: '{{count}} نتيجة',
      resultCount_zero: '{{count}} نتيجة',
      resultCount_two: 'نتيجتان ({{count}})',
      resultCount_few: '{{count}} نتائج',
      resultCount_many: '{{count}} نتيجة',
      emptyFsh: 'لا توجد نتيجة FSH مسجّلة لـ{{period}}.',
      emptyEstradiol: 'لا توجد نتيجة إستراديول مسجّلة لـ{{period}}.',
      singleResult: 'نتيجة واحدة فقط في هذه الفترة: {{value}}{{unit}} بتاريخ {{date}}.',
      fshEvolutionAccessibility: 'اتجاه FSH خلال {{period}}',
      estradiolEvolutionAccessibility: 'اتجاه الإستراديول خلال {{period}}'
    }
  },
  menopauseJournalEntry: {
    categories: {
      symptoms: {
        description: 'اختاري الأعراض التي تشعرين بها اليوم. يمكنك اختيار أكثر من عرض.',
        saveLabel: 'حفظ المتابعة'
      },
      mood: {
        description: 'كيف تشعرين اليوم؟ اختاري المزاج الأقرب إليك.',
        saveLabel: 'حفظ المزاج'
      },
      sleep: {
        description: 'سجّلي مدة نومك وجودته الليلة الماضية.',
        saveLabel: 'حفظ نومي'
      },
      energy: {
        description: 'كيف هو مستوى طاقتك اليوم؟ اختاري ما يناسبك.',
        saveLabel: 'حفظ طاقتي'
      },
      treatment: {
        description: 'دوّني ما إذا كنتِ قد تناولتِ علاجك اليوم. هذه متابعة شخصية دون أي حكم.',
        saveLabel: 'حفظ المتابعة'
      },
      labResults: {
        description: 'أضيفي نتائج تحاليلك لمتابعة تغيّرها مع الوقت.',
        saveLabel: 'حفظ النتيجة'
      },
      notes: {
        description: 'مساحة خاصة لتدوين أفكارك ومشاعرك أو أي شيء يهمّك.',
        saveLabel: 'حفظ ملاحظتي'
      }
    },
    common: {
      back: 'رجوع',
      cancel: 'إلغاء',
      delete: 'حذف',
      clear: 'مسح',
      saving: 'جارٍ الحفظ…',
      today: 'اليوم',
      toChoose: 'للاختيار',
      optionalLabel: '(اختياري)',
      writeHerePlaceholder: 'اكتبي هنا…',
      selectedCount_one: 'تم تحديد عنصر واحد',
      selectedCount_other: 'تم تحديد {{count}} عنصر',
      selectedCount_zero: 'لم يتم تحديد أي عنصر ({{count}})',
      selectedCount_two: 'تم تحديد عنصرين ({{count}})',
      selectedCount_few: 'تم تحديد {{count}} عناصر',
      selectedCount_many: 'تم تحديد {{count}} عنصرًا',
      savedToastTitle: 'تم الحفظ',
      savedToastPast: 'متابعة يوم {{date}}'
    },
    symptoms: {
      sectionTitle: 'الأعراض التي شعرتِ بها',
      editTrackedLink: 'تعديل الأعراض المتابَعة',
      noneTrackedTitle: 'لا يوجد عرض متابَع',
      noneTrackedText: 'لم تختاري بعد أي عرض لمتابعته. اختاري ما يناسبك لتجديه هنا.',
      chooseCta: 'اختيار أعراضي',
      intensityTitle: 'الشدة العامة',
      intensitySubtitle: 'كيف تقيّمين الشدة العامة اليوم؟'
    },
    mood: {
      title: 'كيف تشعرين؟',
      kindnessTitle: 'كل المشاعر طبيعية',
      kindnessText: 'من الطبيعي تمامًا أن تمرّي بتقلبات. اعتني بنفسك وفق إيقاعك الخاص.'
    },
    sleep: {
      durationTitle: 'مدة النوم',
      decreaseAccessibility: 'تقليل مدة النوم',
      durationInputAccessibility: 'مدة النوم بالساعات',
      increaseAccessibility: 'زيادة مدة النوم',
      durationHint: 'عدد ساعات النوم تقريبًا',
      hoursAccessibility: '{{hours}} ساعة',
      presetLabel: '{{hours}} س',
      presetPlusLabel: '+{{hours}} س',
      qualityTitle: 'جودة النوم',
      qualitySubtitle: 'كيف تقيّمين جودة ليلتك؟',
      qualityDescriptions: {
        good: 'ليلة هادئة، أشعر بالراحة.',
        average: 'استيقاظ عدة مرات، راحة متوسطة.',
        poor: 'نوم خفيف أو استيقاظ متكرر.'
      }
    },
    energy: {
      titleToday: 'مستوى طاقتك اليوم',
      titlePast: 'مستوى طاقتك في ذلك اليوم',
      descriptions: {
        low: 'أشعر بإرهاق شديد وبلا طاقة.',
        medium: 'مستوى طاقتي جيد نسبيًا.',
        high: 'أشعر بحال ممتازة وبطاقة كبيرة.'
      },
      varyTitle: 'كل يوم مختلف',
      varyText: 'قد يتغيّر مستوى طاقتك بحسب نومك ومزاجك ونشاطك.'
    },
    treatment: {
      statusTitle: 'حالة اليوم',
      subtitleToday: 'هل تناولتِ علاجك الهرموني اليوم؟',
      subtitlePast: 'هل تناولتِ علاجك الهرموني في ذلك اليوم؟',
      descriptions: {
        taken: 'تناولتُ علاجي كما هو مخطّط.',
        notTakenToday: 'لم أتناول علاجي اليوم.',
        notTakenPast: 'لم أتناول علاجي في ذلك اليوم.'
      },
      notesTitle: 'ملاحظات حول العلاج',
      notesSubtitle: 'أضيفي ملاحظة إن رغبتِ في توضيح أمر ما.',
      notesAccessibility: 'ملاحظات حول العلاج',
      ownershipTitle: 'متابعتك ملك لك',
      ownershipText: 'لا يقترح AWA أبدًا جرعة أو موعدًا أو توصية. أنتِ من تتحكمين في متابعتك.'
    },
    lab: {
      editingTitle: 'تعديل نتيجة',
      editingText: 'أنتِ تعدّلين نتيجة {{type}} مسجّلة سابقًا.',
      typeStepTitle: '1. نوع التحليل',
      resultStepTitle2: '2. النتيجة',
      resultStepTitle: 'النتيجة',
      valueFieldLabel: 'القيمة',
      valueAccessibility: 'قيمة التحليل',
      valuePlaceholder: '12.6',
      unitFieldLabel: 'الوحدة',
      unitAccessibility: 'وحدة التحليل',
      infoTitle: 'معلومة',
      infoText: 'أدخلي القيمة كما هي مكتوبة تمامًا في نتيجتك.',
      sampleDateTitle: 'تاريخ أخذ العينة',
      sampleDateAccessibility: 'تاريخ أخذ العينة: {{date}}. تعديل',
      dateChosenLabel: 'التاريخ المختار',
      historyTitle: 'أحدث نتائجي',
      collapseAccessibility: 'طي قائمة النتائج',
      expandAccessibility: 'عرض كل النتائج',
      collapseLabel: 'طي',
      expandLabel: 'عرض الكل',
      editResultAccessibility: 'تعديل نتيجة {{type}} بتاريخ {{date}}',
      editLabel: 'تعديل',
      deleteResultAccessibility: 'حذف نتيجة {{type}} بتاريخ {{date}}',
      deleteLabel: 'حذف',
      cancelEdit: 'إلغاء التعديل',
      saveEditLabel: 'حفظ التغييرات'
    },
    notes: {
      privateTitle: 'ملاحظاتك خاصة',
      privateText: 'تبقى على هذا الجهاز. يتم الدخول إلى هذا القسم برمزك أو ببصمتك الحيوية إن كنتِ قد فعّلتِهما.',
      todayTitle: 'ملاحظة اليوم',
      notesAccessibility: 'ملاحظات اليوم',
      freedomTitle: 'مساحة خاصة بك',
      freedomText: 'لا توجد طريقة صحيحة أو خاطئة للكتابة. اكتبي بحرية وبإيقاعك الخاص.',
      inspirationTitle: 'تحتاجين إلى إلهام؟',
      inspirationSubtitle: 'اختاري موضوعًا للبدء إن رغبتِ.',
      inspirationChips: {
        gratitude: 'ما أنا ممتنّة له',
        day: 'يومي في بضع كلمات',
        letGo: 'ما أريد التخلّي عنه',
        joy: 'ما أسعدني',
        intentions: 'نواياي لليوم التالي',
        freeWriting: 'كتابة حرة'
      }
    },
    hero: {
      eyebrow: 'ما قبل انقطاع الطمث / انقطاع الطمث',
      pastDescription: 'متابعة يوم {{date}}. دوّني ما شعرتِ به في ذلك اليوم.'
    },
    errors: {
      futureDate: 'لا يمكنك حفظ متابعة لتاريخ مستقبلي.',
      chooseSymptomsFirst: 'اختاري أولًا الأعراض التي تودّين متابعتها.',
      selectMood: 'اختاري مزاجك.',
      invalidSleepDuration: 'أدخلي مدة نوم صحيحة، بين 0 و24 ساعة.',
      selectEnergyLevel: 'اختاري مستوى طاقتك.',
      treatmentRequiredToday: 'حدّدي ما إذا كنتِ قد تناولتِ علاجك اليوم.',
      treatmentRequiredPast: 'حدّدي ما إذا كنتِ قد تناولتِ علاجك في ذلك اليوم.',
      selectLabType: 'اختاري نوع التحليل.',
      invalidLabValue: 'أدخلي قيمة رقمية لهذه النتيجة.',
      labFutureDate: 'لا يمكن أن يكون تاريخ أخذ العينة في المستقبل.',
      labResultGone: 'هذه النتيجة لم تعد موجودة.'
    },
    alerts: {
      deleteLabTitle: 'حذف هذه النتيجة؟',
      deleteLabMessage: '{{type}}: {{value}}{{unit}} · {{date}}. هذا الإجراء نهائي.',
      clearTitle: 'مسح هذه المتابعة؟',
      clearMessagePast: 'سيتم حذف المعلومات المسجّلة ليوم {{date}}.',
      clearMessageToday: 'سيتم حذف المعلومات المسجّلة اليوم.'
    },
    actions: {
      clearThisTracking: 'مسح هذه المتابعة'
    }
  },
  menopauseJournalConfig: {
    items: {
      symptoms: {
        label: 'الأعراض',
        journalSubtitle: 'دوّني الأحاسيس والتغيّرات التي لاحظتها اليوم'
      },
      mood: {
        label: 'المزاج',
        journalSubtitle: 'خذي لحظة لتدوين شعورك'
      },
      sleep: {
        label: 'النوم',
        journalSubtitle: 'دوّني مدة نوم ليلتك وجودته'
      },
      energy: {
        label: 'الطاقة / التعب',
        journalSubtitle: 'دوّني مستوى طاقتك اليوم'
      },
      treatment: {
        label: 'العلاج الهرموني',
        journalSubtitle: 'تابعي علاجك اليوم'
      },
      labResults: {
        label: 'نتائج التحاليل',
        journalSubtitle: 'أضيفي نتيجة FSH أو الإستراديول'
      },
      notes: {
        label: 'ملاحظات اليوم',
        journalSubtitle: 'أضيفي ملاحظة شخصية إلى متابعتك'
      }
    },
    symptomOptions: {
      hot_flashes: {
        label: 'الهبّات الساخنة'
      },
      night_sweats: {
        label: 'التعرّق الليلي'
      },
      sleep_disturbances: {
        label: 'اضطرابات النوم'
      },
      fatigue: {
        label: 'التعب'
      },
      mood_changes: {
        label: 'تقلبات المزاج'
      },
      brain_fog: {
        label: 'ضبابية التفكير'
      }
    },
    intensity: {
      mild: 'خفيفة',
      moderate: 'متوسطة',
      severe: 'شديدة'
    },
    sleepQuality: {
      good: 'جيدة',
      average: 'متوسطة',
      poor: 'ضعيفة'
    },
    energy: {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'مرتفعة'
    },
    treatmentStatus: {
      taken: 'تم تناوله اليوم',
      not_taken: 'لم يُتناول اليوم'
    },
    labType: {
      fsh: 'FSH',
      estradiol: 'الإستراديول'
    },
    mood: {
      veryGood: 'جيد جدًا',
      good: 'جيد',
      neutral: 'محايد',
      stressed: 'متوتّرة',
      irritable: 'سريعة الانفعال',
      anxious: 'قلقة',
      sad: 'حزينة',
      tired: 'متعبة',
      motivated: 'متحمّسة'
    }
  },
  menopauseDashboard: {
    headerSubtitle: 'متابعتك، دائمًا بسرّية.',
    stageLabels: {
      perimenopause: 'ما قبل انقطاع الطمث',
      menopause: 'انقطاع الطمث',
      unsure: 'قيد الملاحظة'
    },
    stageDefaultBadge: 'ما قبل انقطاع الطمث / انقطاع الطمث',
    stageOptions: {
      perimenopause: {
        title: 'ما قبل انقطاع الطمث',
        subtitle: 'ألاحظ تغيّرات منذ مدة'
      },
      menopause: {
        title: 'انقطاع الطمث',
        subtitle: 'توقّف الحيض عندي'
      },
      unsure: {
        title: 'لا أعرف بعد',
        subtitle: 'وهذا طبيعي تمامًا'
      }
    },
    ring: {
      today: 'اليوم',
      complete: 'مكتمل'
    },
    hero: {
      status: {
        empty: 'اعتني بنفسك اليوم',
        complete: 'متابعتك لليوم مكتملة',
        partial: 'متابعتك تسير بإيقاعك الخاص'
      },
      supporting: {
        empty: 'لحظات قليلة تكفي للإصغاء إلى ما يقوله جسمك.',
        complete: 'كل شيء مدوّن لهذا اليوم. عودي متى شئتِ.',
        partial_one: 'تم تدوين إدخال واحد اليوم.',
        partial_other: 'تم تدوين {{count}} إدخال اليوم.',
        partial_zero: 'تم تدوين {{count}} إدخال اليوم.',
        partial_two: 'تم تدوين إدخالين اليوم ({{count}}).',
        partial_few: 'تم تدوين {{count}} إدخالات اليوم.',
        partial_many: 'تم تدوين {{count}} إدخالًا اليوم.'
      },
      todayBadge: 'اليوم',
      miniStatus: 'متابعة شخصية بلطف'
    },
    stageCard: {
      eyebrow: 'مرحلتي',
      title: 'رحلتي',
      editAccessibility: 'تعديل مرحلتي',
      editLabel: 'تعديل',
      currentAccessibility: 'المرحلة الحالية: {{stage}}',
      currentLabel: 'المرحلة الحالية',
      unknownValue: 'غير محدّدة',
      defaultHint: 'كيّفي متابعتك بحسب مرحلتك الحالية.'
    },
    daily: {
      title: 'متابعة اليوم',
      subtitle: 'متابعتك لما قبل انقطاع الطمث / انقطاع الطمث اليوم',
      toFill: 'للتعبئة',
      labels: {
        symptoms: 'الأعراض',
        mood: 'المزاج',
        sleep: 'النوم',
        energy: 'الطاقة / التعب',
        treatment: 'العلاج الهرموني',
        labResults: 'نتائج التحاليل',
        notes: 'ملاحظات اليوم'
      },
      symptomsRecorded_one: 'تم تسجيل عرض واحد',
      symptomsRecorded_other: 'تم تسجيل {{count}} عرض',
      symptomsRecorded_zero: 'تم تسجيل {{count}} عرض',
      symptomsRecorded_two: 'تم تسجيل عرضين ({{count}})',
      symptomsRecorded_few: 'تم تسجيل {{count}} أعراض',
      symptomsRecorded_many: 'تم تسجيل {{count}} عرضًا',
      labRecorded: 'تم تسجيل النتائج',
      noteAdded: 'تمت إضافة ملاحظة',
      addNote: 'إضافة ملاحظة'
    },
    stageModal: {
      title: 'مرحلتي',
      subtitle: 'اختاري الحالة الأقرب إليك اليوم.',
      closeAccessibility: 'إغلاق',
      saving: 'جارٍ الحفظ…',
      confirm: 'تأكيد'
    },
    stageToast: {
      title: 'تم تحديث المرحلة'
    }
  },
  menopauseCalendar: {
    title: 'التقويم',
    subtitle: 'متابعتك لما قبل انقطاع الطمث / انقطاع الطمث عبر الزمن',
    filtersLabel: 'عوامل التصفية',
    legendLabel: 'دليل الرموز',
    prevMonthAccessibility: 'الشهر السابق',
    nextMonthAccessibility: 'الشهر التالي',
    todayLabel: 'اليوم',
    ramadanLabel: 'رمضان',
    dhoulHijjaLabel: 'ذو الحجة',
    dayAccessibility: {
      trackingRecorded: '، تم تسجيل المتابعة',
      ramadan: '، رمضان',
      dhoulHijja: '، ذو الحجة'
    },
    categories: {
      filterDescription: {
        symptoms: 'إظهار الأيام التي دُوّن فيها عرض أو أكثر',
        mood: 'إظهار الأيام التي سُجّل فيها المزاج',
        sleep: 'إظهار الأيام التي سُجّل فيها النوم',
        energy: 'إظهار الأيام التي سُجّل فيها مستوى الطاقة',
        treatment: 'إظهار الأيام التي تمت فيها متابعة العلاج',
        labResults: 'إظهار الأيام التي فيها نتيجة تحليل',
        notes: 'إظهار الأيام التي فيها ملاحظة شخصية'
      },
      legendDescription: {
        symptoms: 'تم تسجيل عرض واحد أو أكثر.',
        mood: 'تم تسجيل مزاج لهذا التاريخ.',
        sleep: 'تم تسجيل معلومات عن النوم.',
        energy: 'تم تسجيل مستوى الطاقة.',
        treatment: 'تم تسجيل متابعة العلاج.',
        labResults: 'تم تسجيل نتيجة FSH أو الإستراديول.',
        notes: 'تم تسجيل ملاحظة شخصية في ذلك اليوم.'
      }
    },
    selected: {
      labels: {
        symptoms: 'الأعراض',
        mood: 'المزاج',
        sleep: 'النوم',
        energy: 'الطاقة / التعب',
        treatment: 'العلاج الهرموني',
        labResults: 'نتائج التحاليل',
        notes: 'ملاحظات اليوم'
      },
      symptomsRecorded_one: 'تم تسجيل واحد',
      symptomsRecorded_other: 'تم تسجيل {{count}}',
      symptomsRecorded_zero: 'تم تسجيل {{count}}',
      symptomsRecorded_two: 'تم تسجيل اثنين ({{count}})',
      symptomsRecorded_few: 'تم تسجيل {{count}}',
      symptomsRecorded_many: 'تم تسجيل {{count}}',
      notesRecorded: 'تم تسجيل ملاحظة',
      editToday: 'تعديل',
      editTodayAccessibility: 'تعديل متابعة اليوم'
    },
    pastEntry: {
      title: 'تعبئة هذا اليوم أو تعديله',
      fillAccessibility: '{{label}}: تعبئة هذا اليوم'
    },
    emptyState: {
      title: 'لا توجد متابعة لهذا اليوم',
      text: 'لم يُسجَّل أي شيء لهذا التاريخ بعد.'
    },
    summary: {
      title: 'ملخص هذا الشهر',
      daysWithSymptoms: 'أيام فيها أعراض',
      hotFlashDays: 'الهبّات الساخنة',
      nightSweatNights: 'التعرّق الليلي',
      fatigueDays: 'أيام التعب',
      empty: 'لا توجد بيانات كافية بعد لهذا الشهر.'
    },
    wellbeing: {
      legendTitle: 'العافية (في التقويم)',
      legendDescription: 'يجمع هذا الرمز المزاج والنوم والطاقة: تم تسجيل واحد منها على الأقل في ذلك اليوم.'
    },
    sheet: {
      closeAccessibility: 'إغلاق',
      filters: {
        title: 'عوامل التصفية',
        subtitle: 'اختاري الرموز التي تودّين عرضها في تقويمك.',
        trackingGroupTitle: 'متابعة ما قبل انقطاع الطمث / انقطاع الطمث',
        spiritualGroupTitle: 'الرموز الروحية',
        doneLabel: 'تم'
      },
      legend: {
        title: 'دليل الرموز',
        subtitle: 'افهمي رموز تقويمك.',
        todayDescription: 'الإطار البنفسجي المتقطع يشير إلى تاريخ اليوم.',
        ramadanDescription: 'رمز شهر رمضان.',
        dhoulHijjaDescription: 'رمز أيام ذي الحجة.',
        closeAccessibility: 'إغلاق دليل الرموز',
        closeLabel: 'إغلاق'
      },
      spiritualFilter: {
        ramadanDescription: 'إظهار رمز شهر رمضان',
        dhoulHijjaDescription: 'إظهار رمز أيام ذي الحجة'
      }
    }
  },
  pregnancyDatingSetup: {
    eyebrow: 'حملي',
    title: 'إعداد حملي',
    subtitle: 'اختاري الطريقة الأنسب لك لتقدير بداية حملك.',
    options: {
      lastPeriod: {
        label: 'أول يوم من آخر حيض',
        description: 'يُستخدم لتقدير تاريخ ولادتك المتوقع.',
        dateFieldLabel: 'تاريخ بداية آخر حيض لديك'
      },
      dueDate: {
        label: 'تاريخ الولادة المتوقع',
        description: 'يُستخدم لتقدير أسبوع حملك.',
        dateFieldLabel: 'تاريخ الولادة المتوقع'
      },
      conceptionDate: {
        label: 'تاريخ الحمل التقديري',
        description: 'يُستخدم لتقدير تاريخ ولادتك المتوقع.',
        dateFieldLabel: 'تاريخ الحمل التقديري'
      },
      later: {
        label: 'سأملأ هذا لاحقًا',
        description: 'ستتمكنين من إكمال هذه المعلومة لاحقًا.'
      }
    },
    dateNotSet: 'غير محدّد',
    chooseADate: 'اختاري تاريخًا',
    dateFieldAccessibility: '{{label}}، {{value}}',
    next: 'التالي'
  },
  pregnancyTrackingPreferences: {
    title: 'ماذا تودّين\nمتابعته خلال\nحملك؟',
    subtitle: 'اختاري ما تودّين\nمتابعته يوميًا.',
    options: {
      symptoms: 'الأعراض التي أشعر بها',
      weight: 'الوزن',
      mood: 'المزاج',
      sleep: 'النوم',
      medicalInfo: 'معلوماتي الطبية الشخصية'
    },
    next: 'التالي'
  },
  pregnancyWeight: {
    scaleAccessibility: 'ميزان الحمّام',
    header: {
      title: 'الوزن',
      subtitle: 'اليوم • {{date}}'
    },
    todayMeasurementBadge: 'قياس اليوم',
    empty: {
      title: 'لا يوجد قياس مسجّل',
      text: 'أضيفي وزنك لمتابعة\nتغيّره مع الوقت.'
    },
    recorded: {
      label: 'الوزن المسجّل',
      today: 'اليوم'
    },
    evolution: {
      title: 'التغيّر',
      sinceLastMeasurement: 'منذ آخر قياس لك'
    },
    clearToday: 'مسح قياس اليوم',
    cta: {
      edit: 'تعديل',
      add: 'إضافة وزني',
      editAccessibility: 'تعديل وزني',
      addAccessibility: 'إضافة وزني'
    },
    sheet: {
      editTitle: 'تعديل وزنك',
      addTitle: 'إضافة وزنك',
      subtitle: 'أدخلي قياس اليوم مباشرة',
      inputLabel: 'الوزن الحالي',
      inputAccessibility: 'الوزن بالكيلوغرام',
      placeholder: 'مثال: 64.5',
      supportText: 'أدخلي قيمة بين 30 و300 كغ.',
      previousValueLabel: 'القيمة المسجّلة اليوم',
      saveAccessibility: 'حفظ الوزن',
      save: 'حفظ هذا الوزن'
    },
    errors: {
      invalidWeight: 'أدخلي وزنًا صحيحًا بالكيلوغرام.'
    },
    saveToast: {
      savedTitle: 'تم حفظ الوزن',
      savedMessage: 'تم تحديث متابعة وزنك.',
      clearedTitle: 'تم مسح الوزن',
      clearedMessage: 'تم تحديث متابعة وزنك.'
    }
  },
  pregnancySymptoms: {
    pageTitle: 'الأعراض التي شعرتِ بها',
    saveSymptomsAccessibility: 'حفظ الأعراض',
    hero: {
      title: 'أصغي إلى جسمك',
      subtitle: 'تابعي كيف تشعرين\nجسديًا اليوم.'
    },
    section: {
      title: 'الأعراض التي شعرتِ بها',
      subtitle: 'اختاري كل الأعراض التي تشعرين بها اليوم.'
    },
    selectedCount_one: 'تم تحديد عنصر واحد',
    selectedCount_other: 'تم تحديد {{count}} عنصر',
    selectedCount_zero: 'تم تحديد {{count}}',
    selectedCount_two: 'تم تحديد {{count}}',
    selectedCount_few: 'تم تحديد {{count}}',
    selectedCount_many: 'تم تحديد {{count}}',
    row: {
      added: 'أُضيف إلى يومياتك',
      tapToSelect: 'اضغطي للتحديد'
    },
    notes: {
      title: 'ملاحظات إضافية',
      optional: '(اختياري)',
      subtitle: 'أضيفي ملاحظة إن رغبتِ.',
      placeholder: 'اكتبي هنا...'
    },
    errors: {
      selectAtLeastOne: 'اختاري عرضًا واحدًا على الأقل.'
    },
    saveMineAccessibility: 'حفظ أعراضي',
    clearToday: 'مسح أعراض اليوم',
    saveToast: {
      savedTitle: 'تم حفظ الأعراض',
      savedMessage: 'تم تحديث متابعة حملك.',
      clearedTitle: 'تم مسح الأعراض',
      clearedMessage: 'تم تحديث متابعة حملك.'
    }
  },
  pregnancyDashboard: {
    hero: {
      weekLabel: 'الأسبوع الحالي',
      weeksUnit: 'أسبوع',
      daysCount_one: '{{count}} يوم',
      daysCount_other: '{{count}} يوم',
      daysCount_zero: '{{count}} يوم',
      daysCount_two: '{{count}} يومان',
      daysCount_few: '{{count}} أيام',
      daysCount_many: '{{count}} يومًا',
      womanIllustrationAccessibility: 'رسم توضيحي لامرأة حامل'
    },
    due: {
      dueDateLabel: 'تاريخ الولادة المتوقع',
      remainingTimeLabel: 'الوقت المتبقي',
      remainingWeeksCount: '{{count}} أسبوع',
      remainingDaysSuffix: '+ {{count}} يوم',
      remainingSubLabel: 'متبقية'
    },
    deliveryCta: {
      iGaveBirth: 'لقد ولدتُ',
      startPostpartum: 'ابدئي متابعة ما بعد الولادة'
    },
    baby: {
      viewWeekAccessibility: 'عرض معلومات هذا الأسبوع',
      title: 'هذا الأسبوع',
      eyebrow: 'طفلك',
      detailsUnavailable: 'ستتوفر معلومات مفصّلة عن هذا الأسبوع قريبًا.',
      weighsAbout: 'يزن حوالي',
      measuresAbout: 'يبلغ طوله حوالي',
      discoverWeekLink: 'اكتشفي الأسبوع',
      babyIllustrationAccessibility: 'رسم توضيحي للطفل في الأسبوع {{week}}',
      illustrationUnavailableAccessibility: 'الرسم التوضيحي غير متوفر لهذا الأسبوع'
    },
    unconfigured: {
      title: 'إعداد حملي',
      description: 'أدخلي بداية حملك لتري أسبوعك وتاريخ ولادتك المتوقع وتقدّمك.'
    },
    appointments: {
      nextAppointmentLabel: 'الموعد القادم',
      nextExamLabel: 'الفحص القادم',
      noAppointmentScheduled: 'لا يوجد موعد مجدول',
      noExamScheduled: 'لا يوجد فحص مجدول'
    },
    daily: {
      title: 'متابعة اليوم',
      subtitle: 'خذي لحظة لنفسك',
      completedLabel: 'مكتملة',
      noCategoriesSelected: 'لم يتم اختيار أي فئة متابعة حاليًا.',
      chooseTrackingCta: 'اختيار متابعتي'
    },
    dailyItems: {
      symptoms: 'الأعراض',
      weight: 'الوزن',
      mood: 'المزاج',
      sleep: 'النوم',
      medicalInfo: 'معلومات طبية'
    }
  },
  pregnancyDeliveryDateSheet: {
    title: 'لقد وصل طفلك 💜',
    description: 'أدخلي تاريخ ولادتك لتبدئي متابعة ما بعد الولادة.',
    confirmToday: 'ولدتُ اليوم',
    chooseAnotherDate: 'اختيار تاريخ آخر',
    invalidDateTitle: 'تاريخ غير صالح'
  },
  pregnancyPostpartumCongrats: {
    title: 'مبارك 💜',
    subtitle: 'فصل جديد يبدأ.',
    message: 'هل ترغبين في بدء متابعة ما بعد الولادة؟',
    deliveryRecordedOn: 'تم تسجيل الولادة في',
    startPostpartumTracking: 'ابدئي متابعة ما بعد الولادة',
    preparing: 'جارٍ التحضير…',
    later: 'لاحقًا'
  },
  pregnancyReminders: {
    title: 'تذكيراتك',
    subtitle: 'ما التذكيرات التي ترغبين في تلقّيها؟',
    description: 'سنرسل إليك تذكيرات تناسب\nتفضيلاتك.',
    options: {
      appointments: {
        label: 'المواعيد الطبية',
        description: 'تذكيرات بمواعيدك الطبية.'
      },
      exams: {
        label: 'الفحوصات',
        description: 'تذكيرات بفحوصاتك القادمة.'
      },
      dailyJournal: {
        label: 'اليوميات',
        description: 'تذكير لإكمال متابعتك اليومية.'
      }
    },
    customReminders: {
      accessibility: 'تذكيرات مخصّصة',
      label: 'تذكيرات مخصّصة',
      description: 'أنشئي تذكيراتك الخاصة في الإشعارات والتذكيرات.'
    },
    infoText: 'يمكنك تغيير تفضيلات التذكير\nفي أي وقت من الإعدادات.',
    finishButton: 'ابدئي متابعتي'
  },
  pregnancyNotifications: {
    headerTitle: 'الإشعارات والتذكيرات',
    headerSubtitle: 'خصّصي ما ترغبين في تلقّيه',
    introTitle: 'تذكيرات مفيدة، بالوتيرة التي تناسبك',
    introText: 'فعّلي فقط الإشعارات التي تدعمك فعلًا في يومك.',
    timeLabel: 'الوقت',
    repeatLabel: 'التكرار',
    delete: 'حذف',
    deleteReminderAccessibility: 'حذف {{title}}',
    deleteConfirmMessage: 'سيؤدي هذا أيضًا إلى حذف التذكير المرتبط.',
    untilDate: 'حتى {{date}}',
    noEndDateRange: 'بلا تاريخ انتهاء',
    deleteMedicationConfirmTitle: 'حذف هذا الدواء؟',
    deleteVitaminConfirmTitle: 'حذف هذا الفيتامين؟',
    deleteCustomReminderConfirmTitle: 'حذف هذا التذكير؟',
    customPast: {
      title: 'هذا الوقت قد مضى',
      message: 'هذا التذكير لمرة واحدة محدد في {{when}}، وقد مضى هذا الوقت، فلن يُرسل أبدًا. اختاري تاريخًا أو وقتًا لاحقًا.'
    },
    repeat: {
      once: 'مرة واحدة',
      daily: 'كل يوم',
      weekly: 'كل أسبوع'
    },
    sections: {
      pregnancy: {
        title: 'الحمل',
        weeklyUpdate: {
          title: 'التحديث الأسبوعي',
          description: 'احصلي على تذكير عند بدء أسبوع جديد من الحمل.'
        },
        dailyJournal: {
          title: 'اليوميات',
          description: 'ذكّريني بإكمال متابعتي لليوم.',
          reminderTimeLabel: 'وقت التذكير'
        }
      },
      appointmentsExams: {
        title: 'المواعيد والفحوصات',
        appointments: {
          title: 'المواعيد الطبية',
          description: 'احصلي على تذكير قبل مواعيدك الطبية.'
        },
        exams: {
          title: 'الفحوصات',
          description: 'احصلي على تذكير قبل فحوصاتك.'
        },
        defaultReminderHint: 'التذكير الافتراضي',
        footnote: 'يمكن لكل موعد أو فحص تحديد تذكيره الخاص من صفحته.'
      },
      health: {
        title: 'الصحة',
        vitaminsSubsectionTitle: 'الفيتامينات والمكمّلات',
        addVitaminAccessibility: 'إضافة فيتامين',
        noVitaminsText: 'لا توجد فيتامينات مسجّلة.',
        medicationsSubsectionTitle: 'الأدوية',
        addMedicationAccessibility: 'إضافة دواء',
        noMedicationsText: 'لا توجد أدوية مسجّلة.',
        footnote: 'يذكّرك التطبيق فقط بما أدخلتِه بنفسك، ولا يقدّم أي جرعات أو نصائح طبية.'
      },
      custom: {
        title: 'تذكيرات مخصّصة',
        addAccessibility: 'إضافة تذكير مخصّص',
        noRemindersText: 'لا توجد تذكيرات مخصّصة مسجّلة.'
      }
    },
    healthModal: {
      vitaminTitle: 'تذكير الفيتامين',
      medicationTitle: 'تذكير الدواء',
      nameLabel: 'الاسم',
      vitaminNamePlaceholder: 'مثال: حمض الفوليك',
      medicationNamePlaceholder: 'مثال: الحديد',
      startDateLabel: 'تاريخ البدء',
      endDateLabel: 'تاريخ الانتهاء (اختياري)',
      noEndDateValue: 'غير محدد',
      removeEndDate: 'إزالة تاريخ الانتهاء'
    },
    customModal: {
      title: 'تذكير مخصّص',
      titleLabel: 'العنوان',
      titlePlaceholder: 'مثال: دورة التحضير للولادة',
      descriptionLabel: 'الوصف (اختياري)',
      descriptionPlaceholder: 'أضيفي تفصيلًا…',
      dateLabel: 'التاريخ'
    }
  },
  pregnancyStatistics: {
    header: {
      title: 'الإحصاءات',
      subtitle: 'اتجاهاتك وتقدّمك خلال حملك'
    },
    moodLabels: {
      veryGood: 'جيد جدًا',
      good: 'جيد',
      neutral: 'عادي',
      stressed: 'متوترة',
      irritable: 'سريعة الانفعال',
      anxious: 'قلقة',
      sad: 'حزينة',
      tired: 'متعبة',
      motivated: 'متحمّسة'
    },
    hero: {
      emptyText: 'حدّدي تاريخ حملك لتري أسبوعك وثلث الحمل وتاريخ الولادة المتوقع.',
      eyebrow: 'حملك',
      weekLabel: 'أسبوع',
      gestationalAge: '{{weeks}} أسبوع + {{days}} يوم',
      percentCompleteLabel: 'مكتمل',
      progressRemaining: 'متبقي {{count}} أسبوع',
      trimesterLabel: 'الثلث',
      dueDateLabel: 'تاريخ الولادة المتوقع'
    },
    overview: {
      sectionTitle: 'نظرة عامة',
      sectionDescription: 'ملخص الفترة المحددة',
      daysTracked: 'أيام المتابعة',
      completeDays: 'الأيام المكتملة',
      lastWeight: 'آخر وزن',
      topSymptom: 'العرض الأكثر تكرارًا',
      noData: 'لا توجد بيانات بعد'
    },
    weight: {
      sectionSubtitle: 'تابعي كيف تتغير قياساتك',
      sectionTitle: 'تغيّر الوزن',
      emptyText: 'لم يُسجَّل أي قياس بعد.',
      lastMeasurementLabel: 'آخر قياس',
      sincePrevious: 'منذ القياس السابق',
      addAnotherHint: 'أضيفي قياسًا آخر لترَي اتجاهك.',
      sinceFirst: 'منذ أول قياس',
      averagePerWeek: 'المتوسط الأسبوعي',
      recentMeasurements: 'القياسات الأخيرة',
      valuesCount_one: '{{count}} قيمة',
      valuesCount_other: '{{count}} قيمة',
      valuesCount_zero: '{{count}} قيمة',
      valuesCount_two: '{{count}} قيمتان',
      valuesCount_few: '{{count}} قيم',
      valuesCount_many: '{{count}} قيمة',
      history: 'السجل',
      measurementsCount_one: '{{count}} قياس',
      measurementsCount_other: '{{count}} قياس',
      measurementsCount_zero: '{{count}} قياس',
      measurementsCount_two: '{{count}} قياسان',
      measurementsCount_few: '{{count}} قياسات',
      measurementsCount_many: '{{count}} قياسًا',
      monthlyLatestSuffix: ' · آخر قيمة {{value}} كغ'
    },
    symptoms: {
      subtitleLongitudinal: 'التكرار والاتجاه خلال الفترة المحددة',
      subtitleDefault: 'الأعراض التي سجّلتِها أكثر من غيرها',
      sectionTitle: 'الأعراض المتكررة',
      emptyText: 'أضيفي أعراضًا في يوميات الحمل لترَي تكرارها هنا.',
      dayCount_one: '{{count}} يوم',
      dayCount_other: '{{count}} يوم',
      dayCount_zero: '{{count}} يوم',
      dayCount_two: '{{count}} يومان',
      dayCount_few: '{{count}} أيام',
      dayCount_many: '{{count}} يومًا',
      monthChip: '{{name}} · {{count}} يوم'
    },
    wellness: {
      sectionTitle: 'العافية',
      subtitleLongitudinal: 'اتجاهك خلال الفترة المحددة',
      subtitleDefault: 'اتجاهاتك اليومية',
      moodLabel: 'المزاج',
      moodEntries_one: '{{count}} تسجيل',
      moodEntries_other: '{{count}} تسجيل',
      moodEntries_zero: '{{count}} تسجيل',
      moodEntries_two: '{{count}} تسجيلان',
      moodEntries_few: '{{count}} تسجيلات',
      moodEntries_many: '{{count}} تسجيلًا',
      sleepLabel: 'النوم',
      sleepTracked_one: '{{count}} ليلة مسجّلة',
      sleepTracked_other: '{{count}} ليلة مسجّلة',
      sleepTracked_zero: '{{count}} ليلة مسجّلة',
      sleepTracked_two: '{{count}} ليلتان مسجّلتان',
      sleepTracked_few: '{{count}} ليالٍ مسجّلة',
      sleepTracked_many: '{{count}} ليلة مسجّلة',
      monthlySubtitle: 'مزاجك ونومك، شهرًا بعد شهر',
      monthlyTitle: 'تغيّر العافية',
      moodChip: 'المزاج · {{label}}',
      sleepChipDuration: 'النوم · {{value}}',
      sleepChipCount_one: 'النوم · {{count}} ليلة',
      sleepChipCount_other: 'النوم · {{count}} ليلة',
      sleepChipCount_zero: 'النوم · {{count}} ليلة',
      sleepChipCount_two: 'النوم · {{count}} ليلتان',
      sleepChipCount_few: 'النوم · {{count}} ليالٍ',
      sleepChipCount_many: 'النوم · {{count}} ليلة'
    },
    details: {
      sectionSubtitle: 'أبرز النقاط للفترة المحددة',
      sectionTitle: 'تفاصيل المتابعة',
      sleepLabel: 'النوم',
      sleepAverage: 'المتوسط {{duration}}',
      medicalInfoLabel: 'المعلومات الطبية',
      medicalInfoLogged: 'مسجّلة · {{date}}',
      medicalInfoDaysLogged_one: '{{count}} يوم مسجّل',
      medicalInfoDaysLogged_other: '{{count}} يوم مسجّل',
      medicalInfoDaysLogged_zero: '{{count}} يوم مسجّل',
      medicalInfoDaysLogged_two: '{{count}} يومان مسجّلان',
      medicalInfoDaysLogged_few: '{{count}} أيام مسجّلة',
      medicalInfoDaysLogged_many: '{{count}} يومًا مسجّلًا',
      medicalFollowUpLabel: 'المتابعة الطبية'
    },
    medicalSummary: {
      appointments_one: '{{count}} موعد',
      appointments_other: '{{count}} موعد',
      appointments_zero: '{{count}} موعد',
      appointments_two: '{{count}} موعدان',
      appointments_few: '{{count}} مواعيد',
      appointments_many: '{{count}} موعدًا',
      exams_one: '{{count}} فحص',
      exams_other: '{{count}} فحص',
      exams_zero: '{{count}} فحص',
      exams_two: '{{count}} فحصان',
      exams_few: '{{count}} فحوصات',
      exams_many: '{{count}} فحصًا'
    },
    monthlyEvolutionTitle: 'التغيّر شهرًا بعد شهر',
    durationFormat: '{{hours}} س {{minutes}} د'
  },
  pregnancyMedicalInformation: {
    header: {
      title: 'المعلومات الطبية',
      subtitle: 'دوّني المعلومات المهمة التي ترغبين في الاحتفاظ بها.'
    },
    hero: {
      accessibilityLabel: 'دفتر طبي وسماعة طبية'
    },
    privacy: {
      title: 'مساحة شخصية وخاصة',
      text: 'تبقى هذه المعلومات على هذا الجهاز فقط.'
    },
    date: {
      fieldLabel: 'تاريخ اختياري',
      pickerAccessibilityLabel: 'اختيار تاريخ المعلومة',
      smallLabel: 'تاريخ المعلومة',
      clearAccessibilityLabel: 'مسح التاريخ',
      helper: 'أضيفي تاريخ هذه المعلومة إن رغبتِ في الاحتفاظ به.'
    },
    note: {
      fieldLabel: 'ملاحظة طبية شخصية',
      placeholder: 'اكتبي فقط المعلومات التي ترغبين في الاحتفاظ بها.',
      counter: '{{count}}/{{max}}',
      helper: 'أضيفي هنا علاجاتك أو حساسياتك أو فحوصاتك أو أي معلومات مهمة أخرى.'
    },
    errors: {
      emptyNote: 'أضيفي بعض المعلومات قبل الحفظ.'
    },
    save: {
      saving: 'جارٍ الحفظ…'
    },
    toast: {
      success: 'تم حفظ المعلومات الطبية بنجاح ✨'
    },
    calendar: {
      chooseDate: 'اختيار تاريخ',
      closeCalendarAccessibilityLabel: 'إغلاق التقويم',
      previousMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
      today: 'اليوم',
      clear: 'مسح',
      choose: 'اختيار'
    }
  },
  pregnancyEvent: {
    types: {
      appointment: 'موعد',
      exam: 'فحص'
    },
    form: {
      dateLabel: 'التاريخ',
      timeLabel: 'الوقت (اختياري)',
      timeNotSet: 'غير محدد',
      clearTime: 'مسح الوقت',
      titleLabel: 'العنوان',
      titlePlaceholderAppointment: 'مثال: استشارة ما قبل الولادة',
      titlePlaceholderExam: 'مثال: الموجات فوق الصوتية للثلث الثاني',
      titleRequired: 'أدخلي عنوانًا.',
      practitionerLabel: 'الطبيب أو المختص (اختياري)',
      practitionerPlaceholder: 'مثال: د. بن علي',
      locationLabel: 'المكان (اختياري)',
      locationPlaceholder: 'مثال: عيادة النور',
      notesLabel: 'ملاحظات (اختياري)',
      notesPlaceholder: 'أضيفي ملاحظة...',
      reminderLabel: 'التذكير',
      noReminder: 'بلا تذكير',
      remindMe: 'ذكّريني',
      reminderTimeLabel: 'وقت التذكير',
      deleteAppointmentTitle: 'حذف هذا الموعد؟',
      deleteExamTitle: 'حذف هذا الفحص؟',
      deleteMessage: 'سيؤدي هذا أيضًا إلى حذف التذكير المرتبط.',
      delete: 'حذف',
      deleteAppointmentAccessibility: 'حذف هذا الموعد',
      deleteExamAccessibility: 'حذف هذا الفحص',
      deleting: 'جارٍ الحذف…',
      deleteModalCloseAccessibility: 'إغلاق دون حذف'
    },
    reminder: {
      previewLabel: 'سيُرسل التذكير',
      noTimeHint: 'لم يُحدَّد وقت، لذا يُستخدم الوقت 09:00 لحساب وقت التذكير.',
      pastError: 'كان سيُرسل هذا التذكير في {{when}}، وقد مضى هذا الوقت. اختاري مدة أقصر قبل الموعد، أو حدّدي وقتًا مخصّصًا، أو أوقفي التذكير.',
      categoryOffAppointment: 'تذكيرات المواعيد متوقفة في الإشعارات والتذكيرات، لذا لن يُرسل هذا التذكير.',
      categoryOffExam: 'تذكيرات الفحوصات متوقفة في الإشعارات والتذكيرات، لذا لن يُرسل هذا التذكير.',
      turnOnAppointment: 'تفعيل تذكيرات المواعيد',
      turnOnExam: 'تفعيل تذكيرات الفحوصات',
      savedWithoutTitle: 'تم الحفظ دون تذكير',
      savedPermission: 'تم حفظ «{{title}}»، لكن لم تتم جدولة تذكيره لأن الإشعارات متوقفة لتطبيق AWA في إعدادات هاتفك.',
      savedChannel: 'تم حفظ «{{title}}»، لكن لم تتم جدولة تذكيره لأن فئة تذكيرات AWA محظورة في إعدادات هاتفك.',
      savedCategoryAppointment: 'تم حفظ «{{title}}»، لكن تذكيرات المواعيد متوقفة في الإشعارات والتذكيرات، لذا لم تتم جدولة تذكيره.',
      savedCategoryExam: 'تم حفظ «{{title}}»، لكن تذكيرات الفحوصات متوقفة في الإشعارات والتذكيرات، لذا لم تتم جدولة تذكيره.',
      savedPast: 'تم حفظ «{{title}}»، لكن وقت تذكيره ({{when}}) قد مضى، لذا لم تتم جدولة أي تذكير.',
      savedUnavailable: 'تم حفظ «{{title}}»، لكن تعذّرت قراءة إعدادات الإشعارات حاليًا، لذا لم تتم جدولة تذكيره. حاولي مرة أخرى لاحقًا.',
      savedFailed: 'تم حفظ «{{title}}»، لكن تعذّرت جدولة تذكيره. افتحيه مرة أخرى واحفظي لإعادة المحاولة.'
    },
    appointmentScreen: {
      addTitle: 'إضافة موعد',
      editTitle: 'تعديل الموعد'
    },
    examScreen: {
      addTitle: 'إضافة فحص',
      editTitle: 'تعديل الفحص'
    }
  },
  pregnancyWeekScreen: {
    tabs: {
      baby: 'الطفل',
      body: 'جسمك',
      toKnow: 'من المفيد معرفته'
    },
    context: {
      current: 'الأسبوع الحالي',
      past: 'أسبوع سابق',
      preview: 'معاينة'
    },
    unconfigured: {
      title: 'لم يتم إعداد الحمل',
      text: 'أعدّي بيانات حملك لتتابعي تقدّمه أسبوعًا بعد أسبوع.',
      button: 'إعداد حملي'
    },
    header: {
      weekTitle: 'الأسبوع {{week}}',
      gestationalAge: '{{weeks}} أسبوع + {{days}} يوم · {{trimester}}',
      educationalContext: '{{context}} (للتثقيف) · الحمل الحالي: الأسبوع {{week}}',
      previousWeek: 'الأسبوع السابق',
      nextWeek: 'الأسبوع التالي'
    },
    baby: {
      illustrationAccessibility: 'رسم توضيحي للحمل — الأسبوع {{week}}',
      heroTitle: 'طفلك هذا الأسبوع',
      comparisonPrefix: 'بحجم {{comparison}} تقريبًا',
      detailsUnavailable: 'ستتوفر معلومات مفصّلة عن هذا الأسبوع قريبًا.',
      developmentHeading: 'النمو',
      lengthLabel: 'الطول',
      weightLabel: 'الوزن',
      comparisonLabel: 'المقارنة',
      disclaimer: 'تقدّم هذه المعلومات تقديرات عامة لنمو الجنين. وقد يختلف النمو من حمل إلى آخر.'
    },
    body: {
      title: 'جسمك هذا الأسبوع',
      subtitle: 'التغيّرات التي قد تشعرين بها',
      detailsUnavailable: 'ستتوفر معلومات مفصّلة عن هذا الأسبوع قريبًا.'
    },
    toKnow: {
      title: 'من المفيد معرفته هذا الأسبوع',
      subtitle: 'بعض الإرشادات المفيدة لهذه المرحلة',
      detailsUnavailable: 'ستتوفر معلومات عن هذا الأسبوع قريبًا.'
    }
  },
  pregnancyCalendar: {
    title: 'التقويم',
    subtitle: 'تابعي حملك',
    filtersLabel: 'التصفية',
    legendLabel: 'المفتاح',
    todayLabel: 'اليوم',
    ramadanLabel: 'رمضان',
    dhoulHijjaLabel: 'ذو الحجة',
    dayAccessibility: {
      ramadan: '، رمضان',
      dhoulHijja: '، ذو الحجة'
    },
    eventTypes: {
      appointment: {
        label: 'موعد',
        empty: 'لا يوجد موعد'
      },
      exam: {
        label: 'فحص',
        empty: 'لا يوجد فحص'
      },
      note: {
        label: 'متابعة',
        empty: 'لا توجد متابعة'
      }
    },
    filters: {
      symptoms: {
        label: 'الأعراض',
        description: 'العلامات والأعراض المسجّلة في يومياتك.',
        empty: 'لا شيء'
      },
      weight: {
        label: 'الوزن',
        description: 'تغيّر وزنك خلال الحمل.',
        empty: 'غير مسجّل'
      },
      mood: {
        label: 'المزاج',
        description: 'الحالات المزاجية والمشاعر المسجّلة يومًا بعد يوم.',
        empty: 'غير مسجّل'
      },
      sleep: {
        label: 'النوم',
        description: 'مدة نومك وجودته.',
        empty: 'غير مدخل'
      },
      medical: {
        label: 'معلومات طبية',
        description: 'معلومات طبية مهمة.',
        empty: 'لا توجد معلومات'
      },
      appointments: {
        label: 'المواعيد / الفحوصات',
        description: 'المواعيد والفحوصات الطبية القادمة.',
        empty: 'لا يوجد موعد أو فحص'
      }
    },
    dailyInfo: {
      recorded: 'مسجّل',
      notRecorded: 'غير مسجّل'
    },
    selectedCard: {
      weekLabel: 'أسبوع الحمل',
      weekValue: 'الأسبوع {{week}}',
      gestationLabel: 'عمر الحمل',
      gestationValue: '{{weeks}} أسبوع + {{days}} يوم',
      trimesterLabel: 'الثلث',
      notConfigured: 'غير معدّ'
    },
    upcoming: {
      title: 'القادم',
      empty: 'لا توجد مواعيد أو فحوصات قادمة.',
      editAccessibility: 'تعديل {{title}}'
    },
    sheet: {
      closeAccessibility: 'إغلاق',
      legend: {
        title: 'مفتاح التقويم',
        subtitle: 'افهمي الألوان والعلامات المستخدمة.',
        eventDescriptions: {
          appointment: 'استشارات أو زيارات أو مواعيد طبية مجدولة.',
          exam: 'فحوصات طبية أو موجات فوق صوتية قادمة.',
          note: 'المتابعة اليومية المسجّلة في ذلك اليوم (الأعراض أو الوزن أو المزاج أو النوم أو المعلومات الطبية).'
        },
        ramadanDescription: 'يقع هذا اليوم ضمن شهر رمضان (الصيام).',
        dhoulHijjaDescription: 'يقع هذا اليوم ضمن شهر ذي الحجة.',
        todayDescription: 'يشير الإطار الأسود المتقطع إلى تاريخ اليوم.',
        closeAccessibility: 'إغلاق المفتاح',
        closeLabel: 'إغلاق'
      },
      filters: {
        title: 'تصفية التقويم',
        subtitle: 'اختاري المعلومات التي تظهر في تقويمك.',
        doneLabel: 'تم'
      }
    }
  },
  postpartumDashboard: {
    headerSubtitle: 'اعتني بنفسك، يومًا بعد يوم 💜',
    feeding: {
      exclusiveBreastfeeding: 'نعم (حصرية)',
      mixed: 'مختلطة (ثدي + رضّاعة)',
      exclusiveBottle: 'رضّاعة',
      unknown: 'غير محددة'
    },
    hero: {
      badge: 'ما بعد الولادة',
      title: 'رحلتك بعد الولادة',
      dayPrefix: 'اليوم ',
      subLabel: 'خطوة بعد خطوة، بلطف.',
      deliveryLabel: 'الولادة في',
      illustrationAccessibility: 'أم مع مولودها الجديد'
    },
    unconfigured: {
      title: 'أدخلي تاريخ ولادتك',
      text: 'سنخصّص بعدها متابعتك يومًا بعد يوم.',
      button: 'إدخال التاريخ'
    },
    today: {
      sectionTitle: 'اليوم',
      sectionSubtitle: 'متابعتك الأساسية في لمحة',
      badge: 'اليوم'
    },
    lochia: {
      eyebrow: 'المتابعة اليومية',
      title: 'الهلابة اليوم',
      noneRecordedToday: 'لا توجد معلومات مسجّلة اليوم',
      endedSummary: 'انتهت · {{days}} يوم'
    },
    cycleReturn: {
      eyebrow: 'التقدّم',
      title: 'عودة الدورة',
      resumed: 'عادت الدورة',
      notResumed: 'لم تعد الدورة',
      since: 'منذ {{date}}',
      feedingLabel: 'الرضاعة: {{feeding}}'
    },
    dailyCard: {
      title: 'متابعة اليوم',
      subtitle: 'خذي لحظة لنفسك',
      completed: 'مكتملة'
    },
    spiritual: {
      sectionTitle: 'العلامات الروحية',
      sectionSubtitle: 'علاماتك لهذا اليوم، بطمأنينة'
    },
    nifas: {
      lossesEnded: 'انتهى النزف',
      lossesOngoing: 'اليوم {{day}} · النزف مستمر',
      notTracked: 'اليوم {{day}} · لم تُسجَّل المتابعة'
    },
    nifasModal: {
      body: 'وفق هذا المرجع، يمكنك استئناف صلاتك من اليوم، حتى لو استمرت الهلابة أو النزف. اتبعي المرجع الديني الذي اخترتِه.',
      note: 'يمكنك متابعة تتبّع ما بعد الولادة في AWA.',
      continue: 'فهمت',
      chooseAnother: 'اختيار متابعة أخرى'
    }
  },
  postpartumCalendar: {
    header: {
      title: 'التقويم',
      subtitle: 'تابعي رحلتك بعد الولادة'
    },
    modes: {
      gregorian: 'الميلادي',
      hijri: 'الهجري',
      double: 'كلاهما'
    },
    categories: {
      lochia: {
        label: 'الهلابة',
        description: 'تدفّق الهلابة ولونها المسجّلان في متابعتك.'
      },
      fatigue: {
        label: 'التعب',
        description: 'قيّمي مستوى تعبك اليوم'
      },
      sleep: {
        label: 'النوم',
        description: 'مدة نومك وجودته'
      },
      mood: {
        label: 'المزاج',
        description: 'كيف تشعرين اليوم؟'
      },
      pain: {
        label: 'الألم',
        description: 'دوّني الألم الذي تشعرين به اليوم'
      },
      physicalRecovery: {
        label: 'التعافي الجسدي',
        description: 'كيف يتقدّم تعافيك؟'
      }
    },
    ramadan: 'رمضان',
    dhoulHijja: 'ذو الحجة',
    dayAccessibility: {
      delivery: '، الولادة',
      ramadan: '، رمضان',
      dhoulHijja: '، ذو الحجة'
    },
    selected: {
      beforeTracking: 'هذا التاريخ سابق لبداية متابعة ما بعد الولادة.',
      notConfigured: 'أدخلي تاريخ ولادتك لتفعيل متابعة ما بعد الولادة.',
      dayBadge: 'اليوم {{day}} بعد الولادة',
      delivery: 'الولادة',
      lochiaEmpty: 'غير مسجّل',
      cycleReturnTitle: 'عودة الدورة',
      cycleReturnValue: 'تم تسجيل أول حيض بعد الولادة',
      emptyText: 'لا توجد بيانات مسجّلة لهذا اليوم.',
      addToJournal: 'الإضافة إلى اليوميات'
    },
    legend: {
      title: 'مفتاح التقويم',
      subtitle: 'افهمي الألوان والعلامات المستخدمة.',
      todayDescription: 'يشير الإطار الأسود المتقطع إلى تاريخ اليوم.',
      ramadanDescription: 'يقع هذا اليوم ضمن شهر رمضان (الصيام).',
      dhoulHijjaDescription: 'يقع هذا اليوم ضمن شهر ذي الحجة.'
    },
    filters: {
      title: 'تصفية التقويم',
      subtitle: 'اختاري المعلومات التي تظهر في تقويمك.'
    }
  },
  postpartumStatistics: {
    tabs: {
      summary: 'الملخص',
      lochia: 'الهلابة',
      fatigue: 'التعب',
      mood: 'المزاج',
      sleep: 'النوم',
      pain: 'الألم',
      recovery: 'التعافي'
    },
    durationFormat: '{{hours}} س {{minutes}} د',
    dayCount_one: '{{count}} يوم',
    dayCount_other: '{{count}} يوم',
    dayCount_zero: '{{count}} يوم',
    dayCount_two: 'يومان ({{count}})',
    dayCount_few: '{{count}} أيام',
    dayCount_many: '{{count}} يومًا',
    header: {
      objectivePill: 'ما بعد الولادة'
    },
    noDataYet: 'لا توجد بيانات بعد',
    basedOnDays_one: 'بناءً على يوم واحد',
    basedOnDays_other: 'بناءً على {{count}} يوم',
    basedOnDays_zero: 'بناءً على {{count}} يوم',
    basedOnDays_two: 'بناءً على يومين ({{count}})',
    basedOnDays_few: 'بناءً على {{count}} أيام',
    basedOnDays_many: 'بناءً على {{count}} يومًا',
    daysLogged: 'الأيام المسجّلة',
    monthlyHistorySubtitle: 'السجل الكامل، شهرًا بشهر',
    recentEvolution: 'الاتجاه الأخير',
    evolutionOf: 'الاتجاه — {{title}}',
    distributionOf: 'التوزيع — {{title}}',
    fatigue: {
      emptyText: 'سجّلي إرهاقك في يومياتك لتري اتجاهه هنا.',
      kpiLabel: 'الإرهاق الأكثر تكرارًا',
      title: 'الإرهاق'
    },
    mood: {
      emptyText: 'سجّلي مزاجك في يومياتك لتري اتجاهه هنا.',
      kpiLabel: 'المزاج الأكثر تكرارًا',
      title: 'المزاج'
    },
    pain: {
      emptyText: 'سجّلي ألمك في يومياتك لترَي تكراره هنا.',
      kpiLabel: 'الألم الأكثر تكرارًا',
      title: 'الألم'
    },
    recovery: {
      emptyText: 'سجّلي تعافيك في يومياتك لتري تقدّمه هنا.',
      kpiLabel: 'حالة التعافي الأكثر تكرارًا',
      title: 'التعافي الجسدي'
    },
    summary: {
      sinceDelivery: 'منذ الولادة',
      title: 'نظرة عامة',
      postpartumDays: 'أيام ما بعد الولادة',
      lochiaEntries: 'تسجيلات الهلابة',
      trackedDays: 'الأيام المتابَعة',
      completeDays: 'الأيام المكتملة',
      completeDayExplainer: 'يشمل اليوم المكتمل: الإرهاق والنوم والمزاج والألم والتعافي الجسدي.',
      cycleReturnOn: 'عودة الحيض: في {{date}}',
      cycleReturnNotRecorded: 'عودة الحيض: لم تُسجَّل بعد',
      cycleReturnCardAccessibility: 'عودة الدورة — العلامات المسجّلة خلال {{periodLabel}}',
      cycleReturnSubtitle: 'العلامات المسجّلة عبر الزمن',
      cycleReturnTitle: 'عودة الدورة',
      cycleReturnConfirmed: 'تم تأكيد عودة الدورة — أشرتِ إلى أن حيضك عاد في {{date}}.',
      cycleReturnEmpty: 'لا توجد عودة مؤكَّدة للدورة خلال {{periodLabel}}.',
      dominantFlow: 'التدفّق الغالب',
      lochiaEvolutionTitle: 'اتجاه الهلابة',
      averagesTitle: 'المتوسطات',
      averageSleep: 'متوسط النوم',
      averageMood: 'متوسط المزاج',
      adviceTitle: 'نصيحة',
      adviceText: 'كل خطوة صغيرة لها قيمتها. اعتني بنفسك — جسمك يتعافى يومًا بعد يوم.'
    },
    lochia: {
      emptyText: 'لا توجد بيانات عن الهلابة بعد.',
      evolutionFootnote: 'يختلف تطوّر الهلابة من امرأة إلى أخرى. واصلي متابعتك اليومية.',
      actuallyRecorded: 'البيانات المسجّلة فعليًا',
      durationTitle: 'مدة الهلابة',
      start: 'البداية',
      lastRecordedDay: 'آخر يوم مسجّل',
      recordedDuration: 'المدة المسجّلة',
      durationDays: '{{days}} أيام',
      status: 'الحالة',
      endedOn: 'انتهت في {{date}}',
      ongoing: 'مستمرة',
      notRecorded: 'غير مسجّلة',
      observationsTitle: 'الملاحظات',
      entries: 'التسجيلات',
      daysTracked: 'الأيام المتابَعة',
      recordedSequence: 'التسلسل المسجّل',
      flowEvolutionTitle: 'اتجاه التدفّق',
      flowDistributionTitle: 'توزيع التدفّق',
      symptomsSubtitle: 'الأعراض المسجّلة سابقًا في يوميات الهلابة',
      symptomsTitle: 'الأعراض المصاحبة',
      historyTitle: 'السجل'
    },
    sleep: {
      notEnoughData: 'لا تتوفر بيانات كافية بعد لحساب المتوسط.',
      nightsRecorded: 'الليالي المسجّلة',
      durationPerDay: 'المدة لكل يوم مسجّل',
      evolutionTitle: 'اتجاه النوم',
      qualityTitle: 'جودة النوم'
    }
  },
  postpartumDeliveryDate: {
    title: 'تاريخ\nولادتك',
    subtitle: 'يتيح لنا هذا التاريخ حساب يومك بعد الولادة.',
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    selectedDate: 'التاريخ المحدد',
    modify: 'تعديل',
    saving: 'جارٍ الحفظ…',
    next: 'التالي'
  },
  postpartumDeliveryType: {
    title: 'نوع الولادة',
    subtitle: 'تبقى هذه المعلومة خاصة وتساعدنا على مرافقتك بشكل أفضل.',
    infoText: 'يمكنك تغيير هذا الاختيار لاحقًا من الإعدادات.',
    saving: 'جارٍ الحفظ...',
    next: 'التالي',
    options: {
      vaginal: 'ولادة طبيعية',
      plannedCSection: 'ولادة قيصرية مخطَّط لها',
      emergencyCSection: 'ولادة قيصرية طارئة',
      preferNotToSay: 'أفضّل عدم الإفصاح'
    }
  },
  postpartumFeeding: {
    title: 'التغذية',
    subtitle: 'يساعدنا اختيارك على تخصيص متابعتك ونصائحك.',
    saving: 'جارٍ الحفظ…',
    next: 'التالي',
    options: {
      exclusiveBreastfeeding: 'رضاعة طبيعية حصرية',
      mixed: 'رضاعة مختلطة\n(ثدي + زجاجة)',
      exclusiveBottle: 'رضاعة بالزجاجة فقط',
      unknown: 'لستُ متأكدة بعد'
    }
  },
  postpartumCycleReturn: {
    header: {
      eyebrow: 'ما بعد الولادة',
      title: 'عودة الدورة',
      helpAccessibilityLabel: 'مساعدة حول عودة الدورة'
    },
    feedingLabels: {
      exclusiveBreastfeeding: 'رضاعة طبيعية حصرية',
      mixed: 'رضاعة مختلطة',
      exclusiveBottle: 'رضاعة بالزجاجة فقط',
      unknown: 'لستُ متأكدة بعد'
    },
    notProvided: 'غير محدد',
    evolutionStages: {
      recovery: {
        range: '0–6 أسابيع',
        label: 'التعافي بعد الولادة'
      },
      adaptation: {
        range: '6–12 أسبوعًا',
        label: 'تكيّف تدريجي'
      },
      evolution: {
        range: '3–6 أشهر',
        label: 'تطوّر ما بعد الولادة'
      },
      gradualReturn: {
        range: '6–12 شهرًا فأكثر',
        label: 'قد تعود الدورة تدريجيًا'
      }
    },
    hero: {
      illustrationAccessibilityLabel: 'رسم توضيحي لعودة الدورة',
      statusLabel: 'الحالة الحالية',
      returned: 'عادت الدورة',
      notReturned: 'لم تعد الدورة',
      returnedDescription: 'بدأ أول حيض لك منذ الولادة في {{date}}.',
      notReturnedDescription: 'لم يأتِكِ الحيض بعد منذ الولادة.',
      amenorrheaBadge: 'انقطاع الحيض بعد الولادة',
      returnedBadge: 'تم تسجيل العودة',
      normalPanelTitle: 'لكل جسم إيقاعه الخاص',
      normalPanelText: 'قد تستغرق عودة الحيض وقتًا، خصوصًا أثناء الرضاعة الطبيعية.'
    },
    period: {
      sectionTitle: 'عودة الحيض',
      sectionSubtitle: 'أدخلي أول يوم من حيضك بعد الولادة',
      label: 'أول حيض',
      valueNotRecorded: 'لم يُسجَّل بعد',
      editAccessibilityLabel: 'تعديل تاريخ أول حيض',
      addAccessibilityLabel: 'تسجيل تاريخ أول حيض',
      edit: 'تعديل',
      clearAccessibilityLabel: 'مسح تاريخ أول حيض',
      clearLabel: 'مسح هذا التاريخ (لم تعد الدورة)',
      recordedRowAccessibilityLabel: 'تاريخ آخر حيض',
      recordedLabel: 'التاريخ المسجّل',
      noDate: 'بلا تاريخ'
    },
    factors: {
      sectionTitle: 'التطوّر الهرموني',
      sectionSubtitle: 'سياق مبني على المعلومات التي سجّلتِها',
      educationText: 'يتكيّف جسمك تدريجيًا بعد الولادة. قد تؤثر التغيّرات الهرمونية في الرضاعة وعودة الدورة والمزاج والنوم أو جفاف المهبل. هذه المؤشرات لا تقيس هرموناتك وليست تشخيصًا.',
      trackedContextLabel: 'سياقك المتابَع',
      feeding: {
        title: 'التغذية',
        description: 'قد تؤثر في موعد عودة حيضك.'
      },
      cycleReturn: {
        title: 'عودة الدورة',
        description: 'التاريخ الفعلي الذي سجّلتِه.',
        notReturned: 'لم تعد بعد'
      },
      amenorrhea: {
        title: 'انقطاع الحيض بعد الولادة',
        description: 'غياب الحيض منذ الولادة.',
        finished: 'انتهى',
        ongoing: 'مستمر'
      },
      sleep: {
        title: 'النوم والراحة',
        description: 'راحتك وتعافيك اليومي.'
      },
      mood: {
        title: 'الصحة النفسية',
        description: 'حالتك العاطفية منذ الولادة.'
      },
      fatigue: {
        title: 'الإرهاق',
        description: 'آخر ملاحظة مسجّلة في يومياتك.'
      }
    },
    timeline: {
      sectionTitle: 'تطوّر ما بعد الولادة',
      sectionSubtitle: 'علامات عامة تساعد على تصوّر هذه المرحلة',
      disclaimer: 'هذه العلامات إرشادية: تختلف عودة الدورة من امرأة إلى أخرى.'
    },
    reminder: {
      eyebrow: 'للتذكير',
      title: 'إيقاعك فريد',
      text: 'يتطوّر كل جسم بشكل مختلف بعد الولادة. وقد تؤثر الرضاعة الطبيعية خصوصًا في عودة الدورة.'
    },
    helpModal: {
      closeAccessibilityLabel: 'إغلاق المساعدة',
      text: 'بعد الولادة، يُعدّ غياب الحيض أمرًا شائعًا، وقد يستمر من عدة أسابيع إلى عدة أشهر، خصوصًا مع الرضاعة الطبيعية.',
      infoText: 'هذه العلامة للاطلاع فقط. وهي ليست تشخيصًا ولا إرشادًا طبيًا مخصصًا.',
      button: 'فهمت'
    },
    picker: {
      title: 'تاريخ عودة الدورة',
      subtitle: 'أدخلي أول يوم من أول حيض لك منذ الولادة.'
    },
    consistency: {
      lochiaActiveTitle: 'راجعي متابعتك',
      dateCheckTitle: 'تاريخ يحتاج إلى مراجعة',
      beforeDeliveryMessage: 'لا يمكن أن يسبق أول حيض لك منذ الولادة تاريخ ولادتك.',
      dateOrderMessage: 'تاريخ عودة الدورة أسبق من تاريخ انتهاء الهلابة المسجّل.',
      lochiaActiveMessage: 'لا تزال الهلابة مسجّلة على أنها مستمرة، لكنكِ تريدين تسجيل عودة الدورة.',
      beforeDeliveryInfo: 'اختاري تاريخًا يوافق تاريخ ولادتك أو يلي ذلك.',
      dateOrderInfo: 'راجعي التاريخين للحفاظ على اتساق متابعتك.',
      lochiaActiveInfo: 'للحفاظ على اتساق متابعتك، راجعي أولًا تاريخ انتهاء الهلابة أو صحّحي تاريخ عودة الدورة.',
      editDate: 'تعديل التاريخ',
      viewLochia: 'عرض الهلابة'
    }
  },
  postpartumReminders: {
    timeRequiredError: 'اختاري وقتًا لتذكير المتابعة اليومية.',
    saving: 'جارٍ الحفظ…',
    permissionNotice: 'فعّلي الإشعارات من إعدادات هاتفك لتصلك تذكيراتك.',
    dailyTracking: {
      title: 'المتابعة اليومية',
      description: 'الإرهاق والنوم والمزاج والانزعاج والتعافي.'
    },
    timePicker: {
      label: 'وقت التذكير',
      accessibilityLabelWithTime: 'وقت التذكير، {{time}}',
      accessibilityLabelChoose: 'اختيار وقت التذكير',
      choosePlaceholderShort: 'اختاري',
      choosePlaceholderLong: 'اختاري وقتًا'
    },
    edit: {
      title: 'الإشعارات والتذكيرات',
      subtitle: 'أديري التذكيرات التي تدعم متابعتك بعد الولادة.'
    },
    onboarding: {
      title: 'حافظي على انتظام متابعتك',
      subtitle: 'فعّلي تذكيرًا إن رغبتِ في لحظة كل يوم لإكمال متابعتك بعد الولادة.',
      infoText: 'يمكنك تغيير هذا الإعداد في أي وقت من تفضيلاتك.',
      skip: 'ليس الآن'
    }
  },
  postpartumLochia: {
    notProvided: 'غير محدد',
    header: {
      title: 'الهلابة',
      infoAccessibilityLabel: 'اعرفي المزيد عن الهلابة'
    },
    date: {
      eyebrow: 'اليوم'
    },
    duration: {
      title: 'مدة الهلابة',
      subtitleNoData: 'لم تُسجَّل أي ملاحظة بعد.',
      subtitleEnded: 'انتهت في {{date}}',
      subtitleOngoing: 'المتابعة الطبية جارية',
      metrics: {
        start: 'البداية',
        lastRecorded: 'آخر تسجيل',
        duration: 'المدة',
        daysValue: '{{days}} أيام'
      },
      editEndDate: 'تعديل تاريخ الانتهاء',
      resumeTracking: 'استئناف المتابعة',
      finishedTracking: 'انتهت الهلابة لديّ'
    },
    sections: {
      flow: 'التدفّق',
      color: 'اللون',
      consistency: 'القوام',
      symptoms: 'الأعراض المصاحبة',
      notes: 'ملاحظات'
    },
    notes: {
      placeholder: 'أضيفي ملاحظة إن رغبتِ...'
    },
    reassuranceText: 'اكتفي بملاحظة كيف تتطور الأمور يومًا بعد يوم. كل جسم يتعافى بإيقاعه الخاص.',
    modals: {
      closeConfirmationAccessibilityLabel: 'إغلاق التأكيد'
    },
    finishModal: {
      title: 'إنهاء متابعة الهلابة؟',
      textBefore: '',
      textAfter: 'سيُسجَّل كتاريخ انتهاء الهلابة لديك.',
      editDate: 'تعديل التاريخ',
      infoText: 'يمكنك تغيير هذا التاريخ لاحقًا أو استئناف المتابعة عند الحاجة.',
      confirm: 'تأكيد'
    },
    reopenModal: {
      title: 'استئناف المتابعة؟',
      text: 'سيُحذف تاريخ انتهاء الهلابة وتصبح المتابعة نشطة من جديد.',
      infoText: 'ستُحفظ ملاحظاتك المسجّلة سابقًا. يمكنك مواصلة المتابعة بدءًا من اليوم.',
      confirm: 'استئناف'
    },
    saveConfirmation: {
      text: 'تم حفظ ملاحظات اليوم.'
    },
    reopenConsistency: {
      title: 'راجعي متابعتك',
      message: 'هناك عودة للدورة مسجّلة بالفعل بينما تريدين استئناف متابعة الهلابة.',
      infoText: 'قد تصبح هاتان المعلومتان غير متسقتين. راجعي متابعتك قبل المتابعة.',
      primaryLabel: 'عرض عودة الدورة'
    },
    picker: {
      title: 'تاريخ انتهاء الهلابة',
      subtitle: 'أدخلي آخر يوم للهلابة لديك.'
    },
    endDateError: {
      title: 'تاريخ يحتاج إلى مراجعة',
      infoText: 'يجب أن يقع تاريخ الانتهاء بين ولادتك واليوم، وألا يأتي بعد تاريخ عودة حيضك إن كان مسجّلًا.',
      primaryLabel: 'تعديل التاريخ'
    }
  },
  miscarriageJournalConfig: {
    items: {
      bleeding: {
        label: 'النزف',
        dashboardLabel: 'النزف',
        journalSubtitle: 'دوّني شدة نزفك اليوم'
      },
      physicalSymptoms: {
        label: 'الأعراض الجسدية',
        dashboardLabel: 'الأعراض\nالجسدية',
        journalSubtitle: 'دوّني الأعراض التي تشعرين بها اليوم'
      },
      personalNotes: {
        label: 'ملاحظات شخصية',
        dashboardLabel: 'ملاحظات\nشخصية',
        journalSubtitle: 'مساحة خاصة لكل ما تودّين تدوينه'
      },
      tryingAgain: {
        label: 'المحاولة من جديد',
        dashboardLabel: 'المحاولة\nمن جديد',
        journalSubtitle: 'كيف تشعرين تجاه هذا الأمر اليوم؟'
      }
    }
  },
  miscarriageTryingAgain: {
    title: 'هل تودّين بدء\nمحاولة الإنجاب من جديد؟',
    subtitle: 'يساعدنا هذا الاختيار على تخصيص دعمنا لك. أنتِ حرّة دائمًا في السير بإيقاعك الخاص.',
    illustrationAccessibility: 'امرأة في وضعية هادئة',
    options: {
      not_now: {
        label: 'ليس الآن',
        subtitle: 'أفضّل أن آخذ بعض الوقت لنفسي'
      },
      soon: {
        label: 'قريبًا',
        subtitle: 'بدأتُ أفكر في الأمر بجدّية'
      },
      ready: {
        label: 'نعم، أشعر أنني مستعدة',
        subtitle: 'أريد البدء بالمحاولة من جديد'
      }
    },
    reassurance: 'لستِ وحدك 💜 نحن هنا لدعمك في كل خطوة.',
    saving: 'جارٍ الحفظ…',
    finish: 'إنهاء',
    display: {
      ready: 'مستعدة للمحاولة من جديد',
      neutral: 'ليس الآن',
      unknown: 'غير محدد'
    }
  },
  miscarriageDate: {
    title: 'متى حدث\nفقدان حملك؟',
    subtitle: 'يساعدنا هذا التاريخ على مرافقة رحلتك منذ هذا الحدث.',
    illustrationAccessibility: 'تقويم يتوسطه قلب',
    selectedLabel: 'التاريخ المحدد',
    modify: 'تعديل',
    infoText: 'يمكنك دائمًا تغيير هذا التاريخ لاحقًا.',
    saving: 'جارٍ الحفظ…',
    next: 'التالي',
    conflicts: {
      cycleReturn: 'هذا التاريخ يلي تاريخ عودة الدورة الذي سجّلتِه بالفعل ({{date}}). صحّحي عودة دورتك أولًا، ثم عودي لتعديل تاريخ فقدان الحمل.',
      journal_one: 'تحتوي يومياتك بالفعل على تسجيل بتاريخ {{date}}، قبل هذا التاريخ. اختاري تاريخًا يوافق ذلك التسجيل أو يسبقه — لا يُعدَّل سجلّك ولا يُحذف أبدًا.',
      journal_other: 'تحتوي يومياتك بالفعل على {{count}} يوم مسجّل قبل هذا التاريخ (أولها: {{date}}). اختاري تاريخًا يوافق أول تسجيل أو يسبقه — لا يُعدَّل سجلّك ولا يُحذف أبدًا.',
      journal_zero: 'تحتوي يومياتك بالفعل على {{count}} يوم مسجّل قبل هذا التاريخ (أولها: {{date}}). اختاري تاريخًا يوافق أول تسجيل أو يسبقه — لا يُعدَّل سجلّك ولا يُحذف أبدًا.',
      journal_two: 'تحتوي يومياتك بالفعل على يومين مسجّلين ({{count}}) قبل هذا التاريخ (أولهما: {{date}}). اختاري تاريخًا يوافق أول تسجيل أو يسبقه — لا يُعدَّل سجلّك ولا يُحذف أبدًا.',
      journal_few: 'تحتوي يومياتك بالفعل على {{count}} أيام مسجّلة قبل هذا التاريخ (أولها: {{date}}). اختاري تاريخًا يوافق أول تسجيل أو يسبقه — لا يُعدَّل سجلّك ولا يُحذف أبدًا.',
      journal_many: 'تحتوي يومياتك بالفعل على {{count}} يومًا مسجّلًا قبل هذا التاريخ (أولها: {{date}}). اختاري تاريخًا يوافق أول تسجيل أو يسبقه — لا يُعدَّل سجلّك ولا يُحذف أبدًا.'
    }
  },
  miscarriageBleeding: {
    title: 'هل ما زال\nلديك نزف؟',
    subtitle: 'يساعدنا هذا على دعمك بشكل أفضل في هذه الفترة.',
    illustrationAccessibility: 'قطرة ترمز إلى النزف',
    options: {
      yes: {
        title: 'نعم',
        subtitle: 'ما زال لديّ نزف'
      },
      no: {
        title: 'لا',
        subtitle: 'لم يعد لديّ نزف'
      },
      variable: {
        title: 'لستُ متأكدة / يتفاوت',
        subtitle: 'غير منتظم'
      }
    },
    infoText: 'يمكنك تدوين التفاصيل (الشدة، اللون، المدة…) في يومياتك.',
    saving: 'جارٍ الحفظ…',
    next: 'التالي'
  },
  miscarriageCycleReturn: {
    title: 'هل عاد حيضك\nمنذ ذلك الحين؟',
    subtitle: 'يساعدنا هذا على متابعة عودة دورتك بلطف.',
    illustrationAccessibility: 'تقويم يتوسطه قلب',
    options: {
      yes: {
        title: 'نعم',
        subtitle: 'عاد حيضي'
      },
      no: {
        title: 'لا',
        subtitle: 'لم يعد حيضي بعد'
      },
      unknown: {
        title: 'لا أعرف بعد',
        subtitle: 'لستُ متأكدة'
      }
    },
    invalidDateTitle: 'تاريخ غير صالح',
    dateField: {
      accessibilityLabel: 'تاريخ أول يوم عاد فيه حيضك',
      label: 'تاريخ أول يوم عاد فيه حيضك',
      optional: '(اختياري)',
      placeholder: 'DD / MM / YYYY'
    },
    dateWarning: 'تاريخ يحتاج إلى مراجعة: {{message}} اختاري تاريخًا صالحًا أو أزيليه للحفظ.',
    removeDate: 'إزالة التاريخ',
    saving: 'جارٍ الحفظ…',
    next: 'التالي',
    pickerTitle: 'عودة حيضك',
    pickerSubtitle: 'حدّدي أول يوم عاد فيه حيضك منذ فقدان حملك.',
    statusLabels: {
      no: 'لم يعد الحيض بعد',
      yes: 'عاد الحيض',
      unknown: 'لستُ متأكدة بعد'
    },
    dateErrors: {
      future: 'لا يمكن أن يكون تاريخ أول عودة لحيضك في المستقبل.',
      beforeLoss: 'لا يمكن أن يسبق تاريخ أول عودة لحيضك تاريخ فقدان حملك.',
      invalid: 'تاريخ أول عودة لحيضك غير صالح.'
    }
  },
  miscarriageCalendar: {
    subtitle: 'تابعي تقدّمك بإيقاعك الخاص',
    categories: {
      bleeding: {
        description: 'شدة النزف المسجّلة في يومياتك.'
      },
      physicalSymptoms: {
        description: 'الأعراض الجسدية التي شعرتِ بها، مسجّلة يومًا بيوم.',
        empty: 'لا شيء'
      },
      personalNotes: {
        description: 'كُتبت ملاحظة شخصية في ذلك اليوم.',
        empty: 'لا ملاحظة'
      },
      tryingAgain: {
        description: 'إجابتك عن «المحاولة من جديد» المسجّلة في يومياتك ذلك اليوم.'
      }
    },
    today: 'اليوم',
    noteRecorded: 'تم تسجيل ملاحظة واحدة',
    daysSinceEvent: 'الأيام منذ الحدث',
    notProvidedFeminine: 'غير محدد',
    sameDay: 'اليوم نفسه',
    dateToCheckSuffix: ' · تاريخ يحتاج إلى مراجعة',
    lossEventBadge: 'الحدث الأول',
    cycleReturnBadge: 'عاد الحيض',
    emptyText: 'لا توجد معلومات مسجّلة لهذا اليوم.',
    addToJournal: 'إضافة إلى اليوميات',
    modify: 'تعديل',
    pastEntryAccessibility: '{{action}}: {{label}} لهذا اليوم',
    dayAccessibility: {
      lossEvent: '، الحدث الأول',
      cycleReturn: '، عاد الحيض'
    },
    filtersSheet: {
      title: 'عوامل تصفية التقويم',
      subtitle: 'اختاري المعلومات التي تظهر في تقويمك.'
    },
    legendSheet: {
      title: 'دليل التقويم',
      subtitle: 'افهمي الألوان والعلامات المستخدمة.',
      ramadanDescription: 'يقع هذا اليوم ضمن شهر رمضان (الصيام).',
      dhoulHijjaDescription: 'يقع هذا اليوم ضمن شهر ذي الحجة.',
      todayDescription: 'يحدّد الإطار الأسود المتقطع تاريخ اليوم.',
      closeAccessibility: 'إغلاق الدليل'
    }
  },
  miscarriageDashboard: {
    headerSubtitle: 'اعتني بنفسك، بإيقاعك الخاص.',
    hero: {
      title: 'كيف تشعرين اليوم؟',
      subtitle: 'كل يوم له قيمته — سيري بإيقاعك الخاص.',
      sinceLoss: 'منذ فقدانك',
      cycleReturn: 'عودة دورتك',
      cycleReturnHint: 'تعديل عودة دورتي',
      supportText: 'تتكيّف متابعتك مع تقدّمك، يومًا بعد يوم.'
    },
    today: 'اليوم',
    daysCount_one: 'يوم واحد',
    daysCount_other: '{{count}} يوم',
    daysCount_zero: '{{count}} يوم',
    daysCount_two: 'يومان',
    daysCount_few: '{{count}} أيام',
    daysCount_many: '{{count}} يومًا',
    notProvided: 'غير مذكور',
    sinceDate: 'منذ {{date}}',
    unconfigured: {
      eyebrow: 'خصّصي متابعتك',
      title: 'حدّدي تاريخ فقدان حملك',
      text: 'يساعدنا هذا التاريخ على تكييف دعمنا لك يومًا بعد يوم.',
      button: 'إدخال التاريخ',
      buttonAccessibility: 'إدخال التاريخ'
    },
    conceiveTransition: {
      title: 'استئناف رحلتك نحو الحمل',
      text: 'إن رغبتِ، يمكنك الانتقال إلى متابعة محاولة الحمل.',
      button: 'الانتقال إلى متابعة الحمل'
    },
    conceiveTransitionModal: {
      title: 'الانتقال إلى متابعة الحمل؟',
      message: 'يمكنك البدء بمتابعة رحلتك لمحاولة الحمل. ستبقى بياناتك من رحلة فقدان الحمل محفوظة، ويمكنك الرجوع إليها في أي وقت.',
      dataKept: 'بياناتك محفوظة',
      confirmAccessibility: 'المتابعة والانتقال إلى متابعة الحمل'
    },
    daily: {
      title: 'متابعة اليوم',
      subtitle: 'كيف تشعرين اليوم؟',
      completed: 'مكتملة',
      filled: 'مسجّل',
      openJournal: 'فتح اليوميات',
      openJournalSubtitle: 'أكملي متابعتك في لحظات'
    },
    quickActions: {
      qadaa: 'صيام للقضاء'
    }
  },
  miscarriageJournalEntry: {
    dateInvalid: 'هذا التاريخ غير صالح.',
    pastDayNotSupported: 'يمكن تعبئة هذا القسم لليوم الحالي فقط.',
    subtitleToday: 'اليوم  •  {{date}}',
    subtitlePast: 'يوم {{date}}',
    dateErrors: {
      future: 'لا يمكنك تسجيل المتابعة لتاريخ في المستقبل.',
      beforeLoss: 'لا يمكنك تسجيل المتابعة لتاريخ سابق لفقدان حملك.'
    },
    errors: {
      chooseIntensity: 'اختاري الشدة قبل الحفظ.',
      chooseSymptom: 'اختاري عرضًا واحدًا على الأقل قبل الحفظ.',
      addNote: 'أضيفي ملاحظة قبل الحفظ.',
      chooseAnswer: 'اختاري إجابة قبل الحفظ.'
    },
    toasts: {
      bleedingSaved: {
        title: 'تم حفظ النزف',
        message: 'تم تحديث متابعتك.'
      },
      symptomsCleared: {
        title: 'تم مسح الأعراض'
      },
      symptomsSaved: {
        title: 'تم حفظ الأعراض',
        message: 'تم تحديث متابعتك.'
      },
      noteCleared: {
        title: 'تم مسح الملاحظة',
        message: 'تم مسح ملاحظتك الشخصية.'
      },
      noteSaved: {
        title: 'تم حفظ الملاحظة',
        message: 'تم حفظ ملاحظتك الشخصية.'
      },
      tryingAgainSaved: {
        title: 'تم حفظ المعلومة',
        message: 'تم تحديث متابعتك.'
      }
    },
    optionalAndPrivate: 'اختياري وخاص',
    private: 'خاص',
    bleeding: {
      flow: {
        title: 'التدفّق',
        subtitle: 'اختاري شدة اليوم'
      },
      color: {
        title: 'اللون',
        subtitle: 'حدّدي اللون الذي لاحظتِه',
        optionAccessibility: 'اللون {{label}}'
      },
      duration: {
        title: 'المدة',
        subtitle: 'منذ متى لاحظتِه؟',
        since: 'منذ',
        chooseDateAccessibility: 'اختيار تاريخ البداية'
      },
      notes: {
        title: 'ملاحظات',
        placeholder: 'كيف تشعرين اليوم؟'
      }
    },
    symptoms: {
      hero: {
        title: 'كيف تشعرين؟',
        subtitle: 'اختاري الأعراض التي تشعرين بها اليوم.'
      },
      section: {
        title: 'الأعراض التي شعرتِ بها',
        subtitle: 'يمكنك اختيار أكثر من عرض'
      },
      selectedSummary_one: '{{count}} عرض محدد',
      selectedSummary_other: '{{count}} عرض محدد',
      selectedSummary_zero: '{{count}} عرض محدد',
      selectedSummary_two: 'عرضان محددان',
      selectedSummary_few: '{{count}} أعراض محددة',
      selectedSummary_many: '{{count}} عرضًا محددًا',
      note: {
        title: 'أضيفي تفصيلًا',
        placeholder: 'الشدة، المدة، وقت اليوم، أو أي تفصيل آخر…'
      },
      infoPanel: {
        title: 'متابعتك',
        text: 'تساعدك هذه المتابعة على ملاحظة تقدّمك على مدى الأيام.'
      }
    },
    personalNotes: {
      hero: {
        title: 'مساحتك الشخصية',
        subtitle: 'مكان هادئ وخاص تضعين فيه ما تشعرين به.'
      },
      editor: {
        title: 'ما أودّ تدوينه',
        subtitle: 'اكتبي بحرية، وبالوتيرة التي تناسبك',
        placeholder: 'اكتبي بحرية عمّا تشعرين به اليوم — فكرة، أو إحساس، أو شيء تودّين الاحتفاظ به ببساطة…'
      },
      encouragement: 'تكفي بضع كلمات. لا توجد طريقة مثالية للتعبير عمّا تشعرين به.',
      infoPanel: {
        title: 'كل خطوة لها قيمتها',
        text: 'أصغي إلى نفسك بلطف، وتقدّمي بالوتيرة التي تناسبك.'
      }
    },
    tryingAgain: {
      hero: {
        title: 'أين أنتِ اليوم؟',
        subtitle: 'لا توجد إجابة صحيحة أو خاطئة. اختاري فقط ما يناسبك.'
      },
      section: {
        subtitle: 'هذا الاختيار يخصّص دعمك فقط'
      },
      infoPanel: {
        title: 'بلا ضغط',
        text: 'اختيارك لا يغيّر هدفك تلقائيًا أبدًا. أنتِ حرّة دائمًا في التقدّم بالوتيرة التي تناسبك.'
      }
    }
  },
  miscarriageReminders: {
    chooseTimeError: 'اختاري وقتًا لتذكير المتابعة اليومية.',
    editTitle: 'الإشعارات والتذكيرات',
    editSubtitle: 'أدِيري التذكير الذي يرافقك في متابعتك، بالوتيرة التي تناسبك.',
    dailyTracking: 'المتابعة اليومية',
    dailyTrackingDescription: 'تذكير لطيف لتخصيص لحظة لمتابعتك.',
    timeAccessibility: 'وقت التذكير، {{time}}',
    chooseTime: 'اختيار وقت التذكير',
    timeLabel: 'وقت التذكير',
    choose: 'اختيار',
    permissionNotice: 'فعّلي الإشعارات من إعدادات هاتفك لتصلك تذكيراتك.',
    saving: 'جارٍ الحفظ…',
    title: 'تذكير صغير لكِ؟',
    subtitle: 'إن رغبتِ، يمكن لـ AWA تذكيرك مرة في اليوم لتخصيص لحظة لمتابعتك.',
    enableDailyReminder: 'تفعيل التذكير اليومي',
    chooseTimeAccessibility: 'اختيار وقت التذكير',
    chooseTimeLong: 'اختيار وقت',
    infoText: 'يمكنك تغيير هذا الإعداد في أي وقت من تفضيلاتك.',
    continue: 'متابعة',
    notNow: 'ليس الآن'
  },
  miscarriageStatistics: {
    header: {
      title: 'الإحصاءات',
      subtitle: 'تقدّمك، بالوتيرة التي تناسبك'
    },
    objectiveLabel: 'الهدف الحالي',
    emptyTitle: 'لا توجد بيانات بعد',
    monthlyEmptyText: 'لا توجد بيانات كافية بعد لسجل شهري.',
    monthlySubtitle: 'الاتجاه الشهري على مدى الفترة المحددة',
    cycleReturnLabel: 'عودة دورتك',
    tryingAgainLabel: 'محاولة جديدة',
    daysWithSymptomsLabel: 'أيام ظهرت فيها أعراض',
    notProvided: 'غير مذكور',
    daysCount_one: '{{count}} يوم',
    daysCount_other: '{{count}} يوم',
    daysCount_zero: '{{count}} يوم',
    daysCount_two: 'يومان',
    daysCount_few: '{{count}} أيام',
    daysCount_many: '{{count}} يومًا',
    tabs: {
      summary: 'الملخص',
      bleeding: 'النزف',
      symptoms: 'الأعراض',
      tracking: 'المتابعة'
    },
    cycleReturn: {
      labels: {
        no: 'لم تعد بعد',
        yes: 'عادت',
        unknown: 'لستُ متأكدة بعد'
      }
    },
    tryingAgain: {
      labels: {
        not_now: 'ليس الآن',
        soon: 'قريبًا',
        ready: 'مستعدة للمحاولة من جديد'
      }
    },
    summary: {
      overviewSubtitle: 'منذ فقدان حملك',
      overviewTitle: 'نظرة عامة',
      kpi: {
        daysSinceEvent: 'أيام منذ فقدان حملك',
        trackedDays: 'الأيام المتابَعة',
        completeDays: 'السجلات المكتملة',
        bleedingDays: 'أيام النزف'
      },
      bleedingEvolutionTitle: 'تطوّر النزف',
      bleedingEvolutionSubtitleMonthly: 'متوسط الشدة حسب الشهر',
      bleedingEvolutionSubtitleDaily: 'الشدة المسجّلة يومًا بيوم',
      bleedingEmptyText: 'سجّلي نزفك في يومياتك لترَي كيف يتطوّر.',
      adviceTitle: 'بالوتيرة التي تناسبك',
      adviceText: 'اعتني بنفسك، بالوتيرة التي تناسبك. كل خطوة لها قيمتها.'
    },
    bleeding: {
      title: 'النزف',
      emptyText: 'سجّلي نزفك في يومياتك لترَي تطوّره هنا.',
      kpi: {
        mostFrequentIntensity: 'الشدة الأكثر تكرارًا',
        recordedDays: 'الأيام المسجّلة'
      },
      evolutionTitle: 'تطوّر التدفّق',
      evolutionSubtitleDaily: 'التسلسل المسجّل',
      distributionTitle: 'توزيع الشدة',
      distributionSubtitle: 'بناءً على سجلاتك',
      infoText: 'هذه المتابعة مرجع شخصي. قد يختلف التعافي من امرأة إلى أخرى.'
    },
    symptoms: {
      title: 'الأعراض الجسدية',
      emptyText: 'سجّلي أعراضك في يومياتك لتتابعي مدى تكرارها.',
      kpi: {
        mostFrequentSymptom: 'العرض الأكثر تكرارًا'
      },
      frequencyTitle: 'تكرار الأعراض',
      frequencySubtitleDaily: 'بناءً على أيامك المسجّلة'
    },
    tracking: {
      notesTitle: 'ملاحظات شخصية',
      notesSubtitle: 'مساحة خاصة وشخصية',
      notesCount_one: 'ملاحظة مسجّلة',
      notesCount_other: 'ملاحظة مسجّلة',
      notesCount_zero: 'ملاحظات مسجّلة',
      notesCount_two: 'ملاحظتان مسجّلتان',
      notesCount_few: 'ملاحظات مسجّلة',
      notesCount_many: 'ملاحظةً مسجّلة',
      tryingAgainSubtitle: 'بالوتيرة التي تناسبك',
      currentStatusLabel: 'الحالة الحالية',
      cycleReturnSubtitle: 'نقطة مرجعية في متابعتك',
      datePillText: 'عودة الدورة: {{date}}',
      coverageAccessibility: 'محطات عودة الدورة المسجّلة خلال {{periodLabel}}',
      coverageSubtitle: 'المحطات المسجّلة عبر الزمن',
      confirmedLabel: 'تأكّدت عودة الدورة',
      confirmedText: 'دوّنتِ أن دورتك عادت في {{date}}.',
      noCycleReturnText: 'لا توجد عودة مؤكدة للدورة خلال {{periodLabel}}.',
      infoText: 'عودة دورتك لا تغيّر خطة رعايتك الحالية تلقائيًا.'
    }
  },
  postpartumJournalEntry: {
    errors: {
      fatigue: 'اختاري مستوى التعب قبل الحفظ.',
      mood: 'اختاري المزاج قبل الحفظ.',
      sleep: 'اختاري جودة النوم قبل الحفظ.',
      pain: 'اختاري مستوى الألم قبل الحفظ.',
      physicalRecovery: 'اختاري مستوى التعافي قبل الحفظ.'
    },
    toast: {
      dailyUpToDate: 'متابعتك اليومية محدَّثة.',
      cleared: 'تم مسح الإجابة',
      saved: {
        fatigue: 'تم حفظ التعب',
        mood: 'تم حفظ المزاج',
        sleep: 'تم حفظ النوم',
        pain: 'تم حفظ الألم',
        physicalRecovery: 'تم حفظ التعافي'
      }
    },
    categoryTitle: {
      mood: 'المزاج',
      sleep: 'النوم',
      fatigue: 'التعب',
      pain: 'الألم',
      physicalRecovery: 'التعافي الجسدي',
      fallback: 'المتابعة'
    },
    dateLabel: {
      withDay: '{{base}} · اليوم {{day}} بعد الولادة'
    },
    mood: {
      heroTitle: 'كيف تشعرين اليوم؟',
      heroText: 'خذي لحظة للإقرار بما تشعرين به.',
      mainMoodTitle: 'المزاج الرئيسي',
      noteTitle: 'ملاحظة عن مزاجك',
      notePlaceholder: 'اكتبي ما تودّين تذكّره...',
      noteCounter: '{{count}} / 300',
      infoTitle: 'كل شعور له قيمته',
      infoText: 'أصغي إلى نفسك بلطف، وبالوتيرة التي تناسبك.'
    },
    sleep: {
      heroTitle: 'اعتني براحتك',
      heroText: 'الراحة الجيدة تدعم تعافيك وطاقتك.',
      durationTitle: 'مدة النوم',
      decreaseDurationLabel: 'إنقاص المدة بمقدار 30 دقيقة',
      increaseDurationLabel: 'زيادة المدة بمقدار 30 دقيقة',
      qualityTitle: 'جودة النوم',
      infoTitle: 'اعتني بنفسك',
      infoText: 'من الطبيعي أن يكون النوم غير منتظم بعد الولادة. ينتظم جسمك تدريجيًا.'
    },
    fatigue: {
      heroTitle: 'كيف هي طاقتك؟',
      heroText: 'يمرّ جسمك بتغيّرات كثيرة. خذي وقتك للإصغاء إليه.',
      adviceTitle: 'طاقتك مهمة',
      adviceText: 'متابعة تعبك تساعدك على موازنة راحتك بشكل أفضل وطلب الدعم عند الحاجة.',
      levelTitle: 'مستوى التعب',
      infoTitle: 'طاقتك',
      infoText: 'متابعة تعبك تساعدك على موازنة راحتك بشكل أفضل.'
    },
    pain: {
      heroTitle: 'كيف تشعرين\nفي جسمك؟',
      heroText: 'تدوين شعورك بالراحة يساعدك على فهم احتياجاتك بشكل أفضل مع الوقت.',
      adviceTitle: 'بلطف',
      adviceText: 'هذه المتابعة نقطة مرجعية شخصية. إذا كان الألم شديدًا أو جديدًا أو مقلقًا، فتواصلي مع المختص في الرعاية الصحية.',
      levelTitle: 'مستوى الألم',
      infoTitle: 'متابعتك',
      infoText: 'هذه المتابعة مجرد نقطة مرجعية شخصية، وليست تشخيصًا.'
    },
    physicalRecovery: {
      heroTitle: 'كيف يسير تعافيك؟',
      heroText: 'تُبنى عافيتك يومًا بيوم، دون ضغط.',
      adviceTitle: 'بالوتيرة التي تناسبك',
      adviceText: 'كل جسم يتعافى بوتيرته الخاصة بعد الولادة. احتفي بالخطوات الصغيرة وكوني لطيفة مع نفسك.',
      infoTitle: 'بالوتيرة التي تناسبك',
      infoText: 'كل جسم يتعافى بوتيرته الخاصة بعد الولادة.'
    },
    fatigueRatings: {
      none: {
        description: 'أشعر بالنشاط والراحة.'
      },
      light: {
        description: 'قليل من الراحة سيفيدني.'
      },
      moderate: {
        description: 'أبطئ وأصغي إلى جسمي.'
      },
      strong: {
        description: 'أحتاج إلى فترات راحة أكثر تكرارًا.'
      },
      veryStrong: {
        description: 'أعطي الأولوية للراحة والدعم.'
      }
    },
    painRatings: {
      none: {
        description: 'أشعر بالراحة اليوم.'
      },
      light: {
        description: 'انزعاج موجود لكنه محتمل.'
      },
      moderate: {
        description: 'أمنح نفسي الهدوء وفترات الراحة.'
      },
      strong: {
        description: 'يحتاج الألم إلى انتباه خاص.'
      },
      veryStrong: {
        description: 'لا تترددي في التواصل مع مختص.'
      }
    },
    recoveryRatings: {
      difficult: {
        description: 'آخذ الوقت الذي يحتاجه جسمي.'
      },
      slow: {
        description: 'كل خطوة صغيرة لها قيمتها.'
      },
      stable: {
        description: 'أستعيد توازني تدريجيًا.'
      },
      good: {
        description: 'ألمس تغيّرًا إيجابيًا.'
      },
      veryGood: {
        description: 'أشعر بتحسّن متزايد.'
      }
    }
  },
  postpartumJournalConfig: {
    items: {
      fatigue: {
        label: 'التعب',
        journalSubtitle: 'قيّمي مستوى تعبك اليوم'
      },
      sleep: {
        label: 'النوم',
        journalSubtitle: 'مدة نومك وجودته'
      },
      mood: {
        label: 'المزاج',
        journalSubtitle: 'كيف تشعرين اليوم؟'
      },
      pain: {
        label: 'الألم',
        journalSubtitle: 'دوّني الألم الذي تشعرين به اليوم'
      },
      physicalRecovery: {
        label: 'التعافي الجسدي',
        dashboardLabel: 'التعافي',
        journalSubtitle: 'كيف يتقدّم تعافيك؟'
      }
    }
  },
  postpartumJournalScreenLayout: {
    saving: 'جارٍ الحفظ…'
  },
  postpartumCycleStyleJournalLayout: {
    saving: 'جارٍ الحفظ…',
    clearAnswer: 'مسح إجابتي',
    optionalSuffix: '(اختياري)'
  },
  postpartumWellnessRatingLayout: {
    kicker: 'متابعة ما بعد الولادة',
    sectionTitle: 'اختاري ما يشبهك أكثر',
    sectionText: 'لا توجد إجابة صحيحة أو خاطئة: راقبي نفسك بلطف.',
    saving: 'جارٍ الحفظ…',
    saveButtonLabel: 'حفظ متابعتي',
    clearAnswer: 'مسح إجابتي'
  },
  postpartumConsistencyModal: {
    closeBackdropLabel: 'إغلاق التنبيه'
  },
  objectiveConfirmation: {
    changeAnytime: 'يمكنكِ تغيير أهدافكِ في أي وقت.',
    cycle: {
      title: 'رائع! 🎉',
      description: 'لقد اخترتِ متابعة الدورة الكلاسيكية.',
      nextStep: 'ستتمكنين من تخصيص متابعتك وإضافة أولى معلوماتك في الخطوة التالية.',
      buttonLabel: 'ابدئي متابعتي'
    },
    conceive: {
      title: 'رائع! 🎉',
      description: 'لقد اخترتِ متابعة ترافقك في رحلتك نحو الحمل.',
      nextStep: 'سنخصّص متابعة خصوبتك وإباضتك ودورتك لتناسب احتياجاتك.',
      buttonLabel: 'إعداد متابعتي'
    },
    contraception: {
      title: 'رائع! 🎉',
      description: 'لقد اخترتِ متابعة تناسب وسيلة منع الحمل لديك.',
      nextStep: 'ستتمكنين من إدخال نوع وسيلة منع الحمل وتخصيص متابعة دورتك.',
      buttonLabel: 'إعداد متابعتي'
    },
    irregular: {
      title: 'رائع! 🎉',
      description: 'لقد اخترتِ متابعة تساعدك على فهم دوراتك غير المنتظمة بشكل أفضل.',
      nextStep: 'سنكيّف متابعتك لملاحظة دوراتك وأعراضك واتجاهاتها مع الوقت.',
      buttonLabel: 'إعداد متابعتي'
    },
    menopause: {
      title: 'رائع! 🎉',
      description: 'لقد اخترتِ متابعة تناسب انقطاع الطمث.',
      nextStep: 'ستتمكنين من متابعة عافيتك وأعراضك والتغيّرات التي تلاحظينها يومًا بيوم.',
      buttonLabel: 'ابدئي متابعتي'
    },
    pregnancy: {
      title: 'رائع! 🎉',
      description: 'لقد اخترتِ متابعة الحمل.',
      nextStep: 'سنخصّص دعمك لمرافقة حملك أسبوعًا بعد أسبوع.',
      buttonLabel: 'ابدئي متابعتي'
    },
    postpartum: {
      title: 'رائع! 💜',
      description: 'لقد اخترتِ الدعم بعد الولادة.',
      nextStep: 'سيرافقك AWA في تعافيك، ومتابعة الهلابة، وعافيتك اليومية، وعودة دورتك تدريجيًا.',
      buttonLabel: 'ابدئي متابعتي'
    },
    loss: {
      title: 'متابعتك جاهزة',
      description: 'لقد اخترتِ المتابعة بعد فقدان الحمل.',
      nextStep: 'سنكيّف مساحة متابعتك لتناسب تعافيك وعافيتك.',
      buttonLabel: 'ابدئي متابعتي'
    }
  },
  objectiveScreen: {
    title: 'ما هو\nهدفك الرئيسي؟',
    next: 'التالي',
    menopauseLabel: 'ما قبل انقطاع الطمث / انقطاع الطمث',
    postpartumLabel: 'ما بعد الولادة'
  },
  notificationPermission: {
    blockedTitle: 'الإشعارات متوقفة',
    blockedBody: 'لا يستطيع AWA عرض تذكيراتك حتى يتم السماح بالإشعارات من إعدادات هاتفك.',
    channelBlockedTitle: 'التذكيرات محظورة',
    channelBlockedBody: 'فئة تذكيرات AWA محظورة في إعدادات هاتفك، لذلك لن تظهر التذكيرات.',
    openSettings: 'فتح إعدادات الإشعارات',
    recheck: 'لقد فعّلتُها',
    stillOff: 'الإشعارات ما زالت متوقفة.',
    nowOn: 'الإشعارات مفعّلة. ستتم جدولة تذكيراتك.',
    continueWithout: 'المتابعة بدون إشعارات',
    channelSilentTitle: 'قد تصل التذكيرات بلا صوت',
    channelSilentBody: 'فئة تذكيرات AWA صامتة على هذا الهاتف، لذلك تظهر التذكيرات بلا صوت. قد يكون ذلك اختيارك، ولن يغيّره AWA. إذا أردتِ سماعها، يمكنك تفعيل الصوت بنفسك.',
    channelSilentSteps: 'في Android: الإعدادات > الإشعارات > {{channel}} > الصوت.'
  },
  notifications: {
    privacyGenericBody: 'لديك تذكير جديد من AWA.',
    channelName: 'تذكيرات AWA',
    fallbackTitle: 'تذكير من AWA',
    fallbackBody: 'يتوفر تذكير جديد.',
    cycle: {
      upcomingPeriod: {
        title: 'حيضك قريب 🌸',
        body: 'أبقي ما تحتاجينه في متناول يدك، تحسّبًا.'
      },
      upcomingPeriodDaughter: {
        title: 'متابعة {{firstName}}',
        body: 'يُقدَّر موعد حيضها القادم بعد بضعة أيام.'
      },
      periodStartCheck: {
        title: 'هل بدأ حيضك؟',
        body: 'سجّلي تاريخ البداية لتبقى متابعتك محدَّثة.'
      },
      periodStartCheckDaughter: {
        title: 'دورة {{firstName}}',
        body: 'يمكنك التحقق مما إذا كان حيضها قد بدأ.'
      },
      dailyJournal: {
        title: 'كيف تشعرين اليوم؟',
        body: 'خذي لحظة لتحديث متابعتك.'
      },
      dailyJournalDaughter: {
        title: 'يوميات {{firstName}}',
        body: 'تذكّري إكمال يومياتها لليوم.'
      },
      fertileWindow: {
        title: 'فترة خصوبتك المقدَّرة تقترب',
        body: 'بناءً على بيانات دورتك، تبدأ فترة خصوبتك المقدَّرة قريبًا.'
      },
      fertileWindowDaughter: {
        title: 'دورة {{firstName}}',
        body: 'فترة خصوبتها المقدَّرة تقترب.'
      },
      ovulation: {
        title: 'الإباضة المقدَّرة 🌸',
        body: 'بناءً على متابعتك، يُقدَّر أن تحدث إباضتك قريبًا.'
      },
      ovulationDaughter: {
        title: 'دورة {{firstName}}',
        body: 'يُقدَّر أن تحدث إباضتها قريبًا.'
      }
    },
    conception: {
      fertileWindow: {
        title: 'تبدأ فترة خصوبتك',
        body: 'يصادف اليوم بداية أكثر فتراتك خصوبة في هذه الدورة.'
      },
      estimatedOvulation: {
        title: 'الإباضة المقدَّرة اليوم',
        body: 'يُقدَّر أن تحدث إباضتك اليوم، بناءً على دورتك.'
      },
      lhTest: {
        title: 'حان وقت اختبار الإباضة (LH)',
        body: 'هذا وقت مناسب لإجراء اختبار LH.'
      },
      temperature: {
        title: 'درجة الحرارة القاعدية',
        body: 'لا تنسي قياس حرارتك قبل النهوض من الفراش.'
      },
      dailyJournal: {
        title: 'اليوميات',
        body: 'خذي لحظة لإكمال متابعتك لليوم.'
      },
      fallbackTitle: 'تذكير المتابعة',
      fallbackBody: 'يتوفر تذكير لمتابعة محاولة الحمل.'
    },
    contraception: {
      reminderTitle: {
        pill: 'حان وقت حبتك',
        ring: 'تذكير بشأن حلقتك',
        patch: 'تذكير بشأن لصقتك',
        other: 'تذكير بالعلاج'
      },
      defaultReminderTitle: 'تذكير منع الحمل',
      body: 'خذي لحظة لمتابعة منع الحمل.'
    },
    irregular: {
      dailyJournal: {
        title: 'كيف تشعرين اليوم؟',
        body: 'خذي لحظة لتحديث متابعتك.'
      },
      unrecordedPeriod: {
        title: 'لم يُسجَّل الحيض بعد',
        body: 'لم تسجّلي حيضًا جديدًا بعد. إن كان قد بدأ، فتذكّري تحديث متابعتك.'
      }
    },
    menopause: {
      dailyTracking: {
        title: 'متابعتك لليوم',
        body: 'خذي لحظة لتدوين ما تشعرين به اليوم.'
      },
      treatment: {
        title: 'تذكير صغير',
        body: 'حان الآن موعد تذكيرك الشخصي.'
      }
    },
    pregnancy: {
      weeklyUpdate: {
        title: 'أسبوع جديد من الحمل',
        body: 'اكتشفي معلومات أسبوعك الجديد.'
      },
      dailyJournal: {
        title: 'اليوميات',
        body: 'خذي لحظة لإكمال متابعتك لليوم.'
      },
      vitaminTitle: 'الفيتامينات والمكمّلات',
      medicationTitle: 'الدواء',
      customReminderFallbackBody: 'تذكير مخصّص',
      eventTypeLabels: {
        appointment: 'موعد',
        exam: 'فحص'
      },
      eventUpcomingTitle: '{{type}} قادم',
      reminderOffsetLabels: {
        "30min": 'قبل 30 دقيقة',
        "1hour": 'قبل ساعة',
        "2hours": 'قبل ساعتين',
        "1day": 'قبل يوم',
        custom: 'مخصّص'
      }
    },
    postpartum: {
      dailyTracking: {
        title: 'متابعتك لليوم',
        body: 'خذي لحظة لتدوين ما تشعرين به اليوم.'
      },
      nifas: {
        approachingTitle: 'نقطة النفاس المرجعية تقترب',
        approachingBody: 'تقترب علامة في متابعتك بعد الولادة.',
        approachingInAppMessage: 'تقترب النقطة المرجعية لـ AWA عند 40 يومًا.',
        reachedTitle: 'تم بلوغ النقطة المرجعية لـ AWA عند 40 يومًا',
        reachedBody: 'وفق هذه النقطة المرجعية، يمكنك استئناف صلواتك حتى لو استمر النزف.',
        fallbackReachedTitle: 'تم بلوغ نقطة النفاس المرجعية',
        fallbackApproachingTitle: 'نقطة النفاس المرجعية تقترب'
      }
    },
    miscarriage: {
      dailyTracking: {
        title: 'متابعتك لليوم 🌿',
        body: 'إن رغبتِ، خذي لحظة لتدوين ما تشعرين به اليوم.'
      }
    },
    qadaa: {
      title: 'صيام للقضاء',
      body: 'ما زالت عليك أيام صيام للقضاء. يمكنك تنظيم متابعتك في AWA.'
    }
  },
  help: {
    categories: {
      cycle: 'متابعة الدورة',
      conceive: 'محاولة الحمل',
      contraception: 'منع الحمل',
      irregular: 'الدورة غير المنتظمة / متلازمة تكيّس المبايض',
      menopause: 'ما قبل انقطاع الطمث / انقطاع الطمث',
      pregnancy: 'متابعة الحمل',
      postpartum: 'ما بعد الولادة',
      loss: 'بعد الإجهاض',
      spiritual: 'العلامات الروحية',
      journal: 'اليوميات',
      privacy: 'البيانات والخصوصية'
    },
    faq: {
      "cycle-record-period": {
        question: 'كيف أسجّل حيضي؟',
        subtitle: 'أضيفي تواريخ حيضك ومدته.',
        answer: 'في التقويم أو اليوميات، سجّلي موعد بداية حيضك ومدته وشدة التدفّق. تكوّن هذه المعلومات سجلّك الشخصي وتغذّي التقديرات المعروضة في AWA.'
      },
      "cycle-edit-period": {
        question: 'هل يمكنني تعديل تاريخ الحيض؟',
        subtitle: 'صحّحي التاريخ إذا تغيّرت متابعتك.',
        answer: 'نعم. عدّلي التاريخ المعني في متابعتك ليبقى سجلّك دقيقًا بحسب دورتك الفعلية. قد تتغيّر التقديرات بعد ذلك بحسب المعلومات المحفوظة حديثًا.'
      },
      "cycle-predictions": {
        question: 'كيف يُحسب موعد حيضي القادم؟',
        subtitle: 'تقديرات مبنية على سجلّك الشخصي.',
        answer: 'يقدّر AWA موعد حيضك القادم وفترة خصوبتك وإباضتك بناءً على سجلّك الشخصي وطول دورتك والمعلومات التي تسجّلينها. لا تعتمد التقديرات أبدًا على دورة قياسية مدتها 28 يومًا فقط.'
      },
      "cycle-flow": {
        question: 'كيف أتابع شدة التدفّق؟',
        subtitle: 'سجّلي كيف يتغيّر نزفك.',
        answer: 'استخدمي اليوميات لتدوين شدة تدفّق الحيض. يحفظ ذلك سجلًّا لكيفية تغيّره عبر دوراتك.'
      },
      "cycle-calendar": {
        question: 'ماذا تعني علامات التقويم؟',
        subtitle: 'الحيض والخصوبة والإباضة والتقويم الهجري.',
        answer: 'يعرض التقويم أيام حيضك المسجّلة إلى جانب فترة خصوبتك وإباضتك المقدَّرتين. وإذا كانت العلامات الروحية مفعّلة، يمكن عرض التاريخ الهجري إلى جانب التاريخ الميلادي.'
      },
      "conceive-fertile-window": {
        question: 'كيف أعرف فترة خصوبتي؟',
        subtitle: 'اطّلعي على الأيام المقدَّر أنها الأكثر خصوبة.',
        answer: 'في وضع محاولة الحمل، يعرض AWA فترة خصوبة مقدَّرة بناءً على معلومات دورتك وسجلّك الشخصي.'
      },
      "conceive-ovulation": {
        question: 'كيف تُقدَّر إباضتي؟',
        subtitle: 'تقدير يتحدّث كلما تابعتِ.',
        answer: 'تُقدَّر الإباضة من المعلومات المتوفرة في سجلّ دورتك. قد يتغيّر هذا التقدير كلما أضفتِ بيانات جديدة.'
      },
      "conceive-temperature": {
        question: 'هل يمكنني متابعة درجة حرارتي القاعدية؟',
        subtitle: 'أضيفي حرارتك إلى متابعة خصوبتك.',
        answer: 'نعم. متابعة درجة الحرارة القاعدية جزء من وضع الحمل المخصّص.'
      },
      "conceive-cervical-mucus": {
        question: 'هل يمكنني متابعة مخاط عنق الرحم؟',
        subtitle: 'أضيفي هذه الملاحظة إلى متابعة خصوبتك.',
        answer: 'نعم. متابعة مخاط عنق الرحم من المعلومات المتوفرة في وضع محاولة الحمل.'
      },
      "conceive-lh-test": {
        question: 'هل يمكنني تسجيل اختبار الإباضة (LH)؟',
        subtitle: 'احتفظي بنتائجك ضمن متابعتك.',
        answer: 'نعم. تسجيل اختبارات الإباضة (LH) جزء من رحلة السعي إلى الحمل.'
      },
      "conceive-intercourse": {
        question: 'كيف أسجّل العلاقة الحميمة؟',
        subtitle: 'تفصيل خاص في يومياتك.',
        answer: 'يتيح لكِ قسم الخصوصية الحميمة تسجيل العلاقة الحميمة ومعلومات أخرى متعلقة بها. يبقى هذا القسم متكتمًا ويمكن حمايته بشكل منفصل.'
      },
      "contraception-method": {
        question: 'ما وسائل منع الحمل التي يمكنني متابعتها؟',
        subtitle: 'الحبوب والحلقة واللصقة والعلاجات الهرمونية.',
        answer: 'يدعم AWA متابعة حبوب منع الحمل والحلقة المهبلية ولصقة منع الحمل وغيرها من العلاجات الهرمونية.'
      },
      "contraception-pill-reminder": {
        question: 'هل يمكنني ضبط تذكير لحبتي؟',
        subtitle: 'اضبطي تذكيرات قابلة للتخصيص.',
        answer: 'نعم. يوفّر AWA تذكيرات قابلة للتخصيص لتناول حبتك، إضافةً إلى إشعارات يومية.'
      },
      "contraception-forgotten-pill": {
        question: 'هل يمكنني تسجيل حبة منسية؟',
        subtitle: 'تابعي الجرعات الفائتة.',
        answer: 'نعم. متابعة الجرعات الفائتة جزء من رحلة منع الحمل.'
      },
      "contraception-history": {
        question: 'أين أجد سجل الجرعات التي تناولتها؟',
        subtitle: 'راجعي الجرعات المسجّلة والحبوب المنسية.',
        answer: 'يتوفر سجل للجرعات للاحتفاظ بتاريخ متابعتك لمنع الحمل.'
      },
      "contraception-predictions": {
        question: 'هل تبقى التوقعات مفيدة أثناء استخدام وسيلة منع الحمل؟',
        subtitle: 'قد تغيّر بعض الوسائل دورتك الطبيعية.',
        answer: 'يمكن لـ AWA متابعة عرض معلومات المتابعة المتاحة، لكن طريقة تفسيرك للتوقعات تعتمد على وضعك والوسيلة التي تستخدمينها. لا يحلّ التطبيق أبدًا محل الاستشارة الطبية.'
      },
      "irregular-long-cycle": {
        question: 'هل تُعدّ الدورة الطويلة «متأخرة»؟',
        subtitle: 'يراعي AWA الدورات غير المنتظمة.',
        answer: 'لا. في وضع متلازمة تكيّس المبايض/الدورات غير المنتظمة، لا يعدّ AWA الدورة الطويلة «متأخرة» تلقائيًا.'
      },
      "irregular-symptoms": {
        question: 'ما الأعراض التي يمكنني متابعتها مع متلازمة تكيّس المبايض؟',
        subtitle: 'راقبي الأعراض التي تتغير مع الوقت.',
        answer: 'تشمل المتابعة الدورات غير المنتظمة وحب الشباب ونمو الشعر وتغيّرات الوزن والأعراض المرتبطة بها.'
      },
      "irregular-acne-hair": {
        question: 'هل يمكنني متابعة حب الشباب ونمو الشعر؟',
        subtitle: 'أضيفي ملاحظاتك إلى متابعة متلازمة تكيّس المبايض.',
        answer: 'نعم. حب الشباب ونمو الشعر جزء صريح من المتابعة المخصّصة لمتلازمة تكيّس المبايض.'
      },
      "irregular-weight": {
        question: 'هل يمكنني متابعة تغيّرات وزني؟',
        subtitle: 'راقبي كيف يتغير وزنك مع الوقت.',
        answer: 'نعم. متابعة الوزن متاحة في وضع متلازمة تكيّس المبايض/الدورات غير المنتظمة.'
      },
      "irregular-predictions": {
        question: 'لماذا تتفاوت توقعاتي أكثر؟',
        subtitle: 'الدورات غير المنتظمة تجعل التقديرات أقل ثباتًا.',
        answer: 'عندما تكون الدورات غير منتظمة، قد تتغير التقديرات بشكل طبيعي أكثر. يعتمد AWA على سجلّك الشخصي دون أن يفسّر الدورة الطويلة تلقائيًا على أنها متأخرة.'
      },
      "menopause-symptoms": {
        question: 'ما الأعراض التي يمكنني متابعتها؟',
        subtitle: 'متابعة تتلاءم مع تغيّرات هذه المرحلة من الحياة.',
        answer: 'تشمل المتابعة الهبّات الساخنة والتعرّق الليلي ومشكلات النوم والإرهاق وتقلّبات المزاج وضبابية التفكير، وغيرها.'
      },
      "menopause-hot-flashes": {
        question: 'هل يمكنني تسجيل هبّاتي الساخنة؟',
        subtitle: 'راقبي وتيرتها مع الوقت.',
        answer: 'نعم. الهبّات الساخنة من الأعراض المتاحة في وضع ما قبل انقطاع الطمث/انقطاع الطمث.'
      },
      "menopause-sleep": {
        question: 'هل يمكنني متابعة نومي وإرهاقي؟',
        subtitle: 'راقبي مشكلات النوم والإرهاق.',
        answer: 'نعم. مشكلات النوم والتعرّق الليلي والإرهاق كلها متاحة في هذه الرحلة.'
      },
      "menopause-hormonal-treatment": {
        question: 'هل يمكنني متابعة علاج هرموني؟',
        subtitle: 'احتفظي بمعلومات مفيدة لمتابعتك.',
        answer: 'نعم. يمكنكِ متابعة العلاجات الهرمونية ضمن هذا الوضع.'
      },
      "menopause-labs": {
        question: 'هل يمكنني تسجيل نتائج FSH والإستراديول؟',
        subtitle: 'أضيفي بعض نتائج التحاليل إلى متابعتك.',
        answer: 'نعم. يمكن تسجيل نتائج التحاليل مثل FSH والإستراديول في هذا الوضع.'
      },
      "pregnancy-due-date": {
        question: 'كيف يُحسب تاريخ ولادتي المتوقع؟',
        subtitle: 'تقدير يظهر في متابعة حملك.',
        answer: 'تحسب متابعة الحمل تاريخ ولادتك المتوقع انطلاقًا من المعلومات المتوفرة في متابعتك.'
      },
      "pregnancy-weekly": {
        question: 'هل يمكنني متابعة حملي أسبوعًا بأسبوع؟',
        subtitle: 'تابعي تقدّم حملك أسبوعًا بأسبوع.',
        answer: 'نعم. يوفّر AWA متابعة أسبوعًا بأسبوع ويعرض كيف يتقدّم حملك.'
      },
      "pregnancy-appointments": {
        question: 'هل يمكنني تسجيل مواعيدي الطبية؟',
        subtitle: 'احتفظي بمواعيدك المهمة في مكان واحد.',
        answer: 'نعم. المواعيد الطبية والفحوص المهمة جزء من متابعة الحمل.'
      },
      "pregnancy-reminders": {
        question: 'هل يمكنني تلقي تذكيرات بفحوصي؟',
        subtitle: 'اضبطي تذكيرات مخصّصة.',
        answer: 'نعم. تتوفر تذكيرات مخصّصة للمواعيد والفحوص المهمة.'
      },
      "pregnancy-journal": {
        question: 'ماذا يمكنني أن أتابع خلال حملي؟',
        subtitle: 'الأعراض والوزن والمزاج والنوم والمعلومات الشخصية.',
        answer: 'يمكن أن تشمل متابعة الحمل الأعراض التي تشعرين بها والوزن والمزاج والنوم والمعلومات الطبية الشخصية.'
      },
      "postpartum-lochia": {
        question: 'كيف أتابع الهلابة؟',
        subtitle: 'راقبي مدتها وكيف تتطور الإفرازات.',
        answer: 'تشمل متابعة ما بعد الولادة مدة الهلابة وتطوّر التدفّق والأعراض المرتبطة بها.'
      },
      "postpartum-cycle-return": {
        question: 'كيف أتابع عودة الحيض؟',
        subtitle: 'تابعي عودة دورتك تدريجيًا.',
        answer: 'يتابع AWA عودة دورتك واستئناف حيضك وتغيّراتك الهرمونية بعد الولادة.'
      },
      "postpartum-breastfeeding": {
        question: 'هل يمكنني متابعة الرضاعة الطبيعية وانقطاع الطمث الناتج عن الرضاعة؟',
        subtitle: 'احتفظي بهذه المعلومات ضمن رحلة ما بعد الولادة.',
        answer: 'نعم. الرضاعة الطبيعية وانقطاع الطمث بعد الولادة جزء من المتابعة المتاحة.'
      },
      "postpartum-recovery": {
        question: 'ماذا يمكنني أن أتابع خلال فترة تعافيّ؟',
        subtitle: 'الإرهاق والنوم والمزاج والألم والتعافي الجسدي.',
        answer: 'تشمل المتابعة اليومية بعد الولادة الإرهاق والنوم والمزاج والألم والتعافي الجسدي، وغيرها.'
      },
      "postpartum-nifas": {
        question: 'كيف يتعامل AWA مع النفاس؟',
        subtitle: 'علامة دينية منفصلة عن المتابعة الطبية.',
        answer: 'عند تفعيل العلامات الروحية، يمكن لـ AWA متابعة مدة النزف بعد الولادة وعرض نقطة مرجعية للنفاس بحسب المرجعية الدينية المختارة. قد تختلف المدة القصوى بين المذاهب، ولا تُعرض أبدًا على أنها حقيقة واحدة شاملة حيث تتباين الآراء.'
      },
      "loss-bleeding": {
        question: 'كيف أتابع نزفي؟',
        subtitle: 'تابعي تطوره دون الاستعجال للعودة إلى المتابعة المعتادة.',
        answer: 'تتابع رحلة «بعد الإجهاض» النزف وتطوّره، في مساحة تلائم هذه المرحلة.'
      },
      "loss-cycle-return": {
        question: 'كيف أتابع عودة دورتي؟',
        subtitle: 'استأنفي متابعتك بالوتيرة التي تناسبك.',
        answer: 'يتابع AWA عودة دورتك بعد الإجهاض، ويتيح لكِ استعادة سجلّك تدريجيًا دون فرض متابعة الحيض المعتادة فورًا.'
      },
      "loss-symptoms": {
        question: 'ما الأعراض التي يمكنني تسجيلها؟',
        subtitle: 'تابعي الأعراض الجسدية التي ترغبين في تدوينها.',
        answer: 'متابعة الأعراض الجسدية متاحة في هذه الرحلة.'
      },
      "loss-notes": {
        question: 'هل يمكنني الاحتفاظ بملاحظات شخصية؟',
        subtitle: 'مساحة شخصية في يومياتك.',
        answer: 'نعم. الملاحظات الشخصية متاحة لترافقك خلال هذه المرحلة.'
      },
      "loss-conceive-again": {
        question: 'هل يمكنني العودة إلى السعي إلى الحمل لاحقًا؟',
        subtitle: 'غيّري هدفك متى شئتِ المحاولة من جديد.',
        answer: 'الدعم لاستئناف محاولات الحمل مدمج في التطبيق. يبقى تغيير هدفك تدريجيًا وهو دائمًا قرارك أنتِ.'
      },
      "spiritual-hijri": {
        question: 'كيف يعمل التقويم الهجري؟',
        subtitle: 'يعرض التاريخ الهجري إلى جانب التاريخ الميلادي.',
        answer: 'عند تفعيل العلامات الروحية، يمكن لـ AWA عرض التاريخ الهجري إلى جانب التاريخ الميلادي والتنبيه إلى الأشهر المهمة مثل رمضان أو ذي الحجة.'
      },
      "spiritual-purity": {
        question: 'ماذا تعني حالة الطهارة؟',
        subtitle: 'علامة متكتمة تتعلق باستئناف العبادة.',
        answer: 'يمكن لـ AWA عرض مؤشر متكتم يميّز بين فترة حيضك وفترة طُهرك عند تفعيل العلامات الروحية.'
      },
      "spiritual-prayer-return": {
        question: 'كيف يبيّن AWA موعد استئناف الصلاة؟',
        subtitle: 'علامة مبنية على موعد انتهاء حيضك.',
        answer: 'إذا عادت الطهارة قبل انتهاء وقت الصلاة الحالية، يمكن للتطبيق التنبيه إلى أن هذه الصلاة أصبحت واجبة من جديد. الصلوات الفائتة أثناء الحيض لا تُحتسب أبدًا ضمن الصلوات المطلوب قضاؤها.'
      },
      "spiritual-qadaa": {
        question: 'كيف تعمل متابعة أيام الصيام المطلوب قضاؤها؟',
        subtitle: 'تحصي الأيام الفائتة بسبب الحيض.',
        answer: 'يمكن لـ AWA أن يوفّر عدّادًا لأيام الصيام الفائتة بسبب الحيض، خاصةً في رمضان، مع تذكير لطيف بعد الشهر لتنظيم قضائها.'
      },
      "spiritual-nifas": {
        question: 'كيف يُعرض النفاس؟',
        subtitle: 'علامة قد تختلف بين المذاهب.',
        answer: 'يمكن لـ AWA عرض المرجعية الدينية المختارة للمدة القصوى للنفاس، مع الإشارة إلى الفروق بين المذاهب حيث يغطيها المحتوى المعتمد. لا يقدّم التطبيق أبدًا رقمًا واحدًا على أنه حقيقة مطلقة.'
      },
      "spiritual-istihada": {
        question: 'هل يقدّم AWA نصائح بشأن الاستحاضة؟',
        subtitle: 'محتوى تعليمي، وليس فتوى شخصية.',
        answer: 'يمكن لـ AWA تقديم محتوى تعليمي عام عن الاستحاضة وما تعنيه بالنسبة إلى العبادة. لا يصدر التطبيق أبدًا فتوى شخصية، والمحتوى الديني مخصّص ليُعتمد من جهة مختصة معروفة.'
      },
      "journal-what-can-track": {
        question: 'ماذا يمكنني أن أسجّل في يومياتي؟',
        subtitle: 'الأعراض والمزاج والخصوصية الحميمة والنوم والنشاط.',
        answer: 'تشمل اليوميات الأعراض الجسدية والحالة النفسية والخصوصية الحميمة والنوم والنشاط البدني والملاحظات الشخصية.',
        subtitleDaughter: 'الأعراض والمزاج والنوم والنشاط وشرب الماء وتدفّق الحيض والملاحظات.',
        answerDaughter: 'تتيح لكِ اليوميات متابعة الأعراض الجسدية والمزاج والنوم والنشاط البدني وشرب الماء وتدفّق الحيض والملاحظات الشخصية.'
      },
      "journal-intimacy": {
        question: 'هل يمكن حماية قسم الخصوصية الحميمة؟',
        subtitle: 'قسم متكتم ومنفصل.',
        answer: 'نعم. يمكن إخفاء قسم الخصوصية الحميمة وحمايته برمز PIN أو Face ID منفصل خاص به.'
      },
      "journal-private-photos": {
        question: 'هل يمكنني الاحتفاظ بصور خاصة؟',
        subtitle: 'لمتابعة بعض التغيّرات المرئية.',
        answer: 'نعم. تتوفر صور خاصة مؤمَّنة، مثلًا لمتابعة تطوّر حب الشباب أو نمو الشعر أو أعراض الجلد.'
      },
      "security-private-data": {
        question: 'كيف يحمي AWA بياناتي؟',
        subtitle: 'الخصوصية والأمان والحد الأدنى من جمع البيانات.',
        answer: 'يقوم AWA على الحد الأدنى من جمع البيانات، ودون إعلانات موجّهة، ودون بيع للبيانات الشخصية، مع تخزين آمن وتشفير حقيقي للبيانات الحساسة.'
      },
      "security-export": {
        question: 'هل يمكنني تصدير بياناتي؟',
        subtitle: 'التصدير بصيغتي PDF وCSV مدعوم.',
        answer: 'نعم. يتوفر تصدير PDF لمتابعتك وتصدير CSV لبياناتك، لتكوّني سجلًّا واضحًا، بما في ذلك لعرضه على مختص في الرعاية الصحية.'
      },
      "security-delete": {
        question: 'هل يمكنني حذف بياناتي بسهولة؟',
        subtitle: 'يبقى الحذف بسيطًا ومتاحًا.',
        answer: 'نعم. يتوفر حذف مبسّط لبياناتك وحسابك من الإعدادات المعنية.'
      }
    },
    guides: {
      "getting-started": {
        title: 'البدء مع AWA',
        text: 'اكتشفي الشاشة الرئيسية والتقويم واليوميات والهدف والعلامات الروحية.'
      },
      cycle: {
        title: 'متابعة الدورة',
        text: 'سجّلي حيضك وتدفّقه وراجعي تقديرات دورتك.'
      },
      conceive: {
        title: 'السعي إلى الحمل',
        text: 'تابعي الخصوبة والإباضة ودرجة الحرارة القاعدية ومخاط عنق الرحم واختبارات LH.'
      },
      contraception: {
        title: 'منع الحمل',
        text: 'أدِيري وسيلتك والتذكيرات والجرعات الفائتة وسجل الجرعات.'
      },
      irregular: {
        title: 'الدورات غير المنتظمة / متلازمة تكيّس المبايض',
        text: 'راقبي الدورات غير المنتظمة وحب الشباب ونمو الشعر والوزن والأعراض المرتبطة بها.'
      },
      menopause: {
        title: 'ما قبل انقطاع الطمث / انقطاع الطمث',
        text: 'تابعي الهبّات الساخنة والنوم والإرهاق والمزاج والعلاجات الهرمونية.'
      },
      pregnancy: {
        title: 'متابعة الحمل',
        text: 'تابعي تاريخ ولادتك المتوقع وأسابيع الحمل والمواعيد والفحوص والأعراض.'
      },
      postpartum: {
        title: 'ما بعد الولادة',
        text: 'تابعي الهلابة وعودة الدورة والرضاعة الطبيعية والنوم والمزاج والتعافي.'
      },
      loss: {
        title: 'بعد الإجهاض',
        text: 'تابعي النزف والأعراض وعودة دورتك بالوتيرة التي تناسبك.'
      },
      calendar: {
        title: 'استخدام التقويم',
        text: 'افهمي الحيض والتوقعات والمؤشرات والعرض الميلادي / الهجري.'
      },
      journal: {
        title: 'تعبئة يومياتك',
        text: 'سجّلي الأعراض والمزاج والنوم والنشاط والملاحظات والخصوصية الحميمة.'
      },
      spiritual: {
        title: 'استخدام العلامات الروحية',
        text: 'اكتشفي التقويم الهجري والطهارة والصلاة والصيام والقضاء والنفاس.'
      },
      privacy: {
        title: 'الخصوصية والبيانات',
        text: 'أدِيري الأمان والوضع المتكتم والتصدير والتشفير وحذف البيانات.'
      }
    },
    helpSupport: {
      title: 'المساعدة والدعم',
      subtitle: 'لديكِ سؤال؟ نحن هنا من أجلك.',
      supportTitle: 'كيف يمكننا مساعدتك؟',
      supportText: 'اختاري وسيلة التواصل التي تناسبك، أو اطّلعي على أكثر الإجابات تكرارًا.',
      emailMethodTitle: 'البريد الإلكتروني',
      emailMethodHelper: 'الرد خلال 24 ساعة',
      emailUnavailable: 'غير متاح',
      faqMethodTitle: 'الأسئلة الشائعة',
      faqMethodValue: 'اطّلعي على الإجابات',
      faqMethodHelper: 'الأسئلة المتكررة',
      faqSectionTitle: 'الأسئلة الشائعة',
      otherTopicsTitle: 'مواضيع مساعدة أخرى',
      guidesTitle: 'الأدلة والشروحات',
      guidesSubtitle: 'اكتشفي أدلتنا للاستفادة القصوى من AWA.',
      whatsNewTitle: 'الجديد',
      whatsNewSubtitle: 'اطّلعي على أحدث الميزات والتحسينات.',
      feedbackTitle: 'إرسال ملاحظات',
      feedbackSubtitle: 'شاركينا أفكارك لمساعدتنا على تحسين التطبيق.',
      bugReportTitle: 'الإبلاغ عن مشكلة',
      bugReportSubtitle: 'أبلغي عن خلل أو سلوك غير متوقع.',
      bannerTitle: 'تجربتك تساعدنا على تحسين AWA',
      bannerText: 'شكرًا لأنكِ خصّصتِ وقتًا للكتابة إلينا.',
      toastEmailUnavailable: 'عنوان الدعم غير متاح.',
      toastCantOpenEmail: 'تعذّر فتح تطبيق البريد الإلكتروني.',
      modal: {
        bugTitle: 'الإبلاغ عن مشكلة',
        feedbackTitle: 'ملاحظاتك تهمّنا 💜',
        categoryLabelBug: 'الفئة',
        categoryLabelFeedback: 'نوع الملاحظات',
        bugCategories: {
          display: 'مشكلة في العرض',
          navigation: 'التنقّل',
          calendar: 'التقويم',
          journal: 'اليوميات',
          notifications: 'الإشعارات',
          data: 'البيانات',
          other: 'أخرى'
        },
        feedbackCategories: {
          suggestion: 'اقتراح',
          improvement: 'تحسين',
          other: 'أخرى'
        },
        descriptionLabel: 'الوصف',
        messageLabel: 'الرسالة',
        placeholderDescribe: 'صِفي طلبك...',
        errorEmpty: 'صِفي طلبك قبل المتابعة.',
        stepsLabel: 'خطوات إعادة المشكلة (اختياري)',
        placeholderSteps: '1. افتحي...',
        emailLabel: 'البريد الإلكتروني للرد (اختياري)',
        placeholderEmail: 'your@email.com',
        sendBug: 'إرسال البلاغ',
        send: 'إرسال'
      },
      email: {
        supportSubject: 'دعم AWA',
        bugSubjectPrefix: 'بلاغ خلل في AWA',
        feedbackSubjectPrefix: 'ملاحظات حول AWA',
        bodyCategory: 'الفئة',
        bodyMessage: 'الرسالة',
        bodySteps: 'الخطوات',
        bodyReplyEmail: 'البريد الإلكتروني للرد',
        bodyVersion: 'إصدار AWA'
      }
    },
    faqScreen: {
      title: 'الأسئلة الشائعة',
      intro: 'ستجدين الإجابات الأساسية لاستخدام AWA بطمأنينة.',
      detailTitle: 'الأسئلة الشائعة'
    },
    guidesScreen: {
      title: 'الأدلة والشروحات',
      intro: 'إرشادات بسيطة للاستفادة القصوى من AWA.'
    },
    whatsNewScreen: {
      title: 'الجديد',
      version: 'الإصدار {{version}}',
      heading: 'AWA في تطوّر مستمر',
      body: 'لم تُضبط ملاحظات إصدار رسمية بعد. ستظهر التحديثات القادمة هنا فور نشرها.'
    }
  },
  library: {
    categories: {
      firstPeriod: {
        label: 'أول حيض'
      },
      cycle: {
        label: 'فهم دورتك'
      },
      flow: {
        label: 'تدفّق الحيض'
      },
      symptoms: {
        label: 'الأعراض'
      },
      fertility: {
        label: 'الخصوبة'
      },
      ovulation: {
        label: 'الإباضة'
      },
      pain: {
        label: 'الألم'
      },
      hydration: {
        label: 'شرب الماء'
      },
      sleep: {
        label: 'النوم'
      },
      mood: {
        label: 'المزاج'
      },
      basalTemperature: {
        label: 'درجة حرارة الجسم القاعدية'
      },
      cervicalMucus: {
        label: 'مخاط عنق الرحم'
      },
      lhTests: {
        label: 'اختبارات الإباضة (LH)'
      },
      nutrition: {
        label: 'التغذية'
      },
      conceptionTips: {
        label: 'نصائح للحمل'
      },
      birthControlPills: {
        label: 'حبوب منع الحمل'
      },
      patch: {
        label: 'لصقة منع الحمل'
      },
      ring: {
        label: 'الحلقة المهبلية'
      },
      hormonalTreatments: {
        label: 'العلاجات الهرمونية'
      },
      missedPills: {
        label: 'الحبة المنسية'
      },
      sideEffects: {
        label: 'الآثار الجانبية'
      },
      pcos: {
        label: 'PCOS'
      },
      hormones: {
        label: 'الهرمونات'
      },
      acne: {
        label: 'حب الشباب الهرموني'
      },
      weight: {
        label: 'الوزن'
      },
      exercise: {
        label: 'التمارين'
      },
      pregnancyWeekly: {
        label: 'الحمل أسبوعًا بأسبوع'
      },
      babyDevelopment: {
        label: 'نمو الطفل'
      },
      medicalExams: {
        label: 'الفحوص الطبية'
      },
      childbirthPrep: {
        label: 'التحضير للولادة'
      },
      postpartumRecovery: {
        label: 'التعافي بعد الولادة'
      },
      lochia: {
        label: 'الهلابة'
      },
      nifas: {
        label: 'النفاس (طبيًا)'
      },
      breastfeeding: {
        label: 'الرضاعة الطبيعية'
      },
      emotionalHealth: {
        label: 'الصحة النفسية'
      },
      physicalRecoveryLoss: {
        label: 'التعافي الجسدي'
      },
      emotionalRecoveryLoss: {
        label: 'التعافي النفسي'
      },
      fertilityAfterLoss: {
        label: 'عودة الخصوبة'
      },
      menopause: {
        label: 'انقطاع الطمث وما قبله'
      },
      hotFlashes: {
        label: 'الهبّات الساخنة'
      },
      bones: {
        label: 'العظام وهشاشتها'
      },
      treatments: {
        label: 'العلاجات'
      },
      fiqhWomen: {
        label: 'فقه المرأة'
      },
      menstruationPurity: {
        label: 'الحيض والطهارة'
      },
      istihada: {
        label: 'الاستحاضة'
      },
      nifasFiqh: {
        label: 'النفاس (فقهًا)'
      },
      ramadan: {
        label: 'رمضان'
      },
      fastingQadaa: {
        label: 'الصيام والقضاء'
      },
      prayerDuringMenstruation: {
        label: 'الصلاة أثناء الحيض'
      },
      returningToPrayer: {
        label: 'العودة إلى الصلاة'
      },
      religiousFaq: {
        label: 'الأسئلة الشائعة'
      }
    },
    objectiveHeadlines: {
      cycle: 'متابعة دورتي',
      conceive: 'السعي إلى الحمل',
      contraception: 'إدارة منع الحمل',
      irregular: 'فهم الدورات غير المنتظمة',
      menopause: 'المرور بانقطاع الطمث',
      pregnancy: 'عيش حملي',
      postpartum: 'التعافي بعد الولادة',
      loss: 'التعافي بعد فقدان'
    },
    religiousDisclaimer: 'هذا المحتوى تعليمي بحت. ينبغي عرض المسائل الدينية على أهل العلم المؤهلين للتحقق منها. لا يصدر AWA فتاوى ولا أحكامًا دينية شخصية.',
    articles: {
      "cycle-comprendre-ton-cycle": {
        title: 'فهم دورتك الشهرية',
        summary: 'المراحل الأساسية لدورتك، مشروحة ببساطة.'
      },
      "cycle-phases-expliquees": {
        title: 'مراحل الدورة المختلفة',
        summary: 'الإستروجين والبروجسترون: ما يحدث فعلًا كل أسبوع.'
      },
      "cycle-signe-vital": {
        title: 'دورتك، نافذة حقيقية على صحتك',
        summary: 'لماذا تُسمّى الدورة أحيانًا «العلامة الحيوية الخامسة».'
      },
      "firstperiod-premieres-regles": {
        title: 'أول حيض لكِ: ماذا تتوقعين',
        summary: 'ما هو طبيعي، وما يبعث على الطمأنينة، وما يجدر بكِ معرفته.'
      },
      "firstperiod-premiers-signes": {
        title: 'العلامات الأولى قبل قدوم الحيض',
        summary: 'تغيّرات الجسم والإفرازات والمزاج: إشارات إلى أن أول حيض قريب.'
      },
      "firstperiod-comment-savoir": {
        title: 'كيف أعرف أن أول حيض قادم؟',
        summary: 'التعرّف على العلامات الملموسة، ومعرفة متى تتحدثين إلى شخص بالغ.'
      },
      "firstperiod-choisir-protection": {
        title: 'أي وسيلة حماية أختار لأول حيض؟',
        summary: 'الفوط وملابس الحيض الداخلية والسدادات القطنية: فهم الخيارات بحسب راحتك.'
      },
      "firstperiod-gerer-quotidien": {
        title: 'كيف تتعاملين مع أول حيض في حياتك اليومية',
        summary: 'المدرسة والرياضة والنوم: بضع عادات بسيطة لتبقي مرتاحة.'
      },
      "firstperiod-cycle-irregulier": {
        title: 'أول دورات لي غير منتظمة: هل هذا طبيعي؟',
        summary: 'لماذا تحتاج الدورة إلى وقت لتستقر، ومتى تراجعين الطبيب.'
      },
      "firstperiod-questions-frequentes": {
        title: 'أسئلة شائعة حول أول حيض',
        summary: 'إجابات بسيطة عن أكثر الأسئلة شيوعًا حول أول حيض.'
      },
      "flow-comprendre-flux": {
        title: 'فهم تدفّق الحيض',
        summary: 'تدفّق خفيف أو متوسط أو غزير: ماذا تعني هذه الاختلافات.'
      },
      "flow-hygiene-intime": {
        title: 'العناية بنظافتك الحميمة أثناء الحيض',
        summary: 'عادات بسيطة لتشعري بالراحة مع احترام جسمك.'
      },
      "flow-colors-textures": {
        title: 'تدفّق الحيض: فهم الألوان والقوام',
        summary: 'لون الحيض وقوامه يخبران الكثير عن صحتك الهرمونية.'
      },
      "symptoms-reconnaitre": {
        title: 'فهم الأعراض قبل الحيض',
        summary: 'ألم الثديين والانتفاخ والإرهاق: من أين تأتي.'
      },
      "fertility-fenetre-fertile": {
        title: 'فترة الخصوبة وكيف تعمل',
        summary: 'لماذا تكتسب الأيام الستة المحيطة بالإباضة أكبر أهمية للحمل.'
      },
      "ovulation-comprendre-ovulation": {
        title: 'فهم الإباضة',
        summary: 'اللحظة الأهم في دورتك، وكيف تلاحظينها.'
      },
      "pain-gerer-douleurs": {
        title: 'التعامل مع ألم الحيض',
        summary: 'الدفء والحركة الخفيفة والغذاء: عادات تساعد فعلًا.'
      },
      "hydration-bien-shydrater": {
        title: 'الحفاظ على الترطيب الجيد طوال دورتك',
        summary: 'لماذا يقلّل شرب مزيد من الماء الانتفاخ قبل الحيض.'
      },
      "sleep-sommeil-et-cycle": {
        title: 'النوم والهرمونات: الصلة المنسيّة',
        summary: 'لماذا يتغير نومك بحسب مرحلة دورتك، وعند انقطاع الطمث.'
      },
      "mood-humeur-et-hormones": {
        title: 'المزاج والتغيّرات الهرمونية',
        summary: 'لماذا يتقلب مزاجك خلال الدورة ومراحل الحياة.'
      },
      "basaltemp-suivre-temperature": {
        title: 'متابعة درجة حرارة جسمك القاعدية',
        summary: 'طريقة بسيطة للتأكد من حدوث الإباضة.'
      },
      "cervicalmucus-observer-glaire": {
        title: 'ملاحظة مخاط عنق الرحم',
        summary: 'إشارة طبيعية ومجانية تساعدك على تحديد فترة الخصوبة.'
      },
      "lhtests-comprendre-tests-ovulation": {
        title: 'فهم اختبارات الإباضة (LH)',
        summary: 'كيف تعمل شرائط الاختبار هذه ومتى تستخدمينها.'
      },
      "nutrition-conception-fertilite": {
        title: 'التغذية والخصوبة',
        summary: 'العناصر الغذائية التي تدعم دورة خصبة وحملًا صحيًا.'
      },
      "conceptiontips-essayer-de-concevoir": {
        title: 'محاولة الحمل: من أين تبدئين',
        summary: 'المعالم الأساسية لبدء رحلة الحمل بطمأنينة.'
      },
      "conceptiontips-comprendre-nidation": {
        title: 'فهم الانغراس',
        summary: 'ما الذي يحدث بين الإخصاب وظهور الاختبار الإيجابي.'
      },
      "conceptiontips-hygiene-de-vie": {
        title: 'نمط الحياة ورحلة الحمل',
        summary: 'عادات بسيطة قد تدعم رحلتك، دون أي ضغط.'
      },
      "birthcontrolpills-comprendre-la-pilule": {
        title: 'فهم حبوب منع الحمل',
        summary: 'كيف تعمل الحبوب، وأهم ما يجب معرفته قبل اختيارها.'
      },
      "patch-le-patch-contraceptif": {
        title: 'لصقة منع الحمل',
        summary: 'بديل أسبوعي عن الحبة اليومية.'
      },
      "ring-anneau-vaginal": {
        title: 'الحلقة المهبلية لمنع الحمل',
        summary: 'حلقة مرنة تُوضع لمدة ثلاثة أسابيع.'
      },
      "hormonaltreatments-panorama": {
        title: 'نظرة عامة على علاجات منع الحمل الهرمونية',
        summary: 'الحبوب، اللصقة، الحلقة، الغرسة، اللولب الهرموني: ما الذي يميّز كل واحدة.'
      },
      "hormonaltreatments-choisir-sa-methode": {
        title: 'اختيار العلاج الذي يناسبك',
        summary: 'الأسئلة التي تطرحينها على نفسك قبل الاختيار.'
      },
      "missedpills-que-faire-en-cas-doubli": {
        title: 'نسيتِ حبة: ماذا تفعلين؟',
        summary: 'ما يجب فعله يعتمد في الغالب على المدة التي مرّت منذ النسيان.'
      },
      "sideeffects-reconnaitre-les-effets-secondaires": {
        title: 'التعرّف على الآثار الجانبية المحتملة',
        summary: 'ما هو شائع وغير مقلق، وما يستدعي الانتباه.'
      },
      "pcos-comprendre-sopk": {
        title: 'فهم متلازمة تكيّس المبايض',
        summary: 'متلازمة تكيّس المبايض بوضوح: ما هي، ومدى اختلافها من امرأة إلى أخرى، وأين تتعلمين المزيد.'
      },
      "pcos-cycle-ovulation-fertilite": {
        title: 'الدورة والإباضة والخصوبة مع متلازمة تكيّس المبايض',
        summary: 'لماذا تصبح الدورة غير منتظمة مع متلازمة تكيّس المبايض، وماذا يعني ذلك للخصوبة.'
      },
      "pcos-peau-pilosite-symptomes": {
        title: 'البشرة والشعر والأعراض الظاهرة لمتلازمة تكيّس المبايض',
        summary: 'لماذا قد تؤثر المتلازمة في بشرتك وشعرك، وكيف تعتنين بنفسك.'
      },
      "pcos-diagnostic-examens": {
        title: 'تشخيص متلازمة تكيّس المبايض: الفحوصات والتقييم',
        summary: 'كيف تُشخَّص المتلازمة، وكيف تستعدين لموعدك.'
      },
      "pcos-poids-metabolisme-insuline": {
        title: 'الوزن والأيض ومقاومة الإنسولين',
        summary: 'العلاقة بين متلازمة تكيّس المبايض والوزن ومقاومة الإنسولين، دون أحكام أو اختصارات.'
      },
      "pcos-mode-de-vie-prise-en-charge": {
        title: 'نمط الحياة وتدبير متلازمة تكيّس المبايض',
        summary: 'خيارات التدبير، وعادات بسيطة تدعم حياتك اليومية.'
      },
      "pcos-acne-hormonale": {
        title: 'فهم حب الشباب الهرموني',
        summary: 'لماذا قد يظهر حب الشباب الهرموني مع متلازمة تكيّس المبايض، وكيف تتعرفين عليه، وما الحلول التي قد تساعد.'
      },
      "hormones-menopause-equilibre": {
        title: 'الهرمونات خلال انقطاع الطمث',
        summary: 'الإستروجين، البروجسترون، FSH، LH: كيف تتغير ولماذا تختلف الأعراض.'
      },
      "exercise-bouger-pour-le-cycle": {
        title: 'الحركة لدعم دورتك',
        summary: 'لماذا قد تدعم الحركة المنتظمة دورتك، وما نوع النشاط المناسب، وكيف تضبطين وتيرتك دون ضغط.'
      },
      "exercise-bouger-enceinte": {
        title: 'البقاء نشيطة أثناء الحمل',
        summary: 'ما الحركات التي تبقى آمنة ومفيدة.'
      },
      "exercise-renforcer-perinee": {
        title: 'تقوية عضلات قاع الحوض بعد الولادة',
        summary: 'لماذا يهم تأهيل قاع الحوض.'
      },
      "pregnancy-semaine-par-semaine": {
        title: 'حملك أسبوعًا بعد أسبوع',
        summary: 'المراحل الأساسية من الثلث الأول إلى الثلث الثالث.'
      },
      "babydevelopment-developpement-bebe": {
        title: 'نموّ طفلك في الرحم',
        summary: 'كيف ينمو طفلك، ثلثًا بعد ثلث.'
      },
      "medicalexams-suivi-medical": {
        title: 'جدول متابعة الحمل',
        summary: 'الفحوصات بالموجات فوق الصوتية والتحاليل الأساسية، ثلثًا بعد ثلث.'
      },
      "childbirthprep-preparer-accouchement": {
        title: 'التحضير للولادة بهدوء',
        summary: 'التنفس والأوضاع وحقيبة المستشفى: الأساسيات.'
      },
      "postpartum-recuperation-globale": {
        title: 'التعافي بعد الولادة',
        summary: 'جسمك يحتاج إلى وقت: ما هو طبيعي.'
      },
      "postpartum-retour-de-couches": {
        title: 'عودة الحيض بعد الولادة: ماذا تتوقعين',
        summary: 'متى يعود الحيض بعد الولادة.'
      },
      "lochia-comprendre-lochies": {
        title: 'فهم الهلابة بعد الولادة',
        summary: 'هذا النزف بعد الولادة، وكيف يتطور عادةً.'
      },
      "nifas-aspects-medicaux": {
        title: 'النفاس: الجانب الطبي',
        summary: 'ما الذي يشير إليه هذا المصطلح من الناحية الفيزيولوجية، وكيف تعتنين بنفسك.'
      },
      "breastfeeding-debuter-allaitement": {
        title: 'بدء الرضاعة الطبيعية بثقة',
        summary: 'البداية والإيقاع والعلامات التي تستدعي الانتباه في الأيام الأولى.'
      },
      "emotionalhealth-baby-blues": {
        title: 'كآبة ما بعد الولادة العابرة والصحة النفسية بعد الولادة',
        summary: 'التمييز بين الكآبة العابرة بعد الولادة واكتئاب ما بعد الولادة.'
      },
      "lossphysical-recuperation-physique": {
        title: 'التعافي الجسدي بعد الإجهاض',
        summary: 'النزف والدورة والعودة إلى الوضع الطبيعي.'
      },
      "lossemotional-traverser-le-deuil": {
        title: 'عبور الحزن عاطفيًا',
        summary: 'لا توجد طريقة صحيحة واحدة لعبور هذه المحنة.'
      },
      "lossfertility-fertilite-apres-perte": {
        title: 'الخصوبة ومحاولة الحمل مجددًا بعد الفقد',
        summary: 'متى وكيف تفكرين في المحاولة مجددًا.'
      },
      "menopause-comprendre-la-transition": {
        title: 'فهم مرحلة الانتقال إلى انقطاع الطمث',
        summary: 'ما يتغير تدريجيًا قبل سنوات من توقف الحيض.'
      },
      "hotflashes-bouffees-de-chaleur": {
        title: 'التعامل مع الهبّات الساخنة',
        summary: 'لماذا تحدث وكيف تخففين منها.'
      },
      "bones-sante-osseuse": {
        title: 'العناية بصحة عظامك',
        summary: 'لماذا يزيد انقطاع الطمث خطر هشاشة العظام.'
      },
      "treatments-traitements-menopause": {
        title: 'علاجات انقطاع الطمث',
        summary: 'العلاج الهرموني والبدائل غير الهرمونية، باختصار.'
      },
      "fiqhwomen-introduction": {
        title: 'مدخل إلى فقه المرأة',
        summary: 'نظرة شاملة على أبرز موضوعات فقه المرأة، بين العبادة والحياة اليومية.'
      },
      "menstruationpurity-statut-de-purete": {
        title: 'حال الطهارة: الأساسيات',
        summary: 'فهم العلاقة بين الدورة والطهارة، لتتناولي هذه المرحلة بوضوح أكبر.'
      },
      "istihada-comprendre-les-saignements": {
        title: 'فهم الاستحاضة',
        summary: 'التمييز بين النزف غير المنتظم والحيض المعتاد، مع معالم عامة تهديك.'
      },
      "nifasfiqh-repere-fiqh": {
        title: 'النفاس في الشعائر الدينية',
        summary: 'فهم النفاس ومدته والصلاة والصيام واستئناف العبادات بعد الولادة.'
      },
      "ramadan-jeune-et-regles": {
        title: 'الصيام في رمضان',
        summary: 'نصائح عملية ومعالم تعليمية لتعيشي رمضان أثناء الحيض بطمأنينة.'
      },
      "fastingqadaa-dispense-et-rattrapage": {
        title: 'الصيام والإعفاء: قضاء الأيام (القضاء)',
        summary: 'كيف ومتى تقضين أيام الصيام الفائتة، بوتيرتك الخاصة ودون شعور بالذنب.'
      },
      "prayerduringmenstruation-la-priere-suspendue": {
        title: 'الصلاة أثناء الحيض',
        summary: 'لماذا تُوقَف الصلاة خلال هذه الفترة، وكيف تعيشين هذا الوقت بطمأنينة.'
      },
      "returningtoprayer-le-ghusl-et-le-retour": {
        title: 'الغسل والعودة إلى الصلاة',
        summary: 'الخطوات العامة لاستئناف الصلاة بعد الحيض، بطمأنينة.'
      },
      "religiousfaq-questions-frequentes": {
        title: 'الأسئلة الشائعة حول فقه المرأة',
        summary: 'أكثر الأسئلة شيوعًا حول فقه المرأة، مجموعة في مكان واحد مع إجابات واضحة.'
      },
      "religiousfaq-reperes-apres-une-perte": {
        title: 'معالم روحية بعد الفقد',
        summary: 'ما تقوله المرجعية الدينية عن الحزن حول الولادة، برفق ورحمة.'
      }
    },
    screen: {
      tabs: {
        all: 'الكل',
        medical: 'طبية',
        religious: 'دينية',
        favorites: 'المفضلة'
      },
      categoryTiles: {
        firstPeriod: {
          label: 'أول حيض'
        },
        cycle: {
          label: 'الدورة الشهرية'
        },
        fertility: {
          label: 'الخصوبة\nوالحمل'
        },
        contraception: {
          label: 'منع الحمل'
        },
        pregnancy: {
          label: 'الحمل'
        },
        postpartum: {
          label: 'ما بعد الولادة'
        },
        loss: {
          label: 'بعد\nالإجهاض'
        },
        pcos: {
          label: 'PCOS'
        },
        menopause: {
          label: 'ما قبل انقطاع الطمث\nوانقطاعه'
        },
        spiritual: {
          label: 'الدورة\nوالعبادة'
        }
      },
      backA11y: 'رجوع',
      title: 'المكتبة',
      subtitle: 'محتوى موثوق\nلتفهمي جسمك\nوصحتك وإيمانك بشكل أفضل.',
      searchA11y: 'بحث',
      searchPlaceholder: 'ابحثي عن مقال…',
      categoriesTitle: 'الأقسام',
      seeAll: 'عرض الكل',
      sectionActionA11y: '{{action}}: {{title}}',
      recommendedTitle: 'مقترحة لك',
      currentObjective: 'هدفك الحالي:',
      featuredTitle: 'مميزة',
      featuredBadge: 'طبي',
      readArticle: 'اقرئي المقال',
      spiritualSectionTitle: 'معالم روحية',
      popularSectionTitle: 'مقالات رائجة',
      religiousInfo: 'محتوى تعليمي. لاتخاذ قرار ديني شخصي، استشيري شخصًا مؤهلًا.',
      articlesLabel: 'مقالات',
      durationMin: '{{count}} د',
      durationMinRead: 'قراءة {{count}} د',
      removeBookmark: 'إزالة من المفضلة',
      addBookmark: 'إضافة إلى المفضلة',
      emptyTitle: 'لم يُعثر على محتوى',
      emptyReset: 'إعادة تعيين'
    },
    reader: {
      levels: {
        beginner: 'مبتدئة',
        intermediate: 'متوسط',
        advanced: 'متقدم'
      },
      types: {
        article: 'مقال',
        guide: 'دليل',
        faq: 'أسئلة شائعة'
      },
      back: 'رجوع',
      missingArticle: 'هذا المقال لم يعد متاحًا.',
      educationalContent: 'محتوى تعليمي',
      premiumDescription: 'هذا الدليل جزء من محتوى AWA بريميوم.',
      premiumFallbackTitle: 'دليل بريميوم',
      durationMinutes: '{{count}} د'
    },
    filters: {
      readingTime: {
        any: 'أي مدة',
        short: 'أقل من 5 د',
        medium: '5–8 د',
        long: '9 د فأكثر'
      },
      level: {
        beginner: 'مبتدئة',
        intermediate: 'متوسط',
        advanced: 'متقدم'
      },
      type: {
        article: 'مقال',
        guide: 'دليل',
        faq: 'أسئلة شائعة'
      }
    },
    featured: {
      headerSubtitle: 'مقالات مختارة خصيصًا لك',
      addMomentToFavorites: 'أضيفي هذا المقال المميز إلى المفضلة',
      momentBadge: 'مقال مميز',
      slideAccessibility: 'المقال {{current}} من {{total}}',
      seeAllPopular: 'عرض الكل: مقالات رائجة',
      seeAllNew: 'عرض الكل: جديد',
      newHeading: 'جديد',
      trustTitle: 'محتوى موثوق ومعتمد',
      trustText: 'جميع مقالاتنا من إعداد مختصين وخبراء في الرعاية الصحية.',
      articles: {
        cyclePhasesExpliquees: {
          title: 'مراحل الدورة المختلفة',
          summary: 'تعرّفي على مراحل دورتك ودورها في توازنك الهرموني.'
        },
        painGererDouleurs: {
          title: 'التعامل مع ألم الدورة',
          summary: 'طرق لطيفة وطبيعية لتخفيف التقلصات واستعادة راحتك.'
        },
        cycleComprendreTonCycle: {
          title: 'فهم دورتك الشهرية',
          summary: 'راقبي إيقاعاتك وتعلّمي التعرف على إشارات جسمك الفريدة.'
        },
        flowComprendreFlux: {
          title: 'فهم تدفّق دم الحيض'
        },
        nutritionConceptionFertilite: {
          title: 'التغذية والخصوبة'
        },
        symptomsReconnaitre: {
          title: 'التعرّف على الأعراض قبل الحيض'
        },
        flowColorsTextures: {
          title: 'تدفّق دم الحيض: فهم الألوان والقوام'
        }
      }
    },
    readingControls: {
      secondsRemaining: 'متبقٍ {{count}} ث',
      minutesSecondsRemaining: 'متبقٍ {{minutes}} د {{seconds}} ث',
      minutesRemaining_one: 'متبقٍ دقيقة واحدة',
      minutesRemaining_other: 'متبقٍ {{count}} دقيقة',
      minutesRemaining_zero: 'لا دقائق متبقية',
      minutesRemaining_two: 'متبقٍ دقيقتان',
      minutesRemaining_few: 'متبقٍ {{count}} دقائق',
      minutesRemaining_many: 'متبقٍ {{count}} دقيقة',
      notStartedTitle: 'ابدئي القراءة',
      readingTitle: 'القراءة جارية',
      resumeTitle: 'تابعي القراءة',
      finishedSubtitle: 'انتهت القراءة',
      pauseButton: 'إيقاف مؤقت',
      finishedButton: 'أنهيتُ المقال',
      startButton: 'ابدئي القراءة'
    }
  },
  export: {
    fields: {
      cycleDay: 'يوم الدورة',
      flow: 'التدفّق',
      color: 'اللون',
      clots: 'الجلطات',
      protections: 'وسيلة الحماية المستخدمة',
      periodStart: 'بداية الحيض',
      periodEnd: 'نهاية الحيض',
      pain: 'الألم',
      symptoms: 'الأعراض',
      intensity: 'الشدة',
      location: 'الموضع',
      mood: 'المزاج',
      energy: 'الطاقة',
      stress: 'التوتر',
      irritability: 'العصبية',
      motivation: 'الحافز',
      bedtime: 'وقت النوم',
      wakeTime: 'وقت الاستيقاظ',
      duration: 'المدة',
      quality: 'الجودة',
      nightWakenings: 'مرات الاستيقاظ ليلًا',
      wakeFeeling: 'الشعور عند الاستيقاظ',
      noActivity: 'بلا نشاط',
      type: 'النوع',
      feeling: 'الشعور',
      waterDrunk: 'كمية الماء المشروبة',
      glasses: 'الأكواب',
      temperature: 'درجة الحرارة',
      measurementTime: 'وقت القياس',
      method: 'الطريقة',
      weight: 'الوزن',
      moment: 'وقت اليوم',
      cervicalMucus: 'مخاط عنق الرحم',
      lhTest: 'اختبار الإباضة (LH)',
      time: 'الوقت'
    },
    enums: {
      mood: {
        veryGood: 'جيد جدًا',
        good: 'جيد',
        neutral: 'عادي',
        stressed: 'متوترة',
        irritable: 'سريعة الانفعال',
        anxious: 'قلقة',
        sad: 'حزينة',
        tired: 'متعبة',
        motivated: 'متحمسة'
      },
      flow: {
        none: 'لا يوجد',
        light: 'خفيف',
        moderate: 'متوسط',
        heavy: 'غزير',
        veryHeavy: 'غزير جدًا'
      },
      severity: {
        mild: 'خفيف',
        moderate: 'متوسط',
        severe: 'شديد / شديد جدًا'
      },
      cervicalMucus: {
        dry: 'جاف',
        sticky: 'لزج',
        creamy: 'كريمي',
        watery: 'مائي',
        eggWhite: 'شفاف ومطاطي'
      },
      protection: {
        yes: 'نعم',
        no: 'لا',
        unknown: 'غير محدد'
      },
      lhResult: {
        positive: 'إيجابي',
        negative: 'سلبي',
        invalid: 'غير صالح'
      }
    },
    sectionNotes: {
      symptoms: 'الأعراض',
      mood: 'المزاج',
      flow: 'تدفّق الحيض',
      sleep: 'النوم',
      activity: 'النشاط',
      temperature: 'درجة الحرارة القاعدية',
      weight: 'الوزن',
      cervicalMucus: 'مخاط عنق الرحم',
      lhTest: 'اختبارات الإباضة (LH)'
    },
    csv: {
      headerDate: 'التاريخ',
      headerCategory: 'الفئة',
      headerValue: 'القيمة',
      estimationLabel: 'تقدير'
    },
    periods: {
      all: 'السجل كاملًا',
      "3m": 'آخر 3 أشهر',
      "6m": 'آخر 6 أشهر',
      "12m": 'آخر 12 شهرًا'
    },
    pdf: {
      reportTitle: 'تقرير المتابعة',
      objectiveLabel: 'الهدف',
      periodLabel: 'الفترة',
      generatedLabel: 'تاريخ الإنشاء',
      summaryHeading: 'ملخص',
      totalDaysLabel: 'عدد الأيام المسجّلة',
      daysCount_one: 'يوم واحد',
      daysCount_other: '{{count}} يوم',
      daysCount_zero: '0 يوم',
      daysCount_two: 'يومان',
      daysCount_few: '{{count}} أيام',
      daysCount_many: '{{count}} يومًا',
      historyHeading: 'السجل',
      emptyState: 'لا توجد بيانات لهذه الفترة وهذه الفئات.',
      unsupportedNotice: 'ملاحظة: لا يمكن عرض بعض الأحرف (الرموز التعبيرية، وأنظمة كتابة أخرى…) في ملف PDF هذا، وتُستبدل بالعلامة “[…]”. وهي محفوظة كما هي في تصدير CSV.'
    },
    data: {
      notesPersonnelles: 'ملاحظات شخصية',
      note: 'ملاحظة',
      yes: 'نعم',
      no: 'لا',
      preferNotToSay: 'أفضّل عدم القول',
      zones: 'المناطق',
      types: 'الأنواع',
      associatedSymptoms: 'الأعراض المصاحبة',
      cycle: {
        categories: {
          periods: 'تواريخ الحيض',
          flow: 'تدفّق الحيض',
          symptoms: 'الأعراض',
          mood: 'المزاج',
          sleep: 'النوم',
          activity: 'النشاط',
          hydration: 'شرب الماء',
          notes: 'ملاحظات خاصة',
          intimacy: 'العلاقة الحميمة'
        },
        periodStart: 'بداية الحيض',
        periodConfirmedEnd: 'نهاية الحيض (مؤكدة)',
        periodUnconfirmedEnd: 'نهاية الحيض: غير مؤكدة',
        periodEstimatedEnd: 'نهاية مقدّرة بحسب المدة المسجّلة (غير مؤكدة)'
      },
      intimacy: {
        intercourse: 'علاقة زوجية',
        protection: 'الحماية',
        libido: 'الرغبة',
        discomfort: 'الانزعاج'
      },
      irregular: {
        categories: {
          period: 'الحيض',
          acne: 'حب الشباب',
          hairGrowth: 'نمو الشعر',
          pain: 'الألم',
          fatigue: 'التعب والأعراض',
          mood: 'المزاج',
          weight: 'الوزن',
          notes: 'ملاحظات يومية'
        },
        spotting: 'تبقّع',
        noPeriod: 'لا حيض',
        fatigueNoteLabel: 'التعب'
      },
      conceive: {
        categories: {
          temperature: 'درجة الحرارة القاعدية',
          lhTest: 'اختبارات الإباضة (LH)',
          cervicalMucus: 'مخاط عنق الرحم',
          symptoms: 'الأعراض',
          mood: 'المزاج',
          intimacy: 'العلاقة الزوجية / الحميمة',
          notes: 'ملاحظات خاصة'
        },
        ovulationNotice: 'الإباضة المقدّرة (تقدير وليس حقيقة مؤكدة): {{date}}.',
        fertileWindowNotice: 'فترة الخصوبة المقدّرة (تقدير): من {{start}} إلى {{end}}.'
      },
      pregnancy: {
        referenceDate: 'التاريخ المرجعي',
        medicalInfo: 'معلومات طبية',
        appointment: 'موعد',
        exam: 'فحص',
        appointmentsCategorySuffix: 'الفحوصات',
        practitioner: 'مقدّم الرعاية',
        weekNotice: 'أسبوع الحمل المقدّر (تقدير بحسب طريقة التأريخ المختارة): {{week}}.'
      },
      contraception: {
        categories: {
          intake: 'متابعة التناول',
          events: 'الحلقة / اللصقة',
          journal: 'اليوميات'
        },
        intakeStatus: {
          taken: 'تم التناول',
          missed: 'فائتة',
          late: 'متأخرة'
        },
        events: {
          ringInsertion: 'وضع الحلقة',
          ringRemoval: 'إزالة الحلقة',
          ringReplacement: 'استبدال الحلقة',
          patchApplication: 'وضع اللصقة',
          patchRemoval: 'إزالة اللصقة',
          patchReplacement: 'استبدال اللصقة'
        },
        methods: {
          pill: 'الحبوب',
          ring: 'الحلقة',
          patch: 'اللصقة',
          other: 'وسيلة أخرى'
        },
        activeMethodNotice: 'وسيلة منع الحمل الحالية: {{method}}.'
      },
      postpartum: {
        categories: {
          fatigue: 'التعب',
          sleep: 'النوم',
          mood: 'المزاج',
          pain: 'الألم',
          physicalRecovery: 'التعافي الجسدي',
          lochia: 'الهلابة'
        },
        consistency: 'القوام'
      },
      loss: {
        categories: {
          bleeding: 'النزف',
          symptoms: 'الأعراض الجسدية'
        }
      },
      menopause: {
        categories: {
          symptoms: 'الأعراض',
          mood: 'المزاج',
          sleep: 'النوم',
          energy: 'الطاقة',
          treatment: 'العلاج الهرموني',
          labResults: 'نتائج التحاليل',
          notes: 'ملاحظات يومية'
        }
      }
    },
    ui: {
      objectives: {
        cycle: 'متابعة الدورة',
        irregular: 'الدورات غير المنتظمة (تكيّس المبايض)',
        conceive: 'محاولة الحمل',
        pregnancy: 'متابعة الحمل',
        contraception: 'منع الحمل',
        postpartum: 'متابعة ما بعد الولادة',
        loss: 'بعد الإجهاض',
        menopause: 'ما قبل انقطاع الطمث / انقطاع الطمث'
      },
      categories: {
        cycle: {
          periods: 'تواريخ الحيض',
          flow: 'تدفّق الحيض',
          symptoms: 'الأعراض',
          mood: 'المزاج',
          sleep: 'النوم',
          activity: 'النشاط',
          hydration: 'شرب الماء',
          notes: 'ملاحظات خاصة',
          intimacy: 'العلاقة الحميمة'
        },
        irregular: {
          period: 'الحيض (التدفّق، التبقّع)',
          acne: 'حب الشباب',
          hairGrowth: 'نمو الشعر',
          pain: 'الألم',
          fatigue: 'التعب والأعراض المرتبطة به',
          mood: 'المزاج',
          weight: 'الوزن',
          notes: 'ملاحظات يومية'
        },
        conceive: {
          temperature: 'درجة الحرارة القاعدية',
          lhTest: 'اختبارات الإباضة (LH)',
          cervicalMucus: 'مخاط عنق الرحم',
          symptoms: 'الأعراض',
          mood: 'المزاج',
          intimacy: 'العلاقة الزوجية / الحميمة',
          notes: 'ملاحظات خاصة'
        },
        pregnancy: {
          symptoms: 'الأعراض',
          weight: 'الوزن',
          mood: 'المزاج',
          sleep: 'النوم',
          appointments: 'المواعيد / الفحوصات',
          medicalInfo: 'معلومات طبية',
          notes: 'ملاحظات شخصية'
        },
        contraception: {
          intake: 'متابعة التناول',
          events: 'الحلقة / اللصقة',
          journal: 'اليوميات (المشاعر، الملاحظات)'
        },
        postpartum: {
          fatigue: 'التعب',
          sleep: 'النوم',
          mood: 'المزاج',
          pain: 'الألم',
          physicalRecovery: 'التعافي الجسدي',
          lochia: 'الهلابة',
          notes: 'ملاحظات شخصية'
        },
        loss: {
          bleeding: 'النزف',
          symptoms: 'الأعراض الجسدية',
          notes: 'ملاحظات شخصية'
        },
        menopause: {
          symptoms: 'الأعراض',
          mood: 'المزاج',
          sleep: 'النوم',
          energy: 'الطاقة',
          treatment: 'العلاج الهرموني',
          labResults: 'نتائج التحاليل (FSH، الإستراديول)',
          notes: 'ملاحظات يومية'
        }
      }
    }
  },
  backupData: {
    title: 'النسخ الاحتياطي',
    subtitleOwner: 'بياناتك دائمًا في أمان 💜',
    subtitleDaughter: 'بيانات {{firstName}} دائمًا في أمان 💜',
    introTitle: 'بياناتك محمية',
    introText: 'يمكن لـ AWA إنشاء نسخة محلية من معلوماتك على هذا الجهاز.',
    sectionSecureBackup: 'نسخ احتياطي آمن',
    statusEnabled: 'النسخ الاحتياطي مفعّل',
    statusDisabled: 'النسخ الاحتياطي معطّل',
    localCopyBadge: 'نسخة محلية',
    lastBackupLabel: 'آخر نسخة احتياطية',
    dataSizeLabel: 'حجم البيانات',
    noBackupYet: 'لا توجد نسخة بعد',
    backupNowTitleOwner: 'انسخي الآن',
    backupNowTitleDaughter: 'نسخ بيانات {{firstName}} احتياطيًا',
    backupNowTextOwner: 'أنشئي نسخة جديدة من بياناتك',
    backupNowTextDaughter: 'أنشئي نسخة جديدة من بيانات {{firstName}}',
    backupButton: 'نسخ احتياطي',
    sectionRestore: 'الاستعادة',
    restoreSubtitleOwner: 'استعيدي بياناتك إلى النسخة السابقة',
    restoreSubtitleDaughter: 'استعيدي بيانات {{firstName}} إلى النسخة السابقة',
    restoreTitleOwner: 'استعادة نسخة احتياطية',
    restoreTitleDaughter: 'استعادة بيانات {{firstName}}',
    sectionManageOwner: 'إدارة بياناتي',
    sectionManageDaughter: 'إدارة بيانات {{firstName}}',
    downloadSubtitleOwner: 'احصلي على نسخة من جميع بياناتك',
    downloadSubtitleDaughter: 'احصلي على نسخة من بيانات {{firstName}}',
    downloadTitleOwner: 'تنزيل بياناتي',
    downloadTitleDaughter: 'تنزيل بيانات {{firstName}}',
    exportSubtitleOwner: 'صدّري سجلّك وبياناتك',
    exportSubtitleDaughter: 'صدّري سجل {{firstName}} وبياناتها',
    exportTitleOwner: 'تصدير بياناتي',
    exportTitleDaughter: 'تصدير بيانات {{firstName}}',
    deleteSubtitleOwner: 'احذفي بيانات متابعتك نهائيًا',
    deleteSubtitleDaughter: 'احذفي بيانات متابعة {{firstName}} نهائيًا',
    deleteTitleOwner: 'حذف بياناتي',
    deleteTitleDaughter: 'حذف بيانات {{firstName}}',
    infoText: 'يحفظ AWA بياناتك محليًا.\nتبقى النسخة المحلية على هذا الجهاز.',
    shareTitleOwner: 'بياناتي في AWA',
    shareTitleDaughter: 'بيانات {{firstName}} — AWA',
    toastBackupDoneOwner: 'اكتمل النسخ الاحتياطي المحلي ✓',
    toastBackupDoneDaughter: 'اكتمل النسخ الاحتياطي لبيانات {{firstName}} ✓',
    toastBackupFailed: 'تعذّر إكمال النسخ الاحتياطي.',
    modal: {
      title: 'النسخ الاحتياطي التلقائي',
      enabledTitle: 'مفعّل',
      enabledText: 'السماح لـ AWA بإنشاء نسخ محلية.',
      wifiTitle: 'عبر Wi-Fi فقط',
      wifiText: 'جاهز لنسخ احتياطي سحابي مستقبلًا.',
      frequencyTitle: 'التكرار المفضّل',
      frequency: {
        daily: 'يوميًا',
        weekly: 'أسبوعيًا',
        manual: 'يدويًا'
      },
      done: 'تم'
    }
  },
  backupUtility: {
    restore: {
      unreadableBackup: 'تعذّرت قراءة هذه النسخة الاحتياطية على هذا الهاتف، لذلك تُركت دون تغيير. استعيدي من ملف نسخة احتياطية مشفّرة بدلًا من ذلك.',
      subtitleOwner: 'استعيدي بياناتك من نسخة احتياطية موجودة.',
      subtitleDaughter: 'استعيدي بيانات {{firstName}} من نسخة احتياطية موجودة.',
      titleOwner: 'الاستعادة',
      titleDaughter: 'استعادة بيانات {{firstName}}',
      heroAvailable: 'توجد نسخة احتياطية',
      heroNone: 'لا توجد نسخة احتياطية',
      heroDescriptionAvailableOwner: 'نسخة من بياناتك جاهزة للاستعادة.',
      heroDescriptionAvailableDaughter: 'نسخة من بيانات {{firstName}} جاهزة للاستعادة.',
      heroDescriptionNone: 'أنشئي نسخة أولًا من قسم النسخ الاحتياطي.',
      dateLabel: 'التاريخ',
      sizeLabel: 'الحجم',
      restoreButton: 'استعادة هذه النسخة',
      confirmTitle: 'تأكيد الاستعادة',
      confirmDescriptionOwner: 'ستُستبدل بياناتك الحالية بهذه النسخة الاحتياطية.',
      confirmDescriptionDaughter: 'ستُستبدل بيانات {{firstName}} الحالية بهذه النسخة الاحتياطية.',
      confirmButton: 'تأكيد',
      successMessage: 'اكتملت الاستعادة بنجاح ✨',
      errorMessage: 'تعذّرت استعادة هذه النسخة.'
    },
    export: {
      subtitleOwner: 'اختاري المعلومات التي تريدين استرجاعها.',
      subtitleDaughter: 'اختاري المعلومات المراد استرجاعها لـ {{firstName}}.',
      titleOwner: 'تصدير بياناتي',
      titleDaughter: 'تصدير بيانات {{firstName}}',
      heroTitle: 'تصديرك المخصّص',
      heroDescription: 'اختاري الفترة والصيغة والمعلومات المراد تضمينها.',
      activeObjectiveLabel: 'الهدف الحالي',
      periodSectionTitle: 'الفترة',
      periodSectionSubtitle: 'اختاري مدة السجل المراد تصديره.',
      periodAll: 'السجل كاملًا',
      period3m: '3 أشهر',
      period6m: '6 أشهر',
      period12m: '12 شهرًا',
      formatSectionTitle: 'الصيغة',
      formatSectionSubtitle: 'يُنشأ CSV وPDF مباشرة على هاتفك.',
      categoriesSectionTitle: 'الفئات',
      categoriesSectionSubtitle: 'لا تُحدَّد البيانات الحساسة تلقائيًا أبدًا.',
      sensitiveBadge: 'بيانات حساسة',
      selectedCount_one: 'تم تحديد فئة واحدة',
      selectedCount_other: 'تم تحديد {{count}} فئة',
      selectedCount_zero: '{{count}} فئة محددة',
      selectedCount_two: '{{count}} فئتان محددتان',
      selectedCount_few: '{{count}} فئات محددة',
      selectedCount_many: '{{count}} فئةً محددة',
      sensitiveWarning: 'يتم فك تشفير الفئات الحساسة طوال مدة التصدير، والملف الذي يُنشأ غير مشفّر: شاركيه فقط مع أشخاص تثقين بهم. سيُطلب منكِ رمزك الخاص (أو القياسات الحيوية).',
      exportButton: 'تصدير بياناتي',
      exportingButton: 'جارٍ الإنشاء…',
      errorNoCategory: 'اختاري فئة واحدة على الأقل للتصدير.',
      errorLocked: 'افتحي مساحتك الخاصة لتصدير البيانات الحساسة.',
      errorEmpty: 'لا توجد بيانات متاحة لهذه الفترة وهذه الفئات.',
      errorFailed: 'فشل التصدير. حاولي مجددًا بعد قليل.',
      privacyPriorityTitle: 'خصوصيتك أولويتنا',
      privacyPriorityDescription: 'لا يشارك AWA معلوماتك أبدًا.',
      premium: {
        pill: 'بريميوم',
        title: 'تصدير CSV وPDF',
        description: 'أنشئي وشاركي تقريرًا كاملًا عن متابعتك في أي وقت.',
        benefit1Title: 'تقارير كاملة ومنظّمة',
        benefit1Description: 'ملفات CSV أو PDF جاهزة للاستخدام أو المشاركة.',
        benefit2Title: 'سجل غير محدود',
        benefit2Description: 'اطّلعي على سجلك كاملًا دون أي حدود.',
        benefit3Title: 'خصوصية مضمونة',
        benefit3Description: 'تبقى بياناتك خاصة وآمنة بنسبة 100%.',
        benefit4Title: 'تحليل متقدم',
        benefit4Description: 'احصلي على عمق ووضوح أكبر من بياناتك.',
        upgradeButton: 'اكتشفي بريميوم'
      }
    },
    delete: {
      subtitleOwner: 'تحكّمي نهائيًا في بيانات متابعتك المحلية.',
      subtitleDaughter: 'تحكّمي نهائيًا في بيانات متابعة {{firstName}} المحلية.',
      titleOwner: 'حذف بياناتي',
      titleDaughter: 'حذف بيانات {{firstName}}',
      irreversibleTitle: 'إجراء لا رجعة فيه',
      descriptionOwner: 'سيؤدي هذا الإجراء إلى حذف بيانات متابعتك المحلية نهائيًا.',
      descriptionDaughter: 'سيؤدي هذا الإجراء إلى حذف بيانات متابعة {{firstName}} المحلية نهائيًا.',
      itemJournal: 'اليوميات',
      itemCycleHistory: 'سجل الدورة',
      itemLocalData: 'بيانات المتابعة المحلية',
      accountNoticeOwner: 'لن يتم حذف حسابك في AWA.',
      accountNoticeDaughter: 'لن يتم حذف الملف الشخصي لـ{{firstName}}، بل بيانات متابعتها فقط، بما في ذلك أول حيض سجّلته وأي توقعات.',
      confirmYourChoice: 'أكّدي اختيارك',
      confirmWord: 'حذف',
      typeToConfirmSubtitle: 'اكتبي {{word}} للمتابعة.',
      validConfirmation: 'التأكيد صحيح',
      errorTypeWord: 'اكتبي {{word}} للتأكيد.',
      deleteButton: 'حذف نهائي',
      footnote: 'لا يمكن التراجع عن هذا الإجراء.',
      doneTitle: 'تم حذف البيانات',
      doneDescriptionOwner: 'تم حذف بيانات متابعتك المحلية بنجاح.',
      doneDescriptionDaughter: 'تم حذف بيانات متابعة {{firstName}} المحلية بنجاح.',
      finishButton: 'تم'
    }
  },
  location: {
    back: 'رجوع',
    title: 'أين تقيمين؟',
    subtitle: 'فعّلي الموقع للحصول على مواقيت صلاة وتذكيرات دقيقة.',
    searchPlaceholder: 'ابحثي عن مدينة',
    useMyLocation: 'استخدام موقعي',
    next: 'التالي',
    save: 'حفظ',
    resolvingLocation: 'جارٍ تحديد موقعك…',
    noPositionSelected: 'لم يتم اختيار موقع',
    positionSelectedOnMap: 'تم اختيار الموقع على الخريطة',
    selectedTitle: 'الموقع المحدد',
    selectedHint: 'سيُستخدم هذا الموقع لحساب مواقيت صلاتك.',
    noCityFoundHere: 'لا توجد مدينة في هذا المكان.',
    noResultsFound: 'لا توجد نتائج.',
    mapsNotConfigured: 'اضبطي مفتاح الخريطة لتفعيلها.',
    map: {
      loading: 'جارٍ تحميل الخريطة…',
      unavailable: 'الخريطة غير متاحة',
      checkConnection: 'تحققي من اتصالك ومن إعداد MapTiler.',
      addKey: 'أضيفي مفتاح MapTiler العام في src/config/maps.ts.'
    },
    gps: {
      permissionTitle: 'السماح بالوصول إلى الموقع',
      permissionMessage: 'يستخدم AWA موقعك لتحديد مدينتك بدقة.',
      permissionAllow: 'سماح',
      permissionDeny: 'رفض',
      configureMapKeyFirst: 'اضبطي مفتاح الخريطة أولًا.',
      permissionDeniedError: 'اسمحي بالوصول إلى الموقع من الإعدادات لاستخدام موقعك.',
      positionUnavailable: 'الموقع غير متاح. تأكدي من تشغيل GPS.',
      timeout: 'استغرق تحديد الموقع وقتًا طويلًا. تحقّقي من الإشارة أو GPS ثم أعيدي المحاولة.'
    },
    errors: {
      generic: 'تعذّر تحديد هذا الموقع حاليًا.',
      notConfigured: 'يجب ضبط مفتاح الخريطة.',
      network: 'لا يوجد اتصال بالإنترنت.',
      invalidKey: 'مفتاح MapTiler غير صالح أو غير مصرّح به.'
    }
  },
  onboarding: {
    splash: {
      logoLabel: 'شعار AWA',
      slogan: 'تطبيق الدورة\nالذي يحترم جسمك\nوبياناتك وإيمانك.'
    },
    welcome: {
      title: 'مرحبًا بكِ',
      brandPrefix: 'في',
      subtitle: 'مساحة شخصية لمتابعة دورتك\nوفهم جسمك والمضيّ قدمًا بطمأنينة.',
      cardTitle: 'مساحتك في AWA',
      cardDescription: 'مساحة شخصية وبسيطة وخاصة.',
      privateBadge: 'خاص',
      feature1Title: 'المتابعة',
      feature1Text: 'مخصّصة لكِ',
      feature2Title: 'البيانات',
      feature2Text: 'محمية',
      feature3Title: 'التجربة',
      feature3Text: 'بإيقاعك',
      start: 'ابدئي',
      alreadyHaveAccount: 'لدي حساب بالفعل'
    },
    name: {
      eyebrow: 'مساحتك الشخصية',
      title: 'بماذا يناديكِ\nAWA؟',
      subtitle: 'يمكنك استخدام اسمك الأول أو اسم مستعار.\nيمكنك تغييره في أي وقت.',
      cardTitle: 'اسمك الأول أو اسمك المستعار',
      cardSubtitle: 'هذا هو الاسم الذي سيخاطبك به AWA.',
      inputLabel: 'الاسم الأول أو الاسم المستعار',
      inputPlaceholder: 'اسمك الأول أو اسمك المستعار',
      privacyHint: 'يمكنك استخدام اسم مستعار',
      previewLabel: 'معاينة',
      previewGreeting: 'السلام عليكم، {{name}} ✨',
      previewGreetingNoName: 'As-salamu ‘alaykum ✨',
      saving: 'جارٍ الحفظ…',
      next: 'التالي',
      footer: 'يمكنك تغيير هذا الاسم لاحقًا من ملفك الشخصي.',
      formSubtitle: 'استخدمي اسمك الأول أو اسمًا مستعارًا.',
      formPlaceholder: 'مثال: أمينة',
      formFooter: 'يمكنك تغييره لاحقًا من ملفك الشخصي.'
    },
    spiritual: {
      title: 'هل تودّين تفعيل\nالمؤشرات الروحية؟',
      subtitle: 'يمكنك تغيير هذا الاختيار في أي وقت.',
      enable: 'نعم، فعّلي',
      disable: 'لا، ليس الآن',
      includesLabel: 'ما الذي يفعّله',
      featureHijri: 'التقويم الهجري',
      featurePrayers: 'الصلوات وحالة الطهارة',
      featureFasting: 'الصيام (رمضان وأيام القضاء)',
      featureReminders: 'تذكيرات الصلاة',
      next: 'التالي'
    },
    summary: {
      stepBadge: 'الخطوة الأخيرة',
      heroTitle: 'كل شيء جاهز',
      heroSubtitle: 'راجعي معلوماتك قبل أن تبدئي.',
      editTip: 'اضغطي على بطاقة لتعديلها',
      sectionTitle: 'معلوماتك',
      sectionSubtitle: 'يمكن تعديل كل شيء قبل المتابعة.',
      cardA11yHint: 'يفتح الشاشة المناسبة لتعديل هذه المعلومة',
      reassuranceTitle: 'أنتِ المتحكّمة',
      reassuranceText: 'يمكنك تغيير هذه المعلومات لاحقًا من الإعدادات.',
      start: 'ابدئي',
      rows: {
        objective: 'الهدف الرئيسي',
        spiritual: 'المؤشرات الروحية',
        spiritualEnabled: 'مفعّلة',
        spiritualDisabled: 'معطّلة',
        location: 'الموقع',
        notProvidedFem: 'غير محددة',
        notProvidedMasc: 'غير محدد',
        lastPeriod: 'آخر حيض',
        periodDuration: 'متوسط مدة الحيض',
        cycleDuration: 'متوسط طول الدورة',
        cycleRegular: 'دورة منتظمة',
        regularityUnknown: 'قيد الملاحظة',
        datingMethod: 'تحديد عمر الحمل',
        datingMethodLastPeriod: 'أول يوم من آخر حيض',
        datingMethodDueDate: 'تاريخ الولادة المتوقع',
        datingMethodConceptionDate: 'تاريخ الحمل التقديري',
        datingMethodLater: 'أملؤه لاحقًا',
        dailyTracking: 'المتابعة اليومية',
        trackingSymptoms: 'الأعراض',
        trackingMood: 'المزاج',
        trackingWeight: 'الوزن',
        trackingSleep: 'النوم',
        trackingHydration: 'شرب الماء',
        trackingActivity: 'النشاط البدني',
        trackingNotes: 'الملاحظات الشخصية',
        trackingMedicalInfo: 'المعلومات الطبية الشخصية',
        trackingAppointments: 'المواعيد والفحوص',
        allSelected: '{{count}} عناصر محددة',
        noneSelected: 'لا شيء محدد',
        reminders: 'التذكيرات',
        reminderAppointments: 'المواعيد',
        reminderExams: 'الفحوص',
        reminderDailyJournal: 'اليوميات',
        remindersAllActive: '{{count}} تذكيرات مفعّلة',
        remindersNoneActive: 'لا توجد تذكيرات مفعّلة',
        remindersDisabled: 'معطّلة',
        deliveryDate: 'تاريخ الولادة',
        deliveryType: 'نوع الولادة',
        deliveryTypeVaginal: 'ولادة طبيعية',
        deliveryTypePlannedCsection: 'قيصرية مخطط لها',
        deliveryTypeEmergencyCsection: 'قيصرية طارئة',
        deliveryTypePreferNotToSay: 'أفضّل عدم الإفصاح',
        feeding: 'التغذية',
        feedingExclusiveBreastfeeding: 'رضاعة طبيعية حصرية',
        feedingMixed: 'تغذية مختلطة (ثدي وزجاجة)',
        feedingExclusiveBottle: 'رضاعة بالزجاجة حصرًا',
        feedingUnknown: 'لست متأكدة بعد',
        dailyTrackingReminderAt: 'المتابعة اليومية عند {{time}}',
        dailyJournalAt: 'اليوميات عند {{time}}',
        contraceptionMethod: 'وسيلة منع الحمل',
        contraceptionSince: 'منذ متى',
        pillSchedule: 'جدول الحبوب',
        pillScheduleCyclic: '{{activeDays}} يومًا + {{breakDays}} أيام توقف',
        pillScheduleContinuous: 'استخدام متواصل',
        contraceptionRemindersEnabled: 'مفعّلة',
        contraceptionRemindersUnavailable: 'غير متاحة',
        contraceptionRemindersDisabled: 'معطّلة',
        tryingDuration: 'محاولة الحمل',
        tryingDurationStartingNow: 'أبدأ الآن',
        tryingDurationUnder3Months: 'أقل من 3 أشهر',
        tryingDuration3To6Months: 'من 3 إلى 6 أشهر',
        tryingDuration6To12Months: 'من 6 إلى 12 شهرًا',
        tryingDurationOver1Year: 'أكثر من سنة',
        ovulationAwareness: 'تتبّع الإباضة',
        ovulationAwarenessOften: 'نعم، غالبًا',
        ovulationAwarenessSometimes: 'أحيانًا',
        ovulationAwarenessNotReally: 'ليس فعلًا',
        indicators: 'المؤشرات المتابَعة',
        indicatorTemperature: 'درجة الحرارة القاعدية',
        indicatorCervicalMucus: 'مخاط عنق الرحم',
        indicatorLhTests: 'اختبارات الهرمون الملوتن (LH)',
        indicatorIntercourse: 'العلاقة الزوجية',
        allIndicators: 'كل المؤشرات',
        conceptionReminderFertileWindow: 'فترة الخصوبة',
        conceptionReminderEstimatedOvulation: 'الإباضة المتوقعة',
        conceptionReminderLhTest: 'اختبار الهرمون الملوتن (LH)',
        allReminders: 'كل التذكيرات',
        miscarriageDate: 'تاريخ الإجهاض',
        currentBleeding: 'النزف الحالي',
        bleedingVariable: 'لست متأكدة / يتفاوت',
        cycleReturn: 'عودة الدورة',
        cycleReturnYes: 'نعم، عاد الحيض',
        cycleReturnNo: 'لا، ليس بعد',
        cycleReturnUnknown: 'لست متأكدة بعد',
        firstReturnedPeriod: 'أول حيض بعد العودة',
        tryingAgain: 'محاولة الحمل من جديد',
        tryingAgainNotNow: 'ليس الآن',
        tryingAgainSoon: 'قريبًا',
        tryingAgainReady: 'نعم، أشعر أنني مستعدة',
        menopauseStage: 'المرحلة الحالية',
        menopauseStagePerimenopause: 'ما قبل انقطاع الطمث',
        menopauseStageMenopause: 'انقطاع الطمث',
        menopauseStageUnsure: 'لست متأكدة بعد',
        menopauseSymptoms: 'الأعراض المتابَعة',
        symptomHotFlashes: 'الهبّات الساخنة',
        symptomNightSweats: 'التعرّق الليلي',
        symptomSleepDisturbances: 'اضطرابات النوم',
        symptomFatigue: 'الإرهاق',
        symptomMoodChanges: 'تقلبات المزاج',
        symptomBrainFog: 'ضبابية الذهن',
        allSymptoms: 'كل الأعراض',
        hormonalTreatment: 'العلاج الهرموني',
        hormonalTreatmentTrack: 'نعم، يُتابَع في AWA',
        hormonalTreatmentNotNow: 'ليس في الوقت الحالي',
        labTracking: 'التحاليل المخبرية',
        labTrackingFsh: 'FSH',
        labTrackingEstradiol: 'الإستراديول',
        labTrackingBoth: 'الهرمون المنبّه للجريب (FSH) والإستراديول',
        labTrackingNone: 'ليس في الوقت الحالي',
        treatmentReminderAt: 'العلاج عند {{time}}',
        cyclePattern: 'نمط الدورة',
        cyclePatternRegular: 'منتظمة نسبيًا',
        cyclePatternIrregular: 'غير منتظمة',
        cyclePatternVeryVariable: 'شديدة التفاوت',
        cyclePatternUnknown: 'لست متأكدة بعد',
        trackedItems: 'متابعة مخصّصة',
        itemAcne: 'حب الشباب',
        itemHairGrowth: 'نمو الشعر',
        itemWeight: 'الوزن',
        itemPain: 'الألم',
        itemMood: 'المزاج',
        itemFatigue: 'الإرهاق',
        itemOtherSymptoms: 'أعراض أخرى',
        allItems: 'كل العناصر',
        unrecordedPeriods: 'فترات حيض غير مسجّلة',
        security: 'الأمان',
        securityPinEnabled: 'رمز PIN مفعّل',
        securityBiometricEnabled: 'القياسات الحيوية مفعّلة',
        securityNone: 'بلا حماية إضافية',
        privacy: 'الخصوصية',
        privacyDiscreetMode: 'الوضع الخفي مفعّل',
        privacyHiddenPreviews: 'المعاينات مخفية',
        privacyProtectedContent: 'المحتوى الخاص محمي',
        privacyStandard: 'الإعدادات القياسية'
      }
    }
  },
  auth: {
    shared: {
      tabLogin: 'تسجيل الدخول',
      tabRegister: 'إنشاء حساب',
      hidePassword: 'إخفاء كلمة المرور',
      showPassword: 'إظهار كلمة المرور',
      orContinueWith: 'أو تابعي عبر',
      continueWithGoogle: 'المتابعة عبر Google',
      continueWithApple: 'المتابعة عبر Apple',
      continueWithEmail: 'المتابعة بعنوان بريد إلكتروني',legalTerms: 'شروط الاستخدام وسياسة الخصوصية.',
      createAccount: 'إنشاء حسابي'
    },
    login: {
      tagline: 'لحياة متوازنة،\nفي كل خطوة.',
      emailPlaceholder: 'البريد الإلكتروني',
      passwordPlaceholder: 'كلمة المرور',
      passwordFieldPlaceholder: 'أدخلي كلمة المرور',
      forgotPassword: 'نسيتِ كلمة المرور؟',
      submit: 'تسجيل الدخول',
      legalPrefix: 'بمتابعتك، فإنك توافقين على'
    },
    registration: {
      title: 'أنشئي حسابك',
      subtitle: 'انضمي إلى AWA وابدئي\nرحلتك بطمأنينة.',
      firstNameLabel: 'الاسم الأول',
      firstNamePlaceholder: 'أدخلي اسمك الأول',
      lastNameLabel: 'اسم العائلة',
      lastNamePlaceholder: 'أدخلي اسم عائلتك',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخلي بريدك الإلكتروني',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أنشئي كلمة مرور',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: 'أكّدي كلمة المرور',
      ruleMinLength: '8 أحرف على الأقل',
      ruleDigit: 'رقم',
      ruleUppercase: 'حرف كبير',
      ruleSpecialChar: 'رمز خاص',
      hint: '8 أحرف على الأقل، وحرف كبير، ورقم، ورمز خاص',
      legalPrefix: 'بإنشائك حسابًا، فإنك توافقين على',
      togglePasswordShow: 'إظهار',
      togglePasswordHide: 'إخفاء',
      toggleVisibilityLabel: '{{action}}: {{label}}'
    },
    forgotPassword: {
      title: 'نسيتِ كلمة المرور؟',
      subtitle: 'لا تقلقي. أدخلي بريدك الإلكتروني\nوسنرسل لكِ رابط إعادة التعيين.',
      emailRequiredError: 'أدخلي بريدك الإلكتروني.',
      emailInvalidError: 'أدخلي بريدًا إلكترونيًا صالحًا.',
      cardText: 'سنرسل لكِ التعليمات اللازمة لإعادة تعيين كلمة المرور.',
      emailFieldPlaceholder: 'example@email.com',
      submit: 'إرسال رابط إعادة التعيين',
      infoValidEmail: 'العنوان صالح. سيتوفر إرسال رابط إعادة التعيين عند تشغيل خدمة المصادقة.',
      helpTitle: 'هل تحتاجين إلى مساعدة؟',
      helpText: 'تواصلي مع فريق الدعم، نحن هنا لمساعدتك.',
      helpAlertMessage: 'سيرد عليكِ فريق الدعم في أقرب وقت ممكن.',
      helpModalCta: 'فهمت',
      helpModalCloseAccessibility: 'إغلاق'
    }
  },  security: {
    incorrectCode: 'رمز PIN غير صحيح. حاولي مجددًا.',
    genericError: 'حدث خطأ ما. حاولي مجددًا.',
    codesDontMatch: 'الرمزان غير متطابقين. ابدئي من جديد.',
    authCancelledOrUnavailable: 'تم إلغاء المصادقة أو أنها غير متاحة.',
    enabled: 'مفعّل'
  },
  biometrics: {
    faceId: 'Face ID',
    touchId: 'Touch ID',
    fingerprintLabel: 'بصمة الإصبع',
    genericLabel: 'القياسات الحيوية',
    useFaceId: 'استخدام Face ID',
    useTouchId: 'استخدام Touch ID',
    useFingerprint: 'استخدام بصمة الإصبع',
    useGeneric: 'استخدام القياسات الحيوية'
  },
  appLock: {
    title: 'مساحتك محمية',
    subtitle: 'أكّدي هويتك للوصول إلى مساحتك الشخصية.',
    biometricFailed: 'فشلت المصادقة. حاولي مجددًا.',
    pinVerifyError: 'تعذّر التحقق. حاولي مجددًا.',
    enterPinTitle: 'أدخلي رمز PIN',
    enterPinSubtitle: '{{length}} أرقام',
    biometricAreaTitle: 'التحقق بالقياسات الحيوية',
    biometricAreaText: 'استخدمي القياسات الحيوية الآمنة في جهازك لفتح AWA.',
    verifying: 'جارٍ التحقق…',
    usePin: 'استخدام رمز PIN',
    useBiometrics: 'استخدام القياسات الحيوية',
    biometricPromptTitle: 'فتح AWA',
    biometricPromptSubtitle: 'أكّدي هويتك للوصول إلى مساحتك.'
  },
  pinSetup: {
    confirmIdentityTitle: 'أكّدي هويتك',
    enterCurrentTitle: 'أدخلي رمز PIN الحالي',
    createTitle: 'أنشئي رمز PIN',
    confirmIdentitySubtitle: 'أدخلي رمز PIN الحالي لإيقاف الحماية.',
    verifyIdentitySubtitle: 'أكّدي هويتك قبل اختيار رمز PIN جديد.',
    createSubtitle: 'اختاري رمز PIN من {{length}} أرقام لحماية مساحتك في AWA.',
    footerNote: 'يبقى رمز PIN محميًا في وحدة التخزين الآمنة بهذا الجهاز.'
  },
  pinConfirm: {
    setupExpired: 'انتهت صلاحية الإعداد. ابدئي من جديد.',
    saveFailed: 'تعذّر حفظ رمز PIN. حاولي مجددًا.',
    title: 'أكّدي رمز PIN',
    subtitle: 'أدخليه مرة ثانية للتأكيد.'
  },
  pinManagement: {
    title: 'رمز PIN',
    protectionEnabled: 'الحماية مفعّلة',
    protectionDisabled: 'الحماية معطّلة',
    changePin: 'تغيير رمز PIN',
    disablePin: 'إيقاف رمز PIN',
    enablePin: 'تفعيل رمز PIN'
  },
  pinKeypad: {
    digitsEnteredHint: 'تم إدخال {{count}} من {{total}} أرقام',
    deleteLastDigit: 'حذف آخر رقم',
    digitLabel: 'الرقم {{digit}}'
  },
  faceIdSetup: {
    unavailable: 'القياسات الحيوية غير متاحة على هذا الجهاز.',
    noCapability: 'لم يتم إعداد أي وسيلة قياسات حيوية على هذا الجهاز.',
    authFailedOrCancelled: 'فشلت المصادقة أو تم إلغاؤها.',
    enabledSuccess: 'تم تفعيل {{label}}.',
    disabledSuccess: 'تم إيقاف {{label}}.',
    enableTitle: 'تفعيل {{label}}',
    manageTitle: 'إدارة {{label}}',
    subtitleAvailable: 'احمي الوصول إلى AWA بالقياسات الحيوية الآمنة في جهازك.',
    subtitleUnavailable: 'لم يتم رصد أي وسيلة قياسات حيوية قابلة للاستخدام.',
    securityBadge: 'الأمان',
    secureVerificationTitle: 'تحقق آمن',
    secureVerificationText: 'يستخدم AWA فقط نافذة القياسات الحيوية الأصلية في جهازك. لا يتم تخزين أي بيانات حيوية في التطبيق إطلاقًا.',
    verifyingBiometrics: 'جارٍ التحقق من القياسات الحيوية…',
    footerHint: 'يمكنك إيقاف هذا في أي وقت من الإعدادات.',
    disableAction: 'إيقاف {{label}}'
  },
  privacySecurity: {
    backA11y: 'رجوع',
    title: 'الخصوصية والأمان',
    subtitle: 'بياناتك وخصوصيتك واختيارك',
    introTitle: 'أنتِ المتحكّمة',
    introText: 'تحكّمي في خصوصية بياناتك واختاري الحمايات التي تناسبك.',
    sectionAccess: 'الوصول والحماية',
    pinTitle: 'رمز PIN',
    pinSubtitleOn: 'اضغطي للتغيير أو الإيقاف',
    pinSubtitleOff: 'احمي الوصول إلى تطبيقك',
    biometrySubtitleOn: 'اضغطي للاختبار أو الإيقاف',
    biometrySubtitleOff: 'فتح آمن بالوسيلة الأصلية',
    discreetModeTitle: 'الوضع الخفي',
    discreetModeSubtitle: 'إخفاء المحتوى الحساس في التطبيق',
    discreetNotificationsTitle: 'إشعارات خفية',
    discreetNotificationsSubtitle: 'استخدام إشعارات خفية',
    hideNotificationPreviewTitle: 'إخفاء معاينة الإشعارات',
    hideNotificationPreviewSubtitle: 'عدم عرض المحتوى على شاشة القفل',
    discreetAppearanceTitle: 'مظهر خفي',
    discreetAppearanceSubtitle: 'اسم التطبيق وأيقونته على شاشتك الرئيسية',
    sectionSensitive: 'المحتوى الحساس',
    intimacyTitle: 'حماية الحياة الحميمة',
    intimacySubtitle: 'قفل قسم الحياة الحميمة',
    privateContentTitle: 'حماية الملاحظات والصور الخاصة',
    privateContentSubtitle: 'قفل ملاحظاتك وصورك الشخصية',
    sectionAccount: 'الحساب والبيانات',dataManagementTitle: 'إدارة البيانات',
    dataManagementSubtitle: 'عرض بياناتك أو تصديرها أو حذفها',
    deleteAccountTitle: 'حذف حسابي',
    deleteAccountSubtitle: 'حذف حسابك وبياناتك نهائيًا',
    footerInfo: 'تبقى إعدادات الخصوصية تحت تحكّمك.\nيمكنك تغييرها في أي وقت.',
    statusOn: 'مفعّل',
    statusOff: 'معطّل',
    statusOnFeminine: 'مفعّلة',
    statusOffFeminine: 'معطّلة'
  },
  dataPrivacy: {
    management: {
      heroTitle: 'بياناتك في AWA',
      storageCount_one: 'يُستخدم حاليًا {{count}} مساحة تخزين محلية على هذا الجهاز.',
      storageCount_other: 'تُستخدم حاليًا {{count}} مساحات تخزين محلية على هذا الجهاز.',
      storageCount_zero: 'لا تُستخدم أي مساحة تخزين محلية ({{count}}) على هذا الجهاز حاليًا.',
      storageCount_two: 'تُستخدم حاليًا مساحتا تخزين محليتان ({{count}}) على هذا الجهاز.',
      storageCount_few: 'تُستخدم حاليًا {{count}} مساحات تخزين محلية على هذا الجهاز.',
      storageCount_many: 'تُستخدم حاليًا {{count}} مساحة تخزين محلية على هذا الجهاز.',
      exportTitle: 'تصدير بياناتي',
      exportDescription: 'أنشئي نسخة JSON عبر قائمة المشاركة الآمنة.',
      exportShareTitle: 'بياناتي في AWA',
      deletionInfoButton: 'معلومات حول الحذف',
      deletionInfoMessage: 'لحذف كل شيء، استخدمي «حذف حسابي» في الشاشة السابقة.'
    },
    deleteAccount: {
      warningTitle: 'هذا الإجراء لا رجعة فيه',
      warningText: 'سيتم حذف جميع بيانات AWA المحفوظة محليًا على هذا الجهاز نهائيًا.',
      confirmWord: 'حذف',
      confirmLabel: 'اكتبي «حذف» للتأكيد',
      confirmError: 'اكتبي «حذف» للتأكيد.',
      deleteButton: 'حذف نهائي',
      deleteButtonAccessibility: 'حذف حسابي نهائيًا'
    }
  },
  discreetLauncher: {
    backA11y: 'رجوع',
    title: 'المظهر المتحفظ',
    subtitle: 'اختاري كيف يظهر AWA على شاشتك الرئيسية',
    infoCard: 'يغيّر هذا الخيار اسم التطبيق وأيقونته فقط على شاشتك الرئيسية. تبقى بياناتك وحمايتها (رمز PIN، البصمة، التشفير) كما هي تمامًا، أيًّا كانت الهوية التي تختارينها.',
    androidOnly: 'هذه الميزة متاحة على Android فقط.',
    sectionChoose: 'اختاري مظهرًا',
    loadError: 'تعذّرت قراءة المظهر الحالي الآن.',
    retry: 'إعادة المحاولة',
    awaTitle: 'AWA',
    awaDescription: 'اسم AWA وأيقونته الأصليان',
    discreetTitle: 'أجندة',
    discreetDescription: 'يظهر كتطبيق أجندة عادي، دون أي إشارة إلى AWA',
    switching: 'جارٍ التغيير…',
    unsupportedVendor: 'هذه الميزة محدودة بواجهة الشاشة الرئيسية في هاتفك.',
    noteDelay: 'قد تستغرق الأيقونة الجديدة بضع ثوانٍ لتظهر بحسب واجهة Android في هاتفك.',
    close: 'إغلاق',
    cancel: 'إلغاء',
    identityCardA11y: '{{title}} — {{description}}',
    switchDiscreetTitle: 'تفعيل المظهر المتحفظ؟',
    switchDiscreetBody: 'سيظهر التطبيق باسم «أجندة» وبأيقونة عادية على شاشتك الرئيسية. ستبقى بياناتك وإعداداتك دون تغيير.',
    switchDiscreetConfirm: 'تفعيل',
    switchAwaTitle: 'استعادة مظهر AWA؟',
    switchAwaBody: 'سيظهر التطبيق من جديد باسم AWA وأيقونته.',
    switchAwaConfirm: 'استعادة',
    confirming: 'يُرجى الانتظار…',
    errorModalTitle: 'تعذّر تغيير المظهر',
    errorModalBody: 'تعذّر تغيير مظهر التطبيق الآن. لم تتغير هويتك الحالية. حاولي مرة أخرى لاحقًا.',
    unsupportedVendorModalTitle: 'التغيير غير مدعوم',
    unsupportedVendorModalBody: 'تغيير الأيقونة غير مدعوم على هذا الهاتف. هذه الميزة محدودة بواجهة الشاشة الرئيسية في جهازك. لم تتغير هويتك الحالية.'
  },
  privateAccess: {
    purposeMiscarriagePersonalNotes: 'ملاحظاتك الشخصية محمية.',
    purposePregnancyMedicalInformation: 'معلوماتك الطبية الشخصية محمية.',
    confirmNewCode: 'أكّدي رمز PIN الجديد.',
    authNotRecognized: 'لم يتم التعرف على المصادقة. حاولي مرة أخرى.',
    enterPinToContinue: 'أدخلي رمز PIN للمتابعة',
    confirmPin: 'أكّدي رمز PIN',
    createPinToContinue: 'أنشئي رمز PIN للمتابعة',
    title: 'المساحة الخاصة',
    subtitle: 'مساحتك، لكِ وحدك',
    digitsEnteredOf: 'تم إدخال {{count}} من {{total}} أرقام',
    deleteKey: 'حذف',
    privacyCardTitle: 'خصوصية وأمان بنسبة 100%',
    privacyCardText: 'تبقى جميع معلوماتك محمية على جهازك.'
  },
  securitySetup: {
    heroTitle: 'احمي مساحتك',
    heroSubtitle: 'اختاري وسائل الحماية التي ترغبين في تفعيلها. يمكنك تغيير هذه الإعدادات في أي وقت.',
    statusCardTitle: 'حماية مساحتك',
    statusNoneActive: 'لا توجد حماية اختيارية مفعّلة',
    statusActiveCount_one: '{{count}} حماية مفعّلة',
    statusActiveCount_other: '{{count}} حماية مفعّلة',
    statusActiveCount_zero: 'لا توجد حماية مفعّلة ({{count}})',
    statusActiveCount_two: '{{count}} حمايتان مفعّلتان',
    statusActiveCount_few: '{{count}} وسائل حماية مفعّلة',
    statusActiveCount_many: '{{count}} وسيلة حماية مفعّلة',
    sectionTitle: 'وسائل حمايتك',
    sectionSubtitle: 'فعّلي فقط ما يناسبك',
    pinTitle: 'رمز PIN',
    pinDescription: 'اقفلي AWA عند الفتح برمز شخصي.',
    biometricsTitle: 'القياسات الحيوية',
    biometricsDescription: 'استخدمي بصمة الإصبع أو التعرف على الوجه في جهازك.',
    discreetNotificationsTitle: 'إشعارات متحفظة',
    discreetNotificationsDescription: 'أخفي التفاصيل الحساسة في معاينات الإشعارات.',
    infoTitle: 'تبقى اختياراتك خاصة',
    infoText: 'تُحفظ هذه الإعدادات لحماية استخدامك لـ AWA ويمكن تغييرها لاحقًا.'
  },
  privacyScreen: {
    title: 'خصوصيتك\nهي أولويتنا',
    subtitle: 'تحتفظين بالتحكم الكامل في بياناتك.\nونحن نحميها في كل خطوة.',
    guarantees: {
      noResaleTitle: 'لا بيع للبيانات',
      noResaleDescription: 'لا تُباع بياناتك ولا تُنقل ولا تُستخدم لأغراض تجارية أبدًا.',
      fullControlTitle: 'تحكّم كامل',
      fullControlDescription: 'تبقين متحكمة في معلوماتك وفي طريقة استخدامها، في كل وقت.',
      noExportTitle: 'لا تصدير خارجي',
      noExportDescription: 'لا تُصدَّر بياناتك الشخصية أبدًا خارج الخدمة.',
      encryptedTitle: 'مشفّرة ومجهولة الهوية',
      encryptedDescription: 'المعلومات الحساسة محمية، وبيانات الهوية مجهّلة.'
    },
    commitmentTitle: 'التزامنا',
    commitmentSubtitle: 'تبقى معلوماتك خاصة.',
    commitmentFullControl: 'تبقين متحكمة في بياناتك في كل وقت.',
    commitmentNoExport: 'لا يتم تصدير أي من بياناتك الشخصية.',
    commitmentNoInternalAccess: 'لا يُسمح بأي وصول داخلي إلا في حدود العمليات الضرورية والآمنة تمامًا.',
    commitmentIdentityEncrypted: 'بيانات الهوية، مثل اسمك، مشفّرة ومجهّلة.',
    freedomTitle: 'تبقين حرّة',
    freedomText: 'يمكنك تغيير تفضيلاتك أو طلب حذف بياناتك في أي وقت من الإعدادات.',
    next: 'التالي'
  },
  premium: {
    sheet: {
      closeAccessibility: 'إغلاق AWA بريميوم',
      heroTitle: 'AWA بريميوم',
      heroBadge: 'بريميوم',
      heroSubtitle: 'تجربة أغنى،\nمصمَّمة حولك.',
      introEyebrow: 'تجربة بريميوم الخاصة بك',
      introTitle: 'إمكانات أكثر،\nبكل بساطة.',
      introSubtitleAvailable: 'افتحي الأدوات التي تُثري متابعتك اليومية.',
      introSubtitleUnavailable: 'اكتشفي الأدوات المخطط لها لإثراء متابعتك اليومية.',
      planEyebrowAvailable: 'اشتراكك',
      planEyebrowUnavailable: 'قريبًا',
      planTitleAvailable: 'اختاري الخطة التي تناسبك',
      planTitleUnavailable: 'الاشتراكات قادمة قريبًا',
      planSubtitleAvailable: 'غيّري اختيارك بحرية قبل المتابعة.',
      planSubtitleUnavailable: 'الخطط أدناه معروضة للاطلاع فقط — لا يمكن الشراء بعد.',
      secure: 'آمن',
      recommended: 'موصى به',
      bestChoice: 'الأفضل قيمة',
      recommendedPlanFeature: 'وصول إلى بريميوم لمدة 12 شهرًا',
      comingSoon: 'قريبًا',
      planComingSoonAccessibility: '{{label}}، قريبًا',
      choosePlanAccessibility: 'اختيار {{label}}',
      securityTitleAvailable: 'الدفع عبر المنصة',
      securityTitleUnavailable: 'لا دفع حاليًا',
      securityTextAvailable: 'ستتم إدارة مشترياتك واشتراكاتك عبر Google Play أو App Store.',
      securityTextUnavailable: 'لا يُطلب أي دفع ما دامت الاشتراكات غير متاحة بعد.',
      activeSubtitle: 'شكرًا لدعمك AWA — استمتعي بكل مزايا بريميوم.',
      unavailableTitle: 'الاشتراك قريبًا',
      unavailableSubtitle: 'AWA بريميوم غير متاح للشراء بعد.',
      ctaInProgressHint: 'عملية الشراء جارية',
      ctaAccessibilityLabel: 'الاشتراك في AWA بريميوم',
      ctaInProgressText: 'جارٍ الشراء…',
      ctaText: 'اشتركي الآن',
      restoreText: 'استعادة المشتريات',
      restoreInProgressText: 'جارٍ الاستعادة…',
      footerDisclaimer: 'لا يمكن الشراء بعد ولن يُطلب أي دفع.',
      benefits: {
        exportsTitle: 'تصدير البيانات الصحية',
        exportsDescription: 'أنشئي تقارير PDF وCSV بسهولة.',
        advancedStatisticsDescription: 'حلّلي تقدّمك على مدى 3 و6 و12 شهرًا.',
        unlimitedHistoryDescription: 'اطّلعي على جميع بياناتك دون حدّ.',
        guidesTitle: 'أدلة معمّقة',
        guidesDescription: 'اطّلعي على محتوى تثقيفي حصري.',
        customizationTitle: 'مزيد من التخصيص',
        customizationDescription: 'استمتعي بسمات وإعدادات إضافية.'
      },
      feedback: {
        subscribeSuccess: 'تم تفعيل AWA بريميوم. شكرًا لكِ!',
        unavailable: 'لن يتم تفعيل أي شراء إلى أن يتم ربط نظام الدفع.',
        subscribeError: 'حدث خطأ ما. حاولي مرة أخرى بعد قليل.',
        restoreSuccess: 'تمت استعادة مشترياتك.',
        restoreError: 'تعذّرت استعادة مشترياتك الآن.'
      }
    },
    plans: {
      annualLabel: 'اشتراك سنوي',
      annualDetail: '12 شهرًا',
      monthlyLabel: 'اشتراك شهري',
      monthlyDetail: 'وصول كامل دون التزام'
    },
    lockedCard: {
      badge: 'بريميوم'
    },
    articleBadge: {
      unlocked: 'محتوى بريميوم',
      locked: 'محتوى بريميوم مقفل',
      label: 'بريميوم'
    },
    providerError: 'AWA بريميوم غير متاح على هذا الجهاز بعد. حاولي مرة أخرى لاحقًا.'
  },
  personalInformation: {
    title: 'المعلومات الشخصية',
    subtitle: 'أدِيري معلوماتك الأساسية 🌸',
    greeting: 'السلام عليكم! 💜',
    intro: 'تُستخدم هذه المعلومات لتخصيص تجربتك في AWA.',
    addPhoto: 'إضافة صورة',
    editPhoto: 'تعديل الصورة',
    changePhoto: 'تغيير الصورة',
    changeMyPhoto: 'تغيير صورتي',
    basicInfoSection: 'المعلومات الأساسية',
    preferencesSection: 'التفضيلات الشخصية',
    firstNameLabel: 'الاسم الأول',
    lastNameLabel: 'اسم العائلة',
    birthDateLabel: 'تاريخ الميلاد',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الهاتف',
    countryLabel: 'البلد',
    languageLabel: 'اللغة',
    preferredNameQuestion: 'بماذا تودّين أن ينادِيَكِ AWA؟',
    mainCalendarLabel: 'التقويم الرئيسي',
    timeFormatLabel: 'صيغة الوقت',
    time24h: '24 ساعة',
    time12h: '12 ساعة',
    infoCardText: 'يمكنك تغيير هذه المعلومات في أي وقت.\nقد تؤثر بعض التغييرات على توقعاتك.',
    requiredField: 'هذا الحقل مطلوب.',
    invalidEmail: 'أدخلي بريدًا إلكترونيًا صالحًا.',
    invalidPhone: 'أدخلي رقم هاتف دوليًا صالحًا.',
    editFirstNameTitle: 'تعديل الاسم الأول',
    editLastNameTitle: 'تعديل اسم العائلة',
    editEmailTitle: 'تعديل البريد الإلكتروني',
    editPhoneTitle: 'تعديل رقم الهاتف',
    preferredNameSheetTitle: 'بماذا يناديكِ AWA؟',
    preferredNameFieldLabel: 'الاسم المفضّل',
    photoSheetTitle: 'صورة الملف الشخصي',
    takePhoto: 'التقاط صورة',
    chooseFromGallery: 'اختيار من المعرض',
    deletePhoto: 'حذف الصورة',
    chooseCountryTitle: 'اختيار البلد',
    searchCountryPlaceholder: 'ابحثي عن بلد',
    calendarSheetTitle: 'التقويم الرئيسي',
    timeFormatSheetTitle: 'صيغة الوقت',
    time24hExample: 'مثال: 08:30 و20:30',
    time12hExample: 'مثال: 8:30 ص و8:30 م',
    toastUpdated: 'تم تحديث المعلومات ✓',
    calendars: {
      gregorianLabel: 'الميلادي',
      gregorianDetail: '14 مايو 2026',
      hijriLabel: 'الهجري',
      hijriDetail: '27 ذو القعدة 1447',
      doubleLabel: 'كلاهما',
      doubleDetail: 'الميلادي + الهجري'
    }
  },  appearanceThemes: {
    "awa-original": 'ناعم ومتناغم',
    "lavender-night": 'أنيق ومهدّئ',
    "rose-quartz": 'ناعم وأنثوي',
    "sage-serenity": 'طبيعي ومتوازن',
    "ocean-calm": 'هادئ ومنعش',
    "warm-sand": 'دافئ وطبيعي',
    midnight: 'عميق وراقٍ'
  },
  appearanceThemeNames: {
    "awa-original": 'AWA الأصلي',
    "lavender-night": 'ليل الخزامى',
    "rose-quartz": 'كوارتز وردي',
    "sage-serenity": 'سكون الميرمية',
    "ocean-calm": 'هدوء المحيط',
    "warm-sand": 'رمال دافئة',
    midnight: 'منتصف الليل'
  },
  prayerTimes: {
    // Display names of the five prayers (identifiers stay Fajr / Dhuhr / Asr / Maghrib / Isha; other languages have no such keys and show the identifier)
    names: {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    },
    title: 'أوقات الصلاة',
    settingsAccessibility: 'إعدادات أوقات الصلاة',
    modify: 'تعديل',
    locationUndefined: 'غير محدد',
    fajrAngle: 'الفجر - زاوية {{angle}}°',
    spiritualAdviceEyebrow: 'نصيحة روحية',
    missedPrayersNote: 'الصلوات الفائتة أثناء الحيض لا يلزم قضاؤها.',
    guidanceSubtitle: 'اكتشفي تذكيرات ومحتوى يدعم ممارستك اليومية.',
    hijriSectionTitle: 'التقويم الهجري',
    countryLabel: 'البلد',
    adjustHijriLabel: 'تعديل التاريخ الهجري',
    adjustmentNone: 'بدون',
    adjustmentPlusOneDay: '+1 يوم',
    adjustmentMinusOneDay: '-1 يوم',
    adjustmentAccessibility: 'تعديل التاريخ الهجري: {{label}}',
    adjustmentHelper: 'اتركيه على «بدون» إذا كان التاريخ المعروض يطابق التاريخ المعتمد في منطقتك.',
    adjustmentActiveNotePlus: 'تم تعديل التقويم بمقدار +1 يوم',
    adjustmentActiveNoteMinus: 'تم تعديل التقويم بمقدار −1 يوم',
    aboutHijri: 'حول التقويم الهجري',
    aboutHijriParagraph1: 'التواريخ الهجرية محسوبة وقد تختلف بيوم واحد بحسب رؤية الهلال والإعلانات الرسمية المحلية.',
    aboutHijriMethod: 'الطريقة: التقويم الهجري المحسوب',
    aboutHijriParagraph2: 'البلد المعروض هو الموقع المستخدم لحساب أوقات صلاتك. وهذا لا يعني أن AWA يسترجع تلقائيًا الإعلانات الرسمية لذلك البلد.',
    nextPrayerEndCaption: 'نهاية الوقت · {{time}}',
    calculating: 'جارٍ الحساب…',
    countdownMinutes: 'بعد {{minutes}} د',
    countdownHours: 'بعد {{hours}} س',
    countdownHoursMinutes: 'بعد {{hours}} س {{minutes}} د',
    schedule: {
      title: 'جدول اليوم',
      localTimes: 'التوقيت المحلي',
      footnote: 'تُحسب الأوقات انطلاقًا من موقعك. تذكّري أن تتحققي منها بانتظام.'
    },
    purity: {
      title: 'حالة الطهارة',
      menstruatingLabel: 'الحيض مستمر',
      menstruatingHint: 'ستتحدّث علامات طهارتك بمجرد أن تسجّلي انتهاء الحيض.',
      unknownLabel: 'لم يُسجَّل انتهاء الحيض',
      declareButton: 'سجّليه',
      pureTitle: 'عادت الطهارة',
      pureSubtitle: 'انتهاء الحيض · {{value}}',
      todayAt: 'اليوم في {{time}}',
      dateAt: 'في {{date}} عند {{time}}',
      dueLabel: 'الصلاة المعنية',
      dueBadge: 'صلاة {{prayerName}} واجبة اليوم',
      dueSubtitle: 'عادت طهارتك خلال وقت صلاة {{prayerName}}. هذه الصلاة واجبة.',
      betweenTitle: 'لا توجد صلاة جارية في لحظة عودة الطهارة.',
      nextAfterPurityLabel: 'أول صلاة بعد الطهارة',
      loadingSchedule: 'جارٍ تحميل أوقات الصلاة…',
      scheduleUnavailable: 'أوقات الصلاة غير متاحة مؤقتًا.'
    }
  },
  hijriCalendar: {
    title: 'التقويم الهجري',
    todayAccessibility: 'العودة إلى اليوم',
    today: 'اليوم',
    selectedDateLabel: 'التاريخ المحدد',
    monthReferenceEyebrow: 'معالم الشهر',
    ramadanPill: 'رمضان',
    ramadanText: 'هذا شهر الصيام. ستجدين هنا معالمك الروحية ومتتبّع صيامك.',
    ramadanButton: 'عرض أيام الصيام التي عليّ قضاؤها',
    dhoulHijjaText: 'شهر مهم في التقويم الهجري.',
    dhoulHijjaButton: 'اكتشفي المعالم الروحية',
    noSpecialReference: 'لا توجد معالم خاصة لهذا الشهر.',
    shortcutsTitle: 'المعالم الروحية',
    shortcutPrayerTimes: 'أوقات الصلاة',
    shortcutQadaa: 'قضاء الصيام',
    shortcutLibrary: 'محتوى روحي',
    previousMonthAccessibility: 'الشهر الهجري السابق',
    nextMonthAccessibility: 'الشهر الهجري التالي'
  },
  qadaa: {
    title: 'قضاء الصيام',
    aboutAccessibility: 'حول قضاء الصيام',
    eyebrow: 'قضاء الصيام',
    loading: 'جارٍ تحميل متتبّعك…',
    daysToMakeUpLabel_one: 'يوم للقضاء',
    daysToMakeUpLabel_other: 'أيام للقضاء',
    daysToMakeUpLabel_zero: 'يوم للقضاء',
    daysToMakeUpLabel_two: 'يومان للقضاء',
    daysToMakeUpLabel_few: 'أيام للقضاء',
    daysToMakeUpLabel_many: 'يومًا للقضاء',
    allHamdulillahSubtitle: 'الحمد لله، أنتِ على اطلاع تام بصيامك المطلوب قضاؤه.',
    reminderTitleActive: 'تذكير بالقضاء',
    reminderTitleIdle: 'تذكير',
    reminderTextActive: 'لا يزال عليكِ أيام صيام للقضاء. نظّمي متابعتك بالوتيرة التي تناسبك.',
    reminderTextIdle: 'إذا استجدّت أيام مستحقة، سنخبرك بعد رمضان.',
    aboutTitle: 'حول قضاء الصيام',
    aboutText: 'أيام الصيام التي فاتت بسبب الحيض في رمضان يجب قضاؤها لاحقًا. والله أعلم.',
    completionTitle: 'هل قضيتِ يومًا من الصيام؟',
    completionSubtitle: 'سجّلي يومًا تم قضاؤه لتحديث متابعتك.',
    markCompletedAccessibility: 'تحديد يوم صيام كمقضيّ',
    saving: 'جارٍ الحفظ…',
    markCompleted: 'تحديد كمقضيّ',
    remainingDays_one: '{{count}} يوم متبقٍ',
    remainingDays_other: '{{count}} يوم متبقٍ',
    remainingDays_zero: '{{count}} يوم متبقٍ',
    remainingDays_two: '{{count}} يومان متبقيان',
    remainingDays_few: '{{count}} أيام متبقية',
    remainingDays_many: '{{count}} يومًا متبقيًا',
    allCompletedTitle: 'تم قضاء جميع الأيام',
    allCompletedText: 'متابعتك الآن محدّثة بالكامل.',
    motivationText: 'اعتني بنفسك، فأنتِ غالية',
    heroAccessibilityLoading: 'جارٍ تحميل متابعة قضاء الصيام',
    heroAccessibilityZero: 'كل شيء محدّث، لا توجد أيام صيام للقضاء حاليًا',
    heroAccessibilityCount_one: '{{count}} يوم للقضاء',
    heroAccessibilityCount_other: '{{count}} يوم للقضاء',
    heroAccessibilityCount_zero: '{{count}} يوم للقضاء',
    heroAccessibilityCount_two: '{{count}} يومان للقضاء',
    heroAccessibilityCount_few: '{{count}} أيام للقضاء',
    heroAccessibilityCount_many: '{{count}} يومًا للقضاء',
    undoCompletionTitle: 'التراجع عن هذا القضاء؟',
    undoCompletionMessage_one: '{{title}}: سيعود {{count}} يوم مقضيّ إلى رصيدك.',
    undoCompletionMessage_other: '{{title}}: سيعود {{count}} يوم مقضيّ إلى رصيدك.',
    undoCompletionMessage_zero: '{{title}}: سيعود {{count}} يوم مقضيّ إلى رصيدك.',
    undoCompletionMessage_two: '{{title}}: سيعود {{count}} يومان مقضيّان إلى رصيدك.',
    undoCompletionMessage_few: '{{title}}: ستعود {{count}} أيام مقضيّة إلى رصيدك.',
    undoCompletionMessage_many: '{{title}}: سيعود {{count}} يومًا مقضيًّا إلى رصيدك.',
    keepButton: 'إبقاء',
    undoButton: 'التراجع عن القضاء',
    entryDeletedToastTitle: 'تم حذف الإدخال',
    balanceUpdatedToastMessage: 'تم تحديث رصيدك.',
    undoneToastTitle: 'تم التراجع عن القضاء',
    addedToastTitle: 'تمت إضافة الأيام',
    editedToastTitle: 'تم تعديل الأيام',
    helpParagraph1: 'يساعدك هذا القسم على متابعة أيام الصيام التي فاتتك بسبب الحيض في رمضان.',
    helpParagraph2: 'الأيام المكتشفة تلقائيًا مصدرها متابعة حيضك خلال رمضان. ويمكنك أيضًا إضافة أيام بنفسك، حتى القديمة منها. وعندما تقضين يومًا، حدّديه كمقضيّ ليبقى عدد الأيام المتبقية دقيقًا.',
    closeHelpAccessibility: 'إغلاق نافذة المساعدة هذه',
    ledger: {
      balanceTitle: 'رصيدك',
      automaticDetected: 'مكتشفة تلقائيًا',
      manuallyAdded: 'مضافة يدويًا',
      caughtUp: 'مقضيّة',
      remaining: 'المتبقية',
      surplusNote_one: '{{count}} يوم مقضيّ زائد عن المجموع الحالي. يبقى مسجّلًا: يمكنك حذفه من السجل.',
      surplusNote_other: '{{count}} يوم مقضيّ زائد عن المجموع الحالي. تبقى مسجّلة: يمكنك حذفها من السجل.',
      surplusNote_zero: '{{count}} يوم مقضيّ زائد عن المجموع الحالي. تبقى مسجّلة: يمكنك حذفها من السجل.',
      surplusNote_two: '{{count}} يومان مقضيّان زائدان عن المجموع الحالي. يبقيان مسجّلين: يمكنك حذفهما من السجل.',
      surplusNote_few: '{{count}} أيام مقضيّة زائدة عن المجموع الحالي. تبقى مسجّلة: يمكنك حذفها من السجل.',
      surplusNote_many: '{{count}} يومًا مقضيًّا زائدًا عن المجموع الحالي. تبقى مسجّلة: يمكنك حذفها من السجل.',
      addDaysAccessibility: 'إضافة أيام',
      addDays: 'إضافة أيام',
      historyTitle: 'السجل',
      automaticBadge: 'تلقائي',
      manualBadge: 'يدوي',
      caughtUpBadge: 'مقضيّ',
      automaticHint: 'مكتشف من متابعة حيضك (غير قابل للتعديل هنا)',
      completedGroupTitle: 'الأيام المقضيّة',
      editAction: 'تعديل',
      editAccessibility: 'تعديل {{title}}',
      deleteAction: 'حذف',
      deleteAccessibility: 'حذف {{title}}',
      undoAction: 'تراجع',
      undoAccessibility: 'التراجع عن قضاء {{title}}'
    },
    form: {
      titleAdd: 'إضافة أيام\nللقضاء',
      titleEdit: 'تعديل هذه الأيام',
      description: 'أضيفي أيام الصيام التي تعلمين أنها عليك قضاؤها، ولو مضى عليها عدة سنوات. يمكنك تعديلها أو حذفها في أي وقت.',
      step1Title: 'كم يومًا تريدين إضافته؟',
      quantityAccessibility: 'عدد الأيام',
      decreaseAccessibility: 'إنقاص عدد الأيام',
      increaseAccessibility: 'زيادة عدد الأيام',
      quantityHelper: 'يمكنك تغيير هذا العدد لاحقًا.',
      step2Title: 'هل تعرفين من أي رمضان هذه الأيام؟',
      knowsYearTitle: 'نعم، أعرف السنة',
      knowsYearSubtitle: 'أعرف من أي رمضان هذه الأيام.',
      unknownYearTitle: 'لا، لا أتذكر',
      unknownYearSubtitle: 'هذه الأيام ضمن رصيدي السابق.',
      yearFieldLabel: 'سنة رمضان',
      yearAccessibility: 'سنة رمضان: {{value}}',
      yearNotChosen: 'لم تُختر',
      yearPlaceholder: 'اختاري سنة',
      yearListAccessibility: 'قائمة سنوات رمضان',
      step3Title: 'أضيفي ملاحظة (اختياري)',
      noteAccessibility: 'ملاحظة اختيارية',
      notePlaceholder: 'مثال: أيام كان عليّ قضاؤها',
      noteCounterAccessibility: '{{length}} حرفًا من أصل {{max}}',
      cancel: 'إلغاء',
      yearRequiredError: 'اختاري سنة رمضان، أو حدّدي «لا، لا أتذكر».',
      saveFailedError: 'تعذّر الحفظ الآن. حاولي مرة أخرى.'
    },
    deleteModal: {
      closeAccessibility: 'إغلاق دون حذف',
      title: 'حذف هذه الأيام؟',
      body_one: 'أنتِ على وشك حذف {{quantityLabel}} مضافة يدويًا. سيؤدي هذا الإجراء إلى إزالة هذه الأيام من رصيد قضاء الصيام.',
      body_other: 'أنتِ على وشك حذف {{quantityLabel}} مضافة يدويًا. سيؤدي هذا الإجراء إلى إزالة هذه الأيام من رصيد قضاء الصيام.',
      body_zero: 'أنتِ على وشك حذف {{quantityLabel}} مضافة يدويًا. سيؤدي هذا الإجراء إلى إزالة هذه الأيام من رصيد قضاء الصيام.',
      body_two: 'أنتِ على وشك حذف {{quantityLabel}} مضافة يدويًا. سيؤدي هذا الإجراء إلى إزالة هذه الأيام من رصيد قضاء الصيام.',
      body_few: 'أنتِ على وشك حذف {{quantityLabel}} مضافة يدويًا. سيؤدي هذا الإجراء إلى إزالة هذه الأيام من رصيد قضاء الصيام.',
      body_many: 'أنتِ على وشك حذف {{quantityLabel}} مضافة يدويًا. سيؤدي هذا الإجراء إلى إزالة هذه الأيام من رصيد قضاء الصيام.',
      noteLabel: 'ملاحظة',
      reassurance: 'سيحذف هذا الإجراء هذا الإدخال المضاف يدويًا فقط. أما الأيام المكتشفة تلقائيًا والأيام التي سبق قضاؤها فلا تتأثر.',
      cancelAccessibility: 'إلغاء الحذف',
      cancelText: 'إلغاء',
      confirmAccessibility: 'تأكيد الحذف',
      deleting: 'جارٍ الحذف…',
      confirmText: 'حذف'
    },
    dayCount_one: '{{count}} يوم',
    dayCount_other: '{{count}} يوم',
    dayCount_zero: '{{count}} يوم',
    dayCount_two: '{{count}} يومان',
    dayCount_few: '{{count}} أيام',
    dayCount_many: '{{count}} يومًا',
    allMadeUp: 'تم قضاء الكل',
    previousBalance: 'الرصيد السابق',
    ramadanYearHijri: 'رمضان {{year}} هـ',
    ramadanYearGregorian: 'رمضان {{year}}',
    ramadanYearBoth: 'رمضان {{gregorianYear}} ({{year}} هـ)',
    yearNotProvided: 'السنة غير محدّدة',
    addedManually_one: '{{count}} يوم مضاف يدويًا',
    addedManually_other: '{{count}} يوم مضاف يدويًا',
    addedManually_zero: '{{count}} يوم مضاف يدويًا',
    addedManually_two: '{{count}} يومان مضافان يدويًا',
    addedManually_few: '{{count}} أيام مضافة يدويًا',
    addedManually_many: '{{count}} يومًا مضافًا يدويًا',
    completedSummary_one: '{{count}} يوم مقضيّ',
    completedSummary_other: '{{count}} يوم مقضيّ',
    completedSummary_zero: '{{count}} يوم مقضيّ',
    completedSummary_two: '{{count}} يومان مقضيّان',
    completedSummary_few: '{{count}} أيام مقضيّة',
    completedSummary_many: '{{count}} يومًا مقضيًّا',
    migratedSuffix: 'المتابعة السابقة',
    saveChanges: 'حفظ التغييرات',
    addDaysGeneric: 'إضافة أيام للقضاء',
    addDaysCount_one: 'إضافة {{count}} يوم للقضاء',
    addDaysCount_other: 'إضافة {{count}} يوم للقضاء',
    addDaysCount_zero: 'إضافة {{count}} يوم للقضاء',
    addDaysCount_two: 'إضافة {{count}} يومين للقضاء',
    addDaysCount_few: 'إضافة {{count}} أيام للقضاء',
    addDaysCount_many: 'إضافة {{count}} يومًا للقضاء',
    historyRangeSameDay: '{{day}} رمضان {{year}} هـ',
    historyRangeSpan: 'من {{dayStart}} إلى {{dayEnd}} رمضان {{year}} هـ',
    errors: {
      quantityRequired: 'أدخلي عدد الأيام.',
      quantityInteger: 'أدخلي عددًا صحيحًا من الأيام (مثال: 2).',
      quantityMin: 'يجب ألا يقل عدد الأيام عن 1.',
      quantityMax: 'لا يمكن أن يتجاوز عدد الأيام {{max}}.',
      yearFormat: 'أدخلي سنة من 4 أرقام (مثال: 1445 أو 2018)، أو اختاري «سنة غير معروفة».',
      yearInvalid: 'تبدو هذه السنة غير صالحة. استخدمي سنة هجرية (مثال: 1445) أو سنة ميلادية (مثال: 2018).'
    }
  },
  awaADeux: {
    neutralPartnerLabel: 'شريكك',
    neutralPartnerSubject: 'شريكك',
    intro: {
      subtitle: 'تقدّما معًا،\nبالوتيرة التي تناسبك.',
      benefit1: 'شاركي شريكك المعلومات التي تريدينها',
      benefit2: 'ساعديه على فهم دورتك ومراحلها بشكل أفضل',
      benefit3: 'احصلي على مزيد من الدعم في حياتك اليومية',
      benefit4: 'تبقين دائمًا متحكمة في معلوماتك',
      discoverCta: 'اكتشفي',
      discoverAccessibility: 'اكتشفي AWA معًا'
    },
    partnerName: {
      title: 'ما اسم\nشريكك؟',
      description: 'هذا يتيح لنا تخصيص\nتجربتك في AWA معًا.',
      fieldLabel: 'الاسم الأول للشريك',
      placeholder: 'مثال: ياسين'
    },
    partnerView: {
      titleWithName: 'ما يراه\n{{name}}',
      titleNeutral: 'ما يراه\nشريكك',
      description: 'لن يتمكن {{partner}} من الاطلاع إلا على المعلومات التي تختارين مشاركتها.',
      caption: 'معاينة تجريبية'
    },
    benefits: {
      title: 'الفوائد\nلكليكما',
      item1: 'شريك أكثر اطلاعًا وانتباهًا',
      item2: 'نصائح مناسبة لكل مرحلة',
      item3: 'تواصل أفضل',
      item4: 'دعم يومي',
      item5: 'رحلة أكثر هدوءًا معًا'
    },
    sharing: {
      title: 'اختاري ما\nتريدين مشاركته',
      description: 'لن يرى {{partner}} إلا المعلومات التي تفعّلينها.',
      ctaDone: 'تم'
    },
    sections: {
      cycle: {
        title: 'الدورة',
        cycleDay: 'يوم الدورة والمرحلة الحالية',
        nextPeriod: 'موعد الحيض القادم المتوقع',
        periodStatus: 'حالة الحيض: جارٍ / منتهٍ'
      },
      fertility: {
        title: 'الخصوبة والحمل المنشود',
        fertileWindow: 'فترة الخصوبة',
        ovulation: 'الإباضة المتوقعة',
        fertilityStatus: 'حالة الخصوبة: خصبة / غير خصبة'
      },
      pregnancy: {
        title: 'الحمل',
        pregnancyWeek: 'أسبوع الحمل',
        dueDate: 'تاريخ الولادة المتوقع',
        babyDevelopment: 'مرحلة الحمل ونموّ الجنين'
      },
      wellbeing: {
        title: 'الراحة النفسية والدعم',
        mood: 'المزاج',
        dailyAdvice: 'نصيحة اليوم'
      }
    },
    supportContent: {
      supportTipsLabel: 'نصائح لدعم شريكتك',
      supportTipsNote: 'تظهر دائمًا عند الشريك',
      recommendationsLabel: 'توصيات مناسبة لمرحلة الدورة',
      recommendationsNote: 'لا تكون مناسبة للمرحلة إلا إذا شاركتِ يوم الدورة'
    },
    pairing: {
      title: 'ادعي\nشريكك',
      description: 'ادعي {{partner}} للانضمام إليك في AWA معًا.',
      emailLabel: 'البريد الإلكتروني للشريك',
      emailPlaceholder: 'partner@example.com',
      emailAccessibility: 'عنوان البريد الإلكتروني للشريك',
      invalidEmail: 'أدخلي عنوان بريد إلكتروني صالحًا.',
      emailHelper: 'سنرسل إلى {{partner}} رابط دعوة آمنًا عبر البريد الإلكتروني.',
      sendCta: 'إرسال الدعوة'
    },
    pending: {
      description: 'ستتمكنين من بدء مشاركة المعلومات المحدّدة فور انضمام {{partner}} إلى AWA معًا.',
      title: 'تم إرسال الدعوة\nإلى {{partner}}',
      statusTitle: 'في انتظار القبول',
      statusDescription: 'سنخبرك فور قبول {{name}} دعوتك.',
      sentToEmail: 'تم إرسال الدعوة إلى:\n{{email}}',
      resend: 'إعادة إرسال الدعوة',
      resent: 'تمت إعادة إرسال الدعوة',
      cancel: 'إلغاء الدعوة',
      previewDivider: 'أو',
      previewTitle: 'معاينة رحلة الشريك',
      previewDescription: 'اطلعي على ما سيراه {{partner}} في AWA معًا.'
    },
    connected: {
      title: 'تم ربط الشريك 💜',
      since: 'مرتبط منذ اليوم',
      sharedInfoTitle: 'المعلومات المشتركة',
      emptyShared: 'لا توجد معلومات مشتركة في الوقت الحالي.',
      manageAction: 'إدارة المعلومات المشتركة',
      stopAction: 'إيقاف المشاركة',
      accessibilityConnected: 'الشريك مرتبط'
    },
    stopSharingModal: {
      title: 'إيقاف المشاركة؟',
      body: 'لن يتمكن {{Partner}} بعد الآن من الاطلاع على المعلومات التي اخترتِ مشاركتها.',
      confirm: 'إيقاف المشاركة'
    },
    demo: {
      cycleDayCaption: 'الدورة الحالية',
      nextPeriod: 'ليس بعد',
      phase: 'التعافي',
      advice: 'ادعمها بلفتات صغيرة كل يوم.',
      fertileWindow: 'بعد 3 أيام',
      ovulation: 'متوقعة غدًا',
      pregnancyWeek: 'الأسبوع 12',
      dueDate: '14 مارس',
      mood: 'هادئة نوعًا ما',
      periodStatus: 'منتهٍ',
      fertilityStatus: 'غير خصبة',
      babyDevelopment: 'تواصل أعضاء الجنين تكوّنها.',
      supportTips: 'امنحها لحظة هدوء ومشروبًا دافئًا.',
      phaseRecommendation: 'المرحلة الحالية: فضّل الراحة واللطف.',
      generalRecommendation: 'ابقَ منتبهًا وعرض مساعدتك.',
      greetingWithName: 'مرحبًا {{name}} 💜',
      greetingNeutral: 'مرحبًا 💜',
      greetingText: 'إليك بعض المعلومات لدعمها بشكل أفضل اليوم.',
      cycleDayLabel: 'يوم الدورة',
      nextPeriodLabel: 'الحيض القادم',
      periodStatusLabel: 'الحيض',
      phaseLabel: 'المرحلة الحالية',
      fertileWindowLabel: 'فترة الخصوبة',
      ovulationLabel: 'الإباضة المتوقعة',
      fertilityStatusLabel: 'الخصوبة',
      pregnancyWeekLabel: 'الحمل',
      dueDateLabel: 'الولادة المتوقعة',
      moodLabel: 'المزاج',
      babyDevelopmentTitle: 'نموّ الجنين',
      dailyAdviceTitle: 'نصيحة اليوم',
      supportTipsTitle: 'دعمها',
      recommendationTitle: 'توصية',
      emptyShared: 'لا توجد معلومات مشتركة في الوقت الحالي.'
    },
    partnerSide: {
      invitation: {
        title: 'AWA معًا',
        descriptionWithName: '{{name}} تدعوك\nللانضمام إلى AWA معًا',
        descriptionNeutral: 'وصلتك دعوة\nللانضمام إلى AWA معًا',
        cardBody: 'تودّ مشاركتك بعض المعلومات لتساعدك على\nفهم رحلتها بشكل أفضل.',
        privacyText: 'لن ترى إلا المعلومات التي تختار مشاركتها.'
      },
      accept: {
        titlePrimary: 'قبول ',
        titleAccent: 'الدعوة؟',
        subtitleWithName: '{{name}} تودّ أن تشاركك\nما يلي:',
        subtitleNeutral: 'شريكتك تودّ أن تشاركك\nما يلي:',
        emptyShared: 'لا توجد معلومات مشتركة في الوقت الحالي.',
        privacyText: 'لن تتمكن من الاطلاع إلا على المعلومات التي تختار مشاركتها.',
        acceptCta: 'قبول الدعوة',
        later: 'لاحقًا'
      },
      tabs: {
        advice: 'النصائح'
      },
      home: {
        greeting: 'السلام عليكم،',
        subtitle: 'أنت هنا من أجلها 💜',
        openProfileAccessibility: 'فتح ملفي الشخصي',
        emptyShared: 'لا توجد معلومات مشتركة معك في الوقت الحالي.',
        cycleInfoAccessibility: 'معلومات دورة اليوم',
        cycleDayUnavailableAccessibility: 'يوم الدورة غير متاح',
        cycleDayAccessibility: 'يوم الدورة {{day}}',
        todayLabel: 'اليوم',
        energyLabel: 'طاقتها',
        moodLabel: 'مزاجها',
        adviceLabel: 'نصيحتي',
        sharedInfoTitle: 'المعلومات المشتركة',
        sharedInfoSubtitle: 'إليك المعلومات التي اختارت مشاركتها.',
        upcomingTitle: 'الأحداث القادمة',
        upcomingSubtitle: 'تواريخ متوقعة بناءً على المعلومات المشتركة.',
        shortLabelCycle: 'الدورة',
        shortLabelPeriods: 'الحيض',
        shortLabelOvulation: 'الإباضة',
        nextPeriodLabel: 'الحيض القادم المتوقع',
        ovulationLabel: 'الإباضة المتوقعة',
        cycleDayValue: 'اليوم {{day}}',
        infoUnavailable: 'المعلومة غير متاحة',
        periodInProgress: 'جارٍ',
        periodNotInProgress: 'غير جارٍ',
        inDays_one: 'بعد {{count}} يوم',
        inDays_other: 'بعد {{count}} يوم',
        inDays_zero: 'بعد {{count}} يوم',
        inDays_two: 'بعد {{count}} يومين',
        inDays_few: 'بعد {{count}} أيام',
        inDays_many: 'بعد {{count}} يومًا',
        remainingDays_one: 'متبقٍ {{count}} يوم',
        remainingDays_other: 'متبقٍ {{count}} يوم',
        remainingDays_zero: 'متبقٍ {{count}} يوم',
        remainingDays_two: 'متبقٍ {{count}} يومان',
        remainingDays_few: 'متبقٍ {{count}} أيام',
        remainingDays_many: 'متبقٍ {{count}} يومًا',
        phaseMessageMenstruation: 'هي في فترة الحيض الآن. قليل من الدعم قد يُحدث فرقًا.',
        phaseMessageFollicular: 'هي حاليًا في المرحلة الجريبية.',
        phaseMessageFertile: 'بدأت فترة الخصوبة لديها — كن منتبهًا لاحتياجاتها.',
        phaseMessageOvulation: 'الإباضة لديها متوقعة اليوم.',
        phaseMessageLuteal: 'هي حاليًا في المرحلة الأصفرية.',
        phaseMessageUnavailable: 'معلومات دورتها غير متاحة حاليًا.',
        tipMenstruation: 'لطف وراحة',
        tipFollicular: 'شجّعها',
        tipFertile: 'أصغِ إليها',
        tipOvulation: 'كلمة طيبة',
        tipLuteal: 'صبر وهدوء',
        tipGeneral: 'كن منتبهًا'
      },
      calendar: {
        title: 'التقويم',
        previousMonth: 'الشهر السابق',
        nextMonth: 'الشهر التالي',
        legendTitle: 'دليل الألوان',
        emptyLegend: 'لا توجد أي علامة مشاركة معك حاليًا.',
        periodTag: 'الحيض',
        fertileTag: 'فترة الخصوبة',
        todayTag: 'اليوم'
      },
      advice: {
        title: 'نصائح',
        subtitle: 'أفكار بسيطة لدعمها كل يوم',
        supportSectionTitle: 'كيف تدعمها اليوم',
        infoSectionTitle: 'من المفيد أن تعرف',
        infoText: 'ترى فقط ما اختارت مشاركته معك — ومن الطبيعي أن\nتبقى بعض المعلومات خاصة.',
        gesturesSectionTitle: 'لفتات صغيرة',
        generalSupportTip: 'كن منتبهًا وقدّم مساعدتك، دون الحاجة إلى معرفة تفاصيل دورتها.',
        phaseTipMenstruation: 'هي في فترة الحيض: قليل من اللطف، أو مشروب دافئ، أو لحظة راحة قد تساعدها.',
        phaseTipFollicular: 'هي في المرحلة الجريبية: غالبًا ما يكون هذا وقت نشاط متجدد — فرصة رائعة لنزهة أو مشروع معًا.',
        phaseTipFertile: 'هي في فترة الخصوبة: لا يلزم فعل شيء خاص، ما لم تكونا تحاولان الإنجاب معًا.',
        phaseTipOvulation: 'إنه يوم الإباضة المتوقع لديها: رسالة لطيفة بسيطة قد تُحدث فرقًا.',
        phaseTipLuteal: 'هي في المرحلة الأصفرية: اللفتات الصغيرة والصبر محل ترحيب دائمًا.',
        gesture1: 'رسالة للاطمئنان عليها.',
        gesture2: 'اعرض المساعدة في مهمة يومية.',
        gesture3: 'كن متاحًا للإصغاء، دون إصدار أحكام.'
      },
      profile: {
        title: 'ملفي الشخصي',
        subtitle: 'مساحتك الشخصية في AWA معًا',
        noNameAccessibility: 'لم يتم إدخال اسم',
        greeting: 'السلام عليكم {{name}}! 💜',
        welcomeLine1: 'شريك على AWA معًا.',
        welcomeLine2: 'شكرًا لوقوفك إلى جانبها.',
        personalInfoTitle: 'المعلومات الشخصية',
        personalInfoSubtitle: 'معلوماتك في AWA معًا',
        editFirstNameAccessibility: 'تعديل اسمي',
        firstNameLabel: 'الاسم',
        roleLabel: 'الدور',
        roleValue: 'الشريك',
        connectedToSubtitle: 'أنت مرتبط بـ {{owner}}.',
        accessRowTitle: 'المعلومات التي يمكنك الاطلاع عليها',
        noSharedTitle: 'لا توجد معلومات مشاركة حاليًا.',
        noSharedDescription: 'يمكن لشريكتك تغيير خيارات المشاركة في أي وقت.',
        defaultAccessDescription: 'يمكنك الاطلاع على هذه المعلومة.',
        activeBadge: 'مفعّل',
        privacyRowTitle: 'الخصوصية',
        canSeeTitle: 'ما يمكنك رؤيته',
        canSeeDescription: 'ترى فقط المعلومات التي اختارت شريكتك مشاركتها معك في AWA معًا.',
        stayPrivateTitle: 'ما يبقى خاصًا',
        stayPrivateDescription: 'المعلومات التي لا تشاركها تبقى خاصة ولا تظهر في مساحتك.',
        privacyBanner: 'صُمّم AWA معًا لمشاركة ما تريد أن تُظهره لك فقط.',
        helpRowTitle: 'المساعدة والدعم',
        signOut: 'تسجيل الخروج',
        rowHintAccess: 'اختارت شريكتك مشاركة هذه المعلومات معك.',
        rowHintPrivacy: 'افهم ما تتم مشاركته وما يبقى خاصًا.',
        rowHintHelp: 'إجابات عن أسئلتك حول AWA معًا.',
        accessExplanationCycleDay: 'يمكنك رؤية يوم دورتها ومرحلتها الحالية.',
        accessExplanationNextPeriod: 'يمكنك رؤية التاريخ المتوقع لحيضها القادم.',
        accessExplanationPeriodStatus: 'يمكنك معرفة ما إذا كان حيضها جاريًا أو انتهى.',
        accessExplanationFertileWindow: 'يمكنك رؤية أيام خصوبتها.',
        accessExplanationOvulation: 'يمكنك رؤية الإباضة المتوقعة لديها.',
        accessExplanationFertilityStatus: 'يمكنك رؤية حالة خصوبتها.',
        accessExplanationPregnancyWeek: 'يمكنك رؤية أسبوع حملها.',
        accessExplanationDueDate: 'يمكنك رؤية تاريخ ولادتها المتوقع.',
        accessExplanationBabyDevelopment: 'يمكنك الاطلاع على معلومات حول نموّ الجنين.',
        accessExplanationMood: 'يمكنك رؤية مزاجها اليوم.',
        accessExplanationDailyAdvice: 'تصلك نصيحة يومية لدعمها.',
        editNameModal: {
          title: 'تعديل اسمي',
          subtitle: 'سيُستخدم هذا الاسم في مساحتك في AWA معًا.',
          label: 'الاسم'
        },
        logoutModal: {
          title: 'تسجيل الخروج؟',
          body: 'هل أنت متأكد أنك تريد تسجيل الخروج من مساحة الشريك؟',
          reassurance: 'يمكنك تسجيل الدخول مجددًا في أي وقت.'
        },
        faq: {
          howItWorksTitle: 'كيف يعمل AWA معًا؟',
          howItWorksDescription: 'تعرّف على كيف يتيح لك التطبيق دعم شريكتك مع احترام خصوصيتها.',
          howItWorksParagraph1: 'يتيح لك AWA معًا رؤية المعلومات التي اختارت شريكتك مشاركتها معك فقط.',
          howItWorksParagraph2: 'فمثلًا، قد ترى بعض المعلومات عن دورتها أو حيضها القادم أو فترة خصوبتها عندما تكون المشاركة مفعّلة لها.',
          howItWorksParagraph3: 'تعتمد المعلومات الظاهرة دائمًا على خياراتها. ويمكنها تغيير ما تشاركه في أي وقت.',
          hiddenInfoTitle: 'لماذا بعض المعلومات مخفية؟',
          hiddenInfoDescription: 'تختار شريكتك ما تشاركه معك. ويمكنها تغيير هذه الخيارات في أي وقت.',
          hiddenInfoParagraph1: 'تحتفظ شريكتك بالتحكم في المعلومات التي تريد مشاركتها معك.',
          hiddenInfoParagraph2: 'إذا لم تظهر معلومة في مساحتك، فقد يعني ذلك ببساطة أنها لم تختر مشاركتها.',
          hiddenInfoParagraph3: 'يمكن أن تتغير خياراتها في أي وقت. ولا يعرض لك AWA معًا إلا المعلومات التي يمكنك الاطلاع عليها حاليًا.',
          understandingTitle: 'فهم المعلومات المشاركة',
          understandingDescription: 'شروحات بسيطة ليوم الدورة والمرحلة الحالية وفترة الخصوبة والإباضة المتوقعة والحيض القادم.',
          understandingIntro: 'إليك ما قد تعنيه المعلومات المشاركة معك:',
          termCycleDay: 'يوم الدورة',
          descriptionCycleDay: 'يشير إلى عدد الأيام منذ بداية آخر حيض لديها.',
          termCurrentPhase: 'المرحلة الحالية',
          descriptionCurrentPhase: 'يشير إلى المرحلة الحالية من الدورة عند توفرها.',
          termFertileWindow: 'فترة الخصوبة',
          descriptionFertileWindow: 'فترة تقديرية قد يكون فيها احتمال الحمل أعلى.',
          termOvulation: 'الإباضة المتوقعة',
          descriptionOvulation: 'تقدير لموعد حدوث الإباضة، بناءً على المعلومات المتاحة.',
          termNextPeriod: 'الحيض القادم المتوقع',
          descriptionNextPeriod: 'التاريخ المتوقع لبداية حيضها القادم.',
          termPeriodStatus: 'حالة الحيض',
          descriptionPeriodStatus: 'يشير إلى ما إذا كان حيضها جاريًا حاليًا أو انتهى.',
          troubleshootingTitle: 'أواجه مشكلة في AWA معًا',
          troubleshootingDescription: 'ماذا تفعل إذا لم تظهر المعلومات، أو بدا أن الاتصال منقطع، أو واجهت مشكلة أخرى.',
          troubleshootingParagraph1: 'إذا لم تظهر بعض المعلومات، فابدأ بالتحقق من أن اتصالك بالإنترنت يعمل جيدًا.',
          troubleshootingParagraph2: 'وقد تغيب بعض المعلومات ببساطة لأن شريكتك لا تشاركها حاليًا.',
          troubleshootingParagraph3: 'يمكنك أيضًا محاولة إغلاق التطبيق وإعادة فتحه.',
          troubleshootingParagraph4: 'إذا استمرت المشكلة، يمكنك التواصل مع دعم AWA.',
          contactSupportTitle: 'التواصل مع الدعم',
          contactSupportDescription: 'هل تحتاج إلى مزيد من المساعدة؟ فريقنا هنا لدعمك.',
          contactSupportParagraph1: 'إذا كان لديك سؤال، أو واجهت مشكلة، أو أردت مشاركتنا ملاحظاتك، يمكنك التواصل مع فريق AWA من هذا القسم.',
          contactSupportParagraph2: 'شكرًا لمساعدتنا على تحسين AWA! 💜',
          contactButton: 'راسلنا',
          contactAccessibility: 'تواصل معنا عبر البريد الإلكتروني',
          contactEmailSubject: 'مساعدة — AWA معًا'
        }
      }
    }
  },
  journalOptions: {
    cycleSymptom: {
      menstrualPain: 'ألم الدورة',
      cramps: 'تقلصات',
      headache: 'صداع',
      migraines: 'شقيقة',
      fatigue: 'إرهاق',
      bloating: 'انتفاخ',
      nausea: 'غثيان',
      tenderBreasts: 'ألم الثديين',
      acne: 'حب الشباب',
      lowerBackPain: 'ألم أسفل الظهر',
      musclePain: 'ألم عضلي',
      constipation: 'إمساك',
      diarrhea: 'إسهال',
      discharge: 'إفرازات',
      other: 'أخرى'
    },
    cycleSymptomLocation: {
      lowerAbdomen: 'أسفل البطن',
      back: 'الظهر',
      head: 'الرأس',
      breasts: 'الثديان',
      wholeBody: 'الجسم كله'
    },
    cycleSleepQuality: {
      veryPoor: 'سيئة جدًا',
      poor: 'سيئة',
      average: 'متوسطة',
      good: 'جيدة',
      excellent: 'ممتازة'
    },
    cycleSleepFeeling: {
      rested: 'مرتاحة',
      average: 'عادي',
      tired: 'متعبة',
      none: 'لا',
      light: 'خفيفة',
      aLot: 'قوية',
    },
    cycleActivityType: {
      walking: 'المشي',
      running: 'الجري',
      yoga: 'اليوغا',
      strengthTraining: 'تمارين القوة',
      swimming: 'السباحة',
      cycling: 'ركوب الدراجة',
      stretching: 'تمارين الإطالة',
      pilates: 'البيلاتس',
      dance: 'الرقص',
      hiking: 'المشي الجبلي',
      cardio: 'تمارين الكارديو',
      other: 'أخرى'
    },
    cycleActivityFeeling: {
      veryTired: 'متعبة جدًا',
      tired: 'متعبة',
      neutral: 'عادي',
      good: 'جيدة',
      veryGood: 'جيدة جدًا'
    },
    cycleActivityIntensity: {
      light: 'خفيفة',
      moderate: 'متوسطة',
      high: 'عالية'
    },
    cycleTemperatureMethod: {
      oral: 'عن طريق الفم',
      axillary: 'تحت الإبط',
      rectal: 'عن طريق المستقيم',
      other: 'أخرى'
    },
    cycleIntimacyLibido: {
      veryLow: 'منخفضة جدًا',
      low: 'منخفضة',
      moderate: 'متوسطة',
      high: 'مرتفعة',
      veryHigh: 'مرتفعة جدًا'
    },
    cycleIntimacyDiscomfort: {
      painDuringIntercourse: 'ألم أثناء الجماع',
      vaginalDryness: 'جفاف مهبلي',
      bleedingAfterIntercourse: 'نزيف بعد الجماع',
      fatigue: 'إرهاق',
      pelvicPain: 'ألم الحوض',
      irritation: 'تهيّج',
      none: 'لا شيء',
      other: 'أخرى'
    },
    irregularSymptom: {
      bloating: 'انتفاخ',
      headache: 'صداع',
      nausea: 'غثيان',
      cramps: 'تقلصات',
      tenderBreasts: 'ألم الثديين',
      sleepTrouble: 'اضطراب النوم',
      other: 'أخرى'
    },
    irregularIntensity: {
      none: 'لا شيء',
      light: 'خفيفة',
      moderate: 'متوسطة',
      strong: 'قوية',
      veryStrong: 'قوية جدًا'
    },
    irregularFatigueLevel: {
      none: 'لا شيء',
      light: 'خفيف',
      moderate: 'متوسط',
      strong: 'شديد'
    },
    irregularPeriodPainLevel: {
      none: 'لا شيء',
      light: 'خفيف',
      moderate: 'متوسط',
      severe: 'شديد'
    },
    irregularMood: {
      veryHard: 'صعب جدًا',
      hard: 'صعب',
      neutral: 'عادي',
      good: 'جيد',
      veryGood: 'جيد جدًا'
    },
    irregularAcne: {
      none: 'لا شيء',
      light: 'خفيف',
      moderate: 'متوسط',
      noticeable: 'ملحوظ',
      veryNoticeable: 'ملحوظ جدًا'
    },
    irregularHair: {
      none: 'لا شيء',
      light: 'خفيف',
      moderate: 'متوسط',
      significant: 'كثيف',
      verysignificant: 'كثيف جدًا'
    },
    irregularPainType: {
      cramps: 'تقلصات',
      lowerAbdomen: 'أسفل البطن',
      back: 'الظهر',
      headache: 'صداع',
      other: 'أخرى'
    },
    irregularWeightFeeling: {
      good: 'جيد',
      neutral: 'عادي',
      concerned: 'قلقة'
    },
    irregularAcneArea: {
      face: 'الوجه',
      back: 'الظهر',
      chest: 'الصدر',
      other: 'أخرى'
    },
    irregularHairArea: {
      face: 'الوجه',
      chin: 'الذقن',
      belly: 'البطن',
      arms: 'الذراعان',
      legs: 'الساقان',
      other: 'أخرى'
    },
    irregularPainArea: {
      lowerAbdomen: 'أسفل البطن',
      back: 'الظهر',
      head: 'الرأس',
      breasts: 'الثديان',
      other: 'أخرى'
    },
    contraceptionFeeling: {
      fatigue: 'إرهاق',
      headache: 'صداع',
      nausea: 'غثيان',
      breastTenderness: 'ألم الثديين',
      moodChange: 'تغيّر المزاج',
      bloating: 'انتفاخ',
      lowerLibido: 'انخفاض الرغبة',
      noParticularEffect: 'لا تأثير يُذكر'
    },
    miscarriageBleeding: {
      absent: 'غائب',
      light: 'خفيف',
      moderate: 'متوسط',
      heavy: 'غزير'
    },
    miscarriageBleedingColor: {
      brightRed: 'أحمر فاتح',
      darkRed: 'أحمر داكن',
      brown: 'بني',
      pink: 'وردي',
      other: 'أخرى'
    },
    miscarriagePhysicalSymptom: {
      fatigue: 'إرهاق',
      cramps: 'تقلصات',
      pelvicPain: 'ألم الحوض',
      headache: 'صداع',
      nausea: 'غثيان',
      dizziness: 'دوخة',
      tenderness: 'ألم عند اللمس'
    },
    postpartumMood: {
      veryHard: 'صعب جدًا',
      hard: 'صعب',
      neutral: 'عادي',
      good: 'جيد',
      veryGood: 'جيد جدًا'
    },
    postpartumSleep: {
      veryPoor: 'سيئ جدًا',
      poor: 'سيئ',
      average: 'متوسط',
      good: 'جيد',
      excellent: 'ممتاز'
    },
    postpartumFatigue: {
      none: 'لا شيء',
      light: 'خفيف',
      moderate: 'متوسط',
      strong: 'قوي',
      veryStrong: 'قوي جدًا'
    },
    postpartumPain: {
      none: 'لا شيء',
      light: 'خفيف',
      moderate: 'متوسط',
      strong: 'قوي',
      veryStrong: 'قوي جدًا'
    },
    postpartumRecovery: {
      hard: 'صعب',
      slow: 'بطيء',
      stable: 'مستقر',
      good: 'جيد',
      veryGood: 'جيد جدًا'
    },
    postpartumLochiaFlow: {
      veryLight: 'خفيف جدًا',
      light: 'خفيف',
      moderate: 'متوسط',
      heavy: 'غزير'
    },
    postpartumLochiaColor: {
      brightRed: 'أحمر فاتح',
      red: 'أحمر',
      pink: 'وردي',
      brown: 'بني',
      yellowWhite: 'أصفر / أبيض'
    },
    postpartumLochiaConsistency: {
      liquid: 'سائل',
      thick: 'كثيف',
      withSmallClots: 'مع خثرات صغيرة'
    },
    postpartumLochiaSymptom: {
      none: 'لا شيء',
      cramps: 'تقلصات',
      fatigue: 'إرهاق',
      headache: 'صداع',
      tenderness: 'ألم عند اللمس',
      other: 'أخرى'
    },
    pregnancySymptom: {
      nausea: 'غثيان',
      fatigue: 'إرهاق',
      breastTenderness: 'ألم الثديين',
      bloating: 'انتفاخ',
      headache: 'صداع',
      refluxHeartburn: 'ارتجاع / حرقة',
      lowerBackPain: 'ألم أسفل الظهر',
      constipation: 'إمساك',
      lightCramps: 'تقلصات خفيفة',
      shortnessOfBreath: 'ضيق في التنفس',
      swelling: 'تورّم',
      dizziness: 'دوخة',
      sleepTrouble: 'اضطراب النوم'
    }
  },
  daughterJournal: {
    sheetTitle: 'يوميات {{name}}',
    sheetSubtitle: 'ماذا تودّين تدوينه اليوم؟',
    titles: {
      symptoms: 'أعراض {{name}}',
      mood: 'مزاج {{name}}',
      activity: 'النشاط البدني لـ {{name}}',
      sleep: 'نوم {{name}}',
      hydration: 'شرب الماء لدى {{name}}',
      menstrualFlow: 'تدفّق الحيض لدى {{name}}',
      note: 'ملاحظات {{name}}'
    },
    sheetItems: {
      symptom: 'الأعراض الملحوظة',
      mood: 'مزاج اليوم',
      activity: 'حركة اليوم ونشاطه',
      sleep: 'مدة النوم وجودته',
      hydration: 'تتبّع شرب الماء',
      menstrualFlow: 'شدة التدفّق وخصائصه',
      note: 'ملاحظة يومية وصور خاصة'
    },
    symptoms: {
      observedTitle: 'الأعراض الملحوظة',
      observedSubtitle: 'اختاري الأعراض التي لوحظت اليوم.',
      intensitySubtitle: 'اختاري المستوى الذي يصف أفضل ما تشعر به.',
      locationSubtitle: 'أين تشعر بهذه الأعراض بشكل رئيسي؟',
      errorMessage: 'تعذّر حفظ الأعراض حاليًا.'
    },
    mood: {
      question: 'كيف تشعر اليوم؟',
      commentAccessibility: 'تعليق على مزاجها',
      errorMessage: 'تعذّر حفظ المزاج حاليًا.'
    },
    activity: {
      typeHint: 'اختاري النشاط الذي قامت به',
      durationHint: 'كم من الوقت تحرّكت؟',
      intensityHint: 'ما مستوى جهدها؟',
      feelingTitle: 'كيف تشعر بعد النشاط؟',
      errorMessage: 'تعذّر حفظ النشاط حاليًا.'
    },
    sleep: {
      awakeningsSubtitle: 'كم مرة استيقظت؟',
      wakeFeelingSubtitle: 'كيف تشعر عند الاستيقاظ؟',
      errorMessage: 'تعذّر حفظ النوم حاليًا.'
    },
    note: {
      observationTitle: 'ملاحظة اليوم',
      photosHint: 'تابعي التغيّرات في البشرة أو الشعر أو أحد الأعراض.',
      photosOnDevice: 'تبقى الصور على هذا الجهاز فقط.',
      protectedText: 'تُحفظ الملاحظات والصور على هذا الجهاز فقط. ولا يمكن لأحد غيرك الاطلاع عليها.',
      protectedTitle: 'البيانات محمية',
      saveLabel: 'حفظ الملاحظة',
      errorMessage: 'تعذّر حفظ الملاحظة حاليًا.'
    },
    flow: {
      periodEnded: 'انتهى حيضها',
      errorMessage: 'تعذّر حفظ التدفّق حاليًا.'
    },
    hydration: {
      advice: 'شرب كمية كافية من الماء يساعد على تخفيف الانتفاخ ودعم الطاقة.'
    }
  }
};
