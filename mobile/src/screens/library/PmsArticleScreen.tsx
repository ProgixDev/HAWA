import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {
  getBottomPadding,
  getTopPadding,
  READING_CONTROLS_SPACE,
} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'symptoms-reconnaitre';

const HERO = require('../../assets/images/library/spm-hero.png');
const WOMAN = require('../../assets/images/library/spm-woman.png');
const CAUSES = require('../../assets/images/library/spm-causes.png');
const CONSULT = require('../../assets/images/library/spm-consult.png');

// Icons/images stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these.
const SYMPTOM_ICONS = [
  'weather-cloudy',
  'human-female',
  'cupcake',
  'weather-night',
] as const;

const TIP_IMAGES = [
  require('../../assets/images/library/spm-water.png'),
  require('../../assets/images/library/spm-food.png'),
  require('../../assets/images/library/spm-yoga.png'),
  require('../../assets/images/library/spm-stress.png'),
  require('../../assets/images/library/spm-sleep.png'),
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('Pms', {
  fr: {
    badge: 'CYCLE & BIEN-ÊTRE',
    title: 'Syndrome prémenstruel (SPM) :\nmieux le comprendre',
    metaDuration: '4 min de lecture',
    metaValidated: 'Contenu vérifié',
    intro:
      'Le SPM touche jusqu’à 8 femmes sur 10. Fatigue, irritabilité, ballonnements… Comprendre ses causes et adopter les bons réflexes peut grandement améliorer cette période.',
    contentsTitle: 'Dans cet article',
    contents: [
      'Qu’est-ce que le SPM ?',
      'Symptômes courants',
      'Causes possibles',
      'Conseils pour mieux le vivre',
      'Quand consulter ?',
    ],
    section1Body:
      'Le syndrome prémenstruel regroupe des symptômes physiques et émotionnels qui apparaissent généralement 5 à 10 jours avant les règles et disparaissent au début du cycle menstruel.',
    visual1Title: 'Une période liée au cycle',
    visual1Text:
      'Les symptômes apparaissent avant les règles puis diminuent généralement avec leur arrivée.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'L’intensité et le type de symptômes peuvent être très différents d’une femme à l’autre et d’un cycle à l’autre.',
    symptoms: [
      {title: 'Émotions', text: 'Irritabilité, anxiété, tristesse, sautes d’humeur'},
      {title: 'Physiques', text: 'Ballonnements, douleurs, fatigue, maux de tête'},
      {title: 'Comportement', text: 'Envie de sucre, changements d’appétit, fatigue'},
      {title: 'Sommeil', text: 'Difficultés à dormir ou sommeil moins réparateur'},
    ],
    section3Body:
      'Les variations hormonales, en particulier de la progestérone et des œstrogènes, affectent les neurotransmetteurs du cerveau (sérotonine, dopamine), ce qui peut expliquer les symptômes émotionnels et physiques du SPM.',
    tip2Title: 'Les hormones jouent un rôle clé',
    tip2Text:
      'Les variations hormonales peuvent influencer l’humeur, l’énergie, le sommeil et certaines sensations physiques.',
    tips: [
      {title: 'Hydrate-toi', text: 'Boire suffisamment d’eau aide à réduire les ballonnements.'},
      {title: 'Adopte une alimentation équilibrée', text: 'Privilégie les aliments riches en magnésium, oméga-3 et vitamines B.'},
      {title: 'Bouge régulièrement', text: 'L’activité physique libère des endorphines et réduit le stress.'},
      {title: 'Gère ton stress', text: 'Respiration, méditation, journal intime… Trouve ce qui te fait du bien.'},
      {title: 'Dors suffisamment', text: 'Un sommeil de qualité favorise l’équilibre hormonal.'},
    ],
    consultTitle: 'Quand demander un avis médical ?',
    consultText:
      'Si les symptômes sont très intenses et impactent ta vie quotidienne, il peut s’agir de trouble dysphorique prémenstruel (TDPM). N’hésite pas à consulter un·e professionnel·le de santé.',
    shareMessage: 'Syndrome prémenstruel (SPM) : mieux le comprendre — AWA',
  },
  en: {
    badge: 'CYCLE & WELLBEING',
    title: 'Premenstrual syndrome (PMS):\nunderstanding it better',
    metaDuration: '4 min read',
    metaValidated: 'Reviewed content',
    intro:
      'PMS affects up to 8 in 10 women. Fatigue, irritability, bloating… Understanding its causes and adopting the right habits can greatly improve this time of the month.',
    contentsTitle: 'In this article',
    contents: [
      'What is PMS?',
      'Common symptoms',
      'Possible causes',
      'Tips to feel better',
      'When to see a doctor?',
    ],
    section1Body:
      'Premenstrual syndrome brings together physical and emotional symptoms that usually appear 5 to 10 days before your period and go away at the start of the menstrual cycle.',
    visual1Title: 'A phase tied to your cycle',
    visual1Text:
      'Symptoms appear before your period and usually ease once it starts.',
    tip1Title: 'Good to know',
    tip1Text:
      'The intensity and type of symptoms can vary widely from one woman to another, and from one cycle to the next.',
    symptoms: [
      {title: 'Emotions', text: 'Irritability, anxiety, sadness, mood swings'},
      {title: 'Physical', text: 'Bloating, pain, fatigue, headaches'},
      {title: 'Behavior', text: 'Sugar cravings, appetite changes, fatigue'},
      {title: 'Sleep', text: 'Trouble sleeping or less restful sleep'},
    ],
    section3Body:
      'Hormonal fluctuations, particularly in progesterone and estrogen, affect brain neurotransmitters (serotonin, dopamine), which may explain the emotional and physical symptoms of PMS.',
    tip2Title: 'Hormones play a key role',
    tip2Text:
      'Hormonal fluctuations can affect mood, energy, sleep, and certain physical sensations.',
    tips: [
      {title: 'Stay hydrated', text: 'Drinking enough water helps reduce bloating.'},
      {title: 'Eat a balanced diet', text: 'Favor foods rich in magnesium, omega-3s, and B vitamins.'},
      {title: 'Stay active', text: 'Physical activity releases endorphins and reduces stress.'},
      {title: 'Manage your stress', text: 'Breathing exercises, meditation, journaling… Find what works for you.'},
      {title: 'Get enough sleep', text: 'Quality sleep supports hormonal balance.'},
    ],
    consultTitle: 'When should you seek medical advice?',
    consultText:
      'If symptoms are very intense and affect your daily life, it may be premenstrual dysphoric disorder (PMDD). Don’t hesitate to consult a healthcare professional.',
    shareMessage: 'Premenstrual syndrome (PMS): understanding it better — AWA',
  },
  es: {
    badge: 'CICLO Y BIENESTAR',
    title: 'Síndrome premenstrual (SPM):\nentenderlo mejor',
    metaDuration: '4 min de lectura',
    metaValidated: 'Contenido verificado',
    intro:
      'El SPM afecta hasta a 8 de cada 10 mujeres. Fatiga, irritabilidad, hinchazón... Entender sus causas y adoptar los hábitos adecuados puede mejorar mucho esta etapa.',
    contentsTitle: 'En este artículo',
    contents: [
      '¿Qué es el SPM?',
      'Síntomas comunes',
      'Posibles causas',
      'Consejos para vivirlo mejor',
      '¿Cuándo consultar?',
    ],
    section1Body:
      'El síndrome premenstrual agrupa síntomas físicos y emocionales que suelen aparecer entre 5 y 10 días antes del período y desaparecen al inicio del ciclo menstrual.',
    visual1Title: 'Una etapa ligada al ciclo',
    visual1Text:
      'Los síntomas aparecen antes del período y suelen disminuir cuando este llega.',
    tip1Title: 'Dato útil',
    tip1Text:
      'La intensidad y el tipo de síntomas pueden ser muy diferentes de una mujer a otra y de un ciclo a otro.',
    symptoms: [
      {title: 'Emociones', text: 'Irritabilidad, ansiedad, tristeza, cambios de humor'},
      {title: 'Físicos', text: 'Hinchazón, dolores, fatiga, dolores de cabeza'},
      {title: 'Comportamiento', text: 'Antojo de azúcar, cambios de apetito, fatiga'},
      {title: 'Sueño', text: 'Dificultad para dormir o sueño menos reparador'},
    ],
    section3Body:
      'Las variaciones hormonales, en particular de la progesterona y los estrógenos, afectan a los neurotransmisores del cerebro (serotonina, dopamina), lo que puede explicar los síntomas emocionales y físicos del SPM.',
    tip2Title: 'Las hormonas desempeñan un papel clave',
    tip2Text:
      'Las variaciones hormonales pueden influir en el estado de ánimo, la energía, el sueño y ciertas sensaciones físicas.',
    tips: [
      {title: 'Hidrátate', text: 'Beber suficiente agua ayuda a reducir la hinchazón.'},
      {title: 'Lleva una alimentación equilibrada', text: 'Da prioridad a los alimentos ricos en magnesio, omega-3 y vitaminas del grupo B.'},
      {title: 'Muévete con regularidad', text: 'La actividad física libera endorfinas y reduce el estrés.'},
      {title: 'Gestiona tu estrés', text: 'Respiración, meditación, diario personal... Encuentra lo que te hace sentir bien.'},
      {title: 'Duerme lo suficiente', text: 'Un sueño de calidad favorece el equilibrio hormonal.'},
    ],
    consultTitle: '¿Cuándo pedir una opinión médica?',
    consultText:
      'Si los síntomas son muy intensos y afectan tu vida diaria, podría tratarse de un trastorno disfórico premenstrual (TDPM). No dudes en consultar a un profesional de la salud.',
    shareMessage: 'Síndrome premenstrual (SPM): entenderlo mejor — AWA',
  },
  it: {
    badge: 'CICLO E BENESSERE',
    title: 'Sindrome premestruale (PMS):\ncapirla meglio',
    metaDuration: '4 min di lettura',
    metaValidated: 'Contenuto validato',
    intro: 'La PMS interessa fino a 8 donne su 10. Stanchezza, irritabilità, gonfiore… Capirne le cause e adottare le giuste abitudini può migliorare molto questo momento del mese.',
    contentsTitle: 'In questo articolo',
    contents: [
      'Cos’è la PMS?',
      'Sintomi comuni',
      'Possibili cause',
      'Consigli per stare meglio',
      'Quando rivolgersi al medico?',
    ],
    section1Body: 'La sindrome premestruale riunisce sintomi fisici ed emotivi che di solito compaiono da 5 a 10 giorni prima del periodo mestruale e scompaiono all’inizio del ciclo mestruale.',
    visual1Title: 'Una fase legata al tuo ciclo',
    visual1Text: 'I sintomi compaiono prima del periodo mestruale e di solito si attenuano quando questo inizia.',
    tip1Title: 'Da sapere',
    tip1Text: 'L’intensità e il tipo di sintomi possono variare molto da una donna all’altra e da un ciclo all’altro.',
    symptoms: [
      {
        title: 'Emozioni',
        text: 'Irritabilità, ansia, tristezza, sbalzi d’umore',
      },
      {
        title: 'Fisici',
        text: 'Gonfiore, dolore, stanchezza, mal di testa',
      },
      {
        title: 'Comportamento',
        text: 'Voglia di zuccheri, variazioni dell’appetito, stanchezza',
      },
      {
        title: 'Sonno',
        text: 'Difficoltà a dormire o sonno meno riposante',
      },
    ],
    section3Body: 'Le fluttuazioni ormonali, in particolare del progesterone e degli estrogeni, influenzano i neurotrasmettitori cerebrali (serotonina, dopamina), il che può spiegare i sintomi emotivi e fisici della PMS.',
    tip2Title: 'Gli ormoni hanno un ruolo chiave',
    tip2Text: 'Le fluttuazioni ormonali possono influire su umore, energia, sonno e alcune sensazioni fisiche.',
    tips: [
      {
        title: 'Mantieniti idratata',
        text: 'Bere abbastanza acqua aiuta a ridurre il gonfiore.',
      },
      {
        title: 'Mangia in modo equilibrato',
        text: 'Privilegia alimenti ricchi di magnesio, omega-3 e vitamine del gruppo B.',
      },
      {
        title: 'Resta attiva',
        text: 'L’attività fisica libera endorfine e riduce lo stress.',
      },
      {
        title: 'Gestisci lo stress',
        text: 'Esercizi di respirazione, meditazione, diario personale… Trova ciò che fa per te.',
      },
      {
        title: 'Dormi a sufficienza',
        text: 'Un sonno di qualità favorisce l’equilibrio ormonale.',
      },
    ],
    consultTitle: 'Quando chiedere un parere medico?',
    consultText: 'Se i sintomi sono molto intensi e incidono sulla tua vita quotidiana, potrebbe trattarsi del disturbo disforico premestruale (PMDD). Non esitare a consultare un operatore sanitario.',
    shareMessage: 'Sindrome premestruale (PMS): capirla meglio — AWA',
  },
  tr: {
    badge: 'DÖNGÜ VE İYİ OLUŞ',
    title: 'Adet öncesi sendrom (PMS):\ndaha iyi anlamak',
    metaDuration: '4 dk okuma',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'PMS, her 10 kadından 8’ine kadarını etkiler. Yorgunluk, huzursuzluk, şişkinlik… Nedenlerini anlamak ve doğru alışkanlıklar edinmek, ayın bu dönemini büyük ölçüde iyileştirebilir.',
    contentsTitle: 'Bu makalede',
    contents: [
      'PMS nedir?',
      'Sık görülen belirtiler',
      'Olası nedenler',
      'Daha iyi hissetmek için ipuçları',
      'Doktora ne zaman başvurmalı?',
    ],
    section1Body: 'Adet öncesi sendrom, genellikle adetinden 5 ila 10 gün önce ortaya çıkan ve adet döngüsünün başında geçen bedensel ve duygusal belirtileri bir araya getirir.',
    visual1Title: 'Döngüne bağlı bir evre',
    visual1Text: 'Belirtiler adetinden önce ortaya çıkar ve genellikle adet başlayınca hafifler.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Belirtilerin şiddeti ve türü, kadından kadına ve bir döngüden diğerine büyük ölçüde değişebilir.',
    symptoms: [
      {
        title: 'Duygular',
        text: 'Huzursuzluk, kaygı, hüzün, ruh hali dalgalanmaları',
      },
      {
        title: 'Bedensel',
        text: 'Şişkinlik, ağrı, yorgunluk, baş ağrısı',
      },
      {
        title: 'Davranış',
        text: 'Şeker isteği, iştah değişiklikleri, yorgunluk',
      },
      {
        title: 'Uyku',
        text: 'Uyumakta güçlük ya da daha az dinlendirici uyku',
      },
    ],
    section3Body: 'Özellikle progesteron ve östrojendeki hormonal dalgalanmalar, beynin nörotransmitterlerini (serotonin, dopamin) etkiler; bu da PMS’nin duygusal ve bedensel belirtilerini açıklayabilir.',
    tip2Title: 'Hormonlar önemli bir rol oynar',
    tip2Text: 'Hormonal dalgalanmalar ruh halini, enerjiyi, uykuyu ve bazı bedensel hisleri etkileyebilir.',
    tips: [
      {
        title: 'Yeterince su iç',
        text: 'Yeterli su içmek şişkinliği azaltmaya yardımcı olur.',
      },
      {
        title: 'Dengeli beslen',
        text: 'Magnezyum, omega-3 ve B vitaminlerinden zengin besinleri tercih et.',
      },
      {
        title: 'Aktif kal',
        text: 'Fiziksel aktivite endorfin salgılatır ve stresi azaltır.',
      },
      {
        title: 'Stresini yönet',
        text: 'Nefes egzersizleri, meditasyon, günlük tutma… Sana iyi gelen şeyi bul.',
      },
      {
        title: 'Yeterince uyu',
        text: 'Kaliteli uyku hormonal dengeyi destekler.',
      },
    ],
    consultTitle: 'Ne zaman tıbbi görüş almalısın?',
    consultText: 'Belirtiler çok şiddetliyse ve gündelik hayatını etkiliyorsa, adet öncesi disforik bozukluk (PMDD) söz konusu olabilir. Bir sağlık uzmanına başvurmaktan çekinme.',
    shareMessage: 'Adet öncesi sendrom (PMS): daha iyi anlamak — AWA',
  },
  ru: {
    badge: 'ЦИКЛ И САМОЧУВСТВИЕ',
    title: 'Предменструальный синдром (ПМС):\nпонять лучше',
    metaDuration: '4 мин чтения',
    metaValidated: 'Проверенный материал',
    intro:
      'ПМС затрагивает до 8 женщин из 10. Усталость, раздражительность, вздутие… Понимание причин и правильные привычки могут заметно облегчить этот период месяца.',
    contentsTitle: 'В этой статье',
    contents: [
      'Что такое ПМС?',
      'Частые симптомы',
      'Возможные причины',
      'Советы, которые помогут чувствовать себя лучше',
      'Когда обратиться к врачу?',
    ],
    section1Body:
      'Предменструальный синдром объединяет физические и эмоциональные симптомы, которые обычно появляются за 5–10 дней до месячных и проходят в начале менструального цикла.',
    visual1Title: 'Фаза, связанная с вашим циклом',
    visual1Text:
      'Симптомы появляются перед месячными и обычно ослабевают, когда они начинаются.',
    tip1Title: 'Полезно знать',
    tip1Text:
      'Интенсивность и тип симптомов могут сильно различаться у разных женщин и от цикла к циклу.',
    symptoms: [
      {title: 'Эмоции', text: 'Раздражительность, тревога, грусть, перепады настроения'},
      {title: 'Физические проявления', text: 'Вздутие, боль, усталость, головные боли'},
      {title: 'Поведение', text: 'Тяга к сладкому, изменение аппетита, усталость'},
      {title: 'Сон', text: 'Трудности со сном или менее глубокий сон'},
    ],
    section3Body:
      'Гормональные колебания, в частности прогестерона и эстрогена, влияют на нейромедиаторы мозга (серотонин, дофамин), чем могут объясняться эмоциональные и физические симптомы ПМС.',
    tip2Title: 'Гормоны играют ключевую роль',
    tip2Text:
      'Гормональные колебания могут влиять на настроение, энергию, сон и некоторые физические ощущения.',
    tips: [
      {title: 'Пейте достаточно жидкости', text: 'Достаточное количество воды помогает уменьшить вздутие.'},
      {title: 'Питайтесь сбалансированно', text: 'Отдавайте предпочтение продуктам, богатым магнием, омега-3 и витаминами группы B.'},
      {title: 'Оставайтесь активной', text: 'Физическая активность вызывает выработку эндорфинов и снижает стресс.'},
      {title: 'Справляйтесь со стрессом', text: 'Дыхательные упражнения, медитация, дневник… Найдите то, что подходит вам.'},
      {title: 'Высыпайтесь', text: 'Качественный сон поддерживает гормональный баланс.'},
    ],
    consultTitle: 'Когда стоит обратиться за медицинской консультацией?',
    consultText:
      'Если симптомы очень выражены и влияют на повседневную жизнь, это может быть предменструальное дисфорическое расстройство (ПМДР). Не стесняйтесь обратиться к медицинскому специалисту.',
    shareMessage: 'Предменструальный синдром (ПМС): понять лучше — AWA',
  },
  de: {
    badge: 'ZYKLUS & WOHLBEFINDEN',
    title: 'Prämenstruelles Syndrom (PMS):\nbesser verstehen',
    metaDuration: '4 Min. Lesezeit',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'PMS betrifft bis zu 8 von 10 Frauen. Müdigkeit, Reizbarkeit, Blähungen … Wenn du die Ursachen verstehst und die richtigen Gewohnheiten annimmst, kann sich diese Zeit des Monats deutlich verbessern.',
    contentsTitle: 'In diesem Artikel',
    contents: [
      'Was ist PMS?',
      'Häufige Symptome',
      'Mögliche Ursachen',
      'Tipps für mehr Wohlbefinden',
      'Wann zur Ärztin oder zum Arzt?',
    ],
    section1Body:
      'Das prämenstruelle Syndrom fasst körperliche und emotionale Symptome zusammen, die in der Regel 5 bis 10 Tage vor deiner Periode auftreten und zu Beginn des Menstruationszyklus wieder verschwinden.',
    visual1Title: 'Eine Phase, die mit deinem Zyklus zusammenhängt',
    visual1Text:
      'Die Symptome treten vor deiner Periode auf und lassen in der Regel nach, sobald sie beginnt.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Stärke und Art der Symptome können von Frau zu Frau und von Zyklus zu Zyklus stark variieren.',
    symptoms: [
      {title: 'Emotionen', text: 'Reizbarkeit, Angst, Traurigkeit, Stimmungsschwankungen'},
      {title: 'Körperlich', text: 'Blähungen, Schmerzen, Müdigkeit, Kopfschmerzen'},
      {title: 'Verhalten', text: 'Heißhunger auf Süßes, veränderter Appetit, Müdigkeit'},
      {title: 'Schlaf', text: 'Schlafstörungen oder weniger erholsamer Schlaf'},
    ],
    section3Body:
      'Hormonelle Schwankungen, insbesondere von Progesteron und Östrogen, wirken auf die Botenstoffe im Gehirn (Serotonin, Dopamin) und können die emotionalen und körperlichen Symptome von PMS erklären.',
    tip2Title: 'Hormone spielen eine zentrale Rolle',
    tip2Text:
      'Hormonelle Schwankungen können Stimmung, Energie, Schlaf und bestimmte körperliche Empfindungen beeinflussen.',
    tips: [
      {title: 'Ausreichend trinken', text: 'Genug Wasser zu trinken hilft, Blähungen zu verringern.'},
      {title: 'Ausgewogen essen', text: 'Bevorzuge Lebensmittel, die reich an Magnesium, Omega-3-Fettsäuren und B-Vitaminen sind.'},
      {title: 'Aktiv bleiben', text: 'Körperliche Aktivität setzt Endorphine frei und baut Stress ab.'},
      {title: 'Stress bewältigen', text: 'Atemübungen, Meditation, Tagebuchschreiben … Finde heraus, was dir guttut.'},
      {title: 'Genug schlafen', text: 'Erholsamer Schlaf unterstützt das hormonelle Gleichgewicht.'},
    ],
    consultTitle: 'Wann solltest du ärztlichen Rat einholen?',
    consultText:
      'Wenn die Symptome sehr stark sind und deinen Alltag beeinträchtigen, kann es sich um eine prämenstruelle dysphorische Störung (PMDS) handeln. Zögere nicht, medizinisches Fachpersonal aufzusuchen.',
    shareMessage: 'Prämenstruelles Syndrom (PMS): besser verstehen — AWA',
  },
  zh: {
      badge: '周期与身心',
      title: '经前期综合征（PMS）：\n更好地了解它',
      metaDuration: '阅读约 4 分钟',
      metaValidated: '已审阅内容',
      intro: '多达八成的女性会受到 PMS 的影响。疲倦、易怒、腹胀……了解它的成因并养成合适的习惯，可以大大改善每个月的这段时间。',
      contentsTitle: '本文内容',
      contents: [
        '什么是 PMS？',
        '常见症状',
        '可能的成因',
        '让自己更舒服的小建议',
        '何时去看医生？',
      ],
      section1Body: '经前期综合征包括一组身体和情绪方面的症状，通常在月经来潮前 5 到 10 天出现，并在月经周期开始时消失。',
      visual1Title: '与周期相关的阶段',
      visual1Text: '症状在月经之前出现，通常在月经开始后缓解。',
      tip1Title: '小贴士',
      tip1Text: '症状的强度和类型因人而异，不同周期之间也可能差别很大。',
      symptoms: [
        {
          title: '情绪',
          text: '易怒、焦虑、悲伤、情绪波动',
        },
        {
          title: '身体',
          text: '腹胀、疼痛、疲倦、头痛',
        },
        {
          title: '行为',
          text: '想吃甜食、食欲变化、疲倦',
        },
        {
          title: '睡眠',
          text: '难以入睡或睡得不够踏实',
        },
      ],
      section3Body: '激素的波动，尤其是孕激素和雌激素的变化，会影响大脑中的神经递质（血清素、多巴胺），这可能解释了 PMS 的情绪和身体症状。',
      tip2Title: '激素起着关键作用',
      tip2Text: '激素波动可能影响情绪、精力、睡眠和某些身体感受。',
      tips: [
        {
          title: '保持水分充足',
          text: '喝足够的水有助于减轻腹胀。',
        },
        {
          title: '均衡饮食',
          text: '多吃富含镁、欧米伽-3 和 B 族维生素的食物。',
        },
        {
          title: '保持活动',
          text: '体育活动能释放内啡肽，缓解压力。',
        },
        {
          title: '管理压力',
          text: '呼吸练习、冥想、写日记……找到适合你的方式。',
        },
        {
          title: '睡眠充足',
          text: '高质量的睡眠有助于维持激素平衡。',
        },
      ],
      consultTitle: '何时应该寻求医疗建议？',
      consultText: '如果症状非常严重并影响日常生活，可能是经前焦虑障碍（PMDD）。不要犹豫，请咨询医疗专业人员。',
      shareMessage: '经前期综合征（PMS）：更好地了解它 — AWA',
    },
  'zh-Hant': {
      badge: '週期與身心',
      title: '經前症候群（PMS）：\n更好地瞭解它',
      metaDuration: '閱讀約 4 分鐘',
      metaValidated: '已審閱內容',
      intro: '多達八成的女性會受到 PMS 的影響。疲倦、易怒、腹脹……瞭解它的成因並養成合適的習慣，可以大大改善每個月的這段時間。',
      contentsTitle: '本文內容',
      contents: [
        '什麼是 PMS？',
        '常見症狀',
        '可能的成因',
        '讓自己更舒服的小建議',
        '何時去看醫生？',
      ],
      section1Body: '經前症候群包括一組身體和情緒方面的症狀，通常在月經來潮前 5 到 10 天出現，並在月經週期開始時消失。',
      visual1Title: '與週期相關的階段',
      visual1Text: '症狀在月經之前出現，通常在月經開始後緩解。',
      tip1Title: '小提醒',
      tip1Text: '症狀的強度和型別因人而異，不同週期之間也可能差別很大。',
      symptoms: [
        {
          title: '情緒',
          text: '易怒、焦慮、悲傷、情緒波動',
        },
        {
          title: '身體',
          text: '腹脹、疼痛、疲倦、頭痛',
        },
        {
          title: '行為',
          text: '想吃甜食、食慾變化、疲倦',
        },
        {
          title: '睡眠',
          text: '難以入睡或睡得不夠踏實',
        },
      ],
      section3Body: '荷爾蒙的波動，尤其是黃體素和雌激素的變化，會影響大腦中的神經遞質（血清素、多巴胺），這可能解釋了 PMS 的情緒和身體症狀。',
      tip2Title: '荷爾蒙起著關鍵作用',
      tip2Text: '荷爾蒙波動可能影響情緒、精力、睡眠和某些身體感受。',
      tips: [
        {
          title: '保持水分充足',
          text: '喝足夠的水有助於減輕腹脹。',
        },
        {
          title: '均衡飲食',
          text: '多吃富含鎂、歐米伽-3 和 B 族維生素的食物。',
        },
        {
          title: '保持活動',
          text: '體育活動能釋放內啡肽，緩解壓力。',
        },
        {
          title: '管理壓力',
          text: '呼吸練習、冥想、寫日記……找到適合你的方式。',
        },
        {
          title: '睡眠充足',
          text: '高品質的睡眠有助於維持荷爾蒙平衡。',
        },
      ],
      consultTitle: '何時應該尋求醫療建議？',
      consultText: '如果症狀非常嚴重並影響日常生活，可能是經前焦慮障礙（PMDD）。不要猶豫，請諮詢醫療專業人員。',
      shareMessage: '經前症候群（PMS）：更好地瞭解它 — AWA',
    },
  ar: {
    badge: 'الدورة والراحة',
    title: 'متلازمة ما قبل الحيض:\nفهم أفضل لها',
    metaDuration: '4 د قراءة',
    metaValidated: 'محتوى مراجَع',
    intro:
      'تصيب متلازمة ما قبل الحيض ما يصل إلى 8 من كل 10 نساء. إرهاق وتهيّج وانتفاخ… وفهم أسبابها واعتماد العادات المناسبة يمكن أن يحسّنا كثيرًا هذه الفترة من الشهر.',
    contentsTitle: 'في هذا المقال',
    contents: [
      'ما هي متلازمة ما قبل الحيض؟',
      'الأعراض الشائعة',
      'الأسباب المحتملة',
      'نصائح لتشعري بتحسن',
      'متى تراجعين الطبيب؟',
    ],
    section1Body:
      'تجمع متلازمة ما قبل الحيض أعراضًا جسدية ونفسية تظهر عادةً قبل الحيض بمدة 5 إلى 10 أيام وتزول مع بداية الدورة الشهرية.',
    visual1Title: 'مرحلة مرتبطة بدورتك',
    visual1Text:
      'تظهر الأعراض قبل الحيض وتخف عادةً بعد بدايته.',
    tip1Title: 'من المفيد أن تعرفي',
    tip1Text:
      'يمكن أن تختلف شدة الأعراض ونوعها اختلافًا كبيرًا من امرأة إلى أخرى، ومن دورة إلى أخرى.',
    symptoms: [
      {title: 'المشاعر', text: 'تهيّج، قلق، حزن، تقلب المزاج'},
      {title: 'الجسد', text: 'انتفاخ، ألم، إرهاق، صداع'},
      {title: 'السلوك', text: 'اشتهاء السكر، تغيّر الشهية، إرهاق'},
      {title: 'النوم', text: 'صعوبة في النوم أو نوم أقل راحة'},
    ],
    section3Body:
      'تؤثر التقلبات الهرمونية، خاصة في البروجسترون والإستروجين، في النواقل العصبية في الدماغ (السيروتونين والدوبامين)، وقد يفسّر ذلك الأعراض النفسية والجسدية لمتلازمة ما قبل الحيض.',
    tip2Title: 'للهرمونات دور أساسي',
    tip2Text:
      'يمكن أن تؤثر التقلبات الهرمونية في المزاج والطاقة والنوم وبعض الأحاسيس الجسدية.',
    tips: [
      {title: 'حافظي على الترطيب', text: 'شرب كمية كافية من الماء يساعد على تقليل الانتفاخ.'},
      {title: 'تناولي غذاءً متوازنًا', text: 'فضّلي الأطعمة الغنية بالمغنيسيوم وأوميغا 3 وفيتامينات ب.'},
      {title: 'ابقي نشيطة', text: 'يُفرز النشاط البدني الإندورفين ويقلل التوتر.'},
      {title: 'تعاملي مع توترك', text: 'تمارين التنفس، التأمل، الكتابة في اليوميات… ابحثي عمّا يناسبك.'},
      {title: 'احصلي على قسط كافٍ من النوم', text: 'النوم الجيد يدعم التوازن الهرموني.'},
    ],
    consultTitle: 'متى ينبغي أن تطلبي المشورة الطبية؟',
    consultText:
      'إذا كانت الأعراض شديدة جدًا وتؤثر في حياتك اليومية، فقد يكون ذلك اضطراب ما قبل الحيض المزاجي (PMDD). لا تترددي في استشارة مختصة صحية.',
    shareMessage: 'متلازمة ما قبل الحيض: فهم أفضل لها — AWA',
  },
  kab: {
    badge: 'DDAWRA & ṢṢEḤḤA',
    title: 'Aɣilif send tiregwa (PMS):\nad t-nefhem yelhan ugar',
    metaDuration: 'Taɣuri n 4 n tisdidin',
    metaValidated: 'Agbur yettwasenqed',
    intro:
      'PMS yettaɣ ɣer 8 seg 10 n tilawin ar tazwara. Leɛyaṭ, tuɣalin n uẓar, uḥulfu n uẓeṭṭa… Ad tfehmeḍ ssebbat-is u ad tsemreḍ iɣal yelhan zemren ad d-awin ameẓẓuy ameqqran i wakud-a n useggas.',
    contentsTitle: 'Deg umagrad-a',
    contents: [
      'D acu i d PMS?',
      'Tilɣa i d-yettuɣalen',
      'Ssebbat izemren',
      'Iwellihen i wakken ad tḥessed yelhan ugar',
      'Melmi ara tẓerreḍ aṭṭbib?',
    ],
    section1Body:
      'Aɣilif send tiregwa yesdukkel tilɣa tigarasanin d tilɣa n wul i d-yettbanen s wudem amagnu 5 ɣer 10 n wussan send tiregwa-ik u ttwaksen deg tazwara n ddawra n tiregwa.',
    visual1Title: 'Aḥric yeqqnen ɣer ddawra-inek',
    visual1Text:
      'Tilɣa ttbanent send tiregwa-ik u ttnaqqasent s wudem amagnu mi ara tebdu.',
    tip1Title: 'Yelha ad tessneḍ',
    tip1Text:
      'Azal d wanaw n tilɣa zemren ad ttemxalafen aṭas seg yiwet tmeṭṭut ɣer tayeḍ, u seg yiwen n uzray ɣer wayeḍ.',
    symptoms: [
      {title: 'Iwulmen', text: 'Aɣilif, uṭṭun, tamɣart, isnifilen n wul'},
      {title: 'Ugris', text: 'Uḥulfu n uẓeṭṭa, lweǧɛ, leɛyaṭ, lweǧɛ n uqerruy'},
      {title: 'Ugar', text: 'Ugar n usukkeṛ, isnifilen n ṭṭeɛm, leɛyaṭ'},
      {title: 'Anẓar', text: 'Ugur n unẓar neɣ anẓar ur nelli ara d aṛṛaḥ'},
    ],
    section3Body:
      'Isnifilen n yihurmunen, nezzeh d wid n progestérone d estrogène, ttɛeddin ɣef yineṭṭiqen n uqerruy (sérotonine, dopamine), ayen izmer ad d-yesseklen tilɣa n wul d tilɣa n ugris n PMS.',
    tip2Title: 'Yihurmunen sɛan tamlilt tameqqrant',
    tip2Text:
      'Isnifilen n yihurmunen zemren ad ɛeṭṭlen ayen n wul, tazmert, anẓar d kra n yiḥulfawen n ugris.',
    tips: [
      {title: 'Sew aṭas n waman', text: 'Asew n waman yemkulen yettɛawan ad yeqqes uḥulfu n uẓeṭṭa.'},
      {title: 'Ečč tuččit yemmendad', text: 'Fren iwlilen id-yessewten magnésium, omega-3 d tivitamines B.'},
      {title: 'Ssiweḍ iseḥḥen', text: 'Tagnit n ugris tessuffeɣ endorphines u tessenqes aɣilif.'},
      {title: 'Ḥkem deg uɣilif-ik', text: 'Ineɣman n unfas, anefsay, aɣmis… Af-d ayen i k-yelhan.'},
      {title: 'Nnez s wudem yekfan', text: 'Anẓar yelhan yettɛawan deg umendad n yihurmunen.'},
    ],
    consultTitle: 'Melmi ara tsuteḍ tallalt n uṭṭbib?',
    consultText:
      'Ma yella tilɣa d tiqwayanin aṭas u ttɛeṭṭilent tudert-ik n yal ass, izmer ad yili d PMDD (ugur n wul send tiregwa). Ur tettaɛǧalt ara ad tmeslayeḍ d umaẓrag n ṣṣeḥḥa.',
    shareMessage: 'Aɣilif send tiregwa (PMS): ad t-nefhem yelhan ugar — AWA',
  },
  om: {
    badge: 'MARSAA FI NAGAA',
    title: 'Sindirooma duraan laguu (PMS):\ngaarittii hubachuu',
    metaDuration: 'Daqiiqaa 4 dubbisuu',
    metaValidated: 'Qabiyyee madaalame',
    intro:
      'PMS dubartoota 10 keessaa hanga 8tti dhiibbaa geessisuu danda\'a. Dadhabbii, aaraa, garaa bobbaa\'uu… Sababoota isaa hubachuu fi gochaa sirrii hordofuun yeroo ji\'aa kana baay\'ee fooyyessuu danda\'a.',
    contentsTitle: 'Barruu kana keessatti',
    contents: [
      'PMS maali?',
      'Mallattoowwan baratamoo',
      'Sababoota danda\'aman',
      'Gorsa gaarii ta\'uuf',
      'Yoom doktora argu?',
    ],
    section1Body:
      'Sindiroomni duraan laguu mallattoo qaamaa fi miiraa walitti qabata, kan baay\'ee guyyaa 5 hanga 10 laguu dura mul\'atu, marsaa laguu jalqabaa irratti kan dhaabbatu.',
    visual1Title: 'Sadarkaa marsaa kee waliin walqabate',
    visual1Text:
      'Mallattooleen laguu dura mul\'atu, yeroo baay\'ee laguun yeroo eegalu ni salphatu.',
    tip1Title: 'Beekuun gaarii dha',
    tip1Text:
      'Cimina fi gosa mallattoowwanii dubartii dubartiitti, marsaa marsaatti illee baay\'ee garaagara ta\'uu danda\'a.',
    symptoms: [
      {title: 'Miira', text: 'Aaraa, yaaddoo, gadda, jijjiirama miiraa'},
      {title: 'Qaamaa', text: 'Garaa bobbaa\'uu, dhukkubbii, dadhabbii, mataa dhukkubbii'},
      {title: 'Amala', text: 'Shukkaara kajeelu, jijjiirama fedhii nyaataa, dadhabbii'},
      {title: 'Rafuu', text: 'Rafuuf rakkoo ykn rafuu boqonnaa hin qabne'},
    ],
    section3Body:
      'Jijjiiramni hormoonii, keessattuu progesterone fi estrogen, neurotransmitter sammuu (serotonin, dopamine) irratti dhiibbaa geessisa, kunis mallattoowwan miiraa fi qaamaa PMS ibsuu danda\'a.',
    tip2Title: 'Hormoonii gahee ijoo qabu',
    tip2Text:
      'Jijjiiramni hormoonii miira, humna, rafuu fi miira qaamaa tokko tokko irratti dhiibbaa geessisuu danda\'a.',
    tips: [
      {title: 'Bishaan gahaa dhugi', text: 'Bishaan gahaa dhuguun garaa bobbaa\'uu hir\'isuuf ni gargaara.'},
      {title: 'Nyaata madaalawaa nyaadhu', text: 'Nyaata magnesium, omega-3 fi vitamin B baay\'ee qabu filadhu.'},
      {title: 'Sochii qabaadhu', text: 'Sochiin qaamaa endorphin gadhiisa, dhiphina hir\'isa.'},
      {title: 'Dhiphina kee to\'adhu', text: 'Shaakala afuufuu, yaada qabsiisuu, barreessuu… Waan si fayyadu argadhu.'},
      {title: 'Rafuu gahaa rafi', text: 'Rafuun qulqullina qabu madaalli hormoonii deeggara.'},
    ],
    consultTitle: 'Yoom gorsa yaalaa gaafachuu qabda?',
    consultText:
      'Mallattooleen yoo baay\'ee cimaa ta\'anii jireenya guyyaa guyyaa kee irratti dhiibbaa yoo geessisan, premenstrual dysphoric disorder (PMDD) ta\'uu danda\'a. Ogeessa fayyaa waliin mari\'achuuf hin shakkin.',
    shareMessage: 'Sindirooma duraan laguu (PMS): gaarittii hubachuu — AWA',
  },
  ti: {
    badge: 'ዑደትን ጽቡቕ ኩነታትን',
    title: 'ቅድሚ ወርሓዊ ዓደት ሲንድሮም (PMS)፦\nብዝሓሸ ምርዳእ',
    metaDuration: '4 ደቒቕ ንባብ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro:
      'PMS ክሳብ 8 ካብ 10 ደቀንስትዮ ይጸልወን። ድኻም፣ ቁጥዐ፣ ምንፋሕ ከብዲ… ምኽንያታቱ ምርዳእን ግቡእ ልምድታት ምኽታልን እዚ ግዜ ወርሒ ብብዙሕ ክሕይሽ ይኽእል።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    contents: [
      'PMS እንታይ እዩ?',
      'ልሙዳት ምልክታት',
      'ዝኽኣሉ ምኽንያታት',
      'ዝሓሸ ንምስማዕ ምኽሪታት',
      'ሓኪም መዓስ ትርእይ?',
    ],
    section1Body:
      'ቅድሚ ወርሓዊ ዓደት ሲንድሮም ኣካላውን ስምዒታውን ምልክታት ይእክብ፣ ብዙሕ ግዜ 5 ክሳብ 10 መዓልታት ቅድሚ ወርሓዊ ዓደትካ ይመጽእን ኣብ መጀመርታ ዑደት ወርሓዊ ዓደት ይሓልፍን።',
    visual1Title: 'ምስ ዑደትካ ዝተኣሳሰር ደረጃ',
    visual1Text:
      'ምልክታት ቅድሚ ወርሓዊ ዓደትካ ይመጹ፣ ምስ ጀመረ ድማ ብዙሕ ግዜ ይቀልሉ።',
    tip1Title: 'ጽቡቕ ምፍላጥ',
    tip1Text:
      'ጽዕንቱን ዓይነት ምልክታትን ካብ ሓንቲ ሰበይቲ ናብ ካልእ፣ ካብ ሓደ ዑደት ናብ ካልእ ድማ ብዙሕ ክፈላለ ይኽእል።',
    symptoms: [
      {title: 'ስምዒታት', text: 'ቁጥዐ፣ ጭንቀት፣ ሕዘን፣ ለውጢ ስምዒት'},
      {title: 'ኣካላዊ', text: 'ምንፋሕ ከብዲ፣ ቃንዛ፣ ድኻም፣ ቃንዛ ርእሲ'},
      {title: 'ባህሪ', text: 'ሽኮር ምምኳን፣ ለውጢ ሃንቀውታ መግቢ፣ ድኻም'},
      {title: 'ድቃስ', text: 'ድቃስ ሽግር ወይ ዘይረፍቲ ድቃስ'},
    ],
    section3Body:
      'ናይ ሆርሞን ምውጣእ ምውራድ፣ ብፍላይ ፕሮጀስትሮንን ኤስትሮጅንን፣ ንኒውሮትራንስሚተራት ሓንጎል (ሴሮቶኒን፣ ዶፓሚን) ይጸሉ፣ እዚ ንስምዒታውን ኣካላውን ምልክታት PMS ከብርህ ይኽእል።',
    tip2Title: 'ሆርሞናት ቀንዲ ግደ ኣለዎም',
    tip2Text:
      'ናይ ሆርሞን ምውጣእ ምውራድ ንስምዒት፣ ሓይሊ፣ ድቃስን ገለ ኣካላዊ ስምዒታትን ክጸሉ ይኽእል።',
    tips: [
      {title: 'ማይ ብዝተኸፍአ ስተይ', text: 'ብዕቱብ ማይ ምስታይ ምንፋሕ ከብዲ ክውሕድ ይሕግዝ።'},
      {title: 'ዝተመጣጠነ ኣመጋግባ ብላዕ', text: 'ብማግኒዚየም፣ ኦሜጋ-3ን ቫይታሚን B ሃብታም መግብታት ምረጽ።'},
      {title: 'ንጡፍ ኩን', text: 'ኣካላዊ ንጥፈት ኢንዶርፊን የፍሪ ጭንቀት ድማ የውርድ።'},
      {title: 'ጭንቀትካ ሓዝ', text: 'ልምምድ ምትንፋስ፣ ማሰላሰል፣ ጆርናል ምጽሓፍ… እቲ ንዓኻ ዝሰርሕ ድለ።'},
      {title: 'ብዕቱብ ደቅስ', text: 'ጽቡቕ ድቃስ ናይ ሆርሞን ሚዛን ይድግፍ።'},
    ],
    consultTitle: 'ሕክምናዊ ምኽሪ መዓስ ትሓትት?',
    consultText:
      'ምልክታት ኣዝዮም ጽኑዓት እንተ ኾይኖምን መዓልታዊ ህይወትካ እንተ ጸሊዎምን፣ ቅድሚ ወርሓዊ ዓደት ዘሎ ዲስፎሪክ ሕማም (PMDD) ክኸውን ይኽእል። ምስ ጥዕና ሰራሕተኛ ምዝራብ ኣይትሰማማዕ።',
    shareMessage: 'ቅድሚ ወርሓዊ ዓደት ሲንድሮም (PMS)፦ ብዝሓሸ ምርዳእ — AWA',
  },
  rw: {
    badge: 'UKWEZI N’IMIBEREHO MYIZA',
    title: 'Syndrome ibanziriza imihango (PMS):\nmuyisobanukirwe neza',
    metaDuration: 'Isomwa mu minota 4',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro:
      'PMS igera kuri 8 mu bagore 10. Kunanirwa, kurakara, inda yaguye… Gusobanukirwa impamvu zayo no gukurikiza imigenzo myiza bishobora kunoza cyane iki gihe cy’ukwezi.',
    contentsTitle: 'Muri iyi nkuru',
    contents: [
      'PMS ni iki?',
      'Ibimenyetso bisanzwe',
      'Impamvu zishoboka',
      'Inama zo kumererwa neza',
      'Ni ryari ujya kwa muganga?',
    ],
    section1Body:
      'Syndrome ibanziriza imihango ihuza ibimenyetso by’umubiri n’iby’umutima bigaragara akenshi iminsi 5 kugeza kuri 10 mbere y’imihango yawe kandi bikagenda mu ntangiriro y’ukwezi kw’imihango.',
    visual1Title: 'Igihe gifitanye isano n’ukwezi kwawe',
    visual1Text:
      'Ibimenyetso bigaragara mbere y’imihango yawe kandi akenshi bigabanuka iyo itangiye.',
    tip1Title: 'Ni byiza kubimenya',
    tip1Text:
      'Ubukana n’ubwoko bw’ibimenyetso bishobora gutandukana cyane ku mugore ku wundi, no hagati y’ukwezi n’ukundi.',
    symptoms: [
      {title: 'Amarangamutima', text: 'Kurakara, guhangayika, ishavu, guhindagurika kw’imitekerereze'},
      {title: 'Umubiri', text: 'Inda yaguye, ububabare, kunanirwa, kuribwa umutwe'},
      {title: 'Imyitwarire', text: 'Kwifuza isukari, guhinduka kw’ubushake bwo kurya, kunanirwa'},
      {title: 'Gusinzira', text: 'Ingorane zo gusinzira cyangwa gusinzira nabi'},
    ],
    section3Body:
      'Guhindagurika kw’imisemburo, cyane cyane progestérone na œstrogène, bigira ingaruka ku bimenyetso bitwara ubutumwa mu bwonko (sérotonine, dopamine), bishobora gusobanura ibimenyetso by’umutima n’iby’umubiri bya PMS.',
    tip2Title: 'Imisemburo ifite uruhare rukomeye',
    tip2Text:
      'Guhindagurika kw’imisemburo bishobora kugira ingaruka ku mitekerereze, imbaraga, gusinzira n’ibyiyumviro bimwe by’umubiri.',
    tips: [
      {title: 'Komeza ugire amazi mu mubiri', text: 'Kunywa amazi ahagije bifasha kugabanya inda yaguye.'},
      {title: 'Rya indyo yuzuye', text: 'Hitamo ibiribwa bikungahaye kuri magnésium, omega-3 na vitamine B.'},
      {title: 'Komeza ukore imyitozo', text: 'Imyitozo ngororamubiri isohora endorphines kandi igabanya umunaniro w’umutima.'},
      {title: 'Gabanya umunaniro w’umutima', text: 'Imyitozo yo guhumeka, kuzirikana, kwandika ibyo wiyumva… Shaka icyagukorera.'},
      {title: 'Sinzira bihagije', text: 'Gusinzira neza bifasha kuringaniza imisemburo.'},
    ],
    consultTitle: 'Ni ryari ukwiye gusaba inama za muganga?',
    consultText:
      'Niba ibimenyetso bikomeye cyane kandi bigira ingaruka ku buzima bwawe bwa buri munsi, bishobora kuba ari premenstrual dysphoric disorder (PMDD). Ntutinye kujya kureba umuganga ushinzwe ubuzima.',
    shareMessage: 'Syndrome ibanziriza imihango (PMS): muyisobanukirwe neza — AWA',
  },
  rn: {
    badge: 'URUZINDUKO N\'UBUZIMA BWIZA',
    title: 'Ibimenyetso bibanziriza imihango (PMS):\nbimenye neza',
    metaDuration: 'Soma muminuta 4',
    metaValidated: 'Ibikorwa vyasuzumwe',
    intro:
      'PMS ifata gushika ku bagore 8 kuri 10. Umunaniro, kurakara, inda ibyimbye… Kumenya ivyo biva no gushira mu ngiro ingeso nziza birashobora gutuma iki gihe c\'ukwezi kigenda neza cane.',
    contentsTitle: 'Muri iyi nkuru',
    contents: [
      'PMS ni iki?',
      'Ibimenyetso bikunze',
      'Ivyaba bitera',
      'Inama zo kwumva umerewe neza',
      'Ni ryari wobona muganga?',
    ],
    section1Body:
      'Ibimenyetso bibanziriza imihango bihuza ibimenyetso vy\'umubiri n\'vyo mu mutima bikunze kuboneka iminsi 5 gushika 10 imbere y\'imihango yawe bigashira mu ntango y\'uruzinduko rw\'imihango.',
    visual1Title: 'Igihe gifatanye n\'uruzinduko rwawe',
    visual1Text:
      'Ibimenyetso biboneka imbere y\'imihango yawe kandi bikunze gutuma iyo itangiye.',
    tip1Title: 'Ni vyiza kubimenya',
    tip1Text:
      'Ububasha n\'ubwoko bw\'ibimenyetso birashobora gutandukana cane hagati y\'umugore n\'uwundi, no hagati y\'uruzinduko n\'urundi.',
    symptoms: [
      {title: 'Amarangamutima', text: 'Kurakara, guhagarika umutima, agahinda, amarangamutima ahinduka'},
      {title: 'Umubiri', text: 'Inda ibyimbye, ububabare, umunaniro, kuribwa umutwe'},
      {title: 'Imyifatire', text: 'Kwifuza isukari, impinduka mu kurya, umunaniro'},
      {title: 'Ibitotsi', text: 'Ingorane zo gusinzira canke ibitotsi bitaruhura'},
    ],
    section3Body:
      'Impinduka za hormone, cane cane iza progestérone na œstrogène, zigira ingaruka ku bintu vyo mu bwonko bitwara amakuru (sérotonine, dopamine), bishobora gusobanura ibimenyetso vy\'amarangamutima n\'vy\'umubiri vya PMS.',
    tip2Title: 'Hormone zigira uruhara rukomeye',
    tip2Text:
      'Impinduka za hormone zirashobora kugira ingaruka ku marangamutima, ku mbaraga, ku bitotsi no ku bimenyetso bimwebimwe vy\'umubiri.',
    tips: [
      {title: 'Nywa amazi ahagije', text: 'Kunywa amazi ahagije bifasha kugabanya inda ibyimbye.'},
      {title: 'Rya ifunguro rirangwa n\'uburinganire', text: 'Hitamwo ibiryo bifise magnésium, omega-3 n\'ivitamini B nyinshi.'},
      {title: 'Guma ukora imyitozo', text: 'Imyitozo y\'umubiri irekura endorphines kandi igabanya umunaniro wo mu mutima.'},
      {title: 'Genzura umunaniro wo mu mutima', text: 'Imyitozo yo guhumeka, gutekereza utuje, kwandika ivyo wiyumvira… Shakashaka ico kigufasha.'},
      {title: 'Sinzira bihagije', text: 'Ibitotsi vyiza bishigikira uburinganire bwa hormone.'},
    ],
    consultTitle: 'Ni ryari wosaba inama z\'ubuvuzi?',
    consultText:
      'Niba ibimenyetso bikomeye cane kandi bigira ingaruka ku buzima bwawe bwa buri musi, bishobora kuba ari PMDD (premenstrual dysphoric disorder). Ntutinye kubonana n\'umuhanga mu buvuzi.',
    shareMessage: 'Ibimenyetso bibanziriza imihango (PMS): bimenye neza — AWA',
  },
  ig: {
    badge: 'OKIRIKIRI NA ỌDỊMMA',
    title: 'Premenstrual syndrome (PMS):\nịghọta ya nke ọma',
    metaDuration: 'Nkeji 4 iji gụọ',
    metaValidated: 'Ọdịnaya e nyochaworo',
    intro:
      'PMS na-emetụta ruo ụmụ nwanyị 8 n\'ime 10. Ike ọgwụgwụ, iwe iwe, afọ ufe… Ịghọta ihe kpatara ya na ịnabata omume ọma nwere ike imeziwanye oge a nke ọnwa nke ukwuu.',
    contentsTitle: 'N\'edemede a',
    contents: [
      'Gịnị bụ PMS?',
      'Afọ ndị a na-ahụkarị',
      'Ihe nwere ike ịkpata ya',
      'Ndụmọdụ iji nwee mmetụta ka mma',
      'Mgbe ị kwesịrị ịhụ dọkịta?',
    ],
    section1Body:
      'Premenstrual syndrome na-agbakọta afọ anụ ahụ na nke mmụọ nke na-apụtakarị ụbọchị 5 ruo 10 tupu nsọ ọnwa gị ma na-apụ n\'mmalite okirikiri nsọ ọnwa.',
    visual1Title: 'Oge jikọtara na okirikiri gị',
    visual1Text:
      'Afọ na-apụta tupu nsọ ọnwa gị ma na-ebelatakarị mgbe ọ malitere.',
    tip1Title: 'Ọ dị mma ịmara',
    tip1Text:
      'Etu afọ siri ike na ụdị ha nwere ike ịdị iche nke ukwuu site n\'otu nwanyị gaa n\'onye ọzọ, na site n\'okirikiri gaa n\'okirikiri.',
    symptoms: [
      {title: 'Mmetụta mmụọ', text: 'Iwe iwe, nchegbu, ewuuwe, mgbanwe mmụọ'},
      {title: 'Anụ ahụ', text: 'Afọ ufe, mgbu, ike ọgwụgwụ, isi ọwụwa'},
      {title: 'Omume', text: 'Ọchịchọ shuga, mgbanwe agụụ nri, ike ọgwụgwụ'},
      {title: 'Ụra', text: 'Nsogbu ụra ma ọ bụ ụra na-adịghị zuru ike'},
    ],
    section3Body:
      'Mgbanwe hormone, karịsịa na progesterone na estrogen, na-emetụta neurotransmitters dị n\'ụbụrụ (serotonin, dopamine), nke nwere ike ịkọwa afọ mmụọ na nke anụ ahụ nke PMS.',
    tip2Title: 'Hormone na-arụ ọrụ dị mkpa',
    tip2Text:
      'Mgbanwe hormone nwere ike imetụta mmụọ, ume, ụra, na mmetụta anụ ahụ ụfọdụ.',
    tips: [
      {title: 'Na-aṅụ mmiri', text: 'Ịṅụ mmiri zuru ezu na-enyere aka belata afọ ufe.'},
      {title: 'Rie nri nwere nguzozi', text: 'Họrọ nri bara ụba na magnesium, omega-3, na vitamin B.'},
      {title: 'Nọgide na-eme ihe', text: 'Mmega ahụ na-ewepụta endorphins ma na-ebelata nrụgide.'},
      {title: 'Jikwaa nrụgide gị', text: 'Mmega iku ume, ntụgharị uche, ide akwụkwọ ntụkwasị… Chọpụta ihe na-arụ ọrụ maka gị.'},
      {title: 'Hie ụra zuru ezu', text: 'Ụra dị mma na-akwado nguzozi hormone.'},
    ],
    consultTitle: 'Mgbe ị kwesịrị ịchọ ndụmọdụ dọkịta?',
    consultText:
      'Ọ bụrụ na afọ dị oke njọ ma na-emetụta ndụ gị kwa ụbọchị, ọ nwere ike ịbụ premenstrual dysphoric disorder (PMDD). Ekwela ka ụjọ gbochie gị ịkpọtụrụ onye ọrụ ahụike.',
    shareMessage: 'Premenstrual syndrome (PMS): ịghọta ya nke ọma — AWA',
  },
  yo: {
    badge: 'ÌYÍPO ÀTI ÀLÀÀFÍÀ',
    title: 'Premenstrual syndrome (PMS):\nlóye rẹ̀ dáadáa',
    metaDuration: 'Ìṣẹ́jú 4 láti kà',
    metaValidated: 'Àkóónú tí a ti yẹ̀wò',
    intro:
      'PMS ń kan tó 8 nínú obìnrin mẹ́wàá. Àárẹ̀, ìbínú, ìwú ikùn… Mímọ ohun tó ń fà á àti gbígba àwọn àṣà tó tọ́ lè mú àkókò oṣù yìí sunwọ̀n sí i gan-an.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    contents: [
      'Kí ni PMS?',
      'Àwọn àmì tó wọ́pọ̀',
      'Àwọn ohun tó lè fà á',
      'Àwọn ìmọ̀ràn láti rí ara dá',
      'Ìgbà wo ni o yẹ kí o rí dókítà?',
    ],
    section1Body:
      'Premenstrual syndrome kó àwọn àmì ara àti ti ìmọ̀lára pọ̀ tí wọ́n sábà máa ń farahàn ní ọjọ́ 5 sí 10 ṣáájú nǹkan oṣù rẹ, tí wọ́n sì ń lọ ní ìbẹ̀rẹ̀ ìyípo oṣù.',
    visual1Title: 'Àkókò tó so mọ́ ìyípo rẹ',
    visual1Text:
      'Àwọn àmì ń farahàn ṣáájú nǹkan oṣù rẹ, wọ́n sì sábà máa ń rọlẹ̀ nígbà tí ó bá bẹ̀rẹ̀.',
    tip1Title: 'Ó dára láti mọ̀',
    tip1Text:
      'Bí àwọn àmì ṣe le tó àti irú wọn lè yàtọ̀ gidigidi láti obìnrin kan sí òmíràn, àti láti ìyípo kan sí òmíràn.',
    symptoms: [
      {title: 'Ìmọ̀lára', text: 'Ìbínú, àníyàn, ìbànújẹ́, ìyípadà ìhùwàsí'},
      {title: 'Ti ara', text: 'Ìwú ikùn, ìrora, àárẹ̀, ìfọ́rí'},
      {title: 'Ìhùwàsí', text: 'Ìfẹ́ àwọn nǹkan dídùn, àyípadà ìfẹ́ oúnjẹ, àárẹ̀'},
      {title: 'Oorun', text: 'Ìṣòro sísùn tàbí oorun tí kò dùn tó'},
    ],
    section3Body:
      'Àwọn ìyípadà hormone, pàápàá progesterone àti estrogen, ń kan àwọn neurotransmitter ọpọlọ (serotonin, dopamine), èyí tó lè ṣàlàyé àwọn àmì ìmọ̀lára àti ti ara PMS.',
    tip2Title: 'Àwọn hormone ní ipa pàtàkì',
    tip2Text:
      'Àwọn ìyípadà hormone lè kan ìhùwàsí, agbára, oorun, àti àwọn ìmọ̀lára ara kan.',
    tips: [
      {title: 'Máa mu omi tó tó', text: 'Mímu omi tó tó ń ṣèrànwọ́ láti dín ìwú ikùn kù.'},
      {title: 'Jẹ oúnjẹ tó ní ìwọ̀ntúnwọ̀nsì', text: 'Fẹ́ràn àwọn oúnjẹ tó ní magnesium, omega-3 àti vitamin B lọ́pọ̀.'},
      {title: 'Máa ṣiṣẹ́ ara', text: 'Iṣẹ́ ara ń tú endorphins jáde, ó sì ń dín másùnmáwo kù.'},
      {title: 'Ṣàkóso másùnmáwo rẹ', text: 'Àwọn ìdárayá mímí, ìṣàrò, kíkọ àkọsílẹ̀… Wá ohun tó ṣiṣẹ́ fún ọ.'},
      {title: 'Sùn tó', text: 'Oorun tó dára ń ṣèrànwọ́ fún ìwọ̀ntúnwọ̀nsì hormone.'},
    ],
    consultTitle: 'Ìgbà wo ni o yẹ kí o wá ìmọ̀ràn ìṣègùn?',
    consultText:
      'Tí àwọn àmì bá le gan-an tí wọ́n sì ń kan ìgbésí ayé ojoojúmọ́ rẹ, ó lè jẹ́ premenstrual dysphoric disorder (PMDD). Má ṣe lọ́ra láti bá ọ̀jọ̀gbọ́n ìlera sọ̀rọ̀.',
    shareMessage: 'Premenstrual syndrome (PMS): lóye rẹ̀ dáadáa — AWA',
  },
  zu: {
    badge: 'UMJIKELEZO NENHLALAKAHLE',
    title: 'Isifo sangaphambi kwesikhathi (PMS):\nukusiqonda kangcono',
    metaDuration: 'Imizuzu emi-4 yokufunda',
    metaValidated: 'Okuphawulwe ngochwepheshe',
    intro:
      'I-PMS ithinta cishe abesifazane abayisi-8 kwabayi-10. Ukukhathala, ukucasuka, ukuvuvukala kwesisu… Ukuqonda izimbangela zayo nokulandela imikhuba efanele kungasithuthukisa kakhulu lesi sikhathi senyanga.',
    contentsTitle: 'Kulesi sihloko',
    contents: [
      'Iyini i-PMS?',
      'Izimpawu ezivamile',
      'Izimbangela ezingaba khona',
      'Amathiphu okuzizwa kangcono',
      'Isikhathi sokubona udokotela?',
    ],
    section1Body:
      'Isifo sangaphambi kwesikhathi sihlanganisa izimpawu zomzimba nezemizwa ezivame ukuvela izinsuku ezi-5 kuya kwezi-10 ngaphambi kwesikhathi sakho futhi zinyamalale ekuqaleni komjikelezo wokuya esikhathini.',
    visual1Title: 'Isigaba esihlobene nomjikelezo wakho',
    visual1Text:
      'Izimpawu zivela ngaphambi kwesikhathi sakho futhi imvamisa ziyaphela uma siqala.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text:
      'Amandla nohlobo lwezimpawu kungahluka kakhulu phakathi kwabesifazane, nasemjikelezweni oya komunye.',
    symptoms: [
      {title: 'Imizwa', text: 'Ukucasuka, ukukhathazeka, ukuzwa ubuhlungu enhliziyweni, ukushintshashintsha kwemizwa'},
      {title: 'Umzimba', text: 'Ukuvuvukala kwesisu, ubuhlungu, ukukhathala, ikhanda elihlungu'},
      {title: 'Ukuziphatha', text: 'Isifiso sezinto ezimnandi, izinguquko ekudleni, ukukhathala'},
      {title: 'Ukulala', text: 'Ubunzima bokulala noma ukulala okungaphumuli kahle'},
    ],
    section3Body:
      'Ukushintshashintsha kwamahomoni, ikakhulukazi i-progesterone ne-estrogen, kuthinta ama-neurotransmitter obuchopho (i-serotonin, i-dopamine), okungachaza izimpawu zemizwa nezomzimba ze-PMS.',
    tip2Title: 'Amahomoni abamba iqhaza elikhulu',
    tip2Text:
      'Ukushintshashintsha kwamahomoni kungathinta isimo sengqondo, amandla, ukulala nemizwa ethile yomzimba.',
    tips: [
      {title: 'Hlala unamanzi emzimbeni', text: 'Ukuphuza amanzi anele kusiza ukunciphisa ukuvuvukala kwesisu.'},
      {title: 'Dla ukudla okulinganiselayo', text: 'Khetha ukudla okunothile nge-magnesium, ama-omega-3 namavithamini e-B.'},
      {title: 'Hlala unyakaza', text: 'Ukuzivivinya komzimba kukhipha ama-endorphin futhi kunciphisa ukucindezeleka.'},
      {title: 'Phatha ukucindezeleka kwakho', text: 'Ukuvivinya ukuphefumula, ukucabanga ngokuthula, ukubhala ijenali… Thola lokho okukusebenzela.'},
      {title: 'Lala ngokwanele', text: 'Ukulala kahle kusekela ibhalansi yamahomoni.'},
    ],
    consultTitle: 'Kufanele ucele ukweluleka kodokotela nini?',
    consultText:
      'Uma izimpawu zinamandla kakhulu futhi zithinta impilo yakho yansuku zonke, kungaba yi-premenstrual dysphoric disorder (PMDD). Ungangabazi ukubonana nochwepheshe wezempilo.',
    shareMessage: 'Isifo sangaphambi kwesikhathi (PMS): ukusiqonda kangcono — AWA',
  },
  xh: {
    badge: 'UMJIKELO NEMPILO',
    title: 'I-syndrome yangaphambi kwexesha lenyanga (PMS):\nukuyiqonda ngcono',
    metaDuration: 'Imizuzu emi-4 yokufunda',
    metaValidated: 'Umxholo ohlaziyiweyo',
    intro:
      'I-PMS ichaphazela ukuya kumabhinqa ama-8 kwali-10. Ukudinwa, ukucaphuka, ukuqumba… Ukuqonda izizathu zayo nokwamkela izimilo ezifanelekileyo kunokuphucula kakhulu eli xesha lenyanga.',
    contentsTitle: 'Kweli nqaku',
    contents: [
      'Yintoni i-PMS?',
      'Iimpawu eziqhelekileyo',
      'Izizathu ezinokubakho',
      'Iingcebiso zokuziva ngcono',
      'Xa kufuneka ubone igqirha?',
    ],
    section1Body:
      'I-syndrome yangaphambi kwexesha lenyanga idibanisa iimpawu zomzimba neemvakalelo ezidla ngokuvela ngaphambi kweentsuku ezi-5 ukuya kwezi-10 zexesha lakho lenyanga kwaye ziphela ekuqaleni komjikelo wexesha lenyanga.',
    visual1Title: 'Inqanaba elinxulumene nomjikelo wakho',
    visual1Text:
      'Iimpawu ziyavela ngaphambi kwexesha lakho lenyanga kwaye zidla ngokuncipha ekuqaleni kwalo.',
    tip1Title: 'Kulungile ukwazi',
    tip1Text:
      'Ubukhulu nohlobo lweempawu zinokwahluka kakhulu phakathi komfazi nomnye, nakumjikelo nomnye.',
    symptoms: [
      {title: 'Iimvakalelo', text: 'Ukucaphuka, ukukhathazeka, ukudana, utshintsho lwemood'},
      {title: 'Zomzimba', text: 'Ukuqumba, ubuhlungu, ukudinwa, iintloko ezibuhlungu'},
      {title: 'Indlela yokuziphatha', text: 'Inkanuko yeswekile, utshintsho lwetakuxa kutyiwa, ukudinwa'},
      {title: 'Ukulala', text: 'Ubunzima bokulala okanye ukulala ngokungaphumli kakhulu'},
    ],
    section3Body:
      'Ukuguquguquka kwehomoni, ngakumbi kwi-progesterone ne-estrogen, kuchaphazela ii-neurotransmitters zobuchopho (serotonin, dopamine), nto leyo enokuchaza iimpawu zeemvakalelo nezomzimba ze-PMS.',
    tip2Title: 'Ihomoni zidlala indima ephambili',
    tip2Text:
      'Ukuguquguquka kwehomoni kunokuchaphazela imood, amandla, ukulala, neemvakalelo ezithile zomzimba.',
    tips: [
      {title: 'Hlala useze amanzi', text: 'Ukusela amanzi anele kunceda ukunciphisa ukuqumba.'},
      {title: 'Tya ukutya okulinganisiweyo', text: 'Khetha ukutya okuphezulu kwi-magnesium, i-omega-3, nee-vitamin B.'},
      {title: 'Hlala usebenza', text: 'Umsebenzi womzimba ukhulula ii-endorphins kwaye unciphisa uxinzelelo.'},
      {title: 'Lawula uxinzelelo lwakho', text: 'Imithambo yokuphefumla, ukucamngca, ukubhala ijenali… Fumana oko kukusebenzela.'},
      {title: 'Lala ngokwaneleyo', text: 'Ukulala okumgangatho ophezulu kuxhasa ukulingana kwehomoni.'},
    ],
    consultTitle: 'Xa kufuneka ucele icebiso lezonyango?',
    consultText:
      'Ukuba iimpawu zinkulu kakhulu kwaye zichaphazela ubomi bakho bemihla ngemihla, kunokuba yi-premenstrual dysphoric disorder (PMDD). Ungathandabuzi ukubonana nechwephesha lezempilo.',
    shareMessage: 'I-syndrome yangaphambi kwexesha lenyanga (PMS): ukuyiqonda ngcono — AWA',
  },
  sn: {
    badge: 'CYCLE & KUGARA ZVAKANAKA',
    title: 'Premenstrual syndrome (PMS):\nkuinzwisisa zvirinani',
    metaDuration: 'Maminitsi 4 ekuverenga',
    metaValidated: 'Zvakaongororwa',
    intro:
      'PMS inobata kusvika vakadzi 8 pane gumi. Kuneta, kutsamwa nekukurumidza, kuzvimba kwedumbu… Kunzwisisa zvinokonzera uye kutora maitiro akanaka kunogona kuvandudza zvikuru nguva iyi yemwedzi.',
    contentsTitle: 'Mudzidziso uyu',
    contents: [
      'PMS chii?',
      'Zviratidzo zvinowanzoitika',
      'Zvingakonzera',
      'Mazano ekunzwa zvirinani',
      'Painofanira kuona chiremba?',
    ],
    section1Body:
      'Premenstrual syndrome inounganidza zviratidzo zvemuviri nezvemanzwiro zvinowanzoonekwa mazuva 5 kusvika ku10 usatiwaenda kumwedzi uye zvinoenda pakutanga kwemenstrual cycle.',
    visual1Title: 'Nguva yakabatana ne cycle yako',
    visual1Text:
      'Zviratidzo zvinoonekwa usati waenda kumwedzi uye zvinowanzorerukira kana wasvika.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text:
      'Kusimba nemhando yezviratidzo zvinogona kusiyana zvikuru kubva kumukadzi kuenda kumukadzi, uye kubva pacycle imwe kuenda kune imwe.',
    symptoms: [
      {title: 'Manzwiro', text: 'Kutsamwa nekukurumidza, kunetseka, kusuruvara, shanduko dzemamood'},
      {title: 'Zvemuviri', text: 'Kuzvimba kwedumbu, marwadzo, kuneta, kurwadza musoro'},
      {title: 'Maitiro', text: 'Kuda zvinotapira, shanduko dzekudya, kuneta'},
      {title: 'Kurara', text: 'Kuoma kurara kana kurara kusingazorodzi'},
    ],
    section3Body:
      'Kusiyana kwehormone, kunyanya progesterone neestrogen, kunokanganisa neurotransmitters dzepfungwa (serotonin, dopamine), izvo zvinogona kutsanangura zviratidzo zvemanzwiro nezvemuviri zvePMS.',
    tip2Title: 'Hormone dzinoita basa guru',
    tip2Text:
      'Kusiyana kwehormone kunogona kukanganisa mood, simba, kurara uye mamwe manzwiro emuviri.',
    tips: [
      {title: 'Nwa mvura yakakwana', text: 'Kunwa mvura inokwana kunobatsira kudzikisa kuzvimba kwedumbu.'},
      {title: 'Dya zvakaringana', text: 'Sarudza zvokudya zvine magnesium, omega-3 nemavitamin B.'},
      {title: 'Garira uchifamba', text: 'Kuita ekisesaizi kunoburitsa endorphins uye kunoderedza kushushikana.'},
      {title: 'Bata kushushikana kwako', text: 'Maekisesaizi ekufema, kufungisisa, kunyora journal… Tsvaga icho chinokubatsira.'},
      {title: 'Rara zvakakwana', text: 'Kurara kwakanaka kunotsigira kuenzana kwehormone.'},
    ],
    consultTitle: 'Painofanira kutsvaga zano rekurapa?',
    consultText:
      'Kana zviratidzo zvakanyanya uye zvichikanganisa hupenyu hwako hwezuva nezuva, zvingava premenstrual dysphoric disorder (PMDD). Usazengurira kuonana nemushandi wezvehutano.',
    shareMessage: 'Premenstrual syndrome (PMS): kuinzwisisa zvirinani — AWA',
  },
  ln: {
    badge: 'CYCLE & BOLAMU',
    title: 'Bilembo liboso ya sanza (PMS):\nkoyeba yango malamu',
    metaDuration: 'Mwa mokapo ya kotánga: 4 min',
    metaValidated: 'Maloba etalelami',
    intro:
      'PMS esalaka likama na basi tii 8 na 10. Bolembu, nkanda ya noki, libumu etondi mopɛpɛ… Koyeba ntina na yango mpe kosala momeseno oyo ebongi ekoki kobongisa mingi ntango oyo ya sanza.',
    contentsTitle: 'Na lisolo oyo',
    contents: [
      'PMS ezali nini?',
      'Bilembo ya mbala mingi',
      'Bantina oyo ekoki kozala',
      'Toli mpo na komiyoka malamu',
      'Ntango nini kokende epai ya monganga?',
    ],
    section1Body:
      'PMS ezali liboke ya bilembo ya nzoto mpe ya motema oyo ebimaka mbala mingi mikolo 5 tii 10 liboso ya sanza na yo mpe esili na ebandeli ya cycle ya sanza.',
    visual1Title: 'Ntango oyo ekangami na cycle na yo',
    visual1Text:
      'Bilembo ebimaka liboso ya sanza na yo mpe mbala mingi ekitaka ntango sanza ebandi.',
    tip1Title: 'Eloko ya malamu koyeba',
    tip1Text:
      'Makasi mpe lolenge ya bilembo ekoki kokesena mingi uta mwasi na mwasi, mpe uta cycle na cycle.',
    symptoms: [
      {title: 'Mayoki ya motema', text: 'Nkanda ya noki, bobangi, mawa, bobongwani ya motema'},
      {title: 'Nzoto', text: 'Libumu etondi mopɛpɛ, mpasi, bolembu, mpasi ya motó'},
      {title: 'Momeseno', text: 'Mposa ya sukali, bobongwani ya mposa ya kolia, bolembu'},
      {title: 'Mpɔngi', text: 'Mpasi ya kolala mpɔngi to mpɔngi oyo epesaka malamu te'},
    ],
    section3Body:
      'Bobongwani ya ormɔne, mingi mingi ya progestérone mpe ya estrogène, esalaka likama na biloko ya ntɔngɔ ya mayele (serotonine, dopamine), oyo ekoki koyebisa bilembo ya motema mpe ya nzoto ya PMS.',
    tip2Title: 'Ormɔne ezali na mosala ya ntina',
    tip2Text:
      'Bobongwani ya ormɔne ekoki kosala likama na motema, makasi, mpɔngi mpe bamayoki mosusu ya nzoto.',
    tips: [
      {title: 'Komela mai', text: 'Komela mai ya kokoka esalisaka kokitisa libumu oyo etondi mopɛpɛ.'},
      {title: 'Lia bilei oyo ebongi', text: 'Pona bilei oyo ezali na magnezium, omega-3 mpe vitamine B.'},
      {title: 'Zala na mosala', text: 'Misala ya nzoto ebimisaka endorfine mpe ekitisaka mpiko ya motema.'},
      {title: 'Kokitisa mpiko ya motema', text: 'Kopema na ndenge ya mayele, kobondela motema, kokoma makanisi na yo… Luka oyo esalisaka yo.'},
      {title: 'Lala mpɔngi ya kokoka', text: 'Mpɔngi ya malamu esungaka kolinga ormɔne.'},
    ],
    consultTitle: 'Ntango nini osengeli kosenga toli ya monganga?',
    consultText:
      'Soki bilembo ezali makasi mingi mpe esali likama na bomoi na yo ya mokolo na mokolo, ekoki kozala PMDD (premenstrual dysphoric disorder). Kobanga te kokende epai ya mosali ya mayele.',
    shareMessage: 'Bilembo liboso ya sanza (PMS): koyeba yango malamu — AWA',
  },
  ff: {
    badge: 'CYCLE & ÑAWNDU',
    title: 'Premenstrual syndrome (PMS):\nfaamugo ɗum ɓuri',
    metaDuration: 'Janngugo 4 miniti',
    metaValidated: 'Ko ƴetti ndaarol',
    intro:
      'PMS sellan rewɓe haa 8 nder 10. Tiiɗɗam, ɓernde ɗaɓɓi, reedu ɗam… Faamugo sabaabuuji ɗin e ngaɗugo kuuɗe no haanani waawi wallugo no feewi nder wakkati ndu lebbi.',
    contentsTitle: 'Nder ɗerewol ndin',
    contents: [
      'Ko ɗum PMS?',
      'Alamaaji ɗi ngonnda',
      'Sabaabuuji ɗi ngonnda',
      'Anndinki ngam heɓugo ɓuri',
      'Saa ngoye ma ndaara doktoor?',
    ],
    section1Body:
      'Premenstrual syndrome ɗum ko alamaaji bandu e ɓernde ɗi feƴƴata ñalɗi 5 haa 10 adan menstruation maaɗa e ɗin ngaɗan ndeen menstruation fuɗɗi cycle.',
    visual1Title: 'Wakkati hawti e cycle maaɗa',
    visual1Text:
      'Alamaaji ɗin feƴƴan adan menstruation maaɗa e ɗin hoosnan saa ɗum fuɗɗi.',
    tip1Title: 'Ko mari njoɓdi',
    tip1Text:
      'Tiiɗɗam e leñol alamaaji ɗin waawi wayyude no feewi hakkunde debbo e debbo, e hakkunde cycle e cycle.',
    symptoms: [
      {title: 'Hakkilo', text: 'Ɓernde ɗaɓɓi, hulugo, tampere, wayrude hakkilo'},
      {title: 'Bandu', text: 'Reedu ɗam, muusi, tiiɗɗam, muusi hoore'},
      {title: 'Jikku', text: 'Yiɗde sukkar, wayrude yiɗde ñaamdu, tiiɗɗam'},
      {title: 'Ɗaanaago', text: 'Caɗeele ɗaanaago walla ɗaanaago hoosaaki'},
    ],
    section3Body:
      'Wayrude hormon, ko ɓuri progesterone e estrogen, sellan ko hoore hokkata habaru (serotonin, dopamine), ɗum waawi limtaago alamaaji ɓernde e bandu PMS.',
    tip2Title: 'Hormon mari kuugal mawndi',
    tip2Text:
      'Wayrude hormon waawi sellude hakkilo, semmbe, ɗaanaago e nanugo bandu goɗɗo.',
    tips: [
      {title: 'Yoɓ ndiyam no yiɗi', text: 'Yoɓugo ndiyam hanki wallan ɓuri reedu ɗam.'},
      {title: 'Ñaam ñaamdu hanaande', text: 'Suɓtu ñaamdu mari magnesium, omega-3 e vitamin B.'},
      {title: 'Hoɗu e yaadu', text: 'Yaadu bandu yaltina endorphin e hoosnan hakkilo.'},
      {title: 'Reentu hakkilo maaɗa', text: 'Fiilaaji heftugo hakkilo, meditation, winndugo ko nanii ma… Tawtu ko wallata ma.'},
      {title: 'Ɗaan no yiɗi', text: 'Ɗaanaago ngaɗaango no haanani wallan wayrude hormon.'},
    ],
    consultTitle: 'Saa ngoye ma ƴami muuyugo doktoor?',
    consultText:
      'Si alamaaji ɗin tiiɗi no feewi e ɗin haɗi ma ngaɗugo kuuɗe ñalnde kala, ɗum waawi laatugo premenstrual dysphoric disorder (PMDD). Taa hulu ndaarugo goɗɗo anndiiɗo.',
    shareMessage: 'Premenstrual syndrome (PMS): faamugo ɗum ɓuri — AWA',
  },
  id: {
    badge: 'SIKLUS & KESEJAHTERAAN',
    title: 'Sindrom pramenstruasi (PMS):\nmemahaminya dengan lebih baik',
    metaDuration: '4 menit baca',
    metaValidated: 'Konten telah ditinjau',
    intro: 'PMS dialami hingga 8 dari 10 perempuan. Lelah, mudah tersinggung, perut kembung… Memahami penyebabnya dan menerapkan kebiasaan yang tepat bisa sangat memperbaiki masa ini setiap bulannya.',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Apa itu PMS?',
      'Gejala yang umum',
      'Kemungkinan penyebab',
      'Tips agar lebih nyaman',
      'Kapan perlu ke dokter?',
    ],
    section1Body: 'Sindrom pramenstruasi mencakup gejala fisik dan emosional yang biasanya muncul 5 sampai 10 hari sebelum haid dan hilang saat siklus menstruasi dimulai.',
    visual1Title: 'Fase yang terkait dengan siklusmu',
    visual1Text: 'Gejala muncul sebelum haid dan biasanya mereda begitu haid dimulai.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Intensitas dan jenis gejala bisa sangat bervariasi dari satu perempuan ke perempuan lain, dan dari satu siklus ke siklus berikutnya.',
    symptoms: [
      {
        title: 'Emosi',
        text: 'Mudah tersinggung, cemas, sedih, suasana hati berubah-ubah',
      },
      {
        title: 'Fisik',
        text: 'Perut kembung, nyeri, lelah, sakit kepala',
      },
      {
        title: 'Perilaku',
        text: 'Ngidam makanan manis, nafsu makan berubah, lelah',
      },
      {
        title: 'Tidur',
        text: 'Sulit tidur atau tidur kurang nyenyak',
      },
    ],
    section3Body: 'Fluktuasi hormon, terutama progesteron dan estrogen, memengaruhi neurotransmiter di otak (serotonin, dopamin), yang mungkin menjelaskan gejala emosional dan fisik PMS.',
    tip2Title: 'Hormon berperan penting',
    tip2Text: 'Fluktuasi hormon dapat memengaruhi suasana hati, energi, tidur, dan sensasi fisik tertentu.',
    tips: [
      {
        title: 'Jaga asupan air',
        text: 'Minum air yang cukup membantu mengurangi perut kembung.',
      },
      {
        title: 'Makan seimbang',
        text: 'Pilih makanan kaya magnesium, omega-3, dan vitamin B.',
      },
      {
        title: 'Tetap aktif',
        text: 'Aktivitas fisik melepaskan endorfin dan mengurangi stres.',
      },
      {
        title: 'Kelola stresmu',
        text: 'Latihan pernapasan, meditasi, menulis jurnal… Temukan yang cocok untukmu.',
      },
      {
        title: 'Tidur cukup',
        text: 'Tidur berkualitas mendukung keseimbangan hormon.',
      },
    ],
    consultTitle: 'Kapan sebaiknya meminta saran medis?',
    consultText: 'Jika gejala sangat intens dan memengaruhi kehidupan sehari-harimu, bisa jadi itu gangguan disforia pramenstruasi (PMDD). Jangan ragu berkonsultasi dengan tenaga kesehatan.',
    shareMessage: 'Sindrom pramenstruasi (PMS): memahaminya dengan lebih baik — AWA',
  },
  hi: {
    badge: 'चक्र और सेहत',
    title: 'प्रीमेन्स्ट्रुअल सिंड्रोम (PMS):\nइसे बेहतर समझें',
    metaDuration: '4 मिनट में पढ़ें',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'PMS 10 में से 8 महिलाओं तक को प्रभावित करता है। थकान, चिड़चिड़ापन, पेट फूलना… इसके कारणों को समझना और सही आदतें अपनाना महीने के इस समय को काफ़ी बेहतर बना सकता है।',
    contentsTitle: 'इस लेख में',
    contents: [
      'PMS क्या है?',
      'आम लक्षण',
      'संभावित कारण',
      'बेहतर महसूस करने के सुझाव',
      'डॉक्टर को कब दिखाएँ?',
    ],
    section1Body: 'प्रीमेन्स्ट्रुअल सिंड्रोम में शारीरिक और भावनात्मक लक्षण शामिल होते हैं, जो आमतौर पर पीरियड से 5 से 10 दिन पहले शुरू होते हैं और मासिक चक्र की शुरुआत में ख़त्म हो जाते हैं।',
    visual1Title: 'आपके चक्र से जुड़ा एक चरण',
    visual1Text: 'लक्षण पीरियड से पहले दिखते हैं और उसके शुरू होने पर आमतौर पर कम हो जाते हैं।',
    tip1Title: 'जानने लायक बात',
    tip1Text: 'लक्षणों की तीव्रता और प्रकार एक महिला से दूसरी में, और एक चक्र से दूसरे चक्र में काफ़ी अलग हो सकते हैं।',
    symptoms: [
      {
        title: 'भावनाएँ',
        text: 'चिड़चिड़ापन, घबराहट, उदासी, मूड में उतार-चढ़ाव',
      },
      {
        title: 'शारीरिक',
        text: 'पेट फूलना, दर्द, थकान, सिरदर्द',
      },
      {
        title: 'व्यवहार',
        text: 'मीठा खाने की इच्छा, भूख में बदलाव, थकान',
      },
      {
        title: 'नींद',
        text: 'सोने में परेशानी या कम आरामदायक नींद',
      },
    ],
    section3Body: 'हार्मोन में उतार-चढ़ाव, खासकर प्रोजेस्टेरोन और एस्ट्रोजन में, दिमाग़ के न्यूरोट्रांसमीटर (सेरोटोनिन, डोपामाइन) को प्रभावित करते हैं, जो PMS के भावनात्मक और शारीरिक लक्षणों की वजह हो सकता है।',
    tip2Title: 'हार्मोन की अहम भूमिका',
    tip2Text: 'हार्मोन में उतार-चढ़ाव मूड, ऊर्जा, नींद और कुछ शारीरिक एहसासों को प्रभावित कर सकता है।',
    tips: [
      {
        title: 'पानी पीती रहें',
        text: 'पर्याप्त पानी पीने से पेट फूलना कम होता है।',
      },
      {
        title: 'संतुलित आहार लें',
        text: 'मैग्नीशियम, ओमेगा-3 और B विटामिन से भरपूर चीज़ों को प्राथमिकता दें।',
      },
      {
        title: 'सक्रिय रहें',
        text: 'शारीरिक गतिविधि से एंडॉर्फ़िन निकलते हैं और तनाव कम होता है।',
      },
      {
        title: 'तनाव को संभालें',
        text: 'साँस के व्यायाम, ध्यान, जर्नल लिखना… वह चुनें जो आपके लिए काम करे।',
      },
      {
        title: 'भरपूर नींद लें',
        text: 'अच्छी नींद हार्मोन के संतुलन में मदद करती है।',
      },
    ],
    consultTitle: 'डॉक्टर की सलाह कब लें?',
    consultText: 'अगर लक्षण बहुत तेज़ हों और आपकी रोज़मर्रा की ज़िंदगी पर असर डालें, तो यह प्रीमेन्स्ट्रुअल डिस्फ़ोरिक डिसऑर्डर (PMDD) हो सकता है। स्वास्थ्य विशेषज्ञ से मिलने में झिझकें नहीं।',
    shareMessage: 'प्रीमेन्स्ट्रुअल सिंड्रोम (PMS): इसे बेहतर समझें — AWA',
  },
  sq: {
    badge: 'CIKLI & MIREQENIA',
    title: 'Sindroma paramenstruale (PMS):\npër ta kuptuar më mirë',
    metaDuration: '4 min lexim',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'PMS prek deri në 8 nga 10 gra. Lodhje, nervozizëm, fryrje… Të kuptuarit e shkaqeve dhe zakonet e duhura mund ta përmirësojnë shumë këtë periudhë të muajit.',
    contentsTitle: 'Në këtë artikull',
    contents: [
      'Çfarë është PMS?',
      'Simptomat e zakonshme',
      'Shkaqet e mundshme',
      'Këshilla për t’u ndjerë më mirë',
      'Kur duhet të shkosh te mjeku?',
    ],
    section1Body: 'Sindroma paramenstruale bashkon simptoma fizike dhe emocionale që zakonisht shfaqen 5 deri në 10 ditë para menstruacioneve dhe kalojnë në fillim të ciklit menstrual.',
    visual1Title: 'Një fazë e lidhur me ciklin tënd',
    visual1Text: 'Simptomat shfaqen para menstruacioneve dhe zakonisht qetësohen sapo ato fillojnë.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Intensiteti dhe lloji i simptomave mund të ndryshojë shumë nga një grua te tjetra, dhe nga një cikël te tjetri.',
    symptoms: [
      {
        title: 'Emocionet',
        text: 'Nervozizëm, ankth, trishtim dhe ndryshime të humorit',
      },
      {
        title: 'Fizike',
        text: 'Fryrje, dhimbje, lodhje, dhimbje koke',
      },
      {
        title: 'Sjellja',
        text: 'Dëshirë për sheqerna, ndryshime në oreks, lodhje',
      },
      {
        title: 'Gjumi',
        text: 'Vështirësi për të fjetur ose gjumë më pak çlodhës',
      },
    ],
    section3Body: 'Luhatjet hormonale, sidomos të progesteronit dhe të estrogjenit, ndikojnë te neurotransmetuesit e trurit (serotonina, dopamina), gjë që mund t’i shpjegojë simptomat emocionale dhe fizike të PMS.',
    tip2Title: 'Hormonet luajnë një rol kyç',
    tip2Text: 'Luhatjet hormonale mund të ndikojnë në humor, energji, gjumë dhe disa ndjesi fizike.',
    tips: [
      {
        title: 'Hidratohu mirë',
        text: 'Të pirët e mjaftueshëm ujë ndihmon të zvogëlohet fryrja.',
      },
      {
        title: 'Ushqehu në mënyrë të ekuilibruar',
        text: 'Zgjidh ushqime të pasura me magnez, omega-3 dhe vitamina B.',
      },
      {
        title: 'Qëndro aktive',
        text: 'Aktiviteti fizik çliron endorfina dhe zvogëlon stresin.',
      },
      {
        title: 'Menaxho stresin',
        text: 'Ushtrime frymëmarrjeje, meditim, shkrim në ditar… Gjej çfarë funksionon për ty.',
      },
      {
        title: 'Fli sa duhet',
        text: 'Gjumi cilësor mbështet ekuilibrin hormonal.',
      },
    ],
    consultTitle: 'Kur duhet të kërkosh këshillë mjekësore?',
    consultText: 'Nëse simptomat janë shumë të forta dhe ndikojnë në jetën tënde të përditshme, mund të jetë çrregullimi disforik paramenstrual (PMDD). Mos ngurro të konsultohesh me një profesionist të shëndetësisë.',
    shareMessage: 'Sindroma paramenstruale (PMS): për ta kuptuar më mirë — AWA',
  },
  ja: {
    badge: '周期とウェルビーイング',
    title: '月経前症候群（PMS）：\nよりよく理解するために',
    metaDuration: '読了4分',
    metaValidated: '確認済みの内容',
    intro: 'PMSは女性の最大8割に見られます。疲れ、いらいら、むくみ…。原因を理解し、適切な習慣を取り入れることで、この時期をぐっと過ごしやすくできます。',
    contentsTitle: 'この記事の内容',
    contents: [
      'PMSとは？',
      'よくある症状',
      '考えられる原因',
      '楽に過ごすためのヒント',
      '医師に相談するのはいつ？',
    ],
    section1Body: '月経前症候群とは、生理の5〜10日前ごろから現れ、生理が始まると和らぐ、体と心のさまざまな症状の総称です。',
    visual1Title: '周期と結びついた時期',
    visual1Text: '症状は生理の前に現れ、生理が始まると通常は和らぎます。',
    tip1Title: '知っておきたいこと',
    tip1Text: '症状の強さや種類は、人によって、また周期ごとにも大きく異なることがあります。',
    symptoms: [
      {
        title: '気持ち',
        text: 'いらいら、不安、悲しみ、気分の波',
      },
      {
        title: '体',
        text: 'むくみ、痛み、疲れ、頭痛',
      },
      {
        title: '行動',
        text: '甘いものが欲しくなる、食欲の変化、疲れ',
      },
      {
        title: '睡眠',
        text: '眠りにくい、眠りが浅い',
      },
    ],
    section3Body: 'ホルモン、特にプロゲステロンとエストロゲンの変動が、脳内の神経伝達物質（セロトニン、ドーパミン）に影響を与えることが、PMSの心身の症状の一因と考えられます。',
    tip2Title: 'ホルモンが重要な役割を果たします',
    tip2Text: 'ホルモンの変動は、気分、エネルギー、睡眠、体の感覚に影響することがあります。',
    tips: [
      {
        title: '水分をしっかりとる',
        text: '十分に水を飲むと、むくみの軽減に役立ちます。',
      },
      {
        title: 'バランスのよい食事',
        text: 'マグネシウム、オメガ3、ビタミンB群を多く含む食品を選びましょう。',
      },
      {
        title: '体を動かす',
        text: '運動はエンドルフィンの分泌を促し、ストレスを和らげます。',
      },
      {
        title: 'ストレスと向き合う',
        text: '呼吸法、瞑想、日記…。自分に合う方法を見つけましょう。',
      },
      {
        title: 'しっかり眠る',
        text: '質のよい睡眠はホルモンバランスを支えます。',
      },
    ],
    consultTitle: '医師に相談したほうがよいのはどんなとき？',
    consultText: '症状が非常に強く、日常生活に支障が出る場合は、月経前不快気分障害（PMDD）の可能性があります。ためらわずに医療従事者に相談してください。',
    shareMessage: '月経前症候群（PMS）：よりよく理解するために — AWA',
  },
  ko: {
    badge: '주기와 웰빙',
    title: '월경 전 증후군(PMS):\n더 잘 이해하기',
    metaDuration: '읽는 데 4분',
    metaValidated: '검토된 콘텐츠',
    intro: 'PMS는 최대 10명 중 8명의 여성에게 나타나요. 피로, 짜증, 더부룩함… 원인을 이해하고 알맞은 습관을 들이면 이 시기를 훨씬 편안하게 보낼 수 있어요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    contents: [
      'PMS란 무엇인가요?',
      '흔한 증상',
      '가능한 원인',
      '한결 편안해지는 방법',
      '언제 의사를 만나야 할까요?',
    ],
    section1Body: '월경 전 증후군은 신체적, 정서적 증상이 함께 나타나는 것으로, 보통 생리 5~10일 전에 시작해서 생리 주기가 시작될 때 사라져요.',
    visual1Title: '주기와 이어진 시기',
    visual1Text: '증상은 생리 전에 나타나고, 생리가 시작되면 대개 가라앉아요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '증상의 강도와 종류는 사람마다, 그리고 주기마다 많이 다를 수 있어요.',
    symptoms: [
      {
        title: '감정',
        text: '짜증, 불안, 우울감, 감정 기복',
      },
      {
        title: '신체',
        text: '더부룩함, 통증, 피로, 두통',
      },
      {
        title: '행동',
        text: '단 음식이 당김, 식욕 변화, 피로',
      },
      {
        title: '수면',
        text: '잠들기 어렵거나 개운하지 않은 잠',
      },
    ],
    section3Body: '호르몬, 특히 프로게스테론과 에스트로겐의 변동이 뇌의 신경전달물질(세로토닌, 도파민)에 영향을 주기 때문에 PMS의 정서적, 신체적 증상이 나타날 수 있어요.',
    tip2Title: '호르몬이 중요한 역할을 해요',
    tip2Text: '호르몬 변동은 기분, 에너지, 수면, 그리고 몇몇 신체 감각에 영향을 줄 수 있어요.',
    tips: [
      {
        title: '수분 섭취하기',
        text: '물을 충분히 마시면 더부룩함을 줄이는 데 도움이 돼요.',
      },
      {
        title: '균형 잡힌 식사하기',
        text: '마그네슘, 오메가3, 비타민 B가 풍부한 음식을 챙겨 보세요.',
      },
      {
        title: '활동적으로 지내기',
        text: '신체 활동은 엔도르핀을 분비시키고 스트레스를 줄여 줘요.',
      },
      {
        title: '스트레스 관리하기',
        text: '호흡 운동, 명상, 일기 쓰기… 나에게 맞는 방법을 찾아보세요.',
      },
      {
        title: '충분히 자기',
        text: '질 좋은 수면은 호르몬 균형을 지켜 줘요.',
      },
    ],
    consultTitle: '언제 의료진의 조언을 받아야 할까요?',
    consultText: '증상이 매우 심하고 일상생활에 지장을 준다면 월경 전 불쾌 기분 장애(PMDD)일 수 있어요. 망설이지 말고 의료 전문가와 상담하세요.',
    shareMessage: '월경 전 증후군(PMS): 더 잘 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO E BEM-ESTAR',
    title: 'Síndrome pré-menstrual (SPM):\ncompreendê-la melhor',
    metaDuration: '4 min de leitura',
    metaValidated: 'Conteúdo revisto',
    intro: 'A SPM afeta até 8 em cada 10 mulheres. Cansaço, irritabilidade, inchaço… Compreender as suas causas e adotar os hábitos certos pode melhorar muito esta altura do mês.',
    contentsTitle: 'Neste artigo',
    contents: [
      'O que é a SPM?',
      'Sintomas frequentes',
      'Causas possíveis',
      'Dicas para se sentir melhor',
      'Quando consultar um médico?',
    ],
    section1Body: 'A síndrome pré-menstrual reúne sintomas físicos e emocionais que costumam surgir 5 a 10 dias antes do período e desaparecem no início do ciclo menstrual.',
    visual1Title: 'Uma fase ligada ao seu ciclo',
    visual1Text: 'Os sintomas surgem antes do período e costumam atenuar-se quando este começa.',
    tip1Title: 'Bom saber',
    tip1Text: 'A intensidade e o tipo de sintomas podem variar bastante de uma mulher para outra, e de um ciclo para o seguinte.',
    symptoms: [
      {
        title: 'Emoções',
        text: 'Irritabilidade, ansiedade, tristeza, oscilações de humor',
      },
      {
        title: 'Físicos',
        text: 'Inchaço, dor, cansaço, dores de cabeça',
      },
      {
        title: 'Comportamento',
        text: 'Desejo de doces, alterações do apetite, cansaço',
      },
      {
        title: 'Sono',
        text: 'Dificuldade em dormir ou sono menos reparador',
      },
    ],
    section3Body: 'As flutuações hormonais, em particular da progesterona e dos estrogénios, afetam os neurotransmissores do cérebro (serotonina, dopamina), o que pode explicar os sintomas emocionais e físicos da SPM.',
    tip2Title: 'As hormonas têm um papel importante',
    tip2Text: 'As flutuações hormonais podem afetar o humor, a energia, o sono e certas sensações físicas.',
    tips: [
      {
        title: 'Mantenha-se hidratada',
        text: 'Beber água suficiente ajuda a reduzir o inchaço.',
      },
      {
        title: 'Tenha uma alimentação equilibrada',
        text: 'Privilegie alimentos ricos em magnésio, ómega-3 e vitaminas do complexo B.',
      },
      {
        title: 'Mantenha-se ativa',
        text: 'A atividade física liberta endorfinas e reduz o stress.',
      },
      {
        title: 'Gira o seu stress',
        text: 'Exercícios de respiração, meditação, escrita num diário… Descubra o que resulta consigo.',
      },
      {
        title: 'Durma o suficiente',
        text: 'Um sono de qualidade favorece o equilíbrio hormonal.',
      },
    ],
    consultTitle: 'Quando procurar aconselhamento médico?',
    consultText: 'Se os sintomas forem muito intensos e afetarem o seu dia a dia, pode tratar-se de perturbação disfórica pré-menstrual (PDPM). Não hesite em consultar um profissional de saúde.',
    shareMessage: 'Síndrome pré-menstrual (SPM): compreendê-la melhor — AWA',
  },
  bn: {
    badge: 'চক্র ও সুস্থতা',
    title: 'মাসিকপূর্ব সিনড্রোম (পিএমএস):\nআরও ভালোভাবে বোঝা',
    metaDuration: 'পড়তে 4 মিনিট',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'পিএমএস প্রতি 10 জনে 8 জন পর্যন্ত নারীকে প্রভাবিত করে। ক্লান্তি, খিটখিটে ভাব, পেট ফাঁপা… এর কারণ বুঝে সঠিক অভ্যাস গড়ে তুললে মাসের এই সময়টা অনেক সহজ হতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    contents: [
      'পিএমএস কী?',
      'সাধারণ উপসর্গ',
      'সম্ভাব্য কারণ',
      'ভালো থাকার টিপস',
      'কখন ডাক্তার দেখাবেন?',
    ],
    section1Body: 'মাসিকপূর্ব সিনড্রোম হলো শারীরিক ও মানসিক উপসর্গের একটি সমষ্টি, যা সাধারণত মাসিকের 5 থেকে 10 দিন আগে দেখা দেয় এবং মাসিক চক্রের শুরুতে চলে যায়।',
    visual1Title: 'আপনার চক্রের সঙ্গে যুক্ত একটি পর্যায়',
    visual1Text: 'উপসর্গ মাসিকের আগে দেখা দেয় এবং মাসিক শুরু হলে সাধারণত কমে আসে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'উপসর্গের তীব্রতা ও ধরন এক নারী থেকে আরেক নারীর মধ্যে, এমনকি এক চক্র থেকে আরেক চক্রেও অনেক ভিন্ন হতে পারে।',
    symptoms: [
      {
        title: 'আবেগ',
        text: 'খিটখিটে ভাব, উদ্বেগ, বিষণ্নতা, মেজাজের ওঠানামা',
      },
      {
        title: 'শারীরিক',
        text: 'পেট ফাঁপা, ব্যথা, ক্লান্তি, মাথাব্যথা',
      },
      {
        title: 'আচরণ',
        text: 'মিষ্টি খাওয়ার তীব্র ইচ্ছা, ক্ষুধার পরিবর্তন, ক্লান্তি',
      },
      {
        title: 'ঘুম',
        text: 'ঘুমাতে অসুবিধা বা কম আরামদায়ক ঘুম',
      },
    ],
    section3Body: 'হরমোনের ওঠানামা, বিশেষ করে প্রজেস্টেরন ও ইস্ট্রোজেনের, মস্তিষ্কের নিউরোট্রান্সমিটারকে (সেরোটোনিন, ডোপামিন) প্রভাবিত করে, যা পিএমএসের মানসিক ও শারীরিক উপসর্গ ব্যাখ্যা করতে পারে।',
    tip2Title: 'হরমোনের ভূমিকা গুরুত্বপূর্ণ',
    tip2Text: 'হরমোনের ওঠানামা মেজাজ, শক্তি, ঘুম এবং কিছু শারীরিক অনুভূতিকে প্রভাবিত করতে পারে।',
    tips: [
      {
        title: 'পর্যাপ্ত পানি পান করুন',
        text: 'যথেষ্ট পানি পান করলে পেট ফাঁপা কমাতে সাহায্য হয়।',
      },
      {
        title: 'সুষম খাবার খান',
        text: 'ম্যাগনেসিয়াম, ওমেগা-3 ও বি ভিটামিনে সমৃদ্ধ খাবারকে অগ্রাধিকার দিন।',
      },
      {
        title: 'সক্রিয় থাকুন',
        text: 'শারীরিক কার্যকলাপ এন্ডোরফিন নিঃসরণ করে এবং চাপ কমায়।',
      },
      {
        title: 'মানসিক চাপ সামলান',
        text: 'শ্বাসের ব্যায়াম, ধ্যান, ডায়েরি লেখা… আপনার জন্য কোনটি কাজ করে তা খুঁজে নিন।',
      },
      {
        title: 'পর্যাপ্ত ঘুমান',
        text: 'ভালো মানের ঘুম হরমোনের ভারসাম্য বজায় রাখতে সহায়তা করে।',
      },
    ],
    consultTitle: 'কখন চিকিৎসকের পরামর্শ নেবেন?',
    consultText: 'উপসর্গ খুব তীব্র হলে এবং দৈনন্দিন জীবনে প্রভাব ফেললে এটি মাসিকপূর্ব ডিসফোরিক ডিসঅর্ডার (পিএমডিডি) হতে পারে। স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিতে দ্বিধা করবেন না।',
    shareMessage: 'মাসিকপূর্ব সিনড্রোম (পিএমএস): আরও ভালোভাবে বোঝা — AWA',
  },
  da: {
    badge: 'CYKLUS OG VELVÆRE',
    title: 'Præmenstruelt syndrom (PMS):\nforstå det bedre',
    metaDuration: '4 min læsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'PMS påvirker op til 8 ud af 10 kvinder. Træthed, irritabilitet, oppustethed… At forstå årsagerne og opbygge gode vaner kan gøre denne periode meget lettere.',
    contentsTitle: 'I denne artikel',
    contents: [
      'Hvad er PMS?',
      'Almindelige symptomer',
      'Mulige årsager',
      'Tips til at have det bedre',
      'Hvornår bør du søge læge?',
    ],
    section1Body: 'Præmenstruelt syndrom er en samling af fysiske og følelsesmæssige symptomer, der normalt opstår 5 til 10 dage inden menstruationen og forsvinder ved cyklussens begyndelse.',
    visual1Title: 'En fase forbundet med din cyklus',
    visual1Text: 'Symptomerne opstår inden menstruationen og aftager normalt, når den begynder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Symptomernes intensitet og art kan variere meget fra kvinde til kvinde og fra cyklus til cyklus.',
    symptoms: [
      {
        title: 'Følelsesmæssige',
        text: 'Irritabilitet, angst, nedtrykthed, humørsvingninger',
      },
      {
        title: 'Fysiske',
        text: 'Oppustethed, smerter, træthed, hovedpine',
      },
      {
        title: 'Adfærdsmæssige',
        text: 'Trang til søde sager, appetitændringer, træthed',
      },
      {
        title: 'Søvn',
        text: 'Søvnbesvær eller mindre afslappende søvn',
      },
    ],
    section3Body: 'Hormonelle udsving, især af progesteron og østrogen, påvirker hjernens neurotransmittere (serotonin, dopamin), hvilket kan forklare PMS\' følelsesmæssige og fysiske symptomer.',
    tip2Title: 'Hormonernes rolle er central',
    tip2Text: 'Hormonelle udsving kan påvirke humør, energi, søvn og visse fysiske fornemmelser.',
    tips: [
      {
        title: 'Hold dig hydreret',
        text: 'At drikke tilstrækkeligt vand hjælper med at reducere oppustethed.',
      },
      {
        title: 'Spis afbalanceret',
        text: 'Prioriter fødevarer rige på magnesium, omega-3 og B-vitaminer.',
      },
      {
        title: 'Vær aktiv',
        text: 'Fysisk aktivitet frigiver endorfiner og reducerer stress.',
      },
      {
        title: 'Håndter stress',
        text: 'Åndedrætsøvelser, meditation, dagbogsskrivning… Find det der virker for dig.',
      },
      {
        title: 'Sov nok',
        text: 'God søvnkvalitet hjælper med at holde hormonbalancen stabil.',
      },
    ],
    consultTitle: 'Hvornår bør du søge medicinsk rådgivning?',
    consultText: 'Hvis symptomerne er meget intense og påvirker dit daglige liv, kan det være præmenstruel dysforisk lidelse (PMDD). Tøv ikke med at kontakte en sundhedsfaglig person.',
    shareMessage: 'Præmenstruelt syndrom (PMS): forstå det bedre — AWA',
  },
  sv: {
    badge: 'CYKLUS OG VELVÄRE',
    title: 'Prämenstruelt syndrom (PMS):\nforstå det bedre',
    metaDuration: '4 min läsning',
    metaValidated: 'Gennemgået indhold',
    intro: 'PMS påvirker op till 8 ud av 10 kvinder. Träthed, irritabilitet, oppustethed… At forstå årsagerne och opbygge gode vaner kan göre denne periode mycket lettere.',
    contentsTitle: 'I denne artikel',
    contents: [
      'Hvad ar PMS?',
      'Almindelige symtom',
      'Mulige årsager',
      'Tips till at have det bedre',
      'Hvornår bör du söge läge?',
    ],
    section1Body: 'Prämenstruelt syndrom ar en samling av fysiske och fölelsesmässige symtom, der normalt opstår 5 till 10 dagar inden menstruationen och forsvinder ved cyklussens begyndelse.',
    visual1Title: 'En fase forbundet med din cyklus',
    visual1Text: 'Symtomne opstår inden menstruationen och aftager normalt, når den begynder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Symtomnes intensitet och art kan variere mycket fran kvinna till kvinna och fran cyklus till cyklus.',
    symptoms: [
      {
        title: 'Fölelsesmässige',
        text: 'Irritabilitet, angst, nedtrykthed, humörsvingninger',
      },
      {
        title: 'Fysiske',
        text: 'Oppustethed, smerter, träthed, hovedpine',
      },
      {
        title: 'Adfärdsmässige',
        text: 'Trang till söde sager, appetitändringer, träthed',
      },
      {
        title: 'Sövn',
        text: 'Sövnbesvär eller mindre afslappende sövn',
      },
    ],
    section3Body: 'Hormonelle udsving, isär av progesteron och östrogen, påvirker hjernens neurotransmittere (serotonin, dopamin), hvilket kan forklare PMS\' fölelsesmässige och fysiske symtom.',
    tip2Title: 'Hormonernes rolle ar central',
    tip2Text: 'Hormonelle udsving kan påvirke humör, energi, sövn och visse fysiske fornemmelser.',
    tips: [
      {
        title: 'Hold dig hydreret',
        text: 'At drikke tilsträkkeligt vand hjälper med at reducere oppustethed.',
      },
      {
        title: 'Spis afbalanceret',
        text: 'Prioriter födevarer rige på magnesium, omega-3 och B-vitaminer.',
      },
      {
        title: 'Vär aktiv',
        text: 'Fysisk aktivitet frigiver endorfiner och reducerer stress.',
      },
      {
        title: 'Håndter stress',
        text: 'Åndedrätsövelser, meditation, dagbogsskrivning… Find det der virker for dig.',
      },
      {
        title: 'Sov nok',
        text: 'God sövnkvalitet hjälper med at holde hormonbalancen stabil.',
      },
    ],
    consultTitle: 'Hvornår bör du söge medicinsk rådgivning?',
    consultText: 'Hvis symtomne ar mycket intense och påvirker ditt daglige liv, kan det väre prämenstruel dysforisk lidelse (PMDD). Töv inte med at kontakte en halsasfaglig person.',
    shareMessage: 'Prämenstruelt syndrom (PMS): forstå det bedre — AWA',
  },
  nb: {
    badge: 'SYKLUS OG VELVÆRE',
    title: 'Premenstruelt syndrom (PMS):\nforstå det bedre',
    metaDuration: '4 min lesing',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'PMS rammer opptil 8 av 10 kvinner. Tretthet, irritabilitet, oppblåsthet … Å forstå årsakene og ta i bruk de riktige vanene kan forbedre denne tiden av måneden betydelig.',
    contentsTitle: 'I denne artikkelen',
    contents: [
      'Hva er PMS?',
      'Vanlige symptomer',
      'Mulige årsaker',
      'Tips for å få det bedre',
      'Når bør du gå til lege?',
    ],
    section1Body:
      'Premenstruelt syndrom samler fysiske og følelsesmessige symptomer som vanligvis dukker opp 5 til 10 dager før mensen og forsvinner ved starten av menstruasjonssyklusen.',
    visual1Title: 'En fase knyttet til syklusen din',
    visual1Text:
      'Symptomene kommer før mensen og avtar vanligvis når den har startet.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Styrken og typen symptomer kan variere mye fra en kvinne til en annen, og fra en syklus til den neste.',
    symptoms: [
      {title: 'Følelser', text: 'Irritabilitet, angst, tristhet, humørsvingninger'},
      {title: 'Fysisk', text: 'Oppblåsthet, smerte, tretthet, hodepine'},
      {title: 'Atferd', text: 'Sukkersug, endringer i appetitt, tretthet'},
      {title: 'Søvn', text: 'Søvnproblemer eller mindre hvilsom søvn'},
    ],
    section3Body:
      'Hormonelle svingninger, særlig i progesteron og østrogen, påvirker signalstoffene i hjernen (serotonin, dopamin), noe som kan forklare de følelsesmessige og fysiske symptomene ved PMS.',
    tip2Title: 'Hormoner spiller en nøkkelrolle',
    tip2Text:
      'Hormonelle svingninger kan påvirke humør, energi, søvn og visse kroppslige fornemmelser.',
    tips: [
      {title: 'Drikk nok', text: 'Å drikke nok vann bidrar til å redusere oppblåsthet.'},
      {title: 'Spis et balansert kosthold', text: 'Prioriter mat rik på magnesium, omega-3 og B-vitaminer.'},
      {title: 'Hold deg aktiv', text: 'Fysisk aktivitet frigjør endorfiner og reduserer stress.'},
      {title: 'Håndter stresset ditt', text: 'Pusteøvelser, meditasjon, dagbok … Finn det som fungerer for deg.'},
      {title: 'Få nok søvn', text: 'God søvn støtter den hormonelle balansen.'},
    ],
    consultTitle: 'Når bør du søke medisinsk råd?',
    consultText:
      'Hvis symptomene er svært sterke og påvirker hverdagen din, kan det være premenstruell dysforisk lidelse (PMDD). Ikke nøl med å oppsøke helsepersonell.',
    shareMessage: 'Premenstruelt syndrom (PMS): forstå det bedre – AWA',
  },
  pl: {
    badge: 'CYKL I SAMOPOCZUCIE',
    title: 'Zespół napięcia przedmiesiączkowego (PMS):\nlepiej go zrozumieć',
    metaDuration: '4 min czytania',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'PMS dotyczy nawet 8 na 10 kobiet. Zmęczenie, drażliwość, wzdęcia… Zrozumienie jego przyczyn i dobre nawyki mogą znacznie poprawić ten czas w miesiącu.',
    contentsTitle: 'W tym artykule',
    contents: [
      'Czym jest PMS?',
      'Częste objawy',
      'Możliwe przyczyny',
      'Wskazówki na lepsze samopoczucie',
      'Kiedy zgłosić się do lekarza?',
    ],
    section1Body:
      'Zespół napięcia przedmiesiączkowego obejmuje objawy fizyczne i emocjonalne, które zwykle pojawiają się 5 do 10 dni przed miesiączką i ustępują na początku cyklu menstruacyjnego.',
    visual1Title: 'Faza związana z Twoim cyklem',
    visual1Text:
      'Objawy pojawiają się przed miesiączką i zwykle słabną, gdy się rozpocznie.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Nasilenie i rodzaj objawów mogą się bardzo różnić u poszczególnych kobiet oraz w kolejnych cyklach.',
    symptoms: [
      {title: 'Emocje', text: 'Drażliwość, lęk, smutek, wahania nastroju'},
      {title: 'Ciało', text: 'Wzdęcia, ból, zmęczenie, bóle głowy'},
      {title: 'Zachowanie', text: 'Ochota na słodycze, zmiany apetytu, zmęczenie'},
      {title: 'Sen', text: 'Trudności z zasypianiem lub mniej regenerujący sen'},
    ],
    section3Body:
      'Wahania hormonalne, zwłaszcza progesteronu i estrogenów, wpływają na neuroprzekaźniki w mózgu (serotonina, dopamina), co może tłumaczyć emocjonalne i fizyczne objawy PMS.',
    tip2Title: 'Hormony odgrywają kluczową rolę',
    tip2Text:
      'Wahania hormonalne mogą wpływać na nastrój, energię, sen i niektóre odczucia fizyczne.',
    tips: [
      {title: 'Dbaj o nawodnienie', text: 'Picie odpowiedniej ilości wody pomaga zmniejszyć wzdęcia.'},
      {title: 'Jedz zbilansowanie', text: 'Wybieraj produkty bogate w magnez, kwasy omega-3 i witaminy z grupy B.'},
      {title: 'Pozostań aktywna', text: 'Aktywność fizyczna uwalnia endorfiny i zmniejsza stres.'},
      {title: 'Radź sobie ze stresem', text: 'Ćwiczenia oddechowe, medytacja, dziennik… Znajdź to, co działa na Ciebie.'},
      {title: 'Śpij wystarczająco', text: 'Dobry sen wspiera równowagę hormonalną.'},
    ],
    consultTitle: 'Kiedy zasięgnąć porady lekarskiej?',
    consultText:
      'Jeśli objawy są bardzo nasilone i wpływają na codzienne życie, może to być przedmiesiączkowe zaburzenie dysforyczne (PMDD). Nie wahaj się skonsultować ze specjalistą.',
    shareMessage: 'Zespół napięcia przedmiesiączkowego (PMS): lepiej go zrozumieć — AWA',
  },
  uk: {
    badge: 'ЦИКЛ І САМОПОЧУТТЯ',
    title: 'Передменструальний синдром (ПМС):\nкраще його зрозуміти',
    metaDuration: '4 хв читання',
    metaValidated: 'Перевірений вміст',
    intro:
      'ПМС торкається до 8 із 10 жінок. Втома, дратівливість, здуття… Розуміння його причин і правильні звички можуть значно покращити цей час місяця.',
    contentsTitle: 'У цій статті',
    contents: [
      'Що таке ПМС?',
      'Поширені симптоми',
      'Можливі причини',
      'Поради для кращого самопочуття',
      'Коли звертатися до лікаря?',
    ],
    section1Body:
      'Передменструальний синдром поєднує фізичні та емоційні симптоми, що зазвичай з’являються за 5–10 днів до менструації й минають на початку менструального циклу.',
    visual1Title: 'Фаза, пов’язана з вашим циклом',
    visual1Text:
      'Симптоми з’являються перед менструацією і зазвичай слабшають, щойно вона починається.',
    tip1Title: 'Варто знати',
    tip1Text:
      'Інтенсивність і вид симптомів можуть сильно різнитися в різних жінок та в різних циклах.',
    symptoms: [
      {title: 'Емоції', text: 'Дратівливість, тривога, смуток, перепади настрою'},
      {title: 'Тіло', text: 'Здуття, біль, втома, головні болі'},
      {title: 'Поведінка', text: 'Тяга до солодкого, зміни апетиту, втома'},
      {title: 'Сон', text: 'Труднощі зі сном або менш відновлювальний сон'},
    ],
    section3Body:
      'Гормональні коливання, зокрема прогестерону та естрогену, впливають на нейромедіатори мозку (серотонін, дофамін), що може пояснювати емоційні та фізичні симптоми ПМС.',
    tip2Title: 'Гормони відіграють ключову роль',
    tip2Text:
      'Гормональні коливання можуть впливати на настрій, енергію, сон і деякі фізичні відчуття.',
    tips: [
      {title: 'Пийте достатньо води', text: 'Достатнє споживання води допомагає зменшити здуття.'},
      {title: 'Харчуйтеся збалансовано', text: 'Надавайте перевагу продуктам, багатим на магній, омега-3 та вітаміни групи B.'},
      {title: 'Залишайтеся активними', text: 'Фізична активність вивільняє ендорфіни й зменшує стрес.'},
      {title: 'Долайте стрес', text: 'Дихальні вправи, медитація, ведення щоденника… Знайдіть те, що підходить вам.'},
      {title: 'Спіть достатньо', text: 'Якісний сон підтримує гормональний баланс.'},
    ],
    consultTitle: 'Коли звертатися за медичною порадою?',
    consultText:
      'Якщо симптоми дуже інтенсивні й впливають на щоденне життя, це може бути передменструальний дисфоричний розлад (ПМДР). Не вагайтеся звернутися до медичного фахівця.',
    shareMessage: 'Передменструальний синдром (ПМС): краще його зрозуміти — AWA',
  },
  cs: {
    badge: 'CYKLUS A POHODA',
    title: 'Premenstruační syndrom (PMS):\nlepší porozumění',
    metaDuration: '4 min čtení',
    metaValidated: 'Ověřený obsah',
    intro:
      'PMS postihuje až 8 z 10 žen. Únava, podrážděnost, nadýmání… Pochopení jeho příčin a správné návyky mohou toto období měsíce výrazně zlepšit.',
    contentsTitle: 'V tomto článku',
    contents: [
      'Co je PMS?',
      'Časté příznaky',
      'Možné příčiny',
      'Tipy, jak se cítit lépe',
      'Kdy navštívit lékaře?',
    ],
    section1Body:
      'Premenstruační syndrom sdružuje tělesné a emoční příznaky, které se obvykle objevují 5 až 10 dní před menstruací a mizí na začátku menstruačního cyklu.',
    visual1Title: 'Fáze spojená s vaším cyklem',
    visual1Text:
      'Příznaky se objevují před menstruací a po jejím začátku obvykle ustupují.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Intenzita a druh příznaků se mohou od ženy k ženě i od cyklu k cyklu velmi lišit.',
    symptoms: [
      {title: 'Emoce', text: 'Podrážděnost, úzkost, smutek, výkyvy nálady'},
      {title: 'Tělesné', text: 'Nadýmání, bolest, únava, bolesti hlavy'},
      {title: 'Chování', text: 'Chuť na sladké, změny chuti k jídlu, únava'},
      {title: 'Spánek', text: 'Potíže se spánkem nebo méně odpočinkový spánek'},
    ],
    section3Body:
      'Hormonální výkyvy, zejména progesteronu a estrogenu, ovlivňují neurotransmitery v mozku (serotonin, dopamin), což může vysvětlovat emoční a tělesné příznaky PMS.',
    tip2Title: 'Hormony hrají klíčovou roli',
    tip2Text:
      'Hormonální výkyvy mohou ovlivňovat náladu, energii, spánek a některé tělesné pocity.',
    tips: [
      {title: 'Pijte dostatek tekutin', text: 'Dostatek vody pomáhá omezit nadýmání.'},
      {title: 'Jezte vyváženě', text: 'Upřednostněte potraviny bohaté na hořčík, omega-3 a vitaminy skupiny B.'},
      {title: 'Zůstaňte aktivní', text: 'Fyzická aktivita uvolňuje endorfiny a snižuje stres.'},
      {title: 'Zvládejte stres', text: 'Dechová cvičení, meditace, psaní deníku… Najděte, co vám vyhovuje.'},
      {title: 'Dopřejte si dostatek spánku', text: 'Kvalitní spánek podporuje hormonální rovnováhu.'},
    ],
    consultTitle: 'Kdy vyhledat lékařskou radu?',
    consultText:
      'Pokud jsou příznaky velmi intenzivní a ovlivňují váš každodenní život, může jít o premenstruační dysforickou poruchu (PMDD). Neváhejte se obrátit na zdravotnického pracovníka.',
    shareMessage: 'Premenstruační syndrom (PMS): lepší porozumění — AWA',
  },
  sk: {
    badge: 'CYKLUS A POHODA',
    title: 'Premenštruačný syndróm (PMS):\nlepšie ho pochopiť',
    metaDuration: '4 min čítania',
    metaValidated: 'Overený obsah',
    intro:
      'PMS postihuje až 8 z 10 žien. Únava, podráždenosť, nadúvanie… Pochopenie jeho príčin a správne návyky môžu toto obdobie mesiaca výrazne zlepšiť.',
    contentsTitle: 'V tomto článku',
    contents: [
      'Čo je PMS?',
      'Časté príznaky',
      'Možné príčiny',
      'Tipy, ako sa cítiť lepšie',
      'Kedy navštíviť lekára?',
    ],
    section1Body:
      'Premenštruačný syndróm združuje telesné a emočné príznaky, ktoré sa zvyčajne objavia 5 až 10 dní pred menštruáciou a ustúpia na začiatku menštruačného cyklu.',
    visual1Title: 'Fáza spojená s vaším cyklom',
    visual1Text:
      'Príznaky sa objavujú pred menštruáciou a zvyčajne ustupujú, keď sa začne.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Intenzita a druh príznakov sa môžu od ženy k žene a z cyklu na cyklus veľmi líšiť.',
    symptoms: [
      {title: 'Emócie', text: 'Podráždenosť, úzkosť, smútok, zmeny nálady'},
      {title: 'Telo', text: 'Nadúvanie, bolesť, únava, bolesti hlavy'},
      {title: 'Správanie', text: 'Chuť na sladké, zmeny chuti do jedla, únava'},
      {title: 'Spánok', text: 'Ťažkosti so spánkom alebo menej oddychový spánok'},
    ],
    section3Body:
      'Hormonálne kolísanie, najmä progesterónu a estrogénu, ovplyvňuje neurotransmitery v mozgu (serotonín, dopamín), čo môže vysvetľovať emočné a telesné príznaky PMS.',
    tip2Title: 'Hormóny hrajú kľúčovú úlohu',
    tip2Text:
      'Hormonálne kolísanie môže ovplyvniť náladu, energiu, spánok a niektoré telesné pocity.',
    tips: [
      {title: 'Pite dostatok tekutín', text: 'Dostatočné pitie vody pomáha znižovať nadúvanie.'},
      {title: 'Jedzte vyváženo', text: 'Uprednostnite potraviny bohaté na horčík, omega-3 a vitamíny skupiny B.'},
      {title: 'Zostaňte aktívna', text: 'Fyzická aktivita uvoľňuje endorfíny a znižuje stres.'},
      {title: 'Zvládajte stres', text: 'Dychové cvičenia, meditácia, písanie denníka… Nájdite, čo vám vyhovuje.'},
      {title: 'Dostatočne spite', text: 'Kvalitný spánok podporuje hormonálnu rovnováhu.'},
    ],
    consultTitle: 'Kedy vyhľadať lekársku radu?',
    consultText:
      'Ak sú príznaky veľmi intenzívne a ovplyvňujú váš každodenný život, môže ísť o premenštruačnú dysforickú poruchu (PMDD). Neváhajte sa poradiť so zdravotníckym pracovníkom.',
    shareMessage: 'Premenštruačný syndróm (PMS): lepšie ho pochopiť — AWA',
  },
  hu: {
    badge: 'CIKLUS ÉS JÓLÉT',
    title: 'Premenstruációs szindróma (PMS):\njobb megértése',
    metaDuration: '4 perc olvasás',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'A PMS a nők akár 8-ból 10-ét érinti. Fáradtság, ingerlékenység, puffadás… Az okainak megértése és a helyes szokások nagyban javíthatják a hónapnak ezt az időszakát.',
    contentsTitle: 'Ebben a cikkben',
    contents: [
      'Mi a PMS?',
      'Gyakori tünetek',
      'Lehetséges okok',
      'Tippek a jobb közérzethez',
      'Mikor menj orvoshoz?',
    ],
    section1Body:
      'A premenstruációs szindróma olyan testi és érzelmi tüneteket foglal össze, amelyek általában a menstruáció előtt 5–10 nappal jelentkeznek, és a menstruációs ciklus kezdetén elmúlnak.',
    visual1Title: 'A ciklusodhoz kötött szakasz',
    visual1Text:
      'A tünetek a menstruáció előtt jelentkeznek, és általában enyhülnek, amint elkezdődik.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'A tünetek erőssége és típusa nőnként és ciklusonként is nagyon eltérő lehet.',
    symptoms: [
      {title: 'Érzelmek', text: 'Ingerlékenység, szorongás, szomorúság, hangulatingadozás'},
      {title: 'Test', text: 'Puffadás, fájdalom, fáradtság, fejfájás'},
      {title: 'Viselkedés', text: 'Édesség utáni sóvárgás, étvágyváltozások, fáradtság'},
      {title: 'Alvás', text: 'Alvási nehézségek vagy kevésbé pihentető alvás'},
    ],
    section3Body:
      'A hormonális ingadozások, különösen a progeszteroné és az ösztrogéné, befolyásolják az agyi neurotranszmittereket (szerotonin, dopamin), ami megmagyarázhatja a PMS érzelmi és testi tüneteit.',
    tip2Title: 'A hormonok kulcsszerepet játszanak',
    tip2Text:
      'A hormonális ingadozások befolyásolhatják a hangulatot, az energiát, az alvást és bizonyos testi érzeteket.',
    tips: [
      {title: 'Igyál eleget', text: 'A megfelelő vízfogyasztás segít csökkenteni a puffadást.'},
      {title: 'Egyél kiegyensúlyozottan', text: 'Részesítsd előnyben a magnéziumban, omega-3-ban és B-vitaminokban gazdag ételeket.'},
      {title: 'Maradj aktív', text: 'A fizikai aktivitás endorfinokat szabadít fel, és csökkenti a stresszt.'},
      {title: 'Kezeld a stresszed', text: 'Légzőgyakorlatok, meditáció, naplóírás… Találd meg, mi működik nálad.'},
      {title: 'Aludj eleget', text: 'A minőségi alvás támogatja a hormonális egyensúlyt.'},
    ],
    consultTitle: 'Mikor kérj orvosi tanácsot?',
    consultText:
      'Ha a tünetek nagyon intenzívek és befolyásolják a mindennapi életedet, premenstruációs diszfóriás zavar (PMDD) is lehet. Ne habozz egészségügyi szakemberhez fordulni.',
    shareMessage: 'Premenstruációs szindróma (PMS): jobb megértése — AWA',
  },
  ro: {
    badge: 'CICLU ȘI BUNĂSTARE',
    title: 'Sindromul premenstrual (SPM):\nsă-l înțelegem mai bine',
    metaDuration: '4 min de citit',
    metaValidated: 'Conținut revizuit',
    intro:
      'SPM afectează până la 8 femei din 10. Oboseală, irascibilitate, balonare… Înțelegerea cauzelor lui și adoptarea obiceiurilor potrivite pot îmbunătăți mult această perioadă a lunii.',
    contentsTitle: 'În acest articol',
    contents: [
      'Ce este SPM?',
      'Simptome frecvente',
      'Cauze posibile',
      'Sfaturi pentru a te simți mai bine',
      'Când să mergi la medic?',
    ],
    section1Body:
      'Sindromul premenstrual reunește simptome fizice și emoționale care apar de obicei cu 5 până la 10 zile înainte de menstruație și dispar la începutul ciclului menstrual.',
    visual1Title: 'O fază legată de ciclul tău',
    visual1Text:
      'Simptomele apar înainte de menstruație și se ameliorează de obicei odată ce aceasta începe.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Intensitatea și tipul simptomelor pot varia mult de la o femeie la alta și de la un ciclu la altul.',
    symptoms: [
      {title: 'Emoții', text: 'Irascibilitate, anxietate, tristețe, schimbări de dispoziție'},
      {title: 'Fizic', text: 'Balonare, durere, oboseală, dureri de cap'},
      {title: 'Comportament', text: 'Poftă de dulce, schimbări ale apetitului, oboseală'},
      {title: 'Somn', text: 'Probleme de somn sau somn mai puțin odihnitor'},
    ],
    section3Body:
      'Fluctuațiile hormonale, în special ale progesteronului și estrogenului, afectează neurotransmițătorii din creier (serotonina, dopamina), ceea ce poate explica simptomele emoționale și fizice ale SPM.',
    tip2Title: 'Hormonii joacă un rol-cheie',
    tip2Text:
      'Fluctuațiile hormonale pot afecta starea de spirit, energia, somnul și anumite senzații fizice.',
    tips: [
      {title: 'Rămâi hidratată', text: 'Un consum suficient de apă ajută la reducerea balonării.'},
      {title: 'Mănâncă echilibrat', text: 'Favorizează alimentele bogate în magneziu, omega-3 și vitamine B.'},
      {title: 'Rămâi activă', text: 'Activitatea fizică eliberează endorfine și reduce stresul.'},
      {title: 'Gestionează-ți stresul', text: 'Exerciții de respirație, meditație, jurnal… Găsește ce funcționează pentru tine.'},
      {title: 'Dormi suficient', text: 'Un somn de calitate susține echilibrul hormonal.'},
    ],
    consultTitle: 'Când ar trebui să ceri un sfat medical?',
    consultText:
      'Dacă simptomele sunt foarte intense și îți afectează viața de zi cu zi, ar putea fi vorba de tulburarea disforică premenstruală (TDPM). Nu ezita să consulți un profesionist din domeniul sănătății.',
    shareMessage: 'Sindromul premenstrual (SPM): să-l înțelegem mai bine — AWA',
  },
  bg: {
    badge: 'ЦИКЪЛ И БЛАГОПОЛУЧИЕ',
    title: 'Предменструален синдром (ПМС):\nразбери го по-добре',
    metaDuration: '4 мин четене',
    metaValidated: 'Проверено съдържание',
    intro:
      'ПМС засяга до 8 от 10 жени. Умора, раздразнителност, подуване… Разбирането на причините му и подходящите навици могат значително да подобрят този период от месеца.',
    contentsTitle: 'В тази статия',
    contents: [
      'Какво е ПМС?',
      'Чести симптоми',
      'Възможни причини',
      'Съвети, за да се чувстваш по-добре',
      'Кога да посетиш лекар?',
    ],
    section1Body:
      'Предменструалният синдром обединява физически и емоционални симптоми, които обикновено се появяват 5 до 10 дни преди менструацията и отшумяват в началото на менструалния цикъл.',
    visual1Title: 'Фаза, свързана с цикъла ти',
    visual1Text:
      'Симптомите се появяват преди менструацията и обикновено отслабват, щом тя започне.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Интензивността и видът на симптомите могат да варират силно от жена на жена и от цикъл на цикъл.',
    symptoms: [
      {title: 'Емоции', text: 'Раздразнителност, тревожност, тъга, промени в настроението'},
      {title: 'Физически', text: 'Подуване, болка, умора, главоболие'},
      {title: 'Поведение', text: 'Желание за сладко, промени в апетита, умора'},
      {title: 'Сън', text: 'Затруднение със съня или по-малко пълноценен сън'},
    ],
    section3Body:
      'Хормоналните колебания, особено на прогестерона и естрогена, влияят на невротрансмитерите в мозъка (серотонин, допамин), което може да обясни емоционалните и физическите симптоми на ПМС.',
    tip2Title: 'Хормоните играят ключова роля',
    tip2Text:
      'Хормоналните колебания могат да влияят на настроението, енергията, съня и някои физически усещания.',
    tips: [
      {title: 'Пий достатъчно', text: 'Достатъчното пиене на вода помага да се намали подуването.'},
      {title: 'Яж балансирано', text: 'Предпочитай храни, богати на магнезий, омега-3 и витамини от група B.'},
      {title: 'Бъди активна', text: 'Физическата активност освобождава ендорфини и намалява стреса.'},
      {title: 'Управлявай стреса си', text: 'Дихателни упражнения, медитация, водене на дневник… Намери онова, което работи за теб.'},
      {title: 'Спи достатъчно', text: 'Качественият сън подпомага хормоналния баланс.'},
    ],
    consultTitle: 'Кога да потърсиш медицински съвет?',
    consultText:
      'Ако симптомите са много силни и засягат ежедневието ти, може да става дума за предменструално дисфорично разстройство (ПМДР). Не се колебай да се консултираш със здравен специалист.',
    shareMessage: 'Предменструален синдром (ПМС): разбери го по-добре — AWA',
  },
  sr: {
    badge: 'ЦИКЛУС И БЛАГОСТАЊЕ',
    title: 'Предменструални синдром (ПМС):\nразуми га боље',
    metaDuration: '4 мин читања',
    metaValidated: 'Проверен садржај',
    intro:
      'ПМС погађа до 8 од 10 жена. Умор, раздражљивост, надутост… Разумевање његових узрока и усвајање правих навика може знатно побољшати овај период месеца.',
    contentsTitle: 'У овом чланку',
    contents: [
      'Шта је ПМС?',
      'Чести симптоми',
      'Могући узроци',
      'Савети да се осећаш боље',
      'Када посетити лекара?',
    ],
    section1Body:
      'Предменструални синдром обједињује физичке и емоционалне симптоме који се обично појављују 5 до 10 дана пре менструације и нестају на почетку менструалног циклуса.',
    visual1Title: 'Фаза везана за твој циклус',
    visual1Text:
      'Симптоми се појављују пре менструације и обично јењавају чим она почне.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Интензитет и врста симптома могу увелико варирати од жене до жене и од циклуса до циклуса.',
    symptoms: [
      {title: 'Емоције', text: 'Раздражљивост, анксиозност, туга, промене расположења'},
      {title: 'Физички', text: 'Надутост, бол, умор, главобоља'},
      {title: 'Понашање', text: 'Жеља за сладким, промене апетита, умор'},
      {title: 'Сан', text: 'Тешкоће са спавањем или мање одморан сан'},
    ],
    section3Body:
      'Хормонске флуктуације, нарочито прогестерона и естрогена, утичу на невротрансмитере у мозгу (серотонин, допамин), што може објаснити емоционалне и физичке симптоме ПМС-а.',
    tip2Title: 'Хормони играју кључну улогу',
    tip2Text:
      'Хормонске флуктуације могу утицати на расположење, енергију, сан и одређена физичка осећања.',
    tips: [
      {title: 'Пиј довољно', text: 'Довољно пијење воде помаже да се смањи надутост.'},
      {title: 'Једи уравнотежено', text: 'Преферирај храну богату магнезијумом, омега-3 и витаминима групе B.'},
      {title: 'Буди активна', text: 'Физичка активност ослобађа ендорфине и смањује стрес.'},
      {title: 'Управљај стресом', text: 'Дихање, медитација, вођење дневника… Пронађи шта теби одговара.'},
      {title: 'Спавај довољно', text: 'Квалитетан сан подржава хормонску равнотежу.'},
    ],
    consultTitle: 'Када потражити медицински савет?',
    consultText:
      'Ако су симптоми веома јаки и утичу на твој свакодневни живот, може бити реч о предменструалном дисфоричном поремећају (ПМДП). Не оклевај да се консултујеш са здравственим радником.',
    shareMessage: 'Предменструални синдром (ПМС): разуми га боље — AWA',
  },
  hr: {
    badge: 'CIKLUS I DOBROBIT',
    title: 'Predmenstrualni sindrom (PMS):\nbolje ga razumjeti',
    metaDuration: '4 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'PMS pogađa do 8 od 10 žena. Umor, razdražljivost, nadutost… Razumijevanje uzroka i usvajanje pravih navika može uvelike poboljšati ovo razdoblje mjeseca.',
    contentsTitle: 'U ovom članku',
    contents: [
      'Što je PMS?',
      'Česti simptomi',
      'Mogući uzroci',
      'Savjeti za bolje osjećanje',
      'Kada posjetiti liječnika?',
    ],
    section1Body:
      'Predmenstrualni sindrom okuplja tjelesne i emocionalne simptome koji se obično pojavljuju 5 do 10 dana prije menstruacije i nestaju na početku menstrualnog ciklusa.',
    visual1Title: 'Faza povezana s tvojim ciklusom',
    visual1Text:
      'Simptomi se javljaju prije menstruacije i obično popuštaju kad ona počne.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Intenzitet i vrsta simptoma mogu se jako razlikovati od žene do žene i od ciklusa do ciklusa.',
    symptoms: [
      {title: 'Emocije', text: 'Razdražljivost, tjeskoba, tuga, promjene raspoloženja'},
      {title: 'Tjelesni', text: 'Nadutost, bol, umor, glavobolje'},
      {title: 'Ponašanje', text: 'Žudnja za šećerom, promjene apetita, umor'},
      {title: 'San', text: 'Poteškoće sa spavanjem ili manje odmoran san'},
    ],
    section3Body:
      'Hormonske fluktuacije, osobito progesterona i estrogena, utječu na neurotransmitere u mozgu (serotonin, dopamin), što može objasniti emocionalne i tjelesne simptome PMS-a.',
    tip2Title: 'Hormoni imaju ključnu ulogu',
    tip2Text:
      'Hormonske fluktuacije mogu utjecati na raspoloženje, energiju, san i određene tjelesne osjećaje.',
    tips: [
      {title: 'Ostani hidrirana', text: 'Dovoljno pijenje vode pomaže smanjiti nadutost.'},
      {title: 'Jedi uravnoteženo', text: 'Daj prednost namirnicama bogatima magnezijem, omega-3 masnim kiselinama i vitaminima B.'},
      {title: 'Ostani aktivna', text: 'Tjelesna aktivnost oslobađa endorfine i smanjuje stres.'},
      {title: 'Upravljaj stresom', text: 'Vježbe disanja, meditacija, pisanje dnevnika… Pronađi što ti odgovara.'},
      {title: 'Spavaj dovoljno', text: 'Kvalitetan san podupire hormonsku ravnotežu.'},
    ],
    consultTitle: 'Kada zatražiti liječnički savjet?',
    consultText:
      'Ako su simptomi vrlo intenzivni i utječu na tvoj svakodnevni život, može biti riječ o predmenstrualnom disforičnom poremećaju (PMDD). Ne oklijevaj posavjetovati se sa zdravstvenim djelatnikom.',
    shareMessage: 'Predmenstrualni sindrom (PMS): bolje ga razumjeti — AWA',
  },
  bs: {
    badge: 'CIKLUS I DOBROBIT',
    title: 'Predmenstrualni sindrom (PMS):\nbolje ga razumjeti',
    metaDuration: '4 min čitanja',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'PMS pogađa do 8 od 10 žena. Umor, razdražljivost, nadutost… Razumijevanje uzroka i usvajanje pravih navika može uvelike poboljšati ovo razdoblje mjeseca.',
    contentsTitle: 'U ovom članku',
    contents: [
      'Što je PMS?',
      'Česti simptomi',
      'Mogući uzroci',
      'Savjeti za bolje osjećanje',
      'Kada posjetiti ljekara?',
    ],
    section1Body:
      'Predmenstrualni sindrom okuplja tjelesne i emocionalne simptome koji se obično pojavljuju 5 do 10 dana prije menstruacije i nestaju na početku menstrualnog ciklusa.',
    visual1Title: 'Faza povezana s tvojim ciklusom',
    visual1Text:
      'Simptomi se javljaju prije menstruacije i obično popuštaju kad ona počne.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Intenzitet i vrsta simptoma mogu se jako razlikovati od žene do žene i od ciklusa do ciklusa.',
    symptoms: [
      {title: 'Emocije', text: 'Razdražljivost, tjeskoba, tuga, promjene raspoloženja'},
      {title: 'Tjelesni', text: 'Nadutost, bol, umor, glavobolje'},
      {title: 'Ponašanje', text: 'Žudnja za šećerom, promjene apetita, umor'},
      {title: 'San', text: 'Poteškoće sa spavanjem ili manje odmoran san'},
    ],
    section3Body:
      'Hormonske fluktuacije, osobito progesterona i estrogena, utječu na neurotransmitere u mozgu (serotonin, dopamin), što može objasniti emocionalne i tjelesne simptome PMS-a.',
    tip2Title: 'Hormoni imaju ključnu ulogu',
    tip2Text:
      'Hormonske fluktuacije mogu utjecati na raspoloženje, energiju, san i određene tjelesne osjećaje.',
    tips: [
      {title: 'Ostani hidrirana', text: 'Dovoljno pijenje vode pomaže smanjiti nadutost.'},
      {title: 'Jedi uravnoteženo', text: 'Daj prednost namirnicama bogatima magnezijem, omega-3 masnim kiselinama i vitaminima B.'},
      {title: 'Ostani aktivna', text: 'Tjelesna aktivnost oslobađa endorfine i smanjuje stres.'},
      {title: 'Upravljaj stresom', text: 'Vježbe disanja, meditacija, pisanje dnevnika… Pronađi što ti odgovara.'},
      {title: 'Spavaj dovoljno', text: 'Kvalitetan san podupire hormonsku ravnotežu.'},
    ],
    consultTitle: 'Kada zatražiti ljekarski savjet?',
    consultText:
      'Ako su simptomi vrlo intenzivni i utječu na tvoj svakodnevni život, može biti riječ o predmenstrualnom disforičnom poremećaju (PMDD). Ne oklijevaj posavjetovati se sa zdravstvenim radnikom.',
    shareMessage: 'Predmenstrualni sindrom (PMS): bolje ga razumjeti — AWA',
  },
  sl: {
    badge: 'CIKEL IN DOBRO POČUTJE',
    title: 'Predmenstrualni sindrom (PMS):\nbolje ga razumeti',
    metaDuration: '4 min branja',
    metaValidated: 'Preverjena vsebina',
    intro:
      'PMS prizadene do 8 od 10 žensk. Utrujenost, razdražljivost, napihnjenost… Razumevanje vzrokov in privzgojitev pravih navad lahko močno izboljša to obdobje meseca.',
    contentsTitle: 'V tem članku',
    contents: [
      'Kaj je PMS?',
      'Pogosti simptomi',
      'Možni vzroki',
      'Nasveti za boljše počutje',
      'Kdaj obiskati zdravnika?',
    ],
    section1Body:
      'Predmenstrualni sindrom združuje telesne in čustvene simptome, ki se običajno pojavijo 5 do 10 dni pred menstruacijo in izginejo na začetku menstrualnega cikla.',
    visual1Title: 'Faza, povezana s tvojim ciklom',
    visual1Text:
      'Simptomi se pojavijo pred menstruacijo in običajno popustijo, ko se ta začne.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Intenzivnost in vrsta simptomov se lahko močno razlikujeta od ženske do ženske in od cikla do cikla.',
    symptoms: [
      {title: 'Čustva', text: 'Razdražljivost, tesnoba, žalost, spremembe razpoloženja'},
      {title: 'Telesni', text: 'Napihnjenost, bolečina, utrujenost, glavoboli'},
      {title: 'Vedenje', text: 'Hrepenenje po sladkem, spremembe apetita, utrujenost'},
      {title: 'Spanje', text: 'Težave s spanjem ali manj počitka vreden spanec'},
    ],
    section3Body:
      'Hormonska nihanja, zlasti progesterona in estrogena, vplivajo na nevrotransmiterje v možganih (serotonin, dopamin), kar lahko pojasni čustvene in telesne simptome PMS.',
    tip2Title: 'Hormoni imajo ključno vlogo',
    tip2Text:
      'Hormonska nihanja lahko vplivajo na razpoloženje, energijo, spanje in določene telesne občutke.',
    tips: [
      {title: 'Ostani hidrirana', text: 'Dovolj pitja vode pomaga zmanjšati napihnjenost.'},
      {title: 'Jej uravnoteženo', text: 'Daj prednost živilom, bogatim z magnezijem, omega-3 maščobnimi kislinami in vitamini B.'},
      {title: 'Ostani aktivna', text: 'Telesna dejavnost sprošča endorfine in zmanjšuje stres.'},
      {title: 'Obvladuj stres', text: 'Vaje dihanja, meditacija, pisanje dnevnika… Poišči, kaj ti ustreza.'},
      {title: 'Spi dovolj', text: 'Kakovosten spanec podpira hormonsko ravnovesje.'},
    ],
    consultTitle: 'Kdaj poiskati zdravniški nasvet?',
    consultText:
      'Če so simptomi zelo intenzivni in vplivajo na tvoje vsakdanje življenje, gre lahko za predmenstrualno disforično motnjo (PMDD). Ne oklevaj posvetovati se z zdravstvenim delavcem.',
    shareMessage: 'Predmenstrualni sindrom (PMS): bolje ga razumeti — AWA',
  },
  ne: {
    badge: 'चक्र र भलाइ',
    title: 'महिनावारीपूर्वको सिन्ड्रोम (PMS):\nराम्ररी बुझ्नुहोस्',
    metaDuration: '4 मिनेट पढाइ',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'PMS ले 10 मध्ये 8 जना महिलालाई असर गर्न सक्छ। थकान, चिडचिडाहट, पेट फुल्ने… यसका कारणहरू बुझ्नु र सही बानी अपनाउनुले महिनाको यो समयलाई निकै सुधार्न सक्छ।',
    contentsTitle: 'यो लेखमा',
    contents: [
      'PMS के हो?',
      'सामान्य लक्षणहरू',
      'सम्भावित कारणहरू',
      'राम्रो महसुस गर्ने सुझावहरू',
      'चिकित्सकलाई कहिले देखाउने?',
    ],
    section1Body:
      'महिनावारीपूर्वको सिन्ड्रोमले शारीरिक र भावनात्मक लक्षणहरू जम्मा गर्छ जुन सामान्यतया तपाईंको महिनावारी आउनुभन्दा 5 देखि 10 दिनअघि देखिन्छन् र मासिक चक्रको सुरुमा हराउँछन्।',
    visual1Title: 'तपाईंको चक्रसँग जोडिएको एउटा चरण',
    visual1Text:
      'लक्षणहरू महिनावारीअघि देखिन्छन् र सामान्यतया यो सुरु भएपछि हल्का हुन्छन्।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'लक्षणहरूको तीव्रता र प्रकार एक महिलादेखि अर्कोमा, र एक चक्रदेखि अर्कोमा निकै फरक हुन सक्छ।',
    symptoms: [
      {title: 'भावनाहरू', text: 'चिडचिडाहट, चिन्ता, उदासी, मनोदशाको उतारचढाव'},
      {title: 'शारीरिक', text: 'पेट फुल्ने, दुखाइ, थकान, टाउको दुखाइ'},
      {title: 'व्यवहार', text: 'गुलियो खाने चाहना, भोकमा परिवर्तन, थकान'},
      {title: 'निद्रा', text: 'निदाउन गाह्रो वा कम आरामदायी निद्रा'},
    ],
    section3Body:
      'हर्मोनल उतारचढाव, विशेष गरी प्रोजेस्टेरोन र एस्ट्रोजेनमा, ले मस्तिष्कका न्यूरोट्रान्समिटर (सेरोटोनिन, डोपामिन) लाई असर गर्छ, जसले PMS का भावनात्मक र शारीरिक लक्षणहरू व्याख्या गर्न सक्छ।',
    tip2Title: 'हर्मोनहरूले मुख्य भूमिका खेल्छन्',
    tip2Text:
      'हर्मोनल उतारचढावले मनोदशा, ऊर्जा, निद्रा र केही शारीरिक अनुभूतिहरूलाई असर गर्न सक्छ।',
    tips: [
      {title: 'पर्याप्त पानी पिउनुहोस्', text: 'पर्याप्त पानी पिउनाले पेट फुल्ने कम गर्न मद्दत गर्छ।'},
      {title: 'सन्तुलित खानपान गर्नुहोस्', text: 'म्याग्नेसियम, ओमेगा-3 र बी भिटामिन भरपूर खानेकुरालाई प्राथमिकता दिनुहोस्।'},
      {title: 'सक्रिय रहनुहोस्', text: 'शारीरिक गतिविधिले एन्डोर्फिन निकाल्छ र तनाव घटाउँछ।'},
      {title: 'आफ्नो तनाव व्यवस्थापन गर्नुहोस्', text: 'सास फेर्ने व्यायाम, ध्यान, डायरी लेखन… तपाईंलाई के काम लाग्छ पत्ता लगाउनुहोस्।'},
      {title: 'पर्याप्त निद्रा लिनुहोस्', text: 'गुणस्तरीय निद्राले हर्मोनल सन्तुलनलाई साथ दिन्छ।'},
    ],
    consultTitle: 'चिकित्सकीय सल्लाह कहिले लिनुपर्छ?',
    consultText:
      'लक्षणहरू निकै तीव्र छन् र तपाईंको दैनिक जीवनलाई असर गर्छन् भने, यो महिनावारीपूर्वको डिस्फोरिक डिसअर्डर (PMDD) हुन सक्छ। स्वास्थ्यकर्मीसँग परामर्श गर्न नहिच्किचाउनुहोस्।',
    shareMessage: 'महिनावारीपूर्वको सिन्ड्रोम (PMS): राम्ररी बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'චක්‍රය සහ යහපැවැත්ම',
    title: 'ඔසප්වලට පෙර සහලක්ෂණය (PMS):\nවඩා හොඳින් තේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 4',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'PMS කාන්තාවන් 10න් 8ක් දක්වා බලපායි. වෙහෙස, කෝපශීලී බව, බඩ ඉදිමීම… එහි හේතු තේරුම් ගැනීම සහ නිවැරදි පුරුදු අනුගමනය කිරීම මාසයේ මෙම කාලය බොහෝ සේ වැඩිදියුණු කළ හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    contents: [
      'PMS යනු කුමක්ද?',
      'පොදු රෝග ලක්ෂණ',
      'ඇතිවිය හැකි හේතු',
      'වඩා හොඳින් දැනීමට ඉඟි',
      'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද?',
    ],
    section1Body:
      'ඔසප්වලට පෙර සහලක්ෂණය සාමාන්‍යයෙන් ඔබේ ඔසප්වලට දින 5 සිට 10 දක්වා කලින් දිස්වන සහ ඔසප් චක්‍රය ආරම්භයේදී පහව යන ශාරීරික සහ චිත්තවේගී රෝග ලක්ෂණ එකට ගෙන එයි.',
    visual1Title: 'ඔබේ චක්‍රයට බැඳුණු අවධියක්',
    visual1Text:
      'රෝග ලක්ෂණ ඔබේ ඔසප්වලට පෙර දිස්වන අතර එය ආරම්භ වූ පසු සාමාන්‍යයෙන් සමනය වේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'රෝග ලක්ෂණවල තීව්‍රතාව සහ වර්ගය කාන්තාවකගෙන් තවත් කාන්තාවකට සහ චක්‍රයෙන් චක්‍රයට බොහෝ සේ වෙනස් විය හැක.',
    symptoms: [
      {title: 'චිත්තවේග', text: 'කෝපශීලී බව, කනස්සල්ල, දුක, මනෝභාව උච්චාවචනය'},
      {title: 'ශාරීරික', text: 'බඩ ඉදිමීම, වේදනාව, වෙහෙස, හිසරදය'},
      {title: 'හැසිරීම', text: 'සීනි ආශාව, ආහාර රුචියේ වෙනස්කම්, වෙහෙස'},
      {title: 'නින්ද', text: 'නිදාගැනීමේ අපහසුව හෝ අඩු සැහැල්ලු නින්ද'},
    ],
    section3Body:
      'හෝමෝන උච්චාවචනය, විශේෂයෙන් ප්‍රොජෙස්ටරෝන් සහ එස්ට්‍රජන්, මොළයේ ස්නායු සම්ප්‍රේෂකවලට (සෙරොටොනින්, ඩොපමින්) බලපායි, එය PMS හි චිත්තවේගී සහ ශාරීරික රෝග ලක්ෂණ පැහැදිලි කළ හැක.',
    tip2Title: 'හෝමෝන ප්‍රධාන කාර්යභාරයක් ඉටු කරයි',
    tip2Text:
      'හෝමෝන උච්චාවචනය මනෝභාවයට, ශක්තියට, නින්දට සහ සමහර ශාරීරික සංවේදනයන්ට බලපෑ හැක.',
    tips: [
      {title: 'ජලය පානය කර සිටින්න', text: 'ප්‍රමාණවත් ජලය පානය කිරීම බඩ ඉදිමීම අඩු කිරීමට උපකාරී වේ.'},
      {title: 'සමතුලිත ආහාර වේලක් අනුභව කරන්න', text: 'මැග්නීසියම්, ඔමේගා-3 සහ B විටමින් බහුල ආහාරවලට ප්‍රමුඛත්වය දෙන්න.'},
      {title: 'ක්‍රියාශීලීව සිටින්න', text: 'ශාරීරික ක්‍රියාකාරකම එන්ඩෝෆින් මුදා හරින අතර ආතතිය අඩු කරයි.'},
      {title: 'ඔබේ ආතතිය කළමනාකරණය කරන්න', text: 'හුස්ම ගැනීමේ ව්‍යායාම, භාවනාව, දිනපොත් ලිවීම… ඔබට ගැළපෙන දේ සොයාගන්න.'},
      {title: 'ප්‍රමාණවත් නින්ද ගන්න', text: 'ගුණාත්මක නින්ද හෝමෝන සමතුලිතතාවට සහාය වේ.'},
    ],
    consultTitle: 'ඔබ වෛද්‍ය උපදෙස් ලබාගත යුත්තේ කවදාද?',
    consultText:
      'රෝග ලක්ෂණ ඉතා දැඩි වී ඔබේ එදිනෙදා ජීවිතයට බලපාන්නේ නම්, එය ඔසප්වලට පෙර ඩිස්ෆොරික් ආබාධය (PMDD) විය හැක. සෞඛ්‍ය වෘත්තිකයෙකු හමුවීමට මැළි නොවන්න.',
    shareMessage: 'ඔසප්වලට පෙර සහලක්ෂණය (PMS): වඩා හොඳින් තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'รอบเดือนและความเป็นอยู่ที่ดี',
    title: 'กลุ่มอาการก่อนมีประจำเดือน (PMS):\nทำความเข้าใจให้ดียิ่งขึ้น',
    metaDuration: 'อ่าน 4 นาที',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'PMS เกิดกับผู้หญิงถึง 8 ใน 10 คน ความเหนื่อยล้า ความหงุดหงิด ท้องอืด… การเข้าใจสาเหตุและมีนิสัยที่เหมาะสมช่วยให้ช่วงเวลานี้ของเดือนดีขึ้นมาก',
    contentsTitle: 'ในบทความนี้',
    contents: [
      'PMS คืออะไร?',
      'อาการที่พบบ่อย',
      'สาเหตุที่เป็นไปได้',
      'เคล็ดลับเพื่อให้รู้สึกดีขึ้น',
      'เมื่อไรควรพบแพทย์?',
    ],
    section1Body:
      'กลุ่มอาการก่อนมีประจำเดือนรวมอาการทางกายและทางอารมณ์ที่มักปรากฏ 5 ถึง 10 วันก่อนมีประจำเดือน และหายไปเมื่อเริ่มรอบเดือน',
    visual1Title: 'ระยะที่เชื่อมโยงกับรอบเดือนของคุณ',
    visual1Text:
      'อาการปรากฏก่อนมีประจำเดือนและมักบรรเทาเมื่อเริ่มมา',
    tip1Title: 'ควรรู้',
    tip1Text:
      'ความรุนแรงและประเภทของอาการแตกต่างกันมากในผู้หญิงแต่ละคน และในแต่ละรอบเดือน',
    symptoms: [
      {title: 'อารมณ์', text: 'หงุดหงิด วิตกกังวล เศร้า อารมณ์แปรปรวน'},
      {title: 'ร่างกาย', text: 'ท้องอืด ปวด เหนื่อยล้า ปวดหัว'},
      {title: 'พฤติกรรม', text: 'อยากกินของหวาน ความอยากอาหารเปลี่ยน เหนื่อยล้า'},
      {title: 'การนอน', text: 'นอนหลับยากหรือหลับไม่สนิท'},
    ],
    section3Body:
      'ความผันผวนของฮอร์โมน โดยเฉพาะโปรเจสเตอโรนและเอสโตรเจน ส่งผลต่อสารสื่อประสาทในสมอง (เซโรโทนิน โดพามีน) ซึ่งอาจอธิบายอาการทางอารมณ์และทางกายของ PMS',
    tip2Title: 'ฮอร์โมนมีบทบาทสำคัญ',
    tip2Text:
      'ความผันผวนของฮอร์โมนอาจส่งผลต่ออารมณ์ พลังงาน การนอนหลับ และความรู้สึกทางกายบางอย่าง',
    tips: [
      {title: 'ดื่มน้ำให้เพียงพอ', text: 'การดื่มน้ำให้เพียงพอช่วยลดอาการท้องอืด'},
      {title: 'กินอาหารที่สมดุล', text: 'เลือกอาหารที่อุดมด้วยแมกนีเซียม โอเมก้า-3 และวิตามินบี'},
      {title: 'ขยับร่างกาย', text: 'กิจกรรมทางกายหลั่งเอนดอร์ฟินและลดความเครียด'},
      {title: 'จัดการความเครียด', text: 'การฝึกหายใจ การทำสมาธิ การเขียนบันทึก… หาสิ่งที่เหมาะกับคุณ'},
      {title: 'นอนให้พอ', text: 'การนอนหลับที่มีคุณภาพสนับสนุนสมดุลของฮอร์โมน'},
    ],
    consultTitle: 'เมื่อไรควรขอคำแนะนำทางการแพทย์?',
    consultText:
      'หากอาการรุนแรงมากและส่งผลต่อชีวิตประจำวัน อาจเป็นโรคอารมณ์แปรปรวนก่อนมีประจำเดือน (PMDD) อย่าลังเลที่จะปรึกษาบุคลากรทางการแพทย์',
    shareMessage: 'กลุ่มอาการก่อนมีประจำเดือน (PMS): ทำความเข้าใจให้ดียิ่งขึ้น — AWA',
  },
  vi: {
    badge: 'CHU KỲ & SỨC KHỎE',
    title: 'Hội chứng tiền kinh nguyệt (PMS):\nhiểu rõ hơn',
    metaDuration: '4 phút đọc',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'PMS ảnh hưởng đến tới 8 trên 10 phụ nữ. Mệt mỏi, cáu gắt, đầy hơi… Hiểu nguyên nhân và áp dụng những thói quen đúng có thể cải thiện rất nhiều thời gian này trong tháng.',
    contentsTitle: 'Trong bài viết này',
    contents: [
      'PMS là gì?',
      'Các triệu chứng thường gặp',
      'Những nguyên nhân có thể có',
      'Mẹo để cảm thấy tốt hơn',
      'Khi nào nên đi khám bác sĩ?',
    ],
    section1Body:
      'Hội chứng tiền kinh nguyệt tập hợp các triệu chứng thể chất và cảm xúc thường xuất hiện 5 đến 10 ngày trước kỳ kinh và hết khi chu kỳ kinh nguyệt bắt đầu.',
    visual1Title: 'Một giai đoạn gắn liền với chu kỳ của bạn',
    visual1Text:
      'Các triệu chứng xuất hiện trước kỳ kinh và thường dịu đi khi kỳ kinh bắt đầu.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Cường độ và loại triệu chứng có thể khác nhau rất nhiều giữa từng phụ nữ, và từ chu kỳ này sang chu kỳ khác.',
    symptoms: [
      {title: 'Cảm xúc', text: 'Cáu gắt, lo âu, buồn bã, thay đổi tâm trạng'},
      {title: 'Thể chất', text: 'Đầy hơi, đau, mệt mỏi, đau đầu'},
      {title: 'Hành vi', text: 'Thèm đồ ngọt, thay đổi cảm giác thèm ăn, mệt mỏi'},
      {title: 'Giấc ngủ', text: 'Khó ngủ hoặc giấc ngủ kém yên hơn'},
    ],
    section3Body:
      'Những dao động nội tiết, đặc biệt của progesterone và estrogen, ảnh hưởng đến các chất dẫn truyền thần kinh trong não (serotonin, dopamine), điều này có thể giải thích các triệu chứng cảm xúc và thể chất của PMS.',
    tip2Title: 'Hormone đóng vai trò then chốt',
    tip2Text:
      'Dao động nội tiết có thể ảnh hưởng đến tâm trạng, năng lượng, giấc ngủ và một số cảm giác thể chất.',
    tips: [
      {title: 'Uống đủ nước', text: 'Uống đủ nước giúp giảm đầy hơi.'},
      {title: 'Ăn uống cân bằng', text: 'Ưu tiên thực phẩm giàu magiê, omega-3 và vitamin nhóm B.'},
      {title: 'Duy trì vận động', text: 'Hoạt động thể chất giải phóng endorphin và giảm căng thẳng.'},
      {title: 'Kiểm soát căng thẳng', text: 'Bài tập hít thở, thiền, viết nhật ký… Hãy tìm điều phù hợp với bạn.'},
      {title: 'Ngủ đủ giấc', text: 'Giấc ngủ chất lượng hỗ trợ cân bằng nội tiết.'},
    ],
    consultTitle: 'Khi nào nên tìm lời khuyên y khoa?',
    consultText:
      'Nếu các triệu chứng rất dữ dội và ảnh hưởng đến cuộc sống hằng ngày, đó có thể là rối loạn tiền kinh nguyệt (PMDD). Đừng ngần ngại hỏi ý kiến nhân viên y tế.',
    shareMessage: 'Hội chứng tiền kinh nguyệt (PMS): hiểu rõ hơn — AWA',
  },
  uz: {
    badge: 'SIKL VA FAROVONLIK',
    title: 'Hayz oldi sindromi (HOS):\nyaxshiroq tushunish',
    metaDuration: '4 daq oʻqish',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'HOS ayollarning 10 tadan 8 tasigacha taʼsir qiladi. Charchoq, jizzakilik, shishish… Uning sabablarini tushunish va toʻgʻri odatlarni qabul qilish oyning bu davrini sezilarli yaxshilashi mumkin.',
    contentsTitle: 'Ushbu maqolada',
    contents: [
      'HOS nima?',
      'Keng tarqalgan alomatlar',
      'Mumkin boʻlgan sabablar',
      'Oʻzingizni yaxshi his qilish uchun maslahatlar',
      'Qachon shifokorga borish kerak?',
    ],
    section1Body:
      'Hayz oldi sindromi odatda hayzdan 5 kundan 10 kungacha oldin paydo boʻladigan va hayz siklining boshida yoʻqoladigan jismoniy va hissiy alomatlarni birlashtiradi.',
    visual1Title: 'Siklingiz bilan bogʻliq bosqich',
    visual1Text:
      'Alomatlar hayzdan oldin paydo boʻladi va u boshlanganda odatda yengillashadi.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Alomatlarning kuchi va turi ayoldan ayolga va sikldan sikliga katta farq qilishi mumkin.',
    symptoms: [
      {title: 'Hissiyotlar', text: 'Jizzakilik, xavotir, qaygʻu, kayfiyatning keskin oʻzgarishi'},
      {title: 'Jismoniy', text: 'Shishish, ogʻriq, charchoq, bosh ogʻrigʻi'},
      {title: 'Xulq-atvor', text: 'Shirinlikka ishtiyoq, ishtaha oʻzgarishi, charchoq'},
      {title: 'Uyqu', text: 'Uxlashda qiyinchilik yoki kamroq dam beruvchi uyqu'},
    ],
    section3Body:
      'Gormonal tebranishlar, ayniqsa progesteron va estrogenniki, miyaning neyromediatorlariga (serotonin, dofamin) taʼsir qiladi va bu HOS ning hissiy va jismoniy alomatlarini tushuntirishi mumkin.',
    tip2Title: 'Gormonlar muhim rol oʻynaydi',
    tip2Text:
      'Gormonal tebranishlar kayfiyatga, energiyaga, uyquga va baʼzi jismoniy sezgilarga taʼsir qilishi mumkin.',
    tips: [
      {title: 'Suv balansini saqlang', text: 'Yetarli suv ichish shishishni kamaytirishga yordam beradi.'},
      {title: 'Muvozanatli ovqatlaning', text: 'Magniy, omega-3 va B vitaminlariga boy oziq-ovqatlarni afzal koʻring.'},
      {title: 'Faol boʻling', text: 'Jismoniy faollik endorfinlarni chiqaradi va stressni kamaytiradi.'},
      {title: 'Stressni boshqaring', text: 'Nafas olish mashqlari, meditatsiya, kundalik yuritish… Oʻzingizga mosini toping.'},
      {title: 'Yetarli uxlang', text: 'Sifatli uyqu gormonal muvozanatni qoʻllab-quvvatlaydi.'},
    ],
    consultTitle: 'Qachon tibbiy maslahat olish kerak?',
    consultText:
      'Agar alomatlar juda kuchli boʻlsa va kundalik hayotingizga taʼsir qilsa, bu hayz oldi disforik buzilishi (HODB) boʻlishi mumkin. Sogʻliqni saqlash mutaxassisiga murojaat qilishdan tortinmang.',
    shareMessage: 'Hayz oldi sindromi (HOS): yaxshiroq tushunish — AWA',
  },
  az: {
    badge: 'DÖVR VƏ RIFAH',
    title: 'Premenstrual sindrom (PMS):\nonu daha yaxşı anlamaq',
    metaDuration: '4 dəq oxu',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'PMS hər 10 qadından 8-nə qədərinə təsir edir. Yorğunluq, əsəbilik, şişkinlik… Onun səbəblərini anlamaq və düzgün vərdişlər qəbul etmək ayın bu dövrünü xeyli yaxşılaşdıra bilər.',
    contentsTitle: 'Bu məqalədə',
    contents: [
      'PMS nədir?',
      'Geniş yayılmış simptomlar',
      'Mümkün səbəblər',
      'Özünüzü yaxşı hiss etmək üçün məsləhətlər',
      'Nə vaxt həkimə müraciət etmək lazımdır?',
    ],
    section1Body:
      'Premenstrual sindrom adətən aybaşından 5–10 gün əvvəl görünən və menstrual dövrün başlanğıcında keçib gedən fiziki və emosional simptomları birləşdirir.',
    visual1Title: 'Dövrünüzlə bağlı faza',
    visual1Text:
      'Simptomlar aybaşından əvvəl görünür və adətən o başlayanda yüngülləşir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Simptomların intensivliyi və növü bir qadından digərinə və bir dövrdən digərinə çox dəyişə bilər.',
    symptoms: [
      {title: 'Emosiyalar', text: 'Əsəbilik, narahatlıq, kədər, əhval dəyişkənliyi'},
      {title: 'Fiziki', text: 'Şişkinlik, ağrı, yorğunluq, baş ağrıları'},
      {title: 'Davranış', text: 'Şirniyyata meyl, iştahanın dəyişməsi, yorğunluq'},
      {title: 'Yuxu', text: 'Yuxu problemləri və ya daha az dincəldici yuxu'},
    ],
    section3Body:
      'Hormonal dalğalanmalar, xüsusilə progesteron və östrogenin dalğalanmaları, beyin neyromediatorlarına (serotonin, dopamin) təsir edir ki, bu da PMS-in emosional və fiziki simptomlarını izah edə bilər.',
    tip2Title: 'Hormonların əsas rolu var',
    tip2Text:
      'Hormonal dalğalanmalar əhvala, enerjiyə, yuxuya və bəzi fiziki hisslərə təsir edə bilər.',
    tips: [
      {title: 'Hidratasiyanı qoruyun', text: 'Kifayət qədər su içmək şişkinliyi azaltmağa kömək edir.'},
      {title: 'Balanslı qidalanın', text: 'Maqnezium, omeqa-3 və B vitaminləri ilə zəngin qidalara üstünlük verin.'},
      {title: 'Aktiv qalın', text: 'Fiziki fəaliyyət endorfinlər ifraz edir və stressi azaldır.'},
      {title: 'Stressi idarə edin', text: 'Nəfəs məşqləri, meditasiya, gündəlik yazmaq… Sizə uyğun olanı tapın.'},
      {title: 'Kifayət qədər yatın', text: 'Keyfiyyətli yuxu hormonal tarazlığı dəstəkləyir.'},
    ],
    consultTitle: 'Nə vaxt tibbi məsləhət almaq lazımdır?',
    consultText:
      'Simptomlar çox şiddətlidirsə və gündəlik həyatınıza təsir edirsə, bu, premenstrual disforik pozuntu (PMDB) ola bilər. Tibb işçisinə müraciət etməkdən çəkinməyin.',
    shareMessage: 'Premenstrual sindrom (PMS): onu daha yaxşı anlamaq — AWA',
  },
  ka: {
    badge: 'ციკლი და კეთილდღეობა',
    title: 'მენსტრუაციამდელი სინდრომი (PMS):\nუკეთ გაგება',
    metaDuration: '4 წთ საკითხავი',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'PMS ქალების 10-დან 8-მდე ეხება. დაღლილობა, გაღიზიანებადობა, შებერვა… მისი მიზეზების გაგებას და სწორი ჩვევების შემუშავებას შეუძლია თვის ეს დრო მნიშვნელოვნად გააუმჯობესოს.',
    contentsTitle: 'ამ სტატიაში',
    contents: [
      'რა არის PMS?',
      'გავრცელებული სიმპტომები',
      'შესაძლო მიზეზები',
      'რჩევები უკეთ ყოფნისთვის',
      'როდის მივმართოთ ექიმს?',
    ],
    section1Body:
      'მენსტრუაციამდელი სინდრომი აერთიანებს ფიზიკურ და ემოციურ სიმპტომებს, რომლებიც, როგორც წესი, მენსტრუაციამდე 5-დან 10 დღით ადრე ჩნდება და მენსტრუაციული ციკლის დასაწყისში გადის.',
    visual1Title: 'თქვენს ციკლთან დაკავშირებული ფაზა',
    visual1Text:
      'სიმპტომები მენსტრუაციამდე ჩნდება და, როგორც წესი, მისი დაწყების შემდეგ ნელდება.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'სიმპტომების ინტენსივობა და ტიპი ქალიდან ქალამდე და ციკლიდან ციკლამდე ძლიერ შეიძლება განსხვავდებოდეს.',
    symptoms: [
      {title: 'ემოციები', text: 'გაღიზიანებადობა, შფოთვა, სევდა, ხასიათის ცვალებადობა'},
      {title: 'ფიზიკური', text: 'შებერვა, ტკივილი, დაღლილობა, თავის ტკივილი'},
      {title: 'ქცევა', text: 'შაქრის სურვილი, მადის ცვლილებები, დაღლილობა'},
      {title: 'ძილი', text: 'ძილის სირთულე ან ნაკლებად დამამშვიდებელი ძილი'},
    ],
    section3Body:
      'ჰორმონული ცვალებადობა, განსაკუთრებით პროგესტერონისა და ესტროგენის, ტვინის ნეიროტრანსმიტერებზე (სეროტონინი, დოფამინი) მოქმედებს, რამაც შეიძლება PMS-ის ემოციური და ფიზიკური სიმპტომები ახსნას.',
    tip2Title: 'ჰორმონებს მთავარი როლი აქვთ',
    tip2Text:
      'ჰორმონულმა ცვალებადობამ შეიძლება ხასიათზე, ენერგიაზე, ძილსა და ზოგიერთ ფიზიკურ შეგრძნებაზე იმოქმედოს.',
    tips: [
      {title: 'შეინარჩუნეთ ჰიდრატაცია', text: 'საკმარისი წყლის დალევა შებერვის შემცირებაში გეხმარებათ.'},
      {title: 'ჭამეთ დაბალანსებულად', text: 'მიანიჭეთ უპირატესობა მაგნიუმით, ომეგა-3-ით და B ჯგუფის ვიტამინებით მდიდარ საკვებს.'},
      {title: 'დარჩით აქტიურები', text: 'ფიზიკური აქტივობა ენდორფინებს გამოყოფს და სტრესს ამცირებს.'},
      {title: 'მართეთ თქვენი სტრესი', text: 'სუნთქვის ვარჯიშები, მედიტაცია, დღიური… იპოვეთ, რა გერგებათ.'},
      {title: 'ჩაიძინეთ საკმარისად', text: 'ხარისხიანი ძილი ჰორმონულ ბალანსს უჭერს მხარს.'},
    ],
    consultTitle: 'როდის უნდა მოიძიოთ სამედიცინო რჩევა?',
    consultText:
      'თუ სიმპტომები ძალიან ინტენსიურია და ყოველდღიურ ცხოვრებაზე მოქმედებს, ეს შეიძლება მენსტრუაციამდელი დისფორიული აშლილობა (PMDD) იყოს. ნუ დააყოვნებთ ჯანდაცვის სპეციალისტთან მიმართვას.',
    shareMessage: 'მენსტრუაციამდელი სინდრომი (PMS): უკეთ გაგება — AWA',
  },
  hy: {
    badge: 'ՑԻԿԼ ԵՎ ԲԱՐԵԿԵՑՈՒԹՅՈՒՆ',
    title: 'Նախադաշտանային համախտանիշ (ՆԴՀ).\nավելի լավ հասկանալ',
    metaDuration: '4 ր կարդալու համար',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'ՆԴՀ-ն ազդում է 10 կնոջից մինչև 8-ի վրա: Հոգնածություն, դյուրագրգռություն, ուռածություն… Դրա պատճառները հասկանալը և ճիշտ սովորություններ որդեգրելը կարող է զգալիորեն բարելավել ամսվա այս շրջանը:',
    contentsTitle: 'Այս հոդվածում',
    contents: [
      'Ի՞նչ է ՆԴՀ-ն',
      'Տարածված ախտանիշներ',
      'Հնարավոր պատճառներ',
      'Խորհուրդներ՝ ավելի լավ զգալու համար',
      'Ե՞րբ դիմել բժշկի',
    ],
    section1Body:
      'Նախադաշտանային համախտանիշը միավորում է ֆիզիկական և հուզական ախտանիշներ, որոնք սովորաբար հայտնվում են դաշտանից 5–10 օր առաջ և անցնում են դաշտանային ցիկլի սկզբում:',
    visual1Title: 'Ձեր ցիկլին կապված փուլ',
    visual1Text:
      'Ախտանիշները հայտնվում են դաշտանից առաջ և սովորաբար թեթևանում են, երբ այն սկսվում է:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Ախտանիշների ինտենսիվությունը և տեսակը կարող են խիստ տարբերվել մի կնոջից մյուսը և մի ցիկլից մյուսը:',
    symptoms: [
      {title: 'Հույզեր', text: 'Դյուրագրգռություն, անհանգստություն, տխրություն, տրամադրության տատանումներ'},
      {title: 'Ֆիզիկական', text: 'Ուռածություն, ցավ, հոգնածություն, գլխացավեր'},
      {title: 'Վարք', text: 'Շաքարի ցանկություն, ախորժակի փոփոխություններ, հոգնածություն'},
      {title: 'Քուն', text: 'Քնելու դժվարություն կամ ավելի քիչ հանգստացնող քուն'},
    ],
    section3Body:
      'Հորմոնալ տատանումները, մասնավորապես պրոգեստերոնի և էստրոգենի, ազդում են ուղեղի նեյրոհաղորդիչների վրա (սերոտոնին, դոֆամին), ինչը կարող է բացատրել ՆԴՀ-ի հուզական և ֆիզիկական ախտանիշները:',
    tip2Title: 'Հորմոնները առանցքային դեր են խաղում',
    tip2Text:
      'Հորմոնալ տատանումները կարող են ազդել տրամադրության, էներգիայի, քնի և որոշ ֆիզիկական զգացողությունների վրա:',
    tips: [
      {title: 'Մնացեք հիդրատացված', text: 'Բավարար ջուր խմելը օգնում է նվազեցնել ուռածությունը:'},
      {title: 'Սնվեք հավասարակշռված', text: 'Նախապատվություն տվեք մագնեզիումով, օմեգա-3-ով և B խմբի վիտամիններով հարուստ սննդին:'},
      {title: 'Մնացեք ակտիվ', text: 'Ֆիզիկական ակտիվությունը ազատում է էնդորֆիններ և նվազեցնում սթրեսը:'},
      {title: 'Կառավարեք ձեր սթրեսը', text: 'Շնչառական վարժություններ, մեդիտացիա, օրագիր վարել… Գտեք, թե ինչն է ձեզ համար աշխատում:'},
      {title: 'Բավարար քնեք', text: 'Որակյալ քունը աջակցում է հորմոնալ հավասարակշռությանը:'},
    ],
    consultTitle: 'Ե՞րբ պետք է բժշկական խորհուրդ փնտրել',
    consultText:
      'Եթե ախտանիշները շատ ինտենսիվ են և ազդում են ձեր առօրյայի վրա, դա կարող է լինել նախադաշտանային դիսֆորիկ խանգարում (ՆԴԴԽ): Մի տատանվեք դիմել առողջապահության մասնագետի:',
    shareMessage: 'Նախադաշտանային համախտանիշ (ՆԴՀ). ավելի լավ հասկանալ — AWA',
  },
  tg: {
    badge: 'ДАВРА ВА НЕКӮАҲВОЛӢ',
    title: 'Синдроми пеш аз ҳайз (СПҲ):\nбеҳтар фаҳмидани он',
    metaDuration: '4 дақ барои хондан',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'СПҲ то 8 нафар аз 10 занро фаро мегирад. Хастагӣ, асабоният, дамидани шикам… Фаҳмидани сабабҳои он ва қабули одатҳои дуруст метавонад ин вақти моҳро хеле беҳтар кунад.',
    contentsTitle: 'Дар ин мақола',
    contents: [
      'СПҲ чист?',
      'Нишонаҳои маъмул',
      'Сабабҳои имконпазир',
      'Маслиҳатҳо барои беҳтар эҳсос кардан',
      'Кай ба табиб муроҷиат кардан лозим аст?',
    ],
    section1Body:
      'Синдроми пеш аз ҳайз нишонаҳои ҷисмонӣ ва ҳиссиро ҷамъ мекунад, ки одатан 5 то 10 рӯз пеш аз ҳайзи шумо пайдо мешаванд ва дар оғози давраи ҳайз нест мешаванд.',
    visual1Title: 'Марҳилае, ки ба давраи шумо вобаста аст',
    visual1Text:
      'Нишонаҳо пеш аз ҳайз пайдо мешаванд ва одатан пас аз оғози он сабук мешаванд.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Шиддат ва навъи нишонаҳо метавонад аз зан ба зан ва аз давра то давра хеле гуногун бошад.',
    symptoms: [
      {title: 'Эҳсосот', text: 'Асабоният, изтироб, ғамгинӣ, тағйироти кайфият'},
      {title: 'Ҷисмонӣ', text: 'Дамидани шикам, дард, хастагӣ, дарди сар'},
      {title: 'Рафтор', text: 'Хоҳиши ширинӣ, тағйироти иштиҳо, хастагӣ'},
      {title: 'Хоб', text: 'Душвории хоб ё хоби камистироҳат'},
    ],
    section3Body:
      'Тағйироти гормонӣ, хусусан дар прогестерон ва эстроген, ба нейротрансмиттерҳои майна (серотонин, допамин) таъсир мерасонанд, ки метавонад нишонаҳои ҳиссӣ ва ҷисмонии СПҲ-ро шарҳ диҳад.',
    tip2Title: 'Гормонҳо нақши калидӣ доранд',
    tip2Text:
      'Тағйироти гормонӣ метавонад ба кайфият, қувват, хоб ва баъзе эҳсосоти ҷисмонӣ таъсир расонад.',
    tips: [
      {title: 'Обнӯшии кофӣ', text: 'Нӯшидани оби кофӣ ба кам кардани дамидани шикам кумак мекунад.'},
      {title: 'Ғизои мутавозин', text: 'Хӯрокҳои бойи магний, омега-3 ва витаминҳои гурӯҳи B-ро афзал донед.'},
      {title: 'Фаъол бошед', text: 'Фаъолияти ҷисмонӣ эндорфинҳоро озод мекунад ва стрессро кам мекунад.'},
      {title: 'Стресси худро идора кунед', text: 'Машқҳои нафаскашӣ, мулоҳиза, дафтари рӯзнома… Он чиро, ки барои шумо кор мекунад, ёбед.'},
      {title: 'Ба қадри кофӣ хоб кунед', text: 'Хоби босифат тавозуни гормониро дастгирӣ мекунад.'},
    ],
    consultTitle: 'Кай бояд маслиҳати тиббӣ пурсид?',
    consultText:
      'Агар нишонаҳо хеле шадид бошанд ва ба ҳаёти ҳаррӯзаи шумо таъсир расонанд, ин метавонад ихтилоли дисфорикии пеш аз ҳайз (ИДПҲ) бошад. Ба мутахассиси соҳаи тиб муроҷиат кардан шарм надоред.',
    shareMessage: 'Синдроми пеш аз ҳайз (СПҲ): беҳтар фаҳмидани он — AWA',
  },
  ky: {
    badge: 'ЦИКЛ ЖАНА ЖЫРГАЛЧЫЛЫК',
    title: 'Етек киримге чейинки синдром (ЕЧС):\nжакшыраак түшүнүү',
    metaDuration: '4 мүн окуу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'ЕЧС аялдардын 10дон 8ине чейин таасир этет. Чарчоо, ачуулануу, ич көбүшү… Анын себептерин түшүнүү жана туура адаттарды өздөштүрүү айдын бул убагын бир кыйла жакшыртышы мүмкүн.',
    contentsTitle: 'Бул макалада',
    contents: [
      'ЕЧС деген эмне?',
      'Кеңири таралган белгилер',
      'Мүмкүн болгон себептер',
      'Өзүңүздү жакшы сезүү боюнча кеңештер',
      'Дарыгерге качан барыш керек?',
    ],
    section1Body:
      'Етек киримге чейинки синдром адатта етек киримден 5–10 күн мурун пайда боло турган жана етек кирим циклинин башталышында жоголгон физикалык жана эмоционалдык белгилерди бириктирет.',
    visual1Title: 'Циклиңизге байланышкан фаза',
    visual1Text:
      'Белгилер етек киримден мурун пайда болот жана ал башталгандан кийин адатта басаңдайт.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Белгилердин курчтугу жана түрү аялдан аялга жана циклден циклге бир кыйла айырмаланышы мүмкүн.',
    symptoms: [
      {title: 'Эмоциялар', text: 'Ачуулануу, тынчсыздануу, кайгы, маанайдын термелиши'},
      {title: 'Физикалык', text: 'Ич көбүшү, оору, чарчоо, баш оору'},
      {title: 'Жүрүм-турум', text: 'Таттууга болгон каалоо, табиттин өзгөрүшү, чарчоо'},
      {title: 'Уйку', text: 'Уйкунун бузулушу же азыраак эс алдырган уйку'},
    ],
    section3Body:
      'Гормондук термелүүлөр, айрыкча прогестерон менен эстрогенде, мээнин нейротрансмиттерлерине (серотонин, дофамин) таасир этет, бул ЕЧСтин эмоционалдык жана физикалык белгилерин түшүндүрүшү мүмкүн.',
    tip2Title: 'Гормондор негизги роль ойнойт',
    tip2Text:
      'Гормондук термелүүлөр маанайга, энергияга, уйкуга жана айрым физикалык сезимдерге таасир этиши мүмкүн.',
    tips: [
      {title: 'Суюктук ичиңиз', text: 'Жетиштүү суу ичүү ич көбүшүн азайтууга жардам берет.'},
      {title: 'Тең салмактуу тамактаныңыз', text: 'Магнийге, омега-3кө жана В витаминдерине бай азыктарга артыкчылык бериңиз.'},
      {title: 'Активдүү болуңуз', text: 'Физикалык активдүүлүк эндорфиндерди бөлүп чыгарат жана стрессти азайтат.'},
      {title: 'Стрессиңизди башкарыңыз', text: 'Дем алуу көнүгүүлөрү, медитация, журнал жүргүзүү… Өзүңүзгө ылайыктуусун табыңыз.'},
      {title: 'Жетиштүү уктаңыз', text: 'Сапаттуу уйку гормондук тең салмактуулукту колдойт.'},
    ],
    consultTitle: 'Медициналык кеңешти качан сурап кайрылуу керек?',
    consultText:
      'Эгер белгилер абдан күчтүү болуп, күнүмдүк жашооңузга таасир этсе, бул етек киримге чейинки дисфориялык бузулуу (ЕЧДБ) болушу мүмкүн. Ден соолук сактоо адисине кайрылуудан тартынбаңыз.',
    shareMessage: 'Етек киримге чейинки синдром (ЕЧС): жакшыраак түшүнүү — AWA',
  },
  tk: {
    badge: 'SIKL WE ABADANÇYLYK',
    title: 'Aýbaşydan öňki sindrom (AÖS):\nony has gowy düşünmek',
    metaDuration: '4 min okamak',
    metaValidated: 'Barlanan mazmun',
    intro:
      'AÖS 10 aýalyň 8-ne çenlisine täsir edýär. Ýadawlyk, gaharjaňlyk, garnyň çişmegi… Onuň sebäplerini düşünmek we dogry endikleri kabul etmek aýyň bu döwrüni ep-esli gowulandyryp biler.',
    contentsTitle: 'Bu makalada',
    contents: [
      'AÖS näme?',
      'Umumy alamatlar',
      'Mümkin sebäpler',
      'Özüňizi gowy duýmak üçin maslahatlar',
      'Lukmana haçan ýüz tutmaly?',
    ],
    section1Body:
      'Aýbaşydan öňki sindrom adatça aýbaşyňyzdan 5–10 gün öň peýda bolýan we aýbaşy sikliniň başynda ýitýän fiziki we duýgusal alamatlary jemleýär.',
    visual1Title: 'Sikliňiz bilen baglanyşykly tapgyr',
    visual1Text:
      'Alamatlar aýbaşydan öň peýda bolýar we ol başlandan soň adatça ýeňilleşýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Alamatlaryň güýçlüligi we görnüşi aýaldan aýala we sikldan sika köp tapawutlanyp biler.',
    symptoms: [
      {title: 'Duýgular', text: 'Gaharjaňlyk, biynjalyklyk, gam, keýp üýtgeşmeleri'},
      {title: 'Fiziki', text: 'Garnyň çişmegi, agyry, ýadawlyk, kelle agyrylary'},
      {title: 'Özüňi alyp barş', text: 'Şeker islegi, iýmit islegindäki üýtgeşmeler, ýadawlyk'},
      {title: 'Uky', text: 'Uklamakda kynçylyk ýa-da az dynç berýän uky'},
    ],
    section3Body:
      'Gormonal yrgyldylar, aýratyn-da progesteron we estrogende, beýnidäki neýromediatorlara (serotonin, dofamin) täsir edýär, bu AÖS-iň duýgusal we fiziki alamatlaryny düşündirip biler.',
    tip2Title: 'Gormonlar esasy rol oýnaýar',
    tip2Text:
      'Gormonal yrgyldylar keýbe, energiýa, uka we käbir fiziki duýgulara täsir edip biler.',
    tips: [
      {title: 'Suwly galyň', text: 'Ýeterlik suw içmek çişmegi azaltmaga kömek edýär.'},
      {title: 'Deňagramly iýmitleniň', text: 'Magniýe, omega-3-e we B witaminlerine baý iýmitlere artykmaçlyk beriň.'},
      {title: 'Işjeň galyň', text: 'Fiziki işjeňlik endorfinleri boşadýar we stresi azaldýar.'},
      {title: 'Stresiňizi dolandyryň', text: 'Dem alyş maşklary, meditasiýa, gündelik ýazmak… Size näme laýykdygyny tapyň.'},
      {title: 'Ýeterlik uklaň', text: 'Hilli uky gormonal deňagramlylyga goldaw berýär.'},
    ],
    consultTitle: 'Lukmançylyk maslahatyny haçan soramaly?',
    consultText:
      'Alamatlar gaty güýçli bolup, gündelik durmuşyňyza täsir edýän bolsa, bu aýbaşydan öňki disforik bozulma (AÖDB) bolup biler. Saglyk hünärmeni bilen maslahatlaşmakdan çekinmäň.',
    shareMessage: 'Aýbaşydan öňki sindrom (AÖS): ony has gowy düşünmek — AWA',
  },
  ms: {
    badge: 'KITARAN & KESEJAHTERAAN',
    title: 'Sindrom pramenstruasi (PMS):\nmemahaminya dengan lebih baik',
    metaDuration: '4 min bacaan',
    metaValidated: 'Kandungan disemak',
    intro:
      'PMS menjejaskan sehingga 8 daripada 10 wanita. Keletihan, mudah marah, kembung… Memahami puncanya dan mengamalkan tabiat yang betul boleh menambah baik masa ini dalam sebulan dengan ketara.',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Apakah PMS?',
      'Simptom yang lazim',
      'Kemungkinan punca',
      'Petua untuk berasa lebih baik',
      'Bila untuk berjumpa doktor?',
    ],
    section1Body:
      'Sindrom pramenstruasi menghimpunkan simptom fizikal dan emosi yang biasanya muncul 5 hingga 10 hari sebelum haid anda dan hilang pada permulaan kitaran haid.',
    visual1Title: 'Fasa yang terikat pada kitaran anda',
    visual1Text:
      'Simptom muncul sebelum haid anda dan biasanya reda sebaik sahaja ia bermula.',
    tip1Title: 'Elok diketahui',
    tip1Text:
      'Keamatan dan jenis simptom boleh berbeza dengan ketara dari seorang wanita ke seorang wanita, dan dari satu kitaran ke kitaran berikutnya.',
    symptoms: [
      {title: 'Emosi', text: 'Mudah marah, keresahan, kesedihan, emosi berubah-ubah'},
      {title: 'Fizikal', text: 'Kembung, sakit, keletihan, sakit kepala'},
      {title: 'Tingkah laku', text: 'Mengidam gula, perubahan selera makan, keletihan'},
      {title: 'Tidur', text: 'Sukar tidur atau tidur yang kurang nyenyak'},
    ],
    section3Body:
      'Perubahan hormon, terutamanya progesteron dan estrogen, menjejaskan neurotransmitter otak (serotonin, dopamin), yang mungkin menjelaskan simptom emosi dan fizikal PMS.',
    tip2Title: 'Hormon memainkan peranan utama',
    tip2Text:
      'Perubahan hormon boleh menjejaskan emosi, tenaga, tidur dan sesetengah sensasi fizikal.',
    tips: [
      {title: 'Kekal terhidrat', text: 'Minum air secukupnya membantu mengurangkan kembung.'},
      {title: 'Makan pemakanan seimbang', text: 'Utamakan makanan yang kaya dengan magnesium, omega-3 dan vitamin B.'},
      {title: 'Kekal aktif', text: 'Aktiviti fizikal membebaskan endorfin dan mengurangkan tekanan.'},
      {title: 'Uruskan tekanan anda', text: 'Latihan pernafasan, meditasi, menulis jurnal… Cari apa yang sesuai untuk anda.'},
      {title: 'Tidur secukupnya', text: 'Tidur yang berkualiti menyokong keseimbangan hormon.'},
    ],
    consultTitle: 'Bila anda patut meminta nasihat perubatan?',
    consultText:
      'Jika simptom sangat kuat dan menjejaskan kehidupan seharian anda, ia mungkin gangguan disforik pramenstruasi (PMDD). Jangan teragak-agak berjumpa pengamal penjagaan kesihatan.',
    shareMessage: 'Sindrom pramenstruasi (PMS): memahaminya dengan lebih baik — AWA',
  },
  so: {
    badge: 'WAREEG & FAYOOBAAN',
    title: 'Syndrome-ka caadada ka hor (PMS):\nsi wanaagsan u fahamka',
    metaDuration: '4 daq akhris',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro:
      'PMS wuxuu saameeyaa ilaa 8 naagood oo 10-kii ka mid ah. Daal, cadho degdeg ah, calool-barar… Fahamka sababihiisa iyo qaadashada caadooyinka saxda ah ayaa si weyn u hagaajin kara waqtigan bisha.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    contents: [
      'Waa maxay PMS?',
      'Astaamaha caadiga ah',
      'Sababaha suurtagalka ah',
      'Talooyin lagu dareemo fiicnaan',
      'Goorta dhakhtar la arko?',
    ],
    section1Body:
      'Syndrome-ka caadada ka hor wuxuu isu keenaa astaamo jidheed iyo dareen oo caadi ahaan soo muuqda 5 ilaa 10 maalmood ka hor caadadaada oo libdhaan bilowga wareegga caadada.',
    visual1Title: 'Marxalad ku xidhan wareeggaaga',
    visual1Text:
      'Astaamuhu waxay soo muuqdaan ka hor caadadaada inta badan way fududaadaan marka ay bilaabato.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text:
      'Xoogga iyo nooca astaamuhu aad ayay ugu kala duwanaan karaan naag ilaa naag, iyo wareeg ilaa wareeg.',
    symptoms: [
      {title: 'Dareenno', text: 'Cadho degdeg ah, walaac, murugo, isbeddelka niyadda'},
      {title: 'Jidheed', text: 'Calool-barar, xanuun, daal, madax-xanuun'},
      {title: 'Dabeecad', text: 'Rabitaan sonkor, isbeddelka rabitaanka cuntada, daal'},
      {title: 'Hurdo', text: 'Dhib hurdo ama hurdo aan nasasho badan lahayn'},
    ],
    section3Body:
      'Kala duwanaanshaha hormoonka, gaar ahaan progesterone iyo estrogen, ayaa saameeya neurotransmitters-ka maskaxda (serotonin, dopamine), taasoo sharxi karta astaamaha dareenka iyo jidheed ee PMS.',
    tip2Title: 'Hormoonnadu waxay leeyihiin door muhiim ah',
    tip2Text:
      'Kala duwanaanshaha hormoonku waxay saameyn karaan niyadda, tamarta, hurdada, iyo dareenno jidheed oo qaar.',
    tips: [
      {title: 'Biyo ku filan cab', text: 'Cabbidda biyo ku filan ayaa caawisa yareynta calool-barar.'},
      {title: 'Cun cunto dheelitiran', text: 'Door bid cuntooyin hodan ku ah magnesium, omega-3, iyo fiitamiinnada B.'},
      {title: 'Ahaw mid firfircoon', text: 'Firfircoonida jidheedku waxay sii daysaa endorphins wuxuuna yareeyaa walaaca.'},
      {title: 'Maamul walaacaaga', text: 'Layliyo neefsasho, fikir-dheer, qorista buug… Hel waxa kuu shaqeeya.'},
      {title: 'Hurdo ku filan hel', text: 'Hurdo tayo leh ayaa taageerta dheelitirka hormoonka.'},
    ],
    consultTitle: 'Goorma ayaa talo caafimaad la raadsadaa?',
    consultText:
      'Haddii astaamuhu aad u xoog badan yihiin oo ay saameeyaan nolol-maalmeedkaaga, waxay noqon karaan khalkhal niyadeed ka hor caadada (PMDD). Ha ka waaban inaad la tashato xirfadle caafimaad.',
    shareMessage: 'Syndrome-ka caadada ka hor (PMS): si wanaagsan u fahamka — AWA',
  },
  sw: {
    badge: 'MZUNGUKO NA USTAWI',
    title: 'Ugonjwa wa kabla ya hedhi (PMS):\nkuuelewa vizuri zaidi',
    metaDuration: 'Dakika 4 za kusoma',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro:
      'PMS huathiri hadi wanawake 8 kati ya 10. Uchovu, hasira, tumbo kujaa gesi… Kuelewa sababu zake na kuwa na tabia sahihi kunaweza kuboresha sana kipindi hiki cha mwezi.',
    contentsTitle: 'Katika makala hii',
    contents: [
      'PMS ni nini?',
      'Dalili za kawaida',
      'Sababu zinazowezekana',
      'Vidokezo vya kujisikia vizuri',
      'Wakati wa kumwona daktari?',
    ],
    section1Body:
      'Ugonjwa wa kabla ya hedhi unaleta pamoja dalili za kimwili na kihisia ambazo kwa kawaida huonekana siku 5 hadi 10 kabla ya hedhi yako na kuisha mwanzoni mwa mzunguko wa hedhi.',
    visual1Title: 'Awamu inayohusiana na mzunguko wako',
    visual1Text:
      'Dalili huonekana kabla ya hedhi yako na kwa kawaida hupungua inapoanza.',
    tip1Title: 'Vyema kujua',
    tip1Text:
      'Ukali na aina ya dalili vinaweza kutofautiana sana kati ya mwanamke na mwanamke, na kutoka mzunguko mmoja hadi mwingine.',
    symptoms: [
      {title: 'Hisia', text: 'Hasira, wasiwasi, huzuni, mabadiliko ya hali ya moyo'},
      {title: 'Za kimwili', text: 'Tumbo kujaa gesi, maumivu, uchovu, maumivu ya kichwa'},
      {title: 'Tabia', text: 'Hamu ya sukari, mabadiliko ya hamu ya kula, uchovu'},
      {title: 'Usingizi', text: 'Shida ya kulala au usingizi usio wa kupumzisha'},
    ],
    section3Body:
      'Mabadiliko ya homoni, hasa ya projesteroni na estrojeni, huathiri visambazaji vya neva vya ubongo (serotonini, dopamini), jambo linaloweza kueleza dalili za kihisia na kimwili za PMS.',
    tip2Title: 'Homoni zina nafasi kuu',
    tip2Text:
      'Mabadiliko ya homoni yanaweza kuathiri hali ya moyo, nguvu, usingizi, na hisia fulani za mwili.',
    tips: [
      {title: 'Kaa na maji ya kutosha mwilini', text: 'Kunywa maji ya kutosha husaidia kupunguza tumbo kujaa gesi.'},
      {title: 'Kula lishe yenye usawa', text: 'Pendelea vyakula vyenye magnesiamu, omega-3, na vitamini B kwa wingi.'},
      {title: 'Endelea kuwa mchangamfu', text: 'Shughuli za mwili hutoa endorufini na hupunguza msongo wa mawazo.'},
      {title: 'Dhibiti msongo wako wa mawazo', text: 'Mazoezi ya kupumua, kutafakari, kuandika shajara… Tafuta kinachokufaa.'},
      {title: 'Pata usingizi wa kutosha', text: 'Usingizi bora unasaidia usawa wa homoni.'},
    ],
    consultTitle: 'Wakati gani utafute ushauri wa kitabibu?',
    consultText:
      'Ikiwa dalili ni kali sana na zinaathiri maisha yako ya kila siku, huenda ikawa ugonjwa mkali wa kabla ya hedhi (PMDD). Usisite kuwasiliana na mtaalamu wa afya.',
    shareMessage: 'Ugonjwa wa kabla ya hedhi (PMS): kuuelewa vizuri zaidi — AWA',
  },
  kk: {
    badge: 'ЦИКЛ ЖӘНЕ ӘЛ-АУҚАТ',
    title: 'Етеккір алдындағы синдром (ЕАС):\nоны жақсырақ түсіну',
    metaDuration: '4 мин оқу',
    metaValidated: 'Тексерілген мазмұн',
    intro:
      'ЕАС 10 әйелдің 8-ге дейінгісіне әсер етеді. Шаршау, ашушаңдық, іштің кебуі… Оның себептерін түсіну және дұрыс әдеттерді қалыптастыру айдың осы уақытын айтарлықтай жақсарта алады.',
    contentsTitle: 'Осы мақалада',
    contents: [
      'ЕАС дегеніміз не?',
      'Жиі кездесетін белгілер',
      'Мүмкін себептер',
      'Өзіңізді жақсы сезінуге арналған кеңестер',
      'Дәрігерге қашан бару керек?',
    ],
    section1Body:
      'Етеккір алдындағы синдром әдетте етеккірден 5-тен 10 күн бұрын пайда болып, етеккір циклінің басында жоғалатын дене және эмоциялық белгілерді біріктіреді.',
    visual1Title: 'Циклыңызбен байланысты фаза',
    visual1Text:
      'Белгілер етеккірден бұрын пайда болады және ол басталғаннан кейін әдетте басылады.',
    tip1Title: 'Білуге тиісті',
    tip1Text:
      'Белгілердің қарқындылығы мен түрі әйелден әйелге және бір циклден екіншісіне айтарлықтай әртүрлі болуы мүмкін.',
    symptoms: [
      {title: 'Эмоциялар', text: 'Ашушаңдық, алаңдаушылық, мұң, көңіл-күйдің ауытқуы'},
      {title: 'Дене', text: 'Іштің кебуі, ауыру, шаршау, бас ауыруы'},
      {title: 'Мінез-құлық', text: 'Қантқа құштарлық, тәбеттің өзгеруі, шаршау'},
      {title: 'Ұйқы', text: 'Ұйықтау қиындығы немесе жайсыз ұйқы'},
    ],
    section3Body:
      'Гормондық ауытқулар, әсіресе прогестерон мен эстрогенде, ми нейротрансмиттерлеріне (серотонин, дофамин) әсер етеді, бұл ЕАС-тың эмоциялық және дене белгілерін түсіндіруі мүмкін.',
    tip2Title: 'Гормондар негізгі рөл атқарады',
    tip2Text:
      'Гормондық ауытқулар көңіл-күйге, қуатқа, ұйқыға және кейбір дене сезімдеріне әсер етуі мүмкін.',
    tips: [
      {title: 'Су жеткілікті ішіңіз', text: 'Жеткілікті су ішу іштің кебуін азайтуға көмектеседі.'},
      {title: 'Теңгерімді тамақтаныңыз', text: 'Магний, омега-3 және В дәрумендеріне бай тағамдарды жөн көріңіз.'},
      {title: 'Белсенді болыңыз', text: 'Дене белсенділігі эндорфиндерді бөліп, күйзелісті азайтады.'},
      {title: 'Күйзелісіңізді басқарыңыз', text: 'Тыныс алу жаттығулары, медитация, күнделік жүргізу… Өзіңізге қолайлысын табыңыз.'},
      {title: 'Жеткілікті ұйықтаңыз', text: 'Сапалы ұйқы гормондық тепе-теңдікті қолдайды.'},
    ],
    consultTitle: 'Медициналық кеңесті қашан сұрау керек?',
    consultText:
      'Белгілер өте қатты болып, күнделікті өміріңізге әсер етсе, бұл етеккір алдындағы дисфориялық бұзылыс (ЕАДБ) болуы мүмкін. Медицина маманына бару үшін тартынбаңыз.',
    shareMessage: 'Етеккір алдындағы синдром (ЕАС): оны жақсырақ түсіну — AWA',
  },
  wo: {
    badge: 'WËRSËG AK WÉR',
    title: 'Sendromu balaa règle (SPM):\nxam ko bu gëna baax',
    metaDuration: '4 simili jàng',
    metaValidated: 'Mbind bu ñu seetlu',
    intro:
      'SPM mën na jëm ci ba ci 8 ci 10 jigéen. Sonn, mer, tuuru ndey… Xam ay sabab yi te jëfandikoo yoon yu baax mën na dimbli lool jamono jii ci weer wi.',
    contentsTitle: 'Ci bind bii',
    contents: [
      'Lan mooy SPM?',
      'Màndarga yu bari',
      'Sabab yu mën a am',
      'Ndigal ngir nekk ci neex',
      'Kañ ngay seet doktoor?',
    ],
    section1Body:
      'Sendromu balaa règle dafay boole màndarga yu yaram ak yu xol yu di feeñ ci 5 ba 10 fan balaa sa règle te di dem ci tàmbalig wërsëgu weer.',
    visual1Title: 'Benn jamono bu jëm ci sa wërsëg',
    visual1Text:
      'Màndarga yi dañuy feeñ balaa sa règle te di wàññiku bu mu tàmbalee.',
    tip1Title: 'Lu baax a xam',
    tip1Text:
      'Dayo ak xeetu màndarga yi mën nañu wuute lool ci jigéen ak jigéen, ak ci wërsëg ak wërsëg.',
    symptoms: [
      {title: 'Xol', text: 'Mer, tiitaange, naqar, soppi ci xol'},
      {title: 'Yaram', text: 'Tuuru ndey, metit, sonn, bopp bu metti'},
      {title: 'Jëf', text: 'Bëgg suukar, soppi ci xiif, sonn'},
      {title: 'Nelaw', text: 'Jafe nelaw walla nelaw bu amul noppalu'},
    ],
    section3Body:
      'Yëngu yu hormon, lool ci progesteron ak estrojen, dañuy jëm ci jëmmi xel yi (serotonin, dopamin), mu mën a leeral màndargay xol ak yaram yu SPM.',
    tip2Title: 'Hormon am nañu rol bu am solo',
    tip2Text:
      'Yëngu yu hormon mën nañu jëm ci xol, doole, nelaw ak yenn dégg yu yaram.',
    tips: [
      {title: 'Nekk ak ndox bu doy', text: 'Naan ndox bu doy dafay dimbli wàññi tuuru ndey.'},
      {title: 'Lekk bu jubloo', text: 'Jëkk lekk yu fees ci magnesiyom, omega-3 ak witamin B.'},
      {title: 'Nekk ci jëf', text: 'Jëfu yaram dafay génne endorfin te wàññi coono.'},
      {title: 'Yor sa coono', text: 'Noppiku, meditasiyoŋ, bind… Gis li la méngoo.'},
      {title: 'Nelaw bu doy', text: 'Nelaw bu baax dafay dimbli jubluñu hormon.'},
    ],
    consultTitle: 'Kañ ngay seet ndigalu doktoor?',
    consultText:
      'Bu màndarga yi metti lool te jëm ci sa dund bu bés, mën na nekk dysforik balaa règle (TDPM). Bu ñaaw a seet benn liggéeykatu wér.',
    shareMessage: 'Sendromu balaa règle (SPM): xam ko bu gëna baax — AWA',
  },
  ha: {
    badge: 'ZAGAYE & JIN DAƊI',
    title: 'Ciwon kafin haila (PMS):\nfahimtar shi da kyau',
    metaDuration: 'karatun minti 4',
    metaValidated: 'Abun da aka duba',
    intro:
      'PMS yana shafar har mata 8 cikin 10. Gajiya, fushi, kumburin ciki… Fahimtar dalilansa da bin dabi’u masu kyau na iya inganta wannan lokaci na wata sosai.',
    contentsTitle: 'A cikin wannan labari',
    contents: [
      'Menene PMS?',
      'Alamomin da suka fi yawa',
      'Yiwuwar dalilai',
      'Shawarwari don jin daɗi',
      'Yaushe za a ga likita?',
    ],
    section1Body:
      'Ciwon kafin haila yana haɗa alamomin jiki da na zuciya waɗanda yawanci ke bayyana kwanaki 5 zuwa 10 kafin hailarki kuma suna ɓacewa a farkon zagayen haila.',
    visual1Title: 'Mataki da ke da alaƙa da zagayenki',
    visual1Text:
      'Alamomi suna bayyana kafin hailarki kuma yawanci suna sauƙaƙa da zarar ta fara.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text:
      'Ƙarfi da nau’in alamomi na iya bambanta sosai daga mace zuwa mace, da daga zagaye zuwa zagaye.',
    symptoms: [
      {title: 'Ji', text: 'Fushi, damuwa, baƙin ciki, sauyin yanayi'},
      {title: 'Jiki', text: 'Kumburin ciki, ciwo, gajiya, ciwon kai'},
      {title: 'Hali', text: 'Sha’awar sukari, sauyin sha’awar abinci, gajiya'},
      {title: 'Barci', text: 'Wahalar barci ko barci maras natsuwa'},
    ],
    section3Body:
      'Sauye-sauyen hormone, musamman na progesterone da estrogen, suna shafar neurotransmitters na kwakwalwa (serotonin, dopamine), wanda zai iya bayyana alamomin zuciya da na jiki na PMS.',
    tip2Title: 'Hormone suna taka muhimmiyar rawa',
    tip2Text:
      'Sauye-sauyen hormone na iya shafar yanayi, kuzari, barci, da wasu ji na jiki.',
    tips: [
      {title: 'Ci gaba da shan ruwa', text: 'Shan isasshen ruwa yana taimakawa rage kumburin ciki.'},
      {title: 'Ci abinci mai daidaito', text: 'Fifita abinci mai wadatar magnesium, omega-3, da bitamin B.'},
      {title: 'Ci gaba da motsa jiki', text: 'Motsa jiki yana sakin endorphins kuma yana rage damuwa.'},
      {title: 'Sarrafa damuwarki', text: 'Atisayen numfashi, tunani, rubuta littafi… Nemo abin da ke aiki a gare ki.'},
      {title: 'Samun isasshen barci', text: 'Barci mai inganci yana tallafa wa daidaiton hormone.'},
    ],
    consultTitle: 'Yaushe ya kamata ki nemi shawarar likita?',
    consultText:
      'Idan alamomi suna da tsanani sosai kuma suna shafar rayuwarki ta yau da kullum, yana iya zama premenstrual dysphoric disorder (PMDD). Kada ki yi jinkirin tuntuɓar ma’aikacin lafiya.',
    shareMessage: 'Ciwon kafin haila (PMS): fahimtar shi da kyau — AWA',
  },
  am: {
    badge: 'ዑደት እና ደህንነት',
    title: 'ከወር አበባ በፊት ሲንድሮም (PMS)፦\nበተሻለ መረዳት',
    metaDuration: '4 ደቂቃ ንባብ',
    metaValidated: 'የተገመገመ ይዘት',
    intro:
      'ፒኤምኤስ እስከ 10 ሴቶች 8ቱን ይነካል። ድካም፣ ብስጭት፣ እብጠት… መንስኤዎቹን መረዳት እና ትክክለኛ ልማዶችን መከተል የወሩን ይህን ጊዜ በእጅጉ ሊያሻሽል ይችላል።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    contents: [
      'ፒኤምኤስ ምንድን ነው?',
      'የተለመዱ ምልክቶች',
      'ሊሆኑ የሚችሉ መንስኤዎች',
      'የተሻለ ስሜት እንዲሰማሽ ምክሮች',
      'ሐኪም መቼ ማየት?',
    ],
    section1Body:
      'ከወር አበባ በፊት ሲንድሮም ብዙውን ጊዜ ከወር አበባሽ ከ5 እስከ 10 ቀናት በፊት የሚታዩ እና በወር አበባ ዑደት መጀመሪያ የሚጠፉ የአካልና የስሜት ምልክቶችን ያሰባስባል።',
    visual1Title: 'ከዑደትሽ ጋር የተያያዘ ደረጃ',
    visual1Text:
      'ምልክቶቹ ከወር አበባሽ በፊት ይታያሉ እና ብዙውን ጊዜ ከጀመረ በኋላ ይቃለላሉ።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text:
      'የምልክቶቹ ጥንካሬና ዓይነት ከአንዲት ሴት ወደ ሌላዋ እና ከአንዱ ዑደት ወደ ሌላው በጣም ሊለያይ ይችላል።',
    symptoms: [
      {title: 'ስሜቶች', text: 'ብስጭት፣ ጭንቀት፣ ሐዘን፣ የስሜት መለዋወጥ'},
      {title: 'አካላዊ', text: 'እብጠት፣ ህመም፣ ድካም፣ ራስ ምታት'},
      {title: 'ባህሪ', text: 'የስኳር ፍላጎት፣ የምግብ ፍላጎት ለውጥ፣ ድካም'},
      {title: 'እንቅልፍ', text: 'የመተኛት ችግር ወይም ያነሰ የሚያረካ እንቅልፍ'},
    ],
    section3Body:
      'የሆርሞን መለዋወጥ፣ በተለይ የፕሮጄስትሮንና የኢስትሮጅን፣ የአንጎል ኒውሮትራንስሚተሮችን (ሴሮቶኒን፣ ዶፓሚን) ይነካል፤ ይህም የፒኤምኤስን የስሜትና የአካል ምልክቶች ሊያስረዳ ይችላል።',
    tip2Title: 'ሆርሞኖች ቁልፍ ሚና ይጫወታሉ',
    tip2Text:
      'የሆርሞን መለዋወጥ ስሜትን፣ ጉልበትን፣ እንቅልፍን እና አንዳንድ የአካል ስሜቶችን ሊነካ ይችላል።',
    tips: [
      {title: 'በቂ ውሃ ጠጪ', text: 'በቂ ውሃ መጠጣት እብጠትን ለመቀነስ ይረዳል።'},
      {title: 'ሚዛናዊ አመጋገብ ተመገቢ', text: 'በማግኒዚየም፣ በኦሜጋ-3 እና በቢ ቫይታሚኖች የበለጸጉ ምግቦችን ምረጪ።'},
      {title: 'ንቁ ሁኚ', text: 'የአካል እንቅስቃሴ ኢንዶርፊኖችን ይለቃል እና ጭንቀትን ይቀንሳል።'},
      {title: 'ጭንቀትሽን አስተዳድሪ', text: 'የአተነፋፈስ ልምምዶች፣ ማሰላሰል፣ ማስታወሻ መጻፍ… ለአንቺ የሚሠራውን ፈልጊ።'},
      {title: 'በቂ እንቅልፍ ተኚ', text: 'ጥራት ያለው እንቅልፍ የሆርሞን ሚዛንን ይደግፋል።'},
    ],
    consultTitle: 'የሕክምና ምክር መቼ መፈለግ አለብሽ?',
    consultText:
      'ምልክቶቹ በጣም ከባድ ከሆኑ እና የዕለት ሕይወትሽን ከነኩ፣ ከወር አበባ በፊት የሚከሰት ዳይስፎሪክ ዲስኦርደር (PMDD) ሊሆን ይችላል። የጤና ባለሙያ ለማማከር አትዘገዪ።',
    shareMessage: 'ከወር አበባ በፊት ሲንድሮም (PMS)፦ በተሻለ መረዳት — AWA',
  },
  nl: {
    badge: 'CYCLUS & WELZIJN',
    title: 'Premenstrueel syndroom (PMS):\nbeter begrijpen',
    metaDuration: '4 min lezen',
    metaValidated: 'Gecontroleerde inhoud',
    intro:
      'PMS treft tot 8 op de 10 vrouwen. Vermoeidheid, prikkelbaarheid, een opgeblazen gevoel… De oorzaken begrijpen en de juiste gewoonten aannemen kan deze periode van de maand sterk verbeteren.',
    contentsTitle: 'In dit artikel',
    contents: [
      'Wat is PMS?',
      'Veelvoorkomende symptomen',
      'Mogelijke oorzaken',
      'Tips om je beter te voelen',
      'Wanneer een arts raadplegen?',
    ],
    section1Body:
      'Het premenstrueel syndroom omvat lichamelijke en emotionele symptomen die meestal 5 tot 10 dagen voor je menstruatie beginnen en verdwijnen aan het begin van de menstruatiecyclus.',
    visual1Title: 'Een fase die aan je cyclus gekoppeld is',
    visual1Text:
      'De symptomen verschijnen vóór je menstruatie en nemen meestal af zodra die begint.',
    tip1Title: 'Goed om te weten',
    tip1Text:
      'De intensiteit en het type symptomen kunnen sterk verschillen van vrouw tot vrouw en van cyclus tot cyclus.',
    symptoms: [
      {title: 'Emoties', text: 'Prikkelbaarheid, angst, verdriet, stemmingswisselingen'},
      {title: 'Lichamelijk', text: 'Opgeblazen gevoel, pijn, vermoeidheid, hoofdpijn'},
      {title: 'Gedrag', text: 'Trek in suiker, veranderingen in eetlust, vermoeidheid'},
      {title: 'Slaap', text: 'Moeite met slapen of minder rustgevende slaap'},
    ],
    section3Body:
      'Hormonale schommelingen, vooral van progesteron en oestrogeen, beïnvloeden de neurotransmitters in de hersenen (serotonine, dopamine), wat de emotionele en lichamelijke symptomen van PMS kan verklaren.',
    tip2Title: 'Hormonen spelen een sleutelrol',
    tip2Text:
      'Hormonale schommelingen kunnen invloed hebben op stemming, energie, slaap en bepaalde lichamelijke gewaarwordingen.',
    tips: [
      {title: 'Blijf gehydrateerd', text: 'Voldoende water drinken helpt een opgeblazen gevoel te verminderen.'},
      {title: 'Eet evenwichtig', text: 'Kies voor voedingsmiddelen rijk aan magnesium, omega-3 en B-vitamines.'},
      {title: 'Blijf actief', text: 'Lichaamsbeweging geeft endorfines vrij en vermindert stress.'},
      {title: 'Beheers je stress', text: 'Ademhalingsoefeningen, meditatie, dagboek schrijven… Zoek wat bij jou past.'},
      {title: 'Slaap voldoende', text: 'Kwaliteitsslaap ondersteunt het hormonale evenwicht.'},
    ],
    consultTitle: 'Wanneer moet je medisch advies vragen?',
    consultText:
      'Als de symptomen zeer intens zijn en je dagelijks leven beïnvloeden, kan het om premenstruele dysfore stoornis (PMDD) gaan. Aarzel niet een zorgprofessional te raadplegen.',
    shareMessage: 'Premenstrueel syndroom (PMS): beter begrijpen — AWA',
  },
  fi: {
    badge: 'KIERTO JA HYVINVOINTI',
    title: 'Kuukautisia edeltävä oireyhtymä (PMS):\nparempi ymmärtäminen',
    metaDuration: '4 min lukuaika',
    metaValidated: 'Tarkistettu sisältö',
    intro:
      'PMS koskettaa jopa 8:aa naista 10:stä. Väsymys, ärtyisyys, turvotus… Syiden ymmärtäminen ja oikeiden tapojen omaksuminen voi parantaa tätä kuukauden aikaa suuresti.',
    contentsTitle: 'Tässä artikkelissa',
    contents: [
      'Mikä on PMS?',
      'Yleiset oireet',
      'Mahdolliset syyt',
      'Vinkkejä paremman olon saavuttamiseen',
      'Milloin mennä lääkäriin?',
    ],
    section1Body:
      'Kuukautisia edeltävä oireyhtymä kokoaa yhteen fyysisiä ja henkisiä oireita, jotka ilmaantuvat yleensä 5–10 päivää ennen kuukautisia ja häviävät kuukautiskierron alussa.',
    visual1Title: 'Kiertoosi sidottu vaihe',
    visual1Text:
      'Oireet ilmaantuvat ennen kuukautisia ja helpottavat yleensä niiden alettua.',
    tip1Title: 'Hyvä tietää',
    tip1Text:
      'Oireiden voimakkuus ja tyyppi voivat vaihdella paljon naisesta toiseen ja kierrosta toiseen.',
    symptoms: [
      {title: 'Tunteet', text: 'Ärtyisyys, ahdistus, suru, mielialan vaihtelut'},
      {title: 'Fyysiset', text: 'Turvotus, kipu, väsymys, päänsärky'},
      {title: 'Käyttäytyminen', text: 'Sokerinhimo, ruokahalun muutokset, väsymys'},
      {title: 'Uni', text: 'Univaikeudet tai vähemmän virkistävä uni'},
    ],
    section3Body:
      'Hormonaaliset vaihtelut, erityisesti progesteronin ja estrogeenin, vaikuttavat aivojen välittäjäaineisiin (serotoniini, dopamiini), mikä voi selittää PMS:n tunne- ja fyysisiä oireita.',
    tip2Title: 'Hormoneilla on keskeinen rooli',
    tip2Text:
      'Hormonaaliset vaihtelut voivat vaikuttaa mielialaan, energiaan, uneen ja tiettyihin fyysisiin tuntemuksiin.',
    tips: [
      {title: 'Pysy nesteytettynä', text: 'Riittävä veden juominen auttaa vähentämään turvotusta.'},
      {title: 'Syö tasapainoisesti', text: 'Suosi magnesium-, omega-3- ja B-vitamiinipitoisia ruokia.'},
      {title: 'Pysy aktiivisena', text: 'Liikunta vapauttaa endorfiineja ja vähentää stressiä.'},
      {title: 'Hallitse stressiäsi', text: 'Hengitysharjoitukset, meditaatio, päiväkirjan kirjoittaminen… Löydä sinulle sopiva.'},
      {title: 'Nuku riittävästi', text: 'Laadukas uni tukee hormonitasapainoa.'},
    ],
    consultTitle: 'Milloin pitäisi hakea lääketieteellistä neuvoa?',
    consultText:
      'Jos oireet ovat hyvin voimakkaita ja vaikuttavat arkeesi, kyseessä voi olla kuukautisia edeltävä dysforinen häiriö (PMDD). Älä epäröi kääntyä terveydenhuollon ammattilaisen puoleen.',
    shareMessage: 'Kuukautisia edeltävä oireyhtymä (PMS): parempi ymmärtäminen — AWA',
  },
  el: {
    badge: 'ΚΥΚΛΟΣ ΚΑΙ ΕΥΕΞΙΑ',
    title: 'Προεμμηνορροϊκό σύνδρομο (PMS):\nκατανοώντας το καλύτερα',
    metaDuration: '4 λεπτά ανάγνωσης',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro:
      'Το PMS επηρεάζει έως και 8 στις 10 γυναίκες. Κόπωση, ευερεθιστότητα, φούσκωμα… Η κατανόηση των αιτιών του και η υιοθέτηση των σωστών συνηθειών μπορεί να βελτιώσει σημαντικά αυτή την περίοδο του μήνα.',
    contentsTitle: 'Σε αυτό το άρθρο',
    contents: [
      'Τι είναι το PMS;',
      'Συχνά συμπτώματα',
      'Πιθανές αιτίες',
      'Συμβουλές για να νιώθεις καλύτερα',
      'Πότε να επισκεφθείς γιατρό;',
    ],
    section1Body:
      'Το προεμμηνορροϊκό σύνδρομο συγκεντρώνει σωματικά και συναισθηματικά συμπτώματα που εμφανίζονται συνήθως 5 έως 10 ημέρες πριν την περίοδό σου και υποχωρούν στην αρχή του έμμηνου κύκλου.',
    visual1Title: 'Μια φάση που συνδέεται με τον κύκλο σου',
    visual1Text:
      'Τα συμπτώματα εμφανίζονται πριν την περίοδό σου και συνήθως υποχωρούν μόλις αυτή ξεκινήσει.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text:
      'Η ένταση και το είδος των συμπτωμάτων μπορεί να διαφέρουν πολύ από γυναίκα σε γυναίκα και από κύκλο σε κύκλο.',
    symptoms: [
      {title: 'Συναισθήματα', text: 'Ευερεθιστότητα, άγχος, λύπη, εναλλαγές διάθεσης'},
      {title: 'Σωματικά', text: 'Φούσκωμα, πόνος, κόπωση, πονοκέφαλοι'},
      {title: 'Συμπεριφορά', text: 'Λαχτάρα για ζάχαρη, αλλαγές στην όρεξη, κόπωση'},
      {title: 'Ύπνος', text: 'Δυσκολία στον ύπνο ή λιγότερο αναζωογονητικός ύπνος'},
    ],
    section3Body:
      'Οι ορμονικές διακυμάνσεις, ιδίως της προγεστερόνης και του οιστρογόνου, επηρεάζουν τους νευροδιαβιβαστές του εγκεφάλου (σεροτονίνη, ντοπαμίνη), κάτι που μπορεί να εξηγεί τα συναισθηματικά και σωματικά συμπτώματα του PMS.',
    tip2Title: 'Οι ορμόνες παίζουν βασικό ρόλο',
    tip2Text:
      'Οι ορμονικές διακυμάνσεις μπορούν να επηρεάσουν τη διάθεση, την ενέργεια, τον ύπνο και ορισμένες σωματικές αισθήσεις.',
    tips: [
      {title: 'Μείνε ενυδατωμένη', text: 'Η επαρκής πρόσληψη νερού βοηθά να μειωθεί το φούσκωμα.'},
      {title: 'Τρώε ισορροπημένα', text: 'Προτίμησε τρόφιμα πλούσια σε μαγνήσιο, ωμέγα-3 και βιταμίνες Β.'},
      {title: 'Μείνε δραστήρια', text: 'Η σωματική δραστηριότητα απελευθερώνει ενδορφίνες και μειώνει το άγχος.'},
      {title: 'Διαχειρίσου το άγχος σου', text: 'Ασκήσεις αναπνοής, διαλογισμός, ημερολόγιο… Βρες τι σου ταιριάζει.'},
      {title: 'Κοιμήσου αρκετά', text: 'Ο ποιοτικός ύπνος στηρίζει την ορμονική ισορροπία.'},
    ],
    consultTitle: 'Πότε πρέπει να ζητήσεις ιατρική συμβουλή;',
    consultText:
      'Αν τα συμπτώματα είναι πολύ έντονα και επηρεάζουν την καθημερινή σου ζωή, μπορεί να πρόκειται για προεμμηνορροϊκή δυσφορική διαταραχή (PMDD). Μην διστάσεις να συμβουλευτείς έναν επαγγελματία υγείας.',
    shareMessage: 'Προεμμηνορροϊκό σύνδρομο (PMS): κατανοώντας το καλύτερα — AWA',
  },
  fil: {
    badge: 'SIKLO AT KAGINHAWAAN',
    title: 'Premenstrual syndrome (PMS):\nmas pag-unawa rito',
    metaDuration: '4 min na babasahin',
    metaValidated: 'Sinuring nilalaman',
    intro:
      'Nakakaapekto ang PMS sa hanggang 8 sa 10 babae. Pagod, pagiging mainitin ang ulo, pamamaga ng tiyan… Ang pag-unawa sa mga sanhi nito at pagkakaroon ng tamang mga gawi ay lubos na makakapagpabuti sa panahong ito ng buwan.',
    contentsTitle: 'Sa artikulong ito',
    contents: [
      'Ano ang PMS?',
      'Mga karaniwang sintomas',
      'Mga posibleng sanhi',
      'Payo para gumaan ang pakiramdam',
      'Kailan magpapatingin sa doktor?',
    ],
    section1Body:
      'Pinagsasama ng premenstrual syndrome ang mga pisikal at emosyonal na sintomas na karaniwang lumilitaw 5 hanggang 10 araw bago ang iyong regla at nawawala sa simula ng siklo ng regla.',
    visual1Title: 'Isang yugtong nakatali sa iyong siklo',
    visual1Text:
      'Lumilitaw ang mga sintomas bago ang iyong regla at karaniwang gumagaan kapag nagsimula na ito.',
    tip1Title: 'Mabuting malaman',
    tip1Text:
      'Maaaring lubhang mag-iba ang tindi at uri ng mga sintomas mula sa isang babae hanggang sa iba, at mula sa isang siklo hanggang sa susunod.',
    symptoms: [
      {title: 'Emosyon', text: 'Pagiging mainitin ang ulo, pagkabalisa, kalungkutan, pabago-bagong mood'},
      {title: 'Pisikal', text: 'Pamamaga ng tiyan, sakit, pagod, pananakit ng ulo'},
      {title: 'Pag-uugali', text: 'Pagnanasa sa matamis, pagbabago ng gana, pagod'},
      {title: 'Tulog', text: 'Hirap makatulog o hindi gaanong mapayapang tulog'},
    ],
    section3Body:
      'Nakakaapekto ang mga hormonal na pagbabago-bago, partikular sa progesterone at estrogen, sa mga neurotransmitter ng utak (serotonin, dopamine), na maaaring magpaliwanag sa mga emosyonal at pisikal na sintomas ng PMS.',
    tip2Title: 'Malaki ang papel ng mga hormone',
    tip2Text:
      'Ang mga hormonal na pagbabago-bago ay maaaring makaapekto sa mood, enerhiya, tulog, at ilang pisikal na pakiramdam.',
    tips: [
      {title: 'Manatiling hydrated', text: 'Ang pag-inom ng sapat na tubig ay tumutulong na bawasan ang pamamaga ng tiyan.'},
      {title: 'Kumain ng balanseng pagkain', text: 'Paboran ang mga pagkaing mayaman sa magnesium, omega-3, at B vitamins.'},
      {title: 'Manatiling aktibo', text: 'Naglalabas ng endorphins ang pisikal na aktibidad at nagpapababa ng stress.'},
      {title: 'Pangasiwaan ang iyong stress', text: 'Mga ehersisyo sa paghinga, meditasyon, pagsusulat sa journal… Hanapin kung ano ang gumagana sa iyo.'},
      {title: 'Matulog nang sapat', text: 'Sinusuportahan ng de-kalidad na tulog ang hormonal na balanse.'},
    ],
    consultTitle: 'Kailan dapat humingi ng payong medikal?',
    consultText:
      'Kung napakatindi ng mga sintomas at nakakaapekto sa iyong pang-araw-araw na buhay, maaaring premenstrual dysphoric disorder (PMDD) ito. Huwag mag-atubiling kumonsulta sa propesyonal sa kalusugan.',
    shareMessage: 'Premenstrual syndrome (PMS): mas pag-unawa rito — AWA',
  },
  ta: {
    badge: 'சுழற்சியும் நலமும்',
    title: 'மாதவிடாய்க்கு முந்தைய நோய்த்தொகுப்பு (PMS):\nநன்கு புரிந்துகொள்ளுதல்',
    metaDuration: '4 நிமிடம் படிக்க',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro:
      'PMS பத்தில் எட்டுப் பெண்கள் வரை பாதிக்கிறது. சோர்வு, எரிச்சல், வயிறு உப்புசம்… அதன் காரணங்களைப் புரிந்துகொண்டு சரியான பழக்கங்களைக் கடைப்பிடிப்பது மாதத்தின் இந்த நேரத்தைப் பெரிதும் மேம்படுத்தலாம்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    contents: [
      'PMS என்றால் என்ன?',
      'பொதுவான அறிகுறிகள்',
      'சாத்தியமான காரணங்கள்',
      'நன்றாக உணரச் சில குறிப்புகள்',
      'மருத்துவரை எப்போது பார்ப்பது?',
    ],
    section1Body:
      'மாதவிடாய்க்கு முந்தைய நோய்த்தொகுப்பு என்பது பொதுவாக மாதவிடாய்க்கு 5 முதல் 10 நாட்கள் முன்பு தோன்றி, மாதவிடாய்ச் சுழற்சியின் தொடக்கத்தில் மறையும் உடல் மற்றும் உணர்வு அறிகுறிகளின் தொகுப்பு.',
    visual1Title: 'உங்கள் சுழற்சியுடன் இணைந்த ஒரு கட்டம்',
    visual1Text:
      'அறிகுறிகள் உங்கள் மாதவிடாய்க்கு முன் தோன்றி, அது தொடங்கியதும் பொதுவாகத் தணிகின்றன.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text:
      'அறிகுறிகளின் தீவிரமும் வகையும் ஒரு பெண்ணிலிருந்து மற்றொருவருக்கும், ஒரு சுழற்சியிலிருந்து மற்றொன்றுக்கும் மிகவும் மாறுபடலாம்.',
    symptoms: [
      {title: 'உணர்வுகள்', text: 'எரிச்சல், பதற்றம், சோகம், மனநிலை மாற்றங்கள்'},
      {title: 'உடல்', text: 'வயிறு உப்புசம், வலி, சோர்வு, தலைவலி'},
      {title: 'நடத்தை', text: 'இனிப்பு ஆசை, பசி மாற்றங்கள், சோர்வு'},
      {title: 'உறக்கம்', text: 'உறங்குவதில் சிரமம் அல்லது குறைவான நிம்மதியான உறக்கம்'},
    ],
    section3Body:
      'ஹார்மோன் ஏற்ற இறக்கங்கள், குறிப்பாக புரோஜெஸ்டிரோன் மற்றும் ஈஸ்ட்ரோஜனில், மூளையின் நரம்பியல் கடத்திகளை (செரடோனின், டோபமைன்) பாதிக்கின்றன, இது PMS-இன் உணர்வு மற்றும் உடல் அறிகுறிகளை விளக்கலாம்.',
    tip2Title: 'ஹார்மோன்கள் முக்கியப் பங்கு வகிக்கின்றன',
    tip2Text:
      'ஹார்மோன் ஏற்ற இறக்கங்கள் மனநிலை, ஆற்றல், உறக்கம் மற்றும் சில உடல் உணர்வுகளைப் பாதிக்கலாம்.',
    tips: [
      {title: 'நீர்ச்சத்துடன் இருங்கள்', text: 'போதுமான நீர் அருந்துவது வயிறு உப்புசத்தைக் குறைக்க உதவுகிறது.'},
      {title: 'சமச்சீர் உணவை உண்ணுங்கள்', text: 'மெக்னீசியம், ஒமேகா-3 மற்றும் B வைட்டமின்கள் நிறைந்த உணவுகளுக்கு முன்னுரிமை கொடுங்கள்.'},
      {title: 'சுறுசுறுப்பாக இருங்கள்', text: 'உடல் செயல்பாடு எண்டோர்பின்களை வெளியிட்டு மன அழுத்தத்தைக் குறைக்கிறது.'},
      {title: 'மன அழுத்தத்தை நிர்வகியுங்கள்', text: 'சுவாசப் பயிற்சிகள், தியானம், நாட்குறிப்பு எழுதுதல்… உங்களுக்கு எது பொருந்துகிறது என்று கண்டறியுங்கள்.'},
      {title: 'போதுமான உறக்கம் பெறுங்கள்', text: 'தரமான உறக்கம் ஹார்மோன் சமநிலையை ஆதரிக்கிறது.'},
    ],
    consultTitle: 'மருத்துவ ஆலோசனையை எப்போது நாட வேண்டும்?',
    consultText:
      'அறிகுறிகள் மிகத் தீவிரமாக இருந்து உங்கள் அன்றாட வாழ்க்கையைப் பாதித்தால், அது மாதவிடாய்க்கு முந்தைய டிஸ்ஃபோரிக் கோளாறாக (PMDD) இருக்கலாம். ஒரு சுகாதார நிபுணரிடம் ஆலோசனை பெறத் தயங்காதீர்கள்.',
    shareMessage: 'மாதவிடாய்க்கு முந்தைய நோய்த்தொகுப்பு (PMS): நன்கு புரிந்துகொள்ளுதல் — AWA',
  },
  te: {
    badge: 'చక్రం & శ్రేయస్సు',
    title: 'నెలసరికి ముందు సిండ్రోమ్ (PMS):\nమరింత బాగా అర్థం చేసుకోవడం',
    metaDuration: '4 నిమిషాల పఠనం',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro:
      'PMS పది మంది మహిళల్లో ఎనిమిది మంది వరకు ప్రభావితం చేస్తుంది. అలసట, చిరాకు, ఉబ్బరం… దాని కారణాలను అర్థం చేసుకుని సరైన అలవాట్లను పాటించడం నెల యొక్క ఈ సమయాన్ని బాగా మెరుగుపరచగలదు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    contents: [
      'PMS అంటే ఏమిటి?',
      'సాధారణ లక్షణాలు',
      'సాధ్యమైన కారణాలు',
      'బాగా అనిపించడానికి చిట్కాలు',
      'వైద్యుడిని ఎప్పుడు కలవాలి?',
    ],
    section1Body:
      'నెలసరికి ముందు సిండ్రోమ్ అనేది సాధారణంగా మీ నెలసరికి 5 నుండి 10 రోజుల ముందు కనిపించి నెలసరి చక్రం ఆరంభంలో పోయే శారీరక, భావోద్వేగ లక్షణాల సమ్మేళనం.',
    visual1Title: 'మీ చక్రంతో ముడిపడిన ఒక దశ',
    visual1Text:
      'లక్షణాలు మీ నెలసరికి ముందు కనిపించి అది మొదలైన తర్వాత సాధారణంగా తగ్గుతాయి.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text:
      'లక్షణాల తీవ్రత, రకం ఒక మహిళ నుండి మరొకరికి, ఒక చక్రం నుండి మరొక చక్రానికి చాలా మారవచ్చు.',
    symptoms: [
      {title: 'భావోద్వేగాలు', text: 'చిరాకు, ఆందోళన, విచారం, మానసిక స్థితి ఊగిసలాటలు'},
      {title: 'శారీరకం', text: 'ఉబ్బరం, నొప్పి, అలసట, తలనొప్పులు'},
      {title: 'ప్రవర్తన', text: 'తీపి కోరికలు, ఆకలి మార్పులు, అలసట'},
      {title: 'నిద్ర', text: 'నిద్రపోవడంలో కష్టం లేదా తక్కువ విశ్రాంతికరమైన నిద్ర'},
    ],
    section3Body:
      'హార్మోన్ ఊగిసలాటలు, ముఖ్యంగా ప్రొజెస్టిరోన్, ఈస్ట్రోజెన్‌లో, మెదడు నరాల రసాయనాలను (సెరోటోనిన్, డోపమైన్) ప్రభావితం చేస్తాయి, ఇది PMS యొక్క భావోద్వేగ, శారీరక లక్షణాలను వివరించవచ్చు.',
    tip2Title: 'హార్మోన్లు కీలక పాత్ర పోషిస్తాయి',
    tip2Text:
      'హార్మోన్ ఊగిసలాటలు మానసిక స్థితిని, శక్తిని, నిద్రను, కొన్ని శారీరక అనుభూతులను ప్రభావితం చేయగలవు.',
    tips: [
      {title: 'నీటి శాతాన్ని కాపాడుకోండి', text: 'తగినంత నీరు తాగడం ఉబ్బరాన్ని తగ్గించడానికి సహాయపడుతుంది.'},
      {title: 'సమతుల్య ఆహారం తినండి', text: 'మెగ్నీషియం, ఒమేగా-3లు, B విటమిన్లు సమృద్ధిగా ఉన్న ఆహారాలకు ప్రాధాన్యం ఇవ్వండి.'},
      {title: 'చురుకుగా ఉండండి', text: 'శారీరక కార్యకలాపం ఎండోర్ఫిన్లను విడుదల చేసి ఒత్తిడిని తగ్గిస్తుంది.'},
      {title: 'మీ ఒత్తిడిని నిర్వహించండి', text: 'శ్వాస వ్యాయామాలు, ధ్యానం, జర్నల్ రాయడం… మీకు ఏది సరిపోతుందో కనుగొనండి.'},
      {title: 'తగినంత నిద్రపోండి', text: 'నాణ్యమైన నిద్ర హార్మోన్ సమతుల్యతకు తోడ్పడుతుంది.'},
    ],
    consultTitle: 'వైద్య సలహాను ఎప్పుడు కోరాలి?',
    consultText:
      'లక్షణాలు చాలా తీవ్రంగా ఉండి మీ రోజువారీ జీవితాన్ని ప్రభావితం చేస్తే, అది నెలసరికి ముందు డిస్ఫోరిక్ రుగ్మత (PMDD) కావచ్చు. ఒక ఆరోగ్య నిపుణుడిని సంప్రదించడానికి వెనుకాడకండి.',
    shareMessage: 'నెలసరికి ముందు సిండ్రోమ్ (PMS): మరింత బాగా అర్థం చేసుకోవడం — AWA',
  },
  mr: {
    badge: 'पाळी आणि सुदृढता',
    title: 'मासिकपूर्व सिंड्रोम (PMS):\nअधिक चांगले समजून घेणे',
    metaDuration: '4 मिनिटे वाचन',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro:
      'PMS 10 पैकी 8 स्त्रियांपर्यंत परिणाम करतो. थकवा, चिडचिड, पोट फुगणे… त्याची कारणे समजून घेणे आणि योग्य सवयी अंगीकारणे महिन्याचा हा काळ खूप सुधारू शकते.',
    contentsTitle: 'या लेखात',
    contents: [
      'PMS म्हणजे काय?',
      'सामान्य लक्षणे',
      'संभाव्य कारणे',
      'बरे वाटण्यासाठी टिपा',
      'डॉक्टरांना केव्हा भेटावे?',
    ],
    section1Body:
      'मासिकपूर्व सिंड्रोममध्ये शारीरिक आणि भावनिक लक्षणे एकत्र येतात जी सहसा तुमच्या पाळीच्या 5 ते 10 दिवस आधी दिसतात आणि पाळीच्या चक्राच्या सुरुवातीला निघून जातात.',
    visual1Title: 'तुमच्या पाळीशी जोडलेला टप्पा',
    visual1Text:
      'लक्षणे तुमच्या पाळीपूर्वी दिसतात आणि सहसा ती सुरू झाल्यावर कमी होतात.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text:
      'लक्षणांची तीव्रता आणि प्रकार एका स्त्रीपासून दुसऱ्या स्त्रीपर्यंत आणि एका पाळीपासून दुसऱ्या पाळीपर्यंत खूप बदलू शकतात.',
    symptoms: [
      {title: 'भावना', text: 'चिडचिड, चिंता, दुःख, मनःस्थितीतील चढ-उतार'},
      {title: 'शारीरिक', text: 'पोट फुगणे, वेदना, थकवा, डोकेदुखी'},
      {title: 'वर्तन', text: 'साखरेची इच्छा, भूकेतील बदल, थकवा'},
      {title: 'झोप', text: 'झोप लागण्यात अडचण किंवा कमी विश्रांती देणारी झोप'},
    ],
    section3Body:
      'हार्मोनल चढ-उतार, विशेषतः प्रोजेस्टेरॉन आणि इस्ट्रोजेनमधील, मेंदूतील न्यूरोट्रान्समीटर्सवर (सेरोटोनिन, डोपामिन) परिणाम करतात, जे PMS ची भावनिक आणि शारीरिक लक्षणे स्पष्ट करू शकतात.',
    tip2Title: 'हार्मोन्सची मुख्य भूमिका असते',
    tip2Text:
      'हार्मोनल चढ-उतार मनःस्थिती, ऊर्जा, झोप आणि काही शारीरिक जाणिवांवर परिणाम करू शकतात.',
    tips: [
      {title: 'पुरेसे पाणी प्या', text: 'पुरेसे पाणी प्यायल्याने पोट फुगणे कमी होण्यास मदत होते.'},
      {title: 'संतुलित आहार घ्या', text: 'मॅग्नेशियम, ओमेगा-3 आणि ब जीवनसत्त्वांनी समृद्ध पदार्थांना प्राधान्य द्या.'},
      {title: 'सक्रिय राहा', text: 'शारीरिक हालचाल एंडॉर्फिन्स सोडते आणि ताण कमी करते.'},
      {title: 'तुमचा ताण सांभाळा', text: 'श्वासाचे व्यायाम, ध्यान, नोंद लिहिणे… तुम्हाला काय जुळते ते शोधा.'},
      {title: 'पुरेशी झोप घ्या', text: 'दर्जेदार झोप हार्मोनल संतुलनाला आधार देते.'},
    ],
    consultTitle: 'वैद्यकीय सल्ला केव्हा घ्यावा?',
    consultText:
      'लक्षणे खूप तीव्र असल्यास आणि तुमच्या रोजच्या जीवनावर परिणाम करत असल्यास, तो मासिकपूर्व डिसफोरिक डिसऑर्डर (PMDD) असू शकतो. आरोग्य व्यावसायिकाचा सल्ला घ्यायला संकोच करू नका.',
    shareMessage: 'मासिकपूर्व सिंड्रोम (PMS): अधिक चांगले समजून घेणे — AWA',
  },
  gu: {
    badge: 'ચક્ર અને સુખાકારી',
    title: 'માસિક પૂર્વેનું સિન્ડ્રોમ (PMS):\nવધુ સારી રીતે સમજવું',
    metaDuration: '4 મિનિટ વાંચન',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro:
      'PMS દર 10 માંથી 8 સુધી સ્ત્રીઓને અસર કરે છે. થાક, ચીડિયાપણું, પેટનું ફૂલવું… તેનાં કારણો સમજવાથી અને યોગ્ય ટેવો અપનાવવાથી મહિનાનો આ સમય ઘણો સારો બની શકે છે.',
    contentsTitle: 'આ લેખમાં',
    contents: [
      'PMS શું છે?',
      'સામાન્ય લક્ષણો',
      'સંભવિત કારણો',
      'સારું અનુભવવા માટેનાં સૂચનો',
      'ક્યારે ડૉક્ટરને મળવું?',
    ],
    section1Body:
      'માસિક પૂર્વેનું સિન્ડ્રોમ શારીરિક અને ભાવનાત્મક લક્ષણોને એકસાથે લાવે છે, જે સામાન્ય રીતે તમારા માસિકના 5 થી 10 દિવસ પહેલાં દેખાય છે અને માસિક ચક્રની શરૂઆતમાં દૂર થઈ જાય છે.',
    visual1Title: 'તમારા ચક્ર સાથે જોડાયેલો એક તબક્કો',
    visual1Text:
      'લક્ષણો તમારા માસિક પહેલાં દેખાય છે અને માસિક શરૂ થયા પછી સામાન્ય રીતે ઓછાં થાય છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text:
      'લક્ષણોની તીવ્રતા અને પ્રકાર એક સ્ત્રીથી બીજી સ્ત્રીમાં, અને એક ચક્રથી બીજા ચક્રમાં ઘણા બદલાઈ શકે છે.',
    symptoms: [
      {title: 'લાગણીઓ', text: 'ચીડિયાપણું, ચિંતા, ઉદાસી, મૂડમાં ઉતાર-ચઢાવ'},
      {title: 'શારીરિક', text: 'પેટનું ફૂલવું, દુખાવો, થાક, માથાનો દુખાવો'},
      {title: 'વર્તન', text: 'ગળ્યું ખાવાની ઇચ્છા, ભૂખમાં ફેરફાર, થાક'},
      {title: 'ઊંઘ', text: 'ઊંઘવામાં મુશ્કેલી અથવા ઓછી આરામદાયક ઊંઘ'},
    ],
    section3Body:
      'હોર્મોનના ઉતાર-ચઢાવ, ખાસ કરીને પ્રોજેસ્ટેરોન અને એસ્ટ્રોજનના, મગજના ન્યુરોટ્રાન્સમિટર (સેરોટોનિન, ડોપામિન) પર અસર કરે છે, જે PMS નાં ભાવનાત્મક અને શારીરિક લક્ષણો સમજાવી શકે છે.',
    tip2Title: 'હોર્મોન મુખ્ય ભૂમિકા ભજવે છે',
    tip2Text:
      'હોર્મોનના ઉતાર-ચઢાવ મૂડ, ઊર્જા, ઊંઘ અને કેટલીક શારીરિક સંવેદનાઓને અસર કરી શકે છે.',
    tips: [
      {title: 'પૂરતું પાણી પીવો', text: 'પૂરતું પાણી પીવાથી પેટનું ફૂલવું ઘટાડવામાં મદદ મળે છે.'},
      {title: 'સંતુલિત આહાર લો', text: 'મેગ્નેશિયમ, ઓમેગા-3 અને વિટામિન B થી ભરપૂર ખોરાકને પ્રાધાન્ય આપો.'},
      {title: 'સક્રિય રહો', text: 'શારીરિક પ્રવૃત્તિ એન્ડોર્ફિન મુક્ત કરે છે અને તણાવ ઘટાડે છે.'},
      {title: 'તમારા તણાવનું સંચાલન કરો', text: 'શ્વાસની કસરતો, ધ્યાન, ડાયરી લખવી… તમને શું અનુકૂળ આવે છે તે શોધો.'},
      {title: 'પૂરતી ઊંઘ લો', text: 'ગુણવત્તાવાળી ઊંઘ હોર્મોનના સંતુલનને ટેકો આપે છે.'},
    ],
    consultTitle: 'ક્યારે તબીબી સલાહ લેવી જોઈએ?',
    consultText:
      'જો લક્ષણો ખૂબ તીવ્ર હોય અને તમારા રોજિંદા જીવનને અસર કરતાં હોય, તો તે માસિક પૂર્વેનો ડિસ્ફોરિક ડિસઓર્ડર (PMDD) હોઈ શકે છે. આરોગ્ય વ્યાવસાયિકની સલાહ લેવામાં અચકાશો નહીં.',
    shareMessage: 'માસિક પૂર્વેનું સિન્ડ્રોમ (PMS): વધુ સારી રીતે સમજવું — AWA',
  },
  pa: {
    badge: 'ਚੱਕਰ ਅਤੇ ਤੰਦਰੁਸਤੀ',
    title: 'ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦਾ ਸਿੰਡਰੋਮ (PMS):\nਇਸਨੂੰ ਬਿਹਤਰ ਸਮਝਣਾ',
    metaDuration: '4 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro:
      'PMS 10 ਵਿੱਚੋਂ 8 ਔਰਤਾਂ ਤੱਕ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰਦਾ ਹੈ। ਥਕਾਵਟ, ਚਿੜਚਿੜਾਪਣ, ਪੇਟ ਫੁੱਲਣਾ… ਇਸਦੇ ਕਾਰਨਾਂ ਨੂੰ ਸਮਝਣਾ ਅਤੇ ਸਹੀ ਆਦਤਾਂ ਅਪਣਾਉਣਾ ਮਹੀਨੇ ਦੇ ਇਸ ਸਮੇਂ ਨੂੰ ਬਹੁਤ ਬਿਹਤਰ ਬਣਾ ਸਕਦਾ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    contents: [
      'PMS ਕੀ ਹੈ?',
      'ਆਮ ਲੱਛਣ',
      'ਸੰਭਾਵੀ ਕਾਰਨ',
      'ਬਿਹਤਰ ਮਹਿਸੂਸ ਕਰਨ ਦੇ ਸੁਝਾਅ',
      'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲਣਾ ਹੈ?',
    ],
    section1Body:
      'ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦਾ ਸਿੰਡਰੋਮ ਸਰੀਰਕ ਅਤੇ ਭਾਵਨਾਤਮਕ ਲੱਛਣਾਂ ਨੂੰ ਇਕੱਠਾ ਕਰਦਾ ਹੈ ਜੋ ਆਮ ਤੌਰ \'ਤੇ ਮਾਹਵਾਰੀ ਤੋਂ 5 ਤੋਂ 10 ਦਿਨ ਪਹਿਲਾਂ ਦਿਖਾਈ ਦਿੰਦੇ ਹਨ ਅਤੇ ਮਾਹਵਾਰੀ ਚੱਕਰ ਦੀ ਸ਼ੁਰੂਆਤ \'ਤੇ ਖ਼ਤਮ ਹੋ ਜਾਂਦੇ ਹਨ।',
    visual1Title: 'ਤੁਹਾਡੇ ਚੱਕਰ ਨਾਲ ਜੁੜਿਆ ਇੱਕ ਪੜਾਅ',
    visual1Text:
      'ਲੱਛਣ ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦਿਖਾਈ ਦਿੰਦੇ ਹਨ ਅਤੇ ਆਮ ਤੌਰ \'ਤੇ ਇਸਦੇ ਸ਼ੁਰੂ ਹੁੰਦੇ ਹੀ ਘਟ ਜਾਂਦੇ ਹਨ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text:
      'ਲੱਛਣਾਂ ਦੀ ਤੀਬਰਤਾ ਅਤੇ ਕਿਸਮ ਇੱਕ ਔਰਤ ਤੋਂ ਦੂਜੀ ਵਿੱਚ, ਅਤੇ ਇੱਕ ਚੱਕਰ ਤੋਂ ਦੂਜੇ ਵਿੱਚ ਬਹੁਤ ਵੱਖਰੀ ਹੋ ਸਕਦੀ ਹੈ।',
    symptoms: [
      {title: 'ਭਾਵਨਾਵਾਂ', text: 'ਚਿੜਚਿੜਾਪਣ, ਚਿੰਤਾ, ਉਦਾਸੀ, ਮੂਡ ਵਿੱਚ ਉਤਰਾਅ-ਚੜ੍ਹਾਅ'},
      {title: 'ਸਰੀਰਕ', text: 'ਪੇਟ ਫੁੱਲਣਾ, ਦਰਦ, ਥਕਾਵਟ, ਸਿਰ ਦਰਦ'},
      {title: 'ਵਿਹਾਰ', text: 'ਮਿੱਠੇ ਦੀ ਤਲਬ, ਭੁੱਖ ਵਿੱਚ ਬਦਲਾਅ, ਥਕਾਵਟ'},
      {title: 'ਨੀਂਦ', text: 'ਸੌਣ ਵਿੱਚ ਮੁਸ਼ਕਲ ਜਾਂ ਘੱਟ ਆਰਾਮਦਾਇਕ ਨੀਂਦ'},
    ],
    section3Body:
      'ਹਾਰਮੋਨਾਂ ਵਿੱਚ ਉਤਰਾਅ-ਚੜ੍ਹਾਅ, ਖ਼ਾਸ ਕਰਕੇ ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਅਤੇ ਐਸਟ੍ਰੋਜਨ ਵਿੱਚ, ਦਿਮਾਗ਼ ਦੇ ਨਿਊਰੋਟ੍ਰਾਂਸਮੀਟਰਾਂ (ਸੇਰੋਟੋਨਿਨ, ਡੋਪਾਮੀਨ) ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰਦੇ ਹਨ, ਜੋ PMS ਦੇ ਭਾਵਨਾਤਮਕ ਅਤੇ ਸਰੀਰਕ ਲੱਛਣਾਂ ਦੀ ਵਿਆਖਿਆ ਕਰ ਸਕਦਾ ਹੈ।',
    tip2Title: 'ਹਾਰਮੋਨ ਦੀ ਅਹਿਮ ਭੂਮਿਕਾ ਹੁੰਦੀ ਹੈ',
    tip2Text:
      'ਹਾਰਮੋਨਾਂ ਵਿੱਚ ਉਤਰਾਅ-ਚੜ੍ਹਾਅ ਮੂਡ, ਊਰਜਾ, ਨੀਂਦ ਅਤੇ ਕੁਝ ਸਰੀਰਕ ਅਹਿਸਾਸਾਂ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰ ਸਕਦੇ ਹਨ।',
    tips: [
      {title: 'ਪਾਣੀ ਦੀ ਮਾਤਰਾ ਬਣਾਈ ਰੱਖੋ', text: 'ਕਾਫ਼ੀ ਪਾਣੀ ਪੀਣਾ ਪੇਟ ਫੁੱਲਣ ਨੂੰ ਘਟਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।'},
      {title: 'ਸੰਤੁਲਿਤ ਖ਼ੁਰਾਕ ਲਓ', text: 'ਮੈਗਨੀਸ਼ੀਅਮ, ਓਮੇਗਾ-3 ਅਤੇ ਬੀ ਵਿਟਾਮਿਨਾਂ ਨਾਲ ਭਰਪੂਰ ਭੋਜਨ ਨੂੰ ਤਰਜੀਹ ਦਿਓ।'},
      {title: 'ਸਰਗਰਮ ਰਹੋ', text: 'ਸਰੀਰਕ ਸਰਗਰਮੀ ਐਂਡੋਰਫ਼ਿਨ ਛੱਡਦੀ ਹੈ ਅਤੇ ਤਣਾਅ ਘਟਾਉਂਦੀ ਹੈ।'},
      {title: 'ਆਪਣੇ ਤਣਾਅ ਦਾ ਪ੍ਰਬੰਧ ਕਰੋ', text: 'ਸਾਹ ਦੀਆਂ ਕਸਰਤਾਂ, ਧਿਆਨ, ਡਾਇਰੀ ਲਿਖਣਾ… ਉਹ ਲੱਭੋ ਜੋ ਤੁਹਾਡੇ ਲਈ ਕੰਮ ਕਰੇ।'},
      {title: 'ਕਾਫ਼ੀ ਨੀਂਦ ਲਓ', text: 'ਚੰਗੀ ਨੀਂਦ ਹਾਰਮੋਨਾਂ ਦੇ ਸੰਤੁਲਨ ਨੂੰ ਸਹਾਰਾ ਦਿੰਦੀ ਹੈ।'},
    ],
    consultTitle: 'ਡਾਕਟਰੀ ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ?',
    consultText:
      'ਜੇ ਲੱਛਣ ਬਹੁਤ ਤੇਜ਼ ਹੋਣ ਅਤੇ ਤੁਹਾਡੀ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰਨ, ਤਾਂ ਇਹ ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦਾ ਡਿਸਫ਼ੋਰਿਕ ਵਿਕਾਰ (PMDD) ਹੋ ਸਕਦਾ ਹੈ। ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਸਲਾਹ ਕਰਨ ਵਿੱਚ ਝਿਜਕ ਨਾ ਕਰੋ।',
    shareMessage: 'ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਦਾ ਸਿੰਡਰੋਮ (PMS): ਇਸਨੂੰ ਬਿਹਤਰ ਸਮਝਣਾ — AWA',
  },
  my: {
    badge: 'ရာသီစက်ဝန်းနှင့် ကျန်းမာချမ်းသာမှု',
    title: 'ရာသီမလာမီ ရောဂါလက္ခဏာစု (PMS)\nကို ပိုမိုနားလည်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 4 မိနစ်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro:
      'PMS သည် အမျိုးသမီး 10 ဦးတွင် 8 ဦးအထိ ဖြစ်ပွားနိုင်သည်။ ပင်ပန်းနွမ်းနယ်ခြင်း၊ စိတ်တိုလွယ်ခြင်း၊ ဗိုက်ရောင်ခြင်း… ၎င်း၏ အကြောင်းရင်းများကို နားလည်ပြီး သင့်လျော်သော အကျင့်များကို လက်ခံကျင့်သုံးခြင်းဖြင့် လ၏ ဤအချိန်ကို အလွန်တိုးတက်စေနိုင်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    contents: [
      'PMS ဆိုတာ ဘာလဲ။',
      'အဖြစ်များသော ရောဂါလက္ခဏာများ',
      'ဖြစ်နိုင်သော အကြောင်းရင်းများ',
      'ပိုကောင်းလာစေရန် အကြံပြုချက်များ',
      'ဆရာဝန်ကို ဘယ်အချိန်ပြသင့်သလဲ။',
    ],
    section1Body:
      'ရာသီမလာမီ ရောဂါလက္ခဏာစုတွင် ရာသီမလာမီ 5 ရက်မှ 10 ရက်အလိုတွင် များသောအားဖြင့် ပေါ်လာပြီး ရာသီစက်ဝန်း စတင်ချိန်တွင် ပျောက်သွားသော ကိုယ်ခန္ဓာနှင့် စိတ်ခံစားမှုဆိုင်ရာ ရောဂါလက္ခဏာများ စုပေါင်းပါဝင်သည်။',
    visual1Title: 'သင့်ရာသီစက်ဝန်းနှင့် ဆက်စပ်သော ကာလတစ်ခု',
    visual1Text:
      'ရောဂါလက္ခဏာများသည် ရာသီမလာမီ ပေါ်လာပြီး ရာသီစတင်သည်နှင့် များသောအားဖြင့် သက်သာသွားသည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text:
      'ရောဂါလက္ခဏာများ၏ ပြင်းထန်မှုနှင့် အမျိုးအစားသည် အမျိုးသမီးတစ်ဦးနှင့်တစ်ဦးကြား၊ ရာသီစက်ဝန်းတစ်ခုနှင့်တစ်ခုကြား ကျယ်ပြန့်စွာ ကွာခြားနိုင်သည်။',
    symptoms: [
      {title: 'စိတ်ခံစားမှုများ', text: 'စိတ်တိုလွယ်ခြင်း၊ စိုးရိမ်ပူပန်ခြင်း၊ ဝမ်းနည်းခြင်း၊ စိတ်ခံစားမှု အတက်အကျ'},
      {title: 'ကိုယ်ခန္ဓာဆိုင်ရာ', text: 'ဗိုက်ရောင်ခြင်း၊ နာကျင်ခြင်း၊ ပင်ပန်းနွမ်းနယ်ခြင်း၊ ခေါင်းကိုက်ခြင်း'},
      {title: 'အပြုအမူ', text: 'သကြားစားချင်စိတ်၊ စားချင်စိတ် ပြောင်းလဲခြင်း၊ ပင်ပန်းနွမ်းနယ်ခြင်း'},
      {title: 'အိပ်စက်ခြင်း', text: 'အိပ်ရခက်ခြင်း သို့မဟုတ် အိပ်စက်မှု ငြိမ်းချမ်းမှုနည်းခြင်း'},
    ],
    section3Body:
      'ဟော်မုန်းအတက်အကျများ၊ အထူးသဖြင့် ပရိုဂျက်စတီရုန်းနှင့် အက်စ်ထရိုဂျင်တို့သည် ဦးနှောက်၏ အာရုံကြောပေးပို့ဓာတ်များ (ဆီရိုတိုနင်၊ ဒိုပါမင်း) ကို သက်ရောက်ပြီး PMS ၏ စိတ်ခံစားမှုနှင့် ကိုယ်ခန္ဓာဆိုင်ရာ ရောဂါလက္ခဏာများကို ရှင်းပြနိုင်ခြေရှိသည်။',
    tip2Title: 'ဟော်မုန်းများက အဓိကအခန်းကဏ္ဍမှ ပါဝင်သည်',
    tip2Text:
      'ဟော်မုန်းအတက်အကျများသည် စိတ်ခံစားမှု၊ စွမ်းအင်၊ အိပ်စက်ခြင်းနှင့် ကိုယ်ခန္ဓာဆိုင်ရာ ခံစားချက်အချို့ကို သက်ရောက်နိုင်သည်။',
    tips: [
      {title: 'ရေဓာတ်ပြည့်ဝစေပါ', text: 'ရေလုံလောက်စွာ သောက်ခြင်းသည် ဗိုက်ရောင်ခြင်းကို လျော့စေရန် ကူညီသည်။'},
      {title: 'ဟန်ချက်ညီသော အစားအသောက် စားပါ', text: 'မဂ္ဂနီဆီယမ်၊ အိုမီဂါ-3 နှင့် ဘီဗီတာမင်များ ကြွယ်ဝသော အစားအစာများကို ဦးစားပေးပါ။'},
      {title: 'လှုပ်ရှားနေပါ', text: 'ကာယလှုပ်ရှားမှုသည် အင်ဒေါဖင်များကို ထုတ်လွှတ်ပြီး စိတ်ဖိစီးမှုကို လျော့စေသည်။'},
      {title: 'စိတ်ဖိစီးမှုကို စီမံပါ', text: 'အသက်ရှူလေ့ကျင့်ခန်း၊ တရားထိုင်ခြင်း၊ နေ့စဉ်မှတ်တမ်းရေးခြင်း… သင့်အတွက် အဆင်ပြေသည်ကို ရှာပါ။'},
      {title: 'လုံလောက်စွာ အိပ်ပါ', text: 'အရည်အသွေးရှိသော အိပ်စက်ခြင်းသည် ဟော်မုန်းဟန်ချက်ကို ထောက်ပံ့ပေးသည်။'},
    ],
    consultTitle: 'ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်ကို ဘယ်အချိန်တောင်းသင့်သလဲ။',
    consultText:
      'ရောဂါလက္ခဏာများ အလွန်ပြင်းထန်ပြီး နေ့စဉ်ဘဝကို ထိခိုက်လျှင် ရာသီမလာမီ စိတ်ခံစားမှု ဖောက်ပြန်ခြင်း (PMDD) ဖြစ်နိုင်သည်။ ကျန်းမာရေးပညာရှင်နှင့် မတုံ့ဆိုင်းဘဲ ပြသပါ။',
    shareMessage: 'ရာသီမလာမီ ရောဂါလက္ခဏာစု (PMS) ကို ပိုမိုနားလည်ခြင်း — AWA',
  },
  km: {
    badge: 'វដ្តរដូវ និងសុខុមាលភាព',
    title: 'រោគសញ្ញាមុនរដូវ (PMS)៖\nយល់ឱ្យកាន់តែច្បាស់',
    metaDuration: 'អាន 4 នាទី',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro:
      'PMS ប៉ះពាល់ដល់ស្ត្រីរហូតដល់ 8 នាក់ក្នុងចំណោម 10 នាក់។ អស់កម្លាំង ឆាប់ខឹង ហើមពោះ… ការយល់ដឹងអំពីមូលហេតុ និងការអនុវត្តទម្លាប់ត្រឹមត្រូវ អាចធ្វើឱ្យអំឡុងពេលនេះនៃខែប្រសើរឡើងយ៉ាងខ្លាំង។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    contents: [
      'តើ PMS ជាអ្វី?',
      'រោគសញ្ញាទូទៅ',
      'មូលហេតុដែលអាចកើតមាន',
      'គន្លឹះដើម្បីមានអារម្មណ៍ល្អប្រសើរ',
      'ពេលណាគួរជួបវេជ្ជបណ្ឌិត?',
    ],
    section1Body:
      'រោគសញ្ញាមុនរដូវ រួមមានរោគសញ្ញាផ្នែករាងកាយ និងអារម្មណ៍ ដែលជាទូទៅលេចឡើងមុនរដូវ 5 ដល់ 10 ថ្ងៃ ហើយបាត់ទៅនៅដើមវដ្តរដូវ។',
    visual1Title: 'ដំណាក់កាលដែលទាក់ទងនឹងវដ្តរបស់អ្នក',
    visual1Text:
      'រោគសញ្ញាលេចឡើងមុនរដូវ ហើយជាទូទៅបន្ធូរបន្ថយនៅពេលរដូវចាប់ផ្តើម។',
    tip1Title: 'គួរដឹង',
    tip1Text:
      'កម្រិត និងប្រភេទនៃរោគសញ្ញាអាចខុសគ្នាខ្លាំងពីស្ត្រីម្នាក់ទៅម្នាក់ទៀត និងពីវដ្តមួយទៅវដ្តមួយ។',
    symptoms: [
      {title: 'អារម្មណ៍', text: 'ឆាប់ខឹង ថប់បារម្ភ ក្តុកក្តួល អារម្មណ៍ប្រែប្រួល'},
      {title: 'រាងកាយ', text: 'ហើមពោះ ឈឺចាប់ អស់កម្លាំង ឈឺក្បាល'},
      {title: 'អាកប្បកិរិយា', text: 'ចង់ញ៉ាំស្ករ ការប្រែប្រួលនៃចំណង់អាហារ អស់កម្លាំង'},
      {title: 'ដំណេក', text: 'ពិបាកគេង ឬគេងមិនសូវស្កប់ស្កល់'},
    ],
    section3Body:
      'ការប្រែប្រួលនៃអរម្មូន ជាពិសេសប្រូសេស្តេរ៉ូន និងអ៊ែស្ត្រូសែន ប៉ះពាល់ដល់សារធាតុបញ្ជូនប្រសាទក្នុងខួរក្បាល (សេរ៉ូតូនីន ដូផាមីន) ដែលអាចពន្យល់អំពីរោគសញ្ញាផ្នែកអារម្មណ៍ និងរាងកាយនៃ PMS។',
    tip2Title: 'អរម៉ូនមានតួនាទីសំខាន់',
    tip2Text:
      'ការប្រែប្រួលនៃអរម៉ូនអាចប៉ះពាល់ដល់អារម្មណ៍ ថាមពល ដំណេក និងអារម្មណ៍រាងកាយមួយចំនួន។',
    tips: [
      {title: 'ផឹកទឹកឱ្យគ្រប់គ្រាន់', text: 'ការផឹកទឹកឱ្យគ្រប់គ្រាន់ជួយកាត់បន្ថយការហើមពោះ។'},
      {title: 'ញ៉ាំអាហារមានតុល្យភាព', text: 'ជ្រើសរើសអាហារដែលសម្បូរម៉ាញ៉េស្យូម អូមេហ្គា-3 និងវីតាមីន B។'},
      {title: 'រក្សាសកម្មភាពរាងកាយ', text: 'សកម្មភាពរាងកាយបញ្ចេញអ៊ិនដូហ្វីន និងកាត់បន្ថយភាពតានតឹង។'},
      {title: 'គ្រប់គ្រងភាពតានតឹង', text: 'លំហាត់ដកដង្ហើម សមាធិ ការសរសេរកំណត់ហេតុ… សូមរកអ្វីដែលសមស្របនឹងអ្នក។'},
      {title: 'គេងឱ្យបានគ្រប់គ្រាន់', text: 'ដំណេកដែលមានគុណភាពជួយគាំទ្រតុល្យភាពអរម៉ូន។'},
    ],
    consultTitle: 'ពេលណាគួរសុំដំបូន្មានពីវេជ្ជបណ្ឌិត?',
    consultText:
      'ប្រសិនបើរោគសញ្ញាខ្លាំងណាស់ ហើយប៉ះពាល់ដល់ជីវិតប្រចាំថ្ងៃរបស់អ្នក វាអាចជាជំងឺធ្លាក់ទឹកចិត្តមុនរដូវ (PMDD)។ សូមកុំស្ទាក់ស្ទើរក្នុងការពិគ្រោះជាមួយអ្នកជំនាញសុខាភិបាល។',
    shareMessage: 'រោគសញ្ញាមុនរដូវ (PMS)៖ យល់ឱ្យកាន់តែច្បាស់ — AWA',
  },
  lo: {
    badge: 'ຮອບເດືອນ ແລະ ສຸຂະພາບດີ',
    title: 'ອາການກ່ອນມີປະຈຳເດືອນ (PMS):\nເຂົ້າໃຈມັນໃຫ້ດີຂຶ້ນ',
    metaDuration: 'ອ່ານ 4 ນາທີ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro:
      'PMS ສົ່ງຜົນຕໍ່ແມ່ຍິງເຖິງ 8 ໃນ 10 ຄົນ. ອ່ອນເພຍ, ໃຈຮ້ອນ, ທ້ອງອືດ… ການເຂົ້າໃຈສາເຫດ ແລະ ປະຕິບັດນິໄສທີ່ເໝາະສົມສາມາດເຮັດໃຫ້ຊ່ວງເວລານີ້ຂອງເດືອນດີຂຶ້ນຫຼາຍ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    contents: [
      'PMS ແມ່ນຫຍັງ?',
      'ອາການທີ່ພົບເລື້ອຍ',
      'ສາເຫດທີ່ເປັນໄປໄດ້',
      'ເຄັດລັບເພື່ອໃຫ້ຮູ້ສຶກດີຂຶ້ນ',
      'ເວລາໃດຄວນໄປພົບແພດ?',
    ],
    section1Body:
      'ອາການກ່ອນມີປະຈຳເດືອນລວມເອົາອາການທາງກາຍ ແລະ ອາລົມ ທີ່ມັກປາກົດ 5 ຫາ 10 ວັນກ່ອນມີປະຈຳເດືອນ ແລະ ຫາຍໄປເມື່ອເລີ່ມຮອບເດືອນ.',
    visual1Title: 'ໄລຍະທີ່ກ່ຽວຂ້ອງກັບຮອບເດືອນຂອງທ່ານ',
    visual1Text:
      'ອາການປາກົດກ່ອນມີປະຈຳເດືອນ ແລະ ມັກຜ່ອນລົງເມື່ອປະຈຳເດືອນມາ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text:
      'ຄວາມຮຸນແຮງ ແລະ ຊະນິດຂອງອາການອາດແຕກຕ່າງກັນຫຼາຍຈາກແມ່ຍິງຄົນໜຶ່ງໄປອີກຄົນໜຶ່ງ ແລະ ຈາກຮອບເດືອນໜຶ່ງໄປອີກຮອບໜຶ່ງ.',
    symptoms: [
      {title: 'ອາລົມ', text: 'ໃຈຮ້ອນ, ກັງວົນ, ເສົ້າ, ອາລົມປ່ຽນແປງງ່າຍ'},
      {title: 'ທາງກາຍ', text: 'ທ້ອງອືດ, ເຈັບປວດ, ອ່ອນເພຍ, ເຈັບຫົວ'},
      {title: 'ພຶດຕິກຳ', text: 'ຢາກກິນຂອງຫວານ, ຄວາມຢາກອາຫານປ່ຽນແປງ, ອ່ອນເພຍ'},
      {title: 'ການນອນ', text: 'ນອນຫຼັບຍາກ ຫຼື ນອນບໍ່ຫຼັບສະບາຍ'},
    ],
    section3Body:
      'ການປ່ຽນແປງຂອງຮໍໂມນ ໂດຍສະເພາະໂປຣເຈສເຕໂຣນ ແລະ ເອສໂຕຣເຈັນ ມີຜົນຕໍ່ສານສື່ປະສາດໃນສະໝອງ (ເຊໂຣໂທນິນ, ໂດປາມີນ) ເຊິ່ງອາດອະທິບາຍອາການທາງອາລົມ ແລະ ທາງກາຍຂອງ PMS.',
    tip2Title: 'ຮໍໂມນມີບົດບາດສຳຄັນ',
    tip2Text:
      'ການປ່ຽນແປງຂອງຮໍໂມນສາມາດສົ່ງຜົນຕໍ່ອາລົມ, ພະລັງງານ, ການນອນ ແລະ ຄວາມຮູ້ສຶກທາງກາຍບາງຢ່າງ.',
    tips: [
      {title: 'ດື່ມນ້ຳໃຫ້ພຽງພໍ', text: 'ການດື່ມນ້ຳໃຫ້ພຽງພໍຊ່ວຍຫຼຸດອາການທ້ອງອືດ.'},
      {title: 'ກິນອາຫານທີ່ສົມດຸນ', text: 'ເລືອກອາຫານທີ່ອຸດົມດ້ວຍແມັກນີຊຽມ, ໂອເມກາ-3 ແລະ ວິຕາມິນ B.'},
      {title: 'ຮັກສາຄວາມຄຶກຄັກ', text: 'ການເຄື່ອນໄຫວຮ່າງກາຍຊ່ວຍຫຼັ່ງເອັນດອກຟິນ ແລະ ຫຼຸດຄວາມຕຶງຄຽດ.'},
      {title: 'ຈັດການຄວາມຕຶງຄຽດ', text: 'ການຝຶກຫາຍໃຈ, ການນັ່ງສະມາທິ, ການຂຽນບັນທຶກ… ຊອກຫາສິ່ງທີ່ເໝາະກັບທ່ານ.'},
      {title: 'ນອນໃຫ້ພຽງພໍ', text: 'ການນອນທີ່ມີຄຸນນະພາບຊ່ວຍຮັກສາຄວາມສົມດຸນຂອງຮໍໂມນ.'},
    ],
    consultTitle: 'ເວລາໃດຄວນຂໍຄຳແນະນຳທາງການແພດ?',
    consultText:
      'ຖ້າອາການຮຸນແຮງຫຼາຍ ແລະ ກະທົບຊີວິດປະຈຳວັນ ອາດເປັນພາວະຊຶມເສົ້າກ່ອນມີປະຈຳເດືອນ (PMDD). ຢ່າລັງເລທີ່ຈະປຶກສາຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    shareMessage: 'ອາການກ່ອນມີປະຈຳເດືອນ (PMS): ເຂົ້າໃຈມັນໃຫ້ດີຂຶ້ນ — AWA',
  },
} as const);

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PmsArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;

    loadLibraryState().then(() => {
      if (active) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleBookmark = () => {
    setSaved(toggleBookmark(ID));
  };

  const handleShare = () => {
    Share.share({
      message: content.shareMessage,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={event =>
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
        }
        scrollEventThrottle={200}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={t('library.screen.addBookmark')}
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                iconSize={20}
                onPress={handleBookmark}
                variant="tonal"
              />

              <AwaIconButton
                accessibilityLabel={t('libraryArticle.shareA11y')}
                icon="share-variant-outline"
                iconSize={20}
                onPress={handleShare}
                variant="tonal"
              />
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['check-decagram-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={17}
                    color={theme.colors.textMuted}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.contents.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                    {index + 1}.
                  </AwaText>

                  <AwaText variant="bodySmall" style={styles.contentText}>
                    {item}
                  </AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.contents[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={WOMAN}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.visual1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visual1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.contents[1]}
          </AwaText>

          <View style={styles.symptomGrid}>
            {SYMPTOM_ICONS.map((icon, index) => {
              const symptom = content.symptoms[index];
              return (
                <View
                  key={symptom.title}
                  style={styles.symptomItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={25}
                    color={theme.colors.primary}
                  />

                  <AwaText variant="titleSmall" emphasized style={styles.symptomTitle}>
                    {symptom.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.symptomText}>
                    {symptom.text}
                  </AwaText>
                </View>
              );
            })}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.contents[2]}
          </AwaText>

          <Image
            source={CAUSES}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="molecule"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip2Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.contents[3]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tips}>
            {TIP_IMAGES.map((image, index) => {
              const tip = content.tips[index];
              return (
                <View
                  key={tip.title}
                  style={styles.tipCard}>
                  <Image
                    source={image}
                    resizeMode="cover"
                    style={styles.tipImage}
                  />

                  <AwaText variant="titleSmall" emphasized style={styles.tipCardTitle}>
                    {tip.title}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipCardText}>
                    {tip.text}
                  </AwaText>
                </View>
              );
            })}
          </ScrollView>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.contents[4]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            <Image
              source={CONSULT}
              resizeMode="cover"
              style={styles.consultImage}
            />

            <View style={styles.consultContent}>
              <View style={styles.consultTitleRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="heart-pulse"
                    size={21}
                    color={theme.colors.warning}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.consultTitle}>
                  {content.consultTitle}
                </AwaText>
              </View>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.consultText}>
                {content.consultText}
              </AwaText>
            </View>
          </AwaCard>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={4}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },



  article: {
    marginTop: -16,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.background,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },


  title: {
    marginTop: 12,
  },

  metas: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },


  intro: {
    marginTop: 16,
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
  },

  contentRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 24,
  },

  contentText: {
    flex: 1,
  },

  h2: {
    marginTop: 24,
  },

  body: {
    marginTop: 8,
  },

  visualCard: {
    marginTop: 16,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  visualImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },

  visualCopy: {
    flex: 1,
    marginLeft: 12,
  },


  visualText: {
    marginTop: 4,
  },

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 3,
  },

  symptomGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  symptomItem: {
    width: '48.7%',
    minHeight: 126,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },

  symptomTitle: {
    marginTop: 8,
    textAlign: 'center',
  },

  symptomText: {
    marginTop: 4,
    textAlign: 'center',
  },

  wideImage: {
    width: '100%',
    height: 120,
    marginTop: 16,
    borderRadius: 12,
  },

  tips: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 3,
  },

  tipCard: {
    width: 142,
    minHeight: 215,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  tipImage: {
    width: '100%',
    height: 82,
    borderRadius: 12,
  },

  tipCardTitle: {
    marginTop: 8,
  },

  tipCardText: {
    marginTop: 4,
  },

  consultCard: {
    marginTop: 16,
    overflow: 'hidden',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  consultImage: {
    width: '100%',
    height: 135,
  },

  consultContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  consultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.18),
  },

  consultTitle: {
    flex: 1,
    marginLeft: 12,
  },

  consultText: {
    marginTop: 12,
  },

  });
}
