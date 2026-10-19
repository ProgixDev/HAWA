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

const ID = 'birthcontrolpills-comprendre-la-pilule';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PILULE CONTRACEPTIVE',
    title: 'Comprendre la\npilule contraceptive',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment agit la pilule, comment l’utiliser au quotidien et quels sont ses principaux avantages et limites.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comment agit la pilule',
      'Bien la prendre au quotidien',
      'Avantages et limites',
      'À retenir',
    ],
    body1: 'La pilule contient des hormones, œstrogènes et/ou progestatif selon le type, qui agissent principalement en empêchant ou en bloquant l’ovulation. Elle modifie également la glaire cervicale, ce qui rend le passage des spermatozoïdes plus difficile.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il existe plusieurs types de pilules, notamment les pilules combinées et celles contenant uniquement un progestatif. Leur composition et leur mode de prise peuvent varier.',
    body2: 'La régularité de la prise est importante. Selon le type de pilule, les règles en cas d’oubli peuvent être différentes : il est donc essentiel de consulter la notice de son médicament.',
    routineTips: [
      'Choisir un moment de la journée facile à retenir (repas, coucher...)',
      'Utiliser un rappel ou une application si besoin',
      'Garder la notice à portée de main en cas de doute',
    ],
    sectionIntro: 'Comme toute méthode contraceptive, la pilule présente des avantages mais aussi certaines limites à connaître avant de la choisir.',
    advantagesTitle: 'Avantages',
    advantagesSubtitle: 'Ce qu’elle peut apporter',
    advantages: [
      'Réduit fortement le risque de grossesse lorsqu’elle est utilisée correctement',
      'Peut rendre les règles plus régulières et prévisibles',
      'Peut diminuer les douleurs et les saignements chez certaines personnes',
      'Peut être adaptée ou changée si elle ne convient pas',
    ],
    limitationsTitle: 'Limites',
    limitationsSubtitle: 'Les points à connaître',
    limitations: [
      'Nécessite une prise régulière selon le type de pilule',
      'Les oublis peuvent diminuer son efficacité',
      'Des effets indésirables peuvent apparaître chez certaines personnes',
      'Ne protège pas contre les infections sexuellement transmissibles (IST)',
    ],
    takeawayTitle: 'Une méthode à connaître',
    takeawayText: 'La pilule est une méthode contraceptive hormonale efficace lorsqu’elle est utilisée correctement. Sa prise régulière, ses éventuels effets indésirables et l’absence de protection contre les IST sont des éléments importants à connaître.',
    finalTipText: 'Si tu envisages une contraception ou si ta méthode actuelle ne te convient pas, n’hésite pas à en discuter avec un médecin, une sage-femme ou un autre professionnel de santé.',
    shareMessage: 'Comprendre la pilule contraceptive — AWA',
  },
  en: {
    badge: 'BIRTH CONTROL PILL',
    title: 'Understanding\nthe birth control pill',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How the pill works, how to take it day to day, and its main advantages and limitations.',
    contentsTitle: 'In this article',
    topics: [
      'How the pill works',
      'Taking it correctly every day',
      'Advantages and limitations',
      'Key takeaways',
    ],
    body1: 'The pill contains hormones — estrogen and/or progestin, depending on the type — that work mainly by preventing or blocking ovulation. It also changes cervical mucus, which makes it harder for sperm to pass through.',
    tip1Title: 'Good to know',
    tip1Text: 'There are several types of pills, including combined pills and progestin-only pills. Their composition and how they’re taken can vary.',
    body2: 'Taking it consistently matters. Depending on the type of pill, what to do after a missed dose can differ — so it’s essential to check your medication’s package insert.',
    routineTips: [
      'Pick a time of day that’s easy to remember (a meal, bedtime...)',
      'Use a reminder or an app if needed',
      'Keep the package insert on hand in case of doubt',
    ],
    sectionIntro: 'Like any contraceptive method, the pill has advantages but also certain limitations to know about before choosing it.',
    advantagesTitle: 'Advantages',
    advantagesSubtitle: 'What it can offer',
    advantages: [
      'Greatly reduces the risk of pregnancy when used correctly',
      'May make periods more regular and predictable',
      'May reduce pain and bleeding for some people',
      'Can be adjusted or changed if it doesn’t suit you',
    ],
    limitationsTitle: 'Limitations',
    limitationsSubtitle: 'Points to be aware of',
    limitations: [
      'Requires regular intake depending on the type of pill',
      'Missed doses can reduce its effectiveness',
      'Some people may experience side effects',
      'Does not protect against sexually transmitted infections (STIs)',
    ],
    takeawayTitle: 'A method worth understanding',
    takeawayText: 'The pill is an effective hormonal contraceptive method when used correctly. Taking it consistently, its possible side effects, and the lack of protection against STIs are important things to know.',
    finalTipText: 'If you’re considering contraception or your current method isn’t working for you, don’t hesitate to talk to a doctor, midwife, or another healthcare professional.',
    shareMessage: 'Understanding the birth control pill — AWA',
  },
  es: {
    badge: 'PÍLDORA ANTICONCEPTIVA',
    title: 'Entender la\npíldora anticonceptiva',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cómo actúa la píldora, cómo tomarla cada día y cuáles son sus principales ventajas y límites.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cómo actúa la píldora',
      'Tomarla correctamente cada día',
      'Ventajas y límites',
      'Lo esencial',
    ],
    body1: 'La píldora contiene hormonas, estrógenos y/o progestágeno según el tipo, que actúan principalmente impidiendo o bloqueando la ovulación. También modifica el moco cervical, lo que dificulta el paso de los espermatozoides.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Existen varios tipos de píldoras, entre ellas las píldoras combinadas y las que contienen únicamente un progestágeno. Su composición y su forma de uso pueden variar.',
    body2: 'La regularidad en la toma es importante. Según el tipo de píldora, la actuación a seguir en caso de olvido puede ser diferente: por eso es esencial consultar el prospecto de tu medicamento.',
    routineTips: [
      'Elige un momento del día fácil de recordar (una comida, la hora de dormir...)',
      'Usa un recordatorio o una aplicación si lo necesitas',
      'Ten el prospecto a mano en caso de duda',
    ],
    sectionIntro: 'Como todo método anticonceptivo, la píldora tiene ventajas, pero también ciertos límites que conviene conocer antes de elegirla.',
    advantagesTitle: 'Ventajas',
    advantagesSubtitle: 'Lo que puede aportar',
    advantages: [
      'Reduce considerablemente el riesgo de embarazo cuando se usa correctamente',
      'Puede hacer que las reglas sean más regulares y predecibles',
      'Puede disminuir el dolor y el sangrado en algunas personas',
      'Puede adaptarse o cambiarse si no resulta adecuada',
    ],
    limitationsTitle: 'Límites',
    limitationsSubtitle: 'Los puntos que hay que conocer',
    limitations: [
      'Requiere una toma regular según el tipo de píldora',
      'Los olvidos pueden disminuir su eficacia',
      'Pueden aparecer efectos indeseados en algunas personas',
      'No protege contra las infecciones de transmisión sexual (ITS)',
    ],
    takeawayTitle: 'Un método que conviene conocer',
    takeawayText: 'La píldora es un método anticonceptivo hormonal eficaz cuando se usa correctamente. Su toma regular, sus posibles efectos indeseados y la ausencia de protección frente a las ITS son aspectos importantes que hay que conocer.',
    finalTipText: 'Si estás considerando una anticoncepción o tu método actual no te resulta adecuado, no dudes en hablarlo con un médico, una matrona u otro profesional de la salud.',
    shareMessage: 'Entender la píldora anticonceptiva — AWA',
  },
  it: {
    badge: 'PILLOLA ANTICONCEZIONALE',
    title: 'Capire\nla pillola anticoncezionale',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Come funziona la pillola, come assumerla ogni giorno, e i suoi principali vantaggi e limiti.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Come funziona la pillola',
      'Assumerla correttamente ogni giorno',
      'Vantaggi e limiti',
      'Punti chiave',
    ],
    body1: 'La pillola contiene ormoni — estrogeno e/o progestinico, a seconda del tipo — che agiscono soprattutto impedendo o bloccando l’ovulazione. Modifica inoltre il muco cervicale, rendendo più difficile il passaggio degli spermatozoi.',
    tip1Title: 'Da sapere',
    tip1Text: 'Esistono diversi tipi di pillola, tra cui le pillole combinate e le pillole a base di solo progestinico. La loro composizione e il modo di assumerle possono variare.',
    body2: 'È importante assumerla con regolarità. A seconda del tipo di pillola, cosa fare dopo una dimenticanza può essere diverso — per questo è essenziale consultare il foglietto illustrativo del tuo medicinale.',
    routineTips: [
      'Scegli un momento della giornata facile da ricordare (un pasto, l’ora di andare a dormire...)',
      'Usa un promemoria o un’app se necessario',
      'Tieni a portata di mano il foglietto illustrativo in caso di dubbi',
    ],
    sectionIntro: 'Come ogni metodo contraccettivo, la pillola ha dei vantaggi ma anche alcuni limiti da conoscere prima di sceglierla.',
    advantagesTitle: 'Vantaggi',
    advantagesSubtitle: 'Cosa può offrire',
    advantages: [
      'Riduce notevolmente il rischio di gravidanza se usata correttamente',
      'Può rendere le mestruazioni più regolari e prevedibili',
      'Può ridurre il dolore e il flusso mestruale in alcune persone',
      'Può essere adattata o cambiata se non è adatta a te',
    ],
    limitationsTitle: 'Limiti',
    limitationsSubtitle: 'Aspetti da conoscere',
    limitations: [
      'Richiede un’assunzione regolare, a seconda del tipo di pillola',
      'Le dimenticanze possono ridurne l’efficacia',
      'Alcune persone possono avere effetti collaterali',
      'Non protegge dalle infezioni sessualmente trasmissibili (IST)',
    ],
    takeawayTitle: 'Un metodo da conoscere bene',
    takeawayText: 'La pillola è un metodo contraccettivo ormonale efficace se usata correttamente. Assumerla con regolarità, i suoi possibili effetti collaterali e la mancanza di protezione contro le IST sono aspetti importanti da conoscere.',
    finalTipText: 'Se stai pensando alla contraccezione o il metodo che usi ora non fa per te, non esitare a parlarne con un medico, un’ostetrica o un altro professionista sanitario.',
    shareMessage: 'Capire la pillola anticoncezionale — AWA',
  },
  tr: {
    badge: 'DOĞUM KONTROL HAPI',
    title: 'Doğum kontrol hapını\nanlamak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hapın nasıl etki ettiği, günlük olarak nasıl kullanılacağı, başlıca avantajları ve sınırlılıkları.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Hap nasıl etki eder',
      'Her gün doğru kullanmak',
      'Avantajlar ve sınırlılıklar',
      'Önemli noktalar',
    ],
    body1: 'Hap, türüne göre östrojen ve/veya progestin içeren hormonlar barındırır ve esas olarak yumurtlamayı önleyerek ya da engelleyerek etki eder. Ayrıca servikal mukusu değiştirir; bu da sperm geçişini zorlaştırır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Kombine haplar ve yalnızca progestin içeren haplar dahil birkaç hap türü vardır. İçerikleri ve kullanım şekilleri farklılık gösterebilir.',
    body2: 'Düzenli kullanmak önemlidir. Hap türüne göre, unutulan bir dozdan sonra ne yapılacağı değişebilir; bu yüzden ilacının kullanma talimatını kontrol etmen çok önemlidir.',
    routineTips: [
      'Hatırlaması kolay bir saat seç (yemek zamanı, yatmadan önce...)',
      'Gerekirse bir hatırlatıcı veya uygulama kullan',
      'Tereddüt ettiğinde başvurmak için kullanma talimatını elinin altında tut',
    ],
    sectionIntro: 'Her doğum kontrol yöntemi gibi hapın da avantajları vardır, ancak seçmeden önce bilinmesi gereken bazı sınırlılıkları da vardır.',
    advantagesTitle: 'Avantajlar',
    advantagesSubtitle: 'Neler sunabilir',
    advantages: [
      'Doğru kullanıldığında gebelik riskini büyük ölçüde azaltır',
      'Adetleri daha düzenli ve öngörülebilir hale getirebilir',
      'Bazı kişilerde ağrıyı ve kanamayı azaltabilir',
      'Sana uymazsa ayarlanabilir veya değiştirilebilir',
    ],
    limitationsTitle: 'Sınırlılıklar',
    limitationsSubtitle: 'Dikkat edilmesi gereken noktalar',
    limitations: [
      'Hap türüne bağlı olarak düzenli kullanım gerektirir',
      'Unutulan dozlar etkinliğini azaltabilir',
      'Bazı kişilerde yan etkiler görülebilir',
      'Cinsel yolla bulaşan enfeksiyonlara (CYBE) karşı koruma sağlamaz',
    ],
    takeawayTitle: 'Anlamaya değer bir yöntem',
    takeawayText: 'Hap, doğru kullanıldığında etkili bir hormonal doğum kontrol yöntemidir. Düzenli kullanmak, olası yan etkileri ve CYBE’lere karşı koruma sağlamaması bilinmesi gereken önemli noktalardır.',
    finalTipText: 'Doğum kontrolünü düşünüyorsan ya da şu anki yöntemin sana uymuyorsa bir doktora, ebeye veya başka bir sağlık profesyoneline danışmaktan çekinme.',
    shareMessage: 'Doğum kontrol hapını anlamak — AWA',
  },
  ru: {
    badge: 'ПРОТИВОЗАЧАТОЧНЫЕ ТАБЛЕТКИ',
    title: 'Понимаем\nпротивозачаточные таблетки',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Как действуют таблетки, как принимать их изо дня в день, а также их основные преимущества и ограничения.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как действуют таблетки',
      'Правильный ежедневный приём',
      'Преимущества и ограничения',
      'Главное',
    ],
    body1: 'Таблетки содержат гормоны — эстроген и/или прогестин, в зависимости от типа, — которые действуют главным образом за счёт предотвращения или блокировки овуляции. Они также изменяют цервикальную слизь, из-за чего сперматозоидам труднее проникнуть через неё.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Существует несколько видов таблеток, в том числе комбинированные и содержащие только прогестин. Их состав и способ приёма могут различаться.',
    body2: 'Важно принимать их регулярно. В зависимости от типа таблеток действия после пропущенной дозы могут отличаться, поэтому необходимо сверяться с инструкцией к вашему препарату.',
    routineTips: [
      'Выберите время суток, которое легко запомнить (приём пищи, отход ко сну...)',
      'При необходимости используйте напоминание или приложение',
      'Держите инструкцию под рукой на случай сомнений',
    ],
    sectionIntro: 'Как и любой метод контрацепции, таблетки имеют преимущества, но и некоторые ограничения, которые стоит знать до того, как сделать выбор.',
    advantagesTitle: 'Преимущества',
    advantagesSubtitle: 'Что они могут дать',
    advantages: [
      'При правильном применении значительно снижают риск беременности',
      'Могут сделать месячные более регулярными и предсказуемыми',
      'У некоторых женщин могут уменьшать боль и кровопотерю',
      'Их можно скорректировать или заменить, если они вам не подходят',
    ],
    limitationsTitle: 'Ограничения',
    limitationsSubtitle: 'О чём важно помнить',
    limitations: [
      'Требуют регулярного приёма, в зависимости от типа таблеток',
      'Пропущенные дозы могут снизить эффективность',
      'У некоторых женщин могут возникать побочные эффекты',
      'Не защищают от инфекций, передающихся половым путём (ИППП)',
    ],
    takeawayTitle: 'Метод, который стоит понимать',
    takeawayText: 'Таблетки — эффективный гормональный метод контрацепции при правильном применении. Важно знать о необходимости регулярного приёма, возможных побочных эффектах и об отсутствии защиты от ИППП.',
    finalTipText: 'Если вы думаете о контрацепции или ваш нынешний метод вам не подходит, не стесняйтесь обратиться к врачу, акушерке или другому медицинскому специалисту.',
    shareMessage: 'Понимаем противозачаточные таблетки — AWA',
  },
  de: {
    badge: 'ANTIBABYPILLE',
    title: 'Die Antibabypille\nverstehen',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wie die Pille wirkt, wie du sie im Alltag einnimmst und welche Vorteile und Grenzen sie hat.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Wie die Pille wirkt',
      'Die tägliche Einnahme richtig umsetzen',
      'Vorteile und Grenzen',
      'Das Wichtigste in Kürze',
    ],
    body1: 'Die Pille enthält Hormone – je nach Art Östrogen und/oder Gestagen –, die vor allem wirken, indem sie den Eisprung verhindern oder blockieren. Außerdem verändert sie den Zervixschleim, sodass es den Spermien schwerer fällt, hindurchzugelangen.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Es gibt verschiedene Arten von Pillen, darunter Kombinationspillen und reine Gestagenpillen. Ihre Zusammensetzung und die Art der Einnahme können sich unterscheiden.',
    body2: 'Die regelmäßige Einnahme ist wichtig. Je nach Pillenart kann das richtige Vorgehen nach einer vergessenen Einnahme unterschiedlich sein – deshalb ist es wichtig, den Beipackzettel deines Medikaments zu lesen.',
    routineTips: [
      'Wähle eine Tageszeit, die du dir leicht merken kannst (eine Mahlzeit, das Zubettgehen …)',
      'Nutze bei Bedarf eine Erinnerung oder eine App',
      'Halte den Beipackzettel für den Zweifelsfall griffbereit',
    ],
    sectionIntro: 'Wie jede Verhütungsmethode hat die Pille Vorteile, aber auch bestimmte Grenzen, die du vor der Entscheidung kennen solltest.',
    advantagesTitle: 'Vorteile',
    advantagesSubtitle: 'Was sie bieten kann',
    advantages: [
      'Verringert das Risiko einer Schwangerschaft bei korrekter Anwendung stark',
      'Kann die Periode regelmäßiger und besser vorhersehbar machen',
      'Kann bei manchen Menschen Schmerzen und Blutungen verringern',
      'Kann angepasst oder gewechselt werden, wenn sie nicht zu dir passt',
    ],
    limitationsTitle: 'Grenzen',
    limitationsSubtitle: 'Worauf du achten solltest',
    limitations: [
      'Erfordert je nach Pillenart eine regelmäßige Einnahme',
      'Vergessene Einnahmen können die Wirksamkeit verringern',
      'Manche Menschen können Nebenwirkungen bemerken',
      'Schützt nicht vor sexuell übertragbaren Infektionen (STI)',
    ],
    takeawayTitle: 'Eine Methode, die man verstehen sollte',
    takeawayText: 'Die Pille ist bei korrekter Anwendung eine wirksame hormonelle Verhütungsmethode. Wichtig zu wissen sind die regelmäßige Einnahme, mögliche Nebenwirkungen und der fehlende Schutz vor STI.',
    finalTipText: 'Wenn du über Verhütung nachdenkst oder deine aktuelle Methode nicht gut zu dir passt, sprich gern mit einer Ärztin oder einem Arzt, einer Hebamme oder anderem medizinischem Fachpersonal.',
    shareMessage: 'Die Antibabypille verstehen – AWA',
  },
  zh: {
      badge: '避孕药',
      title: '了解\n避孕药',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '经审阅的内容',
      intro: '了解避孕药如何起作用、日常如何服用，以及它的主要优点和局限。',
      contentsTitle: '本文内容',
      topics: [
        '避孕药如何起作用',
        '每天正确服用',
        '优点与局限',
        '要点回顾',
      ],
      body1: '避孕药含有激素——根据类型不同，为雌激素和 / 或孕激素——主要通过抑制或阻断排卵起作用。它还会改变宫颈黏液，使精子更难通过。',
      tip1Title: '小贴士',
      tip1Text: '避孕药有多种类型，包括复方避孕药和单孕激素避孕药。它们的成分和服用方式可能各不相同。',
      body2: '规律服用很重要。根据避孕药类型的不同，漏服后的处理方式也可能不同，因此务必查看你所用药物的说明书。',
      routineTips: [
        '选一个容易记住的时间（比如用餐时、睡前……）',
        '如有需要，可以使用提醒或应用',
        '把说明书放在手边，以备有疑问时查看',
      ],
      sectionIntro: '和所有避孕方式一样，避孕药有优点，也有一些在选择前需要了解的局限。',
      advantagesTitle: '优点',
      advantagesSubtitle: '它能带来什么',
      advantages: [
        '正确使用时，可大大降低怀孕的风险',
        '可能让月经更规律、更容易预测',
        '可能减轻一些人的疼痛和出血量',
        '如果不适合你，可以调整或更换',
      ],
      limitationsTitle: '局限',
      limitationsSubtitle: '需要留意的方面',
      limitations: [
        '根据避孕药类型，需要规律服用',
        '漏服可能降低避孕效果',
        '有些人可能出现副作用',
        '不能预防性传播感染（STI）',
      ],
      takeawayTitle: '值得了解的一种方法',
      takeawayText: '正确使用时，避孕药是一种有效的激素避孕方法。规律服用、可能出现的副作用，以及无法预防性传播感染，都是需要了解的重要事项。',
      finalTipText: '如果你正在考虑避孕，或者目前的方法不适合你，请不要犹豫，与医生、助产士或其他医疗专业人员谈一谈。',
      shareMessage: '了解避孕药 — AWA',
    },
  id: {
    badge: 'PIL KB',
    title: 'Memahami\npil KB',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Cara kerja pil, cara meminumnya sehari-hari, serta keuntungan dan keterbatasan utamanya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Cara kerja pil',
      'Meminumnya dengan benar setiap hari',
      'Keuntungan dan keterbatasan',
      'Poin penting',
    ],
    body1: 'Pil mengandung hormon — estrogen dan/atau progestin, tergantung jenisnya — yang bekerja terutama dengan mencegah atau menghambat ovulasi. Pil juga mengubah lendir serviks sehingga sperma lebih sulit melewatinya.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Ada beberapa jenis pil, termasuk pil kombinasi dan pil yang hanya mengandung progestin. Komposisi dan cara meminumnya bisa berbeda.',
    body2: 'Meminumnya secara teratur itu penting. Tergantung jenis pilnya, apa yang harus dilakukan setelah lupa minum bisa berbeda — jadi penting untuk memeriksa brosur obat yang ada di kemasannya.',
    routineTips: [
      'Pilih waktu yang mudah diingat (saat makan, sebelum tidur...)',
      'Gunakan pengingat atau aplikasi jika perlu',
      'Simpan brosur obat di dekatmu kalau-kalau ragu',
    ],
    sectionIntro: 'Seperti metode kontrasepsi lainnya, pil punya keuntungan tetapi juga beberapa keterbatasan yang perlu diketahui sebelum memilihnya.',
    advantagesTitle: 'Keuntungan',
    advantagesSubtitle: 'Yang bisa ditawarkannya',
    advantages: [
      'Sangat menurunkan risiko kehamilan bila digunakan dengan benar',
      'Dapat membuat haid lebih teratur dan mudah diprediksi',
      'Dapat mengurangi nyeri dan perdarahan pada sebagian orang',
      'Bisa disesuaikan atau diganti jika tidak cocok untukmu',
    ],
    limitationsTitle: 'Keterbatasan',
    limitationsSubtitle: 'Hal yang perlu diperhatikan',
    limitations: [
      'Perlu diminum secara teratur sesuai jenis pilnya',
      'Lupa minum bisa menurunkan efektivitasnya',
      'Sebagian orang bisa mengalami efek samping',
      'Tidak melindungi dari infeksi menular seksual (IMS)',
    ],
    takeawayTitle: 'Metode yang layak dipahami',
    takeawayText: 'Pil adalah metode kontrasepsi hormonal yang efektif bila digunakan dengan benar. Meminumnya secara teratur, kemungkinan efek sampingnya, dan tidak adanya perlindungan dari IMS adalah hal-hal penting yang perlu diketahui.',
    finalTipText: 'Jika kamu sedang mempertimbangkan kontrasepsi atau metode yang kamu pakai sekarang tidak cocok, jangan ragu berbicara dengan dokter, bidan, atau tenaga kesehatan lainnya.',
    shareMessage: 'Memahami pil KB — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BirthControlPillsArticleScreen({
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
              {
                paddingTop: getTopPadding(insets.top, true),
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* METADATA */}
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* TABLE OF CONTENTS */}
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
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.routineTips.map(item => (
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

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.sectionIntro}>
            {content.sectionIntro}
          </AwaText>

          {/* CENTRAL SCHEMA */}
          <View style={styles.schema}>
            {/* ADVANTAGES */}
            <AwaCard variant="filled" padding="none" style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View style={styles.iconCirclePositive}>
                  <MaterialDesignIcons
                    name="check-circle-outline"
                    size={22}
                    color={theme.colors.success}
                  />
                </View>

                <View style={styles.schemaHeaderText}>
                  <AwaText variant="titleMedium" emphasized>{content.advantagesTitle}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaSubtitle}>
                    {content.advantagesSubtitle}
                  </AwaText>
                </View>
              </View>

              <View style={styles.schemaLine} />

              {content.advantages.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.schemaRow,
                    index === content.advantages.length - 1 &&
                      styles.schemaRowLast,
                  ]}>
                  <View style={styles.smallPositiveIcon}>
                    <MaterialDesignIcons
                      name="check"
                      size={14}
                      color={theme.colors.success}
                    />
                  </View>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaText}>{item}</AwaText>
                </View>
              ))}
            </AwaCard>

            {/* LIMITATIONS */}
            <AwaCard variant="filled" padding="none" style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View style={styles.iconCircleWarning}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.schemaHeaderText}>
                  <AwaText variant="titleMedium" emphasized>{content.limitationsTitle}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaSubtitle}>
                    {content.limitationsSubtitle}
                  </AwaText>
                </View>
              </View>

              <View style={styles.schemaLine} />

              {content.limitations.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.schemaRow,
                    index === content.limitations.length - 1 &&
                      styles.schemaRowLast,
                  ]}>
                  <View style={styles.smallWarningIcon}>
                    <MaterialDesignIcons
                      name="alert-outline"
                      size={14}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaText}>{item}</AwaText>
                </View>
              ))}
            </AwaCard>
          </View>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.takeaway}>
            <View style={styles.takeawayIcon}>
              <MaterialDesignIcons
                name="pill"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.takeawayContent}>
              <AwaText variant="titleSmall" emphasized>
                {content.takeawayTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.takeawayText}>
                {content.takeawayText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={22}
              color={theme.colors.primary}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.finalTipText}>
              {content.finalTipText}
            </AwaText>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
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

  sectionIntro: {
    marginTop: 8,
  },

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  note: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 3,
  },

  checkList: {
    marginTop: 12,
    padding: 12,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  checkText: {
    flex: 1,
  },

  /* ADVANTAGES / LIMITATIONS SCHEMA */

  schema: {
    marginTop: 16,
    gap: 12,
  },

  schemaCard: {
    padding: 16,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  schemaHeaderText: {
    flex: 1,
    marginLeft: 12,
  },


  schemaSubtitle: {
    marginTop: 2,
  },

  iconCirclePositive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  iconCircleWarning: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  schemaLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: 12,
    marginBottom: 4,
  },

  schemaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 3,
  },

  smallPositiveIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  smallWarningIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  schemaText: {
    flex: 1,
  },

  takeaway: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  takeawayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  takeawayContent: {
    flex: 1,
    marginLeft: 12,
  },


  takeawayText: {
    marginTop: 4,
  },

  finalTip: {
    marginTop: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  finalTipText: {
    flex: 1,
    marginLeft: 8,
  },
  });
}
