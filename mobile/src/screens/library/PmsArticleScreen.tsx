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
