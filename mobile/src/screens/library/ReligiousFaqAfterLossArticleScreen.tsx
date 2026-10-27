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

const ID = 'religiousfaq-reperes-apres-une-perte';

const HERO = require('../../assets/images/library/spm-woman.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('ReligiousFaqAfterLoss', {
  fr: {
    badge: 'REPÈRES SPIRITUELS',
    title: 'Repères spirituels\naprès une perte',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaEducational: 'Contenu éducatif',
    intro:
      'Quelques repères spirituels pour traverser une perte avec douceur, patience et bienveillance.',
    disclaimerTitle: 'Information importante',
    disclaimerText:
      'Ce contenu est éducatif. Les questions religieuses précises doivent être vérifiées auprès d’un savant ou d’une savante qualifiée. AWA ne délivre pas de fatwas personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Une épreuve reconnue',
      'Un statut selon la situation',
      'Patience et espérance',
      'Quelques repères pour avancer',
    ],
    section1H2: '1. Une épreuve reconnue',
    section1Body1:
      'Une perte de grossesse peut être une épreuve profondément douloureuse. La tristesse, le silence, la confusion ou le besoin de prendre du recul sont des réactions humaines naturelles.',
    section1Body2:
      'Ressentir ces émotions ne signifie pas manquer de foi. Chacune peut vivre son deuil à son propre rythme.',
    visual1Title: 'Accueillir ses émotions',
    visual1Body: 'Tristesse • besoin de repos • silence • soutien',
    section2H2: '2. Un statut qui peut varier selon la situation',
    section2Body1:
      'Après une perte, les règles religieuses peuvent dépendre de la situation et de la nature des saignements.',
    section2Body2:
      'Il peut notamment être nécessaire de distinguer différents types de saignements avant de déterminer les pratiques religieuses à suivre.',
    schemaTitle: 'Le principe général',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Nature du saignement',
    schemaLabel3: 'Avis adapté',
    doubtTipTitle: 'En cas de doute',
    doubtTipText:
      'Une situation personnelle peut nécessiter une réponse différente. Il est préférable de demander conseil à une personne qualifiée.',
    section3H2: '3. Patience et espérance',
    section3Body1:
      'La patience (sabr) ne signifie pas ne pas pleurer ou ne pas ressentir de douleur. Elle peut simplement accompagner le cheminement avec foi et espérance.',
    section3Body2:
      'De petits gestes peuvent aider à retrouver progressivement un sentiment d’apaisement : une invocation, un moment de dhikr, une écoute spirituelle ou la présence d’un proche.',
    spiritual1: 'Invocation',
    spiritual2: 'Dhikr',
    spiritual3: 'Soutien',
    retainTipTitle: 'À retenir',
    retainTipText:
      'La guérison prend du temps. Il n’existe pas de rythme universel pour traverser une perte.',
    section4H2: '4. Quelques repères pour avancer',
    section4Body:
      'Il n’est pas nécessaire de tout faire à la fois. Choisis ce qui correspond à ton état et à tes besoins du moment.',
    gentleSteps: [
      'Prendre le temps de vivre son chagrin',
      'S’entourer de personnes bienveillantes',
      'Conserver de petits gestes spirituels si cela apporte du réconfort',
      'Demander conseil pour toute question religieuse précise',
      'Chercher du soutien si le chagrin devient trop difficile à porter',
    ],
    finalTitle: 'Un chemin à ton rythme',
    finalText:
      'Prendre soin de soi, chercher du soutien et conserver l’espérance peuvent accompagner progressivement le chemin vers l’apaisement.',
    shareMessage: 'Repères spirituels après une perte — AWA',
  },
  en: {
    badge: 'SPIRITUAL GUIDANCE',
    title: 'Spiritual guidance\nafter a loss',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaEducational: 'Educational content',
    intro:
      'A few spiritual guidance points to help you move through a loss with gentleness, patience, and compassion.',
    disclaimerTitle: 'Important information',
    disclaimerText:
      'This content is educational. Specific religious questions should be verified with a qualified scholar. AWA does not issue personalized fatwas.',
    contentsTitle: 'In this article',
    topics: [
      'A recognized trial',
      'A status that depends on the situation',
      'Patience and hope',
      'A few guidance points for moving forward',
    ],
    section1H2: '1. A recognized trial',
    section1Body1:
      'A pregnancy loss can be a deeply painful trial. Sadness, silence, confusion, or the need to step back are natural human reactions.',
    section1Body2:
      'Feeling these emotions does not mean lacking faith. Each woman can go through her grief at her own pace.',
    visual1Title: 'Welcoming your emotions',
    visual1Body: 'Sadness • need for rest • silence • support',
    section2H2: '2. A status that can vary depending on the situation',
    section2Body1:
      'After a loss, religious rules can depend on the situation and the nature of the bleeding.',
    section2Body2:
      'In particular, it may be necessary to distinguish between different types of bleeding before determining which religious practices to follow.',
    schemaTitle: 'The general principle',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Nature of the bleeding',
    schemaLabel3: 'Suitable guidance',
    doubtTipTitle: 'If in doubt',
    doubtTipText:
      'A personal situation may call for a different answer. It is best to seek advice from a qualified person.',
    section3H2: '3. Patience and hope',
    section3Body1:
      'Patience (sabr) does not mean not crying or not feeling pain. It can simply accompany the journey with faith and hope.',
    section3Body2:
      'Small gestures can help gradually restore a sense of peace: an invocation, a moment of dhikr, spiritual listening, or the presence of a loved one.',
    spiritual1: 'Invocation',
    spiritual2: 'Dhikr',
    spiritual3: 'Support',
    retainTipTitle: 'Keep in mind',
    retainTipText:
      'Healing takes time. There is no universal pace for moving through a loss.',
    section4H2: '4. A few guidance points for moving forward',
    section4Body:
      'There is no need to do everything at once. Choose what matches how you feel and what you need right now.',
    gentleSteps: [
      'Take the time to live through your grief',
      'Surround yourself with caring people',
      'Keep up small spiritual practices if they bring comfort',
      'Seek advice for any specific religious question',
      'Seek support if the grief becomes too difficult to carry',
    ],
    finalTitle: 'A path at your own pace',
    finalText:
      'Taking care of yourself, seeking support, and holding on to hope can gradually help guide the path toward peace.',
    shareMessage: 'Spiritual guidance after a loss — AWA',
  },
  es: {
    badge: 'REFERENCIAS ESPIRITUALES',
    title: 'Referencias espirituales\ndespués de una pérdida',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaEducational: 'Contenido educativo',
    intro:
      'Algunas referencias espirituales para atravesar una pérdida con dulzura, paciencia y compasión.',
    disclaimerTitle: 'Información importante',
    disclaimerText:
      'Este contenido es educativo. Las preguntas religiosas precisas deben verificarse con un erudito o una erudita cualificada. AWA no emite fatuas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Una prueba reconocida',
      'Un estatus según la situación',
      'Paciencia y esperanza',
      'Algunas referencias para avanzar',
    ],
    section1H2: '1. Una prueba reconocida',
    section1Body1:
      'Una pérdida del embarazo puede ser una prueba profundamente dolorosa. La tristeza, el silencio, la confusión o la necesidad de tomar distancia son reacciones humanas naturales.',
    section1Body2:
      'Sentir estas emociones no significa carecer de fe. Cada mujer puede vivir su duelo a su propio ritmo.',
    visual1Title: 'Acoger tus emociones',
    visual1Body: 'Tristeza • necesidad de descanso • silencio • apoyo',
    section2H2: '2. Un estatus que puede variar según la situación',
    section2Body1:
      'Después de una pérdida, las reglas religiosas pueden depender de la situación y de la naturaleza de los sangrados.',
    section2Body2:
      'En particular, puede ser necesario distinguir entre diferentes tipos de sangrado antes de determinar las prácticas religiosas que seguir.',
    schemaTitle: 'El principio general',
    schemaLabel1: 'Situación',
    schemaLabel2: 'Naturaleza del sangrado',
    schemaLabel3: 'Opinión adaptada',
    doubtTipTitle: 'En caso de duda',
    doubtTipText:
      'Una situación personal puede requerir una respuesta diferente. Es preferible pedir consejo a una persona cualificada.',
    section3H2: '3. Paciencia y esperanza',
    section3Body1:
      'La paciencia (sabr) no significa no llorar ni dejar de sentir dolor. Simplemente puede acompañar el camino con fe y esperanza.',
    section3Body2:
      'Pequeños gestos pueden ayudar a recuperar progresivamente una sensación de sosiego: una invocación, un momento de dhikr, una escucha espiritual o la presencia de un ser querido.',
    spiritual1: 'Invocación',
    spiritual2: 'Dhikr',
    spiritual3: 'Apoyo',
    retainTipTitle: 'Para recordar',
    retainTipText:
      'La sanación lleva tiempo. No existe un ritmo universal para atravesar una pérdida.',
    section4H2: '4. Algunas referencias para avanzar',
    section4Body:
      'No es necesario hacerlo todo a la vez. Elige lo que corresponda a tu estado y a tus necesidades del momento.',
    gentleSteps: [
      'Tomarte el tiempo de vivir tu duelo',
      'Rodearte de personas comprensivas',
      'Conservar pequeños gestos espirituales si te aportan consuelo',
      'Pedir consejo para cualquier pregunta religiosa precisa',
      'Buscar apoyo si el duelo se vuelve demasiado difícil de sobrellevar',
    ],
    finalTitle: 'Un camino a tu propio ritmo',
    finalText:
      'Cuidarte, buscar apoyo y conservar la esperanza pueden acompañar progresivamente el camino hacia el sosiego.',
    shareMessage: 'Referencias espirituales después de una pérdida — AWA',
  },
  it: {
    badge: 'GUIDA SPIRITUALE',
    title: 'Una guida spirituale\ndopo una perdita',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaEducational: 'Contenuto educativo',
    intro: 'Alcuni spunti di orientamento spirituale per aiutarti ad attraversare una perdita con dolcezza, pazienza e compassione.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto è educativo. Le questioni religiose specifiche vanno verificate con uno studioso qualificato. AWA non emette fatwa personalizzate.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Una prova riconosciuta',
      'Una condizione che dipende dalla situazione',
      'Pazienza e speranza',
      'Alcuni spunti per andare avanti',
    ],
    section1H2: '1. Una prova riconosciuta',
    section1Body1: 'Una perdita di gravidanza può essere una prova profondamente dolorosa. Tristezza, silenzio, smarrimento o il bisogno di ritirarsi sono reazioni umane naturali.',
    section1Body2: 'Provare queste emozioni non significa mancare di fede. Ogni donna può vivere il proprio lutto con i propri tempi.',
    visual1Title: 'Accogliere le tue emozioni',
    visual1Body: 'Tristezza • bisogno di riposo • silenzio • sostegno',
    section2H2: '2. Una condizione che può variare a seconda della situazione',
    section2Body1: 'Dopo una perdita, le regole religiose possono dipendere dalla situazione e dalla natura del sanguinamento.',
    section2Body2: 'In particolare, può essere necessario distinguere tra diversi tipi di sanguinamento prima di stabilire quali pratiche religiose seguire.',
    schemaTitle: 'Il principio generale',
    schemaLabel1: 'Situazione',
    schemaLabel2: 'Natura del sanguinamento',
    schemaLabel3: 'Indicazione adatta',
    doubtTipTitle: 'In caso di dubbio',
    doubtTipText: 'Una situazione personale può richiedere una risposta diversa. È meglio chiedere consiglio a una persona qualificata.',
    section3H2: '3. Pazienza e speranza',
    section3Body1: 'La pazienza (sabr) non significa non piangere o non sentire dolore. Può semplicemente accompagnare il cammino con fede e speranza.',
    section3Body2: 'Piccoli gesti possono aiutare a ritrovare gradualmente un senso di pace: un’invocazione, un momento di dhikr, un ascolto spirituale o la presenza di una persona cara.',
    spiritual1: 'Invocazione',
    spiritual2: 'Dhikr',
    spiritual3: 'Sostegno',
    retainTipTitle: 'Da ricordare',
    retainTipText: 'Guarire richiede tempo. Non esiste un ritmo universale per attraversare una perdita.',
    section4H2: '4. Alcuni spunti per andare avanti',
    section4Body: 'Non serve fare tutto subito. Scegli ciò che corrisponde a come ti senti e a ciò di cui hai bisogno in questo momento.',
    gentleSteps: [
      'Prenditi il tempo di vivere il tuo lutto',
      'Circondati di persone premurose',
      'Mantieni piccole pratiche spirituali se ti portano conforto',
      'Chiedi consiglio per qualsiasi questione religiosa specifica',
      'Cerca sostegno se il lutto diventa troppo difficile da portare',
    ],
    finalTitle: 'Un cammino con i tuoi tempi',
    finalText: 'Prendersi cura di sé, cercare sostegno e mantenere viva la speranza può aiutare a orientare gradualmente il cammino verso la pace.',
    shareMessage: 'Una guida spirituale dopo una perdita — AWA',
  },
  tr: {
    badge: 'MANEVİ REHBERLİK',
    title: 'Kayıptan sonra\nmanevi rehberlik',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaEducational: 'Eğitici içerik',
    intro: 'Bir kaybı nazik, sabırlı ve şefkatli bir şekilde atlatmana yardımcı olacak birkaç manevi rehberlik noktası.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik eğiticidir. Belirli dinî sorular yetkin bir âlime danışılarak doğrulanmalıdır. AWA kişiye özel fetva vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Kabul gören bir imtihan',
      'Duruma göre değişen bir hüküm',
      'Sabır ve umut',
      'İlerlemek için birkaç rehber nokta',
    ],
    section1H2: '1. Kabul gören bir imtihan',
    section1Body1: 'Gebelik kaybı derin acı veren bir imtihan olabilir. Üzüntü, sessizlik, kafa karışıklığı ya da geri çekilme ihtiyacı insana özgü doğal tepkilerdir.',
    section1Body2: 'Bu duyguları hissetmek imansızlık anlamına gelmez. Her kadın yasını kendi hızında yaşayabilir.',
    visual1Title: 'Duygularını kabul etmek',
    visual1Body: 'Üzüntü • dinlenme ihtiyacı • sessizlik • destek',
    section2H2: '2. Duruma göre değişebilen bir hüküm',
    section2Body1: 'Bir kayıptan sonra dinî kurallar duruma ve kanamanın niteliğine bağlı olabilir.',
    section2Body2: 'Özellikle, hangi dinî uygulamaların izleneceğine karar vermeden önce farklı kanama türlerini birbirinden ayırmak gerekebilir.',
    schemaTitle: 'Genel ilke',
    schemaLabel1: 'Durum',
    schemaLabel2: 'Kanamanın niteliği',
    schemaLabel3: 'Uygun rehberlik',
    doubtTipTitle: 'Tereddüt ettiysen',
    doubtTipText: 'Kişisel bir durum farklı bir cevap gerektirebilir. Yetkin birinden görüş almak en doğrusudur.',
    section3H2: '3. Sabır ve umut',
    section3Body1: 'Sabır (sabr), ağlamamak ya da acı hissetmemek demek değildir. Yolculuğa iman ve umutla eşlik etmek de olabilir.',
    section3Body2: 'Küçük adımlar huzur hissini yavaş yavaş geri kazanmana yardımcı olabilir: bir dua, bir an zikir, manevi bir dinleyiş ya da sevdiğin birinin yanında olması.',
    spiritual1: 'Dua',
    spiritual2: 'Zikir',
    spiritual3: 'Destek',
    retainTipTitle: 'Aklında bulunsun',
    retainTipText: 'İyileşme zaman alır. Bir kaybı atlatmak için herkes için geçerli bir hız yoktur.',
    section4H2: '4. İlerlemek için birkaç rehber nokta',
    section4Body: 'Her şeyi bir anda yapmana gerek yok. Hissettiklerine ve şu anda neye ihtiyacın olduğuna uyanı seç.',
    gentleSteps: [
      'Yasını yaşamak için kendine zaman ayır',
      'Kendini şefkatli insanlarla çevrele',
      'Huzur veriyorsa küçük manevi uygulamaları sürdür',
      'Belirli bir dinî soru için görüş al',
      'Yas taşıyamayacağın kadar ağırlaşırsa destek ara',
    ],
    finalTitle: 'Kendi hızında bir yol',
    finalText: 'Kendine iyi bakmak, destek aramak ve umudunu korumak, huzura giden yolu yavaş yavaş aydınlatmaya yardımcı olabilir.',
    shareMessage: 'Kayıptan sonra manevi rehberlik — AWA',
  },
  ru: {
    badge: 'ДУХОВНЫЕ ОРИЕНТИРЫ',
    title: 'Духовные ориентиры\nпосле потери',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaEducational: 'Образовательный материал',
    intro: 'Несколько духовных ориентиров, которые помогут вам пройти через потерю с бережностью, терпением и состраданием.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит образовательный характер. Конкретные религиозные вопросы следует уточнять у компетентного учёного. AWA не выносит персональных фетв.',
    contentsTitle: 'В этой статье',
    topics: [
      'Признанное испытание',
      'Статус, зависящий от ситуации',
      'Терпение и надежда',
      'Несколько ориентиров на пути вперёд',
    ],
    section1H2: '1. Признанное испытание',
    section1Body1: 'Потеря беременности может стать очень болезненным испытанием. Печаль, молчание, растерянность или потребность уйти в себя — естественные человеческие реакции.',
    section1Body2: 'Переживание этих чувств не означает недостатка веры. Каждая женщина проживает своё горе в собственном темпе.',
    visual1Title: 'Принять свои чувства',
    visual1Body: 'Печаль • потребность в отдыхе • тишина • поддержка',
    section2H2: '2. Статус, который может зависеть от ситуации',
    section2Body1: 'После потери религиозные предписания могут зависеть от ситуации и характера кровотечения.',
    section2Body2: 'В частности, прежде чем определить, каких религиозных практик следует придерживаться, может потребоваться различать разные виды кровотечений.',
    schemaTitle: 'Общий принцип',
    schemaLabel1: 'Ситуация',
    schemaLabel2: 'Характер кровотечения',
    schemaLabel3: 'Подходящее руководство',
    doubtTipTitle: 'Если у вас есть сомнения',
    doubtTipText: 'Личная ситуация может потребовать иного ответа. Лучше всего обратиться за советом к компетентному человеку.',
    section3H2: '3. Терпение и надежда',
    section3Body1: 'Терпение (сабр) не означает не плакать и не чувствовать боль. Оно может просто сопровождать этот путь верой и надеждой.',
    section3Body2: 'Небольшие шаги могут постепенно возвращать ощущение покоя: мольба, мгновения зикра, духовная беседа или присутствие близкого человека.',
    spiritual1: 'Мольба',
    spiritual2: 'Зикр',
    spiritual3: 'Поддержка',
    retainTipTitle: 'Помните',
    retainTipText: 'Исцеление требует времени. Универсального темпа, в котором нужно проходить через потерю, не существует.',
    section4H2: '4. Несколько ориентиров на пути вперёд',
    section4Body: 'Не нужно делать всё сразу. Выбирайте то, что соответствует вашему состоянию и тому, что вам нужно сейчас.',
    gentleSteps: [
      'Дайте себе время прожить своё горе',
      'Окружите себя заботливыми людьми',
      'Сохраняйте небольшие духовные практики, если они приносят утешение',
      'Обращайтесь за советом по любому конкретному религиозному вопросу',
      'Ищите поддержки, если горе становится слишком тяжёлым',
    ],
    finalTitle: 'Путь в своём темпе',
    finalText: 'Забота о себе, поиск поддержки и сохранение надежды могут постепенно помочь найти путь к покою.',
    shareMessage: 'Духовные ориентиры после потери — AWA',
  },
  de: {
    badge: 'SPIRITUELLE ORIENTIERUNG',
    title: 'Spirituelle Orientierung\nnach einem Verlust',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaEducational: 'Bildungsinhalt',
    intro: 'Ein paar spirituelle Orientierungspunkte, die dir helfen können, einen Verlust mit Sanftheit, Geduld und Mitgefühl zu durchleben.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt dient der Bildung. Konkrete religiöse Fragen sollten mit einer fachkundigen Gelehrten- oder Gelehrtenperson geklärt werden. AWA erteilt keine persönlichen Fatwas.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Eine anerkannte Prüfung',
      'Ein Status, der von der Situation abhängt',
      'Geduld und Hoffnung',
      'Ein paar Orientierungspunkte für den weiteren Weg',
    ],
    section1H2: '1. Eine anerkannte Prüfung',
    section1Body1:
      'Ein Schwangerschaftsverlust kann eine zutiefst schmerzhafte Prüfung sein. Traurigkeit, Schweigen, Verwirrung oder das Bedürfnis, dich zurückzuziehen, sind natürliche menschliche Reaktionen.',
    section1Body2:
      'Diese Gefühle zu erleben bedeutet nicht, dass es dir an Glauben fehlt. Jede Frau kann ihre Trauer in ihrem eigenen Tempo durchleben.',
    visual1Title: 'Deine Gefühle annehmen',
    visual1Body: 'Traurigkeit • Bedürfnis nach Ruhe • Stille • Unterstützung',
    section2H2: '2. Ein Status, der je nach Situation unterschiedlich sein kann',
    section2Body1:
      'Nach einem Verlust können religiöse Regeln von der Situation und der Art der Blutung abhängen.',
    section2Body2:
      'Insbesondere kann es nötig sein, zwischen verschiedenen Arten von Blutungen zu unterscheiden, bevor festgelegt wird, welche religiösen Praktiken zu beachten sind.',
    schemaTitle: 'Das allgemeine Prinzip',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Art der Blutung',
    schemaLabel3: 'Passende Orientierung',
    doubtTipTitle: 'Bei Zweifeln',
    doubtTipText:
      'Eine persönliche Situation kann eine andere Antwort erfordern. Am besten holst du den Rat einer fachkundigen Person ein.',
    section3H2: '3. Geduld und Hoffnung',
    section3Body1:
      'Geduld (Sabr) bedeutet nicht, nicht zu weinen oder keinen Schmerz zu empfinden. Sie kann diesen Weg einfach mit Glauben und Hoffnung begleiten.',
    section3Body2:
      'Kleine Gesten können nach und nach helfen, wieder inneren Frieden zu finden: ein Bittgebet, ein Moment des Dhikr, ein spirituelles Gespräch oder die Gegenwart eines geliebten Menschen.',
    spiritual1: 'Bittgebet',
    spiritual2: 'Dhikr',
    spiritual3: 'Beistand',
    retainTipTitle: 'Zum Mitnehmen',
    retainTipText:
      'Heilung braucht Zeit. Es gibt kein allgemeingültiges Tempo, um einen Verlust zu verarbeiten.',
    section4H2: '4. Ein paar Orientierungspunkte für den weiteren Weg',
    section4Body:
      'Du musst nicht alles auf einmal tun. Wähle, was zu deinem Befinden und zu dem passt, was du gerade brauchst.',
    gentleSteps: [
      'Nimm dir die Zeit, deine Trauer zu durchleben',
      'Umgib dich mit fürsorglichen Menschen',
      'Behalte kleine spirituelle Praktiken bei, wenn sie dir Trost spenden',
      'Hole bei konkreten religiösen Fragen Rat ein',
      'Suche dir Unterstützung, wenn die Trauer zu schwer zu tragen wird',
    ],
    finalTitle: 'Ein Weg in deinem eigenen Tempo',
    finalText:
      'Gut für dich zu sorgen, dir Unterstützung zu suchen und die Hoffnung zu bewahren, kann dir nach und nach helfen, den Weg zum inneren Frieden zu finden.',
    shareMessage: 'Spirituelle Orientierung nach einem Verlust — AWA',
  },
  zh: {
      badge: '心灵指引',
      title: '失去宝宝之后的\n心灵指引',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaEducational: '教育性内容',
      intro: '一些心灵上的指引，希望能帮助你温柔、耐心、充满慈悲地走过这段失去的时光。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容属教育性质。具体的宗教问题应向合格的学者求证。AWA 不发布个性化的法特瓦。',
      contentsTitle: '本文内容',
      topics: [
        '一场被理解的考验',
        '因情形而异的判定',
        '耐心与希望',
        '往前走的几点指引',
      ],
      section1H2: '1. 一场被理解的考验',
      section1Body1: '妊娠丢失可能是一场极其痛苦的考验。悲伤、沉默、困惑，或是想要退一步的需要，都是人之常情。',
      section1Body2: '有这些情绪，并不代表缺乏信仰。每位女性都可以按自己的节奏走过悲伤。',
      visual1Title: '接纳自己的情绪',
      visual1Body: '悲伤 • 需要休息 • 沉默 • 支持',
      section2H2: '2. 因情形而异的判定',
      section2Body1: '失去宝宝之后，相关的宗教规则可能取决于具体情形以及出血的性质。',
      section2Body2: '特别是，在确定应该遵循哪些宗教实践之前，可能需要先区分不同类型的出血。',
      schemaTitle: '总体原则',
      schemaLabel1: '情形',
      schemaLabel2: '出血的性质',
      schemaLabel3: '相应的指引',
      doubtTipTitle: '如有疑问',
      doubtTipText: '个人的情况可能需要不同的答案。最好向合格的人士请教。',
      section3H2: '3. 耐心与希望',
      section3Body1: '耐心（sabr）并不意味着不哭泣或感觉不到痛。它可以只是带着信仰和希望，陪伴自己走过这段路。',
      section3Body2: '一些小小的举动可以帮助你慢慢找回内心的平静：一次祈祷、一刻赞念（dhikr）、心灵上的倾听，或是亲近之人的陪伴。',
      spiritual1: '祈祷',
      spiritual2: '赞念',
      spiritual3: '支持',
      retainTipTitle: '请记住',
      retainTipText: '愈合需要时间。走出失去的痛苦，并没有统一的节奏。',
      section4H2: '4. 往前走的几点指引',
      section4Body: '不必一下子做完所有事。选择符合你的感受和此刻所需的就好。',
      gentleSteps: [
        '给自己时间去经历悲伤',
        '让关心你的人陪在身边',
        '如果能带来安慰，就继续保持一些简单的心灵修持',
        '遇到具体的宗教问题，可以寻求建议',
        '如果悲伤变得难以承受，请寻求支持',
      ],
      finalTitle: '按自己的节奏走的路',
      finalText: '照顾好自己、寻求支持、怀抱希望，可以逐渐引领你走向平静。',
      shareMessage: '失去宝宝之后的心灵指引 — AWA',
    },
  id: {
    badge: 'PANDUAN SPIRITUAL',
    title: 'Panduan spiritual\nsetelah kehilangan',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaEducational: 'Konten edukatif',
    intro: 'Beberapa poin panduan spiritual untuk membantumu melewati kehilangan dengan kelembutan, kesabaran, dan kasih sayang.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini bersifat edukatif. Pertanyaan keagamaan yang spesifik sebaiknya dipastikan kepada ulama yang berkompeten. AWA tidak mengeluarkan fatwa pribadi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Sebuah ujian yang diakui',
      'Status yang bergantung pada situasi',
      'Kesabaran dan harapan',
      'Beberapa poin panduan untuk melangkah maju',
    ],
    section1H2: '1. Sebuah ujian yang diakui',
    section1Body1: 'Kehilangan kehamilan bisa menjadi ujian yang sangat menyakitkan. Kesedihan, keheningan, kebingungan, atau keinginan untuk menarik diri adalah reaksi manusiawi yang wajar.',
    section1Body2: 'Merasakan emosi-emosi ini bukan berarti kurang beriman. Setiap perempuan bisa melalui dukanya dengan kecepatannya sendiri.',
    visual1Title: 'Menerima perasaanmu',
    visual1Body: 'Sedih • butuh istirahat • hening • dukungan',
    section2H2: '2. Status yang bisa berbeda tergantung situasi',
    section2Body1: 'Setelah kehilangan, hukum agama bisa bergantung pada situasi dan jenis perdarahannya.',
    section2Body2: 'Khususnya, mungkin perlu dibedakan antara berbagai jenis perdarahan sebelum menentukan ibadah apa yang perlu dijalankan.',
    schemaTitle: 'Prinsip umum',
    schemaLabel1: 'Situasi',
    schemaLabel2: 'Jenis perdarahan',
    schemaLabel3: 'Panduan yang sesuai',
    doubtTipTitle: 'Jika ragu',
    doubtTipText: 'Situasi pribadi bisa memerlukan jawaban yang berbeda. Sebaiknya minta pendapat dari orang yang berkompeten.',
    section3H2: '3. Kesabaran dan harapan',
    section3Body1: 'Sabar tidak berarti tidak menangis atau tidak merasakan sakit. Sabar bisa sekadar menemani perjalananmu dengan iman dan harapan.',
    section3Body2: 'Hal-hal kecil bisa membantu mengembalikan rasa damai secara perlahan: sebuah doa, sesaat berzikir, mendengarkan nasihat rohani, atau kehadiran orang yang kamu sayangi.',
    spiritual1: 'Doa',
    spiritual2: 'Zikir',
    spiritual3: 'Dukungan',
    retainTipTitle: 'Ingat selalu',
    retainTipText: 'Pemulihan butuh waktu. Tidak ada kecepatan yang berlaku untuk semua orang dalam melewati kehilangan.',
    section4H2: '4. Beberapa poin panduan untuk melangkah maju',
    section4Body: 'Kamu tidak perlu melakukan semuanya sekaligus. Pilih apa yang sesuai dengan perasaanmu dan apa yang kamu butuhkan saat ini.',
    gentleSteps: [
      'Beri dirimu waktu untuk menjalani dukamu',
      'Dekatkan dirimu dengan orang-orang yang peduli',
      'Teruskan amalan-amalan spiritual kecil jika memberimu ketenangan',
      'Mintalah nasihat untuk setiap pertanyaan keagamaan yang spesifik',
      'Cari dukungan jika duka terasa terlalu berat untuk ditanggung',
    ],
    finalTitle: 'Perjalanan sesuai kecepatanmu',
    finalText: 'Merawat dirimu, mencari dukungan, dan terus berpegang pada harapan bisa perlahan-lahan menuntun jalan menuju kedamaian.',
    shareMessage: 'Panduan spiritual setelah kehilangan — AWA',
  },
  hi: {
    badge: 'आध्यात्मिक मार्गदर्शन',
    title: 'गर्भ खोने के बाद\nआध्यात्मिक मार्गदर्शन',
    metaDuration: '5 मिनट का पाठ',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaEducational: 'शैक्षिक कंटेंट',
    intro: 'कुछ आध्यात्मिक मार्गदर्शन की बातें, जो गर्भ खोने के दौर से कोमलता, सब्र और करुणा के साथ गुज़रने में आपकी मदद करें।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह कंटेंट शैक्षिक है। धार्मिक सवालों के बारे में किसी योग्य आलिम से पूछकर पुष्टि करें। AWA व्यक्तिगत फ़तवे जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'एक मानी हुई आज़माइश',
      'स्थिति पर निर्भर हुक्म',
      'सब्र और उम्मीद',
      'आगे बढ़ने के लिए कुछ मार्गदर्शक बातें',
    ],
    section1H2: '1. एक मानी हुई आज़माइश',
    section1Body1: 'गर्भ का खोना एक गहरे दर्द वाली आज़माइश हो सकती है। उदासी, ख़ामोशी, उलझन या सबसे दूर हो जाने की ज़रूरत, ये सब इंसान की स्वाभाविक प्रतिक्रियाएँ हैं।',
    section1Body2: 'इन भावनाओं को महसूस करने का मतलब यह नहीं कि ईमान कमज़ोर है। हर महिला अपने ग़म से अपनी रफ़्तार से गुज़र सकती है।',
    visual1Title: 'अपनी भावनाओं को अपनाना',
    visual1Body: 'उदासी • आराम की ज़रूरत • ख़ामोशी • सहारा',
    section2H2: '2. स्थिति के अनुसार बदलने वाला हुक्म',
    section2Body1: 'गर्भ खोने के बाद धार्मिक नियम स्थिति और रक्तस्राव की प्रकृति पर निर्भर हो सकते हैं।',
    section2Body2: 'खास तौर पर, कौन-सी धार्मिक इबादतें करनी हैं, यह तय करने से पहले अलग-अलग तरह के रक्तस्राव में फ़र्क करना ज़रूरी हो सकता है।',
    schemaTitle: 'सामान्य सिद्धांत',
    schemaLabel1: 'स्थिति',
    schemaLabel2: 'रक्तस्राव की प्रकृति',
    schemaLabel3: 'उचित मार्गदर्शन',
    doubtTipTitle: 'अगर संदेह हो',
    doubtTipText: 'किसी की निजी स्थिति में अलग जवाब की ज़रूरत हो सकती है। बेहतर है कि किसी योग्य व्यक्ति से सलाह ली जाए।',
    section3H2: '3. सब्र और उम्मीद',
    section3Body1: 'सब्र का मतलब यह नहीं कि रोया न जाए या दर्द महसूस न हो। यह बस ईमान और उम्मीद के साथ इस सफ़र में साथ चल सकता है।',
    section3Body2: 'छोटे-छोटे कदम धीरे-धीरे सुकून लौटाने में मदद कर सकते हैं: एक दुआ, कुछ देर का ज़िक्र, रूहानी बातें सुनना, या किसी अपने का साथ होना।',
    spiritual1: 'दुआ',
    spiritual2: 'ज़िक्र',
    spiritual3: 'सहारा',
    retainTipTitle: 'याद रखें',
    retainTipText: 'ठीक होने में समय लगता है। गर्भ खोने के दौर से गुज़रने की कोई एक तय रफ़्तार नहीं होती।',
    section4H2: '4. आगे बढ़ने के लिए कुछ मार्गदर्शक बातें',
    section4Body: 'सब कुछ एक साथ करने की ज़रूरत नहीं है। वही चुनें जो आपके एहसास और आपकी अभी की ज़रूरत से मेल खाता हो।',
    gentleSteps: [
      'अपने ग़म को जीने के लिए ख़ुद को समय दें',
      'अपने आसपास परवाह करने वाले लोगों को रखें',
      'अगर छोटी-छोटी रूहानी आदतों से सुकून मिलता है तो उन्हें जारी रखें',
      'किसी भी खास धार्मिक सवाल के लिए सलाह लें',
      'अगर ग़म उठाना बहुत भारी हो जाए तो सहारा माँगें',
    ],
    finalTitle: 'अपनी रफ़्तार से एक राह',
    finalText: 'अपना ख़याल रखना, सहारा माँगना और उम्मीद थामे रखना धीरे-धीरे सुकून की ओर राह दिखाने में मदद कर सकता है।',
    shareMessage: 'गर्भ खोने के बाद आध्यात्मिक मार्गदर्शन — AWA',
  },
  sq: {
    badge: 'UDHËZIM SHPIRTËROR',
    title: 'Udhëzim shpirtëror\npas një humbjeje',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaEducational: 'Përmbajtje edukative',
    intro: 'Disa pika udhëzimi shpirtëror që të ndihmojnë ta kalosh një humbje me butësi, durim dhe dhembshuri.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është edukative. Pyetjet fetare specifike duhen verifikuar me një dijetar të kualifikuar. AWA nuk jep fetva të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Një sprovë e njohur',
      'Një gjendje që varet nga situata',
      'Durimi dhe shpresa',
      'Disa pika udhëzimi për të ecur përpara',
    ],
    section1H2: '1. Një sprovë e njohur',
    section1Body1: 'Humbja e një shtatzënie mund të jetë një sprovë thellësisht e dhimbshme. Trishtimi, heshtja, hutimi ose nevoja për t’u tërhequr janë reagime njerëzore të natyrshme.',
    section1Body2: 'Të ndjesh këto emocione nuk do të thotë të mungojë besimi. Çdo grua mund ta kalojë zinë e saj me ritmin e vet.',
    visual1Title: 'Mirëpritja e emocioneve të tua',
    visual1Body: 'Trishtim • nevojë për pushim • heshtje • mbështetje',
    section2H2: '2. Një gjendje që mund të ndryshojë sipas situatës',
    section2Body1: 'Pas një humbjeje, rregullat fetare mund të varen nga situata dhe nga natyra e gjakderdhjes.',
    section2Body2: 'Në veçanti, mund të jetë e nevojshme të bëhet dallimi mes llojeve të ndryshme të gjakderdhjes përpara se të përcaktohet cilat praktika fetare duhen ndjekur.',
    schemaTitle: 'Parimi i përgjithshëm',
    schemaLabel1: 'Situata',
    schemaLabel2: 'Natyra e gjakderdhjes',
    schemaLabel3: 'Udhëzimi i përshtatshëm',
    doubtTipTitle: 'Në rast dyshimi',
    doubtTipText: 'Një situatë personale mund të kërkojë një përgjigje tjetër. Më mirë është të kërkosh këshillë nga një person i kualifikuar.',
    section3H2: '3. Durimi dhe shpresa',
    section3Body1: 'Durimi (sabr) nuk do të thotë të mos qash ose të mos ndjesh dhimbje. Ai thjesht mund ta shoqërojë rrugën me besim dhe shpresë.',
    section3Body2: 'Gjeste të vogla mund të ndihmojnë ta rikthejnë gradualisht ndjenjën e qetësisë: një dua, një çast dhikri, një dëgjim shpirtëror ose prania e një të afërmi.',
    spiritual1: 'Dua',
    spiritual2: 'Dhikr',
    spiritual3: 'Mbështetje',
    retainTipTitle: 'Mbaje në mendje',
    retainTipText: 'Shërimi kërkon kohë. Nuk ka një ritëm universal për ta kaluar një humbje.',
    section4H2: '4. Disa pika udhëzimi për të ecur përpara',
    section4Body: 'Nuk ka nevojë t’i bësh të gjitha menjëherë. Zgjidh atë që përputhet me mënyrën si ndihesh dhe me atë që të duhet tani.',
    gentleSteps: [
      'Merr kohën për ta përjetuar zinë tënde',
      'Rrethohu me njerëz që kujdesen për ty',
      'Vazhdo praktika të vogla shpirtërore nëse të sjellin ngushëllim',
      'Kërko këshillë për çdo pyetje fetare specifike',
      'Kërko mbështetje nëse zia bëhet shumë e vështirë për t’u mbajtur',
    ],
    finalTitle: 'Një rrugë me ritmin tënd',
    finalText: 'Të kujdesesh për veten, të kërkosh mbështetje dhe të mbash shpresën mund ta udhëheqin gradualisht rrugën drejt qetësisë.',
    shareMessage: 'Udhëzim shpirtëror pas një humbjeje — AWA',
  },
  ja: {
    badge: '心の支え',
    title: '喪失のあとの\n心の支え',
    metaDuration: '読了時間5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaEducational: '教育的な内容',
    intro: '喪失の悲しみを、やさしさと忍耐、思いやりをもって乗り越えるための、心の支えとなる手がかりをいくつかご紹介します。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容は教育を目的としたものです。宗教上の具体的な疑問は、資格のある学者に確認してください。AWAは、個別のファトワーを出すことはありません。',
    contentsTitle: 'この記事の内容',
    topics: [
      'つらさが認められる試練',
      '状況によって変わる位置づけ',
      '忍耐と希望',
      '前に進むための手がかり',
    ],
    section1H2: '1. つらさが認められる試練',
    section1Body1: '妊娠の喪失は、深い痛みを伴う試練となることがあります。悲しみ、沈黙、戸惑い、あるいは少し距離を置きたいという気持ちは、人として自然な反応です。',
    section1Body2: 'こうした感情を抱くことは、信仰が足りないという意味ではありません。悲しみとの向き合い方は、一人ひとり自分のペースでよいのです。',
    visual1Title: 'ご自身の感情を受け入れる',
    visual1Body: '悲しみ • 休息が必要な気持ち • 沈黙 • 支え',
    section2H2: '2. 状況によって変わりうる位置づけ',
    section2Body1: '喪失のあとの宗教上の規定は、状況や出血の性質によって異なることがあります。',
    section2Body2: 'とくに、どの宗教的な実践に従うかを判断する前に、出血の種類を区別する必要がある場合があります。',
    schemaTitle: '基本的な考え方',
    schemaLabel1: '状況',
    schemaLabel2: '出血の性質',
    schemaLabel3: '適切な導き',
    doubtTipTitle: '迷ったときは',
    doubtTipText: '個別の状況によっては、異なる答えが必要になることがあります。資格のある方に相談するのがいちばんです。',
    section3H2: '3. 忍耐と希望',
    section3Body1: '忍耐（サブル）とは、泣かないことや痛みを感じないことではありません。ただ、信仰と希望をもってその道のりに寄り添うこともできます。',
    section3Body2: '小さな行いが、少しずつ心の平穏を取り戻す助けになることがあります。祈願、ズィクルのひととき、信仰の面で話に耳を傾けてもらうこと、大切な人がそばにいることなどです。',
    spiritual1: '祈願',
    spiritual2: 'ズィクル',
    spiritual3: '支え',
    retainTipTitle: '心に留めておきたいこと',
    retainTipText: '癒えるには時間がかかります。喪失を乗り越えるペースに、決まった形はありません。',
    section4H2: '4. 前に進むための手がかり',
    section4Body: 'すべてを一度にする必要はありません。今の気持ちや必要なことに合うものを選んでください。',
    gentleSteps: [
      '悲しみを味わう時間を大切にする',
      '思いやりのある人たちに囲まれて過ごす',
      '心が安らぐなら、ささやかな信仰の実践を続ける',
      '宗教上の具体的な疑問は、助言を求める',
      '悲しみが重くなりすぎたときは、支えを求める',
    ],
    finalTitle: '自分のペースで歩む道',
    finalText: 'ご自身をいたわり、支えを求め、希望を持ち続けることが、少しずつ平穏への道を照らしてくれます。',
    shareMessage: '喪失のあとの心の支え — AWA',
  },
  ko: {
    badge: '영적 안내',
    title: '상실 후의\n영적 안내',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaEducational: '교육용 콘텐츠',
    intro: '상실을 부드러움과 인내, 따뜻한 마음으로 지나가도록 돕는 몇 가지 영적 안내예요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 교육용이에요. 구체적인 종교 문제는 자격을 갖춘 학자에게 확인해야 해요. AWA는 개인별 맞춤 파트와를 내리지 않아요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '인정받는 시련',
      '상황에 따라 달라지는 상태',
      '인내와 희망',
      '앞으로 나아가기 위한 몇 가지 안내',
    ],
    section1H2: '1. 인정받는 시련',
    section1Body1: '임신 상실은 깊은 아픔을 주는 시련일 수 있어요. 슬픔, 침묵, 혼란, 또는 한 걸음 물러서고 싶은 마음은 자연스러운 인간적인 반응이에요.',
    section1Body2: '이런 감정을 느낀다고 해서 믿음이 부족한 것은 아니에요. 여성마다 자기만의 속도로 슬픔을 지나갈 수 있어요.',
    visual1Title: '감정을 있는 그대로 받아들이기',
    visual1Body: '슬픔 • 쉼이 필요함 • 침묵 • 지지',
    section2H2: '2. 상황에 따라 달라질 수 있는 상태',
    section2Body1: '상실 후의 종교적 규정은 상황과 출혈의 성격에 따라 달라질 수 있어요.',
    section2Body2: '특히 어떤 종교적 실천을 따를지 정하기 전에, 출혈의 종류를 구분해야 할 수 있어요.',
    schemaTitle: '일반 원칙',
    schemaLabel1: '상황',
    schemaLabel2: '출혈의 성격',
    schemaLabel3: '알맞은 안내',
    doubtTipTitle: '확실하지 않을 때',
    doubtTipText: '개인의 상황에 따라 다른 답이 필요할 수 있어요. 자격을 갖춘 사람에게 조언을 구하는 것이 좋아요.',
    section3H2: '3. 인내와 희망',
    section3Body1: '인내(사브르)는 울지 않거나 아픔을 느끼지 않는다는 뜻이 아니에요. 믿음과 희망으로 그 여정에 함께하는 것일 수 있어요.',
    section3Body2: '작은 행동이 평안한 마음을 조금씩 되찾는 데 도움이 될 수 있어요. 두아(간구), 잠시 하는 지크르, 영적인 경청, 또는 사랑하는 사람의 곁에 있음이 그런 예예요.',
    spiritual1: '두아(간구)',
    spiritual2: '지크르',
    spiritual3: '지지',
    retainTipTitle: '기억해 두세요',
    retainTipText: '회복에는 시간이 걸려요. 상실을 지나가는 속도에 모두에게 맞는 기준은 없어요.',
    section4H2: '4. 앞으로 나아가기 위한 몇 가지 안내',
    section4Body: '모든 것을 한꺼번에 할 필요는 없어요. 지금 내가 느끼는 마음과 필요에 맞는 것을 선택하세요.',
    gentleSteps: [
      '슬픔을 충분히 겪을 시간을 가져요',
      '따뜻한 사람들과 함께해요',
      '위안이 된다면 작은 영적 실천을 이어가요',
      '구체적인 종교 문제는 조언을 구해요',
      '슬픔이 너무 버거워지면 도움을 요청해요',
    ],
    finalTitle: '나의 속도로 걷는 길',
    finalText: '나 자신을 돌보고, 도움을 구하고, 희망을 놓지 않으면 평안으로 가는 길이 조금씩 열릴 수 있어요.',
    shareMessage: '상실 후의 영적 안내 — AWA',
  },
  'pt-PT': {
    badge: 'ORIENTAÇÃO ESPIRITUAL',
    title: 'Orientação espiritual\napós uma perda',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaEducational: 'Conteúdo educativo',
    intro: 'Alguns pontos de orientação espiritual para a ajudar a atravessar uma perda com suavidade, paciência e compaixão.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é educativo. As questões religiosas específicas devem ser verificadas junto de um sábio qualificado. A AWA não emite fatwas personalizadas.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Uma provação reconhecida',
      'Um estatuto que depende da situação',
      'Paciência e esperança',
      'Alguns pontos de orientação para seguir em frente',
    ],
    section1H2: '1. Uma provação reconhecida',
    section1Body1: 'Uma perda gestacional pode ser uma provação profundamente dolorosa. A tristeza, o silêncio, a confusão ou a necessidade de se afastar são reações humanas naturais.',
    section1Body2: 'Sentir estas emoções não significa falta de fé. Cada mulher pode viver o seu luto ao seu próprio ritmo.',
    visual1Title: 'Acolher as suas emoções',
    visual1Body: 'Tristeza • necessidade de descanso • silêncio • apoio',
    section2H2: '2. Um estatuto que pode variar consoante a situação',
    section2Body1: 'Após uma perda, as regras religiosas podem depender da situação e da natureza do sangramento.',
    section2Body2: 'Em particular, pode ser necessário distinguir entre diferentes tipos de sangramento antes de determinar que práticas religiosas seguir.',
    schemaTitle: 'O princípio geral',
    schemaLabel1: 'Situação',
    schemaLabel2: 'Natureza do sangramento',
    schemaLabel3: 'Orientação adequada',
    doubtTipTitle: 'Em caso de dúvida',
    doubtTipText: 'Uma situação pessoal pode exigir uma resposta diferente. É preferível pedir conselho a uma pessoa qualificada.',
    section3H2: '3. Paciência e esperança',
    section3Body1: 'A paciência (sabr) não significa não chorar nem não sentir dor. Pode simplesmente acompanhar o percurso com fé e esperança.',
    section3Body2: 'Pequenos gestos podem ajudar a recuperar gradualmente uma sensação de paz: uma súplica, um momento de dhikr, uma escuta espiritual ou a presença de um ente querido.',
    spiritual1: 'Súplica',
    spiritual2: 'Dhikr',
    spiritual3: 'Apoio',
    retainTipTitle: 'A ter presente',
    retainTipText: 'A cura leva tempo. Não existe um ritmo universal para atravessar uma perda.',
    section4H2: '4. Alguns pontos de orientação para seguir em frente',
    section4Body: 'Não é preciso fazer tudo de uma vez. Escolha o que corresponde ao que sente e ao de que precisa neste momento.',
    gentleSteps: [
      'Dê-se tempo para viver o seu luto',
      'Rodeie-se de pessoas atenciosas',
      'Mantenha pequenas práticas espirituais se lhe trouxerem conforto',
      'Peça conselho para qualquer questão religiosa específica',
      'Procure apoio se o luto se tornar demasiado difícil de suportar',
    ],
    finalTitle: 'Um caminho ao seu ritmo',
    finalText: 'Cuidar de si, procurar apoio e manter a esperança podem ajudar, aos poucos, a orientar o caminho rumo à paz.',
    shareMessage: 'Orientação espiritual após uma perda — AWA',
  },
  bn: {
    badge: 'আধ্যাত্মিক দিকনির্দেশনা',
    title: 'ক্ষতির পর\nআধ্যাত্মিক দিকনির্দেশনা',
    metaDuration: '5 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaEducational: 'শিক্ষামূলক বিষয়বস্তু',
    intro: 'কোমলতা, ধৈর্য ও সহমর্মিতার সঙ্গে ক্ষতি পেরিয়ে যেতে সাহায্য করার জন্য আধ্যাত্মিক দিকনির্দেশনার কয়েকটি বিষয়।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু শিক্ষামূলক। ধর্মীয় নির্দিষ্ট প্রশ্নের উত্তর কোনো যোগ্য আলেমের কাছ থেকে যাচাই করে নিন। AWA ব্যক্তিগত ফতোয়া প্রদান করে না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'একটি স্বীকৃত পরীক্ষা',
      'পরিস্থিতির ওপর নির্ভরশীল একটি অবস্থা',
      'ধৈর্য ও আশা',
      'এগিয়ে যাওয়ার জন্য কয়েকটি দিকনির্দেশনা',
    ],
    section1H2: '1. একটি স্বীকৃত পরীক্ষা',
    section1Body1: 'গর্ভধারণ হারানো গভীর বেদনাদায়ক একটি পরীক্ষা হতে পারে। দুঃখ, নীরবতা, বিভ্রান্তি বা নিজেকে গুটিয়ে নেওয়ার প্রয়োজন মানুষের স্বাভাবিক প্রতিক্রিয়া।',
    section1Body2: 'এসব অনুভূতি হওয়ার অর্থ ঈমানের ঘাটতি নয়। প্রতিটি নারী নিজের গতিতে নিজের শোকের মধ্য দিয়ে যেতে পারেন।',
    visual1Title: 'আপনার অনুভূতিকে স্বাগত জানানো',
    visual1Body: 'দুঃখ • বিশ্রামের প্রয়োজন • নীরবতা • সহায়তা',
    section2H2: '2. পরিস্থিতি অনুযায়ী পরিবর্তনশীল একটি অবস্থা',
    section2Body1: 'গর্ভধারণ হারানোর পর ধর্মীয় বিধান পরিস্থিতি ও রক্তস্রাবের প্রকৃতির ওপর নির্ভর করতে পারে।',
    section2Body2: 'বিশেষ করে, কোন ধর্মীয় আমল অনুসরণ করা হবে তা নির্ধারণের আগে বিভিন্ন ধরনের রক্তস্রাবের মধ্যে পার্থক্য করার প্রয়োজন হতে পারে।',
    schemaTitle: 'সাধারণ নীতি',
    schemaLabel1: 'পরিস্থিতি',
    schemaLabel2: 'রক্তস্রাবের প্রকৃতি',
    schemaLabel3: 'উপযুক্ত দিকনির্দেশনা',
    doubtTipTitle: 'সন্দেহ থাকলে',
    doubtTipText: 'ব্যক্তিগত পরিস্থিতিতে ভিন্ন উত্তরের প্রয়োজন হতে পারে। কোনো যোগ্য ব্যক্তির পরামর্শ নেওয়াই ভালো।',
    section3H2: '3. ধৈর্য ও আশা',
    section3Body1: 'ধৈর্য (সবর) মানে কান্না না করা বা কষ্ট অনুভব না করা নয়। এটি ঈমান ও আশার সঙ্গে এই পথচলার সঙ্গী হতে পারে।',
    section3Body2: 'ছোট ছোট কিছু কাজ ধীরে ধীরে মনের শান্তি ফিরিয়ে আনতে সাহায্য করতে পারে: একটি দোয়া, কিছুক্ষণ যিকির, আধ্যাত্মিক কথা শোনা, বা প্রিয়জনের উপস্থিতি।',
    spiritual1: 'দোয়া',
    spiritual2: 'যিকির',
    spiritual3: 'সহায়তা',
    retainTipTitle: 'মনে রাখবেন',
    retainTipText: 'সেরে ওঠার জন্য সময় লাগে। ক্ষতি পেরিয়ে যাওয়ার কোনো সর্বজনীন গতি নেই।',
    section4H2: '4. এগিয়ে যাওয়ার জন্য কয়েকটি দিকনির্দেশনা',
    section4Body: 'সবকিছু একসঙ্গে করার প্রয়োজন নেই। আপনি এখন যেমন বোধ করছেন এবং যা প্রয়োজন, তার সঙ্গে যা মেলে তা বেছে নিন।',
    gentleSteps: [
      'নিজের শোক অনুভব করার জন্য সময় নিন',
      'যত্নশীল মানুষদের কাছে থাকুন',
      'স্বস্তি দেয় এমন ছোট ছোট আধ্যাত্মিক আমল চালিয়ে যান',
      'ধর্মীয় কোনো নির্দিষ্ট প্রশ্নে পরামর্শ নিন',
      'শোক বহন করা খুব কঠিন হয়ে উঠলে সহায়তা নিন',
    ],
    finalTitle: 'আপনার নিজের গতিতে একটি পথ',
    finalText: 'নিজের যত্ন নেওয়া, সহায়তা চাওয়া এবং আশা ধরে রাখা ধীরে ধীরে শান্তির পথে এগিয়ে যেতে সাহায্য করতে পারে।',
    shareMessage: 'ক্ষতির পর আধ্যাত্মিক দিকনির্দেশনা — AWA',
  },
  da: {
    badge: 'ÅNDELIG VEJLEDNING',
    title: 'Åndelig vejledning\nefter et tab',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaEducational: 'Uddannelsesindhold',
    intro:
      'Nogle åndelige holdepunkter, der kan hjælpe dig med at bære et tab med blødhed, tålmodighed og medfølelse.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText:
      'Dette indhold er uddannelsesmæssigt. Specifikke religiøse spørgsmål bør verificeres med en kvalificeret lærde. AWA udsteder ikke personlige fatwas.',
    contentsTitle: 'I denne artikel',
    topics: [
      'En anerkendt prøvelse',
      'En status der afhænger af situationen',
      'Tålmodighed og håb',
      'Nogle holdepunkter til at komme videre',
    ],
    section1H2: '1. En anerkendt prøvelse',
    section1Body1:
      'Et graviditetstab kan være en dybt smertefuld prøvelse. Sorg, stilhed, forvirring eller behovet for at trække sig tilbage er naturlige menneskelige reaktioner.',
    section1Body2:
      'At mærke disse følelser betyder ikke, at man mangler tro. Hver kvinde kan gennemleve sin sorg i sit eget tempo.',
    visual1Title: 'At rumme dine følelser',
    visual1Body: 'Sorg • behov for hvile • stilhed • støtte',
    section2H2: '2. En status der kan variere afhængigt af situationen',
    section2Body1:
      'Efter et tab kan religiøse regler afhænge af situationen og blødningens karakter.',
    section2Body2:
      'Det kan især være nødvendigt at skelne mellem forskellige typer blødning, inden man fastlægger, hvilke religiøse praksisser der skal følges.',
    schemaTitle: 'Det generelle princip',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Blødningens karakter',
    schemaLabel3: 'Tilpasset vejledning',
    doubtTipTitle: 'Ved tvivl',
    doubtTipText:
      'En personlig situation kan kræve et andet svar. Det er bedst at søge råd hos en kvalificeret person.',
    section3H2: '3. Tålmodighed og håb',
    section3Body1:
      'Tålmodighed (sabr) betyder ikke, at man ikke må græde eller ikke føle smerte. Det kan blot ledsage rejsen med tro og håb.',
    section3Body2:
      'Små handlinger kan gradvist hjælpe med at genoprette en følelse af ro: en bøn (du\'a), et øjeblik med dhikr, åndelig lytning eller nærvær fra en man holder af.',
    spiritual1: 'Du\'a',
    spiritual2: 'Dhikr',
    spiritual3: 'Støtte',
    retainTipTitle: 'Husk',
    retainTipText:
      'Heling tager tid. Der er ingen universel hastighed for at komme igennem et tab.',
    section4H2: '4. Nogle holdepunkter til at komme videre',
    section4Body:
      'Der er ikke brug for at gøre alt på én gang. Vælg det, der passer til, hvordan du har det, og hvad du har brug for lige nu.',
    gentleSteps: [
      'Tag dig tid til at gennemleve din sorg',
      'Omgiv dig med omsorgsfulde mennesker',
      'Hold fast i små åndelige praksisser, hvis de giver trøst',
      'Søg råd ved specifikke religiøse spørgsmål',
      'Søg støtte, hvis sorgen bliver for tung at bære',
    ],
    finalTitle: 'En vej i dit eget tempo',
    finalText:
      'At tage vare på dig selv, søge støtte og holde fast i håbet kan gradvist hjælpe dig på vejen mod ro og fred.',
    shareMessage: 'Åndelig vejledning efter et tab — AWA',
  },
  sv: {
    badge: 'ÅNDELIG VEJLEDNING',
    title: 'Åndelig vejledning\nefter et tab',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaEducational: 'Uddannelsesindhold',
    intro:
      'Nogle åndelige holdepunkter, der kan hjälpe dig med at bäre et tab med blödhed, tålmodighed och medfölelse.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText:
      'Dette indhold ar uddannelsesmässigt. Specifikke religiöse spörgsmål bör verificeres med en kvalificeret lärde. AWA udsteder inte personlige fatwas.',
    contentsTitle: 'I denne artikel',
    topics: [
      'En anerkendt prövelse',
      'En status der afhänger av situationen',
      'Tålmodighed och håb',
      'Nogle holdepunkter till at komme videre',
    ],
    section1H2: '1. En anerkendt prövelse',
    section1Body1:
      'Et graviditetstab kan väre en dybt smertefuld prövelse. Sorg, stilhed, forvirring eller behovet for att träkke sig tilbage ar naturlige menneskelige reaktioner.',
    section1Body2:
      'At märke disse fölelser betyder inte, at man mangler tro. Hver kvinna kan gennemleve sin sorg i sit eget tempo.',
    visual1Title: 'At rumme dina fölelser',
    visual1Body: 'Sorg • behov for hvile • stilhed • stötte',
    section2H2: '2. En status der kan variere afhängigt av situationen',
    section2Body1:
      'Efter et tab kan religiöse regler afhänge av situationen och blödningens karakter.',
    section2Body2:
      'Det kan isär väre nödvendigt at skelne mellem forskellige typer blödning, inden man fastlägger, hvilke religiöse praksisser der skal fölges.',
    schemaTitle: 'Det generelle princip',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Blödningens karakter',
    schemaLabel3: 'Tilpasset vejledning',
    doubtTipTitle: 'Ved tvivl',
    doubtTipText:
      'En personlig situation kan kräve et andet svar. Det ar bedst at söge råd hos en kvalificeret person.',
    section3H2: '3. Tålmodighed och håb',
    section3Body1:
      'Tålmodighed (sabr) betyder inte, at man inte må gräde eller inte föle smerte. Det kan blot ledsage rejsen med tro och håb.',
    section3Body2:
      'Små handlinger kan gradvist hjälpe med at genoprette en fölelse av ro: en bön (du\'a), et öjeblik med dhikr, åndelig lytning eller närvär fran en man holder av.',
    spiritual1: 'Du\'a',
    spiritual2: 'Dhikr',
    spiritual3: 'Stötte',
    retainTipTitle: 'Husk',
    retainTipText:
      'Heling tager tid. Der ar ingen universel hastighed for att komme igennem et tab.',
    section4H2: '4. Nogle holdepunkter till at komme videre',
    section4Body:
      'Der ar inte brug for att göre alt på én gang. Välg det, der passer till, hvordan du har det, och hvad du har brug for lige nu.',
    gentleSteps: [
      'Tag dig tid till at gennemleve din sorg',
      'Omgiv dig med omsorgsfulde mennesker',
      'Hold fast i små åndelige praksisser, hvis de giver tröst',
      'Sög råd ved specifikke religiöse spörgsmål',
      'Sög stötte, hvis sorgen bliver for tung at bäre',
    ],
    finalTitle: 'En vej i ditt eget tempo',
    finalText:
      'At tage vare på dig selv, söge stötte och holde fast i håbet kan gradvist hjälpe dig på vejen mod ro och fred.',
    shareMessage: 'Åndelig vejledning efter et tab — AWA',
  },
  nb: {
    badge: 'ÅNDELIG VEILEDNING',
    title: 'Åndelig veiledning\netter et tap',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaEducational: 'Pedagogisk innhold',
    intro:
      'Noen åndelige holdepunkter som kan hjelpe deg å komme gjennom et tap med mildhet, tålmodighet og medfølelse.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText:
      'Dette innholdet er pedagogisk. Spesifikke religiøse spørsmål bør kontrolleres med en kvalifisert lærd. AWA utsteder ikke personlige fatwaer.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'En anerkjent prøvelse',
      'En status som avhenger av situasjonen',
      'Tålmodighet og håp',
      'Noen holdepunkter for å gå videre',
    ],
    section1H2: '1. En anerkjent prøvelse',
    section1Body1:
      'Et svangerskapstap kan være en dypt smertefull prøvelse. Tristhet, stillhet, forvirring eller behovet for å trekke seg tilbake er naturlige menneskelige reaksjoner.',
    section1Body2:
      'Å kjenne disse følelsene betyr ikke å mangle tro. Hver kvinne kan gå gjennom sorgen sin i sitt eget tempo.',
    visual1Title: 'Ta imot følelsene dine',
    visual1Body: 'Tristhet • behov for hvile • stillhet • støtte',
    section2H2: '2. En status som kan variere avhengig av situasjonen',
    section2Body1:
      'Etter et tap kan de religiøse reglene avhenge av situasjonen og blødningens karakter.',
    section2Body2:
      'Det kan særlig være nødvendig å skille mellom ulike typer blødning før man avgjør hvilke religiøse praksiser som skal følges.',
    schemaTitle: 'Det generelle prinsippet',
    schemaLabel1: 'Situasjon',
    schemaLabel2: 'Blødningens karakter',
    schemaLabel3: 'Egnet veiledning',
    doubtTipTitle: 'Ved tvil',
    doubtTipText:
      'En personlig situasjon kan kreve et annet svar. Det er best å søke råd hos en kvalifisert person.',
    section3H2: '3. Tålmodighet og håp',
    section3Body1:
      'Tålmodighet (sabr) betyr ikke å ikke gråte eller ikke kjenne smerte. Den kan rett og slett følge reisen med tro og håp.',
    section3Body2:
      'Små gester kan gradvis hjelpe til å gjenopprette en følelse av fred: en påkallelse, et øyeblikk med dhikr, åndelig lytting eller nærværet av en nærstående.',
    spiritual1: 'Påkallelse',
    spiritual2: 'Dhikr',
    spiritual3: 'Støtte',
    retainTipTitle: 'Husk',
    retainTipText:
      'Helingen tar tid. Det finnes ikke noe universelt tempo for å komme gjennom et tap.',
    section4H2: '4. Noen holdepunkter for å gå videre',
    section4Body:
      'Du trenger ikke gjøre alt på en gang. Velg det som passer hvordan du føler deg og hva du trenger akkurat nå.',
    gentleSteps: [
      'Ta deg tid til å leve gjennom sorgen din',
      'Omgi deg med omsorgsfulle mennesker',
      'Hold fast ved små åndelige praksiser hvis de gir trøst',
      'Søk råd om ethvert spesifikt religiøst spørsmål',
      'Søk støtte hvis sorgen blir for tung å bære',
    ],
    finalTitle: 'En vei i ditt eget tempo',
    finalText:
      'Å ta vare på deg selv, søke støtte og holde fast ved håpet kan gradvis hjelpe deg å finne veien mot fred.',
    shareMessage: 'Åndelig veiledning etter et tap – AWA',
  },
  pl: {
    badge: 'WSKAZÓWKI DUCHOWE',
    title: 'Wskazówki duchowe\npo stracie',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaEducational: 'Treść edukacyjna',
    intro:
      'Kilka wskazówek duchowych, które pomogą Ci przejść przez stratę z łagodnością, cierpliwością i współczuciem.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText:
      'Ta treść ma charakter edukacyjny. Szczegółowe pytania religijne należy zweryfikować u wykwalifikowanego uczonego. AWA nie wydaje spersonalizowanych fatw.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Uznana próba',
      'Status zależny od sytuacji',
      'Cierpliwość i nadzieja',
      'Kilka wskazówek na dalszą drogę',
    ],
    section1H2: '1. Uznana próba',
    section1Body1:
      'Utrata ciąży może być głęboko bolesną próbą. Smutek, milczenie, zagubienie lub potrzeba wycofania się to naturalne ludzkie reakcje.',
    section1Body2:
      'Odczuwanie tych emocji nie oznacza braku wiary. Każda kobieta może przeżywać żałobę we własnym tempie.',
    visual1Title: 'Przyjmowanie swoich emocji',
    visual1Body: 'Smutek • potrzeba odpoczynku • milczenie • wsparcie',
    section2H2: '2. Status, który może się różnić w zależności od sytuacji',
    section2Body1:
      'Po stracie zasady religijne mogą zależeć od sytuacji i charakteru krwawienia.',
    section2Body2:
      'W szczególności może być konieczne rozróżnienie różnych rodzajów krwawienia, zanim ustali się, jakich praktyk religijnych przestrzegać.',
    schemaTitle: 'Ogólna zasada',
    schemaLabel1: 'Sytuacja',
    schemaLabel2: 'Charakter krwawienia',
    schemaLabel3: 'Odpowiednia wskazówka',
    doubtTipTitle: 'W razie wątpliwości',
    doubtTipText:
      'Osobista sytuacja może wymagać innej odpowiedzi. Najlepiej zasięgnąć porady wykwalifikowanej osoby.',
    section3H2: '3. Cierpliwość i nadzieja',
    section3Body1:
      'Cierpliwość (sabr) nie oznacza, że nie wolno płakać ani czuć bólu. Może po prostu towarzyszyć drodze z wiarą i nadzieją.',
    section3Body2:
      'Drobne gesty mogą pomóc stopniowo odzyskać poczucie spokoju: prośba (dua), chwila dhikru, duchowe wysłuchanie lub obecność bliskiej osoby.',
    spiritual1: 'Prośba (dua)',
    spiritual2: 'Dhikr',
    spiritual3: 'Wsparcie',
    retainTipTitle: 'Pamiętaj',
    retainTipText:
      'Powrót do równowagi wymaga czasu. Nie ma uniwersalnego tempa przechodzenia przez stratę.',
    section4H2: '4. Kilka wskazówek na dalszą drogę',
    section4Body:
      'Nie trzeba robić wszystkiego naraz. Wybierz to, co odpowiada temu, jak się czujesz i czego teraz potrzebujesz.',
    gentleSteps: [
      'Daj sobie czas na przeżycie żałoby',
      'Otocz się życzliwymi osobami',
      'Podtrzymuj drobne praktyki duchowe, jeśli przynoszą ukojenie',
      'Zasięgnij porady w każdej szczegółowej kwestii religijnej',
      'Poszukaj wsparcia, jeśli żałoba staje się zbyt trudna do udźwignięcia',
    ],
    finalTitle: 'Droga we własnym tempie',
    finalText:
      'Dbanie o siebie, szukanie wsparcia i podtrzymywanie nadziei mogą stopniowo pomagać w drodze ku spokojowi.',
    shareMessage: 'Wskazówki duchowe po stracie — AWA',
  },
  uk: {
    badge: 'ДУХОВНІ ОРІЄНТИРИ',
    title: 'Духовні орієнтири\nпісля втрати',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaEducational: 'Навчальний вміст',
    intro:
      'Кілька духовних орієнтирів, що допоможуть пережити втрату з м’якістю, терпінням і співчуттям.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText:
      'Цей вміст має навчальний характер. Конкретні релігійні питання слід перевіряти в кваліфікованого вченого. AWA не виносить персоналізованих фетв.',
    contentsTitle: 'У цій статті',
    topics: [
      'Визнане випробування',
      'Статус, що залежить від ситуації',
      'Терпіння та надія',
      'Кілька орієнтирів, як рухатися далі',
    ],
    section1H2: '1. Визнане випробування',
    section1Body1:
      'Втрата вагітності може бути глибоко болісним випробуванням. Смуток, мовчання, розгубленість або потреба відсторонитися — природні людські реакції.',
    section1Body2:
      'Відчуття цих емоцій не означає браку віри. Кожна жінка може переживати своє горе у власному темпі.',
    visual1Title: 'Прийняття своїх емоцій',
    visual1Body: 'Смуток • потреба у спокої • мовчання • підтримка',
    section2H2: '2. Статус, що може відрізнятися залежно від ситуації',
    section2Body1:
      'Після втрати релігійні положення можуть залежати від ситуації та характеру кровотечі.',
    section2Body2:
      'Зокрема, може бути потрібно розрізняти різні види кровотечі, перш ніж визначати, яких релігійних практик слід дотримуватися.',
    schemaTitle: 'Загальний принцип',
    schemaLabel1: 'Ситуація',
    schemaLabel2: 'Характер кровотечі',
    schemaLabel3: 'Відповідна вказівка',
    doubtTipTitle: 'У разі сумнівів',
    doubtTipText:
      'Особиста ситуація може потребувати іншої відповіді. Найкраще звернутися по пораду до кваліфікованої особи.',
    section3H2: '3. Терпіння та надія',
    section3Body1:
      'Терпіння (сабр) не означає не плакати чи не відчувати болю. Воно може просто супроводжувати шлях вірою й надією.',
    section3Body2:
      'Маленькі жести можуть допомогти поступово відновити відчуття спокою: прохання (дуа), мить зікру, духовне вислуховування або присутність близької людини.',
    spiritual1: 'Прохання (дуа)',
    spiritual2: 'Зікр',
    spiritual3: 'Підтримка',
    retainTipTitle: 'Пам’ятайте',
    retainTipText:
      'Зцілення потребує часу. Універсального темпу проходження втрати не існує.',
    section4H2: '4. Кілька орієнтирів, як рухатися далі',
    section4Body:
      'Не потрібно робити все одразу. Оберіть те, що відповідає вашим відчуттям і тому, що вам потрібно зараз.',
    gentleSteps: [
      'Дайте собі час пережити своє горе',
      'Оточіть себе дбайливими людьми',
      'Підтримуйте невеликі духовні практики, якщо вони приносять розраду',
      'Шукайте поради з будь-якого конкретного релігійного питання',
      'Шукайте підтримки, якщо горе стає надто важким',
    ],
    finalTitle: 'Шлях у власному темпі',
    finalText:
      'Дбайливе ставлення до себе, пошук підтримки та збереження надії можуть поступово допомогти знайти шлях до спокою.',
    shareMessage: 'Духовні орієнтири після втрати — AWA',
  },
  cs: {
    badge: 'DUCHOVNÍ VEDENÍ',
    title: 'Duchovní vedení\npo ztrátě',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaEducational: 'Vzdělávací obsah',
    intro:
      'Několik duchovních orientačních bodů, které vám pomohou projít ztrátou s jemností, trpělivostí a soucitem.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText:
      'Tento obsah je vzdělávací. Konkrétní náboženské otázky by se měly ověřit u kvalifikovaného učence. AWA nevydává osobní fatwy.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Uznané zkoušky',
      'Postavení závislé na situaci',
      'Trpělivost a naděje',
      'Několik orientačních bodů, jak jít dál',
    ],
    section1H2: '1. Uznaná zkouška',
    section1Body1:
      'Ztráta těhotenství může být hluboce bolestnou zkouškou. Smutek, mlčení, zmatek nebo potřeba odstoupit jsou přirozené lidské reakce.',
    section1Body2:
      'Prožívat tyto emoce neznamená nedostatek víry. Každá žena může svým smutkem procházet vlastním tempem.',
    visual1Title: 'Přijmout své emoce',
    visual1Body: 'Smutek • potřeba odpočinku • mlčení • podpora',
    section2H2: '2. Postavení, které se může lišit podle situace',
    section2Body1:
      'Po ztrátě mohou náboženská pravidla záviset na situaci a povaze krvácení.',
    section2Body2:
      'Zejména může být nutné rozlišit různé druhy krvácení, než se určí, jaké náboženské praktiky dodržovat.',
    schemaTitle: 'Obecný princip',
    schemaLabel1: 'Situace',
    schemaLabel2: 'Povaha krvácení',
    schemaLabel3: 'Vhodné vedení',
    doubtTipTitle: 'V případě pochybností',
    doubtTipText:
      'Osobní situace může vyžadovat jinou odpověď. Nejlepší je požádat o radu kvalifikovanou osobu.',
    section3H2: '3. Trpělivost a naděje',
    section3Body1:
      'Trpělivost (sabr) neznamená neplakat nebo necítit bolest. Může jednoduše provázet cestu s vírou a nadějí.',
    section3Body2:
      'Malá gesta mohou pomoci postupně obnovit pocit míru: prosba, chvíle dhikru, duchovní poslech nebo přítomnost milovaného člověka.',
    spiritual1: 'Prosba',
    spiritual2: 'Dhikr',
    spiritual3: 'Podpora',
    retainTipTitle: 'Mějte na paměti',
    retainTipText:
      'Uzdravování vyžaduje čas. Neexistuje univerzální tempo, jak projít ztrátou.',
    section4H2: '4. Několik orientačních bodů, jak jít dál',
    section4Body:
      'Není třeba dělat vše najednou. Vyberte si to, co odpovídá tomu, jak se cítíte a co právě potřebujete.',
    gentleSteps: [
      'Dopřejte si čas prožít svůj smutek',
      'Obklopte se lidmi, kteří vám přejí',
      'Udržujte malé duchovní praktiky, pokud vám přinášejí útěchu',
      'Požádejte o radu v jakékoli konkrétní náboženské otázce',
      'Vyhledejte podporu, pokud je smutek příliš těžké nést',
    ],
    finalTitle: 'Cesta vlastním tempem',
    finalText:
      'Pečovat o sebe, vyhledat podporu a držet se naděje vám může postupně pomoci nasměrovat cestu k míru.',
    shareMessage: 'Duchovní vedení po ztrátě — AWA',
  },
  sk: {
    badge: 'DUCHOVNÉ USMERNENIE',
    title: 'Duchovné usmernenie\npo strate',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaEducational: 'Vzdelávací obsah',
    intro:
      'Niekoľko duchovných orientačných bodov, ktoré vám pomôžu prejsť stratou s nežnosťou, trpezlivosťou a súcitom.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText:
      'Tento obsah je vzdelávací. Konkrétne náboženské otázky by sa mali overiť u kvalifikovaného učenca. AWA nevydáva individuálne fatwy.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Uznaná skúška',
      'Postavenie, ktoré závisí od situácie',
      'Trpezlivosť a nádej',
      'Niekoľko orientačných bodov na pokračovanie',
    ],
    section1H2: '1. Uznaná skúška',
    section1Body1:
      'Strata tehotenstva môže byť hlboko bolestivou skúškou. Smútok, ticho, zmätok alebo potreba stiahnuť sa sú prirodzenými ľudskými reakciami.',
    section1Body2:
      'Pociťovať tieto emócie neznamená nemať vieru. Každá žena môže svojím smútkom prechádzať vlastným tempom.',
    visual1Title: 'Prijať svoje emócie',
    visual1Body: 'Smútok • potreba odpočinku • ticho • podpora',
    section2H2: '2. Postavenie, ktoré sa môže líšiť podľa situácie',
    section2Body1:
      'Po strate môžu náboženské pravidlá závisieť od situácie a povahy krvácania.',
    section2Body2:
      'Najmä môže byť potrebné rozlíšiť rôzne druhy krvácania skôr, než sa určí, aké náboženské praktiky dodržiavať.',
    schemaTitle: 'Všeobecný princíp',
    schemaLabel1: 'Situácia',
    schemaLabel2: 'Povaha krvácania',
    schemaLabel3: 'Vhodné usmernenie',
    doubtTipTitle: 'V prípade pochybností',
    doubtTipText:
      'Osobná situácia si môže vyžadovať inú odpoveď. Najlepšie je poradiť sa s kvalifikovanou osobou.',
    section3H2: '3. Trpezlivosť a nádej',
    section3Body1:
      'Trpezlivosť (sabr) neznamená neplakať ani nepociťovať bolesť. Môže jednoducho sprevádzať cestu vierou a nádejou.',
    section3Body2:
      'Malé gestá môžu pomôcť postupne obnoviť pocit pokoja: prosba, chvíľa dhikru, duchovné počúvanie alebo prítomnosť blízkej osoby.',
    spiritual1: 'Prosba',
    spiritual2: 'Dhikr',
    spiritual3: 'Podpora',
    retainTipTitle: 'Pamätajte',
    retainTipText:
      'Uzdravovanie si vyžaduje čas. Neexistuje univerzálne tempo, ako prejsť stratou.',
    section4H2: '4. Niekoľko orientačných bodov na pokračovanie',
    section4Body:
      'Nie je potrebné robiť všetko naraz. Vyberte si to, čo zodpovedá tomu, ako sa cítite a čo práve potrebujete.',
    gentleSteps: [
      'Doprajte si čas prežiť svoj smútok',
      'Obklopte sa láskavými ľuďmi',
      'Udržiavajte malé duchovné praktiky, ak prinášajú útechu',
      'Pri konkrétnej náboženskej otázke vyhľadajte radu',
      'Vyhľadajte podporu, ak sa smútok stane príliš ťažkým',
    ],
    finalTitle: 'Cesta vlastným tempom',
    finalText:
      'Starostlivosť o seba, hľadanie podpory a udržiavanie nádeje môžu postupne pomôcť nasmerovať cestu k pokoju.',
    shareMessage: 'Duchovné usmernenie po strate — AWA',
  },
  hu: {
    badge: 'SPIRITUÁLIS ÚTMUTATÁS',
    title: 'Spirituális útmutatás\nveszteség után',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaEducational: 'Ismeretterjesztő tartalom',
    intro:
      'Néhány spirituális támpont, amely segít gyengédséggel, türelemmel és együttérzéssel átvészelni egy veszteséget.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText:
      'Ez a tartalom ismeretterjesztő. A konkrét vallási kérdéseket ellenőrizni kell egy kvalifikált tudóssal. Az AWA nem ad ki személyre szóló fatwákat.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Elismert megpróbáltatás',
      'A helyzettől függő státusz',
      'Türelem és remény',
      'Néhány támpont a továbbhaladáshoz',
    ],
    section1H2: '1. Elismert megpróbáltatás',
    section1Body1:
      'A terhesség elvesztése mélyen fájdalmas megpróbáltatás lehet. A szomorúság, a csend, a zavarodottság vagy a visszahúzódás igénye természetes emberi reakciók.',
    section1Body2:
      'Ezeknek az érzelmeknek az érzése nem jelenti a hit hiányát. Minden nő a saját tempójában élheti át a gyászát.',
    visual1Title: 'Az érzelmeid befogadása',
    visual1Body: 'Szomorúság • pihenési igény • csend • támogatás',
    section2H2: '2. A helyzettől függően változó státusz',
    section2Body1:
      'Veszteség után a vallási szabályok a helyzettől és a vérzés természetétől függhetnek.',
    section2Body2:
      'Különösen szükséges lehet különbséget tenni a vérzés különböző típusai között, mielőtt eldöntenéd, milyen vallási gyakorlatokat kövess.',
    schemaTitle: 'Az általános elv',
    schemaLabel1: 'Helyzet',
    schemaLabel2: 'A vérzés természete',
    schemaLabel3: 'Megfelelő útmutatás',
    doubtTipTitle: 'Kétség esetén',
    doubtTipText:
      'Egy személyes helyzet más választ igényelhet. A legjobb kvalifikált személytől tanácsot kérni.',
    section3H2: '3. Türelem és remény',
    section3Body1:
      'A türelem (szabr) nem azt jelenti, hogy nem sírsz vagy nem érzel fájdalmat. Egyszerűen kísérheti az utat hittel és reménnyel.',
    section3Body2:
      'Kis gesztusok segíthetnek fokozatosan visszaállítani a béke érzését: egy könyörgés, egy pillanatnyi dhikr, spirituális hallgatás vagy egy szerettünk jelenléte.',
    spiritual1: 'Könyörgés',
    spiritual2: 'Dhikr',
    spiritual3: 'Támogatás',
    retainTipTitle: 'Tartsd észben',
    retainTipText:
      'A gyógyulás időt igényel. Nincs univerzális tempó a veszteség átvészelésére.',
    section4H2: '4. Néhány támpont a továbbhaladáshoz',
    section4Body:
      'Nem kell mindent egyszerre megtenni. Válaszd azt, ami megfelel annak, ahogyan érzed magad, és annak, amire éppen szükséged van.',
    gentleSteps: [
      'Szánj időt a gyászod megélésére',
      'Vedd körül magad gondoskodó emberekkel',
      'Tartsd fenn az apró spirituális gyakorlatokat, ha vigaszt adnak',
      'Konkrét vallási kérdésben kérj tanácsot',
      'Keress támogatást, ha a gyász túl nehézzé válik',
    ],
    finalTitle: 'Út a saját tempódban',
    finalText:
      'A magadról való gondoskodás, a támogatás keresése és a remény megtartása fokozatosan segíthet a béke felé vezető utat irányítani.',
    shareMessage: 'Spirituális útmutatás veszteség után — AWA',
  },
  ro: {
    badge: 'ÎNDRUMARE SPIRITUALĂ',
    title: 'Îndrumare spirituală\ndupă o pierdere',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaEducational: 'Conținut educativ',
    intro:
      'Câteva repere de îndrumare spirituală care te pot ajuta să treci printr-o pierdere cu blândețe, răbdare și compasiune.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText:
      'Acest conținut este educativ. Întrebările religioase specifice trebuie verificate cu un savant calificat. AWA nu emite fatwa personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'O încercare recunoscută',
      'Un statut care depinde de situație',
      'Răbdarea și speranța',
      'Câteva repere pentru a merge mai departe',
    ],
    section1H2: '1. O încercare recunoscută',
    section1Body1:
      'O pierdere de sarcină poate fi o încercare profund dureroasă. Tristețea, tăcerea, confuzia sau nevoia de a te retrage sunt reacții umane firești.',
    section1Body2:
      'A simți aceste emoții nu înseamnă a lipsi de credință. Fiecare femeie își poate trece doliul în ritmul ei.',
    visual1Title: 'Primirea emoțiilor tale',
    visual1Body: 'Tristețe • nevoie de odihnă • tăcere • sprijin',
    section2H2: '2. Un statut care poate varia în funcție de situație',
    section2Body1:
      'După o pierdere, regulile religioase pot depinde de situație și de natura sângerării.',
    section2Body2:
      'În special, poate fi necesar să se facă distincția între diferite tipuri de sângerare înainte de a stabili ce practici religioase trebuie urmate.',
    schemaTitle: 'Principiul general',
    schemaLabel1: 'Situație',
    schemaLabel2: 'Natura sângerării',
    schemaLabel3: 'Îndrumare potrivită',
    doubtTipTitle: 'În caz de îndoială',
    doubtTipText:
      'O situație personală poate cere un răspuns diferit. Este mai bine să ceri sfatul unei persoane calificate.',
    section3H2: '3. Răbdarea și speranța',
    section3Body1:
      'Răbdarea (sabr) nu înseamnă a nu plânge sau a nu simți durere. Ea poate însoți pur și simplu parcursul cu credință și speranță.',
    section3Body2:
      'Mici gesturi pot ajuta la recăpătarea treptată a unui sentiment de pace: o rugăciune de cerere, un moment de dhikr, o ascultare spirituală sau prezența unei persoane dragi.',
    spiritual1: 'Rugăciune de cerere',
    spiritual2: 'Dhikr',
    spiritual3: 'Sprijin',
    retainTipTitle: 'De ținut minte',
    retainTipText:
      'Vindecarea necesită timp. Nu există un ritm universal pentru a trece printr-o pierdere.',
    section4H2: '4. Câteva repere pentru a merge mai departe',
    section4Body:
      'Nu e nevoie să faci totul dintr-odată. Alege ce corespunde cu felul în care te simți și cu ce ai nevoie acum.',
    gentleSteps: [
      'Ia-ți timp să-ți trăiești doliul',
      'Înconjoară-te de oameni binevoitori',
      'Păstrează mici practici spirituale dacă îți aduc alinare',
      'Cere sfatul pentru orice întrebare religioasă specifică',
      'Caută sprijin dacă doliul devine prea greu de purtat',
    ],
    finalTitle: 'Un drum în ritmul tău',
    finalText:
      'A avea grijă de tine, a căuta sprijin și a păstra speranța pot ajuta treptat să orientezi drumul spre pace.',
    shareMessage: 'Îndrumare spirituală după o pierdere — AWA',
  },
  bg: {
    badge: 'ДУХОВНИ НАСОКИ',
    title: 'Духовни насоки\nслед загуба',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaEducational: 'Образователно съдържание',
    intro:
      'Няколко духовни насоки, които да ти помогнат да преминеш през загубата с нежност, търпение и състрадание.',
    disclaimerTitle: 'Важна информация',
    disclaimerText:
      'Това съдържание е образователно. Конкретните религиозни въпроси трябва да се проверяват при квалифициран учен. AWA не издава персонализирани фетви.',
    contentsTitle: 'В тази статия',
    topics: [
      'Признато изпитание',
      'Статус, който зависи от ситуацията',
      'Търпение и надежда',
      'Няколко насоки за продължаване напред',
    ],
    section1H2: '1. Признато изпитание',
    section1Body1:
      'Загубата на бременност може да е дълбоко болезнено изпитание. Тъгата, мълчанието, объркването или нуждата да се отдръпнеш са естествени човешки реакции.',
    section1Body2:
      'Да изпитваш тези емоции не означава липса на вяра. Всяка жена може да преживее скръбта си със собствено темпо.',
    visual1Title: 'Приемане на емоциите ти',
    visual1Body: 'Тъга • нужда от почивка • мълчание • подкрепа',
    section2H2: '2. Статус, който може да варира според ситуацията',
    section2Body1:
      'След загуба религиозните правила могат да зависят от ситуацията и от естеството на кървенето.',
    section2Body2:
      'По-специално може да е нужно да се разграничат различните видове кървене, преди да се определи кои религиозни практики да се следват.',
    schemaTitle: 'Общият принцип',
    schemaLabel1: 'Ситуация',
    schemaLabel2: 'Естество на кървенето',
    schemaLabel3: 'Подходящи насоки',
    doubtTipTitle: 'При съмнение',
    doubtTipText:
      'Една лична ситуация може да изисква различен отговор. Най-добре е да потърсиш съвет от квалифициран човек.',
    section3H2: '3. Търпение и надежда',
    section3Body1:
      'Търпението (сабр) не означава да не плачеш или да не чувстваш болка. То може просто да съпровожда пътя с вяра и надежда.',
    section3Body2:
      'Малки жестове могат да помогнат постепенно да се възстанови усещането за покой: молба, момент на зикр, духовно слушане или присъствието на близък човек.',
    spiritual1: 'Молба',
    spiritual2: 'Зикр',
    spiritual3: 'Подкрепа',
    retainTipTitle: 'Помни',
    retainTipText:
      'Изцелението отнема време. Няма универсално темпо за преминаване през загуба.',
    section4H2: '4. Няколко насоки за продължаване напред',
    section4Body:
      'Не е нужно да правиш всичко наведнъж. Избери онова, което съответства на чувствата ти и на нуждите ти в момента.',
    gentleSteps: [
      'Дай си време да преживееш скръбта си',
      'Обградѝ се с грижовни хора',
      'Поддържай малки духовни практики, ако носят утеха',
      'Потърси съвет за всеки конкретен религиозен въпрос',
      'Потърси подкрепа, ако скръбта стане твърде тежка за носене',
    ],
    finalTitle: 'Път в твоето темпо',
    finalText:
      'Грижата за себе си, търсенето на подкрепа и запазването на надеждата могат постепенно да помогнат да се насочи пътят към покой.',
    shareMessage: 'Духовни насоки след загуба — AWA',
  },
  sr: {
    badge: 'ДУХОВНЕ СМЕРНИЦЕ',
    title: 'Духовне смернице\nпосле губитка',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaEducational: 'Образовни садржај',
    intro:
      'Неколико духовних смерница које ће ти помоћи да прођеш кроз губитак са нежношћу, стрпљењем и саосећањем.',
    disclaimerTitle: 'Важна информација',
    disclaimerText:
      'Овај садржај је образовни. Конкретна верска питања треба проверити код квалификованог учењака. AWA не издаје персонализоване фетве.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Призната тешкоћа',
      'Статус који зависи од ситуације',
      'Стрпљење и нада',
      'Неколико смерница за настављање',
    ],
    section1H2: '1. Призната тешкоћа',
    section1Body1:
      'Губитак трудноће може бити дубоко болно искушење. Туга, тишина, збуњеност или потреба да се повучеш су природне људске реакције.',
    section1Body2:
      'Осећање ових емоција не значи недостатак вере. Свака жена може проживљавати своју жалост својим темпом.',
    visual1Title: 'Прихватање својих емоција',
    visual1Body: 'Туга • потреба за одмором • тишина • подршка',
    section2H2: '2. Статус који може варирати зависно од ситуације',
    section2Body1:
      'После губитка верска правила могу зависити од ситуације и природе крварења.',
    section2Body2:
      'Нарочито, може бити потребно разликовати различите врсте крварења пре него што се одреди које верске праксе треба пратити.',
    schemaTitle: 'Општи принцип',
    schemaLabel1: 'Ситуација',
    schemaLabel2: 'Природа крварења',
    schemaLabel3: 'Одговарајуће смернице',
    doubtTipTitle: 'При сумњи',
    doubtTipText:
      'Лична ситуација може захтевати другачији одговор. Најбоље је потражити савет од квалификоване особе.',
    section3H2: '3. Стрпљење и нада',
    section3Body1:
      'Стрпљење (сабр) не значи не плакати или не осећати бол. Оно једноставно може пратити пут вером и надом.',
    section3Body2:
      'Мали гестови могу помоћи да се постепено врати осећај мира: молба, тренутак зикра, духовно слушање или присуство блиске особе.',
    spiritual1: 'Молба',
    spiritual2: 'Зикр',
    spiritual3: 'Подршка',
    retainTipTitle: 'Имај на уму',
    retainTipText:
      'Исцељење захтева време. Не постоји универзалан темпо за пролазак кроз губитак.',
    section4H2: '4. Неколико смерница за настављање',
    section4Body:
      'Не мораш све радити одједном. Изабери оно што одговара твојим осећањима и ономе што ти је сада потребно.',
    gentleSteps: [
      'Дај себи времена да проживиш своју жалост',
      'Окружи се брижним људима',
      'Одржавај мале духовне праксе ако доносе утеху',
      'Затражи савет за свако конкретно верско питање',
      'Потражи подршку ако жалост постане претешка за ношење',
    ],
    finalTitle: 'Пут у твом темпу',
    finalText:
      'Брига о себи, тражење подршке и задржавање наде могу постепено помоћи да се пут усмери ка миру.',
    shareMessage: 'Духовне смернице после губитка — AWA',
  },
  hr: {
    badge: 'DUHOVNO VODSTVO',
    title: 'Duhovno vodstvo\nnakon gubitka',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaEducational: 'Edukativni sadržaj',
    intro:
      'Nekoliko duhovnih smjernica koje ti mogu pomoći proći kroz gubitak s nježnošću, strpljenjem i suosjećanjem.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText:
      'Ovaj je sadržaj edukativan. Konkretna vjerska pitanja treba provjeriti kod kvalificiranog učenjaka. AWA ne izdaje osobne fetve.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Priznata kušnja',
      'Status koji ovisi o situaciji',
      'Strpljenje i nada',
      'Nekoliko smjernica za dalje',
    ],
    section1H2: '1. Priznata kušnja',
    section1Body1:
      'Gubitak trudnoće može biti duboko bolna kušnja. Tuga, šutnja, zbunjenost ili potreba za povlačenjem prirodne su ljudske reakcije.',
    section1Body2:
      'Osjećati te emocije ne znači nemati vjeru. Svaka žena može kroz svoju tugu proći vlastitim tempom.',
    visual1Title: 'Prihvaćanje svojih emocija',
    visual1Body: 'Tuga • potreba za odmorom • šutnja • podrška',
    section2H2: '2. Status koji se može razlikovati ovisno o situaciji',
    section2Body1:
      'Nakon gubitka vjerska pravila mogu ovisiti o situaciji i naravi krvarenja.',
    section2Body2:
      'Osobito može biti potrebno razlikovati različite vrste krvarenja prije nego što se utvrdi koje vjerske prakse slijediti.',
    schemaTitle: 'Opće načelo',
    schemaLabel1: 'Situacija',
    schemaLabel2: 'Narav krvarenja',
    schemaLabel3: 'Prikladno vodstvo',
    doubtTipTitle: 'U slučaju sumnje',
    doubtTipText:
      'Osobna situacija može zahtijevati drugačiji odgovor. Najbolje je zatražiti savjet kvalificirane osobe.',
    section3H2: '3. Strpljenje i nada',
    section3Body1:
      'Strpljenje (sabr) ne znači ne plakati ili ne osjećati bol. Može jednostavno pratiti put s vjerom i nadom.',
    section3Body2:
      'Male geste mogu pomoći postupno povratiti osjećaj mira: dova, trenutak zikra, duhovno slušanje ili prisutnost voljene osobe.',
    spiritual1: 'Dova',
    spiritual2: 'Zikr',
    spiritual3: 'Podrška',
    retainTipTitle: 'Imaj na umu',
    retainTipText:
      'Ozdravljenje traži vremena. Ne postoji univerzalan tempo za prolazak kroz gubitak.',
    section4H2: '4. Nekoliko smjernica za dalje',
    section4Body:
      'Nema potrebe sve učiniti odjednom. Odaberi ono što odgovara tvom osjećaju i onome što ti je sada potrebno.',
    gentleSteps: [
      'Uzmi vremena da proživiš svoju tugu',
      'Okruži se ljudima koji brinu o tebi',
      'Zadrži male duhovne prakse ako ti donose utjehu',
      'Zatraži savjet za svako konkretno vjersko pitanje',
      'Potraži podršku ako tuga postane preteška za nošenje',
    ],
    finalTitle: 'Put tvojim tempom',
    finalText:
      'Briga o sebi, traženje podrške i zadržavanje nade mogu postupno pomoći usmjeriti put prema miru.',
    shareMessage: 'Duhovno vodstvo nakon gubitka — AWA',
  },
  bs: {
    badge: 'DUHOVNO VODSTVO',
    title: 'Duhovno vodstvo\nnakon gubitka',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaEducational: 'Edukativni sadržaj',
    intro:
      'Nekoliko duhovnih smjernica koje ti mogu pomoći proći kroz gubitak s nježnošću, strpljenjem i suosjećanjem.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText:
      'Ovaj je sadržaj edukativan. Konkretna vjerska pitanja treba provjeriti kod kvalificiranog učenjaka. AWA ne izdaje osobne fetve.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Priznata kušnja',
      'Status koji ovisi o situaciji',
      'Strpljenje i nada',
      'Nekoliko smjernica za dalje',
    ],
    section1H2: '1. Priznata kušnja',
    section1Body1:
      'Gubitak trudnoće može biti duboko bolna kušnja. Tuga, šutnja, zbunjenost ili potreba za povlačenjem prirodne su ljudske reakcije.',
    section1Body2:
      'Osjećati te emocije ne znači nemati vjeru. Svaka žena može kroz svoju tugu proći vlastitim tempom.',
    visual1Title: 'Prihvaćanje svojih emocija',
    visual1Body: 'Tuga • potreba za odmorom • šutnja • podrška',
    section2H2: '2. Status koji se može razlikovati ovisno o situaciji',
    section2Body1:
      'Nakon gubitka vjerska pravila mogu ovisiti o situaciji i naravi krvarenja.',
    section2Body2:
      'Osobito može biti potrebno razlikovati različite vrste krvarenja prije nego što se utvrdi koje vjerske prakse slijediti.',
    schemaTitle: 'Opće načelo',
    schemaLabel1: 'Situacija',
    schemaLabel2: 'Narav krvarenja',
    schemaLabel3: 'Prikladno vodstvo',
    doubtTipTitle: 'U slučaju sumnje',
    doubtTipText:
      'Osobna situacija može zahtijevati drugačiji odgovor. Najbolje je zatražiti savjet kvalificirane osobe.',
    section3H2: '3. Strpljenje i nada',
    section3Body1:
      'Strpljenje (sabr) ne znači ne plakati ili ne osjećati bol. Može jednostavno pratiti put s vjerom i nadom.',
    section3Body2:
      'Male geste mogu pomoći postupno povratiti osjećaj mira: dova, trenutak zikra, duhovno slušanje ili prisutnost voljene osobe.',
    spiritual1: 'Dova',
    spiritual2: 'Zikr',
    spiritual3: 'Podrška',
    retainTipTitle: 'Imaj na umu',
    retainTipText:
      'Ozdravljenje traži vremena. Ne postoji univerzalan tempo za prolazak kroz gubitak.',
    section4H2: '4. Nekoliko smjernica za dalje',
    section4Body:
      'Nema potrebe sve učiniti odjednom. Odaberi ono što odgovara tvom osjećaju i onome što ti je sada potrebno.',
    gentleSteps: [
      'Uzmi vremena da proživiš svoju tugu',
      'Okruži se ljudima koji brinu o tebi',
      'Zadrži male duhovne prakse ako ti donose utjehu',
      'Zatraži savjet za svako konkretno vjersko pitanje',
      'Potraži podršku ako tuga postane preteška za nošenje',
    ],
    finalTitle: 'Put tvojim tempom',
    finalText:
      'Briga o sebi, traženje podrške i zadržavanje nade mogu postupno pomoći usmjeriti put prema miru.',
    shareMessage: 'Duhovno vodstvo nakon gubitka — AWA',
  },
  sl: {
    badge: 'DUHOVNO VODSTVO',
    title: 'Duhovno vodstvo\npo izgubi',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaEducational: 'Izobraževalna vsebina',
    intro:
      'Nekaj duhovnih smernic, ki ti lahko pomagajo prebroditi izgubo z nežnostjo, potrpežljivostjo in sočutjem.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText:
      'Ta vsebina je izobraževalna. Konkretna verska vprašanja je treba preveriti pri kvalificiranem učenjaku. AWA ne izdaja osebnih fetv.',
    contentsTitle: 'V tem članku',
    topics: [
      'Priznana preizkušnja',
      'Status, ki je odvisen od situacije',
      'Potrpežljivost in upanje',
      'Nekaj smernic za naprej',
    ],
    section1H2: '1. Priznana preizkušnja',
    section1Body1:
      'Izguba nosečnosti je lahko globoko boleča preizkušnja. Žalost, molk, zmedenost ali potreba po umiku so naravne človeške reakcije.',
    section1Body2:
      'Čutiti ta čustva ne pomeni nimati vere. Vsaka ženska lahko prehaja skozi svojo žalost v svojem tempu.',
    visual1Title: 'Sprejemanje svojih čustev',
    visual1Body: 'Žalost • potreba po počitku • molk • podpora',
    section2H2: '2. Status, ki se lahko razlikuje glede na situacijo',
    section2Body1:
      'Po izgubi so lahko verska pravila odvisna od situacije in narave krvavitve.',
    section2Body2:
      'Zlasti je morda treba razlikovati različne vrste krvavitve, preden se ugotovi, katerim verskim praksam slediti.',
    schemaTitle: 'Splošno načelo',
    schemaLabel1: 'Situacija',
    schemaLabel2: 'Narava krvavitve',
    schemaLabel3: 'Primerno vodstvo',
    doubtTipTitle: 'V primeru dvoma',
    doubtTipText:
      'Osebna situacija lahko zahteva drugačen odgovor. Najbolje je poiskati nasvet kvalificirane osebe.',
    section3H2: '3. Potrpežljivost in upanje',
    section3Body1:
      'Potrpežljivost (sabr) ne pomeni ne jokati ali ne čutiti bolečine. Lahko preprosto spremlja pot z vero in upanjem.',
    section3Body2:
      'Majhne geste lahko pomagajo postopoma povrniti občutek miru: dova, trenutek zikra, duhovno poslušanje ali prisotnost ljubljene osebe.',
    spiritual1: 'Dova',
    spiritual2: 'Zikr',
    spiritual3: 'Podpora',
    retainTipTitle: 'Imej v mislih',
    retainTipText:
      'Celjenje zahteva čas. Ne obstaja univerzalen tempo za prebroditev izgube.',
    section4H2: '4. Nekaj smernic za naprej',
    section4Body:
      'Ni treba vsega narediti naenkrat. Izberi to, kar ustreza tvojemu počutju in temu, kar ti je zdaj potrebno.',
    gentleSteps: [
      'Vzemi si čas, da prebiješ svojo žalost',
      'Obkroži se z ljudmi, ki skrbijo zate',
      'Ohrani majhne duhovne prakse, če ti prinašajo tolažbo',
      'Poišči nasvet za vsako konkretno versko vprašanje',
      'Poišči podporo, če žalost postane pretežka za nošenje',
    ],
    finalTitle: 'Pot v tvojem tempu',
    finalText:
      'Skrb zase, iskanje podpore in ohranjanje upanja lahko postopoma pomagajo usmeriti pot proti miru.',
    shareMessage: 'Duhovno vodstvo po izgubi — AWA',
  },
  ne: {
    badge: 'आध्यात्मिक मार्गदर्शन',
    title: 'क्षतिपछि आध्यात्मिक\nमार्गदर्शन',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaEducational: 'शैक्षिक सामग्री',
    intro:
      'कोमलता, धैर्य र करुणाका साथ क्षतिबाट गुज्रन तपाईंलाई मद्दत गर्ने केही आध्यात्मिक मार्गदर्शनका बुँदाहरू।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText:
      'यो सामग्री शैक्षिक हो। विशेष धार्मिक प्रश्नहरू योग्य विद्वानसँग प्रमाणित गराउनुपर्छ। AWA ले व्यक्तिगत फतवा जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'एउटा मान्यता प्राप्त परीक्षा',
      'अवस्थामा निर्भर हुने हैसियत',
      'धैर्य र आशा',
      'अघि बढ्न केही मार्गदर्शनका बुँदाहरू',
    ],
    section1H2: '1. एउटा मान्यता प्राप्त परीक्षा',
    section1Body1:
      'गर्भको क्षति गहिरो पीडादायी परीक्षा हुन सक्छ। उदासी, मौनता, भ्रम, वा पछाडि हट्नुपर्ने आवश्यकता स्वाभाविक मानवीय प्रतिक्रिया हुन्।',
    section1Body2:
      'यी भावनाहरू महसुस गर्नुको अर्थ आस्थाको कमी हो भन्ने होइन। हरेक महिलाले आफ्नो शोक आफ्नै गतिमा पार गर्न सक्छिन्।',
    visual1Title: 'आफ्ना भावनाहरूलाई स्वागत गर्ने',
    visual1Body: 'उदासी • आरामको आवश्यकता • मौनता • साथ',
    section2H2: '2. अवस्थाअनुसार फरक हुन सक्ने हैसियत',
    section2Body1:
      'क्षतिपछि, धार्मिक नियमहरू अवस्था र रक्तस्रावको प्रकृतिमा निर्भर हुन सक्छन्।',
    section2Body2:
      'विशेष गरी, कुन धार्मिक अभ्यासहरू पछ्याउने निर्धारण गर्नुअघि विभिन्न प्रकारका रक्तस्रावबीच भिन्नता छुट्ट्याउन आवश्यक हुन सक्छ।',
    schemaTitle: 'सामान्य सिद्धान्त',
    schemaLabel1: 'अवस्था',
    schemaLabel2: 'रक्तस्रावको प्रकृति',
    schemaLabel3: 'उपयुक्त मार्गदर्शन',
    doubtTipTitle: 'शङ्का भएमा',
    doubtTipText:
      'व्यक्तिगत अवस्थाले फरक उत्तर चाहिन सक्छ। योग्य व्यक्तिसँग सल्लाह लिनु उत्तम हुन्छ।',
    section3H2: '3. धैर्य र आशा',
    section3Body1:
      'धैर्य (सब्र) को अर्थ नरुनु वा पीडा महसुस नगर्नु होइन। यसले केवल आस्था र आशासहित यात्रामा साथ दिन सक्छ।',
    section3Body2:
      'साना कार्यहरूले बिस्तारै शान्तिको अनुभूति फिर्ता ल्याउन मद्दत गर्न सक्छन्: एउटा दुआ, जिक्रको एक क्षण, आध्यात्मिक सुनाइ, वा कुनै प्रियजनको उपस्थिति।',
    spiritual1: 'दुआ',
    spiritual2: 'जिक्र',
    spiritual3: 'साथ',
    retainTipTitle: 'मनमा राख्नुहोस्',
    retainTipText:
      'निको हुन समय लाग्छ। क्षतिबाट गुज्रने कुनै सार्वभौम गति हुँदैन।',
    section4H2: '4. अघि बढ्न केही मार्गदर्शनका बुँदाहरू',
    section4Body:
      'सबै कुरा एकै पटक गर्नु पर्दैन। तपाईंलाई कस्तो लाग्छ र अहिले तपाईंलाई के चाहिन्छ त्यससँग मिल्ने कुरा छान्नुहोस्।',
    gentleSteps: [
      'आफ्नो शोक जिउन समय लिनुहोस्',
      'आफूलाई हेरचाह गर्ने मानिसले घेर्नुहोस्',
      'आराम दिन्छन् भने साना आध्यात्मिक अभ्यासहरू जारी राख्नुहोस्',
      'कुनै विशेष धार्मिक प्रश्नका लागि सल्लाह लिनुहोस्',
      'शोक बोक्न निकै गाह्रो भएमा साथ खोज्नुहोस्',
    ],
    finalTitle: 'आफ्नै गतिको बाटो',
    finalText:
      'आफ्नो ख्याल राख्नु, साथ खोज्नु, र आशा समातिराख्नुले बिस्तारै शान्तितर्फको बाटो निर्देशित गर्न मद्दत गर्न सक्छ।',
    shareMessage: 'क्षतिपछि आध्यात्मिक मार्गदर्शन — AWA',
  },
  si: {
    badge: 'ආධ්‍යාත්මික මඟපෙන්වීම',
    title: 'අහිමිවීමකින් පසු\nආධ්‍යාත්මික මඟපෙන්වීම',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaEducational: 'අධ්‍යාපනික අන්තර්ගතය',
    intro:
      'මෘදුකමින්, ඉවසීමෙන් සහ අනුකම්පාවෙන් අහිමිවීමක් හරහා ගමන් කිරීමට ඔබට උපකාරී වන ආධ්‍යාත්මික මඟපෙන්වීම් කරුණු කිහිපයක්.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText:
      'මෙම අන්තර්ගතය අධ්‍යාපනික වේ. නිශ්චිත ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතෙකු සමඟ තහවුරු කළ යුතුයි. AWA පුද්ගලීකරණය කළ ෆත්වා නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පිළිගත් පරීක්ෂණයක්',
      'තත්ත්වය මත රඳා පවතින තත්ත්වයක්',
      'ඉවසීම සහ බලාපොරොත්තුව',
      'ඉදිරියට යාමට මඟපෙන්වීම් කරුණු කිහිපයක්',
    ],
    section1H2: '1. පිළිගත් පරීක්ෂණයක්',
    section1Body1:
      'ගර්භණී අහිමිවීමක් ගැඹුරු වේදනාකාරී පරීක්ෂණයක් විය හැක. දුක, නිහඬ බව, ව්‍යාකූලත්වය, හෝ පසුබසින අවශ්‍යතාව ස්වාභාවික මිනිස් ප්‍රතික්‍රියා වේ.',
    section1Body2:
      'මෙම හැඟීම් දැනීම ඇදහිල්ල නොමැතිකම අදහස් නොවේ. සෑම කාන්තාවකටම ඇයගේ වියෝව ඇයගේම වේගයෙන් හරහා ගමන් කළ හැක.',
    visual1Title: 'ඔබේ හැඟීම් පිළිගැනීම',
    visual1Body: 'දුක • විවේකයේ අවශ්‍යතාව • නිහඬ බව • සහාය',
    section2H2: '2. තත්ත්වය අනුව වෙනස් විය හැකි තත්ත්වයක්',
    section2Body1:
      'අහිමිවීමකින් පසු, ආගමික රීති තත්ත්වය සහ ලේ ගැලීමේ ස්වභාවය මත රඳා පැවතිය හැක.',
    section2Body2:
      'විශේෂයෙන්, කුමන ආගමික පුරුදු අනුගමනය කළ යුතුදැයි තීරණය කිරීමට පෙර විවිධ ලේ ගැලීම් වර්ග වෙන්කර හඳුනාගැනීම අවශ්‍ය විය හැක.',
    schemaTitle: 'පොදු මූලධර්මය',
    schemaLabel1: 'තත්ත්වය',
    schemaLabel2: 'ලේ ගැලීමේ ස්වභාවය',
    schemaLabel3: 'සුදුසු මඟපෙන්වීම',
    doubtTipTitle: 'සැකයක් ඇත්නම්',
    doubtTipText:
      'පෞද්ගලික තත්ත්වයකට වෙනස් පිළිතුරක් අවශ්‍ය විය හැක. සුදුසුකම් ලත් අයෙකුගෙන් උපදෙස් ලබා ගැනීම වඩා හොඳයි.',
    section3H2: '3. ඉවසීම සහ බලාපොරොත්තුව',
    section3Body1:
      'ඉවසීම (සබ්ර්) යනු නොඅඬා සිටීම හෝ වේදනාව නොදැනීම අදහස් නොවේ. එයට ගමන ඇදහිල්ලෙන් සහ බලාපොරොත්තුවෙන් සරලව සමඟ ගමන් කළ හැක.',
    section3Body2:
      'කුඩා ක්‍රියා ක්‍රමයෙන් සාමයක් නැවත ලබා දීමට උපකාරී විය හැක: ප්‍රාර්ථනාවක්, ධික්ර්හි මොහොතක්, ආධ්‍යාත්මික සවන් දීමක්, හෝ ආදරණීයයෙකුගේ පැමිණීම.',
    spiritual1: 'ප්‍රාර්ථනාව',
    spiritual2: 'ධික්ර්',
    spiritual3: 'සහාය',
    retainTipTitle: 'මතක තබාගන්න',
    retainTipText:
      'සුවය ලැබීමට කාලය ගතවේ. අහිමිවීමක් හරහා ගමන් කිරීමට විශ්වීය වේගයක් නැත.',
    section4H2: '4. ඉදිරියට යාමට මඟපෙන්වීම් කරුණු කිහිපයක්',
    section4Body:
      'සියල්ල එකවර කිරීමට අවශ්‍ය නැත. ඔබට දැනෙන ආකාරයට සහ දැන් ඔබට අවශ්‍ය දේට ගැළපෙන දේ තෝරන්න.',
    gentleSteps: [
      'ඔබේ වියෝව අත්විඳීමට කාලය ගන්න',
      'ඔබව සැලකිලිමත් අයගෙන් වටකර ගන්න',
      'ඒවා සැනසිල්ලක් ගෙන දෙන්නේ නම් කුඩා ආධ්‍යාත්මික පුරුදු දිගටම කරගෙන යන්න',
      'ඕනෑම නිශ්චිත ආගමික ප්‍රශ්නයක් සඳහා උපදෙස් ඉල්ලන්න',
      'වියෝව දරාගැනීමට අපහසු වුවහොත් සහාය ඉල්ලන්න',
    ],
    finalTitle: 'ඔබේම වේගයෙන් මාර්ගයක්',
    finalText:
      'ඔබ ගැන සැලකිලිමත් වීම, සහාය ලබා ගැනීම සහ බලාපොරොත්තුව ඇල්ලීම සාමය දෙසට මාර්ගය මඟ පෙන්වීමට ක්‍රමයෙන් උපකාරී විය හැක.',
    shareMessage: 'අහිමිවීමකින් පසු ආධ්‍යාත්මික මඟපෙන්වීම — AWA',
  },
  th: {
    badge: 'คำแนะนำทางจิตวิญญาณ',
    title: 'คำแนะนำทางจิตวิญญาณ\nหลังการสูญเสีย',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaEducational: 'เนื้อหาเพื่อการเรียนรู้',
    intro:
      'แนวทางทางจิตวิญญาณไม่กี่ข้อเพื่อช่วยให้คุณผ่านการสูญเสียด้วยความอ่อนโยน ความอดทน และความเมตตา',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText:
      'เนื้อหานี้เพื่อการเรียนรู้ คำถามทางศาสนาเฉพาะควรตรวจสอบกับผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การทดสอบที่ได้รับการยอมรับ',
      'สถานะที่ขึ้นอยู่กับสถานการณ์',
      'ความอดทนและความหวัง',
      'แนวทางบางข้อสำหรับก้าวต่อไป',
    ],
    section1H2: '1. การทดสอบที่ได้รับการยอมรับ',
    section1Body1:
      'การสูญเสียการตั้งครรภ์อาจเป็นการทดสอบที่เจ็บปวดอย่างลึกซึ้ง ความเศร้า ความเงียบ ความสับสน หรือความต้องการถอยห่าง เป็นปฏิกิริยาตามธรรมชาติของมนุษย์',
    section1Body2:
      'การรู้สึกอารมณ์เหล่านี้ไม่ได้หมายความว่าขาดศรัทธา ผู้หญิงแต่ละคนผ่านความโศกเศร้าได้ตามจังหวะของตัวเอง',
    visual1Title: 'ต้อนรับอารมณ์ของคุณ',
    visual1Body: 'ความเศร้า • ความต้องการพักผ่อน • ความเงียบ • การสนับสนุน',
    section2H2: '2. สถานะที่อาจแตกต่างกันตามสถานการณ์',
    section2Body1:
      'หลังการสูญเสีย กฎทางศาสนาอาจขึ้นอยู่กับสถานการณ์และลักษณะของเลือดที่ออก',
    section2Body2:
      'โดยเฉพาะอาจต้องแยกประเภทของเลือดที่ออกก่อนกำหนดว่าจะปฏิบัติศาสนกิจอย่างไร',
    schemaTitle: 'หลักการทั่วไป',
    schemaLabel1: 'สถานการณ์',
    schemaLabel2: 'ลักษณะของเลือดที่ออก',
    schemaLabel3: 'คำแนะนำที่เหมาะสม',
    doubtTipTitle: 'เมื่อสงสัย',
    doubtTipText:
      'สถานการณ์ส่วนตัวอาจต้องการคำตอบที่ต่างออกไป ควรขอคำแนะนำจากผู้มีคุณวุฒิ',
    section3H2: '3. ความอดทนและความหวัง',
    section3Body1:
      'ความอดทน (ศอบร์) ไม่ได้หมายถึงการไม่ร้องไห้หรือไม่รู้สึกเจ็บปวด แต่เป็นการเคียงข้างการเดินทางด้วยศรัทธาและความหวัง',
    section3Body2:
      'การกระทำเล็ก ๆ ช่วยฟื้นความรู้สึกสงบทีละน้อยได้: การวิงวอน ช่วงเวลาของซิกร์ การฟังเรื่องจิตวิญญาณ หรือการอยู่เคียงข้างของคนที่รัก',
    spiritual1: 'การวิงวอน',
    spiritual2: 'ซิกร์',
    spiritual3: 'การสนับสนุน',
    retainTipTitle: 'โปรดจำไว้',
    retainTipText:
      'การเยียวยาต้องใช้เวลา ไม่มีจังหวะสากลในการผ่านการสูญเสีย',
    section4H2: '4. แนวทางบางข้อสำหรับก้าวต่อไป',
    section4Body:
      'ไม่จำเป็นต้องทำทุกอย่างพร้อมกัน เลือกสิ่งที่ตรงกับความรู้สึกและสิ่งที่คุณต้องการในตอนนี้',
    gentleSteps: [
      'ใช้เวลาผ่านความโศกเศร้าของคุณ',
      'อยู่ท่ามกลางคนที่ใส่ใจ',
      'รักษาการปฏิบัติทางจิตวิญญาณเล็ก ๆ ไว้หากช่วยให้สบายใจ',
      'ขอคำแนะนำสำหรับคำถามทางศาสนาเฉพาะใด ๆ',
      'ขอการสนับสนุนหากความโศกเศร้าหนักเกินจะแบก',
    ],
    finalTitle: 'เส้นทางตามจังหวะของคุณ',
    finalText:
      'การดูแลตัวเอง การขอการสนับสนุน และการยึดมั่นในความหวัง ค่อย ๆ ช่วยนำทางสู่ความสงบได้',
    shareMessage: 'คำแนะนำทางจิตวิญญาณหลังการสูญเสีย — AWA',
  },
  vi: {
    badge: 'ĐỊNH HƯỚNG TÂM LINH',
    title: 'Định hướng tâm linh\nsau một mất mát',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaEducational: 'Nội dung giáo dục',
    intro:
      'Một vài điểm định hướng tâm linh giúp bạn vượt qua mất mát với sự dịu dàng, kiên nhẫn và lòng trắc ẩn.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText:
      'Nội dung này mang tính giáo dục. Các vấn đề tôn giáo cụ thể nên được xác minh với một học giả có thẩm quyền. AWA không đưa ra fatwa cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Một thử thách được công nhận',
      'Một tình trạng phụ thuộc vào hoàn cảnh',
      'Sự kiên nhẫn và hy vọng',
      'Một vài điểm định hướng để tiến bước',
    ],
    section1H2: '1. Một thử thách được công nhận',
    section1Body1:
      'Mất thai có thể là một thử thách vô cùng đau đớn. Nỗi buồn, sự im lặng, sự bối rối hoặc nhu cầu lùi lại là những phản ứng tự nhiên của con người.',
    section1Body2:
      'Cảm thấy những cảm xúc này không có nghĩa là thiếu đức tin. Mỗi phụ nữ có thể trải qua nỗi đau mất mát theo nhịp độ riêng của mình.',
    visual1Title: 'Đón nhận cảm xúc của bạn',
    visual1Body: 'Nỗi buồn • nhu cầu nghỉ ngơi • sự im lặng • sự hỗ trợ',
    section2H2: '2. Một tình trạng có thể khác nhau tùy hoàn cảnh',
    section2Body1:
      'Sau một mất mát, các quy định tôn giáo có thể phụ thuộc vào hoàn cảnh và bản chất của việc ra máu.',
    section2Body2:
      'Đặc biệt, có thể cần phân biệt các loại ra máu khác nhau trước khi xác định nên theo những thực hành tôn giáo nào.',
    schemaTitle: 'Nguyên tắc chung',
    schemaLabel1: 'Hoàn cảnh',
    schemaLabel2: 'Bản chất của việc ra máu',
    schemaLabel3: 'Hướng dẫn phù hợp',
    doubtTipTitle: 'Khi nghi ngờ',
    doubtTipText:
      'Một hoàn cảnh cá nhân có thể cần một câu trả lời khác. Tốt nhất nên tìm lời khuyên từ người có chuyên môn.',
    section3H2: '3. Sự kiên nhẫn và hy vọng',
    section3Body1:
      'Kiên nhẫn (sabr) không có nghĩa là không khóc hay không cảm thấy đau. Nó có thể chỉ đơn giản đồng hành cùng hành trình với đức tin và hy vọng.',
    section3Body2:
      'Những cử chỉ nhỏ có thể giúp dần lấy lại cảm giác bình yên: một lời cầu khẩn, một khoảnh khắc dhikr, lắng nghe tâm linh hoặc sự hiện diện của người thân.',
    spiritual1: 'Lời cầu khẩn',
    spiritual2: 'Dhikr',
    spiritual3: 'Sự hỗ trợ',
    retainTipTitle: 'Hãy ghi nhớ',
    retainTipText:
      'Chữa lành cần thời gian. Không có nhịp độ phổ quát để vượt qua một mất mát.',
    section4H2: '4. Một vài điểm định hướng để tiến bước',
    section4Body:
      'Không cần làm mọi thứ cùng một lúc. Hãy chọn điều phù hợp với cảm nhận và nhu cầu của bạn lúc này.',
    gentleSteps: [
      'Dành thời gian sống trọn nỗi đau mất mát của bạn',
      'Ở bên những người quan tâm đến bạn',
      'Duy trì những thực hành tâm linh nhỏ nếu chúng mang lại sự an ủi',
      'Tìm lời khuyên cho bất kỳ câu hỏi tôn giáo cụ thể nào',
      'Tìm sự hỗ trợ nếu nỗi đau mất mát trở nên quá khó mang',
    ],
    finalTitle: 'Một con đường theo nhịp của bạn',
    finalText:
      'Chăm sóc bản thân, tìm sự hỗ trợ và giữ vững hy vọng có thể dần giúp dẫn lối đến sự bình yên.',
    shareMessage: 'Định hướng tâm linh sau một mất mát — AWA',
  },
  uz: {
    badge: 'MAʼNAVIY YOʻL-YOʻRIQ',
    title: 'Yoʻqotishdan keyingi\nmaʼnaviy yoʻl-yoʻriq',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaEducational: 'Taʼlimiy kontent',
    intro:
      'Yoʻqotishni muloyimlik, sabr va mehr bilan boshdan kechirishga yordam beradigan bir nechta maʼnaviy yoʻl-yoʻriq nuqtasi.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText:
      'Bu kontent taʼlimiy. Muayyan diniy savollarni malakali olim bilan tekshirish kerak. AWA shaxsiy fatvo chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Tan olingan sinov',
      'Vaziyatga bogʻliq holat',
      'Sabr va umid',
      'Oldinga siljish uchun bir nechta yoʻl-yoʻriq nuqtasi',
    ],
    section1H2: '1. Tan olingan sinov',
    section1Body1:
      'Homila yoʻqotilishi chuqur ogʻriqli sinov boʻlishi mumkin. Qaygʻu, sukunat, sarosima yoki chekinishga ehtiyoj — tabiiy insoniy reaksiyalar.',
    section1Body2:
      'Bu hissiyotlarni his qilish imon yetishmasligini anglatmaydi. Har bir ayol qaygʻusini oʻz surʼatida boshdan kechirishi mumkin.',
    visual1Title: 'Hissiyotlaringizni qabul qilish',
    visual1Body: 'Qaygʻu • dam olishga ehtiyoj • sukunat • qoʻllab-quvvatlash',
    section2H2: '2. Vaziyatga qarab farq qilishi mumkin boʻlgan holat',
    section2Body1:
      'Yoʻqotishdan keyin diniy qoidalar vaziyatga va qon ketishining xususiyatiga bogʻliq boʻlishi mumkin.',
    section2Body2:
      'Xususan, qaysi diniy amallarga amal qilishni aniqlashdan oldin qon ketishining turli turlarini farqlash zarur boʻlishi mumkin.',
    schemaTitle: 'Umumiy tamoyil',
    schemaLabel1: 'Vaziyat',
    schemaLabel2: 'Qon ketishining xususiyati',
    schemaLabel3: 'Mos yoʻl-yoʻriq',
    doubtTipTitle: 'Shubha boʻlsa',
    doubtTipText:
      'Shaxsiy vaziyat boshqacha javobni talab qilishi mumkin. Malakali shaxsdan maslahat olgan maʼqul.',
    section3H2: '3. Sabr va umid',
    section3Body1:
      'Sabr yigʻlamaslik yoki ogʻriqni his qilmaslikni anglatmaydi. U shunchaki yoʻlga imon va umid bilan hamroh boʻlishi mumkin.',
    section3Body2:
      'Kichik amallar xotirjamlik hissini asta-sekin tiklashga yordam berishi mumkin: duo, zikr lahzasi, maʼnaviy tinglash yoki yaqin kishining mavjudligi.',
    spiritual1: 'Duo',
    spiritual2: 'Zikr',
    spiritual3: 'Qoʻllab-quvvatlash',
    retainTipTitle: 'Esda tuting',
    retainTipText:
      'Tuzalish vaqt oladi. Yoʻqotishni boshdan kechirishning universal surʼati yoʻq.',
    section4H2: '4. Oldinga siljish uchun bir nechta yoʻl-yoʻriq nuqtasi',
    section4Body:
      'Hammasini bir vaqtda qilish shart emas. Hozir his-tuygʻuingiz va ehtiyojingizga mos keladiganini tanlang.',
    gentleSteps: [
      'Qaygʻuingizni boshdan kechirish uchun vaqt ajrating',
      'Oʻzingizni gʻamxoʻr odamlar bilan oʻrang',
      'Tasalli bersa, kichik maʼnaviy amaliyotlarni davom ettiring',
      'Har qanday maxsus diniy savol uchun maslahat soʻrang',
      'Agar qaygʻuni koʻtarish juda qiyin boʻlib qolsa, yordam soʻrang',
    ],
    finalTitle: 'Oʻz surʼatingizdagi yoʻl',
    finalText:
      'Oʻzingizga gʻamxoʻrlik qilish, yordam soʻrash va umidni saqlash tinchlikka yoʻlni asta-sekin yoʻnaltirishga yordam beradi.',
    shareMessage: 'Yoʻqotishdan keyingi maʼnaviy yoʻl-yoʻriq — AWA',
  },
  az: {
    badge: 'MƏNƏVİ İSTİQAMƏTLƏNDİRMƏ',
    title: 'İtkidən sonra\nmənəvi istiqamətləndirmə',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaEducational: 'Təhsil məzmunu',
    intro:
      'İtkini mülayimlik, səbir və şəfqətlə keçməyə kömək edən bir neçə mənəvi istiqamətləndirmə məqamı.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText:
      'Bu məzmun təhsil xarakterlidir. Konkret dini suallar səlahiyyətli alimlə yoxlanılmalıdır. AWA fərdi fətvalar vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Tanınan imtahan',
      'Vəziyyətdən asılı olan status',
      'Səbir və ümid',
      'İrəliləmək üçün bir neçə istiqamətləndirmə məqamı',
    ],
    section1H2: '1. Tanınan imtahan',
    section1Body1:
      'Hamiləlik itkisi dərin ağrılı imtahan ola bilər. Kədər, sükut, çaşqınlıq və ya kənara çəkilmək ehtiyacı təbii insani reaksiyalardır.',
    section1Body2:
      'Bu emosiyaları hiss etmək imanın çatışmazlığı demək deyil. Hər qadın yasını öz tempi ilə keçə bilər.',
    visual1Title: 'Emosiyalarınızı qəbul etmək',
    visual1Body: 'Kədər • istirahətə ehtiyac • sükut • dəstək',
    section2H2: '2. Vəziyyətdən asılı olaraq dəyişə bilən status',
    section2Body1:
      'İtkidən sonra dini qaydalar vəziyyətdən və qanaxmanın xarakterindən asılı ola bilər.',
    section2Body2:
      'Xüsusilə, hansı dini təcrübələrə əməl etməli olduğunuzu müəyyən etməzdən əvvəl müxtəlif qanaxma növlərini ayırd etmək lazım ola bilər.',
    schemaTitle: 'Ümumi prinsip',
    schemaLabel1: 'Vəziyyət',
    schemaLabel2: 'Qanaxmanın xarakteri',
    schemaLabel3: 'Uyğun istiqamətləndirmə',
    doubtTipTitle: 'Şübhə olarsa',
    doubtTipText:
      'Şəxsi vəziyyət fərqli cavab tələb edə bilər. Səlahiyyətli şəxsdən məsləhət almaq daha yaxşıdır.',
    section3H2: '3. Səbir və ümid',
    section3Body1:
      'Səbir ağlamamaq və ya ağrı hiss etməmək demək deyil. O, sadəcə yolu iman və ümidlə müşayiət edə bilər.',
    section3Body2:
      'Kiçik jestlər sakitlik hissini tədricən bərpa etməyə kömək edə bilər: dua, zikr anı, mənəvi dinləmə və ya sevdiklərinizin yanınızda olması.',
    spiritual1: 'Dua',
    spiritual2: 'Zikr',
    spiritual3: 'Dəstək',
    retainTipTitle: 'Yadda saxlayın',
    retainTipText:
      'Şəfa vaxt aparır. İtkini keçməyin universal tempi yoxdur.',
    section4H2: '4. İrəliləmək üçün bir neçə istiqamətləndirmə məqamı',
    section4Body:
      'Hər şeyi bir anda etməyə ehtiyac yoxdur. Hiss etdiyinizə və hazırda ehtiyacınıza uyğun olanı seçin.',
    gentleSteps: [
      'Yasınızı yaşamağa vaxt ayırın',
      'Özünüzü qayğıkeş insanlarla əhatə edin',
      'Rahatlıq gətirirlərsə, kiçik mənəvi təcrübələri saxlayın',
      'Hər hansı konkret dini sual üçün məsləhət alın',
      'Yas daşımaq çətinləşərsə, dəstək axtarın',
    ],
    finalTitle: 'Öz tempinizlə yol',
    finalText:
      'Özünüzə qulluq etmək, dəstək axtarmaq və ümidi saxlamaq sülh yoluna tədricən yön verməyə kömək edə bilər.',
    shareMessage: 'İtkidən sonra mənəvi istiqamətləndirmə — AWA',
  },
  ka: {
    badge: 'სულიერი მითითებები',
    title: 'სულიერი მითითებები\nდაკარგვის შემდეგ',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaEducational: 'საგანმანათლებლო შინაარსი',
    intro:
      'რამდენიმე სულიერი მინიშნება, რომ დაკარგვა სინაზით, მოთმინებითა და თანაგრძნობით გაიაროთ.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText:
      'ეს შინაარსი საგანმანათლებლოა. კონკრეტული რელიგიური საკითხები კვალიფიციურ მეცნიერთან უნდა გადამოწმდეს. AWA არ გასცემს პერსონალიზებულ ფეტვებს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'აღიარებული გამოცდა',
      'სტატუსი, რომელიც სიტუაციაზეა დამოკიდებული',
      'მოთმინება და იმედი',
      'რამდენიმე მინიშნება წინსვლისთვის',
    ],
    section1H2: '1. აღიარებული გამოცდა',
    section1Body1:
      'ორსულობის დაკარგვა შეიძლება ღრმად მტკივნეული გამოცდა იყოს. სევდა, სიჩუმე, დაბნეულობა ან უკან გადგომის საჭიროება ბუნებრივი ადამიანური რეაქციებია.',
    section1Body2:
      'ამ ემოციების განცდა არ ნიშნავს რწმენის ნაკლებობას. თითოეულ ქალს საკუთარი გლოვის გავლა საკუთარი ტემპით შეუძლია.',
    visual1Title: 'თქვენი ემოციების მიღება',
    visual1Body: 'სევდა • დასვენების საჭიროება • სიჩუმე • მხარდაჭერა',
    section2H2: '2. სტატუსი, რომელიც სიტუაციის მიხედვით შეიძლება განსხვავდებოდეს',
    section2Body1:
      'დაკარგვის შემდეგ რელიგიური წესები შეიძლება სიტუაციასა და სისხლდენის ბუნებაზე იყოს დამოკიდებული.',
    section2Body2:
      'კერძოდ, შეიძლება საჭირო იყოს სისხლდენის სხვადასხვა ტიპის გარჩევა, სანამ განისაზღვრება, რომელი რელიგიური პრაქტიკა უნდა დაიცვათ.',
    schemaTitle: 'ზოგადი პრინციპი',
    schemaLabel1: 'სიტუაცია',
    schemaLabel2: 'სისხლდენის ბუნება',
    schemaLabel3: 'შესაფერისი მითითება',
    doubtTipTitle: 'ეჭვის შემთხვევაში',
    doubtTipText:
      'პირად სიტუაციას შეიძლება განსხვავებული პასუხი სჭირდებოდეს. უმჯობესია კვალიფიციური პირისგან რჩევის ძიება.',
    section3H2: '3. მოთმინება და იმედი',
    section3Body1:
      'მოთმინება (საბრი) არ ნიშნავს არ ტირილს ან ტკივილის არ განცდას. ის უბრალოდ გზას რწმენითა და იმედით შეიძლება გაჰყვეს.',
    section3Body2:
      'პატარა ჟესტებს შეუძლია სიმშვიდის განცდის ეტაპობრივად აღდგენაში დახმარება: ლოცვითი თხოვნა, ზიქრის მომენტი, სულიერი მოსმენა ან ახლობლის თანდასწრება.',
    spiritual1: 'ლოცვითი თხოვნა',
    spiritual2: 'ზიქრი',
    spiritual3: 'მხარდაჭერა',
    retainTipTitle: 'გაითვალისწინეთ',
    retainTipText:
      'განკურნებას დრო სჭირდება. დაკარგვის გავლის უნივერსალური ტემპი არ არსებობს.',
    section4H2: '4. რამდენიმე მინიშნება წინსვლისთვის',
    section4Body:
      'ყველაფრის ერთბაშად გაკეთება საჭირო არ არის. აირჩიეთ ის, რაც თქვენს განცდას და იმას შეესაბამება, რაც ახლა გჭირდებათ.',
    gentleSteps: [
      'დაუთმეთ დრო თქვენი გლოვის განსაცდელად',
      'გარშემო მოიკალათეთ მზრუნველი ადამიანები',
      'შეინარჩუნეთ პატარა სულიერი პრაქტიკა, თუ ის კომფორტს გაძლევთ',
      'ნებისმიერ კონკრეტულ რელიგიურ საკითხზე ჰკითხეთ რჩევა',
      'მოიძიეთ მხარდაჭერა, თუ გლოვა ზედმეტად რთულად ასატანი ხდება',
    ],
    finalTitle: 'გზა თქვენი ტემპით',
    finalText:
      'საკუთარ თავზე ზრუნვას, მხარდაჭერის ძიებას და იმედის შენარჩუნებას შეუძლია ეტაპობრივად სიმშვიდისკენ გზის წარმართვაში დახმარება.',
    shareMessage: 'სულიერი მითითებები დაკარგვის შემდეგ — AWA',
  },
  hy: {
    badge: 'ՀՈԳԵՎՈՐ ՈՒՂՂՈՐԴՈՒՄ',
    title: 'Հոգևոր ուղղորդում\nկորստից հետո',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaEducational: 'Կրթական բովանդակություն',
    intro:
      'Հոգևոր ուղղորդման մի քանի կետ, որոնք կօգնեն ձեզ կորստի միջով անցնել մեղմությամբ, համբերությամբ և կարեկցանքով:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText:
      'Այս բովանդակությունը կրթական է: Կոնկրետ կրոնական հարցերը պետք է ստուգվեն որակավորված գիտնականի հետ: AWA-ն անհատականացված ֆեթվաներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ճանաչված փորձություն',
      'Կարգավիճակ, որը կախված է իրավիճակից',
      'Համբերություն և հույս',
      'Մի քանի ուղենիշ՝ առաջ շարժվելու համար',
    ],
    section1H2: '1. Ճանաչված փորձություն',
    section1Body1:
      'Հղիության կորուստը կարող է խորապես ցավոտ փորձություն լինել: Տխրությունը, լռությունը, շփոթությունը կամ հետ քաշվելու կարիքը բնական մարդկային արձագանքներ են:',
    section1Body2:
      'Այս հույզերը զգալը չի նշանակում հավատքի պակաս: Յուրաքանչյուր կին կարող է իր սուգն անցնել իր տեմպով:',
    visual1Title: 'Ընդունել ձեր հույզերը',
    visual1Body: 'Տխրություն • հանգստի կարիք • լռություն • աջակցություն',
    section2H2: '2. Կարգավիճակ, որը կարող է տարբերվել՝ կախված իրավիճակից',
    section2Body1:
      'Կորստից հետո կրոնական կանոնները կարող են կախված լինել իրավիճակից և արյունահոսության բնույթից:',
    section2Body2:
      'Մասնավորապես, կարող է անհրաժեշտ լինել տարբերակել արյունահոսության տարբեր տեսակներ՝ նախքան որոշելը, թե որ կրոնական պրակտիկաներին հետևել:',
    schemaTitle: 'Ընդհանուր սկզբունքը',
    schemaLabel1: 'Իրավիճակ',
    schemaLabel2: 'Արյունահոսության բնույթ',
    schemaLabel3: 'Համապատասխան ուղղորդում',
    doubtTipTitle: 'Կասկածի դեպքում',
    doubtTipText:
      'Անձնական իրավիճակը կարող է պահանջել այլ պատասխան: Լավագույնն է խորհուրդ հարցնել որակավորված անձից:',
    section3H2: '3. Համբերություն և հույս',
    section3Body1:
      'Համբերությունը (սաբր) չի նշանակում չլալ կամ ցավ չզգալ: Այն կարող է պարզապես ուղեկցել ճանապարհին՝ հավատքով և հույսով:',
    section3Body2:
      'Փոքր ժեստերը կարող են օգնել աստիճանաբար վերականգնել խաղաղության զգացումը. աղոթագիր, զիքրի մի պահ, հոգևոր լսում կամ մտերմի ներկայություն:',
    spiritual1: 'Աղոթագիր',
    spiritual2: 'Զիքր',
    spiritual3: 'Աջակցություն',
    retainTipTitle: 'Հիշեք',
    retainTipText:
      'Ապաքինումը ժամանակ է պահանջում: Կորստի միջով անցնելու համընդհանուր տեմպ չկա:',
    section4H2: '4. Մի քանի ուղենիշ՝ առաջ շարժվելու համար',
    section4Body:
      'Պետք չէ ամեն ինչ անել միանգամից: Ընտրեք այն, ինչ համապատասխանում է ձեր զգացածին և ձեր այս պահի կարիքին:',
    gentleSteps: [
      'Ժամանակ տվեք ձեր սուգն ապրելու համար',
      'Շրջապատեք ձեզ հոգատար մարդկանցով',
      'Պահպանեք փոքր հոգևոր պրակտիկաներ, եթե դրանք մխիթարություն են բերում',
      'Խորհուրդ հարցրեք ցանկացած կոնկրետ կրոնական հարցի համար',
      'Աջակցություն փնտրեք, եթե սուգը դառնում է չափազանց դժվար կրելու համար',
    ],
    finalTitle: 'Ճանապարհ՝ ձեր տեմպով',
    finalText:
      'Ձեր մասին հոգ տանելը, աջակցություն փնտրելը և հույսը պահելը կարող են աստիճանաբար օգնել ուղղորդել ճանապարհը դեպի խաղաղություն:',
    shareMessage: 'Հոգևոր ուղղորդում կորստից հետո — AWA',
  },
  tg: {
    badge: 'РОҲНАМОИИ МАЪНАВӢ',
    title: 'Роҳнамоии маънавӣ\nпас аз талафот',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaEducational: 'Мазмуни таълимӣ',
    intro:
      'Чанд нуктаи роҳнамоии маънавӣ барои кумак ба гузаштан аз талафот бо нармӣ, сабр ва ҳамдардӣ.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText:
      'Ин мазмун таълимист. Масъалаҳои мушаххаси динӣ бояд аз олими салоҳиятдор тасдиқ карда шаванд. AWA фатвоҳои шахсӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Озмоиши эътирофшуда',
      'Мақоме, ки ба вазъият вобаста аст',
      'Сабр ва умед',
      'Чанд нуктаи роҳнамоӣ барои пеш рафтан',
    ],
    section1H2: '1. Озмоиши эътирофшуда',
    section1Body1:
      'Талафоти ҳомиладорӣ метавонад озмоиши амиқан дардовар бошад. Ғамгинӣ, хомӯшӣ, саргардонӣ ё ниёз ба канор рафтан вокунишҳои табиии инсонӣ мебошанд.',
    section1Body2:
      'Эҳсос кардани ин эҳсосот маънои камии имонро надорад. Ҳар зан метавонад ғами худро бо суръати худ аз сар гузаронад.',
    visual1Title: 'Қабули эҳсосоти худ',
    visual1Body: 'Ғамгинӣ • ниёз ба истироҳат • хомӯшӣ • дастгирӣ',
    section2H2: '2. Мақоме, ки вобаста ба вазъият метавонад гуногун бошад',
    section2Body1:
      'Пас аз талафот қоидаҳои динӣ метавонанд ба вазъият ва хусусияти хунравӣ вобаста бошанд.',
    section2Body2:
      'Хусусан, лозим шуда метавонад, ки пеш аз муайян кардани он ки кадом амалҳои динӣ бояд пайравӣ шаванд, байни навъҳои гуногуни хунравӣ фарқ гузошта шавад.',
    schemaTitle: 'Принсипи умумӣ',
    schemaLabel1: 'Вазъият',
    schemaLabel2: 'Хусусияти хунравӣ',
    schemaLabel3: 'Роҳнамоии мувофиқ',
    doubtTipTitle: 'Дар сурати шубҳа',
    doubtTipText:
      'Вазъияти шахсӣ метавонад посухи дигареро талаб кунад. Беҳтар аст аз шахси салоҳиятдор маслиҳат пурсед.',
    section3H2: '3. Сабр ва умед',
    section3Body1:
      'Сабр маънои гиря накардан ё дард эҳсос накардан нест. Он метавонад танҳо роҳро бо имон ва умед ҳамроҳӣ кунад.',
    section3Body2:
      'Ишораҳои хурд метавонанд ба тадриҷан барқарор кардани эҳсоси оромӣ кумак кунанд: дуо, лаҳзаи зикр, гӯш кардани маънавӣ ё ҳузури наздик.',
    spiritual1: 'Дуо',
    spiritual2: 'Зикр',
    spiritual3: 'Дастгирӣ',
    retainTipTitle: 'Дар хотир доред',
    retainTipText:
      'Шифо ёфтан вақт мегирад. Суръати умумӣ барои гузаштан аз талафот вуҷуд надорад.',
    section4H2: '4. Чанд нуктаи роҳнамоӣ барои пеш рафтан',
    section4Body:
      'Лозим нест ҳама чизро якбора кард. Он чиро интихоб кунед, ки ба эҳсоси шумо ва ба он чи ҳозир ба он ниёз доред, мувофиқ аст.',
    gentleSteps: [
      'Барои аз сар гузаронидани ғами худ вақт ҷудо кунед',
      'Худро бо одамони ғамхор иҳота кунед',
      'Агар амалҳои хурди маънавӣ тасаллӣ диҳанд, онҳоро идома диҳед',
      'Барои ҳар саволи мушаххаси динӣ маслиҳат пурсед',
      'Агар ғам бардоштанро аз ҳад душвор кунад, дастгирӣ ҷӯед',
    ],
    finalTitle: 'Роҳе бо суръати худи шумо',
    finalText:
      'Ғамхорӣ аз худ, ҷустуҷӯи дастгирӣ ва нигоҳ доштани умед метавонад тадриҷан роҳро ба сӯи оромӣ роҳнамоӣ кунад.',
    shareMessage: 'Роҳнамоии маънавӣ пас аз талафот — AWA',
  },
  ky: {
    badge: 'РУХАНИЙ ЖЕТЕКЧИЛИК',
    title: 'Жоготуудан кийинки\nруханий жетекчилик',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaEducational: 'Билим берүүчү мазмун',
    intro:
      'Жоготуудан жумшактык, сабыр жана боорукердик менен өтүүгө жардам берүү үчүн бир нече руханий жетекчилик таяныч чекити.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText:
      'Бул мазмун билим берүүчү. Белгилүү диний суроолорду квалификациялуу окумуштуу менен текшерүү керек. AWA жекелештирилген фатва чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Таанылган сыноо',
      'Абалга жараша макам',
      'Сабыр жана үмүт',
      'Алдыга жылуу үчүн бир нече жетекчилик чекити',
    ],
    section1H2: '1. Таанылган сыноо',
    section1Body1:
      'Курсактуулуктун үзүлүшү терең оорутуучу сыноо болушу мүмкүн. Кайгы, унчукпоо, башаламандык же четтеп калуу муктаждыгы — табигый адамдык реакциялар.',
    section1Body2:
      'Бул эмоцияларды сезүү ишенимдин жетишсиздигин билдирбейт. Ар бир аял кайгысын өз темпинде башынан өткөрө алат.',
    visual1Title: 'Эмоцияларыңызды кабыл алуу',
    visual1Body: 'Кайгы • эс алуу муктаждыгы • унчукпоо • колдоо',
    section2H2: '2. Абалга жараша айырмаланышы мүмкүн болгон макам',
    section2Body1:
      'Жоготуудан кийин диний эрежелер абалга жана кан кетүүнүн мүнөзүнө көз каранды болушу мүмкүн.',
    section2Body2:
      'Атап айтканда, кайсы диний практикаларды ээрчүүнү аныктоодон мурун кан кетүүнүн ар кандай түрлөрүн айырмалоо зарыл болушу мүмкүн.',
    schemaTitle: 'Жалпы принцип',
    schemaLabel1: 'Абал',
    schemaLabel2: 'Кан кетүүнүн мүнөзү',
    schemaLabel3: 'Ылайыктуу жетекчилик',
    doubtTipTitle: 'Күмөн болсо',
    doubtTipText:
      'Жеке абал башка жоопту талап кылышы мүмкүн. Квалификациялуу адамдан кеңеш сураган жакшы.',
    section3H2: '3. Сабыр жана үмүт',
    section3Body1:
      'Сабыр ыйлабоону же оорууну сезбөөнү билдирбейт. Ал жөн гана жолду ишеним жана үмүт менен коштой алат.',
    section3Body2:
      'Кичинекей жаңсоолор тынчтык сезимин акырындап калыбына келтирүүгө жардам бериши мүмкүн: дуа, зикир учуру, руханий угуу же жакын адамдын катышуусу.',
    spiritual1: 'Дуа',
    spiritual2: 'Зикир',
    spiritual3: 'Колдоо',
    retainTipTitle: 'Эстен чыгарбаңыз',
    retainTipText:
      'Айыгуу убакыт алат. Жоготуудан өтүүнүн универсалдуу темпи жок.',
    section4H2: '4. Алдыга жылуу үчүн бир нече жетекчилик чекити',
    section4Body:
      'Баарын бир эле учурда кылуунун кереги жок. Өзүңүздү кандай сезгениңизге жана азыр эмнеге муктаж экениңизге шайкеш келгенин тандаңыз.',
    gentleSteps: [
      'Кайгыңызды башынан өткөрүүгө убакыт бериңиз',
      'Өзүңүздү камкор адамдар менен курчаңыз',
      'Жубаныч алып келсе, кичинекей руханий практикаларды улантыңыз',
      'Ар кандай өзгөчө диний суроо боюнча кеңеш сураңыз',
      'Кайгы көтөрүүгө өтө оор болуп калса, колдоо издеңиз',
    ],
    finalTitle: 'Өз темпиңиздеги жол',
    finalText:
      'Өзүңүзгө кам көрүү, колдоо издөө жана үмүттү сактоо тынчтыкка жолду акырындап багыттоого жардам бериши мүмкүн.',
    shareMessage: 'Жоготуудан кийинки руханий жетекчилик — AWA',
  },
  tk: {
    badge: 'RUHY UGRUKDYRMA',
    title: 'Ýitgiden soň\nruhy ugrukdyrma',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaEducational: 'Bilim beriji mazmun',
    intro:
      'Ýitgini mylaýymlyk, sabyr we rehim bilen geçmäge kömek edýän birnäçe ruhy ugrukdyrma nokady.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText:
      'Bu mazmun bilim berýär. Aýratyn dini soraglar bilimli alym bilen barlanmaly. AWA şahsylaşdyrylan fatwalar bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Ykrar edilen synag',
      'Ýagdaýa bagly ýagdaý',
      'Sabyr we umyt',
      'Öňe gitmek üçin birnäçe ugrukdyrma nokady',
    ],
    section1H2: '1. Ykrar edilen synag',
    section1Body1:
      'Göwreliligiň ýitirilmegi çuňňur agyryly synag bolup biler. Gam, dymyşlyk, bulaşyklyk ýa-da yza çekilmek zerurlygy tebigy adam reaksiýalary.',
    section1Body2:
      'Bu duýgulary duýmak imanyň ýetmezçiligini aňlatmaýar. Her aýal gaýgysyny öz ritmiňde geçip biler.',
    visual1Title: 'Duýgularyňyzy kabul etmek',
    visual1Body: 'Gam • dynç zerurlygy • dymyşlyk • goldaw',
    section2H2: '2. Ýagdaýa görä üýtgäp biljek ýagdaý',
    section2Body1:
      'Ýitgiden soň dini düzgünler ýagdaýa we gan akmanyň häsiýetine bagly bolup biler.',
    section2Body2:
      'Aýratyn-da, haýsy dini tejribelere eýermelidigini kesgitlemezden öň gan akmanyň dürli görnüşlerini tapawutlandyrmak zerur bolup biler.',
    schemaTitle: 'Umumy ýörelge',
    schemaLabel1: 'Ýagdaý',
    schemaLabel2: 'Gan akmanyň häsiýeti',
    schemaLabel3: 'Laýyk ugrukdyrma',
    doubtTipTitle: 'Şübhe bolsa',
    doubtTipText:
      'Şahsy ýagdaý başga jogap talap edip biler. Bilimli adamdan maslahat soramak has gowy.',
    section3H2: '3. Sabyr we umyt',
    section3Body1:
      'Sabyr aglamazlygy ýa-da agyry duýmazlygy aňlatmaýar. Ol ýöne ýoly iman we umyt bilen ugurdaş edip biler.',
    section3Body2:
      'Kiçijik hereketler asudalyk duýgusyny ýuwaş-ýuwaşdan dikeltmäge kömek edip biler: doga, zikir pursaty, ruhy diňlemek ýa-da ýakyn adamyň barlygy.',
    spiritual1: 'Doga',
    spiritual2: 'Zikir',
    spiritual3: 'Goldaw',
    retainTipTitle: 'Ýatda saklaň',
    retainTipText:
      'Bejergi wagt talap edýär. Ýitgini geçmek üçin umumy çaltlyk ýok.',
    section4H2: '4. Öňe gitmek üçin birnäçe ugrukdyrma nokady',
    section4Body:
      'Hemme zady bir wagtda etmek hökman däl. Duýgyňyza we häzir zerurlygyňyza gabat gelýäni saýlaň.',
    gentleSteps: [
      'Gaýgyňyzy başdan geçirmäge wagt beriň',
      'Özüňizi aladaly adamlar bilen gurşaň',
      'Rahatlyk getirýän bolsa, kiçijik ruhy tejribeleri dowam etdiriň',
      'Islendik aýratyn dini sorag üçin maslahat soraň',
      'Gaýgy göterip bolmajak derejede kynlaşsa, goldaw soraň',
    ],
    finalTitle: 'Öz ritmiňizde ýol',
    finalText:
      'Özüňize ideg etmek, goldaw gözlemek we umyda ýapyşmak asudalyga eltýän ýolda ýuwaş-ýuwaşdan ugrukdyrmaga kömek edip biler.',
    shareMessage: 'Ýitgiden soň ruhy ugrukdyrma — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReligiousFaqAfterLossArticleScreen({
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
              ['shield-check-outline', content.metaEducational],
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

          <AwaText variant="bodyMedium" style={styles.intro}>{content.intro}</AwaText>

          {/* DISCLAIMER */}
          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.disclaimerTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.disclaimerText}</AwaText>
            </View>
          </AwaCard>

          {/* CONTENTS */}
          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.section1H2}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body2}</AwaText>

          {/* SIMPLE VISUAL */}
          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <View style={styles.visualIcon}>
              <MaterialDesignIcons
                name="heart-outline"
                size={30}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.visualText}>
              <AwaText variant="titleSmall" emphasized>{content.visual1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualBody}>{content.visual1Body}</AwaText>
            </View>
          </AwaCard>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.section2H2}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body2}</AwaText>

          {/* SCHEMA */}
          <AwaCard variant="filled" padding="none" style={styles.schema}>
            <AwaText variant="titleSmall" emphasized style={styles.schemaTitle}>{content.schemaTitle}</AwaText>

            <View style={styles.schemaRow}>
              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary">1</AwaText>
                </View>
                <AwaText variant="bodySmall" style={styles.schemaLabel}>{content.schemaLabel1}</AwaText>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.primary}
              />

              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary">2</AwaText>
                </View>
                <AwaText variant="bodySmall" style={styles.schemaLabel}>{content.schemaLabel2}</AwaText>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.primary}
              />

              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary">3</AwaText>
                </View>
                <AwaText variant="bodySmall" style={styles.schemaLabel}>{content.schemaLabel3}</AwaText>
              </View>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.doubtTipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.doubtTipText}</AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.section3H2}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body2}</AwaText>

          {/* SPIRITUALITY VISUAL */}
          <AwaCard variant="filled" padding="none" style={styles.spiritualCard}>
            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="heart-outline"
                size={23}
                color={theme.colors.primary}
              />
              <AwaText variant="labelSmall" style={styles.spiritualText}>{content.spiritual1}</AwaText>
            </View>

            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="hands-pray"
                size={23}
                color={theme.colors.primary}
              />
              <AwaText variant="labelSmall" style={styles.spiritualText}>{content.spiritual2}</AwaText>
            </View>

            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={23}
                color={theme.colors.primary}
              />
              <AwaText variant="labelSmall" style={styles.spiritualText}>{content.spiritual3}</AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.retainTipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.retainTipText}</AwaText>
            </View>
          </AwaCard>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.section4H2}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.gentleSteps.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* FINAL MESSAGE */}
          <AwaCard variant="filled" padding="none" style={styles.finalCard}>
            <MaterialDesignIcons
              name="flower-outline"
              size={28}
              color={theme.colors.primary}
            />

            <AwaText variant="titleMedium" emphasized style={styles.finalTitle}>{content.finalTitle}</AwaText>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.finalText}>{content.finalText}</AwaText>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
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

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
    width: 24,
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
    marginTop: 3,
  },

  visualCard: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  visualIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  visualText: {
    flex: 1,
    marginLeft: 12,
  },


  visualBody: {
    marginTop: 4,
  },

  schema: {
    marginTop: 16,
    padding: 16,
  },

  schemaTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },

  schemaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  schemaStep: {
    flex: 1,
    alignItems: 'center',
  },

  schemaCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  schemaLabel: {
    marginTop: 8,
    textAlign: 'center',
  },

  spiritualCard: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  spiritualItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  spiritualText: {
    marginTop: 8,
    textAlign: 'center',
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

  finalCard: {
    marginTop: 20,
    padding: 20,
    alignItems: 'center',
  },

  finalTitle: {
    marginTop: 8,
    textAlign: 'center',
  },

  finalText: {
    marginTop: 8,
    textAlign: 'center',
  },
  });
}
