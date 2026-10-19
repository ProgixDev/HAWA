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
