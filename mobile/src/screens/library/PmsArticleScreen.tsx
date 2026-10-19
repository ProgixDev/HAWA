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
const CONTENT = {
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
} as const;

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
