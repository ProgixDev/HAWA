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

const ID = 'exercise-renforcer-perinee';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
// Icon names are language-neutral and stay paired with their translated
// label inside each language's arrays.
const CONTENT = {
  fr: {
    badge: 'POST-PARTUM • RÉCUPÉRATION',
    title: 'Renforcer son périnée\naprès l’accouchement',
    metaDuration: '8 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'Après la grossesse et l’accouchement, le plancher pelvien a besoin de temps pour récupérer. Des exercices simples, réguliers et progressifs peuvent aider à retrouver force, contrôle et confiance, sans chercher à aller trop vite.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre le rôle du périnée',
      'Pourquoi l’accouchement le sollicite',
      'Quand commencer la rééducation',
      'Apprendre à contracter correctement',
      'Construire une routine progressive',
      'Les erreurs à éviter',
      'Quand demander de l’aide',
      'Reprendre le sport progressivement',
      'Préparer une consultation',
      'À retenir',
    ],
    shareMessage: 'Renforcer son périnée après l’accouchement — AWA',

    s1Heading: 'Comprendre le rôle du périnée',
    s1Body1:
      'Le périnée, aussi appelé plancher pelvien, est un ensemble de muscles situé à la base du bassin. Il participe notamment au contrôle de la vessie et de l’intestin et contribue au soutien des organes pelviens.',
    s1Body2:
      'Pendant la grossesse, ces muscles doivent supporter une charge supplémentaire pendant plusieurs mois. Ils sont également fortement sollicités au moment de l’accouchement.',
    s1HighlightTitle: 'Un muscle discret mais essentiel',
    s1HighlightText:
      'Le plancher pelvien intervient dans plusieurs fonctions quotidiennes : retenir les urines et les selles, contrôler les gaz, soutenir les organes pelviens et participer à certaines fonctions sexuelles.',

    benefitsHeading: 'Les bénéfices d’un plancher pelvien renforcé',
    benefitsIntro:
      'Un renforcement progressif et correctement réalisé peut contribuer à améliorer le contrôle et le soutien du plancher pelvien.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Mieux contrôler la vessie',
        text: 'Le plancher pelvien participe au contrôle de la vessie. Le renforcer progressivement peut aider à réduire certaines fuites urinaires.',
      },
      {
        icon: 'toilet',
        title: 'Soutenir les fonctions intestinales',
        text: 'Ces muscles participent également au contrôle des gaz et des selles et contribuent au soutien des organes pelviens.',
      },
      {
        icon: 'human-female',
        title: 'Soutenir les organes pelviens',
        text: 'Le plancher pelvien forme une véritable base musculaire qui participe au soutien de la vessie, de l’utérus et de l’intestin.',
      },
      {
        icon: 'heart-pulse',
        title: 'Retrouver progressivement ses sensations',
        text: 'Une rééducation adaptée peut aussi contribuer à retrouver une meilleure conscience et un meilleur contrôle de cette zone.',
      },
    ],

    s2Heading: 'Pourquoi la grossesse et l’accouchement le sollicitent',
    s2Body1:
      'La grossesse exerce progressivement davantage de pression sur le plancher pelvien. L’accouchement vaginal peut ensuite étirer fortement les muscles et les tissus de cette région.',
    s2Body2:
      'Une césarienne n’épargne pas pour autant totalement le plancher pelvien : la grossesse elle-même reste une période importante pour ces muscles.',
    s2Body3:
      'Après la naissance, il est donc normal que la récupération demande du temps. Certaines femmes ne ressentent presque aucun symptôme, tandis que d’autres peuvent observer des fuites, une sensation de pesanteur ou une diminution du contrôle musculaire.',
    s2TipTitle: 'Chaque récupération est différente',
    s2TipText:
      'Le type d’accouchement, une déchirure ou une épisiotomie, la présence de douleurs et l’état général après la naissance peuvent influencer la récupération.',

    s3Heading: 'Quand commencer la rééducation ?',
    s3Body1:
      'Après un accouchement sans complication, des contractions douces du plancher pelvien peuvent généralement être reprises progressivement. Il reste toutefois important d’adapter les exercices à ta situation et de demander conseil si tu as eu une complication, une douleur importante ou une intervention particulière.',
    s3Body2:
      'Si tu as une sonde urinaire, certaines recommandations conseillent d’attendre son retrait et le retour d’une miction normale avant de commencer les exercices du périnée.',
    s3AlertTitle: 'Ne force pas sur une douleur',
    s3AlertText:
      'Une douleur importante, une aggravation des symptômes, une plaie qui cicatrise mal ou une inquiétude particulière justifient un avis auprès d’une sage-femme, d’un médecin ou d’un professionnel de la rééducation.',

    s4Heading: 'Apprendre à contracter correctement',
    s4Body1:
      'Pour identifier le mouvement, imagine que tu veux retenir simultanément un gaz et une envie d’uriner. Le mouvement recherché est une sensation de contraction et de remontée vers l’intérieur.',
    s4Body2:
      'L’objectif n’est pas de serrer très fort tout le corps. Les fesses, les cuisses et les abdominaux doivent rester aussi détendus que possible, tandis que la respiration continue normalement.',
    exercises: [
      {icon: 'weather-windy', label: 'Respiration'},
      {icon: 'human-handsup', label: 'Contraction douce'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Contraction longue'},
      {icon: 'gesture-tap-button', label: 'Contractions rapides'},
    ],
    s4HighlightTitle: 'Le relâchement est aussi important',
    s4HighlightText:
      'Après chaque contraction, laisse complètement les muscles se relâcher. Une bonne rééducation ne consiste pas à garder le périnée contracté toute la journée.',

    s5Heading: 'Construire une routine progressive',
    s5Body1:
      'Au début, le plus important est d’apprendre à identifier les muscles et à effectuer correctement le mouvement. La régularité compte davantage que l’intensité.',
    s5h3a: 'Les contractions longues',
    s5Body2:
      'Contracte doucement le plancher pelvien puis maintiens la contraction pendant quelques secondes, sans bloquer ta respiration. Relâche ensuite complètement avant de recommencer.',
    s5h3b: 'Les contractions courtes',
    s5Body3:
      'Une fois le mouvement maîtrisé, de petites contractions rapides peuvent être ajoutées. Elles permettent de travailler la capacité à contracter rapidement les muscles lorsqu’une pression abdominale augmente, par exemple avant de tousser ou d’éternuer.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Associer les exercices à une habitude quotidienne'},
      {icon: 'human-sitting', label: 'Commencer dans une position confortable'},
      {icon: 'weather-windy', label: 'Respirer normalement pendant les contractions'},
      {icon: 'sleep', label: 'Respecter les temps de relâchement'},
      {icon: 'chart-line', label: 'Augmenter progressivement la difficulté'},
      {icon: 'doctor', label: 'Demander conseil en cas de doute'},
    ],
    s5TipTitle: 'La régularité avant tout',
    s5TipText:
      'Associer les exercices à une habitude déjà présente dans ta journée peut faciliter leur régularité : après une tétée, après le brossage des dents ou à un autre moment qui te convient.',

    s6Heading: 'Les erreurs fréquentes à éviter',
    s6Body1:
      'Les exercices du périnée semblent simples, mais il est facile de compenser avec d’autres muscles ou de faire trop d’efforts.',
    commonMistakes: [
      'Contracter les fesses ou les cuisses au lieu du plancher pelvien',
      'Bloquer sa respiration pendant la contraction',
      'Contracter en permanence sans laisser les muscles se relâcher',
      'Faire les exercices uniquement pendant quelques jours puis arrêter',
      'Arrêter d’uriner volontairement pour vérifier la contraction',
    ],
    s6TipTitle: 'À ne pas faire',
    s6TipText:
      'Il n’est pas recommandé de pratiquer les exercices en interrompant volontairement le jet d’urine. Cette méthode ne permet pas d’entraîner correctement le périnée et peut perturber le fonctionnement normal de la vessie.',

    s7Heading: 'Quels symptômes doivent inciter à consulter ?',
    s7Body1:
      'Les petites fuites ou une sensation inhabituelle peuvent parfois apparaître après l’accouchement. Elles ne doivent cependant pas être ignorées si elles persistent, s’aggravent ou gênent ta vie quotidienne.',
    warningSigns: [
      'Des fuites urinaires lorsque tu tousses, éternues, ris ou fais un effort',
      'Une sensation de pesanteur ou de pression dans le bas du bassin',
      'La sensation qu’une masse ou quelque chose descend dans le vagin',
      'Des difficultés à retenir les gaz ou les selles',
      'Une douleur persistante au niveau du périnée',
      'Une douleur pendant ou après les rapports sexuels',
      'Une difficulté à identifier ou à contracter correctement les muscles du périnée',
    ],
    consultLabel: 'Quand demander conseil ?',
    s7Body2:
      'Une sage-femme, un médecin ou un kinésithérapeute spécialisé en rééducation pelvi-périnéale peut vérifier la fonction musculaire et proposer un programme adapté.',

    s8Heading: 'Et après une déchirure, une épisiotomie ou une césarienne ?',
    s8Body1:
      'Une déchirure ou une épisiotomie nécessite une attention particulière pendant la cicatrisation. La reprise des activités doit respecter la douleur, l’état de la cicatrice et les recommandations données après l’accouchement.',
    s8Body2:
      'Après une césarienne, la récupération concerne également la paroi abdominale et la cicatrice. Même si l’accouchement n’a pas été vaginal, la grossesse a tout de même sollicité le plancher pelvien.',
    s8HighlightTitle: 'Une prise en charge personnalisée peut aider',
    s8HighlightText:
      'En cas de déchirure importante, de douleur, de symptômes urinaires ou intestinaux ou de difficultés persistantes, un bilan auprès d’un professionnel de santé peut être particulièrement utile.',

    s9Heading: 'Reprendre le sport progressivement',
    s9Body1:
      'La reprise du mouvement après l’accouchement doit être progressive. La marche et les mouvements doux peuvent généralement reprendre selon ton état et ton ressenti, tandis que les activités à fort impact demandent davantage de prudence.',
    s9Body2:
      'Avant de reprendre la course, les sauts ou les entraînements très intenses, il est préférable d’évaluer la récupération du plancher pelvien et de tenir compte des éventuels symptômes.',
    s9AlertTitle: 'Ne pas brûler les étapes',
    s9AlertText:
      'Des fuites, une sensation de pesanteur ou une douleur pendant ou après l’exercice sont des signes qu’il faut ralentir et demander conseil avant d’augmenter l’intensité.',

    s10Heading: 'Quand consulter un spécialiste ?',
    s10Body1:
      'Une rééducation pelvi-périnéale avec une sage-femme ou un kinésithérapeute peut être utile si tu ne sais pas si tu contractes correctement, si tes symptômes persistent ou si tu souhaites reprendre certaines activités physiques en toute confiance.',
    questionCardTitle: 'Questions utiles à poser',
    appointmentQuestions: [
      'Est-ce que mes symptômes sont compatibles avec une faiblesse du plancher pelvien ?',
      'Est-ce que je réalise correctement les contractions ?',
      'Combien de répétitions dois-je faire chaque jour ?',
      'Puis-je reprendre la course, le sport ou les exercices à impact ?',
      'Ai-je besoin d’une rééducation avec une sage-femme ou un kinésithérapeute ?',
      'Ma cicatrice, ma déchirure ou ma césarienne nécessite-t-elle des précautions particulières ?',
    ],
    s10TipTitle: 'Bon à savoir',
    s10TipText:
      'Consulter ne signifie pas forcément que quelque chose va mal. Une séance peut simplement servir à vérifier la technique, évaluer la récupération et apprendre à progresser correctement.',

    s11Heading: 'Une récupération qui prend du temps',
    s11Body1:
      'Après la naissance, il est normal de ne pas retrouver immédiatement les mêmes sensations ou la même force musculaire qu’avant la grossesse.',
    s11Body2:
      'L’objectif n’est pas de faire le plus grand nombre de contractions possible. Il s’agit plutôt de retrouver progressivement une bonne coordination entre contraction et relâchement, puis de pouvoir utiliser ces muscles naturellement dans les activités quotidiennes.',
    s11HighlightTitle: 'Petit progrès = vrai progrès',
    s11HighlightText:
      'Une meilleure perception du mouvement, quelques secondes de contraction supplémentaires ou une diminution des fuites sont déjà des signes encourageants.',

    s12Heading: 'À retenir',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'La grossesse et l’accouchement sollicitent fortement le plancher pelvien.',
      'Une récupération progressive est normale après la naissance.',
      'Les exercices doivent privilégier la qualité du mouvement plutôt que la force.',
      'La respiration et le relâchement sont aussi importants que la contraction.',
      'Les fuites urinaires, la pesanteur ou la douleur persistante méritent un avis professionnel.',
      'Une rééducation avec une sage-femme ou un kinésithérapeute peut aider à retrouver un meilleur contrôle.',
      'La reprise du sport doit être progressive, surtout pour les activités à impact.',
    ],

    finalTipTitle: 'Prends le temps de récupérer',
    finalTipText:
      'Après l’accouchement, ton corps a traversé beaucoup de changements. Le périnée mérite la même attention que les autres parties du corps : progressivement, régulièrement et sans pression.',

    disclaimerText:
      'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé. En cas de douleur, de symptômes persistants ou de doute concernant ta récupération, demande conseil à un professionnel de santé.',
  },
  en: {
    badge: 'POSTPARTUM • RECOVERY',
    title: 'Strengthening your pelvic floor\nafter childbirth',
    metaDuration: '8 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'After pregnancy and childbirth, the pelvic floor needs time to recover. Simple, regular, and gradual exercises can help you regain strength, control, and confidence, without trying to rush things.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding the role of the perineum',
      'Why childbirth puts it under strain',
      'When to start pelvic floor rehabilitation',
      'Learning to contract correctly',
      'Building a gradual routine',
      'Mistakes to avoid',
      'When to ask for help',
      'Gradually resuming sport',
      'Preparing for an appointment',
      'Key takeaways',
    ],
    shareMessage: 'Strengthening your pelvic floor after childbirth — AWA',

    s1Heading: 'Understanding the role of the perineum',
    s1Body1:
      'The perineum, also called the pelvic floor, is a group of muscles located at the base of the pelvis. It plays a role in bladder and bowel control and helps support the pelvic organs.',
    s1Body2:
      'During pregnancy, these muscles have to carry extra weight for several months. They are also put under considerable strain during childbirth.',
    s1HighlightTitle: 'A discreet but essential muscle',
    s1HighlightText:
      'The pelvic floor is involved in several everyday functions: holding in urine and stool, controlling gas, supporting the pelvic organs, and playing a role in certain sexual functions.',

    benefitsHeading: 'The benefits of a stronger pelvic floor',
    benefitsIntro:
      'Gradual, correctly performed strengthening can help improve pelvic floor control and support.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Better bladder control',
        text: 'The pelvic floor plays a role in bladder control. Strengthening it gradually may help reduce certain urinary leaks.',
      },
      {
        icon: 'toilet',
        title: 'Supporting bowel function',
        text: 'These muscles also help control gas and stool and contribute to supporting the pelvic organs.',
      },
      {
        icon: 'human-female',
        title: 'Supporting the pelvic organs',
        text: 'The pelvic floor forms a genuine muscular base that helps support the bladder, uterus, and intestine.',
      },
      {
        icon: 'heart-pulse',
        title: 'Gradually regaining sensation',
        text: 'Suitable rehabilitation can also help you regain better awareness and control of this area.',
      },
    ],

    s2Heading: 'Why pregnancy and childbirth put it under strain',
    s2Body1:
      'Pregnancy gradually places more pressure on the pelvic floor. Vaginal childbirth can then stretch the muscles and tissues in this area significantly.',
    s2Body2:
      'A cesarean section does not completely spare the pelvic floor either: pregnancy itself remains a significant period for these muscles.',
    s2Body3:
      'After birth, it is therefore normal for recovery to take time. Some women feel almost no symptoms, while others may notice leaks, a feeling of heaviness, or reduced muscle control.',
    s2TipTitle: 'Every recovery is different',
    s2TipText:
      'The type of delivery, a tear or episiotomy, the presence of pain, and your general condition after birth can all influence recovery.',

    s3Heading: 'When to start pelvic floor rehabilitation?',
    s3Body1:
      'After an uncomplicated birth, gentle pelvic floor contractions can usually be resumed gradually. It remains important to adapt the exercises to your situation and to seek advice if you experienced a complication, significant pain, or a specific procedure.',
    s3Body2:
      'If you have a urinary catheter, some recommendations suggest waiting until it is removed and normal urination has resumed before starting perineum exercises.',
    s3AlertTitle: 'Do not push through pain',
    s3AlertText:
      'Significant pain, worsening symptoms, a wound that is healing poorly, or any particular concern call for advice from a midwife, doctor, or rehabilitation professional.',

    s4Heading: 'Learning to contract correctly',
    s4Body1:
      'To identify the movement, imagine trying to hold in gas and the urge to urinate at the same time. The movement you’re looking for is a sensation of contraction and lifting inward.',
    s4Body2:
      'The goal is not to tense your entire body tightly. Your buttocks, thighs, and abdominals should stay as relaxed as possible, while breathing continues normally.',
    exercises: [
      {icon: 'weather-windy', label: 'Breathing'},
      {icon: 'human-handsup', label: 'Gentle contraction'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Long contraction'},
      {icon: 'gesture-tap-button', label: 'Quick contractions'},
    ],
    s4HighlightTitle: 'Relaxing matters just as much',
    s4HighlightText:
      'After each contraction, let the muscles relax completely. Good rehabilitation does not mean keeping the perineum contracted all day.',

    s5Heading: 'Building a gradual routine',
    s5Body1:
      'At first, the most important thing is learning to identify the muscles and perform the movement correctly. Consistency matters more than intensity.',
    s5h3a: 'Long contractions',
    s5Body2:
      'Gently contract the pelvic floor, then hold the contraction for a few seconds without holding your breath. Then release completely before starting again.',
    s5h3b: 'Short contractions',
    s5Body3:
      'Once the movement is mastered, small quick contractions can be added. They help train your ability to contract the muscles quickly when abdominal pressure increases, for example just before coughing or sneezing.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Pair the exercises with a daily habit'},
      {icon: 'human-sitting', label: 'Start in a comfortable position'},
      {icon: 'weather-windy', label: 'Breathe normally during contractions'},
      {icon: 'sleep', label: 'Respect the relaxation phases'},
      {icon: 'chart-line', label: 'Gradually increase the difficulty'},
      {icon: 'doctor', label: 'Ask for advice if you’re unsure'},
    ],
    s5TipTitle: 'Consistency above all',
    s5TipText:
      'Pairing the exercises with a habit already part of your day can make it easier to stay consistent: after a feeding, after brushing your teeth, or at another time that suits you.',

    s6Heading: 'Common mistakes to avoid',
    s6Body1:
      'Perineum exercises may look simple, but it’s easy to compensate with other muscles or push too hard.',
    commonMistakes: [
      'Tensing the buttocks or thighs instead of the pelvic floor',
      'Holding your breath during the contraction',
      'Keeping the muscles contracted constantly without letting them relax',
      'Doing the exercises for only a few days and then stopping',
      'Deliberately stopping the urine stream to check the contraction',
    ],
    s6TipTitle: 'What not to do',
    s6TipText:
      'It is not recommended to practice the exercises by deliberately stopping your urine stream. This method does not train the perineum correctly and can disrupt normal bladder function.',

    s7Heading: 'What symptoms should prompt a consultation?',
    s7Body1:
      'Minor leaks or an unusual sensation can sometimes appear after childbirth. However, they should not be ignored if they persist, worsen, or interfere with your daily life.',
    warningSigns: [
      'Urinary leaks when you cough, sneeze, laugh, or strain',
      'A feeling of heaviness or pressure in the lower pelvis',
      'A feeling that a lump or something is dropping into the vagina',
      'Difficulty holding in gas or stool',
      'Persistent pain in the perineum',
      'Pain during or after sexual intercourse',
      'Difficulty identifying or correctly contracting the perineal muscles',
    ],
    consultLabel: 'When should you seek advice?',
    s7Body2:
      'A midwife, doctor, or physiotherapist specializing in pelvic floor rehabilitation can check muscle function and suggest a suitable program.',

    s8Heading: 'And after a tear, an episiotomy, or a cesarean section?',
    s8Body1:
      'A tear or episiotomy requires particular care during healing. Resuming activities should take into account pain, the condition of the scar, and the guidance given after childbirth.',
    s8Body2:
      'After a cesarean section, recovery also involves the abdominal wall and the scar. Even if the birth was not vaginal, pregnancy itself still placed strain on the pelvic floor.',
    s8HighlightTitle: 'Personalized care can help',
    s8HighlightText:
      'In the case of a significant tear, pain, urinary or bowel symptoms, or persistent difficulties, an assessment with a healthcare professional can be especially helpful.',

    s9Heading: 'Gradually resuming sport',
    s9Body1:
      'Resuming movement after childbirth should be gradual. Walking and gentle movements can generally resume based on how you feel, while high-impact activities call for more caution.',
    s9Body2:
      'Before resuming running, jumping, or very intense training, it’s best to assess pelvic floor recovery and take any symptoms into account.',
    s9AlertTitle: 'Don’t rush the stages',
    s9AlertText:
      'Leaks, a feeling of heaviness, or pain during or after exercise are signs that you should slow down and seek advice before increasing intensity.',

    s10Heading: 'When to see a specialist?',
    s10Body1:
      'Pelvic floor rehabilitation with a midwife or physiotherapist can be helpful if you’re unsure whether you’re contracting correctly, if your symptoms persist, or if you want to resume certain physical activities with confidence.',
    questionCardTitle: 'Helpful questions to ask',
    appointmentQuestions: [
      'Are my symptoms consistent with pelvic floor weakness?',
      'Am I performing the contractions correctly?',
      'How many repetitions should I do each day?',
      'Can I go back to running, sport, or high-impact exercise?',
      'Do I need rehabilitation with a midwife or physiotherapist?',
      'Does my scar, tear, or cesarean section require any particular precautions?',
    ],
    s10TipTitle: 'Good to know',
    s10TipText:
      'Seeing a professional doesn’t necessarily mean something is wrong. A session can simply help check your technique, assess your recovery, and learn to progress correctly.',

    s11Heading: 'A recovery that takes time',
    s11Body1:
      'After giving birth, it’s normal not to immediately regain the same sensations or muscle strength you had before pregnancy.',
    s11Body2:
      'The goal is not to do as many contractions as possible. It’s more about gradually regaining good coordination between contraction and relaxation, and then being able to use these muscles naturally in everyday activities.',
    s11HighlightTitle: 'Small progress is real progress',
    s11HighlightText:
      'Better awareness of the movement, a few extra seconds of contraction, or a reduction in leaks are already encouraging signs.',

    s12Heading: 'Key takeaways',
    summaryTitle: 'The essentials',
    summaryItems: [
      'Pregnancy and childbirth place significant strain on the pelvic floor.',
      'Gradual recovery is normal after giving birth.',
      'Exercises should prioritize movement quality over strength.',
      'Breathing and relaxation matter just as much as contraction.',
      'Urinary leaks, heaviness, or persistent pain deserve a professional opinion.',
      'Rehabilitation with a midwife or physiotherapist can help you regain better control.',
      'Returning to sport should be gradual, especially for high-impact activities.',
    ],

    finalTipTitle: 'Take the time to recover',
    finalTipText:
      'After childbirth, your body has been through a lot of changes. The perineum deserves the same attention as the rest of your body: gradually, regularly, and without pressure.',

    disclaimerText:
      'This article is for informational purposes only and does not replace personalized medical advice. If you experience pain, persistent symptoms, or have any concerns about your recovery, seek advice from a healthcare professional.',
  },
  es: {
    badge: 'POSPARTO • RECUPERACIÓN',
    title: 'Fortalece tu periné\ndespués del parto',
    metaDuration: '8 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'Después del embarazo y el parto, el suelo pélvico necesita tiempo para recuperarse. Unos ejercicios sencillos, regulares y progresivos pueden ayudar a recuperar fuerza, control y confianza, sin intentar ir demasiado rápido.',
    contentsTitle: 'En este artículo',
    topics: [
      'Comprender el papel del periné',
      'Por qué el parto lo somete a esfuerzo',
      'Cuándo empezar la reeducación',
      'Aprender a contraer correctamente',
      'Construir una rutina progresiva',
      'Los errores que hay que evitar',
      'Cuándo pedir ayuda',
      'Retomar el deporte progresivamente',
      'Preparar una consulta',
      'Para recordar',
    ],
    shareMessage: 'Fortalece tu periné después del parto — AWA',

    s1Heading: 'Comprender el papel del periné',
    s1Body1:
      'El periné, también llamado suelo pélvico, es un conjunto de músculos situado en la base de la pelvis. Participa especialmente en el control de la vejiga y del intestino y contribuye al sostén de los órganos pélvicos.',
    s1Body2:
      'Durante el embarazo, estos músculos deben soportar una carga adicional durante varios meses. También se ven fuertemente solicitados en el momento del parto.',
    s1HighlightTitle: 'Un músculo discreto pero esencial',
    s1HighlightText:
      'El suelo pélvico interviene en varias funciones cotidianas: retener la orina y las heces, controlar los gases, sostener los órganos pélvicos y participar en ciertas funciones sexuales.',

    benefitsHeading: 'Los beneficios de un suelo pélvico fortalecido',
    benefitsIntro:
      'Un fortalecimiento progresivo y realizado correctamente puede contribuir a mejorar el control y el sostén del suelo pélvico.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Controlar mejor la vejiga',
        text: 'El suelo pélvico participa en el control de la vejiga. Fortalecerlo progresivamente puede ayudar a reducir algunas pérdidas urinarias.',
      },
      {
        icon: 'toilet',
        title: 'Apoyar las funciones intestinales',
        text: 'Estos músculos también participan en el control de los gases y las heces y contribuyen al sostén de los órganos pélvicos.',
      },
      {
        icon: 'human-female',
        title: 'Sostener los órganos pélvicos',
        text: 'El suelo pélvico forma una verdadera base muscular que participa en el sostén de la vejiga, el útero y el intestino.',
      },
      {
        icon: 'heart-pulse',
        title: 'Recuperar progresivamente las sensaciones',
        text: 'Una reeducación adaptada también puede contribuir a recuperar una mejor conciencia y un mejor control de esta zona.',
      },
    ],

    s2Heading: 'Por qué el embarazo y el parto lo someten a esfuerzo',
    s2Body1:
      'El embarazo ejerce progresivamente más presión sobre el suelo pélvico. El parto vaginal puede después estirar fuertemente los músculos y los tejidos de esta zona.',
    s2Body2:
      'Una cesárea no libra por completo al suelo pélvico: el embarazo en sí mismo sigue siendo un período importante para estos músculos.',
    s2Body3:
      'Después del nacimiento, es por tanto normal que la recuperación requiera tiempo. Algunas mujeres apenas sienten síntomas, mientras que otras pueden notar pérdidas, una sensación de pesadez o una disminución del control muscular.',
    s2TipTitle: 'Cada recuperación es diferente',
    s2TipText:
      'El tipo de parto, un desgarro o una episiotomía, la presencia de dolor y el estado general después del nacimiento pueden influir en la recuperación.',

    s3Heading: '¿Cuándo empezar la reeducación?',
    s3Body1:
      'Después de un parto sin complicaciones, las contracciones suaves del suelo pélvico pueden retomarse generalmente de forma progresiva. Sigue siendo importante adaptar los ejercicios a tu situación y pedir consejo si has tenido una complicación, un dolor importante o una intervención particular.',
    s3Body2:
      'Si llevas una sonda urinaria, algunas recomendaciones aconsejan esperar a que se retire y a que se restablezca una micción normal antes de empezar los ejercicios del periné.',
    s3AlertTitle: 'No fuerces si hay dolor',
    s3AlertText:
      'Un dolor importante, un empeoramiento de los síntomas, una herida que cicatriza mal o una preocupación particular justifican pedir un consejo a una matrona, un médico o un profesional de la reeducación.',

    s4Heading: 'Aprender a contraer correctamente',
    s4Body1:
      'Para identificar el movimiento, imagina que quieres retener al mismo tiempo un gas y unas ganas de orinar. El movimiento buscado es una sensación de contracción y de ascenso hacia el interior.',
    s4Body2:
      'El objetivo no es apretar con fuerza todo el cuerpo. Los glúteos, los muslos y los abdominales deben permanecer lo más relajados posible, mientras la respiración continúa con normalidad.',
    exercises: [
      {icon: 'weather-windy', label: 'Respiración'},
      {icon: 'human-handsup', label: 'Contracción suave'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Contracción larga'},
      {icon: 'gesture-tap-button', label: 'Contracciones rápidas'},
    ],
    s4HighlightTitle: 'El relajamiento también es importante',
    s4HighlightText:
      'Después de cada contracción, deja que los músculos se relajen por completo. Una buena reeducación no consiste en mantener el periné contraído todo el día.',

    s5Heading: 'Construir una rutina progresiva',
    s5Body1:
      'Al principio, lo más importante es aprender a identificar los músculos y a realizar correctamente el movimiento. La regularidad importa más que la intensidad.',
    s5h3a: 'Las contracciones largas',
    s5Body2:
      'Contrae suavemente el suelo pélvico y luego mantén la contracción durante unos segundos, sin contener la respiración. Después relaja por completo antes de volver a empezar.',
    s5h3b: 'Las contracciones cortas',
    s5Body3:
      'Una vez dominado el movimiento, se pueden añadir pequeñas contracciones rápidas. Permiten trabajar la capacidad de contraer rápidamente los músculos cuando aumenta la presión abdominal, por ejemplo antes de toser o estornudar.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Asociar los ejercicios a un hábito diario'},
      {icon: 'human-sitting', label: 'Empezar en una posición cómoda'},
      {icon: 'weather-windy', label: 'Respirar con normalidad durante las contracciones'},
      {icon: 'sleep', label: 'Respetar los tiempos de relajación'},
      {icon: 'chart-line', label: 'Aumentar progresivamente la dificultad'},
      {icon: 'doctor', label: 'Pedir consejo en caso de duda'},
    ],
    s5TipTitle: 'La regularidad ante todo',
    s5TipText:
      'Asociar los ejercicios a un hábito ya presente en tu día puede facilitar su regularidad: después de una toma, después de cepillarte los dientes o en otro momento que te convenga.',

    s6Heading: 'Los errores frecuentes que hay que evitar',
    s6Body1:
      'Los ejercicios del periné parecen sencillos, pero es fácil compensar con otros músculos o hacer demasiado esfuerzo.',
    commonMistakes: [
      'Contraer los glúteos o los muslos en lugar del suelo pélvico',
      'Contener la respiración durante la contracción',
      'Contraer de forma permanente sin dejar que los músculos se relajen',
      'Hacer los ejercicios solo durante unos días y luego dejarlo',
      'Dejar de orinar voluntariamente para comprobar la contracción',
    ],
    s6TipTitle: 'Qué no hacer',
    s6TipText:
      'No se recomienda practicar los ejercicios interrumpiendo voluntariamente el chorro de orina. Este método no permite entrenar correctamente el periné y puede alterar el funcionamiento normal de la vejiga.',

    s7Heading: '¿Qué síntomas deben llevarte a consultar?',
    s7Body1:
      'Pequeñas pérdidas o una sensación inusual pueden aparecer a veces después del parto. Sin embargo, no deben ignorarse si persisten, se agravan o afectan tu vida cotidiana.',
    warningSigns: [
      'Pérdidas urinarias cuando toses, estornudas, ríes o haces un esfuerzo',
      'Una sensación de pesadez o presión en la parte baja de la pelvis',
      'La sensación de que una masa o algo desciende en la vagina',
      'Dificultades para retener los gases o las heces',
      'Un dolor persistente en el periné',
      'Un dolor durante o después de las relaciones sexuales',
      'Una dificultad para identificar o contraer correctamente los músculos del periné',
    ],
    consultLabel: '¿Cuándo pedir consejo?',
    s7Body2:
      'Una matrona, un médico o un fisioterapeuta especializado en reeducación pelviperineal puede comprobar la función muscular y proponer un programa adaptado.',

    s8Heading: '¿Y después de un desgarro, una episiotomía o una cesárea?',
    s8Body1:
      'Un desgarro o una episiotomía requiere una atención particular durante la cicatrización. La reanudación de las actividades debe respetar el dolor, el estado de la cicatriz y las recomendaciones dadas después del parto.',
    s8Body2:
      'Después de una cesárea, la recuperación también afecta a la pared abdominal y a la cicatriz. Aunque el parto no haya sido vaginal, el embarazo en sí mismo ha sometido igualmente al suelo pélvico a esfuerzo.',
    s8HighlightTitle: 'Una atención personalizada puede ayudar',
    s8HighlightText:
      'En caso de desgarro importante, dolor, síntomas urinarios o intestinales o dificultades persistentes, una valoración con un profesional de la salud puede ser especialmente útil.',

    s9Heading: 'Retomar el deporte progresivamente',
    s9Body1:
      'La reanudación del movimiento después del parto debe ser progresiva. Caminar y los movimientos suaves pueden generalmente retomarse según tu estado y cómo te sientas, mientras que las actividades de fuerte impacto requieren más prudencia.',
    s9Body2:
      'Antes de retomar la carrera, los saltos o los entrenamientos muy intensos, es preferible evaluar la recuperación del suelo pélvico y tener en cuenta los posibles síntomas.',
    s9AlertTitle: 'No te saltes etapas',
    s9AlertText:
      'Las pérdidas, una sensación de pesadez o un dolor durante o después del ejercicio son señales de que hay que ralentizar y pedir consejo antes de aumentar la intensidad.',

    s10Heading: '¿Cuándo consultar a un especialista?',
    s10Body1:
      'Una reeducación pelviperineal con una matrona o un fisioterapeuta puede ser útil si no sabes si estás contrayendo correctamente, si tus síntomas persisten o si deseas retomar ciertas actividades físicas con total confianza.',
    questionCardTitle: 'Preguntas útiles para hacer',
    appointmentQuestions: [
      '¿Mis síntomas son compatibles con una debilidad del suelo pélvico?',
      '¿Estoy realizando correctamente las contracciones?',
      '¿Cuántas repeticiones debo hacer cada día?',
      '¿Puedo retomar la carrera, el deporte o los ejercicios de impacto?',
      '¿Necesito una reeducación con una matrona o un fisioterapeuta?',
      '¿Mi cicatriz, mi desgarro o mi cesárea requieren precauciones particulares?',
    ],
    s10TipTitle: 'DATO ÚTIL',
    s10TipText:
      'Consultar no significa necesariamente que algo va mal. Una sesión puede simplemente servir para comprobar la técnica, evaluar la recuperación y aprender a progresar correctamente.',

    s11Heading: 'Una recuperación que lleva tiempo',
    s11Body1:
      'Después del nacimiento, es normal no recuperar de inmediato las mismas sensaciones o la misma fuerza muscular que antes del embarazo.',
    s11Body2:
      'El objetivo no es hacer el mayor número de contracciones posible. Se trata más bien de recuperar progresivamente una buena coordinación entre contracción y relajación, y luego poder usar estos músculos de forma natural en las actividades cotidianas.',
    s11HighlightTitle: 'Un pequeño progreso es un progreso real',
    s11HighlightText:
      'Una mejor percepción del movimiento, unos segundos más de contracción o una disminución de las pérdidas ya son señales alentadoras.',

    s12Heading: 'Para recordar',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'El embarazo y el parto someten al suelo pélvico a un esfuerzo importante.',
      'Una recuperación progresiva es normal después del nacimiento.',
      'Los ejercicios deben priorizar la calidad del movimiento más que la fuerza.',
      'La respiración y la relajación son tan importantes como la contracción.',
      'Las pérdidas urinarias, la pesadez o el dolor persistente merecen un consejo profesional.',
      'Una reeducación con una matrona o un fisioterapeuta puede ayudar a recuperar un mejor control.',
      'La reanudación del deporte debe ser progresiva, sobre todo para las actividades de impacto.',
    ],

    finalTipTitle: 'Tómate el tiempo de recuperarte',
    finalTipText:
      'Después del parto, tu cuerpo ha atravesado muchos cambios. El periné merece la misma atención que las demás partes del cuerpo: de forma progresiva, regular y sin presión.',

    disclaimerText:
      'Este artículo tiene una finalidad informativa y no sustituye un consejo médico personalizado. En caso de dolor, de síntomas persistentes o de duda sobre tu recuperación, pide consejo a un profesional de la salud.',
  },
  it: {
    badge: 'POST-PARTUM • RECUPERO',
    title: 'Rafforzare il pavimento pelvico\ndopo il parto',
    metaDuration: '8 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Dopo la gravidanza e il parto, il pavimento pelvico ha bisogno di tempo per recuperare. Esercizi semplici, regolari e graduali possono aiutarti a ritrovare forza, controllo e fiducia, senza cercare di accelerare i tempi.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il ruolo del perineo',
      'Perché il parto lo mette sotto sforzo',
      'Quando iniziare la rieducazione del pavimento pelvico',
      'Imparare a contrarre correttamente',
      'Costruire una routine graduale',
      'Errori da evitare',
      'Quando chiedere aiuto',
      'Riprendere gradualmente lo sport',
      'Prepararsi a una visita',
      'Punti chiave',
    ],
    shareMessage: 'Rafforzare il pavimento pelvico dopo il parto — AWA',
    s1Heading: 'Capire il ruolo del perineo',
    s1Body1: 'Il perineo, chiamato anche pavimento pelvico, è un insieme di muscoli situato alla base del bacino. Svolge un ruolo nel controllo della vescica e dell’intestino e contribuisce a sostenere gli organi pelvici.',
    s1Body2: 'Durante la gravidanza questi muscoli devono sostenere un peso supplementare per diversi mesi. Sono inoltre sottoposti a una forte sollecitazione durante il parto.',
    s1HighlightTitle: 'Un muscolo discreto ma essenziale',
    s1HighlightText: 'Il pavimento pelvico interviene in diverse funzioni quotidiane: trattenere urina e feci, controllare i gas, sostenere gli organi pelvici e svolgere un ruolo in alcune funzioni sessuali.',
    benefitsHeading: 'I benefici di un pavimento pelvico più forte',
    benefitsIntro: 'Un rafforzamento graduale ed eseguito correttamente può aiutare a migliorare il controllo e il sostegno del pavimento pelvico.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Un migliore controllo della vescica',
        text: 'Il pavimento pelvico svolge un ruolo nel controllo della vescica. Rafforzarlo gradualmente può aiutare a ridurre alcune perdite urinarie.',
      },
      {
        icon: 'toilet',
        title: 'Sostenere la funzione intestinale',
        text: 'Questi muscoli aiutano anche a controllare gas e feci e contribuiscono a sostenere gli organi pelvici.',
      },
      {
        icon: 'human-female',
        title: 'Sostenere gli organi pelvici',
        text: 'Il pavimento pelvico forma una vera base muscolare che aiuta a sostenere vescica, utero e intestino.',
      },
      {
        icon: 'heart-pulse',
        title: 'Ritrovare gradualmente la sensibilità',
        text: 'Una rieducazione adeguata può anche aiutarti a ritrovare una migliore consapevolezza e un migliore controllo di questa zona.',
      },
    ],
    s2Heading: 'Perché gravidanza e parto lo mettono sotto sforzo',
    s2Body1: 'La gravidanza esercita gradualmente una pressione maggiore sul pavimento pelvico. Il parto vaginale può poi allungare in modo importante i muscoli e i tessuti di questa zona.',
    s2Body2: 'Anche un taglio cesareo non risparmia del tutto il pavimento pelvico: la gravidanza in sé resta un periodo impegnativo per questi muscoli.',
    s2Body3: 'Dopo il parto è quindi normale che il recupero richieda tempo. Alcune donne non avvertono quasi nessun sintomo, mentre altre possono notare perdite, una sensazione di pesantezza o un ridotto controllo muscolare.',
    s2TipTitle: 'Ogni recupero è diverso',
    s2TipText: 'Il tipo di parto, una lacerazione o un’episiotomia, la presenza di dolore e le tue condizioni generali dopo il parto possono influenzare il recupero.',
    s3Heading: 'Quando iniziare la rieducazione del pavimento pelvico?',
    s3Body1: 'Dopo un parto senza complicazioni, di solito si possono riprendere gradualmente contrazioni delicate del pavimento pelvico. Resta importante adattare gli esercizi alla tua situazione e chiedere consiglio se hai avuto una complicazione, un dolore importante o una procedura particolare.',
    s3Body2: 'Se hai un catetere urinario, alcune raccomandazioni suggeriscono di aspettare che venga tolto e che la minzione normale sia ripresa prima di iniziare gli esercizi per il perineo.',
    s3AlertTitle: 'Non forzare in presenza di dolore',
    s3AlertText: 'Un dolore importante, sintomi che peggiorano, una ferita che guarisce male o qualsiasi preoccupazione particolare richiedono il parere di un’ostetrica, di un medico o di un professionista della rieducazione.',
    s4Heading: 'Imparare a contrarre correttamente',
    s4Body1: 'Per individuare il movimento, immagina di cercare di trattenere i gas e lo stimolo di urinare nello stesso momento. Il movimento che cerchi è una sensazione di contrazione e di sollevamento verso l’interno.',
    s4Body2: 'L’obiettivo non è irrigidire con forza tutto il corpo. Glutei, cosce e addominali devono restare il più rilassati possibile, mentre la respirazione continua normalmente.',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'Respirazione',
      },
      {
        icon: 'human-handsup',
        label: 'Contrazione delicata',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'Contrazione lunga',
      },
      {
        icon: 'gesture-tap-button',
        label: 'Contrazioni rapide',
      },
    ],
    s4HighlightTitle: 'Rilassarsi conta altrettanto',
    s4HighlightText: 'Dopo ogni contrazione, lascia che i muscoli si rilassino completamente. Una buona rieducazione non significa tenere il perineo contratto tutto il giorno.',
    s5Heading: 'Costruire una routine graduale',
    s5Body1: 'All’inizio la cosa più importante è imparare a individuare i muscoli ed eseguire correttamente il movimento. La costanza conta più dell’intensità.',
    s5h3a: 'Contrazioni lunghe',
    s5Body2: 'Contrai delicatamente il pavimento pelvico, poi mantieni la contrazione per qualche secondo senza trattenere il respiro. Poi rilascia completamente prima di ricominciare.',
    s5h3b: 'Contrazioni brevi',
    s5Body3: 'Quando il movimento è padroneggiato, si possono aggiungere piccole contrazioni rapide. Aiutano ad allenare la capacità di contrarre i muscoli rapidamente quando la pressione addominale aumenta, per esempio poco prima di un colpo di tosse o di uno starnuto.',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'Abbina gli esercizi a un’abitudine quotidiana',
      },
      {
        icon: 'human-sitting',
        label: 'Inizia in una posizione comoda',
      },
      {
        icon: 'weather-windy',
        label: 'Respira normalmente durante le contrazioni',
      },
      {
        icon: 'sleep',
        label: 'Rispetta le fasi di rilassamento',
      },
      {
        icon: 'chart-line',
        label: 'Aumenta gradualmente la difficoltà',
      },
      {
        icon: 'doctor',
        label: 'Chiedi consiglio se hai dei dubbi',
      },
    ],
    s5TipTitle: 'Prima di tutto la costanza',
    s5TipText: 'Abbinare gli esercizi a un’abitudine già presente nella tua giornata può aiutarti a essere costante: dopo una poppata, dopo aver lavato i denti o in un altro momento che ti è comodo.',
    s6Heading: 'Errori comuni da evitare',
    s6Body1: 'Gli esercizi per il perineo possono sembrare semplici, ma è facile compensare con altri muscoli o spingere troppo.',
    commonMistakes: [
      'Contrarre i glutei o le cosce invece del pavimento pelvico',
      'Trattenere il respiro durante la contrazione',
      'Tenere i muscoli costantemente contratti senza lasciarli rilassare',
      'Fare gli esercizi solo per pochi giorni e poi smettere',
      'Interrompere volontariamente il flusso di urina per verificare la contrazione',
    ],
    s6TipTitle: 'Cosa non fare',
    s6TipText: 'Non è raccomandato esercitarsi interrompendo volontariamente il flusso di urina. Questo metodo non allena correttamente il perineo e può disturbare il normale funzionamento della vescica.',
    s7Heading: 'Quali sintomi dovrebbero portare a una visita?',
    s7Body1: 'Dopo il parto possono comparire talvolta lievi perdite o una sensazione insolita. Tuttavia non vanno ignorate se persistono, peggiorano o interferiscono con la vita quotidiana.',
    warningSigns: [
      'Perdite di urina quando tossisci, starnutisci, ridi o fai uno sforzo',
      'Una sensazione di pesantezza o di pressione nella parte bassa del bacino',
      'La sensazione che una massa o qualcosa stia scendendo nella vagina',
      'Difficoltà a trattenere gas o feci',
      'Dolore persistente nel perineo',
      'Dolore durante o dopo i rapporti sessuali',
      'Difficoltà a individuare o a contrarre correttamente i muscoli del perineo',
    ],
    consultLabel: 'Quando chiedere consiglio?',
    s7Body2: 'Un’ostetrica, un medico o un fisioterapista specializzato nella rieducazione del pavimento pelvico può verificare la funzione muscolare e proporre un programma adatto.',
    s8Heading: 'E dopo una lacerazione, un’episiotomia o un taglio cesareo?',
    s8Body1: 'Una lacerazione o un’episiotomia richiedono un’attenzione particolare durante la guarigione. La ripresa delle attività dovrebbe tenere conto del dolore, delle condizioni della cicatrice e delle indicazioni ricevute dopo il parto.',
    s8Body2: 'Dopo un taglio cesareo, il recupero riguarda anche la parete addominale e la cicatrice. Anche se il parto non è stato vaginale, la gravidanza stessa ha comunque sollecitato il pavimento pelvico.',
    s8HighlightTitle: 'Un’assistenza personalizzata può aiutare',
    s8HighlightText: 'In caso di lacerazione importante, dolore, sintomi urinari o intestinali o difficoltà persistenti, una valutazione con un professionista della salute può essere particolarmente utile.',
    s9Heading: 'Riprendere gradualmente lo sport',
    s9Body1: 'La ripresa del movimento dopo il parto dovrebbe essere graduale. La camminata e i movimenti dolci possono in genere riprendere in base a come ti senti, mentre le attività ad alto impatto richiedono più cautela.',
    s9Body2: 'Prima di riprendere la corsa, i salti o un allenamento molto intenso, è meglio valutare il recupero del pavimento pelvico e tenere conto di eventuali sintomi.',
    s9AlertTitle: 'Non bruciare le tappe',
    s9AlertText: 'Perdite, una sensazione di pesantezza o dolore durante o dopo l’esercizio sono segnali che indicano di rallentare e di chiedere consiglio prima di aumentare l’intensità.',
    s10Heading: 'Quando rivolgersi a uno specialista?',
    s10Body1: 'La rieducazione del pavimento pelvico con un’ostetrica o un fisioterapista può essere utile se non sei sicura di contrarre correttamente, se i sintomi persistono o se vuoi riprendere con fiducia alcune attività fisiche.',
    questionCardTitle: 'Domande utili da porre',
    appointmentQuestions: [
      'I miei sintomi sono compatibili con una debolezza del pavimento pelvico?',
      'Sto eseguendo correttamente le contrazioni?',
      'Quante ripetizioni dovrei fare ogni giorno?',
      'Posso tornare a correre, a fare sport o esercizio ad alto impatto?',
      'Ho bisogno di una rieducazione con un’ostetrica o un fisioterapista?',
      'La mia cicatrice, la lacerazione o il taglio cesareo richiedono precauzioni particolari?',
    ],
    s10TipTitle: 'Da sapere',
    s10TipText: 'Rivolgersi a un professionista non significa necessariamente che qualcosa non vada. Una seduta può servire semplicemente a verificare la tua tecnica, valutare il tuo recupero e imparare a progredire correttamente.',
    s11Heading: 'Un recupero che richiede tempo',
    s11Body1: 'Dopo il parto è normale non ritrovare subito le stesse sensazioni o la stessa forza muscolare che avevi prima della gravidanza.',
    s11Body2: 'L’obiettivo non è fare il maggior numero possibile di contrazioni. Si tratta piuttosto di ritrovare gradualmente una buona coordinazione tra contrazione e rilassamento, e poi di riuscire a usare questi muscoli in modo naturale nelle attività di ogni giorno.',
    s11HighlightTitle: 'I piccoli progressi sono veri progressi',
    s11HighlightText: 'Una maggiore consapevolezza del movimento, qualche secondo in più di contrazione o una riduzione delle perdite sono già segnali incoraggianti.',
    s12Heading: 'Punti chiave',
    summaryTitle: 'L’essenziale',
    summaryItems: [
      'Gravidanza e parto sottopongono il pavimento pelvico a una forte sollecitazione.',
      'Un recupero graduale è normale dopo il parto.',
      'Gli esercizi devono privilegiare la qualità del movimento rispetto alla forza.',
      'Respirazione e rilassamento contano quanto la contrazione.',
      'Perdite urinarie, pesantezza o dolore persistente meritano il parere di un professionista.',
      'La rieducazione con un’ostetrica o un fisioterapista può aiutarti a ritrovare un migliore controllo.',
      'Il ritorno allo sport deve essere graduale, soprattutto per le attività ad alto impatto.',
    ],
    finalTipTitle: 'Prenditi il tempo per recuperare',
    finalTipText: 'Dopo il parto, il tuo corpo ha attraversato molti cambiamenti. Il perineo merita la stessa attenzione del resto del tuo corpo: gradualmente, con regolarità e senza pressione.',
    disclaimerText: 'Questo articolo ha uno scopo esclusivamente informativo e non sostituisce un parere medico personalizzato. Se avverti dolore, sintomi persistenti o hai qualsiasi preoccupazione sul tuo recupero, chiedi consiglio a un professionista della salute.',
  },
  tr: {
    badge: 'DOĞUM SONRASI • TOPARLANMA',
    title: 'Doğumdan sonra pelvik taban\nkaslarını güçlendirmek',
    metaDuration: '8 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Gebelik ve doğumdan sonra pelvik taban kaslarının toparlanmak için zamana ihtiyacı vardır. Basit, düzenli ve kademeli egzersizler, işleri aceleye getirmeye çalışmadan gücünü, kontrolünü ve özgüvenini yeniden kazanmana yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Perine kaslarının rolünü anlamak',
      'Doğum bu kasları neden zorlar?',
      'Pelvik taban rehabilitasyonuna ne zaman başlanmalı?',
      'Doğru şekilde kasmayı öğrenmek',
      'Kademeli bir rutin oluşturmak',
      'Kaçınılması gereken hatalar',
      'Ne zaman yardım istemeli?',
      'Spora kademeli olarak dönmek',
      'Bir randevuya hazırlanmak',
      'Akılda kalacaklar',
    ],
    shareMessage: 'Doğumdan sonra pelvik taban kaslarını güçlendirmek — AWA',
    s1Heading: 'Perine kaslarının rolünü anlamak',
    s1Body1: 'Pelvik taban da denilen perine, pelvisin tabanında yer alan bir kas grubudur. Mesane ve bağırsak kontrolünde rol oynar ve pelvik organların desteklenmesine yardımcı olur.',
    s1Body2: 'Gebelik sırasında bu kaslar aylar boyunca fazladan yük taşımak zorundadır. Doğum sırasında da ciddi biçimde zorlanırlar.',
    s1HighlightTitle: 'Gösterişsiz ama vazgeçilmez bir kas',
    s1HighlightText: 'Pelvik taban, günlük hayattaki birçok işlevde rol oynar: idrar ve dışkıyı tutmak, gazı kontrol etmek, pelvik organları desteklemek ve bazı cinsel işlevlerde görev almak.',
    benefitsHeading: 'Daha güçlü bir pelvik tabanın faydaları',
    benefitsIntro: 'Kademeli ve doğru yapılan güçlendirme, pelvik taban kontrolünü ve desteğini iyileştirmeye yardımcı olabilir.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Daha iyi mesane kontrolü',
        text: 'Pelvik taban, mesane kontrolünde rol oynar. Kademeli olarak güçlendirmek, bazı idrar kaçaklarını azaltmaya yardımcı olabilir.',
      },
      {
        icon: 'toilet',
        title: 'Bağırsak işlevini desteklemek',
        text: 'Bu kaslar gaz ve dışkı kontrolüne de yardımcı olur ve pelvik organların desteklenmesine katkıda bulunur.',
      },
      {
        icon: 'human-female',
        title: 'Pelvik organları desteklemek',
        text: 'Pelvik taban, mesane, rahim ve bağırsağın desteklenmesine yardımcı olan gerçek bir kas zemini oluşturur.',
      },
      {
        icon: 'heart-pulse',
        title: 'Hissi yavaş yavaş geri kazanmak',
        text: 'Uygun bir rehabilitasyon, bu bölgeye dair farkındalığını ve kontrolünü yeniden kazanmana da yardımcı olabilir.',
      },
    ],
    s2Heading: 'Gebelik ve doğum bu kasları neden zorlar?',
    s2Body1: 'Gebelik, pelvik tabana giderek daha fazla baskı uygular. Vajinal doğum ise bu bölgedeki kasları ve dokuları belirgin şekilde gerebilir.',
    s2Body2: 'Sezaryen de pelvik tabanı tamamen korumaz: gebeliğin kendisi bu kaslar için önemli bir dönem olmaya devam eder.',
    s2Body3: 'Bu nedenle doğumdan sonra toparlanmanın zaman alması normaldir. Bazı kadınlar neredeyse hiç belirti hissetmezken, bazıları kaçak, ağırlık hissi veya kas kontrolünde azalma fark edebilir.',
    s2TipTitle: 'Her toparlanma farklıdır',
    s2TipText: 'Doğum şekli, yırtık veya epizyotomi, ağrının varlığı ve doğum sonrası genel durumun, toparlanmayı etkileyebilir.',
    s3Heading: 'Pelvik taban rehabilitasyonuna ne zaman başlanmalı?',
    s3Body1: 'Sorunsuz bir doğumdan sonra, pelvik tabanı hafifçe kasma egzersizlerine genellikle kademeli olarak yeniden başlanabilir. Egzersizleri durumuna göre uyarlamak ve bir komplikasyon, belirgin ağrı veya özel bir müdahale yaşadıysan tavsiye almak önemlidir.',
    s3Body2: 'İdrar sondası varsa, bazı önerilere göre perine egzersizlerine başlamak için sondanın çıkarılmasını ve normal idrar yapmanın yeniden başlamasını beklemek gerekir.',
    s3AlertTitle: 'Ağrıya rağmen zorlama',
    s3AlertText: 'Belirgin ağrı, kötüleşen belirtiler, kötü iyileşen bir yara veya herhangi bir özel endişe için ebe, doktor veya rehabilitasyon uzmanından tavsiye almak gerekir.',
    s4Heading: 'Doğru şekilde kasmayı öğrenmek',
    s4Body1: 'Hareketi fark etmek için, aynı anda hem gazını hem de idrar yapma isteğini tutmaya çalıştığını hayal et. Aradığın hareket, içeriye ve yukarıya doğru bir kasılma ve çekilme hissidir.',
    s4Body2: 'Amaç tüm vücudunu sıkıca gererek kasmak değildir. Kalçaların, uyluklarının ve karın kasların mümkün olduğunca gevşek kalmalı, nefes alıp vermeye normal şekilde devam etmelisin.',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'Nefes alma',
      },
      {
        icon: 'human-handsup',
        label: 'Hafif kasılma',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'Uzun kasılma',
      },
      {
        icon: 'gesture-tap-button',
        label: 'Hızlı kasılmalar',
      },
    ],
    s4HighlightTitle: 'Gevşemek de en az kasmak kadar önemli',
    s4HighlightText: 'Her kasılmanın ardından kasların tamamen gevşemesine izin ver. İyi bir rehabilitasyon, perineyi gün boyu kasılı tutmak anlamına gelmez.',
    s5Heading: 'Kademeli bir rutin oluşturmak',
    s5Body1: 'Başlangıçta en önemli şey, kasları tanımayı ve hareketi doğru yapmayı öğrenmektir. Düzenlilik, şiddetten daha önemlidir.',
    s5h3a: 'Uzun kasılmalar',
    s5Body2: 'Pelvik tabanı hafifçe kas, ardından nefesini tutmadan kasılmayı birkaç saniye boyunca sürdür. Sonra yeniden başlamadan önce tamamen bırak.',
    s5h3b: 'Kısa kasılmalar',
    s5Body3: 'Hareketi iyice öğrendikten sonra küçük ve hızlı kasılmalar eklenebilir. Bunlar, karın içi basınç arttığında, örneğin öksürmeden veya hapşırmadan hemen önce, kasları hızlıca kasabilme becerini geliştirmeye yardımcı olur.',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'Egzersizleri günlük bir alışkanlıkla eşleştir',
      },
      {
        icon: 'human-sitting',
        label: 'Rahat bir pozisyonda başla',
      },
      {
        icon: 'weather-windy',
        label: 'Kasılmalar sırasında normal nefes al',
      },
      {
        icon: 'sleep',
        label: 'Gevşeme aşamalarına uy',
      },
      {
        icon: 'chart-line',
        label: 'Zorluğu kademeli olarak artır',
      },
      {
        icon: 'doctor',
        label: 'Emin değilsen tavsiye iste',
      },
    ],
    s5TipTitle: 'Her şeyden önce düzenlilik',
    s5TipText: 'Egzersizleri gününün zaten bir parçası olan bir alışkanlıkla eşleştirmek düzenli kalmayı kolaylaştırabilir: bir emzirmeden sonra, dişlerini fırçaladıktan sonra veya sana uygun başka bir anda.',
    s6Heading: 'Kaçınılması gereken yaygın hatalar',
    s6Body1: 'Perine egzersizleri basit görünebilir, ancak başka kasları devreye sokmak veya fazla zorlamak kolaydır.',
    commonMistakes: [
      'Pelvik taban yerine kalçaları veya uyluk kaslarını kasmak',
      'Kasılma sırasında nefesini tutmak',
      'Kasları gevşetmeden sürekli kasılı tutmak',
      'Egzersizleri yalnızca birkaç gün yapıp bırakmak',
      'Kasılmayı kontrol etmek için idrar akışını bilerek durdurmak',
    ],
    s6TipTitle: 'Yapmaman gerekenler',
    s6TipText: 'Egzersizleri idrar akışını bilerek durdurarak yapmak önerilmez. Bu yöntem perineyi doğru şekilde çalıştırmaz ve normal mesane işlevini bozabilir.',
    s7Heading: 'Hangi belirtiler bir muayeneyi gerektirir?',
    s7Body1: 'Doğumdan sonra bazen hafif kaçaklar veya alışılmadık bir his ortaya çıkabilir. Ancak bunlar devam ediyorsa, kötüleşiyorsa veya günlük hayatını etkiliyorsa göz ardı edilmemelidir.',
    warningSigns: [
      'Öksürürken, hapşırırken, gülerken veya ıkınırken idrar kaçırmak',
      'Alt pelviste ağırlık veya baskı hissi',
      'Vajinaya doğru bir yumru veya bir şeyin sarktığı hissi',
      'Gaz veya dışkıyı tutmakta zorlanmak',
      'Perinede süren ağrı',
      'Cinsel ilişki sırasında veya sonrasında ağrı',
      'Perine kaslarını fark etmekte veya doğru kasmakta zorlanmak',
    ],
    consultLabel: 'Ne zaman tavsiye almalısın?',
    s7Body2: 'Pelvik taban rehabilitasyonu konusunda uzman bir ebe, doktor veya fizyoterapist kas işlevini kontrol edebilir ve uygun bir program önerebilir.',
    s8Heading: 'Peki yırtık, epizyotomi veya sezaryenden sonra?',
    s8Body1: 'Yırtık veya epizyotomi, iyileşme sırasında özel bir dikkat gerektirir. Aktivitelere yeniden başlarken ağrı, yara izinin durumu ve doğumdan sonra verilen yönlendirmeler dikkate alınmalıdır.',
    s8Body2: 'Sezaryenden sonra toparlanma, karın duvarını ve yara izini de kapsar. Doğum vajinal olmasa bile, gebeliğin kendisi pelvik tabanı yine de zorlamıştır.',
    s8HighlightTitle: 'Kişiye özel destek yardımcı olabilir',
    s8HighlightText: 'Belirgin bir yırtık, ağrı, idrar veya bağırsakla ilgili belirtiler ya da süren güçlükler olduğunda, bir sağlık profesyoneliyle yapılan değerlendirme özellikle faydalı olabilir.',
    s9Heading: 'Spora kademeli olarak dönmek',
    s9Body1: 'Doğumdan sonra harekete yeniden başlamak kademeli olmalıdır. Yürüyüş ve hafif hareketlere genellikle nasıl hissettiğine göre yeniden başlanabilir; yüksek darbeli aktiviteler ise daha fazla dikkat gerektirir.',
    s9Body2: 'Koşuya, zıplamaya veya çok yoğun antrenmanlara yeniden başlamadan önce pelvik taban toparlanmasını değerlendirmek ve varsa belirtileri dikkate almak en iyisidir.',
    s9AlertTitle: 'Aşamaları acele etme',
    s9AlertText: 'Egzersiz sırasında veya sonrasında kaçak, ağırlık hissi ya da ağrı, yavaşlaman ve yoğunluğu artırmadan önce tavsiye alman gerektiğinin işaretleridir.',
    s10Heading: 'Ne zaman bir uzmana görünmeli?',
    s10Body1: 'Bir ebe veya fizyoterapistle yapılan pelvik taban rehabilitasyonu, doğru kasıp kasmadığından emin değilsen, belirtilerin devam ediyorsa veya bazı fiziksel aktivitelere güvenle yeniden başlamak istiyorsan yararlı olabilir.',
    questionCardTitle: 'Sorulabilecek faydalı sorular',
    appointmentQuestions: [
      'Belirtilerim pelvik taban zayıflığıyla uyumlu mu?',
      'Kasılmaları doğru yapıyor muyum?',
      'Her gün kaç tekrar yapmalıyım?',
      'Koşuya, spora veya yüksek darbeli egzersizlere geri dönebilir miyim?',
      'Bir ebe veya fizyoterapistle rehabilitasyona ihtiyacım var mı?',
      'Yara izim, yırtığım veya sezaryenim özel bir önlem gerektiriyor mu?',
    ],
    s10TipTitle: 'Bilmekte fayda var',
    s10TipText: 'Bir uzmana görünmek mutlaka bir sorun olduğu anlamına gelmez. Bir seans, tekniğini kontrol etmene, toparlanmanı değerlendirmene ve doğru şekilde ilerlemeyi öğrenmene yardımcı olabilir.',
    s11Heading: 'Zaman alan bir toparlanma',
    s11Body1: 'Doğumdan sonra, gebelikten önceki hislerini veya kas gücünü hemen geri kazanamamak normaldir.',
    s11Body2: 'Amaç, olabildiğince çok kasılma yapmak değildir. Asıl mesele, kasılma ile gevşeme arasında iyi bir koordinasyonu yavaş yavaş yeniden kazanmak ve ardından bu kasları günlük aktivitelerde doğal olarak kullanabilmektir.',
    s11HighlightTitle: 'Küçük ilerlemeler de gerçek ilerlemedir',
    s11HighlightText: 'Harekete dair daha iyi bir farkındalık, kasılmayı birkaç saniye daha uzun tutabilmek veya kaçaklarda bir azalma, şimdiden cesaret verici işaretlerdir.',
    s12Heading: 'Akılda kalacaklar',
    summaryTitle: 'Özet',
    summaryItems: [
      'Gebelik ve doğum, pelvik tabanı önemli ölçüde zorlar.',
      'Doğumdan sonra kademeli toparlanma normaldir.',
      'Egzersizlerde güçten çok hareketin kalitesine öncelik verilmelidir.',
      'Nefes alma ve gevşeme, kasılma kadar önemlidir.',
      'İdrar kaçağı, ağırlık hissi veya süren ağrı bir uzmanın görüşünü hak eder.',
      'Bir ebe veya fizyoterapistle yapılan rehabilitasyon, daha iyi kontrol kazanmana yardımcı olabilir.',
      'Spora dönüş, özellikle yüksek darbeli aktivitelerde kademeli olmalıdır.',
    ],
    finalTipTitle: 'Toparlanmak için kendine zaman ver',
    finalTipText: 'Doğumdan sonra vücudun birçok değişiklikten geçti. Perine de vücudunun geri kalanı kadar ilgiyi hak eder: kademeli, düzenli ve baskı olmadan.',
    disclaimerText: 'Bu makale yalnızca bilgilendirme amaçlıdır ve kişiye özel tıbbi tavsiyenin yerini tutmaz. Ağrı, süren belirtiler yaşıyorsan veya toparlanmanla ilgili herhangi bir endişen varsa bir sağlık profesyonelinden tavsiye al.',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PerineumStrengtheningArticleScreen({
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
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
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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

        {/* ARTICLE */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={17}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* TABLE OF CONTENTS */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}

          <Text style={styles.h2}>
            1. {content.s1Heading}
          </Text>

          <Text style={styles.body}>
            {content.s1Body1}
          </Text>

          <Text style={styles.body}>
            {content.s1Body2}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="human-female"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.s1HighlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.s1HighlightText}
              </Text>
            </View>
          </View>


          {/* BENEFITS */}
          <Text style={styles.h2}>
            {content.benefitsHeading}
          </Text>

          <Text style={styles.body}>
            {content.benefitsIntro}
          </Text>

          <View style={styles.benefitsGrid}>
            {content.benefits.map(item => (
              <View key={item.title} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.benefitTitle}>
                  {item.title}
                </Text>

                <Text style={styles.benefitText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* SECTION 2 */}

          <Text style={styles.h2}>
            2. {content.s2Heading}
          </Text>

          <Text style={styles.body}>
            {content.s2Body1}
          </Text>

          <Text style={styles.body}>
            {content.s2Body2}
          </Text>

          <Text style={styles.body}>
            {content.s2Body3}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.s2TipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.s2TipText}
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>
            3. {content.s3Heading}
          </Text>

          <Text style={styles.body}>
            {content.s3Body1}
          </Text>

          <Text style={styles.body}>
            {content.s3Body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.s3AlertTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.s3AlertText}
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>
            4. {content.s4Heading}
          </Text>

          <Text style={styles.body}>
            {content.s4Body1}
          </Text>

          <Text style={styles.body}>
            {content.s4Body2}
          </Text>

          <View style={styles.daily}>
            {content.exercises.map(item => (
              <View
                key={item.label}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={item.icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="target"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.s4HighlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.s4HighlightText}
              </Text>
            </View>
          </View>

          {/* SECTION 5 */}

          <Text style={styles.h2}>
            5. {content.s5Heading}
          </Text>

          <Text style={styles.body}>
            {content.s5Body1}
          </Text>

          <Text style={styles.h3}>
            {content.s5h3a}
          </Text>

          <Text style={styles.body}>
            {content.s5Body2}
          </Text>

          <Text style={styles.h3}>
            {content.s5h3b}
          </Text>

          <Text style={styles.body}>
            {content.s5Body3}
          </Text>

          <View style={styles.dailyTips}>
            {content.dailyTips.map(item => (
              <View
                key={item.label}
                style={styles.dailyTipRow}>
                <View style={styles.dailyTipIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.dailyTipText}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-check-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.s5TipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.s5TipText}
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>
            6. {content.s6Heading}
          </Text>

          <Text style={styles.body}>
            {content.s6Body1}
          </Text>

          <View style={styles.warningList}>
            {content.commonMistakes.map(item => (
              <View
                key={item}
                style={styles.warningRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.s6TipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.s6TipText}
              </Text>
            </View>
          </View>

          {/* SECTION 7 */}

          <Text style={styles.h2}>
            7. {content.s7Heading}
          </Text>

          <Text style={styles.body}>
            {content.s7Body1}
          </Text>

          <View style={styles.consultList}>
            {content.warningSigns.map((item, index) => (
              <View
                key={item}
                style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.consultCopy}>
                  <Text style={styles.consultTitle}>
                    {index + 1}. {content.consultLabel}
                  </Text>

                  <Text style={styles.consultText}>
                    {item}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.s7Body2}
          </Text>

          {/* SECTION 8 */}

          <Text style={styles.h2}>
            8. {content.s8Heading}
          </Text>

          <Text style={styles.body}>
            {content.s8Body1}
          </Text>

          <Text style={styles.body}>
            {content.s8Body2}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="doctor"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.s8HighlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.s8HighlightText}
              </Text>
            </View>
          </View>

          {/* SECTION 9 */}

          <Text style={styles.h2}>
            9. {content.s9Heading}
          </Text>

          <Text style={styles.body}>
            {content.s9Body1}
          </Text>

          <Text style={styles.body}>
            {content.s9Body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="run-fast"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.s9AlertTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.s9AlertText}
              </Text>
            </View>
          </View>

          {/* SECTION 10 */}

          <Text style={styles.h2}>
            10. {content.s10Heading}
          </Text>

          <Text style={styles.body}>
            {content.s10Body1}
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                {content.questionCardTitle}
              </Text>
            </View>

            {content.appointmentQuestions.map(
              (item, index) => (
                <View
                  key={item}
                  style={styles.questionRow}>
                  <View style={styles.questionBullet}>
                    <Text style={styles.questionNumber}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.questionText}>
                    {item}
                  </Text>
                </View>
              ),
            )}
          </View>

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.s10TipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.s10TipText}
              </Text>
            </View>
          </View>

          {/* SECTION 11 */}

          <Text style={styles.h2}>
            11. {content.s11Heading}
          </Text>

          <Text style={styles.body}>
            {content.s11Body1}
          </Text>

          <Text style={styles.body}>
            {content.s11Body2}
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="progress-check"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.s11HighlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.s11HighlightText}
              </Text>
            </View>
          </View>

          {/* SUMMARY */}

          <Text style={styles.h2}>
            12. {content.s12Heading}
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>
                {content.summaryTitle}
              </Text>
            </View>

            {content.summaryItems.map(item => (
              <View
                key={item}
                style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* FINAL TIP */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.finalTipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.finalTipText}
              </Text>
            </View>
          </View>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={8}
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
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
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
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  h3: {
    marginTop: 21,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '800',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },

  highlight: {
    marginTop: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 11,
  },

  highlightTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.textMuted,
  },


  benefitsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  benefitCard: {
    width: '48.5%',
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  benefitTitle: {
    marginTop: 9,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
    fontWeight: '800',
  },

  benefitText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16.5,
    color: theme.colors.textMuted,
  },

  daily: {
    marginTop: 13,
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
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },

  dailyTips: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  dailyTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  dailyTipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  dailyTipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  warningList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 11,
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  alert: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  consultList: {
    marginTop: 14,
    gap: 10,
  },

  consultCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  consultCopy: {
    flex: 1,
    marginLeft: 11,
  },

  consultTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '800',
  },

  consultText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },

  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  questionTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  questionNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  professionalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
  });
}
