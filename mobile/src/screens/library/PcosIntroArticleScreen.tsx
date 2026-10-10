import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
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

const ID = 'pcos-comprendre-sopk';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

// Icons stay language-neutral — only the accompanying TEXT moves into the
// bilingual CONTENT object below, keyed by index to stay aligned with these.
const CONSULT_ICONS = [
  'calendar-alert',
  'face-woman-shimmer',
  'hair-dryer',
  'baby-heart-outline',
  'alert-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK • GUIDE ESSENTIEL',
    title: 'Comprendre\nle SOPK',
    metaDuration: '10 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu éducatif',
    intro:
      'Le syndrome des ovaires polykystiques, souvent appelé SOPK, est un trouble hormonal fréquent qui peut influencer les cycles, l’ovulation, la peau, les cheveux, le métabolisme et parfois la fertilité.',
    introSecondary:
      'Son expression varie beaucoup d’une femme à l’autre. Comprendre le SOPK permet surtout de mieux identifier ses symptômes, de savoir quand demander un avis médical et de suivre son évolution sans culpabiliser.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que le SOPK ?',
      'Pourquoi le SOPK apparaît-il ?',
      'Les principaux signes',
      'Comment le diagnostic est-il posé ?',
      'SOPK et ovulation',
      'SOPK et fertilité',
      'SOPK et poids / métabolisme',
      'Peau, cheveux et pilosité',
      'Comment prendre en charge le SOPK ?',
      'Idées reçues',
      'Quand consulter ?',
      'À retenir',
    ],
    s1Heading: 'Qu’est-ce que le SOPK ?',
    s1Body1:
      'Le syndrome des ovaires polykystiques (SOPK) est un trouble hormonal fréquent qui peut modifier le fonctionnement habituel des ovaires et l’équilibre de certaines hormones.',
    s1Body2:
      'Chez certaines femmes, le principal problème est une ovulation irrégulière. Chez d’autres, ce sont plutôt l’acné, la pilosité, la chute de cheveux ou des manifestations métaboliques qui attirent l’attention.',
    s1TipTitle: 'Bon à savoir',
    s1TipText:
      'Malgré son nom, le SOPK ne signifie pas nécessairement que les ovaires contiennent des « kystes ». Le terme historique peut être trompeur et l’échographie n’est pas à elle seule suffisante pour poser le diagnostic.',
    s2Heading: 'Pourquoi le SOPK apparaît-il ?',
    s2Body1:
      'Il n’existe pas une seule cause du SOPK. Son apparition semble résulter de plusieurs facteurs qui peuvent se combiner : prédisposition familiale, fonctionnement hormonal, ovulation, métabolisme et facteurs individuels.',
    s2Factors: [
      'Prédisposition familiale et facteurs génétiques',
      'Dérèglements de l’ovulation',
      'Excès relatif d’androgènes',
      'Résistance à l’insuline chez certaines femmes',
      'Facteurs métaboliques et environnementaux',
    ],
    s2NeutralText:
      'Le SOPK n’est pas une faute personnelle. Il ne résulte pas simplement d’un manque de volonté, d’une mauvaise alimentation ou d’un manque d’activité physique.',
    s3Heading: 'Les principaux signes',
    s3Body1:
      'Le SOPK peut se manifester de manière très différente. Certaines femmes présentent plusieurs symptômes tandis que d’autres n’en remarquent que très peu.',
    s3Signs: [
      'Des cycles irréguliers, très espacés ou parfois absents',
      'Une ovulation irrégulière ou difficile à prévoir',
      'Une acné persistante, notamment sur le bas du visage',
      'Une pilosité plus importante sur le visage, le torse ou le corps',
      'Une perte de cheveux de type hormonal',
      'Une prise de poids ou des difficultés à perdre du poids',
      'Des difficultés à concevoir',
    ],
    s3AlertTitle: 'Important',
    s3AlertText:
      'La présence d’un de ces symptômes ne signifie pas automatiquement que tu as un SOPK. Plusieurs autres situations peuvent provoquer des symptômes similaires.',
    s4Heading: 'Comment le diagnostic est-il posé ?',
    s4Body1:
      'Le diagnostic du SOPK est médical. Le professionnel de santé commence généralement par discuter des cycles, des symptômes, des antécédents et des traitements éventuels.',
    s4Body2:
      'Selon la situation, des analyses hormonales et une échographie peuvent également être proposées.',
    s4Points: [
      'Cycles irréguliers ou ovulation peu fréquente',
      'Signes d’un excès d’androgènes : acné, pilosité, chute de cheveux ou résultats biologiques',
      'Aspect ovarien compatible avec un SOPK à l’échographie, lorsque cet examen est indiqué',
    ],
    s4Body3:
      'Le médecin doit également rechercher d’autres causes possibles d’irrégularité des cycles ou d’excès d’androgènes avant de retenir un diagnostic de SOPK.',
    s5Heading: 'SOPK et ovulation',
    s5Body1:
      'L’ovulation correspond à la libération d’un ovocyte par l’ovaire. Dans le SOPK, l’ovulation peut être moins fréquente ou plus difficile à prévoir.',
    s5Body2:
      'Cela peut expliquer pourquoi les cycles sont parfois longs, irréguliers ou difficiles à anticiper.',
    s5HighlightTitle: 'Suivre son cycle',
    s5HighlightText:
      'Noter les dates des règles, les symptômes et les éventuels signes d’ovulation peut aider à mieux comprendre son propre fonctionnement.',
    s6Heading: 'SOPK et fertilité',
    s6Body1:
      'Comme l’ovulation peut être irrégulière, certaines femmes ayant un SOPK peuvent rencontrer plus de difficultés à concevoir.',
    s6Body2:
      'Cela ne signifie cependant pas que le SOPK empêche automatiquement une grossesse. De nombreuses femmes ayant un SOPK conçoivent naturellement ou avec un accompagnement médical adapté.',
    s6TipTitle: 'À retenir',
    s6TipText:
      'Difficultés à concevoir ne signifie pas impossibilité de concevoir. Si une grossesse est souhaitée, un médecin ou une sage-femme peut proposer une stratégie adaptée à la situation.',
    s7Heading: 'SOPK et poids / métabolisme',
    s7Body1:
      'Le SOPK peut être associé à des modifications du métabolisme, notamment chez certaines femmes une résistance à l’insuline.',
    s7Body2:
      'Cependant, le poids ne permet pas à lui seul de diagnostiquer ou d’exclure un SOPK. Une femme mince peut avoir un SOPK, tout comme une femme en surpoids peut ne pas en avoir.',
    s7NeutralText:
      'Le suivi doit prendre en compte la santé globale et pas uniquement le chiffre affiché sur la balance.',
    s8Heading: 'Peau, cheveux et pilosité',
    s8Body1:
      'Un excès relatif d’androgènes peut influencer les glandes sébacées et les follicules pileux.',
    s8Body2:
      'Cela peut se traduire par une acné persistante, une pilosité plus importante ou une perte de cheveux selon les femmes.',
    s8Items: [
      'Acné hormonale',
      'Pilosité faciale ou corporelle plus importante',
      'Cheveux plus fins ou chute de cheveux',
    ],
    s9Heading: 'Comment prendre en charge le SOPK ?',
    s9Body1:
      'Il n’existe pas une seule prise en charge valable pour toutes les femmes. Le choix dépend des symptômes, des objectifs et de la situation médicale.',
    s9Body2:
      'L’objectif peut être différent selon les périodes de la vie : régulariser les cycles, améliorer certains symptômes, protéger la santé métabolique ou accompagner un projet de grossesse.',
    s9MiniTitle: 'Habitudes favorables à la santé',
    s9Lifestyle: [
      'Avoir une alimentation variée et régulière, adaptée à ses besoins',
      'Pratiquer une activité physique régulière que l’on peut maintenir dans le temps',
      'Veiller à un sommeil suffisamment régulier',
      'Suivre l’évolution des cycles et des symptômes',
      'Ne pas culpabiliser en cas de variation de poids ou de symptômes',
    ],
    s9Body3:
      'Selon les besoins, un professionnel de santé peut également proposer des traitements pour certains symptômes ou pour accompagner un projet de grossesse.',
    s9AlertTitle: 'Pas d’automédication',
    s9AlertText:
      'Les traitements hormonaux, les médicaments métaboliques et les compléments alimentaires doivent être discutés avec un professionnel de santé.',
    s10Heading: 'Idées reçues sur le SOPK',
    s10Myths: [
      'Le SOPK signifie forcément « avoir des kystes » : le nom peut être trompeur. Le diagnostic ne repose pas uniquement sur la présence de kystes.',
      'Toutes les femmes ayant un SOPK sont en surpoids : le SOPK peut concerner des femmes de toutes corpulences.',
      'Le SOPK empêche forcément une grossesse : l’ovulation peut être irrégulière, mais une grossesse reste possible.',
      'Un seul symptôme suffit pour diagnostiquer un SOPK : le diagnostic nécessite une évaluation globale.',
      'Le SOPK disparaît simplement avec l’âge : son expression peut évoluer au cours de la vie, mais le suivi reste important.',
    ],
    s11Heading: 'Quand consulter ?',
    s11Body1:
      'Un avis médical est particulièrement pertinent lorsque les cycles deviennent très irréguliers, disparaissent pendant plusieurs mois, ou lorsqu’apparaissent des symptômes inhabituels.',
    s11ConsultItems: [
      'Cycles très irréguliers ou absents',
      'Acné ou pilosité inhabituelle',
      'Chute de cheveux importante',
      'Difficultés à concevoir',
      'Symptômes qui évoluent rapidement',
    ],
    s12Heading: 'À retenir',
    s12SummaryTitle: 'Les points essentiels',
    s12SummaryItems: [
      'Le SOPK est un trouble hormonal fréquent.',
      'Il peut se manifester de nombreuses façons.',
      'Toutes les femmes ayant un SOPK ne présentent pas les mêmes symptômes.',
      'Le poids ne suffit pas à diagnostiquer ou exclure un SOPK.',
      'Le diagnostic nécessite une évaluation médicale globale.',
      'Le SOPK peut influencer l’ovulation et parfois la fertilité.',
      'Une prise en charge personnalisée permet de répondre aux besoins de chaque femme.',
    ],
    finalNoteTitle: 'Un guide pour mieux comprendre',
    finalNoteText:
      'Cet article est destiné à l’information générale et ne remplace pas une consultation médicale. Chaque situation est différente : en cas de doute ou de symptômes persistants, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre le SOPK — AWA',
  },
  en: {
    badge: 'PCOS • ESSENTIAL GUIDE',
    title: 'Understanding\nPCOS',
    metaDuration: '10 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Educational content',
    intro:
      'Polycystic ovary syndrome, often called PCOS, is a common hormonal condition that can affect your cycles, ovulation, skin, hair, metabolism, and sometimes fertility.',
    introSecondary:
      'How it shows up varies a lot from one woman to another. Understanding PCOS mainly helps you recognize its symptoms, know when to seek medical advice, and track how it evolves without self-blame.',
    contentsTitle: 'In this article',
    topics: [
      'What is PCOS?',
      'Why does PCOS happen?',
      'The main signs',
      'How is it diagnosed?',
      'PCOS and ovulation',
      'PCOS and fertility',
      'PCOS and weight / metabolism',
      'Skin, hair, and body hair',
      'How is PCOS managed?',
      'Common misconceptions',
      'When to see a doctor',
      'Key takeaways',
    ],
    s1Heading: 'What is PCOS?',
    s1Body1:
      'Polycystic ovary syndrome (PCOS) is a common hormonal condition that can change the ovaries’ usual functioning and the balance of certain hormones.',
    s1Body2:
      'For some women, the main issue is irregular ovulation. For others, it’s acne, excess hair growth, hair loss, or metabolic signs that stand out first.',
    s1TipTitle: 'Good to know',
    s1TipText:
      'Despite its name, PCOS doesn’t necessarily mean the ovaries contain “cysts.” The historical term can be misleading, and an ultrasound alone isn’t enough to make the diagnosis.',
    s2Heading: 'Why does PCOS happen?',
    s2Body1:
      'There isn’t a single cause of PCOS. It appears to result from several factors that can combine: family predisposition, hormonal functioning, ovulation, metabolism, and individual factors.',
    s2Factors: [
      'Family predisposition and genetic factors',
      'Disruptions in ovulation',
      'Relative androgen excess',
      'Insulin resistance in some women',
      'Metabolic and environmental factors',
    ],
    s2NeutralText:
      'PCOS is not a personal failing. It doesn’t simply result from a lack of willpower, poor diet, or insufficient physical activity.',
    s3Heading: 'The main signs',
    s3Body1:
      'PCOS can show up very differently from one woman to another. Some have several symptoms, while others notice very few.',
    s3Signs: [
      'Irregular, widely spaced, or sometimes absent cycles',
      'Irregular or hard-to-predict ovulation',
      'Persistent acne, particularly on the lower face',
      'Increased hair growth on the face, chest, or body',
      'Hormonal-pattern hair loss',
      'Weight gain or difficulty losing weight',
      'Difficulty conceiving',
    ],
    s3AlertTitle: 'Important',
    s3AlertText:
      'Having one of these symptoms doesn’t automatically mean you have PCOS. Several other conditions can cause similar symptoms.',
    s4Heading: 'How is it diagnosed?',
    s4Body1:
      'Diagnosing PCOS is a medical process. A healthcare provider usually starts by discussing your cycles, symptoms, medical history, and any treatments you’re taking.',
    s4Body2:
      'Depending on the situation, hormonal blood tests and an ultrasound may also be offered.',
    s4Points: [
      'Irregular cycles or infrequent ovulation',
      'Signs of androgen excess: acne, excess hair growth, hair loss, or blood test results',
      'Ovarian appearance consistent with PCOS on ultrasound, when this exam is indicated',
    ],
    s4Body3:
      'The doctor must also rule out other possible causes of irregular cycles or androgen excess before confirming a PCOS diagnosis.',
    s5Heading: 'PCOS and ovulation',
    s5Body1:
      'Ovulation is the release of an egg (oocyte) from the ovary. In PCOS, ovulation can be less frequent or harder to predict.',
    s5Body2:
      'This can explain why cycles are sometimes long, irregular, or hard to anticipate.',
    s5HighlightTitle: 'Tracking your cycle',
    s5HighlightText:
      'Recording your period dates, symptoms, and any signs of ovulation can help you better understand your own patterns.',
    s6Heading: 'PCOS and fertility',
    s6Body1:
      'Because ovulation can be irregular, some women with PCOS may have more difficulty conceiving.',
    s6Body2:
      'This doesn’t mean, however, that PCOS automatically prevents pregnancy. Many women with PCOS conceive naturally or with appropriate medical support.',
    s6TipTitle: 'Keep in mind',
    s6TipText:
      'Difficulty conceiving doesn’t mean it’s impossible. If you’re hoping to become pregnant, a doctor or midwife can suggest a strategy suited to your situation.',
    s7Heading: 'PCOS and weight / metabolism',
    s7Body1:
      'PCOS can be associated with metabolic changes, including insulin resistance in some women.',
    s7Body2:
      'However, weight alone cannot diagnose or rule out PCOS. A slim woman can have PCOS, just as a woman who is overweight may not have it.',
    s7NeutralText:
      'Follow-up care should consider overall health, not just the number on the scale.',
    s8Heading: 'Skin, hair, and body hair',
    s8Body1:
      'Relative androgen excess can affect the sebaceous glands and hair follicles.',
    s8Body2:
      'Depending on the woman, this can show up as persistent acne, increased hair growth, or hair loss.',
    s8Items: [
      'Hormonal acne',
      'Increased facial or body hair',
      'Thinning hair or hair loss',
    ],
    s9Heading: 'How is PCOS managed?',
    s9Body1:
      'There is no single approach to managing PCOS that works for every woman. The choice depends on symptoms, goals, and medical circumstances.',
    s9Body2:
      'The goal can differ depending on the stage of life: regulating cycles, improving certain symptoms, protecting metabolic health, or supporting a pregnancy plan.',
    s9MiniTitle: 'Health-supporting habits',
    s9Lifestyle: [
      'Eating a varied, regular diet suited to your needs',
      'Engaging in regular physical activity that you can sustain over time',
      'Maintaining sufficiently regular sleep',
      'Tracking how your cycles and symptoms change over time',
      'Not blaming yourself for changes in weight or symptoms',
    ],
    s9Body3:
      'Depending on your needs, a healthcare provider may also offer treatments for certain symptoms or to support a pregnancy plan.',
    s9AlertTitle: 'Don’t self-medicate',
    s9AlertText:
      'Hormonal treatments, metabolic medications, and dietary supplements should all be discussed with a healthcare provider.',
    s10Heading: 'Common misconceptions about PCOS',
    s10Myths: [
      'PCOS always means having “cysts”: the name can be misleading. The diagnosis doesn’t rely solely on the presence of cysts.',
      'All women with PCOS are overweight: PCOS can affect women of all body types.',
      'PCOS always prevents pregnancy: ovulation may be irregular, but pregnancy is still possible.',
      'A single symptom is enough to diagnose PCOS: diagnosis requires a comprehensive evaluation.',
      'PCOS simply goes away with age: how it presents can change over a lifetime, but ongoing follow-up remains important.',
    ],
    s11Heading: 'When to see a doctor',
    s11Body1:
      'Medical advice is particularly worthwhile when cycles become very irregular, stop for several months, or when unusual symptoms appear.',
    s11ConsultItems: [
      'Very irregular or absent cycles',
      'Unusual acne or hair growth',
      'Significant hair loss',
      'Difficulty conceiving',
      'Rapidly changing symptoms',
    ],
    s12Heading: 'Key takeaways',
    s12SummaryTitle: 'The essential points',
    s12SummaryItems: [
      'PCOS is a common hormonal condition.',
      'It can show up in many different ways.',
      'Not all women with PCOS have the same symptoms.',
      'Weight alone is not enough to diagnose or rule out PCOS.',
      'Diagnosis requires a comprehensive medical evaluation.',
      'PCOS can affect ovulation and sometimes fertility.',
      'A personalized care approach helps meet each woman’s needs.',
    ],
    finalNoteTitle: 'A guide to better understanding',
    finalNoteText:
      'This article is intended for general information and does not replace a medical consultation. Every situation is different: if in doubt or if symptoms persist, seek advice from a healthcare professional.',
    shareMessage: 'Understanding PCOS — AWA',
  },
  es: {
    badge: 'SOP • GUÍA ESENCIAL',
    title: 'Comprender\nel SOP',
    metaDuration: '10 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido educativo',
    intro:
      'El síndrome de ovario poliquístico, a menudo llamado SOP, es un trastorno hormonal frecuente que puede influir en tus ciclos, la ovulación, la piel, el cabello, el metabolismo y, a veces, la fertilidad.',
    introSecondary:
      'Su manifestación varía mucho de una mujer a otra. Comprender el SOP te permite sobre todo identificar mejor sus síntomas, saber cuándo pedir una opinión médica y seguir su evolución sin culpabilizarte.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es el SOP?',
      '¿Por qué aparece el SOP?',
      'Los principales signos',
      '¿Cómo se establece el diagnóstico?',
      'SOP y ovulación',
      'SOP y fertilidad',
      'SOP y peso / metabolismo',
      'Piel, cabello y vello',
      '¿Cómo se maneja el SOP?',
      'Ideas falsas',
      '¿Cuándo consultar?',
      'Para recordar',
    ],
    s1Heading: '¿Qué es el SOP?',
    s1Body1:
      'El síndrome de ovario poliquístico (SOP) es un trastorno hormonal frecuente que puede modificar el funcionamiento habitual de los ovarios y el equilibrio de ciertas hormonas.',
    s1Body2:
      'En algunas mujeres, el principal problema es una ovulación irregular. En otras, es más bien el acné, el vello, la caída de cabello o manifestaciones metabólicas lo que llama la atención.',
    s1TipTitle: 'Dato útil',
    s1TipText:
      'A pesar de su nombre, el SOP no significa necesariamente que los ovarios contengan «quistes». El término histórico puede resultar engañoso y la ecografía por sí sola no es suficiente para establecer el diagnóstico.',
    s2Heading: '¿Por qué aparece el SOP?',
    s2Body1:
      'No existe una única causa del SOP. Su aparición parece resultar de varios factores que pueden combinarse: predisposición familiar, funcionamiento hormonal, ovulación, metabolismo y factores individuales.',
    s2Factors: [
      'Predisposición familiar y factores genéticos',
      'Alteraciones de la ovulación',
      'Exceso relativo de andrógenos',
      'Resistencia a la insulina en algunas mujeres',
      'Factores metabólicos y ambientales',
    ],
    s2NeutralText:
      'El SOP no es una culpa personal. No resulta simplemente de una falta de voluntad, una mala alimentación o una falta de actividad física.',
    s3Heading: 'Los principales signos',
    s3Body1:
      'El SOP puede manifestarse de forma muy diferente. Algunas mujeres presentan varios síntomas mientras que otras apenas notan alguno.',
    s3Signs: [
      'Ciclos irregulares, muy espaciados o a veces ausentes',
      'Una ovulación irregular o difícil de prever',
      'Un acné persistente, especialmente en la parte baja del rostro',
      'Un vello más abundante en el rostro, el torso o el cuerpo',
      'Una caída de cabello de tipo hormonal',
      'Un aumento de peso o dificultades para perderlo',
      'Dificultades para concebir',
    ],
    s3AlertTitle: 'Importante',
    s3AlertText:
      'La presencia de uno de estos síntomas no significa automáticamente que tengas SOP. Varias otras situaciones pueden provocar síntomas similares.',
    s4Heading: '¿Cómo se establece el diagnóstico?',
    s4Body1:
      'El diagnóstico del SOP es médico. El profesional de salud suele comenzar hablando de los ciclos, los síntomas, los antecedentes y los posibles tratamientos.',
    s4Body2:
      'Según la situación, también pueden proponerse análisis hormonales y una ecografía.',
    s4Points: [
      'Ciclos irregulares u ovulación poco frecuente',
      'Signos de un exceso de andrógenos: acné, vello, caída de cabello o resultados analíticos',
      'Aspecto ovárico compatible con un SOP en la ecografía, cuando este examen está indicado',
    ],
    s4Body3:
      'El médico también debe descartar otras posibles causas de irregularidad de los ciclos o de exceso de andrógenos antes de confirmar un diagnóstico de SOP.',
    s5Heading: 'SOP y ovulación',
    s5Body1:
      'La ovulación corresponde a la liberación de un ovocito por el ovario. En el SOP, la ovulación puede ser menos frecuente o más difícil de prever.',
    s5Body2:
      'Esto puede explicar por qué los ciclos a veces son largos, irregulares o difíciles de anticipar.',
    s5HighlightTitle: 'Seguir tu ciclo',
    s5HighlightText:
      'Anotar las fechas de la regla, los síntomas y los posibles signos de ovulación puede ayudarte a comprender mejor tu propio funcionamiento.',
    s6Heading: 'SOP y fertilidad',
    s6Body1:
      'Como la ovulación puede ser irregular, algunas mujeres con SOP pueden tener más dificultades para concebir.',
    s6Body2:
      'Sin embargo, esto no significa que el SOP impida automáticamente un embarazo. Muchas mujeres con SOP conciben de forma natural o con un acompañamiento médico adecuado.',
    s6TipTitle: 'Para recordar',
    s6TipText:
      'Tener dificultades para concebir no significa que sea imposible. Si deseas un embarazo, un médico o una matrona puede proponerte una estrategia adaptada a tu situación.',
    s7Heading: 'SOP y peso / metabolismo',
    s7Body1:
      'El SOP puede estar asociado con modificaciones del metabolismo, entre ellas una resistencia a la insulina en algunas mujeres.',
    s7Body2:
      'Sin embargo, el peso por sí solo no permite diagnosticar ni descartar un SOP. Una mujer delgada puede tener SOP, al igual que una mujer con sobrepeso puede no tenerlo.',
    s7NeutralText:
      'El seguimiento debe tener en cuenta la salud global y no únicamente la cifra que marca la báscula.',
    s8Heading: 'Piel, cabello y vello',
    s8Body1:
      'Un exceso relativo de andrógenos puede influir en las glándulas sebáceas y los folículos pilosos.',
    s8Body2:
      'Esto puede traducirse en un acné persistente, un vello más abundante o una caída de cabello, según la mujer.',
    s8Items: [
      'Acné hormonal',
      'Vello facial o corporal más abundante',
      'Cabello más fino o caída de cabello',
    ],
    s9Heading: '¿Cómo se maneja el SOP?',
    s9Body1:
      'No existe un único manejo válido para todas las mujeres. La elección depende de los síntomas, los objetivos y la situación médica.',
    s9Body2:
      'El objetivo puede ser diferente según las etapas de la vida: regularizar los ciclos, mejorar ciertos síntomas, proteger la salud metabólica o acompañar un proyecto de embarazo.',
    s9MiniTitle: 'Hábitos favorables para la salud',
    s9Lifestyle: [
      'Llevar una alimentación variada y regular, adaptada a tus necesidades',
      'Practicar una actividad física regular que puedas mantener en el tiempo',
      'Cuidar un sueño suficientemente regular',
      'Seguir la evolución de los ciclos y los síntomas',
      'No culpabilizarte en caso de variación de peso o de síntomas',
    ],
    s9Body3:
      'Según las necesidades, un profesional de salud también puede proponer tratamientos para ciertos síntomas o para acompañar un proyecto de embarazo.',
    s9AlertTitle: 'Sin automedicación',
    s9AlertText:
      'Los tratamientos hormonales, los medicamentos metabólicos y los complementos alimenticios deben hablarse con un profesional de salud.',
    s10Heading: 'Ideas falsas sobre el SOP',
    s10Myths: [
      'El SOP significa forzosamente «tener quistes»: el nombre puede resultar engañoso. El diagnóstico no se basa únicamente en la presencia de quistes.',
      'Todas las mujeres con SOP tienen sobrepeso: el SOP puede afectar a mujeres de todas las complexiones.',
      'El SOP impide forzosamente un embarazo: la ovulación puede ser irregular, pero un embarazo sigue siendo posible.',
      'Un solo síntoma basta para diagnosticar un SOP: el diagnóstico requiere una evaluación global.',
      'El SOP simplemente desaparece con la edad: su manifestación puede evolucionar a lo largo de la vida, pero el seguimiento sigue siendo importante.',
    ],
    s11Heading: '¿Cuándo consultar?',
    s11Body1:
      'Una opinión médica es especialmente pertinente cuando los ciclos se vuelven muy irregulares, desaparecen durante varios meses, o cuando aparecen síntomas inusuales.',
    s11ConsultItems: [
      'Ciclos muy irregulares o ausentes',
      'Acné o vello inusual',
      'Caída de cabello importante',
      'Dificultades para concebir',
      'Síntomas que evolucionan rápidamente',
    ],
    s12Heading: 'Para recordar',
    s12SummaryTitle: 'Los puntos esenciales',
    s12SummaryItems: [
      'El SOP es un trastorno hormonal frecuente.',
      'Puede manifestarse de muchas formas.',
      'No todas las mujeres con SOP presentan los mismos síntomas.',
      'El peso no basta para diagnosticar o descartar un SOP.',
      'El diagnóstico requiere una evaluación médica global.',
      'El SOP puede influir en la ovulación y, a veces, en la fertilidad.',
      'Un manejo personalizado permite responder a las necesidades de cada mujer.',
    ],
    finalNoteTitle: 'Una guía para comprender mejor',
    finalNoteText:
      'Este artículo tiene fines de información general y no sustituye una consulta médica. Cada situación es diferente: en caso de duda o de síntomas persistentes, pide consejo a un profesional de salud.',
    shareMessage: 'Comprender el SOP — AWA',
  },
  it: {
    badge: 'PCOS • GUIDA ESSENZIALE',
    title: 'Capire\nla PCOS',
    metaDuration: '10 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto educativo',
    intro: 'La sindrome dell’ovaio policistico, spesso chiamata PCOS, è una condizione ormonale diffusa che può influire sui tuoi cicli, sull’ovulazione, sulla pelle, sui capelli, sul metabolismo e, a volte, sulla fertilità.',
    introSecondary: 'Il modo in cui si manifesta varia molto da una donna all’altra. Capire la PCOS serve soprattutto a riconoscerne i sintomi, a sapere quando chiedere un parere medico e a seguirne l’evoluzione senza sentirti in colpa.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è la PCOS?',
      'Perché si verifica la PCOS?',
      'I segni principali',
      'Come si diagnostica?',
      'PCOS e ovulazione',
      'PCOS e fertilità',
      'PCOS e peso / metabolismo',
      'Pelle, capelli e peli',
      'Come si gestisce la PCOS?',
      'Idee sbagliate comuni',
      'Quando rivolgersi al medico',
      'Punti chiave',
    ],
    s1Heading: 'Che cos’è la PCOS?',
    s1Body1: 'La sindrome dell’ovaio policistico (PCOS) è una condizione ormonale diffusa che può modificare il normale funzionamento delle ovaie e l’equilibrio di alcuni ormoni.',
    s1Body2: 'Per alcune donne il problema principale è l’ovulazione irregolare. Per altre, a emergere per prima sono l’acne, la crescita eccessiva di peli, la perdita di capelli o segni metabolici.',
    s1TipTitle: 'Da sapere',
    s1TipText: 'Nonostante il nome, la PCOS non significa necessariamente che le ovaie contengano «cisti». Il termine storico può essere fuorviante e la sola ecografia non basta per fare la diagnosi.',
    s2Heading: 'Perché si verifica la PCOS?',
    s2Body1: 'Non esiste una causa unica della PCOS. Sembra derivare da più fattori che possono combinarsi: predisposizione familiare, funzionamento ormonale, ovulazione, metabolismo e fattori individuali.',
    s2Factors: [
      'Predisposizione familiare e fattori genetici',
      'Alterazioni dell’ovulazione',
      'Eccesso relativo di androgeni',
      'Insulino-resistenza in alcune donne',
      'Fattori metabolici e ambientali',
    ],
    s2NeutralText: 'La PCOS non è una colpa personale. Non dipende semplicemente da mancanza di forza di volontà, da un’alimentazione scorretta o da un’attività fisica insufficiente.',
    s3Heading: 'I segni principali',
    s3Body1: 'La PCOS può manifestarsi in modi molto diversi da una donna all’altra. Alcune hanno diversi sintomi, altre ne notano pochissimi.',
    s3Signs: [
      'Cicli irregolari, molto distanziati o a volte assenti',
      'Ovulazione irregolare o difficile da prevedere',
      'Acne persistente, in particolare nella parte bassa del viso',
      'Aumento della crescita di peli sul viso, sul petto o sul corpo',
      'Perdita di capelli di tipo ormonale',
      'Aumento di peso o difficoltà a perdere peso',
      'Difficoltà a concepire',
    ],
    s3AlertTitle: 'Importante',
    s3AlertText: 'Avere uno di questi sintomi non significa automaticamente avere la PCOS. Diverse altre condizioni possono causare sintomi simili.',
    s4Heading: 'Come si diagnostica?',
    s4Body1: 'La diagnosi di PCOS è un percorso medico. Di solito un operatore sanitario parte dal confronto sui tuoi cicli, sui sintomi, sulla tua storia clinica e sulle eventuali terapie che stai seguendo.',
    s4Body2: 'A seconda della situazione, possono essere proposti anche esami del sangue ormonali e un’ecografia.',
    s4Points: [
      'Cicli irregolari o ovulazione poco frequente',
      'Segni di eccesso di androgeni: acne, crescita eccessiva di peli, perdita di capelli o risultati degli esami del sangue',
      'Aspetto delle ovaie compatibile con la PCOS all’ecografia, quando questo esame è indicato',
    ],
    s4Body3: 'Prima di confermare la diagnosi di PCOS, il medico deve anche escludere altre possibili cause di cicli irregolari o di eccesso di androgeni.',
    s5Heading: 'PCOS e ovulazione',
    s5Body1: 'L’ovulazione è il rilascio di un ovulo (ovocita) dall’ovaia. Nella PCOS l’ovulazione può essere meno frequente o più difficile da prevedere.',
    s5Body2: 'Questo può spiegare perché i cicli a volte sono lunghi, irregolari o difficili da anticipare.',
    s5HighlightTitle: 'Monitorare il tuo ciclo',
    s5HighlightText: 'Annotare le date delle mestruazioni, i sintomi e gli eventuali segni di ovulazione può aiutarti a comprendere meglio i tuoi schemi personali.',
    s6Heading: 'PCOS e fertilità',
    s6Body1: 'Poiché l’ovulazione può essere irregolare, alcune donne con PCOS possono avere più difficoltà a concepire.',
    s6Body2: 'Questo non significa però che la PCOS impedisca automaticamente una gravidanza. Molte donne con PCOS concepiscono in modo naturale o con un adeguato supporto medico.',
    s6TipTitle: 'Tienilo a mente',
    s6TipText: 'Avere difficoltà a concepire non significa che sia impossibile. Se speri di restare incinta, un medico o un’ostetrica può proporti una strategia adatta alla tua situazione.',
    s7Heading: 'PCOS e peso / metabolismo',
    s7Body1: 'La PCOS può essere associata a cambiamenti metabolici, tra cui l’insulino-resistenza in alcune donne.',
    s7Body2: 'Tuttavia, il peso da solo non basta per diagnosticare o escludere la PCOS. Una donna magra può avere la PCOS, così come una donna in sovrappeso può non averla.',
    s7NeutralText: 'Il follow-up dovrebbe tenere conto della salute complessiva, non solo del numero sulla bilancia.',
    s8Heading: 'Pelle, capelli e peli',
    s8Body1: 'L’eccesso relativo di androgeni può influire sulle ghiandole sebacee e sui follicoli piliferi.',
    s8Body2: 'A seconda della donna, può manifestarsi con acne persistente, aumento della crescita di peli o perdita di capelli.',
    s8Items: [
      'Acne ormonale',
      'Aumento dei peli sul viso o sul corpo',
      'Capelli diradati o perdita di capelli',
    ],
    s9Heading: 'Come si gestisce la PCOS?',
    s9Body1: 'Non esiste un unico approccio alla gestione della PCOS che funzioni per ogni donna. La scelta dipende dai sintomi, dagli obiettivi e dalle circostanze mediche.',
    s9Body2: 'L’obiettivo può cambiare a seconda della fase della vita: regolarizzare i cicli, migliorare alcuni sintomi, proteggere la salute metabolica o sostenere un progetto di gravidanza.',
    s9MiniTitle: 'Abitudini che sostengono la salute',
    s9Lifestyle: [
      'Seguire un’alimentazione varia e regolare, adatta alle tue esigenze',
      'Praticare un’attività fisica regolare che riesci a mantenere nel tempo',
      'Mantenere un sonno sufficientemente regolare',
      'Monitorare come cambiano nel tempo i tuoi cicli e i tuoi sintomi',
      'Non darti la colpa per le variazioni di peso o dei sintomi',
    ],
    s9Body3: 'A seconda delle tue esigenze, un operatore sanitario può anche proporre trattamenti per alcuni sintomi o per sostenere un progetto di gravidanza.',
    s9AlertTitle: 'Niente automedicazione',
    s9AlertText: 'Le terapie ormonali, i farmaci metabolici e gli integratori alimentari vanno tutti discussi con un operatore sanitario.',
    s10Heading: 'Idee sbagliate comuni sulla PCOS',
    s10Myths: [
      'La PCOS significa sempre avere «cisti»: il nome può essere fuorviante. La diagnosi non si basa solo sulla presenza di cisti.',
      'Tutte le donne con PCOS sono in sovrappeso: la PCOS può riguardare donne di qualsiasi corporatura.',
      'La PCOS impedisce sempre la gravidanza: l’ovulazione può essere irregolare, ma una gravidanza resta possibile.',
      'Basta un solo sintomo per diagnosticare la PCOS: la diagnosi richiede una valutazione completa.',
      'La PCOS passa semplicemente con l’età: il modo in cui si presenta può cambiare nel corso della vita, ma un follow-up continuo resta importante.',
    ],
    s11Heading: 'Quando rivolgersi al medico',
    s11Body1: 'Chiedere un parere medico è particolarmente utile quando i cicli diventano molto irregolari, si interrompono per diversi mesi o compaiono sintomi insoliti.',
    s11ConsultItems: [
      'Cicli molto irregolari o assenti',
      'Acne o crescita di peli insolite',
      'Perdita di capelli significativa',
      'Difficoltà a concepire',
      'Sintomi che cambiano rapidamente',
    ],
    s12Heading: 'Punti chiave',
    s12SummaryTitle: 'Gli elementi essenziali',
    s12SummaryItems: [
      'La PCOS è una condizione ormonale diffusa.',
      'Può manifestarsi in molti modi diversi.',
      'Non tutte le donne con PCOS hanno gli stessi sintomi.',
      'Il peso da solo non basta per diagnosticare o escludere la PCOS.',
      'La diagnosi richiede una valutazione medica completa.',
      'La PCOS può influire sull’ovulazione e, a volte, sulla fertilità.',
      'Un approccio di cura personalizzato aiuta a rispondere alle esigenze di ogni donna.',
    ],
    finalNoteTitle: 'Una guida per capire meglio',
    finalNoteText: 'Questo articolo ha uno scopo informativo generale e non sostituisce una visita medica. Ogni situazione è diversa: in caso di dubbi o se i sintomi persistono, chiedi consiglio a un professionista sanitario.',
    shareMessage: 'Capire la PCOS — AWA',
  },
  tr: {
    badge: 'PKOS • TEMEL REHBER',
    title: 'PKOS’u\nanlamak',
    metaDuration: '10 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Eğitici içerik',
    intro: 'Çoğunlukla PKOS olarak adlandırılan polikistik over sendromu; döngülerini, yumurtlamanı, cildini, saçını, metabolizmanı ve bazen doğurganlığını etkileyebilen yaygın bir hormonal durumdur.',
    introSecondary: 'Kendini göstermesi kadından kadına çok değişir. PKOS’u anlamak, esas olarak belirtilerini tanımana, ne zaman tıbbi destek alman gerektiğini bilmene ve kendini suçlamadan gidişatını takip etmene yardımcı olur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'PKOS nedir?',
      'PKOS neden olur?',
      'Başlıca belirtiler',
      'Nasıl teşhis edilir?',
      'PKOS ve yumurtlama',
      'PKOS ve doğurganlık',
      'PKOS ve kilo / metabolizma',
      'Cilt, saç ve vücut tüyleri',
      'PKOS nasıl yönetilir?',
      'Yaygın yanlış inanışlar',
      'Ne zaman doktora gitmeli',
      'Öne çıkan noktalar',
    ],
    s1Heading: 'PKOS nedir?',
    s1Body1: 'Polikistik over sendromu (PKOS), yumurtalıkların olağan işleyişini ve bazı hormonların dengesini değiştirebilen yaygın bir hormonal durumdur.',
    s1Body2: 'Bazı kadınlarda temel sorun düzensiz yumurtlamadır. Bazılarında ise önce akne, aşırı tüylenme, saç dökülmesi ya da metabolik belirtiler öne çıkar.',
    s1TipTitle: 'Bilmekte fayda var',
    s1TipText: 'Adına rağmen PKOS, yumurtalıklarda mutlaka “kist” bulunduğu anlamına gelmez. Tarihsel terim yanıltıcı olabilir ve tanı koymak için tek başına ultrason yeterli değildir.',
    s2Heading: 'PKOS neden olur?',
    s2Body1: 'PKOS’un tek bir nedeni yoktur. Birbiriyle birleşebilen çeşitli etkenlerin sonucu olarak ortaya çıktığı görülür: ailesel yatkınlık, hormonal işleyiş, yumurtlama, metabolizma ve bireysel etkenler.',
    s2Factors: [
      'Ailesel yatkınlık ve genetik etkenler',
      'Yumurtlamadaki aksamalar',
      'Göreceli androjen fazlalığı',
      'Bazı kadınlarda insülin direnci',
      'Metabolik ve çevresel etkenler',
    ],
    s2NeutralText: 'PKOS kişisel bir kusur değildir. Basitçe irade eksikliğinden, kötü beslenmeden ya da yetersiz fiziksel aktiviteden kaynaklanmaz.',
    s3Heading: 'Başlıca belirtiler',
    s3Body1: 'PKOS kadından kadına çok farklı şekillerde ortaya çıkabilir. Bazılarında birkaç belirti görülürken, bazıları çok azını fark eder.',
    s3Signs: [
      'Düzensiz, aralıkları açık ya da bazen hiç gelmeyen döngüler',
      'Düzensiz veya öngörmesi zor yumurtlama',
      'Özellikle yüzün alt kısmında kalıcı akne',
      'Yüzde, göğüste veya vücutta artmış tüylenme',
      'Hormonal tipte saç dökülmesi',
      'Kilo alma ya da kilo vermede güçlük',
      'Hamile kalmada güçlük',
    ],
    s3AlertTitle: 'Önemli',
    s3AlertText: 'Bu belirtilerden birine sahip olmak otomatik olarak PKOS’un olduğu anlamına gelmez. Başka birçok durum benzer belirtilere yol açabilir.',
    s4Heading: 'Nasıl teşhis edilir?',
    s4Body1: 'PKOS tanısı tıbbi bir süreçtir. Bir sağlık uzmanı genellikle döngülerini, belirtilerini, tıbbi geçmişini ve kullandığın tedavileri konuşarak başlar.',
    s4Body2: 'Duruma göre hormonal kan testleri ve ultrason da önerilebilir.',
    s4Points: [
      'Düzensiz döngüler veya seyrek yumurtlama',
      'Androjen fazlalığı belirtileri: akne, aşırı tüylenme, saç dökülmesi veya kan tahlili sonuçları',
      'Bu tetkik endike olduğunda, ultrasonda PKOS ile uyumlu yumurtalık görünümü',
    ],
    s4Body3: 'Doktor, PKOS tanısını doğrulamadan önce düzensiz döngülerin veya androjen fazlalığının olası diğer nedenlerini de dışlamalıdır.',
    s5Heading: 'PKOS ve yumurtlama',
    s5Body1: 'Yumurtlama, yumurtalıktan bir yumurta hücresinin (oosit) salınmasıdır. PKOS’ta yumurtlama daha seyrek olabilir ya da öngörmesi daha zor hale gelebilir.',
    s5Body2: 'Bu durum, döngülerin neden bazen uzun, düzensiz ya da önceden kestirilmesi zor olduğunu açıklayabilir.',
    s5HighlightTitle: 'Döngünü takip etmek',
    s5HighlightText: 'Adet tarihlerini, belirtilerini ve varsa yumurtlama işaretlerini kaydetmek, kendi örüntülerini daha iyi anlamana yardımcı olabilir.',
    s6Heading: 'PKOS ve doğurganlık',
    s6Body1: 'Yumurtlama düzensiz olabildiği için PKOS’lu bazı kadınlar hamile kalmakta daha fazla güçlük yaşayabilir.',
    s6Body2: 'Ancak bu, PKOS’un otomatik olarak gebeliği engellediği anlamına gelmez. PKOS’lu pek çok kadın doğal yoldan ya da uygun tıbbi destekle hamile kalır.',
    s6TipTitle: 'Aklında bulunsun',
    s6TipText: 'Hamile kalmakta güçlük yaşamak, bunun imkânsız olduğu anlamına gelmez. Hamile kalmayı umuyorsan, bir doktor ya da ebe durumuna uygun bir yol önerebilir.',
    s7Heading: 'PKOS ve kilo / metabolizma',
    s7Body1: 'PKOS, bazı kadınlarda insülin direnci de dahil olmak üzere metabolik değişikliklerle ilişkili olabilir.',
    s7Body2: 'Ancak kilo tek başına PKOS’u teşhis edemez ya da dışlayamaz. İnce bir kadında PKOS olabileceği gibi, kilolu bir kadında olmayabilir.',
    s7NeutralText: 'Takipte yalnızca kantardaki sayıya değil, genel sağlığa da bakılmalıdır.',
    s8Heading: 'Cilt, saç ve vücut tüyleri',
    s8Body1: 'Göreceli androjen fazlalığı, yağ bezlerini ve saç köklerini etkileyebilir.',
    s8Body2: 'Kadından kadına değişmekle birlikte bu durum kalıcı akne, artmış tüylenme ya da saç dökülmesi şeklinde kendini gösterebilir.',
    s8Items: [
      'Hormonal akne',
      'Yüzde veya vücutta artmış tüylenme',
      'Saçların incelmesi veya dökülmesi',
    ],
    s9Heading: 'PKOS nasıl yönetilir?',
    s9Body1: 'PKOS’u yönetmek için her kadında işe yarayan tek bir yaklaşım yoktur. Seçim; belirtilere, hedeflere ve tıbbi koşullara bağlıdır.',
    s9Body2: 'Hedef, hayatın içinde bulunulan evreye göre değişebilir: döngüleri düzenlemek, bazı belirtileri iyileştirmek, metabolik sağlığı korumak ya da bir gebelik planını desteklemek.',
    s9MiniTitle: 'Sağlığı destekleyen alışkanlıklar',
    s9Lifestyle: [
      'İhtiyaçlarına uygun, çeşitli ve düzenli beslenmek',
      'Zaman içinde sürdürebileceğin düzenli fiziksel aktivite yapmak',
      'Yeterince düzenli uyumak',
      'Döngülerinin ve belirtilerinin zaman içinde nasıl değiştiğini takip etmek',
      'Kilodaki veya belirtilerdeki değişiklikler için kendini suçlamamak',
    ],
    s9Body3: 'İhtiyaçlarına göre bir sağlık uzmanı, bazı belirtilere yönelik ya da bir gebelik planını desteklemek için tedaviler de önerebilir.',
    s9AlertTitle: 'Kendi kendine ilaç kullanma',
    s9AlertText: 'Hormonal tedaviler, metabolik ilaçlar ve takviyelerin hepsi bir sağlık uzmanıyla konuşulmalıdır.',
    s10Heading: 'PKOS hakkında yaygın yanlış inanışlar',
    s10Myths: [
      'PKOS her zaman “kist” olması demektir: ad yanıltıcı olabilir. Tanı yalnızca kist bulunmasına dayanmaz.',
      'PKOS’lu bütün kadınlar kilolu olur: PKOS her vücut tipindeki kadını etkileyebilir.',
      'PKOS her zaman gebeliği engeller: yumurtlama düzensiz olabilir, ancak gebelik yine de mümkündür.',
      'Tek bir belirti PKOS tanısı için yeterlidir: tanı için kapsamlı bir değerlendirme gerekir.',
      'PKOS yaşla birlikte kendiliğinden geçer: ortaya çıkış biçimi yaşam boyunca değişebilir, ancak düzenli takip önemini korur.',
    ],
    s11Heading: 'Ne zaman doktora gitmeli',
    s11Body1: 'Döngüler çok düzensizleştiğinde, birkaç ay boyunca kesildiğinde ya da olağandışı belirtiler ortaya çıktığında tıbbi tavsiye almak özellikle yerinde olur.',
    s11ConsultItems: [
      'Çok düzensiz veya hiç gelmeyen döngüler',
      'Olağandışı akne veya tüylenme',
      'Belirgin saç dökülmesi',
      'Hamile kalmada güçlük',
      'Hızla değişen belirtiler',
    ],
    s12Heading: 'Öne çıkan noktalar',
    s12SummaryTitle: 'Temel noktalar',
    s12SummaryItems: [
      'PKOS yaygın bir hormonal durumdur.',
      'Pek çok farklı şekilde kendini gösterebilir.',
      'PKOS’lu bütün kadınlarda aynı belirtiler görülmez.',
      'Kilo tek başına PKOS’u teşhis etmeye ya da dışlamaya yetmez.',
      'Tanı için kapsamlı bir tıbbi değerlendirme gerekir.',
      'PKOS yumurtlamayı ve bazen doğurganlığı etkileyebilir.',
      'Kişiye özel bir bakım yaklaşımı, her kadının ihtiyaçlarını karşılamaya yardımcı olur.',
    ],
    finalNoteTitle: 'Daha iyi anlamaya yardımcı bir rehber',
    finalNoteText: 'Bu makale genel bilgilendirme amaçlıdır ve bir tıbbi muayenenin yerini tutmaz. Her durum farklıdır: tereddüt ettiğinde ya da belirtiler sürdüğünde bir sağlık uzmanına danış.',
    shareMessage: 'PKOS’u anlamak — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosIntroArticleScreen({
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          {/* HEADER */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

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

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>{content.intro}</Text>

          <Text style={styles.introSecondary}>{content.introSecondary}</Text>

          {/* CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>

                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* 1 */}
          <Text style={styles.h2}>1. {content.s1Heading}</Text>

          <Text style={styles.body}>{content.s1Body1}</Text>

          <Text style={styles.body}>{content.s1Body2}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s1TipTitle}</Text>

              <Text style={styles.tipText}>{content.s1TipText}</Text>
            </View>
          </View>

          {/* 2 */}
          <Text style={styles.h2}>2. {content.s2Heading}</Text>

          <Text style={styles.body}>{content.s2Body1}</Text>

          <View style={styles.checkList}>
            {content.s2Factors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="circle-small"
                  size={20}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>{content.s2NeutralText}</Text>
          </View>

          {/* 3 */}
          <Text style={styles.h2}>3. {content.s3Heading}</Text>

          <Text style={styles.body}>{content.s3Body1}</Text>

          <View style={styles.checkList}>
            {content.s3Signs.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s3AlertTitle}</Text>

              <Text style={styles.tipText}>{content.s3AlertText}</Text>
            </View>
          </View>

          {/* 4 */}
          <Text style={styles.h2}>4. {content.s4Heading}</Text>

          <Text style={styles.body}>{content.s4Body1}</Text>

          <Text style={styles.body}>{content.s4Body2}</Text>

          <View style={styles.numberedCard}>
            {content.s4Points.map((item, index) => (
              <View key={item} style={styles.numberedRow}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberCircleText}>{index + 1}</Text>
                </View>

                <Text style={styles.numberedText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>{content.s4Body3}</Text>

          {/* 5 */}
          <Text style={styles.h2}>5. {content.s5Heading}</Text>

          <Text style={styles.body}>{content.s5Body1}</Text>

          <Text style={styles.body}>{content.s5Body2}</Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.s5HighlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.s5HighlightText}
              </Text>
            </View>
          </View>

          {/* 6 */}
          <Text style={styles.h2}>6. {content.s6Heading}</Text>

          <Text style={styles.body}>{content.s6Body1}</Text>

          <Text style={styles.body}>{content.s6Body2}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s6TipTitle}</Text>

              <Text style={styles.tipText}>{content.s6TipText}</Text>
            </View>
          </View>

          {/* 7 */}
          <Text style={styles.h2}>7. {content.s7Heading}</Text>

          <Text style={styles.body}>{content.s7Body1}</Text>

          <Text style={styles.body}>{content.s7Body2}</Text>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="scale-balance"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>{content.s7NeutralText}</Text>
          </View>

          {/* 8 */}
          <Text style={styles.h2}>8. {content.s8Heading}</Text>

          <Text style={styles.body}>{content.s8Body1}</Text>

          <Text style={styles.body}>{content.s8Body2}</Text>

          <View style={styles.checkList}>
            {content.s8Items.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* 9 */}
          <Text style={styles.h2}>9. {content.s9Heading}</Text>

          <Text style={styles.body}>{content.s9Body1}</Text>

          <Text style={styles.body}>{content.s9Body2}</Text>

          <View style={styles.sectionMiniTitle}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={20}
              color={theme.colors.primary}
            />

            <Text style={styles.sectionMiniTitleText}>
              {content.s9MiniTitle}
            </Text>
          </View>

          <View style={styles.checkList}>
            {content.s9Lifestyle.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>{content.s9Body3}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="doctor"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s9AlertTitle}</Text>

              <Text style={styles.tipText}>{content.s9AlertText}</Text>
            </View>
          </View>

          {/* 10 */}
          <Text style={styles.h2}>10. {content.s10Heading}</Text>

          <View style={styles.checkList}>
            {content.s10Myths.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* 11 */}
          <Text style={styles.h2}>11. {content.s11Heading}</Text>

          <Text style={styles.body}>{content.s11Body1}</Text>

          <View style={styles.consultCard}>
            {CONSULT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>
                  {content.s11ConsultItems[index]}
                </Text>
              </View>
            ))}
          </View>

          {/* 12 */}
          <Text style={styles.h2}>12. {content.s12Heading}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>
                {content.s12SummaryTitle}
              </Text>
            </View>

            {content.s12SummaryItems.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check"
                  size={17}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* FINAL NOTE */}
          <View style={styles.finalNote}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={23}
              color={theme.colors.textMuted}
            />

            <View style={styles.finalNoteCopy}>
              <Text style={styles.finalNoteTitle}>
                {content.finalNoteTitle}
              </Text>

              <Text style={styles.finalNoteText}>
                {content.finalNoteText}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
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
      paddingBottom: 30,
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

    circle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(theme.colors.surface, 0.9),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    pressed: {
      opacity: 0.74,
    },

    article: {
      marginTop: -15,
      padding: 20,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      backgroundColor: theme.colors.background,
    },

    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
    },

    badgeText: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    title: {
      marginTop: 12,
      fontFamily: 'serif',
      fontSize: 27,
      lineHeight: 32,
      color: theme.colors.text,
      fontWeight: '700',
    },

    metas: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
    },

    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    metaDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.border,
    },

    meta: {
      fontSize: 9.5,
      color: theme.colors.textMuted,
    },

    intro: {
      marginTop: 17,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },

    introSecondary: {
      marginTop: 9,
      fontSize: 13.5,
      lineHeight: 20.5,
      color: theme.colors.textMuted,
    },

    contents: {
      marginTop: 20,
      padding: 15,
      borderRadius: 13,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    contentsTitle: {
      marginBottom: 7,
      fontSize: 15,
      color: theme.colors.text,
      fontWeight: '800',
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
      color: theme.colors.primary,
      fontSize: 11.5,
      fontWeight: '800',
    },

    contentText: {
      flex: 1,
      fontSize: 12.3,
      lineHeight: 17,
      color: theme.colors.text,
    },

    h2: {
      marginTop: 25,
      fontFamily: 'serif',
      fontSize: 21,
      lineHeight: 27,
      color: theme.colors.text,
      fontWeight: '700',
    },

    body: {
      marginTop: 9,
      fontSize: 14,
      lineHeight: 21.5,
      color: theme.colors.textSecondary,
    },

    tip: {
      marginTop: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    tipCopy: {
      flex: 1,
      marginLeft: 11,
    },

    tipTitle: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '800',
    },

    tipText: {
      marginTop: 4,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.colors.textSecondary,
    },

    checkList: {
      marginTop: 13,
      padding: 13,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 10,
    },

    checkText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    alert: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },

    neutralBox: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    neutralText: {
      flex: 1,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.colors.textSecondary,
    },

    numberedCard: {
      marginTop: 14,
      padding: 14,
      borderRadius: 13,
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    numberedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 13,
    },

    numberCircle: {
      width: 27,
      height: 27,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    numberCircleText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },

    numberedText: {
      flex: 1,
      marginLeft: 10,
      paddingTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    highlightBox: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 13,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    highlightCopy: {
      flex: 1,
      marginLeft: 10,
    },

    highlightTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    highlightText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11.5,
      lineHeight: 17,
    },

    sectionMiniTitle: {
      marginTop: 17,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    sectionMiniTitleText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    consultCard: {
      marginTop: 14,
      padding: 13,
      borderRadius: 13,
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    consultRow: {
      minHeight: 43,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 7,
    },

    consultIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    consultText: {
      flex: 1,
      marginLeft: 10,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    summaryCard: {
      marginTop: 15,
      padding: 15,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 12,
    },

    summaryTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
    },

    summaryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 9,
    },

    summaryText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    finalNote: {
      marginTop: 18,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 13,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    finalNoteCopy: {
      flex: 1,
      marginLeft: 10,
    },

    finalNoteTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    finalNoteText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16.5,
    },
  });
}
