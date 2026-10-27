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
