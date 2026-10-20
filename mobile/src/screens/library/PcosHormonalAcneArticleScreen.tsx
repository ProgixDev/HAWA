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

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
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

const ID = 'pcos-acne-hormonale';

const HERO = require('../../assets/images/library/featured-cycle.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icon lists.
const RECOGNIZE_SIGN_ICONS = [
  'map-marker-outline',
  'circle-outline',
  'calendar-refresh',
  'palette-outline',
] as const;

const CARE_HABIT_ICONS = [
  'face-woman-outline',
  'water-off-outline',
  'weather-sunny',
  'hand-back-left-outline',
] as const;

const CONSULT_REASON_ICONS = [
  'clock-alert-outline',
  'emoticon-sad-outline',
  'alert-circle-outline',
  'blur',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK • ACNÉ HORMONALE',
    title: 'Comprendre\nl’acné hormonale',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu éducatif',
    intro:
      'Pourquoi l’acné hormonale peut apparaître avec le SOPK, comment la reconnaître et quelles solutions peuvent aider à la prendre en charge.',
    introSecondary:
      'Elle touche de nombreuses femmes et n’est ni un manque d’hygiène, ni une fatalité : comprendre son origine aide à mieux la prendre en charge.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que l’acné hormonale ?',
      'Pourquoi le SOPK peut provoquer de l’acné ?',
      'Comment reconnaître l’acné hormonale',
      'Acné hormonale et cycle menstruel',
      'Ce qui peut aider',
      'Quand consulter ?',
      'À retenir',
    ],
    h1: 'Qu’est-ce que l’acné hormonale ?',
    body1a:
      'L’acné hormonale est une forme d’acné directement liée aux fluctuations ou à un déséquilibre des hormones, notamment des androgènes. Contrairement à l’acné plus classique de l’adolescence, elle touche souvent des femmes adultes et peut persister ou apparaître après cette période.',
    body1b:
      'Elle se distingue aussi par sa localisation, sa profondeur et sa tendance à réapparaître aux mêmes endroits malgré des soins habituels bien suivis.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'L’acné hormonale n’est pas liée à un manque d’hygiène : se laver davantage le visage ne la fait pas disparaître, et peut même irriter la peau.',
    h2Title: 'Pourquoi le SOPK peut provoquer de l’acné ?',
    body2:
      'Dans le SOPK, un excès relatif d’androgènes stimule les glandes sébacées, qui produisent alors plus de sébum. Certaines peaux sont aussi plus sensibles à ces hormones, ce qui explique pourquoi l’acné peut être marquée même sans déséquilibre majeur mesuré en laboratoire.',
    neutralText:
      'Ce n’est pas une question de volonté : cette sensibilité varie d’une personne à l’autre et ne dépend pas de tes habitudes de vie.',
    h3Title: 'Comment reconnaître l’acné hormonale',
    body3:
      'Certaines caractéristiques reviennent souvent, sans être systématiques :',
    recognizeSigns: [
      'Bas du visage : mâchoire, menton',
      'Boutons plus profonds, parfois douloureux',
      'Réapparition souvent aux mêmes endroits',
      'Rougeurs ou marques qui persistent',
    ],
    h4Title: 'Acné hormonale et cycle menstruel',
    body4:
      'L’acné hormonale peut fluctuer au fil du cycle. Beaucoup de femmes remarquent une poussée dans les jours précédant les règles, lorsque la progestérone augmente puis chute brutalement, stimulant temporairement la production de sébum.',
    highlightTitle: 'Suivre ses poussées',
    highlightText:
      'Noter les dates d’apparition des boutons par rapport à ton cycle peut t’aider, toi et ton dermatologue, à mieux comprendre le lien hormonal.',
    h5Title: 'Ce qui peut aider',
    body5a:
      'Certaines habitudes de soin simples peuvent limiter les poussées, sans les faire disparaître complètement à elles seules :',
    careHabits: [
      'Nettoyer la peau en douceur, matin et soir',
      'Éviter les produits agressifs ou décapants',
      'Protéger sa peau du soleil au quotidien',
      'Ne pas percer ou triturer les boutons',
    ],
    body5b:
      'Selon la situation, un dermatologue ou un gynécologue peut proposer des traitements locaux (crèmes, gels) ou, si nécessaire, un traitement hormonal adapté.',
    alertTitle: 'Pas d’automédication',
    alertText:
      'Les traitements contre l’acné hormonale (locaux ou hormonaux) doivent être prescrits et suivis par un professionnel de santé, en particulier en cas de désir de grossesse.',
    h6Title: 'Quand consulter ?',
    body6:
      'Un avis médical est particulièrement utile dans certaines situations :',
    consultReasons: [
      'Acné qui persiste malgré des soins adaptés',
      'Boutons douloureux ou profonds (nodules, kystes)',
      'Acné sévère ou qui s’aggrave rapidement',
      'Marques ou cicatrices qui s’installent',
    ],
    h7Title: 'À retenir',
    summaryTitle: 'Les points essentiels',
    keyPoints: [
      'L’acné hormonale a une cause identifiable, liée aux androgènes.',
      'Elle touche souvent le bas du visage et peut s’aggraver avant les règles.',
      'Ce n’est ni un manque d’hygiène, ni une fatalité.',
      'Des soins doux et, si besoin, un traitement adapté peuvent l’améliorer.',
      'Un dermatologue ou un gynécologue peut t’accompagner en cas de persistance.',
    ],
    finalNoteTitle: 'Un guide pour mieux comprendre',
    finalNoteText:
      'Cet article est destiné à l’information générale et ne remplace pas une consultation médicale. En cas de doute ou de symptômes persistants, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre l’acné hormonale — AWA',
  },
  en: {
    badge: 'PCOS • HORMONAL ACNE',
    title: 'Understanding\nhormonal acne',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Educational content',
    intro:
      'Why hormonal acne can appear with PCOS, how to recognize it, and what solutions may help manage it.',
    introSecondary:
      'It affects many women and is neither a lack of hygiene nor an inevitability: understanding its origin helps manage it better.',
    contentsTitle: 'In this article',
    topics: [
      'What is hormonal acne?',
      'Why can PCOS cause acne?',
      'How to recognize hormonal acne',
      'Hormonal acne and the menstrual cycle',
      'What can help',
      'When to see a doctor?',
      'Key takeaways',
    ],
    h1: 'What is hormonal acne?',
    body1a:
      'Hormonal acne is a form of acne directly linked to hormonal fluctuations or an imbalance, particularly in androgens. Unlike the more typical acne of adolescence, it often affects adult women and can persist or appear after that period.',
    body1b:
      'It is also distinguished by its location, its depth, and its tendency to reappear in the same spots despite a well-followed regular skincare routine.',
    tip1Title: 'Good to know',
    tip1Text:
      'Hormonal acne is not linked to a lack of hygiene: washing your face more often does not make it go away, and may even irritate the skin.',
    h2Title: 'Why can PCOS cause acne?',
    body2:
      'In PCOS, a relative excess of androgens stimulates the sebaceous glands, which then produce more sebum. Some skin is also more sensitive to these hormones, which explains why acne can be pronounced even without a major imbalance measured in a lab.',
    neutralText:
      'This is not a matter of willpower: this sensitivity varies from person to person and does not depend on your lifestyle habits.',
    h3Title: 'How to recognize hormonal acne',
    body3:
      'Certain features often recur, though not systematically:',
    recognizeSigns: [
      'Lower face: jawline, chin',
      'Deeper, sometimes painful breakouts',
      'Often reappears in the same spots',
      'Redness or marks that persist',
    ],
    h4Title: 'Hormonal acne and the menstrual cycle',
    body4:
      'Hormonal acne can fluctuate throughout the cycle. Many women notice a flare-up in the days before their period, when progesterone rises and then drops sharply, temporarily stimulating sebum production.',
    highlightTitle: 'Tracking your flare-ups',
    highlightText:
      'Noting when breakouts appear relative to your cycle can help you and your dermatologist better understand the hormonal link.',
    h5Title: 'What can help',
    body5a:
      'A few simple care habits can help limit flare-ups, without fully clearing them on their own:',
    careHabits: [
      'Gently cleanse your skin morning and evening',
      'Avoid harsh or stripping products',
      'Protect your skin from the sun daily',
      'Avoid squeezing or picking at breakouts',
    ],
    body5b:
      'Depending on the situation, a dermatologist or gynecologist may suggest topical treatments (creams, gels) or, if needed, a suitable hormonal treatment.',
    alertTitle: 'No self-medicating',
    alertText:
      'Treatments for hormonal acne (topical or hormonal) must be prescribed and monitored by a healthcare professional, particularly if you are hoping to conceive.',
    h6Title: 'When to see a doctor?',
    body6:
      'Medical advice is especially helpful in certain situations:',
    consultReasons: [
      'Acne that persists despite suitable care',
      'Painful or deep breakouts (nodules, cysts)',
      'Severe acne or acne that worsens rapidly',
      'Marks or scars that are settling in',
    ],
    h7Title: 'Key takeaways',
    summaryTitle: 'The essential points',
    keyPoints: [
      'Hormonal acne has an identifiable cause, linked to androgens.',
      'It often affects the lower face and can worsen before your period.',
      'It is neither a lack of hygiene nor an inevitability.',
      'Gentle care and, if needed, a suitable treatment can improve it.',
      'A dermatologist or gynecologist can support you if it persists.',
    ],
    finalNoteTitle: 'A guide to better understanding',
    finalNoteText:
      'This article is for general information only and does not replace a medical consultation. If in doubt or if symptoms persist, seek advice from a healthcare professional.',
    shareMessage: 'Understanding hormonal acne — AWA',
  },
  es: {
    badge: 'SOP • ACNÉ HORMONAL',
    title: 'Comprender\nel acné hormonal',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido educativo',
    intro:
      'Por qué puede aparecer acné hormonal con el SOP, cómo reconocerlo y qué soluciones pueden ayudar a manejarlo.',
    introSecondary:
      'Afecta a muchas mujeres y no es ni una falta de higiene ni una fatalidad: comprender su origen ayuda a manejarlo mejor.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es el acné hormonal?',
      '¿Por qué el SOP puede provocar acné?',
      'Cómo reconocer el acné hormonal',
      'Acné hormonal y ciclo menstrual',
      'Lo que puede ayudar',
      '¿Cuándo consultar?',
      'Para recordar',
    ],
    h1: '¿Qué es el acné hormonal?',
    body1a:
      'El acné hormonal es una forma de acné directamente relacionada con fluctuaciones o un desequilibrio de las hormonas, especialmente de los andrógenos. A diferencia del acné más habitual de la adolescencia, afecta a menudo a mujeres adultas y puede persistir o aparecer después de esa etapa.',
    body1b:
      'También se distingue por su localización, su profundidad y su tendencia a reaparecer en los mismos lugares a pesar de cuidados habituales bien seguidos.',
    tip1Title: 'Dato útil',
    tip1Text:
      'El acné hormonal no está relacionado con una falta de higiene: lavarse más el rostro no lo hace desaparecer, e incluso puede irritar la piel.',
    h2Title: '¿Por qué el SOP puede provocar acné?',
    body2:
      'En el SOP, un exceso relativo de andrógenos estimula las glándulas sebáceas, que producen entonces más sebo. Algunas pieles también son más sensibles a estas hormonas, lo que explica por qué el acné puede ser notable incluso sin un desequilibrio importante medido en laboratorio.',
    neutralText:
      'No es una cuestión de voluntad: esta sensibilidad varía de una persona a otra y no depende de tus hábitos de vida.',
    h3Title: 'Cómo reconocer el acné hormonal',
    body3:
      'Algunas características se repiten a menudo, sin ser sistemáticas:',
    recognizeSigns: [
      'Parte baja del rostro: mandíbula, mentón',
      'Granos más profundos, a veces dolorosos',
      'Reaparición frecuente en los mismos lugares',
      'Enrojecimientos o marcas que persisten',
    ],
    h4Title: 'Acné hormonal y ciclo menstrual',
    body4:
      'El acné hormonal puede fluctuar a lo largo del ciclo. Muchas mujeres notan un brote en los días previos a la regla, cuando la progesterona aumenta y luego cae bruscamente, estimulando temporalmente la producción de sebo.',
    highlightTitle: 'Seguir tus brotes',
    highlightText:
      'Anotar las fechas de aparición de los granos en relación con tu ciclo puede ayudarte, a ti y a tu dermatólogo, a comprender mejor el vínculo hormonal.',
    h5Title: 'Lo que puede ayudar',
    body5a:
      'Algunos hábitos de cuidado sencillos pueden limitar los brotes, sin hacerlos desaparecer por completo por sí solos:',
    careHabits: [
      'Limpiar la piel con suavidad, mañana y noche',
      'Evitar productos agresivos o resecantes',
      'Proteger tu piel del sol a diario',
      'No pinchar ni manipular los granos',
    ],
    body5b:
      'Según la situación, un dermatólogo o un ginecólogo puede proponer tratamientos locales (cremas, geles) o, si es necesario, un tratamiento hormonal adecuado.',
    alertTitle: 'Sin automedicación',
    alertText:
      'Los tratamientos contra el acné hormonal (locales u hormonales) deben ser recetados y supervisados por un profesional de salud, en particular en caso de deseo de embarazo.',
    h6Title: '¿Cuándo consultar?',
    body6:
      'Una opinión médica resulta especialmente útil en ciertas situaciones:',
    consultReasons: [
      'Acné que persiste a pesar de cuidados adecuados',
      'Granos dolorosos o profundos (nódulos, quistes)',
      'Acné grave o que empeora rápidamente',
      'Marcas o cicatrices que se instalan',
    ],
    h7Title: 'Para recordar',
    summaryTitle: 'Los puntos esenciales',
    keyPoints: [
      'El acné hormonal tiene una causa identificable, relacionada con los andrógenos.',
      'Afecta a menudo la parte baja del rostro y puede empeorar antes de la regla.',
      'No es ni una falta de higiene ni una fatalidad.',
      'Cuidados suaves y, si es necesario, un tratamiento adecuado pueden mejorarlo.',
      'Un dermatólogo o un ginecólogo puede acompañarte en caso de persistencia.',
    ],
    finalNoteTitle: 'Una guía para comprender mejor',
    finalNoteText:
      'Este artículo tiene fines de información general y no sustituye una consulta médica. En caso de duda o de síntomas persistentes, pide consejo a un profesional de salud.',
    shareMessage: 'Comprender el acné hormonal — AWA',
  },
  it: {
    badge: 'PCOS • ACNE ORMONALE',
    title: 'Capire\nl’acne ormonale',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto educativo',
    intro: 'Perché l’acne ormonale può comparire con la PCOS, come riconoscerla e quali soluzioni possono aiutare a gestirla.',
    introSecondary: 'Riguarda molte donne e non dipende da una scarsa igiene né è inevitabile: capirne l’origine aiuta a gestirla meglio.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’acne ormonale?',
      'Perché la PCOS può causare acne?',
      'Come riconoscere l’acne ormonale',
      'Acne ormonale e ciclo mestruale',
      'Che cosa può aiutare',
      'Quando rivolgersi al medico?',
      'Punti chiave',
    ],
    h1: 'Che cos’è l’acne ormonale?',
    body1a: 'L’acne ormonale è una forma di acne direttamente legata a fluttuazioni o a uno squilibrio ormonale, in particolare degli androgeni. A differenza della più tipica acne dell’adolescenza, colpisce spesso le donne adulte e può persistere o comparire dopo quel periodo.',
    body1b: 'Si distingue anche per la sede, la profondità e la tendenza a ripresentarsi negli stessi punti nonostante una routine di cura della pelle regolare e seguita con attenzione.',
    tip1Title: 'Da sapere',
    tip1Text: 'L’acne ormonale non è legata a una scarsa igiene: lavare il viso più spesso non la fa scomparire e può addirittura irritare la pelle.',
    h2Title: 'Perché la PCOS può causare acne?',
    body2: 'Nella PCOS, un eccesso relativo di androgeni stimola le ghiandole sebacee, che producono quindi più sebo. Inoltre, alcune pelli sono più sensibili a questi ormoni, il che spiega perché l’acne può essere marcata anche senza un grande squilibrio misurato in laboratorio.',
    neutralText: 'Non è una questione di forza di volontà: questa sensibilità varia da persona a persona e non dipende dalle tue abitudini di vita.',
    h3Title: 'Come riconoscere l’acne ormonale',
    body3: 'Alcune caratteristiche si ripetono spesso, anche se non sempre:',
    recognizeSigns: [
      'Parte inferiore del viso: linea della mandibola, mento',
      'Eruzioni più profonde, a volte dolorose',
      'Ricompare spesso negli stessi punti',
      'Rossori o segni che persistono',
    ],
    h4Title: 'Acne ormonale e ciclo mestruale',
    body4: 'L’acne ormonale può variare nel corso del ciclo. Molte donne notano un peggioramento nei giorni che precedono le mestruazioni, quando il progesterone aumenta e poi cala bruscamente, stimolando temporaneamente la produzione di sebo.',
    highlightTitle: 'Tenere traccia dei peggioramenti',
    highlightText: 'Annotare quando compaiono le eruzioni rispetto al tuo ciclo può aiutare te e la tua dermatologa o il tuo dermatologo a comprendere meglio il legame con gli ormoni.',
    h5Title: 'Che cosa può aiutare',
    body5a: 'Alcune semplici abitudini di cura possono aiutare a limitare i peggioramenti, senza però eliminarli del tutto da sole:',
    careHabits: [
      'Detergere delicatamente la pelle mattina e sera',
      'Evitare prodotti aggressivi o troppo sgrassanti',
      'Proteggere ogni giorno la pelle dal sole',
      'Evitare di schiacciare o grattare le eruzioni',
    ],
    body5b: 'A seconda della situazione, un o una dermatologa o una ginecologa o un ginecologo possono suggerire trattamenti topici (creme, gel) o, se necessario, una terapia ormonale adeguata.',
    alertTitle: 'Niente automedicazione',
    alertText: 'I trattamenti per l’acne ormonale (topici od ormonali) devono essere prescritti e monitorati da un o una professionista sanitario/a, in particolare se speri di avere un figlio o una figlia.',
    h6Title: 'Quando rivolgersi al medico?',
    body6: 'Un parere medico è particolarmente utile in alcune situazioni:',
    consultReasons: [
      'Acne che persiste nonostante cure adeguate',
      'Eruzioni dolorose o profonde (noduli, cisti)',
      'Acne grave o che peggiora rapidamente',
      'Segni o cicatrici che si stanno stabilizzando',
    ],
    h7Title: 'Punti chiave',
    summaryTitle: 'I punti essenziali',
    keyPoints: [
      'L’acne ormonale ha una causa identificabile, legata agli androgeni.',
      'Colpisce spesso la parte inferiore del viso e può peggiorare prima delle mestruazioni.',
      'Non dipende da una scarsa igiene né è inevitabile.',
      'Cure delicate e, se necessario, un trattamento adeguato possono migliorarla.',
      'Un o una dermatologa o una ginecologa o un ginecologo possono accompagnarti se persiste.',
    ],
    finalNoteTitle: 'Una guida per capire meglio',
    finalNoteText: 'Questo articolo ha solo scopo informativo generale e non sostituisce una visita medica. In caso di dubbi o se i sintomi persistono, chiedi consiglio a un o una professionista sanitario/a.',
    shareMessage: 'Capire l’acne ormonale — AWA',
  },
  tr: {
    badge: 'PKOS • HORMONAL AKNE',
    title: 'Hormonal akneyi\nanlamak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Eğitici içerik',
    intro: 'PKOS ile birlikte hormonal akne neden ortaya çıkabilir, nasıl fark edilir ve yönetmeye hangi çözümler yardımcı olabilir.',
    introSecondary: 'Birçok kadını etkiler; ne hijyen eksikliğidir ne de kaçınılmaz bir durumdur: kaynağını anlamak, daha iyi yönetmene yardımcı olur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Hormonal akne nedir?',
      'PKOS neden akneye yol açabilir?',
      'Hormonal akne nasıl fark edilir',
      'Hormonal akne ve adet döngüsü',
      'Neler yardımcı olabilir',
      'Ne zaman doktora görünmeli?',
      'Önemli çıkarımlar',
    ],
    h1: 'Hormonal akne nedir?',
    body1a: 'Hormonal akne, doğrudan hormonal dalgalanmalarla ya da özellikle androjenlerdeki bir dengesizlikle bağlantılı bir akne türüdür. Ergenliğin daha tipik aknesinden farklı olarak çoğunlukla yetişkin kadınları etkiler ve o dönemden sonra sürebilir ya da ortaya çıkabilir.',
    body1b: 'Ayrıca yerleşim yeri, derinliği ve düzenli bir cilt bakım rutini iyi takip edilse bile aynı bölgelerde yeniden ortaya çıkma eğilimiyle de ayrılır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Hormonal akne hijyen eksikliğiyle bağlantılı değildir: yüzünü daha sık yıkamak onu geçirmez ve hatta cildi tahriş edebilir.',
    h2Title: 'PKOS neden akneye yol açabilir?',
    body2: 'PKOS’ta androjenlerin göreceli fazlalığı yağ bezlerini uyarır ve bu bezler daha fazla sebum üretir. Bazı ciltler bu hormonlara karşı daha duyarlıdır; bu da laboratuvarda ölçülen büyük bir dengesizlik olmasa bile aknenin belirgin olabilmesini açıklar.',
    neutralText: 'Bu bir irade meselesi değildir: bu duyarlılık kişiden kişiye değişir ve yaşam tarzı alışkanlıklarına bağlı değildir.',
    h3Title: 'Hormonal akne nasıl fark edilir',
    body3: 'Bazı özellikler sıklıkla tekrarlanır, ancak her zaman değil:',
    recognizeSigns: [
      'Yüzün alt bölümü: çene hattı, çene ucu',
      'Daha derin, bazen ağrılı sivilceler',
      'Çoğunlukla aynı bölgelerde yeniden ortaya çıkar',
      'Geçmeyen kızarıklık ya da izler',
    ],
    h4Title: 'Hormonal akne ve adet döngüsü',
    body4: 'Hormonal akne döngü boyunca dalgalanabilir. Birçok kadın, progesteronun yükselip ardından keskin biçimde düştüğü ve sebum üretimini geçici olarak uyardığı adetten önceki günlerde bir alevlenme fark eder.',
    highlightTitle: 'Alevlenmelerini takip etmek',
    highlightText: 'Sivilcelerin döngüne göre ne zaman ortaya çıktığını not etmek, senin ve dermatoloğunun hormonal bağlantıyı daha iyi anlamasına yardımcı olabilir.',
    h5Title: 'Neler yardımcı olabilir',
    body5a: 'Birkaç basit bakım alışkanlığı, tek başına tamamen geçirmese de alevlenmeleri sınırlamaya yardımcı olabilir:',
    careHabits: [
      'Cildini sabah ve akşam nazikçe temizle',
      'Sert ya da cildi kurutan ürünlerden kaçın',
      'Cildini her gün güneşten koru',
      'Sivilceleri sıkmaktan ya da kurcalamaktan kaçın',
    ],
    body5b: 'Duruma göre bir dermatolog ya da jinekolog topikal tedaviler (krem, jel) ya da gerekirse uygun bir hormonal tedavi önerebilir.',
    alertTitle: 'Kendi kendine ilaç kullanma',
    alertText: 'Hormonal akne tedavileri (topikal ya da hormonal) bir sağlık profesyoneli tarafından reçete edilmeli ve izlenmelidir; özellikle hamile kalmayı umuyorsan.',
    h6Title: 'Ne zaman doktora görünmeli?',
    body6: 'Tıbbi tavsiye özellikle bazı durumlarda yardımcı olur:',
    consultReasons: [
      'Uygun bakıma rağmen süren akne',
      'Ağrılı ya da derin sivilceler (nodül, kist)',
      'Şiddetli akne ya da hızla kötüleşen akne',
      'Kalıcı hale gelen izler ya da yara izleri',
    ],
    h7Title: 'Önemli çıkarımlar',
    summaryTitle: 'Temel noktalar',
    keyPoints: [
      'Hormonal aknenin androjenlerle bağlantılı, belirlenebilir bir nedeni vardır.',
      'Çoğunlukla yüzün alt bölümünü etkiler ve adetten önce kötüleşebilir.',
      'Ne hijyen eksikliğidir ne de kaçınılmaz bir durumdur.',
      'Nazik bakım ve gerekirse uygun bir tedavi onu iyileştirebilir.',
      'Devam ederse bir dermatolog ya da jinekolog seni destekleyebilir.',
    ],
    finalNoteTitle: 'Daha iyi anlamak için bir rehber',
    finalNoteText: 'Bu makale yalnızca genel bilgilendirme amaçlıdır ve bir tıbbi muayenenin yerini tutmaz. Şüphen varsa ya da belirtiler sürüyorsa bir sağlık profesyonelinden tavsiye al.',
    shareMessage: 'Hormonal akneyi anlamak — AWA',
  },
  ru: {
    badge: 'СПКЯ • ГОРМОНАЛЬНЫЕ ВЫСЫПАНИЯ',
    title: 'Понимаем\nгормональные высыпания',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Образовательный материал',
    intro:
      'Почему при СПКЯ могут появляться гормональные высыпания, как их распознать и какие способы могут помочь с ними справиться.',
    introSecondary:
      'Они встречаются у многих женщин и не связаны ни с недостатком гигиены, ни с неизбежностью: понимание их причины помогает лучше с ними справляться.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое гормональные высыпания?',
      'Почему СПКЯ может вызывать высыпания?',
      'Как распознать гормональные высыпания',
      'Гормональные высыпания и менструальный цикл',
      'Что может помочь',
      'Когда стоит обратиться к врачу?',
      'Главное',
    ],
    h1: 'Что такое гормональные высыпания?',
    body1a:
      'Гормональные высыпания — это форма акне, напрямую связанная с гормональными колебаниями или дисбалансом, в частности андрогенов. В отличие от более типичных подростковых высыпаний, они часто встречаются у взрослых женщин и могут сохраняться или появляться уже после этого периода.',
    body1b:
      'Их отличает также расположение, глубина и склонность появляться снова на тех же местах, несмотря на правильный и регулярный уход за кожей.',
    tip1Title: 'Полезно знать',
    tip1Text:
      'Гормональные высыпания не связаны с недостатком гигиены: если умываться чаще, они не исчезнут, а кожа может даже раздражаться.',
    h2Title: 'Почему СПКЯ может вызывать высыпания?',
    body2:
      'При СПКЯ относительный избыток андрогенов стимулирует сальные железы, и они вырабатывают больше кожного сала. Кроме того, у некоторых женщин кожа более чувствительна к этим гормонам, поэтому высыпания могут быть выраженными, даже если в лабораторных анализах нет серьёзного дисбаланса.',
    neutralText:
      'Это вопрос не силы воли: такая чувствительность у каждой своя и не зависит от вашего образа жизни.',
    h3Title: 'Как распознать гормональные высыпания',
    body3:
      'Некоторые особенности встречаются часто, хотя и не всегда:',
    recognizeSigns: [
      'Нижняя часть лица: линия челюсти, подбородок',
      'Более глубокие, иногда болезненные высыпания',
      'Часто появляются снова на тех же местах',
      'Покраснения или следы, которые держатся долго',
    ],
    h4Title: 'Гормональные высыпания и менструальный цикл',
    body4:
      'Гормональные высыпания могут меняться в течение цикла. Многие женщины замечают обострение за несколько дней до месячных, когда прогестерон растёт, а затем резко падает, временно стимулируя выработку кожного сала.',
    highlightTitle: 'Отслеживайте обострения',
    highlightText:
      'Отмечайте, когда появляются высыпания относительно вашего цикла: это поможет вам и вашему дерматологу лучше понять гормональную связь.',
    h5Title: 'Что может помочь',
    body5a:
      'Несколько простых привычек ухода помогают ограничить обострения, хотя сами по себе полностью их не устраняют:',
    careHabits: [
      'Мягко очищайте кожу утром и вечером',
      'Избегайте агрессивных или пересушивающих средств',
      'Ежедневно защищайте кожу от солнца',
      'Не выдавливайте и не ковыряйте высыпания',
    ],
    body5b:
      'В зависимости от ситуации дерматолог или гинеколог может предложить наружные средства (кремы, гели) или, при необходимости, подходящее гормональное лечение.',
    alertTitle: 'Не занимайтесь самолечением',
    alertText:
      'Средства от гормональных высыпаний (наружные или гормональные) должны назначаться и контролироваться медицинским специалистом, особенно если вы надеетесь забеременеть.',
    h6Title: 'Когда стоит обратиться к врачу?',
    body6:
      'Консультация врача особенно полезна в некоторых ситуациях:',
    consultReasons: [
      'Высыпания сохраняются, несмотря на подходящий уход',
      'Болезненные или глубокие высыпания (узлы, кисты)',
      'Тяжёлые высыпания или быстро усиливающиеся',
      'Остающиеся следы или рубцы',
    ],
    h7Title: 'Главное',
    summaryTitle: 'Самое важное',
    keyPoints: [
      'У гормональных высыпаний есть определённая причина, связанная с андрогенами.',
      'Они часто появляются на нижней части лица и могут усиливаться перед месячными.',
      'Они не связаны ни с недостатком гигиены, ни с неизбежностью.',
      'Мягкий уход и, при необходимости, подходящее лечение могут улучшить состояние кожи.',
      'Дерматолог или гинеколог может поддержать вас, если высыпания не проходят.',
    ],
    finalNoteTitle: 'Руководство для лучшего понимания',
    finalNoteText:
      'Эта статья носит исключительно общий информационный характер и не заменяет медицинскую консультацию. При сомнениях или если симптомы сохраняются, обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Понимаем гормональные высыпания — AWA',
  },
  de: {
    badge: 'PCOS • HORMONELLE AKNE',
    title: 'Hormonelle Akne\nverstehen',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Bildungsinhalt',
    intro:
      'Warum bei PCOS hormonelle Akne auftreten kann, wie du sie erkennst und welche Lösungen helfen können, sie in den Griff zu bekommen.',
    introSecondary:
      'Sie betrifft viele Frauen und ist weder mangelnde Hygiene noch unvermeidlich: Wenn du ihre Ursache verstehst, kannst du besser damit umgehen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist hormonelle Akne?',
      'Warum kann PCOS Akne verursachen?',
      'Wie du hormonelle Akne erkennst',
      'Hormonelle Akne und der Menstruationszyklus',
      'Was helfen kann',
      'Wann zur Ärztin oder zum Arzt?',
      'Das Wichtigste in Kürze',
    ],
    h1: 'Was ist hormonelle Akne?',
    body1a:
      'Hormonelle Akne ist eine Form der Akne, die direkt mit hormonellen Schwankungen oder einem Ungleichgewicht zusammenhängt, insbesondere bei den Androgenen. Anders als die typische Akne der Jugend betrifft sie oft erwachsene Frauen und kann über diese Zeit hinaus bestehen bleiben oder erst danach auftreten.',
    body1b:
      'Sie zeichnet sich außerdem durch ihre Lokalisation, ihre Tiefe und ihre Neigung aus, trotz einer konsequenten Hautpflegeroutine immer an denselben Stellen wiederzukehren.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Hormonelle Akne hat nichts mit mangelnder Hygiene zu tun: Häufigeres Gesichtwaschen lässt sie nicht verschwinden und kann die Haut sogar reizen.',
    h2Title: 'Warum kann PCOS Akne verursachen?',
    body2:
      'Bei PCOS regt ein relativer Überschuss an Androgenen die Talgdrüsen an, die dann mehr Talg produzieren. Manche Haut reagiert zudem empfindlicher auf diese Hormone, weshalb die Akne auch ohne ein im Labor gemessenes großes Ungleichgewicht stark ausgeprägt sein kann.',
    neutralText:
      'Das hat nichts mit Willenskraft zu tun: Diese Empfindlichkeit ist von Person zu Person verschieden und hängt nicht von deinen Lebensgewohnheiten ab.',
    h3Title: 'Wie du hormonelle Akne erkennst',
    body3:
      'Bestimmte Merkmale treten häufig auf, wenn auch nicht immer:',
    recognizeSigns: [
      'Unterer Gesichtsbereich: Kieferlinie, Kinn',
      'Tiefere, manchmal schmerzhafte Entzündungen',
      'Tritt oft immer wieder an denselben Stellen auf',
      'Rötungen oder Flecken, die bleiben',
    ],
    h4Title: 'Hormonelle Akne und der Menstruationszyklus',
    body4:
      'Hormonelle Akne kann im Zyklusverlauf schwanken. Viele Frauen bemerken in den Tagen vor der Periode einen Schub, wenn das Progesteron ansteigt und dann stark abfällt und dadurch vorübergehend die Talgproduktion anregt.',
    highlightTitle: 'Schübe festhalten',
    highlightText:
      'Wenn du festhältst, wann die Pickel in Bezug auf deinen Zyklus auftreten, kann das dir und deiner Hautärztin oder deinem Hautarzt helfen, den hormonellen Zusammenhang besser zu verstehen.',
    h5Title: 'Was helfen kann',
    body5a:
      'Einige einfache Pflegegewohnheiten können helfen, Schübe zu begrenzen, ohne sie allein vollständig zum Verschwinden zu bringen:',
    careHabits: [
      'Die Haut morgens und abends sanft reinigen',
      'Aggressive oder austrocknende Produkte vermeiden',
      'Die Haut täglich vor der Sonne schützen',
      'Pickel nicht ausdrücken oder daran herumdrücken',
    ],
    body5b:
      'Je nach Situation kann eine Hautärztin, ein Hautarzt, eine Frauenärztin oder ein Frauenarzt lokale Behandlungen (Cremes, Gele) oder bei Bedarf eine geeignete hormonelle Behandlung vorschlagen.',
    alertTitle: 'Keine Selbstbehandlung',
    alertText:
      'Behandlungen gegen hormonelle Akne (lokal oder hormonell) müssen von medizinischem Fachpersonal verordnet und begleitet werden, insbesondere wenn du dir ein Kind wünschst.',
    h6Title: 'Wann zur Ärztin oder zum Arzt?',
    body6:
      'Ärztlicher Rat ist besonders in bestimmten Situationen hilfreich:',
    consultReasons: [
      'Akne, die trotz passender Pflege bestehen bleibt',
      'Schmerzhafte oder tiefe Entzündungen (Knoten, Zysten)',
      'Starke Akne oder Akne, die sich rasch verschlimmert',
      'Flecken oder Narben, die sich festsetzen',
    ],
    h7Title: 'Das Wichtigste in Kürze',
    summaryTitle: 'Die wichtigsten Punkte',
    keyPoints: [
      'Hormonelle Akne hat eine erkennbare Ursache, die mit den Androgenen zusammenhängt.',
      'Sie betrifft häufig den unteren Gesichtsbereich und kann sich vor der Periode verschlimmern.',
      'Sie ist weder mangelnde Hygiene noch unvermeidlich.',
      'Sanfte Pflege und bei Bedarf eine passende Behandlung können sie verbessern.',
      'Eine Hautärztin, ein Hautarzt, eine Frauenärztin oder ein Frauenarzt kann dich begleiten, wenn sie bestehen bleibt.',
    ],
    finalNoteTitle: 'Ein Ratgeber für mehr Verständnis',
    finalNoteText:
      'Dieser Artikel dient nur der allgemeinen Information und ersetzt keine ärztliche Beratung. Bei Zweifeln oder wenn die Symptome anhalten, lass dich von medizinischem Fachpersonal beraten.',
    shareMessage: 'Hormonelle Akne verstehen – AWA',
  },
  zh: {
      badge: 'PCOS • 激素性痤疮',
      title: '了解\n激素性痤疮',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '为什么多囊卵巢综合征（PCOS）可能伴随激素性痤疮，如何识别它，以及哪些方法可能有助于改善。',
      introSecondary: '它影响着许多女性，既不是不够清洁，也不是无法避免：了解它的成因，有助于更好地应对。',
      contentsTitle: '本文内容',
      topics: [
        '什么是激素性痤疮？',
        '为什么 PCOS 可能引起痤疮？',
        '如何识别激素性痤疮',
        '激素性痤疮与月经周期',
        '哪些方法可能有帮助',
        '什么时候该看医生？',
        '要点回顾',
      ],
      h1: '什么是激素性痤疮？',
      body1a: '激素性痤疮是一种与激素波动或失衡直接相关的痤疮，尤其与雄激素有关。与青春期常见的痤疮不同，它常常出现在成年女性身上，可能在青春期之后持续存在或新出现。',
      body1b: '它的特点还包括出现的位置、深度，以及即使坚持规律护肤，仍倾向于在同一部位反复出现。',
      tip1Title: '小贴士',
      tip1Text: '激素性痤疮与不够清洁无关：更频繁地洗脸并不能让它消失，甚至可能刺激皮肤。',
      h2Title: '为什么 PCOS 可能引起痤疮？',
      body2: '在 PCOS 中，雄激素相对偏多会刺激皮脂腺，使其分泌更多皮脂。有些人的皮肤对这些激素也更敏感，这就解释了为什么即使化验没有测出明显失衡，痤疮也可能比较明显。',
      neutralText: '这与意志力无关：这种敏感性因人而异，也不取决于你的生活习惯。',
      h3Title: '如何识别激素性痤疮',
      body3: '有些特征经常出现，但并非每次都有：',
      recognizeSigns: [
        '多位于面部下半部分：下颌线、下巴',
        '更深的、有时会疼痛的痘痘',
        '常常在同一部位反复出现',
        '红肿或痘印持续不退',
      ],
      h4Title: '激素性痤疮与月经周期',
      body4: '激素性痤疮可能在整个周期中起伏变化。许多女性会发现，在月经来潮前几天痤疮加重，此时孕酮上升后又急剧下降，会暂时刺激皮脂分泌。',
      highlightTitle: '记录你的爆痘情况',
      highlightText: '记下痘痘出现的时间与周期的关系，可以帮助你和皮肤科医生更好地了解其中的激素关联。',
      h5Title: '哪些方法可能有帮助',
      body5a: '一些简单的护肤习惯有助于减少爆痘，但单靠它们不一定能完全消除痤疮：',
      careHabits: [
        '早晚温和清洁皮肤',
        '避免使用刺激性强或过度去脂的产品',
        '每天做好防晒',
        '避免挤压或抠抓痘痘',
      ],
      body5b: '根据具体情况，皮肤科医生或妇科医生可能会建议使用外用药物（乳膏、凝胶），必要时也可能建议使用合适的激素类治疗。',
      alertTitle: '请勿自行用药',
      alertText: '激素性痤疮的治疗（外用或激素类）必须由医疗专业人员开具处方并进行监测，尤其是当你有备孕打算时。',
      h6Title: '什么时候该看医生？',
      body6: '在以下情况下，医生的建议尤其有帮助：',
      consultReasons: [
        '已进行合适的护理，痤疮仍持续存在',
        '痘痘疼痛或位置较深（结节、囊肿）',
        '痤疮严重，或迅速加重',
        '留下了逐渐固定的痘印或疤痕',
      ],
      h7Title: '要点回顾',
      summaryTitle: '核心要点',
      keyPoints: [
        '激素性痤疮有明确的成因，与雄激素有关。',
        '它常出现在面部下半部分，月经来潮前可能加重。',
        '它既不是不够清洁，也不是无法避免。',
        '温和的护理，以及必要时合适的治疗，可以带来改善。',
        '如果持续不退，皮肤科医生或妇科医生可以为你提供帮助。',
      ],
      finalNoteTitle: '帮助你更好理解的指南',
      finalNoteText: '本文仅供一般性参考，不能替代医生的诊疗。如有疑问或症状持续，请咨询医疗专业人员。',
      shareMessage: '了解激素性痤疮 — AWA',
    },
  id: {
    badge: 'PCOS • JERAWAT HORMONAL',
    title: 'Memahami\njerawat hormonal',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten edukatif',
    intro: 'Mengapa jerawat hormonal bisa muncul pada PCOS, bagaimana mengenalinya, dan solusi apa yang mungkin membantu mengatasinya.',
    introSecondary: 'Jerawat ini dialami banyak perempuan dan bukan karena kurang bersih ataupun sesuatu yang tak terelakkan: memahami asalnya membantu mengatasinya dengan lebih baik.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu jerawat hormonal?',
      'Mengapa PCOS bisa menyebabkan jerawat?',
      'Cara mengenali jerawat hormonal',
      'Jerawat hormonal dan siklus menstruasi',
      'Apa yang bisa membantu',
      'Kapan perlu ke dokter?',
      'Poin-poin penting',
    ],
    h1: 'Apa itu jerawat hormonal?',
    body1a: 'Jerawat hormonal adalah jenis jerawat yang berkaitan langsung dengan fluktuasi atau ketidakseimbangan hormon, terutama androgen. Berbeda dengan jerawat remaja yang lebih khas, jerawat ini sering menyerang perempuan dewasa dan bisa menetap atau muncul setelah masa remaja.',
    body1b: 'Jerawat ini juga dikenali dari lokasinya, kedalamannya, dan kecenderungannya muncul kembali di tempat yang sama meskipun rutinitas perawatan kulit sudah dijalani dengan baik.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Jerawat hormonal tidak berkaitan dengan kurangnya kebersihan: mencuci wajah lebih sering tidak membuatnya hilang, dan bahkan bisa mengiritasi kulit.',
    h2Title: 'Mengapa PCOS bisa menyebabkan jerawat?',
    body2: 'Pada PCOS, kelebihan androgen yang relatif merangsang kelenjar sebasea, sehingga menghasilkan lebih banyak sebum. Sebagian kulit juga lebih sensitif terhadap hormon ini, sehingga jerawat bisa tampak jelas bahkan tanpa ketidakseimbangan besar yang terukur di laboratorium.',
    neutralText: 'Ini bukan soal kemauan: kepekaan ini berbeda dari satu orang ke orang lain dan tidak bergantung pada kebiasaan gaya hidupmu.',
    h3Title: 'Cara mengenali jerawat hormonal',
    body3: 'Beberapa ciri sering berulang, meskipun tidak selalu:',
    recognizeSigns: [
      'Wajah bagian bawah: garis rahang, dagu',
      'Jerawat lebih dalam, kadang terasa nyeri',
      'Sering muncul kembali di tempat yang sama',
      'Kemerahan atau bekas yang bertahan lama',
    ],
    h4Title: 'Jerawat hormonal dan siklus menstruasi',
    body4: 'Jerawat hormonal bisa naik turun sepanjang siklus. Banyak perempuan menyadari jerawatnya kambuh beberapa hari sebelum haid, saat progesteron naik lalu turun tajam, yang sementara merangsang produksi sebum.',
    highlightTitle: 'Mencatat jerawat yang kambuh',
    highlightText: 'Mencatat kapan jerawat muncul terhadap siklusmu bisa membantu kamu dan dokter kulitmu memahami kaitan hormonalnya dengan lebih baik.',
    h5Title: 'Apa yang bisa membantu',
    body5a: 'Beberapa kebiasaan perawatan sederhana bisa membantu membatasi kekambuhan, meski tidak menghilangkannya sepenuhnya:',
    careHabits: [
      'Bersihkan kulit dengan lembut pagi dan malam',
      'Hindari produk yang keras atau membuat kulit kering',
      'Lindungi kulit dari sinar matahari setiap hari',
      'Hindari memencet atau mengorek jerawat',
    ],
    body5b: 'Tergantung situasinya, dokter kulit atau dokter kandungan dapat menyarankan perawatan topikal (krim, gel) atau, jika perlu, pengobatan hormonal yang sesuai.',
    alertTitle: 'Jangan mengobati sendiri',
    alertText: 'Pengobatan jerawat hormonal (topikal atau hormonal) harus diresepkan dan dipantau oleh tenaga kesehatan, terutama jika kamu berharap untuk hamil.',
    h6Title: 'Kapan perlu ke dokter?',
    body6: 'Saran medis sangat membantu dalam beberapa situasi:',
    consultReasons: [
      'Jerawat yang menetap meski sudah dirawat dengan tepat',
      'Jerawat yang nyeri atau dalam (nodul, kista)',
      'Jerawat parah atau yang memburuk dengan cepat',
      'Bekas atau jaringan parut yang mulai menetap',
    ],
    h7Title: 'Poin-poin penting',
    summaryTitle: 'Hal-hal pokok',
    keyPoints: [
      'Jerawat hormonal punya penyebab yang bisa dikenali, yang berkaitan dengan androgen.',
      'Jerawat ini sering muncul di wajah bagian bawah dan bisa memburuk sebelum haid.',
      'Jerawat ini bukan karena kurang bersih ataupun sesuatu yang tak terelakkan.',
      'Perawatan yang lembut dan, jika perlu, pengobatan yang sesuai bisa memperbaikinya.',
      'Dokter kulit atau dokter kandungan dapat mendampingimu jika jerawat menetap.',
    ],
    finalNoteTitle: 'Panduan untuk memahami lebih baik',
    finalNoteText: 'Artikel ini hanya untuk informasi umum dan tidak menggantikan konsultasi medis. Jika ragu atau gejala menetap, mintalah saran tenaga kesehatan.',
    shareMessage: 'Memahami jerawat hormonal — AWA',
  },
  hi: {
    badge: 'PCOS • हॉर्मोनल एक्ने',
    title: 'हॉर्मोनल एक्ने को\nसमझना',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'शैक्षणिक सामग्री',
    intro: 'PCOS में हॉर्मोनल एक्ने क्यों हो सकते हैं, इन्हें कैसे पहचानें और कौन-से उपाय इन्हें संभालने में मदद कर सकते हैं।',
    introSecondary: 'यह कई महिलाओं को होता है। यह न तो सफ़ाई की कमी का नतीजा है और न ही कोई अटल बात। इसकी वजह समझने से इसे बेहतर ढंग से संभालने में मदद मिलती है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'हॉर्मोनल एक्ने क्या है?',
      'PCOS में एक्ने क्यों हो सकते हैं?',
      'हॉर्मोनल एक्ने को कैसे पहचानें',
      'हॉर्मोनल एक्ने और मासिक चक्र',
      'क्या मदद कर सकता है',
      'डॉक्टर को कब दिखाएँ?',
      'मुख्य बातें',
    ],
    h1: 'हॉर्मोनल एक्ने क्या है?',
    body1a: 'हॉर्मोनल एक्ने एक तरह के मुँहासे हैं, जो सीधे हॉर्मोन के उतार-चढ़ाव या असंतुलन से जुड़े होते हैं, ख़ासकर एंड्रोजन से। किशोरावस्था के आम मुँहासों से अलग, ये अक्सर वयस्क महिलाओं में होते हैं और उस उम्र के बाद भी बने रह सकते हैं या नए सिरे से उभर सकते हैं।',
    body1b: 'इनकी पहचान इनकी जगह, इनकी गहराई और इस बात से भी होती है कि नियमित और सही स्किनकेयर के बावजूद ये अक्सर उन्हीं जगहों पर दोबारा निकल आते हैं।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'हॉर्मोनल एक्ने का संबंध सफ़ाई की कमी से नहीं है। चेहरा बार-बार धोने से ये ठीक नहीं होते, बल्कि त्वचा में जलन भी हो सकती है।',
    h2Title: 'PCOS में एक्ने क्यों हो सकते हैं?',
    body2: 'PCOS में एंड्रोजन की अपेक्षाकृत अधिकता त्वचा की तेल ग्रंथियों को सक्रिय कर देती है, जिससे वे ज़्यादा सीबम बनाती हैं। कुछ लोगों की त्वचा इन हॉर्मोन के प्रति ज़्यादा संवेदनशील भी होती है। इसी वजह से लैब जाँच में बड़ा असंतुलन न दिखने पर भी एक्ने काफ़ी ज़्यादा हो सकते हैं।',
    neutralText: 'यह इच्छाशक्ति की बात नहीं है। यह संवेदनशीलता हर व्यक्ति में अलग होती है और आपकी जीवनशैली की आदतों पर निर्भर नहीं करती।',
    h3Title: 'हॉर्मोनल एक्ने को कैसे पहचानें',
    body3: 'कुछ विशेषताएँ अक्सर दिखती हैं, हालाँकि हमेशा नहीं:',
    recognizeSigns: [
      'चेहरे का निचला हिस्सा: जबड़े की रेखा और ठोड़ी',
      'ज़्यादा गहरे और कभी-कभी दर्द वाले दाने',
      'अक्सर उन्हीं जगहों पर दोबारा निकलना',
      'लालिमा या ऐसे निशान जो लंबे समय तक रहें',
    ],
    h4Title: 'हॉर्मोनल एक्ने और मासिक चक्र',
    body4: 'हॉर्मोनल एक्ने पूरे चक्र में घटते-बढ़ते रह सकते हैं। कई महिलाएँ पीरियड से पहले के दिनों में इनका बढ़ना देखती हैं, जब प्रोजेस्टेरोन बढ़ता है और फिर अचानक गिर जाता है, जिससे सीबम का बनना कुछ समय के लिए बढ़ जाता है।',
    highlightTitle: 'अपने एक्ने पर नज़र रखें',
    highlightText: 'यह नोट करना कि दाने आपके चक्र के किस समय निकलते हैं, आपको और आपकी त्वचा रोग विशेषज्ञ को हॉर्मोन से जुड़ाव बेहतर समझने में मदद कर सकता है।',
    h5Title: 'क्या मदद कर सकता है',
    body5a: 'देखभाल की कुछ सरल आदतें एक्ने को बढ़ने से रोकने में मदद कर सकती हैं, हालाँकि अकेले इनसे एक्ने पूरी तरह ठीक नहीं होते:',
    careHabits: [
      'सुबह और शाम त्वचा को हल्के हाथों से साफ़ करें',
      'कठोर या त्वचा को रूखा करने वाले प्रोडक्ट से बचें',
      'रोज़ त्वचा को धूप से बचाएँ',
      'दानों को दबाने या नोचने से बचें',
    ],
    body5b: 'स्थिति के अनुसार, त्वचा रोग विशेषज्ञ या स्त्री रोग विशेषज्ञ लगाने वाले इलाज (क्रीम, जेल) या ज़रूरत पड़ने पर कोई उपयुक्त हॉर्मोनल इलाज सुझा सकते हैं।',
    alertTitle: 'ख़ुद से दवा न लें',
    alertText: 'हॉर्मोनल एक्ने के इलाज (लगाने वाले या हॉर्मोनल) किसी स्वास्थ्य विशेषज्ञ द्वारा लिखे और देखरेख में लिए जाने चाहिए, ख़ासकर तब जब आप गर्भधारण की योजना बना रही हों।',
    h6Title: 'डॉक्टर को कब दिखाएँ?',
    body6: 'कुछ स्थितियों में चिकित्सकीय सलाह ख़ास तौर पर मददगार होती है:',
    consultReasons: [
      'उचित देखभाल के बावजूद एक्ने बने रहें',
      'दर्द वाले या गहरे दाने (गाँठें, सिस्ट)',
      'गंभीर एक्ने या ऐसे एक्ने जो तेज़ी से बिगड़ रहे हों',
      'निशान या दाग जो स्थायी होने लगे हों',
    ],
    h7Title: 'मुख्य बातें',
    summaryTitle: 'ज़रूरी बातें',
    keyPoints: [
      'हॉर्मोनल एक्ने की एक पहचानी जा सकने वाली वजह होती है, जो एंड्रोजन से जुड़ी है।',
      'ये अक्सर चेहरे के निचले हिस्से में होते हैं और पीरियड से पहले बढ़ सकते हैं।',
      'यह न तो सफ़ाई की कमी है और न ही कोई अटल बात।',
      'हल्की देखभाल और ज़रूरत पड़ने पर उपयुक्त इलाज से सुधार हो सकता है।',
      'अगर एक्ने बने रहें, तो त्वचा रोग विशेषज्ञ या स्त्री रोग विशेषज्ञ आपकी मदद कर सकते हैं।',
    ],
    finalNoteTitle: 'बेहतर समझ के लिए एक गाइड',
    finalNoteText: 'यह लेख केवल सामान्य जानकारी के लिए है और डॉक्टर से परामर्श का विकल्प नहीं है। संदेह होने पर या लक्षण बने रहने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'हॉर्मोनल एक्ने को समझना — AWA',
  },
  sq: {
    badge: 'PCOS • AKNE HORMONALE',
    title: 'Të kuptojmë\naknen hormonale',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje edukative',
    intro: 'Pse akneja hormonale mund të shfaqet me PCOS, si ta dallosh dhe çfarë zgjidhjesh mund të ndihmojnë për ta menaxhuar.',
    introSecondary: 'Prek shumë gra dhe nuk është as mungesë higjiene, as e pashmangshme: të kuptuarit e origjinës së saj ndihmon ta menaxhosh më mirë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është akneja hormonale?',
      'Pse mund të shkaktojë PCOS akne?',
      'Si ta dallosh aknen hormonale',
      'Akneja hormonale dhe cikli menstrual',
      'Çfarë mund të ndihmojë',
      'Kur duhet të shkosh te mjeku?',
      'Çfarë të mbash mend',
    ],
    h1: 'Çfarë është akneja hormonale?',
    body1a: 'Akneja hormonale është një formë akneje e lidhur drejtpërdrejt me luhatjet hormonale ose me një çekuilibër, sidomos në androgjenet. Ndryshe nga akneja më tipike e adoleshencës, ajo prek shpesh gratë e rritura dhe mund të vazhdojë ose të shfaqet pas asaj periudhe.',
    body1b: 'Dallohet edhe nga vendndodhja, thellësia dhe prirja për t’u shfaqur përsëri në të njëjtat vende, pavarësisht një rutine të rregullt kujdesi për lëkurën që ndiqet mirë.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Akneja hormonale nuk lidhet me mungesën e higjienës: larja më e shpeshtë e fytyrës nuk e heq dhe mund edhe ta irritojë lëkurën.',
    h2Title: 'Pse mund të shkaktojë PCOS akne?',
    body2: 'Në PCOS, një tepricë relative e androgjeneve stimulon gjëndrat dhjamore, të cilat prodhojnë më shumë dhjamë. Disa lëkura janë gjithashtu më të ndjeshme ndaj këtyre hormoneve, gjë që shpjegon pse akneja mund të jetë e theksuar edhe pa një çekuilibër të madh të matur në laborator.',
    neutralText: 'Nuk është çështje vullneti: kjo ndjeshmëri ndryshon nga një person te tjetri dhe nuk varet nga zakonet e tua të jetesës.',
    h3Title: 'Si ta dallosh aknen hormonale',
    body3: 'Disa veçori përsëriten shpesh, megjithëse jo gjithmonë:',
    recognizeSigns: [
      'Pjesa e poshtme e fytyrës: vija e nofullës, mjekra',
      'Puçra më të thella, ndonjëherë të dhimbshme',
      'Shpesh shfaqet përsëri në të njëjtat vende',
      'Skuqje ose shenja që mbeten',
    ],
    h4Title: 'Akneja hormonale dhe cikli menstrual',
    body4: 'Akneja hormonale mund të ndryshojë gjatë ciklit. Shumë gra vërejnë një përkeqësim në ditët para menstruacioneve, kur progesteroni rritet e pastaj bie ndjeshëm, duke stimuluar përkohësisht prodhimin e dhjamit.',
    highlightTitle: 'Ndiq përkeqësimet e tua',
    highlightText: 'Të shënosh kur shfaqen puçrat në raport me ciklin tënd mund të ndihmojë ty dhe dermatologun tënd ta kuptoni më mirë lidhjen hormonale.',
    h5Title: 'Çfarë mund të ndihmojë',
    body5a: 'Disa zakone të thjeshta kujdesi mund të ndihmojnë në kufizimin e përkeqësimeve, pa e pastruar plotësisht aknen vetvetiu:',
    careHabits: [
      'Pastro lëkurën butësisht në mëngjes dhe në mbrëmje',
      'Shmang produktet agresive ose që e thajnë lëkurën',
      'Mbroje lëkurën nga dielli çdo ditë',
      'Shmang shtrydhjen ose gërvishtjen e puçrave',
    ],
    body5b: 'Në varësi të situatës, një dermatolog ose gjinekolog mund të propozojë trajtime lokale (kremra, xhel) ose, nëse është e nevojshme, një trajtim hormonal të përshtatshëm.',
    alertTitle: 'Pa vetëmjekim',
    alertText: 'Trajtimet për aknen hormonale (lokale ose hormonale) duhet të përshkruhen dhe të ndiqen nga një profesionist i shëndetësisë, sidomos nëse shpreson të mbetesh shtatzënë.',
    h6Title: 'Kur duhet të shkosh te mjeku?',
    body6: 'Këshilla mjekësore është veçanërisht e dobishme në disa situata:',
    consultReasons: [
      'Akne që vazhdon pavarësisht nga kujdesi i përshtatshëm',
      'Puçra të dhimbshme ose të thella (nyje, kista)',
      'Akne e rëndë ose që përkeqësohet shpejt',
      'Shenja ose vragë që po mbeten',
    ],
    h7Title: 'Çfarë të mbash mend',
    summaryTitle: 'Pikat kryesore',
    keyPoints: [
      'Akneja hormonale ka një shkak të identifikueshëm, të lidhur me androgjenet.',
      'Prek shpesh pjesën e poshtme të fytyrës dhe mund të përkeqësohet para menstruacioneve.',
      'Nuk është as mungesë higjiene, as e pashmangshme.',
      'Kujdesi i butë dhe, nëse është e nevojshme, një trajtim i përshtatshëm mund ta përmirësojë.',
      'Një dermatolog ose gjinekolog mund të të mbështesë nëse vazhdon.',
    ],
    finalNoteTitle: 'Një udhëzues për të kuptuar më mirë',
    finalNoteText: 'Ky artikull është vetëm për informim të përgjithshëm dhe nuk zëvendëson një konsultë mjekësore. Në rast dyshimi ose nëse simptomat vazhdojnë, kërko këshillë nga një profesionist i shëndetësisë.',
    shareMessage: 'Të kuptojmë aknen hormonale — AWA',
  },
  ja: {
    badge: 'PCOS • ホルモンバランスによるニキビ',
    title: 'ホルモンバランスによる\nニキビを知る',
    metaDuration: '読了目安7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '教育的な内容',
    intro: 'PCOSでホルモンバランスによるニキビが出ることがある理由、見分け方、対処に役立つ方法を紹介します。',
    introSecondary: '多くの女性に起こるもので、清潔にしていないからでも、避けられないものでもありません。原因を知ることで、うまく付き合いやすくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      'ホルモンバランスによるニキビとは',
      'PCOSでニキビができるのはなぜ？',
      'ホルモンバランスによるニキビの見分け方',
      'ホルモンバランスによるニキビと生理周期',
      '役立つこと',
      '医師に相談するのはどんなとき？',
      '重要なポイント',
    ],
    h1: 'ホルモンバランスによるニキビとは',
    body1a: 'ホルモンバランスによるニキビとは、ホルモンの変動や乱れ、特にアンドロゲン（男性ホルモン）の影響と直接関係しているニキビのことです。思春期によく見られるニキビとは異なり、成人女性に多く、その時期を過ぎても続いたり、新たに現れたりすることがあります。',
    body1b: 'できる場所や深さに特徴があり、毎日きちんとスキンケアをしていても同じ場所に繰り返しできやすい点も、見分けるポイントです。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'ホルモンバランスによるニキビは、清潔にしていないことが原因ではありません。洗顔の回数を増やしても治らず、かえって肌を刺激してしまうこともあります。',
    h2Title: 'PCOSでニキビができるのはなぜ？',
    body2: 'PCOSでは、アンドロゲンが相対的に多くなることで皮脂腺が刺激され、皮脂が多く作られるようになります。また、これらのホルモンに対して敏感な肌質の人もいるため、検査でわかる大きな乱れがなくても、ニキビがはっきり現れることがあります。',
    neutralText: 'これは気持ちの持ちようの問題ではありません。この敏感さには個人差があり、生活習慣によって決まるものではありません。',
    h3Title: 'ホルモンバランスによるニキビの見分け方',
    body3: '必ずというわけではありませんが、次のような特徴がよく見られます。',
    recognizeSigns: [
      '顔の下半分（フェイスライン、あご）にできる',
      '深く、ときに痛みを伴うニキビができる',
      '同じ場所に繰り返しできやすい',
      '赤みや跡が残る',
    ],
    h4Title: 'ホルモンバランスによるニキビと生理周期',
    body4: 'ホルモンバランスによるニキビは、周期の中で変動することがあります。生理の数日前に悪化したと感じる人が多く、この時期はプロゲステロンが上昇したあと急激に低下し、一時的に皮脂の分泌が促されます。',
    highlightTitle: '悪化する時期を記録する',
    highlightText: 'ニキビが出る時期を周期と合わせて記録しておくと、ホルモンとの関係を、ご自身も皮膚科医も把握しやすくなります。',
    h5Title: '役立つこと',
    body5a: 'いくつかの簡単なケアで悪化を抑えやすくなりますが、それだけで完全に治るわけではありません。',
    careHabits: [
      '朝と夜にやさしく洗顔する',
      '刺激の強い製品や、皮脂を取りすぎる製品を避ける',
      '毎日日焼けから肌を守る',
      'ニキビをつぶしたり、いじったりしない',
    ],
    body5b: '状況によっては、皮膚科医や婦人科医が、塗り薬（クリーム、ジェル）や、必要に応じて適したホルモン治療を提案することがあります。',
    alertTitle: '自己判断で薬を使わない',
    alertText: 'ホルモンバランスによるニキビの治療（塗り薬もホルモン治療も）は、医療従事者の処方と経過観察のもとで行う必要があります。特に妊娠を望んでいる場合は注意してください。',
    h6Title: '医師に相談するのはどんなとき？',
    body6: '次のような場合は、特に医師への相談が役立ちます。',
    consultReasons: [
      '適切なケアをしても続くニキビ',
      '痛みのある、または深いニキビ（結節、嚢腫）',
      '重症のニキビ、または急速に悪化するニキビ',
      '跡や傷跡が残りはじめている',
    ],
    h7Title: '重要なポイント',
    summaryTitle: '大切なこと',
    keyPoints: [
      'ホルモンバランスによるニキビには、アンドロゲンに関係する、はっきりした原因があります。',
      '顔の下半分によくでき、生理前に悪化することがあります。',
      '清潔にしていないからでも、避けられないものでもありません。',
      'やさしいケアと、必要に応じた適切な治療で改善が期待できます。',
      '続く場合は、皮膚科医や婦人科医に相談できます。',
    ],
    finalNoteTitle: '理解を深めるためのガイド',
    finalNoteText: 'この記事は一般的な情報の提供のみを目的としており、医師の診察に代わるものではありません。気になることがある場合や症状が続く場合は、医療従事者に相談してください。',
    shareMessage: 'ホルモンバランスによるニキビを知る — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosHormonalAcneArticleScreen({
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
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      mounted = false;
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
        onScroll={event =>
          saveScrollPosition(ID, event.nativeEvent.contentOffset.y)
        }
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        {/* HERO */}
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
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
                icon={saved ? 'bookmark' : 'bookmark-outline'}
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
          {/* HEADER */}
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['book-open-page-variant-outline', content.metaType],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{text}</AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.introSecondary}>
            {content.introSecondary}
          </AwaText>

          {/* CONTENTS */}
          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodySmall" style={styles.contentText}>{item}</AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {/* 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.h1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1a}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1b}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.h2Title}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>
              {content.neutralText}
            </AwaText>
          </AwaCard>

          {/* 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.h3Title}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <View style={styles.daily}>
            {RECOGNIZE_SIGN_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {content.recognizeSigns[index]}
                </AwaText>
              </View>
            ))}
          </View>

          {/* 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.h4Title}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>{content.highlightTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.h5Title}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5a}
          </AwaText>

          <View style={styles.daily}>
            {CARE_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {content.careHabits[index]}
                </AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5b}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons name="doctor" size={24} color={theme.colors.warning} />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          {/* 6 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.h6Title}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body6}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {CONSULT_REASON_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.consultText}>
                  {content.consultReasons[index]}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* 7 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.h7Title}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <AwaText variant="titleMedium" emphasized>{content.summaryTitle}</AwaText>
            </View>

            {content.keyPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons name="check" size={17} color={theme.colors.success} />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* FINAL NOTE */}
          <AwaCard variant="filled" padding="none" style={styles.finalNote}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={23}
              color={theme.colors.textMuted}
            />

            <View style={styles.finalNoteCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.finalNoteTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.finalNoteText}>
                {content.finalNoteText}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 32},
  heroWrap: {height: 245, backgroundColor: theme.colors.surfaceSecondary},
  hero: {width: '100%', height: '100%'},
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {flexDirection: 'row', gap: 8},
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
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  intro: {
    marginTop: 16,
  },
  introSecondary: {
    marginTop: 8,
  },
  contents: {
    marginTop: 20,
    padding: 16,
  },
  contentsTitle: {marginBottom: 8},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  highlightBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  highlightCopy: {flex: 1, marginLeft: 12},
  highlightText: {
    marginTop: 4,
  },
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  consultCard: {
    marginTop: 16,
    padding: 12,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 12,
  },
  summaryCard: {
    marginTop: 16,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {flex: 1},
  finalNote: {
    marginTop: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  finalNoteCopy: {flex: 1, marginLeft: 12},
  finalNoteText: {
    marginTop: 4,
  },
  });
}
