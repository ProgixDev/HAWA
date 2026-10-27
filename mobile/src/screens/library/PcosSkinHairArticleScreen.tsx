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
  da: {
    badge: 'PCOS',
    title: 'Hud, hår og\nsynlige symptomer',
    metaDuration: '9 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Begynderniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Polycystisk ovariesyndrom (PCOS) kan forårsage synlige forandringer i huden, kropshår eller hovedhår. At forstå, hvor de kommer fra, gør det lettere at genkende dem og vide, hvilke løsninger der kan overvejes.',
    infoBannerText: 'Disse symptomer er almindelige, men ingen af dem er nødvendige eller tilstrækkelige for at stille en PCOS-diagnose.',
    contentsTitle: 'I denne artikel',
    contents: [
      'Hvorfor disse symptomer opstår',
      'Hormonel akne',
      'Øget hårvækst',
      'Hårtynding',
      'Pleje af din hud',
      'Pleje af dit hår',
      'Hvad der kan hjælpe i hverdagen',
      'Hvornår du bør søge læge',
      'Almindelige misforståelser',
      'Det vigtigste',
    ],
    section1Body1: 'Ved PCOS kan produktionen eller virkningen af androgener være øget. Androgener er hormoner, der naturligt forekommer i kvindekroppen. Når deres virkning er mere udtalt, kan det påvirke talgkirtler, hårsække og hårvækstcyklussen.',
    section1Body2: 'Det er primært denne hormonelle indvirkning, der kan forklare vedvarende akne, øget hårvækst eller hårtynding hos nogle kvinder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Synlige symptomer afspejler ikke altid, hvor alvorlig PCOS er. Én kvinde kan have flere synlige symptomer, mens en anden har meget få eller ingen.',
    section2Body1: 'Akne forbundet med hormonelle forandringer kan opstå eller vedvare efter teenageårene. Den sidder typisk på hagen, kæbelinjen, det nedre parti af kinderne og nogle gange på halsen.',
    section2Body2: 'Hos nogle er bumperne dybe, smertefulde og tilbagevendende. Klemmer man på dem, eller hæver de meget op, kan de efterlade mørke pletter eller ar.',
    skinSignsTitle: 'Mulige hudtegn',
    skinSigns: [
      'Vedvarende akne, særligt i den nedre del af ansigtet',
      'Fedtere hud end tidligere',
      'Periodevis forværring af akne ved hormonelle forandringer',
      'Pletter eller ar efter helet akne',
    ],
    section3Body1: 'Hirsutisme betegner øget vækst af mørkt, tykt hår på steder, hvor kvinder normalt ikke har det. Ved PCOS kan det hænge sammen med androgenernes virkning på hårsækkene.',
    section3Body2: 'De mest berørte steder er hage, overlæbe, bryst, mave eller ryg. Mængden af hårvækst varierer meget fra person til person.',
    hairSignsTitle: 'Mulige tegn',
    hairSigns: [
      'Mere synligt ansigtshår',
      'Tykkere hår på hage eller overlæbe',
      'Hårvækst på bryst, mave eller ryg',
      'Gradvis hårtynding øverst på issen',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Hårvækst afhænger også af arv og individuelle faktorer. Synlig hårvækst er ikke i sig selv bevis for PCOS.',
    section4Body1: 'Nogle kvinder med PCOS bemærker også reduceret hårtæthed. Udtynding øverst på issen eller langs midterskilningen kan være særligt tydelig.',
    section4Body2: 'Det kan ske gradvist. Det er vigtigt at skelne hormonal hårtab fra andre mulige årsager, såsom næringsstofmangel, skjoldbruskkirtelproblemer, visse lægemidler eller perioder med betydelig stress.',
    alert1Title: 'Bemærk',
    alert1Text: 'Betydelig, hurtig eller usædvanlig hårtab kræver en lægevurdering for at fastslå årsagen.',
    section5Body: 'En enkel, regelmæssig rutine er typisk bedre end at bruge mange produkter på én gang. Målet er at rengøre, fugte og beskytte huden og begrænse det, der kan opretholde irritation.',
    careHabits: [
      'En mild og regelmæssig hudplejerutine',
      'Solbeskyttelse hver dag',
      'Afbalanceret kost',
      'Tålmodighed: resultater tager tid',
    ],
    section6Body1: 'Hvis håret er tyndt, kan det hjælpe at reducere gentagen belastning: overdreven varme, meget stramme frisurer eller hyppige kemiske behandlinger.',
    section6Body2: 'Hvis hårtætheden fortsat mindskes, kan det være en god idé at konsultere en dermatolog for at fastslå årsagen og drøfte de tilgængelige behandlinger.',
    practicalTitle: 'Praktiske råd',
    practicalTips: [
      'Vælg milde produkter og undgå at kombinere flere irriterende behandlinger',
      'Rengør huden uden at skade den, morgen og aften efter behov',
      'Brug solbeskyttelse, når huden er eksponeret',
      'Undgå at klemme på akne for at reducere ar og pletter',
      'Søg faglig vejledning, hvis symptomerne fortsætter eller forværres',
    ],
    section7Body: 'Håndteringen afhænger af symptomerne, deres sværhedsgrad, deres indvirkning på livskvaliteten og den enkelte kvindes mål. Det kan være mere gavnligt at arbejde på flere fronter frem for at lede efter én enkelt løsning.',
    miniCards: [
      {
        title: 'Hud',
        text: 'En passende rutine og om nødvendigt rådgivning fra en dermatolog.',
      },
      {
        title: 'Hårvækst',
        text: 'Kosmetiske eller medicinske løsninger afhængigt af situationen.',
      },
      {
        title: 'Hår',
        text: 'Identificér årsagen, inden du vælger behandling.',
      },
      {
        title: 'Mental trivsel',
        text: 'Tag hensyn til den psykologiske indvirkning af symptomerne.',
      },
    ],
    section8Body1: 'Hvis aknen er vedvarende eller smertefuld, hvis hårvæksten er hurtig, hvis håret tyndes tydeligt ud, eller hvis disse forandringer ledsages af en meget uregelmæssig cyklus, er det en god idé at tale med en sundhedsperson.',
    section8Body2: 'En dermatolog kan tage sig af hud- og hårsymptomer. En gynækolog eller anden kvalificeret fagperson kan også vurdere den hormonelle sammenhæng og andre mulige PCOS-tegn.',
    alert2Title: 'Søg læge om nødvendigt',
    alert2Text: 'Hurtig og betydelig hårvækst, pludselig hårtab eller usædvanlige hormonelle forandringer kræver en lægevurdering.',
    ideasReceived: [
      'Akne er ikke i sig selv et bevis på PCOS',
      'Synlig hårvækst er ikke nødvendigvis kun relateret til hormoner',
      'PCOS kan påvirke kvinder med alle kropstyper',
      'Symptomerne kan ændre sig over tid og er ikke ens hos alle kvinder',
    ],
    quoteText: 'De synlige symptomer på PCOS kan være frustrerende, men de definerer ikke din kvindelighed, din værdi eller din hygiejne.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'PCOS kan påvirke huden, kropshår og hovedhår.',
      'Symptomerne varierer meget fra kvinde til kvinde.',
      'Ét enkelt symptom er ikke nok til at diagnosticere PCOS.',
      'Der findes løsninger, der kan hjælpe med at forbedre symptomerne.',
      'Medicinsk hjælp kan hjælpe dig med at vælge den rigtige tilgang til dig.',
    ],
    finalTipTitle: 'Det vigtigste',
    finalTipText: 'Akne, øget hårvækst eller hårtab kan være symptomer på PCOS, men de er ikke uundgåelige. En tilgang tilpasset dine individuelle behov kan hjælpe dig med bedre at håndtere symptomerne og føle dig mere tilpas i hverdagen.',
    disclaimerText: 'Denne artikel er udelukkende til information og er ikke et alternativ til medicinsk rådgivning, diagnose eller individuel behandling.',
    shareMessage: 'Hud, hår og synlige PCOS-symptomer — AWA',
  },
  sv: {
    badge: 'PCOS',
    title: 'Hud, hår og\nsynlige symtom',
    metaDuration: '9 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Begynderniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Polycystisk ovariesyndrom (PCOS) kan forårsage synlige forandringer i huden, kropshår eller hovedhår. At forstå, hvor de kommer fran, gör det lettere at genkende dem och vide, hvilke lösninger der kan overvejes.',
    infoBannerText: 'Disse symtom ar almindelige, men ingen av dem ar nödvendige eller tilsträkkelige for att stille en PCOS-diagnose.',
    contentsTitle: 'I denne artikel',
    contents: [
      'Hvorfor disse symtom opstår',
      'Hormonel akne',
      'Öget hårväkst',
      'Hårtynding',
      'Pleje av din hud',
      'Pleje av ditt hår',
      'Hvad der kan hjälpe i hverdagen',
      'Hvornår du bör söge läge',
      'Almindelige misforståelser',
      'Det vigtigste',
    ],
    section1Body1: 'Ved PCOS kan produktionen eller virkningen av androgener väre öget. Androgener ar hormoner, der naturligt forekommer i kvindekroppen. Når deres virkning ar mere udtalt, kan det påvirke talgkirtler, hårsäkke och hårväkstcyklussen.',
    section1Body2: 'Det ar primärt denne hormonelle indvirkning, der kan forklare vedvarende akne, öget hårväkst eller hårtynding hos nogle kvinder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Synlige symtom afspejler inte alltid, hvor alvorlig PCOS ar. Én kvinna kan have flere synlige symtom, mens en anden har mycket få eller ingen.',
    section2Body1: 'Akne forbundet med hormonelle forandringer kan opstå eller vedvare efter teenageårene. Den sidder typisk på hagen, käbelinjen, det nedre parti av kinderne och nogle gange på halsen.',
    section2Body2: 'Hos nogle ar bumperne dybe, smertefulde och tilbagevendende. Klemmer man på dem, eller häver de mycket op, kan de efterlade mörke pletter eller ar.',
    skinSignsTitle: 'Mulige hudtegn',
    skinSigns: [
      'Vedvarende akne, särligt i den nedre del av ansigtet',
      'Fedtere hud end tidligere',
      'Periodevis forvärring av akne ved hormonelle forandringer',
      'Pletter eller ar efter helet akne',
    ],
    section3Body1: 'Hirsutisme betegner öget väkst av mörkt, tykt hår på steder, hvor kvinnor normalt inte har det. Ved PCOS kan det hänge sammen med androgenernes virkning på hårsäkkene.',
    section3Body2: 'De mest berörte steder ar hage, overläbe, bryst, mave eller ryg. Mängden av hårväkst varierer mycket fran person till person.',
    hairSignsTitle: 'Mulige tegn',
    hairSigns: [
      'Mere synligt ansigtshår',
      'Tykkere hår på hage eller overläbe',
      'Hårväkst på bryst, mave eller ryg',
      'Gradvis hårtynding överst på issen',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Hårväkst afhänger også av arv och individuelle faktorer. Synlig hårväkst ar inte i sig selv bevis for PCOS.',
    section4Body1: 'Nogle kvinnor med PCOS bemärker også reduceret hårtäthed. Udtynding överst på issen eller langs midterskilningen kan väre särligt tydelig.',
    section4Body2: 'Det kan ske gradvist. Det ar vigtigt at skelne hormonal hårtab fran andre mulige årsager, såsom näringsstofmangel, skjoldbruskkirtelproblemer, visse lägemidler eller perioder med betydelig stress.',
    alert1Title: 'Bemärk',
    alert1Text: 'Betydelig, hurtig eller usädvanlig hårtab kräver en lägevurdering for att fastslå årsagen.',
    section5Body: 'En enkel, regelmässig rutine ar typisk bedre end at bruge mange produkter på én gang. Målet ar at rengöre, fugte och beskytte huden och begränse det, der kan opretholde irritation.',
    careHabits: [
      'En mild och regelmässig hudplejerutine',
      'Solbeskyttelse hver dag',
      'Afbalanceret kost',
      'Tålmodighed: resultater tager tid',
    ],
    section6Body1: 'Hvis håret ar tyndt, kan det hjälpe at reducere gentagen belastning: overdreven varme, mycket stramme frisurer eller hyppige kemiske behandlinger.',
    section6Body2: 'Hvis hårtätheden fortsat mindskes, kan det väre en god idé at konsultere en dermatolog for att fastslå årsagen och dröfte de tilgängelige behandlinger.',
    practicalTitle: 'Praktiske råd',
    practicalTips: [
      'Välg milde produkter och undgå at kombinere flere irriterende behandlinger',
      'Rengör huden uden at skade den, morgen och aften efter behov',
      'Brug solbeskyttelse, når huden ar eksponeret',
      'Undgå at klemme på akne for att reducere ar och pletter',
      'Sög faglig vejledning, hvis symtomne fortsätter eller forvärres',
    ],
    section7Body: 'Håndteringen afhänger av symtomne, deres svärhedsgrad, deres indvirkning på livskvaliteten och den enkelte kvindes mål. Det kan väre mere gavnligt at arbejde på flere fronter frem for att lede efter én enkelt lösning.',
    miniCards: [
      {
        title: 'Hud',
        text: 'En passende rutine och om nödvendigt rådgivning fran en dermatolog.',
      },
      {
        title: 'Hårväkst',
        text: 'Kosmetiske eller medicinske lösninger afhängigt av situationen.',
      },
      {
        title: 'Hår',
        text: 'Identificér årsagen, inden du välger behandling.',
      },
      {
        title: 'Mental trivsel',
        text: 'Tag hensyn till den psykologiske indvirkning av symtomne.',
      },
    ],
    section8Body1: 'Hvis aknen ar vedvarende eller smertefuld, hvis hårväksten ar hurtig, hvis håret tyndes tydeligt ud, eller hvis disse forandringer ledsages av en mycket uregelmässig cyklus, ar det en god idé at tale med en halsasperson.',
    section8Body2: 'En dermatolog kan tage sig av hud- och hårsymtom. En gynäkolog eller anden kvalificeret fagperson kan også vurdere den hormonelle sammenhäng och andre mulige PCOS-tegn.',
    alert2Title: 'Sög läge om nödvendigt',
    alert2Text: 'Hurtig och betydelig hårväkst, pludselig hårtab eller usädvanlige hormonelle forandringer kräver en lägevurdering.',
    ideasReceived: [
      'Akne ar inte i sig selv et bevis på PCOS',
      'Synlig hårväkst ar inte nödvendigvis kun relateret till hormoner',
      'PCOS kan påvirke kvinnor med alla kropstyper',
      'Symtomne kan ändre sig over tid och ar inte ens hos alla kvinder',
    ],
    quoteText: 'De synlige symtom på PCOS kan väre frustrerende, men de definerer inte din kvindelighed, din värdi eller din hygiejne.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'PCOS kan påvirke huden, kropshår och hovedhår.',
      'Symtomne varierer mycket fran kvinna till kvinde.',
      'Ét enkelt symptom ar inte nok till at diagnosticere PCOS.',
      'Der findes lösninger, der kan hjälpe med at forbedre symtomne.',
      'Medicinsk hjälp kan hjälpe dig med at välge den rigtige tilgang till dig.',
    ],
    finalTipTitle: 'Det vigtigste',
    finalTipText: 'Akne, öget hårväkst eller hårtab kan väre symtom på PCOS, men de ar inte uundgåelige. En tilgang tilpasset dina individuelle behov kan hjälpe dig med bedre at håndtere symtomne och föle dig mere tilpas i hverdagen.',
    disclaimerText: 'Denne artikel ar udelukkende till information och ar inte et alternativ till medicinsk rådgivning, diagnose eller individuel behandling.',
    shareMessage: 'Hud, hår och synlige PCOS-symtom — AWA',
  },
  nb: {
    badge: 'PCOS',
    title: 'Hud, hår og\nsynlige symptomer',
    metaDuration: '9 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'PCOS kan gi synlige endringer i huden, kroppshåret eller hodehåret. Å forstå hvor de kommer fra, gjør det lettere å kjenne dem igjen og å vite hvilke løsninger som kan vurderes.',
    infoBannerText: 'Disse tegnene er vanlige, men alene verken kreves eller er de nok til å stille diagnosen PCOS.',
    contentsTitle: 'I denne artikkelen',
    contents: [
      'Hvorfor disse symptomene oppstår',
      'Hormonell akne',
      'Økt hårvekst',
      'Hårtynning',
      'Ta vare på huden din',
      'Ta vare på håret ditt',
      'Hva som kan hjelpe i hverdagen',
      'Når bør du gå til lege',
      'Vanlige misforståelser',
      'Det viktigste å huske',
    ],
    section1Body1: 'PCOS kan innebære økt produksjon eller aktivitet av androgener, hormoner som også naturlig finnes hos kvinner. Når effekten er mer uttalt, kan de påvirke talgkjertlene, hårsekkene og hårveksten.',
    section1Body2: 'Denne hormonelle påvirkningen er i stor grad det som kan forklare vedvarende akne, økt hårvekst eller, hos noen kvinner, hårtynning.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Synlige symptomer gjenspeiler ikke nødvendigvis hvor alvorlig PCOS er. Én kvinne kan ha flere synlige symptomer, mens en annen kan ha få eller ingen.',
    section2Body1: 'Akne knyttet til hormonelle endringer kan dukke opp eller vedvare utover tenårene. Den rammer ofte haken, kjevelinjen, nedre del av kinnene eller noen ganger halsen.',
    section2Body2: 'Hos noen er utbruddene dype, ømme og tilbakevendende. De kan også etterlate pigmenterte merker eller arr når man plukker på dem, eller når de er spesielt betente.',
    skinSignsTitle: 'Mulige hudtegn',
    skinSigns: [
      'Vedvarende akne, særlig i nedre del av ansiktet',
      'Hud som er fettere enn før',
      'Aknebølger som noen ganger følger hormonelle endringer',
      'Merker eller arr etter utbrudd',
    ],
    section3Body1: 'Hirsutisme betegner økt hårvekst med grove hår på områder som vanligvis ikke berøres hos kvinner. I sammenheng med PCOS kan det henge sammen med androgenenes effekt på hårsekkene.',
    section3Body2: 'Områdene som oftest berøres, er haken, overleppen, brystet, magen eller ryggen. Hvor mye hårvekst som oppstår, varierer betydelig fra person til person.',
    hairSignsTitle: 'Mulige tegn',
    hairSigns: [
      'Mer synlig hårvekst i ansiktet',
      'Grovere hår på haken eller overleppen',
      'Hårvekst som kan dukke opp på brystet, magen eller ryggen',
      'Gradvis tynning av håret i issen',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Hårveksten avhenger også av genetiske og individuelle faktorer. Merkbar hårvekst betyr ikke automatisk at PCOS er til stede.',
    section4Body1: 'Noen kvinner med PCOS merker også at hårtettheten avtar. Tynningen kan være særlig synlig i issen eller langs midtskillingen.',
    section4Body2: 'Dette kan utvikle seg gradvis. Det er viktig å skille hormonrelatert hårtap fra andre mulige årsaker, som mangeltilstander, et skjoldbruskkjertelproblem, visse legemidler eller en periode med betydelig stress.',
    alert1Title: 'Verdt å merke seg',
    alert1Text: 'Hårtap som er betydelig, raskt eller uvanlig fortjener en medisinsk vurdering for å undersøke årsaken.',
    section5Body: 'En enkel, jevn rutine er vanligvis bedre enn å legge på mange produkter. Målet er å rense, fukte og beskytte huden samtidig som man begrenser alt som kan holde irritasjonen ved like.',
    careHabits: [
      'En mild, jevn hudpleierutine',
      'Solbeskyttelse hver dag',
      'Et balansert kosthold',
      'Tålmodighet: resultater tar tid',
    ],
    section6Body1: 'Når håret blir tynnere, kan det hjelpe å begrense gjentatt belastning på det: for mye varme, svært stramme frisyrer eller hyppige kjemiske behandlinger.',
    section6Body2: 'En konsultasjon hos hudlege kan være verdt det hvis hårtettheten fortsetter å avta, for å finne årsaken og diskutere tilgjengelige behandlinger.',
    practicalTitle: 'Praktiske tips',
    practicalTips: [
      'Velg milde produkter og unngå å legge på flere irriterende behandlinger',
      'Rens huden uten å tørke den ut, morgen og kveld ved behov',
      'Bruk solbeskyttelse når huden er eksponert',
      'Unngå å plukke på kviser for å begrense merker og arr',
      'Be en fagperson om råd hvis symptomene vedvarer eller blir verre',
    ],
    section7Body: 'Behandlingen avhenger av symptomene, hvor sterke de er, deres innvirkning på livskvaliteten og hver kvinnes mål. Det kan hjelpe å jobbe på flere fronter heller enn å lete etter én enkelt løsning.',
    miniCards: [
      {title: 'Hud', text: 'En egnet rutine og råd fra hudlege ved behov.'},
      {title: 'Hårvekst', text: 'Kosmetiske eller medisinske løsninger avhengig av situasjonen.'},
      {title: 'Hår', text: 'Finn årsaken før du velger en behandling.'},
      {title: 'Velvære', text: 'Ta hensyn til den følelsesmessige innvirkningen av symptomene.'},
    ],
    section8Body1: 'Det er lurt å snakke med helsepersonell når aknen blir vedvarende eller smertefull, når hårveksten øker raskt, når håret tynnes merkbart, eller når disse endringene kommer sammen med svært uregelmessige sykluser.',
    section8Body2: 'En hudlege kan behandle hud- og hårsymptomer. En gynekolog eller annen kvalifisert fagperson kan også vurdere den hormonelle sammenhengen og eventuelle andre mulige tegn på PCOS.',
    alert2Title: 'Gå til lege ved behov',
    alert2Text: 'Rask, betydelig hårvekst, plutselig hårtap eller uvanlige hormonelle endringer krever medisinsk råd.',
    ideasReceived: [
      'Å ha akne betyr ikke automatisk at du har PCOS',
      'Synlig hårvekst henger ikke nødvendigvis bare sammen med hormoner',
      'PCOS kan ramme kvinner av alle kroppstyper',
      'Symptomene kan endre seg over tid og er ikke de samme for alle kvinner',
    ],
    quoteText: 'De synlige symptomene ved PCOS kan være frustrerende, men de definerer ikke din femininitet, din verdi eller din hygiene.',
    summaryTitle: 'Det viktigste',
    summaryItems: [
      'PCOS kan påvirke huden, kroppshåret og hodehåret.',
      'Symptomene varierer mye fra kvinne til kvinne.',
      'Ett enkelt symptom er ikke nok til å stille diagnosen PCOS.',
      'Det finnes løsninger som kan hjelpe med å bedre symptomene.',
      'Medisinsk støtte kan hjelpe deg å velge riktig tilnærming for deg.',
    ],
    finalTipTitle: 'Det viktigste å huske',
    finalTipText: 'Akne, økt hårvekst eller hårtap kan være symptomer på PCOS, men de er ikke uunngåelige. En individuelt tilpasset tilnærming kan hjelpe deg å håndtere symptomene bedre og føle deg mer komfortabel i hverdagen.',
    disclaimerText: 'Denne artikkelen er kun til informasjon og erstatter ikke en medisinsk konsultasjon, diagnose eller personlig behandling.',
    shareMessage: 'Hud, hår og synlige PCOS-symptomer – AWA',
  },
  pl: {
    badge: 'PCOS',
    title: 'Skóra, włosy i\nwidoczne objawy',
    metaDuration: '9 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'PCOS może powodować widoczne zmiany na skórze, owłosieniu ciała lub włosach na głowie. Zrozumienie ich źródła ułatwia ich rozpoznanie i poznanie możliwych rozwiązań.',
    infoBannerText: 'Te objawy są częste, ale same w sobie nie są ani wymagane, ani wystarczające do rozpoznania PCOS.',
    contentsTitle: 'W tym artykule',
    contents: [
      'Dlaczego pojawiają się te objawy',
      'Trądzik hormonalny',
      'Nadmierne owłosienie',
      'Przerzedzenie włosów',
      'Dbanie o skórę',
      'Dbanie o włosy',
      'Co może pomóc na co dzień',
      'Kiedy zgłosić się do lekarza',
      'Częste błędne przekonania',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'PCOS może wiązać się ze zwiększoną produkcją lub aktywnością androgenów, hormonów, które w naturalny sposób występują także u kobiet. Gdy ich działanie jest silniej zaznaczone, mogą wpływać na gruczoły łojowe, mieszki włosowe i cykl wzrostu włosów.',
    section1Body2: 'Ten wpływ hormonalny w dużej mierze może tłumaczyć pojawienie się uporczywego trądziku, zwiększonego wzrostu owłosienia lub, u niektórych kobiet, przerzedzenia włosów.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Widoczne objawy niekoniecznie odzwierciedlają nasilenie PCOS. Jedna kobieta może mieć kilka widocznych objawów, a inna niewiele lub żadnego.',
    section2Body1: 'Trądzik związany ze zmianami hormonalnymi może pojawiać się lub utrzymywać po okresie dojrzewania. Zwykle dotyka brody, linii żuchwy, dolnej części policzków, a czasem szyi.',
    section2Body2: 'U niektórych osób zmiany są głębokie, bolesne i nawracające. Mogą też pozostawiać przebarwienia lub blizny, gdy są dłubane lub szczególnie zapalne.',
    skinSignsTitle: 'Możliwe objawy skórne',
    skinSigns: [
      'Uporczywy trądzik, zwłaszcza na dolnej części twarzy',
      'Skóra bardziej tłusta niż wcześniej',
      'Zaostrzenia trądziku, które czasem następują po zmianach hormonalnych',
      'Ślady lub blizny pozostające po zaostrzeniach',
    ],
    section3Body1: 'Hirsutyzm oznacza zwiększony wzrost włosów terminalnych w miejscach, które zwykle nie są nimi pokryte u kobiet. W kontekście PCOS może być związany z działaniem androgenów na mieszki włosowe.',
    section3Body2: 'Najczęściej dotyczy brody, górnej wargi, klatki piersiowej, brzucha lub pleców. Ilość owłosienia bardzo różni się u poszczególnych osób.',
    hairSignsTitle: 'Możliwe objawy',
    hairSigns: [
      'Bardziej widoczne owłosienie na twarzy',
      'Grubsze włosy na brodzie lub górnej wardze',
      'Owłosienie, które może pojawiać się na klatce piersiowej, brzuchu lub plecach',
      'Stopniowe przerzedzenie włosów na szczycie głowy',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Wzrost owłosienia zależy też od czynników genetycznych i indywidualnych. Zauważalne owłosienie nie oznacza automatycznie obecności PCOS.',
    section4Body1: 'Niektóre kobiety z PCOS zauważają też zmniejszenie gęstości włosów. Przerzedzenie może być szczególnie widoczne na szczycie głowy lub wzdłuż przedziałka.',
    section4Body2: 'Może rozwijać się stopniowo. Ważne jest odróżnienie wypadania włosów związanego z hormonami od innych możliwych przyczyn, takich jak niedobór, problem z tarczycą, niektóre leki lub okres dużego stresu.',
    alert1Title: 'Warto zauważyć',
    alert1Text: 'Znaczne, szybkie lub nietypowe wypadanie włosów zasługuje na ocenę lekarską w celu zbadania przyczyny.',
    section5Body: 'Prosta, konsekwentna pielęgnacja jest zwykle lepsza niż nakładanie wielu produktów. Celem jest oczyszczenie, nawilżenie i ochrona skóry przy jednoczesnym ograniczeniu wszystkiego, co może podtrzymywać podrażnienie.',
    careHabits: [
      'Delikatna, konsekwentna pielęgnacja skóry',
      'Codzienna ochrona przeciwsłoneczna',
      'Zbilansowana dieta',
      'Cierpliwość: efekty wymagają czasu',
    ],
    section6Body1: 'Gdy włosy stają się cieńsze, pomocne może być ograniczenie powtarzającego się obciążania ich: nadmiernego ciepła, bardzo ciasnych fryzur lub częstych zabiegów chemicznych.',
    section6Body2: 'Wizyta u dermatologa może być wskazana, jeśli gęstość włosów nadal maleje, aby ustalić przyczynę i omówić dostępne metody leczenia.',
    practicalTitle: 'Praktyczne wskazówki',
    practicalTips: [
      'Wybieraj łagodne produkty i unikaj nakładania wielu drażniących preparatów',
      'Oczyszczaj skórę bez jej wysuszania, rano i wieczorem w razie potrzeby',
      'Stosuj ochronę przeciwsłoneczną, gdy skóra jest odsłonięta',
      'Unikaj dłubania w niedoskonałościach, by ograniczyć ślady i blizny',
      'Poproś specjalistę o poradę, jeśli objawy się utrzymują lub nasilają',
    ],
    section7Body: 'Postępowanie zależy od objawów, ich nasilenia, wpływu na jakość życia i celów każdej kobiety. Pomocne może być działanie na kilku frontach zamiast szukania jednego rozwiązania.',
    miniCards: [
      {title: 'Skóra', text: 'Odpowiednia pielęgnacja i w razie potrzeby porada dermatologa.'},
      {title: 'Owłosienie', text: 'Rozwiązania kosmetyczne lub medyczne w zależności od sytuacji.'},
      {title: 'Włosy', text: 'Ustal przyczynę, zanim wybierzesz leczenie.'},
      {title: 'Dobrostan', text: 'Uwzględnij emocjonalny wpływ objawów.'},
    ],
    section8Body1: 'Warto porozmawiać ze specjalistą, gdy trądzik staje się uporczywy lub bolesny, gdy owłosienie szybko się zwiększa, gdy włosy wyraźnie się przerzedzają lub gdy te zmiany towarzyszą bardzo nieregularnym cyklom.',
    section8Body2: 'Dermatolog może zająć się objawami skórnymi i włosów. Ginekolog lub inny wykwalifikowany specjalista może też ocenić kontekst hormonalny i ewentualne inne objawy PCOS.',
    alert2Title: 'Zgłoś się do lekarza w razie potrzeby',
    alert2Text: 'Szybki, znaczny wzrost owłosienia, nagłe wypadanie włosów lub nietypowe zmiany hormonalne wymagają porady lekarskiej.',
    ideasReceived: [
      'Posiadanie trądziku nie oznacza automatycznie, że masz PCOS',
      'Widoczne owłosienie niekoniecznie jest związane wyłącznie z hormonami',
      'PCOS może dotyczyć kobiet o każdej budowie ciała',
      'Objawy mogą się zmieniać w czasie i nie są takie same u każdej kobiety',
    ],
    quoteText: 'Widoczne objawy PCOS mogą frustrować, ale nie definiują Twojej kobiecości, Twojej wartości ani Twojej higieny.',
    summaryTitle: 'Najważniejsze',
    summaryItems: [
      'PCOS może wpływać na skórę, owłosienie ciała i włosy na głowie.',
      'Objawy bardzo się różnią u poszczególnych kobiet.',
      'Pojedynczy objaw nie wystarcza do rozpoznania PCOS.',
      'Istnieją rozwiązania, które pomagają poprawić objawy.',
      'Wsparcie medyczne może pomóc wybrać odpowiednie dla Ciebie podejście.',
    ],
    finalTipTitle: 'Najważniejsze wnioski',
    finalTipText: 'Trądzik, nadmierne owłosienie lub wypadanie włosów mogą być objawami PCOS, ale nie są nieuniknione. Spersonalizowane podejście może pomóc lepiej radzić sobie z objawami i czuć się wygodniej na co dzień.',
    disclaimerText: 'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje wizyty lekarskiej, diagnozy ani spersonalizowanego leczenia.',
    shareMessage: 'Skóra, włosy i widoczne objawy PCOS — AWA',
  },
  uk: {
    badge: 'СПКЯ',
    title: 'Шкіра, волосся та\nвидимі симптоми',
    metaDuration: '9 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'СПКЯ може спричиняти видимі зміни шкіри, волосся на тілі чи на голові. Розуміння їхнього походження полегшує їх розпізнавання та знання, які рішення можна розглянути.',
    infoBannerText: 'Ці ознаки поширені, але самі по собі не є ні обов’язковими, ні достатніми для діагностики СПКЯ.',
    contentsTitle: 'У цій статті',
    contents: [
      'Чому з’являються ці симптоми',
      'Гормональне акне',
      'Надмірний ріст волосся',
      'Витончення волосся',
      'Догляд за шкірою',
      'Догляд за волоссям',
      'Що може допомогти щодня',
      'Коли звертатися до лікаря',
      'Поширені хибні уявлення',
      'Головні висновки',
    ],
    section1Body1: 'СПКЯ може супроводжуватися підвищеним виробленням або активністю андрогенів — гормонів, які природно присутні й у жінок. Коли їхній вплив виразніший, вони можуть впливати на сальні залози, волосяні фолікули та цикл росту волосся.',
    section1Body2: 'Цей гормональний вплив значною мірою може пояснювати появу стійкого акне, посиленого росту волосся або, у деяких жінок, витончення волосся.',
    tip1Title: 'Варто знати',
    tip1Text: 'Видимі симптоми не обов’язково відображають тяжкість СПКЯ. В однієї жінки може бути кілька видимих симптомів, а в іншої — мало або жодного.',
    section2Body1: 'Акне, пов’язане з гормональними змінами, може з’являтися чи зберігатися після підліткового віку. Воно зазвичай торкається підборіддя, лінії щелепи, нижньої частини щік чи іноді шиї.',
    section2Body2: 'У деяких людей висипання глибокі, болісні й рецидивні. Вони також можуть залишати пігментні плями чи рубці, коли їх колупають або коли вони особливо запалені.',
    skinSignsTitle: 'Можливі ознаки на шкірі',
    skinSigns: [
      'Стійке акне, особливо на нижній частині обличчя',
      'Шкіра жирніша, ніж раніше',
      'Загострення акне, що іноді слідують за гормональними змінами',
      'Плями чи рубці, що залишаються після загострень',
    ],
    section3Body1: 'Гірсутизм означає посилений ріст термінального волосся в ділянках, які зазвичай ним не вкриті в жінок. У контексті СПКЯ він може бути пов’язаний із впливом андрогенів на волосяні фолікули.',
    section3Body2: 'Найчастіше він торкається підборіддя, верхньої губи, грудей, живота чи спини. Кількість волосся значно різниться в різних людей.',
    hairSignsTitle: 'Можливі ознаки',
    hairSigns: [
      'Помітніший ріст волосся на обличчі',
      'Грубше волосся на підборідді чи верхній губі',
      'Ріст волосся, що може з’являтися на грудях, животі чи спині',
      'Поступове витончення волосся на тімені',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Ріст волосся також залежить від генетичних та індивідуальних чинників. Помітний ріст волосся автоматично не означає наявність СПКЯ.',
    section4Body1: 'Деякі жінки з СПКЯ також помічають зменшення густоти волосся. Витончення може бути особливо помітним на тімені або вздовж проділу.',
    section4Body2: 'Воно може розвиватися поступово. Важливо відрізняти випадання волосся, пов’язане з гормонами, від інших можливих причин, як-от дефіцит, проблеми зі щитоподібною залозою, певні ліки чи період значного стресу.',
    alert1Title: 'Варто зауважити',
    alert1Text: 'Значне, швидке або нетипове випадання волосся заслуговує на медичну оцінку для з’ясування причини.',
    section5Body: 'Проста, послідовна рутина загалом краща за нашарування багатьох засобів. Мета — очищати, зволожувати й захищати шкіру, обмежуючи все, що може підтримувати подразнення.',
    careHabits: [
      'Ніжна, послідовна рутина догляду за шкірою',
      'Щоденний сонцезахист',
      'Збалансоване харчування',
      'Терпіння: результатам потрібен час',
    ],
    section6Body1: 'Коли волосся тоншає, може допомогти обмеження повторюваного навантаження на нього: надмірного нагрівання, дуже тугих зачісок або частих хімічних процедур.',
    section6Body2: 'Консультація дерматолога може бути доречною, якщо густота волосся продовжує зменшуватися, щоб визначити причину й обговорити доступне лікування.',
    practicalTitle: 'Практичні поради',
    practicalTips: [
      'Обирайте м’які засоби й уникайте нашарування кількох подразнювальних засобів',
      'Очищайте шкіру без її пересушування, вранці та ввечері за потреби',
      'Користуйтеся сонцезахистом, коли шкіра відкрита',
      'Не колупайте недоліки, щоб обмежити плями та рубці',
      'Попросіть поради фахівця, якщо симптоми зберігаються чи посилюються',
    ],
    section7Body: 'Ведення залежить від симптомів, їхньої інтенсивності, впливу на якість життя та цілей кожної жінки. Може бути корисно працювати одразу в кількох напрямках, а не шукати єдине рішення.',
    miniCards: [
      {title: 'Шкіра', text: 'Відповідна рутина та за потреби порада дерматолога.'},
      {title: 'Ріст волосся', text: 'Косметичні чи медичні рішення залежно від ситуації.'},
      {title: 'Волосся', text: 'З’ясуйте причину, перш ніж обирати лікування.'},
      {title: 'Благополуччя', text: 'Врахуйте емоційний вплив симптомів.'},
    ],
    section8Body1: 'Варто поговорити з медичним фахівцем, коли акне стає стійким або болісним, коли ріст волосся швидко посилюється, коли волосся помітно тоншає або коли ці зміни супроводжуються дуже нерегулярними циклами.',
    section8Body2: 'Дерматолог може займатися симптомами шкіри та волосся. Гінеколог чи інший кваліфікований фахівець також може оцінити гормональний контекст і будь-які інші можливі ознаки СПКЯ.',
    alert2Title: 'Зверніться до лікаря за потреби',
    alert2Text: 'Швидкий, значний ріст волосся, раптове випадання волосся чи нетипові гормональні зміни потребують медичної поради.',
    ideasReceived: [
      'Наявність акне автоматично не означає, що у вас СПКЯ',
      'Помітний ріст волосся не обов’язково пов’язаний лише з гормонами',
      'СПКЯ може торкатися жінок будь-якої статури',
      'Симптоми можуть змінюватися з часом і не однакові в кожної жінки',
    ],
    quoteText: 'Видимі симптоми СПКЯ можуть засмучувати, але вони не визначають вашої жіночності, вашої цінності чи вашої гігієни.',
    summaryTitle: 'Головне',
    summaryItems: [
      'СПКЯ може впливати на шкіру, волосся на тілі та на голові.',
      'Симптоми сильно різняться в різних жінок.',
      'Один симптом не вистачає для діагностики СПКЯ.',
      'Існують рішення, що допомагають покращити симптоми.',
      'Медична підтримка може допомогти обрати підхід, що підходить саме вам.',
    ],
    finalTipTitle: 'Головні висновки',
    finalTipText: 'Акне, надмірний ріст волосся чи випадання волосся можуть бути симптомами СПКЯ, але вони не неминучі. Персоналізований підхід може допомогти краще керувати симптомами й почуватися комфортніше щодня.',
    disclaimerText: 'Ця стаття має виключно інформаційний характер і не замінює медичної консультації, діагностики чи персоналізованого лікування.',
    shareMessage: 'Шкіра, волосся та видимі симптоми СПКЯ — AWA',
  },
  cs: {
    badge: 'PCOS',
    title: 'Pleť, vlasy a\nviditelné příznaky',
    metaDuration: '9 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'PCOS může způsobovat viditelné změny na pleti, tělesném ochlupení nebo vlasech. Pochopení jejich původu usnadňuje jejich rozpoznání a vědět, jaká řešení lze zvážit.',
    infoBannerText: 'Tyto příznaky jsou běžné, ale samy o sobě nejsou ani nutné, ani dostačující k diagnostice PCOS.',
    contentsTitle: 'V tomto článku',
    contents: [
      'Proč se tyto příznaky objevují',
      'Hormonální akné',
      'Nadměrný růst ochlupení',
      'Řídnutí vlasů',
      'Péče o pleť',
      'Péče o vlasy',
      'Co může pomoci v každodenním životě',
      'Kdy navštívit lékaře',
      'Časté mylné představy',
      'Hlavní poznatky',
    ],
    section1Body1: 'PCOS může zahrnovat zvýšenou tvorbu nebo aktivitu androgenů, hormonů, které se přirozeně vyskytují i u žen. Když je jejich účinek výraznější, mohou ovlivňovat mazové žlázy, vlasové folikuly a cyklus růstu vlasů.',
    section1Body2: 'Tento hormonální vliv z velké části vysvětluje vznik přetrvávajícího akné, zvýšeného růstu ochlupení nebo u některých žen řídnutí vlasů.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Viditelné příznaky nemusí odrážet závažnost PCOS. Jedna žena může mít několik viditelných příznaků, jiná jich může mít málo nebo žádné.',
    section2Body1: 'Akné související s hormonálními změnami se může objevit nebo přetrvávat i po dospívání. Má tendenci postihovat bradu, linii čelisti, dolní část tváří nebo někdy krk.',
    section2Body2: 'U některých žen jsou léze hluboké, citlivé a opakující se. Mohou také zanechávat pigmentované skvrny nebo jizvy, když se vymačkávají nebo když jsou obzvlášť zanícené.',
    skinSignsTitle: 'Možné kožní příznaky',
    skinSigns: [
      'Přetrvávající akné, zejména v dolní části obličeje',
      'Pleť mastnější než dříve',
      'Vzplanutí akné, která někdy následují po hormonálních změnách',
      'Skvrny nebo jizvy zanechané po vzplanutích',
    ],
    section3Body1: 'Hirsutismus označuje zvýšený růst terminálních chlupů v oblastech, které u žen obvykle nejsou postiženy. V souvislosti s PCOS může souviset s účinkem androgenů na vlasové folikuly.',
    section3Body2: 'Nejčastěji postiženými oblastmi jsou brada, horní ret, hrudník, břicho nebo záda. Míra růstu ochlupení se u jednotlivých žen výrazně liší.',
    hairSignsTitle: 'Možné příznaky',
    hairSigns: [
      'Viditelnější růst chloupků na obličeji',
      'Hrubší chlupy na bradě nebo horním rtu',
      'Růst chlupů, který se může objevit na hrudníku, břiše nebo zádech',
      'Postupné řídnutí vlasů na temeni hlavy',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Růst ochlupení závisí také na genetických a individuálních faktorech. Znatelný růst chlupů automaticky neznamená, že je přítomen PCOS.',
    section4Body1: 'Některé ženy s PCOS si také všimnou poklesu hustoty vlasů. Řídnutí může být obzvlášť viditelné na temeni hlavy nebo podél pěšinky.',
    section4Body2: 'Může se vyvíjet postupně. Je důležité odlišit hormonálně podmíněné vypadávání vlasů od jiných možných příčin, například nedostatku, problému se štítnou žlázou, některých léků nebo období výrazného stresu.',
    alert1Title: 'Stojí za zmínku',
    alert1Text: 'Výrazné, rychlé nebo neobvyklé vypadávání vlasů si zaslouží lékařské posouzení ke zjištění příčiny.',
    section5Body: 'Jednoduchá, důsledná rutina je obecně lepší než nanášení mnoha přípravků. Cílem je pleť čistit, hydratovat a chránit a zároveň omezit vše, co může udržovat podráždění.',
    careHabits: [
      'Jemná, důsledná péče o pleť',
      'Denní ochrana před sluncem',
      'Vyvážená strava',
      'Trpělivost: výsledky vyžadují čas',
    ],
    section6Body1: 'Když jsou vlasy jemnější, může pomoci omezit jejich opakované namáhání: nadměrné teplo, velmi těsné účesy nebo časté chemické úpravy.',
    section6Body2: 'Konzultace u dermatologa může být přínosná, pokud hustota vlasů dál klesá, aby se zjistila příčina a probraly dostupné způsoby léčby.',
    practicalTitle: 'Praktické tipy',
    practicalTips: [
      'Zvolte jemné přípravky a nenanášejte několik dráždivých přípravků na sebe',
      'Pleť čistěte bez vysušování, ráno a v případě potřeby i večer',
      'Používejte ochranu před sluncem, když je pleť vystavena',
      'Nemačkejte pupínky, abyste omezila skvrny a jizvy',
      'Pokud příznaky přetrvávají nebo se zhoršují, požádejte odborníka o radu',
    ],
    section7Body: 'Zvládání závisí na příznacích, jejich intenzitě, dopadu na kvalitu života a cílech každé ženy. Může pomoci pracovat na několika frontách místo hledání jediného řešení.',
    miniCards: [
      {title: 'Pleť', text: 'Vhodná rutina a v případě potřeby rada dermatologa.'},
      {title: 'Růst ochlupení', text: 'Kosmetická nebo lékařská řešení podle situace.'},
      {title: 'Vlasy', text: 'Před volbou léčby určete příčinu.'},
      {title: 'Pohoda', text: 'Zohledněte emoční dopad příznaků.'},
    ],
    section8Body1: 'Je dobré promluvit si se zdravotnickým pracovníkem, když se akné stane přetrvávajícím nebo bolestivým, když se růst ochlupení rychle zvýší, když vlasy znatelně řídnou nebo když tyto změny provázejí velmi nepravidelné cykly.',
    section8Body2: 'Dermatolog může řešit příznaky pleti a vlasů. Gynekolog nebo jiný kvalifikovaný odborník může také posoudit hormonální souvislosti a případné další známky PCOS.',
    alert2Title: 'V případě potřeby navštivte lékaře',
    alert2Text: 'Rychlý, výrazný růst ochlupení, náhlé vypadávání vlasů nebo neobvyklé hormonální změny vyžadují lékařskou radu.',
    ideasReceived: [
      'Mít akné automaticky neznamená, že máte PCOS',
      'Viditelný růst ochlupení nemusí souviset jen s hormony',
      'PCOS může postihnout ženy jakékoli postavy',
      'Příznaky se mohou v čase měnit a nejsou u každé ženy stejné',
    ],
    quoteText: 'Viditelné příznaky PCOS mohou být frustrující, ale nedefinují vaši ženskost, vaši hodnotu ani vaši hygienu.',
    summaryTitle: 'To nejdůležitější',
    summaryItems: [
      'PCOS může ovlivnit pleť, tělesné ochlupení i vlasy.',
      'Příznaky se od ženy k ženě velmi liší.',
      'Jediný příznak nestačí k diagnostice PCOS.',
      'Existují řešení, která pomáhají příznaky zlepšit.',
      'Lékařská podpora vám může pomoci zvolit správný přístup.',
    ],
    finalTipTitle: 'Hlavní poznatky',
    finalTipText: 'Akné, nadměrný růst ochlupení nebo vypadávání vlasů mohou být příznaky PCOS, ale nejsou nevyhnutelné. Personalizovaný přístup vám může pomoci lépe zvládat příznaky a cítit se v každodenním životě pohodlněji.',
    disclaimerText: 'Tento článek je pouze informativní a nenahrazuje lékařskou konzultaci, diagnózu ani individuální léčbu.',
    shareMessage: 'Pleť, vlasy a viditelné příznaky PCOS — AWA',
  },
  sk: {
    badge: 'PCOS',
    title: 'Pokožka, vlasy a\nviditeľné príznaky',
    metaDuration: '9 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'PCOS môže spôsobiť viditeľné zmeny na pokožke, ochlpení tela alebo vlasoch. Pochopenie ich pôvodu uľahčuje ich rozpoznanie a vedomie, aké riešenia možno zvážiť.',
    infoBannerText: 'Tieto znaky sú bežné, ale samy osebe nie sú ani nevyhnutné, ani dostatočné na diagnostiku PCOS.',
    contentsTitle: 'V tomto článku',
    contents: [
      'Prečo sa tieto príznaky objavujú',
      'Hormonálne akné',
      'Nadmerný rast chlpov',
      'Rednutie vlasov',
      'Starostlivosť o pokožku',
      'Starostlivosť o vlasy',
      'Čo môže pomôcť každý deň',
      'Kedy navštíviť lekára',
      'Bežné mylné predstavy',
      'Hlavné body',
    ],
    section1Body1: 'PCOS môže zahŕňať zvýšenú tvorbu alebo aktivitu androgénov, hormónov, ktoré sú prirodzene prítomné aj u žien. Keď je ich účinok výraznejší, môžu ovplyvňovať mazové žľazy, vlasové folikuly a cyklus rastu chlpov.',
    section1Body2: 'Tento hormonálny vplyv z veľkej časti vysvetľuje výskyt pretrvávajúceho akné, zvýšeného rastu chlpov alebo u niektorých žien rednutia vlasov.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Viditeľné príznaky nemusia nutne odrážať závažnosť PCOS. Jedna žena môže mať viacero viditeľných príznakov, iná len málo alebo žiadne.',
    section2Body1: 'Akné súvisiace s hormonálnymi zmenami sa môže objaviť alebo pretrvávať aj po dospievaní. Má tendenciu postihovať bradu, líniu sánky, spodné časti líc alebo niekedy krk.',
    section2Body2: 'U niektorých žien sú lézie hlboké, bolestivé a opakujúce sa. Môžu tiež zanechávať pigmentované škvrny alebo jazvy, keď sa škriabu alebo sú obzvlášť zapálené.',
    skinSignsTitle: 'Možné kožné znaky',
    skinSigns: [
      'Pretrvávajúce akné, najmä na spodnej časti tváre',
      'Pleť mastnejšia než predtým',
      'Zhoršenia akné, ktoré niekedy nasledujú po hormonálnych zmenách',
      'Škvrny alebo jazvy zanechané po zhoršeniach',
    ],
    section3Body1: 'Hirzutizmus označuje zvýšený rast terminálnych chlpov v oblastiach, ktoré sa u žien zvyčajne netýkajú. V kontexte PCOS môže súvisieť s účinkom androgénov na vlasové folikuly.',
    section3Body2: 'Najčastejšie postihnuté oblasti sú brada, horná pera, hruď, brucho alebo chrbát. Množstvo rastu chlpov sa od ženy k žene veľmi líši.',
    hairSignsTitle: 'Možné znaky',
    hairSigns: [
      'Viditeľnejší rast chlpov na tvári',
      'Hrubšie chlpy na brade alebo hornej pere',
      'Rast chlpov, ktorý sa môže objaviť na hrudi, bruchu alebo chrbte',
      'Postupné rednutie vlasov na temene hlavy',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Rast chlpov závisí aj od genetických a individuálnych faktorov. Výrazný rast chlpov automaticky neznamená, že je prítomné PCOS.',
    section4Body1: 'Niektoré ženy s PCOS si všimnú aj zníženie hustoty vlasov. Rednutie môže byť obzvlášť viditeľné na temene hlavy alebo pozdĺž stredového pútka.',
    section4Body2: 'Môže sa vyvíjať postupne. Je dôležité odlíšiť hormonálne vypadávanie vlasov od iných možných príčin, ako je nedostatok, problém so štítnou žľazou, niektoré lieky alebo obdobie výrazného stresu.',
    alert1Title: 'Stojí za povšimnutie',
    alert1Text: 'Výrazné, rýchle alebo nezvyčajné vypadávanie vlasov si zaslúži lekárske posúdenie na zistenie príčiny.',
    section5Body: 'Jednoduchá, dôsledná rutina je vo všeobecnosti lepšia než vrstvenie mnohých prípravkov. Cieľom je pleť očistiť, hydratovať a chrániť a obmedziť všetko, čo môže udržiavať podráždenie.',
    careHabits: [
      'Jemná a dôsledná rutina starostlivosti o pleť',
      'Denná ochrana pred slnkom',
      'Vyvážená strava',
      'Trpezlivosť: výsledky si vyžadujú čas',
    ],
    section6Body1: 'Keď vlasy zjemnejú, môže pomôcť obmedziť ich opakované zaťaženie: nadmerné teplo, veľmi pevné účesy alebo časté chemické ošetrenia.',
    section6Body2: 'Dermatologická konzultácia môže stáť za to, ak hustota vlasov naďalej klesá, aby sa pomohlo určiť príčinu a prediskutovať dostupné liečby.',
    practicalTitle: 'Praktické tipy',
    practicalTips: [
      'Vyberajte jemné prípravky a nevrstvte viacero dráždivých ošetrení',
      'Pleť čistite bez vysúšania, v prípade potreby ráno aj večer',
      'Pri vystavení pleti slnku používajte ochranu',
      'Nevytláčajte vyrážky, aby ste obmedzili škvrny a jazvy',
      'Ak príznaky pretrvávajú alebo sa zhoršujú, požiadajte odborníka o radu',
    ],
    section7Body: 'Zvládanie závisí od príznakov, ich intenzity, vplyvu na kvalitu života a cieľov každej ženy. Môže pomôcť pracovať na viacerých frontoch namiesto hľadania jediného riešenia.',
    miniCards: [
      {title: 'Pokožka', text: 'Vhodná rutina a v prípade potreby dermatologická rada.'},
      {title: 'Rast chlpov', text: 'Kozmetické alebo lekárske riešenia podľa situácie.'},
      {title: 'Vlasy', text: 'Pred výberom liečby zistite príčinu.'},
      {title: 'Pohoda', text: 'Zohľadnite emočný dopad príznakov.'},
    ],
    section8Body1: 'Je dobré porozprávať sa so zdravotníckym pracovníkom, keď sa akné stane pretrvávajúcim alebo bolestivým, keď sa rast chlpov rýchlo zvýši, keď vlasy výrazne redne alebo keď tieto zmeny sprevádzajú veľmi nepravidelné cykly.',
    section8Body2: 'Dermatológ môže riešiť príznaky pokožky a vlasov. Gynekológ alebo iný kvalifikovaný odborník môže tiež posúdiť hormonálny kontext a prípadné ďalšie znaky PCOS.',
    alert2Title: 'Navštívte lekára, ak je to potrebné',
    alert2Text: 'Rýchly, výrazný rast chlpov, náhle vypadávanie vlasov alebo nezvyčajné hormonálne zmeny si vyžadujú lekársku radu.',
    ideasReceived: [
      'Mať akné automaticky neznamená, že máte PCOS',
      'Viditeľný rast chlpov nemusí súvisieť len s hormónmi',
      'PCOS môže postihnúť ženy akejkoľvek postavy',
      'Príznaky sa môžu v čase meniť a nie sú rovnaké u každej ženy',
    ],
    quoteText: 'Viditeľné príznaky PCOS môžu byť frustrujúce, ale nedefinujú vašu ženskosť, hodnotu ani hygienu.',
    summaryTitle: 'To najdôležitejšie',
    summaryItems: [
      'PCOS môže ovplyvniť pokožku, ochlpenie tela a vlasy.',
      'Príznaky sa od ženy k žene veľmi líšia.',
      'Jediný príznak nestačí na diagnostiku PCOS.',
      'Existujú riešenia, ktoré pomáhajú príznaky zlepšiť.',
      'Lekárska podpora vám môže pomôcť zvoliť pre vás správny prístup.',
    ],
    finalTipTitle: 'Hlavné body',
    finalTipText: 'Akné, nadmerný rast chlpov alebo vypadávanie vlasov môžu byť príznakmi PCOS, ale nie sú nevyhnutné. Individuálny prístup vám môže pomôcť lepšie zvládať príznaky a cítiť sa v každodennom živote pohodlnejšie.',
    disclaimerText: 'Tento článok je iba informatívny a nenahrádza lekársku konzultáciu, diagnózu ani individuálnu liečbu.',
    shareMessage: 'Pokožka, vlasy a viditeľné príznaky PCOS — AWA',
  },
  hu: {
    badge: 'PCOS',
    title: 'Bőr, haj és\nlátható tünetek',
    metaDuration: '9 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A PCOS látható változásokat okozhat a bőrön, a testszőrzeten vagy a hajon. Ha megérted az eredetüket, könnyebb felismerni őket, és tudni, milyen megoldások jöhetnek szóba.',
    infoBannerText: 'Ezek a jelek gyakoriak, de önmagukban sem nem szükségesek, sem nem elégségesek a PCOS diagnosztizálásához.',
    contentsTitle: 'Ebben a cikkben',
    contents: [
      'Miért jelennek meg ezek a tünetek',
      'Hormonális akné',
      'Túlzott szőrnövekedés',
      'Hajritkulás',
      'A bőröd ápolása',
      'A hajad ápolása',
      'Ami a mindennapokban segíthet',
      'Mikor menj orvoshoz',
      'Gyakori tévhitek',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A PCOS együtt járhat az androgének — a nőkben természetesen jelen lévő hormonok — fokozott termelésével vagy aktivitásával. Amikor a hatásuk kifejezettebb, befolyásolhatják a faggyúmirigyeket, a szőrtüszőket és a szőrnövekedési ciklust.',
    section1Body2: 'Ez a hormonális hatás nagyrészt megmagyarázza a tartós akné, a fokozott szőrnövekedés vagy egyes nőknél a hajritkulás megjelenését.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'A látható tünetek nem feltétlenül tükrözik a PCOS súlyosságát. Egy nőnek lehet több látható tünete, egy másiknak kevés vagy semmi.',
    section2Body1: 'A hormonális változásokhoz kapcsolódó akné a serdülőkoron túl is megjelenhet vagy fennmaradhat. Hajlamos az állat, az állvonalat, az alsó arcot vagy néha a nyakat érinteni.',
    section2Body2: 'Egyeseknél az elváltozások mélyek, érzékenyek és visszatérők. Pigmentált foltokat vagy hegeket is hagyhatnak, ha piszkálják őket, vagy különösen gyulladtak.',
    skinSignsTitle: 'Lehetséges bőrjelek',
    skinSigns: [
      'Tartós akné, különösen az arc alsó részén',
      'A korábbinál zsírosabb bőr',
      'Aknefellángolások, amelyek néha hormonális változásokat követnek',
      'A fellángolások után megmaradó foltok vagy hegek',
    ],
    section3Body1: 'A hirzutizmus a terminális szőrzet fokozott növekedését jelenti olyan területeken, amelyeket a nőknél általában nem érint. PCOS esetén az androgének szőrtüszőkre gyakorolt hatásával függhet össze.',
    section3Body2: 'A leggyakrabban érintett területek az áll, a felső ajak, a mellkas, a has vagy a hát. A szőrnövekedés mértéke nőnként nagyon eltér.',
    hairSignsTitle: 'Lehetséges jelek',
    hairSigns: [
      'Szembetűnőbb szőrnövekedés az arcon',
      'Durvább szőrszálak az állon vagy a felső ajkon',
      'Szőrnövekedés, amely megjelenhet a mellkason, a hason vagy a háton',
      'A haj fokozatos ritkulása a fejtetőn',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A szőrnövekedés genetikai és egyéni tényezőktől is függ. A szembetűnő szőrnövekedés automatikusan nem jelenti, hogy PCOS áll fenn.',
    section4Body1: 'Egyes PCOS-sel élő nők a hajsűrűség csökkenését is észreveszik. A ritkulás különösen a fejtetőn vagy a választék mentén lehet szembetűnő.',
    section4Body2: 'Ez fokozatosan alakulhat ki. Fontos megkülönböztetni a hormonális eredetű hajhullást más lehetséges okoktól, például hiányállapottól, pajzsmirigy-problémától, bizonyos gyógyszerektől vagy jelentős stresszel teli időszaktól.',
    alert1Title: 'Érdemes megjegyezni',
    alert1Text: 'A jelentős, gyors vagy szokatlan hajhullás orvosi értékelést érdemel az ok kivizsgálása érdekében.',
    section5Body: 'Az egyszerű, következetes rutin általában jobb, mint sok termék rétegezése. A cél a bőr megtisztítása, hidratálása és védelme, miközben korlátozod mindazt, ami fenntarthatja az irritációt.',
    careHabits: [
      'Kíméletes, következetes bőrápolási rutin',
      'Napi napvédelem',
      'Kiegyensúlyozott étrend',
      'Türelem: az eredmények időt igényelnek',
    ],
    section6Body1: 'Amikor a haj vékonyabbá válik, segíthet korlátozni az ismételt terhelést: a túlzott hőt, a nagyon szoros frizurákat vagy a gyakori vegyi kezeléseket.',
    section6Body2: 'A bőrgyógyászati konzultáció megérheti, ha a hajsűrűség tovább csökken, hogy segítsen meghatározni az okot, és megbeszélni az elérhető kezeléseket.',
    practicalTitle: 'Praktikus tippek',
    practicalTips: [
      'Válassz kíméletes termékeket, és kerüld több irritáló kezelés rétegezését',
      'Tisztítsd a bőrt kiszárítás nélkül, szükség esetén reggel és este',
      'Használj napvédelmet, ha a bőr ki van téve',
      'Ne piszkáld a pattanásokat, hogy korlátozd a foltokat és hegeket',
      'Ha a tünetek fennmaradnak vagy rosszabbodnak, kérj tanácsot szakembertől',
    ],
    section7Body: 'A kezelés a tünetektől, azok intenzitásától, az életminőségre gyakorolt hatásuktól és minden nő céljaitól függ. Segíthet, ha több fronton dolgozol, ahelyett hogy egyetlen megoldást keresnél.',
    miniCards: [
      {title: 'Bőr', text: 'Megfelelő rutin és szükség esetén bőrgyógyászati tanács.'},
      {title: 'Szőrnövekedés', text: 'Kozmetikai vagy orvosi megoldások a helyzettől függően.'},
      {title: 'Haj', text: 'A kezelés kiválasztása előtt azonosítsd az okot.'},
      {title: 'Jólét', text: 'Vedd figyelembe a tünetek érzelmi hatását.'},
    ],
    section8Body1: 'Érdemes egészségügyi szakemberrel beszélni, ha az akné tartóssá vagy fájdalmassá válik, ha a szőrnövekedés gyorsan fokozódik, ha a haj érezhetően ritkul, vagy ha ezek a változások nagyon szabálytalan ciklusokkal járnak együtt.',
    section8Body2: 'Egy bőrgyógyász kezelheti a bőr- és hajtüneteket. Egy nőgyógyász vagy más kvalifikált szakember a hormonális kontextust és a PCOS esetleges további jeleit is felmérheti.',
    alert2Title: 'Szükség esetén fordulj orvoshoz',
    alert2Text: 'A gyors, jelentős szőrnövekedés, a hirtelen hajhullás vagy a szokatlan hormonális változások orvosi tanácsot igényelnek.',
    ideasReceived: [
      'Az, hogy aknéd van, automatikusan nem jelenti, hogy PCOS-ed van',
      'A látható szőrnövekedés nem feltétlenül kizárólag hormonokhoz kapcsolódik',
      'A PCOS bármilyen testalkatú nőt érinthet',
      'A tünetek idővel változhatnak, és nem azonosak minden nőnél',
    ],
    quoteText: 'A PCOS látható tünetei frusztrálóak lehetnek, de nem határozzák meg a nőiességedet, az értékedet vagy a higiéniádat.',
    summaryTitle: 'A lényeg',
    summaryItems: [
      'A PCOS érintheti a bőrt, a testszőrzetet és a hajat.',
      'A tünetek nőnként nagyon eltérőek.',
      'Egyetlen tünet nem elég a PCOS diagnosztizálásához.',
      'Léteznek megoldások a tünetek javítására.',
      'Az orvosi támogatás segíthet kiválasztani a számodra megfelelő megközelítést.',
    ],
    finalTipTitle: 'Legfontosabb tudnivalók',
    finalTipText: 'Az akné, a túlzott szőrnövekedés vagy a hajhullás a PCOS tünetei lehetnek, de nem elkerülhetetlenek. Az egyénre szabott megközelítés segíthet jobban kezelni a tüneteket, és kényelmesebben érezni magad a mindennapokban.',
    disclaimerText: 'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti az orvosi konzultációt, a diagnózist vagy az egyéni kezelést.',
    shareMessage: 'Bőr, haj és a PCOS látható tünetei — AWA',
  },
  ro: {
    badge: 'SOP',
    title: 'Pielea, părul și\nsimptomele vizibile',
    metaDuration: '9 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'SOP poate provoca schimbări vizibile ale pielii, ale părului de pe corp sau ale părului de pe cap. Înțelegerea originii lor face mai ușoară recunoașterea lor și cunoașterea soluțiilor care pot fi luate în considerare.',
    infoBannerText: 'Aceste semne sunt frecvente, dar singure nu sunt nici necesare, nici suficiente pentru a diagnostica SOP.',
    contentsTitle: 'În acest articol',
    contents: [
      'De ce apar aceste simptome',
      'Acneea hormonală',
      'Creșterea excesivă a părului',
      'Subțierea părului',
      'Grija pentru piele',
      'Grija pentru păr',
      'Ce poate ajuta zi de zi',
      'Când să mergi la medic',
      'Idei preconcepute frecvente',
      'Ce să reții',
    ],
    section1Body1: 'SOP poate implica o producție sau o activitate crescută a androgenilor, hormoni prezenți în mod natural și la femei. Când efectul lor este mai pronunțat, ei pot influența glandele sebacee, foliculii piloși și ciclul de creștere a părului.',
    section1Body2: 'Această influență hormonală este în mare parte ceea ce poate explica apariția acneei persistente, a creșterii accentuate a părului sau, la unele femei, a subțierii părului.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Simptomele vizibile nu reflectă neapărat cât de severă este SOP. O femeie poate avea mai multe simptome vizibile, în timp ce alta poate avea puține sau deloc.',
    section2Body1: 'Acneea legată de schimbările hormonale poate apărea sau persista dincolo de adolescență. Tinde să afecteze bărbia, linia maxilarului, obrajii inferiori sau uneori gâtul.',
    section2Body2: 'La unele persoane, leziunile sunt profunde, sensibile și recurente. Ele pot lăsa și urme pigmentate sau cicatrici atunci când sunt scobite sau când sunt deosebit de inflamate.',
    skinSignsTitle: 'Posibile semne la nivelul pielii',
    skinSigns: [
      'Acnee persistentă, mai ales în partea inferioară a feței',
      'Piele mai grasă decât înainte',
      'Acutizări ale acneei care urmează uneori schimbărilor hormonale',
      'Urme sau cicatrici rămase după acutizări',
    ],
    section3Body1: 'Hirsutismul desemnează creșterea mai abundentă a părului terminal în zone neafectate de obicei la femei. În contextul SOP, el poate fi legat de efectul androgenilor asupra foliculilor piloși.',
    section3Body2: 'Zonele cel mai frecvent afectate sunt bărbia, buza superioară, pieptul, abdomenul sau spatele. Cantitatea de păr care apare variază considerabil de la o persoană la alta.',
    hairSignsTitle: 'Posibile semne',
    hairSigns: [
      'Creștere mai vizibilă a părului pe față',
      'Păr mai gros pe bărbie sau pe buza superioară',
      'Creștere a părului care poate apărea pe piept, abdomen sau spate',
      'Subțierea treptată a părului în zona creștetului',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Creșterea părului depinde și de factori genetici și individuali. O creștere vizibilă a părului nu înseamnă automat că SOP este prezent.',
    section4Body1: 'Unele femei cu SOP observă și o scădere a densității părului. Subțierea poate fi deosebit de vizibilă în zona creștetului sau de-a lungul cărării.',
    section4Body2: 'Aceasta se poate instala treptat. Este important să deosebești căderea părului de origine hormonală de alte cauze posibile, precum o carență, o problemă tiroidiană, anumite medicamente sau o perioadă de stres important.',
    alert1Title: 'De reținut',
    alert1Text: 'Căderea importantă, rapidă sau neobișnuită a părului merită o evaluare medicală pentru a investiga cauza.',
    section5Body: 'O rutină simplă și constantă este în general mai bună decât suprapunerea mai multor produse. Scopul este de a curăța, hidrata și proteja pielea, limitând în același timp tot ce poate întreține iritația.',
    careHabits: [
      'O rutină de îngrijire blândă și constantă',
      'Protecție solară zilnică',
      'O alimentație echilibrată',
      'Răbdare: rezultatele necesită timp',
    ],
    section6Body1: 'Când părul devine mai fin, te poate ajuta să limitezi stresul repetat asupra lui: căldura excesivă, coafurile foarte strânse sau tratamentele chimice frecvente.',
    section6Body2: 'O consultație dermatologică poate merita dacă densitatea părului continuă să scadă, pentru a ajuta la stabilirea cauzei și la discutarea tratamentelor disponibile.',
    practicalTitle: 'Sfaturi practice',
    practicalTips: [
      'Alege produse blânde și evită suprapunerea mai multor tratamente iritante',
      'Curăță pielea fără a o decapa, dimineața și seara, la nevoie',
      'Folosește protecție solară când pielea este expusă',
      'Evită să scobești imperfecțiunile pentru a limita urmele și cicatricile',
      'Cere sfatul unui profesionist dacă simptomele persistă sau se agravează',
    ],
    section7Body: 'Gestionarea depinde de simptome, de intensitatea lor, de impactul lor asupra calității vieții și de obiectivele fiecărei femei. Poate ajuta să lucrezi pe mai multe fronturi în loc să cauți o singură soluție.',
    miniCards: [
      {title: 'Pielea', text: 'O rutină potrivită și sfatul unui dermatolog, la nevoie.'},
      {title: 'Creșterea părului', text: 'Soluții cosmetice sau medicale, în funcție de situație.'},
      {title: 'Părul', text: 'Identifică cauza înainte de a alege un tratament.'},
      {title: 'Starea de bine', text: 'Ține cont de impactul emoțional al simptomelor.'},
    ],
    section8Body1: 'Este bine să vorbești cu un profesionist din domeniul sănătății atunci când acneea devine persistentă sau dureroasă, când creșterea părului se accentuează rapid, când părul se subțiază vizibil sau când aceste schimbări sunt însoțite de cicluri foarte neregulate.',
    section8Body2: 'Un dermatolog poate gestiona simptomele pielii și ale părului. Un ginecolog sau alt profesionist calificat poate evalua și contextul hormonal și orice alte semne posibile de SOP.',
    alert2Title: 'Mergi la medic, la nevoie',
    alert2Text: 'O creștere rapidă și importantă a părului, o cădere bruscă a părului sau schimbări hormonale neobișnuite cer un sfat medical.',
    ideasReceived: [
      'A avea acnee nu înseamnă automat că ai SOP',
      'Creșterea vizibilă a părului nu este neapărat legată doar de hormoni',
      'SOP poate afecta femei de orice constituție',
      'Simptomele se pot schimba în timp și nu sunt aceleași la toate femeile',
    ],
    quoteText: 'Simptomele vizibile ale SOP pot fi frustrante, dar nu îți definesc feminitatea, valoarea sau igiena.',
    summaryTitle: 'Esențialul',
    summaryItems: [
      'SOP poate afecta pielea, părul de pe corp și părul de pe cap.',
      'Simptomele variază mult de la o femeie la alta.',
      'Un singur simptom nu este suficient pentru a diagnostica SOP.',
      'Există soluții care ajută la ameliorarea simptomelor.',
      'Sprijinul medical te poate ajuta să alegi abordarea potrivită pentru tine.',
    ],
    finalTipTitle: 'Ce să reții',
    finalTipText: 'Acneea, creșterea excesivă a părului sau căderea părului pot fi simptome ale SOP, dar nu sunt inevitabile. O abordare personalizată te poate ajuta să-ți gestionezi mai bine simptomele și să te simți mai confortabil zi de zi.',
    disclaimerText: 'Acest articol are doar caracter informativ și nu înlocuiește o consultație medicală, un diagnostic sau un tratament personalizat.',
    shareMessage: 'Pielea, părul și simptomele vizibile ale SOP — AWA',
  },
  bg: {
    badge: 'СПКЯ',
    title: 'Кожа, коса и\nвидими симптоми',
    metaDuration: '9 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'СПКЯ може да причини видими промени по кожата, окосмяването по тялото или косата на главата. Разбирането откъде идват улеснява разпознаването им и показва кои решения могат да се обмислят.',
    infoBannerText: 'Тези признаци са чести, но сами по себе си не са нито задължителни, нито достатъчни за диагноза СПКЯ.',
    contentsTitle: 'В тази статия',
    contents: [
      'Защо се появяват тези симптоми',
      'Хормонално акне',
      'Прекомерен растеж на косми',
      'Изтъняване на косата',
      'Грижа за кожата',
      'Грижа за косата',
      'Какво може да помогне ежедневно',
      'Кога да посетиш лекар',
      'Чести заблуди',
      'Какво да запомниш',
    ],
    section1Body1: 'СПКЯ може да включва повишено производство или активност на андрогените, хормони, които естествено присъстват и при жените. Когато ефектът им е по-изразен, те могат да влияят на мастните жлези, космените фоликули и цикъла на растеж на косата.',
    section1Body2: 'Това хормонално влияние до голяма степен може да обясни появата на упорито акне, засилен растеж на косми или, при някои жени, изтъняване на косата.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Видимите симптоми не отразяват непременно колко тежък е СПКЯ. Една жена може да има няколко видими симптома, а друга — малко или никакви.',
    section2Body1: 'Акнето, свързано с хормонални промени, може да се появи или да персистира след юношеството. Обикновено засяга брадичката, челюстната линия, долните бузи или понякога шията.',
    section2Body2: 'При някои хора лезиите са дълбоки, болезнени и рецидивиращи. Могат да оставят и пигментирани следи или белези, когато се бъркат или когато са особено възпалени.',
    skinSignsTitle: 'Възможни кожни признаци',
    skinSigns: [
      'Упорито акне, особено в долната част на лицето',
      'Кожа, по-мазна от преди',
      'Обостряне на акнето, което понякога следва хормонални промени',
      'Следи или белези след обостряне',
    ],
    section3Body1: 'Хирзутизъм означава засилен растеж на терминални косми в зони, обикновено незасегнати при жените. В контекста на СПКЯ може да се свърже с ефекта на андрогените върху космените фоликули.',
    section3Body2: 'Най-често засегнатите зони са брадичката, горната устна, гърдите, коремът или гърбът. Степента на растеж на косми варира значително от човек на човек.',
    hairSignsTitle: 'Възможни признаци',
    hairSigns: [
      'По-видим растеж на косми по лицето',
      'По-груби косми по брадичката или над горната устна',
      'Растеж на косми, който може да се появи по гърдите, корема или гърба',
      'Постепенно изтъняване на косата на темето',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Растежът на косми зависи и от генетични и индивидуални фактори. Забележимият растеж на косми не означава автоматично наличие на СПКЯ.',
    section4Body1: 'Някои жени със СПКЯ забелязват и намаляване на гъстотата на косата. Изтъняването може да е особено видимо на темето или по пробора.',
    section4Body2: 'Може да се развива постепенно. Важно е да се разграничи косопадът, свързан с хормони, от други възможни причини, като недостиг, проблем със щитовидната жлеза, някои лекарства или период на значителен стрес.',
    alert1Title: 'Заслужава си да се отбележи',
    alert1Text: 'Косопад, който е значителен, бърз или необичаен, заслужава медицинска оценка, за да се потърси причината.',
    section5Body: 'Проста и последователна рутина обикновено е по-добра от наслагването на много продукти. Целта е кожата да се почиства, хидратира и защитава, като се ограничава всичко, което може да поддържа дразненето.',
    careHabits: [
      'Нежна и последователна рутина за грижа за кожата',
      'Ежедневна защита от слънцето',
      'Балансирано хранене',
      'Търпение: резултатите отнемат време',
    ],
    section6Body1: 'Когато косата става по-фина, може да помогне да се ограничи многократното ѝ натоварване: прекомерна топлина, много стегнати прически или чести химични обработки.',
    section6Body2: 'Консултация с дерматолог може да си струва, ако гъстотата на косата продължава да намалява, за да се определи причината и да се обсъдят наличните лечения.',
    practicalTitle: 'Практически съвети',
    practicalTips: [
      'Избирай нежни продукти и избягвай наслагването на няколко дразнещи лечения',
      'Почиствай кожата, без да я пресушаваш, сутрин и вечер при нужда',
      'Използвай слънцезащита, когато кожата е открита',
      'Избягвай да бъркаш несъвършенствата, за да ограничиш следите и белезите',
      'Поискай съвет от специалист, ако симптомите продължават или се влошават',
    ],
    section7Body: 'Грижата зависи от симптомите, интензивността им, влиянието им върху качеството на живот и целите на всяка жена. Може да помогне да се работи по няколко фронта, вместо да се търси едно-единствено решение.',
    miniCards: [
      {title: 'Кожа', text: 'Подходяща рутина и съвет от дерматолог при нужда.'},
      {title: 'Растеж на косми', text: 'Козметични или медицински решения според ситуацията.'},
      {title: 'Коса', text: 'Определи причината, преди да избереш лечение.'},
      {title: 'Благополучие', text: 'Вземи предвид емоционалното въздействие на симптомите.'},
    ],
    section8Body1: 'Добре е да поговориш със здравен специалист, когато акнето стане упорито или болезнено, когато растежът на косми се засили бързо, когато косата изтънее забележимо или когато тези промени идват с много нередовни цикли.',
    section8Body2: 'Дерматолог може да се погрижи за кожните симптоми и симптомите по косата. Гинеколог или друг квалифициран специалист може да оцени и хормоналния контекст и други възможни признаци на СПКЯ.',
    alert2Title: 'Посети лекар при нужда',
    alert2Text: 'Бърз, значителен растеж на косми, внезапен косопад или необичайни хормонални промени изискват медицински съвет.',
    ideasReceived: [
      'Наличието на акне не означава автоматично, че имаш СПКЯ',
      'Видимият растеж на косми не е непременно свързан само с хормоните',
      'СПКЯ може да засяга жени с всякакво телосложение',
      'Симптомите могат да се променят с времето и не са еднакви при всяка жена',
    ],
    quoteText: 'Видимите симптоми на СПКЯ могат да бъдат изнервящи, но не определят женствеността, стойността или хигиената ти.',
    summaryTitle: 'Същественото',
    summaryItems: [
      'СПКЯ може да засяга кожата, окосмяването по тялото и косата на главата.',
      'Симптомите варират много от жена на жена.',
      'Един симптом не е достатъчен за диагноза СПКЯ.',
      'Съществуват решения, които помагат за подобряване на симптомите.',
      'Медицинската подкрепа може да ти помогне да избереш подходящия за теб подход.',
    ],
    finalTipTitle: 'Какво да запомниш',
    finalTipText: 'Акнето, прекомерният растеж на косми или косопадът могат да са симптоми на СПКЯ, но не са неизбежни. Персонализираният подход може да ти помогне да се справяш по-добре със симптомите и да се чувстваш по-комфортно всеки ден.',
    disclaimerText: 'Тази статия е само за информация и не замества медицинска консултация, диагноза или персонализирано лечение.',
    shareMessage: 'Кожа, коса и видими симптоми на СПКЯ — AWA',
  },
  sr: {
    badge: 'ПЦОС',
    title: 'Кожа, коса и\nвидљиви симптоми',
    metaDuration: '9 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'ПЦОС може изазвати видљиве промене на кожи, длакама по телу или коси на глави. Разумевање одакле долазе олакшава њихово препознавање и показује која решења се могу размотрити.',
    infoBannerText: 'Ови знаци су чести, али сами по себи нису ни обавезни ни довољни за дијагнозу ПЦОС-а.',
    contentsTitle: 'У овом чланку',
    contents: [
      'Зашто се ови симптоми појављују',
      'Хормонске акне',
      'Прекомеран раст длака',
      'Истањивање косе',
      'Нега коже',
      'Нега косе',
      'Шта може помоћи свакодневно',
      'Када посетити лекара',
      'Чести погрешни ставови',
      'Шта да запамтиш',
    ],
    section1Body1: 'ПЦОС може укључивати повећану производњу или активност андрогена, хормона који су природно присутни и код жена. Када је њихов ефекат израженији, могу утицати на лојне жлезде, фоликуле длака и циклус раста косе.',
    section1Body2: 'Овај хормонски утицај до велике мере може објаснити појаву упорних акни, појачаног раста длака или, код неких жена, истањивања косе.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Видљиви симптоми не одражавају нужно колико је тежак ПЦОС. Једна жена може имати неколико видљивих симптома, а друга мало или нимало.',
    section2Body1: 'Акне повезане са хормонским променама могу се појавити или трајати после адолесценције. Обично погађају брадичку, линију вилице, доње образе или понекад врат.',
    section2Body2: 'Код неких особа лезије су дубоке, осетљиве и поновљиве. Могу оставити и пигментиране трагове или ожиљке када се чачкају или када су посебно запаљене.',
    skinSignsTitle: 'Могући знаци на кожи',
    skinSigns: [
      'Упорне акне, нарочито у доњем делу лица',
      'Кожа мастнија него раније',
      'Погоршања акни која понекад следе хормонске промене',
      'Трагови или ожиљци после погоршања',
    ],
    section3Body1: 'Хирзутизам означава појачан раст терминалних длака у деловима који код жена обично нису захваћени. У контексту ПЦОС-а може бити повезан са дејством андрогена на фоликуле длака.',
    section3Body2: 'Најчешће захваћени делови су брадичка, горња усна, груди, стомак или леђа. Степен раста длака знатно варира од особе до особе.',
    hairSignsTitle: 'Могући знаци',
    hairSigns: [
      'Видљивији раст длака на лицу',
      'Грубље длаке на брадичци или изнад горње усне',
      'Раст длака који се може појавити на грудима, стомаку или леђима',
      'Постепено истањивање косе на темену',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Раст длака зависи и од генетских и индивидуалних фактора. Приметан раст длака не значи аутоматски присуство ПЦОС-а.',
    section4Body1: 'Неке жене са ПЦОС-ом примећују и смањење густине косе. Истањивање може бити посебно видљиво на темену или по пробору.',
    section4Body2: 'Може се развијати постепено. Важно је разликовати опадање косе повезано са хормонима од других могућих узрока, као што су недостаци, проблем са штитном жлездом, одређени лекови или период значајног стреса.',
    alert1Title: 'Вреди напоменути',
    alert1Text: 'Опадање косе које је значајно, брзо или необично заслужује медицинску процену ради истраживања узрока.',
    section5Body: 'Једноставна и доследна рутина обично је боља од наслагања многих производа. Циљ је да се кожа чисти, хидратише и штити, уз ограничавање свега што може одржавати иритацију.',
    careHabits: [
      'Нежна, доследна рутина неге коже',
      'Свакодневна заштита од сунца',
      'Уравнотежена исхрана',
      'Стрпљење: резултати захтевају време',
    ],
    section6Body1: 'Када коса постаје финија, може помоћи да се ограничи њено поновљено оптерећење: прекомерна топлота, веома стегнуте фризуре или честе хемијске обраде.',
    section6Body2: 'Консултација са дерматологом може бити вредна ако се густина косе наставља смањивати, ради утврђивања узрока и разговора о доступним терапијама.',
    practicalTitle: 'Практични савети',
    practicalTips: [
      'Бирај нежне производе и избегавај наслагање више иритирајућих третмана',
      'Чисти кожу без исушивања, ујутру и увече по потреби',
      'Користи заштиту од сунца када је кожа изложена',
      'Избегавај чачкање пришти да ограничиш трагове и ожиљке',
      'Затражи савет од стручњака ако симптоми трају или се погоршавају',
    ],
    section7Body: 'Нега зависи од симптома, њиховог интензитета, утицаја на квалитет живота и циљева сваке жене. Може помоћи да се ради на више фронтова уместо тражења једног јединог решења.',
    miniCards: [
      {title: 'Кожа', text: 'Прикладна рутина и савет дерматолога по потреби.'},
      {title: 'Раст длака', text: 'Козметичка или медицинска решења зависно од ситуације.'},
      {title: 'Коса', text: 'Утврди узрок пре избора терапије.'},
      {title: 'Благостање', text: 'Узми у обзир емоционални утицај симптома.'},
    ],
    section8Body1: 'Добро је разговарати са здравственим радником када акне постану упорне или болне, када се раст длака брзо појача, када се коса приметно истањи или када ове промене долазе са веома нередовним циклусима.',
    section8Body2: 'Дерматолог може збринути симптоме на кожи и коси. Гинеколог или други квалификовани стручњак може проценити и хормонски контекст и друге могуће знаке ПЦОС-а.',
    alert2Title: 'Посети лекара по потреби',
    alert2Text: 'Брз, значајан раст длака, изненадно опадање косе или необичне хормонске промене захтевају медицински савет.',
    ideasReceived: [
      'Постојање акни не значи аутоматски да имаш ПЦОС',
      'Видљив раст длака није нужно повезан само са хормонима',
      'ПЦОС може погађати жене сваког телосложења',
      'Симптоми се могу мењати током времена и нису исти код сваке жене',
    ],
    quoteText: 'Видљиви симптоми ПЦОС-а могу бити изнервирајући, али не одређују твоју женственост, вредност нити хигијену.',
    summaryTitle: 'Основно',
    summaryItems: [
      'ПЦОС може утицати на кожу, длаке по телу и косу на глави.',
      'Симптоми увелико варирају од жене до жене.',
      'Један симптом није довољан за дијагнозу ПЦОС-а.',
      'Постоје решења која помажу да се симптоми побољшају.',
      'Медицинска подршка може ти помоћи да изабереш прави приступ за тебе.',
    ],
    finalTipTitle: 'Шта да запамтиш',
    finalTipText: 'Акне, прекомеран раст длака или опадање косе могу бити симптоми ПЦОС-а, али нису неизбежни. Персонализован приступ може ти помоћи да боље управљаш симптомима и осећаш се удобније сваки дан.',
    disclaimerText: 'Овај чланак је само за информацију и не замењује лекарску консултацију, дијагнозу или персонализовано лечење.',
    shareMessage: 'Кожа, коса и видљиви симптоми ПЦОС-а — AWA',
  },
  hr: {
    badge: 'PCOS',
    title: 'Koža, kosa i\nvidljivi simptomi',
    metaDuration: '9 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'PCOS može uzrokovati vidljive promjene na koži, dlakama na tijelu ili kosi. Razumijevanje njihova podrijetla olakšava ih prepoznati i znati koja se rješenja mogu razmotriti.',
    infoBannerText: 'Ti su znakovi česti, ali sami po sebi nisu ni obvezni ni dovoljni za dijagnozu PCOS-a.',
    contentsTitle: 'U ovom članku',
    contents: [
      'Zašto se ti simptomi pojavljuju',
      'Hormonske akne',
      'Pretjeran rast dlaka',
      'Prorjeđivanje kose',
      'Briga o koži',
      'Briga o kosi',
      'Što može pomoći iz dana u dan',
      'Kada posjetiti liječnika',
      'Česta pogrešna uvjerenja',
      'Ključne poruke',
    ],
    section1Body1: 'PCOS može uključivati pojačano stvaranje ili djelovanje androgena, hormona koji su prirodno prisutni i kod žena. Kad je njihov učinak izraženiji, mogu utjecati na lojne žlijezde, folikule dlaka i ciklus rasta dlaka.',
    section1Body2: 'Taj hormonski utjecaj uvelike može objasniti pojavu upornih akni, pojačanog rasta dlaka ili, kod nekih žena, prorjeđivanja kose.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Vidljivi simptomi ne odražavaju nužno koliko je PCOS težak. Jedna žena može imati nekoliko vidljivih simptoma, dok druga može imati malo njih ili nijedan.',
    section2Body1: 'Akne povezane s hormonskim promjenama mogu se pojaviti ili potrajati i nakon adolescencije. Obično pogađaju bradu, liniju čeljusti, donje obraze ili ponekad vrat.',
    section2Body2: 'Kod nekih osoba upale su duboke, bolne i ponavljaju se. Mogu ostaviti i pigmentirane tragove ili ožiljke kad se čačkaju ili kad su posebno upaljene.',
    skinSignsTitle: 'Mogući znakovi na koži',
    skinSigns: [
      'Uporne akne, osobito na donjem dijelu lica',
      'Koža masnija nego prije',
      'Pogoršanja akni koja ponekad slijede hormonske promjene',
      'Tragovi ili ožiljci koji ostaju nakon pogoršanja',
    ],
    section3Body1: 'Hirzutizam označava pojačan rast terminalnih dlaka na područjima koja kod žena obično nisu zahvaćena. U kontekstu PCOS-a može biti povezan s učinkom androgena na folikule dlaka.',
    section3Body2: 'Najčešće zahvaćena područja su brada, gornja usna, prsa, trbuh ili leđa. Količina rasta dlaka znatno se razlikuje od osobe do osobe.',
    hairSignsTitle: 'Mogući znakovi',
    hairSigns: [
      'Vidljiviji rast dlaka na licu',
      'Grublje dlake na bradi ili gornjoj usni',
      'Rast dlaka koji se može pojaviti na prsima, trbuhu ili leđima',
      'Postupno prorjeđivanje kose na tjemenu',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Rast dlaka ovisi i o genetskim i individualnim čimbenicima. Primjetan rast dlaka automatski ne znači da je prisutan PCOS.',
    section4Body1: 'Neke žene s PCOS-om primjećuju i smanjenje gustoće kose. Prorjeđivanje može biti osobito vidljivo na tjemenu ili duž razdjeljka.',
    section4Body2: 'To se može razvijati postupno. Važno je razlikovati gubitak kose povezan s hormonima od drugih mogućih uzroka, poput nedostatka, problema sa štitnjačom, određenih lijekova ili razdoblja jakog stresa.',
    alert1Title: 'Vrijedi napomenuti',
    alert1Text: 'Gubitak kose koji je znatan, brz ili neobičan zaslužuje liječničku procjenu kako bi se istražio uzrok.',
    section5Body: 'Jednostavna, dosljedna rutina općenito je bolja od nanošenja mnogo proizvoda. Cilj je očistiti, hidratizirati i zaštititi kožu uz ograničavanje svega što može održavati iritaciju.',
    careHabits: [
      'Nježna, dosljedna rutina njege kože',
      'Svakodnevna zaštita od sunca',
      'Uravnotežena prehrana',
      'Strpljenje: rezultati traže vremena',
    ],
    section6Body1: 'Kad kosa postane tanja, može pomoći ograničiti njezino ponavljano opterećenje: pretjeranu toplinu, vrlo zategnute frizure ili česte kemijske tretmane.',
    section6Body2: 'Dermatološki pregled može biti vrijedan ako se gustoća kose nastavi smanjivati, kako bi se utvrdio uzrok i razgovaralo o dostupnim terapijama.',
    practicalTitle: 'Praktični savjeti',
    practicalTips: [
      'Odaberi nježne proizvode i izbjegavaj nanošenje više iritirajućih tretmana',
      'Čisti kožu bez isušivanja, ujutro i navečer po potrebi',
      'Koristi zaštitu od sunca kad je koža izložena',
      'Izbjegavaj čačkanje nečistoća kako bi ograničila tragove i ožiljke',
      'Zatraži savjet stručne osobe ako simptomi potraju ili se pogoršaju',
    ],
    section7Body: 'Zbrinjavanje ovisi o simptomima, njihovu intenzitetu, utjecaju na kvalitetu života i ciljevima svake žene. Može pomoći raditi na nekoliko frontova umjesto traženja jednog rješenja.',
    miniCards: [
      {title: 'Koža', text: 'Prikladna rutina i dermatološki savjet po potrebi.'},
      {title: 'Rast dlaka', text: 'Kozmetička ili medicinska rješenja ovisno o situaciji.'},
      {title: 'Kosa', text: 'Utvrdi uzrok prije odabira terapije.'},
      {title: 'Dobrobit', text: 'Uzmi u obzir emocionalni utjecaj simptoma.'},
    ],
    section8Body1: 'Dobro je razgovarati sa zdravstvenim djelatnikom kad akne postanu uporne ili bolne, kad se rast dlaka brzo pojača, kad se kosa osjetno prorijedi ili kad te promjene prate vrlo nepravilni ciklusi.',
    section8Body2: 'Dermatolog može zbrinjavati simptome kože i kose. Ginekolog ili druga kvalificirana stručna osoba može procijeniti i hormonski kontekst te sve druge moguće znakove PCOS-a.',
    alert2Title: 'Posjeti liječnika po potrebi',
    alert2Text: 'Brz, znatan rast dlaka, iznenadan gubitak kose ili neobične hormonske promjene zahtijevaju liječnički savjet.',
    ideasReceived: [
      'Imati akne automatski ne znači da imaš PCOS',
      'Vidljiv rast dlaka nije nužno povezan samo s hormonima',
      'PCOS može pogoditi žene svih tjelesnih građa',
      'Simptomi se mogu mijenjati tijekom vremena i nisu isti za svaku ženu',
    ],
    quoteText: 'Vidljivi simptomi PCOS-a mogu biti frustrirajući, ali ne određuju tvoju ženstvenost, vrijednost ni higijenu.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'PCOS može utjecati na kožu, dlake na tijelu i kosu.',
      'Simptomi se jako razlikuju od žene do žene.',
      'Jedan simptom nije dovoljan za dijagnozu PCOS-a.',
      'Postoje rješenja koja pomažu poboljšati simptome.',
      'Medicinska podrška može ti pomoći odabrati pravi pristup za sebe.',
    ],
    finalTipTitle: 'Ključne poruke',
    finalTipText: 'Akne, pretjeran rast dlaka ili gubitak kose mogu biti simptomi PCOS-a, ali nisu neizbježni. Personalizirani pristup može ti pomoći bolje zbrinuti simptome i osjećati se ugodnije iz dana u dan.',
    disclaimerText: 'Ovaj je članak samo informativan i ne zamjenjuje liječnički pregled, dijagnozu ni personaliziranu terapiju.',
    shareMessage: 'Koža, kosa i vidljivi simptomi PCOS-a — AWA',
  },
  bs: {
    badge: 'PCOS',
    title: 'Koža, kosa i\nvidljivi simptomi',
    metaDuration: '9 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'PCOS može uzrokovati vidljive promjene na koži, dlakama na tijelu ili kosi. Razumijevanje njihova podrijetla olakšava ih prepoznati i znati koja se rješenja mogu razmotriti.',
    infoBannerText: 'Ti su znakovi česti, ali sami po sebi nisu ni obvezni ni dovoljni za dijagnozu PCOS-a.',
    contentsTitle: 'U ovom članku',
    contents: [
      'Zašta se ti simptomi pojavljuju',
      'Hormonske akne',
      'Pretjeran rast dlaka',
      'Prorjeđivanje kose',
      'Briga o koži',
      'Briga o kosi',
      'Što može pomoći iz dana u dan',
      'Kada posjetiti ljekara',
      'Česta pogrešna uvjerenja',
      'Ključne poruke',
    ],
    section1Body1: 'PCOS može uključivati pojačano stvaranje ili djelovanje androgena, hormona koji su prirodno prisutni i kod žena. Kad je njihov učinak izraženiji, mogu utjecati na lojne žlijezde, folikule dlaka i ciklus rasta dlaka.',
    section1Body2: 'Taj hormonski utjecaj uvelike može objasniti pojavu upornih akni, pojačanog rasta dlaka ili, kod nekih žena, prorjeđivanja kose.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Vidljivi simptomi ne odražavaju nužno koliko je PCOS težak. Jedna žena može imati nekoliko vidljivih simptoma, dok druga može imati malo njih ili nijedan.',
    section2Body1: 'Akne povezane s hormonskim promjenama mogu se pojaviti ili potrajati i nakon adolescencije. Obično pogađaju bradu, liniju čeljusti, donje obraze ili ponekad vrat.',
    section2Body2: 'Kod nekih osoba upale su duboke, bolne i ponavljaju se. Mogu ostaviti i pigmentirane tragove ili ožiljke kad se čačkaju ili kad su posebno upaljene.',
    skinSignsTitle: 'Mogući znakovi na koži',
    skinSigns: [
      'Uporne akne, osobito na donjem dijelu lica',
      'Koža masnija nego prije',
      'Pogoršanja akni koja ponekad slijede hormonske promjene',
      'Tragovi ili ožiljci koji ostaju nakon pogoršanja',
    ],
    section3Body1: 'Hirzutizam označava pojačan rast terminalnih dlaka na područjima koja kod žena obično nisu zahvaćena. U kontekstu PCOS-a može biti povezan s učinkom androgena na folikule dlaka.',
    section3Body2: 'Najčešće zahvaćena područja su brada, gornja usna, prsa, trbuh ili leđa. Količina rasta dlaka znatno se razlikuje od osobe do osobe.',
    hairSignsTitle: 'Mogući znakovi',
    hairSigns: [
      'Vidljiviji rast dlaka na licu',
      'Grublje dlake na bradi ili gornjoj usni',
      'Rast dlaka koji se može pojaviti na prsima, trbuhu ili leđima',
      'Postupno prorjeđivanje kose na tjemenu',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Rast dlaka ovisi i o genetskim i individualnim čimbenicima. Primjetan rast dlaka automatski ne znači da je prisutan PCOS.',
    section4Body1: 'Neke žene s PCOS-om primjećuju i smanjenje gustoće kose. Prorjeđivanje može biti osobito vidljivo na tjemenu ili duž razdjeljka.',
    section4Body2: 'To se može razvijati postupno. Važno je razlikovati gubitak kose povezan s hormonima od drugih mogućih uzroka, poput nedostatka, problema sa štitnjačom, određenih lijekova ili razdoblja jakog stresa.',
    alert1Title: 'Vrijedi napomenuti',
    alert1Text: 'Gubitak kose koji je znatan, brz ili neobičan zaslužuje ljekarsku procjenu kako bi se istražio uzrok.',
    section5Body: 'Jednostavna, dosljedna rutina općenito je bolja od nanošenja mnogo proizvoda. Cilj je očistiti, hidratizirati i zaštititi kožu uz ograničavanje svega što može održavati iritaciju.',
    careHabits: [
      'Nježna, dosljedna rutina njege kože',
      'Svakodnevna zaštita od sunca',
      'Uravnotežena ishrana',
      'Strpljenje: rezultati traže vremena',
    ],
    section6Body1: 'Kad kosa postane tanja, može pomoći ograničiti njezino ponavljano opterećenje: pretjeranu toplinu, vrlo zategnute frizure ili česte kemijske tretmane.',
    section6Body2: 'Dermatološki pregled može biti vrijedan ako se gustoća kose nastavi smanjivati, kako bi se utvrdio uzrok i razgovaralo o dostupnim terapijama.',
    practicalTitle: 'Praktični savjeti',
    practicalTips: [
      'Odaberi nježne proizvode i izbjegavaj nanošenje više iritirajućih tretmana',
      'Čisti kožu bez isušivanja, ujutro i navečer po potrebi',
      'Koristi zaštitu od sunca kad je koža izložena',
      'Izbjegavaj čačkanje nečistoća kako bi ograničila tragove i ožiljke',
      'Zatraži savjet stručne osobe ako simptomi potraju ili se pogoršaju',
    ],
    section7Body: 'Zbrinjavanje ovisi o simptomima, njihovu intenzitetu, utjecaju na kvalitetu života i ciljevima svake žene. Može pomoći raditi na nekoliko frontova umjesto traženja jednog rješenja.',
    miniCards: [
      {title: 'Koža', text: 'Prikladna rutina i dermatološki savjet po potrebi.'},
      {title: 'Rast dlaka', text: 'Kozmetička ili medicinska rješenja ovisno o situaciji.'},
      {title: 'Kosa', text: 'Utvrdi uzrok prije odabira terapije.'},
      {title: 'Dobrobit', text: 'Uzmi u obzir emocionalni utjecaj simptoma.'},
    ],
    section8Body1: 'Dobro je razgovarati sa zdravstvenim radnikom kad akne postanu uporne ili bolne, kad se rast dlaka brzo pojača, kad se kosa osjetno prorijedi ili kad te promjene prate vrlo nepravilni ciklusi.',
    section8Body2: 'Dermatolog može zbrinjavati simptome kože i kose. Ginekolog ili druga kvalificirana stručna osoba može procijeniti i hormonski kontekst te sve druge moguće znakove PCOS-a.',
    alert2Title: 'Posjeti ljekara po potrebi',
    alert2Text: 'Brz, znatan rast dlaka, iznenadan gubitak kose ili neobične hormonske promjene zahtijevaju ljekarski savjet.',
    ideasReceived: [
      'Imati akne automatski ne znači da imaš PCOS',
      'Vidljiv rast dlaka nije nužno povezan samo s hormonima',
      'PCOS može pogoditi žene svih tjelesnih građa',
      'Simptomi se mogu mijenjati tokom vremena i nisu isti za svaku ženu',
    ],
    quoteText: 'Vidljivi simptomi PCOS-a mogu biti frustrirajući, ali ne određuju tvoju ženstvenost, vrijednost ni higijenu.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'PCOS može utjecati na kožu, dlake na tijelu i kosu.',
      'Simptomi se jako razlikuju od žene do žene.',
      'Jedan simptom nije dovoljan za dijagnozu PCOS-a.',
      'Postoje rješenja koja pomažu poboljšati simptome.',
      'Medicinska podrška može ti pomoći odabrati pravi pristup za sebe.',
    ],
    finalTipTitle: 'Ključne poruke',
    finalTipText: 'Akne, pretjeran rast dlaka ili gubitak kose mogu biti simptomi PCOS-a, ali nisu neizbježni. Personalizirani pristup može ti pomoći bolje zbrinuti simptome i osjećati se ugodnije iz dana u dan.',
    disclaimerText: 'Ovaj je članak samo informativan i ne zamjenjuje ljekarski pregled, dijagnozu ni personaliziranu terapiju.',
    shareMessage: 'Koža, kosa i vidljivi simptomi PCOS-a — AWA',
  },
  sl: {
    badge: 'PCOS',
    title: 'Koža, lasje in\nvidni simptomi',
    metaDuration: '9 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'PCOS lahko povzroči vidne spremembe na koži, dlakah na telesu ali laseh. Razumevanje njihovega izvora olajša njihovo prepoznavanje in vedenje, katere rešitve se lahko razmislijo.',
    infoBannerText: 'Ti znaki so pogosti, vendar sami po sebi niso niti obvezni niti dovolj za diagnozo PCOS.',
    contentsTitle: 'V tem članku',
    contents: [
      'Zakaj se ti simptomi pojavljajo',
      'Hormonske akne',
      'Pretirana rast dlak',
      'Redčenje las',
      'Skrb za kožo',
      'Skrb za lase',
      'Kaj lahko pomaga iz dneva v dan',
      'Kdaj obiskati zdravnika',
      'Pogosta napačna prepričanja',
      'Ključna sporočila',
    ],
    section1Body1: 'PCOS lahko vključuje povečano proizvodnjo ali delovanje androgenov, hormonov, ki so naravno prisotni tudi pri ženskah. Kadar je njihov učinek izrazitejši, lahko vplivajo na lojne žleze, folikle dlak in cikel rasti dlak.',
    section1Body2: 'Ta hormonski vpliv lahko v veliki meri pojasni pojav vztrajnih akn, povečane rasti dlak ali, pri nekaterih ženskah, redčenja las.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Vidni simptomi ne odražajo nujno, kako hud je PCOS. Ena ženska ima lahko več vidnih simptomov, druga pa malo ali nobenega.',
    section2Body1: 'Akne, povezane s hormonskimi spremembami, se lahko pojavijo ali vztrajajo tudi po adolescenci. Običajno prizadenejo brado, linijo čeljusti, spodnja lica ali včasih vrat.',
    section2Body2: 'Pri nekaterih osebah so vnetja globoka, boleča in se ponavljajo. Lahko pustijo tudi pigmentirane sledi ali brazgotine, kadar se praskajo ali so posebno vnetna.',
    skinSignsTitle: 'Možni znaki na koži',
    skinSigns: [
      'Vztrajne akne, zlasti na spodnjem delu obraza',
      'Koža bolj mastna kot prej',
      'Poslabšanja akn, ki včasih sledijo hormonskim spremembam',
      'Sledi ali brazgotine, ki ostanejo po poslabšanjih',
    ],
    section3Body1: 'Hirzutizem pomeni povečano rast terminalnih dlak na območjih, ki običajno pri ženskah niso prizadeta. V kontekstu PCOS je lahko povezan z učinkom androgenov na folikle dlak.',
    section3Body2: 'Najpogosteje prizadeta območja so brada, zgornja ustnica, prsi, trebuh ali hrbet. Količina rasti dlak se močno razlikuje od osebe do osebe.',
    hairSignsTitle: 'Možni znaki',
    hairSigns: [
      'Bolj vidna rast dlak na obrazu',
      'Grobe dlake na bradi ali zgornji ustnici',
      'Rast dlak, ki se lahko pojavi na prsih, trebuhu ali hrbtu',
      'Postopno redčenje las na temenu',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Rast dlak je odvisna tudi od genetskih in individualnih dejavnikov. Opazna rast dlak samodejno ne pomeni, da je prisoten PCOS.',
    section4Body1: 'Nekatere ženske s PCOS opazijo tudi zmanjšanje gostote las. Redčenje je lahko še posebej vidno na temenu ali ob razdelku.',
    section4Body2: 'To se lahko razvija postopoma. Pomembno je razlikovati izpadanje las, povezano s hormoni, od drugih možnih vzrokov, kot so pomanjkanje, težave s ščitnico, določena zdravila ali obdobje hudega stresa.',
    alert1Title: 'Vredno omeniti',
    alert1Text: 'Izpadanje las, ki je pomembno, hitro ali nenavadno, si zasluži zdravniško oceno za raziskavo vzroka.',
    section5Body: 'Preprosta, dosledna rutina je na splošno boljša od nanašanja mnogih izdelkov. Cilj je očistiti, navlažiti in zaščititi kožo ob omejevanju vsega, kar lahko vzdržuje draženje.',
    careHabits: [
      'Nežna, dosledna rutina nege kože',
      'Vsakodnevna zaščita pred soncem',
      'Uravnotežena prehrana',
      'Potrpežljivost: rezultati zahtevajo čas',
    ],
    section6Body1: 'Kadar lasje postanejo tanjši, lahko pomaga omejiti njihovo ponavljajoče se obremenjevanje: pretirano toploto, zelo zategnjene pričeske ali pogosta kemična zdravljenja.',
    section6Body2: 'Dermatološki pregled je lahko vreden, če se gostota las še naprej zmanjšuje, da se ugotovi vzrok in razpravlja o razpoložljivih zdravljenjih.',
    practicalTitle: 'Praktični nasveti',
    practicalTips: [
      'Izberi nežne izdelke in se izogibaj nanašanju več dražečih zdravljenj',
      'Kožo čisti brez izsuševanja, zjutraj in zvečer po potrebi',
      'Uporabljaj zaščito pred soncem, kadar je koža izpostavljena',
      'Izogibaj se praskanju nečistoč, da omejiš sledi in brazgotine',
      'Poišči nasvet strokovnjaka, če simptomi vztrajajo ali se poslabšajo',
    ],
    section7Body: 'Obvladovanje je odvisno od simptomov, njihove intenzivnosti, vpliva na kakovost življenja in ciljev vsake ženske. Lahko pomaga delati na več frontah namesto iskanja ene same rešitve.',
    miniCards: [
      {title: 'Koža', text: 'Primerna rutina in dermatološki nasvet po potrebi.'},
      {title: 'Rast dlak', text: 'Kozmetične ali zdravstvene rešitve glede na situacijo.'},
      {title: 'Lasje', text: 'Ugotovi vzrok pred izbiro zdravljenja.'},
      {title: 'Dobro počutje', text: 'Upoštevaj čustveni vpliv simptomov.'},
    ],
    section8Body1: 'Dobro je govoriti z zdravstvenim delavcem, kadar akne postanejo vztrajne ali boleče, kadar se rast dlak hitro poveča, kadar se lasje opazno redčijo ali kadar te spremembe spremljajo zelo neredni cikli.',
    section8Body2: 'Dermatolog lahko obvladuje simptome kože in las. Ginekolog ali drug kvalificiran strokovnjak lahko oceni tudi hormonski kontekst in vse druge možne znake PCOS.',
    alert2Title: 'Po potrebi obišči zdravnika',
    alert2Text: 'Hitra, pomembna rast dlak, nenadno izpadanje las ali nenavadne hormonske spremembe zahtevajo zdravniški nasvet.',
    ideasReceived: [
      'Imeti akne samodejno ne pomeni, da imaš PCOS',
      'Vidna rast dlak ni nujno povezana samo s hormoni',
      'PCOS lahko prizadene ženske vseh telesnih postav',
      'Simptomi se lahko skozi čas spreminjajo in niso enaki pri vsaki ženski',
    ],
    quoteText: 'Vidni simptomi PCOS so lahko frustrirajoči, a ne določajo tvoje ženstvenosti, vrednosti ali higiene.',
    summaryTitle: 'Najpomembnejše',
    summaryItems: [
      'PCOS lahko vpliva na kožo, dlake na telesu in lase.',
      'Simptomi se zelo razlikujejo od ženske do ženske.',
      'En simptom ni dovolj za diagnozo PCOS.',
      'Obstajajo rešitve, ki pomagajo izboljšati simptome.',
      'Zdravstvena podpora ti lahko pomaga izbrati pravi pristop zase.',
    ],
    finalTipTitle: 'Ključna sporočila',
    finalTipText: 'Akne, pretirana rast dlak ali izpadanje las so lahko simptomi PCOS, vendar niso neizogibni. Personaliziran pristop ti lahko pomaga bolje obvladovati simptome in se čutiti udobneje iz dneva v dan.',
    disclaimerText: 'Ta članek je samo informativen in ne nadomešča zdravniškega pregleda, diagnoze ali personaliziranega zdravljenja.',
    shareMessage: 'Koža, lasje in vidni simptomi PCOS — AWA',
  },
  ne: {
    badge: 'PCOS',
    title: 'छाला, कपाल र\nदेखिने लक्षणहरू',
    metaDuration: '9 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'PCOS ले छाला, शरीरका रौँ वा टाउकोको कपालमा देखिने परिवर्तन ल्याउन सक्छ। यी कहाँबाट आउँछन् बुझ्नाले तिनलाई चिन्न र कुन समाधान विचार गर्न सकिन्छ जान्न सजिलो बनाउँछ।',
    infoBannerText: 'यी संकेतहरू सामान्य छन्, तर आफैँमा ती PCOS को निदान गर्न न त आवश्यक न त पर्याप्त छन्।',
    contentsTitle: 'यो लेखमा',
    contents: [
      'यी लक्षणहरू किन देखिन्छन्',
      'हर्मोनल पिम्पल',
      'अत्यधिक रौँ वृद्धि',
      'कपाल पातलो हुने',
      'आफ्नो छालाको ख्याल राख्ने',
      'आफ्नो कपालको ख्याल राख्ने',
      'दिनदिनै के मद्दत गर्न सक्छ',
      'चिकित्सकलाई कहिले देखाउने',
      'सामान्य भ्रमहरू',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'PCOS मा एन्ड्रोजनको बढेको उत्पादन वा गतिविधि हुन सक्छ, जुन हर्मोन महिलामा पनि स्वाभाविक रूपमा हुन्छन्। तिनको प्रभाव बढी स्पष्ट हुँदा, तिनले सेबेसियस ग्रन्थि, कपालका जरा र कपाल वृद्धिको चक्रलाई प्रभाव पार्न सक्छन्।',
    section1Body2: 'यही हर्मोनल प्रभावले लगातार पिम्पल, बढेको रौँ वृद्धि, वा केही महिलामा कपाल पातलो हुनुको व्याख्या गर्न सक्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'देखिने लक्षणहरूले PCOS कति गम्भीर छ भन्ने अनिवार्य रूपमा प्रतिबिम्बित गर्दैनन्। एक महिलामा धेरै देखिने लक्षण हुन सक्छन्, जबकि अर्कोमा केही वा बिल्कुलै नहुन सक्छन्।',
    section2Body1: 'हर्मोनल परिवर्तनसँग जोडिएको पिम्पल किशोरावस्थापछि पनि देखिन वा रहिरहन सक्छ। यसले चिउँडो, बङ्गारा, तल्लो गाला वा कहिलेकाहीँ घाँटीलाई असर गर्छ।',
    section2Body2: 'केही मानिसमा, फोकाहरू गहिरा, दुख्ने र दोहोरिने हुन्छन्। तिनलाई कोट्याउँदा वा विशेष गरी सुन्निँदा तिनले रङ्गिएका दाग वा डामहरू छोड्न सक्छन्।',
    skinSignsTitle: 'सम्भावित छालाका संकेतहरू',
    skinSigns: [
      'लगातार पिम्पल, विशेष गरी तल्लो अनुहारमा',
      'अघिल्लोभन्दा बढी तेलिलो छाला',
      'कहिलेकाहीँ हर्मोनल परिवर्तनपछि आउने पिम्पलको प्रकोप',
      'प्रकोपपछि बाँकी रहने दाग वा डाम',
    ],
    section3Body1: 'हर्सुटिज्मले महिलामा सामान्यतया प्रभावित नहुने क्षेत्रहरूमा टर्मिनल रौँको बढेको वृद्धिलाई जनाउँछ। PCOS को सन्दर्भमा, यो कपालका जरामा एन्ड्रोजनको प्रभावसँग जोडिएको हुन सक्छ।',
    section3Body2: 'सबैभन्दा सामान्य रूपमा प्रभावित क्षेत्रहरू चिउँडो, माथिल्लो ओठ, छाती, पेट वा ढाड हुन्। रौँ कति वृद्धि हुन्छ व्यक्तिपिच्छे निकै फरक हुन्छ।',
    hairSignsTitle: 'सम्भावित संकेतहरू',
    hairSigns: [
      'अनुहारमा रौँको बढी देखिने वृद्धि',
      'चिउँडो वा माथिल्लो ओठमा बढी खस्रो रौँ',
      'छाती, पेट वा ढाडमा देखिन सक्ने रौँ वृद्धि',
      'टाउकोको चाँदीतिर कपाल बिस्तारै पातलो हुने',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'रौँ वृद्धि आनुवंशिक र व्यक्तिगत कारकहरूमा पनि निर्भर गर्छ। देखिने रौँ वृद्धिको अर्थ PCOS छ भन्ने स्वतः होइन।',
    section4Body1: 'PCOS भएका केही महिलाले कपालको घनत्व घटेको पनि देख्छन्। पातलोपन टाउकोको चाँदीमा वा बीचको सिउँदोमा विशेष गरी देखिन सक्छ।',
    section4Body2: 'यो बिस्तारै विकसित हुन सक्छ। हर्मोनसँग सम्बन्धित कपाल झर्ने कुरालाई अन्य सम्भावित कारणहरू, जस्तै कमी, थाइरोइडको समस्या, केही औषधि, वा ठूलो तनावको अवधिबाट छुट्ट्याउनु महत्त्वपूर्ण छ।',
    alert1Title: 'ध्यान दिन लायक',
    alert1Text: 'ठूलो, छिटो वा असामान्य कपाल झर्नेले कारण खोज्न चिकित्सकीय मूल्याङ्कन पाउन लायक छ।',
    section5Body: 'धेरै उत्पादनहरू एकमाथि अर्को लगाउनुभन्दा सरल, निरन्तर दिनचर्या सामान्यतया राम्रो हुन्छ। लक्ष्य जलनलाई जारी राख्न सक्ने कुरा सीमित गर्दै छालालाई सफा गर्नु, चिस्यान दिनु र जोगाउनु हो।',
    careHabits: [
      'कोमल, निरन्तर छाला हेरचाहको दिनचर्या',
      'दैनिक घामबाट सुरक्षा',
      'सन्तुलित खानपान',
      'धैर्य: नतिजाले समय लिन्छ',
    ],
    section6Body1: 'कपाल पातलो हुँदा, त्यसमाथि बारम्बार पर्ने तनाव सीमित गर्नु मद्दतकारी हुन सक्छ: अत्यधिक तातो, निकै कसिलो केशसज्जा, वा बारम्बार रासायनिक उपचार।',
    section6Body2: 'कपालको घनत्व घटिरहेमा छाला रोग विशेषज्ञसँग परामर्श लायक हुन सक्छ, कारण निर्धारण गर्न र उपलब्ध उपचारहरूबारे छलफल गर्न।',
    practicalTitle: 'व्यावहारिक सुझावहरू',
    practicalTips: [
      'कोमल उत्पादनहरू छान्नुहोस् र धेरै जलन गराउने उपचारहरू एकमाथि अर्को नलगाउनुहोस्',
      'छाला नसुकाई, आवश्यक परे बिहान र साँझ सफा गर्नुहोस्',
      'छाला खुला हुँदा घामबाट सुरक्षा प्रयोग गर्नुहोस्',
      'दाग र डाम सीमित गर्न फोकाहरू कोट्याउनबाट जोगिनुहोस्',
      'लक्षणहरू रहिरहे वा बिग्रे व्यावसायिकसँग सल्लाह लिनुहोस्',
    ],
    section7Body: 'व्यवस्थापन लक्षण, तिनको तीव्रता, जीवनको गुणस्तरमा तिनको प्रभाव, र हरेक महिलाका लक्ष्यहरूमा निर्भर गर्छ। एउटै समाधान खोज्नुभन्दा धेरै मोर्चामा काम गर्नु मद्दतकारी हुन सक्छ।',
    miniCards: [
      {title: 'छाला', text: 'उपयुक्त दिनचर्या र आवश्यक परे छाला रोग विशेषज्ञको सल्लाह।'},
      {title: 'रौँ वृद्धि', text: 'अवस्थाअनुसार कस्मेटिक वा चिकित्सकीय समाधानहरू।'},
      {title: 'कपाल', text: 'उपचार छान्नुअघि कारण पहिचान गर्नुहोस्।'},
      {title: 'भलाइ', text: 'लक्षणहरूको भावनात्मक प्रभावलाई ध्यानमा राख्नुहोस्।'},
    ],
    section8Body1: 'पिम्पल लगातार वा दुखाइसहित हुँदा, रौँ वृद्धि छिटो बढ्दा, कपाल उल्लेखनीय रूपमा पातलो हुँदा, वा यी परिवर्तनहरू निकै अनियमित चक्रसँग आउँदा स्वास्थ्यकर्मीसँग कुरा गर्नु राम्रो हुन्छ।',
    section8Body2: 'छाला रोग विशेषज्ञले छाला र कपालका लक्षणहरू व्यवस्थापन गर्न सक्छन्। स्त्रीरोग विशेषज्ञ वा अन्य योग्य व्यावसायिकले हर्मोनल सन्दर्भ र PCOS का अन्य सम्भावित संकेतहरूको मूल्याङ्कन पनि गर्न सक्छन्।',
    alert2Title: 'आवश्यक परे चिकित्सकलाई देखाउनुहोस्',
    alert2Text: 'छिटो, ठूलो रौँ वृद्धि, अचानक कपाल झर्ने, वा असामान्य हर्मोनल परिवर्तनहरूले चिकित्सकीय सल्लाह चाहिन्छ।',
    ideasReceived: [
      'पिम्पल हुनुको अर्थ तपाईंलाई PCOS छ भन्ने स्वतः होइन',
      'देखिने रौँ वृद्धि केवल हर्मोनसँग मात्र जोडिएको हुनैपर्छ भन्ने छैन',
      'PCOS ले जुनसुकै शारीरिक बनावटका महिलालाई असर गर्न सक्छ',
      'लक्षणहरू समयसँगै बदलिन सक्छन् र हरेक महिलाका लागि उस्तै हुँदैनन्',
    ],
    quoteText: 'PCOS का देखिने लक्षणहरू निराशाजनक हुन सक्छन्, तर तिनले तपाईंको नारीत्व, तपाईंको मूल्य वा तपाईंको सरसफाइलाई परिभाषित गर्दैनन्।',
    summaryTitle: 'आवश्यक कुराहरू',
    summaryItems: [
      'PCOS ले छाला, शरीरका रौँ र टाउकोको कपाललाई असर गर्न सक्छ।',
      'लक्षणहरू महिलैपिच्छे निकै फरक हुन्छन्।',
      'एउटा लक्षण मात्र PCOS को निदान गर्न पर्याप्त छैन।',
      'लक्षणहरू सुधार्न मद्दत गर्ने समाधानहरू छन्।',
      'चिकित्सकीय साथले तपाईंका लागि सही दृष्टिकोण छान्न मद्दत गर्न सक्छ।',
    ],
    finalTipTitle: 'मुख्य कुराहरू',
    finalTipText: 'पिम्पल, अत्यधिक रौँ वृद्धि, वा कपाल झर्ने PCOS का लक्षण हुन सक्छन्, तर ती अपरिहार्य छैनन्। व्यक्तिगत दृष्टिकोणले तपाईंलाई लक्षणहरू राम्ररी व्यवस्थापन गर्न र दिनदिनै बढी सहज महसुस गर्न मद्दत गर्न सक्छ।',
    disclaimerText: 'यो लेख केवल जानकारीका लागि हो र चिकित्सकीय परामर्श, निदान वा व्यक्तिगत उपचारको स्थान लिँदैन।',
    shareMessage: 'छाला, कपाल र PCOS का देखिने लक्षणहरू — AWA',
  },
  si: {
    badge: 'PCOS',
    title: 'සම, කෙස් සහ\nදෘශ්‍යමාන රෝග ලක්ෂණ',
    metaDuration: 'කියවීමට මිනිත්තු 9',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'PCOS සමේ, ශරීර රෝමවල, හෝ හිසේ කෙස්වල දෘශ්‍යමාන වෙනස්කම් ඇති කළ හැක. ඒවා පැමිණෙන්නේ කොහෙන්දැයි තේරුම් ගැනීම ඒවා හඳුනාගැනීමට සහ සලකා බැලිය හැකි විසඳුම් මොනවාදැයි දැනගැනීමට පහසු කරයි.',
    infoBannerText: 'මෙම සලකුණු පොදු වන නමුත්, ඒවා තනිවම PCOS රෝග විනිශ්චය කිරීමට අවශ්‍ය හෝ ප්‍රමාණවත් නොවේ.',
    contentsTitle: 'මෙම ලිපියේ',
    contents: [
      'මෙම රෝග ලක්ෂණ දිස්වන්නේ ඇයි',
      'හෝමෝන කුරුලෑ',
      'අධික කෙස් වර්ධනය',
      'කෙස් තුනී වීම',
      'ඔබේ සම ගැන සැලකිලිමත් වීම',
      'ඔබේ කෙස් ගැන සැලකිලිමත් වීම',
      'දිනෙන් දින උපකාරී විය හැක්කේ කුමක්ද',
      'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද',
      'පොදු වැරදි වැටහීම්',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'PCOS ඇන්ඩ්‍රජන් වැඩි නිෂ්පාදනයක් හෝ ක්‍රියාකාරිත්වයක් ඇතුළත් විය හැක, ඒවා කාන්තාවන් තුළද ස්වභාවිකව පවතින හෝමෝන වේ. ඒවායේ බලපෑම වඩාත් කැපී පෙනෙන විට, ඒවාට සෙබේසියස් ග්‍රන්ථි, කෙස් ෆොලිකල් සහ කෙස් වර්ධන චක්‍රයට බලපෑ හැක.',
    section1Body2: 'දිගටම පවතින කුරුලෑ, වැඩි වූ කෙස් වර්ධනය, හෝ සමහර කාන්තාවන්ගේ කෙස් තුනී වීම පැහැදිලි කළ හැක්කේ බොහෝ දුරට මෙම හෝමෝන බලපෑමෙනි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'දෘශ්‍යමාන රෝග ලක්ෂණ PCOS කෙතරම් දැඩිද යන්න අනිවාර්යයෙන්ම පිළිබිඹු නොකරයි. එක් කාන්තාවකට දෘශ්‍යමාන රෝග ලක්ෂණ කිහිපයක් තිබිය හැකි අතර, තවත් අයෙකුට අඩු හෝ කිසිවක් නොතිබිය හැක.',
    section2Body1: 'හෝමෝන වෙනස්කම් සමඟ සම්බන්ධ කුරුලෑ නව යොවුන් විය ඉක්මවා දිස්විය හැක හෝ පැවතිය හැක. එය නිකට, හකු රේඛාව, පහළ කම්මුල්, හෝ සමහර විට බෙල්ලට බලපෑමට නැඹුරු වේ.',
    section2Body2: 'සමහර පුද්ගලයන්ගේ, ඇතිවන කැළැල් ගැඹුරු, වේදනාකාරී සහ පුනරාවර්තන වේ. ඒවා සීරීමට ලක් වූ විට හෝ විශේෂයෙන් ආහාරදාහයෙන් යුතු විට වර්ණක සලකුණු හෝ කැළැල් ඉතිරි කළ හැක.',
    skinSignsTitle: 'ඇතිවිය හැකි සමේ සලකුණු',
    skinSigns: [
      'විශේෂයෙන් පහළ මුහුණේ දිගටම පවතින කුරුලෑ',
      'පෙරට වඩා තෙල් සහිත සම',
      'සමහර විට හෝමෝන වෙනස්කම් අනුගමනය කරන කුරුලෑ දැඩි වීම්',
      'දැඩි වීම්වලින් පසු ඉතිරි වන සලකුණු හෝ කැළැල්',
    ],
    section3Body1: 'හර්සුටිස්ම් යනු කාන්තාවන්ට සාමාන්‍යයෙන් බලපාන්නේ නැති ප්‍රදේශවල අවසාන රෝම වර්ධනය වැඩි වීමයි. PCOS සන්දර්භයේදී, එය කෙස් ෆොලිකල් මත ඇන්ඩ්‍රජන්වල බලපෑමට සම්බන්ධ විය හැක.',
    section3Body2: 'වඩාත්ම පොදුවේ බලපාන ප්‍රදේශ නිකට, ඉහළ තොල, පපුව, උදරය, හෝ පිටයි. කෙස් වර්ධනය සිදුවන ප්‍රමාණය පුද්ගලයාගෙන් පුද්ගලයාට සැලකිය යුතු ලෙස වෙනස් වේ.',
    hairSignsTitle: 'ඇතිවිය හැකි සලකුණු',
    hairSigns: [
      'මුහුණේ වඩා දෘශ්‍යමාන කෙස් වර්ධනය',
      'නිකටේ හෝ ඉහළ තොලේ ඝන කෙස්',
      'පපුවේ, උදරයේ, හෝ පිටේ දිස්විය හැකි කෙස් වර්ධනය',
      'හිසේ මුදුනේ කෙස් ක්‍රමයෙන් තුනී වීම',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'කෙස් වර්ධනය ජානමය සහ පුද්ගලික සාධක මතද රඳා පවතී. කැපී පෙනෙන කෙස් වර්ධනයක් PCOS පවතින බව ස්වයංක්‍රීයව අදහස් නොවේ.',
    section4Body1: 'PCOS ඇති සමහර කාන්තාවන් කෙස් ඝනත්වය අඩු වීමක්ද දකිති. තුනී වීම හිසේ මුදුනේ හෝ මැද නිරවුලේදී විශේෂයෙන් දෘශ්‍යමාන විය හැක.',
    section4Body2: 'මෙය ක්‍රමයෙන් වර්ධනය විය හැක. හෝමෝන සම්බන්ධ කෙස් ගැලවීම, ඌනතාවයක්, තයිරොයිඩ් ගැටලුවක්, සමහර ඖෂධ, හෝ සැලකිය යුතු ආතති කාලයක් වැනි වෙනත් ඇතිවිය හැකි හේතුවලින් වෙන්කර හඳුනාගැනීම වැදගත්.',
    alert1Title: 'සටහන් කිරීම වටී',
    alert1Text: 'සැලකිය යුතු, වේගවත් හෝ අසාමාන්‍ය කෙස් ගැලවීමක් හේතුව පරීක්ෂා කිරීමට වෛද්‍ය තක්සේරුවක් සුදුසුයි.',
    section5Body: 'සරල, ස්ථාවර පුරුද්දක් සාමාන්‍යයෙන් නිෂ්පාදන බොහෝ ස්ථරගත කිරීමට වඩා හොඳයි. අරමුණ සම පිරිසිදු කිරීම, තෙතමනය ලබා දීම සහ ආරක්ෂා කිරීම, කෝපනය පවත්වා ගත හැකි ඕනෑම දෙයක් සීමා කරමිනි.',
    careHabits: [
      'මෘදු, ස්ථාවර සම් රැකවරණ පුරුද්දක්',
      'දෛනික හිරු ආරක්ෂාව',
      'සමතුලිත ආහාර වේලක්',
      'ඉවසීම: ප්‍රතිඵලවලට කාලය ගතවේ',
    ],
    section6Body1: 'කෙස් සිහින් වන විට, ඒවාට නැවත නැවත ඇතිවන ආතතිය සීමා කිරීම උපකාරී විය හැක: අධික තාපය, ඉතා තද කෙස් මෝස්තර, හෝ නිතර රසායනික ප්‍රතිකාර.',
    section6Body2: 'කෙස් ඝනත්වය අඩු වෙමින් පවතී නම්, හේතුව තීරණය කිරීමට සහ ලබාගත හැකි ප්‍රතිකාර සාකච්ඡා කිරීමට සම් රෝග වෛද්‍ය උපදේශනයක් වටී.',
    practicalTitle: 'ප්‍රායෝගික ඉඟි',
    practicalTips: [
      'මෘදු නිෂ්පාදන තෝරාගෙන කෝපනීය ප්‍රතිකාර කිහිපයක් ස්ථරගත කිරීම වළක්වන්න',
      'අවශ්‍ය නම් උදෑසන සහ සවස සම අහිමි නොවන ලෙස පිරිසිදු කරන්න',
      'සම නිරාවරණය වන විට හිරු ආරක්ෂාව භාවිතා කරන්න',
      'සලකුණු සහ කැළැල් සීමා කිරීමට පුපුරා යාම් සීරීම වළක්වන්න',
      'රෝග ලක්ෂණ දිගටම පවතී නම් හෝ නරක අතට හැරේ නම් වෘත්තිකයෙකුගෙන් උපදෙස් ඉල්ලන්න',
    ],
    section7Body: 'කළමනාකරණය රඳා පවතින්නේ රෝග ලක්ෂණ, ඒවා කෙතරම් තීව්‍රද, ජීවන ගුණාත්මකභාවයට ඒවායේ බලපෑම සහ සෑම කාන්තාවකගේම ඉලක්ක මතය. තනි විසඳුමක් සොයනවාට වඩා ඉදිරි පෙළ කිහිපයක වැඩ කිරීම උපකාරී විය හැක.',
    miniCards: [
      {title: 'සම', text: 'සුදුසු පුරුද්දක් සහ අවශ්‍ය නම් සම් රෝග වෛද්‍ය උපදෙස්.'},
      {title: 'කෙස් වර්ධනය', text: 'තත්ත්වය අනුව රූපාලංකරණ හෝ වෛද්‍ය විසඳුම්.'},
      {title: 'කෙස්', text: 'ප්‍රතිකාරයක් තෝරා ගැනීමට පෙර හේතුව හඳුනාගන්න.'},
      {title: 'යහපැවැත්ම', text: 'රෝග ලක්ෂණවල චිත්තවේගී බලපෑම සැලකිල්ලට ගන්න.'},
    ],
    section8Body1: 'කුරුලෑ දිගටම පවතින හෝ වේදනාකාරී වන විට, කෙස් වර්ධනය ඉක්මනින් වැඩි වන විට, කෙස් කැපී පෙනෙන ලෙස තුනී වන විට, හෝ මෙම වෙනස්කම් ඉතා අක්‍රමවත් චක්‍ර සමඟ පැමිණෙන විට සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම හොඳ අදහසකි.',
    section8Body2: 'සම් රෝග වෛද්‍යවරයෙකුට සමේ සහ කෙස්වල රෝග ලක්ෂණ කළමනාකරණය කළ හැක. නාරිවේද වෛද්‍යවරයෙකුට හෝ වෙනත් සුදුසුකම් ලත් වෘත්තිකයෙකුට හෝමෝන සන්දර්භය සහ PCOS හි වෙනත් ඕනෑම ඇතිවිය හැකි සලකුණු තක්සේරු කළ හැක.',
    alert2Title: 'අවශ්‍ය නම් වෛද්‍යවරයෙකු හමුවන්න',
    alert2Text: 'වේගවත්, සැලකිය යුතු කෙස් වර්ධනය, හදිසි කෙස් ගැලවීම, හෝ අසාමාන්‍ය හෝමෝන වෙනස්කම් වෛද්‍ය උපදෙස් ඉල්ලා සිටී.',
    ideasReceived: [
      'කුරුලෑ තිබීම ඔබට ස්වයංක්‍රීයව PCOS ඇති බව අදහස් නොවේ',
      'දෘශ්‍යමාන කෙස් වර්ධනය හෝමෝනවලට පමණක් සම්බන්ධ නොවිය හැක',
      'PCOS ඕනෑම ශරීර වර්ගයක කාන්තාවන්ට බලපෑ හැක',
      'රෝග ලක්ෂණ කාලයත් සමඟ වෙනස් විය හැකි අතර සෑම කාන්තාවකටම එකම නොවේ',
    ],
    quoteText: 'PCOS හි දෘශ්‍යමාන රෝග ලක්ෂණ කෝපකාරී විය හැකි නමුත්, ඒවා ඔබේ ස්ත්‍රීත්වය, ඔබේ වටිනාකම, හෝ ඔබේ සනීපාරක්ෂාව නිර්වචනය නොකරයි.',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'PCOS සමට, ශරීර රෝමවලට සහ හිසේ කෙස්වලට බලපෑ හැක.',
      'රෝග ලක්ෂණ කාන්තාවෙන් කාන්තාවට බොහෝ සේ වෙනස් වේ.',
      'තනි රෝග ලක්ෂණයක් PCOS රෝග විනිශ්චය කිරීමට ප්‍රමාණවත් නොවේ.',
      'රෝග ලක්ෂණ වැඩිදියුණු කිරීමට උපකාරී වන විසඳුම් පවතී.',
      'ඔබට ගැළපෙන නිවැරදි ප්‍රවේශය තෝරා ගැනීමට වෛද්‍ය සහාය ඔබට උපකාරී විය හැක.',
    ],
    finalTipTitle: 'ප්‍රධාන කරුණු',
    finalTipText: 'කුරුලෑ, අධික කෙස් වර්ධනය, හෝ කෙස් ගැලවීම PCOS හි රෝග ලක්ෂණ විය හැකි නමුත්, ඒවා අනිවාර්ය නොවේ. පුද්ගලීකරණය කළ ප්‍රවේශයක් රෝග ලක්ෂණ වඩා හොඳින් කළමනාකරණය කිරීමට සහ දිනෙන් දින වඩා සුවපහසුවක් දැනීමට ඔබට උපකාරී විය හැක.',
    disclaimerText: 'මෙම ලිපිය තොරතුරු සඳහා පමණි, එය වෛද්‍ය උපදේශනයක්, රෝග විනිශ්චයක් හෝ පුද්ගලීකරණය කළ ප්‍රතිකාරයක් වෙනුවට නොපවතී.',
    shareMessage: 'සම, කෙස් සහ දෘශ්‍යමාන PCOS රෝග ලක්ෂණ — AWA',
  },
  th: {
    badge: 'PCOS',
    title: 'ผิว เส้นผม และ\nอาการที่มองเห็นได้',
    metaDuration: 'อ่าน 9 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'PCOS อาจทำให้เกิดการเปลี่ยนแปลงที่มองเห็นได้ของผิว ขนตามร่างกาย หรือเส้นผม การเข้าใจที่มาช่วยให้สังเกตได้ง่ายขึ้นและรู้ว่ามีวิธีแก้อะไรให้พิจารณา',
    infoBannerText: 'สัญญาณเหล่านี้พบบ่อย แต่ตัวมันเองไม่จำเป็นและไม่เพียงพอที่จะวินิจฉัย PCOS',
    contentsTitle: 'ในบทความนี้',
    contents: [
      'ทำไมอาการเหล่านี้จึงปรากฏ',
      'สิวฮอร์โมน',
      'ขนขึ้นมากเกินไป',
      'ผมบาง',
      'ดูแลผิวของคุณ',
      'ดูแลเส้นผมของคุณ',
      'สิ่งที่ช่วยได้ในแต่ละวัน',
      'เมื่อไรควรพบแพทย์',
      'ความเข้าใจผิดที่พบบ่อย',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'PCOS อาจเกี่ยวข้องกับการผลิตหรือการทำงานของแอนโดรเจนที่เพิ่มขึ้น ซึ่งเป็นฮอร์โมนที่มีอยู่ตามธรรมชาติในผู้หญิงด้วย เมื่อผลชัดเจนขึ้น อาจมีอิทธิพลต่อต่อมไขมัน รูขุมขน และวงจรการเจริญเติบโตของเส้นผมและขน',
    section1Body2: 'อิทธิพลของฮอร์โมนนี้เป็นสิ่งที่อธิบายการปรากฏของสิวที่คงอยู่ ขนขึ้นมากขึ้น หรือในผู้หญิงบางคน ผมบาง',
    tip1Title: 'ควรรู้',
    tip1Text: 'อาการที่มองเห็นไม่ได้สะท้อนความรุนแรงของ PCOS เสมอไป ผู้หญิงคนหนึ่งอาจมีอาการที่มองเห็นหลายอย่าง ขณะที่อีกคนอาจมีน้อยหรือไม่มีเลย',
    section2Body1: 'สิวที่เกี่ยวข้องกับการเปลี่ยนแปลงของฮอร์โมนอาจปรากฏหรือคงอยู่เกินวัยรุ่น มักเกิดที่คาง แนวกราม แก้มส่วนล่าง หรือบางครั้งที่คอ',
    section2Body2: 'ในบางคน รอยโรคลึก เจ็บ และเป็นซ้ำ อาจทิ้งรอยสีหรือแผลเป็นเมื่อถูกแกะหรือเมื่ออักเสบมาก',
    skinSignsTitle: 'สัญญาณทางผิวหนังที่เป็นไปได้',
    skinSigns: [
      'สิวที่คงอยู่ โดยเฉพาะที่ใบหน้าส่วนล่าง',
      'ผิวมันกว่าเดิม',
      'สิวกำเริบที่บางครั้งตามการเปลี่ยนแปลงของฮอร์โมน',
      'รอยหรือแผลเป็นที่ทิ้งไว้หลังกำเริบ',
    ],
    section3Body1: 'ภาวะขนดกหมายถึงขนแข็งที่ขึ้นมากขึ้นในบริเวณที่ปกติไม่เกิดในผู้หญิง ในบริบทของ PCOS อาจเกี่ยวข้องกับผลของแอนโดรเจนต่อรูขุมขน',
    section3Body2: 'บริเวณที่พบบ่อยที่สุดคือคาง เหนือริมฝีปากบน หน้าอก หน้าท้อง หรือหลัง ปริมาณขนที่ขึ้นแตกต่างกันมากในแต่ละคน',
    hairSignsTitle: 'สัญญาณที่เป็นไปได้',
    hairSigns: [
      'ขนที่ใบหน้ามองเห็นชัดขึ้น',
      'ขนที่คางหรือเหนือริมฝีปากบนหยาบขึ้น',
      'ขนที่อาจขึ้นที่หน้าอก หน้าท้อง หรือหลัง',
      'ผมบางลงทีละน้อยที่กลางศีรษะ',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'การขึ้นของขนยังขึ้นกับปัจจัยทางพันธุกรรมและปัจจัยส่วนบุคคล ขนที่ขึ้นชัดเจนไม่ได้หมายความโดยอัตโนมัติว่ามี PCOS',
    section4Body1: 'ผู้หญิงบางคนที่เป็น PCOS ยังสังเกตเห็นความหนาแน่นของเส้นผมลดลง ผมบางอาจเห็นชัดเป็นพิเศษที่กลางศีรษะหรือตามแนวแสก',
    section4Body2: 'อาจเกิดขึ้นทีละน้อย สิ่งสำคัญคือแยกผมร่วงที่เกี่ยวกับฮอร์โมนออกจากสาเหตุอื่นที่เป็นไปได้ เช่น การขาดสารอาหาร ปัญหาต่อมไทรอยด์ ยาบางชนิด หรือช่วงที่เครียดมาก',
    alert1Title: 'ข้อควรทราบ',
    alert1Text: 'ผมร่วงมาก รวดเร็ว หรือผิดปกติ ควรได้รับการประเมินทางการแพทย์เพื่อค้นหาสาเหตุ',
    section5Body: 'กิจวัตรที่เรียบง่ายและสม่ำเสมอโดยทั่วไปดีกว่าการใช้ผลิตภัณฑ์ซ้อนกันหลายอย่าง เป้าหมายคือทำความสะอาด เติมความชุ่มชื้น และปกป้องผิว พร้อมจำกัดสิ่งที่ทำให้ระคายเคืองต่อเนื่อง',
    careHabits: [
      'กิจวัตรดูแลผิวที่อ่อนโยนและสม่ำเสมอ',
      'ป้องกันแสงแดดทุกวัน',
      'อาหารที่สมดุล',
      'อดทน: ผลลัพธ์ต้องใช้เวลา',
    ],
    section6Body1: 'เมื่อเส้นผมบางลง การจำกัดความเครียดซ้ำ ๆ ต่อเส้นผมช่วยได้: ความร้อนมากเกินไป ทรงผมที่รัดแน่นมาก หรือการทำเคมีบ่อย',
    section6Body2: 'การปรึกษาแพทย์ผิวหนังอาจคุ้มค่าหากความหนาแน่นของเส้นผมลดลงต่อเนื่อง เพื่อช่วยหาสาเหตุและพูดคุยเรื่องการรักษาที่มี',
    practicalTitle: 'เคล็ดลับเชิงปฏิบัติ',
    practicalTips: [
      'เลือกผลิตภัณฑ์ที่อ่อนโยน และหลีกเลี่ยงการใช้การรักษาที่ระคายเคืองหลายอย่างซ้อนกัน',
      'ทำความสะอาดผิวโดยไม่ทำให้แห้ง เช้าและเย็นหากจำเป็น',
      'ใช้การป้องกันแสงแดดเมื่อผิวถูกแสง',
      'หลีกเลี่ยงการแกะสิวเพื่อจำกัดรอยและแผลเป็น',
      'ขอคำแนะนำจากผู้เชี่ยวชาญหากอาการคงอยู่หรือแย่ลง',
    ],
    section7Body: 'การดูแลขึ้นอยู่กับอาการ ความรุนแรง ผลต่อคุณภาพชีวิต และเป้าหมายของผู้หญิงแต่ละคน การทำหลายด้านพร้อมกันช่วยได้ดีกว่าการมองหาวิธีแก้เดียว',
    miniCards: [
      {title: 'ผิว', text: 'กิจวัตรที่เหมาะสมและคำแนะนำจากแพทย์ผิวหนังหากจำเป็น'},
      {title: 'การขึ้นของขน', text: 'วิธีแก้ด้านความงามหรือทางการแพทย์ตามสถานการณ์'},
      {title: 'เส้นผม', text: 'ระบุสาเหตุก่อนเลือกการรักษา'},
      {title: 'ความเป็นอยู่ที่ดี', text: 'คำนึงถึงผลทางอารมณ์ของอาการ'},
    ],
    section8Body1: 'ควรพูดคุยกับบุคลากรทางการแพทย์เมื่อสิวคงอยู่หรือเจ็บ เมื่อขนขึ้นเร็วขึ้น เมื่อผมบางลงชัดเจน หรือเมื่อการเปลี่ยนแปลงเหล่านี้มาพร้อมรอบเดือนที่ไม่สม่ำเสมอมาก',
    section8Body2: 'แพทย์ผิวหนังดูแลอาการทางผิวหนังและเส้นผมได้ สูตินรีแพทย์หรือผู้เชี่ยวชาญที่มีคุณวุฒิอื่นยังประเมินบริบททางฮอร์โมนและสัญญาณอื่นของ PCOS ที่เป็นไปได้',
    alert2Title: 'พบแพทย์หากจำเป็น',
    alert2Text: 'ขนขึ้นเร็วและมาก ผมร่วงกะทันหัน หรือการเปลี่ยนแปลงทางฮอร์โมนที่ผิดปกติ ต้องขอคำแนะนำทางการแพทย์',
    ideasReceived: [
      'การมีสิวไม่ได้หมายความโดยอัตโนมัติว่าคุณเป็น PCOS',
      'ขนที่ขึ้นชัดเจนไม่จำเป็นต้องเกี่ยวข้องกับฮอร์โมนอย่างเดียว',
      'PCOS เกิดกับผู้หญิงทุกรูปร่างได้',
      'อาการอาจเปลี่ยนไปตามเวลาและไม่เหมือนกันในผู้หญิงทุกคน',
    ],
    quoteText: 'อาการที่มองเห็นได้ของ PCOS อาจน่าหงุดหงิด แต่ไม่ได้กำหนดความเป็นหญิง คุณค่า หรือความสะอาดของคุณ',
    summaryTitle: 'สาระสำคัญ',
    summaryItems: [
      'PCOS อาจส่งผลต่อผิว ขนตามร่างกาย และเส้นผม',
      'อาการแตกต่างกันมากในผู้หญิงแต่ละคน',
      'อาการเดียวไม่เพียงพอที่จะวินิจฉัย PCOS',
      'มีวิธีแก้ที่ช่วยปรับปรุงอาการ',
      'การสนับสนุนทางการแพทย์ช่วยคุณเลือกแนวทางที่เหมาะกับคุณ',
    ],
    finalTipTitle: 'ประเด็นสำคัญ',
    finalTipText: 'สิว ขนขึ้นมากเกินไป หรือผมร่วงอาจเป็นอาการของ PCOS แต่ไม่ใช่สิ่งที่หลีกเลี่ยงไม่ได้ แนวทางเฉพาะบุคคลช่วยให้คุณจัดการอาการได้ดีขึ้นและรู้สึกสบายขึ้นในแต่ละวัน',
    disclaimerText: 'บทความนี้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนการปรึกษาแพทย์ การวินิจฉัย หรือการรักษาเฉพาะบุคคล',
    shareMessage: 'ผิว เส้นผม และอาการที่มองเห็นได้ของ PCOS — AWA',
  },
  vi: {
    badge: 'PCOS',
    title: 'Da, tóc và\ncác triệu chứng nhìn thấy được',
    metaDuration: '9 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'PCOS có thể gây ra những thay đổi nhìn thấy được ở da, lông trên cơ thể hoặc tóc. Hiểu chúng đến từ đâu giúp dễ nhận ra chúng hơn và biết có thể cân nhắc những giải pháp nào.',
    infoBannerText: 'Những dấu hiệu này thường gặp, nhưng tự chúng không bắt buộc cũng không đủ để chẩn đoán PCOS.',
    contentsTitle: 'Trong bài viết này',
    contents: [
      'Tại sao các triệu chứng này xuất hiện',
      'Mụn do nội tiết',
      'Lông mọc nhiều',
      'Tóc thưa',
      'Chăm sóc da của bạn',
      'Chăm sóc tóc của bạn',
      'Điều gì có thể giúp ích mỗi ngày',
      'Khi nào nên đi khám bác sĩ',
      'Những quan niệm sai thường gặp',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'PCOS có thể liên quan đến việc tăng sản xuất hoặc tăng hoạt động của androgen, những hormone vốn cũng có mặt tự nhiên ở phụ nữ. Khi tác động của chúng rõ rệt hơn, chúng có thể ảnh hưởng đến tuyến bã nhờn, nang lông và chu kỳ mọc tóc.',
    section1Body2: 'Ảnh hưởng nội tiết này phần lớn là điều có thể giải thích sự xuất hiện của mụn kéo dài, lông mọc nhiều hơn hoặc, ở một số phụ nữ, tóc thưa đi.',
    tip1Title: 'Nên biết',
    tip1Text: 'Các triệu chứng nhìn thấy được không nhất thiết phản ánh mức độ nặng của PCOS. Một phụ nữ có thể có nhiều triệu chứng nhìn thấy được, trong khi người khác có ít hoặc không có.',
    section2Body1: 'Mụn liên quan đến thay đổi nội tiết có thể xuất hiện hoặc kéo dài sau tuổi thiếu niên. Nó có xu hướng ảnh hưởng đến cằm, đường viền hàm, phần dưới má hoặc đôi khi là cổ.',
    section2Body2: 'Ở một số người, các tổn thương sâu, đau và tái phát. Chúng cũng có thể để lại vết thâm sắc tố hoặc sẹo khi bị cậy hoặc khi đặc biệt viêm.',
    skinSignsTitle: 'Các dấu hiệu trên da có thể có',
    skinSigns: [
      'Mụn kéo dài, đặc biệt ở phần dưới khuôn mặt',
      'Da dầu hơn trước',
      'Những đợt mụn bùng phát đôi khi theo sau thay đổi nội tiết',
      'Vết thâm hoặc sẹo còn lại sau các đợt bùng phát',
    ],
    section3Body1: 'Rậm lông là tình trạng lông cứng mọc nhiều hơn ở những vùng thường không bị ảnh hưởng ở phụ nữ. Trong bối cảnh PCOS, nó có thể liên quan đến tác động của androgen lên nang lông.',
    section3Body2: 'Những vùng thường bị ảnh hưởng nhất là cằm, môi trên, ngực, bụng hoặc lưng. Mức độ lông mọc khác nhau đáng kể giữa từng người.',
    hairSignsTitle: 'Các dấu hiệu có thể có',
    hairSigns: [
      'Lông mọc nhìn thấy rõ hơn trên mặt',
      'Lông thô hơn ở cằm hoặc môi trên',
      'Lông mọc có thể xuất hiện ở ngực, bụng hoặc lưng',
      'Tóc thưa dần ở đỉnh đầu',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Sự mọc lông cũng phụ thuộc vào các yếu tố di truyền và cá nhân. Lông mọc rõ rệt không tự động có nghĩa là có PCOS.',
    section4Body1: 'Một số phụ nữ bị PCOS cũng nhận thấy mật độ tóc giảm. Tóc thưa có thể đặc biệt dễ thấy ở đỉnh đầu hoặc dọc theo đường rẽ ngôi.',
    section4Body2: 'Điều này có thể diễn ra dần dần. Điều quan trọng là phân biệt rụng tóc liên quan đến nội tiết với các nguyên nhân có thể khác, như thiếu hụt dinh dưỡng, vấn đề tuyến giáp, một số loại thuốc hoặc giai đoạn căng thẳng đáng kể.',
    alert1Title: 'Điều đáng lưu ý',
    alert1Text: 'Rụng tóc nhiều, nhanh hoặc bất thường đáng được đánh giá y khoa để tìm nguyên nhân.',
    section5Body: 'Một quy trình đơn giản, nhất quán thường tốt hơn việc dùng chồng nhiều sản phẩm. Mục tiêu là làm sạch, dưỡng ẩm và bảo vệ da đồng thời hạn chế mọi thứ có thể duy trì tình trạng kích ứng.',
    careHabits: [
      'Một quy trình chăm sóc da nhẹ nhàng, nhất quán',
      'Chống nắng hằng ngày',
      'Chế độ ăn cân bằng',
      'Kiên nhẫn: kết quả cần thời gian',
    ],
    section6Body1: 'Khi tóc trở nên mảnh hơn, có thể hữu ích khi hạn chế những tác động lặp lại lên tóc: nhiệt quá mức, kiểu tóc quá chặt hoặc xử lý hóa chất thường xuyên.',
    section6Body2: 'Một buổi khám da liễu có thể đáng giá nếu mật độ tóc tiếp tục giảm, để giúp xác định nguyên nhân và trao đổi về các phương pháp điều trị hiện có.',
    practicalTitle: 'Mẹo thực tế',
    practicalTips: [
      'Chọn sản phẩm dịu nhẹ và tránh dùng chồng nhiều phương pháp điều trị gây kích ứng',
      'Làm sạch da mà không làm khô da, sáng và tối nếu cần',
      'Dùng chống nắng khi da tiếp xúc với ánh nắng',
      'Tránh cậy các nốt mụn để hạn chế vết thâm và sẹo',
      'Hỏi lời khuyên của chuyên gia nếu triệu chứng kéo dài hoặc nặng hơn',
    ],
    section7Body: 'Việc kiểm soát phụ thuộc vào triệu chứng, cường độ, tác động đến chất lượng cuộc sống và mục tiêu của từng phụ nữ. Có thể hữu ích khi làm việc trên nhiều mặt thay vì tìm một giải pháp duy nhất.',
    miniCards: [
      {title: 'Da', text: 'Một quy trình phù hợp và lời khuyên da liễu nếu cần.'},
      {title: 'Lông mọc', text: 'Các giải pháp thẩm mỹ hoặc y tế tùy tình huống.'},
      {title: 'Tóc', text: 'Xác định nguyên nhân trước khi chọn phương pháp điều trị.'},
      {title: 'Sức khỏe tinh thần', text: 'Cân nhắc tác động cảm xúc của các triệu chứng.'},
    ],
    section8Body1: 'Nên nói chuyện với nhân viên y tế khi mụn trở nên kéo dài hoặc đau, khi lông mọc tăng nhanh, khi tóc thưa đi rõ rệt hoặc khi những thay đổi này đi kèm chu kỳ rất không đều.',
    section8Body2: 'Bác sĩ da liễu có thể xử trí các triệu chứng về da và tóc. Bác sĩ phụ khoa hoặc một chuyên gia có trình độ khác cũng có thể đánh giá bối cảnh nội tiết và mọi dấu hiệu khác có thể có của PCOS.',
    alert2Title: 'Hãy đi khám bác sĩ nếu cần',
    alert2Text: 'Lông mọc nhanh, nhiều, rụng tóc đột ngột hoặc thay đổi nội tiết bất thường cần lời khuyên y khoa.',
    ideasReceived: [
      'Bị mụn không tự động có nghĩa là bạn bị PCOS',
      'Lông mọc nhìn thấy được không nhất thiết chỉ liên quan đến nội tiết',
      'PCOS có thể ảnh hưởng đến phụ nữ ở mọi vóc dáng',
      'Các triệu chứng có thể thay đổi theo thời gian và không giống nhau ở mọi phụ nữ',
    ],
    quoteText: 'Các triệu chứng nhìn thấy được của PCOS có thể gây bực bội, nhưng chúng không định nghĩa nữ tính, giá trị hay sự vệ sinh của bạn.',
    summaryTitle: 'Điều thiết yếu',
    summaryItems: [
      'PCOS có thể ảnh hưởng đến da, lông trên cơ thể và tóc.',
      'Triệu chứng khác nhau rất nhiều giữa từng phụ nữ.',
      'Một triệu chứng đơn lẻ không đủ để chẩn đoán PCOS.',
      'Có những giải pháp giúp cải thiện triệu chứng.',
      'Sự hỗ trợ y tế có thể giúp bạn chọn cách tiếp cận phù hợp.',
    ],
    finalTipTitle: 'Những điểm chính cần nhớ',
    finalTipText: 'Mụn, lông mọc nhiều hoặc rụng tóc có thể là triệu chứng của PCOS, nhưng chúng không phải điều không thể tránh. Một cách tiếp cận cá nhân hóa có thể giúp bạn kiểm soát triệu chứng tốt hơn và cảm thấy thoải mái hơn mỗi ngày.',
    disclaimerText: 'Bài viết này chỉ để cung cấp thông tin và không thay thế buổi khám y tế, chẩn đoán hay phương pháp điều trị cá nhân hóa.',
    shareMessage: 'Da, tóc và các triệu chứng nhìn thấy được của PCOS — AWA',
  },
  uz: {
    badge: 'PCOS',
    title: 'Teri, tuklar va\nkoʻrinadigan alomatlar',
    metaDuration: '9 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'PCOS teri, badan tuklari yoki bosh sochida koʻrinadigan oʻzgarishlarga sabab boʻlishi mumkin. Ularning kelib chiqishini tushunish ularni tanishni va qanday yechimlarni koʻrib chiqish mumkinligini bilishni osonlashtiradi.',
    infoBannerText: 'Bu belgilar keng tarqalgan, ammo yakka oʻzi PCOS tashxisi uchun ham shart, ham yetarli emas.',
    contentsTitle: 'Ushbu maqolada',
    contents: [
      'Bu alomatlar nima uchun paydo boʻladi',
      'Gormonal husnbuzar',
      'Tuklarning ortiqcha oʻsishi',
      'Sochning siyraklashishi',
      'Terigizga gʻamxoʻrlik qilish',
      'Sochingizga gʻamxoʻrlik qilish',
      'Kundalik hayotda nima yordam berishi mumkin',
      'Qachon shifokorga borish kerak',
      'Keng tarqalgan yanglish tushunchalar',
      'Asosiy xulosalar',
    ],
    section1Body1: 'PCOS androgenlarning — ayollarda ham tabiiy mavjud boʻlgan gormonlarning — ishlab chiqarilishi yoki faolligining ortishini oʻz ichiga olishi mumkin. Ularning taʼsiri kuchliroq boʻlganda, ular yogʻ bezlariga, tuk follikulalariga va soch oʻsish siklga taʼsir qilishi mumkin.',
    section1Body2: 'Bu gormonal taʼsir doimiy husnbuzar, tuklarning koʻpayishi yoki baʼzi ayollarda sochning siyraklashishini asosan tushuntirishi mumkin.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Koʻrinadigan alomatlar PCOS ning qanchalik ogʻirligini albatta aks ettirmaydi. Bir ayolda bir nechta koʻrinadigan alomat boʻlishi mumkin, boshqasida kam yoki umuman boʻlmasligi mumkin.',
    section2Body1: 'Gormonal oʻzgarishlar bilan bogʻliq husnbuzar oʻsmirlikdan keyin ham paydo boʻlishi yoki saqlanib qolishi mumkin. U iyakka, jagʻ chizigʻiga, yonoqlarning pastki qismiga yoki baʼzan boʻyinga taʼsir qilishga moyil.',
    section2Body2: 'Baʼzi odamlarda toshmalar chuqur, sezgir va qaytalanuvchi boʻladi. Ular kovlanganda yoki ayniqsa yalligʻlanganda pigmentli dogʻlar yoki chandiqlar qoldirishi ham mumkin.',
    skinSignsTitle: 'Mumkin boʻlgan teri belgilari',
    skinSigns: [
      'Doimiy husnbuzar, ayniqsa yuzning pastki qismida',
      'Avvalgidan yogʻliroq teri',
      'Baʼzan gormonal oʻzgarishlardan keyin kuchayadigan husnbuzar',
      'Kuchayishlardan keyin qoladigan dogʻlar yoki chandiqlar',
    ],
    section3Body1: 'Girsutizm — ayollarda odatda taʼsirlanmaydigan joylarda terminal tuklarning koʻpayishi. PCOS kontekstida bu androgenlarning tuk follikulalariga taʼsiri bilan bogʻliq boʻlishi mumkin.',
    section3Body2: 'Eng koʻp taʼsirlanadigan joylar — iyak, ustki lab, koʻkrak, qorin yoki orqa. Tuklarning oʻsish miqdori odamdan odamga sezilarli farq qiladi.',
    hairSignsTitle: 'Mumkin boʻlgan belgilar',
    hairSigns: [
      'Yuzda tuklarning koʻproq koʻrinishi',
      'Iyak yoki ustki labda dagʻalroq tuklar',
      'Koʻkrak, qorin yoki orqada paydo boʻlishi mumkin boʻlgan tuklar',
      'Bosh tepasida sochning asta-sekin siyraklashishi',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Tuklarning oʻsishi genetik va individual omillarga ham bogʻliq. Sezilarli tuk oʻsishi PCOS borligini avtomatik anglatmaydi.',
    section4Body1: 'PCOS li baʼzi ayollar soch zichligining pasayishini ham sezadi. Siyraklashish bosh tepasida yoki boʻlinma boʻylab ayniqsa koʻrinishi mumkin.',
    section4Body2: 'Bu asta-sekin rivojlanishi mumkin. Gormonlar bilan bogʻliq soch toʻkilishini boshqa mumkin boʻlgan sabablardan, masalan, yetishmovchilik, qalqonsimon bez muammosi, baʼzi dorilar yoki jiddiy stress davridan farqlash muhim.',
    alert1Title: 'Eʼtiborga loyiq',
    alert1Text: 'Sezilarli, tez yoki odatdan tashqari soch toʻkilishi sababini aniqlash uchun tibbiy baholashga loyiq.',
    section5Body: 'Oddiy, izchil tartib koʻp vositalarni qatlam-qatlam qoʻllashdan odatda yaxshiroq. Maqsad — terini tozalash, namlantirish va himoya qilish, shu bilan birga tirnashni davom ettirishi mumkin boʻlgan hamma narsani cheklash.',
    careHabits: [
      'Muloyim, izchil teri parvarishi tartibi',
      'Kundalik quyoshdan himoya',
      'Muvozanatli ovqatlanish',
      'Sabr: natijalar vaqt oladi',
    ],
    section6Body1: 'Sochlar ingichkalashganda, ularga takroriy zoʻriqishni cheklash foydali boʻlishi mumkin: haddan tashqari issiqlik, juda tarang soch turmaklari yoki tez-tez kimyoviy ishlov.',
    section6Body2: 'Agar soch zichligi kamayishda davom etsa, dermatologik konsultatsiya sababni aniqlashga va mavjud davolanishlarni muhokama qilishga yordam berishi mumkin.',
    practicalTitle: 'Amaliy maslahatlar',
    practicalTips: [
      'Muloyim vositalarni tanlang va bir nechta tirnashtiruvchi vositani qatlam-qatlam qoʻllashdan saqlaning',
      'Terini quritmasdan tozalang, kerak boʻlsa ertalab va kechqurun',
      'Teri ochiq boʻlganda quyoshdan himoyadan foydalaning',
      'Dogʻ va chandiqlarni cheklash uchun toshmalarni kovlamang',
      'Alomatlar saqlanib qolsa yoki yomonlashsa, mutaxassisdan maslahat soʻrang',
    ],
    section7Body: 'Boshqarish alomatlarga, ularning kuchiga, hayot sifatiga taʼsiriga va har bir ayolning maqsadlariga bogʻliq. Yakka yechim izlashdan koʻra bir necha yoʻnalishda ishlash foydali boʻlishi mumkin.',
    miniCards: [
      {title: 'Teri', text: 'Mos tartib va kerak boʻlsa, dermatolog maslahati.'},
      {title: 'Tuk oʻsishi', text: 'Vaziyatga qarab kosmetik yoki tibbiy yechimlar.'},
      {title: 'Soch', text: 'Davolanishni tanlashdan oldin sababni aniqlang.'},
      {title: 'Farovonlik', text: 'Alomatlarning hissiy taʼsirini hisobga oling.'},
    ],
    section8Body1: 'Husnbuzar doimiy yoki ogʻriqli boʻlganda, tuk oʻsishi tez ortganda, soch sezilarli siyraklashganda yoki bu oʻzgarishlar juda notekis sikllar bilan birga kelganda sogʻliqni saqlash mutaxassisi bilan gaplashgan yaxshi.',
    section8Body2: 'Dermatolog teri va soch alomatlarini boshqarishi mumkin. Ginekolog yoki boshqa malakali mutaxassis gormonal kontekstni va PCOS ning boshqa mumkin boʻlgan belgilarini ham baholashi mumkin.',
    alert2Title: 'Kerak boʻlsa, shifokorga boring',
    alert2Text: 'Tez, sezilarli tuk oʻsishi, birdan soch toʻkilishi yoki odatdan tashqari gormonal oʻzgarishlar tibbiy maslahatni talab qiladi.',
    ideasReceived: [
      'Husnbuzarning borligi sizda avtomatik PCOS borligini anglatmaydi',
      'Koʻrinadigan tuk oʻsishi albatta faqat gormonlar bilan bogʻliq emas',
      'PCOS har qanday tana tuzilishidagi ayollarga taʼsir qilishi mumkin',
      'Alomatlar vaqt oʻtishi bilan oʻzgarishi mumkin va har bir ayolda bir xil emas',
    ],
    quoteText: 'PCOS ning koʻrinadigan alomatlari bezovta qilishi mumkin, ammo ular ayolligingizni, qadringizni yoki gigiyenangizni belgilamaydi.',
    summaryTitle: 'Asosiy jihatlar',
    summaryItems: [
      'PCOS teri, badan tuklari va bosh sochiga taʼsir qilishi mumkin.',
      'Alomatlar ayoldan ayolga juda farq qiladi.',
      'Yakka alomat PCOS tashxisi uchun yetarli emas.',
      'Alomatlarni yaxshilashga yordam beradigan yechimlar mavjud.',
      'Tibbiy qoʻllab-quvvatlash siz uchun toʻgʻri yondashuvni tanlashga yordam beradi.',
    ],
    finalTipTitle: 'Asosiy xulosalar',
    finalTipText: 'Husnbuzar, ortiqcha tuk oʻsishi yoki soch toʻkilishi PCOS alomatlari boʻlishi mumkin, lekin ular muqarrar emas. Shaxsiy yondashuv alomatlarni yaxshiroq boshqarishga va kundalik hayotda oʻzingizni qulayroq his qilishga yordam beradi.',
    disclaimerText: 'Bu maqola faqat maʼlumot uchun va tibbiy konsultatsiya, tashxis yoki shaxsiy davolanishni almashtirmaydi.',
    shareMessage: 'Teri, tuklar va PCOS ning koʻrinadigan alomatlari — AWA',
  },
  az: {
    badge: 'PKOS',
    title: 'Dəri, saç və\ngörünən simptomlar',
    metaDuration: '9 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'PKOS dəridə, bədən tüklərində və ya baş dərisindəki saçlarda görünən dəyişikliklərə səbəb ola bilər. Onların haradan gəldiyini anlamaq onları tanımağı və hansı həllərin nəzərdən keçirilə biləcəyini bilməyi asanlaşdırır.',
    infoBannerText: 'Bu əlamətlər geniş yayılıb, lakin özlüyündə nə məcburidir, nə də PKOS diaqnozu qoymaq üçün kifayətdir.',
    contentsTitle: 'Bu məqalədə',
    contents: [
      'Bu simptomlar nə üçün görünür',
      'Hormonal sızanaq',
      'Həddindən artıq tük artımı',
      'Saçın seyrəlməsi',
      'Dərinizə qulluq etmək',
      'Saçınıza qulluq etmək',
      'Gündəlik həyatda nə kömək edə bilər',
      'Nə vaxt həkimə müraciət etmək lazımdır',
      'Geniş yayılmış yanlış təsəvvürlər',
      'Əsas nəticələr',
    ],
    section1Body1: 'PKOS qadınlarda da təbii şəkildə mövcud olan hormonlar olan androgenlərin artmış istehsalını və ya fəaliyyətini ehtiva edə bilər. Onların təsiri daha bariz olduqda, onlar piy vəzilərinə, tük follikullarına və tüklərin böyümə dövrünə təsir edə bilər.',
    section1Body2: 'Bu hormonal təsir davamlı sızanağın, artmış tük artımının və ya bəzi qadınlarda saçın seyrəlməsinin görünməsini böyük ölçüdə izah edə bilər.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Görünən simptomlar PKOS-un nə qədər ağır olduğunu mütləq əks etdirmir. Bir qadında bir neçə görünən simptom ola bilər, digərində isə az və ya heç olmaya bilər.',
    section2Body1: 'Hormonal dəyişikliklərlə bağlı sızanaq yeniyetməlikdən sonra da görünə və ya davam edə bilər. O, çənəyə, çənə xəttinə, aşağı yanaqlara və ya bəzən boyuna təsir etməyə meyllidir.',
    section2Body2: 'Bəzi insanlarda səpgilər dərin, həssas və təkrarlanan olur. Onlar qopardıldıqda və ya xüsusilə iltihablı olduqda piqmentli izlər və ya çapıqlar da qoya bilər.',
    skinSignsTitle: 'Mümkün dəri əlamətləri',
    skinSigns: [
      'Davamlı sızanaq, xüsusilə üzün aşağı hissəsində',
      'Əvvəlkindən daha yağlı dəri',
      'Bəzən hormonal dəyişikliklərdən sonra gələn sızanaq alovlanmaları',
      'Alovlanmalardan sonra qalan izlər və ya çapıqlar',
    ],
    section3Body1: 'Hirsutizm qadınlarda adətən təsirlənməyən nahiyələrdə terminal tüklərin artmış böyüməsinə deyilir. PKOS kontekstində o, androgenlərin tük follikullarına təsiri ilə bağlı ola bilər.',
    section3Body2: 'Ən çox təsirlənən nahiyələr çənə, yuxarı dodaq, sinə, qarın və ya kürəkdir. Tük artımının miqdarı şəxsdən şəxsə xeyli dəyişir.',
    hairSignsTitle: 'Mümkün əlamətlər',
    hairSigns: [
      'Üzdə daha görünən tük artımı',
      'Çənədə və ya yuxarı dodaqda daha qalın tüklər',
      'Sinədə, qarında və ya kürəkdə görünə bilən tük artımı',
      'Baş təpəsində saçın tədricən seyrəlməsi',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Tük artımı həm də genetik və fərdi amillərdən asılıdır. Nəzərəçarpan tük artımı avtomatik olaraq PKOS-un olduğu demək deyil.',
    section4Body1: 'PKOS olan bəzi qadınlar saç sıxlığının azaldığını da görür. Seyrəlmə xüsusilə baş təpəsində və ya ayrılıq xətti boyunca daha görünən ola bilər.',
    section4Body2: 'Bu, tədricən inkişaf edə bilər. Hormonla bağlı saç tökülməsini digər mümkün səbəblərdən, məsələn, çatışmazlıqdan, qalxanabənzər vəzi problemindən, bəzi dərmanlardan və ya əhəmiyyətli stress dövründən fərqləndirmək vacibdir.',
    alert1Title: 'Qeyd etməyə dəyər',
    alert1Text: 'Əhəmiyyətli, sürətli və ya qeyri-adi saç tökülməsi səbəbi araşdırmaq üçün tibbi qiymətləndirməyə layiqdir.',
    section5Body: 'Sadə, ardıcıl rejim adətən çoxlu məhsulun qat-qat tətbiqindən yaxşıdır. Məqsəd dərini təmizləmək, nəmləndirmək və qorumaq, qıcıqlanmanı davam etdirə biləcək hər şeyi isə məhdudlaşdırmaqdır.',
    careHabits: [
      'Mülayim, ardıcıl dəri qulluğu rejimi',
      'Gündəlik günəşdən qorunma',
      'Balanslı qidalanma',
      'Səbir: nəticələr vaxt tələb edir',
    ],
    section6Body1: 'Saç incəldikdə ona təkrarlanan stressi məhdudlaşdırmaq kömək edə bilər: həddindən artıq istilik, çox sıx saç düzümləri və ya tez-tez kimyəvi müalicələr.',
    section6Body2: 'Saç sıxlığı azalmağa davam edərsə, səbəbi müəyyən etmək və mövcud müalicələri müzakirə etmək üçün dermatoloji konsultasiya dəyərli ola bilər.',
    practicalTitle: 'Praktik məsləhətlər',
    practicalTips: [
      'Mülayim məhsullar seçin və çoxlu qıcıqlandırıcı müalicələri qat-qat tətbiq etməkdən çəkinin',
      'Dərini qurutmadan, lazım gələrsə, səhər və axşam təmizləyin',
      'Dəri açıq olanda günəşdən qoruyucudan istifadə edin',
      'İz və çapıqları məhdudlaşdırmaq üçün səpgiləri qopartmaqdan çəkinin',
      'Simptomlar davam edərsə və ya pisləşərsə, mütəxəssisdən məsləhət alın',
    ],
    section7Body: 'İdarəetmə simptomlardan, onların intensivliyindən, həyat keyfiyyətinə təsirindən və hər qadının məqsədlərindən asılıdır. Tək həll axtarmaq əvəzinə bir neçə istiqamətdə işləmək kömək edə bilər.',
    miniCards: [
      {title: 'Dəri', text: 'Uyğun rejim və lazım gələrsə, dermatoloq məsləhəti.'},
      {title: 'Tük artımı', text: 'Vəziyyətdən asılı olaraq kosmetik və ya tibbi həllər.'},
      {title: 'Saç', text: 'Müalicə seçməzdən əvvəl səbəbi müəyyən edin.'},
      {title: 'Rifah', text: 'Simptomların emosional təsirini nəzərə alın.'},
    ],
    section8Body1: 'Sızanaq davamlı və ya ağrılı olduqda, tük artımı sürətlə artdıqda, saç nəzərəçarpacaq dərəcədə seyrəldikdə və ya bu dəyişikliklər çox qeyri-müntəzəm dövrlərlə müşayiət olunduqda tibb işçisi ilə danışmaq yaxşıdır.',
    section8Body2: 'Dermatoloq dəri və saç simptomlarını idarə edə bilər. Ginekoloq və ya digər ixtisaslı mütəxəssis hormonal konteksti və PKOS-un digər mümkün əlamətlərini də qiymətləndirə bilər.',
    alert2Title: 'Lazım gələrsə, həkimə müraciət edin',
    alert2Text: 'Sürətli, əhəmiyyətli tük artımı, qəfil saç tökülməsi və ya qeyri-adi hormonal dəyişikliklər tibbi məsləhət tələb edir.',
    ideasReceived: [
      'Sızanağın olması avtomatik olaraq PKOS-unuz olduğu demək deyil',
      'Görünən tük artımı mütləq yalnız hormonlarla bağlı deyil',
      'PKOS istənilən bədən quruluşlu qadınlara təsir edə bilər',
      'Simptomlar zamanla dəyişə bilər və hər qadında eyni deyil',
    ],
    quoteText: 'PKOS-un görünən simptomları əsəbiləşdirici ola bilər, lakin onlar qadınlığınızı, dəyərinizi və ya gigiyenanızı müəyyən etmir.',
    summaryTitle: 'Əsas məsələlər',
    summaryItems: [
      'PKOS dəriyə, bədən tüklərinə və baş dərisindəki saçlara təsir edə bilər.',
      'Simptomlar qadından qadına xeyli dəyişir.',
      'Tək simptom PKOS diaqnozu qoymaq üçün kifayət deyil.',
      'Simptomları yaxşılaşdırmağa kömək edən həllər mövcuddur.',
      'Tibbi dəstək sizə uyğun yanaşmanı seçməyə kömək edə bilər.',
    ],
    finalTipTitle: 'Əsas nəticələr',
    finalTipText: 'Sızanaq, həddindən artıq tük artımı və ya saç tökülməsi PKOS-un simptomları ola bilər, lakin onlar qaçılmaz deyil. Fərdiləşdirilmiş yanaşma simptomları daha yaxşı idarə etməyə və gündəlik həyatda özünüzü daha rahat hiss etməyə kömək edə bilər.',
    disclaimerText: 'Bu məqalə yalnız məlumat üçündür və tibbi konsultasiyanı, diaqnozu və ya fərdi müalicəni əvəz etmir.',
    shareMessage: 'Dəri, saç və görünən PKOS simptomları — AWA',
  },
  ka: {
    badge: 'PCOS',
    title: 'კანი, თმა და\nთვალსაჩინო სიმპტომები',
    metaDuration: '9 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'PCOS-მა შეიძლება კანში, სხეულის თმასა ან თავის თმაში თვალსაჩინო ცვლილებები გამოიწვიოს. მათი წარმოშობის გაგება ამარტივებს მათ ამოცნობას და იმის ცოდნას, რა გადაწყვეტილებები შეიძლება განიხილონ.',
    infoBannerText: 'ეს ნიშნები გავრცელებულია, მაგრამ თავისთავად არც აუცილებელია და არც საკმარისი PCOS-ის დიაგნოზისთვის.',
    contentsTitle: 'ამ სტატიაში',
    contents: [
      'რატომ ჩნდება ეს სიმპტომები',
      'ჰორმონული აკნე',
      'თმის ჭარბი ზრდა',
      'თმის გათხელება',
      'კანზე ზრუნვა',
      'თმაზე ზრუნვა',
      'რა შეიძლება დაგეხმაროთ ყოველდღიურად',
      'როდის მივმართოთ ექიმს',
      'გავრცელებული მცდარი წარმოდგენები',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'PCOS-მა შეიძლება ანდროგენების, ჰორმონების, რომლებიც ქალებშიც ბუნებრივად არსებობს, გაზრდილი გამომუშავება ან აქტივობა მოიცვას. როცა მათი ეფექტი უფრო გამოხატულია, მათ შეუძლიათ ცხიმოვან ჯირკვლებზე, თმის ფოლიკულებზე და თმის ზრდის ციკლზე გავლენა მოახდინონ.',
    section1Body2: 'სწორედ ეს ჰორმონული გავლენა შეიძლება ხსნიდეს გაგრძელებული აკნეს, თმის გაზრდილი ზრდის ან, ზოგ ქალში, თმის გათხელების გაჩენას.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თვალსაჩინო სიმპტომები აუცილებლად არ ასახავს PCOS-ის სიმძიმეს. ერთ ქალს შეიძლება რამდენიმე თვალსაჩინო სიმპტომი ჰქონდეს, მეორეს კი ცოტა ან საერთოდ არცერთი.',
    section2Body1: 'ჰორმონულ ცვლილებებთან დაკავშირებული აკნე მოზარდობის მიღმა შეიძლება გამოჩნდეს ან გაგრძელდეს. ის, როგორც წესი, ნიკაპს, ყბის ხაზს, ქვედა ლოყებს ან ზოგჯერ კისერს ეხება.',
    section2Body2: 'ზოგ ადამიანში დაზიანებები ღრმა, მტკივნეული და განმეორებადია. ისინი შეიძლება ასევე დატოვონ პიგმენტირებული ლაქები ან ნაიარევები, როცა მათ მოწყვეტენ ან როცა განსაკუთრებით ანთებულია.',
    skinSignsTitle: 'შესაძლო კანის ნიშნები',
    skinSigns: [
      'გაგრძელებული აკნე, განსაკუთრებით სახის ქვედა ნაწილში',
      'კანი, რომელიც უფრო ცხიმიანია, ვიდრე ადრე',
      'აკნეს გამწვავებები, რომლებიც ზოგჯერ ჰორმონულ ცვლილებებს მოსდევს',
      'ლაქები ან ნაიარევები გამწვავების შემდეგ',
    ],
    section3Body1: 'ჰირსუტიზმი ნიშნავს ტერმინალური თმის გაზრდილ ზრდას ისეთ უბნებში, რომლებიც ქალებში ჩვეულებრივ არ ზიანდება. PCOS-ის კონტექსტში ის შეიძლება ანდროგენების გავლენას უკავშირდებოდეს თმის ფოლიკულებზე.',
    section3Body2: 'ყველაზე ხშირად დაზარალებული უბნებია ნიკაპი, ზედა ტუჩი, მკერდი, მუცელი ან ზურგი. თმის ზრდის რაოდენობა ადამიანიდან ადამიანამდე მნიშვნელოვნად განსხვავდება.',
    hairSignsTitle: 'შესაძლო ნიშნები',
    hairSigns: [
      'უფრო თვალსაჩინო თმის ზრდა სახეზე',
      'უფრო უხეში თმა ნიკაპზე ან ზედა ტუჩზე',
      'თმის ზრდა, რომელიც მკერდზე, მუცელზე ან ზურგზე შეიძლება გამოჩნდეს',
      'თმის ეტაპობრივი გათხელება თავის გვირგვინზე',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'თმის ზრდა ასევე გენეტიკურ და ინდივიდუალურ ფაქტორებზეა დამოკიდებული. შესამჩნევი თმის ზრდა ავტომატურად არ ნიშნავს PCOS-ის არსებობას.',
    section4Body1: 'PCOS-ის მქონე ზოგი ქალი ასევე თმის სიმკვრივის შემცირებას ამჩნევს. გათხელება განსაკუთრებით თვალსაჩინო შეიძლება იყოს თავის გვირგვინზე ან გამყოფი ხაზის გასწვრივ.',
    section4Body2: 'ეს ეტაპობრივად შეიძლება განვითარდეს. მნიშვნელოვანია ჰორმონთან დაკავშირებული თმის ცვენის განსხვავება სხვა შესაძლო მიზეზებისგან, როგორიცაა დეფიციტი, ფარისებრი ჯირკვლის პრობლემა, გარკვეული მედიკამენტები ან მნიშვნელოვანი სტრესის პერიოდი.',
    alert1Title: 'აღსანიშნავია',
    alert1Text: 'თმის ცვენა, რომელიც მნიშვნელოვანი, სწრაფი ან უჩვეულოა, სამედიცინო შეფასებას იმსახურებს, მიზეზის გამოსაკვლევად.',
    section5Body: 'მარტივი, თანმიმდევრული რუტინა ზოგადად უკეთესია, ვიდრე ბევრი პროდუქტის ერთმანეთზე დაფენა. მიზანია კანის გაწმენდა, დატენიანება და დაცვა, ამავდროულად ყველაფრის შეზღუდვა, რამაც გაღიზიანება შეიძლება შეინარჩუნოს.',
    careHabits: [
      'ნაზი, თანმიმდევრული კანის მოვლის რუტინა',
      'ყოველდღიური დაცვა მზისგან',
      'დაბალანსებული კვება',
      'მოთმინება: შედეგებს დრო სჭირდება',
    ],
    section6Body1: 'როცა თმა უფრო თხელი ხდება, შეიძლება სასარგებლო იყოს მასზე განმეორებითი სტრესის შეზღუდვა: ზედმეტი სიცხე, ძალიან მჭიდრო ვარცხნილობები ან ხშირი ქიმიური პროცედურები.',
    section6Body2: 'დერმატოლოგიური კონსულტაცია ღირებული შეიძლება იყოს, თუ თმის სიმკვრივე კვლავ მცირდება, რომ მიზეზი დადგინდეს და ხელმისაწვდომი მკურნალობა განიხილონ.',
    practicalTitle: 'პრაქტიკული რჩევები',
    practicalTips: [
      'აირჩიეთ რბილი საშუალებები და აარიდეთ თავი რამდენიმე გამღიზიანებელი საშუალების დაფენას',
      'გაწმინდეთ კანი მისი გამოშრობის გარეშე, საჭიროების შემთხვევაში დილით და საღამოს',
      'გამოიყენეთ მზისგან დაცვა, როცა კანი ღიაა',
      'მოერიდეთ გამონაყარის მოწყვეტას, ლაქებისა და ნაიარევების შესამცირებლად',
      'თუ სიმპტომები რჩება ან უარესდება, სპეციალისტს ჰკითხეთ რჩევა',
    ],
    section7Body: 'მართვა დამოკიდებულია სიმპტომებზე, მათ ინტენსივობაზე, ცხოვრების ხარისხზე გავლენასა და თითოეული ქალის მიზნებზე. შეიძლება სასარგებლო იყოს რამდენიმე მიმართულებით მუშაობა, ერთი გადაწყვეტილების ძიების ნაცვლად.',
    miniCards: [
      {title: 'კანი', text: 'შესაფერისი რუტინა და, საჭიროების შემთხვევაში, დერმატოლოგის რჩევა.'},
      {title: 'თმის ზრდა', text: 'კოსმეტიკური ან სამედიცინო გადაწყვეტილებები სიტუაციის მიხედვით.'},
      {title: 'თმა', text: 'მკურნალობის არჩევამდე მიზეზი დაადგინეთ.'},
      {title: 'კეთილდღეობა', text: 'გაითვალისწინეთ სიმპტომების ემოციური გავლენა.'},
    ],
    section8Body1: 'კარგია ჯანდაცვის სპეციალისტთან საუბარი, როცა აკნე გაგრძელებული ან მტკივნეული ხდება, თმის ზრდა სწრაფად იმატებს, თმა შესამჩნევად თხელდება ან ეს ცვლილებები ძალიან არარეგულარულ ციკლებს ახლავს.',
    section8Body2: 'დერმატოლოგს შეუძლია კანისა და თმის სიმპტომების მართვა. გინეკოლოგს ან სხვა კვალიფიციურ სპეციალისტსაც შეუძლია ჰორმონული კონტექსტისა და PCOS-ის ნებისმიერი სხვა შესაძლო ნიშნის შეფასება.',
    alert2Title: 'საჭიროების შემთხვევაში მიმართეთ ექიმს',
    alert2Text: 'თმის სწრაფი, მნიშვნელოვანი ზრდა, თმის უეცარი ცვენა ან უჩვეულო ჰორმონული ცვლილებები სამედიცინო რჩევას მოითხოვს.',
    ideasReceived: [
      'აკნეს ქონა ავტომატურად არ ნიშნავს, რომ PCOS გაქვთ',
      'თვალსაჩინო თმის ზრდა აუცილებლად მხოლოდ ჰორმონებს არ უკავშირდება',
      'PCOS ნებისმიერი აღნაგობის ქალს შეიძლება შეეხოს',
      'სიმპტომები დროთა განმავლობაში შეიძლება შეიცვალოს და ყველა ქალს ერთნაირი არ აქვს',
    ],
    quoteText: 'PCOS-ის თვალსაჩინო სიმპტომები შეიძლება იმედგაცრუებელი იყოს, მაგრამ ისინი არ განსაზღვრავს თქვენს ქალურობას, ღირებულებას ან ჰიგიენას.',
    summaryTitle: 'მთავარი',
    summaryItems: [
      'PCOS-მა შეიძლება კანზე, სხეულის თმასა და თავის თმაზე იმოქმედოს.',
      'სიმპტომები ქალიდან ქალამდე ძლიერ განსხვავდება.',
      'ერთი სიმპტომი PCOS-ის დიაგნოსტიკისთვის საკმარისი არ არის.',
      'არსებობს გადაწყვეტილებები სიმპტომების გასაუმჯობესებლად.',
      'სამედიცინო მხარდაჭერა დაგეხმარებათ აირჩიოთ თქვენთვის სწორი მიდგომა.',
    ],
    finalTipTitle: 'მთავარი დასკვნები',
    finalTipText: 'აკნე, თმის ჭარბი ზრდა ან თმის ცვენა PCOS-ის სიმპტომები შეიძლება იყოს, მაგრამ ისინი გარდაუვალი არ არის. პერსონალიზებულ მიდგომას შეუძლია სიმპტომების უკეთ მართვაში და ყოველდღიურად უფრო კომფორტულად ყოფნაში დაგეხმაროთ.',
    disclaimerText: 'ეს სტატია მხოლოდ საინფორმაციოა და სამედიცინო კონსულტაციას, დიაგნოზს ან პერსონალიზებულ მკურნალობას არ ანაცვლებს.',
    shareMessage: 'კანი, თმა და PCOS-ის თვალსაჩინო სიმპტომები — AWA',
  },
  hy: {
    badge: 'PCOS',
    title: 'Մաշկ, մազեր և\nտեսանելի ախտանիշներ',
    metaDuration: '9 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'PCOS-ը կարող է առաջացնել տեսանելի փոփոխություններ մաշկի, մարմնի մազերի կամ գլխի մազերի վրա: Դրանց ծագումը հասկանալը հեշտացնում է ճանաչելը և իմանալը, թե ինչ լուծումներ կարող են դիտարկվել:',
    infoBannerText: 'Այս նշանները տարածված են, բայց ինքնին ո՛չ պարտադիր են, ո՛չ էլ բավարար PCOS-ը ախտորոշելու համար:',
    contentsTitle: 'Այս հոդվածում',
    contents: [
      'Ինչու են հայտնվում այս ախտանիշները',
      'Հորմոնալ ակնե',
      'Մազերի չափից ավելի աճ',
      'Մազերի նոսրացում',
      'Հոգ տանել ձեր մաշկի մասին',
      'Հոգ տանել ձեր մազերի մասին',
      'Ինչը կարող է օգնել օրեցօր',
      'Երբ դիմել բժշկի',
      'Տարածված թյուր պատկերացումներ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'PCOS-ը կարող է ներառել անդրոգենների՝ հորմոնների, որոնք բնականորեն առկա են նաև կանանց մոտ, ավելացած արտադրություն կամ ակտիվություն: Երբ դրանց ազդեցությունն ավելի արտահայտված է, դրանք կարող են ազդել ճարպագեղձերի, մազարմատների և մազերի աճի ցիկլի վրա:',
    section1Body2: 'Այս հորմոնալ ազդեցությունը մեծապես այն է, ինչը կարող է բացատրել շարունակական ակնեի, մազերի ավելի մեծ աճի կամ, որոշ կանանց մոտ, մազերի նոսրացման հայտնվելը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Տեսանելի ախտանիշները պարտադիր չէ արտացոլեն PCOS-ի ծանրությունը: Մեկ կին կարող է ունենալ մի քանի տեսանելի ախտանիշ, իսկ մյուսը՝ քիչ կամ ընդհանրապես ոչ մեկը:',
    section2Body1: 'Հորմոնալ փոփոխություններին կապված ակնեն կարող է հայտնվել կամ պահպանվել դեռահասությունից հետո: Այն հակված է ազդել կզակի, ծնոտի գծի, ստորին այտերի կամ երբեմն պարանոցի վրա:',
    section2Body2: 'Որոշ մարդկանց մոտ ցանավորումները խորն են, ցավոտ և կրկնվող: Դրանք կարող են նաև թողնել պիգմենտային հետքեր կամ սպիներ, երբ քերվում են կամ երբ առանձնապես բորբոքված են:',
    skinSignsTitle: 'Հնարավոր մաշկային նշաններ',
    skinSigns: [
      'Շարունակական ակնե, հատկապես դեմքի ստորին հատվածում',
      'Նախկինից ավելի յուղոտ մաշկ',
      'Ակնեի սրացումներ, որոնք երբեմն հաջորդում են հորմոնալ փոփոխություններին',
      'Սրացումներից հետո մնացած հետքեր կամ սպիներ',
    ],
    section3Body1: 'Հիրսուտիզմը նշանակում է տերմինալ մազերի ավելացած աճ այն հատվածներում, որոնք սովորաբար չեն ազդվում կանանց մոտ: PCOS-ի համատեքստում այն կարող է կապված լինել անդրոգենների ազդեցության հետ մազարմատների վրա:',
    section3Body2: 'Ամենից հաճախ ազդվող հատվածներն են կզակը, վերին շրթունքը, կրծքավանդակը, որովայնը կամ մեջքը: Մազերի աճի չափը զգալիորեն տարբերվում է մարդուց մարդ:',
    hairSignsTitle: 'Հնարավոր նշաններ',
    hairSigns: [
      'Դեմքի ավելի տեսանելի մազեր',
      'Կզակի կամ վերին շրթունքի ավելի կոշտ մազեր',
      'Մազեր, որոնք կարող են հայտնվել կրծքավանդակին, որովայնին կամ մեջքին',
      'Գլխի գագաթին մազերի աստիճանական նոսրացում',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Մազերի աճը կախված է նաև գենետիկ և անհատական գործոններից: Նկատելի մազերի աճը ինքնաբերաբար չի նշանակում, որ PCOS կա:',
    section4Body1: 'PCOS ունեցող որոշ կանայք նաև նկատում են մազերի խտության նվազում: Նոսրացումը կարող է հատկապես տեսանելի լինել գլխի գագաթին կամ բաժանման գծի երկայնքով:',
    section4Body2: 'Սա կարող է զարգանալ աստիճանաբար: Կարևոր է հորմոնների հետ կապված մազաթափությունը տարբերակել այլ հնարավոր պատճառներից, ինչպիսիք են պակասը, վահանաձև գեղձի խնդիրը, որոշ դեղամիջոցներ կամ զգալի սթրեսի շրջանը:',
    alert1Title: 'Հարկ է նշել',
    alert1Text: 'Զգալի, արագ կամ անսովոր մազաթափությունը արժանի է բժշկական գնահատման՝ պատճառը ուսումնասիրելու համար:',
    section5Body: 'Պարզ, հետևողական ռեժիմը սովորաբար ավելի լավ է, քան բազմաթիվ միջոցներ շերտավորելը: Նպատակը մաշկը մաքրելն է, խոնավեցնելն ու պաշտպանելը՝ սահմանափակելով այն ամենը, ինչը կարող է պահպանել գրգռումը:',
    careHabits: [
      'Մաշկի մեղմ, հետևողական խնամքի ռեժիմ',
      'Ամենօրյա պաշտպանություն արևից',
      'Հավասարակշռված սննդակարգ',
      'Համբերություն. արդյունքները ժամանակ են պահանջում',
    ],
    section6Body1: 'Երբ մազերը դառնում են ավելի բարակ, կարող է օգտակար լինել սահմանափակել դրանց կրկնվող լարվածությունը՝ չափազանց ջերմություն, շատ ձգված սանրվածքներ կամ հաճախակի քիմիական բուժումներ:',
    section6Body2: 'Մաշկաբանի խորհրդատվությունը կարող է արժեքավոր լինել, եթե մազերի խտությունը շարունակում է նվազել, պատճառը որոշելու և առկա բուժումները քննարկելու համար:',
    practicalTitle: 'Գործնական խորհուրդներ',
    practicalTips: [
      'Ընտրեք մեղմ միջոցներ և խուսափեք մի քանի գրգռող բուժումներ շերտավորելուց',
      'Մաքրեք մաշկը՝ առանց չորացնելու, առավոտյան և երեկոյան, եթե անհրաժեշտ է',
      'Օգտագործեք արևապաշտպանություն, երբ մաշկը բաց է',
      'Խուսափեք արատները քերելուց՝ հետքերն ու սպիները սահմանափակելու համար',
      'Խորհուրդ հարցրեք մասնագետից, եթե ախտանիշները շարունակվում են կամ վատանում',
    ],
    section7Body: 'Կառավարումը կախված է ախտանիշներից, դրանց ինտենսիվությունից, կյանքի որակի վրա ազդեցությունից և յուրաքանչյուր կնոջ նպատակներից: Կարող է օգտակար լինել աշխատել մի քանի ճակատներում՝ մեկ լուծում փնտրելու փոխարեն:',
    miniCards: [
      {title: 'Մաշկ', text: 'Համապատասխան ռեժիմ և մաշկաբանի խորհուրդ՝ անհրաժեշտության դեպքում:'},
      {title: 'Մազերի աճ', text: 'Կոսմետիկ կամ բժշկական լուծումներ՝ կախված իրավիճակից:'},
      {title: 'Մազեր', text: 'Բացահայտեք պատճառը՝ նախքան բուժումն ընտրելը:'},
      {title: 'Բարեկեցություն', text: 'Հաշվի առեք ախտանիշների հուզական ազդեցությունը:'},
    ],
    section8Body1: 'Լավ է խոսել առողջապահության մասնագետի հետ, երբ ակնեն դառնում է շարունակական կամ ցավոտ, երբ մազերի աճը արագ ավելանում է, երբ մազերը նկատելիորեն նոսրանում են, կամ երբ այս փոփոխություններն ուղեկցվում են շատ անկանոն ցիկլերով:',
    section8Body2: 'Մաշկաբանը կարող է կառավարել մաշկի և մազերի ախտանիշները: Գինեկոլոգը կամ այլ որակավորված մասնագետը կարող է նաև գնահատել հորմոնալ համատեքստը և PCOS-ի ցանկացած այլ հնարավոր նշան:',
    alert2Title: 'Անհրաժեշտության դեպքում դիմեք բժշկի',
    alert2Text: 'Մազերի արագ, զգալի աճը, հանկարծակի մազաթափությունը կամ անսովոր հորմոնալ փոփոխությունները պահանջում են բժշկական խորհրդատվություն:',
    ideasReceived: [
      'Ակնե ունենալը ինքնաբերաբար չի նշանակում, որ ունեք PCOS',
      'Մազերի տեսանելի աճը պարտադիր չէ կապված լինի միայն հորմոնների հետ',
      'PCOS-ը կարող է ազդել ցանկացած կազմվածքի կանանց վրա',
      'Ախտանիշները կարող են փոխվել ժամանակի ընթացքում և նույնը չեն յուրաքանչյուր կնոջ համար',
    ],
    quoteText: 'PCOS-ի տեսանելի ախտանիշները կարող են հիասթափեցնող լինել, սակայն դրանք չեն սահմանում ձեր կանացիությունը, ձեր արժեքը կամ ձեր հիգիենան:',
    summaryTitle: 'Էականը',
    summaryItems: [
      'PCOS-ը կարող է ազդել մաշկի, մարմնի մազերի և գլխի մազերի վրա:',
      'Ախտանիշները խիստ տարբերվում են կնոջից կին:',
      'Մեկ ախտանիշը բավական չէ PCOS-ը ախտորոշելու համար:',
      'Գոյություն ունեն լուծումներ, որոնք օգնում են բարելավել ախտանիշները:',
      'Բժշկական աջակցությունը կարող է օգնել ընտրել ձեզ համար ճիշտ մոտեցումը:',
    ],
    finalTipTitle: 'Հիմնական եզրակացություններ',
    finalTipText: 'Ակնեն, մազերի չափից ավելի աճը կամ մազաթափությունը կարող են PCOS-ի ախտանիշներ լինել, սակայն դրանք անխուսափելի չեն: Անհատականացված մոտեցումը կարող է օգնել ավելի լավ կառավարել ախտանիշները և օրեցօր ավելի հարմար զգալ:',
    disclaimerText: 'Այս հոդվածը միայն տեղեկատվական է և չի փոխարինում բժշկական խորհրդատվությանը, ախտորոշմանը կամ անհատականացված բուժմանը:',
    shareMessage: 'Մաշկ, մազեր և PCOS-ի տեսանելի ախտանիշներ — AWA',
  },
  tg: {
    badge: 'PCOS',
    title: 'Пӯст, мӯй ва\nнишонаҳои намоён',
    metaDuration: '9 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'PCOS метавонад тағйироти намоёнро дар пӯст, мӯйи бадан ё мӯйи сар ба вуҷуд орад. Фаҳмидани манбаи онҳо шинохтани онҳоро осонтар мекунад ва имкон медиҳад бидонед, кадом роҳҳоро баррасӣ кардан мумкин аст.',
    infoBannerText: 'Ин нишонаҳо маъмуланд, вале худ ба худ барои ташхиси PCOS на лозим ва на кифоя мебошанд.',
    contentsTitle: 'Дар ин мақола',
    contents: [
      'Чаро ин нишонаҳо пайдо мешаванд',
      'Доначаҳои гормонӣ',
      'Афзоиши аз ҳад зиёди мӯй',
      'Борик шудани мӯй',
      'Ғамхорӣ аз пӯсти худ',
      'Ғамхорӣ аз мӯйи худ',
      'Чӣ метавонад дар ҳаёти ҳаррӯза кумак кунад',
      'Кай ба табиб муроҷиат кардан лозим аст',
      'Тасаввуроти нодурусти маъмул',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'PCOS метавонад афзоиши тавлид ё фаъолияти андрогенҳоро, гормонҳое, ки ба таври табиӣ дар занон низ ҳузур доранд, дар бар гирад. Вақте ки таъсири онҳо возеҳтар аст, онҳо метавонанд ба ғадудҳои чарб, фолликулҳои мӯй ва давраи афзоиши мӯй таъсир расонанд.',
    section1Body2: 'Ин таъсири гормонӣ бештар аз ҳама метавонад пайдоиши доначаҳои доимии рӯй, афзоиши мӯй ё, дар баъзе занон, борик шудани мӯйро шарҳ диҳад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Нишонаҳои намоён ҳатман шиддати PCOS-ро инъикос намекунанд. Як зан метавонад якчанд нишонаи намоён дошта бошад, дар ҳоле ки дигаре камтар ё ҳеҷ нишона надорад.',
    section2Body1: 'Доначаҳои рӯй, ки бо тағйироти гормонӣ алоқаманданд, метавонанд пас аз наврасӣ пайдо шаванд ё идома ёбанд. Онҳо майл доранд манаҳ, хат, рухсораҳои поёнӣ ё баъзан гарданро фаро гиранд.',
    section2Body2: 'Дар баъзе одамон ҷароҳатҳо чуқур, дардманд ва такроршавандаанд. Онҳо инчунин метавонанд вақте ки хоида мешаванд ё махсусан илтиҳобӣ мебошанд, доғҳои рангин ё чанд боқӣ гузоранд.',
    skinSignsTitle: 'Нишонаҳои имконпазири пӯст',
    skinSigns: [
      'Доначаҳои доимӣ, хусусан дар қисми поёни рӯй',
      'Пӯсти чарбтар аз пештара',
      'Авҷҳои доначаҳо, ки баъзан тағйироти гормониро пайравӣ мекунанд',
      'Доғҳо ё чандҳои пас аз авҷҳо мондагӣ',
    ],
    section3Body1: 'Гирсутизм афзоиши мӯйи терминалиро дар минтақаҳое мефаҳмонад, ки одатан дар занон таъсир намебинанд. Дар заминаи PCOS ин метавонад бо таъсири андрогенҳо ба фолликулҳои мӯй алоқаманд бошад.',
    section3Body2: 'Минтақаҳои аксар вақт таъсирдида манаҳ, лаби боло, сина, шикам ё пушт мебошанд. Миқдори афзоиши мӯй аз шахс ба шахс хеле фарқ мекунад.',
    hairSignsTitle: 'Нишонаҳои имконпазир',
    hairSigns: [
      'Афзоиши намоёни мӯй дар рӯй',
      'Мӯйи дурушттар дар манаҳ ё лаби боло',
      'Афзоиши мӯй, ки метавонад дар сина, шикам ё пушт пайдо шавад',
      'Борик шудани тадриҷии мӯй дар қисми болоии сар',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Афзоиши мӯй инчунин ба омилҳои генетикӣ ва инфиродӣ вобаста аст. Афзоиши намоёни мӯй худкор маънои мавҷудияти PCOS-ро надорад.',
    section4Body1: 'Баъзе занони дорои PCOS инчунин кам шудани зичии мӯйро мушоҳида мекунанд. Борик шудан метавонад махсусан дар қисми болоии сар ё дар хати миёнаи ҷудо намоён бошад.',
    section4Body2: 'Ин метавонад тадриҷан пайдо шавад. Муҳим аст, ки рехтани мӯйи вобаста ба гормонро аз сабабҳои имконпазири дигар, аз қабили норасоӣ, мушкили ғадуди сипаршакл, баъзе доруҳо ё давраи стресси назаррас фарқ кард.',
    alert1Title: 'Қобили қайд',
    alert1Text: 'Рехтани мӯйи назаррас, зуд ё ғайриоддӣ арзёбии тиббиро барои таҳқиқи сабаб сазовор аст.',
    section5Body: 'Тартиби оддӣ ва мунтазам аз қабат-қабат гузоштани маҳсулоти зиёд умуман беҳтар аст. Мақсад тоза кардан, намнок кардан ва муҳофизати пӯст аст ва ҳамзамон маҳдуд кардани ҳар чизест, ки метавонад асабониятро нигоҳ дорад.',
    careHabits: [
      'Тартиби нарм ва мунтазами нигоҳубини пӯст',
      'Муҳофизат аз офтоб ҳар рӯз',
      'Ғизои мутавозин',
      'Сабр: натиҷаҳо вақт мегиранд',
    ],
    section6Body1: 'Вақте ки мӯй борик мешавад, метавонад муфид бошад, ки фишори такроршавандаро ба он маҳдуд кунед: гармии аз ҳад зиёд, мӯйороиҳои хеле танг ё табобатҳои химиявии зуд-зуд.',
    section6Body2: 'Машварати пӯстшиносӣ метавонад сазовор бошад, агар зичии мӯй кам шуданро идома диҳад, то сабабро муайян кунад ва табобатҳои дастрасро муҳокима намояд.',
    practicalTitle: 'Маслиҳатҳои амалӣ',
    practicalTips: [
      'Маҳсулоти нармро интихоб кунед ва аз қабат-қабат гузоштани якчанд табобати асабонӣ худдорӣ намоед',
      'Пӯстро бе хушкондан тоза кунед, субҳу шом, агар лозим бошад',
      'Вақте ки пӯст кушода аст, муҳофизат аз офтобро истифода баред',
      'Аз хоидани нуқсонҳо худдорӣ кунед, то доғҳо ва чандҳоро маҳдуд намоед',
      'Агар нишонаҳо идома ёбанд ё бадтар шаванд, аз мутахассис маслиҳат пурсед',
    ],
    section7Body: 'Идора ба нишонаҳо, шиддати онҳо, таъсири онҳо ба сифати зиндагӣ ва ҳадафҳои ҳар зан вобаста аст. Метавонад муфид бошад, ки дар якчанд самт кор кунед, на ки як роҳи ягонаро ҷӯед.',
    miniCards: [
      {title: 'Пӯст', text: 'Тартиби мувофиқ ва маслиҳати пӯстшиносӣ, агар лозим бошад.'},
      {title: 'Афзоиши мӯй', text: 'Роҳҳои косметикӣ ё тиббӣ вобаста ба вазъият.'},
      {title: 'Мӯй', text: 'Пеш аз интихоби табобат сабабро муайян кунед.'},
      {title: 'Некӯаҳволӣ', text: 'Таъсири ҳиссии нишонаҳоро ба назар гиред.'},
    ],
    section8Body1: 'Хуб аст бо мутахассиси соҳаи тиб гап занед, вақте ки доначаҳо доимӣ ё дардманд мешаванд, афзоиши мӯй зуд зиёд мешавад, мӯй ба таври намоён борик мешавад ё ин тағйирот бо давраҳои хеле номунтазам ҳамроҳ мешаванд.',
    section8Body2: 'Пӯстшинос метавонад нишонаҳои пӯст ва мӯйро идора кунад. Занбемор ё мутахассиси салоҳиятдори дигар низ метавонад заминаи гормонӣ ва ҳар нишонаи имконпазири дигари PCOS-ро арзёбӣ кунад.',
    alert2Title: 'Дар сурати зарурат ба табиб муроҷиат кунед',
    alert2Text: 'Афзоиши зуд ва назарраси мӯй, рехтани ногаҳонии мӯй ё тағйироти ғайриоддии гормонӣ маслиҳати тиббиро талаб мекунанд.',
    ideasReceived: [
      'Доштани доначаҳои рӯй худкор маънои доштани PCOS-ро надорад',
      'Афзоиши намоёни мӯй ҳатман танҳо бо гормонҳо алоқаманд нест',
      'PCOS метавонад занони ҳама намуди ҷусса фаро гирад',
      'Нишонаҳо бо мурури замон метавонанд тағйир ёбанд ва барои ҳар зан якхела нестанд',
    ],
    quoteText: 'Нишонаҳои намоёни PCOS метавонанд ноумедкунанда бошанд, вале онҳо занона будани шумо, арзиши шумо ё гигиенаи шуморо муайян намекунанд.',
    summaryTitle: 'Муҳимтарин чизҳо',
    summaryItems: [
      'PCOS метавонад ба пӯст, мӯйи бадан ва мӯйи сар таъсир расонад.',
      'Нишонаҳо аз зан ба зан хеле гуногунанд.',
      'Як нишона барои ташхиси PCOS кифоя нест.',
      'Роҳҳо барои беҳтар кардани нишонаҳо вуҷуд доранд.',
      'Дастгирии тиббӣ метавонад ба шумо кумак кунад равиши мувофиқи худро интихоб кунед.',
    ],
    finalTipTitle: 'Хулосаҳои асосӣ',
    finalTipText: 'Доначаҳои рӯй, афзоиши аз ҳад зиёди мӯй ё рехтани мӯй метавонанд нишонаҳои PCOS бошанд, вале онҳо ногузир нестанд. Равиши шахсӣ метавонад ба шумо кумак кунад нишонаҳоро беҳтар идора кунед ва дар ҳаёти ҳаррӯза худро роҳатар ҳис намоед.',
    disclaimerText: 'Ин мақола танҳо барои иттилоъ аст ва машварати тиббӣ, ташхис ё табобати шахсиро иваз намекунад.',
    shareMessage: 'Пӯст, мӯй ва нишонаҳои намоёни PCOS — AWA',
  },
  ky: {
    badge: 'PCOS',
    title: 'Тери, чач жана\nкөрүнүүчү белгилер',
    metaDuration: '9 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'PCOS териде, денедеги түктө же баштагы чачта көрүнүүчү өзгөрүүлөрдү жаратышы мүмкүн. Алардын кайдан келерин түшүнүү аларды таанууну жана кандай чечимдер каралышы мүмкүн экенин билүүнү жеңилдетет.',
    infoBannerText: 'Бул белгилер кеңири таралган, бирок өзү PCOS диагнозун коюу үчүн милдеттүү да, жетиштүү да эмес.',
    contentsTitle: 'Бул макалада',
    contents: [
      'Бул белгилер эмне үчүн пайда болот',
      'Гормондук безеткилер',
      'Ашыкча түк өсүү',
      'Чачтын сейректөөсү',
      'Териңизге кам көрүү',
      'Чачыңызга кам көрүү',
      'Күнүмдүк жашоодо эмне жардам бериши мүмкүн',
      'Дарыгерге качан барыш керек',
      'Кеңири таралган жаңылыш түшүнүктөр',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'PCOS андрогендердин, аялдарда да табигый түрдө бар гормондордун, өндүрүлүшүнүн же активдүүлүгүнүн көбөйүшүн камтышы мүмкүн. Алардын таасири айкын болгондо, алар май бездерине, чач фолликулдарына жана чачтын өсүү циклине таасир этиши мүмкүн.',
    section1Body2: 'Бул гормондук таасир улана берген безеткилердин, түктүн көбөйүшүнүн же айрым аялдарда чачтын сейректөөсүнүн пайда болушун көбүнчө түшүндүрө алат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Көрүнүүчү белгилер PCOSтун канчалык оор экенин сөзсүз чагылдырбайт. Бир аялда бир нече көрүнүүчү белги болушу мүмкүн, башкасында аз же такыр жок.',
    section2Body1: 'Гормондук өзгөрүүлөр менен байланышкан безеткилер өспүрүмдүк мезгилден кийин да пайда болушу же сакталышы мүмкүн. Алар көбүнчө ээкке, жаак сызыгына, төмөнкү жаактарга же кээде моюнга таасир этет.',
    section2Body2: 'Айрым адамдарда жараатчалар терең, оорутуучу жана кайталануучу. Алар тытылганда же өзгөчө сезгенгенде пигментация таптарын же тырыктарды калтырышы мүмкүн.',
    skinSignsTitle: 'Териде мүмкүн болгон белгилер',
    skinSigns: [
      'Улана берген безеткилер, айрыкча беттин ылдый жагында',
      'Мурункудан майлуураак тери',
      'Кээде гормондук өзгөрүүлөрдөн кийин келген безеткилердин күчөөсү',
      'Күчөөлөрдөн кийин калган таптар же тырыктар',
    ],
    section3Body1: 'Гирсутизм — аялдарда адатта таасирленбеген аймактарда терминалдык түктүн көбөйүшү. PCOS контекстинде ал андрогендердин чач фолликулдарына таасири менен байланышкан болушу мүмкүн.',
    section3Body2: 'Көбүнчө таасирленген аймактар — ээк, үстүнкү эрин, көкүрөк, курсак же бел. Түктүн өсүү даражасы адамдан адамга бир кыйла айырмаланат.',
    hairSignsTitle: 'Мүмкүн болгон белгилер',
    hairSigns: [
      'Бетте түктүн көбүрөөк көрүнүшү',
      'Ээкте же үстүнкү эринде жоонураак түк',
      'Көкүрөктө, курсакта же белде пайда болушу мүмкүн түк',
      'Баш чокусунда чачтын акырындап сейректөөсү',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Түктүн өсүшү генетикалык жана жеке факторлорго да көз каранды. Байкалаарлык түк өсүү PCOS бар дегенди автоматтык түрдө билдирбейт.',
    section4Body1: 'PCOS бар айрым аялдар чач тыгыздыгынын азайышын да байкашат. Сейректөө баш чокусунда же ортодогу бөлүүчү сызыкта өзгөчө көрүнүшү мүмкүн.',
    section4Body2: 'Бул акырындап өнүгүшү мүмкүн. Гормондор менен байланышкан чач түшүүнү башка мүмкүн болгон себептерден айырмалоо маанилүү, мисалы жетишсиздик, калкан сымал без көйгөйү, айрым дарылар же олуттуу стресс мезгили.',
    alert1Title: 'Эске алууга татыктуу',
    alert1Text: 'Олуттуу, тез же адаттан тыш чач түшүү себебин изилдөө үчүн медициналык баага татыйт.',
    section5Body: 'Көптөгөн каражаттарды катмарлагандан көрө жөнөкөй, туруктуу тартип жалпысынан жакшыраак. Максат — терини тазалоо, нымдоо жана коргоо, ошол эле учурда дүүлүгүүнү улантышы мүмкүн болгон нерселерди чектөө.',
    careHabits: [
      'Жумшак, туруктуу тери кам көрүү тартиби',
      'Күн сайын күндөн коргоо',
      'Тең салмактуу тамактануу',
      'Сабырдуулук: натыйжалар убакыт талап кылат',
    ],
    section6Body1: 'Чач ичке боло баштаганда, ага кайталанган стрессти чектөө пайдалуу болушу мүмкүн: ашыкча жылуулук, өтө тыгыз чач жасалгалары же тез-тез химиялык дарылоо.',
    section6Body2: 'Чач тыгыздыгы азая берсе, себебин аныктоого жана жеткиликтүү дарылоолорду талкуулоого жардам берүү үчүн дерматолог менен консультация пайдалуу болушу мүмкүн.',
    practicalTitle: 'Практикалык кеңештер',
    practicalTips: [
      'Жумшак каражаттарды тандаңыз жана бир нече дүүлүктүрүүчү дарылоолорду катмарлоодон сактаныңыз',
      'Терини кургатпай, зарыл болсо эртең менен жана кечинде тазалаңыз',
      'Тери ачык болгондо күндөн коргонууну колдонуңуз',
      'Таптарды жана тырыктарды чектөө үчүн безеткилерди тытуудан сактаныңыз',
      'Белгилер улана берсе же начарласа, адистен кеңеш сураңыз',
    ],
    section7Body: 'Башкаруу белгилерге, алардын курчтугуна, жашоо сапатына тийгизген таасирине жана ар бир аялдын максаттарына көз каранды. Бирден-бир чечимди издегенден көрө бир нече багытта иштөө пайдалуу болушу мүмкүн.',
    miniCards: [
      {title: 'Тери', text: 'Ылайыктуу тартип жана керек болсо дерматологдун кеңеши.'},
      {title: 'Түк өсүү', text: 'Абалга жараша косметикалык же медициналык чечимдер.'},
      {title: 'Чач', text: 'Дарылоону тандоодон мурун себебин аныктаңыз.'},
      {title: 'Жыргалчылык', text: 'Белгилердин эмоционалдык таасирин эске алыңыз.'},
    ],
    section8Body1: 'Безеткилер улана берип же оорутуучу болгондо, түк өсүү тез көбөйгөндө, чач байкалаарлык сейректегенде же бул өзгөрүүлөр абдан туура эмес циклдер менен кошо болгондо, ден соолук сактоо адиси менен сүйлөшкөн жакшы.',
    section8Body2: 'Дерматолог тери жана чач белгилерин башкара алат. Гинеколог же башка квалификациялуу адис гормондук контекстти жана PCOSтун башка мүмкүн болгон белгилерин да баалай алат.',
    alert2Title: 'Керек болсо дарыгерге барыңыз',
    alert2Text: 'Тез, олуттуу түк өсүү, капыстан чач түшүү же адаттан тыш гормондук өзгөрүүлөр медициналык кеңешти талап кылат.',
    ideasReceived: [
      'Безеткилердин болушу автоматтык түрдө PCOS бар дегенди билдирбейт',
      'Көрүнүүчү түк өсүү жалаң гормондор менен байланышкан болушу шарт эмес',
      'PCOS ар кандай дене түзүлүшүндөгү аялдарга таасир этиши мүмкүн',
      'Белгилер убакыттын өтүшү менен өзгөрүшү мүмкүн жана ар бир аялда бирдей эмес',
    ],
    quoteText: 'PCOSтун көрүнүүчү белгилери капа кылышы мүмкүн, бирок алар сиздин аялдыгыңызды, баалуулугуңузду же гигиенаңызды аныктабайт.',
    summaryTitle: 'Эң негизгиси',
    summaryItems: [
      'PCOS териге, денедеги түккө жана баштагы чачка таасир этиши мүмкүн.',
      'Белгилер аялдан аялга абдан айырмаланат.',
      'Бир белги PCOS диагнозун коюуга жетишсиз.',
      'Белгилерди жакшыртууга жардам берген чечимдер бар.',
      'Медициналык колдоо өзүңүзгө туура ыкманы тандоого жардам бере алат.',
    ],
    finalTipTitle: 'Негизги жыйынтыктар',
    finalTipText: 'Безеткилер, ашыкча түк өсүү же чач түшүү PCOSтун белгилери болушу мүмкүн, бирок алар сөзсүз эмес. Жекелештирилген ыкма белгилерди жакшыраак башкарууга жана күнүмдүк жашоодо өзүңүздү ыңгайлуураак сезүүгө жардам бериши мүмкүн.',
    disclaimerText: 'Бул макала маалымат үчүн гана жазылган жана медициналык консультацияны, диагнозду же жекелештирилген дарылоону алмаштырбайт.',
    shareMessage: 'Тери, чач жана PCOSтун көрүнүүчү белгилери — AWA',
  },
  tk: {
    badge: 'PCOS',
    title: 'Deri, saç we\ngörünýän alamatlar',
    metaDuration: '9 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'PCOS deride, bedendäki tüýlerde ýa-da kelledäki saçda görünýän üýtgeşmelere sebäp bolup biler. Olaryň nireden gelýändigini düşünmek olary tanamagy we haýsy çözgütleriň göz öňünde tutulyp biljekdigini bilmegi aňsatlaşdyrýar.',
    infoBannerText: 'Bu alamatlar umumy, ýöne özbaşyna olar PCOS diagnozy üçin ne hökmany, ne-de ýeterlik.',
    contentsTitle: 'Bu makalada',
    contents: [
      'Bu alamatlar näme üçin peýda bolýar',
      'Gormonal akne',
      'Artykmaç tüý ösüşi',
      'Saçyň inçelmegi',
      'Derä ideg etmek',
      'Saça ideg etmek',
      'Gündelik näme kömek edip biler',
      'Lukmana haçan ýüz tutmaly',
      'Giňden ýaýran ýalňyş düşünjeler',
      'Esasy netijeler',
    ],
    section1Body1: 'PCOS aýallarda hem tebigy ýagdaýda bar bolan gormonlar bolan androgenleriň öndürilişiniň ýa-da işjeňliginiň artmagyny öz içine alyp biler. Olaryň täsiri has aýdyň bolanda, olar ýag mäzlerine, saç follikullaryna we saç ösüş sikline täsir edip biler.',
    section1Body2: 'Bu gormonal täsir dowam edýän aknenyň, artan tüý ösüşiniň ýa-da käbir aýallarda saçyň inçelmeginiň peýda bolmagyny düşündirip biljek zadyň aglaba bölegi.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Görünýän alamatlar PCOS-nyň agyrlygyny hökman görkezmeýär. Bir aýalda birnäçe görünýän alamat bolup biler, beýlekisinde bolsa az ýa-da hiç hili bolmazlygy mümkin.',
    section2Body1: 'Gormonal üýtgeşmeler bilen baglanyşykly akne ýetginjeklik döwründen soň hem peýda bolup ýa-da dowam edip biler. Ol eňege, gabaga, aşaky ýaňaklara ýa-da käwagt boýna täsir etmäge ýykgyn edýär.',
    section2Body2: 'Käbir adamlarda zeperlenmeler çuň, agyryly we gaýtalanýar. Olar çokulanda ýa-da aýratyn ýangyly bolanda pigmentli yzlary ýa-da çyzlary hem galdyryp biler.',
    skinSignsTitle: 'Mümkin deri alamatlary',
    skinSigns: [
      'Dowam edýän akne, aýratyn-da ýüzüň aşaky böleginde',
      'Öňküden has ýagly deri',
      'Käwagt gormonal üýtgeşmelerden soň gelýän akne ýaramazlaşmalary',
      'Ýaramazlaşmalardan soň galan yzlar ýa-da çyzlar',
    ],
    section3Body1: 'Girsutizm aýallarda adatça täsir edilmeýän ýerlerde terminal tüý ösüşiniň artmagyny aňladýar. PCOS kontekstinde ol androgenleriň saç follikullaryna täsiri bilen baglanyşykly bolup biler.',
    section3Body2: 'Iň köp täsir edilýän ýerler eňek, ýokarky dodak, döş, garyn ýa-da arka. Tüý ösüşiniň näçe bolýandygy adamdan adama ep-esli tapawutlanýar.',
    hairSignsTitle: 'Mümkin alamatlar',
    hairSigns: [
      'Ýüzde has görünýän tüý ösüşi',
      'Eňekde ýa-da ýokarky dodakda has gödek tüý',
      'Döşde, garynda ýa-da arkada peýda bolup biljek tüý ösüşi',
      'Kelläniň depesinde saçyň ýuwaş-ýuwaşdan inçelmegi',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Tüý ösüşi genetik we şahsy faktorlara hem bagly. Aýdyň tüý ösüşi PCOS-nyň barlygyny awtomatiki aňlatmaýar.',
    section4Body1: 'PCOS-ly käbir aýallar saç dykyzlygynyň azalmagyny hem görýär. Inçelme kelläniň depesinde ýa-da saç aýrylýan ýerde aýratyn görünüp biler.',
    section4Body2: 'Bu ýuwaş-ýuwaşdan ösüp biler. Gormon bilen baglanyşykly saç dökülmesini ýetmezçilik, galkan şekilli mäz meselesi, käbir dermanlar ýa-da möhüm stres döwri ýaly beýleki mümkin sebäplerden tapawutlandyrmak möhüm.',
    alert1Title: 'Bellemäge mynasyp',
    alert1Text: 'Möhüm, çalt ýa-da adaty däl saç dökülmesi sebäbini derňemek üçin lukmançylyk bahalandyrmasyna mynasyp.',
    section5Body: 'Ýönekeý, yzygiderli tertip adatça köp önümi gatlak-gatlak ulanmakdan has gowy. Maksat derini arassalamak, çyglandyrmak we goramak, gyjyndyrmany saklap biljek zatlary çäklemek.',
    careHabits: [
      'Ýumşak, yzygiderli deri idegi',
      'Gündelik gün goragy',
      'Deňagramly iýmitlenmek',
      'Sabyr: netijeler wagt alýar',
    ],
    section6Body1: 'Saç inçelende, ona gaýtalanýan basyşy çäklemek peýdaly bolup biler: aşa ýylylyk, gaty berk saç duzalyşlary ýa-da ýygy himiki bejergiler.',
    section6Body2: 'Saç dykyzlygy azalmagyny dowam etse, sebäbi kesgitlemek we elýeterli bejergileri maslahatlaşmak üçin dermatologiýa maslahaty peýdaly bolup biler.',
    practicalTitle: 'Amaly maslahatlar',
    practicalTips: [
      'Ýumşak önümleri saýlaň we birnäçe gyjyndyryjy bejergini gatlak-gatlak ulanmakdan gaça duruň',
      'Derini gurakladyp bolmazdan, zerur bolsa irden we agşam arassalaň',
      'Deri açyk bolanda gün goragyny ulanyň',
      'Yzlary we çyzlary çäklemek üçin döremeleri çokmakdan gaça duruň',
      'Alamatlar dowam etse ýa-da erbetleşse, hünärmenden maslahat soraň',
    ],
    section7Body: 'Dolandyryş alamatlara, olaryň güýçlüligine, ýaşaýyş hiline täsirine we her aýalyň maksatlaryna bagly. Ýeke çözgüt gözlemegiň ýerine birnäçe ugurda işlemek peýdaly bolup biler.',
    miniCards: [
      {title: 'Deri', text: 'Laýyk tertip we zerur bolsa dermatologiýa maslahaty.'},
      {title: 'Tüý ösüşi', text: 'Ýagdaýa görä kosmetik ýa-da lukmançylyk çözgütleri.'},
      {title: 'Saç', text: 'Bejergini saýlamazdan öň sebäbi kesgitläň.'},
      {title: 'Abadançylyk', text: 'Alamatlaryň duýgusal täsirini hasaba alyň.'},
    ],
    section8Body1: 'Akne dowamly ýa-da agyryly bolanda, tüý ösüşi çalt artanda, saç aýdyň inçelende ýa-da bu üýtgeşmeler gaty düzgünsiz sikller bilen bile gelende, saglyk hünärmeni bilen gürleşmek gowy pikir.',
    section8Body2: 'Dermatolog deri we saç alamatlaryny dolandyryp biler. Ginekolog ýa-da başga laýyk hünärmen gormonal kontekste we PCOS-nyň beýleki mümkin alamatlaryna hem baha berip biler.',
    alert2Title: 'Zerur bolsa lukmana ýüz tutuň',
    alert2Text: 'Çalt, möhüm tüý ösüşi, ýiti saç dökülmesi ýa-da adaty däl gormonal üýtgeşmeler lukmançylyk maslahatyny talap edýär.',
    ideasReceived: [
      'Akneňiziň bolmagy awtomatiki PCOS-yňyzyň barlygyny aňlatmaýar',
      'Görünýän tüý ösüşi hökman diňe gormonlar bilen baglanyşykly däl',
      'PCOS islendik beden görnüşli aýallara täsir edip biler',
      'Alamatlar wagtyň geçmegi bilen üýtgäp biler we her aýalda şol bir däl',
    ],
    quoteText: 'PCOS-nyň görünýän alamatlary göwnüňizi aljyradyp biler, ýöne olar aýallygyňyzy, gymmatyňyzy ýa-da arassaçylygyňyzy kesgitlemeýär.',
    summaryTitle: 'Esasy zatlar',
    summaryItems: [
      'PCOS deri, bedendäki tüýler we kelledäki saça täsir edip biler.',
      'Alamatlar aýaldan aýala köp tapawutlanýar.',
      'Ýeke alamat PCOS-ny diagnostirlemek üçin ýeterlik däl.',
      'Alamatlary gowulandyrmaga kömek edýän çözgütler bar.',
      'Lukmançylyk goldawy size dogry çemeleşmäni saýlamaga kömek edip biler.',
    ],
    finalTipTitle: 'Esasy netijeler',
    finalTipText: 'Akne, artykmaç tüý ösüşi ýa-da saç dökülmesi PCOS alamatlary bolup biler, ýöne olar gaçyp bolmajak zat däl. Şahsylaşdyrylan çemeleşme alamatlary has gowy dolandyrmaga we gündelik durmuşda özüňizi has rahat duýmaga kömek edip biler.',
    disclaimerText: 'Bu makala diňe maglumat üçin we lukmançylyk maslahatlaşmagyny, diagnozy ýa-da şahsylaşdyrylan bejergini çalyşmaýar.',
    shareMessage: 'Deri, saç we PCOS-nyň görünýän alamatlary — AWA',
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
