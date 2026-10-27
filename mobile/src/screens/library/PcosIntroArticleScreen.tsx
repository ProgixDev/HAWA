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
const CONTENT = withBrazilianPortuguese('PcosIntro', {
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
  ko: {
    badge: 'PCOS • 필수 가이드',
    title: 'PCOS\n이해하기',
    metaDuration: '읽는 시간 10분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '교육용 콘텐츠',
    intro: '다낭성 난소 증후군(PCOS)은 흔한 호르몬 질환으로, 생리 주기, 배란, 피부, 머리카락, 대사, 때로는 임신 가능성에 영향을 줄 수 있어요.',
    introSecondary: '나타나는 모습은 사람마다 크게 달라요. PCOS를 이해하면 증상을 알아차리고, 언제 진료를 받아야 하는지 알고, 자책하지 않으면서 변화를 기록해 나가는 데 도움이 돼요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      'PCOS란 무엇인가요?',
      'PCOS는 왜 생길까요?',
      '주요 증상',
      '어떻게 진단하나요?',
      'PCOS와 배란',
      'PCOS와 임신 가능성',
      'PCOS와 체중 / 대사',
      '피부, 머리카락, 체모',
      'PCOS는 어떻게 관리하나요?',
      '흔한 오해',
      '진료를 받아야 할 때',
      '핵심 정리',
    ],
    s1Heading: 'PCOS란 무엇인가요?',
    s1Body1: '다낭성 난소 증후군(PCOS)은 난소의 평소 기능과 일부 호르몬의 균형을 바꿀 수 있는 흔한 호르몬 질환이에요.',
    s1Body2: '어떤 사람에게는 불규칙한 배란이 가장 큰 문제이고, 어떤 사람에게는 여드름, 체모 증가, 탈모, 또는 대사 관련 징후가 먼저 눈에 띄어요.',
    s1TipTitle: '알아 두면 좋아요',
    s1TipText: '이름과 달리 PCOS가 반드시 난소에 “낭종”이 있다는 뜻은 아니에요. 예전부터 써 온 이 이름은 오해를 부를 수 있고, 초음파만으로는 진단할 수 없어요.',
    s2Heading: 'PCOS는 왜 생길까요?',
    s2Body1: 'PCOS의 원인은 하나가 아니에요. 가족력, 호르몬 기능, 배란, 대사, 개인적인 요인 등 여러 요인이 함께 작용한 결과로 보여요.',
    s2Factors: [
      '가족력과 유전적 요인',
      '배란의 장애',
      '안드로겐(남성호르몬) 상대적 과잉',
      '일부에서 나타나는 인슐린 저항성',
      '대사 및 환경 요인',
    ],
    s2NeutralText: 'PCOS는 개인의 잘못이 아니에요. 의지가 부족하거나, 식단이 나쁘거나, 신체 활동이 부족해서 생기는 것이 아니에요.',
    s3Heading: '주요 증상',
    s3Body1: 'PCOS는 사람마다 아주 다르게 나타날 수 있어요. 여러 증상이 있는 사람도 있고, 거의 느끼지 못하는 사람도 있어요.',
    s3Signs: [
      '불규칙하거나, 간격이 넓거나, 때로는 없는 생리 주기',
      '불규칙하거나 예측하기 어려운 배란',
      '특히 얼굴 아래쪽에 계속되는 여드름',
      '얼굴, 가슴, 몸의 털이 늘어나는 것',
      '호르몬 영향으로 나타나는 탈모',
      '체중 증가 또는 체중 감량의 어려움',
      '임신이 잘 되지 않는 것',
    ],
    s3AlertTitle: '중요해요',
    s3AlertText: '이런 증상 중 하나가 있다고 해서 자동으로 PCOS인 것은 아니에요. 다른 여러 질환도 비슷한 증상을 일으킬 수 있어요.',
    s4Heading: '어떻게 진단하나요?',
    s4Body1: 'PCOS 진단은 의학적인 과정이에요. 의료 전문가는 보통 생리 주기, 증상, 병력, 복용 중인 약에 대해 이야기를 나누는 것부터 시작해요.',
    s4Body2: '상황에 따라 호르몬 혈액 검사와 초음파를 권할 수도 있어요.',
    s4Points: [
      '불규칙한 생리 주기 또는 드문 배란',
      '안드로겐 과잉의 징후: 여드름, 체모 증가, 탈모 또는 혈액 검사 결과',
      '이 검사가 필요한 경우, 초음파에서 PCOS와 부합하는 난소 모양',
    ],
    s4Body3: '의사는 PCOS를 확진하기 전에 불규칙한 생리 주기나 안드로겐 과잉을 일으킬 수 있는 다른 원인도 배제해야 해요.',
    s5Heading: 'PCOS와 배란',
    s5Body1: '배란은 난소에서 난자(난모세포)가 배출되는 것을 말해요. PCOS에서는 배란이 덜 자주 일어나거나 예측하기 더 어려울 수 있어요.',
    s5Body2: '그래서 생리 주기가 길거나, 불규칙하거나, 예측하기 어려운 경우가 있는 것을 설명해 줄 수 있어요.',
    s5HighlightTitle: '주기 기록하기',
    s5HighlightText: '생리 날짜, 증상, 배란 징후를 기록하면 내 몸의 패턴을 더 잘 이해하는 데 도움이 될 수 있어요.',
    s6Heading: 'PCOS와 임신 가능성',
    s6Body1: '배란이 불규칙할 수 있어서, PCOS가 있는 일부 사람은 임신하기가 더 어려울 수 있어요.',
    s6Body2: '하지만 PCOS가 있다고 해서 임신이 자동으로 불가능한 것은 아니에요. PCOS가 있는 많은 사람이 자연 임신을 하거나 적절한 의료 지원을 받아 임신해요.',
    s6TipTitle: '기억해 두세요',
    s6TipText: '임신이 어렵다고 해서 불가능하다는 뜻은 아니에요. 임신을 바란다면 의사나 조산사가 상황에 맞는 방법을 제안해 줄 수 있어요.',
    s7Heading: 'PCOS와 체중 / 대사',
    s7Body1: 'PCOS는 대사 변화와 관련될 수 있고, 일부에서는 인슐린 저항성이 나타나요.',
    s7Body2: '하지만 체중만으로 PCOS를 진단하거나 배제할 수는 없어요. 마른 사람도 PCOS가 있을 수 있고, 과체중인 사람이 PCOS가 없을 수도 있어요.',
    s7NeutralText: '경과 관찰은 체중계의 숫자만이 아니라 전반적인 건강을 고려해야 해요.',
    s8Heading: '피부, 머리카락, 체모',
    s8Body1: '안드로겐이 상대적으로 많으면 피지선과 모낭에 영향을 줄 수 있어요.',
    s8Body2: '사람에 따라 계속되는 여드름, 체모 증가, 탈모로 나타날 수 있어요.',
    s8Items: [
      '호르몬성 여드름',
      '얼굴이나 몸의 털 증가',
      '머리카락이 가늘어지거나 빠지는 것',
    ],
    s9Heading: 'PCOS는 어떻게 관리하나요?',
    s9Body1: '모든 사람에게 맞는 PCOS 관리법은 하나가 아니에요. 증상, 목표, 의학적 상황에 따라 선택해요.',
    s9Body2: '목표는 인생의 시기에 따라 달라질 수 있어요. 생리 주기를 조절하거나, 일부 증상을 개선하거나, 대사 건강을 지키거나, 임신 계획을 돕는 것 등이에요.',
    s9MiniTitle: '건강을 돕는 습관',
    s9Lifestyle: [
      '필요에 맞게 다양하고 규칙적으로 먹기',
      '오래 이어갈 수 있는 규칙적인 신체 활동 하기',
      '수면을 충분히 규칙적으로 유지하기',
      '시간이 지나면서 생리 주기와 증상이 어떻게 변하는지 기록하기',
      '체중이나 증상의 변화를 자책하지 않기',
    ],
    s9Body3: '필요에 따라 의료 전문가가 일부 증상을 위한 치료나 임신 계획을 돕는 치료를 권할 수도 있어요.',
    s9AlertTitle: '임의로 약을 복용하지 마세요',
    s9AlertText: '호르몬 치료, 대사 관련 약, 건강 보조제는 모두 의료 전문가와 상의해야 해요.',
    s10Heading: 'PCOS에 대한 흔한 오해',
    s10Myths: [
      'PCOS는 항상 “낭종”이 있다는 뜻이다: 이름이 오해를 부를 수 있어요. 진단은 낭종이 있는지만으로 하지 않아요.',
      'PCOS가 있는 사람은 모두 과체중이다: PCOS는 모든 체형의 사람에게 나타날 수 있어요.',
      'PCOS는 항상 임신을 막는다: 배란이 불규칙할 수는 있지만 임신은 여전히 가능해요.',
      '증상 하나만 있으면 PCOS로 진단할 수 있다: 진단하려면 종합적인 평가가 필요해요.',
      'PCOS는 나이가 들면 저절로 없어진다: 나타나는 양상은 평생에 걸쳐 달라질 수 있지만 계속 경과를 지켜보는 것이 중요해요.',
    ],
    s11Heading: '진료를 받아야 할 때',
    s11Body1: '생리 주기가 매우 불규칙해지거나 몇 달 동안 멈추거나, 평소와 다른 증상이 나타났을 때 진료를 받아 보는 것이 좋아요.',
    s11ConsultItems: [
      '매우 불규칙하거나 없는 생리 주기',
      '평소와 다른 여드름이나 체모 증가',
      '심한 탈모',
      '임신이 잘 되지 않는 것',
      '증상이 빠르게 변하는 것',
    ],
    s12Heading: '핵심 정리',
    s12SummaryTitle: '꼭 기억할 것',
    s12SummaryItems: [
      'PCOS는 흔한 호르몬 질환이에요.',
      '여러 가지 모습으로 나타날 수 있어요.',
      'PCOS가 있는 모든 사람이 같은 증상을 겪는 것은 아니에요.',
      '체중만으로는 PCOS를 진단하거나 배제할 수 없어요.',
      '진단하려면 종합적인 의학적 평가가 필요해요.',
      'PCOS는 배란과 때로는 임신 가능성에 영향을 줄 수 있어요.',
      '맞춤형 관리가 각자의 필요를 채우는 데 도움이 돼요.',
    ],
    finalNoteTitle: '더 잘 이해하기 위한 가이드',
    finalNoteText: '이 아티클은 일반적인 정보를 제공하기 위한 것으로 진료를 대신하지 않아요. 상황은 사람마다 달라요. 의문이 들거나 증상이 계속된다면 의료 전문가에게 조언을 구하세요.',
    shareMessage: 'PCOS 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'SOP • GUIA ESSENCIAL',
    title: 'Compreender\na SOP',
    metaDuration: '10 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo educativo',
    intro: 'A síndrome do ovário poliquístico, frequentemente designada por SOP, é uma condição hormonal comum que pode afetar os seus ciclos, a ovulação, a pele, o cabelo, o metabolismo e, por vezes, a fertilidade.',
    introSecondary: 'A forma como se manifesta varia muito de mulher para mulher. Compreender a SOP ajuda sobretudo a reconhecer os seus sintomas, a saber quando procurar aconselhamento médico e a acompanhar a sua evolução sem culpabilização.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a SOP?',
      'Porque é que a SOP acontece?',
      'Os principais sinais',
      'Como é diagnosticada?',
      'SOP e ovulação',
      'SOP e fertilidade',
      'SOP e peso / metabolismo',
      'Pele, cabelo e pelos',
      'Como se trata a SOP?',
      'Ideias feitas comuns',
      'Quando consultar um médico',
      'Pontos essenciais',
    ],
    s1Heading: 'O que é a SOP?',
    s1Body1: 'A síndrome do ovário poliquístico (SOP) é uma condição hormonal comum que pode alterar o funcionamento habitual dos ovários e o equilíbrio de certas hormonas.',
    s1Body2: 'Para algumas mulheres, o principal problema é a ovulação irregular. Para outras, são a acne, o excesso de pelos, a queda de cabelo ou sinais metabólicos que se destacam primeiro.',
    s1TipTitle: 'Bom saber',
    s1TipText: 'Apesar do nome, a SOP não significa necessariamente que os ovários contenham “quistos”. O termo histórico pode induzir em erro, e uma ecografia por si só não basta para fazer o diagnóstico.',
    s2Heading: 'Porque é que a SOP acontece?',
    s2Body1: 'Não existe uma causa única para a SOP. Parece resultar de vários fatores que podem combinar-se: predisposição familiar, funcionamento hormonal, ovulação, metabolismo e fatores individuais.',
    s2Factors: [
      'Predisposição familiar e fatores genéticos',
      'Perturbações da ovulação',
      'Excesso relativo de androgénios',
      'Resistência à insulina em algumas mulheres',
      'Fatores metabólicos e ambientais',
    ],
    s2NeutralText: 'A SOP não é uma falha pessoal. Não resulta simplesmente de falta de força de vontade, de uma má alimentação ou de atividade física insuficiente.',
    s3Heading: 'Os principais sinais',
    s3Body1: 'A SOP pode manifestar-se de formas muito diferentes de mulher para mulher. Algumas têm vários sintomas, enquanto outras notam muito poucos.',
    s3Signs: [
      'Ciclos irregulares, muito espaçados ou, por vezes, ausentes',
      'Ovulação irregular ou difícil de prever',
      'Acne persistente, particularmente na parte inferior do rosto',
      'Aumento do crescimento de pelos no rosto, no peito ou no corpo',
      'Queda de cabelo de padrão hormonal',
      'Aumento de peso ou dificuldade em perder peso',
      'Dificuldade em engravidar',
    ],
    s3AlertTitle: 'Importante',
    s3AlertText: 'Ter um destes sintomas não significa automaticamente que tem SOP. Várias outras condições podem causar sintomas semelhantes.',
    s4Heading: 'Como é diagnosticada?',
    s4Body1: 'O diagnóstico da SOP é um processo médico. Um profissional de saúde começa habitualmente por falar consigo sobre os seus ciclos, sintomas, historial médico e eventuais tratamentos que esteja a fazer.',
    s4Body2: 'Consoante a situação, também podem ser propostas análises hormonais ao sangue e uma ecografia.',
    s4Points: [
      'Ciclos irregulares ou ovulação pouco frequente',
      'Sinais de excesso de androgénios: acne, excesso de pelos, queda de cabelo ou resultados de análises ao sangue',
      'Aspeto dos ovários compatível com SOP na ecografia, quando este exame está indicado',
    ],
    s4Body3: 'O médico deve também excluir outras possíveis causas de ciclos irregulares ou de excesso de androgénios antes de confirmar um diagnóstico de SOP.',
    s5Heading: 'SOP e ovulação',
    s5Body1: 'A ovulação é a libertação de um óvulo (oócito) pelo ovário. Na SOP, a ovulação pode ser menos frequente ou mais difícil de prever.',
    s5Body2: 'Isto pode explicar por que razão os ciclos são por vezes longos, irregulares ou difíceis de antecipar.',
    s5HighlightTitle: 'Acompanhar o seu ciclo',
    s5HighlightText: 'Registar as datas do período, os sintomas e os eventuais sinais de ovulação pode ajudar a compreender melhor os seus próprios padrões.',
    s6Heading: 'SOP e fertilidade',
    s6Body1: 'Como a ovulação pode ser irregular, algumas mulheres com SOP podem ter mais dificuldade em engravidar.',
    s6Body2: 'Isto não significa, porém, que a SOP impeça automaticamente a gravidez. Muitas mulheres com SOP engravidam naturalmente ou com o apoio médico adequado.',
    s6TipTitle: 'Tenha presente',
    s6TipText: 'Ter dificuldade em engravidar não significa que seja impossível. Se deseja engravidar, um médico ou uma parteira pode propor uma estratégia adaptada à sua situação.',
    s7Heading: 'SOP e peso / metabolismo',
    s7Body1: 'A SOP pode estar associada a alterações metabólicas, nomeadamente resistência à insulina em algumas mulheres.',
    s7Body2: 'No entanto, o peso por si só não permite diagnosticar nem excluir a SOP. Uma mulher magra pode ter SOP, tal como uma mulher com excesso de peso pode não a ter.',
    s7NeutralText: 'O acompanhamento deve ter em conta a saúde global, e não apenas o número que a balança indica.',
    s8Heading: 'Pele, cabelo e pelos',
    s8Body1: 'O excesso relativo de androgénios pode afetar as glândulas sebáceas e os folículos pilosos.',
    s8Body2: 'Consoante a mulher, isto pode manifestar-se como acne persistente, aumento do crescimento de pelos ou queda de cabelo.',
    s8Items: [
      'Acne hormonal',
      'Aumento de pelos no rosto ou no corpo',
      'Cabelo mais fino ou queda de cabelo',
    ],
    s9Heading: 'Como se trata a SOP?',
    s9Body1: 'Não existe uma abordagem única para tratar a SOP que sirva para todas as mulheres. A escolha depende dos sintomas, dos objetivos e das circunstâncias médicas.',
    s9Body2: 'O objetivo pode diferir consoante a fase da vida: regular os ciclos, melhorar certos sintomas, proteger a saúde metabólica ou apoiar um projeto de gravidez.',
    s9MiniTitle: 'Hábitos que apoiam a saúde',
    s9Lifestyle: [
      'Ter uma alimentação variada e regular, adaptada às suas necessidades',
      'Praticar atividade física regular que consiga manter ao longo do tempo',
      'Manter um sono suficientemente regular',
      'Acompanhar a evolução dos seus ciclos e sintomas ao longo do tempo',
      'Não se culpar pelas alterações de peso ou de sintomas',
    ],
    s9Body3: 'Consoante as suas necessidades, um profissional de saúde também pode propor tratamentos para certos sintomas ou para apoiar um projeto de gravidez.',
    s9AlertTitle: 'Não se automedique',
    s9AlertText: 'Os tratamentos hormonais, os medicamentos metabólicos e os suplementos alimentares devem ser sempre discutidos com um profissional de saúde.',
    s10Heading: 'Ideias feitas comuns sobre a SOP',
    s10Myths: [
      'A SOP significa sempre ter “quistos”: o nome pode induzir em erro. O diagnóstico não se baseia apenas na presença de quistos.',
      'Todas as mulheres com SOP têm excesso de peso: a SOP pode afetar mulheres de todos os tipos de corpo.',
      'A SOP impede sempre a gravidez: a ovulação pode ser irregular, mas a gravidez continua a ser possível.',
      'Um único sintoma basta para diagnosticar a SOP: o diagnóstico exige uma avaliação completa.',
      'A SOP desaparece simplesmente com a idade: a forma como se apresenta pode mudar ao longo da vida, mas o acompanhamento contínuo continua a ser importante.',
    ],
    s11Heading: 'Quando consultar um médico',
    s11Body1: 'O aconselhamento médico é particularmente útil quando os ciclos se tornam muito irregulares, deixam de ocorrer durante vários meses ou quando surgem sintomas invulgares.',
    s11ConsultItems: [
      'Ciclos muito irregulares ou ausentes',
      'Acne ou crescimento de pelos invulgares',
      'Queda de cabelo significativa',
      'Dificuldade em engravidar',
      'Sintomas que evoluem rapidamente',
    ],
    s12Heading: 'Pontos essenciais',
    s12SummaryTitle: 'Os pontos essenciais',
    s12SummaryItems: [
      'A SOP é uma condição hormonal comum.',
      'Pode manifestar-se de muitas formas diferentes.',
      'Nem todas as mulheres com SOP têm os mesmos sintomas.',
      'O peso por si só não basta para diagnosticar nem excluir a SOP.',
      'O diagnóstico exige uma avaliação médica completa.',
      'A SOP pode afetar a ovulação e, por vezes, a fertilidade.',
      'Uma abordagem de cuidados personalizada ajuda a responder às necessidades de cada mulher.',
    ],
    finalNoteTitle: 'Um guia para compreender melhor',
    finalNoteText: 'Este artigo destina-se a informação geral e não substitui uma consulta médica. Cada situação é diferente: em caso de dúvida ou se os sintomas persistirem, procure o aconselhamento de um profissional de saúde.',
    shareMessage: 'Compreender a SOP — AWA',
  },
  bn: {
    badge: 'পিসিওএস • প্রয়োজনীয় গাইড',
    title: 'পিসিওএস\nবোঝা',
    metaDuration: 'পড়তে 10 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'শিক্ষামূলক বিষয়বস্তু',
    intro: 'পলিসিস্টিক ওভারি সিনড্রোম, যা প্রায়ই পিসিওএস নামে পরিচিত, একটি সাধারণ হরমোনজনিত অবস্থা, যা আপনার চক্র, ডিম্বস্ফোটন, ত্বক, চুল, বিপাক এবং কখনো কখনো প্রজনন ক্ষমতাকে প্রভাবিত করতে পারে।',
    introSecondary: 'এটি কীভাবে প্রকাশ পায় তা এক নারী থেকে আরেক নারীতে অনেক আলাদা হয়। পিসিওএস বোঝা মূলত এর উপসর্গ চিনতে, কখন চিকিৎসকের পরামর্শ নিতে হবে তা জানতে এবং নিজেকে দোষ না দিয়ে এর পরিবর্তনের ওপর নজর রাখতে সাহায্য করে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'পিসিওএস কী?',
      'পিসিওএস কেন হয়?',
      'প্রধান লক্ষণ',
      'কীভাবে নির্ণয় করা হয়?',
      'পিসিওএস ও ডিম্বস্ফোটন',
      'পিসিওএস ও প্রজনন ক্ষমতা',
      'পিসিওএস এবং ওজন / বিপাক',
      'ত্বক, চুল ও শরীরের লোম',
      'পিসিওএস কীভাবে নিয়ন্ত্রণে রাখা হয়?',
      'প্রচলিত ভুল ধারণা',
      'কখন ডাক্তারের কাছে যাবেন',
      'মূল কথা',
    ],
    s1Heading: 'পিসিওএস কী?',
    s1Body1: 'পলিসিস্টিক ওভারি সিনড্রোম (পিসিওএস) একটি সাধারণ হরমোনজনিত অবস্থা, যা ডিম্বাশয়ের স্বাভাবিক কার্যকলাপ এবং কিছু হরমোনের ভারসাম্য বদলে দিতে পারে।',
    s1Body2: 'কিছু নারীর ক্ষেত্রে প্রধান সমস্যা অনিয়মিত ডিম্বস্ফোটন। অন্যদের ক্ষেত্রে প্রথমে ব্রণ, অতিরিক্ত লোম গজানো, চুল পড়া বা বিপাকজনিত লক্ষণ বেশি চোখে পড়ে।',
    s1TipTitle: 'জেনে রাখা ভালো',
    s1TipText: 'নাম থাকলেও পিসিওএস মানেই ডিম্বাশয়ে “সিস্ট” থাকবে এমন নয়। ঐতিহাসিক এই নামটি বিভ্রান্তিকর হতে পারে, আর শুধু আলট্রাসাউন্ড দিয়ে রোগ নির্ণয় করা যায় না।',
    s2Heading: 'পিসিওএস কেন হয়?',
    s2Body1: 'পিসিওএসের কোনো একক কারণ নেই। মনে হয় এটি একাধিক কারণের সমন্বয়ে হয়: পারিবারিক প্রবণতা, হরমোনের কার্যকারিতা, ডিম্বস্ফোটন, বিপাক এবং ব্যক্তিগত কারণ।',
    s2Factors: [
      'পারিবারিক প্রবণতা ও বংশগত কারণ',
      'ডিম্বস্ফোটনে ব্যাঘাত',
      'আপেক্ষিক অ্যান্ড্রোজেনের আধিক্য',
      'কিছু নারীর ক্ষেত্রে ইনসুলিন রেজিস্ট্যান্স',
      'বিপাকীয় ও পরিবেশগত কারণ',
    ],
    s2NeutralText: 'পিসিওএস কোনো ব্যক্তিগত ব্যর্থতা নয়। এটি কেবল ইচ্ছাশক্তির অভাব, খারাপ খাদ্যাভ্যাস বা অপর্যাপ্ত শারীরিক কার্যকলাপের ফল নয়।',
    s3Heading: 'প্রধান লক্ষণ',
    s3Body1: 'পিসিওএস এক নারী থেকে আরেক নারীতে সম্পূর্ণ আলাদাভাবে প্রকাশ পেতে পারে। কারও একাধিক উপসর্গ থাকে, আবার কেউ খুব কমই কিছু লক্ষ করেন।',
    s3Signs: [
      'অনিয়মিত, দীর্ঘ বিরতির বা কখনো কখনো বন্ধ থাকা চক্র',
      'অনিয়মিত বা আগাম অনুমান করা কঠিন ডিম্বস্ফোটন',
      'স্থায়ী ব্রণ, বিশেষ করে মুখের নিচের অংশে',
      'মুখ, বুক বা শরীরে লোম বেশি গজানো',
      'হরমোনজনিত ধরনের চুল পড়া',
      'ওজন বাড়া বা ওজন কমাতে অসুবিধা হওয়া',
      'গর্ভধারণে অসুবিধা হওয়া',
    ],
    s3AlertTitle: 'গুরুত্বপূর্ণ',
    s3AlertText: 'এই উপসর্গগুলোর একটি থাকলেই যে আপনার পিসিওএস আছে, তা স্বয়ংক্রিয়ভাবে বোঝায় না। আরও অনেক অবস্থায় একই রকম উপসর্গ হতে পারে।',
    s4Heading: 'কীভাবে নির্ণয় করা হয়?',
    s4Body1: 'পিসিওএস নির্ণয় একটি চিকিৎসাগত প্রক্রিয়া। স্বাস্থ্যসেবা পেশাজীবী সাধারণত আপনার চক্র, উপসর্গ, চিকিৎসার ইতিহাস এবং আপনি যেসব চিকিৎসা নিচ্ছেন সেগুলো নিয়ে আলোচনা দিয়ে শুরু করেন।',
    s4Body2: 'পরিস্থিতি অনুযায়ী হরমোনের রক্তপরীক্ষা এবং আলট্রাসাউন্ডও প্রস্তাব করা হতে পারে।',
    s4Points: [
      'অনিয়মিত চক্র বা কম ডিম্বস্ফোটন',
      'অ্যান্ড্রোজেন আধিক্যের লক্ষণ: ব্রণ, অতিরিক্ত লোম গজানো, চুল পড়া, বা রক্তপরীক্ষার ফলাফল',
      'আলট্রাসাউন্ডে পিসিওএসের সঙ্গে সামঞ্জস্যপূর্ণ ডিম্বাশয়ের গঠন, যখন এই পরীক্ষা প্রয়োজন হয়',
    ],
    s4Body3: 'পিসিওএস নিশ্চিত করার আগে ডাক্তারকে অনিয়মিত চক্র বা অ্যান্ড্রোজেন আধিক্যের অন্যান্য সম্ভাব্য কারণও বাদ দিতে হবে।',
    s5Heading: 'পিসিওএস ও ডিম্বস্ফোটন',
    s5Body1: 'ডিম্বস্ফোটন হলো ডিম্বাশয় থেকে একটি ডিম্বাণু (ওওসাইট) নির্গত হওয়া। পিসিওএসে ডিম্বস্ফোটন কম ঘটতে পারে বা আগাম অনুমান করা কঠিন হতে পারে।',
    s5Body2: 'এর ফলে কেন চক্র কখনো কখনো দীর্ঘ, অনিয়মিত বা আগাম অনুমান করা কঠিন হয়, তা ব্যাখ্যা করা যেতে পারে।',
    s5HighlightTitle: 'আপনার চক্রের ওপর নজর রাখা',
    s5HighlightText: 'মাসিকের তারিখ, উপসর্গ এবং ডিম্বস্ফোটনের যেকোনো লক্ষণ লিখে রাখলে নিজের ধরনগুলো আরও ভালো বুঝতে সাহায্য হতে পারে।',
    s6Heading: 'পিসিওএস ও প্রজনন ক্ষমতা',
    s6Body1: 'ডিম্বস্ফোটন অনিয়মিত হতে পারে বলে পিসিওএস আছে এমন কিছু নারীর গর্ভধারণে বেশি অসুবিধা হতে পারে।',
    s6Body2: 'তবে এর মানে এই নয় যে পিসিওএস স্বয়ংক্রিয়ভাবে গর্ভধারণ আটকে দেয়। পিসিওএস আছে এমন অনেক নারী স্বাভাবিকভাবে বা উপযুক্ত চিকিৎসা সহায়তায় গর্ভধারণ করেন।',
    s6TipTitle: 'মনে রাখবেন',
    s6TipText: 'গর্ভধারণে অসুবিধা হওয়ার মানে এটি অসম্ভব নয়। আপনি গর্ভবতী হতে চাইলে ডাক্তার বা ধাত্রী আপনার পরিস্থিতির উপযোগী একটি কৌশল সুপারিশ করতে পারেন।',
    s7Heading: 'পিসিওএস এবং ওজন / বিপাক',
    s7Body1: 'পিসিওএস বিপাকীয় পরিবর্তনের সঙ্গে যুক্ত থাকতে পারে, যার মধ্যে কিছু নারীর ক্ষেত্রে ইনসুলিন রেজিস্ট্যান্স রয়েছে।',
    s7Body2: 'তবে কেবল ওজন দিয়ে পিসিওএস নির্ণয় করা বা বাদ দেওয়া যায় না। একজন চিকন নারীর পিসিওএস থাকতে পারে, আবার একজন ওজন বেশি নারীর নাও থাকতে পারে।',
    s7NeutralText: 'ফলো-আপ যত্নে কেবল ওজনের কাঁটার সংখ্যা নয়, সামগ্রিক স্বাস্থ্য বিবেচনা করা উচিত।',
    s8Heading: 'ত্বক, চুল ও শরীরের লোম',
    s8Body1: 'আপেক্ষিক অ্যান্ড্রোজেনের আধিক্য তৈলগ্রন্থি ও লোমকূপকে প্রভাবিত করতে পারে।',
    s8Body2: 'নারীভেদে এটি স্থায়ী ব্রণ, লোম বেশি গজানো বা চুল পড়ার আকারে প্রকাশ পেতে পারে।',
    s8Items: [
      'হরমোনজনিত ব্রণ',
      'মুখে বা শরীরে লোম বেড়ে যাওয়া',
      'চুল পাতলা হয়ে যাওয়া বা চুল পড়া',
    ],
    s9Heading: 'পিসিওএস কীভাবে নিয়ন্ত্রণে রাখা হয়?',
    s9Body1: 'প্রতিটি নারীর জন্য কার্যকর পিসিওএস নিয়ন্ত্রণের কোনো একক পদ্ধতি নেই। পছন্দ নির্ভর করে উপসর্গ, লক্ষ্য এবং চিকিৎসাগত পরিস্থিতির ওপর।',
    s9Body2: 'জীবনের পর্যায় অনুযায়ী লক্ষ্য আলাদা হতে পারে: চক্র নিয়মিত করা, কিছু উপসর্গ উন্নত করা, বিপাকীয় স্বাস্থ্য রক্ষা করা, বা গর্ভধারণের পরিকল্পনায় সহায়তা করা।',
    s9MiniTitle: 'স্বাস্থ্যসহায়ক অভ্যাস',
    s9Lifestyle: [
      'আপনার প্রয়োজন অনুযায়ী বৈচিত্র্যময় ও নিয়মিত খাদ্যাভ্যাস রাখা',
      'দীর্ঘদিন চালিয়ে যাওয়া যায় এমন নিয়মিত শারীরিক কার্যকলাপ করা',
      'যথেষ্ট নিয়মিত ঘুম বজায় রাখা',
      'সময়ের সঙ্গে আপনার চক্র ও উপসর্গ কীভাবে বদলায় তার ওপর নজর রাখা',
      'ওজন বা উপসর্গের পরিবর্তনের জন্য নিজেকে দোষ না দেওয়া',
    ],
    s9Body3: 'আপনার প্রয়োজন অনুযায়ী স্বাস্থ্যসেবা প্রদানকারী কিছু উপসর্গের জন্য বা গর্ভধারণের পরিকল্পনায় সহায়তার জন্য চিকিৎসাও প্রস্তাব করতে পারেন।',
    s9AlertTitle: 'নিজে নিজে ওষুধ খাবেন না',
    s9AlertText: 'হরমোনজনিত চিকিৎসা, বিপাকীয় ওষুধ এবং খাদ্য সম্পূরক, সবকিছুই স্বাস্থ্যসেবা প্রদানকারীর সঙ্গে আলোচনা করা উচিত।',
    s10Heading: 'পিসিওএস নিয়ে প্রচলিত ভুল ধারণা',
    s10Myths: [
      'পিসিওএস মানেই সবসময় “সিস্ট” থাকা: নামটি বিভ্রান্তিকর হতে পারে। রোগ নির্ণয় শুধু সিস্টের উপস্থিতির ওপর নির্ভর করে না।',
      'পিসিওএস আছে এমন সব নারীর ওজন বেশি: পিসিওএস সব ধরনের শারীরিক গঠনের নারীকে প্রভাবিত করতে পারে।',
      'পিসিওএস সবসময় গর্ভধারণ আটকে দেয়: ডিম্বস্ফোটন অনিয়মিত হতে পারে, তবুও গর্ভধারণ সম্ভব।',
      'একটি উপসর্গই পিসিওএস নির্ণয়ের জন্য যথেষ্ট: নির্ণয়ের জন্য সামগ্রিক মূল্যায়ন প্রয়োজন।',
      'বয়স বাড়লে পিসিওএস আপনাআপনি চলে যায়: জীবনভর এর প্রকাশ বদলাতে পারে, তবে নিয়মিত ফলো-আপ গুরুত্বপূর্ণ থাকে।',
    ],
    s11Heading: 'কখন ডাক্তারের কাছে যাবেন',
    s11Body1: 'চক্র খুব অনিয়মিত হলে, কয়েক মাস ধরে বন্ধ থাকলে, বা অস্বাভাবিক উপসর্গ দেখা দিলে চিকিৎসকের পরামর্শ নেওয়া বিশেষভাবে উপকারী।',
    s11ConsultItems: [
      'খুব অনিয়মিত বা বন্ধ থাকা চক্র',
      'অস্বাভাবিক ব্রণ বা লোম গজানো',
      'উল্লেখযোগ্য চুল পড়া',
      'গর্ভধারণে অসুবিধা হওয়া',
      'দ্রুত বদলে যাওয়া উপসর্গ',
    ],
    s12Heading: 'মূল কথা',
    s12SummaryTitle: 'প্রয়োজনীয় বিষয়গুলো',
    s12SummaryItems: [
      'পিসিওএস একটি সাধারণ হরমোনজনিত অবস্থা।',
      'এটি নানাভাবে প্রকাশ পেতে পারে।',
      'পিসিওএস আছে এমন সব নারীর একই উপসর্গ থাকে না।',
      'কেবল ওজন দিয়ে পিসিওএস নির্ণয় করা বা বাদ দেওয়া যথেষ্ট নয়।',
      'নির্ণয়ের জন্য সামগ্রিক চিকিৎসাগত মূল্যায়ন প্রয়োজন।',
      'পিসিওএস ডিম্বস্ফোটন এবং কখনো কখনো প্রজনন ক্ষমতাকে প্রভাবিত করতে পারে।',
      'ব্যক্তিভিত্তিক যত্নের পদ্ধতি প্রত্যেক নারীর প্রয়োজন মেটাতে সাহায্য করে।',
    ],
    finalNoteTitle: 'ভালোভাবে বোঝার একটি গাইড',
    finalNoteText: 'এই নিবন্ধ সাধারণ তথ্যের জন্য এবং চিকিৎসকের পরামর্শের বিকল্প নয়। প্রতিটি পরিস্থিতি আলাদা: সন্দেহ থাকলে বা উপসর্গ থেকে গেলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'পিসিওএস বোঝা — AWA',
  },
  da: {
    badge: 'PCOS • Grundlæggende guide',
    title: 'Forstå\nPCOS',
    metaDuration: '10 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Uddannelsesmæssigt indhold',
    intro: 'Polycystisk ovariesyndrom, ofte kaldet PCOS, er en almindelig hormonel tilstand, der kan påvirke din cyklus, ægløsning, hud, hår, stofskifte og i nogle tilfælde fertilitet.',
    introSecondary: 'Hvordan det viser sig, varierer meget fra kvinde til kvinde. At forstå PCOS handler primært om at genkende symptomerne, vide hvornår du bør søge læge, og holde øje med ændringer uden at bebrejde dig selv.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er PCOS?',
      'Hvad forårsager PCOS?',
      'Vigtigste symptomer',
      'Hvordan stilles diagnosen?',
      'PCOS og ægløsning',
      'PCOS og fertilitet',
      'PCOS og vægt / stofskifte',
      'Hud, hår og kropsbehåring',
      'Hvordan håndteres PCOS?',
      'Almindelige misforståelser',
      'Hvornår bør du søge læge',
      'Det vigtigste',
    ],
    s1Heading: 'Hvad er PCOS?',
    s1Body1: 'Polycystisk ovariesyndrom (PCOS) er en almindelig hormonel tilstand, der kan ændre æggestokkenes normale funktion og balancen af visse hormoner.',
    s1Body2: 'For nogle kvinder er det primære problem uregelmæssig ægløsning. For andre er acne, øget hårvækst, hårtab eller stofskiftesymptomer det, der viser sig først.',
    s1TipTitle: 'Godt at vide',
    s1TipText: 'Selv om navnet antyder det, betyder PCOS ikke nødvendigvis, at der er "cyster" på æggestokkene. Det historiske navn kan være vildledende, og diagnosen kan ikke stilles med ultralyd alene.',
    s2Heading: 'Hvad forårsager PCOS?',
    s2Body1: 'Der er ingen enkelt årsag til PCOS. Det ser ud til at opstå som følge af en kombination af faktorer: arvelige anlæg, hormonfunktion, ægløsning, stofskifte og individuelle faktorer.',
    s2Factors: [
      'Arvelige anlæg og genetiske faktorer',
      'Forstyrrelser i ægløsningen',
      'Relativt overskud af androgener',
      'Insulinresistens hos visse kvinder',
      'Metaboliske og miljømæssige faktorer',
    ],
    s2NeutralText: 'PCOS er ikke en personlig fejl. Det er ikke blot et resultat af manglende viljestyrke, dårlige kostvaner eller utilstrækkelig motion.',
    s3Heading: 'Vigtigste symptomer',
    s3Body1: 'PCOS kan vise sig meget forskelligt fra kvinde til kvinde. Nogen har flere symptomer, mens andre næsten ikke bemærker noget.',
    s3Signs: [
      'Uregelmæssig, lang eller i nogle tilfælde fraværende cyklus',
      'Uregelmæssig eller svær at forudsige ægløsning',
      'Vedvarende akne, særligt på den nedre del af ansigtet',
      'Øget hårvækst i ansigt, på bryst eller krop',
      'Hormonbetinget hårtab',
      'Vægtøgning eller vanskeligheder med at tabe sig',
      'Vanskeligheder med at blive gravid',
    ],
    s3AlertTitle: 'Vigtigt',
    s3AlertText: 'At have ét af disse symptomer betyder ikke automatisk, at du har PCOS. Mange andre tilstande kan give lignende symptomer.',
    s4Heading: 'Hvordan stilles diagnosen?',
    s4Body1: 'PCOS-diagnosen er en medicinsk proces. Et sundhedspersonale starter typisk med at tale om din cyklus, dine symptomer, din sygehistorie og igangværende behandlinger.',
    s4Body2: 'Blodprøver for hormoner og ultralyd kan også foreslås afhængigt af situationen.',
    s4Points: [
      'Uregelmæssig cyklus eller nedsat ægløsning',
      'Tegn på androgenoverskud: acne, øget hårvækst, hårtab eller blodprøveresultater',
      'Æggestokstruktur forenelig med PCOS ved ultralyd, når undersøgelsen er nødvendig',
    ],
    s4Body3: 'Inden PCOS bekræftes, skal lægen udelukke andre mulige årsager til uregelmæssig cyklus eller androgenoverskud.',
    s5Heading: 'PCOS og ægløsning',
    s5Body1: 'Ægløsning er frigivelsen af et æg (oocyt) fra æggestokken. Ved PCOS kan ægløsningen forekomme sjældnere eller være sværere at forudsige.',
    s5Body2: 'Det kan forklare, hvorfor cyklussen til tider er lang, uregelmæssig eller svær at forudsige.',
    s5HighlightTitle: 'Hold øje med din cyklus',
    s5HighlightText: 'At registrere dine menstruationsdatoer, symptomer og eventuelle tegn på ægløsning kan hjælpe dig med bedre at forstå dine egne mønstre.',
    s6Heading: 'PCOS og fertilitet',
    s6Body1: 'Fordi ægløsningen kan være uregelmæssig, kan nogle kvinder med PCOS have sværere ved at blive gravide.',
    s6Body2: 'Det betyder ikke, at PCOS automatisk forhindrer graviditet. Mange kvinder med PCOS bliver gravide naturligt eller med passende medicinsk hjælp.',
    s6TipTitle: 'Husk',
    s6TipText: 'Det er sværere at blive gravid – ikke umuligt. Ønsker du at blive gravid, kan en læge eller jordemoder anbefale en strategi tilpasset din situation.',
    s7Heading: 'PCOS og vægt / stofskifte',
    s7Body1: 'PCOS kan være forbundet med metaboliske ændringer, herunder insulinresistens hos visse kvinder.',
    s7Body2: 'Dog kan PCOS ikke bekræftes eller udelukkes udelukkende på baggrund af vægt. En slank kvinde kan have PCOS, og en overvægtig kvinde behøver ikke have det.',
    s7NeutralText: 'Opfølgende behandling bør overveje det overordnede helbred – ikke kun tallet på vægten.',
    s8Heading: 'Hud, hår og kropsbehåring',
    s8Body1: 'Et relativt overskud af androgener kan påvirke talgkirtler og hårfollikler.',
    s8Body2: 'For den enkelte kvinde kan det vise sig som vedvarende acne, øget hårvækst eller hårtab.',
    s8Items: [
      'Hormonbetinget acne',
      'Øget hår i ansigt eller på krop',
      'Udtynding af håret eller hårtab',
    ],
    s9Heading: 'Hvordan håndteres PCOS?',
    s9Body1: 'Der er ingen én-størrelse-passer-alle metode til håndtering af PCOS. Valget afhænger af symptomer, mål og medicinsk situation.',
    s9Body2: 'Målene kan variere afhængigt af livsfasen: regulere cyklussen, forbedre visse symptomer, bevare det metaboliske helbred eller støtte graviditetsplaner.',
    s9MiniTitle: 'Sundhedsfremmende vaner',
    s9Lifestyle: [
      'Varieret og regelmæssig kost tilpasset dine behov',
      'Regelmæssig fysisk aktivitet, som du kan opretholde over tid',
      'Tilstrækkelig og regelmæssig søvn',
      'Hold øje med, hvordan din cyklus og dine symptomer ændrer sig over tid',
      'Undlad at bebrejde dig selv for ændringer i vægt eller symptomer',
    ],
    s9Body3: 'Afhængigt af dine behov kan et sundhedspersonale også foreslå behandling for visse symptomer eller til støtte for graviditetsplaner.',
    s9AlertTitle: 'Selvmedicinering frarådes',
    s9AlertText: 'Hormonel behandling, metaboliske lægemidler og kosttilskud – alt bør diskuteres med et sundhedspersonale.',
    s10Heading: 'Almindelige misforståelser om PCOS',
    s10Myths: [
      'PCOS betyder altid "cyster": navnet kan være vildledende. Diagnosen afhænger ikke udelukkende af tilstedeværelsen af cyster.',
      'Alle kvinder med PCOS er overvægtige: PCOS kan ramme kvinder af alle kropstyper.',
      'PCOS forhindrer altid graviditet: ægløsningen kan være uregelmæssig, men graviditet er stadig mulig.',
      'Ét enkelt symptom er nok til at stille diagnosen: en samlet vurdering er nødvendig for diagnosen.',
      'PCOS forsvinder af sig selv med alderen: udtryksformen kan ændre sig livet igennem, men regelmæssig opfølgning forbliver vigtig.',
    ],
    s11Heading: 'Hvornår bør du søge læge',
    s11Body1: 'Det er særligt nyttigt at søge læge, hvis din cyklus er meget uregelmæssig, har været fraværende i flere måneder, eller hvis der opstår usædvanlige symptomer.',
    s11ConsultItems: [
      'Meget uregelmæssig eller fraværende cyklus',
      'Usædvanlig acne eller hårvækst',
      'Betydeligt hårtab',
      'Vanskeligheder med at blive gravid',
      'Symptomer der ændrer sig hurtigt',
    ],
    s12Heading: 'Det vigtigste',
    s12SummaryTitle: 'Hvad du bør vide',
    s12SummaryItems: [
      'PCOS er en almindelig hormonel tilstand.',
      'Den kan vise sig på mange måder.',
      'Ikke alle kvinder med PCOS har de samme symptomer.',
      'Vægt alene er ikke tilstrækkeligt til at bekræfte eller udelukke PCOS.',
      'Diagnosen kræver en samlet medicinsk vurdering.',
      'PCOS kan påvirke ægløsning og i nogle tilfælde fertilitet.',
      'En individuel tilgang til behandling hjælper med at imødekomme hver kvindes behov.',
    ],
    finalNoteTitle: 'En guide til bedre forståelse',
    finalNoteText: 'Denne artikel er til generel information og erstatter ikke lægelig rådgivning. Enhver situation er unik: søg råd hos et sundhedspersonale, hvis du er i tvivl eller dine symptomer vedvarer.',
    shareMessage: 'Forstå PCOS — AWA',
  },
  sv: {
    badge: 'PCOS • Grundläggende guide',
    title: 'Forstå\nPCOS',
    metaDuration: '10 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Uddannelsesmässigt indhold',
    intro: 'Polycystisk ovariesyndrom, ofta kaldet PCOS, ar en almindelig hormonel tilstand, der kan påvirke din cyklus, äglösning, hud, hår, stofskifte och i nogle tilfälde fertilitet.',
    introSecondary: 'Hvordan det viser sig, varierer mycket fran kvinna till kvinde. At forstå PCOS handler primärt om at genkende symtomne, vide hvornår du bör söge läge, och holde öje med ändringer uden at bebrejde dig selv.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar PCOS?',
      'Hvad forårsager PCOS?',
      'Vigtigste symtom',
      'Hvordan stilles diagnosen?',
      'PCOS och äglösning',
      'PCOS och fertilitet',
      'PCOS och vägt / stofskifte',
      'Hud, hår och kropsbehåring',
      'Hvordan håndteres PCOS?',
      'Almindelige misforståelser',
      'Hvornår bör du söge läge',
      'Det vigtigste',
    ],
    s1Heading: 'Hvad ar PCOS?',
    s1Body1: 'Polycystisk ovariesyndrom (PCOS) ar en almindelig hormonel tilstand, der kan ändre äggestokkenes normale funktion och balancen av visse hormoner.',
    s1Body2: 'For nogle kvinnor ar det primäre problem uregelmässig äglösning. For andre ar acne, öget hårväkst, hårtab eller stofskiftesymtom det, der viser sig först.',
    s1TipTitle: 'Godt at vide',
    s1TipText: 'Selv om navnet antyder det, betyder PCOS inte nödvendigvis, at der ar "cyster" på äggestokkene. Det historiske navn kan väre vildledende, och diagnosen kan inte stilles med ultralyd alene.',
    s2Heading: 'Hvad forårsager PCOS?',
    s2Body1: 'Der ar ingen enkelt årsag till PCOS. Det ser ud till at opstå som fölge av en kombination av faktorer: arvelige anläg, hormonfunktion, äglösning, stofskifte och individuelle faktorer.',
    s2Factors: [
      'Arvelige anläg och genetiske faktorer',
      'Forstyrrelser i äglösningen',
      'Relativt overskud av androgener',
      'Insulinresistens hos visse kvinder',
      'Metaboliske och miljömässige faktorer',
    ],
    s2NeutralText: 'PCOS ar inte en personlig fejl. Det ar inte blot et resultat av manglende viljestyrke, dårlige kostvaner eller utilsträkkelig motion.',
    s3Heading: 'Vigtigste symtom',
    s3Body1: 'PCOS kan vise sig mycket forskelligt fran kvinna till kvinde. Nogen har flere symtom, mens andre nästen inte bemärker noget.',
    s3Signs: [
      'Uregelmässig, lang eller i nogle tilfälde fravärende cyklus',
      'Uregelmässig eller svär at forudsige äglösning',
      'Vedvarende akne, särligt på den nedre del av ansigtet',
      'Öget hårväkst i ansigt, på bryst eller krop',
      'Hormonbetinget hårtab',
      'Vägtögning eller vanskeligheder med at tabe sig',
      'Vanskeligheder med at blive gravid',
    ],
    s3AlertTitle: 'Vigtigt',
    s3AlertText: 'At have ét av disse symtom betyder inte automatisk, at du har PCOS. Mange andre tilstande kan give lignende symtom.',
    s4Heading: 'Hvordan stilles diagnosen?',
    s4Body1: 'PCOS-diagnosen ar en medicinsk proces. Et halsaspersonale starter typisk med at tale om din cyklus, dina symtom, din sygehistorie och igangvärende behandlinger.',
    s4Body2: 'Blodpröver for hormoner och ultralyd kan også foreslås afhängigt av situationen.',
    s4Points: [
      'Uregelmässig cyklus eller nedsat äglösning',
      'Tegn på androgenoverskud: acne, öget hårväkst, hårtab eller blodpröveresultater',
      'Äggestokstruktur forenelig med PCOS ved ultralyd, når undersögelsen ar nödvendig',
    ],
    s4Body3: 'Inden PCOS bekräftes, skal lägen udelukke andre mulige årsager till uregelmässig cyklus eller androgenoverskud.',
    s5Heading: 'PCOS och äglösning',
    s5Body1: 'Äglösning ar frigivelsen av et äg (oocyt) fran äggestokken. Ved PCOS kan äglösningen forekomme själdnere eller väre svärere at forudsige.',
    s5Body2: 'Det kan forklare, hvorfor cyklussen till tider ar lang, uregelmässig eller svär at forudsige.',
    s5HighlightTitle: 'Hold öje med din cyklus',
    s5HighlightText: 'At registrere dina menstruationsdatoer, symtom och eventuelle tegn på äglösning kan hjälpe dig med bedre at forstå dina egne mönstre.',
    s6Heading: 'PCOS och fertilitet',
    s6Body1: 'Fordi äglösningen kan väre uregelmässig, kan nogle kvinnor med PCOS have svärere ved at blive gravide.',
    s6Body2: 'Det betyder inte, at PCOS automatisk forhindrer graviditet. Mange kvinnor med PCOS bliver gravide naturligt eller med passende medicinsk hjälp.',
    s6TipTitle: 'Husk',
    s6TipText: 'Det ar svärere at blive gravid – inte umuligt. Önsker du at blive gravid, kan en läge eller jordemoder anbefale en strategi tilpasset din situation.',
    s7Heading: 'PCOS och vägt / stofskifte',
    s7Body1: 'PCOS kan väre forbundet med metaboliske ändringer, herunder insulinresistens hos visse kvinder.',
    s7Body2: 'Dog kan PCOS inte bekräftes eller udelukkes udelukkende på baggrund av vägt. En slank kvinna kan have PCOS, och en overvägtig kvinna behöver inte have det.',
    s7NeutralText: 'Opfölgende behandling bör overveje det overordnede helbred – inte kun tallet på vägten.',
    s8Heading: 'Hud, hår och kropsbehåring',
    s8Body1: 'Et relativt overskud av androgener kan påvirke talgkirtler och hårfollikler.',
    s8Body2: 'For den enkelte kvinna kan det vise sig som vedvarende acne, öget hårväkst eller hårtab.',
    s8Items: [
      'Hormonbetinget acne',
      'Öget hår i ansigt eller på krop',
      'Udtynding av håret eller hårtab',
    ],
    s9Heading: 'Hvordan håndteres PCOS?',
    s9Body1: 'Der ar ingen én-störrelse-passer-alle metode till håndtering av PCOS. Valget afhänger av symtom, mål och medicinsk situation.',
    s9Body2: 'Målene kan variere afhängigt av livsfasen: regulere cyklussen, forbedre visse symtom, bevare det metaboliske helbred eller stötte graviditetsplaner.',
    s9MiniTitle: 'Halsasfremmende vaner',
    s9Lifestyle: [
      'Varieret och regelmässig kost tilpasset dina behov',
      'Regelmässig fysisk aktivitet, som du kan opretholde over tid',
      'Tilsträkkelig och regelmässig sövn',
      'Hold öje med, hvordan din cyklus och dina symtom ändrer sig over tid',
      'Undlad at bebrejde dig selv for ändringer i vägt eller symtom',
    ],
    s9Body3: 'Afhängigt av dina behov kan et halsaspersonale også foreslå behandling for visse symtom eller till stötte for graviditetsplaner.',
    s9AlertTitle: 'Selvmedicinering frarådes',
    s9AlertText: 'Hormonel behandling, metaboliske lägemidler och kosttilskud – alt bör diskuteres med et halsaspersonale.',
    s10Heading: 'Almindelige misforståelser om PCOS',
    s10Myths: [
      'PCOS betyder alltid "cyster": navnet kan väre vildledende. Diagnosen afhänger inte udelukkende av tilstedevärelsen av cyster.',
      'Alla kvinnor med PCOS ar overvägtige: PCOS kan ramme kvinnor av alla kropstyper.',
      'PCOS forhindrer alltid graviditet: äglösningen kan väre uregelmässig, men graviditet ar fortfarande mulig.',
      'Ét enkelt symptom ar nok till at stille diagnosen: en samlet vurdering ar nödvendig for diagnosen.',
      'PCOS forsvinder av sig selv med alderen: udtryksformen kan ändre sig livet igennem, men regelmässig opfölgning forbliver vigtig.',
    ],
    s11Heading: 'Hvornår bör du söge läge',
    s11Body1: 'Det ar särligt nyttigt at söge läge, hvis din cyklus ar mycket uregelmässig, har väret fravärende i flere måneder, eller hvis der opstår usädvanlige symtom.',
    s11ConsultItems: [
      'Meget uregelmässig eller fravärende cyklus',
      'Usädvanlig acne eller hårväkst',
      'Betydeligt hårtab',
      'Vanskeligheder med at blive gravid',
      'Symtom der ändrer sig hurtigt',
    ],
    s12Heading: 'Det vigtigste',
    s12SummaryTitle: 'Hvad du bör vide',
    s12SummaryItems: [
      'PCOS ar en almindelig hormonel tilstand.',
      'Den kan vise sig på mange måder.',
      'Ikke alla kvinnor med PCOS har de samme symtom.',
      'Vägt alene ar inte tilsträkkeligt till at bekräfte eller udelukke PCOS.',
      'Diagnosen kräver en samlet medicinsk vurdering.',
      'PCOS kan påvirke äglösning och i nogle tilfälde fertilitet.',
      'En individuel tilgang till behandling hjälper med at imödekomme hver kvindes behov.',
    ],
    finalNoteTitle: 'En guide till bedre forståelse',
    finalNoteText: 'Denne artikel ar till generel information och erstatter inte lägelig rådgivning. Enhver situation ar unik: sög råd hos et halsaspersonale, hvis du ar i tvivl eller dina symtom vedvarer.',
    shareMessage: 'Forstå PCOS — AWA',
  },
  nb: {
    badge: 'PCOS • VIKTIG VEILEDNING',
    title: 'Forstå\nPCOS',
    metaDuration: '10 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Pedagogisk innhold',
    intro:
      'Polycystisk ovariesyndrom, ofte kalt PCOS, er en vanlig hormonell tilstand som kan påvirke syklusene, eggløsningen, huden, håret, stoffskiftet og noen ganger fruktbarheten din.',
    introSecondary:
      'Hvordan det viser seg, varierer mye fra kvinne til kvinne. Å forstå PCOS hjelper deg først og fremst å kjenne igjen symptomene, vite når du bør søke medisinsk råd og følge utviklingen uten selvbebreidelse.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er PCOS?',
      'Hvorfor oppstår PCOS?',
      'De viktigste tegnene',
      'Hvordan diagnostiseres det?',
      'PCOS og eggløsning',
      'PCOS og fruktbarhet',
      'PCOS og vekt / stoffskifte',
      'Hud, hår og kroppshår',
      'Hvordan håndteres PCOS?',
      'Vanlige misforståelser',
      'Når bør du gå til lege',
      'Det viktigste å huske',
    ],
    s1Heading: 'Hva er PCOS?',
    s1Body1:
      'Polycystisk ovariesyndrom (PCOS) er en vanlig hormonell tilstand som kan endre eggstokkenes vanlige funksjon og balansen mellom visse hormoner.',
    s1Body2:
      'For noen kvinner er hovedproblemet uregelmessig eggløsning. For andre er det akne, økt hårvekst, hårtap eller metabolske tegn som viser seg først.',
    s1TipTitle: 'Godt å vite',
    s1TipText:
      'Til tross for navnet betyr ikke PCOS nødvendigvis at eggstokkene inneholder «cyster». Det historiske begrepet kan være misvisende, og en ultralyd alene er ikke nok til å stille diagnosen.',
    s2Heading: 'Hvorfor oppstår PCOS?',
    s2Body1:
      'Det finnes ikke én enkelt årsak til PCOS. Det ser ut til å skyldes flere faktorer som kan virke sammen: familiær disposisjon, hormonell funksjon, eggløsning, stoffskifte og individuelle faktorer.',
    s2Factors: [
      'Familiær disposisjon og genetiske faktorer',
      'Forstyrrelser i eggløsningen',
      'Relativt overskudd av androgener',
      'Insulinresistens hos noen kvinner',
      'Metabolske og miljømessige faktorer',
    ],
    s2NeutralText:
      'PCOS er ikke en personlig svakhet. Det skyldes ikke bare mangel på viljestyrke, dårlig kosthold eller for lite fysisk aktivitet.',
    s3Heading: 'De viktigste tegnene',
    s3Body1:
      'PCOS kan vise seg svært forskjellig fra kvinne til kvinne. Noen har flere symptomer, mens andre merker svært få.',
    s3Signs: [
      'Uregelmessige, spredte eller noen ganger manglende sykluser',
      'Uregelmessig eller vanskelig å forutsi eggløsning',
      'Vedvarende akne, særlig i nedre del av ansiktet',
      'Økt hårvekst i ansiktet, på brystet eller kroppen',
      'Hårtap av hormonelt mønster',
      'Vektøkning eller vansker med å gå ned i vekt',
      'Vansker med å bli gravid',
    ],
    s3AlertTitle: 'Viktig',
    s3AlertText:
      'Å ha ett av disse symptomene betyr ikke automatisk at du har PCOS. Flere andre tilstander kan gi lignende symptomer.',
    s4Heading: 'Hvordan diagnostiseres det?',
    s4Body1:
      'Diagnostisering av PCOS er en medisinsk prosess. Helsepersonell starter vanligvis med å snakke om syklusene dine, symptomene dine, sykehistorien din og eventuelle behandlinger du bruker.',
    s4Body2:
      'Avhengig av situasjonen kan det også tilbys hormonelle blodprøver og en ultralyd.',
    s4Points: [
      'Uregelmessige sykluser eller sjelden eggløsning',
      'Tegn på overskudd av androgener: akne, økt hårvekst, hårtap eller blodprøveresultater',
      'Eggstokkenes utseende i samsvar med PCOS på ultralyd, når denne undersøkelsen er indisert',
    ],
    s4Body3:
      'Legen må også utelukke andre mulige årsaker til uregelmessige sykluser eller overskudd av androgener før en PCOS-diagnose bekreftes.',
    s5Heading: 'PCOS og eggløsning',
    s5Body1:
      'Eggløsning er frigjøringen av et egg (oocytt) fra eggstokken. Ved PCOS kan eggløsningen være sjeldnere eller vanskeligere å forutsi.',
    s5Body2:
      'Dette kan forklare hvorfor syklusene noen ganger er lange, uregelmessige eller vanskelige å forutse.',
    s5HighlightTitle: 'Følge syklusen din',
    s5HighlightText:
      'Å registrere mensdatoene, symptomene og eventuelle tegn på eggløsning kan hjelpe deg å forstå dine egne mønstre bedre.',
    s6Heading: 'PCOS og fruktbarhet',
    s6Body1:
      'Fordi eggløsningen kan være uregelmessig, kan noen kvinner med PCOS ha større vansker med å bli gravide.',
    s6Body2:
      'Dette betyr imidlertid ikke at PCOS automatisk hindrer graviditet. Mange kvinner med PCOS blir gravide naturlig eller med passende medisinsk støtte.',
    s6TipTitle: 'Husk',
    s6TipText:
      'Vansker med å bli gravid betyr ikke at det er umulig. Hvis du håper på en graviditet, kan en lege eller jordmor foreslå en strategi som passer din situasjon.',
    s7Heading: 'PCOS og vekt / stoffskifte',
    s7Body1:
      'PCOS kan være forbundet med metabolske endringer, blant annet insulinresistens hos noen kvinner.',
    s7Body2:
      'Vekt alene kan imidlertid verken stille eller utelukke diagnosen PCOS. En slank kvinne kan ha PCOS, akkurat som en kvinne med overvekt kanskje ikke har det.',
    s7NeutralText:
      'Oppfølgingen bør ta hensyn til den generelle helsen, ikke bare tallet på vekten.',
    s8Heading: 'Hud, hår og kroppshår',
    s8Body1:
      'Et relativt overskudd av androgener kan påvirke talgkjertlene og hårsekkene.',
    s8Body2:
      'Avhengig av kvinnen kan dette vise seg som vedvarende akne, økt hårvekst eller hårtap.',
    s8Items: [
      'Hormonell akne',
      'Økt hårvekst i ansiktet eller på kroppen',
      'Tynnere hår eller hårtap',
    ],
    s9Heading: 'Hvordan håndteres PCOS?',
    s9Body1:
      'Det finnes ingen enkelt tilnærming til håndtering av PCOS som fungerer for alle kvinner. Valget avhenger av symptomer, mål og medisinske omstendigheter.',
    s9Body2:
      'Målet kan være ulikt avhengig av livsfasen: regulere syklusene, bedre visse symptomer, beskytte den metabolske helsen eller støtte planer om graviditet.',
    s9MiniTitle: 'Vaner som støtter helsen',
    s9Lifestyle: [
      'Spise et variert, regelmessig kosthold tilpasset behovene dine',
      'Være regelmessig fysisk aktiv på en måte du kan holde over tid',
      'Opprettholde tilstrekkelig regelmessig søvn',
      'Følge hvordan syklusene og symptomene dine endrer seg over tid',
      'Ikke legge skylden på deg selv for endringer i vekt eller symptomer',
    ],
    s9Body3:
      'Avhengig av behovene dine kan helsepersonell også tilby behandlinger for visse symptomer eller for å støtte planer om graviditet.',
    s9AlertTitle: 'Ikke behandle deg selv',
    s9AlertText:
      'Hormonbehandlinger, metabolske legemidler og kosttilskudd bør alle diskuteres med helsepersonell.',
    s10Heading: 'Vanlige misforståelser om PCOS',
    s10Myths: [
      'PCOS betyr alltid å ha «cyster»: navnet kan være misvisende. Diagnosen bygger ikke bare på forekomsten av cyster.',
      'Alle kvinner med PCOS har overvekt: PCOS kan ramme kvinner av alle kroppstyper.',
      'PCOS hindrer alltid graviditet: eggløsningen kan være uregelmessig, men graviditet er fortsatt mulig.',
      'Ett enkelt symptom er nok til å stille diagnosen PCOS: diagnosen krever en helhetlig utredning.',
      'PCOS forsvinner rett og slett med alderen: hvordan det viser seg kan endre seg gjennom livet, men løpende oppfølging er fortsatt viktig.',
    ],
    s11Heading: 'Når bør du gå til lege',
    s11Body1:
      'Medisinsk råd er særlig verdt det når syklusene blir svært uregelmessige, uteblir i flere måneder, eller når uvanlige symptomer dukker opp.',
    s11ConsultItems: [
      'Svært uregelmessige eller manglende sykluser',
      'Uvanlig akne eller hårvekst',
      'Betydelig hårtap',
      'Vansker med å bli gravid',
      'Symptomer som endrer seg raskt',
    ],
    s12Heading: 'Det viktigste å huske',
    s12SummaryTitle: 'De viktigste punktene',
    s12SummaryItems: [
      'PCOS er en vanlig hormonell tilstand.',
      'Det kan vise seg på mange ulike måter.',
      'Ikke alle kvinner med PCOS har de samme symptomene.',
      'Vekt alene er ikke nok til å stille eller utelukke diagnosen PCOS.',
      'Diagnosen krever en helhetlig medisinsk utredning.',
      'PCOS kan påvirke eggløsningen og noen ganger fruktbarheten.',
      'En individuelt tilpasset oppfølging hjelper med å møte hver kvinnes behov.',
    ],
    finalNoteTitle: 'En veiledning for bedre forståelse',
    finalNoteText:
      'Denne artikkelen er ment som generell informasjon og erstatter ikke en medisinsk konsultasjon. Hver situasjon er forskjellig: ved tvil eller hvis symptomene vedvarer, bør du søke råd hos helsepersonell.',
    shareMessage: 'Forstå PCOS – AWA',
  },
  pl: {
    badge: 'PCOS • PODSTAWOWY PRZEWODNIK',
    title: 'Zrozumieć\nPCOS',
    metaDuration: '10 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść edukacyjna',
    intro:
      'Zespół policystycznych jajników, często nazywany PCOS, to częste zaburzenie hormonalne, które może wpływać na cykle, owulację, skórę, włosy, metabolizm, a czasem płodność.',
    introSecondary:
      'Sposób, w jaki się objawia, bardzo różni się u poszczególnych kobiet. Zrozumienie PCOS pomaga przede wszystkim rozpoznawać jego objawy, wiedzieć, kiedy zasięgnąć porady medycznej, i śledzić jego przebieg bez obwiniania się.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest PCOS?',
      'Dlaczego pojawia się PCOS?',
      'Główne objawy',
      'Jak się go diagnozuje?',
      'PCOS a owulacja',
      'PCOS a płodność',
      'PCOS a waga / metabolizm',
      'Skóra, włosy i owłosienie ciała',
      'Jak postępuje się w PCOS?',
      'Częste błędne przekonania',
      'Kiedy zgłosić się do lekarza',
      'Najważniejsze wnioski',
    ],
    s1Heading: 'Czym jest PCOS?',
    s1Body1:
      'Zespół policystycznych jajników (PCOS) to częste zaburzenie hormonalne, które może zmieniać zwykłe funkcjonowanie jajników i równowagę niektórych hormonów.',
    s1Body2:
      'U niektórych kobiet głównym problemem jest nieregularna owulacja. U innych na pierwszy plan wysuwają się trądzik, nadmierne owłosienie, wypadanie włosów lub objawy metaboliczne.',
    s1TipTitle: 'Warto wiedzieć',
    s1TipText:
      'Mimo nazwy PCOS niekoniecznie oznacza, że jajniki zawierają „torbiele”. Historyczny termin może wprowadzać w błąd, a samo USG nie wystarcza do rozpoznania.',
    s2Heading: 'Dlaczego pojawia się PCOS?',
    s2Body1:
      'PCOS nie ma jednej przyczyny. Wydaje się wynikać z kilku czynników, które mogą się łączyć: predyspozycji rodzinnych, funkcjonowania hormonalnego, owulacji, metabolizmu i czynników indywidualnych.',
    s2Factors: [
      'Predyspozycje rodzinne i czynniki genetyczne',
      'Zaburzenia owulacji',
      'Względny nadmiar androgenów',
      'Insulinooporność u niektórych kobiet',
      'Czynniki metaboliczne i środowiskowe',
    ],
    s2NeutralText:
      'PCOS nie jest osobistą porażką. Nie wynika po prostu z braku silnej woli, złej diety ani niewystarczającej aktywności fizycznej.',
    s3Heading: 'Główne objawy',
    s3Body1:
      'PCOS może objawiać się bardzo różnie u różnych kobiet. Niektóre mają kilka objawów, a inne zauważają bardzo niewiele.',
    s3Signs: [
      'Nieregularne, bardzo oddalone lub czasem nieobecne cykle',
      'Nieregularna lub trudna do przewidzenia owulacja',
      'Uporczywy trądzik, zwłaszcza na dolnej części twarzy',
      'Zwiększone owłosienie na twarzy, klatce piersiowej lub ciele',
      'Wypadanie włosów o podłożu hormonalnym',
      'Przyrost wagi lub trudności z jej utratą',
      'Trudności z zajściem w ciążę',
    ],
    s3AlertTitle: 'Ważne',
    s3AlertText:
      'Posiadanie jednego z tych objawów nie oznacza automatycznie, że masz PCOS. Podobne objawy może powodować kilka innych schorzeń.',
    s4Heading: 'Jak się go diagnozuje?',
    s4Body1:
      'Rozpoznanie PCOS to proces medyczny. Specjalista zwykle zaczyna od rozmowy o Twoich cyklach, objawach, historii medycznej i stosowanym leczeniu.',
    s4Body2:
      'W zależności od sytuacji mogą też zostać zaproponowane hormonalne badania krwi i USG.',
    s4Points: [
      'Nieregularne cykle lub rzadka owulacja',
      'Objawy nadmiaru androgenów: trądzik, nadmierne owłosienie, wypadanie włosów lub wyniki badań krwi',
      'Wygląd jajników zgodny z PCOS w USG, gdy badanie to jest wskazane',
    ],
    s4Body3:
      'Lekarz musi także wykluczyć inne możliwe przyczyny nieregularnych cykli lub nadmiaru androgenów, zanim potwierdzi rozpoznanie PCOS.',
    s5Heading: 'PCOS a owulacja',
    s5Body1:
      'Owulacja to uwolnienie komórki jajowej (oocytu) z jajnika. W PCOS owulacja może być rzadsza lub trudniejsza do przewidzenia.',
    s5Body2:
      'To może tłumaczyć, dlaczego cykle są czasem długie, nieregularne lub trudne do przewidzenia.',
    s5HighlightTitle: 'Śledzenie cyklu',
    s5HighlightText:
      'Zapisywanie dat miesiączek, objawów i ewentualnych oznak owulacji może pomóc lepiej zrozumieć własne wzorce.',
    s6Heading: 'PCOS a płodność',
    s6Body1:
      'Ponieważ owulacja może być nieregularna, niektóre kobiety z PCOS mogą mieć większe trudności z zajściem w ciążę.',
    s6Body2:
      'Nie oznacza to jednak, że PCOS automatycznie uniemożliwia ciążę. Wiele kobiet z PCOS zachodzi w ciążę naturalnie lub z odpowiednim wsparciem medycznym.',
    s6TipTitle: 'Pamiętaj',
    s6TipText:
      'Trudności z zajściem w ciążę nie oznaczają, że jest to niemożliwe. Jeśli chcesz zajść w ciążę, lekarz lub położna może zaproponować strategię dopasowaną do Twojej sytuacji.',
    s7Heading: 'PCOS a waga / metabolizm',
    s7Body1:
      'PCOS może być powiązany ze zmianami metabolicznymi, w tym z insulinoopornością u niektórych kobiet.',
    s7Body2:
      'Sama waga nie pozwala jednak ani rozpoznać, ani wykluczyć PCOS. Szczupła kobieta może mieć PCOS, a kobieta z nadwagą może go nie mieć.',
    s7NeutralText:
      'Opieka powinna uwzględniać ogólne zdrowie, a nie tylko liczbę na wadze.',
    s8Heading: 'Skóra, włosy i owłosienie ciała',
    s8Body1:
      'Względny nadmiar androgenów może wpływać na gruczoły łojowe i mieszki włosowe.',
    s8Body2:
      'U różnych kobiet może objawiać się uporczywym trądzikiem, zwiększonym owłosieniem lub wypadaniem włosów.',
    s8Items: [
      'Trądzik hormonalny',
      'Zwiększone owłosienie twarzy lub ciała',
      'Przerzedzenie lub wypadanie włosów',
    ],
    s9Heading: 'Jak postępuje się w PCOS?',
    s9Body1:
      'Nie ma jednego sposobu postępowania w PCOS, który działa u każdej kobiety. Wybór zależy od objawów, celów i okoliczności medycznych.',
    s9Body2:
      'Cel może się różnić w zależności od etapu życia: regulacja cykli, poprawa niektórych objawów, ochrona zdrowia metabolicznego lub wsparcie planów dotyczących ciąży.',
    s9MiniTitle: 'Nawyki wspierające zdrowie',
    s9Lifestyle: [
      'Urozmaicona, regularna dieta dopasowana do Twoich potrzeb',
      'Regularna aktywność fizyczna, którą możesz utrzymać w czasie',
      'Dbanie o wystarczająco regularny sen',
      'Śledzenie, jak cykle i objawy zmieniają się w czasie',
      'Nieobwinianie się za zmiany wagi lub objawów',
    ],
    s9Body3:
      'W zależności od potrzeb specjalista może też zaproponować leczenie niektórych objawów lub wsparcie planów dotyczących ciąży.',
    s9AlertTitle: 'Bez samoleczenia',
    s9AlertText:
      'Leczenie hormonalne, leki metaboliczne i suplementy diety należy omówić ze specjalistą.',
    s10Heading: 'Częste błędne przekonania o PCOS',
    s10Myths: [
      'PCOS zawsze oznacza „torbiele”: nazwa może wprowadzać w błąd. Rozpoznanie nie opiera się wyłącznie na obecności torbieli.',
      'Wszystkie kobiety z PCOS mają nadwagę: PCOS może dotyczyć kobiet o każdej budowie ciała.',
      'PCOS zawsze uniemożliwia ciążę: owulacja może być nieregularna, ale ciąża nadal jest możliwa.',
      'Jeden objaw wystarcza do rozpoznania PCOS: rozpoznanie wymaga kompleksowej oceny.',
      'PCOS po prostu mija z wiekiem: jego obraz może się zmieniać w ciągu życia, ale stała opieka pozostaje ważna.',
    ],
    s11Heading: 'Kiedy zgłosić się do lekarza',
    s11Body1:
      'Porada medyczna jest szczególnie wskazana, gdy cykle stają się bardzo nieregularne, ustają na kilka miesięcy lub gdy pojawiają się nietypowe objawy.',
    s11ConsultItems: [
      'Bardzo nieregularne lub nieobecne cykle',
      'Nietypowy trądzik lub owłosienie',
      'Znaczne wypadanie włosów',
      'Trudności z zajściem w ciążę',
      'Szybko zmieniające się objawy',
    ],
    s12Heading: 'Najważniejsze wnioski',
    s12SummaryTitle: 'Najważniejsze punkty',
    s12SummaryItems: [
      'PCOS to częste zaburzenie hormonalne.',
      'Może objawiać się na wiele różnych sposobów.',
      'Nie wszystkie kobiety z PCOS mają te same objawy.',
      'Sama waga nie wystarcza do rozpoznania ani wykluczenia PCOS.',
      'Rozpoznanie wymaga kompleksowej oceny medycznej.',
      'PCOS może wpływać na owulację, a czasem na płodność.',
      'Spersonalizowane podejście do opieki pomaga odpowiedzieć na potrzeby każdej kobiety.',
    ],
    finalNoteTitle: 'Przewodnik do lepszego zrozumienia',
    finalNoteText:
      'Ten artykuł ma charakter ogólnoinformacyjny i nie zastępuje wizyty lekarskiej. Każda sytuacja jest inna: w razie wątpliwości lub utrzymujących się objawów zasięgnij porady specjalisty.',
    shareMessage: 'Zrozumieć PCOS — AWA',
  },
  uk: {
    badge: 'СПКЯ • ОСНОВНИЙ ПОСІБНИК',
    title: 'Розуміння\nСПКЯ',
    metaDuration: '10 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Навчальний вміст',
    intro:
      'Синдром полікістозних яєчників, який часто називають СПКЯ, — це поширений гормональний стан, що може впливати на цикли, овуляцію, шкіру, волосся, метаболізм і іноді фертильність.',
    introSecondary:
      'Те, як він проявляється, сильно різниться в різних жінок. Розуміння СПКЯ допомагає насамперед розпізнавати його симптоми, знати, коли звертатися за медичною порадою, і стежити за його перебігом без самозвинувачення.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке СПКЯ?',
      'Чому виникає СПКЯ?',
      'Основні ознаки',
      'Як його діагностують?',
      'СПКЯ та овуляція',
      'СПКЯ та фертильність',
      'СПКЯ та вага / метаболізм',
      'Шкіра, волосся та волосся на тілі',
      'Як веде СПКЯ?',
      'Поширені хибні уявлення',
      'Коли звертатися до лікаря',
      'Головні висновки',
    ],
    s1Heading: 'Що таке СПКЯ?',
    s1Body1:
      'Синдром полікістозних яєчників (СПКЯ) — поширений гормональний стан, що може змінювати звичне функціонування яєчників і баланс певних гормонів.',
    s1Body2:
      'В одних жінок головною проблемою є нерегулярна овуляція. В інших на перший план виходять акне, надмірний ріст волосся, випадання волосся або метаболічні ознаки.',
    s1TipTitle: 'Варто знати',
    s1TipText:
      'Попри назву, СПКЯ не обов’язково означає, що яєчники містять «кісти». Історичний термін може вводити в оману, а самого УЗД недостатньо для діагностики.',
    s2Heading: 'Чому виникає СПКЯ?',
    s2Body1:
      'Єдиної причини СПКЯ немає. Він, схоже, є наслідком кількох чинників, які можуть поєднуватися: сімейної схильності, гормонального функціонування, овуляції, метаболізму та індивідуальних чинників.',
    s2Factors: [
      'Сімейна схильність і генетичні чинники',
      'Порушення овуляції',
      'Відносний надлишок андрогенів',
      'Інсулінорезистентність у деяких жінок',
      'Метаболічні та екологічні чинники',
    ],
    s2NeutralText:
      'СПКЯ — не особиста невдача. Він не є просто наслідком браку сили волі, поганого харчування чи недостатньої фізичної активності.',
    s3Heading: 'Основні ознаки',
    s3Body1:
      'СПКЯ може проявлятися дуже по-різному в різних жінок. Деякі мають кілька симптомів, а інші помічають дуже мало.',
    s3Signs: [
      'Нерегулярні, дуже віддалені або іноді відсутні цикли',
      'Нерегулярна або важко передбачувана овуляція',
      'Стійке акне, особливо на нижній частині обличчя',
      'Посилений ріст волосся на обличчі, грудях чи тілі',
      'Випадання волосся гормонального характеру',
      'Набір ваги або труднощі з її втратою',
      'Труднощі із зачаттям',
    ],
    s3AlertTitle: 'Важливо',
    s3AlertText:
      'Наявність одного з цих симптомів автоматично не означає, що у вас СПКЯ. Подібні симптоми можуть спричиняти кілька інших станів.',
    s4Heading: 'Як його діагностують?',
    s4Body1:
      'Діагностика СПКЯ — медичний процес. Лікар зазвичай починає з розмови про ваші цикли, симптоми, медичну історію та лікування, яке ви приймаєте.',
    s4Body2:
      'Залежно від ситуації також можуть бути запропоновані гормональні аналізи крові та УЗД.',
    s4Points: [
      'Нерегулярні цикли або рідкісна овуляція',
      'Ознаки надлишку андрогенів: акне, надмірний ріст волосся, випадання волосся або результати аналізів крові',
      'Вигляд яєчників, що відповідає СПКЯ на УЗД, коли це обстеження показане',
    ],
    s4Body3:
      'Лікар також має виключити інші можливі причини нерегулярних циклів чи надлишку андрогенів, перш ніж підтвердити діагноз СПКЯ.',
    s5Heading: 'СПКЯ та овуляція',
    s5Body1:
      'Овуляція — це вихід яйцеклітини (ооцита) з яєчника. При СПКЯ овуляція може бути рідшою або важче передбачуваною.',
    s5Body2:
      'Це може пояснювати, чому цикли іноді довгі, нерегулярні або важко передбачувані.',
    s5HighlightTitle: 'Відстеження циклу',
    s5HighlightText:
      'Запис дат менструацій, симптомів і можливих ознак овуляції може допомогти краще зрозуміти власні закономірності.',
    s6Heading: 'СПКЯ та фертильність',
    s6Body1:
      'Оскільки овуляція може бути нерегулярною, деякі жінки з СПКЯ можуть мати більші труднощі із зачаттям.',
    s6Body2:
      'Проте це не означає, що СПКЯ автоматично унеможливлює вагітність. Багато жінок із СПКЯ зачинають природно або з відповідною медичною підтримкою.',
    s6TipTitle: 'Пам’ятайте',
    s6TipText:
      'Труднощі із зачаттям не означають, що це неможливо. Якщо ви сподіваєтеся завагітніти, лікар чи акушерка може запропонувати стратегію, що відповідає вашій ситуації.',
    s7Heading: 'СПКЯ та вага / метаболізм',
    s7Body1:
      'СПКЯ може бути пов’язаний із метаболічними змінами, зокрема з інсулінорезистентністю в деяких жінок.',
    s7Body2:
      'Проте сама вага не дозволяє ні діагностувати, ні виключити СПКЯ. Худорлява жінка може мати СПКЯ, так само як жінка із зайвою вагою може його не мати.',
    s7NeutralText:
      'Догляд має враховувати загальний стан здоров’я, а не лише цифру на вагах.',
    s8Heading: 'Шкіра, волосся та волосся на тілі',
    s8Body1:
      'Відносний надлишок андрогенів може впливати на сальні залози та волосяні фолікули.',
    s8Body2:
      'У різних жінок це може проявлятися стійким акне, посиленим ростом волосся або випаданням волосся.',
    s8Items: [
      'Гормональне акне',
      'Посилений ріст волосся на обличчі чи тілі',
      'Витончення або випадання волосся',
    ],
    s9Heading: 'Як веде СПКЯ?',
    s9Body1:
      'Єдиного підходу до ведення СПКЯ, що працює для кожної жінки, не існує. Вибір залежить від симптомів, цілей і медичних обставин.',
    s9Body2:
      'Мета може відрізнятися залежно від етапу життя: регуляція циклів, покращення певних симптомів, захист метаболічного здоров’я або підтримка планів щодо вагітності.',
    s9MiniTitle: 'Звички, що підтримують здоров’я',
    s9Lifestyle: [
      'Різноманітне, регулярне харчування, відповідне вашим потребам',
      'Регулярна фізична активність, яку ви можете підтримувати з часом',
      'Підтримка достатньо регулярного сну',
      'Відстеження того, як змінюються ваші цикли та симптоми з часом',
      'Не звинувачувати себе за зміни ваги чи симптомів',
    ],
    s9Body3:
      'Залежно від ваших потреб лікар також може запропонувати лікування певних симптомів або підтримку планів щодо вагітності.',
    s9AlertTitle: 'Жодного самолікування',
    s9AlertText:
      'Гормональне лікування, метаболічні препарати та харчові добавки слід обговорювати з лікарем.',
    s10Heading: 'Поширені хибні уявлення про СПКЯ',
    s10Myths: [
      'СПКЯ завжди означає «кісти»: назва може вводити в оману. Діагноз не ґрунтується лише на наявності кіст.',
      'Усі жінки з СПКЯ мають зайву вагу: СПКЯ може торкатися жінок будь-якої статури.',
      'СПКЯ завжди унеможливлює вагітність: овуляція може бути нерегулярною, але вагітність усе ще можлива.',
      'Одного симптому достатньо для діагностики СПКЯ: діагноз потребує комплексної оцінки.',
      'СПКЯ просто минає з віком: його прояви можуть змінюватися протягом життя, але постійний нагляд залишається важливим.',
    ],
    s11Heading: 'Коли звертатися до лікаря',
    s11Body1:
      'Медична порада особливо доречна, коли цикли стають дуже нерегулярними, припиняються на кілька місяців або коли з’являються нетипові симптоми.',
    s11ConsultItems: [
      'Дуже нерегулярні або відсутні цикли',
      'Нетипове акне чи ріст волосся',
      'Значне випадання волосся',
      'Труднощі із зачаттям',
      'Симптоми, що швидко змінюються',
    ],
    s12Heading: 'Головні висновки',
    s12SummaryTitle: 'Основні моменти',
    s12SummaryItems: [
      'СПКЯ — поширений гормональний стан.',
      'Він може проявлятися багатьма різними способами.',
      'Не в усіх жінок із СПКЯ однакові симптоми.',
      'Сама вага не вистачає, щоб діагностувати або виключити СПКЯ.',
      'Діагностика потребує комплексної медичної оцінки.',
      'СПКЯ може впливати на овуляцію, а іноді й на фертильність.',
      'Персоналізований підхід до догляду допомагає відповісти на потреби кожної жінки.',
    ],
    finalNoteTitle: 'Посібник для кращого розуміння',
    finalNoteText:
      'Ця стаття має загальноінформаційний характер і не замінює медичної консультації. Кожна ситуація різна: у разі сумнівів або якщо симптоми зберігаються, зверніться за порадою до медичного фахівця.',
    shareMessage: 'Розуміння СПКЯ — AWA',
  },
  cs: {
    badge: 'PCOS • ZÁKLADNÍ PRŮVODCE',
    title: 'Pochopení\nPCOS',
    metaDuration: '10 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Vzdělávací obsah',
    intro:
      'Syndrom polycystických vaječníků, často nazývaný PCOS, je častý hormonální stav, který může ovlivňovat vaše cykly, ovulaci, pleť, vlasy, metabolismus a někdy i plodnost.',
    introSecondary:
      'Jak se projevuje, se u jednotlivých žen velmi liší. Pochopení PCOS vám hlavně pomáhá rozpoznat jeho příznaky, vědět, kdy vyhledat lékařskou radu, a sledovat jeho vývoj bez sebeobviňování.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je PCOS?',
      'Proč PCOS vzniká?',
      'Hlavní příznaky',
      'Jak se diagnostikuje?',
      'PCOS a ovulace',
      'PCOS a plodnost',
      'PCOS a váha / metabolismus',
      'Pleť, vlasy a ochlupení',
      'Jak se PCOS zvládá?',
      'Časté mylné představy',
      'Kdy navštívit lékaře',
      'Hlavní poznatky',
    ],
    s1Heading: 'Co je PCOS?',
    s1Body1:
      'Syndrom polycystických vaječníků (PCOS) je častý hormonální stav, který může měnit obvyklé fungování vaječníků a rovnováhu některých hormonů.',
    s1Body2:
      'U některých žen je hlavním problémem nepravidelná ovulace. U jiných jako první vynikne akné, nadměrný růst ochlupení, vypadávání vlasů nebo metabolické příznaky.',
    s1TipTitle: 'Stojí za to vědět',
    s1TipText:
      'Navzdory svému názvu PCOS nutně neznamená, že vaječníky obsahují „cysty“. Historický název může být zavádějící a samotný ultrazvuk k stanovení diagnózy nestačí.',
    s2Heading: 'Proč PCOS vzniká?',
    s2Body1:
      'Neexistuje jediná příčina PCOS. Zdá se, že vzniká z několika faktorů, které se mohou kombinovat: rodinné predispozice, hormonální fungování, ovulace, metabolismus a individuální faktory.',
    s2Factors: [
      'Rodinná predispozice a genetické faktory',
      'Poruchy ovulace',
      'Relativní nadbytek androgenů',
      'Inzulinová rezistence u některých žen',
      'Metabolické a environmentální faktory',
    ],
    s2NeutralText:
      'PCOS není osobní selhání. Nevyplývá jednoduše z nedostatku vůle, špatné stravy nebo nedostatečné fyzické aktivity.',
    s3Heading: 'Hlavní příznaky',
    s3Body1:
      'PCOS se může u jednotlivých žen projevovat velmi odlišně. Některé mají několik příznaků, jiné si všimnou jen velmi málo.',
    s3Signs: [
      'Nepravidelné, řídké nebo někdy chybějící cykly',
      'Nepravidelná nebo těžko předvídatelná ovulace',
      'Přetrvávající akné, zejména v dolní části obličeje',
      'Zvýšený růst ochlupení na obličeji, hrudi nebo těle',
      'Vypadávání vlasů hormonálního typu',
      'Přibývání na váze nebo potíže se zhubnutím',
      'Potíže s otěhotněním',
    ],
    s3AlertTitle: 'Důležité',
    s3AlertText:
      'Mít jeden z těchto příznaků automaticky neznamená, že máte PCOS. Podobné příznaky mohou způsobovat i několik jiných onemocnění.',
    s4Heading: 'Jak se diagnostikuje?',
    s4Body1:
      'Diagnostika PCOS je lékařský proces. Zdravotnický pracovník obvykle začíná rozhovorem o vašich cyklech, příznacích, zdravotní anamnéze a případné léčbě.',
    s4Body2:
      'Podle situace mohou být nabídnuty také hormonální krevní testy a ultrazvuk.',
    s4Points: [
      'Nepravidelné cykly nebo řídká ovulace',
      'Známky nadbytku androgenů: akné, nadměrný růst ochlupení, vypadávání vlasů nebo výsledky krevních testů',
      'Vzhled vaječníků odpovídající PCOS na ultrazvuku, pokud je toto vyšetření indikováno',
    ],
    s4Body3:
      'Lékař musí před potvrzením diagnózy PCOS také vyloučit jiné možné příčiny nepravidelných cyklů nebo nadbytku androgenů.',
    s5Heading: 'PCOS a ovulace',
    s5Body1:
      'Ovulace je uvolnění vajíčka (oocytu) z vaječníku. Při PCOS může být ovulace řidší nebo hůře předvídatelná.',
    s5Body2:
      'To může vysvětlovat, proč jsou cykly někdy dlouhé, nepravidelné nebo těžko předvídatelné.',
    s5HighlightTitle: 'Sledování cyklu',
    s5HighlightText:
      'Zaznamenávání dat menstruací, příznaků a případných známek ovulace vám může pomoci lépe pochopit vlastní vzorce.',
    s6Heading: 'PCOS a plodnost',
    s6Body1:
      'Protože ovulace může být nepravidelná, mohou mít některé ženy s PCOS větší potíže s otěhotněním.',
    s6Body2:
      'To však neznamená, že PCOS automaticky brání těhotenství. Mnoho žen s PCOS otěhotní přirozeně nebo s vhodnou lékařskou podporou.',
    s6TipTitle: 'Mějte na paměti',
    s6TipText:
      'Potíže s otěhotněním neznamenají, že je to nemožné. Pokud doufáte v těhotenství, lékař nebo porodní asistentka vám může navrhnout strategii odpovídající vaší situaci.',
    s7Heading: 'PCOS a váha / metabolismus',
    s7Body1:
      'PCOS může být spojen s metabolickými změnami, včetně inzulinové rezistence u některých žen.',
    s7Body2:
      'Samotná váha však nemůže PCOS diagnostikovat ani vyloučit. PCOS může mít štíhlá žena, stejně jako žena s nadváhou jej mít nemusí.',
    s7NeutralText:
      'Následná péče by měla zohledňovat celkové zdraví, nejen číslo na váze.',
    s8Heading: 'Pleť, vlasy a ochlupení',
    s8Body1:
      'Relativní nadbytek androgenů může ovlivňovat mazové žlázy a vlasové folikuly.',
    s8Body2:
      'Podle ženy se to může projevit jako přetrvávající akné, zvýšený růst ochlupení nebo vypadávání vlasů.',
    s8Items: [
      'Hormonální akné',
      'Zvýšené ochlupení na obličeji nebo těle',
      'Řídnutí vlasů nebo vypadávání vlasů',
    ],
    s9Heading: 'Jak se PCOS zvládá?',
    s9Body1:
      'Neexistuje jediný přístup ke zvládání PCOS, který by fungoval u každé ženy. Volba závisí na příznacích, cílech a zdravotních okolnostech.',
    s9Body2:
      'Cíl se může lišit podle životní etapy: regulace cyklů, zlepšení určitých příznaků, ochrana metabolického zdraví nebo podpora plánu na těhotenství.',
    s9MiniTitle: 'Návyky podporující zdraví',
    s9Lifestyle: [
      'Pestrá, pravidelná strava odpovídající vašim potřebám',
      'Pravidelná fyzická aktivita, kterou dokážete dlouhodobě udržet',
      'Dostatečně pravidelný spánek',
      'Sledování, jak se vaše cykly a příznaky v čase mění',
      'Neobviňovat se za změny váhy nebo příznaků',
    ],
    s9Body3:
      'Podle vašich potřeb může zdravotnický pracovník také nabídnout léčbu některých příznaků nebo na podporu plánu na těhotenství.',
    s9AlertTitle: 'Nelečte se sama',
    s9AlertText:
      'Hormonální léčbu, metabolické léky i doplňky stravy je třeba vždy probrat se zdravotnickým pracovníkem.',
    s10Heading: 'Časté mylné představy o PCOS',
    s10Myths: [
      'PCOS vždy znamená mít „cysty“: název může být zavádějící. Diagnóza se neopírá pouze o přítomnost cyst.',
      'Všechny ženy s PCOS mají nadváhu: PCOS může postihnout ženy všech postav.',
      'PCOS vždy brání těhotenství: ovulace může být nepravidelná, ale těhotenství je přesto možné.',
      'K diagnostice PCOS stačí jediný příznak: diagnóza vyžaduje komplexní posouzení.',
      'PCOS s věkem prostě zmizí: jeho projevy se mohou v průběhu života měnit, ale pokračující sledování zůstává důležité.',
    ],
    s11Heading: 'Kdy navštívit lékaře',
    s11Body1:
      'Lékařská rada je obzvlášť přínosná, když se cykly stanou velmi nepravidelnými, na několik měsíců ustanou nebo když se objeví neobvyklé příznaky.',
    s11ConsultItems: [
      'Velmi nepravidelné nebo chybějící cykly',
      'Neobvyklé akné nebo růst ochlupení',
      'Výrazné vypadávání vlasů',
      'Potíže s otěhotněním',
      'Rychle se měnící příznaky',
    ],
    s12Heading: 'Hlavní poznatky',
    s12SummaryTitle: 'Podstatné body',
    s12SummaryItems: [
      'PCOS je častý hormonální stav.',
      'Může se projevovat mnoha různými způsoby.',
      'Ne všechny ženy s PCOS mají stejné příznaky.',
      'Samotná váha nestačí k diagnostice ani vyloučení PCOS.',
      'Diagnóza vyžaduje komplexní lékařské posouzení.',
      'PCOS může ovlivňovat ovulaci a někdy i plodnost.',
      'Personalizovaný přístup k péči pomáhá uspokojit potřeby každé ženy.',
    ],
    finalNoteTitle: 'Průvodce pro lepší porozumění',
    finalNoteText:
      'Tento článek je určen k obecnému informování a nenahrazuje lékařskou konzultaci. Každá situace je jiná: v případě pochybností nebo přetrvávajících příznaků požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Pochopení PCOS — AWA',
  },
  sk: {
    badge: 'PCOS • ZÁKLADNÝ SPRIEVODCA',
    title: 'Pochopenie\nPCOS',
    metaDuration: '10 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Vzdelávací obsah',
    intro:
      'Syndróm polycystických vaječníkov, často nazývaný PCOS, je bežné hormonálne ochorenie, ktoré môže ovplyvniť vaše cykly, ovuláciu, pokožku, vlasy, metabolizmus a niekedy aj plodnosť.',
    introSecondary:
      'Spôsob, akým sa prejavuje, sa u jednotlivých žien veľmi líši. Pochopenie PCOS vám pomáha najmä rozpoznať jeho príznaky, vedieť, kedy vyhľadať lekársku radu, a sledovať jeho vývoj bez sebaobviňovania.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je PCOS?',
      'Prečo PCOS vzniká?',
      'Hlavné príznaky',
      'Ako sa diagnostikuje?',
      'PCOS a ovulácia',
      'PCOS a plodnosť',
      'PCOS a hmotnosť / metabolizmus',
      'Pokožka, vlasy a ochlpenie',
      'Ako sa PCOS lieči?',
      'Bežné mylné predstavy',
      'Kedy navštíviť lekára',
      'Hlavné body',
    ],
    s1Heading: 'Čo je PCOS?',
    s1Body1:
      'Syndróm polycystických vaječníkov (PCOS) je bežné hormonálne ochorenie, ktoré môže zmeniť obvyklé fungovanie vaječníkov a rovnováhu niektorých hormónov.',
    s1Body2:
      'U niektorých žien je hlavným problémom nepravidelná ovulácia. U iných sú to akné, nadmerný rast chlpov, vypadávanie vlasov alebo metabolické znaky, ktoré vyniknú ako prvé.',
    s1TipTitle: 'Stojí za to vedieť',
    s1TipText:
      'Napriek názvu PCOS nemusí nutne znamenať, že vaječníky obsahujú „cysty“. Historický názov môže byť zavádzajúci a samotný ultrazvuk nestačí na stanovenie diagnózy.',
    s2Heading: 'Prečo PCOS vzniká?',
    s2Body1:
      'PCOS nemá jedinú príčinu. Zdá sa, že vzniká z viacerých faktorov, ktoré sa môžu kombinovať: rodinná predispozícia, hormonálne fungovanie, ovulácia, metabolizmus a individuálne faktory.',
    s2Factors: [
      'Rodinná predispozícia a genetické faktory',
      'Poruchy ovulácie',
      'Relatívny nadbytok androgénov',
      'Inzulínová rezistencia u niektorých žien',
      'Metabolické a environmentálne faktory',
    ],
    s2NeutralText:
      'PCOS nie je osobné zlyhanie. Nevyplýva jednoducho z nedostatku vôle, zlej stravy alebo nedostatočnej fyzickej aktivity.',
    s3Heading: 'Hlavné príznaky',
    s3Body1:
      'PCOS sa môže u jednotlivých žien prejavovať veľmi odlišne. Niektoré majú viac príznakov, iné si všimnú len veľmi málo.',
    s3Signs: [
      'Nepravidelné, veľmi vzdialené alebo niekedy chýbajúce cykly',
      'Nepravidelná alebo ťažko predvídateľná ovulácia',
      'Pretrvávajúce akné, najmä na spodnej časti tváre',
      'Zvýšený rast chlpov na tvári, hrudi alebo tele',
      'Hormonálne vypadávanie vlasov',
      'Priberanie alebo ťažkosti s chudnutím',
      'Ťažkosti s počatím',
    ],
    s3AlertTitle: 'Dôležité',
    s3AlertText:
      'Mať jeden z týchto príznakov automaticky neznamená, že máte PCOS. Podobné príznaky môže spôsobovať niekoľko ďalších ochorení.',
    s4Heading: 'Ako sa diagnostikuje?',
    s4Body1:
      'Diagnostika PCOS je lekársky proces. Zdravotnícky pracovník zvyčajne začína rozhovorom o vašich cykloch, príznakoch, zdravotnej anamnéze a liečbach, ktoré užívate.',
    s4Body2:
      'Podľa situácie sa môžu ponúknuť aj hormonálne krvné testy a ultrazvuk.',
    s4Points: [
      'Nepravidelné cykly alebo zriedkavá ovulácia',
      'Znaky nadbytku androgénov: akné, nadmerný rast chlpov, vypadávanie vlasov alebo výsledky krvných testov',
      'Vzhľad vaječníkov zlučiteľný s PCOS na ultrazvuku, keď je toto vyšetrenie indikované',
    ],
    s4Body3:
      'Lekár musí pred potvrdením diagnózy PCOS vylúčiť aj iné možné príčiny nepravidelných cyklov alebo nadbytku androgénov.',
    s5Heading: 'PCOS a ovulácia',
    s5Body1:
      'Ovulácia je uvoľnenie vajíčka (oocytu) z vaječníka. Pri PCOS môže byť ovulácia zriedkavejšia alebo ťažšie predvídateľná.',
    s5Body2:
      'To môže vysvetľovať, prečo sú cykly niekedy dlhé, nepravidelné alebo ťažko predvídateľné.',
    s5HighlightTitle: 'Sledovanie cyklu',
    s5HighlightText:
      'Zaznamenávanie dátumov menštruácie, príznakov a prípadných znakov ovulácie vám môže pomôcť lepšie pochopiť vlastné vzorce.',
    s6Heading: 'PCOS a plodnosť',
    s6Body1:
      'Keďže ovulácia môže byť nepravidelná, niektoré ženy s PCOS môžu mať väčšie ťažkosti s počatím.',
    s6Body2:
      'To však neznamená, že PCOS automaticky bráni tehotenstvu. Mnohé ženy s PCOS počnú prirodzene alebo s vhodnou lekárskou podporou.',
    s6TipTitle: 'Pamätajte',
    s6TipText:
      'Ťažkosti s počatím neznamenajú, že je to nemožné. Ak dúfate v tehotenstvo, lekár alebo pôrodná asistentka môže navrhnúť stratégiu prispôsobenú vašej situácii.',
    s7Heading: 'PCOS a hmotnosť / metabolizmus',
    s7Body1:
      'PCOS môže byť spojený s metabolickými zmenami, vrátane inzulínovej rezistencie u niektorých žien.',
    s7Body2:
      'Samotná hmotnosť však nemôže PCOS diagnostikovať ani vylúčiť. Štíhla žena môže mať PCOS, rovnako ako žena s nadváhou ho mať nemusí.',
    s7NeutralText:
      'Následná starostlivosť by mala zohľadňovať celkové zdravie, nielen číslo na váhe.',
    s8Heading: 'Pokožka, vlasy a ochlpenie',
    s8Body1:
      'Relatívny nadbytok androgénov môže ovplyvniť mazové žľazy a vlasové folikuly.',
    s8Body2:
      'Podľa ženy sa to môže prejaviť ako pretrvávajúce akné, zvýšený rast chlpov alebo vypadávanie vlasov.',
    s8Items: [
      'Hormonálne akné',
      'Zvýšené ochlpenie tváre alebo tela',
      'Rednutie alebo vypadávanie vlasov',
    ],
    s9Heading: 'Ako sa PCOS lieči?',
    s9Body1:
      'Neexistuje jediný prístup k liečbe PCOS, ktorý by fungoval pre každú ženu. Voľba závisí od príznakov, cieľov a zdravotných okolností.',
    s9Body2:
      'Cieľ sa môže líšiť podľa životnej etapy: regulácia cyklov, zlepšenie niektorých príznakov, ochrana metabolického zdravia alebo podpora plánu na tehotenstvo.',
    s9MiniTitle: 'Návyky podporujúce zdravie',
    s9Lifestyle: [
      'Pestrá, pravidelná strava prispôsobená vašim potrebám',
      'Pravidelná fyzická aktivita, ktorú môžete dlhodobo udržať',
      'Dostatočne pravidelný spánok',
      'Sledovanie, ako sa vaše cykly a príznaky časom menia',
      'Neobviňovať sa za zmeny hmotnosti či príznakov',
    ],
    s9Body3:
      'Podľa vašich potrieb vám zdravotnícky pracovník môže ponúknuť aj liečby niektorých príznakov alebo podporu plánu na tehotenstvo.',
    s9AlertTitle: 'Žiadna samoliečba',
    s9AlertText:
      'Hormonálne liečby, metabolické lieky a výživové doplnky treba vždy prediskutovať so zdravotníckym pracovníkom.',
    s10Heading: 'Bežné mylné predstavy o PCOS',
    s10Myths: [
      'PCOS vždy znamená mať „cysty“: názov môže byť zavádzajúci. Diagnóza sa nezakladá len na prítomnosti cýst.',
      'Všetky ženy s PCOS majú nadváhu: PCOS môže postihnúť ženy všetkých postáv.',
      'PCOS vždy bráni tehotenstvu: ovulácia môže byť nepravidelná, ale tehotenstvo je stále možné.',
      'Na diagnostiku PCOS stačí jediný príznak: diagnóza si vyžaduje komplexné vyšetrenie.',
      'PCOS s vekom jednoducho odznie: jeho prejavy sa môžu v priebehu života meniť, ale pravidelné sledovanie zostáva dôležité.',
    ],
    s11Heading: 'Kedy navštíviť lekára',
    s11Body1:
      'Lekárska rada stojí za to najmä vtedy, keď sa cykly stanú veľmi nepravidelnými, na niekoľko mesiacov vymiznú alebo keď sa objavia nezvyčajné príznaky.',
    s11ConsultItems: [
      'Veľmi nepravidelné alebo chýbajúce cykly',
      'Nezvyčajné akné alebo rast chlpov',
      'Výrazné vypadávanie vlasov',
      'Ťažkosti s počatím',
      'Rýchlo sa meniace príznaky',
    ],
    s12Heading: 'Hlavné body',
    s12SummaryTitle: 'Podstatné body',
    s12SummaryItems: [
      'PCOS je bežné hormonálne ochorenie.',
      'Môže sa prejavovať mnohými rôznymi spôsobmi.',
      'Nie všetky ženy s PCOS majú rovnaké príznaky.',
      'Samotná hmotnosť nestačí na diagnostiku ani vylúčenie PCOS.',
      'Diagnóza si vyžaduje komplexné lekárske vyšetrenie.',
      'PCOS môže ovplyvniť ovuláciu a niekedy aj plodnosť.',
      'Individuálny prístup k starostlivosti pomáha uspokojiť potreby každej ženy.',
    ],
    finalNoteTitle: 'Sprievodca pre lepšie porozumenie',
    finalNoteText:
      'Tento článok je určený na všeobecné informovanie a nenahrádza lekársku konzultáciu. Každá situácia je iná: v prípade pochybností alebo pretrvávajúcich príznakov sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Pochopenie PCOS — AWA',
  },
  hu: {
    badge: 'PCOS • ALAPVETŐ ÚTMUTATÓ',
    title: 'A PCOS\nmegértése',
    metaDuration: '10 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ismeretterjesztő tartalom',
    intro:
      'A policisztás ovárium szindróma, gyakran PCOS-nek nevezve, gyakori hormonális állapot, amely befolyásolhatja a ciklusaidat, a peteérést, a bőrödet, a hajadat, az anyagcserédet, és néha a termékenységedet.',
    introSecondary:
      'Az, hogy hogyan jelentkezik, nőnként nagyon eltérő. A PCOS megértése főként abban segít, hogy felismerd a tüneteit, tudd, mikor kérj orvosi tanácsot, és önvád nélkül kövesd az alakulását.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a PCOS?',
      'Miért alakul ki a PCOS?',
      'A fő jelek',
      'Hogyan diagnosztizálják?',
      'PCOS és peteérés',
      'PCOS és termékenység',
      'PCOS és testsúly / anyagcsere',
      'Bőr, haj és testszőrzet',
      'Hogyan kezelik a PCOS-t?',
      'Gyakori tévhitek',
      'Mikor menj orvoshoz',
      'Legfontosabb tudnivalók',
    ],
    s1Heading: 'Mi a PCOS?',
    s1Body1:
      'A policisztás ovárium szindróma (PCOS) gyakori hormonális állapot, amely megváltoztathatja a petefészkek szokásos működését és egyes hormonok egyensúlyát.',
    s1Body2:
      'Egyes nőknél a fő probléma a szabálytalan peteérés. Másoknál az akné, a túlzott szőrnövekedés, a hajhullás vagy az anyagcsere-jelek tűnnek ki először.',
    s1TipTitle: 'Érdemes tudni',
    s1TipText:
      'A nevével ellentétben a PCOS nem feltétlenül jelenti azt, hogy a petefészkek „cisztákat” tartalmaznak. A történelmi elnevezés félrevezető lehet, és önmagában az ultrahang nem elég a diagnózis felállításához.',
    s2Heading: 'Miért alakul ki a PCOS?',
    s2Body1:
      'A PCOS-nek nincs egyetlen oka. Úgy tűnik, több, egymást erősítő tényező eredménye: családi hajlam, hormonális működés, peteérés, anyagcsere és egyéni tényezők.',
    s2Factors: [
      'Családi hajlam és genetikai tényezők',
      'A peteérés zavarai',
      'Az androgének relatív fölöslege',
      'Inzulinrezisztencia egyes nőknél',
      'Anyagcsere- és környezeti tényezők',
    ],
    s2NeutralText:
      'A PCOS nem személyes kudarc. Nem egyszerűen az akaraterő hiányából, a rossz étrendből vagy az elégtelen testmozgásból ered.',
    s3Heading: 'A fő jelek',
    s3Body1:
      'A PCOS nőnként nagyon eltérően jelentkezhet. Egyeseknek több tünetük van, mások csak nagyon keveset vesznek észre.',
    s3Signs: [
      'Szabálytalan, nagyon távoli vagy néha elmaradó ciklusok',
      'Szabálytalan vagy nehezen megjósolható peteérés',
      'Tartós akné, különösen az arc alsó részén',
      'Fokozott szőrnövekedés az arcon, a mellkason vagy a testen',
      'Hormonális jellegű hajhullás',
      'Súlygyarapodás vagy nehézség a fogyásban',
      'Nehézségek a fogantatásban',
    ],
    s3AlertTitle: 'Fontos',
    s3AlertText:
      'Az, hogy egy ilyen tüneted van, automatikusan nem jelenti, hogy PCOS-ed van. Több más állapot is okozhat hasonló tüneteket.',
    s4Heading: 'Hogyan diagnosztizálják?',
    s4Body1:
      'A PCOS diagnosztizálása orvosi folyamat. Az egészségügyi szakember általában a ciklusaidról, a tüneteidről, az orvosi előzményeidről és a szedett kezelésekről való beszélgetéssel kezd.',
    s4Body2:
      'A helyzettől függően hormonális vérvizsgálatot és ultrahangot is ajánlhatnak.',
    s4Points: [
      'Szabálytalan ciklusok vagy ritka peteérés',
      'Az androgénfölösleg jelei: akné, túlzott szőrnövekedés, hajhullás vagy vérvizsgálati eredmények',
      'A PCOS-sel összeegyeztethető petefészek-megjelenés ultrahangon, ha ez a vizsgálat indokolt',
    ],
    s4Body3:
      'Az orvosnak a PCOS-diagnózis megerősítése előtt ki kell zárnia a szabálytalan ciklusok vagy az androgénfölösleg más lehetséges okait is.',
    s5Heading: 'PCOS és peteérés',
    s5Body1:
      'A peteérés a petesejt kiszabadulása a petefészekből. PCOS esetén a peteérés ritkább vagy nehezebben megjósolható lehet.',
    s5Body2:
      'Ez megmagyarázhatja, miért hosszúak, szabálytalanok vagy nehezen előre láthatók néha a ciklusok.',
    s5HighlightTitle: 'A ciklusod követése',
    s5HighlightText:
      'A menstruációd dátumainak, a tüneteidnek és a peteérés esetleges jeleinek feljegyzése segíthet jobban megérteni a saját mintáidat.',
    s6Heading: 'PCOS és termékenység',
    s6Body1:
      'Mivel a peteérés szabálytalan lehet, egyes PCOS-sel élő nőknek nehezebb lehet a fogantatás.',
    s6Body2:
      'Ez azonban nem jelenti azt, hogy a PCOS automatikusan megakadályozza a terhességet. Sok PCOS-sel élő nő természetes úton vagy megfelelő orvosi támogatással foganhat.',
    s6TipTitle: 'Tartsd észben',
    s6TipText:
      'A fogantatás nehézsége nem jelenti, hogy lehetetlen. Ha terhességet remélsz, egy orvos vagy szülésznő a helyzetedhez igazított stratégiát javasolhat.',
    s7Heading: 'PCOS és testsúly / anyagcsere',
    s7Body1:
      'A PCOS anyagcsere-változásokkal járhat együtt, beleértve egyes nőknél az inzulinrezisztenciát.',
    s7Body2:
      'A testsúly önmagában azonban nem tudja a PCOS-t diagnosztizálni vagy kizárni. Egy sovány nőnek is lehet PCOS-e, ahogy egy túlsúlyos nőnek nem biztos, hogy van.',
    s7NeutralText:
      'Az utánkövetésnek az általános egészséget kell figyelembe vennie, nem csak a mérlegen látható számot.',
    s8Heading: 'Bőr, haj és testszőrzet',
    s8Body1:
      'Az androgének relatív fölöslege befolyásolhatja a faggyúmirigyeket és a szőrtüszőket.',
    s8Body2:
      'Nőtől függően ez megnyilvánulhat tartós aknéként, fokozott szőrnövekedésként vagy hajhullásként.',
    s8Items: [
      'Hormonális akné',
      'Fokozott arc- vagy testszőrzet',
      'Hajritkulás vagy hajhullás',
    ],
    s9Heading: 'Hogyan kezelik a PCOS-t?',
    s9Body1:
      'Nincs egyetlen, minden nő számára működő megközelítés a PCOS kezelésére. A választás a tünetektől, a céloktól és az egészségügyi körülményektől függ.',
    s9Body2:
      'A cél az élet szakaszától függően eltérhet: a ciklusok szabályozása, egyes tünetek javítása, az anyagcsere-egészség védelme vagy egy terhességi terv támogatása.',
    s9MiniTitle: 'Az egészséget támogató szokások',
    s9Lifestyle: [
      'Változatos, rendszeres, az igényeidhez igazított étrend',
      'Rendszeres, hosszú távon fenntartható testmozgás',
      'Elég rendszeres alvás',
      'A ciklusaid és tüneteid időbeli változásának követése',
      'Ne hibáztasd magad a testsúly vagy a tünetek változásai miatt',
    ],
    s9Body3:
      'Az igényeidtől függően az egészségügyi szakember egyes tünetekre vagy egy terhességi terv támogatására is javasolhat kezeléseket.',
    s9AlertTitle: 'Ne gyógyítsd magad',
    s9AlertText:
      'A hormonális kezeléseket, az anyagcsere-gyógyszereket és a táplálékkiegészítőket mindig meg kell beszélni egy egészségügyi szakemberrel.',
    s10Heading: 'Gyakori tévhitek a PCOS-ről',
    s10Myths: [
      'A PCOS mindig „cisztákat” jelent: a név félrevezető lehet. A diagnózis nem kizárólag a ciszták jelenlétén alapul.',
      'Minden PCOS-sel élő nő túlsúlyos: a PCOS bármilyen testalkatú nőt érinthet.',
      'A PCOS mindig megakadályozza a terhességet: a peteérés lehet szabálytalan, de a terhesség továbbra is lehetséges.',
      'Egyetlen tünet elég a PCOS diagnosztizálásához: a diagnózis átfogó kivizsgálást igényel.',
      'A PCOS az életkorral egyszerűen elmúlik: megjelenése az élet során változhat, de a folyamatos utánkövetés fontos marad.',
    ],
    s11Heading: 'Mikor menj orvoshoz',
    s11Body1:
      'Az orvosi tanács különösen akkor érdemes, ha a ciklusok nagyon szabálytalanná válnak, több hónapra megszűnnek, vagy ha szokatlan tünetek jelennek meg.',
    s11ConsultItems: [
      'Nagyon szabálytalan vagy elmaradó ciklusok',
      'Szokatlan akné vagy szőrnövekedés',
      'Jelentős hajhullás',
      'Nehézségek a fogantatásban',
      'Gyorsan változó tünetek',
    ],
    s12Heading: 'Legfontosabb tudnivalók',
    s12SummaryTitle: 'A lényeges pontok',
    s12SummaryItems: [
      'A PCOS gyakori hormonális állapot.',
      'Sokféleképpen jelentkezhet.',
      'Nem minden PCOS-sel élő nőnek ugyanazok a tünetei.',
      'A testsúly önmagában nem elég a PCOS diagnosztizálásához vagy kizárásához.',
      'A diagnózis átfogó orvosi kivizsgálást igényel.',
      'A PCOS befolyásolhatja a peteérést és néha a termékenységet.',
      'Az egyénre szabott ellátás segít kielégíteni minden nő igényeit.',
    ],
    finalNoteTitle: 'Útmutató a jobb megértéshez',
    finalNoteText:
      'Ez a cikk általános tájékoztatásra szolgál, és nem helyettesíti az orvosi konzultációt. Minden helyzet más: kétség esetén vagy ha a tünetek fennmaradnak, kérj tanácsot egészségügyi szakembertől.',
    shareMessage: 'A PCOS megértése — AWA',
  },
  ro: {
    badge: 'SOP • GHID ESENȚIAL',
    title: 'Înțelegerea\nSOP',
    metaDuration: '10 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut educativ',
    intro:
      'Sindromul ovarelor polichistice, numit adesea SOP, este o afecțiune hormonală frecventă care îți poate afecta ciclurile, ovulația, pielea, părul, metabolismul și, uneori, fertilitatea.',
    introSecondary:
      'Modul în care se manifestă variază mult de la o femeie la alta. Înțelegerea SOP te ajută mai ales să-i recunoști simptomele, să știi când să ceri un sfat medical și să urmărești evoluția lui fără autoculpabilizare.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este SOP?',
      'De ce apare SOP?',
      'Principalele semne',
      'Cum este diagnosticat?',
      'SOP și ovulația',
      'SOP și fertilitatea',
      'SOP și greutatea / metabolismul',
      'Pielea, părul și pilozitatea',
      'Cum se gestionează SOP?',
      'Idei preconcepute frecvente',
      'Când să mergi la medic',
      'Ce să reții',
    ],
    s1Heading: 'Ce este SOP?',
    s1Body1:
      'Sindromul ovarelor polichistice (SOP) este o afecțiune hormonală frecventă care poate modifica funcționarea obișnuită a ovarelor și echilibrul anumitor hormoni.',
    s1Body2:
      'Pentru unele femei, problema principală este ovulația neregulată. Pentru altele, acneea, creșterea excesivă a părului, căderea părului sau semnele metabolice sunt cele care ies primele în evidență.',
    s1TipTitle: 'Bine de știut',
    s1TipText:
      'În ciuda numelui, SOP nu înseamnă neapărat că ovarele conțin „chisturi”. Termenul istoric poate induce în eroare, iar o ecografie singură nu este suficientă pentru a pune diagnosticul.',
    s2Heading: 'De ce apare SOP?',
    s2Body1:
      'Nu există o singură cauză a SOP. Pare să rezulte din mai mulți factori care se pot combina: predispoziția familială, funcționarea hormonală, ovulația, metabolismul și factori individuali.',
    s2Factors: [
      'Predispoziția familială și factorii genetici',
      'Perturbări ale ovulației',
      'Exces relativ de androgeni',
      'Rezistența la insulină la unele femei',
      'Factori metabolici și de mediu',
    ],
    s2NeutralText:
      'SOP nu este un eșec personal. Nu rezultă pur și simplu dintr-o lipsă de voință, o alimentație proastă sau o activitate fizică insuficientă.',
    s3Heading: 'Principalele semne',
    s3Body1:
      'SOP se poate manifesta foarte diferit de la o femeie la alta. Unele au mai multe simptome, în timp ce altele observă foarte puține.',
    s3Signs: [
      'Cicluri neregulate, foarte distanțate sau uneori absente',
      'Ovulație neregulată sau greu de prevăzut',
      'Acnee persistentă, în special în partea inferioară a feței',
      'Creștere accentuată a părului pe față, piept sau corp',
      'Cădere a părului de tip hormonal',
      'Creștere în greutate sau dificultate de a slăbi',
      'Dificultăți de a rămâne însărcinată',
    ],
    s3AlertTitle: 'Important',
    s3AlertText:
      'Faptul că ai unul dintre aceste simptome nu înseamnă automat că ai SOP. Alte afecțiuni pot provoca simptome similare.',
    s4Heading: 'Cum este diagnosticat?',
    s4Body1:
      'Diagnosticarea SOP este un proces medical. Un profesionist din domeniul sănătății începe de obicei prin a discuta despre ciclurile tale, simptome, istoricul medical și eventualele tratamente pe care le urmezi.',
    s4Body2:
      'În funcție de situație, pot fi propuse și analize hormonale de sânge și o ecografie.',
    s4Points: [
      'Cicluri neregulate sau ovulație rară',
      'Semne de exces de androgeni: acnee, creștere excesivă a părului, cădere a părului sau rezultate ale analizelor de sânge',
      'Aspect al ovarelor compatibil cu SOP la ecografie, atunci când acest examen este indicat',
    ],
    s4Body3:
      'Medicul trebuie să excludă și alte cauze posibile de cicluri neregulate sau de exces de androgeni înainte de a confirma un diagnostic de SOP.',
    s5Heading: 'SOP și ovulația',
    s5Body1:
      'Ovulația este eliberarea unui ovul (ovocit) din ovar. În SOP, ovulația poate fi mai rară sau mai greu de prevăzut.',
    s5Body2:
      'Aceasta poate explica de ce ciclurile sunt uneori lungi, neregulate sau greu de anticipat.',
    s5HighlightTitle: 'Urmărirea ciclului',
    s5HighlightText:
      'Notarea datelor menstruației, a simptomelor și a oricăror semne de ovulație te poate ajuta să-ți înțelegi mai bine propriile tipare.',
    s6Heading: 'SOP și fertilitatea',
    s6Body1:
      'Deoarece ovulația poate fi neregulată, unele femei cu SOP pot avea mai multe dificultăți în a rămâne însărcinate.',
    s6Body2:
      'Aceasta nu înseamnă, totuși, că SOP împiedică automat sarcina. Multe femei cu SOP concep natural sau cu un sprijin medical adecvat.',
    s6TipTitle: 'De ținut minte',
    s6TipText:
      'Dificultatea de a rămâne însărcinată nu înseamnă că este imposibil. Dacă speri să rămâi însărcinată, un medic sau o moașă îți poate propune o strategie adaptată situației tale.',
    s7Heading: 'SOP și greutatea / metabolismul',
    s7Body1:
      'SOP poate fi asociat cu modificări metabolice, inclusiv rezistență la insulină la unele femei.',
    s7Body2:
      'Cu toate acestea, greutatea singură nu poate diagnostica sau exclude SOP. O femeie slabă poate avea SOP, la fel cum o femeie supraponderală poate să nu îl aibă.',
    s7NeutralText:
      'Urmărirea medicală trebuie să ia în considerare sănătatea generală, nu doar cifra de pe cântar.',
    s8Heading: 'Pielea, părul și pilozitatea',
    s8Body1:
      'Excesul relativ de androgeni poate afecta glandele sebacee și foliculii piloși.',
    s8Body2:
      'În funcție de femeie, aceasta se poate manifesta prin acnee persistentă, creștere accentuată a părului sau cădere a părului.',
    s8Items: [
      'Acnee hormonală',
      'Păr facial sau corporal mai abundent',
      'Păr subțiat sau cădere a părului',
    ],
    s9Heading: 'Cum se gestionează SOP?',
    s9Body1:
      'Nu există o singură abordare de gestionare a SOP care să funcționeze pentru toate femeile. Alegerea depinde de simptome, de obiective și de circumstanțele medicale.',
    s9Body2:
      'Scopul poate diferi în funcție de etapa vieții: reglarea ciclurilor, ameliorarea anumitor simptome, protejarea sănătății metabolice sau susținerea unui plan de sarcină.',
    s9MiniTitle: 'Obiceiuri care susțin sănătatea',
    s9Lifestyle: [
      'O alimentație variată și regulată, adaptată nevoilor tale',
      'O activitate fizică regulată pe care o poți susține în timp',
      'Menținerea unui somn suficient de regulat',
      'Urmărirea modului în care ciclurile și simptomele tale se schimbă în timp',
      'Să nu te învinovățești pentru schimbările de greutate sau de simptome',
    ],
    s9Body3:
      'În funcție de nevoile tale, un profesionist din domeniul sănătății poate propune și tratamente pentru anumite simptome sau pentru a susține un plan de sarcină.',
    s9AlertTitle: 'Nu te automedica',
    s9AlertText:
      'Tratamentele hormonale, medicamentele metabolice și suplimentele alimentare trebuie toate discutate cu un profesionist din domeniul sănătății.',
    s10Heading: 'Idei preconcepute frecvente despre SOP',
    s10Myths: [
      'SOP înseamnă întotdeauna a avea „chisturi”: numele poate induce în eroare. Diagnosticul nu se bazează doar pe prezența chisturilor.',
      'Toate femeile cu SOP sunt supraponderale: SOP poate afecta femei de toate constituțiile.',
      'SOP împiedică întotdeauna sarcina: ovulația poate fi neregulată, dar sarcina rămâne posibilă.',
      'Un singur simptom este suficient pentru a diagnostica SOP: diagnosticul necesită o evaluare completă.',
      'SOP dispare pur și simplu cu vârsta: modul în care se prezintă se poate schimba de-a lungul vieții, dar urmărirea continuă rămâne importantă.',
    ],
    s11Heading: 'Când să mergi la medic',
    s11Body1:
      'Un sfat medical merită în special atunci când ciclurile devin foarte neregulate, se opresc câteva luni sau când apar simptome neobișnuite.',
    s11ConsultItems: [
      'Cicluri foarte neregulate sau absente',
      'Acnee sau creștere a părului neobișnuite',
      'Cădere importantă a părului',
      'Dificultăți de a rămâne însărcinată',
      'Simptome care se schimbă rapid',
    ],
    s12Heading: 'Ce să reții',
    s12SummaryTitle: 'Punctele esențiale',
    s12SummaryItems: [
      'SOP este o afecțiune hormonală frecventă.',
      'Se poate manifesta în multe feluri diferite.',
      'Nu toate femeile cu SOP au aceleași simptome.',
      'Greutatea singură nu este suficientă pentru a diagnostica sau exclude SOP.',
      'Diagnosticul necesită o evaluare medicală completă.',
      'SOP poate afecta ovulația și, uneori, fertilitatea.',
      'O abordare personalizată a îngrijirii ajută la satisfacerea nevoilor fiecărei femei.',
    ],
    finalNoteTitle: 'Un ghid pentru o mai bună înțelegere',
    finalNoteText:
      'Acest articol este destinat informării generale și nu înlocuiește o consultație medicală. Fiecare situație este diferită: dacă ai îndoieli sau simptomele persistă, cere sfatul unui profesionist din domeniul sănătății.',
    shareMessage: 'Înțelegerea SOP — AWA',
  },
  bg: {
    badge: 'СПКЯ • ОСНОВНО РЪКОВОДСТВО',
    title: 'Разбиране на\nСПКЯ',
    metaDuration: '10 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Образователно съдържание',
    intro:
      'Синдромът на поликистозните яйчници, често наричан СПКЯ, е често срещано хормонално състояние, което може да засяга цикъла, овулацията, кожата, косата, метаболизма и понякога плодовитостта ти.',
    introSecondary:
      'Начинът, по който се проявява, варира много от жена на жена. Разбирането на СПКЯ ти помага най-вече да разпознаваш симптомите му, да знаеш кога да потърсиш медицински съвет и да следиш развитието му без самообвинение.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е СПКЯ?',
      'Защо се появява СПКЯ?',
      'Основните признаци',
      'Как се поставя диагнозата?',
      'СПКЯ и овулация',
      'СПКЯ и плодовитост',
      'СПКЯ и тегло / метаболизъм',
      'Кожа, коса и окосмяване',
      'Как се лекува СПКЯ?',
      'Чести заблуди',
      'Кога да посетиш лекар',
      'Какво да запомниш',
    ],
    s1Heading: 'Какво е СПКЯ?',
    s1Body1:
      'Синдромът на поликистозните яйчници (СПКЯ) е често срещано хормонално състояние, което може да промени обичайното функциониране на яйчниците и баланса на някои хормони.',
    s1Body2:
      'При някои жени основният проблем е нередовната овулация. При други първо се открояват акнето, прекомерният растеж на косми, косопадът или метаболитните признаци.',
    s1TipTitle: 'Добре е да знаеш',
    s1TipText:
      'Въпреки името си, СПКЯ не означава непременно, че яйчниците съдържат „кисти“. Историческият термин може да заблуди, а ехографията сама не е достатъчна за диагнозата.',
    s2Heading: 'Защо се появява СПКЯ?',
    s2Body1:
      'Няма една-единствена причина за СПКЯ. Изглежда резултат от няколко фактора, които могат да се съчетават: семейна предразположеност, хормонално функциониране, овулация, метаболизъм и индивидуални фактори.',
    s2Factors: [
      'Семейна предразположеност и генетични фактори',
      'Нарушения на овулацията',
      'Относителен излишък на андрогени',
      'Инсулинова резистентност при някои жени',
      'Метаболитни и екологични фактори',
    ],
    s2NeutralText:
      'СПКЯ не е личен недостатък. Не е просто резултат от липса на силна воля, лошо хранене или недостатъчна физическа активност.',
    s3Heading: 'Основните признаци',
    s3Body1:
      'СПКЯ може да се проявява много различно от жена на жена. Някои имат няколко симптома, а други забелязват много малко.',
    s3Signs: [
      'Нередовни, силно разтеглени или понякога липсващи цикли',
      'Нередовна или трудна за предвиждане овулация',
      'Упорито акне, особено в долната част на лицето',
      'Засилен растеж на косми по лицето, гърдите или тялото',
      'Косопад по хормонален тип',
      'Напълняване или затруднение при отслабване',
      'Затруднение при зачеване',
    ],
    s3AlertTitle: 'Важно',
    s3AlertText:
      'Наличието на един от тези симптоми не означава автоматично, че имаш СПКЯ. Няколко други състояния могат да причинят подобни симптоми.',
    s4Heading: 'Как се поставя диагнозата?',
    s4Body1:
      'Поставянето на диагнозата СПКЯ е медицински процес. Здравният специалист обикновено започва с разговор за цикъла ти, симптомите, медицинската ти история и лечението, което приемаш.',
    s4Body2:
      'Според ситуацията могат да бъдат предложени и хормонални кръвни изследвания и ехография.',
    s4Points: [
      'Нередовни цикли или рядка овулация',
      'Признаци на излишък от андрогени: акне, прекомерен растеж на косми, косопад или резултати от кръвни изследвания',
      'Вид на яйчниците, съответстващ на СПКЯ на ехография, когато този преглед е показан',
    ],
    s4Body3:
      'Лекарят трябва да изключи и други възможни причини за нередовни цикли или излишък от андрогени, преди да потвърди диагноза СПКЯ.',
    s5Heading: 'СПКЯ и овулация',
    s5Body1:
      'Овулацията е освобождаването на яйцеклетка (ооцит) от яйчника. При СПКЯ овулацията може да е по-рядка или по-трудна за предвиждане.',
    s5Body2:
      'Това може да обясни защо циклите понякога са дълги, нередовни или трудни за предвиждане.',
    s5HighlightTitle: 'Проследяване на цикъла',
    s5HighlightText:
      'Записването на датите на менструацията, симптомите и евентуалните признаци на овулация може да ти помогне да разбереш по-добре собствените си модели.',
    s6Heading: 'СПКЯ и плодовитост',
    s6Body1:
      'Тъй като овулацията може да е нередовна, някои жени със СПКЯ може да имат по-голямо затруднение при зачеването.',
    s6Body2:
      'Това обаче не означава, че СПКЯ автоматично пречи на бременността. Много жени със СПКЯ зачеват естествено или с подходяща медицинска подкрепа.',
    s6TipTitle: 'Помни',
    s6TipText:
      'Затруднението при зачеването не означава, че е невъзможно. Ако се надяваш да забременееш, лекар или акушерка може да предложи стратегия, подходяща за ситуацията ти.',
    s7Heading: 'СПКЯ и тегло / метаболизъм',
    s7Body1:
      'СПКЯ може да се свързва с метаболитни промени, включително инсулинова резистентност при някои жени.',
    s7Body2:
      'Теглото само по себе си обаче не може нито да постави, нито да изключи диагноза СПКЯ. Слаба жена може да има СПКЯ, както и жена с наднормено тегло може да го няма.',
    s7NeutralText:
      'Проследяването трябва да взема предвид общото здраве, а не само цифрата на кантара.',
    s8Heading: 'Кожа, коса и окосмяване',
    s8Body1:
      'Относителният излишък на андрогени може да засяга мастните жлези и космените фоликули.',
    s8Body2:
      'Според жената това може да се прояви като упорито акне, засилен растеж на косми или косопад.',
    s8Items: [
      'Хормонално акне',
      'Засилено окосмяване по лицето или тялото',
      'Изтъняване на косата или косопад',
    ],
    s9Heading: 'Как се лекува СПКЯ?',
    s9Body1:
      'Няма един-единствен подход при СПКЯ, който да е подходящ за всяка жена. Изборът зависи от симптомите, целите и медицинските обстоятелства.',
    s9Body2:
      'Целта може да се различава според етапа от живота: регулиране на цикъла, подобряване на някои симптоми, защита на метаболитното здраве или подкрепа на план за бременност.',
    s9MiniTitle: 'Навици, подкрепящи здравето',
    s9Lifestyle: [
      'Разнообразно, редовно хранене, съобразено с нуждите ти',
      'Редовна физическа активност, която можеш да поддържаш във времето',
      'Достатъчно редовен сън',
      'Проследяване как цикълът и симптомите ти се променят във времето',
      'Без самообвинение за промените в теглото или симптомите',
    ],
    s9Body3:
      'Според нуждите ти здравният специалист може да предложи и лечения за някои симптоми или в подкрепа на план за бременност.',
    s9AlertTitle: 'Без самолечение',
    s9AlertText:
      'Хормоналните лечения, метаболитните лекарства и хранителните добавки трябва да се обсъждат със здравен специалист.',
    s10Heading: 'Чести заблуди за СПКЯ',
    s10Myths: [
      'СПКЯ винаги означава наличие на „кисти“: името може да заблуди. Диагнозата не се основава само на наличието на кисти.',
      'Всички жени със СПКЯ са с наднормено тегло: СПКЯ може да засяга жени с всякакво телосложение.',
      'СПКЯ винаги пречи на бременността: овулацията може да е нередовна, но бременността все пак е възможна.',
      'Един симптом е достатъчен за диагноза СПКЯ: диагнозата изисква цялостна оценка.',
      'СПКЯ просто изчезва с възрастта: проявите му могат да се променят през живота, но продължителното проследяване остава важно.',
    ],
    s11Heading: 'Кога да посетиш лекар',
    s11Body1:
      'Медицинският съвет е особено полезен, когато циклите станат много нередовни, спрат за няколко месеца или когато се появят необичайни симптоми.',
    s11ConsultItems: [
      'Много нередовни или липсващи цикли',
      'Необичайно акне или растеж на косми',
      'Значителен косопад',
      'Затруднение при зачеване',
      'Бързо променящи се симптоми',
    ],
    s12Heading: 'Какво да запомниш',
    s12SummaryTitle: 'Основните точки',
    s12SummaryItems: [
      'СПКЯ е често срещано хормонално състояние.',
      'Може да се проявява по много различни начини.',
      'Не всички жени със СПКЯ имат едни и същи симптоми.',
      'Теглото само по себе си не е достатъчно, за да се постави или изключи СПКЯ.',
      'Диагнозата изисква цялостна медицинска оценка.',
      'СПКЯ може да засяга овулацията и понякога плодовитостта.',
      'Персонализираният подход към грижата помага да се отговори на нуждите на всяка жена.',
    ],
    finalNoteTitle: 'Ръководство за по-добро разбиране',
    finalNoteText:
      'Тази статия е предназначена за обща информация и не замества медицинска консултация. Всяка ситуация е различна: при съмнение или ако симптомите продължават, потърси съвет от здравен специалист.',
    shareMessage: 'Разбиране на СПКЯ — AWA',
  },
  sr: {
    badge: 'ПЦОС • ОСНОВНИ ВОДИЧ',
    title: 'Разумевање\nПЦОС-а',
    metaDuration: '10 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Образовни садржај',
    intro:
      'Синдром полицистичних јајника, често називан ПЦОС, чест је хормонски поремећај који може утицати на твоје циклусе, овулацију, кожу, косу, метаболизам и понекад плодност.',
    introSecondary:
      'Начин на који се испољава увелико варира од жене до жене. Разумевање ПЦОС-а ти углавном помаже да препознајеш његове симптоме, знаш када да потражиш медицински савет и пратиш његов развој без самообвињавања.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је ПЦОС?',
      'Зашто се јавља ПЦОС?',
      'Главни знаци',
      'Како се дијагностикује?',
      'ПЦОС и овулација',
      'ПЦОС и плодност',
      'ПЦОС и тежина / метаболизам',
      'Кожа, коса и длаке',
      'Како се ПЦОС лечи?',
      'Чести погрешни ставови',
      'Када посетити лекара',
      'Шта да запамтиш',
    ],
    s1Heading: 'Шта је ПЦОС?',
    s1Body1:
      'Синдром полицистичних јајника (ПЦОС) је чест хормонски поремећај који може променити уобичајено функционисање јајника и равнотежу одређених хормона.',
    s1Body2:
      'Код неких жена главни проблем је нередовна овулација. Код других прво се истичу акне, прекомеран раст длака, опадање косе или метаболички знаци.',
    s1TipTitle: 'Добро је знати',
    s1TipText:
      'Упркос имену, ПЦОС не значи нужно да јајници садрже „цисте“. Историјски термин може бити погрешан, а сам ултразвук није довољан за постављање дијагнозе.',
    s2Heading: 'Зашто се јавља ПЦОС?',
    s2Body1:
      'Не постоји један узрок ПЦОС-а. Изгледа да је резултат неколико фактора који се могу комбиновати: породична предиспозиција, хормонско функционисање, овулација, метаболизам и индивидуални фактори.',
    s2Factors: [
      'Породична предиспозиција и генетски фактори',
      'Поремећаји овулације',
      'Релативан вишак андрогена',
      'Инсулинска резистенција код неких жена',
      'Метаболички и фактори околине',
    ],
    s2NeutralText:
      'ПЦОС није лични недостатак. Није једноставно резултат недостатка воље, лоше исхране или недовољне физичке активности.',
    s3Heading: 'Главни знаци',
    s3Body1:
      'ПЦОС се може испољавати веома различито од жене до жене. Неке имају неколико симптома, док друге примећују врло мало.',
    s3Signs: [
      'Нередовни, јако размакнути или понекад одсутни циклуси',
      'Нередовна или тешко предвидива овулација',
      'Упорне акне, нарочито у доњем делу лица',
      'Појачан раст длака на лицу, грудима или телу',
      'Опадање косе по хормонском типу',
      'Добијање на тежини или тешкоће при губитку тежине',
      'Тешкоће при зачећу',
    ],
    s3AlertTitle: 'Важно',
    s3AlertText:
      'Постојање једног од ових симптома не значи аутоматски да имаш ПЦОС. Неколико других стања може изазвати сличне симптоме.',
    s4Heading: 'Како се дијагностикује?',
    s4Body1:
      'Постављање дијагнозе ПЦОС-а је медицински процес. Здравствени радник обично почиње разговором о твојим циклусима, симптомима, медицинској историји и терапијама које узимаш.',
    s4Body2:
      'Зависно од ситуације, могу се предложити и хормонске анализе крви и ултразвук.',
    s4Points: [
      'Нередовни циклуси или ретка овулација',
      'Знаци вишка андрогена: акне, прекомеран раст длака, опадање косе или резултати анализа крви',
      'Изглед јајника који одговара ПЦОС-у на ултразвуку, када је тај преглед индикован',
    ],
    s4Body3:
      'Лекар такође мора искључити друге могуће узроке нередовних циклуса или вишка андрогена пре него што потврди дијагнозу ПЦОС-а.',
    s5Heading: 'ПЦОС и овулација',
    s5Body1:
      'Овулација је ослобађање јајне ћелије (ооцита) из јајника. Код ПЦОС-а овулација може бити ређа или теже предвидива.',
    s5Body2:
      'То може објаснити зашто су циклуси понекад дуги, нередовни или тешко предвидиви.',
    s5HighlightTitle: 'Праћење циклуса',
    s5HighlightText:
      'Бележење датума менструације, симптома и евентуалних знакова овулације може ти помоћи да боље разумеш сопствене обрасце.',
    s6Heading: 'ПЦОС и плодност',
    s6Body1:
      'Пошто овулација може бити нередовна, неке жене са ПЦОС-ом могу имати веће тешкоће при зачећу.',
    s6Body2:
      'То међутим не значи да ПЦОС аутоматски спречава трудноћу. Многе жене са ПЦОС-ом зачињу природно или уз одговарајућу медицинску подршку.',
    s6TipTitle: 'Имај на уму',
    s6TipText:
      'Тешкоћа при зачећу не значи да је немогуће. Ако се надаш трудноћи, лекар или бабица може предложити стратегију прилагођену твојој ситуацији.',
    s7Heading: 'ПЦОС и тежина / метаболизам',
    s7Body1:
      'ПЦОС се може повезивати са метаболичким променама, укључујући инсулинску резистенцију код неких жена.',
    s7Body2:
      'Међутим, сама тежина не може ни да постави ни да искључи дијагнозу ПЦОС-а. Витка жена може имати ПЦОС, као што и жена са вишком килограма може да га нема.',
    s7NeutralText:
      'Праћење треба да узима у обзир опште здравље, а не само број на ваги.',
    s8Heading: 'Кожа, коса и длаке',
    s8Body1:
      'Релативан вишак андрогена може утицати на лојне жлезде и фоликуле длака.',
    s8Body2:
      'Зависно од жене, то се може испољити као упорне акне, појачан раст длака или опадање косе.',
    s8Items: [
      'Хормонске акне',
      'Појачана длакавост лица или тела',
      'Истањена коса или опадање косе',
    ],
    s9Heading: 'Како се ПЦОС лечи?',
    s9Body1:
      'Не постоји један приступ лечењу ПЦОС-а који одговара свакој жени. Избор зависи од симптома, циљева и медицинских околности.',
    s9Body2:
      'Циљ се може разликовати зависно од животне фазе: регулисање циклуса, побољшање одређених симптома, заштита метаболичког здравља или подршка плану за трудноћу.',
    s9MiniTitle: 'Навике које подржавају здравље',
    s9Lifestyle: [
      'Разноврсна, редовна исхрана прилагођена твојим потребама',
      'Редовна физичка активност коју можеш одржавати током времена',
      'Довољно редован сан',
      'Праћење како се циклуси и симптоми мењају током времена',
      'Не окривљуј себе за промене тежине или симптома',
    ],
    s9Body3:
      'Зависно од твојих потреба, здравствени радник може предложити и терапије за одређене симптоме или у подршку плану за трудноћу.',
    s9AlertTitle: 'Без самолечења',
    s9AlertText:
      'Хормонске терапије, метаболичке лекове и дијететске додатке треба размотрити са здравственим радником.',
    s10Heading: 'Чести погрешни ставови о ПЦОС-у',
    s10Myths: [
      'ПЦОС увек значи имати „цисте“: назив може завести. Дијагноза се не ослања само на присуство циста.',
      'Све жене са ПЦОС-ом имају вишак килограма: ПЦОС може погађати жене сваког телосложења.',
      'ПЦОС увек спречава трудноћу: овулација може бити нередовна, али трудноћа је и даље могућа.',
      'Један симптом је довољан за дијагнозу ПЦОС-а: дијагноза захтева свеобухватну процену.',
      'ПЦОС просто нестаје с годинама: начин испољавања може се мењати током живота, али континуирано праћење остаје важно.',
    ],
    s11Heading: 'Када посетити лекара',
    s11Body1:
      'Медицински савет је нарочито вредан када циклуси постану веома нередовни, престану на неколико месеци или када се појаве необични симптоми.',
    s11ConsultItems: [
      'Веома нередовни или одсутни циклуси',
      'Необичне акне или раст длака',
      'Значајно опадање косе',
      'Тешкоће при зачећу',
      'Симптоми који се брзо мењају',
    ],
    s12Heading: 'Шта да запамтиш',
    s12SummaryTitle: 'Основне тачке',
    s12SummaryItems: [
      'ПЦОС је чест хормонски поремећај.',
      'Може се испољавати на много различитих начина.',
      'Не показују све жене са ПЦОС-ом исте симптоме.',
      'Сама тежина није довољна да се постави или искључи ПЦОС.',
      'Дијагноза захтева свеобухватну медицинску процену.',
      'ПЦОС може утицати на овулацију и понекад на плодност.',
      'Персонализован приступ нези помаже да се одговори на потребе сваке жене.',
    ],
    finalNoteTitle: 'Водич за боље разумевање',
    finalNoteText:
      'Овај чланак је намењен општем информисању и не замењује лекарску консултацију. Свака ситуација је различита: при сумњи или ако симптоми трају, потражи савет од здравственог радника.',
    shareMessage: 'Разумевање ПЦОС-а — AWA',
  },
  hr: {
    badge: 'PCOS • OSNOVNI VODIČ',
    title: 'Razumijevanje\nPCOS-a',
    metaDuration: '10 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Edukativni sadržaj',
    intro:
      'Sindrom policističnih jajnika, često zvan PCOS, često je hormonsko stanje koje može utjecati na tvoje cikluse, ovulaciju, kožu, kosu, metabolizam i ponekad plodnost.',
    introSecondary:
      'Način na koji se pokazuje jako se razlikuje od žene do žene. Razumijevanje PCOS-a ponajprije ti pomaže prepoznati simptome, znati kada zatražiti liječnički savjet i pratiti njegov razvoj bez samooptuživanja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je PCOS?',
      'Zašto nastaje PCOS?',
      'Glavni znakovi',
      'Kako se dijagnosticira?',
      'PCOS i ovulacija',
      'PCOS i plodnost',
      'PCOS i težina / metabolizam',
      'Koža, kosa i dlake na tijelu',
      'Kako se PCOS zbrinjava?',
      'Česta pogrešna uvjerenja',
      'Kada posjetiti liječnika',
      'Ključne poruke',
    ],
    s1Heading: 'Što je PCOS?',
    s1Body1:
      'Sindrom policističnih jajnika (PCOS) čest je hormonski poremećaj koji može promijeniti uobičajeno funkcioniranje jajnika i ravnotežu određenih hormona.',
    s1Body2:
      'Kod nekih je žena glavni problem nepravilna ovulacija. Kod drugih prvo upadaju u oči akne, pretjeran rast dlaka, gubitak kose ili metabolički znakovi.',
    s1TipTitle: 'Dobro je znati',
    s1TipText:
      'Unatoč nazivu, PCOS ne znači nužno da jajnici sadrže „ciste“. Povijesni naziv može zavarati, a sam ultrazvuk nije dovoljan za postavljanje dijagnoze.',
    s2Heading: 'Zašto nastaje PCOS?',
    s2Body1:
      'Ne postoji jedan uzrok PCOS-a. Čini se da proizlazi iz nekoliko čimbenika koji se mogu kombinirati: obiteljske sklonosti, hormonskog funkcioniranja, ovulacije, metabolizma i individualnih čimbenika.',
    s2Factors: [
      'Obiteljska sklonost i genetski čimbenici',
      'Poremećaji ovulacije',
      'Relativni višak androgena',
      'Inzulinska rezistencija kod nekih žena',
      'Metabolički i okolišni čimbenici',
    ],
    s2NeutralText:
      'PCOS nije osobni neuspjeh. Ne proizlazi jednostavno iz nedostatka snage volje, loše prehrane ili nedovoljne tjelesne aktivnosti.',
    s3Heading: 'Glavni znakovi',
    s3Body1:
      'PCOS se može pokazati vrlo različito od žene do žene. Neke imaju nekoliko simptoma, dok druge primjećuju vrlo malo.',
    s3Signs: [
      'Nepravilni, jako razmaknuti ili ponekad odsutni ciklusi',
      'Nepravilna ili teško predvidljiva ovulacija',
      'Uporne akne, osobito na donjem dijelu lica',
      'Pojačan rast dlaka na licu, prsima ili tijelu',
      'Gubitak kose hormonskog obrasca',
      'Dobivanje na težini ili teškoće s gubitkom težine',
      'Teškoće sa začećem',
    ],
    s3AlertTitle: 'Važno',
    s3AlertText:
      'Imati jedan od ovih simptoma automatski ne znači da imaš PCOS. Nekoliko drugih stanja može uzrokovati slične simptome.',
    s4Heading: 'Kako se dijagnosticira?',
    s4Body1:
      'Dijagnosticiranje PCOS-a medicinski je proces. Zdravstveni djelatnik obično započinje razgovorom o tvojim ciklusima, simptomima, medicinskoj anamnezi i terapijama koje uzimaš.',
    s4Body2:
      'Ovisno o situaciji, mogu se predložiti i hormonske krvne pretrage te ultrazvuk.',
    s4Points: [
      'Nepravilni ciklusi ili rijetka ovulacija',
      'Znakovi viška androgena: akne, pretjeran rast dlaka, gubitak kose ili rezultati krvnih pretraga',
      'Izgled jajnika u skladu s PCOS-om na ultrazvuku, kad je ta pretraga indicirana',
    ],
    s4Body3:
      'Liječnik mora isključiti i druge moguće uzroke nepravilnih ciklusa ili viška androgena prije potvrde dijagnoze PCOS-a.',
    s5Heading: 'PCOS i ovulacija',
    s5Body1:
      'Ovulacija je oslobađanje jajne stanice (oocite) iz jajnika. Kod PCOS-a ovulacija može biti rjeđa ili teže predvidljiva.',
    s5Body2:
      'To može objasniti zašto su ciklusi ponekad dugi, nepravilni ili teško predvidljivi.',
    s5HighlightTitle: 'Praćenje ciklusa',
    s5HighlightText:
      'Bilježenje datuma menstruacije, simptoma i svih znakova ovulacije može ti pomoći bolje razumjeti vlastite obrasce.',
    s6Heading: 'PCOS i plodnost',
    s6Body1:
      'Budući da ovulacija može biti nepravilna, neke žene s PCOS-om mogu teže začeti.',
    s6Body2:
      'To ipak ne znači da PCOS automatski sprječava trudnoću. Mnoge žene s PCOS-om zatrudne prirodno ili uz odgovarajuću medicinsku podršku.',
    s6TipTitle: 'Imaj na umu',
    s6TipText:
      'Teškoće sa začećem ne znače da je ono nemoguće. Ako se nadaš trudnoći, liječnik ili babica mogu predložiti strategiju prilagođenu tvojoj situaciji.',
    s7Heading: 'PCOS i težina / metabolizam',
    s7Body1:
      'PCOS može biti povezan s metaboličkim promjenama, uključujući inzulinsku rezistenciju kod nekih žena.',
    s7Body2:
      'Međutim, sama težina ne može dijagnosticirati niti isključiti PCOS. Vitka žena može imati PCOS, kao što ga žena s prekomjernom težinom ne mora imati.',
    s7NeutralText:
      'Praćenje treba uzeti u obzir cjelokupno zdravlje, a ne samo broj na vagi.',
    s8Heading: 'Koža, kosa i dlake na tijelu',
    s8Body1:
      'Relativni višak androgena može utjecati na lojne žlijezde i folikule dlaka.',
    s8Body2:
      'Ovisno o ženi, to se može pokazati kao uporne akne, pojačan rast dlaka ili gubitak kose.',
    s8Items: [
      'Hormonske akne',
      'Pojačan rast dlaka na licu ili tijelu',
      'Prorjeđivanje kose ili gubitak kose',
    ],
    s9Heading: 'Kako se PCOS zbrinjava?',
    s9Body1:
      'Ne postoji jedan pristup zbrinjavanju PCOS-a koji djeluje za svaku ženu. Izbor ovisi o simptomima, ciljevima i medicinskim okolnostima.',
    s9Body2:
      'Cilj se može razlikovati ovisno o životnoj fazi: regulirati cikluse, poboljšati određene simptome, zaštititi metaboličko zdravlje ili podržati plan trudnoće.',
    s9MiniTitle: 'Navike koje podržavaju zdravlje',
    s9Lifestyle: [
      'Raznolika, redovita prehrana prilagođena tvojim potrebama',
      'Redovita tjelesna aktivnost koju možeš održavati tijekom vremena',
      'Dovoljno redovit san',
      'Praćenje promjena tvojih ciklusa i simptoma tijekom vremena',
      'Ne okrivljuj se za promjene težine ili simptoma',
    ],
    s9Body3:
      'Ovisno o tvojim potrebama, zdravstveni djelatnik može predložiti i terapije za određene simptome ili za potporu planu trudnoće.',
    s9AlertTitle: 'Nemoj se samoliječiti',
    s9AlertText:
      'Hormonske terapije, metaboličke lijekove i dodatke prehrani treba obvezno razmotriti sa zdravstvenim djelatnikom.',
    s10Heading: 'Česta pogrešna uvjerenja o PCOS-u',
    s10Myths: [
      'PCOS uvijek znači imati „ciste“: naziv može zavarati. Dijagnoza se ne temelji samo na prisutnosti cista.',
      'Sve žene s PCOS-om imaju prekomjernu težinu: PCOS može pogoditi žene svih tjelesnih građa.',
      'PCOS uvijek sprječava trudnoću: ovulacija može biti nepravilna, ali trudnoća je i dalje moguća.',
      'Jedan simptom dovoljan je za dijagnozu PCOS-a: dijagnoza zahtijeva sveobuhvatnu procjenu.',
      'PCOS jednostavno prođe s godinama: način na koji se pokazuje može se mijenjati tijekom života, ali stalno praćenje ostaje važno.',
    ],
    s11Heading: 'Kada posjetiti liječnika',
    s11Body1:
      'Liječnički savjet osobito je vrijedan kad ciklusi postanu vrlo nepravilni, prestanu na nekoliko mjeseci ili se pojave neobični simptomi.',
    s11ConsultItems: [
      'Vrlo nepravilni ili izostali ciklusi',
      'Neobične akne ili rast dlaka',
      'Znatan gubitak kose',
      'Teškoće sa začećem',
      'Simptomi koji se brzo mijenjaju',
    ],
    s12Heading: 'Ključne poruke',
    s12SummaryTitle: 'Bitne točke',
    s12SummaryItems: [
      'PCOS je često hormonsko stanje.',
      'Može se pokazati na mnogo različitih načina.',
      'Sve žene s PCOS-om nemaju iste simptome.',
      'Sama težina nije dovoljna za dijagnosticiranje ili isključivanje PCOS-a.',
      'Dijagnoza zahtijeva sveobuhvatnu liječničku procjenu.',
      'PCOS može utjecati na ovulaciju i ponekad na plodnost.',
      'Personalizirani pristup skrbi pomaže zadovoljiti potrebe svake žene.',
    ],
    finalNoteTitle: 'Vodič za bolje razumijevanje',
    finalNoteText:
      'Ovaj je članak namijenjen općem informiranju i ne zamjenjuje liječnički pregled. Svaka je situacija drugačija: u slučaju nedoumice ili ako simptomi potraju, zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Razumijevanje PCOS-a — AWA',
  },
  bs: {
    badge: 'PCOS • OSNOVNI VODIČ',
    title: 'Razumijevanje\nPCOS-a',
    metaDuration: '10 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Edukativni sadržaj',
    intro:
      'Sindrom policističnih jajnika, često zvan PCOS, često je hormonsko stanje koje može utjecati na tvoje cikluse, ovulaciju, kožu, kosu, metabolizam i ponekad plodnost.',
    introSecondary:
      'Način na koji se pokazuje jako se razlikuje od žene do žene. Razumijevanje PCOS-a ponajprije ti pomaže prepoznati simptome, znati kada zatražiti ljekarski savjet i pratiti njegov razvoj bez samooptuživanja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je PCOS?',
      'Zašta nastaje PCOS?',
      'Glavni znakovi',
      'Kako se dijagnosticira?',
      'PCOS i ovulacija',
      'PCOS i plodnost',
      'PCOS i težina / metabolizam',
      'Koža, kosa i dlake na tijelu',
      'Kako se PCOS zbrinjava?',
      'Česta pogrešna uvjerenja',
      'Kada posjetiti ljekara',
      'Ključne poruke',
    ],
    s1Heading: 'Što je PCOS?',
    s1Body1:
      'Sindrom policističnih jajnika (PCOS) čest je hormonski poremećaj koji može promijeniti uobičajeno funkcioniranje jajnika i ravnotežu određenih hormona.',
    s1Body2:
      'Kod nekih je žena glavni problem nepravilna ovulacija. Kod drugih prvo upadaju u oči akne, pretjeran rast dlaka, gubitak kose ili metabolički znakovi.',
    s1TipTitle: 'Dobro je znati',
    s1TipText:
      'Unatoč nazivu, PCOS ne znači nužno da jajnici sadrže „ciste“. Povijesni naziv može zavarati, a sam ultrazvuk nije dovoljan za postavljanje dijagnoze.',
    s2Heading: 'Zašta nastaje PCOS?',
    s2Body1:
      'Ne postoji jedan uzrok PCOS-a. Čini se da proizlazi iz nekoliko čimbenika koji se mogu kombinirati: obiteljske sklonosti, hormonskog funkcioniranja, ovulacije, metabolizma i individualnih čimbenika.',
    s2Factors: [
      'Obiteljska sklonost i genetski čimbenici',
      'Poremećaji ovulacije',
      'Relativni višak androgena',
      'Inzulinska rezistencija kod nekih žena',
      'Metabolički i okolišni čimbenici',
    ],
    s2NeutralText:
      'PCOS nije osobni neuspjeh. Ne proizlazi jednostavno iz nedostatka snage volje, loše ishrane ili nedovoljne tjelesne aktivnosti.',
    s3Heading: 'Glavni znakovi',
    s3Body1:
      'PCOS se može pokazati vrlo različito od žene do žene. Neke imaju nekoliko simptoma, dok druge primjećuju vrlo malo.',
    s3Signs: [
      'Nepravilni, jako razmaknuti ili ponekad odsutni ciklusi',
      'Nepravilna ili teško predvidljiva ovulacija',
      'Uporne akne, osobito na donjem dijelu lica',
      'Pojačan rast dlaka na licu, prsima ili tijelu',
      'Gubitak kose hormonskog obrasca',
      'Dobivanje na težini ili teškoće s gubitkom težine',
      'Teškoće sa začećem',
    ],
    s3AlertTitle: 'Važno',
    s3AlertText:
      'Imati jedan od ovih simptoma automatski ne znači da imaš PCOS. Nekoliko drugih stanja može uzrokovati slične simptome.',
    s4Heading: 'Kako se dijagnosticira?',
    s4Body1:
      'Dijagnosticiranje PCOS-a medicinski je proces. Zdravstveni radnik obično započinje razgovorom o tvojim ciklusima, simptomima, medicinskoj anamnezi i terapijama koje uzimaš.',
    s4Body2:
      'Ovisno o situaciji, mogu se predložiti i hormonske krvne pretrage te ultrazvuk.',
    s4Points: [
      'Nepravilni ciklusi ili rijetka ovulacija',
      'Znakovi viška androgena: akne, pretjeran rast dlaka, gubitak kose ili rezultati krvnih pretraga',
      'Izgled jajnika u skladu s PCOS-om na ultrazvuku, kad je ta pretraga indicirana',
    ],
    s4Body3:
      'Ljekar mora isključiti i druge moguće uzroke nepravilnih ciklusa ili viška androgena prije potvrde dijagnoze PCOS-a.',
    s5Heading: 'PCOS i ovulacija',
    s5Body1:
      'Ovulacija je oslobađanje jajne stanice (oocite) iz jajnika. Kod PCOS-a ovulacija može biti rjeđa ili teže predvidljiva.',
    s5Body2:
      'To može objasniti zašta su ciklusi ponekad dugi, nepravilni ili teško predvidljivi.',
    s5HighlightTitle: 'Praćenje ciklusa',
    s5HighlightText:
      'Bilježenje datuma menstruacije, simptoma i svih znakova ovulacije može ti pomoći bolje razumjeti vlastite obrasce.',
    s6Heading: 'PCOS i plodnost',
    s6Body1:
      'Budući da ovulacija može biti nepravilna, neke žene s PCOS-om mogu teže začeti.',
    s6Body2:
      'To ipak ne znači da PCOS automatski sprječava trudnoću. Mnoge žene s PCOS-om zatrudne prirodno ili uz odgovarajuću medicinsku podršku.',
    s6TipTitle: 'Imaj na umu',
    s6TipText:
      'Teškoće sa začećem ne znače da je ono nemoguće. Ako se nadaš trudnoći, ljekar ili babica mogu predložiti strategiju prilagođenu tvojoj situaciji.',
    s7Heading: 'PCOS i težina / metabolizam',
    s7Body1:
      'PCOS može biti povezan s metaboličkim promjenama, uključujući inzulinsku rezistenciju kod nekih žena.',
    s7Body2:
      'Međutim, sama težina ne može dijagnosticirati niti isključiti PCOS. Vitka žena može imati PCOS, kao što ga žena s prekomjernom težinom ne mora imati.',
    s7NeutralText:
      'Praćenje treba uzeti u obzir cjelokupno zdravlje, a ne samo broj na vagi.',
    s8Heading: 'Koža, kosa i dlake na tijelu',
    s8Body1:
      'Relativni višak androgena može utjecati na lojne žlijezde i folikule dlaka.',
    s8Body2:
      'Ovisno o ženi, to se može pokazati kao uporne akne, pojačan rast dlaka ili gubitak kose.',
    s8Items: [
      'Hormonske akne',
      'Pojačan rast dlaka na licu ili tijelu',
      'Prorjeđivanje kose ili gubitak kose',
    ],
    s9Heading: 'Kako se PCOS zbrinjava?',
    s9Body1:
      'Ne postoji jedan pristup zbrinjavanju PCOS-a koji djeluje za svaku ženu. Izbor ovisi o simptomima, ciljevima i medicinskim okolnostima.',
    s9Body2:
      'Cilj se može razlikovati ovisno o životnoj fazi: regulirati cikluse, poboljšati određene simptome, zaštititi metaboličko zdravlje ili podržati plan trudnoće.',
    s9MiniTitle: 'Navike koje podržavaju zdravlje',
    s9Lifestyle: [
      'Raznolika, redovita ishrana prilagođena tvojim potrebama',
      'Redovita tjelesna aktivnost koju možeš održavati tokom vremena',
      'Dovoljno redovit san',
      'Praćenje promjena tvojih ciklusa i simptoma tokom vremena',
      'Ne okrivljuj se za promjene težine ili simptoma',
    ],
    s9Body3:
      'Ovisno o tvojim potrebama, zdravstveni radnik može predložiti i terapije za određene simptome ili za potporu planu trudnoće.',
    s9AlertTitle: 'Nemoj se samoliječiti',
    s9AlertText:
      'Hormonske terapije, metaboličke lijekove i dodatke ishrani treba obvezno razmotriti sa zdravstvenim radnikom.',
    s10Heading: 'Česta pogrešna uvjerenja o PCOS-u',
    s10Myths: [
      'PCOS uvijek znači imati „ciste“: naziv može zavarati. Dijagnoza se ne temelji samo na prisutnosti cista.',
      'Sve žene s PCOS-om imaju prekomjernu težinu: PCOS može pogoditi žene svih tjelesnih građa.',
      'PCOS uvijek sprječava trudnoću: ovulacija može biti nepravilna, ali trudnoća je i dalje moguća.',
      'Jedan simptom dovoljan je za dijagnozu PCOS-a: dijagnoza zahtijeva sveobuhvatnu procjenu.',
      'PCOS jednostavno prođe s godinama: način na koji se pokazuje može se mijenjati tokom života, ali stalno praćenje ostaje važno.',
    ],
    s11Heading: 'Kada posjetiti ljekara',
    s11Body1:
      'Ljekarski savjet osobito je vrijedan kad ciklusi postanu vrlo nepravilni, prestanu na nekoliko mjeseci ili se pojave neobični simptomi.',
    s11ConsultItems: [
      'Vrlo nepravilni ili izostali ciklusi',
      'Neobične akne ili rast dlaka',
      'Znatan gubitak kose',
      'Teškoće sa začećem',
      'Simptomi koji se brzo mijenjaju',
    ],
    s12Heading: 'Ključne poruke',
    s12SummaryTitle: 'Bitne tačke',
    s12SummaryItems: [
      'PCOS je često hormonsko stanje.',
      'Može se pokazati na mnogo različitih načina.',
      'Sve žene s PCOS-om nemaju iste simptome.',
      'Sama težina nije dovoljna za dijagnosticiranje ili isključivanje PCOS-a.',
      'Dijagnoza zahtijeva sveobuhvatnu ljekarsku procjenu.',
      'PCOS može utjecati na ovulaciju i ponekad na plodnost.',
      'Personalizirani pristup skrbi pomaže zadovoljiti potrebe svake žene.',
    ],
    finalNoteTitle: 'Vodič za bolje razumijevanje',
    finalNoteText:
      'Ovaj je članak namijenjen općem informiranju i ne zamjenjuje ljekarski pregled. Svaka je situacija drugačija: u slučaju nedoumice ili ako simptomi potraju, zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Razumijevanje PCOS-a — AWA',
  },
  sl: {
    badge: 'PCOS • OSNOVNI VODNIK',
    title: 'Razumevanje\nPCOS',
    metaDuration: '10 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Izobraževalna vsebina',
    intro:
      'Sindrom policističnih jajčnikov, pogosto imenovan PCOS, je pogosto hormonsko stanje, ki lahko vpliva na tvoje cikle, ovulacijo, kožo, lase, presnovo in včasih plodnost.',
    introSecondary:
      'Način, kako se kaže, se zelo razlikuje od ženske do ženske. Razumevanje PCOS ti predvsem pomaga prepoznati simptome, vedeti, kdaj poiskati zdravniški nasvet, in spremljati njegov razvoj brez samoobtoževanja.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je PCOS?',
      'Zakaj nastane PCOS?',
      'Glavni znaki',
      'Kako se diagnosticira?',
      'PCOS in ovulacija',
      'PCOS in plodnost',
      'PCOS in teža / presnova',
      'Koža, lasje in dlake na telesu',
      'Kako se PCOS obvladuje?',
      'Pogosta napačna prepričanja',
      'Kdaj obiskati zdravnika',
      'Ključna sporočila',
    ],
    s1Heading: 'Kaj je PCOS?',
    s1Body1:
      'Sindrom policističnih jajčnikov (PCOS) je pogosto hormonsko stanje, ki lahko spremeni običajno delovanje jajčnikov in ravnovesje določenih hormonov.',
    s1Body2:
      'Pri nekaterih ženskah je glavna težava nepravilna ovulacija. Pri drugih najprej padejo v oči akne, pretirana rast dlak, izpadanje las ali presnovni znaki.',
    s1TipTitle: 'Vredno vedeti',
    s1TipText:
      'Kljub imenu PCOS ne pomeni nujno, da jajčniki vsebujejo „ciste“. Zgodovinski naziv je lahko zavajajoč, sam ultrazvok pa ni dovolj za postavitev diagnoze.',
    s2Heading: 'Zakaj nastane PCOS?',
    s2Body1:
      'Ne obstaja en vzrok PCOS. Zdi se, da izhaja iz več dejavnikov, ki se lahko združijo: družinske nagnjenosti, hormonskega delovanja, ovulacije, presnove in individualnih dejavnikov.',
    s2Factors: [
      'Družinska nagnjenost in genetski dejavniki',
      'Motnje ovulacije',
      'Relativni presežek androgenov',
      'Inzulinska rezistenca pri nekaterih ženskah',
      'Presnovni in okoljski dejavniki',
    ],
    s2NeutralText:
      'PCOS ni osebni neuspeh. Ne izhaja preprosto iz pomanjkanja moči volje, slabe prehrane ali nezadostne telesne dejavnosti.',
    s3Heading: 'Glavni znaki',
    s3Body1:
      'PCOS se lahko kaže zelo različno od ženske do ženske. Nekatere imajo več simptomov, druge opazijo zelo malo.',
    s3Signs: [
      'Neredni, zelo razmaknjeni ali včasih odsotni cikli',
      'Nepravilna ali težko predvidljiva ovulacija',
      'Vztrajne akne, zlasti na spodnjem delu obraza',
      'Povečana rast dlak na obrazu, prsih ali telesu',
      'Izpadanje las hormonskega vzorca',
      'Pridobivanje teže ali težave pri hujšanju',
      'Težave z zanositvijo',
    ],
    s3AlertTitle: 'Pomembno',
    s3AlertText:
      'Imeti enega od teh simptomov samodejno ne pomeni, da imaš PCOS. Več drugih stanj lahko povzroča podobne simptome.',
    s4Heading: 'Kako se diagnosticira?',
    s4Body1:
      'Diagnosticiranje PCOS je zdravstveni proces. Zdravstveni delavec običajno začne s pogovorom o tvojih ciklih, simptomih, zdravstveni anamnezi in zdravljenjih, ki jih jemlješ.',
    s4Body2:
      'Glede na situacijo se lahko predlagajo tudi hormonske krvne preiskave in ultrazvok.',
    s4Points: [
      'Neredni cikli ali redka ovulacija',
      'Znaki presežka androgenov: akne, pretirana rast dlak, izpadanje las ali rezultati krvnih preiskav',
      'Videz jajčnikov, skladen s PCOS, na ultrazvoku, kadar je ta preiskava indicirana',
    ],
    s4Body3:
      'Zdravnik mora izključiti tudi druge možne vzroke nepravilnih ciklov ali presežka androgenov, preden potrdi diagnozo PCOS.',
    s5Heading: 'PCOS in ovulacija',
    s5Body1:
      'Ovulacija je sprostitev jajčne celice (oocite) iz jajčnika. Pri PCOS je ovulacija lahko redkejša ali težje predvidljiva.',
    s5Body2:
      'To lahko pojasni, zakaj so cikli včasih dolgi, neredni ali težko predvidljivi.',
    s5HighlightTitle: 'Spremljanje cikla',
    s5HighlightText:
      'Beleženje datumov menstruacije, simptomov in morebitnih znakov ovulacije ti lahko pomaga bolje razumeti lastne vzorce.',
    s6Heading: 'PCOS in plodnost',
    s6Body1:
      'Ker je ovulacija lahko nepravilna, imajo nekatere ženske s PCOS več težav z zanositvijo.',
    s6Body2:
      'To pa ne pomeni, da PCOS samodejno preprečuje nosečnost. Mnoge ženske s PCOS zanosijo naravno ali z ustrezno medicinsko podporo.',
    s6TipTitle: 'Imej v mislih',
    s6TipText:
      'Težave z zanositvijo ne pomenijo, da je ta nemogoča. Če upaš na nosečnost, ti lahko zdravnik ali babica predlaga strategijo, prilagojeno tvoji situaciji.',
    s7Heading: 'PCOS in teža / presnova',
    s7Body1:
      'PCOS je lahko povezan s presnovnimi spremembami, vključno z inzulinsko rezistenco pri nekaterih ženskah.',
    s7Body2:
      'Vendar sama teža ne more diagnosticirati ali izključiti PCOS. Vitka ženska ima lahko PCOS, kakor ga ženska s prekomerno težo morda nima.',
    s7NeutralText:
      'Spremljanje mora upoštevati celotno zdravje, ne le številke na tehtnici.',
    s8Heading: 'Koža, lasje in dlake na telesu',
    s8Body1:
      'Relativni presežek androgenov lahko vpliva na lojne žleze in folikle dlak.',
    s8Body2:
      'Glede na žensko se lahko to kaže kot vztrajne akne, povečana rast dlak ali izpadanje las.',
    s8Items: [
      'Hormonske akne',
      'Povečana rast dlak na obrazu ali telesu',
      'Redčenje las ali izpadanje las',
    ],
    s9Heading: 'Kako se PCOS obvladuje?',
    s9Body1:
      'Ne obstaja en pristop k obvladovanju PCOS, ki bi deloval za vsako žensko. Izbira je odvisna od simptomov, ciljev in zdravstvenih okoliščin.',
    s9Body2:
      'Cilj se lahko razlikuje glede na življenjsko obdobje: uravnavanje ciklov, izboljšanje določenih simptomov, zaščita presnovnega zdravja ali podpora načrtu nosečnosti.',
    s9MiniTitle: 'Navade, ki podpirajo zdravje',
    s9Lifestyle: [
      'Raznolika, redna prehrana, prilagojena tvojim potrebam',
      'Redna telesna dejavnost, ki jo lahko vzdržuješ skozi čas',
      'Dovolj reden spanec',
      'Spremljanje sprememb tvojih ciklov in simptomov skozi čas',
      'Ne obtožuj se zaradi sprememb teže ali simptomov',
    ],
    s9Body3:
      'Glede na tvoje potrebe lahko zdravstveni delavec predlaga tudi zdravljenja za določene simptome ali za podporo načrtu nosečnosti.',
    s9AlertTitle: 'Ne zdravi se sama',
    s9AlertText:
      'Hormonska zdravljenja, presnovna zdravila in prehranska dopolnila je treba obvezno obravnavati z zdravstvenim delavcem.',
    s10Heading: 'Pogosta napačna prepričanja o PCOS',
    s10Myths: [
      'PCOS vedno pomeni imeti „ciste“: naziv je lahko zavajajoč. Diagnoza ne temelji samo na prisotnosti cist.',
      'Vse ženske s PCOS imajo prekomerno težo: PCOS lahko prizadene ženske vseh telesnih postav.',
      'PCOS vedno preprečuje nosečnost: ovulacija je lahko nepravilna, a nosečnost je še vedno mogoča.',
      'En simptom je dovolj za diagnozo PCOS: diagnoza zahteva celovito oceno.',
      'PCOS preprosto mine s starostjo: način, kako se kaže, se lahko skozi življenje spreminja, a stalno spremljanje ostaja pomembno.',
    ],
    s11Heading: 'Kdaj obiskati zdravnika',
    s11Body1:
      'Zdravniški nasvet je še posebej vreden, kadar cikli postanejo zelo neredni, prenehajo za nekaj mesecev ali se pojavijo nenavadni simptomi.',
    s11ConsultItems: [
      'Zelo neredni ali izostali cikli',
      'Nenavadne akne ali rast dlak',
      'Pomembno izpadanje las',
      'Težave z zanositvijo',
      'Simptomi, ki se hitro spreminjajo',
    ],
    s12Heading: 'Ključna sporočila',
    s12SummaryTitle: 'Bistvene točke',
    s12SummaryItems: [
      'PCOS je pogosto hormonsko stanje.',
      'Lahko se kaže na mnogo različnih načinov.',
      'Vse ženske s PCOS nimajo enakih simptomov.',
      'Sama teža ni dovolj za diagnosticiranje ali izključitev PCOS.',
      'Diagnoza zahteva celovito zdravniško oceno.',
      'PCOS lahko vpliva na ovulacijo in včasih na plodnost.',
      'Personaliziran pristop k oskrbi pomaga zadovoljiti potrebe vsake ženske.',
    ],
    finalNoteTitle: 'Vodnik za boljše razumevanje',
    finalNoteText:
      'Ta članek je namenjen splošnemu informiranju in ne nadomešča zdravniškega pregleda. Vsaka situacija je drugačna: v primeru dvoma ali če simptomi vztrajajo, poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Razumevanje PCOS — AWA',
  },
  ne: {
    badge: 'PCOS • आवश्यक मार्गदर्शन',
    title: 'PCOS\nबुझ्नुहोस्',
    metaDuration: '10 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'शैक्षिक सामग्री',
    intro:
      'पोलिसिस्टिक ओभरी सिन्ड्रोम, प्रायः PCOS भनिने, एउटा सामान्य हर्मोनल अवस्था हो जसले तपाईंको चक्र, अण्डोत्सर्ग, छाला, कपाल, मेटाबोलिजम र कहिलेकाहीँ उर्वरतालाई असर गर्न सक्छ।',
    introSecondary:
      'यो कसरी देखिन्छ एक महिलादेखि अर्कोमा निकै फरक हुन्छ। PCOS बुझ्नाले मुख्यतया तपाईंलाई यसका लक्षणहरू चिन्न, चिकित्सकीय सल्लाह कहिले लिने जान्न, र आफूलाई दोष नदिई यो कसरी बदलिन्छ अनुगमन गर्न मद्दत गर्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'PCOS के हो?',
      'PCOS किन हुन्छ?',
      'मुख्य संकेतहरू',
      'यसको निदान कसरी गरिन्छ?',
      'PCOS र अण्डोत्सर्ग',
      'PCOS र उर्वरता',
      'PCOS र तौल / मेटाबोलिजम',
      'छाला, कपाल र शरीरका रौँ',
      'PCOS कसरी व्यवस्थापन गरिन्छ?',
      'सामान्य भ्रमहरू',
      'चिकित्सकलाई कहिले देखाउने',
      'मुख्य कुराहरू',
    ],
    s1Heading: 'PCOS के हो?',
    s1Body1:
      'पोलिसिस्टिक ओभरी सिन्ड्रोम (PCOS) एउटा सामान्य हर्मोनल अवस्था हो जसले अण्डाशयको सामान्य कार्य र केही हर्मोनहरूको सन्तुलनलाई बदल्न सक्छ।',
    s1Body2:
      'केही महिलाका लागि, मुख्य समस्या अनियमित अण्डोत्सर्ग हो। अरूका लागि, पिम्पल, अत्यधिक रौँ वृद्धि, कपाल झर्ने, वा मेटाबोलिक संकेतहरू पहिले देखिन्छन्।',
    s1TipTitle: 'जान्न लायक',
    s1TipText:
      'यसको नामका बावजुद, PCOS को अर्थ अण्डाशयमा “सिस्ट” हुनैपर्छ भन्ने होइन। ऐतिहासिक शब्दले भ्रामक बनाउन सक्छ, र अल्ट्रासाउन्ड मात्रले निदान गर्न पर्याप्त हुँदैन।',
    s2Heading: 'PCOS किन हुन्छ?',
    s2Body1:
      'PCOS को कुनै एउटा कारण छैन। यो मिल्न सक्ने धेरै कारकहरूको परिणाम जस्तो देखिन्छ: पारिवारिक प्रवृत्ति, हर्मोनल कार्य, अण्डोत्सर्ग, मेटाबोलिजम, र व्यक्तिगत कारकहरू।',
    s2Factors: [
      'पारिवारिक प्रवृत्ति र आनुवंशिक कारकहरू',
      'अण्डोत्सर्गमा बाधा',
      'एन्ड्रोजनको सापेक्षिक अधिकता',
      'केही महिलामा इन्सुलिन प्रतिरोध',
      'मेटाबोलिक र वातावरणीय कारकहरू',
    ],
    s2NeutralText:
      'PCOS व्यक्तिगत असफलता होइन। यो केवल इच्छाशक्तिको कमी, खराब खानपान, वा अपर्याप्त शारीरिक गतिविधिको परिणाम होइन।',
    s3Heading: 'मुख्य संकेतहरू',
    s3Body1:
      'PCOS एक महिलादेखि अर्कोमा निकै फरक रूपमा देखिन सक्छ। केहीमा धेरै लक्षण हुन्छन्, भने अरूले निकै कम देख्छन्।',
    s3Signs: [
      'अनियमित, निकै टाढा-टाढा वा कहिलेकाहीँ अनुपस्थित चक्रहरू',
      'अनियमित वा पूर्वानुमान गर्न गाह्रो अण्डोत्सर्ग',
      'लगातार पिम्पल, विशेष गरी तल्लो अनुहारमा',
      'अनुहार, छाती वा शरीरमा बढेको रौँ वृद्धि',
      'हर्मोनल ढाँचाको कपाल झर्ने',
      'तौल बढ्ने वा घटाउन गाह्रो हुने',
      'गर्भधारणमा कठिनाइ',
    ],
    s3AlertTitle: 'महत्त्वपूर्ण',
    s3AlertText:
      'यी मध्ये एउटा लक्षण हुनुको अर्थ तपाईंलाई PCOS छ भन्ने स्वतः होइन। अन्य धेरै अवस्थाहरूले उस्तै लक्षण निम्त्याउन सक्छन्।',
    s4Heading: 'यसको निदान कसरी गरिन्छ?',
    s4Body1:
      'PCOS को निदान एउटा चिकित्सकीय प्रक्रिया हो। स्वास्थ्य सेवा प्रदायकले सामान्यतया तपाईंका चक्र, लक्षण, चिकित्सकीय इतिहास र तपाईंले लिइरहनुभएका कुनै उपचारबारे छलफलबाट सुरु गर्छन्।',
    s4Body2:
      'अवस्थाअनुसार, हर्मोनल रगत परीक्षण र अल्ट्रासाउन्ड पनि प्रस्ताव गर्न सकिन्छ।',
    s4Points: [
      'अनियमित चक्र वा विरल अण्डोत्सर्ग',
      'एन्ड्रोजन अधिकताका संकेत: पिम्पल, अत्यधिक रौँ वृद्धि, कपाल झर्ने, वा रगत परीक्षणका नतिजा',
      'अल्ट्रासाउन्डमा PCOS सँग मेल खाने अण्डाशयको रूप, जब यो जाँच संकेत गरिएको हुन्छ',
    ],
    s4Body3:
      'PCOS को निदान पुष्टि गर्नुअघि चिकित्सकले अनियमित चक्र वा एन्ड्रोजन अधिकताका अन्य सम्भावित कारणहरू पनि हटाउनुपर्छ।',
    s5Heading: 'PCOS र अण्डोत्सर्ग',
    s5Body1:
      'अण्डोत्सर्ग अण्डाशयबाट अण्डा (अण्डकोष) निस्कनु हो। PCOS मा, अण्डोत्सर्ग कम बारम्बार वा पूर्वानुमान गर्न गाह्रो हुन सक्छ।',
    s5Body2:
      'यसले चक्रहरू कहिलेकाहीँ लामा, अनियमित वा अनुमान गर्न गाह्रो किन हुन्छन् भन्ने व्याख्या गर्न सक्छ।',
    s5HighlightTitle: 'आफ्नो चक्र अनुगमन गर्ने',
    s5HighlightText:
      'आफ्ना महिनावारीका मिति, लक्षण, र अण्डोत्सर्गका कुनै संकेतहरू अभिलेख गर्नाले तपाईंलाई आफ्नै ढाँचा राम्ररी बुझ्न मद्दत गर्न सक्छ।',
    s6Heading: 'PCOS र उर्वरता',
    s6Body1:
      'अण्डोत्सर्ग अनियमित हुन सक्ने भएकाले, PCOS भएका केही महिलालाई गर्भधारणमा बढी कठिनाइ हुन सक्छ।',
    s6Body2:
      'यद्यपि, यसको अर्थ PCOS ले स्वतः गर्भावस्थालाई रोक्छ भन्ने होइन। PCOS भएका धेरै महिलाले स्वाभाविक रूपमा वा उपयुक्त चिकित्सकीय साथसहित गर्भधारण गर्छन्।',
    s6TipTitle: 'मनमा राख्नुहोस्',
    s6TipText:
      'गर्भधारणमा कठिनाइ हुनुको अर्थ यो असम्भव छ भन्ने होइन। तपाईं गर्भावस्थाको आशा गर्दै हुनुहुन्छ भने, चिकित्सक वा सुँडेनीले तपाईंको अवस्थाअनुकूल रणनीति सुझाउन सक्छन्।',
    s7Heading: 'PCOS र तौल / मेटाबोलिजम',
    s7Body1:
      'PCOS मेटाबोलिक परिवर्तनहरूसँग जोडिन सक्छ, जसमा केही महिलामा इन्सुलिन प्रतिरोध पर्छ।',
    s7Body2:
      'तथापि, तौल मात्रले PCOS को निदान गर्न वा हटाउन सक्दैन। दुब्लो महिलालाई पनि PCOS हुन सक्छ, जसरी बढी तौल भएकी महिलालाई नहुन पनि सक्छ।',
    s7NeutralText:
      'फलोअप हेरचाहले तराजुको सङ्ख्या मात्र होइन, समग्र स्वास्थ्यलाई विचार गर्नुपर्छ।',
    s8Heading: 'छाला, कपाल र शरीरका रौँ',
    s8Body1:
      'एन्ड्रोजनको सापेक्षिक अधिकताले सेबेसियस ग्रन्थि र कपालका जराहरूलाई असर गर्न सक्छ।',
    s8Body2:
      'महिलाअनुसार, यो लगातार पिम्पल, बढेको रौँ वृद्धि, वा कपाल झर्नेका रूपमा देखिन सक्छ।',
    s8Items: [
      'हर्मोनल पिम्पल',
      'अनुहार वा शरीरमा रौँ बढ्ने',
      'कपाल पातलो हुने वा झर्ने',
    ],
    s9Heading: 'PCOS कसरी व्यवस्थापन गरिन्छ?',
    s9Body1:
      'PCOS व्यवस्थापन गर्ने कुनै एउटै तरिका छैन जुन हरेक महिलाका लागि काम गर्छ। छनोट लक्षण, लक्ष्य र चिकित्सकीय परिस्थितिमा निर्भर गर्छ।',
    s9Body2:
      'लक्ष्य जीवनको चरणअनुसार फरक हुन सक्छ: चक्र नियमित गर्ने, केही लक्षण सुधार्ने, मेटाबोलिक स्वास्थ्य जोगाउने, वा गर्भधारणको योजनालाई साथ दिने।',
    s9MiniTitle: 'स्वास्थ्यलाई साथ दिने बानीहरू',
    s9Lifestyle: [
      'आफ्नो आवश्यकताअनुसार विविधतापूर्ण, नियमित खानपान गर्ने',
      'समयसँगै कायम राख्न सकिने नियमित शारीरिक गतिविधि गर्ने',
      'पर्याप्त नियमित निद्रा कायम राख्ने',
      'आफ्ना चक्र र लक्षणहरू समयसँगै कसरी बदलिन्छन् अनुगमन गर्ने',
      'तौल वा लक्षणहरूमा हुने परिवर्तनका लागि आफूलाई दोष नदिने',
    ],
    s9Body3:
      'तपाईंको आवश्यकताअनुसार, स्वास्थ्य सेवा प्रदायकले केही लक्षणहरूका लागि वा गर्भधारणको योजनालाई साथ दिन उपचार पनि प्रस्ताव गर्न सक्छन्।',
    s9AlertTitle: 'आफैँ औषधि नलिनुहोस्',
    s9AlertText:
      'हर्मोनल उपचार, मेटाबोलिक औषधि र आहार पूरकहरू सबैबारे स्वास्थ्य सेवा प्रदायकसँग छलफल गर्नुपर्छ।',
    s10Heading: 'PCOS बारे सामान्य भ्रमहरू',
    s10Myths: [
      'PCOS को अर्थ सधैँ “सिस्ट” हुनु हो: नामले भ्रामक बनाउन सक्छ। निदान केवल सिस्टको उपस्थितिमा निर्भर गर्दैन।',
      'PCOS भएका सबै महिलाको तौल बढी हुन्छ: PCOS ले सबै शारीरिक बनावटका महिलालाई असर गर्न सक्छ।',
      'PCOS ले सधैँ गर्भावस्थालाई रोक्छ: अण्डोत्सर्ग अनियमित हुन सक्छ, तर गर्भावस्था अझै सम्भव छ।',
      'एउटा लक्षणले PCOS को निदान गर्न पर्याप्त हुन्छ: निदानका लागि व्यापक मूल्याङ्कन चाहिन्छ।',
      'PCOS उमेरसँगै आफैँ हराउँछ: यो जीवनभरि कसरी देखिन्छ बदलिन सक्छ, तर निरन्तर फलोअप महत्त्वपूर्ण रहन्छ।',
    ],
    s11Heading: 'चिकित्सकलाई कहिले देखाउने',
    s11Body1:
      'चक्र निकै अनियमित हुँदा, धेरै महिना रोकिँदा, वा असामान्य लक्षणहरू देखिँदा चिकित्सकीय सल्लाह विशेष रूपमा लायक हुन्छ।',
    s11ConsultItems: [
      'निकै अनियमित वा अनुपस्थित चक्रहरू',
      'असामान्य पिम्पल वा रौँ वृद्धि',
      'उल्लेखनीय कपाल झर्ने',
      'गर्भधारणमा कठिनाइ',
      'छिटो बदलिने लक्षणहरू',
    ],
    s12Heading: 'मुख्य कुराहरू',
    s12SummaryTitle: 'आवश्यक बुँदाहरू',
    s12SummaryItems: [
      'PCOS एउटा सामान्य हर्मोनल अवस्था हो।',
      'यो धेरै फरक तरिकाले देखिन सक्छ।',
      'PCOS भएका सबै महिलाको उस्तै लक्षण हुँदैन।',
      'तौल मात्र PCOS को निदान गर्न वा हटाउन पर्याप्त छैन।',
      'निदानका लागि व्यापक चिकित्सकीय मूल्याङ्कन चाहिन्छ।',
      'PCOS ले अण्डोत्सर्ग र कहिलेकाहीँ उर्वरतालाई असर गर्न सक्छ।',
      'व्यक्तिगत हेरचाह दृष्टिकोणले हरेक महिलाका आवश्यकता पूरा गर्न मद्दत गर्छ।',
    ],
    finalNoteTitle: 'राम्ररी बुझ्न मद्दत गर्ने मार्गदर्शन',
    finalNoteText:
      'यो लेख सामान्य जानकारीका लागि हो र चिकित्सकीय परामर्शको स्थान लिँदैन। हरेक अवस्था फरक हुन्छ: शङ्का भए वा लक्षणहरू रहिरहे स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    shareMessage: 'PCOS बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'PCOS • අත්‍යවශ්‍ය මාර්ගෝපදේශය',
    title: 'PCOS\nතේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 10',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'අධ්‍යාපනික අන්තර්ගතය',
    intro:
      'බහු-කෝෂිකා ඩිම්බකෝෂ සහලක්ෂණය, බොහෝ විට PCOS ලෙස හැඳින්වෙන, ඔබේ චක්‍රවලට, ඩිම්බ මෝචනයට, සමට, කෙස්වලට, පරිවෘත්තියට සහ සමහර විට සාරවත් බවට බලපෑ හැකි පොදු හෝමෝන තත්ත්වයකි.',
    introSecondary:
      'එය ප්‍රකාශ වන ආකාරය කාන්තාවකගෙන් තවත් කාන්තාවකට බොහෝ සේ වෙනස් වේ. PCOS තේරුම් ගැනීම ප්‍රධාන වශයෙන් ඔබට එහි රෝග ලක්ෂණ හඳුනාගැනීමට, වෛද්‍ය උපදෙස් ඉල්ලිය යුත්තේ කවදාදැයි දැනගැනීමට සහ ස්වයං-නින්දාවකින් තොරව එය වෙනස් වන ආකාරය නිරීක්ෂණය කිරීමට උපකාරී වේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'PCOS යනු කුමක්ද?',
      'PCOS සිදුවන්නේ ඇයි?',
      'ප්‍රධාන සලකුණු',
      'එය රෝග විනිශ්චය කරන්නේ කෙසේද?',
      'PCOS සහ ඩිම්බ මෝචනය',
      'PCOS සහ සාරවත් බව',
      'PCOS සහ බර / පරිවෘත්තිය',
      'සම, කෙස් සහ ශරීර රෝම',
      'PCOS කළමනාකරණය කරන්නේ කෙසේද?',
      'පොදු වැරදි වැටහීම්',
      'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    s1Heading: 'PCOS යනු කුමක්ද?',
    s1Body1:
      'බහු-කෝෂිකා ඩිම්බකෝෂ සහලක්ෂණය (PCOS) යනු ඩිම්බකෝෂවල සුපුරුදු ක්‍රියාකාරිත්වය සහ සමහර හෝමෝනවල සමතුලිතතාව වෙනස් කළ හැකි පොදු හෝමෝන තත්ත්වයකි.',
    s1Body2:
      'සමහර කාන්තාවන්ට, ප්‍රධාන ගැටලුව අක්‍රමවත් ඩිම්බ මෝචනයයි. අනෙක් අයට, කුරුලෑ, අධික කෙස් වර්ධනය, කෙස් ගැලවීම, හෝ පරිවෘත්තීය සලකුණු මුලින්ම කැපී පෙනේ.',
    s1TipTitle: 'දැනගත යුතු දේ',
    s1TipText:
      'එහි නම තිබියදීත්, PCOS යනු ඩිම්බකෝෂවල “කෝෂිකා” අඩංගු බව අනිවාර්යයෙන්ම අදහස් නොවේ. ඓතිහාසික යෙදුම නොමඟ යවන සුළු විය හැකි අතර, රෝග විනිශ්චය කිරීමට අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයක් පමණක් ප්‍රමාණවත් නොවේ.',
    s2Heading: 'PCOS සිදුවන්නේ ඇයි?',
    s2Body1:
      'PCOS සඳහා තනි හේතුවක් නැත. එය ඒකාබද්ධ විය හැකි සාධක කිහිපයක ප්‍රතිඵලයක් ලෙස පෙනේ: පවුලේ නැඹුරුව, හෝමෝන ක්‍රියාකාරිත්වය, ඩිම්බ මෝචනය, පරිවෘත්තිය සහ පුද්ගලික සාධක.',
    s2Factors: [
      'පවුලේ නැඹුරුව සහ ජානමය සාධක',
      'ඩිම්බ මෝචනයේ කඩාකප්පල් වීම්',
      'සාපේක්ෂ ඇන්ඩ්‍රජන් අතිරික්තය',
      'සමහර කාන්තාවන්ගේ ඉන්සියුලින් ප්‍රතිරෝධය',
      'පරිවෘත්තීය සහ පාරිසරික සාධක',
    ],
    s2NeutralText:
      'PCOS පෞද්ගලික අසාර්ථකත්වයක් නොවේ. එය සරලව කැමැත්ත නොමැතිකමක්, නරක ආහාර වේලක් හෝ ප්‍රමාණවත් නොවන ශාරීරික ක්‍රියාකාරකමක ප්‍රතිඵලයක් නොවේ.',
    s3Heading: 'ප්‍රධාන සලකුණු',
    s3Body1:
      'PCOS කාන්තාවකගෙන් තවත් කාන්තාවකට ඉතා වෙනස් ලෙස ප්‍රකාශ විය හැක. සමහරුන්ට රෝග ලක්ෂණ කිහිපයක් ඇති අතර, අනෙක් අය ඉතා සුළු ප්‍රමාණයක් දකිති.',
    s3Signs: [
      'අක්‍රමවත්, පුළුල් ලෙස පරතරයක් ඇති, හෝ සමහර විට නොමැති චක්‍ර',
      'අක්‍රමවත් හෝ පුරෝකථනය කිරීමට අපහසු ඩිම්බ මෝචනය',
      'විශේෂයෙන් පහළ මුහුණේ දිගටම පවතින කුරුලෑ',
      'මුහුණේ, පපුවේ, හෝ ශරීරයේ වැඩි වූ කෙස් වර්ධනය',
      'හෝමෝන රටාවේ කෙස් ගැලවීම',
      'බර වැඩිවීම හෝ බර අඩු කිරීමේ අපහසුව',
      'ගර්භ ගැනීමේ අපහසුව',
    ],
    s3AlertTitle: 'වැදගත්',
    s3AlertText:
      'මෙම රෝග ලක්ෂණවලින් එකක් තිබීම ඔබට ස්වයංක්‍රීයව PCOS ඇති බව අදහස් නොවේ. වෙනත් තත්ත්වයන් කිහිපයකට සමාන රෝග ලක්ෂණ ඇති කළ හැක.',
    s4Heading: 'එය රෝග විනිශ්චය කරන්නේ කෙසේද?',
    s4Body1:
      'PCOS රෝග විනිශ්චය කිරීම වෛද්‍ය ක්‍රියාවලියකි. සෞඛ්‍ය සේවා සපයන්නෙකු සාමාන්‍යයෙන් ඔබේ චක්‍ර, රෝග ලක්ෂණ, වෛද්‍ය ඉතිහාසය සහ ඔබ ගන්නා ඕනෑම ප්‍රතිකාරයක් සාකච්ඡා කිරීමෙන් ආරම්භ කරයි.',
    s4Body2:
      'තත්ත්වය අනුව, හෝමෝන රුධිර පරීක්ෂණ සහ අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයක්ද යෝජනා කළ හැක.',
    s4Points: [
      'අක්‍රමවත් චක්‍ර හෝ කලාතුරකින් ඩිම්බ මෝචනය',
      'ඇන්ඩ්‍රජන් අතිරික්තයේ සලකුණු: කුරුලෑ, අධික කෙස් වර්ධනය, කෙස් ගැලවීම, හෝ රුධිර පරීක්ෂණ ප්‍රතිඵල',
      'මෙම පරීක්ෂණය නිර්දේශිත විට, අල්ට්‍රාසවුන්ඩ් පරීක්ෂණයේ PCOS සමඟ අනුකූල ඩිම්බකෝෂ පෙනුම',
    ],
    s4Body3:
      'PCOS රෝග විනිශ්චයක් තහවුරු කිරීමට පෙර, වෛද්‍යවරයා අක්‍රමවත් චක්‍රවල හෝ ඇන්ඩ්‍රජන් අතිරික්තයේ වෙනත් ඇතිවිය හැකි හේතුද බැහැර කළ යුතුයි.',
    s5Heading: 'PCOS සහ ඩිම්බ මෝචනය',
    s5Body1:
      'ඩිම්බ මෝචනය යනු ඩිම්බකෝෂයෙන් ඩිම්බයක් (ඩිම්බ සෛලයක්) නිකුත් කිරීමයි. PCOS හිදී, ඩිම්බ මෝචනය අඩු නිතර හෝ පුරෝකථනය කිරීමට වඩා අපහසු විය හැක.',
    s5Body2:
      'මෙයින් චක්‍ර සමහර විට දිගු, අක්‍රමවත්, හෝ අපේක්ෂා කිරීමට අපහසු වන්නේ ඇයිදැයි පැහැදිලි කළ හැක.',
    s5HighlightTitle: 'ඔබේ චක්‍රය නිරීක්ෂණය කිරීම',
    s5HighlightText:
      'ඔබේ ඔසප් දින, රෝග ලක්ෂණ සහ ඩිම්බ මෝචනයේ ඕනෑම සලකුණු සටහන් කිරීම ඔබේම රටා වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක.',
    s6Heading: 'PCOS සහ සාරවත් බව',
    s6Body1:
      'ඩිම්බ මෝචනය අක්‍රමවත් විය හැකි බැවින්, PCOS ඇති සමහර කාන්තාවන්ට ගර්භ ගැනීමට වැඩි අපහසුතාවක් තිබිය හැක.',
    s6Body2:
      'කෙසේ වෙතත්, මෙයින් PCOS ස්වයංක්‍රීයව ගැබ්ගැනීම වළක්වන බව අදහස් නොවේ. PCOS ඇති බොහෝ කාන්තාවන් ස්වභාවිකව හෝ සුදුසු වෛද්‍ය සහාය සමඟ ගර්භ ගනී.',
    s6TipTitle: 'මතක තබාගන්න',
    s6TipText:
      'ගර්භ ගැනීමේ අපහසුතාව එය කළ නොහැකි බව අදහස් නොවේ. ඔබ ගැබ්ගැනීමට බලාපොරොත්තු වන්නේ නම්, වෛද්‍යවරයෙකුට හෝ ප්‍රසව හෙදියකට ඔබේ තත්ත්වයට ගැළපෙන උපායමාර්ගයක් යෝජනා කළ හැක.',
    s7Heading: 'PCOS සහ බර / පරිවෘත්තිය',
    s7Body1:
      'PCOS පරිවෘත්තීය වෙනස්කම් සමඟ, සමහර කාන්තාවන්ගේ ඉන්සියුලින් ප්‍රතිරෝධය ඇතුළුව, සම්බන්ධ විය හැක.',
    s7Body2:
      'කෙසේ වෙතත්, බර පමණක් PCOS රෝග විනිශ්චය කිරීමට හෝ බැහැර කිරීමට නොහැක. කෙට්ටු කාන්තාවකට PCOS තිබිය හැක, අධික බරැති කාන්තාවකට එය නොතිබිය හැකි ආකාරයෙන්ම.',
    s7NeutralText:
      'පසු විපරම් සත්කාරයේදී තරාදියේ අංකය පමණක් නොව, සමස්ත සෞඛ්‍යය සැලකිල්ලට ගත යුතුයි.',
    s8Heading: 'සම, කෙස් සහ ශරීර රෝම',
    s8Body1:
      'සාපේක්ෂ ඇන්ඩ්‍රජන් අතිරික්තය සෙබේසියස් ග්‍රන්ථි සහ කෙස් ෆොලිකල්වලට බලපෑ හැක.',
    s8Body2:
      'කාන්තාව අනුව, මෙය දිගටම පවතින කුරුලෑ, වැඩි වූ කෙස් වර්ධනය, හෝ කෙස් ගැලවීමක් ලෙස ප්‍රකාශ විය හැක.',
    s8Items: [
      'හෝමෝන කුරුලෑ',
      'වැඩි වූ මුහුණේ හෝ ශරීර රෝම',
      'කෙස් තුනී වීම හෝ කෙස් ගැලවීම',
    ],
    s9Heading: 'PCOS කළමනාකරණය කරන්නේ කෙසේද?',
    s9Body1:
      'PCOS කළමනාකරණය සඳහා සෑම කාන්තාවකටම ක්‍රියා කරන තනි ප්‍රවේශයක් නැත. තේරීම රඳා පවතින්නේ රෝග ලක්ෂණ, ඉලක්ක සහ වෛද්‍ය තත්ත්වයන් මතය.',
    s9Body2:
      'ජීවිතයේ අවධිය අනුව ඉලක්කය වෙනස් විය හැක: චක්‍ර නියාමනය කිරීම, සමහර රෝග ලක්ෂණ වැඩිදියුණු කිරීම, පරිවෘත්තීය සෞඛ්‍යය ආරක්ෂා කිරීම, හෝ ගැබ්ගැනීමේ සැලසුමකට සහාය වීම.',
    s9MiniTitle: 'සෞඛ්‍යයට සහාය වන පුරුදු',
    s9Lifestyle: [
      'ඔබේ අවශ්‍යතාවලට ගැළපෙන විවිධාකාර, නිතිපතා ආහාර වේලක් අනුභව කිරීම',
      'කාලයත් සමඟ ඔබට පවත්වාගත හැකි නිතිපතා ශාරීරික ක්‍රියාකාරකමක් කිරීම',
      'ප්‍රමාණවත් ලෙස නිතිපතා නින්දක් පවත්වා ගැනීම',
      'කාලයත් සමඟ ඔබේ චක්‍ර සහ රෝග ලක්ෂණ වෙනස් වන ආකාරය නිරීක්ෂණය කිරීම',
      'බර හෝ රෝග ලක්ෂණවල වෙනස්කම් ගැන ඔබටම දොස් නොකිරීම',
    ],
    s9Body3:
      'ඔබේ අවශ්‍යතා අනුව, සෞඛ්‍ය සේවා සපයන්නෙකු සමහර රෝග ලක්ෂණ සඳහා හෝ ගැබ්ගැනීමේ සැලසුමකට සහාය වීමට ප්‍රතිකාර ඉදිරිපත් කළ හැක.',
    s9AlertTitle: 'ස්වයං ප්‍රතිකාර නොකරන්න',
    s9AlertText:
      'හෝමෝන ප්‍රතිකාර, පරිවෘත්තීය ඖෂධ සහ ආහාර අතිරේක සියල්ලම සෞඛ්‍ය සේවා සපයන්නෙකු සමඟ සාකච්ඡා කළ යුතුයි.',
    s10Heading: 'PCOS පිළිබඳ පොදු වැරදි වැටහීම්',
    s10Myths: [
      'PCOS සැමවිටම “කෝෂිකා” තිබීම අදහස් කරයි: නම නොමඟ යවන සුළු විය හැක. රෝග විනිශ්චය කෝෂිකා පැවතීම මත පමණක් රඳා නොපවතී.',
      'PCOS ඇති සියලුම කාන්තාවන් අධික බරැතියි: PCOS සෑම ශරීර වර්ගයකම කාන්තාවන්ට බලපෑ හැක.',
      'PCOS සැමවිටම ගැබ්ගැනීම වළක්වයි: ඩිම්බ මෝචනය අක්‍රමවත් විය හැකි නමුත්, ගැබ්ගැනීම තවමත් හැකියි.',
      'තනි රෝග ලක්ෂණයක් PCOS රෝග විනිශ්චය කිරීමට ප්‍රමාණවත්: රෝග විනිශ්චයට විස්තීර්ණ තක්සේරුවක් අවශ්‍ය වේ.',
      'PCOS වයසත් සමඟ සරලව අතුරුදහන් වේ: එය ප්‍රකාශ වන ආකාරය ජීවිත කාලය පුරා වෙනස් විය හැකි නමුත්, අඛණ්ඩ පසු විපරම වැදගත් ලෙස පවතී.',
    ],
    s11Heading: 'වෛද්‍යවරයෙකු හමුවිය යුත්තේ කවදාද',
    s11Body1:
      'චක්‍ර ඉතා අක්‍රමවත් වන විට, මාස කිහිපයක් නතර වන විට, හෝ අසාමාන්‍ය රෝග ලක්ෂණ දිස්වන විට වෛද්‍ය උපදෙස් විශේෂයෙන් වටී.',
    s11ConsultItems: [
      'ඉතා අක්‍රමවත් හෝ නොමැති චක්‍ර',
      'අසාමාන්‍ය කුරුලෑ හෝ කෙස් වර්ධනය',
      'සැලකිය යුතු කෙස් ගැලවීම',
      'ගර්භ ගැනීමේ අපහසුව',
      'වේගයෙන් වෙනස් වන රෝග ලක්ෂණ',
    ],
    s12Heading: 'ප්‍රධාන කරුණු',
    s12SummaryTitle: 'අත්‍යවශ්‍ය කරුණු',
    s12SummaryItems: [
      'PCOS යනු පොදු හෝමෝන තත්ත්වයකි.',
      'එය විවිධ ආකාරවලින් ප්‍රකාශ විය හැක.',
      'PCOS ඇති සියලුම කාන්තාවන්ට එකම රෝග ලක්ෂණ නැත.',
      'බර පමණක් PCOS රෝග විනිශ්චය කිරීමට හෝ බැහැර කිරීමට ප්‍රමාණවත් නොවේ.',
      'රෝග විනිශ්චයට විස්තීර්ණ වෛද්‍ය තක්සේරුවක් අවශ්‍යයි.',
      'PCOS ඩිම්බ මෝචනයට සහ සමහර විට සාරවත් බවට බලපෑ හැක.',
      'පුද්ගලීකරණය කළ සත්කාර ප්‍රවේශයක් සෑම කාන්තාවකගේම අවශ්‍යතා සපුරාලීමට උපකාරී වේ.',
    ],
    finalNoteTitle: 'වඩා හොඳින් තේරුම් ගැනීමට මාර්ගෝපදේශයක්',
    finalNoteText:
      'මෙම ලිපිය සාමාන්‍ය තොරතුරු සඳහා අදහස් කර ඇති අතර වෛද්‍ය උපදේශනයක් වෙනුවට නොපවතී. සෑම තත්ත්වයක්ම වෙනස්: සැකයක් ඇත්නම් හෝ රෝග ලක්ෂණ දිගටම පවතී නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
    shareMessage: 'PCOS තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'PCOS • คู่มือสำคัญ',
    title: 'ทำความเข้าใจ\nPCOS',
    metaDuration: 'อ่าน 10 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาเพื่อการเรียนรู้',
    intro:
      'กลุ่มอาการถุงน้ำรังไข่หลายใบ หรือที่มักเรียกว่า PCOS เป็นภาวะทางฮอร์โมนที่พบบ่อย ซึ่งอาจส่งผลต่อรอบเดือน การตกไข่ ผิวหนัง เส้นผม การเผาผลาญ และบางครั้งภาวะเจริญพันธุ์',
    introSecondary:
      'ลักษณะที่ปรากฏแตกต่างกันมากในผู้หญิงแต่ละคน การทำความเข้าใจ PCOS ช่วยให้คุณสังเกตอาการ รู้ว่าเมื่อไรควรขอคำแนะนำทางการแพทย์ และติดตามการเปลี่ยนแปลงโดยไม่โทษตัวเอง',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'PCOS คืออะไร?',
      'ทำไมจึงเกิด PCOS?',
      'สัญญาณหลัก',
      'วินิจฉัยอย่างไร?',
      'PCOS และการตกไข่',
      'PCOS และภาวะเจริญพันธุ์',
      'PCOS กับน้ำหนัก / การเผาผลาญ',
      'ผิว เส้นผม และขนตามร่างกาย',
      'จัดการ PCOS อย่างไร?',
      'ความเข้าใจผิดที่พบบ่อย',
      'เมื่อไรควรพบแพทย์',
      'ประเด็นสำคัญ',
    ],
    s1Heading: 'PCOS คืออะไร?',
    s1Body1:
      'กลุ่มอาการถุงน้ำรังไข่หลายใบ (PCOS) เป็นภาวะทางฮอร์โมนที่พบบ่อย ซึ่งอาจเปลี่ยนการทำงานตามปกติของรังไข่และสมดุลของฮอร์โมนบางอย่าง',
    s1Body2:
      'สำหรับผู้หญิงบางคน ปัญหาหลักคือการตกไข่ไม่สม่ำเสมอ สำหรับคนอื่น สิ่งที่เด่นชัดก่อนคือสิว ขนขึ้นมาก ผมร่วง หรือสัญญาณด้านการเผาผลาญ',
    s1TipTitle: 'ควรรู้',
    s1TipText:
      'แม้ชื่อจะเป็นเช่นนั้น PCOS ไม่ได้หมายความว่ารังไข่มี “ถุงน้ำ” เสมอไป คำศัพท์ทางประวัติศาสตร์อาจทำให้เข้าใจผิด และอัลตราซาวนด์อย่างเดียวไม่เพียงพอที่จะวินิจฉัย',
    s2Heading: 'ทำไมจึงเกิด PCOS?',
    s2Body1:
      'ไม่มีสาเหตุเดียวของ PCOS ดูเหมือนเป็นผลจากหลายปัจจัยที่รวมกันได้: ความโน้มเอียงในครอบครัว การทำงานของฮอร์โมน การตกไข่ การเผาผลาญ และปัจจัยส่วนบุคคล',
    s2Factors: [
      'ความโน้มเอียงในครอบครัวและปัจจัยทางพันธุกรรม',
      'ความผิดปกติของการตกไข่',
      'แอนโดรเจนมากเกินไปเมื่อเทียบกัน',
      'ภาวะดื้ออินซูลินในผู้หญิงบางคน',
      'ปัจจัยด้านการเผาผลาญและสิ่งแวดล้อม',
    ],
    s2NeutralText:
      'PCOS ไม่ใช่ความล้มเหลวส่วนตัว ไม่ได้เป็นผลจากการขาดความตั้งใจ อาหารที่ไม่ดี หรือกิจกรรมทางกายไม่พอเพียงอย่างเดียว',
    s3Heading: 'สัญญาณหลัก',
    s3Body1:
      'PCOS ปรากฏต่างกันมากในผู้หญิงแต่ละคน บางคนมีหลายอาการ ขณะที่บางคนสังเกตเห็นน้อยมาก',
    s3Signs: [
      'รอบเดือนไม่สม่ำเสมอ ห่างกัน หรือบางครั้งขาดหาย',
      'การตกไข่ไม่สม่ำเสมอหรือคาดเดายาก',
      'สิวที่คงอยู่ โดยเฉพาะที่ใบหน้าส่วนล่าง',
      'ขนขึ้นมากขึ้นที่ใบหน้า หน้าอก หรือลำตัว',
      'ผมร่วงแบบฮอร์โมน',
      'น้ำหนักขึ้นหรือลดน้ำหนักยาก',
      'ตั้งครรภ์ยาก',
    ],
    s3AlertTitle: 'สำคัญ',
    s3AlertText:
      'การมีอาการใดอาการหนึ่งเหล่านี้ไม่ได้หมายความโดยอัตโนมัติว่าคุณเป็น PCOS ภาวะอื่นอีกหลายอย่างอาจทำให้เกิดอาการคล้ายกัน',
    s4Heading: 'วินิจฉัยอย่างไร?',
    s4Body1:
      'การวินิจฉัย PCOS เป็นกระบวนการทางการแพทย์ ผู้ให้การดูแลสุขภาพมักเริ่มด้วยการพูดคุยเรื่องรอบเดือน อาการ ประวัติทางการแพทย์ และการรักษาที่คุณทานอยู่',
    s4Body2:
      'ตามสถานการณ์ อาจเสนอการตรวจเลือดดูฮอร์โมนและอัลตราซาวนด์ด้วย',
    s4Points: [
      'รอบเดือนไม่สม่ำเสมอหรือการตกไข่ไม่บ่อย',
      'สัญญาณของแอนโดรเจนมากเกินไป: สิว ขนขึ้นมาก ผมร่วง หรือผลตรวจเลือด',
      'ลักษณะรังไข่ที่สอดคล้องกับ PCOS จากอัลตราซาวนด์ เมื่อมีข้อบ่งชี้ให้ตรวจ',
    ],
    s4Body3:
      'แพทย์ยังต้องตัดสาเหตุอื่นที่เป็นไปได้ของรอบเดือนไม่สม่ำเสมอหรือแอนโดรเจนมากเกินไปก่อนยืนยันการวินิจฉัย PCOS',
    s5Heading: 'PCOS และการตกไข่',
    s5Body1:
      'การตกไข่คือการปล่อยไข่ (โอโอไซต์) จากรังไข่ ใน PCOS การตกไข่อาจไม่บ่อยหรือคาดเดายากขึ้น',
    s5Body2:
      'ซึ่งอธิบายว่าทำไมรอบเดือนบางครั้งจึงยาว ไม่สม่ำเสมอ หรือคาดการณ์ยาก',
    s5HighlightTitle: 'ติดตามรอบเดือนของคุณ',
    s5HighlightText:
      'การบันทึกวันที่ประจำเดือน อาการ และสัญญาณของการตกไข่ใด ๆ ช่วยให้คุณเข้าใจรูปแบบของตัวเองดียิ่งขึ้น',
    s6Heading: 'PCOS และภาวะเจริญพันธุ์',
    s6Body1:
      'เนื่องจากการตกไข่อาจไม่สม่ำเสมอ ผู้หญิงบางคนที่เป็น PCOS อาจตั้งครรภ์ได้ยากขึ้น',
    s6Body2:
      'อย่างไรก็ตาม ไม่ได้หมายความว่า PCOS ขัดขวางการตั้งครรภ์โดยอัตโนมัติ ผู้หญิงหลายคนที่เป็น PCOS ตั้งครรภ์ได้เองตามธรรมชาติหรือด้วยการสนับสนุนทางการแพทย์ที่เหมาะสม',
    s6TipTitle: 'โปรดจำไว้',
    s6TipText:
      'การตั้งครรภ์ยากไม่ได้หมายความว่าเป็นไปไม่ได้ หากคุณหวังจะตั้งครรภ์ แพทย์หรือผดุงครรภ์แนะนำกลยุทธ์ที่เหมาะกับสถานการณ์ของคุณได้',
    s7Heading: 'PCOS กับน้ำหนัก / การเผาผลาญ',
    s7Body1:
      'PCOS อาจเกี่ยวข้องกับการเปลี่ยนแปลงด้านการเผาผลาญ รวมถึงภาวะดื้ออินซูลินในผู้หญิงบางคน',
    s7Body2:
      'อย่างไรก็ตาม น้ำหนักอย่างเดียววินิจฉัยหรือตัด PCOS ออกไม่ได้ ผู้หญิงรูปร่างผอมเป็น PCOS ได้ เช่นเดียวกับผู้หญิงที่น้ำหนักเกินอาจไม่เป็น',
    s7NeutralText:
      'การติดตามผลควรพิจารณาสุขภาพโดยรวม ไม่ใช่แค่ตัวเลขบนเครื่องชั่ง',
    s8Heading: 'ผิว เส้นผม และขนตามร่างกาย',
    s8Body1:
      'แอนโดรเจนที่มากเกินไปเมื่อเทียบกัน อาจส่งผลต่อต่อมไขมันและรูขุมขน',
    s8Body2:
      'ตามผู้หญิงแต่ละคน อาจปรากฏเป็นสิวที่คงอยู่ ขนขึ้นมากขึ้น หรือผมร่วง',
    s8Items: [
      'สิวฮอร์โมน',
      'ขนที่ใบหน้าหรือลำตัวเพิ่มขึ้น',
      'ผมบางหรือผมร่วง',
    ],
    s9Heading: 'จัดการ PCOS อย่างไร?',
    s9Body1:
      'ไม่มีแนวทางเดียวในการจัดการ PCOS ที่ได้ผลกับผู้หญิงทุกคน ตัวเลือกขึ้นอยู่กับอาการ เป้าหมาย และสถานการณ์ทางการแพทย์',
    s9Body2:
      'เป้าหมายอาจต่างกันตามช่วงชีวิต: ปรับรอบเดือน บรรเทาอาการบางอย่าง ปกป้องสุขภาพการเผาผลาญ หรือสนับสนุนแผนการตั้งครรภ์',
    s9MiniTitle: 'นิสัยที่สนับสนุนสุขภาพ',
    s9Lifestyle: [
      'กินอาหารที่หลากหลายและเป็นเวลา เหมาะกับความต้องการของคุณ',
      'ทำกิจกรรมทางกายสม่ำเสมอที่คุณทำต่อเนื่องได้',
      'นอนหลับให้สม่ำเสมอพอสมควร',
      'ติดตามการเปลี่ยนแปลงของรอบเดือนและอาการตามเวลา',
      'ไม่โทษตัวเองกับการเปลี่ยนแปลงของน้ำหนักหรืออาการ',
    ],
    s9Body3:
      'ตามความต้องการของคุณ ผู้ให้การดูแลสุขภาพอาจเสนอการรักษาอาการบางอย่างหรือสนับสนุนแผนการตั้งครรภ์',
    s9AlertTitle: 'อย่ารักษาตัวเอง',
    s9AlertText:
      'การรักษาด้วยฮอร์โมน ยาเกี่ยวกับการเผาผลาญ และอาหารเสริมทั้งหมด ควรปรึกษาผู้ให้การดูแลสุขภาพ',
    s10Heading: 'ความเข้าใจผิดที่พบบ่อยเกี่ยวกับ PCOS',
    s10Myths: [
      'PCOS หมายถึงการมี “ถุงน้ำ” เสมอ: ชื่ออาจทำให้เข้าใจผิด การวินิจฉัยไม่ได้อาศัยการมีถุงน้ำเพียงอย่างเดียว',
      'ผู้หญิงที่เป็น PCOS ทุกคนน้ำหนักเกิน: PCOS เกิดกับผู้หญิงทุกรูปร่างได้',
      'PCOS ขัดขวางการตั้งครรภ์เสมอ: การตกไข่อาจไม่สม่ำเสมอ แต่การตั้งครรภ์ยังเป็นไปได้',
      'อาการเดียวก็เพียงพอที่จะวินิจฉัย PCOS: การวินิจฉัยต้องอาศัยการประเมินอย่างครบถ้วน',
      'PCOS หายไปเองเมื่ออายุมากขึ้น: ลักษณะที่ปรากฏอาจเปลี่ยนไปตลอดชีวิต แต่การติดตามต่อเนื่องยังคงสำคัญ',
    ],
    s11Heading: 'เมื่อไรควรพบแพทย์',
    s11Body1:
      'คำแนะนำทางการแพทย์คุ้มค่าเป็นพิเศษเมื่อรอบเดือนไม่สม่ำเสมอมาก ขาดหายไปหลายเดือน หรือเมื่อมีอาการผิดปกติ',
    s11ConsultItems: [
      'รอบเดือนไม่สม่ำเสมอมากหรือขาดหาย',
      'สิวหรือขนขึ้นผิดปกติ',
      'ผมร่วงมาก',
      'ตั้งครรภ์ยาก',
      'อาการเปลี่ยนแปลงอย่างรวดเร็ว',
    ],
    s12Heading: 'ประเด็นสำคัญ',
    s12SummaryTitle: 'ประเด็นสำคัญ',
    s12SummaryItems: [
      'PCOS เป็นภาวะทางฮอร์โมนที่พบบ่อย',
      'อาจปรากฏได้หลายรูปแบบ',
      'ผู้หญิงที่เป็น PCOS ไม่ได้มีอาการเหมือนกันทุกคน',
      'น้ำหนักอย่างเดียวไม่เพียงพอที่จะวินิจฉัยหรือตัด PCOS ออก',
      'การวินิจฉัยต้องอาศัยการประเมินทางการแพทย์อย่างครบถ้วน',
      'PCOS อาจส่งผลต่อการตกไข่และบางครั้งภาวะเจริญพันธุ์',
      'แนวทางการดูแลเฉพาะบุคคลช่วยตอบสนองความต้องการของผู้หญิงแต่ละคน',
    ],
    finalNoteTitle: 'คู่มือเพื่อความเข้าใจที่ดียิ่งขึ้น',
    finalNoteText:
      'บทความนี้เพื่อให้ข้อมูลทั่วไปและไม่ได้ทดแทนการปรึกษาแพทย์ แต่ละสถานการณ์ต่างกัน: หากมีข้อสงสัยหรืออาการยังคงอยู่ โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'ทำความเข้าใจ PCOS — AWA',
  },
  vi: {
    badge: 'PCOS • HƯỚNG DẪN THIẾT YẾU',
    title: 'Hiểu về\nPCOS',
    metaDuration: '10 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung giáo dục',
    intro:
      'Hội chứng buồng trứng đa nang, thường gọi là PCOS, là một tình trạng nội tiết phổ biến có thể ảnh hưởng đến chu kỳ, rụng trứng, da, tóc, chuyển hóa và đôi khi là khả năng sinh sản của bạn.',
    introSecondary:
      'Cách nó biểu hiện khác nhau rất nhiều giữa từng phụ nữ. Hiểu về PCOS chủ yếu giúp bạn nhận ra các triệu chứng, biết khi nào nên tìm lời khuyên y khoa và theo dõi diễn tiến mà không tự trách bản thân.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'PCOS là gì?',
      'Tại sao xảy ra PCOS?',
      'Những dấu hiệu chính',
      'PCOS được chẩn đoán như thế nào?',
      'PCOS và rụng trứng',
      'PCOS và khả năng sinh sản',
      'PCOS và cân nặng / chuyển hóa',
      'Da, tóc và lông trên cơ thể',
      'PCOS được kiểm soát như thế nào?',
      'Những quan niệm sai thường gặp',
      'Khi nào nên đi khám bác sĩ',
      'Những điểm chính cần nhớ',
    ],
    s1Heading: 'PCOS là gì?',
    s1Body1:
      'Hội chứng buồng trứng đa nang (PCOS) là một tình trạng nội tiết phổ biến có thể làm thay đổi hoạt động thông thường của buồng trứng và sự cân bằng của một số hormone.',
    s1Body2:
      'Với một số phụ nữ, vấn đề chính là rụng trứng không đều. Với những người khác, mụn, lông mọc nhiều, rụng tóc hoặc các dấu hiệu chuyển hóa là điều nổi bật trước tiên.',
    s1TipTitle: 'Nên biết',
    s1TipText:
      'Dù tên gọi như vậy, PCOS không nhất thiết có nghĩa là buồng trứng chứa “nang”. Thuật ngữ mang tính lịch sử này có thể gây hiểu lầm, và chỉ riêng siêu âm không đủ để chẩn đoán.',
    s2Heading: 'Tại sao xảy ra PCOS?',
    s2Body1:
      'PCOS không có một nguyên nhân duy nhất. Nó dường như là kết quả của nhiều yếu tố có thể kết hợp với nhau: khuynh hướng gia đình, hoạt động nội tiết, rụng trứng, chuyển hóa và các yếu tố cá nhân.',
    s2Factors: [
      'Khuynh hướng gia đình và các yếu tố di truyền',
      'Rối loạn rụng trứng',
      'Dư thừa androgen tương đối',
      'Kháng insulin ở một số phụ nữ',
      'Các yếu tố chuyển hóa và môi trường',
    ],
    s2NeutralText:
      'PCOS không phải là lỗi cá nhân. Nó không đơn giản là kết quả của việc thiếu ý chí, chế độ ăn kém hay hoạt động thể chất không đủ.',
    s3Heading: 'Những dấu hiệu chính',
    s3Body1:
      'PCOS có thể biểu hiện rất khác nhau giữa từng phụ nữ. Một số có nhiều triệu chứng, trong khi người khác nhận thấy rất ít.',
    s3Signs: [
      'Chu kỳ không đều, thưa hoặc đôi khi vắng mặt',
      'Rụng trứng không đều hoặc khó dự đoán',
      'Mụn kéo dài, đặc biệt ở phần dưới khuôn mặt',
      'Lông mọc nhiều hơn ở mặt, ngực hoặc cơ thể',
      'Rụng tóc kiểu nội tiết',
      'Tăng cân hoặc khó giảm cân',
      'Khó thụ thai',
    ],
    s3AlertTitle: 'Quan trọng',
    s3AlertText:
      'Có một trong những triệu chứng này không tự động có nghĩa là bạn bị PCOS. Nhiều tình trạng khác có thể gây ra các triệu chứng tương tự.',
    s4Heading: 'PCOS được chẩn đoán như thế nào?',
    s4Body1:
      'Chẩn đoán PCOS là một quá trình y khoa. Nhân viên y tế thường bắt đầu bằng việc trao đổi về chu kỳ, triệu chứng, tiền sử bệnh và các phương pháp điều trị bạn đang dùng.',
    s4Body2:
      'Tùy tình huống, cũng có thể đề xuất xét nghiệm máu nội tiết và siêu âm.',
    s4Points: [
      'Chu kỳ không đều hoặc rụng trứng thưa',
      'Dấu hiệu thừa androgen: mụn, lông mọc nhiều, rụng tóc hoặc kết quả xét nghiệm máu',
      'Hình dạng buồng trứng phù hợp với PCOS trên siêu âm, khi có chỉ định thăm khám này',
    ],
    s4Body3:
      'Bác sĩ cũng phải loại trừ các nguyên nhân khác có thể gây chu kỳ không đều hoặc thừa androgen trước khi xác nhận chẩn đoán PCOS.',
    s5Heading: 'PCOS và rụng trứng',
    s5Body1:
      'Rụng trứng là việc phóng thích một quả trứng (noãn) từ buồng trứng. Ở PCOS, rụng trứng có thể ít xảy ra hơn hoặc khó dự đoán hơn.',
    s5Body2:
      'Điều này có thể giải thích tại sao chu kỳ đôi khi dài, không đều hoặc khó lường trước.',
    s5HighlightTitle: 'Theo dõi chu kỳ của bạn',
    s5HighlightText:
      'Ghi lại ngày kỳ kinh, triệu chứng và mọi dấu hiệu rụng trứng có thể giúp bạn hiểu rõ hơn quy luật của riêng mình.',
    s6Heading: 'PCOS và khả năng sinh sản',
    s6Body1:
      'Vì rụng trứng có thể không đều, một số phụ nữ bị PCOS có thể gặp khó khăn hơn khi thụ thai.',
    s6Body2:
      'Tuy nhiên, điều này không có nghĩa là PCOS tự động ngăn cản việc mang thai. Nhiều phụ nữ bị PCOS thụ thai tự nhiên hoặc với sự hỗ trợ y tế phù hợp.',
    s6TipTitle: 'Hãy ghi nhớ',
    s6TipText:
      'Khó thụ thai không có nghĩa là không thể. Nếu bạn mong muốn có thai, bác sĩ hoặc nữ hộ sinh có thể đề xuất một chiến lược phù hợp với tình huống của bạn.',
    s7Heading: 'PCOS và cân nặng / chuyển hóa',
    s7Body1:
      'PCOS có thể đi kèm với những thay đổi chuyển hóa, bao gồm kháng insulin ở một số phụ nữ.',
    s7Body2:
      'Tuy nhiên, chỉ riêng cân nặng không thể chẩn đoán hay loại trừ PCOS. Một phụ nữ gầy có thể bị PCOS, cũng như một phụ nữ thừa cân có thể không bị.',
    s7NeutralText:
      'Việc theo dõi nên cân nhắc sức khỏe tổng thể, không chỉ con số trên cân.',
    s8Heading: 'Da, tóc và lông trên cơ thể',
    s8Body1:
      'Sự dư thừa androgen tương đối có thể ảnh hưởng đến tuyến bã nhờn và nang lông.',
    s8Body2:
      'Tùy từng phụ nữ, điều này có thể biểu hiện thành mụn kéo dài, lông mọc nhiều hơn hoặc rụng tóc.',
    s8Items: [
      'Mụn do nội tiết',
      'Lông mặt hoặc lông cơ thể mọc nhiều hơn',
      'Tóc thưa hoặc rụng tóc',
    ],
    s9Heading: 'PCOS được kiểm soát như thế nào?',
    s9Body1:
      'Không có một cách tiếp cận duy nhất để kiểm soát PCOS phù hợp với mọi phụ nữ. Lựa chọn phụ thuộc vào triệu chứng, mục tiêu và hoàn cảnh y tế.',
    s9Body2:
      'Mục tiêu có thể khác nhau tùy giai đoạn cuộc sống: điều hòa chu kỳ, cải thiện một số triệu chứng, bảo vệ sức khỏe chuyển hóa hoặc hỗ trợ kế hoạch mang thai.',
    s9MiniTitle: 'Những thói quen hỗ trợ sức khỏe',
    s9Lifestyle: [
      'Ăn uống đa dạng, đều đặn, phù hợp với nhu cầu của bạn',
      'Hoạt động thể chất đều đặn mà bạn có thể duy trì lâu dài',
      'Giữ giấc ngủ đủ đều đặn',
      'Theo dõi chu kỳ và triệu chứng thay đổi thế nào theo thời gian',
      'Không tự trách bản thân về những thay đổi cân nặng hay triệu chứng',
    ],
    s9Body3:
      'Tùy nhu cầu của bạn, nhân viên y tế cũng có thể đề xuất các phương pháp điều trị cho một số triệu chứng hoặc để hỗ trợ kế hoạch mang thai.',
    s9AlertTitle: 'Đừng tự ý dùng thuốc',
    s9AlertText:
      'Thuốc nội tiết, thuốc chuyển hóa và thực phẩm bổ sung đều cần được trao đổi với nhân viên y tế.',
    s10Heading: 'Những quan niệm sai thường gặp về PCOS',
    s10Myths: [
      'PCOS luôn có nghĩa là có “nang”: tên gọi có thể gây hiểu lầm. Chẩn đoán không chỉ dựa vào sự hiện diện của nang.',
      'Tất cả phụ nữ bị PCOS đều thừa cân: PCOS có thể ảnh hưởng đến phụ nữ ở mọi vóc dáng.',
      'PCOS luôn ngăn cản việc mang thai: rụng trứng có thể không đều, nhưng vẫn có thể mang thai.',
      'Chỉ một triệu chứng là đủ để chẩn đoán PCOS: chẩn đoán cần một đánh giá toàn diện.',
      'PCOS tự hết theo tuổi tác: cách nó biểu hiện có thể thay đổi trong suốt cuộc đời, nhưng việc theo dõi liên tục vẫn quan trọng.',
    ],
    s11Heading: 'Khi nào nên đi khám bác sĩ',
    s11Body1:
      'Lời khuyên y khoa đặc biệt đáng giá khi chu kỳ trở nên rất không đều, mất kinh trong nhiều tháng hoặc khi xuất hiện các triệu chứng bất thường.',
    s11ConsultItems: [
      'Chu kỳ rất không đều hoặc vắng mặt',
      'Mụn hoặc lông mọc bất thường',
      'Rụng tóc đáng kể',
      'Khó thụ thai',
      'Các triệu chứng thay đổi nhanh chóng',
    ],
    s12Heading: 'Những điểm chính cần nhớ',
    s12SummaryTitle: 'Những điểm thiết yếu',
    s12SummaryItems: [
      'PCOS là một tình trạng nội tiết phổ biến.',
      'Nó có thể biểu hiện theo nhiều cách khác nhau.',
      'Không phải tất cả phụ nữ bị PCOS đều có cùng triệu chứng.',
      'Chỉ riêng cân nặng không đủ để chẩn đoán hay loại trừ PCOS.',
      'Chẩn đoán cần một đánh giá y khoa toàn diện.',
      'PCOS có thể ảnh hưởng đến rụng trứng và đôi khi là khả năng sinh sản.',
      'Một cách tiếp cận chăm sóc cá nhân hóa giúp đáp ứng nhu cầu của từng phụ nữ.',
    ],
    finalNoteTitle: 'Một hướng dẫn để hiểu rõ hơn',
    finalNoteText:
      'Bài viết này nhằm cung cấp thông tin chung và không thay thế buổi khám y tế. Mỗi tình huống đều khác nhau: nếu có nghi ngờ hoặc triệu chứng kéo dài, hãy tìm lời khuyên từ nhân viên y tế.',
    shareMessage: 'Hiểu về PCOS — AWA',
  },
  uz: {
    badge: 'PCOS • ASOSIY QOʻLLANMA',
    title: 'PCOS ni\ntushunish',
    metaDuration: '10 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Taʼlimiy kontent',
    intro:
      'Polikistik tuxumdon sindromi, koʻpincha PCOS deb ataladi, siklingizga, ovulyatsiyaga, teringizga, tuklaringizga, metabolizmingizga va baʼzan unumdorlikka taʼsir qilishi mumkin boʻlgan keng tarqalgan gormonal holat.',
    introSecondary:
      'Uning namoyon boʻlishi ayoldan ayolga juda farq qiladi. PCOS ni tushunish asosan uning alomatlarini tanishga, qachon tibbiy maslahat olish kerakligini bilishga va oʻzingizni ayblamasdan uning qanday oʻzgarishini kuzatishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'PCOS nima?',
      'PCOS nima uchun paydo boʻladi?',
      'Asosiy belgilar',
      'U qanday tashxislanadi?',
      'PCOS va ovulyatsiya',
      'PCOS va unumdorlik',
      'PCOS va vazn / metabolizm',
      'Teri, tuklar va badan tuklari',
      'PCOS qanday boshqariladi?',
      'Keng tarqalgan yanglish tushunchalar',
      'Qachon shifokorga borish kerak',
      'Asosiy xulosalar',
    ],
    s1Heading: 'PCOS nima?',
    s1Body1:
      'Polikistik tuxumdon sindromi (PCOS) tuxumdonlarning odatiy ishini va baʼzi gormonlar muvozanatini oʻzgartirishi mumkin boʻlgan keng tarqalgan gormonal holat.',
    s1Body2:
      'Baʼzi ayollar uchun asosiy muammo — notekis ovulyatsiya. Boshqalar uchun birinchi navbatda husnbuzar, tuklarning ortiqcha oʻsishi, sochning toʻkilishi yoki metabolik belgilar koʻzga tashlanadi.',
    s1TipTitle: 'Bilish foydali',
    s1TipText:
      'Nomiga qaramay, PCOS tuxumdonlarda albatta “kistalar” borligini anglatmaydi. Tarixiy atama chalgʻitishi mumkin va tashxis qoʻyish uchun faqat UZI yetarli emas.',
    s2Heading: 'PCOS nima uchun paydo boʻladi?',
    s2Body1:
      'PCOS ning yagona sababi yoʻq. U qoʻshilishi mumkin boʻlgan bir nechta omil natijasida paydo boʻladi: oilaviy moyillik, gormonal ishlash, ovulyatsiya, metabolizm va individual omillar.',
    s2Factors: [
      'Oilaviy moyillik va genetik omillar',
      'Ovulyatsiyaning buzilishi',
      'Androgenlarning nisbiy ortiqchaligi',
      'Baʼzi ayollarda insulin qarshiligi',
      'Metabolik va atrof-muhit omillari',
    ],
    s2NeutralText:
      'PCOS shaxsiy kamchilik emas. U shunchaki irodasizlik, notoʻgʻri ovqatlanish yoki yetarli boʻlmagan jismoniy faollik natijasi emas.',
    s3Heading: 'Asosiy belgilar',
    s3Body1:
      'PCOS ayoldan ayolga juda turlicha namoyon boʻlishi mumkin. Baʼzilarida bir nechta alomat bor, boshqalari juda kam narsani sezadi.',
    s3Signs: [
      'Notekis, kam uchraydigan yoki baʼzan umuman boʻlmaydigan sikllar',
      'Notekis yoki oldindan aytish qiyin boʻlgan ovulyatsiya',
      'Doimiy husnbuzar, ayniqsa yuzning pastki qismida',
      'Yuzda, koʻkrakda yoki badanda tuklarning koʻpayishi',
      'Gormonal turdagi sochning toʻkilishi',
      'Vazn ortishi yoki vazn tashlashda qiyinchilik',
      'Homilador boʻlishda qiyinchilik',
    ],
    s3AlertTitle: 'Muhim',
    s3AlertText:
      'Bu alomatlardan biriga ega boʻlish sizda avtomatik PCOS borligini anglatmaydi. Bir nechta boshqa holatlar shunga oʻxshash alomatlarga sabab boʻlishi mumkin.',
    s4Heading: 'U qanday tashxislanadi?',
    s4Body1:
      'PCOS tashxisi tibbiy jarayon. Sogʻliqni saqlash xodimi odatda sikllaringiz, alomatlaringiz, tibbiy tarixingiz va qabul qilayotgan davolanishlaringizni muhokama qilishdan boshlaydi.',
    s4Body2:
      'Vaziyatga qarab, gormonal qon tahlillari va UZI ham taklif qilinishi mumkin.',
    s4Points: [
      'Notekis sikllar yoki kam uchraydigan ovulyatsiya',
      'Androgen ortiqchaligi belgilari: husnbuzar, tuklarning ortiqcha oʻsishi, sochning toʻkilishi yoki qon tahlili natijalari',
      'Bu tekshiruv koʻrsatilganda, UZI da PCOS ga mos keladigan tuxumdonlar koʻrinishi',
    ],
    s4Body3:
      'Shifokor PCOS tashxisini tasdiqlashdan oldin notekis sikllar yoki androgen ortiqchaligining boshqa mumkin boʻlgan sabablarini ham istisno qilishi kerak.',
    s5Heading: 'PCOS va ovulyatsiya',
    s5Body1:
      'Ovulyatsiya — tuxumdondan tuxum hujayra (oosit) chiqishi. PCOS da ovulyatsiya kamroq yoki oldindan aytish qiyinroq boʻlishi mumkin.',
    s5Body2:
      'Bu sikllar baʼzan nima uchun uzun, notekis yoki oldindan aytish qiyin ekanini tushuntirishi mumkin.',
    s5HighlightTitle: 'Siklingizni kuzatish',
    s5HighlightText:
      'Hayz sanalaringiz, alomatlaringiz va ovulyatsiyaning har qanday belgilarini yozib borish oʻz qonuniyatlaringizni yaxshiroq tushunishga yordam beradi.',
    s6Heading: 'PCOS va unumdorlik',
    s6Body1:
      'Ovulyatsiya notekis boʻlishi mumkinligi sababli, PCOS bilan baʼzi ayollarda homilador boʻlish qiyinroq boʻlishi mumkin.',
    s6Body2:
      'Biroq bu PCOS homiladorlikka avtomatik toʻsqinlik qiladi degani emas. PCOS li koʻp ayollar tabiiy yoʻl bilan yoki mos tibbiy yordam bilan homilador boʻladi.',
    s6TipTitle: 'Esda tuting',
    s6TipText:
      'Homilador boʻlishdagi qiyinchilik bu imkonsiz degani emas. Agar homilador boʻlishni umid qilsangiz, shifokor yoki doya vaziyatingizga mos strategiyani taklif qilishi mumkin.',
    s7Heading: 'PCOS va vazn / metabolizm',
    s7Body1:
      'PCOS metabolik oʻzgarishlar, jumladan baʼzi ayollarda insulin qarshiligi bilan bogʻliq boʻlishi mumkin.',
    s7Body2:
      'Biroq yakka vazn PCOS ni tashxislay yoki istisno qila olmaydi. Ozgʻin ayolda ham PCOS boʻlishi mumkin, ortiqcha vaznli ayolda esa boʻlmasligi mumkin.',
    s7NeutralText:
      'Kuzatuvda tarozidagi raqam emas, umumiy salomatlik eʼtiborga olinishi kerak.',
    s8Heading: 'Teri, tuklar va badan tuklari',
    s8Body1:
      'Androgenlarning nisbiy ortiqchaligi yogʻ bezlariga va tuk follikulalariga taʼsir qilishi mumkin.',
    s8Body2:
      'Ayolga qarab, bu doimiy husnbuzar, tuklarning koʻpayishi yoki sochning toʻkilishi koʻrinishida namoyon boʻlishi mumkin.',
    s8Items: [
      'Gormonal husnbuzar',
      'Yuz yoki badan tuklarining koʻpayishi',
      'Sochning siyraklashishi yoki toʻkilishi',
    ],
    s9Heading: 'PCOS qanday boshqariladi?',
    s9Body1:
      'PCOS ni boshqarishning har bir ayolga mos keladigan yagona yondashuvi yoʻq. Tanlov alomatlar, maqsadlar va tibbiy holatlarga bogʻliq.',
    s9Body2:
      'Maqsad hayot bosqichiga qarab farq qilishi mumkin: sikllarni tartibga solish, baʼzi alomatlarni yaxshilash, metabolik salomatlikni himoya qilish yoki homiladorlik rejasini qoʻllab-quvvatlash.',
    s9MiniTitle: 'Salomatlikni qoʻllab-quvvatlovchi odatlar',
    s9Lifestyle: [
      'Ehtiyojlaringizga mos xilma-xil, muntazam ovqatlanish',
      'Vaqt oʻtishi bilan davom ettira oladigan muntazam jismoniy faollik',
      'Yetarli darajada muntazam uyquni saqlash',
      'Sikllaringiz va alomatlaringiz vaqt oʻtishi bilan qanday oʻzgarishini kuzatish',
      'Vazn yoki alomatlardagi oʻzgarishlar uchun oʻzingizni ayblamaslik',
    ],
    s9Body3:
      'Ehtiyojlaringizga qarab, sogʻliqni saqlash xodimi baʼzi alomatlar uchun yoki homiladorlik rejasini qoʻllab-quvvatlash uchun davolanishlarni ham taklif qilishi mumkin.',
    s9AlertTitle: 'Oʻzboshimchalik bilan davolanmang',
    s9AlertText:
      'Gormonal davolanishlar, metabolik dorilar va oziq-ovqat qoʻshimchalari barchasi sogʻliqni saqlash xodimi bilan muhokama qilinishi kerak.',
    s10Heading: 'PCOS haqida keng tarqalgan yanglish tushunchalar',
    s10Myths: [
      'PCOS har doim “kistalar” borligini anglatadi: nom chalgʻitishi mumkin. Tashxis faqat kistalar mavjudligiga asoslanmaydi.',
      'PCOS li barcha ayollar ortiqcha vaznli: PCOS har qanday tana tuzilishidagi ayollarga taʼsir qilishi mumkin.',
      'PCOS har doim homiladorlikka toʻsqinlik qiladi: ovulyatsiya notekis boʻlishi mumkin, lekin homiladorlik baribir mumkin.',
      'Tashxis qoʻyish uchun bitta alomat yetarli: tashxis har tomonlama baholashni talab qiladi.',
      'PCOS yosh bilan oʻz-oʻzidan yoʻqoladi: uning namoyon boʻlishi umr davomida oʻzgarishi mumkin, ammo doimiy kuzatuv muhim boʻlib qoladi.',
    ],
    s11Heading: 'Qachon shifokorga borish kerak',
    s11Body1:
      'Sikllar juda notekis boʻlib qolganda, bir necha oy toʻxtaganda yoki odatdan tashqari alomatlar paydo boʻlganda tibbiy maslahat ayniqsa foydali.',
    s11ConsultItems: [
      'Juda notekis yoki boʻlmaydigan sikllar',
      'Odatdan tashqari husnbuzar yoki tuklar oʻsishi',
      'Sezilarli sochning toʻkilishi',
      'Homilador boʻlishda qiyinchilik',
      'Tez oʻzgaradigan alomatlar',
    ],
    s12Heading: 'Asosiy xulosalar',
    s12SummaryTitle: 'Muhim nuqtalar',
    s12SummaryItems: [
      'PCOS keng tarqalgan gormonal holat.',
      'U koʻplab turli koʻrinishlarda namoyon boʻlishi mumkin.',
      'PCOS li barcha ayollarda bir xil alomatlar boʻlmaydi.',
      'Yakka vazn PCOS ni tashxislash yoki istisno qilish uchun yetarli emas.',
      'Tashxis har tomonlama tibbiy baholashni talab qiladi.',
      'PCOS ovulyatsiyaga va baʼzan unumdorlikka taʼsir qilishi mumkin.',
      'Shaxsiylashtirilgan yondashuv har bir ayolning ehtiyojlarini qondirishga yordam beradi.',
    ],
    finalNoteTitle: 'Yaxshiroq tushunishga yordam beradigan qoʻllanma',
    finalNoteText:
      'Bu maqola umumiy maʼlumot uchun moʻljallangan va tibbiy maslahatni almashtirmaydi. Har bir vaziyat boshqacha: shubha boʻlsa yoki alomatlar saqlanib qolsa, sogʻliqni saqlash mutaxassisidan maslahat oling.',
    shareMessage: 'PCOS ni tushunish — AWA',
  },
  az: {
    badge: 'PKOS • ƏSAS BƏLƏDÇİ',
    title: 'PKOS-u\nanlamaq',
    metaDuration: '10 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Təhsil məzmunu',
    intro:
      'Polikistik yumurtalıq sindromu, çox vaxt PKOS adlanır, dövrlərinizə, ovulyasiyanıza, dərinizə, saçınıza, maddələr mübadiləsinə və bəzən münbitliyə təsir edə bilən geniş yayılmış hormonal vəziyyətdir.',
    introSecondary:
      'Onun təzahürü qadından qadına çox dəyişir. PKOS-u anlamaq əsasən simptomlarını tanımağa, nə vaxt tibbi məsləhət almaq lazım olduğunu bilməyə və özünü günahlandırmadan onun gedişini izləməyə kömək edir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'PKOS nədir?',
      'PKOS nə üçün baş verir?',
      'Əsas əlamətlər',
      'O necə diaqnoz qoyulur?',
      'PKOS və ovulyasiya',
      'PKOS və münbitlik',
      'PKOS və çəki / maddələr mübadiləsi',
      'Dəri, saç və bədən tükləri',
      'PKOS necə idarə olunur?',
      'Geniş yayılmış yanlış təsəvvürlər',
      'Nə vaxt həkimə müraciət etmək lazımdır',
      'Əsas nəticələr',
    ],
    s1Heading: 'PKOS nədir?',
    s1Body1:
      'Polikistik yumurtalıq sindromu (PKOS) yumurtalıqların adi fəaliyyətini və bəzi hormonların tarazlığını dəyişə bilən geniş yayılmış hormonal vəziyyətdir.',
    s1Body2:
      'Bəzi qadınlar üçün əsas problem qeyri-müntəzəm ovulyasiyadır. Digərləri üçün isə ilk növbədə sızanaq, həddindən artıq tük artımı, saç tökülməsi və ya metabolik əlamətlər diqqəti çəkir.',
    s1TipTitle: 'Bilmək faydalıdır',
    s1TipText:
      'Adına baxmayaraq, PKOS yumurtalıqlarda mütləq “kistaların” olması demək deyil. Tarixi termin yanıldıcı ola bilər və yalnız ultrasəs diaqnoz qoymaq üçün kifayət deyil.',
    s2Heading: 'PKOS nə üçün baş verir?',
    s2Body1:
      'PKOS-un yeganə səbəbi yoxdur. O, birləşə bilən bir neçə amilin nəticəsi kimi görünür: ailə meyli, hormonal fəaliyyət, ovulyasiya, maddələr mübadiləsi və fərdi amillər.',
    s2Factors: [
      'Ailə meyli və genetik amillər',
      'Ovulyasiyada pozuntular',
      'Nisbi androgen artıqlığı',
      'Bəzi qadınlarda insulin rezistentliyi',
      'Metabolik və ətraf mühit amilləri',
    ],
    s2NeutralText:
      'PKOS şəxsi qüsur deyil. O, sadəcə iradə çatışmazlığının, pis qidalanmanın və ya kifayət qədər fiziki fəaliyyətin olmamasının nəticəsi deyil.',
    s3Heading: 'Əsas əlamətlər',
    s3Body1:
      'PKOS qadından qadına çox fərqli təzahür edə bilər. Bəzilərində bir neçə simptom olur, digərləri isə çox az simptom hiss edir.',
    s3Signs: [
      'Qeyri-müntəzəm, seyrək və ya bəzən olmayan dövrlər',
      'Qeyri-müntəzəm və ya proqnozlaşdırılması çətin ovulyasiya',
      'Davamlı sızanaq, xüsusilə üzün aşağı hissəsində',
      'Üzdə, sinədə və ya bədəndə artmış tük artımı',
      'Hormonal tipli saç tökülməsi',
      'Çəki artımı və ya çəki itirməkdə çətinlik',
      'Hamilə qalmaqda çətinlik',
    ],
    s3AlertTitle: 'Vacibdir',
    s3AlertText:
      'Bu simptomlardan birinin olması avtomatik olaraq PKOS-unuz olduğu demək deyil. Bir neçə digər vəziyyət də oxşar simptomlara səbəb ola bilər.',
    s4Heading: 'O necə diaqnoz qoyulur?',
    s4Body1:
      'PKOS diaqnozu tibbi prosesdir. Tibb işçisi adətən dövrləriniz, simptomlarınız, tibbi anamnezinizi və qəbul etdiyiniz müalicələr barədə danışmaqla başlayır.',
    s4Body2:
      'Vəziyyətdən asılı olaraq, hormonal qan testləri və ultrasəs də təklif oluna bilər.',
    s4Points: [
      'Qeyri-müntəzəm dövrlər və ya seyrək ovulyasiya',
      'Androgen artıqlığının əlamətləri: sızanaq, həddindən artıq tük artımı, saç tökülməsi və ya qan testi nəticələri',
      'Bu müayinə göstərişdirsə, ultrasəsdə PKOS-a uyğun yumurtalıq görünüşü',
    ],
    s4Body3:
      'Həkim PKOS diaqnozunu təsdiq etməzdən əvvəl qeyri-müntəzəm dövrlərin və ya androgen artıqlığının digər mümkün səbəblərini də istisna etməlidir.',
    s5Heading: 'PKOS və ovulyasiya',
    s5Body1:
      'Ovulyasiya yumurtalıqdan yumurtahüceyrənin (ooqitin) ayrılmasıdır. PKOS-da ovulyasiya daha az tez-tez ola və ya proqnozlaşdırılması daha çətin ola bilər.',
    s5Body2:
      'Bu, dövrlərin bəzən niyə uzun, qeyri-müntəzəm və ya qabaqcadan görülməsi çətin olduğunu izah edə bilər.',
    s5HighlightTitle: 'Dövrünüzü izləmək',
    s5HighlightText:
      'Aybaşı tarixlərinizi, simptomlarınızı və ovulyasiyanın hər hansı əlamətlərini qeyd etmək öz qanunauyğunluqlarınızı daha yaxşı anlamağa kömək edə bilər.',
    s6Heading: 'PKOS və münbitlik',
    s6Body1:
      'Ovulyasiya qeyri-müntəzəm ola bildiyi üçün PKOS olan bəzi qadınlar hamilə qalmaqda daha çox çətinlik çəkə bilər.',
    s6Body2:
      'Bununla belə, bu, PKOS-un avtomatik olaraq hamiləliyə mane olması demək deyil. PKOS olan bir çox qadın təbii yolla və ya müvafiq tibbi dəstəklə hamilə qalır.',
    s6TipTitle: 'Yadda saxlayın',
    s6TipText:
      'Hamilə qalmaqda çətinlik bunun mümkünsüz olması demək deyil. Hamilə qalmaq ümid edirsinizsə, həkim və ya mama vəziyyətinizə uyğun strategiya təklif edə bilər.',
    s7Heading: 'PKOS və çəki / maddələr mübadiləsi',
    s7Body1:
      'PKOS bəzi qadınlarda insulin rezistentliyi də daxil olmaqla metabolik dəyişikliklərlə əlaqəli ola bilər.',
    s7Body2:
      'Lakin yalnız çəki PKOS-u diaqnoz etmək və ya istisna etmək üçün kifayət deyil. Arıq qadında PKOS ola bilər, eynilə artıq çəkisi olan qadında olmaya da bilər.',
    s7NeutralText:
      'Müşahidə yalnız tərəzidəki rəqəmi deyil, ümumi sağlamlığı nəzərə almalıdır.',
    s8Heading: 'Dəri, saç və bədən tükləri',
    s8Body1:
      'Nisbi androgen artıqlığı piy vəzilərinə və tük follikullarına təsir edə bilər.',
    s8Body2:
      'Qadından asılı olaraq bu, davamlı sızanaq, artmış tük artımı və ya saç tökülməsi şəklində təzahür edə bilər.',
    s8Items: [
      'Hormonal sızanaq',
      'Üzdə və ya bədəndə artmış tük artımı',
      'Saçın seyrəlməsi və ya tökülməsi',
    ],
    s9Heading: 'PKOS necə idarə olunur?',
    s9Body1:
      'Hər qadın üçün işləyən PKOS-un idarə edilməsinin yeganə yanaşması yoxdur. Seçim simptomlardan, məqsədlərdən və tibbi şəraitdən asılıdır.',
    s9Body2:
      'Məqsəd həyat mərhələsindən asılı olaraq fərqli ola bilər: dövrləri tənzimləmək, bəzi simptomları yaxşılaşdırmaq, metabolik sağlamlığı qorumaq və ya hamiləlik planını dəstəkləmək.',
    s9MiniTitle: 'Sağlamlığı dəstəkləyən vərdişlər',
    s9Lifestyle: [
      'Ehtiyaclarınıza uyğun müxtəlif, müntəzəm qidalanmaq',
      'Zamanla davam etdirə biləcəyiniz müntəzəm fiziki fəaliyyətlə məşğul olmaq',
      'Kifayət qədər müntəzəm yuxunu saxlamaq',
      'Dövrlərinizin və simptomlarınızın zamanla necə dəyişdiyini izləmək',
      'Çəki və ya simptomlardakı dəyişikliklərə görə özünüzü günahlandırmamaq',
    ],
    s9Body3:
      'Ehtiyaclarınıza görə tibb işçisi bəzi simptomlar üçün və ya hamiləlik planını dəstəkləmək üçün müalicələr də təklif edə bilər.',
    s9AlertTitle: 'Özünüzü müalicə etməyin',
    s9AlertText:
      'Hormonal müalicələr, metabolik dərmanlar və qida əlavələri hamısı tibb işçisi ilə müzakirə edilməlidir.',
    s10Heading: 'PKOS barədə geniş yayılmış yanlış təsəvvürlər',
    s10Myths: [
      'PKOS həmişə “kistaların” olması deməkdir: ad yanıldıcı ola bilər. Diaqnoz yalnız kistaların olmasına əsaslanmır.',
      'PKOS olan bütün qadınların artıq çəkisi var: PKOS bütün bədən quruluşlu qadınlara təsir edə bilər.',
      'PKOS həmişə hamiləliyə mane olur: ovulyasiya qeyri-müntəzəm ola bilər, lakin hamiləlik hələ də mümkündür.',
      'Tək bir simptom PKOS diaqnozu qoymaq üçün kifayətdir: diaqnoz hərtərəfli qiymətləndirmə tələb edir.',
      'PKOS yaşla sadəcə keçib gedir: onun təzahürü ömür boyu dəyişə bilər, lakin davamlı müşahidə vacib qalır.',
    ],
    s11Heading: 'Nə vaxt həkimə müraciət etmək lazımdır',
    s11Body1:
      'Tibbi məsləhət xüsusilə dövrlər çox qeyri-müntəzəm olduqda, bir neçə ay kəsildikdə və ya qeyri-adi simptomlar göründükdə dəyərlidir.',
    s11ConsultItems: [
      'Çox qeyri-müntəzəm və ya olmayan dövrlər',
      'Qeyri-adi sızanaq və ya tük artımı',
      'Əhəmiyyətli saç tökülməsi',
      'Hamilə qalmaqda çətinlik',
      'Sürətlə dəyişən simptomlar',
    ],
    s12Heading: 'Əsas nəticələr',
    s12SummaryTitle: 'Əsas məqamlar',
    s12SummaryItems: [
      'PKOS geniş yayılmış hormonal vəziyyətdir.',
      'O, bir çox müxtəlif şəkildə təzahür edə bilər.',
      'PKOS olan bütün qadınlarda eyni simptomlar olmur.',
      'Yalnız çəki PKOS-u diaqnoz etmək və ya istisna etmək üçün kifayət deyil.',
      'Diaqnoz hərtərəfli tibbi qiymətləndirmə tələb edir.',
      'PKOS ovulyasiyaya və bəzən münbitliyə təsir edə bilər.',
      'Fərdiləşdirilmiş qayğı yanaşması hər qadının ehtiyaclarını ödəməyə kömək edir.',
    ],
    finalNoteTitle: 'Daha yaxşı anlamaq üçün bələdçi',
    finalNoteText:
      'Bu məqalə ümumi məlumat üçündür və tibbi konsultasiyanı əvəz etmir. Hər vəziyyət fərqlidir: şübhə olarsa və ya simptomlar davam edərsə, tibb işçisindən məsləhət alın.',
    shareMessage: 'PKOS-u anlamaq — AWA',
  },
  ka: {
    badge: 'PCOS • არსებითი გზამკვლევი',
    title: 'PCOS-ის\nგაგება',
    metaDuration: '10 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'საგანმანათლებლო შინაარსი',
    intro:
      'პოლიკისტოზური საკვერცხეების სინდრომი, რომელსაც ხშირად PCOS ეწოდება, გავრცელებული ჰორმონული მდგომარეობაა, რომელმაც შეიძლება თქვენს ციკლებზე, ოვულაციაზე, კანზე, თმაზე, მეტაბოლიზმსა და ზოგჯერ ფერტილობაზე იმოქმედოს.',
    introSecondary:
      'მისი გამოვლინება ქალიდან ქალამდე ძლიერ განსხვავდება. PCOS-ის გაგება ძირითადად გეხმარებათ მისი სიმპტომების ამოცნობაში, იმის ცოდნაში, როდის უნდა მოიძიოთ სამედიცინო რჩევა და მისი განვითარების კონტროლში საკუთარი თავის დადანაშაულების გარეშე.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის PCOS?',
      'რატომ ჩნდება PCOS?',
      'ძირითადი ნიშნები',
      'როგორ სვამენ დიაგნოზს?',
      'PCOS და ოვულაცია',
      'PCOS და ფერტილობა',
      'PCOS და წონა / მეტაბოლიზმი',
      'კანი, თმა და სხეულის თმა',
      'როგორ იმართება PCOS?',
      'გავრცელებული მცდარი წარმოდგენები',
      'როდის მივმართოთ ექიმს',
      'მთავარი დასკვნები',
    ],
    s1Heading: 'რა არის PCOS?',
    s1Body1:
      'პოლიკისტოზური საკვერცხეების სინდრომი (PCOS) გავრცელებული ჰორმონული მდგომარეობაა, რომელსაც შეუძლია საკვერცხეების ჩვეული ფუნქციონირებისა და გარკვეული ჰორმონების ბალანსის შეცვლა.',
    s1Body2:
      'ზოგი ქალისთვის მთავარი პრობლემა არარეგულარული ოვულაციაა. სხვებისთვის პირველ რიგში აკნე, თმის ჭარბი ზრდა, თმის ცვენა ან მეტაბოლური ნიშნები გამოირჩევა.',
    s1TipTitle: 'კარგია ვიცოდეთ',
    s1TipText:
      'სახელის მიუხედავად, PCOS აუცილებლად არ ნიშნავს, რომ საკვერცხეები „ცისტებს“ შეიცავს. ისტორიული ტერმინი შეიძლება შემცდარი იყოს და დიაგნოზის დასასმელად მხოლოდ ულტრაბგერა საკმარისი არ არის.',
    s2Heading: 'რატომ ჩნდება PCOS?',
    s2Body1:
      'PCOS-ის ერთი მიზეზი არ არსებობს. როგორც ჩანს, ის რამდენიმე ფაქტორის შედეგია, რომლებიც შეიძლება გაერთიანდეს: ოჯახური მიდრეკილება, ჰორმონული ფუნქციონირება, ოვულაცია, მეტაბოლიზმი და ინდივიდუალური ფაქტორები.',
    s2Factors: [
      'ოჯახური მიდრეკილება და გენეტიკური ფაქტორები',
      'ოვულაციის დარღვევები',
      'ანდროგენების შეფარდებითი სიჭარბე',
      'ინსულინრეზისტენტობა ზოგ ქალში',
      'მეტაბოლური და გარემო ფაქტორები',
    ],
    s2NeutralText:
      'PCOS პირადი ხარვეზი არ არის. ის უბრალოდ ნებისყოფის ნაკლებობის, ცუდი კვების ან არასაკმარისი ფიზიკური აქტივობის შედეგი არ არის.',
    s3Heading: 'ძირითადი ნიშნები',
    s3Body1:
      'PCOS ქალიდან ქალამდე ძალიან განსხვავებულად შეიძლება გამოვლინდეს. ზოგს რამდენიმე სიმპტომი აქვს, ზოგი კი ძალიან ცოტას ამჩნევს.',
    s3Signs: [
      'არარეგულარული, ძლიერ დაშორებული ან ზოგჯერ არარსებული ციკლები',
      'არარეგულარული ან რთულად პროგნოზირებადი ოვულაცია',
      'გაგრძელებული აკნე, განსაკუთრებით სახის ქვედა ნაწილში',
      'თმის გაზრდილი ზრდა სახეზე, მკერდზე ან სხეულზე',
      'ჰორმონული ტიპის თმის ცვენა',
      'წონის მატება ან წონის დაკლების სირთულე',
      'ჩასახვის სირთულე',
    ],
    s3AlertTitle: 'მნიშვნელოვანია',
    s3AlertText:
      'ამ სიმპტომებიდან ერთის ქონა ავტომატურად არ ნიშნავს, რომ PCOS გაქვთ. რამდენიმე სხვა მდგომარეობასაც შეუძლია მსგავსი სიმპტომების გამოწვევა.',
    s4Heading: 'როგორ სვამენ დიაგნოზს?',
    s4Body1:
      'PCOS-ის დიაგნოსტიკა სამედიცინო პროცესია. ჯანდაცვის სპეციალისტი, როგორც წესი, იწყებს თქვენი ციკლების, სიმპტომების, სამედიცინო ისტორიისა და მიღებული მკურნალობის განხილვით.',
    s4Body2:
      'სიტუაციის მიხედვით, ასევე შეიძლება შემოგთავაზონ ჰორმონული სისხლის ანალიზები და ულტრაბგერა.',
    s4Points: [
      'არარეგულარული ციკლები ან იშვიათი ოვულაცია',
      'ანდროგენების სიჭარბის ნიშნები: აკნე, თმის ჭარბი ზრდა, თმის ცვენა ან სისხლის ანალიზის შედეგები',
      'საკვერცხეების იერსახე, რომელიც ულტრაბგერაზე PCOS-თან შესაბამისია, როცა ეს გამოკვლევა ნაჩვენებია',
    ],
    s4Body3:
      'ექიმმა ასევე უნდა გამორიცხოს არარეგულარული ციკლების ან ანდროგენების სიჭარბის სხვა შესაძლო მიზეზები, PCOS-ის დიაგნოზის დადასტურებამდე.',
    s5Heading: 'PCOS და ოვულაცია',
    s5Body1:
      'ოვულაცია საკვერცხიდან კვერცხუჯრედის (ოოციტის) გამოთავისუფლებაა. PCOS-ის დროს ოვულაცია უფრო იშვიათი ან რთულად პროგნოზირებადი შეიძლება იყოს.',
    s5Body2:
      'ეს შეიძლება ხსნიდეს, რატომ არის ციკლები ზოგჯერ ხანგრძლივი, არარეგულარული ან წინასწარ რთულად განჭვრეტადი.',
    s5HighlightTitle: 'თქვენი ციკლის კონტროლი',
    s5HighlightText:
      'თქვენი მენსტრუაციის თარიღების, სიმპტომებისა და ოვულაციის ნებისმიერი ნიშნის აღრიცხვამ შეიძლება დაგეხმაროთ საკუთარი კანონზომიერებების უკეთ გაგებაში.',
    s6Heading: 'PCOS და ფერტილობა',
    s6Body1:
      'რადგან ოვულაცია შეიძლება არარეგულარული იყოს, PCOS-ის მქონე ზოგ ქალს ჩასახვა უფრო გაუძნელდეს.',
    s6Body2:
      'ეს, თუმცა, არ ნიშნავს, რომ PCOS ავტომატურად ორსულობას უშლის ხელს. PCOS-ის მქონე ბევრი ქალი ბუნებრივად ან სათანადო სამედიცინო მხარდაჭერით ორსულდება.',
    s6TipTitle: 'გაითვალისწინეთ',
    s6TipText:
      'ჩასახვის სირთულე არ ნიშნავს, რომ ეს შეუძლებელია. თუ ორსულობა გსურთ, ექიმს ან ბებიაქალს შეუძლია თქვენს სიტუაციაზე მორგებული სტრატეგია შემოგთავაზოთ.',
    s7Heading: 'PCOS და წონა / მეტაბოლიზმი',
    s7Body1:
      'PCOS შეიძლება მეტაბოლურ ცვლილებებს უკავშირდებოდეს, მათ შორის ინსულინრეზისტენტობას ზოგ ქალში.',
    s7Body2:
      'თუმცა მხოლოდ წონით PCOS-ის დიაგნოზის დასმა ან გამორიცხვა შეუძლებელია. გამხდარ ქალს შეიძლება PCOS ჰქონდეს, ისევე როგორც ჭარბი წონის მქონე ქალს შეიძლება არ ჰქონდეს.',
    s7NeutralText:
      'მეთვალყურეობამ უნდა გაითვალისწინოს საერთო ჯანმრთელობა და არა მხოლოდ სასწორის რიცხვი.',
    s8Heading: 'კანი, თმა და სხეულის თმა',
    s8Body1:
      'ანდროგენების შეფარდებით სიჭარბეს შეუძლია ცხიმოვან ჯირკვლებსა და თმის ფოლიკულებზე იმოქმედოს.',
    s8Body2:
      'ქალის მიხედვით, ეს შეიძლება გამოვლინდეს როგორც გაგრძელებული აკნე, თმის გაზრდილი ზრდა ან თმის ცვენა.',
    s8Items: [
      'ჰორმონული აკნე',
      'სახის ან სხეულის თმის გაზრდილი ზრდა',
      'თმის გათხელება ან თმის ცვენა',
    ],
    s9Heading: 'როგორ იმართება PCOS?',
    s9Body1:
      'PCOS-ის მართვის ერთი მიდგომა, რომელიც ყველა ქალს ერგება, არ არსებობს. არჩევანი დამოკიდებულია სიმპტომებზე, მიზნებსა და სამედიცინო გარემოებებზე.',
    s9Body2:
      'მიზანი შეიძლება განსხვავდებოდეს ცხოვრების ეტაპის მიხედვით: ციკლების რეგულირება, გარკვეული სიმპტომების გაუმჯობესება, მეტაბოლური ჯანმრთელობის დაცვა ან ორსულობის გეგმის მხარდაჭერა.',
    s9MiniTitle: 'ჯანმრთელობის მხარდამჭერი ჩვევები',
    s9Lifestyle: [
      'მრავალფეროვანი, რეგულარული კვება, თქვენს საჭიროებებზე მორგებული',
      'რეგულარული ფიზიკური აქტივობა, რომელსაც დროთა განმავლობაში შეინარჩუნებთ',
      'საკმარისად რეგულარული ძილის შენარჩუნება',
      'თქვენი ციკლებისა და სიმპტომების ცვლილების კონტროლი დროთა განმავლობაში',
      'წონის ან სიმპტომების ცვლილებებისთვის საკუთარი თავის არდადანაშაულება',
    ],
    s9Body3:
      'თქვენი საჭიროებების მიხედვით, ჯანდაცვის სპეციალისტმა შეიძლება ასევე შემოგთავაზოთ მკურნალობა გარკვეული სიმპტომებისთვის ან ორსულობის გეგმის მხარდასაჭერად.',
    s9AlertTitle: 'თვითმკურნალობის გარეშე',
    s9AlertText:
      'ჰორმონული მკურნალობა, მეტაბოლური მედიკამენტები და საკვები დანამატები ყველა ჯანდაცვის სპეციალისტთან უნდა განიხილოთ.',
    s10Heading: 'გავრცელებული მცდარი წარმოდგენები PCOS-ის შესახებ',
    s10Myths: [
      'PCOS ყოველთვის „ცისტების“ ქონას ნიშნავს: სახელი შეიძლება შემცდარი იყოს. დიაგნოზი მხოლოდ ცისტების არსებობაზე არ არის დაფუძნებული.',
      'PCOS-ის მქონე ყველა ქალს ჭარბი წონა აქვს: PCOS ყველა აღნაგობის ქალს შეიძლება შეეხოს.',
      'PCOS ყოველთვის ორსულობას უშლის ხელს: ოვულაცია შეიძლება არარეგულარული იყოს, მაგრამ ორსულობა მაინც შესაძლებელია.',
      'ერთი სიმპტომი PCOS-ის დიაგნოსტიკისთვის საკმარისია: დიაგნოზი ყოვლისმომცველ შეფასებას მოითხოვს.',
      'PCOS ასაკთან ერთად უბრალოდ გადის: მისი გამოვლინება მთელი ცხოვრების განმავლობაში შეიძლება შეიცვალოს, მაგრამ მუდმივი მეთვალყურეობა მნიშვნელოვანი რჩება.',
    ],
    s11Heading: 'როდის მივმართოთ ექიმს',
    s11Body1:
      'სამედიცინო რჩევა განსაკუთრებით ღირს, როცა ციკლები ძალიან არარეგულარული ხდება, რამდენიმე თვით წყდება ან უჩვეულო სიმპტომები ჩნდება.',
    s11ConsultItems: [
      'ძალიან არარეგულარული ან არარსებული ციკლები',
      'უჩვეულო აკნე ან თმის ზრდა',
      'თმის მნიშვნელოვანი ცვენა',
      'ჩასახვის სირთულე',
      'სწრაფად ცვალებადი სიმპტომები',
    ],
    s12Heading: 'მთავარი დასკვნები',
    s12SummaryTitle: 'ძირითადი საკითხები',
    s12SummaryItems: [
      'PCOS გავრცელებული ჰორმონული მდგომარეობაა.',
      'ის ბევრი განსხვავებული გზით შეიძლება გამოვლინდეს.',
      'PCOS-ის მქონე ყველა ქალს ერთნაირი სიმპტომები არ აქვს.',
      'მხოლოდ წონა PCOS-ის დიაგნოზის დასასმელად ან გამოსარიცხად საკმარისი არ არის.',
      'დიაგნოზი ყოვლისმომცველ სამედიცინო შეფასებას მოითხოვს.',
      'PCOS-მა შეიძლება ოვულაციაზე და ზოგჯერ ფერტილობაზე იმოქმედოს.',
      'პერსონალიზებული მიდგომა თითოეული ქალის საჭიროებების დაკმაყოფილებაში გვეხმარება.',
    ],
    finalNoteTitle: 'გზამკვლევი უკეთ გასაგებად',
    finalNoteText:
      'ეს სტატია ზოგადი ინფორმაციისთვისაა განკუთვნილი და სამედიცინო კონსულტაციას არ ანაცვლებს. ყოველი სიტუაცია განსხვავებულია: ეჭვის შემთხვევაში ან თუ სიმპტომები რჩება, მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'PCOS-ის გაგება — AWA',
  },
  hy: {
    badge: 'PCOS • ԷԱԿԱՆ ՈՒՂԵՑՈՒՅՑ',
    title: 'Հասկանալ\nPCOS-ը',
    metaDuration: '10 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Կրթական բովանդակություն',
    intro:
      'Պոլիցիստոզ ձվարանների համախտանիշը, որը հաճախ կոչվում է PCOS, տարածված հորմոնալ վիճակ է, որը կարող է ազդել ձեր ցիկլերի, ձվազատման, մաշկի, մազերի, նյութափոխանակության և երբեմն պտղաբերության վրա:',
    introSecondary:
      'Դրա դրսևորումը խիստ տարբերվում է կնոջից կին: PCOS-ը հասկանալը հիմնականում օգնում է ճանաչել դրա ախտանիշները, իմանալ, երբ պետք է բժշկական խորհուրդ փնտրել, և հետևել դրա զարգացմանը՝ առանց ինքնամեղադրանքի:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է PCOS-ը',
      'Ինչու է առաջանում PCOS-ը',
      'Հիմնական նշանները',
      'Ինչպե՞ս է ախտորոշվում',
      'PCOS և ձվազատում',
      'PCOS և պտղաբերություն',
      'PCOS և քաշ / նյութափոխանակություն',
      'Մաշկ, մազեր և մարմնի մազածածկույթ',
      'Ինչպե՞ս է կառավարվում PCOS-ը',
      'Տարածված թյուր պատկերացումներ',
      'Երբ դիմել բժշկի',
      'Հիմնական եզրակացություններ',
    ],
    s1Heading: 'Ի՞նչ է PCOS-ը',
    s1Body1:
      'Պոլիցիստոզ ձվարանների համախտանիշը (PCOS) տարածված հորմոնալ վիճակ է, որը կարող է փոխել ձվարանների սովորական գործառույթը և որոշ հորմոնների հավասարակշռությունը:',
    s1Body2:
      'Որոշ կանանց համար հիմնական խնդիրը անկանոն ձվազատումն է: Մյուսների համար առաջինը աչքի են ընկնում ակնեն, մազերի չափից ավելի աճը, մազաթափությունը կամ նյութափոխանակային նշանները:',
    s1TipTitle: 'Լավ է իմանալ',
    s1TipText:
      'Չնայած իր անվանը՝ PCOS-ը պարտադիր չէ նշանակի, որ ձվարանները «կիստաներ» են պարունակում: Պատմական տերմինը կարող է մոլորեցնող լինել, և միայն ուլտրաձայնային հետազոտությունը բավարար չէ ախտորոշման համար:',
    s2Heading: 'Ինչու է առաջանում PCOS-ը',
    s2Body1:
      'PCOS-ի մեկ պատճառ չկա: Կարծես այն բխում է մի քանի գործոններից, որոնք կարող են համադրվել. ընտանեկան նախատրամադրվածություն, հորմոնալ գործառույթ, ձվազատում, նյութափոխանակություն և անհատական գործոններ:',
    s2Factors: [
      'Ընտանեկան նախատրամադրվածություն և գենետիկ գործոններ',
      'Ձվազատման խանգարումներ',
      'Անդրոգենների հարաբերական ավելցուկ',
      'Ինսուլինակայունություն որոշ կանանց մոտ',
      'Նյութափոխանակային և շրջակա միջավայրի գործոններ',
    ],
    s2NeutralText:
      'PCOS-ը անձնական ձախողում չէ: Այն պարզապես չի բխում կամքի պակասից, վատ սննդակարգից կամ անբավարար ֆիզիկական ակտիվությունից:',
    s3Heading: 'Հիմնական նշանները',
    s3Body1:
      'PCOS-ը կարող է խիստ տարբեր կերպ դրսևորվել կնոջից կին: Ոմանք ունեն մի քանի ախտանիշ, իսկ մյուսները նկատում են շատ քիչ:',
    s3Signs: [
      'Անկանոն, հեռու իրարից կամ երբեմն բացակայող ցիկլեր',
      'Անկանոն կամ դժվար կանխատեսելի ձվազատում',
      'Շարունակական ակնե, մասնավորապես դեմքի ստորին հատվածում',
      'Դեմքի, կրծքավանդակի կամ մարմնի մազերի ավելի մեծ աճ',
      'Հորմոնալ բնույթի մազաթափություն',
      'Քաշի ավելացում կամ քաշ կորցնելու դժվարություն',
      'Հղիանալու դժվարություն',
    ],
    s3AlertTitle: 'Կարևոր է',
    s3AlertText:
      'Այս ախտանիշներից մեկն ունենալը ինքնաբերաբար չի նշանակում, որ ունեք PCOS: Մի քանի այլ վիճակներ կարող են առաջացնել նման ախտանիշներ:',
    s4Heading: 'Ինչպե՞ս է ախտորոշվում',
    s4Body1:
      'PCOS-ի ախտորոշումը բժշկական գործընթաց է: Առողջապահության մասնագետը սովորաբար սկսում է ձեր ցիկլերի, ախտանիշների, բժշկական պատմության և ձեր ընդունած բուժումների քննարկմամբ:',
    s4Body2:
      'Կախված իրավիճակից՝ կարող են առաջարկվել նաև հորմոնալ արյան անալիզներ և ուլտրաձայնային հետազոտություն:',
    s4Points: [
      'Անկանոն ցիկլեր կամ հազվադեպ ձվազատում',
      'Անդրոգենների ավելցուկի նշաններ. ակնե, մազերի չափից ավելի աճ, մազաթափություն կամ արյան անալիզի արդյունքներ',
      'Ձվարանների տեսք՝ PCOS-ին համահունչ ուլտրաձայնային հետազոտության ժամանակ, երբ այս հետազոտությունը նշված է',
    ],
    s4Body3:
      'Բժիշկը նաև պետք է բացառի անկանոն ցիկլերի կամ անդրոգենների ավելցուկի այլ հնարավոր պատճառները՝ նախքան PCOS-ի ախտորոշումը հաստատելը:',
    s5Heading: 'PCOS և ձվազատում',
    s5Body1:
      'Ձվազատումը ձվաբջջի (օոցիտի) ազատումն է ձվարանից: PCOS-ի դեպքում ձվազատումը կարող է ավելի հազվադեպ կամ դժվար կանխատեսելի լինել:',
    s5Body2:
      'Սա կարող է բացատրել, թե ինչու են ցիկլերը երբեմն երկար, անկանոն կամ դժվար կանխատեսելի:',
    s5HighlightTitle: 'Հետևել ձեր ցիկլին',
    s5HighlightText:
      'Ձեր դաշտանի ամսաթվերը, ախտանիշները և ձվազատման ցանկացած նշան գրանցելը կարող է օգնել ավելի լավ հասկանալ ձեր սեփական օրինաչափությունները:',
    s6Heading: 'PCOS և պտղաբերություն',
    s6Body1:
      'Քանի որ ձվազատումը կարող է անկանոն լինել, PCOS ունեցող որոշ կանայք կարող են ավելի շատ դժվարություններ ունենալ հղիանալու հարցում:',
    s6Body2:
      'Սա, սակայն, չի նշանակում, որ PCOS-ը ինքնաբերաբար արգելում է հղիությունը: PCOS ունեցող շատ կանայք հղիանում են բնականորեն կամ պատշաճ բժշկական աջակցությամբ:',
    s6TipTitle: 'Հիշեք',
    s6TipText:
      'Հղիանալու դժվարությունը չի նշանակում, որ դա անհնար է: Եթե հույս ունեք հղիանալ, բժիշկը կամ մանկաբարձուհին կարող է առաջարկել ձեր իրավիճակին համապատասխան ռազմավարություն:',
    s7Heading: 'PCOS և քաշ / նյութափոխանակություն',
    s7Body1:
      'PCOS-ը կարող է կապված լինել նյութափոխանակային փոփոխությունների հետ, այդ թվում՝ ինսուլինակայունության հետ որոշ կանանց մոտ:',
    s7Body2:
      'Այդուհանդերձ, միայն քաշը չի կարող ախտորոշել կամ բացառել PCOS-ը: Նիհար կինը կարող է ունենալ PCOS, ինչպես որ ավելորդ քաշ ունեցող կինը կարող է չունենալ այն:',
    s7NeutralText:
      'Հետագա խնամքը պետք է հաշվի առնի ընդհանուր առողջությունը, այլ ոչ միայն կշեռքի թիվը:',
    s8Heading: 'Մաշկ, մազեր և մարմնի մազածածկույթ',
    s8Body1:
      'Անդրոգենների հարաբերական ավելցուկը կարող է ազդել ճարպագեղձերի և մազարմատների վրա:',
    s8Body2:
      'Կախված կնոջից՝ սա կարող է դրսևորվել որպես շարունակական ակնե, մազերի ավելի մեծ աճ կամ մազաթափություն:',
    s8Items: [
      'Հորմոնալ ակնե',
      'Դեմքի կամ մարմնի մազերի ավելացում',
      'Մազերի նոսրացում կամ մազաթափություն',
    ],
    s9Heading: 'Ինչպե՞ս է կառավարվում PCOS-ը',
    s9Body1:
      'PCOS-ի կառավարման մեկ մոտեցում չկա, որը աշխատում է յուրաքանչյուր կնոջ համար: Ընտրությունը կախված է ախտանիշներից, նպատակներից և բժշկական հանգամանքներից:',
    s9Body2:
      'Նպատակը կարող է տարբերվել՝ կախված կյանքի փուլից. ցիկլերի կարգավորում, որոշ ախտանիշների բարելավում, նյութափոխանակային առողջության պաշտպանություն կամ հղիության ծրագրի աջակցում:',
    s9MiniTitle: 'Առողջությանն աջակցող սովորություններ',
    s9Lifestyle: [
      'Բազմազան, կանոնավոր սննդակարգ՝ ձեր կարիքներին համապատասխան',
      'Կանոնավոր ֆիզիկական ակտիվություն, որը կարող եք պահպանել ժամանակի ընթացքում',
      'Բավարար կանոնավոր քնի պահպանում',
      'Ձեր ցիկլերի և ախտանիշների փոփոխությանը հետևել ժամանակի ընթացքում',
      'Ինքներդ ձեզ չմեղադրել քաշի կամ ախտանիշների փոփոխությունների համար',
    ],
    s9Body3:
      'Կախված ձեր կարիքներից՝ առողջապահության մասնագետը կարող է նաև առաջարկել բուժումներ որոշ ախտանիշների համար կամ հղիության ծրագրին աջակցելու համար:',
    s9AlertTitle: 'Ինքնաբուժում չանել',
    s9AlertText:
      'Հորմոնալ բուժումները, նյութափոխանակային դեղամիջոցները և սննդային հավելումները պետք է քննարկվեն առողջապահության մասնագետի հետ:',
    s10Heading: 'Տարածված թյուր պատկերացումներ PCOS-ի մասին',
    s10Myths: [
      'PCOS-ը միշտ նշանակում է «կիստաներ» ունենալ. անվանումը կարող է մոլորեցնող լինել: Ախտորոշումը չի հիմնվում միայն կիստաների առկայության վրա:',
      'PCOS ունեցող բոլոր կանայք ավելորդ քաշ ունեն. PCOS-ը կարող է ազդել բոլոր կազմվածքի կանանց վրա:',
      'PCOS-ը միշտ արգելում է հղիությունը. ձվազատումը կարող է անկանոն լինել, սակայն հղիությունը դեռ հնարավոր է:',
      'Մեկ ախտանիշը բավական է PCOS-ը ախտորոշելու համար. ախտորոշումը պահանջում է համապարփակ գնահատում:',
      'PCOS-ը պարզապես անցնում է տարիքի հետ. դրա դրսևորումը կարող է փոխվել կյանքի ընթացքում, սակայն շարունակական հսկողությունը մնում է կարևոր:',
    ],
    s11Heading: 'Երբ դիմել բժշկի',
    s11Body1:
      'Բժշկական խորհրդատվությունը հատկապես արժեքավոր է, երբ ցիկլերը դառնում են շատ անկանոն, դադարում են մի քանի ամիս կամ երբ հայտնվում են անսովոր ախտանիշներ:',
    s11ConsultItems: [
      'Շատ անկանոն կամ բացակայող ցիկլեր',
      'Անսովոր ակնե կամ մազերի աճ',
      'Զգալի մազաթափություն',
      'Հղիանալու դժվարություն',
      'Արագ փոփոխվող ախտանիշներ',
    ],
    s12Heading: 'Հիմնական եզրակացություններ',
    s12SummaryTitle: 'Էական կետերը',
    s12SummaryItems: [
      'PCOS-ը տարածված հորմոնալ վիճակ է:',
      'Այն կարող է դրսևորվել շատ տարբեր ձևերով:',
      'PCOS ունեցող բոլոր կանայք նույն ախտանիշները չունեն:',
      'Միայն քաշը բավարար չէ PCOS-ը ախտորոշելու կամ բացառելու համար:',
      'Ախտորոշումը պահանջում է համապարփակ բժշկական գնահատում:',
      'PCOS-ը կարող է ազդել ձվազատման և երբեմն պտղաբերության վրա:',
      'Անհատականացված խնամքի մոտեցումը օգնում է բավարարել յուրաքանչյուր կնոջ կարիքները:',
    ],
    finalNoteTitle: 'Ուղեցույց՝ ավելի լավ հասկանալու համար',
    finalNoteText:
      'Այս հոդվածը նախատեսված է ընդհանուր տեղեկատվության համար և չի փոխարինում բժշկական խորհրդատվությանը: Յուրաքանչյուր իրավիճակ տարբեր է. կասկածի դեպքում կամ եթե ախտանիշները շարունակվում են, խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Հասկանալ PCOS-ը — AWA',
  },
  tg: {
    badge: 'PCOS • РОҲНАМОИ АСОСӢ',
    title: 'Фаҳмидани\nPCOS',
    metaDuration: '10 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни таълимӣ',
    intro:
      'Синдроми тухмдонҳои поликистозӣ, ки аксар вақт PCOS номида мешавад, ҳолати маъмули гормонист, ки метавонад ба давраҳо, овуляция, пӯст, мӯй, мубодилаи моддаҳо ва баъзан ҳосилхезии шумо таъсир расонад.',
    introSecondary:
      'Тарзи зуҳури он аз зан ба зан хеле фарқ мекунад. Фаҳмидани PCOS асосан ба шумо кумак мекунад нишонаҳои онро бишносед, бидонед кай маслиҳати тиббӣ пурсидан лозим аст ва тағйироти онро бидуни худмазамматкунӣ пайгирӣ кунед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'PCOS чист?',
      'Чаро PCOS рух медиҳад?',
      'Нишонаҳои асосӣ',
      'Чӣ тавр ташхис карда мешавад?',
      'PCOS ва овуляция',
      'PCOS ва ҳосилхезӣ',
      'PCOS ва вазн / мубодилаи моддаҳо',
      'Пӯст, мӯй ва мӯйи бадан',
      'PCOS чӣ тавр идора карда мешавад?',
      'Тасаввуроти нодурусти маъмул',
      'Кай ба табиб муроҷиат кардан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    s1Heading: 'PCOS чист?',
    s1Body1:
      'Синдроми тухмдонҳои поликистозӣ (PCOS) ҳолати маъмули гормонист, ки метавонад кори муқаррарии тухмдонҳо ва тавозуни баъзе гормонҳоро тағйир диҳад.',
    s1Body2:
      'Барои баъзе занон мушкили асосӣ овуляцияи номунтазам аст. Барои дигарон аввал доначаҳои рӯй, рӯйиши аз ҳад зиёди мӯй, рехтани мӯй ё нишонаҳои мубодилавӣ ба назар мерасанд.',
    s1TipTitle: 'Донистан хуб аст',
    s1TipText:
      'Бо вуҷуди номи худ, PCOS ҳатман маънои доштани «кистаҳо»-ро дар тухмдонҳо надорад. Истилоҳи таърихӣ метавонад гумроҳкунанда бошад ва ултрасадо танҳо барои ташхис кифоя нест.',
    s2Heading: 'Чаро PCOS рух медиҳад?',
    s2Body1:
      'PCOS як сабаби ягона надорад. Ба назар мерасад, ки он натиҷаи якчанд омил аст, ки метавонанд якҷоя шаванд: майли оилавӣ, фаъолияти гормонӣ, овуляция, мубодилаи моддаҳо ва омилҳои инфиродӣ.',
    s2Factors: [
      'Майли оилавӣ ва омилҳои генетикӣ',
      'Вайроншавии овуляция',
      'Зиёдии нисбии андрогенҳо',
      'Муқовимати инсулин дар баъзе занон',
      'Омилҳои мубодилавӣ ва муҳитӣ',
    ],
    s2NeutralText:
      'PCOS камбудии шахсӣ нест. Он танҳо натиҷаи камии ирода, ғизои бад ё фаъолияти ҷисмонии нокофӣ нест.',
    s3Heading: 'Нишонаҳои асосӣ',
    s3Body1:
      'PCOS метавонад аз зан ба зан хеле гуногун зоҳир шавад. Баъзеҳо якчанд нишона доранд, дар ҳоле ки дигарон хеле кам мушоҳида мекунанд.',
    s3Signs: [
      'Давраҳои номунтазам, хеле дурфосила ё баъзан ғоиб',
      'Овуляцияи номунтазам ё душвор барои пешгӯӣ',
      'Доначаҳои доимии рӯй, хусусан дар қисми поёни рӯй',
      'Афзоиши мӯй дар рӯй, сина ё бадан',
      'Рехтани мӯй бо намунаи гормонӣ',
      'Афзудани вазн ё душвории кам кардани вазн',
      'Душворӣ дар ҳомиладор шудан',
    ],
    s3AlertTitle: 'Муҳим',
    s3AlertText:
      'Доштани яке аз ин нишонаҳо худкор маънои доштани PCOS-ро надорад. Якчанд ҳолати дигар метавонанд нишонаҳои монанд ба вуҷуд оранд.',
    s4Heading: 'Чӣ тавр ташхис карда мешавад?',
    s4Body1:
      'Ташхиси PCOS раванди тиббист. Мутахассиси соҳаи тиб одатан бо муҳокимаи давраҳо, нишонаҳо, таърихи тиббӣ ва ҳар табобате, ки қабул мекунед, оғоз мекунад.',
    s4Body2:
      'Вобаста ба вазъият, санҷишҳои гормонии хун ва ултрасадо низ метавонанд пешниҳод шаванд.',
    s4Points: [
      'Давраҳои номунтазам ё овуляцияи нодир',
      'Нишонаҳои зиёдии андрогенҳо: доначаҳои рӯй, рӯйиши аз ҳад зиёди мӯй, рехтани мӯй ё натиҷаҳои санҷиши хун',
      'Намуди тухмдонҳо мувофиқ ба PCOS дар ултрасадо, вақте ки ин муоина нишон дода шудааст',
    ],
    s4Body3:
      'Табиб инчунин бояд пеш аз тасдиқи ташхиси PCOS сабабҳои имконпазири дигари давраҳои номунтазам ё зиёдии андрогенҳоро истисно кунад.',
    s5Heading: 'PCOS ва овуляция',
    s5Body1:
      'Овуляция озод шудани тухмсел (ооцит) аз тухмдон аст. Дар PCOS овуляция метавонад камтар зуд-зуд ё душвортар барои пешгӯӣ бошад.',
    s5Body2:
      'Ин метавонад шарҳ диҳад, ки чаро давраҳо баъзан дароз, номунтазам ё душвор барои пешбинӣ мебошанд.',
    s5HighlightTitle: 'Пайгирии давраи шумо',
    s5HighlightText:
      'Сабт кардани санаҳои ҳайз, нишонаҳо ва ҳар нишонаи овуляция метавонад ба шумо кумак кунад намунаҳои худро беҳтар бифаҳмед.',
    s6Heading: 'PCOS ва ҳосилхезӣ',
    s6Body1:
      'Азбаски овуляция метавонад номунтазам бошад, баъзе занони дорои PCOS метавонанд дар ҳомиладор шудан душворӣ дошта бошанд.',
    s6Body2:
      'Бо вуҷуди ин, ин маънои онро надорад, ки PCOS худкор монеи ҳомиладорӣ мешавад. Бисёр занони дорои PCOS ба таври табиӣ ё бо дастгирии мувофиқи тиббӣ ҳомиладор мешаванд.',
    s6TipTitle: 'Дар хотир доред',
    s6TipText:
      'Душворӣ дар ҳомиладор шудан маънои ғайриимкон будани онро надорад. Агар ба ҳомиладор шудан умед доред, табиб ё доя метавонад стратегияи мувофиқ ба вазъияти шуморо пешниҳод кунад.',
    s7Heading: 'PCOS ва вазн / мубодилаи моддаҳо',
    s7Body1:
      'PCOS метавонад бо тағйироти мубодилавӣ, аз ҷумла муқовимати инсулин дар баъзе занон, алоқаманд бошад.',
    s7Body2:
      'Бо вуҷуди ин, вазн танҳо наметавонад PCOS-ро ташхис кунад ё истисно намояд. Зани борик метавонад PCOS дошта бошад, чуноне ки зани вазни зиёддошта метавонад надошта бошад.',
    s7NeutralText:
      'Нигоҳубини минбаъда бояд саломатии умумиро ба назар гирад, на танҳо рақами дар тарозу.',
    s8Heading: 'Пӯст, мӯй ва мӯйи бадан',
    s8Body1:
      'Зиёдии нисбии андрогенҳо метавонад ба ғадудҳои чарб ва фолликулҳои мӯй таъсир расонад.',
    s8Body2:
      'Вобаста ба зан, ин метавонад ҳамчун доначаҳои доимии рӯй, афзоиши мӯй ё рехтани мӯй зоҳир шавад.',
    s8Items: [
      'Доначаҳои гормонӣ',
      'Афзоиши мӯйи рӯй ё бадан',
      'Борик шудан ё рехтани мӯй',
    ],
    s9Heading: 'PCOS чӣ тавр идора карда мешавад?',
    s9Body1:
      'Равиши ягонаи идораи PCOS, ки барои ҳар зан кор кунад, вуҷуд надорад. Интихоб ба нишонаҳо, ҳадафҳо ва шароити тиббӣ вобаста аст.',
    s9Body2:
      'Ҳадаф вобаста ба марҳилаи зиндагӣ метавонад гуногун бошад: танзими давраҳо, беҳтар кардани баъзе нишонаҳо, ҳифзи саломатии мубодилавӣ ё дастгирии нақшаи ҳомиладорӣ.',
    s9MiniTitle: 'Одатҳои дастгирикунандаи саломатӣ',
    s9Lifestyle: [
      'Ғизои гуногун ва мунтазами мувофиқ ба эҳтиёҷоти шумо',
      'Фаъолияти мунтазами ҷисмонӣ, ки бо мурури замон идома дода метавонед',
      'Нигоҳ доштани хоби ба қадри кофӣ мунтазам',
      'Пайгирии тағйирёбии давраҳо ва нишонаҳо бо мурури замон',
      'Худро барои тағйироти вазн ё нишонаҳо айбдор накардан',
    ],
    s9Body3:
      'Вобаста ба эҳтиёҷоти шумо, мутахассиси соҳаи тиб метавонад табобатҳо барои баъзе нишонаҳо ё барои дастгирии нақшаи ҳомиладорӣ низ пешниҳод кунад.',
    s9AlertTitle: 'Худтабобат накунед',
    s9AlertText:
      'Табобатҳои гормонӣ, доруҳои мубодилавӣ ва иловаҳои хӯрокӣ ҳама бояд бо мутахассиси соҳаи тиб муҳокима шаванд.',
    s10Heading: 'Тасаввуроти нодурусти маъмул дар бораи PCOS',
    s10Myths: [
      'PCOS ҳамеша маънои доштани «кистаҳо»-ро дорад: ном метавонад гумроҳкунанда бошад. Ташхис танҳо ба мавҷудияти кистаҳо такя намекунад.',
      'Ҳамаи занони дорои PCOS вазни зиёд доранд: PCOS метавонад занони ҳама намуди ҷусса фаро гирад.',
      'PCOS ҳамеша монеи ҳомиладорӣ мешавад: овуляция метавонад номунтазам бошад, вале ҳомиладорӣ ҳанӯз имконпазир аст.',
      'Як нишона барои ташхиси PCOS кифоя аст: ташхис арзёбии ҷомеъро талаб мекунад.',
      'PCOS бо синну сол танҳо нопадид мешавад: тарзи зуҳури он метавонад дар давоми умр тағйир ёбад, вале пайгирии доимӣ муҳим боқӣ мемонад.',
    ],
    s11Heading: 'Кай ба табиб муроҷиат кардан лозим аст',
    s11Body1:
      'Маслиҳати тиббӣ махсусан сазовор аст, вақте ки давраҳо хеле номунтазам мешаванд, чанд моҳ қатъ мешаванд ё нишонаҳои ғайриоддӣ пайдо мешаванд.',
    s11ConsultItems: [
      'Давраҳои хеле номунтазам ё ғоиб',
      'Доначаҳои рӯй ё афзоиши мӯйи ғайриоддӣ',
      'Рехтани мӯйи назаррас',
      'Душворӣ дар ҳомиладор шудан',
      'Нишонаҳое, ки зуд тағйир меёбанд',
    ],
    s12Heading: 'Хулосаҳои асосӣ',
    s12SummaryTitle: 'Нуктаҳои асосӣ',
    s12SummaryItems: [
      'PCOS ҳолати маъмули гормонист.',
      'Он метавонад бо роҳҳои гуногун зоҳир шавад.',
      'На ҳамаи занони дорои PCOS нишонаҳои якхела доранд.',
      'Вазн танҳо барои ташхис ё истисно кардани PCOS кифоя нест.',
      'Ташхис арзёбии ҷомеи тиббиро талаб мекунад.',
      'PCOS метавонад ба овуляция ва баъзан ба ҳосилхезӣ таъсир расонад.',
      'Равиши шахсии нигоҳубин ба қонеъ кардани эҳтиёҷоти ҳар зан кумак мекунад.',
    ],
    finalNoteTitle: 'Роҳнамо барои фаҳмиши беҳтар',
    finalNoteText:
      'Ин мақола барои иттилооти умумӣ пешбинӣ шудааст ва машварати тиббиро иваз намекунад. Ҳар вазъият гуногун аст: дар сурати шубҳа ё идомаи нишонаҳо аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    shareMessage: 'Фаҳмидани PCOS — AWA',
  },
  ky: {
    badge: 'PCOS • НЕГИЗГИ КОЛДОНМО',
    title: 'PCOS’ту\nтүшүнүү',
    metaDuration: '10 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Билим берүүчү мазмун',
    intro:
      'Поликистоздук жумурткалык синдрому, көбүнчө PCOS деп аталат, циклдериңизге, овуляцияңызга, териңизге, чачыңызга, зат алмашууңузга жана кээде бойго бүтүү жөндөмдүүлүгүнө таасир эте турган кеңири таралган гормондук абал.',
    introSecondary:
      'Анын көрүнүшү аялдан аялга абдан айырмаланат. PCOSту түшүнүү негизинен анын белгилерин таанууга, медициналык кеңешти качан сурап кайрылуу керектигин билүүгө жана өзүн күнөөлөбөстөн анын өнүгүшүн көзөмөлдөөгө жардам берет.',
    contentsTitle: 'Бул макалада',
    topics: [
      'PCOS деген эмне?',
      'PCOS эмне үчүн пайда болот?',
      'Негизги белгилер',
      'Ал кантип диагностикаланат?',
      'PCOS жана овуляция',
      'PCOS жана бойго бүтүү жөндөмдүүлүгү',
      'PCOS жана салмак / зат алмашуу',
      'Тери, чач жана денедеги түк',
      'PCOS кантип башкарылат?',
      'Кеңири таралган жаңылыш түшүнүктөр',
      'Дарыгерге качан барыш керек',
      'Негизги жыйынтыктар',
    ],
    s1Heading: 'PCOS деген эмне?',
    s1Body1:
      'Поликистоздук жумурткалык синдрому (PCOS) — жумурткалыктардын адаттагы иштешин жана айрым гормондордун тең салмактуулугун өзгөртө алган кеңири таралган гормондук абал.',
    s1Body2:
      'Айрым аялдар үчүн негизги көйгөй — туура эмес овуляция. Башкалар үчүн адегенде безеткилер, ашыкча түк өсүү, чачтын түшүшү же метаболизм белгилери көзгө урунат.',
    s1TipTitle: 'Билүү пайдалуу',
    s1TipText:
      'Аталышына карабастан, PCOS жумурткалыктарда сөзсүз «киста» бар дегенди билдирбейт. Тарыхый термин адаштырышы мүмкүн жана диагноз коюу үчүн УЗИнин өзү жетишсиз.',
    s2Heading: 'PCOS эмне үчүн пайда болот?',
    s2Body1:
      'PCOSтун бирден-бир себеби жок. Ал бириге ала турган бир нече факторлордон келип чыгат окшойт: тукум куучулук жакындык, гормондук иштөө, овуляция, зат алмашуу жана жеке факторлор.',
    s2Factors: [
      'Тукум куучулук жакындык жана генетикалык факторлор',
      'Овуляциядагы бузулуулар',
      'Андрогендердин салыштырмалуу ашыкчасы',
      'Айрым аялдарда инсулин каршылыгы',
      'Метаболизм жана айлана-чөйрө факторлору',
    ],
    s2NeutralText:
      'PCOS жеке жеңилүү эмес. Ал жөн эле эрк күчүнүн жетишсиздигинен, жаман тамактануудан же физикалык активдүүлүктүн жетишсиздигинен келип чыкпайт.',
    s3Heading: 'Негизги белгилер',
    s3Body1:
      'PCOS аялдан аялга абдан ар башка көрүнүшү мүмкүн. Айрымдарында бир нече белги бар, башкалары өтө аз байкайт.',
    s3Signs: [
      'Туура эмес, сейрек же кээде жок циклдер',
      'Туура эмес же болжолдоого кыйын овуляция',
      'Улана берген безеткилер, айрыкча беттин ылдый жагында',
      'Бетте, көкүрөктө же денеде түктүн көбөйүшү',
      'Гормондук мүнөздөгү чачтын түшүшү',
      'Салмак алуу же салмак жоготуудагы кыйынчылык',
      'Боюна бүтүүдөгү кыйынчылык',
    ],
    s3AlertTitle: 'Маанилүү',
    s3AlertText:
      'Бул белгилердин бири болушу автоматтык түрдө PCOS бар дегенди билдирбейт. Башка бир нече абал окшош белгилерди жаратышы мүмкүн.',
    s4Heading: 'Ал кантип диагностикаланат?',
    s4Body1:
      'PCOS диагностикасы — медициналык процесс. Ден соолук сактоо адиси адатта циклдериңизди, белгилериңизди, медициналык тарыхыңызды жана кабыл алып жаткан дарылоолоруңузду талкуулоодон баштайт.',
    s4Body2:
      'Абалга жараша гормондук кан анализдери жана УЗИ да сунушталышы мүмкүн.',
    s4Points: [
      'Туура эмес циклдер же сейрек овуляция',
      'Андроген ашыкчасынын белгилери: безеткилер, ашыкча түк өсүү, чачтын түшүшү же кан анализинин жыйынтыктары',
      'Бул текшерүү көрсөтүлгөндө УЗИде PCOSко шайкеш келген жумурткалык көрүнүшү',
    ],
    s4Body3:
      'Дарыгер ошондой эле PCOS диагнозун ырастоодон мурун туура эмес циклдердин же андроген ашыкчасынын башка мүмкүн болгон себептерин жокко чыгарышы керек.',
    s5Heading: 'PCOS жана овуляция',
    s5Body1:
      'Овуляция — жумурткалуу клетканын (ооцит) жумурткалыктан чыгышы. PCOSто овуляция сейрегирээк же болжолдоого кыйыныраак болушу мүмкүн.',
    s5Body2:
      'Бул циклдердин кээде узун, туура эмес же алдын ала билүүгө кыйын болушун түшүндүрө алат.',
    s5HighlightTitle: 'Циклиңизди көзөмөлдөө',
    s5HighlightText:
      'Етек кирим күндөрүн, белгилерди жана овуляциянын ар кандай белгилерин жазып туруу өз мыйзам ченемдүүлүгүңүздү жакшыраак түшүнүүгө жардам бериши мүмкүн.',
    s6Heading: 'PCOS жана бойго бүтүү жөндөмдүүлүгү',
    s6Body1:
      'Овуляция туура эмес болушу мүмкүн болгондуктан, PCOS бар айрым аялдарда боюна бүтүү кыйыныраак болушу мүмкүн.',
    s6Body2:
      'Бирок бул PCOS курсактуулукка автоматтык түрдө тоскоол болот дегенди билдирбейт. PCOS бар көптөгөн аялдар табигый түрдө же ылайыктуу медициналык колдоо менен боюна бүтөт.',
    s6TipTitle: 'Эстен чыгарбаңыз',
    s6TipText:
      'Боюна бүтүүдөгү кыйынчылык мүмкүн эмес дегенди билдирбейт. Курсактуулукту үмүттөнүп жатсаңыз, дарыгер же акушерка абалыңызга ылайыктуу стратегияны сунуштай алат.',
    s7Heading: 'PCOS жана салмак / зат алмашуу',
    s7Body1:
      'PCOS зат алмашуудагы өзгөрүүлөр менен, анын ичинде айрым аялдарда инсулин каршылыгы менен байланышкан болушу мүмкүн.',
    s7Body2:
      'Бирок салмактын өзү PCOS диагнозун койбойт же жокко чыгарбайт. Арык аялда да PCOS болушу мүмкүн, ашыкча салмактуу аялда болбошу мүмкүн.',
    s7NeutralText:
      'Кийинки көзөмөл таразадагы санга гана эмес, жалпы ден соолукка көңүл бурушу керек.',
    s8Heading: 'Тери, чач жана денедеги түк',
    s8Body1:
      'Андрогендердин салыштырмалуу ашыкчасы май бездерине жана чач фолликулдарына таасир этиши мүмкүн.',
    s8Body2:
      'Аялга жараша бул улана берген безеткилер, түктүн көбөйүшү же чачтын түшүшү катары көрүнүшү мүмкүн.',
    s8Items: [
      'Гормондук безеткилер',
      'Бетте же денеде түктүн көбөйүшү',
      'Чачтын сейректөөсү же түшүшү',
    ],
    s9Heading: 'PCOS кантип башкарылат?',
    s9Body1:
      'Ар бир аялга иштей турган PCOSту башкаруунун бирден-бир ыкмасы жок. Тандоо белгилерге, максаттарга жана медициналык шарттарга көз каранды.',
    s9Body2:
      'Максат жашоо этабына жараша айырмаланышы мүмкүн: циклдерди жөнгө салуу, айрым белгилерди жакшыртуу, метаболизм ден соолугун коргоо же курсактуулук планын колдоо.',
    s9MiniTitle: 'Ден соолукту колдогон адаттар',
    s9Lifestyle: [
      'Муктаждыгыңызга ылайыктуу ар түрдүү, үзгүлтүксүз тамактануу',
      'Убакыттын өтүшү менен сактай ала турган үзгүлтүксүз физикалык активдүүлүк',
      'Жетишерлик үзгүлтүксүз уйкуну сактоо',
      'Циклдериңиздин жана белгилериңиздин убакыттын өтүшү менен кантип өзгөрөрүн көзөмөлдөө',
      'Салмактын же белгилердин өзгөрүшү үчүн өзүңүздү күнөөлөбөө',
    ],
    s9Body3:
      'Муктаждыгыңызга жараша ден соолук сактоо адиси ошондой эле айрым белгилерге же курсактуулук планын колдоого арналган дарылоолорду сунуштай алат.',
    s9AlertTitle: 'Өз алдынча дарылабаңыз',
    s9AlertText:
      'Гормондук дарылоолорду, метаболизм дарыларын жана тамак-аш кошумчаларын ден соолук сактоо адиси менен талкуулоо керек.',
    s10Heading: 'PCOS жөнүндө кеңири таралган жаңылыш түшүнүктөр',
    s10Myths: [
      'PCOS ар дайым «киста» болушун билдирет: аталышы адаштырышы мүмкүн. Диагноз жалаң кисталардын болушуна таянбайт.',
      'PCOS бар бардык аялдар ашыкча салмактуу: PCOS ар кандай дене түзүлүшүндөгү аялдарга таасир этиши мүмкүн.',
      'PCOS ар дайым курсактуулукка тоскоол болот: овуляция туура эмес болушу мүмкүн, бирок курсактуулук дагы эле мүмкүн.',
      'Бир белги PCOS диагнозун коюуга жетиштүү: диагноз комплекстүү баа берүүнү талап кылат.',
      'PCOS жаш менен жөн эле кетет: анын көрүнүшү өмүр бою өзгөрүшү мүмкүн, бирок үзгүлтүксүз көзөмөл маанилүү бойдон калат.',
    ],
    s11Heading: 'Дарыгерге качан барыш керек',
    s11Body1:
      'Медициналык кеңеш циклдер абдан туура эмес болгондо, бир нече ай бою токтогондо же адаттан тыш белгилер пайда болгондо өзгөчө пайдалуу.',
    s11ConsultItems: [
      'Абдан туура эмес же жок циклдер',
      'Адаттан тыш безеткилер же түк өсүү',
      'Олуттуу чач түшүү',
      'Боюна бүтүүдөгү кыйынчылык',
      'Тез өзгөргөн белгилер',
    ],
    s12Heading: 'Негизги жыйынтыктар',
    s12SummaryTitle: 'Негизги учурлар',
    s12SummaryItems: [
      'PCOS — кеңири таралган гормондук абал.',
      'Ал көптөгөн ар кандай жолдор менен көрүнүшү мүмкүн.',
      'PCOS бар бардык аялдарда бирдей белгилер болбойт.',
      'Салмактын өзү PCOS диагнозун коюуга же жокко чыгарууга жетишсиз.',
      'Диагноз комплекстүү медициналык баа берүүнү талап кылат.',
      'PCOS овуляцияга жана кээде бойго бүтүү жөндөмдүүлүгүнө таасир этиши мүмкүн.',
      'Жекелештирилген кам көрүү ыкмасы ар бир аялдын муктаждыгын канааттандырууга жардам берет.',
    ],
    finalNoteTitle: 'Жакшыраак түшүнүүгө колдонмо',
    finalNoteText:
      'Бул макала жалпы маалымат үчүн арналган жана медициналык консультацияны алмаштырбайт. Ар бир абал ар башка: күмөн болсо же белгилер улана берсе, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'PCOSту түшүнүү — AWA',
  },
  tk: {
    badge: 'PCOS • ESASY GOLLANMA',
    title: 'PCOS-ny\ndüşünmek',
    metaDuration: '10 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Bilim beriji mazmun',
    intro:
      'Köplenç PCOS diýlip atlandyrylýan polikistoz ýumurtgalyk sindromy sikllerinize, ovulýasiýanyza, derä, saça, metabolizmiňize we käwagt göwreli bolmak ukybyňyza täsir edip biljek umumy gormonal ýagdaý.',
    introSecondary:
      'Onuň ýüze çykyşy aýaldan aýala köp tapawutlanýar. PCOS-ny düşünmek esasan alamatlaryny tanamaga, lukmançylyk maslahatyny haçan soramalydygyny bilmäge we özüňizi günäkärlemän ösüşini yzarlamaga kömek edýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'PCOS näme?',
      'PCOS näme üçin bolýar?',
      'Esasy alamatlar',
      'Ol nähili diagnostirlenýär?',
      'PCOS we ovulýasiýa',
      'PCOS we göwreli bolmak ukyby',
      'PCOS we agram / metabolizm',
      'Deri, saç we bedendäki tüýler',
      'PCOS nähili dolandyrylýar?',
      'Giňden ýaýran ýalňyş düşünjeler',
      'Lukmana haçan ýüz tutmaly',
      'Esasy netijeler',
    ],
    s1Heading: 'PCOS näme?',
    s1Body1:
      'Polikistoz ýumurtgalyk sindromy (PCOS) ýumurtgalyklaryň adaty işleýşini we käbir gormonlaryň deňagramlylygyny üýtgedip biljek umumy gormonal ýagdaý.',
    s1Body2:
      'Käbir aýallar üçin esasy mesele düzgünsiz ovulýasiýa. Beýlekiler üçin ilki bilen akne, artykmaç tüý ösüşi, saç dökülmesi ýa-da metabolik alamatlar öne çykýar.',
    s1TipTitle: 'Bilmek peýdaly',
    s1TipText:
      'Adyna garamazdan, PCOS ýumurtgalyklarda «kistalaryň» bardygyny hökman aňlatmaýar. Taryhy adalga ýalňyşdyryjy bolup biler we diňe UZI diagnoz goýmak üçin ýeterlik däl.',
    s2Heading: 'PCOS näme üçin bolýar?',
    s2Body1:
      'PCOS-nyň ýeke sebäbi ýok. Ol birleşip biljek birnäçe faktoryň netijesi bolup görünýär: maşgala ýykgynlygy, gormonal işleýiş, ovulýasiýa, metabolizm we şahsy faktorlar.',
    s2Factors: [
      'Maşgala ýykgynlygy we genetik faktorlar',
      'Ovulýasiýadaky bozulmalar',
      'Androgenleriň otnositel artykmaçlygy',
      'Käbir aýallarda insulin garşylygy',
      'Metabolik we daşky gurşaw faktorlary',
    ],
    s2NeutralText:
      'PCOS şahsy şowsuzlyk däl. Ol diňe erk güýjüniň ýetmezçiliginden, erbet iýmitlenmekden ýa-da ýeterlik däl fiziki işjeňlikden döremeýär.',
    s3Heading: 'Esasy alamatlar',
    s3Body1:
      'PCOS aýaldan aýala gaty dürli ýüze çykyp biler. Käbirinde birnäçe alamat bar, beýlekileri bolsa gaty azyny görýär.',
    s3Signs: [
      'Düzgünsiz, seýrek ýa-da käwagt ýok sikller',
      'Düzgünsiz ýa-da çaklamaga kyn ovulýasiýa',
      'Dowam edýän akne, aýratyn-da ýüzüň aşaky böleginde',
      'Ýüzde, döşde ýa-da bedende tüý ösüşiniň artmagy',
      'Gormonal görnüşli saç dökülmesi',
      'Agram goşmak ýa-da agram ýitirmekde kynçylyk',
      'Göwreli bolmakda kynçylyk',
    ],
    s3AlertTitle: 'Möhüm',
    s3AlertText:
      'Bu alamatlaryň birini bolmagy awtomatiki PCOS-yňyzyň barlygyny aňlatmaýar. Birnäçe beýleki ýagdaý meňzeş alamatlary döredip biler.',
    s4Heading: 'Ol nähili diagnostirlenýär?',
    s4Body1:
      'PCOS-ny diagnostirlemek lukmançylyk prosesi. Saglyk hünärmeni adatça sikllerigizi, alamatlaryňyzy, lukmançylyk taryhyňyzy we kabul edýän bejergilerigizi maslahatlaşmakdan başlaýar.',
    s4Body2:
      'Ýagdaýa görä, gormonal gan synaglary we UZI hem teklip edilip bilner.',
    s4Points: [
      'Düzgünsiz sikller ýa-da seýrek ovulýasiýa',
      'Androgen artykmaçlygynyň alamatlary: akne, artykmaç tüý ösüşi, saç dökülmesi ýa-da gan synagynyň netijeleri',
      'Bu barlag görkezilende UZI-de PCOS-a gabat gelýän ýumurtgalyk görnüşi',
    ],
    s4Body3:
      'Lukman şeýle hem PCOS diagnozyny tassyklamazdan öň düzgünsiz sikliň ýa-da androgen artykmaçlygynyň beýleki mümkin sebäplerini aýyrmaly.',
    s5Heading: 'PCOS we ovulýasiýa',
    s5Body1:
      'Ovulýasiýa ýumurtgalykdan ýumurtganyň (oositiň) çykmagy. PCOS-da ovulýasiýa has seýrek ýa-da çaklamaga has kyn bolup biler.',
    s5Body2:
      'Bu siklleriň käwagt uzak, düzgünsiz ýa-da öňünden görmäge kyn bolýandygyny düşündirip biler.',
    s5HighlightTitle: 'Sikliňizi yzarlamak',
    s5HighlightText:
      'Aýbaşy seneleriňizi, alamatlaryňyzy we ovulýasiýanyň islendik alamatlaryny ýazyp goýmak öz nusgaňyzy has gowy düşünmäge kömek edip biler.',
    s6Heading: 'PCOS we göwreli bolmak ukyby',
    s6Body1:
      'Ovulýasiýa düzgünsiz bolup biljek bolany üçin, PCOS-ly käbir aýallar göwreli bolmakda has köp kynçylyk çekip biler.',
    s6Body2:
      'Şeýle-de bolsa, bu PCOS-nyň awtomatiki göwreliligiň öňüni alýandygyny aňlatmaýar. PCOS-ly köp aýal tebigy ýagdaýda ýa-da laýyk lukmançylyk goldawy bilen göwreli bolýar.',
    s6TipTitle: 'Ýatda saklaň',
    s6TipText:
      'Göwreli bolmakda kynçylyk mümkin däldigini aňlatmaýar. Göwreli bolmagy umyt edýän bolsaňyz, lukman ýa-da akuşerka ýagdaýyňyza laýyk strategiýany teklip edip biler.',
    s7Heading: 'PCOS we agram / metabolizm',
    s7Body1:
      'PCOS metabolik üýtgeşmeler, şol sanda käbir aýallarda insulin garşylygy, bilen baglanyşykly bolup biler.',
    s7Body2:
      'Şeýle-de bolsa, ýeke agram PCOS-ny diagnostirläp ýa-da aýryp bilmeýär. Inçe aýalda PCOS bolup biler, artykmaç agramly aýalda bolmazlygy hem mümkin.',
    s7NeutralText:
      'Yzarlama diňe tereziniň sanyny däl, umumy saglygy hasaba almaly.',
    s8Heading: 'Deri, saç we bedendäki tüýler',
    s8Body1:
      'Androgenleriň otnositel artykmaçlygy ýag mäzlerine we saç follikullaryna täsir edip biler.',
    s8Body2:
      'Aýala görä, bu dowam edýän akne, artan tüý ösüşi ýa-da saç dökülmesi hökmünde ýüze çykyp biler.',
    s8Items: [
      'Gormonal akne',
      'Ýüzde ýa-da bedende artan tüý',
      'Inçelýän saç ýa-da saç dökülmesi',
    ],
    s9Heading: 'PCOS nähili dolandyrylýar?',
    s9Body1:
      'Her aýal üçin işleýän PCOS-ny dolandyrmagyň ýeke çemeleşmesi ýok. Saýlaw alamatlara, maksatlara we lukmançylyk ýagdaýlara bagly.',
    s9Body2:
      'Maksat durmuşyň tapgyryna görä tapawutlanyp biler: sikllerini sazlamak, käbir alamatlary gowulandyrmak, metabolik saglygy goramak ýa-da göwrelilik meýilnamasyna goldaw bermek.',
    s9MiniTitle: 'Saglyga goldaw berýän endikler',
    s9Lifestyle: [
      'Zerurlyklaryňyza laýyk dürli, yzygiderli iýmitlenmek',
      'Wagtyň geçmegi bilen dowam etdirip boljak yzygiderli fiziki işjeňlik bilen meşgullanmak',
      'Ýeterlik yzygiderli ukyny saklamak',
      'Siklleriňiziň we alamatlaryňyzyň wagtyň geçmegi bilen nähili üýtgeýändigini yzarlamak',
      'Agramdaky ýa-da alamatlardaky üýtgeşmeler üçin özüňizi günäkärlemezlik',
    ],
    s9Body3:
      'Zerurlyklaryňyza görä, saglyk hünärmeni käbir alamatlar üçin ýa-da göwrelilik meýilnamasyna goldaw bermek üçin bejergileri hem teklip edip biler.',
    s9AlertTitle: 'Özbaşdak bejergi etmäň',
    s9AlertText:
      'Gormonal bejergiler, metabolik derman serişdeleri we iýmit goşundylarynyň hemmesi saglyk hünärmeni bilen maslahatlaşylmaly.',
    s10Heading: 'PCOS barada giňden ýaýran ýalňyş düşünjeler',
    s10Myths: [
      'PCOS hemişe «kistalaryň» bolmagyny aňladýar: adalga ýalňyşdyryjy bolup biler. Diagnoz diňe kistalaryň barlygyna esaslanmaýar.',
      'PCOS-ly ähli aýallar artykmaç agramly: PCOS ähli beden görnüşli aýallara täsir edip biler.',
      'PCOS hemişe göwrelilige päsgel berýär: ovulýasiýa düzgünsiz bolup biler, ýöne göwrelilik henizem mümkin.',
      'Diagnoz goýmak üçin ýeke alamat ýeterlik: diagnoz giňişleýin bahalandyrmany talap edýär.',
      'PCOS ýaş bilen ýönekeý ýok bolýar: onuň ýüze çykyşy ömür boýy üýtgäp biler, ýöne dowamly yzarlama möhüm bolup galýar.',
    ],
    s11Heading: 'Lukmana haçan ýüz tutmaly',
    s11Body1:
      'Lukmançylyk maslahaty sikller gaty düzgünsiz bolanda, birnäçe aý kesilende ýa-da adaty däl alamatlar peýda bolanda aýratyn peýdaly.',
    s11ConsultItems: [
      'Gaty düzgünsiz ýa-da ýok sikller',
      'Adaty däl akne ýa-da tüý ösüşi',
      'Möhüm saç dökülmesi',
      'Göwreli bolmakda kynçylyk',
      'Çalt üýtgeýän alamatlar',
    ],
    s12Heading: 'Esasy netijeler',
    s12SummaryTitle: 'Esasy nokatlar',
    s12SummaryItems: [
      'PCOS umumy gormonal ýagdaý.',
      'Ol köp dürli görnüşde ýüze çykyp biler.',
      'PCOS-ly ähli aýallaryň alamatlary şol bir däl.',
      'Ýeke agram PCOS-ny diagnostirlemek ýa-da aýyrmak üçin ýeterlik däl.',
      'Diagnoz giňişleýin lukmançylyk bahalandyrmany talap edýär.',
      'PCOS ovulýasiýa we käwagt göwreli bolmak ukybyna täsir edip biler.',
      'Şahsylaşdyrylan ideg çemeleşmesi her aýalyň zerurlyklaryny kanagatlandyrmaga kömek edýär.',
    ],
    finalNoteTitle: 'Has gowy düşünmek üçin gollanma',
    finalNoteText:
      'Bu makala umumy maglumat üçin niýetlenen we lukmançylyk maslahatlaşmagyny çalyşmaýar. Her ýagdaý dürli: şübhe bolsa ýa-da alamatlar dowam etse, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'PCOS-ny düşünmek — AWA',
  },
} as const);

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
