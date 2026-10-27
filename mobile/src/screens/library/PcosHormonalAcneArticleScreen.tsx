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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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
const CONTENT = withBrazilianPortuguese('PcosHormonalAcne', {
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
  ko: {
    badge: 'PCOS • 호르몬성 여드름',
    title: '호르몬성 여드름,\n제대로 이해하기',
    metaDuration: '읽는 데 7분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '교육용 콘텐츠',
    intro: '다낭성 난소 증후군(PCOS)과 함께 호르몬성 여드름이 나타날 수 있는 이유, 알아보는 방법, 관리에 도움이 될 수 있는 방법을 알아봐요.',
    introSecondary: '많은 여성이 겪는 일이고, 위생이 부족해서도 피할 수 없는 일도 아니에요. 원인을 이해하면 더 잘 관리할 수 있어요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '호르몬성 여드름이란?',
      'PCOS가 여드름을 일으킬 수 있는 이유',
      '호르몬성 여드름 알아보는 방법',
      '호르몬성 여드름과 생리 주기',
      '도움이 될 수 있는 방법',
      '언제 의사를 만나야 할까요?',
      '핵심 정리',
    ],
    h1: '호르몬성 여드름이란?',
    body1a: '호르몬성 여드름은 호르몬 변동이나 불균형, 특히 안드로겐의 불균형과 직접 관련된 여드름이에요. 청소년기에 흔한 여드름과 달리 성인 여성에게 자주 나타나고, 그 시기가 지난 뒤에도 계속되거나 새로 생길 수 있어요.',
    body1b: '생기는 위치와 깊이, 그리고 피부 관리를 꾸준히 잘해도 같은 자리에 다시 생기는 경향이 있다는 점도 특징이에요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '호르몬성 여드름은 위생이 부족해서 생기는 것이 아니에요. 세안을 더 자주 한다고 없어지지 않고, 오히려 피부를 자극할 수도 있어요.',
    h2Title: 'PCOS가 여드름을 일으킬 수 있는 이유',
    body2: 'PCOS에서는 안드로겐이 상대적으로 많아져 피지샘을 자극하고, 그 결과 피지가 더 많이 만들어져요. 이 호르몬에 더 민감한 피부도 있어서, 검사에서 큰 불균형이 확인되지 않아도 여드름이 뚜렷하게 나타날 수 있어요.',
    neutralText: '의지의 문제가 아니에요. 이런 민감성은 사람마다 다르고 생활 습관에 달려 있지 않아요.',
    h3Title: '호르몬성 여드름 알아보는 방법',
    body3: '항상 그런 것은 아니지만, 다음과 같은 특징이 자주 반복돼요.',
    recognizeSigns: [
      '얼굴 아랫부분: 턱선, 턱',
      '더 깊고 때로는 아픈 여드름',
      '같은 자리에 자주 다시 생김',
      '붉은기나 자국이 오래 남음',
    ],
    h4Title: '호르몬성 여드름과 생리 주기',
    body4: '호르몬성 여드름은 주기에 따라 달라질 수 있어요. 많은 여성이 생리 전 며칠 동안 여드름이 심해지는 것을 느껴요. 이때 프로게스테론이 높아졌다가 급격히 떨어지면서 일시적으로 피지 분비를 자극하기 때문이에요.',
    highlightTitle: '여드름이 심해지는 때 기록하기',
    highlightText: '여드름이 생기는 시기를 주기와 함께 기록해 두면, 호르몬과의 관계를 본인과 피부과 의사가 더 잘 이해하는 데 도움이 될 수 있어요.',
    h5Title: '도움이 될 수 있는 방법',
    body5a: '간단한 관리 습관으로 여드름이 심해지는 것을 줄일 수 있어요. 다만 이것만으로 완전히 없어지지는 않아요.',
    careHabits: [
      '아침과 저녁에 순하게 세안하기',
      '자극이 강하거나 피부를 건조하게 만드는 제품 피하기',
      '매일 햇빛으로부터 피부 보호하기',
      '여드름을 짜거나 뜯지 않기',
    ],
    body5b: '상황에 따라 피부과 의사나 산부인과 의사가 바르는 치료(크림, 젤)를 권하거나, 필요하면 알맞은 호르몬 치료를 제안할 수 있어요.',
    alertTitle: '임의로 약을 쓰지 마세요',
    alertText: '호르몬성 여드름 치료(바르는 치료나 호르몬 치료)는 반드시 의료 전문가의 처방과 관리를 받아야 해요. 임신을 계획하고 있다면 더욱 그래요.',
    h6Title: '언제 의사를 만나야 할까요?',
    body6: '다음과 같은 경우에는 의료 전문가의 조언이 특히 도움이 돼요.',
    consultReasons: [
      '알맞은 관리를 해도 여드름이 계속될 때',
      '아프거나 깊은 여드름(결절, 낭종)이 생길 때',
      '심한 여드름이거나 빠르게 악화될 때',
      '자국이나 흉터가 자리 잡고 있을 때',
    ],
    h7Title: '핵심 정리',
    summaryTitle: '중요한 내용',
    keyPoints: [
      '호르몬성 여드름에는 안드로겐과 관련된 분명한 원인이 있어요.',
      '얼굴 아랫부분에 자주 생기고 생리 전에 심해질 수 있어요.',
      '위생이 부족해서 생기는 것도, 피할 수 없는 것도 아니에요.',
      '순한 관리와, 필요하면 알맞은 치료로 나아질 수 있어요.',
      '여드름이 계속되면 피부과 의사나 산부인과 의사가 도와줄 수 있어요.',
    ],
    finalNoteTitle: '더 잘 이해하기 위한 가이드',
    finalNoteText: '이 아티클은 일반적인 정보 제공을 위한 것이며 진료를 대신하지 않아요. 궁금한 점이 있거나 증상이 계속되면 의료 전문가의 조언을 구하세요.',
    shareMessage: '호르몬성 여드름 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'SOP • ACNE HORMONAL',
    title: 'Compreender\na acne hormonal',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo educativo',
    intro: 'Porque é que a acne hormonal pode surgir com a síndrome do ovário poliquístico (SOP), como a reconhecer e que soluções podem ajudar a geri-la.',
    introSecondary: 'Afeta muitas mulheres e não é falta de higiene nem uma fatalidade: compreender a sua origem ajuda a geri-la melhor.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a acne hormonal?',
      'Porque é que a SOP pode causar acne?',
      'Como reconhecer a acne hormonal',
      'Acne hormonal e ciclo menstrual',
      'O que pode ajudar',
      'Quando consultar um médico?',
      'Pontos essenciais',
    ],
    h1: 'O que é a acne hormonal?',
    body1a: 'A acne hormonal é uma forma de acne diretamente ligada a flutuações ou a um desequilíbrio hormonal, em particular dos androgénios. Ao contrário da acne mais típica da adolescência, afeta frequentemente mulheres adultas e pode persistir ou surgir depois dessa fase.',
    body1b: 'Distingue-se também pela sua localização, pela sua profundidade e pela tendência para reaparecer nos mesmos locais, apesar de uma rotina de cuidados da pele regular e bem seguida.',
    tip1Title: 'Bom saber',
    tip1Text: 'A acne hormonal não está ligada a falta de higiene: lavar o rosto com mais frequência não a faz desaparecer e pode até irritar a pele.',
    h2Title: 'Porque é que a SOP pode causar acne?',
    body2: 'Na SOP, um excesso relativo de androgénios estimula as glândulas sebáceas, que passam a produzir mais sebo. Algumas peles são também mais sensíveis a estas hormonas, o que explica que a acne possa ser marcada mesmo sem um desequilíbrio importante medido em análises.',
    neutralText: 'Não é uma questão de força de vontade: esta sensibilidade varia de pessoa para pessoa e não depende dos seus hábitos de vida.',
    h3Title: 'Como reconhecer a acne hormonal',
    body3: 'Certas características repetem-se com frequência, embora não de forma sistemática:',
    recognizeSigns: [
      'Parte inferior do rosto: linha da mandíbula, queixo',
      'Borbulhas mais profundas, por vezes dolorosas',
      'Reaparece muitas vezes nos mesmos locais',
      'Vermelhidão ou marcas que persistem',
    ],
    h4Title: 'Acne hormonal e ciclo menstrual',
    body4: 'A acne hormonal pode oscilar ao longo do ciclo. Muitas mulheres notam um agravamento nos dias que antecedem o período, quando a progesterona sobe e depois desce bruscamente, estimulando temporariamente a produção de sebo.',
    highlightTitle: 'Acompanhar os seus surtos',
    highlightText: 'Anotar quando surgem as borbulhas em relação ao seu ciclo pode ajudá-la, a si e ao seu dermatologista, a compreender melhor a ligação hormonal.',
    h5Title: 'O que pode ajudar',
    body5a: 'Alguns hábitos de cuidado simples podem ajudar a limitar os surtos, sem os eliminar totalmente por si só:',
    careHabits: [
      'Limpe a pele com suavidade de manhã e à noite',
      'Evite produtos agressivos ou decapantes',
      'Proteja a pele do sol todos os dias',
      'Evite espremer ou mexer nas borbulhas',
    ],
    body5b: 'Consoante a situação, um dermatologista ou ginecologista poderá sugerir tratamentos tópicos (cremes, géis) ou, se necessário, um tratamento hormonal adequado.',
    alertTitle: 'Sem automedicação',
    alertText: 'Os tratamentos da acne hormonal (tópicos ou hormonais) devem ser prescritos e acompanhados por um profissional de saúde, em particular se pretende engravidar.',
    h6Title: 'Quando consultar um médico?',
    body6: 'O aconselhamento médico é especialmente útil em certas situações:',
    consultReasons: [
      'Acne que persiste apesar de cuidados adequados',
      'Borbulhas dolorosas ou profundas (nódulos, quistos)',
      'Acne grave ou que se agrava rapidamente',
      'Marcas ou cicatrizes que se vão instalando',
    ],
    h7Title: 'Pontos essenciais',
    summaryTitle: 'O essencial',
    keyPoints: [
      'A acne hormonal tem uma causa identificável, ligada aos androgénios.',
      'Afeta muitas vezes a parte inferior do rosto e pode agravar-se antes do período.',
      'Não é falta de higiene nem uma fatalidade.',
      'Cuidados suaves e, se necessário, um tratamento adequado podem melhorá-la.',
      'Um dermatologista ou ginecologista pode acompanhá-la se persistir.',
    ],
    finalNoteTitle: 'Um guia para compreender melhor',
    finalNoteText: 'Este artigo tem apenas fins de informação geral e não substitui uma consulta médica. Em caso de dúvida ou se os sintomas persistirem, procure o aconselhamento de um profissional de saúde.',
    shareMessage: 'Compreender a acne hormonal — AWA',
  },
  bn: {
    badge: 'পিসিওএস • হরমোনজনিত ব্রণ',
    title: 'হরমোনজনিত ব্রণ\nবোঝা',
    metaDuration: '7 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'শিক্ষামূলক বিষয়বস্তু',
    intro: 'পিসিওএসের সঙ্গে হরমোনজনিত ব্রণ কেন দেখা দিতে পারে, কীভাবে চিনবেন এবং কোন সমাধানগুলো এটি নিয়ন্ত্রণে সাহায্য করতে পারে।',
    introSecondary: 'এটি অনেক নারীকেই প্রভাবিত করে এবং এটি পরিচ্ছন্নতার অভাবও নয়, অনিবার্যও নয়: এর উৎস বুঝলে এটি আরও ভালোভাবে সামলানো যায়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'হরমোনজনিত ব্রণ কী?',
      'পিসিওএস কেন ব্রণ সৃষ্টি করতে পারে?',
      'হরমোনজনিত ব্রণ কীভাবে চিনবেন',
      'হরমোনজনিত ব্রণ ও মাসিক চক্র',
      'কী সাহায্য করতে পারে',
      'কখন ডাক্তার দেখাবেন?',
      'মূল কথা',
    ],
    h1: 'হরমোনজনিত ব্রণ কী?',
    body1a: 'হরমোনজনিত ব্রণ হলো এমন এক ধরনের ব্রণ, যা সরাসরি হরমোনের ওঠানামা বা ভারসাম্যহীনতার সঙ্গে, বিশেষ করে অ্যান্ড্রোজেনের সঙ্গে যুক্ত। কৈশোরের সাধারণ ব্রণের মতো নয়, এটি প্রায়ই প্রাপ্তবয়স্ক নারীদের হয় এবং সেই বয়সের পরেও থেকে যেতে বা নতুন করে দেখা দিতে পারে।',
    body1b: 'এটি আরও আলাদা হয় এর অবস্থান, গভীরতা এবং নিয়মিত ত্বকের যত্ন ঠিকমতো মেনে চললেও একই জায়গায় বারবার ফিরে আসার প্রবণতার কারণে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'হরমোনজনিত ব্রণ পরিচ্ছন্নতার অভাবের সঙ্গে যুক্ত নয়: বেশি বেশি মুখ ধুলে এটি সেরে যায় না, বরং ত্বকে জ্বালা হতে পারে।',
    h2Title: 'পিসিওএস কেন ব্রণ সৃষ্টি করতে পারে?',
    body2: 'পিসিওএসে অ্যান্ড্রোজেনের আপেক্ষিক আধিক্য তৈলগ্রন্থিগুলোকে উদ্দীপিত করে, ফলে সেগুলো বেশি সিবাম তৈরি করে। কিছু ত্বক এই হরমোনের প্রতি বেশি সংবেদনশীলও হয়, যে কারণে ল্যাবে মাপা কোনো বড় ভারসাম্যহীনতা না থাকলেও ব্রণ স্পষ্ট হতে পারে।',
    neutralText: 'এটি ইচ্ছাশক্তির বিষয় নয়: এই সংবেদনশীলতা একেক জনের একেক রকম এবং আপনার জীবনযাপনের অভ্যাসের ওপর নির্ভর করে না।',
    h3Title: 'হরমোনজনিত ব্রণ কীভাবে চিনবেন',
    body3: 'কিছু বৈশিষ্ট্য প্রায়ই দেখা যায়, যদিও সবসময় নয়:',
    recognizeSigns: [
      'মুখের নিচের অংশ: চোয়াল, থুতনি',
      'আরও গভীর, কখনো কখনো ব্যথাযুক্ত ব্রণ',
      'প্রায়ই একই জায়গায় আবার দেখা দেয়',
      'লালচে ভাব বা দাগ যা থেকে যায়',
    ],
    h4Title: 'হরমোনজনিত ব্রণ ও মাসিক চক্র',
    body4: 'পুরো চক্র জুড়ে হরমোনজনিত ব্রণের তারতম্য হতে পারে। অনেক নারী মাসিকের কয়েক দিন আগে ব্রণ বেড়ে যেতে দেখেন, যখন প্রোজেস্টেরন বাড়ে এবং তারপর হঠাৎ কমে যায়, ফলে সাময়িকভাবে সিবাম উৎপাদন বাড়ে।',
    highlightTitle: 'আপনার ব্রণ বাড়ার সময় লিখে রাখুন',
    highlightText: 'আপনার চক্রের তুলনায় কখন ব্রণ দেখা দেয় তা লিখে রাখলে আপনি ও আপনার চর্মরোগ বিশেষজ্ঞ হরমোনের সঙ্গে সম্পর্কটি আরও ভালো বুঝতে পারবেন।',
    h5Title: 'কী সাহায্য করতে পারে',
    body5a: 'কয়েকটি সহজ যত্নের অভ্যাস ব্রণ বাড়া সীমিত করতে সাহায্য করতে পারে, তবে এগুলো একাই ব্রণ পুরোপুরি দূর করে না:',
    careHabits: [
      'সকাল ও সন্ধ্যায় আলতো করে ত্বক পরিষ্কার করুন',
      'কড়া বা ত্বক শুষ্ক করে দেওয়া পণ্য এড়িয়ে চলুন',
      'প্রতিদিন রোদ থেকে ত্বককে সুরক্ষা দিন',
      'ব্রণ চাপা বা খোঁটা এড়িয়ে চলুন',
    ],
    body5b: 'পরিস্থিতি অনুযায়ী চর্মরোগ বিশেষজ্ঞ বা স্ত্রীরোগ বিশেষজ্ঞ ত্বকে লাগানোর চিকিৎসা (ক্রিম, জেল) অথবা প্রয়োজনে উপযুক্ত হরমোন চিকিৎসার পরামর্শ দিতে পারেন।',
    alertTitle: 'নিজে নিজে ওষুধ নয়',
    alertText: 'হরমোনজনিত ব্রণের চিকিৎসা (ত্বকে লাগানোর বা হরমোনজনিত) অবশ্যই স্বাস্থ্যসেবা পেশাজীবীর নির্দেশনায় দিতে ও পর্যবেক্ষণে রাখতে হবে, বিশেষ করে আপনি যদি গর্ভধারণের আশা করেন।',
    h6Title: 'কখন ডাক্তার দেখাবেন?',
    body6: 'কিছু পরিস্থিতিতে চিকিৎসা পরামর্শ বিশেষভাবে সহায়ক:',
    consultReasons: [
      'উপযুক্ত যত্ন নেওয়ার পরও ব্রণ থেকে যাওয়া',
      'ব্যথাযুক্ত বা গভীর ব্রণ (নডিউল, সিস্ট)',
      'তীব্র ব্রণ বা দ্রুত খারাপ হতে থাকা ব্রণ',
      'দাগ বা ক্ষত যা স্থায়ী হয়ে যাচ্ছে',
    ],
    h7Title: 'মূল কথা',
    summaryTitle: 'প্রধান বিষয়গুলো',
    keyPoints: [
      'হরমোনজনিত ব্রণের একটি শনাক্তযোগ্য কারণ আছে, যা অ্যান্ড্রোজেনের সঙ্গে যুক্ত।',
      'এটি প্রায়ই মুখের নিচের অংশে হয় এবং মাসিকের আগে বাড়তে পারে।',
      'এটি পরিচ্ছন্নতার অভাবও নয়, অনিবার্যও নয়।',
      'আলতো যত্ন এবং প্রয়োজনে উপযুক্ত চিকিৎসায় উন্নতি হতে পারে।',
      'ব্রণ থেকে গেলে চর্মরোগ বিশেষজ্ঞ বা স্ত্রীরোগ বিশেষজ্ঞ আপনাকে সহায়তা করতে পারেন।',
    ],
    finalNoteTitle: 'ভালোভাবে বোঝার একটি গাইড',
    finalNoteText: 'এই নিবন্ধ শুধু সাধারণ তথ্যের জন্য এবং চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে বা উপসর্গ থেকে গেলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'হরমোনজনিত ব্রণ বোঝা — AWA',
  },
  da: {
    badge: 'PCOS • Hormonel akne',
    title: 'Forstå hormonel\nakne',
    metaDuration: '7 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'For begyndere',
    metaValidated: 'Uddannelsesmæssigt indhold',
    intro: 'Hvorfor hormonel akne kan opstå med PCOS, hvordan du genkender den, og hvilke løsninger der kan hjælpe med at holde den under kontrol.',
    introSecondary: 'Det påvirker mange kvinder og er hverken et tegn på manglende hygiejne eller uundgåeligt: at forstå årsagen gør det lettere at håndtere det bedre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er hormonel akne?',
      'Hvorfor kan PCOS forårsage akne?',
      'Sådan genkender du hormonel akne',
      'Hormonel akne og menstruationscyklussen',
      'Hvad der kan hjælpe',
      'Hvornår bør du søge læge?',
      'Det vigtigste',
    ],
    h1: 'Hvad er hormonel akne?',
    body1a: 'Hormonel akne er en type akne, der er direkte forbundet med hormonelle udsving eller ubalancer, særligt androgener. I modsætning til typisk teenageakne opstår den ofte hos voksne kvinder og kan fortsætte eller opstå igen efter den alder.',
    body1b: 'Den adskiller sig også ved sin placering, dybde og tendens til at vende tilbage på de samme steder, selv når man følger en god hudplejerutine.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Hormonel akne er ikke relateret til manglende hygiejne: at vaske ansigtet hyppigere løser det ikke — det kan tværtimod irritere huden.',
    h2Title: 'Hvorfor kan PCOS forårsage akne?',
    body2: 'Ved PCOS kan en relativ overvægt af androgener stimulere talgkirtlerne til at producere mere talg. Noget hud er også mere følsom over for disse hormoner, hvilket kan forklare, at aknen er tydelig, selv uden en markant ubalance i laboratorieprøverne.',
    neutralText: 'Det handler ikke om viljestyrke: denne følsomhed varierer fra person til person og afhænger ikke af dine livsstilsvaner.',
    h3Title: 'Sådan genkender du hormonel akne',
    body3: 'Visse karakteristika ses ofte, om end ikke altid:',
    recognizeSigns: [
      'Den nedre del af ansigtet: kæbe, hage',
      'Dybere, nogle gange smertefulde bumps',
      'Vender ofte tilbage på de samme steder',
      'Rødme eller pletter der bliver',
    ],
    h4Title: 'Hormonel akne og menstruationscyklussen',
    body4: 'Hormonel akne kan variere gennem cyklussen. Mange kvinder oplever en forværring af aknen i dagene op til menstruation, når progesteron stiger og derefter falder brat, hvilket midlertidigt øger talgproduktionen.',
    highlightTitle: 'Notér hvornår din akne forværres',
    highlightText: 'At notere hvornår aknen opstår i forhold til din cyklus giver dig og din dermatolog mulighed for bedre at forstå forbindelsen til hormonerne.',
    h5Title: 'Hvad der kan hjælpe',
    body5a: 'Visse enkle plejervaner kan hjælpe med at begrænse forværringer, men de fjerner ikke aknen fuldstændigt på egen hånd:',
    careHabits: [
      'Rengør huden forsigtigt morgen og aften',
      'Undgå hårde eller udtørrende produkter',
      'Beskyt huden mod solen hver dag',
      'Undgå at klemme på eller irritere bumps',
    ],
    body5b: 'Afhængigt af situationen kan en dermatolog eller gynækolog anbefale lokal behandling (creme, gel) eller om nødvendigt en passende hormonel behandling.',
    alertTitle: 'Ingen selvmedicinering',
    alertText: 'Behandling af hormonel akne (lokal eller hormonel) skal altid gives og overvåges af en sundhedsperson, særligt hvis du håber at blive gravid.',
    h6Title: 'Hvornår bør du søge læge?',
    body6: 'I visse situationer er medicinsk rådgivning særligt nyttig:',
    consultReasons: [
      'Akne der fortsætter trods passende pleje',
      'Smertefulde eller dybe bumps (knuder, cyster)',
      'Kraftig akne eller akne der forværres hurtigt',
      'Ar eller pletter der er ved at blive permanente',
    ],
    h7Title: 'Det vigtigste',
    summaryTitle: 'Hovedpunkter',
    keyPoints: [
      'Hormonel akne har en identificerbar årsag relateret til androgener.',
      'Den sidder ofte i den nedre del af ansigtet og kan forværres før menstruation.',
      'Det er hverken manglende hygiejne eller uundgåeligt.',
      'Mild pleje og om nødvendigt passende behandling kan forbedre tilstanden.',
      'En dermatolog eller gynækolog kan hjælpe dig, hvis aknen fortsætter.',
    ],
    finalNoteTitle: 'En guide til bedre forståelse',
    finalNoteText: 'Denne artikel er udelukkende til generel information og er ikke et alternativ til medicinsk rådgivning. Hvis du er i tvivl eller symptomerne fortsætter, bør du konsultere en sundhedsperson.',
    shareMessage: 'Forstå hormonel akne — AWA',
  },
  sv: {
    badge: 'PCOS • Hormonel akne',
    title: 'Forstå hormonel\nakne',
    metaDuration: '7 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'For begyndere',
    metaValidated: 'Uddannelsesmässigt indhold',
    intro: 'Hvorfor hormonel akne kan opstå med PCOS, hvordan du genkender den, och hvilke lösninger der kan hjälpe med at holde den under kontrol.',
    introSecondary: 'Det påvirker mange kvinnor och ar hverken et tegn på manglende hygiejne eller uundgåeligt: at forstå årsagen gör det lettere at håndtere det bedre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar hormonel akne?',
      'Hvorfor kan PCOS forårsage akne?',
      'Sådan genkender du hormonel akne',
      'Hormonel akne och menstruationscyklussen',
      'Hvad der kan hjälpe',
      'Hvornår bör du söge läge?',
      'Det vigtigste',
    ],
    h1: 'Hvad ar hormonel akne?',
    body1a: 'Hormonel akne ar en type akne, der ar direkte forbundet med hormonelle udsving eller ubalancer, särligt androgener. I modsätning till typisk teenageakne opstår den ofta hos voksne kvinnor och kan fortsätte eller opstå igen efter den alder.',
    body1b: 'Den adskiller sig også ved sin placering, dybde och tendens till at vende tilbage på de samme steder, selv når man fölger en god hudplejerutine.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Hormonel akne ar inte relateret till manglende hygiejne: at vaske ansigtet hyppigere löser det inte — det kan tvärtimod irritere huden.',
    h2Title: 'Hvorfor kan PCOS forårsage akne?',
    body2: 'Ved PCOS kan en relativ overvägt av androgener stimulere talgkirtlerne till at producere mere talg. Noget hud ar også mere fölsom over for disse hormoner, hvilket kan forklare, at aknen ar tydelig, selv uden en markant ubalance i laboratoriepröverne.',
    neutralText: 'Det handler inte om viljestyrke: denne fölsomhed varierer fran person till person och afhänger inte av dina livsstilsvaner.',
    h3Title: 'Sådan genkender du hormonel akne',
    body3: 'Visse karakteristika ses ofte, om end inte altid:',
    recognizeSigns: [
      'Den nedre del av ansigtet: käbe, hage',
      'Dybere, nogle gange smertefulde bumps',
      'Vender ofta tilbage på de samme steder',
      'Rödme eller pletter der bliver',
    ],
    h4Title: 'Hormonel akne och menstruationscyklussen',
    body4: 'Hormonel akne kan variere gennem cyklussen. Mange kvinnor oplever en forvärring av aknen i dagene op till menstruation, når progesteron stiger och derefter falder brat, hvilket midlertidigt öger talgproduktionen.',
    highlightTitle: 'Notér hvornår din akne forvärres',
    highlightText: 'At notere hvornår aknen opstår i forhold till din cyklus giver dig och din dermatolog mulighed for bedre at forstå forbindelsen till hormonerne.',
    h5Title: 'Hvad der kan hjälpe',
    body5a: 'Visse enkle plejervaner kan hjälpe med at begränse forvärringer, men de fjerner inte aknen fuldständigt på egen hånd:',
    careHabits: [
      'Rengör huden forsigtigt morgen och aften',
      'Undgå hårde eller udtörrende produkter',
      'Beskyt huden mod solen hver dag',
      'Undgå at klemme på eller irritere bumps',
    ],
    body5b: 'Afhängigt av situationen kan en dermatolog eller gynäkolog anbefale lokal behandling (creme, gel) eller om nödvendigt en passende hormonel behandling.',
    alertTitle: 'Ingen selvmedicinering',
    alertText: 'Behandling av hormonel akne (lokal eller hormonel) skal alltid gives och overvåges av en halsasperson, särligt hvis du håber at blive gravid.',
    h6Title: 'Hvornår bör du söge läge?',
    body6: 'I visse situationer ar medicinsk rådgivning särligt nyttig:',
    consultReasons: [
      'Akne der fortsätter trods passende pleje',
      'Smertefulde eller dybe bumps (knuder, cyster)',
      'Kraftig akne eller akne der forvärres hurtigt',
      'Ar eller pletter der ar ved at blive permanente',
    ],
    h7Title: 'Det vigtigste',
    summaryTitle: 'Hovedpunkter',
    keyPoints: [
      'Hormonel akne har en identificerbar årsag relateret till androgener.',
      'Den sidder ofta i den nedre del av ansigtet och kan forvärres för menstruation.',
      'Det ar hverken manglende hygiejne eller uundgåeligt.',
      'Mild pleje och om nödvendigt passende behandling kan forbedre tilstanden.',
      'En dermatolog eller gynäkolog kan hjälpe dig, hvis aknen fortsätter.',
    ],
    finalNoteTitle: 'En guide till bedre forståelse',
    finalNoteText: 'Denne artikel ar udelukkende till generel information och ar inte et alternativ till medicinsk rådgivning. Hvis du ar i tvivl eller symtomne fortsätter, bör du konsultere en halsasperson.',
    shareMessage: 'Forstå hormonel akne — AWA',
  },
  nb: {
    badge: 'PCOS • HORMONELL AKNE',
    title: 'Forstå\nhormonell akne',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Pedagogisk innhold',
    intro:
      'Hvorfor hormonell akne kan oppstå med PCOS, hvordan du kjenner den igjen, og hvilke løsninger som kan hjelpe med å håndtere den.',
    introSecondary:
      'Den rammer mange kvinner og skyldes verken dårlig hygiene eller er uunngåelig: å forstå opphavet hjelper deg å håndtere den bedre.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er hormonell akne?',
      'Hvorfor kan PCOS gi akne?',
      'Hvordan du kjenner igjen hormonell akne',
      'Hormonell akne og menstruasjonssyklusen',
      'Hva som kan hjelpe',
      'Når bør du gå til lege?',
      'Det viktigste å huske',
    ],
    h1: 'Hva er hormonell akne?',
    body1a:
      'Hormonell akne er en form for akne som henger direkte sammen med hormonelle svingninger eller en ubalanse, særlig i androgener. I motsetning til den mer typiske aknen i tenårene rammer den ofte voksne kvinner og kan vedvare eller dukke opp etter den perioden.',
    body1b:
      'Den kjennetegnes også av plasseringen, dybden og tendensen til å komme tilbake på de samme stedene til tross for en godt fulgt regelmessig hudpleierutine.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Hormonell akne henger ikke sammen med dårlig hygiene: å vaske ansiktet oftere får den ikke til å forsvinne, og kan til og med irritere huden.',
    h2Title: 'Hvorfor kan PCOS gi akne?',
    body2:
      'Ved PCOS stimulerer et relativt overskudd av androgener talgkjertlene, som da produserer mer talg. Noen har også hud som er mer følsom for disse hormonene, noe som forklarer hvorfor akne kan være uttalt selv uten en stor ubalanse målt i laboratoriet.',
    neutralText:
      'Dette handler ikke om viljestyrke: denne følsomheten varierer fra person til person og avhenger ikke av livsstilsvanene dine.',
    h3Title: 'Hvordan du kjenner igjen hormonell akne',
    body3:
      'Visse trekk går ofte igjen, men ikke systematisk:',
    recognizeSigns: [
      'Nedre del av ansiktet: kjevelinjen, haken',
      'Dypere, noen ganger smertefulle utbrudd',
      'Kommer ofte tilbake på de samme stedene',
      'Rødhet eller merker som vedvarer',
    ],
    h4Title: 'Hormonell akne og menstruasjonssyklusen',
    body4:
      'Hormonell akne kan svinge gjennom syklusen. Mange kvinner merker en oppblomstring dagene før mensen, når progesteron stiger og deretter faller kraftig, noe som midlertidig stimulerer talgproduksjonen.',
    highlightTitle: 'Følge oppblomstringene dine',
    highlightText:
      'Å notere når utbruddene kommer i forhold til syklusen, kan hjelpe deg og hudlegen din å forstå den hormonelle sammenhengen bedre.',
    h5Title: 'Hva som kan hjelpe',
    body5a:
      'Noen enkle pleievaner kan bidra til å begrense oppblomstringer, uten å fjerne dem helt alene:',
    careHabits: [
      'Rens huden forsiktig morgen og kveld',
      'Unngå sterke eller uttørkende produkter',
      'Beskytt huden mot sola hver dag',
      'Unngå å klemme eller plukke på kviser',
    ],
    body5b:
      'Avhengig av situasjonen kan en hudlege eller gynekolog foreslå lokalbehandling (kremer, geler) eller, ved behov, en egnet hormonbehandling.',
    alertTitle: 'Ingen egenbehandling',
    alertText:
      'Behandlinger mot hormonell akne (lokale eller hormonelle) må forskrives og følges opp av helsepersonell, særlig hvis du håper å bli gravid.',
    h6Title: 'Når bør du gå til lege?',
    body6:
      'Medisinsk råd er særlig nyttig i visse situasjoner:',
    consultReasons: [
      'Akne som vedvarer til tross for egnet pleie',
      'Smertefulle eller dype utbrudd (knuter, cyster)',
      'Alvorlig akne eller akne som raskt blir verre',
      'Merker eller arr som setter seg',
    ],
    h7Title: 'Det viktigste å huske',
    summaryTitle: 'De viktigste punktene',
    keyPoints: [
      'Hormonell akne har en identifiserbar årsak, knyttet til androgener.',
      'Den rammer ofte nedre del av ansiktet og kan bli verre før mensen.',
      'Den skyldes verken dårlig hygiene eller er uunngåelig.',
      'Mild pleie og, ved behov, en egnet behandling kan bedre den.',
      'En hudlege eller gynekolog kan støtte deg hvis den vedvarer.',
    ],
    finalNoteTitle: 'En veiledning for bedre forståelse',
    finalNoteText:
      'Denne artikkelen er kun til generell informasjon og erstatter ikke en medisinsk konsultasjon. Ved tvil eller hvis symptomene vedvarer, bør du søke råd hos helsepersonell.',
    shareMessage: 'Forstå hormonell akne – AWA',
  },
  pl: {
    badge: 'PCOS • TRĄDZIK HORMONALNY',
    title: 'Zrozumieć\ntrądzik hormonalny',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść edukacyjna',
    intro:
      'Dlaczego trądzik hormonalny może pojawiać się przy PCOS, jak go rozpoznać i jakie rozwiązania mogą pomóc go opanować.',
    introSecondary:
      'Dotyka wielu kobiet i nie jest ani wynikiem braku higieny, ani nieuniknioną koniecznością: zrozumienie jego źródła pomaga lepiej sobie z nim radzić.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest trądzik hormonalny?',
      'Dlaczego PCOS może powodować trądzik?',
      'Jak rozpoznać trądzik hormonalny',
      'Trądzik hormonalny a cykl menstruacyjny',
      'Co może pomóc',
      'Kiedy zgłosić się do lekarza?',
      'Najważniejsze wnioski',
    ],
    h1: 'Czym jest trądzik hormonalny?',
    body1a:
      'Trądzik hormonalny to postać trądziku bezpośrednio związana z wahaniami lub zaburzeniem równowagi hormonalnej, zwłaszcza androgenów. W przeciwieństwie do typowego trądziku okresu dojrzewania często dotyka dorosłych kobiet i może się utrzymywać lub pojawiać po tym okresie.',
    body1b:
      'Wyróżnia się również lokalizacją, głębokością i skłonnością do nawrotów w tych samych miejscach, mimo prawidłowo stosowanej regularnej pielęgnacji skóry.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Trądzik hormonalny nie jest związany z brakiem higieny: częstsze mycie twarzy go nie usuwa, a może nawet podrażniać skórę.',
    h2Title: 'Dlaczego PCOS może powodować trądzik?',
    body2:
      'W PCOS względny nadmiar androgenów pobudza gruczoły łojowe, które wytwarzają wtedy więcej łoju. Niektóre rodzaje skóry są też bardziej wrażliwe na te hormony, co wyjaśnia, dlaczego trądzik może być nasilony nawet bez dużego zaburzenia stwierdzonego w badaniach laboratoryjnych.',
    neutralText:
      'To nie kwestia silnej woli: ta wrażliwość jest różna u poszczególnych osób i nie zależy od Twoich nawyków stylu życia.',
    h3Title: 'Jak rozpoznać trądzik hormonalny',
    body3:
      'Niektóre cechy często się powtarzają, choć nie zawsze:',
    recognizeSigns: [
      'Dolna część twarzy: linia żuchwy, broda',
      'Głębsze, czasem bolesne zmiany',
      'Często nawraca w tych samych miejscach',
      'Zaczerwienienia lub ślady, które się utrzymują',
    ],
    h4Title: 'Trądzik hormonalny a cykl menstruacyjny',
    body4:
      'Trądzik hormonalny może się zmieniać w trakcie cyklu. Wiele kobiet zauważa zaostrzenie w dniach przed miesiączką, gdy progesteron rośnie, a potem gwałtownie spada, tymczasowo pobudzając produkcję łoju.',
    highlightTitle: 'Śledzenie zaostrzeń',
    highlightText:
      'Zapisywanie, kiedy pojawiają się zmiany w stosunku do cyklu, może pomóc Tobie i dermatologowi lepiej zrozumieć związek hormonalny.',
    h5Title: 'Co może pomóc',
    body5a:
      'Kilka prostych nawyków pielęgnacyjnych może pomóc ograniczyć zaostrzenia, choć same ich w pełni nie usuną:',
    careHabits: [
      'Delikatnie oczyszczaj skórę rano i wieczorem',
      'Unikaj ostrych lub wysuszających produktów',
      'Codziennie chroń skórę przed słońcem',
      'Unikaj wyciskania i dłubania w zmianach',
    ],
    body5b:
      'W zależności od sytuacji dermatolog lub ginekolog może zaproponować leczenie miejscowe (kremy, żele) lub, w razie potrzeby, odpowiednie leczenie hormonalne.',
    alertTitle: 'Bez samoleczenia',
    alertText:
      'Leczenie trądziku hormonalnego (miejscowe lub hormonalne) musi być przepisane i nadzorowane przez specjalistę, zwłaszcza jeśli starasz się o dziecko.',
    h6Title: 'Kiedy zgłosić się do lekarza?',
    body6:
      'Porada medyczna jest szczególnie pomocna w niektórych sytuacjach:',
    consultReasons: [
      'Trądzik utrzymuje się mimo odpowiedniej pielęgnacji',
      'Bolesne lub głębokie zmiany (guzki, torbiele)',
      'Ciężki trądzik lub trądzik, który szybko się nasila',
      'Utrwalające się ślady lub blizny',
    ],
    h7Title: 'Najważniejsze wnioski',
    summaryTitle: 'Najważniejsze punkty',
    keyPoints: [
      'Trądzik hormonalny ma dającą się określić przyczynę, związaną z androgenami.',
      'Często dotyka dolnej części twarzy i może nasilać się przed miesiączką.',
      'Nie jest ani wynikiem braku higieny, ani nieuniknioną koniecznością.',
      'Delikatna pielęgnacja i, w razie potrzeby, odpowiednie leczenie mogą go poprawić.',
      'Dermatolog lub ginekolog może Cię wesprzeć, jeśli się utrzymuje.',
    ],
    finalNoteTitle: 'Przewodnik do lepszego zrozumienia',
    finalNoteText:
      'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje wizyty lekarskiej. W razie wątpliwości lub utrzymujących się objawów zasięgnij porady specjalisty.',
    shareMessage: 'Zrozumieć trądzik hormonalny — AWA',
  },
  uk: {
    badge: 'СПКЯ • ГОРМОНАЛЬНЕ АКНЕ',
    title: 'Розуміння\nгормонального акне',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Навчальний вміст',
    intro:
      'Чому гормональне акне може з’являтися при СПКЯ, як його розпізнати і які рішення можуть допомогти його контролювати.',
    introSecondary:
      'Воно торкається багатьох жінок і не є ні наслідком недостатньої гігієни, ні неминучістю: розуміння його походження допомагає краще з ним справлятися.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке гормональне акне?',
      'Чому СПКЯ може спричиняти акне?',
      'Як розпізнати гормональне акне',
      'Гормональне акне та менструальний цикл',
      'Що може допомогти',
      'Коли звертатися до лікаря?',
      'Головні висновки',
    ],
    h1: 'Що таке гормональне акне?',
    body1a:
      'Гормональне акне — форма акне, безпосередньо пов’язана з гормональними коливаннями або дисбалансом, зокрема андрогенів. На відміну від типовішого акне підліткового віку, воно часто торкається дорослих жінок і може зберігатися або з’являтися після цього періоду.',
    body1b:
      'Воно також відрізняється розташуванням, глибиною та схильністю з’являтися знову на тих самих місцях попри правильно дотримуваний регулярний догляд за шкірою.',
    tip1Title: 'Варто знати',
    tip1Text:
      'Гормональне акне не пов’язане з недостатньою гігієною: частіше вмивання його не усуває й може навіть подразнювати шкіру.',
    h2Title: 'Чому СПКЯ може спричиняти акне?',
    body2:
      'При СПКЯ відносний надлишок андрогенів стимулює сальні залози, які починають виробляти більше шкірного сала. Деякі типи шкіри також чутливіші до цих гормонів, що пояснює, чому акне може бути виразним навіть без значного дисбалансу, виміряного в лабораторії.',
    neutralText:
      'Це не питання сили волі: ця чутливість різниться в різних людей і не залежить від ваших звичок способу життя.',
    h3Title: 'Як розпізнати гормональне акне',
    body3:
      'Певні ознаки часто повторюються, хоча й не завжди:',
    recognizeSigns: [
      'Нижня частина обличчя: лінія щелепи, підборіддя',
      'Глибші, іноді болісні висипання',
      'Часто з’являється знову на тих самих місцях',
      'Почервоніння або сліди, що зберігаються',
    ],
    h4Title: 'Гормональне акне та менструальний цикл',
    body4:
      'Гормональне акне може змінюватися протягом циклу. Багато жінок помічають загострення в дні перед менструацією, коли прогестерон зростає, а потім різко знижується, тимчасово стимулюючи вироблення шкірного сала.',
    highlightTitle: 'Відстеження загострень',
    highlightText:
      'Записування того, коли з’являються висипання відносно циклу, може допомогти вам і дерматологу краще зрозуміти гормональний зв’язок.',
    h5Title: 'Що може допомогти',
    body5a:
      'Кілька простих звичок догляду можуть допомогти обмежити загострення, хоча самі їх повністю не усунуть:',
    careHabits: [
      'М’яко очищайте шкіру вранці та ввечері',
      'Уникайте агресивних або знежирювальних засобів',
      'Щодня захищайте шкіру від сонця',
      'Не видавлюйте та не колупайте висипання',
    ],
    body5b:
      'Залежно від ситуації дерматолог або гінеколог може запропонувати місцеве лікування (креми, гелі) або, за потреби, відповідне гормональне лікування.',
    alertTitle: 'Жодного самолікування',
    alertText:
      'Лікування гормонального акне (місцеве чи гормональне) має призначатися й контролюватися медичним фахівцем, особливо якщо ви сподіваєтеся завагітніти.',
    h6Title: 'Коли звертатися до лікаря?',
    body6:
      'Медична порада особливо корисна в певних ситуаціях:',
    consultReasons: [
      'Акне зберігається попри відповідний догляд',
      'Болісні або глибокі висипання (вузли, кісти)',
      'Важке акне або таке, що швидко погіршується',
      'Сліди або рубці, що закріплюються',
    ],
    h7Title: 'Головні висновки',
    summaryTitle: 'Основні моменти',
    keyPoints: [
      'Гормональне акне має визначну причину, пов’язану з андрогенами.',
      'Воно часто торкається нижньої частини обличчя і може посилюватися перед менструацією.',
      'Воно не є ні наслідком недостатньої гігієни, ні неминучістю.',
      'Ніжний догляд і, за потреби, відповідне лікування можуть його покращити.',
      'Дерматолог або гінеколог можуть підтримати вас, якщо воно зберігається.',
    ],
    finalNoteTitle: 'Посібник для кращого розуміння',
    finalNoteText:
      'Ця стаття має виключно загальноінформаційний характер і не замінює медичної консультації. У разі сумнівів або якщо симптоми зберігаються, зверніться за порадою до медичного фахівця.',
    shareMessage: 'Розуміння гормонального акне — AWA',
  },
  cs: {
    badge: 'PCOS • HORMONÁLNÍ AKNÉ',
    title: 'Pochopení\nhormonálního akné',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Vzdělávací obsah',
    intro:
      'Proč se hormonální akné může objevit při PCOS, jak ho rozpoznat a jaká řešení mohou pomoci s jeho zvládáním.',
    introSecondary:
      'Postihuje mnoho žen a není ani nedostatkem hygieny, ani nevyhnutelností: porozumění jeho původu pomáhá lépe ho zvládat.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je hormonální akné?',
      'Proč může PCOS způsobovat akné?',
      'Jak hormonální akné rozpoznat',
      'Hormonální akné a menstruační cyklus',
      'Co může pomoci',
      'Kdy navštívit lékaře?',
      'Hlavní poznatky',
    ],
    h1: 'Co je hormonální akné?',
    body1a:
      'Hormonální akné je forma akné přímo související s hormonálním kolísáním nebo nerovnováhou, zejména androgenů. Na rozdíl od typičtějšího akné v dospívání často postihuje dospělé ženy a může přetrvávat nebo se objevit až po tomto období.',
    body1b:
      'Vyznačuje se také umístěním, hloubkou a sklonem znovu se objevovat na stejných místech navzdory správně dodržované pravidelné péči o pleť.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Hormonální akné nesouvisí s nedostatkem hygieny: častější mytí obličeje ho neodstraní a může dokonce dráždit pleť.',
    h2Title: 'Proč může PCOS způsobovat akné?',
    body2:
      'Při PCOS relativní nadbytek androgenů stimuluje mazové žlázy, které pak produkují více mazu. Některá pleť je také citlivější na tyto hormony, což vysvětluje, proč může být akné výrazné i bez zásadní nerovnováhy změřené v laboratoři.',
    neutralText:
      'Nejde o otázku vůle: tato citlivost se u každé ženy liší a nezávisí na vašich životních návycích.',
    h3Title: 'Jak hormonální akné rozpoznat',
    body3:
      'Některé rysy se často opakují, i když ne vždy:',
    recognizeSigns: [
      'Dolní část obličeje: linie čelisti, brada',
      'Hlubší, někdy bolestivé pupínky',
      'Často se znovu objevuje na stejných místech',
      'Zarudnutí nebo stopy, které přetrvávají',
    ],
    h4Title: 'Hormonální akné a menstruační cyklus',
    body4:
      'Hormonální akné může v průběhu cyklu kolísat. Mnoho žen si všimne vzplanutí ve dnech před menstruací, kdy progesteron stoupne a pak prudce klesne, což dočasně stimuluje tvorbu mazu.',
    highlightTitle: 'Sledování vzplanutí',
    highlightText:
      'Zapisování, kdy se pupínky objevují vzhledem k vašemu cyklu, může pomoci vám i vašemu dermatologovi lépe pochopit hormonální souvislost.',
    h5Title: 'Co může pomoci',
    body5a:
      'Několik jednoduchých návyků péče může pomoci omezit vzplanutí, aniž by je samo úplně odstranilo:',
    careHabits: [
      'Jemně čistěte pleť ráno a večer',
      'Vyhýbejte se agresivním nebo vysušujícím přípravkům',
      'Denně chraňte pleť před sluncem',
      'Nemačkejte ani nevymačkávejte pupínky',
    ],
    body5b:
      'Podle situace může dermatolog nebo gynekolog navrhnout lokální léčbu (krémy, gely) nebo v případě potřeby vhodnou hormonální léčbu.',
    alertTitle: 'Žádná samoléčba',
    alertText:
      'Léčbu hormonálního akné (lokální či hormonální) musí předepisovat a sledovat zdravotnický pracovník, zejména pokud doufáte v otěhotnění.',
    h6Title: 'Kdy navštívit lékaře?',
    body6:
      'Lékařská rada je obzvlášť užitečná v určitých situacích:',
    consultReasons: [
      'Akné, které přetrvává navzdory vhodné péči',
      'Bolestivé nebo hluboké pupínky (uzly, cysty)',
      'Těžké akné nebo akné, které se rychle zhoršuje',
      'Stopy nebo jizvy, které se usazují',
    ],
    h7Title: 'Hlavní poznatky',
    summaryTitle: 'Podstatné body',
    keyPoints: [
      'Hormonální akné má rozpoznatelnou příčinu související s androgeny.',
      'Často postihuje dolní část obličeje a může se před menstruací zhoršit.',
      'Není ani nedostatkem hygieny, ani nevyhnutelností.',
      'Jemná péče a v případě potřeby vhodná léčba ho mohou zlepšit.',
      'Dermatolog nebo gynekolog vás může podpořit, pokud přetrvává.',
    ],
    finalNoteTitle: 'Průvodce pro lepší porozumění',
    finalNoteText:
      'Tento článek je určen k obecnému informování a nenahrazuje lékařskou konzultaci. V případě pochybností nebo přetrvávajících příznaků požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Pochopení hormonálního akné — AWA',
  },
  sk: {
    badge: 'PCOS • HORMONÁLNE AKNÉ',
    title: 'Pochopenie\nhormonálneho akné',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Vzdelávací obsah',
    intro:
      'Prečo sa pri PCOS môže objaviť hormonálne akné, ako ho rozpoznať a aké riešenia môžu pomôcť ho zvládať.',
    introSecondary:
      'Postihuje mnohé ženy a nie je ani nedostatkom hygieny, ani nevyhnutnosťou: pochopenie jeho pôvodu pomáha lepšie ho zvládať.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je hormonálne akné?',
      'Prečo môže PCOS spôsobovať akné?',
      'Ako rozpoznať hormonálne akné',
      'Hormonálne akné a menštruačný cyklus',
      'Čo môže pomôcť',
      'Kedy navštíviť lekára?',
      'Hlavné body',
    ],
    h1: 'Čo je hormonálne akné?',
    body1a:
      'Hormonálne akné je forma akné priamo súvisiaca s hormonálnym kolísaním alebo nerovnováhou, najmä androgénov. Na rozdiel od typickejšieho akné v dospievaní často postihuje dospelé ženy a môže pretrvávať alebo sa objaviť po tomto období.',
    body1b:
      'Odlišuje sa aj svojím umiestnením, hĺbkou a tendenciou opätovne sa objavovať na tých istých miestach napriek dobre dodržiavanej pravidelnej starostlivosti o pleť.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Hormonálne akné nesúvisí s nedostatkom hygieny: častejšie umývanie tváre ho neodstráni a môže pleť dokonca podráždiť.',
    h2Title: 'Prečo môže PCOS spôsobovať akné?',
    body2:
      'Pri PCOS relatívny nadbytok androgénov stimuluje mazové žľazy, ktoré potom produkujú viac mazu. Niektorá pleť je tiež citlivejšia na tieto hormóny, čo vysvetľuje, prečo môže byť akné výrazné aj bez významnej nerovnováhy zmeranej v laboratóriu.',
    neutralText:
      'Nejde o otázku sily vôle: táto citlivosť sa líši od ženy k žene a nezávisí od vašich návykov životného štýlu.',
    h3Title: 'Ako rozpoznať hormonálne akné',
    body3:
      'Niektoré črty sa často opakujú, hoci nie systematicky:',
    recognizeSigns: [
      'Spodná časť tváre: línia sánky, brada',
      'Hlbšie, niekedy bolestivé vyrážky',
      'Často sa znovu objavuje na tých istých miestach',
      'Začervenanie alebo škvrny, ktoré pretrvávajú',
    ],
    h4Title: 'Hormonálne akné a menštruačný cyklus',
    body4:
      'Hormonálne akné môže počas cyklu kolísať. Mnohé ženy si všimnú zhoršenie v dňoch pred menštruáciou, keď progesterón stúpa a potom prudko klesá, čím dočasne stimuluje tvorbu mazu.',
    highlightTitle: 'Sledovanie zhoršení',
    highlightText:
      'Zaznamenávanie, kedy sa vyrážky objavia vzhľadom na cyklus, môže vám a vášmu dermatológovi pomôcť lepšie pochopiť hormonálnu súvislosť.',
    h5Title: 'Čo môže pomôcť',
    body5a:
      'Niekoľko jednoduchých návykov starostlivosti môže pomôcť obmedziť zhoršenia, bez toho, aby ich samotné úplne odstránili:',
    careHabits: [
      'Jemne čistite pleť ráno a večer',
      'Vyhnite sa agresívnym alebo vysúšajúcim prípravkom',
      'Denne chráňte pleť pred slnkom',
      'Vyrážky nevytláčajte ani neškriabte',
    ],
    body5b:
      'Podľa situácie môže dermatológ alebo gynekológ navrhnúť lokálne liečby (krémy, gély) alebo v prípade potreby vhodnú hormonálnu liečbu.',
    alertTitle: 'Žiadna samoliečba',
    alertText:
      'Liečby hormonálneho akné (lokálne alebo hormonálne) musí predpisovať a sledovať zdravotnícky pracovník, najmä ak dúfate v počatie.',
    h6Title: 'Kedy navštíviť lekára?',
    body6:
      'Lekárska rada je užitočná najmä v určitých situáciách:',
    consultReasons: [
      'Akné, ktoré pretrváva napriek vhodnej starostlivosti',
      'Bolestivé alebo hlboké vyrážky (uzly, cysty)',
      'Ťažké akné alebo akné, ktoré sa rýchlo zhoršuje',
      'Škvrny alebo jazvy, ktoré sa usadzujú',
    ],
    h7Title: 'Hlavné body',
    summaryTitle: 'Podstatné body',
    keyPoints: [
      'Hormonálne akné má identifikovateľnú príčinu súvisiacu s androgénmi.',
      'Často postihuje spodnú časť tváre a môže sa zhoršiť pred menštruáciou.',
      'Nie je ani nedostatkom hygieny, ani nevyhnutnosťou.',
      'Jemná starostlivosť a v prípade potreby vhodná liečba ho môžu zlepšiť.',
      'Dermatológ alebo gynekológ vás môže podporiť, ak pretrváva.',
    ],
    finalNoteTitle: 'Sprievodca pre lepšie porozumenie',
    finalNoteText:
      'Tento článok je iba na všeobecné informovanie a nenahrádza lekársku konzultáciu. V prípade pochybností alebo pretrvávajúcich príznakov sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Pochopenie hormonálneho akné — AWA',
  },
  hu: {
    badge: 'PCOS • HORMONÁLIS AKNÉ',
    title: 'A hormonális akné\nmegértése',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ismeretterjesztő tartalom',
    intro:
      'Miért jelenhet meg hormonális akné PCOS esetén, hogyan ismerd fel, és milyen megoldások segíthetnek a kezelésében.',
    introSecondary:
      'Sok nőt érint, és sem nem a higiénia hiánya, sem nem elkerülhetetlenség: az eredetének megértése segít jobban kezelni.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a hormonális akné?',
      'Miért okozhat a PCOS aknét?',
      'Hogyan ismerd fel a hormonális aknét',
      'Hormonális akné és a menstruációs ciklus',
      'Ami segíthet',
      'Mikor menj orvoshoz?',
      'Legfontosabb tudnivalók',
    ],
    h1: 'Mi a hormonális akné?',
    body1a:
      'A hormonális akné az akné olyan formája, amely közvetlenül a hormonális ingadozásokhoz vagy egyensúlyzavarhoz, különösen az androgénekéhez kapcsolódik. A serdülőkor tipikusabb aknéjától eltérően gyakran érinti a felnőtt nőket, és fennmaradhat vagy megjelenhet ezen időszak után.',
    body1b:
      'Az elhelyezkedése, a mélysége és az a hajlam is megkülönbözteti, hogy a jól követett rendszeres bőrápolási rutin ellenére is ugyanazokon a helyeken tér vissza.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'A hormonális akné nem a higiénia hiányához kapcsolódik: az arc gyakoribb mosása nem szünteti meg, sőt irritálhatja a bőrt.',
    h2Title: 'Miért okozhat a PCOS aknét?',
    body2:
      'PCOS esetén az androgének relatív fölöslege serkenti a faggyúmirigyeket, amelyek ezután több faggyút termelnek. Egyes bőrtípusok érzékenyebbek is ezekre a hormonokra, ami megmagyarázza, miért lehet az akné kifejezett még laboratóriumilag mért jelentős egyensúlyzavar nélkül is.',
    neutralText:
      'Ez nem az akaraterő kérdése: ez az érzékenység nőnként eltér, és nem függ az életmódbeli szokásaidtól.',
    h3Title: 'Hogyan ismerd fel a hormonális aknét',
    body3:
      'Bizonyos jellemzők gyakran, bár nem rendszeresen ismétlődnek:',
    recognizeSigns: [
      'Az arc alsó része: állvonal, áll',
      'Mélyebb, néha fájdalmas kiütések',
      'Gyakran ugyanazokon a helyeken tér vissza',
      'Vörösség vagy foltok, amelyek megmaradnak',
    ],
    h4Title: 'Hormonális akné és a menstruációs ciklus',
    body4:
      'A hormonális akné a ciklus során ingadozhat. Sok nő a menstruáció előtti napokban tapasztal fellángolást, amikor a progeszteron emelkedik, majd hirtelen esik, átmenetileg serkentve a faggyútermelést.',
    highlightTitle: 'A fellángolások követése',
    highlightText:
      'Ha feljegyzed, mikor jelennek meg a kiütések a ciklusodhoz viszonyítva, az segíthet neked és a bőrgyógyászodnak jobban megérteni a hormonális összefüggést.',
    h5Title: 'Ami segíthet',
    body5a:
      'Néhány egyszerű ápolási szokás segíthet korlátozni a fellángolásokat, anélkül hogy önmagában teljesen megszüntetné őket:',
    careHabits: [
      'Kíméletesen tisztítsd a bőrödet reggel és este',
      'Kerüld az agresszív vagy kiszárító termékeket',
      'Naponta védd a bőrödet a naptól',
      'Ne nyomkodd és ne piszkáld a kiütéseket',
    ],
    body5b:
      'A helyzettől függően bőrgyógyász vagy nőgyógyász helyi kezeléseket (krémek, gélek) vagy szükség esetén megfelelő hormonális kezelést javasolhat.',
    alertTitle: 'Nincs öngyógyítás',
    alertText:
      'A hormonális akné kezeléseit (helyi vagy hormonális) egészségügyi szakembernek kell felírnia és ellenőriznie, különösen ha babát szeretnél.',
    h6Title: 'Mikor menj orvoshoz?',
    body6:
      'Az orvosi tanács különösen hasznos bizonyos helyzetekben:',
    consultReasons: [
      'Akné, amely megfelelő ápolás ellenére is fennáll',
      'Fájdalmas vagy mély kiütések (csomók, ciszták)',
      'Súlyos akné vagy gyorsan romló akné',
      'Foltok vagy hegek, amelyek megtelepednek',
    ],
    h7Title: 'Legfontosabb tudnivalók',
    summaryTitle: 'A lényeges pontok',
    keyPoints: [
      'A hormonális aknénak azonosítható oka van, amely az androgénekhez kapcsolódik.',
      'Gyakran érinti az arc alsó részét, és a menstruáció előtt rosszabbodhat.',
      'Sem nem a higiénia hiánya, sem nem elkerülhetetlenség.',
      'A kíméletes ápolás és — szükség esetén — megfelelő kezelés javíthat rajta.',
      'Egy bőrgyógyász vagy nőgyógyász támogathat, ha fennmarad.',
    ],
    finalNoteTitle: 'Útmutató a jobb megértéshez',
    finalNoteText:
      'Ez a cikk kizárólag általános tájékoztatásra szolgál, és nem helyettesíti az orvosi konzultációt. Kétség esetén vagy ha a tünetek fennmaradnak, kérj tanácsot egészségügyi szakembertől.',
    shareMessage: 'A hormonális akné megértése — AWA',
  },
  ro: {
    badge: 'SOP • ACNEE HORMONALĂ',
    title: 'Înțelegerea\nacneei hormonale',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut educativ',
    intro:
      'De ce poate apărea acneea hormonală în SOP, cum o recunoști și ce soluții pot ajuta la gestionarea ei.',
    introSecondary:
      'Afectează multe femei și nu este nici o lipsă de igienă, nici o fatalitate: înțelegerea originii ei ajută la o mai bună gestionare.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este acneea hormonală?',
      'De ce poate SOP să provoace acnee?',
      'Cum recunoști acneea hormonală',
      'Acneea hormonală și ciclul menstrual',
      'Ce poate ajuta',
      'Când să mergi la medic?',
      'Ce să reții',
    ],
    h1: 'Ce este acneea hormonală?',
    body1a:
      'Acneea hormonală este o formă de acnee legată direct de fluctuații sau dezechilibre hormonale, în special ale androgenilor. Spre deosebire de acneea mai tipică a adolescenței, ea afectează adesea femeile adulte și poate persista sau apărea după acea perioadă.',
    body1b:
      'Se deosebește și prin localizare, prin profunzime și prin tendința de a reapărea în aceleași locuri în ciuda unei rutine regulate de îngrijire bine urmate.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Acneea hormonală nu este legată de o lipsă de igienă: spălatul mai des pe față nu o face să dispară și poate chiar irita pielea.',
    h2Title: 'De ce poate SOP să provoace acnee?',
    body2:
      'În SOP, un exces relativ de androgeni stimulează glandele sebacee, care produc atunci mai mult sebum. Unele tipuri de piele sunt și mai sensibile la acești hormoni, ceea ce explică de ce acneea poate fi pronunțată chiar și fără un dezechilibru major măsurat în laborator.',
    neutralText:
      'Nu este o chestiune de voință: această sensibilitate variază de la o persoană la alta și nu depinde de obiceiurile tale de viață.',
    h3Title: 'Cum recunoști acneea hormonală',
    body3:
      'Anumite trăsături se repetă adesea, deși nu în mod sistematic:',
    recognizeSigns: [
      'Partea inferioară a feței: linia maxilarului, bărbia',
      'Erupții mai profunde, uneori dureroase',
      'Reapare adesea în aceleași locuri',
      'Roșeață sau urme care persistă',
    ],
    h4Title: 'Acneea hormonală și ciclul menstrual',
    body4:
      'Acneea hormonală poate fluctua pe parcursul ciclului. Multe femei observă o acutizare în zilele dinaintea menstruației, când progesteronul crește și apoi scade brusc, stimulând temporar producția de sebum.',
    highlightTitle: 'Urmărirea acutizărilor',
    highlightText:
      'Notarea momentului în care apar erupțiile în raport cu ciclul tău vă poate ajuta, pe tine și pe dermatologul tău, să înțelegeți mai bine legătura hormonală.',
    h5Title: 'Ce poate ajuta',
    body5a:
      'Câteva obiceiuri simple de îngrijire pot ajuta la limitarea acutizărilor, fără a o face să dispară complet de la sine:',
    careHabits: [
      'Curăță-ți blând pielea dimineața și seara',
      'Evită produsele agresive sau decapante',
      'Protejează-ți zilnic pielea de soare',
      'Evită să strângi sau să scobești erupțiile',
    ],
    body5b:
      'În funcție de situație, un dermatolog sau un ginecolog poate propune tratamente locale (creme, geluri) sau, la nevoie, un tratament hormonal potrivit.',
    alertTitle: 'Fără automedicație',
    alertText:
      'Tratamentele pentru acneea hormonală (locale sau hormonale) trebuie prescrise și monitorizate de un profesionist din domeniul sănătății, mai ales dacă speri să rămâi însărcinată.',
    h6Title: 'Când să mergi la medic?',
    body6:
      'Un sfat medical este deosebit de util în anumite situații:',
    consultReasons: [
      'Acnee care persistă în ciuda unei îngrijiri potrivite',
      'Erupții dureroase sau profunde (noduli, chisturi)',
      'Acnee severă sau care se agravează rapid',
      'Urme sau cicatrici care se instalează',
    ],
    h7Title: 'Ce să reții',
    summaryTitle: 'Punctele esențiale',
    keyPoints: [
      'Acneea hormonală are o cauză identificabilă, legată de androgeni.',
      'Afectează adesea partea inferioară a feței și se poate agrava înainte de menstruație.',
      'Nu este nici o lipsă de igienă, nici o fatalitate.',
      'O îngrijire blândă și, la nevoie, un tratament potrivit o pot îmbunătăți.',
      'Un dermatolog sau un ginecolog te poate sprijini dacă persistă.',
    ],
    finalNoteTitle: 'Un ghid pentru o mai bună înțelegere',
    finalNoteText:
      'Acest articol are doar caracter informativ general și nu înlocuiește o consultație medicală. Dacă ai îndoieli sau simptomele persistă, cere sfatul unui profesionist din domeniul sănătății.',
    shareMessage: 'Înțelegerea acneei hormonale — AWA',
  },
  bg: {
    badge: 'СПКЯ • ХОРМОНАЛНО АКНЕ',
    title: 'Разбиране на\nхормоналното акне',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Образователно съдържание',
    intro:
      'Защо хормоналното акне може да се появи при СПКЯ, как да го разпознаеш и какви решения могат да помогнат да се справиш с него.',
    introSecondary:
      'Засяга много жени и не е нито липса на хигиена, нито неизбежност: разбирането на произхода му помага да се справяш по-добре.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е хормонално акне?',
      'Защо СПКЯ може да причини акне?',
      'Как да разпознаеш хормоналното акне',
      'Хормонално акне и менструален цикъл',
      'Какво може да помогне',
      'Кога да посетиш лекар?',
      'Какво да запомниш',
    ],
    h1: 'Какво е хормонално акне?',
    body1a:
      'Хормоналното акне е форма на акне, пряко свързана с хормонални колебания или дисбаланс, особено на андрогените. За разлика от по-типичното акне в юношеството, то често засяга възрастни жени и може да персистира или да се появи след този период.',
    body1b:
      'Отличава се и с местоположението си, дълбочината си и склонността си да се появява отново на същите места въпреки добре следвана редовна грижа за кожата.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Хормоналното акне не е свързано с липса на хигиена: по-честото миене на лицето не го премахва и дори може да раздразни кожата.',
    h2Title: 'Защо СПКЯ може да причини акне?',
    body2:
      'При СПКЯ относителният излишък на андрогени стимулира мастните жлези, които тогава произвеждат повече себум. Някои кожи са и по-чувствителни към тези хормони, което обяснява защо акнето може да е изразено дори без голям дисбаланс, измерен в лаборатория.',
    neutralText:
      'Това не е въпрос на силна воля: тази чувствителност варира от човек на човек и не зависи от навиците ти на живот.',
    h3Title: 'Как да разпознаеш хормоналното акне',
    body3:
      'Някои характеристики често се повтарят, макар и не системно:',
    recognizeSigns: [
      'Долната част на лицето: челюстна линия, брадичка',
      'По-дълбоки, понякога болезнени пъпки',
      'Често се появява отново на същите места',
      'Зачервяване или следи, които се задържат',
    ],
    h4Title: 'Хормонално акне и менструален цикъл',
    body4:
      'Хормоналното акне може да се колебае през цикъла. Много жени забелязват обостряне в дните преди менструацията, когато прогестеронът се покачва и после рязко пада, временно стимулирайки производството на себум.',
    highlightTitle: 'Проследяване на обострянията',
    highlightText:
      'Отбелязването кога се появяват пъпките спрямо цикъла ти може да помогне на теб и на дерматолога ти да разберете по-добре хормоналната връзка.',
    h5Title: 'Какво може да помогне',
    body5a:
      'Няколко прости навика на грижа могат да помогнат да се ограничат обострянията, без да ги премахнат напълно сами по себе си:',
    careHabits: [
      'Почиствай кожата си нежно сутрин и вечер',
      'Избягвай груби или пресушаващи продукти',
      'Предпазвай кожата си от слънцето всеки ден',
      'Избягвай да стискаш или късаш пъпките',
    ],
    body5b:
      'Според ситуацията дерматолог или гинеколог може да предложи локални лечения (кремове, гелове) или, при нужда, подходящо хормонално лечение.',
    alertTitle: 'Без самолечение',
    alertText:
      'Лечението на хормоналното акне (локално или хормонално) трябва да се предписва и наблюдава от здравен специалист, особено ако се надяваш да зачена.',
    h6Title: 'Кога да посетиш лекар?',
    body6:
      'Медицинският съвет е особено полезен в някои ситуации:',
    consultReasons: [
      'Акне, което упорито остава въпреки подходяща грижа',
      'Болезнени или дълбоки пъпки (възли, кисти)',
      'Тежко акне или акне, което бързо се влошава',
      'Следи или белези, които се установяват',
    ],
    h7Title: 'Какво да запомниш',
    summaryTitle: 'Основните точки',
    keyPoints: [
      'Хормоналното акне има разпознаваема причина, свързана с андрогените.',
      'Често засяга долната част на лицето и може да се влоши преди менструация.',
      'То не е нито липса на хигиена, нито неизбежност.',
      'Нежната грижа и при нужда подходящо лечение могат да го подобрят.',
      'Дерматолог или гинеколог може да те подкрепи, ако продължава.',
    ],
    finalNoteTitle: 'Ръководство за по-добро разбиране',
    finalNoteText:
      'Тази статия е само за обща информация и не замества медицинска консултация. При съмнение или ако симптомите продължават, потърси съвет от здравен специалист.',
    shareMessage: 'Разбиране на хормоналното акне — AWA',
  },
  sr: {
    badge: 'ПЦОС • ХОРМОНСКЕ АКНЕ',
    title: 'Разумевање\nхормонских акни',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Образовни садржај',
    intro:
      'Зашто се хормонске акне могу појавити уз ПЦОС, како их препознати и која решења могу помоћи да се њима управља.',
    introSecondary:
      'Погађају многе жене и нису ни недостатак хигијене ни неизбежност: разумевање њиховог порекла помаже да се боље њима управља.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта су хормонске акне?',
      'Зашто ПЦОС може изазвати акне?',
      'Како препознати хормонске акне',
      'Хормонске акне и менструални циклус',
      'Шта може помоћи',
      'Када посетити лекара?',
      'Шта да запамтиш',
    ],
    h1: 'Шта су хормонске акне?',
    body1a:
      'Хормонске акне су облик акни директно повезан са хормонским колебањима или дисбалансом, нарочито андрогена. За разлику од типичнијих акни у адолесценцији, оне често погађају одрасле жене и могу трајати или се појавити после тог периода.',
    body1b:
      'Одликују се и локацијом, дубином и склоношћу да се појаве на истим местима упркос добро праћеној редовној нези коже.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Хормонске акне нису повезане са недостатком хигијене: чешће прање лица их не уклања и може чак иритирати кожу.',
    h2Title: 'Зашто ПЦОС може изазвати акне?',
    body2:
      'Код ПЦОС-а релативни вишак андрогена стимулише лојне жлезде, које тада производе више себума. Нека кожа је и осетљивија на ове хормоне, што објашњава зашто акне могу бити изражене чак и без великог дисбаланса измереног у лабораторији.',
    neutralText:
      'То није питање воље: ова осетљивост варира од особе до особе и не зависи од твојих навика у начину живота.',
    h3Title: 'Како препознати хормонске акне',
    body3:
      'Одређене карактеристике се често понављају, мада не системски:',
    recognizeSigns: [
      'Доњи део лица: линија вилице, брадичка',
      'Дубљи, понекад болни пришти',
      'Често се понављају на истим местима',
      'Црвенило или трагови који трају',
    ],
    h4Title: 'Хормонске акне и менструални циклус',
    body4:
      'Хормонске акне могу флуктуирати током циклуса. Многе жене примећују погоршање у данима пре менструације, када прогестерон расте, а затим нагло пада, привремено стимулишући производњу себума.',
    highlightTitle: 'Праћење погоршања',
    highlightText:
      'Бележење када се пришти појављују у односу на твој циклус може помоћи теби и твом дерматологу да боље разумете хормонску везу.',
    h5Title: 'Шта може помоћи',
    body5a:
      'Неколико једноставних навика неге може помоћи да се ограниче погоршања, без потпуног уклањања самих по себи:',
    careHabits: [
      'Нежно чисти кожу ујутру и увече',
      'Избегавај оштре или исушујуће производе',
      'Штити кожу од сунца свакодневно',
      'Избегавај стискање или чачкање пришти',
    ],
    body5b:
      'Зависно од ситуације, дерматолог или гинеколог може предложити локалне терапије (креме, гелове) или, по потреби, одговарајућу хормонску терапију.',
    alertTitle: 'Без самолечења',
    alertText:
      'Лечење хормонских акни (локално или хормонско) мора да пропише и прати здравствени радник, нарочито ако се надаш да затрудниш.',
    h6Title: 'Када посетити лекара?',
    body6:
      'Медицински савет је посебно користан у одређеним ситуацијама:',
    consultReasons: [
      'Акне које трају упркос одговарајућој нези',
      'Болни или дубоки пришти (чворови, цисте)',
      'Тешке акне или акне које се брзо погоршавају',
      'Трагови или ожиљци који се установљују',
    ],
    h7Title: 'Шта да запамтиш',
    summaryTitle: 'Основне тачке',
    keyPoints: [
      'Хормонске акне имају препознатљив узрок, повезан са андрогенима.',
      'Често погађају доњи део лица и могу се погоршати пре менструације.',
      'Оне нису ни недостатак хигијене ни неизбежност.',
      'Нежна нега и, по потреби, одговарајућа терапија могу их побољшати.',
      'Дерматолог или гинеколог може те подржати ако трају.',
    ],
    finalNoteTitle: 'Водич за боље разумевање',
    finalNoteText:
      'Овај чланак је само за општу информацију и не замењује лекарску консултацију. При сумњи или ако симптоми трају, потражи савет од здравственог радника.',
    shareMessage: 'Разумевање хормонских акни — AWA',
  },
  hr: {
    badge: 'PCOS • HORMONSKE AKNE',
    title: 'Razumijevanje\nhormonskih akni',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Edukativni sadržaj',
    intro:
      'Zašto se hormonske akne mogu pojaviti uz PCOS, kako ih prepoznati i koja rješenja mogu pomoći u njihovu zbrinjavanju.',
    introSecondary:
      'Pogađaju mnoge žene i nisu ni nedostatak higijene ni neizbježnost: razumijevanje njihova podrijetla pomaže ih bolje zbrinjavati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što su hormonske akne?',
      'Zašto PCOS može uzrokovati akne?',
      'Kako prepoznati hormonske akne',
      'Hormonske akne i menstrualni ciklus',
      'Što može pomoći',
      'Kada posjetiti liječnika?',
      'Ključne poruke',
    ],
    h1: 'Što su hormonske akne?',
    body1a:
      'Hormonske akne oblik su akni izravno povezan s hormonskim fluktuacijama ili neravnotežom, osobito androgena. Za razliku od tipičnijih akni adolescencije, često pogađaju odrasle žene i mogu potrajati ili se pojaviti nakon tog razdoblja.',
    body1b:
      'Također se razlikuju po lokaciji, dubini i sklonosti ponovnom pojavljivanju na istim mjestima unatoč dobro provođenoj redovitoj njezi kože.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Hormonske akne nisu povezane s nedostatkom higijene: češće pranje lica ne uklanja ih, a može i iritirati kožu.',
    h2Title: 'Zašto PCOS može uzrokovati akne?',
    body2:
      'Kod PCOS-a relativni višak androgena potiče lojne žlijezde, koje tada stvaraju više sebuma. Neka je koža i osjetljivija na te hormone, što objašnjava zašto akne mogu biti izražene i bez velike neravnoteže izmjerene u laboratoriju.',
    neutralText:
      'To nije pitanje snage volje: ta osjetljivost razlikuje se od osobe do osobe i ne ovisi o tvojim životnim navikama.',
    h3Title: 'Kako prepoznati hormonske akne',
    body3:
      'Određena obilježja često se ponavljaju, iako ne sustavno:',
    recognizeSigns: [
      'Donji dio lica: linija čeljusti, brada',
      'Dublje, ponekad bolne upale',
      'Često se ponovno pojavljuju na istim mjestima',
      'Crvenilo ili tragovi koji ostaju',
    ],
    h4Title: 'Hormonske akne i menstrualni ciklus',
    body4:
      'Hormonske akne mogu se mijenjati tijekom ciklusa. Mnoge žene primjećuju pogoršanje u danima prije menstruacije, kad progesteron raste, a zatim naglo pada, privremeno potičući stvaranje sebuma.',
    highlightTitle: 'Praćenje pogoršanja',
    highlightText:
      'Bilježenje kada se upale javljaju u odnosu na ciklus može pomoći tebi i tvom dermatologu da bolje razumijete hormonsku vezu.',
    h5Title: 'Što može pomoći',
    body5a:
      'Nekoliko jednostavnih navika njege može pomoći ograničiti pogoršanja, iako ih same ne uklanjaju u potpunosti:',
    careHabits: [
      'Nježno čisti kožu ujutro i navečer',
      'Izbjegavaj oštre proizvode ili one koji isušuju',
      'Svakodnevno štiti kožu od sunca',
      'Izbjegavaj cijeđenje i čačkanje upala',
    ],
    body5b:
      'Ovisno o situaciji, dermatolog ili ginekolog može predložiti lokalne terapije (kreme, gelove) ili, ako je potrebno, prikladnu hormonsku terapiju.',
    alertTitle: 'Bez samoliječenja',
    alertText:
      'Terapije za hormonske akne (lokalne ili hormonske) mora propisati i pratiti zdravstveni djelatnik, osobito ako se nadaš začeću.',
    h6Title: 'Kada posjetiti liječnika?',
    body6:
      'Liječnički savjet osobito je koristan u određenim situacijama:',
    consultReasons: [
      'Akne koje traju unatoč prikladnoj njezi',
      'Bolne ili duboke upale (čvorovi, ciste)',
      'Teške akne ili akne koje se brzo pogoršavaju',
      'Tragovi ili ožiljci koji se uspostavljaju',
    ],
    h7Title: 'Ključne poruke',
    summaryTitle: 'Bitne točke',
    keyPoints: [
      'Hormonske akne imaju prepoznatljiv uzrok, povezan s androgenima.',
      'Često pogađaju donji dio lica i mogu se pogoršati prije menstruacije.',
      'Nisu ni nedostatak higijene ni neizbježnost.',
      'Nježna njega i, ako je potrebno, prikladna terapija mogu ih poboljšati.',
      'Dermatolog ili ginekolog može te podržati ako potraju.',
    ],
    finalNoteTitle: 'Vodič za bolje razumijevanje',
    finalNoteText:
      'Ovaj je članak samo opće informativne naravi i ne zamjenjuje liječnički pregled. U slučaju nedoumice ili ako simptomi potraju, zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Razumijevanje hormonskih akni — AWA',
  },
  bs: {
    badge: 'PCOS • HORMONSKE AKNE',
    title: 'Razumijevanje\nhormonskih akni',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Edukativni sadržaj',
    intro:
      'Zašta se hormonske akne mogu pojaviti uz PCOS, kako ih prepoznati i koja rješenja mogu pomoći u njihovu zbrinjavanju.',
    introSecondary:
      'Pogađaju mnoge žene i nisu ni nedostatak higijene ni neizbježnost: razumijevanje njihova podrijetla pomaže ih bolje zbrinjavati.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što su hormonske akne?',
      'Zašta PCOS može uzrokovati akne?',
      'Kako prepoznati hormonske akne',
      'Hormonske akne i menstrualni ciklus',
      'Što može pomoći',
      'Kada posjetiti ljekara?',
      'Ključne poruke',
    ],
    h1: 'Što su hormonske akne?',
    body1a:
      'Hormonske akne oblik su akni izravno povezan s hormonskim fluktuacijama ili neravnotežom, osobito androgena. Za razliku od tipičnijih akni adolescencije, često pogađaju odrasle žene i mogu potrajati ili se pojaviti nakon tog razdoblja.',
    body1b:
      'Također se razlikuju po lokaciji, dubini i sklonosti ponovnom pojavljivanju na istim mjestima unatoč dobro provođenoj redovitoj njezi kože.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Hormonske akne nisu povezane s nedostatkom higijene: češće pranje lica ne uklanja ih, a može i iritirati kožu.',
    h2Title: 'Zašta PCOS može uzrokovati akne?',
    body2:
      'Kod PCOS-a relativni višak androgena potiče lojne žlijezde, koje tada stvaraju više sebuma. Neka je koža i osjetljivija na te hormone, što objašnjava zašta akne mogu biti izražene i bez velike neravnoteže izmjerene u laboratoriju.',
    neutralText:
      'To nije pitanje snage volje: ta osjetljivost razlikuje se od osobe do osobe i ne ovisi o tvojim životnim navikama.',
    h3Title: 'Kako prepoznati hormonske akne',
    body3:
      'Određena obilježja često se ponavljaju, iako ne sistemno:',
    recognizeSigns: [
      'Donji dio lica: linija čeljusti, brada',
      'Dublje, ponekad bolne upale',
      'Često se ponovno pojavljuju na istim mjestima',
      'Crvenilo ili tragovi koji ostaju',
    ],
    h4Title: 'Hormonske akne i menstrualni ciklus',
    body4:
      'Hormonske akne mogu se mijenjati tokom ciklusa. Mnoge žene primjećuju pogoršanje u danima prije menstruacije, kad progesteron raste, a zatim naglo pada, privremeno potičući stvaranje sebuma.',
    highlightTitle: 'Praćenje pogoršanja',
    highlightText:
      'Bilježenje kada se upale javljaju u odnosu na ciklus može pomoći tebi i tvom dermatologu da bolje razumijete hormonsku vezu.',
    h5Title: 'Što može pomoći',
    body5a:
      'Nekoliko jednostavnih navika njege može pomoći ograničiti pogoršanja, iako ih same ne uklanjaju u potpunosti:',
    careHabits: [
      'Nježno čisti kožu ujutro i navečer',
      'Izbjegavaj oštre proizvode ili one koji isušuju',
      'Svakodnevno štiti kožu od sunca',
      'Izbjegavaj cijeđenje i čačkanje upala',
    ],
    body5b:
      'Ovisno o situaciji, dermatolog ili ginekolog može predložiti lokalne terapije (kreme, gelove) ili, ako je potrebno, prikladnu hormonsku terapiju.',
    alertTitle: 'Bez samoliječenja',
    alertText:
      'Terapije za hormonske akne (lokalne ili hormonske) mora propisati i pratiti zdravstveni radnik, osobito ako se nadaš začeću.',
    h6Title: 'Kada posjetiti ljekara?',
    body6:
      'Ljekarski savjet osobito je koristan u određenim situacijama:',
    consultReasons: [
      'Akne koje traju unatoč prikladnoj njezi',
      'Bolne ili duboke upale (čvorovi, ciste)',
      'Teške akne ili akne koje se brzo pogoršavaju',
      'Tragovi ili ožiljci koji se uspostavljaju',
    ],
    h7Title: 'Ključne poruke',
    summaryTitle: 'Bitne tačke',
    keyPoints: [
      'Hormonske akne imaju prepoznatljiv uzrok, povezan s androgenima.',
      'Često pogađaju donji dio lica i mogu se pogoršati prije menstruacije.',
      'Nisu ni nedostatak higijene ni neizbježnost.',
      'Nježna njega i, ako je potrebno, prikladna terapija mogu ih poboljšati.',
      'Dermatolog ili ginekolog može te podržati ako potraju.',
    ],
    finalNoteTitle: 'Vodič za bolje razumijevanje',
    finalNoteText:
      'Ovaj je članak samo opće informativne naravi i ne zamjenjuje ljekarski pregled. U slučaju nedoumice ili ako simptomi potraju, zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Razumijevanje hormonskih akni — AWA',
  },
  sl: {
    badge: 'PCOS • HORMONSKE AKNE',
    title: 'Razumevanje\nhormonskih akn',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Izobraževalna vsebina',
    intro:
      'Zakaj se hormonske akne lahko pojavijo ob PCOS, kako jih prepoznati in katere rešitve lahko pomagajo pri njihovem obvladovanju.',
    introSecondary:
      'Prizadenejo mnoge ženske in niso niti pomanjkanje higiene niti neizogibnost: razumevanje njihovega izvora pomaga jih bolje obvladovati.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj so hormonske akne?',
      'Zakaj lahko PCOS povzroči akne?',
      'Kako prepoznati hormonske akne',
      'Hormonske akne in menstrualni cikel',
      'Kaj lahko pomaga',
      'Kdaj obiskati zdravnika?',
      'Ključna sporočila',
    ],
    h1: 'Kaj so hormonske akne?',
    body1a:
      'Hormonske akne so oblika akn, neposredno povezana s hormonskimi nihanji ali neravnovesjem, zlasti androgenov. Za razliko od tipičnejših akn adolescence pogosto prizadenejo odrasle ženske in lahko trajajo ali se pojavijo po tem obdobju.',
    body1b:
      'Razlikujejo se tudi po lokaciji, globini in nagnjenosti k ponovnemu pojavljanju na istih mestih kljub dobro izvajani redni negi kože.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Hormonske akne niso povezane s pomanjkanjem higiene: pogostejše umivanje obraza jih ne odpravi, lahko pa celo draži kožo.',
    h2Title: 'Zakaj lahko PCOS povzroči akne?',
    body2:
      'Pri PCOS relativni presežek androgenov spodbuja lojne žleze, ki nato proizvajajo več loja. Nekatera koža je tudi občutljivejša na te hormone, kar pojasnjuje, zakaj so akne lahko izrazite tudi brez velikega neravnovesja, izmerjenega v laboratoriju.',
    neutralText:
      'To ni vprašanje moči volje: ta občutljivost se razlikuje od osebe do osebe in ni odvisna od tvojih življenjskih navad.',
    h3Title: 'Kako prepoznati hormonske akne',
    body3:
      'Določene značilnosti se pogosto ponavljajo, čeprav ne sistematično:',
    recognizeSigns: [
      'Spodnji del obraza: linija čeljusti, brada',
      'Globlja, včasih boleča vnetja',
      'Pogosto se ponovno pojavijo na istih mestih',
      'Rdečina ali sledi, ki ostanejo',
    ],
    h4Title: 'Hormonske akne in menstrualni cikel',
    body4:
      'Hormonske akne se lahko spreminjajo skozi cikel. Mnoge ženske opazijo poslabšanje v dneh pred menstruacijo, ko progesteron raste, nato pa naglo pade, kar začasno spodbuja nastajanje loja.',
    highlightTitle: 'Spremljanje poslabšanj',
    highlightText:
      'Beleženje, kdaj se vnetja pojavljajo glede na cikel, lahko pomaga tebi in tvojemu dermatologu bolje razumeti hormonsko povezavo.',
    h5Title: 'Kaj lahko pomaga',
    body5a:
      'Nekaj preprostih navad nege lahko pomaga omejiti poslabšanja, čeprav jih same ne odpravijo povsem:',
    careHabits: [
      'Nežno čisti kožo zjutraj in zvečer',
      'Izogibaj se ostrim izdelkom ali tistim, ki izsušujejo',
      'Vsak dan zaščiti kožo pred soncem',
      'Izogibaj se ožemanju in praskanju vnetij',
    ],
    body5b:
      'Glede na situacijo lahko dermatolog ali ginekolog predlaga lokalna zdravljenja (kreme, gele) ali, če je potrebno, primerno hormonsko zdravljenje.',
    alertTitle: 'Brez samozdravljenja',
    alertText:
      'Zdravljenja hormonskih akn (lokalna ali hormonska) mora predpisati in spremljati zdravstveni delavec, zlasti če upaš na zanositev.',
    h6Title: 'Kdaj obiskati zdravnika?',
    body6:
      'Zdravniški nasvet je še posebej koristen v določenih situacijah:',
    consultReasons: [
      'Akne, ki trajajo kljub ustrezni negi',
      'Boleča ali globoka vnetja (vozli, ciste)',
      'Hude akne ali akne, ki se hitro poslabšujejo',
      'Sledi ali brazgotine, ki se vzpostavljajo',
    ],
    h7Title: 'Ključna sporočila',
    summaryTitle: 'Bistvene točke',
    keyPoints: [
      'Hormonske akne imajo prepoznaven vzrok, povezan z androgeni.',
      'Pogosto prizadenejo spodnji del obraza in se lahko poslabšajo pred menstruacijo.',
      'Niso niti pomanjkanje higiene niti neizogibnost.',
      'Nežna nega in, če je potrebno, primerno zdravljenje jih lahko izboljšata.',
      'Dermatolog ali ginekolog te lahko podpre, če vztrajajo.',
    ],
    finalNoteTitle: 'Vodnik za boljše razumevanje',
    finalNoteText:
      'Ta članek je samo splošne informativne narave in ne nadomešča zdravniškega pregleda. V primeru dvoma ali če simptomi vztrajajo, poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Razumevanje hormonskih akn — AWA',
  },
  ne: {
    badge: 'PCOS • हर्मोनल पिम्पल',
    title: 'हर्मोनल पिम्पल\nबुझ्नुहोस्',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'शैक्षिक सामग्री',
    intro:
      'PCOS मा हर्मोनल पिम्पल किन देखिन सक्छ, यसलाई कसरी चिन्ने, र व्यवस्थापन गर्न कुन समाधानहरूले मद्दत गर्न सक्छन्।',
    introSecondary:
      'यसले धेरै महिलालाई असर गर्छ र यो न त सरसफाइको कमी हो न त अनिवार्यता: यसको उत्पत्ति बुझ्नाले यसलाई राम्ररी व्यवस्थापन गर्न मद्दत गर्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'हर्मोनल पिम्पल के हो?',
      'PCOS ले पिम्पल किन निम्त्याउन सक्छ?',
      'हर्मोनल पिम्पल कसरी चिन्ने',
      'हर्मोनल पिम्पल र मासिक चक्र',
      'के मद्दत गर्न सक्छ',
      'चिकित्सकलाई कहिले देखाउने?',
      'मुख्य कुराहरू',
    ],
    h1: 'हर्मोनल पिम्पल के हो?',
    body1a:
      'हर्मोनल पिम्पल पिम्पलको एउटा रूप हो जुन हर्मोनल उतारचढाव वा असन्तुलन, विशेष गरी एन्ड्रोजनमा, सँग सिधै जोडिएको हुन्छ। किशोरावस्थाको अझ सामान्य पिम्पलभन्दा फरक, यसले प्रायः वयस्क महिलालाई असर गर्छ र त्यो अवधिपछि पनि रहिरहन वा देखिन सक्छ।',
    body1b:
      'यसलाई यसको स्थान, गहिराइ, र राम्ररी पछ्याइएको नियमित छाला हेरचाहको दिनचर्या हुँदाहुँदै पनि उही ठाउँमा फेरि देखिने प्रवृत्तिले पनि छुट्ट्याउँछ।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'हर्मोनल पिम्पल सरसफाइको कमीसँग जोडिएको हुँदैन: अनुहार बढी पटक धुँदा यो हराउँदैन, र छालामा जलन पनि गराउन सक्छ।',
    h2Title: 'PCOS ले पिम्पल किन निम्त्याउन सक्छ?',
    body2:
      'PCOS मा, एन्ड्रोजनको सापेक्षिक अधिकताले सेबेसियस ग्रन्थिहरूलाई उत्तेजित गर्छ, जसले त्यसपछि बढी सेबम उत्पादन गर्छन्। केही छाला यी हर्मोनहरूप्रति बढी संवेदनशील पनि हुन्छ, जसले प्रयोगशालामा नापिएको ठूलो असन्तुलनबिना पनि पिम्पल किन स्पष्ट हुन सक्छ भन्ने व्याख्या गर्छ।',
    neutralText:
      'यो इच्छाशक्तिको कुरा होइन: यो संवेदनशीलता व्यक्तिपिच्छे फरक हुन्छ र तपाईंको जीवनशैलीका बानीमा निर्भर गर्दैन।',
    h3Title: 'हर्मोनल पिम्पल कसरी चिन्ने',
    body3:
      'केही विशेषताहरू प्रायः दोहोरिन्छन्, व्यवस्थित रूपमा नभए पनि:',
    recognizeSigns: [
      'तल्लो अनुहार: बङ्गारा, चिउँडो',
      'गहिरा, कहिलेकाहीँ दुखाइसहितका फोका',
      'प्रायः उही ठाउँमा फेरि देखिन्छ',
      'रातोपन वा दाग जो रहिरहन्छ',
    ],
    h4Title: 'हर्मोनल पिम्पल र मासिक चक्र',
    body4:
      'हर्मोनल पिम्पल चक्रभरि उतारचढाव हुन सक्छ। धेरै महिलाले महिनावारीअघिका दिनहरूमा प्रकोप देख्छन्, जब प्रोजेस्टेरोन बढ्छ र त्यसपछि तीव्र रूपमा घट्छ, अस्थायी रूपमा सेबमको उत्पादन उत्तेजित गर्दै।',
    highlightTitle: 'आफ्ना प्रकोपहरू अनुगमन गर्ने',
    highlightText:
      'तपाईंको चक्रको तुलनामा फोकाहरू कहिले देखिन्छन् टिप्नाले तपाईं र तपाईंको छाला रोग विशेषज्ञलाई हर्मोनल सम्बन्ध राम्ररी बुझ्न मद्दत गर्न सक्छ।',
    h5Title: 'के मद्दत गर्न सक्छ',
    body5a:
      'केही सरल हेरचाहका बानीहरूले प्रकोपहरू सीमित गर्न मद्दत गर्न सक्छन्, आफैँ पूर्ण रूपमा नहटाई:',
    careHabits: [
      'बिहान र साँझ आफ्नो छाला कोमलतापूर्वक सफा गर्नुहोस्',
      'कडा वा छाला सुकाउने उत्पादनहरूबाट जोगिनुहोस्',
      'दैनिक आफ्नो छालालाई घामबाट जोगाउनुहोस्',
      'फोकाहरू निचोर्न वा कोट्याउनबाट जोगिनुहोस्',
    ],
    body5b:
      'अवस्थाअनुसार, छाला रोग विशेषज्ञ वा स्त्रीरोग विशेषज्ञले स्थानीय उपचार (क्रिम, जेल) वा, आवश्यक परे, उपयुक्त हर्मोनल उपचार सुझाउन सक्छन्।',
    alertTitle: 'आफैँ औषधि नलिनुहोस्',
    alertText:
      'हर्मोनल पिम्पलका उपचारहरू (स्थानीय वा हर्मोनल) स्वास्थ्यकर्मीद्वारा निर्धारित र निगरानी गरिनुपर्छ, विशेष गरी तपाईं गर्भधारणको आशा गर्दै हुनुहुन्छ भने।',
    h6Title: 'चिकित्सकलाई कहिले देखाउने?',
    body6:
      'चिकित्सकीय सल्लाह केही अवस्थाहरूमा विशेष रूपमा मद्दतकारी हुन्छ:',
    consultReasons: [
      'उपयुक्त हेरचाह गर्दा पनि रहिरहने पिम्पल',
      'दुखाइसहितका वा गहिरा फोकाहरू (नोड्युल, सिस्ट)',
      'गम्भीर वा छिटो बिग्रँदै जाने पिम्पल',
      'बस्दै गएका दाग वा डाम',
    ],
    h7Title: 'मुख्य कुराहरू',
    summaryTitle: 'आवश्यक बुँदाहरू',
    keyPoints: [
      'हर्मोनल पिम्पलको एन्ड्रोजनसँग जोडिएको पहिचान गर्न सकिने कारण हुन्छ।',
      'यसले प्रायः तल्लो अनुहारलाई असर गर्छ र महिनावारीअघि बिग्रन सक्छ।',
      'यो न त सरसफाइको कमी हो न त अनिवार्यता।',
      'कोमल हेरचाह र, आवश्यक परे, उपयुक्त उपचारले यसलाई सुधार्न सक्छ।',
      'यो रहिरहे छाला रोग विशेषज्ञ वा स्त्रीरोग विशेषज्ञले तपाईंलाई साथ दिन सक्छन्।',
    ],
    finalNoteTitle: 'राम्ररी बुझ्न मद्दत गर्ने मार्गदर्शन',
    finalNoteText:
      'यो लेख केवल सामान्य जानकारीका लागि हो र चिकित्सकीय परामर्शको स्थान लिँदैन। शङ्का भए वा लक्षणहरू रहिरहे स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    shareMessage: 'हर्मोनल पिम्पल बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'PCOS • හෝමෝන කුරුලෑ',
    title: 'හෝමෝන කුරුලෑ\nතේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'අධ්‍යාපනික අන්තර්ගතය',
    intro:
      'PCOS සමඟ හෝමෝන කුරුලෑ ඇතිවිය හැක්කේ ඇයි, ඒවා හඳුනාගන්නේ කෙසේද, සහ කළමනාකරණයට උපකාරී විය හැකි විසඳුම් මොනවාද.',
    introSecondary:
      'එය බොහෝ කාන්තාවන්ට බලපාන අතර සනීපාරක්ෂාව නොමැතිකමක් හෝ අනිවාර්ය දෙයක් නොවේ: එහි මූලාශ්‍රය තේරුම් ගැනීම එය වඩා හොඳින් කළමනාකරණය කිරීමට උපකාරී වේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'හෝමෝන කුරුලෑ යනු කුමක්ද?',
      'PCOS කුරුලෑ ඇති කළ හැක්කේ ඇයි?',
      'හෝමෝන කුරුලෑ හඳුනාගන්නේ කෙසේද',
      'හෝමෝන කුරුලෑ සහ ඔසප් චක්‍රය',
      'උපකාරී විය හැක්කේ කුමක්ද',
      'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද?',
      'ප්‍රධාන කරුණු',
    ],
    h1: 'හෝමෝන කුරුලෑ යනු කුමක්ද?',
    body1a:
      'හෝමෝන කුරුලෑ යනු හෝමෝන උච්චාවචනයට හෝ අසමතුලිතතාවකට, විශේෂයෙන් ඇන්ඩ්‍රජන්වලට, කෙලින්ම සම්බන්ධ කුරුලෑ වර්ගයකි. නව යොවුන් විය තුළ පොදු වන කුරුලෑවලට වෙනස්ව, එය බොහෝ විට වැඩිහිටි කාන්තාවන්ට බලපාන අතර ඉන්පසු පවතිය හැකි හෝ දිස්විය හැක.',
    body1b:
      'එය එහි පිහිටීම, එහි ගැඹුර සහ හොඳින් අනුගමනය කරන නිතිපතා සම් රැකවරණ පුරුද්දක් තිබියදීත් එම ස්ථානවලම නැවත දිස්වීමේ නැඹුරුව මගින්ද වෙන්කර හඳුනාගත හැක.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'හෝමෝන කුරුලෑ සනීපාරක්ෂාව නොමැතිකමට සම්බන්ධ නොවේ: ඔබේ මුහුණ වඩා නිතර සෝදා ගැනීම එය නැති කරන්නේ නැති අතර, සමට කෝපනයක්ද කළ හැක.',
    h2Title: 'PCOS කුරුලෑ ඇති කළ හැක්කේ ඇයි?',
    body2:
      'PCOS හිදී, ඇන්ඩ්‍රජන්වල සාපේක්ෂ අතිරික්තයක් සෙබේසියස් ග්‍රන්ථි උත්තේජනය කරන අතර, ඒවා එවිට වැඩි සීබම් නිපදවයි. සමහර සම මෙම හෝමෝනවලට වැඩි සංවේදී වන අතර, රසායනාගාරයේ මනින ලද විශාල අසමතුලිතතාවක් නොමැතිවත් කුරුලෑ කැපී පෙනෙන්නේ ඇයිදැයි එය පැහැදිලි කරයි.',
    neutralText:
      'මෙය කැමැත්ත පිළිබඳ කාරණයක් නොවේ: මෙම සංවේදීතාව පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වන අතර ඔබේ ජීවන රටා පුරුදු මත රඳා නොපවතී.',
    h3Title: 'හෝමෝන කුරුලෑ හඳුනාගන්නේ කෙසේද',
    body3:
      'සමහර ලක්ෂණ බොහෝ විට නැවත නැවත දිස්වේ, ක්‍රමානුකූල නොවුනත්:',
    recognizeSigns: [
      'පහළ මුහුණ: හකු රේඛාව, නිකට',
      'ගැඹුරු, සමහර විට වේදනාකාරී පුපුරා යාම්',
      'බොහෝ විට එම ස්ථානවලම නැවත දිස්වේ',
      'රතු පැහැය හෝ දිගටම පවතින සලකුණු',
    ],
    h4Title: 'හෝමෝන කුරුලෑ සහ ඔසප් චක්‍රය',
    body4:
      'හෝමෝන කුරුලෑ චක්‍රය පුරා උච්චාවචනය විය හැක. බොහෝ කාන්තාවන් ඔවුන්ගේ ඔසප්වලට පෙර දිනවල, ප්‍රොජෙස්ටරෝන් ඉහළ ගොස් පසුව තියුනු ලෙස පහත වැටෙන විට, සීබම් නිෂ්පාදනය තාවකාලිකව උත්තේජනය කරමින්, දැඩි වීමක් දකිති.',
    highlightTitle: 'ඔබේ දැඩි වීම් නිරීක්ෂණය කිරීම',
    highlightText:
      'ඔබේ චක්‍රයට සාපේක්ෂව පුපුරා යාම් දිස්වන විට සටහන් කිරීම ඔබටත් ඔබේ සමේ වෛද්‍යවරයාටත් හෝමෝන සම්බන්ධය වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක.',
    h5Title: 'උපකාරී විය හැක්කේ කුමක්ද',
    body5a:
      'සරල රැකවරණ පුරුදු කිහිපයකට දැඩි වීම් සීමා කිරීමට උපකාරී විය හැක, ඒවා තනිවම සම්පූර්ණයෙන් ඉවත් නොකළත්:',
    careHabits: [
      'උදෑසන සහ සවස ඔබේ සම මෘදුවට පිරිසිදු කරන්න',
      'දැඩි හෝ ඉවත් කරන නිෂ්පාදන වළක්වන්න',
      'දිනපතා හිරු එළියෙන් ඔබේ සම ආරක්ෂා කරන්න',
      'පුපුරා යාම් මිරිකීම හෝ සීරීම වළක්වන්න',
    ],
    body5b:
      'තත්ත්වය අනුව, සමේ වෛද්‍යවරයෙකුට හෝ නාරිවේද වෛද්‍යවරයෙකුට ස්ථානීය ප්‍රතිකාර (ක්‍රීම්, ජෙල්) හෝ, අවශ්‍ය නම්, සුදුසු හෝමෝන ප්‍රතිකාරයක් යෝජනා කළ හැක.',
    alertTitle: 'ස්වයං ප්‍රතිකාර නැත',
    alertText:
      'හෝමෝන කුරුලෑ සඳහා ප්‍රතිකාර (ස්ථානීය හෝ හෝමෝන) සෞඛ්‍ය වෘත්තිකයෙකු විසින් නියම කර අධීක්ෂණය කළ යුතුයි, විශේෂයෙන් ඔබ ගැබ්ගැනීමට බලාපොරොත්තු වන්නේ නම්.',
    h6Title: 'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද?',
    body6:
      'ඇතැම් අවස්ථාවලදී වෛද්‍ය උපදෙස් විශේෂයෙන් ප්‍රයෝජනවත්:',
    consultReasons: [
      'සුදුසු රැකවරණය තිබියදීත් දිගටම පවතින කුරුලෑ',
      'වේදනාකාරී හෝ ගැඹුරු පුපුරා යාම් (ගැටිති, කෝෂිකා)',
      'දැඩි කුරුලෑ හෝ වේගයෙන් නරක අතට හැරෙන කුරුලෑ',
      'ස්ථාපිත වන සලකුණු හෝ කැළැල්',
    ],
    h7Title: 'ප්‍රධාන කරුණු',
    summaryTitle: 'අත්‍යවශ්‍ය කරුණු',
    keyPoints: [
      'හෝමෝන කුරුලෑවලට ඇන්ඩ්‍රජන් සමඟ සම්බන්ධ හඳුනාගත හැකි හේතුවක් ඇත.',
      'එය බොහෝ විට පහළ මුහුණට බලපාන අතර ඔබේ ඔසප්වලට පෙර නරක අතට හැරිය හැක.',
      'එය සනීපාරක්ෂාව නොමැතිකමක් හෝ අනිවාර්ය දෙයක් නොවේ.',
      'මෘදු රැකවරණය සහ, අවශ්‍ය නම්, සුදුසු ප්‍රතිකාරයක් එය වැඩිදියුණු කළ හැක.',
      'එය දිගටම පවතී නම් සමේ වෛද්‍යවරයෙකුට හෝ නාරිවේද වෛද්‍යවරයෙකුට ඔබට සහාය විය හැක.',
    ],
    finalNoteTitle: 'වඩා හොඳින් තේරුම් ගැනීමට මාර්ගෝපදේශයක්',
    finalNoteText:
      'මෙම ලිපිය සාමාන්‍ය තොරතුරු සඳහා පමණක් වන අතර වෛද්‍ය උපදේශනයක් වෙනුවට නොපවතී. සැකයක් ඇත්නම් හෝ රෝග ලක්ෂණ දිගටම පවතී නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
    shareMessage: 'හෝමෝන කුරුලෑ තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'PCOS • สิวฮอร์โมน',
    title: 'ทำความเข้าใจ\nสิวฮอร์โมน',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาเพื่อการเรียนรู้',
    intro:
      'ทำไมสิวฮอร์โมนอาจเกิดขึ้นเมื่อเป็น PCOS สังเกตอย่างไร และวิธีแก้ที่อาจช่วยจัดการได้',
    introSecondary:
      'เกิดกับผู้หญิงจำนวนมาก และไม่ใช่เพราะขาดความสะอาดหรือสิ่งที่หลีกเลี่ยงไม่ได้: การเข้าใจที่มาช่วยให้จัดการได้ดีขึ้น',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'สิวฮอร์โมนคืออะไร?',
      'ทำไม PCOS จึงทำให้เกิดสิวได้?',
      'วิธีสังเกตสิวฮอร์โมน',
      'สิวฮอร์โมนกับรอบเดือน',
      'สิ่งที่ช่วยได้',
      'เมื่อไรควรพบแพทย์?',
      'ประเด็นสำคัญ',
    ],
    h1: 'สิวฮอร์โมนคืออะไร?',
    body1a:
      'สิวฮอร์โมนคือสิวรูปแบบหนึ่งที่เกี่ยวข้องโดยตรงกับความผันผวนหรือความไม่สมดุลของฮอร์โมน โดยเฉพาะแอนโดรเจน ต่างจากสิวทั่วไปในวัยรุ่น มักเกิดกับผู้หญิงวัยผู้ใหญ่และอาจคงอยู่หรือปรากฏหลังช่วงวัยนั้น',
    body1b:
      'ยังแตกต่างที่ตำแหน่ง ความลึก และแนวโน้มที่จะกลับมาที่จุดเดิม แม้จะดูแลผิวตามปกติอย่างสม่ำเสมอ',
    tip1Title: 'ควรรู้',
    tip1Text:
      'สิวฮอร์โมนไม่เกี่ยวกับการขาดความสะอาด: การล้างหน้าบ่อยขึ้นไม่ได้ทำให้สิวหาย และอาจระคายเคืองผิว',
    h2Title: 'ทำไม PCOS จึงทำให้เกิดสิวได้?',
    body2:
      'ใน PCOS การมีแอนโดรเจนมากเกินไปเมื่อเทียบกัน กระตุ้นต่อมไขมัน ซึ่งผลิตไขมันมากขึ้น ผิวบางคนยังไวต่อฮอร์โมนเหล่านี้มากกว่า ซึ่งอธิบายว่าทำไมสิวจึงอาจเด่นชัดแม้ไม่มีความไม่สมดุลมากที่วัดได้ในห้องปฏิบัติการ',
    neutralText:
      'นี่ไม่ใช่เรื่องของความตั้งใจ: ความไวนี้แตกต่างกันในแต่ละคนและไม่ขึ้นกับนิสัยในวิถีชีวิตของคุณ',
    h3Title: 'วิธีสังเกตสิวฮอร์โมน',
    body3:
      'ลักษณะบางอย่างมักเกิดซ้ำ แม้ไม่ได้เป็นทุกครั้ง:',
    recognizeSigns: [
      'ใบหน้าส่วนล่าง: แนวกราม คาง',
      'สิวที่ลึกกว่า บางครั้งเจ็บ',
      'มักกลับมาที่จุดเดิม',
      'รอยแดงหรือรอยที่คงอยู่',
    ],
    h4Title: 'สิวฮอร์โมนกับรอบเดือน',
    body4:
      'สิวฮอร์โมนอาจผันผวนตลอดรอบเดือน ผู้หญิงหลายคนสังเกตเห็นว่าสิวขึ้นมากในวันก่อนมีประจำเดือน เมื่อโปรเจสเตอโรนสูงขึ้นแล้วลดลงอย่างรวดเร็ว กระตุ้นการผลิตไขมันชั่วคราว',
    highlightTitle: 'ติดตามช่วงที่สิวกำเริบ',
    highlightText:
      'การจดว่าสิวขึ้นเมื่อไรเทียบกับรอบเดือนช่วยให้คุณและแพทย์ผิวหนังเข้าใจความเชื่อมโยงของฮอร์โมนได้ดีขึ้น',
    h5Title: 'สิ่งที่ช่วยได้',
    body5a:
      'นิสัยการดูแลง่าย ๆ ไม่กี่อย่างช่วยจำกัดการกำเริบได้ โดยไม่ได้ทำให้หายสนิทด้วยตัวเอง:',
    careHabits: [
      'ทำความสะอาดผิวอย่างอ่อนโยนเช้าและเย็น',
      'หลีกเลี่ยงผลิตภัณฑ์ที่แรงหรือทำให้ผิวแห้ง',
      'ปกป้องผิวจากแสงแดดทุกวัน',
      'หลีกเลี่ยงการบีบหรือแกะสิว',
    ],
    body5b:
      'ตามสถานการณ์ แพทย์ผิวหนังหรือสูตินรีแพทย์อาจแนะนำการรักษาเฉพาะที่ (ครีม เจล) หรือหากจำเป็น การรักษาด้วยฮอร์โมนที่เหมาะสม',
    alertTitle: 'อย่ารักษาตัวเอง',
    alertText:
      'การรักษาสิวฮอร์โมน (เฉพาะที่หรือฮอร์โมน) ต้องได้รับการสั่งและติดตามโดยบุคลากรทางการแพทย์ โดยเฉพาะหากคุณหวังจะตั้งครรภ์',
    h6Title: 'เมื่อไรควรพบแพทย์?',
    body6:
      'คำแนะนำทางการแพทย์มีประโยชน์เป็นพิเศษในบางสถานการณ์:',
    consultReasons: [
      'สิวที่คงอยู่แม้ดูแลอย่างเหมาะสม',
      'สิวที่เจ็บหรือลึก (สิวหัวช้าง ถุงสิว)',
      'สิวรุนแรงหรือแย่ลงอย่างรวดเร็ว',
      'รอยหรือแผลเป็นที่เริ่มคงอยู่',
    ],
    h7Title: 'ประเด็นสำคัญ',
    summaryTitle: 'ประเด็นสำคัญ',
    keyPoints: [
      'สิวฮอร์โมนมีสาเหตุที่ระบุได้ เกี่ยวข้องกับแอนโดรเจน',
      'มักเกิดที่ใบหน้าส่วนล่างและอาจแย่ลงก่อนมีประจำเดือน',
      'ไม่ใช่เพราะขาดความสะอาดหรือสิ่งที่หลีกเลี่ยงไม่ได้',
      'การดูแลอย่างอ่อนโยนและหากจำเป็น การรักษาที่เหมาะสม ช่วยให้ดีขึ้นได้',
      'แพทย์ผิวหนังหรือสูตินรีแพทย์สนับสนุนคุณได้หากยังคงอยู่',
    ],
    finalNoteTitle: 'คู่มือเพื่อความเข้าใจที่ดียิ่งขึ้น',
    finalNoteText:
      'บทความนี้เพื่อให้ข้อมูลทั่วไปเท่านั้นและไม่ได้ทดแทนการปรึกษาแพทย์ หากมีข้อสงสัยหรืออาการยังคงอยู่ โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'ทำความเข้าใจสิวฮอร์โมน — AWA',
  },
  vi: {
    badge: 'PCOS • MỤN DO NỘI TIẾT',
    title: 'Hiểu về\nmụn do nội tiết',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung giáo dục',
    intro:
      'Tại sao mụn do nội tiết có thể xuất hiện khi bị PCOS, cách nhận biết và những giải pháp có thể giúp kiểm soát nó.',
    introSecondary:
      'Nó ảnh hưởng đến nhiều phụ nữ và không phải do thiếu vệ sinh cũng không phải điều không thể tránh: hiểu nguồn gốc của nó giúp kiểm soát tốt hơn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Mụn do nội tiết là gì?',
      'Tại sao PCOS có thể gây mụn?',
      'Cách nhận biết mụn do nội tiết',
      'Mụn do nội tiết và chu kỳ kinh nguyệt',
      'Điều gì có thể giúp ích',
      'Khi nào nên đi khám bác sĩ?',
      'Những điểm chính cần nhớ',
    ],
    h1: 'Mụn do nội tiết là gì?',
    body1a:
      'Mụn do nội tiết là một dạng mụn liên quan trực tiếp đến dao động hoặc mất cân bằng nội tiết, đặc biệt là androgen. Khác với mụn điển hình hơn của tuổi thiếu niên, nó thường ảnh hưởng đến phụ nữ trưởng thành và có thể kéo dài hoặc xuất hiện sau giai đoạn đó.',
    body1b:
      'Nó cũng được phân biệt bởi vị trí, độ sâu và xu hướng tái xuất hiện ở cùng những chỗ dù đã thực hiện đều đặn quy trình chăm sóc da.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Mụn do nội tiết không liên quan đến việc thiếu vệ sinh: rửa mặt nhiều hơn không làm nó biến mất, thậm chí còn có thể làm da kích ứng.',
    h2Title: 'Tại sao PCOS có thể gây mụn?',
    body2:
      'Ở PCOS, sự dư thừa tương đối của androgen kích thích tuyến bã nhờn, khiến chúng sản xuất nhiều bã nhờn hơn. Một số làn da cũng nhạy cảm hơn với các hormone này, điều đó giải thích tại sao mụn có thể rõ rệt ngay cả khi không có sự mất cân bằng lớn được đo trong phòng xét nghiệm.',
    neutralText:
      'Đây không phải là vấn đề của ý chí: sự nhạy cảm này khác nhau giữa từng người và không phụ thuộc vào thói quen sinh hoạt của bạn.',
    h3Title: 'Cách nhận biết mụn do nội tiết',
    body3:
      'Một số đặc điểm thường lặp lại, dù không phải lúc nào cũng vậy:',
    recognizeSigns: [
      'Phần dưới khuôn mặt: đường viền hàm, cằm',
      'Mụn sâu hơn, đôi khi đau',
      'Thường tái xuất hiện ở cùng những chỗ',
      'Đỏ hoặc vết thâm kéo dài',
    ],
    h4Title: 'Mụn do nội tiết và chu kỳ kinh nguyệt',
    body4:
      'Mụn do nội tiết có thể dao động trong suốt chu kỳ. Nhiều phụ nữ nhận thấy mụn bùng phát trong những ngày trước kỳ kinh, khi progesterone tăng lên rồi giảm mạnh, tạm thời kích thích sản xuất bã nhờn.',
    highlightTitle: 'Theo dõi các đợt bùng phát',
    highlightText:
      'Ghi lại thời điểm mụn xuất hiện so với chu kỳ có thể giúp bạn và bác sĩ da liễu hiểu rõ hơn mối liên hệ nội tiết.',
    h5Title: 'Điều gì có thể giúp ích',
    body5a:
      'Một vài thói quen chăm sóc đơn giản có thể giúp hạn chế các đợt bùng phát, nhưng tự chúng không làm hết hoàn toàn:',
    careHabits: [
      'Làm sạch da nhẹ nhàng sáng và tối',
      'Tránh các sản phẩm mạnh hoặc gây khô da',
      'Bảo vệ da khỏi ánh nắng mỗi ngày',
      'Tránh nặn hoặc cậy mụn',
    ],
    body5b:
      'Tùy tình huống, bác sĩ da liễu hoặc bác sĩ phụ khoa có thể đề xuất các phương pháp điều trị tại chỗ (kem, gel) hoặc, nếu cần, một phương pháp điều trị nội tiết phù hợp.',
    alertTitle: 'Không tự ý dùng thuốc',
    alertText:
      'Các phương pháp điều trị mụn do nội tiết (bôi ngoài da hoặc nội tiết) phải do nhân viên y tế kê đơn và theo dõi, đặc biệt nếu bạn đang mong muốn thụ thai.',
    h6Title: 'Khi nào nên đi khám bác sĩ?',
    body6:
      'Lời khuyên y khoa đặc biệt hữu ích trong một số tình huống:',
    consultReasons: [
      'Mụn kéo dài dù đã chăm sóc phù hợp',
      'Mụn đau hoặc sâu (mụn bọc, mụn nang)',
      'Mụn nặng hoặc xấu đi nhanh chóng',
      'Vết thâm hoặc sẹo đang hình thành',
    ],
    h7Title: 'Những điểm chính cần nhớ',
    summaryTitle: 'Những điểm thiết yếu',
    keyPoints: [
      'Mụn do nội tiết có nguyên nhân có thể xác định, liên quan đến androgen.',
      'Nó thường ảnh hưởng đến phần dưới khuôn mặt và có thể nặng hơn trước kỳ kinh.',
      'Nó không phải do thiếu vệ sinh cũng không phải điều không thể tránh.',
      'Chăm sóc nhẹ nhàng và, nếu cần, một phương pháp điều trị phù hợp có thể cải thiện tình trạng này.',
      'Bác sĩ da liễu hoặc bác sĩ phụ khoa có thể hỗ trợ bạn nếu mụn kéo dài.',
    ],
    finalNoteTitle: 'Một hướng dẫn để hiểu rõ hơn',
    finalNoteText:
      'Bài viết này chỉ nhằm cung cấp thông tin chung và không thay thế buổi khám y tế. Nếu có nghi ngờ hoặc triệu chứng kéo dài, hãy tìm lời khuyên từ nhân viên y tế.',
    shareMessage: 'Hiểu về mụn do nội tiết — AWA',
  },
  uz: {
    badge: 'PCOS • GORMONAL HUSNBUZAR',
    title: 'Gormonal husnbuzarni\ntushunish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Taʼlimiy kontent',
    intro:
      'Nima uchun PCOS bilan gormonal husnbuzar paydo boʻlishi mumkin, uni qanday tanish va qanday yechimlar uni boshqarishga yordam berishi mumkin.',
    introSecondary:
      'U koʻp ayollarga taʼsir qiladi va gigiyena yetishmasligi ham, muqarrarlik ham emas: uning kelib chiqishini tushunish uni yaxshiroq boshqarishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Gormonal husnbuzar nima?',
      'PCOS nima uchun husnbuzarga sabab boʻlishi mumkin?',
      'Gormonal husnbuzarni qanday tanish mumkin',
      'Gormonal husnbuzar va hayz sikli',
      'Nima yordam berishi mumkin',
      'Qachon shifokorga borish kerak?',
      'Asosiy xulosalar',
    ],
    h1: 'Gormonal husnbuzar nima?',
    body1a:
      'Gormonal husnbuzar — gormonal tebranishlar yoki muvozanat buzilishi, ayniqsa androgenlar bilan bevosita bogʻliq husnbuzar shakli. Oʻsmirlikdagi odatiy husnbuzardan farqli ravishda, u koʻpincha kattalar ayollarga taʼsir qiladi va shu davrdan keyin saqlanib qolishi yoki paydo boʻlishi mumkin.',
    body1b:
      'U, shuningdek, joylashuvi, chuqurligi va muntazam teri parvarishiga qaramay bir xil joylarda qayta paydo boʻlish moyilligi bilan ajralib turadi.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Gormonal husnbuzar gigiyena yetishmasligi bilan bogʻliq emas: yuzni tez-tez yuvish uni yoʻqotmaydi va hatto terini tirnashi mumkin.',
    h2Title: 'PCOS nima uchun husnbuzarga sabab boʻlishi mumkin?',
    body2:
      'PCOS da androgenlarning nisbiy ortiqchaligi yogʻ bezlarini ragʻbatlantiradi va ular koʻproq yogʻ ishlab chiqaradi. Baʼzi teri bu gormonlarga sezgirroq boʻladi, bu laboratoriyada oʻlchangan jiddiy muvozanat buzilishisiz ham husnbuzar yaqqol boʻlishi mumkinligini tushuntiradi.',
    neutralText:
      'Bu irodaga bogʻliq emas: bu sezgirlik odamdan odamga farq qiladi va turmush tarzi odatlaringizga bogʻliq emas.',
    h3Title: 'Gormonal husnbuzarni qanday tanish mumkin',
    body3:
      'Baʼzi xususiyatlar koʻpincha, lekin har doim emas, takrorlanadi:',
    recognizeSigns: [
      'Yuzning pastki qismi: jagʻ chizigʻi, iyak',
      'Chuqurroq, baʼzan ogʻriqli toshmalar',
      'Koʻpincha bir xil joylarda qayta paydo boʻladi',
      'Saqlanib qoladigan qizarish yoki dogʻlar',
    ],
    h4Title: 'Gormonal husnbuzar va hayz sikli',
    body4:
      'Gormonal husnbuzar sikl davomida oʻzgarib turishi mumkin. Koʻp ayollar hayzdan oldingi kunlarda, progesteron koʻtarilib, keyin keskin pasayganda, yogʻ ishlab chiqarilishi vaqtincha ragʻbatlantirilganda kuchayishni sezadi.',
    highlightTitle: 'Kuchayishlarni kuzatish',
    highlightText:
      'Toshmalar siklingizga nisbatan qachon paydo boʻlishini yozib borish sizga va dermatologingizga gormonal bogʻliqlikni yaxshiroq tushunishga yordam beradi.',
    h5Title: 'Nima yordam berishi mumkin',
    body5a:
      'Bir nechta oddiy parvarish odatlari kuchayishlarni cheklashga yordam beradi, ammo ularni yakka oʻzi toʻliq yoʻqotmaydi:',
    careHabits: [
      'Terini ertalab va kechqurun muloyim tozalang',
      'Qattiq yoki terini quritadigan vositalardan saqlaning',
      'Terini har kuni quyoshdan himoya qiling',
      'Toshmalarni siqish yoki kovlashdan saqlaning',
    ],
    body5b:
      'Vaziyatga qarab, dermatolog yoki ginekolog mahalliy davolanishlarni (kremlar, gellar) yoki kerak boʻlsa, mos gormonal davolanishni taklif qilishi mumkin.',
    alertTitle: 'Oʻzboshimchalik bilan davolanmang',
    alertText:
      'Gormonal husnbuzar davolanishlari (mahalliy yoki gormonal) sogʻliqni saqlash mutaxassisi tomonidan buyurilishi va nazorat qilinishi kerak, ayniqsa homilador boʻlishni umid qilsangiz.',
    h6Title: 'Qachon shifokorga borish kerak?',
    body6:
      'Tibbiy maslahat baʼzi vaziyatlarda ayniqsa foydali:',
    consultReasons: [
      'Mos parvarishga qaramay saqlanib qolayotgan husnbuzar',
      'Ogʻriqli yoki chuqur toshmalar (tugunlar, kistalar)',
      'Ogʻir yoki tez yomonlashayotgan husnbuzar',
      'Joylashib qolayotgan dogʻlar yoki chandiqlar',
    ],
    h7Title: 'Asosiy xulosalar',
    summaryTitle: 'Muhim nuqtalar',
    keyPoints: [
      'Gormonal husnbuzarning androgenlar bilan bogʻliq aniqlanadigan sababi bor.',
      'U koʻpincha yuzning pastki qismiga taʼsir qiladi va hayzdan oldin kuchayishi mumkin.',
      'U gigiyena yetishmasligi ham, muqarrarlik ham emas.',
      'Muloyim parvarish va kerak boʻlsa, mos davolanish uni yaxshilashi mumkin.',
      'U saqlanib qolsa, dermatolog yoki ginekolog sizni qoʻllab-quvvatlashi mumkin.',
    ],
    finalNoteTitle: 'Yaxshiroq tushunishga yordam beradigan qoʻllanma',
    finalNoteText:
      'Bu maqola faqat umumiy maʼlumot uchun va tibbiy konsultatsiyani almashtirmaydi. Shubha boʻlsa yoki alomatlar saqlanib qolsa, sogʻliqni saqlash mutaxassisidan maslahat oling.',
    shareMessage: 'Gormonal husnbuzarni tushunish — AWA',
  },
  az: {
    badge: 'PKOS • HORMONAL SIZANAQ',
    title: 'Hormonal sızanağı\nanlamaq',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Təhsil məzmunu',
    intro:
      'Hormonal sızanaq PKOS zamanı nə üçün görünə bilər, onu necə tanımaq olar və hansı həllər onu idarə etməyə kömək edə bilər.',
    introSecondary:
      'O, bir çox qadına təsir edir və nə gigiyena çatışmazlığıdır, nə də qaçılmazlıq: onun mənşəyini anlamaq onu daha yaxşı idarə etməyə kömək edir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Hormonal sızanaq nədir?',
      'PKOS nə üçün sızanağa səbəb ola bilər?',
      'Hormonal sızanağı necə tanımaq olar',
      'Hormonal sızanaq və menstrual dövr',
      'Nə kömək edə bilər',
      'Nə vaxt həkimə müraciət etmək lazımdır?',
      'Əsas nəticələr',
    ],
    h1: 'Hormonal sızanaq nədir?',
    body1a:
      'Hormonal sızanaq hormonal dalğalanmalarla və ya xüsusilə androgenlərdəki disbalansla birbaşa bağlı sızanaq formasıdır. Yeniyetməlik dövrünün daha tipik sızanağından fərqli olaraq, o, çox vaxt yetkin qadınlara təsir edir və həmin dövrdən sonra davam edə və ya görünə bilər.',
    body1b:
      'O, həm də yerləşməsi, dərinliyi və yaxşı izlənilən müntəzəm dəri qulluğuna baxmayaraq eyni yerlərdə yenidən görünməyə meyli ilə seçilir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Hormonal sızanaq gigiyena çatışmazlığı ilə bağlı deyil: üzü daha tez-tez yumaq onu aradan qaldırmır və hətta dərini qıcıqlandıra bilər.',
    h2Title: 'PKOS nə üçün sızanağa səbəb ola bilər?',
    body2:
      'PKOS-da androgenlərin nisbi artıqlığı piy vəzilərini stimullaşdırır və onlar daha çox piy istehsal edir. Bəzi dəri bu hormonlara daha həssasdır ki, bu da laboratoriyada ölçülən böyük disbalans olmadan belə sızanağın nə üçün bariz ola biləcəyini izah edir.',
    neutralText:
      'Bu, iradə məsələsi deyil: bu həssaslıq şəxsdən şəxsə dəyişir və həyat tərzi vərdişlərinizdən asılı deyil.',
    h3Title: 'Hormonal sızanağı necə tanımaq olar',
    body3:
      'Bəzi xüsusiyyətlər çox vaxt, lakin sistematik olmayaraq təkrarlanır:',
    recognizeSigns: [
      'Üzün aşağı hissəsi: çənə xətti, çənə',
      'Daha dərin, bəzən ağrılı səpgilər',
      'Çox vaxt eyni yerlərdə yenidən görünür',
      'Davam edən qızartı və ya izlər',
    ],
    h4Title: 'Hormonal sızanaq və menstrual dövr',
    body4:
      'Hormonal sızanaq dövr boyu dəyişə bilər. Bir çox qadın aybaşıdan əvvəlki günlərdə, progesteron yüksəlib sonra kəskin düşəndə, piy istehsalını müvəqqəti stimullaşdıran dövrdə alovlanma hiss edir.',
    highlightTitle: 'Alovlanmalarınızı izləmək',
    highlightText:
      'Səpgilərin dövrünüzə nisbətən nə vaxt göründüyünü qeyd etmək sizə və dermatoloqunuza hormonal əlaqəni daha yaxşı anlamağa kömək edə bilər.',
    h5Title: 'Nə kömək edə bilər',
    body5a:
      'Bir neçə sadə qulluq vərdişi alovlanmaları məhdudlaşdırmağa kömək edə bilər, lakin tək başına onları tam aradan qaldırmır:',
    careHabits: [
      'Dərinizi səhər və axşam mülayim təmizləyin',
      'Sərt və ya qurudan vasitələrdən qaçının',
      'Dərinizi hər gün günəşdən qoruyun',
      'Səpgiləri sıxmaqdan və ya qopartmaqdan çəkinin',
    ],
    body5b:
      'Vəziyyətdən asılı olaraq dermatoloq və ya ginekoloq topikal müalicələr (kremlər, geller) və ya lazım gələrsə, uyğun hormonal müalicə təklif edə bilər.',
    alertTitle: 'Özünüzü müalicə etməyin',
    alertText:
      'Hormonal sızanaq müalicələri (topikal və ya hormonal) tibb işçisi tərəfindən təyin edilməli və izlənməlidir, xüsusilə hamilə qalmaq istəyirsinizsə.',
    h6Title: 'Nə vaxt həkimə müraciət etmək lazımdır?',
    body6:
      'Tibbi məsləhət müəyyən vəziyyətlərdə xüsusilə faydalıdır:',
    consultReasons: [
      'Uyğun qulluğa baxmayaraq davam edən sızanaq',
      'Ağrılı və ya dərin səpgilər (düyünlər, kistalar)',
      'Şiddətli və ya sürətlə pisləşən sızanaq',
      'Qalıcı olan izlər və ya çapıqlar',
    ],
    h7Title: 'Əsas nəticələr',
    summaryTitle: 'Əsas məqamlar',
    keyPoints: [
      'Hormonal sızanağın androgenlərlə bağlı müəyyən edilə bilən səbəbi var.',
      'O, çox vaxt üzün aşağı hissəsinə təsir edir və aybaşıdan əvvəl pisləşə bilər.',
      'O, nə gigiyena çatışmazlığıdır, nə də qaçılmazlıq.',
      'Mülayim qulluq və lazım gələrsə, uyğun müalicə onu yaxşılaşdıra bilər.',
      'Davam edərsə, dermatoloq və ya ginekoloq sizi dəstəkləyə bilər.',
    ],
    finalNoteTitle: 'Daha yaxşı anlamaq üçün bələdçi',
    finalNoteText:
      'Bu məqalə yalnız ümumi məlumat üçündür və tibbi konsultasiyanı əvəz etmir. Şübhə olarsa və ya simptomlar davam edərsə, tibb işçisindən məsləhət alın.',
    shareMessage: 'Hormonal sızanağı anlamaq — AWA',
  },
  ka: {
    badge: 'PCOS • ჰორმონული აკნე',
    title: 'ჰორმონული აკნეს\nგაგება',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'საგანმანათლებლო შინაარსი',
    intro:
      'რატომ შეიძლება ჰორმონული აკნე PCOS-ის დროს გამოჩნდეს, როგორ ამოვიცნოთ იგი და რა გადაწყვეტილებებმა შეიძლება მისი მართვა გაგვიადვილოს.',
    introSecondary:
      'ის ბევრ ქალს ეხება და არც ჰიგიენის ნაკლებობაა და არც გარდაუვალობა: მისი წარმოშობის გაგება მისი უკეთ მართვაში გეხმარებათ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ჰორმონული აკნე?',
      'რატომ შეიძლება PCOS-მა აკნე გამოიწვიოს?',
      'როგორ ამოვიცნოთ ჰორმონული აკნე',
      'ჰორმონული აკნე და მენსტრუაციული ციკლი',
      'რა შეიძლება დაგეხმაროთ',
      'როდის მივმართოთ ექიმს?',
      'მთავარი დასკვნები',
    ],
    h1: 'რა არის ჰორმონული აკნე?',
    body1a:
      'ჰორმონული აკნე აკნეს ფორმაა, რომელიც პირდაპირ ჰორმონულ ცვალებადობას ან დისბალანსს უკავშირდება, განსაკუთრებით ანდროგენების მხრივ. მოზარდობის უფრო ტიპური აკნესგან განსხვავებით, ის ხშირად ზრდასრულ ქალებს ეხება და შეიძლება გაგრძელდეს ან ამ პერიოდის შემდეგ გამოჩნდეს.',
    body1b:
      'ის ასევე გამოირჩევა თავისი მდებარეობით, სიღრმით და იმავე ადგილებზე ხელახლა გაჩენის ტენდენციით, კარგად დაცული რეგულარული კანის მოვლის რუტინის მიუხედავად.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ჰორმონული აკნე ჰიგიენის ნაკლებობას არ უკავშირდება: სახის უფრო ხშირად დაბანა მას არ აქრობს და შეიძლება კანი გააღიზიანოს კიდეც.',
    h2Title: 'რატომ შეიძლება PCOS-მა აკნე გამოიწვიოს?',
    body2:
      'PCOS-ის დროს ანდროგენების შეფარდებითი სიჭარბე ასტიმულირებს ცხიმოვან ჯირკვლებს, რომლებიც შემდეგ მეტ ცხიმს გამოიმუშავებს. ზოგი კანი ასევე უფრო მგრძნობიარეა ამ ჰორმონების მიმართ, რაც ხსნის, რატომ შეიძლება აკნე გამოხატული იყოს ლაბორატორიულად გაზომილი მნიშვნელოვანი დისბალანსის გარეშეც.',
    neutralText:
      'ეს ნებისყოფის საკითხი არ არის: ეს მგრძნობელობა ადამიანიდან ადამიანამდე განსხვავდება და თქვენი ცხოვრების წესის ჩვევებზე არ არის დამოკიდებული.',
    h3Title: 'როგორ ამოვიცნოთ ჰორმონული აკნე',
    body3:
      'გარკვეული თავისებურებები ხშირად მეორდება, თუმცა არა სისტემატურად:',
    recognizeSigns: [
      'სახის ქვედა ნაწილი: ყბის ხაზი, ნიკაპი',
      'უფრო ღრმა, ზოგჯერ მტკივნეული გამონაყარი',
      'ხშირად იმავე ადგილებზე ხელახლა ჩნდება',
      'სიწითლე ან ლაქები, რომლებიც რჩება',
    ],
    h4Title: 'ჰორმონული აკნე და მენსტრუაციული ციკლი',
    body4:
      'ჰორმონული აკნე ციკლის განმავლობაში შეიძლება ცვალებადობდეს. ბევრი ქალი მენსტრუაციის წინა დღეებში გამწვავებას ამჩნევს, როცა პროგესტერონი იზრდება და შემდეგ მკვეთრად ეცემა, რაც დროებით ცხიმის გამომუშავებას ასტიმულირებს.',
    highlightTitle: 'თქვენი გამწვავებების კონტროლი',
    highlightText:
      'იმის აღნიშვნამ, როდის ჩნდება გამონაყარი თქვენს ციკლთან მიმართებით, შეიძლება დაგეხმაროთ თქვენ და თქვენს დერმატოლოგს ჰორმონული კავშირის უკეთ გაგებაში.',
    h5Title: 'რა შეიძლება დაგეხმაროთ',
    body5a:
      'რამდენიმე მარტივ ჩვევას შეუძლია გამწვავებების შეზღუდვა, თავისთავად მათი სრული გაქრობის გარეშე:',
    careHabits: [
      'ნაზად გაწმინდეთ კანი დილით და საღამოს',
      'აარიდეთ თავი მკაცრ ან გამომშრობ საშუალებებს',
      'ყოველდღე დაიცავით კანი მზისგან',
      'არ გამოწურათ გამონაყარი და არ მოწყვიტოთ',
    ],
    body5b:
      'სიტუაციის მიხედვით, დერმატოლოგმა ან გინეკოლოგმა შეიძლება შემოგთავაზოთ ადგილობრივი მკურნალობა (კრემები, გელები) ან, საჭიროების შემთხვევაში, შესაფერისი ჰორმონული მკურნალობა.',
    alertTitle: 'თვითმკურნალობის გარეშე',
    alertText:
      'ჰორმონული აკნეს მკურნალობა (ადგილობრივი ან ჰორმონული) ჯანდაცვის სპეციალისტმა უნდა დანიშნოს და აკონტროლოს, განსაკუთრებით თუ ჩასახვას გეგმავთ.',
    h6Title: 'როდის მივმართოთ ექიმს?',
    body6:
      'სამედიცინო რჩევა განსაკუთრებით სასარგებლოა გარკვეულ სიტუაციებში:',
    consultReasons: [
      'აკნე, რომელიც შესაფერისი მოვლის მიუხედავად რჩება',
      'მტკივნეული ან ღრმა გამონაყარი (კვანძები, ცისტები)',
      'მძიმე აკნე ან აკნე, რომელიც სწრაფად უარესდება',
      'ლაქები ან ნაიარევები, რომლებიც მკვიდრდება',
    ],
    h7Title: 'მთავარი დასკვნები',
    summaryTitle: 'ძირითადი საკითხები',
    keyPoints: [
      'ჰორმონულ აკნეს აქვს ანდროგენებთან დაკავშირებული, ამოცნობადი მიზეზი.',
      'ის ხშირად სახის ქვედა ნაწილს ეხება და მენსტრუაციამდე შეიძლება გაუარესდეს.',
      'ის არც ჰიგიენის ნაკლებობაა და არც გარდაუვალობა.',
      'რბილ მოვლასა და, საჭიროების შემთხვევაში, შესაფერის მკურნალობას მისი გაუმჯობესება შეუძლია.',
      'დერმატოლოგს ან გინეკოლოგს შეუძლია დაგიჭიროთ მხარი, თუ ის რჩება.',
    ],
    finalNoteTitle: 'გზამკვლევი უკეთ გასაგებად',
    finalNoteText:
      'ეს სტატია მხოლოდ ზოგადი ინფორმაციისთვისაა და სამედიცინო კონსულტაციას არ ანაცვლებს. ეჭვის შემთხვევაში ან თუ სიმპტომები რჩება, მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ჰორმონული აკნეს გაგება — AWA',
  },
  hy: {
    badge: 'PCOS • ՀՈՐՄՈՆԱԼ ԱԿՆԵ',
    title: 'Հասկանալ\nհորմոնալ ակնեն',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Կրթական բովանդակություն',
    intro:
      'Ինչու կարող է հորմոնալ ակնեն առաջանալ PCOS-ի դեպքում, ինչպես այն ճանաչել և ինչ լուծումներ կարող են օգնել այն կառավարելուն:',
    introSecondary:
      'Այն ազդում է շատ կանանց վրա և ոչ հիգիենայի պակաս է, ոչ անխուսափելիություն. դրա ծագումը հասկանալը օգնում է ավելի լավ կառավարել այն:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է հորմոնալ ակնեն',
      'Ինչու կարող է PCOS-ը ակնե առաջացնել',
      'Ինչպես ճանաչել հորմոնալ ակնեն',
      'Հորմոնալ ակնե և դաշտանային ցիկլ',
      'Ինչը կարող է օգնել',
      'Ե՞րբ դիմել բժշկի',
      'Հիմնական եզրակացություններ',
    ],
    h1: 'Ի՞նչ է հորմոնալ ակնեն',
    body1a:
      'Հորմոնալ ակնեն ակնեի ձև է, որն ուղղակիորեն կապված է հորմոնալ տատանումների կամ անհավասարակշռության հետ, մասնավորապես անդրոգենների: Ի տարբերություն դեռահասության ավելի բնորոշ ակնեի՝ այն հաճախ ազդում է չափահաս կանանց վրա և կարող է պահպանվել կամ հայտնվել այդ շրջանից հետո:',
    body1b:
      'Այն նաև առանձնանում է իր տեղակայմամբ, խորությամբ և նույն վայրերում կրկին հայտնվելու հակումով՝ չնայած լավ կատարվող կանոնավոր մաշկի խնամքին:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Հորմոնալ ակնեն կապված չէ հիգիենայի պակասի հետ. դեմքը ավելի հաճախ լվանալը չի վերացնում այն և նույնիսկ կարող է գրգռել մաշկը:',
    h2Title: 'Ինչու կարող է PCOS-ը ակնե առաջացնել',
    body2:
      'PCOS-ի դեպքում անդրոգենների հարաբերական ավելցուկը խթանում է ճարպագեղձերը, որոնք այնուհետև արտադրում են ավելի շատ ճարպ: Որոշ մաշկ նաև ավելի զգայուն է այս հորմոնների նկատմամբ, ինչը բացատրում է, թե ինչու ակնեն կարող է արտահայտված լինել նույնիսկ լաբորատորիայում չափված մեծ անհավասարակշռության բացակայության դեպքում:',
    neutralText:
      'Սա կամքի հարց չէ. այս զգայունությունը տարբերվում է մարդուց մարդ և կախված չէ ձեր ապրելակերպի սովորություններից:',
    h3Title: 'Ինչպես ճանաչել հորմոնալ ակնեն',
    body3:
      'Որոշ առանձնահատկություններ հաճախ կրկնվում են, թեև ոչ համակարգված.',
    recognizeSigns: [
      'Դեմքի ստորին հատված՝ ծնոտի գիծ, կզակ',
      'Ավելի խորը, երբեմն ցավոտ ցանավորումներ',
      'Հաճախ կրկին հայտնվում է նույն վայրերում',
      'Կարմրություն կամ հետքեր, որոնք պահպանվում են',
    ],
    h4Title: 'Հորմոնալ ակնե և դաշտանային ցիկլ',
    body4:
      'Հորմոնալ ակնեն կարող է տատանվել ցիկլի ընթացքում: Շատ կանայք նկատում են սրացում դաշտանից առաջ օրերին, երբ պրոգեստերոնը բարձրանում է, ապա կտրուկ իջնում՝ ժամանակավորապես խթանելով ճարպի արտադրությունը:',
    highlightTitle: 'Հետևել ձեր սրացումներին',
    highlightText:
      'Գրանցել, թե երբ են ցանավորումները հայտնվում ձեր ցիկլի նկատմամբ, կարող է օգնել ձեզ և ձեր մաշկաբանին ավելի լավ հասկանալ հորմոնալ կապը:',
    h5Title: 'Ինչը կարող է օգնել',
    body5a:
      'Մաշկի խնամքի մի քանի պարզ սովորություն կարող է օգնել սահմանափակել սրացումները՝ առանց դրանք ինքնուրույն լիովին վերացնելու.',
    careHabits: [
      'Մեղմ մաքրեք ձեր մաշկը առավոտյան և երեկոյան',
      'Խուսափեք կոշտ կամ չորացնող միջոցներից',
      'Ամեն օր պաշտպանեք ձեր մաշկը արևից',
      'Խուսափեք ցանավորումները սեղմելուց կամ քերելուց',
    ],
    body5b:
      'Կախված իրավիճակից՝ մաշկաբանը կամ գինեկոլոգը կարող է առաջարկել տեղային բուժումներ (քսուքներ, գելեր) կամ, անհրաժեշտության դեպքում, համապատասխան հորմոնալ բուժում:',
    alertTitle: 'Ինքնաբուժում չանել',
    alertText:
      'Հորմոնալ ակնեի բուժումները (տեղային կամ հորմոնալ) պետք է նշանակվեն և վերահսկվեն առողջապահության մասնագետի կողմից, մասնավորապես եթե հույս ունեք հղիանալ:',
    h6Title: 'Ե՞րբ դիմել բժշկի',
    body6:
      'Բժշկական խորհրդատվությունը հատկապես օգտակար է որոշ իրավիճակներում.',
    consultReasons: [
      'Ակնե, որը պահպանվում է՝ չնայած համապատասխան խնամքին',
      'Ցավոտ կամ խորը ցանավորումներ (հանգույցներ, կիստաներ)',
      'Ծանր ակնե կամ ակնե, որն արագ վատանում է',
      'Հետքեր կամ սպիներ, որոնք հաստատվում են',
    ],
    h7Title: 'Հիմնական եզրակացություններ',
    summaryTitle: 'Էական կետերը',
    keyPoints: [
      'Հորմոնալ ակնեն ունի բացահայտելի պատճառ, կապված անդրոգենների հետ:',
      'Այն հաճախ ազդում է դեմքի ստորին հատվածի վրա և կարող է վատանալ դաշտանից առաջ:',
      'Այն ոչ հիգիենայի պակաս է, ոչ անխուսափելիություն:',
      'Մեղմ խնամքը և, անհրաժեշտության դեպքում, համապատասխան բուժումը կարող են բարելավել այն:',
      'Մաշկաբանը կամ գինեկոլոգը կարող է աջակցել ձեզ, եթե այն շարունակվում է:',
    ],
    finalNoteTitle: 'Ուղեցույց՝ ավելի լավ հասկանալու համար',
    finalNoteText:
      'Այս հոդվածը միայն ընդհանուր տեղեկատվության համար է և չի փոխարինում բժշկական խորհրդատվությանը: Կասկածի դեպքում կամ եթե ախտանիշները շարունակվում են, խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Հասկանալ հորմոնալ ակնեն — AWA',
  },
  tg: {
    badge: 'PCOS • ДОНАЧАҲОИ ГОРМОНӢ',
    title: 'Фаҳмидани\nдоначаҳои гормонӣ',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни таълимӣ',
    intro:
      'Чаро доначаҳои гормонӣ метавонанд бо PCOS пайдо шаванд, чӣ тавр онҳоро шинохтан мумкин аст ва кадом роҳҳо метавонанд ба идораи онҳо кумак кунанд.',
    introSecondary:
      'Он бисёр занонро фаро мегирад ва на нокофии гигиена ва на ногузир аст: фаҳмидани манбаи он ба идораи беҳтари он кумак мекунад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Доначаҳои гормонӣ чист?',
      'Чаро PCOS метавонад доначаҳои рӯй ба вуҷуд орад?',
      'Чӣ тавр доначаҳои гормониро шинохтан',
      'Доначаҳои гормонӣ ва давраи ҳайз',
      'Чӣ метавонад кумак кунад',
      'Кай ба табиб муроҷиат кардан лозим аст?',
      'Хулосаҳои асосӣ',
    ],
    h1: 'Доначаҳои гормонӣ чист?',
    body1a:
      'Доначаҳои гормонӣ шакли доначаҳои рӯй аст, ки бевосита бо тағйироти гормонӣ ё номутавозунӣ, хусусан дар андрогенҳо, алоқаманд аст. Бар хилофи доначаҳои маъмулии наврасӣ, он аксар вақт занони калонсолро фаро мегирад ва метавонад пас аз он давра идома ёбад ё пайдо шавад.',
    body1b:
      'Он инчунин бо ҷойгиршавӣ, чуқурӣ ва майли аз нав пайдо шудан дар як ҷойҳо бо вуҷуди тартиби мунтазами хуб пайравишудаи нигоҳубини пӯст фарқ мекунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Доначаҳои гормонӣ ба нокофии гигиена вобаста нестанд: бештар шустани рӯй онро аз байн намебарад ва ҳатто метавонад пӯстро асабонӣ кунад.',
    h2Title: 'Чаро PCOS метавонад доначаҳои рӯй ба вуҷуд орад?',
    body2:
      'Дар PCOS зиёдии нисбии андрогенҳо ғадудҳои чарбро ҳавасманд мекунад, ки он гоҳ чарби бештар тавлид мекунанд. Баъзе пӯстҳо инчунин ба ин гормонҳо ҳассостаранд, ки шарҳ медиҳад, чаро доначаҳои рӯй метавонанд ҳатто бе номутавозунии калони дар озмоишгоҳ андозашуда зоҳир шаванд.',
    neutralText:
      'Ин масъалаи иродае нест: ин ҳассосият аз шахс ба шахс фарқ мекунад ва ба одатҳои тарзи зиндагии шумо вобаста нест.',
    h3Title: 'Чӣ тавр доначаҳои гормониро шинохтан',
    body3:
      'Баъзе хусусиятҳо аксар вақт такрор мешаванд, гарчанде на мунтазам:',
    recognizeSigns: [
      'Қисми поёни рӯй: хат ва манаҳ',
      'Доначаҳои чуқуртар, баъзан дардманд',
      'Аксар вақт дар як ҷойҳо аз нав пайдо мешавад',
      'Сурхшавӣ ё доғҳое, ки идома меёбанд',
    ],
    h4Title: 'Доначаҳои гормонӣ ва давраи ҳайз',
    body4:
      'Доначаҳои гормонӣ дар давоми давра метавонанд тағйир ёбанд. Бисёр занон дар рӯзҳои пеш аз ҳайз, вақте ки прогестерон боло меравад ва сипас якбора паст мешавад, ҳамлаи онро мушоҳида мекунанд, ки муваққатан тавлиди чарбро ҳавасманд мекунад.',
    highlightTitle: 'Пайгирии авҷҳои шумо',
    highlightText:
      'Қайд кардани он ки доначаҳо нисбат ба давраи шумо кай пайдо мешаванд, метавонад ба шумо ва пӯстшиноси шумо кумак кунад пайванди гормониро беҳтар бифаҳмед.',
    h5Title: 'Чӣ метавонад кумак кунад',
    body5a:
      'Чанд одати оддии нигоҳубин метавонад ба маҳдуд кардани авҷҳо кумак кунад, бидуни он ки худ ба худ онҳоро комилан аз байн баранд:',
    careHabits: [
      'Пӯсти худро субҳу шом нарм тоза кунед',
      'Аз маҳсулоти сахт ё хушккунанда худдорӣ кунед',
      'Ҳар рӯз пӯсти худро аз офтоб муҳофизат кунед',
      'Доначаҳоро фишор надиҳед ва нахоред',
    ],
    body5b:
      'Вобаста ба вазъият, пӯстшинос ё занбемор метавонад табобатҳои маҳаллӣ (кремҳо, гелҳо) ё, агар лозим бошад, табобати гормонии мувофиқро пешниҳод кунад.',
    alertTitle: 'Худтабобат накунед',
    alertText:
      'Табобатҳои доначаҳои гормонӣ (маҳаллӣ ё гормонӣ) бояд аз ҷониби мутахассиси соҳаи тиб таъйин ва назорат карда шаванд, хусусан агар ба ҳомиладор шудан умед дошта бошед.',
    h6Title: 'Кай ба табиб муроҷиат кардан лозим аст?',
    body6:
      'Маслиҳати тиббӣ дар баъзе вазъиятҳо махсусан муфид аст:',
    consultReasons: [
      'Доначаҳое, ки бо вуҷуди нигоҳубини мувофиқ идома меёбанд',
      'Доначаҳои дардманд ё чуқур (гиреҳҳо, кистаҳо)',
      'Доначаҳои шадид ё зуд бадтаршаванда',
      'Доғҳо ё доғҳои чандмонде, ки ҷой мегиранд',
    ],
    h7Title: 'Хулосаҳои асосӣ',
    summaryTitle: 'Нуктаҳои асосӣ',
    keyPoints: [
      'Доначаҳои гормонӣ сабаби муайяншаванда доранд, ки бо андрогенҳо алоқаманд аст.',
      'Онҳо аксар вақт қисми поёни рӯйро фаро мегиранд ва метавонанд пеш аз ҳайз бадтар шаванд.',
      'Онҳо на нокофии гигиена ва на ногузиранд.',
      'Нигоҳубини нарм ва, агар лозим бошад, табобати мувофиқ метавонад онҳоро беҳтар кунад.',
      'Пӯстшинос ё занбемор метавонад шуморо дастгирӣ кунад, агар онҳо идома ёбанд.',
    ],
    finalNoteTitle: 'Роҳнамо барои фаҳмиши беҳтар',
    finalNoteText:
      'Ин мақола танҳо барои иттилооти умумӣ аст ва машварати тиббиро иваз намекунад. Дар сурати шубҳа ё идомаи нишонаҳо аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    shareMessage: 'Фаҳмидани доначаҳои гормонӣ — AWA',
  },
  ky: {
    badge: 'PCOS • ГОРМОНДУК БЕЗЕТКИЛЕР',
    title: 'Гормондук безеткилерди\nтүшүнүү',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Билим берүүчү мазмун',
    intro:
      'Гормондук безеткилер PCOS менен эмне үчүн пайда болушу мүмкүн, аларды кантип таануу керек жана кандай чечимдер аларды башкарууга жардам бериши мүмкүн.',
    introSecondary:
      'Ал көптөгөн аялдарга таасир этет жана гигиенанын жетишсиздиги да, сөзсүз болуучу нерсе да эмес: анын келип чыгышын түшүнүү аны жакшыраак башкарууга жардам берет.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Гормондук безеткилер деген эмне?',
      'PCOS эмне үчүн безеткилерди жаратышы мүмкүн?',
      'Гормондук безеткилерди кантип таануу керек',
      'Гормондук безеткилер жана етек кирим цикли',
      'Эмне жардам бериши мүмкүн',
      'Дарыгерге качан барыш керек?',
      'Негизги жыйынтыктар',
    ],
    h1: 'Гормондук безеткилер деген эмне?',
    body1a:
      'Гормондук безеткилер — гормондук термелүүлөр же тең салмактуулуктун бузулушу, айрыкча андрогендер менен түздөн-түз байланышкан безеткилердин бир түрү. Өспүрүмдүк мезгилдин типтүү безеткилеринен айырмаланып, ал көбүнчө бойго жеткен аялдарга таасир этет жана ал мезгилден кийин сакталышы же пайда болушу мүмкүн.',
    body1b:
      'Ал ошондой эле жайгашкан жери, тереңдиги жана үзгүлтүксүз тери кам көрүүсүн туура аткарганына карабастан бир эле жерлерде кайра пайда болуу тенденциясы менен айырмаланат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Гормондук безеткилер гигиенанын жетишсиздиги менен байланышкан эмес: бетти жыш жуу аны кетирбейт, ал тургай терини дүүлүктүрүшү мүмкүн.',
    h2Title: 'PCOS эмне үчүн безеткилерди жаратышы мүмкүн?',
    body2:
      'PCOSто андрогендердин салыштырмалуу ашыкчасы май бездерин стимулдайт, алар андан кийин көбүрөөк май өндүрөт. Айрым тери бул гормондорго сезгичирээк, бул лабораторияда өлчөнгөн олуттуу тең салмактуулуктун бузулушусуз да безеткилердин айкын болушу мүмкүн экенин түшүндүрөт.',
    neutralText:
      'Бул эрк күчүнүн маселеси эмес: бул сезгичтик адамдан адамга айырмаланат жана жашоо образыңыздын адаттарына көз каранды эмес.',
    h3Title: 'Гормондук безеткилерди кантип таануу керек',
    body3:
      'Айрым белгилер көбүнчө кайталанат, бирок системалуу эмес:',
    recognizeSigns: [
      'Беттин ылдый жагы: жаак, ээк',
      'Тереңирээк, кээде оорутуучу безеткилер',
      'Көбүнчө бир эле жерлерде кайра пайда болот',
      'Кызаруу же сакталган таптар',
    ],
    h4Title: 'Гормондук безеткилер жана етек кирим цикли',
    body4:
      'Гормондук безеткилер цикл бою термелиши мүмкүн. Көптөгөн аялдар етек киримден мурунку күндөрдө, прогестерон көтөрүлүп, андан кийин кескин түшкөндө, убактылуу май өндүрүүнү стимулдаганда, күчөөнү байкайт.',
    highlightTitle: 'Күчөөлөрүңүздү көзөмөлдөө',
    highlightText:
      'Безеткилер циклге карата качан пайда болорун жазып туруу сизге жана дерматологуңузга гормондук байланышты жакшыраак түшүнүүгө жардам бериши мүмкүн.',
    h5Title: 'Эмне жардам бериши мүмкүн',
    body5a:
      'Бир нече жөнөкөй кам көрүү адаты күчөөлөрдү чектөөгө жардам бериши мүмкүн, бирок алар өзү толугу менен тазалабайт:',
    careHabits: [
      'Терини эртең менен жана кечинде жумшак тазалаңыз',
      'Катуу же кургаткан каражаттардан сактаныңыз',
      'Терини күн сайын күндөн коргоңуз',
      'Безеткилерди кысуудан же тытуудан сактаныңыз',
    ],
    body5b:
      'Абалга жараша дерматолог же гинеколог жергиликтүү дарылоолорду (кремдер, гелдер) же керек болсо ылайыктуу гормондук дарылоону сунуштай алат.',
    alertTitle: 'Өз алдынча дарылоого болбойт',
    alertText:
      'Гормондук безеткилерди дарылоо (жергиликтүү же гормондук) ден соолук сактоо адиси тарабынан дайындалып, көзөмөлдөнүшү керек, айрыкча боюна бүтүүнү үмүттөнүп жатсаңыз.',
    h6Title: 'Дарыгерге качан барыш керек?',
    body6:
      'Медициналык кеңеш айрым абалдарда өзгөчө пайдалуу:',
    consultReasons: [
      'Ылайыктуу кам көрүүгө карабастан улана берген безеткилер',
      'Оорутуучу же терең безеткилер (түйүндөр, кисталар)',
      'Катуу безеткилер же тез начарлаган безеткилер',
      'Орнотулуп жаткан таптар же тырыктар',
    ],
    h7Title: 'Негизги жыйынтыктар',
    summaryTitle: 'Негизги учурлар',
    keyPoints: [
      'Гормондук безеткилердин андрогендер менен байланышкан аныкталуучу себеби бар.',
      'Алар көбүнчө беттин ылдый жагына таасир этет жана етек киримден мурун күчөшү мүмкүн.',
      'Ал гигиенанын жетишсиздиги да, сөзсүз болуучу нерсе да эмес.',
      'Жумшак кам көрүү жана керек болсо ылайыктуу дарылоо аны жакшырта алат.',
      'Улана берсе, дерматолог же гинеколог сизди колдой алат.',
    ],
    finalNoteTitle: 'Жакшыраак түшүнүүгө колдонмо',
    finalNoteText:
      'Бул макала жалпы маалымат үчүн гана жазылган жана медициналык консультацияны алмаштырбайт. Күмөн болсо же белгилер улана берсе, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Гормондук безеткилерди түшүнүү — AWA',
  },
  tk: {
    badge: 'PCOS • GORMONAL AKNE',
    title: 'Gormonal akneni\ndüşünmek',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Bilim beriji mazmun',
    intro:
      'Gormonal akne PCOS bilen näme üçin peýda bolup biler, ony nähili tanamaly we ony dolandyrmaga haýsy çözgütler kömek edip biler.',
    introSecondary:
      'Ol köp aýala täsir edýär we ne arassaçylyk ýetmezçiligi, ne-de gaçyp bolmajak zat: onuň gelip çykyşyny düşünmek ony has gowy dolandyrmaga kömek edýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Gormonal akne näme?',
      'PCOS näme üçin akne döredip biler?',
      'Gormonal akneni nähili tanamaly',
      'Gormonal akne we aýbaşy sikli',
      'Näme kömek edip biler',
      'Lukmana haçan ýüz tutmaly?',
      'Esasy netijeler',
    ],
    h1: 'Gormonal akne näme?',
    body1a:
      'Gormonal akne gormonal yrgyldylar ýa-da deňagramsyzlyk, aýratyn-da androgenlerde, bilen göni baglanyşykly akneniň bir görnüşi. Ýetginjeklik döwrüniň has adaty akneinden tapawutlylykda, ol köplenç uly aýallara täsir edýär we şondan soň dowam edip ýa-da peýda bolup biler.',
    body1b:
      'Ol şeýle hem ýerleşişi, çuňlugy we gowy ýerine ýetirilýän yzygiderli deri idegine garamazdan şol bir ýerlerde gaýdyp peýda bolmaga ýykgyn edýändigi bilen tapawutlanýar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Gormonal akne arassaçylyk ýetmezçiligi bilen baglanyşykly däl: ýüzüňizi has ýygy ýuwmak ony ýok etmeýär we hatda derini gyjyndyryp biler.',
    h2Title: 'PCOS näme üçin akne döredip biler?',
    body2:
      'PCOS-da androgenleriň otnositel artykmaçlygy ýag mäzlerini höweslendirýär, olar soňra has köp sebum öndürýär. Käbir deri hem bu gormonlara has duýgur, bu laboratoriýada ölçelen uly deňagramsyzlyk bolmazdan hem akneniň aýdyň bolup biljekdigini düşündirýär.',
    neutralText:
      'Bu erk güýjüniň meselesi däl: bu duýgurlyk adamdan adama tapawutlanýar we durmuş ýörelgesi endiklerigize bagly däl.',
    h3Title: 'Gormonal akneni nähili tanamaly',
    body3:
      'Käbir aýratynlyklar köplenç gaýtalanýar, ýöne yzygiderli däl:',
    recognizeSigns: [
      'Ýüzüň aşaky bölegi: eňek, gabak',
      'Has çuň, käwagt agyryly döremeler',
      'Köplenç şol bir ýerlerde gaýdyp peýda bolýar',
      'Dowam edýän gyzarma ýa-da yzlar',
    ],
    h4Title: 'Gormonal akne we aýbaşy sikli',
    body4:
      'Gormonal akne sikl dowamynda üýtgäp biler. Köp aýal aýbaşydan öňki günlerde, progesteron ýokarlanyp soňra ýiti peselende, wagtlaýyn sebum öndürilişini höweslendirýän ýagdaýda, ýaramazlaşmany görýär.',
    highlightTitle: 'Ýaramazlaşmalaryňyzy yzarlamak',
    highlightText:
      'Döremeleriň sikliňize görä haçan peýda bolýandygyny bellemek sizi we dermatologyňyzy gormonal baglanyşygy has gowy düşünmäge kömek edip biler.',
    h5Title: 'Näme kömek edip biler',
    body5a:
      'Birnäçe ýönekeý ideg endigi ýaramazlaşmalary çäklemäge kömek edip biler, ýöne ýeke özi olary doly arassalamaýar:',
    careHabits: [
      'Derini irden we agşam ýumşak arassalaň',
      'Gaty ýa-da derini gurak edýän önümlerden gaça duruň',
      'Derini her gün günden goraň',
      'Döremeleri gysmakdan ýa-da çokmakdan gaça duruň',
    ],
    body5b:
      'Ýagdaýa görä, dermatolog ýa-da ginekolog ýerli bejergileri (kremler, gelleri) ýa-da zerur bolsa laýyk gormonal bejergini teklip edip biler.',
    alertTitle: 'Özbaşdak bejergi etmäň',
    alertText:
      'Gormonal akne bejergileri (ýerli ýa-da gormonal) saglyk hünärmeni tarapyndan bellenilmeli we gözegçilik edilmeli, aýratyn-da göwreli bolmagy umyt edýän bolsaňyz.',
    h6Title: 'Lukmana haçan ýüz tutmaly?',
    body6:
      'Lukmançylyk maslahaty käbir ýagdaýlarda aýratyn peýdaly:',
    consultReasons: [
      'Laýyk ideg bilen hem dowam edýän akne',
      'Agyryly ýa-da çuň döremeler (düwünler, kistalar)',
      'Agyr akne ýa-da çalt erbetleşýän akne',
      'Ornaşýan yzlar ýa-da çyzlar',
    ],
    h7Title: 'Esasy netijeler',
    summaryTitle: 'Esasy nokatlar',
    keyPoints: [
      'Gormonal akneniň androgenler bilen baglanyşykly kesgitlenip bolýan sebäbi bar.',
      'Ol köplenç ýüzüň aşaky böleginde bolýar we aýbaşydan öň erbetleşip biler.',
      'Ol ne arassaçylyk ýetmezçiligi, ne-de gaçyp bolmajak zat.',
      'Ýumşak ideg we zerur bolsa laýyk bejergi ony gowulandyryp biler.',
      'Dowam etse, dermatolog ýa-da ginekolog size goldaw berip biler.',
    ],
    finalNoteTitle: 'Has gowy düşünmek üçin gollanma',
    finalNoteText:
      'Bu makala diňe umumy maglumat üçin we lukmançylyk maslahatlaşmagyny çalyşmaýar. Şübhe bolsa ýa-da alamatlar dowam etse, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'Gormonal akneni düşünmek — AWA',
  },
} as const);

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
