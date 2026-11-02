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
  'zh-Hant': {
      badge: '產後 • 恢復',
      title: '產後盆底肌\n強化訓練',
      metaDuration: '閱讀約 8 分鐘',
      metaType: '指南',
      metaLevel: '入門',
      metaValidated: '已審閱內容',
      intro: '懷孕和分娩之後，盆底肌需要時間恢復。簡單、規律、循序漸進的練習，可以幫助你重新找回力量、控制力和信心，不必急於求成。',
      contentsTitle: '本文內容',
      topics: [
        '瞭解會陰的作用',
        '為什麼分娩會讓它承受壓力',
        '何時開始盆底康復',
        '學會正確收縮',
        '建立循序漸進的練習計劃',
        '需要避免的錯誤',
        '何時尋求幫助',
        '逐步恢復運動',
        '為就診做準備',
        '要點回顧',
      ],
      shareMessage: '產後盆底肌強化訓練 — AWA',
      s1Heading: '瞭解會陰的作用',
      s1Body1: '會陰，也稱盆底，是位於骨盆底部的一組肌肉。它參與控制膀胱和腸道，並幫助支撐盆腔器官。',
      s1Body2: '懷孕期間，這些肌肉需要連續數月承受額外的重量。分娩時，它們也會承受很大的壓力。',
      s1HighlightTitle: '低調卻至關重要的肌肉',
      s1HighlightText: '盆底肌參與多項日常功能：控制尿液和糞便、控制排氣、支撐盆腔器官，並在某些性功能中發揮作用。',
      benefitsHeading: '盆底肌更強健的好處',
      benefitsIntro: '循序漸進且方法正確的強化訓練，有助於改善盆底肌的控制力和支撐力。',
      benefits: [
        {
          icon: 'water-outline',
          title: '更好地控制膀胱',
          text: '盆底肌在膀胱控制中發揮作用。逐步強化它，可能有助於減少某些漏尿情況。',
        },
        {
          icon: 'toilet',
          title: '輔助腸道功能',
          text: '這些肌肉同樣有助於控制排氣和糞便，並參與支撐盆腔器官。',
        },
        {
          icon: 'human-female',
          title: '支撐盆腔器官',
          text: '盆底肌構成一層真正的肌肉底座，幫助支撐膀胱、子宮和腸道。',
        },
        {
          icon: 'heart-pulse',
          title: '逐漸找回感覺',
          text: '合適的康復訓練也能幫助你更好地感知和控制這個部位。',
        },
      ],
      s2Heading: '為什麼懷孕和分娩會讓盆底肌承受壓力',
      s2Body1: '懷孕會讓盆底肌所受的壓力逐漸增加。經陰道分娩時，這個部位的肌肉和組織可能被明顯拉伸。',
      s2Body2: '剖腹產也並不能完全讓盆底肌免受影響：懷孕本身對這些肌肉來說就是一段負擔較重的時期。',
      s2Body3: '因此，產後恢復需要時間是正常的。有些女性幾乎沒有任何症狀，也有些人可能會注意到漏尿、下墜感或肌肉控制力下降。',
      s2TipTitle: '每個人的恢復都不一樣',
      s2TipText: '分娩方式、是否有撕裂或會陰側切、是否疼痛，以及產後的整體狀況，都會影響恢復。',
      s3Heading: '何時開始盆底康復？',
      s3Body1: '自然產且沒有併發症的話，通常可以逐步恢復輕柔的盆底肌收縮。仍然需要根據自己的情況調整練習；如果你經歷過併發症、明顯的疼痛或特殊的操作，請先諮詢專業人員。',
      s3Body2: '如果你留置了導尿管，一些建議是等到拔除導尿管、恢復正常排尿後，再開始會陰練習。',
      s3AlertTitle: '不要忍痛硬撐',
      s3AlertText: '明顯的疼痛、症狀加重、傷口癒合不良，或任何特別的擔憂，都應向助產士、醫生或康復專業人員尋求建議。',
      s4Heading: '學會正確收縮',
      s4Body1: '要找到正確的動作，可以想像同時憋住排氣和尿意。你要找的是一種向內收緊、向上提的感覺。',
      s4Body2: '目標不是讓全身都緊繃。臀部、大腿和腹肌應儘量保持放鬆，同時正常呼吸。',
      exercises: [
        {
          icon: 'weather-windy',
          label: '呼吸',
        },
        {
          icon: 'human-handsup',
          label: '輕柔收縮',
        },
        {
          icon: 'arrow-up-bold-circle-outline',
          label: '長收縮',
        },
        {
          icon: 'gesture-tap-button',
          label: '快速收縮',
        },
      ],
      s4HighlightTitle: '放鬆同樣重要',
      s4HighlightText: '每次收縮之後，讓肌肉完全放鬆。好的康復訓練，並不是讓會陰整天保持收緊。',
      s5Heading: '建立循序漸進的練習計劃',
      s5Body1: '一開始，最重要的是學會找到這些肌肉，並正確完成動作。堅持比強度更重要。',
      s5h3a: '長收縮',
      s5Body2: '輕輕收縮盆底肌，然後保持收縮幾秒鐘，不要屏住呼吸。接著完全放鬆，再重新開始。',
      s5h3b: '短收縮',
      s5Body3: '動作掌握之後，可以加入小幅度的快速收縮。它們有助於訓練你在腹壓升高時迅速收縮肌肉的能力，例如在咳嗽或打噴嚏之前。',
      dailyTips: [
        {
          icon: 'clock-outline',
          label: '把練習和日常習慣結合起來',
        },
        {
          icon: 'human-sitting',
          label: '從舒適的姿勢開始',
        },
        {
          icon: 'weather-windy',
          label: '收縮時正常呼吸',
        },
        {
          icon: 'sleep',
          label: '給放鬆階段足夠時間',
        },
        {
          icon: 'chart-line',
          label: '逐步增加難度',
        },
        {
          icon: 'doctor',
          label: '不確定時請諮詢專業人員',
        },
      ],
      s5TipTitle: '貴在堅持',
      s5TipText: '把練習和你日常已有的習慣結合起來，會更容易堅持：比如餵奶之後、刷牙之後，或任何適合你的時間。',
      s6Heading: '常見的錯誤',
      s6Body1: '會陰練習看似簡單，但很容易用其他肌肉代償，或者用力過度。',
      commonMistakes: [
        '收緊的是臀部或大腿，而不是盆底肌',
        '收縮時屏住呼吸',
        '讓肌肉一直保持收縮，不放鬆',
        '只練幾天就停下來',
        '為了檢驗收縮效果而故意中斷排尿',
      ],
      s6TipTitle: '不要這樣做',
      s6TipText: '不建議通過故意中斷尿流來做練習。這種方法不能正確地訓練會陰，還可能干擾正常的膀胱功能。',
      s7Heading: '出現哪些症狀應該就診？',
      s7Body1: '分娩後有時會出現輕微漏尿或異常的感覺。但如果這些情況持續存在、加重或影響日常生活，就不應忽視。',
      warningSigns: [
        '咳嗽、打噴嚏、大笑或用力時漏尿',
        '下腹部盆腔有下墜感或壓迫感',
        '感覺陰道里有腫塊或有東西往下掉',
        '難以控制排氣或糞便',
        '會陰持續疼痛',
        '性生活時或之後疼痛',
        '難以找到或正確收縮會陰肌肉',
      ],
      consultLabel: '何時應該尋求建議？',
      s7Body2: '助產士、醫生，或專門從事盆底康復的物理治療師，可以檢查肌肉功能，併為你制定合適的訓練方案。',
      s8Heading: '如果有撕裂、會陰側切或剖腹產呢？',
      s8Body1: '撕裂或會陰側切在癒合期間需要特別的護理。恢復活動時應考慮疼痛程度、傷口狀況以及分娩後得到的指導。',
      s8Body2: '剖腹產之後，恢復還涉及腹壁和傷口。即使不是經陰道分娩，懷孕本身仍然給盆底肌帶來了壓力。',
      s8HighlightTitle: '個性化的護理會有幫助',
      s8HighlightText: '如果撕裂較嚴重、有疼痛、排尿或排便方面的症狀，或存在持續的困擾，請醫療專業人員做一次評估會特別有幫助。',
      s9Heading: '逐步恢復運動',
      s9Body1: '分娩後恢復運動應循序漸進。散步和輕柔的活動通常可以根據身體感受逐步恢復，而高衝擊的活動則需要更加謹慎。',
      s9Body2: '在恢復跑步、跳躍或高強度訓練之前，最好先評估盆底肌的恢復情況，並留意任何症狀。',
      s9AlertTitle: '不要急於求成',
      s9AlertText: '運動時或運動後出現漏尿、下墜感或疼痛，說明你應該放慢節奏，並在加大強度之前先尋求建議。',
      s10Heading: '何時去看專科醫生？',
      s10Body1: '如果你不確定自己的收縮是否正確，症狀持續存在，或者想有信心地恢復某些體育活動，請助產士或物理治療師指導盆底康復會有幫助。',
      questionCardTitle: '可以問的問題',
      appointmentQuestions: [
        '我的症狀是否符合盆底肌薄弱的表現？',
        '我的收縮動作正確嗎？',
        '我每天應該做多少次？',
        '我可以恢復跑步、運動或高衝擊的鍛鍊嗎？',
        '我需要請助產士或物理治療師做康復嗎？',
        '我的傷口、撕裂或剖腹產是否需要特別的注意事項？',
      ],
      s10TipTitle: '小提醒',
      s10TipText: '去看專業人員並不一定意味著有什麼問題。一次就診也可以只是幫你檢查動作是否正確、評估恢復情況，並學會如何正確地循序漸進。',
      s11Heading: '需要時間的恢復',
      s11Body1: '生完寶寶後，無法立刻找回懷孕前的感覺或肌肉力量，這是正常的。',
      s11Body2: '目標不是儘可能多地做收縮，而是逐漸重新建立收縮與放鬆之間的良好協調，然後能夠在日常活動中自然地運用這些肌肉。',
      s11HighlightTitle: '每一點小進步都是真正的進步',
      s11HighlightText: '對動作更有感覺、收縮多堅持幾秒，或者漏尿減少，都已經是令人鼓舞的訊號。',
      s12Heading: '要點回顧',
      summaryTitle: '核心要點',
      summaryItems: [
        '懷孕和分娩會讓盆底肌承受較大的壓力。',
        '產後循序漸進地恢復是正常的。',
        '練習應優先注重動作品質，而不是力量。',
        '呼吸和放鬆與收縮同樣重要。',
        '漏尿、下墜感或持續疼痛，值得請專業人員評估。',
        '在助產士或物理治療師指導下進行康復，可以幫助你更好地恢復控制力。',
        '恢復運動應循序漸進，尤其是高衝擊的活動。',
      ],
      finalTipTitle: '給自己恢復的時間',
      finalTipText: '分娩後，你的身體經歷了許多變化。會陰值得和身體其他部位一樣得到關注：循序漸進、規律堅持，不給自己壓力。',
      disclaimerText: '本文僅供參考，不能替代個性化的醫療建議。如果你感到疼痛、症狀持續，或對自己的恢復有任何擔憂，請諮詢醫療專業人員。',
    },
  ar: {
    badge: 'ما بعد الولادة • التعافي',
    title: 'تقوية قاع الحوض\nبعد الولادة',
    metaDuration: '8 د قراءة',
    metaType: 'دليل',
    metaLevel: 'مبتدئة',
    metaValidated: 'محتوى مراجَع',
    intro:
      'بعد الحمل والولادة، يحتاج قاع الحوض إلى وقت ليتعافى. ويمكن لتمارين بسيطة ومنتظمة وتدريجية أن تساعدك على استعادة القوة والتحكم والثقة، دون محاولة استعجال الأمور.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'فهم دور العجان',
      'لماذا تُجهده الولادة',
      'متى يبدأ تأهيل قاع الحوض',
      'تعلّم الانقباض الصحيح',
      'بناء روتين تدريجي',
      'أخطاء يجب تجنّبها',
      'متى تطلبين المساعدة',
      'استئناف الرياضة تدريجيًا',
      'التحضير لموعد الطبيب',
      'أهم النقاط',
    ],
    shareMessage: 'تقوية قاع الحوض بعد الولادة — AWA',

    s1Heading: 'فهم دور العجان',
    s1Body1:
      'العجان، ويسمى أيضًا قاع الحوض، مجموعة من العضلات تقع في أسفل الحوض. وله دور في التحكم بالمثانة والأمعاء ويساعد على دعم أعضاء الحوض.',
    s1Body2:
      'خلال الحمل، تضطر هذه العضلات إلى تحمّل وزن إضافي لعدة أشهر. كما تتعرض لإجهاد كبير أثناء الولادة.',
    s1HighlightTitle: 'عضلة هادئة لكنها أساسية',
    s1HighlightText:
      'يشارك قاع الحوض في عدة وظائف يومية: حبس البول والبراز، والتحكم في الغازات، ودعم أعضاء الحوض، وله دور في بعض الوظائف الجنسية.',

    benefitsHeading: 'فوائد تقوية قاع الحوض',
    benefitsIntro:
      'التقوية التدريجية الصحيحة قد تساعد على تحسين التحكم في قاع الحوض ودعمه.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'تحكم أفضل بالمثانة',
        text: 'لقاع الحوض دور في التحكم بالمثانة. وقد تساعد تقويته تدريجيًا على تقليل بعض حالات تسرّب البول.',
      },
      {
        icon: 'toilet',
        title: 'دعم وظيفة الأمعاء',
        text: 'تساعد هذه العضلات أيضًا في التحكم بالغازات والبراز، وتسهم في دعم أعضاء الحوض.',
      },
      {
        icon: 'human-female',
        title: 'دعم أعضاء الحوض',
        text: 'يشكّل قاع الحوض قاعدة عضلية حقيقية تساعد على دعم المثانة والرحم والأمعاء.',
      },
      {
        icon: 'heart-pulse',
        title: 'استعادة الإحساس تدريجيًا',
        text: 'يمكن للتأهيل المناسب أن يساعدك أيضًا على استعادة وعي أفضل بهذه المنطقة وتحكم أفضل بها.',
      },
    ],

    s2Heading: 'لماذا يُجهد الحمل والولادة قاع الحوض',
    s2Body1:
      'يزيد الحمل الضغط على قاع الحوض تدريجيًا. وقد تؤدي الولادة المهبلية بعد ذلك إلى شدّ كبير لعضلات هذه المنطقة وأنسجتها.',
    s2Body2:
      'كما أن العملية القيصرية لا تُعفي قاع الحوض تمامًا: فالحمل نفسه فترة مهمة لهذه العضلات.',
    s2Body3:
      'لذلك من الطبيعي بعد الولادة أن يستغرق التعافي وقتًا. فبعض النساء لا يشعرن بأي أعراض تقريبًا، بينما قد تلاحظ أخريات تسربًا أو إحساسًا بالثقل أو ضعفًا في التحكم بالعضلات.',
    s2TipTitle: 'كل تعافٍ يختلف عن غيره',
    s2TipText:
      'نوع الولادة، ووجود تمزق أو شق العجان، ووجود ألم، وحالتك العامة بعد الولادة، كلها قد تؤثر في التعافي.',

    s3Heading: 'متى يبدأ تأهيل قاع الحوض؟',
    s3Body1:
      'بعد ولادة غير معقّدة، يمكن عادةً استئناف انقباضات قاع الحوض اللطيفة تدريجيًا. ويبقى من المهم تكييف التمارين مع حالتك وطلب المشورة إذا واجهتِ مضاعفات أو ألمًا كبيرًا أو إجراءً طبيًا خاصًا.',
    s3Body2:
      'إذا كان لديك قسطرة بولية، تقترح بعض التوصيات الانتظار حتى تُزال ويعود التبوّل الطبيعي قبل البدء بتمارين العجان.',
    s3AlertTitle: 'لا تتحمّلي الألم',
    s3AlertText:
      'الألم الشديد، أو تفاقم الأعراض، أو جرح لا يلتئم جيدًا، أو أي قلق خاص، كلها تستدعي مشورة القابلة أو الطبيب أو مختص التأهيل.',

    s4Heading: 'تعلّم الانقباض الصحيح',
    s4Body1:
      'لتحديد الحركة، تخيّلي أنك تحاولين حبس الغازات وحبس الرغبة في التبوّل في الوقت نفسه. والحركة المطلوبة هي إحساس بالانقباض والشدّ إلى الداخل نحو الأعلى.',
    s4Body2:
      'الهدف ليس شدّ جسمك كله بقوة. ينبغي أن تبقى الأرداف والفخذان وعضلات البطن مسترخية قدر الإمكان، مع استمرار التنفس بشكل طبيعي.',
    exercises: [
      {icon: 'weather-windy', label: 'التنفس'},
      {icon: 'human-handsup', label: 'انقباض لطيف'},
      {icon: 'arrow-up-bold-circle-outline', label: 'انقباض طويل'},
      {icon: 'gesture-tap-button', label: 'انقباضات سريعة'},
    ],
    s4HighlightTitle: 'الاسترخاء مهم بالقدر نفسه',
    s4HighlightText:
      'بعد كل انقباض، دعي العضلات ترتخي تمامًا. فالتأهيل الجيد لا يعني إبقاء العجان منقبضًا طوال اليوم.',

    s5Heading: 'بناء روتين تدريجي',
    s5Body1:
      'في البداية، أهم ما في الأمر هو تعلّم التعرّف على العضلات وأداء الحركة بشكل صحيح. والانتظام أهم من الشدة.',
    s5h3a: 'الانقباضات الطويلة',
    s5Body2:
      'اقبضي قاع الحوض بلطف، ثم حافظي على الانقباض لبضع ثوانٍ دون حبس النفس. ثم أرخي تمامًا قبل أن تبدئي من جديد.',
    s5h3b: 'الانقباضات القصيرة',
    s5Body3:
      'عندما تتقنين الحركة، يمكن إضافة انقباضات صغيرة سريعة. فهي تساعد على تدريب قدرتك على انقباض العضلات بسرعة عندما يزداد ضغط البطن، مثلًا قبل السعال أو العطاس مباشرة.',
    dailyTips: [
      {icon: 'clock-outline', label: 'اربطي التمارين بعادة يومية'},
      {icon: 'human-sitting', label: 'ابدئي في وضعية مريحة'},
      {icon: 'weather-windy', label: 'تنفّسي بشكل طبيعي أثناء الانقباضات'},
      {icon: 'sleep', label: 'احترمي فترات الاسترخاء'},
      {icon: 'chart-line', label: 'زيدي الصعوبة تدريجيًا'},
      {icon: 'doctor', label: 'اطلبي المشورة إذا لم تكوني متأكدة'},
    ],
    s5TipTitle: 'الانتظام قبل كل شيء',
    s5TipText:
      'قد يسهّل عليك ربط التمارين بعادة موجودة أصلًا في يومك الاستمرارَ عليها: بعد الرضعة، أو بعد تنظيف أسنانك، أو في أي وقت آخر يناسبك.',

    s6Heading: 'أخطاء شائعة يجب تجنّبها',
    s6Body1:
      'قد تبدو تمارين العجان بسيطة، لكن من السهل تعويضها بعضلات أخرى أو بذل جهد زائد.',
    commonMistakes: [
      'شدّ الأرداف أو الفخذين بدل قاع الحوض',
      'حبس النفس أثناء الانقباض',
      'إبقاء العضلات منقبضة باستمرار دون تركها ترتخي',
      'ممارسة التمارين أيامًا قليلة ثم التوقف',
      'إيقاف تدفق البول عمدًا للتحقق من الانقباض',
    ],
    s6TipTitle: 'ما لا ينبغي فعله',
    s6TipText:
      'لا يُنصح بممارسة التمارين عن طريق إيقاف تدفق البول عمدًا. فهذه الطريقة لا تدرّب العجان بشكل صحيح وقد تخلّ بوظيفة المثانة الطبيعية.',

    s7Heading: 'ما الأعراض التي تستدعي الاستشارة؟',
    s7Body1:
      'قد يظهر أحيانًا بعد الولادة تسرّب بسيط أو إحساس غير معتاد. لكن لا ينبغي تجاهله إذا استمر أو ازداد سوءًا أو أثّر في حياتك اليومية.',
    warningSigns: [
      'تسرّب البول عند السعال أو العطاس أو الضحك أو بذل الجهد',
      'إحساس بالثقل أو الضغط في أسفل الحوض',
      'إحساس بوجود كتلة أو شيء ينزل إلى المهبل',
      'صعوبة في حبس الغازات أو البراز',
      'ألم مستمر في العجان',
      'ألم أثناء الجماع أو بعده',
      'صعوبة في تحديد عضلات العجان أو في انقباضها بشكل صحيح',
    ],
    consultLabel: 'متى ينبغي أن تطلبي المشورة؟',
    s7Body2:
      'يمكن للقابلة أو الطبيب أو أخصائي العلاج الطبيعي المتخصص في تأهيل قاع الحوض فحص وظيفة العضلات واقتراح برنامج مناسب.',

    s8Heading: 'وبعد التمزق أو شق العجان أو العملية القيصرية؟',
    s8Body1:
      'يتطلب التمزق أو شق العجان عناية خاصة أثناء الالتئام. وينبغي أن يراعي استئناف الأنشطة الألم وحالة الندبة والتوجيهات المقدمة بعد الولادة.',
    s8Body2:
      'بعد العملية القيصرية، يشمل التعافي أيضًا جدار البطن والندبة. وحتى لو لم تكن الولادة مهبلية، فإن الحمل نفسه أجهد قاع الحوض.',
    s8HighlightTitle: 'العناية المخصّصة قد تفيد',
    s8HighlightText:
      'في حال وجود تمزق كبير أو ألم أو أعراض بولية أو معوية أو صعوبات مستمرة، قد يكون التقييم لدى مختصة صحية مفيدًا بشكل خاص.',

    s9Heading: 'استئناف الرياضة تدريجيًا',
    s9Body1:
      'ينبغي أن يكون استئناف الحركة بعد الولادة تدريجيًا. يمكن عمومًا استئناف المشي والحركات اللطيفة بحسب ما تشعرين به، بينما تتطلب الأنشطة عالية التأثير حذرًا أكبر.',
    s9Body2:
      'قبل استئناف الجري أو القفز أو التمارين الشديدة جدًا، من الأفضل تقييم تعافي قاع الحوض ومراعاة أي أعراض.',
    s9AlertTitle: 'لا تستعجلي المراحل',
    s9AlertText:
      'التسرّب أو الإحساس بالثقل أو الألم أثناء التمرين أو بعده علامات تدعوك إلى التمهّل وطلب المشورة قبل زيادة الشدة.',

    s10Heading: 'متى تراجعين مختصة؟',
    s10Body1:
      'قد يكون تأهيل قاع الحوض لدى قابلة أو أخصائي علاج طبيعي مفيدًا إذا لم تكوني متأكدة من أنك تنقبضين بشكل صحيح، أو إذا استمرت أعراضك، أو إذا أردتِ استئناف بعض الأنشطة البدنية بثقة.',
    questionCardTitle: 'أسئلة مفيدة لطرحها',
    appointmentQuestions: [
      'هل أعراضي تتوافق مع ضعف في قاع الحوض؟',
      'هل أؤدي الانقباضات بشكل صحيح؟',
      'كم تكرارًا ينبغي أن أؤدي كل يوم؟',
      'هل يمكنني العودة إلى الجري أو الرياضة أو التمارين عالية التأثير؟',
      'هل أحتاج إلى تأهيل لدى قابلة أو أخصائي علاج طبيعي؟',
      'هل تتطلب ندبتي أو التمزق أو العملية القيصرية احتياطات خاصة؟',
    ],
    s10TipTitle: 'من المفيد أن تعرفي',
    s10TipText:
      'مراجعة مختصة لا تعني بالضرورة أن هناك خطبًا ما. فقد تساعدك الجلسة ببساطة على التحقق من طريقتك وتقييم تعافيك وتعلّم التقدم بشكل صحيح.',

    s11Heading: 'تعافٍ يحتاج إلى وقت',
    s11Body1:
      'بعد الولادة، من الطبيعي ألا تستعيدي فورًا الإحساس نفسه أو قوة العضلات نفسها التي كانت لديك قبل الحمل.',
    s11Body2:
      'الهدف ليس أداء أكبر عدد ممكن من الانقباضات، بل استعادة تنسيق جيد تدريجيًا بين الانقباض والاسترخاء، ثم القدرة على استخدام هذه العضلات بشكل طبيعي في الأنشطة اليومية.',
    s11HighlightTitle: 'التقدم الصغير تقدم حقيقي',
    s11HighlightText:
      'وعي أفضل بالحركة، أو بضع ثوانٍ إضافية من الانقباض، أو انخفاض في التسرّب، كلها علامات مشجعة بالفعل.',

    s12Heading: 'أهم النقاط',
    summaryTitle: 'الخلاصة',
    summaryItems: [
      'يضع الحمل والولادة إجهادًا كبيرًا على قاع الحوض.',
      'التعافي التدريجي أمر طبيعي بعد الولادة.',
      'ينبغي أن تعطي التمارين الأولوية لجودة الحركة على القوة.',
      'التنفس والاسترخاء مهمان بقدر الانقباض.',
      'تسرّب البول أو الإحساس بالثقل أو الألم المستمر يستحق رأيًا مختصًا.',
      'يمكن للتأهيل لدى قابلة أو أخصائي علاج طبيعي أن يساعدك على استعادة تحكم أفضل.',
      'ينبغي أن تكون العودة إلى الرياضة تدريجية، خاصة في الأنشطة عالية التأثير.',
    ],

    finalTipTitle: 'امنحي نفسك وقتًا للتعافي',
    finalTipText:
      'بعد الولادة، مرّ جسمك بتغيّرات كثيرة. ويستحق العجان الاهتمام نفسه الذي يستحقه بقية جسمك: تدريجيًا ومنتظمًا ودون ضغط.',

    disclaimerText:
      'هذا المقال للمعلومات فقط ولا يغني عن المشورة الطبية المخصّصة. إذا شعرتِ بألم أو أعراض مستمرة، أو كانت لديك أي مخاوف بشأن تعافيك، فاطلبي المشورة من مختصة صحية.',
  },
  kab: {
    badge: 'MA SELD TULAWT • TUDERT',
    title: 'Asenneɣ n lpirine\nseld tulawt',
    metaDuration: 'Taɣuri n 8 n tisdidin',
    metaType: 'Amellal',
    metaLevel: 'Anagar',
    metaValidated: 'Agbur yettwasenqed',
    intro:
      'Seld lḥemla d tulawt, lpirine yesra lweqt i wakken ad d-yuɣal. Ineɣman yessefken, yellan s lemɛawda u s wudem aqrawan zemrent ad k-iɛiwen ad d-tafeḍ tazmert, aɛekkem d ttiqa, war ma tettaɛǧalt.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Ad tfehmeḍ ayen i ixeddem lpirine',
      'Acuɣer tulawt ttɛeddi-t aṭas',
      'Melmi ara tebdu tuɣalin n lpirine',
      'Ad tessneḍ amek ara tessemmedeḍ akken iwata',
      'Taggara n lbarnamaj s wudem aqrawan',
      'Tuccḍiwin ilaqen ad tettuɣalen',
      'Melmi ara tsuter tallalt',
      'Tuɣalin n uzeṭṭa s wudem aqrawan',
      'Ad tesfeḍ i usarag',
      'Tifrat tigejdanin',
    ],
    shareMessage: 'Asenneɣ n lpirine seld tulawt — AWA',

    s1Heading: 'Ad tfehmeḍ ayen i ixeddem lpirine',
    s1Body1:
      'Lpirine, i d-yettusemman daɣen aferdis n lbasin, d tagrumt n iferdasen yellan deg uda n lbasin. Yesɛa tamlilt deg uḥkem n tbuqit d uzgen n yimi n uẓar, u yettɛawan ad yeṭṭef iɣsan n lbasin.',
    s1Body2:
      'Deg lḥemla, iferdasen-a ilaqen ad d-ḥmelen aggar ugar n wazal ɣef waṭas n wayyuren. Daɣen ttɛeddin ugur ameqqran deg tulawt.',
    s1HighlightTitle: 'Afferdis ur d-yettban ara maca ilaqen',
    s1HighlightText:
      'Aferdis n lbasin yettekkild deg waṭas n yimala n yal ass: aḥbas n yiɣi d uẓelmaḍ, aḥkem deg ugaz, aɛawen n iɣsan n lbasin, u yesɛa tamlilt deg kra n yimala n tugniwin.',

    benefitsHeading: 'Lfayda n lpirine yeqwan',
    benefitsIntro:
      'Asenneɣ s wudem aqrawan u s wudem ilaqen izmer ad yeɛiwen ad yelhu uḥkem d wawaɛun n lpirine.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Aḥkem ahlawan n tbuqit',
        text: 'Aferdis n lbasin yesɛa tamlilt deg uḥkem n tbuqit. Asenneɣ-is s wudem aqrawan izmer ad yessenqes kra n yimalen n iɣi.',
      },
      {
        icon: 'toilet',
        title: 'Aɛawen n yiɣsan n lbasin',
        text: 'Iferdasen-a ɛawnen daɣen deg uḥkem n ugaz d uẓelmaḍ, u ttekkin deg uɛawen n yiɣsan n lbasin.',
      },
      {
        icon: 'human-female',
        title: 'Aɛawen n yiɣsan n lbasin',
        text: 'Aferdis n lbasin d aseggas n yiferdasen i iɛawnen ad ṭṭfen tbuqit, tazmert d tamrart.',
      },
      {
        icon: 'heart-pulse',
        title: 'Tuɣalin n uḥulfu s wudem aqrawan',
        text: 'Uɣal-nni ilaqen izmer daɣen ad k-iɛiwen ad tḥessed akken iwata aḥkem n tmennaḍt-a.',
      },
    ],

    s2Heading: 'Acuɣer lḥemla d tulawt ttɛeddi-ten aṭas',
    s2Body1:
      'Lḥemla tesseḥmel s wudem aqrawan ugar n uẓeṭṭa ɣef uferdis n lbasin. Tulawt n tgecrirt tezmer ad tessaɣ iferdasen d yirawen n tmennaḍt-a aṭas.',
    s2Body2:
      'Taɣuri n yimi n uqerruy (césarienne) daɣen ur tessekfa ara aferdis n lbasin akken ilaq: lḥemla s timmad-is tbeddu d aseggas ameqqran i yiferdasen-a.',
    s2Body3:
      'Seld tulawt, d ayen amagnu ad tettwaḥtaǧ tuɣalin lweqt. Kra n tilawin ur ḥessent ara aṭas, wiyaḍ zemrent ad ẓrent iɣi, ahlil n ugari neɣ tsemmeḍt n uḥkem n yiferdasen.',
    s2TipTitle: 'Yal tuɣalin temxalaf',
    s2TipText:
      'Amanaw n tulawt, azegzaw neɣ episiotomie, tin i yellan n lweǧɛ, d waddad-ik amatu seld tulawt, ttɛeddin ɣef tuɣalin.',

    s3Heading: 'Melmi ara tebdu tuɣalin n uferdis n lbasin?',
    s3Body1:
      'Seld tulawt war ugur, ameẓẓuɣt n uferdis n lbasin s wudem yelhan tezmer ad d-tuɣal s wudem aqrawan. Yelha ad tessewjdeḍ ineɣman i waddad-ik u ad tsuteḍ tallalt ma tɛeddiḍ ugur, lweǧɛ ameqqran neɣ ttuɣal n kra n wazal usligen.',
    s3Body2:
      'Ma tesɛiḍ tabbut n ubeṭṭu (sonde), kra n yiwellihen ssumren ad txedmeḍ ayen-a ar ttwakkes u ar yuɣal ubeṭṭu amagnu send ad tebduḍ ineɣman n lpirine.',
    s3AlertTitle: 'Ur tḥebbeḍ ara lweǧɛ',
    s3AlertText:
      'Lweǧɛ ameqqran, tilɣa i d-yettuɣalen d wayen yellan d aɣelnaw, aḥric ur nettwali ara, neɣ yal kra i k-yeɛnan teḥwağ tallalt n taqabalt, n uṭṭbib neɣ n umaẓrag n tuɣalin.',

    s4Heading: 'Ad tessneḍ amek ara tessemmedeḍ akken iwata',
    s4Body1:
      'I wakken ad tafeḍ ineɣman, sɛu tamuɣli ukud tettḥebseḍ ugaz d uzelmaḍ ɣer yiwen n lweqt. Ineɣman i tebɣiḍ d usemmed d usebbek ɣer daxel.',
    s4Body2:
      'Iswi mačči d asemmed n ugris meṛṛa. Iɣafen, ifassen d uḍar ilaqen ad d-qqimen d izellilen kan, mi ara tkemmleḍ tuffɣa n usemmid amagnu.',
    exercises: [
      {icon: 'weather-windy', label: 'Tuffɣa n usemmid'},
      {icon: 'human-handsup', label: 'Asemmed ahlawan'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Asemmed ameqqran'},
      {icon: 'gesture-tap-button', label: 'Isemmeden uzzigen'},
    ],
    s4HighlightTitle: 'Asenfsel yesɛa azal am usemmed',
    s4HighlightText:
      'Seld yal asemmed, eǧǧ iferdasen ad nfusen akk. Asenneɣ yelhan ur yeqqen ara ɣer usemmed n lpirine ass meṛṛa.',

    s5Heading: 'Taggara n lbarnamaj s wudem aqrawan',
    s5Body1:
      'Deg tazwara, ayen yelhan s waṭas d ad tsenmeḍ iferdasen u ad txedmeḍ ineɣman akken iwata. Lemɛawda tezmer ugar n tezmert.',
    s5h3a: 'Isemmeden ameqqran',
    s5Body2:
      'Semmed aferdis n lbasin s wudem ahlawan, sakin ṭṭef asemmed kra n tasinin war ma tessaṭeḍ asemmid. Sakin eǧǧ-it akk send ad tebduḍ tikkelt-nniḍen.',
    s5h3b: 'Isemmeden imecṭuḥen',
    s5Body3:
      'Mi ara tesɛu ineɣman, tzemreḍ ad ternuḍ isemmeden imecṭuḥen uzzigen. Ttɛawanen ad tsenseḍ tazmert n usemmed uzzig mi ara tettaru uzɣal deg ukerruy, am ṭṭerf send tuccḍa neɣ tatsut.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Qqen ineɣman d tamezzit n yal ass'},
      {icon: 'human-sitting', label: 'Bdu deg waddad yeṛṛaḥen'},
      {icon: 'weather-windy', label: 'Sennef amagnu mi ara tessemmedeḍ'},
      {icon: 'sleep', label: 'Err azal i tallalt n unfusel'},
      {icon: 'chart-line', label: 'Ssemlil ugar s wudem aqrawan'},
      {icon: 'doctor', label: 'Suter tallalt ma yella ur tettḥeqqeḍ ara'},
    ],
    s5TipTitle: 'Lemɛawda qbel kullec',
    s5TipText:
      'Aqqen n yineɣman ɣer tamezzit i yellan yakan deg wass-ik zemren ad k-ɛawnen ad tkemmleḍ: seld unnaw n uqabaɣ, seld usired n tuɣmas, neɣ deg wakud-nniḍen i k-yelhan.',

    s6Heading: 'Tuccḍiwin imeɣtanen ilaqen ad tettwarrent',
    s6Body1:
      'Ineɣman n lpirine zemren ad banen d imecṭuḥ, maca d ayen yewɛer ad tessemreḍ iferdasen-nniḍen neɣ ad tessaṭeḍ aṭas.',
    commonMistakes: [
      'Asemmed n yiɣafen neɣ n uḍar deg ubdil n uferdis n lbasin',
      'Aṭṭaf n usemmid deg usemmed',
      'Aṭṭaf n iferdasen yesmeddan dima war ma tefsiḍ-iten',
      'Aḍfar n yineɣman kra n wussan kan sakin tḥebseḍ',
      'Aḥbas n wumjer n iɣi s wudem uslig i wakken ad tneqqeḍ asemmed',
    ],
    s6TipTitle: 'Ayen ur ilaqen ara',
    s6TipText:
      'Ur yettusumer ara ad txedmeḍ ineɣman s uḥbas n wumjer n iɣi s wudem uslig. Tarrayt-a ur tesseggem ara lpirine akken iwata u tezmer ad tessenfeli tamahut tamagnut n tbuqit.',

    s7Heading: 'Acu n tilɣa ilaqen ad k-yawin ɣer usinag?',
    s7Body1:
      'Iɣi imecṭuḥen neɣ uḥulfu ur nelli ara d amagnu zemren ad d-banen seld tulawt. Maca ur ilaq ara ad ten-tuklalḍ ma ttkemmilen, ma ttuɣalen yir neɣ ma ttɛeṭṭilen tudert-ik n yal ass.',
    warningSigns: [
      'Iɣi n iɣi mi ara tetsedmeḍ, tessmeslayeḍ, tmeṭṭeḍ neɣ mi ara tettaɛǧalt',
      'Uḥulfu n uẓeṭṭa neɣ n uggar deg ukerruy n lbasin',
      'Uḥulfu n wayen ibedden neɣ n kra i d-yettuɣalen ɣer uqqerruy n tgella',
      'Tuccḍa n uṭṭaf n ugaz neɣ n uẓelmaḍ',
      'Lweǧɛ ittkemmilen deg lpirine',
      'Lweǧɛ deg neɣ seld tuddsa n tugniwin',
      'Tuccḍa n usnen neɣ n usemmed akken iwata n yiferdasen n lpirine',
    ],
    consultLabel: 'Melmi ara tsuteḍ talwit?',
    s7Body2:
      'Taqabalt, aṭṭbib neɣ amaẓrag n tuɣalin yettwasnen deg uferdis n lbasin zemren ad ssenqden tazmert n yiferdasen u ad d-sumren barnamaj yelhan.',

    s8Heading: 'D acu seld uzegzaw, episiotomie neɣ taɣuri n yimi n uqerruy (césarienne)?',
    s8Body1:
      'Azegzaw neɣ episiotomie ttḥewwiṣen aɣbel ixusen deg lweqt n usseɣ. Ttuɣalin n yimala ilaqen ad ttwakkan deg uḥsab lweǧɛ, waddad n uḥricen d iwellihen i d-yettwafken seld tulawt.',
    s8Body2:
      'Seld césarienne, tuɣalin teqqen daɣen ɣer uglim n uqerruy d uḥricen. Ula ma yella ur tella ara tulawt s uẓar, lḥemla timmad-is tessaɣ aferdis n lbasin.',
    s8HighlightTitle: 'Aɣbel iwulmen izmer ad yelhu',
    s8HighlightText:
      'Ma yella uzegzaw ameqqran, lweǧɛ, tilɣa n iɣi neɣ n yiɣsan, neɣ uɣilif ittkemmilen, asenqed d umaẓrag n ṣṣeḥḥa yezmer ad yili yelha aṭas.',

    s9Heading: 'Tuɣalin n uzeṭṭa s wudem aqrawan',
    s9Body1:
      'Tuɣalin n tikli seld tulawt ilaq ad tili s wudem aqrawan. Tikli d yisnifilen ahlawan zemren ad uɣalen akken ad tḥessed, maca imala iweɛren s waṭas ttuḥwağen ugar n uḥseb.',
    s9Body2:
      'Send ad terrḍed tazzla, aɣli neɣ asemmid yeqwan aṭas, yelha ad tesnezreḍ tuɣalin n uferdis n lbasin u ad tettwafkeḍ tilɣa deg uḥsab.',
    s9AlertTitle: 'Ur tettaɛǧalt ara deg tfarisin',
    s9AlertText:
      'Iɣi, uḥulfu n uẓeṭṭa neɣ lweǧɛ deg neɣ seld uzeṭṭa d tilɣa i d-yeqqen ad tessenqeseḍ s wudem wezzil u ad tsuteḍ tallalt send ad tessnernud tazmert.',

    s10Heading: 'Melmi ara tẓerreḍ amaẓrag?',
    s10Body1:
      'Tuɣalin n uferdis n lbasin ɣer taqabalt neɣ amaẓrag n tuɣalin tezmer ad tili tlelha ma yella ur tessineḍ ara ma tessemmedeḍ akken iwata, ma ttkemmilent tilɣa neɣ ma tebɣiḍ ad tuɣaleḍ ɣer kra n yimala n tgensa s wuklal.',
    questionCardTitle: 'Isteqsiyen yelhan ad ttwasutren',
    appointmentQuestions: [
      'Tilɣa-iw ttemcabint ɣer tmerẓeq n uferdis n lbasin?',
      'Tessemmeda isemmeden akken iwata?',
      'Acḥal n tikkal ilaqen ad xedmeɣ yal ass?',
      'Zemreɣ ad uɣaleɣ ɣer tazzla, ɣer tgensa neɣ ɣer ineɣman iweɛren?',
      'Ilaq-iyi unnaw n tuɣalin ɣer taqabalt neɣ amaẓrag n tuɣalin?',
      'Azegzaw-iw, tazzla-iw neɣ césarienne-iw ttuḥwağen kra n lḥedd?',
    ],
    s10TipTitle: 'Yelha ad tessneḍ',
    s10TipText:
      'Aẓer n umaẓrag ur yeqqen ara dima ɣer ugur. Asnez yezmer ad k-iɛiwen ad tessenqedeḍ tarrayt-ik, ad tesḥseḍ tuɣalin-ik u ad tessneḍ amek ara tgeddeḍ.',

    s11Heading: 'Tuɣalin yeṭṭafaren lweqt',
    s11Body1:
      'Seld ma tulaḍ, d ayen amagnu ur tuɣaleḍ ara ɣer yiḥulfawen neɣ ɣer tezmert n yiferdasen i tesɛiḍ send lḥemla, deg yiwen n lweqt.',
    s11Body2:
      'Iswi mačči d ad txedmeḍ aṭas n yisemmeden. D ayen ugar n tuɣalin n tarrayt yelhan gar usemmed d unfusel, sakin ad tessemreḍ iferdasen-a s wudem amagnu deg yimala n yal ass.',
    s11HighlightTitle: 'Ssenfar imecṭuḥen d ssenfar n tidet',
    s11HighlightText:
      'Ahulfu ahlawan n usemmid, kra n tasinin d-yernan deg usemmed, neɣ aneqqes n iɣi, d tilɣa yettɛawanen yakan.',

    s12Heading: 'Tifrat tigejdanin',
    summaryTitle: 'Ayen yelhan',
    summaryItems: [
      'Lḥemla d tulawt ttɛeddi-ten aṭas iferdasen n lbasin.',
      'Tuɣalin s wudem aqrawan d ayen amagnu seld tulawt.',
      'Ineɣman ilaqen ad d-ssinfen lǧuda n usemmid uqbel tazmert.',
      'Anfas d unfusel ɛzizen am usemmed.',
      'Iɣi n iɣi, uḥulfu n uẓeṭṭa neɣ lweǧɛ ittkemmilen ilaq-asen rray n umaẓrag.',
      'Tuɣalin ɣer taqabalt neɣ amaẓrag n tuɣalin tezmer ad k-tɛiwen ad d-tafeḍ aḥkem ugar.',
      'Tuɣalin ɣer tgensa ilaq ad tili s wudem aqrawan, nezzeh imala iweɛren.',
    ],

    finalTipTitle: 'Eǧǧ lweqt i wakken ad d-tuɣaleḍ',
    finalTipText:
      'Seld tulawt, ayen i ixeddem ugris-ik yettɛeddi aṭas n yisnifilen. Lpirine yessefk ad yeṭṭef ccan am wayen-nniḍen n ugris-ik: s wudem aqrawan, s lemɛawda u war aẓeṭṭa.',

    disclaimerText:
      'Amagrad-a yella i lǧerr n talɣut kan u ur d-yettnaqqes ara talwit n uṭṭbib i yiman-ik. Ma tḥessed lweǧɛ, tilɣa ittkemmilen neɣ ma tesɛiḍ tuṭṭfa ɣef tuɣalin-ik, suter talwit i umaẓrag n ṣṣeḥḥa.',
  },
  om: {
    badge: 'ERGA DA\'UU BOODA • FAYYUU',
    title: 'Erga da\'anii booda maashaawwan\ndhuunfaa kee jabeessuu',
    metaDuration: 'Daqiiqaa 8 dubbisuu',
    metaType: 'Qajeelfama',
    metaLevel: 'Eegaltoota',
    metaValidated: 'Qabiyyee madaalame',
    intro:
      'Ulfaa fi da\'umsa booda, maashaawwan dhuunfaa fayyuuf yeroo barbaadu. Shaakala salphaa, idaa idaa fi suutuma suutuma ta\'e jabina, to\'annoo fi amantaa deebisuuf si gargaaruu danda\'a, osoo ariifachuu hin yaaliin.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Hojii perineum hubachuu',
      'Maaliif da\'umsi isa dhiphisa',
      'Yoom fayyisuu maashaa dhuunfaa eegaluu',
      'Sirnaan maashaa qabsiisuu barachuu',
      'Gochaa suutuma suutuma ta\'e ijaaruu',
      'Dogoggora irraa of eeguu',
      'Yoom gargaarsa gaafachuu',
      'Suutuma suutuma ispoortii deebi\'uu',
      'Beellama yaalaaf of qopheessuu',
      'Ejjennoowwan ijoo',
    ],
    shareMessage: 'Erga da\'anii booda maashaawwan dhuunfaa kee jabeessuu — AWA',

    s1Heading: 'Hojii perineum hubachuu',
    s1Body1:
      'Perineum, maashaawwan dhuunfaa (pelvic floor) jedhamus, gareen maashaa gadi aanaa dhuunfaa keessa jiru dha. Fincaan fi geengoo to\'achuu irratti, akkasumas qaamolee dhuunfaa deeggaruu irratti gahee qaba.',
    s1Body2:
      'Yeroo ulfaa, maashaawwan kun ji\'oota baay\'ee ulfina dabalataa baachuu qabu. Yeroo da\'umsas dhiibbaa guddaa irra bu\'u.',
    s1HighlightTitle: 'Maashaa callisaa garuu murteessaa',
    s1HighlightText:
      'Maashaan dhuunfaa hojii guyyaa guyyaa baay\'ee keessatti hirmaata: fincaa fi bobaa qabachuu, bubbee to\'achuu, qaamolee dhuunfaa deeggaruu, fi hojii saalaa tokko tokko keessatti gahee qabaachuu.',

    benefitsHeading: 'Maashaan dhuunfaa jabaate bu\'aa isaa',
    benefitsIntro:
      'Jabeessuun suutuma suutuma ta\'e fi sirnaan raawwatame to\'annoo fi deeggarsa maashaa dhuunfaa fooyyessuuf gargaaruu danda\'a.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'To\'annoo fincaa gaarii',
        text: 'Maashaan dhuunfaa to\'annoo fincaa irratti gahee qaba. Suutuma suutuma jabeessuun dhangala\'uu fincaa tokko tokko hir\'isuuf gargaaruu danda\'a.',
      },
      {
        icon: 'toilet',
        title: 'Hojii geengoo deeggaruu',
        text: 'Maashaawwan kun bubbee fi bobaa to\'achuu irratti ni gargaaru, qaamolee dhuunfaa deeggaruus irratti ni gumaacha.',
      },
      {
        icon: 'human-female',
        title: 'Qaamolee dhuunfaa deeggaruu',
        text: 'Maashaan dhuunfaa bu\'uura maashaa dhugaa uuma kan fincaan, mudhii dhaabaa (uterus) fi geengoo deeggaruuf gargaaru.',
      },
      {
        icon: 'heart-pulse',
        title: 'Suutuma suutuma miira deebisuu',
        text: 'Fayyisuun sirrii ta\'e bakka kana caalaatti hubachuu fi to\'achuu deebisuuf si gargaaruu danda\'a.',
      },
    ],

    s2Heading: 'Maaliif ulfaa fi da\'umsi isa dhiphisa',
    s2Body1:
      'Ulfaan suutuma suutuma maashaa dhuunfaa irratti dhiibbaa dabaluu. Da\'umsi dhaloota qaama saalaa karaa dhiibbaa bakka kana keessatti maashaa fi qaama baay\'ee dheeressuu danda\'a.',
    s2Body2:
      'Da\'umsi cesarean (muruu) illee maashaa dhuunfaa guutummaatti hin eegu: ulfaan ofii isaa maashaawwan kanaaf yeroo murteessaa dha.',
    s2Body3:
      'Erga da\'anii booda, fayyuun yeroo fudhachuun waan baratamaa dha. Dubartoonni tokko tokko mallattoo ba\'aa hin qaban; kaan immoo dhangala\'uu, miira ulfaatina, ykn to\'annoo maashaa hir\'ate hubachuu danda\'u.',
    s2TipTitle: 'Fayyuun hundi garaagara',
    s2TipText:
      'Gosa da\'umsaa, dhiita\'uu ykn muruu (episiotomy), dhukkubbii jiraachuu, fi haala keessa fayyaa kee erga da\'anii booda hundi fayyuu irratti dhiibbaa gochuu danda\'u.',

    s3Heading: 'Fayyisuun maashaa dhuunfaa yoom eegala?',
    s3Body1:
      'Da\'umsa rakkoo hin qabne booda, maashaa dhuunfaa laaffisanii qabsiisuun suutuma suutuma deebi\'uu danda\'a. Shaakala haala keetiif sirreessuun, rakkoo, dhukkubbii guddaa, ykn tooftaa addaa yoo si mudate gorsa barbaaduun barbaachisaa dhaa.',
    s3Body2:
      'Yoo kaatetera fincaa qabaatte, gorsi tokko tokko hanga isaa baafamee fi fincaan sirrii deebi\'ee eegaluu eeguu akka filatamu agarsiisu, shaakala perineum kan eegaltu.',
    s3AlertTitle: 'Dhukkubbii irratti hin dhiibin',
    s3AlertText:
      'Dhukkubbii guddaa, mallattoo hammaataa, madaa sirriitti hin fayyine, ykn yaaddoo addaa kamiyyuu gorsa ogeessa da\'umsaa, doktora, ykn ogeessa fayyisuu barbaada.',

    s4Heading: 'Sirnaan maashaa qabsiisuu barachuu',
    s4Body1:
      'Sochii kana adda baasuuf, bubbee fi fincaa tokkummaan qabachuuf yaaluu yaadi. Sochiin barbaaddu miira qabsiisuu fi gara keessaatti ol baasuu dha.',
    s4Body2:
      'Kaayyoon qaama kee guutuu cimsuu miti. Dugdi kee, luka kee fi garaan kee dandeettii keetiin laafaa ta\'uu qaba, afuufni immoo akkuma baratametti itti fufa.',
    exercises: [
      {icon: 'weather-windy', label: 'Afuufuu'},
      {icon: 'human-handsup', label: 'Qabsiisuu laafaa'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Qabsiisuu dheeraa'},
      {icon: 'gesture-tap-button', label: 'Qabsiisuu dafaa'},
    ],
    s4HighlightTitle: 'Laaffachuun akkasuma barbaachisaa dha',
    s4HighlightText:
      'Qabsiisuu hundaa booda, maashaan guutummaatti haa laaffatu. Fayyisuun gaariin perineum guyyaa guutuu qabsiisuu jechuu miti.',

    s5Heading: 'Gochaa suutuma suutuma ta\'e ijaaruu',
    s5Body1:
      'Jalqaba irratti, waan guddaan maashaa adda baasuu fi sochii sirnaan raawwachuu barachuu dha. Itti fufiinsi cimina caalaa murteessaa dha.',
    s5h3a: 'Qabsiisuu dheeraa',
    s5Body2:
      'Maashaa dhuunfaa laaffisanii qabsiisi, achiis sekondii muraasaaf qabi, afuuffee hin qabin. Itti aansee guutummaatti gadhiisi, yeroo biraa osoo hin eegalin dura.',
    s5h3b: 'Qabsiisuu gabaabaa',
    s5Body3:
      'Sochiin yoo baratame, qabsiisuun xixiqqaa fi dafaa dabaluu ni danda\'ama. Yeroo dhiibbaan garaa dabalu maashaa dafee qabsiisuuf dandeettii leenjisuuf gargaaru, fakkeenyaaf osoo hin qufaa ykn hin atamin dura.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Shaakala gochaa guyyaa guyyaa waliin wal-qabsiisi'},
      {icon: 'human-sitting', label: 'Teessuma mijaa\'aa irraa jalqabi'},
      {icon: 'weather-windy', label: 'Yeroo qabsiisuu akkuma baratametti afuufi'},
      {icon: 'sleep', label: 'Yeroo laaffachuu kabajii'},
      {icon: 'chart-line', label: 'Suutuma suutuma ulfinaa dabali'},
      {icon: 'doctor', label: 'Yoo mirkaneeffachuu dhabde gorsa gaafadhu'},
    ],
    s5TipTitle: 'Itti fufiinsi hunda caalaa',
    s5TipText:
      'Shaakala gochaa guyyaa kee keessa jiru waliin wal-qabsiisuun itti fufuuf salphisuu danda\'a: erga hiyyeessanii booda, erga ilkaan dhiqatee booda, ykn yeroo biraa siif mijaa\'u.',

    s6Heading: 'Dogoggora baratamaa irraa of eeguu',
    s6Body1:
      'Shaakalli perineum salphaa fakkaachuu danda\'a, garuu maashaa biraan bakka buusuu ykn baay\'ee dhiibuu salphaa dha.',
    commonMistakes: [
      'Maashaa dhuunfaa bakka buusuun dugda ykn luka cimsuu',
      'Yeroo qabsiisuu afuuffee qabuu',
      'Maashaa yeroo hunda qabsiisanii osoo hin laaffisin turuu',
      'Guyyaa muraasaaf qofa shaakaluu achiis dhaabuu',
      'Fincaa kan itti fufu of-barsiisanii dhaabuun qabsiisuu ilaaluu',
    ],
    s6TipTitle: 'Waan hin gochiin',
    s6TipText:
      'Fincaa of-barsiisanii dhaabuun shaakaluun hin gorfamu. Mala kun perineum sirnaan hin leenjisu, hojii fincaa baratamaa tokko tokko gufachiisuu danda\'a.',

    s7Heading: 'Mallattooleen kam doktora ilaaluuf si kakaasuu qaba?',
    s7Body1:
      'Dhangala\'uun xiqqaa ykn miirri hin baratamne erga da\'anii booda yeroo tokko tokko mul\'achuu danda\'a. Garuu yoo itti fufan, yoo hammaatan, ykn jireenya guyyaa guyyaa keessatti rakkoo fidan, tuffachuu hin qaban.',
    warningSigns: [
      'Yeroo qufaa, atamuu, kolfuu ykn ciniinsu fincaan dhangala\'uu',
      'Miira ulfaatina ykn dhiibbaa dhuunfaa gadii irratti',
      'Miira tokko tokko ykn waan tokko qaama saalaa keessatti gad bu\'uu',
      'Bubbee ykn bobaa qabachuuf rakkoo',
      'Dhukkubbii itti fufu perineum irratti',
      'Yeroo ykn erga wal-qunnamtii saalaa booda dhukkubbii',
      'Maashaawwan perineum adda baasuu ykn sirnaan qabsiisuuf rakkoo',
    ],
    consultLabel: 'Yoom gorsa gaafachuu qabda?',
    s7Body2:
      'Ogeessi da\'umsaa, doktorri, ykn fiizioteraapistiin fayyisuu maashaa dhuunfaa irratti leenjifame hojii maashaa ilaaluu fi pirogiraama mijaa\'u dhiheessuu danda\'a.',

    s8Heading: 'Dhiita\'uu, muruu (episiotomy), ykn cesarean booda hoo?',
    s8Body1:
      'Dhiita\'uun ykn muruun yeroo fayyuu eegumsa addaa barbaada. Hojiiwwan deebi\'anii eegaluun dhukkubbii, haala madaa fi qajeelfama erga da\'anii booda kenname ilaalcha keessa galchuu qaba.',
    s8Body2:
      'Cesarean booda, fayyuun dhaabaa garaa fi madaa illee of keessaa qaba. Da\'umsi karaa qaama saalaa hin taanes, ulfaan ofii isaa maashaa dhuunfaa irratti dhiibbaa geessise.',
    s8HighlightTitle: 'Eegumsi ofii-isaaf ta\'e ni gargaara',
    s8HighlightText:
      'Haala dhiita\'uu guddaa, dhukkubbii, mallattoo fincaa ykn geengoo, ykn rakkoo itti fufuu keessatti, ogeessa fayyaa waliin madaalluun addaan gargaaraa ta\'uu danda\'a.',

    s9Heading: 'Suutuma suutuma ispoortii deebi\'uu',
    s9Body1:
      'Erga da\'anii booda sochii deebi\'uun suutuma suutuma ta\'uu qaba. Adeemuu fi sochii laafaa akkuma miira keetti deebi\'uu ni danda\'ama, hojiiwwan dhiibbaa guddaa qaban immoo of eeggannoo dabalataa barbaadu.',
    s9Body2:
      'Fiigicha, utaaluu, ykn leenjii baay\'ee cimaa deebi\'anii eegaluu dura, fayyuu maashaa dhuunfaa madaaluu fi mallattoo kamiyyuu ilaalcha keessa galchuun gaarii dha.',
    s9AlertTitle: 'Sadarkaalee hin ariifatin',
    s9AlertText:
      'Dhangala\'uu, miira ulfaatina, ykn yeroo ykn erga shaakalaa booda dhukkubbii mallattoo suuta jedhee ciminaa dabaluu dura gorsa gaafachuu si barbaachisu dha.',

    s10Heading: 'Yoom ogeessa addaa argu?',
    s10Body1:
      'Fayyisuun maashaa dhuunfaa ogeessa da\'umsaa ykn fiizioteraapistii waliin yoo sirnaan qabsiisuu dhiisuu mirkaneeffachuu dhabde, yoo mallattooleen kee itti fufan, ykn hojii qaamaa tokko tokko amantaadhaan deebi\'uu yoo barbaadde gargaaruu danda\'a.',
    questionCardTitle: 'Gaaffilee gargaaran',
    appointmentQuestions: [
      'Mallattooleen koo laafina maashaa dhuunfaa waliin wal-simataa?',
      'Qabsiisuu sirnaan raawwachaa jiraa?',
      'Guyyaa guyyaan irra deddeebi\'ee hammam gochuu qaba?',
      'Gara fiigichaa, ispoortii, ykn shaakala dhiibbaa guddaa qabuu deebi\'uu danda\'aa?',
      'Ogeessa da\'umsaa ykn fiizioteraapistii waliin fayyisuun na barbaachisaa?',
      'Madaan koo, dhiita\'uun koo, ykn cesarean koo of eeggannoo addaa barbaadaa?',
    ],
    s10TipTitle: 'Beekuun gaarii dha',
    s10TipText:
      'Ogeessa ilaaluun wanti tokko dogoggora jechuu hin ta\'u. Yeroon tokko mala kee ilaaluu, fayyuu kee madaaluu fi sirnaan fuulduratti deemuu barachuuf gargaaruu danda\'a.',

    s11Heading: 'Fayyuun yeroo fudhatu',
    s11Body1:
      'Erga da\'anii booda, miirri fi jabinni maashaa ulfaa duraa yeruma sana deebi\'uu dhabuun waan baratamaa dha.',
    s11Body2:
      'Kaayyoon hamma danda\'ametti qabsiisuu baay\'ee gochuu miti. Caalaatti suutuma suutuma qabsiisuu fi laaffachuu gidduutti walsimannaa gaarii deebisuu, achiis maashaawwan kana hojii guyyaa guyyaa keessatti uumamaan fayyadamuu danda\'uu dha.',
    s11HighlightTitle: 'Guddina xiqqaan guddina dhugaa dha',
    s11HighlightText:
      'Sochii caalaatti hubachuu, sekondii muraasa dabalataa qabsiisuu, ykn dhangala\'uu hir\'achuun mallattoo kajeelchu dha.',

    s12Heading: 'Ejjennoowwan ijoo',
    summaryTitle: 'Ijoo isaa',
    summaryItems: [
      'Ulfaa fi da\'umsi maashaa dhuunfaa irratti dhiibbaa guddaa geessisa.',
      'Erga da\'anii booda suutuma suutuma fayyuun waan baratamaa dha.',
      'Shaakalli cimina caalaa qulqullina sochii dursuu qaba.',
      'Afuufuu fi laaffachuun akkuma qabsiisuu barbaachisaa dha.',
      'Dhangala\'uu fincaa, ulfaatina, ykn dhukkubbii itti fufuun yaada ogeessaa hin barbaachisa.',
      'Fayyisuun ogeessa da\'umsaa ykn fiizioteraapistii waliin to\'annoo caalaatti deebisuuf si gargaaruu danda\'a.',
      'Ispoortii deebi\'uun suutuma suutuma ta\'uu qaba, keessumaa hojiiwwan dhiibbaa guddaa qabaniif.',
    ],

    finalTipTitle: 'Fayyuuf yeroo kenni',
    finalTipText:
      'Erga da\'anii booda, qaamni kee jijjiirama baay\'ee keessa darbeera. Perineumiin akkuma qaama kee hafe xiyyeeffannoo isaaf malu argachuu qaba: suutuma suutuma, idaa idaa, osoo dhiibbaa hin qabaatin.',

    disclaimerText:
      'Barruun kun odeeffannoo qofaaf; gorsa yaalaa ofii-isaaf ta\'e hin bakkaa bu\'u. Yoo dhukkubbii, mallattoo itti fufu, ykn yaaddoo fayyuu kee ilaalchisee qabaatte, ogeessa fayyaa irraa gorsa gaafadhu.',
  },
  ti: {
    badge: 'ድሕሪ ወሊድ • ምጥጣዕ',
    title: 'ድሕሪ ወሊድ ጭዋዳታት\nሕቝፊ ምጥንካር',
    metaDuration: '8 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro:
      'ድሕሪ ጥንሲን ወሊድን፣ ጭዋዳታት ሕቝፊ ንምምላስ ግዜ የድልዮም። ቀሊላት፣ ቀጻልቲን ቀስ ብቀስ ዝኽዱ ልምምዳት ሓይሊ፣ ቁጽጽርን ተኣማንነትን ክትመልስ ክሕግዙኻ ይኽእሉ፣ ነገራት ከይተቐልጠፍካ።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ግደ ፔሪኒየም ምርዳእ',
      'ወሊድ ስለምንታይ ጸቕጢ የስዕብ',
      'ልምምድ ጭዋዳታት ሕቝፊ መዓስ ይጅምር',
      'ብትኽክል ምጽባጥ ምምሃር',
      'ቀስ ብቀስ ዝኸይድ መደብ ምምስራት',
      'ክትርሕቆም ዘለካ ጌጋታት',
      'ሓገዝ መዓስ ትሓትት',
      'ቀስ ብቀስ ስፖርት ምጅማር',
      'ንቆጸራ ምድላው',
      'ቀንዲ ነጥብታት',
    ],
    shareMessage: 'ድሕሪ ወሊድ ጭዋዳታት ሕቝፊ ምጥንካር — AWA',

    s1Heading: 'ግደ ፔሪኒየም ምርዳእ',
    s1Body1:
      'ፔሪኒየም፣ ጭዋዳታት ሕቝፊ እውን ዝበሃል፣ ኣብ ታሕቲ ሕቝፊ ዝርከብ ጉጅለ ጭዋዳታት እዩ። ኣብ ምቁጽጻር ሽንቲ ከብዲ ዘለዎ ግደ ኣለዎ፣ ኣካላት ሕቝፊ ከኣ ይሕግዝ።',
    s1Body2:
      'ኣብ ጥንሲ እዞም ጭዋዳታት ን ብዙሕ ኣዋርሕ ተወሳኺ ክብደት ክጸውሩ ኣለዎም። ኣብ ወሊድ እውን ዓቢ ጸቕጢ ይወርዶም።',
    s1HighlightTitle: 'ኣዝዩ ኣገዳሲ ግን ዘይረአ ጭዋዳ',
    s1HighlightText:
      'ጭዋዳታት ሕቝፊ ኣብ ብዙሓት መዓልታዊ ተግባራት ይሳተፉ፦ ሽንትን ሰገራን ምሕዛል፣ ጋዝ ምቁጽጻር፣ ኣካላት ሕቝፊ ምድጋፍ፣ ኣብ ገለ ምስ ጾታ ዝተኣሳሰሩ ተግባራትውን ግደ ምጽዋት።',

    benefitsHeading: 'ዝሓየለ ጭዋዳታት ሕቝፊ ረብሓታት',
    benefitsIntro:
      'ቀስ ብቀስ ብትኽክል ዝግበር ምጥንካር ቁጽጽርን ደገፍን ጭዋዳታት ሕቝፊ ክሕግዝ ይኽእል።',
    benefits: [
      {
        icon: 'water-outline',
        title: 'ዝሓሸ ምቁጽጻር ፊኛ',
        text: 'ጭዋዳታት ሕቝፊ ኣብ ምቁጽጻር ፊኛ ግደ ኣለዎም። ቀስ ብቀስ ምጥንካሮም ገለ ናይ ሽንቲ ምፍሳስ ክውስድ ይኽእል።',
      },
      {
        icon: 'toilet',
        title: 'ተግባር ከብዲ ምድጋፍ',
        text: 'እዞም ጭዋዳታት ጋዝን ሰገራን ምቁጽጻርን ኣካላት ሕቝፊ ምድጋፍን ይሕግዙ።',
      },
      {
        icon: 'human-female',
        title: 'ኣካላት ሕቝፊ ምድጋፍ',
        text: 'ጭዋዳታት ሕቝፊ ንፊኛ፣ ማህጸንን ከብዲን ዝሕግዝ ሓቀኛ ጭዋዳዊ መሰረት እዩ።',
      },
      {
        icon: 'heart-pulse',
        title: 'ቀስ ብቀስ ስምዒት ምምላስ',
        text: 'ዝግበኣ ምጥጣዕ ንዚ ቦታ ዝሓሸ ዕዉት ምፍላጥን ቁጽጽርን ክሕግዝ ይኽእል።',
      },
    ],

    s2Heading: 'ጥንሲን ወሊድን ስለምንታይ ጸቕጢ የስዕብ',
    s2Body1:
      'ጥንሲ ቀስ ብቀስ ኣብ ጭዋዳታት ሕቝፊ ዝያዳ ጸቕጢ የውርድ። ብምሕጽኖ ወሊድ እቶም ጭዋዳታትን ሕብሪታትን ኣብዚ ቦታ ብዓቢኡ ክሰሓቡ ይኽእሉ።',
    s2Body2:
      'ብቀዶ ጥገና ወሊድ እውን ንጭዋዳታት ሕቝፊ ምሉእ ብምሉእ ኣየድሕንን፦ ባዕሉ ጥንሲ ንዞም ጭዋዳታት ኣገዳሲ ግዜ እዩ።',
    s2Body3:
      'ድሕሪ ወሊድ፣ ምምላስ ግዜ ምውሳዱ ልሙድ እዩ። ገለ ደቀንስትዮ ዳርጋ ምንም ምልክት ኣይስምዓን፣ ካልኦት ድማ ምፍሳስ፣ ስምዒት ክብደት፣ ወይ ጭዋዳ ምቁጽጻር ምጉዳል ክሰምዓ ይኽእላ።',
    s2TipTitle: 'ነፍሲ ወከፍ ምምላስ ፍሉይ እዩ',
    s2TipText:
      'ዓይነት ወሊድ፣ ምስንጣቕ ወይ ኤፒዚዮቶሚ፣ ሓሞት ምህላው፣ ድሕሪ ወሊድ ሓፈሻዊ ኩነታትካ ኩሉ ንምምላስ ክጸሉ ይኽእሉ።',

    s3Heading: 'ልምምድ ጭዋዳታት ሕቝፊ መዓስ ይጅምር?',
    s3Body1:
      'ድሕሪ ዘይተሸገረ ወሊድ፣ ለስሕ ምጽባጥ ጭዋዳታት ሕቝፊ ብሓፈሻ ቀስ ብቀስ ክጅምር ይከኣል። ልምምዳት ምስ ኩነታትካ ምምዕባል ኣገዳሲ እዩ፣ ሸግር፣ ዓቢ ሓሞት ወይ ፍሉይ ኣሰራርሓ እንተ ኔሩ ምኽሪ ሕተት።',
    s3Body2:
      'ናይ ሽንቲ ካቴተር እንተ ኣልዩኻ፣ ገለ ምኽሪታት ክሳብ ዝወሃብ ከምኡውን ልሙድ ሽንቲ ዝመልስ ምጽባይ ቅድሚ ልምምድ ፔሪኒየም ከም ዝጅመር ይሕብሩ።',
    s3AlertTitle: 'ብሓሞት ኣይተገድድ',
    s3AlertText:
      'ዓቢ ሓሞት፣ ዝኸፍአ ምልክታት፣ ብጽቡቕ ዘይፈውስ ቁስሊ፣ ወይ ዝኾነ ፍሉይ ጭንቀት ምኽሪ ካብ ወላዲት፣ ሓኪም፣ ወይ ሞያዊ ምጥጣዕ የድልዩ።',

    s4Heading: 'ብትኽክል ምጽባጥ ምምሃር',
    s4Body1:
      'ንምንቅስቓስ ንምልላይ፣ ጋዝን ሽንቲ ምሕዛል ድሌትን ብሓደ ግዜ ከም ትሕዝ ሕሰብ። እቲ ትደልዮ ምንቅስቓስ ናብ ውሽጢ ምጽባጥን ምልዓልን ስምዒት እዩ።',
    s4Body2:
      'ዕላማኡ ምሉእ ኣካልካ ብሓይሊ ምጽባጥ ኣይኮነን። ቅልጥምትን ጭዋዳታት ጭሕምን ከብድን ክተኽእል ዝተኻእለ ተዘልዓል ክኾኑ ኣለዎም፣ ምትንፋስ ድማ ልሙድ ይቕጽል።',
    exercises: [
      {icon: 'weather-windy', label: 'ምትንፋስ'},
      {icon: 'human-handsup', label: 'ለሳሕ ምጽባጥ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ነዊሕ ምጽባጥ'},
      {icon: 'gesture-tap-button', label: 'ቅልጡፍ ምጽባጥ'},
    ],
    s4HighlightTitle: 'ምዝላል ብተመሳሳሊ ኣገዳሲ እዩ',
    s4HighlightText:
      'ድሕሪ ነፍሲ ወከፍ ምጽባጥ፣ ጭዋዳታት ምሉእ ብምሉእ ይዘልዑ። ጽቡቕ ምጥጣዕ ፔሪኒየም ምሉእ መዓልቲ ተጸቢጡ ምሓዝ ማለት ኣይኮነን።',

    s5Heading: 'ቀስ ብቀስ ዝኸይድ መደብ ምምስራት',
    s5Body1:
      'ኣብ መጀመርታ፣ እቲ ዝዓበየ ነገር ጭዋዳታት ምልላይን ምንቅስቓስ ብትኽክል ምግባርን እዩ። ቀጻልነት ካብ ሓይሊ ይበልጽ።',
    s5h3a: 'ነዊሕ ምጽባጥ',
    s5Body2:
      'ጭዋዳታት ሕቝፊ ብለሳሕ ጽባጥ፣ ደሓር ንገለ ካልኢታት ምትንፋስ ከይሓዝካ ሓዞ። ደሓር ቅድሚ ዳግም ምጅማር ምሉእ ብምሉእ ልቀቖ።',
    s5h3b: 'ሓጸርቲ ምጽባጥ',
    s5Body3:
      'ምንቅስቓስ ምስ ተጸንዐ፣ ንኣሽቱ ቅልጡፋት ምጽባጥ ክውሰኹ ይኽእሉ። ጸቕጢ ከብዲ ምስ ዝውስኽ፣ ከም ቅድሚ ምስዓል ወይ ምስንባዝ፣ ጭዋዳታት ብቕልጡፍ ንምጽባጥ ዘለካ ዓቕሚ የሰልጥኑ።',
    dailyTips: [
      {icon: 'clock-outline', label: 'ንልምምዳት ምስ መዓልታዊ ልምዲ ኣሳሰሮም'},
      {icon: 'human-sitting', label: 'ብምቹእ ኩነታት ጀምር'},
      {icon: 'weather-windy', label: 'ኣብ ግዜ ምጽባጥ ብልሙድ ተንፍስ'},
      {icon: 'sleep', label: 'ግዜ ምዝላል ኣኽብር'},
      {icon: 'chart-line', label: 'ቀስ ብቀስ ጽንኑ ውስኽ'},
      {icon: 'doctor', label: 'እንተ ዘይተኣሚንካ ምኽሪ ሕተት'},
    ],
    s5TipTitle: 'ቀጻልነት ልዕሊ ኩሉ',
    s5TipText:
      'ንልምምዳት ምስ ኣብ መዓልትኻ ዘሎ ልምዲ ምድማር ቀጻሊ ክትከውን የቐልል፦ ድሕሪ ምምጋብ፣ ድሕሪ ስኒ ምጽራይ፣ ወይ ካልእ ንዓኻ ዝበቅዕ ግዜ።',

    s6Heading: 'ክትርሕቆም ዘለካ ልሙዓት ጌጋታት',
    s6Body1:
      'ልምምዳት ፔሪኒየም ቀሊላት ክመስላ ይኽእላ፣ ግን ብካልኦት ጭዋዳታት ምትካእ ወይ ብዙሕ ምግፋሕ ቀሊል እዩ።',
    commonMistakes: [
      'ኣብ ክንዲ ጭዋዳታት ሕቝፊ ኣልያትን ጭንዳን ምጽባጥ',
      'ኣብ ግዜ ምጽባጥ ምትንፋስ ምሓዝ',
      'ከይዘልዐ ጭዋዳታት ኩሉ ግዜ ተጸቢጦም ምሓዝ',
      'ንሒደት መዓልታት ጥራይ ልምምድ ምግባርን ደሓር ምቁራጽን',
      'ምጽባጥ ንምርግጋጽ ብፍላጥ ፍሰት ሽንቲ ምቁራጽ',
    ],
    s6TipTitle: 'እንታይ ኣይግበርን',
    s6TipText:
      'ብፍላጥ ፍሰት ሽንቲ ብምቁራጽ ልምምዳት ምግባር ኣይምከርን። እዚ ኣገባብ ፔሪኒየም ብትኽክል ኣየሰልጥንን፣ ልሙድ ተግባር ፊኛ ድማ ከዛብዕ ይኽእል።',

    s7Heading: 'ኣየናይ ምልክታት ሕክምናዊ ምኽሪ የድልዩ?',
    s7Body1:
      'ድሕሪ ወሊድ ንኣሽቱ ምፍሳስን ዘይልሙድ ስምዒትን ሓደ ሓደ ግዜ ክርአ ይኽእል። ግን ምስ ዝቕጽሉ፣ ምስ ዝኸፍኡ፣ ወይ መዓልታዊ ህይወትካ ምስ ዘጸልዉ ክዝንግዑ የብሎምን።',
    warningSigns: [
      'ምስ ትስዕል፣ ትስነብዝ፣ ትስሕቕ ወይ ትግፍሕ ምፍሳስ ሽንቲ',
      'ኣብ ታሕቲ ሕቝፊ ስምዒት ክብደት ወይ ጸቕጢ',
      'ሓደ ቍራሕ ወይ ገለ ነገር ናብ መሓመድ ዝወርድ ዝመስል ስምዒት',
      'ጋዝ ወይ ሰገራ ምሕዛል ሽግር',
      'ኣብ ፔሪኒየም ዘይሓልፍ ቃንዛ',
      'ኣብ ግዜ ወይ ድሕሪ ጾታዊ ርክብ ቃንዛ',
      'ጭዋዳታት ፔሪኒየም ብትኽክል ምልላይ ወይ ምጽባጥ ሽግር',
    ],
    consultLabel: 'ምኽሪ መዓስ ትሓትት?',
    s7Body2:
      'ኣብ ምጥጣዕ ጭዋዳታት ሕቝፊ ዝተፈለየ ወላዲት፣ ሓኪም ወይ ፊዚዮቴራፒስት ተግባር ጭዋዳታት ክርእይን ዝበቅዕ መደብ ክሕብርን ይኽእል።',

    s8Heading: 'ድሕሪ ምስንጣቕ፣ ኤፒዚዮቶሚ ወይ ቀዶ ጥገና ወሊድኸ?',
    s8Body1:
      'ምስንጣቕ ወይ ኤፒዚዮቶሚ ኣብ ግዜ ምሕዋይ ፍሉይ ክንክን የድልዮ። ንጥፈታት ምጅማር ቃንዛ፣ ኩነታት ምልክትን ድሕሪ ወሊድ ዝተዋህበ መምርሒን ኣብ ግምት ከእትው ኣለዎ።',
    s8Body2:
      'ድሕሪ ቀዶ ጥገና ወሊድ፣ ምምላስ ንጓሓፍ ከብድን ምልክትን እውን ይሓዝ። ወሊዱ ብመንገዲ ምድሪ ኣይኮነን እኳ ይኹን፣ ጥንሲ ባዕሉ ኣብ ጭዋዳታት ሕቝፊ ጸቕጢ ኣውሪዱ።',
    s8HighlightTitle: 'ውልቃዊ ክንክን ክሕግዝ ይኽእል',
    s8HighlightText:
      'ኣብ ዓቢ ምስንጣቕ፣ ቃንዛ፣ ናይ ሽንቲ ወይ ከብዲ ምልክታት፣ ወይ ዘይሓልፍ ሽግራት፣ ምስ ጥዕና ሰራሕተኛ ዝግበር ግምገማ ብፍላይ ክሕግዝ ይኽእል።',

    s9Heading: 'ቀስ ብቀስ ስፖርት ምጅማር',
    s9Body1:
      'ድሕሪ ወሊድ ምንቅስቓስ ምጅማር ቀስ ብቀስ ክኸውን ኣለዎ። ምጉያይን ለሳሕ ምንቅስቓሳትን ብብዝሒ ከም ዝስምዓካ ክጅምር ይከኣል፣ ጽኑዕ ጽልዋ ዘለዎም ንጥፈታት ግን ዝያዳ ጥንቃቐ የድልዩ።',
    s9Body2:
      'ቅድሚ ምጉያይ፣ ምድሃይ፣ ወይ ኣዝዩ ጽኑዕ ልምምድ ምጅማር፣ ምምላስ ጭዋዳታት ሕቝፊ ምግምጋምን ዝኾነ ምልክት ኣብ ግምት ምእታውን ይሓሽ።',
    s9AlertTitle: 'ደረጃታት ኣይትቀልጥፍ',
    s9AlertText:
      'ምፍሳስ፣ ስምዒት ክብደት፣ ወይ ኣብ ግዜ ወይ ድሕሪ ልምምድ ቃንዛ ምቅልጣፍ ከተዘንግዕን ቅድሚ ሓይሊ ምውሳኽ ምኽሪ ክትሓትትን ዘሎካ ምልክታት እዮም።',

    s10Heading: 'ሓኪም ፍሉይ መዓስ ትርኢ?',
    s10Body1:
      'ምስ ወላዲት ወይ ፊዚዮቴራፒስት ዝግበር ምጥጣዕ ጭዋዳታት ሕቝፊ፣ ብትኽክል ከም እትጽብጥ እንተ ዘይተኣሚንካ፣ ምልክታትካ እንተቐጸሉ፣ ወይ ገለ ኣካላዊ ንጥፈታት ብተኣማንነት ክትጅምር እንተደሊኻ ክሕግዝ ይኽእል።',
    questionCardTitle: 'ክትሓትቶም ዝግብኡ ጠቓሚ ሕቶታት',
    appointmentQuestions: [
      'ምልክታተይ ምስ ድኽመት ጭዋዳታት ሕቝፊ ይሰማማዑ ዶ?',
      'ምጽባጥ ብትኽክል እገብር ዶ?',
      'መዓልታዊ ክንደይ ግዜ ክደጋግም ኣለኒ?',
      'ናብ ምጉያይ፣ ስፖርት፣ ወይ ጽኑዕ ልምምድ ክምለስ ይኽእል ዶ?',
      'ምስ ወላዲት ወይ ፊዚዮቴራፒስት ምጥጣዕ የድልየኒ ዶ?',
      'ምልክተይ፣ ምስንጣቕ፣ ወይ ቀዶ ጥገና ወሊደይ ፍሉይ ጥንቃቐ የድልዮ ዶ?',
    ],
    s10TipTitle: 'ጽቡቕ ምፍላጥ',
    s10TipText:
      'ሞያዊ ምርኣይ ገለ ነገር ጌጋ ኣሎ ማለት ኣይኮነን። ሓደ ኣጋጣሚ ዘገባብካ ንምርግጋጽ፣ ምምላስካ ንምግምጋምን ብትኽክል ክትቅጽል ንምምሃርን ክሕግዝ ይኽእል።',

    s11Heading: 'ግዜ ዝወስድ ምምላስ',
    s11Body1:
      'ድሕሪ ወሊድ፣ ቅድሚ ጥንሲ ዝነበረካ ተመሳሳሊ ስምዒትን ሓይልን ብቕልጡፍ ዘይምምላስ ልሙድ እዩ።',
    s11Body2:
      'ዕላማኡ ክሳብ ዝከኣል ብዙሕ ምጽባጥ ምግባር ኣይኮነን። ቀስ ብቀስ ኣብ መንጎ ምጽባጥን ምዝላልን ጽቡቕ ምትእስሳር ምምላስን ደሓር ንዞም ጭዋዳታት ብተፈጥሮ ኣብ መዓልታዊ ንጥፈታት ምጥቃምን ይበልጽ።',
    s11HighlightTitle: 'ንኣሽቱ ምዕባለታት ሓቀኛ ምዕባለታት እዮም',
    s11HighlightText:
      'ንምንቅስቓስ ዝሓሸ ምፍላጥ፣ ገለ ተወሳኺ ካልኢታት ምጽባጥ፣ ወይ ምፍሳስ ምውሓድ ኣብዚ ግዜ ዘተባብዑ ምልክታት እዮም።',

    s12Heading: 'ቀንዲ ነጥብታት',
    summaryTitle: 'ቀንዲ ነጥብታት',
    summaryItems: [
      'ጥንሲን ወሊድን ኣብ ጭዋዳታት ሕቝፊ ዓቢ ጸቕጢ የውርዱ።',
      'ድሕሪ ወሊድ ቀስ ብቀስ ምምላስ ልሙድ እዩ።',
      'ልምምዳት ካብ ሓይሊ ንጽሬት ምንቅስቓስ ክቐድሙ ኣለዎም።',
      'ምትንፋስን ምዝላልን ከምቲ ምጽባጥ ብተመሳሳሊ ኣገዳሲ እዮም።',
      'ምፍሳስ ሽንቲ፣ ስምዒት ክብደት፣ ወይ ዘይሓልፍ ቃንዛ ሞያዊ ርእይቶ ይግብኦም።',
      'ምስ ወላዲት ወይ ፊዚዮቴራፒስት ዝግበር ምጥጣዕ ዝሓሸ ቁጽጽር ንምምላስ ክሕግዝ ይኽእል።',
      'ናብ ስፖርት ምምላስ ቀስ ብቀስ ክኸውን ኣለዎ፣ ብፍላይ ጽኑዕ ጽልዋ ዘለዎም ንጥፈታት።',
    ],

    finalTipTitle: 'ንምምላስ ግዜ ውሰድ',
    finalTipText:
      'ድሕሪ ወሊድ፣ ኣካልካ ብዙሕ ለውጥታት ሓሊፉ። ፔሪኒየም ከም ካልእ ኣካልካ ተመሳሳሊ ቀልቢ ይግብኦ፦ ቀስ ብቀስ፣ ብቀጻልነትን ብዘይ ጸቕጢን።',

    disclaimerText:
      'እዚ ጽሑፍ ንሓበሬታ ጥራይ እዩ፣ ውልቃዊ ሕክምናዊ ምኽሪ ኣይተክእን። ቃንዛ፣ ዘይሓልፉ ምልክታት፣ ወይ ብዛዕባ ምምላስካ ዝኾነ ሸግር እንተ ኣሎካ፣ ካብ ጥዕና ሰራሕተኛ ምኽሪ ሕተት።',
  },
  rw: {
    badge: 'NYUMA YO KUBYARA • GUKIRA',
    title: 'Gukomeza imikaya yo mu nda yo hasi\nnyuma yo kubyara',
    metaDuration: 'Isomwa mu minota 8',
    metaType: 'Inyigisho',
    metaLevel: 'Ugitangira',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro:
      'Nyuma yo gutwita no kubyara, imikaya yo mu nda yo hasi (pelvic floor) ikenera igihe cyo gukira. Imyitozo yoroheje, ikorwa buri gihe kandi buhoro buhoro, ishobora kugufasha kongera imbaraga, kugenzura no kwigirira icyizere, utarimo kwihutisha ibintu.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Gusobanukirwa uruhare rwa perineum',
      'Impamvu kubyara bituma ihangayika',
      'Igihe cyo gutangira imyitozo yo gukomeza imikaya yo mu nda yo hasi',
      'Kwiga gukanda neza',
      'Gutegura gahunda igenda buhoro buhoro',
      'Amakosa yo kwirinda',
      'Igihe cyo gusaba ubufasha',
      'Gusubira muri siporo buhoro buhoro',
      'Kwitegura gahunda yo kwa muganga',
      'Iby’ingenzi wibuka',
    ],
    shareMessage: 'Gukomeza imikaya yo mu nda yo hasi nyuma yo kubyara — AWA',

    s1Heading: 'Gusobanukirwa uruhare rwa perineum',
    s1Body1:
      'Perineum, yitwa kandi pelvic floor, ni itsinda ry’imikaya iri hasi y’igitsina cy’imbere. Ifasha kugenzura uruhago n’amara kandi ifasha gushyigikira ibice by’imbere byo mu nda yo hasi.',
    s1Body2:
      'Mu gihe cyo gutwita, iyi mikaya ikorera uburemere bwiyongereye mu mezi menshi. Iyo kubyara na ho irahangayika cyane.',
    s1HighlightTitle: 'Imikaya yihishe ariko y’ingenzi',
    s1HighlightText:
      'Pelvic floor igira uruhare mu mirimo myinshi ya buri munsi: gufunga inkari n’umwanda, kugenzura imyuka, gushyigikira ibice byo mu nda yo hasi, no kugira uruhare mu mirimo imwe y’imibonano mpuzabitsina.',

    benefitsHeading: 'Akamaro ko gukomeza pelvic floor',
    benefitsIntro:
      'Gukomeza buhoro buhoro kandi mu buryo bukwiye bishobora gufasha kunoza kugenzura no gushyigikira kwa pelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kugenzura neza uruhago',
        text: 'Pelvic floor igira uruhare mu kugenzura uruhago. Kuyikomeza buhoro buhoro bishobora gufasha kugabanya inkari zimwe zisohoka ku buryo butateguwe.',
      },
      {
        icon: 'toilet',
        title: 'Gufasha imikorere y’amara',
        text: 'Iyi mikaya kandi ifasha kugenzura imyuka n’umwanda kandi igira uruhare mu gushyigikira ibice byo mu nda yo hasi.',
      },
      {
        icon: 'human-female',
        title: 'Gushyigikira ibice byo mu nda yo hasi',
        text: 'Pelvic floor ni nk’urufatiro rw’imikaya rufasha gushyigikira uruhago, nyababyeyi n’amara.',
      },
      {
        icon: 'heart-pulse',
        title: 'Kugarura buhoro buhoro ibyiyumviro',
        text: 'Imyitozo ikwiye ishobora kandi kugufasha kongera kumenya no kugenzura neza aka gace.',
      },
    ],

    s2Heading: 'Impamvu gutwita no kubyara bihangayikisha pelvic floor',
    s2Body1:
      'Gutwita bishyira buhoro buhoro igitutu kinini kuri pelvic floor. Kubyara mu buryo busanzwe bishobora noneho kurambura cyane imikaya n’ibice by’umubiri biri aha hantu.',
    s2Body2:
      'Kubyara hakoreshejwe kubagwa na byo ntibirinda pelvic floor burundu: gutwita ubwabyo ni igihe gikomeye kuri iyi mikaya.',
    s2Body3:
      'Nyuma yo kubyara rero, ni ibisanzwe ko gukira bifata igihe. Abagore bamwe nta bimenyetso bumva, abandi bashobora kubona inkari zisohoka, kumva uburemere, cyangwa kugabanuka kw’ubushobozi bwo kugenzura imikaya.',
    s2TipTitle: 'Gukira kwa buri wese kuratandukanye',
    s2TipText:
      'Uburyo wabyayemo, gucika cyangwa gukata (episiotomy), kuba hari ububabare, n’uko umeze muri rusange nyuma yo kubyara, byose bishobora kugira ingaruka ku gukira.',

    s3Heading: 'Ni ryari watangira imyitozo yo gukomeza pelvic floor?',
    s3Body1:
      'Nyuma yo kubyara nta kibazo, gukanda gake imikaya ya pelvic floor bishobora gusubukurwa buhoro buhoro. Biracyari ngombwa guhuza imyitozo n’uko umeze no gusaba inama niba wagize ikibazo, ububabare bukomeye, cyangwa uburyo bwihariye bwakorewe.',
    s3Body2:
      'Niba ufite umuyoboro w’inkari (catheter), inama zimwe zivuga ko ukwiye gutegereza ko ukurwaho kandi ko kunyara bisanzwe kongera gukora mbere yo gutangira imyitozo ya perineum.',
    s3AlertTitle: 'Ntukomeze ububabare',
    s3AlertText:
      'Ububabare bukomeye, ibimenyetso byiyongera, igisebe gikira nabi, cyangwa ikindi kibazo cyose bisaba inama z’umubyaza, muganga cyangwa umuhanga mu gufasha gukira.',

    s4Heading: 'Kwiga gukanda neza',
    s4Body1:
      'Kugira ngo umenye ibyo ugomba gukora, tekereza ugerageza gufunga umwuka n’icyifuzo cyo kunyara icyarimwe. Icyo ushaka ni ukumva imikaya ikanda kandi izamuka imbere.',
    s4Body2:
      'Intego si ugukanda umubiri wose cyane. Ikibuno, ibibero n’inda bigomba kuguma byoroshye uko bishoboka, mu gihe guhumeka bikomeza uko bisanzwe.',
    exercises: [
      {icon: 'weather-windy', label: 'Guhumeka'},
      {icon: 'human-handsup', label: 'Gukanda byoroheje'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Gukanda igihe kirekire'},
      {icon: 'gesture-tap-button', label: 'Gukanda vuba'},
    ],
    s4HighlightTitle: 'Kworoshya na ko ni ngombwa nk’uko',
    s4HighlightText:
      'Nyuma yo gukanda buri gihe, reka imikaya yoroshye burundu. Gukira neza ntibivuze kugumisha perineum ikanze umunsi wose.',

    s5Heading: 'Gutegura gahunda igenda buhoro buhoro',
    s5Body1:
      'Mu ntangiriro, icy’ingenzi ni ukwiga kumenya imikaya no gukora igikorwa neza. Gukora buri gihe bifite akamaro kurusha gukora cyane.',
    s5h3a: 'Gukanda igihe kirekire',
    s5Body2:
      'Kanda pelvic floor byoroheje, hanyuma ugumane igikorwa amasegonda make utafunze umwuka. Hanyuma wirekure burundu mbere yo gutangira ukundi.',
    s5h3b: 'Gukanda igihe gito',
    s5Body3:
      'Iyo igikorwa kimaze kumenyerwa, hashobora kongerwamo gukanda vuba kandi guto. Bifasha kwitoza gukanda imikaya vuba iyo igitutu cyo mu nda cyiyongereye, urugero mbere gato yo gukorora cyangwa kwitsamura.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Huza imyitozo n’ikintu ukora buri munsi'},
      {icon: 'human-sitting', label: 'Tangirira mu mwanya ukorohereza'},
      {icon: 'weather-windy', label: 'Humeka uko bisanzwe mu gihe ukanda'},
      {icon: 'sleep', label: 'Subiza imikaya ku kworoha'},
      {icon: 'chart-line', label: 'Ongera ubugorane buhoro buhoro'},
      {icon: 'doctor', label: 'Saba inama niba utizeye'},
    ],
    s5TipTitle: 'Gukora buri gihe mbere ya byose',
    s5TipText:
      'Guhuza imyitozo n’umuco usanzwe mu munsi wawe bishobora koroshya gukomeza: nyuma yo konsa, nyuma yo koza amenyo, cyangwa ikindi gihe kikubereye.',

    s6Heading: 'Amakosa asanzwe yo kwirinda',
    s6Body1:
      'Imyitozo ya perineum ishobora kugaragara nk’iyoroshye, ariko biroroshye gukoresha indi mikaya cyangwa gukanda cyane.',
    commonMistakes: [
      'Gukanda ikibuno cyangwa ibibero aho gukanda pelvic floor',
      'Gufunga umwuka mu gihe ukanda',
      'Kugumisha imikaya ikanze buri gihe utayireka ngo yoroshye',
      'Gukora imyitozo iminsi mike hanyuma ugahagarika',
      'Guhagarika inkari ku bushake kugira ngo ugerageze gukanda',
    ],
    s6TipTitle: 'Ibyo kudakora',
    s6TipText:
      'Ntibyemewe gukora imyitozo uhagarika inkari ku bushake. Ubu buryo ntibutoza perineum neza kandi bushobora guhungabanya imikorere isanzwe y’uruhago.',

    s7Heading: 'Ni ibihe bimenyetso bikwiye gutuma ujya kwa muganga?',
    s7Body1:
      'Inkari nke zisohoka cyangwa ikintu kidasanzwe wumva rimwe na rimwe bishobora kuza nyuma yo kubyara. Icyakora ntibikwiye kwirengagizwa iyo bikomeje, byiyongera, cyangwa bibangamira ubuzima bwawe bwa buri munsi.',
    warningSigns: [
      'Inkari zisohoka iyo ukorora, witsamura, useka cyangwa wikoze imbaraga',
      'Kumva uburemere cyangwa igitutu mu nda yo hasi',
      'Kumva ko hari ikintu cyangwa ikibyimba kimanuka mu gitsina',
      'Ingorane zo gufunga imyuka cyangwa umwanda',
      'Ububabare buhoraho muri perineum',
      'Ububabare mu gihe cyangwa nyuma yo gukora imibonano mpuzabitsina',
      'Ingorane zo kumenya cyangwa gukanda neza imikaya ya perineum',
    ],
    consultLabel: 'Ni ryari ukwiye gusaba inama?',
    s7Body2:
      'Umubyaza, muganga cyangwa umuganga w’imyitozo ngororamubiri (physiotherapist) uzobereye mu gufasha gukira kwa pelvic floor ashobora gusuzuma imikorere y’imikaya akagusaba gahunda ikwiye.',

    s8Heading: 'Byagenda bite nyuma yo gucika, gukata (episiotomy) cyangwa kubagwa?',
    s8Body1:
      'Gucika cyangwa gukata (episiotomy) bisaba kwitabwaho by’umwihariko mu gihe cyo gukira. Gusubukura ibikorwa bigomba kwita ku bubabare, uko inkovu imeze n’inama wahawe nyuma yo kubyara.',
    s8Body2:
      'Nyuma yo kubagwa, gukira kandi bifitanye isano n’urukuta rw’inda n’inkovu. Nubwo kubyara bitabaye mu buryo busanzwe, gutwita ubwabyo byahangayikishije pelvic floor.',
    s8HighlightTitle: 'Kwitabwaho by’umwihariko bishobora gufasha',
    s8HighlightText:
      'Iyo hari gucika gukomeye, ububabare, ibimenyetso by’inkari cyangwa by’amara, cyangwa ingorane zikomeje, isuzuma ku muganga ushinzwe ubuzima rishobora kugira akamaro cyane.',

    s9Heading: 'Gusubira muri siporo buhoro buhoro',
    s9Body1:
      'Gusubukura kugenda nyuma yo kubyara bigomba kuba buhoro buhoro. Kugenda n’ingendo zoroheje bishobora gusubukurwa bitewe n’uko wiyumva, mu gihe ibikorwa bikaze bisaba kwitonda cyane.',
    s9Body2:
      'Mbere yo gusubukura kwiruka, gusimbuka cyangwa imyitozo ikaze cyane, ni byiza gusuzuma uko pelvic floor yakize no kwita ku bimenyetso byose.',
    s9AlertTitle: 'Ntukihutishe intambwe',
    s9AlertText:
      'Inkari zisohoka, kumva uburemere, cyangwa ububabare mu gihe cyangwa nyuma y’imyitozo ni ibimenyetso ko ugomba kugabanya umuvuduko ugasaba inama mbere yo kongera ubukana.',

    s10Heading: 'Ni ryari wajya kureba umuhanga?',
    s10Body1:
      'Imyitozo yo gukira kwa pelvic floor hamwe n’umubyaza cyangwa physiotherapist ishobora kugira akamaro niba utizeye ko ukanda neza, niba ibimenyetso bikomeje, cyangwa niba ushaka gusubukura ibikorwa bimwe by’umubiri wizeye.',
    questionCardTitle: 'Ibibazo byafasha kubaza',
    appointmentQuestions: [
      'Ese ibimenyetso byanjye bihuye no koroha kwa pelvic floor?',
      'Ese nkanda neza?',
      'Ni inshuro zingahe nkwiye gukora buri munsi?',
      'Ese nshobora gusubira kwiruka, muri siporo, cyangwa mu myitozo ikaze?',
      'Ese nkeneye imyitozo yo gukira hamwe n’umubyaza cyangwa physiotherapist?',
      'Ese inkovu yanjye, gucika cyangwa kubagwa bisaba kwitonda mu buryo bwihariye?',
    ],
    s10TipTitle: 'Ni byiza kubimenya',
    s10TipText:
      'Kubona umuhanga ntibivuze ako kanya ko hari ikibazo. Isomo rishobora gufasha kugenzura uburyo ukora, gusuzuma uko ukira, no kwiga gutera imbere neza.',

    s11Heading: 'Gukira bifata igihe',
    s11Body1:
      'Nyuma yo kubyara, ni ibisanzwe kudasubirana ako kanya ibyiyumviro cyangwa imbaraga z’imikaya wari ufite mbere yo gutwita.',
    s11Body2:
      'Intego si ugukanda inshuro nyinshi uko bishoboka. Ahubwo ni ukongera gusubirana buhoro buhoro guhuza neza gukanda no kworoha, hanyuma ukabasha gukoresha iyi mikaya mu buryo busanzwe mu bikorwa bya buri munsi.',
    s11HighlightTitle: 'Iterambere rito ni iterambere nyaryo',
    s11HighlightText:
      'Kumenya neza igikorwa, amasegonda make y’inyongera yo gukanda, cyangwa kugabanuka kw’inkari zisohoka ni ibimenyetso bitanga icyizere.',

    s12Heading: 'Iby’ingenzi wibuka',
    summaryTitle: 'Iby’ingenzi',
    summaryItems: [
      'Gutwita no kubyara bihangayikisha cyane pelvic floor.',
      'Gukira buhoro buhoro ni ibisanzwe nyuma yo kubyara.',
      'Imyitozo igomba gushyira imbere uburyo igikorwa gikorwa kuruta imbaraga.',
      'Guhumeka no kworoha ni ngombwa nk’uko gukanda.',
      'Inkari zisohoka, kumva uburemere, cyangwa ububabare buhoraho bikwiye inama z’umuhanga.',
      'Imyitozo yo gukira hamwe n’umubyaza cyangwa physiotherapist ishobora kugufasha kongera kugenzura neza.',
      'Gusubira muri siporo bigomba kuba buhoro buhoro, cyane cyane ku bikorwa bikaze.',
    ],

    finalTipTitle: 'Fata igihe cyo gukira',
    finalTipText:
      'Nyuma yo kubyara, umubiri wawe wanyuze mu mpinduka nyinshi. Perineum ikwiye kwitabwaho nk’ibindi bice by’umubiri wawe: buhoro buhoro, buri gihe kandi nta gihato.',

    disclaimerText:
      'Iyi nkuru ni iy’amakuru gusa kandi ntisimbura inama za muganga zihariye. Niba ufite ububabare, ibimenyetso bikomeje, cyangwa impungenge zose ku gukira kwawe, saba inama umuganga ushinzwe ubuzima.',
  },
  rn: {
    badge: 'HANYUMA Y\'UKUBYARA • GUKIRA',
    title: 'Gutera imbaraga imikaya yo mu nda y\'epfo\nhanyuma y\'ukubyara',
    metaDuration: 'Soma muminuta 8',
    metaType: 'Inyoborabwenge',
    metaLevel: 'Intangiriro',
    metaValidated: 'Ibikorwa vyasuzumwe',
    intro:
      'Hanyuma yo gutwita no kubyara, imikaya yo mu nda y\'epfo isaba igihe co gukira. Imyitozo yoroshe, ihoraho kandi ijanye n\'ingene ugenda ukira irashobora kugufasha kugarura imbaraga, ububasha n\'icizere, utihuta.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Gusobanukirwa uruhara rw\'imikaya yo mu nda y\'epfo (perineum)',
      'Igituma kubyara bigira ingaruka kuri yo',
      'Igihe co gutangura imyitozo y\'iyo mikaya',
      'Kwiga gukanda neza',
      'Gushiraho gahunda ijanye n\'ingene ugenda ukira',
      'Amakosa yo kwirinda',
      'Igihe cyo gusaba ubufasha',
      'Gusubira buhoro buhoro mu mikino',
      'Kwitegura kubonana n\'umuhanga',
      'Ivy\'ingenzi',
    ],
    shareMessage: 'Gutera imbaraga imikaya yo mu nda y\'epfo hanyuma y\'ukubyara — AWA',

    s1Heading: 'Gusobanukirwa uruhara rw\'imikaya yo mu nda y\'epfo (perineum)',
    s1Body1:
      'Perineum, yitwa kandi imikaya yo mu nda y\'epfo, ni itsinda ry\'imikaya iri munsi y\'igikanka c\'inda. Igira uruhara mu kugenzura inkari n\'amabyi kandi ifasha gushigikira ingingo zo mu nda y\'epfo.',
    s1Body2:
      'Mu gihe co gutwita, iyi mikaya itwara uburemere burenze amezi menshi. Kandi irabazwa cane mu gihe co kubyara.',
    s1HighlightTitle: 'Umukaya utagaragara ariko w\'ingenzi',
    s1HighlightText:
      'Imikaya yo mu nda y\'epfo igira uruhara mu bikorwa vyinshi vya buri musi: gufata inkari n\'amabyi, kugenzura umwuka usohoka, gushigikira ingingo zo mu nda y\'epfo, no kugira uruhara mu bikorwa bimwebimwe vy\'imibonano.',

    benefitsHeading: 'Akamaro ko kugira imikaya yo mu nda y\'epfo ikomeye',
    benefitsIntro:
      'Gutera imbaraga buhoro buhoro kandi neza birashobora gufasha kunoza ukugenzura n\'ugushigikira kw\'iyi mikaya.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kugenzura neza inkari',
        text: 'Imikaya yo mu nda y\'epfo igira uruhara mu kugenzura inkari. Kuyiha imbaraga buhoro buhoro bishobora gufasha kugabanya inkari zimwezimwe zisohoka ku gahato.',
      },
      {
        icon: 'toilet',
        title: 'Gushigikira imikorere y\'amara',
        text: 'Iyi mikaya kandi ifasha kugenzura umwuka n\'amabyi kandi igashigikira ingingo zo mu nda y\'epfo.',
      },
      {
        icon: 'human-female',
        title: 'Gushigikira ingingo zo mu nda y\'epfo',
        text: 'Imikaya yo mu nda y\'epfo ni nk\'ishingiro ry\'imikaya rifasha gushigikira uruhago, nyababyeyi n\'amara.',
      },
      {
        icon: 'heart-pulse',
        title: 'Kugarura buhoro buhoro ukumva',
        text: 'Imyitozo ibereye irashobora kandi kugufasha kumenya no kugenzura neza aka gace.',
      },
    ],

    s2Heading: 'Igituma gutwita no kubyara bigira ingaruka kuri yo',
    s2Body1:
      'Gutwita bishira buhoro buhoro igitutu kinini ku mikaya yo mu nda y\'epfo. Kubyara mu buryo busanzwe birashobora gukurura cane iyi mikaya n\'ibindi bice vyo muri aka gace.',
    s2Body2:
      'Kubyara bakubaga na vyo ntibirinda iyi mikaya rwose: gutwita ubwabyo biguma ari igihe gikomeye kuri yo.',
    s2Body3:
      'Hanyuma y\'ukubyara, nta cantangaza gukira gufata igihe. Abagore bamwebamwe ntibabona ibimenyetso biruta, abandi bashobora kubona inkari zisohoka, ukumva uburemere, canke imikaya itagishoboye kugenzurwa.',
    s2TipTitle: 'Ugukira kose kuratandukanye',
    s2TipText:
      'Uburyo wabyayemwo, gutabuka canke gukatwa (episiotomie), ububabare, n\'uko umerewe muri rusangi hanyuma y\'ukubyara, vyose bishobora kugira ingaruka ku gukira.',

    s3Heading: 'Igihe co gutangura imyitozo y\'iyi mikaya?',
    s3Body1:
      'Hanyuma y\'ukubyara nta kibazo, imyitozo yoroshe yo gukanda imikaya yo mu nda y\'epfo isanzwe isubukurwa buhoro buhoro. Biracari ngombwa guhuza imyitozo n\'uko umeze no gusaba inama niba wagize ingorane, ububabare bukomeye, canke igikorwa c\'ubuvuzi cihariye.',
    s3Body2:
      'Niba ufise umuyoboro w\'inkari (sonde), inama zimwezimwe zerekana ko wogereza imyitozo y\'iyi mikaya kugeza igihe uvanyweho kandi ukongera kunyara bisanzwe.',
    s3AlertTitle: 'Ntukomeze ububabare',
    s3AlertText:
      'Ububabare bukomeye, ibimenyetso bikaze, ibarwe ritakira neza, canke ikindi kibazo cose bisaba inama z\'umubyaza, muganga canke umuhanga mu gufasha gukira.',

    s4Heading: 'Kwiga gukanda neza',
    s4Body1:
      'Kugira ngo umenye ukuntu bikorwa, tekereza ko ugerageza gufata umwuka n\'icifuzo co kunyara icarimwe. Ico ushaka ni ukwumva imikaya ikandaguye kandi izamutse imbere.',
    s4Body2:
      'Intumbero si ugukanda umubiri wose. Ibibuno, ibibero n\'inda bigomba kuguma biruhutse uko bishoboka, mu gihe uhumeka bisanzwe.',
    exercises: [
      {icon: 'weather-windy', label: 'Guhumeka'},
      {icon: 'human-handsup', label: 'Gukanda byoroshe'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Gukanda igihe kirekire'},
      {icon: 'gesture-tap-button', label: 'Gukanda vuba vuba'},
    ],
    s4HighlightTitle: 'Kuruhuka na vyo ni ngirakamaro',
    s4HighlightText:
      'Nyuma ya buri gukanda, reka imikaya iruhuke rwose. Imyitozo myiza ntisobanura gukomeza gukanda perineum umusi wose.',

    s5Heading: 'Gushiraho gahunda ijanye n\'ingene ugenda ukira',
    s5Body1:
      'Mu ntango, ico gihambaye cane ni ukwiga kumenya iyi mikaya no gukora igikorwa neza. Gukora buri musi biruta ububasha bwinshi.',
    s5h3a: 'Gukanda igihe kirekire',
    s5Body2:
      'Kanda imikaya yo mu nda y\'epfo buhoro, hanyuma ugumane gukanda amasegonda make utafashe umwuka. Hanyuma uyirekure rwose imbere yo gutangura bundi bushasha.',
    s5h3b: 'Gukanda igihe gito',
    s5Body3:
      'Igihe umaze kumenya igikorwa, ushobora kongeraho gukanda gutoya kandi kwihuta. Bifasha imikaya kwiga gukanda vuba iyo igitutu c\'inda cyiyongereye, nk\'imbere gato yo gukorora canke gucinya.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Huza imyitozo n\'ingeso ya buri musi'},
      {icon: 'human-sitting', label: 'Tangura uri mu mererwe myiza'},
      {icon: 'weather-windy', label: 'Humeka bisanzwe mu gihe ukanda'},
      {icon: 'sleep', label: 'Wubahirize ibihe vyo kuruhuka'},
      {icon: 'chart-line', label: 'Ongera buhoro buhoro ingorane'},
      {icon: 'doctor', label: 'Saba inama niba utabizi neza'},
    ],
    s5TipTitle: 'Gukora buri musi imbere ya vyose',
    s5TipText:
      'Guhuza imyitozo n\'ingeso usanzwe ufise bishobora koroshya gukomeza: hanyuma yo konsa, hanyuma yo koza amenyo, canke ikindi gihe kikubereye.',

    s6Heading: 'Amakosa akunze kwirindwa',
    s6Body1:
      'Imyitozo y\'iyi mikaya irashobora kugaragara nk\'ihendutse, ariko biroroshe gukoresha izindi mikaya canke gukanda cane.',
    commonMistakes: [
      'Gukanda ibibuno canke ibibero aho gukanda imikaya yo mu nda y\'epfo',
      'Gufata umwuka mu gihe ukanda',
      'Guguma ukanze imikaya udasiga ngo iruhuke',
      'Gukora imyitozo iminsi mike hanyuma ukayireka',
      'Guhagarika inkari ku bushake kugira ngo ugerageze gukanda',
    ],
    s6TipTitle: 'Ivyo utagomba gukora',
    s6TipText:
      'Ntibisabwa gukora imyitozo uhagarika inkari ku bushake. Ubu buryo ntibutoza neza perineum kandi bushobora kuvuruga imikorere isanzwe y\'uruhago.',

    s7Heading: 'Ni ibihe bimenyetso bikwiye kugutuma ubonana na muganga?',
    s7Body1:
      'Inkari zitoya zisohoka canke ukumva ibidasanzwe birashobora rimwe na rimwe kuboneka hanyuma y\'ukubyara. Ariko ntibikwiye kwirengagizwa iyo bikomeje, biba bibi, canke bibangamira ubuzima bwawe bwa buri musi.',
    warningSigns: [
      'Inkari zisohoka iyo ukorora, ucinya, useka canke ukoresha imbaraga',
      'Ukumva uburemere canke igitutu mu nda y\'epfo',
      'Ukumva nk\'ikintu gikomeye canke ikintu kimanuka mu gitsina',
      'Ingorane zo gufata umwuka canke amabyi',
      'Ububabare buhoraho muri perineum',
      'Ububabare mu gihe canke hanyuma y\'imibonano',
      'Ingorane zo kumenya canke gukanda neza imikaya ya perineum',
    ],
    consultLabel: 'Ni ryari wosaba inama?',
    s7Body2:
      'Umubyaza, muganga canke umuhanga mu gufasha gukira (physiothérapeute) w\'imikaya yo mu nda y\'epfo arashobora gusuzuma imikorere y\'imikaya akagusaba imyitozo ibereye.',

    s8Heading: 'Ni gute hanyuma yo gutabuka, gukatwa (episiotomie) canke kubyara bakubaga?',
    s8Body1:
      'Gutabuka canke gukatwa bisaba kwitwararika mu gihe c\'ugukira. Gusubira mu bikorwa bikwiye kwitwararika ububabare, uko ibarwe rimeze, n\'amabwiriza wahawe hanyuma y\'ukubyara.',
    s8Body2:
      'Hanyuma yo kubyara bakubaga, ugukira kuraba kandi kuri ruhago rw\'inda n\'ibarwe. N\'iyo kubyara bitabaye mu buryo busanzwe, gutwita ubwabyo vyagize ingaruka ku mikaya yo mu nda y\'epfo.',
    s8HighlightTitle: 'Kwitabwaho mu buryo bwihariye bishobora gufasha',
    s8HighlightText:
      'Mu gihe c\'ugutabuka gukomeye, ububabare, ibimenyetso vy\'inkari canke vy\'amara, canke ingorane zikomeje, isuzuma ry\'umuhanga mu buvuzi rirashobora gufasha cane.',

    s9Heading: 'Gusubira buhoro buhoro mu mikino',
    s9Body1:
      'Gusubira mu bikorwa hanyuma y\'ukubyara bikwiye kuba buhoro buhoro. Kugenda n\'ibikorwa byoroshe bishobora gusubukurwa bitewe n\'ukuntu wumva umerewe, mu gihe ibikorwa bikomeye bisaba kwitonda cane.',
    s9Body2:
      'Imbere yo gusubira mu kwiruka, gusimbuka, canke imyitozo ikaze cane, ni vyiza gusuzuma ugukira kw\'imikaya yo mu nda y\'epfo no kwitwararika ibimenyetso vyose.',
    s9AlertTitle: 'Ntuhute ibice',
    s9AlertText:
      'Inkari zisohoka, ukumva uburemere, canke ububabare mu gihe canke hanyuma y\'imyitozo ni ibimenyetso vyerekana ko ukwiye kugabanya kandi ugasaba inama imbere yo kongera imbaraga.',

    s10Heading: 'Ni ryari wobonana n\'umuhanga?',
    s10Body1:
      'Imyitozo y\'imikaya yo mu nda y\'epfo hamwe n\'umubyaza canke physiothérapeute irashobora kugira akamaro niba utazi neza ko ukanda neza, niba ibimenyetso bikomeje, canke niba ushaka gusubira mu bikorwa vy\'umubiri ufise icizere.',
    questionCardTitle: 'Ibibazo vyiza vyo kubaza',
    appointmentQuestions: [
      'Ese ibimenyetso vyanje bijanye n\'imikaya yo mu nda y\'epfo idakomeye?',
      'Ese nkanda neza?',
      'Ni kangahe nkwiye gukora imyitozo buri musi?',
      'Ese nshobora gusubira mu kwiruka, mu mikino, canke mu myitozo ikaze?',
      'Ese nkeneye imyitozo y\'ugukira hamwe n\'umubyaza canke physiothérapeute?',
      'Ese ibarwe ryanje, ugutabuka canke ukubyara bakubaga bisaba kwitwararika kwihariye?',
    ],
    s10TipTitle: 'Ni vyiza kubimenya',
    s10TipText:
      'Kubonana n\'umuhanga ntibisobanura ko hari ikitagenda. Isuzuma rirashobora gusa gufasha kugenzura uburyo ukora, gusuzuma ugukira kwawe no kwiga gutera imbere neza.',

    s11Heading: 'Ugukira gufata igihe',
    s11Body1:
      'Hanyuma yo kubyara, nta cantangaza kudasubira vuba kubona ukumva canke imbaraga z\'imikaya wari ufise imbere yo gutwita.',
    s11Body2:
      'Intumbero si ugukanda kenshi gashoboka. Ni ugusubirana buhoro buhoro uburyo bwiza hagati yo gukanda no kuruhuka, hanyuma ugashobora gukoresha iyi mikaya mu buryo busanzwe mu bikorwa vya buri musi.',
    s11HighlightTitle: 'Iterambere rito ni iterambere nyaryo',
    s11HighlightText:
      'Kurushiriza kumenya igikorwa, amasegonda make y\'ugukanda arenga, canke ukugabanuka kw\'inkari zisohoka biri mu bimenyetso bitanga akanyabugabo.',

    s12Heading: 'Ivy\'ingenzi',
    summaryTitle: 'Ivy\'ingenzi',
    summaryItems: [
      'Gutwita no kubyara bigira ingaruka nini ku mikaya yo mu nda y\'epfo.',
      'Gukira buhoro buhoro ni ibisanzwe hanyuma y\'ukubyara.',
      'Imyitozo ikwiye kwitwararika ubuhanga bw\'igikorwa kuruta imbaraga.',
      'Guhumeka no kuruhuka ni ngirakamaro nko gukanda.',
      'Inkari zisohoka, ukumva uburemere, canke ububabare buhoraho bikwiye inama z\'umuhanga.',
      'Imyitozo y\'ugukira hamwe n\'umubyaza canke physiothérapeute irashobora kugufasha kugarura ukugenzura kwiza.',
      'Gusubira mu mikino bikwiye kuba buhoro buhoro, cane cane ku bikorwa bikaze.',
    ],

    finalTipTitle: 'Fata igihe cyo gukira',
    finalTipText:
      'Hanyuma y\'ukubyara, umubiri wawe wanyuze mu mpinduka nyinshi. Perineum ikwiye kwitabwaho nk\'ibindi bice vy\'umubiri wawe: buhoro buhoro, buri musi, kandi nta gitutu.',

    disclaimerText:
      'Iyi nkuru ni iy\'ukumenyesha gusa kandi ntisubira mu cimbo c\'inama z\'ubuvuzi zagenewe wowe. Niba ufise ububabare, ibimenyetso bikomeje, canke ufise ikibazo cose ku gukira kwawe, saba inama umuhanga mu buvuzi.',
  },
  ig: {
    badge: 'MGBE E MECHASỊRỊ ỊMỤ NWA • ỊLỌGHACHI',
    title: 'Ịmee ka pelvic floor gị sie ike\nmgbe ị mụsịrị nwa',
    metaDuration: 'Nkeji 8 iji gụọ',
    metaType: 'Ntụziaka',
    metaLevel: 'Mbido',
    metaValidated: 'Ọdịnaya e nyochaworo',
    intro:
      'Mgbe ime na ịmụ nwa gasịrị, pelvic floor chọrọ oge iji lọghachi. Mmega ahụ dị mfe, nke a na-eme mgbe niile ma nwayọọ nwayọọ nwere ike inyere gị aka ịlaghachi ike, njikwa, na ntụkwasị obi, n\'enweghị ịgba ọsọ.',
    contentsTitle: 'N\'edemede a',
    topics: [
      'Ịghọta ọrụ perineum',
      'Ihe kpatara ịmụ nwa ji etinye ya n\'nrụgide',
      'Mgbe e kwesịrị ịmalite mmega pelvic floor',
      'Ịmụta ime nkwekọrịta n\'ụzọ ziri ezi',
      'Ịmepụta usoro nwayọọ nwayọọ',
      'Njehie ndị a ga-ezere',
      'Mgbe ị kwesịrị ịchọ enyemaka',
      'Ịlaghachi n\'egwuregwu nwayọọ nwayọọ',
      'Ịkwadebe maka nhọpụta',
      'Isi ihe dị mkpa',
    ],
    shareMessage: 'Ịmee ka pelvic floor gị sie ike mgbe ị mụsịrị nwa — AWA',

    s1Heading: 'Ịghọta ọrụ perineum',
    s1Body1:
      'Perineum, nke a na-akpọkwa pelvic floor, bụ otu akwara dị n\'ala pelvis. Ọ na-arụ ọrụ n\'njikwa akpa mmiri na eriri afọ ma na-enyere aka kwado akụkụ ahụ ndị dị na pelvis.',
    s1Body2:
      'N\'oge ime, akwara ndị a ga-ebu ibu ọzọ ọtụtụ ọnwa. A na-etinyekwa ha n\'nrụgide dị ukwuu n\'oge ịmụ nwa.',
    s1HighlightTitle: 'Akwara dị mkpa mana nke a na-adịghị ahụ anya',
    s1HighlightText:
      'Pelvic floor na-etinye aka n\'ọtụtụ ọrụ kwa ụbọchị: ijide mmiri ahụ na nsị, ijikwa ikuku, ikwado akụkụ ahụ dị na pelvis, na ịrụ ọrụ n\'ọrụ mmekọahụ ụfọdụ.',

    benefitsHeading: 'Uru nke pelvic floor siri ike',
    benefitsIntro:
      'Ime ka ọ sie ike nwayọọ nwayọọ, n\'ụzọ ziri ezi nwere ike inyere aka melite njikwa na nkwado pelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Njikwa akpa mmiri ka mma',
        text: 'Pelvic floor na-arụ ọrụ n\'njikwa akpa mmiri. Ime ka ọ sie ike nwayọọ nwayọọ nwere ike inyere aka belata ọsọ mmiri ụfọdụ.',
      },
      {
        icon: 'toilet',
        title: 'Ịkwado ọrụ eriri afọ',
        text: 'Akwara ndị a na-enyekwa aka ijikwa ikuku na nsị ma na-enye aka n\'ikwado akụkụ ahụ dị na pelvis.',
      },
      {
        icon: 'human-female',
        title: 'Ịkwado akụkụ ahụ dị na pelvis',
        text: 'Pelvic floor na-eme ntọala akwara n\'ezie nke na-enyere aka kwado akpa mmiri, akpa nwa, na eriri afọ.',
      },
      {
        icon: 'heart-pulse',
        title: 'Ịlaghachi mmetụta nwayọọ nwayọọ',
        text: 'Mmega kwesịrị ekwesị nwekwara ike inyere gị aka inwe nghọta na njikwa ka mma nke ebe a.',
      },
    ],

    s2Heading: 'Ihe kpatara ime na ịmụ nwa ji etinye ya n\'nrụgide',
    s2Body1:
      'Ime na-etinye nrụgide karịa na pelvic floor nwayọọ nwayọọ. Ịmụ nwa n\'ụzọ ngwongwo nwere ike ịdọpụ akwara na anụ ahụ dị n\'ebe a nke ukwuu.',
    s2Body2:
      'Ịwa ahụ iji wepụta nwa (cesarean) anaghị echebe pelvic floor kpamkpam: ime n\'onwe ya bụ oge dị mkpa maka akwara ndị a.',
    s2Body3:
      'Mgbe a mụsịrị nwa, ọ bụ ihe nkịtị na ịlaghachi ga-were oge. Ụfọdụ ụmụ nwanyị anaghị enwe afọ ọbụla, ebe ndị ọzọ nwere ike ịchọpụta ọsọ mmiri, mmetụta ibu, ma ọ bụ njikwa akwara belatara.',
    s2TipTitle: 'Ịlaghachi ọ bụla dị iche',
    s2TipText:
      'Ụdị ịmụ nwa, mgbawa ma ọ bụ episiotomy, ọnụnọ mgbu, na ọnọdụ ahụ gị n\'ozuzu mgbe a mụsịrị nwa niile nwere ike imetụta ịlaghachi.',

    s3Heading: 'Mgbe e kwesịrị ịmalite mmega pelvic floor?',
    s3Body1:
      'Mgbe ịmụ nwa na-enweghị nsogbu gasịrị, a pụrụ ịmaliteghachi nkwekọrịta dị nwayọọ nke pelvic floor nwayọọ nwayọọ. Ọ ka dị mkpa ịhazi mmega ahụ dabere n\'ọnọdụ gị ma chọọ ndụmọdụ ma ọ bụrụ na ị nwere nsogbu, mgbu dị ukwuu, ma ọ bụ usoro pụrụ iche.',
    s3Body2:
      'Ọ bụrụ na ị nwere catheter mmiri, ụfọdụ ndụmọdụ na-atụ aro ichere ruo mgbe e wepụrụ ya ma ịtụ mmiri n\'ụzọ nkịtị alaghachila tupu ịmalite mmega perineum.',
    s3AlertTitle: 'Ejila mgbu mee ihe',
    s3AlertText:
      'Mgbu dị ukwuu, afọ na-aka njọ, ọnya na-agwọ nke ọma, ma ọ bụ nchegbu ọ bụla pụrụ iche chọrọ ndụmọdụ site n\'aka midwife, dọkịta, ma ọ bụ onye ọkachamara mmega.',

    s4Heading: 'Ịmụta ime nkwekọrịta n\'ụzọ ziri ezi',
    s4Body1:
      'Iji chọpụta mmegharị ahụ, tụgharịa uche ịnwa ijide ikuku na ọchịchọ ịtụ mmiri n\'otu oge. Mmegharị ị na-achọ bụ mmetụta nkwekọrịta na ibuli ihe gaa n\'ime.',
    s4Body2:
      'Ebumnuche abụghị ịmee ka ahụ gị niile dị ike. Ọkpụkpụ ịkpụkpụ gị, apata, na akwara afọ kwesịrị ịdị nwayọọ dịka o kwere mee, ebe iku ume na-aga n\'ihu n\'ụzọ nkịtị.',
    exercises: [
      {icon: 'weather-windy', label: 'Iku ume'},
      {icon: 'human-handsup', label: 'Nkwekọrịta dị nwayọọ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Nkwekọrịta ogologo'},
      {icon: 'gesture-tap-button', label: 'Nkwekọrịta ngwa ngwa'},
    ],
    s4HighlightTitle: 'Ịmee ka ahụ dị nwayọọ dị mkpa nke ukwuu',
    s4HighlightText:
      'Mgbe nkwekọrịta ọ bụla gasịrị, hapụ akwara ndị a ka ha dị nwayọọ kpamkpam. Mmega ọma apụtaghị idowe perineum n\'ọnọdụ nkwekọrịta ụbọchị niile.',

    s5Heading: 'Ịmepụta usoro nwayọọ nwayọọ',
    s5Body1:
      'Na mbụ, ihe kacha mkpa bụ ịmụta ịmata akwara ndị a na ime mmegharị ahụ n\'ụzọ ziri ezi. Ime ya mgbe niile dị mkpa karịa ike.',
    s5h3a: 'Nkwekọrịta ogologo',
    s5Body2:
      'Mee ka pelvic floor kwekọrịta nwayọọ, wee jide nkwekọrịta ahụ ruo sekọnd ole na ole n\'enweghị ijide ume. Mgbe ahụ hapụ kpamkpam tupu ịmalitegharị.',
    s5h3b: 'Nkwekọrịta mkpụmkpụ',
    s5Body3:
      'Ozugbo i mụtara mmegharị ahụ, a pụrụ itinye obere nkwekọrịta ngwa ngwa. Ha na-enyere aka zụọ ikike gị ịkwekọrị akwara ngwa ngwa mgbe nrụgide afọ na-abawanye, dịka tupu ụkwara ma ọ bụ mgbe ị ga-ata mmiri.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Jikọta mmega ahụ na omume kwa ụbọchị'},
      {icon: 'human-sitting', label: 'Malite n\'ọnọdụ dị mma'},
      {icon: 'weather-windy', label: 'Kuo ume n\'ụzọ nkịtị n\'oge nkwekọrịta'},
      {icon: 'sleep', label: 'Sọpụrụ oge ịdị nwayọọ'},
      {icon: 'chart-line', label: 'Bawanye ihe isi ike nwayọọ nwayọọ'},
      {icon: 'doctor', label: 'Jụọ ndụmọdụ ma ọ bụrụ na ị nweghị mgbagha'},
    ],
    s5TipTitle: 'Ime ya mgbe niile bụ isi',
    s5TipText:
      'Ijikọta mmega ahụ na omume dị n\'ụbọchị gị na-enye ya aka ime ya mgbe niile: mgbe ịnyere nwa ara, mgbe ịsachara ezé, ma ọ bụ n\'oge ọzọ kwesịrị gị.',

    s6Heading: 'Njehie a na-ejikarị zere',
    s6Body1:
      'Mmega perineum nwere ike ịdị ka ihe dị mfe, mana ọ dị mfe iji akwara ndị ọzọ kwụghachi ma ọ bụ ịkwatu ike nke ukwuu.',
    commonMistakes: [
      'Ime ka ọkpụkpụ ịkpụkpụ ma ọ bụ apata sie ike kama pelvic floor',
      'Ijide ume n\'oge nkwekọrịta',
      'Idowe akwara ndị a n\'nkwekọrịta mgbe niile n\'enweghị ịhapụ ha',
      'Ime mmega ahụ naanị ụbọchị ole na ole wee kwụsị',
      'Ịkwụsị mmiri mmiri mgbe ị na-atụ iji lelee nkwekọrịta',
    ],
    s6TipTitle: 'Ihe a na-eme',
    s6TipText:
      'A naghị atụ aro ime mmega ahụ site n\'ịkwụsị mmiri ọnụ mgbe ị na-atụ. Usoro a anaghị azụ perineum n\'ụzọ ziri ezi ma nwee ike ịkpaghasị ọrụ akpa mmiri nkịtị.',

    s7Heading: 'Kedu afọ kwesịrị ịkpọtụrụ dọkịta?',
    s7Body1:
      'Obere ọsọ mmiri ma ọ bụ mmetụta pụrụ iche nwere ike ịpụta mgbe ịmụ nwa gasịrị. Agbanyeghị, ekwesịghị ileghara ha anya ma ọ bụrụ na ha na-adịgide, na-aka njọ, ma ọ bụ na-egbochi ndụ gị kwa ụbọchị.',
    warningSigns: [
      'Ọsọ mmiri mgbe ị na-akwa ụkwara, na-agba imi, na-achị ọchị, ma ọ bụ na-agbasi ike',
      'Mmetụta ibu ma ọ bụ nrụgide n\'ala pelvis',
      'Mmetụta na ihe ọkpụkpụ ma ọ bụ ihe ọzọ na-agbada n\'ime ọnụ ụzọ nwanyị',
      'Isi ike ijide ikuku ma ọ bụ nsị',
      'Mgbu na-adịgide n\'ime perineum',
      'Mgbu n\'oge ma ọ bụ mgbe mmekọahụ gasịrị',
      'Isi ike ịmata ma ọ bụ ịkwekọrị akwara perineum n\'ụzọ ziri ezi',
    ],
    consultLabel: 'Mgbe ị kwesịrị ịchọ ndụmọdụ?',
    s7Body2:
      'Midwife, dọkịta, ma ọ bụ physiotherapist na-ahụkarị mmega pelvic floor nwere ike lelee ọrụ akwara ma tụọ aro usoro kwesịrị ekwesị.',

    s8Heading: 'Gịnị bụ mgbe mgbawa, episiotomy, ma ọ bụ ịwa ahụ cesarean?',
    s8Body1:
      'Mgbawa ma ọ bụ episiotomy chọrọ nlekọta pụrụ iche n\'oge agwọ. Ịmaliteghachi ọrụ kwesịrị ịtụle mgbu, ọnọdụ ọnya, na ndụmọdụ e nyere mgbe ịmụ nwa gasịrị.',
    s8Body2:
      'Mgbe ịwa ahụ cesarean gasịrị, ịlaghachi gụnyekwara mgbidi afọ na ọnya. Ọ bụrụgodi na ịmụ nwa abụghị n\'ụzọ ngwongwo, ime n\'onwe ya etinyeela nrụgide na pelvic floor.',
    s8HighlightTitle: 'Nlekọta e mere maka gị nwere ike inyere aka',
    s8HighlightText:
      'N\'ọnọdụ mgbawa dị ukwuu, mgbu, afọ mmiri ma ọ bụ eriri afọ, ma ọ bụ nsogbu na-adịgide, nyocha site n\'aka onye ọrụ ahụike nwere ike ịba uru karịsịa.',

    s9Heading: 'Ịlaghachi n\'egwuregwu nwayọọ nwayọọ',
    s9Body1:
      'Ịmaliteghachi mmegharị ahụ mgbe ịmụ nwa gasịrị kwesịrị ịbụ nwayọọ nwayọọ. Ije ije na mmegharị dị nwayọọ nwere ike ịmaliteghachi dabere n\'etu ị na-eche, ebe ọrụ ndị nwere nsogbu dị elu chọrọ nlezianya karịa.',
    s9Body2:
      'Tupu ịmaliteghachi ịgba ọsọ, ịmịfe, ma ọ bụ mmega siri ike, ọ ka mma ịlele ịlaghachi pelvic floor ma tụlee afọ ọ bụla.',
    s9AlertTitle: 'Ejila ngwa ngwa mee usoro ndị a',
    s9AlertText:
      'Ọsọ mmiri, mmetụta ibu, ma ọ bụ mgbu n\'oge ma ọ bụ mgbe mmega gasịrị bụ akara na ị kwesịrị ịdị nwayọọ ma chọọ ndụmọdụ tupu ịbawanye ike.',

    s10Heading: 'Mgbe ị kwesịrị ịhụ onye ọkachamara?',
    s10Body1:
      'Mmega pelvic floor na midwife ma ọ bụ physiotherapist nwere ike ịba uru ma ọ bụrụ na ị nweghị mgbagha ma ị na-ekwekọrị n\'ụzọ ziri ezi, ma ọ bụrụ na afọ gị na-adịgide, ma ọ bụ ma ọ bụrụ na ịchọrọ ịmaliteghachi ụfọdụ ọrụ anụ ahụ n\'ntụkwasị obi.',
    questionCardTitle: 'Ajụjụ bara uru ịjụ',
    appointmentQuestions: [
      'Afọ m ọ kwekọrọ na ntakịrị ike nke pelvic floor?',
      'Ọ bụ n\'ụzọ ziri ezi ka m na-eme nkwekọrịta?',
      'Ugboro ole ka m kwesịrị ime kwa ụbọchị?',
      'Enwere m ike ịlaghachi n\'ịgba ọsọ, egwuregwu, ma ọ bụ mmega siri ike?',
      'Achọrọ m mmega na midwife ma ọ bụ physiotherapist?',
      'Ọnya m, mgbawa m, ma ọ bụ ịwa ahụ cesarean m ọ chọrọ ntụpọ nche pụrụ iche?',
    ],
    s10TipTitle: 'Ọ dị mma ịmara',
    s10TipText:
      'Ịhụ onye ọkachamara apụtaghị na ihe na-adịghị mma. Oge otu ntụziaka nwere ike inyere gị aka ịlele usoro gị, tụọ ịlaghachi gị, ma mụta ịga n\'ihu n\'ụzọ ziri ezi.',

    s11Heading: 'Ịlaghachi nke na-ewe oge',
    s11Body1:
      'Mgbe ị mụsịrị nwa, ọ bụ ihe nkịtị na ị gaghị enweghachi otu mmetụta ma ọ bụ ike akwara ị nwere tupu ime ozugbo.',
    s11Body2:
      'Ebumnuche abụghị ime ọtụtụ nkwekọrịta dị ka o kwere mee. Ọ bụ karịa ịlaghachi nwayọọ nwayọọ n\'nkwekọrịta ọma n\'etiti nkwekọrịta na ịdị nwayọọ, wee nwee ike iji akwara ndị a n\'ụzọ okike n\'ọrụ kwa ụbọchị.',
    s11HighlightTitle: 'Obere ọganihu bụ ọganihu n\'ezie',
    s11HighlightText:
      'Nghọta ka mma nke mmegharị ahụ, sekọnd ole na ole ọzọ nke nkwekọrịta, ma ọ bụ mbelata ọsọ mmiri bụ akara na-akpali mmụọ ugbu a.',

    s12Heading: 'Isi ihe dị mkpa',
    summaryTitle: 'Isi ihe',
    summaryItems: [
      'Ime na ịmụ nwa na-etinye nrụgide dị ukwuu na pelvic floor.',
      'Ịlaghachi nwayọọ nwayọọ bụ ihe nkịtị mgbe ịmụ nwa gasịrị.',
      'Mmega kwesịrị ibute ụzọ mmegharị ọma karịa ike.',
      'Iku ume na ịdị nwayọọ dị mkpa dịka nkwekọrịta.',
      'Ọsọ mmiri, mmetụta ibu, ma ọ bụ mgbu na-adịgide kwesịrị echiche onye ọkachamara.',
      'Mmega na midwife ma ọ bụ physiotherapist nwere ike inyere gị aka ịlaghachi njikwa ka mma.',
      'Ịlaghachi n\'egwuregwu kwesịrị ịbụ nwayọọ nwayọọ, karịsịa maka ọrụ siri ike.',
    ],

    finalTipTitle: 'Were oge ịlaghachi',
    finalTipText:
      'Mgbe ịmụ nwa gasịrị, ahụ gị agafeela ọtụtụ mgbanwe. Perineum kwesịrị otu nlebara anya dịka akụkụ ahụ gị ndị ọzọ: nwayọọ nwayọọ, mgbe niile, na n\'enweghị nrụgide.',

    disclaimerText:
      'Edemede a bụ maka ozi naanị ma ọ dochighị ndụmọdụ dọkịta e mere maka gị. Ọ bụrụ na ị nwere mgbu, afọ na-adịgide, ma ọ bụ nchegbu ọ bụla gbasara ịlaghachi gị, chọọ ndụmọdụ site n\'aka onye ọrụ ahụike.',
  },
  yo: {
    badge: 'LẸ́YÌN ÌBÍMỌ • ÌMÚPADÀBỌ̀SÍPÒ',
    title: 'Fífún ìsàlẹ̀ ìbàdí rẹ lókun\nlẹ́yìn ìbímọ',
    metaDuration: 'Ìṣẹ́jú 8 láti kà',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Fún àwọn tuntun',
    metaValidated: 'Àkóónú tí a ti yẹ̀wò',
    intro:
      'Lẹ́yìn oyún àti ìbímọ, ìsàlẹ̀ ìbàdí (pelvic floor) nílò àkókò láti padà bọ̀ sípò. Àwọn ìdárayá tó rọrùn, tí a ń ṣe déédéé tí a sì ń ṣe díẹ̀díẹ̀ lè ràn ọ́ lọ́wọ́ láti rí agbára, ìṣàkóso àti ìgboyà padà, láìsí pé o ń yára.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Òye iṣẹ́ perineum',
      'Ìdí tí ìbímọ fi ń fi wàhálà lé e',
      'Ìgbà tí a bẹ̀rẹ̀ ìmúpadàbọ̀sípò ìsàlẹ̀ ìbàdí',
      'Kíkọ́ bí a ṣe ń há iṣan náà dáadáa',
      'Ṣíṣe ètò ìdárayá díẹ̀díẹ̀',
      'Àwọn àṣìṣe láti yẹra fún',
      'Ìgbà tí o yẹ kí o béèrè ìrànlọ́wọ́',
      'Pípadà sí eré ìdárayá díẹ̀díẹ̀',
      'Ìmúrasílẹ̀ fún ìpàdé dókítà',
      'Àwọn kókó pàtàkì',
    ],
    shareMessage: 'Fífún ìsàlẹ̀ ìbàdí rẹ lókun lẹ́yìn ìbímọ — AWA',

    s1Heading: 'Òye iṣẹ́ perineum',
    s1Body1:
      'Perineum, tí a tún ń pè ní ìsàlẹ̀ ìbàdí (pelvic floor), jẹ́ àwùjọ iṣan tó wà ní ìsàlẹ̀ ìbàdí. Ó ní ipa nínú ṣíṣàkóso àpòòtọ̀ àti ìfun, ó sì ń ṣèrànwọ́ láti gbé àwọn ẹ̀yà ara inú ìbàdí dúró.',
    s1Body2:
      'Nígbà oyún, àwọn iṣan wọ̀nyí gbọ́dọ̀ gbé ìwúwo àfikún fún oṣù díẹ̀. A tún fi wàhálà púpọ̀ lé wọn nígbà ìbímọ.',
    s1HighlightTitle: 'Iṣan tó dákẹ́ ṣùgbọ́n tó ṣe pàtàkì',
    s1HighlightText:
      'Ìsàlẹ̀ ìbàdí ní ipa nínú ọ̀pọ̀ iṣẹ́ ojoojúmọ́: dídá ito àti ìgbẹ́ dúró, ṣíṣàkóso afẹ́fẹ́ inú, gbígbé àwọn ẹ̀yà ara inú ìbàdí dúró, àti níní ipa nínú àwọn iṣẹ́ ìbálòpọ̀ kan.',

    benefitsHeading: 'Àwọn àǹfààní ìsàlẹ̀ ìbàdí tó lágbára sí i',
    benefitsIntro:
      'Fífún un lókun díẹ̀díẹ̀ tí a sì ṣe dáadáa lè ràn ìṣàkóso àti ìgbékalẹ̀ ìsàlẹ̀ ìbàdí lọ́wọ́ láti sunwọ̀n sí i.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Ìṣàkóso àpòòtọ̀ tó dára sí i',
        text: 'Ìsàlẹ̀ ìbàdí ní ipa nínú ṣíṣàkóso àpòòtọ̀. Fífún un lókun díẹ̀díẹ̀ lè ṣèrànwọ́ láti dín àwọn ìtú ito kan kù.',
      },
      {
        icon: 'toilet',
        title: 'Ìrànlọ́wọ́ fún iṣẹ́ ìfun',
        text: 'Àwọn iṣan wọ̀nyí tún ń ṣèrànwọ́ láti ṣàkóso afẹ́fẹ́ inú àti ìgbẹ́, wọ́n sì ń kópa nínú gbígbé àwọn ẹ̀yà ara inú ìbàdí dúró.',
      },
      {
        icon: 'human-female',
        title: 'Gbígbé àwọn ẹ̀yà ara inú ìbàdí dúró',
        text: 'Ìsàlẹ̀ ìbàdí jẹ́ ìpìlẹ̀ iṣan tòótọ́ tó ń ṣèrànwọ́ láti gbé àpòòtọ̀, ilé ọmọ àti ìfun dúró.',
      },
      {
        icon: 'heart-pulse',
        title: 'Rírí ìmọ̀lára padà díẹ̀díẹ̀',
        text: 'Ìmúpadàbọ̀sípò tó yẹ tún lè ràn ọ́ lọ́wọ́ láti ní òye àti ìṣàkóso tó dára sí i lórí agbègbè yìí.',
      },
    ],

    s2Heading: 'Ìdí tí oyún àti ìbímọ fi ń fi wàhálà lé e',
    s2Body1:
      'Oyún ń fi ìfúnpá púpọ̀ sí i lé ìsàlẹ̀ ìbàdí díẹ̀díẹ̀. Ìbímọ lọ́nà àbínibí lè wá na àwọn iṣan àti àwọn ara agbègbè yìí gan-an.',
    s2Body2:
      'Ìbímọ nípa iṣẹ́ abẹ (cesarean) kò gba ìsàlẹ̀ ìbàdí là pátápátá pẹ̀lú: oyún fúnra rẹ̀ jẹ́ àkókò pàtàkì fún àwọn iṣan wọ̀nyí.',
    s2Body3:
      'Lẹ́yìn ìbímọ, nítorí náà, ó jẹ́ ohun àbáyọ pé ìmúpadàbọ̀sípò máa gba àkókò. Àwọn obìnrin kan kò ní rí àmì kankan, nígbà tí àwọn mìíràn lè kíyèsí ìtú ito, ìmọ̀lára ìwúwo, tàbí ìdínkù ìṣàkóso iṣan.',
    s2TipTitle: 'Ìmúpadàbọ̀sípò kọ̀ọ̀kan yàtọ̀',
    s2TipText:
      'Irú ìbímọ, yíya tàbí gígé (episiotomy), wíwà ìrora, àti ipò ara rẹ lápapọ̀ lẹ́yìn ìbímọ, gbogbo wọn lè nípa lórí ìmúpadàbọ̀sípò.',

    s3Heading: 'Ìgbà wo ni a bẹ̀rẹ̀ ìmúpadàbọ̀sípò ìsàlẹ̀ ìbàdí?',
    s3Body1:
      'Lẹ́yìn ìbímọ tí kò ní ìṣòro, a lè bẹ̀rẹ̀ sí í há ìsàlẹ̀ ìbàdí pẹ̀lẹ́ padà díẹ̀díẹ̀. Ó ṣì ṣe pàtàkì láti ṣe àtúnṣe àwọn ìdárayá sí ipò rẹ àti láti wá ìmọ̀ràn tí o bá ní ìṣòro, ìrora púpọ̀, tàbí ìtọ́jú pàtó kan.',
    s3Body2:
      'Tí o bá ní ọpọ́n ito (urinary catheter), àwọn ìmọ̀ràn kan dámọ̀ràn pé kí o dúró títí a ó fi yọ ọ́ kúrò tí ito dídá sì padà sí déédéé kí o tó bẹ̀rẹ̀ àwọn ìdárayá perineum.',
    s3AlertTitle: 'Má ṣe fi tipátipá ṣe é nígbà tí ó bá ń dùn',
    s3AlertText:
      'Ìrora púpọ̀, àwọn àmì tó ń burú sí i, ọgbẹ́ tí kò ń san dáadáa, tàbí àníyàn èyíkéyìí nílò ìmọ̀ràn láti ọ̀dọ̀ agbẹ̀bí, dókítà, tàbí ọ̀jọ̀gbọ́n ìmúpadàbọ̀sípò.',

    s4Heading: 'Kíkọ́ bí a ṣe ń há iṣan náà dáadáa',
    s4Body1:
      'Láti dá ìṣípòpadà náà mọ̀, ronú pé o ń gbìyànjú láti dá afẹ́fẹ́ àti ìfẹ́ láti tọ̀ dúró lẹ́ẹ̀kan náà. Ìṣípòpadà tí ò ń wá ni ìmọ̀lára híhá àti gbígbé sókè sí inú.',
    s4Body2:
      'Ète rẹ̀ kì í ṣe láti há gbogbo ara rẹ mọ́ra. Ìdí rẹ, itan rẹ àti ikùn rẹ gbọ́dọ̀ dákẹ́ jẹ́ẹ́ bí ó ti ṣeé ṣe tó, nígbà tí mímí ń lọ déédéé.',
    exercises: [
      {icon: 'weather-windy', label: 'Mímí'},
      {icon: 'human-handsup', label: 'Híhá pẹ̀lẹ́'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Híhá gígùn'},
      {icon: 'gesture-tap-button', label: 'Híhá kíákíá'},
    ],
    s4HighlightTitle: 'Ìsinmi ṣe pàtàkì bákan náà',
    s4HighlightText:
      'Lẹ́yìn híhá kọ̀ọ̀kan, jẹ́ kí àwọn iṣan sinmi pátápátá. Ìmúpadàbọ̀sípò tó dára kì í túmọ̀ sí pípa perineum mọ́ ní híhá ní gbogbo ọjọ́.',

    s5Heading: 'Ṣíṣe ètò ìdárayá díẹ̀díẹ̀',
    s5Body1:
      'Ní àkọ́kọ́, ohun tó ṣe pàtàkì jù ni kíkọ́ láti dá àwọn iṣan mọ̀ àti láti ṣe ìṣípòpadà náà dáadáa. Ṣíṣe déédéé ṣe pàtàkì ju agbára lọ.',
    s5h3a: 'Híhá gígùn',
    s5Body2:
      'Há ìsàlẹ̀ ìbàdí pẹ̀lẹ́, lẹ́yìn náà dì híhá náà mú fún ìṣẹ́jú-àáyá díẹ̀ láìdí mímí mú. Lẹ́yìn náà tú u sílẹ̀ pátápátá kí o tó tún bẹ̀rẹ̀.',
    s5h3b: 'Híhá kúkúrú',
    s5Body3:
      'Nígbà tí o bá ti ní ìṣípòpadà náà, a lè fi àwọn híhá kékeré kíákíá kún un. Wọ́n ń ṣèrànwọ́ láti kọ́ agbára rẹ láti há àwọn iṣan kíákíá nígbà tí ìfúnpá inú bá pọ̀ sí i, fún àpẹẹrẹ ṣáájú kí o tó wú ikọ́ tàbí kí o tó sín.',
    dailyTips: [
      {icon: 'clock-outline', label: 'So àwọn ìdárayá mọ́ àṣà ojoojúmọ́'},
      {icon: 'human-sitting', label: 'Bẹ̀rẹ̀ ní ipò tí ó tù ọ́'},
      {icon: 'weather-windy', label: 'Mí déédéé nígbà híhá'},
      {icon: 'sleep', label: 'Bọ̀wọ̀ fún àwọn àkókò ìsinmi'},
      {icon: 'chart-line', label: 'Mú ìṣòro náà pọ̀ sí i díẹ̀díẹ̀'},
      {icon: 'doctor', label: 'Béèrè fún ìmọ̀ràn tí o kò bá mọ̀ dájú'},
    ],
    s5TipTitle: 'Ṣíṣe déédéé ju gbogbo rẹ̀ lọ',
    s5TipText:
      'Sísopọ̀ àwọn ìdárayá mọ́ àṣà tí ó ti wà nínú ọjọ́ rẹ lè mú kí ó rọrùn láti máa ṣe déédéé: lẹ́yìn fífún ọmọ lọ́mú, lẹ́yìn fífọ eyín, tàbí ní àkókò mìíràn tó bá ọ mu.',

    s6Heading: 'Àwọn àṣìṣe tó wọ́pọ̀ láti yẹra fún',
    s6Body1:
      'Àwọn ìdárayá perineum lè dà bí ohun tó rọrùn, ṣùgbọ́n ó rọrùn láti lo àwọn iṣan mìíràn dípò rẹ̀ tàbí láti tì í jù.',
    commonMistakes: [
      'Híhá ìdí tàbí itan dípò ìsàlẹ̀ ìbàdí',
      'Dídí mímí mú nígbà híhá',
      'Pípa àwọn iṣan mọ́ ní híhá nígbà gbogbo láìjẹ́ kí wọ́n sinmi',
      'Ṣíṣe àwọn ìdárayá fún ọjọ́ díẹ̀ nìkan lẹ́yìn náà kí a dúró',
      'Mọ̀ọ́mọ̀ dá ito dúró láti ṣàyẹ̀wò híhá náà',
    ],
    s6TipTitle: 'Ohun tí kò yẹ kí o ṣe',
    s6TipText:
      'A kò dámọ̀ràn ṣíṣe àwọn ìdárayá nípa mímọ̀ọ́mọ̀ dá ito dúró. Ọ̀nà yìí kò kọ́ perineum dáadáa, ó sì lè da iṣẹ́ àpòòtọ̀ déédéé rú.',

    s7Heading: 'Àwọn àmì wo ni ó yẹ kí ó mú kí o lọ rí dókítà?',
    s7Body1:
      'Ìtú ito kékeré tàbí ìmọ̀lára àìwọ́pọ̀ lè farahàn nígbà míì lẹ́yìn ìbímọ. Ṣùgbọ́n, kò yẹ kí a fojú fò wọ́n tí wọ́n bá ń tẹ̀síwájú, tí wọ́n ń burú sí i, tàbí tí wọ́n ń dí ìgbésí ayé rẹ lọ́wọ́.',
    warningSigns: [
      'Ìtú ito nígbà tí o bá wú ikọ́, sín, rẹ́rìn-ín, tàbí tẹ̀ ara',
      'Ìmọ̀lára ìwúwo tàbí ìfúnpá ní ìsàlẹ̀ ìbàdí',
      'Ìmọ̀lára pé ìdì kan tàbí ohun kan ń sọ̀kalẹ̀ sínú obo',
      'Ìṣòro dídá afẹ́fẹ́ tàbí ìgbẹ́ dúró',
      'Ìrora tí kì í lọ ní perineum',
      'Ìrora nígbà tàbí lẹ́yìn ìbálòpọ̀',
      'Ìṣòro dídá àwọn iṣan perineum mọ̀ tàbí híhá wọn dáadáa',
    ],
    consultLabel: 'Ìgbà wo ni o yẹ kí o wá ìmọ̀ràn?',
    s7Body2:
      'Agbẹ̀bí, dókítà, tàbí physiotherapist tó mọ̀ nípa ìmúpadàbọ̀sípò ìsàlẹ̀ ìbàdí lè ṣàyẹ̀wò iṣẹ́ àwọn iṣan, kí ó sì dámọ̀ràn ètò tó yẹ.',

    s8Heading: 'Àti lẹ́yìn yíya, episiotomy, tàbí ìbímọ nípa iṣẹ́ abẹ?',
    s8Body1:
      'Yíya tàbí episiotomy nílò ìtọ́jú pàtó nígbà ìwòsàn. Pípadà sí àwọn iṣẹ́ yẹ kí ó ronú nípa ìrora, ipò àpá, àti ìtọ́sọ́nà tí a fún ọ lẹ́yìn ìbímọ.',
    s8Body2:
      'Lẹ́yìn ìbímọ nípa iṣẹ́ abẹ, ìmúpadàbọ̀sípò tún kan ògiri ikùn àti àpá. Àní bí ìbímọ náà kò bá jẹ́ ti àbínibí, oyún fúnra rẹ̀ ṣì fi wàhálà lé ìsàlẹ̀ ìbàdí.',
    s8HighlightTitle: 'Ìtọ́jú tí a ṣe fún ọ lè ṣèrànwọ́',
    s8HighlightText:
      'Ní ọ̀ràn yíya tó pọ̀, ìrora, àwọn àmì tó jẹ mọ́ ito tàbí ìfun, tàbí àwọn ìṣòro tí kì í lọ, àyẹ̀wò pẹ̀lú ọ̀jọ̀gbọ́n ìlera lè wúlò gan-an.',

    s9Heading: 'Pípadà sí eré ìdárayá díẹ̀díẹ̀',
    s9Body1:
      'Pípadà sí ìṣípòpadà lẹ́yìn ìbímọ yẹ kí ó jẹ́ díẹ̀díẹ̀. Rírìn àti àwọn ìṣípòpadà pẹ̀lẹ́ lè bẹ̀rẹ̀ padà ní gbogbogbòò gẹ́gẹ́ bí bí o ṣe ń rí lára, nígbà tí àwọn iṣẹ́ tó lágbára nílò ìṣọ́ra púpọ̀ sí i.',
    s9Body2:
      'Kí o tó padà sí sísáré, fífò, tàbí ìdárayá líle gan-an, ó dára jù láti ṣe àyẹ̀wò ìmúpadàbọ̀sípò ìsàlẹ̀ ìbàdí kí o sì kíyèsí àwọn àmì èyíkéyìí.',
    s9AlertTitle: 'Má ṣe yára àwọn ìgbésẹ̀',
    s9AlertText:
      'Ìtú ito, ìmọ̀lára ìwúwo, tàbí ìrora nígbà tàbí lẹ́yìn ìdárayá jẹ́ àmì pé o yẹ kí o dín ìyára kù kí o sì wá ìmọ̀ràn kí o tó mú agbára pọ̀ sí i.',

    s10Heading: 'Ìgbà wo ni o yẹ kí o rí ọ̀jọ̀gbọ́n?',
    s10Body1:
      'Ìmúpadàbọ̀sípò ìsàlẹ̀ ìbàdí pẹ̀lú agbẹ̀bí tàbí physiotherapist lè wúlò tí o kò bá mọ̀ dájú bóyá o ń há iṣan náà dáadáa, tí àwọn àmì rẹ bá ń tẹ̀síwájú, tàbí tí o bá fẹ́ padà sí àwọn iṣẹ́ ara kan pẹ̀lú ìgboyà.',
    questionCardTitle: 'Àwọn ìbéèrè tó wúlò láti béèrè',
    appointmentQuestions: [
      'Ṣé àwọn àmì mi bá àìlera ìsàlẹ̀ ìbàdí mu?',
      'Ṣé mo ń há iṣan náà dáadáa?',
      'Ìgbà mélòó ni ó yẹ kí n ṣe é lójoojúmọ́?',
      'Ṣé mo lè padà sí sísáré, eré ìdárayá, tàbí ìdárayá líle?',
      'Ṣé mo nílò ìmúpadàbọ̀sípò pẹ̀lú agbẹ̀bí tàbí physiotherapist?',
      'Ṣé àpá mi, yíya mi, tàbí ìbímọ mi nípa iṣẹ́ abẹ nílò ìṣọ́ra pàtó kan?',
    ],
    s10TipTitle: 'Ó dára láti mọ̀',
    s10TipText:
      'Rírí ọ̀jọ̀gbọ́n kì í fi dandan túmọ̀ sí pé ohun kan ṣe. Ìpàdé kan lè ràn ọ́ lọ́wọ́ láti ṣàyẹ̀wò ọ̀nà tí ò ń gbà ṣe é, láti wo ìmúpadàbọ̀sípò rẹ, àti láti kọ́ bí a ṣe ń tẹ̀síwájú dáadáa.',

    s11Heading: 'Ìmúpadàbọ̀sípò tó ń gba àkókò',
    s11Body1:
      'Lẹ́yìn ìbímọ, ó jẹ́ ohun àbáyọ pé o kò ní rí ìmọ̀lára tàbí agbára iṣan kan náà tí o ní ṣáájú oyún lẹ́sẹ̀kẹsẹ̀.',
    s11Body2:
      'Ète rẹ̀ kì í ṣe láti há iṣan tó pọ̀ jù lọ bí ó ti ṣeé ṣe. Ó jẹ́ nípa rírí ìṣọ̀kan tó dára padà díẹ̀díẹ̀ láàrín híhá àti ìsinmi, lẹ́yìn náà kí o lè lo àwọn iṣan wọ̀nyí nípa ti ẹ̀dá nínú àwọn iṣẹ́ ojoojúmọ́.',
    s11HighlightTitle: 'Ìlọsíwájú kékeré jẹ́ ìlọsíwájú gidi',
    s11HighlightText:
      'Òye tó dára sí i nípa ìṣípòpadà náà, ìṣẹ́jú-àáyá díẹ̀ àfikún nínú híhá, tàbí ìdínkù ìtú ito jẹ́ àmì tó ń fúnni níṣìírí.',

    s12Heading: 'Àwọn kókó pàtàkì',
    summaryTitle: 'Àwọn kókó pàtàkì',
    summaryItems: [
      'Oyún àti ìbímọ ń fi wàhálà púpọ̀ lé ìsàlẹ̀ ìbàdí.',
      'Ìmúpadàbọ̀sípò díẹ̀díẹ̀ jẹ́ ohun àbáyọ lẹ́yìn ìbímọ.',
      'Àwọn ìdárayá yẹ kí ó fi ìdára ìṣípòpadà ṣáájú agbára.',
      'Mímí àti ìsinmi ṣe pàtàkì bí híhá.',
      'Ìtú ito, ìwúwo, tàbí ìrora tí kì í lọ yẹ fún èrò ọ̀jọ̀gbọ́n.',
      'Ìmúpadàbọ̀sípò pẹ̀lú agbẹ̀bí tàbí physiotherapist lè ràn ọ́ lọ́wọ́ láti rí ìṣàkóso tó dára padà.',
      'Pípadà sí eré ìdárayá yẹ kí ó jẹ́ díẹ̀díẹ̀, pàápàá fún àwọn iṣẹ́ líle.',
    ],

    finalTipTitle: 'Gba àkókò láti múpadàbọ̀sípò',
    finalTipText:
      'Lẹ́yìn ìbímọ, ara rẹ ti la ọ̀pọ̀ àyípadà kọjá. Perineum yẹ fún ìtọ́jú bí ìyókù ara rẹ: díẹ̀díẹ̀, déédéé, àti láìsí ìfúnpá.',

    disclaimerText:
      'Àpilẹ̀kọ yìí wà fún ìmọ̀ nìkan, kò sì rọ́pò ìmọ̀ràn ìṣègùn tí a ṣe fún ọ ní pàtó. Tí o bá ní ìrora, àwọn àmì tí kì í lọ, tàbí àníyàn èyíkéyìí nípa ìmúpadàbọ̀sípò rẹ, wá ìmọ̀ràn lọ́dọ̀ ọ̀jọ̀gbọ́n ìlera.',
  },
  zu: {
    badge: 'NGEMVA KOKUBELETHA • UKUPHILA KABUSHA',
    title: 'Ukuqinisa i-pelvic floor\nngemva kokubeletha',
    metaDuration: 'Imizuzu emi-8 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Abaqalayo',
    metaValidated: 'Okuphawulwe ngochwepheshe',
    intro:
      'Ngemva kokukhulelwa nokubeletha, i-pelvic floor idinga isikhathi ukuze iphile kabusha. Imisebenzi elula, ejwayelekile neqhubekayo ingakusiza ubuyele emandleni, ekulawuleni nasekuzethembeni, ngaphandle kokushisekela ukusheshisa izinto.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Ukuqonda indima ye-perineum',
      'Kungani ukubeletha kuyicindezela',
      'Isikhathi sokuqala ukuvivinya i-pelvic floor',
      'Ukufunda ukuncipha kahle kwemisipha',
      'Ukwakha inqubo eqhubekayo',
      'Amaphutha okufanele ugweme',
      'Isikhathi sokucela usizo',
      'Ukubuyela kancane kancane ekuzivivinyeni',
      'Ukulungiselela ukuvakashela udokotela',
      'Okubalulekile',
    ],
    shareMessage: 'Ukuqinisa i-pelvic floor ngemva kokubeletha — AWA',

    s1Heading: 'Ukuqonda indima ye-perineum',
    s1Body1:
      'I-perineum, ebizwa nangokuthi i-pelvic floor, yiqembu lemisipha esekeleni lesiphundu. Isiza ekulawuleni isinyi nesigaxa futhi isekela izitho zesiphundu.',
    s1Body2:
      'Ngesikhathi sokukhulelwa, le misipha kufanele iphathe isisindo esengeziwe izinyanga eziningana. Icindezelwa kakhulu nangesikhathi sokubeletha.',
    s1HighlightTitle: 'Umsipha ocashile kodwa obalulekile',
    s1HighlightText:
      'I-pelvic floor ibamba iqhaza emisebenzini eminingana yansuku zonke: ukubamba umchamo nendle, ukulawula umoya, ukusekela izitho zesiphundu, nokubamba iqhaza kwezinye izindlela zocansi.',

    benefitsHeading: 'Izinzuzo zokuqina kwe-pelvic floor',
    benefitsIntro:
      'Ukuqinisa kancane kancane futhi ngendlela efanele kungasiza ukuthuthukisa ukulawula nokusekela kwe-pelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Ukulawula kangcono isinye',
        text: 'I-pelvic floor ibamba iqhaza ekulawuleni isinye. Ukuyiqinisa kancane kancane kungasiza ukunciphisa ukuvuza komchamo okuthile.',
      },
      {
        icon: 'toilet',
        title: 'Ukusekela umsebenzi wamathumbu',
        text: 'Le misipha isiza nasekulawuleni umoya nendle futhi inikela ekusekeleni izitho zesiphundu.',
      },
      {
        icon: 'human-female',
        title: 'Ukusekela izitho zesiphundu',
        text: 'I-pelvic floor yakha isisekelo semisipha esiqinisekile esisiza ukusekela isinye, ibhikawozi namathumbu.',
      },
      {
        icon: 'heart-pulse',
        title: 'Ukubuyelwa kancane kancane yilokho okuzwayo',
        text: 'Ukuvivinya okufanele kungakusiza futhi ube nokuqaphela nokulawula kangcono kule ndawo.',
      },
    ],

    s2Heading: 'Kungani ukukhulelwa nokubeletha kuyicindezela',
    s2Body1:
      'Ukukhulelwa kubeka ingcindezi eyengeziwe kancane kancane ku-pelvic floor. Ukubeletha ngomhlandla kungase kuyelule kakhulu imisipha nezicubu kule ndawo.',
    s2Body2:
      'Ukubeletha ngokuhlinzwa (cesarean) nakho akuyisindisi ngokuphelele i-pelvic floor: ukukhulelwa ngokwakho kuhlala kuyisikhathi esibalulekile kule misipha.',
    s2Body3:
      'Ngemva kokubeletha, ngakho-ke kujwayelekile ukuthi ukuphila kabusha kuthathe isikhathi. Abanye besifazane cishe abazwa zimpawu, kanti abanye bangaphawula ukuvuza, umuzwa wokusinda, noma ukwehla kokulawula imisipha.',
    s2TipTitle: 'Ukuphila kabusha kuhlukile kowesifazane ngamunye',
    s2TipText:
      'Uhlobo lokubeletha, ukuklebhuka noma i-episiotomy, ubuhlungu, nesimo sakho jikelele ngemva kokubeletha konke kungathinta ukuphila kabusha.',

    s3Heading: 'Isikhathi sokuqala ukuvivinya i-pelvic floor?',
    s3Body1:
      'Ngemva kokubeletha okungenazinkinga, ukuncipha okuthambile kwe-pelvic floor imvamisa kungaqalwa kabusha kancane kancane. Kuhlala kubalulekile ukuvumelanisa imisebenzi nesimo sakho nokucela ukweluleka uma ube nenkinga, ubuhlungu obukhulu, noma inqubo ethile.',
    s3Body2:
      'Uma unompompi womchamo, ezinye izincomo ziphakamisa ukulinda kuze kukhishwe futhi ukuchama okujwayelekile kubuyele ngaphambi kokuqala imisebenzi ye-perineum.',
    s3AlertTitle: 'Ungaphoqi uma kubuhlungu',
    s3AlertText:
      'Ubuhlungu obukhulu, izimpawu ezimbi kakhulu, inxeba eliphola kabi, noma yikuphi okukukhathazayo kudinga ukweluleka komzali (umbelethisi), udokotela, noma uchwepheshe wokuvivinya.',

    s4Heading: 'Ukufunda ukuncipha kahle kwemisipha',
    s4Body1:
      'Ukuze uqaphele lo mnyakazo, cabanga ukuthi uzama ukubamba umoya nesifiso sokuchama ngasikhathi sinye. Lokho okufunayo umuzwa wokuncipha nokuhlehlisa phakathi.',
    s4Body2:
      'Inhloso akukhona ukuqinisa umzimba wonke. Amanqina, amathanga nesisu kufanele kuhlale kuthambile kakhulu ngangokunokwenzeka, kuyilapho ukuphefumula kuqhubeka kujwayelekile.',
    exercises: [
      {icon: 'weather-windy', label: 'Ukuphefumula'},
      {icon: 'human-handsup', label: 'Ukuncipha okuthambile'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Ukuncipha okude'},
      {icon: 'gesture-tap-button', label: 'Ukuncipha okusheshayo'},
    ],
    s4HighlightTitle: 'Ukuphumula kubalulekile ngokulinganayo',
    s4HighlightText:
      'Ngemva kokuncipha ngakunye, vumela imisipha iphumule ngokuphelele. Ukuvivinya okuhle akusho ukugcina i-perineum iqinile usuku lonke.',

    s5Heading: 'Ukwakha inqubo eqhubekayo',
    s5Body1:
      'Ekuqaleni, okubaluleke kakhulu ukufunda ukuhlonza imisipha nokwenza umnyakazo kahle. Ukuhlala njalo kubalulekile kunamandla.',
    s5h3a: 'Ukuncipha okude',
    s5Body2:
      'Ncipha kancane i-pelvic floor, bese ugcina ukuncipha imizuzwana embalwa ngaphandle kokubamba umoya. Bese ukhulula ngokuphelele ngaphambi kokuphinda.',
    s5h3b: 'Ukuncipha okufushane',
    s5Body3:
      'Uma umnyakazo usuwazi kahle, ungangeza ukuncipha okuncane okusheshayo. Kusiza ukuzijwayeza ukuncipha ngokushesha lapho ingcindezi yesisu ikhula, isibonelo ngaphambi kokukhwehlela noma ukuthimula.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Hlanganisa imisebenzi nesihloko sansuku zonke'},
      {icon: 'human-sitting', label: 'Qala ngesimo esiphumulayo'},
      {icon: 'weather-windy', label: 'Phefumula kahle ngesikhathi sokuncipha'},
      {icon: 'sleep', label: 'Hlonipha izigaba zokuphumula'},
      {icon: 'chart-line', label: 'Khulisa ubunzima kancane kancane'},
      {icon: 'doctor', label: 'Cela ukweluleka uma ungaqiniseki'},
    ],
    s5TipTitle: 'Ukuhlala njalo ngaphezu kwakho konke',
    s5TipText:
      'Ukuhlanganisa imisebenzi nesihloko esivele sisosukwini lwakho kungakusiza ukuhlala njalo: ngemva kokuncelisa, ngemva kokuxubha amazinyo, noma ngesinye isikhathi esikufanelayo.',

    s6Heading: 'Amaphutha avamile okufanele ugweme',
    s6Body1:
      'Imisebenzi ye-perineum ingabonakala ilula, kodwa kulula ukusebenzisa eminye imisipha esikhundleni noma ukuphoqa ngokweqile.',
    commonMistakes: [
      'Ukuqinisa amanqina noma amathanga esikhundleni se-pelvic floor',
      'Ukubamba umoya ngesikhathi sokuncipha',
      'Ukugcina imisipha ncipha njalo ngaphandle kokuyiyekela iphumule',
      'Ukwenza imisebenzi izinsuku ezimbalwa kuphela bese uyayeka',
      'Ukumisa ngamabomu umchamo ukuze uhlole ukuncipha',
    ],
    s6TipTitle: 'Okungafanele ukwenze',
    s6TipText:
      'Akunconywa ukuzivivinya ngokumisa umchamo ngamabomu. Le ndlela ayiyivivinyi kahle i-perineum futhi ingaphazamisa umsebenzi ojwayelekile wesinye.',

    s7Heading: 'Yiziphi izimpawu ezifanele zikuthumele ukubonana nodokotela?',
    s7Body1:
      'Ukuvuza okuncane noma umuzwa ongajwayelekile kungavela ngemva kokubeletha. Kodwa akufanele kunganakwa uma kuqhubeka, kubi kakhulu, noma kuphazamisa impilo yakho yansuku zonke.',
    warningSigns: [
      'Ukuvuza komchamo uma ukhwehlela, uthimula, uhleka noma uphokophela',
      'Umuzwa wokusinda noma wengcindezi ezansi esiphundwini',
      'Umuzwa wokuthi isigaxa noma okuthile kuyehla emacansini',
      'Ubunzima bokubamba umoya noma indle',
      'Ubuhlungu obuqhubekayo ku-perineum',
      'Ubuhlungu ngesikhathi noma ngemva kobuhlobo bocansi',
      'Ubunzima bokuhlonza noma bokuncipha kahle kwemisipha ye-perineum',
    ],
    consultLabel: 'Kufanele ucele ukweluleka nini?',
    s7Body2:
      'Umbelethisi, udokotela, noma i-physiotherapist ekhethekile ekuvivinyeni i-pelvic floor angahlola umsebenzi wemisipha futhi aphakamise uhlelo olufanele.',

    s8Heading: 'Nakuba kuklebhukile, kwenziwe i-episiotomy, noma kwahlinzwa (cesarean)?',
    s8Body1:
      'Ukuklebhuka noma i-episiotomy kudinga ukunakekelwa okukhethekile ngesikhathi sokuphola. Ukubuyela emisebenzini kufanele kucabangele ubuhlungu, isimo sesibazi, nesiqondiso esinikeziwe ngemva kokubeletha.',
    s8Body2:
      'Ngemva kokubeletha ngokuhlinzwa, ukuphila kabusha kuhilela nodonga lwesisu nesibazi. Noma ngabe ukubeletha kwakungeyona ngomhlandla, ukukhulelwa ngokwakho kwabeka ingcindezi ku-pelvic floor.',
    s8HighlightTitle: 'Ukunakekelwa okwenzelwe wena kungasiza',
    s8HighlightText:
      'Uma kuklebhuke kakhulu, kunobuhlungu, izimpawu zomchamo noma zamathumbu, noma ubunzima obuqhubekayo, ukuhlolwa ngochwepheshe wezempilo kungaba wusizo kakhulu.',

    s9Heading: 'Ukubuyela kancane kancane ekuzivivinyeni',
    s9Body1:
      'Ukubuyela ekunyakazeni ngemva kokubeletha kufanele kube kancane kancane. Ukuhamba nokunyakaza okuthambile imvamisa kungaqalwa kabusha ngokuya ngendlela ozizwa ngayo, kanti imisebenzi enomthelela omkhulu idinga ukuqapha okwengeziwe.',
    s9Body2:
      'Ngaphambi kokuqala ukugijima, ukugxuma, noma ukuzivivinya okunzima kakhulu, kungcono ukuhlola ukuphila kabusha kwe-pelvic floor futhi ucabangele nanoma yiziphi izimpawu.',
    s9AlertTitle: 'Ungasheshisi izigaba',
    s9AlertText:
      'Ukuvuza, umuzwa wokusinda, noma ubuhlungu ngesikhathi noma ngemva kokuzivivinya kuyizimpawu zokuthi kufanele wehlise isivinini futhi ucele ukweluleka ngaphambi kokukhulisa amandla.',

    s10Heading: 'Isikhathi sokubona uchwepheshe?',
    s10Body1:
      'Ukuvivinya i-pelvic floor nomzali (umbelethisi) noma i-physiotherapist kungaba wusizo uma ungaqiniseki ukuthi uncipha kahle, uma izimpawu zakho ziqhubeka, noma uma ufuna ukubuyela emisebenzini ethile yomzimba ngokuzethemba.',
    questionCardTitle: 'Imibuzoewusizo ongayibuza',
    appointmentQuestions: [
      'Ingabe izimpawu zami ziyahambisana nokuphela kwamandla kwe-pelvic floor?',
      'Ingabe ngenza ukuncipha ngendlela efanele?',
      'Kufanele ngiphinde kangaki ngosuku?',
      'Ngingabuyela ekugijimeni, ezemidlalo, noma ekuzivivinyeni okunomthelela omkhulu?',
      'Ngidinga ukuvivinywa nomzali (umbelethisi) noma i-physiotherapist?',
      'Ingabe isibazi sami, ukuklebhuka, noma ukuhlinzwa (cesarean) kudinga ukuqapha okukhethekile?',
    ],
    s10TipTitle: 'Kuhle ukwazi',
    s10TipText:
      'Ukubona uchwepheshe akusho ngempela ukuthi kukhona okungalungile. Isikhathi esisodwa singasiza nje ukuhlola indlela yakho, ukuhlola ukuphila kabusha kwakho, nokufunda ukuqhubeka kahle.',

    s11Heading: 'Ukuphila kabusha okuthatha isikhathi',
    s11Body1:
      'Ngemva kokubeletha, kujwayelekile ukungabuyeli masisha emizweni noma emandleni emisipha owayenayo ngaphambi kokukhulelwa.',
    s11Body2:
      'Inhloso akukhona ukwenza ukuncipha okuningi ngangokunokwenzeka. Kumayelana nokubuyisa kancane kancane ukuvumelana okuhle phakathi kokuncipha nokuphumula, bese uba nokusebenzisa le misipha ngokwemvelo emisebenzini yansuku zonke.',
    s11HighlightTitle: 'Inqubekela phambili encane iyinqubekela phambili ngempela',
    s11HighlightText:
      'Ukuqaphela kangcono umnyakazo, imizuzwana embalwa eyengeziwe yokuncipha, noma ukwehla kokuvuza kuyizimpawu ezikhuthazayo kakade.',

    s12Heading: 'Okubalulekile',
    summaryTitle: 'Okubalulekile',
    summaryItems: [
      'Ukukhulelwa nokubeletha kubeka ingcindezi enkulu ku-pelvic floor.',
      'Ukuphila kabusha kancane kancane kujwayelekile ngemva kokubeletha.',
      'Imisebenzi kufanele ibeke phambili ikhwalithi yomnyakazo kunamandla.',
      'Ukuphefumula nokuphumula kubalulekile ngokulinganayo nokuncipha.',
      'Ukuvuza komchamo, ukusinda, noma ubuhlungu obuqhubekayo kudinga umbono wochwepheshe.',
      'Ukuvivinya nomzali (umbelethisi) noma i-physiotherapist kungakusiza ubuyele ekulawuleni kangcono.',
      'Ukubuyela ezemidlalo kufanele kube kancane kancane, ikakhulukazi emisebenzini enomthelela omkhulu.',
    ],

    finalTipTitle: 'Thatha isikhathi sokuphila kabusha',
    finalTipText:
      'Ngemva kokubeletha, umzimba wakho wadlula ezinguqukweni eziningi. I-perineum ifanele ukunakwa ngokufanayo nomzimba wonke: kancane kancane, njalo, futhi ngaphandle kwengcindezi.',

    disclaimerText:
      'Lesi sihloko siyolwazi kuphela futhi asithathi indawo yeseluleko sezokwelapha esenzelwe wena. Uma unobuhlungu, izimpawu eziqhubekayo, noma uthintwa yinoma yikuphi mayelana nokuphila kabusha kwakho, cela ukweluleka kochwepheshe wezempilo.',
  },
  xh: {
    badge: 'UKUBELEKA KWEMVA • UKUPHILA',
    title: 'Ukomeleza i-pelvic floor yakho\nemva kokubeleka',
    metaDuration: 'Imizuzu eyi-8 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Abaqalayo',
    metaValidated: 'Umxholo ohlaziyiweyo',
    intro:
      'Emva kokukhulelwa nokubeleka, i-pelvic floor idinga ixesha lokuphila. Imithambo elula, eqhelekileyo nenyuka kancinci inokukunceda ubuyisele amandla, ulawulo nokuzithemba, ngaphandle kokuzama ukukhawulezisa izinto.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Ukuqonda indima ye-perineum',
      'Kutheni ukubeleka kuyibeka phantsi koxinzelelo',
      'Xa kufuneka uqale uhlaziyo lwe-pelvic floor',
      'Ukufunda ukuncina ngokuchanekileyo',
      'Ukwakha inkqubo enyuka kancinci',
      'Iimpazamo ekufuneka uzigcine',
      'Xa kufuneka ucele uncedo',
      'Ukubuyela kancinci kwezemidlalo',
      'Ukulungiselela ukubonana',
      'Eyona nto ibalulekileyo',
    ],
    shareMessage: 'Ukomeleza i-pelvic floor yakho emva kokubeleka — AWA',

    s1Heading: 'Ukuqonda indima ye-perineum',
    s1Body1:
      'I-perineum, ekwabizwa ngokuba yi-pelvic floor, liqela leemisipha eliseziko lenkqayi. Idlala indima ekulawuleni isinyi nesikhumba ibe inceda ukuxhasa iinkqubo zenkqayi.',
    s1Body2:
      'Ngexesha lokukhulelwa, ezi misipha kufuneka zithwale ubunzima obongezelelweyo iinyanga ezininzi. Zikwabekwa phantsi koxinzelelo olukhulu ngexesha lokubeleka.',
    s1HighlightTitle: 'Umsipha ocwangcisiweyo kodwa obalulekileyo',
    s1HighlightText:
      'I-pelvic floor ibandakanyeka kwimisebenzi emininzi yemihla ngemihla: ukubamba umchamo nesidoda, ukulawula umoya, ukuxhasa izitho zenkqayi, nokudlala indima kwimisebenzi ethile yezesondo.',

    benefitsHeading: 'Iinzuzo zokomeleza i-pelvic floor',
    benefitsIntro:
      'Ukomeleza kancinci nokwenziwa ngokuchanekileyo kunokunceda ukuphucula ulawulo nenkxaso ye-pelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Ulawulo olubhetele lesinyi',
        text: 'I-pelvic floor idlala indima ekulawuleni isinyi. Ukuyomeleza kancinci kunokunceda ukunciphisa ukuvuza komchamo okuthile.',
      },
      {
        icon: 'toilet',
        title: 'Ukuxhasa umsebenzi wamathumbu',
        text: 'Ezi misipha zinceda nokulawula umoya nesidoda kwaye zinegalelo ekuxhaseni izitho zenkqayi.',
      },
      {
        icon: 'human-female',
        title: 'Ukuxhasa izitho zenkqayi',
        text: 'I-pelvic floor yenza isiseko semisipha esinceda ukuxhasa isinyi, isizalo nesisu esincinci.',
      },
      {
        icon: 'heart-pulse',
        title: 'Ukubuyisela ukuvakalelwa kancinci',
        text: 'Uhlaziyo olufanelekileyo lunokukunceda ufumane ukuqonda nolawulo olungcono lwale ndawo.',
      },
    ],

    s2Heading: 'Kutheni ukukhulelwa nokubeleka kuyibeka phantsi koxinzelelo',
    s2Body1:
      'Ukukhulelwa kubeka uxinzelelo olungakumbi kancinci kwi-pelvic floor. Ukubeleka ngomgudu wesibeleko kunokolula ngokukhulu imisipha nemithambo kule ndawo.',
    s2Body2:
      'Ukuhlinzwa kokubeleka (cesarean) akuyikhuseli ngokupheleleyo i-pelvic floor: ukukhulelwa ngokwako kuhlala kuyixesha elibalulekileyo kwezi misipha.',
    s2Body3:
      'Emva kokubeleka, kuqhelekile ke ukuba ukuphila kuthathe ixesha. Abanye abafazi abavakalelwa kuphantse kungabikho mpawu, ngelixa abanye banokuphawula ukuvuza, imvakalelo yobunzima, okanye ukuncipha kolawulo lwemisipha.',
    s2TipTitle: 'Ukuphila ngakunye kwahlukile',
    s2TipText:
      'Uhlobo lokubeleka, ukuqhekeka okanye i-episiotomy, ubukho bobuhlungu, nemeko yakho jikelele emva kokubeleka zonke zinokuchaphazela ukuphila.',

    s3Heading: 'Xa kufuneka uqale uhlaziyo lwe-pelvic floor?',
    s3Body1:
      'Emva kokubeleka okungenamingeni, ukuncina okuthambileyo kwe-pelvic floor kudla ngokuqalwa kwakhona kancinci. Kusabalulekile ukulungelelanisa imithambo kwimeko yakho nokucela icebiso ukuba ubunengxaki, ubuhlungu obukhulu, okanye inkqubo ethile.',
    s3Body2:
      'Ukuba une-catheter yomchamo, ezinye iingcebiso zicebisa ukulinda de isuswe kwaye ukuchama okuqhelekileyo kuqale kwakhona ngaphambi kokuqala imithambo ye-perineum.',
    s3AlertTitle: 'Musa ukunyamezela ubuhlungu',
    s3AlertText:
      'Ubuhlungu obukhulu, iimpawu ezibhetyebhetyayo, inxeba eliphilayo kakubi, okanye nayiphi na inkxalabo ekhethekileyo kufuna icebiso lombelekisi, igqirha, okanye ichwephesha lohlaziyo.',

    s4Heading: 'Ukufunda ukuncina ngokuchanekileyo',
    s4Body1:
      'Ukuchonga intshukumo, cinga ngokuzama ukubamba umoya nesilumkiso sokuchama kunye. Intshukumo oyifunayo yimvakalelo yokuncina nokuphakamisa ngaphakathi.',
    s4Body2:
      'Injongo ayikukuqinisa umzimba wakho wonke. Iimpundu, amathanga nesisu kufuneka zihlale zikhululekile kangangoko, ngelixa ukuphefumla kuqhubeka ngokuqhelekileyo.',
    exercises: [
      {icon: 'weather-windy', label: 'Ukuphefumla'},
      {icon: 'human-handsup', label: 'Ukuncina okuthambileyo'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Ukuncina okude'},
      {icon: 'gesture-tap-button', label: 'Ukuncina okukhawulezileyo'},
    ],
    s4HighlightTitle: 'Ukukhululeka nako kubalulekile kakhulu',
    s4HighlightText:
      'Emva kokuncina ngakunye, vumela imisipha ikhululeke ngokupheleleyo. Uhlaziyo oluhle aluthethi ukugcina i-perineum ixinene usuku lonke.',

    s5Heading: 'Ukwakha inkqubo enyuka kancinci',
    s5Body1:
      'Ekuqaleni, eyona nto ibalulekileyo kukufunda ukuchonga imisipha nokwenza intshukumo ngokuchanekileyo. Ukuhlala uqhubeka kubaluleke ngakumbi kunamandla.',
    s5h3a: 'Ukuncina okude',
    s5Body2:
      'Ncina i-pelvic floor ngobunono, emva koko ugcine ukuncina imizuzwana embalwa ngaphandle kokubamba umoya. Emva koko khulula ngokupheleleyo ngaphambi kokuqala kwakhona.',
    s5h3b: 'Ukuncina okufutshane',
    s5Body3:
      'Xa intshukumo ifundiwe, kunokongezwa ukuncina okuncinci okukhawulezileyo. Kunceda ukuqeqesha ukukwazi kwakho ukuncina imisipha ngokukhawuleza xa uxinzelelo lwesisu lunyuka, umzekelo ngaphambi nje kokukhohlela okanye ukuthimla.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Dibanisa imithambo nesiqhelo semihla ngemihla'},
      {icon: 'human-sitting', label: 'Qala kwindawo ekhululekileyo'},
      {icon: 'weather-windy', label: 'Phefumla ngokuqhelekileyo ngexesha lokuncina'},
      {icon: 'sleep', label: 'Hlonipha amanqanaba okukhululeka'},
      {icon: 'chart-line', label: 'Khulisa ubunzima kancinci kancinci'},
      {icon: 'doctor', label: 'Cela icebiso ukuba awuqinisekanga'},
    ],
    s5TipTitle: 'Ukuhlala uqhubeka ngaphezu kwayo yonke into',
    s5TipText:
      'Ukudibanisa imithambo nesiqhelo esele sisemini yakho kunokwenza kube lula ukuhlala uqhubeka: emva kokondla, emva kokuxubha amazinyo, okanye ngelinye ixesha elikulungeleyo.',

    s6Heading: 'Iimpazamo eziqhelekileyo ekufuneka uzigcine',
    s6Body1:
      'Imithambo ye-perineum inokubonakala ilula, kodwa kulula ukuhlawulela ngeminye imisipha okanye ukunyanzela kakhulu.',
    commonMistakes: [
      'Ukuxinana kweempundu okanye amathanga endaweni ye-pelvic floor',
      'Ukubamba umoya ngexesha lokuncina',
      'Ukugcina imisipha ixinene rhoqo ngaphandle kokuyiyekela ikhululeke',
      'Ukwenza imithambo kwiintsuku ezimbalwa kuphela emva koko uyeke',
      'Ukumisa ngabom umlambo womchamo ukuhlola ukuncina',
    ],
    s6TipTitle: 'Into engafanele ukwenziwa',
    s6TipText:
      'Akucetyiswa ukwenza imithambo ngokumisa ngabom umlambo wakho womchamo. Le ndlela ayiqeqeshi i-perineum ngokuchanekileyo kwaye inokuphazamisa umsebenzi oqhelekileyo wesinyi.',

    s7Heading: 'Zeziphi iimpawu ekufuneka zikhokele ekubonaneni nogqirha?',
    s7Body1:
      'Ukuvuza okuncinane okanye imvakalelo engaqhelekanga kunokuvela ngamanye amaxesha emva kokubeleka. Noko ke, akufuneki kunganyanyezelwa ukuba kuyaqhubeka, kuyabhetyebhetye, okanye kuphazamisa ubomi bakho bemihla ngemihla.',
    warningSigns: [
      'Ukuvuza komchamo xa ukhohlela, uthimla, uhleka, okanye unyanzela',
      'Imvakalelo yobunzima okanye uxinzelelo ezantsi enkqayini',
      'Imvakalelo yokuba iqhuma okanye into ethile iyehla ukuya esithweni sobufazi',
      'Ubunzima bokubamba umoya okanye isidoda',
      'Ubuhlungu obuqhubekayo kwi-perineum',
      'Ubuhlungu ngexesha okanye emva kokwabelana ngesondo',
      'Ubunzima bokuchonga okanye bokuncina ngokuchanekileyo imisipha ye-perineum',
    ],
    consultLabel: 'Xa kufuneka ucele icebiso?',
    s7Body2:
      'Umbelekisi, igqirha, okanye i-physiotherapist ekhethekileyo kuhlaziyo lwe-pelvic floor unokuhlola umsebenzi wemisipha aphakamise inkqubo efanelekileyo.',

    s8Heading: 'Kuthekani emva kokuqhekeka, i-episiotomy, okanye ukuhlinzwa kokubeleka?',
    s8Body1:
      'Ukuqhekeka okanye i-episiotomy kufuna ukhathalelo olukhethekileyo ngexesha lokuphila. Ukuqalisa kwakhona imisebenzi kufuneka kuthathele ingqalelo ubuhlungu, imeko yesanya, nesikhokelo esinikiweyo emva kokubeleka.',
    s8Body2:
      'Emva kokuhlinzwa kokubeleka, ukuphila kubandakanya nodonga lwesisu nesanya. Nokuba ukubeleka kwakungekho ngomgudu wesibeleko, ukukhulelwa ngokwako kwabeka uxinzelelo kwi-pelvic floor.',
    s8HighlightTitle: 'Ukhathalelo olwenzelwe wena lunokunceda',
    s8HighlightText:
      'Kwimeko yokuqhekeka okukhulu, ubuhlungu, iimpawu zomchamo okanye zamathumbu, okanye ubunzima obuqhubekayo, uvavanyo nechwephesha lezempilo lunokuba luncedo kakhulu.',

    s9Heading: 'Ukubuyela kancinci kwezemidlalo',
    s9Body1:
      'Ukubuyela kwintshukumo emva kokubeleka kufuneka kube kancinci kancinci. Ukuhamba nentshukumo ethambileyo kunokuqalwa kwakhona ngokwendlela ovakalelwa ngayo, ngelixa imisebenzi enempembelelo enkulu ifuna ukuphaphama ngakumbi.',
    s9Body2:
      'Ngaphambi kokuqala kwakhona ukubaleka, ukutsiba, okanye uqeqesho olunamandla kakhulu, kungcono ukuhlola ukuphila kwe-pelvic floor uthathele ingqalelo nayiphi na iimpawu.',
    s9AlertTitle: 'Musa ukukhawulezisa amanqanaba',
    s9AlertText:
      'Ukuvuza, imvakalelo yobunzima, okanye ubuhlungu ngexesha okanye emva kokuzilolonga ziimpawu zokuba kufuneka wehlise isantya ucele icebiso ngaphambi kokwandisa amandla.',

    s10Heading: 'Xa kufuneka ubone ingcali?',
    s10Body1:
      'Uhlaziyo lwe-pelvic floor nombelekisi okanye i-physiotherapist lunokuba luncedo ukuba awuqinisekanga ukuba uyancina ngokuchanekileyo, ukuba iimpawu ziyaqhubeka, okanye ukuba ufuna ukuqalisa kwakhona imisebenzi ethile yomzimba ngokuzithemba.',
    questionCardTitle: 'Imibuzo eluncedo ekufuneka uyibuze',
    appointmentQuestions: [
      'Ngaba iimpawu zam ziyahambelana nokubuthathaka kwe-pelvic floor?',
      'Ngaba ndiyawenza ngokuchanekileyo amaxesha okuncina?',
      'Kufuneka ndiyenze kangaphi imithambo yonke imihla?',
      'Ngaba ndingabuyela ekubalekeni, kwezemidlalo, okanye kwimithambo enempembelelo enkulu?',
      'Ngaba ndifuna uhlaziyo nombelekisi okanye i-physiotherapist?',
      'Ngaba isanya sam, ukuqhekeka, okanye ukuhlinzwa kokubeleka kufuna nawaphi na amanyathelo ekhethekileyo okhuseleko?',
    ],
    s10TipTitle: 'Kulungile ukwazi',
    s10TipText:
      'Ukubona ichwephesha akuthethi ngokuzenzekelayo ukuba kukho into engalunganga. Iseshoni inokukunceda nje uhlole indlela yakho, uvavanye ukuphila kwakho, ufunde ukuqhubela phambili ngokuchanekileyo.',

    s11Heading: 'Ukuphila okuthatha ixesha',
    s11Body1:
      'Emva kokubeleka, kuqhelekile ukungabuyiseli ngoko nangoko ukuvakalelwa okufanayo okanye amandla emisipha obunawo ngaphambi kokukhulelwa.',
    s11Body2:
      'Injongo ayikukwenza ukuncina okuninzi kangangoko kunokwenzeka. Kukukubuyisela kancinci ulungelelwano oluhle phakathi kokuncina nokukhululeka, emva koko ukwazi ukusebenzisa ezi misipha ngokwemvelo kwimisebenzi yemihla ngemihla.',
    s11HighlightTitle: 'Inkqubela encinane yinkqubela yokwenene',
    s11HighlightText:
      'Ukuqonda okungcono kwentshukumo, imizuzwana embalwa eyongezelelweyo yokuncina, okanye ukunciphisa kokuvuza sele yimiqondiso enkenketha.',

    s12Heading: 'Eyona nto ibalulekileyo',
    summaryTitle: 'Eyona nto ibalulekileyo',
    summaryItems: [
      'Ukukhulelwa nokubeleka kubeka uxinzelelo olukhulu kwi-pelvic floor.',
      'Ukuphila kancinci kancinci kuqhelekile emva kokubeleka.',
      'Imithambo kufuneka ibeke phambili umgangatho wentshukumo kunamandla.',
      'Ukuphefumla nokukhululeka kubaluleke kakhulu njengokuncina.',
      'Ukuvuza komchamo, ubunzima, okanye ubuhlungu obuqhubekayo kufanele kufumane uluvo lochwephesha.',
      'Uhlaziyo nombelekisi okanye i-physiotherapist lunokukunceda ubuyisele ulawulo olungcono.',
      'Ukubuyela kwezemidlalo kufuneka kube kancinci kancinci, ngakumbi kwimisebenzi enempembelelo enkulu.',
    ],

    finalTipTitle: 'Thatha ixesha lokuphila',
    finalTipText:
      'Emva kokubeleka, umzimba wakho udlule kutshintsho oluninzi. I-perineum ifanele ingqalelo efanayo nomzimba wakho wonke: kancinci kancinci, rhoqo, nangaphandle koxinzelelo.',

    disclaimerText:
      'Eli nqaku lolwazi kuphela kwaye alithathi indawo yeengcebiso zezonyango ezenzelwe wena. Ukuba uva ubuhlungu, iimpawu eziqhubekayo, okanye unayo nayiphi na inkxalabo ngokuphila kwakho, cela icebiso kuchwephesha lezempilo.',
  },
  sn: {
    badge: 'PASI PEKUBEREKA • KUGADZIRIRWA',
    title: 'Kusimbisa pelvic floor yako\nmushure mekubereka',
    metaDuration: 'Maminitsi 8 ekuverenga',
    metaType: 'Gwara',
    metaLevel: 'Vanotanga',
    metaValidated: 'Zvakaongororwa',
    intro:
      'Mushure mekuva nepamuviri nekubereka, pelvic floor inoda nguva yekupora. Maekisesaizi akareruka, anoitwa nguva dzose uye zvishoma nezvishoma anogona kukubatsira kudzorera simba, kudzora uye chivimbo, pasina kukurumidza.',
    contentsTitle: 'Mudzidziso uyu',
    topics: [
      'Kunzwisisa basa reperineum',
      'Nei kubereka kuchiisa mutoro',
      'Painotanga kudzidziswa zvakare kwepelvic floor',
      'Kudzidza kudhonza nenzira chaiyo',
      'Kuumba hurongwa hwezvishoma nezvishoma',
      'Zvikanganiso zvekudzivirira',
      'Painofanira kukumbira rubatsiro',
      'Kudzoka zvishoma nezvishoma kumitambo',
      'Kugadzirira kuenda kuchiremba',
      'Zvinhu zvakakosha',
    ],
    shareMessage: 'Kusimbisa pelvic floor yako mushure mekubereka — AWA',

    s1Heading: 'Kunzwisisa basa reperineum',
    s1Body1:
      'Perineum, inonziwo pelvic floor, mapfupa enyama ari pasi pepelvis. Ine basa mukudzora chikvapu nematumbu uye inobatsira kutsigira nhengo dzepelvis.',
    s1Body2:
      'Panguva yepamuviri, nyama idzi dzinofanira kutakura huremu hwakawedzera kwemwedzi yakawanda. Dzinoiswawo pasi pemutoro mukuru panguva yekubereka.',
    s1HighlightTitle: 'Nyama isina ruzha asi inokosha',
    s1HighlightText:
      'Pelvic floor inobatanidzwa mumabasa mazhinji ezuva nezuva: kuramba mutsvo nemarwadzo, kudzora mhepo, kutsigira nhengo dzepelvis, uye kuva nebasa mumamwe mabasa ekuita rudo.',

    benefitsHeading: 'Zvakanakira pelvic floor yakasimba',
    benefitsIntro:
      'Kusimbisa zvishoma nezvishoma uye nenzira chaiyo kunogona kubatsira kuvandudza kudzora nekutsigira kwepelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kudzora chikvapu zvirinani',
        text: 'Pelvic floor ine basa mukudzora chikvapu. Kuisimbisa zvishoma nezvishoma kunogona kubatsira kudzikisa kuyerera kwemvura kunoitika.',
      },
      {
        icon: 'toilet',
        title: 'Kutsigira basa rematumbu',
        text: 'Nyama idzi dzinobatsirawo kudzora mhepo nemarwadzo uye dzinobatsira kutsigira nhengo dzepelvis.',
      },
      {
        icon: 'human-female',
        title: 'Kutsigira nhengo dzepelvis',
        text: 'Pelvic floor inoumba hwaro chaihwo hwenyama hunobatsira kutsigira chikvapu, chibereko nematumbu.',
      },
      {
        icon: 'heart-pulse',
        title: 'Kudzorera manzwiro zvishoma nezvishoma',
        text: 'Kudzidziswa kwakakodzera kunogona kukubatsirawo kudzorera kuziva nekudzora kwenzvimbo iyi.',
      },
    ],

    s2Heading: 'Nei pamuviri nekubereka zvichiisa mutoro',
    s2Body1:
      'Pamuviri zvishoma nezvishoma pano wedzera kumanikidza pelvic floor. Kubereka nenzira yeukadzi kunogona kuwedzera kutambanudza nyama nenzvimbo iyi zvakanyanya.',
    s2Body2:
      'Kubvarurwa (cesarean) hakuponesi pelvic floor zvachose zvakare: pamuviri pacho kuchiri nguva huru kunyama idzi.',
    s2Body3:
      'Mushure mekubereka, saka zvakajairika kuti kupora kutore nguva. Vamwe vakadzi havanzwi zviratidzo chaizvo, vamwe vanogona kuona kuyerera kwemvura, manzwiro ekurema, kana kuderera kwekudzora nyama.',
    s2TipTitle: 'Kupora kwega kwega kwakasiyana',
    s2TipText:
      'Mhando yekubereka, kubvaruka kana episiotomy, kuvapo kwemarwadzo, uye mamiriro ako ose mushure mekubereka zvinogona kukanganisa kupora.',

    s3Heading: 'Painotanga kudzidziswa zvakare kwepelvic floor?',
    s3Body1:
      'Mushure mekubereka kusina matambudziko, kudhonza zvakapfava kwepelvic floor kunogona kazhinji kuvamba zvishoma nezvishoma. Zvichiri zvakakosha kuchinjanisa maekisesaizi kuti ayenderane nemamiriro ako uye kutsvaga zano kana waona dambudziko, marwadzo makuru kana nzira yakakosha yakaitwa.',
    s3Body2:
      'Kana uine catheter yechikvapu, mamwe mazano anoratidza kumirira kusvikira yabviswa uye kuchera kwakajairika kwavamba zvakare usati watanga maekisesaizi eperineum.',
    s3AlertTitle: 'Usamanikidza kana uchirwadziwa',
    s3AlertText:
      'Marwadzo makuru, zviratidzo zviri kuipa,gwapa rinorapa zvisina kunaka, kana kunetseka kupi zvako kunoda zano kubva kumuzvarisi (midwife), chiremba kana nyanzvi yekudzidzisa zvakare.',

    s4Heading: 'Kudzidza kudhonza nenzira chaiyo',
    s4Body1:
      'Kuti uone kufamba kwacho, fungidzira kuti uri kuramba mhepo uye chido chekuchera panguva imwe chete. Kufamba kwauri kutsvaga manzwiro ekudhonza nekusimudzira mukati.',
    s4Body2:
      'Chinangwa hachisi chekushamisa muviri wese zvakasimba. Matako, mitezo uye dumbu zvinofanira kugara zvakapfava zvakanyanya, uku kufema kuchienderera zvakajairika.',
    exercises: [
      {icon: 'weather-windy', label: 'Kufema'},
      {icon: 'human-handsup', label: 'Kudhonza zvakapfava'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Kudhonza kurefu'},
      {icon: 'gesture-tap-button', label: 'Kudhonza kwakakurumidza'},
    ],
    s4HighlightTitle: 'Kuzorora kwakakoshawo zvakafanana',
    s4HighlightText:
      'Mushure mekudhonza kwega kwega, rega nyama dzizorore zvizere. Kudzidziswa zvakare kwakanaka hakurevi kuramba perineum yakadhonzwa zuva rose.',

    s5Heading: 'Kuumba hurongwa hwezvishoma nezvishoma',
    s5Body1:
      'Pakutanga, chakakosha ndechekudzidza kuziva nyama uye kuita kufamba nenzira chaiyo. Kuramba uchiita kunokosha kupfuura simba.',
    s5h3a: 'Kudhonza kurefu',
    s5Body2:
      'Dhonza pelvic floor zvakapfava, ozoramba wakadhonza kwemasekondi mashoma usingabate kufema. Ozosunungura zvizere usati wadzokorora.',
    s5h3b: 'Kudhonza kupfupi',
    s5Body3:
      'Kufamba kwacho kana kwatonyatsonzwisiswa, kudhonza kwakakurumidza kudiki kunogona kuwedzerwa. Kunobatsira kudzidzisa kugona kwako kudhonza nyama nokukurumidza kana kumanikidzwa kwedumbu kuchiwedzera, semuenzaniso pamberi pekukosora kana kutsvova.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Batanidza maekisesaizi nemararamiro ezuva nezuva'},
      {icon: 'human-sitting', label: 'Tanga uri pachinzvimbo chinorodza'},
      {icon: 'weather-windy', label: 'Fema zvakajairika panguva yekudhonza'},
      {icon: 'sleep', label: 'Tevedza nguva dzekuzorora'},
      {icon: 'chart-line', label: 'Wedzera kuoma zvishoma nezvishoma'},
      {icon: 'doctor', label: 'Bvunza zano kana usina chokwadi'},
    ],
    s5TipTitle: 'Kuramba uchiita pamusoro pezvose',
    s5TipText:
      'Kubatanidza maekisesaizi nemararamiro aripo kare muzuva rako kunogona kuita kuti zvive nyore kuramba uchiita: mushure mekupa mukaka, mushure mekubhurasha mazino, kana panguva yamwe inokunakira.',

    s6Heading: 'Zvikanganiso zvinowanzoitika zvekudzivirira',
    s6Body1:
      'Maekisesaizi eperineum anogona kuoneka akareruka, asi zviri nyore kushandisa dzimwe nyama panzvimbo kana kumanikidza zvakanyanya.',
    commonMistakes: [
      'Kusimbisa matako kana mitezo panzvimbo yepelvic floor',
      'Kubata kufema panguva yekudhonza',
      'Kuramba nyama dzakadhonzwa nguva dzose pasina kuzidzorera kuti dzizorore',
      'Kuita maekisesaizi mazuva mashoma bedzi ozomira',
      'Kumira zvakananga kuerera kwechikvapu kuti uedze kudhonza',
    ],
    s6TipTitle: 'Zvisingafaniri kuitwa',
    s6TipText:
      'Hazvikurudzirwi kuita maekisesaizi uchimira zvakananga kuerera kwechikvapu. Nzira iyi haidzidzisi perineum nenzira chaiyo uye inogona kukanganisa basa rakajairika rechikvapu.',

    s7Heading: 'Zviratidzo zvipi zvinofanira kukuita kuti uende kuchiremba?',
    s7Body1:
      'Kuyerera kudiki kwemvura kana manzwiro asina kujairika zvinogona kuoneka dzimwe nguva mushure mekubereka. Asi hazvifaniri kuregedzerwa kana zvichiramba zviripo, zvichiipa, kana zvichikanganisa hupenyu hwako hwezuva nezuva.',
    warningSigns: [
      'Kuyerera kwemvura kana uchikosora, uchitsvova, uchiseka kana uchimanikidza',
      'Manzwiro ekurema kana kumanikidzwa pasi pepelvis',
      'Manzwiro okuti chimwe chinhu chiri kudonha mukati mechibereko',
      'Kuoma kuramba mhepo kana marwadzo',
      'Marwadzo asingaperi muperineum',
      'Marwadzo panguva kana mushure mekuita rudo',
      'Kuoma kuziva kana kudhonza nenzira chaiyo nyama dzeperineum',
    ],
    consultLabel: 'Painofanira kutsvagwa zano?',
    s7Body2:
      'Muzvarisi (midwife), chiremba kana physiotherapist akadzidzira kudzidziswa zvakare kwepelvic floor anogona kuongorora basa renyama uye kukurudzira chirongwa chakakodzera.',

    s8Heading: 'Zvino mushure mekubvaruka, episiotomy kana cesarean?',
    s8Body1:
      'Kubvaruka kana episiotomy kunoda kutarisirwa zvakanyanya panguva yekupora. Kudzokera kumabasa kunofanira kuona marwadzo, mamiriro egwapa, uye mazano akapiwa mushure mekubereka.',
    s8Body2:
      'Mushure mecesarean, kupora kunobatanidza madziro edumbu negwapa. Kunyange kana kubereka kusina kuitwa nenzira yeukadzi, pamuviri pacho kwakaisa mutoro pelvic floor.',
    s8HighlightTitle: 'Kutarisirwa kwakakodzera iwe kunogona kubatsira',
    s8HighlightText:
      'Kana pane kubvaruka kukuru, marwadzo, zviratidzo zvechikvapu kana zvematumbu, kana matambudziko anoramba aripo, kuongororwa nemushandi wezvehutano kunogona kubatsira zvikuru.',

    s9Heading: 'Kudzoka zvishoma nezvishoma kumitambo',
    s9Body1:
      'Kudzoka kukufamba mushure mekubereka kunofanira kuva kwezvishoma nezvishoma. Kufamba nekufamba kwakapfava kunogona kuvamba zvakajairika zvichienderana nemanzwiro ako, asi mabasa anorova zvakasimba anoda kungwarira kwakawanda.',
    s9Body2:
      'Usati wavamba kumhanya, kusvetuka kana kudzidziswa kwakanyanya, zviri nani kuongorora kupora kwepelvic floor uye kucherechedza zviratidzo zvipi zvazvo.',
    s9AlertTitle: 'Usakurumidze nhanho',
    s9AlertText:
      'Kuyerera kwemvura, manzwiro ekurema kana marwadzo panguva kana mushure mekuita ekisesaizi zviratidzo zvekuti unofanira kuderedza uye kutsvaga zano usati wawedzera simba.',

    s10Heading: 'Painofanira kuona nyanzvi?',
    s10Body1:
      'Kudzidziswa zvakare kwepelvic floor nemuzvarisi (midwife) kana physiotherapist kunogona kubatsira kana usina chokwadi kuti uri kudhonza nenzira chaiyo, kana zviratidzo zvichiramba zviripo, kana uchida kudzokera kune mamwe mabasa emuviri une chivimbo.',
    questionCardTitle: 'Mibvunzo inobatsira kubvunza',
    appointmentQuestions: [
      'Zviratidzo zvangu zvinofambirana here nekushaya simba kwepelvic floor?',
      'Ndiri kudhonza nenzira chaiyo here?',
      'Ndinofanira kuita kangani zuva rega rega?',
      'Ndingadzokera kukumhanya, mitambo kana ekisesaizi inorova zvakasimba here?',
      'Ndinoda kudzidziswa zvakare nemuzvarisi (midwife) kana physiotherapist here?',
      'Gwapa rangu, kubvaruka kana cesarean zvinoda kungwarira kwakakosha here?',
    ],
    s10TipTitle: 'Zvakanaka kuziva',
    s10TipText:
      'Kuona nyanzvi hakurevi pachena kuti pane chisiri kunaka. Musangano mumwe chete unogona kubatsira kuongorora maitiro ako, kuongorora kupora kwako, uye kudzidza kufambira mberi nenzira chaiyo.',

    s11Heading: 'Kupora kunotora nguva',
    s11Body1:
      'Mushure mekubereka, zvakajairika kusadzoka pakarepo kumanzwiro kana simba renyama raiva naro usati wava nepamuviri.',
    s11Body2:
      'Chinangwa hachisi chekuita kudhonza kwakawanda sezvinobvira. Kunyanya ndechekudzorera zvishoma nezvishoma kubatana kwakanaka pakati pekudhonza nekuzorora, uye kugona kushandisa nyama idzi zvakasikwa mumabasa ezuva nezuva.',
    s11HighlightTitle: 'Budiriro diki ibudiriro chaiyo',
    s11HighlightText:
      'Kuziva kufamba zvirinani, masekondi mashoma ekudhonza akawedzera, kana kudzikira kwekuyerera kwemvura zvatova zviratidzo zvinoita mwoyo wakasimba.',

    s12Heading: 'Zvinhu zvakakosha',
    summaryTitle: 'Zvakakosha',
    summaryItems: [
      'Pamuviri nekubereka zvinoisa mutoro mukuru pelvic floor.',
      'Kupora zvishoma nezvishoma kwakajairika mushure mekubereka.',
      'Maekisesaizi anofanira kuisa kunaka kwekufamba pamberi pesimba.',
      'Kufema nekuzorora zvakakoshawo zvakafanana nekudhonza.',
      'Kuyerera kwemvura, kurema kana marwadzo asingaperi zvinofanira kuonekwa nenyanzvi.',
      'Kudzidziswa zvakare nemuzvarisi (midwife) kana physiotherapist kunogona kukubatsira kudzorera kudzora kwakanaka.',
      'Kudzokera kumitambo kunofanira kuva kwezvishoma nezvishoma, kunyanya mabasa anorova zvakasimba.',
    ],

    finalTipTitle: 'Tora nguva yekupora',
    finalTipText:
      'Mushure mekubereka, muviri wako wakapfuura mushanduko dzakawanda. Perineum inofanira kutarisirwa sezvakaita muviri wese: zvishoma nezvishoma, nguva dzose, pasina kumanikidzwa.',

    disclaimerText:
      'Nyaya iyi ndeyeruzivo bedzi uye haitsiviri zano rekurapa rakakodzera iwe. Kana uchirwadziwa, uine zviratidzo zvinoramba zviripo, kana uine kunetseka kupi zvako pamusoro pekupora kwako, tsvaga zano kubva kumushandi wezvehutano.',
  },
  ln: {
    badge: 'NSIMA YA KOBOTA • KOBIKA',
    title: 'Kolendisa misisa ya libumu ya nse\nnsima ya kobota',
    metaDuration: 'Mwa mokapo ya kotánga: 8 min',
    metaType: 'Mokanda ya litambwisi',
    metaLevel: 'Mobandi',
    metaValidated: 'Maloba etalelami',
    intro:
      'Nsima ya zemi mpe kobota, misisa ya libumu ya nse esengi ntango mpo na kobika. Misala ya pɛtɛɛ, ya ntango nyonso mpe ya mayɔkɔ ekoki kosalisa yo kozwa lisusu makasi, bokonzi mpe elikya, kozanga kosala noki.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Koyeba mosala ya périnée',
      'Mpo na nini kobota esalaka yango ezwa mpasi',
      'Ntango ya kobanda kobongisa misisa ya libumu ya nse',
      'Koyekola kokanga malamu',
      'Kotia mosala ya mayɔkɔ',
      'Mabunga oyo esengeli koboya',
      'Ntango ya kosenga lisalisi',
      'Kozonga na masano ya nzoto mayɔkɔ',
      'Kobongisa rendez-vous',
      'Makambo ya ntina',
    ],
    shareMessage: 'Kolendisa misisa ya libumu ya nse nsima ya kobota — AWA',

    s1Heading: 'Koyeba mosala ya périnée',
    s1Body1:
      'Périnée, oyo babengaka mpe misisa ya libumu ya nse, ezali liboke ya misisa oyo ezali na nse ya libumu. Esalaka mosala na kokanga mai ya nzoto mpe bipɔtɔ, mpe esalisaka kosimba binkoko ya libumu.',
    s1Body2:
      'Na ntango ya zemi, misisa oyo esengeli komema bozito mosusu sanza mingi. Ebwakamaka mpe na mpasi mingi na ntango ya kobota.',
    s1HighlightTitle: 'Misisa moke kasi ya ntina',
    s1HighlightText:
      'Misisa ya libumu ya nse ezali na mosala na makambo mingi ya mokolo na mokolo: kokanga mai ya nzoto mpe bipɔtɔ, kokanga mopɛpɛ, kosimba binkoko ya libumu, mpe kozala na mosala na makambo mosusu ya bolingo.',

    benefitsHeading: 'Litomba ya misisa ya libumu ya nse oyo ezali makasi',
    benefitsIntro:
      'Kolendisa yango mayɔkɔ mpe malamu ekoki kosalisa bokonzi mpe lisungi ya misisa ya libumu ya nse.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bokonzi ya malamu ya mai ya nzoto',
        text: 'Misisa ya libumu ya nse ezali na mosala na bokonzi ya mai ya nzoto. Kolendisa yango mayɔkɔ ekoki kosalisa kokitisa mai oyo ebimaka na mbala mosusu.',
      },
      {
        icon: 'toilet',
        title: 'Kosunga mosala ya libumu ya nse',
        text: 'Misisa oyo esalisaka mpe kokanga mopɛpɛ mpe bipɔtɔ mpe ekotisaka mpe na kosimba binkoko ya libumu.',
      },
      {
        icon: 'human-female',
        title: 'Kosimba binkoko ya libumu',
        text: 'Misisa ya libumu ya nse ezali lokola moboko ya misisa oyo esalisaka kosimba vési, libumu mpe ana.',
      },
      {
        icon: 'heart-pulse',
        title: 'Kozwa lisusu mayɔkɔ makoki ya koyoka',
        text: 'Kobongisa oyo ebongi ekoki mpe kosalisa yo koyeba mpe kokonza malamu esika oyo.',
      },
    ],

    s2Heading: 'Mpo na nini zemi mpe kobota esalaka yango ezwa mpasi',
    s2Body1:
      'Zemi etiaka mayɔkɔ mpiko mingi na misisa ya libumu ya nse. Kobota na nzela ya mokɛlɛ ekoki bongo kolendisa misisa mpe nzoto ya esika oyo mingi.',
    s2Body2:
      'Kobota na nzela ya kokata libumu ebatelaka te mpenza misisa ya libumu ya nse: zemi yango moko ezali ntango ya ntina mpo na misisa oyo.',
    s2Body3:
      'Nsima ya kobota, ezali bongo malamu ete kobika ezwa ntango. Basi mosusu bayokaka mpasi moko te, basi mosusu bakoki komona mai ebimaka, komiyoka bozito, to bokonzi ya misisa ekiti.',
    s2TipTitle: 'Kobika ya moto na moto ekeseni',
    s2TipText:
      'Ndenge ya kobota, kokatama to episiotomi, mpasi, mpe ndenge nzoto na yo ezali nsima ya kobota ekoki nyonso kosala likama na kobika.',

    s3Heading: 'Ntango nini kobanda kobongisa misisa ya libumu ya nse?',
    s3Body1:
      'Nsima ya kobota oyo ezangaki mikakatano, kokanga misisa ya libumu ya nse mayɔkɔ ekoki mbala mingi kozonga mayɔkɔ. Ezali ntina kobongisa misala na makambo na yo mpe kosenga toli soki ozalaki na mikakatano, mpasi makasi, to mosala ya monganga ya ndenge mosusu.',
    s3Body2:
      'Soki ozali na tube ya mai ya nzoto, toli mosusu elobi ete ozela tube ebimisama mpe kolula mai ya nzoto ezonga malamu liboso ya kobanda misala ya périnée.',
    s3AlertTitle: 'Kopusa na mpasi te',
    s3AlertText:
      'Mpasi makasi, bilembo oyo ezali kokóma mabe, mpota oyo ezali kobika malamu te, to likanisi nyonso ya ndenge mosusu esengi toli ya mobotisi, ya monganga to ya mosali ya kobongisa.',

    s4Heading: 'Koyekola kokanga malamu',
    s4Body1:
      'Mpo na koyeba mouvement, kanisa ete ozali kokanga mopɛpɛ mpe mposa ya kolula mai ya nzoto na ntango moko. Mouvement oyo ozali koluka ezali komiyoka ete ozali kokanga mpe kotombola na kati.',
    s4Body2:
      'Mokano ezali kokanga nzoto mobimba makasi te. Ntolo, mabɔlɔ mpe libumu esengeli kotikala pɛtɛɛ lokola ekoki, wana mpema ezali kokoba na ndenge ya kawaida.',
    exercises: [
      {icon: 'weather-windy', label: 'Kopema'},
      {icon: 'human-handsup', label: 'Kokanga mayɔkɔ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Kokanga molai'},
      {icon: 'gesture-tap-button', label: 'Kokanga noki noki'},
    ],
    s4HighlightTitle: 'Kopema malamu ezali na ntina lokola',
    s4HighlightText:
      'Nsima ya kokanga nyonso, tika misisa epema mpenza. Kobongisa malamu elakisi te kokanga périnée mokolo mobimba.',

    s5Heading: 'Kotia mosala ya mayɔkɔ',
    s5Body1:
      'Na ebandeli, eloko ya ntina mingi ezali koyekola koyeba misisa mpe kosala mouvement malamu. Kosala ntango nyonso eleki makasi.',
    s5h3a: 'Kokanga molai',
    s5Body2:
      'Kanga mayɔkɔ misisa ya libumu ya nse, sima sala ete ekoba bongo mwa bisika ya sekonde kozanga kokanga mpema. Sima tika yango mpenza liboso ya kobanda lisusu.',
    s5h3b: 'Kokanga mokuse',
    s5Body3:
      'Ntango ozali koyeba mouvement, okoki kobakisa kokanga mokuse mpe noki. Esalisaka misisa ekoka kokanga noki ntango mpiko ya libumu ekoli, ndakisa liboso ya kokohola to kopɛsɛ.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Kolanda misala oyo na momeseno ya mokolo na mokolo'},
      {icon: 'human-sitting', label: 'Banda na ndenge ya kofanda ya malamu'},
      {icon: 'weather-windy', label: 'Pema ndenge ya kawaida ntango ozali kokanga'},
      {icon: 'sleep', label: 'Bátela ntango ya kopema'},
      {icon: 'chart-line', label: 'Bakisa mpasi mayɔkɔ'},
      {icon: 'doctor', label: 'Senga toli soki oyebi te'},
    ],
    s5TipTitle: 'Kosala ntango nyonso liboso ya nyonso',
    s5TipText:
      'Kolanda misala oyo na momeseno oyo ezali na mokolo na yo ekoki kosalisa yo kokoba: nsima ya kopesa mwana mabɛle, nsima ya kosukola minyo, to na ntango mosusu oyo ebongi na yo.',

    s6Heading: 'Mabunga oyo esengeli koboya',
    s6Body1:
      'Misala ya périnée ekoki komonana pɛtɛɛ, kasi ezali pɛtɛɛ kosalela misisa mosusu to kopusa makasi mingi.',
    commonMistakes: [
      'Kokanga ntolo to mabɔlɔ na esika ya misisa ya libumu ya nse',
      'Kokanga mpema ntango ozali kokanga',
      'Kokanga misisa ntango nyonso kozanga kotika epema',
      'Kosala misala kaka mikolo moke sima kotika',
      'Kokanga mai ya nzoto na mokano mpo na kotala kokanga',
    ],
    s6TipTitle: 'Oyo esengeli kosala te',
    s6TipText:
      'Ebongi te kosala misala na kokanga mai ya nzoto na mokano. Nzela oyo ekolendisa périnée malamu te mpe ekoki kobebisa mosala ya malamu ya vési.',

    s7Heading: 'Bilembo nini esengeli kopesa ntina ya kokende epai ya monganga?',
    s7Body1:
      'Mai moke oyo ebimaka to ndenge ya ndenge mosusu ekoki mbala mosusu kobima nsima ya kobota. Kasi esengeli te kotika yango soki ekoki kokoba, kokóma mabe, to kopesa yo mikakatano na bomoi na yo ya mokolo na mokolo.',
    warningSigns: [
      'Mai ya nzoto oyo ebimaka ntango ozali kokohola, kopɛsɛ, koseka to kopusa',
      'Komiyoka bozito to mpiko na nse ya libumu',
      'Komiyoka lokola eloko ezali kokita na kati ya libumu ya mwasi',
      'Mpasi ya kokanga mopɛpɛ to bipɔtɔ',
      'Mpasi oyo ekendaka te na périnée',
      'Mpasi ntango to nsima ya bolingo',
      'Mpasi ya koyeba to kokanga malamu misisa ya périnée',
    ],
    consultLabel: 'Ntango nini osengeli kosenga toli?',
    s7Body2:
      'Mobotisi, monganga to mosali ya kobongisa nzoto oyo ayebi mosala ya misisa ya libumu ya nse akoki kotala ndenge misisa esalaka mpe kopesa programe oyo ebongi.',

    s8Heading: 'Mpe nsima ya kokatama, episiotomi to kokata libumu?',
    s8Body1:
      'Kokatama to episiotomi esengi bokebi na ntango ya kobika. Kozonga na misala esengeli kotalela mpasi, ndenge elembo ya mpota ezali, mpe toli oyo epesamaki nsima ya kobota.',
    s8Body2:
      'Nsima ya kokata libumu, kobika etali mpe mosuni ya libumu mpe elembo ya mpota. Ata kobota ezalaki na nzela ya mokɛlɛ te, zemi yango moko etiaki mpe mpiko na misisa ya libumu ya nse.',
    s8HighlightTitle: 'Bokebi oyo ebongi na yo ekoki kosalisa',
    s8HighlightText:
      'Soki kokatama ezalaki makasi, na mpasi, na bilembo ya mai ya nzoto to ya libumu, to na mikakatano oyo ekoki kokoba, kotalelama na mosali ya mayele ekoki kosalisa mingi.',

    s9Heading: 'Kozonga na masano ya nzoto mayɔkɔ',
    s9Body1:
      'Kozonga na mouvement nsima ya kobota esengeli kozala mayɔkɔ. Kotambola mpe mouvement ya pɛtɛɛ ekoki mbala mingi kozonga kolanda ndenge omiyoki, kasi misala ya makasi esengi bokebi mingi.',
    s9Body2:
      'Liboso ya kozonga na kopota mbango, kopumbwa to komata na nzoto makasi mingi, ezali malamu kotalela ndenge misisa ya libumu ya nse ebiki mpe kotalela bilembo nyonso.',
    s9AlertTitle: 'Kosala noki te na bikalo',
    s9AlertText:
      'Mai oyo ebimaka, komiyoka bozito, to mpasi ntango to nsima ya misala ya nzoto elakisi ete osengeli kokita noki mpe kosenga toli liboso ya kobakisa makasi.',

    s10Heading: 'Ntango nini kokende epai ya mosali ya mayele?',
    s10Body1:
      'Kobongisa misisa ya libumu ya nse epai ya mobotisi to ya mosali ya kobongisa nzoto ekoki kosalisa soki oyebi te soki ozali kokanga malamu, soki bilembo na yo ezali kokoba, to soki olingi kozonga na misala mosusu ya nzoto na elikya.',
    questionCardTitle: 'Mituna ya malamu ya kotuna',
    appointmentQuestions: [
      'Bilembo na ngai ekokani na bolembu ya misisa ya libumu ya nse?',
      'Nazali kokanga malamu?',
      'Nasengeli kosala mbala boni na mokolo?',
      'Nakoki kozonga na kopota mbango, masano ya nzoto to misala ya makasi?',
      'Nasengeli kobongisa misisa epai ya mobotisi to ya mosali ya kobongisa nzoto?',
      'Elembo ya mpota na ngai, kokatama, to kokata libumu esengi bokebi ya ndenge mosusu?',
    ],
    s10TipTitle: 'Eloko ya malamu koyeba',
    s10TipText:
      'Kokende epai ya mosali ya mayele elakisi ntango nyonso te ete eloko ezali malamu te. Lisanga moko ekoki kaka kosalisa kotala ndenge ozali kosala, kotala kobika na yo, mpe koyekola kokende liboso malamu.',

    s11Heading: 'Kobika oyo ezwaka ntango',
    s11Body1:
      'Nsima ya kobota, ezali kaka ya kawaida te kozwa mbala moko makoki ya koyoka to makasi ya misisa oyo ozalaki na yango liboso ya zemi.',
    s11Body2:
      'Mokano ezali kosala kokanga mingi lokola ekoki te. Ezali koleka mpo na kozwa lisusu mayɔkɔ boyokani malamu kati na kokanga mpe kopema, sima kokoka kosalela misisa oyo ndenge ya kawaida na misala ya mokolo na mokolo.',
    s11HighlightTitle: 'Bokɛngi moke ezali bokɛngi ya solo',
    s11HighlightText:
      'Koyeba malamu mouvement, mwa bisika ya sekonde ya kobakisa na kokanga, to kokita ya mai oyo ebimaka ezali bilembo ya elikya.',

    s12Heading: 'Makambo ya ntina',
    summaryTitle: 'Oyo ya ntina',
    summaryItems: [
      'Zemi mpe kobota etiaka mpiko mingi na misisa ya libumu ya nse.',
      'Kobika mayɔkɔ nsima ya kobota ezali ya kawaida.',
      'Misala esengeli kopesa ntina na kosala malamu koleka makasi.',
      'Kopema mpe kopema malamu ezali na ntina lokola kokanga.',
      'Mai oyo ebimaka, komiyoka bozito, to mpasi oyo ekendaka te esengi likanisi ya mosali ya mayele.',
      'Kobongisa elongo na mobotisi to mosali ya kobongisa nzoto ekoki kosalisa yo kozwa lisusu bokonzi malamu.',
      'Kozonga na masano ya nzoto esengeli kozala mayɔkɔ, mingi mingi na misala ya makasi.',
    ],

    finalTipTitle: 'Zwa ntango ya kobika',
    finalTipText:
      'Nsima ya kobota, nzoto na yo eleki na bobongwani mingi. Périnée ebongi na bokebi lokola nzoto mosusu: mayɔkɔ, ntango nyonso mpe kozanga mpiko.',

    disclaimerText:
      'Lisolo oyo ezali mpo na koyebisa kaka mpe ekoki te kozwa esika ya toli ya monganga oyo ebongi na yo moko. Soki ozali na mpasi, na bilembo oyo ekendaka te, to na mitungisi na ntina ya kobika na yo, senga toli epai ya mosali ya mayele.',
  },
  ff: {
    badge: 'CAGGAL DANYUGO • HOSUGO',
    title: 'Tiiɗnugo perineum maaɗa\ncaggal danyugo',
    metaDuration: 'Janngugo 8 miniti',
    metaType: 'Ɗerewol',
    metaLevel: 'Fuɗɗoode',
    metaValidated: 'Ko ƴetti ndaarol',
    intro:
      'Caggal reedu e danyugo, perineum ngaɗan wakkati ngam hosugo. Fiilaaji ɗi ngonnda ɓolliiɗi, ɗi ngaɗetee wakkati kala, seɗɗa seɗɗa, ɗum waawi wallugo ma heɓugo semmbe, hakkilo e hoolaare, salaa nanndi ko tawa.',
    contentsTitle: 'Nder ɗerewol ndin',
    topics: [
      'Faamugo kuugal perineum',
      'Ngam ɗume danyugo ɗum tiiɗnata',
      'Wakkati ngam fuɗɗugo hosugo perineum',
      'Janngugo tiiɗnugo no haanani',
      'Fuɗɗugo kuugal seɗɗa seɗɗa',
      'Fahin-fahin ɗin ngalaa',
      'Wakkati ngam ƴamugo walleende',
      'Hoɗugo siporu seɗɗa seɗɗa',
      'Haɗugo ngam yahugo ndaarugo doktoor',
      'Ko ɓuri laaɓtugo',
    ],
    shareMessage: 'Tiiɗnugo perineum maaɗa caggal danyugo — AWA',

    s1Heading: 'Faamugo kuugal perineum',
    s1Body1:
      'Perineum, ɗum ngoni kadi pelvic floor, ko ɗum ko ɓoggol nder cakkol hakkunde. Ɗum huwa ko haɗugo ndiyam ɗam e njaayeendu e wallugo ko hakkunde cakkol ɗin.',
    s1Body2:
      'Nder reedu, ɓoggol ɗin ngaɗan ko ɓeydaaɗum nder lebbi ɗuuɗɗi. Ɗum tiiɗnaa kadi no feewi saa danyugo.',
    s1HighlightTitle: 'Ɓoggol ɓoyɗo kono ɗum ɓuri nafugo',
    s1HighlightText:
      'Pelvic floor huwa nder kuuɗe ñalnde kala ɗuuɗɗe: haɗugo ndiyam ɗam e ñaawaaru, sarugo gaaz, wallugo ko hakkunde cakkol, e huwugo nder kuuɗe cuudi goɗɗe.',

    benefitsHeading: 'Ko tiiɗnugo pelvic floor nafata',
    benefitsIntro:
      'Tiiɗnugo seɗɗa seɗɗa, ngaɗaaɗum no haanani, waawi wallugo ɓeydugo hakkilo e wallugo pelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Hakkilo ɓuri dow ñaawaaru',
        text: 'Pelvic floor huwa nder haɗugo ñaawaaru. Tiiɗnugo ɗum seɗɗa seɗɗa waawi wallugo ɓoggol nyaamdu ñaawaaru.',
      },
      {
        icon: 'toilet',
        title: 'Wallugo kuugal ñaamdu',
        text: 'Ɓoggol ɗin kadi mbaawi wallugo haɗugo gaaz e ñaawaaru e wallugo ko hakkunde cakkol.',
      },
      {
        icon: 'human-female',
        title: 'Wallugo ko hakkunde cakkol',
        text: 'Pelvic floor ko ɓoggol dow ɗum wallata ñaawaaru, reedu e njaayeendu.',
      },
      {
        icon: 'heart-pulse',
        title: 'Heɓugo hakkilo seɗɗa seɗɗa',
        text: 'Hosugo no haanani waawi kadi wallugo ma heɓugo anndal e hakkilo dow nokku ɗu.',
      },
    ],

    s2Heading: 'Ngam ɗume reedu e danyugo ɗum tiiɗnata',
    s2Body1:
      'Reedu ɓeydan ko tiiɗi dow pelvic floor seɗɗa seɗɗa. Danyugo saa gooto waawi ɗaɗɗugo ɓoggol e ko hakkunde nokku ɗu no feewi.',
    s2Body2:
      'Operasion cesarean hoosaay pelvic floor kollaa: reedu e hoore mum ɗum wakkati mawndi ngam ɓoggol ɗin.',
    s2Body3:
      'Caggal danyugo, ɗum ko nanndi hosugo ɗaɓɓana wakkati. Woɗɓe e rewɓe nanataa alamaaji feere-feere, woɗɓe nanaa ñaawaaru yaajata, hoyre, walla hakkilo ɓoggol sakitii.',
    s2TipTitle: 'Hosugo kala ko feere',
    s2TipText:
      'Danyugo no wayri, wuccugo walla episiotomy, naange muusi, e no ɓernde maaɗa woni caggal danyugo ɗum waawi sellude hosugo.',

    s3Heading: 'Naa wakkati ngam fuɗɗugo hosugo pelvic floor?',
    s3Body1:
      'Caggal danyugo no yiɗi, tiiɗnugo pelvic floor ɗum ɓolliiɗum waawi jokkitaade seɗɗa seɗɗa. Ɗum ɓuri nafugo wayyingo fiilaaji ɗin no wayri e ko tawi ma, e ƴamugo muuyugo si heɓi caɗeele, muusi mawndi, walla kuugal feere.',
    s3Body2:
      'Si tawi ma hodorde ñaawaaru, wasiyaaji goɗɗi mbi\'i ɗum ɓuri jooɗaago haa ɗum ƴetteeɗum e ñaawaaru jokkitii no wayri adan fuɗɗugo fiilaaji perineum.',
    s3AlertTitle: 'Ndaa ɗum muusi',
    s3AlertText:
      'Muusi mawndi, alamaaji ɗum ɗaɗɗi, ciɗɗa ɗum hosaay no haanani, walla hoyre feere kala yiɗi muuyugo e sage-femme, doktoor, walla goɗɗo anndiiɗo hosugo.',

    s4Heading: 'Janngugo tiiɗnugo no haanani',
    s4Body1:
      'Ngam anndugo wayyingo ɗum, miijo ma ɗum haɗa gaaz e yiɗde ñaawaaru saa gooto. Wayyingo ndu ɗaɓɓitaa ko tiiɗnugo e yaadugo dow nder.',
    s4Body2:
      'Ko yiɗaa ko tiiɗnugo ɓernde ma fuu tiiɗi. Ɓoggol, cuuɗi e reedu ngaɗaa hoosaaki no feewi, fahin hakkilo yaha no wayri.',
    exercises: [
      {icon: 'weather-windy', label: 'Heftugo hakkilo'},
      {icon: 'human-handsup', label: 'Tiiɗnugo ɓolliiɗum'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Tiiɗnugo ɗuuɗum'},
      {icon: 'gesture-tap-button', label: 'Tiiɗnugo wuurnooɗum'},
    ],
    s4HighlightTitle: 'Hoosugo ɗum ɓuri nafugo no maaɗum',
    s4HighlightText:
      'Caggal tiiɗnugo kala, acc ɓoggol ɗin hoosoo fuu. Hosugo no haanani hollataa tiiɗnugo perineum ñalnde fuu.',

    s5Heading: 'Fuɗɗugo kuugal seɗɗa seɗɗa',
    s5Body1:
      'Fuɗɗoode, ko ɓuri nafugo ko janngugo anndugo ɓoggol ɗin e ngaɗugo wayyingo no haanani. Wakkati kala ɓuri semmbe.',
    s5h3a: 'Tiiɗnugo ɗuuɗum',
    s5Body2:
      'Tiiɗnu pelvic floor ɓolliiɗum, boɗɗum jokku seɗɗa sekondi salaa tiiɗnugo hakkilo. Caggal ɗuum acc ɗum hoosoo fuu adan fuɗɗitugo.',
    s5h3b: 'Tiiɗnugo wuurnooɗum',
    s5Body3:
      'So wayyingo ɗu anndaama, tiiɗnugo wuurnooɗum ɓolliiɗum waawi ɓeydugo. Ɗum wallan ma tiiɗnugo ɓoggol ɗin sahaa, so tiiɗnugo reedu ɓeydi, no wayi saa ma ngaɗi tuusi walla tuusi.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Jokkir fiilaaji ɗin e ko ngaɗata ñalnde kala'},
      {icon: 'human-sitting', label: 'Fuɗɗu e nokku ɗum sellina'},
      {icon: 'weather-windy', label: 'Heftu no wayri saa tiiɗnugo'},
      {icon: 'sleep', label: 'Wasiyaaji hoosugo'},
      {icon: 'chart-line', label: 'Ɓeydu fiilaaji ɗin seɗɗa seɗɗa'},
      {icon: 'doctor', label: 'Ƴami muuyugo si anndaa'},
    ],
    s5TipTitle: 'Wakkati kala ɗum ɓuri',
    s5TipText:
      'Jokkirgo fiilaaji ɗin e ko ngaɗata ñalnde kala waawi wallugo ma jokkugo: caggal hunnugo ɓiɗɗo, caggal ɓaɗgo ɗaɗi, walla saa feere ɗum sellina ma.',

    s6Heading: 'Fahin-fahin ɗi ngaɗetaaɗum',
    s6Body1:
      'Fiilaaji perineum ndaaretee ɓolliiɗi, kono ɗum yoɗɗa ngaɗugo ɗum e ɓoggol goɗɗi walla tiiɗnugo ɗum ɓurngal.',
    commonMistakes: [
      'Tiiɗnugo cuuɗi walla cuuɗi dow ɓoggol pelvic floor',
      'Boɗɗugo hakkilo saa tiiɗnugo',
      'Jokkugo tiiɗnugo ɓoggol ɗin salaa acce ɗum hoosoo',
      'Ngaɗugo fiilaaji ɗin ñalɗi seɗɗa tan e ndeen accugo',
      'Haɗugo ndiyam ɗam ngam ndaarugo tiiɗnugo',
    ],
    s6TipTitle: 'Ko ɗum ngaɗetaako',
    s6TipText:
      'Ɗum wasiyaaka ngaɗugo fiilaaji ɗin e haɗugo ndiyam ɗam. Ɗum ruttitan perineum no haanani, ɗum waawi bonnugo kuugal ñaawaaru.',

    s7Heading: 'Alamaaji ɗume ɗi ngaɗata ndaarugo doktoor?',
    s7Body1:
      'Ndiyam seɗɗa ɗam yaaɗi walla nanugo feere waawi feƴƴude caggal danyugo. Kono ɗum fotaa accugo si ɗum jokkoti, ɗum ɓeydi, walla ɗum haɗi ma ngaɗugo kuuɗe ñalnde kala.',
    warningSigns: [
      'Ndiyam ɗam yaaɗi saa ma hoyri, ma sanyi, ma ɓoosi, walla ma tiiɗnini',
      'Hakkilo ɓoggol sakitii walla tiiɗɗam dow cakkol',
      'Hakkilo ko ɓoggol walla ko goɗɗum jaɓɓi nder njaayeendu',
      'Caɗeele haɗugo gaaz walla ɓoosi',
      'Muusi jokkotooɗum nder perineum',
      'Muusi saa walla caggal jokkugo e gorko',
      'Caɗeele anndugo walla tiiɗnugo no haanani ɓoggol perineum',
    ],
    consultLabel: 'Saa ngoye ma ƴami muuyugo?',
    s7Body2:
      'Sage-femme, doktoor, walla goɗɗo anndiiɗo hosugo pelvic floor waawi ndaarugo kuugal ɓoggol ɗin e hollugo ma laawol hanaani.',

    s8Heading: 'E caggal wuccugo, episiotomy, walla operasion cesarean?',
    s8Body1:
      'Wuccugo walla episiotomy ɗaɓɓan reentugo hanaande saa hosugo. Jokkitugo kuuɗe ɗum ndaara muusi, no naange woni, e muuyugo ɗum hokkaa caggal danyugo.',
    s8Body2:
      'Caggal operasion cesarean, hosugo ɗum sellina kadi reedu e naange. Hay so danyugo naa e njaayeendu, reedu e hoore mum ɗum tiiɗnini pelvic floor.',
    s8HighlightTitle: 'Reentugo wallitiiɗum e maaɗa waawi wallugo',
    s8HighlightText:
      'Si wuccugo mawndi, muusi, alamaaji ñaawaaru walla ɓoosi, walla caɗeele jokkotooɗe, ndaarugo e doktoor ɗum waawi wallugo no feewi.',

    s9Heading: 'Hoɗugo siporu seɗɗa seɗɗa',
    s9Body1:
      'Jokkitugo yahugo caggal danyugo ɗum ko seɗɗa seɗɗa. Yahugo e yaadugo ɓolliiɗum waawi jokkitaade no ɗum nanii ma, kono kuuɗe tiiɗɗe ɗaɓɓi hakkilo ɓurngal.',
    s9Body2:
      'Adan jokkitugo ruttugo, mbuuɗugo, walla fiilaaji tiiɗɗi no feewi, ɗum ɓuri ndaarugo hosugo pelvic floor e ndaarugo alamaaji ɗin.',
    s9AlertTitle: 'Taa yaaɗu laabi ɗin',
    s9AlertText:
      'Ndiyam ɗam yaaɗi, tiiɗɗam, walla muusi saa walla caggal fiilaaji ɗum alamaaji ɗi ngaɗata ma ɗum nuunɗa hakkilo e ƴamugo muuyugo adan ɓeydugo semmbe.',

    s10Heading: 'Saa ngoye ma yaha ndaarugo goɗɗo anndiiɗo?',
    s10Body1:
      'Hosugo pelvic floor e sage-femme walla goɗɗo anndiiɗo waawi wallugo si anndaa ma tiiɗnata no haanani, si alamaaji ɗin mooftaay, walla si yiɗi ma jokkitugo kuuɗe ɓoggol e hoolaare.',
    questionCardTitle: 'Ƴami ɗi nafata',
    appointmentQuestions: [
      'Alamaaji am ɗin kawri e ɓoggol pelvic floor ɓoyɗo?',
      'Mi tiiɗnan no haanani?',
      'Laabi ngooye mi ngaɗan ñalnde kala?',
      'Mi waawi ruttitugo ruttugo, siporu, walla fiilaaji tiiɗɗi?',
      'Mi ɗaɓɓi hosugo e sage-femme walla goɗɗo anndiiɗo?',
      'Naange am, wuccugo, walla operasion cesarean am ɗaɓɓi reentugo feere?',
    ],
    s10TipTitle: 'Ko mari njoɓdi',
    s10TipText:
      'Yahugo ndaarugo goɗɗo anndiiɗo hollataa kala ko woni. Sahaa gooto waawi wallugo ndaarugo no ngaɗataa, ndaarugo hosugo maaɗa, e janngugo yahugo yeeso no haanani.',

    s11Heading: 'Hosugo ɗum ɗaɓɓi wakkati',
    s11Body1:
      'Caggal danyugo, ɗum ko nanndi accugo heɓugo gaɗa e semmbe ɓoggol no heɓataa ɗum adan reedu saa gooto.',
    s11Body2:
      'Ko yiɗaa ko ngaɗugo tiiɗnugo ɓurngo. Ɗum ko ɓuri heɓugo seɗɗa seɗɗa hakkilo no haanani hakkunde tiiɗnugo e hoosugo, e huwugo e ɓoggol ɗin ñalnde kala.',
    s11HighlightTitle: 'Ɓeydaare seɗɗa ɗum ɓeydaare yaadu',
    s11HighlightText:
      'Anndugo wayyingo ɗu ɓuri, sekondi seɗɗa ɓeydaaɗum nder tiiɗnugo, walla ndiyam ɗam yaaɗata seɗɗa ɗum alamaaji laaɓtooɗi.',

    s12Heading: 'Ko ɓuri laaɓtugo',
    summaryTitle: 'Ko ɓuri hoosugo',
    summaryItems: [
      'Reedu e danyugo tiiɗnini pelvic floor no feewi.',
      'Hosugo seɗɗa seɗɗa ɗum ko nanndi caggal danyugo.',
      'Fiilaaji ɗin ndaara wayyingo no haanani ɓuri semmbe.',
      'Heftugo hakkilo e hoosugo ɓuri nafugo no tiiɗnugo.',
      'Ndiyam ɗam yaaɗi, tiiɗɗam, walla muusi jokkotooɗum ɗaɓɓi miijo goɗɗo anndiiɗo.',
      'Hosugo e sage-femme walla goɗɗo anndiiɗo waawi wallugo ma heɓugo hakkilo ɓuri.',
      'Ruttugo siporu ɗum ko seɗɗa seɗɗa, ko ɓuri kuuɗe tiiɗɗe.',
    ],

    finalTipTitle: 'Hokku ɗum wakkati ngam hosugo',
    finalTipText:
      'Caggal danyugo, yaadu maaɗa heɓii wayrude ɗuuɗɗe. Perineum deserve ndaarugo nanndi e ɓernde maaɗa fuu: seɗɗa seɗɗa, wakkati kala, salaa tiiɗnugo.',

    disclaimerText:
      'Ɗerewol ndin ko ngam anndinki tan, ndiyaataa muuyugo hanaani e maaɗa. So muusi, alamaaji jokkotooɗi, walla miijo ɗum haɗi ma dow hosugo maaɗa, ƴami muuyugo e goɗɗo anndiiɗo.',
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
  da: {
    badge: 'BARSEL • GENOPTRÆNING',
    title: 'Styrk din bækkenbund\nefter fødslen',
    metaDuration: '8 min. læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro:
      'Efter graviditet og fødsel har bækkenbunden brug for tid til at komme sig. Enkle, regelmæssige og gradvise øvelser kan hjælpe dig med at genvinde styrke, kontrol og selvtillid, uden at forsøge at skynde sig.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forstå perinæets rolle',
      'Hvorfor fødslen belaster det',
      'Hvornår du skal starte bækkenbundsgenoptræning',
      'At lære at kontrahere korrekt',
      'Opbyg en gradvis rutine',
      'Fejl du skal undgå',
      'Hvornår du skal bede om hjælp',
      'Gradvis genoptagelse af sport',
      'Forberedelse til en aftale',
      'Vigtigste pointer',
    ],
    shareMessage: 'Styrk din bækkenbund efter fødslen — AWA',

    s1Heading: 'Forstå perinæets rolle',
    s1Body1:
      'Perinæet, også kaldet bækkenbunden, er en gruppe muskler placeret ved bækkenbunden. Det spiller en rolle i blære- og tarmkontrol og hjælper med at støtte bækkenorganerne.',
    s1Body2:
      'Under graviditeten skal disse muskler bære ekstra vægt i flere måneder. De udsættes også for betydelig belastning under fødslen.',
    s1HighlightTitle: 'En diskret men vigtig muskel',
    s1HighlightText:
      'Bækkenbunden er involveret i flere hverdagsfunktioner: at holde urin og afføring tilbage, kontrollere luft, støtte bækkenorganerne og spille en rolle i visse seksuelle funktioner.',

    benefitsHeading: 'Fordelene ved en stærkere bækkenbund',
    benefitsIntro:
      'Gradvis, korrekt udført styrketræning kan hjælpe med at forbedre bækkenbundens kontrol og støtte.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bedre blærekontrol',
        text: 'Bækkenbunden spiller en rolle i blærekontrollen. Gradvis styrkelse kan hjælpe med at reducere visse urinlæk.',
      },
      {
        icon: 'toilet',
        title: 'Støtte tarmfunktionen',
        text: 'Disse muskler hjælper også med at kontrollere luft og afføring og bidrager til at støtte bækkenorganerne.',
      },
      {
        icon: 'human-female',
        title: 'Støtte bækkenorganerne',
        text: 'Bækkenbunden danner en reel muskulær base, der hjælper med at støtte blæren, livmoderen og tarmen.',
      },
      {
        icon: 'heart-pulse',
        title: 'Gradvis genvinding af fornemmelse',
        text: 'Egnet genoptræning kan også hjælpe dig med at genvinde bedre bevidsthed og kontrol af dette område.',
      },
    ],

    s2Heading: 'Hvorfor graviditet og fødsel belaster det',
    s2Body1:
      'Graviditet lægger gradvist mere pres på bækkenbunden. En vaginal fødsel kan derefter strække musklerne og vævene i dette område betydeligt.',
    s2Body2:
      'Et kejsersnit sparer heller ikke bækkenbunden fuldstændigt: graviditeten i sig selv er fortsat en vigtig periode for disse muskler.',
    s2Body3:
      'Efter fødslen er det derfor normalt, at genopretningen tager tid. Nogle kvinder mærker næsten ingen symptomer, mens andre kan bemærke lækager, en følelse af tyngde eller reduceret muskelkontrol.',
    s2TipTitle: 'Hver genopretning er forskellig',
    s2TipText:
      'Fødslens type, en rifting eller episiotomi, smerter og din generelle tilstand efter fødslen kan alle påvirke genopretningen.',

    s3Heading: 'Hvornår skal du starte bækkenbundsgenoptræning?',
    s3Body1:
      'Efter en ukompliceret fødsel kan skånsomme bækkenbundskontraktioner som regel genoptages gradvist. Det er dog vigtigt at tilpasse øvelserne til din situation og søge rådgivning, hvis du oplevede en komplikation, betydelige smerter eller et specifikt indgreb.',
    s3Body2:
      'Hvis du har et urinkateter, anbefaler visse vejledninger at vente, til det er fjernet og normal vandladning er genoptaget, før du begynder perinæumøvelser.',
    s3AlertTitle: 'Tving ikke igennem smerte',
    s3AlertText:
      'Betydelige smerter, forværrede symptomer, et sår der heler dårligt eller en særlig bekymring kræver råd fra en jordemoder, læge eller genoptrænende professionel.',

    s4Heading: 'At lære at kontrahere korrekt',
    s4Body1:
      'For at identificere bevægelsen kan du forestille dig at forsøge at holde luft tilbage og dæmpe vandladningstrangen på samme tid. Bevægelsen du leder efter er en fornemmelse af kontraktion og løft indad.',
    s4Body2:
      'Målet er ikke at spænde hele kroppen hårdt. Dine baller, lår og mavemuskulatur skal forblive så afslappede som muligt, mens vejrtrækningen fortsætter normalt.',
    exercises: [
      {icon: 'weather-windy', label: 'Vejrtrækning'},
      {icon: 'human-handsup', label: 'Skånsom kontraktion'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Lang kontraktion'},
      {icon: 'gesture-tap-button', label: 'Hurtige kontraktioner'},
    ],
    s4HighlightTitle: 'Afslapning er lige så vigtigt',
    s4HighlightText:
      'Efter hver kontraktion skal musklerne slappe fuldstændigt af. God genoptræning betyder ikke at holde perinæet kontraheret hele dagen.',

    s5Heading: 'Opbyg en gradvis rutine',
    s5Body1:
      'I starten er det vigtigste at lære at identificere musklerne og udføre bevægelsen korrekt. Konsistens er vigtigere end intensitet.',
    s5h3a: 'Lange kontraktioner',
    s5Body2:
      'Kontraher bækkenbunden forsigtigt, hold derefter kontraktionen i et par sekunder uden at holde vejret. Slip derefter helt, inden du starter igen.',
    s5h3b: 'Korte kontraktioner',
    s5Body3:
      'Når bevægelsen er mestret, kan små hurtige kontraktioner tilføjes. De hjælper med at træne evnen til hurtigt at kontrahere musklerne, når det abdominale tryk stiger, for eksempel lige inden hoste eller nys.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Par øvelserne med en daglig vane'},
      {icon: 'human-sitting', label: 'Start i en behagelig position'},
      {icon: 'weather-windy', label: 'Ånd normalt under kontraktioner'},
      {icon: 'sleep', label: 'Respekter afslappelsesfaserne'},
      {icon: 'chart-line', label: 'Øg gradvist sværhedsgraden'},
      {icon: 'doctor', label: 'Bed om råd, hvis du er usikker'},
    ],
    s5TipTitle: 'Konsistens frem for alt',
    s5TipText:
      'At parre øvelserne med en vane, der allerede er en del af din dag, kan gøre det lettere at holde fast: efter amning, efter tandbørstning eller på et andet tidspunkt, der passer dig.',

    s6Heading: 'Almindelige fejl du skal undgå',
    s6Body1:
      'Perinæumøvelser ser måske enkle ud, men det er let at kompensere med andre muskler eller anstrenge sig for meget.',
    commonMistakes: [
      'At spænde ballerne eller lårene i stedet for bækkenbunden',
      'At holde vejret under kontraktionen',
      'At holde musklerne konstant kontraherede uden at lade dem slappe af',
      'At lave øvelserne i kun få dage og derefter stoppe',
      'Bevidst at stoppe urinstrålen for at tjekke kontraktionen',
    ],
    s6TipTitle: 'Hvad du ikke skal gøre',
    s6TipText:
      'Det anbefales ikke at øve sig ved bevidst at stoppe urinstrålen. Denne metode træner ikke perinæet korrekt og kan forstyrre normal blærefunktion.',

    s7Heading: 'Hvilke symptomer bør tilskynde til konsultation?',
    s7Body1:
      'Mindre lækager eller en usædvanlig fornemmelse kan nogle gange opstå efter fødslen. De bør dog ikke ignoreres, hvis de varer ved, forværres eller forstyrrer din hverdag.',
    warningSigns: [
      'Urinlæk når du hoster, nyser, griner eller anstrenger dig',
      'En følelse af tyngde eller tryk i den nedre del af bækkenet',
      'En fornemmelse af, at en klump eller noget falder ned i vagina',
      'Besvær med at holde luft eller afføring tilbage',
      'Vedvarende smerter i perinæet',
      'Smerter under eller efter samleje',
      'Besvær med at identificere eller korrekt kontrahere perinæummusklerne',
    ],
    consultLabel: 'Hvornår skal du søge råd?',
    s7Body2:
      'En jordemoder, læge eller fysioterapeut med speciale i bækkenbundsgenoptræning kan kontrollere muskelfunktionen og foreslå et egnet program.',

    s8Heading: 'Og efter en rifting, en episiotomi eller et kejsersnit?',
    s8Body1:
      'En rifting eller episiotomi kræver særlig opmærksomhed under helingsprocessen. Genoptagelse af aktiviteter skal tage hensyn til smerter, arrets tilstand og den vejledning, der er givet efter fødslen.',
    s8Body2:
      'Efter et kejsersnit involverer genopretningen også bugvæggen og arret. Selv hvis fødslen ikke var vaginal, har graviditeten stadig belastet bækkenbunden.',
    s8HighlightTitle: 'Personlig pleje kan hjælpe',
    s8HighlightText:
      'I tilfælde af en betydelig rifting, smerter, urinære eller tarmrelaterede symptomer eller vedvarende vanskeligheder kan en vurdering hos en sundhedsprofessionel være særlig nyttig.',

    s9Heading: 'Gradvis genoptagelse af sport',
    s9Body1:
      'Genoptagelse af bevægelse efter fødslen skal ske gradvist. Gåture og skånsomme bevægelser kan som regel genoptages baseret på, hvordan du har det, mens aktiviteter med høj belastning kræver mere forsigtighed.',
    s9Body2:
      'Inden du genoptager løb, hop eller meget intensiv træning, er det bedst at vurdere bækkenbundens genopretning og tage eventuelle symptomer i betragtning.',
    s9AlertTitle: 'Skynd dig ikke igennem faserne',
    s9AlertText:
      'Lækager, en følelse af tyngde eller smerter under eller efter træning er tegn på, at du bør sænke farten og søge råd, inden du øger intensiteten.',

    s10Heading: 'Hvornår skal du se en specialist?',
    s10Body1:
      'Bækkenbundsgenoptræning med en jordemoder eller fysioterapeut kan være nyttig, hvis du er usikker på, om du kontrahere korrekt, hvis dine symptomer varer ved, eller hvis du ønsker at genoptage visse fysiske aktiviteter med selvtillid.',
    questionCardTitle: 'Nyttige spørgsmål at stille',
    appointmentQuestions: [
      'Er mine symptomer forenelige med svaghed i bækkenbunden?',
      'Udfører jeg kontraktionerne korrekt?',
      'Hvor mange gentagelser skal jeg lave hver dag?',
      'Kan jeg genoptage løb, sport eller øvelser med høj belastning?',
      'Har jeg brug for genoptræning med en jordemoder eller fysioterapeut?',
      'Kræver mit ar, min rifting eller mit kejsersnit særlige forholdsregler?',
    ],
    s10TipTitle: 'Godt at vide',
    s10TipText:
      'At besøge en professionel betyder ikke nødvendigvis, at noget er galt. En session kan blot hjælpe med at tjekke din teknik, vurdere din genopretning og lære at fremskridt korrekt.',

    s11Heading: 'En genopretning, der tager tid',
    s11Body1:
      'Efter fødslen er det normalt ikke straks at genvinde de samme fornemmelser eller muskelstyrke, du havde før graviditeten.',
    s11Body2:
      'Målet er ikke at lave så mange kontraktioner som muligt. Det handler mere om gradvist at genvinde god koordination mellem kontraktion og afslapning og derefter at kunne bruge disse muskler naturligt i hverdagsaktiviteter.',
    s11HighlightTitle: 'Lille fremskridt er ægte fremskridt',
    s11HighlightText:
      'Bedre bevidsthed om bevægelsen, et par ekstra sekunders kontraktion eller en reduktion i lækager er allerede opmuntrende tegn.',

    s12Heading: 'Vigtigste pointer',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Graviditet og fødsel belaster bækkenbunden betydeligt.',
      'Gradvis genopretning er normal efter fødslen.',
      'Øvelser bør prioritere bevægelseskvalitet frem for styrke.',
      'Vejrtrækning og afslapning er lige så vigtige som kontraktion.',
      'Urinlæk, tyngde eller vedvarende smerter fortjener en professionel vurdering.',
      'Genoptræning med en jordemoder eller fysioterapeut kan hjælpe dig med at genvinde bedre kontrol.',
      'Genoptagelse af sport skal ske gradvist, særligt for aktiviteter med høj belastning.',
    ],
    finalTipTitle: 'Tag dig tid til at komme dig',
    finalTipText:
      'Efter fødslen har din krop gennemgået mange forandringer. Perinæet fortjener den samme opmærksomhed som resten af din krop: gradvist, regelmæssigt og uden pres.',
    disclaimerText:
      'Denne artikel er kun til information og erstatter ikke personlig medicinsk rådgivning. Hvis du oplever smerter, vedvarende symptomer eller har bekymringer om din genopretning, så søg råd hos en sundhedsprofessionel.',
  },
  sv: {
    badge: 'BARSEL • GENOPTRÄNING',
    title: 'Styrk din bäkkenbund\nefter födslen',
    metaDuration: '8 min. läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro:
      'Efter graviditet och födsel har bäkkenbunden brug for tid till at komme sig. Enkle, regelmässige och gradvise övelser kan hjälpe dig med at genvinde styrke, kontrol och selvtillid, uden at forsöge at skynde sig.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forstå perinäets rolle',
      'Hvorfor födslen belaster det',
      'Hvornår du skal starte bäkkenbundsgenopträning',
      'At läre at kontrahere korrekt',
      'Opbyg en gradvis rutine',
      'Fejl du skal undgå',
      'Hvornår du skal bede om hjälp',
      'Gradvis genoptagelse av sport',
      'Forberedelse till en aftale',
      'Vigtigste pointer',
    ],
    shareMessage: 'Styrk din bäkkenbund efter födslen — AWA',

    s1Heading: 'Forstå perinäets rolle',
    s1Body1:
      'Perinäet, også kaldet bäkkenbunden, ar en gruppe muskler placeret ved bäkkenbunden. Det spiller en rolle i bläre- och tarmkontrol och hjälper med at stötte bäkkenorganerne.',
    s1Body2:
      'Under graviditeten skal disse muskler bäre ekstra vägt i flere måneder. De udsättes også for betydelig belastning under födslen.',
    s1HighlightTitle: 'En diskret men vigtig muskel',
    s1HighlightText:
      'Bäkkenbunden ar involveret i flere hverdagsfunktioner: at holde urin och afföring tilbage, kontrollere luft, stötte bäkkenorganerne och spille en rolle i visse seksuelle funktioner.',

    benefitsHeading: 'Fordelene ved en stärkere bäkkenbund',
    benefitsIntro:
      'Gradvis, korrekt udfört styrketräning kan hjälpe med at forbedre bäkkenbundens kontrol och stötte.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bedre blärekontrol',
        text: 'Bäkkenbunden spiller en rolle i blärekontrollen. Gradvis styrkelse kan hjälpe med at reducere visse urinläk.',
      },
      {
        icon: 'toilet',
        title: 'Stötte tarmfunktionen',
        text: 'Disse muskler hjälper også med at kontrollere luft och afföring och bidrager till at stötte bäkkenorganerne.',
      },
      {
        icon: 'human-female',
        title: 'Stötte bäkkenorganerne',
        text: 'Bäkkenbunden danner en reel muskulär base, der hjälper med at stötte blären, livmoderen och tarmen.',
      },
      {
        icon: 'heart-pulse',
        title: 'Gradvis genvinding av fornemmelse',
        text: 'Egnet genopträning kan også hjälpe dig med at genvinde bedre bevidsthed och kontrol av dette område.',
      },
    ],

    s2Heading: 'Hvorfor graviditet och födsel belaster det',
    s2Body1:
      'Graviditet lägger gradvist mere pres på bäkkenbunden. En vaginal födsel kan derefter sträkke musklerne och vävene i dette område betydeligt.',
    s2Body2:
      'Et kejsersnit sparer heller inte bäkkenbunden fuldständigt: graviditeten i sig selv ar fortsat en vigtig periode for disse muskler.',
    s2Body3:
      'Efter födslen ar det derfor normalt, at genopretningen tager tid. Nogle kvinnor märker nästen ingen symtom, mens andre kan bemärke läkager, en fölelse av tyngde eller reduceret muskelkontrol.',
    s2TipTitle: 'Hver genopretning ar forskellig',
    s2TipText:
      'Födslens type, en rifting eller episiotomi, smartor och din generelle tilstand efter födslen kan alla påvirke genopretningen.',

    s3Heading: 'Hvornår skal du starte bäkkenbundsgenopträning?',
    s3Body1:
      'Efter en ukompliceret födsel kan skånsomme bäkkenbundskontraktioner som regel genoptages gradvist. Det ar dog vigtigt at tilpasse övelserne till din situation och söge rådgivning, hvis du oplevede en komplikation, betydelige smartor eller et specifikt indgreb.',
    s3Body2:
      'Hvis du har et urinkateter, anbefaler visse vejledninger at vente, till det ar fjernet och normal vandladning ar genoptaget, för du begynder perinäumövelser.',
    s3AlertTitle: 'Tving inte igennem smerte',
    s3AlertText:
      'Betydelige smerter, forvärrede symtom, et sår der heler dårligt eller en särlig bekymring kräver råd fran en jordemoder, läge eller genoptränende professionel.',

    s4Heading: 'At läre at kontrahere korrekt',
    s4Body1:
      'For at identificere bevägelsen kan du forestille dig at forsöge at holde luft tilbage och dämpe vandladningstrangen på samme tid. Bevägelsen du leder efter ar en fornemmelse av kontraktion och löft indad.',
    s4Body2:
      'Målet ar inte at spände hele kroppen hårdt. Dine baller, lår och mavemuskulatur skal forblive så afslappede som muligt, mens vejrträkningen fortsätter normalt.',
    exercises: [
      {icon: 'weather-windy', label: 'Vejrträkning'},
      {icon: 'human-handsup', label: 'Skånsom kontraktion'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Lang kontraktion'},
      {icon: 'gesture-tap-button', label: 'Hurtige kontraktioner'},
    ],
    s4HighlightTitle: 'Afslapning ar lige så vigtigt',
    s4HighlightText:
      'Efter hver kontraktion skal musklerne slappe fuldständigt av. God genopträning betyder inte at holde perinäet kontraheret hele dagen.',

    s5Heading: 'Opbyg en gradvis rutine',
    s5Body1:
      'I starten ar det vigtigste at läre at identificere musklerne och udföre bevägelsen korrekt. Konsistens ar vigtigere end intensitet.',
    s5h3a: 'Lange kontraktioner',
    s5Body2:
      'Kontraher bäkkenbunden forsigtigt, hold derefter kontraktionen i et par sekunder uden at holde vejret. Slip derefter helt, inden du starter igen.',
    s5h3b: 'Korte kontraktioner',
    s5Body3:
      'Når bevägelsen ar mestret, kan små hurtige kontraktioner tilföjes. De hjälper med at träne evnen till hurtigt at kontrahere musklerne, når det abdominale tryk stiger, for eksempel lige inden hoste eller nys.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Par övelserne med en daglig vane'},
      {icon: 'human-sitting', label: 'Start i en behagelig position'},
      {icon: 'weather-windy', label: 'Ånd normalt under kontraktioner'},
      {icon: 'sleep', label: 'Respekter afslappelsesfaserne'},
      {icon: 'chart-line', label: 'Ög gradvist svärhedsgraden'},
      {icon: 'doctor', label: 'Bed om råd, hvis du ar usikker'},
    ],
    s5TipTitle: 'Konsistens frem for alt',
    s5TipText:
      'At parre övelserne med en vane, der redan ar en del av din dag, kan göre det lettere at holde fast: efter amning, efter tandbörstning eller på et andet tidspunkt, der passer dig.',

    s6Heading: 'Almindelige fejl du skal undgå',
    s6Body1:
      'Perinäumövelser ser måske enkle ud, men det ar let at kompensere med andre muskler eller anstrenge sig for meget.',
    commonMistakes: [
      'At spände ballerne eller lårene i stedet for bäkkenbunden',
      'At holde vejret under kontraktionen',
      'At holde musklerne konstant kontraherede uden at lade dem slappe af',
      'At lave övelserne i kun få dagar och derefter stoppe',
      'Bevidst at stoppe urinstrålen for att tjekke kontraktionen',
    ],
    s6TipTitle: 'Hvad du inte skal göre',
    s6TipText:
      'Det anbefales inte at öve sig ved bevidst at stoppe urinstrålen. Denne metode träner inte perinäet korrekt och kan forstyrre normal blärefunktion.',

    s7Heading: 'Hvilke symtom bör tilskynde till konsultation?',
    s7Body1:
      'Mindre läkager eller en usädvanlig fornemmelse kan nogle gange opstå efter födslen. De bör dog inte ignoreres, hvis de varer ved, forvärres eller forstyrrer din hverdag.',
    warningSigns: [
      'Urinläk når du hoster, nyser, griner eller anstrenger dig',
      'En fölelse av tyngde eller tryk i den nedre del av bäkkenet',
      'En fornemmelse av, at en klump eller noget falder ned i vagina',
      'Besvär med at holde luft eller afföring tilbage',
      'Vedvarende smartor i perinäet',
      'Smerter under eller efter samleje',
      'Besvär med at identificere eller korrekt kontrahere perinäummusklerne',
    ],
    consultLabel: 'Hvornår skal du söge råd?',
    s7Body2:
      'En jordemoder, läge eller fysioterapeut med speciale i bäkkenbundsgenopträning kan kontrollere muskelfunktionen och foreslå et egnet program.',

    s8Heading: 'Og efter en rifting, en episiotomi eller et kejsersnit?',
    s8Body1:
      'En rifting eller episiotomi kräver särlig opmärksomhed under helingsprocessen. Genoptagelse av aktiviteter skal tage hensyn till smerter, arrets tilstand och den vejledning, der ar givet efter födslen.',
    s8Body2:
      'Efter et kejsersnit involverer genopretningen også bugväggen och arret. Selv hvis födslen inte var vaginal, har graviditeten fortfarande belastet bäkkenbunden.',
    s8HighlightTitle: 'Personlig pleje kan hjälpe',
    s8HighlightText:
      'I tilfälde av en betydelig rifting, smerter, urinäre eller tarmrelaterede symtom eller vedvarende vanskeligheder kan en vurdering hos en halsasprofessionel väre särlig nyttig.',

    s9Heading: 'Gradvis genoptagelse av sport',
    s9Body1:
      'Genoptagelse av bevägelse efter födslen skal ske gradvist. Gåture och skånsomme bevägelser kan som regel genoptages baseret på, hvordan du har det, mens aktiviteter med höj belastning kräver mere forsigtighed.',
    s9Body2:
      'Inden du genoptager löb, hop eller mycket intensiv träning, ar det bedst at vurdere bäkkenbundens genopretning och tage eventuelle symtom i betragtning.',
    s9AlertTitle: 'Skynd dig inte igennem faserne',
    s9AlertText:
      'Läkager, en fölelse av tyngde eller smartor under eller efter träning ar tegn på, at du bör sänke farten och söge råd, inden du öger intensiteten.',

    s10Heading: 'Hvornår skal du se en specialist?',
    s10Body1:
      'Bäkkenbundsgenopträning med en jordemoder eller fysioterapeut kan väre nyttig, hvis du ar usikker på, om du kontrahere korrekt, hvis dina symtom varer ved, eller hvis du önsker at genoptage visse fysiske aktiviteter med selvtillid.',
    questionCardTitle: 'Nyttige spörgsmål at stille',
    appointmentQuestions: [
      'Er mine symtom forenelige med svaghed i bäkkenbunden?',
      'Udförer jag kontraktionerne korrekt?',
      'Hvor mange gentagelser skal jag lave hver dag?',
      'Kan jag genoptage löb, sport eller övelser med höj belastning?',
      'Har jag brug for genopträning med en jordemoder eller fysioterapeut?',
      'Kräver mit ar, min rifting eller mit kejsersnit särlige forholdsregler?',
    ],
    s10TipTitle: 'Godt at vide',
    s10TipText:
      'At besöge en professionel betyder inte nödvendigvis, at noget ar galt. En session kan blot hjälpe med at tjekke din teknik, vurdere din genopretning och läre at fremskridt korrekt.',

    s11Heading: 'En genopretning, der tager tid',
    s11Body1:
      'Efter födslen ar det normalt inte straks at genvinde de samme fornemmelser eller muskelstyrke, du havde för graviditeten.',
    s11Body2:
      'Målet ar inte at lave så mange kontraktioner som muligt. Det handler mere om gradvist at genvinde god koordination mellem kontraktion och afslapning och derefter at kunne bruge disse muskler naturligt i hverdagsaktiviteter.',
    s11HighlightTitle: 'Lille fremskridt ar ägte fremskridt',
    s11HighlightText:
      'Bedre bevidsthed om bevägelsen, et par ekstra sekunders kontraktion eller en reduktion i läkager ar redan opmuntrende tegn.',

    s12Heading: 'Vigtigste pointer',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Graviditet och födsel belaster bäkkenbunden betydeligt.',
      'Gradvis genopretning ar normal efter födslen.',
      'Övelser bör prioritere bevägelseskvalitet frem for styrke.',
      'Vejrträkning och afslapning ar lige så vigtige som kontraktion.',
      'Urinläk, tyngde eller vedvarende smartor fortjener en professionel vurdering.',
      'Genopträning med en jordemoder eller fysioterapeut kan hjälpe dig med at genvinde bedre kontrol.',
      'Genoptagelse av sport skal ske gradvist, särligt for aktiviteter med höj belastning.',
    ],
    finalTipTitle: 'Tag dig tid till at komme dig',
    finalTipText:
      'Efter födslen har din krop gennemgået mange forandringer. Perinäet fortjener den samme opmärksomhed som resten av din krop: gradvist, regelmässigt och uden pres.',
    disclaimerText:
      'Denne artikel ar kun till information och erstatter inte personlig medicinsk rådgivning. Hvis du oplever smerter, vedvarende symtom eller har bekymringer om din genopretning, så sög råd hos en halsasprofessionel.',
  },
  nb: {
    badge: 'BARSELTID • TILFRISKNING',
    title: 'Styrke bekkenbunnen\netter fødselen',
    metaDuration: '8 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Etter svangerskap og fødsel trenger bekkenbunnen tid til å komme seg. Enkle, regelmessige og gradvise øvelser kan hjelpe deg å få tilbake styrke, kontroll og trygghet, uten å prøve å skynde på ting.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forstå bekkenbunnens rolle',
      'Hvorfor fødselen belaster den',
      'Når du bør begynne med bekkenbunnstrening',
      'Lære å trekke sammen riktig',
      'Bygge en gradvis rutine',
      'Feil du bør unngå',
      'Når du bør be om hjelp',
      'Gradvis komme tilbake til idrett',
      'Forberede en time',
      'Det viktigste å huske',
    ],
    shareMessage: 'Styrke bekkenbunnen etter fødselen – AWA',

    s1Heading: 'Forstå bekkenbunnens rolle',
    s1Body1:
      'Bekkenbunnen, også kalt perineum, er en gruppe muskler nederst i bekkenet. Den spiller en rolle for kontrollen over blære og tarm og bidrar til å støtte bekkenorganene.',
    s1Body2:
      'Under svangerskapet må disse musklene bære ekstra vekt i flere måneder. De blir også utsatt for betydelig belastning under fødselen.',
    s1HighlightTitle: 'En diskret, men viktig muskel',
    s1HighlightText:
      'Bekkenbunnen er involvert i flere hverdagsfunksjoner: å holde på urin og avføring, kontrollere luft, støtte bekkenorganene og spille en rolle i visse seksuelle funksjoner.',

    benefitsHeading: 'Fordelene med en sterkere bekkenbunn',
    benefitsIntro:
      'Gradvis og riktig utført styrking kan bidra til å bedre kontrollen over og støtten fra bekkenbunnen.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bedre blærekontroll',
        text: 'Bekkenbunnen spiller en rolle for blærekontrollen. Å styrke den gradvis kan bidra til å redusere visse urinlekkasjer.',
      },
      {
        icon: 'toilet',
        title: 'Støtte tarmfunksjonen',
        text: 'Disse musklene bidrar også til å kontrollere luft og avføring og til å støtte bekkenorganene.',
      },
      {
        icon: 'human-female',
        title: 'Støtte bekkenorganene',
        text: 'Bekkenbunnen danner en reell muskulær base som bidrar til å støtte blæren, livmoren og tarmen.',
      },
      {
        icon: 'heart-pulse',
        title: 'Gradvis få tilbake følelsen',
        text: 'Egnet rehabilitering kan også hjelpe deg å få bedre bevissthet om og kontroll over dette området.',
      },
    ],

    s2Heading: 'Hvorfor svangerskap og fødsel belaster den',
    s2Body1:
      'Svangerskapet legger gradvis mer press på bekkenbunnen. En vaginal fødsel kan deretter strekke musklene og vevet i dette området betydelig.',
    s2Body2:
      'Et keisersnitt skåner heller ikke bekkenbunnen fullstendig: selve svangerskapet er fortsatt en krevende periode for disse musklene.',
    s2Body3:
      'Etter fødselen er det derfor normalt at tilfriskningen tar tid. Noen kvinner kjenner nesten ingen symptomer, mens andre kan merke lekkasjer, en følelse av tyngde eller redusert muskelkontroll.',
    s2TipTitle: 'Hver tilfriskning er forskjellig',
    s2TipText:
      'Typen fødsel, en bristning eller klipp (episiotomi), tilstedeværelsen av smerte og allmenntilstanden din etter fødselen kan alle påvirke tilfriskningen.',

    s3Heading: 'Når bør du begynne med bekkenbunnstrening?',
    s3Body1:
      'Etter en ukomplisert fødsel kan milde sammentrekninger av bekkenbunnen vanligvis gjenopptas gradvis. Det er fortsatt viktig å tilpasse øvelsene til din situasjon og å søke råd hvis du hadde en komplikasjon, betydelig smerte eller et spesielt inngrep.',
    s3Body2:
      'Hvis du har et urinkateter, anbefaler noen å vente til det er fjernet og normal vannlating er kommet i gang før du begynner med bekkenbunnsøvelser.',
    s3AlertTitle: 'Ikke press deg gjennom smerte',
    s3AlertText:
      'Betydelig smerte, forverrede symptomer, et sår som gror dårlig eller enhver spesiell bekymring krever råd fra en jordmor, lege eller rehabiliteringsfagperson.',

    s4Heading: 'Lære å trekke sammen riktig',
    s4Body1:
      'For å kjenne igjen bevegelsen kan du forestille deg at du prøver å holde igjen luft og vannlatingsbehovet samtidig. Bevegelsen du leter etter, er en følelse av sammentrekning og løft innover.',
    s4Body2:
      'Målet er ikke å spenne hele kroppen hardt. Setemusklene, lårene og magemusklene bør forbli så avslappet som mulig, mens pusten fortsetter normalt.',
    exercises: [
      {icon: 'weather-windy', label: 'Pusting'},
      {icon: 'human-handsup', label: 'Mild sammentrekning'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Lang sammentrekning'},
      {icon: 'gesture-tap-button', label: 'Raske sammentrekninger'},
    ],
    s4HighlightTitle: 'Avspenning betyr like mye',
    s4HighlightText:
      'Etter hver sammentrekning lar du musklene slappe helt av. God rehabilitering betyr ikke å holde bekkenbunnen sammentrukket hele dagen.',

    s5Heading: 'Bygge en gradvis rutine',
    s5Body1:
      'I begynnelsen er det viktigste å lære seg å kjenne igjen musklene og utføre bevegelsen riktig. Jevnhet betyr mer enn intensitet.',
    s5h3a: 'Lange sammentrekninger',
    s5Body2:
      'Trekk bekkenbunnen forsiktig sammen, og hold deretter sammentrekningen i noen sekunder uten å holde pusten. Slipp deretter helt opp før du begynner på nytt.',
    s5h3b: 'Korte sammentrekninger',
    s5Body3:
      'Når bevegelsen er mestret, kan små raske sammentrekninger legges til. De trener evnen til å trekke musklene sammen raskt når trykket i magen øker, for eksempel rett før du hoster eller nyser.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Knytt øvelsene til en daglig vane'},
      {icon: 'human-sitting', label: 'Begynn i en behagelig stilling'},
      {icon: 'weather-windy', label: 'Pust normalt under sammentrekningene'},
      {icon: 'sleep', label: 'Respekter avspenningsfasene'},
      {icon: 'chart-line', label: 'Øk vanskelighetsgraden gradvis'},
      {icon: 'doctor', label: 'Spør om råd hvis du er usikker'},
    ],
    s5TipTitle: 'Jevnhet fremfor alt',
    s5TipText:
      'Å knytte øvelsene til en vane som allerede er en del av dagen din, kan gjøre det lettere å holde en jevn rytme: etter et måltid for babyen, etter tannpussen eller på et annet tidspunkt som passer deg.',

    s6Heading: 'Vanlige feil du bør unngå',
    s6Body1:
      'Bekkenbunnsøvelser kan se enkle ut, men det er lett å kompensere med andre muskler eller presse for hardt.',
    commonMistakes: [
      'Å spenne setemusklene eller lårene i stedet for bekkenbunnen',
      'Å holde pusten under sammentrekningen',
      'Å holde musklene sammentrukket hele tiden uten å la dem slappe av',
      'Å gjøre øvelsene bare noen få dager og deretter slutte',
      'Å bevisst stoppe urinstrålen for å kontrollere sammentrekningen',
    ],
    s6TipTitle: 'Hva du ikke bør gjøre',
    s6TipText:
      'Det anbefales ikke å øve ved å bevisst stoppe urinstrålen. Denne metoden trener ikke bekkenbunnen riktig og kan forstyrre den normale blærefunksjonen.',

    s7Heading: 'Hvilke symptomer bør føre til en konsultasjon?',
    s7Body1:
      'Små lekkasjer eller en uvanlig fornemmelse kan noen ganger dukke opp etter fødselen. De bør imidlertid ikke overses hvis de vedvarer, blir verre eller forstyrrer hverdagen.',
    warningSigns: [
      'Urinlekkasjer når du hoster, nyser, ler eller anstrenger deg',
      'En følelse av tyngde eller trykk i nedre del av bekkenet',
      'En følelse av at en kul eller noe synker ned i skjeden',
      'Vansker med å holde igjen luft eller avføring',
      'Vedvarende smerte i mellomkjøttet',
      'Smerter under eller etter samleie',
      'Vansker med å kjenne igjen eller trekke sammen bekkenbunnsmusklene riktig',
    ],
    consultLabel: 'Når bør du søke råd?',
    s7Body2:
      'En jordmor, lege eller fysioterapeut som er spesialisert på bekkenbunnsrehabilitering, kan kontrollere muskelfunksjonen og foreslå et egnet program.',

    s8Heading: 'Og etter en bristning, klipp eller keisersnitt?',
    s8Body1:
      'En bristning eller et klipp krever særlig omsorg under tilhelingen. Gjenopptakelse av aktiviteter bør ta hensyn til smerte, arrets tilstand og veiledningen som ble gitt etter fødselen.',
    s8Body2:
      'Etter et keisersnitt omfatter tilfriskningen også bukveggen og arret. Selv om fødselen ikke var vaginal, belastet svangerskapet i seg selv fortsatt bekkenbunnen.',
    s8HighlightTitle: 'Individuelt tilpasset oppfølging kan hjelpe',
    s8HighlightText:
      'Ved en betydelig bristning, smerte, urin- eller tarmsymptomer eller vedvarende vansker kan en vurdering hos helsepersonell være særlig nyttig.',

    s9Heading: 'Gradvis komme tilbake til idrett',
    s9Body1:
      'Å komme tilbake til bevegelse etter fødselen bør skje gradvis. Gåing og milde bevegelser kan vanligvis gjenopptas ut fra hvordan du føler deg, mens aktiviteter med høy belastning krever mer forsiktighet.',
    s9Body2:
      'Før du begynner igjen å løpe, hoppe eller trene svært intensivt, er det best å vurdere tilfriskningen av bekkenbunnen og ta hensyn til eventuelle symptomer.',
    s9AlertTitle: 'Ikke skynd på trinnene',
    s9AlertText:
      'Lekkasjer, en følelse av tyngde eller smerte under eller etter trening er tegn på at du bør senke tempoet og søke råd før du øker intensiteten.',

    s10Heading: 'Når bør du gå til en spesialist?',
    s10Body1:
      'Bekkenbunnsrehabilitering hos en jordmor eller fysioterapeut kan være nyttig hvis du er usikker på om du trekker sammen riktig, hvis symptomene vedvarer, eller hvis du vil komme tilbake til visse fysiske aktiviteter med trygghet.',
    questionCardTitle: 'Nyttige spørsmål å stille',
    appointmentQuestions: [
      'Er symptomene mine forenlige med svak bekkenbunn?',
      'Utfører jeg sammentrekningene riktig?',
      'Hvor mange repetisjoner bør jeg gjøre hver dag?',
      'Kan jeg begynne å løpe, drive med idrett eller trene med høy belastning igjen?',
      'Trenger jeg rehabilitering hos en jordmor eller fysioterapeut?',
      'Krever arret mitt, bristningen eller keisersnittet noen spesielle forholdsregler?',
    ],
    s10TipTitle: 'Godt å vite',
    s10TipText:
      'Å oppsøke en fagperson betyr ikke nødvendigvis at noe er galt. En økt kan rett og slett hjelpe deg å kontrollere teknikken din, vurdere tilfriskningen og lære å gå riktig frem.',

    s11Heading: 'En tilfriskning som tar tid',
    s11Body1:
      'Etter fødselen er det normalt å ikke umiddelbart få tilbake de samme fornemmelsene eller den samme muskelstyrken som før svangerskapet.',
    s11Body2:
      'Målet er ikke å gjøre så mange sammentrekninger som mulig. Det handler mer om gradvis å få tilbake god koordinering mellom sammentrekning og avspenning, og deretter kunne bruke disse musklene naturlig i hverdagsaktiviteter.',
    s11HighlightTitle: 'Små fremskritt er reelle fremskritt',
    s11HighlightText:
      'Bedre bevissthet om bevegelsen, noen ekstra sekunder med sammentrekning eller færre lekkasjer er allerede oppmuntrende tegn.',

    s12Heading: 'Det viktigste å huske',
    summaryTitle: 'Det viktigste',
    summaryItems: [
      'Svangerskap og fødsel belaster bekkenbunnen betydelig.',
      'Gradvis tilfriskning er normalt etter fødselen.',
      'Øvelsene bør prioritere bevegelsens kvalitet fremfor styrke.',
      'Pusting og avspenning betyr like mye som sammentrekning.',
      'Urinlekkasjer, tyngdefølelse eller vedvarende smerte fortjener en faglig vurdering.',
      'Rehabilitering hos en jordmor eller fysioterapeut kan hjelpe deg å få bedre kontroll.',
      'Å komme tilbake til idrett bør skje gradvis, særlig for aktiviteter med høy belastning.',
    ],

    finalTipTitle: 'Ta deg tid til å komme deg',
    finalTipText:
      'Etter fødselen har kroppen din gjennomgått mange endringer. Bekkenbunnen fortjener samme oppmerksomhet som resten av kroppen din: gradvis, regelmessig og uten press.',

    disclaimerText:
      'Denne artikkelen er kun til informasjon og erstatter ikke personlig medisinsk rådgivning. Hvis du opplever smerte, vedvarende symptomer eller har noen bekymringer om tilfriskningen din, bør du søke råd hos helsepersonell.',
  },
  pl: {
    badge: 'POŁÓG • REGENERACJA',
    title: 'Wzmacnianie mięśni dna miednicy\npo porodzie',
    metaDuration: '8 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Po ciąży i porodzie mięśnie dna miednicy potrzebują czasu na regenerację. Proste, regularne i stopniowe ćwiczenia mogą pomóc odzyskać siłę, kontrolę i pewność siebie, bez próby przyspieszania procesu.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zrozumieć rolę krocza',
      'Dlaczego poród je obciąża',
      'Kiedy zacząć rehabilitację dna miednicy',
      'Nauka prawidłowego napinania',
      'Budowanie stopniowej rutyny',
      'Błędy, których warto unikać',
      'Kiedy poprosić o pomoc',
      'Stopniowy powrót do sportu',
      'Przygotowanie do wizyty',
      'Najważniejsze wnioski',
    ],
    shareMessage: 'Wzmacnianie mięśni dna miednicy po porodzie — AWA',

    s1Heading: 'Zrozumieć rolę krocza',
    s1Body1:
      'Krocze, nazywane także dnem miednicy, to grupa mięśni położona u podstawy miednicy. Odgrywa rolę w kontroli pęcherza i jelit oraz pomaga podtrzymywać narządy miednicy.',
    s1Body2:
      'W czasie ciąży te mięśnie przez kilka miesięcy muszą dźwigać dodatkowy ciężar. Są też bardzo obciążone podczas porodu.',
    s1HighlightTitle: 'Dyskretny, ale niezbędny mięsień',
    s1HighlightText:
      'Dno miednicy uczestniczy w kilku codziennych funkcjach: zatrzymywaniu moczu i stolca, kontroli gazów, podtrzymywaniu narządów miednicy i pełnieniu roli w niektórych funkcjach seksualnych.',

    benefitsHeading: 'Korzyści z silniejszego dna miednicy',
    benefitsIntro:
      'Stopniowe, prawidłowo wykonywane wzmacnianie może pomóc poprawić kontrolę i podparcie dna miednicy.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Lepsza kontrola pęcherza',
        text: 'Dno miednicy odgrywa rolę w kontroli pęcherza. Jego stopniowe wzmacnianie może pomóc zmniejszyć niektóre wycieki moczu.',
      },
      {
        icon: 'toilet',
        title: 'Wsparcie funkcji jelit',
        text: 'Te mięśnie pomagają też kontrolować gazy i stolec oraz przyczyniają się do podtrzymywania narządów miednicy.',
      },
      {
        icon: 'human-female',
        title: 'Podtrzymywanie narządów miednicy',
        text: 'Dno miednicy tworzy prawdziwą mięśniową podstawę, która pomaga podtrzymywać pęcherz, macicę i jelito.',
      },
      {
        icon: 'heart-pulse',
        title: 'Stopniowe odzyskiwanie czucia',
        text: 'Odpowiednia rehabilitacja może też pomóc odzyskać lepszą świadomość i kontrolę tej okolicy.',
      },
    ],

    s2Heading: 'Dlaczego ciąża i poród je obciążają',
    s2Body1:
      'Ciąża stopniowo zwiększa nacisk na dno miednicy. Poród drogami natury może następnie znacznie rozciągnąć mięśnie i tkanki tej okolicy.',
    s2Body2:
      'Cesarskie cięcie również nie oszczędza w pełni dna miednicy: sama ciąża pozostaje dla tych mięśni znaczącym okresem.',
    s2Body3:
      'Po porodzie jest więc normalne, że regeneracja wymaga czasu. Niektóre kobiety prawie nie odczuwają objawów, inne mogą zauważyć wycieki, uczucie ciężkości lub zmniejszoną kontrolę mięśni.',
    s2TipTitle: 'Każda regeneracja jest inna',
    s2TipText:
      'Na regenerację mogą wpływać rodzaj porodu, pęknięcie lub nacięcie krocza, obecność bólu i Twój ogólny stan po porodzie.',

    s3Heading: 'Kiedy zacząć rehabilitację dna miednicy?',
    s3Body1:
      'Po niepowikłanym porodzie delikatne napinanie mięśni dna miednicy można zwykle wznawiać stopniowo. Wciąż ważne jest dostosowanie ćwiczeń do Twojej sytuacji i zasięgnięcie porady, jeśli wystąpiło powikłanie, znaczny ból lub szczególny zabieg.',
    s3Body2:
      'Jeśli masz cewnik moczowy, niektóre zalecenia sugerują poczekanie z ćwiczeniami krocza do jego usunięcia i powrotu do normalnego oddawania moczu.',
    s3AlertTitle: 'Nie przezwyciężaj bólu',
    s3AlertText:
      'Znaczny ból, pogarszające się objawy, źle goją się rana lub jakikolwiek szczególny niepokój wymagają porady położnej, lekarza lub specjalisty od rehabilitacji.',

    s4Heading: 'Nauka prawidłowego napinania',
    s4Body1:
      'Aby rozpoznać ten ruch, wyobraź sobie, że próbujesz jednocześnie zatrzymać gazy i parcie na mocz. Ruch, którego szukasz, to uczucie napięcia i unoszenia do wewnątrz.',
    s4Body2:
      'Celem nie jest mocne napięcie całego ciała. Pośladki, uda i mięśnie brzucha powinny pozostać możliwie rozluźnione, a oddychanie powinno przebiegać normalnie.',
    exercises: [
      {icon: 'weather-windy', label: 'Oddychanie'},
      {icon: 'human-handsup', label: 'Delikatne napięcie'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Długie napięcie'},
      {icon: 'gesture-tap-button', label: 'Szybkie napięcia'},
    ],
    s4HighlightTitle: 'Rozluźnianie jest równie ważne',
    s4HighlightText:
      'Po każdym napięciu pozwól mięśniom całkowicie się rozluźnić. Dobra rehabilitacja nie polega na utrzymywaniu krocza napiętego przez cały dzień.',

    s5Heading: 'Budowanie stopniowej rutyny',
    s5Body1:
      'Na początku najważniejsze jest nauczenie się rozpoznawania mięśni i prawidłowego wykonywania ruchu. Regularność liczy się bardziej niż intensywność.',
    s5h3a: 'Długie napięcia',
    s5Body2:
      'Delikatnie napnij dno miednicy, a następnie utrzymaj napięcie przez kilka sekund, nie wstrzymując oddechu. Potem całkowicie rozluźnij, zanim zaczniesz od nowa.',
    s5h3b: 'Krótkie napięcia',
    s5Body3:
      'Gdy opanujesz ruch, można dodać drobne, szybkie napięcia. Pomagają trenować zdolność szybkiego napinania mięśni, gdy rośnie ciśnienie w jamie brzusznej, na przykład tuż przed kaszlem lub kichnięciem.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Połącz ćwiczenia z codziennym nawykiem'},
      {icon: 'human-sitting', label: 'Zacznij w wygodnej pozycji'},
      {icon: 'weather-windy', label: 'Oddychaj normalnie podczas napinania'},
      {icon: 'sleep', label: 'Przestrzegaj faz rozluźnienia'},
      {icon: 'chart-line', label: 'Stopniowo zwiększaj trudność'},
      {icon: 'doctor', label: 'Poproś o poradę, jeśli masz wątpliwości'},
    ],
    s5TipTitle: 'Przede wszystkim regularność',
    s5TipText:
      'Połączenie ćwiczeń z nawykiem, który już jest częścią Twojego dnia, może ułatwić regularność: po karmieniu, po myciu zębów lub o innej porze, która Ci odpowiada.',

    s6Heading: 'Częste błędy, których warto unikać',
    s6Body1:
      'Ćwiczenia krocza mogą wyglądać na proste, ale łatwo zacząć kompensować innymi mięśniami lub przesadzić z siłą.',
    commonMistakes: [
      'Napinanie pośladków lub ud zamiast dna miednicy',
      'Wstrzymywanie oddechu podczas napinania',
      'Utrzymywanie mięśni stale napiętych bez pozwolenia im na rozluźnienie',
      'Wykonywanie ćwiczeń tylko przez kilka dni, a potem rezygnacja',
      'Celowe zatrzymywanie strumienia moczu, by sprawdzić napięcie',
    ],
    s6TipTitle: 'Czego nie robić',
    s6TipText:
      'Nie zaleca się wykonywania ćwiczeń przez celowe zatrzymywanie strumienia moczu. Ta metoda nie trenuje krocza prawidłowo i może zaburzać normalną funkcję pęcherza.',

    s7Heading: 'Jakie objawy powinny skłonić do wizyty?',
    s7Body1:
      'Niewielkie wycieki lub nietypowe odczucia mogą czasem pojawić się po porodzie. Nie należy ich jednak ignorować, jeśli się utrzymują, nasilają lub zakłócają codzienne życie.',
    warningSigns: [
      'Wycieki moczu podczas kaszlu, kichania, śmiechu lub parcia',
      'Uczucie ciężkości lub ucisku w dolnej części miednicy',
      'Uczucie, że do pochwy opada guzek lub coś innego',
      'Trudności w utrzymaniu gazów lub stolca',
      'Uporczywy ból krocza',
      'Ból podczas stosunku lub po nim',
      'Trudności w rozpoznaniu lub prawidłowym napinaniu mięśni krocza',
    ],
    consultLabel: 'Kiedy zasięgnąć porady?',
    s7Body2:
      'Położna, lekarz lub fizjoterapeuta specjalizujący się w rehabilitacji dna miednicy może sprawdzić pracę mięśni i zaproponować odpowiedni program.',

    s8Heading: 'A po pęknięciu, nacięciu krocza lub cesarskim cięciu?',
    s8Body1:
      'Pęknięcie lub nacięcie krocza wymaga szczególnej troski podczas gojenia. Powrót do aktywności powinien uwzględniać ból, stan blizny i wskazówki otrzymane po porodzie.',
    s8Body2:
      'Po cesarskim cięciu regeneracja obejmuje także ścianę brzucha i bliznę. Nawet jeśli poród nie odbył się drogami natury, sama ciąża również obciążyła dno miednicy.',
    s8HighlightTitle: 'Spersonalizowana opieka może pomóc',
    s8HighlightText:
      'W przypadku znacznego pęknięcia, bólu, objawów ze strony układu moczowego lub jelit albo uporczywych trudności ocena u specjalisty może być szczególnie pomocna.',

    s9Heading: 'Stopniowy powrót do sportu',
    s9Body1:
      'Powrót do ruchu po porodzie powinien być stopniowy. Spacery i delikatne ruchy można zasadniczo wznowić zgodnie z samopoczuciem, natomiast aktywności o dużym obciążeniu wymagają większej ostrożności.',
    s9Body2:
      'Przed wznowieniem biegania, skoków lub bardzo intensywnego treningu najlepiej ocenić regenerację dna miednicy i uwzględnić wszelkie objawy.',
    s9AlertTitle: 'Nie przyspieszaj etapów',
    s9AlertText:
      'Wycieki, uczucie ciężkości lub ból podczas ćwiczeń albo po nich to sygnały, że należy zwolnić i zasięgnąć porady, zanim zwiększysz intensywność.',

    s10Heading: 'Kiedy zgłosić się do specjalisty?',
    s10Body1:
      'Rehabilitacja dna miednicy z położną lub fizjoterapeutą może być pomocna, jeśli nie masz pewności, czy napinasz prawidłowo, jeśli objawy się utrzymują lub jeśli chcesz z pewnością wrócić do niektórych aktywności fizycznych.',
    questionCardTitle: 'Pomocne pytania',
    appointmentQuestions: [
      'Czy moje objawy są zgodne z osłabieniem dna miednicy?',
      'Czy prawidłowo wykonuję napięcia?',
      'Ile powtórzeń powinnam wykonywać każdego dnia?',
      'Czy mogę wrócić do biegania, sportu lub ćwiczeń o dużym obciążeniu?',
      'Czy potrzebuję rehabilitacji z położną lub fizjoterapeutą?',
      'Czy moja blizna, pęknięcie lub cesarskie cięcie wymaga szczególnych środków ostrożności?',
    ],
    s10TipTitle: 'Warto wiedzieć',
    s10TipText:
      'Wizyta u specjalisty niekoniecznie oznacza, że coś jest nie tak. Sesja może po prostu pomóc sprawdzić technikę, ocenić regenerację i nauczyć się prawidłowo postępować.',

    s11Heading: 'Regeneracja, która wymaga czasu',
    s11Body1:
      'Po porodzie jest normalne, że nie od razu odzyskuje się te same odczucia ani siłę mięśni co przed ciążą.',
    s11Body2:
      'Celem nie jest wykonanie jak największej liczby napięć. Chodzi raczej o stopniowe odzyskanie dobrej koordynacji między napinaniem a rozluźnianiem, a następnie naturalne wykorzystywanie tych mięśni w codziennych czynnościach.',
    s11HighlightTitle: 'Małe postępy to prawdziwe postępy',
    s11HighlightText:
      'Lepsza świadomość ruchu, kilka dodatkowych sekund napięcia lub zmniejszenie wycieków to już zachęcające oznaki.',

    s12Heading: 'Najważniejsze wnioski',
    summaryTitle: 'Najważniejsze',
    summaryItems: [
      'Ciąża i poród znacznie obciążają dno miednicy.',
      'Stopniowa regeneracja jest normalna po porodzie.',
      'W ćwiczeniach należy przedkładać jakość ruchu nad siłę.',
      'Oddychanie i rozluźnianie są równie ważne jak napinanie.',
      'Wycieki moczu, uczucie ciężkości lub uporczywy ból zasługują na opinię specjalisty.',
      'Rehabilitacja z położną lub fizjoterapeutą może pomóc odzyskać lepszą kontrolę.',
      'Powrót do sportu powinien być stopniowy, zwłaszcza w przypadku aktywności o dużym obciążeniu.',
    ],

    finalTipTitle: 'Daj sobie czas na regenerację',
    finalTipText:
      'Po porodzie Twoje ciało przeszło wiele zmian. Krocze zasługuje na tyle samo uwagi co reszta ciała: stopniowo, regularnie i bez presji.',

    disclaimerText:
      'Ten artykuł ma charakter wyłącznie informacyjny i nie zastępuje spersonalizowanej porady medycznej. Jeśli odczuwasz ból, uporczywe objawy lub masz jakiekolwiek obawy dotyczące regeneracji, zasięgnij porady specjalisty.',
  },
  uk: {
    badge: 'ПІСЛЯ ПОЛОГІВ • ВІДНОВЛЕННЯ',
    title: 'Зміцнення м’язів тазового дна\nпісля пологів',
    metaDuration: '8 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro:
      'Після вагітності та пологів м’язам тазового дна потрібен час для відновлення. Прості, регулярні й поступові вправи можуть допомогти повернути силу, контроль і впевненість, не намагаючись прискорити процес.',
    contentsTitle: 'У цій статті',
    topics: [
      'Розуміння ролі промежини',
      'Чому пологи її навантажують',
      'Коли розпочинати реабілітацію тазового дна',
      'Навчання правильного скорочення',
      'Побудова поступової рутини',
      'Помилки, яких варто уникати',
      'Коли просити допомоги',
      'Поступове відновлення спорту',
      'Підготовка до візиту',
      'Головні висновки',
    ],
    shareMessage: 'Зміцнення м’язів тазового дна після пологів — AWA',

    s1Heading: 'Розуміння ролі промежини',
    s1Body1:
      'Промежина, яку також називають тазовим дном, — це група м’язів, розташованих біля основи таза. Вона відіграє роль у контролі сечового міхура та кишечника й допомагає підтримувати органи таза.',
    s1Body2:
      'Під час вагітності ці м’язи мають кілька місяців нести додаткову вагу. Вони також зазнають значного навантаження під час пологів.',
    s1HighlightTitle: 'Непомітний, але необхідний м’яз',
    s1HighlightText:
      'Тазове дно бере участь у кількох щоденних функціях: утриманні сечі та калу, контролі газів, підтримці органів таза та відіграє роль у деяких статевих функціях.',

    benefitsHeading: 'Переваги міцнішого тазового дна',
    benefitsIntro:
      'Поступове, правильно виконуване зміцнення може допомогти покращити контроль і підтримку тазового дна.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Кращий контроль сечового міхура',
        text: 'Тазове дно відіграє роль у контролі сечового міхура. Його поступове зміцнення може допомогти зменшити деякі підтікання сечі.',
      },
      {
        icon: 'toilet',
        title: 'Підтримка функції кишечника',
        text: 'Ці м’язи також допомагають контролювати гази й кал та сприяють підтримці органів таза.',
      },
      {
        icon: 'human-female',
        title: 'Підтримка органів таза',
        text: 'Тазове дно утворює справжню м’язову основу, що допомагає підтримувати сечовий міхур, матку й кишечник.',
      },
      {
        icon: 'heart-pulse',
        title: 'Поступове повернення чутливості',
        text: 'Відповідна реабілітація також може допомогти відновити краще усвідомлення та контроль цієї ділянки.',
      },
    ],

    s2Heading: 'Чому вагітність і пологи її навантажують',
    s2Body1:
      'Вагітність поступово збільшує тиск на тазове дно. Природні пологи можуть потім значно розтягнути м’язи й тканини цієї ділянки.',
    s2Body2:
      'Кесарів розтин також не повністю щадить тазове дно: сама вагітність залишається для цих м’язів значним періодом.',
    s2Body3:
      'Тому після пологів нормально, що відновлення потребує часу. Деякі жінки майже не відчувають симптомів, інші можуть помічати підтікання, відчуття важкості чи знижений контроль м’язів.',
    s2TipTitle: 'Кожне відновлення різне',
    s2TipText:
      'На відновлення можуть впливати тип пологів, розрив або розріз промежини, наявність болю та ваш загальний стан після пологів.',

    s3Heading: 'Коли розпочинати реабілітацію тазового дна?',
    s3Body1:
      'Після неускладнених пологів м’які скорочення м’язів тазового дна зазвичай можна поступово відновлювати. Важливо й далі підлаштовувати вправи під вашу ситуацію та шукати поради, якщо було ускладнення, значний біль чи особлива процедура.',
    s3Body2:
      'Якщо у вас сечовий катетер, деякі рекомендації радять зачекати з вправами для промежини до його вилучення та відновлення нормального сечовипускання.',
    s3AlertTitle: 'Не долайте біль силою',
    s3AlertText:
      'Значний біль, погіршення симптомів, рана, що погано гоїться, чи будь-яке особливе занепокоєння потребують поради акушерки, лікаря або фахівця з реабілітації.',

    s4Heading: 'Навчання правильного скорочення',
    s4Body1:
      'Щоб відчути цей рух, уявіть, що ви намагаєтеся одночасно утримати гази й позив до сечовипускання. Рух, який ви шукаєте, — це відчуття скорочення й підтягування всередину.',
    s4Body2:
      'Мета — не сильно напружити все тіло. Сідниці, стегна й м’язи живота мають залишатися максимально розслабленими, а дихання — тривати нормально.',
    exercises: [
      {icon: 'weather-windy', label: 'Дихання'},
      {icon: 'human-handsup', label: 'М’яке скорочення'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Тривале скорочення'},
      {icon: 'gesture-tap-button', label: 'Швидкі скорочення'},
    ],
    s4HighlightTitle: 'Розслаблення так само важливе',
    s4HighlightText:
      'Після кожного скорочення дайте м’язам повністю розслабитися. Добра реабілітація не означає тримати промежину напруженою цілий день.',

    s5Heading: 'Побудова поступової рутини',
    s5Body1:
      'Спочатку найважливіше — навчитися розпізнавати м’язи й правильно виконувати рух. Регулярність важливіша за інтенсивність.',
    s5h3a: 'Тривалі скорочення',
    s5Body2:
      'М’яко скоротіть тазове дно, потім утримуйте скорочення кілька секунд, не затримуючи дихання. Потім повністю розслабте, перш ніж починати знову.',
    s5h3b: 'Короткі скорочення',
    s5Body3:
      'Коли рух освоєно, можна додати невеликі швидкі скорочення. Вони тренують здатність швидко скорочувати м’язи, коли зростає внутрішньочеревний тиск, наприклад, безпосередньо перед кашлем чи чханням.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Поєднуйте вправи зі щоденною звичкою'},
      {icon: 'human-sitting', label: 'Починайте у зручному положенні'},
      {icon: 'weather-windy', label: 'Дихайте нормально під час скорочень'},
      {icon: 'sleep', label: 'Дотримуйтеся фаз розслаблення'},
      {icon: 'chart-line', label: 'Поступово підвищуйте складність'},
      {icon: 'doctor', label: 'Попросіть поради, якщо не впевнені'},
    ],
    s5TipTitle: 'Насамперед регулярність',
    s5TipText:
      'Поєднання вправ зі звичкою, що вже є частиною вашого дня, може полегшити регулярність: після годування, після чищення зубів чи в інший зручний для вас час.',

    s6Heading: 'Поширені помилки, яких варто уникати',
    s6Body1:
      'Вправи для промежини можуть здаватися простими, але легко почати компенсувати іншими м’язами або надто сильно напружуватися.',
    commonMistakes: [
      'Напруження сідниць чи стегон замість тазового дна',
      'Затримка дихання під час скорочення',
      'Постійне тримання м’язів скороченими без розслаблення',
      'Виконання вправ лише кілька днів, а потім припинення',
      'Навмисне переривання струменя сечі для перевірки скорочення',
    ],
    s6TipTitle: 'Чого не робити',
    s6TipText:
      'Не рекомендується виконувати вправи шляхом навмисного переривання струменя сечі. Цей метод неправильно тренує промежину й може порушувати нормальну функцію сечового міхура.',

    s7Heading: 'Які симптоми мають спонукати до візиту?',
    s7Body1:
      'Незначні підтікання або незвичні відчуття можуть іноді з’являтися після пологів. Проте їх не слід ігнорувати, якщо вони зберігаються, посилюються або заважають повсякденному життю.',
    warningSigns: [
      'Підтікання сечі під час кашлю, чхання, сміху чи напруження',
      'Відчуття важкості або тиску в нижній частині таза',
      'Відчуття, що в піхву опускається грудка чи щось інше',
      'Труднощі з утриманням газів чи калу',
      'Стійкий біль у промежині',
      'Біль під час або після статевого акту',
      'Труднощі з розпізнаванням або правильним скороченням м’язів промежини',
    ],
    consultLabel: 'Коли звертатися за порадою?',
    s7Body2:
      'Акушерка, лікар або фізіотерапевт, що спеціалізується на реабілітації тазового дна, може перевірити роботу м’язів і запропонувати відповідну програму.',

    s8Heading: 'А після розриву, розрізу промежини чи кесаревого розтину?',
    s8Body1:
      'Розрив або розріз промежини потребує особливої турботи під час загоєння. Відновлення активності має враховувати біль, стан рубця й вказівки, отримані після пологів.',
    s8Body2:
      'Після кесаревого розтину відновлення також стосується черевної стінки й рубця. Навіть якщо пологи не були природними, сама вагітність також навантажила тазове дно.',
    s8HighlightTitle: 'Персоналізований догляд може допомогти',
    s8HighlightText:
      'У разі значного розриву, болю, симптомів з боку сечової системи чи кишечника або стійких труднощів оцінка в медичного фахівця може бути особливо корисною.',

    s9Heading: 'Поступове відновлення спорту',
    s9Body1:
      'Повернення до руху після пологів має бути поступовим. Ходьбу та м’які рухи зазвичай можна відновлювати відповідно до самопочуття, тоді як активності з високим навантаженням потребують більшої обережності.',
    s9Body2:
      'Перш ніж відновлювати біг, стрибки чи дуже інтенсивні тренування, найкраще оцінити відновлення тазового дна й врахувати будь-які симптоми.',
    s9AlertTitle: 'Не поспішайте з етапами',
    s9AlertText:
      'Підтікання, відчуття важкості чи біль під час вправ або після них — ознаки, що слід сповільнитися й попросити поради, перш ніж збільшувати інтенсивність.',

    s10Heading: 'Коли звертатися до спеціаліста?',
    s10Body1:
      'Реабілітація тазового дна з акушеркою чи фізіотерапевтом може бути корисною, якщо ви не впевнені, чи правильно скорочуєте, якщо симптоми зберігаються або якщо хочете впевнено повернутися до певних фізичних активностей.',
    questionCardTitle: 'Корисні запитання',
    appointmentQuestions: [
      'Чи відповідають мої симптоми слабкості тазового дна?',
      'Чи правильно я виконую скорочення?',
      'Скільки повторень я маю виконувати щодня?',
      'Чи можу я повернутися до бігу, спорту чи вправ із високим навантаженням?',
      'Чи потрібна мені реабілітація з акушеркою чи фізіотерапевтом?',
      'Чи потребує мій рубець, розрив або кесарів розтин особливих застережень?',
    ],
    s10TipTitle: 'Варто знати',
    s10TipText:
      'Візит до спеціаліста не обов’язково означає, що щось не так. Сеанс може просто допомогти перевірити техніку, оцінити відновлення й навчитися правильно прогресувати.',

    s11Heading: 'Відновлення, що потребує часу',
    s11Body1:
      'Після пологів нормально, що ви не одразу відновлюєте ті самі відчуття чи силу м’язів, що були до вагітності.',
    s11Body2:
      'Мета — не виконати якомога більше скорочень. Йдеться радше про поступове відновлення доброї координації між скороченням і розслабленням, а потім про природне використання цих м’язів у повсякденних справах.',
    s11HighlightTitle: 'Маленькі успіхи — справжні успіхи',
    s11HighlightText:
      'Краще усвідомлення руху, кілька додаткових секунд скорочення чи зменшення підтікань — це вже обнадійливі ознаки.',

    s12Heading: 'Головні висновки',
    summaryTitle: 'Головне',
    summaryItems: [
      'Вагітність і пологи значно навантажують тазове дно.',
      'Поступове відновлення нормальне після пологів.',
      'У вправах слід надавати перевагу якості руху над силою.',
      'Дихання й розслаблення так само важливі, як і скорочення.',
      'Підтікання сечі, відчуття важкості чи стійкий біль заслуговують на думку фахівця.',
      'Реабілітація з акушеркою чи фізіотерапевтом може допомогти повернути кращий контроль.',
      'Повернення до спорту має бути поступовим, особливо для активностей із високим навантаженням.',
    ],

    finalTipTitle: 'Дайте собі час на відновлення',
    finalTipText:
      'Після пологів ваше тіло пережило багато змін. Промежина заслуговує на стільки ж уваги, скільки й решта тіла: поступово, регулярно й без тиску.',

    disclaimerText:
      'Ця стаття має виключно інформаційний характер і не замінює персоналізованої медичної поради. Якщо ви відчуваєте біль, стійкі симптоми або маєте будь-які побоювання щодо відновлення, зверніться за порадою до медичного фахівця.',
  },
  cs: {
    badge: 'PO PORODU • ZOTAVENÍ',
    title: 'Posílení pánevního dna\npo porodu',
    metaDuration: '8 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro:
      'Po těhotenství a porodu potřebuje pánevní dno čas na zotavení. Jednoduchá, pravidelná a postupná cvičení vám mohou pomoci znovu získat sílu, kontrolu a sebedůvěru, aniž byste se snažila věci uspěchat.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopení role hráze',
      'Proč ji porod zatěžuje',
      'Kdy zahájit rehabilitaci pánevního dna',
      'Naučit se správně stahovat',
      'Vybudování postupné rutiny',
      'Chyby, kterým se vyhnout',
      'Kdy požádat o pomoc',
      'Postupné obnovení sportu',
      'Příprava na návštěvu',
      'Hlavní poznatky',
    ],
    shareMessage: 'Posílení pánevního dna po porodu — AWA',

    s1Heading: 'Pochopení role hráze',
    s1Body1:
      'Hráz, nazývaná také pánevní dno, je skupina svalů umístěná na spodině pánve. Podílí se na kontrole močového měchýře a střev a pomáhá podpírat pánevní orgány.',
    s1Body2:
      'Během těhotenství musejí tyto svaly několik měsíců nést zvýšenou zátěž. Značně namáhány jsou také při porodu.',
    s1HighlightTitle: 'Nenápadný, ale zásadní sval',
    s1HighlightText:
      'Pánevní dno se podílí na několika každodenních funkcích: zadržování moči a stolice, kontrole plynů, podpoře pánevních orgánů a roli v některých sexuálních funkcích.',

    benefitsHeading: 'Přínosy silnějšího pánevního dna',
    benefitsIntro:
      'Postupné, správně prováděné posilování může pomoci zlepšit kontrolu a oporu pánevního dna.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Lepší kontrola močového měchýře',
        text: 'Pánevní dno hraje roli při kontrole močového měchýře. Jeho postupné posilování může pomoci snížit některé úniky moči.',
      },
      {
        icon: 'toilet',
        title: 'Podpora funkce střev',
        text: 'Tyto svaly také pomáhají kontrolovat plyny a stolici a přispívají k podpoře pánevních orgánů.',
      },
      {
        icon: 'human-female',
        title: 'Podpora pánevních orgánů',
        text: 'Pánevní dno tvoří skutečný svalový základ, který pomáhá podpírat močový měchýř, dělohu a střevo.',
      },
      {
        icon: 'heart-pulse',
        title: 'Postupné znovuzískání citu',
        text: 'Vhodná rehabilitace vám také může pomoci znovu získat lepší povědomí a kontrolu nad touto oblastí.',
      },
    ],

    s2Heading: 'Proč těhotenství a porod pánevní dno zatěžují',
    s2Body1:
      'Těhotenství postupně vyvíjí na pánevní dno větší tlak. Vaginální porod pak může svaly a tkáně v této oblasti výrazně natáhnout.',
    s2Body2:
      'Ani císařský řez pánevní dno úplně neušetří: samotné těhotenství zůstává pro tyto svaly významným obdobím.',
    s2Body3:
      'Po porodu je proto normální, že zotavení trvá. Některé ženy téměř nepociťují žádné příznaky, jiné mohou zaznamenat úniky, pocit tíhy nebo sníženou kontrolu svalů.',
    s2TipTitle: 'Každé zotavení je jiné',
    s2TipText:
      'Zotavení může ovlivnit typ porodu, natržení nebo nástřih hráze, přítomnost bolesti a váš celkový stav po porodu.',

    s3Heading: 'Kdy zahájit rehabilitaci pánevního dna?',
    s3Body1:
      'Po nekomplikovaném porodu lze obvykle postupně obnovit jemné stahy pánevního dna. Zůstává důležité přizpůsobit cvičení své situaci a vyhledat radu, pokud jste měla komplikaci, výraznou bolest nebo konkrétní zákrok.',
    s3Body2:
      'Pokud máte močový katétr, některá doporučení radí počkat s cvičením hráze, dokud nebude odstraněn a nezačne normální močení.',
    s3AlertTitle: 'Nepřekonávejte bolest',
    s3AlertText:
      'Výrazná bolest, zhoršující se příznaky, špatně se hojící rána nebo jakákoli konkrétní obava vyžadují radu porodní asistentky, lékaře nebo odborníka na rehabilitaci.',

    s4Heading: 'Naučit se správně stahovat',
    s4Body1:
      'K rozpoznání pohybu si představte, že se snažíte zadržet plyny a zároveň nutkání na močení. Hledaný pohyb je pocit stahu a zvedání dovnitř.',
    s4Body2:
      'Cílem není napínat celé tělo. Hýždě, stehna a břišní svaly by měly zůstat co nejuvolněnější, zatímco dýchání pokračuje normálně.',
    exercises: [
      {icon: 'weather-windy', label: 'Dýchání'},
      {icon: 'human-handsup', label: 'Jemný stah'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Dlouhý stah'},
      {icon: 'gesture-tap-button', label: 'Rychlé stahy'},
    ],
    s4HighlightTitle: 'Uvolnění je stejně důležité',
    s4HighlightText:
      'Po každém stahu nechte svaly úplně uvolnit. Dobrá rehabilitace neznamená držet hráz stažený celý den.',

    s5Heading: 'Vybudování postupné rutiny',
    s5Body1:
      'Zpočátku je nejdůležitější naučit se svaly rozpoznat a provádět pohyb správně. Důležitější je pravidelnost než intenzita.',
    s5h3a: 'Dlouhé stahy',
    s5Body2:
      'Jemně stáhněte pánevní dno, poté stah několik vteřin držte, aniž byste zadržovala dech. Poté úplně uvolněte, než začnete znovu.',
    s5h3b: 'Krátké stahy',
    s5Body3:
      'Jakmile pohyb ovládnete, lze přidat malé rychlé stahy. Pomáhají trénovat schopnost rychle stáhnout svaly, když stoupne tlak v břiše, například těsně před kašlem nebo kýcháním.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Spojte cvičení s denním návykem'},
      {icon: 'human-sitting', label: 'Začněte v pohodlné poloze'},
      {icon: 'weather-windy', label: 'Během stahů dýchejte normálně'},
      {icon: 'sleep', label: 'Dodržujte fáze uvolnění'},
      {icon: 'chart-line', label: 'Postupně zvyšujte náročnost'},
      {icon: 'doctor', label: 'Pokud si nejste jistá, požádejte o radu'},
    ],
    s5TipTitle: 'Především pravidelnost',
    s5TipText:
      'Spojení cvičení s návykem, který už je součástí vašeho dne, může usnadnit pravidelnost: po kojení, po čištění zubů nebo v jinou vhodnou chvíli.',

    s6Heading: 'Časté chyby, kterým se vyhnout',
    s6Body1:
      'Cvičení hráze může vypadat jednoduše, ale snadno se stane, že kompenzujete jinými svaly nebo tlačíte příliš silně.',
    commonMistakes: [
      'Napínání hýždí nebo stehen místo pánevního dna',
      'Zadržování dechu během stahu',
      'Neustálé držení svalů ve stažení bez uvolnění',
      'Cvičení jen několik dní a pak přestat',
      'Záměrné zastavování proudu moči ke kontrole stahu',
    ],
    s6TipTitle: 'Co nedělat',
    s6TipText:
      'Nedoporučuje se cvičit záměrným zastavováním proudu moči. Tato metoda hráz správně netrénuje a může narušit normální funkci močového měchýře.',

    s7Heading: 'Které příznaky by měly vést ke konzultaci?',
    s7Body1:
      'Po porodu se mohou občas objevit drobné úniky nebo neobvyklý pocit. Neměly by se však ignorovat, pokud přetrvávají, zhoršují se nebo narušují váš každodenní život.',
    warningSigns: [
      'Úniky moči při kašli, kýchání, smíchu nebo namáhání',
      'Pocit tíhy nebo tlaku v dolní části pánve',
      'Pocit, že se do pochvy něco propadá nebo vystupuje',
      'Potíže se zadržením plynů nebo stolice',
      'Přetrvávající bolest hráze',
      'Bolest při pohlavním styku nebo po něm',
      'Potíže s rozpoznáním nebo správným stahem svalů hráze',
    ],
    consultLabel: 'Kdy vyhledat radu?',
    s7Body2:
      'Porodní asistentka, lékař nebo fyzioterapeut specializovaný na rehabilitaci pánevního dna může zkontrolovat funkci svalů a navrhnout vhodný program.',

    s8Heading: 'A po natržení, nástřihu hráze nebo císařském řezu?',
    s8Body1:
      'Natržení nebo nástřih hráze vyžaduje během hojení zvláštní péči. Při obnovování aktivit je třeba zohlednit bolest, stav jizvy a pokyny dané po porodu.',
    s8Body2:
      'Po císařském řezu se zotavení týká také břišní stěny a jizvy. I když porod nebyl vaginální, samotné těhotenství pánevní dno zatížilo.',
    s8HighlightTitle: 'Může pomoci personalizovaná péče',
    s8HighlightText:
      'V případě výrazného natržení, bolesti, močových nebo střevních příznaků či přetrvávajících potíží může být obzvlášť užitečné vyšetření u zdravotnického pracovníka.',

    s9Heading: 'Postupné obnovení sportu',
    s9Body1:
      'Obnovení pohybu po porodu by mělo být postupné. Chůzi a jemné pohyby lze obecně obnovit podle toho, jak se cítíte, zatímco aktivity s vysokým nárazem vyžadují větší opatrnost.',
    s9Body2:
      'Než obnovíte běh, skákání nebo velmi intenzivní trénink, je nejlepší posoudit zotavení pánevního dna a zohlednit případné příznaky.',
    s9AlertTitle: 'Nespěchejte s jednotlivými fázemi',
    s9AlertText:
      'Úniky, pocit tíhy nebo bolest při cvičení či po něm jsou znamení, že byste měla zpomalit a před zvýšením intenzity vyhledat radu.',

    s10Heading: 'Kdy navštívit odborníka?',
    s10Body1:
      'Rehabilitace pánevního dna u porodní asistentky nebo fyzioterapeuta může být užitečná, pokud si nejste jistá, že stahujete správně, pokud příznaky přetrvávají nebo pokud chcete s jistotou obnovit některé fyzické aktivity.',
    questionCardTitle: 'Užitečné otázky',
    appointmentQuestions: [
      'Odpovídají moje příznaky slabosti pánevního dna?',
      'Provádím stahy správně?',
      'Kolik opakování mám denně dělat?',
      'Mohu se vrátit k běhu, sportu nebo cvičení s vysokým nárazem?',
      'Potřebuji rehabilitaci u porodní asistentky nebo fyzioterapeuta?',
      'Vyžaduje moje jizva, natržení nebo císařský řez nějaká zvláštní opatření?',
    ],
    s10TipTitle: 'Stojí za to vědět',
    s10TipText:
      'Návštěva odborníka nemusí nutně znamenat, že je něco špatně. Návštěva může jednoduše pomoci zkontrolovat techniku, posoudit zotavení a naučit se správně postupovat.',

    s11Heading: 'Zotavení, které vyžaduje čas',
    s11Body1:
      'Po porodu je normální, že hned nezískáte zpět stejné pocity nebo svalovou sílu, jakou jste měla před těhotenstvím.',
    s11Body2:
      'Cílem není udělat co nejvíc stahů. Jde spíše o postupné obnovení dobré koordinace mezi stahem a uvolněním a poté o schopnost přirozeně tyto svaly využívat při každodenních činnostech.',
    s11HighlightTitle: 'Malý pokrok je skutečný pokrok',
    s11HighlightText:
      'Lepší povědomí o pohybu, několik vteřin delší stah nebo úbytek úniků jsou již povzbudivé znaky.',

    s12Heading: 'Hlavní poznatky',
    summaryTitle: 'To nejdůležitější',
    summaryItems: [
      'Těhotenství a porod výrazně zatěžují pánevní dno.',
      'Postupné zotavení je po porodu normální.',
      'Cvičení by mělo upřednostňovat kvalitu pohybu před silou.',
      'Dýchání a uvolnění jsou stejně důležité jako stah.',
      'Úniky moči, pocit tíhy nebo přetrvávající bolest si zaslouží odborný názor.',
      'Rehabilitace u porodní asistentky nebo fyzioterapeuta vám může pomoci znovu získat lepší kontrolu.',
      'Návrat ke sportu by měl být postupný, zejména u aktivit s vysokým nárazem.',
    ],

    finalTipTitle: 'Dopřejte si čas na zotavení',
    finalTipText:
      'Po porodu prošlo vaše tělo mnoha změnami. Hráz si zaslouží stejnou pozornost jako zbytek vašeho těla: postupně, pravidelně a bez tlaku.',

    disclaimerText:
      'Tento článek je pouze informativní a nenahrazuje individuální lékařskou radu. Pokud pociťujete bolest, přetrvávající příznaky nebo máte jakékoli obavy o své zotavení, vyhledejte radu zdravotnického pracovníka.',
  },
  sk: {
    badge: 'PO PÔRODE • ZOTAVENIE',
    title: 'Posilnenie panvového dna\npo pôrode',
    metaDuration: '8 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro:
      'Po tehotenstve a pôrode potrebuje panvové dno čas na zotavenie. Jednoduché, pravidelné a postupné cvičenia vám môžu pomôcť získať späť silu, kontrolu a istotu, bez snahy veci urýchliť.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopenie úlohy hrádze',
      'Prečo je pri pôrode zaťažená',
      'Kedy začať rehabilitáciu panvového dna',
      'Učenie sa správneho sťahu',
      'Budovanie postupnej rutiny',
      'Chyby, ktorým sa treba vyhnúť',
      'Kedy požiadať o pomoc',
      'Postupné obnovenie športu',
      'Príprava na návštevu',
      'Hlavné body',
    ],
    shareMessage: 'Posilnenie panvového dna po pôrode — AWA',

    s1Heading: 'Pochopenie úlohy hrádze',
    s1Body1:
      'Hrádza, nazývaná aj panvové dno, je skupina svalov nachádzajúcich sa na báze panvy. Zohráva úlohu pri kontrole močového mechúra a čriev a pomáha podopierať panvové orgány.',
    s1Body2:
      'Počas tehotenstva musia tieto svaly niekoľko mesiacov niesť dodatočnú záťaž. Pri pôrode sú tiež vystavené značnému zaťaženiu.',
    s1HighlightTitle: 'Nenápadný, ale nevyhnutný sval',
    s1HighlightText:
      'Panvové dno sa podieľa na niekoľkých každodenných funkciách: zadržiavanie moču a stolice, kontrola plynov, podpora panvových orgánov a úloha pri niektorých sexuálnych funkciách.',

    benefitsHeading: 'Prínosy silnejšieho panvového dna',
    benefitsIntro:
      'Postupné a správne vykonávané posilňovanie môže pomôcť zlepšiť kontrolu a oporu panvového dna.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Lepšia kontrola močového mechúra',
        text: 'Panvové dno zohráva úlohu pri kontrole močového mechúra. Jeho postupné posilňovanie môže pomôcť znížiť niektoré úniky moču.',
      },
      {
        icon: 'toilet',
        title: 'Podpora funkcie čriev',
        text: 'Tieto svaly tiež pomáhajú kontrolovať plyny a stolicu a prispievajú k podpore panvových orgánov.',
      },
      {
        icon: 'human-female',
        title: 'Podpora panvových orgánov',
        text: 'Panvové dno tvorí skutočný svalový základ, ktorý pomáha podopierať močový mechúr, maternicu a črevo.',
      },
      {
        icon: 'heart-pulse',
        title: 'Postupné opätovné získavanie citu',
        text: 'Vhodná rehabilitácia vám môže pomôcť získať lepšie uvedomenie a kontrolu tejto oblasti.',
      },
    ],

    s2Heading: 'Prečo je pri tehotenstve a pôrode zaťažené',
    s2Body1:
      'Tehotenstvo postupne zvyšuje tlak na panvové dno. Vaginálny pôrod potom môže svaly a tkanivá tejto oblasti výrazne natiahnuť.',
    s2Body2:
      'Ani cisársky rez panvové dno úplne nešetrí: samotné tehotenstvo zostáva pre tieto svaly významným obdobím.',
    s2Body3:
      'Po pôrode je teda normálne, že zotavenie trvá. Niektoré ženy pociťujú takmer žiadne príznaky, iné si môžu všimnúť úniky, pocit ťažoby alebo zníženú kontrolu svalov.',
    s2TipTitle: 'Každé zotavenie je iné',
    s2TipText:
      'Typ pôrodu, natrhnutie alebo nástrih hrádze, prítomnosť bolesti a váš celkový stav po pôrode môžu všetky ovplyvniť zotavenie.',

    s3Heading: 'Kedy začať rehabilitáciu panvového dna?',
    s3Body1:
      'Po nekomplikovanom pôrode sa jemné sťahy panvového dna zvyčajne môžu postupne obnoviť. Zostáva dôležité prispôsobiť cvičenia vašej situácii a vyhľadať radu, ak ste mali komplikáciu, výraznú bolesť alebo osobitný zákrok.',
    s3Body2:
      'Ak máte močový katéter, niektoré odporúčania navrhujú počkať, kým bude odstránený a obnoví sa normálne močenie, než začnete s cvičeniami hrádze.',
    s3AlertTitle: 'Bolesť nepreťahujte',
    s3AlertText:
      'Výrazná bolesť, zhoršujúce sa príznaky, zle sa hojaca rana alebo akákoľvek osobitná obava vyžadujú radu pôrodnej asistentky, lekára alebo rehabilitačného odborníka.',

    s4Heading: 'Učenie sa správneho sťahu',
    s4Body1:
      'Na identifikáciu pohybu si predstavte, že sa snažíte zadržať plyny a nutkanie na močenie súčasne. Pohyb, ktorý hľadáte, je pocit sťahu a zdvihu smerom dovnútra.',
    s4Body2:
      'Cieľom nie je pevne napnúť celé telo. Sedacie svaly, stehná a brušné svaly by mali zostať čo najuvoľnenejšie, zatiaľ čo dýchanie pokračuje normálne.',
    exercises: [
      {icon: 'weather-windy', label: 'Dýchanie'},
      {icon: 'human-handsup', label: 'Jemný sťah'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Dlhý sťah'},
      {icon: 'gesture-tap-button', label: 'Rýchle sťahy'},
    ],
    s4HighlightTitle: 'Uvoľnenie je rovnako dôležité',
    s4HighlightText:
      'Po každom sťahu nechajte svaly úplne uvoľniť. Dobrá rehabilitácia neznamená držať hrádzu stiahnutú celý deň.',

    s5Heading: 'Budovanie postupnej rutiny',
    s5Body1:
      'Spočiatku je najdôležitejšie naučiť sa svaly identifikovať a vykonať pohyb správne. Pravidelnosť je dôležitejšia než intenzita.',
    s5h3a: 'Dlhé sťahy',
    s5Body2:
      'Jemne stiahnite panvové dno a potom sťah niekoľko sekúnd držte bez zadržiavania dychu. Potom úplne uvoľnite, kým začnete znova.',
    s5h3b: 'Krátke sťahy',
    s5Body3:
      'Keď pohyb zvládnete, môžete pridať malé rýchle sťahy. Pomáhajú trénovať schopnosť rýchlo stiahnuť svaly, keď sa zvýši brušný tlak, napríklad tesne pred kašľom alebo kýchnutím.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Spojte cvičenia s každodenným návykom'},
      {icon: 'human-sitting', label: 'Začnite v pohodlnej polohe'},
      {icon: 'weather-windy', label: 'Pri sťahoch dýchajte normálne'},
      {icon: 'sleep', label: 'Dodržiavajte fázy uvoľnenia'},
      {icon: 'chart-line', label: 'Postupne zvyšujte náročnosť'},
      {icon: 'doctor', label: 'Ak si nie ste istá, požiadajte o radu'},
    ],
    s5TipTitle: 'Predovšetkým pravidelnosť',
    s5TipText:
      'Spojenie cvičení s návykom, ktorý už je súčasťou vášho dňa, môže uľahčiť pravidelnosť: po kŕmení, po čistení zubov alebo v inom vhodnom čase.',

    s6Heading: 'Časté chyby, ktorým sa treba vyhnúť',
    s6Body1:
      'Cvičenia hrádze môžu vyzerať jednoducho, ale je ľahké kompenzovať inými svalmi alebo príliš tlačiť.',
    commonMistakes: [
      'Napínanie sedacích svalov alebo stehien namiesto panvového dna',
      'Zadržiavanie dychu počas sťahu',
      'Neustále udržiavanie svalov stiahnutých bez toho, aby sa uvoľnili',
      'Cvičenie len niekoľko dní a potom prestať',
      'Zámerné zastavovanie prúdu moču na kontrolu sťahu',
    ],
    s6TipTitle: 'Čo nerobiť',
    s6TipText:
      'Neodporúča sa cvičiť zámerným zastavovaním prúdu moču. Táto metóda hrádzu netrénuje správne a môže narušiť normálnu funkciu močového mechúra.',

    s7Heading: 'Aké príznaky by mali viesť ku konzultácii?',
    s7Body1:
      'Po pôrode sa môžu niekedy objaviť drobné úniky alebo nezvyčajný pocit. Nemali by sa však ignorovať, ak pretrvávajú, zhoršujú sa alebo zasahujú do vášho každodenného života.',
    warningSigns: [
      'Úniky moču pri kašli, kýchaní, smiechu alebo námahe',
      'Pocit ťažoby alebo tlaku v dolnej časti panvy',
      'Pocit, že niečo klesá do pošvy',
      'Ťažkosti so zadržaním plynov alebo stolice',
      'Pretrvávajúca bolesť v hrádzi',
      'Bolesť pri pohlavnom styku alebo po ňom',
      'Ťažkosti s identifikáciou alebo správnym sťahom svalov hrádze',
    ],
    consultLabel: 'Kedy požiadať o radu?',
    s7Body2:
      'Pôrodná asistentka, lekár alebo fyzioterapeut so špecializáciou na rehabilitáciu panvového dna môže skontrolovať funkciu svalov a navrhnúť vhodný program.',

    s8Heading: 'A po natrhnutí, nástrihu hrádze alebo cisárskom reze?',
    s8Body1:
      'Natrhnutie alebo nástrih hrádze si vyžaduje osobitnú starostlivosť počas hojenia. Pri obnovení aktivít treba zohľadniť bolesť, stav jazvy a pokyny dané po pôrode.',
    s8Body2:
      'Po cisárskom reze zotavenie zahŕňa aj brušnú stenu a jazvu. Aj keď pôrod nebol vaginálny, samotné tehotenstvo panvové dno zaťažilo.',
    s8HighlightTitle: 'Individuálna starostlivosť môže pomôcť',
    s8HighlightText:
      'V prípade výrazného natrhnutia, bolesti, močových alebo črevných príznakov alebo pretrvávajúcich ťažkostí môže byť obzvlášť užitočné vyšetrenie u zdravotníckeho pracovníka.',

    s9Heading: 'Postupné obnovenie športu',
    s9Body1:
      'Obnovenie pohybu po pôrode by malo byť postupné. S chôdzou a jemnými pohybmi sa vo všeobecnosti môže začať podľa pocitu, zatiaľ čo aktivity s veľkým nárazom si vyžadujú väčšiu opatrnosť.',
    s9Body2:
      'Pred obnovením behu, skákania alebo veľmi intenzívneho tréningu je najlepšie posúdiť zotavenie panvového dna a zohľadniť prípadné príznaky.',
    s9AlertTitle: 'Nepreskakujte etapy',
    s9AlertText:
      'Úniky, pocit ťažoby alebo bolesť počas cvičenia alebo po ňom sú znakmi, že by ste mali spomaliť a vyhľadať radu pred zvýšením intenzity.',

    s10Heading: 'Kedy navštíviť odborníka?',
    s10Body1:
      'Rehabilitácia panvového dna s pôrodnou asistentkou alebo fyzioterapeutom môže pomôcť, ak si nie ste istá, či sťahujete správne, ak príznaky pretrvávajú alebo ak chcete s istotou obnoviť určité fyzické aktivity.',
    questionCardTitle: 'Užitočné otázky',
    appointmentQuestions: [
      'Zodpovedajú moje príznaky oslabeniu panvového dna?',
      'Vykonávam sťahy správne?',
      'Koľko opakovaní denne mám robiť?',
      'Môžem sa vrátiť k behu, športu alebo cvičeniu s veľkým nárazom?',
      'Potrebujem rehabilitáciu s pôrodnou asistentkou alebo fyzioterapeutom?',
      'Vyžaduje moja jazva, natrhnutie alebo cisársky rez nejaké osobitné opatrenia?',
    ],
    s10TipTitle: 'Stojí za to vedieť',
    s10TipText:
      'Návšteva odborníka nemusí nutne znamenať, že je niečo v neporiadku. Návšteva môže jednoducho pomôcť skontrolovať techniku, posúdiť zotavenie a naučiť sa správne postupovať.',

    s11Heading: 'Zotavenie, ktoré si vyžaduje čas',
    s11Body1:
      'Po pôrode je normálne, že hneď nezískate späť rovnaké pocity alebo silu svalov, aké ste mali pred tehotenstvom.',
    s11Body2:
      'Cieľom nie je urobiť čo najviac sťahov. Ide skôr o postupné získavanie dobrej koordinácie medzi sťahom a uvoľnením a následne o prirodzené využívanie týchto svalov v každodenných činnostiach.',
    s11HighlightTitle: 'Malý pokrok je skutočný pokrok',
    s11HighlightText:
      'Lepšie uvedomenie pohybu, o pár sekúnd dlhší sťah alebo zníženie únikov sú už povzbudivé znaky.',

    s12Heading: 'Hlavné body',
    summaryTitle: 'To najdôležitejšie',
    summaryItems: [
      'Tehotenstvo a pôrod výrazne zaťažujú panvové dno.',
      'Postupné zotavenie je po pôrode normálne.',
      'Pri cvičeniach by mala mať prednosť kvalita pohybu pred silou.',
      'Dýchanie a uvoľnenie sú rovnako dôležité ako sťah.',
      'Úniky moču, ťažoba alebo pretrvávajúca bolesť si zaslúžia názor odborníka.',
      'Rehabilitácia s pôrodnou asistentkou alebo fyzioterapeutom vám môže pomôcť získať lepšiu kontrolu.',
      'Návrat k športu by mal byť postupný, najmä pri aktivitách s veľkým nárazom.',
    ],

    finalTipTitle: 'Doprajte si čas na zotavenie',
    finalTipText:
      'Po pôrode vaše telo prešlo mnohými zmenami. Hrádza si zaslúži rovnakú pozornosť ako zvyšok tela: postupne, pravidelne a bez tlaku.',

    disclaimerText:
      'Tento článok má iba informatívny charakter a nenahrádza individuálnu lekársku radu. Ak pociťujete bolesť, pretrvávajúce príznaky alebo máte akékoľvek obavy o svoje zotavenie, poraďte sa so zdravotníckym pracovníkom.',
  },
  hu: {
    badge: 'SZÜLÉS UTÁN • FELÉPÜLÉS',
    title: 'A medencefenék erősítése\nszülés után',
    metaDuration: '8 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'A terhesség és a szülés után a medencefenéknek időre van szüksége a felépüléshez. Az egyszerű, rendszeres és fokozatos gyakorlatok segíthetnek visszanyerni az erőt, az uralmat és az önbizalmat, anélkül, hogy siettetnéd a dolgokat.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A gát szerepének megértése',
      'Miért terhelődik meg a szülés során',
      'Mikor kezdd a medencefenék rehabilitációját',
      'A helyes összehúzás megtanulása',
      'Fokozatos rutin kialakítása',
      'Elkerülendő hibák',
      'Mikor kérj segítséget',
      'A sport fokozatos újrakezdése',
      'Felkészülés egy időpontra',
      'Legfontosabb tudnivalók',
    ],
    shareMessage: 'A medencefenék erősítése szülés után — AWA',

    s1Heading: 'A gát szerepének megértése',
    s1Body1:
      'A gát, más néven medencefenék, a medence alján elhelyezkedő izmok csoportja. Szerepet játszik a hólyag és a belek működésének kontrollálásában, és segít megtartani a medencei szerveket.',
    s1Body2:
      'A terhesség alatt ezeknek az izmoknak hónapokon át többletsúlyt kell hordozniuk. A szülés során szintén jelentős terhelésnek vannak kitéve.',
    s1HighlightTitle: 'Diszkrét, de nélkülözhetetlen izom',
    s1HighlightText:
      'A medencefenék számos mindennapi funkcióban vesz részt: a vizelet és a széklet visszatartásában, a gázok kontrollálásában, a medencei szervek megtartásában, és bizonyos szexuális funkciókban is szerepet játszik.',

    benefitsHeading: 'Az erősebb medencefenék előnyei',
    benefitsIntro:
      'A fokozatos, helyesen végzett erősítés segíthet javítani a medencefenék kontrollját és támaszát.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Jobb hólyagkontroll',
        text: 'A medencefenék szerepet játszik a hólyag kontrollálásában. Fokozatos erősítése segíthet csökkenteni bizonyos vizeletszivárgásokat.',
      },
      {
        icon: 'toilet',
        title: 'A bélműködés támogatása',
        text: 'Ezek az izmok a gázok és a széklet kontrollálásában is segítenek, és hozzájárulnak a medencei szervek megtartásához.',
      },
      {
        icon: 'human-female',
        title: 'A medencei szervek támogatása',
        text: 'A medencefenék valódi izmos alapot alkot, amely segít megtartani a hólyagot, a méhet és a beleket.',
      },
      {
        icon: 'heart-pulse',
        title: 'Az érzékelés fokozatos visszanyerése',
        text: 'A megfelelő rehabilitáció abban is segíthet, hogy jobban érezd és uralhasd ezt a területet.',
      },
    ],

    s2Heading: 'Miért terhelik meg a terhesség és a szülés',
    s2Body1:
      'A terhesség fokozatosan növeli a medencefenékre nehezedő nyomást. A hüvelyi szülés ezután jelentősen megnyújthatja ennek a területnek az izmait és szöveteit.',
    s2Body2:
      'A császármetszés sem kíméli teljesen a medencefeneket: maga a terhesség jelentős időszak marad ezeknek az izmoknak.',
    s2Body3:
      'A szülés után ezért normális, hogy a felépülés időt vesz igénybe. Egyes nők szinte semmilyen tünetet nem éreznek, mások szivárgást, nehézségérzetet vagy csökkent izomkontrollt vehetnek észre.',
    s2TipTitle: 'Minden felépülés más',
    s2TipText:
      'A szülés típusa, egy repedés vagy gátmetszés, a fájdalom jelenléte és a szülés utáni általános állapotod mind befolyásolhatják a felépülést.',

    s3Heading: 'Mikor kezdd a medencefenék rehabilitációját?',
    s3Body1:
      'Komplikációmentes szülés után a kíméletes medencefenék-összehúzások általában fokozatosan újrakezdhetők. Fontos marad a gyakorlatokat a helyzetedhez igazítani, és tanácsot kérni, ha komplikációd, jelentős fájdalmad vagy különleges beavatkozásod volt.',
    s3Body2:
      'Ha húgyhólyag-katétered van, egyes ajánlások szerint érdemes megvárni, amíg eltávolítják, és a normál vizelés helyreáll, mielőtt elkezdenéd a gátgyakorlatokat.',
    s3AlertTitle: 'Ne erőltesd a fájdalmat',
    s3AlertText:
      'A jelentős fájdalom, a romló tünetek, a rosszul gyógyuló seb vagy bármilyen különleges aggodalom szülésznő, orvos vagy rehabilitációs szakember tanácsát igényli.',

    s4Heading: 'A helyes összehúzás megtanulása',
    s4Body1:
      'A mozdulat azonosításához képzeld el, hogy egyszerre próbálod visszatartani a gázt és a vizelési ingert. A keresett mozdulat egy összehúzódás és befelé irányuló emelkedés érzete.',
    s4Body2:
      'A cél nem az, hogy az egész testedet szorosan megfeszítsd. A fenekednek, a combjaidnak és a hasizmaidnak a lehető legellazultabbnak kell maradnia, miközben a légzés normálisan folytatódik.',
    exercises: [
      {icon: 'weather-windy', label: 'Légzés'},
      {icon: 'human-handsup', label: 'Kíméletes összehúzás'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Hosszú összehúzás'},
      {icon: 'gesture-tap-button', label: 'Gyors összehúzások'},
    ],
    s4HighlightTitle: 'Az ellazulás ugyanolyan fontos',
    s4HighlightText:
      'Minden összehúzás után hagyd az izmokat teljesen ellazulni. A jó rehabilitáció nem azt jelenti, hogy a gátat egész nap összehúzva tartod.',

    s5Heading: 'Fokozatos rutin kialakítása',
    s5Body1:
      'Kezdetben a legfontosabb az izmok azonosításának és a mozdulat helyes elvégzésének megtanulása. A rendszeresség fontosabb az intenzitásnál.',
    s5h3a: 'Hosszú összehúzások',
    s5Body2:
      'Kíméletesen húzd össze a medencefeneket, majd tartsd az összehúzást néhány másodpercig a lélegzet visszatartása nélkül. Utána teljesen engedd el, mielőtt újrakezdenéd.',
    s5h3b: 'Rövid összehúzások',
    s5Body3:
      'Ha a mozdulatot elsajátítottad, kis gyors összehúzásokat is hozzáadhatsz. Ezek a hasi nyomás növekedésekor — például közvetlenül köhögés vagy tüsszentés előtt — az izmok gyors összehúzásának képességét edzik.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Kösd a gyakorlatokat egy napi szokáshoz'},
      {icon: 'human-sitting', label: 'Kezdd kényelmes testhelyzetben'},
      {icon: 'weather-windy', label: 'Az összehúzások alatt lélegezz normálisan'},
      {icon: 'sleep', label: 'Tartsd tiszteletben az ellazulási szakaszokat'},
      {icon: 'chart-line', label: 'Fokozatosan növeld a nehézséget'},
      {icon: 'doctor', label: 'Ha bizonytalan vagy, kérj tanácsot'},
    ],
    s5TipTitle: 'Mindenekelőtt a rendszeresség',
    s5TipText:
      'Ha a gyakorlatokat egy már a napod részét képező szokáshoz kötöd, könnyebb a rendszeresség: szoptatás után, fogmosás után vagy más, számodra megfelelő időpontban.',

    s6Heading: 'Gyakori hibák, amelyeket kerülj',
    s6Body1:
      'A gátgyakorlatok egyszerűnek tűnhetnek, de könnyű más izmokkal kompenzálni vagy túl erősen nyomni.',
    commonMistakes: [
      'A fenék vagy a combok megfeszítése a medencefenék helyett',
      'A lélegzet visszatartása az összehúzás alatt',
      'Az izmok állandó összehúzva tartása ellazulás nélkül',
      'A gyakorlatok csak néhány napig végzése, majd abbahagyása',
      'A vizeletáram szándékos megállítása az összehúzás ellenőrzésére',
    ],
    s6TipTitle: 'Amit ne csinálj',
    s6TipText:
      'Nem ajánlott a gyakorlatokat a vizeletáram szándékos megállításával végezni. Ez a módszer nem edzi helyesen a gátat, és megzavarhatja a hólyag normális működését.',

    s7Heading: 'Mely tünetek kell hogy konzultációra késztessenek?',
    s7Body1:
      'Szülés után néha enyhe szivárgás vagy szokatlan érzés jelentkezhet. Nem szabad azonban figyelmen kívül hagyni, ha fennmarad, romlik, vagy zavarja a mindennapi életedet.',
    warningSigns: [
      'Vizeletszivárgás köhögéskor, tüsszentéskor, nevetéskor vagy erőlködéskor',
      'Nehézség- vagy nyomásérzés az alsó medencében',
      'Az az érzés, hogy valami csomó vagy dolog süllyed a hüvelybe',
      'Nehézség a gázok vagy a széklet visszatartásában',
      'Tartós fájdalom a gátban',
      'Fájdalom nemi élet alatt vagy után',
      'Nehézség a gátizmok azonosításában vagy helyes összehúzásában',
    ],
    consultLabel: 'Mikor kérj tanácsot?',
    s7Body2:
      'Egy szülésznő, orvos vagy a medencefenék-rehabilitációra specializálódott gyógytornász ellenőrizheti az izomműködést, és megfelelő programot javasolhat.',

    s8Heading: 'És repedés, gátmetszés vagy császármetszés után?',
    s8Body1:
      'A repedés vagy gátmetszés különös gondosságot igényel a gyógyulás alatt. A tevékenységek újrakezdésekor figyelembe kell venni a fájdalmat, a heg állapotát és a szülés után kapott útmutatást.',
    s8Body2:
      'Császármetszés után a felépülés a hasfalat és a hegét is érinti. Még ha a szülés nem hüvelyi volt is, maga a terhesség így is terhelte a medencefeneket.',
    s8HighlightTitle: 'Az egyéni ellátás segíthet',
    s8HighlightText:
      'Jelentős repedés, fájdalom, húgyúti vagy bélrendszeri tünetek vagy tartós nehézségek esetén különösen hasznos lehet az egészségügyi szakemberrel végzett vizsgálat.',

    s9Heading: 'A sport fokozatos újrakezdése',
    s9Body1:
      'A szülés utáni mozgás újrakezdésének fokozatosnak kell lennie. A gyaloglás és a kíméletes mozgások általában a közérzeted szerint újrakezdhetők, míg a nagy ütéssel járó tevékenységek nagyobb óvatosságot igényelnek.',
    s9Body2:
      'A futás, ugrás vagy nagyon intenzív edzés újrakezdése előtt a legjobb felmérni a medencefenék felépülését, és figyelembe venni az esetleges tüneteket.',
    s9AlertTitle: 'Ne siettesd a szakaszokat',
    s9AlertText:
      'A szivárgás, a nehézségérzet vagy a fájdalom edzés közben vagy után jelzi, hogy lassítanod kell, és tanácsot kérned az intenzitás növelése előtt.',

    s10Heading: 'Mikor menj szakemberhez?',
    s10Body1:
      'A szülésznővel vagy gyógytornásszal végzett medencefenék-rehabilitáció segíthet, ha bizonytalan vagy abban, hogy helyesen húzod-e össze, ha a tüneteid fennmaradnak, vagy ha magabiztosan szeretnél újrakezdeni bizonyos fizikai tevékenységeket.',
    questionCardTitle: 'Hasznos kérdések',
    appointmentQuestions: [
      'A tüneteim megfelelnek a medencefenék gyengeségének?',
      'Helyesen végzem az összehúzásokat?',
      'Hány ismétlést kell naponta végeznem?',
      'Visszatérhetek a futáshoz, a sporthoz vagy a nagy ütéssel járó edzéshez?',
      'Szükségem van rehabilitációra szülésznővel vagy gyógytornásszal?',
      'A hegem, repedésem vagy császármetszésem igényel valamilyen különleges óvintézkedést?',
    ],
    s10TipTitle: 'Érdemes tudni',
    s10TipText:
      'A szakemberhez fordulás nem feltétlenül jelenti, hogy baj van. Egy alkalom egyszerűen segíthet ellenőrizni a technikádat, felmérni a felépülésedet, és megtanulni, hogyan haladj helyesen.',

    s11Heading: 'Időt igénylő felépülés',
    s11Body1:
      'A szülés után normális, hogy nem nyered vissza azonnal ugyanazokat az érzeteket vagy izomerőt, mint a terhesség előtt.',
    s11Body2:
      'A cél nem az, hogy minél több összehúzást végezz. Inkább az összehúzás és az ellazulás közötti jó koordináció fokozatos visszanyerése, majd az izmok természetes használata a mindennapi tevékenységekben.',
    s11HighlightTitle: 'A kis haladás is valódi haladás',
    s11HighlightText:
      'A mozdulat jobb érzékelése, néhány másodperccel hosszabb összehúzás vagy a szivárgás csökkenése már bátorító jelek.',

    s12Heading: 'Legfontosabb tudnivalók',
    summaryTitle: 'A lényeg',
    summaryItems: [
      'A terhesség és a szülés jelentős terhelést jelent a medencefenéknek.',
      'A szülés utáni fokozatos felépülés normális.',
      'A gyakorlatoknál a mozdulat minősége elsőbbséget élvez az erővel szemben.',
      'A légzés és az ellazulás ugyanolyan fontos, mint az összehúzás.',
      'A vizeletszivárgás, a nehézségérzet vagy a tartós fájdalom szakmai véleményt érdemel.',
      'A szülésznővel vagy gyógytornásszal végzett rehabilitáció segíthet jobb kontrollt visszanyerni.',
      'A sporthoz való visszatérésnek fokozatosnak kell lennie, különösen a nagy ütéssel járó tevékenységeknél.',
    ],

    finalTipTitle: 'Szánj időt a felépülésre',
    finalTipText:
      'A szülés után a tested sok változáson ment keresztül. A gát ugyanolyan figyelmet érdemel, mint a tested többi része: fokozatosan, rendszeresen és nyomás nélkül.',

    disclaimerText:
      'Ez a cikk kizárólag tájékoztató jellegű, és nem helyettesíti a személyre szabott orvosi tanácsot. Ha fájdalmat, tartós tüneteket tapasztalsz, vagy bármilyen aggodalmad van a felépülésed miatt, kérj tanácsot egészségügyi szakembertől.',
  },
  ro: {
    badge: 'POSTNATAL • RECUPERARE',
    title: 'Întărirea planșeului pelvian\ndupă naștere',
    metaDuration: '8 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro:
      'După sarcină și naștere, planșeul pelvian are nevoie de timp pentru a-și reveni. Exerciții simple, regulate și graduale te pot ajuta să-ți recapeți forța, controlul și încrederea, fără să încerci să grăbești lucrurile.',
    contentsTitle: 'În acest articol',
    topics: [
      'Înțelegerea rolului perineului',
      'De ce sarcina și nașterea îl solicită',
      'Când să începi recuperarea planșeului pelvian',
      'Învățarea contracției corecte',
      'Construirea unei rutine graduale',
      'Greșeli de evitat',
      'Când să ceri ajutor',
      'Reluarea treptată a sportului',
      'Pregătirea unei consultații',
      'Ce să reții',
    ],
    shareMessage: 'Întărirea planșeului pelvian după naștere — AWA',

    s1Heading: 'Înțelegerea rolului perineului',
    s1Body1:
      'Perineul, numit și planșeu pelvian, este un grup de mușchi situat la baza bazinului. El joacă un rol în controlul vezicii urinare și al intestinului și ajută la susținerea organelor pelviene.',
    s1Body2:
      'În timpul sarcinii, acești mușchi trebuie să poarte o greutate suplimentară timp de mai multe luni. Ei sunt, de asemenea, puternic solicitați în timpul nașterii.',
    s1HighlightTitle: 'Un mușchi discret, dar esențial',
    s1HighlightText:
      'Planșeul pelvian este implicat în mai multe funcții de zi cu zi: reținerea urinei și a scaunului, controlul gazelor, susținerea organelor pelviene și un rol în anumite funcții sexuale.',

    benefitsHeading: 'Beneficiile unui planșeu pelvian mai puternic',
    benefitsIntro:
      'O întărire graduală, efectuată corect, poate ajuta la îmbunătățirea controlului și a susținerii planșeului pelvian.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Un control mai bun al vezicii urinare',
        text: 'Planșeul pelvian joacă un rol în controlul vezicii urinare. Întărirea lui treptată poate ajuta la reducerea anumitor pierderi de urină.',
      },
      {
        icon: 'toilet',
        title: 'Susținerea funcției intestinale',
        text: 'Acești mușchi ajută și la controlul gazelor și al scaunului și contribuie la susținerea organelor pelviene.',
      },
      {
        icon: 'human-female',
        title: 'Susținerea organelor pelviene',
        text: 'Planșeul pelvian formează o adevărată bază musculară care ajută la susținerea vezicii urinare, a uterului și a intestinului.',
      },
      {
        icon: 'heart-pulse',
        title: 'Recăpătarea treptată a senzațiilor',
        text: 'O recuperare potrivită te poate ajuta și să-ți recapeți o mai bună conștientizare și un mai bun control al acestei zone.',
      },
    ],

    s2Heading: 'De ce sarcina și nașterea îl solicită',
    s2Body1:
      'Sarcina pune treptat tot mai multă presiune pe planșeul pelvian. Nașterea vaginală poate apoi întinde semnificativ mușchii și țesuturile din această zonă.',
    s2Body2:
      'Nici o cezariană nu scutește complet planșeul pelvian: sarcina în sine rămâne o perioadă importantă pentru acești mușchi.',
    s2Body3:
      'După naștere, este deci normal ca recuperarea să dureze. Unele femei nu simt aproape niciun simptom, în timp ce altele pot observa pierderi, o senzație de greutate sau un control muscular redus.',
    s2TipTitle: 'Fiecare recuperare este diferită',
    s2TipText:
      'Tipul nașterii, o ruptură sau o epiziotomie, prezența durerii și starea ta generală după naștere pot influența toate recuperarea.',

    s3Heading: 'Când să începi recuperarea planșeului pelvian?',
    s3Body1:
      'După o naștere fără complicații, contracțiile blânde ale planșeului pelvian pot fi de obicei reluate treptat. Rămâne important să adaptezi exercițiile la situația ta și să ceri un sfat dacă ai avut o complicație, durere importantă sau o procedură specifică.',
    s3Body2:
      'Dacă ai un cateter urinar, unele recomandări sugerează să aștepți până este scos și până când urinarea normală a fost reluată înainte de a începe exercițiile pentru perineu.',
    s3AlertTitle: 'Nu forța prin durere',
    s3AlertText:
      'O durere importantă, simptome care se agravează, o rană care se vindecă prost sau orice îngrijorare deosebită cer sfatul unei moașe, al unui medic sau al unui profesionist în recuperare.',

    s4Heading: 'Învățarea contracției corecte',
    s4Body1:
      'Pentru a identifica mișcarea, imaginează-ți că încerci să reții gazele și nevoia de a urina în același timp. Mișcarea pe care o cauți este o senzație de contracție și de ridicare spre interior.',
    s4Body2:
      'Scopul nu este să-ți încordezi strâns tot corpul. Fesele, coapsele și abdominalii ar trebui să rămână cât mai relaxați, în timp ce respirația continuă normal.',
    exercises: [
      {icon: 'weather-windy', label: 'Respirația'},
      {icon: 'human-handsup', label: 'Contracție blândă'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Contracție lungă'},
      {icon: 'gesture-tap-button', label: 'Contracții rapide'},
    ],
    s4HighlightTitle: 'Relaxarea contează la fel de mult',
    s4HighlightText:
      'După fiecare contracție, lasă mușchii să se relaxeze complet. O recuperare bună nu înseamnă să ții perineul contractat toată ziua.',

    s5Heading: 'Construirea unei rutine graduale',
    s5Body1:
      'La început, cel mai important lucru este să înveți să identifici mușchii și să efectuezi corect mișcarea. Constanța contează mai mult decât intensitatea.',
    s5h3a: 'Contracții lungi',
    s5Body2:
      'Contractă blând planșeul pelvian, apoi menține contracția câteva secunde fără să-ți ții respirația. Apoi relaxează-te complet înainte de a o lua de la capăt.',
    s5h3b: 'Contracții scurte',
    s5Body3:
      'Odată ce mișcarea este stăpânită, se pot adăuga mici contracții rapide. Ele ajută la antrenarea capacității de a contracta rapid mușchii atunci când presiunea abdominală crește, de exemplu chiar înainte de a tuși sau de a strănuta.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Asociază exercițiile cu un obicei zilnic'},
      {icon: 'human-sitting', label: 'Începe într-o poziție confortabilă'},
      {icon: 'weather-windy', label: 'Respiră normal în timpul contracțiilor'},
      {icon: 'sleep', label: 'Respectă fazele de relaxare'},
      {icon: 'chart-line', label: 'Crește treptat dificultatea'},
      {icon: 'doctor', label: 'Cere un sfat dacă ai îndoieli'},
    ],
    s5TipTitle: 'Constanța înainte de toate',
    s5TipText:
      'Asocierea exercițiilor cu un obicei deja prezent în ziua ta poate face mai ușoară menținerea constanței: după o masă de alăptare, după spălatul pe dinți sau la un alt moment care ți se potrivește.',

    s6Heading: 'Greșeli frecvente de evitat',
    s6Body1:
      'Exercițiile pentru perineu pot părea simple, dar este ușor să compensezi cu alți mușchi sau să forțezi prea tare.',
    commonMistakes: [
      'Încordarea fesierilor sau a coapselor în loc de planșeul pelvian',
      'Ținerea respirației în timpul contracției',
      'Menținerea mușchilor contractați constant, fără a-i lăsa să se relaxeze',
      'Efectuarea exercițiilor doar câteva zile, apoi oprirea',
      'Oprirea deliberată a jetului de urină pentru a verifica contracția',
    ],
    s6TipTitle: 'Ce să nu faci',
    s6TipText:
      'Nu se recomandă exersarea exercițiilor prin oprirea deliberată a jetului de urină. Această metodă nu antrenează corect perineul și poate perturba funcționarea normală a vezicii urinare.',

    s7Heading: 'Ce simptome ar trebui să te determine să ceri o consultație?',
    s7Body1:
      'Mici pierderi sau o senzație neobișnuită pot apărea uneori după naștere. Totuși, nu trebuie ignorate dacă persistă, se agravează sau îți perturbă viața de zi cu zi.',
    warningSigns: [
      'Pierderi de urină atunci când tușești, strănuți, râzi sau faci un efort',
      'O senzație de greutate sau de presiune în partea inferioară a bazinului',
      'O senzație că o formațiune sau ceva coboară în vagin',
      'Dificultăți de a reține gazele sau scaunul',
      'Durere persistentă la nivelul perineului',
      'Durere în timpul sau după raporturile sexuale',
      'Dificultăți de a identifica sau de a contracta corect mușchii perineali',
    ],
    consultLabel: 'Când ar trebui să ceri un sfat?',
    s7Body2:
      'O moașă, un medic sau un kinetoterapeut specializat în recuperarea planșeului pelvian poate verifica funcția musculară și poate propune un program potrivit.',

    s8Heading: 'Și după o ruptură, o epiziotomie sau o cezariană?',
    s8Body1:
      'O ruptură sau o epiziotomie necesită o îngrijire deosebită în timpul vindecării. Reluarea activităților trebuie să țină cont de durere, de starea cicatricei și de îndrumările primite după naștere.',
    s8Body2:
      'După o cezariană, recuperarea implică și peretele abdominal și cicatricea. Chiar dacă nașterea nu a fost vaginală, sarcina în sine a solicitat totuși planșeul pelvian.',
    s8HighlightTitle: 'O îngrijire personalizată poate ajuta',
    s8HighlightText:
      'În cazul unei rupturi importante, al durerii, al simptomelor urinare sau intestinale ori al unor dificultăți persistente, o evaluare cu un profesionist din domeniul sănătății poate fi deosebit de utilă.',

    s9Heading: 'Reluarea treptată a sportului',
    s9Body1:
      'Reluarea mișcării după naștere trebuie să fie graduală. Mersul pe jos și mișcările blânde pot fi reluate în general în funcție de cum te simți, în timp ce activitățile cu impact puternic cer mai multă prudență.',
    s9Body2:
      'Înainte de a relua alergarea, săriturile sau antrenamentele foarte intense, este mai bine să evaluezi recuperarea planșeului pelvian și să iei în calcul orice simptome.',
    s9AlertTitle: 'Nu grăbi etapele',
    s9AlertText:
      'Pierderile, o senzație de greutate sau durerea în timpul ori după efort sunt semne că ar trebui să încetinești și să ceri un sfat înainte de a crește intensitatea.',

    s10Heading: 'Când să mergi la un specialist?',
    s10Body1:
      'Recuperarea planșeului pelvian împreună cu o moașă sau un kinetoterapeut poate fi utilă dacă nu ești sigură că contracți corect, dacă simptomele persistă sau dacă vrei să reiei cu încredere anumite activități fizice.',
    questionCardTitle: 'Întrebări utile de pus',
    appointmentQuestions: [
      'Sunt simptomele mele compatibile cu o slăbiciune a planșeului pelvian?',
      'Efectuez corect contracțiile?',
      'Câte repetări ar trebui să fac în fiecare zi?',
      'Pot reveni la alergare, la sport sau la exerciții cu impact puternic?',
      'Am nevoie de recuperare cu o moașă sau cu un kinetoterapeut?',
      'Cicatricea, ruptura sau cezariana mea cer precauții deosebite?',
    ],
    s10TipTitle: 'Bine de știut',
    s10TipText:
      'A merge la un profesionist nu înseamnă neapărat că ceva nu este în regulă. O ședință te poate ajuta pur și simplu să-ți verifici tehnica, să-ți evaluezi recuperarea și să înveți să progresezi corect.',

    s11Heading: 'O recuperare care necesită timp',
    s11Body1:
      'După ce ai născut, este normal să nu recapeți imediat aceleași senzații sau aceeași forță musculară pe care le aveai înainte de sarcină.',
    s11Body2:
      'Scopul nu este să faci cât mai multe contracții posibil. Este mai degrabă să recapeți treptat o bună coordonare între contracție și relaxare și apoi să poți folosi în mod natural acești mușchi în activitățile de zi cu zi.',
    s11HighlightTitle: 'Micile progrese sunt progrese reale',
    s11HighlightText:
      'O mai bună conștientizare a mișcării, câteva secunde în plus de contracție sau o reducere a pierderilor sunt deja semne încurajatoare.',

    s12Heading: 'Ce să reții',
    summaryTitle: 'Esențialul',
    summaryItems: [
      'Sarcina și nașterea solicită puternic planșeul pelvian.',
      'O recuperare treptată este normală după naștere.',
      'Exercițiile trebuie să dea prioritate calității mișcării în fața forței.',
      'Respirația și relaxarea contează la fel de mult ca contracția.',
      'Pierderile de urină, senzația de greutate sau durerea persistentă merită o părere profesionistă.',
      'Recuperarea împreună cu o moașă sau cu un kinetoterapeut te poate ajuta să recapeți un control mai bun.',
      'Revenirea la sport trebuie să fie graduală, mai ales pentru activitățile cu impact puternic.',
    ],

    finalTipTitle: 'Ia-ți timp să te refaci',
    finalTipText:
      'După naștere, corpul tău a trecut prin multe schimbări. Perineul merită aceeași atenție ca restul corpului tău: treptat, regulat și fără presiune.',

    disclaimerText:
      'Acest articol are doar caracter informativ și nu înlocuiește sfatul medical personalizat. Dacă ai dureri, simptome persistente sau orice îngrijorare cu privire la recuperarea ta, cere sfatul unui profesionist din domeniul sănătății.',
  },
  bg: {
    badge: 'СЛЕД РАЖДАНЕ • ВЪЗСТАНОВЯВАНЕ',
    title: 'Укрепване на тазовото дъно\nслед раждане',
    metaDuration: '8 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro:
      'След бременност и раждане тазовото дъно се нуждае от време, за да се възстанови. Прости, редовни и постепенни упражнения могат да ти помогнат да възвърнеш сила, контрол и увереност, без да се опитваш да ускоряваш нещата.',
    contentsTitle: 'В тази статия',
    topics: [
      'Разбиране на ролята на перинеума',
      'Защо раждането го натоварва',
      'Кога да започнеш рехабилитация на тазовото дъно',
      'Как да свиваш правилно',
      'Изграждане на постепенна рутина',
      'Грешки, които да избягваш',
      'Кога да поискаш помощ',
      'Постепенно връщане към спорта',
      'Подготовка за преглед',
      'Какво да запомниш',
    ],
    shareMessage: 'Укрепване на тазовото дъно след раждане — AWA',

    s1Heading: 'Разбиране на ролята на перинеума',
    s1Body1:
      'Перинеумът, наричан още тазово дъно, е група мускули в основата на таза. Той играе роля в контрола на пикочния мехур и червата и помага да се поддържат тазовите органи.',
    s1Body2:
      'По време на бременност тези мускули трябва да понасят допълнително тегло в продължение на няколко месеца. Те са подложени на значително натоварване и по време на раждането.',
    s1HighlightTitle: 'Дискретен, но съществен мускул',
    s1HighlightText:
      'Тазовото дъно участва в няколко ежедневни функции: задържане на урина и изпражнения, контрол на газовете, поддържане на тазовите органи и роля в някои сексуални функции.',

    benefitsHeading: 'Ползите от по-силно тазово дъно',
    benefitsIntro:
      'Постепенното, правилно извършвано укрепване може да помогне да се подобрят контролът и опората на тазовото дъно.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'По-добър контрол на пикочния мехур',
        text: 'Тазовото дъно играе роля в контрола на пикочния мехур. Постепенното му укрепване може да помогне да се намалят някои изтичания на урина.',
      },
      {
        icon: 'toilet',
        title: 'Подкрепа на чревната функция',
        text: 'Тези мускули помагат и за контрола на газовете и изпражненията и допринасят за поддържането на тазовите органи.',
      },
      {
        icon: 'human-female',
        title: 'Поддържане на тазовите органи',
        text: 'Тазовото дъно образува истинска мускулна основа, която помага да се поддържат пикочният мехур, матката и червата.',
      },
      {
        icon: 'heart-pulse',
        title: 'Постепенно възвръщане на усещането',
        text: 'Подходящата рехабилитация може да ти помогне да възвърнеш по-добро осъзнаване и контрол на тази област.',
      },
    ],

    s2Heading: 'Защо бременността и раждането го натоварват',
    s2Body1:
      'Бременността постепенно оказва все по-голям натиск върху тазовото дъно. Вагиналното раждане след това може значително да разтегне мускулите и тъканите в тази област.',
    s2Body2:
      'Цезаровото сечение също не щади напълно тазовото дъно: самата бременност остава значителен период за тези мускули.',
    s2Body3:
      'След раждане е нормално възстановяването да отнема време. Някои жени почти не усещат симптоми, докато други могат да забележат изтичане, чувство на тежест или намален мускулен контрол.',
    s2TipTitle: 'Всяко възстановяване е различно',
    s2TipText:
      'Видът на раждането, разкъсване или епизиотомия, наличието на болка и общото ти състояние след раждането могат да повлияят на възстановяването.',

    s3Heading: 'Кога да започнеш рехабилитация на тазовото дъно?',
    s3Body1:
      'След раждане без усложнения нежните контракции на тазовото дъно обикновено могат да се възобновят постепенно. Остава важно да нагодиш упражненията към ситуацията си и да потърсиш съвет, ако си имала усложнение, значителна болка или специфична процедура.',
    s3Body2:
      'Ако имаш пикочен катетър, някои препоръки съветват да изчакаш отстраняването му и възобновяването на нормалното уриниране, преди да започнеш упражнения за перинеума.',
    s3AlertTitle: 'Не насилвай през болка',
    s3AlertText:
      'Значителна болка, влошаващи се симптоми, рана, която зараства зле, или всяко особено притеснение изискват съвет от акушерка, лекар или специалист по рехабилитация.',

    s4Heading: 'Как да свиваш правилно',
    s4Body1:
      'За да усетиш движението, представи си, че се опитваш да задържиш газове и позива за уриниране едновременно. Движението, което търсиш, е усещане за свиване и повдигане навътре.',
    s4Body2:
      'Целта не е да напрягаш силно цялото тяло. Седалището, бедрата и коремните мускули трябва да останат възможно най-отпуснати, докато дишането продължава нормално.',
    exercises: [
      {icon: 'weather-windy', label: 'Дишане'},
      {icon: 'human-handsup', label: 'Нежно свиване'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Продължително свиване'},
      {icon: 'gesture-tap-button', label: 'Бързи свивания'},
    ],
    s4HighlightTitle: 'Отпускането е също толкова важно',
    s4HighlightText:
      'След всяко свиване остави мускулите да се отпуснат напълно. Добрата рехабилитация не означава да държиш перинеума свит през целия ден.',

    s5Heading: 'Изграждане на постепенна рутина',
    s5Body1:
      'В началото най-важното е да се научиш да разпознаваш мускулите и да изпълняваш движението правилно. Редовността е по-важна от интензивността.',
    s5h3a: 'Продължителни свивания',
    s5Body2:
      'Свий нежно тазовото дъно, след това задръж свиването няколко секунди, без да задържаш дъха си. После го отпусни напълно, преди да започнеш отново.',
    s5h3b: 'Кратки свивания',
    s5Body3:
      'След като овладееш движението, могат да се добавят малки бързи свивания. Те помагат да тренираш способността си да свиваш мускулите бързо, когато коремното налягане се повишава, например точно преди кашлица или кихане.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Свържи упражненията с ежедневен навик'},
      {icon: 'human-sitting', label: 'Започни в удобна позиция'},
      {icon: 'weather-windy', label: 'Дишай нормално по време на свиванията'},
      {icon: 'sleep', label: 'Спазвай фазите на отпускане'},
      {icon: 'chart-line', label: 'Постепенно увеличавай трудността'},
      {icon: 'doctor', label: 'Поискай съвет, ако не си сигурна'},
    ],
    s5TipTitle: 'Преди всичко редовност',
    s5TipText:
      'Свързването на упражненията с навик, който вече е част от деня ти, може да улесни редовността: след кърмене, след миене на зъбите или в друг момент, който ти пасва.',

    s6Heading: 'Чести грешки, които да избягваш',
    s6Body1:
      'Упражненията за перинеума изглеждат прости, но е лесно да компенсираш с други мускули или да насилваш прекалено.',
    commonMistakes: [
      'Напрягане на седалището или бедрата вместо тазовото дъно',
      'Задържане на дъха по време на свиването',
      'Постоянно държане на мускулите свити, без да ги отпускаш',
      'Правене на упражненията само няколко дни и след това спиране',
      'Умишлено спиране на струята урина, за да провериш свиването',
    ],
    s6TipTitle: 'Какво да не правиш',
    s6TipText:
      'Не се препоръчва да упражняваш, като умишлено спираш струята урина. Този метод не тренира перинеума правилно и може да наруши нормалната функция на пикочния мехур.',

    s7Heading: 'Кои симптоми трябва да доведат до консултация?',
    s7Body1:
      'След раждане понякога могат да се появят леки изтичания или необичайно усещане. Не бива обаче да се пренебрегват, ако продължават, влошават се или пречат на ежедневието ти.',
    warningSigns: [
      'Изтичане на урина при кашлица, кихане, смях или напъване',
      'Чувство на тежест или натиск в долната част на таза',
      'Усещане, че нещо се спуска във влагалището',
      'Затруднение при задържане на газове или изпражнения',
      'Упорита болка в перинеума',
      'Болка по време или след полов контакт',
      'Затруднение да разпознаеш или да свиеш правилно мускулите на перинеума',
    ],
    consultLabel: 'Кога да поискаш съвет?',
    s7Body2:
      'Акушерка, лекар или физиотерапевт, специализиран в рехабилитация на тазовото дъно, може да провери функцията на мускулите и да предложи подходяща програма.',

    s8Heading: 'А след разкъсване, епизиотомия или цезарово сечение?',
    s8Body1:
      'Разкъсването или епизиотомията изискват особена грижа по време на заздравяването. Възобновяването на дейностите трябва да взема предвид болката, състоянието на белега и указанията, дадени след раждането.',
    s8Body2:
      'След цезарово сечение възстановяването включва и коремната стена и белега. Дори раждането да не е било вагинално, самата бременност все пак е натоварила тазовото дъно.',
    s8HighlightTitle: 'Персонализираната грижа може да помогне',
    s8HighlightText:
      'При значително разкъсване, болка, уринарни или чревни симптоми или упорити затруднения оценката със здравен специалист може да е особено полезна.',

    s9Heading: 'Постепенно връщане към спорта',
    s9Body1:
      'Възобновяването на движението след раждане трябва да е постепенно. Ходенето и нежните движения обикновено могат да се възобновят според усещането ти, докато дейностите с висок удар изискват повече предпазливост.',
    s9Body2:
      'Преди да възобновиш бягането, скоковете или много интензивните тренировки, най-добре е да оцениш възстановяването на тазовото дъно и да вземеш предвид евентуалните симптоми.',
    s9AlertTitle: 'Не бързай със стъпките',
    s9AlertText:
      'Изтичане, чувство на тежест или болка по време или след упражнение са знаци, че трябва да забавиш и да поискаш съвет, преди да увеличиш интензивността.',

    s10Heading: 'Кога да посетиш специалист?',
    s10Body1:
      'Рехабилитацията на тазовото дъно при акушерка или физиотерапевт може да е полезна, ако не си сигурна дали свиваш правилно, ако симптомите ти продължават или ако искаш да възобновиш някои физически дейности с увереност.',
    questionCardTitle: 'Полезни въпроси за задаване',
    appointmentQuestions: [
      'Съответстват ли симптомите ми на слабост на тазовото дъно?',
      'Изпълнявам ли свиванията правилно?',
      'Колко повторения да правя на ден?',
      'Мога ли да се върна към бягане, спорт или упражнения с висок удар?',
      'Нуждая ли се от рехабилитация при акушерка или физиотерапевт?',
      'Изисква ли белегът, разкъсването или цезаровото ми сечение особени предпазни мерки?',
    ],
    s10TipTitle: 'Добре е да знаеш',
    s10TipText:
      'Посещението при специалист не означава непременно, че нещо не е наред. Една сесия може просто да помогне да провериш техниката си, да оцениш възстановяването си и да се научиш да напредваш правилно.',

    s11Heading: 'Възстановяване, което отнема време',
    s11Body1:
      'След раждане е нормално да не възвърнеш веднага същите усещания или мускулна сила като преди бременността.',
    s11Body2:
      'Целта не е да правиш възможно най-много свивания. По-скоро е постепенно да възвърнеш добра координация между свиване и отпускане и после да можеш да използваш тези мускули естествено в ежедневните дейности.',
    s11HighlightTitle: 'Малкият напредък е истински напредък',
    s11HighlightText:
      'По-доброто осъзнаване на движението, няколко допълнителни секунди свиване или намаляване на изтичането вече са окуражаващи знаци.',

    s12Heading: 'Какво да запомниш',
    summaryTitle: 'Същественото',
    summaryItems: [
      'Бременността и раждането оказват значително натоварване върху тазовото дъно.',
      'Постепенното възстановяване е нормално след раждане.',
      'Упражненията трябва да поставят качеството на движението пред силата.',
      'Дишането и отпускането са също толкова важни, колкото свиването.',
      'Изтичане на урина, чувство на тежест или упорита болка заслужават професионално мнение.',
      'Рехабилитацията при акушерка или физиотерапевт може да ти помогне да възвърнеш по-добър контрол.',
      'Връщането към спорта трябва да е постепенно, особено за дейности с висок удар.',
    ],

    finalTipTitle: 'Дай си време да се възстановиш',
    finalTipText:
      'След раждане тялото ти е преминало през много промени. Перинеумът заслужава същото внимание като останалата част от тялото ти: постепенно, редовно и без натиск.',

    disclaimerText:
      'Тази статия е само с информационна цел и не замества персонализирания медицински съвет. Ако изпитваш болка, упорити симптоми или имаш някакви притеснения относно възстановяването си, потърси съвет от здравен специалист.',
  },
  sr: {
    badge: 'ПОСЛЕ ПОРОЂАЈА • ОПОРАВАК',
    title: 'Јачање карличног дна\nпосле порођаја',
    metaDuration: '8 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro:
      'После трудноће и порођаја карличном дну је потребно време да се опорави. Једноставне, редовне и постепене вежбе могу ти помоћи да вратиш снагу, контролу и самопоуздање, без покушаја да ужурбаш ствари.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Разумевање улоге перинеума',
      'Зашто га порођај оптерећује',
      'Када почети рехабилитацију карличног дна',
      'Како правилно стезати',
      'Изградња постепене рутине',
      'Грешке које треба избегавати',
      'Када затражити помоћ',
      'Постепено враћање спорту',
      'Припрема за преглед',
      'Шта да запамтиш',
    ],
    shareMessage: 'Јачање карличног дна после порођаја — AWA',

    s1Heading: 'Разумевање улоге перинеума',
    s1Body1:
      'Перинеум, назван и карлично дно, је група мишића у основи карлице. Игра улогу у контроли мокраћне бешике и црева и помаже у подупирању карличних органа.',
    s1Body2:
      'Током трудноће ови мишићи морају да носе додатну тежину неколико месеци. Они су изложени и значајном напору током порођаја.',
    s1HighlightTitle: 'Дискретан, али суштински мишић',
    s1HighlightText:
      'Карлично дно учествује у неколико свакодневних функција: задржавање урина и столице, контрола гасова, подупирање карличних органа и улога у одређеним сексуалним функцијама.',

    benefitsHeading: 'Предности јачег карличног дна',
    benefitsIntro:
      'Постепено, правилно изведено јачање може помоћи да се побољшају контрола и подршка карличног дна.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Боља контрола мокраћне бешике',
        text: 'Карлично дно игра улогу у контроли мокраћне бешике. Његово постепено јачање може помоћи да се смање одређена цурења урина.',
      },
      {
        icon: 'toilet',
        title: 'Подршка функцији црева',
        text: 'Ови мишићи помажу и у контроли гасова и столице и доприносе подупирању карличних органа.',
      },
      {
        icon: 'human-female',
        title: 'Подупирање карличних органа',
        text: 'Карлично дно чини праву мишићну основу која помаже да се подупру бешика, материца и црево.',
      },
      {
        icon: 'heart-pulse',
        title: 'Постепено враћање осећаја',
        text: 'Одговарајућа рехабилитација може ти помоћи да вратиш боље осећање и контролу над овом облашћу.',
      },
    ],

    s2Heading: 'Зашто га трудноћа и порођај оптерећују',
    s2Body1:
      'Трудноћа постепено врши све већи притисак на карлично дно. Вагинални порођај затим може знатно истегнути мишиће и ткива у овој области.',
    s2Body2:
      'Ни царски рез не поштеди потпуно карлично дно: сама трудноћа остаје значајан период за ове мишиће.',
    s2Body3:
      'После порођаја је зато нормално да опоравак траје. Неке жене једва осећају симптоме, док друге могу приметити цурење, осећај тежине или смањену контролу мишића.',
    s2TipTitle: 'Сваки опоравак је различит',
    s2TipText:
      'Врста порођаја, разрез или епизиотомија, присуство бола и твоје опште стање после порођаја могу утицати на опоравак.',

    s3Heading: 'Када почети рехабилитацију карличног дна?',
    s3Body1:
      'После порођаја без компликација нежне контракције карличног дна обично се могу постепено наставити. Остаје важно да вежбе прилагодиш својој ситуацији и да потражиш савет ако си имала компликацију, значајан бол или посебан захват.',
    s3Body2:
      'Ако имаш мокраћни катетер, неке препоруке саветују да сачекаш његово уклањање и успостављање нормалног уринирања пре почетка вежби за перинеум.',
    s3AlertTitle: 'Не форсирај кроз бол',
    s3AlertText:
      'Значајан бол, симптоми који се погоршавају, рана која лоше зарасте или било која посебна брига захтевају савет бабице, лекара или стручњака за рехабилитацију.',

    s4Heading: 'Како правилно стезати',
    s4Body1:
      'Да би осетила покрет, замисли да покушаваш да задржиш гасове и позив за уринирање истовремено. Покрет који тражиш је осећај стезања и подизања ка унутра.',
    s4Body2:
      'Циљ није да јако напрежеш цело тело. Седалиште, бедра и мишићи стомака треба да остану што опуштенији, док дисање наставља нормално.',
    exercises: [
      {icon: 'weather-windy', label: 'Дисање'},
      {icon: 'human-handsup', label: 'Нежно стезање'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Дуго стезање'},
      {icon: 'gesture-tap-button', label: 'Брза стезања'},
    ],
    s4HighlightTitle: 'Опуштање је једнако важно',
    s4HighlightText:
      'После сваког стезања пусти мишиће да се потпуно опусте. Добра рехабилитација не значи држати перинеум стегнутим цео дан.',

    s5Heading: 'Изградња постепене рутине',
    s5Body1:
      'На почетку је најважније научити да препознаш мишиће и правилно изведеш покрет. Редовност је важнија од интензитета.',
    s5h3a: 'Дуга стезања',
    s5Body2:
      'Нежно стегни карлично дно, затим задржи стезање неколико секунди без задржавања даха. Потом га потпуно опусти пре него што поново почнеш.',
    s5h3b: 'Кратка стезања',
    s5Body3:
      'Када овладаш покретом, могу се додати мала брза стезања. Она помажу да увежбаш способност брзог стезања мишића када се абдоминални притисак повећа, на пример непосредно пре кашљања или кијања.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Повежи вежбе са свакодневном навиком'},
      {icon: 'human-sitting', label: 'Почни у удобном положају'},
      {icon: 'weather-windy', label: 'Диши нормално током стезања'},
      {icon: 'sleep', label: 'Поштуј фазе опуштања'},
      {icon: 'chart-line', label: 'Постепено повећавај тежину'},
      {icon: 'doctor', label: 'Затражи савет ако ниси сигурна'},
    ],
    s5TipTitle: 'Пре свега редовност',
    s5TipText:
      'Повезивање вежби са навиком која је већ део твог дана може олакшати доследност: после дојења, после прања зуба или у неко друго време које ти одговара.',

    s6Heading: 'Честе грешке које треба избегавати',
    s6Body1:
      'Вежбе за перинеум изгледају једноставно, али је лако компензовати другим мишићима или превише притискати.',
    commonMistakes: [
      'Напрезање седалишта или бедара уместо карличног дна',
      'Задржавање даха током стезања',
      'Стално држање мишића стегнутим без опуштања',
      'Вежбање само неколико дана, а затим престанак',
      'Намерно заустављање млаза урина да провериш стезање',
    ],
    s6TipTitle: 'Шта не радити',
    s6TipText:
      'Не препоручује се упражњавање вежби намерним заустављањем млаза урина. Овај метод не тренира перинеум правилно и може пореметити нормалну функцију мокраћне бешике.',

    s7Heading: 'Који симптоми треба да доведу до консултације?',
    s7Body1:
      'Мања цурења или необично осећање понекад се могу појавити после порођаја. Не треба их, међутим, игнорисати ако трају, погоршавају се или ометају твој свакодневни живот.',
    warningSigns: [
      'Цурење урина при кашљању, кијању, смеху или напрезању',
      'Осећај тежине или притиска у доњем делу карлице',
      'Осећај да нека кврга или нешто пада у вагину',
      'Тешкоћа при задржавању гасова или столице',
      'Упоран бол у перинеуму',
      'Бол током или после полног односа',
      'Тешкоћа да препознаш или правилно стегнеш мишиће перинеума',
    ],
    consultLabel: 'Када затражити савет?',
    s7Body2:
      'Бабица, лекар или физиотерапевт специјализован за рехабилитацију карличног дна може проверити функцију мишића и предложити одговарајући програм.',

    s8Heading: 'А после раскида, епизиотомије или царског реза?',
    s8Body1:
      'Раскид или епизиотомија захтевају посебну негу током зарастања. Настављање активности треба да узме у обзир бол, стање ожиљка и смернице дате после порођаја.',
    s8Body2:
      'После царског реза опоравак обухвата и трбушни зид и ожиљак. Чак и ако порођај није био вагиналан, сама трудноћа је ипак оптеретила карлично дно.',
    s8HighlightTitle: 'Персонализована нега може помоћи',
    s8HighlightText:
      'У случају значајног раскида, бола, уринарних или цревних симптома или упорних тешкоћа, процена код здравственог радника може бити посебно корисна.',

    s9Heading: 'Постепено враћање спорту',
    s9Body1:
      'Настављање кретања после порођаја треба да буде постепено. Ходање и нежни покрети обично се могу наставити према томе како се осећаш, док активности са великим ударом захтевају више опреза.',
    s9Body2:
      'Пре настављања трчања, скакања или веома интензивних тренинга, најбоље је проценити опоравак карличног дна и узети у обзир евентуалне симптоме.',
    s9AlertTitle: 'Не жури са корацима',
    s9AlertText:
      'Цурење, осећај тежине или бол током или после вежбања знаци су да треба да успориш и потражиш савет пре повећања интензитета.',

    s10Heading: 'Када посетити специјалисту?',
    s10Body1:
      'Рехабилитација карличног дна код бабице или физиотерапевта може бити корисна ако ниси сигурна да ли стежеш правилно, ако симптоми трају или ако желиш да са самопоуздањем наставиш одређене физичке активности.',
    questionCardTitle: 'Корисна питања за постављање',
    appointmentQuestions: [
      'Да ли моји симптоми одговарају слабости карличног дна?',
      'Да ли исправно изводим стезања?',
      'Колико понављања да радим дневно?',
      'Могу ли да се вратим трчању, спорту или вежбама са великим ударом?',
      'Да ли ми је потребна рехабилитација код бабице или физиотерапевта?',
      'Захтева ли мој ожиљак, раскид или царски рез посебне мере предострожности?',
    ],
    s10TipTitle: 'Добро је знати',
    s10TipText:
      'Посета стручњаку не значи нужно да нешто није у реду. Једна сесија може једноставно помоћи да провериш своју технику, процениш опоравак и научиш да правилно напредујеш.',

    s11Heading: 'Опоравак који захтева време',
    s11Body1:
      'После порођаја је нормално да се не врате одмах исти осећаји или мишићна снага као пре трудноће.',
    s11Body2:
      'Циљ није да направиш што више стезања. Пре се ради о томе да постепено вратиш добру координацију између стезања и опуштања, а затим да можеш природно користити ове мишиће у свакодневним активностима.',
    s11HighlightTitle: 'Мали напредак је прави напредак',
    s11HighlightText:
      'Боље осећање покрета, неколико додатних секунди стезања или смањење цурења већ су охрабрујући знаци.',

    s12Heading: 'Шта да запамтиш',
    summaryTitle: 'Основно',
    summaryItems: [
      'Трудноћа и порођај значајно оптерећују карлично дно.',
      'Постепен опоравак је нормалан после порођаја.',
      'Вежбе треба да дају предност квалитету покрета над снагом.',
      'Дисање и опуштање су једнако важни као стезање.',
      'Цурење урина, тежина или упоран бол заслужују стручно мишљење.',
      'Рехабилитација код бабице или физиотерапевта може ти помоћи да вратиш бољу контролу.',
      'Повратак спорту треба да буде постепен, нарочито за активности са великим ударом.',
    ],

    finalTipTitle: 'Дај себи времена да се опоравиш',
    finalTipText:
      'После порођаја твоје тело је прошло кроз много промена. Перинеум заслужује исту пажњу као остатак твог тела: постепено, редовно и без притиска.',

    disclaimerText:
      'Овај чланак је само у информативне сврхе и не замењује персонализовани медицински савет. Ако осећаш бол, упорне симптоме или имаш било какву бригу о свом опоравку, потражи савет од здравственог радника.',
  },
  hr: {
    badge: 'NAKON PORODA • OPORAVAK',
    title: 'Jačanje mišića dna zdjelice\nnakon poroda',
    metaDuration: '8 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Nakon trudnoće i poroda dnu zdjelice treba vremena za oporavak. Jednostavne, redovite i postupne vježbe mogu ti pomoći povratiti snagu, kontrolu i povjerenje, bez žurbe.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje uloge perineuma',
      'Zašto je porod opterećuje',
      'Kada započeti rehabilitaciju dna zdjelice',
      'Učenje pravilnog stezanja',
      'Izgradnja postupne rutine',
      'Pogreške koje treba izbjegavati',
      'Kada zatražiti pomoć',
      'Postupan povratak sportu',
      'Priprema za pregled',
      'Ključne poruke',
    ],
    shareMessage: 'Jačanje mišića dna zdjelice nakon poroda — AWA',

    s1Heading: 'Razumijevanje uloge perineuma',
    s1Body1:
      'Perineum, nazvan i dno zdjelice, skupina je mišića smještenih na dnu zdjelice. Ima ulogu u kontroli mokraćnog mjehura i crijeva te pomaže u podupiranju zdjeličnih organa.',
    s1Body2:
      'Tijekom trudnoće ti mišići nekoliko mjeseci moraju nositi dodatnu težinu. Tijekom poroda također su pod velikim opterećenjem.',
    s1HighlightTitle: 'Diskretan, ali bitan mišić',
    s1HighlightText:
      'Dno zdjelice sudjeluje u nekoliko svakodnevnih funkcija: zadržavanju mokraće i stolice, kontroli vjetrova, podupiranju zdjeličnih organa i ulozi u određenim spolnim funkcijama.',

    benefitsHeading: 'Prednosti jačeg dna zdjelice',
    benefitsIntro:
      'Postupno i pravilno provedeno jačanje može pomoći poboljšati kontrolu i potporu dna zdjelice.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bolja kontrola mjehura',
        text: 'Dno zdjelice ima ulogu u kontroli mokraćnog mjehura. Postupno jačanje može pomoći smanjiti određena curenja mokraće.',
      },
      {
        icon: 'toilet',
        title: 'Podrška funkciji crijeva',
        text: 'Ti mišići također pomažu u kontroli vjetrova i stolice te pridonose podupiranju zdjeličnih organa.',
      },
      {
        icon: 'human-female',
        title: 'Podupiranje zdjeličnih organa',
        text: 'Dno zdjelice čini pravu mišićnu podlogu koja pomaže podupirati mjehur, maternicu i crijevo.',
      },
      {
        icon: 'heart-pulse',
        title: 'Postupan povratak osjeta',
        text: 'Prikladna rehabilitacija može ti pomoći i bolje osjetiti i kontrolirati to područje.',
      },
    ],

    s2Heading: 'Zašto ga trudnoća i porod opterećuju',
    s2Body1:
      'Trudnoća postupno povećava pritisak na dno zdjelice. Vaginalni porod zatim može znatno rastegnuti mišiće i tkiva tog područja.',
    s2Body2:
      'Ni carski rez ne štedi dno zdjelice u potpunosti: i sama trudnoća ostaje značajno razdoblje za te mišiće.',
    s2Body3:
      'Nakon poroda stoga je normalno da oporavak traje. Neke žene gotovo ne osjećaju simptome, dok druge mogu primijetiti curenje, osjećaj težine ili smanjenu kontrolu mišića.',
    s2TipTitle: 'Svaki je oporavak drugačiji',
    s2TipText:
      'Vrsta poroda, puknuće ili epiziotomija, prisutnost boli i tvoje opće stanje nakon poroda mogu utjecati na oporavak.',

    s3Heading: 'Kada započeti rehabilitaciju dna zdjelice?',
    s3Body1:
      'Nakon nekompliciranog poroda blaga stezanja dna zdjelice obično se mogu postupno nastaviti. Ostaje važno prilagoditi vježbe svojoj situaciji i zatražiti savjet ako si imala komplikaciju, jaku bol ili poseban zahvat.',
    s3Body2:
      'Ako imaš urinarni kateter, neke preporuke savjetuju pričekati da se ukloni i da se normalno mokrenje uspostavi prije početka vježbi perineuma.',
    s3AlertTitle: 'Ne forsiraj bol',
    s3AlertText:
      'Jaka bol, pogoršanje simptoma, rana koja slabo zacjeljuje ili bilo kakva posebna zabrinutost zahtijevaju savjet babice, liječnika ili stručnjaka za rehabilitaciju.',

    s4Heading: 'Učenje pravilnog stezanja',
    s4Body1:
      'Za prepoznavanje pokreta zamisli da istodobno pokušavaš zadržati vjetrove i nagon za mokrenjem. Pokret koji tražiš je osjećaj stezanja i podizanja prema unutra.',
    s4Body2:
      'Cilj nije čvrsto napeti cijelo tijelo. Stražnjica, bedra i trbušni mišići trebaju ostati što opušteniji, dok se disanje nastavlja normalno.',
    exercises: [
      {icon: 'weather-windy', label: 'Disanje'},
      {icon: 'human-handsup', label: 'Blago stezanje'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Dugo stezanje'},
      {icon: 'gesture-tap-button', label: 'Brza stezanja'},
    ],
    s4HighlightTitle: 'Opuštanje je jednako važno',
    s4HighlightText:
      'Nakon svakog stezanja pusti da se mišići potpuno opuste. Dobra rehabilitacija ne znači držati perineum stegnutim cijeli dan.',

    s5Heading: 'Izgradnja postupne rutine',
    s5Body1:
      'Na početku je najvažnije naučiti prepoznati mišiće i pravilno izvesti pokret. Dosljednost je važnija od intenziteta.',
    s5h3a: 'Duga stezanja',
    s5Body2:
      'Nježno stegni dno zdjelice, zatim zadrži stezanje nekoliko sekundi bez zadržavanja daha. Potom potpuno otpusti prije ponovnog početka.',
    s5h3b: 'Kratka stezanja',
    s5Body3:
      'Kad svladaš pokret, mogu se dodati mala brza stezanja. Pomažu vježbati sposobnost brzog stezanja mišića kad se poveća trbušni tlak, na primjer neposredno prije kašljanja ili kihanja.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Poveži vježbe sa svakodnevnom navikom'},
      {icon: 'human-sitting', label: 'Počni u udobnom položaju'},
      {icon: 'weather-windy', label: 'Normalno diši tijekom stezanja'},
      {icon: 'sleep', label: 'Poštuj faze opuštanja'},
      {icon: 'chart-line', label: 'Postupno povećavaj težinu'},
      {icon: 'doctor', label: 'Zatraži savjet ako nisi sigurna'},
    ],
    s5TipTitle: 'Prije svega dosljednost',
    s5TipText:
      'Povezivanje vježbi s navikom koja je već dio tvog dana može olakšati dosljednost: nakon podoja, nakon pranja zubi ili u neko drugo prikladno vrijeme.',

    s6Heading: 'Česte pogreške koje treba izbjegavati',
    s6Body1:
      'Vježbe perineuma mogu izgledati jednostavno, ali lako je nadoknaditi drugim mišićima ili previše forsirati.',
    commonMistakes: [
      'Napinjanje stražnjice ili bedara umjesto dna zdjelice',
      'Zadržavanje daha tijekom stezanja',
      'Stalno držanje mišića stegnutima bez opuštanja',
      'Vježbanje samo nekoliko dana, a zatim prestanak',
      'Namjerno prekidanje mlaza mokraće radi provjere stezanja',
    ],
    s6TipTitle: 'Što ne činiti',
    s6TipText:
      'Ne preporučuje se vježbati namjernim prekidanjem mlaza mokraće. Ta metoda ne vježba perineum ispravno i može poremetiti normalnu funkciju mjehura.',

    s7Heading: 'Koji simptomi trebaju potaknuti savjetovanje?',
    s7Body1:
      'Manja curenja ili neobičan osjećaj ponekad se mogu pojaviti nakon poroda. Međutim, ne treba ih zanemariti ako potraju, pogoršaju se ili ometaju tvoj svakodnevni život.',
    warningSigns: [
      'Curenje mokraće pri kašljanju, kihanju, smijanju ili naprezanju',
      'Osjećaj težine ili pritiska u donjem dijelu zdjelice',
      'Osjećaj da se kvrga ili nešto spušta u rodnicu',
      'Teškoće u zadržavanju vjetrova ili stolice',
      'Dugotrajna bol u perineumu',
      'Bol tijekom ili nakon spolnog odnosa',
      'Teškoće u prepoznavanju ili pravilnom stezanju mišića perineuma',
    ],
    consultLabel: 'Kada zatražiti savjet?',
    s7Body2:
      'Babica, liječnik ili fizioterapeut specijaliziran za rehabilitaciju dna zdjelice može provjeriti funkciju mišića i predložiti prikladan program.',

    s8Heading: 'A nakon puknuća, epiziotomije ili carskog reza?',
    s8Body1:
      'Puknuće ili epiziotomija zahtijevaju posebnu njegu tijekom zacjeljivanja. Nastavak aktivnosti treba uzeti u obzir bol, stanje ožiljka i upute dobivene nakon poroda.',
    s8Body2:
      'Nakon carskog reza oporavak uključuje i trbušnu stijenku i ožiljak. Čak i ako porod nije bio vaginalni, sama je trudnoća ipak opteretila dno zdjelice.',
    s8HighlightTitle: 'Personalizirana skrb može pomoći',
    s8HighlightText:
      'U slučaju većeg puknuća, boli, mokraćnih ili crijevnih simptoma ili trajnih poteškoća, procjena sa zdravstvenim djelatnikom može biti osobito korisna.',

    s9Heading: 'Postupan povratak sportu',
    s9Body1:
      'Nastavak kretanja nakon poroda treba biti postupan. Hodanje i blaga kretanja općenito se mogu nastaviti prema tvom osjećaju, dok aktivnosti s jakim udarcima traže više opreza.',
    s9Body2:
      'Prije nastavka trčanja, skakanja ili vrlo intenzivnog treninga najbolje je procijeniti oporavak dna zdjelice i uzeti u obzir sve simptome.',
    s9AlertTitle: 'Ne žuri s fazama',
    s9AlertText:
      'Curenje, osjećaj težine ili bol tijekom ili nakon vježbanja znakovi su da trebaš usporiti i zatražiti savjet prije povećanja intenziteta.',

    s10Heading: 'Kada posjetiti specijalista?',
    s10Body1:
      'Rehabilitacija dna zdjelice s babicom ili fizioterapeutom može biti korisna ako nisi sigurna stežeš li pravilno, ako simptomi potraju ili ako želiš s povjerenjem nastaviti određene tjelesne aktivnosti.',
    questionCardTitle: 'Korisna pitanja za postaviti',
    appointmentQuestions: [
      'Jesu li moji simptomi u skladu sa slabošću dna zdjelice?',
      'Izvodim li stezanja ispravno?',
      'Koliko ponavljanja trebam raditi svaki dan?',
      'Mogu li se vratiti trčanju, sportu ili vježbama s jakim udarcima?',
      'Trebam li rehabilitaciju s babicom ili fizioterapeutom?',
      'Zahtijeva li moj ožiljak, puknuće ili carski rez posebne mjere opreza?',
    ],
    s10TipTitle: 'Dobro je znati',
    s10TipText:
      'Posjet stručnoj osobi ne znači nužno da je nešto pogrešno. Jedan termin jednostavno može pomoći provjeriti tvoju tehniku, procijeniti oporavak i naučiti pravilno napredovati.',

    s11Heading: 'Oporavak koji traje',
    s11Body1:
      'Nakon poroda normalno je da odmah ne povratiš iste osjete ili snagu mišića koje si imala prije trudnoće.',
    s11Body2:
      'Cilj nije izvesti što više stezanja. Prije se radi o postupnom ponovnom stjecanju dobre koordinacije između stezanja i opuštanja, a zatim o prirodnom korištenju tih mišića u svakodnevnim aktivnostima.',
    s11HighlightTitle: 'Mali napredak je pravi napredak',
    s11HighlightText:
      'Bolja svijest o pokretu, nekoliko sekundi duže stezanje ili smanjenje curenja već su ohrabrujući znakovi.',

    s12Heading: 'Ključne poruke',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Trudnoća i porod znatno opterećuju dno zdjelice.',
      'Postupan oporavak nakon poroda je normalan.',
      'U vježbama kvaliteta pokreta ima prednost pred snagom.',
      'Disanje i opuštanje jednako su važni kao stezanje.',
      'Mokraćna curenja, težina ili dugotrajna bol zaslužuju stručno mišljenje.',
      'Rehabilitacija s babicom ili fizioterapeutom može ti pomoći povratiti bolju kontrolu.',
      'Povratak sportu treba biti postupan, osobito kod aktivnosti s jakim udarcima.',
    ],

    finalTipTitle: 'Daj si vremena za oporavak',
    finalTipText:
      'Nakon poroda tvoje je tijelo prošlo mnoge promjene. Perineum zaslužuje jednaku pozornost kao ostatak tvog tijela: postupno, redovito i bez pritiska.',

    disclaimerText:
      'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet. Ako osjećaš bol, imaš dugotrajne simptome ili brigu o oporavku, zatraži savjet zdravstvenog djelatnika.',
  },
  bs: {
    badge: 'NAKON PORODA • OPORAVAK',
    title: 'Jačanje mišića dna zdjelice\nnakon porođaja',
    metaDuration: '8 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Nakon trudnoće i porođaja dnu zdjelice treba vremena za oporavak. Jednostavne, redovite i postupne vježbe mogu ti pomoći povratiti snagu, kontrolu i povjerenje, bez žurbe.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje uloge perineuma',
      'Zašta je porođaj opterećuje',
      'Kada započeti rehabilitaciju dna zdjelice',
      'Učenje pravilnog stezanja',
      'Izgradnja postupne rutine',
      'Pogreške koje treba izbjegavati',
      'Kada zatražiti pomoć',
      'Postupan povratak sportu',
      'Priprema za pregled',
      'Ključne poruke',
    ],
    shareMessage: 'Jačanje mišića dna zdjelice nakon porođaja — AWA',

    s1Heading: 'Razumijevanje uloge perineuma',
    s1Body1:
      'Perineum, nazvan i dno zdjelice, skupina je mišića smještenih na dnu zdjelice. Ima ulogu u kontroli mokraćnog mjehura i crijeva te pomaže u podupiranju zdjeličnih organa.',
    s1Body2:
      'Tokom trudnoće ti mišići nekoliko mjeseci moraju nositi dodatnu težinu. Tokom porođaja također su pod velikim opterećenjem.',
    s1HighlightTitle: 'Diskretan, ali bitan mišić',
    s1HighlightText:
      'Dno zdjelice sudjeluje u nekoliko svakodnevnih funkcija: zadržavanju mokraće i stolice, kontroli vjetrova, podupiranju zdjeličnih organa i ulozi u određenim spolnim funkcijama.',

    benefitsHeading: 'Prednosti jačeg dna zdjelice',
    benefitsIntro:
      'Postupno i pravilno provedeno jačanje može pomoći poboljšati kontrolu i potporu dna zdjelice.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Bolja kontrola mjehura',
        text: 'Dno zdjelice ima ulogu u kontroli mokraćnog mjehura. Postupno jačanje može pomoći smanjiti određena curenja mokraće.',
      },
      {
        icon: 'toilet',
        title: 'Podrška funkciji crijeva',
        text: 'Ti mišići također pomažu u kontroli vjetrova i stolice te pridonose podupiranju zdjeličnih organa.',
      },
      {
        icon: 'human-female',
        title: 'Podupiranje zdjeličnih organa',
        text: 'Dno zdjelice čini pravu mišićnu podlogu koja pomaže podupirati mjehur, maternicu i crijevo.',
      },
      {
        icon: 'heart-pulse',
        title: 'Postupan povratak osjeta',
        text: 'Prikladna rehabilitacija može ti pomoći i bolje osjetiti i kontrolirati to područje.',
      },
    ],

    s2Heading: 'Zašta ga trudnoća i porođaj opterećuju',
    s2Body1:
      'Trudnoća postupno povećava pritisak na dno zdjelice. Vaginalni porođaj zatim može znatno rastegnuti mišiće i tkiva tog područja.',
    s2Body2:
      'Ni carski rez ne štedi dno zdjelice u potpunosti: i sama trudnoća ostaje značajno razdoblje za te mišiće.',
    s2Body3:
      'Nakon porođaja stoga je normalno da oporavak traje. Neke žene gotovo ne osjećaju simptome, dok druge mogu primijetiti curenje, osjećaj težine ili smanjenu kontrolu mišića.',
    s2TipTitle: 'Svaki je oporavak drugačiji',
    s2TipText:
      'Vrsta porođaja, puknuće ili epiziotomija, prisutnost boli i tvoje opće stanje nakon porođaja mogu utjecati na oporavak.',

    s3Heading: 'Kada započeti rehabilitaciju dna zdjelice?',
    s3Body1:
      'Nakon nekompliciranog porođaja blaga stezanja dna zdjelice obično se mogu postupno nastaviti. Ostaje važno prilagoditi vježbe svojoj situaciji i zatražiti savjet ako si imala komplikaciju, jaku bol ili poseban zahvat.',
    s3Body2:
      'Ako imaš urinarni kateter, neke preporuke savjetuju pričekati da se ukloni i da se normalno mokrenje uspostavi prije početka vježbi perineuma.',
    s3AlertTitle: 'Ne forsiraj bol',
    s3AlertText:
      'Jaka bol, pogoršanje simptoma, rana koja slabo zacjeljuje ili bilo kakva posebna zabrinutost zahtijevaju savjet babice, ljekara ili stručnjaka za rehabilitaciju.',

    s4Heading: 'Učenje pravilnog stezanja',
    s4Body1:
      'Za prepoznavanje pokreta zamisli da istodobno pokušavaš zadržati vjetrove i nagon za mokrenjem. Pokret koji tražiš je osjećaj stezanja i podizanja prema unutra.',
    s4Body2:
      'Cilj nije čvrsto napeti cijelo tijelo. Stražnjica, bedra i trbušni mišići trebaju ostati što opušteniji, dok se disanje nastavlja normalno.',
    exercises: [
      {icon: 'weather-windy', label: 'Disanje'},
      {icon: 'human-handsup', label: 'Blago stezanje'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Dugo stezanje'},
      {icon: 'gesture-tap-button', label: 'Brza stezanja'},
    ],
    s4HighlightTitle: 'Opuštanje je jednako važno',
    s4HighlightText:
      'Nakon svakog stezanja pusti da se mišići potpuno opuste. Dobra rehabilitacija ne znači držati perineum stegnutim cijeli dan.',

    s5Heading: 'Izgradnja postupne rutine',
    s5Body1:
      'Na početku je najvažnije naučiti prepoznati mišiće i pravilno izvesti pokret. Dosljednost je važnija od intenziteta.',
    s5h3a: 'Duga stezanja',
    s5Body2:
      'Nježno stegni dno zdjelice, zatim zadrži stezanje nekoliko sekundi bez zadržavanja daha. Potom potpuno otpusti prije ponovnog početka.',
    s5h3b: 'Kratka stezanja',
    s5Body3:
      'Kad svladaš pokret, mogu se dodati mala brza stezanja. Pomažu vježbati sposobnost brzog stezanja mišića kad se poveća trbušni tlak, na primjer neposredno prije kašljanja ili kihanja.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Poveži vježbe sa svakodnevnom navikom'},
      {icon: 'human-sitting', label: 'Počni u udobnom položaju'},
      {icon: 'weather-windy', label: 'Normalno diši tokom stezanja'},
      {icon: 'sleep', label: 'Poštuj faze opuštanja'},
      {icon: 'chart-line', label: 'Postupno povećavaj težinu'},
      {icon: 'doctor', label: 'Zatraži savjet ako nisi sigurna'},
    ],
    s5TipTitle: 'Prije svega dosljednost',
    s5TipText:
      'Povezivanje vježbi s navikom koja je već dio tvog dana može olakšati dosljednost: nakon podoja, nakon pranja zubi ili u neko drugo prikladno vrijeme.',

    s6Heading: 'Česte pogreške koje treba izbjegavati',
    s6Body1:
      'Vježbe perineuma mogu izgledati jednostavno, ali lako je nadoknaditi drugim mišićima ili previše forsirati.',
    commonMistakes: [
      'Napinjanje stražnjice ili bedara umjesto dna zdjelice',
      'Zadržavanje daha tokom stezanja',
      'Stalno držanje mišića stegnutima bez opuštanja',
      'Vježbanje samo nekoliko dana, a zatim prestanak',
      'Namjerno prekidanje mlaza mokraće radi provjere stezanja',
    ],
    s6TipTitle: 'Što ne činiti',
    s6TipText:
      'Ne preporučuje se vježbati namjernim prekidanjem mlaza mokraće. Ta metoda ne vježba perineum ispravno i može poremetiti normalnu funkciju mjehura.',

    s7Heading: 'Koji simptomi trebaju potaknuti savjetovanje?',
    s7Body1:
      'Manja curenja ili neobičan osjećaj ponekad se mogu pojaviti nakon porođaja. Međutim, ne treba ih zanemariti ako potraju, pogoršaju se ili ometaju tvoj svakodnevni život.',
    warningSigns: [
      'Curenje mokraće pri kašljanju, kihanju, smijanju ili naprezanju',
      'Osjećaj težine ili pritiska u donjem dijelu zdjelice',
      'Osjećaj da se kvrga ili nešta spušta u rodnicu',
      'Teškoće u zadržavanju vjetrova ili stolice',
      'Dugotrajna bol u perineumu',
      'Bol tokom ili nakon spolnog odnosa',
      'Teškoće u prepoznavanju ili pravilnom stezanju mišića perineuma',
    ],
    consultLabel: 'Kada zatražiti savjet?',
    s7Body2:
      'Babica, ljekar ili fizioterapeut specijaliziran za rehabilitaciju dna zdjelice može provjeriti funkciju mišića i predložiti prikladan program.',

    s8Heading: 'A nakon puknuća, epiziotomije ili carskog reza?',
    s8Body1:
      'Puknuće ili epiziotomija zahtijevaju posebnu njegu tokom zacjeljivanja. Nastavak aktivnosti treba uzeti u obzir bol, stanje ožiljka i upute dobivene nakon porođaja.',
    s8Body2:
      'Nakon carskog reza oporavak uključuje i trbušnu stijenku i ožiljak. Čak i ako porođaj nije bio vaginalni, sama je trudnoća ipak opteretila dno zdjelice.',
    s8HighlightTitle: 'Personalizirana skrb može pomoći',
    s8HighlightText:
      'U slučaju većeg puknuća, boli, mokraćnih ili crijevnih simptoma ili trajnih poteškoća, procjena sa zdravstvenim radnikom može biti osobito korisna.',

    s9Heading: 'Postupan povratak sportu',
    s9Body1:
      'Nastavak kretanja nakon porođaja treba biti postupan. Hodanje i blaga kretanja općenito se mogu nastaviti prema tvom osjećaju, dok aktivnosti s jakim udarcima traže više opreza.',
    s9Body2:
      'Prije nastavka trčanja, skakanja ili vrlo intenzivnog treninga najbolje je procijeniti oporavak dna zdjelice i uzeti u obzir sve simptome.',
    s9AlertTitle: 'Ne žuri s fazama',
    s9AlertText:
      'Curenje, osjećaj težine ili bol tokom ili nakon vježbanja znakovi su da trebaš usporiti i zatražiti savjet prije povećanja intenziteta.',

    s10Heading: 'Kada posjetiti specijalista?',
    s10Body1:
      'Rehabilitacija dna zdjelice s babicom ili fizioterapeutom može biti korisna ako nisi sigurna stežeš li pravilno, ako simptomi potraju ili ako želiš s povjerenjem nastaviti određene tjelesne aktivnosti.',
    questionCardTitle: 'Korisna pitanja za postaviti',
    appointmentQuestions: [
      'Jesu li moji simptomi u skladu sa slabošću dna zdjelice?',
      'Izvodim li stezanja ispravno?',
      'Koliko ponavljanja trebam raditi svaki dan?',
      'Mogu li se vratiti trčanju, sportu ili vježbama s jakim udarcima?',
      'Trebam li rehabilitaciju s babicom ili fizioterapeutom?',
      'Zahtijeva li moj ožiljak, puknuće ili carski rez posebne mjere opreza?',
    ],
    s10TipTitle: 'Dobro je znati',
    s10TipText:
      'Posjet stručnoj osobi ne znači nužno da je nešta pogrešno. Jedan termin jednostavno može pomoći provjeriti tvoju tehniku, procijeniti oporavak i naučiti pravilno napredovati.',

    s11Heading: 'Oporavak koji traje',
    s11Body1:
      'Nakon porođaja normalno je da odmah ne povratiš iste osjete ili snagu mišića koje si imala prije trudnoće.',
    s11Body2:
      'Cilj nije izvesti što više stezanja. Prije se radi o postupnom ponovnom stjecanju dobre koordinacije između stezanja i opuštanja, a zatim o prirodnom korištenju tih mišića u svakodnevnim aktivnostima.',
    s11HighlightTitle: 'Mali napredak je pravi napredak',
    s11HighlightText:
      'Bolja svijest o pokretu, nekoliko sekundi duže stezanje ili smanjenje curenja već su ohrabrujući znakovi.',

    s12Heading: 'Ključne poruke',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Trudnoća i porođaj znatno opterećuju dno zdjelice.',
      'Postupan oporavak nakon porođaja je normalan.',
      'U vježbama kvaliteta pokreta ima prednost pred snagom.',
      'Disanje i opuštanje jednako su važni kao stezanje.',
      'Mokraćna curenja, težina ili dugotrajna bol zaslužuju stručno mišljenje.',
      'Rehabilitacija s babicom ili fizioterapeutom može ti pomoći povratiti bolju kontrolu.',
      'Povratak sportu treba biti postupan, osobito kod aktivnosti s jakim udarcima.',
    ],

    finalTipTitle: 'Daj si vremena za oporavak',
    finalTipText:
      'Nakon porođaja tvoje je tijelo prošlo mnoge promjene. Perineum zaslužuje jednaku pozornost kao ostatak tvog tijela: postupno, redovito i bez pritiska.',

    disclaimerText:
      'Ovaj je članak samo informativne naravi i ne zamjenjuje individualni medicinski savjet. Ako osjećaš bol, imaš dugotrajne simptome ili brigu o oporavku, zatraži savjet zdravstvenog radnika.',
  },
  sl: {
    badge: 'PO PORODU • OKREVANJE',
    title: 'Krepitev mišic medeničnega dna\npo porodu',
    metaDuration: '8 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Po nosečnosti in porodu medenično dno potrebuje čas za okrevanje. Preproste, redne in postopne vaje ti lahko pomagajo povrniti moč, nadzor in zaupanje, brez hitenja.',
    contentsTitle: 'V tem članku',
    topics: [
      'Razumevanje vloge presredka',
      'Zakaj ga porod obremeni',
      'Kdaj začeti rehabilitacijo medeničnega dna',
      'Učenje pravilnega stiskanja',
      'Gradnja postopne rutine',
      'Napake, ki se jim je treba izogibati',
      'Kdaj poiskati pomoč',
      'Postopen povratek k športu',
      'Priprava na pregled',
      'Ključna sporočila',
    ],
    shareMessage: 'Krepitev mišic medeničnega dna po porodu — AWA',

    s1Heading: 'Razumevanje vloge presredka',
    s1Body1:
      'Presredek, imenovan tudi medenično dno, je skupina mišic, ki se nahajajo na dnu medenice. Ima vlogo pri nadzoru mehurja in črevesja ter pomaga podpirati medenične organe.',
    s1Body2:
      'Med nosečnostjo morajo te mišice več mesecev nositi dodatno težo. Tudi med porodom so pod veliko obremenitvijo.',
    s1HighlightTitle: 'Diskretna, a bistvena mišica',
    s1HighlightText:
      'Medenično dno sodeluje v več vsakdanjih funkcijah: zadrževanju seča in blata, nadzoru vetrov, podpiranju medeničnih organov in vlogi pri določenih spolnih funkcijah.',

    benefitsHeading: 'Prednosti močnejšega medeničnega dna',
    benefitsIntro:
      'Postopno in pravilno izvajano krepljenje lahko pomaga izboljšati nadzor in podporo medeničnega dna.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Boljši nadzor mehurja',
        text: 'Medenično dno ima vlogo pri nadzoru mehurja. Postopno krepljenje lahko pomaga zmanjšati določeno uhajanje seča.',
      },
      {
        icon: 'toilet',
        title: 'Podpora delovanju črevesja',
        text: 'Te mišice pomagajo tudi pri nadzoru vetrov in blata ter prispevajo k podpiranju medeničnih organov.',
      },
      {
        icon: 'human-female',
        title: 'Podpiranje medeničnih organov',
        text: 'Medenično dno tvori pravo mišično podlago, ki pomaga podpirati mehur, maternico in črevo.',
      },
      {
        icon: 'heart-pulse',
        title: 'Postopna vrnitev občutka',
        text: 'Primerna rehabilitacija ti lahko pomaga tudi bolje občutiti in nadzorovati to območje.',
      },
    ],

    s2Heading: 'Zakaj ga nosečnost in porod obremenita',
    s2Body1:
      'Nosečnost postopoma povečuje pritisk na medenično dno. Vaginalni porod lahko nato močno raztegne mišice in tkiva tega območja.',
    s2Body2:
      'Tudi carski rez medeničnega dna ne prizanese povsem: tudi sama nosečnost ostaja pomembno obdobje za te mišice.',
    s2Body3:
      'Po porodu je zato normalno, da okrevanje traja. Nekatere ženske simptomov skoraj ne čutijo, druge lahko opazijo uhajanje, občutek teže ali zmanjšan nadzor mišic.',
    s2TipTitle: 'Vsako okrevanje je drugačno',
    s2TipText:
      'Vrsta poroda, raztrganina ali epiziotomija, prisotnost bolečine in tvoje splošno stanje po porodu lahko vplivajo na okrevanje.',

    s3Heading: 'Kdaj začeti rehabilitacijo medeničnega dna?',
    s3Body1:
      'Po nezapletenem porodu se nežna stiskanja medeničnega dna običajno lahko postopoma nadaljujejo. Ostaja pomembno vaje prilagoditi svoji situaciji in poiskati nasvet, če si imela zaplet, hudo bolečino ali poseben poseg.',
    s3Body2:
      'Če imaš urinski kateter, nekatera priporočila svetujejo počakati, da se odstrani in se vzpostavi normalno uriniranje, preden začneš z vajami presredka.',
    s3AlertTitle: 'Ne forsiraj bolečine',
    s3AlertText:
      'Huda bolečina, poslabšanje simptomov, rana, ki slabo celi, ali katera koli posebna zaskrbljenost zahtevajo nasvet babice, zdravnika ali strokovnjaka za rehabilitacijo.',

    s4Heading: 'Učenje pravilnega stiskanja',
    s4Body1:
      'Za prepoznavanje gibanja si predstavljaj, da hkrati poskušaš zadržati vetrove in nagon na uriniranje. Gibanje, ki ga iščeš, je občutek stiskanja in dvigovanja navznoter.',
    s4Body2:
      'Cilj ni močno napeti celotnega telesa. Zadnjica, stegna in trebušne mišice naj ostanejo čim bolj sproščene, medtem ko se dihanje nadaljuje normalno.',
    exercises: [
      {icon: 'weather-windy', label: 'Dihanje'},
      {icon: 'human-handsup', label: 'Nežno stiskanje'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Dolgo stiskanje'},
      {icon: 'gesture-tap-button', label: 'Hitra stiskanja'},
    ],
    s4HighlightTitle: 'Sproščanje je enako pomembno',
    s4HighlightText:
      'Po vsakem stiskanju pusti, da se mišice popolnoma sprostijo. Dobra rehabilitacija ne pomeni držati presredka stisnjenega ves dan.',

    s5Heading: 'Gradnja postopne rutine',
    s5Body1:
      'Na začetku je najpomembneje naučiti se prepoznati mišice in pravilno izvesti gib. Doslednost je pomembnejša od intenzivnosti.',
    s5h3a: 'Dolga stiskanja',
    s5Body2:
      'Nežno stisni medenično dno, nato zadrži stiskanje nekaj sekund, ne da bi zadrževala dih. Nato popolnoma spusti, preden začneš znova.',
    s5h3b: 'Kratka stiskanja',
    s5Body3:
      'Ko gib obvladaš, se lahko dodajo majhna hitra stiskanja. Pomagajo vaditi zmožnost hitrega stiskanja mišic, ko se poveča trebušni tlak, na primer tik pred kašljanjem ali kihanjem.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Poveži vaje z vsakodnevno navado'},
      {icon: 'human-sitting', label: 'Začni v udobnem položaju'},
      {icon: 'weather-windy', label: 'Normalno diši med stiskanjem'},
      {icon: 'sleep', label: 'Spoštuj faze sproščanja'},
      {icon: 'chart-line', label: 'Postopoma povečuj težavnost'},
      {icon: 'doctor', label: 'Poišči nasvet, če nisi prepričana'},
    ],
    s5TipTitle: 'Predvsem doslednost',
    s5TipText:
      'Povezovanje vaj z navado, ki je že del tvojega dne, lahko olajša doslednost: po podoju, po pranju zob ali ob drugem primernem času.',

    s6Heading: 'Pogoste napake, ki se jim je treba izogibati',
    s6Body1:
      'Vaje presredka so lahko videti preproste, vendar je zlahka nadomestiti z drugimi mišicami ali preveč forsirati.',
    commonMistakes: [
      'Napenjanje zadnjice ali stegen namesto medeničnega dna',
      'Zadrževanje diha med stiskanjem',
      'Stalno držanje mišic stisnjenih brez sproščanja',
      'Vadba le nekaj dni, nato prenehanje',
      'Namerno prekinjanje curka seča za preverjanje stiskanja',
    ],
    s6TipTitle: 'Česa ne početi',
    s6TipText:
      'Ne priporoča se vaditi z namernim prekinjanjem curka seča. Ta metoda ne vadi presredka pravilno in lahko moti normalno delovanje mehurja.',

    s7Heading: 'Kateri simptomi naj sprožijo posvet?',
    s7Body1:
      'Manjše uhajanje ali nenavaden občutek se lahko včasih pojavi po porodu. Vendar jih ne smemo zanemariti, če vztrajajo, se poslabšajo ali motijo tvoje vsakdanje življenje.',
    warningSigns: [
      'Uhajanje seča pri kašljanju, kihanju, smejanju ali naprezanju',
      'Občutek teže ali pritiska v spodnjem delu medenice',
      'Občutek, da se bulica ali nekaj spušča v nožnico',
      'Težave pri zadrževanju vetrov ali blata',
      'Dolgotrajna bolečina v presredku',
      'Bolečina med spolnim odnosom ali po njem',
      'Težave pri prepoznavanju ali pravilnem stiskanju mišic presredka',
    ],
    consultLabel: 'Kdaj poiskati nasvet?',
    s7Body2:
      'Babica, zdravnik ali fizioterapevt, specializiran za rehabilitacijo medeničnega dna, lahko preveri delovanje mišic in predlaga primeren program.',

    s8Heading: 'In po raztrganini, epiziotomiji ali carskem rezu?',
    s8Body1:
      'Raztrganina ali epiziotomija zahteva posebno nego med celjenjem. Nadaljevanje dejavnosti naj upošteva bolečino, stanje brazgotine in navodila, prejeta po porodu.',
    s8Body2:
      'Po carskem rezu okrevanje vključuje tudi trebušno steno in brazgotino. Tudi če porod ni bil vaginalen, je sama nosečnost vseeno obremenila medenično dno.',
    s8HighlightTitle: 'Personalizirana oskrba lahko pomaga',
    s8HighlightText:
      'V primeru večje raztrganine, bolečine, urinskih ali črevesnih simptomov ali trajnih težav je ocena z zdravstvenim delavcem lahko še posebej koristna.',

    s9Heading: 'Postopen povratek k športu',
    s9Body1:
      'Nadaljevanje gibanja po porodu naj bo postopno. Hoja in nežna gibanja se na splošno lahko nadaljujejo glede na tvoje počutje, dejavnosti z močnimi udarci pa zahtevajo več previdnosti.',
    s9Body2:
      'Pred nadaljevanjem teka, skakanja ali zelo intenzivnega treninga je najbolje oceniti okrevanje medeničnega dna in upoštevati vse simptome.',
    s9AlertTitle: 'Ne hiti s fazami',
    s9AlertText:
      'Uhajanje, občutek teže ali bolečina med vadbo ali po njej so znaki, da moraš upočasniti in poiskati nasvet, preden povečaš intenzivnost.',

    s10Heading: 'Kdaj obiskati specialista?',
    s10Body1:
      'Rehabilitacija medeničnega dna z babico ali fizioterapevtom je lahko koristna, če nisi prepričana, ali pravilno stiskaš, če simptomi vztrajajo ali če želiš z zaupanjem nadaljevati določene telesne dejavnosti.',
    questionCardTitle: 'Koristna vprašanja za postavitev',
    appointmentQuestions: [
      'Ali so moji simptomi skladni s šibkostjo medeničnega dna?',
      'Ali stiskanja izvajam pravilno?',
      'Koliko ponovitev naj naredim vsak dan?',
      'Ali se lahko vrnem k teku, športu ali vajam z močnimi udarci?',
      'Ali potrebujem rehabilitacijo z babico ali fizioterapevtom?',
      'Ali moja brazgotina, raztrganina ali carski rez zahtevajo posebne previdnostne ukrepe?',
    ],
    s10TipTitle: 'Vredno vedeti',
    s10TipText:
      'Obisk strokovnjaka ne pomeni nujno, da je kaj narobe. En termin ti lahko preprosto pomaga preveriti tehniko, oceniti okrevanje in se naučiti pravilno napredovati.',

    s11Heading: 'Okrevanje, ki traja',
    s11Body1:
      'Po porodu je normalno, da ne povrneš takoj istih občutkov ali moči mišic, ki si jih imela pred nosečnostjo.',
    s11Body2:
      'Cilj ni izvesti čim več stiskanj. Prej gre za postopno ponovno pridobivanje dobre koordinacije med stiskanjem in sproščanjem, nato pa za naravno uporabo teh mišic v vsakdanjih dejavnostih.',
    s11HighlightTitle: 'Majhen napredek je pravi napredek',
    s11HighlightText:
      'Boljše zavedanje gibanja, nekaj sekund daljše stiskanje ali zmanjšanje uhajanja so že spodbudni znaki.',

    s12Heading: 'Ključna sporočila',
    summaryTitle: 'Najpomembnejše',
    summaryItems: [
      'Nosečnost in porod močno obremenita medenično dno.',
      'Postopno okrevanje po porodu je normalno.',
      'Pri vajah ima kakovost gibanja prednost pred močjo.',
      'Dihanje in sproščanje sta enako pomembna kot stiskanje.',
      'Uhajanje seča, teža ali dolgotrajna bolečina si zaslužijo strokovno mnenje.',
      'Rehabilitacija z babico ali fizioterapevtom ti lahko pomaga povrniti boljši nadzor.',
      'Povratek k športu naj bo postopen, zlasti pri dejavnostih z močnimi udarci.',
    ],

    finalTipTitle: 'Daj si časa za okrevanje',
    finalTipText:
      'Po porodu je tvoje telo prestalo veliko sprememb. Presredek si zasluži enako pozornost kot preostanek tvojega telesa: postopno, redno in brez pritiska.',

    disclaimerText:
      'Ta članek je samo informativne narave in ne nadomešča osebnega zdravniškega nasveta. Če čutiš bolečino, imaš dolgotrajne simptome ali skrb glede okrevanja, poišči nasvet zdravstvenega delavca.',
  },
  ne: {
    badge: 'सुत्केरीपछि • स्वास्थ्यलाभ',
    title: 'प्रसवपछि आफ्नो पेल्भिक फ्लोर\nबलियो बनाउनुहोस्',
    metaDuration: '8 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'गर्भावस्था र प्रसवपछि, पेल्भिक फ्लोरलाई निको हुन समय चाहिन्छ। सरल, नियमित र क्रमिक व्यायामहरूले हतार गर्न नखोजी तपाईंलाई बल, नियन्त्रण र आत्मविश्वास फिर्ता पाउन मद्दत गर्न सक्छन्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'पेरिनियमको भूमिका बुझ्ने',
      'प्रसवले यसमा किन तनाव पार्छ',
      'पेल्भिक फ्लोर पुनर्स्थापना कहिले सुरु गर्ने',
      'सही तरिकाले खुम्चन सिक्ने',
      'क्रमिक दिनचर्या निर्माण गर्ने',
      'जोगिनुपर्ने गल्तीहरू',
      'मद्दत कहिले माग्ने',
      'क्रमशः खेलकुद फेरि सुरु गर्ने',
      'भेटघाटको तयारी',
      'मुख्य कुराहरू',
    ],
    shareMessage: 'प्रसवपछि आफ्नो पेल्भिक फ्लोर बलियो बनाउनुहोस् — AWA',

    s1Heading: 'पेरिनियमको भूमिका बुझ्ने',
    s1Body1:
      'पेरिनियम, जसलाई पेल्भिक फ्लोर पनि भनिन्छ, पेल्भिसको आधारमा रहेका मांसपेशीहरूको समूह हो। यसले मूत्राशय र आन्द्राको नियन्त्रणमा भूमिका खेल्छ र पेल्भिक अङ्गहरूलाई सहारा दिन मद्दत गर्छ।',
    s1Body2:
      'गर्भावस्थाको क्रममा, यी मांसपेशीहरूले धेरै महिनासम्म अतिरिक्त तौल बोक्नुपर्छ। प्रसवको समयमा पनि तिनीहरू ठूलो तनावमा पर्छन्।',
    s1HighlightTitle: 'एउटा गोप्य तर आवश्यक मांसपेशी',
    s1HighlightText:
      'पेल्भिक फ्लोर धेरै दैनिक कार्यमा संलग्न हुन्छ: पिसाब र दिसा रोक्ने, ग्यास नियन्त्रण गर्ने, पेल्भिक अङ्गहरूलाई सहारा दिने, र केही यौन कार्यमा भूमिका खेल्ने।',

    benefitsHeading: 'बलियो पेल्भिक फ्लोरका फाइदाहरू',
    benefitsIntro:
      'क्रमिक, सही तरिकाले गरिएको बलियो बनाउने अभ्यासले पेल्भिक फ्लोरको नियन्त्रण र सहारा सुधार्न मद्दत गर्न सक्छ।',
    benefits: [
      {
        icon: 'water-outline',
        title: 'राम्रो मूत्राशय नियन्त्रण',
        text: 'पेल्भिक फ्लोरले मूत्राशयको नियन्त्रणमा भूमिका खेल्छ। यसलाई बिस्तारै बलियो बनाउनाले केही पिसाब चुहिने कम गर्न मद्दत गर्न सक्छ।',
      },
      {
        icon: 'toilet',
        title: 'आन्द्राको कार्यलाई साथ दिने',
        text: 'यी मांसपेशीहरूले ग्यास र दिसा नियन्त्रण गर्न पनि मद्दत गर्छन् र पेल्भिक अङ्गहरूलाई सहारा दिन योगदान पुर्‍याउँछन्।',
      },
      {
        icon: 'human-female',
        title: 'पेल्भिक अङ्गहरूलाई सहारा दिने',
        text: 'पेल्भिक फ्लोरले वास्तविक मांसपेशीय आधार बनाउँछ जसले मूत्राशय, गर्भाशय र आन्द्रालाई सहारा दिन मद्दत गर्छ।',
      },
      {
        icon: 'heart-pulse',
        title: 'बिस्तारै संवेदना फिर्ता पाउने',
        text: 'उपयुक्त पुनर्स्थापनाले तपाईंलाई यस भागको राम्रो सचेतना र नियन्त्रण फिर्ता पाउन पनि मद्दत गर्न सक्छ।',
      },
    ],

    s2Heading: 'गर्भावस्था र प्रसवले यसमा किन तनाव पार्छ',
    s2Body1:
      'गर्भावस्थाले बिस्तारै पेल्भिक फ्लोरमा बढी दबाब थप्छ। योनिमार्गबाट प्रसवले त्यसपछि यस भागका मांसपेशी र तन्तुहरूलाई उल्लेखनीय रूपमा तान्न सक्छ।',
    s2Body2:
      'सिजेरियनले पनि पेल्भिक फ्लोरलाई पूर्ण रूपमा बचाउँदैन: गर्भावस्था आफैँ यी मांसपेशीहरूका लागि एउटा महत्त्वपूर्ण अवधि रहन्छ।',
    s2Body3:
      'प्रसवपछि, त्यसैले स्वास्थ्यलाभले समय लिनु सामान्य हो। केही महिलाले लगभग कुनै लक्षण महसुस गर्दैनन्, जबकि अरूले चुहिने, भारीपनको अनुभूति, वा मांसपेशीको नियन्त्रणमा कमी देख्न सक्छन्।',
    s2TipTitle: 'हरेक स्वास्थ्यलाभ फरक हुन्छ',
    s2TipText:
      'प्रसवको प्रकार, च्यातिने वा एपिसियोटोमी, दुखाइको उपस्थिति, र प्रसवपछि तपाईंको सामान्य अवस्थाले स्वास्थ्यलाभलाई प्रभाव पार्न सक्छन्।',

    s3Heading: 'पेल्भिक फ्लोर पुनर्स्थापना कहिले सुरु गर्ने?',
    s3Body1:
      'जटिलताबिनाको प्रसवपछि, पेल्भिक फ्लोरको कोमल खुम्चाइ सामान्यतया बिस्तारै फेरि सुरु गर्न सकिन्छ। अभ्यासहरू तपाईंको अवस्थाअनुसार मिलाउनु र तपाईंलाई जटिलता, ठूलो दुखाइ वा कुनै विशेष प्रक्रिया भएको थियो भने सल्लाह लिनु महत्त्वपूर्ण रहन्छ।',
    s3Body2:
      'तपाईंसँग मूत्र क्याथेटर छ भने, केही सिफारिसले पेरिनियमका अभ्यास सुरु गर्नुअघि यो हटाइएको र सामान्य पिसाब फेरि सुरु भएको पर्खन सुझाउँछन्।',
    s3AlertTitle: 'दुखाइ सहेर नगर्नुहोस्',
    s3AlertText:
      'ठूलो दुखाइ, बिग्रँदो लक्षण, राम्ररी निको नभएको घाउ, वा कुनै विशेष चिन्ताले सुँडेनी, चिकित्सक वा पुनर्स्थापना व्यावसायिकको सल्लाह चाहिन्छ।',

    s4Heading: 'सही तरिकाले खुम्चन सिक्ने',
    s4Body1:
      'चाल पहिचान गर्न, एकसाथ ग्यास र पिसाब आउने इच्छालाई रोक्न खोजेको कल्पना गर्नुहोस्। तपाईंले खोजेको चाल भित्रतिर खुम्चिने र माथि तानिने अनुभूति हो।',
    s4Body2:
      'लक्ष्य तपाईंको पूरै शरीरलाई कसिलो पार्नु होइन। सास सामान्य रूपमा चलिरहँदा, तपाईंका नितम्ब, तिघ्रा र पेटका मांसपेशीहरू सकेसम्म आरामदायी रहनुपर्छ।',
    exercises: [
      {icon: 'weather-windy', label: 'सास फेर्ने'},
      {icon: 'human-handsup', label: 'कोमल खुम्चाइ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'लामो खुम्चाइ'},
      {icon: 'gesture-tap-button', label: 'छिटो खुम्चाइहरू'},
    ],
    s4HighlightTitle: 'आराम गर्नु पनि उत्तिकै महत्त्वपूर्ण छ',
    s4HighlightText:
      'हरेक खुम्चाइपछि, मांसपेशीहरूलाई पूर्ण रूपमा आराम गर्न दिनुहोस्। राम्रो पुनर्स्थापनाको अर्थ दिनभर पेरिनियमलाई खुम्च्याइराख्नु होइन।',

    s5Heading: 'क्रमिक दिनचर्या निर्माण गर्ने',
    s5Body1:
      'सुरुमा, सबैभन्दा महत्त्वपूर्ण कुरा मांसपेशीहरू पहिचान गर्न र चाल सही तरिकाले गर्न सिक्नु हो। तीव्रताभन्दा निरन्तरता महत्त्वपूर्ण हुन्छ।',
    s5h3a: 'लामो खुम्चाइहरू',
    s5Body2:
      'पेल्भिक फ्लोरलाई कोमलतापूर्वक खुम्च्याउनुहोस्, त्यसपछि सास नरोकी केही सेकेन्डसम्म खुम्चाइ समात्नुहोस्। त्यसपछि फेरि सुरु गर्नुअघि पूर्ण रूपमा छोड्नुहोस्।',
    s5h3b: 'छोटो खुम्चाइहरू',
    s5Body3:
      'चाल सिकिसकेपछि, साना छिटो खुम्चाइहरू थप्न सकिन्छ। तिनले पेटमा दबाब बढ्दा, उदाहरणका लागि खोक्ने वा हाच्छ्युँ गर्नुअघि, मांसपेशीहरू छिटो खुम्च्याउने तपाईंको क्षमतालाई तालिम दिन मद्दत गर्छन्।',
    dailyTips: [
      {icon: 'clock-outline', label: 'अभ्यासहरूलाई दैनिक बानीसँग जोड्नुहोस्'},
      {icon: 'human-sitting', label: 'सहज अवस्थाबाट सुरु गर्नुहोस्'},
      {icon: 'weather-windy', label: 'खुम्चाइको समयमा सामान्य रूपमा सास फेर्नुहोस्'},
      {icon: 'sleep', label: 'आरामका चरणहरूको सम्मान गर्नुहोस्'},
      {icon: 'chart-line', label: 'बिस्तारै कठिनाइ बढाउनुहोस्'},
      {icon: 'doctor', label: 'अनिश्चित भए सल्लाह लिनुहोस्'},
    ],
    s5TipTitle: 'सबैभन्दा पहिले निरन्तरता',
    s5TipText:
      'अभ्यासहरूलाई तपाईंको दिनमा पहिल्यै रहेको बानीसँग जोड्दा निरन्तरता कायम राख्न सजिलो हुन सक्छ: दूध खुवाइपछि, दाँत माझेपछि, वा तपाईंलाई उपयुक्त अर्को समयमा।',

    s6Heading: 'जोगिनुपर्ने सामान्य गल्तीहरू',
    s6Body1:
      'पेरिनियमका अभ्यासहरू सरल देखिन सक्छन्, तर अन्य मांसपेशीहरूले क्षतिपूर्ति गर्न वा धेरै जोडले धकेल्न सजिलो हुन्छ।',
    commonMistakes: [
      'पेल्भिक फ्लोरको सट्टा नितम्ब वा तिघ्राहरू कसिलो पार्ने',
      'खुम्चाइको समयमा सास रोक्ने',
      'मांसपेशीहरूलाई आराम गर्न नदिई निरन्तर खुम्च्याइराख्ने',
      'केही दिन मात्र अभ्यास गरेर रोक्ने',
      'खुम्चाइ जाँच्न जानाजानी पिसाबको धार रोक्ने',
    ],
    s6TipTitle: 'के नगर्ने',
    s6TipText:
      'जानाजानी पिसाबको धार रोकेर अभ्यास गर्न सिफारिस गरिँदैन। यो विधिले पेरिनियमलाई सही तरिकाले तालिम दिँदैन र मूत्राशयको सामान्य कार्यमा बाधा पुर्‍याउन सक्छ।',

    s7Heading: 'कुन लक्षणहरूले परामर्श गर्न प्रेरित गर्नुपर्छ?',
    s7Body1:
      'साना चुहिने वा असामान्य अनुभूति कहिलेकाहीँ प्रसवपछि देखिन सक्छ। तथापि, ती रहिरहे, बिग्रे, वा तपाईंको दैनिक जीवनमा बाधा पुर्‍याएमा बेवास्ता गर्नु हुँदैन।',
    warningSigns: [
      'खोक्दा, हाच्छ्युँ गर्दा, हाँस्दा वा जोड गर्दा पिसाब चुहिने',
      'तल्लो पेल्भिसमा भारीपन वा दबाबको अनुभूति',
      'योनिमा कुनै डल्लो वा केही झर्दै गरेको अनुभूति',
      'ग्यास वा दिसा रोक्न कठिनाइ',
      'पेरिनियममा लगातार दुखाइ',
      'यौन सम्पर्कको समयमा वा पछि दुखाइ',
      'पेरिनियमका मांसपेशीहरू पहिचान गर्न वा सही रूपमा खुम्च्याउन कठिनाइ',
    ],
    consultLabel: 'सल्लाह कहिले लिने?',
    s7Body2:
      'पेल्भिक फ्लोर पुनर्स्थापनामा विशेषज्ञ सुँडेनी, चिकित्सक वा फिजियोथेरापिस्टले मांसपेशीको कार्य जाँच्न र उपयुक्त कार्यक्रम सुझाउन सक्छन्।',

    s8Heading: 'च्यातिएपछि, एपिसियोटोमी वा सिजेरियनपछि के?',
    s8Body1:
      'च्यातिने वा एपिसियोटोमीले निको हुने क्रममा विशेष ध्यान चाहिन्छ। गतिविधि फेरि सुरु गर्दा दुखाइ, डामको अवस्था, र प्रसवपछि दिइएको मार्गदर्शनलाई ध्यानमा राख्नुपर्छ।',
    s8Body2:
      'सिजेरियनपछि, स्वास्थ्यलाभमा पेटको भित्ता र डाम पनि संलग्न हुन्छन्। प्रसव योनिमार्गबाट नभए पनि, गर्भावस्थाले आफैँ पेल्भिक फ्लोरमा तनाव पारेकै थियो।',
    s8HighlightTitle: 'व्यक्तिगत हेरचाहले मद्दत गर्न सक्छ',
    s8HighlightText:
      'ठूलो च्यातिने, दुखाइ, पिसाब वा आन्द्रासम्बन्धी लक्षण, वा लगातार कठिनाइहरूको अवस्थामा, स्वास्थ्यकर्मीसँगको मूल्याङ्कन विशेष रूपमा मद्दतकारी हुन सक्छ।',

    s9Heading: 'क्रमशः खेलकुद फेरि सुरु गर्ने',
    s9Body1:
      'प्रसवपछि चाल फेरि सुरु गर्नु क्रमिक हुनुपर्छ। हिँडाइ र कोमल चालहरू सामान्यतया तपाईंलाई कस्तो लाग्छ त्यसअनुसार फेरि सुरु गर्न सकिन्छ, जबकि उच्च-प्रभावका गतिविधिहरूमा बढी सावधानी चाहिन्छ।',
    s9Body2:
      'दौड, उफ्रने वा निकै तीव्र प्रशिक्षण फेरि सुरु गर्नुअघि, पेल्भिक फ्लोरको स्वास्थ्यलाभको मूल्याङ्कन गर्नु र कुनै लक्षणहरूलाई ध्यानमा राख्नु उत्तम हुन्छ।',
    s9AlertTitle: 'चरणहरूमा हतार नगर्नुहोस्',
    s9AlertText:
      'व्यायामको समयमा वा पछि चुहिने, भारीपनको अनुभूति वा दुखाइ तपाईंले ढिलो गर्नुपर्छ र तीव्रता बढाउनुअघि सल्लाह लिनुपर्छ भन्ने संकेत हुन्।',

    s10Heading: 'विशेषज्ञलाई कहिले देखाउने?',
    s10Body1:
      'तपाईं सही रूपमा खुम्चिरहेको छु कि छैन भन्नेमा अनिश्चित हुनुहुन्छ, तपाईंका लक्षणहरू रहिरहेका छन्, वा तपाईं आत्मविश्वासका साथ केही शारीरिक गतिविधिहरू फेरि सुरु गर्न चाहनुहुन्छ भने सुँडेनी वा फिजियोथेरापिस्टसँग पेल्भिक फ्लोर पुनर्स्थापना मद्दतकारी हुन सक्छ।',
    questionCardTitle: 'सोध्न उपयोगी प्रश्नहरू',
    appointmentQuestions: [
      'के मेरा लक्षणहरू पेल्भिक फ्लोरको कमजोरीसँग मेल खान्छन्?',
      'के म खुम्चाइहरू सही तरिकाले गरिरहेको छु?',
      'मैले हरेक दिन कति पटक दोहोर्‍याउनुपर्छ?',
      'के म दौड, खेलकुद वा उच्च-प्रभावको व्यायाममा फर्कन सक्छु?',
      'के मलाई सुँडेनी वा फिजियोथेरापिस्टसँग पुनर्स्थापना चाहिन्छ?',
      'के मेरो डाम, च्यातिएको ठाउँ वा सिजेरियनले कुनै विशेष सावधानी चाहिन्छ?',
    ],
    s10TipTitle: 'जान्न लायक',
    s10TipText:
      'व्यावसायिकलाई भेट्नुको अर्थ केही गडबड छ भन्ने अनिवार्य होइन। एउटा सत्रले तपाईंको प्रविधि जाँच्न, स्वास्थ्यलाभको मूल्याङ्कन गर्न र सही रूपमा प्रगति गर्न सिक्न मद्दत गर्न सक्छ।',

    s11Heading: 'समय लाग्ने स्वास्थ्यलाभ',
    s11Body1:
      'प्रसवपछि, गर्भावस्थाअघि भएको उस्तै संवेदना वा मांसपेशीको बल तुरुन्तै फिर्ता नपाउनु सामान्य हो।',
    s11Body2:
      'लक्ष्य सकेसम्म धेरै खुम्चाइ गर्नु होइन। यो खुम्चाइ र आरामबीच राम्रो समन्वय बिस्तारै फिर्ता पाउनु, र त्यसपछि दैनिक गतिविधिमा यी मांसपेशीहरू स्वाभाविक रूपमा प्रयोग गर्न सक्षम हुनु बढी हो।',
    s11HighlightTitle: 'साना प्रगति नै वास्तविक प्रगति हुन्',
    s11HighlightText:
      'चालको राम्रो सचेतना, खुम्चाइमा केही सेकेन्ड थप, वा चुहिने कम हुनु पहिल्यै प्रोत्साहन दिने संकेतहरू हुन्।',

    s12Heading: 'मुख्य कुराहरू',
    summaryTitle: 'आवश्यक कुराहरू',
    summaryItems: [
      'गर्भावस्था र प्रसवले पेल्भिक फ्लोरमा ठूलो तनाव पार्छन्।',
      'प्रसवपछि क्रमिक स्वास्थ्यलाभ सामान्य हो।',
      'अभ्यासहरूमा बलभन्दा चालको गुणस्तरलाई प्राथमिकता दिनुपर्छ।',
      'सास र आराम खुम्चाइजत्तिकै महत्त्वपूर्ण छन्।',
      'पिसाब चुहिने, भारीपन वा लगातार दुखाइले व्यावसायिक रायको आवश्यकता पर्छ।',
      'सुँडेनी वा फिजियोथेरापिस्टसँगको पुनर्स्थापनाले तपाईंलाई राम्रो नियन्त्रण फिर्ता पाउन मद्दत गर्न सक्छ।',
      'खेलकुदमा फर्कनु क्रमिक हुनुपर्छ, विशेष गरी उच्च-प्रभावका गतिविधिहरूका लागि।',
    ],

    finalTipTitle: 'निको हुन समय लिनुहोस्',
    finalTipText:
      'प्रसवपछि, तपाईंको शरीर धेरै परिवर्तनबाट गुज्रिएको छ। पेरिनियमले तपाईंको बाँकी शरीरजत्तिकै ध्यान पाउन लायक छ: बिस्तारै, नियमित रूपमा, र दबाबबिना।',

    disclaimerText:
      'यो लेख केवल जानकारीका लागि हो र व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। तपाईंलाई दुखाइ, लगातार लक्षण वा आफ्नो स्वास्थ्यलाभबारे कुनै चिन्ता छ भने, स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
  },
  si: {
    badge: 'ප්‍රසූතියෙන් පසු • යථා තත්ත්වයට පැමිණීම',
    title: 'ප්‍රසූතියෙන් පසු ඔබේ ශ්‍රෝණි පතුල\nශක්තිමත් කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 8',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'ගර්භණී කාලයෙන් සහ ප්‍රසූතියෙන් පසු, ශ්‍රෝණි පතුලට යථා තත්ත්වයට පැමිණීමට කාලය අවශ්‍යයි. සරල, නිතිපතා සහ ක්‍රමානුකූල ව්‍යායාම, දේවල් ඉක්මන් කිරීමට උත්සාහ නොකර, ශක්තිය, පාලනය සහ විශ්වාසය නැවත ලබා ගැනීමට ඔබට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පෙරිනියමයේ කාර්යභාරය තේරුම් ගැනීම',
      'ප්‍රසූතිය එයට ආතතියක් ඇති කරන්නේ ඇයි',
      'ශ්‍රෝණි පතුල් පුනරුත්ථාපනය ආරම්භ කළ යුත්තේ කවදාද',
      'නිවැරදිව සංකෝචනය කිරීමට ඉගෙනීම',
      'ක්‍රමානුකූල පුරුද්දක් ගොඩනැගීම',
      'වළක්වා ගත යුතු වැරදි',
      'උදව් ඉල්ලිය යුත්තේ කවදාද',
      'ක්‍රීඩා ක්‍රමයෙන් නැවත ආරම්භ කිරීම',
      'හමුවීමකට සූදානම් වීම',
      'ප්‍රධාන කරුණු',
    ],
    shareMessage: 'ප්‍රසූතියෙන් පසු ඔබේ ශ්‍රෝණි පතුල ශක්තිමත් කිරීම — AWA',

    s1Heading: 'පෙරිනියමයේ කාර්යභාරය තේරුම් ගැනීම',
    s1Body1:
      'ශ්‍රෝණි පතුල ලෙසද හැඳින්වෙන පෙරිනියම යනු ශ්‍රෝණියේ පාදයේ පිහිටි මාංශ පේශි සමූහයකි. එය මුත්‍රාශය සහ බඩවැල් පාලනයේ කාර්යභාරයක් ඉටු කරන අතර ශ්‍රෝණි අවයව ආධාර කිරීමට උපකාරී වේ.',
    s1Body2:
      'ගර්භණී කාලය තුළ, මෙම මාංශ පේශිවලට මාස කිහිපයක් අමතර බරක් දැරීමට සිදුවේ. ප්‍රසූතියේදීද ඒවා සැලකිය යුතු ආතතියකට ලක් වේ.',
    s1HighlightTitle: 'රහසිගත නමුත් අත්‍යවශ්‍ය මාංශ පේශියක්',
    s1HighlightText:
      'ශ්‍රෝණි පතුල එදිනෙදා කාර්යයන් කිහිපයකට සම්බන්ධ වේ: මුත්‍රා සහ මළ ද්‍රව්‍ය රඳවා ගැනීම, වායු පාලනය, ශ්‍රෝණි අවයව ආධාර කිරීම, සහ සමහර ලිංගික කාර්යයන්හි කාර්යභාරයක් ඉටු කිරීම.',

    benefitsHeading: 'ශක්තිමත් ශ්‍රෝණි පතුලක ප්‍රතිලාභ',
    benefitsIntro:
      'ක්‍රමානුකූල, නිවැරදිව සිදු කළ ශක්තිමත් කිරීම ශ්‍රෝණි පතුල් පාලනය සහ ආධාරය වැඩිදියුණු කිරීමට උපකාරී විය හැක.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'වඩා හොඳ මුත්‍රාශ පාලනය',
        text: 'ශ්‍රෝණි පතුල මුත්‍රාශ පාලනයේ කාර්යභාරයක් ඉටු කරයි. එය ක්‍රමයෙන් ශක්තිමත් කිරීම සමහර මුත්‍රා කාන්දු වීම් අඩු කිරීමට උපකාරී විය හැක.',
      },
      {
        icon: 'toilet',
        title: 'බඩවැල් ක්‍රියාකාරිත්වයට සහාය වීම',
        text: 'මෙම මාංශ පේශි වායු සහ මළ ද්‍රව්‍ය පාලනයටද උපකාරී වන අතර ශ්‍රෝණි අවයව ආධාර කිරීමට දායක වේ.',
      },
      {
        icon: 'human-female',
        title: 'ශ්‍රෝණි අවයවවලට සහාය වීම',
        text: 'ශ්‍රෝණි පතුල මුත්‍රාශය, ගර්භාෂය සහ බඩවැල ආධාර කිරීමට උපකාරී වන සැබෑ මාංශ පේශි පදනමක් සාදයි.',
      },
      {
        icon: 'heart-pulse',
        title: 'සංවේදනය ක්‍රමයෙන් නැවත ලබා ගැනීම',
        text: 'සුදුසු පුනරුත්ථාපනය මෙම ප්‍රදේශය පිළිබඳ වඩා හොඳ දැනුවත්භාවයක් සහ පාලනයක් නැවත ලබා ගැනීමටද උපකාරී විය හැක.',
      },
    ],

    s2Heading: 'ගර්භණී කාලය සහ ප්‍රසූතිය එයට ආතතියක් ඇති කරන්නේ ඇයි',
    s2Body1:
      'ගර්භණී කාලය ක්‍රමයෙන් ශ්‍රෝණි පතුලට වැඩි පීඩනයක් යොදයි. යෝනි මාර්ගයෙන් ප්‍රසූතිය එවිට මෙම ප්‍රදේශයේ මාංශ පේශි සහ පටක සැලකිය යුතු ලෙස දිගු කළ හැක.',
    s2Body2:
      'සීසර් සැත්කමකින් ද ශ්‍රෝණි පතුල සම්පූර්ණයෙන් බේරා නොගනී: ගර්භණී කාලයම මෙම මාංශ පේශි සඳහා සැලකිය යුතු කාලයක් ලෙස පවතී.',
    s2Body3:
      'ප්‍රසූතියෙන් පසු, එබැවින් යථා තත්ත්වයට පැමිණීමට කාලය ගැනීම සාමාන්‍යයි. සමහර කාන්තාවන්ට රෝග ලක්ෂණ ආසන්න වශයෙන් නොදැනෙන අතර, අනෙක් අයට කාන්දු වීම්, බරක් දැනීමක්, හෝ අඩු මාංශ පේශි පාලනයක් දැකිය හැක.',
    s2TipTitle: 'සෑම යථා තත්ත්වයට පැමිණීමක්ම වෙනස්',
    s2TipText:
      'ප්‍රසූත වර්ගය, ඉරීමක් හෝ එපිසියෝටෝමියක්, වේදනාවක් තිබීම, සහ ප්‍රසූතියෙන් පසු ඔබේ සාමාන්‍ය තත්ත්වය සියල්ලම යථා තත්ත්වයට පැමිණීමට බලපෑ හැක.',

    s3Heading: 'ශ්‍රෝණි පතුල් පුනරුත්ථාපනය ආරම්භ කළ යුත්තේ කවදාද?',
    s3Body1:
      'සංකූලතා රහිත ප්‍රසූතියකින් පසු, මෘදු ශ්‍රෝණි පතුල් සංකෝචන සාමාන්‍යයෙන් ක්‍රමයෙන් නැවත ආරම්භ කළ හැක. ඔබ සංකූලතාවයක්, සැලකිය යුතු වේදනාවක්, හෝ නිශ්චිත ක්‍රියාපටිපාටියක් අත්විඳ ඇත්නම්, ව්‍යායාම ඔබේ තත්ත්වයට සකස් කිරීම සහ උපදෙස් ලබා ගැනීම වැදගත් ලෙස පවතී.',
    s3Body2:
      'ඔබට මුත්‍රා කැතීටරයක් තිබේ නම්, සමහර නිර්දේශ පෙරිනියම් ව්‍යායාම ආරම්භ කිරීමට පෙර එය ඉවත් කර සාමාන්‍ය මුත්‍රා කිරීම නැවත ආරම්භ වන තුරු බලා සිටීමට යෝජනා කරයි.',
    s3AlertTitle: 'වේදනාව හරහා බල නොකරන්න',
    s3AlertText:
      'සැලකිය යුතු වේදනාව, නරක අතට හැරෙන රෝග ලක්ෂණ, නරක ලෙස සුවවන තුවාලයක්, හෝ කිසියම් විශේෂ කනස්සල්ලක් ප්‍රසව හෙදියකගෙන්, වෛද්‍යවරයෙකුගෙන් හෝ පුනරුත්ථාපන වෘත්තිකයෙකුගෙන් උපදෙස් ඉල්ලා සිටී.',

    s4Heading: 'නිවැරදිව සංකෝචනය කිරීමට ඉගෙනීම',
    s4Body1:
      'චලනය හඳුනාගැනීමට, එකවරම වායු සහ මුත්‍රා කිරීමේ ආශාව රඳවා ගැනීමට උත්සාහ කරන බව සිතන්න. ඔබ සොයන චලනය සංකෝචනයේ සහ ඇතුළතට එසවීමේ සංවේදනයකි.',
    s4Body2:
      'අරමුණ ඔබේ මුළු ශරීරයම තදින් ආතතියට පත් කිරීම නොවේ. ඔබේ උකුල්, කලවා සහ උදර මාංශ පේශි හැකි තරම් ලිහිල්ව පැවතිය යුතු අතර, හුස්ම ගැනීම සාමාන්‍ය ලෙස දිගටම පවතී.',
    exercises: [
      {icon: 'weather-windy', label: 'හුස්ම ගැනීම'},
      {icon: 'human-handsup', label: 'මෘදු සංකෝචනය'},
      {icon: 'arrow-up-bold-circle-outline', label: 'දිගු සංකෝචනය'},
      {icon: 'gesture-tap-button', label: 'ඉක්මන් සංකෝචන'},
    ],
    s4HighlightTitle: 'ලිහිල් වීමද එතරම්ම වැදගත්',
    s4HighlightText:
      'සෑම සංකෝචනයකින් පසුවම, මාංශ පේශි සම්පූර්ණයෙන්ම ලිහිල් වීමට ඉඩ දෙන්න. හොඳ පුනරුත්ථාපනය යනු දවස පුරා පෙරිනියම සංකෝචනය කර තබාගැනීම අදහස් නොවේ.',

    s5Heading: 'ක්‍රමානුකූල පුරුද්දක් ගොඩනැගීම',
    s5Body1:
      'මුලදී, වැදගත්ම දේ නම් මාංශ පේශි හඳුනාගෙන චලනය නිවැරදිව ඉටු කිරීමට ඉගෙනීමයි. තීව්‍රතාවට වඩා ස්ථාවර බව වැදගත්.',
    s5h3a: 'දිගු සංකෝචන',
    s5Body2:
      'ශ්‍රෝණි පතුල මෘදුවට සංකෝචනය කර, ඉන්පසු ඔබේ හුස්ම නොරඳවා තත්පර කිහිපයක් සඳහා සංකෝචනය රඳවා ගන්න. ඉන්පසු නැවත ආරම්භ කිරීමට පෙර සම්පූර්ණයෙන්ම මුදාහරින්න.',
    s5h3b: 'කෙටි සංකෝචන',
    s5Body3:
      'චලනය ප්‍රගුණ කළ පසු, කුඩා ඉක්මන් සංකෝචන එකතු කළ හැක. උදර පීඩනය වැඩි වන විට, උදාහරණයක් ලෙස කැස්සට හෝ කිවිසුමට මොහොතකට පෙර, මාංශ පේශි ඉක්මනින් සංකෝචනය කිරීමේ ඔබේ හැකියාව පුහුණු කිරීමට ඒවා උපකාරී වේ.',
    dailyTips: [
      {icon: 'clock-outline', label: 'ව්‍යායාම එදිනෙදා පුරුද්දක් සමඟ ඒකාබද්ධ කරන්න'},
      {icon: 'human-sitting', label: 'සුවපහසු ඉරියව්වකින් ආරම්භ කරන්න'},
      {icon: 'weather-windy', label: 'සංකෝචන අතරතුර සාමාන්‍ය ලෙස හුස්ම ගන්න'},
      {icon: 'sleep', label: 'ලිහිල් වීමේ අවධීන්ට ගරු කරන්න'},
      {icon: 'chart-line', label: 'දුෂ්කරතාව ක්‍රමයෙන් වැඩි කරන්න'},
      {icon: 'doctor', label: 'ඔබට විශ්වාස නැත්නම් උපදෙස් ඉල්ලන්න'},
    ],
    s5TipTitle: 'සියල්ලටම වඩා ස්ථාවර බව',
    s5TipText:
      'ව්‍යායාම ඔබේ දවසේ දැනටමත් කොටසක් වන පුරුද්දක් සමඟ ඒකාබද්ධ කිරීම ස්ථාවරව සිටීමට පහසු කළ හැක: කිරි පෙවීමකින් පසු, දත් මැදීමෙන් පසු, හෝ ඔබට ගැළපෙන වෙනත් වේලාවක.',

    s6Heading: 'වළක්වා ගත යුතු පොදු වැරදි',
    s6Body1:
      'පෙරිනියම් ව්‍යායාම සරල ලෙස පෙනෙන්නට පුළුවන, නමුත් වෙනත් මාංශ පේශි සමඟ වන්දි ගෙවීම හෝ අධික ලෙස තල්ලු කිරීම පහසුයි.',
    commonMistakes: [
      'ශ්‍රෝණි පතුලට වඩා උකුල් හෝ කලවා ආතතියට පත් කිරීම',
      'සංකෝචනය අතරතුර ඔබේ හුස්ම රඳවා ගැනීම',
      'ලිහිල් වීමට ඉඩ නොදී මාංශ පේශි නිරන්තරයෙන් සංකෝචනය කර තබා ගැනීම',
      'දින කිහිපයක් පමණක් ව්‍යායාම කර පසුව නතර කිරීම',
      'සංකෝචනය පරීක්ෂා කිරීමට හිතාමතාම මුත්‍රා ගලනය නැවැත්වීම',
    ],
    s6TipTitle: 'නොකළ යුතු දේ',
    s6TipText:
      'හිතාමතාම ඔබේ මුත්‍රා ගලනය නැවැත්වීමෙන් ව්‍යායාම පුහුණු කිරීම නිර්දේශ නොකෙරේ. මෙම ක්‍රමය පෙරිනියම නිවැරදිව පුහුණු නොකරන අතර සාමාන්‍ය මුත්‍රාශ ක්‍රියාකාරිත්වයට බාධා කළ හැක.',

    s7Heading: 'කුමන රෝග ලක්ෂණ උපදේශනයක් අවශ්‍ය කළ යුතුද?',
    s7Body1:
      'සුළු කාන්දු වීම් හෝ අසාමාන්‍ය සංවේදනයක් සමහර විට ප්‍රසූතියෙන් පසු දිස්විය හැක. කෙසේ වෙතත්, ඒවා දිගටම පවතී නම්, නරක අතට හැරේ නම්, හෝ ඔබේ එදිනෙදා ජීවිතයට බාධා කරන්නේ නම් ඒවා නොසලකා නොහැරිය යුතුයි.',
    warningSigns: [
      'ඔබ කැස්සේදී, කිවිසුම් යාමේදී, සිනාසෙන විට, හෝ වෙහෙසෙන විට මුත්‍රා කාන්දු වීම්',
      'පහළ ශ්‍රෝණියේ බරක් හෝ පීඩනයක් දැනීම',
      'ගැටියක් හෝ යමක් යෝනි මාර්ගයට බැස යන බවක් දැනීම',
      'වායු හෝ මළ ද්‍රව්‍ය රඳවා ගැනීමේ අපහසුව',
      'පෙරිනියමයේ දිගටම පවතින වේදනාව',
      'ලිංගික සංසර්ගය අතරතුර හෝ පසුව වේදනාව',
      'පෙරිනියම් මාංශ පේශි හඳුනාගැනීමේ හෝ නිවැරදිව සංකෝචනය කිරීමේ අපහසුව',
    ],
    consultLabel: 'උපදෙස් ඉල්ලිය යුත්තේ කවදාද?',
    s7Body2:
      'ශ්‍රෝණි පතුල් පුනරුත්ථාපනයේ විශේෂඥ ප්‍රසව හෙදියකට, වෛද්‍යවරයෙකුට, හෝ භෞත චිකිත්සකයෙකුට මාංශ පේශි ක්‍රියාකාරිත්වය පරීක්ෂා කර සුදුසු වැඩසටහනක් යෝජනා කළ හැක.',

    s8Heading: 'ඉරීමකින්, එපිසියෝටෝමියකින්, හෝ සීසර් සැත්කමකින් පසු කුමක්ද?',
    s8Body1:
      'ඉරීමකට හෝ එපිසියෝටෝමියකට සුවවීමේදී විශේෂ සැලකිල්ලක් අවශ්‍යයි. ක්‍රියාකාරකම් නැවත ආරම්භ කිරීමේදී වේදනාව, කැළැල්ලේ තත්ත්වය සහ ප්‍රසූතියෙන් පසු ලබා දුන් මඟපෙන්වීම සැලකිල්ලට ගත යුතුයි.',
    s8Body2:
      'සීසර් සැත්කමකින් පසු, යථා තත්ත්වයට පැමිණීම උදර බිත්තියට සහ කැළැල්ලටද සම්බන්ධ වේ. ප්‍රසූතිය යෝනි මාර්ගයෙන් නොවූවත්, ගර්භණී කාලයම තවමත් ශ්‍රෝණි පතුලට ආතතියක් යොදා ඇත.',
    s8HighlightTitle: 'පුද්ගලීකරණය කළ සත්කාර උපකාරී විය හැක',
    s8HighlightText:
      'සැලකිය යුතු ඉරීමක්, වේදනාවක්, මුත්‍රා හෝ බඩවැල් රෝග ලක්ෂණ, හෝ දිගටම පවතින දුෂ්කරතා ඇති අවස්ථාවකදී, සෞඛ්‍ය වෘත්තිකයෙකු සමඟ තක්සේරුවක් විශේෂයෙන් උපකාරී විය හැක.',

    s9Heading: 'ක්‍රීඩා ක්‍රමයෙන් නැවත ආරම්භ කිරීම',
    s9Body1:
      'ප්‍රසූතියෙන් පසු චලනය නැවත ආරම්භ කිරීම ක්‍රමානුකූල විය යුතුයි. ඇවිදීම සහ මෘදු චලන ඔබට දැනෙන ආකාරය අනුව සාමාන්‍යයෙන් නැවත ආරම්භ කළ හැකි අතර, ඉහළ බලපෑම් ක්‍රියාකාරකම්වලට වැඩි ප්‍රවේශමක් අවශ්‍යයි.',
    s9Body2:
      'දිවීම, පැනීම, හෝ ඉතා දැඩි පුහුණුව නැවත ආරම්භ කිරීමට පෙර, ශ්‍රෝණි පතුල යථා තත්ත්වයට පැමිණීම තක්සේරු කර ඕනෑම රෝග ලක්ෂණ සැලකිල්ලට ගැනීම වඩා හොඳයි.',
    s9AlertTitle: 'අවධීන් ඉක්මන් නොකරන්න',
    s9AlertText:
      'කාන්දු වීම්, බරක් දැනීම, හෝ ව්‍යායාම අතරතුර හෝ පසුව වේදනාව යනු ඔබ සෙමින් ගොස් තීව්‍රතාව වැඩි කිරීමට පෙර උපදෙස් ඉල්ලිය යුතු බවට සලකුණු වේ.',

    s10Heading: 'විශේෂඥයෙකු හමුවිය යුත්තේ කවදාද?',
    s10Body1:
      'ඔබ නිවැරදිව සංකෝචනය කරන්නේදැයි විශ්වාස නැත්නම්, ඔබේ රෝග ලක්ෂණ දිගටම පවතී නම්, හෝ ඔබට විශ්වාසයෙන් යම් ශාරීරික ක්‍රියාකාරකම් නැවත ආරම්භ කිරීමට අවශ්‍ය නම්, ප්‍රසව හෙදියක් හෝ භෞත චිකිත්සකයෙකු සමඟ ශ්‍රෝණි පතුල් පුනරුත්ථාපනය උපකාරී විය හැක.',
    questionCardTitle: 'ඇසිය යුතු ප්‍රයෝජනවත් ප්‍රශ්න',
    appointmentQuestions: [
      'මගේ රෝග ලක්ෂණ ශ්‍රෝණි පතුලේ දුර්වලතාවයට අනුකූලද?',
      'මම සංකෝචන නිවැරදිව ඉටු කරනවාද?',
      'මම දිනකට කී වතාවක් නැවත නැවත කළ යුතුද?',
      'මට දිවීම, ක්‍රීඩා, හෝ ඉහළ බලපෑම් ව්‍යායාම වෙත ආපසු යා හැකිද?',
      'මට ප්‍රසව හෙදියක් හෝ භෞත චිකිත්සකයෙකු සමඟ පුනරුත්ථාපනයක් අවශ්‍යද?',
      'මගේ කැළැල, ඉරීම, හෝ සීසර් සැත්කමට විශේෂ පූර්වාරක්ෂාවන් අවශ්‍යද?',
    ],
    s10TipTitle: 'දැනගත යුතු දේ',
    s10TipText:
      'වෘත්තිකයෙකු හමුවීම යමක් වැරදී ඇති බව අනිවාර්යයෙන්ම අදහස් නොවේ. සැසියකට ඔබේ ශිල්පීය ක්‍රමය පරීක්ෂා කිරීමට, ඔබේ යථා තත්ත්වයට පැමිණීම තක්සේරු කිරීමට සහ නිවැරදිව ප්‍රගතියක් ලැබීමට ඉගෙනීමට සරලව උපකාරී විය හැක.',

    s11Heading: 'කාලය ගත වන යථා තත්ත්වයට පැමිණීමක්',
    s11Body1:
      'ප්‍රසූතියෙන් පසු, ගර්භණී කාලයට පෙර ඔබට තිබූ එම සංවේදනයන් හෝ මාංශ පේශි ශක්තිය වහාම නැවත ලබා නොගැනීම සාමාන්‍යයි.',
    s11Body2:
      'අරමුණ හැකි තරම් සංකෝචන කිරීම නොවේ. එය වඩාත් සංකෝචනය සහ ලිහිල් වීම අතර හොඳ සම්බන්ධීකරණයක් ක්‍රමයෙන් නැවත ලබා ගැනීම සහ පසුව එදිනෙදා ක්‍රියාකාරකම්වලදී මෙම මාංශ පේශි ස්වභාවිකව භාවිතා කිරීමට හැකි වීමයි.',
    s11HighlightTitle: 'කුඩා ප්‍රගතිය සැබෑ ප්‍රගතියයි',
    s11HighlightText:
      'චලනය පිළිබඳ වඩා හොඳ දැනුවත්භාවය, සංකෝචනයේ අමතර තත්පර කිහිපයක්, හෝ කාන්දු වීම් අඩුවීමක් දැනටමත් දිරිගැන්වෙන සලකුණු වේ.',

    s12Heading: 'ප්‍රධාන කරුණු',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'ගර්භණී කාලය සහ ප්‍රසූතිය ශ්‍රෝණි පතුලට සැලකිය යුතු ආතතියක් ඇති කරයි.',
      'ප්‍රසූතියෙන් පසු ක්‍රමානුකූල යථා තත්ත්වයට පැමිණීම සාමාන්‍යයි.',
      'ව්‍යායාම ශක්තියට වඩා චලනයේ ගුණාත්මකභාවයට ප්‍රමුඛත්වය දිය යුතුයි.',
      'හුස්ම ගැනීම සහ ලිහිල් වීම සංකෝචනය තරමටම වැදගත්.',
      'මුත්‍රා කාන්දු වීම්, බරක් දැනීම, හෝ දිගටම පවතින වේදනාවට වෘත්තීය මතයක් සුදුසුයි.',
      'ප්‍රසව හෙදියක් හෝ භෞත චිකිත්සකයෙකු සමඟ පුනරුත්ථාපනය වඩා හොඳ පාලනයක් නැවත ලබා ගැනීමට ඔබට උපකාරී විය හැක.',
      'ක්‍රීඩාවට ආපසු යාම ක්‍රමානුකූල විය යුතුයි, විශේෂයෙන් ඉහළ බලපෑම් ක්‍රියාකාරකම් සඳහා.',
    ],

    finalTipTitle: 'යථා තත්ත්වයට පැමිණීමට කාලය ගන්න',
    finalTipText:
      'ප්‍රසූතියෙන් පසු, ඔබේ ශරීරය බොහෝ වෙනස්කම් හරහා ගමන් කර ඇත. පෙරිනියමට ඔබේ ශරීරයේ ඉතිරි කොටස මෙන්ම අවධානය ලැබිය යුතුයි: ක්‍රමයෙන්, නිතිපතා සහ පීඩනයකින් තොරව.',

    disclaimerText:
      'මෙම ලිපිය තොරතුරු සඳහා පමණි, පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. ඔබට වේදනාව, දිගටම පවතින රෝග ලක්ෂණ හෝ ඔබේ යථා තත්ත්වයට පැමිණීම ගැන කනස්සල්ලක් ඇත්නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
  },
  th: {
    badge: 'หลังคลอด • การฟื้นตัว',
    title: 'เสริมสร้างกล้ามเนื้ออุ้งเชิงกราน\nหลังคลอด',
    metaDuration: 'อ่าน 8 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'หลังตั้งครรภ์และคลอด กล้ามเนื้ออุ้งเชิงกรานต้องใช้เวลาฟื้นตัว การออกกำลังที่เรียบง่าย สม่ำเสมอ และทีละน้อยช่วยให้คุณกลับมามีกำลัง การควบคุม และความมั่นใจ โดยไม่ต้องเร่งรีบ',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำความเข้าใจบทบาทของกล้ามเนื้อฝีเย็บ',
      'ทำไมการคลอดจึงทำให้ตึงเครียด',
      'เมื่อไรควรเริ่มฟื้นฟูกล้ามเนื้ออุ้งเชิงกราน',
      'เรียนรู้การหดตัวอย่างถูกต้อง',
      'สร้างกิจวัตรทีละน้อย',
      'ข้อผิดพลาดที่ควรหลีกเลี่ยง',
      'เมื่อไรควรขอความช่วยเหลือ',
      'กลับมาเล่นกีฬาทีละน้อย',
      'เตรียมตัวสำหรับการนัดหมาย',
      'ประเด็นสำคัญ',
    ],
    shareMessage: 'เสริมสร้างกล้ามเนื้ออุ้งเชิงกรานหลังคลอด — AWA',

    s1Heading: 'ทำความเข้าใจบทบาทของกล้ามเนื้อฝีเย็บ',
    s1Body1:
      'กล้ามเนื้อฝีเย็บ หรือที่เรียกว่ากล้ามเนื้ออุ้งเชิงกราน คือกลุ่มกล้ามเนื้อที่อยู่ที่ฐานของอุ้งเชิงกราน มีบทบาทในการควบคุมกระเพาะปัสสาวะและลำไส้ และช่วยพยุงอวัยวะในอุ้งเชิงกราน',
    s1Body2:
      'ระหว่างตั้งครรภ์ กล้ามเนื้อเหล่านี้ต้องรับน้ำหนักเพิ่มเป็นเวลาหลายเดือน และยังตึงเครียดอย่างมากระหว่างการคลอด',
    s1HighlightTitle: 'กล้ามเนื้อที่เงียบแต่จำเป็น',
    s1HighlightText:
      'กล้ามเนื้ออุ้งเชิงกรานเกี่ยวข้องกับการทำงานในชีวิตประจำวันหลายอย่าง: กลั้นปัสสาวะและอุจจาระ ควบคุมแก๊ส พยุงอวัยวะในอุ้งเชิงกราน และมีบทบาทในการทำงานทางเพศบางอย่าง',

    benefitsHeading: 'ประโยชน์ของกล้ามเนื้ออุ้งเชิงกรานที่แข็งแรงขึ้น',
    benefitsIntro:
      'การเสริมสร้างทีละน้อยที่ทำอย่างถูกต้องช่วยปรับปรุงการควบคุมและการพยุงของกล้ามเนื้ออุ้งเชิงกรานได้',
    benefits: [
      {
        icon: 'water-outline',
        title: 'ควบคุมกระเพาะปัสสาวะได้ดีขึ้น',
        text: 'กล้ามเนื้ออุ้งเชิงกรานมีบทบาทในการควบคุมกระเพาะปัสสาวะ การเสริมสร้างทีละน้อยอาจช่วยลดอาการปัสสาวะเล็ดบางอย่าง',
      },
      {
        icon: 'toilet',
        title: 'สนับสนุนการทำงานของลำไส้',
        text: 'กล้ามเนื้อเหล่านี้ยังช่วยควบคุมแก๊สและอุจจาระ และมีส่วนช่วยพยุงอวัยวะในอุ้งเชิงกราน',
      },
      {
        icon: 'human-female',
        title: 'พยุงอวัยวะในอุ้งเชิงกราน',
        text: 'กล้ามเนื้ออุ้งเชิงกรานเป็นฐานกล้ามเนื้อที่แท้จริงซึ่งช่วยพยุงกระเพาะปัสสาวะ มดลูก และลำไส้',
      },
      {
        icon: 'heart-pulse',
        title: 'ค่อย ๆ กลับมารู้สึก',
        text: 'การฟื้นฟูที่เหมาะสมยังช่วยให้คุณกลับมารับรู้และควบคุมบริเวณนี้ได้ดีขึ้น',
      },
    ],

    s2Heading: 'ทำไมการตั้งครรภ์และการคลอดจึงทำให้ตึงเครียด',
    s2Body1:
      'การตั้งครรภ์ค่อย ๆ เพิ่มแรงกดดันต่อกล้ามเนื้ออุ้งเชิงกราน การคลอดทางช่องคลอดอาจยืดกล้ามเนื้อและเนื้อเยื่อบริเวณนี้อย่างมาก',
    s2Body2:
      'การผ่าคลอดก็ไม่ได้ช่วยให้กล้ามเนื้ออุ้งเชิงกรานรอดพ้นไปทั้งหมด: การตั้งครรภ์เองยังคงเป็นช่วงสำคัญสำหรับกล้ามเนื้อเหล่านี้',
    s2Body3:
      'หลังคลอด จึงเป็นเรื่องปกติที่การฟื้นตัวต้องใช้เวลา ผู้หญิงบางคนแทบไม่มีอาการ ขณะที่บางคนอาจสังเกตเห็นปัสสาวะเล็ด ความรู้สึกหน่วง หรือการควบคุมกล้ามเนื้อลดลง',
    s2TipTitle: 'การฟื้นตัวของแต่ละคนต่างกัน',
    s2TipText:
      'ประเภทของการคลอด การฉีกขาดหรือการตัดฝีเย็บ การมีอาการปวด และสภาพทั่วไปของคุณหลังคลอด ล้วนมีอิทธิพลต่อการฟื้นตัวได้',

    s3Heading: 'เมื่อไรควรเริ่มฟื้นฟูกล้ามเนื้ออุ้งเชิงกราน?',
    s3Body1:
      'หลังคลอดที่ไม่มีภาวะแทรกซ้อน โดยทั่วไปกลับมาหดกล้ามเนื้ออุ้งเชิงกรานเบา ๆ ทีละน้อยได้ สิ่งสำคัญคือปรับการออกกำลังให้เหมาะกับสถานการณ์ของคุณ และขอคำแนะนำหากคุณมีภาวะแทรกซ้อน ปวดมาก หรือมีหัตถการเฉพาะ',
    s3Body2:
      'หากคุณใส่สายสวนปัสสาวะ คำแนะนำบางอย่างแนะนำให้รอจนเอาออกและปัสสาวะได้ตามปกติก่อนเริ่มออกกำลังกล้ามเนื้อฝีเย็บ',
    s3AlertTitle: 'อย่าฝืนเมื่อเจ็บ',
    s3AlertText:
      'อาการปวดมาก อาการที่แย่ลง แผลที่หายไม่ดี หรือความกังวลใด ๆ ต้องขอคำแนะนำจากผดุงครรภ์ แพทย์ หรือผู้เชี่ยวชาญด้านการฟื้นฟู',

    s4Heading: 'เรียนรู้การหดตัวอย่างถูกต้อง',
    s4Body1:
      'เพื่อระบุการเคลื่อนไหว ให้ลองจินตนาการว่ากำลังกลั้นแก๊สและความรู้สึกอยากปัสสาวะไปพร้อมกัน การเคลื่อนไหวที่คุณมองหาคือความรู้สึกหดและยกขึ้นเข้าด้านใน',
    s4Body2:
      'เป้าหมายไม่ใช่การเกร็งทั้งตัว บั้นท้าย ต้นขา และหน้าท้องควรผ่อนคลายที่สุดเท่าที่ทำได้ ขณะที่หายใจต่อไปตามปกติ',
    exercises: [
      {icon: 'weather-windy', label: 'การหายใจ'},
      {icon: 'human-handsup', label: 'การหดเบา ๆ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'การหดนาน'},
      {icon: 'gesture-tap-button', label: 'การหดเร็ว'},
    ],
    s4HighlightTitle: 'การผ่อนคลายสำคัญไม่แพ้กัน',
    s4HighlightText:
      'หลังหดแต่ละครั้ง ปล่อยให้กล้ามเนื้อผ่อนคลายอย่างสมบูรณ์ การฟื้นฟูที่ดีไม่ได้หมายถึงการหดกล้ามเนื้อฝีเย็บตลอดทั้งวัน',

    s5Heading: 'สร้างกิจวัตรทีละน้อย',
    s5Body1:
      'ในตอนแรก สิ่งสำคัญที่สุดคือเรียนรู้ที่จะระบุกล้ามเนื้อและทำการเคลื่อนไหวให้ถูกต้อง ความสม่ำเสมอสำคัญกว่าความหนัก',
    s5h3a: 'การหดนาน',
    s5Body2:
      'หดกล้ามเนื้ออุ้งเชิงกรานเบา ๆ แล้วค้างไว้สองสามวินาทีโดยไม่กลั้นหายใจ จากนั้นปล่อยอย่างสมบูรณ์ก่อนเริ่มใหม่',
    s5h3b: 'การหดเร็ว',
    s5Body3:
      'เมื่อทำการเคลื่อนไหวได้คล่องแล้ว เพิ่มการหดเร็วเล็ก ๆ ได้ ช่วยฝึกความสามารถในการหดกล้ามเนื้ออย่างรวดเร็วเมื่อแรงดันในช่องท้องเพิ่มขึ้น เช่น ก่อนไอหรือจาม',
    dailyTips: [
      {icon: 'clock-outline', label: 'จับคู่การออกกำลังกับนิสัยประจำวัน'},
      {icon: 'human-sitting', label: 'เริ่มในท่าที่สบาย'},
      {icon: 'weather-windy', label: 'หายใจตามปกติระหว่างหด'},
      {icon: 'sleep', label: 'เคารพช่วงผ่อนคลาย'},
      {icon: 'chart-line', label: 'ค่อย ๆ เพิ่มความยาก'},
      {icon: 'doctor', label: 'ขอคำแนะนำหากไม่แน่ใจ'},
    ],
    s5TipTitle: 'ความสม่ำเสมอเหนือสิ่งอื่นใด',
    s5TipText:
      'การจับคู่การออกกำลังกับนิสัยที่มีอยู่แล้วในแต่ละวันช่วยให้สม่ำเสมอได้ง่ายขึ้น: หลังให้นม หลังแปรงฟัน หรือเวลาอื่นที่เหมาะกับคุณ',

    s6Heading: 'ข้อผิดพลาดที่พบบ่อยที่ควรหลีกเลี่ยง',
    s6Body1:
      'การออกกำลังกล้ามเนื้อฝีเย็บอาจดูง่าย แต่เป็นเรื่องง่ายที่จะใช้กล้ามเนื้ออื่นชดเชยหรือออกแรงมากเกินไป',
    commonMistakes: [
      'เกร็งบั้นท้ายหรือต้นขาแทนกล้ามเนื้ออุ้งเชิงกราน',
      'กลั้นหายใจระหว่างหด',
      'หดกล้ามเนื้อค้างตลอดโดยไม่ปล่อยให้ผ่อนคลาย',
      'ออกกำลังเพียงไม่กี่วันแล้วหยุด',
      'จงใจหยุดการไหลของปัสสาวะเพื่อตรวจการหด',
    ],
    s6TipTitle: 'สิ่งที่ไม่ควรทำ',
    s6TipText:
      'ไม่แนะนำให้ฝึกด้วยการจงใจหยุดการไหลของปัสสาวะ วิธีนี้ไม่ฝึกกล้ามเนื้อฝีเย็บอย่างถูกต้องและอาจรบกวนการทำงานปกติของกระเพาะปัสสาวะ',

    s7Heading: 'อาการใดที่ควรไปปรึกษา?',
    s7Body1:
      'ปัสสาวะเล็ดเล็กน้อยหรือความรู้สึกผิดปกติอาจปรากฏบางครั้งหลังคลอด อย่างไรก็ตาม ไม่ควรเพิกเฉยหากคงอยู่ แย่ลง หรือรบกวนชีวิตประจำวัน',
    warningSigns: [
      'ปัสสาวะเล็ดเมื่อไอ จาม หัวเราะ หรือเบ่ง',
      'รู้สึกหน่วงหรือกดที่อุ้งเชิงกรานส่วนล่าง',
      'รู้สึกว่ามีก้อนหรือสิ่งใดหย่อนลงในช่องคลอด',
      'กลั้นแก๊สหรืออุจจาระได้ยาก',
      'ปวดบริเวณฝีเย็บต่อเนื่อง',
      'ปวดระหว่างหรือหลังมีเพศสัมพันธ์',
      'ระบุหรือหดกล้ามเนื้อฝีเย็บอย่างถูกต้องได้ยาก',
    ],
    consultLabel: 'เมื่อไรควรขอคำแนะนำ?',
    s7Body2:
      'ผดุงครรภ์ แพทย์ หรือนักกายภาพบำบัดที่เชี่ยวชาญด้านการฟื้นฟูกล้ามเนื้ออุ้งเชิงกราน ตรวจการทำงานของกล้ามเนื้อและแนะนำโปรแกรมที่เหมาะสมได้',

    s8Heading: 'แล้วหลังฉีกขาด ตัดฝีเย็บ หรือผ่าคลอดล่ะ?',
    s8Body1:
      'การฉีกขาดหรือการตัดฝีเย็บต้องดูแลเป็นพิเศษระหว่างการสมานแผล การกลับมาทำกิจกรรมควรคำนึงถึงอาการปวด สภาพแผล และคำแนะนำที่ได้รับหลังคลอด',
    s8Body2:
      'หลังผ่าคลอด การฟื้นตัวยังเกี่ยวข้องกับผนังหน้าท้องและแผลผ่าตัด แม้การคลอดไม่ใช่ทางช่องคลอด การตั้งครรภ์เองก็ยังทำให้กล้ามเนื้ออุ้งเชิงกรานตึงเครียด',
    s8HighlightTitle: 'การดูแลเฉพาะบุคคลช่วยได้',
    s8HighlightText:
      'ในกรณีฉีกขาดมาก ปวด มีอาการทางปัสสาวะหรือลำไส้ หรือมีความยากลำบากต่อเนื่อง การประเมินกับบุคลากรทางการแพทย์มีประโยชน์เป็นพิเศษ',

    s9Heading: 'กลับมาเล่นกีฬาทีละน้อย',
    s9Body1:
      'การกลับมาเคลื่อนไหวหลังคลอดควรทำทีละน้อย การเดินและการเคลื่อนไหวเบา ๆ โดยทั่วไปกลับมาทำได้ตามความรู้สึกของคุณ ขณะที่กิจกรรมที่มีแรงกระแทกสูงต้องระมัดระวังมากขึ้น',
    s9Body2:
      'ก่อนกลับมาวิ่ง กระโดด หรือฝึกที่หนักมาก ควรประเมินการฟื้นตัวของกล้ามเนื้ออุ้งเชิงกรานและคำนึงถึงอาการใด ๆ',
    s9AlertTitle: 'อย่ารีบข้ามขั้นตอน',
    s9AlertText:
      'ปัสสาวะเล็ด ความรู้สึกหน่วง หรืออาการปวดระหว่างหรือหลังออกกำลังกาย เป็นสัญญาณว่าคุณควรชะลอและขอคำแนะนำก่อนเพิ่มความหนัก',

    s10Heading: 'เมื่อไรควรพบผู้เชี่ยวชาญ?',
    s10Body1:
      'การฟื้นฟูกล้ามเนื้ออุ้งเชิงกรานกับผดุงครรภ์หรือนักกายภาพบำบัดมีประโยชน์หากคุณไม่แน่ใจว่าหดถูกต้องหรือไม่ หากอาการคงอยู่ หรือหากคุณอยากกลับมาทำกิจกรรมทางกายบางอย่างด้วยความมั่นใจ',
    questionCardTitle: 'คำถามที่เป็นประโยชน์ที่ควรถาม',
    appointmentQuestions: [
      'อาการของฉันสอดคล้องกับกล้ามเนื้ออุ้งเชิงกรานอ่อนแอหรือไม่?',
      'ฉันหดกล้ามเนื้ออย่างถูกต้องหรือไม่?',
      'ฉันควรทำกี่ครั้งต่อวัน?',
      'ฉันกลับมาวิ่ง เล่นกีฬา หรือออกกำลังกายที่มีแรงกระแทกสูงได้หรือยัง?',
      'ฉันต้องฟื้นฟูกับผดุงครรภ์หรือนักกายภาพบำบัดหรือไม่?',
      'แผล รอยฉีกขาด หรือแผลผ่าคลอดของฉันต้องระมัดระวังเป็นพิเศษหรือไม่?',
    ],
    s10TipTitle: 'ควรรู้',
    s10TipText:
      'การพบผู้เชี่ยวชาญไม่ได้หมายความว่ามีอะไรผิดปกติเสมอไป การพบสักครั้งอาจช่วยตรวจเทคนิคของคุณ ประเมินการฟื้นตัว และเรียนรู้ที่จะก้าวหน้าอย่างถูกต้อง',

    s11Heading: 'การฟื้นตัวที่ต้องใช้เวลา',
    s11Body1:
      'หลังคลอด เป็นเรื่องปกติที่จะไม่กลับมารู้สึกหรือมีกำลังกล้ามเนื้อเท่าเดิมก่อนตั้งครรภ์ทันที',
    s11Body2:
      'เป้าหมายไม่ใช่การหดให้ได้มากครั้งที่สุด แต่เป็นการค่อย ๆ กลับมามีการประสานงานที่ดีระหว่างการหดและการผ่อนคลาย แล้วใช้กล้ามเนื้อเหล่านี้ได้ตามธรรมชาติในกิจกรรมประจำวัน',
    s11HighlightTitle: 'ความก้าวหน้าเล็ก ๆ คือความก้าวหน้าจริง',
    s11HighlightText:
      'การรับรู้การเคลื่อนไหวได้ดีขึ้น การหดนานขึ้นอีกสองสามวินาที หรือการเล็ดลดลง ล้วนเป็นสัญญาณที่น่ายินดี',

    s12Heading: 'ประเด็นสำคัญ',
    summaryTitle: 'สาระสำคัญ',
    summaryItems: [
      'การตั้งครรภ์และการคลอดทำให้กล้ามเนื้ออุ้งเชิงกรานตึงเครียดอย่างมาก',
      'การฟื้นตัวทีละน้อยเป็นเรื่องปกติหลังคลอด',
      'การออกกำลังควรให้ความสำคัญกับคุณภาพของการเคลื่อนไหวมากกว่ากำลัง',
      'การหายใจและการผ่อนคลายสำคัญไม่แพ้การหด',
      'ปัสสาวะเล็ด ความรู้สึกหน่วง หรืออาการปวดต่อเนื่อง ควรได้รับความเห็นจากผู้เชี่ยวชาญ',
      'การฟื้นฟูกับผดุงครรภ์หรือนักกายภาพบำบัดช่วยให้คุณกลับมาควบคุมได้ดีขึ้น',
      'การกลับมาเล่นกีฬาควรทำทีละน้อย โดยเฉพาะกิจกรรมที่มีแรงกระแทกสูง',
    ],

    finalTipTitle: 'ใช้เวลาฟื้นตัว',
    finalTipText:
      'หลังคลอด ร่างกายของคุณผ่านการเปลี่ยนแปลงมากมาย กล้ามเนื้อฝีเย็บสมควรได้รับความใส่ใจเท่ากับส่วนอื่นของร่างกาย: ทีละน้อย สม่ำเสมอ และโดยไม่กดดัน',

    disclaimerText:
      'บทความนี้เพื่อให้ข้อมูลเท่านั้น และไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากคุณมีอาการปวด อาการที่คงอยู่ หรือมีข้อกังวลเกี่ยวกับการฟื้นตัวของคุณ โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
  },
  vi: {
    badge: 'SAU SINH • HỒI PHỤC',
    title: 'Tăng cường sàn chậu\nsau khi sinh',
    metaDuration: '8 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Sau thai kỳ và sinh nở, sàn chậu cần thời gian để hồi phục. Những bài tập đơn giản, đều đặn và tăng dần có thể giúp bạn lấy lại sức mạnh, khả năng kiểm soát và sự tự tin, mà không cố gắng vội vàng.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Hiểu vai trò của tầng sinh môn',
      'Tại sao sinh nở gây áp lực lên nó',
      'Khi nào nên bắt đầu phục hồi sàn chậu',
      'Học cách co đúng cách',
      'Xây dựng một thói quen tăng dần',
      'Những sai lầm cần tránh',
      'Khi nào nên nhờ giúp đỡ',
      'Tiếp tục thể thao dần dần',
      'Chuẩn bị cho một buổi hẹn',
      'Những điểm chính cần nhớ',
    ],
    shareMessage: 'Tăng cường sàn chậu sau khi sinh — AWA',

    s1Heading: 'Hiểu vai trò của tầng sinh môn',
    s1Body1:
      'Tầng sinh môn, còn gọi là sàn chậu, là một nhóm cơ nằm ở đáy khung chậu. Nó đóng vai trò trong việc kiểm soát bàng quang và ruột và giúp nâng đỡ các cơ quan vùng chậu.',
    s1Body2:
      'Trong thai kỳ, những cơ này phải gánh thêm trọng lượng trong nhiều tháng. Chúng cũng chịu áp lực đáng kể trong lúc sinh.',
    s1HighlightTitle: 'Một nhóm cơ kín đáo nhưng thiết yếu',
    s1HighlightText:
      'Sàn chậu tham gia vào nhiều chức năng hằng ngày: giữ nước tiểu và phân, kiểm soát hơi, nâng đỡ các cơ quan vùng chậu và đóng vai trò trong một số chức năng tình dục.',

    benefitsHeading: 'Lợi ích của sàn chậu khỏe hơn',
    benefitsIntro:
      'Việc tăng cường dần dần, thực hiện đúng cách có thể giúp cải thiện khả năng kiểm soát và nâng đỡ của sàn chậu.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kiểm soát bàng quang tốt hơn',
        text: 'Sàn chậu đóng vai trò trong việc kiểm soát bàng quang. Tăng cường nó dần dần có thể giúp giảm một số trường hợp són tiểu.',
      },
      {
        icon: 'toilet',
        title: 'Hỗ trợ chức năng ruột',
        text: 'Những cơ này cũng giúp kiểm soát hơi và phân và góp phần nâng đỡ các cơ quan vùng chậu.',
      },
      {
        icon: 'human-female',
        title: 'Nâng đỡ các cơ quan vùng chậu',
        text: 'Sàn chậu tạo thành một nền cơ thực sự giúp nâng đỡ bàng quang, tử cung và ruột.',
      },
      {
        icon: 'heart-pulse',
        title: 'Dần lấy lại cảm giác',
        text: 'Việc phục hồi phù hợp cũng có thể giúp bạn có nhận thức và khả năng kiểm soát vùng này tốt hơn.',
      },
    ],

    s2Heading: 'Tại sao thai kỳ và sinh nở gây áp lực lên nó',
    s2Body1:
      'Thai kỳ dần tạo thêm áp lực lên sàn chậu. Sinh thường qua đường âm đạo sau đó có thể làm căng đáng kể các cơ và mô ở vùng này.',
    s2Body2:
      'Mổ lấy thai cũng không hoàn toàn bảo vệ sàn chậu: bản thân thai kỳ vẫn là một giai đoạn đáng kể đối với những cơ này.',
    s2Body3:
      'Sau khi sinh, việc hồi phục cần thời gian là điều bình thường. Một số phụ nữ gần như không cảm thấy triệu chứng nào, trong khi người khác có thể nhận thấy són tiểu, cảm giác nặng nề hoặc giảm khả năng kiểm soát cơ.',
    s2TipTitle: 'Mỗi quá trình hồi phục đều khác nhau',
    s2TipText:
      'Hình thức sinh, vết rách hoặc cắt tầng sinh môn, tình trạng đau và tình trạng chung của bạn sau sinh đều có thể ảnh hưởng đến quá trình hồi phục.',

    s3Heading: 'Khi nào nên bắt đầu phục hồi sàn chậu?',
    s3Body1:
      'Sau một cuộc sinh không biến chứng, thường có thể dần dần tiếp tục các động tác co nhẹ sàn chậu. Điều quan trọng vẫn là điều chỉnh bài tập cho phù hợp với tình huống của bạn và tìm lời khuyên nếu bạn gặp biến chứng, đau đáng kể hoặc đã trải qua một thủ thuật cụ thể.',
    s3Body2:
      'Nếu bạn có đặt ống thông tiểu, một số khuyến nghị cho rằng nên chờ đến khi rút ống và đi tiểu bình thường trở lại rồi mới bắt đầu các bài tập tầng sinh môn.',
    s3AlertTitle: 'Đừng cố chịu đau',
    s3AlertText:
      'Đau đáng kể, triệu chứng nặng lên, vết thương lành kém hoặc bất kỳ lo lắng đặc biệt nào cần lời khuyên của nữ hộ sinh, bác sĩ hoặc chuyên gia phục hồi chức năng.',

    s4Heading: 'Học cách co đúng cách',
    s4Body1:
      'Để nhận biết động tác, hãy tưởng tượng bạn đang cố nhịn hơi và nhịn tiểu cùng lúc. Động tác bạn đang tìm là cảm giác co và nâng lên vào bên trong.',
    s4Body2:
      'Mục tiêu không phải là gồng cứng toàn bộ cơ thể. Mông, đùi và cơ bụng nên được giữ thư giãn nhất có thể, trong khi hơi thở vẫn tiếp tục bình thường.',
    exercises: [
      {icon: 'weather-windy', label: 'Hít thở'},
      {icon: 'human-handsup', label: 'Co nhẹ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Co kéo dài'},
      {icon: 'gesture-tap-button', label: 'Co nhanh'},
    ],
    s4HighlightTitle: 'Thư giãn cũng quan trọng không kém',
    s4HighlightText:
      'Sau mỗi lần co, hãy để các cơ thư giãn hoàn toàn. Phục hồi tốt không có nghĩa là giữ tầng sinh môn co suốt cả ngày.',

    s5Heading: 'Xây dựng một thói quen tăng dần',
    s5Body1:
      'Lúc đầu, điều quan trọng nhất là học cách nhận biết các cơ và thực hiện động tác đúng. Sự đều đặn quan trọng hơn cường độ.',
    s5h3a: 'Co kéo dài',
    s5Body2:
      'Nhẹ nhàng co sàn chậu, rồi giữ sự co trong vài giây mà không nín thở. Sau đó thả lỏng hoàn toàn trước khi bắt đầu lại.',
    s5h3b: 'Co ngắn',
    s5Body3:
      'Khi đã thành thạo động tác, có thể thêm những lần co nhanh nhỏ. Chúng giúp rèn khả năng co cơ nhanh khi áp lực ổ bụng tăng lên, ví dụ ngay trước khi ho hoặc hắt hơi.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Kết hợp bài tập với một thói quen hằng ngày'},
      {icon: 'human-sitting', label: 'Bắt đầu ở tư thế thoải mái'},
      {icon: 'weather-windy', label: 'Thở bình thường trong lúc co'},
      {icon: 'sleep', label: 'Tôn trọng các giai đoạn thư giãn'},
      {icon: 'chart-line', label: 'Tăng độ khó dần dần'},
      {icon: 'doctor', label: 'Hỏi lời khuyên nếu bạn chưa chắc'},
    ],
    s5TipTitle: 'Trên hết là sự đều đặn',
    s5TipText:
      'Kết hợp bài tập với một thói quen vốn đã có trong ngày của bạn có thể giúp dễ duy trì hơn: sau khi cho bú, sau khi đánh răng hoặc vào một thời điểm khác phù hợp với bạn.',

    s6Heading: 'Những sai lầm thường gặp cần tránh',
    s6Body1:
      'Bài tập tầng sinh môn có vẻ đơn giản, nhưng rất dễ bù trừ bằng các cơ khác hoặc dùng sức quá mạnh.',
    commonMistakes: [
      'Gồng mông hoặc đùi thay vì sàn chậu',
      'Nín thở trong lúc co',
      'Giữ các cơ co liên tục mà không để chúng thư giãn',
      'Chỉ tập vài ngày rồi dừng',
      'Cố ý ngắt dòng tiểu để kiểm tra động tác co',
    ],
    s6TipTitle: 'Điều không nên làm',
    s6TipText:
      'Không nên tập bằng cách cố ý ngắt dòng tiểu. Phương pháp này không rèn luyện tầng sinh môn đúng cách và có thể làm rối loạn chức năng bình thường của bàng quang.',

    s7Heading: 'Những triệu chứng nào nên khiến bạn đi khám?',
    s7Body1:
      'Són tiểu nhẹ hoặc cảm giác bất thường đôi khi có thể xuất hiện sau khi sinh. Tuy nhiên, không nên bỏ qua chúng nếu chúng kéo dài, nặng thêm hoặc ảnh hưởng đến cuộc sống hằng ngày của bạn.',
    warningSigns: [
      'Són tiểu khi ho, hắt hơi, cười hoặc rặn',
      'Cảm giác nặng hoặc tức ở vùng chậu dưới',
      'Cảm giác có khối hoặc vật gì đó đang sa xuống âm đạo',
      'Khó nhịn hơi hoặc phân',
      'Đau kéo dài ở tầng sinh môn',
      'Đau trong hoặc sau khi quan hệ tình dục',
      'Khó nhận biết hoặc co đúng các cơ tầng sinh môn',
    ],
    consultLabel: 'Khi nào nên tìm lời khuyên?',
    s7Body2:
      'Nữ hộ sinh, bác sĩ hoặc nhà vật lý trị liệu chuyên về phục hồi sàn chậu có thể kiểm tra chức năng cơ và đề xuất một chương trình phù hợp.',

    s8Heading: 'Còn sau khi bị rách, cắt tầng sinh môn hoặc mổ lấy thai thì sao?',
    s8Body1:
      'Vết rách hoặc vết cắt tầng sinh môn cần chăm sóc đặc biệt trong lúc lành. Việc tiếp tục các hoạt động nên cân nhắc cơn đau, tình trạng vết thương và hướng dẫn được đưa ra sau khi sinh.',
    s8Body2:
      'Sau khi mổ lấy thai, quá trình hồi phục cũng liên quan đến thành bụng và vết mổ. Dù cuộc sinh không qua đường âm đạo, bản thân thai kỳ vẫn gây áp lực lên sàn chậu.',
    s8HighlightTitle: 'Sự chăm sóc cá nhân hóa có thể giúp ích',
    s8HighlightText:
      'Trong trường hợp bị rách đáng kể, đau, có triệu chứng tiết niệu hoặc ruột, hoặc khó khăn kéo dài, một buổi đánh giá với nhân viên y tế có thể đặc biệt hữu ích.',

    s9Heading: 'Tiếp tục thể thao dần dần',
    s9Body1:
      'Việc vận động trở lại sau sinh nên diễn ra từ từ. Đi bộ và các động tác nhẹ nhàng nhìn chung có thể tiếp tục tùy theo cảm giác của bạn, trong khi các hoạt động va đập mạnh cần thận trọng hơn.',
    s9Body2:
      'Trước khi tiếp tục chạy, nhảy hoặc tập luyện rất cường độ cao, tốt nhất nên đánh giá sự hồi phục của sàn chậu và cân nhắc mọi triệu chứng.',
    s9AlertTitle: 'Đừng vội vàng các giai đoạn',
    s9AlertText:
      'Són tiểu, cảm giác nặng nề hoặc đau trong hoặc sau khi tập là dấu hiệu cho thấy bạn nên chậm lại và tìm lời khuyên trước khi tăng cường độ.',

    s10Heading: 'Khi nào nên gặp chuyên gia?',
    s10Body1:
      'Phục hồi sàn chậu với nữ hộ sinh hoặc nhà vật lý trị liệu có thể hữu ích nếu bạn không chắc mình đang co đúng cách, nếu triệu chứng kéo dài hoặc nếu bạn muốn tự tin tiếp tục một số hoạt động thể chất.',
    questionCardTitle: 'Những câu hỏi hữu ích nên hỏi',
    appointmentQuestions: [
      'Triệu chứng của tôi có phù hợp với sàn chậu yếu không?',
      'Tôi có đang thực hiện các động tác co đúng cách không?',
      'Tôi nên lặp lại bao nhiêu lần mỗi ngày?',
      'Tôi có thể quay lại chạy bộ, thể thao hoặc tập luyện va đập mạnh không?',
      'Tôi có cần phục hồi chức năng với nữ hộ sinh hoặc nhà vật lý trị liệu không?',
      'Vết mổ, vết rách hoặc vết mổ lấy thai của tôi có cần các biện pháp phòng ngừa đặc biệt nào không?',
    ],
    s10TipTitle: 'Nên biết',
    s10TipText:
      'Gặp một chuyên gia không nhất thiết có nghĩa là có điều gì sai. Một buổi có thể đơn giản giúp kiểm tra kỹ thuật của bạn, đánh giá sự hồi phục và học cách tiến bộ đúng cách.',

    s11Heading: 'Một quá trình hồi phục cần thời gian',
    s11Body1:
      'Sau khi sinh, việc không lấy lại ngay những cảm giác hoặc sức mạnh cơ như trước thai kỳ là điều bình thường.',
    s11Body2:
      'Mục tiêu không phải là thực hiện càng nhiều lần co càng tốt. Quan trọng hơn là dần lấy lại sự phối hợp tốt giữa co và thư giãn, rồi có thể dùng những cơ này một cách tự nhiên trong các hoạt động hằng ngày.',
    s11HighlightTitle: 'Tiến bộ nhỏ cũng là tiến bộ thực sự',
    s11HighlightText:
      'Nhận thức tốt hơn về động tác, giữ co thêm vài giây hoặc giảm số lần són tiểu đã là những dấu hiệu đáng khích lệ.',

    s12Heading: 'Những điểm chính cần nhớ',
    summaryTitle: 'Điều thiết yếu',
    summaryItems: [
      'Thai kỳ và sinh nở tạo áp lực đáng kể lên sàn chậu.',
      'Việc hồi phục dần dần là bình thường sau khi sinh.',
      'Các bài tập nên ưu tiên chất lượng động tác hơn sức mạnh.',
      'Hít thở và thư giãn cũng quan trọng không kém việc co.',
      'Són tiểu, cảm giác nặng nề hoặc đau kéo dài đáng được chuyên gia cho ý kiến.',
      'Phục hồi chức năng với nữ hộ sinh hoặc nhà vật lý trị liệu có thể giúp bạn lấy lại khả năng kiểm soát tốt hơn.',
      'Việc quay lại thể thao nên diễn ra từ từ, đặc biệt với các hoạt động va đập mạnh.',
    ],

    finalTipTitle: 'Hãy dành thời gian để hồi phục',
    finalTipText:
      'Sau khi sinh, cơ thể bạn đã trải qua rất nhiều thay đổi. Tầng sinh môn xứng đáng được quan tâm như phần còn lại của cơ thể bạn: dần dần, đều đặn và không áp lực.',

    disclaimerText:
      'Bài viết này chỉ mang tính thông tin và không thay thế lời khuyên y khoa cá nhân hóa. Nếu bạn bị đau, có triệu chứng kéo dài hoặc có bất kỳ lo lắng nào về quá trình hồi phục, hãy tìm lời khuyên từ nhân viên y tế.',
  },
  uz: {
    badge: 'TUGʻRUQDAN KEYIN • TIKLANISH',
    title: 'Tugʻruqdan keyin chanoq tubini\nmustahkamlash',
    metaDuration: '8 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Homiladorlik va tugʻruqdan keyin chanoq tubiga tiklanish uchun vaqt kerak. Oddiy, muntazam va bosqichma-bosqich mashqlar ishlarni shoshirmasdan kuch, nazorat va ishonchni qaytarishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Oraliq (perineum) rolini tushunish',
      'Tugʻruq nima uchun uni zoʻriqtiradi',
      'Chanoq tubini tiklashni qachon boshlash kerak',
      'Toʻgʻri qisqartirishni oʻrganish',
      'Bosqichma-bosqich tartib tuzish',
      'Oldini olish kerak boʻlgan xatolar',
      'Qachon yordam soʻrash kerak',
      'Sport bilan asta-sekin shugʻullanishni qayta boshlash',
      'Qabulga tayyorgarlik',
      'Asosiy xulosalar',
    ],
    shareMessage: 'Tugʻruqdan keyin chanoq tubini mustahkamlash — AWA',

    s1Heading: 'Oraliq (perineum) rolini tushunish',
    s1Body1:
      'Oraliq, chanoq tubi deb ham ataladi, chanoq asosida joylashgan mushaklar guruhi. U siydik pufagi va ichak nazoratida rol oʻynaydi va chanoq aʼzolarini qoʻllab-quvvatlashga yordam beradi.',
    s1Body2:
      'Homiladorlik davomida bu mushaklar bir necha oy qoʻshimcha ogʻirlikni koʻtarishi kerak. Ular tugʻruq paytida ham katta zoʻriqishga uchraydi.',
    s1HighlightTitle: 'Sezdirmaydigan, ammo muhim mushak',
    s1HighlightText:
      'Chanoq tubi bir nechta kundalik funksiyada ishtirok etadi: siydik va najasni ushlab turish, gazlarni nazorat qilish, chanoq aʼzolarini qoʻllab-quvvatlash va baʼzi jinsiy funksiyalarda rol oʻynash.',

    benefitsHeading: 'Mustahkamroq chanoq tubining foydalari',
    benefitsIntro:
      'Bosqichma-bosqich, toʻgʻri bajarilgan mustahkamlash chanoq tubi nazorati va qoʻllab-quvvatlashini yaxshilashga yordam beradi.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Siydik pufagi nazoratining yaxshilanishi',
        text: 'Chanoq tubi siydik pufagi nazoratida rol oʻynaydi. Uni asta-sekin mustahkamlash baʼzi siydik oqishlarini kamaytirishga yordam berishi mumkin.',
      },
      {
        icon: 'toilet',
        title: 'Ichak funksiyasini qoʻllab-quvvatlash',
        text: 'Bu mushaklar gaz va najasni nazorat qilishga ham yordam beradi va chanoq aʼzolarini qoʻllab-quvvatlashga hissa qoʻshadi.',
      },
      {
        icon: 'human-female',
        title: 'Chanoq aʼzolarini qoʻllab-quvvatlash',
        text: 'Chanoq tubi siydik pufagi, bachadon va ichakni qoʻllab-quvvatlashga yordam beradigan haqiqiy mushak asosini tashkil qiladi.',
      },
      {
        icon: 'heart-pulse',
        title: 'Sezgilarni asta-sekin qaytarish',
        text: 'Mos tiklanish bu sohani yaxshiroq anglash va nazorat qilishni qaytarishga ham yordam berishi mumkin.',
      },
    ],

    s2Heading: 'Homiladorlik va tugʻruq nima uchun uni zoʻriqtiradi',
    s2Body1:
      'Homiladorlik chanoq tubiga asta-sekin koʻproq bosim oʻtkazadi. Tabiiy tugʻruq esa bu sohadagi mushak va toʻqimalarni sezilarli choʻzishi mumkin.',
    s2Body2:
      'Kesarcha kesish ham chanoq tubini toʻliq asramaydi: homiladorlikning oʻzi bu mushaklar uchun muhim davr boʻlib qoladi.',
    s2Body3:
      'Tugʻruqdan keyin tiklanish vaqt olishi shuning uchun normal. Baʼzi ayollar deyarli hech qanday alomatni sezmaydi, boshqalari esa siydik oqishi, ogʻirlik hissi yoki mushak nazoratining pasayishini sezishi mumkin.',
    s2TipTitle: 'Har bir tiklanish boshqacha',
    s2TipText:
      'Tugʻruq turi, yirtilish yoki epiziotomiya, ogʻriqning mavjudligi va tugʻruqdan keyingi umumiy holatingiz tiklanishga taʼsir qilishi mumkin.',

    s3Heading: 'Chanoq tubini tiklashni qachon boshlash kerak?',
    s3Body1:
      'Asoratsiz tugʻruqdan keyin chanoq tubining yengil qisqartirishlarini odatda asta-sekin davom ettirish mumkin. Mashqlarni vaziyatingizga moslashtirish va agar asorat, sezilarli ogʻriq yoki maxsus muolaja boʻlgan boʻlsa, maslahat olish muhim boʻlib qoladi.',
    s3Body2:
      'Agar siydik kateteringiz boʻlsa, baʼzi tavsiyalar oraliq mashqlarini boshlashdan oldin uni olib tashlanishini va normal siyish tiklanishini kutishni taklif qiladi.',
    s3AlertTitle: 'Ogʻriqqa qaramay davom etmang',
    s3AlertText:
      'Sezilarli ogʻriq, yomonlashayotgan alomatlar, yomon bitayotgan yara yoki har qanday alohida xavotir doya, shifokor yoki tiklanish mutaxassisidan maslahat olishni talab qiladi.',

    s4Heading: 'Toʻgʻri qisqartirishni oʻrganish',
    s4Body1:
      'Harakatni aniqlash uchun bir vaqtning oʻzida gaz va siyishga boʻlgan ehtiyojni ushlab turishga harakat qilayotganingizni tasavvur qiling. Siz izlayotgan harakat — ichkariga qarab qisqarish va koʻtarilish hissi.',
    s4Body2:
      'Maqsad butun tanani qattiq taranglashtirish emas. Dumbalar, sonlar va qorin mushaklari imkon qadar boʻsh qolishi kerak, nafas olish esa odatdagidek davom etadi.',
    exercises: [
      {icon: 'weather-windy', label: 'Nafas olish'},
      {icon: 'human-handsup', label: 'Yengil qisqartirish'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Uzoq qisqartirish'},
      {icon: 'gesture-tap-button', label: 'Tez qisqartirishlar'},
    ],
    s4HighlightTitle: 'Boʻshashish ham xuddi shunday muhim',
    s4HighlightText:
      'Har bir qisqartirishdan keyin mushaklarni toʻliq boʻshashtiring. Yaxshi tiklanish oraliqni kun boʻyi qisqargan holda saqlashni anglatmaydi.',

    s5Heading: 'Bosqichma-bosqich tartib tuzish',
    s5Body1:
      'Dastlab eng muhimi — mushaklarni aniqlash va harakatni toʻgʻri bajarishni oʻrganish. Izchillik shiddatdan muhimroq.',
    s5h3a: 'Uzoq qisqartirishlar',
    s5Body2:
      'Chanoq tubini muloyim qisqartiring, keyin nafasni ushlamasdan qisqartirishni bir necha soniya ushlab turing. Keyin qaytadan boshlashdan oldin toʻliq boʻshating.',
    s5h3b: 'Qisqa qisqartirishlar',
    s5Body3:
      'Harakat oʻzlashtirilgandan keyin, mayda tez qisqartirishlarni qoʻshish mumkin. Ular qorin ichi bosimi ortganda, masalan, yoʻtalish yoki aksirishdan oldin mushaklarni tez qisqartirish qobiliyatini mashq qildiradi.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Mashqlarni kundalik odat bilan bogʻlang'},
      {icon: 'human-sitting', label: 'Qulay holatdan boshlang'},
      {icon: 'weather-windy', label: 'Qisqartirish paytida odatdagidek nafas oling'},
      {icon: 'sleep', label: 'Boʻshashish bosqichlariga rioya qiling'},
      {icon: 'chart-line', label: 'Murakkablikni asta-sekin oshiring'},
      {icon: 'doctor', label: 'Ishonchingiz komil boʻlmasa, maslahat soʻrang'},
    ],
    s5TipTitle: 'Eng avvalo izchillik',
    s5TipText:
      'Mashqlarni kuningizning allaqachon bir qismi boʻlgan odat bilan bogʻlash izchillikni saqlashni osonlashtirishi mumkin: emizishdan keyin, tish yuvgandan keyin yoki sizga mos boshqa vaqtda.',

    s6Heading: 'Oldini olish kerak boʻlgan keng tarqalgan xatolar',
    s6Body1:
      'Oraliq mashqlari oddiy koʻrinishi mumkin, ammo boshqa mushaklar bilan kompensatsiya qilish yoki haddan tashqari zoʻr berish oson.',
    commonMistakes: [
      'Chanoq tubi oʻrniga dumba yoki sonlarni taranglashtirish',
      'Qisqartirish paytida nafasni ushlash',
      'Mushaklarni boʻshashtirmasdan doimiy qisqargan holda saqlash',
      'Mashqlarni faqat bir necha kun bajarib, keyin toʻxtatish',
      'Qisqartirishni tekshirish uchun siydik oqimini ataylab toʻxtatish',
    ],
    s6TipTitle: 'Nima qilmaslik kerak',
    s6TipText:
      'Mashqlarni siydik oqimini ataylab toʻxtatish orqali bajarish tavsiya etilmaydi. Bu usul oraliqni toʻgʻri mashq qildirmaydi va siydik pufagining normal ishini buzishi mumkin.',

    s7Heading: 'Qaysi alomatlar konsultatsiyaga sabab boʻlishi kerak?',
    s7Body1:
      'Tugʻruqdan keyin yengil siydik oqishi yoki odatdan tashqari sezgi paydo boʻlishi mumkin. Biroq ular saqlanib qolsa, yomonlashsa yoki kundalik hayotingizga xalaqit bersa, eʼtiborsiz qoldirmaslik kerak.',
    warningSigns: [
      'Yoʻtalganda, aksirganda, kulganda yoki zoʻriqqanda siydik oqishi',
      'Pastki chanoqda ogʻirlik yoki bosim hissi',
      'Qinga nimadir yoki biror boʻrtma tushayotgandek his',
      'Gaz yoki najasni ushlab turishda qiyinchilik',
      'Oraliqda doimiy ogʻriq',
      'Jinsiy aloqa paytida yoki undan keyin ogʻriq',
      'Oraliq mushaklarini aniqlash yoki toʻgʻri qisqartirishda qiyinchilik',
    ],
    consultLabel: 'Qachon maslahat olish kerak?',
    s7Body2:
      'Chanoq tubini tiklashga ixtisoslashgan doya, shifokor yoki fizioterapevt mushak ishini tekshirib, mos dasturni taklif qilishi mumkin.',

    s8Heading: 'Yirtilish, epiziotomiya yoki kesarcha kesishdan keyin-chi?',
    s8Body1:
      'Yirtilish yoki epiziotomiya bitish davomida alohida parvarishni talab qiladi. Faoliyatni qayta boshlashda ogʻriq, chandiq holati va tugʻruqdan keyin berilgan yoʻl-yoʻriq hisobga olinishi kerak.',
    s8Body2:
      'Kesarcha kesishdan keyin tiklanish qorin devori va chandiqni ham oʻz ichiga oladi. Tugʻruq tabiiy boʻlmasa ham, homiladorlikning oʻzi baribir chanoq tubini zoʻriqtirgan.',
    s8HighlightTitle: 'Shaxsiy yordam foydali boʻlishi mumkin',
    s8HighlightText:
      'Sezilarli yirtilish, ogʻriq, siydik yoki ichak alomatlari yoki doimiy qiyinchiliklar boʻlsa, sogʻliqni saqlash mutaxassisi bilan baholash ayniqsa foydali boʻlishi mumkin.',

    s9Heading: 'Sport bilan asta-sekin shugʻullanishni qayta boshlash',
    s9Body1:
      'Tugʻruqdan keyin harakatni qayta boshlash bosqichma-bosqich boʻlishi kerak. Piyoda yurish va yengil harakatlarni odatda oʻzingizni qanday his qilishingizga qarab davom ettirish mumkin, yuqori zarbali faollik esa koʻproq ehtiyotkorlikni talab qiladi.',
    s9Body2:
      'Yugurish, sakrash yoki juda intensiv mashgʻulotlarni qayta boshlashdan oldin chanoq tubining tiklanishini baholash va har qanday alomatlarni hisobga olish maʼqul.',
    s9AlertTitle: 'Bosqichlarni shoshirmang',
    s9AlertText:
      'Mashq paytida yoki undan keyin siydik oqishi, ogʻirlik hissi yoki ogʻriq — sekinlashish va shiddatni oshirishdan oldin maslahat olish kerakligini bildiradi.',

    s10Heading: 'Qachon mutaxassisga borish kerak?',
    s10Body1:
      'Doya yoki fizioterapevt bilan chanoq tubini tiklash, agar toʻgʻri qisqartirayotganingizga ishonchingiz komil boʻlmasa, alomatlaringiz saqlanib qolsa yoki baʼzi jismoniy faoliyatni ishonch bilan davom ettirmoqchi boʻlsangiz, foydali boʻlishi mumkin.',
    questionCardTitle: 'Berish foydali boʻlgan savollar',
    appointmentQuestions: [
      'Alomatlarim chanoq tubining zaiflashishiga mos keladimi?',
      'Men qisqartirishlarni toʻgʻri bajaryapmanmi?',
      'Kuniga necha marta takrorlashim kerak?',
      'Yugurish, sport yoki yuqori zarbali mashqlarga qaytsam boʻladimi?',
      'Menga doya yoki fizioterapevt bilan tiklanish kerakmi?',
      'Mening chandiqim, yirtilishim yoki kesarcha kesishim alohida ehtiyot choralarini talab qiladimi?',
    ],
    s10TipTitle: 'Bilish foydali',
    s10TipText:
      'Mutaxassisga borish albatta nimadir notoʻgʻriligini anglatmaydi. Seans shunchaki texnikangizni tekshirishga, tiklanishingizni baholashga va toʻgʻri rivojlanishni oʻrganishga yordam berishi mumkin.',

    s11Heading: 'Vaqt oladigan tiklanish',
    s11Body1:
      'Tugʻruqdan keyin homiladorlikdan oldingi sezgi yoki mushak kuchini darhol qaytarib olmaslik normal.',
    s11Body2:
      'Maqsad iloji boricha koʻproq qisqartirish qilish emas. Bu koʻproq qisqartirish va boʻshashish oʻrtasidagi yaxshi muvofiqlikni asta-sekin tiklash, keyin bu mushaklardan kundalik faoliyatda tabiiy foydalana olishdir.',
    s11HighlightTitle: 'Kichik muvaffaqiyat — haqiqiy muvaffaqiyat',
    s11HighlightText:
      'Harakatni yaxshiroq anglash, qisqartirishni bir necha soniya koʻproq ushlab turish yoki siydik oqishining kamayishi allaqachon umidli belgilar.',

    s12Heading: 'Asosiy xulosalar',
    summaryTitle: 'Asosiy jihatlar',
    summaryItems: [
      'Homiladorlik va tugʻruq chanoq tubiga sezilarli zoʻriqish beradi.',
      'Tugʻruqdan keyin bosqichma-bosqich tiklanish normal.',
      'Mashqlarda kuchdan koʻra harakat sifatiga ustuvorlik berilishi kerak.',
      'Nafas olish va boʻshashish qisqartirish kabi muhim.',
      'Siydik oqishi, ogʻirlik yoki doimiy ogʻriq mutaxassis fikriga arziydi.',
      'Doya yoki fizioterapevt bilan tiklanish nazoratni yaxshiroq qaytarishga yordam beradi.',
      'Sportga qaytish bosqichma-bosqich boʻlishi kerak, ayniqsa yuqori zarbali faollik uchun.',
    ],

    finalTipTitle: 'Tiklanish uchun vaqt ajrating',
    finalTipText:
      'Tugʻruqdan keyin tanangiz koʻp oʻzgarishlarni boshdan kechirdi. Oraliq tananing qolgan qismi kabi eʼtiborga loyiq: asta-sekin, muntazam va bosimsiz.',

    disclaimerText:
      'Bu maqola faqat maʼlumot uchun va shaxsiy tibbiy maslahatni almashtirmaydi. Agar ogʻriq, doimiy alomatlar boʻlsa yoki tiklanishingiz haqida xavotir boʻlsa, sogʻliqni saqlash mutaxassisidan maslahat oling.',
  },
  az: {
    badge: 'DOĞUŞDAN SONRA • BƏRPA',
    title: 'Doğuşdan sonra çanaq\ndibini gücləndirmək',
    metaDuration: '8 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Hamiləlikdən və doğuşdan sonra çanaq dibinin bərpa olunmaq üçün vaxta ehtiyacı var. Sadə, müntəzəm və tədricən məşqlər prosesi sürətləndirməyə çalışmadan gücü, nəzarəti və özünəinamı bərpa etməyə kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Perineumun rolunu anlamaq',
      'Doğuş onu nə üçün gərginləşdirir',
      'Çanaq dibinin reabilitasiyasına nə vaxt başlamaq lazımdır',
      'Düzgün yığılmağı öyrənmək',
      'Tədricən rutin qurmaq',
      'Qarşısını almaq lazım olan səhvlər',
      'Nə vaxt kömək istəmək lazımdır',
      'İdmana tədricən qayıtmaq',
      'Qəbula hazırlıq',
      'Əsas nəticələr',
    ],
    shareMessage: 'Doğuşdan sonra çanaq dibini gücləndirmək — AWA',

    s1Heading: 'Perineumun rolunu anlamaq',
    s1Body1:
      'Çanaq dibi də adlanan perineum çanağın əsasında yerləşən əzələ qrupudur. O, sidik kisəsinə və bağırsağa nəzarətdə rol oynayır və çanaq orqanlarını dəstəkləməyə kömək edir.',
    s1Body2:
      'Hamiləlik zamanı bu əzələlər bir neçə ay əlavə çəki daşımalıdır. Doğuş zamanı da onlar xeyli gərginliyə məruz qalır.',
    s1HighlightTitle: 'Diskret, lakin vacib əzələ',
    s1HighlightText:
      'Çanaq dibi bir neçə gündəlik funksiyada iştirak edir: sidiyi və nəcisi saxlamaq, qazlara nəzarət etmək, çanaq orqanlarını dəstəkləmək və bəzi cinsi funksiyalarda rol oynamaq.',

    benefitsHeading: 'Daha güclü çanaq dibinin faydaları',
    benefitsIntro:
      'Tədricən və düzgün aparılan möhkəmləndirmə çanaq dibinə nəzarəti və dəstəyi yaxşılaşdırmağa kömək edə bilər.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Sidik kisəsinə daha yaxşı nəzarət',
        text: 'Çanaq dibi sidik kisəsinə nəzarətdə rol oynayır. Onu tədricən gücləndirmək bəzi sidik sızmalarını azaltmağa kömək edə bilər.',
      },
      {
        icon: 'toilet',
        title: 'Bağırsaq funksiyasını dəstəkləmək',
        text: 'Bu əzələlər həm də qazlara və nəcisə nəzarət etməyə kömək edir və çanaq orqanlarını dəstəkləməyə töhfə verir.',
      },
      {
        icon: 'human-female',
        title: 'Çanaq orqanlarını dəstəkləmək',
        text: 'Çanaq dibi sidik kisəsinə, uşaqlığa və bağırsağa dəstək olmağa kömək edən həqiqi əzələ əsası təşkil edir.',
      },
      {
        icon: 'heart-pulse',
        title: 'Hissiyatı tədricən bərpa etmək',
        text: 'Uyğun reabilitasiya bu nahiyənin daha yaxşı dərk edilməsini və nəzarətini bərpa etməyə də kömək edə bilər.',
      },
    ],

    s2Heading: 'Hamiləlik və doğuş onu nə üçün gərginləşdirir',
    s2Body1:
      'Hamiləlik çanaq dibinə tədricən daha çox təzyiq göstərir. Vaginal doğuş isə bu nahiyənin əzələlərini və toxumalarını xeyli dartır.',
    s2Body2:
      'Kesar kəsiyi də çanaq dibini tam qorumur: hamiləliyin özü bu əzələlər üçün əhəmiyyətli dövr olaraq qalır.',
    s2Body3:
      'Doğuşdan sonra bərpanın vaxt aparması buna görə normaldır. Bəzi qadınlar demək olar ki, heç bir simptom hiss etmir, digərləri isə sızma, ağırlıq hissi və ya əzələ nəzarətinin azalmasını hiss edə bilər.',
    s2TipTitle: 'Hər bərpa fərqlidir',
    s2TipText:
      'Doğuşun növü, yırtıq və ya epiziotomiya, ağrının olması və doğuşdan sonrakı ümumi vəziyyətiniz bərpaya təsir edə bilər.',

    s3Heading: 'Çanaq dibinin reabilitasiyasına nə vaxt başlamaq lazımdır?',
    s3Body1:
      'Fəsadsız doğuşdan sonra çanaq dibinin mülayim yığılmalarını adətən tədricən bərpa etmək olar. Məşqləri vəziyyətinizə uyğunlaşdırmaq və fəsad, əhəmiyyətli ağrı və ya xüsusi müdaxilə yaşamısınızsa, məsləhət almaq vacib olaraq qalır.',
    s3Body2:
      'Sidik kateteriniz varsa, bəzi tövsiyələr perineum məşqlərinə başlamazdan əvvəl onun çıxarılmasını və normal sidik ifrazının bərpa olunmasını gözləməyi təklif edir.',
    s3AlertTitle: 'Ağrıya baxmayaraq davam etməyin',
    s3AlertText:
      'Əhəmiyyətli ağrı, pisləşən simptomlar, pis sağalan yara və ya hər hansı xüsusi narahatlıq mama, həkim və ya reabilitasiya mütəxəssisinin məsləhətini tələb edir.',

    s4Heading: 'Düzgün yığılmağı öyrənmək',
    s4Body1:
      'Hərəkəti müəyyən etmək üçün eyni zamanda qazı və sidik ifrazı istəyini saxlamağa çalışdığınızı təsəvvür edin. Axtardığınız hərəkət yığılma və içəriyə qaldırma hissidir.',
    s4Body2:
      'Məqsəd bütün bədəni sıx gərmək deyil. Nəfəs normal davam edərkən omba, bud və qarın əzələləri mümkün qədər rahat qalmalıdır.',
    exercises: [
      {icon: 'weather-windy', label: 'Nəfəs'},
      {icon: 'human-handsup', label: 'Mülayim yığılma'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Uzun yığılma'},
      {icon: 'gesture-tap-button', label: 'Sürətli yığılmalar'},
    ],
    s4HighlightTitle: 'Rahatlamaq da eyni dərəcədə vacibdir',
    s4HighlightText:
      'Hər yığılmadan sonra əzələlərin tam rahatlaşmasına icazə verin. Yaxşı reabilitasiya perineumu gün boyu yığılmış saxlamaq demək deyil.',

    s5Heading: 'Tədricən rutin qurmaq',
    s5Body1:
      'Əvvəlcə ən vacib məsələ əzələləri müəyyən etməyi və hərəkəti düzgün yerinə yetirməyi öyrənməkdir. Müntəzəmlik intensivlikdən daha vacibdir.',
    s5h3a: 'Uzun yığılmalar',
    s5Body2:
      'Çanaq dibini mülayim yığın, sonra nəfəsi tutmadan yığılmanı bir neçə saniyə saxlayın. Sonra yenidən başlamazdan əvvəl tam buraxın.',
    s5h3b: 'Qısa yığılmalar',
    s5Body3:
      'Hərəkət mənimsənildikdən sonra kiçik sürətli yığılmalar əlavə edilə bilər. Onlar qarın təzyiqi artdıqda, məsələn, öskürmədən və ya asqırmadan əvvəl əzələləri sürətlə yığmaq qabiliyyətini məşq etdirir.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Məşqləri gündəlik vərdişlə birləşdirin'},
      {icon: 'human-sitting', label: 'Rahat vəziyyətdə başlayın'},
      {icon: 'weather-windy', label: 'Yığılmalar zamanı normal nəfəs alın'},
      {icon: 'sleep', label: 'Rahatlama fazalarına riayət edin'},
      {icon: 'chart-line', label: 'Çətinliyi tədricən artırın'},
      {icon: 'doctor', label: 'Əmin deyilsinizsə, məsləhət alın'},
    ],
    s5TipTitle: 'Hər şeydən əvvəl müntəzəmlik',
    s5TipText:
      'Məşqləri günün artıq bir hissəsi olan vərdişlə birləşdirmək müntəzəm qalmağı asanlaşdıra bilər: əmizdirmədən sonra, dişləri fırçalayandan sonra və ya sizə uyğun başqa vaxtda.',

    s6Heading: 'Qarşısını almaq lazım olan geniş yayılmış səhvlər',
    s6Body1:
      'Perineum məşqləri sadə görünə bilər, lakin digər əzələlərlə kompensasiya etmək və ya həddindən artıq zorlamaq asandır.',
    commonMistakes: [
      'Çanaq dibi əvəzinə omba və ya bud əzələlərini gərmək',
      'Yığılma zamanı nəfəsi tutmaq',
      'Əzələləri rahatlamağa icazə vermədən daim yığılmış saxlamaq',
      'Məşqləri yalnız bir neçə gün etmək, sonra dayandırmaq',
      'Yığılmanı yoxlamaq üçün sidik axınını qəsdən dayandırmaq',
    ],
    s6TipTitle: 'Nə etməmək lazımdır',
    s6TipText:
      'Məşqləri sidik axınını qəsdən dayandırmaqla həyata keçirmək tövsiyə edilmir. Bu üsul perineumu düzgün məşq etdirmir və sidik kisəsinin normal funksiyasını poza bilər.',

    s7Heading: 'Hansı simptomlar konsultasiyaya səbəb olmalıdır?',
    s7Body1:
      'Doğuşdan sonra bəzən kiçik sızmalar və ya qeyri-adi hiss görünə bilər. Lakin onlar davam edərsə, pisləşərsə və ya gündəlik həyatınıza mane olarsa, nəzərə alınmamalıdır.',
    warningSigns: [
      'Öskürəndə, asqıranda, gülərkən və ya zorlananda sidik sızması',
      'Aşağı çanaqda ağırlıq və ya təzyiq hissi',
      'Vaginaya bir şişin və ya nəyinsə düşdüyü hissi',
      'Qazı və ya nəcisi saxlamaqda çətinlik',
      'Perineumda davamlı ağrı',
      'Cinsi əlaqə zamanı və ya sonra ağrı',
      'Perineum əzələlərini müəyyən etməkdə və ya düzgün yığmaqda çətinlik',
    ],
    consultLabel: 'Nə vaxt məsləhət almaq lazımdır?',
    s7Body2:
      'Çanaq dibinin reabilitasiyası üzrə ixtisaslaşmış mama, həkim və ya fizioterapevt əzələ funksiyasını yoxlaya və uyğun proqram təklif edə bilər.',

    s8Heading: 'Bəs yırtıqdan, epiziotomiyadan və ya kesar kəsiyindən sonra?',
    s8Body1:
      'Yırtıq və ya epiziotomiya sağalma zamanı xüsusi qayğı tələb edir. Fəaliyyətlərin bərpası ağrını, çapığın vəziyyətini və doğuşdan sonra verilən tövsiyələri nəzərə almalıdır.',
    s8Body2:
      'Kesar kəsiyindən sonra bərpa qarın divarını və çapığı da əhatə edir. Doğuş vaginal olmasa belə, hamiləliyin özü çanaq dibinə yük qoymuşdur.',
    s8HighlightTitle: 'Fərdiləşdirilmiş qayğı kömək edə bilər',
    s8HighlightText:
      'Əhəmiyyətli yırtıq, ağrı, sidik və ya bağırsaq simptomları və ya davamlı çətinliklər olduqda, tibb işçisi ilə qiymətləndirmə xüsusilə faydalı ola bilər.',

    s9Heading: 'İdmana tədricən qayıtmaq',
    s9Body1:
      'Doğuşdan sonra hərəkətə qayıtmaq tədricən olmalıdır. Gəzinti və mülayim hərəkətlər adətən özünüzü necə hiss etdiyinizə uyğun bərpa oluna bilər, yüksək təsirli fəaliyyətlər isə daha çox ehtiyatlılıq tələb edir.',
    s9Body2:
      'Qaçışı, tullanmağı və ya çox intensiv məşqi bərpa etməzdən əvvəl çanaq dibinin bərpasını qiymətləndirmək və hər hansı simptomları nəzərə almaq daha yaxşıdır.',
    s9AlertTitle: 'Mərhələləri tələsdirməyin',
    s9AlertText:
      'Sızmalar, ağırlıq hissi və ya məşq zamanı və ya sonra ağrı intensivliyi artırmazdan əvvəl yavaşlamalı və məsləhət almalı olduğunuzun əlamətləridir.',

    s10Heading: 'Nə vaxt mütəxəssisə müraciət etmək lazımdır?',
    s10Body1:
      'Mama və ya fizioterapevtlə çanaq dibi reabilitasiyası düzgün yığılıb-yığılmadığınızdan əmin olmadıqda, simptomlarınız davam etdikdə və ya bəzi fiziki fəaliyyətləri əminliklə bərpa etmək istədikdə faydalı ola bilər.',
    questionCardTitle: 'Verməyə dəyər faydalı suallar',
    appointmentQuestions: [
      'Simptomlarım çanaq dibinin zəifliyinə uyğundurmu?',
      'Yığılmaları düzgün yerinə yetirirəmmi?',
      'Gündə neçə təkrar etməliyəm?',
      'Qaçışa, idmana və ya yüksək təsirli məşqə qayıda bilərəmmi?',
      'Mama və ya fizioterapevtlə reabilitasiyaya ehtiyacım varmı?',
      'Çapığım, yırtığım və ya kesar kəsiyim hər hansı xüsusi ehtiyat tədbirləri tələb edirmi?',
    ],
    s10TipTitle: 'Bilmək faydalıdır',
    s10TipText:
      'Mütəxəssisə müraciət etmək mütləq nəsə səhv olduğu demək deyil. Seans sadəcə texnikanızı yoxlamağa, bərpanızı qiymətləndirməyə və düzgün irəliləməyi öyrənməyə kömək edə bilər.',

    s11Heading: 'Vaxt aparan bərpa',
    s11Body1:
      'Doğuşdan sonra hamiləlikdən əvvəl olan eyni hissləri və ya əzələ gücünü dərhal bərpa etməmək normaldır.',
    s11Body2:
      'Məqsəd mümkün qədər çox yığılma etmək deyil. Məsələ daha çox yığılma ilə rahatlama arasında yaxşı koordinasiyanı tədricən bərpa etmək və sonra bu əzələlərdən gündəlik fəaliyyətlərdə təbii şəkildə istifadə edə bilməkdir.',
    s11HighlightTitle: 'Kiçik irəliləyiş də real irəliləyişdir',
    s11HighlightText:
      'Hərəkətin daha yaxşı dərk edilməsi, yığılmanın bir neçə əlavə saniyəsi və ya sızmaların azalması artıq ruhlandırıcı əlamətlərdir.',

    s12Heading: 'Əsas nəticələr',
    summaryTitle: 'Əsas məsələlər',
    summaryItems: [
      'Hamiləlik və doğuş çanaq dibinə əhəmiyyətli yük qoyur.',
      'Doğuşdan sonra tədricən bərpa normaldır.',
      'Məşqlərdə güc deyil, hərəkətin keyfiyyəti üstün tutulmalıdır.',
      'Nəfəs və rahatlama yığılma qədər vacibdir.',
      'Sidik sızması, ağırlıq hissi və ya davamlı ağrı mütəxəssisin rəyinə layiqdir.',
      'Mama və ya fizioterapevtlə reabilitasiya daha yaxşı nəzarəti bərpa etməyə kömək edə bilər.',
      'İdmana qayıdış tədricən olmalıdır, xüsusilə yüksək təsirli fəaliyyətlər üçün.',
    ],

    finalTipTitle: 'Bərpa olunmaq üçün vaxt ayırın',
    finalTipText:
      'Doğuşdan sonra bədəniniz çoxlu dəyişikliklərdən keçib. Perineum də bədəninizin qalan hissəsi qədər diqqətə layiqdir: tədricən, müntəzəm və təzyiqsiz.',

    disclaimerText:
      'Bu məqalə yalnız məlumat məqsədilə təqdim olunur və fərdi tibbi məsləhəti əvəz etmir. Ağrı, davamlı simptomlar yaşayırsınızsa və ya bərpanızla bağlı narahatlığınız varsa, tibb işçisindən məsləhət alın.',
  },
  ka: {
    badge: 'მშობიარობის შემდგომი პერიოდი • გამოჯანმრთელება',
    title: 'მენჯის ფსკერის გაძლიერება\nმშობიარობის შემდეგ',
    metaDuration: '8 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'ორსულობისა და მშობიარობის შემდეგ მენჯის ფსკერს გამოჯანმრთელებისთვის დრო სჭირდება. მარტივ, რეგულარულ და ეტაპობრივ ვარჯიშებს შეუძლია დაგეხმაროთ ძალის, კონტროლისა და თავდაჯერებულობის დაბრუნებაში, საქმეების აჩქარების გარეშე.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'პერინეუმის როლის გაგება',
      'რატომ ხდება მშობიარობისას მასზე დატვირთვა',
      'როდის დავიწყოთ მენჯის ფსკერის რეაბილიტაცია',
      'სწორად შეკუმშვის სწავლა',
      'ეტაპობრივი რუტინის აგება',
      'შეცდომები, რომლებიც თავიდან უნდა ავიცილოთ',
      'როდის ვითხოვოთ დახმარება',
      'სპორტის ეტაპობრივი განახლება',
      'ვიზიტისთვის მომზადება',
      'მთავარი დასკვნები',
    ],
    shareMessage: 'მენჯის ფსკერის გაძლიერება მშობიარობის შემდეგ — AWA',

    s1Heading: 'პერინეუმის როლის გაგება',
    s1Body1:
      'პერინეუმი, რომელსაც მენჯის ფსკერსაც უწოდებენ, მენჯის ძირში მდებარე კუნთების ჯგუფია. ის მონაწილეობს შარდის ბუშტისა და ნაწლავის კონტროლში და მენჯის ორგანოების მხარდაჭერაში გეხმარებათ.',
    s1Body2:
      'ორსულობის დროს ეს კუნთები რამდენიმე თვის განმავლობაში დამატებით წონას უნდა ატარებდეს. მშობიარობის დროსაც მათზე მნიშვნელოვანი დატვირთვა მოდის.',
    s1HighlightTitle: 'დისკრეტული, მაგრამ არსებითი კუნთი',
    s1HighlightText:
      'მენჯის ფსკერი რამდენიმე ყოველდღიურ ფუნქციაში მონაწილეობს: შარდისა და განავლის შეკავებაში, აირების კონტროლში, მენჯის ორგანოების მხარდაჭერაში და გარკვეულ სექსუალურ ფუნქციებში.',

    benefitsHeading: 'მენჯის ფსკერის გაძლიერების სარგებელი',
    benefitsIntro:
      'ეტაპობრივმა, სწორად შესრულებულმა გაძლიერებამ შეიძლება მენჯის ფსკერის კონტროლისა და მხარდაჭერის გაუმჯობესებაში დაგეხმაროთ.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'შარდის ბუშტის უკეთესი კონტროლი',
        text: 'მენჯის ფსკერი შარდის ბუშტის კონტროლში მონაწილეობს. მისმა ეტაპობრივმა გაძლიერებამ შეიძლება შარდის გარკვეული გაჟონვა შეამციროს.',
      },
      {
        icon: 'toilet',
        title: 'ნაწლავის ფუნქციის მხარდაჭერა',
        text: 'ეს კუნთები ასევე აირებისა და განავლის კონტროლში გეხმარებათ და მენჯის ორგანოების მხარდაჭერას უწყობს ხელს.',
      },
      {
        icon: 'human-female',
        title: 'მენჯის ორგანოების მხარდაჭერა',
        text: 'მენჯის ფსკერი ნამდვილ კუნთოვან საფუძველს ქმნის, რომელიც შარდის ბუშტის, საშვილოსნოსა და ნაწლავის მხარდაჭერაში გეხმარებათ.',
      },
      {
        icon: 'heart-pulse',
        title: 'შეგრძნების ეტაპობრივი დაბრუნება',
        text: 'სათანადო რეაბილიტაციას ასევე შეუძლია ამ უბნის უკეთესი გაცნობიერებისა და კონტროლის დაბრუნებაში დაგეხმაროთ.',
      },
    ],

    s2Heading: 'რატომ ხდება ორსულობისა და მშობიარობისას მასზე დატვირთვა',
    s2Body1:
      'ორსულობა მენჯის ფსკერზე ეტაპობრივად მეტ წნევას ქმნის. ვაგინალურ მშობიარობას შეუძლია ამ უბნის კუნთებისა და ქსოვილების მნიშვნელოვანი გაჭიმვა.',
    s2Body2:
      'საკეისრო კვეთაც მენჯის ფსკერს სრულად არ ზოგავს: თავად ორსულობა ამ კუნთებისთვის მნიშვნელოვანი პერიოდი რჩება.',
    s2Body3:
      'მშობიარობის შემდეგ ამიტომ ნორმალურია, რომ გამოჯანმრთელებას დრო სჭირდება. ზოგი ქალი თითქმის არანაირ სიმპტომს არ გრძნობს, სხვებმა კი შეიძლება გაჟონვა, სიმძიმის შეგრძნება ან კუნთების შემცირებული კონტროლი შეამჩნიონ.',
    s2TipTitle: 'ყოველი გამოჯანმრთელება განსხვავებულია',
    s2TipText:
      'მშობიარობის ტიპმა, გახევამ ან ეპიზიოტომიამ, ტკივილის არსებობამ და მშობიარობის შემდეგ თქვენმა საერთო მდგომარეობამ შეიძლება გამოჯანმრთელებაზე იმოქმედოს.',

    s3Heading: 'როდის დავიწყოთ მენჯის ფსკერის რეაბილიტაცია?',
    s3Body1:
      'გართულების გარეშე მშობიარობის შემდეგ მენჯის ფსკერის რბილი შეკუმშვები, როგორც წესი, ეტაპობრივად შეიძლება განახლდეს. მნიშვნელოვანი რჩება ვარჯიშების თქვენს სიტუაციაზე მორგება და რჩევის ძიება, თუ გართულება, მნიშვნელოვანი ტკივილი ან კონკრეტული პროცედურა გქონდათ.',
    s3Body2:
      'თუ შარდის კათეტერი გაქვთ, ზოგი რეკომენდაცია გვთავაზობს დაელოდოთ მის მოხსნას და ნორმალური შარდვის განახლებას, სანამ პერინეუმის ვარჯიშებს დაიწყებთ.',
    s3AlertTitle: 'ტკივილის მიუხედავად ნუ გააგრძელებთ',
    s3AlertText:
      'მნიშვნელოვანი ტკივილი, გაუარესებული სიმპტომები, ცუდად შეხორცებადი ჭრილობა ან ნებისმიერი განსაკუთრებული შეშფოთება ბებიაქალის, ექიმის ან რეაბილიტაციის სპეციალისტის რჩევას მოითხოვს.',

    s4Heading: 'სწორად შეკუმშვის სწავლა',
    s4Body1:
      'მოძრაობის გამოსავლენად წარმოიდგინეთ, რომ ერთდროულად აირების და შარდვის სურვილის შეკავებას ცდილობთ. მოძრაობა, რომელსაც ეძებთ, შეკუმშვისა და შიგნით აწევის შეგრძნებაა.',
    s4Body2:
      'მიზანი არ არის მთელი სხეულის მკაცრად დაძაბვა. თქვენი დუნდულები, თეძოები და მუცლის კუნთები რაც შეიძლება მოდუნებული უნდა დარჩეს, სუნთქვა კი ნორმალურად გაგრძელდეს.',
    exercises: [
      {icon: 'weather-windy', label: 'სუნთქვა'},
      {icon: 'human-handsup', label: 'რბილი შეკუმშვა'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ხანგრძლივი შეკუმშვა'},
      {icon: 'gesture-tap-button', label: 'სწრაფი შეკუმშვები'},
    ],
    s4HighlightTitle: 'მოდუნებაც ისეთივე მნიშვნელოვანია',
    s4HighlightText:
      'ყოველი შეკუმშვის შემდეგ კუნთები სრულად მოადუნეთ. კარგი რეაბილიტაცია არ ნიშნავს პერინეუმის მთელი დღის განმავლობაში შეკუმშულად დაჭერას.',

    s5Heading: 'ეტაპობრივი რუტინის აგება',
    s5Body1:
      'დასაწყისში ყველაზე მნიშვნელოვანი კუნთების ამოცნობის და მოძრაობის სწორად შესრულების სწავლაა. თანმიმდევრულობა ინტენსივობაზე მნიშვნელოვანია.',
    s5h3a: 'ხანგრძლივი შეკუმშვები',
    s5Body2:
      'ნაზად შეკუმშეთ მენჯის ფსკერი, შემდეგ შეკუმშვა რამდენიმე წამს დაიჭირეთ სუნთქვის შეკავების გარეშე. შემდეგ სრულად მოდუნდით, სანამ თავიდან დაიწყებთ.',
    s5h3b: 'მოკლე შეკუმშვები',
    s5Body3:
      'მოძრაობის ათვისების შემდეგ შეიძლება პატარა სწრაფი შეკუმშვების დამატება. ისინი კუნთების სწრაფად შეკუმშვის უნარს ავარჯიშებს, როცა მუცლის წნევა იზრდება, მაგალითად ხველებამდე ან ცემინებამდე ცოტა ხნით ადრე.',
    dailyTips: [
      {icon: 'clock-outline', label: 'დააკავშირეთ ვარჯიშები ყოველდღიურ ჩვევას'},
      {icon: 'human-sitting', label: 'დაიწყეთ კომფორტულ პოზაში'},
      {icon: 'weather-windy', label: 'შეკუმშვისას ნორმალურად ისუნთქეთ'},
      {icon: 'sleep', label: 'დაიცავით მოდუნების ფაზები'},
      {icon: 'chart-line', label: 'ეტაპობრივად გაზარდეთ სირთულე'},
      {icon: 'doctor', label: 'თუ დარწმუნებული არ ხართ, ჰკითხეთ რჩევა'},
    ],
    s5TipTitle: 'ყველაფერზე მეტად თანმიმდევრულობა',
    s5TipText:
      'ვარჯიშების თქვენი დღის უკვე არსებულ ჩვევასთან დაკავშირებამ შეიძლება თანმიმდევრულობის შენარჩუნება გაგიადვილოთ: კვების შემდეგ, კბილების გახეხვის შემდეგ ან სხვა დროს, რომელიც თქვენთვის მოსახერხებელია.',

    s6Heading: 'გავრცელებული შეცდომები, რომლებიც თავიდან უნდა ავიცილოთ',
    s6Body1:
      'პერინეუმის ვარჯიშები შეიძლება მარტივი ჩანდეს, მაგრამ ადვილია სხვა კუნთებით კომპენსაცია ან ზედმეტად ძლიერ დაძაბვა.',
    commonMistakes: [
      'დუნდულების ან თეძოების დაძაბვა მენჯის ფსკერის ნაცვლად',
      'სუნთქვის შეკავება შეკუმშვისას',
      'კუნთების მუდმივად შეკუმშულად დაჭერა მათი მოდუნების გარეშე',
      'ვარჯიშების მხოლოდ რამდენიმე დღით გაკეთება და შემდეგ შეწყვეტა',
      'შარდის ნაკადის განზრახ შეჩერება შეკუმშვის შესამოწმებლად',
    ],
    s6TipTitle: 'რა არ უნდა გააკეთოთ',
    s6TipText:
      'ვარჯიშების შარდის ნაკადის განზრახ შეჩერებით ვარჯიში რეკომენდებული არ არის. ეს მეთოდი პერინეუმს სწორად არ ავარჯიშებს და შარდის ბუშტის ნორმალური ფუნქცია შეიძლება დაარღვიოს.',

    s7Heading: 'რომელმა სიმპტომებმა უნდა გამოიწვიოს კონსულტაცია?',
    s7Body1:
      'მშობიარობის შემდეგ ზოგჯერ შეიძლება მცირე გაჟონვა ან უჩვეულო შეგრძნება გამოჩნდეს. თუმცა მათი უგულებელყოფა არ შეიძლება, თუ ისინი გრძელდება, უარესდება ან ყოველდღიურ ცხოვრებას ხელს უშლის.',
    warningSigns: [
      'შარდის გაჟონვა ხველებისას, ცემინებისას, სიცილისას ან დაძაბვისას',
      'სიმძიმის ან წნევის შეგრძნება მენჯის ქვედა ნაწილში',
      'შეგრძნება, რომ რაღაც ბურთულა ან რაღაც ვაგინაში ეშვება',
      'აირებისა და განავლის შეკავების სირთულე',
      'მუდმივი ტკივილი პერინეუმში',
      'ტკივილი სქესობრივი კავშირის დროს ან მის შემდეგ',
      'პერინეუმის კუნთების ამოცნობის ან სწორად შეკუმშვის სირთულე',
    ],
    consultLabel: 'როდის უნდა ითხოვოთ რჩევა?',
    s7Body2:
      'ბებიაქალს, ექიმს ან მენჯის ფსკერის რეაბილიტაციაში სპეციალიზებულ ფიზიოთერაპევტს შეუძლია კუნთების ფუნქციის შემოწმება და შესაფერისი პროგრამის შეთავაზება.',

    s8Heading: 'და გახევის, ეპიზიოტომიის ან საკეისრო კვეთის შემდეგ?',
    s8Body1:
      'გახევა ან ეპიზიოტომია შეხორცებისას განსაკუთრებულ მოვლას მოითხოვს. აქტივობების განახლებამ უნდა გაითვალისწინოს ტკივილი, ნაიარევის მდგომარეობა და მშობიარობის შემდეგ მიღებული მითითებები.',
    s8Body2:
      'საკეისრო კვეთის შემდეგ გამოჯანმრთელება ასევე მუცლის კედელსა და ნაიარევს მოიცავს. მაშინაც კი, თუ მშობიარობა ვაგინალური არ იყო, თავად ორსულობა მაინც ქმნიდა დატვირთვას მენჯის ფსკერზე.',
    s8HighlightTitle: 'პერსონალიზებულ მკურნალობას შეუძლია დახმარება',
    s8HighlightText:
      'მნიშვნელოვანი გახევის, ტკივილის, შარდის ან ნაწლავის სიმპტომების ან გაგრძელებული სირთულეების შემთხვევაში ჯანდაცვის სპეციალისტთან შეფასება განსაკუთრებით სასარგებლო შეიძლება იყოს.',

    s9Heading: 'სპორტის ეტაპობრივი განახლება',
    s9Body1:
      'მშობიარობის შემდეგ მოძრაობის განახლება ეტაპობრივი უნდა იყოს. სიარული და რბილი მოძრაობები, როგორც წესი, თვითგრძნობის მიხედვით შეიძლება განახლდეს, მაღალი დარტყმის აქტივობები კი მეტ სიფრთხილეს მოითხოვს.',
    s9Body2:
      'სირბილის, ხტუნვის ან ძალიან ინტენსიური ვარჯიშის განახლებამდე უმჯობესია მენჯის ფსკერის გამოჯანმრთელების შეფასება და ნებისმიერი სიმპტომის გათვალისწინება.',
    s9AlertTitle: 'ნუ აჩქარებთ ეტაპებს',
    s9AlertText:
      'გაჟონვა, სიმძიმის შეგრძნება ან ტკივილი ვარჯიშის დროს ან მის შემდეგ იმის ნიშნებია, რომ ტემპი უნდა შეანელოთ და ინტენსივობის გაზრდამდე რჩევა ითხოვოთ.',

    s10Heading: 'როდის მივმართოთ სპეციალისტს?',
    s10Body1:
      'მენჯის ფსკერის რეაბილიტაცია ბებიაქალთან ან ფიზიოთერაპევტთან სასარგებლო შეიძლება იყოს, თუ არ ხართ დარწმუნებული, რომ სწორად იკუმშებით, თუ თქვენი სიმპტომები რჩება, ან თუ გარკვეული ფიზიკური აქტივობების თავდაჯერებით განახლება გსურთ.',
    questionCardTitle: 'სასარგებლო კითხვები დასასმელად',
    appointmentQuestions: [
      'ჩემი სიმპტომები მენჯის ფსკერის სისუსტეს შეესაბამება?',
      'სწორად ვასრულებ შეკუმშვებს?',
      'რამდენი გამეორება უნდა გავაკეთო ყოველდღე?',
      'შემიძლია სირბილის, სპორტის ან მაღალი დარტყმის ვარჯიშის განახლება?',
      'მჭირდება რეაბილიტაცია ბებიაქალთან ან ფიზიოთერაპევტთან?',
      'მოითხოვს ჩემი ნაიარევი, გახევა ან საკეისრო კვეთა რაიმე განსაკუთრებულ სიფრთხილეს?',
    ],
    s10TipTitle: 'კარგია ვიცოდეთ',
    s10TipText:
      'სპეციალისტთან მისვლა აუცილებლად არ ნიშნავს, რომ რაღაც არასწორია. სესიას უბრალოდ შეუძლია თქვენი ტექნიკის შემოწმება, გამოჯანმრთელების შეფასება და სწორად წინსვლის სწავლა.',

    s11Heading: 'გამოჯანმრთელება, რომელსაც დრო სჭირდება',
    s11Body1:
      'მშობიარობის შემდეგ ნორმალურია, რომ დაუყოვნებლივ არ დაუბრუნდეთ იმავე შეგრძნებებსა და კუნთების ძალას, რაც ორსულობამდე გქონდათ.',
    s11Body2:
      'მიზანი რაც შეიძლება მეტი შეკუმშვის გაკეთება არ არის. ის უფრო შეკუმშვასა და მოდუნებას შორის კარგი კოორდინაციის ეტაპობრივ დაბრუნებას ეხება და შემდეგ ამ კუნთების ბუნებრივად გამოყენების უნარს ყოველდღიურ საქმიანობაში.',
    s11HighlightTitle: 'პატარა პროგრესი რეალური პროგრესია',
    s11HighlightText:
      'მოძრაობის უკეთესი გაცნობიერება, შეკუმშვის რამდენიმე დამატებითი წამი ან გაჟონვის შემცირება უკვე წამახალისებელი ნიშნებია.',

    s12Heading: 'მთავარი დასკვნები',
    summaryTitle: 'მთავარი',
    summaryItems: [
      'ორსულობა და მშობიარობა მენჯის ფსკერზე მნიშვნელოვან დატვირთვას ქმნის.',
      'მშობიარობის შემდეგ ეტაპობრივი გამოჯანმრთელება ნორმალურია.',
      'ვარჯიშებმა უპირატესობა მოძრაობის ხარისხს უნდა მიანიჭოს და არა ძალას.',
      'სუნთქვა და მოდუნება ისეთივე მნიშვნელოვანია, როგორც შეკუმშვა.',
      'შარდის გაჟონვა, სიმძიმე ან გაგრძელებული ტკივილი პროფესიულ აზრს იმსახურებს.',
      'რეაბილიტაციას ბებიაქალთან ან ფიზიოთერაპევტთან შეუძლია უკეთესი კონტროლის დაბრუნებაში დაგეხმაროთ.',
      'სპორტზე დაბრუნება ეტაპობრივი უნდა იყოს, განსაკუთრებით მაღალი დარტყმის აქტივობებისთვის.',
    ],

    finalTipTitle: 'მიეცით თავს გამოჯანმრთელების დრო',
    finalTipText:
      'მშობიარობის შემდეგ თქვენი სხეული ბევრ ცვლილებას გაუძლო. პერინეუმი იმავე ყურადღებას იმსახურებს, რასაც თქვენი სხეულის დანარჩენი ნაწილი: ეტაპობრივად, რეგულარულად და ზეწოლის გარეშე.',

    disclaimerText:
      'ეს სტატია მხოლოდ საინფორმაციოა და პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. თუ ტკივილი, გაგრძელებული სიმპტომები გაქვთ ან თქვენი გამოჯანმრთელებასთან დაკავშირებით რაიმე შეშფოთება გაქვთ, მიმართეთ ჯანდაცვის სპეციალისტს.',
  },
  hy: {
    badge: 'ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ • ՎԵՐԱԿԱՆԳՆՈՒՄ',
    title: 'Կոնքի հատակի ամրացում\nծննդաբերությունից հետո',
    metaDuration: '8 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Հղիությունից և ծննդաբերությունից հետո կոնքի հատակը ժամանակի կարիք ունի վերականգնվելու համար: Պարզ, կանոնավոր և աստիճանական վարժությունները կարող են օգնել վերականգնել ուժը, վերահսկողությունը և վստահությունը՝ առանց շտապելու փորձի:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հասկանալ պերինեումի դերը',
      'Ինչու է ծննդաբերությունը այն լարում',
      'Երբ սկսել կոնքի հատակի վերականգնումը',
      'Սովորել ճիշտ կծկվել',
      'Աստիճանական ռեժիմի կառուցում',
      'Սխալներ, որոնցից պետք է խուսափել',
      'Երբ օգնություն խնդրել',
      'Սպորտի աստիճանական վերսկսում',
      'Նախապատրաստվել այցին',
      'Հիմնական եզրակացություններ',
    ],
    shareMessage: 'Կոնքի հատակի ամրացում ծննդաբերությունից հետո — AWA',

    s1Heading: 'Հասկանալ պերինեումի դերը',
    s1Body1:
      'Պերինեումը, որը կոչվում է նաև կոնքի հատակ, մկանների խումբ է, որը գտնվում է կոնքի հիմքում: Այն դեր է խաղում միզապարկի և աղիքների վերահսկման մեջ և օգնում է պահել կոնքի օրգանները:',
    s1Body2:
      'Հղիության ընթացքում այս մկանները պետք է մի քանի ամիս կրեն լրացուցիչ քաշ: Դրանք նաև զգալի լարվածության են ենթարկվում ծննդաբերության ժամանակ:',
    s1HighlightTitle: 'Աննկատ, բայց էական մկան',
    s1HighlightText:
      'Կոնքի հատակը ներգրավված է մի քանի առօրյա գործառույթների մեջ. մեզը և կղանքը պահելը, գազերի վերահսկումը, կոնքի օրգանների պահպանումը և որոշ սեռական գործառույթներում դեր խաղալը:',

    benefitsHeading: 'Կոնքի ավելի ուժեղ հատակի օգուտները',
    benefitsIntro:
      'Աստիճանական, ճիշտ կատարվող ամրացումը կարող է օգնել բարելավել կոնքի հատակի վերահսկումը և պահպանումը:',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Միզապարկի ավելի լավ վերահսկում',
        text: 'Կոնքի հատակը դեր է խաղում միզապարկի վերահսկման մեջ: Այն աստիճանաբար ամրացնելը կարող է օգնել նվազեցնել մեզի որոշ արտահոսքեր:',
      },
      {
        icon: 'toilet',
        title: 'Աղիքների գործառույթի աջակցություն',
        text: 'Այս մկանները նաև օգնում են վերահսկել գազերը և կղանքը և նպաստում են կոնքի օրգանների պահպանմանը:',
      },
      {
        icon: 'human-female',
        title: 'Կոնքի օրգանների պահպանում',
        text: 'Կոնքի հատակը կազմում է իսկական մկանային հիմք, որը օգնում է պահել միզապարկը, արգանդը և աղիքը:',
      },
      {
        icon: 'heart-pulse',
        title: 'Զգացողության աստիճանական վերականգնում',
        text: 'Համապատասխան վերականգնումը կարող է նաև օգնել վերագտնել այս շրջանի ավելի լավ գիտակցությունն ու վերահսկումը:',
      },
    ],

    s2Heading: 'Ինչու են հղիությունն ու ծննդաբերությունը այն լարում',
    s2Body1:
      'Հղիությունը աստիճանաբար ավելի շատ ճնշում է գործադրում կոնքի հատակի վրա: Հեշտոցային ծննդաբերությունը կարող է այնուհետև զգալիորեն ձգել այս հատվածի մկաններն ու հյուսվածքները:',
    s2Body2:
      'Կեսարյան հատումը նույնպես լիովին չի խնայում կոնքի հատակը. հղիությունն ինքնին այս մկանների համար նշանակալի շրջան է մնում:',
    s2Body3:
      'Ծննդաբերությունից հետո, հետևաբար, նորմալ է, որ վերականգնումը ժամանակ է պահանջում: Որոշ կանայք գրեթե ոչ մի ախտանիշ չեն զգում, մյուսները կարող են նկատել արտահոսքեր, ծանրության զգացում կամ մկանների նվազած վերահսկում:',
    s2TipTitle: 'Յուրաքանչյուր վերականգնում տարբեր է',
    s2TipText:
      'Ծննդաբերության տեսակը, պատռվածքը կամ էպիզիոտոմիան, ցավի առկայությունը և ծննդաբերությունից հետո ձեր ընդհանուր վիճակը կարող են ազդել վերականգնման վրա:',

    s3Heading: 'Ե՞րբ սկսել կոնքի հատակի վերականգնումը',
    s3Body1:
      'Բարդություններ չունեցող ծննդաբերությունից հետո կոնքի հատակի մեղմ կծկումները սովորաբար կարելի է աստիճանաբար վերսկսել: Կարևոր է մնում վարժությունները հարմարեցնել ձեր իրավիճակին և խորհուրդ հարցնել, եթե բարդություն, զգալի ցավ կամ որևէ հատուկ միջամտություն եք ունեցել:',
    s3Body2:
      'Եթե ունեք միզային կաթետեր, որոշ խորհուրդներ առաջարկում են սպասել մինչև այն հեռացվի և նորմալ միզարձակումը վերսկսվի՝ պերինեումի վարժություններ սկսելուց առաջ:',
    s3AlertTitle: 'Ցավը ուժով մի հաղթահարեք',
    s3AlertText:
      'Զգալի ցավը, վատացող ախտանիշները, վատ ապաքինվող վերքը կամ որևէ հատուկ անհանգստություն պահանջում են մանկաբարձուհու, բժշկի կամ վերականգնողական մասնագետի խորհուրդ:',

    s4Heading: 'Սովորել ճիշտ կծկվել',
    s4Body1:
      'Շարժումը ճանաչելու համար պատկերացրեք, թե փորձում եք միաժամանակ պահել գազերը և միզելու ցանկությունը: Այն շարժումը, որ փնտրում եք, կծկման և ներս բարձրացման զգացում է:',
    s4Body2:
      'Նպատակը ամբողջ մարմինը ուժեղ լարելը չէ: Ձեր հետույքը, ազդրերը և որովայնի մկանները պետք է մնան հնարավորինս թուլացած, մինչ շնչառությունը շարունակվում է նորմալ:',
    exercises: [
      {icon: 'weather-windy', label: 'Շնչառություն'},
      {icon: 'human-handsup', label: 'Մեղմ կծկում'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Երկար կծկում'},
      {icon: 'gesture-tap-button', label: 'Արագ կծկումներ'},
    ],
    s4HighlightTitle: 'Թուլանալը նույնքան կարևոր է',
    s4HighlightText:
      'Յուրաքանչյուր կծկումից հետո թող մկանները լիովին թուլանան: Լավ վերականգնումը չի նշանակում պերինեումը ամբողջ օրը կծկված պահել:',

    s5Heading: 'Աստիճանական ռեժիմի կառուցում',
    s5Body1:
      'Սկզբում ամենակարևորը մկանները ճանաչել սովորելն է և շարժումը ճիշտ կատարելը: Հետևողականությունը ավելի կարևոր է, քան ինտենսիվությունը:',
    s5h3a: 'Երկար կծկումներ',
    s5Body2:
      'Մեղմորեն կծկեք կոնքի հատակը, ապա պահեք կծկումը մի քանի վայրկյան՝ առանց շունչ պահելու: Այնուհետև լիովին թուլացեք, նախքան նորից սկսելը:',
    s5h3b: 'Կարճ կծկումներ',
    s5Body3:
      'Երբ շարժումը յուրացված է, կարելի է ավելացնել փոքր արագ կծկումներ: Դրանք օգնում են վարժեցնել մկանները արագ կծկելու կարողությունը, երբ որովայնի ճնշումն ավելանում է, օրինակ՝ հազալուց կամ փռշտալուց անմիջապես առաջ:',
    dailyTips: [
      {icon: 'clock-outline', label: 'Վարժությունները կապեք ամենօրյա սովորության հետ'},
      {icon: 'human-sitting', label: 'Սկսեք հարմար դիրքից'},
      {icon: 'weather-windy', label: 'Կծկումների ժամանակ շնչեք նորմալ'},
      {icon: 'sleep', label: 'Հարգեք թուլացման փուլերը'},
      {icon: 'chart-line', label: 'Աստիճանաբար ավելացրեք դժվարությունը'},
      {icon: 'doctor', label: 'Խորհուրդ հարցրեք, եթե վստահ չեք'},
    ],
    s5TipTitle: 'Առաջին հերթին՝ հետևողականություն',
    s5TipText:
      'Վարժությունները արդեն ձեր օրվա մաս հանդիսացող սովորության հետ կապելը կարող է հեշտացնել հետևողական մնալը. կերակրումից հետո, ատամները լվանալուց հետո կամ ձեզ հարմար այլ ժամանակ:',

    s6Heading: 'Տարածված սխալներ, որոնցից պետք է խուսափել',
    s6Body1:
      'Պերինեումի վարժությունները կարող են պարզ թվալ, սակայն հեշտ է փոխհատուցել այլ մկաններով կամ չափազանց ուժեղ ճնշել:',
    commonMistakes: [
      'Կոնքի հատակի փոխարեն հետույքը կամ ազդրերը լարելը',
      'Կծկման ժամանակ շունչը պահելը',
      'Մկանները անընդհատ կծկված պահելը՝ առանց թուլանալու թույլ տալու',
      'Վարժություններ անելը միայն մի քանի օր, ապա դադարեցնելը',
      'Մեզի հոսքը միտումնավոր կանգնեցնելը՝ կծկումը ստուգելու համար',
    ],
    s6TipTitle: 'Ինչ չանել',
    s6TipText:
      'Խորհուրդ չի տրվում վարժությունները կատարել մեզի հոսքը միտումնավոր կանգնեցնելով: Այս մեթոդը պերինեումը ճիշտ չի վարժեցնում և կարող է խաթարել միզապարկի նորմալ գործառույթը:',

    s7Heading: 'Ի՞նչ ախտանիշներ պետք է հանգեցնեն խորհրդատվության',
    s7Body1:
      'Ծննդաբերությունից հետո երբեմն կարող են հայտնվել աննշան արտահոսքեր կամ անսովոր զգացողություն: Այդուհանդերձ, դրանք չպետք է անտեսվեն, եթե շարունակվում են, վատանում են կամ խանգարում են ձեր առօրյային:',
    warningSigns: [
      'Մեզի արտահոսքեր հազալիս, փռշտալիս, ծիծաղելիս կամ լարվելիս',
      'Ծանրության կամ ճնշման զգացում կոնքի ստորին հատվածում',
      'Զգացում, որ գունդ կամ ինչ-որ բան իջնում է հեշտոց',
      'Գազերը կամ կղանքը պահելու դժվարություն',
      'Շարունակական ցավ պերինեումում',
      'Ցավ սեռական հարաբերության ժամանակ կամ դրանից հետո',
      'Պերինեումի մկանները ճանաչելու կամ ճիշտ կծկելու դժվարություն',
    ],
    consultLabel: 'Ե՞րբ խորհուրդ հարցնել',
    s7Body2:
      'Մանկաբարձուհին, բժիշկը կամ կոնքի հատակի վերականգնման մասնագետ ֆիզիոթերապևտը կարող է ստուգել մկանների գործառույթը և առաջարկել համապատասխան ծրագիր:',

    s8Heading: 'Իսկ պատռվածքից, էպիզիոտոմիայից կամ կեսարյան հատումից հետո',
    s8Body1:
      'Պատռվածքը կամ էպիզիոտոմիան պահանջում են առանձնահատուկ խնամք ապաքինման ընթացքում: Գործունեության վերսկսումը պետք է հաշվի առնի ցավը, սպիի վիճակը և ծննդաբերությունից հետո տրված ուղեցույցը:',
    s8Body2:
      'Կեսարյան հատումից հետո վերականգնումը ներառում է նաև որովայնի պատը և սպին: Նույնիսկ եթե ծննդաբերությունը հեշտոցային չի եղել, հղիությունն ինքնին դեռ լարում է առաջացրել կոնքի հատակի վրա:',
    s8HighlightTitle: 'Անհատականացված խնամքը կարող է օգնել',
    s8HighlightText:
      'Զգալի պատռվածքի, ցավի, միզային կամ աղիքային ախտանիշների կամ շարունակական դժվարությունների դեպքում առողջապահության մասնագետի գնահատումը կարող է հատկապես օգտակար լինել:',

    s9Heading: 'Սպորտի աստիճանական վերսկսում',
    s9Body1:
      'Ծննդաբերությունից հետո շարժման վերսկսումը պետք է լինի աստիճանական: Քայլքը և մեղմ շարժումները սովորաբար կարելի է վերսկսել ըստ ինքնազգացողության, մինչդեռ բարձր հարվածային ակտիվությունները պահանջում են ավելի շատ զգուշություն:',
    s9Body2:
      'Վազքը, ցատկերը կամ շատ ինտենսիվ մարզումները վերսկսելուց առաջ ավելի լավ է գնահատել կոնքի հատակի վերականգնումը և հաշվի առնել ցանկացած ախտանիշ:',
    s9AlertTitle: 'Մի շտապեք փուլերը',
    s9AlertText:
      'Արտահոսքերը, ծանրության զգացումը կամ ցավը վարժության ժամանակ կամ դրանից հետո նշաններ են, որ պետք է դանդաղեցնել և խորհուրդ հարցնել՝ նախքան ինտենսիվությունը մեծացնելը:',

    s10Heading: 'Ե՞րբ դիմել մասնագետի',
    s10Body1:
      'Կոնքի հատակի վերականգնումը մանկաբարձուհու կամ ֆիզիոթերապևտի հետ կարող է օգտակար լինել, եթե վստահ չեք՝ ճիշտ եք կծկվում, եթե ձեր ախտանիշները շարունակվում են կամ եթե ցանկանում եք վստահությամբ վերսկսել որոշ ֆիզիկական ակտիվություններ:',
    questionCardTitle: 'Օգտակար հարցեր',
    appointmentQuestions: [
      'Իմ ախտանիշները համահունչ ե՞ն կոնքի հատակի թուլության հետ:',
      'Կծկումները ճի՞շտ եմ կատարում:',
      'Օրական քանի՞ կրկնություն պետք է անեմ:',
      'Կարո՞ղ եմ վերադառնալ վազքին, սպորտին կամ բարձր հարվածային վարժություններին:',
      'Ինձ վերականգնում մանկաբարձուհու կամ ֆիզիոթերապևտի հետ պե՞տք է:',
      'Իմ սպին, պատռվածքը կամ կեսարյան հատումը որևէ հատուկ զգուշություն պահանջո՞ւմ է:',
    ],
    s10TipTitle: 'Լավ է իմանալ',
    s10TipText:
      'Մասնագետի մոտ գնալը պարտադիր չէ նշանակի, որ ինչ-որ բան այն չէ: Սեանսը կարող է պարզապես օգնել ստուգել ձեր տեխնիկան, գնահատել ձեր վերականգնումը և սովորել ճիշտ առաջընթաց ունենալ:',

    s11Heading: 'Վերականգնում, որը ժամանակ է պահանջում',
    s11Body1:
      'Ծննդաբերությունից հետո նորմալ է անմիջապես չվերագտնել այն նույն զգացողությունները կամ մկանային ուժը, որ ունեիք հղիությունից առաջ:',
    s11Body2:
      'Նպատակը հնարավորինս շատ կծկումներ անելը չէ: Ավելի շուտ դա կծկման և թուլացման միջև լավ համակարգումը աստիճանաբար վերագտնելն է, ապա այս մկանները առօրյա գործունեության մեջ բնականորեն օգտագործել կարողանալը:',
    s11HighlightTitle: 'Փոքր առաջընթացը իրական առաջընթաց է',
    s11HighlightText:
      'Շարժման ավելի լավ գիտակցումը, կծկման մի քանի լրացուցիչ վայրկյանը կամ արտահոսքերի նվազումը արդեն խրախուսող նշաններ են:',

    s12Heading: 'Հիմնական եզրակացություններ',
    summaryTitle: 'Էականը',
    summaryItems: [
      'Հղիությունն ու ծննդաբերությունը զգալի լարում են առաջացնում կոնքի հատակի վրա:',
      'Ծննդաբերությունից հետո աստիճանական վերականգնումը նորմալ է:',
      'Վարժություններում նախապատվությունը պետք է տրվի շարժման որակին, այլ ոչ թե ուժին:',
      'Շնչառությունն ու թուլացումը նույնքան կարևոր են, որքան կծկումը:',
      'Մեզի արտահոսքերը, ծանրությունը կամ շարունակական ցավը արժանի են մասնագիտական կարծիքի:',
      'Մանկաբարձուհու կամ ֆիզիոթերապևտի հետ վերականգնումը կարող է օգնել վերագտնել ավելի լավ վերահսկողություն:',
      'Սպորտին վերադարձը պետք է լինի աստիճանական, հատկապես բարձր հարվածային ակտիվությունների համար:',
    ],

    finalTipTitle: 'Ժամանակ տվեք վերականգնվելու համար',
    finalTipText:
      'Ծննդաբերությունից հետո ձեր մարմինը անցել է բազմաթիվ փոփոխությունների միջով: Պերինեումը արժանի է նույն ուշադրությանը, ինչ ձեր մարմնի մնացած մասը. աստիճանաբար, կանոնավոր և առանց ճնշման:',

    disclaimerText:
      'Այս հոդվածը միայն տեղեկատվական նպատակով է և չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Եթե ցավ, շարունակական ախտանիշներ կամ ձեր վերականգնման վերաբերյալ որևէ անհանգստություն ունեք, խորհուրդ հարցրեք առողջապահության մասնագետից:',
  },
  tg: {
    badge: 'ДАВРАИ БАЪДИЗОӢ • БАРҚАРОРШАВӢ',
    title: 'Тақвияти мушакҳои қаъри косаи хурд\nпас аз таваллуд',
    metaDuration: '8 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Пас аз ҳомиладорӣ ва таваллуд қаъри косаи хурд барои барқароршавӣ вақт мехоҳад. Машқҳои оддӣ, мунтазам ва тадриҷӣ метавонанд ба шумо кумак кунанд қувват, назорат ва эътимодро бозёбед, бидуни кӯшиши шитобондани корҳо.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаҳмидани нақши перинеум',
      'Чаро таваллуд ба он фишор меорад',
      'Барқарорсозии қаъри косаи хурдро кай оғоз кардан лозим аст',
      'Омӯхтани дуруст кашиш додан',
      'Сохтани тартиби тадриҷӣ',
      'Хатоҳое, ки бояд пешгирӣ кард',
      'Кай кумак пурсидан лозим аст',
      'Тадриҷан аз сар гирифтани варзиш',
      'Омодагӣ ба қабул',
      'Хулосаҳои асосӣ',
    ],
    shareMessage: 'Тақвияти мушакҳои қаъри косаи хурд пас аз таваллуд — AWA',

    s1Heading: 'Фаҳмидани нақши перинеум',
    s1Body1:
      'Перинеум, ки қаъри косаи хурд низ номида мешавад, гурӯҳи мушакҳоест, ки дар асоси коса ҷойгиранд. Он дар назорати масона ва рӯда нақш мебозад ва ба дастгирии узвҳои коса кумак мекунад.',
    s1Body2:
      'Ҳангоми ҳомиладорӣ ин мушакҳо бояд якчанд моҳ вазни иловагиро бардоранд. Онҳо инчунин ҳангоми таваллуд зери фишори зиёд қарор мегиранд.',
    s1HighlightTitle: 'Мушаки номаълум, вале муҳим',
    s1HighlightText:
      'Қаъри косаи хурд дар якчанд вазифаи ҳаррӯза иштирок мекунад: нигоҳ доштани пешоб ва наҷосат, назорати гази рӯда, дастгирии узвҳои коса ва нақш дар баъзе вазифаҳои ҷинсӣ.',

    benefitsHeading: 'Манфиатҳои қаъри косаи хурди қавитар',
    benefitsIntro:
      'Тақвияти тадриҷӣ ва дуруст иҷрошуда метавонад ба беҳтар кардани назорат ва дастгирии қаъри косаи хурд кумак кунад.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Назорати беҳтари масона',
        text: 'Қаъри косаи хурд дар назорати масона нақш дорад. Тадриҷан тақвият додани он метавонад ба кам кардани баъзе рехтани пешоб кумак кунад.',
      },
      {
        icon: 'toilet',
        title: 'Дастгирии фаъолияти рӯда',
        text: 'Ин мушакҳо инчунин ба назорати гази рӯда ва наҷосат кумак мекунанд ва ба дастгирии узвҳои коса мусоидат менамоянд.',
      },
      {
        icon: 'human-female',
        title: 'Дастгирии узвҳои коса',
        text: 'Қаъри косаи хурд асоси воқеии мушакӣ ташкил медиҳад, ки ба дастгирии масона, бачадон ва рӯда кумак мекунад.',
      },
      {
        icon: 'heart-pulse',
        title: 'Тадриҷан бозгашти эҳсос',
        text: 'Барқарорсозии мувофиқ инчунин метавонад ба шумо кумак кунад огоҳӣ ва назорати беҳтари ин минтақаро бозёбед.',
      },
    ],

    s2Heading: 'Чаро ҳомиладорӣ ва таваллуд ба он фишор меоранд',
    s2Body1:
      'Ҳомиладорӣ тадриҷан фишори бештарро ба қаъри косаи хурд меоварад. Таваллуди табиӣ сипас метавонад мушакҳо ва бофтаҳои ин минтақаро ба таври назаррас кашад.',
    s2Body2:
      'Ҷарроҳии кесарӣ низ қаъри косаи хурдро комилан эмин намедорад: худи ҳомиладорӣ барои ин мушакҳо давраи назаррас боқӣ мемонад.',
    s2Body3:
      'Пас аз таваллуд аз ин рӯ муқаррарӣ аст, ки барқароршавӣ вақт мегирад. Баъзе занон қариб ягон нишонаро эҳсос намекунанд, дигарон метавонанд рехтан, эҳсоси вазнинӣ ё кам шудани назорати мушакро мушоҳида кунанд.',
    s2TipTitle: 'Ҳар барқароршавӣ гуногун аст',
    s2TipText:
      'Навъи таваллуд, дарридагӣ ё эпизиотомия, мавҷудияти дард ва ҳолати умумии шумо пас аз таваллуд ҳама метавонанд ба барқароршавӣ таъсир расонанд.',

    s3Heading: 'Барқарорсозии қаъри косаи хурдро кай оғоз кардан лозим аст?',
    s3Body1:
      'Пас аз таваллуди бе мушкил кашиши нарми қаъри косаи хурд одатан метавонад тадриҷан аз сар гирифта шавад. Муҳим боқӣ мемонад, ки машқҳоро ба вазъияти худ мутобиқ кунед ва агар мушкил, дарди назаррас ё амали махсусро аз сар гузаронида бошед, маслиҳат пурсед.',
    s3Body2:
      'Агар катетери пешоб дошта бошед, баъзе тавсияҳо пешниҳод мекунанд, ки пеш аз оғози машқҳои перинеум интизор шавед, то он хориҷ шавад ва пешобкунии муқаррарӣ аз сар гирифта шавад.',
    s3AlertTitle: 'Бо дард кор накунед',
    s3AlertText:
      'Дарди назаррас, бадтар шудани нишонаҳо, ҷароҳате, ки бад шифо меёбад, ё ҳар нигаронии махсус маслиҳати доя, табиб ё мутахассиси барқарорсозиро талаб мекунад.',

    s4Heading: 'Омӯхтани дуруст кашиш додан',
    s4Body1:
      'Барои муайян кардани ҳаракат тасаввур кунед, ки кӯшиш мекунед гази рӯда ва хоҳиши пешобкуниро ҳамзамон нигоҳ доред. Ҳаракате, ки меҷӯед, эҳсоси кашиш ва боло рафтан ба дарун аст.',
    s4Body2:
      'Мақсад ин нест, ки тамоми баданро сахт қулфӣ кунед. Думба, рон ва мушакҳои шикам бояд то ҳадди имкон ором бимонанд, дар ҳоле ки нафаскашӣ муқаррарӣ идома меёбад.',
    exercises: [
      {icon: 'weather-windy', label: 'Нафаскашӣ'},
      {icon: 'human-handsup', label: 'Кашиши нарм'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Кашиши дароз'},
      {icon: 'gesture-tap-button', label: 'Кашишҳои зуд'},
    ],
    s4HighlightTitle: 'Ором шудан ба қадри кашиш муҳим аст',
    s4HighlightText:
      'Пас аз ҳар кашиш мушакҳоро комилан ором кунед. Барқарорсозии хуб маънои тамоми рӯз кашида нигоҳ доштани перинеумро надорад.',

    s5Heading: 'Сохтани тартиби тадриҷӣ',
    s5Body1:
      'Дар аввал муҳимтарин чиз омӯхтани муайян кардани мушакҳо ва дуруст иҷро кардани ҳаракат аст. Мунтазамӣ аз шиддат муҳимтар аст.',
    s5h3a: 'Кашишҳои дароз',
    s5Body2:
      'Қаъри косаи хурдро нарм кашед, сипас кашишро чанд сония нигоҳ доред, бидуни нигоҳ доштани нафас. Сипас пеш аз аз нав оғоз кардан комилан озод кунед.',
    s5h3b: 'Кашишҳои кӯтоҳ',
    s5Body3:
      'Вақте ки ҳаракат азхуд шуд, кашишҳои зуди хурд илова карда метавонанд. Онҳо қобилияти зуд кашидани мушакҳоро ҳангоми афзоиши фишори шикам, масалан, дарҳол пеш аз сулфа ё атса, машқ медиҳанд.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Машқҳоро бо одати ҳаррӯза пайваст кунед'},
      {icon: 'human-sitting', label: 'Аз вазъияти роҳат оғоз кунед'},
      {icon: 'weather-windy', label: 'Ҳангоми кашиш муқаррарӣ нафас кашед'},
      {icon: 'sleep', label: 'Марҳилаҳои ором шуданро эҳтиром кунед'},
      {icon: 'chart-line', label: 'Тадриҷан мушкилиро зиёд кунед'},
      {icon: 'doctor', label: 'Агар мутмаин набошед, маслиҳат пурсед'},
    ],
    s5TipTitle: 'Пеш аз ҳама мунтазамӣ',
    s5TipText:
      'Пайваст кардани машқҳо бо одате, ки аллакай қисми рӯзи шумост, метавонад мунтазам мондани шуморо осонтар кунад: пас аз ширдиҳӣ, пас аз тоза кардани дандонҳо ё дар вақти дигаре, ки ба шумо мувофиқ аст.',

    s6Heading: 'Хатоҳои маъмуле, ки бояд пешгирӣ кард',
    s6Body1:
      'Машқҳои перинеум метавонанд оддӣ ба назар расанд, вале ҷуброн кардан бо мушакҳои дигар ё хеле сахт фишор овардан осон аст.',
    commonMistakes: [
      'Сахт кардани думба ё рон ба ҷои қаъри косаи хурд',
      'Нигоҳ доштани нафас ҳангоми кашиш',
      'Пайваста кашида нигоҳ доштани мушакҳо бидуни ором шуданашон',
      'Танҳо чанд рӯз машқ кардан ва сипас қатъ кардан',
      'Ба таври қасдӣ қатъ кардани ҷараёни пешоб барои санҷидани кашиш',
    ],
    s6TipTitle: 'Чӣ карданӣ нест',
    s6TipText:
      'Тавсия дода намешавад, ки машқҳоро бо қатъи қасдии ҷараёни пешоб иҷро кунед. Ин усул перинеумро дуруст машқ намедиҳад ва метавонад фаъолияти муқаррарии масонаро вайрон кунад.',

    s7Heading: 'Кадом нишонаҳо бояд боиси машварат шаванд?',
    s7Body1:
      'Рехтани андаки пешоб ё эҳсоси ғайриоддӣ баъзан метавонад пас аз таваллуд пайдо шавад. Бо вуҷуди ин, онҳоро набояд нодида гирифт, агар идома ёбанд, бадтар шаванд ё ба ҳаёти ҳаррӯзаи шумо халал расонанд.',
    warningSigns: [
      'Рехтани пешоб ҳангоми сулфа, атса, хандидан ё кӯшиш',
      'Эҳсоси вазнинӣ ё фишор дар поёни коса',
      'Эҳсосе, ки гирае ё чизе ба маҳбал фуромада истодааст',
      'Душворӣ дар нигоҳ доштани гази рӯда ё наҷосат',
      'Дарди доимӣ дар перинеум',
      'Дард ҳангоми наздикии ҷинсӣ ё пас аз он',
      'Душворӣ дар муайян ё дуруст кашидани мушакҳои перинеум',
    ],
    consultLabel: 'Кай маслиҳат пурсидан лозим аст?',
    s7Body2:
      'Доя, табиб ё физиотерапевт, ки дар барқарорсозии қаъри косаи хурд тахассус дорад, метавонад фаъолияти мушакро санҷад ва барномаи мувофиқро пешниҳод кунад.',

    s8Heading: 'Ва пас аз дарридагӣ, эпизиотомия ё кесарӣ?',
    s8Body1:
      'Дарридагӣ ё эпизиотомия ҳангоми шифо ёфтан нигоҳубини махсусро талаб мекунад. Аз сар гирифтани фаъолият бояд дард, ҳолати чандро ва роҳнамоии пас аз таваллуд додашударо ба назар гирад.',
    s8Body2:
      'Пас аз кесарӣ барқароршавӣ инчунин деворҳои шикам ва чандро дар бар мегирад. Ҳатто агар таваллуд табиӣ набошад ҳам, худи ҳомиладорӣ ба қаъри косаи хурд фишор овард.',
    s8HighlightTitle: 'Нигоҳубини шахсӣ метавонад кумак кунад',
    s8HighlightText:
      'Дар ҳолати дарридагии назаррас, дард, нишонаҳои пешоб ё рӯда ё душвориҳои доимӣ арзёбӣ бо мутахассиси соҳаи тиб метавонад махсусан муфид бошад.',

    s9Heading: 'Тадриҷан аз сар гирифтани варзиш',
    s9Body1:
      'Аз сар гирифтани ҳаракат пас аз таваллуд бояд тадриҷӣ бошад. Пиёдагардӣ ва ҳаракатҳои нарм одатан метавонанд мувофиқи эҳсоси шумо аз сар гирифта шаванд, дар ҳоле ки фаъолиятҳои бо зарбаи баланд эҳтиёти бештарро талаб мекунанд.',
    s9Body2:
      'Пеш аз аз сар гирифтани давидан, ҷаҳидан ё машқҳои хеле шадид беҳтар аст барқароршавии қаъри косаи хурдро арзёбӣ кунед ва ҳар нишонаро ба назар гиред.',
    s9AlertTitle: 'Марҳилаҳоро шитоб накунед',
    s9AlertText:
      'Рехтан, эҳсоси вазнинӣ ё дард ҳангоми машқ ё пас аз он нишонаҳое мебошанд, ки бояд суръатро суст кунед ва пеш аз зиёд кардани шиддат маслиҳат пурсед.',

    s10Heading: 'Кай ба мутахассис муроҷиат кардан лозим аст?',
    s10Body1:
      'Барқарорсозии қаъри косаи хурд бо доя ё физиотерапевт метавонад муфид бошад, агар мутмаин набошед, ки дуруст мекашед, агар нишонаҳои шумо идома ёбанд ё агар мехоҳед бо боварӣ баъзе фаъолиятҳои ҷисмониро аз сар гиред.',
    questionCardTitle: 'Саволҳои муфид барои пурсидан',
    appointmentQuestions: [
      'Оё нишонаҳои ман бо заъфи қаъри косаи хурд мувофиқанд?',
      'Оё ман кашишҳоро дуруст иҷро мекунам?',
      'Ҳар рӯз чанд такрор бояд иҷро кунам?',
      'Оё ман метавонам ба давидан, варзиш ё машқи бо зарбаи баланд баргардам?',
      'Оё ба барқарорсозӣ бо доя ё физиотерапевт ниёз дорам?',
      'Оё чандҳо, дарридагӣ ё кесарии ман эҳтиёти махсусро талаб мекунад?',
    ],
    s10TipTitle: 'Донистан хуб аст',
    s10TipText:
      'Муроҷиат ба мутахассис ҳатман маънои нодурустии чизеро надорад. Як машғулият метавонад танҳо ба санҷидани техникаи шумо, арзёбии барқароршавии шумо ва омӯхтани дуруст пеш рафтан кумак кунад.',

    s11Heading: 'Барқароршавие, ки вақт мегирад',
    s11Body1:
      'Пас аз таваллуд муқаррарӣ аст, ки фавран ҳамон эҳсосот ё қуввати мушакеро, ки пеш аз ҳомиладорӣ доштед, барнагардонед.',
    s11Body2:
      'Мақсад иҷрои ҳарчи бештари кашишҳо нест. Бештар бозгашти тадриҷии ҳамоҳангии хуб байни кашиш ва ором шудан аст ва сипас қобилияти ба таври табиӣ истифода бурдани ин мушакҳо дар фаъолиятҳои ҳаррӯза.',
    s11HighlightTitle: 'Пешрафти хурд пешрафти воқеӣ аст',
    s11HighlightText:
      'Огоҳии беҳтар аз ҳаракат, чанд сонияи иловагии кашиш ё кам шудани рехтан аллакай нишонаҳои рағбатбахшанд.',

    s12Heading: 'Хулосаҳои асосӣ',
    summaryTitle: 'Муҳимтарин чизҳо',
    summaryItems: [
      'Ҳомиладорӣ ва таваллуд ба қаъри косаи хурд фишори назаррас меоранд.',
      'Барқароршавии тадриҷӣ пас аз таваллуд муқаррарӣ аст.',
      'Машқҳо бояд сифати ҳаракатро аз қувват афзал донанд.',
      'Нафаскашӣ ва ором шудан ба қадри кашиш муҳиманд.',
      'Рехтани пешоб, вазнинӣ ё дарди доимӣ назари мутахассисро сазоворанд.',
      'Барқарорсозӣ бо доя ё физиотерапевт метавонад ба шумо кумак кунад назорати беҳтарро бозёбед.',
      'Бозгашт ба варзиш бояд тадриҷӣ бошад, хусусан барои фаъолиятҳои бо зарбаи баланд.',
    ],

    finalTipTitle: 'Барои барқароршавӣ вақт ҷудо кунед',
    finalTipText:
      'Пас аз таваллуд бадани шумо тағйироти зиёдро аз сар гузаронд. Перинеум ҳамон қадар таваҷҷӯҳро сазовор аст, ки қисми боқимондаи бадани шумо: тадриҷан, мунтазам ва бе фишор.',

    disclaimerText:
      'Ин мақола танҳо барои иттилоъ аст ва маслиҳати шахсии тиббиро иваз намекунад. Агар дард, нишонаҳои доимӣ эҳсос кунед ё дар бораи барқароршавии худ нигарон бошед, аз мутахассиси соҳаи тиб маслиҳат пурсед.',
  },
  ky: {
    badge: 'ТӨРӨТТӨН КИЙИН • КАЛЫБЫНА КЕЛҮҮ',
    title: 'Төрөттөн кийин жамбаш түбүн\nбекемдөө',
    metaDuration: '8 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Курсактуулуктан жана төрөттөн кийин жамбаш түбүнө калыбына келүү үчүн убакыт керек. Жөнөкөй, үзгүлтүксүз жана акырындык менен жасалган көнүгүүлөр иштерди шаштырууга аракет кылбастан күчтү, көзөмөлдү жана ишенимди кайра табууга жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Аралыктын ролун түшүнүү',
      'Төрөт аны эмне үчүн чыңалтат',
      'Жамбаш түбүн калыбына келтирүүнү качан баштоо керек',
      'Туура чыңалтууну үйрөнүү',
      'Акырындык менен тартип түзүү',
      'Болтурбоого тийиш болгон каталар',
      'Жардамды качан сурап кайрылуу керек',
      'Спортко акырындык менен кайтуу',
      'Кабыл алууга даярдануу',
      'Негизги жыйынтыктар',
    ],
    shareMessage: 'Төрөттөн кийин жамбаш түбүн бекемдөө — AWA',

    s1Heading: 'Аралыктын ролун түшүнүү',
    s1Body1:
      'Аралык, ошондой эле жамбаш түбү деп аталат, жамбаштын түбүндө жайгашкан булчуңдар тобу. Ал табарсыкты жана ичегини көзөмөлдөөдө роль ойнойт жана жамбаш органдарын колдоого жардам берет.',
    s1Body2:
      'Курсактуулук убагында бул булчуңдар бир нече ай бою кошумча салмакты көтөрүшү керек. Алар ошондой эле төрөт убагында олуттуу чыңалууга дуушар болот.',
    s1HighlightTitle: 'Көзгө урунбаган, бирок маанилүү булчуң',
    s1HighlightText:
      'Жамбаш түбү бир нече күнүмдүк функцияга катышат: заараны жана заңды кармоо, газдарды көзөмөлдөө, жамбаш органдарын колдоо жана айрым жыныстык функцияларда роль ойноо.',

    benefitsHeading: 'Күчтүү жамбаш түбүнүн пайдасы',
    benefitsIntro:
      'Акырындык менен жана туура аткарылган бекемдөө жамбаш түбүнүн көзөмөлүн жана колдоосун жакшыртууга жардам бериши мүмкүн.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Табарсыкты жакшыраак көзөмөлдөө',
        text: 'Жамбаш түбү табарсыкты көзөмөлдөөдө роль ойнойт. Аны акырындык менен бекемдөө айрым заара агып кетүүлөрдү азайтууга жардам бериши мүмкүн.',
      },
      {
        icon: 'toilet',
        title: 'Ичеги функциясын колдоо',
        text: 'Бул булчуңдар ошондой эле газдарды жана заңды көзөмөлдөөгө жардам берет жана жамбаш органдарын колдоого салым кошот.',
      },
      {
        icon: 'human-female',
        title: 'Жамбаш органдарын колдоо',
        text: 'Жамбаш түбү табарсыкты, жатынды жана ичегини колдоого жардам берген чыныгы булчуң негизин түзөт.',
      },
      {
        icon: 'heart-pulse',
        title: 'Сезимди акырындап кайтаруу',
        text: 'Ылайыктуу калыбына келтирүү ошондой эле бул аймакты жакшыраак сезүүгө жана көзөмөлдөөгө жардам бериши мүмкүн.',
      },
    ],

    s2Heading: 'Курсактуулук жана төрөт аны эмне үчүн чыңалтат',
    s2Body1:
      'Курсактуулук жамбаш түбүнө акырындап көбүрөөк басым түшүрөт. Табигый төрөт андан кийин бул аймактын булчуңдарын жана ткандарын олуттуу созушу мүмкүн.',
    s2Body2:
      'Кесарево кесүү да жамбаш түбүн толугу менен аябайт: курсактуулуктун өзү бул булчуңдар үчүн олуттуу мезгил бойдон калат.',
    s2Body3:
      'Төрөттөн кийин калыбына келүүнүн убакыт алышы ошондуктан кадимки көрүнүш. Айрым аялдар дээрлик эч кандай белгини сезбейт, башкалары агып кетүүнү, оордук сезимин же булчуң көзөмөлүнүн азайышын байкашы мүмкүн.',
    s2TipTitle: 'Ар бир калыбына келүү ар башка',
    s2TipText:
      'Төрөттүн түрү, жыртылуу же эпизиотомия, оорунун болушу жана төрөттөн кийинки жалпы абалыңыз калыбына келүүгө таасир этиши мүмкүн.',

    s3Heading: 'Жамбаш түбүн калыбына келтирүүнү качан баштоо керек?',
    s3Body1:
      'Татаалдашуусуз төрөттөн кийин жамбаш түбүнүн жумшак чыңалтуулары адатта акырындык менен улантылышы мүмкүн. Көнүгүүлөрдү абалыңызга ыңгайлаштыруу жана татаалдашууну, олуттуу ооруну же белгилүү процедураны башыңыздан өткөрсөңүз, кеңеш сурап кайрылуу маанилүү бойдон калат.',
    s3Body2:
      'Эгер заара катетериңиз болсо, айрым сунуштар аралык көнүгүүлөрүн баштоодон мурун аны алып салганга чейин жана нормалдуу заара кылуу кайра башталганга чейин күтүүнү сунуштайт.',
    s3AlertTitle: 'Ооруну жеңүүгө аракет кылбаңыз',
    s3AlertText:
      'Олуттуу оору, начарлаган белгилер, жаман айыгып жаткан жара же ар кандай өзгөчө тынчсыздануу акушеркадан, дарыгерден же калыбына келтирүү адисинен кеңеш алууну талап кылат.',

    s4Heading: 'Туура чыңалтууну үйрөнүү',
    s4Body1:
      'Кыймылды аныктоо үчүн газды жана заара кылуу каалоосун бир эле учурда кармоого аракет кылгандай элестетиңиз. Издеген кыймылыңыз — ичке карай чыңалуу жана көтөрүлүү сезими.',
    s4Body2:
      'Максат — бүт денени катуу чыңалтуу эмес. Жамбаштарыңыз, санданыңыз жана курсак булчуңдарыңыз мүмкүн болушунча бошоң бойдон калышы керек, ал эми дем алуу кадимкидей уланат.',
    exercises: [
      {icon: 'weather-windy', label: 'Дем алуу'},
      {icon: 'human-handsup', label: 'Жумшак чыңалтуу'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Узак чыңалтуу'},
      {icon: 'gesture-tap-button', label: 'Тез чыңалтуулар'},
    ],
    s4HighlightTitle: 'Бошоңдоо да ошончолук маанилүү',
    s4HighlightText:
      'Ар бир чыңалтуудан кийин булчуңдарга толугу менен бошоңдоого мүмкүнчүлүк бериңиз. Жакшы калыбына келтирүү аралыкты күн бою чыңалган кармоону билдирбейт.',

    s5Heading: 'Акырындык менен тартип түзүү',
    s5Body1:
      'Башында эң маанилүүсү — булчуңдарды аныктоону жана кыймылды туура аткарууну үйрөнүү. Интенсивдүүлүктөн көрө үзгүлтүксүздүк маанилүү.',
    s5h3a: 'Узак чыңалтуулар',
    s5Body2:
      'Жамбаш түбүн акырын чыңалтыңыз, анан дем алууну кармабай бир нече секунд чыңалууну кармап туруңуз. Андан кийин кайра баштоодон мурун толугу менен бошоңдоңуз.',
    s5h3b: 'Кыска чыңалтуулар',
    s5Body3:
      'Кыймыл өздөштүрүлгөндөн кийин, кичинекей тез чыңалтууларды кошсо болот. Алар курсак басымы жогорулаганда, мисалы жөтөлгөнгө же чүчкүргөнгө дейре булчуңдарды тез чыңалтуу жөндөмүн машыктырууга жардам берет.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Көнүгүүлөрдү күнүмдүк адат менен байланыштырыңыз'},
      {icon: 'human-sitting', label: 'Ыңгайлуу абалдан баштаңыз'},
      {icon: 'weather-windy', label: 'Чыңалтуулар учурунда кадимкидей дем алыңыз'},
      {icon: 'sleep', label: 'Бошоңдоо фазаларын сактаңыз'},
      {icon: 'chart-line', label: 'Кыйынчылыкты акырындык менен көбөйтүңүз'},
      {icon: 'doctor', label: 'Ишенбесеңиз, кеңеш сураңыз'},
    ],
    s5TipTitle: 'Баарынан мурда үзгүлтүксүздүк',
    s5TipText:
      'Көнүгүүлөрдү күнүңүздө буга чейин бар адат менен байланыштыруу үзгүлтүксүз болууну жеңилдетиши мүмкүн: эмизгенден кийин, тиш жуугандан кийин же өзүңүзгө ылайыктуу башка убакта.',

    s6Heading: 'Болтурбоого тийиш болгон кеңири таралган каталар',
    s6Body1:
      'Аралык көнүгүүлөрү жөнөкөй көрүнүшү мүмкүн, бирок башка булчуңдар менен компенсациялоо же өтө катуу басуу оңой.',
    commonMistakes: [
      'Жамбаш түбүнүн ордуна жамбаштарды же санды чыңалтуу',
      'Чыңалтуу учурунда дем алууну кармоо',
      'Булчуңдарды бошоңдотпой үзгүлтүксүз чыңалган кармоо',
      'Көнүгүүлөрдү бир нече күн гана жасап, андан кийин токтотуу',
      'Чыңалтууну текшерүү үчүн заара агымын атайылап токтотуу',
    ],
    s6TipTitle: 'Эмне кылбоо керек',
    s6TipText:
      'Көнүгүүлөрдү заара агымын атайылап токтотуу аркылуу жасоо сунушталбайт. Бул ыкма аралыкты туура машыктырбайт жана табарсыктын кадимки иштешин бузушу мүмкүн.',

    s7Heading: 'Кайсы белгилер консультацияга түртүшү керек?',
    s7Body1:
      'Майда агып кетүүлөр же адаттан тыш сезим төрөттөн кийин кээде пайда болушу мүмкүн. Бирок алар улана берсе, начарласа же күнүмдүк жашооңузга тоскоол болсо, аларга көңүл бурбай коюуга болбойт.',
    warningSigns: [
      'Жөтөлгөндө, чүчкүргөндө, күлгөндө же күч түшүргөндө заара агып кетүү',
      'Жамбаштын ылдый жагында оордук же басым сезими',
      'Кынапка шишик же бир нерсе түшүп жаткандай сезим',
      'Газдарды же заңды кармоодогу кыйынчылык',
      'Аралыктагы улана берген оору',
      'Жыныстык катнаш учурунда же андан кийин оору',
      'Аралык булчуңдарын аныктоодогу же туура чыңалтуудагы кыйынчылык',
    ],
    consultLabel: 'Кеңешти качан сурап кайрылуу керек?',
    s7Body2:
      'Акушерка, дарыгер же жамбаш түбүн калыбына келтирүү боюнча адистештирилген физиотерапевт булчуң иштешин текшерип, ылайыктуу программаны сунуштай алат.',

    s8Heading: 'Жыртылуудан, эпизиотомиядан же кесарево кесүүдөн кийин эмне?',
    s8Body1:
      'Жыртылуу же эпизиотомия айыгуу учурунда өзгөчө кам көрүүнү талап кылат. Иш-аракеттерди улантуу оорууну, тырыктын абалын жана төрөттөн кийин берилген көрсөтмөнү эске алышы керек.',
    s8Body2:
      'Кесарево кесүүдөн кийин калыбына келүү курсак дубалын жана тырыкты да камтыйт. Төрөт табигый болбосо да, курсактуулуктун өзү жамбаш түбүнө дагы эле чыңалуу келтирген.',
    s8HighlightTitle: 'Жекелештирилген кам көрүү жардам бере алат',
    s8HighlightText:
      'Олуттуу жыртылууда, оорууда, заара же ичеги белгилеринде же улана берген кыйынчылыктарда ден соолук сактоо адиси менен баа берүү өзгөчө пайдалуу болушу мүмкүн.',

    s9Heading: 'Спортко акырындык менен кайтуу',
    s9Body1:
      'Төрөттөн кийин кыймылды улантуу акырындык менен болушу керек. Басуу жана жумшак кыймылдар жалпысынан өзүңүздү кандай сезгениңизге жараша улантылышы мүмкүн, ал эми жогорку соккулуу активдүүлүк көбүрөөк сак болууну талап кылат.',
    s9Body2:
      'Чуркоону, секирүүнү же абдан интенсивдүү машыгууну улантуудан мурун жамбаш түбүнүн калыбына келүүсүн баалап, ар кандай белгилерди эске алган жакшы.',
    s9AlertTitle: 'Этаптарды шаштырбаңыз',
    s9AlertText:
      'Агып кетүүлөр, оордук сезими же көнүгүү учурунда же андан кийин оору — интенсивдүүлүктү көбөйтүүдөн мурун жайлатуу жана кеңеш алуу керек экенинин белгилери.',

    s10Heading: 'Адиске качан барыш керек?',
    s10Body1:
      'Акушерка же физиотерапевт менен жамбаш түбүн калыбына келтирүү туура чыңалтып жатканыңызга ишенбесеңиз, белгилериңиз улана берсе же айрым физикалык иш-аракеттерди ишеним менен улантууну кааласаңыз пайдалуу болушу мүмкүн.',
    questionCardTitle: 'Берүүгө пайдалуу суроолор',
    appointmentQuestions: [
      'Белгилерим жамбаш түбүнүн алсыздыгына шайкеш келеби?',
      'Чыңалтууларды туура аткарып жатамбы?',
      'Күнүнө канча кайталоо жасашым керек?',
      'Чуркоого, спортко же жогорку соккулуу көнүгүүгө кайтсам болобу?',
      'Акушерка же физиотерапевт менен калыбына келтирүү керекпи?',
      'Тырыгым, жыртылуум же кесарево кесүүм кандайдыр бир өзгөчө сактык чараларын талап кылабы?',
    ],
    s10TipTitle: 'Билүү пайдалуу',
    s10TipText:
      'Адис менен көрүшүү сөзсүз бир нерсе туура эмес дегенди билдирбейт. Сессия техникаңызды текшерүүгө, калыбына келүүңүздү баалоого жана туура өнүгүүнү үйрөнүүгө жөн гана жардам бериши мүмкүн.',

    s11Heading: 'Убакыт талап кылган калыбына келүү',
    s11Body1:
      'Төрөттөн кийин курсактуулуктан мурунку сезимдерди же булчуң күчүн дароо кайра таппоо кадимки көрүнүш.',
    s11Body2:
      'Максат — мүмкүн болушунча көп чыңалтуу жасоо эмес. Бул көбүрөөк чыңалтуу менен бошоңдоонун ортосундагы жакшы координацияны акырындап кайра табуу жана андан кийин бул булчуңдарды күнүмдүк иш-аракеттерде табигый колдоно алуу.',
    s11HighlightTitle: 'Кичинекей прогресс — чыныгы прогресс',
    s11HighlightText:
      'Кыймылды жакшыраак сезүү, чыңалтууга бир нече секунд кошумча же агып кетүүлөрдүн азайышы буга чейин эле шыктандыруучу белгилер.',

    s12Heading: 'Негизги жыйынтыктар',
    summaryTitle: 'Эң негизгиси',
    summaryItems: [
      'Курсактуулук жана төрөт жамбаш түбүнө олуттуу чыңалуу келтирет.',
      'Төрөттөн кийин акырындап калыбына келүү кадимки көрүнүш.',
      'Көнүгүүлөр күчтөн мурда кыймылдын сапатына артыкчылык бериши керек.',
      'Дем алуу жана бошоңдоо чыңалтуу сыяктуу эле маанилүү.',
      'Заара агып кетүү, оордук же улана берген оору адистин пикирине татыйт.',
      'Акушерка же физиотерапевт менен калыбына келтирүү жакшыраак көзөмөлдү кайра табууга жардам бериши мүмкүн.',
      'Спортко кайтуу акырындык менен болушу керек, айрыкча жогорку соккулуу активдүүлүктөр үчүн.',
    ],

    finalTipTitle: 'Калыбына келүүгө убакыт бөлүңүз',
    finalTipText:
      'Төрөттөн кийин денеңиз көптөгөн өзгөрүүлөрдү башынан өткөрдү. Аралык денеңиздин калган бөлүгүндөй эле көңүл бурууга татыйт: акырындык менен, үзгүлтүксүз жана кысымсыз.',

    disclaimerText:
      'Бул макала маалымат берүү максатында гана жазылган жана жекелештирилген медициналык кеңешти алмаштырбайт. Оору, улана берген белгилер сезсеңиз же калыбына келүүңүз боюнча кандайдыр бир тынчсыздануу болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
  },
  tk: {
    badge: 'DOGRANDAN SOŇ • DIKELIŞ',
    title: 'Dograndan soň çanak düýbüni\nberkitmek',
    metaDuration: '8 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Göwrelilikden we dograndan soň çanak düýbüniň dikelmek üçin wagta mätäçligi bar. Ýönekeý, yzygiderli we ädimme-ädim maşklar işleri howlukdyrmaga synanyşmazdan, güýji, dolandyryşy we ynamy täzeden gazanmaga kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Aralygyň rolyny düşünmek',
      'Dogrum ony näme üçin agyr ýagdaýa goýýar',
      'Çanak düýbüni dikeltmegi haçan başlamaly',
      'Dogry gysmagy öwrenmek',
      'Ädimme-ädim tertip gurmak',
      'Gaça durmaly ýalňyşlyklar',
      'Kömegi haçan soramaly',
      'Sporty ýuwaş-ýuwaşdan täzeden başlamak',
      'Kabul edişe taýýarlanmak',
      'Esasy netijeler',
    ],
    shareMessage: 'Dograndan soň çanak düýbüni berkitmek — AWA',

    s1Heading: 'Aralygyň rolyny düşünmek',
    s1Body1:
      'Aralyk, çanak düýbi diýlip hem atlandyrylýar, çanagyň düýbünde ýerleşen myşsalar toparydyr. Ol sidik haltasyny we içegäni dolandyrmakda rol oýnaýar we çanak agzalaryna goldaw bermäge kömek edýär.',
    s1Body2:
      'Göwreli wagtynda bu myşsalar birnäçe aý goşmaça agyrlygy göterýär. Olar dogrum wagtynda hem ep-esli agyr ýagdaýa goýulýar.',
    s1HighlightTitle: 'Ýaşyryn, ýöne zerur myşsa',
    s1HighlightText:
      'Çanak düýbi birnäçe gündelik funksiýada gatnaşýar: sidigi we nejasaty saklamak, gazlary dolandyrmak, çanak agzalaryna goldaw bermek we käbir jynsy funksiýalarda rol oýnamak.',

    benefitsHeading: 'Has güýçli çanak düýbüniň peýdalary',
    benefitsIntro:
      'Ädimme-ädim, dogry ýerine ýetirilen güýçlendirme çanak düýbüniň dolandyryşyny we goldawyny gowulandyrmaga kömek edip biler.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Sidik haltasynyň has gowy dolandyryşy',
        text: 'Çanak düýbi sidik haltasynyň dolandyryşynda rol oýnaýar. Ony ýuwaş-ýuwaşdan güýçlendirmek käbir sidik akyşlaryny azaltmaga kömek edip biler.',
      },
      {
        icon: 'toilet',
        title: 'Içegäniň işine goldaw bermek',
        text: 'Bu myşsalar şeýle hem gazlary we nejasaty dolandyrmaga kömek edýär we çanak agzalaryna goldaw bermäge goşant goşýar.',
      },
      {
        icon: 'human-female',
        title: 'Çanak agzalaryna goldaw bermek',
        text: 'Çanak düýbi sidik haltasyna, ýatga we içegä goldaw bermäge kömek edýän hakyky myşsa esasyny emele getirýär.',
      },
      {
        icon: 'heart-pulse',
        title: 'Duýgyny ýuwaş-ýuwaşdan gaýtadan gazanmak',
        text: 'Laýyk dikeldiş şeýle hem bu ýeriň has gowy aňyna we dolandyryşyna ýetmäge kömek edip biler.',
      },
    ],

    s2Heading: 'Göwrelilik we dogrum ony näme üçin agyr ýagdaýa goýýar',
    s2Body1:
      'Göwrelilik çanak düýbüne ýuwaş-ýuwaşdan has köp basyş goýýar. Waginal dogrum soňra bu ýeriň myşsalaryny we dokumalaryny ep-esli uzaldyp biler.',
    s2Body2:
      'Keýsar kesimi hem çanak düýbüni doly gutarmaýar: göwrelilik özi bu myşsalar üçin möhüm döwür bolup galýar.',
    s2Body3:
      'Dograndan soň, dikelişiň wagt almagy şonuň üçin adaty zat. Käbir aýallar diýen ýaly alamat duýmaýar, beýlekiler bolsa sidik akyşlaryny, agyrlyk duýgusyny ýa-da myşsa dolandyryşynyň azalmagyny görüp biler.',
    s2TipTitle: 'Her dikeliş dürli',
    s2TipText:
      'Dogrumyň görnüşi, ýyrtylma ýa-da epiziotomiýa, agyrynyň barlygy we dograndan soňky umumy ýagdaýyňyz dikelişe täsir edip biler.',

    s3Heading: 'Çanak düýbüni dikeltmegi haçan başlamaly?',
    s3Body1:
      'Kynçylyksyz dogrumdan soň, ýumşak çanak düýbi gysmalary adatça ýuwaş-ýuwaşdan täzeden başlap bolýar. Maşklary ýagdaýyňyza uýgunlaşdyrmak we çylşyrymlylyk, möhüm agyry ýa-da belli bir amal başdan geçiren bolsaňyz maslahat almak möhümligini saklaýar.',
    s3Body2:
      'Sidik kateteriňiz bar bolsa, käbir maslahatlar aralyk maşklaryny başlamazdan öň ol aýrylýança we adaty sidik çykaryş täzeden başlanýança garaşmagy teklip edýär.',
    s3AlertTitle: 'Agyrynyň üstünden geçmäň',
    s3AlertText:
      'Möhüm agyry, erbetleşýän alamatlar, erbet bejerilýän ýara ýa-da islendik aýratyn alada akuşerkanyň, lukmanyň ýa-da dikeldiş hünärmeniniň maslahatyny talap edýär.',

    s4Heading: 'Dogry gysmagy öwrenmek',
    s4Body1:
      'Hereketi kesgitlemek üçin gazy we sidik çykarmak islegini bir wagtda saklamaga synanyşýandygyňyzy göz öňüne getiriň. Gözleýän hereketiňiz içe tarap gysmak we galdyrmak duýgusy.',
    s4Body2:
      'Maksat bütin bedeniňizi berk dartmak däl. Dem alyş adaty ýagdaýda dowam edýärkä, kebeleklerigiziz, bagryňyz we garyn myşsalaryňyz mümkin boldugyça rahat galmaly.',
    exercises: [
      {icon: 'weather-windy', label: 'Dem alyş'},
      {icon: 'human-handsup', label: 'Ýumşak gysmak'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Uzak gysmak'},
      {icon: 'gesture-tap-button', label: 'Çalt gysmalar'},
    ],
    s4HighlightTitle: 'Rahatlanmak hem şonça-da möhüm',
    s4HighlightText:
      'Her gysmadan soň myşsalary doly rahatlandyryň. Gowy dikeldiş aralygy bütin gün gysylan saklamagy aňlatmaýar.',

    s5Heading: 'Ädimme-ädim tertip gurmak',
    s5Body1:
      'Başda iň möhümi myşsalary kesgitlemegi we hereketi dogry ýerine ýetirmegi öwrenmek. Yzygiderlilik intensiwlikden has möhüm.',
    s5h3a: 'Uzak gysmalar',
    s5Body2:
      'Çanak düýbüni ýuwaşlyk bilen gysyň, soňra demi saklamazdan gysmany birnäçe sekunt saklaň. Soňra täzeden başlamazdan öň doly goýberiň.',
    s5h3b: 'Gysga gysmalar',
    s5Body3:
      'Hereket özleşdirilenden soň, kiçijik çalt gysmalary goşup bolýar. Olar garyn basyşy artanda, meselem, üsgürmezden ýa-da asgyrmazdan öň, myşsalary çalt gysmak ukybyňyzy ýaýdyrmaga kömek edýär.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Maşklary gündelik endik bilen utgaşdyryň'},
      {icon: 'human-sitting', label: 'Rahat ýagdaýdan başlaň'},
      {icon: 'weather-windy', label: 'Gysmalar wagtynda adaty dem alyň'},
      {icon: 'sleep', label: 'Rahatlanma tapgyrlaryna hormat goýuň'},
      {icon: 'chart-line', label: 'Kynlygy ýuwaş-ýuwaşdan artdyryň'},
      {icon: 'doctor', label: 'Ynamsyz bolsaňyz maslahat soraň'},
    ],
    s5TipTitle: 'Ilki bilen yzygiderlilik',
    s5TipText:
      'Maşklary gününiň eýýäm bir bölegi bolan endik bilen utgaşdyrmak yzygiderli galmagy aňsatlaşdyryp biler: emdirmeden soň, diş ýuwandan soň ýa-da size laýyk başga wagtda.',

    s6Heading: 'Gaça durmaly umumy ýalňyşlyklar',
    s6Body1:
      'Aralyk maşklary ýönekeý görünip biler, ýöne beýleki myşsalar bilen öwezini dolmak ýa-da aşa güýçli itekläp bolmak aňsat.',
    commonMistakes: [
      'Çanak düýbüniň ýerine kebeleklerigizi ýa-da bagryňyzy gysmak',
      'Gysma wagtynda demi saklamak',
      'Myşsalary rahatlanmaga ýol bermän yzygiderli gysylan saklamak',
      'Maşklary diňe birnäçe gün etmek we soňra bes etmek',
      'Gysmany barlamak üçin sidik akymyny bilkastlaýyn saklamak',
    ],
    s6TipTitle: 'Nämäni etmeli däl',
    s6TipText:
      'Maşklary sidik akymyny bilkastlaýyn saklamak arkaly etmek maslahat berilmeýär. Bu usul aralygy dogry türgenleşdirmeýär we sidik haltasynyň adaty işini bozup biler.',

    s7Heading: 'Haýsy alamatlar maslahatlaşmaga itergi bermeli?',
    s7Body1:
      'Ownuk akyşlar ýa-da adaty däl duýgy käwagt dograndan soň peýda bolup biler. Şeýle-de bolsa, olar dowam etse, erbetleşse ýa-da gündelik durmuşyňyza päsgel berse, äsgermezlik edilmeli däl.',
    warningSigns: [
      'Üsgüreniňizde, asgyranyňyzda, güleniňizde ýa-da dartanyňyzda sidik akyşlary',
      'Aşaky çanakda agyrlyk ýa-da basyş duýgusy',
      'Waginanyň içine bir düwün ýa-da bir zadyň düşýän duýgusy',
      'Gazy ýa-da nejasaty saklamakda kynçylyk',
      'Aralykda dowamly agyry',
      'Jynsy gatnaşyk wagtynda ýa-da soň agyry',
      'Aralyk myşsalaryny kesgitlemekde ýa-da dogry gysmakda kynçylyk',
    ],
    consultLabel: 'Maslahaty haçan soramaly?',
    s7Body2:
      'Çanak düýbüni dikeltmek boýunça hünärmen akuşerka, lukman ýa-da fizioterapewt myşsa işini barlap, laýyk programmany teklip edip biler.',

    s8Heading: 'Ýyrtylmadan, epiziotomiýadan ýa-da keýsar kesimden soň?',
    s8Body1:
      'Ýyrtylma ýa-da epiziotomiýa bejerilişi wagtynda aýratyn ideg talap edýär. Işjeňlikleri täzeden başlamak agyrylary, çyzyň ýagdaýyny we dograndan soň berlen görkezmeleri hasaba almaly.',
    s8Body2:
      'Keýsar kesimden soň dikeliş garyn diwaryna we çyza hem degişli. Dogrum waginal bolmasa-da, göwrelilik özi çanak düýbüne henizem agyrlyk saldy.',
    s8HighlightTitle: 'Şahsylaşdyrylan ideg kömek edip biler',
    s8HighlightText:
      'Möhüm ýyrtylma, agyry, sidik ýa-da içegä degişli alamatlar ýa-da dowamly kynçylyklar ýagdaýynda, saglyk hünärmeni bilen barlag aýratyn peýdaly bolup biler.',

    s9Heading: 'Sporty ýuwaş-ýuwaşdan täzeden başlamak',
    s9Body1:
      'Dograndan soň hereketi täzeden başlamak ädimme-ädim bolmaly. Ýöremek we ýumşak hereketleri umuman duýgyňyza görä täzeden başlap bolýar, uly täsirli işjeňlikler has köp seresaplylygy talap edýär.',
    s9Body2:
      'Ylgamagy, bökmegi ýa-da gaty güýçli türgenleşigi täzeden başlamazdan öň, çanak düýbüniň dikelişini bahalamak we islendik alamaty hasaba almak has gowy.',
    s9AlertTitle: 'Tapgyrlary howlukdyrmaň',
    s9AlertText:
      'Maşk wagtynda ýa-da soň akyşlar, agyrlyk duýgusy ýa-da agyry intensiwligi artdyrmazdan öň haýallamalydygyňyzy we maslahat almalydygyňyzy görkezýän alamatlar.',

    s10Heading: 'Hünärmene haçan ýüz tutmaly?',
    s10Body1:
      'Akuşerka ýa-da fizioterapewt bilen çanak düýbüni dikeltmek dogry gysýandygyňyza ynamsyz bolsaňyz, alamatlaryňyz dowam etse ýa-da käbir fiziki işjeňlikleri ynam bilen täzeden başlamak isleseňiz peýdaly bolup biler.',
    questionCardTitle: 'Bermäge peýdaly soraglar',
    appointmentQuestions: [
      'Alamatlarym çanak düýbüniň ejizligine gabat gelýärmi?',
      'Gysmalary dogry ýerine ýetirýärinmi?',
      'Gün üçin näçe gaýtalama etmeli?',
      'Ylgamaga, sporta ýa-da uly täsirli maşklara gaýdyp bilerinmi?',
      'Akuşerka ýa-da fizioterapewt bilen dikeldiş gerekmi?',
      'Çyzym, ýyrtylmam ýa-da keýsar kesimim aýratyn seresaplylyk çärelerini talap edýärmi?',
    ],
    s10TipTitle: 'Bilmek peýdaly',
    s10TipText:
      'Hünärmen bilen görüşmek nämedir bir zadyň nädogrydygyny hökman aňlatmaýar. Bir sessiýa diňe tehnikaňyzy barlamaga, dikelişiňizi bahalamaga we dogry öňe gitmegi öwrenmäge kömek edip biler.',

    s11Heading: 'Wagt alýan dikeliş',
    s11Body1:
      'Dograndan soň göwrelilikden öňki ýaly duýgulary ýa-da myşsa güýjüni derrew gaýtadan gazanmazlyk adaty zat.',
    s11Body2:
      'Maksat mümkin boldugyça köp gysma etmek däl. Has köp gysma bilen rahatlanmanyň arasynda gowy utgaşmany ýuwaş-ýuwaşdan gaýtadan gazanmak we soňra bu myşsalary gündelik işjeňliklerde tebigy ulanyp bilmek.',
    s11HighlightTitle: 'Kiçijik ösüş hakyky ösüş',
    s11HighlightText:
      'Hereketi has gowy aňlamak, gysmanyň birnäçe goşmaça sekundy ýa-da akyşlaryň azalmagy eýýäm ruhlandyryjy alamatlar.',

    s12Heading: 'Esasy netijeler',
    summaryTitle: 'Esasy zatlar',
    summaryItems: [
      'Göwrelilik we dogrum çanak düýbüne möhüm agyrlyk salýar.',
      'Dograndan soň ýuwaş-ýuwaşdan dikeliş adaty zat.',
      'Maşklar güýçden has köp hereketiň hiline artykmaçlyk bermeli.',
      'Dem alyş we rahatlanmak gysmak ýaly möhüm.',
      'Sidik akyşlary, agyrlyk ýa-da dowamly agyry hünärmeniň pikirine mynasyp.',
      'Akuşerka ýa-da fizioterapewt bilen dikeldiş has gowy dolandyryşy gaýtadan gazanmaga kömek edip biler.',
      'Sporta gaýdyp gelmek, aýratyn-da uly täsirli işjeňlikler üçin, ädimme-ädim bolmaly.',
    ],

    finalTipTitle: 'Dikelmäge wagt beriň',
    finalTipText:
      'Dograndan soň bedeniňiz köp üýtgeşmeden geçdi. Aralyk bedeniňiziň galan bölegi ýaly üns almaga mynasyp: ädimme-ädim, yzygiderli we basyşsyz.',

    disclaimerText:
      'Bu makala diňe maglumat maksatly we şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Agyry, dowamly alamatlar başdan geçirseňiz ýa-da dikelişiňiz barada islendik aladaňyz bolsa, saglyk hünärmeninden maslahat soraň.',
  },
  ms: {
    badge: 'SELEPAS BERSALIN • PEMULIHAN',
    title: 'Mengukuhkan dasar pelvis anda\nselepas bersalin',
    metaDuration: '8 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro:
      'Selepas kehamilan dan bersalin, dasar pelvis memerlukan masa untuk pulih. Senaman yang mudah, tetap dan beransur-ansur boleh membantu anda mendapatkan semula kekuatan, kawalan dan keyakinan, tanpa cuba mempercepatkan keadaan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami peranan perineum',
      'Mengapa bersalin menekannya',
      'Bila untuk memulakan pemulihan dasar pelvis',
      'Belajar mengecutkan dengan betul',
      'Membina rutin beransur-ansur',
      'Kesilapan yang perlu dielakkan',
      'Bila untuk meminta bantuan',
      'Menyambung semula sukan secara beransur-ansur',
      'Bersedia untuk temu janji',
      'Perkara penting untuk diingat',
    ],
    shareMessage: 'Mengukuhkan dasar pelvis anda selepas bersalin — AWA',

    s1Heading: 'Memahami peranan perineum',
    s1Body1:
      'Perineum, yang juga dipanggil dasar pelvis, ialah sekumpulan otot yang terletak di dasar pelvis. Ia berperanan dalam kawalan pundi kencing dan usus dan membantu menyokong organ pelvis.',
    s1Body2:
      'Semasa kehamilan, otot-otot ini terpaksa menanggung berat tambahan selama beberapa bulan. Ia juga mengalami tekanan yang besar semasa bersalin.',
    s1HighlightTitle: 'Otot yang diskret tetapi penting',
    s1HighlightText:
      'Dasar pelvis terlibat dalam beberapa fungsi harian: menahan air kencing dan najis, mengawal angin, menyokong organ pelvis dan berperanan dalam fungsi seksual tertentu.',

    benefitsHeading: 'Faedah dasar pelvis yang lebih kuat',
    benefitsIntro:
      'Pengukuhan yang beransur-ansur dan dilakukan dengan betul boleh membantu memperbaiki kawalan dan sokongan dasar pelvis.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Kawalan pundi kencing yang lebih baik',
        text: 'Dasar pelvis berperanan dalam kawalan pundi kencing. Mengukuhkannya secara beransur-ansur mungkin membantu mengurangkan sesetengah kebocoran air kencing.',
      },
      {
        icon: 'toilet',
        title: 'Menyokong fungsi usus',
        text: 'Otot-otot ini juga membantu mengawal angin dan najis dan menyumbang kepada sokongan organ pelvis.',
      },
      {
        icon: 'human-female',
        title: 'Menyokong organ pelvis',
        text: 'Dasar pelvis membentuk tapak otot yang sebenar yang membantu menyokong pundi kencing, rahim dan usus.',
      },
      {
        icon: 'heart-pulse',
        title: 'Mendapatkan semula deria secara beransur-ansur',
        text: 'Pemulihan yang sesuai juga boleh membantu anda mendapatkan kesedaran dan kawalan yang lebih baik terhadap bahagian ini.',
      },
    ],

    s2Heading: 'Mengapa kehamilan dan bersalin menekannya',
    s2Body1:
      'Kehamilan beransur-ansur meletakkan lebih banyak tekanan pada dasar pelvis. Bersalin secara normal kemudiannya boleh meregangkan otot dan tisu di bahagian ini dengan ketara.',
    s2Body2:
      'Pembedahan Caesarean juga tidak sepenuhnya menyelamatkan dasar pelvis: kehamilan itu sendiri kekal sebagai tempoh yang ketara bagi otot-otot ini.',
    s2Body3:
      'Selepas bersalin, oleh itu adalah normal untuk pemulihan mengambil masa. Sesetengah wanita hampir tidak berasa sebarang simptom, manakala yang lain mungkin perasan kebocoran, rasa berat atau kawalan otot yang berkurangan.',
    s2TipTitle: 'Setiap pemulihan berbeza',
    s2TipText:
      'Jenis kelahiran, koyakan atau episiotomi, kehadiran sakit dan keadaan am anda selepas bersalin semuanya boleh mempengaruhi pemulihan.',

    s3Heading: 'Bila untuk memulakan pemulihan dasar pelvis?',
    s3Body1:
      'Selepas kelahiran yang tidak rumit, kontraksi dasar pelvis yang lembut biasanya boleh disambung semula secara beransur-ansur. Ia kekal penting untuk menyesuaikan senaman dengan keadaan anda dan mendapatkan nasihat jika anda mengalami komplikasi, sakit yang ketara atau prosedur tertentu.',
    s3Body2:
      'Jika anda menggunakan kateter kencing, sesetengah syor mencadangkan menunggu sehingga ia dikeluarkan dan membuang air kecil secara normal telah bersambung semula sebelum memulakan senaman perineum.',
    s3AlertTitle: 'Jangan memaksa diri walaupun sakit',
    s3AlertText:
      'Sakit yang ketara, simptom yang bertambah teruk, luka yang sembuh dengan kurang baik atau sebarang kebimbangan tertentu memerlukan nasihat bidan, doktor atau pengamal profesional pemulihan.',

    s4Heading: 'Belajar mengecutkan dengan betul',
    s4Body1:
      'Untuk mengenal pasti pergerakan itu, bayangkan cuba menahan angin dan keinginan untuk membuang air kecil pada masa yang sama. Pergerakan yang anda cari ialah rasa pengecutan dan mengangkat ke dalam.',
    s4Body2:
      'Matlamatnya bukan untuk menegangkan seluruh badan dengan ketat. Punggung, peha dan perut anda perlu kekal sesantai mungkin, sementara pernafasan diteruskan seperti biasa.',
    exercises: [
      {icon: 'weather-windy', label: 'Pernafasan'},
      {icon: 'human-handsup', label: 'Pengecutan lembut'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Pengecutan panjang'},
      {icon: 'gesture-tap-button', label: 'Pengecutan pantas'},
    ],
    s4HighlightTitle: 'Bersantai sama pentingnya',
    s4HighlightText:
      'Selepas setiap pengecutan, biarkan otot berehat sepenuhnya. Pemulihan yang baik tidak bermakna mengekalkan perineum dalam keadaan mengecut sepanjang hari.',

    s5Heading: 'Membina rutin beransur-ansur',
    s5Body1:
      'Pada mulanya, perkara yang paling penting ialah belajar mengenal pasti otot dan melakukan pergerakan dengan betul. Ketetapan lebih penting daripada keamatan.',
    s5h3a: 'Pengecutan panjang',
    s5Body2:
      'Kecutkan dasar pelvis dengan lembut, kemudian tahan pengecutan selama beberapa saat tanpa menahan nafas. Kemudian lepaskan sepenuhnya sebelum bermula semula.',
    s5h3b: 'Pengecutan pendek',
    s5Body3:
      'Setelah pergerakan dikuasai, pengecutan kecil yang pantas boleh ditambah. Ia membantu melatih keupayaan anda untuk mengecutkan otot dengan cepat apabila tekanan perut meningkat, contohnya sejurus sebelum batuk atau bersin.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Padankan senaman dengan tabiat harian'},
      {icon: 'human-sitting', label: 'Mulakan dalam posisi yang selesa'},
      {icon: 'weather-windy', label: 'Bernafas seperti biasa semasa pengecutan'},
      {icon: 'sleep', label: 'Hormati fasa relaksasi'},
      {icon: 'chart-line', label: 'Tingkatkan kesukaran secara beransur-ansur'},
      {icon: 'doctor', label: 'Mintalah nasihat jika anda tidak pasti'},
    ],
    s5TipTitle: 'Ketetapan di atas segalanya',
    s5TipText:
      'Memadankan senaman dengan tabiat yang sudah menjadi sebahagian daripada hari anda boleh memudahkan anda kekal konsisten: selepas menyusu, selepas memberus gigi atau pada waktu lain yang sesuai dengan anda.',

    s6Heading: 'Kesilapan lazim yang perlu dielakkan',
    s6Body1:
      'Senaman perineum mungkin kelihatan mudah, tetapi mudah untuk menggantikannya dengan otot lain atau menolak terlalu kuat.',
    commonMistakes: [
      'Menegangkan punggung atau peha dan bukan dasar pelvis',
      'Menahan nafas semasa pengecutan',
      'Mengekalkan otot dalam keadaan mengecut secara berterusan tanpa membiarkannya berehat',
      'Melakukan senaman hanya selama beberapa hari dan kemudian berhenti',
      'Sengaja menghentikan aliran air kencing untuk menyemak pengecutan',
    ],
    s6TipTitle: 'Apa yang tidak patut dilakukan',
    s6TipText:
      'Tidak disyorkan untuk mengamalkan senaman dengan sengaja menghentikan aliran air kencing. Kaedah ini tidak melatih perineum dengan betul dan boleh mengganggu fungsi pundi kencing yang normal.',

    s7Heading: 'Simptom apakah yang patut mendorong konsultasi?',
    s7Body1:
      'Kebocoran kecil atau rasa luar biasa kadangkala boleh muncul selepas bersalin. Walau bagaimanapun, ia tidak patut diabaikan jika ia berterusan, bertambah teruk atau mengganggu kehidupan seharian anda.',
    warningSigns: [
      'Kebocoran air kencing semasa anda batuk, bersin, ketawa atau meneran',
      'Rasa berat atau tekanan di pelvis bawah',
      'Rasa ada ketulan atau sesuatu yang jatuh ke dalam faraj',
      'Kesukaran menahan angin atau najis',
      'Sakit yang berterusan di perineum',
      'Sakit semasa atau selepas hubungan seks',
      'Kesukaran mengenal pasti atau mengecutkan otot perineum dengan betul',
    ],
    consultLabel: 'Bila anda patut meminta nasihat?',
    s7Body2:
      'Bidan, doktor atau ahli fisioterapi yang pakar dalam pemulihan dasar pelvis boleh menyemak fungsi otot dan mencadangkan program yang sesuai.',

    s8Heading: 'Dan selepas koyakan, episiotomi atau pembedahan Caesarean?',
    s8Body1:
      'Koyakan atau episiotomi memerlukan penjagaan khusus semasa penyembuhan. Menyambung semula aktiviti perlu mengambil kira sakit, keadaan parut dan panduan yang diberikan selepas bersalin.',
    s8Body2:
      'Selepas pembedahan Caesarean, pemulihan juga melibatkan dinding perut dan parut. Walaupun kelahiran itu bukan secara normal, kehamilan itu sendiri tetap meletakkan tekanan pada dasar pelvis.',
    s8HighlightTitle: 'Penjagaan yang diperibadikan boleh membantu',
    s8HighlightText:
      'Dalam kes koyakan yang ketara, sakit, simptom kencing atau usus, atau kesukaran yang berterusan, penilaian bersama pengamal penjagaan kesihatan boleh amat membantu.',

    s9Heading: 'Menyambung semula sukan secara beransur-ansur',
    s9Body1:
      'Menyambung semula pergerakan selepas bersalin perlu dilakukan secara beransur-ansur. Berjalan dan pergerakan lembut biasanya boleh disambung semula berdasarkan perasaan anda, manakala aktiviti berimpak tinggi memerlukan lebih berhati-hati.',
    s9Body2:
      'Sebelum menyambung semula berlari, melompat atau latihan yang sangat intensif, lebih baik menilai pemulihan dasar pelvis dan mengambil kira sebarang simptom.',
    s9AlertTitle: 'Jangan tergesa-gesa melangkaui peringkat',
    s9AlertText:
      'Kebocoran, rasa berat atau sakit semasa atau selepas bersenam ialah tanda bahawa anda perlu memperlahankan langkah dan mendapatkan nasihat sebelum meningkatkan keamatan.',

    s10Heading: 'Bila untuk berjumpa pakar?',
    s10Body1:
      'Pemulihan dasar pelvis bersama bidan atau ahli fisioterapi boleh membantu jika anda tidak pasti sama ada anda mengecutkan dengan betul, jika simptom anda berterusan atau jika anda ingin menyambung semula aktiviti fizikal tertentu dengan yakin.',
    questionCardTitle: 'Soalan berguna untuk ditanya',
    appointmentQuestions: [
      'Adakah simptom saya konsisten dengan kelemahan dasar pelvis?',
      'Adakah saya melakukan pengecutan dengan betul?',
      'Berapa banyak ulangan yang perlu saya lakukan setiap hari?',
      'Bolehkah saya kembali berlari, bersukan atau bersenam berimpak tinggi?',
      'Adakah saya memerlukan pemulihan bersama bidan atau ahli fisioterapi?',
      'Adakah parut, koyakan atau pembedahan Caesarean saya memerlukan sebarang langkah berjaga-jaga khusus?',
    ],
    s10TipTitle: 'Elok diketahui',
    s10TipText:
      'Berjumpa pengamal profesional tidak semestinya bermakna ada sesuatu yang tidak kena. Satu sesi boleh sekadar membantu menyemak teknik anda, menilai pemulihan anda dan belajar maju dengan betul.',

    s11Heading: 'Pemulihan yang mengambil masa',
    s11Body1:
      'Selepas bersalin, adalah normal untuk tidak serta-merta mendapatkan semula deria atau kekuatan otot yang sama seperti sebelum kehamilan.',
    s11Body2:
      'Matlamatnya bukan untuk melakukan sebanyak mungkin pengecutan. Ia lebih kepada mendapatkan semula penyelarasan yang baik antara pengecutan dan relaksasi secara beransur-ansur, dan kemudian dapat menggunakan otot-otot ini secara semula jadi dalam aktiviti harian.',
    s11HighlightTitle: 'Kemajuan kecil ialah kemajuan sebenar',
    s11HighlightText:
      'Kesedaran yang lebih baik terhadap pergerakan, beberapa saat tambahan pengecutan atau pengurangan kebocoran sudah merupakan tanda yang menggalakkan.',

    s12Heading: 'Perkara penting untuk diingat',
    summaryTitle: 'Perkara penting',
    summaryItems: [
      'Kehamilan dan bersalin meletakkan tekanan yang ketara pada dasar pelvis.',
      'Pemulihan secara beransur-ansur adalah normal selepas bersalin.',
      'Senaman perlu mengutamakan kualiti pergerakan berbanding kekuatan.',
      'Pernafasan dan relaksasi sama pentingnya dengan pengecutan.',
      'Kebocoran air kencing, rasa berat atau sakit yang berterusan wajar mendapat pendapat profesional.',
      'Pemulihan bersama bidan atau ahli fisioterapi boleh membantu anda mendapatkan semula kawalan yang lebih baik.',
      'Kembali bersukan perlu dilakukan secara beransur-ansur, terutamanya untuk aktiviti berimpak tinggi.',
    ],

    finalTipTitle: 'Luangkan masa untuk pulih',
    finalTipText:
      'Selepas bersalin, tubuh anda telah melalui banyak perubahan. Perineum wajar mendapat perhatian yang sama seperti seluruh tubuh anda yang lain: secara beransur-ansur, secara tetap dan tanpa tekanan.',

    disclaimerText:
      'Artikel ini hanya untuk tujuan maklumat dan tidak menggantikan nasihat perubatan yang diperibadikan. Jika anda mengalami sakit, simptom yang berterusan atau mempunyai sebarang kebimbangan tentang pemulihan anda, dapatkan nasihat daripada pengamal penjagaan kesihatan.',
  },
  so: {
    badge: 'DHALMADA KA DIB • BOGSIIN',
    title: 'Xoojinta murqaha miskaha\ndhalmada ka dib',
    metaDuration: '8 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro:
      'Uurka iyo dhalmada ka dib, murqaha miskuhu waxay u baahan yihiin waqti si ay u bogsadaan. Layliyo fudud, joogto ah, oo tartiib ah ayaa kaa caawin kara inaad dib u hesho xoog, xakameyn, iyo kalsooni, adigoon isku dayin inaad wax degdegiso.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Fahamka doorka perineum-ka',
      'Sababta dhalmadu u culaysiso',
      'Goorta la bilaabo dib-u-habaynta murqaha miskaha',
      'Barashada isku-uruurinta saxda ah',
      'Dhisidda nidaam tartiib ah',
      'Khaladaadka laga fogaado',
      'Goorta caawimaad la weydiisto',
      'Dib u bilaabista isboorti tartiib ah',
      'U diyaargarowga ballan',
      'Qodobbada muhiimka ah',
    ],
    shareMessage: 'Xoojinta murqaha miskaha dhalmada ka dib — AWA',

    s1Heading: 'Fahamka doorka perineum-ka',
    s1Body1:
      'Perineum-ka, oo sidoo kale loo yaqaan murqaha miskaha, waa koox murqo ah oo ku yaal salka miskaha. Wuxuu leeyahay door xakameynta kaadiheysta iyo mindhicirka wuxuuna caawiyaa taageeridda xubnaha miskaha.',
    s1Body2:
      'Inta uurka lagu jiro, murqahan waa inay sidaan culeys dheeraad ah dhowr bilood. Waxaa sidoo kale lagu saaraa culays weyn inta dhalmada lagu jiro.',
    s1HighlightTitle: 'Muruq qarsoon laakiin lagama maarmaan ah',
    s1HighlightText:
      'Murqaha miskaha waxay ku lug leeyihiin dhowr shaqo oo maalinle ah: haysashada kaadida iyo saxarada, xakameynta gaaska, taageeridda xubnaha miskaha, iyo ciyaaridda door shaqooyin galmo oo qaar.',

    benefitsHeading: 'Faa’iidooyinka murqaha miskaha oo xoogaystay',
    benefitsIntro:
      'Xoojin tartiib ah, oo si sax ah loo sameeyey, ayaa caawin karta hagaajinta xakameynta iyo taageerada murqaha miskaha.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Xakameyn kaadi-heysto oo ka wanaagsan',
        text: 'Murqaha miskaha waxay leeyihiin door xakameynta kaadi-haysta. Xoojintooda tartiib ah ayaa caawin karta yareynta daadadka kaadida qaarkood.',
      },
      {
        icon: 'toilet',
        title: 'Taageeridda shaqada mindhicirka',
        text: 'Murqahani waxay sidoo kale caawiyaan xakameynta gaaska iyo saxarada waxayna gacan ka geystaan taageeridda xubnaha miskaha.',
      },
      {
        icon: 'human-female',
        title: 'Taageeridda xubnaha miskaha',
        text: 'Murqaha miskaha waxay samaystaan salka murqo dhab ah oo caawiya taageeridda kaadi-haysta, ilmo-galeenka, iyo mindhicirka.',
      },
      {
        icon: 'heart-pulse',
        title: 'Dib u helista dareenka tartiib ah',
        text: 'Dib-u-habayn ku habboon ayaa sidoo kale kaa caawin karta inaad dib u hesho wacyi iyo xakameyn ka wanaagsan oo meeshan ah.',
      },
    ],

    s2Heading: 'Sababta uurka iyo dhalmadu u culaysiyaan',
    s2Body1:
      'Uurku wuxuu tartiib u saaraa cadaadis dheeraad ah murqaha miskaha. Dhalmada xiniinyaha ayaa markaas si weyn u fidin karta murqaha iyo unugyada aagan.',
    s2Body2:
      'Qalliinka cesarean sidoo kale gabi ahaanba ma badbaadiyo murqaha miskaha: uurku laftiisa wuxuu weli yahay muddo muhiim ah murqahan.',
    s2Body3:
      'Dhalmada ka dib, sidaa darteed waa caadi in bogsiintu qaadato waqti. Dumarka qaar kuma dareemaan wax astaamo ah, kuwo kale na waxay ogaan karaan daad, dareen culays, ama xakameyn murqo oo hoos u dhacday.',
    s2TipTitle: 'Bogsiin kastaa waa ka duwan tahay',
    s2TipText:
      'Nooca dhalmada, kala-jeexid ama episiotomy, jiritaanka xanuun, iyo xaaladdaada guud dhalmada ka dib dhammaantood waxay saameyn karaan bogsiinta.',

    s3Heading: 'Goorta la bilaabo dib-u-habaynta murqaha miskaha?',
    s3Body1:
      'Dhalmo aan murugo lahayn ka dib, isku-uruurin jilicsan oo murqaha miskaha ah inta badan waa la bilaabi karaa tartiib. Weli waa muhiim in layliyada lagu habeeyo xaaladdaada oo talo la raadsado haddii aad la kulantay dhibaato, xanuun weyn, ama habraac gaar ah.',
    s3Body2:
      'Haddii aad leedahay tuubo kaadi, talooyin qaar ayaa soo jeedinaya in la sugo ilaa la saaro oo kaadi caadi ah dib u bilaabato ka hor layliyada perineum-ka.',
    s3AlertTitle: 'Ha ku riixin xanuun',
    s3AlertText:
      'Xanuun weyn, astaamo sii xumaanaya, nabar si xun u bogsanaya, ama walaac kasta oo gaar ah wuxuu u baahan yahay talo umulis, dhakhtar, ama xirfadle dib-u-habayn.',

    s4Heading: 'Barashada isku-uruurinta saxda ah',
    s4Body1:
      'Si aad u aqoonsato dhaqdhaqaaqa, qiyaas inaad isku daydayso inaad haysato gaas iyo rabitaanka kaadida isku mar. Dhaqdhaqaaqa aad raadinayso waa dareen isku-uruurin iyo kor u qaadid gudaha ah.',
    s4Body2:
      'Ujeeddadu maaha inaad jidhkaaga oo dhan si adag u xidhidh. Dhabannadaada, bowdooyinkaaga, iyo caloosha waa inay u sii nasanayaan sida ugu macquulsan, halka neefsashadu caadi u socoto.',
    exercises: [
      {icon: 'weather-windy', label: 'Neefsasho'},
      {icon: 'human-handsup', label: 'Isku-uruurin jilicsan'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Isku-uruurin dheer'},
      {icon: 'gesture-tap-button', label: 'Isku-uruurin degdeg ah'},
    ],
    s4HighlightTitle: 'Nasashadu waa muhiim sida isku-uruurintu',
    s4HighlightText:
      'Isku-uruurin kasta ka dib, murqaha si buuxda uga nasasii. Dib-u-habayn wanaagsan macnaheedu maaha haynta perineum-ka oo isku-uruursan maalinta oo dhan.',

    s5Heading: 'Dhisidda nidaam tartiib ah',
    s5Body1:
      'Bilowga, waxa ugu muhiimsan waa barashada aqoonsiga murqaha iyo sameynta dhaqdhaqaaqa si sax ah. Joogtayntu way ka muhiim badan tahay xoogga.',
    s5h3a: 'Isku-uruurin dheer',
    s5Body2:
      'Si jilicsan u isku uruuri murqaha miskaha, ka dibna hay isku-uruurinta dhowr ilbiriqsi adigoon neefta haynin. Kadibna si buuxda u sii daa ka hor intaadan mar kale bilaabin.',
    s5h3b: 'Isku-uruurin gaaban',
    s5Body3:
      'Marka dhaqdhaqaaqa la bartay, isku-uruurin degdeg ah oo yaryar ayaa lagu dari karaa. Waxay tababaraan awoodda isku-uruurinta murqaha si degdeg ah marka cadaadiska caloosha kordho, tusaale ahaan ka hor qufaca ama hindhisada.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Layliyada ku xidh caado maalinle ah'},
      {icon: 'human-sitting', label: 'Ku bilow jag raaxo leh'},
      {icon: 'weather-windy', label: 'Si caadi ah u neefso inta isku-uruurinta lagu jiro'},
      {icon: 'sleep', label: 'Ixtiraam marxaladaha nasashada'},
      {icon: 'chart-line', label: 'Tartiib u kordhi adkaanta'},
      {icon: 'doctor', label: 'Weydiiso talo haddii aadan hubin'},
    ],
    s5TipTitle: 'Joogtayn ka sarraysa wax kasta',
    s5TipText:
      'Isku xidhidda layliyada caado hore u jirta maalintaada waxay fududayn kartaa joogtaynta: nuujinta ka dib, ilkaha dhaqidda ka dib, ama waqti kale oo kuu habboon.',

    s6Heading: 'Khaladaadka caadiga ah ee laga fogaado',
    s6Body1:
      'Layliyada perineum-ku waxay u muuqdaan kuwo fudud, laakiin way fududahay in lagu magdhow murqo kale ama in si xad dhaaf ah la riixo.',
    commonMistakes: [
      'Xidhidhidda dhabannada ama bowdooyinka halkii murqaha miskaha',
      'Haynta neefta inta isku-uruurinta socoto',
      'Haynta murqaha isku-uruursan si joogto ah adigoon u oggolaanin inay nasadaan',
      'Samaynta layliyada dhowr maalmood oo keliya ka dibna joojin',
      'Si ula kac ah u joojinta durdurka kaadida si loo hubiyo isku-uruurinta',
    ],
    s6TipTitle: 'Waxa aan la samayn',
    s6TipText:
      'Looma taliyo in layliyada lagu sameeyo si ula kac ah u joojinta durdurka kaadida. Habkani perineum-ka si sax ah uma tababaro wuxuuna carqaladayn karaa shaqada caadiga ah ee kaadi-haysta.',

    s7Heading: 'Astaamaha maxay tahay inay keenaan la-talin?',
    s7Body1:
      'Daad yar ama dareen aan caadi ahayn ayaa mararka qaarkood soo muuqan kara dhalmada ka dib. Si kastaba, waa inaan la iska indho tirin haddii ay sii socdaan, xumaadaan, ama ay carqaladeeyaan nolol-maalmeedkaaga.',
    warningSigns: [
      'Daadka kaadida marka aad qufacdo, hindhisto, qoslo, ama dadaasho',
      'Dareen culays ama cadaadis miskaha hoose',
      'Dareen in qayb ama wax kale ay xiniinyaha ku soo dhacayaan',
      'Dhib haynta gaaska ama saxarada',
      'Xanuun sii socda perineum-ka',
      'Xanuun inta galmada lagu jiro ama ka dib',
      'Dhib aqoonsiga ama isku-uruurinta saxda ah ee murqaha perineum-ka',
    ],
    consultLabel: 'Goorma talo la raadsadaa?',
    s7Body2:
      'Umulis, dhakhtar, ama physiotherapist ku takhasusay dib-u-habaynta murqaha miskaha ayaa hubin kara shaqada murqaha oo soo jeedin kara barnaamij ku habboon.',

    s8Heading: 'Iyo kala-jeexid, episiotomy, ama qalliin cesarean ka dib?',
    s8Body1:
      'Kala-jeexid ama episiotomy waxay u baahan tahay daryeel gaar ah inta bogsiintu socoto. Dib u bilaabista hawlaha waa inay tixgelisaa xanuunka, xaaladda nabarka, iyo hagidda la bixiyey dhalmada ka dib.',
    s8Body2:
      'Qalliinka cesarean ka dib, bogsiintu waxay sidoo kale ku lug leedahay darbiga caloosha iyo nabarka. Xataa haddii dhalmadu aanay ahayn mid xiniinyo, uurku laftiisa wuxuu weli culays saaray murqaha miskaha.',
    s8HighlightTitle: 'Daryeel shakhsi ah ayaa caawin kara',
    s8HighlightText:
      'Xaaladda kala-jeexid weyn, xanuun, astaamo kaadi ama mindhicir, ama dhibaatooyin sii socda, qiimeyn xirfadle caafimaad ayaa si gaar ah faa’iido u yeelan karta.',

    s9Heading: 'Dib u bilaabista isboorti tartiib ah',
    s9Body1:
      'Dib u bilaabista dhaqdhaqaaqa dhalmada ka dib waa inay noqotaa mid tartiib ah. Socodka iyo dhaqdhaqaaqyada jilicsan guud ahaan waa la bilaabi karaa iyadoo ku xiran sida aad dareemayso, halka hawlaha saameyn weyn leh ay u baahan yihiin taxadar dheeraad ah.',
    s9Body2:
      'Ka hor dib u bilaabista orodka, boodboodka, ama tababar aad u xoog badan, waxaa ugu wanaagsan in la qiimeeyo bogsiinta murqaha miskaha oo la tixgeliyo astaamo kasta.',
    s9AlertTitle: 'Ha degdegin heerarka',
    s9AlertText:
      'Daad, dareen culays, ama xanuun inta layliga lagu jiro ama ka dib waa calaamado inaad hoos u dhigto oo aad talo raadsato ka hor intaadan kordhin xoogga.',

    s10Heading: 'Goorta takhasuse la arko?',
    s10Body1:
      'Dib-u-habaynta murqaha miskaha oo ay la sameyso umulis ama physiotherapist ayaa faa’iido yeelan karta haddii aadan hubin inaad si sax ah isku uruurinayso, haddii astaamahaagu sii socdaan, ama haddii aad rabto inaad si kalsooni leh dib ugu bilowdo hawlo jidheed oo qaar.',
    questionCardTitle: 'Su’aalo faa’iido leh oo la weydiiyo',
    appointmentQuestions: [
      'Astaamahaygu ma la jaan qaadaan daciifnimada murqaha miskaha?',
      'Ma si sax ah baan u samaynayaa isku-uruurinta?',
      'Imisa soo noqnoqod ayaan maalin kasta sameeyaa?',
      'Ma ku laaban karaa orodka, isboortiga, ama layli saameyn weyn leh?',
      'Ma u baahanahay dib-u-habayn umulis ama physiotherapist?',
      'Nabarkayga, kala-jeexidkayga, ama qalliinkayga cesarean ma u baahan yahay taxadarro gaar ah?',
    ],
    s10TipTitle: 'Waxtar leh in la ogaado',
    s10TipText:
      'Aragga xirfadle macnaheedu maaha lagama maarmaan inay wax khalad ah jiraan. Fadhi ayaa si fudud u caawin kara hubinta farsamadaada, qiimeynta bogsiintaada, iyo barashada sida si sax ah loo horumariyo.',

    s11Heading: 'Bogsiin qaadanaysa waqti',
    s11Body1:
      'Dhalmada ka dib, waa caadi inaadan isla markiiba dib u helin dareennada ama xoogga murqaha isku mid ah ee aad lahayd ka hor uurka.',
    s11Body2:
      'Ujeeddadu maaha inaad sameyso isku-uruurin intii suurtagal ah. Waxay inta badan ku saabsan tahay dib u helista tartiib ah isku-duwidda wanaagsan ee u dhexeysa isku-uruurinta iyo nasashada, ka dibna awoodda aad ku isticmaasho murqahan si dabiici ah hawlaha maalinlaha ah.',
    s11HighlightTitle: 'Horumar yar waa horumar dhab ah',
    s11HighlightText:
      'Wacyi ka wanaagsan oo dhaqdhaqaaqa ah, dhowr ilbiriqsi oo dheeraad ah oo isku-uruurin ah, ama yareynta daadka waa calaamado dhiirrigelin ah.',

    s12Heading: 'Qodobbada muhiimka ah',
    summaryTitle: 'Waxa muhiimka ah',
    summaryItems: [
      'Uurka iyo dhalmadu waxay culays weyn saaraan murqaha miskaha.',
      'Bogsiin tartiib ah waa caadi dhalmada ka dib.',
      'Layliyadu waa inay mudnaan siiyaan tayada dhaqdhaqaaqa halkii xoogga.',
      'Neefsashada iyo nasashadu waa muhiim sida isku-uruurinta.',
      'Daadka kaadida, culayska, ama xanuunka sii socda wuxuu mudan yahay ra’yi xirfadle.',
      'Dib-u-habayn umulis ama physiotherapist ayaa kaa caawin karta inaad dib u hesho xakameyn ka wanaagsan.',
      'Ku laabashada isboortigu waa inay noqotaa mid tartiib ah, gaar ahaan hawlaha saameynta weyn leh.',
    ],

    finalTipTitle: 'Qaado waqtiga aad ku bogsato',
    finalTipText:
      'Dhalmada ka dib, jidhkaagu wuxuu maray isbeddelo badan. Perineum-ku wuxuu mudan yahay isla feejignaanta jidhkaaga inta kale: tartiib, si joogto ah, oo cadaadis la’aan.',

    disclaimerText:
      'Maqaalkan waa macluumaad oo keliya mana bedelo talo caafimaad oo shakhsi ah. Haddii aad la kulanto xanuun, astaamo sii socda, ama aad leedahay walaac kasta oo ku saabsan bogsiintaada, talo ka raadso xirfadle caafimaad.',
  },
  sw: {
    badge: 'BAADA YA KUJIFUNGUA • KUPONA',
    title: 'Kuimarisha misuli ya sakafu ya nyonga\nbaada ya kujifungua',
    metaDuration: 'Dakika 8 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro:
      'Baada ya ujauzito na kujifungua, sakafu ya nyonga inahitaji muda kupona. Mazoezi rahisi, ya mara kwa mara, na ya polepole yanaweza kukusaidia kurejesha nguvu, udhibiti, na kujiamini, bila kujaribu kuharakisha mambo.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kuelewa nafasi ya msamba',
      'Kwa nini kujifungua kunaiweka chini ya mkazo',
      'Wakati wa kuanza ukarabati wa sakafu ya nyonga',
      'Kujifunza kukaza misuli ipasavyo',
      'Kujenga utaratibu wa polepole',
      'Makosa ya kuepuka',
      'Wakati wa kuomba msaada',
      'Kurejea polepole kwenye michezo',
      'Kujiandaa kwa miadi',
      'Mambo muhimu ya kukumbuka',
    ],
    shareMessage: 'Kuimarisha misuli ya sakafu ya nyonga baada ya kujifungua — AWA',

    s1Heading: 'Kuelewa nafasi ya msamba',
    s1Body1:
      'Msamba, unaoitwa pia sakafu ya nyonga, ni kundi la misuli iliyo chini ya nyonga. Una nafasi katika kudhibiti kibofu cha mkojo na utumbo na husaidia kushikilia viungo vya nyonga.',
    s1Body2:
      'Wakati wa ujauzito, misuli hii hulazimika kubeba uzito wa ziada kwa miezi kadhaa. Pia huwekwa chini ya mkazo mkubwa wakati wa kujifungua.',
    s1HighlightTitle: 'Msuli wa siri lakini muhimu',
    s1HighlightText:
      'Sakafu ya nyonga inahusika katika shughuli kadhaa za kila siku: kuzuia mkojo na kinyesi, kudhibiti gesi, kushikilia viungo vya nyonga, na kuwa na nafasi katika kazi fulani za kingono.',

    benefitsHeading: 'Faida za sakafu ya nyonga iliyoimarika',
    benefitsIntro:
      'Kuimarisha kwa polepole na kufanywa ipasavyo kunaweza kusaidia kuboresha udhibiti na usaidizi wa sakafu ya nyonga.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Udhibiti bora wa kibofu cha mkojo',
        text: 'Sakafu ya nyonga ina nafasi katika kudhibiti kibofu cha mkojo. Kuiimarisha polepole kunaweza kusaidia kupunguza baadhi ya kuvuja kwa mkojo.',
      },
      {
        icon: 'toilet',
        title: 'Kusaidia utendaji wa utumbo',
        text: 'Misuli hii pia husaidia kudhibiti gesi na kinyesi na huchangia kushikilia viungo vya nyonga.',
      },
      {
        icon: 'human-female',
        title: 'Kushikilia viungo vya nyonga',
        text: 'Sakafu ya nyonga huunda msingi halisi wa misuli unaosaidia kushikilia kibofu cha mkojo, mji wa uzazi, na utumbo.',
      },
      {
        icon: 'heart-pulse',
        title: 'Kurejesha hisia polepole',
        text: 'Ukarabati unaofaa pia unaweza kukusaidia kurejesha ufahamu na udhibiti bora wa eneo hili.',
      },
    ],

    s2Heading: 'Kwa nini ujauzito na kujifungua vinaiweka chini ya mkazo',
    s2Body1:
      'Ujauzito polepole huweka shinikizo zaidi kwenye sakafu ya nyonga. Kujifungua kwa njia ya kawaida kunaweza basi kunyoosha kwa kiasi kikubwa misuli na tishu za eneo hili.',
    s2Body2:
      'Upasuaji wa kujifungua pia hauiepushi kabisa sakafu ya nyonga: ujauzito wenyewe unabaki kuwa kipindi muhimu kwa misuli hii.',
    s2Body3:
      'Baada ya kuzaliwa, kwa hiyo ni kawaida kwamba kupona kuchukue muda. Baadhi ya wanawake karibu hawahisi dalili, huku wengine wakiona kuvuja, hisia ya uzito, au udhibiti uliopungua wa misuli.',
    s2TipTitle: 'Kila kupona ni tofauti',
    s2TipText:
      'Aina ya kujifungua, mpasuko au kukata msamba, uwepo wa maumivu, na hali yako ya jumla baada ya kujifungua vyote vinaweza kuathiri kupona.',

    s3Heading: 'Wakati wa kuanza ukarabati wa sakafu ya nyonga?',
    s3Body1:
      'Baada ya kujifungua bila matatizo, mikazo myepesi ya sakafu ya nyonga kwa kawaida inaweza kuanza tena polepole. Inabaki muhimu kurekebisha mazoezi kulingana na hali yako na kutafuta ushauri ikiwa ulipata tatizo, maumivu makubwa, au utaratibu maalum.',
    s3Body2:
      'Ikiwa una katheta ya mkojo, baadhi ya mapendekezo yanashauri kusubiri hadi iondolewe na kukojoa kawaida kuanze tena kabla ya kuanza mazoezi ya msamba.',
    s3AlertTitle: 'Usilazimishe kupitia maumivu',
    s3AlertText:
      'Maumivu makubwa, dalili zinazozidi kuwa mbaya, kidonda kinachopona vibaya, au wasiwasi wowote maalum vinahitaji ushauri wa mkunga, daktari, au mtaalamu wa ukarabati.',

    s4Heading: 'Kujifunza kukaza misuli ipasavyo',
    s4Body1:
      'Ili kutambua mwendo, fikiria unajaribu kuzuia gesi na hamu ya kukojoa kwa wakati mmoja. Mwendo unaoutafuta ni hisia ya kukaza na kuvuta kuelekea ndani.',
    s4Body2:
      'Lengo si kukaza mwili wako wote kwa nguvu. Matako, mapaja, na misuli ya tumbo vinapaswa kubaki vimetulia iwezekanavyo, huku kupumua kukiendelea kawaida.',
    exercises: [
      {icon: 'weather-windy', label: 'Kupumua'},
      {icon: 'human-handsup', label: 'Kukaza kwa upole'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Kukaza kwa muda mrefu'},
      {icon: 'gesture-tap-button', label: 'Kukaza kwa haraka'},
    ],
    s4HighlightTitle: 'Kutulia ni muhimu sawa',
    s4HighlightText:
      'Baada ya kila kukaza, acha misuli itulie kabisa. Ukarabati mzuri haumaanishi kukaza msamba siku nzima.',

    s5Heading: 'Kujenga utaratibu wa polepole',
    s5Body1:
      'Mwanzoni, jambo muhimu zaidi ni kujifunza kutambua misuli na kufanya mwendo ipasavyo. Uthabiti ni muhimu zaidi kuliko ukali.',
    s5h3a: 'Kukaza kwa muda mrefu',
    s5Body2:
      'Kaza kwa upole sakafu ya nyonga, kisha shikilia kukaza kwa sekunde chache bila kushika pumzi. Kisha achilia kabisa kabla ya kuanza tena.',
    s5h3b: 'Kukaza kwa muda mfupi',
    s5Body3:
      'Mwendo ukishafahamika, kukaza kwa haraka kwa kiasi kidogo kunaweza kuongezwa. Kunasaidia kufunza uwezo wako wa kukaza misuli haraka shinikizo la tumbo linapoongezeka, kwa mfano mara kabla ya kukohoa au kupiga chafya.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Unganisha mazoezi na tabia ya kila siku'},
      {icon: 'human-sitting', label: 'Anza katika mkao wa faraja'},
      {icon: 'weather-windy', label: 'Pumua kawaida wakati wa kukaza'},
      {icon: 'sleep', label: 'Heshimu awamu za kutulia'},
      {icon: 'chart-line', label: 'Ongeza ugumu polepole'},
      {icon: 'doctor', label: 'Omba ushauri ikiwa huna uhakika'},
    ],
    s5TipTitle: 'Uthabiti kwanza',
    s5TipText:
      'Kuunganisha mazoezi na tabia ambayo tayari ni sehemu ya siku yako kunaweza kurahisisha kuwa thabiti: baada ya kunyonyesha, baada ya kupiga mswaki, au wakati mwingine unaokufaa.',

    s6Heading: 'Makosa ya kawaida ya kuepuka',
    s6Body1:
      'Mazoezi ya msamba yanaweza kuonekana rahisi, lakini ni rahisi kufidia kwa misuli mingine au kulazimisha sana.',
    commonMistakes: [
      'Kukaza matako au mapaja badala ya sakafu ya nyonga',
      'Kushika pumzi wakati wa kukaza',
      'Kuweka misuli ikiwa imekazwa mfululizo bila kuiacha itulie',
      'Kufanya mazoezi kwa siku chache tu kisha kuacha',
      'Kusimamisha mtiririko wa mkojo kwa makusudi ili kukagua kukaza',
    ],
    s6TipTitle: 'Cha kutofanya',
    s6TipText:
      'Haipendekezwi kufanya mazoezi kwa kusimamisha mtiririko wa mkojo wako kwa makusudi. Njia hii haifundishi msamba ipasavyo na inaweza kuvuruga utendaji wa kawaida wa kibofu cha mkojo.',

    s7Heading: 'Dalili zipi zinapaswa kusababisha mashauriano?',
    s7Body1:
      'Kuvuja kidogo au hisia isiyo ya kawaida wakati mwingine kunaweza kuonekana baada ya kujifungua. Hata hivyo, hakupaswi kupuuzwa ikiwa kunaendelea, kunazidi, au kunaingilia maisha yako ya kila siku.',
    warningSigns: [
      'Kuvuja kwa mkojo unapokohoa, kupiga chafya, kucheka, au kujikaza',
      'Hisia ya uzito au shinikizo kwenye sehemu ya chini ya nyonga',
      'Hisia kwamba donge au kitu kinashuka ukeni',
      'Ugumu wa kuzuia gesi au kinyesi',
      'Maumivu ya kuendelea kwenye msamba',
      'Maumivu wakati wa tendo la ndoa au baada yake',
      'Ugumu wa kutambua au kukaza ipasavyo misuli ya msamba',
    ],
    consultLabel: 'Wakati gani utafute ushauri?',
    s7Body2:
      'Mkunga, daktari, au mtaalamu wa tiba ya viungo aliyebobea katika ukarabati wa sakafu ya nyonga anaweza kukagua utendaji wa misuli na kupendekeza programu inayofaa.',

    s8Heading: 'Na baada ya mpasuko, kukatwa msamba, au upasuaji wa kujifungua?',
    s8Body1:
      'Mpasuko au kukatwa msamba kunahitaji uangalifu maalum wakati wa kupona. Kurejea kwenye shughuli kunapaswa kuzingatia maumivu, hali ya kovu, na mwongozo uliotolewa baada ya kujifungua.',
    s8Body2:
      'Baada ya upasuaji wa kujifungua, kupona pia kunahusisha ukuta wa tumbo na kovu. Hata kama kuzaliwa hakukuwa kwa njia ya kawaida, ujauzito wenyewe bado uliweka mkazo kwenye sakafu ya nyonga.',
    s8HighlightTitle: 'Huduma iliyobinafsishwa inaweza kusaidia',
    s8HighlightText:
      'Katika hali ya mpasuko mkubwa, maumivu, dalili za mkojo au utumbo, au matatizo ya kuendelea, tathmini na mtaalamu wa afya inaweza kuwa ya manufaa hasa.',

    s9Heading: 'Kurejea polepole kwenye michezo',
    s9Body1:
      'Kurejea kwenye mwendo baada ya kujifungua kunapaswa kuwa polepole. Kutembea na mienendo myepesi kwa kawaida kunaweza kuanza tena kulingana na jinsi unavyojisikia, huku shughuli zenye mshtuko mkubwa zikihitaji tahadhari zaidi.',
    s9Body2:
      'Kabla ya kuanza tena kukimbia, kuruka, au mazoezi makali sana, ni bora kutathmini kupona kwa sakafu ya nyonga na kuzingatia dalili zozote.',
    s9AlertTitle: 'Usiharakishe hatua',
    s9AlertText:
      'Kuvuja, hisia ya uzito, au maumivu wakati wa mazoezi au baada yake ni dalili kwamba unapaswa kupunguza mwendo na kutafuta ushauri kabla ya kuongeza ukali.',

    s10Heading: 'Wakati wa kumwona mtaalamu?',
    s10Body1:
      'Ukarabati wa sakafu ya nyonga na mkunga au mtaalamu wa tiba ya viungo unaweza kuwa wa manufaa ikiwa huna uhakika kama unakaza ipasavyo, dalili zako zinaendelea, au unataka kuanza tena shughuli fulani za mwili kwa kujiamini.',
    questionCardTitle: 'Maswali yenye manufaa ya kuuliza',
    appointmentQuestions: [
      'Je, dalili zangu zinaendana na udhaifu wa sakafu ya nyonga?',
      'Je, ninafanya mikazo ipasavyo?',
      'Ninapaswa kurudia mara ngapi kila siku?',
      'Je, naweza kurudi kukimbia, michezo, au mazoezi yenye mshtuko mkubwa?',
      'Je, ninahitaji ukarabati na mkunga au mtaalamu wa tiba ya viungo?',
      'Je, kovu langu, mpasuko, au upasuaji wangu wa kujifungua unahitaji tahadhari zozote maalum?',
    ],
    s10TipTitle: 'Vyema kujua',
    s10TipText:
      'Kumwona mtaalamu haimaanishi lazima kuna tatizo. Kipindi kimoja kinaweza kusaidia tu kukagua mbinu yako, kutathmini kupona kwako, na kujifunza kuendelea ipasavyo.',

    s11Heading: 'Kupona kunakochukua muda',
    s11Body1:
      'Baada ya kujifungua, ni kawaida kutorejesha mara moja hisia au nguvu ile ile ya misuli uliyokuwa nayo kabla ya ujauzito.',
    s11Body2:
      'Lengo si kufanya mikazo mingi iwezekanavyo. Ni zaidi kurejesha polepole uratibu mzuri kati ya kukaza na kutulia, kisha kuweza kutumia misuli hii kiasili katika shughuli za kila siku.',
    s11HighlightTitle: 'Maendeleo madogo ni maendeleo halisi',
    s11HighlightText:
      'Ufahamu bora wa mwendo, sekunde chache zaidi za kukaza, au kupungua kwa kuvuja tayari ni dalili za kutia moyo.',

    s12Heading: 'Mambo muhimu ya kukumbuka',
    summaryTitle: 'Mambo ya msingi',
    summaryItems: [
      'Ujauzito na kujifungua huweka mkazo mkubwa kwenye sakafu ya nyonga.',
      'Kupona polepole ni jambo la kawaida baada ya kujifungua.',
      'Mazoezi yanapaswa kupa kipaumbele ubora wa mwendo kuliko nguvu.',
      'Kupumua na kutulia ni muhimu sawa na kukaza.',
      'Kuvuja kwa mkojo, uzito, au maumivu ya kuendelea vinastahili maoni ya kitaalamu.',
      'Ukarabati na mkunga au mtaalamu wa tiba ya viungo unaweza kukusaidia kurejesha udhibiti bora.',
      'Kurudi kwenye michezo kunapaswa kuwa polepole, hasa kwa shughuli zenye mshtuko mkubwa.',
    ],

    finalTipTitle: 'Chukua muda wa kupona',
    finalTipText:
      'Baada ya kujifungua, mwili wako umepitia mabadiliko mengi. Msamba unastahili uangalizi sawa na sehemu nyingine ya mwili wako: polepole, mara kwa mara, na bila shinikizo.',

    disclaimerText:
      'Makala hii ni kwa madhumuni ya taarifa tu na haichukui nafasi ya ushauri wa kitabibu uliobinafsishwa. Ukipata maumivu, dalili zinazoendelea, au una wasiwasi wowote kuhusu kupona kwako, tafuta ushauri wa mtaalamu wa afya.',
  },
  kk: {
    badge: 'БОСАНҒАННАН КЕЙІН • ҚАЛПЫНА КЕЛУ',
    title: 'Босанғаннан кейін жамбас еденінің\nбұлшықеттерін нығайту',
    metaDuration: '8 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro:
      'Жүктілік пен босанудан кейін жамбас едені қалпына келуге уақыт қажет етеді. Қарапайым, тұрақты және біртіндеп жасалатын жаттығулар істі асықтырмай, күш-қуатты, бақылауды және сенімділікті қайтаруға көмектесе алады.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Шап аймағының рөлін түсіну',
      'Босану оны неге қатты жүктейді',
      'Жамбас еденін қалпына келтіруді қашан бастау керек',
      'Дұрыс жиырылуды үйрену',
      'Біртіндеп тәртіп құру',
      'Болдырмайтын қателер',
      'Көмекті қашан сұрау керек',
      'Спортқа біртіндеп оралу',
      'Қабылдауға дайындалу',
      'Негізгі қорытындылар',
    ],
    shareMessage: 'Босанғаннан кейін жамбас еденінің бұлшықеттерін нығайту — AWA',

    s1Heading: 'Шап аймағының рөлін түсіну',
    s1Body1:
      'Шап аймағы, жамбас едені деп те аталады, жамбастың түбінде орналасқан бұлшықеттер тобы. Ол қуық пен ішектің бақылауында рөл атқарады және жамбас ағзаларын ұстап тұруға көмектеседі.',
    s1Body2:
      'Жүктілік кезінде бұл бұлшықеттер бірнеше ай бойы қосымша салмақты көтеруге мәжбүр болады. Олар босану кезінде де айтарлықтай күйзеліске ұшырайды.',
    s1HighlightTitle: 'Көрінбейтін, бірақ маңызды бұлшықет',
    s1HighlightText:
      'Жамбас едені бірнеше күнделікті қызметке қатысады: зәр мен нәжісті ұстау, газдарды бақылау, жамбас ағзаларын ұстап тұру және кейбір жыныстық қызметтерде рөл атқару.',

    benefitsHeading: 'Күшейтілген жамбас еденінің пайдасы',
    benefitsIntro:
      'Біртіндеп, дұрыс орындалған нығайту жамбас еденінің бақылауы мен қолдауын жақсартуға көмектесе алады.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Қуықты жақсырақ бақылау',
        text: 'Жамбас едені қуықты бақылауда рөл атқарады. Оны біртіндеп нығайту кейбір зәр ағуын азайтуға көмектесуі мүмкін.',
      },
      {
        icon: 'toilet',
        title: 'Ішек қызметін қолдау',
        text: 'Бұл бұлшықеттер газдар мен нәжісті бақылауға да көмектеседі және жамбас ағзаларын ұстап тұруға ықпал етеді.',
      },
      {
        icon: 'human-female',
        title: 'Жамбас ағзаларын қолдау',
        text: 'Жамбас едені қуықты, жатырды және ішекті ұстап тұруға көмектесетін нағыз бұлшықет негізін құрайды.',
      },
      {
        icon: 'heart-pulse',
        title: 'Сезімді біртіндеп қайтару',
        text: 'Тиісті қалпына келтіру бұл аймақты жақсырақ сезінуге және бақылауға қайтып оралуға да көмектесе алады.',
      },
    ],

    s2Heading: 'Жүктілік пен босану оны неге қатты жүктейді',
    s2Body1:
      'Жүктілік жамбас еденіне біртіндеп көбірек қысым түсіреді. Табиғи босану содан кейін осы аймақтың бұлшықеттері мен тіндерін айтарлықтай созуы мүмкін.',
    s2Body2:
      'Кесарь тілігі де жамбас еденін толық аямайды: жүктіліктің өзі осы бұлшықеттер үшін маңызды кезең болып қала береді.',
    s2Body3:
      'Сондықтан босанғаннан кейін қалпына келудің уақыт алуы қалыпты. Кейбір әйелдер дерлік белгі сезбейді, ал басқалары ағуды, ауырлық сезімін немесе бұлшықет бақылауының төмендеуін байқауы мүмкін.',
    s2TipTitle: 'Әр қалпына келу әртүрлі',
    s2TipText:
      'Босану түрі, жыртылу немесе эпизиотомия, ауырудың болуы және босанғаннан кейінгі жалпы жағдайыңыз қалпына келуге әсер етуі мүмкін.',

    s3Heading: 'Жамбас еденін қалпына келтіруді қашан бастау керек?',
    s3Body1:
      'Асқынусыз босанғаннан кейін жамбас еденінің жұмсақ жиырылуларын әдетте біртіндеп қайта бастауға болады. Жаттығуларды жағдайыңызға бейімдеу және асқыну, айтарлықтай ауыру немесе нақты процедура болса, кеңес алу маңызды болып қала береді.',
    s3Body2:
      'Зәр катетеріңіз болса, кейбір ұсыныстар шап аймағы жаттығуларын бастамас бұрын оны алып тастауды және қалыпты зәр шығарудың қайта басталуын күтуді ұсынады.',
    s3AlertTitle: 'Ауыруды жеңуге мәжбүрлемеңіз',
    s3AlertText:
      'Айтарлықтай ауыру, нашарлайтын белгілер, нашар жазылып жатқан жара немесе кез келген ерекше алаңдаушылық акушердің, дәрігердің немесе қалпына келтіру маманының кеңесін қажет етеді.',

    s4Heading: 'Дұрыс жиырылуды үйрену',
    s4Body1:
      'Қозғалысты анықтау үшін газ бен зәр шығару қалауын бір мезгілде ұстауға тырысып жатқаныңызды елестетіңіз. Сіз іздеп отырған қозғалыс — ішке қарай жиырылу және көтерілу сезімі.',
    s4Body2:
      'Мақсат — бүкіл денеңізді қатты кергіш емес. Бөксе, жамбас және құрсақ бұлшықеттері мүмкіндігінше босаң қалуы, ал тыныс алу қалыпты жалғасуы керек.',
    exercises: [
      {icon: 'weather-windy', label: 'Тыныс алу'},
      {icon: 'human-handsup', label: 'Жұмсақ жиырылу'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Ұзақ жиырылу'},
      {icon: 'gesture-tap-button', label: 'Жылдам жиырылулар'},
    ],
    s4HighlightTitle: 'Босаңсу да сондай маңызды',
    s4HighlightText:
      'Әр жиырылудан кейін бұлшықеттердің толық босаңсуына мүмкіндік беріңіз. Жақсы қалпына келтіру шап аймағын күні бойы жиырылған күйде ұстауды білдірмейді.',

    s5Heading: 'Біртіндеп тәртіп құру',
    s5Body1:
      'Басында ең маңыздысы — бұлшықеттерді анықтауды және қозғалысты дұрыс орындауды үйрену. Тұрақтылық қарқындылықтан маңыздырақ.',
    s5h3a: 'Ұзақ жиырылулар',
    s5Body2:
      'Жамбас еденін жұмсақ жиырыңыз, содан кейін тынысты ұстамай, жиырылуды бірнеше секунд ұстап тұрыңыз. Қайта бастамас бұрын толық босатыңыз.',
    s5h3b: 'Қысқа жиырылулар',
    s5Body3:
      'Қозғалыс игерілгеннен кейін шағын жылдам жиырылулар қосуға болады. Олар құрсақ қысымы артқанда, мысалы, жөтелу немесе түшкіру алдында, бұлшықеттерді тез жиыру қабілетін жаттықтыруға көмектеседі.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Жаттығуларды күнделікті әдетпен байланыстырыңыз'},
      {icon: 'human-sitting', label: 'Ыңғайлы қалыптан бастаңыз'},
      {icon: 'weather-windy', label: 'Жиырылу кезінде қалыпты тыныс алыңыз'},
      {icon: 'sleep', label: 'Босаңсу фазаларын құрметтеңіз'},
      {icon: 'chart-line', label: 'Қиындықты біртіндеп арттырыңыз'},
      {icon: 'doctor', label: 'Сенімсіз болсаңыз, кеңес сұраңыз'},
    ],
    s5TipTitle: 'Ең алдымен тұрақтылық',
    s5TipText:
      'Жаттығуларды күніңіздің бір бөлігі болып тұрған әдетпен байланыстыру тұрақты болуды жеңілдетуі мүмкін: емізуден кейін, тіс тазалаудан кейін немесе сізге ыңғайлы басқа уақытта.',

    s6Heading: 'Болдырмайтын жиі кездесетін қателер',
    s6Body1:
      'Шап аймағы жаттығулары қарапайым көрінуі мүмкін, бірақ басқа бұлшықеттермен өтеп кету немесе тым қатты күш салу оңай.',
    commonMistakes: [
      'Жамбас едені орнына бөксені немесе жамбасты кергу',
      'Жиырылу кезінде тынысты ұстау',
      'Бұлшықеттерді босатпай үнемі жиырылған күйде ұстау',
      'Жаттығуларды бірнеше күн ғана жасап, содан кейін тоқтату',
      'Жиырылуды тексеру үшін зәр ағынын әдейі тоқтату',
    ],
    s6TipTitle: 'Не істемеу керек',
    s6TipText:
      'Жаттығуларды зәр ағынын әдейі тоқтату арқылы жасау ұсынылмайды. Бұл әдіс шап аймағын дұрыс жаттықтырмайды және қуықтың қалыпты жұмысын бұзуы мүмкін.',

    s7Heading: 'Қандай белгілер консультацияға себеп болуы керек?',
    s7Body1:
      'Босанғаннан кейін шамалы ағу немесе әдеттен тыс сезім кейде пайда болуы мүмкін. Дегенмен, олар сақталса, нашарласа немесе күнделікті өміріңізге кедергі келтірсе, елемеуге болмайды.',
    warningSigns: [
      'Жөтелгенде, түшкіргенде, күлгенде немесе күш салғанда зәр ағуы',
      'Жамбастың төменгі бөлігінде ауырлық немесе қысым сезімі',
      'Қынапқа бір түйір немесе бірдеңе түсіп бара жатқан сезім',
      'Газды немесе нәжісті ұстаудағы қиындық',
      'Шап аймағындағы тұрақты ауыру',
      'Жыныстық қатынас кезінде немесе одан кейінгі ауыру',
      'Шап бұлшықеттерін анықтаудағы немесе дұрыс жиырудағы қиындық',
    ],
    consultLabel: 'Кеңесті қашан сұрау керек?',
    s7Body2:
      'Жамбас еденін қалпына келтіруге маманданған акушер, дәрігер немесе физиотерапевт бұлшықет қызметін тексеріп, тиісті бағдарламаны ұсына алады.',

    s8Heading: 'Ал жыртылудан, эпизиотомиядан немесе кесарь тілігінен кейін ше?',
    s8Body1:
      'Жыртылу немесе эпизиотомия жазылу кезінде ерекше күтімді қажет етеді. Белсенділікті қайта бастау ауыруды, тыртықтың жай-күйін және босанғаннан кейін берілген нұсқауды ескеруі керек.',
    s8Body2:
      'Кесарь тілігінен кейін қалпына келу құрсақ қабырғасы мен тыртықты да қамтиды. Босану табиғи болмаса да, жүктіліктің өзі жамбас еденіне күйзеліс түсірді.',
    s8HighlightTitle: 'Жекелендірілген күтім көмектесе алады',
    s8HighlightText:
      'Айтарлықтай жыртылу, ауыру, зәр немесе ішек белгілері не тұрақты қиындықтар болғанда, медицина маманымен бағалау әсіресе пайдалы болуы мүмкін.',

    s9Heading: 'Спортқа біртіндеп оралу',
    s9Body1:
      'Босанғаннан кейін қозғалысқа оралу біртіндеп болуы керек. Серуендеу және жұмсақ қозғалыстарды әдетте өзіңізді қалай сезінетініңізге қарай қайта бастауға болады, ал жоғары соққылы белсенділіктер көбірек сақтықты қажет етеді.',
    s9Body2:
      'Жүгіруді, секіруді немесе өте қарқынды жаттығуды қайта бастамас бұрын жамбас еденінің қалпына келуін бағалап, кез келген белгіні ескерген жөн.',
    s9AlertTitle: 'Кезеңдерді асықтырмаңыз',
    s9AlertText:
      'Жаттығу кезінде немесе одан кейінгі ағу, ауырлық сезімі немесе ауыру — қарқындылықты арттырмас бұрын баяулау және кеңес сұрау керек екенінің белгілері.',

    s10Heading: 'Маманға қашан бару керек?',
    s10Body1:
      'Акушермен немесе физиотерапевтпен жамбас еденін қалпына келтіру дұрыс жиырылатыныңызға сенімсіз болсаңыз, белгілеріңіз сақталса немесе белгілі бір дене белсенділігін сеніммен қайта бастағыңыз келсе, пайдалы болуы мүмкін.',
    questionCardTitle: 'Қоюға болатын пайдалы сұрақтар',
    appointmentQuestions: [
      'Белгілерім жамбас еденінің әлсіздігіне сәйкес келе ме?',
      'Мен жиырылуларды дұрыс орындап жатырмын ба?',
      'Күн сайын қанша қайталау жасауым керек?',
      'Жүгіруге, спортқа немесе жоғары соққылы жаттығуға қайта оралуға бола ма?',
      'Маған акушермен немесе физиотерапевтпен қалпына келтіру керек пе?',
      'Тыртығым, жыртылуым немесе кесарь тілігім қандай да бір ерекше сақтық шараларын қажет ете ме?',
    ],
    s10TipTitle: 'Білуге тиісті',
    s10TipText:
      'Маманға бару бірдеңе дұрыс емес дегенді міндетті түрде білдірмейді. Бір сеанс техникаңызды тексеруге, қалпына келуіңізді бағалауға және дұрыс алға жылжуды үйренуге көмектесе алады.',

    s11Heading: 'Уақыт алатын қалпына келу',
    s11Body1:
      'Босанғаннан кейін жүктілікке дейінгі сезімдер мен бұлшықет күшіне бірден қайта оралмау қалыпты.',
    s11Body2:
      'Мақсат — мүмкіндігінше көп жиырылу жасау емес. Бұл көбірек жиырылу мен босаңсу арасындағы жақсы үйлесімді біртіндеп қалпына келтіру, содан кейін бұл бұлшықеттерді күнделікті әрекеттерде табиғи түрде қолдана алу.',
    s11HighlightTitle: 'Шағын прогресс — нақты прогресс',
    s11HighlightText:
      'Қозғалысты жақсырақ сезіну, жиырылудың бірнеше секундқа ұзаруы немесе ағудың азаюы — қазірдің өзінде көңілге медеу беретін белгілер.',

    s12Heading: 'Негізгі қорытындылар',
    summaryTitle: 'Негізгі нәрселер',
    summaryItems: [
      'Жүктілік пен босану жамбас еденіне айтарлықтай күйзеліс түсіреді.',
      'Босанғаннан кейін біртіндеп қалпына келу қалыпты.',
      'Жаттығулар күштен гөрі қозғалыс сапасына басымдық беруі керек.',
      'Тыныс алу мен босаңсу жиырылу сияқты маңызды.',
      'Зәр ағуы, ауырлық немесе тұрақты ауыру кәсіби пікірге тұрарлық.',
      'Акушермен немесе физиотерапевтпен қалпына келтіру жақсырақ бақылауды қайтаруға көмектесе алады.',
      'Спортқа оралу, әсіресе жоғары соққылы белсенділіктер үшін, біртіндеп болуы керек.',
    ],

    finalTipTitle: 'Қалпына келуге уақыт беріңіз',
    finalTipText:
      'Босанғаннан кейін денеңіз көптеген өзгерістерден өтті. Шап аймағы денеңіздің қалған бөлігімен бірдей назарға лайық: біртіндеп, тұрақты түрде және қысымсыз.',

    disclaimerText:
      'Бұл мақала тек ақпараттық мақсатқа арналған және жекелендірілген медициналық кеңестің орнын баспайды. Ауыру, тұрақты белгілер болса немесе қалпына келуіңізге қатысты алаңдасаңыз, медицина маманынан кеңес сұраңыз.',
  },
  wo: {
    badge: 'GINNAAW JUR • WÉR',
    title: 'Dëgëral sa perine\nginnaaw jur',
    metaDuration: '8 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro:
      'Ginnaaw ëmb ak jur, perine bi dafay soxla jamono ngir wér. Jëf yu yomb, yu sax te yu tuuti-tuuti mën nañu dimbli nga gis doole, yoon ak kóolute, te gaaw amul.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Xam rolu perine bi',
      'Lu tax jur di ko metti',
      'Kañ ngay tàmbali wéralug perine',
      'Njàng ngir tëx ci yoon',
      'Defar benn yoon bu tuuti-tuuti',
      'Njuumte yi nga war a moytu',
      'Kañ ngay ñaan dimbali',
      'Tàmbaliwaat sport ci tuuti-tuuti',
      'Waajal ndaje',
      'Li am solo',
    ],
    shareMessage: 'Dëgëral sa perine ginnaaw jur — AWA',

    s1Heading: 'Xam rolu perine bi',
    s1Body1:
      'Perine bi, ñu koy woowe itam suufu ndey, mooy mbooloom yaram yu nekk ci suufu bérëbu ndey. Dafay yor bérëbu pis ak bu ndiggu te dimbli yaram yi ci biir.',
    s1Body2:
      'Ci ëmb, yaram yii war nañu yor yenn yu yokk ci ay weer. Dañu leen itam metti lool ci jur.',
    s1HighlightTitle: 'Benn yaram bu nëbbu waaye am solo',
    s1HighlightText:
      'Suufu ndey dafay bokk ci ay jëf yu bari yu bés bu nekk: yor pis ak ndiggu, yor jaar-jaar, dimbli yaram yi ci biir ak bokk ci yenn jëfu jaam.',

    benefitsHeading: 'Njariñu suufu ndey bu dëgër',
    benefitsIntro:
      'Dëgëral bu tuuti-tuuti te bu jub mën na dimbli ci yoru suufu ndey ak dimbali ko.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Yoru pis bu gëna baax',
        text: 'Suufu ndey dafay bokk ci yoru pis. Dëgëral ko tuuti-tuuti mën na dimbli ngir wàññi yenn pis yu di daw.',
      },
      {
        icon: 'toilet',
        title: 'Dimbli jëfu ndiggu',
        text: 'Yaram yii dañuy dimbli itam ci yor jaar-jaar ak ndiggu te dimbli yaram yi ci biir.',
      },
      {
        icon: 'human-female',
        title: 'Dimbali yaram yi ci biir',
        text: 'Suufu ndey mooy benn tabax bu dëgër bu dimbli pis, bérëbu ndey ak biir.',
      },
      {
        icon: 'heart-pulse',
        title: 'Dellusi ci dégg tuuti-tuuti',
        text: 'Benn wérug perine bu méngoo mën na dimbli itam nga gën a xam te yor pàrt bii.',
      },
    ],

    s2Heading: 'Lu tax ëmb ak jur di ko metti',
    s2Body1:
      'Ëmb dafay yokk metit ci suufu ndey tuuti-tuuti. Jur ci yoon mën na ko yaatal lool yaram yi ak cér yi ci pàrt bii.',
    s2Body2:
      'Séz-aryen du aar suufu ndey ba mat itam: ëmb ci boppam des na benn jamono bu am solo ngir yaram yii.',
    s2Body3:
      'Ginnaaw jur, daa jub ne wér dafay jël jamono. Yenn jigéen duñu dégg dara, yeneen mën nañu gis pis yu daw, benn dégg bu diis walla wàññi yoru yaram.',
    s2TipTitle: 'Wér bu nekk wuute na',
    s2TipText:
      'Xeetu jur, benn rees walla episiyotomi, metit ak sa anam bu mat ginnaaw jur mën nañu jëm ci wér.',

    s3Heading: 'Kañ ngay tàmbali wéralug perine?',
    s3Body1:
      'Ginnaaw benn jur bu amul jafe-jafe, tëx yu lewet yu suufu ndey mën nañu tàmbaliwaat tuuti-tuuti. Am solo na nga defar jëf yi ci sa mbir te ñaan ndigal bu nga am jafe-jafe, metit bu am solo walla benn jëf bu sa bopp.',
    s3Body2:
      'Bu nga am benn sonda bu pis, yenn ndigal dañuy digal xaar ba ñu ko jëlal te pis bi dellusi ci yoon balaa ñu tàmbali jëfi perine.',
    s3AlertTitle: 'Bu nga di yëngu ci metit',
    s3AlertText:
      'Metit bu am solo, màndarga yu di gën a bon, mbir bu wérul bu baax walla benn xel-ñaar bu sa bopp soxla nañu ndigalu ndey-jur, doktoor walla liggéeykat wér.',

    s4Heading: 'Njàng ngir tëx ci yoon',
    s4Body1:
      'Ngir xam yëngu bi, xalaat ne nga di jéem a yor jaar-jaar ak bëgg a pis ci benn jamono. Yëngu bi nga di wut mooy benn dégg bu tëx ak bu yéeg ci biir.',
    s4Body2:
      'Li ñu bëgg du tëx yaram bépp. Sa tànk, sa kanam ak sa biir war nañu des ci noppalu bu mu mën a doon, ba noppiku di kontine ci yoon.',
    exercises: [
      {icon: 'weather-windy', label: 'Noppiku'},
      {icon: 'human-handsup', label: 'Tëx bu lewet'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Tëx bu gudd'},
      {icon: 'gesture-tap-button', label: 'Tëx yu gaaw'},
    ],
    s4HighlightTitle: 'Noppalu am solo na lu mat',
    s4HighlightText:
      'Ginnaaw tëx bu nekk, bàyyil yaram yi ñu noppalu ba mat. Wér bu baax du tekki denc perine bi bu tëx bés bépp.',

    s5Heading: 'Defar benn yoon bu tuuti-tuuti',
    s5Body1:
      'Ci njëkk, li am solo mooy njàng xam yaram yi te def yëngu bi bu jub. Sax moo gën a am solo ci kàttan.',
    s5h3a: 'Tëx yu gudd',
    s5Body2:
      'Tëx suufu ndey ak lewet, ginnaaw loolu denc tëx bi ay simili te amul noppiku bu ñu tëj. Gannaaw loolu bàyyil ko ba mat balaa nga tàmbaliwaat.',
    s5h3b: 'Tëx yu gàtt',
    s5Body3:
      'Bu yëngu bi mat, tëx yu gaaw yu ndaw mën nañu yokku. Dañuy dimbli ngir jàng tëx yaram yi ci gaaw bu metit ci biir di yokku, misaal balaa ngay sëgg walla bëtt.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Boole jëf yi ak benn yoon bu bés'},
      {icon: 'human-sitting', label: 'Tàmbali ci benn anam bu neex'},
      {icon: 'weather-windy', label: 'Noppiku ni cosaan ci tëx yi'},
      {icon: 'sleep', label: 'Teg jamono yu noppalu'},
      {icon: 'chart-line', label: 'Yokk jafe bi tuuti-tuuti'},
      {icon: 'doctor', label: 'Ñaan ndigal bu am xel-ñaar'},
    ],
    s5TipTitle: 'Sax ci kaw lépp',
    s5TipText:
      'Boole jëf yi ak benn yoon bu nekk ba noppi ci sa bés mën na dimbli nga sax: ginnaaw nàmm, ginnaaw sab sa ñaañ walla ci beneen waxtu bu la neex.',

    s6Heading: 'Njuumte yu bari yu war a moytu',
    s6Body1:
      'Jëfi perine mën nañu mel ni yu yomb, waaye yomb na a def yeneen cér walla di dugal doole lu ëpp.',
    commonMistakes: [
      'Tëx tànk walla kàccor wuutu suufu ndey',
      'Tëj noppiku ci tëx bi',
      'Denc yaram yi tëx saa su ne te bàyyi leen noppalu',
      'Def jëf yi ay fan rekk te taxaw',
      'Taxawal pis bi ci jëfi sa bopp ngir seet tëx bi',
    ],
    s6TipTitle: 'Li ñu war a def',
    s6TipText:
      'Du ñu ko digal ñu def jëf yi ak taxawal pis bi ci sa bopp. Anam bii du jàngal perine bi bu jub te mën na ñaawal jëfu pis.',

    s7Heading: 'Ban màndarga war a tax nga seet doktoor?',
    s7Body1:
      'Yenn pis yu ndaw walla benn dégg bu cosaanul mën nañu feeñ ginnaaw jur. Waaye bu ñu sax, di gën a bon walla di ñaawal sa dund bu bés, bu ñu bàyyi leen.',
    warningSigns: [
      'Pis bu di daw bu nga di sëgg, bëtt, kuy walla coono',
      'Benn dégg bu diis walla metit ci suufu ndey',
      'Benn dégg ne benn lu dafay wàcc ci ndey',
      'Jafe a yor jaar-jaar walla ndiggu',
      'Metit bu sax ci perine bi',
      'Metit ci jaam walla ginnaaw jaam',
      'Jafe a xam walla tëx bu jub yaram yu perine bi',
    ],
    consultLabel: 'Kañ ngay ñaan ndigal?',
    s7Body2:
      'Benn ndey-jur, doktoor walla kinesiterapist bu jàng wér suufu ndey mën na seet jëfu yaram yi te digal benn programu bu méngoo.',

    s8Heading: 'Te ginnaaw rees, episiyotomi walla séz-aryen?',
    s8Body1:
      'Benn rees walla episiyotomi soxla teg bu sa bopp ci jamonoy wér. Tàmbaliwaat jëf yi war na teg metit, anamu raxas bi ak ndigal yi ñu jox ginnaaw jur.',
    s8Body2:
      'Ginnaaw séz-aryen, wér itam dafay jëm ci tabaxu biir ak raxas bi. Lu mu mën a doon jur bi du woon ci yoon, ëmb ci boppam yor na suufu ndey.',
    s8HighlightTitle: 'Teg bu sa bopp mën na dimbli',
    s8HighlightText:
      'Ci rees bu am solo, metit, màndarga yu pis walla yu ndiggu walla jafe-jafe yu sax, benn seetlu ak liggéeykatu wér mën na dimbli lool.',

    s9Heading: 'Tàmbaliwaat sport ci tuuti-tuuti',
    s9Body1:
      'Tàmbaliwaat yëngu ginnaaw jur war na nekk ci tuuti-tuuti. Dox ak yëngu yu lewet mën nañu tàmbaliwaat ci naka nga di dégg, waaye jëf yu diis ci yoon soxla teg bu gëna bari.',
    s9Body2:
      'Balaa nga tàmbaliwaat daw, tëgg walla jëf bu metti lool, gën na ñu seetlu wér suufu ndey te teg màndarga yi.',
    s9AlertTitle: 'Bu gaaw ci ñaar fuñ yi',
    s9AlertText:
      'Pis bu daw, benn dégg bu diis walla metit ci jamonoy jëf walla ginnaaw jëf ay màndarga lañu yu wone ne war nga yeex te ñaan ndigal balaa nga yokk dayo.',

    s10Heading: 'Kañ ngay seet benn xam-xam?',
    s10Body1:
      'Wéralug suufu ndey ak benn ndey-jur walla kinesiterapist mën na dimbli bu nga di xel-ñaar ndax tëx nga bu jub, bu say màndarga sax walla bu nga bëgg a tàmbaliwaat yenn jëfu yaram ak kóolute.',
    questionCardTitle: 'Laaj yu am njariñ',
    appointmentQuestions: [
      'Samay màndarga méngoo nañu ak yoru suufu ndey bu ndaw?',
      'Tëx naa yaram yi bu jub?',
      'Ñaata yoon laa war a def bés bu nekk?',
      'Mën naa dellu ci daw, sport walla jëf yu diis?',
      'Soxla naa wér ak benn ndey-jur walla kinesiterapist?',
      'Sama raxas, rees walla séz-aryen soxla na teg bu sa bopp?',
    ],
    s10TipTitle: 'Lu baax a xam',
    s10TipText:
      'Seet benn liggéeykat du tekki saa su ne ne lenn du jub. Benn seet mën na dimbli rekk nga seet sa anam, natt sa wér te jàng naka ngay dem kanam bu jub.',

    s11Heading: 'Benn wér bu jël jamono',
    s11Body1:
      'Ginnaaw jur, daa jub nga dellu ci dégg walla doole bi nga amoon balaa ëmb ci gaaw.',
    s11Body2:
      'Li ñu bëgg du def tëx yu bari lu mu mën a doon. Dafay gën a mel ni dellusi ci tuuti-tuuti ci jokkoo bu baax diggante tëx ak noppalu, ginnaaw loolu jëfandikoo yaram yii ci natural ci jëf yu bés.',
    s11HighlightTitle: 'Yoon yu ndaw dañuy dem kanam dëgg',
    s11HighlightText:
      'Benn xam-xam bu gëna baax ci yëngu bi, ay simili yu tëx yu yokk walla wàññi pis ay màndarga yu xiirtal lañu ba noppi.',

    s12Heading: 'Li am solo',
    summaryTitle: 'Li am solo',
    summaryItems: [
      'Ëmb ak jur dañuy metti lool suufu ndey.',
      'Wér bu tuuti-tuuti daa jub ginnaaw jur.',
      'Jëf yi war nañu jëkk kàttanu yëngu ba doole.',
      'Noppiku ak noppalu am nañu solo ni tëx.',
      'Pis bu daw, dégg bu diis walla metit bu sax am nañu solo ndigalu liggéeykat.',
      'Wér ak benn ndey-jur walla kinesiterapist mën na dimbli nga dellu ci yoon bu gëna baax.',
      'Dellu ci sport war na nekk ci tuuti-tuuti, lool ci jëf yu diis.',
    ],

    finalTipTitle: 'Jël jamono ngir wér',
    finalTipText:
      'Ginnaaw jur, sa yaram jàll na soppi yu bari. Perine bi war na teg ni yaram bi ci des: ci tuuti-tuuti, ci yoon te coono amul.',

    disclaimerText:
      'Bind bii ngir xibaar rekk la te du wuutu ndigalu doktoor bu sa bopp. Bu nga am metit, màndarga yu sax walla xel-ñaar ci sa wér, seet ndigalu benn liggéeykatu wér.',
  },
  ha: {
    badge: 'BAYAN HAIHUWA • MURMUREWA',
    title: 'Ƙarfafa tsokar ƙugunki\nbayan haihuwa',
    metaDuration: 'karatun minti 8',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro:
      'Bayan ciki da haihuwa, tsokar ƙugu tana bukatar lokaci don murmurewa. Atisaye masu sauƙi, na yau da kullum, kuma a hankali na iya taimaka miki ki sake samun ƙarfi, sarrafawa, da kwarin gwiwa, ba tare da ƙoƙarin gaggawa ba.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Fahimtar rawar perineum',
      'Dalilin da ya sa haihuwa ke damun ta',
      'Yaushe za a fara gyaran tsokar ƙugu',
      'Koyon matsewa daidai',
      'Gina tsari a hankali',
      'Kuskuren da za a guje wa',
      'Lokacin neman taimako',
      'Komawa wasanni a hankali',
      'Shirya wa ganawa',
      'Muhimman abubuwa',
    ],
    shareMessage: 'Ƙarfafa tsokar ƙugunki bayan haihuwa — AWA',

    s1Heading: 'Fahimtar rawar perineum',
    s1Body1:
      'Perineum, wanda kuma ake kira tsokar ƙugu, rukuni ne na tsokoki da ke ƙasan ƙugu. Tana taka rawa wajen sarrafa mafitsara da hanji kuma tana taimakawa wajen tallafa wa sassan ƙugu.',
    s1Body2:
      'A lokacin ciki, waɗannan tsokoki dole ne su ɗauki ƙarin nauyi na watanni da dama. Hakanan ana matse su sosai yayin haihuwa.',
    s1HighlightTitle: 'Tsoka mai sirri amma muhimmiya',
    s1HighlightText:
      'Tsokar ƙugu tana da hannu a ayyuka da dama na yau da kullum: riƙe fitsari da bayan gida, sarrafa iska, tallafa wa sassan ƙugu, da taka rawa a wasu ayyukan jima’i.',

    benefitsHeading: 'Fa’idodin tsokar ƙugu mai ƙarfi',
    benefitsIntro:
      'Ƙarfafawa a hankali, da aka yi daidai, na iya taimakawa inganta sarrafawa da tallafin tsokar ƙugu.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Ingantaccen sarrafa mafitsara',
        text: 'Tsokar ƙugu tana taka rawa wajen sarrafa mafitsara. Ƙarfafa ta a hankali na iya taimakawa rage wasu zubar fitsari.',
      },
      {
        icon: 'toilet',
        title: 'Tallafa wa aikin hanji',
        text: 'Waɗannan tsokoki kuma suna taimakawa wajen sarrafa iska da bayan gida kuma suna ba da gudummawa ga tallafa wa sassan ƙugu.',
      },
      {
        icon: 'human-female',
        title: 'Tallafa wa sassan ƙugu',
        text: 'Tsokar ƙugu tana samar da tushe na tsoka na gaske wanda ke taimakawa tallafa wa mafitsara, mahaifa, da hanji.',
      },
      {
        icon: 'heart-pulse',
        title: 'Sake samun ji a hankali',
        text: 'Gyaran da ya dace kuma na iya taimaka miki ki sake samun ingantaccen sani da sarrafa wannan yanki.',
      },
    ],

    s2Heading: 'Dalilin da ya sa ciki da haihuwa ke damun ta',
    s2Body1:
      'Ciki a hankali yana sanya ƙarin matsi a tsokar ƙugu. Haihuwa ta farji sai ta iya miƙa tsokoki da kyallen jiki a wannan yanki sosai.',
    s2Body2:
      'Tiyatar haihuwa (cesarean) ma ba ta kare tsokar ƙugu gaba ɗaya ba: ciki da kansa ya ci gaba da zama lokaci mai muhimmanci ga waɗannan tsokoki.',
    s2Body3:
      'Bayan haihuwa, saboda haka al’ada ne murmurewa ya ɗauki lokaci. Wasu mata ba sa jin kusan wata alama, yayin da wasu za su iya lura da zubar fitsari, jin nauyi, ko raguwar sarrafa tsoka.',
    s2TipTitle: 'Kowane murmurewa daban ne',
    s2TipText:
      'Nau’in haihuwa, tsagewa ko episiotomy, kasancewar ciwo, da yanayinki gabaɗaya bayan haihuwa duk na iya shafar murmurewa.',

    s3Heading: 'Yaushe za a fara gyaran tsokar ƙugu?',
    s3Body1:
      'Bayan haihuwa ba tare da matsala ba, yawanci ana iya komawa matsawar tsokar ƙugu mai laushi a hankali. Ya ci gaba da zama muhimmi a daidaita atisaye da yanayinki kuma a nemi shawara idan kin fuskanci matsala, ciwo mai yawa, ko wani tsari na musamman.',
    s3Body2:
      'Idan kina da bututun fitsari, wasu shawarwari suna ba da shawarar jira har sai an cire shi kuma fitsari ya koma yadda ya kamata kafin fara atisayen perineum.',
    s3AlertTitle: 'Kada ki tilasta kanki ta cikin ciwo',
    s3AlertText:
      'Ciwo mai yawa, alamomi masu ƙara muni, rauni da ke warkewa da kyau, ko duk wata damuwa ta musamman suna bukatar shawara daga ungozoma, likita, ko ƙwararren gyaran jiki.',

    s4Heading: 'Koyon matsewa daidai',
    s4Body1:
      'Don gano motsin, yi tunanin kina ƙoƙarin riƙe iska da sha’awar fitsari a lokaci ɗaya. Motsin da kike nema shi ne jin matsewa da ɗagawa zuwa ciki.',
    s4Body2:
      'Manufar ba ita ce ki matse jikinki gaba ɗaya ba. Duwawunki, cinyoyinki, da ciki ya kamata su kasance cikin annashuwa gwargwadon iko, yayin da numfashi ke ci gaba kamar yadda aka saba.',
    exercises: [
      {icon: 'weather-windy', label: 'Numfashi'},
      {icon: 'human-handsup', label: 'Matsewa mai laushi'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Matsewa mai tsawo'},
      {icon: 'gesture-tap-button', label: 'Matsewa cikin sauri'},
    ],
    s4HighlightTitle: 'Annashuwa ma tana da muhimmanci daidai',
    s4HighlightText:
      'Bayan kowace matsewa, bari tsokoki su yi annashuwa gaba ɗaya. Kyakkyawan gyara ba ya nufin kiyaye perineum a matse duk rana.',

    s5Heading: 'Gina tsari a hankali',
    s5Body1:
      'A farko, mafi muhimmanci shi ne koyon gano tsokoki da yin motsin daidai. Yin akai-akai ya fi muhimmanci fiye da ƙarfi.',
    s5h3a: 'Matsewa masu tsawo',
    s5Body2:
      'Matse tsokar ƙugu a hankali, sannan riƙe matsewar na secondi kaɗan ba tare da riƙe numfashi ba. Sannan saki gaba ɗaya kafin ki sake farawa.',
    s5h3b: 'Matsewa gajeru',
    s5Body3:
      'Da zarar an mallaki motsin, za a iya ƙara ƙananan matsewa cikin sauri. Suna taimakawa horar da iyawarki ta matse tsokoki da sauri lokacin da matsin ciki ya ƙaru, misali kafin tari ko atishawa.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Haɗa atisaye da dabi’a ta yau da kullum'},
      {icon: 'human-sitting', label: 'Fara a matsayi mai daɗi'},
      {icon: 'weather-windy', label: 'Yi numfashi kamar yadda aka saba yayin matsewa'},
      {icon: 'sleep', label: 'Mutunta lokutan annashuwa'},
      {icon: 'chart-line', label: 'Ƙara wahalar a hankali'},
      {icon: 'doctor', label: 'Nemi shawara idan ba ki da tabbas'},
    ],
    s5TipTitle: 'Yin akai-akai fiye da komai',
    s5TipText:
      'Haɗa atisaye da dabi’a da ke cikin ranarki na iya sa ya zama da sauƙi a ci gaba: bayan shayarwa, bayan goge hakora, ko a wani lokaci da ya dace da ke.',

    s6Heading: 'Kuskuren gama gari da za a guje wa',
    s6Body1:
      'Atisayen perineum na iya yi kama da sauƙi, amma yana da sauƙi a biya da wasu tsokoki ko a tura da ƙarfi sosai.',
    commonMistakes: [
      'Matse duwawu ko cinyoyi maimakon tsokar ƙugu',
      'Riƙe numfashi yayin matsewa',
      'Kiyaye tsokoki a matse koyaushe ba tare da barin su su huta ba',
      'Yin atisaye na kwanaki kaɗan kawai sannan a daina',
      'Dakatar da fitsari da gangan don duba matsewa',
    ],
    s6TipTitle: 'Abin da bai kamata a yi ba',
    s6TipText:
      'Ba a ba da shawarar yin atisaye ta hanyar dakatar da fitsari da gangan ba. Wannan hanya ba ta horar da perineum daidai ba kuma tana iya dagula aikin mafitsara na al’ada.',

    s7Heading: 'Wadanne alamomi ya kamata su sa a nemi shawara?',
    s7Body1:
      'Ƙananan zubar fitsari ko jin ba na al’ada ba na iya bayyana wani lokaci bayan haihuwa. Duk da haka, bai kamata a yi watsi da su ba idan sun dawwama, suka ƙara muni, ko suka kawo cikas ga rayuwarki ta yau da kullum.',
    warningSigns: [
      'Zubar fitsari lokacin da kike tari, atishawa, dariya, ko tsananta',
      'Jin nauyi ko matsi a ƙasan ƙugu',
      'Jin kamar wani dunƙule ko wani abu yana sauka cikin farji',
      'Wahalar riƙe iska ko bayan gida',
      'Ciwo mai dawwama a perineum',
      'Ciwo lokacin ko bayan jima’i',
      'Wahalar gano ko matse tsokokin perineum daidai',
    ],
    consultLabel: 'Yaushe ya kamata ki nemi shawara?',
    s7Body2:
      'Ungozoma, likita, ko likitan gyaran jiki da ya ƙware a gyaran tsokar ƙugu na iya duba aikin tsoka kuma ya ba da shawarar shiri da ya dace.',

    s8Heading: 'Kuma bayan tsagewa, episiotomy, ko tiyatar haihuwa?',
    s8Body1:
      'Tsagewa ko episiotomy yana bukatar kulawa ta musamman yayin warkewa. Komawa ayyuka ya kamata ya yi la’akari da ciwo, yanayin tabo, da jagorar da aka ba da bayan haihuwa.',
    s8Body2:
      'Bayan tiyatar haihuwa, murmurewa kuma ya shafi bangon ciki da tabo. Ko da haihuwar ba ta farji ba ce, ciki da kansa ya ci gaba da sanya matsi a tsokar ƙugu.',
    s8HighlightTitle: 'Kulawa ta mutum na iya taimakawa',
    s8HighlightText:
      'A yanayin tsagewa mai yawa, ciwo, alamomin fitsari ko hanji, ko matsaloli masu dawwama, tantancewa da ma’aikacin lafiya na iya zama da amfani musamman.',

    s9Heading: 'Komawa wasanni a hankali',
    s9Body1:
      'Komawa motsi bayan haihuwa ya kamata ya zama a hankali. Tafiya da motsi masu laushi yawanci za a iya ci gaba da su bisa yadda kike ji, yayin da ayyuka masu tasiri mai yawa suna bukatar ƙarin hankali.',
    s9Body2:
      'Kafin komawa gudu, tsalle, ko horo mai tsanani sosai, ya fi kyau a tantance murmurewar tsokar ƙugu kuma a yi la’akari da duk wata alama.',
    s9AlertTitle: 'Kada ki gaggauta matakan',
    s9AlertText:
      'Zubar fitsari, jin nauyi, ko ciwo yayin ko bayan motsa jiki alamomi ne da ya kamata ki rage gudu kuma ki nemi shawara kafin ƙara ƙarfi.',

    s10Heading: 'Yaushe za a ga ƙwararre?',
    s10Body1:
      'Gyaran tsokar ƙugu tare da ungozoma ko likitan gyaran jiki na iya zama da amfani idan ba ki da tabbas kina matsewa daidai, idan alamominki sun dawwama, ko idan kina son komawa wasu ayyukan jiki da kwarin gwiwa.',
    questionCardTitle: 'Tambayoyi masu amfani da za ki yi',
    appointmentQuestions: [
      'Alamomina sun dace da raunin tsokar ƙugu?',
      'Ina yin matsewar daidai?',
      'Sau nawa zan maimaita kowace rana?',
      'Zan iya komawa gudu, wasanni, ko motsa jiki mai tasiri mai yawa?',
      'Ina bukatar gyara tare da ungozoma ko likitan gyaran jiki?',
      'Tabona, tsagewa, ko tiyatar haihuwata na bukatar wasu matakan kariya na musamman?',
    ],
    s10TipTitle: 'Abin da ya dace a sani',
    s10TipText:
      'Ganin ƙwararre ba lallai ba ne yana nufin wani abu ba daidai ba ne. Zama ɗaya na iya taimakawa kawai duba dabararki, tantance murmurewarki, da koyon ci gaba daidai.',

    s11Heading: 'Murmurewa da ke ɗaukar lokaci',
    s11Body1:
      'Bayan haihuwa, al’ada ne kada ki sake samun ji ko ƙarfin tsoka iri ɗaya da kika yi kafin ciki nan da nan.',
    s11Body2:
      'Manufar ba ita ce a yi matsewa da yawa gwargwadon iko ba. Ya fi game da sake samun kyakkyawan haɗin kai tsakanin matsewa da annashuwa a hankali, sannan a iya amfani da waɗannan tsokoki ta halitta a ayyukan yau da kullum.',
    s11HighlightTitle: 'Ƙaramin ci gaba ci gaba ne na gaske',
    s11HighlightText:
      'Ingantaccen sani game da motsin, secondi kaɗan na ƙarin matsewa, ko raguwar zubar fitsari alamomi ne masu ƙarfafawa.',

    s12Heading: 'Muhimman abubuwa',
    summaryTitle: 'Muhimman abubuwa',
    summaryItems: [
      'Ciki da haihuwa suna sanya matsi mai yawa a tsokar ƙugu.',
      'Murmurewa a hankali al’ada ne bayan haihuwa.',
      'Ya kamata atisaye ya fifita ingancin motsi fiye da ƙarfi.',
      'Numfashi da annashuwa suna da muhimmanci daidai da matsewa.',
      'Zubar fitsari, nauyi, ko ciwo mai dawwama sun cancanci ra’ayin ƙwararre.',
      'Gyara tare da ungozoma ko likitan gyaran jiki na iya taimaka miki ki sake samun ingantaccen sarrafawa.',
      'Komawa wasanni ya kamata ya zama a hankali, musamman ga ayyuka masu tasiri mai yawa.',
    ],

    finalTipTitle: 'Ɗauki lokaci don murmurewa',
    finalTipText:
      'Bayan haihuwa, jikinki ya wuce ta sauye-sauye da yawa. Perineum ya cancanci kulawa daidai da sauran jikinki: a hankali, akai-akai, kuma ba tare da matsi ba.',

    disclaimerText:
      'An yi wannan labari don bayani ne kawai kuma ba ya maye gurbin shawarar likita ta keɓaɓɓiya. Idan kina fuskantar ciwo, alamomi masu dawwama, ko kina da wata damuwa game da murmurewarki, nemi shawara daga ma’aikacin lafiya.',
  },
  am: {
    badge: 'ከወሊድ በኋላ • ማገገም',
    title: 'ከወሊድ በኋላ የዳሌ ወለልሽን\nማጠናከር',
    metaDuration: '8 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተገመገመ ይዘት',
    intro:
      'ከእርግዝናና ከወሊድ በኋላ የዳሌ ወለል ለማገገም ጊዜ ይፈልጋል። ቀላል፣ መደበኛ እና ቀስ በቀስ የሚደረጉ ልምምዶች ነገሮችን ለማፍጠን ሳትሞክሪ ጥንካሬን፣ ቁጥጥርን እና በራስ መተማመንን መልሰሽ እንድታገኚ ሊረዱሽ ይችላሉ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የፔሪኒየምን ሚና መረዳት',
      'ወሊድ ለምን ጫና ያሳድርበታል',
      'የዳሌ ወለል ማገገሚያ መቼ መጀመር',
      'በትክክል መኮማተርን መማር',
      'ቀስ በቀስ የሚሄድ ሥርዓት መገንባት',
      'መወገድ ያለባቸው ስህተቶች',
      'እርዳታ መቼ መጠየቅ',
      'ስፖርትን ቀስ በቀስ መቀጠል',
      'ለቀጠሮ መዘጋጀት',
      'ዋና ዋና ነጥቦች',
    ],
    shareMessage: 'ከወሊድ በኋላ የዳሌ ወለልሽን ማጠናከር — AWA',

    s1Heading: 'የፔሪኒየምን ሚና መረዳት',
    s1Body1:
      'ፔሪኒየም፣ የዳሌ ወለልም ተብሎ የሚጠራው፣ በዳሌ መሠረት ላይ የሚገኝ የጡንቻዎች ስብስብ ነው። በሽንት እና በአንጀት ቁጥጥር ውስጥ ሚና ይጫወታል እንዲሁም የዳሌ አካላትን ለመደገፍ ይረዳል።',
    s1Body2:
      'በእርግዝና ጊዜ እነዚህ ጡንቻዎች ለበርካታ ወራት ተጨማሪ ክብደት መሸከም አለባቸው። በወሊድ ጊዜም ከፍተኛ ጫና ይደርስባቸዋል።',
    s1HighlightTitle: 'ዝምተኛ ግን አስፈላጊ ጡንቻ',
    s1HighlightText:
      'የዳሌ ወለል በበርካታ የዕለት ተዕለት ተግባራት ውስጥ ይሳተፋል፦ ሽንትንና ሰገራን መያዝ፣ ጋዝን መቆጣጠር፣ የዳሌ አካላትን መደገፍ እና በአንዳንድ የወሲብ ተግባራት ውስጥ ሚና መጫወት።',

    benefitsHeading: 'የጠነከረ የዳሌ ወለል ጥቅሞች',
    benefitsIntro:
      'ቀስ በቀስ፣ በትክክል የሚደረግ ማጠናከር የዳሌ ወለል ቁጥጥርንና ድጋፍን ለማሻሻል ሊረዳ ይችላል።',
    benefits: [
      {
        icon: 'water-outline',
        title: 'የተሻለ የሽንት ቁጥጥር',
        text: 'የዳሌ ወለል በሽንት ቁጥጥር ውስጥ ሚና ይጫወታል። ቀስ በቀስ ማጠናከር አንዳንድ የሽንት ማምለጥ ችግሮችን ለመቀነስ ሊረዳ ይችላል።',
      },
      {
        icon: 'toilet',
        title: 'የአንጀት ተግባርን መደገፍ',
        text: 'እነዚህ ጡንቻዎች ጋዝንና ሰገራን ለመቆጣጠር ይረዳሉ እንዲሁም የዳሌ አካላትን ለመደገፍ አስተዋጽኦ ያደርጋሉ።',
      },
      {
        icon: 'human-female',
        title: 'የዳሌ አካላትን መደገፍ',
        text: 'የዳሌ ወለል ፊኛን፣ ማህፀንንና አንጀትን ለመደገፍ የሚረዳ እውነተኛ የጡንቻ መሠረት ይፈጥራል።',
      },
      {
        icon: 'heart-pulse',
        title: 'ቀስ በቀስ ስሜትን መመለስ',
        text: 'ተስማሚ ማገገሚያ የዚህን አካባቢ የተሻለ ግንዛቤና ቁጥጥር መልሰሽ እንድታገኚ ሊረዳሽ ይችላል።',
      },
    ],

    s2Heading: 'እርግዝናና ወሊድ ለምን ጫና ያሳድሩበታል',
    s2Body1:
      'እርግዝና ቀስ በቀስ በዳሌ ወለል ላይ ተጨማሪ ጫና ያሳድራል። በብልት የሚደረግ ወሊድ ከዚያ በዚህ አካባቢ ያሉ ጡንቻዎችንና ሕዋሳትን በከፍተኛ ሁኔታ ሊለጥጥ ይችላል።',
    s2Body2:
      'ቄሳሪያን ክፍልም የዳሌ ወለልን ሙሉ በሙሉ አይታደግም፦ እርግዝና ራሱ ለእነዚህ ጡንቻዎች ጉልህ ጊዜ ሆኖ ይቆያል።',
    s2Body3:
      'ከወሊድ በኋላ ስለዚህ ማገገም ጊዜ መውሰዱ የተለመደ ነው። አንዳንድ ሴቶች ምንም ምልክት ማለት ይቻላል አይሰማቸውም፣ ሌሎች ደግሞ ሽንት ማምለጥ፣ የክብደት ስሜት ወይም የተቀነሰ የጡንቻ ቁጥጥር ሊያስተውሉ ይችላሉ።',
    s2TipTitle: 'እያንዳንዱ ማገገም የተለየ ነው',
    s2TipText:
      'የወሊድ ዓይነት፣ መቀደድ ወይም ኤፒዚዮቶሚ፣ የህመም መኖር እና ከወሊድ በኋላ አጠቃላይ ሁኔታሽ ሁሉም ማገገምን ሊነኩ ይችላሉ።',

    s3Heading: 'የዳሌ ወለል ማገገሚያ መቼ መጀመር?',
    s3Body1:
      'ያለ ችግር ከተወለደ በኋላ ለስላሳ የዳሌ ወለል መኮማተሮች በተለምዶ ቀስ በቀስ ሊቀጥሉ ይችላሉ። ልምምዶቹን ከሁኔታሽ ጋር ማስተካከል፣ እንዲሁም ችግር፣ ከፍተኛ ህመም ወይም የተለየ ሂደት ካጋጠመሽ ምክር መጠየቅ አስፈላጊ ሆኖ ይቆያል።',
    s3Body2:
      'የሽንት ቱቦ ካለሽ፣ አንዳንድ ምክሮች የፔሪኒየም ልምምዶችን ከመጀመር በፊት እስኪወገድና መደበኛ ሽንት እስኪቀጥል መጠበቅን ይጠቁማሉ።',
    s3AlertTitle: 'ህመምን ተቋቁመሽ አትግፊ',
    s3AlertText:
      'ከፍተኛ ህመም፣ እየከፋ የሚሄዱ ምልክቶች፣ በደንብ የማይድን ቁስል ወይም ማንኛውም የተለየ ስጋት ከሚድዋይፍ፣ ከሐኪም ወይም ከማገገሚያ ባለሙያ ምክር ይፈልጋል።',

    s4Heading: 'በትክክል መኮማተርን መማር',
    s4Body1:
      'እንቅስቃሴውን ለመለየት ጋዝንና የመሽናት ፍላጎትን በተመሳሳይ ጊዜ ለመያዝ እንደምትሞክሪ አስቢ። የምትፈልጊው እንቅስቃሴ ወደ ውስጥ የመኮማተርና የማንሳት ስሜት ነው።',
    s4Body2:
      'ግቡ መላ ሰውነትሽን አጥብቆ ማወጠር አይደለም። መተንፈስ በተለምዶ እየቀጠለ መቀመጫሽ፣ ጭንሽና የሆድ ጡንቻዎችሽ በተቻለ መጠን ዘና ብለው መቆየት አለባቸው።',
    exercises: [
      {icon: 'weather-windy', label: 'መተንፈስ'},
      {icon: 'human-handsup', label: 'ለስላሳ መኮማተር'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ረዥም መኮማተር'},
      {icon: 'gesture-tap-button', label: 'ፈጣን መኮማተሮች'},
    ],
    s4HighlightTitle: 'ዘና ማለት እኩል አስፈላጊ ነው',
    s4HighlightText:
      'ከእያንዳንዱ መኮማተር በኋላ ጡንቻዎቹ ሙሉ በሙሉ ዘና እንዲሉ ፍቀጂ። ጥሩ ማገገሚያ ማለት ፔሪኒየሙን ቀኑን ሙሉ ተኮማትሮ ማቆየት ማለት አይደለም።',

    s5Heading: 'ቀስ በቀስ የሚሄድ ሥርዓት መገንባት',
    s5Body1:
      'መጀመሪያ ላይ በጣም አስፈላጊው ጡንቻዎቹን መለየትና እንቅስቃሴውን በትክክል መፈጸም መማር ነው። ወጥነት ከጥንካሬ ይበልጣል።',
    s5h3a: 'ረዥም መኮማተሮች',
    s5Body2:
      'የዳሌ ወለሉን በቀስታ አኮማትሪ፣ ከዚያ ትንፋሽሽን ሳትይዢ መኮማተሩን ለጥቂት ሰከንዶች ያዢ። ከዚያ እንደገና ከመጀመርሽ በፊት ሙሉ በሙሉ ልቀቂ።',
    s5h3b: 'አጭር መኮማተሮች',
    s5Body3:
      'እንቅስቃሴው ከተቆጣጠርሽ በኋላ ትናንሽ ፈጣን መኮማተሮች ሊጨመሩ ይችላሉ። የሆድ ግፊት ሲጨምር፣ ለምሳሌ ከማሳል ወይም ከማስነጠስ ወዲያ በፊት፣ ጡንቻዎቹን በፍጥነት የማኮማተር ችሎታሽን ለማሰልጠን ይረዳሉ።',
    dailyTips: [
      {icon: 'clock-outline', label: 'ልምምዶቹን ከዕለታዊ ልማድ ጋር አጣምሪ'},
      {icon: 'human-sitting', label: 'በምቹ አቀማመጥ ጀምሪ'},
      {icon: 'weather-windy', label: 'በመኮማተሮች ጊዜ በተለምዶ ተንፍሺ'},
      {icon: 'sleep', label: 'የዘና ማለት ደረጃዎችን አክብሪ'},
      {icon: 'chart-line', label: 'ቀስ በቀስ ችግሩን ጨምሪ'},
      {icon: 'doctor', label: 'እርግጠኛ ካልሆንሽ ምክር ጠይቂ'},
    ],
    s5TipTitle: 'ከሁሉም በላይ ወጥነት',
    s5TipText:
      'ልምምዶቹን ቀድሞውኑ የቀንሽ አካል ከሆነ ልማድ ጋር ማጣመር ወጥ ሆኖ መቆየትን ሊያቀልል ይችላል፦ ከጡት ማጥባት በኋላ፣ ጥርስ ከመፋቅ በኋላ ወይም ለአንቺ በሚስማማ ሌላ ጊዜ።',

    s6Heading: 'መወገድ ያለባቸው የተለመዱ ስህተቶች',
    s6Body1:
      'የፔሪኒየም ልምምዶች ቀላል ሊመስሉ ይችላሉ፣ ነገር ግን በሌሎች ጡንቻዎች መካስ ወይም በጣም መግፋት ቀላል ነው።',
    commonMistakes: [
      'ከዳሌ ወለል ይልቅ መቀመጫን ወይም ጭንን ማወጠር',
      'በመኮማተር ጊዜ ትንፋሽን መያዝ',
      'ዘና ሳይሉ ጡንቻዎችን ሁልጊዜ ተኮማትረው ማቆየት',
      'ልምምዶቹን ለጥቂት ቀናት ብቻ ማድረግ እና ከዚያ ማቆም',
      'መኮማተሩን ለመፈተሽ ሆን ብሎ የሽንት ፍሰትን ማቆም',
    ],
    s6TipTitle: 'ማድረግ የሌለብሽ',
    s6TipText:
      'ልምምዶቹን ሆን ብሎ የሽንት ፍሰትን በማቆም መለማመድ አይመከርም። ይህ ዘዴ ፔሪኒየምን በትክክል አያሠለጥንም እና መደበኛ የፊኛ ተግባርን ሊያውክ ይችላል።',

    s7Heading: 'ምን ምልክቶች ምክክር ሊያስከትሉ ይገባል?',
    s7Body1:
      'ቀላል የሽንት ማምለጥ ወይም ያልተለመደ ስሜት ከወሊድ በኋላ አንዳንድ ጊዜ ሊታይ ይችላል። ሆኖም ከቀጠሉ፣ ከተባባሱ ወይም የዕለት ሕይወትሽን ካወኩ ችላ መባል የለባቸውም።',
    warningSigns: [
      'ስታስሊ፣ ስታስነጥሲ፣ ስትስቂ ወይም ስትገፊ የሽንት ማምለጥ',
      'በታችኛው ዳሌ ውስጥ የክብደት ወይም የግፊት ስሜት',
      'አንድ እብጠት ወይም ነገር ወደ ብልት እየወረደ ያለ ስሜት',
      'ጋዝን ወይም ሰገራን ለመያዝ መቸገር',
      'በፔሪኒየም ውስጥ የሚቆይ ህመም',
      'በወሲብ ግንኙነት ጊዜ ወይም በኋላ ህመም',
      'የፔሪኒየም ጡንቻዎችን ለመለየት ወይም በትክክል ለማኮማተር መቸገር',
    ],
    consultLabel: 'ምክር መቼ መፈለግ አለብሽ?',
    s7Body2:
      'ሚድዋይፍ፣ ሐኪም ወይም በዳሌ ወለል ማገገሚያ የተካነ ፊዚዮቴራፒስት የጡንቻ ተግባርን ሊፈትሽ እና ተስማሚ ፕሮግራም ሊጠቁም ይችላል።',

    s8Heading: 'ከመቀደድ፣ ከኤፒዚዮቶሚ ወይም ከቄሳሪያን ክፍል በኋላስ?',
    s8Body1:
      'መቀደድ ወይም ኤፒዚዮቶሚ በሚድንበት ጊዜ ልዩ እንክብካቤ ይፈልጋል። እንቅስቃሴዎችን መቀጠል ህመምን፣ የጠባሳውን ሁኔታ እና ከወሊድ በኋላ የተሰጠውን መመሪያ ከግምት ማስገባት አለበት።',
    s8Body2:
      'ከቄሳሪያን ክፍል በኋላ ማገገም የሆድ ግድግዳውንና ጠባሳውንም ያካትታል። ወሊዱ በብልት ባይሆንም እርግዝና ራሱ አሁንም በዳሌ ወለል ላይ ጫና አሳድሯል።',
    s8HighlightTitle: 'ግላዊ እንክብካቤ ሊረዳ ይችላል',
    s8HighlightText:
      'ከፍተኛ መቀደድ፣ ህመም፣ የሽንት ወይም የአንጀት ምልክቶች ወይም የሚቀጥሉ ችግሮች ሲኖሩ ከጤና ባለሙያ ጋር የሚደረግ ግምገማ በተለይ ጠቃሚ ሊሆን ይችላል።',

    s9Heading: 'ስፖርትን ቀስ በቀስ መቀጠል',
    s9Body1:
      'ከወሊድ በኋላ እንቅስቃሴን መቀጠል ቀስ በቀስ መሆን አለበት። የእግር ጉዞና ለስላሳ እንቅስቃሴዎች በአጠቃላይ በሚሰማሽ መሠረት ሊቀጥሉ ይችላሉ፣ ከፍተኛ ድንጋጤ ያላቸው እንቅስቃሴዎች ግን ተጨማሪ ጥንቃቄ ይፈልጋሉ።',
    s9Body2:
      'ሩጫን፣ መዝለልን ወይም በጣም ከባድ ስልጠናን ከመቀጠልሽ በፊት የዳሌ ወለል ማገገምን መገምገም እና ማንኛውንም ምልክት ከግምት ማስገባት ይመረጣል።',
    s9AlertTitle: 'ደረጃዎችን አትቸኩይ',
    s9AlertText:
      'ሽንት ማምለጥ፣ የክብደት ስሜት ወይም በልምምድ ጊዜ ወይም በኋላ ህመም ፍጥነትሽን መቀነስ እና ጥንካሬን ከመጨመርሽ በፊት ምክር መፈለግ እንዳለብሽ ምልክቶች ናቸው።',

    s10Heading: 'ስፔሻሊስት መቼ ማየት?',
    s10Body1:
      'በትክክል እያኮማተርሽ እንደሆነ እርግጠኛ ካልሆንሽ፣ ምልክቶችሽ ከቀጠሉ ወይም የተወሰኑ የአካል እንቅስቃሴዎችን በመተማመን መቀጠል ከፈለግሽ ከሚድዋይፍ ወይም ከፊዚዮቴራፒስት ጋር የዳሌ ወለል ማገገሚያ ጠቃሚ ሊሆን ይችላል።',
    questionCardTitle: 'ለመጠየቅ የሚጠቅሙ ጥያቄዎች',
    appointmentQuestions: [
      'ምልክቶቼ ከዳሌ ወለል ድክመት ጋር ይጣጣማሉ?',
      'መኮማተሮቹን በትክክል እያደረግሁ ነው?',
      'በቀን ስንት ድግግሞሽ ማድረግ አለብኝ?',
      'ወደ ሩጫ፣ ስፖርት ወይም ከፍተኛ ድንጋጤ ወዳለው እንቅስቃሴ መመለስ እችላለሁ?',
      'ከሚድዋይፍ ወይም ከፊዚዮቴራፒስት ጋር ማገገሚያ ያስፈልገኛል?',
      'ጠባሳዬ፣ መቀደዴ ወይም ቄሳሪያን ክፍሌ ማንኛውንም ልዩ ጥንቃቄ ይፈልጋል?',
    ],
    s10TipTitle: 'ማወቅ ጠቃሚ ነው',
    s10TipText:
      'ባለሙያ ማየት የግድ የሆነ ችግር አለ ማለት አይደለም። አንድ ክፍለ ጊዜ ዘዴሽን ለመፈተሽ፣ ማገገምሽን ለመገምገም እና በትክክል ለማደግ ለመማር ብቻ ሊረዳ ይችላል።',

    s11Heading: 'ጊዜ የሚወስድ ማገገም',
    s11Body1:
      'ከወለድሽ በኋላ ከእርግዝና በፊት የነበረሽን ተመሳሳይ ስሜት ወይም የጡንቻ ጥንካሬ ወዲያውኑ አለማግኘት የተለመደ ነው።',
    s11Body2:
      'ግቡ በተቻለ መጠን ብዙ መኮማተሮችን ማድረግ አይደለም። ይልቁንም በመኮማተርና በዘና ማለት መካከል ጥሩ ቅንጅትን ቀስ በቀስ መልሶ ማግኘት፣ ከዚያ እነዚህን ጡንቻዎች በዕለት ተዕለት እንቅስቃሴዎች በተፈጥሮ መጠቀም መቻል ነው።',
    s11HighlightTitle: 'ትናንሽ እድገቶች እውነተኛ እድገቶች ናቸው',
    s11HighlightText:
      'የእንቅስቃሴው የተሻለ ግንዛቤ፣ ጥቂት ተጨማሪ የመኮማተር ሰከንዶች ወይም የሽንት ማምለጥ መቀነስ አስቀድሞ የሚያበረታቱ ምልክቶች ናቸው።',

    s12Heading: 'ዋና ዋና ነጥቦች',
    summaryTitle: 'አስፈላጊዎቹ',
    summaryItems: [
      'እርግዝናና ወሊድ በዳሌ ወለል ላይ ከፍተኛ ጫና ያሳድራሉ።',
      'ከወሊድ በኋላ ቀስ በቀስ ማገገም የተለመደ ነው።',
      'ልምምዶች ከጥንካሬ ይልቅ ለእንቅስቃሴ ጥራት ቅድሚያ መስጠት አለባቸው።',
      'መተንፈስና ዘና ማለት እንደ መኮማተር እኩል አስፈላጊ ናቸው።',
      'የሽንት ማምለጥ፣ የክብደት ስሜት ወይም የሚቆይ ህመም የባለሙያ አስተያየት ይገባቸዋል።',
      'ከሚድዋይፍ ወይም ከፊዚዮቴራፒስት ጋር ማገገሚያ የተሻለ ቁጥጥር እንድታገኚ ሊረዳሽ ይችላል።',
      'ወደ ስፖርት መመለስ ቀስ በቀስ መሆን አለበት፣ በተለይ ከፍተኛ ድንጋጤ ላላቸው እንቅስቃሴዎች።',
    ],

    finalTipTitle: 'ለማገገም ጊዜ ውሰጂ',
    finalTipText:
      'ከወሊድ በኋላ ሰውነትሽ ብዙ ለውጦችን አልፏል። ፔሪኒየም እንደ ሌላው ሰውነትሽ ተመሳሳይ ትኩረት ይገባዋል፦ ቀስ በቀስ፣ በመደበኛነት እና ያለ ጫና።',

    disclaimerText:
      'ይህ ጽሑፍ ለመረጃ ብቻ ነው እና ግላዊ የሕክምና ምክርን አይተካም። ህመም፣ የሚቀጥሉ ምልክቶች ወይም ስለ ማገገምሽ ማንኛውም ስጋት ካለሽ የጤና ባለሙያ ምክር ጠይቂ።',
  },
  nl: {
    badge: 'POSTPARTUM • HERSTEL',
    title: 'Je bekkenbodem versterken\nna de bevalling',
    metaDuration: '8 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro:
      'Na zwangerschap en bevalling heeft de bekkenbodem tijd nodig om te herstellen. Eenvoudige, regelmatige en geleidelijke oefeningen kunnen je helpen kracht, controle en vertrouwen terug te winnen, zonder de dingen te willen forceren.',
    contentsTitle: 'In dit artikel',
    topics: [
      'De rol van de bekkenbodem begrijpen',
      'Waarom de bevalling hem onder spanning zet',
      'Wanneer starten met bekkenbodemrevalidatie',
      'Correct leren aanspannen',
      'Een geleidelijke routine opbouwen',
      'Fouten die je moet vermijden',
      'Wanneer hulp vragen',
      'Geleidelijk weer sporten',
      'Een afspraak voorbereiden',
      'Belangrijkste punten',
    ],
    shareMessage: 'Je bekkenbodem versterken na de bevalling — AWA',

    s1Heading: 'De rol van de bekkenbodem begrijpen',
    s1Body1:
      'De bekkenbodem is een groep spieren aan de onderkant van het bekken. Hij speelt een rol bij de controle over blaas en darmen en helpt de organen in het bekken te ondersteunen.',
    s1Body2:
      'Tijdens de zwangerschap moeten deze spieren maandenlang extra gewicht dragen. Ook tijdens de bevalling worden ze aanzienlijk belast.',
    s1HighlightTitle: 'Een discrete maar essentiële spier',
    s1HighlightText:
      'De bekkenbodem is betrokken bij meerdere dagelijkse functies: urine en ontlasting ophouden, winden beheersen, de organen in het bekken ondersteunen en een rol spelen bij bepaalde seksuele functies.',

    benefitsHeading: 'De voordelen van een sterkere bekkenbodem',
    benefitsIntro:
      'Geleidelijke, correct uitgevoerde versterking kan helpen de controle over en ondersteuning van de bekkenbodem te verbeteren.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Betere blaascontrole',
        text: 'De bekkenbodem speelt een rol bij de blaascontrole. Hem geleidelijk versterken kan helpen bepaalde urineverliezen te verminderen.',
      },
      {
        icon: 'toilet',
        title: 'De darmfunctie ondersteunen',
        text: 'Deze spieren helpen ook winden en ontlasting te beheersen en dragen bij aan de ondersteuning van de organen in het bekken.',
      },
      {
        icon: 'human-female',
        title: 'De organen in het bekken ondersteunen',
        text: 'De bekkenbodem vormt een echte spierbasis die helpt de blaas, baarmoeder en darmen te ondersteunen.',
      },
      {
        icon: 'heart-pulse',
        title: 'Geleidelijk gevoel terugkrijgen',
        text: 'Passende revalidatie kan je ook helpen dit gebied beter te voelen en te beheersen.',
      },
    ],

    s2Heading: 'Waarom zwangerschap en bevalling hem onder spanning zetten',
    s2Body1:
      'De zwangerschap oefent geleidelijk steeds meer druk uit op de bekkenbodem. Een vaginale bevalling kan de spieren en weefsels in dit gebied vervolgens aanzienlijk oprekken.',
    s2Body2:
      'Een keizersnede spaart de bekkenbodem ook niet volledig: de zwangerschap zelf blijft een belangrijke periode voor deze spieren.',
    s2Body3:
      'Na de bevalling is het dus normaal dat herstel tijd kost. Sommige vrouwen voelen bijna geen klachten, terwijl anderen urineverlies, een zwaar gevoel of verminderde spiercontrole kunnen opmerken.',
    s2TipTitle: 'Elk herstel is anders',
    s2TipText:
      'Het type bevalling, een scheur of knip, de aanwezigheid van pijn en je algemene toestand na de bevalling kunnen het herstel allemaal beïnvloeden.',

    s3Heading: 'Wanneer starten met bekkenbodemrevalidatie?',
    s3Body1:
      'Na een ongecompliceerde bevalling kunnen zachte aanspanningen van de bekkenbodem meestal geleidelijk worden hervat. Het blijft belangrijk de oefeningen aan je situatie aan te passen en advies te vragen als je een complicatie, aanzienlijke pijn of een specifieke ingreep hebt gehad.',
    s3Body2:
      'Als je een urinekatheter hebt, adviseren sommige richtlijnen te wachten tot die is verwijderd en het normale plassen is hervat voordat je met bekkenbodemoefeningen begint.',
    s3AlertTitle: 'Zet niet door bij pijn',
    s3AlertText:
      'Aanzienlijke pijn, verergerende klachten, een wond die slecht geneest of elke bijzondere zorg vraagt om advies van een verloskundige, arts of revalidatieprofessional.',

    s4Heading: 'Correct leren aanspannen',
    s4Body1:
      'Om de beweging te herkennen, stel je voor dat je tegelijk winden en de aandrang om te plassen probeert tegen te houden. De beweging die je zoekt is een gevoel van samentrekken en naar binnen optillen.',
    s4Body2:
      'Het doel is niet je hele lichaam strak aan te spannen. Je billen, dijen en buikspieren moeten zo ontspannen mogelijk blijven, terwijl je normaal blijft ademen.',
    exercises: [
      {icon: 'weather-windy', label: 'Ademhaling'},
      {icon: 'human-handsup', label: 'Zachte aanspanning'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Lange aanspanning'},
      {icon: 'gesture-tap-button', label: 'Snelle aanspanningen'},
    ],
    s4HighlightTitle: 'Ontspannen is net zo belangrijk',
    s4HighlightText:
      'Laat de spieren na elke aanspanning volledig ontspannen. Goede revalidatie betekent niet de bekkenbodem de hele dag aangespannen houden.',

    s5Heading: 'Een geleidelijke routine opbouwen',
    s5Body1:
      'In het begin is het belangrijkste de spieren te leren herkennen en de beweging correct uit te voeren. Regelmaat is belangrijker dan intensiteit.',
    s5h3a: 'Lange aanspanningen',
    s5Body2:
      'Span de bekkenbodem zacht aan en houd de aanspanning enkele seconden vast zonder je adem in te houden. Laat daarna volledig los voordat je opnieuw begint.',
    s5h3b: 'Korte aanspanningen',
    s5Body3:
      'Zodra je de beweging beheerst, kunnen kleine snelle aanspanningen worden toegevoegd. Ze trainen je vermogen om de spieren snel aan te spannen wanneer de buikdruk stijgt, bijvoorbeeld net voor je hoest of niest.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Koppel de oefeningen aan een dagelijkse gewoonte'},
      {icon: 'human-sitting', label: 'Begin in een comfortabele houding'},
      {icon: 'weather-windy', label: 'Adem normaal tijdens de aanspanningen'},
      {icon: 'sleep', label: 'Respecteer de ontspanningsfasen'},
      {icon: 'chart-line', label: 'Maak het geleidelijk moeilijker'},
      {icon: 'doctor', label: 'Vraag advies als je twijfelt'},
    ],
    s5TipTitle: 'Vooral regelmaat',
    s5TipText:
      'De oefeningen koppelen aan een gewoonte die al in je dag zit kan het makkelijker maken ze vol te houden: na een voeding, na het tandenpoetsen of op een ander moment dat je schikt.',

    s6Heading: 'Veelgemaakte fouten die je moet vermijden',
    s6Body1:
      'Bekkenbodemoefeningen lijken misschien eenvoudig, maar het is makkelijk om met andere spieren te compenseren of te hard te duwen.',
    commonMistakes: [
      'De billen of dijen aanspannen in plaats van de bekkenbodem',
      'Je adem inhouden tijdens de aanspanning',
      'De spieren constant aangespannen houden zonder ze te laten ontspannen',
      'De oefeningen maar een paar dagen doen en dan stoppen',
      'Opzettelijk de urinestraal stoppen om de aanspanning te controleren',
    ],
    s6TipTitle: 'Wat je niet moet doen',
    s6TipText:
      'Het wordt afgeraden de oefeningen te doen door opzettelijk je urinestraal te stoppen. Deze methode traint de bekkenbodem niet correct en kan de normale blaasfunctie verstoren.',

    s7Heading: 'Welke klachten moeten aanleiding zijn voor een consult?',
    s7Body1:
      'Kleine verliezen of een ongewoon gevoel kunnen soms na de bevalling optreden. Ze mogen echter niet worden genegeerd als ze aanhouden, verergeren of je dagelijks leven hinderen.',
    warningSigns: [
      'Urineverlies wanneer je hoest, niest, lacht of perst',
      'Een gevoel van zwaarte of druk in het onderste deel van het bekken',
      'Een gevoel dat er een bult of iets naar beneden zakt in de vagina',
      'Moeite om winden of ontlasting op te houden',
      'Aanhoudende pijn in de bekkenbodem',
      'Pijn tijdens of na seksueel contact',
      'Moeite om de spieren van de bekkenbodem te herkennen of correct aan te spannen',
    ],
    consultLabel: 'Wanneer moet je advies vragen?',
    s7Body2:
      'Een verloskundige, arts of fysiotherapeut gespecialiseerd in bekkenbodemrevalidatie kan de spierfunctie controleren en een passend programma voorstellen.',

    s8Heading: 'En na een scheur, een knip of een keizersnede?',
    s8Body1:
      'Een scheur of knip vraagt bijzondere zorg tijdens de genezing. Bij het hervatten van activiteiten moet rekening worden gehouden met pijn, de toestand van het litteken en het advies dat na de bevalling is gegeven.',
    s8Body2:
      'Na een keizersnede betreft het herstel ook de buikwand en het litteken. Zelfs als de bevalling niet vaginaal was, heeft de zwangerschap zelf de bekkenbodem toch belast.',
    s8HighlightTitle: 'Persoonlijke begeleiding kan helpen',
    s8HighlightText:
      'Bij een aanzienlijke scheur, pijn, urine- of darmklachten of aanhoudende problemen kan een beoordeling door een zorgprofessional bijzonder nuttig zijn.',

    s9Heading: 'Geleidelijk weer sporten',
    s9Body1:
      'Het hervatten van beweging na de bevalling moet geleidelijk gebeuren. Wandelen en zachte bewegingen kunnen over het algemeen worden hervat naargelang hoe je je voelt, terwijl activiteiten met hoge impact meer voorzichtigheid vragen.',
    s9Body2:
      'Voordat je weer gaat hardlopen, springen of zeer intensief trainen, is het het beste het herstel van de bekkenbodem te beoordelen en rekening te houden met eventuele klachten.',
    s9AlertTitle: 'Forceer de stappen niet',
    s9AlertText:
      'Urineverlies, een zwaar gevoel of pijn tijdens of na het sporten zijn tekenen dat je moet vertragen en advies moet vragen voordat je de intensiteit verhoogt.',

    s10Heading: 'Wanneer een specialist raadplegen?',
    s10Body1:
      'Bekkenbodemrevalidatie bij een verloskundige of fysiotherapeut kan nuttig zijn als je niet zeker weet of je correct aanspant, als je klachten aanhouden of als je met vertrouwen bepaalde fysieke activiteiten wilt hervatten.',
    questionCardTitle: 'Nuttige vragen om te stellen',
    appointmentQuestions: [
      'Passen mijn klachten bij een zwakke bekkenbodem?',
      'Voer ik de aanspanningen correct uit?',
      'Hoeveel herhalingen moet ik per dag doen?',
      'Kan ik weer gaan hardlopen, sporten of oefeningen met hoge impact doen?',
      'Heb ik revalidatie bij een verloskundige of fysiotherapeut nodig?',
      'Vraagt mijn litteken, scheur of keizersnede om bijzondere voorzorgen?',
    ],
    s10TipTitle: 'Goed om te weten',
    s10TipText:
      'Een professional raadplegen betekent niet per se dat er iets mis is. Een sessie kan gewoon helpen je techniek te controleren, je herstel te beoordelen en correct vooruitgang te leren boeken.',

    s11Heading: 'Een herstel dat tijd kost',
    s11Body1:
      'Na de bevalling is het normaal dat je niet meteen dezelfde gevoelens of spierkracht terugkrijgt als vóór de zwangerschap.',
    s11Body2:
      'Het doel is niet zoveel mogelijk aanspanningen te doen. Het gaat er meer om geleidelijk een goede coördinatie tussen aanspanning en ontspanning terug te vinden en deze spieren dan op natuurlijke wijze te kunnen gebruiken in dagelijkse activiteiten.',
    s11HighlightTitle: 'Kleine vooruitgang is echte vooruitgang',
    s11HighlightText:
      'Een beter besef van de beweging, een paar seconden langer aanspannen of minder urineverlies zijn al bemoedigende tekenen.',

    s12Heading: 'Belangrijkste punten',
    summaryTitle: 'De essentie',
    summaryItems: [
      'Zwangerschap en bevalling belasten de bekkenbodem aanzienlijk.',
      'Geleidelijk herstel is normaal na de bevalling.',
      'Bij de oefeningen gaat de kwaliteit van de beweging boven kracht.',
      'Ademhaling en ontspanning zijn net zo belangrijk als aanspanning.',
      'Urineverlies, een zwaar gevoel of aanhoudende pijn verdienen het oordeel van een professional.',
      'Revalidatie bij een verloskundige of fysiotherapeut kan je helpen betere controle terug te krijgen.',
      'Weer gaan sporten moet geleidelijk gebeuren, vooral bij activiteiten met hoge impact.',
    ],

    finalTipTitle: 'Neem de tijd om te herstellen',
    finalTipText:
      'Na de bevalling heeft je lichaam veel veranderingen doorgemaakt. De bekkenbodem verdient dezelfde aandacht als de rest van je lichaam: geleidelijk, regelmatig en zonder druk.',

    disclaimerText:
      'Dit artikel is alleen ter informatie en vervangt geen persoonlijk medisch advies. Als je pijn, aanhoudende klachten of zorgen over je herstel hebt, vraag dan advies aan een zorgprofessional.',
  },
  fi: {
    badge: 'SYNNYTYKSEN JÄLKEEN • TOIPUMINEN',
    title: 'Lantionpohjan vahvistaminen\nsynnytyksen jälkeen',
    metaDuration: '8 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro:
      'Raskauden ja synnytyksen jälkeen lantionpohja tarvitsee aikaa toipua. Yksinkertaiset, säännölliset ja asteittaiset harjoitukset voivat auttaa saamaan takaisin voimaa, hallintaa ja luottamusta ilman kiirehtimistä.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Lantionpohjan roolin ymmärtäminen',
      'Miksi synnytys rasittaa sitä',
      'Milloin aloittaa lantionpohjan kuntoutus',
      'Oikeaoppisen supistuksen oppiminen',
      'Asteittaisen rutiinin rakentaminen',
      'Vältettävät virheet',
      'Milloin pyytää apua',
      'Liikunnan asteittainen jatkaminen',
      'Vastaanottoon valmistautuminen',
      'Tärkeimmät asiat',
    ],
    shareMessage: 'Lantionpohjan vahvistaminen synnytyksen jälkeen — AWA',

    s1Heading: 'Lantionpohjan roolin ymmärtäminen',
    s1Body1:
      'Lantionpohja on lantion alaosassa sijaitseva lihasryhmä. Sillä on rooli virtsarakon ja suolen hallinnassa, ja se auttaa tukemaan lantion elimiä.',
    s1Body2:
      'Raskauden aikana nämä lihakset joutuvat kantamaan ylimääräistä painoa useita kuukausia. Myös synnytyksen aikana niihin kohdistuu huomattavaa rasitusta.',
    s1HighlightTitle: 'Huomaamaton mutta olennainen lihas',
    s1HighlightText:
      'Lantionpohja osallistuu useisiin päivittäisiin toimintoihin: virtsan ja ulosteen pidättämiseen, ilmavaivojen hallintaan, lantion elinten tukemiseen ja tiettyihin seksuaalisiin toimintoihin.',

    benefitsHeading: 'Vahvemman lantionpohjan edut',
    benefitsIntro:
      'Asteittainen, oikein suoritettu vahvistaminen voi auttaa parantamaan lantionpohjan hallintaa ja tukea.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Parempi virtsarakon hallinta',
        text: 'Lantionpohjalla on rooli virtsarakon hallinnassa. Sen vahvistaminen asteittain voi auttaa vähentämään tiettyä virtsanvuotoa.',
      },
      {
        icon: 'toilet',
        title: 'Suolen toiminnan tukeminen',
        text: 'Nämä lihakset auttavat myös hallitsemaan ilmavaivoja ja ulosteita ja osallistuvat lantion elinten tukemiseen.',
      },
      {
        icon: 'human-female',
        title: 'Lantion elinten tukeminen',
        text: 'Lantionpohja muodostaa todellisen lihaspohjan, joka auttaa tukemaan rakkoa, kohtua ja suolta.',
      },
      {
        icon: 'heart-pulse',
        title: 'Tuntemuksen palautuminen asteittain',
        text: 'Sopiva kuntoutus voi myös auttaa saamaan paremman tietoisuuden ja hallinnan tästä alueesta.',
      },
    ],

    s2Heading: 'Miksi raskaus ja synnytys rasittavat sitä',
    s2Body1:
      'Raskaus kohdistaa lantionpohjaan asteittain enemmän painetta. Alatiesynnytys voi sitten venyttää tämän alueen lihaksia ja kudoksia merkittävästi.',
    s2Body2:
      'Keisarinleikkauskaan ei täysin säästä lantionpohjaa: raskaus itsessään on näille lihaksille merkittävä jakso.',
    s2Body3:
      'Synnytyksen jälkeen on siis normaalia, että toipuminen vie aikaa. Jotkut naiset tuntevat lähes mitään oireita, kun taas toiset voivat huomata vuotoa, painon tunnetta tai heikentynyttä lihashallintaa.',
    s2TipTitle: 'Jokainen toipuminen on erilainen',
    s2TipText:
      'Synnytystapa, repeämä tai episiotomia, kivun esiintyminen ja yleistilasi synnytyksen jälkeen voivat kaikki vaikuttaa toipumiseen.',

    s3Heading: 'Milloin aloittaa lantionpohjan kuntoutus?',
    s3Body1:
      'Ongelmattoman synnytyksen jälkeen lantionpohjan lempeitä supistuksia voi yleensä jatkaa asteittain. On edelleen tärkeää mukauttaa harjoitukset tilanteeseesi ja pyytää neuvoa, jos sinulla oli komplikaatio, merkittävää kipua tai erityinen toimenpide.',
    s3Body2:
      'Jos sinulla on virtsakatetri, jotkin suositukset neuvovat odottamaan, kunnes se on poistettu ja normaali virtsaaminen on palannut, ennen kuin aloitat lantionpohjaharjoitukset.',
    s3AlertTitle: 'Älä jatka kivusta huolimatta',
    s3AlertText:
      'Merkittävä kipu, pahenevat oireet, huonosti paraneva haava tai mikä tahansa erityinen huoli vaatii kätilön, lääkärin tai kuntoutusammattilaisen neuvoa.',

    s4Heading: 'Oikeaoppisen supistuksen oppiminen',
    s4Body1:
      'Liikkeen tunnistamiseksi kuvittele yrittäväsi pidättää samanaikaisesti ilmavaivoja ja virtsaamisen tarvetta. Etsimäsi liike on supistumisen ja sisäänpäin nostamisen tunne.',
    s4Body2:
      'Tavoitteena ei ole jännittää koko kehoasi tiukasti. Pakaroiden, reisien ja vatsalihasten tulisi pysyä mahdollisimman rentoina hengityksen jatkuessa normaalisti.',
    exercises: [
      {icon: 'weather-windy', label: 'Hengitys'},
      {icon: 'human-handsup', label: 'Lempeä supistus'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Pitkä supistus'},
      {icon: 'gesture-tap-button', label: 'Nopeat supistukset'},
    ],
    s4HighlightTitle: 'Rentoutuminen on yhtä tärkeää',
    s4HighlightText:
      'Anna lihasten rentoutua täysin jokaisen supistuksen jälkeen. Hyvä kuntoutus ei tarkoita lantionpohjan pitämistä supistuneena koko päivän.',

    s5Heading: 'Asteittaisen rutiinin rakentaminen',
    s5Body1:
      'Aluksi tärkeintä on oppia tunnistamaan lihakset ja suorittamaan liike oikein. Säännöllisyys on tärkeämpää kuin voimakkuus.',
    s5h3a: 'Pitkät supistukset',
    s5Body2:
      'Supista lantionpohja lempeästi ja pidä supistus muutaman sekunnin ajan pidättämättä hengitystä. Päästä sitten kokonaan irti ennen uutta aloitusta.',
    s5h3b: 'Lyhyet supistukset',
    s5Body3:
      'Kun liike on hallinnassa, voit lisätä pieniä nopeita supistuksia. Ne harjoittavat kykyäsi supistaa lihaksia nopeasti vatsanpaineen noustessa, esimerkiksi juuri ennen yskimistä tai aivastamista.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Yhdistä harjoitukset päivittäiseen tapaan'},
      {icon: 'human-sitting', label: 'Aloita mukavassa asennossa'},
      {icon: 'weather-windy', label: 'Hengitä normaalisti supistusten aikana'},
      {icon: 'sleep', label: 'Kunnioita rentoutumisvaiheita'},
      {icon: 'chart-line', label: 'Lisää vaikeutta asteittain'},
      {icon: 'doctor', label: 'Pyydä neuvoa, jos olet epävarma'},
    ],
    s5TipTitle: 'Ennen kaikkea säännöllisyys',
    s5TipText:
      'Harjoitusten yhdistäminen jo päivääsi kuuluvaan tapaan voi helpottaa säännöllisyyden ylläpitoa: imetyksen jälkeen, hampaiden pesun jälkeen tai muulloin, kun se sopii sinulle.',

    s6Heading: 'Yleiset vältettävät virheet',
    s6Body1:
      'Lantionpohjaharjoitukset voivat näyttää yksinkertaisilta, mutta on helppo kompensoida muilla lihaksilla tai ponnistaa liikaa.',
    commonMistakes: [
      'Pakaroiden tai reisien jännittäminen lantionpohjan sijaan',
      'Hengityksen pidättäminen supistuksen aikana',
      'Lihasten pitäminen jatkuvasti supistettuina ilman että annat niiden rentoutua',
      'Harjoitusten tekeminen vain muutaman päivän ja sitten lopettaminen',
      'Virtsasuihkun tahallinen pysäyttäminen supistuksen tarkistamiseksi',
    ],
    s6TipTitle: 'Mitä ei pidä tehdä',
    s6TipText:
      'Harjoitusten tekemistä pysäyttämällä virtsasuihku tahallisesti ei suositella. Tämä menetelmä ei harjoita lantionpohjaa oikein ja voi häiritä normaalia rakon toimintaa.',

    s7Heading: 'Mitkä oireet pitäisi johtaa vastaanotolle?',
    s7Body1:
      'Pientä vuotoa tai epätavallista tunnetta voi joskus ilmetä synnytyksen jälkeen. Niitä ei kuitenkaan pidä sivuuttaa, jos ne jatkuvat, pahenevat tai häiritsevät arkeasi.',
    warningSigns: [
      'Virtsanvuoto yskiessä, aivastaessa, nauraessa tai ponnistaessa',
      'Painon tai paineen tunne alalantiossa',
      'Tunne, että kyhmy tai jokin laskeutuu emättimeen',
      'Vaikeus pidättää ilmavaivoja tai ulostetta',
      'Jatkuva kipu lantionpohjassa',
      'Kipu seksuaalisen kanssakäymisen aikana tai sen jälkeen',
      'Vaikeus tunnistaa tai supistaa lantionpohjan lihaksia oikein',
    ],
    consultLabel: 'Milloin pitäisi pyytää neuvoa?',
    s7Body2:
      'Kätilö, lääkäri tai lantionpohjan kuntoutukseen erikoistunut fysioterapeutti voi tarkistaa lihasten toiminnan ja ehdottaa sopivaa ohjelmaa.',

    s8Heading: 'Entä repeämän, episiotomian tai keisarinleikkauksen jälkeen?',
    s8Body1:
      'Repeämä tai episiotomia vaatii erityistä huolenpitoa paranemisen aikana. Toimintojen jatkamisessa tulee ottaa huomioon kipu, arven kunto ja synnytyksen jälkeen annetut ohjeet.',
    s8Body2:
      'Keisarinleikkauksen jälkeen toipuminen koskee myös vatsanseinää ja arpea. Vaikka synnytys ei olisi ollut alatiesynnytys, raskaus itsessään on silti rasittanut lantionpohjaa.',
    s8HighlightTitle: 'Henkilökohtainen hoito voi auttaa',
    s8HighlightText:
      'Merkittävän repeämän, kivun, virtsa- tai suolioireiden tai pitkäkestoisten vaikeuksien tapauksessa terveydenhuollon ammattilaisen arvio voi olla erityisen hyödyllinen.',

    s9Heading: 'Liikunnan asteittainen jatkaminen',
    s9Body1:
      'Liikkumisen jatkamisen synnytyksen jälkeen tulisi tapahtua asteittain. Kävelyä ja lempeitä liikkeitä voi yleensä jatkaa olosi mukaan, kun taas voimakasta rasitusta sisältävät toiminnot vaativat enemmän varovaisuutta.',
    s9Body2:
      'Ennen juoksemisen, hyppäämisen tai hyvin intensiivisen harjoittelun jatkamista on parasta arvioida lantionpohjan toipuminen ja ottaa huomioon mahdolliset oireet.',
    s9AlertTitle: 'Älä kiirehdi vaiheita',
    s9AlertText:
      'Vuoto, painon tunne tai kipu liikunnan aikana tai sen jälkeen ovat merkkejä siitä, että sinun pitäisi hidastaa ja pyytää neuvoa ennen voimakkuuden lisäämistä.',

    s10Heading: 'Milloin mennä erikoisammattilaisen luo?',
    s10Body1:
      'Lantionpohjan kuntoutus kätilön tai fysioterapeutin kanssa voi olla hyödyllistä, jos et ole varma, supistatko oikein, jos oireesi jatkuvat tai jos haluat jatkaa tiettyjä fyysisiä toimintoja luottavaisin mielin.',
    questionCardTitle: 'Hyödyllisiä kysymyksiä',
    appointmentQuestions: [
      'Sopivatko oireeni lantionpohjan heikkouteen?',
      'Suoritanko supistukset oikein?',
      'Kuinka monta toistoa minun pitäisi tehdä päivässä?',
      'Voinko palata juoksemiseen, urheiluun tai voimakasta rasitusta sisältävään liikuntaan?',
      'Tarvitsenko kuntoutusta kätilön tai fysioterapeutin kanssa?',
      'Vaatiiko arpeni, repeämäni tai keisarinleikkaukseni erityisiä varotoimia?',
    ],
    s10TipTitle: 'Hyvä tietää',
    s10TipText:
      'Ammattilaisen tapaaminen ei välttämättä tarkoita, että jokin olisi vialla. Käynti voi yksinkertaisesti auttaa tarkistamaan tekniikkasi, arvioimaan toipumistasi ja oppimaan etenemään oikein.',

    s11Heading: 'Toipuminen, joka vie aikaa',
    s11Body1:
      'Synnytyksen jälkeen on normaalia, ettet heti saa takaisin samoja tuntemuksia tai lihasvoimaa kuin ennen raskautta.',
    s11Body2:
      'Tavoitteena ei ole tehdä mahdollisimman monta supistusta. Kyse on enemmän supistumisen ja rentoutumisen hyvän koordinaation vähittäisestä uudelleenlöytämisestä ja näiden lihasten luonnollisesta käytöstä arjen toiminnoissa.',
    s11HighlightTitle: 'Pieni edistys on todellista edistystä',
    s11HighlightText:
      'Liikkeen parempi tiedostaminen, muutama sekunti lisää supistusta tai vuodon väheneminen ovat jo kannustavia merkkejä.',

    s12Heading: 'Tärkeimmät asiat',
    summaryTitle: 'Olennaiset asiat',
    summaryItems: [
      'Raskaus ja synnytys rasittavat lantionpohjaa merkittävästi.',
      'Asteittainen toipuminen on normaalia synnytyksen jälkeen.',
      'Harjoituksissa liikkeen laatu menee voiman edelle.',
      'Hengitys ja rentoutuminen ovat yhtä tärkeitä kuin supistus.',
      'Virtsanvuoto, painon tunne tai jatkuva kipu ansaitsevat ammattilaisen arvion.',
      'Kuntoutus kätilön tai fysioterapeutin kanssa voi auttaa saamaan paremman hallinnan takaisin.',
      'Urheilun jatkaminen tulisi tehdä asteittain, erityisesti voimakasta rasitusta sisältävissä toiminnoissa.',
    ],

    finalTipTitle: 'Ota aikaa toipumiseen',
    finalTipText:
      'Synnytyksen jälkeen kehosi on käynyt läpi paljon muutoksia. Lantionpohja ansaitsee saman huomion kuin muu kehosi: asteittain, säännöllisesti ja ilman painetta.',

    disclaimerText:
      'Tämä artikkeli on tarkoitettu vain tiedoksi eikä korvaa henkilökohtaista lääketieteellistä neuvontaa. Jos sinulla on kipua, pitkäkestoisia oireita tai huolia toipumisestasi, pyydä neuvoa terveydenhuollon ammattilaiselta.',
  },
  el: {
    badge: 'ΛΟΧΕΙΑ • ΑΝΑΡΡΩΣΗ',
    title: 'Ενδυνάμωση του πυελικού εδάφους\nμετά τον τοκετό',
    metaDuration: '8 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro:
      'Μετά την εγκυμοσύνη και τον τοκετό, το πυελικό έδαφος χρειάζεται χρόνο για να αναρρώσει. Απλές, τακτικές και σταδιακές ασκήσεις μπορούν να σε βοηθήσουν να ανακτήσεις δύναμη, έλεγχο και αυτοπεποίθηση, χωρίς να προσπαθείς να επιταχύνεις τα πράγματα.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Κατανοώντας τον ρόλο του περινέου',
      'Γιατί ο τοκετός το επιβαρύνει',
      'Πότε να ξεκινήσει η αποκατάσταση του πυελικού εδάφους',
      'Μαθαίνοντας να συσπάς σωστά',
      'Χτίζοντας μια σταδιακή ρουτίνα',
      'Λάθη που πρέπει να αποφεύγεις',
      'Πότε να ζητήσεις βοήθεια',
      'Σταδιακή επανέναρξη της άθλησης',
      'Προετοιμασία για ένα ραντεβού',
      'Βασικά συμπεράσματα',
    ],
    shareMessage: 'Ενδυνάμωση του πυελικού εδάφους μετά τον τοκετό — AWA',

    s1Heading: 'Κατανοώντας τον ρόλο του περινέου',
    s1Body1:
      'Το περίνεο, που ονομάζεται επίσης πυελικό έδαφος, είναι μια ομάδα μυών στη βάση της πυέλου. Παίζει ρόλο στον έλεγχο της κύστης και του εντέρου και βοηθά στη στήριξη των πυελικών οργάνων.',
    s1Body2:
      'Κατά την εγκυμοσύνη, αυτοί οι μύες πρέπει να σηκώνουν επιπλέον βάρος για αρκετούς μήνες. Καταπονούνται επίσης σημαντικά κατά τον τοκετό.',
    s1HighlightTitle: 'Ένας διακριτικός αλλά ουσιαστικός μυς',
    s1HighlightText:
      'Το πυελικό έδαφος εμπλέκεται σε διάφορες καθημερινές λειτουργίες: κράτημα ούρων και κοπράνων, έλεγχο των αερίων, στήριξη των πυελικών οργάνων και ρόλο σε ορισμένες σεξουαλικές λειτουργίες.',

    benefitsHeading: 'Τα οφέλη ενός πιο δυνατού πυελικού εδάφους',
    benefitsIntro:
      'Η σταδιακή, σωστά εκτελεσμένη ενδυνάμωση μπορεί να βοηθήσει στη βελτίωση του ελέγχου και της στήριξης του πυελικού εδάφους.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Καλύτερος έλεγχος της κύστης',
        text: 'Το πυελικό έδαφος παίζει ρόλο στον έλεγχο της κύστης. Η σταδιακή ενδυνάμωσή του μπορεί να βοηθήσει να μειωθούν ορισμένες διαρροές ούρων.',
      },
      {
        icon: 'toilet',
        title: 'Στήριξη της λειτουργίας του εντέρου',
        text: 'Αυτοί οι μύες βοηθούν επίσης στον έλεγχο των αερίων και των κοπράνων και συμβάλλουν στη στήριξη των πυελικών οργάνων.',
      },
      {
        icon: 'human-female',
        title: 'Στήριξη των πυελικών οργάνων',
        text: 'Το πυελικό έδαφος αποτελεί μια πραγματική μυϊκή βάση που βοηθά στη στήριξη της κύστης, της μήτρας και του εντέρου.',
      },
      {
        icon: 'heart-pulse',
        title: 'Σταδιακή ανάκτηση της αίσθησης',
        text: 'Η κατάλληλη αποκατάσταση μπορεί επίσης να σε βοηθήσει να ανακτήσεις καλύτερη επίγνωση και έλεγχο αυτής της περιοχής.',
      },
    ],

    s2Heading: 'Γιατί η εγκυμοσύνη και ο τοκετός το επιβαρύνουν',
    s2Body1:
      'Η εγκυμοσύνη ασκεί σταδιακά μεγαλύτερη πίεση στο πυελικό έδαφος. Ο κολπικός τοκετός μπορεί στη συνέχεια να τεντώσει σημαντικά τους μύες και τους ιστούς αυτής της περιοχής.',
    s2Body2:
      'Η καισαρική τομή δεν γλιτώνει εντελώς το πυελικό έδαφος: η ίδια η εγκυμοσύνη παραμένει μια σημαντική περίοδος για αυτούς τους μύες.',
    s2Body3:
      'Μετά τον τοκετό, είναι επομένως φυσιολογικό η ανάρρωση να παίρνει χρόνο. Ορισμένες γυναίκες δεν νιώθουν σχεδόν κανένα σύμπτωμα, ενώ άλλες μπορεί να παρατηρήσουν διαρροές, αίσθημα βάρους ή μειωμένο μυϊκό έλεγχο.',
    s2TipTitle: 'Κάθε ανάρρωση είναι διαφορετική',
    s2TipText:
      'Το είδος του τοκετού, ένας τραυματισμός ή μια επισιοτομία, η παρουσία πόνου και η γενική σου κατάσταση μετά τον τοκετό μπορούν όλα να επηρεάσουν την ανάρρωση.',

    s3Heading: 'Πότε να ξεκινήσει η αποκατάσταση του πυελικού εδάφους;',
    s3Body1:
      'Μετά από έναν τοκετό χωρίς επιπλοκές, οι ήπιες συσπάσεις του πυελικού εδάφους μπορούν συνήθως να ξαναρχίσουν σταδιακά. Παραμένει σημαντικό να προσαρμόζεις τις ασκήσεις στην περίπτωσή σου και να ζητάς συμβουλή αν είχες επιπλοκή, σημαντικό πόνο ή κάποια συγκεκριμένη επέμβαση.',
    s3Body2:
      'Αν έχεις ουροκαθετήρα, ορισμένες συστάσεις προτείνουν να περιμένεις μέχρι να αφαιρεθεί και να ξαναρχίσει η κανονική ούρηση πριν ξεκινήσεις ασκήσεις περινέου.',
    s3AlertTitle: 'Μην πιέζεις μέσα από τον πόνο',
    s3AlertText:
      'Ο σημαντικός πόνος, τα συμπτώματα που επιδεινώνονται, ένα τραύμα που επουλώνεται άσχημα ή οποιαδήποτε ιδιαίτερη ανησυχία απαιτούν συμβουλή από μια μαία, έναν γιατρό ή έναν επαγγελματία αποκατάστασης.',

    s4Heading: 'Μαθαίνοντας να συσπάς σωστά',
    s4Body1:
      'Για να εντοπίσεις την κίνηση, φαντάσου ότι προσπαθείς να κρατήσεις τα αέρια και την ανάγκη για ούρηση ταυτόχρονα. Η κίνηση που αναζητάς είναι μια αίσθηση σύσπασης και ανύψωσης προς τα μέσα.',
    s4Body2:
      'Στόχος δεν είναι να σφίξεις ολόκληρο το σώμα σου. Οι γλουτοί, οι μηροί και οι κοιλιακοί πρέπει να παραμένουν όσο το δυνατόν πιο χαλαροί, ενώ η αναπνοή συνεχίζεται κανονικά.',
    exercises: [
      {icon: 'weather-windy', label: 'Αναπνοή'},
      {icon: 'human-handsup', label: 'Ήπια σύσπαση'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Μακρά σύσπαση'},
      {icon: 'gesture-tap-button', label: 'Γρήγορες συσπάσεις'},
    ],
    s4HighlightTitle: 'Η χαλάρωση έχει την ίδια σημασία',
    s4HighlightText:
      'Μετά από κάθε σύσπαση, άφησε τους μύες να χαλαρώσουν πλήρως. Η καλή αποκατάσταση δεν σημαίνει να κρατάς το περίνεο συσπασμένο όλη την ημέρα.',

    s5Heading: 'Χτίζοντας μια σταδιακή ρουτίνα',
    s5Body1:
      'Στην αρχή, το πιο σημαντικό είναι να μάθεις να εντοπίζεις τους μύες και να εκτελείς σωστά την κίνηση. Η συνέπεια έχει μεγαλύτερη σημασία από την ένταση.',
    s5h3a: 'Μακρές συσπάσεις',
    s5Body2:
      'Σύσπασε απαλά το πυελικό έδαφος και στη συνέχεια κράτα τη σύσπαση για λίγα δευτερόλεπτα χωρίς να κρατάς την αναπνοή σου. Έπειτα χαλάρωσε πλήρως πριν ξεκινήσεις ξανά.',
    s5h3b: 'Σύντομες συσπάσεις',
    s5Body3:
      'Μόλις κατακτηθεί η κίνηση, μπορούν να προστεθούν μικρές γρήγορες συσπάσεις. Βοηθούν στην εκπαίδευση της ικανότητάς σου να συσπάς γρήγορα τους μύες όταν αυξάνεται η κοιλιακή πίεση, για παράδειγμα λίγο πριν από βήχα ή φτέρνισμα.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Συνδύασε τις ασκήσεις με μια καθημερινή συνήθεια'},
      {icon: 'human-sitting', label: 'Ξεκίνα σε μια άνετη θέση'},
      {icon: 'weather-windy', label: 'Αναπνέε κανονικά κατά τις συσπάσεις'},
      {icon: 'sleep', label: 'Σεβάσου τις φάσεις χαλάρωσης'},
      {icon: 'chart-line', label: 'Αύξανε σταδιακά τη δυσκολία'},
      {icon: 'doctor', label: 'Ζήτησε συμβουλή αν δεν είσαι σίγουρη'},
    ],
    s5TipTitle: 'Πάνω απ’ όλα συνέπεια',
    s5TipText:
      'Ο συνδυασμός των ασκήσεων με μια συνήθεια που ήδη υπάρχει στην ημέρα σου μπορεί να διευκολύνει τη συνέπεια: μετά από ένα γεύμα του μωρού, μετά το βούρτσισμα των δοντιών ή σε άλλη ώρα που σου ταιριάζει.',

    s6Heading: 'Συχνά λάθη που πρέπει να αποφεύγεις',
    s6Body1:
      'Οι ασκήσεις περινέου μπορεί να φαίνονται απλές, αλλά είναι εύκολο να αντισταθμίζεις με άλλους μύες ή να πιέζεις υπερβολικά.',
    commonMistakes: [
      'Σφίξιμο των γλουτών ή των μηρών αντί για το πυελικό έδαφος',
      'Κράτημα της αναπνοής κατά τη σύσπαση',
      'Διατήρηση των μυών συνεχώς συσπασμένων χωρίς να τους αφήνεις να χαλαρώσουν',
      'Εκτέλεση των ασκήσεων μόνο για λίγες ημέρες και στη συνέχεια διακοπή',
      'Σκόπιμη διακοπή της ροής των ούρων για να ελέγξεις τη σύσπαση',
    ],
    s6TipTitle: 'Τι να μην κάνεις',
    s6TipText:
      'Δεν συνιστάται να εξασκείσαι σκόπιμα διακόπτοντας τη ροή των ούρων. Αυτή η μέθοδος δεν εκπαιδεύει σωστά το περίνεο και μπορεί να διαταράξει την κανονική λειτουργία της κύστης.',

    s7Heading: 'Ποια συμπτώματα πρέπει να οδηγήσουν σε επίσκεψη;',
    s7Body1:
      'Μικρές διαρροές ή μια ασυνήθιστη αίσθηση μπορεί μερικές φορές να εμφανιστούν μετά τον τοκετό. Ωστόσο, δεν πρέπει να αγνοούνται αν επιμένουν, επιδεινώνονται ή παρεμβαίνουν στην καθημερινή σου ζωή.',
    warningSigns: [
      'Διαρροές ούρων όταν βήχεις, φτερνίζεσαι, γελάς ή πιέζεσαι',
      'Αίσθημα βάρους ή πίεσης στην κάτω πύελο',
      'Αίσθημα ότι ένας όγκος ή κάτι πέφτει στον κόλπο',
      'Δυσκολία στο κράτημα αερίων ή κοπράνων',
      'Επίμονος πόνος στο περίνεο',
      'Πόνος κατά τη διάρκεια ή μετά τη σεξουαλική επαφή',
      'Δυσκολία στον εντοπισμό ή στη σωστή σύσπαση των μυών του περινέου',
    ],
    consultLabel: 'Πότε πρέπει να ζητήσεις συμβουλή;',
    s7Body2:
      'Μια μαία, ένας γιατρός ή ένας φυσιοθεραπευτής εξειδικευμένος στην αποκατάσταση του πυελικού εδάφους μπορεί να ελέγξει τη μυϊκή λειτουργία και να προτείνει ένα κατάλληλο πρόγραμμα.',

    s8Heading: 'Και μετά από τραυματισμό, επισιοτομία ή καισαρική τομή;',
    s8Body1:
      'Ένας τραυματισμός ή μια επισιοτομία απαιτεί ιδιαίτερη φροντίδα κατά την επούλωση. Η επανέναρξη των δραστηριοτήτων πρέπει να λαμβάνει υπόψη τον πόνο, την κατάσταση της ουλής και την καθοδήγηση που δόθηκε μετά τον τοκετό.',
    s8Body2:
      'Μετά από καισαρική τομή, η ανάρρωση αφορά επίσης το κοιλιακό τοίχωμα και την ουλή. Ακόμη και αν ο τοκετός δεν ήταν κολπικός, η ίδια η εγκυμοσύνη επιβάρυνε παρ’ όλα αυτά το πυελικό έδαφος.',
    s8HighlightTitle: 'Η εξατομικευμένη φροντίδα μπορεί να βοηθήσει',
    s8HighlightText:
      'Σε περίπτωση σημαντικού τραυματισμού, πόνου, ουρολογικών ή εντερικών συμπτωμάτων ή επίμονων δυσκολιών, μια αξιολόγηση από έναν επαγγελματία υγείας μπορεί να είναι ιδιαίτερα χρήσιμη.',

    s9Heading: 'Σταδιακή επανέναρξη της άθλησης',
    s9Body1:
      'Η επανέναρξη της κίνησης μετά τον τοκετό πρέπει να γίνεται σταδιακά. Το περπάτημα και οι ήπιες κινήσεις μπορούν γενικά να ξαναρχίσουν ανάλογα με το πώς νιώθεις, ενώ οι δραστηριότητες υψηλής κρούσης απαιτούν περισσότερη προσοχή.',
    s9Body2:
      'Πριν ξαναρχίσεις το τρέξιμο, τα άλματα ή πολύ έντονη προπόνηση, είναι καλύτερα να αξιολογήσεις την ανάρρωση του πυελικού εδάφους και να λάβεις υπόψη τυχόν συμπτώματα.',
    s9AlertTitle: 'Μην βιάζεσαι στα στάδια',
    s9AlertText:
      'Οι διαρροές, το αίσθημα βάρους ή ο πόνος κατά τη διάρκεια ή μετά την άσκηση είναι σημάδια ότι πρέπει να επιβραδύνεις και να ζητήσεις συμβουλή πριν αυξήσεις την ένταση.',

    s10Heading: 'Πότε να επισκεφθείς ειδικό;',
    s10Body1:
      'Η αποκατάσταση του πυελικού εδάφους με μια μαία ή έναν φυσιοθεραπευτή μπορεί να είναι χρήσιμη αν δεν είσαι σίγουρη ότι συσπάς σωστά, αν τα συμπτώματά σου επιμένουν ή αν θέλεις να ξαναρχίσεις ορισμένες σωματικές δραστηριότητες με αυτοπεποίθηση.',
    questionCardTitle: 'Χρήσιμες ερωτήσεις',
    appointmentQuestions: [
      'Είναι τα συμπτώματά μου συμβατά με αδυναμία του πυελικού εδάφους;',
      'Εκτελώ σωστά τις συσπάσεις;',
      'Πόσες επαναλήψεις πρέπει να κάνω κάθε ημέρα;',
      'Μπορώ να ξαναρχίσω το τρέξιμο, την άθληση ή την άσκηση υψηλής κρούσης;',
      'Χρειάζομαι αποκατάσταση με μια μαία ή έναν φυσιοθεραπευτή;',
      'Απαιτεί η ουλή, ο τραυματισμός ή η καισαρική μου κάποια ιδιαίτερη προφύλαξη;',
    ],
    s10TipTitle: 'Καλό είναι να γνωρίζεις',
    s10TipText:
      'Το να επισκεφθείς έναν επαγγελματία δεν σημαίνει αναγκαστικά ότι κάτι δεν πάει καλά. Μια συνεδρία μπορεί απλώς να βοηθήσει να ελεγχθεί η τεχνική σου, να αξιολογηθεί η ανάρρωσή σου και να μάθεις να προοδεύεις σωστά.',

    s11Heading: 'Μια ανάρρωση που παίρνει χρόνο',
    s11Body1:
      'Μετά τον τοκετό, είναι φυσιολογικό να μην ανακτήσεις αμέσως τις ίδιες αισθήσεις ή την ίδια μυϊκή δύναμη που είχες πριν την εγκυμοσύνη.',
    s11Body2:
      'Στόχος δεν είναι να κάνεις όσο το δυνατόν περισσότερες συσπάσεις. Είναι περισσότερο να ανακτήσεις σταδιακά καλό συντονισμό ανάμεσα στη σύσπαση και στη χαλάρωση και στη συνέχεια να μπορείς να χρησιμοποιείς αυτούς τους μύες φυσικά στις καθημερινές δραστηριότητες.',
    s11HighlightTitle: 'Η μικρή πρόοδος είναι πραγματική πρόοδος',
    s11HighlightText:
      'Η καλύτερη επίγνωση της κίνησης, μερικά επιπλέον δευτερόλεπτα σύσπασης ή μια μείωση των διαρροών είναι ήδη ενθαρρυντικά σημάδια.',

    s12Heading: 'Βασικά συμπεράσματα',
    summaryTitle: 'Τα βασικά',
    summaryItems: [
      'Η εγκυμοσύνη και ο τοκετός επιβαρύνουν σημαντικά το πυελικό έδαφος.',
      'Η σταδιακή ανάρρωση είναι φυσιολογική μετά τον τοκετό.',
      'Οι ασκήσεις πρέπει να δίνουν προτεραιότητα στην ποιότητα της κίνησης αντί για τη δύναμη.',
      'Η αναπνοή και η χαλάρωση έχουν την ίδια σημασία με τη σύσπαση.',
      'Οι διαρροές ούρων, το βάρος ή ο επίμονος πόνος αξίζουν επαγγελματική γνώμη.',
      'Η αποκατάσταση με μια μαία ή έναν φυσιοθεραπευτή μπορεί να σε βοηθήσει να ανακτήσεις καλύτερο έλεγχο.',
      'Η επιστροφή στην άθληση πρέπει να είναι σταδιακή, ιδίως για δραστηριότητες υψηλής κρούσης.',
    ],

    finalTipTitle: 'Πάρε τον χρόνο σου για να αναρρώσεις',
    finalTipText:
      'Μετά τον τοκετό, το σώμα σου έχει περάσει από πολλές αλλαγές. Το περίνεο αξίζει την ίδια προσοχή με το υπόλοιπο σώμα σου: σταδιακά, τακτικά και χωρίς πίεση.',

    disclaimerText:
      'Αυτό το άρθρο είναι μόνο ενημερωτικό και δεν αντικαθιστά εξατομικευμένη ιατρική συμβουλή. Αν νιώσεις πόνο, επίμονα συμπτώματα ή έχεις οποιαδήποτε ανησυχία για την ανάρρωσή σου, ζήτησε συμβουλή από έναν επαγγελματία υγείας.',
  },
  fil: {
    badge: 'PAGKATAPOS MANGANAK • PAGGALING',
    title: 'Pagpapalakas ng iyong pelvic floor\npagkatapos manganak',
    metaDuration: '8 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro:
      'Pagkatapos ng pagbubuntis at panganganak, kailangan ng oras ng pelvic floor para gumaling. Ang simple, regular, at unti-unting mga ehersisyo ay makakatulong na mabawi mo ang lakas, kontrol, at kumpiyansa, nang hindi minamadali ang mga bagay.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Pag-unawa sa papel ng perineum',
      'Bakit nahihirapan ito dahil sa panganganak',
      'Kailan sisimulan ang rehabilitasyon ng pelvic floor',
      'Pag-aaral na tamang pumisil',
      'Pagbuo ng unti-unting routine',
      'Mga pagkakamaling dapat iwasan',
      'Kailan hihingi ng tulong',
      'Unti-unting pagbabalik sa isport',
      'Paghahanda para sa appointment',
      'Mahahalagang tandaan',
    ],
    shareMessage: 'Pagpapalakas ng iyong pelvic floor pagkatapos manganak — AWA',

    s1Heading: 'Pag-unawa sa papel ng perineum',
    s1Body1:
      'Ang perineum, na tinatawag ding pelvic floor, ay grupo ng mga kalamnan sa ilalim ng pelvis. May papel ito sa kontrol ng pantog at bituka at tumutulong na suportahan ang mga organo ng pelvis.',
    s1Body2:
      'Sa panahon ng pagbubuntis, kailangang pasanin ng mga kalamnang ito ang dagdag na bigat sa loob ng ilang buwan. Napapailalim din ang mga ito sa malaking stress sa panganganak.',
    s1HighlightTitle: 'Isang tahimik ngunit mahalagang kalamnan',
    s1HighlightText:
      'Kasangkot ang pelvic floor sa ilang pang-araw-araw na tungkulin: pagpigil ng ihi at dumi, pagkontrol ng utot, pagsuporta sa mga organo ng pelvis, at pagkakaroon ng papel sa ilang sekswal na tungkulin.',

    benefitsHeading: 'Ang mga benepisyo ng mas malakas na pelvic floor',
    benefitsIntro:
      'Ang unti-unti at tamang pagpapalakas ay makakatulong na mapabuti ang kontrol at suporta ng pelvic floor.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'Mas mahusay na kontrol sa pantog',
        text: 'May papel ang pelvic floor sa kontrol ng pantog. Ang unti-unting pagpapalakas nito ay maaaring makatulong na bawasan ang ilang pagtagas ng ihi.',
      },
      {
        icon: 'toilet',
        title: 'Pagsuporta sa paggana ng bituka',
        text: 'Tumutulong din ang mga kalamnang ito na kontrolin ang utot at dumi at nag-aambag sa pagsuporta sa mga organo ng pelvis.',
      },
      {
        icon: 'human-female',
        title: 'Pagsuporta sa mga organo ng pelvis',
        text: 'Ang pelvic floor ay bumubuo ng tunay na muscular na batayan na tumutulong na suportahan ang pantog, matris, at bituka.',
      },
      {
        icon: 'heart-pulse',
        title: 'Unti-unting pagbawi ng pakiramdam',
        text: 'Ang angkop na rehabilitasyon ay makakatulong din na mabawi mo ang mas mahusay na kamalayan at kontrol sa bahaging ito.',
      },
    ],

    s2Heading: 'Bakit nahihirapan ang pelvic floor dahil sa pagbubuntis at panganganak',
    s2Body1:
      'Unti-unting naglalagay ng mas maraming presyon sa pelvic floor ang pagbubuntis. Ang panganganak sa pamamagitan ng ari ay maaaring lubos na magbanat sa mga kalamnan at tisyu sa bahaging ito.',
    s2Body2:
      'Hindi rin ganap na nakakaligtas ang pelvic floor sa cesarean section: nananatiling mahalagang panahon para sa mga kalamnang ito ang pagbubuntis mismo.',
    s2Body3:
      'Pagkatapos manganak, normal kaya na abutin ng oras ang paggaling. May ilang babaeng halos walang nararamdamang sintomas, habang ang iba ay maaaring makapansin ng pagtagas, pakiramdam ng bigat, o nabawasang kontrol ng kalamnan.',
    s2TipTitle: 'Iba-iba ang bawat paggaling',
    s2TipText:
      'Ang uri ng panganganak, punit o episiotomy, presensya ng sakit, at ang iyong pangkalahatang kalagayan pagkatapos manganak ay maaaring lahat makaimpluwensya sa paggaling.',

    s3Heading: 'Kailan sisimulan ang rehabilitasyon ng pelvic floor?',
    s3Body1:
      'Pagkatapos ng panganganak na walang komplikasyon, karaniwang maaaring unti-unting ipagpatuloy ang banayad na pagpisil ng pelvic floor. Nananatiling mahalagang iangkop ang mga ehersisyo sa iyong sitwasyon at humingi ng payo kung nagkaroon ka ng komplikasyon, matinding sakit, o partikular na pamamaraan.',
    s3Body2:
      'Kung mayroon kang urinary catheter, may ilang rekomendasyong nagmumungkahing hintaying matanggal ito at bumalik ang normal na pag-ihi bago simulan ang mga ehersisyo ng perineum.',
    s3AlertTitle: 'Huwag pilitin kahit masakit',
    s3AlertText:
      'Ang matinding sakit, lumalalang mga sintomas, sugat na hindi maayos ang paggaling, o anumang partikular na alalahanin ay nangangailangan ng payo mula sa midwife, doktor, o propesyonal sa rehabilitasyon.',

    s4Heading: 'Pag-aaral na tamang pumisil',
    s4Body1:
      'Para matukoy ang galaw, isipin na sinusubukan mong pigilan ang utot at ang pagnanais na umihi nang sabay. Ang galaw na hinahanap mo ay pakiramdam ng pagpisil at pag-angat papasok.',
    s4Body2:
      'Hindi layunin na pigilan nang mahigpit ang buong katawan. Ang iyong puwit, hita, at abdominals ay dapat manatiling kasing-relax hangga’t maaari, habang normal na nagpapatuloy ang paghinga.',
    exercises: [
      {icon: 'weather-windy', label: 'Paghinga'},
      {icon: 'human-handsup', label: 'Banayad na pagpisil'},
      {icon: 'arrow-up-bold-circle-outline', label: 'Mahabang pagpisil'},
      {icon: 'gesture-tap-button', label: 'Mabibilis na pagpisil'},
    ],
    s4HighlightTitle: 'Kasing-halaga ng pagpisil ang pagrerelaks',
    s4HighlightText:
      'Pagkatapos ng bawat pagpisil, hayaang lubos na mag-relax ang mga kalamnan. Ang mahusay na rehabilitasyon ay hindi nangangahulugang panatilihing nakapisil ang perineum buong araw.',

    s5Heading: 'Pagbuo ng unti-unting routine',
    s5Body1:
      'Sa simula, pinakamahalaga ang matutunang tukuyin ang mga kalamnan at tamang gawin ang galaw. Mas mahalaga ang pagiging tuloy-tuloy kaysa sa tindi.',
    s5h3a: 'Mahabang pagpisil',
    s5Body2:
      'Banayad na pisilin ang pelvic floor, pagkatapos ay panatilihin ang pagpisil nang ilang segundo nang hindi pinipigil ang hininga. Pagkatapos ay lubos na bitawan bago muling magsimula.',
    s5h3b: 'Maiikling pagpisil',
    s5Body3:
      'Kapag natutunan na ang galaw, maaaring idagdag ang maliliit at mabibilis na pagpisil. Tumutulong ang mga ito na sanayin ang kakayahang mabilis na pisilin ang mga kalamnan kapag tumataas ang presyon sa tiyan, halimbawa bago umubo o bumahing.',
    dailyTips: [
      {icon: 'clock-outline', label: 'Ipares ang mga ehersisyo sa pang-araw-araw na gawi'},
      {icon: 'human-sitting', label: 'Magsimula sa komportableng posisyon'},
      {icon: 'weather-windy', label: 'Huminga nang normal habang pumipisil'},
      {icon: 'sleep', label: 'Igalang ang mga yugto ng pagrerelaks'},
      {icon: 'chart-line', label: 'Unti-unting dagdagan ang hirap'},
      {icon: 'doctor', label: 'Humingi ng payo kung hindi ka sigurado'},
    ],
    s5TipTitle: 'Pagiging tuloy-tuloy higit sa lahat',
    s5TipText:
      'Ang pagpapares ng mga ehersisyo sa gawing bahagi na ng iyong araw ay makakatulong na manatiling tuloy-tuloy: pagkatapos magpakain, pagkatapos magsipilyo, o sa ibang oras na angkop sa iyo.',

    s6Heading: 'Mga karaniwang pagkakamaling dapat iwasan',
    s6Body1:
      'Maaaring mukhang simple ang mga ehersisyo ng perineum, ngunit madaling bumawi gamit ang ibang kalamnan o sumobra sa pagpilit.',
    commonMistakes: [
      'Paninigas ng puwit o hita sa halip na ng pelvic floor',
      'Pagpigil ng hininga habang pumipisil',
      'Patuloy na pagpapanatili ng pagpisil ng mga kalamnan nang hindi hinahayaang mag-relax',
      'Paggawa ng mga ehersisyo sa loob lamang ng ilang araw at pagkatapos ay paghinto',
      'Sadyang pagpigil ng daloy ng ihi upang suriin ang pagpisil',
    ],
    s6TipTitle: 'Ang hindi dapat gawin',
    s6TipText:
      'Hindi inirerekomendang magsanay ng mga ehersisyo sa pamamagitan ng sadyang pagpigil ng daloy ng ihi. Hindi nito wastong sinasanay ang perineum at maaaring makagambala sa normal na paggana ng pantog.',

    s7Heading: 'Anong mga sintomas ang dapat magtulak sa konsultasyon?',
    s7Body1:
      'Ang maliliit na pagtagas o hindi pangkaraniwang pakiramdam ay minsang lumilitaw pagkatapos manganak. Gayunpaman, hindi dapat balewalain ang mga ito kung nagpapatuloy, lumalala, o nakakaabala sa iyong pang-araw-araw na buhay.',
    warningSigns: [
      'Pagtagas ng ihi kapag umuubo, bumabahing, tumatawa, o umiire',
      'Pakiramdam ng bigat o presyon sa ibabang bahagi ng pelvis',
      'Pakiramdam na may bukol o kung anong bumababa sa ari',
      'Hirap pigilan ang utot o dumi',
      'Patuloy na sakit sa perineum',
      'Sakit habang o pagkatapos ng pakikipagtalik',
      'Hirap tukuyin o tamang pisilin ang mga kalamnan ng perineum',
    ],
    consultLabel: 'Kailan dapat humingi ng payo?',
    s7Body2:
      'Maaaring suriin ng midwife, doktor, o physiotherapist na dalubhasa sa rehabilitasyon ng pelvic floor ang paggana ng kalamnan at magmungkahi ng angkop na programa.',

    s8Heading: 'At pagkatapos ng punit, episiotomy, o cesarean section?',
    s8Body1:
      'Nangangailangan ng espesyal na pag-aalaga ang punit o episiotomy sa panahon ng paghilom. Dapat isaalang-alang sa pagpapatuloy ng mga gawain ang sakit, kondisyon ng peklat, at ang gabay na ibinigay pagkatapos manganak.',
    s8Body2:
      'Pagkatapos ng cesarean section, kasama rin sa paggaling ang dingding ng tiyan at ang peklat. Kahit hindi sa ari ang panganganak, naglagay pa rin ng stress sa pelvic floor ang pagbubuntis mismo.',
    s8HighlightTitle: 'Makakatulong ang personalisadong pangangalaga',
    s8HighlightText:
      'Sa kaso ng malaking punit, sakit, sintomas sa ihi o bituka, o patuloy na mga hirap, ang pagsusuri kasama ang propesyonal sa kalusugan ay maaaring lalong makatulong.',

    s9Heading: 'Unti-unting pagbabalik sa isport',
    s9Body1:
      'Dapat unti-unti ang pagbabalik sa paggalaw pagkatapos manganak. Ang paglalakad at banayad na mga galaw ay karaniwang maaaring ipagpatuloy batay sa pakiramdam mo, habang ang mga aktibidad na may malakas na impact ay nangangailangan ng higit na pag-iingat.',
    s9Body2:
      'Bago ipagpatuloy ang pagtakbo, pagtalon, o napakatinding pagsasanay, pinakamainam na tasahin ang paggaling ng pelvic floor at isaalang-alang ang anumang sintomas.',
    s9AlertTitle: 'Huwag madaliin ang mga yugto',
    s9AlertText:
      'Ang pagtagas, pakiramdam ng bigat, o sakit habang o pagkatapos ng ehersisyo ay mga senyales na dapat kang magdahan-dahan at humingi ng payo bago dagdagan ang tindi.',

    s10Heading: 'Kailan magpapatingin sa espesyalista?',
    s10Body1:
      'Ang rehabilitasyon ng pelvic floor kasama ang midwife o physiotherapist ay maaaring makatulong kung hindi ka sigurado kung tama ang iyong pagpisil, kung nagpapatuloy ang iyong mga sintomas, o kung gusto mong ipagpatuloy ang ilang pisikal na aktibidad nang may kumpiyansa.',
    questionCardTitle: 'Mga kapaki-pakinabang na tanong na itatanong',
    appointmentQuestions: [
      'Tugma ba ang aking mga sintomas sa panghihina ng pelvic floor?',
      'Tama ba ang pagsasagawa ko ng mga pagpisil?',
      'Ilang ulit ang dapat kong gawin kada araw?',
      'Maaari ba akong bumalik sa pagtakbo, isport, o ehersisyong may malakas na impact?',
      'Kailangan ko ba ng rehabilitasyon kasama ang midwife o physiotherapist?',
      'Nangangailangan ba ng anumang partikular na pag-iingat ang aking peklat, punit, o cesarean section?',
    ],
    s10TipTitle: 'Mabuting malaman',
    s10TipText:
      'Ang pagpapatingin sa propesyonal ay hindi kinakailangang nangangahulugang may mali. Ang isang sesyon ay maaaring simpleng makatulong na suriin ang iyong teknik, tasahin ang paggaling, at matutunang umusad nang tama.',

    s11Heading: 'Isang paggaling na nangangailangan ng oras',
    s11Body1:
      'Pagkatapos manganak, normal na hindi agad mabawi ang parehong pakiramdam o lakas ng kalamnan na mayroon ka bago magbuntis.',
    s11Body2:
      'Hindi layunin ang gumawa ng pinakamaraming pagpisil hangga’t maaari. Mas tungkol ito sa unti-unting pagbawi ng mahusay na koordinasyon sa pagitan ng pagpisil at pagrerelaks, at pagkatapos ay natural na magamit ang mga kalamnang ito sa pang-araw-araw na gawain.',
    s11HighlightTitle: 'Tunay na pag-usad ang maliliit na pag-usad',
    s11HighlightText:
      'Ang mas mahusay na kamalayan sa galaw, ilang dagdag na segundo ng pagpisil, o pagbawas ng pagtagas ay nakakapagpalakas-loob nang mga senyales.',

    s12Heading: 'Mahahalagang tandaan',
    summaryTitle: 'Ang mahalaga',
    summaryItems: [
      'Naglalagay ng malaking stress sa pelvic floor ang pagbubuntis at panganganak.',
      'Normal ang unti-unting paggaling pagkatapos manganak.',
      'Dapat unahin ng mga ehersisyo ang kalidad ng galaw kaysa sa lakas.',
      'Kasing-halaga ng pagpisil ang paghinga at pagrerelaks.',
      'Ang pagtagas ng ihi, pakiramdam ng bigat, o patuloy na sakit ay nararapat bigyan ng opinyon ng propesyonal.',
      'Ang rehabilitasyon kasama ang midwife o physiotherapist ay makakatulong na mabawi ang mas mahusay na kontrol.',
      'Dapat unti-unti ang pagbabalik sa isport, lalo na ang mga aktibidad na may malakas na impact.',
    ],

    finalTipTitle: 'Maglaan ng oras para gumaling',
    finalTipText:
      'Pagkatapos manganak, maraming pagbabagong pinagdaanan ang iyong katawan. Karapat-dapat sa parehong atensyon ang perineum gaya ng natitirang bahagi ng iyong katawan: unti-unti, regular, at walang pressure.',

    disclaimerText:
      'Para sa impormasyon lamang ang artikulong ito at hindi pumapalit sa personalisadong payong medikal. Kung nakararanas ka ng sakit, patuloy na mga sintomas, o may anumang alalahanin tungkol sa iyong paggaling, humingi ng payo sa propesyonal sa kalusugan.',
  },
  ta: {
    badge: 'பிரசவத்திற்குப் பின் • மீட்பு',
    title: 'பிரசவத்திற்குப் பின் உங்கள்\nஇடுப்புத் தளத்தை வலுப்படுத்துதல்',
    metaDuration: '8 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro:
      'கர்ப்பத்துக்கும் பிரசவத்துக்கும் பிறகு, இடுப்புத் தளம் மீள நேரம் தேவை. எளிய, ஒழுங்கான, படிப்படியான பயிற்சிகள், விரைவுபடுத்த முயலாமல், வலிமையையும் கட்டுப்பாட்டையும் நம்பிக்கையையும் மீண்டும் பெற உதவலாம்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'பெரினியத்தின் பங்கைப் புரிந்துகொள்ளுதல்',
      'பிரசவம் ஏன் அதற்கு அழுத்தம் தருகிறது',
      'இடுப்புத் தள மறுவாழ்வை எப்போது தொடங்குவது',
      'சரியாகச் சுருக்கக் கற்றல்',
      'படிப்படியான வழக்கத்தை உருவாக்குதல்',
      'தவிர்க்க வேண்டிய தவறுகள்',
      'உதவியை எப்போது கேட்பது',
      'விளையாட்டை மெதுவாகத் தொடங்குதல்',
      'சந்திப்புக்குத் தயாராதல்',
      'முக்கியக் குறிப்புகள்',
    ],
    shareMessage: 'பிரசவத்திற்குப் பின் உங்கள் இடுப்புத் தளத்தை வலுப்படுத்துதல் — AWA',

    s1Heading: 'பெரினியத்தின் பங்கைப் புரிந்துகொள்ளுதல்',
    s1Body1:
      'பெரினியம், இடுப்புத் தளம் எனவும் அழைக்கப்படுவது, இடுப்பின் அடிப்பகுதியில் அமைந்த தசைகளின் தொகுப்பு. இது சிறுநீர்ப்பை மற்றும் குடல் கட்டுப்பாட்டில் பங்கு வகிக்கிறது, இடுப்பு உறுப்புகளைத் தாங்க உதவுகிறது.',
    s1Body2:
      'கர்ப்ப காலத்தில், இந்தத் தசைகள் பல மாதங்கள் கூடுதல் எடையைத் தாங்க வேண்டியுள்ளது. பிரசவத்தின்போதும் அவை கணிசமான அழுத்தத்துக்கு உள்ளாகின்றன.',
    s1HighlightTitle: 'அடக்கமான ஆனால் அத்தியாவசியமான தசை',
    s1HighlightText:
      'இடுப்புத் தளம் பல அன்றாடச் செயல்பாடுகளில் ஈடுபடுகிறது: சிறுநீரையும் மலத்தையும் அடக்குதல், வாயுவைக் கட்டுப்படுத்துதல், இடுப்பு உறுப்புகளைத் தாங்குதல், மேலும் சில பாலியல் செயல்பாடுகளில் பங்கு வகித்தல்.',

    benefitsHeading: 'வலுவான இடுப்புத் தளத்தின் நன்மைகள்',
    benefitsIntro:
      'படிப்படியான, சரியாகச் செய்யப்படும் வலுப்படுத்தல் இடுப்புத் தளக் கட்டுப்பாட்டையும் தாங்குதிறனையும் மேம்படுத்த உதவலாம்.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'சிறந்த சிறுநீர்ப்பைக் கட்டுப்பாடு',
        text: 'இடுப்புத் தளம் சிறுநீர்ப்பைக் கட்டுப்பாட்டில் பங்கு வகிக்கிறது. அதைப் படிப்படியாக வலுப்படுத்துவது சில சிறுநீர்க் கசிவுகளைக் குறைக்க உதவலாம்.',
      },
      {
        icon: 'toilet',
        title: 'குடல் செயல்பாட்டுக்கு ஆதரவு',
        text: 'இந்தத் தசைகள் வாயுவையும் மலத்தையும் கட்டுப்படுத்தவும் இடுப்பு உறுப்புகளைத் தாங்கவும் உதவுகின்றன.',
      },
      {
        icon: 'human-female',
        title: 'இடுப்பு உறுப்புகளுக்கு ஆதரவு',
        text: 'இடுப்புத் தளம் சிறுநீர்ப்பை, கருப்பை மற்றும் குடலைத் தாங்க உதவும் உண்மையான தசை அடித்தளத்தை உருவாக்குகிறது.',
      },
      {
        icon: 'heart-pulse',
        title: 'உணர்வை மெதுவாக மீட்டல்',
        text: 'பொருத்தமான மறுவாழ்வு இந்தப் பகுதியைப் பற்றிய சிறந்த விழிப்புணர்வையும் கட்டுப்பாட்டையும் மீண்டும் பெற உதவலாம்.',
      },
    ],

    s2Heading: 'கர்ப்பமும் பிரசவமும் ஏன் அழுத்தம் தருகின்றன',
    s2Body1:
      'கர்ப்பம் படிப்படியாக இடுப்புத் தளத்தின் மீது அதிக அழுத்தத்தைச் செலுத்துகிறது. பின்னர் யோனி வழிப் பிரசவம் இந்தப் பகுதியின் தசைகளையும் திசுக்களையும் கணிசமாக நீட்டலாம்.',
    s2Body2:
      'சிசேரியன் அறுவைச் சிகிச்சையும் இடுப்புத் தளத்தை முழுமையாகக் காப்பதில்லை: கர்ப்பமே இந்தத் தசைகளுக்கு ஒரு முக்கியக் காலமாக இருக்கிறது.',
    s2Body3:
      'எனவே பிரசவத்துக்குப் பின் மீட்புக்கு நேரம் எடுப்பது இயல்பு. சில பெண்கள் கிட்டத்தட்ட எந்த அறிகுறிகளையும் உணர மாட்டார்கள், மற்றவர்கள் கசிவுகள், கனம் போன்ற உணர்வு அல்லது குறைந்த தசைக் கட்டுப்பாட்டைக் கவனிக்கலாம்.',
    s2TipTitle: 'ஒவ்வொரு மீட்பும் வேறுபட்டது',
    s2TipText:
      'பிரசவத்தின் வகை, கிழிவு அல்லது எபிசியோடமி, வலியின் இருப்பு மற்றும் பிரசவத்துக்குப் பின் உங்கள் பொது நிலை அனைத்தும் மீட்பைப் பாதிக்கலாம்.',

    s3Heading: 'இடுப்புத் தள மறுவாழ்வை எப்போது தொடங்குவது?',
    s3Body1:
      'சிக்கலில்லாத பிரசவத்துக்குப் பின், மென்மையான இடுப்புத் தளச் சுருக்கங்களைப் பொதுவாகப் படிப்படியாகத் தொடங்கலாம். பயிற்சிகளை உங்கள் சூழ்நிலைக்கு ஏற்ப மாற்றியமைப்பதும், ஒரு சிக்கல், குறிப்பிடத்தக்க வலி அல்லது குறிப்பிட்ட செயல்முறையை அனுபவித்திருந்தால் ஆலோசனை பெறுவதும் முக்கியம்.',
    s3Body2:
      'உங்களுக்குச் சிறுநீர்க் குழாய் (கதீட்டர்) இருந்தால், அது அகற்றப்பட்டு இயல்பான சிறுநீர் கழித்தல் மீண்டும் தொடங்கும் வரை பெரினியப் பயிற்சிகளைத் தொடங்காமல் காத்திருக்க சில பரிந்துரைகள் கூறுகின்றன.',
    s3AlertTitle: 'வலியைப் பொருட்படுத்தாமல் தொடராதீர்கள்',
    s3AlertText:
      'குறிப்பிடத்தக்க வலி, மோசமடையும் அறிகுறிகள், சரியாக ஆறாத காயம் அல்லது ஏதேனும் குறிப்பிட்ட கவலைக்கு ஒரு மருத்துவச்சி, மருத்துவர் அல்லது மறுவாழ்வு நிபுணரின் ஆலோசனை தேவை.',

    s4Heading: 'சரியாகச் சுருக்கக் கற்றல்',
    s4Body1:
      'இயக்கத்தை அடையாளம் காண, வாயுவையும் சிறுநீர் கழிக்கும் உந்துதலையும் ஒரே நேரத்தில் அடக்க முயல்வதாகக் கற்பனை செய்யுங்கள். நீங்கள் தேடும் இயக்கம் உள்நோக்கிச் சுருங்கி மேலே தூக்கும் ஓர் உணர்வு.',
    s4Body2:
      'நோக்கம் உங்கள் முழு உடலையும் இறுக்கமாக இறுக்குவதல்ல. சுவாசம் இயல்பாகத் தொடரும்போது, உங்கள் பிட்டம், தொடைகள் மற்றும் வயிற்றுத் தசைகள் முடிந்தவரை தளர்வாக இருக்க வேண்டும்.',
    exercises: [
      {icon: 'weather-windy', label: 'சுவாசம்'},
      {icon: 'human-handsup', label: 'மென்மையான சுருக்கம்'},
      {icon: 'arrow-up-bold-circle-outline', label: 'நீண்ட சுருக்கம்'},
      {icon: 'gesture-tap-button', label: 'விரைவான சுருக்கங்கள்'},
    ],
    s4HighlightTitle: 'தளர்வும் அதே அளவு முக்கியம்',
    s4HighlightText:
      'ஒவ்வொரு சுருக்கத்துக்குப் பின்னும், தசைகளை முழுமையாகத் தளர விடுங்கள். நல்ல மறுவாழ்வு என்பது நாள் முழுவதும் பெரினியத்தைச் சுருக்கியே வைத்திருப்பதல்ல.',

    s5Heading: 'படிப்படியான வழக்கத்தை உருவாக்குதல்',
    s5Body1:
      'தொடக்கத்தில், தசைகளை அடையாளம் கண்டு இயக்கத்தைச் சரியாகச் செய்யக் கற்பதே மிக முக்கியம். தீவிரத்தை விடத் தொடர்ச்சியே முக்கியம்.',
    s5h3a: 'நீண்ட சுருக்கங்கள்',
    s5Body2:
      'இடுப்புத் தளத்தை மென்மையாகச் சுருக்குங்கள், பின் மூச்சை அடக்காமல் சில விநாடிகள் சுருக்கத்தைப் பிடித்திருங்கள். மீண்டும் தொடங்கும் முன் முழுமையாக விடுவியுங்கள்.',
    s5h3b: 'குறுகிய சுருக்கங்கள்',
    s5Body3:
      'இயக்கம் கைவந்த பின், சிறு விரைவான சுருக்கங்களைச் சேர்க்கலாம். வயிற்றழுத்தம் அதிகரிக்கும்போது, எடுத்துக்காட்டாக இருமுவதற்கு அல்லது தும்முவதற்குச் சற்று முன், தசைகளை விரைவாகச் சுருக்கும் திறனைப் பயிற்றுவிக்க அவை உதவுகின்றன.',
    dailyTips: [
      {icon: 'clock-outline', label: 'பயிற்சிகளை ஒரு தினசரிப் பழக்கத்துடன் இணையுங்கள்'},
      {icon: 'human-sitting', label: 'வசதியான நிலையில் தொடங்குங்கள்'},
      {icon: 'weather-windy', label: 'சுருக்கங்களின்போது இயல்பாகச் சுவாசியுங்கள்'},
      {icon: 'sleep', label: 'தளர்வுக் கட்டங்களை மதியுங்கள்'},
      {icon: 'chart-line', label: 'சிரமத்தைப் படிப்படியாக அதிகரியுங்கள்'},
      {icon: 'doctor', label: 'உறுதியில்லையெனில் ஆலோசனை கேளுங்கள்'},
    ],
    s5TipTitle: 'எல்லாவற்றுக்கும் மேலாகத் தொடர்ச்சி',
    s5TipText:
      'பயிற்சிகளை ஏற்கெனவே உங்கள் நாளின் ஒரு பகுதியாக உள்ள பழக்கத்துடன் இணைப்பது தொடர்ச்சியைப் பேண எளிதாக்கலாம்: பாலூட்டிய பின், பல் துலக்கிய பின், அல்லது உங்களுக்கு ஏற்ற வேறு நேரத்தில்.',

    s6Heading: 'தவிர்க்க வேண்டிய பொதுவான தவறுகள்',
    s6Body1:
      'பெரினியப் பயிற்சிகள் எளிமையாகத் தோன்றலாம், ஆனால் பிற தசைகளால் ஈடுசெய்வதும் அதிகமாக அழுத்துவதும் எளிது.',
    commonMistakes: [
      'இடுப்புத் தளத்துக்குப் பதிலாக பிட்டத்தையோ தொடைகளையோ இறுக்குதல்',
      'சுருக்கத்தின்போது மூச்சை அடக்குதல்',
      'தசைகளைத் தளர விடாமல் தொடர்ந்து சுருக்கியே வைத்திருத்தல்',
      'சில நாட்கள் மட்டும் பயிற்சி செய்து பின் நிறுத்துதல்',
      'சுருக்கத்தைச் சோதிக்க வேண்டுமென்றே சிறுநீர்ப் பாய்ச்சலை நிறுத்துதல்',
    ],
    s6TipTitle: 'செய்யக்கூடாதவை',
    s6TipText:
      'வேண்டுமென்றே சிறுநீர்ப் பாய்ச்சலை நிறுத்துவதன் மூலம் பயிற்சிகளைச் செய்வது பரிந்துரைக்கப்படுவதில்லை. இந்த முறை பெரினியத்தைச் சரியாகப் பயிற்றுவிக்காது, இயல்பான சிறுநீர்ப்பைச் செயல்பாட்டைக் குலைக்கவும் கூடும்.',

    s7Heading: 'எந்த அறிகுறிகள் ஆலோசனையைத் தூண்ட வேண்டும்?',
    s7Body1:
      'சிறு கசிவுகள் அல்லது வழக்கத்துக்கு மாறான உணர்வு பிரசவத்துக்குப் பின் சில நேரங்களில் தோன்றலாம். இருப்பினும், அவை நீடித்தாலோ மோசமடைந்தாலோ உங்கள் அன்றாட வாழ்க்கையைப் பாதித்தாலோ புறக்கணிக்கக் கூடாது.',
    warningSigns: [
      'இருமும்போது, தும்மும்போது, சிரிக்கும்போது அல்லது முக்கும்போது சிறுநீர்க் கசிவு',
      'கீழ் இடுப்பில் கனம் அல்லது அழுத்த உணர்வு',
      'யோனியில் ஒரு கட்டி அல்லது ஏதோ ஒன்று இறங்குவது போன்ற உணர்வு',
      'வாயுவையோ மலத்தையோ அடக்குவதில் சிரமம்',
      'பெரினியத்தில் நீடிக்கும் வலி',
      'உடலுறவின்போது அல்லது அதற்குப் பின் வலி',
      'பெரினியத் தசைகளை அடையாளம் காண்பதில் அல்லது சரியாகச் சுருக்குவதில் சிரமம்',
    ],
    consultLabel: 'ஆலோசனையை எப்போது கேட்க வேண்டும்?',
    s7Body2:
      'இடுப்புத் தள மறுவாழ்வில் நிபுணத்துவம் பெற்ற ஒரு மருத்துவச்சி, மருத்துவர் அல்லது பிசியோதெரபிஸ்ட் தசைச் செயல்பாட்டைச் சரிபார்த்துப் பொருத்தமான திட்டத்தைப் பரிந்துரைக்கலாம்.',

    s8Heading: 'கிழிவு, எபிசியோடமி அல்லது சிசேரியனுக்குப் பிறகு?',
    s8Body1:
      'கிழிவு அல்லது எபிசியோடமி ஆறும்போது தனிப்பட்ட கவனிப்பு தேவை. செயல்பாடுகளை மீண்டும் தொடங்குவது வலி, தழும்பின் நிலை மற்றும் பிரசவத்துக்குப் பின் வழங்கப்பட்ட வழிகாட்டுதலைக் கருத்தில் கொள்ள வேண்டும்.',
    s8Body2:
      'சிசேரியனுக்குப் பின், மீட்பில் வயிற்றுச் சுவரும் தழும்பும் அடங்கும். பிரசவம் யோனி வழியாக இல்லாவிட்டாலும், கர்ப்பமே இடுப்புத் தளத்துக்கு அழுத்தம் தந்திருக்கிறது.',
    s8HighlightTitle: 'தனிப்பயனாக்கப்பட்ட பராமரிப்பு உதவலாம்',
    s8HighlightText:
      'குறிப்பிடத்தக்க கிழிவு, வலி, சிறுநீர் அல்லது குடல் அறிகுறிகள் அல்லது நீடிக்கும் சிரமங்கள் இருந்தால், ஒரு சுகாதார நிபுணருடனான மதிப்பீடு குறிப்பாக உதவியாக இருக்கும்.',

    s9Heading: 'விளையாட்டை மெதுவாகத் தொடங்குதல்',
    s9Body1:
      'பிரசவத்துக்குப் பின் இயக்கத்தை மீண்டும் தொடங்குவது படிப்படியாக இருக்க வேண்டும். நடைப்பயிற்சியும் மென்மையான இயக்கங்களும் பொதுவாக நீங்கள் உணரும் விதத்தின் அடிப்படையில் தொடரலாம், அதிக அதிர்ச்சிச் செயல்பாடுகளுக்கு அதிக எச்சரிக்கை தேவை.',
    s9Body2:
      'ஓட்டம், குதித்தல் அல்லது மிகத் தீவிரப் பயிற்சியை மீண்டும் தொடங்கும் முன், இடுப்புத் தள மீட்பை மதிப்பிட்டு ஏதேனும் அறிகுறிகளைக் கருத்தில் கொள்வது நல்லது.',
    s9AlertTitle: 'படிகளை அவசரப்படுத்தாதீர்கள்',
    s9AlertText:
      'பயிற்சியின்போது அல்லது அதற்குப் பின் கசிவுகள், கனம் போன்ற உணர்வு அல்லது வலி ஆகியவை நீங்கள் வேகத்தைக் குறைத்துத் தீவிரத்தை அதிகரிக்கும் முன் ஆலோசனை பெற வேண்டும் என்பதற்கான அறிகுறிகள்.',

    s10Heading: 'ஒரு நிபுணரை எப்போது பார்ப்பது?',
    s10Body1:
      'நீங்கள் சரியாகச் சுருக்குகிறீர்களா என்று உறுதியில்லாதபோது, உங்கள் அறிகுறிகள் நீடிக்கும்போது, அல்லது சில உடல் செயல்பாடுகளை நம்பிக்கையுடன் மீண்டும் தொடங்க விரும்பும்போது, ஒரு மருத்துவச்சி அல்லது பிசியோதெரபிஸ்டுடனான இடுப்புத் தள மறுவாழ்வு உதவியாக இருக்கலாம்.',
    questionCardTitle: 'கேட்க உதவும் கேள்விகள்',
    appointmentQuestions: [
      'என் அறிகுறிகள் இடுப்புத் தள பலவீனத்துடன் ஒத்துப்போகின்றனவா?',
      'நான் சுருக்கங்களைச் சரியாகச் செய்கிறேனா?',
      'ஒவ்வொரு நாளும் எத்தனை முறை செய்ய வேண்டும்?',
      'நான் மீண்டும் ஓட்டம், விளையாட்டு அல்லது அதிக அதிர்ச்சிப் பயிற்சிக்குத் திரும்பலாமா?',
      'எனக்கு ஒரு மருத்துவச்சி அல்லது பிசியோதெரபிஸ்டுடன் மறுவாழ்வு தேவையா?',
      'என் தழும்பு, கிழிவு அல்லது சிசேரியனுக்கு ஏதேனும் குறிப்பிட்ட முன்னெச்சரிக்கைகள் தேவையா?',
    ],
    s10TipTitle: 'தெரிந்துகொள்ளுங்கள்',
    s10TipText:
      'ஒரு நிபுணரைப் பார்ப்பது ஏதோ தவறு என்று கட்டாயம் பொருளல்ல. ஒரு அமர்வு உங்கள் நுட்பத்தைச் சரிபார்க்கவும் உங்கள் மீட்பை மதிப்பிடவும் சரியாக முன்னேறக் கற்கவும் உதவலாம்.',

    s11Heading: 'நேரம் எடுக்கும் ஒரு மீட்பு',
    s11Body1:
      'குழந்தை பிறந்த பின், கர்ப்பத்துக்கு முன் இருந்த அதே உணர்வுகளையும் தசை வலிமையையும் உடனே மீண்டும் பெறாதது இயல்பு.',
    s11Body2:
      'முடிந்தவரை அதிகச் சுருக்கங்களைச் செய்வது நோக்கமல்ல. சுருக்கத்துக்கும் தளர்வுக்கும் இடையே நல்ல ஒருங்கிணைப்பை மெதுவாக மீட்டு, பின் இந்தத் தசைகளை அன்றாடச் செயல்பாடுகளில் இயல்பாகப் பயன்படுத்த முடிவதே முக்கியம்.',
    s11HighlightTitle: 'சிறு முன்னேற்றமும் உண்மையான முன்னேற்றமே',
    s11HighlightText:
      'இயக்கத்தைப் பற்றிய சிறந்த விழிப்புணர்வு, சுருக்கத்தில் சில கூடுதல் விநாடிகள், அல்லது கசிவுகளில் குறைவு ஏற்கெனவே ஊக்கமளிக்கும் அறிகுறிகள்.',

    s12Heading: 'முக்கியக் குறிப்புகள்',
    summaryTitle: 'அத்தியாவசியங்கள்',
    summaryItems: [
      'கர்ப்பமும் பிரசவமும் இடுப்புத் தளத்துக்குக் குறிப்பிடத்தக்க அழுத்தம் தருகின்றன.',
      'பிரசவத்துக்குப் பின் படிப்படியான மீட்பு இயல்பானது.',
      'பயிற்சிகள் வலிமையை விட இயக்கத்தின் தரத்துக்கு முன்னுரிமை தர வேண்டும்.',
      'சுவாசமும் தளர்வும் சுருக்கத்தைப் போலவே முக்கியம்.',
      'சிறுநீர்க் கசிவுகள், கனம் அல்லது நீடிக்கும் வலிக்கு ஒரு நிபுணரின் கருத்து தேவை.',
      'ஒரு மருத்துவச்சி அல்லது பிசியோதெரபிஸ்டுடனான மறுவாழ்வு சிறந்த கட்டுப்பாட்டை மீட்க உதவலாம்.',
      'விளையாட்டுக்குத் திரும்புவது படிப்படியாக இருக்க வேண்டும், குறிப்பாக அதிக அதிர்ச்சிச் செயல்பாடுகளுக்கு.',
    ],

    finalTipTitle: 'மீள நேரம் எடுத்துக்கொள்ளுங்கள்',
    finalTipText:
      'பிரசவத்துக்குப் பின், உங்கள் உடல் பல மாற்றங்களைக் கடந்துள்ளது. பெரினியம் உங்கள் உடலின் மற்ற பகுதிகளுக்கு நிகரான கவனத்துக்கு உரியது: படிப்படியாக, ஒழுங்காக, அழுத்தமின்றி.',

    disclaimerText:
      'இந்தக் கட்டுரை தகவலுக்கு மட்டுமே, தனிப்பயன் மருத்துவ ஆலோசனைக்கு மாற்றல்ல. உங்களுக்கு வலி, நீடிக்கும் அறிகுறிகள் இருந்தால், அல்லது உங்கள் மீட்பு பற்றி ஏதேனும் கவலை இருந்தால், ஒரு சுகாதார நிபுணரின் ஆலோசனையைப் பெறுங்கள்.',
  },
  te: {
    badge: 'ప్రసవానంతరం • కోలుకోవడం',
    title: 'ప్రసవం తర్వాత మీ\nపెల్విక్ ఫ్లోర్‌ను బలపరచడం',
    metaDuration: '8 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro:
      'గర్భం, ప్రసవం తర్వాత, పెల్విక్ ఫ్లోర్ కోలుకోవడానికి సమయం కావాలి. సరళమైన, క్రమమైన, క్రమంగా పెంచే వ్యాయామాలు, దేన్నీ తొందరపెట్టకుండా, బలాన్ని, నియంత్రణను, ఆత్మవిశ్వాసాన్ని తిరిగి పొందడానికి సహాయపడగలవు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'పెరినియం పాత్రను అర్థం చేసుకోవడం',
      'ప్రసవం దానికి ఎందుకు ఒత్తిడి కలిగిస్తుంది',
      'పెల్విక్ ఫ్లోర్ పునరావాసాన్ని ఎప్పుడు మొదలుపెట్టాలి',
      'సరిగ్గా సంకోచించడం నేర్చుకోవడం',
      'క్రమంగా పెంచే దినచర్యను నిర్మించుకోవడం',
      'తప్పించుకోవాల్సిన పొరపాట్లు',
      'సహాయాన్ని ఎప్పుడు కోరాలి',
      'క్రీడలను మెల్లగా తిరిగి మొదలుపెట్టడం',
      'అపాయింట్‌మెంట్‌కు సిద్ధమవ్వడం',
      'ముఖ్యాంశాలు',
    ],
    shareMessage: 'ప్రసవం తర్వాత మీ పెల్విక్ ఫ్లోర్‌ను బలపరచడం — AWA',

    s1Heading: 'పెరినియం పాత్రను అర్థం చేసుకోవడం',
    s1Body1:
      'పెరినియం, పెల్విక్ ఫ్లోర్ అని కూడా అంటారు, ఇది కటి అడుగున ఉన్న కండరాల సమూహం. ఇది మూత్రాశయ, పేగు నియంత్రణలో పాత్ర పోషిస్తుంది, కటి అవయవాలకు ఆధారంగా ఉండటానికి సహాయపడుతుంది.',
    s1Body2:
      'గర్భధారణ సమయంలో, ఈ కండరాలు అనేక నెలలు అదనపు బరువును మోయాల్సి ఉంటుంది. ప్రసవ సమయంలో కూడా అవి గణనీయమైన ఒత్తిడికి లోనవుతాయి.',
    s1HighlightTitle: 'గోప్యమైన కానీ అత్యవసరమైన కండరం',
    s1HighlightText:
      'పెల్విక్ ఫ్లోర్ అనేక రోజువారీ పనుల్లో పాల్గొంటుంది: మూత్రాన్ని, మలాన్ని అడ్డుకోవడం, వాయువును నియంత్రించడం, కటి అవయవాలకు ఆధారంగా ఉండటం, కొన్ని లైంగిక పనుల్లో పాత్ర పోషించడం.',

    benefitsHeading: 'బలమైన పెల్విక్ ఫ్లోర్ ప్రయోజనాలు',
    benefitsIntro:
      'క్రమంగా, సరిగ్గా చేసే బలపరచడం పెల్విక్ ఫ్లోర్ నియంత్రణను, ఆధార బలాన్ని మెరుగుపరచడానికి సహాయపడగలదు.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'మెరుగైన మూత్రాశయ నియంత్రణ',
        text: 'పెల్విక్ ఫ్లోర్ మూత్రాశయ నియంత్రణలో పాత్ర పోషిస్తుంది. దాన్ని క్రమంగా బలపరచడం కొన్ని మూత్రం కారడాన్ని తగ్గించడానికి సహాయపడవచ్చు.',
      },
      {
        icon: 'toilet',
        title: 'పేగు పనితీరుకు తోడ్పాటు',
        text: 'ఈ కండరాలు వాయువును, మలాన్ని నియంత్రించడానికి, కటి అవయవాలకు ఆధారంగా ఉండటానికి కూడా దోహదపడతాయి.',
      },
      {
        icon: 'human-female',
        title: 'కటి అవయవాలకు ఆధారం',
        text: 'పెల్విక్ ఫ్లోర్ మూత్రాశయానికి, గర్భాశయానికి, పేగుకు ఆధారంగా ఉండటానికి సహాయపడే నిజమైన కండర ఆధారాన్ని ఏర్పరుస్తుంది.',
      },
      {
        icon: 'heart-pulse',
        title: 'అనుభూతిని క్రమంగా తిరిగి పొందడం',
        text: 'తగిన పునరావాసం ఈ ప్రాంతం గురించి మెరుగైన అవగాహనను, నియంత్రణను తిరిగి పొందడానికి కూడా సహాయపడగలదు.',
      },
    ],

    s2Heading: 'గర్భం, ప్రసవం దానికి ఎందుకు ఒత్తిడి కలిగిస్తాయి',
    s2Body1:
      'గర్భం క్రమంగా పెల్విక్ ఫ్లోర్‌పై ఎక్కువ ఒత్తిడిని కలిగిస్తుంది. యోని ప్రసవం అప్పుడు ఈ ప్రాంతంలోని కండరాలను, కణజాలాలను గణనీయంగా సాగదీయవచ్చు.',
    s2Body2:
      'సిజేరియన్ కూడా పెల్విక్ ఫ్లోర్‌ను పూర్తిగా కాపాడదు: గర్భధారణే ఈ కండరాలకు ఒక ముఖ్యమైన కాలంగా ఉంటుంది.',
    s2Body3:
      'అందువల్ల ప్రసవం తర్వాత కోలుకోవడానికి సమయం పట్టడం సహజం. కొందరు మహిళలు దాదాపు ఏ లక్షణాలనూ అనుభవించరు, మరికొందరు కారడం, భారంగా అనిపించడం లేదా తగ్గిన కండర నియంత్రణను గమనించవచ్చు.',
    s2TipTitle: 'ప్రతి కోలుకోవడం భిన్నమైనది',
    s2TipText:
      'ప్రసవం రకం, ఒక చీలిక లేదా ఎపిసియోటమీ, నొప్పి ఉనికి, ప్రసవం తర్వాత మీ సాధారణ స్థితి అన్నీ కోలుకోవడాన్ని ప్రభావితం చేయవచ్చు.',

    s3Heading: 'పెల్విక్ ఫ్లోర్ పునరావాసాన్ని ఎప్పుడు మొదలుపెట్టాలి?',
    s3Body1:
      'సమస్య లేని ప్రసవం తర్వాత, మృదువైన పెల్విక్ ఫ్లోర్ సంకోచాలను సాధారణంగా క్రమంగా తిరిగి మొదలుపెట్టవచ్చు. వ్యాయామాలను మీ పరిస్థితికి అనుకూలంగా మార్చుకోవడం, మీరు ఒక సమస్యను, గణనీయమైన నొప్పిని లేదా ఒక నిర్దిష్ట విధానాన్ని అనుభవించి ఉంటే సలహా తీసుకోవడం ముఖ్యంగానే ఉంటుంది.',
    s3Body2:
      'మీకు సిజేరియన్ లేకుండా మూత్ర కాథెటర్ ఉంటే, అది తీసివేయబడి సాధారణ మూత్రవిసర్జన తిరిగి మొదలయ్యే వరకు పెరినియం వ్యాయామాలను మొదలుపెట్టకుండా ఆగమని కొన్ని సిఫార్సులు సూచిస్తాయి.',
    s3AlertTitle: 'నొప్పిని పట్టించుకోకుండా కొనసాగకండి',
    s3AlertText:
      'గణనీయమైన నొప్పి, మరింత దిగజారే లక్షణాలు, సరిగ్గా ఆరని గాయం లేదా ఏదైనా ప్రత్యేక ఆందోళనకు ఒక మంత్రసాని, వైద్యులు లేదా పునరావాస నిపుణుడి సలహా అవసరం.',

    s4Heading: 'సరిగ్గా సంకోచించడం నేర్చుకోవడం',
    s4Body1:
      'కదలికను గుర్తించడానికి, వాయువును, మూత్రం వచ్చే ఉద్దేశాన్ని ఒకే సమయంలో అడ్డుకోవడానికి ప్రయత్నిస్తున్నట్లు ఊహించుకోండి. మీరు వెతికే కదలిక లోపలికి సంకోచించి పైకి లాగే ఒక అనుభూతి.',
    s4Body2:
      'లక్ష్యం మీ మొత్తం శరీరాన్ని గట్టిగా బిగించడం కాదు. సాధారణంగా శ్వాస కొనసాగుతూ ఉండగా, మీ పిరుదులు, తొడలు, పొట్ట కండరాలు వీలైనంత తేలికగా ఉండాలి.',
    exercises: [
      {icon: 'weather-windy', label: 'శ్వాస'},
      {icon: 'human-handsup', label: 'మృదువైన సంకోచం'},
      {icon: 'arrow-up-bold-circle-outline', label: 'దీర్ఘ సంకోచం'},
      {icon: 'gesture-tap-button', label: 'వేగవంతమైన సంకోచాలు'},
    ],
    s4HighlightTitle: 'తేలిక పడటం కూడా అంతే ముఖ్యం',
    s4HighlightText:
      'ప్రతి సంకోచం తర్వాత, కండరాలను పూర్తిగా తేలికపడనివ్వండి. మంచి పునరావాసం అంటే రోజంతా పెరినియంను సంకోచించి ఉంచడం కాదు.',

    s5Heading: 'క్రమంగా పెంచే దినచర్యను నిర్మించుకోవడం',
    s5Body1:
      'మొదట, కండరాలను గుర్తించి కదలికను సరిగ్గా చేయడం నేర్చుకోవడమే అత్యంత ముఖ్యం. తీవ్రత కంటే నిలకడే ముఖ్యం.',
    s5h3a: 'దీర్ఘ సంకోచాలు',
    s5Body2:
      'పెల్విక్ ఫ్లోర్‌ను మృదువుగా సంకోచించండి, ఆపై మీ శ్వాసను ఆపకుండా కొన్ని సెకన్లు సంకోచాన్ని పట్టుకోండి. మళ్లీ మొదలుపెట్టే ముందు పూర్తిగా విడుదల చేయండి.',
    s5h3b: 'చిన్న సంకోచాలు',
    s5Body3:
      'కదలిక కైవసం అయ్యాక, చిన్న వేగవంతమైన సంకోచాలను జోడించవచ్చు. ఉదాహరణకు దగ్గడానికి లేదా తుమ్మడానికి ముందు, పొట్టలో ఒత్తిడి పెరిగినప్పుడు కండరాలను త్వరగా సంకోచించే మీ సామర్థ్యాన్ని శిక్షణ ఇవ్వడానికి అవి సహాయపడతాయి.',
    dailyTips: [
      {icon: 'clock-outline', label: 'వ్యాయామాలను ఒక రోజువారీ అలవాటుతో జత చేయండి'},
      {icon: 'human-sitting', label: 'సౌకర్యవంతమైన భంగిమలో మొదలుపెట్టండి'},
      {icon: 'weather-windy', label: 'సంకోచాల సమయంలో సాధారణంగా శ్వాస తీసుకోండి'},
      {icon: 'sleep', label: 'తేలికపడే దశలను గౌరవించండి'},
      {icon: 'chart-line', label: 'కష్టాన్ని క్రమంగా పెంచండి'},
      {icon: 'doctor', label: 'ఖచ్చితంగా తెలియకపోతే సలహా అడగండి'},
    ],
    s5TipTitle: 'అన్నిటికంటే ముఖ్యం నిలకడ',
    s5TipText:
      'వ్యాయామాలను ఇప్పటికే మీ రోజులో భాగమైన అలవాటుతో జత చేయడం నిలకడగా ఉండటానికి సులభం చేయవచ్చు: పాలిచ్చిన తర్వాత, పళ్లు తోమిన తర్వాత, లేదా మీకు సరిపోయే మరో సమయంలో.',

    s6Heading: 'తప్పించుకోవాల్సిన సాధారణ పొరపాట్లు',
    s6Body1:
      'పెరినియం వ్యాయామాలు సరళంగా కనిపించవచ్చు, కానీ ఇతర కండరాలతో భర్తీ చేయడం లేదా అతిగా బిగించడం సులభం.',
    commonMistakes: [
      'పెల్విక్ ఫ్లోర్‌కు బదులుగా పిరుదులను లేదా తొడలను బిగించడం',
      'సంకోచం సమయంలో శ్వాసను ఆపడం',
      'కండరాలను తేలికపడనివ్వకుండా నిరంతరం సంకోచించి ఉంచడం',
      'కొన్ని రోజులు మాత్రమే వ్యాయామాలు చేసి ఆపేయడం',
      'సంకోచాన్ని సరిచూడటానికి ఉద్దేశపూర్వకంగా మూత్ర ప్రవాహాన్ని ఆపడం',
    ],
    s6TipTitle: 'చేయకూడనివి',
    s6TipText:
      'ఉద్దేశపూర్వకంగా మూత్ర ప్రవాహాన్ని ఆపడం ద్వారా వ్యాయామాలు చేయడం సిఫార్సు చేయబడదు. ఈ పద్ధతి పెరినియంను సరిగ్గా శిక్షణ ఇవ్వదు, సాధారణ మూత్రాశయ పనితీరును భంగపరచవచ్చు.',

    s7Heading: 'ఏ లక్షణాలు సంప్రదింపును ప్రేరేపించాలి?',
    s7Body1:
      'ప్రసవం తర్వాత చిన్న కారడం లేదా అసాధారణ అనుభూతి కొన్నిసార్లు కనిపించవచ్చు. అయితే, అవి కొనసాగితే, మరింత దిగజారితే లేదా మీ రోజువారీ జీవితానికి అంతరాయం కలిగిస్తే వాటిని విస్మరించకూడదు.',
    warningSigns: [
      'దగ్గినప్పుడు, తుమ్మినప్పుడు, నవ్వినప్పుడు లేదా ముక్కినప్పుడు మూత్రం కారడం',
      'కింది కటిలో భారంగా లేదా ఒత్తిడిగా అనిపించడం',
      'యోనిలోకి ఒక గడ్డ లేదా ఏదో జారుతున్నట్లు అనిపించడం',
      'వాయువును లేదా మలాన్ని అడ్డుకోవడంలో కష్టం',
      'పెరినియంలో కొనసాగే నొప్పి',
      'సంభోగ సమయంలో లేదా తర్వాత నొప్పి',
      'పెరినియం కండరాలను గుర్తించడంలో లేదా సరిగ్గా సంకోచించడంలో కష్టం',
    ],
    consultLabel: 'సలహాను ఎప్పుడు కోరాలి?',
    s7Body2:
      'పెల్విక్ ఫ్లోర్ పునరావాసంలో నిపుణత కలిగిన ఒక మంత్రసాని, వైద్యులు లేదా ఫిజియోథెరపిస్ట్ కండర పనితీరును సరిచూసి తగిన కార్యక్రమాన్ని సూచించగలరు.',

    s8Heading: 'మరి చీలిక, ఎపిసియోటమీ లేదా సిజేరియన్ తర్వాత?',
    s8Body1:
      'ఒక చీలిక లేదా ఎపిసియోటమీ ఆరే సమయంలో ప్రత్యేక శ్రద్ధ అవసరం. కార్యకలాపాలను తిరిగి మొదలుపెట్టడం నొప్పిని, గాయం స్థితిని, ప్రసవం తర్వాత ఇవ్వబడిన మార్గదర్శకాన్ని పరిగణనలోకి తీసుకోవాలి.',
    s8Body2:
      'సిజేరియన్ తర్వాత, కోలుకోవడంలో పొట్ట గోడ, గాయం కూడా ఉంటాయి. ప్రసవం యోని ద్వారా కాకపోయినా, గర్భధారణే పెల్విక్ ఫ్లోర్‌పై ఒత్తిడి కలిగించింది.',
    s8HighlightTitle: 'వ్యక్తిగతీకరించిన సంరక్షణ సహాయపడగలదు',
    s8HighlightText:
      'గణనీయమైన చీలిక, నొప్పి, మూత్ర లేదా పేగు లక్షణాలు లేదా కొనసాగే ఇబ్బందులు ఉంటే, ఒక ఆరోగ్య నిపుణుడితో మదింపు ప్రత్యేకంగా సహాయపడగలదు.',

    s9Heading: 'క్రీడలను మెల్లగా తిరిగి మొదలుపెట్టడం',
    s9Body1:
      'ప్రసవం తర్వాత కదలికను తిరిగి మొదలుపెట్టడం క్రమంగా ఉండాలి. నడక, మృదువైన కదలికలను మీకు అనిపించే తీరును బట్టి సాధారణంగా తిరిగి మొదలుపెట్టవచ్చు, అయితే ఎక్కువ అదురుపాటు ఉన్న కార్యకలాపాలకు ఎక్కువ జాగ్రత్త అవసరం.',
    s9Body2:
      'పరుగు, గంతులు లేదా చాలా తీవ్రమైన శిక్షణను తిరిగి మొదలుపెట్టే ముందు, పెల్విక్ ఫ్లోర్ కోలుకోవడాన్ని మదింపు చేసి ఏవైనా లక్షణాలను పరిగణనలోకి తీసుకోవడం ఉత్తమం.',
    s9AlertTitle: 'దశలను తొందరపెట్టకండి',
    s9AlertText:
      'వ్యాయామం సమయంలో లేదా తర్వాత కారడం, భారంగా అనిపించడం లేదా నొప్పి మీరు వేగాన్ని తగ్గించి, తీవ్రతను పెంచే ముందు సలహా తీసుకోవాలనే సంకేతాలు.',

    s10Heading: 'ఒక నిపుణుడిని ఎప్పుడు కలవాలి?',
    s10Body1:
      'మీరు సరిగ్గా సంకోచిస్తున్నారో లేదో ఖచ్చితంగా తెలియనప్పుడు, మీ లక్షణాలు కొనసాగుతున్నప్పుడు, లేదా మీరు కొన్ని శారీరక కార్యకలాపాలను ఆత్మవిశ్వాసంతో తిరిగి మొదలుపెట్టాలనుకున్నప్పుడు, ఒక మంత్రసాని లేదా ఫిజియోథెరపిస్ట్‌తో పెల్విక్ ఫ్లోర్ పునరావాసం సహాయపడవచ్చు.',
    questionCardTitle: 'అడగడానికి ఉపయోగకరమైన ప్రశ్నలు',
    appointmentQuestions: [
      'నా లక్షణాలు పెల్విక్ ఫ్లోర్ బలహీనతకు అనుగుణంగా ఉన్నాయా?',
      'నేను సంకోచాలను సరిగ్గా చేస్తున్నానా?',
      'ప్రతి రోజూ నేను ఎన్నిసార్లు పునరావృతం చేయాలి?',
      'నేను తిరిగి పరుగు, క్రీడలు లేదా అధిక అదురుపాటు వ్యాయామానికి వెళ్లవచ్చా?',
      'నాకు ఒక మంత్రసాని లేదా ఫిజియోథెరపిస్ట్‌తో పునరావాసం అవసరమా?',
      'నా గాయం, చీలిక లేదా సిజేరియన్‌కు ఏవైనా ప్రత్యేక ముందు జాగ్రత్తలు అవసరమా?',
    ],
    s10TipTitle: 'తెలుసుకోవాల్సినవి',
    s10TipText:
      'ఒక నిపుణుడిని కలవడం తప్పనిసరిగా ఏదో తప్పు ఉందని అర్థం కాదు. ఒక సెషన్ మీ నైపుణ్యాన్ని సరిచూడటానికి, మీ కోలుకోవడాన్ని మదింపు చేయడానికి, సరిగ్గా ఎలా పురోగమించాలో నేర్చుకోవడానికి సహాయపడగలదు.',

    s11Heading: 'సమయం పట్టే ఒక కోలుకోవడం',
    s11Body1:
      'బిడ్డకు జన్మనిచ్చిన తర్వాత, గర్భధారణకు ముందు ఉన్న అవే అనుభూతులను, కండర బలాన్ని వెంటనే తిరిగి పొందకపోవడం సహజం.',
    s11Body2:
      'వీలైనన్ని ఎక్కువ సంకోచాలు చేయడం లక్ష్యం కాదు. ఇది సంకోచానికి, తేలికపడటానికి మధ్య మంచి సమన్వయాన్ని క్రమంగా తిరిగి పొందడం, ఆపై ఈ కండరాలను రోజువారీ కార్యకలాపాల్లో సహజంగా ఉపయోగించగలగడం.',
    s11HighlightTitle: 'చిన్న పురోగతి కూడా నిజమైన పురోగతే',
    s11HighlightText:
      'కదలిక గురించి మెరుగైన అవగాహన, సంకోచంలో కొన్ని అదనపు సెకన్లు, లేదా కారడంలో తగ్గుదల ఇప్పటికే ప్రోత్సాహకరమైన సంకేతాలు.',

    s12Heading: 'ముఖ్యాంశాలు',
    summaryTitle: 'ముఖ్యమైనవి',
    summaryItems: [
      'గర్భం, ప్రసవం పెల్విక్ ఫ్లోర్‌కు గణనీయమైన ఒత్తిడిని కలిగిస్తాయి.',
      'ప్రసవం తర్వాత క్రమంగా కోలుకోవడం సహజం.',
      'వ్యాయామాలు బలం కంటే కదలిక నాణ్యతకు ప్రాధాన్యం ఇవ్వాలి.',
      'శ్వాస, తేలికపడటం సంకోచం అంతే ముఖ్యం.',
      'మూత్రం కారడం, భారంగా అనిపించడం లేదా కొనసాగే నొప్పికి ఒక నిపుణుడి అభిప్రాయం అవసరం.',
      'ఒక మంత్రసాని లేదా ఫిజియోథెరపిస్ట్‌తో పునరావాసం మెరుగైన నియంత్రణను తిరిగి పొందడానికి సహాయపడగలదు.',
      'క్రీడలకు తిరిగి రావడం క్రమంగా ఉండాలి, ముఖ్యంగా ఎక్కువ అదురుపాటు ఉన్న కార్యకలాపాలకు.',
    ],

    finalTipTitle: 'కోలుకోవడానికి సమయం తీసుకోండి',
    finalTipText:
      'ప్రసవం తర్వాత, మీ శరీరం చాలా మార్పుల గుండా వెళ్లింది. పెరినియం మీ శరీరంలోని మిగతా భాగాలకు సమానమైన శ్రద్ధకు అర్హమైనది: క్రమంగా, క్రమం తప్పకుండా, ఒత్తిడి లేకుండా.',

    disclaimerText:
      'ఈ వ్యాసం సమాచారం కోసం మాత్రమే, వ్యక్తిగతీకరించిన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. మీకు నొప్పి, కొనసాగే లక్షణాలు ఉంటే, లేదా మీ కోలుకోవడం గురించి ఏదైనా ఆందోళన ఉంటే, ఒక ఆరోగ్య నిపుణుడి సలహా పొందండి.',
  },
  mr: {
    badge: 'प्रसूतीनंतर • पुनर्प्राप्ती',
    title: 'प्रसूतीनंतर तुमचे श्रोणीतळ\nमजबूत करणे',
    metaDuration: '8 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro:
      'गर्भारपण आणि प्रसूतीनंतर, श्रोणीतळाला बरे होण्यासाठी वेळ लागतो. साधे, नियमित आणि हळूहळू वाढवत जाणारे व्यायाम तुम्हाला घाई करण्याचा प्रयत्न न करता ताकद, नियंत्रण आणि आत्मविश्वास परत मिळवण्यास मदत करू शकतात.',
    contentsTitle: 'या लेखात',
    topics: [
      'पेरिनियमची भूमिका समजून घेणे',
      'प्रसूतीमुळे त्यावर ताण का येतो',
      'श्रोणीतळाचे पुनर्वसन केव्हा सुरू करावे',
      'योग्य प्रकारे आकुंचन करायला शिकणे',
      'हळूहळू वाढवत जाणारी दिनचर्या तयार करणे',
      'टाळायच्या चुका',
      'मदत केव्हा मागावी',
      'हळूहळू खेळ पुन्हा सुरू करणे',
      'भेटीची तयारी',
      'मुख्य मुद्दे',
    ],
    shareMessage: 'प्रसूतीनंतर तुमचे श्रोणीतळ मजबूत करणे — AWA',

    s1Heading: 'पेरिनियमची भूमिका समजून घेणे',
    s1Body1:
      'पेरिनियम, ज्याला श्रोणीतळ असेही म्हणतात, हा श्रोणीच्या तळाशी असलेल्या स्नायूंचा समूह आहे. तो मूत्राशय आणि आतड्यांच्या नियंत्रणात भूमिका बजावतो आणि श्रोणीतील अवयवांना आधार देण्यास मदत करतो.',
    s1Body2:
      'गर्भारपणात, या स्नायूंना अनेक महिने अतिरिक्त वजन पेलावे लागते. प्रसूतीदरम्यानही त्यांच्यावर मोठा ताण येतो.',
    s1HighlightTitle: 'एक गुप्त पण आवश्यक स्नायू',
    s1HighlightText:
      'श्रोणीतळ रोजच्या अनेक कार्यांत सहभागी असतो: लघवी आणि मल रोखून धरणे, वायूचे नियंत्रण, श्रोणीतील अवयवांना आधार देणे आणि काही लैंगिक कार्यांत भूमिका बजावणे.',

    benefitsHeading: 'अधिक मजबूत श्रोणीतळाचे फायदे',
    benefitsIntro:
      'हळूहळू आणि योग्य प्रकारे केलेले मजबुतीकरण श्रोणीतळाचे नियंत्रण आणि आधार सुधारण्यास मदत करू शकते.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'मूत्राशयावर अधिक चांगले नियंत्रण',
        text: 'श्रोणीतळ मूत्राशयाच्या नियंत्रणात भूमिका बजावतो. ते हळूहळू मजबूत केल्याने काही लघवीची गळती कमी होण्यास मदत होऊ शकते.',
      },
      {
        icon: 'toilet',
        title: 'आतड्यांच्या कार्याला आधार',
        text: 'हे स्नायू वायू आणि मलाचे नियंत्रण करण्यास आणि श्रोणीतील अवयवांना आधार देण्यासही हातभार लावतात.',
      },
      {
        icon: 'human-female',
        title: 'श्रोणीतील अवयवांना आधार',
        text: 'श्रोणीतळ एक खरा स्नायूंचा पाया बनवतो जो मूत्राशय, गर्भाशय आणि आतड्याला आधार देण्यास मदत करतो.',
      },
      {
        icon: 'heart-pulse',
        title: 'संवेदना हळूहळू परत मिळवणे',
        text: 'योग्य पुनर्वसन तुम्हाला या भागाची अधिक चांगली जाणीव आणि नियंत्रण परत मिळवण्यासही मदत करू शकते.',
      },
    ],

    s2Heading: 'गर्भारपण आणि प्रसूतीमुळे त्यावर ताण का येतो',
    s2Body1:
      'गर्भारपण हळूहळू श्रोणीतळावर अधिक दाब टाकते. योनीमार्गे प्रसूती मग या भागातील स्नायू आणि ऊती लक्षणीयरीत्या ताणू शकते.',
    s2Body2:
      'सिझेरियन प्रसूतीतही श्रोणीतळाला पूर्णपणे वाचवले जात नाही: गर्भारपण स्वतःच या स्नायूंसाठी एक महत्त्वाचा काळ राहतो.',
    s2Body3:
      'म्हणून प्रसूतीनंतर बरे होण्यास वेळ लागणे सामान्य आहे. काही स्त्रियांना जवळजवळ कोणतीही लक्षणे जाणवत नाहीत, तर इतरांना गळती, जडपणाची भावना किंवा स्नायूंचे कमी झालेले नियंत्रण जाणवू शकते.',
    s2TipTitle: 'प्रत्येक पुनर्प्राप्ती वेगळी असते',
    s2TipText:
      'प्रसूतीचा प्रकार, फाटणे किंवा एपिसिओटॉमी, वेदनेची उपस्थिती आणि प्रसूतीनंतरची तुमची सर्वसाधारण स्थिती या सर्वांचा पुनर्प्राप्तीवर परिणाम होऊ शकतो.',

    s3Heading: 'श्रोणीतळाचे पुनर्वसन केव्हा सुरू करावे?',
    s3Body1:
      'गुंतागुंतीविना झालेल्या प्रसूतीनंतर, श्रोणीतळाचे हलके आकुंचन सहसा हळूहळू पुन्हा सुरू करता येते. तुमच्या परिस्थितीनुसार व्यायाम जुळवणे आणि तुम्हाला गुंतागुंत, लक्षणीय वेदना किंवा विशिष्ट प्रक्रिया झाली असल्यास सल्ला घेणे महत्त्वाचे राहते.',
    s3Body2:
      'तुम्हाला मूत्राशयात नळी (कॅथेटर) असल्यास, काही शिफारशी पेरिनियमचे व्यायाम सुरू करण्यापूर्वी ती काढली जाईपर्यंत आणि सामान्य लघवी पुन्हा सुरू होईपर्यंत थांबण्याचे सुचवतात.',
    s3AlertTitle: 'वेदना सहन करून पुढे जाऊ नका',
    s3AlertText:
      'लक्षणीय वेदना, बिघडत जाणारी लक्षणे, नीट बरी न होणारी जखम किंवा कोणतीही विशेष चिंता यासाठी दाई, डॉक्टर किंवा पुनर्वसन तज्ज्ञाचा सल्ला आवश्यक आहे.',

    s4Heading: 'योग्य प्रकारे आकुंचन करायला शिकणे',
    s4Body1:
      'ही हालचाल ओळखण्यासाठी, एकाच वेळी वायू आणि लघवीची इच्छा रोखून धरण्याचा प्रयत्न करत असल्याची कल्पना करा. तुम्ही शोधत असलेली हालचाल म्हणजे आकुंचन आणि आतल्या बाजूने वर खेचल्याची जाणीव.',
    s4Body2:
      'ध्येय तुमचे संपूर्ण शरीर घट्ट आवळणे नाही. श्वास सामान्यपणे सुरू असताना तुमचे नितंब, मांड्या आणि पोटाचे स्नायू शक्य तितके शिथिल राहिले पाहिजेत.',
    exercises: [
      {icon: 'weather-windy', label: 'श्वासोच्छ्वास'},
      {icon: 'human-handsup', label: 'हलके आकुंचन'},
      {icon: 'arrow-up-bold-circle-outline', label: 'दीर्घ आकुंचन'},
      {icon: 'gesture-tap-button', label: 'झटपट आकुंचने'},
    ],
    s4HighlightTitle: 'शिथिल करणेही तितकेच महत्त्वाचे आहे',
    s4HighlightText:
      'प्रत्येक आकुंचनानंतर, स्नायू पूर्णपणे शिथिल होऊ द्या. चांगले पुनर्वसन म्हणजे पेरिनियम दिवसभर आकुंचित ठेवणे नव्हे.',

    s5Heading: 'हळूहळू वाढवत जाणारी दिनचर्या तयार करणे',
    s5Body1:
      'सुरुवातीला, सर्वात महत्त्वाचे म्हणजे स्नायू ओळखणे आणि हालचाल योग्य प्रकारे करायला शिकणे. तीव्रतेपेक्षा सातत्य अधिक महत्त्वाचे आहे.',
    s5h3a: 'दीर्घ आकुंचने',
    s5Body2:
      'श्रोणीतळ हळुवारपणे आकुंचित करा, मग श्वास न रोखता काही सेकंद आकुंचन धरून ठेवा. मग पुन्हा सुरू करण्यापूर्वी पूर्णपणे सोडा.',
    s5h3b: 'छोटी आकुंचने',
    s5Body3:
      'हालचाल जमल्यावर, लहान झटपट आकुंचने जोडता येतात. ती पोटावरील दाब वाढताना, उदाहरणार्थ खोकण्यापूर्वी किंवा शिंकण्यापूर्वी, स्नायू झपाट्याने आकुंचित करण्याची तुमची क्षमता प्रशिक्षित करण्यास मदत करतात.',
    dailyTips: [
      {icon: 'clock-outline', label: 'व्यायाम रोजच्या एखाद्या सवयीशी जोडा'},
      {icon: 'human-sitting', label: 'आरामदायी स्थितीत सुरुवात करा'},
      {icon: 'weather-windy', label: 'आकुंचनादरम्यान सामान्यपणे श्वास घ्या'},
      {icon: 'sleep', label: 'शिथिलतेच्या टप्प्यांचा आदर करा'},
      {icon: 'chart-line', label: 'अडचण हळूहळू वाढवा'},
      {icon: 'doctor', label: 'खात्री नसल्यास सल्ला घ्या'},
    ],
    s5TipTitle: 'सर्वप्रथम सातत्य',
    s5TipText:
      'व्यायाम तुमच्या दिवसाचा भाग असलेल्या सवयीशी जोडल्याने सातत्य राखणे सोपे होऊ शकते: दूध पाजल्यानंतर, दात घासल्यानंतर किंवा तुम्हाला सोयीच्या दुसऱ्या वेळी.',

    s6Heading: 'टाळायच्या सामान्य चुका',
    s6Body1:
      'पेरिनियमचे व्यायाम साधे दिसू शकतात, पण इतर स्नायूंच्या मदतीने भरपाई करणे किंवा खूप जोर लावणे सोपे असते.',
    commonMistakes: [
      'श्रोणीतळाऐवजी नितंब किंवा मांड्या आवळणे',
      'आकुंचनादरम्यान श्वास रोखणे',
      'स्नायूंना शिथिल होऊ न देता सतत आकुंचित ठेवणे',
      'व्यायाम फक्त काही दिवस करून मग थांबवणे',
      'आकुंचन तपासण्यासाठी मुद्दाम लघवीचा प्रवाह थांबवणे',
    ],
    s6TipTitle: 'काय करू नये',
    s6TipText:
      'मुद्दाम लघवीचा प्रवाह थांबवून व्यायाम करण्याची शिफारस केली जात नाही. ही पद्धत पेरिनियमला योग्य प्रकारे प्रशिक्षित करत नाही आणि मूत्राशयाचे सामान्य कार्य बिघडवू शकते.',

    s7Heading: 'कोणत्या लक्षणांमुळे सल्लामसलत करावी?',
    s7Body1:
      'प्रसूतीनंतर कधी कधी लहान गळती किंवा असामान्य जाणीव दिसू शकते. तथापि, ती कायम राहिल्यास, वाढल्यास किंवा रोजच्या जीवनात अडथळा आणत असल्यास, दुर्लक्ष करू नये.',
    warningSigns: [
      'खोकताना, शिंकताना, हसताना किंवा जोर लावताना लघवीची गळती',
      'खालच्या कटीभागात जडपणाची किंवा दाबाची भावना',
      'योनीत गाठ किंवा काहीतरी खाली सरकत असल्यासारखी भावना',
      'वायू किंवा मल रोखून धरण्यात अडचण',
      'पेरिनियममध्ये कायम राहणारी वेदना',
      'लैंगिक संबंधादरम्यान किंवा नंतर वेदना',
      'पेरिनियमचे स्नायू ओळखण्यात किंवा योग्य प्रकारे आकुंचित करण्यात अडचण',
    ],
    consultLabel: 'सल्ला केव्हा घ्यावा?',
    s7Body2:
      'श्रोणीतळाच्या पुनर्वसनात तज्ज्ञ असलेली दाई, डॉक्टर किंवा फिजिओथेरपिस्ट स्नायूंचे कार्य तपासू शकते आणि योग्य कार्यक्रम सुचवू शकते.',

    s8Heading: 'आणि फाटल्यानंतर, एपिसिओटॉमीनंतर किंवा सिझेरियननंतर?',
    s8Body1:
      'फाटणे किंवा एपिसिओटॉमी बरे होताना विशेष काळजी मागते. हालचाली पुन्हा सुरू करताना वेदना, जखमेची स्थिती आणि प्रसूतीनंतर दिलेले मार्गदर्शन विचारात घेतले पाहिजे.',
    s8Body2:
      'सिझेरियननंतर, पुनर्प्राप्तीत पोटाची भिंत आणि जखमही सहभागी असते. प्रसूती योनीमार्गे झाली नसली तरी, गर्भारपणाने स्वतः श्रोणीतळावर ताण टाकलेला असतो.',
    s8HighlightTitle: 'वैयक्तिकृत काळजी मदत करू शकते',
    s8HighlightText:
      'लक्षणीय फाटणे, वेदना, मूत्र किंवा आतड्यांची लक्षणे किंवा कायम राहणाऱ्या अडचणींच्या बाबतीत, आरोग्य व्यावसायिकासोबतचे मूल्यांकन विशेष उपयुक्त ठरू शकते.',

    s9Heading: 'हळूहळू खेळ पुन्हा सुरू करणे',
    s9Body1:
      'प्रसूतीनंतर हालचाल पुन्हा सुरू करणे हळूहळू व्हायला हवे. चालणे आणि हलक्या हालचाली तुम्हाला कसे वाटते त्यानुसार साधारणपणे पुन्हा सुरू करता येतात, तर जोराचा आघात होणाऱ्या हालचालींसाठी अधिक सावधगिरी लागते.',
    s9Body2:
      'धावणे, उड्या मारणे किंवा खूप तीव्र प्रशिक्षण पुन्हा सुरू करण्यापूर्वी, श्रोणीतळाच्या पुनर्प्राप्तीचे मूल्यांकन करणे आणि कोणतीही लक्षणे विचारात घेणे चांगले.',
    s9AlertTitle: 'टप्प्यांमध्ये घाई करू नका',
    s9AlertText:
      'व्यायामादरम्यान किंवा नंतर गळती, जडपणाची भावना किंवा वेदना ही चिन्हे आहेत की तुम्ही गती कमी करावी आणि तीव्रता वाढवण्यापूर्वी सल्ला घ्यावा.',

    s10Heading: 'तज्ज्ञांना केव्हा भेटावे?',
    s10Body1:
      'तुम्ही योग्य प्रकारे आकुंचन करत आहात की नाही याबद्दल खात्री नसल्यास, तुमची लक्षणे कायम राहिल्यास, किंवा तुम्हाला काही शारीरिक हालचाली आत्मविश्वासाने पुन्हा सुरू करायच्या असल्यास, दाई किंवा फिजिओथेरपिस्टसोबत श्रोणीतळाचे पुनर्वसन उपयुक्त ठरू शकते.',
    questionCardTitle: 'विचारण्यासाठी उपयुक्त प्रश्न',
    appointmentQuestions: [
      'माझी लक्षणे श्रोणीतळाच्या कमकुवतपणाशी सुसंगत आहेत का?',
      'मी आकुंचने योग्य प्रकारे करत आहे का?',
      'मी रोज किती पुनरावृत्त्या कराव्यात?',
      'मी धावणे, खेळ किंवा जोराचा आघात होणारा व्यायाम पुन्हा सुरू करू शकते का?',
      'मला दाई किंवा फिजिओथेरपिस्टसोबत पुनर्वसनाची गरज आहे का?',
      'माझ्या जखमेसाठी, फाटण्यासाठी किंवा सिझेरियनसाठी कोणत्याही विशेष खबरदाऱ्यांची गरज आहे का?',
    ],
    s10TipTitle: 'हे जाणून घ्या',
    s10TipText:
      'तज्ज्ञाला भेटणे म्हणजे काही चुकले आहे असे नाही. एक सत्र तुमचे तंत्र तपासण्यास, तुमच्या पुनर्प्राप्तीचे मूल्यांकन करण्यास आणि योग्य प्रकारे पुढे जायला शिकण्यास मदत करू शकते.',

    s11Heading: 'वेळ घेणारी पुनर्प्राप्ती',
    s11Body1:
      'बाळाला जन्म दिल्यानंतर, गर्भारपणापूर्वी असलेल्या जाणिवा किंवा स्नायूंची ताकद लगेच परत न मिळणे सामान्य आहे.',
    s11Body2:
      'ध्येय शक्य तितकी जास्त आकुंचने करणे नाही. ते आकुंचन आणि शिथिलीकरण यातील चांगला समन्वय हळूहळू परत मिळवणे आणि मग रोजच्या कामांमध्ये हे स्नायू नैसर्गिकपणे वापरता येणे असे आहे.',
    s11HighlightTitle: 'छोटी प्रगतीही खरी प्रगती आहे',
    s11HighlightText:
      'हालचालीची अधिक चांगली जाणीव, आकुंचनाचे काही अतिरिक्त सेकंद किंवा गळती कमी होणे ही आधीच उत्साहवर्धक चिन्हे आहेत.',

    s12Heading: 'मुख्य मुद्दे',
    summaryTitle: 'आवश्यक मुद्दे',
    summaryItems: [
      'गर्भारपण आणि प्रसूती श्रोणीतळावर मोठा ताण टाकतात.',
      'प्रसूतीनंतर हळूहळू बरे होणे सामान्य आहे.',
      'व्यायामात ताकदीपेक्षा हालचालीच्या गुणवत्तेला प्राधान्य दिले पाहिजे.',
      'श्वासोच्छ्वास आणि शिथिलीकरण आकुंचनाइतकेच महत्त्वाचे आहेत.',
      'लघवीची गळती, जडपणा किंवा कायम राहणारी वेदना तज्ज्ञाच्या मताला पात्र आहेत.',
      'दाई किंवा फिजिओथेरपिस्टसोबतचे पुनर्वसन तुम्हाला अधिक चांगले नियंत्रण परत मिळवण्यास मदत करू शकते.',
      'खेळाकडे परतणे हळूहळू व्हायला हवे, विशेषतः जोराचा आघात होणाऱ्या हालचालींसाठी.',
    ],

    finalTipTitle: 'बरे होण्यासाठी वेळ घ्या',
    finalTipText:
      'प्रसूतीनंतर, तुमचे शरीर अनेक बदलांतून गेले आहे. पेरिनियम तुमच्या शरीराच्या उर्वरित भागाइतक्याच लक्षास पात्र आहे: हळूहळू, नियमितपणे आणि दबावाशिवाय.',

    disclaimerText:
      'हा लेख फक्त माहितीसाठी आहे आणि वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. तुम्हाला वेदना, कायम राहणारी लक्षणे जाणवत असल्यास किंवा तुमच्या पुनर्प्राप्तीबद्दल कोणतीही चिंता असल्यास, आरोग्य व्यावसायिकाचा सल्ला घ्या.',
  },
  gu: {
    badge: 'પ્રસૂતિ પછી • સ્વસ્થતા',
    title: 'પ્રસૂતિ પછી તમારા પેલ્વિક ફ્લોરને\nમજબૂત બનાવવું',
    metaDuration: '8 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro:
      'ગર્ભાવસ્થા અને પ્રસૂતિ પછી, પેલ્વિક ફ્લોરને સ્વસ્થ થવા માટે સમયની જરૂર હોય છે. સરળ, નિયમિત અને ધીમે ધીમે કરાતી કસરતો તમને ઉતાવળ કર્યા વિના શક્તિ, નિયંત્રણ અને આત્મવિશ્વાસ પાછાં મેળવવામાં મદદ કરી શકે છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'પેરિનિયમની ભૂમિકા સમજવી',
      'પ્રસૂતિ તેના પર તાણ કેમ નાખે છે',
      'પેલ્વિક ફ્લોરનું પુનર્વસન ક્યારે શરૂ કરવું',
      'સાચી રીતે સંકોચન કરતાં શીખવું',
      'ધીમે ધીમે દિનચર્યા બનાવવી',
      'ટાળવા જેવી ભૂલો',
      'ક્યારે મદદ માગવી',
      'ધીમે ધીમે રમતગમત ફરી શરૂ કરવી',
      'મુલાકાતની તૈયારી',
      'મુખ્ય મુદ્દા',
    ],
    shareMessage: 'પ્રસૂતિ પછી તમારા પેલ્વિક ફ્લોરને મજબૂત બનાવવું — AWA',

    s1Heading: 'પેરિનિયમની ભૂમિકા સમજવી',
    s1Body1:
      'પેરિનિયમ, જેને પેલ્વિક ફ્લોર પણ કહેવાય છે, એ પેલ્વિસના તળિયે આવેલા સ્નાયુઓનો સમૂહ છે. તે મૂત્રાશય અને આંતરડા પરના નિયંત્રણમાં ભૂમિકા ભજવે છે અને પેલ્વિક અવયવોને ટેકો આપવામાં મદદ કરે છે.',
    s1Body2:
      'ગર્ભાવસ્થા દરમિયાન, આ સ્નાયુઓએ ઘણા મહિના સુધી વધારાનું વજન ઉપાડવું પડે છે. પ્રસૂતિ દરમિયાન પણ તેમના પર ઘણો તાણ પડે છે.',
    s1HighlightTitle: 'શાંત પણ આવશ્યક સ્નાયુ',
    s1HighlightText:
      'પેલ્વિક ફ્લોર રોજિંદા ઘણા કાર્યોમાં સામેલ છે: પેશાબ અને મળને રોકવા, ગેસ પર નિયંત્રણ રાખવું, પેલ્વિક અવયવોને ટેકો આપવો, અને કેટલાંક જાતીય કાર્યોમાં ભૂમિકા ભજવવી.',

    benefitsHeading: 'વધુ મજબૂત પેલ્વિક ફ્લોરના ફાયદા',
    benefitsIntro:
      'ધીમે ધીમે અને સાચી રીતે કરેલું મજબૂતીકરણ પેલ્વિક ફ્લોરના નિયંત્રણ અને ટેકાને સુધારવામાં મદદ કરી શકે છે.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'મૂત્રાશય પર સારું નિયંત્રણ',
        text: 'પેલ્વિક ફ્લોર મૂત્રાશયના નિયંત્રણમાં ભૂમિકા ભજવે છે. તેને ધીમે ધીમે મજબૂત કરવાથી પેશાબ લીક થવાની કેટલીક સમસ્યા ઘટાડવામાં મદદ મળી શકે છે.',
      },
      {
        icon: 'toilet',
        title: 'આંતરડાના કાર્યને ટેકો',
        text: 'આ સ્નાયુઓ ગેસ અને મળ પર નિયંત્રણ રાખવામાં પણ મદદ કરે છે અને પેલ્વિક અવયવોને ટેકો આપવામાં ફાળો આપે છે.',
      },
      {
        icon: 'human-female',
        title: 'પેલ્વિક અવયવોને ટેકો',
        text: 'પેલ્વિક ફ્લોર એક સાચો સ્નાયુનો આધાર બનાવે છે જે મૂત્રાશય, ગર્ભાશય અને આંતરડાને ટેકો આપવામાં મદદ કરે છે.',
      },
      {
        icon: 'heart-pulse',
        title: 'ધીમે ધીમે સંવેદના પાછી મેળવવી',
        text: 'યોગ્ય પુનર્વસન આ ભાગની વધુ સારી જાગૃતિ અને નિયંત્રણ પાછાં મેળવવામાં પણ મદદ કરી શકે છે.',
      },
    ],

    s2Heading: 'ગર્ભાવસ્થા અને પ્રસૂતિ તેના પર તાણ કેમ નાખે છે',
    s2Body1:
      'ગર્ભાવસ્થા ધીમે ધીમે પેલ્વિક ફ્લોર પર વધુ દબાણ નાખે છે. યોનિમાર્ગ દ્વારા પ્રસૂતિ પછી આ ભાગના સ્નાયુઓ અને પેશીઓ નોંધપાત્ર રીતે ખેંચાઈ શકે છે.',
    s2Body2:
      'સિઝેરિયન પણ પેલ્વિક ફ્લોરને સંપૂર્ણપણે બચાવતું નથી: ગર્ભાવસ્થા પોતે આ સ્નાયુઓ માટે એક મહત્વનો સમયગાળો છે.',
    s2Body3:
      'તેથી પ્રસૂતિ પછી સ્વસ્થ થવામાં સમય લાગે તે સામાન્ય છે. કેટલીક સ્ત્રીઓને લગભગ કોઈ લક્ષણ લાગતું નથી, જ્યારે બીજી સ્ત્રીઓને પેશાબ લીક થવો, ભારેપણાની લાગણી અથવા સ્નાયુઓ પરનું ઓછું નિયંત્રણ જણાઈ શકે છે.',
    s2TipTitle: 'દરેક સ્વસ્થતા અલગ હોય છે',
    s2TipText:
      'પ્રસૂતિનો પ્રકાર, ચીરો કે એપિસિઓટોમી, દુખાવાની હાજરી અને પ્રસૂતિ પછીની તમારી સામાન્ય સ્થિતિ — આ બધું સ્વસ્થતાને પ્રભાવિત કરી શકે છે.',

    s3Heading: 'પેલ્વિક ફ્લોરનું પુનર્વસન ક્યારે શરૂ કરવું?',
    s3Body1:
      'સરળ પ્રસૂતિ પછી, પેલ્વિક ફ્લોરનાં હળવાં સંકોચન સામાન્ય રીતે ધીમે ધીમે ફરી શરૂ કરી શકાય છે. કસરતોને તમારી પરિસ્થિતિ પ્રમાણે ગોઠવવી અને જો તમને કોઈ મુશ્કેલી, નોંધપાત્ર દુખાવો અથવા કોઈ ખાસ પ્રક્રિયા થઈ હોય તો સલાહ લેવી મહત્વનું છે.',
    s3Body2:
      'જો તમને પેશાબની નળી (કેથેટર) લગાવેલી હોય, તો કેટલીક ભલામણો પ્રમાણે પેરિનિયમની કસરતો શરૂ કરતાં પહેલાં તે કાઢી નંખાય અને સામાન્ય પેશાબ ફરી શરૂ થાય ત્યાં સુધી રાહ જોવી.',
    s3AlertTitle: 'દુખાવો સહન કરીને આગળ ન વધો',
    s3AlertText:
      'નોંધપાત્ર દુખાવો, વધતાં લક્ષણો, ખરાબ રીતે રુઝાતો ઘા અથવા કોઈ ખાસ ચિંતા માટે મિડવાઇફ, ડૉક્ટર અથવા પુનર્વસન વ્યાવસાયિકની સલાહ જરૂરી છે.',

    s4Heading: 'સાચી રીતે સંકોચન કરતાં શીખવું',
    s4Body1:
      'હલનચલન ઓળખવા માટે, કલ્પના કરો કે તમે ગેસ અને પેશાબની હાજતને એકસાથે રોકવાનો પ્રયત્ન કરી રહ્યાં છો. તમે જે હલનચલન શોધી રહ્યાં છો તે અંદરની તરફ સંકોચાવાની અને ઉપર ખેંચાવાની લાગણી છે.',
    s4Body2:
      'લક્ષ્ય આખા શરીરને કડક રીતે તંગ કરવાનું નથી. શ્વાસ સામાન્ય રીતે ચાલુ રહે ત્યારે તમારા નિતંબ, જાંઘ અને પેટના સ્નાયુઓ શક્ય તેટલા હળવા રહેવા જોઈએ.',
    exercises: [
      {icon: 'weather-windy', label: 'શ્વાસ'},
      {icon: 'human-handsup', label: 'હળવું સંકોચન'},
      {icon: 'arrow-up-bold-circle-outline', label: 'લાંબું સંકોચન'},
      {icon: 'gesture-tap-button', label: 'ઝડપી સંકોચન'},
    ],
    s4HighlightTitle: 'હળવા થવું પણ એટલું જ મહત્વનું છે',
    s4HighlightText:
      'દરેક સંકોચન પછી, સ્નાયુઓને સંપૂર્ણપણે હળવા થવા દો. સારા પુનર્વસનનો અર્થ આખો દિવસ પેરિનિયમને સંકોચેલું રાખવાનો નથી.',

    s5Heading: 'ધીમે ધીમે દિનચર્યા બનાવવી',
    s5Body1:
      'શરૂઆતમાં સૌથી મહત્વનું એ છે કે સ્નાયુઓને ઓળખતા અને હલનચલન સાચી રીતે કરતાં શીખવું. તીવ્રતા કરતાં નિયમિતતા વધુ મહત્વની છે.',
    s5h3a: 'લાંબાં સંકોચન',
    s5Body2:
      'પેલ્વિક ફ્લોરને હળવેથી સંકોચો, પછી શ્વાસ રોક્યા વિના થોડી સેકન્ડ સુધી સંકોચન જાળવી રાખો. પછી ફરી શરૂ કરતાં પહેલાં સંપૂર્ણપણે છોડી દો.',
    s5h3b: 'ટૂંકાં સંકોચન',
    s5Body3:
      'એકવાર હલનચલન આવડી જાય, પછી નાનાં ઝડપી સંકોચન ઉમેરી શકાય. પેટ પર દબાણ વધે ત્યારે, દાખલા તરીકે ખાંસી કે છીંક આવતાં પહેલાં, સ્નાયુઓને ઝડપથી સંકોચવાની તમારી ક્ષમતાને તાલીમ આપવામાં તે મદદ કરે છે.',
    dailyTips: [
      {icon: 'clock-outline', label: 'કસરતોને રોજની કોઈ ટેવ સાથે જોડો'},
      {icon: 'human-sitting', label: 'આરામદાયક સ્થિતિથી શરૂઆત કરો'},
      {icon: 'weather-windy', label: 'સંકોચન દરમિયાન સામાન્ય રીતે શ્વાસ લો'},
      {icon: 'sleep', label: 'હળવા થવાના તબક્કાઓનું પાલન કરો'},
      {icon: 'chart-line', label: 'ધીમે ધીમે મુશ્કેલી વધારો'},
      {icon: 'doctor', label: 'ખાતરી ન હોય તો સલાહ માગો'},
    ],
    s5TipTitle: 'સૌથી મહત્વની નિયમિતતા',
    s5TipText:
      'કસરતોને તમારા દિવસની કોઈ ટેવ સાથે જોડવાથી નિયમિત રહેવું સરળ બની શકે છે: સ્તનપાન પછી, દાંત સાફ કર્યા પછી અથવા તમને અનુકૂળ કોઈ બીજા સમયે.',

    s6Heading: 'ટાળવા જેવી સામાન્ય ભૂલો',
    s6Body1:
      'પેરિનિયમની કસરતો સરળ લાગે, પરંતુ બીજા સ્નાયુઓથી કામ ચલાવી લેવાનું અથવા વધુ પડતું જોર લગાવી દેવાનું સહેલું છે.',
    commonMistakes: [
      'પેલ્વિક ફ્લોરને બદલે નિતંબ કે જાંઘને તંગ કરવી',
      'સંકોચન દરમિયાન શ્વાસ રોકવો',
      'સ્નાયુઓને હળવા થવા દીધા વિના સતત સંકોચેલા રાખવા',
      'કસરતો ફક્ત થોડા દિવસ કરીને બંધ કરી દેવી',
      'સંકોચન ચકાસવા માટે જાણીજોઈને પેશાબની ધાર અટકાવવી',
    ],
    s6TipTitle: 'શું ન કરવું',
    s6TipText:
      'જાણીજોઈને પેશાબની ધાર અટકાવીને કસરતો કરવાની ભલામણ કરાતી નથી. આ પદ્ધતિ પેરિનિયમને સાચી રીતે તાલીમ આપતી નથી અને મૂત્રાશયના સામાન્ય કાર્યમાં ખલેલ પાડી શકે છે.',

    s7Heading: 'કયાં લક્ષણો હોય ત્યારે ડૉક્ટરને મળવું જોઈએ?',
    s7Body1:
      'પ્રસૂતિ પછી ક્યારેક થોડો પેશાબ લીક થવો અથવા કોઈ અસામાન્ય લાગણી દેખાઈ શકે છે. જોકે, જો તે ચાલુ રહે, વધે અથવા તમારા રોજિંદા જીવનમાં અડચણ કરે તો તેને અવગણવી ન જોઈએ.',
    warningSigns: [
      'ખાંસી, છીંક, હસવા કે જોર કરવા પર પેશાબ લીક થવો',
      'નીચલા પેલ્વિસમાં ભારેપણું અથવા દબાણની લાગણી',
      'યોનિમાં કોઈ ગઠ્ઠો અથવા કંઈક નીચે સરકતું હોય એવી લાગણી',
      'ગેસ અથવા મળને રોકવામાં મુશ્કેલી',
      'પેરિનિયમમાં સતત દુખાવો',
      'જાતીય સંબંધ દરમિયાન અથવા પછી દુખાવો',
      'પેરિનિયમના સ્નાયુઓને ઓળખવામાં અથવા સાચી રીતે સંકોચવામાં મુશ્કેલી',
    ],
    consultLabel: 'ક્યારે સલાહ લેવી જોઈએ?',
    s7Body2:
      'પેલ્વિક ફ્લોરના પુનર્વસનમાં નિષ્ણાત મિડવાઇફ, ડૉક્ટર અથવા ફિઝિયોથેરપિસ્ટ સ્નાયુઓના કાર્યની તપાસ કરી શકે છે અને યોગ્ય કાર્યક્રમ સૂચવી શકે છે.',

    s8Heading: 'અને ચીરો, એપિસિઓટોમી અથવા સિઝેરિયન પછી?',
    s8Body1:
      'ચીરો અથવા એપિસિઓટોમીને રુઝાતી વખતે ખાસ કાળજીની જરૂર પડે છે. પ્રવૃત્તિઓ ફરી શરૂ કરતી વખતે દુખાવો, ઘાની સ્થિતિ અને પ્રસૂતિ પછી આપેલા માર્ગદર્શનને ધ્યાનમાં લેવાં જોઈએ.',
    s8Body2:
      'સિઝેરિયન પછી સ્વસ્થતામાં પેટની દીવાલ અને ઘાનો પણ સમાવેશ થાય છે. પ્રસૂતિ યોનિમાર્ગ દ્વારા ન થઈ હોય તો પણ, ગર્ભાવસ્થાએ પોતે પેલ્વિક ફ્લોર પર તાણ નાખ્યો હતો.',
    s8HighlightTitle: 'વ્યક્તિગત સંભાળ મદદરૂપ થઈ શકે',
    s8HighlightText:
      'નોંધપાત્ર ચીરો, દુખાવો, પેશાબ કે આંતરડા સંબંધી લક્ષણો અથવા સતત મુશ્કેલીઓના કિસ્સામાં, આરોગ્ય વ્યાવસાયિક સાથે તપાસ ખાસ મદદરૂપ થઈ શકે છે.',

    s9Heading: 'ધીમે ધીમે રમતગમત ફરી શરૂ કરવી',
    s9Body1:
      'પ્રસૂતિ પછી હલનચલન ફરી શરૂ કરવું ધીમે ધીમે થવું જોઈએ. ચાલવું અને હળવાં હલનચલન સામાન્ય રીતે તમને કેવું લાગે છે તેના આધારે ફરી શરૂ કરી શકાય, જ્યારે વધુ ઝટકાવાળી પ્રવૃત્તિઓ માટે વધુ સાવચેતીની જરૂર છે.',
    s9Body2:
      'દોડવું, કૂદવું કે ખૂબ તીવ્ર કસરત ફરી શરૂ કરતાં પહેલાં, પેલ્વિક ફ્લોરની સ્વસ્થતાનું મૂલ્યાંકન કરવું અને કોઈપણ લક્ષણોને ધ્યાનમાં લેવાં સારું છે.',
    s9AlertTitle: 'તબક્કાઓમાં ઉતાવળ ન કરો',
    s9AlertText:
      'કસરત દરમિયાન અથવા પછી પેશાબ લીક થવો, ભારેપણાની લાગણી અથવા દુખાવો એ સંકેત છે કે તમારે ધીમા પડવું જોઈએ અને તીવ્રતા વધારતાં પહેલાં સલાહ લેવી જોઈએ.',

    s10Heading: 'નિષ્ણાતને ક્યારે મળવું?',
    s10Body1:
      'જો તમને ખાતરી ન હોય કે તમે સાચી રીતે સંકોચન કરી રહ્યાં છો કે નહીં, જો તમારાં લક્ષણો ચાલુ રહે, અથવા જો તમે આત્મવિશ્વાસથી અમુક શારીરિક પ્રવૃત્તિઓ ફરી શરૂ કરવા ઇચ્છતાં હો, તો મિડવાઇફ અથવા ફિઝિયોથેરપિસ્ટ સાથે પેલ્વિક ફ્લોરનું પુનર્વસન મદદરૂપ થઈ શકે છે.',
    questionCardTitle: 'પૂછવા જેવા ઉપયોગી પ્રશ્નો',
    appointmentQuestions: [
      'શું મારાં લક્ષણો પેલ્વિક ફ્લોરની નબળાઈ સાથે સુસંગત છે?',
      'શું હું સંકોચન સાચી રીતે કરી રહી છું?',
      'મારે રોજ કેટલી વાર પુનરાવર્તન કરવાં જોઈએ?',
      'શું હું દોડવા, રમતગમત કે વધુ ઝટકાવાળી કસરત પર પાછી ફરી શકું?',
      'શું મને મિડવાઇફ અથવા ફિઝિયોથેરપિસ્ટ સાથે પુનર્વસનની જરૂર છે?',
      'શું મારા ઘા, ચીરા કે સિઝેરિયન માટે કોઈ ખાસ સાવચેતી જરૂરી છે?',
    ],
    s10TipTitle: 'જાણવા જેવું',
    s10TipText:
      'વ્યાવસાયિકને મળવાનો અર્થ એવો નથી કે કંઈક ખોટું છે. એક સત્ર તમારી પદ્ધતિ ચકાસવામાં, તમારી સ્વસ્થતાનું મૂલ્યાંકન કરવામાં અને સાચી રીતે આગળ વધતાં શીખવામાં મદદ કરી શકે છે.',

    s11Heading: 'સમય લેતી સ્વસ્થતા',
    s11Body1:
      'પ્રસૂતિ પછી, ગર્ભાવસ્થા પહેલાં હતી તેવી સંવેદના કે સ્નાયુઓની શક્તિ તરત પાછી ન મળે તે સામાન્ય છે.',
    s11Body2:
      'લક્ષ્ય બને તેટલાં વધુ સંકોચન કરવાનું નથી. તે સંકોચન અને હળવા થવા વચ્ચે સારો તાલમેલ ધીમે ધીમે પાછો મેળવવાનું છે, અને પછી રોજિંદી પ્રવૃત્તિઓમાં આ સ્નાયુઓનો સહજ રીતે ઉપયોગ કરી શકવાનું છે.',
    s11HighlightTitle: 'નાની પ્રગતિ પણ સાચી પ્રગતિ છે',
    s11HighlightText:
      'હલનચલનની વધુ સારી જાગૃતિ, સંકોચનમાં થોડી સેકન્ડનો વધારો, અથવા પેશાબ લીક થવામાં ઘટાડો — આ બધાં પહેલેથી જ પ્રોત્સાહક સંકેતો છે.',

    s12Heading: 'મુખ્ય મુદ્દા',
    summaryTitle: 'આવશ્યક મુદ્દા',
    summaryItems: [
      'ગર્ભાવસ્થા અને પ્રસૂતિ પેલ્વિક ફ્લોર પર નોંધપાત્ર તાણ નાખે છે.',
      'પ્રસૂતિ પછી ધીમે ધીમે સ્વસ્થ થવું સામાન્ય છે.',
      'કસરતોમાં શક્તિ કરતાં હલનચલનની ગુણવત્તાને પ્રાધાન્ય આપવું જોઈએ.',
      'શ્વાસ અને હળવા થવું સંકોચન જેટલું જ મહત્વનું છે.',
      'પેશાબ લીક થવો, ભારેપણું અથવા સતત દુખાવા માટે વ્યાવસાયિકનો અભિપ્રાય લેવો જોઈએ.',
      'મિડવાઇફ અથવા ફિઝિયોથેરપિસ્ટ સાથેનું પુનર્વસન તમને વધુ સારું નિયંત્રણ પાછું મેળવવામાં મદદ કરી શકે છે.',
      'રમતગમતમાં પાછા ફરવું ધીમે ધીમે થવું જોઈએ, ખાસ કરીને વધુ ઝટકાવાળી પ્રવૃત્તિઓ માટે.',
    ],

    finalTipTitle: 'સ્વસ્થ થવા માટે સમય લો',
    finalTipText:
      'પ્રસૂતિ પછી તમારા શરીરમાં ઘણા ફેરફારો થયા છે. પેરિનિયમ પણ તમારા શરીરના બાકીના ભાગ જેટલું જ ધ્યાન માગે છે: ધીમે ધીમે, નિયમિત રીતે અને કોઈ દબાણ વિના.',

    disclaimerText:
      'આ લેખ ફક્ત માહિતી માટે છે અને વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. જો તમને દુખાવો થાય, લક્ષણો ચાલુ રહે અથવા તમારી સ્વસ્થતા અંગે કોઈ ચિંતા હોય, તો આરોગ્ય વ્યાવસાયિકની સલાહ લો.',
  },
  pa: {
    badge: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ • ਸਿਹਤਯਾਬੀ',
    title: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਆਪਣੇ ਪੇਲਵਿਕ ਫਲੋਰ\nਨੂੰ ਮਜ਼ਬੂਤ ਕਰਨਾ',
    metaDuration: '8 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro:
      'ਗਰਭ-ਅਵਸਥਾ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਪੇਲਵਿਕ ਫਲੋਰ ਨੂੰ ਠੀਕ ਹੋਣ ਲਈ ਸਮਾਂ ਚਾਹੀਦਾ ਹੈ। ਸਰਲ, ਨਿਯਮਿਤ ਅਤੇ ਹੌਲੀ-ਹੌਲੀ ਵਧਦੀਆਂ ਕਸਰਤਾਂ ਤੁਹਾਨੂੰ ਤਾਕਤ, ਕੰਟਰੋਲ ਅਤੇ ਭਰੋਸਾ ਮੁੜ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀਆਂ ਹਨ, ਚੀਜ਼ਾਂ ਨੂੰ ਜਲਦੀ ਕਰਨ ਦੀ ਕੋਸ਼ਿਸ਼ ਕੀਤੇ ਬਿਨਾਂ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਪੇਰੀਨੀਅਮ ਦੀ ਭੂਮਿਕਾ ਨੂੰ ਸਮਝਣਾ',
      'ਜਣੇਪਾ ਇਸ \'ਤੇ ਦਬਾਅ ਕਿਉਂ ਪਾਉਂਦਾ ਹੈ',
      'ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਬਹਾਲੀ ਕਦੋਂ ਸ਼ੁਰੂ ਕਰਨੀ ਹੈ',
      'ਸਹੀ ਢੰਗ ਨਾਲ ਸੁੰਗੜਨਾ ਸਿੱਖਣਾ',
      'ਹੌਲੀ-ਹੌਲੀ ਵਧਦੀ ਰੁਟੀਨ ਬਣਾਉਣਾ',
      'ਬਚਣ ਵਾਲੀਆਂ ਗ਼ਲਤੀਆਂ',
      'ਮਦਦ ਕਦੋਂ ਮੰਗਣੀ ਹੈ',
      'ਖੇਡ ਜਾਂ ਕਸਰਤ ਹੌਲੀ-ਹੌਲੀ ਮੁੜ ਸ਼ੁਰੂ ਕਰਨਾ',
      'ਮੁਲਾਕਾਤ ਦੀ ਤਿਆਰੀ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    shareMessage: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਆਪਣੇ ਪੇਲਵਿਕ ਫਲੋਰ ਨੂੰ ਮਜ਼ਬੂਤ ਕਰਨਾ — AWA',

    s1Heading: 'ਪੇਰੀਨੀਅਮ ਦੀ ਭੂਮਿਕਾ ਨੂੰ ਸਮਝਣਾ',
    s1Body1:
      'ਪੇਰੀਨੀਅਮ, ਜਿਸਨੂੰ ਪੇਲਵਿਕ ਫਲੋਰ ਵੀ ਕਿਹਾ ਜਾਂਦਾ ਹੈ, ਪੇਡੂ ਦੇ ਹੇਠਲੇ ਹਿੱਸੇ ਵਿੱਚ ਸਥਿਤ ਮਾਸਪੇਸ਼ੀਆਂ ਦਾ ਇੱਕ ਸਮੂਹ ਹੈ। ਇਹ ਮੂਤਰ-ਥੈਲੀ ਅਤੇ ਆਂਦਰਾਂ ਦੇ ਕੰਟਰੋਲ ਵਿੱਚ ਭੂਮਿਕਾ ਨਿਭਾਉਂਦਾ ਹੈ ਅਤੇ ਪੇਡੂ ਦੇ ਅੰਗਾਂ ਨੂੰ ਸਹਾਰਾ ਦੇਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
    s1Body2:
      'ਗਰਭ-ਅਵਸਥਾ ਦੌਰਾਨ ਇਹਨਾਂ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਕਈ ਮਹੀਨਿਆਂ ਤੱਕ ਵਾਧੂ ਭਾਰ ਚੁੱਕਣਾ ਪੈਂਦਾ ਹੈ। ਜਣੇਪੇ ਦੌਰਾਨ ਵੀ ਇਹਨਾਂ \'ਤੇ ਕਾਫ਼ੀ ਦਬਾਅ ਪੈਂਦਾ ਹੈ।',
    s1HighlightTitle: 'ਇੱਕ ਚੁੱਪ-ਚਾਪ ਪਰ ਜ਼ਰੂਰੀ ਮਾਸਪੇਸ਼ੀ',
    s1HighlightText:
      'ਪੇਲਵਿਕ ਫਲੋਰ ਕਈ ਰੋਜ਼ਾਨਾ ਕੰਮਾਂ ਵਿੱਚ ਸ਼ਾਮਲ ਹੈ: ਪਿਸ਼ਾਬ ਅਤੇ ਮਲ ਨੂੰ ਰੋਕਣਾ, ਗੈਸ ਨੂੰ ਕੰਟਰੋਲ ਕਰਨਾ, ਪੇਡੂ ਦੇ ਅੰਗਾਂ ਨੂੰ ਸਹਾਰਾ ਦੇਣਾ, ਅਤੇ ਕੁਝ ਜਿਨਸੀ ਕਾਰਜਾਂ ਵਿੱਚ ਭੂਮਿਕਾ ਨਿਭਾਉਣਾ।',

    benefitsHeading: 'ਮਜ਼ਬੂਤ ਪੇਲਵਿਕ ਫਲੋਰ ਦੇ ਫ਼ਾਇਦੇ',
    benefitsIntro:
      'ਹੌਲੀ-ਹੌਲੀ ਅਤੇ ਸਹੀ ਢੰਗ ਨਾਲ ਕੀਤੀ ਮਜ਼ਬੂਤੀ ਪੇਲਵਿਕ ਫਲੋਰ ਦੇ ਕੰਟਰੋਲ ਅਤੇ ਸਹਾਰੇ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ।',
    benefits: [
      {
        icon: 'water-outline',
        title: 'ਮੂਤਰ-ਥੈਲੀ ਦਾ ਬਿਹਤਰ ਕੰਟਰੋਲ',
        text: 'ਪੇਲਵਿਕ ਫਲੋਰ ਮੂਤਰ-ਥੈਲੀ ਦੇ ਕੰਟਰੋਲ ਵਿੱਚ ਭੂਮਿਕਾ ਨਿਭਾਉਂਦਾ ਹੈ। ਇਸਨੂੰ ਹੌਲੀ-ਹੌਲੀ ਮਜ਼ਬੂਤ ਕਰਨ ਨਾਲ ਪਿਸ਼ਾਬ ਦੇ ਕੁਝ ਰਿਸਾਅ ਘਟਾਉਣ ਵਿੱਚ ਮਦਦ ਮਿਲ ਸਕਦੀ ਹੈ।',
      },
      {
        icon: 'toilet',
        title: 'ਆਂਦਰਾਂ ਦੇ ਕੰਮ ਨੂੰ ਸਹਾਰਾ',
        text: 'ਇਹ ਮਾਸਪੇਸ਼ੀਆਂ ਗੈਸ ਅਤੇ ਮਲ ਨੂੰ ਕੰਟਰੋਲ ਕਰਨ ਵਿੱਚ ਵੀ ਮਦਦ ਕਰਦੀਆਂ ਹਨ ਅਤੇ ਪੇਡੂ ਦੇ ਅੰਗਾਂ ਨੂੰ ਸਹਾਰਾ ਦੇਣ ਵਿੱਚ ਯੋਗਦਾਨ ਪਾਉਂਦੀਆਂ ਹਨ।',
      },
      {
        icon: 'human-female',
        title: 'ਪੇਡੂ ਦੇ ਅੰਗਾਂ ਨੂੰ ਸਹਾਰਾ',
        text: 'ਪੇਲਵਿਕ ਫਲੋਰ ਮਾਸਪੇਸ਼ੀਆਂ ਦਾ ਇੱਕ ਸੱਚਾ ਆਧਾਰ ਬਣਾਉਂਦਾ ਹੈ ਜੋ ਮੂਤਰ-ਥੈਲੀ, ਬੱਚੇਦਾਨੀ ਅਤੇ ਆਂਦਰਾਂ ਨੂੰ ਸਹਾਰਾ ਦੇਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
      },
      {
        icon: 'heart-pulse',
        title: 'ਹੌਲੀ-ਹੌਲੀ ਅਹਿਸਾਸ ਮੁੜ ਪ੍ਰਾਪਤ ਕਰਨਾ',
        text: 'ਢੁਕਵੀਂ ਬਹਾਲੀ ਤੁਹਾਨੂੰ ਇਸ ਹਿੱਸੇ ਦੀ ਬਿਹਤਰ ਸਮਝ ਅਤੇ ਕੰਟਰੋਲ ਮੁੜ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਵੀ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ।',
      },
    ],

    s2Heading: 'ਗਰਭ-ਅਵਸਥਾ ਅਤੇ ਜਣੇਪਾ ਇਸ \'ਤੇ ਦਬਾਅ ਕਿਉਂ ਪਾਉਂਦੇ ਹਨ',
    s2Body1:
      'ਗਰਭ-ਅਵਸਥਾ ਹੌਲੀ-ਹੌਲੀ ਪੇਲਵਿਕ ਫਲੋਰ \'ਤੇ ਜ਼ਿਆਦਾ ਦਬਾਅ ਪਾਉਂਦੀ ਹੈ। ਯੋਨੀ ਰਾਹੀਂ ਜਣੇਪਾ ਫਿਰ ਇਸ ਹਿੱਸੇ ਦੀਆਂ ਮਾਸਪੇਸ਼ੀਆਂ ਅਤੇ ਟਿਸ਼ੂਆਂ ਨੂੰ ਕਾਫ਼ੀ ਖਿੱਚ ਸਕਦਾ ਹੈ।',
    s2Body2:
      'ਸੀਜ਼ੇਰੀਅਨ ਆਪ੍ਰੇਸ਼ਨ ਵੀ ਪੇਲਵਿਕ ਫਲੋਰ ਨੂੰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਨਹੀਂ ਬਚਾਉਂਦਾ: ਗਰਭ-ਅਵਸਥਾ ਆਪਣੇ-ਆਪ ਵਿੱਚ ਇਹਨਾਂ ਮਾਸਪੇਸ਼ੀਆਂ ਲਈ ਇੱਕ ਅਹਿਮ ਦੌਰ ਰਹਿੰਦੀ ਹੈ।',
    s2Body3:
      'ਇਸ ਲਈ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਠੀਕ ਹੋਣ ਵਿੱਚ ਸਮਾਂ ਲੱਗਣਾ ਆਮ ਗੱਲ ਹੈ। ਕੁਝ ਔਰਤਾਂ ਨੂੰ ਲਗਭਗ ਕੋਈ ਲੱਛਣ ਮਹਿਸੂਸ ਨਹੀਂ ਹੁੰਦੇ, ਜਦਕਿ ਹੋਰਾਂ ਨੂੰ ਰਿਸਾਅ, ਭਾਰੀਪਣ ਦਾ ਅਹਿਸਾਸ ਜਾਂ ਮਾਸਪੇਸ਼ੀਆਂ ਦੇ ਕੰਟਰੋਲ ਵਿੱਚ ਕਮੀ ਮਹਿਸੂਸ ਹੋ ਸਕਦੀ ਹੈ।',
    s2TipTitle: 'ਹਰ ਸਿਹਤਯਾਬੀ ਵੱਖਰੀ ਹੁੰਦੀ ਹੈ',
    s2TipText:
      'ਜਣੇਪੇ ਦੀ ਕਿਸਮ, ਚੀਰਾ ਜਾਂ ਐਪੀਸੀਓਟੋਮੀ, ਦਰਦ ਦੀ ਮੌਜੂਦਗੀ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਤੁਹਾਡੀ ਆਮ ਹਾਲਤ, ਇਹ ਸਭ ਸਿਹਤਯਾਬੀ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰ ਸਕਦੇ ਹਨ।',

    s3Heading: 'ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਬਹਾਲੀ ਕਦੋਂ ਸ਼ੁਰੂ ਕਰਨੀ ਹੈ?',
    s3Body1:
      'ਬਿਨਾਂ ਪੇਚੀਦਗੀ ਵਾਲੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ, ਪੇਲਵਿਕ ਫਲੋਰ ਦੇ ਹਲਕੇ ਸੁੰਗੜਾਅ ਆਮ ਤੌਰ \'ਤੇ ਹੌਲੀ-ਹੌਲੀ ਮੁੜ ਸ਼ੁਰੂ ਕੀਤੇ ਜਾ ਸਕਦੇ ਹਨ। ਕਸਰਤਾਂ ਨੂੰ ਆਪਣੀ ਸਥਿਤੀ ਮੁਤਾਬਕ ਢਾਲਣਾ ਅਤੇ ਜੇ ਕੋਈ ਪੇਚੀਦਗੀ, ਤੇਜ਼ ਦਰਦ ਜਾਂ ਕੋਈ ਖ਼ਾਸ ਪ੍ਰਕਿਰਿਆ ਹੋਈ ਹੋਵੇ ਤਾਂ ਸਲਾਹ ਲੈਣਾ ਜ਼ਰੂਰੀ ਰਹਿੰਦਾ ਹੈ।',
    s3Body2:
      'ਜੇ ਤੁਹਾਡੇ ਪਿਸ਼ਾਬ ਦੀ ਨਲੀ (ਕੈਥੀਟਰ) ਲੱਗੀ ਹੋਵੇ, ਤਾਂ ਕੁਝ ਸਿਫ਼ਾਰਸ਼ਾਂ ਮੁਤਾਬਕ ਪੇਰੀਨੀਅਮ ਦੀਆਂ ਕਸਰਤਾਂ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਇਸਦੇ ਹਟਣ ਅਤੇ ਆਮ ਪਿਸ਼ਾਬ ਮੁੜ ਸ਼ੁਰੂ ਹੋਣ ਦੀ ਉਡੀਕ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ।',
    s3AlertTitle: 'ਦਰਦ ਦੇ ਬਾਵਜੂਦ ਜ਼ੋਰ ਨਾ ਲਗਾਓ',
    s3AlertText:
      'ਤੇਜ਼ ਦਰਦ, ਲੱਛਣਾਂ ਦਾ ਵਿਗੜਨਾ, ਟਾਂਕਿਆਂ ਦਾ ਠੀਕ ਤਰ੍ਹਾਂ ਨਾ ਭਰਨਾ, ਜਾਂ ਕੋਈ ਵੀ ਖ਼ਾਸ ਚਿੰਤਾ ਹੋਵੇ ਤਾਂ ਮਿਡਵਾਈਫ਼, ਡਾਕਟਰ ਜਾਂ ਬਹਾਲੀ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ।',

    s4Heading: 'ਸਹੀ ਢੰਗ ਨਾਲ ਸੁੰਗੜਨਾ ਸਿੱਖਣਾ',
    s4Body1:
      'ਇਸ ਹਰਕਤ ਨੂੰ ਪਛਾਣਨ ਲਈ, ਕਲਪਨਾ ਕਰੋ ਕਿ ਤੁਸੀਂ ਇੱਕੋ ਸਮੇਂ ਗੈਸ ਅਤੇ ਪਿਸ਼ਾਬ ਦੀ ਲੋੜ ਨੂੰ ਰੋਕ ਰਹੇ ਹੋ। ਜਿਸ ਹਰਕਤ ਦੀ ਤੁਸੀਂ ਭਾਲ ਕਰ ਰਹੇ ਹੋ, ਉਹ ਅੰਦਰ ਵੱਲ ਸੁੰਗੜਨ ਅਤੇ ਉੱਪਰ ਖਿੱਚਣ ਦਾ ਅਹਿਸਾਸ ਹੈ।',
    s4Body2:
      'ਟੀਚਾ ਆਪਣੇ ਸਾਰੇ ਸਰੀਰ ਨੂੰ ਕੱਸ ਕੇ ਤਣਨਾ ਨਹੀਂ ਹੈ। ਤੁਹਾਡੇ ਚੂਲ੍ਹੇ, ਪੱਟ ਅਤੇ ਪੇਟ ਦੀਆਂ ਮਾਸਪੇਸ਼ੀਆਂ ਜਿੰਨਾ ਹੋ ਸਕੇ ਢਿੱਲੀਆਂ ਰਹਿਣੀਆਂ ਚਾਹੀਦੀਆਂ ਹਨ, ਜਦਕਿ ਸਾਹ ਆਮ ਵਾਂਗ ਚੱਲਦਾ ਰਹੇ।',
    exercises: [
      {icon: 'weather-windy', label: 'ਸਾਹ ਲੈਣਾ'},
      {icon: 'human-handsup', label: 'ਹਲਕਾ ਸੁੰਗੜਾਅ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ਲੰਮਾ ਸੁੰਗੜਾਅ'},
      {icon: 'gesture-tap-button', label: 'ਤੇਜ਼ ਸੁੰਗੜਾਅ'},
    ],
    s4HighlightTitle: 'ਢਿੱਲਾ ਛੱਡਣਾ ਵੀ ਓਨਾ ਹੀ ਜ਼ਰੂਰੀ ਹੈ',
    s4HighlightText:
      'ਹਰ ਸੁੰਗੜਾਅ ਤੋਂ ਬਾਅਦ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਢਿੱਲਾ ਛੱਡ ਦਿਓ। ਚੰਗੀ ਬਹਾਲੀ ਦਾ ਮਤਲਬ ਪੇਰੀਨੀਅਮ ਨੂੰ ਸਾਰਾ ਦਿਨ ਸੁੰਗੜਿਆ ਰੱਖਣਾ ਨਹੀਂ ਹੈ।',

    s5Heading: 'ਹੌਲੀ-ਹੌਲੀ ਵਧਦੀ ਰੁਟੀਨ ਬਣਾਉਣਾ',
    s5Body1:
      'ਸ਼ੁਰੂ ਵਿੱਚ ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਗੱਲ ਮਾਸਪੇਸ਼ੀਆਂ ਦੀ ਪਛਾਣ ਕਰਨਾ ਅਤੇ ਹਰਕਤ ਸਹੀ ਢੰਗ ਨਾਲ ਕਰਨਾ ਸਿੱਖਣਾ ਹੈ। ਲਗਾਤਾਰਤਾ ਤੀਬਰਤਾ ਨਾਲੋਂ ਜ਼ਿਆਦਾ ਮਹੱਤਵਪੂਰਨ ਹੈ।',
    s5h3a: 'ਲੰਮੇ ਸੁੰਗੜਾਅ',
    s5Body2:
      'ਪੇਲਵਿਕ ਫਲੋਰ ਨੂੰ ਹੌਲੀ ਜਿਹੇ ਅੰਦਰ ਵੱਲ ਖਿੱਚੋ, ਫਿਰ ਸਾਹ ਰੋਕੇ ਬਿਨਾਂ ਕੁਝ ਸਕਿੰਟਾਂ ਲਈ ਸੁੰਗੜਾਅ ਨੂੰ ਫੜੀ ਰੱਖੋ। ਫਿਰ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਪੂਰੀ ਤਰ੍ਹਾਂ ਢਿੱਲਾ ਛੱਡ ਦਿਓ।',
    s5h3b: 'ਛੋਟੇ ਸੁੰਗੜਾਅ',
    s5Body3:
      'ਜਦੋਂ ਹਰਕਤ ਵਿੱਚ ਮੁਹਾਰਤ ਆ ਜਾਵੇ, ਤਾਂ ਛੋਟੇ ਤੇਜ਼ ਸੁੰਗੜਾਅ ਜੋੜੇ ਜਾ ਸਕਦੇ ਹਨ। ਇਹ ਪੇਟ ਦਾ ਦਬਾਅ ਵਧਣ \'ਤੇ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਤੇਜ਼ੀ ਨਾਲ ਸੁੰਗੜਨ ਦੀ ਸਮਰੱਥਾ ਨੂੰ ਸਿਖਲਾਈ ਦੇਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ, ਜਿਵੇਂ ਖੰਘਣ ਜਾਂ ਛਿੱਕਣ ਤੋਂ ਠੀਕ ਪਹਿਲਾਂ।',
    dailyTips: [
      {icon: 'clock-outline', label: 'ਕਸਰਤਾਂ ਨੂੰ ਕਿਸੇ ਰੋਜ਼ਾਨਾ ਆਦਤ ਨਾਲ ਜੋੜੋ'},
      {icon: 'human-sitting', label: 'ਆਰਾਮਦਾਇਕ ਸਥਿਤੀ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੋ'},
      {icon: 'weather-windy', label: 'ਸੁੰਗੜਾਅ ਦੌਰਾਨ ਆਮ ਵਾਂਗ ਸਾਹ ਲਓ'},
      {icon: 'sleep', label: 'ਢਿੱਲੇ ਛੱਡਣ ਦੇ ਪੜਾਵਾਂ ਦਾ ਧਿਆਨ ਰੱਖੋ'},
      {icon: 'chart-line', label: 'ਹੌਲੀ-ਹੌਲੀ ਮੁਸ਼ਕਲ ਵਧਾਓ'},
      {icon: 'doctor', label: 'ਯਕੀਨ ਨਾ ਹੋਵੇ ਤਾਂ ਸਲਾਹ ਲਓ'},
    ],
    s5TipTitle: 'ਸਭ ਤੋਂ ਵੱਧ ਲਗਾਤਾਰਤਾ',
    s5TipText:
      'ਕਸਰਤਾਂ ਨੂੰ ਆਪਣੇ ਦਿਨ ਦੀ ਕਿਸੇ ਮੌਜੂਦਾ ਆਦਤ ਨਾਲ ਜੋੜਨ ਨਾਲ ਲਗਾਤਾਰ ਕਰਨਾ ਆਸਾਨ ਹੋ ਸਕਦਾ ਹੈ: ਦੁੱਧ ਪਿਲਾਉਣ ਤੋਂ ਬਾਅਦ, ਦੰਦ ਸਾਫ਼ ਕਰਨ ਤੋਂ ਬਾਅਦ, ਜਾਂ ਕਿਸੇ ਹੋਰ ਸਮੇਂ ਜੋ ਤੁਹਾਨੂੰ ਠੀਕ ਲੱਗੇ।',

    s6Heading: 'ਬਚਣ ਵਾਲੀਆਂ ਆਮ ਗ਼ਲਤੀਆਂ',
    s6Body1:
      'ਪੇਰੀਨੀਅਮ ਦੀਆਂ ਕਸਰਤਾਂ ਸਰਲ ਲੱਗ ਸਕਦੀਆਂ ਹਨ, ਪਰ ਹੋਰ ਮਾਸਪੇਸ਼ੀਆਂ ਨਾਲ ਭਰਪਾਈ ਕਰ ਲੈਣਾ ਜਾਂ ਬਹੁਤ ਜ਼ੋਰ ਲਗਾ ਦੇਣਾ ਆਸਾਨ ਹੈ।',
    commonMistakes: [
      'ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਥਾਂ ਚੂਲ੍ਹਿਆਂ ਜਾਂ ਪੱਟਾਂ ਨੂੰ ਕੱਸਣਾ',
      'ਸੁੰਗੜਾਅ ਦੌਰਾਨ ਸਾਹ ਰੋਕਣਾ',
      'ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਢਿੱਲਾ ਛੱਡੇ ਬਿਨਾਂ ਲਗਾਤਾਰ ਸੁੰਗੜਿਆ ਰੱਖਣਾ',
      'ਕਸਰਤਾਂ ਸਿਰਫ਼ ਕੁਝ ਦਿਨ ਕਰਕੇ ਫਿਰ ਛੱਡ ਦੇਣਾ',
      'ਸੁੰਗੜਾਅ ਦੀ ਜਾਂਚ ਕਰਨ ਲਈ ਜਾਣਬੁੱਝ ਕੇ ਪਿਸ਼ਾਬ ਦੀ ਧਾਰ ਰੋਕਣਾ',
    ],
    s6TipTitle: 'ਕੀ ਨਹੀਂ ਕਰਨਾ ਚਾਹੀਦਾ',
    s6TipText:
      'ਜਾਣਬੁੱਝ ਕੇ ਪਿਸ਼ਾਬ ਦੀ ਧਾਰ ਰੋਕ ਕੇ ਕਸਰਤਾਂ ਕਰਨ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਨਹੀਂ ਕੀਤੀ ਜਾਂਦੀ। ਇਹ ਤਰੀਕਾ ਪੇਰੀਨੀਅਮ ਨੂੰ ਸਹੀ ਢੰਗ ਨਾਲ ਸਿਖਲਾਈ ਨਹੀਂ ਦਿੰਦਾ ਅਤੇ ਮੂਤਰ-ਥੈਲੀ ਦੇ ਆਮ ਕੰਮ ਵਿੱਚ ਗੜਬੜ ਪੈਦਾ ਕਰ ਸਕਦਾ ਹੈ।',

    s7Heading: 'ਕਿਹੜੇ ਲੱਛਣਾਂ ਕਾਰਨ ਸਲਾਹ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ?',
    s7Body1:
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਕਈ ਵਾਰ ਹਲਕੇ ਰਿਸਾਅ ਜਾਂ ਅਸਾਧਾਰਨ ਅਹਿਸਾਸ ਹੋ ਸਕਦੇ ਹਨ। ਪਰ ਜੇ ਇਹ ਬਣੇ ਰਹਿਣ, ਵਿਗੜਨ ਜਾਂ ਤੁਹਾਡੀ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਰੁਕਾਵਟ ਪਾਉਣ, ਤਾਂ ਇਹਨਾਂ ਨੂੰ ਅਣਦੇਖਿਆ ਨਹੀਂ ਕਰਨਾ ਚਾਹੀਦਾ।',
    warningSigns: [
      'ਖੰਘਣ, ਛਿੱਕਣ, ਹੱਸਣ ਜਾਂ ਜ਼ੋਰ ਲਗਾਉਣ \'ਤੇ ਪਿਸ਼ਾਬ ਦਾ ਰਿਸਾਅ',
      'ਹੇਠਲੇ ਪੇਡੂ ਵਿੱਚ ਭਾਰੀਪਣ ਜਾਂ ਦਬਾਅ ਦਾ ਅਹਿਸਾਸ',
      'ਇਹ ਅਹਿਸਾਸ ਕਿ ਯੋਨੀ ਵਿੱਚ ਕੋਈ ਗੰਢ ਜਾਂ ਕੋਈ ਚੀਜ਼ ਹੇਠਾਂ ਆ ਰਹੀ ਹੈ',
      'ਗੈਸ ਜਾਂ ਮਲ ਨੂੰ ਰੋਕਣ ਵਿੱਚ ਮੁਸ਼ਕਲ',
      'ਪੇਰੀਨੀਅਮ ਵਿੱਚ ਲਗਾਤਾਰ ਦਰਦ',
      'ਜਿਨਸੀ ਸੰਬੰਧ ਦੌਰਾਨ ਜਾਂ ਬਾਅਦ ਵਿੱਚ ਦਰਦ',
      'ਪੇਰੀਨੀਅਮ ਦੀਆਂ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਪਛਾਣਨ ਜਾਂ ਸਹੀ ਢੰਗ ਨਾਲ ਸੁੰਗੜਨ ਵਿੱਚ ਮੁਸ਼ਕਲ',
    ],
    consultLabel: 'ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ?',
    s7Body2:
      'ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਬਹਾਲੀ ਦੀ ਮਾਹਿਰ ਮਿਡਵਾਈਫ਼, ਡਾਕਟਰ ਜਾਂ ਫਿਜ਼ੀਓਥੈਰੇਪਿਸਟ ਮਾਸਪੇਸ਼ੀਆਂ ਦੇ ਕੰਮ ਦੀ ਜਾਂਚ ਕਰ ਸਕਦੇ ਹਨ ਅਤੇ ਢੁਕਵਾਂ ਪ੍ਰੋਗਰਾਮ ਸੁਝਾ ਸਕਦੇ ਹਨ।',

    s8Heading: 'ਅਤੇ ਚੀਰੇ, ਐਪੀਸੀਓਟੋਮੀ ਜਾਂ ਸੀਜ਼ੇਰੀਅਨ ਤੋਂ ਬਾਅਦ?',
    s8Body1:
      'ਚੀਰੇ ਜਾਂ ਐਪੀਸੀਓਟੋਮੀ ਵਿੱਚ ਠੀਕ ਹੋਣ ਦੌਰਾਨ ਖ਼ਾਸ ਧਿਆਨ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ। ਸਰਗਰਮੀਆਂ ਮੁੜ ਸ਼ੁਰੂ ਕਰਦੇ ਸਮੇਂ ਦਰਦ, ਜ਼ਖ਼ਮ ਦੀ ਹਾਲਤ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਿਲੀਆਂ ਹਦਾਇਤਾਂ ਨੂੰ ਧਿਆਨ ਵਿੱਚ ਰੱਖਣਾ ਚਾਹੀਦਾ ਹੈ।',
    s8Body2:
      'ਸੀਜ਼ੇਰੀਅਨ ਤੋਂ ਬਾਅਦ ਸਿਹਤਯਾਬੀ ਵਿੱਚ ਪੇਟ ਦੀ ਕੰਧ ਅਤੇ ਟਾਂਕਿਆਂ ਦਾ ਨਿਸ਼ਾਨ ਵੀ ਸ਼ਾਮਲ ਹੁੰਦਾ ਹੈ। ਭਾਵੇਂ ਜਣੇਪਾ ਯੋਨੀ ਰਾਹੀਂ ਨਹੀਂ ਹੋਇਆ, ਗਰਭ-ਅਵਸਥਾ ਨੇ ਫਿਰ ਵੀ ਪੇਲਵਿਕ ਫਲੋਰ \'ਤੇ ਦਬਾਅ ਪਾਇਆ ਹੁੰਦਾ ਹੈ।',
    s8HighlightTitle: 'ਨਿੱਜੀ ਦੇਖਭਾਲ ਮਦਦਗਾਰ ਹੋ ਸਕਦੀ ਹੈ',
    s8HighlightText:
      'ਵੱਡੇ ਚੀਰੇ, ਦਰਦ, ਪਿਸ਼ਾਬ ਜਾਂ ਆਂਦਰਾਂ ਦੇ ਲੱਛਣਾਂ, ਜਾਂ ਲਗਾਤਾਰ ਮੁਸ਼ਕਲਾਂ ਦੀ ਸਥਿਤੀ ਵਿੱਚ, ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਜਾਂਚ ਖ਼ਾਸ ਤੌਰ \'ਤੇ ਲਾਭਦਾਇਕ ਹੋ ਸਕਦੀ ਹੈ।',

    s9Heading: 'ਖੇਡ ਜਾਂ ਕਸਰਤ ਹੌਲੀ-ਹੌਲੀ ਮੁੜ ਸ਼ੁਰੂ ਕਰਨਾ',
    s9Body1:
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਹਿਲਜੁਲ ਹੌਲੀ-ਹੌਲੀ ਮੁੜ ਸ਼ੁਰੂ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ। ਸੈਰ ਅਤੇ ਹਲਕੀਆਂ ਹਰਕਤਾਂ ਆਮ ਤੌਰ \'ਤੇ ਤੁਹਾਡੇ ਮਹਿਸੂਸ ਕਰਨ ਮੁਤਾਬਕ ਮੁੜ ਸ਼ੁਰੂ ਹੋ ਸਕਦੀਆਂ ਹਨ, ਜਦਕਿ ਜ਼ੋਰਦਾਰ ਝਟਕੇ ਵਾਲੀਆਂ ਸਰਗਰਮੀਆਂ ਵਿੱਚ ਜ਼ਿਆਦਾ ਸਾਵਧਾਨੀ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ।',
    s9Body2:
      'ਦੌੜਨ, ਛਾਲਾਂ ਮਾਰਨ ਜਾਂ ਬਹੁਤ ਤੀਬਰ ਕਸਰਤ ਮੁੜ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ, ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਸਿਹਤਯਾਬੀ ਦਾ ਮੁਲਾਂਕਣ ਕਰਨਾ ਅਤੇ ਕਿਸੇ ਵੀ ਲੱਛਣ ਨੂੰ ਧਿਆਨ ਵਿੱਚ ਰੱਖਣਾ ਬਿਹਤਰ ਹੈ।',
    s9AlertTitle: 'ਪੜਾਵਾਂ ਵਿੱਚ ਜਲਦਬਾਜ਼ੀ ਨਾ ਕਰੋ',
    s9AlertText:
      'ਕਸਰਤ ਦੌਰਾਨ ਜਾਂ ਬਾਅਦ ਵਿੱਚ ਰਿਸਾਅ, ਭਾਰੀਪਣ ਦਾ ਅਹਿਸਾਸ ਜਾਂ ਦਰਦ ਇਸ ਗੱਲ ਦੇ ਸੰਕੇਤ ਹਨ ਕਿ ਤੁਹਾਨੂੰ ਰਫ਼ਤਾਰ ਘਟਾਉਣੀ ਚਾਹੀਦੀ ਹੈ ਅਤੇ ਤੀਬਰਤਾ ਵਧਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਸਲਾਹ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ।',

    s10Heading: 'ਮਾਹਿਰ ਨੂੰ ਕਦੋਂ ਮਿਲਣਾ ਹੈ?',
    s10Body1:
      'ਮਿਡਵਾਈਫ਼ ਜਾਂ ਫਿਜ਼ੀਓਥੈਰੇਪਿਸਟ ਨਾਲ ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਬਹਾਲੀ ਮਦਦਗਾਰ ਹੋ ਸਕਦੀ ਹੈ ਜੇ ਤੁਹਾਨੂੰ ਯਕੀਨ ਨਹੀਂ ਕਿ ਤੁਸੀਂ ਸਹੀ ਢੰਗ ਨਾਲ ਸੁੰਗੜ ਰਹੇ ਹੋ, ਜੇ ਤੁਹਾਡੇ ਲੱਛਣ ਬਣੇ ਰਹਿਣ, ਜਾਂ ਜੇ ਤੁਸੀਂ ਕੁਝ ਸਰੀਰਕ ਸਰਗਰਮੀਆਂ ਭਰੋਸੇ ਨਾਲ ਮੁੜ ਸ਼ੁਰੂ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ।',
    questionCardTitle: 'ਪੁੱਛਣ ਲਈ ਮਦਦਗਾਰ ਸਵਾਲ',
    appointmentQuestions: [
      'ਕੀ ਮੇਰੇ ਲੱਛਣ ਪੇਲਵਿਕ ਫਲੋਰ ਦੀ ਕਮਜ਼ੋਰੀ ਨਾਲ ਮੇਲ ਖਾਂਦੇ ਹਨ?',
      'ਕੀ ਮੈਂ ਸੁੰਗੜਾਅ ਸਹੀ ਢੰਗ ਨਾਲ ਕਰ ਰਹੀ ਹਾਂ?',
      'ਮੈਨੂੰ ਹਰ ਰੋਜ਼ ਕਿੰਨੀ ਵਾਰ ਦੁਹਰਾਉਣਾ ਚਾਹੀਦਾ ਹੈ?',
      'ਕੀ ਮੈਂ ਦੌੜਨ, ਖੇਡ ਜਾਂ ਝਟਕੇ ਵਾਲੀ ਕਸਰਤ ਮੁੜ ਸ਼ੁਰੂ ਕਰ ਸਕਦੀ ਹਾਂ?',
      'ਕੀ ਮੈਨੂੰ ਮਿਡਵਾਈਫ਼ ਜਾਂ ਫਿਜ਼ੀਓਥੈਰੇਪਿਸਟ ਨਾਲ ਬਹਾਲੀ ਦੀ ਲੋੜ ਹੈ?',
      'ਕੀ ਮੇਰੇ ਟਾਂਕਿਆਂ ਦੇ ਨਿਸ਼ਾਨ, ਚੀਰੇ ਜਾਂ ਸੀਜ਼ੇਰੀਅਨ ਲਈ ਕਿਸੇ ਖ਼ਾਸ ਸਾਵਧਾਨੀ ਦੀ ਲੋੜ ਹੈ?',
    ],
    s10TipTitle: 'ਜਾਣਨ ਯੋਗ',
    s10TipText:
      'ਮਾਹਿਰ ਨੂੰ ਮਿਲਣ ਦਾ ਮਤਲਬ ਜ਼ਰੂਰੀ ਨਹੀਂ ਕਿ ਕੁਝ ਗ਼ਲਤ ਹੈ। ਇੱਕ ਮੁਲਾਕਾਤ ਸਿਰਫ਼ ਤੁਹਾਡੇ ਤਰੀਕੇ ਦੀ ਜਾਂਚ ਕਰਨ, ਤੁਹਾਡੀ ਸਿਹਤਯਾਬੀ ਦਾ ਮੁਲਾਂਕਣ ਕਰਨ ਅਤੇ ਸਹੀ ਢੰਗ ਨਾਲ ਅੱਗੇ ਵਧਣਾ ਸਿੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ।',

    s11Heading: 'ਇੱਕ ਸਿਹਤਯਾਬੀ ਜਿਸ ਵਿੱਚ ਸਮਾਂ ਲੱਗਦਾ ਹੈ',
    s11Body1:
      'ਬੱਚੇ ਨੂੰ ਜਨਮ ਦੇਣ ਤੋਂ ਬਾਅਦ, ਗਰਭ-ਅਵਸਥਾ ਤੋਂ ਪਹਿਲਾਂ ਵਾਲੇ ਅਹਿਸਾਸ ਜਾਂ ਮਾਸਪੇਸ਼ੀਆਂ ਦੀ ਤਾਕਤ ਦਾ ਤੁਰੰਤ ਵਾਪਸ ਨਾ ਆਉਣਾ ਆਮ ਗੱਲ ਹੈ।',
    s11Body2:
      'ਟੀਚਾ ਵੱਧ ਤੋਂ ਵੱਧ ਸੁੰਗੜਾਅ ਕਰਨਾ ਨਹੀਂ ਹੈ। ਇਹ ਸੁੰਗੜਾਅ ਅਤੇ ਢਿੱਲ ਵਿਚਕਾਰ ਚੰਗਾ ਤਾਲਮੇਲ ਹੌਲੀ-ਹੌਲੀ ਮੁੜ ਪ੍ਰਾਪਤ ਕਰਨ ਬਾਰੇ ਜ਼ਿਆਦਾ ਹੈ, ਅਤੇ ਫਿਰ ਇਹਨਾਂ ਮਾਸਪੇਸ਼ੀਆਂ ਨੂੰ ਰੋਜ਼ਾਨਾ ਕੰਮਾਂ ਵਿੱਚ ਕੁਦਰਤੀ ਢੰਗ ਨਾਲ ਵਰਤਣ ਦੇ ਯੋਗ ਹੋਣਾ।',
    s11HighlightTitle: 'ਛੋਟੀ ਤਰੱਕੀ ਵੀ ਅਸਲ ਤਰੱਕੀ ਹੈ',
    s11HighlightText:
      'ਹਰਕਤ ਦੀ ਬਿਹਤਰ ਸਮਝ, ਸੁੰਗੜਾਅ ਵਿੱਚ ਕੁਝ ਵਾਧੂ ਸਕਿੰਟ, ਜਾਂ ਰਿਸਾਅ ਵਿੱਚ ਕਮੀ ਪਹਿਲਾਂ ਹੀ ਹੌਸਲਾ ਦੇਣ ਵਾਲੇ ਸੰਕੇਤ ਹਨ।',

    s12Heading: 'ਮੁੱਖ ਨੁਕਤੇ',
    summaryTitle: 'ਜ਼ਰੂਰੀ ਗੱਲਾਂ',
    summaryItems: [
      'ਗਰਭ-ਅਵਸਥਾ ਅਤੇ ਜਣੇਪਾ ਪੇਲਵਿਕ ਫਲੋਰ \'ਤੇ ਕਾਫ਼ੀ ਦਬਾਅ ਪਾਉਂਦੇ ਹਨ।',
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਹੌਲੀ-ਹੌਲੀ ਸਿਹਤਯਾਬੀ ਆਮ ਗੱਲ ਹੈ।',
      'ਕਸਰਤਾਂ ਵਿੱਚ ਤਾਕਤ ਨਾਲੋਂ ਹਰਕਤ ਦੀ ਗੁਣਵੱਤਾ ਨੂੰ ਪਹਿਲ ਦੇਣੀ ਚਾਹੀਦੀ ਹੈ।',
      'ਸਾਹ ਲੈਣਾ ਅਤੇ ਢਿੱਲ ਛੱਡਣਾ ਵੀ ਸੁੰਗੜਾਅ ਜਿੰਨਾ ਹੀ ਜ਼ਰੂਰੀ ਹੈ।',
      'ਪਿਸ਼ਾਬ ਦਾ ਰਿਸਾਅ, ਭਾਰੀਪਣ ਜਾਂ ਲਗਾਤਾਰ ਦਰਦ ਮਾਹਿਰ ਦੀ ਰਾਇ ਦੇ ਹੱਕਦਾਰ ਹਨ।',
      'ਮਿਡਵਾਈਫ਼ ਜਾਂ ਫਿਜ਼ੀਓਥੈਰੇਪਿਸਟ ਨਾਲ ਬਹਾਲੀ ਤੁਹਾਨੂੰ ਬਿਹਤਰ ਕੰਟਰੋਲ ਮੁੜ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ।',
      'ਖੇਡ ਜਾਂ ਕਸਰਤ ਵਿੱਚ ਵਾਪਸੀ ਹੌਲੀ-ਹੌਲੀ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ, ਖ਼ਾਸ ਕਰਕੇ ਝਟਕੇ ਵਾਲੀਆਂ ਸਰਗਰਮੀਆਂ ਲਈ।',
    ],

    finalTipTitle: 'ਠੀਕ ਹੋਣ ਲਈ ਸਮਾਂ ਲਓ',
    finalTipText:
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਤੁਹਾਡਾ ਸਰੀਰ ਬਹੁਤ ਸਾਰੇ ਬਦਲਾਵਾਂ ਵਿੱਚੋਂ ਲੰਘਿਆ ਹੈ। ਪੇਰੀਨੀਅਮ ਵੀ ਤੁਹਾਡੇ ਬਾਕੀ ਸਰੀਰ ਜਿੰਨੇ ਹੀ ਧਿਆਨ ਦਾ ਹੱਕਦਾਰ ਹੈ: ਹੌਲੀ-ਹੌਲੀ, ਨਿਯਮਿਤ ਤੌਰ \'ਤੇ ਅਤੇ ਬਿਨਾਂ ਦਬਾਅ ਦੇ।',

    disclaimerText:
      'ਇਹ ਲੇਖ ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਜੇ ਤੁਹਾਨੂੰ ਦਰਦ, ਲਗਾਤਾਰ ਲੱਛਣ ਹੋਣ, ਜਾਂ ਆਪਣੀ ਸਿਹਤਯਾਬੀ ਬਾਰੇ ਕੋਈ ਚਿੰਤਾ ਹੋਵੇ, ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਲਓ।',
  },
  my: {
    badge: 'မီးဖွားပြီးနောက် • ပြန်လည်ကောင်းမွန်ခြင်း',
    title: 'ကလေးမွေးဖွားပြီးနောက်\nတင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို ခိုင်ခံ့စေခြင်း',
    metaDuration: 'ဖတ်ချိန် 8 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro:
      'ကိုယ်ဝန်ဆောင်ခြင်းနှင့် ကလေးမွေးဖွားပြီးနောက် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားများ ပြန်လည်ကောင်းမွန်လာရန် အချိန်လိုအပ်သည်။ ရိုးရှင်းပြီးပုံမှန်ပြုလုပ်သော အဆင့်ဆင့်လေ့ကျင့်ခန်းများသည် အရေးကြီးသည်များကို အလျင်စလို မလုပ်ဘဲ ခွန်အား၊ ထိန်းချုပ်နိုင်စွမ်းနှင့်ယုံကြည်မှုကို ပြန်လည်ရရှိစေရန် ကူညီနိုင်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ပေရီနီယမ်၏ အခန်းကဏ္ဍကို နားလည်ခြင်း',
      'ကလေးမွေးဖွားခြင်းက ၎င်းကို အဘယ်ကြောင့် ဖိအားပေးသနည်း',
      'တင်ပါးဆုံအောက်ပိုင်း ပြန်လည်ကျန်းမာစေရေးကို ဘယ်အချိန်စတင်မလဲ',
      'မှန်ကန်စွာ ကျုံ့တတ်အောင် သင်ယူခြင်း',
      'အဆင့်ဆင့် လေ့ကျင့်ခြင်း အစီအစဉ် တည်ဆောက်ခြင်း',
      'ရှောင်ရှားသင့်သော အမှားများ',
      'အကူအညီ ဘယ်အချိန်တောင်းသင့်သလဲ',
      'အားကစားကို တဖြည်းဖြည်း ပြန်စခြင်း',
      'ဆရာဝန်ချိန်းဆိုမှုအတွက် ပြင်ဆင်ခြင်း',
      'အဓိကအချက်များ',
    ],
    shareMessage: 'ကလေးမွေးဖွားပြီးနောက် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို ခိုင်ခံ့စေခြင်း — AWA',

    s1Heading: 'ပေရီနီယမ်၏ အခန်းကဏ္ဍကို နားလည်ခြင်း',
    s1Body1:
      'တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားဟုလည်း ခေါ်သော ပေရီနီယမ်သည် တင်ပါးဆုံ၏ အောက်ခြေတွင် တည်ရှိသော ကြွက်သားအုပ်စုတစ်ခုဖြစ်သည်။ ၎င်းသည် ဆီးအိတ်နှင့် အူမကြီးကို ထိန်းချုပ်ရာတွင် အခန်းကဏ္ဍပါဝင်ပြီး တင်ပါးဆုံအတွင်းအင်္ဂါများကို ထောက်ပံ့ပေးသည်။',
    s1Body2:
      'ကိုယ်ဝန်ဆောင်ချိန်တွင် ဤကြွက်သားများသည် လအနည်းငယ်ကြာ အပိုအလေးချိန်ကို ထမ်းထားရသည်။ ကလေးမွေးဖွားချိန်တွင်လည်း ၎င်းတို့သည် သိသာသော ဖိအားကို ခံရသည်။',
    s1HighlightTitle: 'သိမ်မွေ့သော်လည်း မရှိမဖြစ်သော ကြွက်သား',
    s1HighlightText:
      'တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားသည် နေ့စဉ်လုပ်ငန်းဆောင်တာ အများအပြားတွင် ပါဝင်သည်။ ဆီးနှင့် ဝမ်းကို ထိန်းထားခြင်း၊ ဂတ်စ်ထွက်ခြင်းကို ထိန်းချုပ်ခြင်း၊ တင်ပါးဆုံအတွင်းအင်္ဂါများကို ထောက်ပံ့ခြင်းနှင့် လိင်ဆိုင်ရာ လုပ်ငန်းဆောင်တာအချို့တွင် အခန်းကဏ္ဍပါဝင်ခြင်းတို့ဖြစ်သည်။',

    benefitsHeading: 'ပိုမိုခိုင်ခံ့သော တင်ပါးဆုံအောက်ပိုင်း ကြွက်သား၏ အကျိုးကျေးဇူးများ',
    benefitsIntro:
      'အဆင့်ဆင့်၊ မှန်ကန်စွာ လေ့ကျင့်ခြင်းသည် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သား၏ ထိန်းချုပ်နိုင်မှုနှင့် ထောက်ပံ့မှုကို တိုးတက်စေရန် ကူညီနိုင်သည်။',
    benefits: [
      {
        icon: 'water-outline',
        title: 'ဆီးအိတ်ကို ပိုမိုထိန်းချုပ်နိုင်ခြင်း',
        text: 'တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားသည် ဆီးအိတ်ကို ထိန်းချုပ်ရာတွင် အခန်းကဏ္ဍပါဝင်သည်။ ၎င်းကို တဖြည်းဖြည်း ခိုင်ခံ့စေခြင်းဖြင့် ဆီးယိုစိမ့်ခြင်းအချို့ လျော့နည်းစေနိုင်သည်။',
      },
      {
        icon: 'toilet',
        title: 'အူလမ်းကြောင်း လုပ်ငန်းဆောင်တာကို ထောက်ပံ့ခြင်း',
        text: 'ဤကြွက်သားများသည် ဂတ်စ်နှင့် ဝမ်းကို ထိန်းချုပ်ရာတွင်လည်း ကူညီပြီး တင်ပါးဆုံအတွင်းအင်္ဂါများကို ထောက်ပံ့ပေးရာတွင် ပါဝင်သည်။',
      },
      {
        icon: 'human-female',
        title: 'တင်ပါးဆုံအတွင်းအင်္ဂါများကို ထောက်ပံ့ခြင်း',
        text: 'တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားသည် ဆီးအိတ်၊ သားအိမ်နှင့် အူများကို ထောက်ပံ့ပေးသည့် စစ်မှန်သော ကြွက်သားအခြေခံတစ်ခု ဖြစ်သည်။',
      },
      {
        icon: 'heart-pulse',
        title: 'ခံစားမှုကို တဖြည်းဖြည်း ပြန်လည်ရရှိခြင်း',
        text: 'သင့်လျော်သော ပြန်လည်ကျန်းမာစေရေး လေ့ကျင့်မှုသည် ဤနေရာကို ပိုမိုသတိထားမိပြီး ထိန်းချုပ်နိုင်စေရန်လည်း ကူညီနိုင်သည်။',
      },
    ],

    s2Heading: 'ကိုယ်ဝန်ဆောင်ခြင်းနှင့် ကလေးမွေးဖွားခြင်းက ၎င်းကို အဘယ်ကြောင့် ဖိအားပေးသနည်း',
    s2Body1:
      'ကိုယ်ဝန်ဆောင်ခြင်းသည် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားအပေါ် ဖိအားကို တဖြည်းဖြည်း တိုးစေသည်။ မီးယပ်လမ်းကြောင်းမှ ကလေးမွေးဖွားခြင်းသည် ထို့နောက် ဤနေရာရှိ ကြွက်သားများနှင့် အသားတစ်စုများကို သိသိသာသာ ဆန့်ထွက်စေနိုင်သည်။',
    s2Body2:
      'ခွဲစိတ်မွေးဖွားခြင်းသည်လည်း တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို လုံးဝ ကာကွယ်မပေးပါ။ ကိုယ်ဝန်ဆောင်ခြင်းကိုယ်တိုင်သည် ဤကြွက်သားများအတွက် အရေးပါသော ကာလတစ်ခု ဖြစ်နေဆဲဖြစ်သည်။',
    s2Body3:
      'ထို့ကြောင့် မွေးဖွားပြီးနောက် ပြန်လည်ကောင်းမွန်ရန် အချိန်ယူရခြင်းသည် ပုံမှန်ဖြစ်သည်။ အချို့အမျိုးသမီးများတွင် ရောဂါလက္ခဏာ မခံစားရသလောက်ဖြစ်ပြီး အချို့မှာ ဆီးယိုစိမ့်ခြင်း၊ လေးလံသော ခံစားချက် သို့မဟုတ် ကြွက်သားထိန်းချုပ်မှု လျော့နည်းခြင်းကို သတိပြုမိနိုင်သည်။',
    s2TipTitle: 'ပြန်လည်ကောင်းမွန်ခြင်းတိုင်း မတူပါ',
    s2TipText:
      'မွေးဖွားပုံ အမျိုးအစား၊ အရေပြားပြဲခြင်း သို့မဟုတ် ပေရီနီယမ်ခွဲစိတ်ခြင်း၊ နာကျင်မှုရှိခြင်းနှင့် မွေးဖွားပြီးနောက် သင်၏ ယေဘုယျအခြေအနေတို့သည် ပြန်လည်ကောင်းမွန်မှုကို သက်ရောက်နိုင်သည်။',

    s3Heading: 'တင်ပါးဆုံအောက်ပိုင်း ပြန်လည်ကျန်းမာစေရေးကို ဘယ်အချိန်စတင်မလဲ။',
    s3Body1:
      'ရှုပ်ထွေးမှုမရှိသော မွေးဖွားမှုပြီးနောက် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို ညင်သာစွာ ကျုံ့ခြင်းကို များသောအားဖြင့် တဖြည်းဖြည်း ပြန်စနိုင်သည်။ လေ့ကျင့်ခန်းများကို သင့်အခြေအနေနှင့် လိုက်ဖက်အောင် ပြုလုပ်ရန်နှင့် ရှုပ်ထွေးမှု၊ သိသာသော နာကျင်မှု သို့မဟုတ် သီးသန့်ကုသမှုတစ်ခု ကြုံခဲ့လျှင် အကြံဉာဏ်တောင်းရန် အရေးကြီးနေဆဲဖြစ်သည်။',
    s3Body2:
      'ဆီးထုတ်ပြွန် ထည့်ထားလျှင် ပေရီနီယမ်လေ့ကျင့်ခန်း မစတင်မီ ၎င်းကို ဖယ်ရှားပြီး ပုံမှန်ဆီးသွားခြင်း ပြန်ဖြစ်သည်အထိ စောင့်ရန် အကြံပြုချက်အချို့က အကြံပေးသည်။',
    s3AlertTitle: 'နာကျင်နေလျက် မဇွတ်လုပ်ပါနှင့်',
    s3AlertText:
      'သိသာသော နာကျင်မှု၊ ပိုဆိုးလာသော ရောဂါလက္ခဏာများ၊ ကောင်းစွာ မကျက်သော ဒဏ်ရာ သို့မဟုတ် စိုးရိမ်စရာတစ်ခုခုရှိလျှင် သားဖွားဆရာမ၊ ဆရာဝန် သို့မဟုတ် ပြန်လည်ကျန်းမာစေရေး ပညာရှင်၏ အကြံဉာဏ်ကို ရယူသင့်သည်။',

    s4Heading: 'မှန်ကန်စွာ ကျုံ့တတ်အောင် သင်ယူခြင်း',
    s4Body1:
      'လှုပ်ရှားမှုကို သိရှိရန် ဂတ်စ်ကိုလည်းကောင်း၊ ဆီးသွားချင်စိတ်ကိုလည်းကောင်း တစ်ပြိုင်နက် ထိန်းထားသည်ဟု စိတ်ကူးကြည့်ပါ။ သင်ရှာနေသော လှုပ်ရှားမှုမှာ အတွင်းသို့ ကျုံ့ပြီး မြှင့်တင်လိုက်သည့် ခံစားချက်ဖြစ်သည်။',
    s4Body2:
      'ရည်ရွယ်ချက်မှာ ခန္ဓာကိုယ်တစ်ခုလုံးကို တင်းကျပ်စွာ ကြွက်သားတင်းခြင်း မဟုတ်ပါ။ အသက်ရှူခြင်းကို ပုံမှန်ဆက်လုပ်နေစဉ် တင်ပါးများ၊ ပေါင်များနှင့် ဝမ်းဗိုက်ကြွက်သားများကို တတ်နိုင်သမျှ ဖြေလျှော့ထားသင့်သည်။',
    exercises: [
      {icon: 'weather-windy', label: 'အသက်ရှူခြင်း'},
      {icon: 'human-handsup', label: 'ညင်သာသော ကျုံ့ခြင်း'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ကြာရှည်ကျုံ့ခြင်း'},
      {icon: 'gesture-tap-button', label: 'မြန်ဆန်သော ကျုံ့ခြင်းများ'},
    ],
    s4HighlightTitle: 'ဖြေလျှော့ခြင်းလည်း အရေးကြီးသည်',
    s4HighlightText:
      'ကျုံ့ပြီးတိုင်း ကြွက်သားများကို လုံးဝဖြေလျှော့ပါ။ ကောင်းမွန်သော ပြန်လည်ကျန်းမာစေရေးသည် ပေရီနီယမ်ကို တစ်နေ့လုံး ကျုံ့ထားခြင်း မဟုတ်ပါ။',

    s5Heading: 'အဆင့်ဆင့် လေ့ကျင့်ခြင်း အစီအစဉ် တည်ဆောက်ခြင်း',
    s5Body1:
      'အစပိုင်းတွင် အရေးအကြီးဆုံးမှာ ကြွက်သားများကို သိရှိပြီး လှုပ်ရှားမှုကို မှန်ကန်စွာ ပြုလုပ်တတ်အောင် သင်ယူခြင်းဖြစ်သည်။ ပြင်းထန်မှုထက် ဆက်တိုက်ပြုလုပ်ခြင်းက ပိုအရေးကြီးသည်။',
    s5h3a: 'ကြာရှည်ကျုံ့ခြင်းများ',
    s5Body2:
      'တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို ညင်သာစွာ ကျုံ့ပြီး အသက်ရှူရပ်မထားဘဲ စက္ကန့်အနည်းငယ်ကြာ ကျုံ့ထားပါ။ ထို့နောက် ထပ်မစတင်မီ လုံးဝ လွှတ်ပေးပါ။',
    s5h3b: 'တိုတောင်းသော ကျုံ့ခြင်းများ',
    s5Body3:
      'လှုပ်ရှားမှုကို ကျွမ်းကျင်လာပြီဆိုလျှင် မြန်ဆန်သော ကျုံ့ခြင်းငယ်များကို ထပ်ထည့်နိုင်သည်။ ၎င်းတို့သည် ဥပမာ ချောင်းဆိုးခြင်း သို့မဟုတ် နှာချေခြင်းမတိုင်မီကဲ့သို့ ဝမ်းဗိုက်ဖိအား တိုးလာသည့်အခါ ကြွက်သားများကို လျင်မြန်စွာ ကျုံ့နိုင်စွမ်းကို လေ့ကျင့်ပေးသည်။',
    dailyTips: [
      {icon: 'clock-outline', label: 'လေ့ကျင့်ခန်းများကို နေ့စဉ်အကျင့်တစ်ခုနှင့် တွဲပါ'},
      {icon: 'human-sitting', label: 'သက်တောင့်သက်သာရှိသော ပုံစံဖြင့် စတင်ပါ'},
      {icon: 'weather-windy', label: 'ကျုံ့စဉ် အသက်ကို ပုံမှန်ရှူပါ'},
      {icon: 'sleep', label: 'ဖြေလျှော့သည့် အဆင့်များကို လေးစားလိုက်နာပါ'},
      {icon: 'chart-line', label: 'ခက်ခဲမှုကို တဖြည်းဖြည်း တိုးပါ'},
      {icon: 'doctor', label: 'မသေချာလျှင် အကြံဉာဏ်တောင်းပါ'},
    ],
    s5TipTitle: 'ဆက်တိုက်ပြုလုပ်ခြင်းက အဓိက',
    s5TipText:
      'လေ့ကျင့်ခန်းများကို သင့်နေ့စဉ်တွင် ပါဝင်ပြီးသား အကျင့်တစ်ခုနှင့် တွဲခြင်းသည် ဆက်တိုက်ပြုလုပ်ရန် ပိုလွယ်စေနိုင်သည်။ ဥပမာ နို့တိုက်ပြီးနောက်၊ သွားတိုက်ပြီးနောက် သို့မဟုတ် သင့်အတွက် သင့်တော်သည့် အခြားအချိန်တစ်ခုတွင် ပြုလုပ်နိုင်သည်။',

    s6Heading: 'ရှောင်ရှားသင့်သော အဖြစ်များသည့် အမှားများ',
    s6Body1:
      'ပေရီနီယမ်လေ့ကျင့်ခန်းများသည် ရိုးရှင်းသယောင်ရှိသော်လည်း အခြားကြွက်သားများဖြင့် အစားထိုးမိရန် သို့မဟုတ် အလွန်အကျွံ ဖိမိရန် လွယ်ကူသည်။',
    commonMistakes: [
      'တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားအစား တင်ပါးများ သို့မဟုတ် ပေါင်များကို ကြွက်သားတင်းခြင်း',
      'ကျုံ့စဉ် အသက်ရှူရပ်ထားခြင်း',
      'ကြွက်သားများကို ဖြေလျှော့ခွင့်မပေးဘဲ အမြဲကျုံ့ထားခြင်း',
      'လေ့ကျင့်ခန်းများကို ရက်အနည်းငယ်သာလုပ်ပြီး ရပ်လိုက်ခြင်း',
      'ကျုံ့မှု မှန်မမှန်စစ်ရန် ဆီးစီးဆင်းမှုကို ရည်ရွယ်ချက်ရှိရှိ ရပ်ခြင်း',
    ],
    s6TipTitle: 'မလုပ်သင့်သည့်အရာ',
    s6TipText:
      'ဆီးစီးဆင်းမှုကို ရည်ရွယ်ချက်ရှိရှိ ရပ်ခြင်းဖြင့် လေ့ကျင့်ခန်းလုပ်ရန် အကြံမပြုပါ။ ဤနည်းလမ်းသည် ပေရီနီယမ်ကို မှန်ကန်စွာ မလေ့ကျင့်ပေးသည့်အပြင် ဆီးအိတ်၏ ပုံမှန်လုပ်ငန်းဆောင်တာကို ထိခိုက်စေနိုင်သည်။',

    s7Heading: 'မည်သည့် ရောဂါလက္ခဏာများက ဆရာဝန်နှင့် ပြသရန် တိုက်တွန်းသနည်း။',
    s7Body1:
      'ကလေးမွေးဖွားပြီးနောက် ဆီးယိုစိမ့်ခြင်းအနည်းငယ် သို့မဟုတ် ထူးဆန်းသော ခံစားချက်တစ်ခု တခါတရံ ပေါ်လာနိုင်သည်။ သို့သော် ၎င်းတို့ ဆက်ရှိနေလျှင်၊ ပိုဆိုးလာလျှင် သို့မဟုတ် နေ့စဉ်ဘဝကို အနှောင့်အယှက်ဖြစ်စေလျှင် လျစ်လျူမရှုသင့်ပါ။',
    warningSigns: [
      'ချောင်းဆိုးချိန်၊ နှာချေချိန်၊ ရယ်မောချိန် သို့မဟုတ် အားသုံးချိန်တွင် ဆီးယိုစိမ့်ခြင်း',
      'တင်ပါးဆုံအောက်ပိုင်းတွင် လေးလံသော ခံစားချက် သို့မဟုတ် ဖိအားခံစားရခြင်း',
      'ဖောင်းကားမှု သို့မဟုတ် တစ်စုံတစ်ရာသည် မီးယပ်လမ်းကြောင်းထဲသို့ ကျဆင်းနေသည့် ခံစားချက်',
      'ဂတ်စ် သို့မဟုတ် ဝမ်းကို ထိန်းထားရန် ခက်ခဲခြင်း',
      'ပေရီနီယမ်တွင် ဆက်လက်နာကျင်ခြင်း',
      'လိင်ဆက်ဆံစဉ် သို့မဟုတ် ဆက်ဆံပြီးနောက် နာကျင်ခြင်း',
      'ပေရီနီယမ်ကြွက်သားများကို သိရှိရန် သို့မဟုတ် မှန်ကန်စွာ ကျုံ့ရန် ခက်ခဲခြင်း',
    ],
    consultLabel: 'အကြံဉာဏ်ကို ဘယ်အချိန်တောင်းသင့်သလဲ။',
    s7Body2:
      'တင်ပါးဆုံအောက်ပိုင်း ပြန်လည်ကျန်းမာစေရေးတွင် အထူးပြုသော သားဖွားဆရာမ၊ ဆရာဝန် သို့မဟုတ် ကိုယ်ခန္ဓာကုထုံးပညာရှင်က ကြွက်သားလုပ်ငန်းဆောင်တာကို စစ်ဆေးပြီး သင့်လျော်သော အစီအစဉ်တစ်ခုကို အကြံပြုနိုင်သည်။',

    s8Heading: 'အရေပြားပြဲခြင်း၊ ပေရီနီယမ်ခွဲစိတ်ခြင်း သို့မဟုတ် ခွဲစိတ်မွေးဖွားခြင်းပြီးနောက်ကော။',
    s8Body1:
      'အရေပြားပြဲခြင်း သို့မဟုတ် ပေရီနီယမ်ခွဲစိတ်ခြင်းသည် ကျက်စဉ်အတွင်း အထူးဂရုစိုက်မှု လိုအပ်သည်။ လှုပ်ရှားမှုများ ပြန်စရာတွင် နာကျင်မှု၊ အမာရွတ်၏ အခြေအနေနှင့် မွေးဖွားပြီးနောက် ပေးထားသော လမ်းညွှန်ချက်တို့ကို ထည့်သွင်းစဉ်းစားသင့်သည်။',
    s8Body2:
      'ခွဲစိတ်မွေးဖွားပြီးနောက် ပြန်လည်ကောင်းမွန်ခြင်းတွင် ဝမ်းဗိုက်နံရံနှင့် အမာရွတ်လည်း ပါဝင်သည်။ မီးယပ်လမ်းကြောင်းမှ မမွေးဖွားခဲ့သော်လည်း ကိုယ်ဝန်ဆောင်ခြင်းကိုယ်တိုင်က တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို ဖိအားပေးခဲ့သည်။',
    s8HighlightTitle: 'ကိုယ်ပိုင်ဂရုစိုက်မှုက ကူညီနိုင်သည်',
    s8HighlightText:
      'သိသာသော အရေပြားပြဲခြင်း၊ နာကျင်ခြင်း၊ ဆီး သို့မဟုတ် အူလမ်းကြောင်းဆိုင်ရာ ရောဂါလက္ခဏာများ သို့မဟုတ် ဆက်လက်ရှိနေသော အခက်အခဲများရှိလျှင် ကျန်းမာရေးပညာရှင်နှင့် အကဲဖြတ်စစ်ဆေးခြင်းသည် အထူးအကျိုးရှိနိုင်သည်။',

    s9Heading: 'အားကစားကို တဖြည်းဖြည်း ပြန်စခြင်း',
    s9Body1:
      'ကလေးမွေးဖွားပြီးနောက် လှုပ်ရှားမှုကို ပြန်စခြင်းသည် အဆင့်ဆင့်ဖြစ်သင့်သည်။ လမ်းလျှောက်ခြင်းနှင့် ညင်သာသော လှုပ်ရှားမှုများကို သင်၏ ခံစားချက်အပေါ်မူတည်၍ ယေဘုယျအားဖြင့် ပြန်စနိုင်ပြီး ပြင်းထန်သော ထိခိုက်မှုရှိသည့် လှုပ်ရှားမှုများတွင် ပိုသတိထားရန် လိုအပ်သည်။',
    s9Body2:
      'ပြေးခြင်း၊ ခုန်ခြင်း သို့မဟုတ် အလွန်ပြင်းထန်သော လေ့ကျင့်ခန်းများ မပြန်စမီ တင်ပါးဆုံအောက်ပိုင်း ကြွက်သား၏ ပြန်လည်ကောင်းမွန်မှုကို အကဲဖြတ်ပြီး ရောဂါလက္ခဏာများကို ထည့်သွင်းစဉ်းစားခြင်းက အကောင်းဆုံးဖြစ်သည်။',
    s9AlertTitle: 'အဆင့်များကို အလျင်စလို မလုပ်ပါနှင့်',
    s9AlertText:
      'လေ့ကျင့်ခန်းလုပ်စဉ် သို့မဟုတ် လုပ်ပြီးနောက် ဆီးယိုစိမ့်ခြင်း၊ လေးလံသော ခံစားချက် သို့မဟုတ် နာကျင်ခြင်းတို့သည် ပြင်းထန်မှု မတိုးမီ နှေးပြီး အကြံဉာဏ်တောင်းသင့်ကြောင်း အချက်ပြချက်များ ဖြစ်သည်။',

    s10Heading: 'အထူးကုနှင့် ဘယ်အချိန်ပြသင့်သလဲ။',
    s10Body1:
      'မှန်ကန်စွာ ကျုံ့နေသလား မသေချာလျှင်၊ ရောဂါလက္ခဏာများ ဆက်ရှိနေလျှင် သို့မဟုတ် ကိုယ်ကျိုးကျေးဇူးအတွက် ယုံကြည်စိတ်ချစွာ ကာယလှုပ်ရှားမှုအချို့ ပြန်စလိုလျှင် သားဖွားဆရာမ သို့မဟုတ် ကိုယ်ခန္ဓာကုထုံးပညာရှင်နှင့် တင်ပါးဆုံအောက်ပိုင်း ပြန်လည်ကျန်းမာစေရေး လေ့ကျင့်ခြင်းသည် အကျိုးရှိနိုင်သည်။',
    questionCardTitle: 'မေးသင့်သော အသုံးဝင်သည့် မေးခွန်းများ',
    appointmentQuestions: [
      'ကျွန်မ၏ ရောဂါလက္ခဏာများသည် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားအားနည်းခြင်းနှင့် ကိုက်ညီပါသလား။',
      'ကျွန်မ ကျုံ့ခြင်းများကို မှန်ကန်စွာ လုပ်နေပါသလား။',
      'တစ်နေ့လျှင် အကြိမ်မည်မျှ ပြန်လုပ်သင့်ပါသလဲ။',
      'ပြေးခြင်း၊ အားကစား သို့မဟုတ် ပြင်းထန်သော ထိခိုက်မှုရှိသည့် လေ့ကျင့်ခန်းသို့ ပြန်သွားနိုင်ပါသလား။',
      'သားဖွားဆရာမ သို့မဟုတ် ကိုယ်ခန္ဓာကုထုံးပညာရှင်နှင့် ပြန်လည်ကျန်းမာစေရေး လေ့ကျင့်ရန် လိုအပ်ပါသလား။',
      'ကျွန်မ၏ အမာရွတ်၊ အရေပြားပြဲခြင်း သို့မဟုတ် ခွဲစိတ်မွေးဖွားခြင်းအတွက် အထူးကြိုတင်ကာကွယ်မှု လိုအပ်ပါသလား။',
    ],
    s10TipTitle: 'သိထားသင့်သည်',
    s10TipText:
      'ပညာရှင်နှင့် ပြသခြင်းသည် တစ်စုံတစ်ရာမှားနေသည်ဟု မဆိုလိုပါ။ အစည်းအဝေးတစ်ခုသည် သင်၏ နည်းစနစ်ကို စစ်ဆေးရန်၊ ပြန်လည်ကောင်းမွန်မှုကို အကဲဖြတ်ရန်နှင့် မှန်ကန်စွာ တိုးတက်ရန် သင်ယူရန် ကူညီနိုင်သည်။',

    s11Heading: 'အချိန်ယူရသော ပြန်လည်ကောင်းမွန်ခြင်း',
    s11Body1:
      'ကလေးမွေးပြီးနောက် ကိုယ်ဝန်မဆောင်မီက ရှိခဲ့သည့် ခံစားမှု သို့မဟုတ် ကြွက်သားခွန်အားကို ချက်ချင်း ပြန်မရခြင်းသည် ပုံမှန်ဖြစ်သည်။',
    s11Body2:
      'ရည်ရွယ်ချက်မှာ တတ်နိုင်သမျှ ကျုံ့ခြင်းအကြိမ်ရေ များများလုပ်ရန် မဟုတ်ပါ။ ကျုံ့ခြင်းနှင့် ဖြေလျှော့ခြင်းကြား ကောင်းမွန်သော ညှိနှိုင်းမှုကို တဖြည်းဖြည်း ပြန်လည်ရရှိပြီး နောက်ပိုင်း နေ့စဉ်လုပ်ငန်းများတွင် ဤကြွက်သားများကို သဘာဝကျကျ အသုံးပြုနိုင်ရန် ပိုဆိုင်သည်။',
    s11HighlightTitle: 'တိုးတက်မှုအနည်းငယ်သည်လည်း စစ်မှန်သော တိုးတက်မှုဖြစ်သည်',
    s11HighlightText:
      'လှုပ်ရှားမှုကို ပိုမိုသတိထားမိခြင်း၊ ကျုံ့ချိန် စက္ကန့်အနည်းငယ် ပိုကြာလာခြင်း သို့မဟုတ် ဆီးယိုစိမ့်ခြင်း လျော့နည်းလာခြင်းတို့သည် အားတက်စရာ အချက်ပြချက်များ ဖြစ်ပြီးဖြစ်သည်။',

    s12Heading: 'အဓိကအချက်များ',
    summaryTitle: 'မရှိမဖြစ်အချက်များ',
    summaryItems: [
      'ကိုယ်ဝန်ဆောင်ခြင်းနှင့် ကလေးမွေးဖွားခြင်းသည် တင်ပါးဆုံအောက်ပိုင်း ကြွက်သားကို သိသာစွာ ဖိအားပေးသည်။',
      'မွေးဖွားပြီးနောက် တဖြည်းဖြည်း ပြန်လည်ကောင်းမွန်ခြင်းသည် ပုံမှန်ဖြစ်သည်။',
      'လေ့ကျင့်ခန်းများတွင် ခွန်အားထက် လှုပ်ရှားမှု အရည်အသွေးကို ဦးစားပေးသင့်သည်။',
      'အသက်ရှူခြင်းနှင့် ဖြေလျှော့ခြင်းသည် ကျုံ့ခြင်းလောက်ပင် အရေးကြီးသည်။',
      'ဆီးယိုစိမ့်ခြင်း၊ လေးလံသော ခံစားချက် သို့မဟုတ် ဆက်လက်နာကျင်ခြင်းတို့သည် ပညာရှင်၏ ထင်မြင်ချက်ကို ရထိုက်သည်။',
      'သားဖွားဆရာမ သို့မဟုတ် ကိုယ်ခန္ဓာကုထုံးပညာရှင်နှင့် ပြန်လည်ကျန်းမာစေရေး လေ့ကျင့်ခြင်းသည် ထိန်းချုပ်နိုင်မှုကို ပိုမိုပြန်လည်ရရှိစေရန် ကူညီနိုင်သည်။',
      'အားကစားသို့ ပြန်သွားခြင်းသည် အထူးသဖြင့် ပြင်းထန်သော ထိခိုက်မှုရှိသည့် လှုပ်ရှားမှုများတွင် အဆင့်ဆင့်ဖြစ်သင့်သည်။',
    ],

    finalTipTitle: 'ပြန်လည်ကောင်းမွန်ရန် အချိန်ယူပါ',
    finalTipText:
      'ကလေးမွေးဖွားပြီးနောက် သင့်ခန္ဓာကိုယ်သည် အပြောင်းအလဲများစွာ ကြုံတွေ့ခဲ့ပြီးဖြစ်သည်။ ပေရီနီယမ်သည် သင့်ခန္ဓာကိုယ်၏ အခြားအစိတ်အပိုင်းများကဲ့သို့ပင် ဂရုစိုက်မှုကို ရထိုက်သည်။ တဖြည်းဖြည်း၊ ပုံမှန်နှင့် ဖိအားမပေးဘဲ ဂရုစိုက်ပါ။',

    disclaimerText:
      'ဤဆောင်းပါးသည် အချက်အလက်ပေးရန်သာဖြစ်ပြီး ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ နာကျင်မှု၊ ဆက်လက်ရှိနေသော ရောဂါလက္ခဏာများ သို့မဟုတ် သင်၏ ပြန်လည်ကောင်းမွန်မှုနှင့်ပတ်သက်၍ စိုးရိမ်စရာရှိလျှင် ကျန်းမာရေးပညာရှင်၏ အကြံဉာဏ်ကို ရယူပါ။',
  },
  km: {
    badge: 'ក្រោយសម្រាលកូន • ការជាសះស្បើយ',
    title: 'ការពង្រឹងសាច់ដុំជាន់អាងត្រគាក\nក្រោយសម្រាលកូន',
    metaDuration: 'អាន 8 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro:
      'ក្រោយការមានផ្ទៃពោះ និងការសម្រាលកូន សាច់ដុំជាន់អាងត្រគាកត្រូវការពេលដើម្បីជាសះស្បើយ។ លំហាត់ងាយៗ ធ្វើឱ្យទៀងទាត់ និងបន្តិចម្តងៗ អាចជួយឱ្យអ្នកទទួលបានកម្លាំង ការគ្រប់គ្រង និងទំនុកចិត្តឡើងវិញ ដោយមិនចាំបាច់ប្រញាប់ប្រញាល់។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការយល់ដឹងអំពីតួនាទីរបស់ប៉េរីណេ',
      'ហេតុអ្វីការសម្រាលកូនធ្វើឱ្យវាត្រូវសង្កត់សង្កិន',
      'ពេលណាគួរចាប់ផ្តើមស្តារសាច់ដុំជាន់អាងត្រគាក',
      'រៀនកន្ត្រាក់សាច់ដុំឱ្យបានត្រឹមត្រូវ',
      'បង្កើតទម្លាប់ប្រចាំថ្ងៃបន្តិចម្តងៗ',
      'កំហុសដែលគួរជៀសវាង',
      'ពេលណាគួរស្វែងរកជំនួយ',
      'ការត្រឡប់ទៅលេងកីឡាបន្តិចម្តងៗ',
      'ការរៀបចំសម្រាប់ការណាត់ជួប',
      'ចំណុចសំខាន់ៗ',
    ],
    shareMessage: 'ការពង្រឹងសាច់ដុំជាន់អាងត្រគាកក្រោយសម្រាលកូន — AWA',

    s1Heading: 'ការយល់ដឹងអំពីតួនាទីរបស់ប៉េរីណេ',
    s1Body1:
      'ប៉េរីណេ ឬហៅថាសាច់ដុំជាន់អាងត្រគាក គឺជាក្រុមសាច់ដុំដែលស្ថិតនៅមូលដ្ឋានអាងត្រគាក។ វាមានតួនាទីក្នុងការគ្រប់គ្រងប្លោកនោម និងពោះវៀន ហើយជួយទ្រសរីរាង្គក្នុងអាងត្រគាក។',
    s1Body2:
      'ក្នុងអំឡុងពេលមានផ្ទៃពោះ សាច់ដុំទាំងនេះត្រូវទ្រទម្ងន់បន្ថែមអស់ជាច្រើនខែ។ វាក៏ត្រូវសង្កត់សង្កិនខ្លាំងក្នុងអំឡុងពេលសម្រាលកូនផងដែរ។',
    s1HighlightTitle: 'សាច់ដុំដែលមិនសូវលេចធ្លោ ប៉ុន្តែចាំបាច់',
    s1HighlightText:
      'សាច់ដុំជាន់អាងត្រគាកពាក់ព័ន្ធនឹងមុខងារប្រចាំថ្ងៃជាច្រើន៖ ការទប់ទឹកនោម និងលាមក ការគ្រប់គ្រងខ្យល់ ការទ្រសរីរាង្គក្នុងអាងត្រគាក និងមានតួនាទីក្នុងមុខងារផ្លូវភេទមួយចំនួន។',

    benefitsHeading: 'អត្ថប្រយោជន៍នៃសាច់ដុំជាន់អាងត្រគាកដែលរឹងមាំជាងមុន',
    benefitsIntro:
      'ការពង្រឹងបន្តិចម្តងៗ និងធ្វើបានត្រឹមត្រូវ អាចជួយកែលម្អការគ្រប់គ្រង និងការទ្រសរីរាង្គក្នុងអាងត្រគាក។',
    benefits: [
      {
        icon: 'water-outline',
        title: 'គ្រប់គ្រងប្លោកនោមបានប្រសើរជាងមុន',
        text: 'សាច់ដុំជាន់អាងត្រគាកមានតួនាទីក្នុងការគ្រប់គ្រងប្លោកនោម។ ការពង្រឹងវាបន្តិចម្តងៗ អាចជួយកាត់បន្ថយការហូរចេញនៃទឹកនោមមួយចំនួន។',
      },
      {
        icon: 'toilet',
        title: 'គាំទ្រដល់មុខងារពោះវៀន',
        text: 'សាច់ដុំទាំងនេះក៏ជួយគ្រប់គ្រងខ្យល់ និងលាមក ហើយជួយទ្រសរីរាង្គក្នុងអាងត្រគាកផងដែរ។',
      },
      {
        icon: 'human-female',
        title: 'ទ្រសរីរាង្គក្នុងអាងត្រគាក',
        text: 'សាច់ដុំជាន់អាងត្រគាកបង្កើតជាមូលដ្ឋានសាច់ដុំពិតប្រាកដ ដែលជួយទ្រប្លោកនោម ស្បូន និងពោះវៀន។',
      },
      {
        icon: 'heart-pulse',
        title: 'ទទួលបានអារម្មណ៍វិញបន្តិចម្តងៗ',
        text: 'ការស្តារដែលសមស្រប ក៏អាចជួយឱ្យអ្នកដឹងខ្លួន និងគ្រប់គ្រងតំបន់នេះបានប្រសើរឡើងវិញដែរ។',
      },
    ],

    s2Heading: 'ហេតុអ្វីការមានផ្ទៃពោះ និងការសម្រាលកូនធ្វើឱ្យវាត្រូវសង្កត់សង្កិន',
    s2Body1:
      'ការមានផ្ទៃពោះបន្ថែមសម្ពាធលើសាច់ដុំជាន់អាងត្រគាកបន្តិចម្តងៗ។ បន្ទាប់មក ការសម្រាលកូនតាមទ្វារមាសអាចធ្វើឱ្យសាច់ដុំ និងជាលិកានៅតំបន់នេះលាតសន្ធឹងយ៉ាងខ្លាំង។',
    s2Body2:
      'ការវះកាត់សម្រាលកូនក៏មិនបានការពារសាច់ដុំជាន់អាងត្រគាកទាំងស្រុងដែរ៖ ការមានផ្ទៃពោះផ្ទាល់ គឺជាអំឡុងពេលដ៏សំខាន់សម្រាប់សាច់ដុំទាំងនេះ។',
    s2Body3:
      'ដូច្នេះ ក្រោយសម្រាលកូន គឺជារឿងធម្មតាដែលការជាសះស្បើយត្រូវការពេល។ ស្ត្រីខ្លះស្ទើរតែមិនមានរោគសញ្ញា ខណៈពេលដែលអ្នកផ្សេងទៀតអាចកត់សម្គាល់ឃើញការហូរចេញនៃទឹកនោម អារម្មណ៍ធ្ងន់ ឬការគ្រប់គ្រងសាច់ដុំថយចុះ។',
    s2TipTitle: 'ការជាសះស្បើយរបស់មនុស្សម្នាក់ៗខុសគ្នា',
    s2TipText:
      'ប្រភេទនៃការសម្រាលកូន ការរហែក ឬការកាត់ប៉េរីណេ វត្តមាននៃការឈឺចាប់ និងស្ថានភាពទូទៅរបស់អ្នកក្រោយសម្រាល អាចជះឥទ្ធិពលដល់ការជាសះស្បើយទាំងអស់។',

    s3Heading: 'ពេលណាគួរចាប់ផ្តើមស្តារសាច់ដុំជាន់អាងត្រគាក?',
    s3Body1:
      'ក្រោយការសម្រាលកូនដោយគ្មានផលវិបាក ជាទូទៅអាចចាប់ផ្តើមកន្ត្រាក់សាច់ដុំជាន់អាងត្រគាកថ្នមៗឡើងវិញបន្តិចម្តងៗ។ វានៅតែសំខាន់ក្នុងការកែសម្រួលលំហាត់ឱ្យសមនឹងស្ថានភាពរបស់អ្នក ហើយសូមសុំដំបូន្មាន ប្រសិនបើអ្នកមានផលវិបាក ឈឺខ្លាំង ឬបានទទួលនីតិវិធីពិសេសណាមួយ។',
    s3Body2:
      'ប្រសិនបើអ្នកមានបំពង់បង្ហូរទឹកនោម ការណែនាំខ្លះបង្ហាញថាគួររង់ចាំរហូតដល់ដកវាចេញ ហើយការនោមត្រឡប់មកធម្មតាវិញ មុននឹងចាប់ផ្តើមលំហាត់ប៉េរីណេ។',
    s3AlertTitle: 'កុំបង្ខំខ្លួនពេលឈឺចាប់',
    s3AlertText:
      'ការឈឺខ្លាំង រោគសញ្ញាកាន់តែអាក្រក់ ដំបៅដែលជាសះស្បើយមិនល្អ ឬក្តីបារម្ភណាមួយ គួរសុំដំបូន្មានពីឆ្មប វេជ្ជបណ្ឌិត ឬអ្នកជំនាញស្តារសមត្ថភាព។',

    s4Heading: 'រៀនកន្ត្រាក់សាច់ដុំឱ្យបានត្រឹមត្រូវ',
    s4Body1:
      'ដើម្បីស្គាល់ចលនានេះ សូមស្រមៃថាអ្នកកំពុងព្យាយាមទប់ខ្យល់ និងចង់នោមក្នុងពេលតែមួយ។ ចលនាដែលអ្នកកំពុងរកគឺជាអារម្មណ៍នៃការកន្ត្រាក់ និងការលើកឡើងទៅខាងក្នុង។',
    s4Body2:
      'គោលបំណងមិនមែនដើម្បីតឹងរាងកាយទាំងមូលទេ។ គួរទុកគូទ ភ្លៅ និងសាច់ដុំពោះឱ្យរលាកស្រាលតាមដែលអាចធ្វើទៅបាន ខណៈពេលដែលដកដង្ហើមដូចធម្មតា។',
    exercises: [
      {icon: 'weather-windy', label: 'ការដកដង្ហើម'},
      {icon: 'human-handsup', label: 'ការកន្ត្រាក់ថ្នមៗ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ការកន្ត្រាក់យូរ'},
      {icon: 'gesture-tap-button', label: 'ការកន្ត្រាក់លឿនៗ'},
    ],
    s4HighlightTitle: 'ការបន្ធូរក៏សំខាន់ដូចគ្នា',
    s4HighlightText:
      'បន្ទាប់ពីការកន្ត្រាក់នីមួយៗ សូមទុកឱ្យសាច់ដុំបន្ធូរទាំងស្រុង។ ការស្តារសមត្ថភាពដែលល្អ មិនមែនមានន័យថាត្រូវកន្ត្រាក់ប៉េរីណេពេញមួយថ្ងៃទេ។',

    s5Heading: 'បង្កើតទម្លាប់ប្រចាំថ្ងៃបន្តិចម្តងៗ',
    s5Body1:
      'នៅដំបូង រឿងសំខាន់បំផុតគឺរៀនស្គាល់សាច់ដុំ និងធ្វើចលនាឱ្យបានត្រឹមត្រូវ។ ភាពទៀងទាត់សំខាន់ជាងភាពខ្លាំង។',
    s5h3a: 'ការកន្ត្រាក់យូរ',
    s5Body2:
      'កន្ត្រាក់សាច់ដុំជាន់អាងត្រគាកថ្នមៗ បន្ទាប់មកទប់ការកន្ត្រាក់រយៈពេលពីរបីវិនាទី ដោយមិនទប់ដង្ហើម។ បន្ទាប់មកបន្ធូរទាំងស្រុង មុននឹងចាប់ផ្តើមម្តងទៀត។',
    s5h3b: 'ការកន្ត្រាក់ខ្លី',
    s5Body3:
      'នៅពេលស្ទាត់ចលនាហើយ អាចបន្ថែមការកន្ត្រាក់តូចៗលឿនៗ។ វាជួយហ្វឹកហ្វឺនសមត្ថភាពក្នុងការកន្ត្រាក់សាច់ដុំយ៉ាងលឿននៅពេលសម្ពាធក្នុងពោះកើនឡើង ឧទាហរណ៍ មុនពេលក្អក ឬកណ្តាស់។',
    dailyTips: [
      {icon: 'clock-outline', label: 'ភ្ជាប់លំហាត់ជាមួយទម្លាប់ប្រចាំថ្ងៃ'},
      {icon: 'human-sitting', label: 'ចាប់ផ្តើមក្នុងឥរិយាបថដែលស្រួល'},
      {icon: 'weather-windy', label: 'ដកដង្ហើមធម្មតាក្នុងអំឡុងពេលកន្ត្រាក់'},
      {icon: 'sleep', label: 'គោរពដំណាក់កាលបន្ធូរ'},
      {icon: 'chart-line', label: 'បង្កើនកម្រិតលំបាកបន្តិចម្តងៗ'},
      {icon: 'doctor', label: 'សុំដំបូន្មាន ប្រសិនបើអ្នកមិនច្បាស់'},
    ],
    s5TipTitle: 'ភាពទៀងទាត់មុនគេ',
    s5TipText:
      'ការភ្ជាប់លំហាត់ជាមួយទម្លាប់ដែលមានស្រាប់ក្នុងថ្ងៃរបស់អ្នក អាចជួយឱ្យធ្វើបានទៀងទាត់ងាយជាង៖ បន្ទាប់ពីបំបៅ បន្ទាប់ពីដុសធ្មេញ ឬនៅពេលផ្សេងទៀតដែលស័ក្តិសមនឹងអ្នក។',

    s6Heading: 'កំហុសទូទៅដែលគួរជៀសវាង',
    s6Body1:
      'លំហាត់ប៉េរីណេអាចមើលទៅងាយ ប៉ុន្តែងាយនឹងជំនួសដោយសាច់ដុំផ្សេង ឬខំខ្លាំងពេក។',
    commonMistakes: [
      'តឹងគូទ ឬភ្លៅ ជំនួសឱ្យសាច់ដុំជាន់អាងត្រគាក',
      'ទប់ដង្ហើមក្នុងអំឡុងពេលកន្ត្រាក់',
      'ទុកសាច់ដុំឱ្យកន្ត្រាក់ជាប់ជានិច្ច ដោយមិនទុកឱ្យវាបន្ធូរ',
      'ធ្វើលំហាត់តែពីរបីថ្ងៃ ហើយបន្ទាប់មកឈប់',
      'ទប់ទឹកនោមដោយចេតនា ដើម្បីពិនិត្យការកន្ត្រាក់',
    ],
    s6TipTitle: 'អ្វីដែលមិនគួរធ្វើ',
    s6TipText:
      'មិនណែនាំឱ្យអនុវត្តលំហាត់ដោយទប់ទឹកនោមដោយចេតនាទេ។ វិធីនេះមិនហ្វឹកហ្វឺនប៉េរីណេបានត្រឹមត្រូវ ហើយអាចរំខានដល់មុខងារប្លោកនោមធម្មតា។',

    s7Heading: 'រោគសញ្ញាអ្វីខ្លះដែលគួរទៅពិគ្រោះ?',
    s7Body1:
      'ការហូរចេញនៃទឹកនោមបន្តិចបន្តួច ឬអារម្មណ៍មិនធម្មតា ពេលខ្លះអាចកើតមានក្រោយសម្រាលកូន។ ប៉ុន្តែមិនគួរមើលរំលងទេ ប្រសិនបើវាបន្ត កាន់តែអាក្រក់ ឬរំខានដល់ជីវិតប្រចាំថ្ងៃរបស់អ្នក។',
    warningSigns: [
      'ទឹកនោមហូរចេញពេលអ្នកក្អក កណ្តាស់ សើច ឬខំកម្លាំង',
      'អារម្មណ៍ធ្ងន់ ឬសម្ពាធនៅផ្នែកខាងក្រោមអាងត្រគាក',
      'អារម្មណ៍ថាមានដុំ ឬអ្វីមួយធ្លាក់ចូលក្នុងទ្វារមាស',
      'ពិបាកទប់ខ្យល់ ឬលាមក',
      'ឈឺជាប់រហូតនៅប៉េរីណេ',
      'ឈឺក្នុងអំឡុងពេល ឬក្រោយការរួមភេទ',
      'ពិបាកស្គាល់ ឬកន្ត្រាក់សាច់ដុំប៉េរីណេឱ្យបានត្រឹមត្រូវ',
    ],
    consultLabel: 'ពេលណាគួរសុំដំបូន្មាន?',
    s7Body2:
      'ឆ្មប វេជ្ជបណ្ឌិត ឬអ្នកព្យាបាលដោយចលនាដែលមានជំនាញស្តារសាច់ដុំជាន់អាងត្រគាក អាចពិនិត្យមុខងារសាច់ដុំ ហើយណែនាំកម្មវិធីដែលសមស្រប។',

    s8Heading: 'ចុះក្រោយការរហែក ការកាត់ប៉េរីណេ ឬការវះកាត់សម្រាលកូនវិញ?',
    s8Body1:
      'ការរហែក ឬការកាត់ប៉េរីណេ ត្រូវការការថែទាំពិសេសក្នុងអំឡុងពេលជាសះស្បើយ។ ការត្រឡប់ទៅធ្វើសកម្មភាពវិញ គួរគិតគូរពីការឈឺចាប់ ស្ថានភាពស្នាមដំបៅ និងការណែនាំដែលបានផ្តល់ក្រោយសម្រាលកូន។',
    s8Body2:
      'ក្រោយការវះកាត់សម្រាលកូន ការជាសះស្បើយក៏ពាក់ព័ន្ធនឹងជញ្ជាំងពោះ និងស្នាមវះដែរ។ ទោះបីជាការសម្រាលមិនមែនតាមទ្វារមាសក៏ដោយ ការមានផ្ទៃពោះផ្ទាល់ក៏នៅតែបង្កសម្ពាធលើសាច់ដុំជាន់អាងត្រគាកដែរ។',
    s8HighlightTitle: 'ការថែទាំតាមស្ថានភាពផ្ទាល់ខ្លួនអាចជួយបាន',
    s8HighlightText:
      'ក្នុងករណីរហែកខ្លាំង ឈឺចាប់ រោគសញ្ញាទាក់ទងនឹងទឹកនោម ឬពោះវៀន ឬការលំបាកដែលបន្ត ការវាយតម្លៃជាមួយអ្នកជំនាញសុខាភិបាលអាចមានប្រយោជន៍ជាពិសេស។',

    s9Heading: 'ការត្រឡប់ទៅលេងកីឡាបន្តិចម្តងៗ',
    s9Body1:
      'ការត្រឡប់ទៅធ្វើចលនាវិញក្រោយសម្រាលកូន គួរធ្វើបន្តិចម្តងៗ។ ការដើរ និងចលនាស្រាលៗ ជាទូទៅអាចត្រឡប់ទៅធ្វើវិញបានតាមអារម្មណ៍របស់អ្នក ខណៈពេលដែលសកម្មភាពដែលមានការប៉ះទង្គិចខ្លាំងត្រូវការប្រុងប្រយ័ត្នបន្ថែម។',
    s9Body2:
      'មុននឹងត្រឡប់ទៅរត់ លោត ឬហ្វឹកហាត់ខ្លាំងវិញ គួរវាយតម្លៃការជាសះស្បើយនៃសាច់ដុំជាន់អាងត្រគាក ហើយគិតគូរពីរោគសញ្ញាណាមួយ។',
    s9AlertTitle: 'កុំប្រញាប់ប្រញាល់ពេកក្នុងដំណាក់កាលនីមួយៗ',
    s9AlertText:
      'ការហូរចេញនៃទឹកនោម អារម្មណ៍ធ្ងន់ ឬការឈឺចាប់ក្នុងអំឡុងពេល ឬក្រោយលំហាត់ប្រាណ គឺជាសញ្ញាដែលអ្នកគួរបន្ថយល្បឿន ហើយសុំដំបូន្មានមុននឹងបង្កើនកម្រិតខ្លាំង។',

    s10Heading: 'ពេលណាគួរជួបអ្នកឯកទេស?',
    s10Body1:
      'ការស្តារសាច់ដុំជាន់អាងត្រគាកជាមួយឆ្មប ឬអ្នកព្យាបាលដោយចលនា អាចមានប្រយោជន៍ ប្រសិនបើអ្នកមិនប្រាកដថាកំពុងកន្ត្រាក់បានត្រឹមត្រូវ ប្រសិនបើរោគសញ្ញារបស់អ្នកបន្ត ឬប្រសិនបើអ្នកចង់ត្រឡប់ទៅធ្វើសកម្មភាពរាងកាយមួយចំនួនវិញដោយទំនុកចិត្ត។',
    questionCardTitle: 'សំណួរមានប្រយោជន៍ដែលអាចសួរ',
    appointmentQuestions: [
      'តើរោគសញ្ញារបស់ខ្ញុំស្របនឹងភាពខ្សោយនៃសាច់ដុំជាន់អាងត្រគាកឬទេ?',
      'តើខ្ញុំកំពុងកន្ត្រាក់បានត្រឹមត្រូវឬទេ?',
      'តើខ្ញុំគួរធ្វើប៉ុន្មានដងរាល់ថ្ងៃ?',
      'តើខ្ញុំអាចត្រឡប់ទៅរត់ លេងកីឡា ឬធ្វើលំហាត់ដែលមានការប៉ះទង្គិចខ្លាំងវិញបានឬទេ?',
      'តើខ្ញុំត្រូវការស្តារសមត្ថភាពជាមួយឆ្មប ឬអ្នកព្យាបាលដោយចលនាឬទេ?',
      'តើស្នាមដំបៅ ស្នាមរហែក ឬស្នាមវះសម្រាលកូនរបស់ខ្ញុំត្រូវការការប្រុងប្រយ័ត្នពិសេសអ្វីដែរឬទេ?',
    ],
    s10TipTitle: 'គួរដឹង',
    s10TipText:
      'ការជួបអ្នកជំនាញមិនចាំបាច់មានន័យថាមានរឿងមិនប្រក្រតីទេ។ វគ្គមួយអាចគ្រាន់តែជួយពិនិត្យបច្ចេកទេសរបស់អ្នក វាយតម្លៃការជាសះស្បើយ និងរៀនធ្វើឱ្យមានភាពប្រសើរឡើងបានត្រឹមត្រូវ។',

    s11Heading: 'ការជាសះស្បើយដែលត្រូវការពេល',
    s11Body1:
      'ក្រោយសម្រាលកូន គឺជារឿងធម្មតាដែលមិនទទួលបានអារម្មណ៍ ឬកម្លាំងសាច់ដុំដូចមុនការមានផ្ទៃពោះភ្លាមៗ។',
    s11Body2:
      'គោលបំណងមិនមែនដើម្បីកន្ត្រាក់ឱ្យបានច្រើនបំផុតតាមដែលអាចទេ។ វាគឺអំពីការទទួលបានការសម្របសម្រួលល្អរវាងការកន្ត្រាក់ និងការបន្ធូរឡើងវិញបន្តិចម្តងៗ ហើយបន្ទាប់មកអាចប្រើសាច់ដុំទាំងនេះដោយធម្មជាតិក្នុងសកម្មភាពប្រចាំថ្ងៃ។',
    s11HighlightTitle: 'វឌ្ឍនភាពតូចៗ គឺជាវឌ្ឍនភាពពិតប្រាកដ',
    s11HighlightText:
      'ការដឹងខ្លួនកាន់តែច្បាស់អំពីចលនា ការកន្ត្រាក់បានយូរជាងមុនពីរបីវិនាទី ឬការហូរចេញនៃទឹកនោមថយចុះ គឺជាសញ្ញាដែលលើកទឹកចិត្តរួចទៅហើយ។',

    s12Heading: 'ចំណុចសំខាន់ៗ',
    summaryTitle: 'សេចក្តីសង្ខេប',
    summaryItems: [
      'ការមានផ្ទៃពោះ និងការសម្រាលកូនបង្កសម្ពាធខ្លាំងលើសាច់ដុំជាន់អាងត្រគាក។',
      'ការជាសះស្បើយបន្តិចម្តងៗគឺជារឿងធម្មតាក្រោយសម្រាលកូន។',
      'លំហាត់គួរផ្តោតលើគុណភាពនៃចលនា ជាជាងកម្លាំង។',
      'ការដកដង្ហើម និងការបន្ធូរមានសារៈសំខាន់ដូចការកន្ត្រាក់ដែរ។',
      'ការហូរចេញនៃទឹកនោម អារម្មណ៍ធ្ងន់ ឬការឈឺជាប់រហូត គួរទទួលបានយោបល់ពីអ្នកជំនាញ។',
      'ការស្តារសមត្ថភាពជាមួយឆ្មប ឬអ្នកព្យាបាលដោយចលនា អាចជួយឱ្យអ្នកគ្រប់គ្រងបានប្រសើរឡើងវិញ។',
      'ការត្រឡប់ទៅលេងកីឡាវិញគួរធ្វើបន្តិចម្តងៗ ជាពិសេសសម្រាប់សកម្មភាពដែលមានការប៉ះទង្គិចខ្លាំង។',
    ],

    finalTipTitle: 'សូមចំណាយពេលដើម្បីជាសះស្បើយ',
    finalTipText:
      'ក្រោយសម្រាលកូន រាងកាយរបស់អ្នកបានឆ្លងកាត់ការផ្លាស់ប្តូរជាច្រើន។ ប៉េរីណេសមនឹងទទួលបានការយកចិត្តទុកដាក់ដូចផ្នែកផ្សេងទៀតនៃរាងកាយរបស់អ្នក៖ បន្តិចម្តងៗ ទៀងទាត់ និងដោយគ្មានសម្ពាធ។',

    disclaimerText:
      'អត្ថបទនេះមានគោលបំណងផ្តល់ព័ត៌មានតែប៉ុណ្ណោះ ហើយមិនជំនួសដំបូន្មានវេជ្ជសាស្ត្រតាមស្ថានភាពផ្ទាល់ខ្លួនទេ។ ប្រសិនបើអ្នកមានការឈឺចាប់ រោគសញ្ញាដែលបន្ត ឬមានក្តីបារម្ភអំពីការជាសះស្បើយរបស់អ្នក សូមសុំដំបូន្មានពីអ្នកជំនាញសុខាភិបាល។',
  },
  lo: {
    badge: 'ຫຼັງຄອດ • ການຟື້ນຕົວ',
    title: 'ການເສີມສ້າງກ້າມເນື້ອພື້ນຊານ\nຫຼັງການເກີດລູກ',
    metaDuration: 'ອ່ານ 8 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro:
      'ຫຼັງການຖືພາ ແລະ ການເກີດລູກ ກ້າມເນື້ອພື້ນຊານຕ້ອງການເວລາເພື່ອຟື້ນຕົວ. ການອອກກຳລັງກາຍແບບງ່າຍໆ ສະໝ່ຳສະເໝີ ແລະ ເທື່ອລະກ້າວ ສາມາດຊ່ວຍໃຫ້ທ່ານກັບມາມີແຮງ ມີການຄວບຄຸມ ແລະ ມີຄວາມໝັ້ນໃຈ ໂດຍບໍ່ຕ້ອງຮີບຮ້ອນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເຂົ້າໃຈບົດບາດຂອງກ້າມເນື້ອພື້ນຊານ',
      'ເປັນຫຍັງການເກີດລູກຈຶ່ງເຮັດໃຫ້ມັນຖືກກົດດັນ',
      'ເວລາໃດຄວນເລີ່ມການຟື້ນຟູກ້າມເນື້ອພື້ນຊານ',
      'ການຮຽນຮູ້ວິທີບີບຕົວໃຫ້ຖືກຕ້ອງ',
      'ການສ້າງກິດຈະວັດແບບເທື່ອລະກ້າວ',
      'ຂໍ້ຜິດພາດທີ່ຄວນຫຼີກເວັ້ນ',
      'ເວລາໃດຄວນຂໍຄວາມຊ່ວຍເຫຼືອ',
      'ການກັບມາອອກກຳລັງກາຍເທື່ອລະກ້າວ',
      'ການກຽມຕົວສຳລັບການນັດພົບແພດ',
      'ຈຸດສຳຄັນ',
    ],
    shareMessage: 'ການເສີມສ້າງກ້າມເນື້ອພື້ນຊານຫຼັງການເກີດລູກ — AWA',

    s1Heading: 'ເຂົ້າໃຈບົດບາດຂອງກ້າມເນື້ອພື້ນຊານ',
    s1Body1:
      'ກ້າມເນື້ອພື້ນຊານ ຫຼື ເປີຣີນຽມ ແມ່ນກຸ່ມກ້າມເນື້ອທີ່ຢູ່ທາງລຸ່ມຂອງອຸ້ງເຄົ້າ. ມັນມີບົດບາດໃນການຄວບຄຸມກະເພາະປັດສະວະ ແລະ ລຳໄສ້ ແລະ ຊ່ວຍຮອງຮັບອະໄວຍະວະໃນອຸ້ງເຄົ້າ.',
    s1Body2:
      'ໃນໄລຍະຖືພາ ກ້າມເນື້ອເຫຼົ່ານີ້ຕ້ອງຮັບນ້ຳໜັກເພີ່ມເປັນເວລາຫຼາຍເດືອນ. ມັນຍັງຖືກກົດດັນຢ່າງຫຼາຍໃນລະຫວ່າງການເກີດລູກອີກດ້ວຍ.',
    s1HighlightTitle: 'ກ້າມເນື້ອທີ່ງຽບສະຫງົບແຕ່ສຳຄັນຫຼາຍ',
    s1HighlightText:
      'ກ້າມເນື້ອພື້ນຊານມີສ່ວນກ່ຽວຂ້ອງກັບຫຼາຍໜ້າທີ່ໃນຊີວິດປະຈຳວັນ: ກັ້ນປັດສະວະ ແລະ ອາຈົມ, ຄວບຄຸມລົມ, ຮອງຮັບອະໄວຍະວະໃນອຸ້ງເຄົ້າ ແລະ ມີບົດບາດໃນບາງໜ້າທີ່ທາງເພດ.',

    benefitsHeading: 'ປະໂຫຍດຂອງກ້າມເນື້ອພື້ນຊານທີ່ແຂງແຮງຂຶ້ນ',
    benefitsIntro:
      'ການເສີມສ້າງແບບເທື່ອລະກ້າວ ແລະ ເຮັດຖືກວິທີ ສາມາດຊ່ວຍປັບປຸງການຄວບຄຸມ ແລະ ການຮອງຮັບຂອງກ້າມເນື້ອພື້ນຊານ.',
    benefits: [
      {
        icon: 'water-outline',
        title: 'ຄວບຄຸມກະເພາະປັດສະວະໄດ້ດີຂຶ້ນ',
        text: 'ກ້າມເນື້ອພື້ນຊານມີບົດບາດໃນການຄວບຄຸມກະເພາະປັດສະວະ. ການເສີມສ້າງເທື່ອລະກ້າວອາດຊ່ວຍຫຼຸດການຮົ່ວຂອງປັດສະວະໄດ້ບາງກໍລະນີ.',
      },
      {
        icon: 'toilet',
        title: 'ຊ່ວຍການເຮັດວຽກຂອງລຳໄສ້',
        text: 'ກ້າມເນື້ອເຫຼົ່ານີ້ຍັງຊ່ວຍຄວບຄຸມລົມ ແລະ ອາຈົມ ແລະ ຊ່ວຍຮອງຮັບອະໄວຍະວະໃນອຸ້ງເຄົ້າ.',
      },
      {
        icon: 'human-female',
        title: 'ຮອງຮັບອະໄວຍະວະໃນອຸ້ງເຄົ້າ',
        text: 'ກ້າມເນື້ອພື້ນຊານເປັນຖານກ້າມເນື້ອທີ່ແທ້ຈິງ ທີ່ຊ່ວຍຮອງຮັບກະເພາະປັດສະວະ, ມົດລູກ ແລະ ລຳໄສ້.',
      },
      {
        icon: 'heart-pulse',
        title: 'ຄ່ອຍໆກັບມາມີຄວາມຮູ້ສຶກ',
        text: 'ການຟື້ນຟູທີ່ເໝາະສົມຍັງຊ່ວຍໃຫ້ທ່ານຮັບຮູ້ ແລະ ຄວບຄຸມບໍລິເວນນີ້ໄດ້ດີຂຶ້ນ.',
      },
    ],

    s2Heading: 'ເປັນຫຍັງການຖືພາ ແລະ ການເກີດລູກຈຶ່ງເຮັດໃຫ້ມັນຖືກກົດດັນ',
    s2Body1:
      'ການຖືພາຄ່ອຍໆເພີ່ມແຮງກົດດັນຕໍ່ກ້າມເນື້ອພື້ນຊານ. ການເກີດລູກທາງຊ່ອງຄອດອາດເຮັດໃຫ້ກ້າມເນື້ອ ແລະ ເນື້ອເຍື່ອໃນບໍລິເວນນີ້ຖືກຍືດອອກຫຼາຍ.',
    s2Body2:
      'ການຜ່າຕັດເອົາລູກອອກກໍບໍ່ໄດ້ຊ່ວຍປ້ອງກັນກ້າມເນື້ອພື້ນຊານໄດ້ທັງໝົດ: ການຖືພາເອງກໍເປັນໄລຍະສຳຄັນສຳລັບກ້າມເນື້ອເຫຼົ່ານີ້.',
    s2Body3:
      'ຫຼັງຄອດ ຈຶ່ງເປັນເລື່ອງປົກກະຕິທີ່ການຟື້ນຕົວຈະໃຊ້ເວລາ. ແມ່ຍິງບາງຄົນບໍ່ມີອາການເລີຍ ໃນຂະນະທີ່ບາງຄົນອາດສັງເກດເຫັນການຮົ່ວ, ຄວາມຮູ້ສຶກໜັກໆ ຫຼື ການຄວບຄຸມກ້າມເນື້ອທີ່ຫຼຸດລົງ.',
    s2TipTitle: 'ການຟື້ນຕົວຂອງແຕ່ລະຄົນບໍ່ຄືກັນ',
    s2TipText:
      'ຮູບແບບການເກີດລູກ, ການຂາດ ຫຼື ການຕັດຝີເຍັບ, ການມີຄວາມເຈັບປວດ ແລະ ສະພາບທົ່ວໄປຂອງທ່ານຫຼັງຄອດ ລ້ວນແຕ່ມີຜົນຕໍ່ການຟື້ນຕົວ.',

    s3Heading: 'ເວລາໃດຄວນເລີ່ມການຟື້ນຟູກ້າມເນື້ອພື້ນຊານ?',
    s3Body1:
      'ຫຼັງການເກີດລູກທີ່ບໍ່ມີອາການແຊກຊ້ອນ ໂດຍທົ່ວໄປສາມາດກັບມາບີບກ້າມເນື້ອພື້ນຊານເບົາໆໄດ້ເທື່ອລະກ້າວ. ຍັງຄົງສຳຄັນທີ່ຈະປັບການອອກກຳລັງກາຍໃຫ້ເໝາະກັບສະພາບຂອງທ່ານ ແລະ ຂໍຄຳແນະນຳຖ້າທ່ານມີອາການແຊກຊ້ອນ, ເຈັບຫຼາຍ ຫຼື ໄດ້ຮັບການຮັກສາພິເສດ.',
    s3Body2:
      'ຖ້າທ່ານໃສ່ສາຍສວນປັດສະວະ ບາງຄຳແນະນຳແນະນຳໃຫ້ລໍຖ້າຈົນກວ່າຈະຖອດອອກ ແລະ ຖ່າຍປັດສະວະໄດ້ຕາມປົກກະຕິກ່ອນເລີ່ມອອກກຳລັງກ້າມເນື້ອພື້ນຊານ.',
    s3AlertTitle: 'ຢ່າຝືນເມື່ອມີຄວາມເຈັບປວດ',
    s3AlertText:
      'ຄວາມເຈັບປວດຫຼາຍ, ອາການທີ່ຮ້າຍແຮງຂຶ້ນ, ບາດແຜທີ່ຫາຍຍາກ ຫຼື ຄວາມກັງວົນໃດໆ ຄວນຂໍຄຳແນະນຳຈາກໝໍຕຳແຍ, ແພດ ຫຼື ຜູ້ຊ່ຽວຊານດ້ານການຟື້ນຟູ.',

    s4Heading: 'ການຮຽນຮູ້ວິທີບີບຕົວໃຫ້ຖືກຕ້ອງ',
    s4Body1:
      'ເພື່ອຮູ້ຈັກການເຄື່ອນໄຫວນີ້ ໃຫ້ລອງຈິນຕະນາການວ່າກຳລັງກັ້ນລົມ ແລະ ກັ້ນຄວາມຢາກຍ່ຽວໃນເວລາດຽວກັນ. ການເຄື່ອນໄຫວທີ່ທ່ານຊອກຫາແມ່ນຄວາມຮູ້ສຶກຂອງການບີບ ແລະ ຍົກຂຶ້ນເຂົ້າທາງໃນ.',
    s4Body2:
      'ເປົ້າໝາຍບໍ່ແມ່ນການເກັງທົ່ວຮ່າງກາຍ. ກົ້ນ, ຂາອ່ອນ ແລະ ກ້າມເນື້ອທ້ອງຄວນຜ່ອນຄາຍໃຫ້ຫຼາຍທີ່ສຸດ ໃນຂະນະທີ່ຫາຍໃຈຕາມປົກກະຕິ.',
    exercises: [
      {icon: 'weather-windy', label: 'ການຫາຍໃຈ'},
      {icon: 'human-handsup', label: 'ການບີບແບບເບົາ'},
      {icon: 'arrow-up-bold-circle-outline', label: 'ການບີບແບບຄ້າງນານ'},
      {icon: 'gesture-tap-button', label: 'ການບີບແບບໄວ'},
    ],
    s4HighlightTitle: 'ການຜ່ອນຄາຍກໍສຳຄັນບໍ່ແພ້ກັນ',
    s4HighlightText:
      'ຫຼັງການບີບແຕ່ລະເທື່ອ ໃຫ້ກ້າມເນື້ອຜ່ອນຄາຍຢ່າງເຕັມທີ່. ການຟື້ນຟູທີ່ດີບໍ່ໄດ້ໝາຍເຖິງການບີບກ້າມເນື້ອພື້ນຊານຄ້າງໄວ້ຕະຫຼອດມື້.',

    s5Heading: 'ການສ້າງກິດຈະວັດແບບເທື່ອລະກ້າວ',
    s5Body1:
      'ໃນເບື້ອງຕົ້ນ ສິ່ງສຳຄັນທີ່ສຸດແມ່ນການຮຽນຮູ້ທີ່ຈະຮູ້ຈັກກ້າມເນື້ອ ແລະ ເຮັດການເຄື່ອນໄຫວໃຫ້ຖືກຕ້ອງ. ຄວາມສະໝ່ຳສະເໝີສຳຄັນກວ່າຄວາມແຮງ.',
    s5h3a: 'ການບີບແບບຄ້າງນານ',
    s5Body2:
      'ບີບກ້າມເນື້ອພື້ນຊານເບົາໆ ແລ້ວຄ້າງໄວ້ສອງສາມວິນາທີ ໂດຍບໍ່ກັ້ນຫາຍໃຈ. ຈາກນັ້ນຜ່ອນອອກຢ່າງເຕັມທີ່ກ່ອນເລີ່ມໃໝ່.',
    s5h3b: 'ການບີບແບບສັ້ນ',
    s5Body3:
      'ເມື່ອເຮັດການເຄື່ອນໄຫວໄດ້ຄ່ອງແລ້ວ ສາມາດເພີ່ມການບີບສັ້ນໆແບບໄວໄດ້. ມັນຊ່ວຍຝຶກຄວາມສາມາດໃນການບີບກ້າມເນື້ອຢ່າງວ່ອງໄວເມື່ອແຮງດັນໃນທ້ອງເພີ່ມຂຶ້ນ ເຊັ່ນ ກ່ອນຈະໄອ ຫຼື ຈາມ.',
    dailyTips: [
      {icon: 'clock-outline', label: 'ເຮັດການອອກກຳລັງກາຍຄູ່ກັບນິໄສປະຈຳວັນ'},
      {icon: 'human-sitting', label: 'ເລີ່ມຈາກທ່າທີ່ສະບາຍ'},
      {icon: 'weather-windy', label: 'ຫາຍໃຈຕາມປົກກະຕິໃນຂະນະບີບ'},
      {icon: 'sleep', label: 'ເຄົາລົບຊ່ວງເວລາຜ່ອນຄາຍ'},
      {icon: 'chart-line', label: 'ເພີ່ມຄວາມຍາກເທື່ອລະກ້າວ'},
      {icon: 'doctor', label: 'ຂໍຄຳແນະນຳຖ້າທ່ານບໍ່ແນ່ໃຈ'},
    ],
    s5TipTitle: 'ຄວາມສະໝ່ຳສະເໝີສຳຄັນທີ່ສຸດ',
    s5TipText:
      'ການເຮັດການອອກກຳລັງກາຍຄູ່ກັບນິໄສທີ່ມີຢູ່ແລ້ວໃນມື້ຂອງທ່ານ ສາມາດຊ່ວຍໃຫ້ເຮັດຢ່າງສະໝ່ຳສະເໝີໄດ້ງ່າຍຂຶ້ນ: ຫຼັງໃຫ້ນົມລູກ, ຫຼັງແປງແຂ້ວ ຫຼື ໃນເວລາອື່ນທີ່ເໝາະກັບທ່ານ.',

    s6Heading: 'ຂໍ້ຜິດພາດທີ່ພົບເລື້ອຍທີ່ຄວນຫຼີກເວັ້ນ',
    s6Body1:
      'ການອອກກຳລັງກ້າມເນື້ອພື້ນຊານອາດເບິ່ງຄືງ່າຍ ແຕ່ກໍງ່າຍທີ່ຈະໄປໃຊ້ກ້າມເນື້ອອື່ນແທນ ຫຼື ອອກແຮງຫຼາຍເກີນໄປ.',
    commonMistakes: [
      'ເກັງກົ້ນ ຫຼື ຂາອ່ອນແທນທີ່ຈະບີບກ້າມເນື້ອພື້ນຊານ',
      'ກັ້ນຫາຍໃຈໃນຂະນະບີບ',
      'ບີບກ້າມເນື້ອຄ້າງໄວ້ຕະຫຼອດໂດຍບໍ່ປ່ອຍໃຫ້ຜ່ອນຄາຍ',
      'ເຮັດການອອກກຳລັງກາຍພຽງສອງສາມມື້ແລ້ວຢຸດ',
      'ຕັ້ງໃຈຢຸດສາຍປັດສະວະເພື່ອກວດເບິ່ງການບີບ',
    ],
    s6TipTitle: 'ສິ່ງທີ່ບໍ່ຄວນເຮັດ',
    s6TipText:
      'ບໍ່ແນະນຳໃຫ້ຝຶກໂດຍການຕັ້ງໃຈຢຸດສາຍປັດສະວະ. ວິທີນີ້ບໍ່ໄດ້ຝຶກກ້າມເນື້ອພື້ນຊານຢ່າງຖືກຕ້ອງ ແລະ ອາດລົບກວນການເຮັດວຽກປົກກະຕິຂອງກະເພາະປັດສະວະ.',

    s7Heading: 'ອາການໃດທີ່ຄວນໄປພົບແພດ?',
    s7Body1:
      'ການຮົ່ວເລັກນ້ອຍ ຫຼື ຄວາມຮູ້ສຶກທີ່ຜິດປົກກະຕິອາດເກີດຂຶ້ນໄດ້ຫຼັງຄອດ. ແຕ່ບໍ່ຄວນມອງຂ້າມຖ້າມັນຍັງເປັນຢູ່, ຮ້າຍແຮງຂຶ້ນ ຫຼື ລົບກວນຊີວິດປະຈຳວັນຂອງທ່ານ.',
    warningSigns: [
      'ປັດສະວະຮົ່ວເວລາໄອ, ຈາມ, ຫົວ ຫຼື ອອກແຮງ',
      'ຄວາມຮູ້ສຶກໜັກ ຫຼື ກົດດັນໃນອຸ້ງເຄົ້າສ່ວນລຸ່ມ',
      'ຄວາມຮູ້ສຶກວ່າມີກ້ອນ ຫຼື ມີບາງສິ່ງຕົກລົງມາໃນຊ່ອງຄອດ',
      'ກັ້ນລົມ ຫຼື ອາຈົມໄດ້ຍາກ',
      'ເຈັບບໍລິເວນກ້າມເນື້ອພື້ນຊານຢ່າງຕໍ່ເນື່ອງ',
      'ເຈັບໃນຂະນະ ຫຼື ຫຼັງການມີເພດສຳພັນ',
      'ມີຄວາມຍາກໃນການຮູ້ຈັກ ຫຼື ບີບກ້າມເນື້ອພື້ນຊານໃຫ້ຖືກຕ້ອງ',
    ],
    consultLabel: 'ເວລາໃດຄວນຂໍຄຳແນະນຳ?',
    s7Body2:
      'ໝໍຕຳແຍ, ແພດ ຫຼື ນັກກາຍະພາບບຳບັດທີ່ຊ່ຽວຊານດ້ານການຟື້ນຟູກ້າມເນື້ອພື້ນຊານ ສາມາດກວດການເຮັດວຽກຂອງກ້າມເນື້ອ ແລະ ແນະນຳໂປຣແກຣມທີ່ເໝາະສົມ.',

    s8Heading: 'ແລ້ວຫຼັງຈາກຝີເຍັບຂາດ, ການຕັດຝີເຍັບ ຫຼື ການຜ່າຕັດເອົາລູກອອກເດ?',
    s8Body1:
      'ຝີເຍັບຂາດ ຫຼື ການຕັດຝີເຍັບຕ້ອງການການດູແລເປັນພິເສດໃນລະຫວ່າງທີ່ແຜຫາຍ. ການກັບມາເຮັດກິດຈະກຳຕ່າງໆຄວນຄຳນຶງເຖິງຄວາມເຈັບປວດ, ສະພາບຂອງແຜ ແລະ ຄຳແນະນຳທີ່ໄດ້ຮັບຫຼັງຄອດ.',
    s8Body2:
      'ຫຼັງການຜ່າຕັດເອົາລູກອອກ ການຟື້ນຕົວກໍກ່ຽວຂ້ອງກັບຜະໜັງທ້ອງ ແລະ ແຜຜ່າຕັດດ້ວຍ. ເຖິງແມ່ນການເກີດລູກບໍ່ແມ່ນທາງຊ່ອງຄອດ ການຖືພາເອງກໍຍັງສ້າງແຮງກົດດັນຕໍ່ກ້າມເນື້ອພື້ນຊານຢູ່.',
    s8HighlightTitle: 'ການດູແລສະເພາະບຸກຄົນສາມາດຊ່ວຍໄດ້',
    s8HighlightText:
      'ໃນກໍລະນີທີ່ຝີເຍັບຂາດຫຼາຍ, ເຈັບ, ມີອາການກ່ຽວກັບປັດສະວະ ຫຼື ລຳໄສ້ ຫຼື ມີຄວາມຍາກລຳບາກຢ່າງຕໍ່ເນື່ອງ ການປະເມີນກັບຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບຈະເປັນປະໂຫຍດເປັນພິເສດ.',

    s9Heading: 'ການກັບມາອອກກຳລັງກາຍເທື່ອລະກ້າວ',
    s9Body1:
      'ການກັບມາເຄື່ອນໄຫວຫຼັງຄອດຄວນເປັນໄປເທື່ອລະກ້າວ. ການຍ່າງ ແລະ ການເຄື່ອນໄຫວເບົາໆ ໂດຍທົ່ວໄປສາມາດເລີ່ມໄດ້ຕາມຄວາມຮູ້ສຶກຂອງທ່ານ ສ່ວນກິດຈະກຳທີ່ມີແຮງກະທົບສູງຕ້ອງລະມັດລະວັງຫຼາຍຂຶ້ນ.',
    s9Body2:
      'ກ່ອນກັບມາແລ່ນ, ໂດດ ຫຼື ຝຶກຢ່າງໜັກ ຄວນປະເມີນການຟື້ນຕົວຂອງກ້າມເນື້ອພື້ນຊານ ແລະ ຄຳນຶງເຖິງອາການຕ່າງໆ.',
    s9AlertTitle: 'ຢ່າຮີບຮ້ອນຂ້າມຂັ້ນຕອນ',
    s9AlertText:
      'ການຮົ່ວ, ຄວາມຮູ້ສຶກໜັກ ຫຼື ເຈັບໃນຂະນະ ຫຼື ຫຼັງອອກກຳລັງກາຍ ເປັນສັນຍານວ່າທ່ານຄວນຊ້າລົງ ແລະ ຂໍຄຳແນະນຳກ່ອນເພີ່ມຄວາມແຮງ.',

    s10Heading: 'ເວລາໃດຄວນພົບຜູ້ຊ່ຽວຊານ?',
    s10Body1:
      'ການຟື້ນຟູກ້າມເນື້ອພື້ນຊານກັບໝໍຕຳແຍ ຫຼື ນັກກາຍະພາບບຳບັດ ສາມາດເປັນປະໂຫຍດຖ້າທ່ານບໍ່ແນ່ໃຈວ່າບີບຖືກຫຼືບໍ່, ຖ້າອາການຍັງເປັນຢູ່ ຫຼື ຖ້າທ່ານຢາກກັບມາເຮັດກິດຈະກຳທາງກາຍບາງຢ່າງຢ່າງໝັ້ນໃຈ.',
    questionCardTitle: 'ຄຳຖາມທີ່ເປັນປະໂຫຍດທີ່ຄວນຖາມ',
    appointmentQuestions: [
      'ອາການຂອງຂ້ອຍສອດຄ່ອງກັບກ້າມເນື້ອພື້ນຊານອ່ອນແຮງບໍ?',
      'ຂ້ອຍບີບຖືກວິທີບໍ?',
      'ຂ້ອຍຄວນເຮັດຈັກເທື່ອຕໍ່ມື້?',
      'ຂ້ອຍກັບມາແລ່ນ, ອອກກຳລັງກາຍ ຫຼື ກິດຈະກຳທີ່ມີແຮງກະທົບສູງໄດ້ບໍ?',
      'ຂ້ອຍຕ້ອງການການຟື້ນຟູກັບໝໍຕຳແຍ ຫຼື ນັກກາຍະພາບບຳບັດບໍ?',
      'ແຜຜ່າຕັດ, ຝີເຍັບຂາດ ຫຼື ການຜ່າຕັດເອົາລູກອອກຂອງຂ້ອຍຕ້ອງລະວັງເປັນພິເສດບໍ?',
    ],
    s10TipTitle: 'ຄວນຮູ້',
    s10TipText:
      'ການພົບຜູ້ຊ່ຽວຊານບໍ່ໄດ້ໝາຍຄວາມວ່າມີບາງຢ່າງຜິດປົກກະຕິສະເໝີໄປ. ການພົບກັນສາມາດຊ່ວຍກວດເຕັກນິກຂອງທ່ານ, ປະເມີນການຟື້ນຕົວ ແລະ ຮຽນຮູ້ວິທີກ້າວໜ້າຢ່າງຖືກຕ້ອງ.',

    s11Heading: 'ການຟື້ນຕົວທີ່ຕ້ອງໃຊ້ເວລາ',
    s11Body1:
      'ຫຼັງຄອດ ເປັນເລື່ອງປົກກະຕິທີ່ຈະບໍ່ກັບມາມີຄວາມຮູ້ສຶກ ຫຼື ແຮງຂອງກ້າມເນື້ອຄືກັບກ່ອນຖືພາທັນທີ.',
    s11Body2:
      'ເປົ້າໝາຍບໍ່ແມ່ນການບີບໃຫ້ໄດ້ຫຼາຍທີ່ສຸດ. ມັນແມ່ນການຄ່ອຍໆກັບມາມີການປະສານງານທີ່ດີລະຫວ່າງການບີບ ແລະ ການຜ່ອນຄາຍ ແລ້ວສາມາດໃຊ້ກ້າມເນື້ອເຫຼົ່ານີ້ຢ່າງເປັນທຳມະຊາດໃນກິດຈະກຳປະຈຳວັນ.',
    s11HighlightTitle: 'ຄວາມກ້າວໜ້າເລັກນ້ອຍກໍແມ່ນຄວາມກ້າວໜ້າທີ່ແທ້ຈິງ',
    s11HighlightText:
      'ການຮັບຮູ້ການເຄື່ອນໄຫວໄດ້ດີຂຶ້ນ, ບີບໄດ້ນານຂຶ້ນອີກສອງສາມວິນາທີ ຫຼື ການຮົ່ວທີ່ຫຼຸດລົງ ແມ່ນສັນຍານທີ່ໜ້າຊື່ນຊົມແລ້ວ.',

    s12Heading: 'ຈຸດສຳຄັນ',
    summaryTitle: 'ສິ່ງຈຳເປັນ',
    summaryItems: [
      'ການຖືພາ ແລະ ການເກີດລູກສ້າງແຮງກົດດັນຫຼາຍຕໍ່ກ້າມເນື້ອພື້ນຊານ.',
      'ການຟື້ນຕົວເທື່ອລະກ້າວຫຼັງຄອດເປັນເລື່ອງປົກກະຕິ.',
      'ການອອກກຳລັງກາຍຄວນເນັ້ນຄຸນນະພາບຂອງການເຄື່ອນໄຫວກວ່າຄວາມແຮງ.',
      'ການຫາຍໃຈ ແລະ ການຜ່ອນຄາຍກໍສຳຄັນບໍ່ແພ້ການບີບ.',
      'ປັດສະວະຮົ່ວ, ຄວາມຮູ້ສຶກໜັກ ຫຼື ເຈັບຕໍ່ເນື່ອງ ຄວນໄດ້ຮັບຄວາມເຫັນຈາກຜູ້ຊ່ຽວຊານ.',
      'ການຟື້ນຟູກັບໝໍຕຳແຍ ຫຼື ນັກກາຍະພາບບຳບັດສາມາດຊ່ວຍໃຫ້ທ່ານຄວບຄຸມໄດ້ດີຂຶ້ນ.',
      'ການກັບມາອອກກຳລັງກາຍຄວນເປັນໄປເທື່ອລະກ້າວ ໂດຍສະເພາະກິດຈະກຳທີ່ມີແຮງກະທົບສູງ.',
    ],

    finalTipTitle: 'ໃຊ້ເວລາເພື່ອຟື້ນຕົວ',
    finalTipText:
      'ຫຼັງການເກີດລູກ ຮ່າງກາຍຂອງທ່ານຜ່ານການປ່ຽນແປງມາຫຼາຍ. ກ້າມເນື້ອພື້ນຊານສົມຄວນໄດ້ຮັບຄວາມເອົາໃຈໃສ່ເທົ່າກັບສ່ວນອື່ນຂອງຮ່າງກາຍ: ເທື່ອລະກ້າວ, ສະໝ່ຳສະເໝີ ແລະ ບໍ່ມີຄວາມກົດດັນ.',

    disclaimerText:
      'ບົດຄວາມນີ້ເປັນຂໍ້ມູນທົ່ວໄປເທົ່ານັ້ນ ແລະ ບໍ່ແທນຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ຖ້າທ່ານມີຄວາມເຈັບປວດ, ອາການທີ່ຕໍ່ເນື່ອງ ຫຼື ມີຄວາມກັງວົນກ່ຽວກັບການຟື້ນຕົວ ກະລຸນາຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
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
