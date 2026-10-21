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

const ID = 'exercise-renforcer-perinee';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
// Icon names are language-neutral and stay paired with their translated
// label inside each language's arrays.
const CONTENT = withBrazilianPortuguese('PerineumStrengthening', {
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
  ru: {
    badge: 'ПОСЛЕРОДОВОЙ ПЕРИОД • ВОССТАНОВЛЕНИЕ',
    title: 'Укрепление мышц тазового дна\nпосле родов',
    metaDuration: '8 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro:
      'После беременности и родов мышцам тазового дна нужно время на восстановление. Простые, регулярные и постепенные упражнения помогут вернуть силу, контроль и уверенность — без попыток что-либо ускорить.',
    contentsTitle: 'В этой статье',
    topics: [
      'Роль промежности',
      'Почему роды дают на неё нагрузку',
      'Когда начинать восстановление мышц тазового дна',
      'Как правильно сокращать мышцы',
      'Как выстроить постепенную программу',
      'Каких ошибок избегать',
      'Когда обращаться за помощью',
      'Постепенное возвращение к спорту',
      'Подготовка к приёму',
      'Главное',
    ],
    shareMessage: 'Укрепление мышц тазового дна после родов — AWA',

    s1Heading: 'Роль промежности',
    s1Body1:
      'Промежность, или тазовое дно, — это группа мышц в основании таза. Она участвует в контроле мочевого пузыря и кишечника и помогает поддерживать органы малого таза.',
    s1Body2:
      'Во время беременности эти мышцы несут дополнительную нагрузку на протяжении нескольких месяцев. Значительная нагрузка приходится на них и во время родов.',
    s1HighlightTitle: 'Незаметная, но важнейшая мышца',
    s1HighlightText:
      'Тазовое дно участвует в нескольких повседневных функциях: удержании мочи и стула, контроле газов, поддержке органов малого таза, а также в некоторых аспектах сексуальной функции.',

    benefitsHeading: 'Преимущества более сильного тазового дна',
    benefitsIntro:
      'Постепенное и правильно выполняемое укрепление может помочь улучшить контроль и поддержку со стороны тазового дна.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Лучший контроль мочевого пузыря',
        text: 'Тазовое дно участвует в контроле мочевого пузыря. Постепенное укрепление может помочь уменьшить некоторые виды подтекания мочи.',
      },
      {
        icon: 'toilet',
        title: 'Поддержка работы кишечника',
        text: 'Эти мышцы также помогают контролировать газы и стул и участвуют в поддержке органов малого таза.',
      },
      {
        icon: 'human-female',
        title: 'Поддержка органов малого таза',
        text: 'Тазовое дно образует настоящую мышечную опору, которая помогает поддерживать мочевой пузырь, матку и кишечник.',
      },
      {
        icon: 'heart-pulse',
        title: 'Постепенное возвращение ощущений',
        text: 'Подходящее восстановление также может помочь лучше чувствовать эту область и контролировать её.',
      },
    ],

    s2Heading: 'Почему беременность и роды дают на него нагрузку',
    s2Body1:
      'Беременность постепенно увеличивает давление на тазовое дно. Естественные роды могут значительно растягивать мышцы и ткани этой области.',
    s2Body2:
      'Кесарево сечение тоже не полностью щадит тазовое дно: сама беременность остаётся значимым периодом для этих мышц.',
    s2Body3:
      'Поэтому после родов нормально, что восстановление занимает время. Некоторые женщины почти не ощущают симптомов, а другие могут замечать подтекание, чувство тяжести или снижение контроля над мышцами.',
    s2TipTitle: 'Каждое восстановление индивидуально',
    s2TipText:
      'На восстановление могут влиять тип родов, разрыв или эпизиотомия, наличие боли и ваше общее состояние после родов.',

    s3Heading: 'Когда начинать восстановление мышц тазового дна?',
    s3Body1:
      'После неосложнённых родов лёгкие сокращения мышц тазового дна обычно можно возобновлять постепенно. По-прежнему важно подбирать упражнения с учётом вашей ситуации и обращаться за советом, если у вас были осложнения, выраженная боль или особое вмешательство.',
    s3Body2:
      'Если у вас установлен мочевой катетер, некоторые рекомендации советуют подождать, пока его не удалят и мочеиспускание не нормализуется, прежде чем начинать упражнения для промежности.',
    s3AlertTitle: 'Не терпите боль',
    s3AlertText:
      'Выраженная боль, усиление симптомов, плохо заживающая рана или любое особое беспокойство — повод обратиться за советом к акушерке, врачу или специалисту по реабилитации.',

    s4Heading: 'Как правильно сокращать мышцы',
    s4Body1:
      'Чтобы почувствовать нужное движение, представьте, что вы одновременно пытаетесь удержать газы и позыв к мочеиспусканию. Вам нужно ощущение сокращения и подтягивания внутрь.',
    s4Body2:
      'Цель — не сильно напрячь всё тело. Ягодицы, бёдра и мышцы живота должны оставаться как можно более расслабленными, а дыхание — обычным.',
    exercises: [
      {icon: 'weather-windy', label: 'Дыхание'},
      {icon: 'human-handsup', label: 'Мягкое сокращение'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Длительное сокращение'},
      {icon: 'gesture-tap-button', label: 'Быстрые сокращения'},
    ],
    s4HighlightTitle: 'Расслабление не менее важно',
    s4HighlightText:
      'После каждого сокращения дайте мышцам полностью расслабиться. Хорошее восстановление не означает держать промежность напряжённой целый день.',

    s5Heading: 'Как выстроить постепенную программу',
    s5Body1:
      'Вначале важнее всего научиться определять нужные мышцы и правильно выполнять движение. Регулярность важнее интенсивности.',
    s5h3a: 'Длительные сокращения',
    s5Body2:
      'Мягко сократите мышцы тазового дна, затем удерживайте сокращение несколько секунд, не задерживая дыхание. После этого полностью расслабьтесь, прежде чем повторить.',
    s5h3b: 'Короткие сокращения',
    s5Body3:
      'Когда движение освоено, можно добавить небольшие быстрые сокращения. Они тренируют способность быстро сокращать мышцы при повышении внутрибрюшного давления, например непосредственно перед кашлем или чиханием.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Свяжите упражнения с ежедневной привычкой'},
      {icon: 'human-sitting', label: 'Начинайте в удобном положении'},
      {icon: 'weather-windy', label: 'Дышите обычно во время сокращений'},
      {icon: 'sleep', label: 'Соблюдайте фазы расслабления'},
      {icon: 'chart-line', label: 'Постепенно усложняйте нагрузку'},
      {icon: 'doctor', label: 'Спросите совета, если вы не уверены'},
    ],
    s5TipTitle: 'Прежде всего — регулярность',
    s5TipText:
      'Если связать упражнения с привычкой, уже вошедшей в ваш день, будет легче сохранять регулярность: после кормления, после чистки зубов или в другое удобное для вас время.',

    s6Heading: 'Распространённые ошибки, которых стоит избегать',
    s6Body1:
      'Упражнения для промежности могут казаться простыми, но легко начать подключать другие мышцы или слишком сильно напрягаться.',
    commonMistakes: [
      'Напрягать ягодицы или бёдра вместо мышц тазового дна',
      'Задерживать дыхание во время сокращения',
      'Постоянно держать мышцы сокращёнными, не давая им расслабиться',
      'Выполнять упражнения всего несколько дней, а затем бросать',
      'Намеренно прерывать струю мочи, чтобы проверить сокращение',
    ],
    s6TipTitle: 'Чего делать не следует',
    s6TipText:
      'Не рекомендуется выполнять упражнения, намеренно прерывая струю мочи. Такой способ неправильно тренирует промежность и может нарушать нормальную работу мочевого пузыря.',

    s7Heading: 'Какие симптомы должны стать поводом для обращения к врачу?',
    s7Body1:
      'После родов иногда могут появляться незначительное подтекание или необычные ощущения. Однако не стоит их игнорировать, если они сохраняются, усиливаются или мешают повседневной жизни.',
    warningSigns: [
      'Подтекание мочи при кашле, чихании, смехе или натуживании',
      'Чувство тяжести или давления внизу таза',
      'Ощущение, что во влагалище опускается комок или что-то постороннее',
      'Трудности с удержанием газов или стула',
      'Постоянная боль в области промежности',
      'Боль во время или после полового акта',
      'Трудности с определением или правильным сокращением мышц промежности',
    ],
    consultLabel: 'Когда стоит обратиться за советом?',
    s7Body2:
      'Акушерка, врач или физиотерапевт, специализирующийся на восстановлении мышц тазового дна, может оценить работу мышц и предложить подходящую программу.',

    s8Heading: 'А после разрыва, эпизиотомии или кесарева сечения?',
    s8Body1:
      'Разрыв или эпизиотомия требуют особого ухода во время заживления. При возобновлении активности следует учитывать боль, состояние шва и рекомендации, данные после родов.',
    s8Body2:
      'После кесарева сечения восстановление затрагивает также брюшную стенку и рубец. Даже если роды были не естественными, сама беременность всё равно создавала нагрузку на тазовое дно.',
    s8HighlightTitle: 'Индивидуальная помощь может быть полезной',
    s8HighlightText:
      'При значительном разрыве, боли, нарушениях мочеиспускания или работы кишечника, а также при стойких трудностях особенно полезной может оказаться оценка состояния у медицинского специалиста.',

    s9Heading: 'Постепенное возвращение к спорту',
    s9Body1:
      'Возвращаться к движению после родов следует постепенно. Ходьбу и мягкие движения, как правило, можно возобновлять ориентируясь на самочувствие, тогда как нагрузки с ударным воздействием требуют большей осторожности.',
    s9Body2:
      'Прежде чем возвращаться к бегу, прыжкам или очень интенсивным тренировкам, лучше оценить восстановление тазового дна и учесть возможные симптомы.',
    s9AlertTitle: 'Не торопитесь с этапами',
    s9AlertText:
      'Подтекание, чувство тяжести или боль во время или после упражнений — повод снизить нагрузку и обратиться за советом, прежде чем повышать интенсивность.',

    s10Heading: 'Когда обратиться к специалисту?',
    s10Body1:
      'Восстановление мышц тазового дна с акушеркой или физиотерапевтом может быть полезным, если вы не уверены, правильно ли сокращаете мышцы, если симптомы сохраняются или если вы хотите уверенно вернуться к определённым физическим нагрузкам.',
    questionCardTitle: 'Полезные вопросы для приёма',
    appointmentQuestions: [
      'Соответствуют ли мои симптомы слабости мышц тазового дна?',
      'Правильно ли я выполняю сокращения?',
      'Сколько повторений в день мне нужно делать?',
      'Можно ли мне вернуться к бегу, спорту или упражнениям с ударной нагрузкой?',
      'Нужно ли мне восстановление с акушеркой или физиотерапевтом?',
      'Требуют ли мой рубец, разрыв или кесарево сечение каких-либо особых мер предосторожности?',
    ],
    s10TipTitle: 'Полезно знать',
    s10TipText:
      'Обращение к специалисту не обязательно означает, что что-то не так. Приём может просто помочь проверить технику, оценить восстановление и научиться правильно прогрессировать.',

    s11Heading: 'Восстановление требует времени',
    s11Body1:
      'После родов нормально, что не сразу возвращаются прежние ощущения или сила мышц, которые были до беременности.',
    s11Body2:
      'Цель — не выполнить как можно больше сокращений. Скорее, важно постепенно вернуть хорошую координацию между сокращением и расслаблением, а затем естественно использовать эти мышцы в повседневных делах.',
    s11HighlightTitle: 'Небольшой прогресс — это настоящий прогресс',
    s11HighlightText:
      'Лучшее ощущение движения, несколько лишних секунд сокращения или уменьшение подтекания — уже обнадёживающие признаки.',

    s12Heading: 'Главное',
    summaryTitle: 'Самое важное',
    summaryItems: [
      'Беременность и роды дают значительную нагрузку на тазовое дно.',
      'Постепенное восстановление после родов — это нормально.',
      'В упражнениях качество движения важнее силы.',
      'Дыхание и расслабление не менее важны, чем сокращение.',
      'Подтекание мочи, чувство тяжести или стойкая боль заслуживают мнения специалиста.',
      'Восстановление с акушеркой или физиотерапевтом может помочь вернуть более хороший контроль.',
      'Возвращение к спорту должно быть постепенным, особенно при нагрузках с ударным воздействием.',
    ],

    finalTipTitle: 'Дайте себе время на восстановление',
    finalTipText:
      'После родов ваше тело прошло через множество изменений. Промежность заслуживает такого же внимания, как и остальное тело: постепенно, регулярно и без давления.',

    disclaimerText:
      'Эта статья носит исключительно информационный характер и не заменяет персональную медицинскую консультацию. Если вы испытываете боль, у вас сохраняются симптомы или есть какие-либо опасения по поводу восстановления, обратитесь за советом к медицинскому специалисту.',
  },
  de: {
    badge: 'WOCHENBETT • RÜCKBILDUNG',
    title: 'Deinen Beckenboden\nnach der Geburt stärken',
    metaDuration: '8 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Nach Schwangerschaft und Geburt braucht der Beckenboden Zeit, um sich zu erholen. Einfache, regelmäßige und schrittweise Übungen können dir helfen, Kraft, Kontrolle und Vertrauen zurückzugewinnen – ohne etwas überstürzen zu wollen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Die Rolle des Damms verstehen',
      'Warum die Geburt ihn belastet',
      'Wann die Rückbildung beginnen kann',
      'Richtig anspannen lernen',
      'Eine schrittweise Routine aufbauen',
      'Fehler, die du vermeiden solltest',
      'Wann du dir Hilfe holen solltest',
      'Sport schrittweise wieder aufnehmen',
      'Einen Termin vorbereiten',
      'Das Wichtigste in Kürze',
    ],
    shareMessage: 'Deinen Beckenboden nach der Geburt stärken – AWA',

    s1Heading: 'Die Rolle des Damms verstehen',
    s1Body1:
      'Der Damm, auch Beckenboden genannt, ist eine Muskelgruppe am unteren Ende des Beckens. Er spielt eine Rolle bei der Kontrolle von Blase und Darm und hilft, die Beckenorgane zu stützen.',
    s1Body2:
      'Während der Schwangerschaft müssen diese Muskeln mehrere Monate lang zusätzliches Gewicht tragen. Auch bei der Geburt werden sie erheblich beansprucht.',
    s1HighlightTitle: 'Ein unauffälliger, aber unverzichtbarer Muskel',
    s1HighlightText:
      'Der Beckenboden ist an mehreren Alltagsfunktionen beteiligt: Urin und Stuhl halten, Blähungen kontrollieren, die Beckenorgane stützen und bei bestimmten sexuellen Funktionen mitwirken.',

    benefitsHeading: 'Die Vorteile eines stärkeren Beckenbodens',
    benefitsIntro:
      'Ein schrittweises, korrekt ausgeführtes Training kann dazu beitragen, Kontrolle und Halt des Beckenbodens zu verbessern.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bessere Blasenkontrolle',
        text: 'Der Beckenboden spielt bei der Blasenkontrolle eine Rolle. Ihn schrittweise zu stärken, kann helfen, bestimmten Urinverlust zu verringern.',
      },
      {
        icon: 'toilet',
        title: 'Die Darmfunktion unterstützen',
        text: 'Diese Muskeln helfen auch, Blähungen und Stuhl zu kontrollieren, und tragen dazu bei, die Beckenorgane zu stützen.',
      },
      {
        icon: 'human-female',
        title: 'Die Beckenorgane stützen',
        text: 'Der Beckenboden bildet eine echte Muskelbasis, die Blase, Gebärmutter und Darm stützen hilft.',
      },
      {
        icon: 'heart-pulse',
        title: 'Das Körpergefühl schrittweise zurückgewinnen',
        text: 'Eine passende Rückbildung kann dir auch helfen, diesen Bereich wieder besser wahrzunehmen und zu kontrollieren.',
      },
    ],

    s2Heading: 'Warum Schwangerschaft und Geburt ihn belasten',
    s2Body1:
      'Die Schwangerschaft setzt den Beckenboden nach und nach stärker unter Druck. Eine vaginale Geburt kann die Muskeln und das Gewebe in diesem Bereich dann deutlich dehnen.',
    s2Body2:
      'Auch ein Kaiserschnitt schont den Beckenboden nicht vollständig: Die Schwangerschaft selbst bleibt für diese Muskeln eine bedeutende Zeit.',
    s2Body3:
      'Nach der Geburt ist es daher normal, dass die Erholung Zeit braucht. Manche Frauen spüren fast keine Beschwerden, andere bemerken Urinverlust, ein Gefühl von Schwere oder eine geringere Muskelkontrolle.',
    s2TipTitle: 'Jede Erholung ist anders',
    s2TipText:
      'Die Art der Geburt, ein Riss oder ein Dammschnitt, Schmerzen und dein allgemeiner Zustand nach der Geburt können die Erholung beeinflussen.',

    s3Heading: 'Wann kann die Beckenboden-Rückbildung beginnen?',
    s3Body1:
      'Nach einer unkomplizierten Geburt können sanfte Beckenbodenanspannungen in der Regel schrittweise wieder aufgenommen werden. Es bleibt wichtig, die Übungen an deine Situation anzupassen und Rat einzuholen, wenn es eine Komplikation, deutliche Schmerzen oder einen besonderen Eingriff gab.',
    s3Body2:
      'Wenn du einen Blasenkatheter hast, empfehlen manche Quellen, zu warten, bis er entfernt ist und das Wasserlassen wieder normal funktioniert, bevor du mit Dammübungen beginnst.',
    s3AlertTitle: 'Übe nicht gegen den Schmerz an',
    s3AlertText:
      'Deutliche Schmerzen, sich verschlimmernde Beschwerden, eine schlecht heilende Wunde oder jede besondere Sorge sind ein Grund, eine Hebamme, eine Ärztin oder einen Arzt oder eine Fachkraft für Rückbildung um Rat zu fragen.',

    s4Heading: 'Richtig anspannen lernen',
    s4Body1:
      'Um die Bewegung zu erkennen, stell dir vor, du versuchst gleichzeitig, Blähungen und den Harndrang zurückzuhalten. Die gesuchte Bewegung fühlt sich wie ein Anspannen und Heben nach innen an.',
    s4Body2:
      'Ziel ist nicht, den ganzen Körper fest anzuspannen. Gesäß, Oberschenkel und Bauchmuskeln sollten möglichst entspannt bleiben, während du ganz normal weiteratmest.',
    exercises: [
      {icon: 'weather-windy', label: 'Atmen'},
      {icon: 'human-handsup', label: 'Sanftes Anspannen'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Langes Anspannen'},
      {icon: 'gesture-tap-button', label: 'Schnelles Anspannen'},
    ],
    s4HighlightTitle: 'Entspannen ist genauso wichtig',
    s4HighlightText:
      'Lass die Muskeln nach jeder Anspannung vollständig locker. Eine gute Rückbildung bedeutet nicht, den Damm den ganzen Tag angespannt zu halten.',

    s5Heading: 'Eine schrittweise Routine aufbauen',
    s5Body1:
      'Zu Beginn ist es am wichtigsten, die Muskeln zu erkennen und die Bewegung korrekt auszuführen. Regelmäßigkeit zählt mehr als Intensität.',
    s5h3a: 'Lange Anspannungen',
    s5Body2:
      'Spanne den Beckenboden sanft an und halte die Anspannung einige Sekunden, ohne die Luft anzuhalten. Lass dann vollständig los, bevor du von vorn beginnst.',
    s5h3b: 'Kurze Anspannungen',
    s5Body3:
      'Wenn du die Bewegung beherrschst, kannst du kleine, schnelle Anspannungen hinzunehmen. Sie trainieren deine Fähigkeit, die Muskeln schnell anzuspannen, wenn der Druck im Bauchraum steigt, zum Beispiel kurz vor dem Husten oder Niesen.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Verknüpfe die Übungen mit einer Gewohnheit im Alltag'},
      {icon: 'human-sitting', label: 'Beginne in einer bequemen Position'},
      {icon: 'weather-windy', label: 'Atme beim Anspannen ganz normal weiter'},
      {icon: 'sleep', label: 'Halte die Entspannungsphasen ein'},
      {icon: 'chart-line', label: 'Steigere den Schwierigkeitsgrad schrittweise'},
      {icon: 'doctor', label: 'Hol dir Rat, wenn du unsicher bist'},
    ],
    s5TipTitle: 'Vor allem: dranbleiben',
    s5TipText:
      'Wenn du die Übungen an eine feste Gewohnheit knüpfst, fällt das Dranbleiben leichter: nach dem Stillen oder Füttern, nach dem Zähneputzen oder zu einer anderen Zeit, die für dich passt.',

    s6Heading: 'Häufige Fehler, die du vermeiden solltest',
    s6Body1:
      'Dammübungen wirken einfach, doch man gleicht leicht mit anderen Muskeln aus oder drückt zu stark.',
    commonMistakes: [
      'Gesäß oder Oberschenkel statt des Beckenbodens anspannen',
      'Während der Anspannung die Luft anhalten',
      'Die Muskeln ständig angespannt halten, ohne sie loszulassen',
      'Die Übungen nur wenige Tage machen und dann aufhören',
      'Den Urinstrahl absichtlich unterbrechen, um die Anspannung zu überprüfen',
    ],
    s6TipTitle: 'Was du nicht tun solltest',
    s6TipText:
      'Es wird nicht empfohlen, die Übungen zu machen, indem du den Urinstrahl absichtlich unterbrichst. Diese Methode trainiert den Damm nicht richtig und kann die normale Blasenfunktion stören.',

    s7Heading: 'Bei welchen Beschwerden solltest du ärztlichen Rat suchen?',
    s7Body1:
      'Leichter Urinverlust oder ein ungewohntes Gefühl können nach der Geburt manchmal auftreten. Man sollte sie jedoch nicht ignorieren, wenn sie anhalten, schlimmer werden oder deinen Alltag beeinträchtigen.',
    warningSigns: [
      'Urinverlust beim Husten, Niesen, Lachen oder Pressen',
      'Ein Gefühl von Schwere oder Druck im unteren Becken',
      'Das Gefühl, dass sich ein Knoten oder etwas in die Scheide senkt',
      'Schwierigkeiten, Blähungen oder Stuhl zu halten',
      'Anhaltende Schmerzen im Dammbereich',
      'Schmerzen beim oder nach dem Geschlechtsverkehr',
      'Schwierigkeiten, die Dammmuskeln zu erkennen oder richtig anzuspannen',
    ],
    consultLabel: 'Wann solltest du dir Rat holen?',
    s7Body2:
      'Eine Hebamme, eine Ärztin, ein Arzt oder eine auf Beckenbodenrückbildung spezialisierte Physiotherapeutin oder ein Physiotherapeut kann die Muskelfunktion überprüfen und ein passendes Programm vorschlagen.',

    s8Heading: 'Und nach einem Riss, einem Dammschnitt oder einem Kaiserschnitt?',
    s8Body1:
      'Ein Riss oder Dammschnitt erfordert während der Heilung besondere Sorgfalt. Beim Wiederaufnehmen von Aktivitäten sollten Schmerzen, der Zustand der Narbe und die Hinweise nach der Geburt berücksichtigt werden.',
    s8Body2:
      'Nach einem Kaiserschnitt betrifft die Erholung auch die Bauchwand und die Narbe. Auch wenn die Geburt nicht vaginal war, hat die Schwangerschaft selbst den Beckenboden belastet.',
    s8HighlightTitle: 'Individuelle Begleitung kann helfen',
    s8HighlightText:
      'Bei einem ausgeprägten Riss, bei Schmerzen, Blasen- oder Darmbeschwerden oder anhaltenden Schwierigkeiten kann eine Untersuchung durch medizinisches Fachpersonal besonders hilfreich sein.',

    s9Heading: 'Sport schrittweise wieder aufnehmen',
    s9Body1:
      'Die Rückkehr zur Bewegung nach der Geburt sollte schrittweise erfolgen. Spazierengehen und sanfte Bewegungen können im Allgemeinen je nach Befinden wieder aufgenommen werden, während Aktivitäten mit starker Stoßbelastung mehr Vorsicht erfordern.',
    s9Body2:
      'Bevor du wieder mit Laufen, Springen oder sehr intensivem Training beginnst, ist es am besten, die Erholung des Beckenbodens einzuschätzen und eventuelle Beschwerden zu berücksichtigen.',
    s9AlertTitle: 'Überstürze die Etappen nicht',
    s9AlertText:
      'Urinverlust, ein Gefühl von Schwere oder Schmerzen während oder nach dem Sport sind Zeichen, dass du einen Gang zurückschalten und dir Rat holen solltest, bevor du die Intensität steigerst.',

    s10Heading: 'Wann zu einer Fachkraft?',
    s10Body1:
      'Eine Beckenbodenrückbildung bei einer Hebamme oder Physiotherapeutin bzw. einem Physiotherapeuten kann hilfreich sein, wenn du unsicher bist, ob du richtig anspannst, wenn deine Beschwerden anhalten oder wenn du bestimmte körperliche Aktivitäten mit Zuversicht wieder aufnehmen möchtest.',
    questionCardTitle: 'Hilfreiche Fragen für das Gespräch',
    appointmentQuestions: [
      'Passen meine Beschwerden zu einer Beckenbodenschwäche?',
      'Führe ich die Anspannungen richtig aus?',
      'Wie viele Wiederholungen sollte ich pro Tag machen?',
      'Kann ich wieder laufen, Sport treiben oder Übungen mit Stoßbelastung machen?',
      'Brauche ich eine Rückbildung bei einer Hebamme oder Physiotherapeutin bzw. einem Physiotherapeuten?',
      'Erfordert meine Narbe, mein Riss oder mein Kaiserschnitt besondere Vorsichtsmaßnahmen?',
    ],
    s10TipTitle: 'Gut zu wissen',
    s10TipText:
      'Eine Fachkraft aufzusuchen bedeutet nicht unbedingt, dass etwas nicht stimmt. Ein Termin kann einfach helfen, deine Technik zu überprüfen, deine Erholung einzuschätzen und zu lernen, wie du richtig vorankommst.',

    s11Heading: 'Eine Erholung, die Zeit braucht',
    s11Body1:
      'Nach der Geburt ist es normal, dass du nicht sofort wieder dieselben Empfindungen und dieselbe Muskelkraft hast wie vor der Schwangerschaft.',
    s11Body2:
      'Das Ziel ist nicht, möglichst viele Anspannungen zu machen. Es geht eher darum, nach und nach wieder ein gutes Zusammenspiel von Anspannung und Entspannung zu finden und diese Muskeln dann ganz selbstverständlich im Alltag einsetzen zu können.',
    s11HighlightTitle: 'Kleine Fortschritte sind echte Fortschritte',
    s11HighlightText:
      'Ein besseres Gefühl für die Bewegung, ein paar Sekunden längeres Anspannen oder weniger Urinverlust sind bereits ermutigende Zeichen.',

    s12Heading: 'Das Wichtigste in Kürze',
    summaryTitle: 'Das Wesentliche',
    summaryItems: [
      'Schwangerschaft und Geburt belasten den Beckenboden erheblich.',
      'Eine schrittweise Erholung nach der Geburt ist normal.',
      'Bei den Übungen steht die Qualität der Bewegung vor der Kraft.',
      'Atmung und Entspannung sind genauso wichtig wie die Anspannung.',
      'Urinverlust, Schweregefühl oder anhaltende Schmerzen verdienen eine fachliche Einschätzung.',
      'Eine Rückbildung bei einer Hebamme oder Physiotherapeutin bzw. einem Physiotherapeuten kann dir helfen, wieder mehr Kontrolle zu gewinnen.',
      'Die Rückkehr zum Sport sollte schrittweise erfolgen, besonders bei Aktivitäten mit Stoßbelastung.',
    ],

    finalTipTitle: 'Nimm dir die Zeit zur Erholung',
    finalTipText:
      'Nach der Geburt hat dein Körper viele Veränderungen durchgemacht. Der Damm verdient dieselbe Aufmerksamkeit wie der Rest deines Körpers: schrittweise, regelmäßig und ohne Druck.',

    disclaimerText:
      'Dieser Artikel dient ausschließlich der Information und ersetzt keine persönliche ärztliche Beratung. Wenn du Schmerzen oder anhaltende Beschwerden hast oder dir Sorgen um deine Erholung machst, hol dir den Rat von medizinischem Fachpersonal.',
  },
  zh: {
      badge: '产后 • 恢复',
      title: '产后盆底肌\n强化训练',
      metaDuration: '阅读约 8 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '怀孕和分娩之后，盆底肌需要时间恢复。简单、规律、循序渐进的练习，可以帮助你重新找回力量、控制力和信心，不必急于求成。',
      contentsTitle: '本文内容',
      topics: [
        '了解会阴的作用',
        '为什么分娩会让它承受压力',
        '何时开始盆底康复',
        '学会正确收缩',
        '建立循序渐进的练习计划',
        '需要避免的错误',
        '何时寻求帮助',
        '逐步恢复运动',
        '为就诊做准备',
        '要点回顾',
      ],
      shareMessage: '产后盆底肌强化训练 — AWA',
      s1Heading: '了解会阴的作用',
      s1Body1: '会阴，也称盆底，是位于骨盆底部的一组肌肉。它参与控制膀胱和肠道，并帮助支撑盆腔器官。',
      s1Body2: '怀孕期间，这些肌肉需要连续数月承受额外的重量。分娩时，它们也会承受很大的压力。',
      s1HighlightTitle: '低调却至关重要的肌肉',
      s1HighlightText: '盆底肌参与多项日常功能：控制尿液和粪便、控制排气、支撑盆腔器官，并在某些性功能中发挥作用。',
      benefitsHeading: '盆底肌更强健的好处',
      benefitsIntro: '循序渐进且方法正确的强化训练，有助于改善盆底肌的控制力和支撑力。',
      benefits: [
        {
          icon: 'water-outline',
          title: '更好地控制膀胱',
          text: '盆底肌在膀胱控制中发挥作用。逐步强化它，可能有助于减少某些漏尿情况。',
        },
        {
          icon: 'toilet',
          title: '辅助肠道功能',
          text: '这些肌肉同样有助于控制排气和粪便，并参与支撑盆腔器官。',
        },
        {
          icon: 'human-female',
          title: '支撑盆腔器官',
          text: '盆底肌构成一层真正的肌肉底座，帮助支撑膀胱、子宫和肠道。',
        },
        {
          icon: 'heart-pulse',
          title: '逐渐找回感觉',
          text: '合适的康复训练也能帮助你更好地感知和控制这个部位。',
        },
      ],
      s2Heading: '为什么怀孕和分娩会让盆底肌承受压力',
      s2Body1: '怀孕会让盆底肌所受的压力逐渐增加。经阴道分娩时，这个部位的肌肉和组织可能被明显拉伸。',
      s2Body2: '剖宫产也并不能完全让盆底肌免受影响：怀孕本身对这些肌肉来说就是一段负担较重的时期。',
      s2Body3: '因此，产后恢复需要时间是正常的。有些女性几乎没有任何症状，也有些人可能会注意到漏尿、下坠感或肌肉控制力下降。',
      s2TipTitle: '每个人的恢复都不一样',
      s2TipText: '分娩方式、是否有撕裂或会阴侧切、是否疼痛，以及产后的整体状况，都会影响恢复。',
      s3Heading: '何时开始盆底康复？',
      s3Body1: '顺产且没有并发症的话，通常可以逐步恢复轻柔的盆底肌收缩。仍然需要根据自己的情况调整练习；如果你经历过并发症、明显的疼痛或特殊的操作，请先咨询专业人员。',
      s3Body2: '如果你留置了导尿管，一些建议是等到拔除导尿管、恢复正常排尿后，再开始会阴练习。',
      s3AlertTitle: '不要忍痛硬撑',
      s3AlertText: '明显的疼痛、症状加重、伤口愈合不良，或任何特别的担忧，都应向助产士、医生或康复专业人员寻求建议。',
      s4Heading: '学会正确收缩',
      s4Body1: '要找到正确的动作，可以想象同时憋住排气和尿意。你要找的是一种向内收紧、向上提的感觉。',
      s4Body2: '目标不是让全身都紧绷。臀部、大腿和腹肌应尽量保持放松，同时正常呼吸。',
      exercises: [
        {
          icon: 'weather-windy',
          label: '呼吸',
        },
        {
          icon: 'human-handsup',
          label: '轻柔收缩',
        },
        {
          icon: 'arrow-up-bold-circle-outline',
          label: '长收缩',
        },
        {
          icon: 'gesture-tap-button',
          label: '快速收缩',
        },
      ],
      s4HighlightTitle: '放松同样重要',
      s4HighlightText: '每次收缩之后，让肌肉完全放松。好的康复训练，并不是让会阴整天保持收紧。',
      s5Heading: '建立循序渐进的练习计划',
      s5Body1: '一开始，最重要的是学会找到这些肌肉，并正确完成动作。坚持比强度更重要。',
      s5h3a: '长收缩',
      s5Body2: '轻轻收缩盆底肌，然后保持收缩几秒钟，不要屏住呼吸。接着完全放松，再重新开始。',
      s5h3b: '短收缩',
      s5Body3: '动作掌握之后，可以加入小幅度的快速收缩。它们有助于训练你在腹压升高时迅速收缩肌肉的能力，例如在咳嗽或打喷嚏之前。',
      dailyTips: [
        {
          icon: 'clock-outline',
          label: '把练习和日常习惯结合起来',
        },
        {
          icon: 'human-sitting',
          label: '从舒适的姿势开始',
        },
        {
          icon: 'weather-windy',
          label: '收缩时正常呼吸',
        },
        {
          icon: 'sleep',
          label: '给放松阶段足够时间',
        },
        {
          icon: 'chart-line',
          label: '逐步增加难度',
        },
        {
          icon: 'doctor',
          label: '不确定时请咨询专业人员',
        },
      ],
      s5TipTitle: '贵在坚持',
      s5TipText: '把练习和你日常已有的习惯结合起来，会更容易坚持：比如喂奶之后、刷牙之后，或任何适合你的时间。',
      s6Heading: '常见的错误',
      s6Body1: '会阴练习看似简单，但很容易用其他肌肉代偿，或者用力过度。',
      commonMistakes: [
        '收紧的是臀部或大腿，而不是盆底肌',
        '收缩时屏住呼吸',
        '让肌肉一直保持收缩，不放松',
        '只练几天就停下来',
        '为了检验收缩效果而故意中断排尿',
      ],
      s6TipTitle: '不要这样做',
      s6TipText: '不建议通过故意中断尿流来做练习。这种方法不能正确地训练会阴，还可能干扰正常的膀胱功能。',
      s7Heading: '出现哪些症状应该就诊？',
      s7Body1: '分娩后有时会出现轻微漏尿或异常的感觉。但如果这些情况持续存在、加重或影响日常生活，就不应忽视。',
      warningSigns: [
        '咳嗽、打喷嚏、大笑或用力时漏尿',
        '下腹部盆腔有下坠感或压迫感',
        '感觉阴道里有肿块或有东西往下掉',
        '难以控制排气或粪便',
        '会阴持续疼痛',
        '性生活时或之后疼痛',
        '难以找到或正确收缩会阴肌肉',
      ],
      consultLabel: '何时应该寻求建议？',
      s7Body2: '助产士、医生，或专门从事盆底康复的物理治疗师，可以检查肌肉功能，并为你制定合适的训练方案。',
      s8Heading: '如果有撕裂、会阴侧切或剖宫产呢？',
      s8Body1: '撕裂或会阴侧切在愈合期间需要特别的护理。恢复活动时应考虑疼痛程度、伤口状况以及分娩后得到的指导。',
      s8Body2: '剖宫产之后，恢复还涉及腹壁和伤口。即使不是经阴道分娩，怀孕本身仍然给盆底肌带来了压力。',
      s8HighlightTitle: '个性化的护理会有帮助',
      s8HighlightText: '如果撕裂较严重、有疼痛、排尿或排便方面的症状，或存在持续的困扰，请医疗专业人员做一次评估会特别有帮助。',
      s9Heading: '逐步恢复运动',
      s9Body1: '分娩后恢复运动应循序渐进。散步和轻柔的活动通常可以根据身体感受逐步恢复，而高冲击的活动则需要更加谨慎。',
      s9Body2: '在恢复跑步、跳跃或高强度训练之前，最好先评估盆底肌的恢复情况，并留意任何症状。',
      s9AlertTitle: '不要急于求成',
      s9AlertText: '运动时或运动后出现漏尿、下坠感或疼痛，说明你应该放慢节奏，并在加大强度之前先寻求建议。',
      s10Heading: '何时去看专科医生？',
      s10Body1: '如果你不确定自己的收缩是否正确，症状持续存在，或者想有信心地恢复某些体育活动，请助产士或物理治疗师指导盆底康复会有帮助。',
      questionCardTitle: '可以问的问题',
      appointmentQuestions: [
        '我的症状是否符合盆底肌薄弱的表现？',
        '我的收缩动作正确吗？',
        '我每天应该做多少次？',
        '我可以恢复跑步、运动或高冲击的锻炼吗？',
        '我需要请助产士或物理治疗师做康复吗？',
        '我的伤口、撕裂或剖宫产是否需要特别的注意事项？',
      ],
      s10TipTitle: '小贴士',
      s10TipText: '去看专业人员并不一定意味着有什么问题。一次就诊也可以只是帮你检查动作是否正确、评估恢复情况，并学会如何正确地循序渐进。',
      s11Heading: '需要时间的恢复',
      s11Body1: '生完宝宝后，无法立刻找回怀孕前的感觉或肌肉力量，这是正常的。',
      s11Body2: '目标不是尽可能多地做收缩，而是逐渐重新建立收缩与放松之间的良好协调，然后能够在日常活动中自然地运用这些肌肉。',
      s11HighlightTitle: '每一点小进步都是真正的进步',
      s11HighlightText: '对动作更有感觉、收缩多坚持几秒，或者漏尿减少，都已经是令人鼓舞的信号。',
      s12Heading: '要点回顾',
      summaryTitle: '核心要点',
      summaryItems: [
        '怀孕和分娩会让盆底肌承受较大的压力。',
        '产后循序渐进地恢复是正常的。',
        '练习应优先注重动作质量，而不是力量。',
        '呼吸和放松与收缩同样重要。',
        '漏尿、下坠感或持续疼痛，值得请专业人员评估。',
        '在助产士或物理治疗师指导下进行康复，可以帮助你更好地恢复控制力。',
        '恢复运动应循序渐进，尤其是高冲击的活动。',
      ],
      finalTipTitle: '给自己恢复的时间',
      finalTipText: '分娩后，你的身体经历了许多变化。会阴值得和身体其他部位一样得到关注：循序渐进、规律坚持，不给自己压力。',
      disclaimerText: '本文仅供参考，不能替代个性化的医疗建议。如果你感到疼痛、症状持续，或对自己的恢复有任何担忧，请咨询医疗专业人员。',
    },
  id: {
    badge: 'PASCAPERSALINAN • PEMULIHAN',
    title: 'Memperkuat otot dasar panggul\nsetelah melahirkan',
    metaDuration: '8 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Setelah hamil dan melahirkan, otot dasar panggul membutuhkan waktu untuk pulih. Latihan yang sederhana, rutin, dan bertahap bisa membantumu mendapatkan kembali kekuatan, kendali, dan rasa percaya diri, tanpa perlu terburu-buru.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami peran perineum',
      'Mengapa persalinan membuatnya tertekan',
      'Kapan mulai merehabilitasi otot dasar panggul',
      'Belajar berkontraksi dengan benar',
      'Menyusun rutinitas bertahap',
      'Kesalahan yang perlu dihindari',
      'Kapan perlu meminta bantuan',
      'Kembali berolahraga secara bertahap',
      'Mempersiapkan janji temu',
      'Poin-poin penting',
    ],
    shareMessage: 'Memperkuat otot dasar panggul setelah melahirkan — AWA',
    s1Heading: 'Memahami peran perineum',
    s1Body1: 'Perineum, yang juga disebut otot dasar panggul, adalah sekelompok otot yang terletak di dasar panggul. Otot ini berperan dalam mengendalikan kandung kemih dan usus, serta membantu menopang organ-organ panggul.',
    s1Body2: 'Selama kehamilan, otot-otot ini harus menahan beban tambahan selama berbulan-bulan. Otot-otot ini juga mengalami tekanan yang besar saat persalinan.',
    s1HighlightTitle: 'Otot yang tak terlihat tetapi sangat penting',
    s1HighlightText: 'Otot dasar panggul terlibat dalam berbagai fungsi sehari-hari: menahan urine dan tinja, mengendalikan gas, menopang organ-organ panggul, dan berperan dalam beberapa fungsi seksual.',
    benefitsHeading: 'Manfaat otot dasar panggul yang lebih kuat',
    benefitsIntro: 'Penguatan yang dilakukan secara bertahap dan dengan cara yang benar bisa membantu meningkatkan kendali dan penopang otot dasar panggul.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kendali kandung kemih yang lebih baik',
        text: 'Otot dasar panggul berperan dalam mengendalikan kandung kemih. Menguatkannya secara bertahap dapat membantu mengurangi beberapa kebocoran urine.',
      },
      {
        icon: 'toilet',
        title: 'Menunjang fungsi usus',
        text: 'Otot-otot ini juga membantu mengendalikan gas dan tinja serta ikut menopang organ-organ panggul.',
      },
      {
        icon: 'human-female',
        title: 'Menopang organ-organ panggul',
        text: 'Otot dasar panggul membentuk landasan otot yang sesungguhnya untuk membantu menopang kandung kemih, rahim, dan usus.',
      },
      {
        icon: 'heart-pulse',
        title: 'Pelan-pelan mendapatkan kembali sensasi',
        text: 'Rehabilitasi yang tepat juga bisa membantumu memiliki kesadaran dan kendali yang lebih baik pada area ini.',
      },
    ],
    s2Heading: 'Mengapa kehamilan dan persalinan membuatnya tertekan',
    s2Body1: 'Kehamilan secara bertahap memberi tekanan yang makin besar pada otot dasar panggul. Persalinan normal kemudian bisa meregangkan otot dan jaringan di area ini secara signifikan.',
    s2Body2: 'Operasi caesar juga tidak sepenuhnya melindungi otot dasar panggul: kehamilan itu sendiri tetap merupakan masa yang berat bagi otot-otot ini.',
    s2Body3: 'Setelah melahirkan, wajar jika pemulihan membutuhkan waktu. Sebagian perempuan hampir tidak merasakan gejala, sementara yang lain mungkin mengalami kebocoran, rasa berat, atau kendali otot yang berkurang.',
    s2TipTitle: 'Setiap pemulihan berbeda',
    s2TipText: 'Jenis persalinan, adanya robekan atau episiotomi, ada tidaknya nyeri, dan kondisi tubuhmu secara umum setelah melahirkan, semuanya bisa memengaruhi pemulihan.',
    s3Heading: 'Kapan mulai merehabilitasi otot dasar panggul?',
    s3Body1: 'Setelah persalinan tanpa komplikasi, kontraksi lembut otot dasar panggul biasanya bisa dilanjutkan secara bertahap. Tetap penting untuk menyesuaikan latihan dengan kondisimu dan meminta saran jika kamu mengalami komplikasi, nyeri yang hebat, atau tindakan tertentu.',
    s3Body2: 'Jika kamu memakai kateter urine, sebagian anjuran menyarankan untuk menunggu sampai kateter dilepas dan buang air kecil sudah normal kembali sebelum mulai latihan perineum.',
    s3AlertTitle: 'Jangan memaksakan diri saat nyeri',
    s3AlertText: 'Nyeri yang hebat, gejala yang memburuk, luka yang sembuh dengan buruk, atau kekhawatiran apa pun perlu dikonsultasikan dengan bidan, dokter, atau tenaga rehabilitasi.',
    s4Heading: 'Belajar berkontraksi dengan benar',
    s4Body1: 'Untuk mengenali gerakannya, bayangkan kamu sedang berusaha menahan gas sekaligus menahan keinginan buang air kecil. Gerakan yang kamu cari adalah sensasi mengencang dan terangkat ke arah dalam.',
    s4Body2: 'Tujuannya bukan menegangkan seluruh tubuh dengan kuat. Bokong, paha, dan perut sebaiknya tetap serileks mungkin, sementara napas tetap berjalan normal.',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'Pernapasan',
      },
      {
        icon: 'human-handsup',
        label: 'Kontraksi lembut',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'Kontraksi panjang',
      },
      {
        icon: 'gesture-tap-button',
        label: 'Kontraksi cepat',
      },
    ],
    s4HighlightTitle: 'Relaksasi sama pentingnya',
    s4HighlightText: 'Setelah setiap kontraksi, biarkan otot rileks sepenuhnya. Rehabilitasi yang baik bukan berarti menjaga perineum tetap mengencang sepanjang hari.',
    s5Heading: 'Menyusun rutinitas bertahap',
    s5Body1: 'Pada awalnya, hal terpenting adalah belajar mengenali ototnya dan melakukan gerakan dengan benar. Konsistensi lebih penting daripada intensitas.',
    s5h3a: 'Kontraksi panjang',
    s5Body2: 'Kencangkan otot dasar panggul dengan lembut, lalu tahan kontraksi selama beberapa detik tanpa menahan napas. Setelah itu lepaskan sepenuhnya sebelum mengulang lagi.',
    s5h3b: 'Kontraksi pendek',
    s5Body3: 'Setelah gerakannya dikuasai, kontraksi kecil yang cepat bisa ditambahkan. Kontraksi ini melatih kemampuanmu mengencangkan otot dengan cepat saat tekanan perut meningkat, misalnya tepat sebelum batuk atau bersin.',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'Kaitkan latihan dengan kebiasaan harian',
      },
      {
        icon: 'human-sitting',
        label: 'Mulailah dalam posisi yang nyaman',
      },
      {
        icon: 'weather-windy',
        label: 'Bernapaslah secara normal saat berkontraksi',
      },
      {
        icon: 'sleep',
        label: 'Hargai fase relaksasi',
      },
      {
        icon: 'chart-line',
        label: 'Tingkatkan tingkat kesulitan secara bertahap',
      },
      {
        icon: 'doctor',
        label: 'Mintalah saran jika kamu ragu',
      },
    ],
    s5TipTitle: 'Yang utama adalah konsisten',
    s5TipText: 'Mengaitkan latihan dengan kebiasaan yang sudah ada dalam harimu bisa membuatmu lebih mudah konsisten: setelah menyusui, setelah menyikat gigi, atau di waktu lain yang cocok untukmu.',
    s6Heading: 'Kesalahan umum yang perlu dihindari',
    s6Body1: 'Latihan perineum mungkin terlihat sederhana, tetapi mudah sekali terjadi kompensasi dengan otot lain atau terlalu memaksakan diri.',
    commonMistakes: [
      'Mengencangkan bokong atau paha, bukan otot dasar panggul',
      'Menahan napas saat berkontraksi',
      'Terus-menerus menahan otot tetap mengencang tanpa membiarkannya rileks',
      'Berlatih hanya beberapa hari lalu berhenti',
      'Sengaja menghentikan aliran urine untuk memeriksa kontraksi',
    ],
    s6TipTitle: 'Yang tidak boleh dilakukan',
    s6TipText: 'Tidak dianjurkan berlatih dengan sengaja menghentikan aliran urine. Cara ini tidak melatih perineum dengan benar dan dapat mengganggu fungsi normal kandung kemih.',
    s7Heading: 'Gejala apa yang sebaiknya membuatmu berkonsultasi?',
    s7Body1: 'Kebocoran ringan atau sensasi yang tidak biasa kadang bisa muncul setelah melahirkan. Namun, jangan diabaikan jika berlangsung terus, memburuk, atau mengganggu aktivitas sehari-harimu.',
    warningSigns: [
      'Urine bocor saat batuk, bersin, tertawa, atau mengejan',
      'Rasa berat atau tekanan di panggul bagian bawah',
      'Rasa seperti ada benjolan atau sesuatu yang turun ke dalam vagina',
      'Sulit menahan gas atau tinja',
      'Nyeri yang menetap di perineum',
      'Nyeri saat atau setelah berhubungan seksual',
      'Sulit mengenali atau mengencangkan otot perineum dengan benar',
    ],
    consultLabel: 'Kapan sebaiknya meminta saran?',
    s7Body2: 'Bidan, dokter, atau fisioterapis yang mendalami rehabilitasi otot dasar panggul dapat memeriksa fungsi ototmu dan menyarankan program yang sesuai.',
    s8Heading: 'Bagaimana setelah robekan, episiotomi, atau operasi caesar?',
    s8Body1: 'Robekan atau episiotomi memerlukan perawatan khusus selama penyembuhan. Saat kembali beraktivitas, pertimbangkan rasa nyeri, kondisi bekas luka, dan arahan yang diberikan setelah persalinan.',
    s8Body2: 'Setelah operasi caesar, pemulihan juga melibatkan dinding perut dan bekas luka. Meskipun persalinannya tidak lewat vagina, kehamilan itu sendiri tetap memberi tekanan pada otot dasar panggul.',
    s8HighlightTitle: 'Perawatan yang dipersonalisasi bisa membantu',
    s8HighlightText: 'Jika robekannya cukup besar, ada nyeri, gejala pada kandung kemih atau usus, atau kesulitan yang menetap, pemeriksaan oleh tenaga kesehatan bisa sangat membantu.',
    s9Heading: 'Kembali berolahraga secara bertahap',
    s9Body1: 'Kembali bergerak setelah melahirkan sebaiknya dilakukan bertahap. Berjalan kaki dan gerakan ringan umumnya bisa dilanjutkan sesuai yang kamu rasakan, sedangkan aktivitas berdampak tinggi memerlukan kehati-hatian lebih.',
    s9Body2: 'Sebelum kembali berlari, melompat, atau berlatih dengan intensitas sangat tinggi, sebaiknya nilai dulu pemulihan otot dasar panggul dan perhatikan gejala yang ada.',
    s9AlertTitle: 'Jangan terburu-buru melewati tahapan',
    s9AlertText: 'Kebocoran, rasa berat, atau nyeri saat atau setelah berolahraga adalah tanda bahwa kamu perlu memperlambat dan meminta saran sebelum menambah intensitas.',
    s10Heading: 'Kapan perlu menemui spesialis?',
    s10Body1: 'Rehabilitasi otot dasar panggul bersama bidan atau fisioterapis bisa membantu jika kamu ragu apakah kontraksimu sudah benar, jika gejalamu menetap, atau jika kamu ingin kembali melakukan aktivitas fisik tertentu dengan percaya diri.',
    questionCardTitle: 'Pertanyaan yang berguna untuk diajukan',
    appointmentQuestions: [
      'Apakah gejalaku sesuai dengan kelemahan otot dasar panggul?',
      'Apakah aku sudah melakukan kontraksi dengan benar?',
      'Berapa kali pengulangan yang harus kulakukan setiap hari?',
      'Bolehkah aku kembali berlari, berolahraga, atau melakukan latihan berdampak tinggi?',
      'Apakah aku perlu menjalani rehabilitasi bersama bidan atau fisioterapis?',
      'Apakah bekas luka, robekan, atau operasi caesarku memerlukan kehati-hatian khusus?',
    ],
    s10TipTitle: 'Perlu diketahui',
    s10TipText: 'Menemui tenaga profesional tidak selalu berarti ada yang salah. Satu sesi bisa sekadar membantu memeriksa tekniknya, menilai pemulihanmu, dan belajar maju dengan cara yang benar.',
    s11Heading: 'Pemulihan yang membutuhkan waktu',
    s11Body1: 'Setelah melahirkan, wajar jika kamu tidak langsung mendapatkan kembali sensasi atau kekuatan otot yang sama seperti sebelum hamil.',
    s11Body2: 'Tujuannya bukan melakukan kontraksi sebanyak mungkin. Yang lebih penting adalah pelan-pelan memulihkan koordinasi yang baik antara kontraksi dan relaksasi, lalu bisa menggunakan otot-otot ini secara alami dalam aktivitas sehari-hari.',
    s11HighlightTitle: 'Kemajuan kecil adalah kemajuan nyata',
    s11HighlightText: 'Kesadaran yang lebih baik akan gerakannya, beberapa detik tambahan saat berkontraksi, atau kebocoran yang berkurang sudah merupakan tanda yang menggembirakan.',
    s12Heading: 'Poin-poin penting',
    summaryTitle: 'Intinya',
    summaryItems: [
      'Kehamilan dan persalinan memberi tekanan yang besar pada otot dasar panggul.',
      'Pemulihan yang bertahap adalah hal yang wajar setelah melahirkan.',
      'Dalam berlatih, utamakan kualitas gerakan daripada kekuatan.',
      'Pernapasan dan relaksasi sama pentingnya dengan kontraksi.',
      'Kebocoran urine, rasa berat, atau nyeri yang menetap perlu diperiksakan ke tenaga profesional.',
      'Rehabilitasi bersama bidan atau fisioterapis bisa membantumu mendapatkan kembali kendali yang lebih baik.',
      'Kembali berolahraga sebaiknya bertahap, terutama untuk aktivitas berdampak tinggi.',
    ],
    finalTipTitle: 'Luangkan waktu untuk pulih',
    finalTipText: 'Setelah melahirkan, tubuhmu telah melalui banyak perubahan. Perineum pantas mendapat perhatian yang sama seperti bagian tubuhmu yang lain: secara bertahap, rutin, dan tanpa tekanan.',
    disclaimerText: 'Artikel ini hanya untuk tujuan informasi dan tidak menggantikan saran medis yang dipersonalisasi. Jika kamu mengalami nyeri, gejala yang menetap, atau memiliki kekhawatiran tentang pemulihanmu, mintalah saran dari tenaga kesehatan.',
  },
  hi: {
    badge: 'प्रसवोत्तर • रिकवरी',
    title: 'प्रसव के बाद पेल्विक फ़्लोर\nको मज़बूत करना',
    metaDuration: '8 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित जानकारी',
    intro: 'गर्भावस्था और प्रसव के बाद पेल्विक फ़्लोर को ठीक होने के लिए समय चाहिए। आसान, नियमित और धीरे-धीरे बढ़ने वाले व्यायाम आपको ताकत, नियंत्रण और आत्मविश्वास वापस पाने में मदद कर सकते हैं, और इसके लिए जल्दबाज़ी करने की ज़रूरत नहीं है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पेरिनियम की भूमिका को समझना',
      'प्रसव से इस पर ज़ोर क्यों पड़ता है',
      'पेल्विक फ़्लोर रिहैबिलिटेशन कब शुरू करें',
      'सही तरह से संकुचन करना सीखना',
      'धीरे-धीरे बढ़ने वाली दिनचर्या बनाना',
      'किन गलतियों से बचें',
      'मदद कब लें',
      'धीरे-धीरे खेल-कूद फिर शुरू करना',
      'अपॉइंटमेंट की तैयारी',
      'मुख्य बातें',
    ],
    shareMessage: 'प्रसव के बाद पेल्विक फ़्लोर को मज़बूत करना — AWA',
    s1Heading: 'पेरिनियम की भूमिका को समझना',
    s1Body1: 'पेरिनियम, जिसे पेल्विक फ़्लोर भी कहते हैं, श्रोणि (पेल्विस) के निचले हिस्से में मौजूद मांसपेशियों का एक समूह है। यह मूत्राशय और आँतों पर नियंत्रण में भूमिका निभाता है और श्रोणि के अंगों को सहारा देने में मदद करता है।',
    s1Body2: 'गर्भावस्था के दौरान इन मांसपेशियों को कई महीनों तक अतिरिक्त वज़न उठाना पड़ता है। प्रसव के दौरान भी इन पर काफ़ी ज़ोर पड़ता है।',
    s1HighlightTitle: 'एक अनदेखी, पर बेहद ज़रूरी मांसपेशी',
    s1HighlightText: 'पेल्विक फ़्लोर रोज़मर्रा के कई कामों में शामिल है: पेशाब और मल को रोकना, गैस पर नियंत्रण रखना, श्रोणि के अंगों को सहारा देना, और कुछ यौन क्रियाओं में भूमिका निभाना।',
    benefitsHeading: 'मज़बूत पेल्विक फ़्लोर के फ़ायदे',
    benefitsIntro: 'धीरे-धीरे और सही तरीके से की गई मज़बूती पेल्विक फ़्लोर के नियंत्रण और सहारे को बेहतर बनाने में मदद कर सकती है।',
    benefits: [
      {
        icon: 'water-outline',
        title: 'मूत्राशय पर बेहतर नियंत्रण',
        text: 'पेल्विक फ़्लोर मूत्राशय के नियंत्रण में भूमिका निभाता है। इसे धीरे-धीरे मज़बूत करने से पेशाब के कुछ रिसाव कम हो सकते हैं।',
      },
      {
        icon: 'toilet',
        title: 'आँतों के काम में सहारा',
        text: 'ये मांसपेशियाँ गैस और मल को रोकने में भी मदद करती हैं और श्रोणि के अंगों को सहारा देने में योगदान देती हैं।',
      },
      {
        icon: 'human-female',
        title: 'श्रोणि के अंगों को सहारा',
        text: 'पेल्विक फ़्लोर एक मज़बूत मांसपेशीय आधार बनाता है, जो मूत्राशय, गर्भाशय और आँत को सहारा देने में मदद करता है।',
      },
      {
        icon: 'heart-pulse',
        title: 'धीरे-धीरे संवेदना लौटना',
        text: 'सही रिहैबिलिटेशन से इस हिस्से के प्रति आपकी जागरूकता और नियंत्रण भी बेहतर हो सकता है।',
      },
    ],
    s2Heading: 'गर्भावस्था और प्रसव से इस पर ज़ोर क्यों पड़ता है',
    s2Body1: 'गर्भावस्था में पेल्विक फ़्लोर पर धीरे-धीरे दबाव बढ़ता जाता है। इसके बाद सामान्य (योनि से) प्रसव में इस हिस्से की मांसपेशियाँ और ऊतक काफ़ी खिंच सकते हैं।',
    s2Body2: 'सिज़ेरियन (सी-सेक्शन) में भी पेल्विक फ़्लोर पूरी तरह बचा नहीं रहता: गर्भावस्था का समय अपने आप में इन मांसपेशियों के लिए अहम दौर होता है।',
    s2Body3: 'इसलिए प्रसव के बाद ठीक होने में समय लगना सामान्य है। कुछ महिलाओं को लगभग कोई लक्षण महसूस नहीं होता, जबकि कुछ को रिसाव, भारीपन का एहसास या मांसपेशियों पर कम नियंत्रण महसूस हो सकता है।',
    s2TipTitle: 'हर किसी की रिकवरी अलग होती है',
    s2TipText: 'प्रसव का तरीका, कट या एपिसियोटॉमी, दर्द का होना और प्रसव के बाद आपकी सामान्य सेहत, ये सभी रिकवरी पर असर डाल सकते हैं।',
    s3Heading: 'पेल्विक फ़्लोर रिहैबिलिटेशन कब शुरू करें?',
    s3Body1: 'बिना किसी जटिलता वाले प्रसव के बाद आमतौर पर पेल्विक फ़्लोर के हल्के संकुचन धीरे-धीरे फिर शुरू किए जा सकते हैं। व्यायाम को अपनी स्थिति के अनुसार ढालना और अगर कोई जटिलता, तेज़ दर्द या कोई ख़ास प्रक्रिया हुई हो तो सलाह लेना ज़रूरी है।',
    s3Body2: 'अगर आपको यूरिनरी कैथेटर लगा है, तो कुछ सिफ़ारिशों के अनुसार पेरिनियम के व्यायाम शुरू करने से पहले उसे हटाए जाने और सामान्य रूप से पेशाब शुरू होने तक रुकना चाहिए।',
    s3AlertTitle: 'दर्द सहकर ज़ोर न लगाएँ',
    s3AlertText: 'तेज़ दर्द, बढ़ते लक्षण, ठीक से न भरता घाव, या कोई भी ख़ास चिंता हो तो दाई-नर्स (मिडवाइफ़), डॉक्टर या रिहैबिलिटेशन विशेषज्ञ से सलाह लें।',
    s4Heading: 'सही तरह से संकुचन करना सीखना',
    s4Body1: 'इस गति को पहचानने के लिए कल्पना करें कि आप एक साथ गैस को और पेशाब की इच्छा को रोकने की कोशिश कर रही हैं। आपको जिस गति की तलाश है, वह भीतर की ओर सिकुड़ने और ऊपर खिंचने का एहसास है।',
    s4Body2: 'लक्ष्य पूरे शरीर को कसकर तनाव में लाना नहीं है। आपके नितंब, जाँघें और पेट की मांसपेशियाँ जितना हो सके ढीली रहनी चाहिए, और साँस सामान्य रूप से चलती रहनी चाहिए।',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'साँस लेना',
      },
      {
        icon: 'human-handsup',
        label: 'हल्का संकुचन',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'लंबा संकुचन',
      },
      {
        icon: 'gesture-tap-button',
        label: 'तेज़ संकुचन',
      },
    ],
    s4HighlightTitle: 'ढीला छोड़ना भी उतना ही ज़रूरी है',
    s4HighlightText: 'हर संकुचन के बाद मांसपेशियों को पूरी तरह ढीला छोड़ दें। सही रिहैबिलिटेशन का मतलब पूरे दिन पेरिनियम को सिकोड़े रखना नहीं है।',
    s5Heading: 'धीरे-धीरे बढ़ने वाली दिनचर्या बनाना',
    s5Body1: 'शुरुआत में सबसे ज़रूरी बात है मांसपेशियों को पहचानना और गति को सही तरह से करना सीखना। नियमितता तीव्रता से ज़्यादा मायने रखती है।',
    s5h3a: 'लंबे संकुचन',
    s5Body2: 'पेल्विक फ़्लोर को हल्के से सिकोड़ें, फिर साँस रोके बिना संकुचन को कुछ सेकंड तक बनाए रखें। इसके बाद पूरी तरह ढीला छोड़ें और फिर दोबारा शुरू करें।',
    s5h3b: 'छोटे संकुचन',
    s5Body3: 'जब गति ठीक से आ जाए, तो छोटे और तेज़ संकुचन जोड़े जा सकते हैं। ये पेट पर दबाव बढ़ने पर, जैसे खाँसने या छींकने से ठीक पहले, मांसपेशियों को जल्दी सिकोड़ने की आपकी क्षमता को मज़बूत करते हैं।',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'व्यायाम को रोज़ की किसी आदत के साथ जोड़ें',
      },
      {
        icon: 'human-sitting',
        label: 'आरामदायक स्थिति में शुरू करें',
      },
      {
        icon: 'weather-windy',
        label: 'संकुचन के दौरान सामान्य रूप से साँस लें',
      },
      {
        icon: 'sleep',
        label: 'आराम के पलों का ध्यान रखें',
      },
      {
        icon: 'chart-line',
        label: 'कठिनाई धीरे-धीरे बढ़ाएँ',
      },
      {
        icon: 'doctor',
        label: 'संदेह हो तो सलाह लें',
      },
    ],
    s5TipTitle: 'सबसे ज़्यादा नियमितता',
    s5TipText: 'व्यायाम को अपने दिन की किसी मौजूदा आदत के साथ जोड़ने से नियमित रहना आसान हो सकता है: बच्चे को दूध पिलाने के बाद, ब्रश करने के बाद, या किसी और समय पर जो आपके लिए ठीक हो।',
    s6Heading: 'आम गलतियाँ, जिनसे बचना चाहिए',
    s6Body1: 'पेरिनियम के व्यायाम देखने में आसान लगते हैं, लेकिन दूसरी मांसपेशियों से काम चलाना या ज़रूरत से ज़्यादा ज़ोर लगाना आसान है।',
    commonMistakes: [
      'पेल्विक फ़्लोर की जगह नितंब या जाँघों को कसना',
      'संकुचन के दौरान साँस रोकना',
      'मांसपेशियों को ढीला छोड़े बिना लगातार सिकोड़े रखना',
      'व्यायाम सिर्फ़ कुछ दिन करके छोड़ देना',
      'संकुचन जाँचने के लिए जानबूझकर पेशाब की धार रोकना',
    ],
    s6TipTitle: 'क्या न करें',
    s6TipText: 'जानबूझकर पेशाब की धार रोककर व्यायाम करने की सलाह नहीं दी जाती। इस तरीके से पेरिनियम सही ढंग से प्रशिक्षित नहीं होता और मूत्राशय के सामान्य कामकाज में गड़बड़ी आ सकती है।',
    s7Heading: 'किन लक्षणों पर डॉक्टर से मिलना चाहिए?',
    s7Body1: 'प्रसव के बाद हल्का रिसाव या कोई असामान्य एहसास कभी-कभी हो सकता है। लेकिन अगर यह बना रहे, बढ़ता जाए या आपकी रोज़मर्रा की ज़िंदगी में रुकावट डाले, तो इसे अनदेखा नहीं करना चाहिए।',
    warningSigns: [
      'खाँसते, छींकते, हँसते या ज़ोर लगाते समय पेशाब का रिसाव',
      'निचले श्रोणि क्षेत्र में भारीपन या दबाव का एहसास',
      'ऐसा महसूस होना कि योनि में कोई गाँठ या चीज़ नीचे खिसक रही है',
      'गैस या मल को रोकने में कठिनाई',
      'पेरिनियम में लगातार दर्द',
      'शारीरिक संबंध के दौरान या बाद में दर्द',
      'पेरिनियम की मांसपेशियों को पहचानने या सही तरह से सिकोड़ने में कठिनाई',
    ],
    consultLabel: 'सलाह कब लेनी चाहिए?',
    s7Body2: 'दाई-नर्स (मिडवाइफ़), डॉक्टर, या पेल्विक फ़्लोर रिहैबिलिटेशन में विशेषज्ञ फ़िज़ियोथेरेपिस्ट मांसपेशियों के काम की जाँच करके आपके लिए उचित कार्यक्रम सुझा सकते हैं।',
    s8Heading: 'और कट, एपिसियोटॉमी या सिज़ेरियन के बाद?',
    s8Body1: 'कट या एपिसियोटॉमी के घाव को भरते समय ख़ास देखभाल की ज़रूरत होती है। गतिविधियाँ फिर शुरू करते समय दर्द, घाव की स्थिति और प्रसव के बाद मिली सलाह का ध्यान रखना चाहिए।',
    s8Body2: 'सिज़ेरियन के बाद रिकवरी में पेट की दीवार और घाव का भी ध्यान रखना होता है। प्रसव सामान्य न होने पर भी गर्भावस्था ने पेल्विक फ़्लोर पर ज़ोर तो डाला ही है।',
    s8HighlightTitle: 'व्यक्तिगत देखभाल मददगार हो सकती है',
    s8HighlightText: 'अगर गहरा कट लगा हो, दर्द हो, पेशाब या मल से जुड़े लक्षण हों, या परेशानियाँ बनी रहें, तो स्वास्थ्य विशेषज्ञ से जाँच करवाना ख़ास तौर पर फ़ायदेमंद हो सकता है।',
    s9Heading: 'धीरे-धीरे खेल-कूद फिर शुरू करना',
    s9Body1: 'प्रसव के बाद शारीरिक गतिविधि धीरे-धीरे फिर शुरू करनी चाहिए। पैदल चलना और हल्की गतिविधियाँ आमतौर पर आपके महसूस करने के अनुसार शुरू की जा सकती हैं, जबकि ज़ोरदार झटके वाली गतिविधियों में ज़्यादा सावधानी चाहिए।',
    s9Body2: 'दौड़ने, कूदने या बहुत तीव्र वर्कआउट फिर शुरू करने से पहले बेहतर है कि पेल्विक फ़्लोर की रिकवरी का आकलन करवा लें और किसी भी लक्षण को ध्यान में रखें।',
    s9AlertTitle: 'चरणों में जल्दबाज़ी न करें',
    s9AlertText: 'व्यायाम के दौरान या बाद में रिसाव, भारीपन या दर्द इस बात के संकेत हैं कि आपको रफ़्तार धीमी करनी चाहिए और तीव्रता बढ़ाने से पहले सलाह लेनी चाहिए।',
    s10Heading: 'विशेषज्ञ से कब मिलें?',
    s10Body1: 'दाई-नर्स (मिडवाइफ़) या फ़िज़ियोथेरेपिस्ट के साथ पेल्विक फ़्लोर रिहैबिलिटेशन तब मददगार हो सकता है जब आपको पक्का न पता हो कि आप संकुचन सही कर रही हैं या नहीं, आपके लक्षण बने रहें, या आप कुछ शारीरिक गतिविधियाँ आत्मविश्वास के साथ फिर शुरू करना चाहती हों।',
    questionCardTitle: 'पूछने लायक काम के सवाल',
    appointmentQuestions: [
      'क्या मेरे लक्षण पेल्विक फ़्लोर की कमज़ोरी से मेल खाते हैं?',
      'क्या मैं संकुचन सही तरह से कर रही हूँ?',
      'मुझे रोज़ कितनी बार दोहराना चाहिए?',
      'क्या मैं दौड़ना, खेल-कूद या ज़ोरदार झटके वाला व्यायाम फिर शुरू कर सकती हूँ?',
      'क्या मुझे दाई-नर्स (मिडवाइफ़) या फ़िज़ियोथेरेपिस्ट के साथ रिहैबिलिटेशन की ज़रूरत है?',
      'क्या मेरे घाव, कट या सिज़ेरियन के लिए कोई ख़ास सावधानी ज़रूरी है?',
    ],
    s10TipTitle: 'जानने लायक बात',
    s10TipText: 'किसी विशेषज्ञ से मिलने का मतलब यह नहीं कि कुछ गड़बड़ है। एक सत्र आपकी तकनीक जाँचने, रिकवरी का आकलन करने और सही तरह से आगे बढ़ना सीखने में मदद कर सकता है।',
    s11Heading: 'रिकवरी, जिसमें समय लगता है',
    s11Body1: 'बच्चे को जन्म देने के बाद यह सामान्य है कि गर्भावस्था से पहले वाली संवेदना या मांसपेशियों की ताकत तुरंत वापस न आए।',
    s11Body2: 'लक्ष्य ज़्यादा से ज़्यादा संकुचन करना नहीं है। असली बात संकुचन और ढीला छोड़ने के बीच अच्छा तालमेल धीरे-धीरे वापस पाना है, ताकि आप इन मांसपेशियों का रोज़मर्रा की गतिविधियों में सहजता से इस्तेमाल कर सकें।',
    s11HighlightTitle: 'छोटी प्रगति भी असली प्रगति है',
    s11HighlightText: 'गति के प्रति बेहतर जागरूकता, संकुचन में कुछ सेकंड की बढ़त, या रिसाव में कमी, ये सब पहले से ही उत्साह बढ़ाने वाले संकेत हैं।',
    s12Heading: 'मुख्य बातें',
    summaryTitle: 'ज़रूरी बातें',
    summaryItems: [
      'गर्भावस्था और प्रसव पेल्विक फ़्लोर पर काफ़ी ज़ोर डालते हैं।',
      'प्रसव के बाद धीरे-धीरे ठीक होना सामान्य है।',
      'व्यायाम में ताकत से ज़्यादा गति की गुणवत्ता को प्राथमिकता देनी चाहिए।',
      'साँस लेना और ढीला छोड़ना भी संकुचन जितना ही ज़रूरी है।',
      'पेशाब का रिसाव, भारीपन या लगातार दर्द होने पर विशेषज्ञ की राय लेनी चाहिए।',
      'दाई-नर्स (मिडवाइफ़) या फ़िज़ियोथेरेपिस्ट के साथ रिहैबिलिटेशन से आप बेहतर नियंत्रण वापस पा सकती हैं।',
      'खेल-कूद में वापसी धीरे-धीरे होनी चाहिए, ख़ासकर ज़ोरदार झटके वाली गतिविधियों में।',
    ],
    finalTipTitle: 'ठीक होने के लिए समय लें',
    finalTipText: 'प्रसव के बाद आपके शरीर ने बहुत बदलाव झेले हैं। पेरिनियम को भी उतना ही ध्यान चाहिए जितना आपके बाकी शरीर को: धीरे-धीरे, नियमित रूप से और बिना किसी दबाव के।',
    disclaimerText: 'यह लेख सिर्फ़ जानकारी के लिए है और व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। अगर आपको दर्द हो, लक्षण बने रहें, या अपनी रिकवरी को लेकर कोई चिंता हो, तो स्वास्थ्य विशेषज्ञ से सलाह लें।',
  },
  sq: {
    badge: 'PAS LINDJES • RIKUPERIM',
    title: 'Forcimi i dyshemesë pelvike\npas lindjes',
    metaDuration: '8 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pas shtatzënisë dhe lindjes, dyshemeja pelvike ka nevojë për kohë që të rikuperohet. Ushtrimet e thjeshta, të rregullta dhe graduale mund të të ndihmojnë të rifitosh forcën, kontrollin dhe besimin, pa u munduar t’i nxitosh gjërat.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Të kuptojmë rolin e perineumit',
      'Pse lindja e ngarkon atë',
      'Kur fillon rehabilitimi i dyshemesë pelvike',
      'Të mësosh ta tkurrësh saktë',
      'Ndërtimi i një rutine graduale',
      'Gabime që duhen shmangur',
      'Kur duhet të kërkosh ndihmë',
      'Rifillimi gradual i sportit',
      'Përgatitja për një takim',
      'Pikat kryesore',
    ],
    shareMessage: 'Forcimi i dyshemesë pelvike pas lindjes — AWA',
    s1Heading: 'Të kuptojmë rolin e perineumit',
    s1Body1: 'Perineumi, i quajtur edhe dysheme pelvike, është një grup muskujsh që ndodhen në bazën e legenit. Ai luan rol në kontrollin e fshikëzës urinare dhe të zorrëve dhe ndihmon në mbështetjen e organeve pelvike.',
    s1Body2: 'Gjatë shtatzënisë, këta muskuj duhet të mbajnë peshë shtesë për disa muaj. Ata ngarkohen shumë edhe gjatë lindjes.',
    s1HighlightTitle: 'Një muskul diskret, por thelbësor',
    s1HighlightText: 'Dyshemeja pelvike është e përfshirë në disa funksione të përditshme: mbajtjen e urinës dhe të feces, kontrollin e gazeve, mbështetjen e organeve pelvike dhe luajtjen e një roli në disa funksione seksuale.',
    benefitsHeading: 'Përfitimet e një dysheme pelvike më të fortë',
    benefitsIntro: 'Forcimi gradual dhe i kryer saktë mund të ndihmojë në përmirësimin e kontrollit dhe të mbështetjes së dyshemesë pelvike.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kontroll më i mirë i fshikëzës urinare',
        text: 'Dyshemeja pelvike luan rol në kontrollin e fshikëzës urinare. Forcimi i saj gradual mund të ndihmojë në uljen e disa rrjedhjeve urinare.',
      },
      {
        icon: 'toilet',
        title: 'Mbështetje për funksionin e zorrëve',
        text: 'Këta muskuj ndihmojnë gjithashtu në kontrollin e gazeve dhe të feces dhe kontribuojnë në mbështetjen e organeve pelvike.',
      },
      {
        icon: 'human-female',
        title: 'Mbështetje për organet pelvike',
        text: 'Dyshemeja pelvike formon një bazë të vërtetë muskulore që ndihmon në mbajtjen e fshikëzës urinare, mitrës dhe zorrës.',
      },
      {
        icon: 'heart-pulse',
        title: 'Rifitimi gradual i ndjesisë',
        text: 'Një rehabilitim i përshtatshëm mund të të ndihmojë gjithashtu të rifitosh një ndërgjegjësim dhe kontroll më të mirë të kësaj zone.',
      },
    ],
    s2Heading: 'Pse shtatzënia dhe lindja e ngarkojnë atë',
    s2Body1: 'Shtatzënia vë gradualisht më shumë presion mbi dyshemenë pelvike. Lindja vaginale mund t’i shtrijë më pas ndjeshëm muskujt dhe indet e kësaj zone.',
    s2Body2: 'Edhe prerja cezariane nuk e kursen plotësisht dyshemenë pelvike: vetë shtatzënia mbetet një periudhë e rëndësishme për këta muskuj.',
    s2Body3: 'Pas lindjes, është pra normale që rikuperimi të marrë kohë. Disa gra nuk ndjejnë pothuajse asnjë simptomë, ndërsa të tjera mund të vënë re rrjedhje, një ndjesi rëndese ose kontroll të reduktuar të muskujve.',
    s2TipTitle: 'Çdo rikuperim është ndryshe',
    s2TipText: 'Lloji i lindjes, një këputje ose episiotomia, prania e dhimbjes dhe gjendja jote e përgjithshme pas lindjes mund të ndikojnë të gjitha në rikuperim.',
    s3Heading: 'Kur fillon rehabilitimi i dyshemesë pelvike?',
    s3Body1: 'Pas një lindjeje pa komplikime, tkurrjet e buta të dyshemesë pelvike zakonisht mund të rifillojnë gradualisht. Mbetet e rëndësishme t’i përshtatësh ushtrimet me situatën tënde dhe të kërkosh këshillë nëse ke pasur një komplikim, dhimbje të theksuar ose një ndërhyrje të veçantë.',
    s3Body2: 'Nëse ke një kateter urinar, disa rekomandime sugjerojnë të presësh derisa ai të hiqet dhe urinimi normal të rifillojë përpara se të nisësh ushtrimet e perineumit.',
    s3AlertTitle: 'Mos e shtyj përtej dhimbjes',
    s3AlertText: 'Dhimbja e theksuar, simptomat që përkeqësohen, një plagë që shërohet keq ose çdo shqetësim i veçantë kërkojnë këshillën e një mamie, mjeku ose profesionisti të rehabilitimit.',
    s4Heading: 'Të mësosh ta tkurrësh saktë',
    s4Body1: 'Për ta identifikuar lëvizjen, imagjino sikur po mundohesh të mbash gazet dhe nevojën për të urinuar në të njëjtën kohë. Lëvizja që kërkon është një ndjesi tkurrjeje dhe ngritjeje nga brenda.',
    s4Body2: 'Qëllimi nuk është të tendosësh fort gjithë trupin. Vithet, kofshët dhe muskujt e barkut duhet të mbeten sa më të çlirët, ndërsa frymëmarrja vazhdon normalisht.',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'Frymëmarrja',
      },
      {
        icon: 'human-handsup',
        label: 'Tkurrje e butë',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'Tkurrje e gjatë',
      },
      {
        icon: 'gesture-tap-button',
        label: 'Tkurrje të shpejta',
      },
    ],
    s4HighlightTitle: 'Çlirimi ka po aq rëndësi',
    s4HighlightText: 'Pas çdo tkurrjeje, lëri muskujt të çlirohen plotësisht. Një rehabilitim i mirë nuk do të thotë ta mbash perineumin të tkurrur gjatë gjithë ditës.',
    s5Heading: 'Ndërtimi i një rutine graduale',
    s5Body1: 'Në fillim, gjëja më e rëndësishme është të mësosh t’i identifikosh muskujt dhe ta kryesh lëvizjen saktë. Qëndrueshmëria ka më shumë rëndësi se intensiteti.',
    s5h3a: 'Tkurrje të gjata',
    s5Body2: 'Tkurre butë dyshemenë pelvike, pastaj mbaje tkurrjen për disa sekonda pa e mbajtur frymën. Më pas çlirohu plotësisht përpara se të fillosh përsëri.',
    s5h3b: 'Tkurrje të shkurtra',
    s5Body3: 'Pasi ta zotërosh lëvizjen, mund të shtohen tkurrje të vogla e të shpejta. Ato ndihmojnë të stërvitësh aftësinë për t’i tkurrur muskujt shpejt kur rritet presioni i barkut, për shembull pak përpara se të kollitesh ose të teshtish.',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'Lidhi ushtrimet me një zakon të përditshëm',
      },
      {
        icon: 'human-sitting',
        label: 'Fillo në një pozicion të rehatshëm',
      },
      {
        icon: 'weather-windy',
        label: 'Merr frymë normalisht gjatë tkurrjeve',
      },
      {
        icon: 'sleep',
        label: 'Respekto fazat e çlirimit',
      },
      {
        icon: 'chart-line',
        label: 'Rrit gradualisht vështirësinë',
      },
      {
        icon: 'doctor',
        label: 'Kërko këshillë nëse nuk je e sigurt',
      },
    ],
    s5TipTitle: 'Para së gjithash, qëndrueshmëria',
    s5TipText: 'Nëse ushtrimet i lidh me një zakon që e ke tashmë çdo ditë, do të të jetë më e lehtë të qëndrosh e qëndrueshme: pas një ushqyerjeje, pas larjes së dhëmbëve ose në një moment tjetër që të përshtatet.',
    s6Heading: 'Gabime të zakonshme që duhen shmangur',
    s6Body1: 'Ushtrimet e perineumit mund të duken të thjeshta, por është e lehtë të kompensosh me muskuj të tjerë ose të shtysh shumë fort.',
    commonMistakes: [
      'Tendosja e vithave ose e kofshëve në vend të dyshemesë pelvike',
      'Mbajtja e frymës gjatë tkurrjes',
      'Mbajtja e vazhdueshme e muskujve të tkurrur pa i lënë të çlirohen',
      'Kryerja e ushtrimeve vetëm për disa ditë dhe pastaj ndalimi',
      'Ndalimi i qëllimshëm i rrjedhës së urinës për të kontrolluar tkurrjen',
    ],
    s6TipTitle: 'Çfarë nuk duhet bërë',
    s6TipText: 'Nuk rekomandohet t’i praktikosh ushtrimet duke ndaluar me vetëdije rrjedhën e urinës. Kjo metodë nuk e stërvit saktë perineumin dhe mund të prishë funksionin normal të fshikëzës urinare.',
    s7Heading: 'Për cilat simptoma duhet të kërkosh një konsultë?',
    s7Body1: 'Rrjedhje të vogla ose një ndjesi e pazakontë mund të shfaqen ndonjëherë pas lindjes. Megjithatë, nuk duhen shpërfillur nëse vazhdojnë, përkeqësohen ose pengojnë jetën tënde të përditshme.',
    warningSigns: [
      'Rrjedhje urine kur kollitesh, teshtin, qesh ose bën forcë',
      'Një ndjesi rëndese ose presioni në pjesën e poshtme të legenit',
      'Një ndjesi sikur një gungë ose diçka po zbret në vaginë',
      'Vështirësi në mbajtjen e gazeve ose të feces',
      'Dhimbje e vazhdueshme në perineum',
      'Dhimbje gjatë ose pas marrëdhënies seksuale',
      'Vështirësi në identifikimin ose tkurrjen e saktë të muskujve të perineumit',
    ],
    consultLabel: 'Kur duhet të kërkosh këshillë?',
    s7Body2: 'Një mami, mjek ose fizioterapist i specializuar në rehabilitimin e dyshemesë pelvike mund të kontrollojë funksionin e muskujve dhe të propozojë një program të përshtatshëm.',
    s8Heading: 'Dhe pas një këputjeje, një episiotomie ose një prerjeje cezariane?',
    s8Body1: 'Një këputje ose episiotomia kërkon kujdes të veçantë gjatë shërimit. Rifillimi i aktiviteteve duhet të marrë parasysh dhimbjen, gjendjen e plagës dhe udhëzimet e dhëna pas lindjes.',
    s8Body2: 'Pas një prerjeje cezariane, rikuperimi përfshin edhe murin e barkut dhe plagën. Edhe nëse lindja nuk ka qenë vaginale, vetë shtatzënia e ka ngarkuar prapëseprapë dyshemenë pelvike.',
    s8HighlightTitle: 'Kujdesi i personalizuar mund të ndihmojë',
    s8HighlightText: 'Në rast të një këputjeje të rëndësishme, dhimbjeje, simptomash urinare ose të zorrëve, ose vështirësish që vazhdojnë, një vlerësim me një profesionist të shëndetësisë mund të jetë veçanërisht i dobishëm.',
    s9Heading: 'Rifillimi gradual i sportit',
    s9Body1: 'Rifillimi i lëvizjes pas lindjes duhet të jetë gradual. Ecja dhe lëvizjet e buta zakonisht mund të rifillojnë sipas asaj që ndjen, ndërsa aktivitetet me ndikim të lartë kërkojnë më shumë kujdes.',
    s9Body2: 'Përpara se të rifillosh vrapimin, kërcimin ose stërvitjen shumë intensive, është mirë të vlerësohet rikuperimi i dyshemesë pelvike dhe të merren parasysh simptomat e mundshme.',
    s9AlertTitle: 'Mos i nxito fazat',
    s9AlertText: 'Rrjedhjet, ndjesia e rëndesës ose dhimbja gjatë ose pas stërvitjes janë shenja që duhet të ngadalësosh dhe të kërkosh këshillë përpara se të rrisësh intensitetin.',
    s10Heading: 'Kur duhet të shkosh te një specialist?',
    s10Body1: 'Rehabilitimi i dyshemesë pelvike me një mami ose fizioterapist mund të jetë i dobishëm nëse nuk je e sigurt se po tkurresh saktë, nëse simptomat vazhdojnë ose nëse dëshiron të rifillosh disa aktivitete fizike me besim.',
    questionCardTitle: 'Pyetje të dobishme për t’u bërë',
    appointmentQuestions: [
      'A janë simptomat e mia në përputhje me një dobësi të dyshemesë pelvike?',
      'A po i kryej saktë tkurrjet?',
      'Sa përsëritje duhet të bëj çdo ditë?',
      'A mund të kthehem te vrapimi, sporti ose ushtrimet me ndikim të lartë?',
      'A kam nevojë për rehabilitim me një mami ose fizioterapist?',
      'A kërkon plaga ime, këputja ose prerja cezariane ndonjë masë paraprake të veçantë?',
    ],
    s10TipTitle: 'Mirë është ta dish',
    s10TipText: 'Të shkosh te një profesionist nuk do të thotë domosdoshmërisht se diçka nuk shkon. Një seancë mund të ndihmojë thjesht të kontrollosh teknikën, të vlerësosh rikuperimin dhe të mësosh të përparosh saktë.',
    s11Heading: 'Një rikuperim që kërkon kohë',
    s11Body1: 'Pas lindjes, është normale të mos rifitosh menjëherë të njëjtat ndjesi ose forcë muskulore që kishe përpara shtatzënisë.',
    s11Body2: 'Qëllimi nuk është të bësh sa më shumë tkurrje të jetë e mundur. Më shumë bëhet fjalë për të rifituar gradualisht një koordinim të mirë mes tkurrjes dhe çlirimit, dhe pastaj për të qenë në gjendje t’i përdorësh këta muskuj natyrshëm në aktivitetet e përditshme.',
    s11HighlightTitle: 'Përparimet e vogla janë përparime të vërteta',
    s11HighlightText: 'Një ndërgjegjësim më i mirë i lëvizjes, disa sekonda më shumë tkurrje ose një ulje e rrjedhjeve janë tashmë shenja inkurajuese.',
    s12Heading: 'Pikat kryesore',
    summaryTitle: 'Thelbi',
    summaryItems: [
      'Shtatzënia dhe lindja e ngarkojnë ndjeshëm dyshemenë pelvike.',
      'Rikuperimi gradual është normal pas lindjes.',
      'Ushtrimet duhet t’i japin përparësi cilësisë së lëvizjes mbi forcën.',
      'Frymëmarrja dhe çlirimi kanë po aq rëndësi sa tkurrja.',
      'Rrjedhjet urinare, ndjesia e rëndesës ose dhimbja e vazhdueshme meritojnë mendimin e një profesionisti.',
      'Rehabilitimi me një mami ose fizioterapist mund të të ndihmojë të rifitosh një kontroll më të mirë.',
      'Kthimi te sporti duhet të jetë gradual, sidomos për aktivitetet me ndikim të lartë.',
    ],
    finalTipTitle: 'Merr kohën për t’u rikuperuar',
    finalTipText: 'Pas lindjes, trupi yt ka kaluar shumë ndryshime. Perineumi meriton të njëjtën vëmendje si pjesa tjetër e trupit: gradualisht, rregullisht dhe pa presion.',
    disclaimerText: 'Ky artikull është vetëm për informim dhe nuk zëvendëson këshillën mjekësore të personalizuar. Nëse ke dhimbje, simptoma që vazhdojnë ose ndonjë shqetësim për rikuperimin tënd, kërko këshillë nga një profesionist i shëndetësisë.',
  },
  ja: {
    badge: '産後 • 回復',
    title: '出産後の骨盤底筋を\n鍛えるために',
    metaDuration: '読了8分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '内容確認済み',
    intro: '妊娠と出産を経た骨盤底筋には、回復のための時間が必要です。無理に急がず、シンプルな運動を規則的に、少しずつ続けることで、筋力やコントロール、そして自信を取り戻しやすくなります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '会陰（骨盤底筋）の役割を知る',
      '出産で負担がかかる理由',
      '骨盤底のリハビリを始める時期',
      '正しい収縮のしかたを身につける',
      '無理のない習慣をつくる',
      '避けたい間違い',
      '相談したほうがよいとき',
      'スポーツを少しずつ再開する',
      '受診の準備',
      '重要なポイント',
    ],
    shareMessage: '出産後の骨盤底筋を鍛えるために — AWA',
    s1Heading: '会陰（骨盤底筋）の役割を知る',
    s1Body1: '会陰は骨盤底筋とも呼ばれ、骨盤の底にある筋肉の集まりです。膀胱や腸のコントロールに関わり、骨盤内の臓器を支える働きがあります。',
    s1Body2: '妊娠中、これらの筋肉は何か月ものあいだ余分な重みを支えています。出産のときにも、大きな負担がかかります。',
    s1HighlightTitle: '目立たないけれど大切な筋肉',
    s1HighlightText: '骨盤底筋は、尿や便をためておくこと、おならをコントロールすること、骨盤内の臓器を支えること、そして性機能の一部など、日常のさまざまな働きに関わっています。',
    benefitsHeading: '骨盤底筋を鍛えるメリット',
    benefitsIntro: '正しい方法で少しずつ鍛えることで、骨盤底筋のコントロールや支える力を高められる場合があります。',
    benefits: [
      {
        icon: 'water-outline',
        title: '膀胱のコントロールが整う',
        text: '骨盤底筋は膀胱のコントロールに関わっています。少しずつ鍛えることで、尿もれが軽くなることがあります。',
      },
      {
        icon: 'toilet',
        title: '腸の働きを支える',
        text: 'これらの筋肉は、おならや便のコントロールにも関わり、骨盤内の臓器を支える助けにもなっています。',
      },
      {
        icon: 'human-female',
        title: '骨盤内の臓器を支える',
        text: '骨盤底筋は筋肉でできた土台となり、膀胱、子宮、腸を支える助けをしています。',
      },
      {
        icon: 'heart-pulse',
        title: '感覚を少しずつ取り戻す',
        text: '適切なリハビリは、この部分への意識やコントロールを取り戻す助けにもなります。',
      },
    ],
    s2Heading: '妊娠と出産で負担がかかる理由',
    s2Body1: '妊娠が進むにつれて、骨盤底筋への圧力は少しずつ増えていきます。経腟分娩では、この部分の筋肉や組織が大きく引き伸ばされることがあります。',
    s2Body2: '帝王切開でも骨盤底筋に負担がまったくかからないわけではありません。妊娠していた期間そのものが、これらの筋肉にとって大きな負担になるためです。',
    s2Body3: 'そのため、出産後に回復に時間がかかるのは自然なことです。ほとんど症状を感じない人もいれば、尿もれ、重たい感じ、筋肉のコントロールの低下に気づく人もいます。',
    s2TipTitle: '回復のしかたは人それぞれ',
    s2TipText: '分娩の方法、裂傷や会陰切開の有無、痛みがあるかどうか、産後の全体的な体調など、さまざまなことが回復に影響します。',
    s3Heading: '骨盤底のリハビリはいつから始める？',
    s3Body1: '問題のない出産であれば、骨盤底筋をやさしく収縮させる運動は、通常は少しずつ再開できます。合併症、強い痛み、特別な処置があった場合は、運動を自分の状況に合わせて調整し、相談することが大切です。',
    s3Body2: '尿道カテーテルを入れている場合は、カテーテルを抜いて通常の排尿ができるようになるまで、会陰の運動を待つよう勧める指針もあります。',
    s3AlertTitle: '痛みを我慢して続けない',
    s3AlertText: '強い痛み、悪化する症状、傷の治りが悪い場合、また気になることがあれば、助産師、医師、またはリハビリの専門家に相談してください。',
    s4Heading: '正しい収縮のしかたを身につける',
    s4Body1: '動きをつかむには、おならと尿意を同時にこらえるところを想像してみてください。探しているのは、内側に向かって引き上げるように収縮する感覚です。',
    s4Body2: '全身に力を入れることが目的ではありません。お尻、太もも、腹筋はできるだけ力を抜いたまま、呼吸は普段どおり続けます。',
    exercises: [
      {
        icon: 'weather-windy',
        label: '呼吸',
      },
      {
        icon: 'human-handsup',
        label: 'やさしい収縮',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: '長めの収縮',
      },
      {
        icon: 'gesture-tap-button',
        label: '素早い収縮',
      },
    ],
    s4HighlightTitle: '力を抜くことも同じくらい大切',
    s4HighlightText: '収縮したあとは、筋肉を完全に緩めてください。よいリハビリとは、会陰を一日中縮めたままにしておくことではありません。',
    s5Heading: '無理のない習慣をつくる',
    s5Body1: '最初に大切なのは、筋肉の場所をつかみ、正しい動きができるようになることです。強さよりも、続けることのほうが重要です。',
    s5h3a: '長めの収縮',
    s5Body2: '骨盤底筋をやさしく収縮させ、息を止めずに数秒間そのまま保ちます。その後、完全に緩めてから、もう一度繰り返します。',
    s5h3b: '短い収縮',
    s5Body3: '動きに慣れたら、小さく素早い収縮を加えることができます。咳やくしゃみの直前など、腹圧が高まるときに、筋肉を素早く収縮させる力を鍛えるのに役立ちます。',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: '運動を毎日の習慣と結びつける',
      },
      {
        icon: 'human-sitting',
        label: '楽な姿勢から始める',
      },
      {
        icon: 'weather-windy',
        label: '収縮中も普通に呼吸する',
      },
      {
        icon: 'sleep',
        label: '力を抜く時間を大切にする',
      },
      {
        icon: 'chart-line',
        label: '少しずつ難しくしていく',
      },
      {
        icon: 'doctor',
        label: '迷ったときは相談する',
      },
    ],
    s5TipTitle: '何より続けること',
    s5TipText: 'すでにある毎日の習慣と結びつけると、続けやすくなります。たとえば、授乳のあと、歯みがきのあと、そのほか都合のよいタイミングなどです。',
    s6Heading: '避けたいよくある間違い',
    s6Body1: '会陰の運動は簡単そうに見えますが、ほかの筋肉で代わりに動かしてしまったり、力を入れすぎたりしやすいものです。',
    commonMistakes: [
      '骨盤底筋ではなく、お尻や太ももに力を入れてしまう',
      '収縮中に息を止めてしまう',
      '筋肉を緩めずに、ずっと縮めたままにしてしまう',
      '数日だけ行ってやめてしまう',
      '収縮を確かめるために、わざと尿を途中で止める',
    ],
    s6TipTitle: 'してはいけないこと',
    s6TipText: '運動として、わざと尿を途中で止めることはお勧めできません。この方法では会陰を正しく鍛えられず、通常の膀胱の働きを乱すおそれがあります。',
    s7Heading: 'どんな症状があれば受診すべき？',
    s7Body1: '出産後に、軽い尿もれや普段と違う感覚が出ることがあります。ただし、続く場合、悪化する場合、日常生活に支障がある場合は、そのままにしないでください。',
    warningSigns: [
      '咳、くしゃみ、笑ったとき、いきんだときに尿がもれる',
      '下腹部に重たい感じや圧迫感がある',
      '腟に何かが下がってくるような、かたまりがあるような感じがする',
      'おならや便をこらえにくい',
      '会陰の痛みが続く',
      '性交中や性交後に痛みがある',
      '会陰の筋肉の場所がわからない、または正しく収縮させにくい',
    ],
    consultLabel: 'どんなときに相談すればよい？',
    s7Body2: '骨盤底のリハビリを専門とする助産師、医師、理学療法士が、筋肉の働きを確認し、合ったプログラムを提案してくれます。',
    s8Heading: '裂傷、会陰切開、帝王切開のあとは？',
    s8Body1: '裂傷や会陰切開のあとは、傷が治るまで特に気をつける必要があります。活動を再開するときは、痛み、傷あとの状態、出産後に受けた指示を考慮してください。',
    s8Body2: '帝王切開のあとは、腹壁と傷あとの回復も必要になります。経腟分娩ではなかったとしても、妊娠そのものが骨盤底筋に負担をかけていたことに変わりはありません。',
    s8HighlightTitle: '個別のケアが助けになります',
    s8HighlightText: '大きな裂傷があった場合、痛みがある場合、尿や便に関する症状がある場合、困りごとが続く場合は、医療従事者の評価を受けることがとても役立ちます。',
    s9Heading: 'スポーツを少しずつ再開する',
    s9Body1: '出産後の運動の再開は、少しずつ進めることが大切です。ウォーキングやゆるやかな動きは、体調を見ながら再開できることが多いですが、衝撃の大きい運動はより慎重に行う必要があります。',
    s9Body2: 'ランニング、ジャンプ、とても強度の高いトレーニングを再開する前に、骨盤底筋の回復の状態を確認し、症状があればそれも考慮するのが望ましいです。',
    s9AlertTitle: '段階を急がない',
    s9AlertText: '運動中や運動後の尿もれ、重たい感じ、痛みは、ペースを落として、強度を上げる前に相談したほうがよいというサインです。',
    s10Heading: '専門家に診てもらうのはどんなとき？',
    s10Body1: '正しく収縮できているか自信がないとき、症状が続くとき、安心して運動を再開したいときには、助産師や理学療法士による骨盤底のリハビリが役立つ場合があります。',
    questionCardTitle: '聞いておくと役立つ質問',
    appointmentQuestions: [
      '私の症状は、骨盤底筋の弱りと一致していますか？',
      '収縮を正しく行えていますか？',
      '毎日何回行えばよいですか？',
      'ランニングやスポーツ、衝撃の大きい運動に戻ってもよいですか？',
      '助産師や理学療法士によるリハビリが必要ですか？',
      '傷あと、裂傷、帝王切開について、特別な注意は必要ですか？',
    ],
    s10TipTitle: '知っておきたいこと',
    s10TipText: '専門家に診てもらうことは、必ずしも何か問題があるという意味ではありません。やり方の確認、回復の評価、正しい進め方を学ぶ機会として活用できます。',
    s11Heading: '時間をかけて回復していきます',
    s11Body1: '出産のあとに、妊娠前と同じ感覚や筋力がすぐに戻らないのは自然なことです。',
    s11Body2: '目標は、できるだけ多く収縮させることではありません。収縮と弛緩のよい連携を少しずつ取り戻し、日常の動作の中で自然にこれらの筋肉を使えるようになることが大切です。',
    s11HighlightTitle: '小さな進歩も確かな進歩です',
    s11HighlightText: '動きへの意識が高まる、収縮を保てる時間が数秒長くなる、尿もれが減る。これらはすでに前向きなサインです。',
    s12Heading: '重要なポイント',
    summaryTitle: '大切なこと',
    summaryItems: [
      '妊娠と出産は、骨盤底筋に大きな負担をかけます。',
      '出産後に少しずつ回復していくのは自然なことです。',
      '運動では、強さよりも動きの質を大切にしましょう。',
      '呼吸と力を抜くことは、収縮と同じくらい大切です。',
      '尿もれ、重たい感じ、続く痛みは、専門家に診てもらいましょう。',
      '助産師や理学療法士によるリハビリで、コントロールを取り戻しやすくなります。',
      'スポーツの再開は、特に衝撃の大きい運動では、少しずつ進めましょう。',
    ],
    finalTipTitle: 'ゆっくり回復する時間をとりましょう',
    finalTipText: '出産を経て、体にはたくさんの変化がありました。会陰にも、ほかの部分と同じように目を向けてあげましょう。少しずつ、規則的に、プレッシャーを感じずに。',
    disclaimerText: 'この記事は情報提供のみを目的としており、個別の医療上のアドバイスに代わるものではありません。痛みや続く症状がある場合、また回復について気になることがある場合は、医療従事者に相談してください。',
  },
  ko: {
    badge: '산후 • 회복',
    title: '출산 후\n골반저근 강화하기',
    metaDuration: '읽는 시간 8분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토를 거친 콘텐츠',
    intro: '임신과 출산을 겪은 뒤에는 골반저근이 회복될 시간이 필요해요. 간단한 운동을 규칙적으로, 조금씩 늘려 가면 서두르지 않고도 힘과 조절 능력, 그리고 자신감을 되찾는 데 도움이 될 수 있어요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '회음부의 역할 이해하기',
      '출산이 회음부에 부담을 주는 이유',
      '골반저근 재활은 언제 시작할까요',
      '올바르게 수축하는 방법 익히기',
      '단계적으로 루틴 만들기',
      '피해야 할 실수',
      '도움을 요청해야 할 때',
      '운동을 조금씩 다시 시작하기',
      '진료 준비하기',
      '핵심 정리',
    ],
    shareMessage: '출산 후 골반저근 강화하기 — AWA',
    s1Heading: '회음부의 역할 이해하기',
    s1Body1: '회음부는 골반저근이라고도 하며, 골반 아래쪽에 있는 근육들을 말해요. 방광과 장을 조절하는 데 관여하고 골반 장기를 받쳐 주는 역할을 해요.',
    s1Body2: '임신 중에는 이 근육들이 몇 달 동안 늘어난 무게를 견뎌야 해요. 출산할 때도 상당한 부담을 받아요.',
    s1HighlightTitle: '눈에 띄지 않지만 꼭 필요한 근육',
    s1HighlightText: '골반저근은 일상의 여러 기능에 관여해요. 소변과 대변을 참는 일, 가스를 조절하는 일, 골반 장기를 받치는 일, 그리고 일부 성 기능에도 역할을 해요.',
    benefitsHeading: '골반저근이 튼튼해지면 좋은 점',
    benefitsIntro: '올바른 방법으로 조금씩 강화하면 골반저근의 조절 능력과 지지력을 높이는 데 도움이 될 수 있어요.',
    benefits: [
      {
        icon: 'water-outline',
        title: '방광 조절력 향상',
        text: '골반저근은 방광을 조절하는 데 역할을 해요. 조금씩 강화하면 일부 요실금을 줄이는 데 도움이 될 수 있어요.',
      },
      {
        icon: 'toilet',
        title: '장 기능 지원',
        text: '이 근육들은 가스와 대변을 조절하는 데도 도움을 주고, 골반 장기를 받치는 데에도 기여해요.',
      },
      {
        icon: 'human-female',
        title: '골반 장기 지지',
        text: '골반저근은 방광, 자궁, 장을 받치는 데 도움이 되는 근육 바닥을 이뤄요.',
      },
      {
        icon: 'heart-pulse',
        title: '감각을 조금씩 되찾기',
        text: '알맞은 재활은 이 부위를 더 잘 느끼고 조절하는 데도 도움이 될 수 있어요.',
      },
    ],
    s2Heading: '임신과 출산이 골반저근에 부담을 주는 이유',
    s2Body1: '임신 중에는 골반저근이 받는 압력이 점점 커져요. 질식 분만을 하면 이 부위의 근육과 조직이 상당히 늘어날 수 있어요.',
    s2Body2: '제왕절개를 해도 골반저근이 완전히 부담에서 벗어나는 것은 아니에요. 임신 자체가 이 근육들에게는 큰 부담이 되는 시기예요.',
    s2Body3: '그래서 출산 후에 회복하는 데 시간이 걸리는 것은 자연스러운 일이에요. 증상을 거의 느끼지 못하는 사람도 있지만, 소변이 새거나 묵직한 느낌이 들거나 근육 조절이 잘 안 되는 것을 느끼는 사람도 있어요.',
    s2TipTitle: '회복은 사람마다 달라요',
    s2TipText: '분만 방식, 열상이나 회음절개 여부, 통증의 유무, 출산 후 전반적인 컨디션이 모두 회복에 영향을 줄 수 있어요.',
    s3Heading: '골반저근 재활은 언제 시작할까요?',
    s3Body1: '합병증 없이 출산했다면 보통 골반저근을 부드럽게 수축하는 운동을 조금씩 다시 시작할 수 있어요. 운동은 자신의 상태에 맞게 조절하는 것이 중요하며, 합병증이나 심한 통증을 겪었거나 특별한 시술을 받았다면 조언을 구하세요.',
    s3Body2: '소변 줄(요도 카테터)을 하고 있다면, 줄을 제거하고 정상적으로 소변을 볼 수 있게 된 뒤에 회음부 운동을 시작하라고 권하는 지침도 있어요.',
    s3AlertTitle: '통증을 참고 하지 마세요',
    s3AlertText: '심한 통증, 점점 심해지는 증상, 잘 아물지 않는 상처, 그리고 걱정되는 점이 있다면 조산사, 의사 또는 재활 전문가의 조언이 필요해요.',
    s4Heading: '올바르게 수축하는 방법 익히기',
    s4Body1: '동작을 찾으려면 가스를 참으면서 동시에 소변이 마려운 것도 참는다고 상상해 보세요. 찾아야 할 동작은 안쪽으로 조이면서 끌어올리는 느낌이에요.',
    s4Body2: '온몸을 꽉 긴장시키는 것이 목표가 아니에요. 엉덩이, 허벅지, 복근은 최대한 편안하게 두고 호흡은 평소처럼 이어가야 해요.',
    exercises: [
      {
        icon: 'weather-windy',
        label: '호흡',
      },
      {
        icon: 'human-handsup',
        label: '부드러운 수축',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: '길게 수축하기',
      },
      {
        icon: 'gesture-tap-button',
        label: '빠르게 수축하기',
      },
    ],
    s4HighlightTitle: '이완도 수축만큼 중요해요',
    s4HighlightText: '수축한 뒤에는 근육을 완전히 이완하세요. 좋은 재활은 하루 종일 회음부를 조이고 있는 것이 아니에요.',
    s5Heading: '단계적으로 루틴 만들기',
    s5Body1: '처음에는 근육을 찾아내고 동작을 올바르게 하는 법을 익히는 것이 가장 중요해요. 강도보다 꾸준함이 더 중요해요.',
    s5h3a: '길게 수축하기',
    s5Body2: '골반저근을 부드럽게 수축한 뒤 숨을 참지 않고 몇 초 동안 유지해요. 그런 다음 완전히 풀고 나서 다시 시작해요.',
    s5h3b: '짧게 수축하기',
    s5Body3: '동작이 익숙해지면 작고 빠른 수축을 더할 수 있어요. 복압이 높아질 때, 예를 들어 기침이나 재채기를 하기 직전에 근육을 재빨리 수축하는 능력을 기르는 데 도움이 돼요.',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: '운동을 일상 습관과 짝지어 보세요',
      },
      {
        icon: 'human-sitting',
        label: '편안한 자세로 시작하세요',
      },
      {
        icon: 'weather-windy',
        label: '수축하는 동안에도 평소처럼 숨 쉬세요',
      },
      {
        icon: 'sleep',
        label: '이완하는 시간을 지켜 주세요',
      },
      {
        icon: 'chart-line',
        label: '난이도를 조금씩 높여 가세요',
      },
      {
        icon: 'doctor',
        label: '확신이 없다면 조언을 구하세요',
      },
    ],
    s5TipTitle: '무엇보다 꾸준함',
    s5TipText: '이미 일상에 자리 잡은 습관과 운동을 짝지으면 꾸준히 하기가 더 쉬워질 수 있어요. 수유한 뒤, 양치한 뒤, 또는 편한 다른 시간에 해 보세요.',
    s6Heading: '피해야 할 흔한 실수',
    s6Body1: '회음부 운동은 간단해 보이지만, 다른 근육을 대신 쓰거나 너무 세게 힘을 주기 쉬워요.',
    commonMistakes: [
      '골반저근 대신 엉덩이나 허벅지에 힘을 주는 것',
      '수축하는 동안 숨을 참는 것',
      '근육을 이완하지 않고 계속 수축한 채로 두는 것',
      '며칠만 하고 그만두는 것',
      '수축을 확인하려고 일부러 소변 줄기를 끊는 것',
    ],
    s6TipTitle: '하지 말아야 할 것',
    s6TipText: '일부러 소변 줄기를 끊으면서 운동하는 것은 권장하지 않아요. 이 방법은 회음부를 올바르게 단련하지 못하고 정상적인 방광 기능을 방해할 수 있어요.',
    s7Heading: '어떤 증상이 있으면 진료를 받아야 할까요?',
    s7Body1: '출산 후에는 가벼운 소변 새기나 평소와 다른 느낌이 생길 수 있어요. 하지만 오래 이어지거나 심해지거나 일상생활에 지장을 준다면 그냥 넘기지 않는 것이 좋아요.',
    warningSigns: [
      '기침, 재채기, 웃음, 힘을 줄 때 소변이 새는 것',
      '아랫배 골반 쪽이 묵직하거나 눌리는 느낌',
      '질 쪽으로 덩어리나 무언가가 내려오는 듯한 느낌',
      '가스나 대변을 참기 어려운 것',
      '회음부의 통증이 계속되는 것',
      '성관계 중이나 후의 통증',
      '회음부 근육을 찾기 어렵거나 올바르게 수축하기 어려운 것',
    ],
    consultLabel: '언제 조언을 구해야 할까요?',
    s7Body2: '골반저근 재활을 전문으로 하는 조산사, 의사 또는 물리치료사가 근육 기능을 확인하고 알맞은 프로그램을 제안해 줄 수 있어요.',
    s8Heading: '열상, 회음절개, 제왕절개 후에는 어떨까요?',
    s8Body1: '열상이나 회음절개를 했다면 아무는 동안 특별한 관리가 필요해요. 활동을 다시 시작할 때는 통증, 상처의 상태, 출산 후 안내받은 내용을 고려해야 해요.',
    s8Body2: '제왕절개 후에는 복벽과 수술 상처도 회복해야 해요. 질식 분만이 아니었더라도 임신 자체가 골반저근에 부담을 주었어요.',
    s8HighlightTitle: '맞춤 관리가 도움이 될 수 있어요',
    s8HighlightText: '열상이 심했거나, 통증이나 소변·장 관련 증상이 있거나, 어려움이 계속된다면 의료 전문가에게 평가를 받는 것이 특히 도움이 될 수 있어요.',
    s9Heading: '운동을 조금씩 다시 시작하기',
    s9Body1: '출산 후에는 움직임을 조금씩 다시 늘려 가야 해요. 걷기와 부드러운 동작은 대체로 몸 상태에 맞춰 다시 시작할 수 있지만, 충격이 큰 활동은 더 조심해야 해요.',
    s9Body2: '달리기, 점프, 아주 강한 운동을 다시 시작하기 전에는 골반저근의 회복 정도를 확인하고 증상이 있는지 살펴보는 것이 좋아요.',
    s9AlertTitle: '단계를 서두르지 마세요',
    s9AlertText: '운동 중이나 운동 후에 소변이 새거나, 묵직한 느낌이 들거나, 통증이 있다면 속도를 늦추고 강도를 높이기 전에 조언을 구하라는 신호예요.',
    s10Heading: '전문가를 만나야 할 때는?',
    s10Body1: '제대로 수축하고 있는지 확신이 없을 때, 증상이 계속될 때, 또는 자신 있게 어떤 운동을 다시 시작하고 싶을 때 조산사나 물리치료사와 함께하는 골반저근 재활이 도움이 될 수 있어요.',
    questionCardTitle: '물어보면 좋은 질문',
    appointmentQuestions: [
      '제 증상이 골반저근 약화와 맞아떨어지나요?',
      '수축을 제대로 하고 있나요?',
      '하루에 몇 번씩 반복해야 하나요?',
      '달리기나 운동, 충격이 큰 운동을 다시 해도 되나요?',
      '조산사나 물리치료사와 함께 재활을 해야 하나요?',
      '제 수술 상처, 열상 또는 제왕절개 때문에 특별히 주의할 점이 있나요?',
    ],
    s10TipTitle: '알아 두면 좋아요',
    s10TipText: '전문가를 만난다고 해서 반드시 문제가 있다는 뜻은 아니에요. 한 번의 상담으로 자세를 확인하고, 회복 상태를 평가하고, 올바르게 단계를 올리는 법을 배울 수 있어요.',
    s11Heading: '시간이 걸리는 회복',
    s11Body1: '출산 후에 임신 전과 같은 감각이나 근력을 바로 되찾지 못하는 것은 자연스러운 일이에요.',
    s11Body2: '가능한 한 많이 수축하는 것이 목표가 아니에요. 수축과 이완 사이의 좋은 협응을 조금씩 되찾고, 이 근육들을 일상 활동에서 자연스럽게 쓸 수 있게 되는 것이 더 중요해요.',
    s11HighlightTitle: '작은 진전도 진짜 진전이에요',
    s11HighlightText: '동작을 더 잘 느끼게 되거나, 수축을 몇 초 더 유지하게 되거나, 소변 새는 일이 줄어드는 것만으로도 이미 희망적인 신호예요.',
    s12Heading: '핵심 정리',
    summaryTitle: '꼭 기억할 것',
    summaryItems: [
      '임신과 출산은 골반저근에 상당한 부담을 줘요.',
      '출산 후에는 조금씩 회복하는 것이 자연스러워요.',
      '운동은 힘보다 동작의 질을 우선해야 해요.',
      '호흡과 이완도 수축만큼 중요해요.',
      '소변 새기, 묵직한 느낌, 계속되는 통증은 전문가의 의견을 들어 볼 만해요.',
      '조산사나 물리치료사와 함께하는 재활은 조절 능력을 더 잘 되찾는 데 도움이 될 수 있어요.',
      '운동 복귀는 특히 충격이 큰 활동일수록 조금씩 해야 해요.',
    ],
    finalTipTitle: '회복할 시간을 충분히 가지세요',
    finalTipText: '출산 후 몸은 많은 변화를 겪었어요. 회음부도 몸의 다른 부분만큼 관심을 받을 자격이 있어요. 조금씩, 꾸준히, 부담 없이 돌봐 주세요.',
    disclaimerText: '이 아티클은 정보 제공을 목적으로 하며 개인에게 맞춘 의료 상담을 대신하지 않아요. 통증이나 계속되는 증상이 있거나 회복에 대해 걱정되는 점이 있다면 의료 전문가에게 조언을 구하세요.',
  },
  'pt-PT': {
    badge: 'PÓS-PARTO • RECUPERAÇÃO',
    title: 'Fortalecer o pavimento pélvico\napós o parto',
    metaDuration: '8 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Após a gravidez e o parto, o pavimento pélvico precisa de tempo para recuperar. Exercícios simples, regulares e progressivos podem ajudar a recuperar força, controlo e confiança, sem querer apressar as coisas.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Compreender o papel do períneo',
      'Porque é que o parto o sobrecarrega',
      'Quando iniciar a reabilitação do pavimento pélvico',
      'Aprender a contrair corretamente',
      'Construir uma rotina progressiva',
      'Erros a evitar',
      'Quando pedir ajuda',
      'Retomar o desporto de forma progressiva',
      'Preparar uma consulta',
      'Pontos essenciais',
    ],
    shareMessage: 'Fortalecer o pavimento pélvico após o parto — AWA',
    s1Heading: 'Compreender o papel do períneo',
    s1Body1: 'O períneo, também chamado pavimento pélvico, é um conjunto de músculos situado na base da bacia. Desempenha um papel no controlo da bexiga e do intestino e ajuda a sustentar os órgãos pélvicos.',
    s1Body2: 'Durante a gravidez, estes músculos têm de suportar um peso adicional durante vários meses. Também são muito solicitados durante o parto.',
    s1HighlightTitle: 'Um músculo discreto, mas essencial',
    s1HighlightText: 'O pavimento pélvico intervém em várias funções do dia a dia: reter a urina e as fezes, controlar os gases, sustentar os órgãos pélvicos e desempenhar um papel em algumas funções sexuais.',
    benefitsHeading: 'Os benefícios de um pavimento pélvico mais forte',
    benefitsIntro: 'Um fortalecimento progressivo e bem executado pode ajudar a melhorar o controlo e a sustentação do pavimento pélvico.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Melhor controlo da bexiga',
        text: 'O pavimento pélvico desempenha um papel no controlo da bexiga. Fortalecê-lo progressivamente pode ajudar a reduzir certas perdas de urina.',
      },
      {
        icon: 'toilet',
        title: 'Apoiar a função intestinal',
        text: 'Estes músculos também ajudam a controlar os gases e as fezes e contribuem para a sustentação dos órgãos pélvicos.',
      },
      {
        icon: 'human-female',
        title: 'Sustentar os órgãos pélvicos',
        text: 'O pavimento pélvico forma uma verdadeira base muscular que ajuda a sustentar a bexiga, o útero e o intestino.',
      },
      {
        icon: 'heart-pulse',
        title: 'Recuperar progressivamente a sensibilidade',
        text: 'Uma reabilitação adequada também pode ajudar a recuperar uma melhor perceção e um melhor controlo desta zona.',
      },
    ],
    s2Heading: 'Porque é que a gravidez e o parto o sobrecarregam',
    s2Body1: 'A gravidez exerce, de forma progressiva, cada vez mais pressão sobre o pavimento pélvico. O parto vaginal pode depois distender de forma significativa os músculos e os tecidos desta zona.',
    s2Body2: 'A cesariana também não poupa totalmente o pavimento pélvico: a própria gravidez continua a ser um período importante para estes músculos.',
    s2Body3: 'Depois do parto, é por isso normal que a recuperação demore. Algumas mulheres quase não sentem sintomas, enquanto outras podem notar perdas, uma sensação de peso ou um menor controlo muscular.',
    s2TipTitle: 'Cada recuperação é diferente',
    s2TipText: 'O tipo de parto, uma laceração ou episiotomia, a presença de dor e o seu estado geral após o parto podem influenciar a recuperação.',
    s3Heading: 'Quando iniciar a reabilitação do pavimento pélvico?',
    s3Body1: 'Após um parto sem complicações, as contrações suaves do pavimento pélvico podem, em geral, ser retomadas de forma progressiva. Continua a ser importante adaptar os exercícios à sua situação e pedir aconselhamento se teve uma complicação, dor intensa ou um procedimento específico.',
    s3Body2: 'Se tem uma sonda urinária, algumas recomendações sugerem esperar até que seja retirada e a micção normal tenha sido retomada antes de iniciar os exercícios do períneo.',
    s3AlertTitle: 'Não insista perante a dor',
    s3AlertText: 'Dor intensa, agravamento dos sintomas, uma ferida que cicatriza mal ou qualquer preocupação particular justificam o aconselhamento de uma parteira, de um médico ou de um profissional de reabilitação.',
    s4Heading: 'Aprender a contrair corretamente',
    s4Body1: 'Para identificar o movimento, imagine que tenta reter os gases e a vontade de urinar ao mesmo tempo. O movimento que procura é uma sensação de contração e de elevação para o interior.',
    s4Body2: 'O objetivo não é tensionar todo o corpo com força. As nádegas, as coxas e os abdominais devem permanecer o mais relaxados possível, enquanto a respiração continua normal.',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'Respiração',
      },
      {
        icon: 'human-handsup',
        label: 'Contração suave',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'Contração prolongada',
      },
      {
        icon: 'gesture-tap-button',
        label: 'Contrações rápidas',
      },
    ],
    s4HighlightTitle: 'Relaxar é tão importante como contrair',
    s4HighlightText: 'Após cada contração, deixe os músculos relaxar por completo. Uma boa reabilitação não consiste em manter o períneo contraído o dia todo.',
    s5Heading: 'Construir uma rotina progressiva',
    s5Body1: 'No início, o mais importante é aprender a identificar os músculos e a executar corretamente o movimento. A regularidade conta mais do que a intensidade.',
    s5h3a: 'Contrações prolongadas',
    s5Body2: 'Contraia suavemente o pavimento pélvico e mantenha a contração durante alguns segundos, sem suster a respiração. Depois, relaxe completamente antes de recomeçar.',
    s5h3b: 'Contrações curtas',
    s5Body3: 'Quando o movimento estiver dominado, podem acrescentar-se pequenas contrações rápidas. Ajudam a treinar a capacidade de contrair rapidamente os músculos quando a pressão abdominal aumenta, por exemplo logo antes de tossir ou espirrar.',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'Associe os exercícios a um hábito diário',
      },
      {
        icon: 'human-sitting',
        label: 'Comece numa posição confortável',
      },
      {
        icon: 'weather-windy',
        label: 'Respire normalmente durante as contrações',
      },
      {
        icon: 'sleep',
        label: 'Respeite as fases de relaxamento',
      },
      {
        icon: 'chart-line',
        label: 'Aumente a dificuldade progressivamente',
      },
      {
        icon: 'doctor',
        label: 'Peça aconselhamento em caso de dúvida',
      },
    ],
    s5TipTitle: 'Acima de tudo, regularidade',
    s5TipText: 'Associar os exercícios a um hábito que já faz parte do seu dia pode facilitar a regularidade: depois de uma mamada, depois de lavar os dentes ou noutro momento que lhe convenha.',
    s6Heading: 'Erros comuns a evitar',
    s6Body1: 'Os exercícios do períneo podem parecer simples, mas é fácil compensar com outros músculos ou fazer demasiada força.',
    commonMistakes: [
      'Tensionar as nádegas ou as coxas em vez do pavimento pélvico',
      'Suster a respiração durante a contração',
      'Manter os músculos constantemente contraídos sem os deixar relaxar',
      'Fazer os exercícios apenas durante alguns dias e depois parar',
      'Interromper deliberadamente o jato de urina para verificar a contração',
    ],
    s6TipTitle: 'O que não fazer',
    s6TipText: 'Não é recomendável praticar os exercícios interrompendo deliberadamente o jato de urina. Este método não treina corretamente o períneo e pode perturbar o funcionamento normal da bexiga.',
    s7Heading: 'Que sintomas devem levar a uma consulta?',
    s7Body1: 'Pequenas perdas ou uma sensação invulgar podem por vezes surgir após o parto. No entanto, não devem ser ignoradas se persistirem, se piorarem ou se interferirem com o seu dia a dia.',
    warningSigns: [
      'Perdas de urina ao tossir, espirrar, rir ou fazer esforço',
      'Sensação de peso ou de pressão na parte inferior da bacia',
      'Sensação de que uma bola ou algo está a descer para a vagina',
      'Dificuldade em reter gases ou fezes',
      'Dor persistente no períneo',
      'Dor durante ou após as relações sexuais',
      'Dificuldade em identificar ou contrair corretamente os músculos do períneo',
    ],
    consultLabel: 'Quando deve pedir aconselhamento?',
    s7Body2: 'Uma parteira, um médico ou um fisioterapeuta especializado em reabilitação do pavimento pélvico pode avaliar a função muscular e propor um programa adequado.',
    s8Heading: 'E após uma laceração, uma episiotomia ou uma cesariana?',
    s8Body1: 'Uma laceração ou uma episiotomia exige cuidados particulares durante a cicatrização. A retoma das atividades deve ter em conta a dor, o estado da cicatriz e as indicações dadas após o parto.',
    s8Body2: 'Após uma cesariana, a recuperação envolve também a parede abdominal e a cicatriz. Mesmo que o parto não tenha sido vaginal, a própria gravidez sobrecarregou o pavimento pélvico.',
    s8HighlightTitle: 'Um acompanhamento personalizado pode ajudar',
    s8HighlightText: 'Em caso de laceração importante, dor, sintomas urinários ou intestinais, ou dificuldades persistentes, uma avaliação com um profissional de saúde pode ser particularmente útil.',
    s9Heading: 'Retomar o desporto de forma progressiva',
    s9Body1: 'A retoma do movimento após o parto deve ser progressiva. A caminhada e os movimentos suaves podem, em geral, ser retomados consoante o que sente, ao passo que as atividades de alto impacto exigem mais cautela.',
    s9Body2: 'Antes de retomar a corrida, os saltos ou um treino muito intenso, é preferível avaliar a recuperação do pavimento pélvico e ter em conta os eventuais sintomas.',
    s9AlertTitle: 'Não queime etapas',
    s9AlertText: 'Perdas, uma sensação de peso ou dor durante ou após o exercício são sinais de que deve abrandar e pedir aconselhamento antes de aumentar a intensidade.',
    s10Heading: 'Quando consultar um especialista?',
    s10Body1: 'A reabilitação do pavimento pélvico com uma parteira ou um fisioterapeuta pode ser útil se tiver dúvidas sobre se está a contrair corretamente, se os sintomas persistirem ou se quiser retomar certas atividades físicas com confiança.',
    questionCardTitle: 'Perguntas úteis a fazer',
    appointmentQuestions: [
      'Os meus sintomas são compatíveis com uma fraqueza do pavimento pélvico?',
      'Estou a executar corretamente as contrações?',
      'Quantas repetições devo fazer por dia?',
      'Posso voltar a correr, a praticar desporto ou a fazer exercício de alto impacto?',
      'Preciso de reabilitação com uma parteira ou um fisioterapeuta?',
      'A minha cicatriz, laceração ou cesariana exige alguma precaução particular?',
    ],
    s10TipTitle: 'Bom saber',
    s10TipText: 'Consultar um profissional não significa necessariamente que algo esteja errado. Uma sessão pode simplesmente ajudar a verificar a sua técnica, avaliar a sua recuperação e aprender a progredir corretamente.',
    s11Heading: 'Uma recuperação que leva tempo',
    s11Body1: 'Depois de dar à luz, é normal não recuperar de imediato as mesmas sensações nem a mesma força muscular que tinha antes da gravidez.',
    s11Body2: 'O objetivo não é fazer o maior número possível de contrações. Trata-se sobretudo de recuperar progressivamente uma boa coordenação entre contração e relaxamento e, depois, de conseguir usar estes músculos com naturalidade nas atividades do dia a dia.',
    s11HighlightTitle: 'Pequenos progressos são progressos reais',
    s11HighlightText: 'Uma melhor perceção do movimento, alguns segundos a mais de contração ou uma redução das perdas são já sinais encorajadores.',
    s12Heading: 'Pontos essenciais',
    summaryTitle: 'O essencial',
    summaryItems: [
      'A gravidez e o parto sobrecarregam de forma significativa o pavimento pélvico.',
      'Uma recuperação progressiva é normal após o parto.',
      'Nos exercícios, deve privilegiar-se a qualidade do movimento em vez da força.',
      'A respiração e o relaxamento são tão importantes como a contração.',
      'Perdas de urina, sensação de peso ou dor persistente merecem a opinião de um profissional.',
      'A reabilitação com uma parteira ou um fisioterapeuta pode ajudar a recuperar um melhor controlo.',
      'O regresso ao desporto deve ser progressivo, sobretudo nas atividades de alto impacto.',
    ],
    finalTipTitle: 'Dê a si mesma tempo para recuperar',
    finalTipText: 'Após o parto, o seu corpo passou por muitas mudanças. O períneo merece a mesma atenção que o resto do corpo: de forma progressiva, regular e sem pressão.',
    disclaimerText: 'Este artigo tem fins meramente informativos e não substitui um aconselhamento médico personalizado. Se sentir dor ou sintomas persistentes, ou se tiver qualquer preocupação com a sua recuperação, procure o aconselhamento de um profissional de saúde.',
  },
  bn: {
    badge: 'প্রসবোত্তর • পুনরুদ্ধার',
    title: 'প্রসবের পর পেলভিক ফ্লোর\nশক্তিশালী করা',
    metaDuration: 'পড়তে 8 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'গর্ভাবস্থা ও প্রসবের পর পেলভিক ফ্লোরের সেরে উঠতে সময় লাগে। সহজ, নিয়মিত ও ধাপে ধাপে ব্যায়াম আপনাকে শক্তি, নিয়ন্ত্রণ ও আত্মবিশ্বাস ফিরে পেতে সাহায্য করতে পারে, তাড়াহুড়ো না করেই।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'পেরিনিয়ামের ভূমিকা বোঝা',
      'প্রসব কেন এতে চাপ ফেলে',
      'কখন পেলভিক ফ্লোরের পুনর্বাসন শুরু করবেন',
      'সঠিকভাবে সংকোচন করতে শেখা',
      'ধাপে ধাপে একটি রুটিন তৈরি করা',
      'যেসব ভুল এড়িয়ে চলবেন',
      'কখন সাহায্য চাইবেন',
      'ধীরে ধীরে খেলাধুলায় ফেরা',
      'অ্যাপয়েন্টমেন্টের প্রস্তুতি',
      'মূল কথা',
    ],
    shareMessage: 'প্রসবের পর পেলভিক ফ্লোর শক্তিশালী করা — AWA',
    s1Heading: 'পেরিনিয়ামের ভূমিকা বোঝা',
    s1Body1: 'পেরিনিয়াম, যাকে পেলভিক ফ্লোরও বলা হয়, শ্রোণিগহ্বরের তলদেশে অবস্থিত একটি পেশীগুচ্ছ। এটি মূত্রথলি ও অন্ত্রের নিয়ন্ত্রণে ভূমিকা রাখে এবং শ্রোণির অঙ্গগুলোকে ধরে রাখতে সাহায্য করে।',
    s1Body2: 'গর্ভাবস্থায় এই পেশীগুলোকে কয়েক মাস ধরে বাড়তি ভার বইতে হয়। প্রসবের সময়ও এগুলোর ওপর যথেষ্ট চাপ পড়ে।',
    s1HighlightTitle: 'একটি নীরব কিন্তু অপরিহার্য পেশী',
    s1HighlightText: 'পেলভিক ফ্লোর প্রতিদিনের বেশ কয়েকটি কাজে জড়িত: প্রস্রাব ও মল ধরে রাখা, গ্যাস নিয়ন্ত্রণ করা, শ্রোণির অঙ্গগুলোকে ধরে রাখা এবং কিছু যৌন কার্যে ভূমিকা রাখা।',
    benefitsHeading: 'শক্তিশালী পেলভিক ফ্লোরের উপকারিতা',
    benefitsIntro: 'ধাপে ধাপে ও সঠিকভাবে করা শক্তি বাড়ানোর ব্যায়াম পেলভিক ফ্লোরের নিয়ন্ত্রণ ও সহায়তা উন্নত করতে সাহায্য করতে পারে।',
    benefits: [
      {
        icon: 'water-outline',
        title: 'মূত্রথলির ভালো নিয়ন্ত্রণ',
        text: 'পেলভিক ফ্লোর মূত্রথলির নিয়ন্ত্রণে ভূমিকা রাখে। ধীরে ধীরে এটি শক্তিশালী করলে প্রস্রাব চুইয়ে পড়ার কিছু সমস্যা কমতে পারে।',
      },
      {
        icon: 'toilet',
        title: 'অন্ত্রের কাজে সহায়তা',
        text: 'এই পেশীগুলো গ্যাস ও মল নিয়ন্ত্রণেও সাহায্য করে এবং শ্রোণির অঙ্গগুলোকে ধরে রাখতে অবদান রাখে।',
      },
      {
        icon: 'human-female',
        title: 'শ্রোণির অঙ্গগুলোকে ধরে রাখা',
        text: 'পেলভিক ফ্লোর একটি প্রকৃত পেশীভিত্তি তৈরি করে, যা মূত্রথলি, জরায়ু ও অন্ত্রকে ধরে রাখতে সাহায্য করে।',
      },
      {
        icon: 'heart-pulse',
        title: 'ধীরে ধীরে অনুভূতি ফিরে পাওয়া',
        text: 'উপযুক্ত পুনর্বাসন এই অংশ সম্পর্কে আরও ভালো সচেতনতা ও নিয়ন্ত্রণ ফিরে পেতেও সাহায্য করতে পারে।',
      },
    ],
    s2Heading: 'গর্ভাবস্থা ও প্রসব কেন এতে চাপ ফেলে',
    s2Body1: 'গর্ভাবস্থায় পেলভিক ফ্লোরের ওপর ক্রমে চাপ বাড়তে থাকে। স্বাভাবিক প্রসবে এই অংশের পেশী ও কলা উল্লেখযোগ্যভাবে প্রসারিত হতে পারে।',
    s2Body2: 'সিজারিয়ান অপারেশনেও পেলভিক ফ্লোর পুরোপুরি রেহাই পায় না: গর্ভাবস্থা নিজেই এই পেশীগুলোর জন্য একটি গুরুত্বপূর্ণ সময়।',
    s2Body3: 'তাই প্রসবের পর সেরে উঠতে সময় লাগা স্বাভাবিক। কিছু নারী প্রায় কোনো উপসর্গ অনুভব করেন না, আবার অন্যরা প্রস্রাব চুইয়ে পড়া, ভারী লাগার অনুভূতি বা পেশীর নিয়ন্ত্রণ কমে যাওয়া লক্ষ করতে পারেন।',
    s2TipTitle: 'প্রত্যেকের সেরে ওঠা আলাদা',
    s2TipText: 'প্রসবের ধরন, ছিঁড়ে যাওয়া বা এপিসিওটমি, ব্যথা থাকা এবং প্রসবের পর আপনার সার্বিক অবস্থা, সবকিছুই সেরে ওঠাকে প্রভাবিত করতে পারে।',
    s3Heading: 'কখন পেলভিক ফ্লোরের পুনর্বাসন শুরু করবেন?',
    s3Body1: 'জটিলতাহীন প্রসবের পর সাধারণত পেলভিক ফ্লোরের মৃদু সংকোচন ধীরে ধীরে আবার শুরু করা যায়। ব্যায়ামগুলো আপনার অবস্থা অনুযায়ী মানিয়ে নেওয়া এবং কোনো জটিলতা, তীব্র ব্যথা বা বিশেষ কোনো চিকিৎসা-পদ্ধতি হয়ে থাকলে পরামর্শ নেওয়া গুরুত্বপূর্ণ।',
    s3Body2: 'আপনার যদি মূত্রনালিতে ক্যাথেটার থাকে, তাহলে কিছু সুপারিশে বলা হয় ক্যাথেটার খুলে স্বাভাবিক প্রস্রাব শুরু হওয়া পর্যন্ত অপেক্ষা করে তারপর পেরিনিয়ামের ব্যায়াম শুরু করতে।',
    s3AlertTitle: 'ব্যথা সহ্য করে চালিয়ে যাবেন না',
    s3AlertText: 'তীব্র ব্যথা, উপসর্গ বেড়ে যাওয়া, ক্ষত ঠিকভাবে না সারা, বা যেকোনো বিশেষ উদ্বেগের ক্ষেত্রে ধাত্রী, ডাক্তার বা পুনর্বাসন বিশেষজ্ঞের পরামর্শ নেওয়া প্রয়োজন।',
    s4Heading: 'সঠিকভাবে সংকোচন করতে শেখা',
    s4Body1: 'নড়াচড়াটি চিনতে কল্পনা করুন যে আপনি একই সঙ্গে গ্যাস আটকে রাখার এবং প্রস্রাবের বেগ ধরে রাখার চেষ্টা করছেন। যে নড়াচড়াটি আপনি খুঁজছেন, তা হলো ভেতরের দিকে সংকুচিত হওয়া ও ওপরে ওঠার একটি অনুভূতি।',
    s4Body2: 'লক্ষ্য পুরো শরীর শক্ত করে ফেলা নয়। শ্বাস স্বাভাবিকভাবে চলতে থাকবে, আর নিতম্ব, ঊরু ও পেটের পেশী যতটা সম্ভব শিথিল থাকবে।',
    exercises: [
      {
        icon: 'weather-windy',
        label: 'শ্বাস-প্রশ্বাস',
      },
      {
        icon: 'human-handsup',
        label: 'মৃদু সংকোচন',
      },
      {
        icon: 'arrow-up-bold-circle-outline',
        label: 'দীর্ঘ সংকোচন',
      },
      {
        icon: 'gesture-tap-button',
        label: 'দ্রুত সংকোচন',
      },
    ],
    s4HighlightTitle: 'শিথিল করাও সমান গুরুত্বপূর্ণ',
    s4HighlightText: 'প্রতিটি সংকোচনের পর পেশীগুলোকে সম্পূর্ণ শিথিল হতে দিন। ভালো পুনর্বাসন মানে সারাদিন পেরিনিয়াম সংকুচিত রাখা নয়।',
    s5Heading: 'ধাপে ধাপে একটি রুটিন তৈরি করা',
    s5Body1: 'শুরুতে সবচেয়ে গুরুত্বপূর্ণ হলো পেশীগুলো চিনতে শেখা এবং নড়াচড়াটি সঠিকভাবে করা। তীব্রতার চেয়ে নিয়মিত অনুশীলন বেশি জরুরি।',
    s5h3a: 'দীর্ঘ সংকোচন',
    s5Body2: 'পেলভিক ফ্লোর আলতো করে সংকুচিত করুন, তারপর শ্বাস না আটকে কয়েক সেকেন্ড সংকোচনটি ধরে রাখুন। এরপর আবার শুরু করার আগে পুরোপুরি শিথিল করুন।',
    s5h3b: 'ছোট সংকোচন',
    s5Body3: 'নড়াচড়াটি আয়ত্তে এলে ছোট ছোট দ্রুত সংকোচন যোগ করা যায়। পেটের ভেতরের চাপ বাড়লে, যেমন কাশি বা হাঁচির ঠিক আগে, পেশীগুলোকে দ্রুত সংকুচিত করার সক্ষমতা তৈরিতে এগুলো সাহায্য করে।',
    dailyTips: [
      {
        icon: 'clock-outline',
        label: 'ব্যায়ামগুলোকে একটি দৈনন্দিন অভ্যাসের সঙ্গে জুড়ে নিন',
      },
      {
        icon: 'human-sitting',
        label: 'আরামদায়ক অবস্থানে শুরু করুন',
      },
      {
        icon: 'weather-windy',
        label: 'সংকোচনের সময় স্বাভাবিকভাবে শ্বাস নিন',
      },
      {
        icon: 'sleep',
        label: 'শিথিল করার ধাপগুলো মেনে চলুন',
      },
      {
        icon: 'chart-line',
        label: 'ধীরে ধীরে কাঠিন্য বাড়ান',
      },
      {
        icon: 'doctor',
        label: 'নিশ্চিত না হলে পরামর্শ নিন',
      },
    ],
    s5TipTitle: 'সবকিছুর আগে নিয়মিততা',
    s5TipText: 'ব্যায়ামগুলোকে আপনার দিনের কোনো পুরোনো অভ্যাসের সঙ্গে জুড়ে নিলে নিয়মিত থাকা সহজ হতে পারে: দুধ খাওয়ানোর পর, দাঁত ব্রাশ করার পর, অথবা আপনার সুবিধামতো অন্য কোনো সময়ে।',
    s6Heading: 'যেসব সাধারণ ভুল এড়িয়ে চলবেন',
    s6Body1: 'পেরিনিয়ামের ব্যায়াম সহজ মনে হলেও অন্য পেশী দিয়ে কাজ চালিয়ে নেওয়া বা বেশি জোর দিয়ে ফেলা খুব সহজ।',
    commonMistakes: [
      'পেলভিক ফ্লোরের বদলে নিতম্ব বা ঊরু শক্ত করা',
      'সংকোচনের সময় শ্বাস আটকে রাখা',
      'পেশী শিথিল না করে সারাক্ষণ সংকুচিত রাখা',
      'মাত্র কয়েক দিন ব্যায়াম করে থেমে যাওয়া',
      'সংকোচন পরীক্ষা করতে ইচ্ছা করে প্রস্রাবের ধারা থামিয়ে দেওয়া',
    ],
    s6TipTitle: 'যা করবেন না',
    s6TipText: 'ইচ্ছা করে প্রস্রাবের ধারা থামিয়ে ব্যায়াম অনুশীলন করার পরামর্শ দেওয়া হয় না। এই পদ্ধতি পেরিনিয়ামকে সঠিকভাবে প্রশিক্ষিত করে না এবং মূত্রথলির স্বাভাবিক কার্যকারিতা ব্যাহত করতে পারে।',
    s7Heading: 'কোন উপসর্গ দেখা দিলে পরামর্শ নেওয়া উচিত?',
    s7Body1: 'প্রসবের পর কখনো কখনো সামান্য প্রস্রাব চুইয়ে পড়া বা অস্বাভাবিক অনুভূতি দেখা দিতে পারে। তবে এগুলো যদি থেকে যায়, বাড়তে থাকে বা দৈনন্দিন জীবনে বাধা সৃষ্টি করে, তাহলে অবহেলা করা উচিত নয়।',
    warningSigns: [
      'কাশি, হাঁচি, হাসি বা জোর দেওয়ার সময় প্রস্রাব চুইয়ে পড়া',
      'তলপেটের নিচের দিকে ভারী লাগা বা চাপ অনুভব করা',
      'যোনিপথে কোনো দলা বা কিছু নেমে আসছে বলে মনে হওয়া',
      'গ্যাস বা মল ধরে রাখতে অসুবিধা হওয়া',
      'পেরিনিয়ামে স্থায়ী ব্যথা',
      'যৌন মিলনের সময় বা পরে ব্যথা',
      'পেরিনিয়ামের পেশী চিনতে বা সঠিকভাবে সংকুচিত করতে অসুবিধা হওয়া',
    ],
    consultLabel: 'কখন পরামর্শ নেবেন?',
    s7Body2: 'পেলভিক ফ্লোর পুনর্বাসনে বিশেষজ্ঞ ধাত্রী, ডাক্তার বা ফিজিওথেরাপিস্ট পেশীর কার্যকারিতা পরীক্ষা করে একটি উপযুক্ত কর্মসূচি সুপারিশ করতে পারেন।',
    s8Heading: 'ছিঁড়ে যাওয়া, এপিসিওটমি বা সিজারিয়ানের পর কী করবেন?',
    s8Body1: 'ছিঁড়ে যাওয়া বা এপিসিওটমির ক্ষত সারার সময় বিশেষ যত্ন প্রয়োজন। কাজকর্মে ফেরার সময় ব্যথা, ক্ষতচিহ্নের অবস্থা এবং প্রসবের পর দেওয়া নির্দেশনা বিবেচনায় রাখা উচিত।',
    s8Body2: 'সিজারিয়ানের পর সেরে ওঠার ক্ষেত্রে পেটের প্রাচীর ও ক্ষতচিহ্নও জড়িত। প্রসব স্বাভাবিক না হলেও গর্ভাবস্থা নিজেই পেলভিক ফ্লোরের ওপর চাপ ফেলেছে।',
    s8HighlightTitle: 'ব্যক্তিগত যত্ন সাহায্য করতে পারে',
    s8HighlightText: 'উল্লেখযোগ্য ছিঁড়ে যাওয়া, ব্যথা, প্রস্রাব বা অন্ত্রের উপসর্গ অথবা স্থায়ী সমস্যার ক্ষেত্রে স্বাস্থ্যসেবা পেশাজীবীর কাছে মূল্যায়ন করানো বিশেষভাবে উপকারী হতে পারে।',
    s9Heading: 'ধীরে ধীরে খেলাধুলায় ফেরা',
    s9Body1: 'প্রসবের পর শারীরিক কর্মকাণ্ডে ফেরা হওয়া উচিত ধাপে ধাপে। হাঁটা ও মৃদু নড়াচড়া সাধারণত আপনার অনুভূতি অনুযায়ী আবার শুরু করা যায়, তবে অধিক আঘাতজনিত কার্যকলাপে আরও সতর্ক থাকা দরকার।',
    s9Body2: 'দৌড়ানো, লাফানো বা খুব তীব্র প্রশিক্ষণে ফেরার আগে পেলভিক ফ্লোরের সেরে ওঠা যাচাই করা এবং কোনো উপসর্গ থাকলে তা বিবেচনায় নেওয়া ভালো।',
    s9AlertTitle: 'ধাপগুলোতে তাড়াহুড়ো করবেন না',
    s9AlertText: 'ব্যায়ামের সময় বা পরে প্রস্রাব চুইয়ে পড়া, ভারী লাগা বা ব্যথা হলো গতি কমানোর এবং তীব্রতা বাড়ানোর আগে পরামর্শ নেওয়ার ইঙ্গিত।',
    s10Heading: 'কখন বিশেষজ্ঞের কাছে যাবেন?',
    s10Body1: 'আপনি সঠিকভাবে সংকোচন করছেন কি না তা নিয়ে অনিশ্চিত হলে, উপসর্গ থেকে গেলে, অথবা আত্মবিশ্বাসের সঙ্গে কিছু শারীরিক কার্যকলাপে ফিরতে চাইলে ধাত্রী বা ফিজিওথেরাপিস্টের সঙ্গে পেলভিক ফ্লোর পুনর্বাসন সহায়ক হতে পারে।',
    questionCardTitle: 'জিজ্ঞাসা করার মতো কিছু প্রশ্ন',
    appointmentQuestions: [
      'আমার উপসর্গগুলো কি পেলভিক ফ্লোরের দুর্বলতার সঙ্গে মেলে?',
      'আমি কি সংকোচনগুলো সঠিকভাবে করছি?',
      'প্রতিদিন কতবার করা উচিত?',
      'আমি কি আবার দৌড়ানো, খেলাধুলা বা অধিক আঘাতজনিত ব্যায়ামে ফিরতে পারি?',
      'আমার কি ধাত্রী বা ফিজিওথেরাপিস্টের কাছে পুনর্বাসন দরকার?',
      'আমার ক্ষতচিহ্ন, ছিঁড়ে যাওয়া অংশ বা সিজারিয়ানের জন্য কি বিশেষ কোনো সতর্কতা প্রয়োজন?',
    ],
    s10TipTitle: 'জেনে রাখা ভালো',
    s10TipText: 'বিশেষজ্ঞের কাছে যাওয়ার মানে এই নয় যে কোনো সমস্যা আছে। একটি সেশন কেবল আপনার পদ্ধতি যাচাই করতে, সেরে ওঠা মূল্যায়ন করতে এবং সঠিকভাবে এগোতে শিখতে সাহায্য করতে পারে।',
    s11Heading: 'সময় নেওয়া একটি সেরে ওঠা',
    s11Body1: 'সন্তান জন্মের পর গর্ভাবস্থার আগের মতো অনুভূতি বা পেশীর শক্তি সঙ্গে সঙ্গে ফিরে না পাওয়া স্বাভাবিক।',
    s11Body2: 'লক্ষ্য যত বেশি সম্ভব সংকোচন করা নয়। বরং সংকোচন ও শিথিলতার মধ্যে ধীরে ধীরে ভালো সমন্বয় ফিরে পাওয়া এবং তারপর দৈনন্দিন কাজে এই পেশীগুলো স্বাভাবিকভাবে ব্যবহার করতে পারাই আসল কথা।',
    s11HighlightTitle: 'ছোট অগ্রগতিও প্রকৃত অগ্রগতি',
    s11HighlightText: 'নড়াচড়া সম্পর্কে ভালো সচেতনতা, সংকোচন আরও কয়েক সেকেন্ড ধরে রাখতে পারা, বা প্রস্রাব চুইয়ে পড়া কমে যাওয়া, এগুলো ইতিমধ্যেই উৎসাহব্যঞ্জক লক্ষণ।',
    s12Heading: 'মূল কথা',
    summaryTitle: 'প্রয়োজনীয় বিষয়গুলো',
    summaryItems: [
      'গর্ভাবস্থা ও প্রসব পেলভিক ফ্লোরের ওপর যথেষ্ট চাপ ফেলে।',
      'প্রসবের পর ধীরে ধীরে সেরে ওঠা স্বাভাবিক।',
      'ব্যায়ামে শক্তির চেয়ে নড়াচড়ার মানকে অগ্রাধিকার দেওয়া উচিত।',
      'শ্বাস-প্রশ্বাস ও শিথিলতা সংকোচনের মতোই গুরুত্বপূর্ণ।',
      'প্রস্রাব চুইয়ে পড়া, ভারী লাগা বা স্থায়ী ব্যথার জন্য বিশেষজ্ঞের মতামত নেওয়া উচিত।',
      'ধাত্রী বা ফিজিওথেরাপিস্টের সঙ্গে পুনর্বাসন আপনাকে আরও ভালো নিয়ন্ত্রণ ফিরে পেতে সাহায্য করতে পারে।',
      'খেলাধুলায় ফেরা হওয়া উচিত ধাপে ধাপে, বিশেষ করে অধিক আঘাতজনিত কার্যকলাপে।',
    ],
    finalTipTitle: 'সেরে উঠতে সময় নিন',
    finalTipText: 'প্রসবের পর আপনার শরীর অনেক পরিবর্তনের মধ্য দিয়ে গেছে। শরীরের বাকি অংশের মতোই পেরিনিয়ামও একই মনোযোগ পাওয়ার যোগ্য: ধীরে ধীরে, নিয়মিতভাবে এবং কোনো চাপ ছাড়াই।',
    disclaimerText: 'এই নিবন্ধ কেবল তথ্যের উদ্দেশ্যে এবং ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। ব্যথা, স্থায়ী উপসর্গ বা সেরে ওঠা নিয়ে কোনো উদ্বেগ থাকলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
  },
} as const);

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

        {/* ARTICLE */}

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

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* TABLE OF CONTENTS */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>
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

          {/* SECTION 1 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.s1Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s1Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="human-female"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s1HighlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.s1HighlightText}
              </AwaText>
            </View>
          </AwaCard>


          {/* BENEFITS */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.benefitsHeading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.benefitsIntro}
          </AwaText>

          <View style={styles.benefitsGrid}>
            {content.benefits.map(item => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.benefitTitle}>
                  {item.title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.benefitText}>
                  {item.text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          {/* SECTION 2 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.s2Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s2Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s2Body2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s2Body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s2TipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.s2TipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.s3Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s3Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s3Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s3AlertTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.s3AlertText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 4 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.s4Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s4Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s4Body2}
          </AwaText>

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

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {item.label}
                </AwaText>
              </View>
            ))}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="target"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s4HighlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.s4HighlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 5 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.s5Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s5Body1}
          </AwaText>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.s5h3a}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s5Body2}
          </AwaText>

          <AwaText variant="titleMedium" emphasized style={styles.h3}>
            {content.s5h3b}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s5Body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.dailyTips}>
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

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.dailyTipText}>
                  {item.label}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-check-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s5TipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.s5TipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 6 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            6. {content.s6Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s6Body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningList}>
            {content.commonMistakes.map(item => (
              <View
                key={item}
                style={styles.warningRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                  {item}
                </AwaText>
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
              <AwaText variant="titleSmall" emphasized>
                {content.s6TipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.s6TipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 7 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            7. {content.s7Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s7Body1}
          </AwaText>

          <View style={styles.consultList}>
            {content.warningSigns.map((item, index) => (
              <AwaCard variant="filled" padding="none"
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
                  <AwaText variant="titleSmall" emphasized>
                    {index + 1}. {content.consultLabel}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.consultText}>
                    {item}
                  </AwaText>
                </View>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s7Body2}
          </AwaText>

          {/* SECTION 8 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            8. {content.s8Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s8Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s8Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="doctor"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s8HighlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.s8HighlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 9 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            9. {content.s9Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s9Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s9Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="run-fast"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s9AlertTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.s9AlertText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 10 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            10. {content.s10Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s10Body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={styles.questionTitle}>
                {content.questionCardTitle}
              </AwaText>
            </View>

            {content.appointmentQuestions.map(
              (item, index) => (
                <View
                  key={item}
                  style={styles.questionRow}>
                  <View style={styles.questionBullet}>
                    <AwaText variant="labelSmall" emphasized colorRole="primary">
                      {index + 1}
                    </AwaText>
                  </View>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.questionText}>
                    {item}
                  </AwaText>
                </View>
              ),
            )}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s10TipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.s10TipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 11 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            11. {content.s11Heading}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s11Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.s11Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="progress-check"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.s11HighlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.s11HighlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SUMMARY */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            12. {content.s12Heading}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.summaryTitle}
              </AwaText>
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

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* FINAL TIP */}

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.finalTipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.finalTipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
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

  h3: {
    marginTop: 20,
  },

  body: {
    marginTop: 8,
  },

  highlight: {
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


  benefitsGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  benefitCard: {
    width: '48.5%',
    padding: 12,
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
    marginTop: 8,
  },

  benefitText: {
    marginTop: 4,
  },

  daily: {
    marginTop: 12,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },

  dailyTips: {
    marginTop: 16,
    padding: 16,
  },

  dailyTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginLeft: 12,
  },

  warningList: {
    marginTop: 12,
    padding: 16,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  warningText: {
    flex: 1,
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  consultList: {
    marginTop: 16,
    gap: 12,
  },

  consultCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginLeft: 12,
  },


  consultText: {
    marginTop: 4,
  },

  questionCard: {
    marginTop: 16,
    padding: 16,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  questionTitle: {
    flex: 1,
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  questionText: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 2,
  },

  professionalTip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
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


  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
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
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
