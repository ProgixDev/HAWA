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
  ms: {
    badge: 'SELEPAS KEGUGURAN • SOKONGAN EMOSI',
    title: 'Melalui kesedihan\ndari sudut emosi',
    metaDuration: '7 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan maklumat',
    intro:
      'Tiada cara yang betul untuk melaluinya. Setiap orang melaluinya dengan caranya sendiri, mengikut rentaknya sendiri.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kesedihan yang nyata dan sah',
      'Emosi yang berbeza dari seorang ke seorang',
      'Apa yang mungkin membantu dari hari ke hari',
      'Sokongan daripada orang tersayang',
      'Bila untuk mendapatkan bantuan profesional',
      'Perkara penting untuk diingat',
    ],
    section1Body:
      'Kesedihan, kemarahan atau rasa kosong ialah tindak balas normal terhadap kehilangan ini, apa pun peringkat kehamilan. Apa yang anda rasa wajar diakui.',
    section1InfoTitle: 'Perlu diingat',
    section1InfoText:
      'Tiada cara yang betul atau salah untuk melaluinya. Setiap emosi yang anda rasa adalah sah.',
    section2Body:
      'Anda mungkin merasai satu atau lebih daripada ini, kadangkala sekali gus:',
    feelings: [
      {
        title: 'Kesedihan',
        text: 'Kedukaan yang boleh datang dan pergi, kadangkala tanpa dijangka.',
      },
      {
        title: 'Kemarahan',
        text: 'Terhadap diri sendiri, keadaan atau rasa ketidakadilan — dan itu bukan sesuatu yang perlu dibimbangkan.',
      },
      {
        title: 'Rasa kosong',
        text: 'Perasaan kosong atau keliru tentang apa yang baru berlaku.',
      },
    ],
    section3Body:
      'Memberi diri anda masa, tanpa tekanan atau perbandingan, ialah bahagian penting dalam penyembuhan.',
    dailySupport: [
      {
        title: 'Memberi diri anda masa',
        text: 'Tanpa tekanan atau tarikh akhir untuk “berasa lebih baik.”',
      },
      {
        title: 'Tidak membandingkan diri dengan orang lain',
        text: 'Setiap kesedihan adalah unik; tiada cara yang betul untuk melaluinya.',
      },
      {
        title: 'Meluahkannya dengan kata-kata',
        text: 'Menulis atau berbicara tentang apa yang anda rasa boleh membantu meringankan beban emosi anda.',
      },
    ],
    section4Body:
      'Berbicara dengan seseorang yang rapat dengan anda, kumpulan sokongan atau pengamal profesional boleh membantu meringankan beban ini. Berikut cara orang tersayang boleh membantu:',
    supportTitle: 'Bagaimana orang tersayang boleh menawarkan sokongan',
    howToSupport: [
      'Mendengar tanpa menghakimi, walaupun tanpa kata-kata yang sempurna',
      'Mengelakkan memperkecilkan pengalaman itu (“bukan perkara besar,” “anda boleh mencuba lagi”)',
      'Menawarkan kehadiran dan bukan penyelesaian',
      'Terus bertanya khabar dalam minggu-minggu berikutnya',
    ],
    section5Body:
      'Sesetengah tanda mungkin menunjukkan bahawa sokongan profesional boleh membantu:',
    warningTitle: 'Tanda yang perlu diperhatikan',
    attentionSigns: [
      'Kesedihan berlarutan lama dan bertambah kuat dan bukan reda',
      'Menjadi sukar untuk berfungsi dari hari ke hari',
      'Rasa terasing yang ketara timbul',
      'Fikiran yang mengganggu atau kesusahan yang ketara muncul',
    ],
    section5InfoTitle: 'Sokongan tersedia',
    section5InfoText:
      'Bidan, doktor, ahli psikologi atau kumpulan sokongan boleh mendengar dan menyokong anda, tanpa menghakimi.',
    tipTitle: 'Elok diketahui',
    tipText:
      'Meminta bantuan bukan tanda kelemahan — ia satu cara menjaga diri anda pada masa ini.',
    summaryPoints: [
      'Tiada cara yang betul atau salah untuk melalui pengalaman ini.',
      'Kesedihan, kemarahan atau rasa kosong ialah tindak balas normal.',
      'Memberi diri anda masa, tanpa tekanan atau perbandingan, ialah sebahagian daripada penyembuhan.',
      'Berbicara dengan seseorang yang rapat dengan anda, kumpulan sokongan atau pengamal profesional boleh membantu meringankan beban ini.',
    ],
    disclaimerText:
      'Kandungan bersifat maklumat. Artikel ini tidak menggantikan nasihat profesional. Jika anda sedang melalui masa yang sukar, jangan teragak-agak berbicara dengan pengamal penjagaan kesihatan.',
    shareMessage: 'Melalui kesedihan, dari sudut emosi — AWA',
  },
  so: {
    badge: 'UUR-LUMIS KA DIB • TAAGEERO DAREEN',
    title: 'Marista barooranaanta\ndareenka ahaan',
    metaDuration: '7 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad',
    intro:
      'Hab sax ah oo lagu maro tan ma jiro. Qof kastaa wuxuu ku maraa si u gaar ah, xawaarihiisa.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Barooranaan dhab ah oo sharci ah',
      'Dareenno ku kala duwan qof ilaa qof',
      'Waxa caawin kara maalin kasta',
      'Taageerada dadka kuu dhow',
      'Goorta caawimaad xirfadle la raadsado',
      'Qodobbada muhiimka ah',
    ],
    section1Body:
      'Murugo, cadho, ama dareen madhnaan waa falcelinno caadi ah oo lumistan ah, heerka uurku wuu kasta ha ahaadee. Waxa aad dareemaysid waa mudan in la qiro.',
    section1InfoTitle: 'Maskaxda ku hay',
    section1InfoText:
      'Hab sax ah ama khalad ah oo lagu maro tan ma jiro. Dareen kasta oo aad dareento waa mid sax ah.',
    section2Body:
      'Waxaad dareemi kartaa mid ama dhowr ka mid ah kuwan, mararka qaarkood isku mar:',
    feelings: [
      {
        title: 'Murugo',
        text: 'Murugo imaan karta oo tegi karta, mararka qaarkood lama filaan.',
      },
      {
        title: 'Cadho',
        text: 'Xagga naftaada, xaaladda, ama dareen aan cadaalad ahayn — taasna wax laga walaacsan yahay ma aha.',
      },
      {
        title: 'Dareen madhnaan',
        text: 'Dareen madhnaan ama jaha-wareer ku saabsan waxa hadda dhacay.',
      },
    ],
    section3Body:
      'Siinta naftaada waqti, cadaadis ama barbar dhig la’aan, waa qayb muhiim ah oo bogsiinta ka mid ah.',
    dailySupport: [
      {
        title: 'Naftaada waqti sii',
        text: 'Cadaadis ama wakhti kama dambeys ah oo “wanaagsan dareenka” la’aan.',
      },
      {
        title: 'Ha barbar dhigin kuwa kale',
        text: 'Barooranaan kastaa waa gaar; hab sax ah oo lagu maro ma jiro.',
      },
      {
        title: 'U beddel eray',
        text: 'Qorista ama hadalka waxa aad dareemayso ayaa caawin kara fududaynta culayska dareennadaada.',
      },
    ],
    section4Body:
      'La hadalka qof kuu dhow, koox taageero, ama xirfadle ayaa caawin kara fududaynta culaygan. Waa kuwan siyaabaha dadka kuu dhow ay kaa caawin karaan:',
    supportTitle: 'Sida qof kuu dhow u bixin karo taageero',
    howToSupport: [
      'Dhegeyso xukun la’aan, xataa haddii aanad haysan ereyada qumman',
      'Ka fogow yareynta khibradda (“wax weyn ma ahayn,” “mar kale ayaad isku dayi kartaa”)',
      'Bixi joogitaankaaga halkii aad bixin lahayd xalal',
      'Sii wad hubinta toddobaadyada xiga',
    ],
    section5Body:
      'Calaamado qaar ayaa muujin kara in taageero xirfadle ay faa’iido yeelan karto:',
    warningTitle: 'Calaamadaha la eego',
    attentionSigns: [
      'Murugadu waqti dheer ayay socotaa oo way xoogaysataa halkii ay hagaagi lahayd',
      'Waxay noqotaa mid adag in maalin kasta la shaqeeyo',
      'Dareen go’doon weyn ayaa soo baxa',
      'Fikrado soo gelaya ama dhib weyn ayaa soo muuqda',
    ],
    section5InfoTitle: 'Taageero way jirtaa',
    section5InfoText:
      'Umulis, dhakhtar, saykolaji, ama koox taageero ayaa ku dhegeysan kara oo ku taageeri kara, xukun la’aan.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText:
      'Weydiisashada caawimaad ma aha calaamad daciifnimo — waa hab aad naftaada ku daryeesho wakhtigan.',
    summaryPoints: [
      'Hab sax ah ama khalad ah oo lagu maro khibradan ma jiro.',
      'Murugo, cadho, ama dareen madhnaan waa falcelinno caadi ah.',
      'Siinta naftaada waqti, cadaadis ama barbar dhig la’aan, waa qayb ka mid ah bogsiinta.',
      'La hadalka qof kuu dhow, koox taageero, ama xirfadle ayaa caawin kara fududaynta culaygan.',
    ],
    disclaimerText:
      'Macluumaad. Maqaalkan ma beddelo talo xirfadle. Haddii aad marayso waqti adag, ha ka waaban inaad la hadasho xirfadle caafimaad.',
    shareMessage: 'Marista barooranaanta, dareenka ahaan — AWA',
  },
  sw: {
    badge: 'BAADA YA KUHARIBIKA KWA MIMBA • MSAADA WA KIHISIA',
    title: 'Kupitia huzuni\nkihisia',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui ya taarifa',
    intro:
      'Hakuna njia sahihi ya kupitia hili. Kila mtu hupita kwa njia yake mwenyewe, kwa mwendo wake mwenyewe.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Huzuni halisi na halali',
      'Hisia zinazotofautiana kati ya mtu na mtu',
      'Kinachoweza kusaidia kila siku',
      'Msaada kutoka kwa wapendwa',
      'Wakati wa kutafuta msaada wa kitaalamu',
      'Mambo muhimu ya kukumbuka',
    ],
    section1Body:
      'Huzuni, hasira, au hisia ya utupu ni miitikio ya kawaida kwa hasara hii, bila kujali hatua ya ujauzito. Unachohisi kinastahili kutambuliwa.',
    section1InfoTitle: 'Kumbuka',
    section1InfoText:
      'Hakuna njia sahihi wala isiyo sahihi ya kupitia hili. Kila hisia unayohisi ni halali.',
    section2Body:
      'Unaweza kuhisi moja au zaidi ya hizi, wakati mwingine zote kwa wakati mmoja:',
    feelings: [
      {
        title: 'Huzuni',
        text: 'Maumivu ya moyo yanayoweza kuja na kuondoka, wakati mwingine bila kutarajia.',
      },
      {
        title: 'Hasira',
        text: 'Kuelekea wewe mwenyewe, hali, au hisia ya kutokuwa na haki — na hilo si jambo la kuwa na wasiwasi nalo.',
      },
      {
        title: 'Hisia ya utupu',
        text: 'Hisia ya ubatili au mchanganyiko kuhusu kilichotokea hivi punde.',
      },
    ],
    section3Body:
      'Kujipa muda, bila shinikizo wala ulinganisho, ni sehemu muhimu ya uponyaji.',
    dailySupport: [
      {
        title: 'Kujipa muda',
        text: 'Bila shinikizo au tarehe ya mwisho ya “kujisikia vizuri.”',
      },
      {
        title: 'Kutojilinganisha na wengine',
        text: 'Kila huzuni ni ya kipekee; hakuna njia sahihi ya kuipitia.',
      },
      {
        title: 'Kuweka katika maneno',
        text: 'Kuandika au kuzungumza kuhusu unachohisi kunaweza kusaidia kupunguza uzito wa hisia zako.',
      },
    ],
    section4Body:
      'Kuzungumza na mtu wa karibu nawe, kikundi cha msaada, au mtaalamu kunaweza kusaidia kupunguza uzito huu. Hivi ndivyo wapendwa wanaweza kusaidia:',
    supportTitle: 'Jinsi mpendwa anavyoweza kutoa msaada',
    howToSupport: [
      'Sikiliza bila kuhukumu, hata bila kuwa na maneno kamili',
      'Epuka kupunguza uzito wa uzoefu (“haikuwa jambo kubwa,” “unaweza kujaribu tena”)',
      'Toa uwepo wako badala ya suluhisho',
      'Endelea kumjulia hali katika wiki zinazofuata',
    ],
    section5Body:
      'Baadhi ya dalili zinaweza kuashiria kuwa msaada wa kitaalamu unaweza kuwa wa manufaa:',
    warningTitle: 'Dalili za kuzingatia',
    attentionSigns: [
      'Huzuni inadumu kwa muda mrefu na kuongezeka badala ya kupungua',
      'Inakuwa vigumu kufanya kazi za kila siku',
      'Hisia kubwa ya kutengwa inajitokeza',
      'Mawazo yanayoingilia au dhiki kubwa inaonekana',
    ],
    section5InfoTitle: 'Msaada unapatikana',
    section5InfoText:
      'Mkunga, daktari, mwanasaikolojia, au kikundi cha msaada kinaweza kukusikiliza na kukusaidia, bila kuhukumu.',
    tipTitle: 'Vyema kujua',
    tipText:
      'Kuomba msaada si dalili ya udhaifu — ni njia ya kujijali katika kipindi hiki.',
    summaryPoints: [
      'Hakuna njia sahihi wala isiyo sahihi ya kupitia uzoefu huu.',
      'Huzuni, hasira, au hisia ya utupu ni miitikio ya kawaida.',
      'Kujipa muda, bila shinikizo wala ulinganisho, ni sehemu ya uponyaji.',
      'Kuzungumza na mtu wa karibu nawe, kikundi cha msaada, au mtaalamu kunaweza kusaidia kupunguza uzito huu.',
    ],
    disclaimerText:
      'Maudhui ya taarifa. Makala hii haichukui nafasi ya ushauri wa kitaalamu. Ikiwa unapitia kipindi kigumu, usisite kuzungumza na mtaalamu wa afya.',
    shareMessage: 'Kupitia huzuni, kihisia — AWA',
  },
  kk: {
    badge: 'ТҮСІКТЕН КЕЙІН • ЭМОЦИЯЛЫҚ ҚОЛДАУ',
    title: 'Қайғыны эмоциялық\nтүрде бастан өткеру',
    metaDuration: '7 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Ақпараттық мазмұн',
    intro:
      'Бұдан өтудің дұрыс жолы жоқ. Әркім оны өз жолымен, өз қарқынымен бастан өткереді.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Нақты және заңды қайғы',
      'Әр адамда әртүрлі эмоциялар',
      'Күнделікті не көмектесе алады',
      'Жақындардың қолдауы',
      'Кәсіби көмекті қашан іздеу керек',
      'Негізгі қорытындылар',
    ],
    section1Body:
      'Мұң, ашу немесе бостық сезімі — жүктілік кезеңіне қарамастан, осы жоғалтуға қалыпты реакциялар. Сіз сезетін нәрсе мойындалуға тұрарлық.',
    section1InfoTitle: 'Есте сақтаңыз',
    section1InfoText:
      'Бұдан өтудің дұрыс немесе бұрыс жолы жоқ. Сіз сезетін әрбір эмоция заңды.',
    section2Body:
      'Мыналардың біреуін немесе бірнешеуін, кейде бәрін бір мезгілде сезінуіңіз мүмкін:',
    feelings: [
      {
        title: 'Мұң',
        text: 'Келіп-кетуі мүмкін, кейде күтпеген жерден болатын қайғы.',
      },
      {
        title: 'Ашу',
        text: 'Өзіңізге, жағдайға немесе әділетсіздік сезіміне қарсы — және бұл алаңдайтын нәрсе емес.',
      },
      {
        title: 'Бостық сезімі',
        text: 'Жаңа болған жағдайға қатысты бостық немесе абыржу сезімі.',
      },
    ],
    section3Body:
      'Өзіңізге қысымсыз, салыстырусыз уақыт беру — емделудің маңызды бөлігі.',
    dailySupport: [
      {
        title: 'Өзіңізге уақыт беру',
        text: '“Жақсы сезінудің” қысымынсыз немесе мерзімінсіз.',
      },
      {
        title: 'Өзіңізді басқалармен салыстырмау',
        text: 'Әр қайғы бірегей; оны бастан өткерудің дұрыс жолы жоқ.',
      },
      {
        title: 'Сөзбен жеткізу',
        text: 'Сезінгеніңіз туралы жазу немесе айту эмоцияларыңыздың ауырлығын жеңілдетуге көмектесе алады.',
      },
    ],
    section4Body:
      'Жақын адаммен, қолдау тобымен немесе маманмен сөйлесу бұл ауырлықты жеңілдетуге көмектесе алады. Міне, жақындар қалай көмектесе алады:',
    supportTitle: 'Жақын адам қолдауды қалай көрсете алады',
    howToSupport: [
      'Тамаша сөздер болмаса да, сынамай тыңдаңыз',
      'Тәжірибені кішірейтуден аулақ болыңыз (“бұл үлкен мәселе емес еді,” “қайта тырыса аласыз”)',
      'Шешімдердің орнына өз қасында болуыңызды ұсыныңыз',
      'Келесі апталарда жағдайын сұрап тұрыңыз',
    ],
    section5Body:
      'Кейбір белгілер кәсіби қолдаудың пайдалы болуы мүмкін екенін көрсетуі мүмкін:',
    warningTitle: 'Назар аударатын белгілер',
    attentionSigns: [
      'Мұң ұзақ уақытқа созылады және басылудың орнына күшейеді',
      'Күнделікті жұмыс істеу қиындайды',
      'Айтарлықтай оқшаулану сезімі пайда болады',
      'Кіріп кететін ойлар немесе айтарлықтай күйзеліс пайда болады',
    ],
    section5InfoTitle: 'Қолдау қолжетімді',
    section5InfoText:
      'Акушер, дәрігер, психолог немесе қолдау тобы сізді сынамай тыңдап, қолдай алады.',
    tipTitle: 'Білуге тиісті',
    tipText:
      'Көмек сұрау әлсіздіктің белгісі емес — бұл осы уақытта өзіңізге қамқор болудың бір жолы.',
    summaryPoints: [
      'Бұл тәжірибені бастан өткерудің дұрыс немесе бұрыс жолы жоқ.',
      'Мұң, ашу немесе бостық сезімі — қалыпты реакциялар.',
      'Өзіңізге қысымсыз, салыстырусыз уақыт беру — емделудің бір бөлігі.',
      'Жақын адаммен, қолдау тобымен немесе маманмен сөйлесу бұл ауырлықты жеңілдетуге көмектесе алады.',
    ],
    disclaimerText:
      'Ақпараттық мазмұн. Бұл мақала кәсіби кеңестің орнын баспайды. Қиын кезеңді бастан өткеріп жатсаңыз, медицина маманымен сөйлесуден тартынбаңыз.',
    shareMessage: 'Қайғыны эмоциялық түрде бастан өткеру — AWA',
  },
  wo: {
    badge: 'GINNAAW ËMB BU REES • DIMBALI CI XOL',
    title: 'Jàll tiis\nci xol',
    metaDuration: '7 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind ngir xibaar',
    intro:
      'Amul anam bu jub ngir jàll loolu. Ku nekk dafay jàll ko ci anamam, ci ritmam.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Benn tiis bu dëgg te jub',
      'Dégg yu wuute ci nit ak nit',
      'Li mën a dimbli ci bés bu nekk',
      'Dimbali ci ñi la wër',
      'Kañ ngay seet dimbali bu liggéeykat',
      'Li am solo',
    ],
    section1Body:
      'Naqar, mer walla benn dégg bu fas ay jëfe yu cosaan lañu ci rees bii, lu mu mën a doon anamu ëmb bi. Li nga dégg war na ñu ko nangu.',
    section1InfoTitle: 'Fàttaliku',
    section1InfoText:
      'Amul anam bu jub walla bu bon ngir jàll loolu. Dégg bu nekk bi nga am jub na.',
    section2Body:
      'Mën nga dégg benn walla lu ëpp ci yii, yenn saa ci benn saa:',
    feelings: [
      {
        title: 'Naqar',
        text: 'Benn tiis bu mën a dikk te dem, yenn saa ci lu ñu xaarul.',
      },
      {
        title: 'Mer',
        text: 'Ci sa bopp, ci mbir bi walla ci benn dégg bu yoon amul — te loolu amul lu war a tiital.',
      },
      {
        title: 'Benn dégg bu neen',
        text: 'Benn dégg bu neen walla bu jaaxle ci li xewoon.',
      },
    ],
    section3Body:
      'Joxe sa bopp jamono, te coono ak méngale amul, benn pàrt bu am solo la ci wér.',
    dailySupport: [
      {
        title: 'Joxe sa bopp jamono',
        text: 'Te coono walla benn àtte ngir “gën a baax”.',
      },
      {
        title: 'Bu méngale sa bopp ak ñeneen',
        text: 'Tiis bu nekk wuute na; amul anam bu jub ngir jàll ko.',
      },
      {
        title: 'Wax ko',
        text: 'Bind walla wax li nga dégg mën na dimbli ngir weñ yëf yi.',
      },
    ],
    section4Body:
      'Wax ak benn nit ku jegeel la, benn mbooloo dimbali walla benn liggéeykat mën na dimbli ngir weñ yëf bii. Naka ñi la wër mën nañu dimbli:',
    supportTitle: 'Naka benn nit ku jegeel la mën a dimbli',
    howToSupport: [
      'Déglu te tooñ amul, lu mu mën a doon bu amul baat yu mat',
      'Moytu wàññi li xewoon (“du lu mag”, “mën nga jéemaat”)',
      'Joxe sa nekk lu dul ay jawab',
      'Kontine seetlu ko ci ayu-bés yu toftal',
    ],
    section5Body:
      'Yenn màndarga mën nañu wone ne dimbali bu liggéeykat mën na dimbli:',
    warningTitle: 'Màndarga yu war a teg',
    attentionSigns: [
      'Naqar bi di yàgg te gën a dëgër lu dul wàññiku',
      'Jafe na nga dund bés bu nekk',
      'Benn dégg bu fas ci bu keneen ne nga ñu leen jàpp',
      'Xalaat yu bari walla tiis bu am solo di feeñ',
    ],
    section5InfoTitle: 'Dimbali am na',
    section5InfoText:
      'Benn ndey-jur, doktoor, psikolog walla mbooloo dimbali mën na la déglu te dimbli la, te tooñ amul.',
    tipTitle: 'Lu baax a xam',
    tipText:
      'Ñaan dimbali du màndargay ñàkk doole — benn anam la ngir yër sa bopp ci jamono jii.',
    summaryPoints: [
      'Amul anam bu jub walla bu bon ngir jàll dund bii.',
      'Naqar, mer walla benn dégg bu neen ay jëfe yu cosaan lañu.',
      'Joxe sa bopp jamono, te coono ak méngale amul, bokk na ci wér.',
      'Wax ak benn nit ku jegeel la, benn mbooloo dimbali walla benn liggéeykat mën na dimbli ngir weñ yëf bii.',
    ],
    disclaimerText:
      'Mbind ngir xibaar. Bind bii du wuutu ndigalu liggéeykat. Bu nga jàll benn jamono bu jafe, bu ñaaw a wax ak benn liggéeykatu wér.',
    shareMessage: 'Jàll tiis ci xol — AWA',
  },
  ha: {
    badge: 'BAYAN ZUBAR DA CIKI • TALLAFIN ZUCIYA',
    title: 'Wucewa ta baƙin ciki\nta zuciya',
    metaDuration: 'karatun minti 7',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun bayani',
    intro:
      'Babu hanyar da ta dace ta wucewa ta wannan. Kowa yana wucewa ta ta hanyarta, bisa saurinta.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Baƙin ciki na gaske kuma halal',
      'Ji da ke bambanta daga mutum zuwa mutum',
      'Abin da zai iya taimakawa kullum',
      'Tallafin ƙaunatattu',
      'Lokacin neman taimakon ƙwararre',
      'Muhimman abubuwa',
    ],
    section1Body:
      'Baƙin ciki, fushi, ko jin wofi martani ne na al’ada ga wannan rashi, ko wane mataki na ciki ne. Abin da kike ji ya cancanci a amince da shi.',
    section1InfoTitle: 'Ki tuna',
    section1InfoText:
      'Babu hanya madaidaiciya ko kuskure ta wucewa ta wannan. Duk wani ji da kike da shi halal ne.',
    section2Body:
      'Za ki iya jin ɗaya ko fiye daga cikin waɗannan, wani lokaci duka a lokaci ɗaya:',
    feelings: [
      {
        title: 'Baƙin ciki',
        text: 'Baƙin ciki da zai iya zuwa ya tafi, wani lokaci ba zato ba tsammani.',
      },
      {
        title: 'Fushi',
        text: 'Ga kanki, yanayin, ko jin rashin adalci — kuma babu abin damuwa a wannan.',
      },
      {
        title: 'Jin wofi',
        text: 'Jin wofi ko ruɗani game da abin da ya faru.',
      },
    ],
    section3Body:
      'Ba kanki lokaci, ba tare da matsi ko kwatantawa ba, wani muhimmin ɓangare ne na warkewa.',
    dailySupport: [
      {
        title: 'Ba kanki lokaci',
        text: 'Ba tare da matsi ko wa’adin “jin sauƙi” ba.',
      },
      {
        title: 'Kada ki kwatanta kanki da wasu',
        text: 'Kowane baƙin ciki na musamman ne; babu hanya madaidaiciya ta wucewa ta shi.',
      },
      {
        title: 'Faɗar shi da kalmomi',
        text: 'Rubuta ko magana game da abin da kike ji na iya taimakawa rage nauyin zuciyarki.',
      },
    ],
    section4Body:
      'Magana da wani na kusa da ke, ƙungiyar tallafi, ko ƙwararre na iya taimakawa rage wannan nauyi. Ga yadda ƙaunatattu za su iya taimakawa:',
    supportTitle: 'Yadda wani ƙaunatacce zai iya ba da tallafi',
    howToSupport: [
      'Saurara ba tare da hukunci ba, ko da babu kalmomin da suka dace',
      'Guje wa rage darajar abin da ya faru (“ba wani babban abu ba ne,” “za ki iya sake gwadawa”)',
      'Ba da kasancewarka maimakon mafita',
      'Ci gaba da dubawa a makonni masu zuwa',
    ],
    section5Body:
      'Wasu alamomi na iya nuna cewa tallafin ƙwararre na iya zama da amfani:',
    warningTitle: 'Alamomin da za a lura da su',
    attentionSigns: [
      'Baƙin ciki yana daɗewa kuma yana ƙaruwa maimakon sauƙaƙa',
      'Yin aiki kullum yana zama da wahala',
      'Jin kaɗaici mai yawa ya shiga',
      'Tunanin da ke damun ki ko matsananciyar damuwa sun bayyana',
    ],
    section5InfoTitle: 'Akwai tallafi',
    section5InfoText:
      'Ungozoma, likita, masanin halayyar ɗan adam, ko ƙungiyar tallafi na iya saurarenki kuma su tallafa miki, ba tare da hukunci ba.',
    tipTitle: 'Abin da ya dace a sani',
    tipText:
      'Neman taimako ba alamar rauni ba ne — hanya ce ta kula da kanki a wannan lokaci.',
    summaryPoints: [
      'Babu hanya madaidaiciya ko kuskure ta wucewa ta wannan gogewa.',
      'Baƙin ciki, fushi, ko jin wofi martani ne na al’ada.',
      'Ba kanki lokaci, ba tare da matsi ko kwatantawa ba, wani ɓangare ne na warkewa.',
      'Magana da wani na kusa da ke, ƙungiyar tallafi, ko ƙwararre na iya taimakawa rage wannan nauyi.',
    ],
    disclaimerText:
      'Abun bayani. Wannan labari ba ya maye gurbin shawarar ƙwararre. Idan kina cikin lokaci mai wahala, kada ki yi jinkirin yin magana da ma’aikacin lafiya.',
    shareMessage: 'Wucewa ta baƙin ciki, ta zuciya — AWA',
  },
  am: {
    badge: 'ከእርግዝና መጥፋት በኋላ • ስሜታዊ ድጋፍ',
    title: 'ሐዘንን በስሜት\nማለፍ',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የመረጃ ይዘት',
    intro:
      'ይህን ለማለፍ ትክክለኛ መንገድ የለም። እያንዳንዷ በራሷ መንገድ፣ በራሷ ፍጥነት ታልፈዋለች።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'እውነተኛ እና ህጋዊ ሐዘን',
      'ከሰው ወደ ሰው የሚለያዩ ስሜቶች',
      'በየቀኑ ሊረዳ የሚችለው',
      'ከወዳጆች ድጋፍ',
      'የባለሙያ እርዳታ መቼ መፈለግ',
      'ዋና ዋና ነጥቦች',
    ],
    section1Body:
      'ሐዘን፣ ቁጣ ወይም የባዶነት ስሜት የእርግዝናው ደረጃ ምንም ይሁን ለዚህ ኪሳራ የተለመዱ ምላሾች ናቸው። የሚሰማሽ ነገር ሊታወቅ ይገባል።',
    section1InfoTitle: 'ልብ በይ',
    section1InfoText:
      'ይህን ለማለፍ ትክክል ወይም ስህተት መንገድ የለም። የሚሰማሽ እያንዳንዱ ስሜት ትክክል ነው።',
    section2Body:
      'ከእነዚህ አንድ ወይም ከዚያ በላይ ሊሰማሽ ይችላል፣ አንዳንድ ጊዜ ሁሉም በአንድ ጊዜ፦',
    feelings: [
      {
        title: 'ሐዘን',
        text: 'ሊመጣና ሊሄድ የሚችል፣ አንዳንድ ጊዜ ሳይታሰብ የሚመጣ ሐዘን።',
      },
      {
        title: 'ቁጣ',
        text: 'በራስሽ፣ በሁኔታው፣ ወይም በፍትሕ እጦት ስሜት ላይ — እና ይህ የሚያሳስብ ነገር አይደለም።',
      },
      {
        title: 'የባዶነት ስሜት',
        text: 'ስለ ተከሰተው የባዶነት ስሜት ወይም ግራ መጋባት።',
      },
    ],
    section3Body:
      'ለራስሽ ያለ ጫናና ንጽጽር ጊዜ መስጠት የፈውስ አስፈላጊ አካል ነው።',
    dailySupport: [
      {
        title: 'ለራስሽ ጊዜ መስጠት',
        text: 'ያለ ጫና ወይም “መሻሻል” የመጨረሻ ቀን።',
      },
      {
        title: 'ራስሽን ከሌሎች ጋር አለማነጻጸር',
        text: 'እያንዳንዱ ሐዘን ልዩ ነው፤ ለማለፍ ትክክለኛ መንገድ የለም።',
      },
      {
        title: 'በቃላት መግለጽ',
        text: 'የሚሰማሽን መጻፍ ወይም ማውራት የስሜትሽን ክብደት ለማቃለል ሊረዳ ይችላል።',
      },
    ],
    section4Body:
      'ከቅርብ ሰው፣ ከድጋፍ ቡድን ወይም ከባለሙያ ጋር መነጋገር ይህን ክብደት ለማቃለል ሊረዳ ይችላል። ወዳጆች እንዴት ሊረዱ እንደሚችሉ እነሆ፦',
    supportTitle: 'አንድ ወዳጅ ድጋፍ እንዴት ሊሰጥ ይችላል',
    howToSupport: [
      'ፍጹም ቃላት ባይኖርም ሳይፈርዱ ማዳመጥ',
      'ተሞክሮውን ከማሳነስ መቆጠብ (“ትልቅ ነገር አልነበረም”፣ “እንደገና መሞከር ትችያለሽ”)',
      'መፍትሔዎችን ሳይሆን መገኘትን ማቅረብ',
      'በሚቀጥሉት ሳምንታት መጠየቅን መቀጠል',
    ],
    section5Body:
      'አንዳንድ ምልክቶች የባለሙያ ድጋፍ ጠቃሚ ሊሆን እንደሚችል ሊያመለክቱ ይችላሉ፦',
    warningTitle: 'ልብ ልትይባቸው የሚገቡ ምልክቶች',
    attentionSigns: [
      'ሐዘን ለረዥም ጊዜ ይቆያል እና ከመቅለል ይልቅ ይጠናከራል',
      'በየቀኑ መሥራት ይከብዳል',
      'ከፍተኛ የመነጠል ስሜት ይገባል',
      'የሚያውኩ ሐሳቦች ወይም ከፍተኛ ሐዘን ይታያሉ',
    ],
    section5InfoTitle: 'ድጋፍ አለ',
    section5InfoText:
      'ሚድዋይፍ፣ ሐኪም፣ ሳይኮሎጂስት ወይም የድጋፍ ቡድን ሳይፈርድ ሊያዳምጥሽና ሊደግፍሽ ይችላል።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText:
      'እርዳታ መጠየቅ የድክመት ምልክት አይደለም — በዚህ ጊዜ ራስን የመንከባከብ መንገድ ነው።',
    summaryPoints: [
      'ይህን ተሞክሮ ለማለፍ ትክክል ወይም ስህተት መንገድ የለም።',
      'ሐዘን፣ ቁጣ ወይም የባዶነት ስሜት የተለመዱ ምላሾች ናቸው።',
      'ለራስሽ ያለ ጫናና ንጽጽር ጊዜ መስጠት የፈውስ አካል ነው።',
      'ከቅርብ ሰው፣ ከድጋፍ ቡድን ወይም ከባለሙያ ጋር መነጋገር ይህን ክብደት ለማቃለል ሊረዳ ይችላል።',
    ],
    disclaimerText:
      'የመረጃ ይዘት። ይህ ጽሑፍ የባለሙያ ምክርን አይተካም። አስቸጋሪ ጊዜ እያሳለፍሽ ከሆነ፣ ከጤና ባለሙያ ጋር ለመነጋገር አትዘገዪ።',
    shareMessage: 'ሐዘንን በስሜት ማለፍ — AWA',
  },
  nl: {
    badge: 'NA EEN MISKRAAM • EMOTIONELE STEUN',
    title: 'Emotioneel door het\nverdriet heen gaan',
    metaDuration: '7 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Informatieve inhoud',
    intro:
      'Er is geen goede manier om hier doorheen te gaan. Iedereen doorloopt het op haar eigen manier, in haar eigen tempo.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Een echt en legitiem verdriet',
      'Emoties die van persoon tot persoon verschillen',
      'Wat dagelijks kan helpen',
      'Steun van naasten',
      'Wanneer professionele hulp zoeken',
      'Belangrijkste punten',
    ],
    section1Body:
      'Verdriet, woede of een gevoel van leegte zijn normale reacties op dit verlies, in welk stadium van de zwangerschap ook. Wat je voelt verdient erkenning.',
    section1InfoTitle: 'Om in gedachten te houden',
    section1InfoText:
      'Er is geen goede of foute manier om hier doorheen te gaan. Elke emotie die je voelt is geldig.',
    section2Body:
      'Je kunt een of meer van deze dingen voelen, soms allemaal tegelijk:',
    feelings: [
      {
        title: 'Verdriet',
        text: 'Een smart die kan komen en gaan, soms onverwacht.',
      },
      {
        title: 'Woede',
        text: 'Tegenover jezelf, de situatie of een gevoel van onrechtvaardigheid — en daar hoef je je geen zorgen over te maken.',
      },
      {
        title: 'Een gevoel van leegte',
        text: 'Een gevoel van leegte of verwarring over wat er zojuist is gebeurd.',
      },
    ],
    section3Body:
      'Jezelf tijd geven, zonder druk of vergelijking, is een essentieel onderdeel van het genezen.',
    dailySupport: [
      {
        title: 'Jezelf tijd geven',
        text: 'Zonder druk of een deadline om je “beter te voelen”.',
      },
      {
        title: 'Je niet met anderen vergelijken',
        text: 'Elk verdriet is uniek; er is geen goede manier om er doorheen te gaan.',
      },
      {
        title: 'Het onder woorden brengen',
        text: 'Schrijven of praten over wat je voelt kan helpen de last van je emoties te verlichten.',
      },
    ],
    section4Body:
      'Praten met iemand in je omgeving, een steungroep of een professional kan helpen deze last te verlichten. Zo kunnen naasten helpen:',
    supportTitle: 'Hoe een naaste steun kan bieden',
    howToSupport: [
      'Luisteren zonder te oordelen, ook zonder de perfecte woorden te hebben',
      'Vermijden de ervaring te bagatelliseren (“het was niet zo erg”, “je kunt het opnieuw proberen”)',
      'Je aanwezigheid aanbieden in plaats van oplossingen',
      'Blijven informeren in de weken die volgen',
    ],
    section5Body:
      'Sommige tekenen kunnen erop wijzen dat professionele ondersteuning nuttig kan zijn:',
    warningTitle: 'Tekenen om op te letten',
    attentionSigns: [
      'Het verdriet duurt lang en wordt heviger in plaats van af te nemen',
      'Het wordt moeilijk om dagelijks te functioneren',
      'Er ontstaat een aanzienlijk gevoel van isolement',
      'Er verschijnen opdringerige gedachten of aanzienlijk ongemak',
    ],
    section5InfoTitle: 'Er is steun beschikbaar',
    section5InfoText:
      'Een verloskundige, huisarts, psycholoog of steungroep kan naar je luisteren en je ondersteunen, zonder oordeel.',
    tipTitle: 'Goed om te weten',
    tipText:
      'Om hulp vragen is geen teken van zwakte — het is een manier om in deze tijd voor jezelf te zorgen.',
    summaryPoints: [
      'Er is geen goede of foute manier om deze ervaring door te maken.',
      'Verdriet, woede of een gevoel van leegte zijn normale reacties.',
      'Jezelf tijd geven, zonder druk of vergelijking, hoort bij het genezen.',
      'Praten met iemand in je omgeving, een steungroep of een professional kan helpen deze last te verlichten.',
    ],
    disclaimerText:
      'Informatieve inhoud. Dit artikel vervangt geen professioneel advies. Als je een moeilijke tijd doormaakt, aarzel dan niet om met een zorgverlener te praten.',
    shareMessage: 'Emotioneel door het verdriet heen gaan — AWA',
  },
  fi: {
    badge: 'KESKENMENON JÄLKEEN • HENKINEN TUKI',
    title: 'Surun läpikäyminen\nhenkisesti',
    metaDuration: '7 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tiedoksi tarkoitettua sisältöä',
    intro:
      'Tämän läpikäymiseen ei ole yhtä oikeaa tapaa. Jokainen käy sen läpi omalla tavallaan, omaan tahtiinsa.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Todellinen ja oikeutettu suru',
      'Tunteet, jotka vaihtelevat ihmisestä toiseen',
      'Mikä voi auttaa arjessa',
      'Läheisten tuki',
      'Milloin hakea ammattiapua',
      'Tärkeimmät asiat',
    ],
    section1Body:
      'Suru, viha tai tyhjyyden tunne ovat normaaleja reaktioita tähän menetykseen raskauden vaiheesta riippumatta. Se, mitä tunnet, ansaitsee tulla tunnustetuksi.',
    section1InfoTitle: 'Pidä mielessä',
    section1InfoText:
      'Tämän läpikäymiseen ei ole oikeaa tai väärää tapaa. Jokainen tuntemasi tunne on pätevä.',
    section2Body:
      'Voit tuntea yhden tai useamman näistä, joskus kaikki yhtä aikaa:',
    feelings: [
      {
        title: 'Suru',
        text: 'Murhe, joka voi tulla ja mennä, joskus odottamatta.',
      },
      {
        title: 'Viha',
        text: 'Itseä, tilannetta tai epäoikeudenmukaisuuden tunnetta kohtaan — eikä siinä ole mitään huolestuttavaa.',
      },
      {
        title: 'Tyhjyyden tunne',
        text: 'Tyhjyyden tai hämmennyksen tunne juuri tapahtuneesta.',
      },
    ],
    section3Body:
      'Itselle ajan antaminen ilman painetta tai vertailua on olennainen osa paranemista.',
    dailySupport: [
      {
        title: 'Itselle ajan antaminen',
        text: 'Ilman painetta tai määräaikaa “paremmaksi tulemiselle”.',
      },
      {
        title: 'Itsensä vertaamatta jättäminen muihin',
        text: 'Jokainen suru on ainutlaatuinen; sen läpikäymiseen ei ole oikeaa tapaa.',
      },
      {
        title: 'Sanoiksi pukeminen',
        text: 'Tuntemuksistasi kirjoittaminen tai puhuminen voi auttaa keventämään tunteittesi painoa.',
      },
    ],
    section4Body:
      'Läheisen, tukiryhmän tai ammattilaisen kanssa puhuminen voi auttaa keventämään tätä painoa. Näin läheiset voivat auttaa:',
    supportTitle: 'Miten läheinen voi tarjota tukea',
    howToSupport: [
      'Kuuntele arvostelematta, vaikka ei olisi täydellisiä sanoja',
      'Vältä kokemuksen vähättelyä (“ei se ollut iso juttu”, “voitte yrittää uudelleen”)',
      'Tarjoa läsnäoloasi ratkaisujen sijaan',
      'Jatka kuulumisten kysymistä seuraavien viikkojen aikana',
    ],
    section5Body:
      'Jotkin merkit voivat osoittaa, että ammattilaisen tuki voisi olla hyödyllistä:',
    warningTitle: 'Huomioitavat merkit',
    attentionSigns: [
      'Suru kestää pitkään ja voimistuu helpottumisen sijaan',
      'Arjessa toimiminen käy vaikeaksi',
      'Merkittävä yksinäisyyden tunne asettuu',
      'Ilmaantuu päälle tunkevia ajatuksia tai merkittävää ahdistusta',
    ],
    section5InfoTitle: 'Tukea on saatavilla',
    section5InfoText:
      'Kätilö, lääkäri, psykologi tai tukiryhmä voi kuunnella ja tukea sinua arvostelematta.',
    tipTitle: 'Hyvä tietää',
    tipText:
      'Avun pyytäminen ei ole heikkouden merkki — se on tapa pitää huolta itsestäsi tänä aikana.',
    summaryPoints: [
      'Tämän kokemuksen läpikäymiseen ei ole oikeaa tai väärää tapaa.',
      'Suru, viha tai tyhjyyden tunne ovat normaaleja reaktioita.',
      'Itselle ajan antaminen ilman painetta tai vertailua kuuluu paranemiseen.',
      'Läheisen, tukiryhmän tai ammattilaisen kanssa puhuminen voi auttaa keventämään tätä painoa.',
    ],
    disclaimerText:
      'Tiedoksi tarkoitettua sisältöä. Tämä artikkeli ei korvaa ammattilaisen neuvontaa. Jos käyt läpi vaikeaa aikaa, älä epäröi puhua terveydenhuollon ammattilaisen kanssa.',
    shareMessage: 'Surun läpikäyminen henkisesti — AWA',
  },
  el: {
    badge: 'ΜΕΤΑ ΑΠΟ ΑΠΟΒΟΛΗ • ΣΥΝΑΙΣΘΗΜΑΤΙΚΗ ΣΤΗΡΙΞΗ',
    title: 'Διανύοντας το πένθος\nσυναισθηματικά',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ενημερωτικό περιεχόμενο',
    intro:
      'Δεν υπάρχει σωστός τρόπος να το περάσεις. Καθεμία το διανύει με τον δικό της τρόπο, με τον δικό της ρυθμό.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Ένα πραγματικό και θεμιτό πένθος',
      'Συναισθήματα που διαφέρουν από γυναίκα σε γυναίκα',
      'Τι μπορεί να βοηθήσει στην καθημερινότητα',
      'Στήριξη από αγαπημένα πρόσωπα',
      'Πότε να ζητήσεις επαγγελματική βοήθεια',
      'Βασικά συμπεράσματα',
    ],
    section1Body:
      'Η λύπη, ο θυμός ή ένα αίσθημα κενού είναι φυσιολογικές αντιδράσεις σε αυτή την απώλεια, ανεξάρτητα από το στάδιο της εγκυμοσύνης. Αυτό που νιώθεις αξίζει να αναγνωριστεί.',
    section1InfoTitle: 'Να το έχεις υπόψη',
    section1InfoText:
      'Δεν υπάρχει σωστός ή λάθος τρόπος να το περάσεις. Κάθε συναίσθημα που νιώθεις είναι έγκυρο.',
    section2Body:
      'Μπορεί να νιώσεις ένα ή περισσότερα από αυτά, μερικές φορές όλα μαζί:',
    feelings: [
      {
        title: 'Λύπη',
        text: 'Ένας πόνος που μπορεί να έρχεται και να φεύγει, μερικές φορές απρόσμενα.',
      },
      {
        title: 'Θυμός',
        text: 'Προς τον εαυτό σου, την κατάσταση ή ένα αίσθημα αδικίας — και δεν χρειάζεται να ανησυχείς γι’ αυτό.',
      },
      {
        title: 'Αίσθημα κενού',
        text: 'Ένα αίσθημα κενού ή σύγχυσης για όσα μόλις συνέβησαν.',
      },
    ],
    section3Body:
      'Το να δίνεις χρόνο στον εαυτό σου, χωρίς πίεση ή συγκρίσεις, είναι ουσιαστικό μέρος της επούλωσης.',
    dailySupport: [
      {
        title: 'Δίνοντας χρόνο στον εαυτό σου',
        text: 'Χωρίς πίεση ή προθεσμία για να «νιώσεις καλύτερα».',
      },
      {
        title: 'Μη συγκρίνεσαι με άλλες',
        text: 'Κάθε πένθος είναι μοναδικό· δεν υπάρχει σωστός τρόπος να το περάσεις.',
      },
      {
        title: 'Βάζοντάς το σε λέξεις',
        text: 'Το να γράφεις ή να μιλάς για όσα νιώθεις μπορεί να βοηθήσει να ελαφρύνει το βάρος των συναισθημάτων σου.',
      },
    ],
    section4Body:
      'Η συζήτηση με κάποιον κοντινό, μια ομάδα στήριξης ή έναν επαγγελματία μπορεί να βοηθήσει να ελαφρύνει αυτό το βάρος. Ορίστε πώς μπορούν να βοηθήσουν οι αγαπημένοι σου:',
    supportTitle: 'Πώς μπορεί ένα αγαπημένο πρόσωπο να προσφέρει στήριξη',
    howToSupport: [
      'Να ακούει χωρίς κρίση, ακόμη κι αν δεν έχει τις τέλειες λέξεις',
      'Να αποφεύγει να υποβαθμίζει την εμπειρία («δεν ήταν και τόσο σημαντικό», «μπορείτε να προσπαθήσετε ξανά»)',
      'Να προσφέρει την παρουσία του αντί για λύσεις',
      'Να συνεχίσει να ρωτά πώς είσαι τις εβδομάδες που ακολουθούν',
    ],
    section5Body:
      'Ορισμένα σημάδια μπορεί να υποδεικνύουν ότι η επαγγελματική στήριξη θα μπορούσε να είναι χρήσιμη:',
    warningTitle: 'Σημάδια που πρέπει να προσέχεις',
    attentionSigns: [
      'Η λύπη διαρκεί πολύ και εντείνεται αντί να υποχωρεί',
      'Γίνεται δύσκολο να λειτουργείς στην καθημερινότητα',
      'Εγκαθίσταται ένα έντονο αίσθημα απομόνωσης',
      'Εμφανίζονται παρεμβατικές σκέψεις ή έντονη δυσφορία',
    ],
    section5InfoTitle: 'Υπάρχει στήριξη',
    section5InfoText:
      'Μια μαία, ένας γιατρός, ένας ψυχολόγος ή μια ομάδα στήριξης μπορεί να σε ακούσει και να σε στηρίξει, χωρίς κρίση.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText:
      'Το να ζητάς βοήθεια δεν είναι σημάδι αδυναμίας — είναι ένας τρόπος να φροντίζεις τον εαυτό σου σε αυτή την περίοδο.',
    summaryPoints: [
      'Δεν υπάρχει σωστός ή λάθος τρόπος να περάσεις αυτή την εμπειρία.',
      'Η λύπη, ο θυμός ή ένα αίσθημα κενού είναι φυσιολογικές αντιδράσεις.',
      'Το να δίνεις χρόνο στον εαυτό σου, χωρίς πίεση ή συγκρίσεις, είναι μέρος της επούλωσης.',
      'Η συζήτηση με κάποιον κοντινό, μια ομάδα στήριξης ή έναν επαγγελματία μπορεί να βοηθήσει να ελαφρύνει αυτό το βάρος.',
    ],
    disclaimerText:
      'Ενημερωτικό περιεχόμενο. Αυτό το άρθρο δεν αντικαθιστά την επαγγελματική συμβουλή. Αν περνάς μια δύσκολη περίοδο, μην διστάσεις να μιλήσεις με έναν επαγγελματία υγείας.',
    shareMessage: 'Διανύοντας το πένθος συναισθηματικά — AWA',
  },
  fil: {
    badge: 'PAGKATAPOS NG PAGKALAGLAG • EMOSYONAL NA SUPORTA',
    title: 'Pagdaan sa pagdadalamhati\nsa emosyonal na paraan',
    metaDuration: '7 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Impormatibong nilalaman',
    intro:
      'Walang tamang paraan para daanan ito. Bawat isa ay dumaraan dito sa sarili niyang paraan, sa sarili niyang bilis.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Isang totoo at lehitimong pagdadalamhati',
      'Mga emosyong nag-iiba sa bawat tao',
      'Ang maaaring makatulong sa araw-araw',
      'Suporta mula sa mga mahal sa buhay',
      'Kailan hihingi ng propesyonal na tulong',
      'Mahahalagang tandaan',
    ],
    section1Body:
      'Ang kalungkutan, galit, o pakiramdam ng kawalan ay normal na reaksyon sa pagkawalang ito, anuman ang yugto ng pagbubuntis. Karapat-dapat kilalanin ang nararamdaman mo.',
    section1InfoTitle: 'Tandaan',
    section1InfoText:
      'Walang tama o maling paraan para daanan ito. Balido ang bawat emosyong nararamdaman mo.',
    section2Body:
      'Maaari mong maramdaman ang isa o higit pa sa mga ito, minsan sabay-sabay:',
    feelings: [
      {
        title: 'Kalungkutan',
        text: 'Isang hapis na maaaring dumating at umalis, minsan nang hindi inaasahan.',
      },
      {
        title: 'Galit',
        text: 'Sa sarili, sa sitwasyon, o sa pakiramdam ng kawalang-katarungan — at hindi ito dapat ikabahala.',
      },
      {
        title: 'Pakiramdam ng kawalan',
        text: 'Pakiramdam ng kahungkagan o kalituhan tungkol sa kung ano ang kaaalis lang na nangyari.',
      },
    ],
    section3Body:
      'Ang pagbibigay ng oras sa sarili, nang walang pressure o paghahambing, ay mahalagang bahagi ng paghilom.',
    dailySupport: [
      {
        title: 'Magbigay ng oras sa sarili',
        text: 'Nang walang pressure o takdang panahon para “gumaan ang pakiramdam.”',
      },
      {
        title: 'Huwag ihambing ang sarili sa iba',
        text: 'Natatangi ang bawat pagdadalamhati; walang tamang paraan para daanan ito.',
      },
      {
        title: 'Ilagay ito sa mga salita',
        text: 'Ang pagsusulat o pagsasalita tungkol sa nararamdaman mo ay makakatulong na gumaan ang bigat ng iyong mga emosyon.',
      },
    ],
    section4Body:
      'Ang pakikipag-usap sa isang taong malapit sa iyo, support group, o propesyonal ay makakatulong na gumaan ang bigat na ito. Narito kung paano makakatulong ang mga mahal sa buhay:',
    supportTitle: 'Paano makapagbibigay ng suporta ang isang mahal sa buhay',
    howToSupport: [
      'Makinig nang walang paghuhusga, kahit hindi perpekto ang mga salita',
      'Iwasang maliitin ang karanasan (“hindi naman malaking bagay,” “puwede ka namang sumubok ulit”)',
      'Mag-alok ng presensya sa halip na mga solusyon',
      'Patuloy na kumustahin sa mga susunod na linggo',
    ],
    section5Body:
      'Ang ilang senyales ay maaaring magpahiwatig na makakatulong ang propesyonal na suporta:',
    warningTitle: 'Mga senyales na dapat bantayan',
    attentionSigns: [
      'Matagal ang kalungkutan at lalong tumitindi sa halip na gumagaan',
      'Nagiging mahirap na gumana sa araw-araw',
      'Lumalaganap ang malaking pakiramdam ng pag-iisa',
      'Lumilitaw ang mapanghimasok na kaisipan o matinding pagkabalisa',
    ],
    section5InfoTitle: 'May magagamit na suporta',
    section5InfoText:
      'Ang midwife, doktor, psychologist, o support group ay maaaring makinig at sumuporta sa iyo, nang walang paghuhusga.',
    tipTitle: 'Mabuting malaman',
    tipText:
      'Ang paghingi ng tulong ay hindi tanda ng kahinaan — paraan ito ng pag-aalaga sa sarili sa panahong ito.',
    summaryPoints: [
      'Walang tama o maling paraan para daanan ang karanasang ito.',
      'Ang kalungkutan, galit, o pakiramdam ng kawalan ay normal na reaksyon.',
      'Ang pagbibigay ng oras sa sarili, nang walang pressure o paghahambing, ay bahagi ng paghilom.',
      'Ang pakikipag-usap sa isang taong malapit sa iyo, support group, o propesyonal ay makakatulong na gumaan ang bigat na ito.',
    ],
    disclaimerText:
      'Impormatibong nilalaman. Hindi pumapalit ang artikulong ito sa propesyonal na payo. Kung dumaraan ka sa mahirap na panahon, huwag mag-atubiling makipag-usap sa propesyonal sa kalusugan.',
    shareMessage: 'Pagdaan sa pagdadalamhati, sa emosyonal na paraan — AWA',
  },
  ta: {
    badge: 'கருச்சிதைவுக்குப் பின் • உணர்வு ஆதரவு',
    title: 'துயரத்தை உணர்வுபூர்வமாகக்\nகடந்து செல்லுதல்',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'தகவல் உள்ளடக்கம்',
    intro:
      'இதைக் கடந்து செல்ல சரியான வழி என்று எதுவும் இல்லை. ஒவ்வொருவரும் தம் சொந்த வழியில், தம் சொந்த வேகத்தில் இதைக் கடக்கிறார்கள்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'ஒரு உண்மையான, நியாயமான துயரம்',
      'ஒருவருக்கு ஒருவர் மாறுபடும் உணர்வுகள்',
      'அன்றாடம் உதவக்கூடியவை',
      'அன்புக்குரியவர்களின் ஆதரவு',
      'தொழில்முறை உதவியை எப்போது நாடுவது',
      'முக்கியக் குறிப்புகள்',
    ],
    section1Body:
      'சோகம், கோபம் அல்லது வெறுமை உணர்வு இந்த இழப்புக்கு இயல்பான எதிர்வினைகள், கர்ப்பத்தின் எந்தக் கட்டமாக இருந்தாலும். நீங்கள் உணர்வது அங்கீகரிக்கப்படத் தகுந்தது.',
    section1InfoTitle: 'மனதில் வைத்துக்கொள்ளுங்கள்',
    section1InfoText:
      'இதைக் கடந்து செல்ல சரி தவறான வழி என்று எதுவும் இல்லை. நீங்கள் உணரும் ஒவ்வொரு உணர்வும் செல்லுபடியாகும்.',
    section2Body:
      'நீங்கள் இவற்றில் ஒன்றையோ அதற்கு மேற்பட்டவற்றையோ, சில நேரங்களில் அனைத்தையும் ஒரே நேரத்தில், உணரலாம்:',
    feelings: [
      {
        title: 'சோகம்',
        text: 'வந்து போகக்கூடிய, சில நேரங்களில் எதிர்பாராத ஒரு துயரம்.',
      },
      {
        title: 'கோபம்',
        text: 'உங்கள் மீது, சூழ்நிலை மீது, அல்லது அநீதி உணர்வு — அது கவலைப்பட வேண்டிய ஒன்றல்ல.',
      },
      {
        title: 'வெறுமை உணர்வு',
        text: 'இப்போதுதான் நடந்ததைப் பற்றிய வெறுமை அல்லது குழப்ப உணர்வு.',
      },
    ],
    section3Body:
      'அழுத்தமோ ஒப்பீடோ இல்லாமல், உங்களுக்கு நேரம் கொடுப்பது குணமடைவதன் இன்றியமையாத பகுதி.',
    dailySupport: [
      {
        title: 'உங்களுக்கு நேரம் கொடுங்கள்',
        text: '“நன்றாக உணர” அழுத்தமோ காலக்கெடுவோ இல்லாமல்.',
      },
      {
        title: 'மற்றவர்களுடன் உங்களை ஒப்பிடாதீர்கள்',
        text: 'ஒவ்வொரு துயரமும் தனித்துவமானது; இதைக் கடந்து செல்ல சரியான வழி என்று எதுவும் இல்லை.',
      },
      {
        title: 'அதை வார்த்தைகளாக்குங்கள்',
        text: 'நீங்கள் உணர்வதை எழுதுவது அல்லது பேசுவது உங்கள் உணர்வுகளின் சுமையைக் குறைக்க உதவலாம்.',
      },
    ],
    section4Body:
      'உங்களுக்கு நெருக்கமான ஒருவருடன், ஓர் ஆதரவுக் குழுவுடன் அல்லது ஒரு நிபுணருடன் பேசுவது இந்தச் சுமையைக் குறைக்க உதவலாம். அன்புக்குரியவர்கள் எப்படி உதவலாம் என்பது இங்கே:',
    supportTitle: 'அன்புக்குரியவர் எப்படி ஆதரவு தரலாம்',
    howToSupport: [
      'சரியான வார்த்தைகள் இல்லாவிட்டாலும், தீர்ப்பளிக்காமல் செவிகொடுங்கள்',
      'அனுபவத்தை அற்பமாக்குவதைத் தவிருங்கள் (“அது பெரிய விஷயம் அல்ல,” “நீ மீண்டும் முயலலாம்”)',
      'தீர்வுகளை விட உங்கள் இருப்பை வழங்குங்கள்',
      'அடுத்த வாரங்களில் தொடர்ந்து நலம் விசாரியுங்கள்',
    ],
    section5Body:
      'சில அறிகுறிகள் தொழில்முறை ஆதரவு உதவியாக இருக்கலாம் என்பதைக் குறிக்கலாம்:',
    warningTitle: 'கவனிக்க வேண்டிய அறிகுறிகள்',
    attentionSigns: [
      'சோகம் நீண்ட காலம் நீடித்து, தணிவதற்குப் பதிலாகத் தீவிரமடைகிறது',
      'அன்றாடம் இயங்குவது கடினமாகிறது',
      'குறிப்பிடத்தக்க தனிமை உணர்வு குடிகொள்கிறது',
      'ஊடுருவும் எண்ணங்கள் அல்லது குறிப்பிடத்தக்க மனவேதனை தோன்றுகிறது',
    ],
    section5InfoTitle: 'ஆதரவு கிடைக்கிறது',
    section5InfoText:
      'ஒரு மருத்துவச்சி, மருத்துவர், உளவியலாளர் அல்லது ஆதரவுக் குழு தீர்ப்பளிக்காமல் செவிகொடுத்து உங்களை ஆதரிக்க முடியும்.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText:
      'உதவி கேட்பது பலவீனத்தின் அறிகுறி அல்ல — இந்தக் காலத்தில் உங்களைக் கவனித்துக்கொள்ளும் ஒரு வழி.',
    summaryPoints: [
      'இந்த அனுபவத்தைக் கடந்து செல்ல சரி தவறான வழி என்று எதுவும் இல்லை.',
      'சோகம், கோபம் அல்லது வெறுமை உணர்வு இயல்பான எதிர்வினைகள்.',
      'அழுத்தமோ ஒப்பீடோ இல்லாமல் உங்களுக்கு நேரம் கொடுப்பது குணமடைதலின் ஒரு பகுதி.',
      'உங்களுக்கு நெருக்கமான ஒருவருடன், ஓர் ஆதரவுக் குழுவுடன் அல்லது ஒரு நிபுணருடன் பேசுவது இந்தச் சுமையைக் குறைக்க உதவலாம்.',
    ],
    disclaimerText:
      'தகவல் உள்ளடக்கம். இந்தக் கட்டுரை தொழில்முறை ஆலோசனைக்கு மாற்றல்ல. நீங்கள் ஒரு கடினமான காலத்தைக் கடந்து சென்றால், ஒரு சுகாதார நிபுணரிடம் பேசத் தயங்காதீர்கள்.',
    shareMessage: 'துயரத்தை உணர்வுபூர்வமாகக் கடந்து செல்லுதல் — AWA',
  },
  te: {
    badge: 'గర్భస్రావం తర్వాత • భావోద్వేగ తోడ్పాటు',
    title: 'భావోద్వేగపరంగా దుఃఖాన్ని\nదాటడం',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'సమాచార కంటెంట్',
    intro:
      'దీన్ని దాటడానికి సరైన మార్గం అంటూ ఏదీ లేదు. ప్రతి ఒక్కరూ తమదైన రీతిలో, తమ సొంత వేగంలో దాటుతారు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'ఒక నిజమైన, న్యాయమైన దుఃఖం',
      'ఒకరి నుండి మరొకరికి మారే భావోద్వేగాలు',
      'రోజువారీ ఏది సహాయపడవచ్చు',
      'ఆత్మీయుల తోడ్పాటు',
      'నిపుణుల సహాయాన్ని ఎప్పుడు కోరాలి',
      'ముఖ్యాంశాలు',
    ],
    section1Body:
      'విచారం, కోపం లేదా శూన్య భావన ఈ నష్టానికి సహజ ప్రతిస్పందనలు, గర్భం ఏ దశలో ఉన్నా. మీకు అనిపించేది గుర్తింపునకు అర్హమైనది.',
    section1InfoTitle: 'గుర్తుంచుకోండి',
    section1InfoText:
      'దీన్ని దాటడానికి సరైన లేదా తప్పు మార్గం అంటూ ఏదీ లేదు. మీకు అనిపించే ప్రతి భావోద్వేగం చెల్లుబాటయ్యేదే.',
    section2Body:
      'మీరు వీటిలో ఒకటి లేదా అంతకంటే ఎక్కువ అనుభవించవచ్చు, కొన్నిసార్లు అన్నీ ఒకేసారి:',
    feelings: [
      {
        title: 'విచారం',
        text: 'వచ్చి పోయే, కొన్నిసార్లు ఊహించని విధంగా వచ్చే ఒక దుఃఖం.',
      },
      {
        title: 'కోపం',
        text: 'మీ పట్ల, పరిస్థితి పట్ల లేదా అన్యాయ భావన పట్ల — అది ఆందోళన చెందాల్సిన విషయం కాదు.',
      },
      {
        title: 'శూన్య భావన',
        text: 'ఇప్పుడే జరిగిన దాని గురించి ఖాళీతనం లేదా గందరగోళ భావన.',
      },
    ],
    section3Body:
      'ఒత్తిడి లేదా పోలిక లేకుండా మీకు సమయం ఇచ్చుకోవడం నయం కావడంలో ఒక ముఖ్య భాగం.',
    dailySupport: [
      {
        title: 'మీకు సమయం ఇచ్చుకోవడం',
        text: '“బాగా అనిపించడానికి” ఒత్తిడి లేదా గడువు లేకుండా.',
      },
      {
        title: 'ఇతరులతో పోల్చుకోకపోవడం',
        text: 'ప్రతి దుఃఖం ప్రత్యేకమైనది; దాన్ని దాటడానికి సరైన మార్గం అంటూ లేదు.',
      },
      {
        title: 'మాటల్లో పెట్టడం',
        text: 'మీకు అనిపించేదాన్ని రాయడం లేదా దాని గురించి మాట్లాడటం మీ భావోద్వేగాల భారాన్ని తేలిక చేయడానికి సహాయపడగలదు.',
      },
    ],
    section4Body:
      'మీకు దగ్గరి వ్యక్తితో, ఒక తోడ్పాటు బృందంతో లేదా ఒక నిపుణుడితో మాట్లాడటం ఈ భారాన్ని తేలిక చేయడానికి సహాయపడగలదు. ఆత్మీయులు ఎలా సహాయపడగలరో ఇక్కడ ఉంది:',
    supportTitle: 'ఒక ఆత్మీయుడు తోడ్పాటును ఎలా అందించగలరు',
    howToSupport: [
      'సరైన మాటలు లేకపోయినా, తీర్పు చెప్పకుండా వినండి',
      'అనుభవాన్ని చిన్నదిగా చూపడాన్ని తప్పించుకోండి (“అదేమంత పెద్ద విషయం కాదు,” “మళ్లీ ప్రయత్నించవచ్చు”)',
      'పరిష్కారాల కంటే మీ ఉనికిని అందించండి',
      'తర్వాతి వారాల్లో కూడా క్షేమం అడుగుతూ ఉండండి',
    ],
    section5Body:
      'కొన్ని సంకేతాలు నిపుణుల తోడ్పాటు సహాయపడవచ్చని సూచించవచ్చు:',
    warningTitle: 'గమనించాల్సిన సంకేతాలు',
    attentionSigns: [
      'విచారం చాలా కాలం ఉండి, తగ్గకుండా తీవ్రమవుతుంది',
      'రోజువారీ పనిచేయడం కష్టంగా మారుతుంది',
      'గణనీయమైన ఏకాకితనం భావన ఏర్పడుతుంది',
      'చొరబడే ఆలోచనలు లేదా గణనీయమైన బాధ కనిపిస్తాయి',
    ],
    section5InfoTitle: 'తోడ్పాటు అందుబాటులో ఉంది',
    section5InfoText:
      'ఒక మంత్రసాని, వైద్యులు, మనస్తత్వవేత్త లేదా తోడ్పాటు బృందం తీర్పు లేకుండా మీ మాట వినగలరు, మీకు తోడ్పడగలరు.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText:
      'సహాయం కోరడం బలహీనతకు సంకేతం కాదు — ఈ సమయంలో మిమ్మల్ని మీరు చూసుకునే ఒక మార్గం.',
    summaryPoints: [
      'ఈ అనుభవాన్ని దాటడానికి సరైన లేదా తప్పు మార్గం అంటూ ఏదీ లేదు.',
      'విచారం, కోపం లేదా శూన్య భావన సహజ ప్రతిస్పందనలు.',
      'ఒత్తిడి లేదా పోలిక లేకుండా మీకు సమయం ఇచ్చుకోవడం నయం కావడంలో భాగం.',
      'మీకు దగ్గరి వ్యక్తితో, ఒక తోడ్పాటు బృందంతో లేదా ఒక నిపుణుడితో మాట్లాడటం ఈ భారాన్ని తేలిక చేయడానికి సహాయపడగలదు.',
    ],
    disclaimerText:
      'సమాచార కంటెంట్. ఈ వ్యాసం నిపుణుల సలహాకు ప్రత్యామ్నాయం కాదు. మీరు కష్టకాలం గుండా వెళ్తుంటే, ఒక ఆరోగ్య నిపుణుడితో మాట్లాడటానికి వెనుకాడకండి.',
    shareMessage: 'భావోద్వేగపరంగా దుఃఖాన్ని దాటడం — AWA',
  },
  mr: {
    badge: 'गर्भपातानंतर • भावनिक आधार',
    title: 'दुःखातून भावनिकदृष्ट्या\nजाणे',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'माहितीपर मजकूर',
    intro:
      'यातून जाण्याचा कोणताही एकमेव योग्य मार्ग नाही. प्रत्येकजण स्वतःच्या पद्धतीने, स्वतःच्या गतीने यातून जाते.',
    contentsTitle: 'या लेखात',
    topics: [
      'खरे आणि न्याय्य दुःख',
      'व्यक्तीनुसार वेगवेगळ्या भावना',
      'रोजच्या जीवनात काय मदत करू शकते',
      'जवळच्यांचा आधार',
      'व्यावसायिक मदत केव्हा घ्यावी',
      'मुख्य मुद्दे',
    ],
    section1Body:
      'गर्भारपणाचा कोणताही टप्पा असो, या नुकसानावरील सामान्य प्रतिक्रिया म्हणजे दुःख, राग किंवा रिक्तपणाची भावना. तुम्हाला जे वाटत आहे ते मान्य केले जाण्यास पात्र आहे.',
    section1InfoTitle: 'लक्षात ठेवा',
    section1InfoText:
      'यातून जाण्याचा योग्य किंवा अयोग्य मार्ग नसतो. तुम्हाला जाणवणारी प्रत्येक भावना योग्यच आहे.',
    section2Body:
      'तुम्हाला यांपैकी एक किंवा अधिक भावना जाणवू शकतात, कधी कधी एकाच वेळी:',
    feelings: [
      {
        title: 'दुःख',
        text: 'एक वेदना जी येऊ-जाऊ शकते, कधी कधी अनपेक्षितपणे.',
      },
      {
        title: 'राग',
        text: 'स्वतःवर, परिस्थितीवर किंवा अन्यायाच्या भावनेवर — आणि त्याबद्दल काळजी करण्यासारखे काही नाही.',
      },
      {
        title: 'रिक्तपणाची भावना',
        text: 'नुकत्याच जे घडले त्याबद्दल रिकामेपणा किंवा गोंधळाची जाणीव.',
      },
    ],
    section3Body:
      'दबाव किंवा तुलनेशिवाय स्वतःला वेळ देणे हा बरे होण्याचा आवश्यक भाग आहे.',
    dailySupport: [
      {
        title: 'स्वतःला वेळ देणे',
        text: '“बरे वाटावे” यासाठी कोणत्याही दबावाशिवाय किंवा मुदतीशिवाय.',
      },
      {
        title: 'इतरांशी तुलना न करणे',
        text: 'प्रत्येक दुःख अद्वितीय असते; त्यातून जाण्याचा कोणताही योग्य मार्ग नाही.',
      },
      {
        title: 'शब्दांत मांडणे',
        text: 'तुम्हाला जे वाटते ते लिहिणे किंवा त्याबद्दल बोलणे तुमच्या भावनांचे ओझे हलके करण्यास मदत करू शकते.',
      },
    ],
    section4Body:
      'तुमच्या जवळच्या व्यक्तीशी, एखाद्या आधारगटाशी किंवा तज्ज्ञाशी बोलल्याने हे ओझे हलके होण्यास मदत होऊ शकते. जवळची माणसे कशी मदत करू शकतात ते इथे आहे:',
    supportTitle: 'जवळची व्यक्ती आधार कसा देऊ शकते',
    howToSupport: [
      'परिपूर्ण शब्द नसले तरी निवाडा न करता ऐका',
      'अनुभव कमी लेखणे टाळा (“काही मोठी गोष्ट नव्हती,” “तू पुन्हा प्रयत्न करू शकतेस”)',
      'उपाय देण्याऐवजी तुमची उपस्थिती द्या',
      'पुढच्या आठवड्यांतही चौकशी करत राहा',
    ],
    section5Body:
      'काही चिन्हे दर्शवू शकतात की व्यावसायिक आधार उपयुक्त ठरू शकतो:',
    warningTitle: 'लक्ष ठेवायची चिन्हे',
    attentionSigns: [
      'दुःख बराच काळ टिकते आणि कमी होण्याऐवजी तीव्र होते',
      'रोजचे कामकाज करणे कठीण होते',
      'एकटेपणाची लक्षणीय भावना निर्माण होते',
      'त्रासदायक विचार किंवा लक्षणीय त्रास दिसू लागतो',
    ],
    section5InfoTitle: 'आधार उपलब्ध आहे',
    section5InfoText:
      'दाई, डॉक्टर, मानसशास्त्रज्ञ किंवा आधारगट निवाड्याशिवाय तुमचे ऐकू शकतात आणि तुम्हाला साथ देऊ शकतात.',
    tipTitle: 'हे जाणून घ्या',
    tipText:
      'मदत मागणे हे दुर्बलतेचे लक्षण नाही — या काळात स्वतःची काळजी घेण्याचा तो एक मार्ग आहे.',
    summaryPoints: [
      'या अनुभवातून जाण्याचा योग्य किंवा अयोग्य मार्ग नाही.',
      'दुःख, राग किंवा रिक्तपणाची भावना या सामान्य प्रतिक्रिया आहेत.',
      'दबाव किंवा तुलनेशिवाय स्वतःला वेळ देणे बरे होण्याचा भाग आहे.',
      'जवळच्या व्यक्तीशी, आधारगटाशी किंवा तज्ज्ञाशी बोलल्याने हे ओझे हलके होण्यास मदत होऊ शकते.',
    ],
    disclaimerText:
      'माहितीपर मजकूर. हा लेख व्यावसायिक सल्ल्याची जागा घेत नाही. तुम्ही कठीण काळातून जात असाल, तर आरोग्य व्यावसायिकाशी बोलायला संकोच करू नका.',
    shareMessage: 'दुःखातून भावनिकदृष्ट्या जाणे — AWA',
  },
  gu: {
    badge: 'ગર્ભપાત પછી • ભાવનાત્મક સહાય',
    title: 'શોકમાંથી ભાવનાત્મક\nરીતે પસાર થવું',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'માહિતી માટેની સામગ્રી',
    intro:
      'આમાંથી પસાર થવાનો કોઈ એક સાચો રસ્તો નથી. દરેક સ્ત્રી પોતાની રીતે, પોતાની ગતિએ તેમાંથી પસાર થાય છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'એક સાચો અને યોગ્ય શોક',
      'લાગણીઓ જે દરેક વ્યક્તિમાં અલગ હોય છે',
      'રોજિંદા જીવનમાં શું મદદરૂપ થઈ શકે',
      'પ્રિયજનો તરફથી સાથ',
      'વ્યાવસાયિક મદદ ક્યારે લેવી',
      'મુખ્ય મુદ્દા',
    ],
    section1Body:
      'ઉદાસી, ગુસ્સો, કે ખાલીપણાની લાગણી આ નુકસાન પ્રત્યેની સામાન્ય પ્રતિક્રિયાઓ છે, ગર્ભાવસ્થા કોઈપણ તબક્કે હોય. તમે જે અનુભવો છો તેને સ્વીકારવાને તે લાયક છે.',
    section1InfoTitle: 'યાદ રાખો',
    section1InfoText:
      'આમાંથી પસાર થવાનો કોઈ સાચો કે ખોટો રસ્તો નથી. તમે અનુભવો છો તે દરેક લાગણી યોગ્ય છે.',
    section2Body:
      'તમે આમાંથી એક કે વધુ લાગણીઓ અનુભવી શકો છો, ક્યારેક બધી એકસાથે:',
    feelings: [
      {
        title: 'ઉદાસી',
        text: 'એક દુઃખ જે આવે અને જાય, ક્યારેક અણધાર્યું.',
      },
      {
        title: 'ગુસ્સો',
        text: 'પોતાના પ્રત્યે, પરિસ્થિતિ પ્રત્યે, અથવા અન્યાયની લાગણી — અને તેમાં ચિંતા કરવા જેવું કંઈ નથી.',
      },
      {
        title: 'ખાલીપણાની લાગણી',
        text: 'હમણાં જે બન્યું તેના વિશે ખાલીપણું કે મૂંઝવણનો અનુભવ.',
      },
    ],
    section3Body:
      'દબાણ કે સરખામણી વિના પોતાને સમય આપવો એ સ્વસ્થ થવાનો એક આવશ્યક ભાગ છે.',
    dailySupport: [
      {
        title: 'પોતાને સમય આપવો',
        text: '“સારું લાગવા” માટે કોઈ દબાણ કે સમયમર્યાદા વિના.',
      },
      {
        title: 'પોતાની સરખામણી અન્ય સાથે ન કરવી',
        text: 'દરેક શોક અનોખો હોય છે; તેમાંથી પસાર થવાનો કોઈ સાચો રસ્તો નથી.',
      },
      {
        title: 'શબ્દોમાં વ્યક્ત કરવું',
        text: 'તમે જે અનુભવો છો તે લખવાથી કે તેના વિશે વાત કરવાથી તમારી લાગણીઓનો ભાર હળવો થઈ શકે છે.',
      },
    ],
    section4Body:
      'તમારી નજીકના કોઈની સાથે, સહાય જૂથમાં, કે વ્યાવસાયિક સાથે વાત કરવાથી આ ભાર હળવો થઈ શકે છે. પ્રિયજનો કેવી રીતે મદદ કરી શકે તે અહીં છે:',
    supportTitle: 'પ્રિયજન કેવી રીતે સાથ આપી શકે',
    howToSupport: [
      'પરફેક્ટ શબ્દો ન હોય તો પણ, નિર્ણય કર્યા વિના સાંભળો',
      'અનુભવને ઓછો આંકવાનું ટાળો (“એમાં કંઈ મોટી વાત નથી,” “તમે ફરી પ્રયત્ન કરી શકો છો”)',
      'ઉકેલોને બદલે તમારી હાજરી આપો',
      'પછીના અઠવાડિયાંમાં પણ ખબરઅંતર પૂછતા રહો',
    ],
    section5Body:
      'કેટલાક સંકેતો સૂચવી શકે છે કે વ્યાવસાયિક સહાય મદદરૂપ થઈ શકે છે:',
    warningTitle: 'ધ્યાન રાખવા જેવા સંકેતો',
    attentionSigns: [
      'ઉદાસી લાંબા સમય સુધી રહે છે અને હળવી થવાને બદલે વધે છે',
      'રોજિંદા કામકાજ કરવું મુશ્કેલ બને છે',
      'એકલતાની નોંધપાત્ર લાગણી ઘર કરી જાય છે',
      'ઘૂસી જતા વિચારો કે નોંધપાત્ર તકલીફ દેખાય છે',
    ],
    section5InfoTitle: 'સહાય ઉપલબ્ધ છે',
    section5InfoText:
      'મિડવાઇફ, ડૉક્ટર, મનોવૈજ્ઞાનિક, કે સહાય જૂથ નિર્ણય કર્યા વિના તમને સાંભળી શકે છે અને સાથ આપી શકે છે.',
    tipTitle: 'જાણવા જેવું',
    tipText:
      'મદદ માગવી એ નબળાઈની નિશાની નથી — તે આ સમયમાં પોતાની કાળજી લેવાની એક રીત છે.',
    summaryPoints: [
      'આ અનુભવમાંથી પસાર થવાનો કોઈ સાચો કે ખોટો રસ્તો નથી.',
      'ઉદાસી, ગુસ્સો, કે ખાલીપણાની લાગણી સામાન્ય પ્રતિક્રિયાઓ છે.',
      'દબાણ કે સરખામણી વિના પોતાને સમય આપવો એ સ્વસ્થ થવાનો ભાગ છે.',
      'તમારી નજીકના કોઈની સાથે, સહાય જૂથમાં, કે વ્યાવસાયિક સાથે વાત કરવાથી આ ભાર હળવો થઈ શકે છે.',
    ],
    disclaimerText:
      'માહિતી માટેની સામગ્રી. આ લેખ વ્યાવસાયિક સલાહનું સ્થાન લેતો નથી. જો તમે મુશ્કેલ સમયમાંથી પસાર થઈ રહ્યા હો, તો આરોગ્ય વ્યાવસાયિક સાથે વાત કરવામાં અચકાશો નહીં.',
    shareMessage: 'શોકમાંથી ભાવનાત્મક રીતે પસાર થવું — AWA',
  },
  pa: {
    badge: 'ਗਰਭਪਾਤ ਤੋਂ ਬਾਅਦ • ਭਾਵਨਾਤਮਕ ਸਹਾਰਾ',
    title: 'ਸੋਗ ਵਿੱਚੋਂ ਭਾਵਨਾਤਮਕ\nਤੌਰ ਤੇ ਲੰਘਣਾ',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਜਾਣਕਾਰੀ ਵਾਲੀ ਸਮੱਗਰੀ',
    intro:
      'ਇਸ ਵਿੱਚੋਂ ਲੰਘਣ ਦਾ ਕੋਈ ਇੱਕ ਸਹੀ ਤਰੀਕਾ ਨਹੀਂ ਹੈ। ਹਰ ਕੋਈ ਆਪਣੇ ਢੰਗ ਨਾਲ, ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਲੰਘਦੀ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਇੱਕ ਅਸਲੀ ਅਤੇ ਜਾਇਜ਼ ਸੋਗ',
      'ਭਾਵਨਾਵਾਂ ਜੋ ਹਰ ਔਰਤ ਵਿੱਚ ਵੱਖਰੀਆਂ ਹੁੰਦੀਆਂ ਹਨ',
      'ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ',
      'ਆਪਣਿਆਂ ਦਾ ਸਹਾਰਾ',
      'ਮਾਹਿਰ ਦੀ ਮਦਦ ਕਦੋਂ ਲੈਣੀ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    section1Body:
      'ਉਦਾਸੀ, ਗੁੱਸਾ ਜਾਂ ਖ਼ਾਲੀਪਣ ਦਾ ਅਹਿਸਾਸ ਇਸ ਨੁਕਸਾਨ ਪ੍ਰਤੀ ਆਮ ਪ੍ਰਤੀਕਿਰਿਆਵਾਂ ਹਨ, ਭਾਵੇਂ ਗਰਭ-ਅਵਸਥਾ ਕਿਸੇ ਵੀ ਪੜਾਅ ਤੇ ਸੀ। ਜੋ ਤੁਸੀਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ ਉਸ ਨੂੰ ਮੰਨਿਆ ਜਾਣਾ ਚਾਹੀਦਾ ਹੈ।',
    section1InfoTitle: 'ਧਿਆਨ ਰੱਖੋ',
    section1InfoText:
      'ਇਸ ਵਿੱਚੋਂ ਲੰਘਣ ਦਾ ਕੋਈ ਸਹੀ ਜਾਂ ਗ਼ਲਤ ਤਰੀਕਾ ਨਹੀਂ ਹੈ। ਤੁਹਾਡੀ ਹਰ ਭਾਵਨਾ ਜਾਇਜ਼ ਹੈ।',
    section2Body:
      'ਤੁਸੀਂ ਇਨ੍ਹਾਂ ਵਿੱਚੋਂ ਇੱਕ ਜਾਂ ਕਈ ਭਾਵਨਾਵਾਂ ਮਹਿਸੂਸ ਕਰ ਸਕਦੇ ਹੋ, ਕਈ ਵਾਰ ਸਾਰੀਆਂ ਇੱਕੋ ਸਮੇਂ:',
    feelings: [
      {
        title: 'ਉਦਾਸੀ',
        text: 'ਇੱਕ ਗ਼ਮ ਜੋ ਆ ਅਤੇ ਜਾ ਸਕਦਾ ਹੈ, ਕਈ ਵਾਰ ਅਚਾਨਕ।',
      },
      {
        title: 'ਗੁੱਸਾ',
        text: 'ਆਪਣੇ ਆਪ ਤੇ, ਹਾਲਾਤ ਤੇ, ਜਾਂ ਬੇਇਨਸਾਫ਼ੀ ਦੇ ਅਹਿਸਾਸ ਕਾਰਨ — ਅਤੇ ਇਸ ਵਿੱਚ ਚਿੰਤਾ ਕਰਨ ਵਾਲੀ ਕੋਈ ਗੱਲ ਨਹੀਂ।',
      },
      {
        title: 'ਖ਼ਾਲੀਪਣ ਦਾ ਅਹਿਸਾਸ',
        text: 'ਜੋ ਹੁਣੇ ਵਾਪਰਿਆ ਉਸ ਬਾਰੇ ਖ਼ਾਲੀਪਣ ਜਾਂ ਉਲਝਣ ਦਾ ਅਹਿਸਾਸ।',
      },
    ],
    section3Body:
      'ਆਪਣੇ ਆਪ ਨੂੰ ਸਮਾਂ ਦੇਣਾ, ਬਿਨਾਂ ਦਬਾਅ ਜਾਂ ਤੁਲਨਾ ਦੇ, ਠੀਕ ਹੋਣ ਦਾ ਜ਼ਰੂਰੀ ਹਿੱਸਾ ਹੈ।',
    dailySupport: [
      {
        title: 'ਆਪਣੇ ਆਪ ਨੂੰ ਸਮਾਂ ਦੇਣਾ',
        text: '“ਬਿਹਤਰ ਮਹਿਸੂਸ ਕਰਨ” ਲਈ ਕਿਸੇ ਦਬਾਅ ਜਾਂ ਸਮਾਂ-ਸੀਮਾ ਤੋਂ ਬਿਨਾਂ।',
      },
      {
        title: 'ਦੂਜਿਆਂ ਨਾਲ ਤੁਲਨਾ ਨਾ ਕਰਨਾ',
        text: 'ਹਰ ਸੋਗ ਵਿਲੱਖਣ ਹੁੰਦਾ ਹੈ; ਇਸ ਵਿੱਚੋਂ ਲੰਘਣ ਦਾ ਕੋਈ ਇੱਕ ਸਹੀ ਤਰੀਕਾ ਨਹੀਂ।',
      },
      {
        title: 'ਇਸ ਨੂੰ ਸ਼ਬਦਾਂ ਵਿੱਚ ਢਾਲਣਾ',
        text: 'ਜੋ ਤੁਸੀਂ ਮਹਿਸੂਸ ਕਰਦੇ ਹੋ ਉਸ ਨੂੰ ਲਿਖਣਾ ਜਾਂ ਉਸ ਬਾਰੇ ਗੱਲ ਕਰਨਾ ਭਾਵਨਾਵਾਂ ਦਾ ਬੋਝ ਹਲਕਾ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
      },
    ],
    section4Body:
      'ਆਪਣੇ ਕਿਸੇ ਨੇੜਲੇ ਨਾਲ, ਸਹਾਇਤਾ ਸਮੂਹ ਨਾਲ ਜਾਂ ਕਿਸੇ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨਾ ਇਸ ਬੋਝ ਨੂੰ ਹਲਕਾ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ। ਇੱਥੇ ਦੱਸਿਆ ਗਿਆ ਹੈ ਕਿ ਆਪਣੇ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੇ ਹਨ:',
    supportTitle: 'ਕੋਈ ਆਪਣਾ ਸਹਾਰਾ ਕਿਵੇਂ ਦੇ ਸਕਦਾ ਹੈ',
    howToSupport: [
      'ਬਿਨਾਂ ਫ਼ੈਸਲਾ ਸੁਣਾਏ ਸੁਣੋ, ਭਾਵੇਂ ਸਹੀ ਸ਼ਬਦ ਨਾ ਵੀ ਮਿਲਣ',
      'ਇਸ ਤਜਰਬੇ ਨੂੰ ਛੋਟਾ ਕਰਕੇ ਦੱਸਣ ਤੋਂ ਬਚੋ (“ਕੋਈ ਵੱਡੀ ਗੱਲ ਨਹੀਂ ਸੀ,” “ਤੁਸੀਂ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰ ਸਕਦੇ ਹੋ”)',
      'ਹੱਲਾਂ ਦੀ ਥਾਂ ਆਪਣੀ ਮੌਜੂਦਗੀ ਪੇਸ਼ ਕਰੋ',
      'ਅਗਲੇ ਹਫ਼ਤਿਆਂ ਵਿੱਚ ਵੀ ਹਾਲ-ਚਾਲ ਪੁੱਛਦੇ ਰਹੋ',
    ],
    section5Body:
      'ਕੁਝ ਸੰਕੇਤ ਦੱਸ ਸਕਦੇ ਹਨ ਕਿ ਮਾਹਿਰ ਦੀ ਮਦਦ ਲਾਭਦਾਇਕ ਹੋ ਸਕਦੀ ਹੈ:',
    warningTitle: 'ਧਿਆਨ ਦੇਣ ਵਾਲੇ ਸੰਕੇਤ',
    attentionSigns: [
      'ਉਦਾਸੀ ਲੰਮੇ ਸਮੇਂ ਤੱਕ ਰਹੇ ਅਤੇ ਘਟਣ ਦੀ ਥਾਂ ਵਧਦੀ ਜਾਵੇ',
      'ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਚਲਾਉਣੀ ਔਖੀ ਹੋ ਜਾਵੇ',
      'ਇਕੱਲਤਾ ਦਾ ਡੂੰਘਾ ਅਹਿਸਾਸ ਬਣ ਜਾਵੇ',
      'ਘੁਸਪੈਠ ਕਰਨ ਵਾਲੇ ਵਿਚਾਰ ਜਾਂ ਡੂੰਘੀ ਪਰੇਸ਼ਾਨੀ ਪ੍ਰਗਟ ਹੋਵੇ',
    ],
    section5InfoTitle: 'ਸਹਾਰਾ ਮੌਜੂਦ ਹੈ',
    section5InfoText:
      'ਮਿਡਵਾਈਫ਼, ਡਾਕਟਰ, ਮਨੋਵਿਗਿਆਨੀ ਜਾਂ ਸਹਾਇਤਾ ਸਮੂਹ ਤੁਹਾਨੂੰ ਸੁਣ ਸਕਦਾ ਹੈ ਅਤੇ ਸਾਥ ਦੇ ਸਕਦਾ ਹੈ, ਬਿਨਾਂ ਕਿਸੇ ਫ਼ੈਸਲੇ ਦੇ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText:
      'ਮਦਦ ਮੰਗਣਾ ਕਮਜ਼ੋਰੀ ਦੀ ਨਿਸ਼ਾਨੀ ਨਹੀਂ — ਇਹ ਇਸ ਸਮੇਂ ਆਪਣੀ ਸੰਭਾਲ ਕਰਨ ਦਾ ਇੱਕ ਤਰੀਕਾ ਹੈ।',
    summaryPoints: [
      'ਇਸ ਤਜਰਬੇ ਵਿੱਚੋਂ ਲੰਘਣ ਦਾ ਕੋਈ ਸਹੀ ਜਾਂ ਗ਼ਲਤ ਤਰੀਕਾ ਨਹੀਂ ਹੈ।',
      'ਉਦਾਸੀ, ਗੁੱਸਾ ਜਾਂ ਖ਼ਾਲੀਪਣ ਦਾ ਅਹਿਸਾਸ ਆਮ ਪ੍ਰਤੀਕਿਰਿਆਵਾਂ ਹਨ।',
      'ਆਪਣੇ ਆਪ ਨੂੰ ਸਮਾਂ ਦੇਣਾ, ਬਿਨਾਂ ਦਬਾਅ ਜਾਂ ਤੁਲਨਾ ਦੇ, ਠੀਕ ਹੋਣ ਦਾ ਹਿੱਸਾ ਹੈ।',
      'ਆਪਣੇ ਕਿਸੇ ਨੇੜਲੇ ਨਾਲ, ਸਹਾਇਤਾ ਸਮੂਹ ਨਾਲ ਜਾਂ ਕਿਸੇ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨਾ ਇਸ ਬੋਝ ਨੂੰ ਹਲਕਾ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    ],
    disclaimerText:
      'ਇਹ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਮਾਹਿਰ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦੀ। ਜੇ ਤੁਸੀਂ ਕਿਸੇ ਔਖੇ ਸਮੇਂ ਵਿੱਚੋਂ ਲੰਘ ਰਹੇ ਹੋ ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨ ਤੋਂ ਨਾ ਝਿਜਕੋ।',
    shareMessage: 'ਸੋਗ ਵਿੱਚੋਂ ਭਾਵਨਾਤਮਕ ਤੌਰ ਤੇ ਲੰਘਣਾ — AWA',
  },
  my: {
    badge: 'ကိုယ်ဝန်ပျက်ကျပြီးနောက် • စိတ်ပိုင်းဆိုင်ရာ ပံ့ပိုးမှု',
    title: 'ဝမ်းနည်းကြေကွဲမှုကို\nစိတ်ပိုင်းဆိုင်ရာ ဖြတ်သန်းခြင်း',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'အချက်အလက်ပေးသော အကြောင်းအရာ',
    intro:
      'ဤအခြေအနေကို ဖြတ်သန်းရန် မှန်ကန်သောနည်းလမ်း တစ်ခုတည်း မရှိပါ။ လူတိုင်း မိမိနည်းမိမိဟန်ဖြင့်၊ မိမိအရှိန်ဖြင့် ဖြတ်သန်းကြသည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'အမှန်တကယ်ရှိပြီး တရားဝင်သော ဝမ်းနည်းကြေကွဲမှု',
      'လူတစ်ဦးနှင့်တစ်ဦး ကွာခြားသော စိတ်ခံစားမှုများ',
      'နေ့စဉ်ဘဝတွင် အထောက်အကူဖြစ်နိုင်သည်များ',
      'ချစ်ခင်ရသူများ၏ ပံ့ပိုးမှု',
      'ပညာရှင်အကူအညီ မည်သည့်အခါ ရှာသင့်သနည်း',
      'အဓိကအချက်များ',
    ],
    section1Body:
      'ကိုယ်ဝန်၏ မည်သည့်အဆင့်ဖြစ်စေ ဝမ်းနည်းခြင်း၊ ဒေါသထွက်ခြင်း သို့မဟုတ် ဟာတာတာဖြစ်ခြင်းတို့သည် ဤဆုံးရှုံးမှုအတွက် ပုံမှန်တုံ့ပြန်မှုများ ဖြစ်သည်။ သင်ခံစားနေရသည်များကို အသိအမှတ်ပြုသင့်သည်။',
    section1InfoTitle: 'ကြောင်းကျိုးမှတ်ထားပါ',
    section1InfoText:
      'ဤအခြေအနေကို ဖြတ်သန်းရန် မှန်သည်၊ မှားသည်ဟူသော နည်းလမ်း မရှိပါ။ သင်ခံစားရသည့် စိတ်ခံစားမှုတိုင်း မှန်ကန်သည်။',
    section2Body:
      'သင်သည် ၎င်းတို့အနက် တစ်ခု သို့မဟုတ် တစ်ခုထက်ပို၍ ခံစားရနိုင်ပြီး တခါတရံ တစ်ပြိုင်နက် ခံစားရနိုင်သည်။',
    feelings: [
      {
        title: 'ဝမ်းနည်းခြင်း',
        text: 'တခါတရံ မမျှော်လင့်ဘဲ လာလိုက်ပါသွားလိုက် ဖြစ်နိုင်သော ဝမ်းနည်းကြေကွဲမှု။',
      },
      {
        title: 'ဒေါသ',
        text: 'မိမိကိုယ်ကို၊ အခြေအနေကို သို့မဟုတ် မတရားမှုခံစားချက်ကို ဦးတည်သည် — ထိုအရာမှာ စိုးရိမ်စရာမဟုတ်ပါ။',
      },
      {
        title: 'ဟာတာတာဖြစ်သော ခံစားချက်',
        text: 'ဖြစ်ပျက်ခဲ့သည်ကို ဟာတာတာဖြစ်ခြင်း သို့မဟုတ် ရှုပ်ထွေးမှုခံစားချက်။',
      },
    ],
    section3Body:
      'ဖိအားနှင့် နှိုင်းယှဉ်မှုမရှိဘဲ မိမိကိုယ်ကို အချိန်ပေးခြင်းသည် ပြန်လည်ကုစားခြင်း၏ မရှိမဖြစ်အစိတ်အပိုင်း ဖြစ်သည်။',
    dailySupport: [
      {
        title: 'မိမိကိုယ်ကို အချိန်ပေးခြင်း',
        text: '“ပိုကောင်းလာရန်” ဖိအား သို့မဟုတ် နောက်ဆုံးရက်မရှိဘဲ။',
      },
      {
        title: 'အခြားသူများနှင့် မနှိုင်းယှဉ်ခြင်း',
        text: 'ဝမ်းနည်းကြေကွဲမှုတိုင်းသည် ထူးခြားသည်။ ဖြတ်သန်းရန် မှန်ကန်သောနည်းလမ်း တစ်ခုတည်း မရှိပါ။',
      },
      {
        title: 'စကားလုံးများဖြင့် ဖော်ပြခြင်း',
        text: 'သင်ခံစားရသည်များကို ရေးခြင်း သို့မဟုတ် ပြောဆိုခြင်းက စိတ်ခံစားမှု၏ ဝန်ထုပ်ဝန်ပိုးကို ပေါ့ပါးစေရန် ကူညီနိုင်သည်။',
      },
    ],
    section4Body:
      'သင့်အနီးရှိသူတစ်ဦး၊ ပံ့ပိုးမှုအုပ်စုတစ်ခု သို့မဟုတ် ပညာရှင်တစ်ဦးနှင့် ပြောဆိုခြင်းက ဤဝန်ထုပ်ဝန်ပိုးကို ပေါ့ပါးစေရန် ကူညီနိုင်သည်။ ချစ်ခင်ရသူများက မည်သို့ကူညီနိုင်ကြောင်း ဤတွင်ဖော်ပြထားသည်။',
    supportTitle: 'ချစ်ခင်ရသူတစ်ဦးက မည်သို့ ပံ့ပိုးနိုင်သနည်း',
    howToSupport: [
      'ပြီးပြည့်စုံသောစကားလုံးများ မရှိသော်လည်း အပြစ်မတင်ဘဲ နားထောင်ပေးပါ',
      'ဖြစ်ရပ်ကို လျှော့တွက်ခြင်းကို ရှောင်ပါ (“ကြီးကြီးမားမားမဟုတ်ပါဘူး”၊ “ပြန်ကြိုးစားလို့ရတာပဲ”)',
      'ဖြေရှင်းနည်းများထက် ရှိနေပေးခြင်းကို ပေးပါ',
      'နောက်လာမည့်ရက်သတ္တပတ်များအတွင်း ဆက်လက်မေးမြန်းပါ',
    ],
    section5Body:
      'အချို့သောလက္ခဏာများက ပညာရှင်၏ပံ့ပိုးမှုသည် အထောက်အကူဖြစ်နိုင်ကြောင်း ညွှန်ပြနိုင်သည်။',
    warningTitle: 'သတိထားရမည့် လက္ခဏာများ',
    attentionSigns: [
      'ဝမ်းနည်းမှုသည် ကြာရှည်စွာခံစားရပြီး သက်သာမလာဘဲ ပိုပြင်းထန်လာသည်',
      'နေ့စဉ်ဘဝကို ဆက်လက်ဖြတ်သန်းရန် ခက်ခဲလာသည်',
      'အထီးကျန်ခံစားချက် သိသိသာသာ ဖြစ်ပေါ်လာသည်',
      'စိတ်ထဲ တိုးဝင်လာသော အတွေးများ သို့မဟုတ် သိသာသော စိတ်ဆင်းရဲမှု ပေါ်လာသည်',
    ],
    section5InfoTitle: 'ပံ့ပိုးမှု ရရှိနိုင်သည်',
    section5InfoText:
      'သားဖွားဆရာမ၊ ဆရာဝန်၊ စိတ်ပညာရှင် သို့မဟုတ် ပံ့ပိုးမှုအုပ်စုတစ်ခုက အပြစ်မတင်ဘဲ သင့်ကို နားထောင်ပေးပြီး ပံ့ပိုးပေးနိုင်သည်။',
    tipTitle: 'သိထားသင့်သည်',
    tipText:
      'အကူအညီတောင်းခြင်းသည် အားနည်းချက်၏ လက္ခဏာမဟုတ်ပါ — ဤအချိန်ကာလအတွင်း မိမိကိုယ်ကို ဂရုစိုက်ခြင်း၏ နည်းလမ်းတစ်ခုဖြစ်သည်။',
    summaryPoints: [
      'ဤအတွေ့အကြုံကို ဖြတ်သန်းရန် မှန်သည်၊ မှားသည်ဟူသော နည်းလမ်း မရှိပါ။',
      'ဝမ်းနည်းခြင်း၊ ဒေါသထွက်ခြင်း သို့မဟုတ် ဟာတာတာဖြစ်ခြင်းတို့သည် ပုံမှန်တုံ့ပြန်မှုများ ဖြစ်သည်။',
      'ဖိအားနှင့် နှိုင်းယှဉ်မှုမရှိဘဲ မိမိကိုယ်ကို အချိန်ပေးခြင်းသည် ပြန်လည်ကုစားခြင်း၏ အစိတ်အပိုင်း ဖြစ်သည်။',
      'သင့်အနီးရှိသူတစ်ဦး၊ ပံ့ပိုးမှုအုပ်စုတစ်ခု သို့မဟုတ် ပညာရှင်တစ်ဦးနှင့် ပြောဆိုခြင်းက ဤဝန်ထုပ်ဝန်ပိုးကို ပေါ့ပါးစေရန် ကူညီနိုင်သည်။',
    ],
    disclaimerText:
      '၎င်းသည် အချက်အလက်ပေးရန်ဖြစ်ပြီး ပညာရှင်၏အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ သင်ခက်ခဲသောအချိန်ကို ဖြတ်သန်းနေပါက ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုရန် မတွန့်ဆုတ်ပါနှင့်။',
    shareMessage: 'ဝမ်းနည်းကြေကွဲမှုကို စိတ်ပိုင်းဆိုင်ရာ ဖြတ်သန်းခြင်း — AWA',
  },
  km: {
    badge: 'ក្រោយការរលូតកូន • ការគាំទ្រផ្លូវចិត្ត',
    title: 'ឆ្លងកាត់ទុក្ខសោក\nខាងផ្លូវចិត្ត',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាព័ត៌មាន',
    intro:
      'គ្មានវិធីត្រឹមត្រូវតែមួយក្នុងការឆ្លងកាត់រឿងនេះទេ។ មនុស្សគ្រប់គ្នាឆ្លងកាត់វាតាមវិធីរបស់ខ្លួន តាមល្បឿនរបស់ខ្លួន។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ទុក្ខសោកដ៏ពិត និងស្របច្បាប់',
      'អារម្មណ៍ដែលខុសគ្នាពីមនុស្សម្នាក់ទៅម្នាក់ទៀត',
      'អ្វីដែលអាចជួយក្នុងជីវិតប្រចាំថ្ងៃ',
      'ការគាំទ្រពីអ្នកជិតស្និទ្ធ',
      'ពេលណាត្រូវស្វែងរកជំនួយពីអ្នកជំនាញ',
      'ចំណុចសំខាន់ៗ',
    ],
    section1Body:
      'ភាពសោកសៅ កំហឹង ឬអារម្មណ៍ទទេស្អាត គឺជាប្រតិកម្មធម្មតាចំពោះការបាត់បង់នេះ មិនថាដំណាក់កាលណានៃការមានផ្ទៃពោះឡើយ។ អ្វីដែលអ្នកកំពុងមានអារម្មណ៍ សមនឹងត្រូវបានទទួលស្គាល់។',
    section1InfoTitle: 'សូមចងចាំ',
    section1InfoText:
      'គ្មានវិធីត្រូវ ឬខុសក្នុងការឆ្លងកាត់រឿងនេះទេ។ រាល់អារម្មណ៍ដែលអ្នកមាន សុទ្ធតែត្រឹមត្រូវ។',
    section2Body:
      'អ្នកអាចមានអារម្មណ៍មួយ ឬច្រើនយ៉ាងនេះ ជួនកាលទាំងអស់ក្នុងពេលតែមួយ៖',
    feelings: [
      {
        title: 'ភាពសោកសៅ',
        text: 'ទុក្ខព្រួយដែលអាចមកហើយទៅ ជួនកាលដោយមិននឹកស្មាន។',
      },
      {
        title: 'កំហឹង',
        text: 'ចំពោះខ្លួនអ្នក ស្ថានភាព ឬអារម្មណ៍ថាអយុត្តិធម៌ — ហើយនោះមិនមែនជារឿងគួរបារម្ភទេ។',
      },
      {
        title: 'អារម្មណ៍ទទេស្អាត',
        text: 'អារម្មណ៍ទទេស្អាត ឬច្របូកច្របល់អំពីអ្វីដែលទើបតែកើតឡើង។',
      },
    ],
    section3Body:
      'ការផ្តល់ពេលវេលាដល់ខ្លួនឯង ដោយគ្មានសម្ពាធ ឬការប្រៀបធៀប គឺជាផ្នែកសំខាន់នៃការជាសះស្បើយ។',
    dailySupport: [
      {
        title: 'ផ្តល់ពេលវេលាដល់ខ្លួនឯង',
        text: 'ដោយគ្មានសម្ពាធ ឬកាលកំណត់សម្រាប់ “ការមានអារម្មណ៍ល្អប្រសើរ”។',
      },
      {
        title: 'កុំប្រៀបធៀបខ្លួនជាមួយអ្នកដទៃ',
        text: 'ទុក្ខសោកនីមួយៗមានតែមួយគត់ មិនមានវិធីត្រឹមត្រូវក្នុងការឆ្លងកាត់វាទេ។',
      },
      {
        title: 'ដាក់វាជាពាក្យសម្ដី',
        text: 'ការសរសេរ ឬនិយាយអំពីអ្វីដែលអ្នកមានអារម្មណ៍ អាចជួយបន្ធូរបន្ថយទម្ងន់នៃអារម្មណ៍របស់អ្នក។',
      },
    ],
    section4Body:
      'ការនិយាយជាមួយអ្នកជិតស្និទ្ធ ក្រុមគាំទ្រ ឬអ្នកជំនាញ អាចជួយបន្ធូរបន្ថយទម្ងន់នេះ។ នេះជារបៀបដែលអ្នកជិតស្និទ្ធអាចជួយបាន៖',
    supportTitle: 'របៀបដែលអ្នកជិតស្និទ្ធអាចផ្តល់ការគាំទ្រ',
    howToSupport: [
      'ស្តាប់ដោយគ្មានការវិនិច្ឆ័យ ទោះមិនមានពាក្យពេចន៍ដ៏ល្អឥតខ្ចោះក៏ដោយ',
      'ជៀសវាងការមើលស្រាលបទពិសោធន៍នេះ (“មិនមែនជារឿងធំទេ” “អ្នកអាចព្យាយាមម្តងទៀត”)',
      'ផ្តល់វត្តមានរបស់អ្នក ជាជាងដំណោះស្រាយ',
      'បន្តសួរសុខទុក្ខក្នុងអំឡុងសប្តាហ៍បន្ទាប់',
    ],
    section5Body:
      'សញ្ញាមួយចំនួនអាចបង្ហាញថា ការគាំទ្រពីអ្នកជំនាញអាចមានប្រយោជន៍៖',
    warningTitle: 'សញ្ញាដែលត្រូវតាមដាន',
    attentionSigns: [
      'ភាពសោកសៅនៅយូរ ហើយកាន់តែខ្លាំងឡើង ជាជាងធូរស្រាល',
      'ការរស់នៅប្រចាំថ្ងៃក្លាយជាការលំបាក',
      'អារម្មណ៍ឯកកោយ៉ាងខ្លាំងកើតឡើង',
      'គំនិតរំខាន ឬទុក្ខវេទនាខ្លាំងលេចឡើង',
    ],
    section5InfoTitle: 'មានការគាំទ្រសម្រាប់អ្នក',
    section5InfoText:
      'ឆ្មប វេជ្ជបណ្ឌិត អ្នកចិត្តសាស្ត្រ ឬក្រុមគាំទ្រ អាចស្តាប់ និងគាំទ្រអ្នក ដោយគ្មានការវិនិច្ឆ័យ។',
    tipTitle: 'គួរដឹង',
    tipText:
      'ការស្នើសុំជំនួយមិនមែនជាសញ្ញានៃភាពខ្សោយទេ — វាជារបៀបថែរក្សាខ្លួនអ្នកក្នុងអំឡុងពេលនេះ។',
    summaryPoints: [
      'គ្មានវិធីត្រូវ ឬខុសក្នុងការឆ្លងកាត់បទពិសោធន៍នេះទេ។',
      'ភាពសោកសៅ កំហឹង ឬអារម្មណ៍ទទេស្អាត គឺជាប្រតិកម្មធម្មតា។',
      'ការផ្តល់ពេលវេលាដល់ខ្លួនឯង ដោយគ្មានសម្ពាធ ឬការប្រៀបធៀប គឺជាផ្នែកនៃការជាសះស្បើយ។',
      'ការនិយាយជាមួយអ្នកជិតស្និទ្ធ ក្រុមគាំទ្រ ឬអ្នកជំនាញ អាចជួយបន្ធូរបន្ថយទម្ងន់នេះ។',
    ],
    disclaimerText:
      'មាតិកាព័ត៌មាន។ អត្ថបទនេះមិនជំនួសដំបូន្មានពីអ្នកជំនាញទេ។ ប្រសិនបើអ្នកកំពុងឆ្លងកាត់ពេលលំបាក សូមកុំស្ទាក់ស្ទើរក្នុងការនិយាយជាមួយអ្នកជំនាញសុខាភិបាល។',
    shareMessage: 'ឆ្លងកាត់ទុក្ខសោកខាងផ្លូវចិត្ត — AWA',
  },
  lo: {
    badge: 'ຫຼັງການແທ້ງລູກ • ການສະໜັບສະໜູນທາງອາລົມ',
    title: 'ຜ່ານຜ່າຄວາມໂສກເສົ້າ\nທາງອາລົມ',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທົ່ວໄປ',
    intro:
      'ບໍ່ມີວິທີທີ່ຖືກຕ້ອງໃນການຜ່ານເລື່ອງນີ້. ແຕ່ລະຄົນຜ່ານໄປດ້ວຍວິທີຂອງຕົນເອງ ຕາມຈັງຫວະຂອງຕົນເອງ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ຄວາມໂສກເສົ້າທີ່ແທ້ຈິງ ແລະ ຊອບທຳ',
      'ອາລົມທີ່ແຕກຕ່າງກັນໄປໃນແຕ່ລະຄົນ',
      'ສິ່ງທີ່ອາດຊ່ວຍໄດ້ໃນແຕ່ລະວັນ',
      'ການສະໜັບສະໜູນຈາກຄົນທີ່ຮັກ',
      'ເວລາໃດຄວນຂໍຄວາມຊ່ວຍເຫຼືອຈາກຜູ້ຊ່ຽວຊານ',
      'ຈຸດສຳຄັນ',
    ],
    section1Body:
      'ຄວາມເສົ້າ ຄວາມໂກດ ຫຼື ຄວາມຮູ້ສຶກຫວ່າງເປົ່າ ແມ່ນປະຕິກິລິຍາປົກກະຕິຕໍ່ການສູນເສຍນີ້ ບໍ່ວ່າຈະຢູ່ໃນໄລຍະໃດຂອງການຖືພາ. ສິ່ງທີ່ທ່ານຮູ້ສຶກສົມຄວນໄດ້ຮັບການຍອມຮັບ.',
    section1InfoTitle: 'ຈົ່ງຈື່ໄວ້',
    section1InfoText:
      'ບໍ່ມີວິທີທີ່ຖືກ ຫຼື ຜິດໃນການຜ່ານເລື່ອງນີ້. ທຸກອາລົມທີ່ທ່ານຮູ້ສຶກລ້ວນແຕ່ຊອບທຳ.',
    section2Body:
      'ທ່ານອາດຮູ້ສຶກອາລົມໜຶ່ງ ຫຼື ຫຼາຍອາລົມເຫຼົ່ານີ້ ບາງຄັ້ງກໍພ້ອມກັນທັງໝົດ:',
    feelings: [
      {
        title: 'ຄວາມເສົ້າ',
        text: 'ຄວາມທຸກໃຈທີ່ອາດມາແລ້ວໄປ ບາງຄັ້ງກໍມາໂດຍບໍ່ທັນຕັ້ງຕົວ.',
      },
      {
        title: 'ຄວາມໂກດ',
        text: 'ຕໍ່ຕົນເອງ ຕໍ່ສະຖານະການ ຫຼື ຄວາມຮູ້ສຶກວ່າບໍ່ຍຸຕິທຳ — ແລະ ນັ້ນບໍ່ແມ່ນສິ່ງທີ່ຕ້ອງກັງວົນ.',
      },
      {
        title: 'ຄວາມຮູ້ສຶກຫວ່າງເປົ່າ',
        text: 'ຄວາມຮູ້ສຶກຫວ່າງເປົ່າ ຫຼື ສັບສົນກັບສິ່ງທີ່ເກີດຂຶ້ນ.',
      },
    ],
    section3Body:
      'ການໃຫ້ເວລາຕົນເອງ ໂດຍບໍ່ມີຄວາມກົດດັນ ຫຼື ການປຽບທຽບ ເປັນສ່ວນສຳຄັນຂອງການເຍີຍວຍາ.',
    dailySupport: [
      {
        title: 'ໃຫ້ເວລາຕົນເອງ',
        text: 'ໂດຍບໍ່ມີຄວາມກົດດັນ ຫຼື ກຳນົດເວລາສຳລັບການ “ຮູ້ສຶກດີຂຶ້ນ.”',
      },
      {
        title: 'ບໍ່ປຽບທຽບຕົນເອງກັບຄົນອື່ນ',
        text: 'ຄວາມໂສກເສົ້າຂອງແຕ່ລະຄົນເປັນເອກະລັກ; ບໍ່ມີວິທີທີ່ຖືກຕ້ອງໃນການຜ່ານມັນ.',
      },
      {
        title: 'ເອົາມັນອອກມາເປັນຄຳເວົ້າ',
        text: 'ການຂຽນ ຫຼື ເວົ້າກ່ຽວກັບສິ່ງທີ່ທ່ານຮູ້ສຶກສາມາດຊ່ວຍຜ່ອນເບົາພາລະທາງອາລົມ.',
      },
    ],
    section4Body:
      'ການລົມກັບຄົນໃກ້ຊິດ ກຸ່ມສະໜັບສະໜູນ ຫຼື ຜູ້ຊ່ຽວຊານສາມາດຊ່ວຍຜ່ອນເບົາພາລະນີ້. ນີ້ແມ່ນວິທີທີ່ຄົນທີ່ຮັກສາມາດຊ່ວຍໄດ້:',
    supportTitle: 'ຄົນທີ່ຮັກສາມາດໃຫ້ການສະໜັບສະໜູນໄດ້ແນວໃດ',
    howToSupport: [
      'ຮັບຟັງໂດຍບໍ່ຕັດສິນ ເຖິງແມ່ນບໍ່ມີຄຳເວົ້າທີ່ສົມບູນແບບ',
      'ຫຼີກເວັ້ນການເວົ້າໃຫ້ປະສົບການນີ້ເບົາບາງລົງ (“ບໍ່ແມ່ນເລື່ອງໃຫຍ່” “ລອງໃໝ່ໄດ້ຕະຫຼອດ”)',
      'ສະເໜີການຢູ່ຂ້າງກັນ ແທນທີ່ຈະສະເໜີວິທີແກ້ໄຂ',
      'ສືບຕໍ່ຖາມໄຖ່ສຸກທຸກຢ່າງໃນຫຼາຍອາທິດຕໍ່ມາ',
    ],
    section5Body:
      'ສັນຍານບາງຢ່າງອາດບົ່ງບອກວ່າການສະໜັບສະໜູນຈາກຜູ້ຊ່ຽວຊານອາດເປັນປະໂຫຍດ:',
    warningTitle: 'ສັນຍານທີ່ຄວນສັງເກດ',
    attentionSigns: [
      'ຄວາມເສົ້າຍາວນານ ແລະ ຮຸນແຮງຂຶ້ນແທນທີ່ຈະຄ່ອຍໆບັນເທົາ',
      'ການດຳເນີນຊີວິດປະຈຳວັນກາຍເປັນເລື່ອງຍາກ',
      'ຄວາມຮູ້ສຶກໂດດດ່ຽວຢ່າງຫຼວງຫຼາຍເກີດຂຶ້ນ',
      'ມີຄວາມຄິດທີ່ເຂົ້າມາລົບກວນ ຫຼື ຄວາມທຸກໃຈຢ່າງຫຼວງຫຼາຍ',
    ],
    section5InfoTitle: 'ມີການສະໜັບສະໜູນພ້ອມຊ່ວຍ',
    section5InfoText:
      'ໝໍຕຳແຍ ແພດ ນັກຈິດຕະວິທະຍາ ຫຼື ກຸ່ມສະໜັບສະໜູນສາມາດຮັບຟັງ ແລະ ສະໜັບສະໜູນທ່ານໂດຍບໍ່ຕັດສິນ.',
    tipTitle: 'ຄວນຮູ້',
    tipText:
      'ການຂໍຄວາມຊ່ວຍເຫຼືອບໍ່ແມ່ນສັນຍານຂອງຄວາມອ່ອນແອ — ມັນເປັນວິທີດູແລຕົນເອງໃນໄລຍະນີ້.',
    summaryPoints: [
      'ບໍ່ມີວິທີທີ່ຖືກ ຫຼື ຜິດໃນການຜ່ານປະສົບການນີ້.',
      'ຄວາມເສົ້າ ຄວາມໂກດ ຫຼື ຄວາມຮູ້ສຶກຫວ່າງເປົ່າ ແມ່ນປະຕິກິລິຍາປົກກະຕິ.',
      'ການໃຫ້ເວລາຕົນເອງ ໂດຍບໍ່ມີຄວາມກົດດັນ ຫຼື ການປຽບທຽບ ເປັນສ່ວນໜຶ່ງຂອງການເຍີຍວຍາ.',
      'ການລົມກັບຄົນໃກ້ຊິດ ກຸ່ມສະໜັບສະໜູນ ຫຼື ຜູ້ຊ່ຽວຊານສາມາດຊ່ວຍຜ່ອນເບົາພາລະນີ້.',
    ],
    disclaimerText:
      'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ. ບົດຄວາມນີ້ບໍ່ແທນຄຳແນະນຳຂອງຜູ້ຊ່ຽວຊານ. ຖ້າທ່ານກຳລັງຜ່ານຊ່ວງເວລາທີ່ຍາກລຳບາກ ຢ່າລັງເລທີ່ຈະລົມກັບຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    shareMessage: 'ຜ່ານຜ່າຄວາມໂສກເສົ້າທາງອາລົມ — AWA',
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
