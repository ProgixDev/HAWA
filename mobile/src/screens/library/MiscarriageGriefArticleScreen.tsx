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

const CONTENT = {
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
} as const;

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
