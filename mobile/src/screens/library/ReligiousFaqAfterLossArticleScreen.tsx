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

const ID = 'religiousfaq-reperes-apres-une-perte';

const HERO = require('../../assets/images/library/spm-woman.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
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
} as const;

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
