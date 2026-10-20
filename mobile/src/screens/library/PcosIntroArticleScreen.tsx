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
  ru: {
    badge: 'СПКЯ • ОСНОВНОЕ РУКОВОДСТВО',
    title: 'Понимаем\nСПКЯ',
    metaDuration: '10 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Образовательный материал',
    intro:
      'Синдром поликистозных яичников, или СПКЯ, — распространённое гормональное состояние, которое может влиять на цикл, овуляцию, кожу, волосы, обмен веществ, а иногда и на фертильность.',
    introSecondary:
      'Проявления сильно различаются у разных женщин. Понимание СПКЯ прежде всего помогает распознавать его симптомы, знать, когда обратиться к врачу, и наблюдать за его течением, не обвиняя себя.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое СПКЯ?',
      'Почему возникает СПКЯ?',
      'Основные признаки',
      'Как ставится диагноз?',
      'СПКЯ и овуляция',
      'СПКЯ и фертильность',
      'СПКЯ, вес и обмен веществ',
      'Кожа, волосы и волосяной покров тела',
      'Как справляться с СПКЯ?',
      'Распространённые заблуждения',
      'Когда обратиться к врачу',
      'Главное, что стоит запомнить',
    ],
    s1Heading: 'Что такое СПКЯ?',
    s1Body1:
      'Синдром поликистозных яичников (СПКЯ) — распространённое гормональное состояние, которое может изменять привычную работу яичников и баланс некоторых гормонов.',
    s1Body2:
      'У одних женщин основная проблема — нерегулярная овуляция. У других на первый план выходят акне, избыточный рост волос, выпадение волос или обменные нарушения.',
    s1TipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    s1TipText:
      'Несмотря на название, СПКЯ не обязательно означает, что в яичниках есть «кисты». Исторический термин может вводить в заблуждение, а одного УЗИ недостаточно для постановки диагноза.',
    s2Heading: 'Почему возникает СПКЯ?',
    s2Body1:
      'У СПКЯ нет единственной причины. Он, по-видимому, возникает в результате сочетания нескольких факторов: наследственной предрасположенности, гормональной регуляции, овуляции, обмена веществ и индивидуальных особенностей.',
    s2Factors: [
      'Семейная предрасположенность и генетические факторы',
      'Нарушения овуляции',
      'Относительный избыток андрогенов',
      'Инсулинорезистентность у некоторых женщин',
      'Обменные факторы и факторы окружающей среды',
    ],
    s2NeutralText:
      'СПКЯ — не личная вина. Он не является просто следствием недостатка силы воли, неправильного питания или недостаточной физической активности.',
    s3Heading: 'Основные признаки',
    s3Body1:
      'СПКЯ может проявляться совершенно по-разному у разных женщин. У одних есть несколько симптомов, а другие замечают их совсем немного.',
    s3Signs: [
      'Нерегулярный цикл, редкие или иногда отсутствующие месячные',
      'Нерегулярная или трудно предсказуемая овуляция',
      'Стойкие акне, особенно в нижней части лица',
      'Усиленный рост волос на лице, груди или теле',
      'Выпадение волос по гормональному типу',
      'Набор веса или трудности со снижением веса',
      'Трудности с зачатием',
    ],
    s3AlertTitle: 'Важно',
    s3AlertText:
      'Наличие одного из этих симптомов не означает автоматически, что у вас СПКЯ. Похожие симптомы могут вызывать и другие состояния.',
    s4Heading: 'Как ставится диагноз?',
    s4Body1:
      'Диагностика СПКЯ — медицинский процесс. Обычно специалист сначала обсуждает с вами ваш цикл, симптомы, историю болезни и принимаемое лечение.',
    s4Body2:
      'В зависимости от ситуации могут также назначить гормональные анализы крови и УЗИ.',
    s4Points: [
      'Нерегулярный цикл или редкая овуляция',
      'Признаки избытка андрогенов: акне, избыточный рост волос, выпадение волос или результаты анализов крови',
      'Вид яичников, соответствующий СПКЯ, по данным УЗИ, если это исследование показано',
    ],
    s4Body3:
      'Прежде чем подтвердить диагноз СПКЯ, врач должен также исключить другие возможные причины нерегулярного цикла или избытка андрогенов.',
    s5Heading: 'СПКЯ и овуляция',
    s5Body1:
      'Овуляция — это выход яйцеклетки (ооцита) из яичника. При СПКЯ овуляция может происходить реже или быть труднее предсказуемой.',
    s5Body2:
      'Это может объяснять, почему цикл иногда бывает длинным, нерегулярным или трудно прогнозируемым.',
    s5HighlightTitle: 'Отслеживание цикла',
    s5HighlightText:
      'Запись дат месячных, симптомов и возможных признаков овуляции поможет вам лучше понять собственные закономерности.',
    s6Heading: 'СПКЯ и фертильность',
    s6Body1:
      'Поскольку овуляция может быть нерегулярной, у некоторых женщин с СПКЯ зачатие может наступать труднее.',
    s6Body2:
      'Однако это не означает, что СПКЯ автоматически исключает беременность. Многие женщины с СПКЯ беременеют естественным путём или при соответствующей медицинской поддержке.',
    s6TipTitle: 'Помните',
    s6TipText:
      'Трудности с зачатием не означают, что беременность невозможна. Если вы надеетесь забеременеть, врач или акушерка могут предложить подходящую вашей ситуации стратегию.',
    s7Heading: 'СПКЯ, вес и обмен веществ',
    s7Body1:
      'СПКЯ может сопровождаться обменными изменениями, в том числе инсулинорезистентностью у некоторых женщин.',
    s7Body2:
      'Однако по одному лишь весу нельзя ни поставить диагноз СПКЯ, ни исключить его. СПКЯ может быть и у худощавой женщины, а у женщины с избыточным весом его может не быть.',
    s7NeutralText:
      'При наблюдении следует учитывать общее состояние здоровья, а не только цифру на весах.',
    s8Heading: 'Кожа, волосы и волосяной покров тела',
    s8Body1:
      'Относительный избыток андрогенов может влиять на сальные железы и волосяные фолликулы.',
    s8Body2:
      'У разных женщин это может проявляться стойкими акне, усиленным ростом волос или их выпадением.',
    s8Items: [
      'Гормональные акне',
      'Усиленный рост волос на лице или теле',
      'Истончение или выпадение волос',
    ],
    s9Heading: 'Как справляться с СПКЯ?',
    s9Body1:
      'Единого подхода к лечению СПКЯ, подходящего всем женщинам, не существует. Выбор зависит от симптомов, целей и медицинских обстоятельств.',
    s9Body2:
      'Цель может отличаться в зависимости от этапа жизни: регулировать цикл, облегчить некоторые симптомы, защитить обменное здоровье или поддержать планирование беременности.',
    s9MiniTitle: 'Привычки, поддерживающие здоровье',
    s9Lifestyle: [
      'Разнообразное регулярное питание, соответствующее вашим потребностям',
      'Регулярная физическая активность, которую вы можете поддерживать длительное время',
      'Достаточно регулярный сон',
      'Наблюдение за тем, как меняются цикл и симптомы со временем',
      'Не винить себя за изменения веса или симптомов',
    ],
    s9Body3:
      'В зависимости от ваших потребностей специалист может также предложить лечение отдельных симптомов или поддержку при планировании беременности.',
    s9AlertTitle: 'Не занимайтесь самолечением',
    s9AlertText:
      'Гормональные препараты, лекарства, влияющие на обмен веществ, и пищевые добавки следует обсуждать с медицинским специалистом.',
    s10Heading: 'Распространённые заблуждения о СПКЯ',
    s10Myths: [
      'СПКЯ всегда означает наличие «кист»: название может вводить в заблуждение. Диагноз не основывается только на наличии кист.',
      'У всех женщин с СПКЯ избыточный вес: СПКЯ может быть у женщин с любым телосложением.',
      'СПКЯ всегда исключает беременность: овуляция может быть нерегулярной, но беременность всё равно возможна.',
      'Одного симптома достаточно для диагноза СПКЯ: для диагностики необходимо комплексное обследование.',
      'СПКЯ просто проходит с возрастом: его проявления могут меняться в течение жизни, но постоянное наблюдение остаётся важным.',
    ],
    s11Heading: 'Когда обратиться к врачу',
    s11Body1:
      'Особенно стоит обратиться за медицинской консультацией, если цикл становится очень нерегулярным, месячных нет несколько месяцев или появляются необычные симптомы.',
    s11ConsultItems: [
      'Очень нерегулярный цикл или отсутствие месячных',
      'Необычные акне или рост волос',
      'Значительное выпадение волос',
      'Трудности с зачатием',
      'Быстро меняющиеся симптомы',
    ],
    s12Heading: 'Главное, что стоит запомнить',
    s12SummaryTitle: 'Основные моменты',
    s12SummaryItems: [
      'СПКЯ — распространённое гормональное состояние.',
      'Оно может проявляться по-разному.',
      'Не у всех женщин с СПКЯ одинаковые симптомы.',
      'По одному лишь весу нельзя ни поставить диагноз СПКЯ, ни исключить его.',
      'Для диагностики необходимо комплексное медицинское обследование.',
      'СПКЯ может влиять на овуляцию и иногда на фертильность.',
      'Индивидуальный подход к лечению помогает учесть потребности каждой женщины.',
    ],
    finalNoteTitle: 'Руководство для лучшего понимания',
    finalNoteText:
      'Эта статья предназначена для общего информирования и не заменяет медицинскую консультацию. Каждая ситуация индивидуальна: при сомнениях или если симптомы сохраняются, обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Понимаем СПКЯ — AWA',
  },
  de: {
    badge: 'PCOS • GRUNDLAGEN',
    title: 'PCOS\nverstehen',
    metaDuration: '10 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Bildungsinhalt',
    intro:
      'Das polyzystische Ovarsyndrom, oft PCOS genannt, ist eine häufige hormonelle Erkrankung, die deinen Zyklus, den Eisprung, Haut, Haare, Stoffwechsel und manchmal auch die Fruchtbarkeit beeinflussen kann.',
    introSecondary:
      'Wie sie sich zeigt, ist von Frau zu Frau sehr unterschiedlich. PCOS zu verstehen hilft dir vor allem, die Symptome zu erkennen, zu wissen, wann du ärztlichen Rat suchen solltest, und die Entwicklung ohne Selbstvorwürfe zu verfolgen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist PCOS?',
      'Warum entsteht PCOS?',
      'Die wichtigsten Anzeichen',
      'Wie wird es diagnostiziert?',
      'PCOS und Eisprung',
      'PCOS und Fruchtbarkeit',
      'PCOS und Gewicht / Stoffwechsel',
      'Haut, Haare und Körperbehaarung',
      'Wie wird PCOS behandelt?',
      'Verbreitete Irrtümer',
      'Wann du zur Ärztin oder zum Arzt gehen solltest',
      'Das Wichtigste in Kürze',
    ],
    s1Heading: 'Was ist PCOS?',
    s1Body1:
      'Das polyzystische Ovarsyndrom (PCOS) ist eine häufige hormonelle Erkrankung, die die übliche Funktion der Eierstöcke und das Gleichgewicht bestimmter Hormone verändern kann.',
    s1Body2:
      'Bei manchen Frauen steht ein unregelmäßiger Eisprung im Vordergrund. Bei anderen fallen zuerst Akne, vermehrter Haarwuchs, Haarausfall oder Stoffwechselzeichen auf.',
    s1TipTitle: 'Gut zu wissen',
    s1TipText:
      'Trotz seines Namens bedeutet PCOS nicht unbedingt, dass die Eierstöcke „Zysten“ enthalten. Der historische Begriff kann irreführend sein, und ein Ultraschall allein reicht für die Diagnose nicht aus.',
    s2Heading: 'Warum entsteht PCOS?',
    s2Body1:
      'Für PCOS gibt es nicht die eine Ursache. Es scheint aus mehreren Faktoren zu entstehen, die zusammenwirken können: familiäre Veranlagung, hormonelle Funktion, Eisprung, Stoffwechsel und individuelle Faktoren.',
    s2Factors: [
      'Familiäre Veranlagung und genetische Faktoren',
      'Störungen des Eisprungs',
      'Relativer Überschuss an Androgenen',
      'Insulinresistenz bei manchen Frauen',
      'Stoffwechsel- und Umweltfaktoren',
    ],
    s2NeutralText:
      'PCOS ist kein persönliches Versagen. Es entsteht nicht einfach durch mangelnde Willenskraft, ungesunde Ernährung oder zu wenig Bewegung.',
    s3Heading: 'Die wichtigsten Anzeichen',
    s3Body1:
      'PCOS kann sich von Frau zu Frau sehr unterschiedlich zeigen. Manche haben mehrere Symptome, andere bemerken nur sehr wenige.',
    s3Signs: [
      'Unregelmäßige, weit auseinanderliegende oder manchmal ausbleibende Zyklen',
      'Unregelmäßiger oder schwer vorhersehbarer Eisprung',
      'Anhaltende Akne, besonders im unteren Gesichtsbereich',
      'Vermehrter Haarwuchs im Gesicht, an der Brust oder am Körper',
      'Hormonell bedingter Haarausfall',
      'Gewichtszunahme oder Schwierigkeiten beim Abnehmen',
      'Schwierigkeiten, schwanger zu werden',
    ],
    s3AlertTitle: 'Wichtig',
    s3AlertText:
      'Eines dieser Symptome zu haben bedeutet nicht automatisch, dass du PCOS hast. Mehrere andere Erkrankungen können ähnliche Symptome verursachen.',
    s4Heading: 'Wie wird es diagnostiziert?',
    s4Body1:
      'Die Diagnose von PCOS ist ein medizinischer Prozess. Meist beginnt die Fachperson mit einem Gespräch über deine Zyklen, Symptome, Krankengeschichte und gegebenenfalls eingenommene Medikamente.',
    s4Body2:
      'Je nach Situation werden zusätzlich hormonelle Blutuntersuchungen und ein Ultraschall angeboten.',
    s4Points: [
      'Unregelmäßige Zyklen oder seltene Eisprünge',
      'Zeichen eines Androgenüberschusses: Akne, vermehrter Haarwuchs, Haarausfall oder Blutwerte',
      'Ein für PCOS typisches Aussehen der Eierstöcke im Ultraschall, wenn diese Untersuchung angezeigt ist',
    ],
    s4Body3:
      'Die Ärztin oder der Arzt muss außerdem andere mögliche Ursachen für unregelmäßige Zyklen oder einen Androgenüberschuss ausschließen, bevor eine PCOS-Diagnose bestätigt wird.',
    s5Heading: 'PCOS und Eisprung',
    s5Body1:
      'Beim Eisprung wird eine Eizelle (Oozyte) aus dem Eierstock freigesetzt. Bei PCOS kann der Eisprung seltener oder schwerer vorhersehbar sein.',
    s5Body2:
      'Das kann erklären, warum Zyklen manchmal lang, unregelmäßig oder schwer abzuschätzen sind.',
    s5HighlightTitle: 'Deinen Zyklus verfolgen',
    s5HighlightText:
      'Wenn du die Daten deiner Periode, deine Symptome und mögliche Eisprungzeichen festhältst, kannst du deine eigenen Muster besser verstehen.',
    s6Heading: 'PCOS und Fruchtbarkeit',
    s6Body1:
      'Weil der Eisprung unregelmäßig sein kann, haben manche Frauen mit PCOS mehr Schwierigkeiten, schwanger zu werden.',
    s6Body2:
      'Das heißt jedoch nicht, dass PCOS eine Schwangerschaft automatisch verhindert. Viele Frauen mit PCOS werden auf natürlichem Weg oder mit passender medizinischer Unterstützung schwanger.',
    s6TipTitle: 'Zum Mitnehmen',
    s6TipText:
      'Schwierigkeiten, schwanger zu werden, bedeuten nicht, dass es unmöglich ist. Wenn du dir eine Schwangerschaft wünschst, kann dir eine Ärztin, ein Arzt oder eine Hebamme eine zu deiner Situation passende Vorgehensweise vorschlagen.',
    s7Heading: 'PCOS und Gewicht / Stoffwechsel',
    s7Body1:
      'PCOS kann mit Stoffwechselveränderungen einhergehen, darunter bei manchen Frauen eine Insulinresistenz.',
    s7Body2:
      'Das Gewicht allein kann PCOS jedoch weder diagnostizieren noch ausschließen. Auch eine schlanke Frau kann PCOS haben, ebenso wie eine Frau mit Übergewicht es möglicherweise nicht hat.',
    s7NeutralText:
      'Bei der Betreuung sollte die Gesundheit insgesamt im Blick sein, nicht nur die Zahl auf der Waage.',
    s8Heading: 'Haut, Haare und Körperbehaarung',
    s8Body1:
      'Ein relativer Androgenüberschuss kann die Talgdrüsen und die Haarfollikel beeinflussen.',
    s8Body2:
      'Je nach Frau kann sich das als anhaltende Akne, vermehrter Haarwuchs oder Haarausfall zeigen.',
    s8Items: [
      'Hormonelle Akne',
      'Vermehrte Gesichts- oder Körperbehaarung',
      'Dünner werdendes Haar oder Haarausfall',
    ],
    s9Heading: 'Wie wird PCOS behandelt?',
    s9Body1:
      'Es gibt nicht den einen Behandlungsansatz bei PCOS, der für jede Frau passt. Die Wahl hängt von den Symptomen, den Zielen und den medizinischen Umständen ab.',
    s9Body2:
      'Das Ziel kann je nach Lebensphase unterschiedlich sein: den Zyklus regulieren, bestimmte Symptome verbessern, die Stoffwechselgesundheit schützen oder einen Schwangerschaftswunsch unterstützen.',
    s9MiniTitle: 'Gewohnheiten, die die Gesundheit unterstützen',
    s9Lifestyle: [
      'Eine abwechslungsreiche, regelmäßige Ernährung, die zu deinen Bedürfnissen passt',
      'Regelmäßige körperliche Aktivität, die du langfristig durchhalten kannst',
      'Ausreichend regelmäßiger Schlaf',
      'Beobachten, wie sich deine Zyklen und Symptome im Lauf der Zeit verändern',
      'Dir keine Vorwürfe für Veränderungen bei Gewicht oder Symptomen machen',
    ],
    s9Body3:
      'Je nach deinen Bedürfnissen kann die Fachperson dir außerdem Behandlungen für bestimmte Symptome oder zur Unterstützung eines Schwangerschaftswunsches anbieten.',
    s9AlertTitle: 'Keine Selbstmedikation',
    s9AlertText:
      'Hormonelle Behandlungen, Stoffwechselmedikamente und Nahrungsergänzungsmittel sollten immer mit medizinischem Fachpersonal besprochen werden.',
    s10Heading: 'Verbreitete Irrtümer über PCOS',
    s10Myths: [
      'PCOS bedeutet immer „Zysten“: Der Name kann irreführend sein. Die Diagnose beruht nicht allein auf dem Vorhandensein von Zysten.',
      'Alle Frauen mit PCOS haben Übergewicht: PCOS kann Frauen jeder Körperform betreffen.',
      'PCOS verhindert immer eine Schwangerschaft: Der Eisprung kann unregelmäßig sein, aber eine Schwangerschaft ist weiterhin möglich.',
      'Ein einzelnes Symptom reicht für die PCOS-Diagnose aus: Für die Diagnose ist eine umfassende Untersuchung nötig.',
      'PCOS verschwindet mit dem Alter von selbst: Wie es sich zeigt, kann sich im Lauf des Lebens verändern, aber eine fortlaufende Betreuung bleibt wichtig.',
    ],
    s11Heading: 'Wann du zur Ärztin oder zum Arzt gehen solltest',
    s11Body1:
      'Ärztlicher Rat ist besonders sinnvoll, wenn die Zyklen sehr unregelmäßig werden, mehrere Monate ausbleiben oder wenn ungewöhnliche Symptome auftreten.',
    s11ConsultItems: [
      'Sehr unregelmäßige oder ausbleibende Zyklen',
      'Ungewöhnliche Akne oder ungewöhnlicher Haarwuchs',
      'Starker Haarausfall',
      'Schwierigkeiten, schwanger zu werden',
      'Sich schnell verändernde Symptome',
    ],
    s12Heading: 'Das Wichtigste in Kürze',
    s12SummaryTitle: 'Die wesentlichen Punkte',
    s12SummaryItems: [
      'PCOS ist eine häufige hormonelle Erkrankung.',
      'Es kann sich auf viele verschiedene Arten zeigen.',
      'Nicht alle Frauen mit PCOS haben die gleichen Symptome.',
      'Das Gewicht allein reicht nicht aus, um PCOS zu diagnostizieren oder auszuschließen.',
      'Die Diagnose erfordert eine umfassende ärztliche Untersuchung.',
      'PCOS kann den Eisprung und manchmal die Fruchtbarkeit beeinflussen.',
      'Ein individuell abgestimmter Betreuungsansatz hilft, den Bedürfnissen jeder Frau gerecht zu werden.',
    ],
    finalNoteTitle: 'Ein Ratgeber für mehr Verständnis',
    finalNoteText:
      'Dieser Artikel dient der allgemeinen Information und ersetzt keine ärztliche Beratung. Jede Situation ist anders: Bei Zweifeln oder anhaltenden Symptomen lass dich von medizinischem Fachpersonal beraten.',
    shareMessage: 'PCOS verstehen — AWA',
  },
  zh: {
      badge: 'PCOS • 基础指南',
      title: '了解\n多囊卵巢综合征',
      metaDuration: '阅读约 10 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '多囊卵巢综合征（常简称 PCOS）是一种常见的内分泌状况，可能影响你的月经周期、排卵、皮肤、毛发、代谢，有时还会影响生育力。',
      introSecondary: '它的表现因人而异。了解 PCOS 主要是为了帮助你认识它的症状，知道何时该就医，并在不自责的前提下记录它的变化。',
      contentsTitle: '本文内容',
      topics: [
        '什么是 PCOS？',
        'PCOS 为什么会出现？',
        '主要表现',
        '如何诊断？',
        'PCOS 与排卵',
        'PCOS 与生育力',
        'PCOS 与体重／代谢',
        '皮肤、头发与体毛',
        '如何管理 PCOS？',
        '常见误区',
        '何时就医',
        '要点回顾',
      ],
      s1Heading: '什么是 PCOS？',
      s1Body1: '多囊卵巢综合征（PCOS）是一种常见的内分泌状况，可能改变卵巢的正常功能以及某些激素的平衡。',
      s1Body2: '对一些女性来说，主要问题是排卵不规律；对另一些人来说，最先突出的则是痤疮、毛发增多、脱发或代谢方面的表现。',
      s1TipTitle: '小贴士',
      s1TipText: '尽管名字里有“多囊”，PCOS 并不一定意味着卵巢里有“囊肿”。这个沿用下来的名称容易让人误解，而且仅凭超声检查并不足以确诊。',
      s2Heading: 'PCOS 为什么会出现？',
      s2Body1: 'PCOS 并没有单一的病因。它似乎是多种因素共同作用的结果：家族倾向、激素功能、排卵、代谢以及个体因素。',
      s2Factors: [
        '家族倾向与遗传因素',
        '排卵紊乱',
        '相对的雄激素偏多',
        '部分女性存在胰岛素抵抗',
        '代谢与环境因素',
      ],
      s2NeutralText: 'PCOS 不是个人的过错。它并不单纯是意志力不足、饮食不当或运动不够造成的。',
      s3Heading: '主要表现',
      s3Body1: 'PCOS 的表现因人而异，差别可能很大。有些人有好几种症状，有些人则几乎没有察觉。',
      s3Signs: [
        '月经不规律、间隔很长，有时甚至没有月经',
        '排卵不规律或难以预测',
        '持续的痤疮，尤其出现在面部下半部',
        '面部、胸部或身体的毛发增多',
        '激素型脱发',
        '体重增加或难以减重',
        '难以怀孕',
      ],
      s3AlertTitle: '重要提示',
      s3AlertText: '出现其中一种症状并不一定意味着你患有 PCOS。其他多种情况也可能引起类似的症状。',
      s4Heading: '如何诊断？',
      s4Body1: '诊断 PCOS 是一个医疗过程。医疗专业人员通常会先了解你的月经周期、症状、病史以及正在使用的药物。',
      s4Body2: '根据具体情况，还可能建议做激素相关的血液检查和超声检查。',
      s4Points: [
        '月经周期不规律或排卵稀少',
        '雄激素偏多的表现：痤疮、毛发增多、脱发，或血液检查结果',
        '在需要做超声检查时，卵巢的形态符合 PCOS 的特点',
      ],
      s4Body3: '在确诊 PCOS 之前，医生还必须排除可能导致月经不规律或雄激素偏多的其他原因。',
      s5Heading: 'PCOS 与排卵',
      s5Body1: '排卵是指卵子（卵母细胞）从卵巢中排出。患有 PCOS 时，排卵可能不那么频繁，或更难预测。',
      s5Body2: '这可以解释为什么月经周期有时很长、不规律或难以预判。',
      s5HighlightTitle: '记录你的周期',
      s5HighlightText: '记下月经日期、症状以及任何排卵迹象，有助于你更好地了解自己的规律。',
      s6Heading: 'PCOS 与生育力',
      s6Body1: '由于排卵可能不规律，一些患有 PCOS 的女性可能会更难怀孕。',
      s6Body2: '但这并不意味着 PCOS 一定会妨碍怀孕。许多患有 PCOS 的女性能够自然受孕，或在适当的医疗支持下怀孕。',
      s6TipTitle: '请记住',
      s6TipText: '难以怀孕并不等于不可能怀孕。如果你希望怀孕，医生或助产士可以为你提供适合你情况的方案。',
      s7Heading: 'PCOS 与体重／代谢',
      s7Body1: 'PCOS 可能伴随代谢方面的变化，其中包括部分女性存在的胰岛素抵抗。',
      s7Body2: '不过，仅凭体重既不能诊断也不能排除 PCOS。身材偏瘦的女性也可能患有 PCOS，超重的女性也可能没有。',
      s7NeutralText: '后续的随访应关注整体健康，而不只是体重秤上的数字。',
      s8Heading: '皮肤、头发与体毛',
      s8Body1: '相对的雄激素偏多可能影响皮脂腺和毛囊。',
      s8Body2: '因人而异，这可能表现为持续的痤疮、毛发增多或脱发。',
      s8Items: [
        '激素型痤疮',
        '面部或身体毛发增多',
        '头发变稀或脱发',
      ],
      s9Heading: '如何管理 PCOS？',
      s9Body1: '管理 PCOS 并没有适合每个人的单一方法。具体选择取决于症状、目标和医疗情况。',
      s9Body2: '在人生的不同阶段，目标也可能不同：调节月经周期、改善某些症状、保护代谢健康，或为怀孕计划提供支持。',
      s9MiniTitle: '有益健康的习惯',
      s9Lifestyle: [
        '饮食多样、规律，并适合自己的需要',
        '进行你能长期坚持的规律运动',
        '保持足够规律的睡眠',
        '记录月经周期和症状随时间的变化',
        '不要因为体重或症状的变化而责怪自己',
      ],
      s9Body3: '根据你的需要，医疗专业人员也可能针对某些症状提供治疗，或为怀孕计划提供支持。',
      s9AlertTitle: '请勿自行用药',
      s9AlertText: '激素类药物、代谢类药物和膳食补充剂，都应先与医疗专业人员讨论。',
      s10Heading: '关于 PCOS 的常见误区',
      s10Myths: [
        'PCOS 一定意味着有“囊肿”：这个名称容易让人误解。诊断并不只依据是否存在囊肿。',
        '所有 PCOS 患者都超重：PCOS 可以出现在各种体型的女性身上。',
        'PCOS 一定会妨碍怀孕：排卵可能不规律，但仍然有可能怀孕。',
        '只要有一种症状就足以诊断 PCOS：诊断需要全面的评估。',
        'PCOS 会随着年龄增长自行消失：它的表现可能在一生中发生变化，但持续的随访依然重要。',
      ],
      s11Heading: '何时就医',
      s11Body1: '当月经周期变得非常不规律、停止好几个月，或出现异常症状时，尤其值得寻求医疗建议。',
      s11ConsultItems: [
        '月经周期非常不规律或没有月经',
        '异常的痤疮或毛发增多',
        '明显的脱发',
        '难以怀孕',
        '症状变化很快',
      ],
      s12Heading: '要点回顾',
      s12SummaryTitle: '核心要点',
      s12SummaryItems: [
        'PCOS 是一种常见的内分泌状况。',
        '它的表现可以有很多种。',
        '并非所有 PCOS 患者的症状都相同。',
        '仅凭体重不足以诊断或排除 PCOS。',
        '诊断需要全面的医学评估。',
        'PCOS 可能影响排卵，有时也会影响生育力。',
        '个性化的照护方式有助于满足每位女性的需求。',
      ],
      finalNoteTitle: '帮助你更好地了解',
      finalNoteText: '本文仅供一般性参考，不能替代就诊。每个人的情况各不相同：如有疑问或症状持续，请向医疗专业人员咨询。',
      shareMessage: '了解多囊卵巢综合征 — AWA',
    },
  id: {
    badge: 'PCOS • PANDUAN UTAMA',
    title: 'Memahami\nPCOS',
    metaDuration: '10 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten edukasi',
    intro: 'Sindrom ovarium polikistik (PCOS) adalah kondisi hormonal yang umum dan bisa memengaruhi siklus, ovulasi, kulit, rambut, metabolisme, dan terkadang kesuburanmu.',
    introSecondary: 'Cara munculnya sangat beragam dari satu perempuan ke perempuan lain. Memahami PCOS terutama membantumu mengenali gejalanya, tahu kapan perlu mencari saran medis, dan memantau perkembangannya tanpa menyalahkan diri sendiri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu PCOS?',
      'Mengapa PCOS terjadi?',
      'Tanda-tanda utama',
      'Bagaimana diagnosisnya?',
      'PCOS dan ovulasi',
      'PCOS dan kesuburan',
      'PCOS dan berat badan / metabolisme',
      'Kulit, rambut, dan bulu tubuh',
      'Bagaimana PCOS ditangani?',
      'Kesalahpahaman yang umum',
      'Kapan perlu ke dokter',
      'Poin-poin penting',
    ],
    s1Heading: 'Apa itu PCOS?',
    s1Body1: 'Sindrom ovarium polikistik (PCOS) adalah kondisi hormonal yang umum dan bisa mengubah cara kerja ovarium yang biasa serta keseimbangan beberapa hormon.',
    s1Body2: 'Pada sebagian perempuan, masalah utamanya adalah ovulasi yang tidak teratur. Pada yang lain, jerawat, pertumbuhan rambut berlebih, rambut rontok, atau tanda-tanda metabolik yang lebih dulu terlihat.',
    s1TipTitle: 'Perlu diketahui',
    s1TipText: 'Meskipun namanya demikian, PCOS tidak selalu berarti ovarium berisi “kista”. Istilah historis ini bisa menyesatkan, dan USG saja tidak cukup untuk menegakkan diagnosis.',
    s2Heading: 'Mengapa PCOS terjadi?',
    s2Body1: 'PCOS tidak memiliki satu penyebab tunggal. Kondisi ini tampaknya muncul dari beberapa faktor yang bisa saling bergabung: kecenderungan keluarga, cara kerja hormon, ovulasi, metabolisme, dan faktor individu.',
    s2Factors: [
      'Kecenderungan keluarga dan faktor genetik',
      'Gangguan pada ovulasi',
      'Kelebihan androgen relatif',
      'Resistensi insulin pada sebagian perempuan',
      'Faktor metabolik dan lingkungan',
    ],
    s2NeutralText: 'PCOS bukanlah kegagalan pribadi. Kondisi ini tidak sekadar akibat kurangnya tekad, pola makan yang buruk, atau aktivitas fisik yang kurang.',
    s3Heading: 'Tanda-tanda utama',
    s3Body1: 'PCOS bisa muncul dengan cara yang sangat berbeda dari satu perempuan ke perempuan lain. Ada yang mengalami beberapa gejala sekaligus, ada pula yang hanya merasakan sedikit sekali.',
    s3Signs: [
      'Siklus tidak teratur, jaraknya jarang, atau terkadang tidak ada sama sekali',
      'Ovulasi yang tidak teratur atau sulit diprediksi',
      'Jerawat yang menetap, terutama di wajah bagian bawah',
      'Pertumbuhan rambut yang bertambah di wajah, dada, atau tubuh',
      'Rambut rontok dengan pola hormonal',
      'Berat badan naik atau sulit turun',
      'Sulit hamil',
    ],
    s3AlertTitle: 'Penting',
    s3AlertText: 'Mengalami salah satu gejala ini tidak otomatis berarti kamu menderita PCOS. Beberapa kondisi lain juga bisa menyebabkan gejala yang mirip.',
    s4Heading: 'Bagaimana diagnosisnya?',
    s4Body1: 'Mendiagnosis PCOS adalah proses medis. Tenaga kesehatan biasanya memulai dengan membahas siklusmu, gejala, riwayat kesehatan, dan pengobatan yang sedang kamu jalani.',
    s4Body2: 'Tergantung situasinya, pemeriksaan darah hormonal dan USG juga bisa ditawarkan.',
    s4Points: [
      'Siklus tidak teratur atau ovulasi yang jarang',
      'Tanda kelebihan androgen: jerawat, pertumbuhan rambut berlebih, rambut rontok, atau hasil pemeriksaan darah',
      'Gambaran ovarium yang sesuai dengan PCOS pada USG, bila pemeriksaan ini diindikasikan',
    ],
    s4Body3: 'Dokter juga harus menyingkirkan kemungkinan penyebab lain dari siklus tidak teratur atau kelebihan androgen sebelum memastikan diagnosis PCOS.',
    s5Heading: 'PCOS dan ovulasi',
    s5Body1: 'Ovulasi adalah pelepasan sel telur (oosit) dari ovarium. Pada PCOS, ovulasi bisa lebih jarang terjadi atau lebih sulit diprediksi.',
    s5Body2: 'Hal ini bisa menjelaskan mengapa siklus terkadang panjang, tidak teratur, atau sulit diperkirakan.',
    s5HighlightTitle: 'Memantau siklusmu',
    s5HighlightText: 'Mencatat tanggal haid, gejala, dan tanda-tanda ovulasi bisa membantumu lebih memahami pola tubuhmu sendiri.',
    s6Heading: 'PCOS dan kesuburan',
    s6Body1: 'Karena ovulasi bisa tidak teratur, sebagian perempuan dengan PCOS mungkin lebih sulit hamil.',
    s6Body2: 'Namun, ini tidak berarti PCOS otomatis mencegah kehamilan. Banyak perempuan dengan PCOS bisa hamil secara alami atau dengan dukungan medis yang tepat.',
    s6TipTitle: 'Ingatlah',
    s6TipText: 'Sulit hamil bukan berarti tidak mungkin. Jika kamu berharap untuk hamil, dokter atau bidan dapat menyarankan strategi yang sesuai dengan situasimu.',
    s7Heading: 'PCOS dan berat badan / metabolisme',
    s7Body1: 'PCOS bisa berkaitan dengan perubahan metabolik, termasuk resistensi insulin pada sebagian perempuan.',
    s7Body2: 'Namun, berat badan saja tidak bisa menegakkan atau menyingkirkan diagnosis PCOS. Perempuan bertubuh langsing bisa mengalami PCOS, sama seperti perempuan yang berat badannya berlebih bisa saja tidak mengalaminya.',
    s7NeutralText: 'Pemantauan lanjutan sebaiknya mempertimbangkan kesehatan secara menyeluruh, bukan hanya angka di timbangan.',
    s8Heading: 'Kulit, rambut, dan bulu tubuh',
    s8Body1: 'Kelebihan androgen relatif dapat memengaruhi kelenjar sebasea dan folikel rambut.',
    s8Body2: 'Tergantung orangnya, hal ini bisa muncul sebagai jerawat yang menetap, pertumbuhan rambut yang bertambah, atau rambut rontok.',
    s8Items: [
      'Jerawat hormonal',
      'Rambut wajah atau tubuh yang bertambah',
      'Rambut menipis atau rontok',
    ],
    s9Heading: 'Bagaimana PCOS ditangani?',
    s9Body1: 'Tidak ada satu pendekatan penanganan PCOS yang cocok untuk semua perempuan. Pilihannya bergantung pada gejala, tujuan, dan kondisi medis.',
    s9Body2: 'Tujuannya bisa berbeda tergantung tahap kehidupan: mengatur siklus, memperbaiki gejala tertentu, menjaga kesehatan metabolik, atau mendukung rencana kehamilan.',
    s9MiniTitle: 'Kebiasaan yang menunjang kesehatan',
    s9Lifestyle: [
      'Makan dengan pola yang beragam dan teratur sesuai kebutuhanmu',
      'Melakukan aktivitas fisik secara teratur yang bisa kamu jalani dalam jangka panjang',
      'Menjaga tidur yang cukup teratur',
      'Memantau perubahan siklus dan gejalamu dari waktu ke waktu',
      'Tidak menyalahkan diri sendiri atas perubahan berat badan atau gejala',
    ],
    s9Body3: 'Sesuai kebutuhanmu, tenaga kesehatan juga bisa menawarkan pengobatan untuk gejala tertentu atau untuk mendukung rencana kehamilan.',
    s9AlertTitle: 'Jangan mengobati sendiri',
    s9AlertText: 'Pengobatan hormonal, obat metabolik, dan suplemen makanan semuanya perlu didiskusikan dengan tenaga kesehatan.',
    s10Heading: 'Kesalahpahaman yang umum tentang PCOS',
    s10Myths: [
      'PCOS selalu berarti memiliki “kista”: namanya bisa menyesatkan. Diagnosisnya tidak hanya bergantung pada adanya kista.',
      'Semua perempuan dengan PCOS berat badannya berlebih: PCOS bisa memengaruhi perempuan dengan semua bentuk tubuh.',
      'PCOS selalu mencegah kehamilan: ovulasi mungkin tidak teratur, tetapi kehamilan tetap mungkin terjadi.',
      'Satu gejala saja cukup untuk mendiagnosis PCOS: diagnosis memerlukan evaluasi yang menyeluruh.',
      'PCOS hilang begitu saja seiring usia: gambaran klinisnya bisa berubah sepanjang hidup, tetapi pemantauan berkelanjutan tetap penting.',
    ],
    s11Heading: 'Kapan perlu ke dokter',
    s11Body1: 'Saran medis terutama layak dicari ketika siklus menjadi sangat tidak teratur, berhenti selama beberapa bulan, atau ketika muncul gejala yang tidak biasa.',
    s11ConsultItems: [
      'Siklus sangat tidak teratur atau tidak ada',
      'Jerawat atau pertumbuhan rambut yang tidak biasa',
      'Rambut rontok yang banyak',
      'Sulit hamil',
      'Gejala yang berubah dengan cepat',
    ],
    s12Heading: 'Poin-poin penting',
    s12SummaryTitle: 'Hal-hal pokok',
    s12SummaryItems: [
      'PCOS adalah kondisi hormonal yang umum.',
      'Kondisi ini bisa muncul dalam berbagai bentuk.',
      'Tidak semua perempuan dengan PCOS memiliki gejala yang sama.',
      'Berat badan saja tidak cukup untuk menegakkan atau menyingkirkan diagnosis PCOS.',
      'Diagnosis memerlukan evaluasi medis yang menyeluruh.',
      'PCOS dapat memengaruhi ovulasi dan terkadang kesuburan.',
      'Pendekatan perawatan yang dipersonalisasi membantu memenuhi kebutuhan setiap perempuan.',
    ],
    finalNoteTitle: 'Panduan untuk lebih memahami',
    finalNoteText: 'Artikel ini ditujukan sebagai informasi umum dan tidak menggantikan konsultasi medis. Setiap situasi berbeda: jika ragu atau gejala menetap, mintalah saran dari tenaga kesehatan.',
    shareMessage: 'Memahami PCOS — AWA',
  },
  hi: {
    badge: 'PCOS • ज़रूरी गाइड',
    title: 'PCOS को\nसमझना',
    metaDuration: '10 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'शैक्षिक जानकारी',
    intro: 'पॉलीसिस्टिक ओवरी सिंड्रोम, जिसे अक्सर PCOS कहा जाता है, हार्मोन से जुड़ी एक आम स्थिति है, जो आपके मासिक चक्र, ओव्यूलेशन (अंडोत्सर्ग), त्वचा, बालों, मेटाबॉलिज़्म और कभी-कभी प्रजनन क्षमता पर असर डाल सकती है।',
    introSecondary: 'यह हर महिला में अलग-अलग रूप में दिखता है। PCOS को समझने से मुख्य रूप से इसके लक्षण पहचानने, डॉक्टर की सलाह कब लेनी है यह जानने और खुद को दोष दिए बिना इसके बदलावों पर नज़र रखने में मदद मिलती है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'PCOS क्या है?',
      'PCOS क्यों होता है?',
      'मुख्य लक्षण',
      'इसकी पहचान कैसे होती है?',
      'PCOS और ओव्यूलेशन',
      'PCOS और प्रजनन क्षमता',
      'PCOS और वज़न / मेटाबॉलिज़्म',
      'त्वचा, बाल और शरीर के रोएँ',
      'PCOS को कैसे संभाला जाता है?',
      'आम गलतफ़हमियाँ',
      'डॉक्टर से कब मिलें',
      'मुख्य बातें',
    ],
    s1Heading: 'PCOS क्या है?',
    s1Body1: 'पॉलीसिस्टिक ओवरी सिंड्रोम (PCOS) हार्मोन से जुड़ी एक आम स्थिति है, जो अंडाशय के सामान्य कामकाज और कुछ हार्मोनों के संतुलन को बदल सकती है।',
    s1Body2: 'कुछ महिलाओं में मुख्य समस्या अनियमित ओव्यूलेशन होती है। दूसरों में सबसे पहले मुँहासे, अनचाहे बालों का बढ़ना, बालों का झड़ना या मेटाबॉलिज़्म से जुड़े संकेत सामने आते हैं।',
    s1TipTitle: 'जानने लायक बात',
    s1TipText: 'नाम के बावजूद, PCOS का मतलब ज़रूरी नहीं कि अंडाशय में “सिस्ट” हों। यह पुराना नाम भ्रम पैदा कर सकता है, और सिर्फ़ अल्ट्रासाउंड से निदान नहीं हो सकता।',
    s2Heading: 'PCOS क्यों होता है?',
    s2Body1: 'PCOS का कोई एक कारण नहीं है। ऐसा लगता है कि यह कई कारकों के मेल से होता है: पारिवारिक प्रवृत्ति, हार्मोन का कामकाज, ओव्यूलेशन, मेटाबॉलिज़्म और व्यक्तिगत कारक।',
    s2Factors: [
      'पारिवारिक प्रवृत्ति और आनुवंशिक कारक',
      'ओव्यूलेशन में गड़बड़ी',
      'एंड्रोजन हार्मोन का अपेक्षाकृत ज़्यादा होना',
      'कुछ महिलाओं में इंसुलिन रेज़िस्टेंस',
      'मेटाबॉलिज़्म और पर्यावरण से जुड़े कारक',
    ],
    s2NeutralText: 'PCOS आपकी कोई कमी नहीं है। यह सिर्फ़ इच्छाशक्ति की कमी, गलत खान-पान या कम शारीरिक गतिविधि का नतीजा नहीं है।',
    s3Heading: 'मुख्य लक्षण',
    s3Body1: 'PCOS हर महिला में बहुत अलग तरह से दिख सकता है। कुछ में कई लक्षण होते हैं, जबकि कुछ को बहुत कम लक्षण महसूस होते हैं।',
    s3Signs: [
      'अनियमित, लंबे अंतराल वाले या कभी-कभी बिल्कुल न आने वाले मासिक चक्र',
      'अनियमित या अनुमान लगाने में मुश्किल ओव्यूलेशन',
      'लगातार मुँहासे, ख़ासकर चेहरे के निचले हिस्से में',
      'चेहरे, छाती या शरीर पर बालों का बढ़ना',
      'हार्मोन से जुड़े पैटर्न में बालों का झड़ना',
      'वज़न बढ़ना या वज़न घटाने में कठिनाई',
      'गर्भधारण में कठिनाई',
    ],
    s3AlertTitle: 'ज़रूरी बात',
    s3AlertText: 'इनमें से कोई एक लक्षण होने का मतलब अपने आप यह नहीं कि आपको PCOS है। कई दूसरी स्थितियाँ भी ऐसे ही लक्षण पैदा कर सकती हैं।',
    s4Heading: 'इसकी पहचान कैसे होती है?',
    s4Body1: 'PCOS की पहचान एक चिकित्सकीय प्रक्रिया है। स्वास्थ्य विशेषज्ञ आमतौर पर आपके मासिक चक्र, लक्षणों, पिछली स्वास्थ्य जानकारी और आप जो इलाज ले रही हैं, उन पर बात करके शुरुआत करते हैं।',
    s4Body2: 'स्थिति के अनुसार हार्मोन के ब्लड टेस्ट और अल्ट्रासाउंड भी सुझाए जा सकते हैं।',
    s4Points: [
      'अनियमित मासिक चक्र या कम बार होने वाला ओव्यूलेशन',
      'एंड्रोजन के ज़्यादा होने के संकेत: मुँहासे, अनचाहे बालों का बढ़ना, बालों का झड़ना या ब्लड टेस्ट के नतीजे',
      'अल्ट्रासाउंड में अंडाशय का PCOS से मेल खाता रूप, जब यह जाँच ज़रूरी समझी जाए',
    ],
    s4Body3: 'PCOS की पुष्टि करने से पहले डॉक्टर को अनियमित चक्र या एंड्रोजन के ज़्यादा होने के दूसरे संभावित कारणों को भी बाहर करना होता है।',
    s5Heading: 'PCOS और ओव्यूलेशन',
    s5Body1: 'ओव्यूलेशन का मतलब है अंडाशय से अंडाणु (ऊसाइट) का निकलना। PCOS में ओव्यूलेशन कम बार हो सकता है या उसका अनुमान लगाना मुश्किल हो सकता है।',
    s5Body2: 'इससे समझ आ सकता है कि मासिक चक्र कभी-कभी लंबे, अनियमित या अंदाज़ा लगाने में कठिन क्यों होते हैं।',
    s5HighlightTitle: 'अपने चक्र पर नज़र रखना',
    s5HighlightText: 'अपने पीरियड की तारीखें, लक्षण और ओव्यूलेशन के किसी भी संकेत को दर्ज करने से आप अपने पैटर्न को बेहतर समझ सकती हैं।',
    s6Heading: 'PCOS और प्रजनन क्षमता',
    s6Body1: 'ओव्यूलेशन अनियमित हो सकने के कारण, PCOS वाली कुछ महिलाओं को गर्भधारण में ज़्यादा कठिनाई हो सकती है।',
    s6Body2: 'फिर भी इसका मतलब यह नहीं कि PCOS अपने आप गर्भावस्था को रोक देता है। PCOS वाली कई महिलाएँ प्राकृतिक रूप से या उचित चिकित्सकीय सहायता से गर्भवती होती हैं।',
    s6TipTitle: 'याद रखें',
    s6TipText: 'गर्भधारण में कठिनाई का मतलब यह नहीं कि यह नामुमकिन है। अगर आप गर्भवती होना चाहती हैं, तो डॉक्टर या दाई-नर्स (मिडवाइफ़) आपकी स्थिति के अनुसार योजना सुझा सकते हैं।',
    s7Heading: 'PCOS और वज़न / मेटाबॉलिज़्म',
    s7Body1: 'PCOS मेटाबॉलिज़्म में बदलावों से जुड़ा हो सकता है, जिनमें कुछ महिलाओं में इंसुलिन रेज़िस्टेंस भी शामिल है।',
    s7Body2: 'फिर भी, सिर्फ़ वज़न से PCOS की पहचान या उसका इनकार नहीं किया जा सकता। एक दुबली-पतली महिला को भी PCOS हो सकता है, और ज़्यादा वज़न वाली महिला को नहीं भी हो सकता।',
    s7NeutralText: 'फ़ॉलो-अप देखभाल में सिर्फ़ तराज़ू के आँकड़े पर नहीं, बल्कि पूरी सेहत पर ध्यान देना चाहिए।',
    s8Heading: 'त्वचा, बाल और शरीर के रोएँ',
    s8Body1: 'एंड्रोजन का अपेक्षाकृत ज़्यादा होना त्वचा की तैलीय ग्रंथियों और बालों की जड़ों पर असर डाल सकता है।',
    s8Body2: 'महिला के अनुसार यह लगातार मुँहासों, बालों के बढ़ने या बालों के झड़ने के रूप में दिख सकता है।',
    s8Items: [
      'हार्मोन से जुड़े मुँहासे',
      'चेहरे या शरीर पर बालों का बढ़ना',
      'बालों का पतला होना या झड़ना',
    ],
    s9Heading: 'PCOS को कैसे संभाला जाता है?',
    s9Body1: 'PCOS को संभालने का कोई एक तरीका नहीं है जो हर महिला के लिए काम करे। चुनाव लक्षणों, लक्ष्यों और चिकित्सकीय स्थिति पर निर्भर करता है।',
    s9Body2: 'जीवन के चरण के अनुसार लक्ष्य अलग हो सकता है: मासिक चक्र को नियमित करना, कुछ लक्षणों में सुधार करना, मेटाबॉलिक सेहत की सुरक्षा करना, या गर्भावस्था की योजना में सहयोग देना।',
    s9MiniTitle: 'सेहत का साथ देने वाली आदतें',
    s9Lifestyle: [
      'अपनी ज़रूरत के अनुसार विविध और नियमित खान-पान',
      'नियमित शारीरिक गतिविधि, जिसे आप लंबे समय तक जारी रख सकें',
      'पर्याप्त नियमित नींद लेना',
      'समय के साथ अपने मासिक चक्र और लक्षणों में आने वाले बदलावों पर नज़र रखना',
      'वज़न या लक्षणों में बदलाव के लिए खुद को दोष न देना',
    ],
    s9Body3: 'आपकी ज़रूरतों के अनुसार, स्वास्थ्य विशेषज्ञ कुछ लक्षणों के लिए या गर्भावस्था की योजना में सहयोग देने के लिए इलाज भी सुझा सकते हैं।',
    s9AlertTitle: 'खुद से दवा न लें',
    s9AlertText: 'हार्मोनल इलाज, मेटाबॉलिज़्म की दवाओं और आहार पूरकों (सप्लीमेंट) के बारे में स्वास्थ्य विशेषज्ञ से ज़रूर बात करनी चाहिए।',
    s10Heading: 'PCOS को लेकर आम गलतफ़हमियाँ',
    s10Myths: [
      'PCOS का मतलब हमेशा “सिस्ट” होना है: यह नाम भ्रम पैदा कर सकता है। निदान सिर्फ़ सिस्ट होने पर निर्भर नहीं करता।',
      'PCOS वाली सभी महिलाओं का वज़न ज़्यादा होता है: PCOS किसी भी शारीरिक बनावट की महिला को हो सकता है।',
      'PCOS हमेशा गर्भावस्था को रोकता है: ओव्यूलेशन अनियमित हो सकता है, लेकिन गर्भावस्था फिर भी संभव है।',
      'सिर्फ़ एक लक्षण से PCOS की पहचान हो सकती है: निदान के लिए पूरी जाँच ज़रूरी है।',
      'उम्र के साथ PCOS अपने आप चला जाता है: जीवन भर इसका रूप बदल सकता है, लेकिन लगातार फ़ॉलो-अप ज़रूरी रहता है।',
    ],
    s11Heading: 'डॉक्टर से कब मिलें',
    s11Body1: 'डॉक्टर की सलाह ख़ास तौर पर तब फ़ायदेमंद है जब मासिक चक्र बहुत अनियमित हो जाएँ, कई महीनों तक बंद रहें, या कोई असामान्य लक्षण दिखें।',
    s11ConsultItems: [
      'बहुत अनियमित या बिल्कुल न आने वाले मासिक चक्र',
      'असामान्य मुँहासे या बालों का बढ़ना',
      'बालों का काफ़ी झड़ना',
      'गर्भधारण में कठिनाई',
      'तेज़ी से बदलते लक्षण',
    ],
    s12Heading: 'मुख्य बातें',
    s12SummaryTitle: 'ज़रूरी बिंदु',
    s12SummaryItems: [
      'PCOS हार्मोन से जुड़ी एक आम स्थिति है।',
      'यह कई अलग-अलग रूपों में दिख सकता है।',
      'PCOS वाली सभी महिलाओं में एक जैसे लक्षण नहीं होते।',
      'सिर्फ़ वज़न से PCOS की पहचान या उसका इनकार नहीं किया जा सकता।',
      'निदान के लिए पूरी चिकित्सकीय जाँच ज़रूरी है।',
      'PCOS ओव्यूलेशन और कभी-कभी प्रजनन क्षमता पर असर डाल सकता है।',
      'व्यक्तिगत देखभाल का तरीका हर महिला की ज़रूरतों को पूरा करने में मदद करता है।',
    ],
    finalNoteTitle: 'बेहतर समझ के लिए एक गाइड',
    finalNoteText: 'यह लेख सामान्य जानकारी के लिए है और डॉक्टर के परामर्श का विकल्प नहीं है। हर स्थिति अलग होती है: संदेह हो या लक्षण बने रहें तो स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'PCOS को समझना — AWA',
  },
  sq: {
    badge: 'PCOS • UDHËZUES THEMELOR',
    title: 'Të kuptojmë\nPCOS',
    metaDuration: '10 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje edukative',
    intro: 'Sindroma e ovareve polikistike, shpesh e quajtur PCOS, është një gjendje hormonale e zakonshme që mund të ndikojë në ciklet, ovulacionin, lëkurën, flokët, metabolizmin dhe ndonjëherë pjellorinë tënde.',
    introSecondary: 'Mënyra se si shfaqet ndryshon shumë nga një grua te tjetra. Të kuptuarit e PCOS të ndihmon kryesisht t’i njohësh simptomat, të dish kur duhet të kërkosh këshillë mjekësore dhe të ndjekësh evolucionin e tij pa fajësuar veten.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është PCOS?',
      'Pse ndodh PCOS?',
      'Shenjat kryesore',
      'Si diagnostikohet?',
      'PCOS dhe ovulacioni',
      'PCOS dhe pjelloria',
      'PCOS dhe pesha / metabolizmi',
      'Lëkura, flokët dhe push i trupit',
      'Si menaxhohet PCOS?',
      'Keqkuptime të zakonshme',
      'Kur duhet të shkosh te mjeku',
      'Pikat kryesore',
    ],
    s1Heading: 'Çfarë është PCOS?',
    s1Body1: 'Sindroma e ovareve polikistike (PCOS) është një gjendje hormonale e zakonshme që mund të ndryshojë funksionimin e zakonshëm të ovareve dhe ekuilibrin e disa hormoneve.',
    s1Body2: 'Për disa gra, problemi kryesor është ovulacioni i parregullt. Për të tjera, janë akneja, rritja e tepërt e qimeve, rënia e flokëve ose shenjat metabolike që dallohen të parat.',
    s1TipTitle: 'Mirë është ta dish',
    s1TipText: 'Pavarësisht emrit, PCOS nuk do të thotë domosdoshmërisht se ovaret përmbajnë “kista”. Termi historik mund të çojë në gabim, dhe një ekografi e vetme nuk mjafton për të vënë diagnozën.',
    s2Heading: 'Pse ndodh PCOS?',
    s2Body1: 'Nuk ka një shkak të vetëm të PCOS. Duket se vjen nga disa faktorë që mund të kombinohen: predispozita familjare, funksionimi hormonal, ovulacioni, metabolizmi dhe faktorë individualë.',
    s2Factors: [
      'Predispozita familjare dhe faktorët gjenetikë',
      'Çrregullime të ovulacionit',
      'Teprica relative e androgjeneve',
      'Rezistenca ndaj insulinës te disa gra',
      'Faktorë metabolikë dhe mjedisorë',
    ],
    s2NeutralText: 'PCOS nuk është një dështim personal. Ai nuk vjen thjesht nga mungesa e vullnetit, nga një ushqyerje e keqe ose nga aktiviteti fizik i pamjaftueshëm.',
    s3Heading: 'Shenjat kryesore',
    s3Body1: 'PCOS mund të shfaqet shumë ndryshe nga një grua te tjetra. Disa kanë disa simptoma, ndërsa të tjera vënë re shumë pak.',
    s3Signs: [
      'Cikle të parregullta, shumë të rralla ose ndonjëherë mungesë e tyre',
      'Ovulacion i parregullt ose i vështirë për t’u parashikuar',
      'Akne e vazhdueshme, sidomos në pjesën e poshtme të fytyrës',
      'Rritje e shtuar e qimeve në fytyrë, gjoks ose trup',
      'Rënie flokësh me prirje hormonale',
      'Shtim në peshë ose vështirësi për të humbur peshë',
      'Vështirësi për të mbetur shtatzënë',
    ],
    s3AlertTitle: 'E rëndësishme',
    s3AlertText: 'Të kesh një nga këto simptoma nuk do të thotë automatikisht se ke PCOS. Disa gjendje të tjera mund të shkaktojnë simptoma të ngjashme.',
    s4Heading: 'Si diagnostikohet?',
    s4Body1: 'Diagnostikimi i PCOS është një proces mjekësor. Një profesionist i shëndetësisë zakonisht fillon duke biseduar për ciklet, simptomat, historikun tënd mjekësor dhe çdo trajtim që po merr.',
    s4Body2: 'Në varësi të situatës, mund të propozohen edhe analiza gjaku hormonale dhe një ekografi.',
    s4Points: [
      'Cikle të parregullta ose ovulacion i rrallë',
      'Shenja të tepricës së androgjeneve: akne, rritje e tepërt e qimeve, rënie flokësh ose rezultate të analizave të gjakut',
      'Pamje e ovareve në përputhje me PCOS në ekografi, kur ky ekzaminim është i nevojshëm',
    ],
    s4Body3: 'Mjeku duhet të përjashtojë edhe shkaqe të tjera të mundshme të cikleve të parregullta ose të tepricës së androgjeneve përpara se të konfirmojë një diagnozë PCOS.',
    s5Heading: 'PCOS dhe ovulacioni',
    s5Body1: 'Ovulacioni është çlirimi i një veze (oocit) nga ovari. Në PCOS, ovulacioni mund të jetë më i rrallë ose më i vështirë për t’u parashikuar.',
    s5Body2: 'Kjo mund të shpjegojë pse ciklet janë ndonjëherë të gjata, të parregullta ose të vështira për t’u parashikuar.',
    s5HighlightTitle: 'Ndjekja e ciklit tënd',
    s5HighlightText: 'Regjistrimi i datave të menstruacioneve, i simptomave dhe i çdo shenje ovulacioni mund të të ndihmojë të kuptosh më mirë ritmet e tua.',
    s6Heading: 'PCOS dhe pjelloria',
    s6Body1: 'Meqenëse ovulacioni mund të jetë i parregullt, disa gra me PCOS mund të kenë më shumë vështirësi për të mbetur shtatzënë.',
    s6Body2: 'Kjo nuk do të thotë, megjithatë, se PCOS e pengon automatikisht shtatzëninë. Shumë gra me PCOS mbeten shtatzënë natyrshëm ose me mbështetje të përshtatshme mjekësore.',
    s6TipTitle: 'Mbaje në mend',
    s6TipText: 'Vështirësia për të mbetur shtatzënë nuk do të thotë se është e pamundur. Nëse shpreson të bëhesh shtatzënë, një mjek ose mami mund të propozojë një strategji të përshtatshme për situatën tënde.',
    s7Heading: 'PCOS dhe pesha / metabolizmi',
    s7Body1: 'PCOS mund të shoqërohet me ndryshime metabolike, përfshirë rezistencën ndaj insulinës te disa gra.',
    s7Body2: 'Megjithatë, pesha vetëm nuk mund ta diagnostikojë ose ta përjashtojë PCOS. Një grua e hollë mund të ketë PCOS, ashtu si një grua me mbipeshë mund të mos e ketë.',
    s7NeutralText: 'Ndjekja mjekësore duhet të marrë parasysh shëndetin e përgjithshëm, jo vetëm numrin në peshore.',
    s8Heading: 'Lëkura, flokët dhe push i trupit',
    s8Body1: 'Teprica relative e androgjeneve mund të ndikojë në gjëndrat dhjamore dhe në folikulat e flokëve.',
    s8Body2: 'Në varësi të gruas, kjo mund të shfaqet si akne e vazhdueshme, rritje e shtuar e qimeve ose rënie flokësh.',
    s8Items: [
      'Akne hormonale',
      'Më shumë qime në fytyrë ose në trup',
      'Flokë të holluar ose rënie flokësh',
    ],
    s9Heading: 'Si menaxhohet PCOS?',
    s9Body1: 'Nuk ka një qasje të vetme për menaxhimin e PCOS që të funksionojë për çdo grua. Zgjedhja varet nga simptomat, qëllimet dhe rrethanat mjekësore.',
    s9Body2: 'Qëllimi mund të ndryshojë sipas etapës së jetës: rregullimi i cikleve, përmirësimi i disa simptomave, mbrojtja e shëndetit metabolik ose mbështetja e një plani shtatzënie.',
    s9MiniTitle: 'Zakone që mbështesin shëndetin',
    s9Lifestyle: [
      'Të hash në mënyrë të larmishme e të rregullt, sipas nevojave të tua',
      'Të bësh aktivitet fizik të rregullt që mund ta mbash me kohën',
      'Të ruash një gjumë mjaftueshëm të rregullt',
      'Të ndjekësh se si ndryshojnë ciklet dhe simptomat e tua me kalimin e kohës',
      'Të mos e fajësosh veten për ndryshimet e peshës ose të simptomave',
    ],
    s9Body3: 'Në varësi të nevojave të tua, një profesionist i shëndetësisë mund të propozojë edhe trajtime për disa simptoma ose për të mbështetur një plan shtatzënie.',
    s9AlertTitle: 'Mos merr ilaçe vetë',
    s9AlertText: 'Trajtimet hormonale, ilaçet metabolike dhe suplementet ushqimore duhet të diskutohen të gjitha me një profesionist të shëndetësisë.',
    s10Heading: 'Keqkuptime të zakonshme për PCOS',
    s10Myths: [
      'PCOS do të thotë gjithmonë të kesh “kista”: emri mund të çojë në gabim. Diagnoza nuk bazohet vetëm te prania e kistave.',
      'Të gjitha gratë me PCOS kanë mbipeshë: PCOS mund të prekë gra të çdo tipi trupi.',
      'PCOS e pengon gjithmonë shtatzëninë: ovulacioni mund të jetë i parregullt, por shtatzënia mbetet e mundur.',
      'Një simptomë e vetme mjafton për të diagnostikuar PCOS: diagnoza kërkon një vlerësim të plotë.',
      'PCOS thjesht kalon me moshën: mënyra se si shfaqet mund të ndryshojë gjatë jetës, por ndjekja e vazhdueshme mbetet e rëndësishme.',
    ],
    s11Heading: 'Kur duhet të shkosh te mjeku',
    s11Body1: 'Këshilla mjekësore ia vlen veçanërisht kur ciklet bëhen shumë të parregullta, ndalojnë për disa muaj ose kur shfaqen simptoma të pazakonta.',
    s11ConsultItems: [
      'Cikle shumë të parregullta ose mungesë ciklesh',
      'Akne ose rritje qimesh e pazakontë',
      'Rënie e rëndësishme flokësh',
      'Vështirësi për të mbetur shtatzënë',
      'Simptoma që ndryshojnë me shpejtësi',
    ],
    s12Heading: 'Pikat kryesore',
    s12SummaryTitle: 'Pikat thelbësore',
    s12SummaryItems: [
      'PCOS është një gjendje hormonale e zakonshme.',
      'Mund të shfaqet në shumë mënyra të ndryshme.',
      'Jo të gjitha gratë me PCOS kanë të njëjtat simptoma.',
      'Pesha vetëm nuk mjafton për të diagnostikuar ose për të përjashtuar PCOS.',
      'Për diagnozën nevojitet një vlerësim i plotë mjekësor.',
      'PCOS mund të ndikojë në ovulacion dhe ndonjëherë në pjellori.',
      'Një qasje kujdesi e personalizuar ndihmon t’i përmbushë nevojat e çdo gruaje.',
    ],
    finalNoteTitle: 'Një udhëzues për ta kuptuar më mirë',
    finalNoteText: 'Ky artikull është për informim të përgjithshëm dhe nuk zëvendëson një konsultë mjekësore. Çdo situatë është ndryshe: nëse ke dyshime ose nëse simptomat vazhdojnë, kërko këshillë nga një profesionist i shëndetësisë.',
    shareMessage: 'Të kuptojmë PCOS — AWA',
  },
  ja: {
    badge: 'PCOS • 基本ガイド',
    title: 'PCOSを\n理解する',
    metaDuration: '読了10分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '教育的な内容',
    intro: '多嚢胞性卵巣症候群（PCOS）は、よくみられるホルモンの状態で、周期、排卵、肌、髪、代謝、そして場合によっては妊娠しやすさに影響することがあります。',
    introSecondary: '現れ方は人によって大きく異なります。PCOSを理解することは、主に症状に気づき、いつ医療機関に相談すればよいかを知り、自分を責めずに経過を記録していくことに役立ちます。',
    contentsTitle: 'この記事の内容',
    topics: [
      'PCOSとは？',
      'なぜPCOSになるの？',
      '主なサイン',
      'どのように診断される？',
      'PCOSと排卵',
      'PCOSと妊娠しやすさ',
      'PCOSと体重・代謝',
      '肌、髪、体毛',
      'PCOSはどのように管理する？',
      'よくある誤解',
      '医師に相談するタイミング',
      '重要なポイント',
    ],
    s1Heading: 'PCOSとは？',
    s1Body1: '多嚢胞性卵巣症候群（PCOS）は、よくみられるホルモンの状態で、卵巣の通常の働きや、一部のホルモンのバランスが変わることがあります。',
    s1Body2: '排卵が不規則になることが主な問題という人もいれば、ニキビ、体毛の増加、抜け毛、代謝に関するサインが最初に目立つ人もいます。',
    s1TipTitle: '知っておきたいこと',
    s1TipText: '名前に反して、PCOSは必ずしも卵巣に「嚢胞」があることを意味しません。昔からの呼び名は誤解を招くことがあり、超音波検査だけで診断することはできません。',
    s2Heading: 'なぜPCOSになるの？',
    s2Body1: 'PCOSの原因はひとつではありません。家族的な体質、ホルモンの働き、排卵、代謝、個人差など、いくつかの要因が重なって起こると考えられています。',
    s2Factors: [
      '家族的な体質や遺伝的な要因',
      '排卵の乱れ',
      '相対的なアンドロゲン（男性ホルモン）過剰',
      '一部の人にみられるインスリン抵抗性',
      '代謝や環境に関する要因',
    ],
    s2NeutralText: 'PCOSは本人の落ち度ではありません。意志の弱さ、食事の悪さ、運動不足だけが原因で起こるものではありません。',
    s3Heading: '主なサイン',
    s3Body1: 'PCOSの現れ方は、人によって大きく異なります。いくつもの症状がある人もいれば、ほとんど気づかない人もいます。',
    s3Signs: [
      '周期が不規則、間隔が長い、または生理が来ないことがある',
      '排卵が不規則、または予測しにくい',
      '特に顔の下半分にできる、なかなか治らないニキビ',
      '顔、胸、体の毛が濃くなる',
      'ホルモンの影響による抜け毛',
      '体重が増える、または減らしにくい',
      '妊娠しにくい',
    ],
    s3AlertTitle: '大切なこと',
    s3AlertText: 'これらの症状がひとつあるからといって、必ずしもPCOSとは限りません。ほかにも、似た症状を起こす状態がいくつもあります。',
    s4Heading: 'どのように診断される？',
    s4Body1: 'PCOSの診断は医学的な手順で行われます。医療従事者はふつう、周期、症状、既往歴、服用中の治療について話を聞くところから始めます。',
    s4Body2: '状況によっては、ホルモンの血液検査や超音波検査が勧められることもあります。',
    s4Points: [
      '不規則な周期、または排卵が少ない',
      'アンドロゲン過剰のサイン：ニキビ、体毛の増加、抜け毛、または血液検査の結果',
      'この検査が必要な場合に、超音波検査でPCOSと一致する卵巣の所見がある',
    ],
    s4Body3: 'PCOSと診断する前に、医師は、周期の乱れやアンドロゲン過剰を起こすほかの原因も除外する必要があります。',
    s5Heading: 'PCOSと排卵',
    s5Body1: '排卵とは、卵巣から卵子（卵母細胞）が放出されることです。PCOSでは、排卵の回数が少なくなったり、予測しにくくなったりすることがあります。',
    s5Body2: 'そのため、周期が長かったり、不規則だったり、予測しにくかったりすることがあります。',
    s5HighlightTitle: '周期を記録する',
    s5HighlightText: '生理の日付、症状、排卵のサインなどを記録しておくと、自分のパターンを理解しやすくなります。',
    s6Heading: 'PCOSと妊娠しやすさ',
    s6Body1: '排卵が不規則になることがあるため、PCOSのある人の中には、妊娠しにくさを感じる人もいます。',
    s6Body2: 'ただし、PCOSだから必ず妊娠できないというわけではありません。PCOSのある多くの人が、自然に、または適切な医療的サポートを受けて妊娠しています。',
    s6TipTitle: '心に留めておきたいこと',
    s6TipText: '妊娠しにくいことは、妊娠できないという意味ではありません。妊娠を望んでいる場合は、医師や助産師が、状況に合った進め方を提案してくれます。',
    s7Heading: 'PCOSと体重・代謝',
    s7Body1: 'PCOSは、一部の人にみられるインスリン抵抗性など、代謝の変化と関連することがあります。',
    s7Body2: 'しかし、体重だけでPCOSかどうかを診断したり、否定したりすることはできません。やせている人にPCOSがあることもあれば、体重が多い人にPCOSがないこともあります。',
    s7NeutralText: '経過観察では、体重計の数字だけでなく、全体的な健康状態を考えることが大切です。',
    s8Heading: '肌、髪、体毛',
    s8Body1: '相対的なアンドロゲン過剰は、皮脂腺や毛包に影響することがあります。',
    s8Body2: '人によって、なかなか治らないニキビ、体毛の増加、抜け毛などの形で現れることがあります。',
    s8Items: [
      'ホルモンの影響によるニキビ',
      '顔や体の毛が濃くなる',
      '髪が細くなる、または抜け毛が増える',
    ],
    s9Heading: 'PCOSはどのように管理する？',
    s9Body1: 'すべての人に当てはまる、ひとつだけの管理方法はありません。症状、目標、医学的な状況によって選択が変わります。',
    s9Body2: '目標は人生のステージによって異なることがあります。周期を整える、いくつかの症状を和らげる、代謝の健康を守る、妊娠の計画を支えるなどです。',
    s9MiniTitle: '健康を支える習慣',
    s9Lifestyle: [
      '必要に合わせて、バランスのよい食事を規則正しくとる',
      '無理なく長く続けられる運動を定期的に行う',
      '睡眠のリズムをできるだけ整える',
      '周期や症状の変化を記録する',
      '体重や症状の変化を、自分のせいにしない',
    ],
    s9Body3: '必要に応じて、医療従事者が、一部の症状に対する治療や、妊娠の計画を支える治療を提案することもあります。',
    s9AlertTitle: '自己判断で薬を使わない',
    s9AlertText: 'ホルモン剤、代謝に関する薬、サプリメントは、いずれも医療従事者に相談してください。',
    s10Heading: 'PCOSについてのよくある誤解',
    s10Myths: [
      'PCOSは必ず「嚢胞」があること：この名前は誤解を招くことがあります。診断は嚢胞があるかどうかだけで決まるわけではありません。',
      'PCOSの人はみんな太っている：PCOSはあらゆる体型の人に起こりえます。',
      'PCOSだと必ず妊娠できない：排卵が不規則になることはありますが、妊娠は可能です。',
      '症状がひとつあればPCOSと診断できる：診断には総合的な評価が必要です。',
      'PCOSは年齢とともに自然に治る：現れ方は生涯を通じて変わることがありますが、継続的な経過観察は引き続き大切です。',
    ],
    s11Heading: '医師に相談するタイミング',
    s11Body1: '周期がとても不規則になったとき、数か月来ないとき、普段と違う症状が出たときは、特に医療機関に相談する価値があります。',
    s11ConsultItems: [
      '周期がとても不規則、または生理が来ない',
      '普段と違うニキビや体毛の増加',
      'ひどい抜け毛',
      '妊娠しにくい',
      '症状が急に変化している',
    ],
    s12Heading: '重要なポイント',
    s12SummaryTitle: '大切なポイント',
    s12SummaryItems: [
      'PCOSは、よくみられるホルモンの状態です。',
      '現れ方はさまざまです。',
      'PCOSのある人がみな同じ症状とは限りません。',
      '体重だけでPCOSかどうかを診断したり、否定したりすることはできません。',
      '診断には、総合的な医学的評価が必要です。',
      'PCOSは排卵に影響し、場合によっては妊娠しやすさにも影響することがあります。',
      '一人ひとりに合ったケアが、それぞれの必要に応える助けになります。',
    ],
    finalNoteTitle: '理解を深めるためのガイド',
    finalNoteText: 'この記事は一般的な情報提供を目的としており、診察に代わるものではありません。状況は人によって異なります。不安がある場合や症状が続く場合は、医療従事者に相談してください。',
    shareMessage: 'PCOSを理解する — AWA',
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

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.introSecondary}>{content.introSecondary}</AwaText>

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
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.s1Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s1Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s1Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.s1TipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.s1TipText}</AwaText>
            </View>
          </AwaCard>

          {/* 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.s2Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s2Body1}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.s2Factors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="circle-small"
                  size={20}
                  color={theme.colors.primary}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>{content.s2NeutralText}</AwaText>
          </AwaCard>

          {/* 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.s3Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s3Body1}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.s3Signs.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.s3AlertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.s3AlertText}</AwaText>
            </View>
          </AwaCard>

          {/* 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.s4Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s4Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s4Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.numberedCard}>
            {content.s4Points.map((item, index) => (
              <View key={item} style={styles.numberedRow}>
                <View style={styles.numberCircle}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">{index + 1}</AwaText>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.numberedText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s4Body3}</AwaText>

          {/* 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.s5Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s5Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s5Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s5HighlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.s5HighlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* 6 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.s6Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s6Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s6Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.s6TipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.s6TipText}</AwaText>
            </View>
          </AwaCard>

          {/* 7 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.s7Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s7Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s7Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="scale-balance"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>{content.s7NeutralText}</AwaText>
          </AwaCard>

          {/* 8 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>8. {content.s8Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s8Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s8Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.s8Items.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* 9 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>9. {content.s9Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s9Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s9Body2}</AwaText>

          <View style={styles.sectionMiniTitle}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={20}
              color={theme.colors.primary}
            />

            <AwaText variant="titleSmall" emphasized>
              {content.s9MiniTitle}
            </AwaText>
          </View>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.s9Lifestyle.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s9Body3}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="doctor"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.s9AlertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.s9AlertText}</AwaText>
            </View>
          </AwaCard>

          {/* 10 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>10. {content.s10Heading}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.s10Myths.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* 11 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>11. {content.s11Heading}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.s11Body1}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {CONSULT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.consultText}>
                  {content.s11ConsultItems[index]}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* 12 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>12. {content.s12Heading}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <AwaText variant="titleMedium" emphasized>
                {content.s12SummaryTitle}
              </AwaText>
            </View>

            {content.s12SummaryItems.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check"
                  size={17}
                  color={theme.colors.success}
                />

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

    introSecondary: {
      marginTop: 8,
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
      marginTop: 24,
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

    checkList: {
      marginTop: 12,
      padding: 12,
    },

    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 12,
    },

    checkText: {
      flex: 1,
    },

    alert: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },

    neutralBox: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    neutralText: {
      flex: 1,
    },

    numberedCard: {
      marginTop: 16,
      padding: 16,
    },

    numberedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },

    numberCircle: {
      width: 27,
      height: 27,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },


    numberedText: {
      flex: 1,
      marginLeft: 12,
      paddingTop: 3,
    },

    highlightBox: {
      marginTop: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    highlightCopy: {
      flex: 1,
      marginLeft: 12,
    },


    highlightText: {
      marginTop: 4,
    },

    sectionMiniTitle: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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

    summaryText: {
      flex: 1,
    },

    finalNote: {
      marginTop: 20,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    finalNoteCopy: {
      flex: 1,
      marginLeft: 12,
    },


    finalNoteText: {
      marginTop: 4,
    },
  });
}
