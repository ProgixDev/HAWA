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
  ms: {
    badge: 'PCOS • JERAWAT HORMON',
    title: 'Memahami\njerawat hormon',
    metaDuration: '7 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan pendidikan',
    intro:
      'Mengapa jerawat hormon boleh muncul dengan PCOS, bagaimana mengenalinya, dan penyelesaian yang mungkin membantu menguruskannya.',
    introSecondary:
      'Ia menjejaskan ramai wanita dan bukan kekurangan kebersihan mahupun sesuatu yang tidak dapat dielakkan: memahami puncanya membantu menguruskannya dengan lebih baik.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apakah jerawat hormon?',
      'Mengapa PCOS boleh menyebabkan jerawat?',
      'Bagaimana mengenali jerawat hormon',
      'Jerawat hormon dan kitaran haid',
      'Apa yang boleh membantu',
      'Bila untuk berjumpa doktor?',
      'Perkara penting untuk diingat',
    ],
    h1: 'Apakah jerawat hormon?',
    body1a:
      'Jerawat hormon ialah satu bentuk jerawat yang berkaitan secara langsung dengan perubahan atau ketidakseimbangan hormon, terutamanya androgen. Berbeza dengan jerawat yang lebih tipikal semasa remaja, ia selalunya menjejaskan wanita dewasa dan boleh berterusan atau muncul selepas tempoh itu.',
    body1b:
      'Ia juga dibezakan oleh lokasinya, kedalamannya dan kecenderungannya untuk muncul semula di tempat yang sama walaupun rutin penjagaan kulit yang tetap diikuti dengan baik.',
    tip1Title: 'Elok diketahui',
    tip1Text:
      'Jerawat hormon tidak berkaitan dengan kekurangan kebersihan: membasuh muka lebih kerap tidak menghilangkannya, malah mungkin merengsakan kulit.',
    h2Title: 'Mengapa PCOS boleh menyebabkan jerawat?',
    body2:
      'Dalam PCOS, kelebihan androgen yang relatif merangsang kelenjar sebum, yang kemudiannya menghasilkan lebih banyak sebum. Sesetengah kulit juga lebih sensitif terhadap hormon ini, yang menjelaskan mengapa jerawat boleh ketara walaupun tanpa ketidakseimbangan besar yang diukur di makmal.',
    neutralText:
      'Ini bukan soal kekuatan semangat: kepekaan ini berbeza dari seorang ke seorang dan tidak bergantung pada tabiat gaya hidup anda.',
    h3Title: 'Bagaimana mengenali jerawat hormon',
    body3:
      'Ciri tertentu sering berulang, walaupun tidak secara sistematik:',
    recognizeSigns: [
      'Bahagian bawah muka: garis rahang, dagu',
      'Jerawat yang lebih dalam, kadangkala menyakitkan',
      'Selalunya muncul semula di tempat yang sama',
      'Kemerahan atau parut yang berterusan',
    ],
    h4Title: 'Jerawat hormon dan kitaran haid',
    body4:
      'Jerawat hormon boleh berubah-ubah sepanjang kitaran. Ramai wanita perasan ia merebak pada hari-hari sebelum haid, apabila progesteron meningkat dan kemudian menurun dengan mendadak, merangsang penghasilan sebum buat sementara waktu.',
    highlightTitle: 'Menjejaki kemunculan jerawat anda',
    highlightText:
      'Mencatat bila jerawat muncul berbanding kitaran anda boleh membantu anda dan pakar dermatologi anda memahami kaitan hormon dengan lebih baik.',
    h5Title: 'Apa yang boleh membantu',
    body5a:
      'Beberapa tabiat penjagaan yang mudah boleh membantu mengehadkan kemunculan jerawat, tanpa menghilangkannya sepenuhnya dengan sendirinya:',
    careHabits: [
      'Bersihkan kulit anda dengan lembut pada waktu pagi dan petang',
      'Elakkan produk yang keras atau yang menanggalkan minyak',
      'Lindungi kulit anda daripada matahari setiap hari',
      'Elakkan memicit atau mengorek jerawat',
    ],
    body5b:
      'Bergantung pada keadaan, pakar dermatologi atau pakar sakit puan boleh mencadangkan rawatan topikal (krim, gel) atau, jika perlu, rawatan hormon yang sesuai.',
    alertTitle: 'Jangan berubat sendiri',
    alertText:
      'Rawatan untuk jerawat hormon (topikal atau hormon) mesti diberikan dan dipantau oleh pengamal penjagaan kesihatan, terutamanya jika anda berharap untuk hamil.',
    h6Title: 'Bila untuk berjumpa doktor?',
    body6:
      'Nasihat perubatan amat membantu dalam keadaan tertentu:',
    consultReasons: [
      'Jerawat yang berterusan walaupun dengan penjagaan yang sesuai',
      'Jerawat yang menyakitkan atau dalam (nodul, sista)',
      'Jerawat yang teruk atau yang bertambah teruk dengan pantas',
      'Tanda atau parut yang mula menetap',
    ],
    h7Title: 'Perkara penting untuk diingat',
    summaryTitle: 'Perkara utama',
    keyPoints: [
      'Jerawat hormon mempunyai punca yang boleh dikenal pasti, berkaitan dengan androgen.',
      'Ia selalunya menjejaskan bahagian bawah muka dan boleh bertambah teruk sebelum haid.',
      'Ia bukan kekurangan kebersihan mahupun sesuatu yang tidak dapat dielakkan.',
      'Penjagaan yang lembut dan, jika perlu, rawatan yang sesuai boleh memperbaikinya.',
      'Pakar dermatologi atau pakar sakit puan boleh menyokong anda jika ia berterusan.',
    ],
    finalNoteTitle: 'Panduan untuk memahami dengan lebih baik',
    finalNoteText:
      'Artikel ini hanya untuk maklumat am dan tidak menggantikan konsultasi perubatan. Jika ragu-ragu atau jika simptom berterusan, dapatkan nasihat daripada pengamal penjagaan kesihatan.',
    shareMessage: 'Memahami jerawat hormon — AWA',
  },
  so: {
    badge: 'PCOS • FINAN HORMOON',
    title: 'Fahamka\nfinanka hormoonka',
    metaDuration: '7 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad waxbarasho',
    intro:
      'Sababta finanka hormoonku u soo muuqan karo PCOS, sida loo aqoonsado, iyo xalalka caawin kara maamulkiisa.',
    introSecondary:
      'Wuxuu saameeyaa dumar badan mana aha nadaafad la’aan ama wax aan laga baxsan karin: fahamka asalkiisu wuxuu caawiyaa maamul ka wanaagsan.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Waa maxay finanka hormoonka?',
      'Maxay PCOS u keeni karaa finan?',
      'Sida loo aqoonsado finanka hormoonka',
      'Finanka hormoonka iyo wareegga caadada',
      'Waxa caawin kara',
      'Goorta dhakhtar la arko?',
      'Qodobbada muhiimka ah',
    ],
    h1: 'Waa maxay finanka hormoonka?',
    body1a:
      'Finanka hormoonku waa nooc finan ah oo si toos ah ula xiriira kala duwanaanshaha ama dheelitir la’aanta hormoonka, gaar ahaan androgens. Si ka duwan finanka caadiga ah ee qaangaarka, inta badan wuxuu saameeyaa dumarka weyn wuxuuna sii socon karaa ama soo muuqan karaa muddadaas ka dib.',
    body1b:
      'Waxaa sidoo kale lagu kala saaraa meesha uu ku yaal, qoto dheerkiisa, iyo u janjeerkiisa inuu mar kale ka soo muuqdo isla meelaha iyadoo la raacay nidaam daryeel maqaar oo joogto ah oo si fiican loo raaco.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text:
      'Finanka hormoonku lama xiriiro nadaafad la’aan: dhaqidda wajigaaga inta badan ma ka dhigto inuu libdho, wuxuuna xataa kicin karaa maqaarka.',
    h2Title: 'Maxay PCOS u keeni karaa finan?',
    body2:
      'PCOS dhexdiisa, androgen xad dhaaf ah oo qaraabo ah ayaa kiciya qanjidhada saliidda, kuwaas oo markaas soo saara sebum badan. Maqaarka qaarkood sidoo kale wuu dareen badan yahay hormoonnadan, taasoo sharxaysa sababta finanku u noqon karo mid muuqda xataa dheelitir la’aan weyn oo shaybaarka lagu cabbiray la’aanteed.',
    neutralText:
      'Tani maaha arrin awood xoog: dareen-badnaantani waxay ku kala duwan tahay qof ilaa qof mana ku xirna caadooyinkaaga hab-nololeed.',
    h3Title: 'Sida loo aqoonsado finanka hormoonka',
    body3:
      'Sifooyin qaar ayaa inta badan soo noqnoqda, in kasta oo aan nidaamsan ahayn:',
    recognizeSigns: [
      'Wajiga hoose: garka, garbiisa',
      'Burooyin ka qotodheer, mararka qaarkood xanuun leh',
      'Inta badan mar kale ka soo muuqda isla meelaha',
      'Casaan ama calaamado sii jira',
    ],
    h4Title: 'Finanka hormoonka iyo wareegga caadada',
    body4:
      'Finanka hormoonku wuxuu kala duwanaan karaa wareegga oo dhan. Dumar badan ayaa ogaada kicin maalmaha ka horreeya caadadooda, marka progesterone kor u kaco ka dibna si degdeg ah hoos u dhaco, taasoo ku meel gaar kicinaysa soo saarista sebum.',
    highlightTitle: 'La socodka kicinahaaga',
    highlightText:
      'Xusidda goorta burooyinku soo muuqdaan marka loo eego wareeggaaga ayaa kaa caawin kara adiga iyo dhakhtarka maqaarka inaad si wanaagsan u fahamtaan xiriirka hormoonka.',
    h5Title: 'Waxa caawin kara',
    body5a:
      'Dhowr caado daryeel oo fudud ayaa caawin kara xakamaynta kicinta, iyadoo aysan keligood si buuxda u nadiifin:',
    careHabits: [
      'Si jilicsan u nadiifi maqaarkaaga subax iyo habeen',
      'Ka fogow alaabta adag ama maqaarka qalajisa',
      'Maalin kasta ka ilaali maqaarkaaga qorraxda',
      'Ha riixin ama ha qaadin burooyinka',
    ],
    body5b:
      'Iyadoo ku xiran xaaladda, dhakhtarka maqaarka ama dumarka ayaa soo jeedin kara daaweynno maxalli ah (kareemo, jel) ama, haddii loo baahdo, daaweyn hormoon oo ku habboon.',
    alertTitle: 'Is-daaweyn ha samaynin',
    alertText:
      'Daaweynta finanka hormoonka (maxalli ama hormoon) waa in qoraa oo la kormeero xirfadle caafimaad, gaar ahaan haddii aad rajaynayso inaad uur yeelato.',
    h6Title: 'Goorta dhakhtar la arko?',
    body6:
      'Talo caafimaad ayaa si gaar ah faa’iido u leh xaalado qaar:',
    consultReasons: [
      'Finan sii socda inkasta oo daryeel ku habboon la sameeyo',
      'Burooyin xanuun leh ama qoto dheer (nodules, cysts)',
      'Finan daran ama si degdeg ah u xumaanaya',
      'Calaamado ama nabaro degaya',
    ],
    h7Title: 'Qodobbada muhiimka ah',
    summaryTitle: 'Qodobbada ugu muhiimsan',
    keyPoints: [
      'Finanka hormoonku wuxuu leeyahay sabab la aqoonsan karo, oo la xiriirta androgens.',
      'Inta badan wuxuu saameeyaa wajiga hoose wuxuuna xumaan karaa ka hor caadadaada.',
      'Ma aha nadaafad la’aan ama wax aan laga baxsan karin.',
      'Daryeel jilicsan iyo, haddii loo baahdo, daaweyn ku habboon ayaa hagaajin kara.',
      'Dhakhtar maqaar ama dumarka ayaa kuu taageeri kara haddii uu sii socdo.',
    ],
    finalNoteTitle: 'Hage lagu fahmo',
    finalNoteText:
      'Maqaalkan waa macluumaad guud oo keliya mana bedelo la-talin caafimaad. Haddii aad shaki qabto ama astaamuhu sii socdaan, talo ka raadso xirfadle caafimaad.',
    shareMessage: 'Fahamka finanka hormoonka — AWA',
  },
  sw: {
    badge: 'PCOS • CHUNUSI ZA HOMONI',
    title: 'Kuelewa\nchunusi za homoni',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui ya kielimu',
    intro:
      'Kwa nini chunusi za homoni zinaweza kuonekana ukiwa na PCOS, jinsi ya kuzitambua, na ni suluhisho gani zinaweza kusaidia kuzidhibiti.',
    introSecondary:
      'Zinaathiri wanawake wengi na si ukosefu wa usafi wala jambo lisiloepukika: kuelewa asili yake kunasaidia kuzidhibiti vizuri zaidi.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Chunusi za homoni ni nini?',
      'Kwa nini PCOS inaweza kusababisha chunusi?',
      'Jinsi ya kutambua chunusi za homoni',
      'Chunusi za homoni na mzunguko wa hedhi',
      'Kinachoweza kusaidia',
      'Wakati wa kumwona daktari?',
      'Mambo muhimu ya kukumbuka',
    ],
    h1: 'Chunusi za homoni ni nini?',
    body1a:
      'Chunusi za homoni ni aina ya chunusi inayohusiana moja kwa moja na mabadiliko ya homoni au kutokuwa na usawa, hasa wa androjeni. Tofauti na chunusi za kawaida zaidi za ujana, mara nyingi huathiri wanawake watu wazima na zinaweza kudumu au kuonekana baada ya kipindi hicho.',
    body1b:
      'Pia hutofautishwa na mahali zilipo, kina chake, na tabia yake ya kujitokeza tena mahali pale pale licha ya utaratibu wa kawaida wa utunzaji wa ngozi unaofuatwa vizuri.',
    tip1Title: 'Vyema kujua',
    tip1Text:
      'Chunusi za homoni hazihusiani na ukosefu wa usafi: kuosha uso mara nyingi zaidi hakuzifanyi ziondoke, na kunaweza hata kuwasha ngozi.',
    h2Title: 'Kwa nini PCOS inaweza kusababisha chunusi?',
    body2:
      'Katika PCOS, ziada ya kiasi ya androjeni huchochea tezi za mafuta, ambazo kisha hutengeneza mafuta mengi zaidi ya ngozi. Ngozi nyingine pia ni nyeti zaidi kwa homoni hizi, jambo linaloeleza kwa nini chunusi zinaweza kuwa kali hata bila kutokuwa na usawa mkubwa kunakopimwa maabara.',
    neutralText:
      'Hili si suala la nguvu ya utashi: unyeti huu hutofautiana kati ya mtu na mtu na hautegemei tabia za mtindo wako wa maisha.',
    h3Title: 'Jinsi ya kutambua chunusi za homoni',
    body3:
      'Sifa fulani mara nyingi hujirudia, ingawa si kila wakati:',
    recognizeSigns: [
      'Sehemu ya chini ya uso: taya, kidevu',
      'Vipele vya kina zaidi, wakati mwingine vyenye maumivu',
      'Mara nyingi hujitokeza tena mahali pale pale',
      'Wekundu au alama zinazodumu',
    ],
    h4Title: 'Chunusi za homoni na mzunguko wa hedhi',
    body4:
      'Chunusi za homoni zinaweza kubadilikabadilika katika mzunguko. Wanawake wengi huona kuongezeka katika siku kabla ya hedhi yao, projesteroni inapopanda kisha kushuka kwa kasi, ikichochea kwa muda utengenezaji wa mafuta ya ngozi.',
    highlightTitle: 'Kufuatilia kuongezeka kwa chunusi',
    highlightText:
      'Kuandika wakati vipele vinapoonekana kuhusiana na mzunguko wako kunaweza kukusaidia wewe na daktari wako wa ngozi kuelewa vizuri uhusiano wa homoni.',
    h5Title: 'Kinachoweza kusaidia',
    body5a:
      'Tabia chache rahisi za utunzaji zinaweza kusaidia kupunguza kuongezeka kwa chunusi, bila kuziondoa kabisa zenyewe:',
    careHabits: [
      'Safisha ngozi yako kwa upole asubuhi na jioni',
      'Epuka bidhaa kali au zinazoondoa mafuta yote',
      'Linda ngozi yako dhidi ya jua kila siku',
      'Epuka kuminya au kuchokora vipele',
    ],
    body5b:
      'Kulingana na hali, daktari wa ngozi au daktari wa magonjwa ya wanawake anaweza kupendekeza matibabu ya kupaka (krimu, jeli) au, ikihitajika, matibabu ya homoni yanayofaa.',
    alertTitle: 'Usijitibu mwenyewe',
    alertText:
      'Matibabu ya chunusi za homoni (ya kupaka au ya homoni) lazima yaagizwe na kufuatiliwa na mtaalamu wa afya, hasa ikiwa unatumaini kupata ujauzito.',
    h6Title: 'Wakati wa kumwona daktari?',
    body6:
      'Ushauri wa kitabibu ni wa manufaa hasa katika hali fulani:',
    consultReasons: [
      'Chunusi zinazodumu licha ya utunzaji unaofaa',
      'Vipele vyenye maumivu au vya kina (vinundu, vivimbe)',
      'Chunusi kali au zinazozidi kuwa mbaya haraka',
      'Alama au makovu yanayojitokeza',
    ],
    h7Title: 'Mambo muhimu ya kukumbuka',
    summaryTitle: 'Mambo ya msingi',
    keyPoints: [
      'Chunusi za homoni zina sababu inayotambulika, inayohusiana na androjeni.',
      'Mara nyingi huathiri sehemu ya chini ya uso na zinaweza kuongezeka kabla ya hedhi yako.',
      'Si ukosefu wa usafi wala jambo lisiloepukika.',
      'Utunzaji wa upole na, ikihitajika, matibabu yanayofaa yanaweza kuziboresha.',
      'Daktari wa ngozi au daktari wa magonjwa ya wanawake anaweza kukusaidia ikiwa zitaendelea.',
    ],
    finalNoteTitle: 'Mwongozo wa kuelewa vizuri zaidi',
    finalNoteText:
      'Makala hii ni kwa taarifa za jumla tu na haichukui nafasi ya mashauriano ya kitabibu. Ukiwa na shaka au dalili zikiendelea, tafuta ushauri wa mtaalamu wa afya.',
    shareMessage: 'Kuelewa chunusi za homoni — AWA',
  },
  kk: {
    badge: 'ПКЯС • ГОРМОНДЫҚ БЕЗЕУ',
    title: 'Гормондық безеуді\nтүсіну',
    metaDuration: '7 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Білім беру мазмұны',
    intro:
      'Гормондық безеу ПКЯС кезінде неге пайда болуы мүмкін, оны қалай тануға болады және оны басқаруға қандай шешімдер көмектесе алады.',
    introSecondary:
      'Ол көптеген әйелдерге әсер етеді және гигиенаның жетіспеуі де, сөзсіз тағдыр да емес: оның шығу тегін түсіну оны жақсырақ басқаруға көмектеседі.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Гормондық безеу дегеніміз не?',
      'ПКЯС безеуді неге тудыруы мүмкін?',
      'Гормондық безеуді қалай тануға болады',
      'Гормондық безеу және етеккір циклі',
      'Не көмектесе алады',
      'Дәрігерге қашан бару керек?',
      'Негізгі қорытындылар',
    ],
    h1: 'Гормондық безеу дегеніміз не?',
    body1a:
      'Гормондық безеу — гормондық ауытқуларға немесе тепе-теңсіздікке, әсіресе андрогендерде, тікелей байланысты безеу түрі. Жасөспірім кезеңіндегі әдеттегі безеуден айырмашылығы, ол көбіне ересек әйелдерге әсер етеді және сол кезеңнен кейін сақталуы немесе пайда болуы мүмкін.',
    body1b:
      'Ол сондай-ақ орналасуымен, тереңдігімен және жақсы орындалған тұрақты тері күтімі тәртібіне қарамастан бір жерлерде қайта пайда болу бейімділігімен ерекшеленеді.',
    tip1Title: 'Білуге тиісті',
    tip1Text:
      'Гормондық безеу гигиенаның жетіспеуімен байланысты емес: жүзді жиірек жуу оны жоймайды, тіпті теріні тітіркендіруі мүмкін.',
    h2Title: 'ПКЯС безеуді неге тудыруы мүмкін?',
    body2:
      'ПКЯС кезінде андрогендердің салыстырмалы артықтығы май бездерін ынталандырады, олар содан кейін көбірек май түзеді. Кейбір тері бұл гормондарға да сезімталырақ, бұл зертханада өлшенетін үлкен тепе-теңсіздік болмаса да, безеудің неге айқын болуы мүмкін екенін түсіндіреді.',
    neutralText:
      'Бұл ерік күшіне байланысты емес: бұл сезімталдық әр адамда әртүрлі және өмір салты әдеттеріңізге байланысты емес.',
    h3Title: 'Гормондық безеуді қалай тануға болады',
    body3:
      'Кейбір белгілер жиі қайталанады, дегенмен жүйелі түрде емес:',
    recognizeSigns: [
      'Беттің төменгі бөлігі: жақ сызығы, иек',
      'Тереңірек, кейде ауыратын бөртпелер',
      'Көбіне бір жерлерде қайта пайда болады',
      'Сақталатын қызару немесе іздер',
    ],
    h4Title: 'Гормондық безеу және етеккір циклі',
    body4:
      'Гормондық безеу цикл бойы ауытқуы мүмкін. Көптеген әйелдер етеккірге дейінгі күндерде, прогестерон көтеріліп, содан кейін кенеттен төмендегенде, май түзілуін уақытша ынталандырғанда, өршуді байқайды.',
    highlightTitle: 'Өршуді бақылау',
    highlightText:
      'Бөртпелердің цикліңізге қатысты қашан пайда болатынын жазып қою сізге және дерматологыңызға гормондық байланысты жақсырақ түсінуге көмектесе алады.',
    h5Title: 'Не көмектесе алады',
    body5a:
      'Бірнеше қарапайым күтім әдеті өршуді шектеуге көмектесе алады, бірақ өздігінен толық жоймайды:',
    careHabits: [
      'Теріңізді таңертең және кешке жұмсақ тазалаңыз',
      'Қатал немесе майсыздандыратын өнімдерден аулақ болыңыз',
      'Теріңізді күн сайын күннен қорғаңыз',
      'Бөртпелерді қысудан немесе тістеуден аулақ болыңыз',
    ],
    body5b:
      'Жағдайға байланысты дерматолог немесе гинеколог жергілікті емдеуді (кремдер, гельдер) немесе, қажет болса, тиісті гормондық емдеуді ұсына алады.',
    alertTitle: 'Өздігінен емделмеңіз',
    alertText:
      'Гормондық безеуді емдеуді (жергілікті немесе гормондық) медицина маманы тағайындап, бақылауы керек, әсіресе жүкті болуды жоспарласаңыз.',
    h6Title: 'Дәрігерге қашан бару керек?',
    body6:
      'Медициналық кеңес кейбір жағдайларда әсіресе пайдалы:',
    consultReasons: [
      'Тиісті күтімге қарамастан сақталатын безеу',
      'Ауыратын немесе терең бөртпелер (түйіндер, кисталар)',
      'Ауыр немесе тез нашарлайтын безеу',
      'Орнығып жатқан іздер немесе тыртықтар',
    ],
    h7Title: 'Негізгі қорытындылар',
    summaryTitle: 'Негізгі нүктелер',
    keyPoints: [
      'Гормондық безеудің анықталатын, андрогендерге байланысты себебі бар.',
      'Ол көбіне беттің төменгі бөлігіне әсер етеді және етеккірге дейін нашарлауы мүмкін.',
      'Ол гигиенаның жетіспеуі де, сөзсіз тағдыр да емес.',
      'Жұмсақ күтім және, қажет болса, тиісті емдеу оны жақсарта алады.',
      'Дерматолог немесе гинеколог ол сақталса, сізді қолдай алады.',
    ],
    finalNoteTitle: 'Жақсырақ түсінуге арналған нұсқаулық',
    finalNoteText:
      'Бұл мақала тек жалпы ақпаратқа арналған және медициналық консультацияның орнын баспайды. Күмән туындаса немесе белгілер сақталса, медицина маманынан кеңес сұраңыз.',
    shareMessage: 'Гормондық безеуді түсіну — AWA',
  },
  wo: {
    badge: 'PCOS • PEPPO BU HORMON',
    title: 'Xam\npeppo bu hormon',
    metaDuration: '7 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind ngir njàng',
    intro:
      'Lu tax peppo bu hormon mën a feeñ ak PCOS, naka ñuy xam ko, ak jawab yu mën a dimbli ngir yor ko.',
    introSecondary:
      'Dafay jëm ci jigéen yu bari te du ñàkk set walla benn mbir bu war a am: xam fan la jóge mën na dimbli nga yor ko bu gëna baax.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Lan mooy peppo bu hormon?',
      'Lu tax PCOS mën a def peppo?',
      'Naka ngay xam peppo bu hormon',
      'Peppo bu hormon ak wërsëgu weer',
      'Li mën a dimbli',
      'Kañ ngay seet doktoor?',
      'Li am solo',
    ],
    h1: 'Lan mooy peppo bu hormon?',
    body1a:
      'Peppo bu hormon benn xeetu peppo la bu jëm ci yëngu walla jubul ci hormon, lool ci androjen. Wuute ak peppo bu cosaan bu waxambaane, dafay jëm ci jigéen ñu mag te mën na sax walla feeñ ginnaaw jamono boobu.',
    body1b:
      'Dafay wuute itam ci bérëbam, ci xóotam ak ci naka mu di dellusi ci bérëb yu bokk, ba tax bu ñu topp ak yoon benn yoonu der bu baax.',
    tip1Title: 'Lu baax a xam',
    tip1Text:
      'Peppo bu hormon jëmul ci ñàkk set: sab sa kanam lu ëpp du ko dem, te mën na tiis ko der bi.',
    h2Title: 'Lu tax PCOS mën a def peppo?',
    body2:
      'Ci PCOS, androjen yu ëpp tuuti dañuy xiirtal xël-xël yu der yi, ñoom di defar diwlin gu ëpp. Yenn der yi dañuy gën a nooy ci hormon yii, loolu mooy leeral lu tax peppo mën a am lool ba tax amul benn jubul bu bari bu laboratuwaar natt.',
    neutralText:
      'Du mbir bu fit: nooy bii wuute na ci nit ak nit te du sukkandiku ci say yoonu dund.',
    h3Title: 'Naka ngay xam peppo bu hormon',
    body3:
      'Yenn màndarga daa dellusi, waaye du saa su ne:',
    recognizeSigns: [
      'Suufu kanam: sës, kàmbu',
      'Pepp yu xóot, yenn saa yu metti',
      'Daa dellusi ci bérëb yu bokk',
      'Xonq walla màndarga yu sax',
    ],
    h4Title: 'Peppo bu hormon ak wërsëgu weer',
    body4:
      'Peppo bu hormon mën na yëngu ci wërsëg bi gépp. Jigéen yu bari dañuy gis yokkute ci fan yi balaa règle, bu progesteron di yokku te wàññiku ci gaaw, mu xiirtal defar diwlin ci jamono bu gàtt.',
    highlightTitle: 'Topp say yokkute',
    highlightText:
      'Bind kañ la peppo di feeñ ci wërsëg mën na dimbli yaw ak sa doktoor ci der nga gën a xam jokkoo bu hormon bi.',
    h5Title: 'Li mën a dimbli',
    body5a:
      'Yenn yoon yu yomb yu yër der mën nañu dimbli ngir wàññi yokkute yi, te duñu ko dàq ci boppam:',
    careHabits: [
      'Sab sa der ak lewet suba ak guddi',
      'Moytu jumtukaay yu metti walla yu ñàkk',
      'Aar sa der ci jant bés bu nekk',
      'Bu nga xëtt walla jëlal pepp yi',
    ],
    body5b:
      'Ci mbir bi, benn doktoor bu der walla benn ginekolog mën na digal garab yu ñuy tegal ci der (kirem, jel) walla, bu soxlaa, benn garabu hormon bu méngoo.',
    alertTitle: 'Bu garab sa bopp',
    alertText:
      'Garab yu peppo bu hormon (yu ñuy tegal walla yu hormon) war nañu ñu leen digal te topp leen benn liggéeykatu wér, lool bu nga di yaakaar ëmb.',
    h6Title: 'Kañ ngay seet doktoor?',
    body6:
      'Ndigalu doktoor mën na dimbli lool ci yenn mbir:',
    consultReasons: [
      'Peppo bu sax ba tey ak yër bu méngoo',
      'Pepp yu metti walla yu xóot (nodul, kist)',
      'Peppo bu metti walla bu di ñaaw ci gaaw',
      'Màndarga walla màndargay peppo yu di sax',
    ],
    h7Title: 'Li am solo',
    summaryTitle: 'Li am solo',
    keyPoints: [
      'Peppo bu hormon am na benn sabab bu ñu xam, bu jëm ci androjen.',
      'Daa jëm ci suufu kanam te mën na gën a metti balaa règle.',
      'Du ñàkk set walla benn mbir bu war a am.',
      'Yër bu lewet ak, bu soxlaa, benn garab bu méngoo mën nañu ko gën a baax.',
      'Benn doktoor bu der walla ginekolog mën na la dimbli bu mu sax.',
    ],
    finalNoteTitle: 'Benn ndigal ngir gën a xam',
    finalNoteText:
      'Bind bii ngir xibaar bu yaatu rekk la te du wuutu seetlu bu doktoor. Bu am nga xel-ñaar walla bu màndarga yi sax, seet ndigalu benn liggéeykatu wér.',
    shareMessage: 'Xam peppo bu hormon — AWA',
  },
  ha: {
    badge: 'PCOS • KURAJEN HORMONE',
    title: 'Fahimtar\nkurajen hormone',
    metaDuration: 'karatun minti 7',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun ilimantarwa',
    intro:
      'Dalilin da ya sa kurajen hormone za su iya bayyana da PCOS, yadda za a gane su, da mafita da za su iya taimakawa wajen sarrafa su.',
    introSecondary:
      'Suna shafar mata da yawa kuma ba rashin tsabta ba ne ko wani abu da ba za a iya guje wa ba: fahimtar asalinsu yana taimakawa wajen sarrafa su da kyau.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Menene kurajen hormone?',
      'Me ya sa PCOS zai iya haifar da kuraje?',
      'Yadda za a gane kurajen hormone',
      'Kurajen hormone da zagayen haila',
      'Abin da zai iya taimakawa',
      'Yaushe za a ga likita?',
      'Muhimman abubuwa',
    ],
    h1: 'Menene kurajen hormone?',
    body1a:
      'Kurajen hormone wani nau’i ne na kuraje da ke da alaƙa kai tsaye da sauye-sauyen hormone ko rashin daidaito, musamman a androgens. Ba kamar kurajen matasa na al’ada ba, galibi suna shafar mata manya kuma suna iya dawwama ko bayyana bayan wannan lokaci.',
    body1b:
      'Hakanan ana bambanta su ta wurin da suke, zurfinsu, da yawan sake bayyana a wurare iri ɗaya duk da kulawar fata ta yau da kullum da aka bi da kyau.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text:
      'Kurajen hormone ba su da alaƙa da rashin tsabta: wanke fuska sau da yawa ba ya sa su ɓace, kuma zai iya ma ƙara damun fata.',
    h2Title: 'Me ya sa PCOS zai iya haifar da kuraje?',
    body2:
      'A PCOS, yawan androgens na dangi yana motsa glandan sebaceous, waɗanda sai su samar da sebum mai yawa. Wasu fata ma sun fi kula da waɗannan hormone, wanda ya bayyana dalilin da ya sa kuraje za su iya yin bayyananne ko da babu babban rashin daidaito da dakin gwaji ya auna.',
    neutralText:
      'Wannan ba batun ƙarfin zuciya ba ne: wannan kulawa tana bambanta daga mutum zuwa mutum kuma ba ta dogara ga dabi’un rayuwarki ba.',
    h3Title: 'Yadda za a gane kurajen hormone',
    body3:
      'Wasu siffofi galibi suna maimaituwa, ko da yake ba koyaushe ba:',
    recognizeSigns: [
      'Ƙasan fuska: gefen haɓa, haɓa',
      'Kuraje masu zurfi, wani lokaci masu ciwo',
      'Galibi suna sake bayyana a wurare iri ɗaya',
      'Jajayen fata ko tabo da ke dawwama',
    ],
    h4Title: 'Kurajen hormone da zagayen haila',
    body4:
      'Kurajen hormone na iya canzawa a duk zagaye. Mata da yawa suna lura da tashi a kwanakin da suka gabaci hailarsu, lokacin da progesterone ke hawa sannan ya sauka sosai, yana motsa samar da sebum na ɗan lokaci.',
    highlightTitle: 'Bin diddigin tashinki',
    highlightText:
      'Rubuta lokacin da kuraje ke bayyana dangane da zagayenki na iya taimaka miki da likitan fatarki ku fi fahimtar alaƙar hormone.',
    h5Title: 'Abin da zai iya taimakawa',
    body5a:
      'Wasu dabi’un kulawa masu sauƙi na iya taimakawa rage tashi, ba tare da share su gaba ɗaya da kansu ba:',
    careHabits: [
      'Wanke fatarki a hankali safe da yamma',
      'Guje wa kayayyaki masu tsauri ko masu cire mai sosai',
      'Kare fatarki daga rana kullum',
      'Guje wa matse ko gutsure kuraje',
    ],
    body5b:
      'Bisa yanayin, likitan fata ko na mata na iya ba da shawarar magunguna na shafawa (man shafawa, gel) ko, idan ya zama dole, maganin hormone da ya dace.',
    alertTitle: 'Kada ki yi wa kanki magani',
    alertText:
      'Dole ne ma’aikacin lafiya ya rubuta kuma ya bi diddigin maganin kurajen hormone (na shafawa ko na hormone), musamman idan kina fatan samun ciki.',
    h6Title: 'Yaushe za a ga likita?',
    body6:
      'Shawarar likita tana da amfani musamman a wasu yanayi:',
    consultReasons: [
      'Kuraje da ke dawwama duk da kulawa mai dacewa',
      'Kuraje masu ciwo ko zurfi (nodules, cysts)',
      'Kuraje masu tsanani ko masu ƙara muni da sauri',
      'Tabo ko tabon da ke zama',
    ],
    h7Title: 'Muhimman abubuwa',
    summaryTitle: 'Muhimman bayanai',
    keyPoints: [
      'Kurajen hormone suna da dalili da za a iya ganowa, mai alaƙa da androgens.',
      'Galibi suna shafar ƙasan fuska kuma suna iya ƙara muni kafin hailarki.',
      'Ba rashin tsabta ba ne ko wani abu da ba za a iya guje wa ba.',
      'Kulawa mai laushi da, idan ya zama dole, maganin da ya dace na iya inganta su.',
      'Likitan fata ko na mata na iya tallafa miki idan sun dawwama.',
    ],
    finalNoteTitle: 'Jagora don fi fahimta',
    finalNoteText:
      'An yi wannan labari don bayani gabaɗaya ne kawai kuma ba ya maye gurbin shawarar likita. Idan kina cikin shakka ko alamomi sun dawwama, nemi shawara daga ma’aikacin lafiya.',
    shareMessage: 'Fahimtar kurajen hormone — AWA',
  },
  am: {
    badge: 'ፒሲኦኤስ • የሆርሞን ብጉር',
    title: 'የሆርሞን ብጉርን\nመረዳት',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ትምህርታዊ ይዘት',
    intro:
      'የሆርሞን ብጉር በፒሲኦኤስ ለምን ሊታይ እንደሚችል፣ እንዴት እንደሚታወቅ እና እሱን ለመቆጣጠር ምን መፍትሔዎች ሊረዱ እንደሚችሉ።',
    introSecondary:
      'ብዙ ሴቶችን ይነካል እና የንጽሕና እጦት ወይም የማይቀር ነገር አይደለም፦ መነሻውን መረዳት በተሻለ ለመቆጣጠር ይረዳል።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የሆርሞን ብጉር ምንድን ነው?',
      'ፒሲኦኤስ ብጉር ለምን ሊያስከትል ይችላል?',
      'የሆርሞን ብጉርን እንዴት መለየት',
      'የሆርሞን ብጉር እና የወር አበባ ዑደት',
      'ምን ሊረዳ ይችላል',
      'ሐኪም መቼ ማየት?',
      'ዋና ዋና ነጥቦች',
    ],
    h1: 'የሆርሞን ብጉር ምንድን ነው?',
    body1a:
      'የሆርሞን ብጉር በቀጥታ ከሆርሞን መለዋወጥ ወይም አለመመጣጠን፣ በተለይም ከአንድሮጅኖች ጋር የተያያዘ የብጉር ዓይነት ነው። ከጉርምስና የተለመደ ብጉር በተለየ ብዙ ጊዜ ጎልማሳ ሴቶችን ይነካል እና ከዚያ ጊዜ በኋላ ሊቀጥል ወይም ሊታይ ይችላል።',
    body1b:
      'በሚገኝበት ቦታ፣ በጥልቀቱ እና በደንብ የሚከተሉት መደበኛ የቆዳ እንክብካቤ ቢኖርም በተመሳሳይ ቦታዎች እንደገና የመታየት ዝንባሌው ይለያል።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text:
      'የሆርሞን ብጉር ከንጽሕና እጦት ጋር የተያያዘ አይደለም፦ ፊትሽን ደጋግሞ መታጠብ አያጠፋውም፣ ቆዳንም ሊያበሳጭ ይችላል።',
    h2Title: 'ፒሲኦኤስ ብጉር ለምን ሊያስከትል ይችላል?',
    body2:
      'በፒሲኦኤስ አንጻራዊ የአንድሮጅን ከፍተኛነት የሴባሴየስ እጢዎችን ያነቃቃል፤ እነሱም ብዙ ሰበም ያመርታሉ። አንዳንድ ቆዳ ለእነዚህ ሆርሞኖች የበለጠ ስሱ ነው፤ ይህም በላብራቶሪ የሚለካ ትልቅ አለመመጣጠን ባይኖርም ብጉር ለምን ሊጎላ እንደሚችል ያስረዳል።',
    neutralText:
      'ይህ የፈቃደኝነት ጉዳይ አይደለም፦ ይህ ስሜታዊነት ከሰው ወደ ሰው ይለያያል እና በአኗኗር ልማዶችሽ ላይ አይወሰንም።',
    h3Title: 'የሆርሞን ብጉርን እንዴት መለየት',
    body3:
      'የተወሰኑ ገጽታዎች ብዙ ጊዜ ይደጋገማሉ፣ ምንም እንኳን ሁልጊዜ ባይሆንም፦',
    recognizeSigns: [
      'የፊት ታችኛው ክፍል፦ መንጋጋ፣ አገጭ',
      'ጥልቅ፣ አንዳንድ ጊዜ የሚያም ብጉር',
      'ብዙ ጊዜ በተመሳሳይ ቦታዎች እንደገና ይታያል',
      'የሚቆይ መቅላት ወይም ምልክት',
    ],
    h4Title: 'የሆርሞን ብጉር እና የወር አበባ ዑደት',
    body4:
      'የሆርሞን ብጉር በዑደቱ ሁሉ ሊለዋወጥ ይችላል። ብዙ ሴቶች ከወር አበባ በፊት ባሉት ቀናት ፕሮጄስትሮን ከፍ ብሎ ከዚያ በድንገት ሲወርድ፣ ሰበም መመረትን ለጊዜው ሲያነቃቃ ብጉር መባባሱን ያስተውላሉ።',
    highlightTitle: 'የብጉር መባባስሽን መከታተል',
    highlightText:
      'ብጉር ከዑደትሽ ጋር ሲነጻጸር መቼ እንደሚታይ መጻፍ አንቺና የቆዳ ሐኪምሽ የሆርሞን ግንኙነቱን በተሻለ እንድትረዱ ሊረዳ ይችላል።',
    h5Title: 'ምን ሊረዳ ይችላል',
    body5a:
      'ጥቂት ቀላል የእንክብካቤ ልማዶች መባባስን ለመገደብ ሊረዱ ይችላሉ፣ ነገር ግን ብቻቸውን ሙሉ በሙሉ አያጠፉትም፦',
    careHabits: [
      'ቆዳሽን ጠዋትና ማታ በለስላሳ አጽጂ',
      'ጠንካራ ወይም ቆዳን የሚያደርቁ ምርቶችን አስወግጂ',
      'ቆዳሽን በየቀኑ ከፀሐይ ጠብቂ',
      'ብጉርን ከመጭመቅ ወይም ከመነካካት ተቆጠቢ',
    ],
    body5b:
      'እንደ ሁኔታው የቆዳ ሐኪም ወይም የማህፀንና ጽንስ ሐኪም የአካባቢ ሕክምናዎችን (ክሬሞች፣ ጄሎች) ወይም ካስፈለገ ተስማሚ የሆርሞን ሕክምና ሊጠቁም ይችላል።',
    alertTitle: 'ራስሽን አታክሚ',
    alertText:
      'የሆርሞን ብጉር ሕክምናዎች (የአካባቢ ወይም የሆርሞን) በጤና ባለሙያ ሊታዘዙና ሊከታተሉ ይገባል፣ በተለይ ለማርገዝ ተስፋ ካደረግሽ።',
    h6Title: 'ሐኪም መቼ ማየት?',
    body6:
      'የሕክምና ምክር በተወሰኑ ሁኔታዎች በተለይ ጠቃሚ ነው፦',
    consultReasons: [
      'በተገቢ እንክብካቤ ቢሆንም የሚቀጥል ብጉር',
      'የሚያም ወይም ጥልቅ ብጉር (እባጮች፣ ሲስቶች)',
      'ከባድ ወይም በፍጥነት የሚባባስ ብጉር',
      'እየተቀመጡ ያሉ ምልክቶች ወይም ጠባሳዎች',
    ],
    h7Title: 'ዋና ዋና ነጥቦች',
    summaryTitle: 'አስፈላጊዎቹ ነጥቦች',
    keyPoints: [
      'የሆርሞን ብጉር ከአንድሮጅኖች ጋር የተያያዘ ሊታወቅ የሚችል መንስኤ አለው።',
      'ብዙ ጊዜ የፊት ታችኛውን ክፍል ይነካል እና ከወር አበባ በፊት ሊባባስ ይችላል።',
      'የንጽሕና እጦት ወይም የማይቀር ነገር አይደለም።',
      'ለስላሳ እንክብካቤ እና ካስፈለገ ተስማሚ ሕክምና ሊያሻሽለው ይችላል።',
      'ከቀጠለ የቆዳ ሐኪም ወይም የማህፀንና ጽንስ ሐኪም ሊደግፍሽ ይችላል።',
    ],
    finalNoteTitle: 'በተሻለ ለመረዳት መመሪያ',
    finalNoteText:
      'ይህ ጽሑፍ ለአጠቃላይ መረጃ ብቻ ነው እና የሕክምና ምክክርን አይተካም። ጥርጣሬ ካለሽ ወይም ምልክቶች ከቀጠሉ የጤና ባለሙያ ምክር ጠይቂ።',
    shareMessage: 'የሆርሞን ብጉርን መረዳት — AWA',
  },
  nl: {
    badge: 'PCOS • HORMONALE ACNE',
    title: 'Hormonale acne\nbegrijpen',
    metaDuration: '7 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Educatieve inhoud',
    intro:
      'Waarom hormonale acne bij PCOS kan voorkomen, hoe je het herkent en welke oplossingen kunnen helpen het te beheersen.',
    introSecondary:
      'Het treft veel vrouwen en is geen gebrek aan hygiëne en ook niet onvermijdelijk: de oorsprong begrijpen helpt het beter te beheersen.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Wat is hormonale acne?',
      'Waarom kan PCOS acne veroorzaken?',
      'Hoe je hormonale acne herkent',
      'Hormonale acne en de menstruatiecyclus',
      'Wat kan helpen',
      'Wanneer een arts zien?',
      'Belangrijkste punten',
    ],
    h1: 'Wat is hormonale acne?',
    body1a:
      'Hormonale acne is een vorm van acne die rechtstreeks verband houdt met hormonale schommelingen of een onevenwicht, met name van androgenen. In tegenstelling tot de meer typische acne van de adolescentie treft het vaak volwassen vrouwen en kan het na die periode blijven bestaan of verschijnen.',
    body1b:
      'Het onderscheidt zich ook door de plaats, de diepte en de neiging om op dezelfde plekken terug te komen ondanks een goed gevolgde, regelmatige huidverzorgingsroutine.',
    tip1Title: 'Goed om te weten',
    tip1Text:
      'Hormonale acne houdt geen verband met een gebrek aan hygiëne: je gezicht vaker wassen laat het niet verdwijnen en kan de huid zelfs irriteren.',
    h2Title: 'Waarom kan PCOS acne veroorzaken?',
    body2:
      'Bij PCOS stimuleert een relatief teveel aan androgenen de talgklieren, die dan meer talg produceren. Sommige huid is ook gevoeliger voor deze hormonen, wat verklaart waarom acne uitgesproken kan zijn, zelfs zonder een in het lab gemeten groot onevenwicht.',
    neutralText:
      'Dit is geen kwestie van wilskracht: deze gevoeligheid verschilt van persoon tot persoon en hangt niet af van je leefstijlgewoonten.',
    h3Title: 'Hoe je hormonale acne herkent',
    body3:
      'Bepaalde kenmerken komen vaak terug, al is dat niet systematisch:',
    recognizeSigns: [
      'Onderste deel van het gezicht: kaaklijn, kin',
      'Diepere, soms pijnlijke uitbarstingen',
      'Komt vaak terug op dezelfde plekken',
      'Roodheid of vlekken die blijven',
    ],
    h4Title: 'Hormonale acne en de menstruatiecyclus',
    body4:
      'Hormonale acne kan gedurende de cyclus schommelen. Veel vrouwen merken een opflakkering in de dagen vóór hun menstruatie, wanneer progesteron stijgt en daarna sterk daalt, waardoor de talgproductie tijdelijk wordt gestimuleerd.',
    highlightTitle: 'Je opflakkeringen bijhouden',
    highlightText:
      'Noteren wanneer uitbarstingen verschijnen ten opzichte van je cyclus kan jou en je dermatoloog helpen het hormonale verband beter te begrijpen.',
    h5Title: 'Wat kan helpen',
    body5a:
      'Enkele eenvoudige verzorgingsgewoonten kunnen helpen opflakkeringen te beperken, zonder ze op zichzelf volledig te laten verdwijnen:',
    careHabits: [
      'Reinig je huid ’s ochtends en ’s avonds zacht',
      'Vermijd scherpe of uitdrogende producten',
      'Bescherm je huid dagelijks tegen de zon',
      'Vermijd het uitknijpen of krabben aan uitbarstingen',
    ],
    body5b:
      'Afhankelijk van de situatie kan een dermatoloog of gynaecoloog lokale behandelingen (crèmes, gels) of, indien nodig, een geschikte hormonale behandeling voorstellen.',
    alertTitle: 'Geen zelfmedicatie',
    alertText:
      'Behandelingen voor hormonale acne (lokaal of hormonaal) moeten door een zorgverlener worden voorgeschreven en gevolgd, vooral als je zwanger hoopt te worden.',
    h6Title: 'Wanneer een arts zien?',
    body6:
      'Medisch advies is in bepaalde situaties bijzonder nuttig:',
    consultReasons: [
      'Acne die blijft bestaan ondanks geschikte verzorging',
      'Pijnlijke of diepe uitbarstingen (noduli, cysten)',
      'Ernstige acne of acne die snel verergert',
      'Vlekken of littekens die zich vestigen',
    ],
    h7Title: 'Belangrijkste punten',
    summaryTitle: 'De essentiële punten',
    keyPoints: [
      'Hormonale acne heeft een herkenbare oorzaak, verbonden met androgenen.',
      'Het treft vaak het onderste deel van het gezicht en kan vóór je menstruatie verergeren.',
      'Het is geen gebrek aan hygiëne en ook niet onvermijdelijk.',
      'Zachte verzorging en, indien nodig, een geschikte behandeling kan het verbeteren.',
      'Een dermatoloog of gynaecoloog kan je ondersteunen als het blijft bestaan.',
    ],
    finalNoteTitle: 'Een gids om beter te begrijpen',
    finalNoteText:
      'Dit artikel is alleen bedoeld voor algemene informatie en vervangt geen medisch consult. Vraag bij twijfel of als symptomen blijven bestaan advies aan een zorgverlener.',
    shareMessage: 'Hormonale acne begrijpen — AWA',
  },
  fi: {
    badge: 'PCOS • HORMONAALINEN AKNE',
    title: 'Hormonaalisen aknen\nymmärtäminen',
    metaDuration: '7 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Opetussisältö',
    intro:
      'Miksi hormonaalista aknea voi esiintyä PCOS:n yhteydessä, miten sen tunnistaa ja mitkä ratkaisut voivat auttaa sen hallinnassa.',
    introSecondary:
      'Se koskettaa monia naisia, eikä se ole huonon hygienian merkki eikä väistämättömyys: sen alkuperän ymmärtäminen auttaa hallitsemaan sitä paremmin.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Mikä on hormonaalinen akne?',
      'Miksi PCOS voi aiheuttaa aknea?',
      'Miten hormonaalisen aknen tunnistaa',
      'Hormonaalinen akne ja kuukautiskierto',
      'Mikä voi auttaa',
      'Milloin mennä lääkäriin?',
      'Tärkeimmät asiat',
    ],
    h1: 'Mikä on hormonaalinen akne?',
    body1a:
      'Hormonaalinen akne on aknen muoto, joka liittyy suoraan hormonaalisiin vaihteluihin tai epätasapainoon erityisesti androgeeneissa. Toisin kuin nuoruuden tyypillisempi akne, se koskettaa usein aikuisia naisia ja voi jatkua tai ilmaantua kyseisen jakson jälkeen.',
    body1b:
      'Sille ovat ominaisia myös sijainti, syvyys ja taipumus ilmaantua uudelleen samoihin kohtiin hyvin noudatetusta säännöllisestä ihonhoitorutiinista huolimatta.',
    tip1Title: 'Hyvä tietää',
    tip1Text:
      'Hormonaalinen akne ei liity huonoon hygieniaan: kasvojen pesu useammin ei saa sitä katoamaan ja voi jopa ärsyttää ihoa.',
    h2Title: 'Miksi PCOS voi aiheuttaa aknea?',
    body2:
      'PCOS:ssa suhteellinen androgeenien liikaa stimuloi talirauhasia, jotka tuottavat silloin enemmän talia. Jotkin ihot ovat myös herkempiä näille hormoneille, mikä selittää, miksi akne voi olla voimakasta ilman laboratoriossa mitattua suurta epätasapainoa.',
    neutralText:
      'Kyse ei ole tahdonvoimasta: tämä herkkyys vaihtelee ihmisestä toiseen, eikä se riipu elämäntavoistasi.',
    h3Title: 'Miten hormonaalisen aknen tunnistaa',
    body3:
      'Tietyt piirteet toistuvat usein, vaikkakaan ei järjestelmällisesti:',
    recognizeSigns: [
      'Kasvojen alaosa: leukalinja, leuka',
      'Syvemmät, joskus kivuliaat finnit',
      'Ilmaantuu usein uudelleen samoihin kohtiin',
      'Punoitus tai jäljet, jotka pysyvät',
    ],
    h4Title: 'Hormonaalinen akne ja kuukautiskierto',
    body4:
      'Hormonaalinen akne voi vaihdella kierron aikana. Monet naiset huomaavat pahenemisen päivinä ennen kuukautisia, kun progesteroni nousee ja laskee sitten jyrkästi, mikä stimuloi tilapäisesti talin tuotantoa.',
    highlightTitle: 'Pahenemisvaiheiden seuranta',
    highlightText:
      'Finnien ilmaantumisajankohdan kirjaaminen suhteessa kiertoosi voi auttaa sinua ja ihotautilääkäriäsi ymmärtämään hormonaalisen yhteyden paremmin.',
    h5Title: 'Mikä voi auttaa',
    body5a:
      'Muutama yksinkertainen hoitotapa voi auttaa rajoittamaan pahenemisvaiheita, vaikka ne eivät yksin poista aknea kokonaan:',
    careHabits: [
      'Puhdista ihosi lempeästi aamuin illoin',
      'Vältä voimakkaita tai ihoa kuivattavia tuotteita',
      'Suojaa ihosi auringolta päivittäin',
      'Vältä finnien puristamista tai näpräämistä',
    ],
    body5b:
      'Tilanteesta riippuen ihotautilääkäri tai gynekologi voi ehdottaa paikallishoitoja (voiteet, geelit) tai tarvittaessa sopivaa hormonihoitoa.',
    alertTitle: 'Ei itsehoitoa',
    alertText:
      'Hormonaalisen aknen hoidot (paikalliset tai hormonaaliset) on terveydenhuollon ammattilaisen määrättävä ja seurattava, erityisesti jos toivot tulevasi raskaaksi.',
    h6Title: 'Milloin mennä lääkäriin?',
    body6:
      'Lääketieteellinen neuvonta on erityisen hyödyllistä tietyissä tilanteissa:',
    consultReasons: [
      'Akne, joka jatkuu sopivasta hoidosta huolimatta',
      'Kivuliaat tai syvät finnit (kyhmyt, kystat)',
      'Vaikea akne tai akne, joka pahenee nopeasti',
      'Jäljet tai arvet, jotka asettuvat pysyviksi',
    ],
    h7Title: 'Tärkeimmät asiat',
    summaryTitle: 'Olennaiset kohdat',
    keyPoints: [
      'Hormonaalisella aknella on tunnistettavissa oleva syy, joka liittyy androgeeneihin.',
      'Se koskettaa usein kasvojen alaosaa ja voi pahentua ennen kuukautisia.',
      'Se ei ole huonon hygienian merkki eikä väistämättömyys.',
      'Lempeä hoito ja tarvittaessa sopiva hoito voivat parantaa tilannetta.',
      'Ihotautilääkäri tai gynekologi voi tukea sinua, jos se jatkuu.',
    ],
    finalNoteTitle: 'Opas ymmärtämisen tueksi',
    finalNoteText:
      'Tämä artikkeli on tarkoitettu vain yleiseksi tiedoksi eikä korvaa lääkärin vastaanottoa. Epäselvässä tilanteessa tai oireiden jatkuessa pyydä neuvoa terveydenhuollon ammattilaiselta.',
    shareMessage: 'Hormonaalisen aknen ymmärtäminen — AWA',
  },
  el: {
    badge: 'PCOS • ΟΡΜΟΝΙΚΗ ΑΚΜΗ',
    title: 'Κατανοώντας\nτην ορμονική ακμή',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Εκπαιδευτικό περιεχόμενο',
    intro:
      'Γιατί η ορμονική ακμή μπορεί να εμφανιστεί με PCOS, πώς να την αναγνωρίσεις και ποιες λύσεις μπορούν να βοηθήσουν στη διαχείρισή της.',
    introSecondary:
      'Επηρεάζει πολλές γυναίκες και δεν είναι ούτε έλλειψη υγιεινής ούτε αναπόφευκτη: η κατανόηση της προέλευσής της βοηθά να τη διαχειρίζεσαι καλύτερα.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Τι είναι η ορμονική ακμή;',
      'Γιατί το PCOS μπορεί να προκαλέσει ακμή;',
      'Πώς να αναγνωρίσεις την ορμονική ακμή',
      'Ορμονική ακμή και έμμηνος κύκλος',
      'Τι μπορεί να βοηθήσει',
      'Πότε να επισκεφθείς γιατρό;',
      'Βασικά συμπεράσματα',
    ],
    h1: 'Τι είναι η ορμονική ακμή;',
    body1a:
      'Η ορμονική ακμή είναι μια μορφή ακμής που συνδέεται άμεσα με ορμονικές διακυμάνσεις ή ανισορροπία, ιδίως των ανδρογόνων. Σε αντίθεση με την πιο τυπική ακμή της εφηβείας, επηρεάζει συχνά ενήλικες γυναίκες και μπορεί να επιμένει ή να εμφανίζεται μετά από εκείνη την περίοδο.',
    body1b:
      'Ξεχωρίζει επίσης από την τοποθεσία της, το βάθος της και την τάση της να επανεμφανίζεται στα ίδια σημεία παρά την τακτική και σωστά ακολουθούμενη φροντίδα του δέρματος.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text:
      'Η ορμονική ακμή δεν συνδέεται με έλλειψη υγιεινής: το να πλένεις το πρόσωπό σου πιο συχνά δεν την κάνει να φύγει και μπορεί ακόμη και να ερεθίσει το δέρμα.',
    h2Title: 'Γιατί το PCOS μπορεί να προκαλέσει ακμή;',
    body2:
      'Στο PCOS, μια σχετική περίσσεια ανδρογόνων διεγείρει τους σμηγματογόνους αδένες, οι οποίοι παράγουν τότε περισσότερο σμήγμα. Ορισμένα δέρματα είναι επίσης πιο ευαίσθητα σε αυτές τις ορμόνες, κάτι που εξηγεί γιατί η ακμή μπορεί να είναι έντονη ακόμη και χωρίς μεγάλη ανισορροπία που μετράται στο εργαστήριο.',
    neutralText:
      'Δεν πρόκειται για θέμα θέλησης: αυτή η ευαισθησία διαφέρει από γυναίκα σε γυναίκα και δεν εξαρτάται από τις συνήθειες του τρόπου ζωής σου.',
    h3Title: 'Πώς να αναγνωρίσεις την ορμονική ακμή',
    body3:
      'Ορισμένα χαρακτηριστικά επανεμφανίζονται συχνά, αν και όχι συστηματικά:',
    recognizeSigns: [
      'Κάτω μέρος του προσώπου: γραμμή της γνάθου, πηγούνι',
      'Βαθύτερες, μερικές φορές επώδυνες εξάρσεις',
      'Συχνά επανεμφανίζεται στα ίδια σημεία',
      'Ερυθρότητα ή σημάδια που επιμένουν',
    ],
    h4Title: 'Ορμονική ακμή και έμμηνος κύκλος',
    body4:
      'Η ορμονική ακμή μπορεί να διακυμαίνεται σε όλη τη διάρκεια του κύκλου. Πολλές γυναίκες παρατηρούν έξαρση τις ημέρες πριν την περίοδο, όταν η προγεστερόνη ανεβαίνει και μετά πέφτει απότομα, διεγείροντας προσωρινά την παραγωγή σμήγματος.',
    highlightTitle: 'Παρακολούθηση των εξάρσεών σου',
    highlightText:
      'Το να σημειώνεις πότε εμφανίζονται οι εξάρσεις σε σχέση με τον κύκλο σου μπορεί να βοηθήσει εσένα και τον δερματολόγο σου να κατανοήσετε καλύτερα την ορμονική σύνδεση.',
    h5Title: 'Τι μπορεί να βοηθήσει',
    body5a:
      'Μερικές απλές συνήθειες φροντίδας μπορούν να βοηθήσουν να περιοριστούν οι εξάρσεις, χωρίς να τις εξαφανίζουν πλήρως από μόνες τους:',
    careHabits: [
      'Καθάριζε απαλά το δέρμα σου πρωί και βράδυ',
      'Απόφυγε σκληρά ή ξηραντικά προϊόντα',
      'Προστάτευε το δέρμα σου από τον ήλιο καθημερινά',
      'Απόφυγε να στύβεις ή να ξύνεις τις εξάρσεις',
    ],
    body5b:
      'Ανάλογα με την περίπτωση, ένας δερματολόγος ή γυναικολόγος μπορεί να προτείνει τοπικές θεραπείες (κρέμες, γέλες) ή, αν χρειάζεται, μια κατάλληλη ορμονική θεραπεία.',
    alertTitle: 'Όχι αυτοθεραπεία',
    alertText:
      'Οι θεραπείες για την ορμονική ακμή (τοπικές ή ορμονικές) πρέπει να συνταγογραφούνται και να παρακολουθούνται από επαγγελματία υγείας, ιδίως αν ελπίζεις να συλλάβεις.',
    h6Title: 'Πότε να επισκεφθείς γιατρό;',
    body6:
      'Η ιατρική συμβουλή είναι ιδιαίτερα χρήσιμη σε ορισμένες περιπτώσεις:',
    consultReasons: [
      'Ακμή που επιμένει παρά την κατάλληλη φροντίδα',
      'Επώδυνες ή βαθιές εξάρσεις (οζίδια, κύστεις)',
      'Σοβαρή ακμή ή ακμή που επιδεινώνεται γρήγορα',
      'Σημάδια ή ουλές που εγκαθίστανται',
    ],
    h7Title: 'Βασικά συμπεράσματα',
    summaryTitle: 'Τα βασικά σημεία',
    keyPoints: [
      'Η ορμονική ακμή έχει αναγνωρίσιμη αιτία, που συνδέεται με τα ανδρογόνα.',
      'Επηρεάζει συχνά το κάτω μέρος του προσώπου και μπορεί να επιδεινωθεί πριν την περίοδο.',
      'Δεν είναι ούτε έλλειψη υγιεινής ούτε αναπόφευκτη.',
      'Η ήπια φροντίδα και, αν χρειάζεται, μια κατάλληλη θεραπεία μπορεί να τη βελτιώσει.',
      'Ένας δερματολόγος ή γυναικολόγος μπορεί να σε στηρίξει αν επιμένει.',
    ],
    finalNoteTitle: 'Ένας οδηγός για καλύτερη κατανόηση',
    finalNoteText:
      'Αυτό το άρθρο είναι μόνο για γενική ενημέρωση και δεν αντικαθιστά μια ιατρική επίσκεψη. Αν έχεις αμφιβολίες ή αν τα συμπτώματα επιμένουν, ζήτησε συμβουλή από έναν επαγγελματία υγείας.',
    shareMessage: 'Κατανοώντας την ορμονική ακμή — AWA',
  },
  fil: {
    badge: 'PCOS • HORMONAL NA TIGYAWAT',
    title: 'Pag-unawa sa\nhormonal na tigyawat',
    metaDuration: '7 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Pang-edukasyong nilalaman',
    intro:
      'Bakit maaaring lumitaw ang hormonal na tigyawat kasabay ng PCOS, paano ito makilala, at anong mga solusyon ang makakatulong na pangasiwaan ito.',
    introSecondary:
      'Nakakaapekto ito sa maraming babae at hindi ito kakulangan sa kalinisan ni hindi maiiwasan: ang pag-unawa sa pinagmulan nito ay tumutulong na mas mapangasiwaan ito.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ano ang hormonal na tigyawat?',
      'Bakit maaaring magdulot ng tigyawat ang PCOS?',
      'Paano makilala ang hormonal na tigyawat',
      'Hormonal na tigyawat at siklo ng regla',
      'Ang makakatulong',
      'Kailan magpapatingin sa doktor?',
      'Mahahalagang tandaan',
    ],
    h1: 'Ano ang hormonal na tigyawat?',
    body1a:
      'Ang hormonal na tigyawat ay anyo ng tigyawat na direktang may kaugnayan sa mga hormonal na pagbabago-bago o hindi balanse, partikular sa mga androgen. Hindi tulad ng mas tipikal na tigyawat ng pagdadalaga, madalas nitong tinatamaan ang mga nasa hustong gulang na babae at maaaring magpatuloy o lumitaw pagkatapos ng panahong iyon.',
    body1b:
      'Natatangi rin ito sa lokasyon, lalim, at tendensiyang muling lumitaw sa parehong mga lugar sa kabila ng maayos na sinusunod na regular na skincare routine.',
    tip1Title: 'Mabuting malaman',
    tip1Text:
      'Hindi nauugnay sa kakulangan sa kalinisan ang hormonal na tigyawat: ang mas madalas na paghuhugas ng mukha ay hindi nagpapawala nito, at maaari pang makairita sa balat.',
    h2Title: 'Bakit maaaring magdulot ng tigyawat ang PCOS?',
    body2:
      'Sa PCOS, ang relatibong labis na androgen ay nagpapasigla sa mga sebaceous gland, na pagkatapos ay gumagawa ng mas maraming sebum. Mas sensitibo rin ang ilang balat sa mga hormone na ito, na nagpapaliwanag kung bakit maaaring maging kapansin-pansin ang tigyawat kahit walang malaking hindi balanseng nasukat sa lab.',
    neutralText:
      'Hindi ito usapin ng lakas ng loob: nag-iiba ang sensitibidad na ito sa bawat tao at hindi nakadepende sa iyong mga gawi sa pamumuhay.',
    h3Title: 'Paano makilala ang hormonal na tigyawat',
    body3:
      'Madalas na umuulit ang ilang katangian, bagaman hindi sistematiko:',
    recognizeSigns: [
      'Ibabang bahagi ng mukha: panga, baba',
      'Mas malalim, minsan masakit na mga tigyawat',
      'Madalas na muling lumilitaw sa parehong mga lugar',
      'Pamumula o mga markang nananatili',
    ],
    h4Title: 'Hormonal na tigyawat at siklo ng regla',
    body4:
      'Maaaring magbago-bago ang hormonal na tigyawat sa buong siklo. Maraming babae ang nakapapansin ng paglala sa mga araw bago ang regla, kapag tumataas ang progesterone at pagkatapos ay biglang bumababa, na pansamantalang nagpapasigla sa produksyon ng sebum.',
    highlightTitle: 'Pagsubaybay sa iyong mga paglala',
    highlightText:
      'Ang pagtatala kung kailan lumilitaw ang mga tigyawat kaugnay ng iyong siklo ay makakatulong sa iyo at sa iyong dermatologist na mas maunawaan ang hormonal na ugnayan.',
    h5Title: 'Ang makakatulong',
    body5a:
      'Ang ilang simpleng gawi sa pangangalaga ay makakatulong na limitahan ang mga paglala, nang hindi ito lubos na napapawi nang mag-isa:',
    careHabits: [
      'Banayad na linisin ang balat umaga at gabi',
      'Iwasan ang matatapang o nakakatuyong produkto',
      'Protektahan ang balat mula sa araw araw-araw',
      'Iwasang pisilin o kutkutin ang mga tigyawat',
    ],
    body5b:
      'Depende sa sitwasyon, maaaring magmungkahi ang dermatologist o gynecologist ng mga topical na paggamot (cream, gel) o, kung kinakailangan, angkop na hormonal na paggamot.',
    alertTitle: 'Huwag gumamot sa sarili',
    alertText:
      'Ang mga paggamot sa hormonal na tigyawat (topical o hormonal) ay dapat ireseta at subaybayan ng propesyonal sa kalusugan, lalo na kung umaasa kang magbuntis.',
    h6Title: 'Kailan magpapatingin sa doktor?',
    body6:
      'Lalong nakakatulong ang medikal na payo sa ilang sitwasyon:',
    consultReasons: [
      'Tigyawat na nagpapatuloy sa kabila ng angkop na pangangalaga',
      'Masakit o malalim na mga tigyawat (nodule, cyst)',
      'Malubhang tigyawat o tigyawat na mabilis lumalala',
      'Mga markang peklat na nananatili',
    ],
    h7Title: 'Mahahalagang tandaan',
    summaryTitle: 'Ang mahahalagang punto',
    keyPoints: [
      'May natutukoy na sanhi ang hormonal na tigyawat, na may kaugnayan sa mga androgen.',
      'Madalas nitong tinatamaan ang ibabang bahagi ng mukha at maaaring lumala bago ang regla.',
      'Hindi ito kakulangan sa kalinisan ni hindi maiiwasan.',
      'Maaaring mapabuti ito ng banayad na pangangalaga at, kung kinakailangan, angkop na paggamot.',
      'Maaaring suportahan ka ng dermatologist o gynecologist kung nagpapatuloy ito.',
    ],
    finalNoteTitle: 'Isang gabay para sa mas mahusay na pag-unawa',
    finalNoteText:
      'Para sa pangkalahatang impormasyon lamang ang artikulong ito at hindi pumapalit sa medikal na konsultasyon. Kung nag-aalinlangan o nagpapatuloy ang mga sintomas, humingi ng payo sa propesyonal sa kalusugan.',
    shareMessage: 'Pag-unawa sa hormonal na tigyawat — AWA',
  },
  ta: {
    badge: 'PCOS • ஹார்மோன் முகப்பரு',
    title: 'ஹார்மோன் முகப்பருவைப்\nபுரிந்துகொள்ளுதல்',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'கல்வி உள்ளடக்கம்',
    intro:
      'PCOS உடன் ஹார்மோன் முகப்பரு ஏன் தோன்றலாம், அதை எப்படி அடையாளம் காண்பது, அதை நிர்வகிக்க எந்தத் தீர்வுகள் உதவலாம்.',
    introSecondary:
      'இது பல பெண்களைப் பாதிக்கிறது, இது சுகாதாரக் குறைபாடும் அல்ல, தவிர்க்க முடியாததும் அல்ல: அதன் தோற்றத்தைப் புரிந்துகொள்வது அதை நன்கு நிர்வகிக்க உதவுகிறது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'ஹார்மோன் முகப்பரு என்றால் என்ன?',
      'PCOS ஏன் முகப்பருவை ஏற்படுத்தலாம்?',
      'ஹார்மோன் முகப்பருவை எப்படி அடையாளம் காண்பது',
      'ஹார்மோன் முகப்பருவும் மாதவிடாய்ச் சுழற்சியும்',
      'உதவக்கூடியவை',
      'மருத்துவரை எப்போது பார்ப்பது?',
      'முக்கியக் குறிப்புகள்',
    ],
    h1: 'ஹார்மோன் முகப்பரு என்றால் என்ன?',
    body1a:
      'ஹார்மோன் முகப்பரு என்பது ஹார்மோன் ஏற்ற இறக்கங்களுடன் அல்லது சமநிலையின்மையுடன், குறிப்பாக ஆண்ட்ரோஜன்களில், நேரடியாகத் தொடர்புடைய முகப்பருவின் ஒரு வடிவம். பதின்பருவத்தின் மிகவும் வழக்கமான முகப்பருவைப் போலல்லாமல், இது பெரும்பாலும் வயது வந்த பெண்களைப் பாதிக்கிறது, அந்தக் காலத்துக்குப் பின்னும் நீடிக்கலாம் அல்லது தோன்றலாம்.',
    body1b:
      'இது அதன் இடம், ஆழம் மற்றும் நன்கு பின்பற்றப்படும் வழக்கமான தோல் பராமரிப்பு இருந்தும் அதே இடங்களில் மீண்டும் தோன்றும் போக்கு ஆகியவற்றாலும் வேறுபடுகிறது.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text:
      'ஹார்மோன் முகப்பரு சுகாதாரக் குறைபாட்டுடன் தொடர்புடையதல்ல: உங்கள் முகத்தை அடிக்கடி கழுவுவது அதை நீக்காது, தோலுக்கு எரிச்சலையும் கூட ஏற்படுத்தலாம்.',
    h2Title: 'PCOS ஏன் முகப்பருவை ஏற்படுத்தலாம்?',
    body2:
      'PCOS-இல், ஆண்ட்ரோஜன்களின் ஒப்பீட்டு அதிகரிப்பு செபேசியஸ் சுரப்பிகளைத் தூண்டி, அவை அதிக சருமத்தை (செபம்) உற்பத்தி செய்கின்றன. சில தோல்கள் இந்த ஹார்மோன்களுக்கு அதிக உணர்திறன் கொண்டவை, இது ஆய்வகத்தில் அளவிடப்பட்ட பெரிய சமநிலையின்மை இல்லாமலும் முகப்பரு தெளிவாக இருக்கக்கூடியது ஏன் என்பதை விளக்குகிறது.',
    neutralText:
      'இது மனவலிமையின் விஷயம் அல்ல: இந்த உணர்திறன் ஒருவருக்கு ஒருவர் மாறுபடும், உங்கள் வாழ்க்கை முறைப் பழக்கங்களைச் சார்ந்ததல்ல.',
    h3Title: 'ஹார்மோன் முகப்பருவை எப்படி அடையாளம் காண்பது',
    body3:
      'சில அம்சங்கள் பெரும்பாலும் திரும்பத் திரும்ப வருகின்றன, முறையாக இல்லாவிட்டாலும்:',
    recognizeSigns: [
      'முகத்தின் கீழ்ப் பகுதி: தாடை, நாடி',
      'ஆழமான, சில நேரங்களில் வலியுள்ள பருக்கள்',
      'பெரும்பாலும் அதே இடங்களில் மீண்டும் தோன்றும்',
      'நீடிக்கும் சிவப்பு அல்லது தழும்புகள்',
    ],
    h4Title: 'ஹார்மோன் முகப்பருவும் மாதவிடாய்ச் சுழற்சியும்',
    body4:
      'ஹார்மோன் முகப்பரு சுழற்சி முழுவதும் ஏற்ற இறக்கமடையலாம். புரோஜெஸ்டிரோன் உயர்ந்து பின்னர் கடுமையாகக் குறையும்போது, சருமம் உற்பத்தியைத் தற்காலிகமாகத் தூண்டி, பல பெண்கள் தம் மாதவிடாய்க்கு முந்தைய நாட்களில் ஒரு தீவிரத்தைக் கவனிக்கிறார்கள்.',
    highlightTitle: 'உங்கள் தீவிரங்களைக் கண்காணித்தல்',
    highlightText:
      'உங்கள் சுழற்சியுடன் ஒப்பிடும்போது பருக்கள் எப்போது தோன்றுகின்றன என்பதைக் குறிப்பது, ஹார்மோன் தொடர்பை நீங்களும் உங்கள் தோல் மருத்துவரும் நன்கு புரிந்துகொள்ள உதவலாம்.',
    h5Title: 'உதவக்கூடியவை',
    body5a:
      'சில எளிய பராமரிப்புப் பழக்கங்கள் தீவிரங்களைக் குறைக்க உதவலாம், அவை தாமாகவே முழுமையாகத் தீர்க்காமல்:',
    careHabits: [
      'காலையிலும் மாலையிலும் உங்கள் தோலை மென்மையாகச் சுத்தம் செய்யுங்கள்',
      'கடுமையான அல்லது தோலை உலர்த்தும் பொருட்களைத் தவிருங்கள்',
      'தினமும் உங்கள் தோலை வெயிலிலிருந்து பாதுகாக்கவும்',
      'பருக்களை அழுத்துவதையோ கிள்ளுவதையோ தவிருங்கள்',
    ],
    body5b:
      'சூழ்நிலையைப் பொறுத்து, ஒரு தோல் மருத்துவர் அல்லது மகப்பேறு மருத்துவர் மேற்பூச்சு சிகிச்சைகளை (கிரீம்கள், ஜெல்கள்) அல்லது தேவைப்பட்டால் பொருத்தமான ஹார்மோன் சிகிச்சையைப் பரிந்துரைக்கலாம்.',
    alertTitle: 'சுய மருத்துவம் வேண்டாம்',
    alertText:
      'ஹார்மோன் முகப்பருவுக்கான சிகிச்சைகள் (மேற்பூச்சு அல்லது ஹார்மோன்) ஒரு சுகாதார நிபுணரால் பரிந்துரைக்கப்பட்டு கண்காணிக்கப்பட வேண்டும், குறிப்பாக நீங்கள் கருத்தரிக்க விரும்பினால்.',
    h6Title: 'மருத்துவரை எப்போது பார்ப்பது?',
    body6:
      'சில சூழ்நிலைகளில் மருத்துவ ஆலோசனை குறிப்பாக உதவியாக இருக்கும்:',
    consultReasons: [
      'பொருத்தமான பராமரிப்பு இருந்தும் நீடிக்கும் முகப்பரு',
      'வலியுள்ள அல்லது ஆழமான பருக்கள் (கட்டிகள், நீர்க்கட்டிகள்)',
      'கடுமையான முகப்பரு அல்லது விரைவாக மோசமடையும் முகப்பரு',
      'நிலைபெறும் தழும்புகள் அல்லது வடுக்கள்',
    ],
    h7Title: 'முக்கியக் குறிப்புகள்',
    summaryTitle: 'அத்தியாவசியப் புள்ளிகள்',
    keyPoints: [
      'ஹார்மோன் முகப்பருவுக்கு ஆண்ட்ரோஜன்களுடன் தொடர்புடைய, அடையாளம் காணக்கூடிய காரணம் உண்டு.',
      'இது பெரும்பாலும் முகத்தின் கீழ்ப் பகுதியைப் பாதிக்கிறது, உங்கள் மாதவிடாய்க்கு முன் மோசமடையலாம்.',
      'இது சுகாதாரக் குறைபாடும் அல்ல, தவிர்க்க முடியாததும் அல்ல.',
      'மென்மையான பராமரிப்பும், தேவைப்பட்டால், பொருத்தமான சிகிச்சையும் அதை மேம்படுத்தலாம்.',
      'அது நீடித்தால் ஒரு தோல் மருத்துவர் அல்லது மகப்பேறு மருத்துவர் உங்களை ஆதரிக்கலாம்.',
    ],
    finalNoteTitle: 'நன்கு புரிந்துகொள்ள ஒரு வழிகாட்டி',
    finalNoteText:
      'இந்தக் கட்டுரை பொதுவான தகவலுக்கு மட்டுமே, மருத்துவ ஆலோசனைக்கு மாற்றல்ல. சந்தேகம் இருந்தால் அல்லது அறிகுறிகள் நீடித்தால், ஒரு சுகாதார நிபுணரிடம் ஆலோசனை கேளுங்கள்.',
    shareMessage: 'ஹார்மோன் முகப்பருவைப் புரிந்துகொள்ளுதல் — AWA',
  },
  te: {
    badge: 'PCOS • హార్మోన్ మొటిమలు',
    title: 'హార్మోన్ మొటిమలను\nఅర్థం చేసుకోవడం',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'విద్యాపరమైన కంటెంట్',
    intro:
      'PCOSతో హార్మోన్ మొటిమలు ఎందుకు కనిపించవచ్చు, వాటిని ఎలా గుర్తించాలి, వాటిని నిర్వహించడానికి ఏ పరిష్కారాలు సహాయపడవచ్చు.',
    introSecondary:
      'ఇది చాలామంది మహిళలను ప్రభావితం చేస్తుంది, ఇది పరిశుభ్రత లోపం కాదు, తప్పనిసరిగా జరిగేదీ కాదు: దాని మూలాన్ని అర్థం చేసుకోవడం దాన్ని మరింత బాగా నిర్వహించడానికి సహాయపడుతుంది.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'హార్మోన్ మొటిమలు అంటే ఏమిటి?',
      'PCOS మొటిమలను ఎందుకు కలిగించవచ్చు?',
      'హార్మోన్ మొటిమలను ఎలా గుర్తించాలి',
      'హార్మోన్ మొటిమలు మరియు నెలసరి చక్రం',
      'ఏది సహాయపడగలదు',
      'వైద్యుడిని ఎప్పుడు కలవాలి?',
      'ముఖ్యాంశాలు',
    ],
    h1: 'హార్మోన్ మొటిమలు అంటే ఏమిటి?',
    body1a:
      'హార్మోన్ మొటిమలు అనేవి హార్మోన్ ఊగిసలాటలతో లేదా అసమతుల్యతతో, ముఖ్యంగా ఆండ్రోజెన్లలో, నేరుగా ముడిపడిన మొటిమల రూపం. యుక్తవయస్సు యొక్క మరింత సాధారణ మొటిమలకు భిన్నంగా, ఇది తరచుగా పెద్దవయసు మహిళలను ప్రభావితం చేస్తుంది, ఆ కాలం తర్వాత కూడా కొనసాగవచ్చు లేదా కనిపించవచ్చు.',
    body1b:
      'ఇది దాని స్థానం, లోతు, బాగా పాటించే క్రమమైన చర్మ సంరక్షణ ఉన్నా అదే చోట్ల మళ్లీ కనిపించే ధోరణి ద్వారా కూడా వేరుగా ఉంటుంది.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text:
      'హార్మోన్ మొటిమలు పరిశుభ్రత లోపంతో ముడిపడి ఉండవు: మీ ముఖాన్ని ఎక్కువసార్లు కడగడం వాటిని పోగొట్టదు, చర్మాన్ని చికాకుపరచవచ్చు కూడా.',
    h2Title: 'PCOS మొటిమలను ఎందుకు కలిగించవచ్చు?',
    body2:
      'PCOSలో, ఆండ్రోజెన్ల సాపేక్ష అధికత సెబేషియస్ గ్రంథులను ప్రేరేపిస్తుంది, అవి అప్పుడు ఎక్కువ సెబమ్‌ను ఉత్పత్తి చేస్తాయి. కొన్ని చర్మాలు ఈ హార్మోన్లకు ఎక్కువ సున్నితంగా కూడా ఉంటాయి, ఇది ప్రయోగశాలలో కొలిచిన పెద్ద అసమతుల్యత లేకుండా కూడా మొటిమలు ఎందుకు స్పష్టంగా ఉండవచ్చో వివరిస్తుంది.',
    neutralText:
      'ఇది సంకల్ప బలం విషయం కాదు: ఈ సున్నితత్వం ఒకరి నుండి మరొకరికి మారుతుంది, మీ జీవనశైలి అలవాట్లపై ఆధారపడదు.',
    h3Title: 'హార్మోన్ మొటిమలను ఎలా గుర్తించాలి',
    body3:
      'కొన్ని లక్షణాలు తరచుగా పునరావృతమవుతాయి, క్రమబద్ధంగా కాకపోయినా:',
    recognizeSigns: [
      'ముఖం కింది భాగం: దవడ, గడ్డం',
      'లోతైన, కొన్నిసార్లు నొప్పి కలిగించే పొక్కులు',
      'తరచుగా అదే చోట్ల మళ్లీ కనిపిస్తాయి',
      'కొనసాగే ఎరుపు లేదా మచ్చలు',
    ],
    h4Title: 'హార్మోన్ మొటిమలు మరియు నెలసరి చక్రం',
    body4:
      'హార్మోన్ మొటిమలు చక్రం అంతటా ఊగిసలాడవచ్చు. ప్రొజెస్టిరోన్ పెరిగి ఆపై ఒక్కసారిగా తగ్గినప్పుడు, సెబమ్ ఉత్పత్తి తాత్కాలికంగా ప్రేరేపించబడి, చాలామంది మహిళలు తమ నెలసరికి ముందు రోజుల్లో తీవ్రతను గమనిస్తారు.',
    highlightTitle: 'మీ తీవ్రతలను ట్రాక్ చేయడం',
    highlightText:
      'మీ చక్రానికి సంబంధించి పొక్కులు ఎప్పుడు కనిపిస్తున్నాయో గమనించడం, హార్మోన్ సంబంధాన్ని మీరు, మీ చర్మ వైద్యుడు మరింత బాగా అర్థం చేసుకోవడానికి సహాయపడగలదు.',
    h5Title: 'ఏది సహాయపడగలదు',
    body5a:
      'కొన్ని సరళమైన సంరక్షణ అలవాట్లు తీవ్రతలను పరిమితం చేయడానికి సహాయపడగలవు, అవి స్వయంగా పూర్తిగా తొలగించకుండా:',
    careHabits: [
      'ఉదయం, సాయంత్రం మీ చర్మాన్ని మృదువుగా శుభ్రం చేయండి',
      'కఠినమైన లేదా చర్మాన్ని పొడిబార్చే ఉత్పత్తులను తప్పించుకోండి',
      'ప్రతి రోజూ మీ చర్మాన్ని ఎండ నుండి కాపాడండి',
      'పొక్కులను నొక్కడం లేదా గిల్లడం తప్పించుకోండి',
    ],
    body5b:
      'పరిస్థితిని బట్టి, ఒక చర్మ వైద్యుడు లేదా గైనకాలజిస్ట్ పైపూత చికిత్సలను (క్రీములు, జెల్‌లు) లేదా అవసరమైతే తగిన హార్మోన్ చికిత్సను సూచించవచ్చు.',
    alertTitle: 'స్వీయ చికిత్స వద్దు',
    alertText:
      'హార్మోన్ మొటిమలకు చికిత్సలను (పైపూత లేదా హార్మోన్) ఒక ఆరోగ్య నిపుణుడు సూచించి పర్యవేక్షించాలి, ముఖ్యంగా మీరు గర్భం దాల్చాలనుకుంటే.',
    h6Title: 'వైద్యుడిని ఎప్పుడు కలవాలి?',
    body6:
      'కొన్ని పరిస్థితుల్లో వైద్య సలహా ప్రత్యేకంగా సహాయపడుతుంది:',
    consultReasons: [
      'తగిన సంరక్షణ ఉన్నా కొనసాగే మొటిమలు',
      'నొప్పి కలిగించే లేదా లోతైన పొక్కులు (గడ్డలు, నీటి గడ్డలు)',
      'తీవ్రమైన లేదా వేగంగా మరింత దిగజారే మొటిమలు',
      'స్థిరపడుతున్న మచ్చలు లేదా వాతలు',
    ],
    h7Title: 'ముఖ్యాంశాలు',
    summaryTitle: 'ముఖ్యమైన అంశాలు',
    keyPoints: [
      'హార్మోన్ మొటిమలకు ఆండ్రోజెన్లతో ముడిపడిన, గుర్తించదగిన కారణం ఉంది.',
      'ఇది తరచుగా ముఖం కింది భాగాన్ని ప్రభావితం చేస్తుంది, మీ నెలసరికి ముందు మరింత దిగజారవచ్చు.',
      'ఇది పరిశుభ్రత లోపం కాదు, తప్పనిసరిగా జరిగేదీ కాదు.',
      'మృదువైన సంరక్షణ, అవసరమైతే తగిన చికిత్స దాన్ని మెరుగుపరచగలదు.',
      'అది కొనసాగితే ఒక చర్మ వైద్యుడు లేదా గైనకాలజిస్ట్ మీకు తోడ్పడగలరు.',
    ],
    finalNoteTitle: 'మరింత బాగా అర్థం చేసుకోవడానికి ఒక గైడ్',
    finalNoteText:
      'ఈ వ్యాసం సాధారణ సమాచారం కోసం మాత్రమే, వైద్య సంప్రదింపుకు ప్రత్యామ్నాయం కాదు. సందేహం ఉంటే లేదా లక్షణాలు కొనసాగితే, ఒక ఆరోగ్య నిపుణుడి సలహా పొందండి.',
    shareMessage: 'హార్మోన్ మొటిమలను అర్థం చేసుకోవడం — AWA',
  },
  mr: {
    badge: 'PCOS • हार्मोनल मुरूम',
    title: 'हार्मोनल मुरूम\nसमजून घेणे',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'शैक्षणिक मजकूर',
    intro:
      'PCOS मध्ये हार्मोनल मुरूम का येऊ शकतात, ते कसे ओळखावेत आणि ते सांभाळण्यास कोणते उपाय मदत करू शकतात.',
    introSecondary:
      'तो अनेक स्त्रियांना होतो आणि तो स्वच्छतेचा अभाव नाही किंवा अपरिहार्यही नाही: त्याचे मूळ समजून घेतल्याने तो अधिक चांगला सांभाळता येतो.',
    contentsTitle: 'या लेखात',
    topics: [
      'हार्मोनल मुरूम म्हणजे काय?',
      'PCOS मुळे मुरूम का येऊ शकतात?',
      'हार्मोनल मुरूम कसे ओळखावेत',
      'हार्मोनल मुरूम आणि मासिक पाळी',
      'काय मदत करू शकते',
      'डॉक्टरांना केव्हा भेटावे?',
      'मुख्य मुद्दे',
    ],
    h1: 'हार्मोनल मुरूम म्हणजे काय?',
    body1a:
      'हार्मोनल मुरूम हा मुरुमाचा असा प्रकार आहे जो हार्मोनल चढ-उतारांशी किंवा असंतुलनाशी, विशेषतः अँड्रोजेन्सशी, थेट जोडलेला असतो. पौगंडावस्थेतील अधिक ठरावीक मुरुमांच्या उलट, तो बहुतेकदा प्रौढ स्त्रियांना होतो आणि त्या काळानंतरही कायम राहू शकतो किंवा दिसू शकतो.',
    body1b:
      'त्याचे ठिकाण, त्याची खोली आणि नीट पाळलेल्या नियमित त्वचेच्या काळजीनंतरही त्याच जागी पुन्हा येण्याची प्रवृत्ती यामुळेही तो वेगळा ओळखला जातो.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text:
      'हार्मोनल मुरूम स्वच्छतेच्या अभावाशी जोडलेले नसतात: चेहरा जास्त वेळा धुतल्याने ते जात नाहीत आणि उलट त्वचेला जळजळ होऊ शकते.',
    h2Title: 'PCOS मुळे मुरूम का येऊ शकतात?',
    body2:
      'PCOS मध्ये, अँड्रोजेन्सचा सापेक्ष अतिरेक तेलग्रंथींना उत्तेजित करतो, ज्या मग अधिक तेल (सीबम) तयार करतात. काही त्वचा या हार्मोन्सना अधिक संवेदनशीलही असते, ज्यामुळे प्रयोगशाळेत मोजलेले मोठे असंतुलन नसतानाही मुरूम ठळक असू शकतात हे स्पष्ट होते.',
    neutralText:
      'हा इच्छाशक्तीचा प्रश्न नाही: ही संवेदनशीलता एका व्यक्तीपासून दुसऱ्या व्यक्तीपर्यंत बदलते आणि तुमच्या जीवनशैलीच्या सवयींवर अवलंबून नसते.',
    h3Title: 'हार्मोनल मुरूम कसे ओळखावेत',
    body3:
      'काही वैशिष्ट्ये वारंवार दिसतात, मात्र नेहमी नाही:',
    recognizeSigns: [
      'चेहऱ्याचा खालचा भाग: जबड्याची रेषा, हनुवटी',
      'अधिक खोल, कधी कधी वेदनादायी फोड',
      'बहुतेकदा त्याच जागी पुन्हा येतात',
      'लालसरपणा किंवा कायम राहणारे डाग',
    ],
    h4Title: 'हार्मोनल मुरूम आणि मासिक पाळी',
    body4:
      'हार्मोनल मुरूम पाळीभर कमी-जास्त होऊ शकतात. अनेक स्त्रियांना त्यांच्या पाळीच्या आधीच्या दिवसांत, जेव्हा प्रोजेस्टेरॉन वाढते आणि मग झपाट्याने कमी होते, तेव्हा मुरमांचा उद्रेक जाणवतो, जो तात्पुरते तेल निर्मितीला उत्तेजन देतो.',
    highlightTitle: 'तुमच्या उद्रेकांचा मागोवा',
    highlightText:
      'तुमच्या पाळीच्या संदर्भात फोड केव्हा येतात ते नोंदवल्याने तुम्हाला आणि तुमच्या त्वचारोगतज्ज्ञाला हार्मोनल संबंध अधिक चांगला समजण्यास मदत होऊ शकते.',
    h5Title: 'काय मदत करू शकते',
    body5a:
      'काळजीच्या काही साध्या सवयी उद्रेक मर्यादित करण्यास मदत करू शकतात, एकट्याने ते पूर्णपणे दूर न करता:',
    careHabits: [
      'सकाळी आणि संध्याकाळी तुमची त्वचा हळुवारपणे स्वच्छ करा',
      'तीव्र किंवा त्वचा कोरडी करणारी उत्पादने टाळा',
      'रोज तुमची त्वचा उन्हापासून वाचवा',
      'फोड दाबणे किंवा खुडणे टाळा',
    ],
    body5b:
      'परिस्थितीनुसार, त्वचारोगतज्ज्ञ किंवा स्त्रीरोगतज्ज्ञ बाह्य उपचार (क्रीम, जेल) किंवा, गरज असल्यास, योग्य हार्मोनल उपचार सुचवू शकतात.',
    alertTitle: 'स्वतःच औषध घेऊ नका',
    alertText:
      'हार्मोनल मुरुमांवरील उपचार (बाह्य किंवा हार्मोनल) आरोग्य व्यावसायिकाने लिहून दिलेले आणि देखरेखीखाली असले पाहिजेत, विशेषतः तुम्ही गर्भधारणेची अपेक्षा करत असाल तर.',
    h6Title: 'डॉक्टरांना केव्हा भेटावे?',
    body6:
      'काही परिस्थितींत वैद्यकीय सल्ला विशेष उपयुक्त असतो:',
    consultReasons: [
      'योग्य काळजी घेऊनही कायम राहणारे मुरूम',
      'वेदनादायी किंवा खोल फोड (गाठी, सिस्ट)',
      'तीव्र मुरूम किंवा झपाट्याने वाढणारे मुरूम',
      'स्थिर होत असलेले डाग किंवा व्रण',
    ],
    h7Title: 'मुख्य मुद्दे',
    summaryTitle: 'आवश्यक मुद्दे',
    keyPoints: [
      'हार्मोनल मुरुमांचे अँड्रोजेन्सशी जोडलेले ओळखता येणारे कारण असते.',
      'ते बहुतेकदा चेहऱ्याच्या खालच्या भागावर येतात आणि पाळीपूर्वी वाढू शकतात.',
      'ते स्वच्छतेचा अभाव नाही किंवा अपरिहार्यही नाही.',
      'हळुवार काळजी आणि, गरज असल्यास, योग्य उपचार त्यात सुधारणा करू शकतात.',
      'तो कायम राहिल्यास त्वचारोगतज्ज्ञ किंवा स्त्रीरोगतज्ज्ञ तुम्हाला साथ देऊ शकतात.',
    ],
    finalNoteTitle: 'अधिक चांगले समजण्यासाठी एक मार्गदर्शक',
    finalNoteText:
      'हा लेख फक्त सर्वसाधारण माहितीसाठी आहे आणि वैद्यकीय सल्लामसलतीची जागा घेत नाही. शंका असल्यास किंवा लक्षणे कायम राहिल्यास, आरोग्य व्यावसायिकाचा सल्ला घ्या.',
    shareMessage: 'हार्मोनल मुरूम समजून घेणे — AWA',
  },
  gu: {
    badge: 'PCOS • હોર્મોનલ ખીલ',
    title: 'હોર્મોનલ ખીલને\nસમજવા',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'શૈક્ષણિક સામગ્રી',
    intro:
      'PCOS સાથે હોર્મોનલ ખીલ કેમ દેખાઈ શકે છે, તેને કેવી રીતે ઓળખવા, અને તેને સંભાળવામાં કયા ઉપાયો મદદ કરી શકે છે.',
    introSecondary:
      'તે ઘણી સ્ત્રીઓને અસર કરે છે અને તે સ્વચ્છતાનો અભાવ નથી કે અનિવાર્ય પણ નથી: તેનું મૂળ સમજવાથી તેને વધુ સારી રીતે સંભાળી શકાય છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'હોર્મોનલ ખીલ શું છે?',
      'PCOS ખીલનું કારણ કેમ બની શકે છે?',
      'હોર્મોનલ ખીલ કેવી રીતે ઓળખવા',
      'હોર્મોનલ ખીલ અને માસિક ચક્ર',
      'શું મદદ કરી શકે',
      'ડૉક્ટરને ક્યારે મળવું?',
      'મુખ્ય મુદ્દા',
    ],
    h1: 'હોર્મોનલ ખીલ શું છે?',
    body1a:
      'હોર્મોનલ ખીલ એ ખીલનો એવો પ્રકાર છે જે હોર્મોનના ઉતાર-ચઢાવ કે અસંતુલન સાથે સીધો જોડાયેલો છે, ખાસ કરીને એન્ડ્રોજનમાં. કિશોરાવસ્થાના સામાન્ય ખીલથી વિપરીત, તે ઘણી વાર પુખ્ત સ્ત્રીઓને અસર કરે છે અને તે સમયગાળા પછી પણ ચાલુ રહી શકે છે અથવા દેખાઈ શકે છે.',
    body1b:
      'તે તેની જગ્યા, તેની ઊંડાઈ અને નિયમિત ત્વચા સંભાળ બરાબર કરવા છતાં એ જ જગ્યાએ ફરી દેખાવાની વૃત્તિથી પણ અલગ પડે છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text:
      'હોર્મોનલ ખીલ સ્વચ્છતાના અભાવ સાથે જોડાયેલા નથી: ચહેરો વધુ વાર ધોવાથી તે જતા નથી, અને ક્યારેક ત્વચામાં બળતરા પણ થઈ શકે છે.',
    h2Title: 'PCOS ખીલનું કારણ કેમ બની શકે છે?',
    body2:
      'PCOS માં એન્ડ્રોજનનો સાપેક્ષ વધારો તેલગ્રંથિઓને ઉત્તેજિત કરે છે, જે પછી વધુ તેલ બનાવે છે. કેટલીક ત્વચા આ હોર્મોન પ્રત્યે વધુ સંવેદનશીલ પણ હોય છે, જેથી પ્રયોગશાળામાં કોઈ મોટું અસંતુલન મપાયા વિના પણ ખીલ વધુ દેખાઈ શકે છે.',
    neutralText:
      'આ ઇચ્છાશક્તિનો પ્રશ્ન નથી: આ સંવેદનશીલતા વ્યક્તિએ વ્યક્તિએ અલગ હોય છે અને તમારી જીવનશૈલીની ટેવો પર આધાર રાખતી નથી.',
    h3Title: 'હોર્મોનલ ખીલ કેવી રીતે ઓળખવા',
    body3:
      'કેટલીક લાક્ષણિકતાઓ ઘણી વાર જોવા મળે છે, જોકે હંમેશાં નહીં:',
    recognizeSigns: [
      'ચહેરાનો નીચલો ભાગ: જડબાની રેખા, દાઢી',
      'વધુ ઊંડા, ક્યારેક દુખાવાવાળા ફોલ્લીઓ',
      'ઘણી વાર એ જ જગ્યાએ ફરી દેખાય છે',
      'લાલાશ અથવા ડાઘ જે રહી જાય છે',
    ],
    h4Title: 'હોર્મોનલ ખીલ અને માસિક ચક્ર',
    body4:
      'હોર્મોનલ ખીલ આખા ચક્ર દરમિયાન ઓછાવત્તા થઈ શકે છે. ઘણી સ્ત્રીઓ માસિક પહેલાંના દિવસોમાં વધારો નોંધે છે, જ્યારે પ્રોજેસ્ટેરોન વધે છે અને પછી અચાનક ઘટે છે, જે અસ્થાયી રીતે તેલના ઉત્પાદનને ઉત્તેજિત કરે છે.',
    highlightTitle: 'તમારા વધારાની નોંધ રાખો',
    highlightText:
      'તમારા ચક્રની સાપેક્ષે ફોલ્લીઓ ક્યારે દેખાય છે તે નોંધવાથી તમને અને તમારા ત્વચારોગ નિષ્ણાતને હોર્મોનનો સંબંધ વધુ સારી રીતે સમજવામાં મદદ મળી શકે છે.',
    h5Title: 'શું મદદ કરી શકે',
    body5a:
      'કેટલીક સરળ સંભાળની ટેવો ખીલના વધારાને મર્યાદિત કરવામાં મદદ કરી શકે છે, જોકે તે એકલી તેને પૂરેપૂરા દૂર કરતી નથી:',
    careHabits: [
      'સવાર-સાંજ ત્વચાને હળવેથી સાફ કરો',
      'કઠોર કે ત્વચાનું તેલ કાઢી નાખે તેવાં ઉત્પાદનો ટાળો',
      'રોજ ત્વચાને સૂર્યથી બચાવો',
      'ફોલ્લીઓને દબાવવાનું કે ખોતરવાનું ટાળો',
    ],
    body5b:
      'પરિસ્થિતિ પ્રમાણે, ત્વચારોગ નિષ્ણાત અથવા સ્ત્રીરોગ નિષ્ણાત ત્વચા પર લગાવવાની સારવાર (ક્રીમ, જેલ) અથવા જરૂર હોય તો યોગ્ય હોર્મોનલ સારવાર સૂચવી શકે છે.',
    alertTitle: 'જાતે દવા ન કરો',
    alertText:
      'હોર્મોનલ ખીલની સારવાર (ત્વચા પર લગાવવાની કે હોર્મોનલ) આરોગ્ય વ્યાવસાયિકે સૂચવેલી અને તેમની દેખરેખ હેઠળ હોવી જોઈએ, ખાસ કરીને જો તમે ગર્ભધારણની આશા રાખતા હો.',
    h6Title: 'ડૉક્ટરને ક્યારે મળવું?',
    body6:
      'કેટલીક પરિસ્થિતિઓમાં તબીબી સલાહ ખાસ મદદરૂપ થાય છે:',
    consultReasons: [
      'યોગ્ય સંભાળ છતાં ચાલુ રહેતા ખીલ',
      'દુખાવાવાળા કે ઊંડા ફોલ્લીઓ (ગાંઠ, સિસ્ટ)',
      'ગંભીર ખીલ અથવા ઝડપથી વધતા ખીલ',
      'કાયમી બની રહેલા ડાઘ કે નિશાન',
    ],
    h7Title: 'મુખ્ય મુદ્દા',
    summaryTitle: 'મુખ્ય બાબતો',
    keyPoints: [
      'હોર્મોનલ ખીલનું ઓળખી શકાય તેવું કારણ છે, જે એન્ડ્રોજન સાથે જોડાયેલું છે.',
      'તે ઘણી વાર ચહેરાના નીચલા ભાગને અસર કરે છે અને માસિક પહેલાં વધી શકે છે.',
      'તે સ્વચ્છતાનો અભાવ નથી કે અનિવાર્ય પણ નથી.',
      'હળવી સંભાળ અને જરૂર હોય તો યોગ્ય સારવાર તેમાં સુધારો લાવી શકે છે.',
      'જો તે ચાલુ રહે તો ત્વચારોગ નિષ્ણાત અથવા સ્ત્રીરોગ નિષ્ણાત તમને મદદ કરી શકે છે.',
    ],
    finalNoteTitle: 'વધુ સારી રીતે સમજવા માટે માર્ગદર્શિકા',
    finalNoteText:
      'આ લેખ માત્ર સામાન્ય માહિતી માટે છે અને તબીબી પરામર્શનું સ્થાન લેતો નથી. શંકા હોય અથવા લક્ષણો ચાલુ રહે તો આરોગ્ય વ્યાવસાયિક પાસેથી સલાહ લો.',
    shareMessage: 'હોર્મોનલ ખીલને સમજવા — AWA',
  },
  pa: {
    badge: 'PCOS • ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ',
    title: 'ਹਾਰਮੋਨੀ ਮੁਹਾਸਿਆਂ ਨੂੰ\nਸਮਝੋ',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਜਾਣਕਾਰੀ ਵਾਲੀ ਸਮੱਗਰੀ',
    intro:
      'PCOS ਨਾਲ ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਕਿਉਂ ਹੋ ਸਕਦੇ ਹਨ, ਇਨ੍ਹਾਂ ਨੂੰ ਕਿਵੇਂ ਪਛਾਣੀਏ, ਅਤੇ ਇਨ੍ਹਾਂ ਨੂੰ ਸੰਭਾਲਣ ਵਿੱਚ ਕਿਹੜੇ ਹੱਲ ਮਦਦ ਕਰ ਸਕਦੇ ਹਨ।',
    introSecondary:
      'ਇਹ ਬਹੁਤ ਸਾਰੀਆਂ ਔਰਤਾਂ ਨੂੰ ਹੁੰਦੇ ਹਨ ਅਤੇ ਨਾ ਇਹ ਸਫ਼ਾਈ ਦੀ ਘਾਟ ਹਨ ਅਤੇ ਨਾ ਹੀ ਕੋਈ ਮਜਬੂਰੀ: ਇਨ੍ਹਾਂ ਦੇ ਮੂਲ ਨੂੰ ਸਮਝਣਾ ਇਨ੍ਹਾਂ ਨੂੰ ਬਿਹਤਰ ਸੰਭਾਲਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਕੀ ਹਨ?',
      'PCOS ਨਾਲ ਮੁਹਾਸੇ ਕਿਉਂ ਹੋ ਸਕਦੇ ਹਨ?',
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸਿਆਂ ਨੂੰ ਕਿਵੇਂ ਪਛਾਣੀਏ',
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਅਤੇ ਮਾਹਵਾਰੀ ਚੱਕਰ',
      'ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ',
      'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲੀਏ?',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    h1: 'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਕੀ ਹਨ?',
    body1a:
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਮੁਹਾਸਿਆਂ ਦਾ ਇੱਕ ਰੂਪ ਹਨ ਜੋ ਸਿੱਧੇ ਤੌਰ \'ਤੇ ਹਾਰਮੋਨਾਂ ਦੇ ਉਤਰਾਅ-ਚੜ੍ਹਾਅ ਜਾਂ ਅਸੰਤੁਲਨ, ਖ਼ਾਸ ਕਰਕੇ ਐਂਡਰੋਜਨ ਵਿੱਚ, ਨਾਲ ਜੁੜੇ ਹੁੰਦੇ ਹਨ। ਲੜਕਪਨ ਦੇ ਆਮ ਮੁਹਾਸਿਆਂ ਤੋਂ ਵੱਖ, ਇਹ ਅਕਸਰ ਬਾਲਗ ਔਰਤਾਂ ਨੂੰ ਹੁੰਦੇ ਹਨ ਅਤੇ ਉਸ ਉਮਰ ਤੋਂ ਬਾਅਦ ਵੀ ਬਣੇ ਰਹਿ ਸਕਦੇ ਹਨ ਜਾਂ ਨਵੇਂ ਨਿਕਲ ਸਕਦੇ ਹਨ।',
    body1b:
      'ਇਨ੍ਹਾਂ ਦੀ ਪਛਾਣ ਇਨ੍ਹਾਂ ਦੀ ਥਾਂ, ਡੂੰਘਾਈ ਅਤੇ ਚਮੜੀ ਦੀ ਚੰਗੀ ਤਰ੍ਹਾਂ ਨਿਯਮਿਤ ਦੇਖਭਾਲ ਦੇ ਬਾਵਜੂਦ ਉਨ੍ਹਾਂ ਹੀ ਥਾਵਾਂ \'ਤੇ ਮੁੜ ਨਿਕਲਣ ਦੇ ਰੁਝਾਨ ਤੋਂ ਵੀ ਹੁੰਦੀ ਹੈ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text:
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਸਫ਼ਾਈ ਦੀ ਘਾਟ ਨਾਲ ਨਹੀਂ ਜੁੜੇ: ਚਿਹਰਾ ਵਾਰ-ਵਾਰ ਧੋਣ ਨਾਲ ਇਹ ਦੂਰ ਨਹੀਂ ਹੁੰਦੇ, ਸਗੋਂ ਚਮੜੀ ਨੂੰ ਜਲਣ ਹੋ ਸਕਦੀ ਹੈ।',
    h2Title: 'PCOS ਨਾਲ ਮੁਹਾਸੇ ਕਿਉਂ ਹੋ ਸਕਦੇ ਹਨ?',
    body2:
      'PCOS ਵਿੱਚ, ਐਂਡਰੋਜਨ ਦੀ ਸਾਪੇਖਿਕ ਵਾਧੂ ਮਾਤਰਾ ਤੇਲ ਪੈਦਾ ਕਰਨ ਵਾਲੀਆਂ ਗ੍ਰੰਥੀਆਂ ਨੂੰ ਉਤੇਜਿਤ ਕਰਦੀ ਹੈ, ਜੋ ਫਿਰ ਵਧੇਰੇ ਤੇਲ ਬਣਾਉਂਦੀਆਂ ਹਨ। ਕੁਝ ਲੋਕਾਂ ਦੀ ਚਮੜੀ ਇਨ੍ਹਾਂ ਹਾਰਮੋਨਾਂ ਪ੍ਰਤੀ ਵੱਧ ਸੰਵੇਦਨਸ਼ੀਲ ਵੀ ਹੁੰਦੀ ਹੈ, ਜਿਸ ਕਰਕੇ ਪ੍ਰਯੋਗਸ਼ਾਲਾ ਵਿੱਚ ਮਾਪੇ ਗਏ ਕਿਸੇ ਵੱਡੇ ਅਸੰਤੁਲਨ ਤੋਂ ਬਿਨਾਂ ਵੀ ਮੁਹਾਸੇ ਵਧੇਰੇ ਹੋ ਸਕਦੇ ਹਨ।',
    neutralText:
      'ਇਹ ਇੱਛਾ-ਸ਼ਕਤੀ ਦੀ ਗੱਲ ਨਹੀਂ: ਇਹ ਸੰਵੇਦਨਸ਼ੀਲਤਾ ਹਰ ਵਿਅਕਤੀ ਵਿੱਚ ਵੱਖਰੀ ਹੁੰਦੀ ਹੈ ਅਤੇ ਤੁਹਾਡੀ ਜੀਵਨ-ਸ਼ੈਲੀ ਦੀਆਂ ਆਦਤਾਂ \'ਤੇ ਨਿਰਭਰ ਨਹੀਂ ਕਰਦੀ।',
    h3Title: 'ਹਾਰਮੋਨੀ ਮੁਹਾਸਿਆਂ ਨੂੰ ਕਿਵੇਂ ਪਛਾਣੀਏ',
    body3:
      'ਕੁਝ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਅਕਸਰ ਦੁਹਰਾਈਆਂ ਜਾਂਦੀਆਂ ਹਨ, ਹਾਲਾਂਕਿ ਹਮੇਸ਼ਾ ਨਹੀਂ:',
    recognizeSigns: [
      'ਚਿਹਰੇ ਦਾ ਹੇਠਲਾ ਹਿੱਸਾ: ਜਬਾੜੇ ਦੀ ਲਕੀਰ, ਠੋਡੀ',
      'ਵਧੇਰੇ ਡੂੰਘੇ, ਕਈ ਵਾਰ ਦਰਦ ਵਾਲੇ ਦਾਣੇ',
      'ਅਕਸਰ ਉਨ੍ਹਾਂ ਹੀ ਥਾਵਾਂ \'ਤੇ ਮੁੜ ਨਿਕਲਦੇ ਹਨ',
      'ਲਾਲੀ ਜਾਂ ਨਿਸ਼ਾਨ ਜੋ ਬਣੇ ਰਹਿੰਦੇ ਹਨ',
    ],
    h4Title: 'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਅਤੇ ਮਾਹਵਾਰੀ ਚੱਕਰ',
    body4:
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸੇ ਪੂਰੇ ਚੱਕਰ ਦੌਰਾਨ ਘਟ-ਵਧ ਸਕਦੇ ਹਨ। ਬਹੁਤ ਸਾਰੀਆਂ ਔਰਤਾਂ ਮਾਹਵਾਰੀ ਤੋਂ ਕੁਝ ਦਿਨ ਪਹਿਲਾਂ ਮੁਹਾਸਿਆਂ ਦਾ ਭੜਕਣਾ ਦੇਖਦੀਆਂ ਹਨ, ਜਦੋਂ ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਵਧਦਾ ਹੈ ਅਤੇ ਫਿਰ ਤੇਜ਼ੀ ਨਾਲ ਡਿੱਗਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਤੇਲ ਦਾ ਉਤਪਾਦਨ ਅਸਥਾਈ ਤੌਰ \'ਤੇ ਵਧ ਜਾਂਦਾ ਹੈ।',
    highlightTitle: 'ਆਪਣੇ ਭੜਕਣ ਦਾ ਰਿਕਾਰਡ ਰੱਖੋ',
    highlightText:
      'ਇਹ ਲਿਖਣਾ ਕਿ ਮੁਹਾਸੇ ਤੁਹਾਡੇ ਚੱਕਰ ਦੇ ਸਾਪੇਖ ਕਦੋਂ ਨਿਕਲਦੇ ਹਨ, ਤੁਹਾਨੂੰ ਅਤੇ ਤੁਹਾਡੇ ਚਮੜੀ ਰੋਗ ਮਾਹਿਰ ਨੂੰ ਹਾਰਮੋਨੀ ਸਬੰਧ ਬਿਹਤਰ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    h5Title: 'ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ',
    body5a:
      'ਦੇਖਭਾਲ ਦੀਆਂ ਕੁਝ ਸਰਲ ਆਦਤਾਂ ਭੜਕਣ ਨੂੰ ਸੀਮਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀਆਂ ਹਨ, ਹਾਲਾਂਕਿ ਇਕੱਲੀਆਂ ਇਨ੍ਹਾਂ ਨੂੰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਖ਼ਤਮ ਨਹੀਂ ਕਰਦੀਆਂ:',
    careHabits: [
      'ਸਵੇਰੇ ਅਤੇ ਸ਼ਾਮ ਨੂੰ ਆਪਣੀ ਚਮੜੀ ਨੂੰ ਕੋਮਲਤਾ ਨਾਲ ਸਾਫ਼ ਕਰੋ',
      'ਕਠੋਰ ਜਾਂ ਚਮੜੀ ਨੂੰ ਖੁਸ਼ਕ ਕਰਨ ਵਾਲੇ ਉਤਪਾਦਾਂ ਤੋਂ ਬਚੋ',
      'ਰੋਜ਼ ਆਪਣੀ ਚਮੜੀ ਨੂੰ ਧੁੱਪ ਤੋਂ ਬਚਾਓ',
      'ਦਾਣਿਆਂ ਨੂੰ ਦਬਾਉਣ ਜਾਂ ਨੋਚਣ ਤੋਂ ਬਚੋ',
    ],
    body5b:
      'ਸਥਿਤੀ ਮੁਤਾਬਕ, ਚਮੜੀ ਰੋਗ ਮਾਹਿਰ ਜਾਂ ਇਸਤਰੀ ਰੋਗ ਮਾਹਿਰ ਲਗਾਉਣ ਵਾਲੇ ਇਲਾਜ (ਕਰੀਮਾਂ, ਜੈੱਲ) ਜਾਂ, ਲੋੜ ਪੈਣ \'ਤੇ, ਕੋਈ ਢੁਕਵਾਂ ਹਾਰਮੋਨੀ ਇਲਾਜ ਸੁਝਾ ਸਕਦੇ ਹਨ।',
    alertTitle: 'ਆਪਣੇ-ਆਪ ਦਵਾਈ ਨਾ ਲਓ',
    alertText:
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸਿਆਂ ਦੇ ਇਲਾਜ (ਲਗਾਉਣ ਵਾਲੇ ਜਾਂ ਹਾਰਮੋਨੀ) ਸਿਹਤ ਮਾਹਿਰ ਵੱਲੋਂ ਲਿਖੇ ਅਤੇ ਨਿਗਰਾਨੀ ਹੇਠ ਹੋਣੇ ਚਾਹੀਦੇ ਹਨ, ਖ਼ਾਸ ਕਰਕੇ ਜੇ ਤੁਸੀਂ ਗਰਭ ਧਾਰਨ ਦੀ ਆਸ ਰੱਖਦੇ ਹੋ।',
    h6Title: 'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲੀਏ?',
    body6:
      'ਡਾਕਟਰੀ ਸਲਾਹ ਕੁਝ ਸਥਿਤੀਆਂ ਵਿੱਚ ਖ਼ਾਸ ਤੌਰ \'ਤੇ ਮਦਦਗਾਰ ਹੁੰਦੀ ਹੈ:',
    consultReasons: [
      'ਢੁਕਵੀਂ ਦੇਖਭਾਲ ਦੇ ਬਾਵਜੂਦ ਬਣੇ ਰਹਿਣ ਵਾਲੇ ਮੁਹਾਸੇ',
      'ਦਰਦ ਵਾਲੇ ਜਾਂ ਡੂੰਘੇ ਦਾਣੇ (ਗੰਢਾਂ, ਗਿਲਟੀਆਂ)',
      'ਗੰਭੀਰ ਮੁਹਾਸੇ ਜਾਂ ਜੋ ਤੇਜ਼ੀ ਨਾਲ ਵਿਗੜ ਰਹੇ ਹੋਣ',
      'ਨਿਸ਼ਾਨ ਜਾਂ ਦਾਗ਼ ਜੋ ਪੱਕੇ ਹੋ ਰਹੇ ਹੋਣ',
    ],
    h7Title: 'ਮੁੱਖ ਨੁਕਤੇ',
    summaryTitle: 'ਜ਼ਰੂਰੀ ਗੱਲਾਂ',
    keyPoints: [
      'ਹਾਰਮੋਨੀ ਮੁਹਾਸਿਆਂ ਦਾ ਇੱਕ ਪਛਾਣਨ ਯੋਗ ਕਾਰਨ ਹੈ, ਜੋ ਐਂਡਰੋਜਨ ਨਾਲ ਜੁੜਿਆ ਹੈ।',
      'ਇਹ ਅਕਸਰ ਚਿਹਰੇ ਦੇ ਹੇਠਲੇ ਹਿੱਸੇ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰਦੇ ਹਨ ਅਤੇ ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਵਿਗੜ ਸਕਦੇ ਹਨ।',
      'ਇਹ ਨਾ ਸਫ਼ਾਈ ਦੀ ਘਾਟ ਹਨ ਅਤੇ ਨਾ ਹੀ ਕੋਈ ਮਜਬੂਰੀ।',
      'ਕੋਮਲ ਦੇਖਭਾਲ ਅਤੇ, ਲੋੜ ਪੈਣ \'ਤੇ, ਢੁਕਵਾਂ ਇਲਾਜ ਇਨ੍ਹਾਂ ਨੂੰ ਸੁਧਾਰ ਸਕਦਾ ਹੈ।',
      'ਜੇ ਇਹ ਬਣੇ ਰਹਿਣ ਤਾਂ ਚਮੜੀ ਰੋਗ ਮਾਹਿਰ ਜਾਂ ਇਸਤਰੀ ਰੋਗ ਮਾਹਿਰ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    ],
    finalNoteTitle: 'ਬਿਹਤਰ ਸਮਝ ਲਈ ਇੱਕ ਗਾਈਡ',
    finalNoteText:
      'ਇਹ ਲੇਖ ਸਿਰਫ਼ ਆਮ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਡਾਕਟਰੀ ਸਲਾਹ-ਮਸ਼ਵਰੇ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਸ਼ੱਕ ਹੋਵੇ ਜਾਂ ਲੱਛਣ ਬਣੇ ਰਹਿਣ ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਤੋਂ ਸਲਾਹ ਲਓ।',
    shareMessage: 'ਹਾਰਮੋਨੀ ਮੁਹਾਸਿਆਂ ਨੂੰ ਸਮਝੋ — AWA',
  },
  my: {
    badge: 'PCOS • ဟော်မုန်းဝက်ခြံ',
    title: 'ဟော်မုန်းဝက်ခြံကို\nနားလည်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပညာပေးအကြောင်းအရာ',
    intro:
      'PCOS ရှိသူတွင် ဟော်မုန်းဝက်ခြံ အဘယ်ကြောင့် ပေါ်လာနိုင်သည်၊ ၎င်းကို မည်သို့သိနိုင်သည်၊ စီမံရာတွင် မည်သည့်ဖြေရှင်းနည်းများ အထောက်အကူဖြစ်နိုင်သည်ကို ဖော်ပြထားသည်။',
    introSecondary:
      'ဤပြဿနာသည် အမျိုးသမီးများစွာကို ထိခိုက်သည်၊ သန့်ရှင်းမှုမရှိခြင်းလည်း မဟုတ်၊ ရှောင်လွှဲမရသော အရာလည်း မဟုတ်ပါ။ ၎င်း၏ မူလအကြောင်းရင်းကို နားလည်ခြင်းက ပိုမိုကောင်းစွာ စီမံနိုင်ရန် ကူညီသည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ဟော်မုန်းဝက်ခြံဆိုသည်မှာ အဘယ်နည်း။',
      'PCOS က ဝက်ခြံကို အဘယ်ကြောင့် ဖြစ်စေနိုင်သနည်း။',
      'ဟော်မုန်းဝက်ခြံကို မည်သို့သိနိုင်သနည်း',
      'ဟော်မုန်းဝက်ခြံနှင့် ရာသီစက်ဝန်း',
      'ကူညီနိုင်သည့်အရာများ',
      'ဆရာဝန်နှင့် မည်သည့်အချိန် ပြသသင့်သနည်း။',
      'အဓိကအချက်များ',
    ],
    h1: 'ဟော်မုန်းဝက်ခြံဆိုသည်မှာ အဘယ်နည်း။',
    body1a:
      'ဟော်မုန်းဝက်ခြံသည် ဟော်မုန်းအတက်အကျ သို့မဟုတ် အထူးသဖြင့် အန်ဒရိုဂျင် မညီမျှမှုနှင့် တိုက်ရိုက်ဆက်စပ်သော ဝက်ခြံပုံစံတစ်ခု ဖြစ်သည်။ ဆယ်ကျော်သက်ကာလ၏ ပိုမိုသာမန်ဖြစ်သော ဝက်ခြံနှင့် မတူဘဲ ၎င်းသည် အရွယ်ရောက်ပြီးသော အမျိုးသမီးများကို မကြာခဏ ထိခိုက်ပြီး ထိုကာလပြီးနောက်တွင်လည်း ဆက်ရှိနေနိုင်သည် သို့မဟုတ် ပေါ်လာနိုင်သည်။',
    body1b:
      'ထို့အပြင် ပေါ်သည့်နေရာ၊ နက်ရှိုင်းမှုနှင့် ပုံမှန်အသားအရေစောင့်ရှောက်မှုကို ကောင်းစွာလိုက်နာသော်လည်း တူညီသည့်နေရာများတွင် ပြန်ပေါ်လာလေ့ရှိမှုတို့ဖြင့် ကွဲပြားသည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text:
      'ဟော်မုန်းဝက်ခြံသည် သန့်ရှင်းမှု မရှိခြင်းနှင့် မသက်ဆိုင်ပါ။ မျက်နှာကို ပိုမကြာခဏ ဆေးခြင်းဖြင့် မပျောက်သွားသည့်အပြင် အသားအရေကို ယားယံရှစ်ရောင်စေနိုင်သည်။',
    h2Title: 'PCOS က ဝက်ခြံကို အဘယ်ကြောင့် ဖြစ်စေနိုင်သနည်း။',
    body2:
      'PCOS တွင် အန်ဒရိုဂျင် အနည်းငယ် ပိုလွန်နေခြင်းက အဆီထွက်ဂလင်းများကို လှုံ့ဆော်ပေးပြီး အဆီ ပိုထွက်စေသည်။ အချို့သော အသားအရေသည် ဤဟော်မုန်းများကို ပိုမိုထိခိုက်လွယ်ပြီး ဓာတ်ခွဲခန်းတွင် တိုင်းတာသော ကြီးမားသည့် မညီမျှမှု မရှိသော်လည်း ဝက်ခြံ သိသာထင်ရှားနိုင်ရခြင်းကို ရှင်းပြသည်။',
    neutralText:
      'ဤသည်မှာ ဆန္ဒစွမ်းအားနှင့် ပတ်သက်သော ကိစ္စမဟုတ်ပါ။ ဤထိခိုက်လွယ်မှုသည် လူတစ်ဦးနှင့်တစ်ဦး ကွဲပြားပြီး သင့်နေထိုင်မှုအလေ့အထများအပေါ် မမူတည်ပါ။',
    h3Title: 'ဟော်မုန်းဝက်ခြံကို မည်သို့သိနိုင်သနည်း',
    body3:
      'အချို့လက္ခဏာများသည် အမြဲတမ်းမဟုတ်သော်လည်း မကြာခဏ ထပ်ခါထပ်ခါ တွေ့ရတတ်သည်။',
    recognizeSigns: [
      'မျက်နှာအောက်ပိုင်း၊ မေးရိုးနှင့် မေးစေ့',
      'ပိုနက်ပြီး တခါတရံ နာကျင်သော အဖု အပိမ့်များ',
      'တူညီသည့်နေရာများတွင် မကြာခဏ ပြန်ပေါ်ခြင်း',
      'ဆက်ရှိနေသော အနီစက်များ သို့မဟုတ် အမှတ်အသားများ',
    ],
    h4Title: 'ဟော်မုန်းဝက်ခြံနှင့် ရာသီစက်ဝန်း',
    body4:
      'ဟော်မုန်းဝက်ခြံသည် ရာသီစက်ဝန်းတစ်လျှောက် အတက်အကျ ဖြစ်နိုင်သည်။ အမျိုးသမီးများစွာသည် ရာသီမလာမီ ရက်များတွင် ပရိုဂျက်စတီရုန်း တက်လာပြီး ထို့နောက် သိသိသာသာ ကျဆင်းသောအခါ အဆီထွက်မှုကို ယာယီလှုံ့ဆော်ကာ ဝက်ခြံ ပိုထွက်လာသည်ကို သတိပြုမိကြသည်။',
    highlightTitle: 'သင့်ဝက်ခြံပေါ်ချိန်များကို မှတ်တမ်းတင်ခြင်း',
    highlightText:
      'ဝက်ခြံများ ပေါ်လာသည့်အချိန်ကို သင့်ရာသီစက်ဝန်းနှင့် နှိုင်းယှဉ်၍ မှတ်ထားခြင်းက သင်နှင့် သင့်အရေပြားအထူးကုဆရာဝန်အား ဟော်မုန်းနှင့် ဆက်စပ်မှုကို ပိုမိုနားလည်ရန် ကူညီနိုင်သည်။',
    h5Title: 'ကူညီနိုင်သည့်အရာများ',
    body5a:
      'ရိုးရှင်းသော အသားအရေစောင့်ရှောက်မှု အလေ့အထအချို့သည် ဝက်ခြံပေါ်ခြင်းကို လျှော့ချရာတွင် ကူညီနိုင်သော်လည်း ၎င်းတို့ကိုယ်တိုင်ဖြင့် လုံးဝ မပျောက်စေနိုင်ပါ။',
    careHabits: [
      'နံနက်နှင့်ညနေ အသားအရေကို ညင်သာစွာ သန့်စင်ပါ',
      'ပြင်းထန်သော သို့မဟုတ် အရေပြားခြောက်သွေ့စေသော ထုတ်ကုန်များကို ရှောင်ပါ',
      'နေ့စဉ် နေရောင်ခြည်မှ အရေပြားကို ကာကွယ်ပါ',
      'ဝက်ခြံများကို ညှစ်ခြင်း သို့မဟုတ် ခြစ်ခြင်းကို ရှောင်ပါ',
    ],
    body5b:
      'အခြေအနေပေါ်မူတည်၍ အရေပြားအထူးကုဆရာဝန် သို့မဟုတ် သားဖွားမီးယပ်အထူးကုက အပေါ်ယံသုံး ကုသမှုများ (ခရင်မ်၊ ဂျယ်လ်) သို့မဟုတ် လိုအပ်ပါက သင့်လျော်သော ဟော်မုန်းကုသမှုကို အကြံပြုနိုင်သည်။',
    alertTitle: 'ကိုယ်တိုင်ဆေးမကုပါနှင့်',
    alertText:
      'ဟော်မုန်းဝက်ခြံအတွက် ကုသမှုများ (အပေါ်ယံသုံး သို့မဟုတ် ဟော်မုန်း) ကို ကျန်းမာရေးပညာရှင်က ညွှန်းဆိုပြီး စောင့်ကြည့်ရမည်။ အထူးသဖြင့် သန္ဓေတည်ရန် မျှော်လင့်ထားပါက ဖြစ်သည်။',
    h6Title: 'ဆရာဝန်နှင့် မည်သည့်အချိန် ပြသသင့်သနည်း။',
    body6:
      'အချို့အခြေအနေများတွင် ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်သည် အထူးအထောက်အကူဖြစ်သည်။',
    consultReasons: [
      'သင့်လျော်သော စောင့်ရှောက်မှုရှိသော်လည်း ဆက်ရှိနေသည့် ဝက်ခြံ',
      'နာကျင်သော သို့မဟုတ် နက်ရှိုင်းသော ဝက်ခြံအဖုများ (အဖုအကျိတ်၊ အိတ်ကလေး)',
      'ပြင်းထန်သော ဝက်ခြံ သို့မဟုတ် လျင်မြန်စွာ ဆိုးရွားလာသော ဝက်ခြံ',
      'အမှတ်အသားများ သို့မဟုတ် အမာရွတ်များ တည်ငြိမ်လာခြင်း',
    ],
    h7Title: 'အဓိကအချက်များ',
    summaryTitle: 'အဓိကအချက်များ',
    keyPoints: [
      'ဟော်မုန်းဝက်ခြံတွင် အန်ဒရိုဂျင်နှင့် ဆက်စပ်သော သိရှိနိုင်သည့် အကြောင်းရင်း ရှိသည်။',
      'ဤဝက်ခြံသည် မျက်နှာအောက်ပိုင်းကို မကြာခဏ ထိခိုက်ပြီး ရာသီမလာမီ ပိုဆိုးလာနိုင်သည်။',
      'ဤဝက်ခြံသည် သန့်ရှင်းမှုမရှိခြင်းလည်း မဟုတ်၊ ရှောင်လွှဲမရသောအရာလည်း မဟုတ်ပါ။',
      'ညင်သာသော စောင့်ရှောက်မှုနှင့် လိုအပ်ပါက သင့်လျော်သော ကုသမှုက တိုးတက်စေနိုင်သည်။',
      'ဆက်ရှိနေပါက အရေပြားအထူးကုဆရာဝန် သို့မဟုတ် သားဖွားမီးယပ်အထူးကုက ကူညီပေးနိုင်သည်။',
    ],
    finalNoteTitle: 'ပိုမိုနားလည်စေရန် လမ်းညွှန်ချက်',
    finalNoteText:
      'ဤဆောင်းပါးသည် ယေဘုယျအချက်အလက်ပေးရန်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ ပြသမှုကို အစားထိုးခြင်းမရှိပါ။ သံသယရှိပါက သို့မဟုတ် လက္ခဏာများ ဆက်ရှိနေပါက ကျန်းမာရေးပညာရှင်ထံ အကြံဉာဏ်တောင်းပါ။',
    shareMessage: 'ဟော်မုန်းဝက်ခြံကို နားလည်ခြင်း — AWA',
  },
  km: {
    badge: 'PCOS • មុនអរម៉ូន',
    title: 'ការយល់ដឹងអំពី\nមុនអរម៉ូន',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាអប់រំ',
    intro:
      'ហេតុអ្វីមុនអរម៉ូនអាចលេចឡើងជាមួយ PCOS របៀបសម្គាល់វា និងដំណោះស្រាយអ្វីខ្លះដែលអាចជួយគ្រប់គ្រងវា។',
    introSecondary:
      'វាប៉ះពាល់ស្ត្រីជាច្រើន ហើយមិនមែនជាការខ្វះអនាម័យ ឬជៀសមិនរួចនោះទេ៖ ការយល់ដឹងអំពីប្រភពរបស់វាជួយគ្រប់គ្រងវាបានប្រសើរជាង។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'តើមុនអរម៉ូនជាអ្វី?',
      'ហេតុអ្វី PCOS អាចបណ្តាលឱ្យមានមុន?',
      'របៀបសម្គាល់មុនអរម៉ូន',
      'មុនអរម៉ូន និងវដ្តរដូវ',
      'អ្វីដែលអាចជួយបាន',
      'ពេលណាគួរជួបវេជ្ជបណ្ឌិត?',
      'ចំណុចសំខាន់ៗ',
    ],
    h1: 'តើមុនអរម៉ូនជាអ្វី?',
    body1a:
      'មុនអរម៉ូនគឺជាទម្រង់មុនដែលទាក់ទងដោយផ្ទាល់នឹងការប្រែប្រួលអរម៉ូន ឬភាពមិនស្មើគ្នា ជាពិសេសនៃអង់ដ្រូហ្សែន។ មិនដូចមុនធម្មតាជាងនៃវ័យជំទង់ទេ វាជាញឹកញាប់ប៉ះពាល់ស្ត្រីពេញវ័យ ហើយអាចនៅបន្ត ឬលេចឡើងក្រោយអំឡុងពេលនោះ។',
    body1b:
      'វាក៏ត្រូវបានសម្គាល់ដោយទីតាំងរបស់វា ជម្រៅរបស់វា និងទំនោរនៃការលេចឡើងម្តងទៀតនៅកន្លែងដដែល ទោះបីជាមានការថែរក្សាស្បែកទៀងទាត់ដែលអនុវត្តបានល្អក៏ដោយ។',
    tip1Title: 'គួរដឹង',
    tip1Text:
      'មុនអរម៉ូនមិនទាក់ទងនឹងការខ្វះអនាម័យទេ៖ ការលាងមុខញឹកញាប់ជាងមុនមិនធ្វើឱ្យវាបាត់ទេ ហើយថែមទាំងអាចធ្វើឱ្យស្បែករលាក។',
    h2Title: 'ហេតុអ្វី PCOS អាចបណ្តាលឱ្យមានមុន?',
    body2:
      'ក្នុង PCOS អង់ដ្រូហ្សែនលើសដោយប្រៀបធៀប ជំរុញក្រពេញខ្លាញ់ ដែលបន្ទាប់មកផលិតខ្លាញ់ស្បែកកាន់តែច្រើន។ ស្បែកខ្លះក៏រងឥទ្ធិពលខ្លាំងជាងចំពោះអរម៉ូនទាំងនេះ ដែលពន្យល់ថាហេតុអ្វីមុនអាចលេចធ្លោ សូម្បីតែគ្មានភាពមិនស្មើគ្នាធំដែលវាស់បានក្នុងមន្ទីរពិសោធន៍។',
    neutralText:
      'នេះមិនមែនជាបញ្ហានៃឆន្ទៈទេ៖ ភាពរងឥទ្ធិពលនេះប្រែប្រួលពីមនុស្សម្នាក់ទៅម្នាក់ ហើយមិនអាស្រ័យលើទម្លាប់រស់នៅរបស់អ្នកទេ។',
    h3Title: 'របៀបសម្គាល់មុនអរម៉ូន',
    body3:
      'លក្ខណៈមួយចំនួនកើតឡើងម្តងទៀតជាញឹកញាប់ ទោះបីមិនតែងតែក៏ដោយ៖',
    recognizeSigns: [
      'ផ្នែកខាងក្រោមនៃមុខ៖ បន្ទាត់ថ្គាម, ចង្កា',
      'មុនដុះជ្រៅជាង ជួនកាលឈឺ',
      'ជាញឹកញាប់លេចឡើងម្តងទៀតនៅកន្លែងដដែល',
      'ក្រហម ឬស្នាមដែលនៅជាប់យូរ',
    ],
    h4Title: 'មុនអរម៉ូន និងវដ្តរដូវ',
    body4:
      'មុនអរម៉ូនអាចប្រែប្រួលពេញមួយវដ្តរដូវ។ ស្ត្រីជាច្រើនកត់សម្គាល់ឃើញការផ្ទុះឡើងក្នុងរយៈពេលពីរបីថ្ងៃមុនរដូវ ពេលប្រូសេស្តេរ៉ូនកើនឡើង ហើយបន្ទាប់មកធ្លាក់ចុះយ៉ាងខ្លាំង ដែលជំរុញការផលិតខ្លាញ់ស្បែកជាបណ្តោះអាសន្ន។',
    highlightTitle: 'ការតាមដានការផ្ទុះមុនរបស់អ្នក',
    highlightText:
      'ការកត់ត្រាពេលដែលមុនលេចឡើងធៀបនឹងវដ្តរដូវរបស់អ្នក អាចជួយអ្នក និងគ្រូពេទ្យឯកទេសស្បែករបស់អ្នកឱ្យយល់ពីទំនាក់ទំនងអរម៉ូនបានប្រសើរជាង។',
    h5Title: 'អ្វីដែលអាចជួយបាន',
    body5a:
      'ទម្លាប់ថែរក្សាងាយៗមួយចំនួនអាចជួយកំណត់ការផ្ទុះមុន ដោយមិនបំបាត់វាទាំងស្រុងដោយខ្លួនឯង៖',
    careHabits: [
      'លាងសម្អាតស្បែកដោយថ្នមៗ ព្រឹក និងល្ងាច',
      'ជៀសវាងផលិតផលខ្លាំង ឬដែលធ្វើឱ្យស្បែកស្ងួត',
      'ការពារស្បែកពីព្រះអាទិត្យជារៀងរាល់ថ្ងៃ',
      'ជៀសវាងការច្របាច់ ឬកោសមុន',
    ],
    body5b:
      'អាស្រ័យលើស្ថានភាព គ្រូពេទ្យឯកទេសស្បែក ឬគ្រូពេទ្យឯកទេសស្ត្រី អាចណែនាំការព្យាបាលលើស្បែក (ក្រែម ជែល) ឬប្រសិនបើចាំបាច់ ការព្យាបាលដោយអរម៉ូនដែលស័ក្តិសម។',
    alertTitle: 'កុំព្យាបាលខ្លួនឯង',
    alertText:
      'ការព្យាបាលមុនអរម៉ូន (លើស្បែក ឬអរម៉ូន) ត្រូវតែត្រូវបានចេញវេជ្ជបញ្ជា និងតាមដានដោយអ្នកជំនាញសុខាភិបាល ជាពិសេសប្រសិនបើអ្នកសង្ឃឹមថានឹងមានផ្ទៃពោះ។',
    h6Title: 'ពេលណាគួរជួបវេជ្ជបណ្ឌិត?',
    body6:
      'ដំបូន្មានផ្នែកវេជ្ជសាស្ត្រមានប្រយោជន៍ជាពិសេសក្នុងស្ថានភាពមួយចំនួន៖',
    consultReasons: [
      'មុនដែលនៅបន្ត ទោះបីមានការថែរក្សាសមស្រប',
      'មុនឈឺ ឬជ្រៅ (ដុំ គ្រុំ)',
      'មុនធ្ងន់ធ្ងរ ឬកាន់តែអាក្រក់ឡើងយ៉ាងឆាប់រហ័ស',
      'ស្នាម ឬស្លាកស្នាមដែលចាប់ផ្តើមនៅជាប់',
    ],
    h7Title: 'ចំណុចសំខាន់ៗ',
    summaryTitle: 'ចំណុចសំខាន់ៗ',
    keyPoints: [
      'មុនអរម៉ូនមានមូលហេតុដែលអាចកំណត់បាន ទាក់ទងនឹងអង់ដ្រូហ្សែន។',
      'វាជាញឹកញាប់ប៉ះពាល់ផ្នែកខាងក្រោមនៃមុខ ហើយអាចកាន់តែអាក្រក់មុនរដូវ។',
      'វាមិនមែនជាការខ្វះអនាម័យ ឬជៀសមិនរួចនោះទេ។',
      'ការថែរក្សាដោយថ្នមៗ និងប្រសិនបើចាំបាច់ ការព្យាបាលដែលស័ក្តិសម អាចធ្វើឱ្យប្រសើរឡើង។',
      'គ្រូពេទ្យឯកទេសស្បែក ឬគ្រូពេទ្យឯកទេសស្ត្រី អាចគាំទ្រអ្នក ប្រសិនបើវានៅបន្ត។',
    ],
    finalNoteTitle: 'មគ្គុទ្ទេសក៍ដើម្បីយល់កាន់តែច្បាស់',
    finalNoteText:
      'អត្ថបទនេះសម្រាប់ព័ត៌មានទូទៅប៉ុណ្ណោះ ហើយមិនជំនួសការពិគ្រោះផ្នែកវេជ្ជសាស្ត្រទេ។ ប្រសិនបើមានការសង្ស័យ ឬរោគសញ្ញានៅបន្ត សូមស្វែងរកដំបូន្មានពីអ្នកជំនាញសុខាភិបាល។',
    shareMessage: 'ការយល់ដឹងអំពីមុនអរម៉ូន — AWA',
  },
  lo: {
    badge: 'PCOS • ສິວຈາກຮໍໂມນ',
    title: 'ເຂົ້າໃຈ\nສິວຈາກຮໍໂມນ',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາເພື່ອການສຶກສາ',
    intro:
      'ເປັນຫຍັງສິວຈາກຮໍໂມນຈຶ່ງອາດເກີດຂຶ້ນກັບ PCOS, ວິທີສັງເກດ ແລະ ວິທີແກ້ໄຂໃດທີ່ອາດຊ່ວຍຈັດການມັນ.',
    introSecondary:
      'ມັນເກີດກັບຜູ້ຍິງຫຼາຍຄົນ ແລະ ບໍ່ແມ່ນຍ້ອນຂາດຄວາມສະອາດ ແລະ ບໍ່ແມ່ນສິ່ງທີ່ຫຼີກບໍ່ໄດ້: ການເຂົ້າໃຈຕົ້ນເຫດຂອງມັນຊ່ວຍໃຫ້ຈັດການໄດ້ດີຂຶ້ນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ສິວຈາກຮໍໂມນແມ່ນຫຍັງ?',
      'ເປັນຫຍັງ PCOS ຈຶ່ງອາດເຮັດໃຫ້ເກີດສິວ?',
      'ວິທີສັງເກດສິວຈາກຮໍໂມນ',
      'ສິວຈາກຮໍໂມນ ແລະ ຮອບເດືອນ',
      'ສິ່ງທີ່ອາດຊ່ວຍໄດ້',
      'ເວລາໃດຄວນພົບແພດ?',
      'ຈຸດສຳຄັນ',
    ],
    h1: 'ສິວຈາກຮໍໂມນແມ່ນຫຍັງ?',
    body1a:
      'ສິວຈາກຮໍໂມນແມ່ນສິວຮູບແບບໜຶ່ງທີ່ກ່ຽວຂ້ອງໂດຍກົງກັບການຜັນຜວນ ຫຼື ຄວາມບໍ່ສົມດຸນຂອງຮໍໂມນ ໂດຍສະເພາະແອນໂດຣເຈັນ. ຕ່າງຈາກສິວທີ່ພົບທົ່ວໄປໃນໄວລຸ້ນ ມັນມັກເກີດກັບຜູ້ຍິງຜູ້ໃຫຍ່ ແລະ ອາດຄົງຢູ່ ຫຼື ປາກົດຂຶ້ນຫຼັງໄວນັ້ນ.',
    body1b:
      'ມັນຍັງມີລັກສະນະເດັ່ນຄືຕຳແໜ່ງ, ຄວາມເລິກ ແລະ ແນວໂນ້ມທີ່ຈະກັບມາເກີດຊ້ຳບ່ອນເກົ່າ ເຖິງແມ່ນຈະດູແລຜິວຢ່າງສະໝ່ຳສະເໝີແລ້ວກໍຕາມ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text:
      'ສິວຈາກຮໍໂມນບໍ່ກ່ຽວກັບການຂາດຄວາມສະອາດ: ການລ້າງໜ້າຖີ່ຂຶ້ນບໍ່ໄດ້ເຮັດໃຫ້ມັນຫາຍໄປ ແລະ ອາດເຮັດໃຫ້ຜິວລະຄາຍເຄືອງດ້ວຍຊ້ຳ.',
    h2Title: 'ເປັນຫຍັງ PCOS ຈຶ່ງອາດເຮັດໃຫ້ເກີດສິວ?',
    body2:
      'ໃນ PCOS ແອນໂດຣເຈັນທີ່ມີຫຼາຍກວ່າປົກກະຕິກະຕຸ້ນຕ່ອມໄຂມັນ ເຊິ່ງຜະລິດໄຂມັນຜິວຫຼາຍຂຶ້ນ. ຜິວບາງຄົນຍັງໄວຕໍ່ຮໍໂມນເຫຼົ່ານີ້ຫຼາຍກວ່າ ເຊິ່ງອະທິບາຍວ່າເປັນຫຍັງສິວຈຶ່ງອາດເດັ່ນຊັດ ເຖິງແມ່ນບໍ່ມີຄວາມບໍ່ສົມດຸນຫຼາຍທີ່ວັດໄດ້ໃນຫ້ອງທົດລອງ.',
    neutralText:
      'ນີ້ບໍ່ແມ່ນເລື່ອງຂອງກຳລັງໃຈ: ຄວາມໄວນີ້ແຕກຕ່າງກັນໃນແຕ່ລະຄົນ ແລະ ບໍ່ຂຶ້ນກັບນິໄສການດຳລົງຊີວິດຂອງທ່ານ.',
    h3Title: 'ວິທີສັງເກດສິວຈາກຮໍໂມນ',
    body3:
      'ລັກສະນະບາງຢ່າງມັກເກີດຂຶ້ນຊ້ຳ ແຕ່ບໍ່ແມ່ນທຸກຄັ້ງ:',
    recognizeSigns: [
      'ສ່ວນລຸ່ມຂອງໃບໜ້າ: ແນວຄາງ, ຄາງ',
      'ສິວທີ່ເລິກກວ່າ ແລະ ບາງຄັ້ງເຈັບ',
      'ມັກກັບມາເກີດຊ້ຳບ່ອນເກົ່າ',
      'ຮອຍແດງ ຫຼື ຮອຍທີ່ຢູ່ດົນ',
    ],
    h4Title: 'ສິວຈາກຮໍໂມນ ແລະ ຮອບເດືອນ',
    body4:
      'ສິວຈາກຮໍໂມນສາມາດຜັນຜວນຕະຫຼອດຮອບເດືອນ. ຜູ້ຍິງຫຼາຍຄົນສັງເກດເຫັນສິວຂຶ້ນຫຼາຍໃນສອງສາມມື້ກ່ອນປະຈຳເດືອນ ເມື່ອໂປຣເຈສເຕໂຣນເພີ່ມຂຶ້ນ ແລ້ວຫຼຸດລົງຢ່າງໄວ ເຊິ່ງກະຕຸ້ນການຜະລິດໄຂມັນຜິວຊົ່ວຄາວ.',
    highlightTitle: 'ຕິດຕາມການກຳເຣີບຂອງສິວ',
    highlightText:
      'ການບັນທຶກວ່າສິວປາກົດເມື່ອໃດເມື່ອທຽບກັບຮອບເດືອນ ສາມາດຊ່ວຍທ່ານ ແລະ ແພດຜິວໜັງເຂົ້າໃຈຄວາມກ່ຽວຂ້ອງກັບຮໍໂມນໄດ້ດີຂຶ້ນ.',
    h5Title: 'ສິ່ງທີ່ອາດຊ່ວຍໄດ້',
    body5a:
      'ນິໄສການດູແລງ່າຍໆບາງຢ່າງສາມາດຊ່ວຍຈຳກັດການກຳເຣີບ ໂດຍບໍ່ໄດ້ເຮັດໃຫ້ສິວຫາຍໝົດດ້ວຍຕົວມັນເອງ:',
    careHabits: [
      'ທຳຄວາມສະອາດຜິວຢ່າງອ່ອນໂຍນທັງເຊົ້າ ແລະ ແລງ',
      'ຫຼີກເວັ້ນຜະລິດຕະພັນທີ່ແຮງ ຫຼື ລອກຜິວ',
      'ປົກປ້ອງຜິວຈາກແສງແດດທຸກມື້',
      'ຫຼີກເວັ້ນການບີບ ຫຼື ແກະສິວ',
    ],
    body5b:
      'ຕາມສະຖານະການ ແພດຜິວໜັງ ຫຼື ສູດິ-ນາຣີແພດອາດແນະນຳການຮັກສາແບບທາ (ຄຣີມ, ເຈວ) ຫຼື ຖ້າຈຳເປັນ ການຮັກສາດ້ວຍຮໍໂມນທີ່ເໝາະສົມ.',
    alertTitle: 'ຢ່າຮັກສາຕົນເອງ',
    alertText:
      'ການຮັກສາສິວຈາກຮໍໂມນ (ແບບທາ ຫຼື ຮໍໂມນ) ຕ້ອງຖືກສັ່ງ ແລະ ຕິດຕາມໂດຍຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ ໂດຍສະເພາະຖ້າທ່ານຫວັງຈະຕັ້ງຄັນ.',
    h6Title: 'ເວລາໃດຄວນພົບແພດ?',
    body6:
      'ຄຳແນະນຳທາງການແພດມີປະໂຫຍດເປັນພິເສດໃນບາງສະຖານະການ:',
    consultReasons: [
      'ສິວທີ່ຄົງຢູ່ ທັງທີ່ດູແລຢ່າງເໝາະສົມແລ້ວ',
      'ສິວທີ່ເຈັບ ຫຼື ເລິກ (ກ້ອນ, ຖົງນ້ຳ)',
      'ສິວຮຸນແຮງ ຫຼື ສິວທີ່ຮ້າຍແຮງຂຶ້ນຢ່າງໄວ',
      'ຮອຍ ຫຼື ແຜເປັນທີ່ເລີ່ມຄົງຢູ່',
    ],
    h7Title: 'ຈຸດສຳຄັນ',
    summaryTitle: 'ຈຸດສຳຄັນທີ່ຕ້ອງຈື່',
    keyPoints: [
      'ສິວຈາກຮໍໂມນມີສາເຫດທີ່ລະບຸໄດ້ ທີ່ກ່ຽວຂ້ອງກັບແອນໂດຣເຈັນ.',
      'ມັນມັກເກີດທີ່ສ່ວນລຸ່ມຂອງໃບໜ້າ ແລະ ອາດຮ້າຍແຮງຂຶ້ນກ່ອນປະຈຳເດືອນ.',
      'ມັນບໍ່ແມ່ນຍ້ອນຂາດຄວາມສະອາດ ແລະ ບໍ່ແມ່ນສິ່ງທີ່ຫຼີກບໍ່ໄດ້.',
      'ການດູແລຢ່າງອ່ອນໂຍນ ແລະ ຖ້າຈຳເປັນ ການຮັກສາທີ່ເໝາະສົມສາມາດເຮັດໃຫ້ດີຂຶ້ນ.',
      'ແພດຜິວໜັງ ຫຼື ສູດິ-ນາຣີແພດສາມາດຊ່ວຍທ່ານໄດ້ ຫາກສິວຍັງຄົງຢູ່.',
    ],
    finalNoteTitle: 'ຄູ່ມືເພື່ອເຂົ້າໃຈໃຫ້ດີຂຶ້ນ',
    finalNoteText:
      'ບົດຄວາມນີ້ເປັນຂໍ້ມູນທົ່ວໄປເທົ່ານັ້ນ ແລະ ບໍ່ແທນການປຶກສາແພດ. ຫາກສົງໄສ ຫຼື ອາການຍັງຄົງຢູ່ ໃຫ້ຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    shareMessage: 'ເຂົ້າໃຈສິວຈາກຮໍໂມນ — AWA',
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
