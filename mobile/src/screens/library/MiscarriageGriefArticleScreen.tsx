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
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lossemotional-traverser-le-deuil';

const HERO = require('../../assets/images/library/rules-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons are language-neutral and stay index-aligned with the matching */
/* CONTENT.fr/.en text arrays below (feelings / dailySupport).               */
/* -------------------------------------------------------------------------- */

const FEELING_ICONS = [
  'emoticon-sad-outline',
  'weather-lightning',
  'help-circle-outline',
] as const;

const DAILY_SUPPORT_ICONS = [
  'clock-outline',
  'account-off-outline',
  'pencil-outline',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = withBrazilianPortuguese('MiscarriageGrief', {
  fr: {
    badge: 'APRÈS UNE FAUSSE COUCHE • SOUTIEN ÉMOTIONNEL',
    title: 'Traverser le deuil\némotionnellement',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro:
      'Il n’y a pas de bonne façon de vivre cette épreuve. Chacune la traverse à sa manière, à son propre rythme.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Un deuil réel et légitime',
      'Des émotions qui varient selon chaque personne',
      'Ce qui peut aider au quotidien',
      'Le soutien de l’entourage',
      'Quand demander de l’aide professionnelle',
      'À retenir',
    ],
    section1Body:
      'La tristesse, la colère ou le sentiment de vide sont des réactions normales face à cette perte, quel que soit le stade de la grossesse. Ce que tu ressens mérite d’être reconnu.',
    section1InfoTitle: 'À retenir',
    section1InfoText:
      'Il n’existe pas de bonne ou de mauvaise façon de vivre cette épreuve. Chaque émotion que tu ressens est légitime.',
    section2Body:
      'Certaines personnes peuvent ressentir un ou plusieurs de ces états, parfois en même temps :',
    feelings: [
      {
        title: 'Tristesse',
        text: 'Un chagrin qui peut aller et venir, parfois de façon inattendue.',
      },
      {
        title: 'Colère',
        text: 'Envers soi, la situation ou un sentiment d’injustice, sans que ce soit un problème.',
      },
      {
        title: 'Sentiment de vide',
        text: 'Une impression de vide ou d’incompréhension face à ce qui vient de se passer.',
      },
    ],
    section3Body:
      'S’accorder du temps, sans pression ni comparaison, fait partie intégrante de la guérison.',
    dailySupport: [
      {
        title: 'T’accorder du temps',
        text: 'Sans pression ni date limite pour « aller mieux ».',
      },
      {
        title: 'Ne pas te comparer',
        text: 'Chaque deuil est unique ; il n’y a pas de bonne façon de le vivre.',
      },
      {
        title: 'Mettre des mots dessus',
        text: 'Écrire ou parler de ce que tu ressens peut alléger le poids des émotions.',
      },
    ],
    section4Body:
      'Parler à un proche, un groupe de soutien ou un professionnel peut alléger ce poids. Voici comment l’entourage peut aider :',
    supportTitle: 'Comment un proche peut soutenir',
    howToSupport: [
      'Écouter sans juger, même sans avoir les mots parfaits',
      'Éviter de minimiser (« ce n’était pas grave », « tu pourras réessayer »)',
      'Proposer une présence plutôt que des solutions',
      'Continuer à prendre des nouvelles dans les semaines qui suivent',
    ],
    section5Body:
      'Certains signes peuvent indiquer qu’un accompagnement professionnel serait bénéfique :',
    warningTitle: 'Signaux à surveiller',
    attentionSigns: [
      'La tristesse persiste longtemps et s’intensifie plutôt que de s’atténuer',
      'Il devient difficile de fonctionner au quotidien',
      'Un isolement important s’installe',
      'Des pensées envahissantes ou un sentiment de détresse important apparaissent',
    ],
    section5InfoTitle: 'Un accompagnement est possible',
    section5InfoText:
      'Une sage-femme, un médecin, un psychologue ou un groupe de parole peut t’écouter et t’accompagner, sans jugement.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Demander de l’aide n’est pas un signe de faiblesse : c’est une façon de prendre soin de toi pendant cette période.',
    summaryPoints: [
      'Il n’existe pas de bonne ou de mauvaise façon de vivre cette épreuve.',
      'La tristesse, la colère ou le sentiment de vide sont des réactions normales.',
      'S’accorder du temps, sans pression ni comparaison, fait partie de la guérison.',
      'Parler à un proche, un groupe de soutien ou un professionnel peut alléger ce poids.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis professionnel. Si tu traverses une période difficile, n’hésite pas à en parler à un professionnel de santé.',
    shareMessage: 'Traverser le deuil émotionnellement — AWA',
  },
  en: {
    badge: 'AFTER A MISCARRIAGE • EMOTIONAL SUPPORT',
    title: 'Moving through grief\nemotionally',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro:
      'There’s no right way to go through this. Everyone moves through it in her own way, at her own pace.',
    contentsTitle: 'In this article',
    topics: [
      'A real and legitimate grief',
      'Emotions that vary from person to person',
      'What may help day to day',
      'Support from loved ones',
      'When to seek professional help',
      'Key takeaways',
    ],
    section1Body:
      'Sadness, anger, or a feeling of emptiness are normal reactions to this loss, whatever the stage of the pregnancy. What you’re feeling deserves to be acknowledged.',
    section1InfoTitle: 'Keep in mind',
    section1InfoText:
      'There is no right or wrong way to go through this. Every emotion you feel is valid.',
    section2Body:
      'You may feel one or more of these, sometimes all at once:',
    feelings: [
      {
        title: 'Sadness',
        text: 'A sorrow that can come and go, sometimes unexpectedly.',
      },
      {
        title: 'Anger',
        text: 'Toward yourself, the situation, or a sense of unfairness — and that’s nothing to worry about.',
      },
      {
        title: 'A feeling of emptiness',
        text: 'A sense of emptiness or confusion about what just happened.',
      },
    ],
    section3Body:
      'Giving yourself time, without pressure or comparison, is an essential part of healing.',
    dailySupport: [
      {
        title: 'Giving yourself time',
        text: 'Without pressure or a deadline for “feeling better.”',
      },
      {
        title: 'Not comparing yourself to others',
        text: 'Every grief is unique; there’s no right way to go through it.',
      },
      {
        title: 'Putting it into words',
        text: 'Writing or talking about what you feel can help lighten the weight of your emotions.',
      },
    ],
    section4Body:
      'Talking to someone close to you, a support group, or a professional can help lighten this weight. Here’s how loved ones can help:',
    supportTitle: 'How a loved one can offer support',
    howToSupport: [
      'Listen without judgment, even without having the perfect words',
      'Avoid minimizing the experience (“it wasn’t a big deal,” “you can try again”)',
      'Offer your presence rather than solutions',
      'Keep checking in during the weeks that follow',
    ],
    section5Body:
      'Some signs may indicate that professional support could be helpful:',
    warningTitle: 'Signs to watch for',
    attentionSigns: [
      'Sadness lasts a long time and intensifies rather than easing',
      'It becomes difficult to function day to day',
      'A significant sense of isolation sets in',
      'Intrusive thoughts or significant distress appear',
    ],
    section5InfoTitle: 'Support is available',
    section5InfoText:
      'A midwife, doctor, psychologist, or support group can listen and support you, without judgment.',
    tipTitle: 'Good to know',
    tipText:
      'Asking for help isn’t a sign of weakness — it’s a way of taking care of yourself during this time.',
    summaryPoints: [
      'There is no right or wrong way to go through this experience.',
      'Sadness, anger, or a feeling of emptiness are normal reactions.',
      'Giving yourself time, without pressure or comparison, is part of healing.',
      'Talking to someone close to you, a support group, or a professional can help lighten this weight.',
    ],
    disclaimerText:
      'Informational content. This article does not replace professional advice. If you’re going through a difficult time, don’t hesitate to talk to a healthcare professional.',
    shareMessage: 'Moving through grief, emotionally — AWA',
  },
  es: {
    badge: 'DESPUÉS DE UNA PÉRDIDA DEL EMBARAZO • APOYO EMOCIONAL',
    title: 'Atravesar el duelo\nemocionalmente',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido informativo',
    intro:
      'No existe una forma correcta de vivir esta prueba. Cada una la atraviesa a su manera, a su propio ritmo.',
    contentsTitle: 'En este artículo',
    topics: [
      'Un duelo real y legítimo',
      'Emociones que varían según cada persona',
      'Lo que puede ayudar en el día a día',
      'El apoyo del entorno',
      'Cuándo pedir ayuda profesional',
      'Para recordar',
    ],
    section1Body:
      'La tristeza, la rabia o la sensación de vacío son reacciones normales ante esta pérdida, sea cual sea la etapa del embarazo. Lo que sientes merece ser reconocido.',
    section1InfoTitle: 'Para recordar',
    section1InfoText:
      'No existe una forma correcta o incorrecta de vivir esta prueba. Cada emoción que sientes es legítima.',
    section2Body:
      'Algunas personas pueden sentir uno o varios de estos estados, a veces al mismo tiempo:',
    feelings: [
      {
        title: 'Tristeza',
        text: 'Una pena que puede ir y venir, a veces de forma inesperada.',
      },
      {
        title: 'Rabia',
        text: 'Hacia una misma, hacia la situación o un sentimiento de injusticia, sin que eso sea un problema.',
      },
      {
        title: 'Sensación de vacío',
        text: 'Una impresión de vacío o de incomprensión ante lo que acaba de ocurrir.',
      },
    ],
    section3Body:
      'Concederte tiempo, sin presión ni comparación, forma parte integral de la sanación.',
    dailySupport: [
      {
        title: 'Concederte tiempo',
        text: 'Sin presión ni fecha límite para «estar mejor».',
      },
      {
        title: 'No compararte',
        text: 'Cada duelo es único; no hay una forma correcta de vivirlo.',
      },
      {
        title: 'Ponerle palabras',
        text: 'Escribir o hablar sobre lo que sientes puede aliviar el peso de las emociones.',
      },
    ],
    section4Body:
      'Hablar con alguien cercano, un grupo de apoyo o un profesional puede aliviar este peso. Esto es cómo el entorno puede ayudar:',
    supportTitle: 'Cómo puede apoyar una persona cercana',
    howToSupport: [
      'Escuchar sin juzgar, incluso sin tener las palabras perfectas',
      'Evitar minimizar lo ocurrido («no era grave», «podrás volver a intentarlo»)',
      'Ofrecer presencia en lugar de soluciones',
      'Seguir preguntando cómo está en las semanas siguientes',
    ],
    section5Body:
      'Algunas señales pueden indicar que un acompañamiento profesional sería beneficioso:',
    warningTitle: 'Señales a las que prestar atención',
    attentionSigns: [
      'La tristeza persiste durante mucho tiempo y se intensifica en lugar de disminuir',
      'Se vuelve difícil funcionar en el día a día',
      'Se instala un aislamiento importante',
      'Aparecen pensamientos invasivos o una sensación de malestar importante',
    ],
    section5InfoTitle: 'Un acompañamiento es posible',
    section5InfoText:
      'Una matrona, un médico, un psicólogo o un grupo de apoyo pueden escucharte y acompañarte, sin juzgar.',
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Pedir ayuda no es un signo de debilidad: es una forma de cuidarte durante este periodo.',
    summaryPoints: [
      'No existe una forma correcta o incorrecta de vivir esta prueba.',
      'La tristeza, la rabia o la sensación de vacío son reacciones normales.',
      'Concederte tiempo, sin presión ni comparación, forma parte de la sanación.',
      'Hablar con alguien cercano, un grupo de apoyo o un profesional puede aliviar este peso.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye un asesoramiento profesional. Si estás atravesando un periodo difícil, no dudes en hablarlo con un profesional de la salud.',
    shareMessage: 'Atravesar el duelo emocionalmente — AWA',
  },
  it: {
    badge: 'DOPO UN ABORTO SPONTANEO • SOSTEGNO EMOTIVO',
    title: 'Attraversare il lutto\na livello emotivo',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto informativo',
    intro: 'Non esiste un modo giusto di viverlo. Ognuna lo attraversa a modo suo, con i suoi tempi.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Un lutto reale e legittimo',
      'Emozioni che variano da persona a persona',
      'Cosa può aiutare giorno per giorno',
      'Il sostegno delle persone care',
      'Quando cercare un aiuto professionale',
      'Punti chiave',
    ],
    section1Body: 'Tristezza, rabbia o un senso di vuoto sono reazioni normali a questa perdita, qualunque sia la fase della gravidanza. Ciò che provi merita di essere riconosciuto.',
    section1InfoTitle: 'Da tenere a mente',
    section1InfoText: 'Non esiste un modo giusto o sbagliato di attraversare tutto questo. Ogni emozione che provi è legittima.',
    section2Body: 'Puoi provare una o più di queste emozioni, a volte tutte insieme:',
    feelings: [
      {
        title: 'Tristezza',
        text: 'Un dolore che può andare e venire, a volte in modo inatteso.',
      },
      {
        title: 'Rabbia',
        text: 'Verso te stessa, verso la situazione o per un senso di ingiustizia, e non c’è nulla di cui preoccuparsi.',
      },
      {
        title: 'Un senso di vuoto',
        text: 'Una sensazione di vuoto o di confusione rispetto a ciò che è appena successo.',
      },
    ],
    section3Body: 'Darti del tempo, senza pressioni né paragoni, è una parte essenziale del percorso di guarigione.',
    dailySupport: [
      {
        title: 'Darti del tempo',
        text: 'Senza pressioni né scadenze per «stare meglio».',
      },
      {
        title: 'Non paragonarti agli altri',
        text: 'Ogni lutto è unico; non esiste un modo giusto di attraversarlo.',
      },
      {
        title: 'Mettere in parole',
        text: 'Scrivere o parlare di ciò che senti può aiutare ad alleggerire il peso delle tue emozioni.',
      },
    ],
    section4Body: 'Parlare con una persona a te vicina, con un gruppo di sostegno o con un professionista può aiutare ad alleggerire questo peso. Ecco come le persone care possono aiutare:',
    supportTitle: 'Come una persona cara può offrire sostegno',
    howToSupport: [
      'Ascoltare senza giudicare, anche senza avere le parole perfette',
      'Evitare di minimizzare l’esperienza («non è stato niente di grave», «puoi riprovare»)',
      'Offrire la propria presenza piuttosto che soluzioni',
      'Continuare a farsi sentire nelle settimane successive',
    ],
    section5Body: 'Alcuni segnali possono indicare che un sostegno professionale potrebbe essere utile:',
    warningTitle: 'Segnali a cui prestare attenzione',
    attentionSigns: [
      'La tristezza dura a lungo e si intensifica anziché attenuarsi',
      'Diventa difficile svolgere le attività quotidiane',
      'Si instaura un forte senso di isolamento',
      'Compaiono pensieri intrusivi o un disagio significativo',
    ],
    section5InfoTitle: 'Un sostegno è disponibile',
    section5InfoText: 'Un’ostetrica, un medico, una psicologa o un gruppo di sostegno possono ascoltarti e accompagnarti, senza giudicarti.',
    tipTitle: 'Da sapere',
    tipText: 'Chiedere aiuto non è un segno di debolezza: è un modo di prenderti cura di te in questo periodo.',
    summaryPoints: [
      'Non esiste un modo giusto o sbagliato di vivere questa esperienza.',
      'Tristezza, rabbia o un senso di vuoto sono reazioni normali.',
      'Darti del tempo, senza pressioni né paragoni, fa parte della guarigione.',
      'Parlare con una persona a te vicina, con un gruppo di sostegno o con un professionista può aiutare ad alleggerire questo peso.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce il parere di un professionista. Se stai attraversando un momento difficile, non esitare a parlarne con un operatore sanitario.',
    shareMessage: 'Attraversare il lutto a livello emotivo — AWA',
  },
  tr: {
    badge: 'DÜŞÜK SONRASI • DUYGUSAL DESTEK',
    title: 'Yası duygusal olarak\nyaşamak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Bilgilendirici içerik',
    intro: 'Bu süreci yaşamanın tek bir doğru yolu yok. Herkes kendi yolunda, kendi hızında ilerler.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Gerçek ve meşru bir yas',
      'Kişiden kişiye değişen duygular',
      'Günlük hayatta neler yardımcı olabilir',
      'Sevdiklerinin desteği',
      'Ne zaman profesyonel yardım alınmalı',
      'Öne çıkanlar',
    ],
    section1Body: 'Üzüntü, öfke ya da boşluk hissi, gebeliğin hangi aşamasında olursa olsun bu kayba verilen normal tepkilerdir. Hissettiklerin kabul edilmeyi hak ediyor.',
    section1InfoTitle: 'Aklında bulunsun',
    section1InfoText: 'Bu süreci yaşamanın doğru ya da yanlış bir yolu yoktur. Hissettiğin her duygu geçerlidir.',
    section2Body: 'Bunlardan birini ya da birkaçını, bazen hepsini aynı anda hissedebilirsin:',
    feelings: [
      {
        title: 'Üzüntü',
        text: 'Gelip gidebilen, bazen beklenmedik anlarda ortaya çıkan bir keder.',
      },
      {
        title: 'Öfke',
        text: 'Kendine, yaşananlara ya da bir haksızlık duygusuna yönelik olabilir; bu endişe edilecek bir şey değildir.',
      },
      {
        title: 'Boşluk hissi',
        text: 'Yaşananlar karşısında bir boşluk ya da karışıklık duygusu.',
      },
    ],
    section3Body: 'Baskı ve kıyaslama olmadan kendine zaman tanımak, iyileşmenin önemli bir parçasıdır.',
    dailySupport: [
      {
        title: 'Kendine zaman tanımak',
        text: '“İyi hissetmek” için baskı ya da son tarih olmadan.',
      },
      {
        title: 'Kendini başkalarıyla kıyaslamamak',
        text: 'Her yas benzersizdir; bunu yaşamanın tek bir doğru yolu yoktur.',
      },
      {
        title: 'Duygularını kelimelere dökmek',
        text: 'Hissettiklerini yazmak ya da anlatmak, duyguların yükünü hafifletmeye yardımcı olabilir.',
      },
    ],
    section4Body: 'Yakınındaki biriyle, bir destek grubuyla ya da bir uzmanla konuşmak bu yükü hafifletmeye yardımcı olabilir. Sevdiklerinin nasıl yardımcı olabileceği şöyle:',
    supportTitle: 'Bir yakının nasıl destek olabilir',
    howToSupport: [
      'Yargılamadan dinlemek, doğru kelimeleri bulamasa bile',
      'Yaşananı küçümsemekten kaçınmak (“önemli bir şey değildi”, “tekrar deneyebilirsiniz” gibi)',
      'Çözüm sunmak yerine yanında olmak',
      'Sonraki haftalarda da hâl hatır sormayı sürdürmek',
    ],
    section5Body: 'Bazı belirtiler profesyonel desteğin yararlı olabileceğini gösterebilir:',
    warningTitle: 'Dikkat edilmesi gereken belirtiler',
    attentionSigns: [
      'Üzüntü uzun süre devam ediyor ve hafiflemek yerine yoğunlaşıyor',
      'Günlük hayatta işlevini sürdürmek zorlaşıyor',
      'Belirgin bir yalnızlık hissi yerleşiyor',
      'Zihni meşgul eden istenmeyen düşünceler ya da belirgin sıkıntı ortaya çıkıyor',
    ],
    section5InfoTitle: 'Destek mevcut',
    section5InfoText: 'Bir ebe, doktor, psikolog ya da destek grubu seni yargılamadan dinleyebilir ve sana destek olabilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Yardım istemek bir zayıflık işareti değildir; bu dönemde kendine iyi bakmanın bir yoludur.',
    summaryPoints: [
      'Bu deneyimi yaşamanın doğru ya da yanlış bir yolu yoktur.',
      'Üzüntü, öfke ya da boşluk hissi normal tepkilerdir.',
      'Baskı ve kıyaslama olmadan kendine zaman tanımak iyileşmenin bir parçasıdır.',
      'Yakınındaki biriyle, bir destek grubuyla ya da bir uzmanla konuşmak bu yükü hafifletmeye yardımcı olabilir.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Bu makale profesyonel tavsiyenin yerini tutmaz. Zor bir dönemden geçiyorsan bir sağlık uzmanıyla konuşmaktan çekinme.',
    shareMessage: 'Yası duygusal olarak yaşamak — AWA',
  },
  ru: {
    badge: 'ПОСЛЕ ВЫКИДЫША • ЭМОЦИОНАЛЬНАЯ ПОДДЕРЖКА',
    title: 'Пройти через горе\nэмоционально',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Информационный материал',
    intro: 'Не существует единственно правильного способа пройти через это. Каждая женщина проживает это по-своему и в своём темпе.',
    contentsTitle: 'В этой статье',
    topics: [
      'Настоящее и законное горе',
      'Эмоции, которые у каждой разные',
      'Что может помочь в повседневной жизни',
      'Поддержка близких',
      'Когда стоит обратиться за профессиональной помощью',
      'Главное',
    ],
    section1Body: 'Грусть, гнев или чувство пустоты — естественные реакции на эту потерю, на каком бы сроке ни была беременность. То, что вы чувствуете, заслуживает признания.',
    section1InfoTitle: 'Важно помнить',
    section1InfoText: 'Нет правильного или неправильного способа пройти через это. Любая эмоция, которую вы испытываете, имеет право на существование.',
    section2Body: 'Вы можете испытывать одно или несколько из этих чувств, иногда все сразу:',
    feelings: [
      {
        title: 'Грусть',
        text: 'Печаль, которая может приходить и уходить, порой неожиданно.',
      },
      {
        title: 'Гнев',
        text: 'На себя, на ситуацию или из-за чувства несправедливости — и в этом нет ничего тревожного.',
      },
      {
        title: 'Чувство пустоты',
        text: 'Ощущение пустоты или растерянности из-за того, что произошло.',
      },
    ],
    section3Body: 'Дать себе время, без давления и сравнений, — важная часть исцеления.',
    dailySupport: [
      {
        title: 'Дать себе время',
        text: 'Без давления и без срока, к которому нужно «почувствовать себя лучше».',
      },
      {
        title: 'Не сравнивать себя с другими',
        text: 'Каждое горе уникально; единственно правильного способа пройти через него нет.',
      },
      {
        title: 'Выразить чувства словами',
        text: 'Записать или рассказать о том, что вы чувствуете, может помочь облегчить тяжесть переживаний.',
      },
    ],
    section4Body: 'Разговор с кем-то из близких, группой поддержки или специалистом может помочь облегчить эту ношу. Вот чем могут помочь близкие:',
    supportTitle: 'Как близкий человек может поддержать',
    howToSupport: [
      'Слушать без осуждения, даже если не находится нужных слов',
      'Не обесценивать пережитое («ничего страшного», «можно попробовать снова»)',
      'Предложить своё присутствие, а не готовые решения',
      'Продолжать интересоваться, как дела, и в последующие недели',
    ],
    section5Body: 'Некоторые признаки могут говорить о том, что профессиональная поддержка была бы полезной:',
    warningTitle: 'На что стоит обратить внимание',
    attentionSigns: [
      'Грусть длится долго и усиливается, а не ослабевает',
      'Становится трудно справляться с повседневными делами',
      'Появляется выраженное чувство одиночества',
      'Появляются навязчивые мысли или сильное душевное страдание',
    ],
    section5InfoTitle: 'Поддержка доступна',
    section5InfoText: 'Акушерка, врач, психолог или группа поддержки могут выслушать вас и поддержать без осуждения.',
    tipTitle: 'Полезно знать',
    tipText: 'Просить о помощи — не признак слабости, а способ позаботиться о себе в этот период.',
    summaryPoints: [
      'Нет правильного или неправильного способа пройти через этот опыт.',
      'Грусть, гнев или чувство пустоты — естественные реакции.',
      'Дать себе время, без давления и сравнений, — часть исцеления.',
      'Разговор с кем-то из близких, группой поддержки или специалистом может помочь облегчить эту ношу.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет профессиональной консультации. Если вы переживаете трудный период, не стесняйтесь обратиться к медицинскому специалисту.',
    shareMessage: 'Пройти через горе эмоционально — AWA',
  },
  de: {
    badge: 'NACH EINER FEHLGEBURT • EMOTIONALE UNTERSTÜTZUNG',
    title: 'Die Trauer\nemotional durchleben',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Informationsinhalt',
    intro:
      'Es gibt keinen richtigen Weg, das zu durchleben. Jede Frau geht ihn auf ihre eigene Weise und in ihrem eigenen Tempo.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Eine echte und berechtigte Trauer',
      'Gefühle, die bei jeder Frau anders sind',
      'Was im Alltag helfen kann',
      'Die Unterstützung durch nahestehende Menschen',
      'Wann du professionelle Hilfe suchen kannst',
      'Das Wichtigste in Kürze',
    ],
    section1Body:
      'Traurigkeit, Wut oder ein Gefühl der Leere sind normale Reaktionen auf diesen Verlust, ganz gleich, in welcher Phase der Schwangerschaft er eingetreten ist. Was du fühlst, darf da sein.',
    section1InfoTitle: 'Bedenke',
    section1InfoText:
      'Es gibt kein Richtig oder Falsch im Umgang damit. Jedes Gefühl, das du empfindest, ist berechtigt.',
    section2Body:
      'Vielleicht erlebst du eines oder mehrere dieser Gefühle, manchmal alle gleichzeitig:',
    feelings: [
      {
        title: 'Traurigkeit',
        text: 'Ein Schmerz, der kommen und gehen kann, manchmal ganz unerwartet.',
      },
      {
        title: 'Wut',
        text: 'Auf dich selbst, auf die Situation oder aus einem Gefühl der Ungerechtigkeit heraus – und das ist kein Grund zur Sorge.',
      },
      {
        title: 'Ein Gefühl der Leere',
        text: 'Ein Gefühl von Leere oder Verwirrung darüber, was gerade geschehen ist.',
      },
    ],
    section3Body:
      'Dir Zeit zu geben, ohne Druck und ohne Vergleiche, ist ein wesentlicher Teil des Heilens.',
    dailySupport: [
      {
        title: 'Dir Zeit geben',
        text: 'Ohne Druck und ohne Frist, bis es dir „wieder gut gehen“ muss.',
      },
      {
        title: 'Dich nicht mit anderen vergleichen',
        text: 'Jede Trauer ist einzigartig; es gibt keinen richtigen Weg, sie zu durchleben.',
      },
      {
        title: 'Es in Worte fassen',
        text: 'Aufzuschreiben oder auszusprechen, was du fühlst, kann helfen, die Last deiner Gefühle zu erleichtern.',
      },
    ],
    section4Body:
      'Mit einem nahestehenden Menschen, in einer Selbsthilfegruppe oder mit einer Fachperson zu sprechen, kann diese Last erleichtern. So können dir nahestehende Menschen helfen:',
    supportTitle: 'Wie ein nahestehender Mensch Halt geben kann',
    howToSupport: [
      'Ohne Urteil zuhören, auch wenn die perfekten Worte fehlen',
      'Das Erlebte nicht kleinreden („Das war doch nicht so schlimm“, „Ihr könnt es ja wieder versuchen“)',
      'Da sein, statt Lösungen anzubieten',
      'Auch in den folgenden Wochen weiter nachfragen',
    ],
    section5Body:
      'Manche Anzeichen können darauf hindeuten, dass professionelle Unterstützung hilfreich sein könnte:',
    warningTitle: 'Anzeichen, auf die du achten kannst',
    attentionSigns: [
      'Die Traurigkeit hält lange an und wird stärker, statt nachzulassen',
      'Es fällt dir schwer, den Alltag zu bewältigen',
      'Ein starkes Gefühl der Isolation macht sich breit',
      'Aufdrängende Gedanken oder eine erhebliche seelische Belastung treten auf',
    ],
    section5InfoTitle: 'Unterstützung ist da',
    section5InfoText:
      'Eine Hebamme, eine Ärztin oder ein Arzt, eine Psychologin oder ein Psychologe oder eine Selbsthilfegruppe kann dir zuhören und dich ohne Urteil unterstützen.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Um Hilfe zu bitten ist kein Zeichen von Schwäche – es ist eine Art, in dieser Zeit gut für dich zu sorgen.',
    summaryPoints: [
      'Es gibt kein Richtig oder Falsch, wie du diese Erfahrung durchlebst.',
      'Traurigkeit, Wut oder ein Gefühl der Leere sind normale Reaktionen.',
      'Dir Zeit zu geben, ohne Druck und ohne Vergleiche, ist Teil des Heilens.',
      'Mit einem nahestehenden Menschen, in einer Selbsthilfegruppe oder mit einer Fachperson zu sprechen, kann diese Last erleichtern.',
    ],
    disclaimerText:
      'Informationsinhalt. Dieser Artikel ersetzt keine professionelle Beratung. Wenn du eine schwere Zeit durchmachst, zögere nicht, mit medizinischem Fachpersonal zu sprechen.',
    shareMessage: 'Die Trauer emotional durchleben — AWA',
  },
  zh: {
      badge: '流产之后 • 情感支持',
      title: '走过悲伤\n情感上的陪伴',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '走过这段经历，没有所谓正确的方式。每个人都有自己的方式和节奏。',
      contentsTitle: '本文内容',
      topics: [
        '真实而正当的悲伤',
        '因人而异的情绪',
        '日常生活中可能有帮助的事',
        '来自亲友的支持',
        '何时寻求专业帮助',
        '要点回顾',
      ],
      section1Body: '无论孕期进展到哪个阶段，悲伤、愤怒或空落落的感觉，都是面对这次失去时的正常反应。你的感受值得被认真对待。',
      section1InfoTitle: '请记住',
      section1InfoText: '走过这段经历，没有对错之分。你的每一种情绪都是合理的。',
      section2Body: '你可能会有其中的一种或几种感受，有时甚至会同时出现：',
      feelings: [
        {
          title: '悲伤',
          text: '一种时来时去的哀伤，有时会不期而至。',
        },
        {
          title: '愤怒',
          text: '可能是对自己、对这件事，或是对不公平的感受——这并不需要担心。',
        },
        {
          title: '空落落的感觉',
          text: '对刚刚发生的一切感到空茫或困惑。',
        },
      ],
      section3Body: '给自己时间，不施加压力，也不与他人比较，是疗愈中很重要的一部分。',
      dailySupport: [
        {
          title: '给自己时间',
          text: '不必给“好起来”设定期限，也不必有压力。',
        },
        {
          title: '不与他人比较',
          text: '每一种悲伤都是独一无二的，没有所谓正确的方式。',
        },
        {
          title: '把感受说出来',
          text: '把你的感受写下来或说出来，可能有助于减轻情绪的重量。',
        },
      ],
      section4Body: '与身边亲近的人、互助小组或专业人员聊一聊，可以帮助减轻这份重量。亲友可以这样帮助你：',
      supportTitle: '亲友可以如何给予支持',
      howToSupport: [
        '不带评判地倾听，即使说不出完美的话',
        '避免轻描淡写地看待这段经历（比如“没什么大不了”“你还可以再试”）',
        '给予陪伴，而不是急于提供解决办法',
        '在接下来的几周里持续关心',
      ],
      section5Body: '出现以下一些情况时，专业人员的支持可能会有帮助：',
      warningTitle: '需要留意的信号',
      attentionSigns: [
        '悲伤持续很久，而且越来越重，没有减轻',
        '日常生活变得难以应付',
        '出现明显的孤立感',
        '出现侵入性的想法，或明显的痛苦',
      ],
      section5InfoTitle: '你可以得到支持',
      section5InfoText: '助产士、医生、心理咨询师或互助小组可以倾听并陪伴你，不会评判你。',
      tipTitle: '小贴士',
      tipText: '寻求帮助并不是软弱的表现，而是在这段时间里照顾自己的一种方式。',
      summaryPoints: [
        '走过这段经历，没有对错之分。',
        '悲伤、愤怒或空落落的感觉，都是正常的反应。',
        '给自己时间，不施加压力，也不与他人比较，是疗愈的一部分。',
        '与身边亲近的人、互助小组或专业人员聊一聊，可以帮助减轻这份重量。',
      ],
      disclaimerText: '科普内容。本文不能替代专业建议。如果你正经历艰难的时刻，请不要犹豫，与医疗专业人员谈一谈。',
      shareMessage: '走过悲伤，情感上的陪伴 — AWA',
    },
  id: {
    badge: 'SETELAH KEGUGURAN • DUKUNGAN EMOSIONAL',
    title: 'Melewati duka\nsecara emosional',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten informatif',
    intro: 'Tidak ada cara yang benar untuk melewatinya. Setiap orang menjalaninya dengan caranya sendiri, dengan kecepatannya sendiri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Duka yang nyata dan sah',
      'Emosi yang berbeda pada tiap orang',
      'Apa yang mungkin membantu sehari-hari',
      'Dukungan dari orang-orang terdekat',
      'Kapan harus mencari bantuan profesional',
      'Poin penting',
    ],
    section1Body: 'Kesedihan, kemarahan, atau perasaan hampa adalah reaksi yang wajar terhadap kehilangan ini, apa pun tahap kehamilannya. Apa yang kamu rasakan layak diakui.',
    section1InfoTitle: 'Ingatlah',
    section1InfoText: 'Tidak ada cara yang benar atau salah untuk melewatinya. Setiap emosi yang kamu rasakan itu valid.',
    section2Body: 'Kamu mungkin merasakan satu atau beberapa hal berikut, kadang sekaligus:',
    feelings: [
      {
        title: 'Kesedihan',
        text: 'Duka yang bisa datang dan pergi, kadang tanpa diduga.',
      },
      {
        title: 'Kemarahan',
        text: 'Terhadap diri sendiri, keadaan, atau rasa ketidakadilan — dan itu bukan hal yang perlu dikhawatirkan.',
      },
      {
        title: 'Perasaan hampa',
        text: 'Rasa kosong atau bingung tentang apa yang baru saja terjadi.',
      },
    ],
    section3Body: 'Memberi dirimu waktu, tanpa tekanan atau perbandingan, adalah bagian penting dari proses pemulihan.',
    dailySupport: [
      {
        title: 'Memberi dirimu waktu',
        text: 'Tanpa tekanan atau tenggat untuk “merasa lebih baik.”',
      },
      {
        title: 'Tidak membandingkan diri dengan orang lain',
        text: 'Setiap duka itu unik; tidak ada cara yang benar untuk melewatinya.',
      },
      {
        title: 'Mengungkapkannya dengan kata-kata',
        text: 'Menulis atau membicarakan apa yang kamu rasakan dapat membantu meringankan beban emosimu.',
      },
    ],
    section4Body: 'Berbicara dengan orang terdekat, kelompok pendukung, atau tenaga profesional dapat membantu meringankan beban ini. Berikut cara orang-orang terdekat dapat membantu:',
    supportTitle: 'Bagaimana orang terdekat dapat memberi dukungan',
    howToSupport: [
      'Dengarkan tanpa menghakimi, meski tidak punya kata-kata yang sempurna',
      'Hindari meremehkan pengalaman ini (“itu bukan masalah besar,” “kamu bisa mencoba lagi”)',
      'Tawarkan kehadiranmu, bukan solusi',
      'Terus menanyakan kabarnya selama minggu-minggu berikutnya',
    ],
    section5Body: 'Beberapa tanda dapat menunjukkan bahwa dukungan profesional mungkin bermanfaat:',
    warningTitle: 'Tanda yang perlu diperhatikan',
    attentionSigns: [
      'Kesedihan berlangsung lama dan makin kuat, bukan mereda',
      'Menjalani aktivitas sehari-hari menjadi sulit',
      'Perasaan terisolasi yang berat muncul',
      'Muncul pikiran yang mengganggu atau tekanan batin yang berat',
    ],
    section5InfoTitle: 'Dukungan tersedia',
    section5InfoText: 'Bidan, dokter, psikolog, atau kelompok pendukung dapat mendengarkan dan mendampingimu, tanpa menghakimi.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Meminta bantuan bukan tanda kelemahan — itu cara merawat dirimu pada masa ini.',
    summaryPoints: [
      'Tidak ada cara yang benar atau salah untuk melewati pengalaman ini.',
      'Kesedihan, kemarahan, atau perasaan hampa adalah reaksi yang wajar.',
      'Memberi dirimu waktu, tanpa tekanan atau perbandingan, adalah bagian dari pemulihan.',
      'Berbicara dengan orang terdekat, kelompok pendukung, atau tenaga profesional dapat membantu meringankan beban ini.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran profesional. Jika kamu sedang melewati masa yang sulit, jangan ragu untuk berbicara dengan tenaga kesehatan.',
    shareMessage: 'Melewati duka, secara emosional — AWA',
  },
  hi: {
    badge: 'गर्भपात के बाद • भावनात्मक सहारा',
    title: 'दुख से भावनात्मक रूप से\nगुज़रना',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जानकारी के लिए सामग्री',
    intro: 'इस दौर से गुज़रने का कोई एक सही तरीका नहीं है। हर महिला अपने ढंग से और अपनी रफ़्तार से इससे गुज़रती है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'एक सच्चा और जायज़ दुख',
      'हर किसी में अलग-अलग भावनाएँ',
      'रोज़ाना क्या मदद कर सकता है',
      'अपनों का सहारा',
      'पेशेवर मदद कब लें',
      'मुख्य बातें',
    ],
    section1Body: 'उदासी, गुस्सा या खालीपन का एहसास इस नुकसान पर सामान्य प्रतिक्रियाएँ हैं, चाहे गर्भावस्था किसी भी चरण में रही हो। आप जो महसूस कर रही हैं, उसे स्वीकार किया जाना चाहिए।',
    section1InfoTitle: 'याद रखें',
    section1InfoText: 'इस दौर से गुज़रने का कोई सही या ग़लत तरीका नहीं है। आपकी हर भावना जायज़ है।',
    section2Body: 'आप इनमें से एक या ज़्यादा भावनाएँ महसूस कर सकती हैं, कभी-कभी सब एक साथ:',
    feelings: [
      {
        title: 'उदासी',
        text: 'एक ऐसा दुख जो आता-जाता रहता है, कभी-कभी अचानक भी।',
      },
      {
        title: 'गुस्सा',
        text: 'खुद पर, हालात पर, या नाइंसाफ़ी के एहसास पर — और इसमें चिंता की कोई बात नहीं है।',
      },
      {
        title: 'खालीपन का एहसास',
        text: 'जो हुआ उसे लेकर खालीपन या उलझन का एहसास।',
      },
    ],
    section3Body: 'खुद को समय देना, बिना किसी दबाव या तुलना के, उबरने का ज़रूरी हिस्सा है।',
    dailySupport: [
      {
        title: 'खुद को समय दें',
        text: '“ठीक हो जाने” के लिए किसी दबाव या समय-सीमा के बिना।',
      },
      {
        title: 'दूसरों से अपनी तुलना न करें',
        text: 'हर किसी का दुख अलग होता है; इससे गुज़रने का कोई एक सही तरीका नहीं है।',
      },
      {
        title: 'बातों को शब्द दें',
        text: 'जो आप महसूस करती हैं उसे लिखना या किसी से कहना भावनाओं का बोझ हल्का करने में मदद कर सकता है।',
      },
    ],
    section4Body: 'अपने किसी करीबी से, किसी सपोर्ट ग्रुप से या किसी विशेषज्ञ से बात करना इस बोझ को हल्का कर सकता है। अपने लोग इस तरह मदद कर सकते हैं:',
    supportTitle: 'कोई अपना कैसे सहारा दे सकता है',
    howToSupport: [
      'बिना कोई राय बनाए सुनें, भले ही सही शब्द न मिलें',
      'इस अनुभव को छोटा न बताएँ (“कोई बड़ी बात नहीं थी,” “आप फिर कोशिश कर सकती हैं”)',
      'हल देने के बजाय साथ रहें',
      'आने वाले हफ़्तों में भी हालचाल पूछते रहें',
    ],
    section5Body: 'कुछ संकेत बताते हैं कि पेशेवर सहारा मददगार हो सकता है:',
    warningTitle: 'इन संकेतों पर ध्यान दें',
    attentionSigns: [
      'उदासी लंबे समय तक रहती है और कम होने के बजाय बढ़ती जाती है',
      'रोज़मर्रा के काम करना मुश्किल हो जाता है',
      'अकेलेपन का गहरा एहसास घर कर जाता है',
      'बार-बार आने वाले परेशान करने वाले विचार या बहुत ज़्यादा बेचैनी महसूस होती है',
    ],
    section5InfoTitle: 'मदद उपलब्ध है',
    section5InfoText: 'दाई-नर्स (मिडवाइफ़), डॉक्टर, मनोवैज्ञानिक या सपोर्ट ग्रुप बिना किसी राय के आपकी बात सुन सकते हैं और आपका साथ दे सकते हैं।',
    tipTitle: 'जानने लायक',
    tipText: 'मदद माँगना कमज़ोरी की निशानी नहीं है — यह इस समय में अपना ख़्याल रखने का एक तरीका है।',
    summaryPoints: [
      'इस अनुभव से गुज़रने का कोई सही या ग़लत तरीका नहीं है।',
      'उदासी, गुस्सा या खालीपन का एहसास सामान्य प्रतिक्रियाएँ हैं।',
      'खुद को समय देना, बिना दबाव या तुलना के, उबरने का हिस्सा है।',
      'अपने किसी करीबी से, सपोर्ट ग्रुप से या किसी विशेषज्ञ से बात करना इस बोझ को हल्का कर सकता है।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख पेशेवर सलाह का विकल्प नहीं है। अगर आप मुश्किल दौर से गुज़र रही हैं, तो किसी स्वास्थ्य विशेषज्ञ से बात करने में संकोच न करें।',
    shareMessage: 'दुख से भावनात्मक रूप से गुज़रना — AWA',
  },
  sq: {
    badge: 'PAS NJË ABORTI SPONTAN • MBËSHTETJE EMOCIONALE',
    title: 'Kalimi përmes pikëllimit\nemocional',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje informuese',
    intro: 'Nuk ka një mënyrë të duhur për ta kaluar këtë. Secila e përjeton në mënyrën e vet, me ritmin e vet.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Një pikëllim real dhe i ligjshëm',
      'Emocione që ndryshojnë nga një person te tjetri',
      'Çfarë mund të ndihmojë çdo ditë',
      'Mbështetja nga të dashurit',
      'Kur duhet kërkuar ndihmë profesionale',
      'Pikat kryesore',
    ],
    section1Body: 'Trishtimi, zemërimi ose ndjenja e boshllëkut janë reagime normale ndaj kësaj humbjeje, pavarësisht nga faza e shtatzënisë. Ajo që ndjen ti meriton të njihet.',
    section1InfoTitle: 'Mbaje mend',
    section1InfoText: 'Nuk ka mënyrë të drejtë ose të gabuar për ta kaluar këtë. Çdo emocion që ndjen është i vlefshëm.',
    section2Body: 'Mund të ndjesh një ose disa nga këto, ndonjëherë të gjitha njëkohësisht:',
    feelings: [
      {
        title: 'Trishtimi',
        text: 'Një dhimbje shpirtërore që mund të vijë e të shkojë, ndonjëherë papritur.',
      },
      {
        title: 'Zemërimi',
        text: 'Ndaj vetes, ndaj situatës ose për një ndjenjë padrejtësie — dhe kjo nuk është asgjë për t’u shqetësuar.',
      },
      {
        title: 'Një ndjenjë boshllëku',
        text: 'Një ndjesi boshllëku ose hutimi për atë që sapo ndodhi.',
      },
    ],
    section3Body: 'Të japësh kohë vetes, pa presion e pa krahasime, është pjesë thelbësore e shërimit.',
    dailySupport: [
      {
        title: 'Jepi kohë vetes',
        text: 'Pa presion e pa afat për “të qenë mirë”.',
      },
      {
        title: 'Mos u krahaso me të tjerët',
        text: 'Çdo pikëllim është i veçantë; nuk ka mënyrë të drejtë për ta kaluar.',
      },
      {
        title: 'Thuaji me fjalë',
        text: 'Të shkruarit ose të folurit për atë që ndjen mund të ndihmojë ta lehtësosh barrën e emocioneve.',
      },
    ],
    section4Body: 'Të flasësh me dikë të afërt, me një grup mbështetjeje ose me një profesionist mund ta lehtësojë këtë barrë. Ja si mund të ndihmojnë të dashurit:',
    supportTitle: 'Si mund të të mbështesë një i afërt',
    howToSupport: [
      'Të dëgjojë pa gjykuar, edhe pa pasur fjalët e përsosura',
      'Të shmangë minimizimin e përvojës (“nuk ishte ndonjë gjë e madhe”, “mund të provosh përsëri”)',
      'Të ofrojë praninë e tij, jo zgjidhje',
      'Të vazhdojë të pyesë se si je gjatë javëve që vijnë',
    ],
    section5Body: 'Disa shenja mund të tregojnë se mbështetja profesionale mund të jetë e dobishme:',
    warningTitle: 'Shenja për t’u vëzhguar',
    attentionSigns: [
      'Trishtimi zgjat shumë dhe shtohet në vend që të lehtësohet',
      'Bëhet e vështirë të funksionosh çdo ditë',
      'Shfaqet një ndjenjë e ndjeshme izolimi',
      'Shfaqen mendime ndërhyrëse ose shqetësim i madh',
    ],
    section5InfoTitle: 'Mbështetja ekziston',
    section5InfoText: 'Një mami, një mjek, një psikolog ose një grup mbështetjeje mund të të dëgjojë dhe të të mbështesë, pa të gjykuar.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Kërkimi i ndihmës nuk është shenjë dobësie — është një mënyrë për të kujdesur për veten gjatë kësaj kohe.',
    summaryPoints: [
      'Nuk ka mënyrë të drejtë ose të gabuar për ta kaluar këtë përvojë.',
      'Trishtimi, zemërimi ose ndjenja e boshllëkut janë reagime normale.',
      'Të japësh kohë vetes, pa presion e pa krahasime, është pjesë e shërimit.',
      'Të flasësh me dikë të afërt, me një grup mbështetjeje ose me një profesionist mund ta lehtësojë këtë barrë.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën profesionale. Nëse po kalon një periudhë të vështirë, mos ngurro të flasësh me një profesionist të shëndetësisë.',
    shareMessage: 'Kalimi përmes pikëllimit emocional — AWA',
  },
  ja: {
    badge: '流産のあとに・心のケア',
    title: '悲しみと向き合う\n心の過ごし方',
    metaDuration: '読了時間7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '情報提供コンテンツ',
    intro: '正しい過ごし方というものはありません。誰もが自分なりの形で、自分のペースで進んでいきます。',
    contentsTitle: 'この記事の内容',
    topics: [
      '確かにあって、自然な悲しみ',
      '人それぞれに異なる感情',
      '日々の生活で助けになること',
      '身近な人からの支え',
      '専門家の助けを求めるとき',
      'ポイントのまとめ',
    ],
    section1Body: '悲しみや怒り、心にぽっかり穴があいたような感覚は、妊娠の時期にかかわらず、この喪失に対する自然な反応です。今感じていることは、受け止められてよいものです。',
    section1InfoTitle: '心に留めておきたいこと',
    section1InfoText: 'この経験の過ごし方に、正解も間違いもありません。感じる気持ちはすべて、そのままで大切なものです。',
    section2Body: '次のような気持ちのうち、1つ、または複数を感じることがあります。ときには同時に押し寄せることもあります。',
    feelings: [
      {
        title: '悲しみ',
        text: '寄せては返す悲しみで、思いがけないときに訪れることもあります。',
      },
      {
        title: '怒り',
        text: '自分自身や状況、不公平さに向けられることがありますが、心配することではありません。',
      },
      {
        title: '空虚感',
        text: '起きたことに対して、心が空っぽになったような、あるいは混乱したような感覚です。',
      },
    ],
    section3Body: 'プレッシャーや他の人との比較から離れて、自分に時間を与えることは、回復に欠かせない大切な一部です。',
    dailySupport: [
      {
        title: '自分に時間を与える',
        text: '「元気にならなければ」という焦りや期限は持たなくて大丈夫です。',
      },
      {
        title: '他の人と比べない',
        text: '悲しみは一人ひとり異なり、正しい過ごし方というものはありません。',
      },
      {
        title: '言葉にしてみる',
        text: '感じていることを書いたり話したりすると、気持ちの重さが少し和らぐことがあります。',
      },
    ],
    section4Body: '身近な人や支援グループ、専門家に話すことで、この重さが軽くなることがあります。周りの人にできる支え方は次のとおりです。',
    supportTitle: '身近な人ができる支え方',
    howToSupport: [
      'うまい言葉が見つからなくても、判断せずに耳を傾ける',
      '経験を軽く扱わない（「たいしたことじゃない」「また次があるよ」など）',
      '解決策よりも、そばにいることを大切にする',
      'その後の数週間も、気にかけて声をかけ続ける',
    ],
    section5Body: '次のようなサインがあるときは、専門家の支えが助けになるかもしれません。',
    warningTitle: '気をつけたいサイン',
    attentionSigns: [
      '悲しみが長く続き、和らぐどころか強くなっていく',
      '日常生活を送ることが難しくなる',
      '強い孤立感に包まれる',
      '頭から離れない考えや、強い苦痛が現れる',
    ],
    section5InfoTitle: '支えを求めることができます',
    section5InfoText: '助産師、医師、心理士、支援グループは、判断することなく話を聞き、寄り添うことができます。',
    tipTitle: '知っておきたいこと',
    tipText: '助けを求めることは弱さではなく、この時期に自分をいたわるための方法です。',
    summaryPoints: [
      'この経験の過ごし方に、正解も間違いもありません。',
      '悲しみや怒り、空虚感は、自然な反応です。',
      'プレッシャーや比較から離れて自分に時間を与えることも、回復の一部です。',
      '身近な人や支援グループ、専門家に話すことで、この重さが軽くなることがあります。',
    ],
    disclaimerText: '情報提供を目的としたコンテンツです。この記事は専門的なアドバイスに代わるものではありません。つらい時期を過ごしているときは、ためらわずに医療従事者に相談してください。',
    shareMessage: '悲しみと向き合う心の過ごし方 — AWA',
  },
  ko: {
    badge: '유산 이후 • 정서적 지지',
    title: '슬픔을 마음으로\n지나가기',
    metaDuration: '7분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '정보 제공 콘텐츠',
    intro: '정답이 있는 길은 없어요. 누구나 자기만의 방식으로, 자기만의 속도로 지나가요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '실제로 존재하는 정당한 슬픔',
      '사람마다 다른 감정',
      '일상에서 도움이 될 수 있는 것',
      '주변 사람들의 지지',
      '전문가의 도움을 받아야 할 때',
      '핵심 정리',
    ],
    section1Body: '슬픔, 분노, 공허한 느낌은 임신 시기와 상관없이 이런 상실에 대한 자연스러운 반응이에요. 지금 느끼는 감정은 있는 그대로 인정받을 만해요.',
    section1InfoTitle: '기억해 두세요',
    section1InfoText: '이 시간을 보내는 데 옳고 그른 방식은 없어요. 느끼는 모든 감정은 그 자체로 괜찮아요.',
    section2Body: '다음 중 하나 또는 여러 가지를 느낄 수 있고, 때로는 한꺼번에 느끼기도 해요.',
    feelings: [
      {
        title: '슬픔',
        text: '오고 가기를 반복하는 아픔으로, 때로는 예고 없이 찾아와요.',
      },
      {
        title: '분노',
        text: '나 자신, 상황, 혹은 불공평하다는 느낌을 향할 수 있어요. 걱정할 일이 아니에요.',
      },
      {
        title: '공허한 느낌',
        text: '방금 일어난 일에 대한 허전함이나 혼란스러움이에요.',
      },
    ],
    section3Body: '부담이나 비교 없이 스스로에게 시간을 주는 것은 회복에서 꼭 필요한 부분이에요.',
    dailySupport: [
      {
        title: '스스로에게 시간 주기',
        text: '“얼른 괜찮아져야 한다”는 압박이나 기한 없이요.',
      },
      {
        title: '다른 사람과 비교하지 않기',
        text: '슬픔은 저마다 달라요. 정해진 방식은 없어요.',
      },
      {
        title: '말이나 글로 표현하기',
        text: '느끼는 것을 글로 쓰거나 이야기하면 마음의 무게를 덜 수 있어요.',
      },
    ],
    section4Body: '가까운 사람, 지지 모임, 혹은 전문가와 이야기를 나누면 이 무게를 덜 수 있어요. 주변 사람들이 도울 수 있는 방법은 다음과 같아요.',
    supportTitle: '가까운 사람이 지지를 건네는 방법',
    howToSupport: [
      '딱 맞는 말을 찾지 못하더라도 판단하지 않고 귀 기울여 들어요',
      '경험을 가볍게 여기는 말은 피해요(“별일 아니야”, “또 시도하면 되지”)',
      '해결책을 내놓기보다 곁에 있어 줘요',
      '이후 몇 주 동안에도 계속 안부를 물어요',
    ],
    section5Body: '다음과 같은 신호가 있다면 전문가의 도움이 필요할 수 있어요.',
    warningTitle: '살펴봐야 할 신호',
    attentionSigns: [
      '슬픔이 오래 이어지고 나아지기보다 더 깊어져요',
      '일상생활을 하기 어려워져요',
      '심한 고립감이 들어요',
      '떠나지 않는 생각이나 심한 괴로움이 나타나요',
    ],
    section5InfoTitle: '도움을 받을 수 있어요',
    section5InfoText: '조산사, 의사, 심리 전문가, 지지 모임이 판단 없이 이야기를 들어 주고 곁에서 힘이 되어 줄 수 있어요.',
    tipTitle: '알아 두세요',
    tipText: '도움을 요청하는 것은 약함의 표시가 아니에요. 이 시기에 스스로를 돌보는 방법이에요.',
    summaryPoints: [
      '이 경험을 지나가는 데 옳고 그른 방식은 없어요.',
      '슬픔, 분노, 공허한 느낌은 자연스러운 반응이에요.',
      '부담이나 비교 없이 스스로에게 시간을 주는 것도 회복의 일부예요.',
      '가까운 사람, 지지 모임, 혹은 전문가와 이야기를 나누면 이 무게를 덜 수 있어요.',
    ],
    disclaimerText: '정보 제공 콘텐츠예요. 이 아티클은 전문가의 조언을 대신하지 않아요. 힘든 시간을 보내고 있다면 망설이지 말고 의료 전문가와 이야기해 보세요.',
    shareMessage: '슬픔을 마음으로 지나가기 — AWA',
  },
  'pt-PT': {
    badge: 'APÓS UM ABORTO ESPONTÂNEO • APOIO EMOCIONAL',
    title: 'Atravessar o luto\nemocionalmente',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo informativo',
    intro: 'Não existe uma forma certa de viver isto. Cada mulher atravessa este momento à sua maneira, ao seu ritmo.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Um luto real e legítimo',
      'Emoções que variam de mulher para mulher',
      'O que pode ajudar no dia a dia',
      'O apoio das pessoas próximas',
      'Quando procurar ajuda profissional',
      'Pontos-chave',
    ],
    section1Body: 'A tristeza, a raiva ou uma sensação de vazio são reações normais a esta perda, seja qual for a fase da gravidez. O que sente merece ser reconhecido.',
    section1InfoTitle: 'A reter',
    section1InfoText: 'Não existe uma forma certa ou errada de viver isto. Todas as emoções que sente são válidas.',
    section2Body: 'Pode sentir uma ou várias destas emoções, por vezes ao mesmo tempo:',
    feelings: [
      {
        title: 'Tristeza',
        text: 'Uma dor que pode ir e vir, por vezes de forma inesperada.',
      },
      {
        title: 'Raiva',
        text: 'Dirigida a si própria, à situação ou a um sentimento de injustiça — e não há motivo para se preocupar com isso.',
      },
      {
        title: 'Uma sensação de vazio',
        text: 'Uma sensação de vazio ou de confusão perante o que acabou de acontecer.',
      },
    ],
    section3Body: 'Dar-se tempo, sem pressão nem comparações, é uma parte essencial da recuperação.',
    dailySupport: [
      {
        title: 'Dar-se tempo',
        text: 'Sem pressão nem prazo para “se sentir melhor”.',
      },
      {
        title: 'Não se comparar com os outros',
        text: 'Cada luto é único; não existe uma forma certa de o viver.',
      },
      {
        title: 'Pôr em palavras',
        text: 'Escrever ou falar sobre o que sente pode ajudar a aliviar o peso das emoções.',
      },
    ],
    section4Body: 'Falar com alguém próximo, com um grupo de apoio ou com um profissional pode ajudar a aliviar este peso. Eis como as pessoas próximas podem ajudar:',
    supportTitle: 'Como uma pessoa próxima pode oferecer apoio',
    howToSupport: [
      'Ouvir sem julgar, mesmo sem ter as palavras perfeitas',
      'Evitar desvalorizar a experiência (“não foi nada de grave”, “pode tentar de novo”)',
      'Oferecer a sua presença em vez de soluções',
      'Continuar a acompanhar nas semanas seguintes',
    ],
    section5Body: 'Alguns sinais podem indicar que um apoio profissional poderia ser útil:',
    warningTitle: 'Sinais a que deve estar atenta',
    attentionSigns: [
      'A tristeza dura muito tempo e intensifica-se em vez de diminuir',
      'Torna-se difícil funcionar no dia a dia',
      'Instala-se uma sensação marcada de isolamento',
      'Surgem pensamentos intrusivos ou um sofrimento significativo',
    ],
    section5InfoTitle: 'Existe apoio disponível',
    section5InfoText: 'Uma parteira, um médico, um psicólogo ou um grupo de apoio pode ouvi-la e apoiá-la, sem julgamentos.',
    tipTitle: 'Bom saber',
    tipText: 'Pedir ajuda não é sinal de fraqueza — é uma forma de cuidar de si durante este período.',
    summaryPoints: [
      'Não existe uma forma certa ou errada de viver esta experiência.',
      'A tristeza, a raiva ou uma sensação de vazio são reações normais.',
      'Dar-se tempo, sem pressão nem comparações, faz parte da recuperação.',
      'Falar com alguém próximo, com um grupo de apoio ou com um profissional pode ajudar a aliviar este peso.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o aconselhamento profissional. Se estiver a atravessar um momento difícil, não hesite em falar com um profissional de saúde.',
    shareMessage: 'Atravessar o luto, emocionalmente — AWA',
  },
  bn: {
    badge: 'গর্ভপাতের পর • মানসিক সহায়তা',
    title: 'শোকের মধ্য দিয়ে\nমানসিকভাবে এগিয়ে চলা',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'তথ্যমূলক বিষয়বস্তু',
    intro: 'এর মধ্য দিয়ে যাওয়ার কোনো একটি সঠিক পথ নেই। প্রত্যেকে নিজের মতো করে, নিজের গতিতে এগিয়ে যান।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'একটি সত্যিকারের ও যথার্থ শোক',
      'মানুষভেদে ভিন্ন ভিন্ন অনুভূতি',
      'প্রতিদিন যা সাহায্য করতে পারে',
      'প্রিয়জনদের সহায়তা',
      'কখন পেশাদার সাহায্য নেবেন',
      'মূল কথা',
    ],
    section1Body: 'গর্ভাবস্থার যে পর্যায়েই হোক, এই ক্ষতির পর দুঃখ, রাগ বা শূন্যতার অনুভূতি স্বাভাবিক প্রতিক্রিয়া। আপনি যা অনুভব করছেন, তা স্বীকৃতি পাওয়ার যোগ্য।',
    section1InfoTitle: 'মনে রাখবেন',
    section1InfoText: 'এর মধ্য দিয়ে যাওয়ার কোনো সঠিক বা ভুল পথ নেই। আপনার প্রতিটি অনুভূতিই যথার্থ।',
    section2Body: 'আপনি এগুলোর এক বা একাধিক অনুভব করতে পারেন, কখনো কখনো একসঙ্গে সবগুলোই:',
    feelings: [
      {
        title: 'দুঃখ',
        text: 'এক ধরনের বেদনা, যা আসে আর যায়, কখনো কখনো অপ্রত্যাশিতভাবে।',
      },
      {
        title: 'রাগ',
        text: 'নিজের প্রতি, পরিস্থিতির প্রতি, কিংবা অবিচারের অনুভূতি থেকে — এতে দুশ্চিন্তার কিছু নেই।',
      },
      {
        title: 'শূন্যতার অনুভূতি',
        text: 'যা ঘটে গেল তা নিয়ে এক ধরনের শূন্যতা বা বিভ্রান্তি।',
      },
    ],
    section3Body: 'চাপ বা তুলনা ছাড়া নিজেকে সময় দেওয়া সুস্থ হয়ে ওঠার একটি অপরিহার্য অংশ।',
    dailySupport: [
      {
        title: 'নিজেকে সময় দিন',
        text: '“ভালো হয়ে ওঠার” জন্য কোনো চাপ বা সময়সীমা ছাড়াই।',
      },
      {
        title: 'অন্যদের সঙ্গে নিজেকে তুলনা করবেন না',
        text: 'প্রতিটি শোকই আলাদা; এর মধ্য দিয়ে যাওয়ার কোনো একটি সঠিক পথ নেই।',
      },
      {
        title: 'কথায় প্রকাশ করুন',
        text: 'আপনি যা অনুভব করেন তা লিখলে বা বললে আবেগের ভার কিছুটা হালকা হতে পারে।',
      },
    ],
    section4Body: 'কাছের কারও সঙ্গে, কোনো সহায়তা গোষ্ঠীর সঙ্গে বা কোনো পেশাজীবীর সঙ্গে কথা বললে এই ভার কিছুটা হালকা হতে পারে। প্রিয়জনেরা যেভাবে পাশে থাকতে পারেন:',
    supportTitle: 'প্রিয়জন কীভাবে সহায়তা করতে পারেন',
    howToSupport: [
      'বিচার না করে শুনুন, এমনকি সঠিক শব্দ খুঁজে না পেলেও',
      'অভিজ্ঞতাটিকে ছোট করে দেখবেন না (“তেমন কিছু নয়,” “আবার চেষ্টা করতে পারবেন”)',
      'সমাধান নয়, উপস্থিতি দিয়ে পাশে থাকুন',
      'পরের সপ্তাহগুলোতেও নিয়মিত খোঁজ নিন',
    ],
    section5Body: 'কিছু লক্ষণ ইঙ্গিত দিতে পারে যে পেশাদার সহায়তা উপকারী হতে পারে:',
    warningTitle: 'যেসব লক্ষণে নজর রাখবেন',
    attentionSigns: [
      'দুঃখ দীর্ঘ সময় ধরে থাকে এবং কমার বদলে বাড়তে থাকে',
      'প্রতিদিনের কাজকর্ম করা কঠিন হয়ে পড়ে',
      'উল্লেখযোগ্য একাকিত্ব বোধ দেখা দেয়',
      'বারবার ফিরে আসা অবাঞ্ছিত চিন্তা বা তীব্র মানসিক কষ্ট দেখা দেয়',
    ],
    section5InfoTitle: 'সহায়তা পাওয়া যায়',
    section5InfoText: 'ধাত্রী, ডাক্তার, মনোবিজ্ঞানী বা সহায়তা গোষ্ঠী বিচার না করেই আপনার কথা শুনতে ও আপনাকে সহায়তা করতে পারেন।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'সাহায্য চাওয়া দুর্বলতার লক্ষণ নয় — এটি এই সময়ে নিজের যত্ন নেওয়ার একটি উপায়।',
    summaryPoints: [
      'এই অভিজ্ঞতার মধ্য দিয়ে যাওয়ার কোনো সঠিক বা ভুল পথ নেই।',
      'দুঃখ, রাগ বা শূন্যতার অনুভূতি স্বাভাবিক প্রতিক্রিয়া।',
      'চাপ বা তুলনা ছাড়া নিজেকে সময় দেওয়া সুস্থ হয়ে ওঠার অংশ।',
      'কাছের কারও সঙ্গে, কোনো সহায়তা গোষ্ঠীর সঙ্গে বা কোনো পেশাজীবীর সঙ্গে কথা বললে এই ভার কিছুটা হালকা হতে পারে।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ পেশাদার পরামর্শের বিকল্প নয়। আপনি কঠিন সময় পার করতে থাকলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলতে দ্বিধা করবেন না।',
    shareMessage: 'শোকের মধ্য দিয়ে মানসিকভাবে এগিয়ে চলা — AWA',
  },
  da: {
    badge: 'EFTER ABORT • FØLELSESMÆSSIG STØTTE',
    title: 'At komme følelsesmæssigt\nvidere efter et tab',
    metaDuration: '7 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Informativt indhold',
    intro: 'Der er ingen enkelt rigtig vej igennem dette. Alle bevæger sig fremad på deres egen måde, i deres eget tempo.',
    contentsTitle: 'I denne artikel',
    topics: [
      'En reel og berettiget sorg',
      'Forskellige følelser hos forskellige mennesker',
      'Hvad der kan hjælpe dag til dag',
      'Støtte fra nærtstående',
      'Hvornår man skal søge professionel hjælp',
      'Vigtige pointer',
    ],
    section1Body: 'Uanset på hvilket tidspunkt i graviditeten det skete, er tristhed, vrede eller tomhedsfølelse normale reaktioner på dette tab. Det, du oplever, fortjener at blive anerkendt.',
    section1InfoTitle: 'Husk',
    section1InfoText: 'Der er ingen rigtig eller forkert måde at komme igennem dette på. Alle dine følelser er berettigede.',
    section2Body: 'Du kan opleve en eller flere af disse, sommetider alle på én gang:',
    feelings: [
      {
        title: 'Tristhed',
        text: 'En slags smerte, der kommer og går, sommetider uventet.',
      },
      {
        title: 'Vrede',
        text: 'Over for sig selv, over for situationen, eller fra en følelse af uretfærdighed — det er i orden.',
      },
      {
        title: 'Tomhedsfølelse',
        text: 'En slags tomhed eller forvirring over det, der skete.',
      },
    ],
    section3Body: 'At give sig selv tid uden pres eller sammenligninger er en uundværlig del af heling.',
    dailySupport: [
      {
        title: 'Giv dig selv tid',
        text: 'Uden pres eller deadline om at "komme over det".',
      },
      {
        title: 'Sammenlign dig ikke med andre',
        text: 'Enhver sorg er forskellig; der er ingen enkelt rigtig vej igennem dette.',
      },
      {
        title: 'Udtryk dig',
        text: 'At skrive eller tale om det, du føler, kan lette den følelsesmæssige byrde lidt.',
      },
    ],
    section4Body: 'At tale med en nær person, en støttegruppe eller en professionel kan gøre denne byrde lettere at bære. Sådan kan nærtstående støtte:',
    supportTitle: 'Hvordan nærtstående kan hjælpe',
    howToSupport: [
      'Lyt uden at dømme, selv hvis du ikke finder de rigtige ord',
      'Bagatelliser ikke oplevelsen ("det er ikke så slemt", "du kan prøve igen")',
      'Vær til stede med din tilstedeværelse, ikke løsninger',
      'Tjek ind regelmæssigt i de kommende uger',
    ],
    section5Body: 'Visse tegn kan indikere, at professionel støtte kan være gavnlig:',
    warningTitle: 'Tegn at holde øje med',
    attentionSigns: [
      'Tristheden varer ved i lang tid og forværres frem for at aftage',
      'Det bliver svært at klare daglige aktiviteter',
      'En markant følelse af ensomhed opstår',
      'Tilbagevendende påtrængende tanker eller intense følelsesmæssige smerter opstår',
    ],
    section5InfoTitle: 'Hjælp er tilgængelig',
    section5InfoText: 'Jordemødre, læger, psykologer eller støttegrupper kan lytte og støtte dig uden at dømme.',
    tipTitle: 'Godt at vide',
    tipText: 'At søge hjælp er ikke et tegn på svaghed — det er en måde at tage sig af sig selv på i denne tid.',
    summaryPoints: [
      'Der er ingen rigtig eller forkert måde at komme igennem denne oplevelse på.',
      'Tristhed, vrede eller tomhedsfølelse er normale reaktioner.',
      'At give sig selv tid uden pres eller sammenligninger er en del af helingen.',
      'At tale med en nær person, en støttegruppe eller en professionel kan gøre byrden lettere.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter ikke professionel rådgivning. Tøv ikke med at tale med en sundhedsprofessionel, hvis du gennemgår svære tider.',
    shareMessage: 'At komme følelsesmæssigt videre efter et tab — AWA',
  },
  sv: {
    badge: 'EFTER ABORT • FÖLELSESMÄSSIG STÖTTE',
    title: 'At komme fölelsesmässigt\nvidere efter et tab',
    metaDuration: '7 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Informativt indhold',
    intro: 'Der ar ingen enkelt rigtig vej igennem dette. Alla beväger sig fremad på deres egen måde, i deres eget tempo.',
    contentsTitle: 'I denne artikel',
    topics: [
      'En reel och berettiget sorg',
      'Forskellige fölelser hos forskellige mennesker',
      'Hvad der kan hjälpe dag till dag',
      'Stötte fran närtstående',
      'Hvornår man skal söge professionel hjälp',
      'Vigtige pointer',
    ],
    section1Body: 'Uanset på hvilket tidspunkt i graviditeten det skete, ar tristhed, vrede eller tomhedsfölelse normale reaktioner på dette tab. Det, du oplever, fortjener at blive anerkendt.',
    section1InfoTitle: 'Husk',
    section1InfoText: 'Der ar ingen rigtig eller forkert måde at komme igennem dette på. Alla dina fölelser ar berettigede.',
    section2Body: 'Du kan opleve en eller flere av disse, sommetider alla på én gang:',
    feelings: [
      {
        title: 'Tristhed',
        text: 'En slags smerte, der kommer och går, sommetider uventet.',
      },
      {
        title: 'Vrede',
        text: 'Over for sig selv, over for situationen, eller fran en fölelse av uretfärdighed — det ar i orden.',
      },
      {
        title: 'Tomhedsfölelse',
        text: 'En slags tomhed eller forvirring over det, der skete.',
      },
    ],
    section3Body: 'At give sig selv tid uden pres eller sammenligninger ar en uundvärlig del av heling.',
    dailySupport: [
      {
        title: 'Giv dig selv tid',
        text: 'Uden pres eller deadline om at "komme over det".',
      },
      {
        title: 'Sammenlign dig inte med andre',
        text: 'Enhver sorg ar forskellig; der ar ingen enkelt rigtig vej igennem dette.',
      },
      {
        title: 'Udtryk dig',
        text: 'At skrive eller tale om det, du föler, kan lette den fölelsesmässige byrde lidt.',
      },
    ],
    section4Body: 'At tale med en när person, en stöttegruppe eller en professionel kan göre denne byrde lettere at bäre. Sådan kan närtstående stötte:',
    supportTitle: 'Hvordan närtstående kan hjälpe',
    howToSupport: [
      'Lyt uden at dömme, selv hvis du inte finder de rigtige ord',
      'Bagatelliser inte oplevelsen ("det ar inte så slemt", "du kan pröve igen")',
      'Vär till stede med din tilstedevärelse, inte lösninger',
      'Tjek ind regelmässigt i de kommende veckor',
    ],
    section5Body: 'Visse tegn kan indikere, at professionel stötte kan väre gavnlig:',
    warningTitle: 'Tegn at holde öje med',
    attentionSigns: [
      'Tristheden varer ved i lang tid och forvärres frem for att aftage',
      'Det bliver svärt at klare daglige aktiviteter',
      'En markant fölelse av ensomhed opstår',
      'Tilbagevendende påträngende tanker eller intense fölelsesmässige smartor opstår',
    ],
    section5InfoTitle: 'Hjälp ar tilgängelig',
    section5InfoText: 'Jordemödre, läger, psykologer eller stöttegrupper kan lytte och stötte dig uden at dömme.',
    tipTitle: 'Godt at vide',
    tipText: 'At söge hjälp ar inte et tegn på svaghed — det ar en måde at tage sig av sig selv på i denne tid.',
    summaryPoints: [
      'Der ar ingen rigtig eller forkert måde at komme igennem denne oplevelse på.',
      'Tristhed, vrede eller tomhedsfölelse ar normale reaktioner.',
      'At give sig selv tid uden pres eller sammenligninger ar en del av helingen.',
      'At tale med en när person, en stöttegruppe eller en professionel kan göre byrden lettere.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte professionel rådgivning. Töv inte med at tale med en halsasprofessionel, hvis du gennemgår sväre tider.',
    shareMessage: 'At komme fölelsesmässigt videre efter et tab — AWA',
  },
  nb: {
    badge: 'ETTER EN SPONTANABORT • FØLELSESMESSIG STØTTE',
    title: 'Gå gjennom sorgen\nfølelsesmessig',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Informasjonsinnhold',
    intro:
      'Det finnes ingen riktig måte å komme gjennom dette på. Hver og en går gjennom det på sin egen måte, i sitt eget tempo.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'En reell og legitim sorg',
      'Følelser som varierer fra person til person',
      'Hva som kan hjelpe i hverdagen',
      'Støtte fra de nærmeste',
      'Når du bør søke profesjonell hjelp',
      'Det viktigste å huske',
    ],
    section1Body:
      'Tristhet, sinne eller en følelse av tomhet er normale reaksjoner på dette tapet, uansett hvor langt svangerskapet var kommet. Det du kjenner, fortjener å bli anerkjent.',
    section1InfoTitle: 'Husk',
    section1InfoText:
      'Det finnes ingen riktig eller gal måte å komme gjennom dette på. Alle følelsene du kjenner, er gyldige.',
    section2Body:
      'Du kan kjenne på én eller flere av disse, noen ganger alle på en gang:',
    feelings: [
      {
        title: 'Tristhet',
        text: 'En sorg som kan komme og gå, noen ganger uventet.',
      },
      {
        title: 'Sinne',
        text: 'Mot deg selv, situasjonen eller en følelse av urettferdighet – og det er ikke noe å bekymre seg for.',
      },
      {
        title: 'En følelse av tomhet',
        text: 'En følelse av tomhet eller forvirring over det som nettopp skjedde.',
      },
    ],
    section3Body:
      'Å gi seg selv tid, uten press eller sammenligning, er en viktig del av helingen.',
    dailySupport: [
      {
        title: 'Gi deg selv tid',
        text: 'Uten press eller frist for å «få det bedre».',
      },
      {
        title: 'Ikke sammenligne deg med andre',
        text: 'Hver sorg er unik; det finnes ingen riktig måte å komme gjennom den på.',
      },
      {
        title: 'Sette ord på det',
        text: 'Å skrive eller snakke om det du kjenner, kan bidra til å lette tyngden av følelsene.',
      },
    ],
    section4Body:
      'Å snakke med noen du står nær, en støttegruppe eller en fagperson kan bidra til å lette denne tyngden. Slik kan de nærmeste hjelpe:',
    supportTitle: 'Hvordan en nærstående kan gi støtte',
    howToSupport: [
      'Lytt uten å dømme, selv uten å ha de perfekte ordene',
      'Unngå å bagatellisere opplevelsen («det var ikke så farlig», «dere kan prøve igjen»)',
      'Tilby nærvær heller enn løsninger',
      'Fortsett å høre hvordan det går i ukene som følger',
    ],
    section5Body:
      'Noen tegn kan tyde på at profesjonell støtte kan være nyttig:',
    warningTitle: 'Tegn å være oppmerksom på',
    attentionSigns: [
      'Tristheten varer lenge og forsterkes i stedet for å avta',
      'Det blir vanskelig å fungere i hverdagen',
      'En betydelig følelse av isolasjon setter inn',
      'Påtrengende tanker eller sterk nød dukker opp',
    ],
    section5InfoTitle: 'Støtte finnes',
    section5InfoText:
      'En jordmor, lege, psykolog eller støttegruppe kan lytte til deg og støtte deg, uten å dømme.',
    tipTitle: 'Godt å vite',
    tipText:
      'Å be om hjelp er ikke et tegn på svakhet – det er en måte å ta vare på deg selv i denne tiden.',
    summaryPoints: [
      'Det finnes ingen riktig eller gal måte å komme gjennom denne opplevelsen på.',
      'Tristhet, sinne eller en følelse av tomhet er normale reaksjoner.',
      'Å gi seg selv tid, uten press eller sammenligning, er en del av helingen.',
      'Å snakke med noen du står nær, en støttegruppe eller en fagperson kan bidra til å lette denne tyngden.',
    ],
    disclaimerText:
      'Informasjonsinnhold. Denne artikkelen erstatter ikke profesjonell rådgivning. Hvis du går gjennom en vanskelig tid, ikke nøl med å snakke med helsepersonell.',
    shareMessage: 'Gå gjennom sorgen følelsesmessig – AWA',
  },
  pl: {
    badge: 'PO PORONIENIU • WSPARCIE EMOCJONALNE',
    title: 'Przejście przez żałobę\nemocjonalnie',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść informacyjna',
    intro:
      'Nie ma jednego właściwego sposobu, by przez to przejść. Każda przechodzi przez to na swój sposób, we własnym tempie.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Prawdziwa i uprawniona żałoba',
      'Emocje, które różnią się u poszczególnych osób',
      'Co może pomóc na co dzień',
      'Wsparcie bliskich',
      'Kiedy poszukać profesjonalnej pomocy',
      'Najważniejsze wnioski',
    ],
    section1Body:
      'Smutek, złość czy poczucie pustki to normalne reakcje na tę stratę, niezależnie od etapu ciąży. To, co czujesz, zasługuje na uznanie.',
    section1InfoTitle: 'Pamiętaj',
    section1InfoText:
      'Nie ma właściwego ani niewłaściwego sposobu, by przez to przejść. Każda emocja, którą czujesz, jest uprawniona.',
    section2Body:
      'Możesz odczuwać jedno lub kilka z poniższych, czasem wszystko naraz:',
    feelings: [
      {
        title: 'Smutek',
        text: 'Żal, który może przychodzić i odchodzić, czasem niespodziewanie.',
      },
      {
        title: 'Złość',
        text: 'Na siebie, na sytuację lub z poczucia niesprawiedliwości — i nie ma w tym nic niepokojącego.',
      },
      {
        title: 'Poczucie pustki',
        text: 'Poczucie pustki lub zagubienia wobec tego, co się właśnie wydarzyło.',
      },
    ],
    section3Body:
      'Danie sobie czasu, bez presji i porównań, jest istotną częścią powrotu do równowagi.',
    dailySupport: [
      {
        title: 'Dawanie sobie czasu',
        text: 'Bez presji i terminu, by „poczuć się lepiej”.',
      },
      {
        title: 'Nieporównywanie się z innymi',
        text: 'Każda żałoba jest wyjątkowa; nie ma właściwego sposobu, by przez nią przejść.',
      },
      {
        title: 'Ubieranie tego w słowa',
        text: 'Pisanie lub mówienie o tym, co czujesz, może pomóc zmniejszyć ciężar emocji.',
      },
    ],
    section4Body:
      'Rozmowa z kimś bliskim, grupą wsparcia lub specjalistą może pomóc ten ciężar zmniejszyć. Oto, jak mogą pomóc bliscy:',
    supportTitle: 'Jak bliska osoba może okazać wsparcie',
    howToSupport: [
      'Słuchać bez oceniania, nawet nie mając idealnych słów',
      'Unikać bagatelizowania tego doświadczenia („to nic wielkiego”, „możesz spróbować jeszcze raz”)',
      'Ofiarować swoją obecność zamiast rozwiązań',
      'Dopytywać o samopoczucie także w kolejnych tygodniach',
    ],
    section5Body:
      'Niektóre objawy mogą wskazywać, że pomocne mogłoby być wsparcie specjalisty:',
    warningTitle: 'Objawy, na które warto zwracać uwagę',
    attentionSigns: [
      'Smutek trwa długo i nasila się zamiast słabnąć',
      'Funkcjonowanie na co dzień staje się trudne',
      'Pojawia się silne poczucie osamotnienia',
      'Pojawiają się natrętne myśli lub silne cierpienie',
    ],
    section5InfoTitle: 'Wsparcie jest dostępne',
    section5InfoText:
      'Położna, lekarz, psycholog lub grupa wsparcia mogą Cię wysłuchać i wesprzeć, bez oceniania.',
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Proszenie o pomoc nie jest oznaką słabości — to sposób na zadbanie o siebie w tym czasie.',
    summaryPoints: [
      'Nie ma właściwego ani niewłaściwego sposobu, by przejść przez to doświadczenie.',
      'Smutek, złość czy poczucie pustki to normalne reakcje.',
      'Danie sobie czasu, bez presji i porównań, jest częścią powrotu do równowagi.',
      'Rozmowa z kimś bliskim, grupą wsparcia lub specjalistą może pomóc zmniejszyć ten ciężar.',
    ],
    disclaimerText:
      'Treść informacyjna. Ten artykuł nie zastępuje porady specjalisty. Jeśli przechodzisz przez trudny czas, nie wahaj się porozmawiać ze specjalistą.',
    shareMessage: 'Przejście przez żałobę, emocjonalnie — AWA',
  },
  uk: {
    badge: 'ПІСЛЯ ВИКИДНЯ • ЕМОЦІЙНА ПІДТРИМКА',
    title: 'Емоційне проживання\nжалоби',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Інформаційний вміст',
    intro:
      'Немає єдиного правильного способу пройти через це. Кожна проходить це по-своєму, у власному темпі.',
    contentsTitle: 'У цій статті',
    topics: [
      'Справжня й виправдана жалоба',
      'Емоції, що різняться в різних людей',
      'Що може допомогти щодня',
      'Підтримка близьких',
      'Коли шукати професійної допомоги',
      'Головні висновки',
    ],
    section1Body:
      'Смуток, гнів чи відчуття порожнечі — нормальні реакції на цю втрату, незалежно від терміну вагітності. Те, що ви відчуваєте, заслуговує на визнання.',
    section1InfoTitle: 'Пам’ятайте',
    section1InfoText:
      'Немає правильного чи неправильного способу пройти через це. Кожна емоція, яку ви відчуваєте, виправдана.',
    section2Body:
      'Ви можете відчувати одне чи кілька з наведеного, іноді все одночасно:',
    feelings: [
      {
        title: 'Смуток',
        text: 'Скорбота, що може приходити й відходити, іноді несподівано.',
      },
      {
        title: 'Гнів',
        text: 'На себе, на ситуацію або від відчуття несправедливості — і в цьому немає нічого тривожного.',
      },
      {
        title: 'Відчуття порожнечі',
        text: 'Відчуття порожнечі або розгубленості щодо того, що сталося.',
      },
    ],
    section3Body:
      'Дати собі час, без тиску й порівнянь, — істотна частина зцілення.',
    dailySupport: [
      {
        title: 'Дати собі час',
        text: 'Без тиску й строку, коли треба «почуватися краще».',
      },
      {
        title: 'Не порівнювати себе з іншими',
        text: 'Кожна жалоба унікальна; немає правильного способу її пройти.',
      },
      {
        title: 'Висловити словами',
        text: 'Писати або говорити про те, що ви відчуваєте, може допомогти полегшити тягар емоцій.',
      },
    ],
    section4Body:
      'Розмова з кимось близьким, групою підтримки або фахівцем може допомогти полегшити цей тягар. Ось як можуть допомогти близькі:',
    supportTitle: 'Як близька людина може запропонувати підтримку',
    howToSupport: [
      'Слухати без осуду, навіть не маючи ідеальних слів',
      'Уникати применшення цього досвіду («нічого страшного», «можна спробувати ще раз»)',
      'Пропонувати свою присутність замість рішень',
      'Продовжувати цікавитися самопочуттям і в наступні тижні',
    ],
    section5Body:
      'Деякі ознаки можуть вказувати, що допомога фахівця могла б бути корисною:',
    warningTitle: 'Ознаки, на які варто звертати увагу',
    attentionSigns: [
      'Смуток триває довго й посилюється, а не слабшає',
      'Стає важко функціонувати щодня',
      'З’являється виразне відчуття ізоляції',
      'З’являються нав’язливі думки або виразне страждання',
    ],
    section5InfoTitle: 'Підтримка доступна',
    section5InfoText:
      'Акушерка, лікар, психолог або група підтримки можуть вислухати й підтримати вас, без осуду.',
    tipTitle: 'Варто знати',
    tipText:
      'Просити про допомогу — не ознака слабкості, а спосіб подбати про себе в цей час.',
    summaryPoints: [
      'Немає правильного чи неправильного способу пережити цей досвід.',
      'Смуток, гнів чи відчуття порожнечі — нормальні реакції.',
      'Дати собі час, без тиску й порівнянь, — частина зцілення.',
      'Розмова з кимось близьким, групою підтримки або фахівцем може допомогти полегшити цей тягар.',
    ],
    disclaimerText:
      'Інформаційний вміст. Ця стаття не замінює професійної поради. Якщо ви переживаєте важкий час, не вагайтеся поговорити з медичним фахівцем.',
    shareMessage: 'Емоційне проживання жалоби — AWA',
  },
  cs: {
    badge: 'PO POTRATU • EMOČNÍ PODPORA',
    title: 'Emoční zvládání\nsmutku',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Informativní obsah',
    intro:
      'Neexistuje správný způsob, jak tímto projít. Každá žena to prožívá po svém, vlastním tempem.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Skutečný a oprávněný smutek',
      'Emoce, které se u každé ženy liší',
      'Co může pomoci v každodenním životě',
      'Podpora blízkých',
      'Kdy vyhledat odbornou pomoc',
      'Hlavní poznatky',
    ],
    section1Body:
      'Smutek, hněv nebo pocit prázdnoty jsou normální reakce na tuto ztrátu, bez ohledu na fázi těhotenství. To, co cítíte, si zaslouží uznání.',
    section1InfoTitle: 'Mějte na paměti',
    section1InfoText:
      'Neexistuje správný ani špatný způsob, jak tímto projít. Každá emoce, kterou cítíte, je oprávněná.',
    section2Body:
      'Můžete cítit jednu nebo několik z těchto věcí, někdy všechny najednou:',
    feelings: [
      {
        title: 'Smutek',
        text: 'Zármutek, který může přicházet a odcházet, někdy nečekaně.',
      },
      {
        title: 'Hněv',
        text: 'Vůči sobě, situaci nebo pocitu nespravedlnosti — a není to nic, čeho byste se měla obávat.',
      },
      {
        title: 'Pocit prázdnoty',
        text: 'Pocit prázdnoty nebo zmatku z toho, co se právě stalo.',
      },
    ],
    section3Body:
      'Dopřát si čas, bez tlaku a srovnávání, je zásadní součástí uzdravování.',
    dailySupport: [
      {
        title: 'Dopřát si čas',
        text: 'Bez tlaku a bez termínu, kdy se „máte cítit lépe“.',
      },
      {
        title: 'Nesrovnávat se s jinými',
        text: 'Každý smutek je jedinečný; neexistuje správný způsob, jak jím projít.',
      },
      {
        title: 'Vyjádřit to slovy',
        text: 'Psaní nebo mluvení o tom, co cítíte, může pomoci odlehčit váze emocí.',
      },
    ],
    section4Body:
      'Rozhovor s někým blízkým, podpůrnou skupinou nebo odborníkem může pomoci tuto tíhu odlehčit. Takto mohou pomoci blízcí:',
    supportTitle: 'Jak může blízká osoba nabídnout podporu',
    howToSupport: [
      'Naslouchat bez soudů, i bez dokonalých slov',
      'Nezlehčovat zkušenost („nebylo to nic velkého“, „můžete to zkusit znovu“)',
      'Nabídnout svou přítomnost místo řešení',
      'Zajímat se i v následujících týdnech',
    ],
    section5Body:
      'Některé příznaky mohou naznačovat, že by mohla být užitečná odborná podpora:',
    warningTitle: 'Příznaky, kterých si všímat',
    attentionSigns: [
      'Smutek trvá dlouho a sílí místo aby ustupoval',
      'Je obtížné fungovat v každodenním životě',
      'Zmocňuje se vás výrazný pocit izolace',
      'Objevují se vtíravé myšlenky nebo výrazná tíseň',
    ],
    section5InfoTitle: 'Podpora je k dispozici',
    section5InfoText:
      'Porodní asistentka, lékař, psycholog nebo podpůrná skupina vás může vyslechnout a podpořit, bez souzení.',
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Požádat o pomoc není známkou slabosti — je to způsob, jak o sebe v tomto období pečovat.',
    summaryPoints: [
      'Neexistuje správný ani špatný způsob, jak tímto zážitkem projít.',
      'Smutek, hněv nebo pocit prázdnoty jsou normální reakce.',
      'Dopřát si čas, bez tlaku a srovnávání, je součástí uzdravování.',
      'Rozhovor s někým blízkým, podpůrnou skupinou nebo odborníkem může pomoci tuto tíhu odlehčit.',
    ],
    disclaimerText:
      'Informativní obsah. Tento článek nenahrazuje odbornou radu. Pokud procházíte těžkým obdobím, neváhejte si promluvit se zdravotnickým pracovníkem.',
    shareMessage: 'Emoční zvládání smutku — AWA',
  },
  sk: {
    badge: 'PO POTRATE • EMOČNÁ PODPORA',
    title: 'Prežívanie smútku\nemočne',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Informatívny obsah',
    intro:
      'Neexistuje správny spôsob, ako tým prejsť. Každá žena to prežíva po svojom, vlastným tempom.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Skutočný a oprávnený smútok',
      'Emócie, ktoré sa líšia od ženy k žene',
      'Čo môže pomôcť v každodennom živote',
      'Podpora blízkych',
      'Kedy vyhľadať odbornú pomoc',
      'Hlavné body',
    ],
    section1Body:
      'Smútok, hnev alebo pocit prázdnoty sú normálnymi reakciami na túto stratu, nech je štádium tehotenstva akékoľvek. To, čo cítite, si zaslúži uznanie.',
    section1InfoTitle: 'Pamätajte',
    section1InfoText:
      'Neexistuje správny ani nesprávny spôsob, ako tým prejsť. Každá emócia, ktorú cítite, je oprávnená.',
    section2Body:
      'Môžete cítiť jednu alebo viacero z týchto emócií, niekedy všetky naraz:',
    feelings: [
      {
        title: 'Smútok',
        text: 'Žiaľ, ktorý môže prichádzať a odchádzať, niekedy neočakávane.',
      },
      {
        title: 'Hnev',
        text: 'Voči sebe, situácii alebo pocitu nespravodlivosti — a nie je to dôvod na obavy.',
      },
      {
        title: 'Pocit prázdnoty',
        text: 'Pocit prázdnoty alebo zmätku z toho, čo sa práve stalo.',
      },
    ],
    section3Body:
      'Dopriať si čas, bez tlaku a porovnávania, je podstatnou súčasťou uzdravovania.',
    dailySupport: [
      {
        title: 'Doprajte si čas',
        text: 'Bez tlaku a lehoty na to, aby ste sa „cítili lepšie“.',
      },
      {
        title: 'Neporovnávajte sa s inými',
        text: 'Každý smútok je jedinečný; neexistuje správny spôsob, ako ním prejsť.',
      },
      {
        title: 'Vyjadrite to slovami',
        text: 'Písanie alebo rozprávanie o tom, čo cítite, môže pomôcť zmierniť ťarchu emócií.',
      },
    ],
    section4Body:
      'Rozhovor s blízkou osobou, podporná skupina alebo odborník môžu pomôcť túto ťarchu zmierniť. Takto môžu pomôcť blízki:',
    supportTitle: 'Ako môže blízka osoba poskytnúť podporu',
    howToSupport: [
      'Počúvať bez posudzovania, aj bez dokonalých slov',
      'Nezľahčovať zážitok („nebolo to nič veľké“, „môžete to skúsiť znova“)',
      'Ponúknuť svoju prítomnosť namiesto riešení',
      'Pýtať sa, ako sa má, aj v nasledujúcich týždňoch',
    ],
    section5Body:
      'Niektoré znaky môžu naznačovať, že by mohla byť užitočná odborná podpora:',
    warningTitle: 'Znaky, ktoré treba sledovať',
    attentionSigns: [
      'Smútok trvá dlho a zosilňuje sa, namiesto aby ustupoval',
      'Stáva sa ťažké fungovať v každodennom živote',
      'Objaví sa výrazný pocit izolácie',
      'Objavia sa vtieravé myšlienky alebo výrazná tieseň',
    ],
    section5InfoTitle: 'Podpora je dostupná',
    section5InfoText:
      'Pôrodná asistentka, lekár, psychológ alebo podporná skupina vás môže vypočuť a podporiť, bez posudzovania.',
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Požiadať o pomoc nie je znakom slabosti — je to spôsob, ako sa v tomto období postarať o seba.',
    summaryPoints: [
      'Neexistuje správny ani nesprávny spôsob, ako tento zážitok prežiť.',
      'Smútok, hnev alebo pocit prázdnoty sú normálne reakcie.',
      'Dopriať si čas, bez tlaku a porovnávania, je súčasťou uzdravovania.',
      'Rozhovor s blízkou osobou, podpornou skupinou alebo odborníkom môže pomôcť túto ťarchu zmierniť.',
    ],
    disclaimerText:
      'Informatívny obsah. Tento článok nenahrádza odbornú radu. Ak prechádzate náročným obdobím, neváhajte sa porozprávať so zdravotníckym pracovníkom.',
    shareMessage: 'Prežívanie smútku emočne — AWA',
  },
  hu: {
    badge: 'VETÉLÉS UTÁN • ÉRZELMI TÁMOGATÁS',
    title: 'A gyász érzelmi\nátélése',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Tájékoztató jellegű tartalom',
    intro:
      'Nincs helyes módja annak, hogy átmenj ezen. Mindenki a maga módján, a saját tempójában éli át.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Valódi és jogos gyász',
      'Nőnként eltérő érzelmek',
      'Ami a mindennapokban segíthet',
      'A szeretteid támogatása',
      'Mikor kérj szakmai segítséget',
      'Legfontosabb tudnivalók',
    ],
    section1Body:
      'A szomorúság, a harag vagy az ürességérzés normális reakciók erre a veszteségre, bármilyen szakaszban is volt a terhesség. Amit érzel, az megérdemli, hogy elismerjék.',
    section1InfoTitle: 'Tartsd észben',
    section1InfoText:
      'Nincs helyes vagy helytelen módja annak, hogy átmenj ezen. Minden érzelem, amit érzel, jogos.',
    section2Body:
      'Érezhetsz egyet vagy többet is ezek közül, néha mindet egyszerre:',
    feelings: [
      {
        title: 'Szomorúság',
        text: 'Fájdalom, amely jöhet és mehet, néha váratlanul.',
      },
      {
        title: 'Harag',
        text: 'Magad, a helyzet vagy egy igazságtalanságérzet iránt — és ez nem ok az aggodalomra.',
      },
      {
        title: 'Ürességérzés',
        text: 'Ürességérzés vagy zavarodottság a most történtek miatt.',
      },
    ],
    section3Body:
      'Az, hogy időt adsz magadnak, nyomás és összehasonlítás nélkül, a gyógyulás alapvető része.',
    dailySupport: [
      {
        title: 'Adj magadnak időt',
        text: 'Nyomás és „jobban érzés” határideje nélkül.',
      },
      {
        title: 'Ne hasonlítsd magad másokhoz',
        text: 'Minden gyász egyedi; nincs helyes módja annak, hogy átmenj rajta.',
      },
      {
        title: 'Fogalmazd meg szavakkal',
        text: 'Az, hogy leírod vagy elmondod, amit érzel, segíthet enyhíteni az érzelmek súlyát.',
      },
    ],
    section4Body:
      'Ha beszélsz egy közeli személlyel, egy támogató csoporttal vagy egy szakemberrel, az segíthet enyhíteni ezt a terhet. Így segíthetnek a szeretteid:',
    supportTitle: 'Hogyan nyújthat támogatást egy szerettünk',
    howToSupport: [
      'Ítélkezés nélkül hallgasson meg, még ha nincsenek is tökéletes szavai',
      'Kerülje az élmény kicsinyítését („nem volt nagy dolog”, „megpróbálhatjátok újra”)',
      'A megoldások helyett a jelenlétét ajánlja fel',
      'A következő hetekben is érdeklődjön, hogy vagy',
    ],
    section5Body:
      'Egyes jelek arra utalhatnak, hogy szakmai támogatás hasznos lehet:',
    warningTitle: 'Figyelendő jelek',
    attentionSigns: [
      'A szomorúság hosszú ideig tart, és enyhülés helyett erősödik',
      'Nehézzé válik a mindennapi működés',
      'Jelentős elszigeteltségérzet jelentkezik',
      'Tolakodó gondolatok vagy jelentős szorongás lép fel',
    ],
    section5InfoTitle: 'Van segítség',
    section5InfoText:
      'Egy szülésznő, orvos, pszichológus vagy támogató csoport meghallgathat és támogathat, ítélkezés nélkül.',
    tipTitle: 'Érdemes tudni',
    tipText:
      'Segítséget kérni nem a gyengeség jele — ez a módja annak, hogy ebben az időszakban gondoskodj magadról.',
    summaryPoints: [
      'Nincs helyes vagy helytelen módja annak, hogy átmenj ezen a tapasztalaton.',
      'A szomorúság, a harag vagy az ürességérzés normális reakciók.',
      'Az, hogy időt adsz magadnak, nyomás és összehasonlítás nélkül, a gyógyulás része.',
      'Ha beszélsz egy közeli személlyel, egy támogató csoporttal vagy egy szakemberrel, az segíthet enyhíteni ezt a terhet.',
    ],
    disclaimerText:
      'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a szakmai tanácsot. Ha nehéz időszakon mész át, ne habozz beszélni egészségügyi szakemberrel.',
    shareMessage: 'A gyász érzelmi átélése — AWA',
  },
  ro: {
    badge: 'DUPĂ UN AVORT SPONTAN • SPRIJIN EMOȚIONAL',
    title: 'Trecerea emoțională\nprin doliu',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut informativ',
    intro:
      'Nu există un mod corect de a trece prin aceasta. Fiecare femeie o trăiește în felul ei, în ritmul ei.',
    contentsTitle: 'În acest articol',
    topics: [
      'Un doliu real și legitim',
      'Emoții care variază de la o persoană la alta',
      'Ce poate ajuta zi de zi',
      'Sprijinul celor dragi',
      'Când să ceri ajutor profesionist',
      'Ce să reții',
    ],
    section1Body:
      'Tristețea, furia sau un sentiment de gol sunt reacții normale la această pierdere, indiferent de stadiul sarcinii. Ceea ce simți merită recunoscut.',
    section1InfoTitle: 'De ținut minte',
    section1InfoText:
      'Nu există un mod corect sau greșit de a trece prin aceasta. Fiecare emoție pe care o simți este validă.',
    section2Body:
      'Poți simți una sau mai multe dintre acestea, uneori toate deodată:',
    feelings: [
      {
        title: 'Tristețe',
        text: 'O durere care poate veni și pleca, uneori pe neașteptate.',
      },
      {
        title: 'Furie',
        text: 'Față de tine, față de situație sau un sentiment de nedreptate — și nu este nimic îngrijorător în asta.',
      },
      {
        title: 'Un sentiment de gol',
        text: 'O senzație de gol sau de confuzie față de ceea ce tocmai s-a întâmplat.',
      },
    ],
    section3Body:
      'Să-ți acorzi timp, fără presiune sau comparații, este o parte esențială a vindecării.',
    dailySupport: [
      {
        title: 'Să-ți acorzi timp',
        text: 'Fără presiune și fără un termen limită pentru a „te simți mai bine”.',
      },
      {
        title: 'Să nu te compari cu altele',
        text: 'Fiecare doliu este unic; nu există un mod corect de a trece prin el.',
      },
      {
        title: 'Să pui în cuvinte',
        text: 'A scrie sau a vorbi despre ce simți te poate ajuta să-ți ușurezi povara emoțiilor.',
      },
    ],
    section4Body:
      'Discuția cu o persoană apropiată, cu un grup de sprijin sau cu un profesionist te poate ajuta să-ți ușurezi această povară. Iată cum pot ajuta cei dragi:',
    supportTitle: 'Cum poate oferi sprijin o persoană dragă',
    howToSupport: [
      'Ascultă fără să judeci, chiar fără a avea cuvintele perfecte',
      'Evită să minimalizezi experiența („nu a fost mare lucru”, „poți încerca din nou”)',
      'Oferă-ți prezența, nu soluții',
      'Continuă să te interesezi de ea în săptămânile următoare',
    ],
    section5Body:
      'Unele semne pot indica faptul că un sprijin profesionist ar putea fi util:',
    warningTitle: 'Semne de urmărit',
    attentionSigns: [
      'Tristețea durează mult timp și se intensifică în loc să se estompeze',
      'Devine greu să funcționezi zi de zi',
      'Se instalează un sentiment important de izolare',
      'Apar gânduri intruzive sau o suferință importantă',
    ],
    section5InfoTitle: 'Sprijinul este disponibil',
    section5InfoText:
      'O moașă, un medic, un psiholog sau un grup de sprijin te poate asculta și sprijini, fără să te judece.',
    tipTitle: 'Bine de știut',
    tipText:
      'A cere ajutor nu este un semn de slăbiciune — este o modalitate de a avea grijă de tine în această perioadă.',
    summaryPoints: [
      'Nu există un mod corect sau greșit de a trece prin această experiență.',
      'Tristețea, furia sau un sentiment de gol sunt reacții normale.',
      'Să-ți acorzi timp, fără presiune sau comparații, face parte din vindecare.',
      'Discuția cu o persoană apropiată, cu un grup de sprijin sau cu un profesionist te poate ajuta să-ți ușurezi această povară.',
    ],
    disclaimerText:
      'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul profesionist. Dacă treci printr-o perioadă dificilă, nu ezita să vorbești cu un profesionist din domeniul sănătății.',
    shareMessage: 'Trecerea emoțională prin doliu — AWA',
  },
  bg: {
    badge: 'СЛЕД СПОНТАНЕН АБОРТ • ЕМОЦИОНАЛНА ПОДКРЕПА',
    title: 'Емоционално преминаване\nпрез скръбта',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Информационно съдържание',
    intro:
      'Няма правилен начин да преминеш през това. Всяка жена го преживява по свой начин, в свое темпо.',
    contentsTitle: 'В тази статия',
    topics: [
      'Реална и легитимна скръб',
      'Емоции, които варират от човек на човек',
      'Какво може да помогне ден за ден',
      'Подкрепата на близките',
      'Кога да потърсиш професионална помощ',
      'Какво да запомниш',
    ],
    section1Body:
      'Тъгата, гневът или чувството за празнота са нормални реакции на тази загуба, независимо от етапа на бременността. Онова, което чувстваш, заслужава да бъде признато.',
    section1InfoTitle: 'Помни',
    section1InfoText:
      'Няма правилен или грешен начин да преминеш през това. Всяка емоция, която чувстваш, е валидна.',
    section2Body:
      'Можеш да усещаш едно или повече от следните, понякога всичките наведнъж:',
    feelings: [
      {
        title: 'Тъга',
        text: 'Болка, която може да идва и да си отива, понякога неочаквано.',
      },
      {
        title: 'Гняв',
        text: 'Към себе си, към ситуацията или чувство за несправедливост — и в това няма нищо тревожно.',
      },
      {
        title: 'Чувство за празнота',
        text: 'Усещане за празнота или объркване от случилото се.',
      },
    ],
    section3Body:
      'Да си дадеш време, без натиск или сравнения, е съществена част от изцелението.',
    dailySupport: [
      {
        title: 'Да си дадеш време',
        text: 'Без натиск и без краен срок да „се почувстваш по-добре“.',
      },
      {
        title: 'Да не се сравняваш с другите',
        text: 'Всяка скръб е уникална; няма правилен начин да преминеш през нея.',
      },
      {
        title: 'Да я изразиш с думи',
        text: 'Да пишеш или говориш за това, което чувстваш, може да помогне да облекчиш тежестта на емоциите си.',
      },
    ],
    section4Body:
      'Разговорът с близък човек, група за подкрепа или специалист може да помогне да облекчиш тази тежест. Ето как близките могат да помогнат:',
    supportTitle: 'Как близък човек може да предложи подкрепа',
    howToSupport: [
      'Слушай без да съдиш, дори без да имаш съвършените думи',
      'Избягвай да омаловажаваш преживяването („не беше голяма работа“, „можеш да опиташ отново“)',
      'Предложи присъствието си, а не решения',
      'Продължавай да се интересуваш през следващите седмици',
    ],
    section5Body:
      'Някои признаци могат да показват, че професионалната подкрепа може да е полезна:',
    warningTitle: 'Признаци, които да следиш',
    attentionSigns: [
      'Тъгата продължава дълго и се засилва, вместо да отшумява',
      'Става трудно да функционираш от ден на ден',
      'Установява се значително чувство на изолация',
      'Появяват се натрапчиви мисли или значително страдание',
    ],
    section5InfoTitle: 'Подкрепата е налична',
    section5InfoText:
      'Акушерка, лекар, психолог или група за подкрепа може да те изслуша и да те подкрепи, без да те съди.',
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Да поискаш помощ не е знак за слабост — това е начин да се погрижиш за себе си през този период.',
    summaryPoints: [
      'Няма правилен или грешен начин да преминеш през това преживяване.',
      'Тъгата, гневът или чувството за празнота са нормални реакции.',
      'Да си дадеш време, без натиск или сравнения, е част от изцелението.',
      'Разговорът с близък човек, група за подкрепа или специалист може да помогне да облекчиш тази тежест.',
    ],
    disclaimerText:
      'Информационно съдържание. Тази статия не замества професионалния съвет. Ако преминаваш през труден период, не се колебай да поговориш със здравен специалист.',
    shareMessage: 'Емоционално преминаване през скръбта — AWA',
  },
  sr: {
    badge: 'ПОСЛЕ СПОНТАНОГ ПОБАЧАЈА • ЕМОЦИОНАЛНА ПОДРШКА',
    title: 'Емоционални пролазак\nкроз тугу',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Информативни садржај',
    intro:
      'Не постоји исправан начин да се прође кроз ово. Свака жена то проживљава на свој начин, својим темпом.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Стварна и легитимна туга',
      'Емоције које се разликују од особе до особе',
      'Шта може помоћи из дана у дан',
      'Подршка најближих',
      'Када потражити стручну помоћ',
      'Шта да запамтиш',
    ],
    section1Body:
      'Туга, бес или осећај празнине су нормалне реакције на овај губитак, без обзира на фазу трудноће. Оно што осећаш заслужује да буде признато.',
    section1InfoTitle: 'Имај на уму',
    section1InfoText:
      'Не постоји исправан или погрешан начин да се прође кроз ово. Свака емоција коју осећаш је оправдана.',
    section2Body:
      'Можеш осећати једно или више од следећег, понекад све одједном:',
    feelings: [
      {
        title: 'Туга',
        text: 'Бол који може доћи и проћи, понекад неочекивано.',
      },
      {
        title: 'Бес',
        text: 'Према себи, ситуацији или осећај неправде — и то није ништа забрињавајуће.',
      },
      {
        title: 'Осећај празнине',
        text: 'Осећај празнине или збуњености због онога што се догодило.',
      },
    ],
    section3Body:
      'Давање себи времена, без притиска или поређења, суштински је део исцељења.',
    dailySupport: [
      {
        title: 'Давање себи времена',
        text: 'Без притиска и без рока да се „осећаш боље“.',
      },
      {
        title: 'Не упоређивати се са другима',
        text: 'Свака туга је јединствена; не постоји исправан начин да се кроз њу прође.',
      },
      {
        title: 'Изрицање речима',
        text: 'Писање или говор о ономе што осећаш може помоћи да олакшаш терет својих емоција.',
      },
    ],
    section4Body:
      'Разговор са блиском особом, групом за подршку или стручњаком може помоћи да олакшаш овај терет. Ево како блиски људи могу помоћи:',
    supportTitle: 'Како блиска особа може пружити подршку',
    howToSupport: [
      'Слушај без осуђивања, чак и без савршених речи',
      'Избегавај умањивање искуства („није то била велика ствар“, „можеш покушати поново“)',
      'Понуди своје присуство, а не решења',
      'Настави да се интересујеш током наредних недеља',
    ],
    section5Body:
      'Неки знаци могу указивати да би стручна подршка могла бити корисна:',
    warningTitle: 'Знаци на које треба обратити пажњу',
    attentionSigns: [
      'Туга траје дуго и појачава се уместо да јењава',
      'Постаје тешко функционисати из дана у дан',
      'Успоставља се значајан осећај изолованости',
      'Појављују се упорне мисли или значајна патња',
    ],
    section5InfoTitle: 'Подршка је доступна',
    section5InfoText:
      'Бабица, лекар, психолог или група за подршку може те саслушати и подржати, без осуђивања.',
    tipTitle: 'Добро је знати',
    tipText:
      'Тражење помоћи није знак слабости — то је начин да бринеш о себи у овом периоду.',
    summaryPoints: [
      'Не постоји исправан или погрешан начин да се прође кроз ово искуство.',
      'Туга, бес или осећај празнине су нормалне реакције.',
      'Давање себи времена, без притиска или поређења, део је исцељења.',
      'Разговор са блиском особом, групом за подршку или стручњаком може помоћи да олакшаш овај терет.',
    ],
    disclaimerText:
      'Информативни садржај. Овај чланак не замењује стручни савет. Ако пролазиш кроз тежак период, не оклевај да разговараш са здравственим радником.',
    shareMessage: 'Емоционални пролазак кроз тугу — AWA',
  },
  hr: {
    badge: 'NAKON SPONTANOG POBAČAJA • EMOCIONALNA PODRŠKA',
    title: 'Emocionalno proći\nkroz tugu',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Ne postoji ispravan način da se kroz ovo prođe. Svaka žena prolazi na svoj način, svojim tempom.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Stvarna i opravdana tuga',
      'Emocije koje se razlikuju od osobe do osobe',
      'Što može pomoći iz dana u dan',
      'Podrška bližnjih',
      'Kada potražiti stručnu pomoć',
      'Ključne poruke',
    ],
    section1Body:
      'Tuga, ljutnja ili osjećaj praznine normalne su reakcije na ovaj gubitak, bez obzira na fazu trudnoće. Ono što osjećaš zaslužuje da bude priznato.',
    section1InfoTitle: 'Imaj na umu',
    section1InfoText:
      'Ne postoji ispravan ni pogrešan način da se kroz ovo prođe. Svaka emocija koju osjećaš je valjana.',
    section2Body:
      'Možeš osjećati jedno ili više od ovoga, ponekad sve odjednom:',
    feelings: [
      {
        title: 'Tuga',
        text: 'Žalost koja može dolaziti i prolaziti, ponekad neočekivano.',
      },
      {
        title: 'Ljutnja',
        text: 'Prema sebi, situaciji ili osjećaju nepravde — i u tome nema ničeg zabrinjavajućeg.',
      },
      {
        title: 'Osjećaj praznine',
        text: 'Osjećaj praznine ili zbunjenosti zbog onoga što se upravo dogodilo.',
      },
    ],
    section3Body:
      'Dati si vremena, bez pritiska i uspoređivanja, bitan je dio ozdravljenja.',
    dailySupport: [
      {
        title: 'Daj si vremena',
        text: 'Bez pritiska i roka za „osjećati se bolje“.',
      },
      {
        title: 'Ne uspoređuj se s drugima',
        text: 'Svaka je tuga jedinstvena; ne postoji ispravan način da se kroz nju prođe.',
      },
      {
        title: 'Izrazi to riječima',
        text: 'Pisanje ili razgovor o onome što osjećaš može pomoći olakšati težinu tvojih emocija.',
      },
    ],
    section4Body:
      'Razgovor s bliskom osobom, grupom za podršku ili stručnom osobom može pomoći olakšati taj teret. Evo kako bližnji mogu pomoći:',
    supportTitle: 'Kako bližnja osoba može pružiti podršku',
    howToSupport: [
      'Slušati bez osuđivanja, čak i bez savršenih riječi',
      'Izbjegavati umanjivanje iskustva („nije to bilo ništa strašno“, „možeš pokušati ponovno“)',
      'Ponuditi svoju prisutnost umjesto rješenja',
      'Nastaviti se javljati tijekom sljedećih tjedana',
    ],
    section5Body:
      'Neki znakovi mogu upućivati na to da bi stručna podrška mogla biti korisna:',
    warningTitle: 'Znakovi na koje treba paziti',
    attentionSigns: [
      'Tuga traje dugo i pojačava se umjesto da se smiruje',
      'Postaje teško funkcionirati iz dana u dan',
      'Javlja se snažan osjećaj izolacije',
      'Pojavljuju se nametljive misli ili jaka patnja',
    ],
    section5InfoTitle: 'Podrška je dostupna',
    section5InfoText:
      'Babica, liječnik, psiholog ili grupa za podršku može te saslušati i podržati, bez osuđivanja.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Traženje pomoći nije znak slabosti — to je način brige o sebi u ovom razdoblju.',
    summaryPoints: [
      'Ne postoji ispravan ni pogrešan način da se prođe kroz ovo iskustvo.',
      'Tuga, ljutnja ili osjećaj praznine normalne su reakcije.',
      'Dati si vremena, bez pritiska i uspoređivanja, dio je ozdravljenja.',
      'Razgovor s bliskom osobom, grupom za podršku ili stručnom osobom može pomoći olakšati taj teret.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje stručni savjet. Ako prolaziš kroz težak trenutak, ne oklijevaj razgovarati sa zdravstvenim djelatnikom.',
    shareMessage: 'Emocionalno proći kroz tugu — AWA',
  },
  bs: {
    badge: 'NAKON SPONTANOG POBAČAJA • EMOCIONALNA PODRŠKA',
    title: 'Emocionalno proći\nkroz tugu',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Ne postoji ispravan način da se kroz ovo prođe. Svaka žena prolazi na svoj način, svojim tempom.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Stvarna i opravdana tuga',
      'Emocije koje se razlikuju od osobe do osobe',
      'Što može pomoći iz dana u dan',
      'Podrška bližnjih',
      'Kada potražiti stručnu pomoć',
      'Ključne poruke',
    ],
    section1Body:
      'Tuga, ljutnja ili osjećaj praznine normalne su reakcije na ovaj gubitak, bez obzira na fazu trudnoće. Ono što osjećaš zaslužuje da bude priznato.',
    section1InfoTitle: 'Imaj na umu',
    section1InfoText:
      'Ne postoji ispravan ni pogrešan način da se kroz ovo prođe. Svaka emocija koju osjećaš je valjana.',
    section2Body:
      'Možeš osjećati jedno ili više od ovoga, ponekad sve odjednom:',
    feelings: [
      {
        title: 'Tuga',
        text: 'Žalost koja može dolaziti i prolaziti, ponekad neočekivano.',
      },
      {
        title: 'Ljutnja',
        text: 'Prema sebi, situaciji ili osjećaju nepravde — i u tome nema ničeg zabrinjavajućeg.',
      },
      {
        title: 'Osjećaj praznine',
        text: 'Osjećaj praznine ili zbunjenosti zbog onoga što se upravo dogodilo.',
      },
    ],
    section3Body:
      'Dati si vremena, bez pritiska i uspoređivanja, bitan je dio ozdravljenja.',
    dailySupport: [
      {
        title: 'Daj si vremena',
        text: 'Bez pritiska i roka za „osjećati se bolje“.',
      },
      {
        title: 'Ne uspoređuj se s drugima',
        text: 'Svaka je tuga jedinstvena; ne postoji ispravan način da se kroz nju prođe.',
      },
      {
        title: 'Izrazi to riječima',
        text: 'Pisanje ili razgovor o onome što osjećaš može pomoći olakšati težinu tvojih emocija.',
      },
    ],
    section4Body:
      'Razgovor s bliskom osobom, grupom za podršku ili stručnom osobom može pomoći olakšati taj teret. Evo kako bližnji mogu pomoći:',
    supportTitle: 'Kako bližnja osoba može pružiti podršku',
    howToSupport: [
      'Slušati bez osuđivanja, čak i bez savršenih riječi',
      'Izbjegavati umanjivanje iskustva („nije to bilo ništa strašno“, „možeš pokušati ponovno“)',
      'Ponuditi svoju prisutnost umjesto rješenja',
      'Nastaviti se javljati tokom sljedećih sedmica',
    ],
    section5Body:
      'Neki znakovi mogu upućivati na to da bi stručna podrška mogla biti korisna:',
    warningTitle: 'Znakovi na koje treba paziti',
    attentionSigns: [
      'Tuga traje dugo i pojačava se umjesto da se smiruje',
      'Postaje teško funkcionirati iz dana u dan',
      'Javlja se snažan osjećaj izolacije',
      'Pojavljuju se nametljive misli ili jaka patnja',
    ],
    section5InfoTitle: 'Podrška je dostupna',
    section5InfoText:
      'Babica, ljekar, psiholog ili grupa za podršku može te saslušati i podržati, bez osuđivanja.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Traženje pomoći nije znak slabosti — to je način brige o sebi u ovom razdoblju.',
    summaryPoints: [
      'Ne postoji ispravan ni pogrešan način da se prođe kroz ovo iskustvo.',
      'Tuga, ljutnja ili osjećaj praznine normalne su reakcije.',
      'Dati si vremena, bez pritiska i uspoređivanja, dio je ozdravljenja.',
      'Razgovor s bliskom osobom, grupom za podršku ili stručnom osobom može pomoći olakšati taj teret.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje stručni savjet. Ako prolaziš kroz težak trenutak, ne oklijevaj razgovarati sa zdravstvenim radnikom.',
    shareMessage: 'Emocionalno proći kroz tugu — AWA',
  },
  sl: {
    badge: 'PO SPONTANEM SPLAVU • ČUSTVENA PODPORA',
    title: 'Čustveno prebroditi\nžalovanje',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Informativna vsebina',
    intro:
      'Ne obstaja pravilen način, kako to preživeti. Vsaka ženska gre skozi na svoj način, v svojem tempu.',
    contentsTitle: 'V tem članku',
    topics: [
      'Resnična in upravičena žalost',
      'Čustva, ki se razlikujejo od osebe do osebe',
      'Kaj lahko pomaga iz dneva v dan',
      'Podpora bližnjih',
      'Kdaj poiskati strokovno pomoč',
      'Ključna sporočila',
    ],
    section1Body:
      'Žalost, jeza ali občutek praznine so normalne reakcije na to izgubo, ne glede na fazo nosečnosti. To, kar čutiš, si zasluži, da je priznano.',
    section1InfoTitle: 'Imej v mislih',
    section1InfoText:
      'Ne obstaja pravilen ali napačen način, kako to preživeti. Vsako čustvo, ki ga čutiš, je veljavno.',
    section2Body:
      'Lahko čutiš eno ali več od naslednjega, včasih vse naenkrat:',
    feelings: [
      {
        title: 'Žalost',
        text: 'Bolečina, ki lahko prihaja in odhaja, včasih nepričakovano.',
      },
      {
        title: 'Jeza',
        text: 'Do sebe, situacije ali občutka krivice — in v tem ni nič zaskrbljujočega.',
      },
      {
        title: 'Občutek praznine',
        text: 'Občutek praznine ali zmedenosti zaradi tega, kar se je pravkar zgodilo.',
      },
    ],
    section3Body:
      'Dati si časa, brez pritiska in primerjanja, je bistven del celjenja.',
    dailySupport: [
      {
        title: 'Daj si časa',
        text: 'Brez pritiska in roka za „počutiti se bolje“.',
      },
      {
        title: 'Ne primerjaj se z drugimi',
        text: 'Vsaka žalost je edinstvena; ne obstaja pravilen način, kako jo preživeti.',
      },
      {
        title: 'Izrazi to z besedami',
        text: 'Pisanje ali pogovor o tem, kar čutiš, lahko pomaga olajšati težo tvojih čustev.',
      },
    ],
    section4Body:
      'Pogovor z bližnjo osebo, skupino za podporo ali strokovnjakom lahko pomaga olajšati to breme. Tako lahko pomagajo bližnji:',
    supportTitle: 'Kako lahko bližnja oseba nudi podporo',
    howToSupport: [
      'Poslušati brez obsojanja, tudi brez popolnih besed',
      'Izogibati se zmanjševanju izkušnje („to ni bilo nič hudega“, „lahko poskusiš znova“)',
      'Ponuditi svojo prisotnost namesto rešitev',
      'Še naprej se javljati v naslednjih tednih',
    ],
    section5Body:
      'Nekateri znaki lahko kažejo, da bi lahko bila koristna strokovna podpora:',
    warningTitle: 'Znaki, na katere je treba paziti',
    attentionSigns: [
      'Žalost traja dolgo in se stopnjuje, namesto da bi se umirila',
      'Postane težko delovati iz dneva v dan',
      'Pojavi se močan občutek osamljenosti',
      'Pojavijo se vsiljive misli ali huda stiska',
    ],
    section5InfoTitle: 'Podpora je na voljo',
    section5InfoText:
      'Babica, zdravnik, psiholog ali skupina za podporo te lahko posluša in podpre, brez obsojanja.',
    tipTitle: 'Vredno vedeti',
    tipText:
      'Prositi za pomoč ni znak šibkosti — to je način skrbi zase v tem obdobju.',
    summaryPoints: [
      'Ne obstaja pravilen ali napačen način, kako preživeti to izkušnjo.',
      'Žalost, jeza ali občutek praznine so normalne reakcije.',
      'Dati si časa, brez pritiska in primerjanja, je del celjenja.',
      'Pogovor z bližnjo osebo, skupino za podporo ali strokovnjakom lahko pomaga olajšati to breme.',
    ],
    disclaimerText:
      'Informativna vsebina. Ta članek ne nadomešča strokovnega nasveta. Če prestajaš težek trenutek, ne oklevaj govoriti z zdravstvenim delavcem.',
    shareMessage: 'Čustveno prebroditi žalovanje — AWA',
  },
  ne: {
    badge: 'गर्भपतनपछि • भावनात्मक साथ',
    title: 'भावनात्मक रूपमा शोकबाट\nगुज्रँदै',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'जानकारीमूलक सामग्री',
    intro:
      'यसबाट गुज्रने कुनै सही तरिका हुँदैन। हरेकले आफ्नै तरिकाले, आफ्नै गतिमा यसबाट गुज्रिन्छिन्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'एउटा वास्तविक र जायज शोक',
      'व्यक्तिपिच्छे फरक हुने भावनाहरू',
      'दैनिक के मद्दत गर्न सक्छ',
      'नजिकका मानिसको साथ',
      'व्यावसायिक मद्दत कहिले खोज्ने',
      'मुख्य कुराहरू',
    ],
    section1Body:
      'उदासी, रिस वा खालीपनको अनुभूति यो क्षतिप्रति सामान्य प्रतिक्रिया हुन्, गर्भावस्थाको चरण जे भए पनि। तपाईंले महसुस गरिरहेको कुराले स्वीकृति पाउनुपर्छ।',
    section1InfoTitle: 'मनमा राख्नुहोस्',
    section1InfoText:
      'यसबाट गुज्रने कुनै सही वा गलत तरिका हुँदैन। तपाईंले महसुस गर्ने हरेक भावना जायज छ।',
    section2Body:
      'तपाईंले यीमध्ये एक वा बढी, कहिलेकाहीँ सबै एकसाथ महसुस गर्न सक्नुहुन्छ:',
    feelings: [
      {
        title: 'उदासी',
        text: 'एउटा शोक जुन आउँदै-जाँदै गर्न सक्छ, कहिलेकाहीँ अप्रत्याशित रूपमा।',
      },
      {
        title: 'रिस',
        text: 'आफूप्रति, अवस्थाप्रति वा अन्यायको अनुभूतिप्रति — र त्यो चिन्ता गर्नुपर्ने कुरा होइन।',
      },
      {
        title: 'खालीपनको अनुभूति',
        text: 'भर्खरै जे भयो त्यसबारे खालीपन वा भ्रमको अनुभूति।',
      },
    ],
    section3Body:
      'दबाब वा तुलनाबिना आफूलाई समय दिनु निको हुने प्रक्रियाको आवश्यक हिस्सा हो।',
    dailySupport: [
      {
        title: 'आफूलाई समय दिनुहोस्',
        text: '“राम्रो महसुस गर्ने” दबाब वा समयसीमाबिना।',
      },
      {
        title: 'आफूलाई अरूसँग तुलना नगर्नुहोस्',
        text: 'हरेक शोक अनौठो हुन्छ; यसबाट गुज्रने कुनै सही तरिका हुँदैन।',
      },
      {
        title: 'शब्दमा उतार्नुहोस्',
        text: 'आफूले महसुस गरेको कुरा लेख्नु वा बताउनुले भावनाहरूको भार हल्का पार्न मद्दत गर्न सक्छ।',
      },
    ],
    section4Body:
      'आफ्नो नजिकको कसैसँग, साथ दिने समूहसँग, वा व्यावसायिकसँग कुरा गर्दा यो भार हल्का पार्न मद्दत मिल्न सक्छ। नजिकका मानिसले कसरी मद्दत गर्न सक्छन् यहाँ छ:',
    supportTitle: 'नजिकको व्यक्तिले कसरी साथ दिन सक्छ',
    howToSupport: [
      'पूर्ण शब्दहरू नभए पनि, न्याय नगरी सुन्नुहोस्',
      'अनुभवलाई कम आँक्नबाट जोगिनुहोस् (“ठूलो कुरा थिएन,” “तिमीले फेरि प्रयास गर्न सक्छौ”)',
      'समाधानभन्दा आफ्नो उपस्थिति प्रस्ताव गर्नुहोस्',
      'आगामी हप्ताहरूमा पनि हालखबर सोधिरहनुहोस्',
    ],
    section5Body:
      'केही संकेतहरूले व्यावसायिक साथ उपयोगी हुन सक्छ भन्ने जनाउन सक्छन्:',
    warningTitle: 'ध्यान दिनुपर्ने संकेतहरू',
    attentionSigns: [
      'उदासी लामो समय रहन्छ र हल्का हुनुको सट्टा तीव्र हुन्छ',
      'दैनिक काम गर्न गाह्रो हुन थाल्छ',
      'एक्लोपनको ठूलो अनुभूति बस्छ',
      'घुसपैठ गर्ने विचार वा ठूलो पीडा देखिन्छ',
    ],
    section5InfoTitle: 'साथ उपलब्ध छ',
    section5InfoText:
      'सुँडेनी, चिकित्सक, मनोवैज्ञानिक वा साथ दिने समूहले न्याय नगरी तपाईंलाई सुन्न र साथ दिन सक्छ।',
    tipTitle: 'जान्न लायक',
    tipText:
      'मद्दत माग्नु कमजोरीको संकेत होइन — यो यस समयमा आफ्नो ख्याल राख्ने तरिका हो।',
    summaryPoints: [
      'यो अनुभवबाट गुज्रने कुनै सही वा गलत तरिका हुँदैन।',
      'उदासी, रिस वा खालीपनको अनुभूति सामान्य प्रतिक्रिया हुन्।',
      'दबाब वा तुलनाबिना आफूलाई समय दिनु निको हुने प्रक्रियाको हिस्सा हो।',
      'आफ्नो नजिकको कसैसँग, साथ दिने समूहसँग, वा व्यावसायिकसँग कुरा गर्दा यो भार हल्का पार्न मद्दत मिल्न सक्छ।',
    ],
    disclaimerText:
      'जानकारीमूलक सामग्री। यो लेखले व्यावसायिक सल्लाहको स्थान लिँदैन। तपाईं कठिन समयबाट गुज्रँदै हुनुहुन्छ भने, स्वास्थ्यकर्मीसँग कुरा गर्न नहिच्किचाउनुहोस्।',
    shareMessage: 'भावनात्मक रूपमा शोकबाट गुज्रँदै — AWA',
  },
  si: {
    badge: 'ගබ්සාවකින් පසු • චිත්තවේගී සහාය',
    title: 'චිත්තවේගීව වියෝවෙන්\nගමන් කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'තොරතුරු අන්තර්ගතය',
    intro:
      'මෙය හරහා යෑමට නිවැරදි ක්‍රමයක් නැත. සෑම කෙනෙකුම ඇයගේම ආකාරයෙන්, ඇයගේම වේගයෙන් එය හරහා ගමන් කරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'සැබෑ සහ නීත්‍යානුකූල වියෝවක්',
      'පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වන හැඟීම්',
      'දිනෙන් දින උපකාරී විය හැකි දේ',
      'ආදරණීයයන්ගේ සහාය',
      'වෘත්තීය උදව් ලබාගත යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body:
      'ගර්භණී කාලයේ අවධිය කුමක් වුවත්, දුක, කෝපය, හෝ හිස් බවක් දැනීම මෙම අහිමිවීමට සාමාන්‍ය ප්‍රතික්‍රියා වේ. ඔබට දැනෙන දේ පිළිගැනීමට සුදුසුයි.',
    section1InfoTitle: 'මතක තබාගන්න',
    section1InfoText:
      'මෙය හරහා යෑමට නිවැරදි හෝ වැරදි ක්‍රමයක් නැත. ඔබට දැනෙන සෑම හැඟීමක්ම වලංගුයි.',
    section2Body:
      'ඔබට මේවායින් එකක් හෝ කිහිපයක් දැනෙන්නට පුළුවන්, සමහර විට සියල්ල එකවර:',
    feelings: [
      {
        title: 'දුක',
        text: 'සමහර විට අනපේක්ෂිතව පැමිණෙන සහ යන විය හැකි ශෝකයක්.',
      },
      {
        title: 'කෝපය',
        text: 'ඔබ වෙත, තත්ත්වය වෙත, හෝ අසාධාරණ බවක් — සහ එය කනස්සල්ලට කරුණක් නොවේ.',
      },
      {
        title: 'හිස් බවක් දැනීම',
        text: 'සිදු වූ දේ ගැන හිස් බවක් හෝ ව්‍යාකූලත්වයක්.',
      },
    ],
    section3Body:
      'පීඩනයකින් හෝ සංසන්දනයකින් තොරව ඔබටම කාලය ලබා දීම, සුවය ලැබීමේ අත්‍යවශ්‍ය කොටසකි.',
    dailySupport: [
      {
        title: 'ඔබටම කාලය ලබා දීම',
        text: '“වඩා හොඳින් දැනීම” සඳහා පීඩනයක් හෝ අවසාන දිනයක් නොමැතිව.',
      },
      {
        title: 'අන් අය සමඟ ඔබව සංසන්දනය නොකිරීම',
        text: 'සෑම වියෝවක්ම අද්විතීයයි; එය හරහා යෑමට නිවැරදි ක්‍රමයක් නැත.',
      },
      {
        title: 'එය වචනවලට නැගීම',
        text: 'ඔබට දැනෙන දේ ලිවීම හෝ කතා කිරීම ඔබේ හැඟීම්වල බර සැහැල්ලු කිරීමට උපකාරී විය හැක.',
      },
    ],
    section4Body:
      'ඔබට සමීප කෙනෙකු, සහාය කණ්ඩායමක්, හෝ වෘත්තිකයෙකු සමඟ කතා කිරීම මෙම බර සැහැල්ලු කිරීමට උපකාරී විය හැක. ආදරණීයයන්ට උදව් කළ හැකි ආකාරය මෙන්න:',
    supportTitle: 'ආදරණීයයෙකුට සහාය ලබා දිය හැකි ආකාරය',
    howToSupport: [
      'පරිපූර්ණ වචන නොමැතිව වුවද, විනිශ්චයකින් තොරව සවන් දෙන්න',
      'අත්දැකීම අවතක්සේරු කිරීම වළක්වන්න (“එය විශාල දෙයක් නොවේ,” “ඔබට නැවත උත්සාහ කළ හැක”)',
      'විසඳුම් වලට වඩා ඔබේ පැමිණීම ඉදිරිපත් කරන්න',
      'ඉදිරි සති තුළ දිගටම විමසන්න',
    ],
    section5Body:
      'සමහර සලකුණු වෘත්තීය සහාය ප්‍රයෝජනවත් විය හැකි බව පෙන්විය හැක:',
    warningTitle: 'අවධානයට ලක් කළ යුතු සලකුණු',
    attentionSigns: [
      'දුක දිගු කලක් පවතින අතර සැහැල්ලු වනවාට වඩා තීව්‍ර වේ',
      'එදිනෙදා ක්‍රියා කිරීම අපහසු වේ',
      'සැලකිය යුතු හුදකලා බවක් ඇතිවේ',
      'බාධා කරන සිතුවිලි හෝ සැලකිය යුතු දුක්ඛිතභාවයක් දිස්වේ',
    ],
    section5InfoTitle: 'සහාය ලබාගත හැක',
    section5InfoText:
      'ප්‍රසව හෙදියකට, වෛද්‍යවරයෙකුට, මනෝවිද්‍යාඥයෙකුට, හෝ සහාය කණ්ඩායමකට විනිශ්චයකින් තොරව ඔබට සවන් දී සහාය විය හැක.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'උදව් ඉල්ලීම දුර්වලකමක සලකුණක් නොවේ — එය මෙම කාලය තුළ ඔබ ගැන සැලකිලිමත් වීමේ ක්‍රමයකි.',
    summaryPoints: [
      'මෙම අත්දැකීම හරහා යෑමට නිවැරදි හෝ වැරදි ක්‍රමයක් නැත.',
      'දුක, කෝපය, හෝ හිස් බවක් දැනීම සාමාන්‍ය ප්‍රතික්‍රියා වේ.',
      'පීඩනයකින් හෝ සංසන්දනයකින් තොරව ඔබටම කාලය ලබා දීම සුවය ලැබීමේ කොටසකි.',
      'ඔබට සමීප කෙනෙකු, සහාය කණ්ඩායමක්, හෝ වෘත්තිකයෙකු සමඟ කතා කිරීම මෙම බර සැහැල්ලු කිරීමට උපකාරී විය හැක.',
    ],
    disclaimerText:
      'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය වෘත්තීය උපදෙස් වෙනුවට නොපවතී. ඔබ දුෂ්කර කාලයක් හරහා ගමන් කරන්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීමට මැළි නොවන්න.',
    shareMessage: 'චිත්තවේගීව වියෝවෙන් ගමන් කිරීම — AWA',
  },
  th: {
    badge: 'หลังการแท้งบุตร • การสนับสนุนทางอารมณ์',
    title: 'ผ่านพ้นความโศกเศร้า\nทางอารมณ์',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาเพื่อให้ข้อมูล',
    intro:
      'ไม่มีวิธีที่ถูกต้องในการผ่านช่วงนี้ ทุกคนผ่านไปในแบบของตัวเอง ตามจังหวะของตัวเอง',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ความโศกเศร้าที่เป็นจริงและชอบธรรม',
      'อารมณ์ที่แตกต่างกันในแต่ละคน',
      'สิ่งที่อาจช่วยได้ในแต่ละวัน',
      'การสนับสนุนจากคนที่รัก',
      'เมื่อไรควรขอความช่วยเหลือจากผู้เชี่ยวชาญ',
      'ประเด็นสำคัญ',
    ],
    section1Body:
      'ความเศร้า ความโกรธ หรือความรู้สึกว่างเปล่าเป็นปฏิกิริยาปกติต่อการสูญเสียนี้ ไม่ว่าจะอยู่ในระยะใดของการตั้งครรภ์ สิ่งที่คุณรู้สึกสมควรได้รับการยอมรับ',
    section1InfoTitle: 'โปรดจำไว้',
    section1InfoText:
      'ไม่มีวิธีที่ถูกหรือผิดในการผ่านช่วงนี้ ทุกอารมณ์ที่คุณรู้สึกล้วนถูกต้อง',
    section2Body:
      'คุณอาจรู้สึกอย่างใดอย่างหนึ่งหรือหลายอย่าง บางครั้งพร้อมกันทั้งหมด:',
    feelings: [
      {
        title: 'ความเศร้า',
        text: 'ความทุกข์ที่อาจมาแล้วไป บางครั้งโดยไม่คาดคิด',
      },
      {
        title: 'ความโกรธ',
        text: 'ต่อตัวเอง ต่อสถานการณ์ หรือความรู้สึกว่าไม่เป็นธรรม — และนั่นไม่ใช่เรื่องที่ต้องกังวล',
      },
      {
        title: 'ความรู้สึกว่างเปล่า',
        text: 'ความรู้สึกว่างเปล่าหรือสับสนต่อสิ่งที่เพิ่งเกิดขึ้น',
      },
    ],
    section3Body:
      'การให้เวลาตัวเอง โดยไม่กดดันและไม่เปรียบเทียบ เป็นส่วนสำคัญของการเยียวยา',
    dailySupport: [
      {
        title: 'ให้เวลาตัวเอง',
        text: 'โดยไม่มีแรงกดดันหรือกำหนดเวลาให้ “รู้สึกดีขึ้น”',
      },
      {
        title: 'ไม่เปรียบเทียบกับผู้อื่น',
        text: 'ความโศกเศร้าของแต่ละคนมีเอกลักษณ์ ไม่มีวิธีที่ถูกต้องในการผ่านมัน',
      },
      {
        title: 'ถ่ายทอดเป็นคำพูด',
        text: 'การเขียนหรือพูดถึงสิ่งที่คุณรู้สึกช่วยผ่อนคลายน้ำหนักของอารมณ์ได้',
      },
    ],
    section4Body:
      'การพูดคุยกับคนใกล้ชิด กลุ่มสนับสนุน หรือผู้เชี่ยวชาญ ช่วยผ่อนคลายน้ำหนักนี้ได้ นี่คือวิธีที่คนที่รักช่วยได้:',
    supportTitle: 'คนที่รักให้การสนับสนุนได้อย่างไร',
    howToSupport: [
      'รับฟังโดยไม่ตัดสิน แม้ไม่มีคำพูดที่สมบูรณ์แบบ',
      'หลีกเลี่ยงการลดทอนประสบการณ์ (“ไม่ใช่เรื่องใหญ่” “ลองใหม่ได้”)',
      'เสนอการอยู่เคียงข้างแทนการเสนอทางแก้',
      'ถามไถ่ต่อเนื่องในสัปดาห์ถัดมา',
    ],
    section5Body:
      'สัญญาณบางอย่างอาจบ่งบอกว่าการสนับสนุนจากผู้เชี่ยวชาญอาจเป็นประโยชน์:',
    warningTitle: 'สัญญาณที่ควรสังเกต',
    attentionSigns: [
      'ความเศร้าคงอยู่นานและรุนแรงขึ้นแทนที่จะบรรเทา',
      'การใช้ชีวิตประจำวันเริ่มทำได้ยาก',
      'ความรู้สึกโดดเดี่ยวอย่างมากเข้ามา',
      'มีความคิดที่แทรกเข้ามาหรือความทุกข์ใจอย่างมาก',
    ],
    section5InfoTitle: 'มีผู้พร้อมให้การสนับสนุน',
    section5InfoText:
      'ผดุงครรภ์ แพทย์ นักจิตวิทยา หรือกลุ่มสนับสนุน รับฟังและสนับสนุนคุณได้ โดยไม่ตัดสิน',
    tipTitle: 'ควรรู้',
    tipText:
      'การขอความช่วยเหลือไม่ใช่สัญญาณของความอ่อนแอ — เป็นวิธีหนึ่งในการดูแลตัวเองในช่วงเวลานี้',
    summaryPoints: [
      'ไม่มีวิธีที่ถูกหรือผิดในการผ่านประสบการณ์นี้',
      'ความเศร้า ความโกรธ หรือความรู้สึกว่างเปล่าเป็นปฏิกิริยาปกติ',
      'การให้เวลาตัวเอง โดยไม่กดดันและไม่เปรียบเทียบ เป็นส่วนหนึ่งของการเยียวยา',
      'การพูดคุยกับคนใกล้ชิด กลุ่มสนับสนุน หรือผู้เชี่ยวชาญ ช่วยผ่อนคลายน้ำหนักนี้ได้',
    ],
    disclaimerText:
      'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำจากผู้เชี่ยวชาญ หากคุณกำลังผ่านช่วงเวลาที่ยากลำบาก อย่าลังเลที่จะพูดคุยกับบุคลากรทางการแพทย์',
    shareMessage: 'ผ่านพ้นความโศกเศร้าทางอารมณ์ — AWA',
  },
  vi: {
    badge: 'SAU KHI MẤT THAI • HỖ TRỢ TINH THẦN',
    title: 'Vượt qua nỗi đau mất mát\nvề mặt tinh thần',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung mang tính thông tin',
    intro:
      'Không có cách nào là đúng để đi qua điều này. Mỗi người vượt qua theo cách riêng, theo nhịp của riêng mình.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Một nỗi đau mất mát có thật và chính đáng',
      'Cảm xúc khác nhau ở mỗi người',
      'Điều gì có thể giúp ích mỗi ngày',
      'Sự hỗ trợ từ người thân',
      'Khi nào nên tìm sự giúp đỡ chuyên môn',
      'Những điểm chính cần nhớ',
    ],
    section1Body:
      'Nỗi buồn, sự giận dữ hoặc cảm giác trống rỗng là những phản ứng bình thường trước mất mát này, dù thai kỳ ở giai đoạn nào. Những gì bạn đang cảm thấy đáng được ghi nhận.',
    section1InfoTitle: 'Hãy ghi nhớ',
    section1InfoText:
      'Không có cách đúng hay sai để đi qua điều này. Mọi cảm xúc bạn cảm thấy đều chính đáng.',
    section2Body:
      'Bạn có thể cảm thấy một hoặc nhiều điều sau, đôi khi tất cả cùng lúc:',
    feelings: [
      {
        title: 'Nỗi buồn',
        text: 'Một nỗi đau có thể đến rồi đi, đôi khi bất ngờ.',
      },
      {
        title: 'Sự giận dữ',
        text: 'Hướng về bản thân, hoàn cảnh hoặc cảm giác bất công — và điều đó không có gì đáng lo.',
      },
      {
        title: 'Cảm giác trống rỗng',
        text: 'Một cảm giác trống rỗng hoặc bối rối về những gì vừa xảy ra.',
      },
    ],
    section3Body:
      'Cho bản thân thời gian, không áp lực hay so sánh, là một phần thiết yếu của sự chữa lành.',
    dailySupport: [
      {
        title: 'Cho bản thân thời gian',
        text: 'Không áp lực hay thời hạn để “cảm thấy tốt hơn”.',
      },
      {
        title: 'Không so sánh với người khác',
        text: 'Mỗi nỗi đau mất mát là duy nhất; không có cách nào là đúng để vượt qua.',
      },
      {
        title: 'Diễn đạt thành lời',
        text: 'Viết ra hoặc nói về những gì bạn cảm thấy có thể giúp giảm bớt gánh nặng cảm xúc.',
      },
    ],
    section4Body:
      'Nói chuyện với một người thân thiết, một nhóm hỗ trợ hoặc một chuyên gia có thể giúp giảm bớt gánh nặng này. Sau đây là cách người thân có thể giúp:',
    supportTitle: 'Cách một người thân có thể hỗ trợ',
    howToSupport: [
      'Lắng nghe không phán xét, kể cả khi không có những lời hoàn hảo',
      'Tránh xem nhẹ trải nghiệm này (“có gì to tát đâu”, “bạn có thể thử lại mà”)',
      'Mang đến sự hiện diện thay vì giải pháp',
      'Tiếp tục hỏi thăm trong những tuần tiếp theo',
    ],
    section5Body:
      'Một số dấu hiệu có thể cho thấy sự hỗ trợ chuyên môn có thể hữu ích:',
    warningTitle: 'Những dấu hiệu cần chú ý',
    attentionSigns: [
      'Nỗi buồn kéo dài lâu và nặng thêm thay vì dịu đi',
      'Việc sinh hoạt hằng ngày trở nên khó khăn',
      'Cảm giác cô lập đáng kể xuất hiện',
      'Xuất hiện những ý nghĩ ám ảnh hoặc nỗi đau khổ đáng kể',
    ],
    section5InfoTitle: 'Luôn có sự hỗ trợ dành cho bạn',
    section5InfoText:
      'Nữ hộ sinh, bác sĩ, chuyên gia tâm lý hoặc nhóm hỗ trợ có thể lắng nghe và đồng hành cùng bạn, không phán xét.',
    tipTitle: 'Nên biết',
    tipText:
      'Nhờ giúp đỡ không phải là dấu hiệu của sự yếu đuối — đó là một cách chăm sóc bản thân trong giai đoạn này.',
    summaryPoints: [
      'Không có cách đúng hay sai để đi qua trải nghiệm này.',
      'Nỗi buồn, sự giận dữ hoặc cảm giác trống rỗng là những phản ứng bình thường.',
      'Cho bản thân thời gian, không áp lực hay so sánh, là một phần của sự chữa lành.',
      'Nói chuyện với một người thân thiết, một nhóm hỗ trợ hoặc một chuyên gia có thể giúp giảm bớt gánh nặng này.',
    ],
    disclaimerText:
      'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên chuyên môn. Nếu bạn đang trải qua một giai đoạn khó khăn, đừng ngần ngại nói chuyện với nhân viên y tế.',
    shareMessage: 'Vượt qua nỗi đau mất mát về mặt tinh thần — AWA',
  },
  uz: {
    badge: 'HOMILA TUSHGANDAN KEYIN • HISSIY QOʻLLAB-QUVVATLASH',
    title: 'Qaygʻuni hissiy jihatdan\nboshdan kechirish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Maʼlumot uchun kontent',
    intro:
      'Buni boshdan kechirishning yagona toʻgʻri yoʻli yoʻq. Har kim buni oʻz yoʻli bilan, oʻz surʼatida boshdan kechiradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Haqiqiy va qonuniy qaygʻu',
      'Odamdan odamga farq qiladigan hissiyotlar',
      'Kundalik hayotda nima yordam berishi mumkin',
      'Yaqinlarning qoʻllab-quvvatlashi',
      'Qachon mutaxassis yordamini izlash kerak',
      'Asosiy xulosalar',
    ],
    section1Body:
      'Qaygʻu, gʻazab yoki boʻshliq hissi homiladorlikning qaysi bosqichi boʻlishidan qatʼi nazar, bu yoʻqotishga normal reaksiyalar. His qilayotgan narsangiz tan olinishga loyiq.',
    section1InfoTitle: 'Esda tuting',
    section1InfoText:
      'Buni boshdan kechirishning toʻgʻri yoki notoʻgʻri yoʻli yoʻq. His qilgan har bir hissiyotingiz qonuniy.',
    section2Body:
      'Siz bulardan birini yoki bir nechtasini, baʼzan hammasini bir vaqtda his qilishingiz mumkin:',
    feelings: [
      {
        title: 'Qaygʻu',
        text: 'Kelib-ketishi mumkin boʻlgan, baʼzan kutilmaganda keladigan alam.',
      },
      {
        title: 'Gʻazab',
        text: 'Oʻzingizga, vaziyatga yoki adolatsizlik hissiga qarshi — va bu xavotirga sabab emas.',
      },
      {
        title: 'Boʻshliq hissi',
        text: 'Hozirgina sodir boʻlgan narsa haqida boʻshliq yoki sarosimalik hissi.',
      },
    ],
    section3Body:
      'Oʻzingizga bosimsiz va solishtirmasdan vaqt berish tuzalishning muhim qismi.',
    dailySupport: [
      {
        title: 'Oʻzingizga vaqt berish',
        text: '“Yaxshiroq his qilish” uchun bosim yoki muddatsiz.',
      },
      {
        title: 'Oʻzingizni boshqalar bilan solishtirmaslik',
        text: 'Har bir qaygʻu noyob; uni boshdan kechirishning toʻgʻri yoʻli yoʻq.',
      },
      {
        title: 'Uni soʻzlarga aylantirish',
        text: 'His qilayotgan narsangiz haqida yozish yoki gaplashish hissiyotlaringiz ogʻirligini yengillashtirishga yordam beradi.',
      },
    ],
    section4Body:
      'Yaqin kishingiz, qoʻllab-quvvatlash guruhi yoki mutaxassis bilan gaplashish bu ogʻirlikni yengillashtirishi mumkin. Yaqinlar qanday yordam berishi mumkin:',
    supportTitle: 'Yaqin kishi qanday qoʻllab-quvvatlashi mumkin',
    howToSupport: [
      'Hukm chiqarmasdan tinglash, hatto mukammal soʻzlar boʻlmasa ham',
      'Tajribani kamsitishdan saqlanish (“bu katta gap emas”, “yana urinib koʻrasan”)',
      'Yechimlar oʻrniga oʻz borligingizni taklif qilish',
      'Keyingi haftalarda ham holini soʻrab turish',
    ],
    section5Body:
      'Baʼzi belgilar mutaxassis yordami foydali boʻlishi mumkinligini bildiradi:',
    warningTitle: 'Eʼtibor berish kerak boʻlgan belgilar',
    attentionSigns: [
      'Qaygʻu uzoq davom etadi va yengillashish oʻrniga kuchayadi',
      'Kundalik hayotda faoliyat yuritish qiyinlashadi',
      'Sezilarli yolgʻizlik hissi paydo boʻladi',
      'Xalaqit beruvchi fikrlar yoki kuchli iztirob paydo boʻladi',
    ],
    section5InfoTitle: 'Yordam mavjud',
    section5InfoText:
      'Doya, shifokor, psixolog yoki qoʻllab-quvvatlash guruhi hukm chiqarmasdan tinglashi va sizni qoʻllab-quvvatlashi mumkin.',
    tipTitle: 'Bilish foydali',
    tipText:
      'Yordam soʻrash zaiflik belgisi emas — bu davrda oʻzingizga gʻamxoʻrlik qilishning bir usuli.',
    summaryPoints: [
      'Bu tajribani boshdan kechirishning toʻgʻri yoki notoʻgʻri yoʻli yoʻq.',
      'Qaygʻu, gʻazab yoki boʻshliq hissi normal reaksiyalar.',
      'Oʻzingizga bosimsiz va solishtirmasdan vaqt berish tuzalishning bir qismi.',
      'Yaqin kishingiz, qoʻllab-quvvatlash guruhi yoki mutaxassis bilan gaplashish bu ogʻirlikni yengillashtirishi mumkin.',
    ],
    disclaimerText:
      'Maʼlumot uchun kontent. Bu maqola mutaxassis maslahatini almashtirmaydi. Agar qiyin davrni boshdan kechirayotgan boʻlsangiz, sogʻliqni saqlash mutaxassisi bilan gaplashishdan tortinmang.',
    shareMessage: 'Qaygʻuni hissiy jihatdan boshdan kechirish — AWA',
  },
  az: {
    badge: 'DÜŞÜKDƏN SONRA • EMOSİONAL DƏSTƏK',
    title: 'Yası emosional\nolaraq yaşamaq',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Məlumat xarakterli məzmun',
    intro:
      'Bunu yaşamağın düzgün yolu yoxdur. Hər kəs bunu öz yolu ilə, öz tempi ilə keçir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Real və qanuni yas',
      'Şəxsdən şəxsə dəyişən emosiyalar',
      'Gündəlik həyatda nə kömək edə bilər',
      'Yaxınların dəstəyi',
      'Nə vaxt peşəkar kömək axtarmaq lazımdır',
      'Əsas nəticələr',
    ],
    section1Body:
      'Kədər, qəzəb və ya boşluq hissi hamiləliyin mərhələsindən asılı olmayaraq bu itkiyə normal reaksiyalardır. Hiss etdikləriniz tanınmağa layiqdir.',
    section1InfoTitle: 'Yadda saxlayın',
    section1InfoText:
      'Bunu yaşamağın düzgün və ya yanlış yolu yoxdur. Hiss etdiyiniz hər emosiya əsaslıdır.',
    section2Body:
      'Bunlardan birini və ya bir neçəsini, bəzən hamısını bir anda hiss edə bilərsiniz:',
    feelings: [
      {
        title: 'Kədər',
        text: 'Gəlib-gedə bilən, bəzən gözlənilmədən gələn kədər.',
      },
      {
        title: 'Qəzəb',
        text: 'Özünüzə, vəziyyətə və ya ədalətsizlik hissinə qarşı — və bu, narahat olmağa dəyməz.',
      },
      {
        title: 'Boşluq hissi',
        text: 'Yenicə baş verənlərlə bağlı boşluq və ya çaşqınlıq hissi.',
      },
    ],
    section3Body:
      'Özünüzə təzyiq və müqayisə olmadan vaxt vermək sağalmanın vacib hissəsidir.',
    dailySupport: [
      {
        title: 'Özünüzə vaxt vermək',
        text: '“Özünü yaxşı hiss etmək” üçün təzyiq və ya son tarix olmadan.',
      },
      {
        title: 'Özünüzü başqaları ilə müqayisə etməmək',
        text: 'Hər yas özünəməxsusdur; onu keçirməyin düzgün yolu yoxdur.',
      },
      {
        title: 'Hissləri sözlərə çevirmək',
        text: 'Hiss etdiyiniz barədə yazmaq və ya danışmaq emosiyaların yükünü yüngülləşdirməyə kömək edə bilər.',
      },
    ],
    section4Body:
      'Yaxın biri, dəstək qrupu və ya mütəxəssislə danışmaq bu yükü yüngülləşdirməyə kömək edə bilər. Yaxınlar necə kömək edə bilər:',
    supportTitle: 'Yaxın şəxs necə dəstək verə bilər',
    howToSupport: [
      'Mükəmməl sözlər olmasa belə, mühakimə etmədən dinləmək',
      'Təcrübəni kiçiltməkdən çəkinmək (“böyük məsələ deyildi”, “yenidən cəhd edə bilərsən”)',
      'Həll yollarından çox öz mövcudluğunuzu təklif etmək',
      'Sonrakı həftələrdə də hal-əhval tutmağa davam etmək',
    ],
    section5Body:
      'Bəzi əlamətlər peşəkar dəstəyin faydalı ola biləcəyini göstərə bilər:',
    warningTitle: 'Diqqət ediləcək əlamətlər',
    attentionSigns: [
      'Kədər uzun müddət davam edir və yüngülləşmək əvəzinə güclənir',
      'Gündəlik həyatda fəaliyyət göstərmək çətinləşir',
      'Əhəmiyyətli təcrid hissi yaranır',
      'Məcburi düşüncələr və ya əhəmiyyətli sıxıntı görünür',
    ],
    section5InfoTitle: 'Dəstək mövcuddur',
    section5InfoText:
      'Mama, həkim, psixoloq və ya dəstək qrupu mühakimə etmədən sizi dinləyə və dəstəkləyə bilər.',
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Kömək istəmək zəiflik əlaməti deyil — bu, həmin dövrdə özünüzə qulluq etməyin bir yoludur.',
    summaryPoints: [
      'Bu təcrübəni yaşamağın düzgün və ya yanlış yolu yoxdur.',
      'Kədər, qəzəb və ya boşluq hissi normal reaksiyalardır.',
      'Özünüzə təzyiq və müqayisə olmadan vaxt vermək sağalmanın bir hissəsidir.',
      'Yaxın biri, dəstək qrupu və ya mütəxəssislə danışmaq bu yükü yüngülləşdirməyə kömək edə bilər.',
    ],
    disclaimerText:
      'Məlumat xarakterli məzmun. Bu məqalə peşəkar məsləhəti əvəz etmir. Çətin dövr yaşayırsınızsa, tibb işçisi ilə danışmaqdan çəkinməyin.',
    shareMessage: 'Yası emosional olaraq yaşamaq — AWA',
  },
  ka: {
    badge: 'ორსულობის დაკარგვის შემდეგ • ემოციური მხარდაჭერა',
    title: 'გლოვის გავლა\nემოციურად',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'საინფორმაციო შინაარსი',
    intro:
      'ამის გავლის „სწორი“ გზა არ არსებობს. ყველა მას საკუთარი გზით გადის, საკუთარი ტემპით.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რეალური და ლეგიტიმური გლოვა',
      'ემოციები, რომლებიც ადამიანიდან ადამიანამდე განსხვავდება',
      'რა შეიძლება დაგეხმაროთ ყოველდღიურად',
      'ახლობლების მხარდაჭერა',
      'როდის მოვიძიოთ პროფესიონალის დახმარება',
      'მთავარი დასკვნები',
    ],
    section1Body:
      'სევდა, ბრაზი ან სიცარიელის განცდა ამ დაკარგვაზე ნორმალური რეაქციებია, ორსულობის ეტაპის მიუხედავად. ის, რასაც გრძნობთ, აღიარებას იმსახურებს.',
    section1InfoTitle: 'გაითვალისწინეთ',
    section1InfoText:
      'ამის გავლის სწორი ან არასწორი გზა არ არსებობს. თქვენ მიერ განცდილი ყველა ემოცია ლეგიტიმურია.',
    section2Body:
      'შეიძლება იგრძნოთ ერთი ან რამდენიმე მათგანი, ზოგჯერ ერთდროულად:',
    feelings: [
      {
        title: 'სევდა',
        text: 'მწუხარება, რომელიც შეიძლება მოვიდეს და წავიდეს, ზოგჯერ მოულოდნელად.',
      },
      {
        title: 'ბრაზი',
        text: 'საკუთარი თავის, სიტუაციის ან უსამართლობის განცდის მიმართ — და ეს შესაშფოთებელი არ არის.',
      },
      {
        title: 'სიცარიელის განცდა',
        text: 'სიცარიელის ან დაბნეულობის განცდა იმის გამო, რაც ახლახან მოხდა.',
      },
    ],
    section3Body:
      'საკუთარი თავისთვის დროის დათმობა, ზეწოლისა და შედარების გარეშე, განკურნების არსებითი ნაწილია.',
    dailySupport: [
      {
        title: 'საკუთარი თავისთვის დროის დათმობა',
        text: 'ზეწოლის ან „უკეთ გახდომის“ ვადის გარეშე.',
      },
      {
        title: 'სხვებთან შედარების თავიდან აცილება',
        text: 'ყველა გლოვა უნიკალურია; მისი გავლის სწორი გზა არ არსებობს.',
      },
      {
        title: 'სიტყვებით გამოხატვა',
        text: 'იმაზე წერამ ან საუბარმა, რასაც გრძნობთ, შეიძლება თქვენი ემოციების სიმძიმის შემსუბუქებაში დაგეხმაროთ.',
      },
    ],
    section4Body:
      'ახლობელ ადამიანთან, მხარდაჭერის ჯგუფთან ან პროფესიონალთან საუბარმა შეიძლება ამ სიმძიმის შემსუბუქებაში დაგეხმაროთ. აი, როგორ შეუძლიათ ახლობლებს დახმარება:',
    supportTitle: 'როგორ შეუძლია ახლობელს მხარდაჭერა',
    howToSupport: [
      'მოუსმინეთ განსჯის გარეშე, იდეალური სიტყვების გარეშეც კი',
      'აარიდეთ თავი გამოცდილების დაკნინებას („ეს დიდი საქმე არ იყო“, „ისევ სცადებ“)',
      'შესთავაზეთ თქვენი თანდასწრება და არა გადაწყვეტილებები',
      'მომდევნო კვირებშიც განაგრძეთ გამოკითხვა',
    ],
    section5Body:
      'ზოგიერთმა ნიშანმა შეიძლება მიუთითოს, რომ პროფესიონალის მხარდაჭერა სასარგებლო შეიძლება იყოს:',
    warningTitle: 'ნიშნები, რომლებსაც უნდა დააკვირდეთ',
    attentionSigns: [
      'სევდა დიდხანს გრძელდება და ნელდება კი არა, ძლიერდება',
      'ყოველდღიური ფუნქციონირება რთულდება',
      'იზოლაციის მნიშვნელოვანი განცდა მკვიდრდება',
      'ჩნდება ინტრუზიული აზრები ან მნიშვნელოვანი დისკომფორტი',
    ],
    section5InfoTitle: 'მხარდაჭერა ხელმისაწვდომია',
    section5InfoText:
      'ბებიაქალს, ექიმს, ფსიქოლოგს ან მხარდაჭერის ჯგუფს შეუძლია მოგისმინოთ და დაგიჭიროთ მხარი, განსჯის გარეშე.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'დახმარების თხოვნა სისუსტის ნიშანი არ არის — ეს ამ პერიოდში საკუთარ თავზე ზრუნვის გზაა.',
    summaryPoints: [
      'ამ გამოცდილების გავლის სწორი ან არასწორი გზა არ არსებობს.',
      'სევდა, ბრაზი ან სიცარიელის განცდა ნორმალური რეაქციებია.',
      'საკუთარი თავისთვის დროის დათმობა, ზეწოლისა და შედარების გარეშე, განკურნების ნაწილია.',
      'ახლობელ ადამიანთან, მხარდაჭერის ჯგუფთან ან პროფესიონალთან საუბარმა შეიძლება ამ სიმძიმის შემსუბუქებაში დაგეხმაროთ.',
    ],
    disclaimerText:
      'საინფორმაციო შინაარსი. ეს სტატია პროფესიულ რჩევას არ ანაცვლებს. თუ რთულ პერიოდს გადიხართ, ნუ დააყოვნებთ ჯანდაცვის სპეციალისტთან საუბარს.',
    shareMessage: 'გლოვის გავლა, ემოციურად — AWA',
  },
  hy: {
    badge: 'ՎԻԺՈՒՄԻՑ ՀԵՏՈ • ՀՈՒԶԱԿԱՆ ԱՋԱԿՑՈՒԹՅՈՒՆ',
    title: 'Անցնել սուգը\nհուզականորեն',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Տեղեկատվական բովանդակություն',
    intro:
      'Սա անցնելու «ճիշտ» ձև չկա: Յուրաքանչյուրն անցնում է այն յուրովի, իր տեմպով:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Իրական և օրինական սուգ',
      'Հույզեր, որոնք տարբերվում են մարդուց մարդ',
      'Ինչը կարող է օգնել օրեցօր',
      'Մտերիմների աջակցությունը',
      'Երբ դիմել մասնագիտական օգնության',
      'Հիմնական եզրակացություններ',
    ],
    section1Body:
      'Տխրությունը, զայրույթը կամ դատարկության զգացումը այս կորստի նորմալ արձագանքներ են՝ անկախ հղիության փուլից: Այն, ինչ դուք զգում եք, արժանի է ընդունման:',
    section1InfoTitle: 'Հիշեք',
    section1InfoText:
      'Սա անցնելու ճիշտ կամ սխալ ձև չկա: Ձեր զգացած յուրաքանչյուր հույզ օրինական է:',
    section2Body:
      'Դուք կարող եք զգալ սրանցից մեկը կամ մի քանիսը, երբեմն՝ միաժամանակ.',
    feelings: [
      {
        title: 'Տխրություն',
        text: 'Վիշտ, որը կարող է գալ և գնալ, երբեմն՝ անսպասելիորեն:',
      },
      {
        title: 'Զայրույթ',
        text: 'Ինքներդ ձեզ, իրավիճակի կամ անարդարության զգացման նկատմամբ. և դա անհանգստանալու պատճառ չէ:',
      },
      {
        title: 'Դատարկության զգացում',
        text: 'Դատարկության կամ շփոթության զգացում նոր պատահածի առնչությամբ:',
      },
    ],
    section3Body:
      'Ինքներդ ձեզ ժամանակ տալը՝ առանց ճնշման կամ համեմատության, ապաքինման էական մասն է:',
    dailySupport: [
      {
        title: 'Ինքներդ ձեզ ժամանակ տալ',
        text: 'Առանց «լավ զգալու» ճնշման կամ վերջնաժամկետի:',
      },
      {
        title: 'Չհամեմատել ինքներդ ձեզ ուրիշների հետ',
        text: 'Յուրաքանչյուր սուգ եզակի է. այն անցնելու ճիշտ ձև չկա:',
      },
      {
        title: 'Արտահայտել բառերով',
        text: 'Ձեր զգացածի մասին գրելը կամ խոսելը կարող է օգնել թեթևացնել հույզերի բեռը:',
      },
    ],
    section4Body:
      'Ձեզ մոտ մարդու, աջակցության խմբի կամ մասնագետի հետ խոսելը կարող է օգնել թեթևացնել այս բեռը: Ահա թե ինչպես կարող են մտերիմները օգնել.',
    supportTitle: 'Ինչպես կարող է մտերիմը աջակցություն առաջարկել',
    howToSupport: [
      'Լսել առանց դատելու, նույնիսկ կատարյալ բառեր չունենալով',
      'Խուսափել փորձառությունը նսեմացնելուց («մեծ բան չէր», «կարող ես նորից փորձել»)',
      'Առաջարկել ձեր ներկայությունը՝ լուծումների փոխարեն',
      'Շարունակել հետաքրքրվել հաջորդ շաբաթների ընթացքում',
    ],
    section5Body:
      'Որոշ նշաններ կարող են ցույց տալ, որ մասնագիտական աջակցությունը կարող է օգտակար լինել.',
    warningTitle: 'Նշաններ, որոնց պետք է ուշադրություն դարձնել',
    attentionSigns: [
      'Տխրությունը երկար է տևում և ուժեղանում է, այլ ոչ թե թեթևանում',
      'Դժվարանում է առօրյայում գործել',
      'Հաստատվում է մեկուսացվածության զգալի զգացում',
      'Հայտնվում են ներխուժող մտքեր կամ զգալի անհարմարություն',
    ],
    section5InfoTitle: 'Աջակցությունը հասանելի է',
    section5InfoText:
      'Մանկաբարձուհին, բժիշկը, հոգեբանը կամ աջակցության խումբը կարող է լսել և աջակցել ձեզ՝ առանց դատելու:',
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Օգնություն խնդրելը թուլության նշան չէ. դա այս ժամանակահատվածում ձեր մասին հոգ տանելու եղանակ է:',
    summaryPoints: [
      'Այս փորձառությունն անցնելու ճիշտ կամ սխալ ձև չկա:',
      'Տխրությունը, զայրույթը կամ դատարկության զգացումը նորմալ արձագանքներ են:',
      'Ինքներդ ձեզ ժամանակ տալը՝ առանց ճնշման կամ համեմատության, ապաքինման մաս է:',
      'Ձեզ մոտ մարդու, աջակցության խմբի կամ մասնագետի հետ խոսելը կարող է օգնել թեթևացնել այս բեռը:',
    ],
    disclaimerText:
      'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում մասնագիտական խորհրդատվությանը: Եթե դժվար շրջան եք ապրում, մի տատանվեք խոսել առողջապահության մասնագետի հետ:',
    shareMessage: 'Անցնել սուգը հուզականորեն — AWA',
  },
  tg: {
    badge: 'ПАС АЗ ВИЖИШ • ДАСТГИРИИ ҲИССӢ',
    title: 'Аз сар гузаронидани\nғам аз ҷиҳати ҳиссӣ',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни иттилоотӣ',
    intro:
      'Роҳи дурусти аз сар гузаронидани ин вуҷуд надорад. Ҳар кас онро ба таври худ, бо суръати худ мегузаронад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ғами воқеӣ ва қонунӣ',
      'Эҳсосоте, ки аз шахс ба шахс фарқ мекунанд',
      'Чӣ метавонад дар ҳаёти ҳаррӯза кумак кунад',
      'Дастгирии наздикон',
      'Кай кумаки касбӣ ҷустан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    section1Body:
      'Ғамгинӣ, хашм ё эҳсоси холигӣ вокунишҳои муқаррарӣ ба ин талафот мебошанд, новобаста аз марҳилаи ҳомиладорӣ. Он чи шумо эҳсос мекунед, сазовори эътироф аст.',
    section1InfoTitle: 'Дар хотир доред',
    section1InfoText:
      'Роҳи дуруст ё нодурусти аз сар гузаронидани ин вуҷуд надорад. Ҳар эҳсосе, ки доред, эътибор дорад.',
    section2Body:
      'Шумо метавонед яке ё якчандтои инҳоро, баъзан ҳамзамон, эҳсос кунед:',
    feelings: [
      {
        title: 'Ғамгинӣ',
        text: 'Андӯҳе, ки метавонад биёяд ва равад, баъзан ғайричашмдошт.',
      },
      {
        title: 'Хашм',
        text: 'Нисбат ба худ, вазъият ё эҳсоси беадолатӣ — ва ин чизест, ки нигарон кунад, нест.',
      },
      {
        title: 'Эҳсоси холигӣ',
        text: 'Эҳсоси холигӣ ё саргардонӣ дар бораи он чи рух дод.',
      },
    ],
    section3Body:
      'Ба худ вақт додан, бе фишор ва муқоиса, қисми муҳими шифо ёфтан аст.',
    dailySupport: [
      {
        title: 'Ба худ вақт додан',
        text: 'Бе фишор ё мӯҳлат барои «беҳтар шудан».',
      },
      {
        title: 'Худро бо дигарон муқоиса накардан',
        text: 'Ҳар ғам беназир аст; роҳи дурусти аз сар гузаронидани он вуҷуд надорад.',
      },
      {
        title: 'Ба сухан овардан',
        text: 'Навиштан ё гап задан дар бораи он чи эҳсос мекунед, метавонад ба сабук кардани бори эҳсосот кумак кунад.',
      },
    ],
    section4Body:
      'Гап задан бо касе аз наздикон, гурӯҳи дастгирӣ ё мутахассис метавонад ба сабук кардани ин бор кумак кунад. Инак чӣ тавр наздикон метавонанд кумак кунанд:',
    supportTitle: 'Чӣ тавр наздик метавонад дастгирӣ кунад',
    howToSupport: [
      'Бидуни доварӣ гӯш диҳед, ҳатто бидуни он ки суханони комил дошта бошед',
      'Аз кам кардани аҳамияти таҷриба худдорӣ кунед («чизи калоне набуд», «боз кӯшиш карда метавонед»)',
      'Ҳузури худро пешниҳод кунед, на ҳалли масъала',
      'Дар ҳафтаҳои минбаъда ҳол пурсиданро идома диҳед',
    ],
    section5Body:
      'Баъзе нишонаҳо метавонанд нишон диҳанд, ки дастгирии касбӣ метавонад муфид бошад:',
    warningTitle: 'Нишонаҳое, ки бояд пайгирӣ кард',
    attentionSigns: [
      'Ғамгинӣ муддати дароз давом мекунад ва ба ҷои сабук шудан шадидтар мешавад',
      'Фаъолият дар ҳаёти ҳаррӯза душвор мешавад',
      'Эҳсоси назарраси танҳоӣ пайдо мешавад',
      'Фикрҳои нохостаи халалрасон ё ноороми назаррас пайдо мешаванд',
    ],
    section5InfoTitle: 'Дастгирӣ дастрас аст',
    section5InfoText:
      'Доя, табиб, равоншинос ё гурӯҳи дастгирӣ метавонад бидуни доварӣ гӯш диҳад ва шуморо дастгирӣ кунад.',
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Кумак пурсидан нишонаи заъф нест — роҳи ғамхорӣ аз худ дар ин давра аст.',
    summaryPoints: [
      'Роҳи дуруст ё нодурусти аз сар гузаронидани ин таҷриба вуҷуд надорад.',
      'Ғамгинӣ, хашм ё эҳсоси холигӣ вокунишҳои муқаррарӣ мебошанд.',
      'Ба худ вақт додан, бе фишор ва муқоиса, қисми шифо ёфтан аст.',
      'Гап задан бо касе аз наздикон, гурӯҳи дастгирӣ ё мутахассис метавонад ба сабук кардани ин бор кумак кунад.',
    ],
    disclaimerText:
      'Мазмуни иттилоотӣ. Ин мақола маслиҳати касбиро иваз намекунад. Агар лаҳзаи душворро аз сар мегузаронед, бо мутахассиси соҳаи тиб гап задан шарм надоред.',
    shareMessage: 'Аз сар гузаронидани ғам аз ҷиҳати ҳиссӣ — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК ҮЗҮЛГӨНДӨН КИЙИН • ЭМОЦИОНАЛДЫК КОЛДОО',
    title: 'Кайгыны эмоционалдык жактан\nбашынан өткөрүү',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Маалымат берүүчү мазмун',
    intro:
      'Бул сыноодон өтүүнүн туура жолу жок. Ар бир адам аны өз жолу менен, өз темпинде өтөт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Чыныгы жана мыйзамдуу кайгы',
      'Адамдан адамга айырмаланган эмоциялар',
      'Күнүмдүк жашоодо эмне жардам бериши мүмкүн',
      'Жакындардын колдоосу',
      'Кесипкөй жардамга качан кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    section1Body:
      'Кайгы, ачуу же бошоңдук сезими бул жоготууга карата кадимки реакциялар, курсактуулуктун кайсы этабы болбосун. Сезип жаткан нерсеңиз таанууга татыйт.',
    section1InfoTitle: 'Эстен чыгарбаңыз',
    section1InfoText:
      'Бул сыноодон өтүүнүн туура же туура эмес жолу жок. Сезген ар бир эмоцияңыз мыйзамдуу.',
    section2Body:
      'Булардын бирин же бир нечесин, кээде баарын бир эле учурда сезишиңиз мүмкүн:',
    feelings: [
      {
        title: 'Кайгы',
        text: 'Келип-кетип турушу мүмкүн болгон, кээде күтүлбөгөн жерден келген капа.',
      },
      {
        title: 'Ачуу',
        text: 'Өзүңүзгө, абалга же адилетсиздик сезимине карата — жана бул санааркоого негиз эмес.',
      },
      {
        title: 'Бошоңдук сезими',
        text: 'Жаңы эле болгон нерсе жөнүндө бошоңдук же башаламандык сезими.',
      },
    ],
    section3Body:
      'Өзүңүзгө кысымсыз жана салыштырбастан убакыт берүү айыгуунун маанилүү бөлүгү.',
    dailySupport: [
      {
        title: 'Өзүңүзгө убакыт берүү',
        text: '«Жакшы болуу» үчүн кысымсыз жана мөөнөтсүз.',
      },
      {
        title: 'Өзүңүздү башкалар менен салыштырбоо',
        text: 'Ар бир кайгы уникалдуу; аны башынан өткөрүүнүн туура жолу жок.',
      },
      {
        title: 'Сөзгө айландыруу',
        text: 'Сезгениңиз жөнүндө жазуу же сүйлөшүү эмоцияларыңыздын оордугун жеңилдетүүгө жардам бериши мүмкүн.',
      },
    ],
    section4Body:
      'Жакын адам, колдоо тобу же адис менен сүйлөшүү бул оордукту жеңилдетүүгө жардам бериши мүмкүн. Жакындар кантип жардам бере алат:',
    supportTitle: 'Жакын адам кантип колдоо көрсөтө алат',
    howToSupport: [
      'Соттобой угуу, ал тургай кемчиликсиз сөздөр жок болсо да',
      'Тажрыйбаны кичирейтүүдөн сактануу («чоң иш эмес», «кайра аракет кылсаң болот»)',
      'Чечимдердин ордуна өз катышуусун сунуштоо',
      'Кийинки жумаларда абалын сурап туруу',
    ],
    section5Body:
      'Айрым белгилер кесипкөй колдоо пайдалуу болушу мүмкүн экенин көрсөтөт:',
    warningTitle: 'Көңүл бура турган белгилер',
    attentionSigns: [
      'Кайгы узак убакыт созулат жана жеңилдебестен күчөйт',
      'Күнүмдүк жашоодо иштөө кыйындайт',
      'Олуттуу обочолонуу сезими пайда болот',
      'Кирип алган ойлор же олуттуу кысымчылык пайда болот',
    ],
    section5InfoTitle: 'Колдоо бар',
    section5InfoText:
      'Акушерка, дарыгер, психолог же колдоо тобу сизди соттобостон угуп, колдой алат.',
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Жардам сурап кайрылуу алсыздыктын белгиси эмес — бул мезгилде өзүңүзгө кам көрүүнүн бир жолу.',
    summaryPoints: [
      'Бул тажрыйбадан өтүүнүн туура же туура эмес жолу жок.',
      'Кайгы, ачуу же бошоңдук сезими кадимки реакциялар.',
      'Өзүңүзгө кысымсыз жана салыштырбастан убакыт берүү айыгуунун бир бөлүгү.',
      'Жакын адам, колдоо тобу же адис менен сүйлөшүү бул оордукту жеңилдетүүгө жардам бериши мүмкүн.',
    ],
    disclaimerText:
      'Маалымат берүүчү мазмун. Бул макала кесипкөй кеңешти алмаштырбайт. Эгер кыйын мезгилди башыңыздан өткөрүп жатсаңыз, ден соолук сактоо адиси менен сүйлөшүүдөн тартынбаңыз.',
    shareMessage: 'Кайгыны эмоционалдык жактан башынан өткөрүү — AWA',
  },
  tk: {
    badge: 'GÖWRELILIGIŇ ÝITIRILMEGINDEN SOŇ • DUÝGUSAL GOLDAW',
    title: 'Gaýgydan duýgusal\ngeçmek',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Maglumat berýän mazmun',
    intro:
      'Muny başdan geçirmegiň dogry ýoly ýok. Her kim muny öz ýolunda, öz ritmiňde geçýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Hakyky we kanuny gaýgy',
      'Adamdan adama tapawutlanýan duýgular',
      'Gündelik näme kömek edip biler',
      'Ýakynlaryň goldawy',
      'Hünärmen kömegini haçan soramaly',
      'Esasy netijeler',
    ],
    section1Body:
      'Gam, gahar ýa-da boşluk duýgusy göwreliligiň haýsy tapgyrynda bolandygyna garamazdan, bu ýitgä adaty reaksiýalar. Duýýanlaryňyz ykrar edilmäge mynasyp.',
    section1InfoTitle: 'Ýatda saklaň',
    section1InfoText:
      'Muny başdan geçirmegiň dogry ýa-da nädogry ýoly ýok. Duýýan her duýgyňyz kanuny.',
    section2Body:
      'Şulardan birini ýa-da birnäçesini, käwagt hemmesini bir wagtda duýup bilersiňiz:',
    feelings: [
      {
        title: 'Gam',
        text: 'Gelip-gidip biljek, käwagt garaşylmadyk ýagdaýda peýda bolýan hasrat.',
      },
      {
        title: 'Gahar',
        text: 'Özüňize, ýagdaýa ýa-da adalatsyzlyk duýgusyna garşy — bu alada üçin sebäp däl.',
      },
      {
        title: 'Boşluk duýgusy',
        text: 'Ýaňy bolan zat barada boşluk ýa-da bulaşyklyk duýgusy.',
      },
    ],
    section3Body:
      'Özüňize basyşsyz, deňeşdirmesiz wagt bermek sagalyşyň möhüm bölegi.',
    dailySupport: [
      {
        title: 'Özüňize wagt bermek',
        text: '«Özüňi gowy duýmak» üçin basyşsyz ýa-da möhletsiz.',
      },
      {
        title: 'Özüňizi başgalar bilen deňeşdirmezlik',
        text: 'Her gaýgy ýeke-täk; muny başdan geçirmegiň dogry ýoly ýok.',
      },
      {
        title: 'Muny sözlere öwürmek',
        text: 'Duýýanlaryňyz barada ýazmak ýa-da gürlemek duýgularyňyzyň agramyny ýeňilleşdirip biler.',
      },
    ],
    section4Body:
      'Ýakyn adamyňyz, goldaw topary ýa-da hünärmen bilen gürleşmek bu agramy ýeňilleşdirmäge kömek edip biler. Ýakynlar nähili kömek edip biler:',
    supportTitle: 'Ýakyn adam nähili goldaw berip biler',
    howToSupport: [
      'Barlamazdan diňläň, hatda kämil sözleriňiz bolmasa-da',
      'Tejribäni kiçeltmekden gaça duruň («uly zat däldi», «täzeden synanyşyp bilersiň»)',
      'Çözgütleriň ýerine ýanyňyzda bolmagy hödürläň',
      'Indiki hepdelerde hal-ahwal soramagy dowam ediň',
    ],
    section5Body:
      'Käbir alamatlar hünärmen goldawynyň peýdaly bolup biljekdigini görkezip biler:',
    warningTitle: 'Üns bermeli alamatlar',
    attentionSigns: [
      'Gam uzak wagt dowam edýär we ýeňilleşmän, güýçlenýär',
      'Gündelik işlemek kynlaşýar',
      'Möhüm ýekelik duýgusy peýda bolýar',
      'Gaýtalanýan pikirler ýa-da möhüm ejir peýda bolýar',
    ],
    section5InfoTitle: 'Goldaw elýeter',
    section5InfoText:
      'Akuşerka, lukman, psiholog ýa-da goldaw topary sizi ýazgarmazdan diňläp we goldap biler.',
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Kömek soramak ejizligiň alamaty däl — bu wagtda özüňize ideg etmegiň usuly.',
    summaryPoints: [
      'Bu tejribäni başdan geçirmegiň dogry ýa-da nädogry ýoly ýok.',
      'Gam, gahar ýa-da boşluk duýgusy adaty reaksiýalar.',
      'Özüňize basyşsyz, deňeşdirmesiz wagt bermek sagalyşyň bir bölegi.',
      'Ýakyn adamyňyz, goldaw topary ýa-da hünärmen bilen gürleşmek bu agramy ýeňilleşdirmäge kömek edip biler.',
    ],
    disclaimerText:
      'Maglumat berýän mazmun. Bu makala hünärmen maslahatyny çalyşmaýar. Kyn döwri başdan geçirýän bolsaňyz, saglyk hünärmeni bilen gürleşmekden çekinmäň.',
    shareMessage: 'Gaýgydan duýgusal geçmek — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MiscarriageGriefArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.section1InfoTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.section1InfoText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body}</AwaText>

          <View style={styles.normalGrid}>
            {content.feelings.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={FEELING_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {content.dailySupport.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.dailySupport.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={DAILY_SUPPORT_ICONS[index] as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>{item.text}</AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="account-group-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={[styles.warningTitle, styles.supportTitle]}>
                {content.supportTitle}
              </AwaText>
            </View>

            {content.howToSupport.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={theme.colors.success}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section5Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>{content.warningTitle}</AwaText>
            </View>

            {content.attentionSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="account-heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.section5InfoTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.section5InfoText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tipText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>{content.disclaimerText}</AwaText>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
    marginTop: 28,
  },
  body: {marginTop: 8},

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

  normalGrid: {marginTop: 12, gap: 8},
  normalCard: {
    padding: 12,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8},
  normalText: {marginTop: 4},

  comfortCard: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 12},
  comfortText: {marginTop: 3},

  warningCard: {
    marginTop: 12,
    padding: 16,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8},
  supportTitle: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 4},

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12},
  summaryText: {flex: 1},

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {flex: 1},
  });
}
