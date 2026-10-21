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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'pcos-peau-pilosite-symptomes';

const HERO = CYCLE_PHASES_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CARE_HABIT_ICONS = [
  'face-woman-outline',
  'weather-sunny',
  'bowl-mix-outline',
  'account-heart-outline',
] as const;

const MINI_CARD_ICONS = [
  'face-woman-outline',
  'content-cut',
  'hair-dryer-outline',
  'account-heart-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('PcosSkinHair', {
  fr: {
    badge: 'SOPK',
    title: 'Peau, pilosité et\nsymptômes visibles',
    metaDuration: '9 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Le SOPK peut se manifester par des changements visibles de la peau, de la pilosité ou des cheveux. Comprendre leur origine permet de mieux les identifier et de savoir quelles solutions peuvent être envisagées.',
    infoBannerText: 'Ces manifestations sont fréquentes, mais elles ne sont ni obligatoires ni suffisantes à elles seules pour diagnostiquer un SOPK.',
    contentsTitle: 'Dans cet article',
    contents: [
      'Pourquoi ces symptômes apparaissent',
      'L’acné hormonale',
      'La pilosité excessive',
      'Le dégarnissement capillaire',
      'Prendre soin de sa peau',
      'Prendre soin de ses cheveux',
      'Ce qui peut aider au quotidien',
      'Quand consulter',
      'Idées reçues',
      'À retenir',
    ],
    section1Body1: 'Le SOPK peut s’accompagner d’une production ou d’une activité accrue des androgènes, des hormones également présentes naturellement chez la femme. Lorsque leur effet est plus marqué, elles peuvent influencer les glandes sébacées, les follicules pileux et le cycle de croissance des cheveux.',
    section1Body2: 'C’est notamment cette influence hormonale qui peut expliquer l’apparition d’une acné persistante, d’une pilosité plus importante ou, chez certaines femmes, d’un amincissement des cheveux.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Les symptômes visibles ne reflètent pas forcément la gravité du SOPK. Une femme peut avoir plusieurs manifestations visibles, tandis qu’une autre peut présenter peu ou pas de symptômes cutanés.',
    section2Body1: 'L’acné associée aux variations hormonales peut apparaître ou persister après l’adolescence. Elle peut notamment concerner le menton, la mâchoire, le bas des joues ou parfois le cou.',
    section2Body2: 'Chez certaines personnes, les lésions sont profondes, sensibles et récurrentes. Elles peuvent également laisser des marques pigmentées ou des cicatrices lorsqu’elles sont manipulées ou lorsqu’elles sont particulièrement inflammatoires.',
    skinSignsTitle: 'Signes cutanés possibles',
    skinSigns: [
      'Une acné persistante, notamment sur le bas du visage',
      'Une peau plus grasse qu’auparavant',
      'Des poussées d’acné qui suivent parfois les variations hormonales',
      'Des marques ou cicatrices laissées après les poussées',
    ],
    section3Body1: 'L’hirsutisme correspond à une pilosité terminale plus importante dans certaines zones habituellement moins concernées chez la femme. Dans le contexte du SOPK, il peut être lié à l’action des androgènes sur les follicules pileux.',
    section3Body2: 'Les zones fréquemment concernées sont le menton, la lèvre supérieure, la poitrine, le ventre ou le dos. L’importance de la pilosité varie considérablement d’une personne à l’autre.',
    hairSignsTitle: 'Manifestations possibles',
    hairSigns: [
      'Une pilosité plus visible sur le visage',
      'Des poils plus épais au niveau du menton ou de la lèvre supérieure',
      'Une pilosité pouvant apparaître sur la poitrine, le ventre ou le dos',
      'Un amincissement progressif des cheveux au niveau du sommet du crâne',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'La pilosité dépend aussi de facteurs génétiques et individuels. Une pilosité importante ne signifie donc pas automatiquement qu’un SOPK est présent.',
    section4Body1: 'Certaines femmes présentant un SOPK remarquent également une diminution de la densité des cheveux. L’amincissement peut être particulièrement visible au niveau du sommet du crâne ou de la ligne centrale.',
    section4Body2: 'Cette manifestation peut être progressive. Il est important de distinguer une chute de cheveux liée aux hormones d’autres causes possibles, comme une carence, un problème thyroïdien, certains médicaments ou une période de stress important.',
    alert1Title: 'À noter',
    alert1Text: 'Une chute de cheveux importante, rapide ou inhabituelle mérite une évaluation médicale afin d’en rechercher la cause.',
    section5Body: 'Une routine simple et régulière est généralement préférable à l’accumulation de nombreux produits. L’objectif est de nettoyer, hydrater et protéger la peau tout en limitant les agressions qui peuvent entretenir l’irritation.',
    careHabits: [
      'Une routine de peau douce et régulière',
      'Une protection solaire quotidienne',
      'Une alimentation équilibrée',
      'De la patience : les résultats prennent du temps',
    ],
    section6Body1: 'Lorsque les cheveux deviennent plus fins, il peut être utile de limiter les agressions répétées : chaleur excessive, coiffures très serrées ou traitements chimiques fréquents.',
    section6Body2: 'Une consultation dermatologique peut être intéressante si la perte de densité progresse, afin de déterminer la cause et de discuter des traitements disponibles.',
    practicalTitle: 'Conseils pratiques',
    practicalTips: [
      'Choisir des produits non agressifs et éviter de multiplier les soins irritants',
      'Nettoyer la peau sans la décaper, matin et soir si nécessaire',
      'Utiliser une protection solaire lorsque la peau est exposée',
      'Éviter de percer les boutons afin de limiter les marques et cicatrices',
      'Demander conseil à un professionnel si les symptômes persistent ou s’aggravent',
    ],
    section7Body: 'La prise en charge dépend des symptômes, de leur intensité, de leur impact sur la qualité de vie et des objectifs de chaque femme. Il peut être utile d’agir sur plusieurs aspects plutôt que de chercher une seule solution.',
    miniCards: [
      {title: 'Peau', text: 'Routine adaptée et avis dermatologique si nécessaire.'},
      {title: 'Pilosité', text: 'Solutions esthétiques ou médicales selon la situation.'},
      {title: 'Cheveux', text: 'Identifier la cause avant de choisir un traitement.'},
      {title: 'Bien-être', text: 'Prendre en compte l’impact émotionnel des symptômes.'},
    ],
    section8Body1: 'Il est conseillé d’en parler à un professionnel de santé lorsque l’acné devient persistante ou douloureuse, lorsque la pilosité augmente rapidement, lorsque les cheveux s’affinent de façon importante ou lorsque ces changements s’accompagnent de cycles très irréguliers.',
    section8Body2: 'Un dermatologue peut prendre en charge les manifestations de la peau et des cheveux. Un gynécologue ou un autre professionnel compétent peut également évaluer le contexte hormonal et les autres manifestations éventuelles du SOPK.',
    alert2Title: 'Consulte si nécessaire',
    alert2Text: 'Une apparition rapide et importante de pilosité, une chute de cheveux brutale ou des changements hormonaux inhabituels nécessitent un avis médical.',
    ideasReceived: [
      'Avoir de l’acné ne signifie pas automatiquement avoir un SOPK',
      'Une pilosité visible n’est pas forcément liée uniquement aux hormones',
      'Le SOPK peut concerner des femmes de toutes corpulences',
      'Les symptômes peuvent évoluer avec le temps et ne sont pas identiques chez toutes les femmes',
    ],
    quoteText: 'Les symptômes visibles du SOPK peuvent être gênants, mais ils ne définissent pas ta féminité, ta valeur ou ton hygiène.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Le SOPK peut influencer la peau, la pilosité et les cheveux.',
      'Les manifestations sont très variables d’une femme à l’autre.',
      'Un symptôme isolé ne suffit pas à diagnostiquer un SOPK.',
      'Des solutions existent pour améliorer les symptômes.',
      'Un accompagnement médical peut aider à choisir une prise en charge adaptée.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'L’acné, la pilosité ou la chute de cheveux peuvent être des manifestations du SOPK, mais elles ne sont pas une fatalité. Une prise en charge personnalisée peut permettre de mieux contrôler les symptômes et d’améliorer le confort au quotidien.',
    disclaimerText: 'Cet article est informatif et ne remplace pas une consultation médicale, un diagnostic ou un traitement personnalisé.',
    shareMessage: 'Peau, pilosité et symptômes visibles du SOPK — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'Skin, hair, and\nvisible symptoms',
    metaDuration: '9 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'PCOS can cause visible changes in the skin, body hair, or scalp hair. Understanding where they come from makes it easier to recognize them and to know what solutions may be considered.',
    infoBannerText: 'These signs are common, but on their own they are neither required nor enough to diagnose PCOS.',
    contentsTitle: 'In this article',
    contents: [
      'Why these symptoms appear',
      'Hormonal acne',
      'Excess hair growth',
      'Hair thinning',
      'Taking care of your skin',
      'Taking care of your hair',
      'What can help day to day',
      'When to see a doctor',
      'Common misconceptions',
      'Key takeaways',
    ],
    section1Body1: 'PCOS can involve increased production or activity of androgens, hormones that are also naturally present in women. When their effect is more pronounced, they can influence the sebaceous glands, the hair follicles, and the hair growth cycle.',
    section1Body2: 'This hormonal influence is largely what can explain the appearance of persistent acne, increased hair growth, or, in some women, hair thinning.',
    tip1Title: 'Good to know',
    tip1Text: 'Visible symptoms don’t necessarily reflect how severe PCOS is. One woman may have several visible symptoms, while another may have few or none at all.',
    section2Body1: 'Acne linked to hormonal changes can appear or persist beyond adolescence. It tends to affect the chin, jawline, lower cheeks, or sometimes the neck.',
    section2Body2: 'In some people, the lesions are deep, tender, and recurring. They can also leave pigmented marks or scars when they’re picked at or when they’re especially inflamed.',
    skinSignsTitle: 'Possible skin signs',
    skinSigns: [
      'Persistent acne, especially on the lower face',
      'Skin that is oilier than before',
      'Acne flare-ups that sometimes follow hormonal changes',
      'Marks or scars left after flare-ups',
    ],
    section3Body1: 'Hirsutism refers to increased terminal hair growth in areas not usually affected in women. In the context of PCOS, it can be linked to the effect of androgens on the hair follicles.',
    section3Body2: 'The areas most commonly affected are the chin, upper lip, chest, abdomen, or back. How much hair growth occurs varies considerably from person to person.',
    hairSignsTitle: 'Possible signs',
    hairSigns: [
      'More visible hair growth on the face',
      'Coarser hair on the chin or upper lip',
      'Hair growth that can appear on the chest, abdomen, or back',
      'Gradual thinning of hair at the crown of the head',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Hair growth also depends on genetic and individual factors. Noticeable hair growth doesn’t automatically mean PCOS is present.',
    section4Body1: 'Some women with PCOS also notice a decrease in hair density. The thinning can be especially visible at the crown of the head or along the center part.',
    section4Body2: 'This can develop gradually. It’s important to distinguish hormone-related hair loss from other possible causes, such as a deficiency, a thyroid issue, certain medications, or a period of significant stress.',
    alert1Title: 'Worth noting',
    alert1Text: 'Hair loss that is significant, rapid, or unusual deserves a medical evaluation to look into the cause.',
    section5Body: 'A simple, consistent routine is generally better than layering on many products. The goal is to cleanse, hydrate, and protect the skin while limiting anything that can keep irritation going.',
    careHabits: [
      'A gentle, consistent skincare routine',
      'Daily sun protection',
      'A balanced diet',
      'Patience: results take time',
    ],
    section6Body1: 'When hair becomes finer, it can help to limit repeated stress on it: excessive heat, very tight hairstyles, or frequent chemical treatments.',
    section6Body2: 'A dermatology consultation can be worthwhile if hair density keeps decreasing, to help determine the cause and discuss available treatments.',
    practicalTitle: 'Practical tips',
    practicalTips: [
      'Choose gentle products and avoid layering on multiple irritating treatments',
      'Cleanse the skin without stripping it, morning and evening if needed',
      'Use sun protection when the skin is exposed',
      'Avoid picking at blemishes to limit marks and scarring',
      'Ask a professional for advice if symptoms persist or get worse',
    ],
    section7Body: 'Management depends on the symptoms, how intense they are, their impact on quality of life, and each woman’s goals. It can help to work on several fronts rather than looking for a single solution.',
    miniCards: [
      {title: 'Skin', text: 'A suitable routine and dermatology advice if needed.'},
      {title: 'Hair growth', text: 'Cosmetic or medical solutions depending on the situation.'},
      {title: 'Hair', text: 'Identify the cause before choosing a treatment.'},
      {title: 'Well-being', text: 'Take the emotional impact of symptoms into account.'},
    ],
    section8Body1: 'It’s a good idea to talk to a healthcare professional when acne becomes persistent or painful, when hair growth increases quickly, when hair thins noticeably, or when these changes come with very irregular cycles.',
    section8Body2: 'A dermatologist can manage skin and hair symptoms. A gynecologist or another qualified professional can also assess the hormonal context and any other possible signs of PCOS.',
    alert2Title: 'See a doctor if needed',
    alert2Text: 'Rapid, significant hair growth, sudden hair loss, or unusual hormonal changes call for medical advice.',
    ideasReceived: [
      'Having acne doesn’t automatically mean you have PCOS',
      'Visible hair growth isn’t necessarily linked to hormones alone',
      'PCOS can affect women of any body type',
      'Symptoms can change over time and aren’t the same for every woman',
    ],
    quoteText: 'The visible symptoms of PCOS can be frustrating, but they don’t define your femininity, your worth, or your hygiene.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'PCOS can affect the skin, body hair, and scalp hair.',
      'Symptoms vary widely from woman to woman.',
      'A single symptom isn’t enough to diagnose PCOS.',
      'Solutions exist to help improve symptoms.',
      'Medical support can help you choose the right approach for you.',
    ],
    finalTipTitle: 'Key takeaways',
    finalTipText: 'Acne, excess hair growth, or hair loss can be symptoms of PCOS, but they aren’t inevitable. A personalized approach can help you manage symptoms better and feel more comfortable day to day.',
    disclaimerText: 'This article is for information only and doesn’t replace a medical consultation, diagnosis, or personalized treatment.',
    shareMessage: 'Skin, hair, and visible PCOS symptoms — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Piel, vello y\nsíntomas visibles',
    metaDuration: '9 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'El SOP puede manifestarse mediante cambios visibles en la piel, el vello o el cabello. Comprender su origen permite identificarlos mejor y saber qué soluciones pueden considerarse.',
    infoBannerText: 'Estas manifestaciones son frecuentes, pero no son obligatorias ni suficientes por sí solas para diagnosticar un SOP.',
    contentsTitle: 'En este artículo',
    contents: [
      'Por qué aparecen estos síntomas',
      'El acné hormonal',
      'El vello excesivo',
      'El adelgazamiento capilar',
      'Cuidar tu piel',
      'Cuidar tu cabello',
      'Lo que puede ayudar en el día a día',
      'Cuándo consultar',
      'Ideas falsas',
      'Para recordar',
    ],
    section1Body1: 'El SOP puede acompañarse de una producción o una actividad aumentada de los andrógenos, hormonas que también están presentes de forma natural en la mujer. Cuando su efecto es más marcado, pueden influir en las glándulas sebáceas, los folículos pilosos y el ciclo de crecimiento del cabello.',
    section1Body2: 'Es precisamente esta influencia hormonal la que puede explicar la aparición de un acné persistente, un vello más abundante o, en algunas mujeres, un adelgazamiento del cabello.',
    tip1Title: 'Dato útil',
    tip1Text: 'Los síntomas visibles no reflejan forzosamente la gravedad del SOP. Una mujer puede tener varias manifestaciones visibles, mientras que otra puede presentar pocos o ningún síntoma cutáneo.',
    section2Body1: 'El acné asociado a las variaciones hormonales puede aparecer o persistir después de la adolescencia. Suele afectar al mentón, la mandíbula, la parte baja de las mejillas o, a veces, el cuello.',
    section2Body2: 'En algunas personas, las lesiones son profundas, sensibles y recurrentes. También pueden dejar marcas pigmentadas o cicatrices cuando se manipulan o cuando son especialmente inflamatorias.',
    skinSignsTitle: 'Posibles signos cutáneos',
    skinSigns: [
      'Un acné persistente, especialmente en la parte baja del rostro',
      'Una piel más grasa que antes',
      'Brotes de acné que a veces siguen las variaciones hormonales',
      'Marcas o cicatrices dejadas tras los brotes',
    ],
    section3Body1: 'El hirsutismo corresponde a un vello terminal más abundante en zonas habitualmente menos afectadas en la mujer. En el contexto del SOP, puede estar relacionado con la acción de los andrógenos sobre los folículos pilosos.',
    section3Body2: 'Las zonas frecuentemente afectadas son el mentón, el labio superior, el pecho, el vientre o la espalda. La cantidad de vello varía considerablemente de una persona a otra.',
    hairSignsTitle: 'Manifestaciones posibles',
    hairSigns: [
      'Un vello más visible en el rostro',
      'Pelos más gruesos en el mentón o el labio superior',
      'Vello que puede aparecer en el pecho, el vientre o la espalda',
      'Un adelgazamiento progresivo del cabello en la coronilla',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'El vello también depende de factores genéticos e individuales. Un vello abundante no significa, por tanto, automáticamente que haya un SOP.',
    section4Body1: 'Algunas mujeres con SOP también notan una disminución de la densidad del cabello. El adelgazamiento puede ser especialmente visible en la coronilla o en la raya central.',
    section4Body2: 'Esta manifestación puede ser progresiva. Es importante distinguir una caída de cabello relacionada con las hormonas de otras posibles causas, como una carencia, un problema tiroideo, ciertos medicamentos o un periodo de estrés importante.',
    alert1Title: 'A tener en cuenta',
    alert1Text: 'Una caída de cabello importante, rápida o inusual merece una evaluación médica para buscar su causa.',
    section5Body: 'Una rutina sencilla y regular suele ser preferible a la acumulación de numerosos productos. El objetivo es limpiar, hidratar y proteger la piel limitando a la vez las agresiones que pueden mantener la irritación.',
    careHabits: [
      'Una rutina de piel suave y regular',
      'Una protección solar diaria',
      'Una alimentación equilibrada',
      'Paciencia: los resultados llevan tiempo',
    ],
    section6Body1: 'Cuando el cabello se vuelve más fino, puede ser útil limitar las agresiones repetidas: calor excesivo, peinados muy tirantes o tratamientos químicos frecuentes.',
    section6Body2: 'Una consulta dermatológica puede ser interesante si la pérdida de densidad progresa, para determinar la causa y hablar de los tratamientos disponibles.',
    practicalTitle: 'Consejos prácticos',
    practicalTips: [
      'Elegir productos no agresivos y evitar multiplicar los cuidados irritantes',
      'Limpiar la piel sin resecarla, mañana y noche si es necesario',
      'Usar protección solar cuando la piel esté expuesta',
      'Evitar pinchar los granos para limitar marcas y cicatrices',
      'Pedir consejo a un profesional si los síntomas persisten o empeoran',
    ],
    section7Body: 'El manejo depende de los síntomas, de su intensidad, de su impacto en la calidad de vida y de los objetivos de cada mujer. Puede ser útil actuar en varios aspectos en lugar de buscar una única solución.',
    miniCards: [
      {title: 'Piel', text: 'Rutina adaptada y opinión dermatológica si es necesario.'},
      {title: 'Vello', text: 'Soluciones estéticas o médicas según la situación.'},
      {title: 'Cabello', text: 'Identificar la causa antes de elegir un tratamiento.'},
      {title: 'Bienestar', text: 'Tener en cuenta el impacto emocional de los síntomas.'},
    ],
    section8Body1: 'Se recomienda hablar con un profesional de salud cuando el acné se vuelve persistente o doloroso, cuando el vello aumenta rápidamente, cuando el cabello se adelgaza de forma importante o cuando estos cambios se acompañan de ciclos muy irregulares.',
    section8Body2: 'Un dermatólogo puede manejar las manifestaciones de la piel y del cabello. Un ginecólogo u otro profesional competente también puede evaluar el contexto hormonal y las demás posibles manifestaciones del SOP.',
    alert2Title: 'Consulta si es necesario',
    alert2Text: 'Una aparición rápida e importante de vello, una caída de cabello brusca o cambios hormonales inusuales requieren una opinión médica.',
    ideasReceived: [
      'Tener acné no significa automáticamente tener SOP',
      'Un vello visible no está necesariamente relacionado solo con las hormonas',
      'El SOP puede afectar a mujeres de todas las complexiones',
      'Los síntomas pueden evolucionar con el tiempo y no son iguales en todas las mujeres',
    ],
    quoteText: 'Los síntomas visibles del SOP pueden resultar molestos, pero no definen tu feminidad, tu valor ni tu higiene.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'El SOP puede influir en la piel, el vello y el cabello.',
      'Las manifestaciones varían mucho de una mujer a otra.',
      'Un síntoma aislado no basta para diagnosticar un SOP.',
      'Existen soluciones para mejorar los síntomas.',
      'Un acompañamiento médico puede ayudar a elegir un manejo adecuado.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText: 'El acné, el vello o la caída de cabello pueden ser manifestaciones del SOP, pero no son una fatalidad. Un manejo personalizado puede permitir controlar mejor los síntomas y mejorar el confort en el día a día.',
    disclaimerText: 'Este artículo es informativo y no sustituye una consulta médica, un diagnóstico ni un tratamiento personalizado.',
    shareMessage: 'Piel, vello y síntomas visibles del SOP — AWA',
  },
  it: {
    badge: 'PCOS',
    title: 'Pelle, capelli e\nsintomi visibili',
    metaDuration: '9 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'La PCOS può causare cambiamenti visibili a livello della pelle, dei peli del corpo o dei capelli. Capire da dove nascono rende più facile riconoscerli e sapere quali soluzioni si possono prendere in considerazione.',
    infoBannerText: 'Questi segni sono frequenti, ma da soli non sono né necessari né sufficienti per diagnosticare la PCOS.',
    contentsTitle: 'In questo articolo',
    contents: [
      'Perché compaiono questi sintomi',
      'L’acne ormonale',
      'Crescita eccessiva dei peli',
      'Diradamento dei capelli',
      'Prendersi cura della pelle',
      'Prendersi cura dei capelli',
      'Cosa può aiutare nella vita di tutti i giorni',
      'Quando rivolgersi a un medico',
      'Idee sbagliate comuni',
      'Punti chiave',
    ],
    section1Body1: 'La PCOS può comportare una maggiore produzione o attività degli androgeni, ormoni naturalmente presenti anche nelle donne. Quando il loro effetto è più marcato, possono influenzare le ghiandole sebacee, i follicoli piliferi e il ciclo di crescita dei peli e dei capelli.',
    section1Body2: 'Questa influenza ormonale è in gran parte ciò che può spiegare la comparsa di un’acne persistente, di una crescita più marcata dei peli o, in alcune donne, di un diradamento dei capelli.',
    tip1Title: 'Da sapere',
    tip1Text: 'I sintomi visibili non riflettono necessariamente la gravità della PCOS. Una donna può avere diversi sintomi visibili, mentre un’altra può averne pochi o nessuno.',
    section2Body1: 'L’acne legata ai cambiamenti ormonali può comparire o persistere oltre l’adolescenza. Tende a interessare il mento, la linea della mandibola, la parte bassa delle guance o talvolta il collo.',
    section2Body2: 'In alcune persone le lesioni sono profonde, dolorose al tatto e ricorrenti. Possono anche lasciare macchie pigmentate o cicatrici quando vengono schiacciate o quando sono particolarmente infiammate.',
    skinSignsTitle: 'Possibili segni sulla pelle',
    skinSigns: [
      'Acne persistente, soprattutto nella parte bassa del viso',
      'Pelle più grassa di prima',
      'Peggioramenti dell’acne che a volte seguono variazioni ormonali',
      'Macchie o cicatrici lasciate dopo i peggioramenti',
    ],
    section3Body1: 'L’irsutismo indica una crescita aumentata di peli terminali in zone solitamente non interessate nelle donne. Nel contesto della PCOS può essere collegato all’effetto degli androgeni sui follicoli piliferi.',
    section3Body2: 'Le zone più spesso interessate sono il mento, il labbro superiore, il petto, l’addome o la schiena. La quantità di peli varia molto da persona a persona.',
    hairSignsTitle: 'Possibili segni',
    hairSigns: [
      'Crescita più visibile di peli sul viso',
      'Peli più spessi sul mento o sul labbro superiore',
      'Crescita di peli che può comparire su petto, addome o schiena',
      'Diradamento progressivo dei capelli sulla sommità del capo',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'La crescita dei peli dipende anche da fattori genetici e individuali. Una crescita evidente dei peli non significa automaticamente che sia presente la PCOS.',
    section4Body1: 'Alcune donne con PCOS notano anche una diminuzione della densità dei capelli. Il diradamento può essere particolarmente visibile sulla sommità del capo o lungo la riga centrale.',
    section4Body2: 'Può svilupparsi gradualmente. È importante distinguere la caduta dei capelli di origine ormonale da altre possibili cause, come una carenza, un problema alla tiroide, alcuni farmaci o un periodo di stress significativo.',
    alert1Title: 'Da tenere a mente',
    alert1Text: 'Una caduta dei capelli importante, rapida o insolita merita una valutazione medica per ricercarne la causa.',
    section5Body: 'Una routine semplice e costante è in genere preferibile a molti prodotti sovrapposti. L’obiettivo è detergere, idratare e proteggere la pelle, limitando tutto ciò che può mantenere l’irritazione.',
    careHabits: [
      'Una routine di cura della pelle delicata e costante',
      'Protezione solare ogni giorno',
      'Un’alimentazione equilibrata',
      'Pazienza: i risultati richiedono tempo',
    ],
    section6Body1: 'Quando i capelli diventano più sottili, può essere utile limitare le sollecitazioni ripetute: calore eccessivo, acconciature molto tirate o trattamenti chimici frequenti.',
    section6Body2: 'Una visita dermatologica può essere utile se la densità dei capelli continua a diminuire, per aiutare a individuarne la causa e discutere dei trattamenti disponibili.',
    practicalTitle: 'Consigli pratici',
    practicalTips: [
      'Scegli prodotti delicati ed evita di sovrapporre più trattamenti irritanti',
      'Detergi la pelle senza aggredirla, mattina e sera se necessario',
      'Usa una protezione solare quando la pelle è esposta',
      'Evita di schiacciare i brufoli per limitare macchie e cicatrici',
      'Chiedi consiglio a un professionista se i sintomi persistono o peggiorano',
    ],
    section7Body: 'La gestione dipende dai sintomi, dalla loro intensità, dal loro impatto sulla qualità di vita e dagli obiettivi di ciascuna donna. Può essere utile agire su più fronti, invece di cercare un’unica soluzione.',
    miniCards: [
      {
        title: 'Pelle',
        text: 'Una routine adatta e, se serve, il parere di un dermatologo.',
      },
      {
        title: 'Crescita dei peli',
        text: 'Soluzioni estetiche o mediche a seconda della situazione.',
      },
      {
        title: 'Capelli',
        text: 'Individuare la causa prima di scegliere un trattamento.',
      },
      {
        title: 'Benessere',
        text: 'Tenere conto dell’impatto emotivo dei sintomi.',
      },
    ],
    section8Body1: 'È opportuno parlarne con un professionista della salute quando l’acne diventa persistente o dolorosa, quando la crescita dei peli aumenta rapidamente, quando i capelli si diradano in modo evidente o quando questi cambiamenti si accompagnano a cicli molto irregolari.',
    section8Body2: 'Un dermatologo può occuparsi dei sintomi della pelle e dei capelli. Una ginecologa o un altro professionista qualificato può inoltre valutare il contesto ormonale e gli eventuali altri segni di PCOS.',
    alert2Title: 'Rivolgiti a un medico se necessario',
    alert2Text: 'Una crescita rapida e importante dei peli, una caduta improvvisa dei capelli o cambiamenti ormonali insoliti richiedono un parere medico.',
    ideasReceived: [
      'Avere l’acne non significa automaticamente avere la PCOS',
      'Una crescita visibile dei peli non è necessariamente legata ai soli ormoni',
      'La PCOS può riguardare donne di qualsiasi corporatura',
      'I sintomi possono cambiare nel tempo e non sono uguali per tutte le donne',
    ],
    quoteText: 'I sintomi visibili della PCOS possono essere frustranti, ma non definiscono la tua femminilità, il tuo valore né la tua igiene.',
    summaryTitle: 'L’essenziale',
    summaryItems: [
      'La PCOS può interessare la pelle, i peli del corpo e i capelli.',
      'I sintomi variano molto da donna a donna.',
      'Un singolo sintomo non basta per diagnosticare la PCOS.',
      'Esistono soluzioni per aiutare a migliorare i sintomi.',
      'Un supporto medico può aiutarti a scegliere l’approccio più adatto a te.',
    ],
    finalTipTitle: 'Punti chiave',
    finalTipText: 'Acne, crescita eccessiva dei peli o caduta dei capelli possono essere sintomi della PCOS, ma non sono inevitabili. Un approccio personalizzato può aiutarti a gestire meglio i sintomi e a sentirti più a tuo agio ogni giorno.',
    disclaimerText: 'Questo articolo ha uno scopo esclusivamente informativo e non sostituisce una visita medica, una diagnosi o un trattamento personalizzato.',
    shareMessage: 'Pelle, capelli e sintomi visibili della PCOS — AWA',
  },
  tr: {
    badge: 'PKOS',
    title: 'Cilt, saç ve\ngözle görülen belirtiler',
    metaDuration: '9 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'PKOS; ciltte, vücut tüylerinde ya da saçlı derideki saçlarda gözle görülür değişikliklere yol açabilir. Bunların nereden geldiğini anlamak, onları tanımayı ve hangi çözümlerin düşünülebileceğini bilmeyi kolaylaştırır.',
    infoBannerText: 'Bu belirtiler yaygındır; ancak tek başlarına PKOS tanısı için ne gerekli ne de yeterlidir.',
    contentsTitle: 'Bu makalede',
    contents: [
      'Bu belirtiler neden ortaya çıkar?',
      'Hormonal akne',
      'Aşırı tüy büyümesi',
      'Saç incelmesi',
      'Cildine özen göstermek',
      'Saçlarına özen göstermek',
      'Günlük hayatta neler yardımcı olabilir?',
      'Ne zaman doktora gitmeli?',
      'Yaygın yanlış inanışlar',
      'Akılda kalacaklar',
    ],
    section1Body1: 'PKOS, kadınlarda da doğal olarak bulunan hormonlar olan androjenlerin üretiminin ya da etkinliğinin artmasını içerebilir. Etkileri belirginleştiğinde yağ bezlerini, saç köklerini ve saç büyüme döngüsünü etkileyebilirler.',
    section1Body2: 'Süregelen akne, artmış tüy büyümesi ya da bazı kadınlarda saç incelmesinin ortaya çıkışı büyük ölçüde bu hormonal etkiyle açıklanabilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Gözle görülen belirtiler PKOS’un ne kadar şiddetli olduğunu mutlaka yansıtmaz. Bir kadında birkaç görünür belirti olabilirken bir başkasında çok az ya da hiç olmayabilir.',
    section2Body1: 'Hormonal değişimlere bağlı akne ergenliğin ötesinde ortaya çıkabilir ya da sürebilir. Genellikle çeneyi, çene hattını, yanakların alt kısmını ya da bazen boynu etkiler.',
    section2Body2: 'Bazı kişilerde lezyonlar derin, hassas ve tekrarlayıcıdır. Sıkıldıklarında ya da özellikle iltihaplı olduklarında pigmentli izler ya da yara izleri bırakabilirler.',
    skinSignsTitle: 'Olası cilt belirtileri',
    skinSigns: [
      'Süregelen akne, özellikle yüzün alt kısmında',
      'Eskisinden daha yağlı cilt',
      'Bazen hormonal değişimleri izleyen akne alevlenmeleri',
      'Alevlenmelerden sonra kalan izler ya da yara izleri',
    ],
    section3Body1: 'Hirsutizm, kadınlarda normalde etkilenmeyen bölgelerde terminal tüy büyümesinin artması anlamına gelir. PKOS bağlamında bu, androjenlerin tüy köklerine etkisiyle ilişkili olabilir.',
    section3Body2: 'En sık etkilenen bölgeler çene, üst dudak, göğüs, karın ya da sırttır. Tüy büyümesinin ne kadar olduğu kişiden kişiye büyük ölçüde değişir.',
    hairSignsTitle: 'Olası belirtiler',
    hairSigns: [
      'Yüzde daha görünür tüy büyümesi',
      'Çenede ya da üst dudakta daha kalın tüyler',
      'Göğüste, karında ya da sırtta ortaya çıkabilen tüy büyümesi',
      'Tepe bölgesinde saçların giderek incelmesi',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Tüy büyümesi genetik ve bireysel faktörlere de bağlıdır. Fark edilir bir tüy büyümesi otomatik olarak PKOS olduğu anlamına gelmez.',
    section4Body1: 'PKOS’lu bazı kadınlar saç yoğunluğunda azalma da fark eder. İncelme özellikle tepe bölgesinde ya da saç ayrımı boyunca daha belirgin olabilir.',
    section4Body2: 'Bu durum yavaş yavaş gelişebilir. Hormonlara bağlı saç dökülmesini; eksiklik, tiroit sorunu, bazı ilaçlar ya da yoğun stres dönemi gibi diğer olası nedenlerden ayırt etmek önemlidir.',
    alert1Title: 'Dikkat edilmesi gereken',
    alert1Text: 'Belirgin, hızlı ya da olağandışı saç dökülmesi, nedenini araştırmak için tıbbi değerlendirmeyi hak eder.',
    section5Body: 'Basit ve tutarlı bir rutin, birçok ürünü üst üste uygulamaktan genellikle daha iyidir. Amaç, tahrişi sürdürebilecek her şeyi sınırlayarak cildi temizlemek, nemlendirmek ve korumaktır.',
    careHabits: [
      'Nazik ve tutarlı bir cilt bakımı rutini',
      'Her gün güneşten korunma',
      'Dengeli beslenme',
      'Sabır: sonuçlar zaman alır',
    ],
    section6Body1: 'Saçlar incelmeye başladığında, aşırı ısı, çok sıkı saç modelleri ya da sık yapılan kimyasal işlemler gibi saça tekrar tekrar binen stresi sınırlamak yardımcı olabilir.',
    section6Body2: 'Saç yoğunluğu azalmaya devam ediyorsa nedenin belirlenmesine ve mevcut tedavilerin konuşulmasına yardımcı olması için bir dermatoloji muayenesi faydalı olabilir.',
    practicalTitle: 'Pratik ipuçları',
    practicalTips: [
      'Nazik ürünler seç ve birden fazla tahriş edici uygulamayı üst üste yapmaktan kaçın',
      'Cildi kurutmadan temizle; gerekirse sabah ve akşam',
      'Cilt açıkta kaldığında güneş koruması kullan',
      'İz ve yara izi oluşmasını sınırlamak için sivilceleri sıkmaktan kaçın',
      'Belirtiler sürerse ya da kötüleşirse bir uzmandan tavsiye iste',
    ],
    section7Body: 'Yönetim; belirtilere, şiddetlerine, yaşam kalitesi üzerindeki etkilerine ve her kadının hedeflerine bağlıdır. Tek bir çözüm aramak yerine birkaç cephede birden çalışmak yardımcı olabilir.',
    miniCards: [
      {
        title: 'Cilt',
        text: 'Uygun bir rutin ve gerekirse dermatolog tavsiyesi.',
      },
      {
        title: 'Tüy büyümesi',
        text: 'Duruma göre kozmetik ya da tıbbi çözümler.',
      },
      {
        title: 'Saç',
        text: 'Tedaviyi seçmeden önce nedeni belirle.',
      },
      {
        title: 'İyi oluş',
        text: 'Belirtilerin duygusal etkisini de hesaba kat.',
      },
    ],
    section8Body1: 'Akne süreğen ya da ağrılı hale geldiğinde, tüy büyümesi hızla arttığında, saçlar belirgin biçimde incelediğinde ya da bu değişikliklere çok düzensiz döngüler eşlik ettiğinde bir sağlık profesyoneliyle konuşmak iyi olur.',
    section8Body2: 'Bir dermatolog cilt ve saç belirtilerini yönetebilir. Bir jinekolog ya da yetkin başka bir profesyonel de hormonal bağlamı ve PKOS’un olası diğer belirtilerini değerlendirebilir.',
    alert2Title: 'Gerekirse doktora git',
    alert2Text: 'Hızlı ve belirgin tüy büyümesi, ani saç dökülmesi ya da olağandışı hormonal değişiklikler tıbbi tavsiye gerektirir.',
    ideasReceived: [
      'Akne olması otomatik olarak PKOS’un olduğu anlamına gelmez',
      'Görünür tüy büyümesi yalnızca hormonlarla bağlantılı olmak zorunda değildir',
      'PKOS her vücut tipindeki kadını etkileyebilir',
      'Belirtiler zaman içinde değişebilir ve her kadında aynı değildir',
    ],
    quoteText: 'PKOS’un gözle görülen belirtileri can sıkıcı olabilir; ancak kadınlığını, değerini ya da hijyenini tanımlamaz.',
    summaryTitle: 'Özetle',
    summaryItems: [
      'PKOS cildi, vücut tüylerini ve saçlı derideki saçları etkileyebilir.',
      'Belirtiler kadından kadına büyük farklılık gösterir.',
      'Tek bir belirti PKOS tanısı için yeterli değildir.',
      'Belirtilerin iyileşmesine yardımcı olacak çözümler vardır.',
      'Tıbbi destek, sana uygun yaklaşımı seçmene yardımcı olabilir.',
    ],
    finalTipTitle: 'Akılda kalacaklar',
    finalTipText: 'Akne, aşırı tüy büyümesi ya da saç dökülmesi PKOS’un belirtileri olabilir; ancak kaçınılmaz değildir. Kişiye özel bir yaklaşım, belirtileri daha iyi yönetmene ve günlük hayatta kendini daha rahat hissetmene yardımcı olabilir.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amaçlıdır; tıbbi muayenenin, tanının ya da kişiye özel tedavinin yerini tutmaz.',
    shareMessage: 'Cilt, saç ve gözle görülen PKOS belirtileri — AWA',
  },
  ru: {
    badge: 'СПКЯ',
    title: 'Кожа, волосы\nи видимые симптомы',
    metaDuration: '9 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'СПКЯ может вызывать видимые изменения кожи, волос на теле или на голове. Понимание их причин помогает легче их распознавать и знать, какие способы можно рассмотреть.',
    infoBannerText: 'Эти признаки распространены, но сами по себе они не обязательны и не достаточны для диагностики СПКЯ.',
    contentsTitle: 'В этой статье',
    contents: [
      'Почему появляются эти симптомы',
      'Гормональные высыпания',
      'Избыточный рост волос',
      'Истончение волос',
      'Уход за кожей',
      'Уход за волосами',
      'Что может помочь в повседневной жизни',
      'Когда стоит обратиться к врачу',
      'Распространённые заблуждения',
      'Главное',
    ],
    section1Body1: 'При СПКЯ может быть повышена выработка или активность андрогенов — гормонов, которые в норме присутствуют и у женщин. Когда их действие выражено сильнее, они могут влиять на сальные железы, волосяные фолликулы и цикл роста волос.',
    section1Body2: 'Именно это гормональное влияние во многом может объяснять появление стойких высыпаний, усиленный рост волос или, у некоторых женщин, истончение волос.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Видимые симптомы не обязательно отражают тяжесть СПКЯ. У одной женщины может быть несколько видимых симптомов, а у другой — лишь немногие или вовсе ни одного.',
    section2Body1: 'Высыпания, связанные с гормональными изменениями, могут появляться или сохраняться и после подросткового возраста. Чаще всего они затрагивают подбородок, линию челюсти, нижнюю часть щёк или иногда шею.',
    section2Body2: 'У некоторых женщин элементы глубокие, болезненные и повторяющиеся. Они также могут оставлять пигментные пятна или рубцы, если их выдавливать или если воспаление особенно сильное.',
    skinSignsTitle: 'Возможные признаки на коже',
    skinSigns: [
      'Стойкие высыпания, особенно в нижней части лица',
      'Кожа, которая стала более жирной, чем раньше',
      'Обострения высыпаний, которые иногда следуют за гормональными изменениями',
      'Пятна или рубцы, остающиеся после обострений',
    ],
    section3Body1: 'Гирсутизм — это усиленный рост жёстких (терминальных) волос в зонах, которые у женщин обычно не затронуты. При СПКЯ он может быть связан с действием андрогенов на волосяные фолликулы.',
    section3Body2: 'Чаще всего это затрагивает подбородок, верхнюю губу, грудь, живот или спину. Степень роста волос сильно различается от женщины к женщине.',
    hairSignsTitle: 'Возможные признаки',
    hairSigns: [
      'Более заметный рост волос на лице',
      'Более жёсткие волосы на подбородке или над верхней губой',
      'Рост волос, который может появляться на груди, животе или спине',
      'Постепенное истончение волос в области макушки',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Рост волос зависит также от генетических и индивидуальных факторов. Заметный рост волос не означает автоматически наличие СПКЯ.',
    section4Body1: 'Некоторые женщины с СПКЯ также замечают снижение густоты волос. Истончение может быть особенно заметно в области макушки или вдоль пробора.',
    section4Body2: 'Оно может развиваться постепенно. Важно отличать выпадение волос, связанное с гормонами, от других возможных причин, таких как дефицит веществ, проблемы со щитовидной железой, приём некоторых лекарств или период сильного стресса.',
    alert1Title: 'Стоит отметить',
    alert1Text: 'Значительное, быстрое или необычное выпадение волос требует медицинского обследования, чтобы выяснить причину.',
    section5Body: 'Простой и регулярный уход, как правило, лучше, чем множество наслаиваемых средств. Цель — очищать, увлажнять и защищать кожу, ограничивая всё, что может поддерживать раздражение.',
    careHabits: [
      'Мягкий и регулярный уход за кожей',
      'Ежедневная защита от солнца',
      'Сбалансированное питание',
      'Терпение: результат требует времени',
    ],
    section6Body1: 'Когда волосы становятся тоньше, может помочь ограничение повторяющихся нагрузок на них: чрезмерного нагрева, очень тугих причёсок или частых химических процедур.',
    section6Body2: 'Консультация дерматолога может быть полезна, если густота волос продолжает снижаться: это поможет определить причину и обсудить доступные методы лечения.',
    practicalTitle: 'Практические советы',
    practicalTips: [
      'Выбирайте мягкие средства и не наслаивайте несколько раздражающих средств',
      'Очищайте кожу, не пересушивая её, утром и вечером, если нужно',
      'Используйте солнцезащиту, когда кожа открыта',
      'Не выдавливайте высыпания, чтобы ограничить появление пятен и рубцов',
      'Обратитесь за советом к специалисту, если симптомы сохраняются или усиливаются',
    ],
    section7Body: 'Подход зависит от симптомов, их выраженности, влияния на качество жизни и целей каждой женщины. Может быть полезно работать сразу в нескольких направлениях, а не искать единственное решение.',
    miniCards: [
      {title: 'Кожа', text: 'Подходящий уход и, при необходимости, консультация дерматолога.'},
      {title: 'Рост волос', text: 'Косметические или медицинские способы в зависимости от ситуации.'},
      {title: 'Волосы', text: 'Определите причину, прежде чем выбирать лечение.'},
      {title: 'Самочувствие', text: 'Учитывайте эмоциональное влияние симптомов.'},
    ],
    section8Body1: 'Стоит поговорить с медицинским специалистом, когда высыпания становятся стойкими или болезненными, когда рост волос быстро усиливается, когда волосы заметно редеют или когда эти изменения сопровождаются очень нерегулярным циклом.',
    section8Body2: 'Дерматолог может заниматься симптомами кожи и волос. Гинеколог или другой квалифицированный специалист также может оценить гормональный фон и другие возможные признаки СПКЯ.',
    alert2Title: 'При необходимости обратитесь к врачу',
    alert2Text: 'Быстрый и значительный рост волос, внезапное выпадение волос или необычные гормональные изменения требуют консультации врача.',
    ideasReceived: [
      'Наличие высыпаний ещё не означает автоматически, что у вас СПКЯ',
      'Заметный рост волос не обязательно связан только с гормонами',
      'СПКЯ может встречаться у женщин с любым телосложением',
      'Симптомы могут меняться со временем и не одинаковы у всех женщин',
    ],
    quoteText: 'Видимые симптомы СПКЯ могут расстраивать, но они не определяют вашу женственность, вашу ценность или вашу чистоплотность.',
    summaryTitle: 'Самое важное',
    summaryItems: [
      'СПКЯ может влиять на кожу, волосы на теле и на голове.',
      'Симптомы сильно различаются от женщины к женщине.',
      'Одного симптома недостаточно для диагностики СПКЯ.',
      'Существуют способы, помогающие улучшить симптомы.',
      'Медицинская поддержка поможет вам выбрать подходящий именно вам подход.',
    ],
    finalTipTitle: 'Главное',
    finalTipText: 'Высыпания, избыточный рост волос или выпадение волос могут быть симптомами СПКЯ, но они не неизбежны. Индивидуальный подход может помочь лучше справляться с симптомами и чувствовать себя в повседневной жизни комфортнее.',
    disclaimerText: 'Эта статья носит исключительно информационный характер и не заменяет медицинский осмотр, диагностику или индивидуальное лечение.',
    shareMessage: 'Кожа, волосы и видимые симптомы СПКЯ — AWA',
  },
  de: {
    badge: 'PCOS',
    title: 'Haut, Haare und\nsichtbare Symptome',
    metaDuration: '9 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'PCOS kann sichtbare Veränderungen an Haut, Körperbehaarung oder Kopfhaar verursachen. Wenn du verstehst, woher sie kommen, kannst du sie leichter einordnen und weißt, welche Lösungen infrage kommen können.',
    infoBannerText: 'Diese Anzeichen sind häufig, aber für sich allein weder notwendig noch ausreichend, um PCOS zu diagnostizieren.',
    contentsTitle: 'In diesem Artikel',
    contents: [
      'Warum diese Symptome auftreten',
      'Hormonelle Akne',
      'Verstärkter Haarwuchs',
      'Dünner werdendes Haar',
      'Hautpflege',
      'Haarpflege',
      'Was im Alltag helfen kann',
      'Wann du ärztlichen Rat suchen solltest',
      'Häufige Irrtümer',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Bei PCOS können Androgene vermehrt gebildet werden oder stärker wirken – Hormone, die auch bei Frauen natürlicherweise vorkommen. Wirken sie stärker, können sie die Talgdrüsen, die Haarfollikel und den Haarwachstumszyklus beeinflussen.',
    section1Body2: 'Dieser hormonelle Einfluss erklärt weitgehend, warum es zu anhaltender Akne, verstärktem Haarwuchs oder bei manchen Frauen zu dünner werdendem Haar kommen kann.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Sichtbare Symptome sagen nicht zwangsläufig etwas darüber aus, wie stark das PCOS ausgeprägt ist. Eine Frau kann mehrere sichtbare Symptome haben, eine andere nur wenige oder gar keine.',
    section2Body1: 'Akne, die mit hormonellen Veränderungen zusammenhängt, kann auch nach der Jugend neu auftreten oder bestehen bleiben. Sie betrifft häufig das Kinn, die Kieferlinie, die unteren Wangen oder manchmal den Hals.',
    section2Body2: 'Bei manchen Menschen sind die Hautveränderungen tief liegend, schmerzempfindlich und kehren immer wieder. Sie können außerdem pigmentierte Flecken oder Narben hinterlassen, wenn man daran herumdrückt oder wenn sie besonders stark entzündet sind.',
    skinSignsTitle: 'Mögliche Hautanzeichen',
    skinSigns: [
      'Anhaltende Akne, besonders im unteren Gesichtsbereich',
      'Fettigere Haut als früher',
      'Akneschübe, die manchmal auf hormonelle Veränderungen folgen',
      'Flecken oder Narben nach Schüben',
    ],
    section3Body1: 'Hirsutismus bezeichnet verstärkten Terminalhaarwuchs an Stellen, die bei Frauen üblicherweise nicht betroffen sind. Im Zusammenhang mit PCOS kann er mit der Wirkung der Androgene auf die Haarfollikel zusammenhängen.',
    section3Body2: 'Am häufigsten sind Kinn, Oberlippe, Brust, Bauch oder Rücken betroffen. Wie stark der Haarwuchs ausgeprägt ist, unterscheidet sich von Person zu Person erheblich.',
    hairSignsTitle: 'Mögliche Anzeichen',
    hairSigns: [
      'Deutlicher sichtbarer Haarwuchs im Gesicht',
      'Gröbere Haare am Kinn oder an der Oberlippe',
      'Haarwuchs, der an Brust, Bauch oder Rücken auftreten kann',
      'Allmähliches Dünnerwerden der Haare am Scheitel',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Der Haarwuchs hängt auch von genetischen und individuellen Faktoren ab. Auffälliger Haarwuchs bedeutet nicht automatisch, dass ein PCOS vorliegt.',
    section4Body1: 'Manche Frauen mit PCOS bemerken außerdem, dass ihr Haar weniger dicht wird. Das Dünnerwerden kann besonders am Scheitel oder entlang der Mittellinie sichtbar sein.',
    section4Body2: 'Das kann sich schleichend entwickeln. Wichtig ist, hormonell bedingten Haarausfall von anderen möglichen Ursachen zu unterscheiden, etwa einem Mangel, einem Schilddrüsenproblem, bestimmten Medikamenten oder einer Phase mit starkem Stress.',
    alert1Title: 'Wichtig zu wissen',
    alert1Text: 'Starker, rasch fortschreitender oder ungewöhnlicher Haarausfall sollte ärztlich abgeklärt werden, um die Ursache zu finden.',
    section5Body: 'Eine einfache, konsequente Routine ist in der Regel besser, als viele Produkte zu kombinieren. Ziel ist es, die Haut zu reinigen, mit Feuchtigkeit zu versorgen und zu schützen und dabei alles zu vermeiden, was Reizungen aufrechterhalten kann.',
    careHabits: [
      'Eine sanfte, regelmäßige Hautpflegeroutine',
      'Täglicher Sonnenschutz',
      'Eine ausgewogene Ernährung',
      'Geduld: Ergebnisse brauchen Zeit',
    ],
    section6Body1: 'Wenn das Haar feiner wird, kann es helfen, es möglichst wenig wiederholt zu belasten: übermäßige Hitze, sehr straffe Frisuren oder häufige chemische Behandlungen.',
    section6Body2: 'Ein dermatologischer Termin kann sinnvoll sein, wenn die Haardichte weiter abnimmt – um die Ursache einzugrenzen und mögliche Behandlungen zu besprechen.',
    practicalTitle: 'Praktische Tipps',
    practicalTips: [
      'Wähle milde Produkte und kombiniere nicht mehrere reizende Behandlungen',
      'Reinige die Haut, ohne sie auszutrocknen – morgens und abends, wenn nötig',
      'Schütze die Haut vor der Sonne, wenn sie unbedeckt ist',
      'Drücke nicht an Unreinheiten herum, um Flecken und Narben zu vermeiden',
      'Lass dich fachlich beraten, wenn die Symptome anhalten oder sich verschlimmern',
    ],
    section7Body: 'Die Behandlung richtet sich nach den Symptomen, ihrer Stärke, ihrer Auswirkung auf die Lebensqualität und den Zielen der jeweiligen Frau. Oft hilft es, an mehreren Stellen anzusetzen, statt nach einer einzigen Lösung zu suchen.',
    miniCards: [
      {title: 'Haut', text: 'Eine passende Routine und bei Bedarf dermatologischer Rat.'},
      {title: 'Haarwuchs', text: 'Kosmetische oder medizinische Lösungen je nach Situation.'},
      {title: 'Haare', text: 'Zuerst die Ursache klären, dann die Behandlung wählen.'},
      {title: 'Wohlbefinden', text: 'Die seelische Belastung durch die Symptome ernst nehmen.'},
    ],
    section8Body1: 'Es ist sinnvoll, mit medizinischem Fachpersonal zu sprechen, wenn die Akne anhaltend oder schmerzhaft wird, der Haarwuchs schnell zunimmt, die Haare deutlich dünner werden oder diese Veränderungen mit sehr unregelmäßigen Zyklen einhergehen.',
    section8Body2: 'Eine Hautärztin oder ein Hautarzt kann Haut- und Haarsymptome behandeln. Eine Frauenärztin, ein Frauenarzt oder anderes qualifiziertes Fachpersonal kann außerdem den hormonellen Hintergrund und weitere mögliche Anzeichen eines PCOS beurteilen.',
    alert2Title: 'Bei Bedarf ärztlichen Rat einholen',
    alert2Text: 'Rascher, starker Haarwuchs, plötzlicher Haarausfall oder ungewöhnliche hormonelle Veränderungen sollten ärztlich abgeklärt werden.',
    ideasReceived: [
      'Akne zu haben bedeutet nicht automatisch, dass du PCOS hast',
      'Sichtbarer Haarwuchs hängt nicht unbedingt nur mit Hormonen zusammen',
      'PCOS kann Frauen jeder Statur betreffen',
      'Symptome können sich mit der Zeit verändern und sind nicht bei jeder Frau gleich',
    ],
    quoteText: 'Die sichtbaren Symptome von PCOS können belastend sein, aber sie bestimmen weder deine Weiblichkeit noch deinen Wert noch deine Hygiene.',
    summaryTitle: 'Das Wesentliche',
    summaryItems: [
      'PCOS kann Haut, Körperbehaarung und Kopfhaar beeinflussen.',
      'Die Symptome sind von Frau zu Frau sehr unterschiedlich.',
      'Ein einzelnes Symptom reicht nicht aus, um PCOS zu diagnostizieren.',
      'Es gibt Möglichkeiten, die Symptome zu verbessern.',
      'Ärztliche Begleitung kann dir helfen, den passenden Weg für dich zu finden.',
    ],
    finalTipTitle: 'Das Wichtigste in Kürze',
    finalTipText: 'Akne, verstärkter Haarwuchs oder Haarausfall können Symptome von PCOS sein, sind aber nicht unvermeidlich. Ein individueller Ansatz kann dir helfen, die Symptome besser in den Griff zu bekommen und dich im Alltag wohler zu fühlen.',
    disclaimerText: 'Dieser Artikel dient nur der Information und ersetzt keine ärztliche Beratung, Diagnose oder individuelle Behandlung.',
    shareMessage: 'Haut, Haare und sichtbare PCOS-Symptome – AWA',
  },
  zh: {
      badge: 'PCOS',
      title: '皮肤、毛发与\n可见症状',
      metaDuration: '阅读约 9 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: 'PCOS 可能让皮肤、体毛或头发出现一些可见的变化。了解这些变化从何而来，更容易认出它们，也更清楚可以考虑哪些应对办法。',
      infoBannerText: '这些表现很常见，但仅凭它们既不是诊断 PCOS 的必要条件，也不足以据此诊断。',
      contentsTitle: '本文内容',
      contents: [
        '这些症状为什么会出现',
        '激素性痤疮',
        '毛发过多',
        '头发变稀疏',
        '护理你的皮肤',
        '护理你的头发',
        '日常中可以做些什么',
        '什么时候该看医生',
        '常见误解',
        '要点回顾',
      ],
      section1Body1: 'PCOS 可能伴有雄激素分泌增多或作用增强。雄激素是女性体内本来也存在的激素。当它的作用更明显时，会影响皮脂腺、毛囊和毛发的生长周期。',
      section1Body2: '这种激素影响，在很大程度上可以解释为什么会出现顽固的痤疮、毛发增多，或者在一些女性身上出现头发变稀疏。',
      tip1Title: '小贴士',
      tip1Text: '可见症状并不一定反映 PCOS 的严重程度。有的女性可能有好几种可见症状，有的则很少，甚至完全没有。',
      section2Body1: '与激素变化有关的痤疮，可能在青春期之后出现或持续存在。它多见于下巴、下颌线、下脸颊，有时也会长在颈部。',
      section2Body2: '有些人的痘痘位置较深，触碰会痛，而且反复出现。如果用手去挤，或者炎症特别明显，还可能留下色素沉着或疤痕。',
      skinSignsTitle: '可能出现的皮肤表现',
      skinSigns: [
        '顽固的痤疮，尤其是在下半张脸',
        '皮肤比以前更油',
        '有时会随着激素变化而反复爆痘',
        '痘痘消退后留下痘印或疤痕',
      ],
      section3Body1: '多毛症是指在女性通常不太长毛的部位，长出较粗的终毛，数量增多。在 PCOS 中，这可能与雄激素对毛囊的作用有关。',
      section3Body2: '最常受影响的部位是下巴、上唇、胸部、腹部或背部。毛发增多的程度因人而异，差别很大。',
      hairSignsTitle: '可能出现的表现',
      hairSigns: [
        '脸上的毛发更明显',
        '下巴或上唇的毛发变粗',
        '胸部、腹部或背部可能长出毛发',
        '头顶的头发逐渐变稀疏',
      ],
      tip2Title: '小贴士',
      tip2Text: '毛发生长还与遗传和个体因素有关。毛发明显增多，并不一定就是 PCOS。',
      section4Body1: '一些 PCOS 女性还会发现头发密度下降。变稀疏的情况在头顶或发缝处可能尤为明显。',
      section4Body2: '这可能是逐渐发生的。需要把与激素有关的脱发和其他可能的原因区分开，例如营养缺乏、甲状腺问题、某些药物，或者一段压力很大的时期。',
      alert1Title: '值得留意',
      alert1Text: '如果脱发严重、来得很快或不寻常，应当去做医学评估，查明原因。',
      section5Body: '简单而坚持的护肤流程，通常比叠加很多产品更好。目标是清洁、保湿和防护皮肤，同时尽量避免可能持续刺激皮肤的东西。',
      careHabits: [
        '温和而规律的护肤流程',
        '每天做好防晒',
        '均衡饮食',
        '保持耐心：效果需要时间',
      ],
      section6Body1: '头发变细时，尽量减少对它的反复损伤会有帮助：过度使用高温、扎得很紧的发型，或者频繁做化学处理。',
      section6Body2: '如果头发密度持续下降，去看皮肤科可能是值得的，这有助于查明原因，并了解可选的治疗方法。',
      practicalTitle: '实用建议',
      practicalTips: [
        '选择温和的产品，避免叠加多种刺激性的护理产品',
        '清洁皮肤，但不要过度清洁，需要时早晚各一次',
        '皮肤暴露在外时做好防晒',
        '不要挤压痘痘，以减少痘印和疤痕',
        '症状持续或加重时，向专业人员咨询',
      ],
      section7Body: '怎么处理，取决于症状本身、严重程度、对生活质量的影响，以及每位女性自己的期望。从几个方面同时着手，往往比只寻找一种解决办法更有帮助。',
      miniCards: [
        {
          title: '皮肤',
          text: '合适的护肤流程，必要时听取皮肤科的建议。',
        },
        {
          title: '毛发增多',
          text: '根据具体情况，选择美容或医学方面的办法。',
        },
        {
          title: '头发',
          text: '先查明原因，再选择治疗方式。',
        },
        {
          title: '身心状态',
          text: '把症状带来的情绪影响也考虑进去。',
        },
      ],
      section8Body1: '当痤疮变得顽固或疼痛、毛发增多得很快、头发明显变稀疏，或者这些变化伴随着非常不规律的月经周期时，不妨和医疗专业人员聊一聊。',
      section8Body2: '皮肤科医生可以处理皮肤和毛发方面的症状。妇科医生或其他有资质的专业人员，也可以评估激素方面的情况，以及 PCOS 其他可能的表现。',
      alert2Title: '需要时请看医生',
      alert2Text: '毛发快速且明显增多、突然脱发，或者出现异常的激素变化，都需要寻求医疗建议。',
      ideasReceived: [
        '长痘痘并不一定意味着你有 PCOS',
        '毛发增多不一定只与激素有关',
        '任何体型的女性都可能受 PCOS 影响',
        '症状会随时间变化，每位女性也不尽相同',
      ],
      quoteText: 'PCOS 的可见症状可能让人烦恼，但它们并不决定你的女性特质、你的价值，也与你是否爱干净无关。',
      summaryTitle: '核心要点',
      summaryItems: [
        'PCOS 可能影响皮肤、体毛和头发。',
        '症状因人而异，差别很大。',
        '仅凭某一个症状，不足以诊断 PCOS。',
        '有办法帮助改善症状。',
        '医疗支持可以帮你选择适合自己的方式。',
      ],
      finalTipTitle: '要点回顾',
      finalTipText: '痤疮、毛发过多或脱发可能是 PCOS 的表现，但并非不可避免。个性化的应对方式，可以帮助你更好地管理症状，让日常生活更舒适。',
      disclaimerText: '本文仅供参考，不能替代医疗咨询、诊断或个性化治疗。',
      shareMessage: '皮肤、毛发与 PCOS 的可见症状 — AWA',
    },
  id: {
    badge: 'PCOS',
    title: 'Kulit, rambut, dan\ngejala yang terlihat',
    metaDuration: '9 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten yang telah ditinjau',
    intro: 'PCOS dapat menimbulkan perubahan yang terlihat pada kulit, rambut tubuh, atau rambut kepala. Memahami asal perubahan ini membuatmu lebih mudah mengenalinya dan mengetahui solusi apa yang bisa dipertimbangkan.',
    infoBannerText: 'Tanda-tanda ini umum terjadi, tetapi dengan sendirinya tidak wajib ada dan tidak cukup untuk mendiagnosis PCOS.',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Mengapa gejala ini muncul',
      'Jerawat hormonal',
      'Pertumbuhan rambut berlebih',
      'Rambut menipis',
      'Merawat kulitmu',
      'Merawat rambutmu',
      'Apa yang bisa membantu sehari-hari',
      'Kapan harus ke dokter',
      'Kesalahpahaman umum',
      'Poin-poin penting',
    ],
    section1Body1: 'PCOS dapat melibatkan peningkatan produksi atau aktivitas androgen, hormon yang secara alami juga ada pada wanita. Ketika pengaruhnya lebih kuat, hormon ini dapat memengaruhi kelenjar sebasea, folikel rambut, dan siklus pertumbuhan rambut.',
    section1Body2: 'Pengaruh hormonal inilah yang sebagian besar dapat menjelaskan munculnya jerawat yang membandel, pertumbuhan rambut yang meningkat, atau, pada sebagian wanita, rambut yang menipis.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Gejala yang terlihat belum tentu mencerminkan seberapa berat PCOS. Seorang wanita mungkin memiliki beberapa gejala yang terlihat, sementara yang lain hanya sedikit atau bahkan tidak ada sama sekali.',
    section2Body1: 'Jerawat yang berkaitan dengan perubahan hormon bisa muncul atau bertahan hingga melewati masa remaja. Jerawat ini cenderung muncul di dagu, garis rahang, pipi bagian bawah, atau terkadang leher.',
    section2Body2: 'Pada sebagian orang, lesinya dalam, terasa nyeri, dan berulang. Jerawat juga bisa meninggalkan bercak berpigmen atau bekas luka jika dipencet atau ketika peradangannya sangat berat.',
    skinSignsTitle: 'Kemungkinan tanda pada kulit',
    skinSigns: [
      'Jerawat yang membandel, terutama di wajah bagian bawah',
      'Kulit yang lebih berminyak dari sebelumnya',
      'Jerawat yang kambuh dan terkadang mengikuti perubahan hormon',
      'Noda atau bekas luka setelah jerawat kambuh',
    ],
    section3Body1: 'Hirsutisme adalah meningkatnya pertumbuhan rambut terminal di area yang biasanya tidak ditumbuhi rambut pada wanita. Dalam konteks PCOS, hal ini bisa berkaitan dengan pengaruh androgen pada folikel rambut.',
    section3Body2: 'Area yang paling sering terkena adalah dagu, bibir atas, dada, perut, atau punggung. Seberapa banyak rambut yang tumbuh sangat bervariasi dari satu orang ke orang lain.',
    hairSignsTitle: 'Kemungkinan tanda',
    hairSigns: [
      'Pertumbuhan rambut yang lebih terlihat di wajah',
      'Rambut yang lebih kasar di dagu atau bibir atas',
      'Pertumbuhan rambut yang bisa muncul di dada, perut, atau punggung',
      'Rambut yang menipis secara bertahap di bagian puncak kepala',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Pertumbuhan rambut juga bergantung pada faktor genetik dan individu. Rambut yang tumbuh terlihat jelas tidak otomatis berarti PCOS.',
    section4Body1: 'Sebagian wanita dengan PCOS juga merasakan kepadatan rambut yang berkurang. Penipisannya bisa terlihat jelas terutama di puncak kepala atau di sepanjang belahan rambut.',
    section4Body2: 'Hal ini bisa berkembang secara bertahap. Penting untuk membedakan kerontokan akibat hormon dari penyebab lain yang mungkin, seperti kekurangan zat gizi, masalah tiroid, obat-obatan tertentu, atau masa stres yang berat.',
    alert1Title: 'Perlu dicatat',
    alert1Text: 'Kerontokan rambut yang banyak, cepat, atau tidak biasa perlu dievaluasi secara medis untuk mencari penyebabnya.',
    section5Body: 'Rutinitas yang sederhana dan konsisten umumnya lebih baik daripada memakai banyak produk sekaligus. Tujuannya adalah membersihkan, melembapkan, dan melindungi kulit sambil membatasi hal-hal yang dapat memperpanjang iritasi.',
    careHabits: [
      'Rutinitas perawatan kulit yang lembut dan konsisten',
      'Perlindungan dari sinar matahari setiap hari',
      'Pola makan seimbang',
      'Kesabaran: hasilnya butuh waktu',
    ],
    section6Body1: 'Ketika rambut menjadi lebih halus, ada baiknya membatasi tekanan yang berulang pada rambut: panas berlebihan, model rambut yang sangat kencang, atau perawatan kimia yang terlalu sering.',
    section6Body2: 'Konsultasi dengan dokter kulit bisa bermanfaat jika kepadatan rambut terus berkurang, untuk membantu menentukan penyebabnya dan membahas pengobatan yang tersedia.',
    practicalTitle: 'Tips praktis',
    practicalTips: [
      'Pilih produk yang lembut dan hindari menumpuk beberapa perawatan yang mengiritasi',
      'Bersihkan kulit tanpa membuatnya kering, pagi dan malam jika perlu',
      'Gunakan pelindung dari sinar matahari saat kulit terpapar',
      'Hindari memencet jerawat untuk membatasi noda dan bekas luka',
      'Minta saran dari tenaga profesional jika gejala menetap atau memburuk',
    ],
    section7Body: 'Penanganan bergantung pada gejalanya, seberapa kuat gejala itu, dampaknya pada kualitas hidup, dan tujuan masing-masing wanita. Akan membantu jika kamu menangani dari beberapa sisi sekaligus, bukan mencari satu solusi saja.',
    miniCards: [
      {
        title: 'Kulit',
        text: 'Rutinitas yang sesuai dan saran dokter kulit jika perlu.',
      },
      {
        title: 'Pertumbuhan rambut',
        text: 'Solusi kosmetik atau medis sesuai situasinya.',
      },
      {
        title: 'Rambut',
        text: 'Kenali penyebabnya sebelum memilih pengobatan.',
      },
      {
        title: 'Kesejahteraan',
        text: 'Perhatikan dampak emosional dari gejala.',
      },
    ],
    section8Body1: 'Sebaiknya bicara dengan tenaga kesehatan ketika jerawat menjadi membandel atau nyeri, ketika pertumbuhan rambut meningkat dengan cepat, ketika rambut menipis secara nyata, atau ketika perubahan ini disertai siklus yang sangat tidak teratur.',
    section8Body2: 'Dokter kulit dapat menangani gejala pada kulit dan rambut. Dokter kandungan atau tenaga profesional berkualifikasi lainnya juga dapat menilai konteks hormonal dan tanda-tanda PCOS lain yang mungkin ada.',
    alert2Title: 'Temui dokter jika perlu',
    alert2Text: 'Pertumbuhan rambut yang cepat dan banyak, kerontokan rambut yang tiba-tiba, atau perubahan hormon yang tidak biasa memerlukan saran medis.',
    ideasReceived: [
      'Berjerawat tidak otomatis berarti kamu menderita PCOS',
      'Pertumbuhan rambut yang terlihat belum tentu hanya berkaitan dengan hormon',
      'PCOS dapat dialami wanita dengan bentuk tubuh apa pun',
      'Gejala bisa berubah seiring waktu dan tidak sama pada setiap wanita',
    ],
    quoteText: 'Gejala PCOS yang terlihat memang bisa membuat frustrasi, tetapi tidak menentukan kefemininanmu, harga dirimu, atau kebersihanmu.',
    summaryTitle: 'Intinya',
    summaryItems: [
      'PCOS dapat memengaruhi kulit, rambut tubuh, dan rambut kepala.',
      'Gejala sangat bervariasi dari satu wanita ke wanita lain.',
      'Satu gejala saja tidak cukup untuk mendiagnosis PCOS.',
      'Ada solusi yang dapat membantu memperbaiki gejala.',
      'Pendampingan medis dapat membantumu memilih pendekatan yang tepat untukmu.',
    ],
    finalTipTitle: 'Poin-poin penting',
    finalTipText: 'Jerawat, pertumbuhan rambut berlebih, atau kerontokan rambut bisa menjadi gejala PCOS, tetapi bukan sesuatu yang tak terelakkan. Pendekatan yang dipersonalisasi dapat membantumu menangani gejala dengan lebih baik dan merasa lebih nyaman sehari-hari.',
    disclaimerText: 'Artikel ini hanya untuk informasi dan tidak menggantikan konsultasi medis, diagnosis, atau pengobatan yang dipersonalisasi.',
    shareMessage: 'Kulit, rambut, dan gejala PCOS yang terlihat — AWA',
  },
  hi: {
    badge: 'PCOS',
    title: 'त्वचा, बाल और\nदिखने वाले लक्षण',
    metaDuration: '9 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'PCOS के कारण त्वचा, शरीर के बालों या सिर के बालों में दिखने वाले बदलाव आ सकते हैं। ये बदलाव कहाँ से आते हैं, यह समझने से उन्हें पहचानना और यह जानना आसान हो जाता है कि कौन-से उपाय सोचे जा सकते हैं।',
    infoBannerText: 'ये संकेत आम हैं, लेकिन अकेले इनके आधार पर PCOS का निदान न तो ज़रूरी है और न ही पर्याप्त।',
    contentsTitle: 'इस लेख में',
    contents: [
      'ये लक्षण क्यों दिखते हैं',
      'हार्मोनल मुँहासे',
      'बालों की अधिक बढ़त',
      'बालों का पतला होना',
      'अपनी त्वचा की देखभाल',
      'अपने बालों की देखभाल',
      'रोज़ की ज़िंदगी में क्या मदद कर सकता है',
      'डॉक्टर को कब दिखाएँ',
      'आम भ्रांतियाँ',
      'मुख्य बातें',
    ],
    section1Body1: 'PCOS में एंड्रोजन का उत्पादन या उसकी सक्रियता बढ़ सकती है। एंड्रोजन ऐसे हार्मोन हैं जो महिलाओं में भी स्वाभाविक रूप से मौजूद होते हैं। जब इनका असर ज़्यादा होता है, तो ये त्वचा की तैलीय ग्रंथियों, बालों की जड़ों और बालों के बढ़ने के चक्र को प्रभावित कर सकते हैं।',
    section1Body2: 'इसी हार्मोनल असर से काफ़ी हद तक यह समझाया जा सकता है कि लगातार मुँहासे, बालों की बढ़त में वृद्धि, या कुछ महिलाओं में बालों का पतला होना क्यों दिखता है।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'दिखने वाले लक्षण ज़रूरी नहीं कि PCOS की गंभीरता को दर्शाएँ। किसी महिला में कई दिखने वाले लक्षण हो सकते हैं, जबकि किसी दूसरी में बहुत कम या बिल्कुल नहीं।',
    section2Body1: 'हार्मोनल बदलावों से जुड़े मुँहासे किशोरावस्था के बाद भी दिख सकते हैं या बने रह सकते हैं। ये अक्सर ठुड्डी, जबड़े की रेखा, गालों के निचले हिस्से या कभी-कभी गर्दन पर होते हैं।',
    section2Body2: 'कुछ लोगों में ये दाने गहरे, छूने पर दर्द करने वाले और बार-बार होने वाले होते हैं। दानों को नोचने पर या ज़्यादा सूजन होने पर इनसे रंगीन निशान या दाग भी रह सकते हैं।',
    skinSignsTitle: 'त्वचा के संभावित संकेत',
    skinSigns: [
      'लगातार मुँहासे, खासकर चेहरे के निचले हिस्से में',
      'पहले से ज़्यादा तैलीय त्वचा',
      'मुँहासों का उभार, जो कभी-कभी हार्मोनल बदलावों के बाद आता है',
      'मुँहासे ठीक होने के बाद रह गए निशान या दाग',
    ],
    section3Body1: 'हर्सुटिज़्म का मतलब है उन जगहों पर मोटे बालों का ज़्यादा उगना, जहाँ आम तौर पर महिलाओं में बाल नहीं उगते। PCOS के संदर्भ में, इसका संबंध बालों की जड़ों पर एंड्रोजन के असर से हो सकता है।',
    section3Body2: 'सबसे ज़्यादा प्रभावित जगहें ठुड्डी, ऊपरी होंठ, छाती, पेट या पीठ हैं। बालों की बढ़त कितनी होती है, यह हर व्यक्ति में काफ़ी अलग होता है।',
    hairSignsTitle: 'संभावित संकेत',
    hairSigns: [
      'चेहरे पर बालों की ज़्यादा दिखने वाली बढ़त',
      'ठुड्डी या ऊपरी होंठ पर मोटे बाल',
      'छाती, पेट या पीठ पर बालों का उगना',
      'सिर के ऊपरी हिस्से पर बालों का धीरे-धीरे पतला होना',
    ],
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'बालों की बढ़त आनुवंशिक और व्यक्तिगत कारणों पर भी निर्भर करती है। बालों का ज़्यादा दिखना अपने आप यह नहीं बताता कि PCOS है।',
    section4Body1: 'PCOS वाली कुछ महिलाओं को बालों की घनता में कमी भी महसूस होती है। यह पतलापन सिर के ऊपरी हिस्से पर या माँग के आसपास ज़्यादा दिख सकता है।',
    section4Body2: 'यह धीरे-धीरे हो सकता है। हार्मोन से जुड़े बाल झड़ने को दूसरे संभावित कारणों से अलग पहचानना ज़रूरी है, जैसे किसी पोषक तत्व की कमी, थायरॉइड की समस्या, कुछ दवाएँ या बहुत तनाव का दौर।',
    alert1Title: 'ध्यान देने लायक',
    alert1Text: 'अगर बाल बहुत ज़्यादा, तेज़ी से या असामान्य रूप से झड़ रहे हों, तो कारण जानने के लिए डॉक्टरी जाँच करवाना ठीक रहता है।',
    section5Body: 'बहुत सारे प्रोडक्ट एक साथ लगाने की बजाय एक सरल और नियमित दिनचर्या आमतौर पर बेहतर होती है। मकसद है त्वचा को साफ़ करना, नमी देना और बचाना, और जो चीज़ें जलन बनाए रखती हैं उन्हें सीमित रखना।',
    careHabits: [
      'त्वचा की देखभाल की हल्की और नियमित दिनचर्या',
      'रोज़ाना धूप से सुरक्षा',
      'संतुलित आहार',
      'धैर्य: नतीजे आने में समय लगता है',
    ],
    section6Body1: 'जब बाल पतले होने लगें, तो उन पर बार-बार पड़ने वाले तनाव को सीमित करना मदद कर सकता है: ज़्यादा गर्मी, बहुत कसी हुई हेयरस्टाइल या बार-बार केमिकल ट्रीटमेंट।',
    section6Body2: 'अगर बालों की घनता घटती ही जा रही हो, तो त्वचा रोग विशेषज्ञ से मिलना फ़ायदेमंद हो सकता है, ताकि कारण का पता चले और उपलब्ध इलाज पर बात हो सके।',
    practicalTitle: 'व्यावहारिक सुझाव',
    practicalTips: [
      'हल्के प्रोडक्ट चुनें और कई जलन पैदा करने वाले ट्रीटमेंट एक साथ न लगाएँ',
      'त्वचा को रूखा किए बिना साफ़ करें, ज़रूरत हो तो सुबह और शाम',
      'त्वचा खुली हो तो धूप से सुरक्षा का इस्तेमाल करें',
      'निशान और दाग कम रखने के लिए दानों को नोचने से बचें',
      'लक्षण बने रहें या बढ़ें, तो किसी विशेषज्ञ से सलाह लें',
    ],
    section7Body: 'इलाज लक्षणों, उनकी तीव्रता, रोज़ की ज़िंदगी पर उनके असर और हर महिला के लक्ष्यों पर निर्भर करता है। किसी एक समाधान की तलाश करने की बजाय कई स्तरों पर काम करना मददगार हो सकता है।',
    miniCards: [
      {
        title: 'त्वचा',
        text: 'उपयुक्त दिनचर्या और ज़रूरत पड़ने पर त्वचा रोग विशेषज्ञ की सलाह।',
      },
      {
        title: 'बालों की बढ़त',
        text: 'स्थिति के अनुसार कॉस्मेटिक या चिकित्सकीय उपाय।',
      },
      {
        title: 'बाल',
        text: 'इलाज चुनने से पहले कारण पहचानें।',
      },
      {
        title: 'सेहत और मन',
        text: 'लक्षणों के भावनात्मक असर को भी ध्यान में रखें।',
      },
    ],
    section8Body1: 'स्वास्थ्य विशेषज्ञ से बात करना अच्छा रहता है, जब मुँहासे लगातार रहें या दर्द करें, बालों की बढ़त तेज़ी से बढ़े, बाल साफ़ तौर पर पतले होने लगें, या ये बदलाव बहुत अनियमित चक्र के साथ आएँ।',
    section8Body2: 'त्वचा रोग विशेषज्ञ त्वचा और बालों के लक्षणों को संभाल सकते हैं। स्त्री रोग विशेषज्ञ या कोई दूसरा योग्य विशेषज्ञ हार्मोनल स्थिति और PCOS के अन्य संभावित संकेतों का भी आकलन कर सकता है।',
    alert2Title: 'ज़रूरत हो तो डॉक्टर को दिखाएँ',
    alert2Text: 'बालों की तेज़ और ज़्यादा बढ़त, अचानक बाल झड़ना या असामान्य हार्मोनल बदलाव होने पर डॉक्टर की सलाह लेनी चाहिए।',
    ideasReceived: [
      'मुँहासे होने का मतलब अपने आप यह नहीं कि आपको PCOS है',
      'बालों की दिखने वाली बढ़त का संबंध सिर्फ़ हार्मोन से हो, यह ज़रूरी नहीं',
      'PCOS किसी भी शारीरिक बनावट की महिला को हो सकता है',
      'लक्षण समय के साथ बदल सकते हैं और हर महिला में एक जैसे नहीं होते',
    ],
    quoteText: 'PCOS के दिखने वाले लक्षण परेशान करने वाले हो सकते हैं, लेकिन वे आपकी स्त्रीत्व, आपकी कीमत या आपकी साफ़-सफ़ाई को तय नहीं करते।',
    summaryTitle: 'ज़रूरी बातें',
    summaryItems: [
      'PCOS त्वचा, शरीर के बालों और सिर के बालों को प्रभावित कर सकता है।',
      'लक्षण हर महिला में काफ़ी अलग होते हैं।',
      'सिर्फ़ एक लक्षण से PCOS का निदान नहीं हो सकता।',
      'लक्षणों को बेहतर करने के उपाय मौजूद हैं।',
      'चिकित्सकीय सहायता से आप अपने लिए सही तरीका चुन सकती हैं।',
    ],
    finalTipTitle: 'मुख्य बातें',
    finalTipText: 'मुँहासे, बालों की ज़्यादा बढ़त या बाल झड़ना PCOS के लक्षण हो सकते हैं, लेकिन ये ज़रूर होंगे ऐसा नहीं है। आपके अनुरूप तरीका लक्षणों को बेहतर संभालने और रोज़ ज़्यादा सहज महसूस करने में मदद कर सकता है।',
    disclaimerText: 'यह लेख केवल जानकारी के लिए है और डॉक्टरी परामर्श, निदान या व्यक्तिगत इलाज का विकल्प नहीं है।',
    shareMessage: 'त्वचा, बाल और PCOS के दिखने वाले लक्षण — AWA',
  },
  sq: {
    badge: 'PCOS',
    title: 'Lëkura, flokët dhe\nsimptomat e dukshme',
    metaDuration: '9 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'PCOS mund të sjellë ndryshime të dukshme në lëkurë, në qimet e trupit ose në flokët e kokës. Kur kupton nga vijnë, është më e lehtë t’i dallosh dhe të dish se çfarë zgjidhjesh mund të merren parasysh.',
    infoBannerText: 'Këto shenja janë të zakonshme, por vetëm me to nuk janë as të nevojshme, as të mjaftueshme për të diagnostikuar PCOS.',
    contentsTitle: 'Në këtë artikull',
    contents: [
      'Pse shfaqen këto simptoma',
      'Akne hormonale',
      'Rritja e tepërt e qimeve',
      'Hollimi i flokëve',
      'Kujdesi për lëkurën tënde',
      'Kujdesi për flokët e tu',
      'Çfarë mund të ndihmojë çdo ditë',
      'Kur të shkosh te mjeku',
      'Keqkuptime të zakonshme',
      'Çfarë të mbash mend',
    ],
    section1Body1: 'PCOS mund të përfshijë prodhim ose aktivitet më të madh të androgjeneve, hormone që ndodhen natyrshëm edhe te gratë. Kur efekti i tyre është më i theksuar, ato mund të ndikojnë te gjëndrat dhjamore, te folikulat e qimeve dhe te cikli i rritjes së qimeve.',
    section1Body2: 'Pikërisht ky ndikim hormonal mund të shpjegojë në masë të madhe shfaqjen e akneve të vazhdueshme, të rritjes më të madhe të qimeve ose, te disa gra, të hollimit të flokëve.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Simptomat e dukshme nuk pasqyrojnë domosdoshmërisht sa e rëndë është PCOS. Një grua mund të ketë disa simptoma të dukshme, ndërsa një tjetër mund të ketë pak ose aspak.',
    section2Body1: 'Akneja e lidhur me ndryshimet hormonale mund të shfaqet ose të vazhdojë edhe pas adolishencës. Zakonisht prek mjekrën, vijën e nofullës, faqet e poshtme ose, ndonjëherë, qafën.',
    section2Body2: 'Te disa persona, lezionet janë të thella, të dhimbshme në prekje dhe përsëriten. Ato mund të lënë edhe njolla të pigmentuara ose shenja nëse i shtrydh ose kur janë veçanërisht të inflamuara.',
    skinSignsTitle: 'Shenja të mundshme në lëkurë',
    skinSigns: [
      'Akne e vazhdueshme, sidomos në pjesën e poshtme të fytyrës',
      'Lëkurë më yndyrore se më parë',
      'Shpërthime të aknes që ndonjëherë vijnë pas ndryshimeve hormonale',
      'Njolla ose shenja që mbeten pas shpërthimeve',
    ],
    section3Body1: 'Hirsutizmi i referohet rritjes së shtuar të qimeve të forta në zona që zakonisht nuk preken te gratë. Në kontekstin e PCOS, ai mund të lidhet me efektin e androgjeneve te folikulat e qimeve.',
    section3Body2: 'Zonat që preken më shpesh janë mjekra, buza e sipërme, gjoksi, barku ose shpina. Sasia e qimeve që rriten ndryshon shumë nga një person te tjetri.',
    hairSignsTitle: 'Shenja të mundshme',
    hairSigns: [
      'Rritje më e dukshme e qimeve në fytyrë',
      'Qime më të ashpra në mjekër ose në buzën e sipërme',
      'Rritje qimesh që mund të shfaqet në gjoks, bark ose shpinë',
      'Hollim gradual i flokëve në majë të kokës',
    ],
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Rritja e qimeve varet edhe nga faktorë gjenetikë dhe individualë. Një rritje e dukshme qimesh nuk do të thotë automatikisht se ke PCOS.',
    section4Body1: 'Disa gra me PCOS vënë re edhe një ulje të dendësisë së flokëve. Hollimi mund të duket sidomos në majë të kokës ose përgjatë vijës së ndarjes.',
    section4Body2: 'Kjo mund të zhvillohet gradualisht. Është e rëndësishme të dallohet rënia e flokëve që lidhet me hormonet nga shkaqe të tjera të mundshme, si një deficit, një problem i tiroides, disa barna ose një periudhë me stres të madh.',
    alert1Title: 'Vlen të theksohet',
    alert1Text: 'Rënia e flokëve që është e madhe, e shpejtë ose e pazakontë meriton një vlerësim mjekësor për të gjetur shkakun.',
    section5Body: 'Një rutinë e thjeshtë dhe e qëndrueshme është përgjithësisht më e mirë se përdorimi i shumë produkteve njëri mbi tjetrin. Qëllimi është pastrimi, hidratimi dhe mbrojtja e lëkurës, duke kufizuar çdo gjë që mund ta mbajë acarimin.',
    careHabits: [
      'Një rutinë e butë dhe e qëndrueshme për lëkurën',
      'Mbrojtje nga dielli çdo ditë',
      'Një dietë e ekuilibruar',
      'Durim: rezultatet kërkojnë kohë',
    ],
    section6Body1: 'Kur flokët bëhen më të hollë, mund të ndihmojë të kufizosh stresin e përsëritur mbi to: nxehtësinë e tepërt, krehjet shumë të ngushta ose trajtimet kimike të shpeshta.',
    section6Body2: 'Një konsultë dermatologjike mund të ketë vlerë nëse dendësia e flokëve vazhdon të ulet, për të ndihmuar në gjetjen e shkakut dhe për të diskutuar trajtimet e mundshme.',
    practicalTitle: 'Këshilla praktike',
    practicalTips: [
      'Zgjidh produkte të buta dhe shmang shtresëzimin e disa trajtimeve acaruese',
      'Pastro lëkurën pa e tharë tepër, në mëngjes dhe në mbrëmje nëse është e nevojshme',
      'Përdor mbrojtje nga dielli kur lëkura është e ekspozuar',
      'Shmang shtrydhjen e puçrrave për të kufizuar njollat dhe shenjat',
      'Kërko këshillën e një profesionisti nëse simptomat vazhdojnë ose përkeqësohen',
    ],
    section7Body: 'Menaxhimi varet nga simptomat, intensiteti i tyre, ndikimi në cilësinë e jetës dhe objektivat e secilës grua. Mund të ndihmojë të punosh në disa drejtime, në vend që të kërkosh një zgjidhje të vetme.',
    miniCards: [
      {
        title: 'Lëkura',
        text: 'Një rutinë e përshtatshme dhe këshilla dermatologjike nëse është e nevojshme.',
      },
      {
        title: 'Rritja e qimeve',
        text: 'Zgjidhje kozmetike ose mjekësore sipas situatës.',
      },
      {
        title: 'Flokët',
        text: 'Gjej shkakun përpara se të zgjedhësh një trajtim për to.',
      },
      {
        title: 'Mirëqenia',
        text: 'Merr parasysh se si ndikojnë simptomat te ti emocionalisht.',
      },
    ],
    section8Body1: 'Është mirë të flasësh me një profesionist të shëndetësisë kur akneja bëhet e vazhdueshme ose e dhimbshme, kur qimet rriten shpejt, kur flokët hollohen dukshëm ose kur këto ndryshime shoqërohen me cikle shumë të parregullta.',
    section8Body2: 'Një dermatolog mund të merret me simptomat e lëkurës dhe të flokëve. Një gjinekolog ose një profesionist tjetër i kualifikuar mund të vlerësojë edhe kontekstin hormonal dhe çdo shenjë tjetër të mundshme të PCOS.',
    alert2Title: 'Shko te mjeku nëse është e nevojshme',
    alert2Text: 'Rritja e shpejtë dhe e madhe e qimeve, rënia e papritur e flokëve ose ndryshimet hormonale të pazakonta kërkojnë këshillë mjekësore.',
    ideasReceived: [
      'Të kesh akne nuk do të thotë automatikisht se ke PCOS',
      'Rritja e dukshme e qimeve nuk lidhet domosdoshmërisht vetëm me hormonet',
      'PCOS mund t’i prekë gratë me çdo lloj trupi',
      'Simptomat mund të ndryshojnë me kalimin e kohës dhe nuk janë të njëjta për çdo grua',
    ],
    quoteText: 'Simptomat e dukshme të PCOS mund të të frustrojnë, por ato nuk e përcaktojnë femërsinë tënde, vlerën tënde apo higjienën tënde.',
    summaryTitle: 'Thelbi',
    summaryItems: [
      'PCOS mund të prekë lëkurën, qimet e trupit dhe flokët e kokës.',
      'Simptomat ndryshojnë shumë nga një grua te tjetra.',
      'Një simptomë e vetme nuk mjafton për të diagnostikuar PCOS.',
      'Ekzistojnë zgjidhje që ndihmojnë në përmirësimin e simptomave.',
      'Përkrahja mjekësore mund të të ndihmojë të zgjedhësh qasjen e duhur për ty.',
    ],
    finalTipTitle: 'Çfarë të mbash mend',
    finalTipText: 'Akneja, rritja e tepërt e qimeve ose rënia e flokëve mund të jenë simptoma të PCOS, por nuk janë të pashmangshme. Një qasje e personalizuar mund të të ndihmojë t’i menaxhosh më mirë simptomat dhe të ndihesh më rehat çdo ditë.',
    disclaimerText: 'Ky artikull është vetëm për informim dhe nuk zëvendëson një konsultë mjekësore, një diagnozë ose një trajtim të personalizuar.',
    shareMessage: 'Lëkura, flokët dhe simptomat e dukshme të PCOS — AWA',
  },
  ja: {
    badge: 'PCOS',
    title: '肌・髪と\n目に見える症状',
    metaDuration: '読了9分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: 'PCOSでは、肌や体毛、頭髪に目に見える変化が現れることがあります。その原因を知ると変化に気づきやすくなり、どのような対処が考えられるかも分かりやすくなります。',
    infoBannerText: 'これらのサインはよく見られますが、それだけでPCOSと診断される、あるいは必ず現れるというものではありません。',
    contentsTitle: 'この記事の内容',
    contents: [
      'これらの症状が現れる理由',
      'ホルモンの影響によるニキビ',
      '体毛の増加',
      '髪が薄くなること',
      '肌のお手入れ',
      '髪のお手入れ',
      '日々の生活で役立つこと',
      '医師に相談するタイミング',
      'よくある誤解',
      '大切なポイント',
    ],
    section1Body1: 'PCOSでは、アンドロゲンの分泌や働きが高まっていることがあります。アンドロゲンは女性の体にも自然に存在するホルモンです。その作用が強く出ると、皮脂腺や毛包、毛髪の成長サイクルに影響することがあります。',
    section1Body2: 'このホルモンの影響が、なかなか治らないニキビや体毛の増加、人によっては髪が薄くなることの大きな理由と考えられています。',
    tip1Title: '知っておきたいこと',
    tip1Text: '目に見える症状の多さは、PCOSの重さをそのまま表すわけではありません。いくつもの症状が目立つ人もいれば、ほとんど、あるいはまったく見られない人もいます。',
    section2Body1: 'ホルモンの変化に関連するニキビは、思春期を過ぎても現れたり、続いたりすることがあります。あご、フェイスライン、頬の下のほう、ときには首にできやすい傾向があります。',
    section2Body2: '人によっては、ニキビが深く、触ると痛み、繰り返しできることもあります。いじったり、炎症がとくに強かったりすると、色素沈着や跡が残ることもあります。',
    skinSignsTitle: '考えられる肌のサイン',
    skinSigns: [
      'なかなか治らないニキビ、とくに顔の下半分のもの',
      '以前より肌が脂っぽくなる',
      'ホルモンの変化に続いて起こることのあるニキビの悪化',
      'ニキビが悪化したあとに残る跡や色素沈着',
    ],
    section3Body1: '多毛症とは、女性では通常あまり生えない部位で、太く濃い毛（終毛）が増えることをいいます。PCOSでは、アンドロゲンが毛包に作用することと関連している場合があります。',
    section3Body2: 'とくに影響が出やすい部位は、あご、上唇、胸、お腹、背中です。毛の増え方には個人差がとても大きくあります。',
    hairSignsTitle: '考えられるサイン',
    hairSigns: [
      '顔の毛が以前より目立つ',
      'あごや上唇の毛が太く硬くなる',
      '胸、お腹、背中に毛が生えてくることがある',
      '頭頂部の髪が少しずつ薄くなる',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: '毛の生え方には、遺伝や個人の体質も関係しています。毛が目立つからといって、必ずしもPCOSであるとは限りません。',
    section4Body1: 'PCOSのある女性の中には、髪の密度が減ってきたと感じる人もいます。髪が薄くなることは、頭頂部や分け目でとくに目立つことがあります。',
    section4Body2: '少しずつ進むこともあります。ホルモンに関連した抜け毛と、ほかに考えられる原因（栄養の不足、甲状腺の問題、特定の薬、強いストレスがかかった時期など）とを見分けることが大切です。',
    alert1Title: '覚えておきたいこと',
    alert1Text: '抜け毛が多い、急に増えた、いつもと違うといった場合は、原因を調べるために医療機関での評価を受けることをおすすめします。',
    section5Body: 'たくさんの製品を重ねるより、シンプルなお手入れを続けるほうが一般的に適しています。目安は、肌を洗い、うるおいを与え、守りつつ、刺激が長引く原因になりそうなものを控えることです。',
    careHabits: [
      'やさしく、無理なく続けられるスキンケア',
      '毎日の日焼け対策',
      'バランスのよい食事',
      'あせらないこと。効果が出るには時間がかかります',
    ],
    section6Body1: '髪が細くなってきたときは、髪に繰り返しかかる負担を減らすと役立つことがあります。たとえば、過度な熱、きつく結ぶヘアスタイル、頻繁な化学処理（パーマやカラーなど）です。',
    section6Body2: '髪の密度が減り続ける場合は、皮膚科を受診すると、原因を調べたり、受けられる治療について相談したりできます。',
    practicalTitle: '実践のヒント',
    practicalTips: [
      'やさしい製品を選び、刺激になりうる治療を何種類も重ねないようにする',
      '肌をこすりすぎずに洗う。必要に応じて朝と夜に行う',
      '肌が出るときは日焼け対策をする',
      '跡が残りにくいよう、ニキビをいじらない',
      '症状が続く、または悪化する場合は専門家に相談する',
    ],
    section7Body: 'どのような対処をするかは、症状の内容、強さ、生活の質への影響、そして一人ひとりの希望によって変わります。ひとつの解決策を探すより、いくつかの面から取り組むほうが役立つことがあります。',
    miniCards: [
      {
        title: '肌',
        text: '合ったお手入れと、必要に応じた皮膚科でのアドバイス。',
      },
      {
        title: '体毛',
        text: '状況に応じた美容面または医療面での対処。',
      },
      {
        title: '髪',
        text: '治療を選ぶ前に原因を見極めること。',
      },
      {
        title: '心の健やかさ',
        text: '症状が心に与える影響にも目を向けること。',
      },
    ],
    section8Body1: 'ニキビが長引く、または痛みを伴う場合、毛が急に増えた場合、髪がはっきり薄くなった場合、あるいはこうした変化に非常に不規則な周期が伴う場合は、医療従事者に相談するのがよいでしょう。',
    section8Body2: '皮膚科医は肌や髪の症状に対応できます。婦人科医やほかの資格を持つ専門家は、ホルモンの状態やPCOSのほかのサインの可能性についても評価できます。',
    alert2Title: '必要なときは医師に相談を',
    alert2Text: '毛が急激に増える、大きく変化する、突然髪が抜ける、あるいはいつもと違うホルモンの変化があるときは、医療機関でのアドバイスが必要です。',
    ideasReceived: [
      'ニキビがあるからといって、必ずしもPCOSとは限りません',
      '毛が目立つのは、ホルモンだけが原因とは限りません',
      'PCOSはどんな体型の女性にも起こりえます',
      '症状は時間とともに変わることがあり、すべての女性で同じではありません',
    ],
    quoteText: 'PCOSの目に見える症状はつらく感じられることがありますが、あなたの女性らしさや価値、清潔さを左右するものではありません。',
    summaryTitle: '大切なこと',
    summaryItems: [
      'PCOSは、肌、体毛、頭髪に影響することがあります。',
      '症状は女性によって大きく異なります。',
      'ひとつの症状だけでPCOSと診断することはできません。',
      '症状を和らげるための対処法があります。',
      '医療面のサポートは、自分に合った方法を選ぶ助けになります。',
    ],
    finalTipTitle: '大切なポイント',
    finalTipText: 'ニキビ、毛の増加、抜け毛はPCOSの症状のことがありますが、避けられないものではありません。一人ひとりに合った対応をすることで、症状とうまく付き合い、日々をより心地よく過ごしやすくなります。',
    disclaimerText: 'この記事は情報提供のみを目的としており、医師の診察、診断、個別の治療に代わるものではありません。',
    shareMessage: '肌・髪とPCOSの目に見える症状 — AWA',
  },
  ko: {
    badge: 'PCOS',
    title: '피부, 모발,\n눈에 보이는 증상',
    metaDuration: '9분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: 'PCOS는 피부, 체모, 두피 모발에 눈에 보이는 변화를 일으킬 수 있어요. 이런 변화가 어디에서 오는지 알면 알아차리기도, 어떤 해결책을 고려할 수 있는지 알기도 쉬워져요.',
    infoBannerText: '이런 징후는 흔하지만, 그것만으로는 PCOS의 필수 조건도 아니고 진단 근거도 되지 않아요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    contents: [
      '이런 증상이 나타나는 이유',
      '호르몬성 여드름',
      '과도한 털 성장',
      '모발이 가늘어지는 증상',
      '피부 관리하기',
      '모발 관리하기',
      '일상에서 도움이 되는 것',
      '의사를 만나야 할 때',
      '흔한 오해',
      '핵심 정리',
    ],
    section1Body1: 'PCOS에서는 안드로겐의 생성이나 활성이 늘어날 수 있어요. 안드로겐은 여성의 몸에도 자연스럽게 있는 호르몬이에요. 그 영향이 더 뚜렷해지면 피지선, 모낭, 모발 성장 주기에 영향을 줄 수 있어요.',
    section1Body2: '이런 호르몬의 영향은 지속되는 여드름, 털 성장 증가, 그리고 일부 여성에게서 나타나는 모발 가늘어짐을 설명해 주는 큰 이유가 될 수 있어요.',
    tip1Title: '알아두면 좋아요',
    tip1Text: '눈에 보이는 증상이 PCOS의 심한 정도를 그대로 나타내는 것은 아니에요. 어떤 여성은 눈에 보이는 증상이 여러 가지일 수 있고, 어떤 여성은 거의 없거나 전혀 없을 수도 있어요.',
    section2Body1: '호르몬 변화와 관련된 여드름은 청소년기 이후에 생기거나 계속될 수 있어요. 주로 턱, 턱선, 아래쪽 볼, 때로는 목에 나타나는 경향이 있어요.',
    section2Body2: '어떤 사람은 여드름이 깊고 아프며 반복해서 생기기도 해요. 짜거나 염증이 특히 심했을 때는 색소 침착이나 흉터가 남을 수도 있어요.',
    skinSignsTitle: '나타날 수 있는 피부 징후',
    skinSigns: [
      '특히 얼굴 아래쪽에 지속되는 여드름',
      '예전보다 기름진 피부',
      '호르몬 변화 뒤에 가끔 이어지는 여드름 악화',
      '여드름이 악화된 뒤 남는 자국이나 흉터',
    ],
    section3Body1: '다모증은 여성에게 보통 나지 않는 부위에 굵은 털이 더 많이 자라는 것을 말해요. PCOS에서는 안드로겐이 모낭에 미치는 영향과 관련될 수 있어요.',
    section3Body2: '가장 흔하게 영향을 받는 부위는 턱, 윗입술, 가슴, 배, 등이에요. 털이 자라는 정도는 사람마다 상당히 달라요.',
    hairSignsTitle: '나타날 수 있는 징후',
    hairSigns: [
      '얼굴에 눈에 띄게 늘어난 털',
      '턱이나 윗입술의 더 굵은 털',
      '가슴, 배, 등에 나타날 수 있는 털 성장',
      '정수리 부분의 모발이 점점 가늘어짐',
    ],
    tip2Title: '알아두면 좋아요',
    tip2Text: '털 성장은 유전적 요인과 개인별 요인에도 영향을 받아요. 털이 눈에 띄게 자란다고 해서 자동으로 PCOS가 있다는 뜻은 아니에요.',
    section4Body1: 'PCOS가 있는 일부 여성은 모발 밀도가 줄어드는 것을 느끼기도 해요. 정수리나 가르마 부분에서 특히 눈에 띌 수 있어요.',
    section4Body2: '서서히 진행될 수 있어요. 호르몬과 관련된 탈모를 결핍, 갑상선 문제, 특정 약물, 스트레스가 큰 시기 같은 다른 가능한 원인과 구분하는 것이 중요해요.',
    alert1Title: '참고해 주세요',
    alert1Text: '탈모가 심하거나 빠르게 진행되거나 평소와 다르다면 원인을 알아보기 위해 진료를 받아 보는 것이 좋아요.',
    section5Body: '여러 제품을 겹쳐 쓰기보다 단순하고 꾸준한 관리가 보통 더 좋아요. 피부를 깨끗이 씻고, 보습하고, 보호하되 자극이 계속되게 하는 요인은 줄이는 것이 목표예요.',
    careHabits: [
      '순하고 꾸준한 피부 관리 루틴',
      '매일 자외선 차단',
      '균형 잡힌 식단',
      '인내심: 결과가 나타나기까지 시간이 걸려요',
    ],
    section6Body1: '모발이 가늘어지면 반복적인 자극을 줄이는 것이 도움이 될 수 있어요. 과도한 열, 너무 꽉 묶는 헤어스타일, 잦은 화학 시술 등이 해당돼요.',
    section6Body2: '모발 밀도가 계속 줄어든다면 피부과 진료를 받아 볼 만해요. 원인을 파악하고 가능한 치료를 상담하는 데 도움이 돼요.',
    practicalTitle: '실천 팁',
    practicalTips: [
      '순한 제품을 고르고, 자극이 되는 제품을 여러 개 겹쳐 쓰지 않아요',
      '피부가 땅기지 않게 씻어 주세요. 필요하면 아침과 저녁에 해요',
      '피부가 노출될 때는 자외선 차단제를 사용해요',
      '자국과 흉터를 줄이기 위해 여드름을 짜지 않아요',
      '증상이 계속되거나 심해지면 전문가에게 조언을 구해요',
    ],
    section7Body: '관리 방법은 증상, 증상의 강도, 삶의 질에 미치는 영향, 그리고 각 여성의 목표에 따라 달라요. 하나의 해결책만 찾기보다 여러 방향으로 접근하는 것이 도움이 될 수 있어요.',
    miniCards: [
      {
        title: '피부',
        text: '알맞은 관리 루틴과 필요하면 피부과 조언.',
      },
      {
        title: '털 성장',
        text: '상황에 따라 미용적 또는 의학적 해결책.',
      },
      {
        title: '모발',
        text: '치료를 고르기 전에 원인을 먼저 파악해요.',
      },
      {
        title: '마음 건강',
        text: '증상이 정서에 미치는 영향도 함께 살펴보세요.',
      },
    ],
    section8Body1: '여드름이 계속되거나 아플 때, 털이 빠르게 늘 때, 모발이 눈에 띄게 가늘어질 때, 또는 이런 변화가 매우 불규칙한 주기와 함께 나타날 때는 의료 전문가와 상담하는 것이 좋아요.',
    section8Body2: '피부과 의사는 피부와 모발 증상을 다룰 수 있어요. 산부인과 의사나 다른 자격을 갖춘 전문가는 호르몬 상태와 PCOS의 다른 가능한 징후도 평가할 수 있어요.',
    alert2Title: '필요하면 의사를 만나세요',
    alert2Text: '털이 빠르고 뚜렷하게 늘거나, 갑자기 머리카락이 빠지거나, 평소와 다른 호르몬 변화가 있다면 의학적 조언이 필요해요.',
    ideasReceived: [
      '여드름이 있다고 해서 자동으로 PCOS가 있다는 뜻은 아니에요',
      '눈에 띄는 털 성장이 꼭 호르몬만의 문제는 아니에요',
      'PCOS는 어떤 체형의 여성에게나 나타날 수 있어요',
      '증상은 시간이 지나면서 달라질 수 있고, 여성마다 같지 않아요',
    ],
    quoteText: 'PCOS의 눈에 보이는 증상은 속상할 수 있지만, 여성스러움이나 나의 가치, 위생을 결정짓지 않아요.',
    summaryTitle: '핵심 요약',
    summaryItems: [
      'PCOS는 피부, 체모, 두피 모발에 영향을 줄 수 있어요.',
      '증상은 여성마다 매우 다양해요.',
      '증상 하나만으로는 PCOS를 진단할 수 없어요.',
      '증상을 개선하는 데 도움이 되는 해결책이 있어요.',
      '의료적 도움을 받으면 나에게 맞는 방법을 고르는 데 도움이 돼요.',
    ],
    finalTipTitle: '핵심 정리',
    finalTipText: '여드름, 과도한 털 성장, 탈모는 PCOS의 증상일 수 있지만 피할 수 없는 것은 아니에요. 개인에게 맞춘 접근은 증상을 더 잘 관리하고 일상에서 더 편안하게 지내는 데 도움이 될 수 있어요.',
    disclaimerText: '이 아티클은 정보 제공만을 목적으로 하며, 진료, 진단, 개인 맞춤 치료를 대신하지 않아요.',
    shareMessage: '피부, 모발, 눈에 보이는 PCOS 증상 — AWA',
  },
  'pt-PT': {
    badge: 'SOP',
    title: 'Pele, cabelo e\nsintomas visíveis',
    metaDuration: '9 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'A síndrome do ovário poliquístico (SOP) pode causar alterações visíveis na pele, nos pelos do corpo ou no cabelo. Perceber a sua origem facilita o reconhecimento destes sinais e permite saber que soluções podem ser consideradas.',
    infoBannerText: 'Estes sinais são frequentes, mas, por si só, não são necessários nem suficientes para diagnosticar a SOP.',
    contentsTitle: 'Neste artigo',
    contents: [
      'Porque aparecem estes sintomas',
      'Acne hormonal',
      'Crescimento excessivo de pelos',
      'Rarefação capilar',
      'Cuidar da pele',
      'Cuidar do cabelo',
      'O que pode ajudar no dia a dia',
      'Quando consultar um médico',
      'Ideias feitas',
      'Pontos essenciais',
    ],
    section1Body1: 'A SOP pode envolver uma maior produção ou atividade de androgénios, hormonas que também estão naturalmente presentes nas mulheres. Quando o seu efeito é mais acentuado, podem influenciar as glândulas sebáceas, os folículos pilosos e o ciclo de crescimento do cabelo.',
    section1Body2: 'Esta influência hormonal explica, em grande parte, o aparecimento de acne persistente, de um maior crescimento de pelos ou, em algumas mulheres, de rarefação capilar.',
    tip1Title: 'Bom saber',
    tip1Text: 'Os sintomas visíveis não refletem necessariamente a gravidade da SOP. Uma mulher pode ter vários sintomas visíveis, enquanto outra pode ter poucos ou nenhuns.',
    section2Body1: 'A acne associada a alterações hormonais pode surgir ou persistir para além da adolescência. Tende a afetar o queixo, a linha da mandíbula, a parte inferior das bochechas ou, por vezes, o pescoço.',
    section2Body2: 'Em algumas pessoas, as lesões são profundas, dolorosas e recorrentes. Também podem deixar marcas pigmentadas ou cicatrizes quando são espremidas ou quando estão particularmente inflamadas.',
    skinSignsTitle: 'Possíveis sinais na pele',
    skinSigns: [
      'Acne persistente, sobretudo na parte inferior do rosto',
      'Pele mais oleosa do que antes',
      'Surtos de acne que por vezes acompanham alterações hormonais',
      'Marcas ou cicatrizes deixadas após os surtos',
    ],
    section3Body1: 'O hirsutismo designa um crescimento aumentado de pelos terminais em zonas habitualmente não afetadas nas mulheres. No contexto da SOP, pode estar relacionado com o efeito dos androgénios nos folículos pilosos.',
    section3Body2: 'As zonas mais frequentemente afetadas são o queixo, o buço, o peito, o abdómen ou as costas. A quantidade de pelos varia consideravelmente de pessoa para pessoa.',
    hairSignsTitle: 'Possíveis sinais',
    hairSigns: [
      'Crescimento de pelos mais visível no rosto',
      'Pelos mais grossos no queixo ou no buço',
      'Crescimento de pelos que pode surgir no peito, no abdómen ou nas costas',
      'Rarefação gradual do cabelo no topo da cabeça',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'O crescimento de pelos depende também de fatores genéticos e individuais. Um crescimento de pelos notório não significa automaticamente que exista SOP.',
    section4Body1: 'Algumas mulheres com SOP notam também uma diminuição da densidade capilar. A rarefação pode ser particularmente visível no topo da cabeça ou ao longo da risca.',
    section4Body2: 'Pode instalar-se gradualmente. É importante distinguir a queda de cabelo de origem hormonal de outras causas possíveis, como uma carência, um problema da tiroide, certos medicamentos ou um período de stress intenso.',
    alert1Title: 'A ter em conta',
    alert1Text: 'Uma queda de cabelo significativa, rápida ou fora do habitual merece uma avaliação médica para investigar a causa.',
    section5Body: 'Uma rotina simples e regular é, em geral, preferível à sobreposição de muitos produtos. O objetivo é limpar, hidratar e proteger a pele, limitando tudo o que possa manter a irritação.',
    careHabits: [
      'Uma rotina de cuidados suave e regular',
      'Proteção solar diária',
      'Uma alimentação equilibrada',
      'Paciência: os resultados levam tempo',
    ],
    section6Body1: 'Quando o cabelo se torna mais fino, pode ajudar limitar as agressões repetidas: calor excessivo, penteados muito apertados ou tratamentos químicos frequentes.',
    section6Body2: 'Uma consulta de dermatologia pode ser útil se a densidade capilar continuar a diminuir, para ajudar a identificar a causa e discutir os tratamentos disponíveis.',
    practicalTitle: 'Dicas práticas',
    practicalTips: [
      'Escolha produtos suaves e evite sobrepor vários tratamentos irritantes',
      'Limpe a pele sem a agredir, de manhã e à noite, se necessário',
      'Use proteção solar quando a pele estiver exposta',
      'Evite espremer as imperfeições para limitar marcas e cicatrizes',
      'Peça aconselhamento a um profissional se os sintomas persistirem ou piorarem',
    ],
    section7Body: 'A abordagem depende dos sintomas, da sua intensidade, do impacto na qualidade de vida e dos objetivos de cada mulher. Pode ser útil atuar em várias frentes, em vez de procurar uma única solução.',
    miniCards: [
      {
        title: 'Pele',
        text: 'Uma rotina adequada e aconselhamento dermatológico, se necessário.',
      },
      {
        title: 'Crescimento de pelos',
        text: 'Soluções cosméticas ou médicas, consoante a situação.',
      },
      {
        title: 'Cabelo',
        text: 'Identificar a causa antes de escolher um tratamento.',
      },
      {
        title: 'Bem-estar',
        text: 'Ter em conta o impacto emocional dos sintomas.',
      },
    ],
    section8Body1: 'É aconselhável falar com um profissional de saúde quando a acne se torna persistente ou dolorosa, quando o crescimento de pelos aumenta rapidamente, quando o cabelo enfraquece de forma notória ou quando estas alterações surgem acompanhadas de ciclos muito irregulares.',
    section8Body2: 'Um dermatologista pode tratar os sintomas da pele e do cabelo. Um ginecologista ou outro profissional qualificado pode também avaliar o contexto hormonal e quaisquer outros sinais possíveis de SOP.',
    alert2Title: 'Consulte um médico, se necessário',
    alert2Text: 'Um crescimento de pelos rápido e significativo, uma queda de cabelo súbita ou alterações hormonais fora do habitual justificam aconselhamento médico.',
    ideasReceived: [
      'Ter acne não significa automaticamente ter SOP',
      'O crescimento visível de pelos nem sempre está ligado apenas às hormonas',
      'A SOP pode afetar mulheres de qualquer tipo de corpo',
      'Os sintomas podem mudar ao longo do tempo e não são iguais em todas as mulheres',
    ],
    quoteText: 'Os sintomas visíveis da SOP podem ser frustrantes, mas não definem a sua feminilidade, o seu valor nem a sua higiene.',
    summaryTitle: 'O essencial',
    summaryItems: [
      'A SOP pode afetar a pele, os pelos do corpo e o cabelo.',
      'Os sintomas variam muito de mulher para mulher.',
      'Um único sintoma não basta para diagnosticar a SOP.',
      'Existem soluções que ajudam a melhorar os sintomas.',
      'O acompanhamento médico pode ajudar a escolher a abordagem mais adequada para si.',
    ],
    finalTipTitle: 'Pontos essenciais',
    finalTipText: 'A acne, o crescimento excessivo de pelos ou a queda de cabelo podem ser sintomas da SOP, mas não são inevitáveis. Uma abordagem personalizada pode ajudar a gerir melhor os sintomas e a sentir-se mais confortável no dia a dia.',
    disclaimerText: 'Este artigo é meramente informativo e não substitui uma consulta médica, um diagnóstico nem um tratamento personalizado.',
    shareMessage: 'Pele, cabelo e sintomas visíveis da SOP — AWA',
  },
  bn: {
    badge: 'পিসিওএস',
    title: 'ত্বক, চুল এবং\nদৃশ্যমান উপসর্গ',
    metaDuration: 'পড়তে 9 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'শুরুর স্তর',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'পলিসিস্টিক ওভারি সিনড্রোম (পিসিওএস) ত্বক, শরীরের লোম বা মাথার চুলে দৃশ্যমান পরিবর্তন ঘটাতে পারে। এগুলো কোথা থেকে আসে তা বুঝলে চিনে নেওয়া এবং কোন সমাধানগুলো বিবেচনা করা যেতে পারে তা জানা সহজ হয়।',
    infoBannerText: 'এই লক্ষণগুলো সাধারণ, কিন্তু শুধু এগুলোই পিসিওএস নির্ণয়ের জন্য আবশ্যক বা যথেষ্ট নয়।',
    contentsTitle: 'এই নিবন্ধে',
    contents: [
      'এই উপসর্গগুলো কেন দেখা দেয়',
      'হরমোনজনিত ব্রণ',
      'অতিরিক্ত লোম গজানো',
      'চুল পাতলা হওয়া',
      'আপনার ত্বকের যত্ন',
      'আপনার চুলের যত্ন',
      'প্রতিদিন কী সাহায্য করতে পারে',
      'কখন ডাক্তার দেখাবেন',
      'প্রচলিত ভুল ধারণা',
      'মূল কথা',
    ],
    section1Body1: 'পিসিওএস-এ অ্যান্ড্রোজেনের উৎপাদন বা কার্যকারিতা বেড়ে যেতে পারে। অ্যান্ড্রোজেন এমন হরমোন যা নারীদের শরীরেও স্বাভাবিকভাবে থাকে। এর প্রভাব বেশি স্পষ্ট হলে তা তেল গ্রন্থি, লোমকূপ এবং চুল গজানোর চক্রকে প্রভাবিত করতে পারে।',
    section1Body2: 'এই হরমোনজনিত প্রভাবই মূলত স্থায়ী ব্রণ, লোম গজানো বেড়ে যাওয়া, কিংবা কিছু নারীর ক্ষেত্রে চুল পাতলা হওয়ার ব্যাখ্যা দিতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'দৃশ্যমান উপসর্গ দিয়ে পিসিওএস কতটা তীব্র তা সবসময় বোঝা যায় না। একজন নারীর বেশ কয়েকটি দৃশ্যমান উপসর্গ থাকতে পারে, আবার অন্যজনের খুব কম বা একেবারেই নাও থাকতে পারে।',
    section2Body1: 'হরমোনের পরিবর্তনের সঙ্গে যুক্ত ব্রণ কৈশোর পার হওয়ার পরও দেখা দিতে বা থেকে যেতে পারে। এটি সাধারণত থুতনি, চোয়ালের রেখা, গালের নিচের অংশ, কখনো গলায় হয়।',
    section2Body2: 'কারও কারও ক্ষেত্রে ব্রণগুলো গভীর, ব্যথাযুক্ত এবং বারবার ফিরে আসে। খোঁটাখুঁটি করলে বা বেশি ফুলে উঠলে এগুলো থেকে কালচে দাগ বা ক্ষতচিহ্নও থেকে যেতে পারে।',
    skinSignsTitle: 'ত্বকের সম্ভাব্য লক্ষণ',
    skinSigns: [
      'স্থায়ী ব্রণ, বিশেষ করে মুখের নিচের অংশে',
      'আগের চেয়ে তৈলাক্ত ত্বক',
      'হরমোনের পরিবর্তনের পর মাঝে মাঝে ব্রণ বেড়ে যাওয়া',
      'ব্রণ ভালো হওয়ার পর থেকে যাওয়া দাগ বা ক্ষতচিহ্ন',
    ],
    section3Body1: 'হিরসুটিজম বলতে নারীদের সাধারণত যেসব স্থানে মোটা লোম গজায় না, সেসব স্থানে মোটা লোম বেড়ে যাওয়া বোঝায়। পিসিওএস-এর ক্ষেত্রে এটি লোমকূপের ওপর অ্যান্ড্রোজেনের প্রভাবের সঙ্গে যুক্ত হতে পারে।',
    section3Body2: 'সবচেয়ে বেশি আক্রান্ত স্থানগুলো হলো থুতনি, উপরের ঠোঁট, বুক, পেট বা পিঠ। কতটা লোম গজায় তা একজন থেকে অন্যজনে বেশ ভিন্ন হয়।',
    hairSignsTitle: 'সম্ভাব্য লক্ষণ',
    hairSigns: [
      'মুখে আরও স্পষ্টভাবে দৃশ্যমান লোম',
      'থুতনি বা ঊর্ধ্বঠোঁটে আরও মোটা লোম',
      'বুক, পেট বা পিঠে লোম গজানো',
      'মাথার তালুর শীর্ষে ধীরে ধীরে চুল পাতলা হয়ে যাওয়া',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'লোম গজানো বংশগত ও ব্যক্তিগত নানা বিষয়ের ওপরও নির্ভর করে। চোখে পড়ার মতো লোম গজালেই যে পিসিওএস আছে, এমন নয়।',
    section4Body1: 'পিসিওএস আছে এমন কিছু নারী চুলের ঘনত্ব কমে যাওয়াও লক্ষ করেন। মাথার তালুর শীর্ষে বা সিঁথির পাশে চুল পাতলা হওয়া বিশেষভাবে চোখে পড়তে পারে।',
    section4Body2: 'এটি ধীরে ধীরে হতে পারে। হরমোনজনিত চুল পড়াকে অন্যান্য সম্ভাব্য কারণ থেকে আলাদা করা জরুরি, যেমন পুষ্টির ঘাটতি, থাইরয়েডের সমস্যা, কিছু ওষুধ, বা উল্লেখযোগ্য মানসিক চাপের সময়।',
    alert1Title: 'লক্ষ করার মতো',
    alert1Text: 'উল্লেখযোগ্য, দ্রুত বা অস্বাভাবিক চুল পড়লে কারণ খুঁজে বের করতে চিকিৎসকের মূল্যায়ন প্রয়োজন।',
    section5Body: 'অনেক পণ্য একসঙ্গে ব্যবহারের চেয়ে সহজ ও নিয়মিত রুটিন সাধারণত ভালো। লক্ষ্য হলো ত্বক পরিষ্কার করা, আর্দ্র রাখা ও সুরক্ষিত রাখা এবং যা কিছু জ্বালা চালু রাখতে পারে তা সীমিত করা।',
    careHabits: [
      'ত্বকের যত্নের একটি মৃদু ও নিয়মিত রুটিন',
      'প্রতিদিন রোদ থেকে সুরক্ষা',
      'সুষম খাদ্যাভ্যাস',
      'ধৈর্য: ফল পেতে সময় লাগে',
    ],
    section6Body1: 'চুল সরু হয়ে এলে তার ওপর বারবার চাপ কমানো সহায়ক হতে পারে: অতিরিক্ত তাপ, খুব টাইট করে বাঁধা চুলের স্টাইল, বা ঘন ঘন রাসায়নিক ট্রিটমেন্ট।',
    section6Body2: 'চুলের ঘনত্ব কমতেই থাকলে চর্মরোগ বিশেষজ্ঞের পরামর্শ নেওয়া উপযোগী হতে পারে, যাতে কারণ নির্ধারণ করা যায় এবং উপলব্ধ চিকিৎসা নিয়ে আলোচনা করা যায়।',
    practicalTitle: 'ব্যবহারিক পরামর্শ',
    practicalTips: [
      'মৃদু পণ্য বেছে নিন এবং জ্বালা ধরাতে পারে এমন একাধিক ট্রিটমেন্ট একসঙ্গে ব্যবহার এড়িয়ে চলুন',
      'ত্বক রুক্ষ না করে পরিষ্কার করুন, প্রয়োজনে সকাল ও সন্ধ্যায়',
      'ত্বক উন্মুক্ত থাকলে রোদ থেকে সুরক্ষা ব্যবহার করুন',
      'দাগ ও ক্ষতচিহ্ন কমাতে ব্রণ খোঁটা এড়িয়ে চলুন',
      'উপসর্গ থেকে গেলে বা বেড়ে গেলে একজন পেশাজীবীর পরামর্শ নিন',
    ],
    section7Body: 'ব্যবস্থাপনা নির্ভর করে উপসর্গ, তার তীব্রতা, জীবনযাত্রার মানে তার প্রভাব এবং প্রত্যেক নারীর লক্ষ্যের ওপর। একটিমাত্র সমাধান খোঁজার চেয়ে একাধিক দিক থেকে কাজ করা সহায়ক হতে পারে।',
    miniCards: [
      {
        title: 'ত্বক',
        text: 'উপযুক্ত রুটিন এবং প্রয়োজনে ত্বক বিশেষজ্ঞের পরামর্শ।',
      },
      {
        title: 'লোম গজানো',
        text: 'পরিস্থিতি অনুযায়ী প্রসাধনী বা চিকিৎসাগত সমাধান।',
      },
      {
        title: 'চুল',
        text: 'চিকিৎসা বেছে নেওয়ার আগে কারণ শনাক্ত করুন।',
      },
      {
        title: 'মানসিক সুস্থতা',
        text: 'উপসর্গের মানসিক প্রভাবকে বিবেচনায় নিন।',
      },
    ],
    section8Body1: 'ব্রণ স্থায়ী বা বেদনাদায়ক হলে, লোম দ্রুত বাড়লে, চুল স্পষ্টভাবে পাতলা হলে, কিংবা এই পরিবর্তনগুলোর সঙ্গে খুব অনিয়মিত চক্র থাকলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলা ভালো।',
    section8Body2: 'ত্বক বিশেষজ্ঞ ত্বক ও চুলের উপসর্গ দেখভাল করতে পারেন। স্ত্রীরোগ বিশেষজ্ঞ বা অন্য কোনো যোগ্য পেশাজীবী হরমোনজনিত প্রেক্ষাপট এবং পিসিওএস-এর অন্যান্য সম্ভাব্য লক্ষণও মূল্যায়ন করতে পারেন।',
    alert2Title: 'প্রয়োজনে ডাক্তার দেখান',
    alert2Text: 'দ্রুত ও উল্লেখযোগ্য লোম গজানো, হঠাৎ চুল পড়া, বা অস্বাভাবিক হরমোনজনিত পরিবর্তনে চিকিৎসকের পরামর্শ প্রয়োজন।',
    ideasReceived: [
      'ব্রণ থাকলেই যে পিসিওএস আছে, এমন নয়',
      'দৃশ্যমান লোম গজানো শুধু হরমোনের সঙ্গেই যুক্ত নাও হতে পারে',
      'পিসিওএস যেকোনো শারীরিক গঠনের নারীকে প্রভাবিত করতে পারে',
      'উপসর্গ সময়ের সঙ্গে বদলাতে পারে এবং প্রত্যেক নারীর ক্ষেত্রে এক রকম নয়',
    ],
    quoteText: 'পিসিওএস-এর দৃশ্যমান উপসর্গ হতাশাজনক হতে পারে, কিন্তু এগুলো আপনার নারীত্ব, আপনার মূল্য বা আপনার পরিচ্ছন্নতাকে সংজ্ঞায়িত করে না।',
    summaryTitle: 'সারকথা',
    summaryItems: [
      'পিসিওএস ত্বক, শরীরের লোম ও মাথার চুলকে প্রভাবিত করতে পারে।',
      'উপসর্গ এক নারী থেকে অন্য নারীতে অনেক ভিন্ন হয়।',
      'একটিমাত্র উপসর্গ পিসিওএস নির্ণয়ের জন্য যথেষ্ট নয়।',
      'উপসর্গ উন্নত করতে সাহায্য করে এমন সমাধান আছে।',
      'চিকিৎসাগত সহায়তা আপনার জন্য সঠিক পদ্ধতি বেছে নিতে সাহায্য করতে পারে।',
    ],
    finalTipTitle: 'মূল কথা',
    finalTipText: 'ব্রণ, অতিরিক্ত লোম গজানো বা চুল পড়া পিসিওএস-এর উপসর্গ হতে পারে, কিন্তু এগুলো অবশ্যম্ভাবী নয়। ব্যক্তিগত চাহিদা অনুযায়ী পদ্ধতি উপসর্গ আরও ভালোভাবে সামলাতে এবং প্রতিদিন স্বস্তিতে থাকতে সাহায্য করতে পারে।',
    disclaimerText: 'এই নিবন্ধ শুধু তথ্যের জন্য এবং এটি চিকিৎসকের পরামর্শ, রোগ নির্ণয় বা ব্যক্তিগত চিকিৎসার বিকল্প নয়।',
    shareMessage: 'ত্বক, চুল এবং পিসিওএস-এর দৃশ্যমান উপসর্গ — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosSkinHairArticleScreen({
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
        <View style={styles.heroWrap}>
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoBanner}>
            <MaterialDesignIcons
              name="information-outline"
              size={21}
              color={theme.colors.primary}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoBannerText}>{content.infoBannerText}</AwaText>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.contents.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.contents[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip1Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.contents[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.sectionCard}>
            <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>{content.skinSignsTitle}</AwaText>

            {content.skinSigns.map(item => (
              <View key={item} style={styles.cardRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.contents[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.sectionCard}>
            <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>{content.hairSignsTitle}</AwaText>

            {content.hairSigns.map(item => (
              <View key={item} style={styles.cardRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip2Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.contents[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alert1Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.contents[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section5Body}</AwaText>

          <View style={styles.daily}>
            {CARE_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.careHabits[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.contents[5]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section6Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section6Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.practicalBox}>
            <View style={styles.practicalHeader}>
              <MaterialDesignIcons
                name="heart-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>{content.practicalTitle}</AwaText>
            </View>

            {content.practicalTips.map((item, index) => (
              <View key={item} style={styles.practicalRow}>
                <View style={styles.practicalNumber}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">
                    {index + 1}
                  </AwaText>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.practicalText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.contents[6]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section7Body}</AwaText>

          <View style={styles.twoColumn}>
            {MINI_CARD_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={icon} style={styles.miniCard}>
                <MaterialDesignIcons
                  name={icon as never}
                  size={25}
                  color={theme.colors.primary}
                />
                <AwaText variant="titleSmall" emphasized style={styles.miniTitle}>
                  {content.miniCards[index].title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.miniText}>
                  {content.miniCards[index].text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>8. {content.contents[7]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section8Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section8Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="medical-bag"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alert2Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>9. {content.contents[8]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.mythList}>
            {content.ideasReceived.map(item => (
              <View key={item} style={styles.mythRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={19}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.mythText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.quoteBox}>
            <MaterialDesignIcons
              name="format-quote-open"
              size={28}
              color={theme.colors.primary}
            />

            <AwaText variant="titleMedium" style={styles.quoteText}>{content.quoteText}</AwaText>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>10. {content.contents[9]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <AwaText variant="titleMedium" emphasized>{content.summaryTitle}</AwaText>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.finalTipText}</AwaText>
            </View>
          </AwaCard>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>{content.disclaimerText}</AwaText>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={9}
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

  infoBanner: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  infoBannerText: {
    flex: 1,
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
  },

  contentRow: {
    minHeight: 40,
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
    width: 25,
  },

  contentText: {
    flex: 1,
  },

  h2: {
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 4,
  },

  sectionCard: {
    marginTop: 16,
    padding: 16,
  },

  cardTitle: {
    marginBottom: 12,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  cardText: {
    flex: 1,
  },

  daily: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

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

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  practicalBox: {
    marginTop: 16,
    padding: 16,
  },

  practicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  practicalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  practicalNumber: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  practicalText: {
    flex: 1,
    marginLeft: 8,
  },

  twoColumn: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  miniCard: {
    width: '48.7%',
    minHeight: 135,
    padding: 12,
    alignItems: 'center',
  },

  miniTitle: {
    marginTop: 8,
  },

  miniText: {
    marginTop: 4,
    textAlign: 'center',
  },

  mythList: {
    marginTop: 16,
    padding: 12,
  },

  mythRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  mythText: {
    flex: 1,
  },

  quoteBox: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },

  quoteText: {
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 12,
  },

  summaryText: {
    flex: 1,
  },

  finalTip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  disclaimer: {
    marginTop: 20,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
