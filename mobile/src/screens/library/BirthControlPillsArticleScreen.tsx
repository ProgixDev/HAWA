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

const ID = 'birthcontrolpills-comprendre-la-pilule';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('BirthControlPills', {
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
  hi: {
    badge: 'गर्भनिरोधक गोली',
    title: 'गर्भनिरोधक गोली को\nसमझें',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'गोली कैसे काम करती है, रोज़ इसे कैसे लें, और इसके मुख्य फ़ायदे व सीमाएँ।',
    contentsTitle: 'इस लेख में',
    topics: [
      'गोली कैसे काम करती है',
      'रोज़ सही तरीक़े से लेना',
      'फ़ायदे और सीमाएँ',
      'मुख्य बातें',
    ],
    body1: 'गोली में हार्मोन होते हैं — प्रकार के आधार पर एस्ट्रोजन और/या प्रोजेस्टिन — जो मुख्य रूप से ओव्यूलेशन (अंडोत्सर्ग) को रोककर या बाधित करके काम करते हैं। यह गर्भाशय ग्रीवा के म्यूकस को भी बदल देती है, जिससे शुक्राणुओं का आगे बढ़ना मुश्किल हो जाता है।',
    tip1Title: 'जानने लायक बात',
    tip1Text: 'गोलियाँ कई प्रकार की होती हैं, जिनमें कंबाइंड गोलियाँ और केवल प्रोजेस्टिन वाली गोलियाँ शामिल हैं। इनकी संरचना और लेने का तरीक़ा अलग हो सकता है।',
    body2: 'नियमित रूप से लेना ज़रूरी है। गोली के प्रकार के अनुसार, एक खुराक छूटने पर क्या करना है, यह अलग हो सकता है — इसलिए अपनी दवा के पैकेज में दी गई जानकारी की पर्ची ज़रूर देखें।',
    routineTips: [
      'दिन का ऐसा समय चुनें जो याद रखना आसान हो (खाने का समय, सोने से पहले...)',
      'ज़रूरत हो तो रिमाइंडर या ऐप की मदद लें',
      'शक होने पर देखने के लिए पैकेज की जानकारी पर्ची पास रखें',
    ],
    sectionIntro: 'हर गर्भनिरोधक तरीक़े की तरह, गोली के भी फ़ायदे हैं, लेकिन कुछ सीमाएँ भी हैं जिन्हें चुनने से पहले जानना चाहिए।',
    advantagesTitle: 'फ़ायदे',
    advantagesSubtitle: 'यह क्या दे सकती है',
    advantages: [
      'सही ढंग से लेने पर गर्भावस्था का जोखिम काफ़ी हद तक कम करती है',
      'पीरियड को ज़्यादा नियमित और अनुमानित बना सकती है',
      'कुछ महिलाओं में दर्द और रक्तस्राव कम कर सकती है',
      'अगर आपको सूट न करे तो इसे बदला या एडजस्ट किया जा सकता है',
    ],
    limitationsTitle: 'सीमाएँ',
    limitationsSubtitle: 'ध्यान रखने वाली बातें',
    limitations: [
      'गोली के प्रकार के अनुसार नियमित रूप से लेना ज़रूरी है',
      'खुराक छूटने से इसका असर कम हो सकता है',
      'कुछ महिलाओं को साइड इफ़ेक्ट हो सकते हैं',
      'यौन संचारित संक्रमणों (STI) से सुरक्षा नहीं देती',
    ],
    takeawayTitle: 'समझने लायक़ एक तरीक़ा',
    takeawayText: 'सही ढंग से लेने पर गोली एक प्रभावी हार्मोनल गर्भनिरोधक तरीक़ा है। नियमित रूप से लेना, इसके संभावित साइड इफ़ेक्ट, और STI से सुरक्षा न मिलना — ये जानना ज़रूरी बातें हैं।',
    finalTipText: 'अगर आप गर्भनिरोध के बारे में सोच रही हैं या आपका मौजूदा तरीक़ा आपके लिए ठीक नहीं चल रहा, तो डॉक्टर, दाई-नर्स (मिडवाइफ़) या किसी अन्य स्वास्थ्य विशेषज्ञ से बात करने में झिझकें नहीं।',
    shareMessage: 'गर्भनिरोधक गोली को समझें — AWA',
  },
  sq: {
    badge: 'TABLETA KONTRACEPTIVE',
    title: 'Të kuptojmë\ntabletën kontraceptive',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Si funksionon tableta, si merret çdo ditë, si dhe avantazhet dhe kufizimet kryesore të saj.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Si funksionon tableta',
      'Si merret saktë çdo ditë',
      'Avantazhet dhe kufizimet',
      'Pikat kryesore',
    ],
    body1: 'Tableta përmban hormone — estrogjen dhe/ose progestinë, sipas llojit — që veprojnë kryesisht duke parandaluar ose bllokuar ovulacionin. Ajo ndryshon edhe mukozën e qafës së mitrës, gjë që e bën më të vështirë kalimin e spermatozoideve.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Ka disa lloje tabletash, përfshirë tabletat e kombinuara dhe tabletat vetëm me progestinë. Përbërja dhe mënyra e marrjes së tyre mund të ndryshojnë.',
    body2: 'Të marrësh tabletën rregullisht ka rëndësi. Sipas llojit të tabletës, ajo që duhet bërë pas një doze të harruar mund të ndryshojë — ndaj është thelbësore të shikosh fletën e brendshme të ilaçit tënd.',
    routineTips: [
      'Zgjidh një kohë të ditës që e mban mend lehtë (një vakt, ora e gjumit...)',
      'Përdor një kujtesë ose një aplikacion nëse të nevojitet',
      'Mbaje fletën e brendshme afër në rast dyshimi',
    ],
    sectionIntro: 'Si çdo metodë kontraceptive, tableta ka avantazhe, por edhe disa kufizime që duhen njohur përpara se ta zgjedhësh.',
    advantagesTitle: 'Avantazhet',
    advantagesSubtitle: 'Çfarë mund të ofrojë',
    advantages: [
      'Zvogëlon shumë rrezikun e shtatzënisë kur përdoret saktë',
      'Mund t’i bëjë menstruacionet më të rregullta dhe më të parashikueshme',
      'Mund të zvogëlojë dhimbjen dhe gjakderdhjen te disa persona',
      'Mund të rregullohet ose të ndërrohet nëse nuk të përshtatet',
    ],
    limitationsTitle: 'Kufizimet',
    limitationsSubtitle: 'Pika që duhen ditur',
    limitations: [
      'Kërkon marrje të rregullt, në varësi të llojit të tabletës',
      'Dozat e harruara mund ta ulin efektivitetin e saj',
      'Disa persona mund të kenë efekte anësore',
      'Nuk mbron nga infeksionet seksualisht të transmetueshme (IST)',
    ],
    takeawayTitle: 'Një metodë që ia vlen ta kuptosh',
    takeawayText: 'Tableta është një metodë kontraceptive hormonale efektive kur përdoret saktë. Marrja e rregullt, efektet e mundshme anësore dhe mungesa e mbrojtjes nga IST janë gjëra të rëndësishme për t’u ditur.',
    finalTipText: 'Nëse po mendon për kontracepsionin ose metoda jote aktuale nuk po të shkon mirë, mos ngurro të flasësh me një mjek, me maminë ose me një profesionist tjetër të shëndetësisë.',
    shareMessage: 'Të kuptojmë tabletën kontraceptive — AWA',
  },
  ja: {
    badge: '経口避妊薬（ピル）',
    title: 'ピルについて\n理解する',
    metaDuration: '読了7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: 'ピルのしくみ、毎日の飲み方、主なメリットと注意点を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      'ピルのしくみ',
      '毎日きちんと服用するには',
      'メリットと注意点',
      'この記事のポイント',
    ],
    body1: 'ピルにはホルモンが含まれています。種類によってエストロゲンやプロゲスチン（またはその両方）が使われ、主に排卵を抑えたり妨げたりすることで働きます。また、子宮頸管の粘液を変化させ、精子が通りにくくなるようにします。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'ピルにはいくつかの種類があり、たとえば複合ピルやプロゲスチン単独のピルなどがあります。成分や飲み方は種類によって異なることがあります。',
    body2: '続けて正しく服用することが大切です。飲み忘れたときの対処法はピルの種類によって異なるため、必ず薬の添付文書を確認してください。',
    routineTips: [
      '食事や就寝前など、覚えやすい時間を決める',
      '必要に応じてリマインダーやアプリを使う',
      '迷ったときのために添付文書を手元に置いておく',
    ],
    sectionIntro: 'ほかの避妊法と同じように、ピルにもメリットがある一方で、選ぶ前に知っておきたい注意点があります。',
    advantagesTitle: 'メリット',
    advantagesSubtitle: '期待できること',
    advantages: [
      '正しく使えば、妊娠の可能性を大きく下げられる',
      '生理が規則的になり、予測しやすくなることがある',
      '人によっては、痛みや出血量が軽くなることがある',
      '体に合わない場合は、調整したり変更したりできる',
    ],
    limitationsTitle: '注意点',
    limitationsSubtitle: '知っておきたいこと',
    limitations: [
      'ピルの種類によっては、決まったタイミングでの服用が必要',
      '飲み忘れがあると、効果が下がることがある',
      '人によっては副作用が出ることがある',
      '性感染症（STI）は防げない',
    ],
    takeawayTitle: '理解しておきたい方法',
    takeawayText: 'ピルは、正しく使えば効果の高いホルモン避妊法です。続けて服用すること、起こりうる副作用、性感染症を防げないことは、知っておきたい大切なポイントです。',
    finalTipText: '避妊を考えているとき、または今の方法が合わないと感じるときは、ためらわずに医師、助産師、またはほかの医療従事者に相談してください。',
    shareMessage: 'ピルについて理解する — AWA',
  },
  ko: {
    badge: '피임약',
    title: '피임약,\n제대로 이해하기',
    metaDuration: '읽는 데 7분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '피임약이 어떻게 작용하는지, 매일 어떻게 복용하는지, 주요 장점과 한계는 무엇인지 알아봐요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '피임약이 작용하는 방식',
      '매일 올바르게 복용하기',
      '장점과 한계',
      '핵심 정리',
    ],
    body1: '피임약에는 종류에 따라 에스트로겐이나 프로게스틴, 또는 두 가지 호르몬이 들어 있고, 주로 배란을 막거나 억제하는 방식으로 작용해요. 자궁경부 점액도 변화시켜서 정자가 통과하기 어렵게 만들어요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '피임약에는 복합 피임약과 프로게스틴 단독 피임약 등 여러 종류가 있어요. 성분과 복용 방법은 서로 다를 수 있어요.',
    body2: '꾸준히 복용하는 것이 중요해요. 약의 종류에 따라 복용을 잊었을 때 대처 방법이 다를 수 있으니, 약에 들어 있는 설명서를 꼭 확인하세요.',
    routineTips: [
      '기억하기 쉬운 시간대를 정해 보세요(식사 시간, 잠자리에 들기 전 등).',
      '필요하면 알림이나 앱을 활용하세요.',
      '헷갈릴 때를 대비해 설명서를 가까이에 두세요.',
    ],
    sectionIntro: '다른 피임 방법과 마찬가지로 피임약에도 장점과 함께, 선택하기 전에 알아 두어야 할 한계가 있어요.',
    advantagesTitle: '장점',
    advantagesSubtitle: '기대할 수 있는 점',
    advantages: [
      '올바르게 복용하면 임신 위험을 크게 줄여 줘요.',
      '생리가 더 규칙적이고 예측하기 쉬워질 수 있어요.',
      '사람에 따라 통증과 출혈량이 줄어들 수 있어요.',
      '맞지 않으면 조정하거나 바꿀 수 있어요.',
    ],
    limitationsTitle: '한계',
    limitationsSubtitle: '알아 두어야 할 점',
    limitations: [
      '피임약 종류에 따라 규칙적으로 복용해야 해요.',
      '복용을 잊으면 효과가 떨어질 수 있어요.',
      '사람에 따라 부작용이 나타날 수 있어요.',
      '성매개감염병(STI)은 예방해 주지 않아요.',
    ],
    takeawayTitle: '알아 둘 만한 피임 방법',
    takeawayText: '피임약은 올바르게 복용하면 효과적인 호르몬 피임 방법이에요. 꾸준한 복용, 나타날 수 있는 부작용, 그리고 STI를 예방해 주지 않는다는 점은 꼭 알아 두어야 해요.',
    finalTipText: '피임을 고민 중이거나 지금 쓰는 방법이 맞지 않는다면 망설이지 말고 의사, 조산사 또는 다른 의료 전문가와 상담하세요.',
    shareMessage: '피임약, 제대로 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'PÍLULA CONTRACETIVA',
    title: 'Compreender\na pílula contracetiva',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Como funciona a pílula, como tomá-la no dia a dia, e as suas principais vantagens e limitações.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Como funciona a pílula',
      'Tomá-la corretamente todos os dias',
      'Vantagens e limitações',
      'Pontos-chave',
    ],
    body1: 'A pílula contém hormonas — estrogénio e/ou progestagénio, consoante o tipo — que atuam principalmente impedindo ou bloqueando a ovulação. Altera também o muco cervical, o que dificulta a passagem dos espermatozoides.',
    tip1Title: 'Bom saber',
    tip1Text: 'Existem vários tipos de pílula, incluindo as pílulas combinadas e as pílulas só com progestagénio. A sua composição e a forma de as tomar podem variar.',
    body2: 'Tomá-la com regularidade é importante. Consoante o tipo de pílula, o que fazer após um esquecimento pode ser diferente — por isso é essencial consultar o folheto informativo do seu medicamento.',
    routineTips: [
      'Escolha um momento do dia fácil de recordar (uma refeição, a hora de deitar...)',
      'Use um lembrete ou uma aplicação, se necessário',
      'Tenha o folheto informativo à mão em caso de dúvida',
    ],
    sectionIntro: 'Como qualquer método contracetivo, a pílula tem vantagens, mas também certas limitações que convém conhecer antes de a escolher.',
    advantagesTitle: 'Vantagens',
    advantagesSubtitle: 'O que pode oferecer',
    advantages: [
      'Reduz muito o risco de gravidez quando usada corretamente',
      'Pode tornar os períodos mais regulares e previsíveis',
      'Pode reduzir a dor e o fluxo em algumas pessoas',
      'Pode ser ajustada ou mudada se não lhe convier',
    ],
    limitationsTitle: 'Limitações',
    limitationsSubtitle: 'Pontos a ter em conta',
    limitations: [
      'Exige uma toma regular, consoante o tipo de pílula',
      'Os esquecimentos podem reduzir a sua eficácia',
      'Algumas pessoas podem sentir efeitos secundários',
      'Não protege contra infeções sexualmente transmissíveis (IST)',
    ],
    takeawayTitle: 'Um método que vale a pena compreender',
    takeawayText: 'A pílula é um método contracetivo hormonal eficaz quando usado corretamente. A regularidade da toma, os possíveis efeitos secundários e a ausência de proteção contra as IST são aspetos importantes a conhecer.',
    finalTipText: 'Se está a pensar em contraceção ou se o seu método atual não lhe convém, não hesite em falar com um médico, uma parteira ou outro profissional de saúde.',
    shareMessage: 'Compreender a pílula contracetiva — AWA',
  },
  bn: {
    badge: 'জন্মনিয়ন্ত্রণ বড়ি',
    title: 'জন্মনিয়ন্ত্রণ বড়ি\nবোঝা',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'বড়ি কীভাবে কাজ করে, প্রতিদিন কীভাবে খেতে হয় এবং এর প্রধান সুবিধা ও সীমাবদ্ধতা।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'বড়ি কীভাবে কাজ করে',
      'প্রতিদিন সঠিকভাবে খাওয়া',
      'সুবিধা ও সীমাবদ্ধতা',
      'মূল কথা',
    ],
    body1: 'বড়িতে হরমোন থাকে — ধরন অনুযায়ী ইস্ট্রোজেন ও/অথবা প্রজেস্টিন — যা মূলত ডিম্বস্ফোটন প্রতিরোধ বা বন্ধ করে কাজ করে। এটি জরায়ুমুখের শ্লেষ্মাও বদলে দেয়, ফলে শুক্রাণুর পক্ষে এর মধ্য দিয়ে যাওয়া কঠিন হয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'বড়ির একাধিক ধরন আছে, যেমন সম্মিলিত বড়ি ও শুধু প্রজেস্টিনযুক্ত বড়ি। এদের উপাদান এবং খাওয়ার নিয়ম ভিন্ন হতে পারে।',
    body2: 'নিয়মিত খাওয়া গুরুত্বপূর্ণ। বড়ির ধরন অনুযায়ী কোনো ডোজ বাদ পড়লে কী করতে হবে তা আলাদা হতে পারে — তাই আপনার ওষুধের প্যাকেটের সঙ্গে থাকা তথ্যপত্র দেখে নেওয়া জরুরি।',
    routineTips: [
      'দিনের এমন একটি সময় বেছে নিন যা মনে রাখা সহজ (খাবারের সময়, ঘুমানোর আগে...)',
      'প্রয়োজনে রিমাইন্ডার বা অ্যাপ ব্যবহার করুন',
      'সন্দেহ হলে দেখার জন্য তথ্যপত্রটি হাতের কাছে রাখুন',
    ],
    sectionIntro: 'অন্য যেকোনো জন্মনিয়ন্ত্রণ পদ্ধতির মতো বড়িরও সুবিধা আছে, পাশাপাশি কিছু সীমাবদ্ধতাও আছে যা বেছে নেওয়ার আগে জানা দরকার।',
    advantagesTitle: 'সুবিধা',
    advantagesSubtitle: 'এটি কী দিতে পারে',
    advantages: [
      'সঠিকভাবে ব্যবহার করলে গর্ভধারণের ঝুঁকি অনেক কমায়',
      'মাসিক আরও নিয়মিত ও আগাম অনুমানযোগ্য করতে পারে',
      'কিছু মানুষের ক্ষেত্রে ব্যথা ও রক্তক্ষরণ কমাতে পারে',
      'উপযুক্ত না হলে বদলানো বা সমন্বয় করা যায়',
    ],
    limitationsTitle: 'সীমাবদ্ধতা',
    limitationsSubtitle: 'যেসব বিষয় জানা দরকার',
    limitations: [
      'বড়ির ধরন অনুযায়ী নিয়মিত খেতে হয়',
      'ডোজ বাদ পড়লে কার্যকারিতা কমে যেতে পারে',
      'কারও কারও পার্শ্বপ্রতিক্রিয়া হতে পারে',
      'যৌনবাহিত সংক্রমণ (এসটিআই) থেকে সুরক্ষা দেয় না',
    ],
    takeawayTitle: 'বোঝার মতো একটি পদ্ধতি',
    takeawayText: 'সঠিকভাবে ব্যবহার করলে বড়ি একটি কার্যকর হরমোনাল জন্মনিয়ন্ত্রণ পদ্ধতি। নিয়মিত খাওয়া, সম্ভাব্য পার্শ্বপ্রতিক্রিয়া এবং এসটিআই থেকে সুরক্ষা না দেওয়া — এগুলো জানা জরুরি।',
    finalTipText: 'আপনি যদি জন্মনিয়ন্ত্রণের কথা ভাবেন, অথবা আপনার বর্তমান পদ্ধতি আপনার জন্য কাজ না করে, তবে ডাক্তার, ধাত্রী বা অন্য কোনো স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলতে দ্বিধা করবেন না।',
    shareMessage: 'জন্মনিয়ন্ত্রণ বড়ি বোঝা — AWA',
  },
  da: {
    badge: 'P-PILLE',
    title: 'At forstå\np-pillen',
    metaDuration: '7 min læsning',
    metaType: 'Guide',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvordan pillen virker, hvordan man tager den dagligt, og dens vigtigste fordele og begrænsninger.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan pillen virker',
      'At tage den korrekt hver dag',
      'Fordele og begrænsninger',
      'Vigtige pointer',
    ],
    body1: 'Pillen indeholder hormoner — afhængigt af typen østrogen og/eller progestin — der primært virker ved at forhindre eller stoppe ægløsning. Den ændrer også livmoderhalsslim, hvilket gør det sværere for sæd at passere igennem.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Der findes flere typer piller, som kombinerede piller og mini-piller. Deres sammensætning og brugsanvisning kan variere.',
    body2: 'Det er vigtigt at tage den regelmæssigt. Hvad man skal gøre, hvis man glemmer en pille, kan variere afhængigt af pilletypen — det er derfor vigtigt at læse indlægssedlen i din pakke.',
    routineTips: [
      'Vælg et tidspunkt på dagen, der er nemt at huske (til et måltid, inden sengetid...)',
      'Brug en påmindelse eller en app om nødvendigt',
      'Opbevar indlægssedlen inden for rækkevidde ved tvivl',
    ],
    sectionIntro: 'Ligesom enhver anden præventionsmetode har pillen fordele, men der er også begrænsninger, du bør kende, inden du vælger den.',
    advantagesTitle: 'Fordele',
    advantagesSubtitle: 'Hvad den kan tilbyde',
    advantages: [
      'Reducerer kraftigt risikoen for graviditet ved korrekt brug',
      'Kan gøre menstruationen mere regelmæssig og forudsigelig',
      'Kan reducere smerter og blødning hos visse personer',
      'Kan justeres eller skiftes, hvis den ikke passer dig',
    ],
    limitationsTitle: 'Begrænsninger',
    limitationsSubtitle: 'Hvad du bør vide',
    limitations: [
      'Skal tages regelmæssigt afhængigt af pilletypen',
      'Effektiviteten kan reduceres, hvis en dosis glemmes',
      'Kan give bivirkninger hos visse personer',
      'Beskytter ikke mod seksuelt overførte infektioner (STI)',
    ],
    takeawayTitle: 'En metode, det er værd at forstå',
    takeawayText: 'P-pillen er en effektiv hormonel præventionsmetode ved korrekt brug. Regelmæssig indtagelse, mulige bivirkninger og ingen beskyttelse mod STI — det er vigtigt at kende disse faktorer.',
    finalTipText: 'Hvis du overvejer prævention, eller hvis din nuværende metode ikke virker for dig, tøv ikke med at tale med en læge, jordemoder eller anden sundhedsprofessionel.',
    shareMessage: 'At forstå p-pillen — AWA',
  },
  sv: {
    badge: 'P-PILLE',
    title: 'At forstå\np-pillen',
    metaDuration: '7 min läsning',
    metaType: 'Guide',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvordan pillen virker, hvordan man tager den dagligt, och dens vigtigste fordele och begränsninger.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan pillen virker',
      'At tage den korrekt hver dag',
      'Fordele och begränsninger',
      'Vigtige pointer',
    ],
    body1: 'Pillen indeholder hormoner — afhängigt av typen östrogen og/eller progestin — der primärt virker ved at forhindre eller stoppe äglösning. Den ändrer også livmoderhalsslim, hvilket gör det svärere for säd at passere igennem.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Der findes flere typer piller, som kombinerede piller och mini-piller. Deres sammensätning och brugsanvisning kan variere.',
    body2: 'Det ar vigtigt at tage den regelmässigt. Hvad man skal göre, hvis man glemmer en pille, kan variere afhängigt av pilletypen — det ar derfor vigtigt at läse indlägssedlen i din pakke.',
    routineTips: [
      'Välg et tidspunkt på dagen, der ar nemt at huske (til et måltid, inden sengetid...)',
      'Brug en påmindelse eller en app om nödvendigt',
      'Opbevar indlägssedlen inden for räkkevidde ved tvivl',
    ],
    sectionIntro: 'Ligesom enhver anden präventionsmetode har pillen fordele, men der ar også begränsninger, du bör kende, inden du välger den.',
    advantagesTitle: 'Fordele',
    advantagesSubtitle: 'Hvad den kan tilbyde',
    advantages: [
      'Reducerer kraftigt risikoen for graviditet ved korrekt brug',
      'Kan göre menstruationen mere regelmässig och forudsigelig',
      'Kan reducere smartor och blödning hos visse personer',
      'Kan justeres eller skiftes, hvis den inte passer dig',
    ],
    limitationsTitle: 'Begränsninger',
    limitationsSubtitle: 'Hvad du bör vide',
    limitations: [
      'Skal tages regelmässigt afhängigt av pilletypen',
      'Effektiviteten kan reduceres, hvis en dosis glemmes',
      'Kan give bivirkninger hos visse personer',
      'Beskytter inte mod seksuelt overförte infektioner (STI)',
    ],
    takeawayTitle: 'En metode, det ar värd at forstå',
    takeawayText: 'P-pillen ar en effektiv hormonel präventionsmetode ved korrekt brug. Regelmässig indtagelse, mulige bivirkninger och ingen beskyttelse mod STI — det ar vigtigt at kende disse faktorer.',
    finalTipText: 'Hvis du overvejer prävention, eller hvis din nuvärende metode inte virker for dig, töv inte med at tale med en läge, jordemoder eller anden halsasprofessionel.',
    shareMessage: 'At forstå p-pillen — AWA',
  },
  nb: {
    badge: 'P-PILLE',
    title: 'Forstå\np-pillen',
    metaDuration: '7 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvordan p-pillen virker, hvordan du tar den i hverdagen, og dens viktigste fordeler og begrensninger.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvordan p-pillen virker',
      'Ta den riktig hver dag',
      'Fordeler og begrensninger',
      'Det viktigste å huske',
    ],
    body1: 'P-pillen inneholder hormoner – østrogen og/eller gestagen, avhengig av type – som hovedsakelig virker ved å hindre eller blokkere eggløsning. Den endrer også livmorhalsslimet, noe som gjør det vanskeligere for sædceller å komme gjennom.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Det finnes flere typer p-piller, blant annet kombinasjonspiller og minipiller med bare gestagen. Sammensetningen og måten de tas på kan variere.',
    body2: 'Det er viktig å ta den regelmessig. Avhengig av type p-pille kan det du bør gjøre etter en glemt dose, variere – så det er viktig å lese pakningsvedlegget til legemidlet ditt.',
    routineTips: [
      'Velg et tidspunkt på dagen som er lett å huske (et måltid, leggetid …)',
      'Bruk en påminnelse eller en app ved behov',
      'Ha pakningsvedlegget for hånden hvis du er i tvil',
    ],
    sectionIntro: 'Som alle prevensjonsmetoder har p-pillen fordeler, men også noen begrensninger det er greit å kjenne til før du velger den.',
    advantagesTitle: 'Fordeler',
    advantagesSubtitle: 'Hva den kan gi',
    advantages: [
      'Reduserer risikoen for graviditet betydelig når den brukes riktig',
      'Kan gjøre mensen mer regelmessig og forutsigbar',
      'Kan redusere smerter og blødning hos noen',
      'Kan justeres eller byttes hvis den ikke passer deg',
    ],
    limitationsTitle: 'Begrensninger',
    limitationsSubtitle: 'Punkter å være oppmerksom på',
    limitations: [
      'Krever regelmessig inntak, avhengig av type p-pille',
      'Glemte doser kan redusere effekten',
      'Noen kan oppleve bivirkninger',
      'Beskytter ikke mot seksuelt overførbare infeksjoner (SOI)',
    ],
    takeawayTitle: 'En metode som er verdt å forstå',
    takeawayText: 'P-pillen er en effektiv hormonell prevensjonsmetode når den brukes riktig. Regelmessig inntak, mulige bivirkninger og manglende beskyttelse mot SOI er viktig å vite.',
    finalTipText: 'Hvis du vurderer prevensjon eller den nåværende metoden ikke fungerer for deg, ikke nøl med å snakke med lege, jordmor eller annet helsepersonell.',
    shareMessage: 'Forstå p-pillen – AWA',
  },
  pl: {
    badge: 'TABLETKA ANTYKONCEPCYJNA',
    title: 'Zrozumieć\ntabletkę antykoncepcyjną',
    metaDuration: '7 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Jak działa tabletka, jak ją przyjmować na co dzień oraz jej główne zalety i ograniczenia.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Jak działa tabletka',
      'Prawidłowe codzienne przyjmowanie',
      'Zalety i ograniczenia',
      'Najważniejsze wnioski',
    ],
    body1: 'Tabletka zawiera hormony — estrogen i/lub progestagen, zależnie od rodzaju — które działają głównie przez zapobieganie owulacji lub jej blokowanie. Zmienia też śluz szyjkowy, co utrudnia plemnikom przejście.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Istnieje kilka rodzajów tabletek, w tym tabletki złożone i tabletki zawierające wyłącznie progestagen. Ich skład i sposób przyjmowania mogą się różnić.',
    body2: 'Regularne przyjmowanie ma znaczenie. W zależności od rodzaju tabletki postępowanie po pominiętej dawce może być inne — dlatego niezbędne jest sprawdzenie ulotki leku.',
    routineTips: [
      'Wybierz porę dnia, którą łatwo zapamiętać (posiłek, pora snu…)',
      'W razie potrzeby użyj przypomnienia lub aplikacji',
      'Miej ulotkę pod ręką na wypadek wątpliwości',
    ],
    sectionIntro: 'Jak każda metoda antykoncepcji, tabletka ma zalety, ale też pewne ograniczenia, które warto znać przed wyborem.',
    advantagesTitle: 'Zalety',
    advantagesSubtitle: 'Co może zaoferować',
    advantages: [
      'Znacznie zmniejsza ryzyko ciąży przy prawidłowym stosowaniu',
      'Może sprawić, że miesiączki będą bardziej regularne i przewidywalne',
      'U niektórych osób może zmniejszać ból i krwawienie',
      'Można ją dostosować lub zmienić, jeśli nie jest odpowiednia',
    ],
    limitationsTitle: 'Ograniczenia',
    limitationsSubtitle: 'Na co zwrócić uwagę',
    limitations: [
      'Wymaga regularnego przyjmowania, zależnie od rodzaju tabletki',
      'Pominięte dawki mogą zmniejszać jej skuteczność',
      'U niektórych osób mogą wystąpić skutki uboczne',
      'Nie chroni przed chorobami przenoszonymi drogą płciową',
    ],
    takeawayTitle: 'Metoda, którą warto zrozumieć',
    takeawayText: 'Tabletka jest skuteczną hormonalną metodą antykoncepcji przy prawidłowym stosowaniu. Warto wiedzieć o regularnym przyjmowaniu, możliwych skutkach ubocznych i braku ochrony przed chorobami przenoszonymi drogą płciową.',
    finalTipText: 'Jeśli rozważasz antykoncepcję lub obecna metoda Ci nie odpowiada, nie wahaj się porozmawiać z lekarzem, położną lub innym specjalistą.',
    shareMessage: 'Zrozumieć tabletkę antykoncepcyjną — AWA',
  },
  uk: {
    badge: 'КОНТРАЦЕПТИВНА ТАБЛЕТКА',
    title: 'Розуміння\nконтрацептивної таблетки',
    metaDuration: '7 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Як працює таблетка, як приймати її щодня та її основні переваги й обмеження.',
    contentsTitle: 'У цій статті',
    topics: [
      'Як працює таблетка',
      'Правильний щоденний прийом',
      'Переваги та обмеження',
      'Головні висновки',
    ],
    body1: 'Таблетка містить гормони — естроген і/або прогестаген, залежно від типу, — які діють головним чином, запобігаючи овуляції або блокуючи її. Вона також змінює цервікальний слиз, що ускладнює проходження сперматозоїдів.',
    tip1Title: 'Варто знати',
    tip1Text: 'Існує кілька типів таблеток, зокрема комбіновані та таблетки лише з прогестагеном. Їхній склад і спосіб прийому можуть відрізнятися.',
    body2: 'Регулярність прийому важлива. Залежно від типу таблетки дії після пропущеної дози можуть відрізнятися — тому необхідно перевіряти інструкцію до вашого препарату.',
    routineTips: [
      'Оберіть час доби, який легко запам’ятати (їжа, відхід до сну…)',
      'За потреби скористайтеся нагадуванням або застосунком',
      'Тримайте інструкцію під рукою на випадок сумнівів',
    ],
    sectionIntro: 'Як і будь-який метод контрацепції, таблетка має переваги, але й певні обмеження, які варто знати до вибору.',
    advantagesTitle: 'Переваги',
    advantagesSubtitle: 'Що вона може запропонувати',
    advantages: [
      'Значно знижує ризик вагітності за правильного застосування',
      'Може зробити менструації регулярнішими та передбачуванішими',
      'У деяких людей може зменшувати біль і кровотечу',
      'Можна підлаштувати або замінити, якщо вона не підходить',
    ],
    limitationsTitle: 'Обмеження',
    limitationsSubtitle: 'На що звернути увагу',
    limitations: [
      'Потребує регулярного прийому залежно від типу таблетки',
      'Пропущені дози можуть знижувати її ефективність',
      'У деяких людей можуть виникати побічні ефекти',
      'Не захищає від інфекцій, що передаються статевим шляхом',
    ],
    takeawayTitle: 'Метод, який варто зрозуміти',
    takeawayText: 'Таблетка — ефективний гормональний метод контрацепції за правильного застосування. Важливо знати про регулярність прийому, можливі побічні ефекти та відсутність захисту від інфекцій, що передаються статевим шляхом.',
    finalTipText: 'Якщо ви розглядаєте контрацепцію або поточний метод вам не підходить, не вагайтеся поговорити з лікарем, акушеркою чи іншим медичним фахівцем.',
    shareMessage: 'Розуміння контрацептивної таблетки — AWA',
  },
  cs: {
    badge: 'ANTIKONCEPČNÍ PILULKA',
    title: 'Pochopení\nantikoncepční pilulky',
    metaDuration: '7 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Jak pilulka funguje, jak ji užívat v každodenním životě a jaké jsou její hlavní výhody a limity.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Jak pilulka funguje',
      'Správné každodenní užívání',
      'Výhody a limity',
      'Hlavní poznatky',
    ],
    body1: 'Pilulka obsahuje hormony — estrogen a/nebo gestagen, podle typu — které působí především tím, že zabraňují ovulaci nebo ji blokují. Mění také cervikální hlen, takže je pro spermie těžší jím projít.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Existuje několik typů pilulek, například kombinované pilulky a pilulky obsahující pouze gestagen. Jejich složení a způsob užívání se mohou lišit.',
    body2: 'Důležité je užívat ji pravidelně. Podle typu pilulky se postup po vynechané dávce může lišit — proto je nezbytné přečíst si příbalový leták svého léku.',
    routineTips: [
      'Zvolte denní dobu, kterou si snadno zapamatujete (jídlo, večerní uléhání...)',
      'V případě potřeby použijte připomínku nebo aplikaci',
      'Mějte příbalový leták po ruce pro případ pochybností',
    ],
    sectionIntro: 'Jako každá antikoncepční metoda má pilulka výhody, ale také určité limity, které je dobré znát před jejím výběrem.',
    advantagesTitle: 'Výhody',
    advantagesSubtitle: 'Co může nabídnout',
    advantages: [
      'Při správném užívání výrazně snižuje riziko otěhotnění',
      'Může zpravidelnit a učinit menstruaci předvídatelnější',
      'U některých žen může zmírnit bolest a krvácení',
      'Lze ji upravit nebo změnit, pokud vám nevyhovuje',
    ],
    limitationsTitle: 'Limity',
    limitationsSubtitle: 'Na co je třeba dát pozor',
    limitations: [
      'Vyžaduje pravidelné užívání podle typu pilulky',
      'Vynechané dávky mohou snížit její účinnost',
      'U některých žen se mohou objevit nežádoucí účinky',
      'Nechrání před sexuálně přenosnými infekcemi',
    ],
    takeawayTitle: 'Metoda, které stojí za to porozumět',
    takeawayText: 'Pilulka je při správném užívání účinná hormonální antikoncepční metoda. Důležité je vědět, že se musí užívat pravidelně, jaké má možné nežádoucí účinky a že nechrání před sexuálně přenosnými infekcemi.',
    finalTipText: 'Pokud o antikoncepci uvažujete nebo vám vaše současná metoda nevyhovuje, neváhejte si promluvit s lékařem, porodní asistentkou nebo jiným zdravotnickým pracovníkem.',
    shareMessage: 'Pochopení antikoncepční pilulky — AWA',
  },
  sk: {
    badge: 'ANTIKONCEPČNÁ TABLETA',
    title: 'Pochopenie\nantikoncepčnej tablety',
    metaDuration: '7 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Ako tableta funguje, ako ju užívať každý deň a aké sú jej hlavné výhody a obmedzenia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Ako tableta funguje',
      'Správne užívanie každý deň',
      'Výhody a obmedzenia',
      'Hlavné body',
    ],
    body1: 'Tableta obsahuje hormóny — estrogén a/alebo gestagén, podľa typu — ktoré pôsobia najmä tak, že bránia ovulácii alebo ju blokujú. Mení aj cervikálny hlien, čo spermiám sťažuje prechod.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Existuje niekoľko typov tabliet, vrátane kombinovaných a čisto gestagénových. Ich zloženie a spôsob užívania sa môžu líšiť.',
    body2: 'Dôležité je užívať ju pravidelne. Podľa typu tablety sa môže postup po vynechanej dávke líšiť — preto je nevyhnutné pozrieť si písomnú informáciu pre používateľa vášho lieku.',
    routineTips: [
      'Vyberte si čas počas dňa, ktorý si ľahko zapamätáte (jedlo, ukladanie do postele…)',
      'Podľa potreby použite pripomienku alebo aplikáciu',
      'Písomnú informáciu majte po ruke pre prípad pochybností',
    ],
    sectionIntro: 'Ako každá antikoncepčná metóda má aj tableta výhody, ale aj určité obmedzenia, ktoré je dobré poznať ešte pred jej výberom.',
    advantagesTitle: 'Výhody',
    advantagesSubtitle: 'Čo môže ponúknuť',
    advantages: [
      'Pri správnom používaní výrazne znižuje riziko otehotnenia',
      'Môže urobiť menštruáciu pravidelnejšou a predvídateľnejšou',
      'U niektorých žien môže zmierniť bolesť a krvácanie',
      'Dá sa upraviť alebo zmeniť, ak vám nevyhovuje',
    ],
    limitationsTitle: 'Obmedzenia',
    limitationsSubtitle: 'Body, na ktoré treba myslieť',
    limitations: [
      'Vyžaduje pravidelné užívanie podľa typu tablety',
      'Vynechané dávky môžu znížiť jej účinnosť',
      'Niektoré ženy môžu mať vedľajšie účinky',
      'Nechráni pred sexuálne prenosnými infekciami (STI)',
    ],
    takeawayTitle: 'Metóda, ktorú stojí za to poznať',
    takeawayText: 'Tableta je pri správnom používaní účinnou hormonálnou antikoncepčnou metódou. Pravidelné užívanie, možné vedľajšie účinky a absencia ochrany pred STI sú dôležité veci, ktoré treba vedieť.',
    finalTipText: 'Ak uvažujete o antikoncepcii alebo vám súčasná metóda nevyhovuje, neváhajte sa porozprávať s lekárom, pôrodnou asistentkou alebo iným zdravotníckym pracovníkom.',
    shareMessage: 'Pochopenie antikoncepčnej tablety — AWA',
  },
  hu: {
    badge: 'FOGAMZÁSGÁTLÓ TABLETTA',
    title: 'A fogamzásgátló\ntabletta megértése',
    metaDuration: '7 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Hogyan működik a tabletta, hogyan kell mindennap szedni, és melyek a fő előnyei és korlátai.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Hogyan működik a tabletta',
      'A helyes szedés minden nap',
      'Előnyök és korlátok',
      'Legfontosabb tudnivalók',
    ],
    body1: 'A tabletta hormonokat — típustól függően ösztrogént és/vagy gesztagént — tartalmaz, amelyek főként a peteérés megakadályozásával vagy blokkolásával hatnak. Megváltoztatja a méhnyaknyálkát is, ami megnehezíti a spermiumok áthaladását.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Többféle tabletta létezik, köztük kombinált és csak gesztagént tartalmazó tabletták. Összetételük és szedésük módja eltérhet.',
    body2: 'A rendszeres szedés fontos. A tabletta típusától függően az elfelejtett adag utáni teendők eltérhetnek — ezért elengedhetetlen a gyógyszered betegtájékoztatójának ellenőrzése.',
    routineTips: [
      'Válassz egy könnyen megjegyezhető napszakot (étkezés, lefekvés…)',
      'Szükség esetén használj emlékeztetőt vagy alkalmazást',
      'Tartsd kéznél a betegtájékoztatót kétség esetére',
    ],
    sectionIntro: 'Mint minden fogamzásgátló módszernek, a tablettának is vannak előnyei, de bizonyos korlátai is, amelyeket érdemes ismerni a választás előtt.',
    advantagesTitle: 'Előnyök',
    advantagesSubtitle: 'Amit nyújthat',
    advantages: [
      'Helyes használat esetén jelentősen csökkenti a terhesség kockázatát',
      'Szabályosabbá és kiszámíthatóbbá teheti a menstruációt',
      'Egyeseknél csökkentheti a fájdalmat és a vérzést',
      'Módosítható vagy cserélhető, ha nem felel meg neked',
    ],
    limitationsTitle: 'Korlátok',
    limitationsSubtitle: 'Tudnivalók',
    limitations: [
      'A tabletta típusától függően rendszeres szedést igényel',
      'A kihagyott adagok csökkenthetik a hatékonyságát',
      'Egyeseknél mellékhatások jelentkezhetnek',
      'Nem véd a szexuális úton terjedő fertőzések (STI) ellen',
    ],
    takeawayTitle: 'Egy módszer, amelyet érdemes megérteni',
    takeawayText: 'A tabletta helyes használat esetén hatékony hormonális fogamzásgátló módszer. A rendszeres szedés, a lehetséges mellékhatások és az STI-k elleni védelem hiánya fontos tudnivalók.',
    finalTipText: 'Ha fogamzásgátlásra gondolsz, vagy a jelenlegi módszered nem felel meg neked, ne habozz beszélni orvossal, szülésznővel vagy más egészségügyi szakemberrel.',
    shareMessage: 'A fogamzásgátló tabletta megértése — AWA',
  },
  ro: {
    badge: 'PILULA CONTRACEPTIVĂ',
    title: 'Înțelegerea\npilulei contraceptive',
    metaDuration: '7 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Cum funcționează pilula, cum se ia zi de zi și principalele ei avantaje și limite.',
    contentsTitle: 'În acest articol',
    topics: [
      'Cum funcționează pilula',
      'Luarea corectă în fiecare zi',
      'Avantaje și limite',
      'Ce să reții',
    ],
    body1: 'Pilula conține hormoni — estrogen și/sau progestativ, în funcție de tip — care acționează în principal prin împiedicarea sau blocarea ovulației. Ea modifică și mucusul cervical, ceea ce face mai dificilă trecerea spermatozoizilor.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Există mai multe tipuri de pilule, inclusiv pilule combinate și pilule doar cu progestativ. Compoziția și modul de administrare pot varia.',
    body2: 'Regularitatea în luare contează. În funcție de tipul de pilulă, ce trebuie făcut după o doză uitată poate diferi — de aceea este esențial să verifici prospectul medicamentului tău.',
    routineTips: [
      'Alege un moment al zilei ușor de ținut minte (o masă, ora de culcare...)',
      'Folosește un memento sau o aplicație, la nevoie',
      'Păstrează prospectul la îndemână în caz de îndoială',
    ],
    sectionIntro: 'Ca orice metodă contraceptivă, pilula are avantaje, dar și anumite limite care trebuie cunoscute înainte de a o alege.',
    advantagesTitle: 'Avantaje',
    advantagesSubtitle: 'Ce poate oferi',
    advantages: [
      'Reduce foarte mult riscul de sarcină atunci când este folosită corect',
      'Poate face menstruațiile mai regulate și mai previzibile',
      'Poate reduce durerea și sângerarea la unele persoane',
      'Poate fi ajustată sau schimbată dacă nu ți se potrivește',
    ],
    limitationsTitle: 'Limite',
    limitationsSubtitle: 'Aspecte de cunoscut',
    limitations: [
      'Necesită o administrare regulată, în funcție de tipul de pilulă',
      'Dozele uitate pot reduce eficacitatea ei',
      'Unele persoane pot avea efecte secundare',
      'Nu protejează împotriva infecțiilor cu transmitere sexuală (ITS)',
    ],
    takeawayTitle: 'O metodă care merită înțeleasă',
    takeawayText: 'Pilula este o metodă contraceptivă hormonală eficientă atunci când este folosită corect. Regularitatea în luare, posibilele ei efecte secundare și lipsa protecției împotriva ITS sunt lucruri importante de știut.',
    finalTipText: 'Dacă te gândești la contracepție sau metoda ta actuală nu ți se potrivește, nu ezita să vorbești cu un medic, o moașă sau alt profesionist din domeniul sănătății.',
    shareMessage: 'Înțelegerea pilulei contraceptive — AWA',
  },
  bg: {
    badge: 'КОНТРАЦЕПТИВНО ХАПЧЕ',
    title: 'Разбиране на\nконтрацептивното хапче',
    metaDuration: '7 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Как работи хапчето, как се приема ежедневно и основните му предимства и ограничения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Как работи хапчето',
      'Правилен прием всеки ден',
      'Предимства и ограничения',
      'Какво да запомниш',
    ],
    body1: 'Хапчето съдържа хормони — естроген и/или прогестаген, според вида — които действат главно като предотвратяват или блокират овулацията. То променя и цервикалната слуз, което затруднява преминаването на сперматозоидите.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Има няколко вида хапчета, включително комбинирани хапчета и хапчета само с прогестаген. Съставът им и начинът на приемане могат да се различават.',
    body2: 'Редовният прием е важен. В зависимост от вида хапче, какво да направиш след пропусната доза може да се различава — затова е съществено да проверяваш листовката на лекарството си.',
    routineTips: [
      'Избери момент от деня, който е лесен за запомняне (хранене, лягане...)',
      'Използвай напомняне или приложение, ако е нужно',
      'Дръж листовката под ръка при съмнение',
    ],
    sectionIntro: 'Като всеки контрацептивен метод, хапчето има предимства, но и известни ограничения, които е добре да знаеш, преди да го избереш.',
    advantagesTitle: 'Предимства',
    advantagesSubtitle: 'Какво може да предложи',
    advantages: [
      'Значително намалява риска от бременност при правилна употреба',
      'Може да направи менструациите по-редовни и предвидими',
      'Може да намали болката и кървенето при някои хора',
      'Може да се коригира или смени, ако не ти подхожда',
    ],
    limitationsTitle: 'Ограничения',
    limitationsSubtitle: 'Неща, които да знаеш',
    limitations: [
      'Изисква редовен прием, в зависимост от вида хапче',
      'Пропуснатите дози могат да намалят ефективността му',
      'Някои хора могат да имат странични ефекти',
      'Не предпазва от инфекции, предавани по полов път (ИППП)',
    ],
    takeawayTitle: 'Метод, който си струва да се разбере',
    takeawayText: 'Хапчето е ефективен хормонален контрацептивен метод при правилна употреба. Редовният прием, възможните му странични ефекти и липсата на защита от ИППП са важни неща за знаене.',
    finalTipText: 'Ако мислиш за контрацепция или текущият ти метод не ти подхожда, не се колебай да поговориш с лекар, акушерка или друг здравен специалист.',
    shareMessage: 'Разбиране на контрацептивното хапче — AWA',
  },
  sr: {
    badge: 'КОНТРАЦЕПТИВНА ПИЛУЛА',
    title: 'Разумевање\nконтрацептивне пилуле',
    metaDuration: '7 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Како пилула делује, како је узимати из дана у дан и њене главне предности и ограничења.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Како пилула делује',
      'Правилно узимање сваког дана',
      'Предности и ограничења',
      'Шта да запамтиш',
    ],
    body1: 'Пилула садржи хормоне — естроген и/или прогестаген, зависно од врсте — који делују углавном спречавањем или блокирањем овулације. Она мења и цервикалну слуз, што отежава пролаз сперматозоида.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Постоји неколико врста пилула, укључујући комбиноване пилуле и пилуле само са прогестагеном. Њихов састав и начин узимања могу се разликовати.',
    body2: 'Редовно узимање је важно. У зависности од врсте пилуле, оно што треба урадити после пропуштене дозе може се разликовати — зато је неопходно проверити листић лека.',
    routineTips: [
      'Изабери доба дана које је лако запамтити (оброк, одлазак на спавање...)',
      'Користи подсетник или апликацију ако је потребно',
      'Држи листић при руци за случај сумње',
    ],
    sectionIntro: 'Као и сваки контрацептивни метод, пилула има предности, али и одређена ограничења која треба знати пре избора.',
    advantagesTitle: 'Предности',
    advantagesSubtitle: 'Шта може да понуди',
    advantages: [
      'Знатно смањује ризик од трудноће када се правилно користи',
      'Може учинити менструацију редовнијом и предвидљивијом',
      'Може смањити бол и крварење код неких особа',
      'Може се прилагодити или променити ако ти не одговара',
    ],
    limitationsTitle: 'Ограничења',
    limitationsSubtitle: 'Ствари на које треба обратити пажњу',
    limitations: [
      'Захтева редовно узимање у зависности од врсте пилуле',
      'Пропуштене дозе могу смањити њену ефикасност',
      'Неке особе могу имати нежељене ефекте',
      'Не штити од полно преносивих инфекција (ППИ)',
    ],
    takeawayTitle: 'Метод који вреди разумети',
    takeawayText: 'Пилула је ефикасан хормонски контрацептивни метод када се правилно користи. Редовно узимање, могући нежељени ефекти и недостатак заштите од ППИ су важне ствари које треба знати.',
    finalTipText: 'Ако размишљаш о контрацепцији или ти тренутни метод не одговара, не оклевај да разговараш са лекаром, бабицом или другим здравственим радником.',
    shareMessage: 'Разумевање контрацептивне пилуле — AWA',
  },
  hr: {
    badge: 'KONTRACEPCIJSKA TABLETA',
    title: 'Razumijevanje\nkontracepcijske tablete',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako tableta djeluje, kako je uzimati iz dana u dan te njezine glavne prednosti i ograničenja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kako tableta djeluje',
      'Pravilno uzimanje svaki dan',
      'Prednosti i ograničenja',
      'Ključne poruke',
    ],
    body1: 'Tableta sadrži hormone — estrogen i/ili progestin, ovisno o vrsti — koji djeluju uglavnom tako da sprječavaju ili blokiraju ovulaciju. Mijenja i cervikalnu sluz, zbog čega spermijima teže prolaze.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Postoji nekoliko vrsta tableta, među njima kombinirane tablete i tablete samo s progestinom. Njihov sastav i način uzimanja mogu se razlikovati.',
    body2: 'Redovito uzimanje je važno. Ovisno o vrsti tablete, postupak nakon propuštene doze može se razlikovati — zato je ključno pročitati uputu o lijeku.',
    routineTips: [
      'Odaberi doba dana koje je lako zapamtiti (obrok, odlazak na spavanje…)',
      'Po potrebi koristi podsjetnik ili aplikaciju',
      'Uputu o lijeku drži pri ruci u slučaju nedoumice',
    ],
    sectionIntro: 'Kao i svaka kontracepcijska metoda, tableta ima prednosti, ali i određena ograničenja koja je dobro znati prije odabira.',
    advantagesTitle: 'Prednosti',
    advantagesSubtitle: 'Što može ponuditi',
    advantages: [
      'Uvelike smanjuje rizik od trudnoće kad se pravilno koristi',
      'Može učiniti menstruaciju pravilnijom i predvidljivijom',
      'Kod nekih osoba može smanjiti bol i krvarenje',
      'Može se prilagoditi ili zamijeniti ako ti ne odgovara',
    ],
    limitationsTitle: 'Ograničenja',
    limitationsSubtitle: 'Na što treba obratiti pozornost',
    limitations: [
      'Zahtijeva redovito uzimanje, ovisno o vrsti tablete',
      'Propuštene doze mogu smanjiti njezinu učinkovitost',
      'Neke osobe mogu imati nuspojave',
      'Ne štiti od spolno prenosivih infekcija (SPI)',
    ],
    takeawayTitle: 'Metoda koju vrijedi razumjeti',
    takeawayText: 'Tableta je učinkovita hormonska kontracepcijska metoda kad se pravilno koristi. Redovito uzimanje, moguće nuspojave i izostanak zaštite od SPI važno je znati.',
    finalTipText: 'Ako razmišljaš o kontracepciji ili ti sadašnja metoda ne odgovara, slobodno razgovaraj s liječnikom, babicom ili drugim zdravstvenim djelatnikom.',
    shareMessage: 'Razumijevanje kontracepcijske tablete — AWA',
  },
  bs: {
    badge: 'KONTRACEPCIJSKA TABLETA',
    title: 'Razumijevanje\nkontracepcijske tablete',
    metaDuration: '7 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako tableta djeluje, kako je uzimati iz dana u dan te njezine glavne prednosti i ograničenja.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kako tableta djeluje',
      'Pravilno uzimanje svaki dan',
      'Prednosti i ograničenja',
      'Ključne poruke',
    ],
    body1: 'Tableta sadrži hormone — estrogen i/ili progestin, ovisno o vrsti — koji djeluju uglavnom tako da sprječavaju ili blokiraju ovulaciju. Mijenja i cervikalnu sluz, zbog čega spermijima teže prolaze.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Postoji nekoliko vrsta tableta, među njima kombinirane tablete i tablete samo s progestinom. Njihov sastav i način uzimanja mogu se razlikovati.',
    body2: 'Redovito uzimanje je važno. Ovisno o vrsti tablete, postupak nakon propuštene doze može se razlikovati — zato je ključno pročitati uputu o lijeku.',
    routineTips: [
      'Odaberi doba dana koje je lako zapamtiti (obrok, odlazak na spavanje…)',
      'Po potrebi koristi podsjetnik ili aplikaciju',
      'Uputu o lijeku drži pri ruci u slučaju nedoumice',
    ],
    sectionIntro: 'Kao i svaka kontracepcijska metoda, tableta ima prednosti, ali i određena ograničenja koja je dobro znati prije odabira.',
    advantagesTitle: 'Prednosti',
    advantagesSubtitle: 'Što može ponuditi',
    advantages: [
      'Uvelike smanjuje rizik od trudnoće kad se pravilno koristi',
      'Može učiniti menstruaciju pravilnijom i predvidljivijom',
      'Kod nekih osoba može smanjiti bol i krvarenje',
      'Može se prilagoditi ili zamijeniti ako ti ne odgovara',
    ],
    limitationsTitle: 'Ograničenja',
    limitationsSubtitle: 'Na što treba obratiti pozornost',
    limitations: [
      'Zahtijeva redovito uzimanje, ovisno o vrsti tablete',
      'Propuštene doze mogu smanjiti njezinu učinkovitost',
      'Neke osobe mogu imati nuspojave',
      'Ne štiti od spolno prenosivih infekcija (SPI)',
    ],
    takeawayTitle: 'Metoda koju vrijedi razumjeti',
    takeawayText: 'Tableta je učinkovita hormonska kontracepcijska metoda kad se pravilno koristi. Redovito uzimanje, moguće nuspojave i izostanak zaštite od SPI važno je znati.',
    finalTipText: 'Ako razmišljaš o kontracepciji ili ti sadašnja metoda ne odgovara, slobodno razgovaraj s ljekarom, babicom ili drugim zdravstvenim radnikom.',
    shareMessage: 'Razumijevanje kontracepcijske tablete — AWA',
  },
  sl: {
    badge: 'KONTRACEPCIJSKA TABLETA',
    title: 'Razumevanje\nkontracepcijske tablete',
    metaDuration: '7 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Kako tableta deluje, kako jo jemati iz dneva v dan ter njene glavne prednosti in omejitve.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kako tableta deluje',
      'Pravilno jemanje vsak dan',
      'Prednosti in omejitve',
      'Ključna sporočila',
    ],
    body1: 'Tableta vsebuje hormone — estrogen in/ali progestin, odvisno od vrste — ki delujejo predvsem tako, da preprečijo ali zavrejo ovulacijo. Spremeni tudi materničnovratno sluz, zaradi česar spermiji težje prehajajo.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Obstaja več vrst tablet, med njimi kombinirane tablete in tablete samo s progestinom. Njihova sestava in način jemanja se lahko razlikujeta.',
    body2: 'Redno jemanje je pomembno. Glede na vrsto tablete se ravnanje po pozabljenem odmerku lahko razlikuje — zato je ključno prebrati navodila za uporabo zdravila.',
    routineTips: [
      'Izberi čas dneva, ki si ga je lahko zapomniti (obrok, odhod v posteljo…)',
      'Po potrebi uporabi opomnik ali aplikacijo',
      'Navodila za uporabo imej pri roki v primeru dvoma',
    ],
    sectionIntro: 'Kot vsaka kontracepcijska metoda ima tudi tableta prednosti, a tudi določene omejitve, ki jih je dobro poznati pred izbiro.',
    advantagesTitle: 'Prednosti',
    advantagesSubtitle: 'Kaj lahko ponudi',
    advantages: [
      'Ob pravilni uporabi močno zmanjša tveganje za nosečnost',
      'Lahko naredi menstruacijo bolj redno in predvidljivo',
      'Pri nekaterih osebah lahko zmanjša bolečino in krvavitev',
      'Jo je mogoče prilagoditi ali zamenjati, če ti ne ustreza',
    ],
    limitationsTitle: 'Omejitve',
    limitationsSubtitle: 'Na kaj je treba biti pozoren',
    limitations: [
      'Zahteva redno jemanje, odvisno od vrste tablete',
      'Pozabljeni odmerki lahko zmanjšajo njeno učinkovitost',
      'Nekatere osebe imajo lahko stranske učinke',
      'Ne ščiti pred spolno prenosljivimi okužbami (SPO)',
    ],
    takeawayTitle: 'Metoda, ki jo vredno razumeti',
    takeawayText: 'Tableta je učinkovita hormonska kontracepcijska metoda ob pravilni uporabi. Redno jemanje, možni stranski učinki in odsotnost zaščite pred SPO so pomembne stvari, ki jih je treba vedeti.',
    finalTipText: 'Če razmišljaš o kontracepciji ali ti trenutna metoda ne ustreza, se brez oklevanja pogovori z zdravnikom, babico ali drugim zdravstvenim delavcem.',
    shareMessage: 'Razumevanje kontracepcijske tablete — AWA',
  },
  ne: {
    badge: 'गर्भनिरोधक चक्की',
    title: 'गर्भनिरोधक चक्की\nबुझ्नुहोस्',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'चक्कीले कसरी काम गर्छ, दैनिक कसरी लिने, र यसका मुख्य फाइदा तथा सीमाहरू।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'चक्कीले कसरी काम गर्छ',
      'हरेक दिन सही तरिकाले लिने',
      'फाइदा र सीमाहरू',
      'मुख्य कुराहरू',
    ],
    body1: 'चक्कीमा हर्मोनहरू — प्रकारअनुसार एस्ट्रोजेन र/वा प्रोजेस्टिन — हुन्छन्, जसले मुख्यतया अण्डोत्सर्ग रोकेर वा अवरोध गरेर काम गर्छन्। यसले गर्भाशयको मुखको तरल पदार्थ पनि बदल्छ, जसले शुक्रकीटलाई पार गर्न अझ गाह्रो बनाउँछ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'चक्कीका धेरै प्रकार छन्, जसमा संयुक्त चक्की र केवल प्रोजेस्टिन भएका चक्की पर्छन्। तिनको संरचना र लिने तरिका फरक हुन सक्छ।',
    body2: 'निरन्तर लिनु महत्त्वपूर्ण छ। चक्कीको प्रकारअनुसार, मात्रा छुटेपछि के गर्ने भन्ने फरक हुन सक्छ — त्यसैले आफ्नो औषधिको प्याकेज इन्सर्ट जाँच्नु आवश्यक छ।',
    routineTips: [
      'सम्झन सजिलो हुने दिनको समय छान्नुहोस् (खाना, सुत्ने समय...)',
      'आवश्यक परे सम्झना वा एप प्रयोग गर्नुहोस्',
      'शङ्का भएमा प्याकेज इन्सर्ट हातमा राख्नुहोस्',
    ],
    sectionIntro: 'जुनसुकै गर्भनिरोधक विधिजस्तै, चक्कीका फाइदा छन् तर छान्नुअघि जान्नुपर्ने केही सीमाहरू पनि छन्।',
    advantagesTitle: 'फाइदाहरू',
    advantagesSubtitle: 'यसले के दिन सक्छ',
    advantages: [
      'सही प्रयोग गर्दा गर्भधारणको जोखिम निकै घटाउँछ',
      'महिनावारी बढी नियमित र पूर्वानुमान गर्न सकिने बनाउन सक्छ',
      'केही मानिसमा दुखाइ र रक्तस्राव घटाउन सक्छ',
      'तपाईंलाई मिलेन भने मिलाउन वा बदल्न सकिन्छ',
    ],
    limitationsTitle: 'सीमाहरू',
    limitationsSubtitle: 'ध्यान दिनुपर्ने कुराहरू',
    limitations: [
      'चक्कीको प्रकारअनुसार नियमित सेवन आवश्यक हुन्छ',
      'मात्रा छुट्दा यसको प्रभावकारिता घट्न सक्छ',
      'केही मानिसमा साइड इफेक्ट हुन सक्छन्',
      'यौनजन्य सङ्क्रमण (STI) बाट सुरक्षा दिँदैन',
    ],
    takeawayTitle: 'बुझ्न लायक विधि',
    takeawayText: 'चक्की सही प्रयोग गर्दा प्रभावकारी हर्मोनल गर्भनिरोधक विधि हो। निरन्तर लिनु, सम्भावित साइड इफेक्टहरू र STI बाट सुरक्षा नदिनु जान्नुपर्ने महत्त्वपूर्ण कुराहरू हुन्।',
    finalTipText: 'तपाईं गर्भनिरोधनबारे सोच्दै हुनुहुन्छ वा हालको विधि तपाईंलाई मिलिरहेको छैन भने, चिकित्सक, सुँडेनी वा अन्य स्वास्थ्यकर्मीसँग कुरा गर्न नहिच्किचाउनुहोस्।',
    shareMessage: 'गर्भनिरोधक चक्की बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'ගර්භනිරෝධක පෙත්ත',
    title: 'ගර්භනිරෝධක පෙත්ත\nතේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'පෙත්ත ක්‍රියා කරන ආකාරය, එය දිනපතා ගන්නා ආකාරය සහ එහි ප්‍රධාන වාසි සහ සීමාවන්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පෙත්ත ක්‍රියා කරන ආකාරය',
      'සෑම දිනකම නිවැරදිව ගැනීම',
      'වාසි සහ සීමාවන්',
      'ප්‍රධාන කරුණු',
    ],
    body1: 'පෙත්තේ හෝමෝන — වර්ගය අනුව එස්ට්‍රජන් සහ/හෝ ප්‍රොජෙස්ටින් — අඩංගු වන අතර, ඒවා ප්‍රධාන වශයෙන් ඩිම්බ මෝචනය වැළැක්වීමෙන් හෝ අවහිර කිරීමෙන් ක්‍රියා කරයි. එය ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මලද වෙනස් කරන අතර, එයින් ශුක්‍රාණුවලට ගමන් කිරීම අපහසු වේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ඒකාබද්ධ පෙති සහ ප්‍රොජෙස්ටින් පමණක් අඩංගු පෙති ඇතුළු පෙති වර්ග කිහිපයක් ඇත. ඒවායේ සංයුතිය සහ ඒවා ගන්නා ආකාරය වෙනස් විය හැක.',
    body2: 'ස්ථාවරව ගැනීම වැදගත්. පෙත්තේ වර්ගය අනුව, මාත්‍රාවක් මග හැරුණු පසු කළ යුත්ත වෙනස් විය හැක — එබැවින් ඔබේ ඖෂධයේ ඇසුරුම් පත්‍රිකාව පරීක්ෂා කිරීම අත්‍යවශ්‍යයි.',
    routineTips: [
      'මතක තබාගැනීමට පහසු දවසේ වේලාවක් තෝරන්න (ආහාර වේලක්, නින්දට යාම...)',
      'අවශ්‍ය නම් සිහිකැඳවීමක් හෝ යෙදුමක් භාවිතා කරන්න',
      'සැකයක් ඇති වුවහොත් ඇසුරුම් පත්‍රිකාව අතේ තබාගන්න',
    ],
    sectionIntro: 'ඕනෑම ගර්භනිරෝධන ක්‍රමයක් මෙන්ම, පෙත්තටද වාසි ඇති නමුත්, එය තෝරාගැනීමට පෙර දැනගත යුතු සමහර සීමාවන්ද ඇත.',
    advantagesTitle: 'වාසි',
    advantagesSubtitle: 'එය ලබා දිය හැකි දේ',
    advantages: [
      'නිවැරදිව භාවිතා කළ විට ගැබ්ගැනීමේ අවදානම බොහෝ සේ අඩු කරයි',
      'ඔසප් වඩාත් නිතිපතා සහ පුරෝකථනය කළ හැකි කළ හැක',
      'සමහරුන්ට වේදනාව සහ ලේ ගැලීම අඩු කළ හැක',
      'එය ඔබට නොගැළපේ නම් සකස් කිරීමට හෝ වෙනස් කිරීමට හැක',
    ],
    limitationsTitle: 'සීමාවන්',
    limitationsSubtitle: 'දැනුවත් විය යුතු කරුණු',
    limitations: [
      'පෙත්තේ වර්ගය අනුව නිතිපතා ගැනීම අවශ්‍ය වේ',
      'මග හැරුණු මාත්‍රා එහි සඵලතාව අඩු කළ හැක',
      'සමහර අයට අතුරු ආබාධ ඇතිවිය හැක',
      'ලිංගිකව සම්ප්‍රේෂණය වන ආසාදනවලින් (STI) ආරක්ෂා නොකරයි',
    ],
    takeawayTitle: 'තේරුම් ගැනීම වටිනා ක්‍රමයක්',
    takeawayText: 'පෙත්ත නිවැරදිව භාවිතා කළ විට සඵල හෝමෝන ගර්භනිරෝධන ක්‍රමයකි. එය ස්ථාවරව ගැනීම, එහි ඇතිවිය හැකි අතුරු ආබාධ, සහ STI වලින් ආරක්ෂාවක් නොමැතිකම දැනගත යුතු වැදගත් දේවල්ය.',
    finalTipText: 'ඔබ ගර්භනිරෝධනයක් ගැන සලකා බලන්නේ නම් හෝ ඔබේ වත්මන් ක්‍රමය ඔබට ක්‍රියා නොකරන්නේ නම්, වෛද්‍යවරයෙකු, ප්‍රසව හෙදියක් හෝ වෙනත් සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීමට මැළි නොවන්න.',
    shareMessage: 'ගර්භනිරෝධක පෙත්ත තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'ยาเม็ดคุมกำเนิด',
    title: 'ทำความเข้าใจ\nยาเม็ดคุมกำเนิด',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ยาเม็ดทำงานอย่างไร ทานในแต่ละวันอย่างไร และข้อดีกับข้อจำกัดหลักของยา',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ยาเม็ดทำงานอย่างไร',
      'ทานให้ถูกต้องทุกวัน',
      'ข้อดีและข้อจำกัด',
      'ประเด็นสำคัญ',
    ],
    body1: 'ยาเม็ดมีฮอร์โมน — เอสโตรเจนและ/หรือโปรเจสตินตามชนิดของยา — ซึ่งออกฤทธิ์หลักโดยป้องกันหรือยับยั้งการตกไข่ นอกจากนี้ยังเปลี่ยนเมือกปากมดลูก ทำให้อสุจิผ่านได้ยากขึ้น',
    tip1Title: 'ควรรู้',
    tip1Text: 'ยาเม็ดมีหลายชนิด รวมถึงยาเม็ดแบบฮอร์โมนรวมและยาเม็ดแบบโปรเจสตินอย่างเดียว ส่วนประกอบและวิธีทานอาจแตกต่างกัน',
    body2: 'การทานอย่างสม่ำเสมอสำคัญมาก ตามชนิดของยาเม็ด สิ่งที่ควรทำหลังลืมทานอาจต่างกัน — จึงจำเป็นต้องตรวจสอบเอกสารกำกับยาของคุณ',
    routineTips: [
      'เลือกเวลาของวันที่จำง่าย (มื้ออาหาร เวลาเข้านอน...)',
      'ใช้การเตือนหรือแอปหากจำเป็น',
      'เก็บเอกสารกำกับยาไว้ใกล้มือเผื่อสงสัย',
    ],
    sectionIntro: 'เช่นเดียวกับวิธีคุมกำเนิดทุกวิธี ยาเม็ดมีข้อดี แต่ก็มีข้อจำกัดบางอย่างที่ควรรู้ก่อนเลือกใช้',
    advantagesTitle: 'ข้อดี',
    advantagesSubtitle: 'สิ่งที่ยาเม็ดให้ได้',
    advantages: [
      'ลดความเสี่ยงของการตั้งครรภ์ได้มากเมื่อใช้อย่างถูกต้อง',
      'อาจทำให้ประจำเดือนสม่ำเสมอและคาดเดาได้มากขึ้น',
      'อาจลดอาการปวดและปริมาณเลือดในบางคน',
      'ปรับหรือเปลี่ยนได้หากไม่เหมาะกับคุณ',
    ],
    limitationsTitle: 'ข้อจำกัด',
    limitationsSubtitle: 'ประเด็นที่ควรทราบ',
    limitations: [
      'ต้องทานสม่ำเสมอตามชนิดของยาเม็ด',
      'การลืมทานอาจลดประสิทธิภาพของยา',
      'บางคนอาจมีผลข้างเคียง',
      'ไม่ป้องกันโรคติดต่อทางเพศสัมพันธ์ (STI)',
    ],
    takeawayTitle: 'วิธีที่ควรทำความเข้าใจ',
    takeawayText: 'ยาเม็ดเป็นวิธีคุมกำเนิดด้วยฮอร์โมนที่มีประสิทธิภาพเมื่อใช้อย่างถูกต้อง การทานสม่ำเสมอ ผลข้างเคียงที่อาจเกิดขึ้น และการไม่ป้องกันโรคติดต่อทางเพศสัมพันธ์ เป็นสิ่งสำคัญที่ควรรู้',
    finalTipText: 'หากคุณกำลังพิจารณาการคุมกำเนิดหรือวิธีที่ใช้อยู่ไม่เหมาะกับคุณ อย่าลังเลที่จะปรึกษาแพทย์ ผดุงครรภ์ หรือบุคลากรทางการแพทย์อื่น ๆ',
    shareMessage: 'ทำความเข้าใจยาเม็ดคุมกำเนิด — AWA',
  },
  vi: {
    badge: 'THUỐC TRÁNH THAI',
    title: 'Hiểu về\nthuốc tránh thai',
    metaDuration: '7 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Thuốc tránh thai hoạt động như thế nào, cách uống hằng ngày cùng những ưu điểm và hạn chế chính.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Thuốc tránh thai hoạt động như thế nào',
      'Uống đúng cách mỗi ngày',
      'Ưu điểm và hạn chế',
      'Những điểm chính cần nhớ',
    ],
    body1: 'Thuốc tránh thai chứa các hormone — estrogen và/hoặc progestin, tùy loại — hoạt động chủ yếu bằng cách ngăn chặn hoặc ức chế rụng trứng. Thuốc cũng làm thay đổi dịch nhầy cổ tử cung, khiến tinh trùng khó đi qua hơn.',
    tip1Title: 'Nên biết',
    tip1Text: 'Có nhiều loại thuốc tránh thai, gồm thuốc kết hợp và thuốc chỉ chứa progestin. Thành phần và cách uống của chúng có thể khác nhau.',
    body2: 'Uống đều đặn rất quan trọng. Tùy loại thuốc, cách xử lý khi quên một liều có thể khác nhau — vì vậy cần xem kỹ tờ hướng dẫn sử dụng của thuốc.',
    routineTips: [
      'Chọn một giờ trong ngày dễ nhớ (một bữa ăn, giờ đi ngủ...)',
      'Dùng nhắc nhở hoặc ứng dụng nếu cần',
      'Để tờ hướng dẫn sử dụng gần tầm tay phòng khi nghi ngờ',
    ],
    sectionIntro: 'Như mọi biện pháp tránh thai, thuốc tránh thai có ưu điểm nhưng cũng có một số hạn chế cần biết trước khi lựa chọn.',
    advantagesTitle: 'Ưu điểm',
    advantagesSubtitle: 'Những gì nó có thể mang lại',
    advantages: [
      'Giảm đáng kể nguy cơ mang thai khi dùng đúng cách',
      'Có thể giúp kỳ kinh đều đặn và dễ dự đoán hơn',
      'Có thể giảm đau và lượng máu kinh ở một số người',
      'Có thể điều chỉnh hoặc đổi loại nếu không phù hợp với bạn',
    ],
    limitationsTitle: 'Hạn chế',
    limitationsSubtitle: 'Những điểm cần lưu ý',
    limitations: [
      'Cần uống đều đặn tùy theo loại thuốc',
      'Quên liều có thể làm giảm hiệu quả',
      'Một số người có thể gặp tác dụng phụ',
      'Không bảo vệ khỏi các bệnh lây truyền qua đường tình dục (STI)',
    ],
    takeawayTitle: 'Một phương pháp đáng để tìm hiểu',
    takeawayText: 'Thuốc tránh thai là một biện pháp tránh thai nội tiết hiệu quả khi dùng đúng cách. Uống đều đặn, các tác dụng phụ có thể có và việc không bảo vệ khỏi STI là những điều quan trọng cần biết.',
    finalTipText: 'Nếu bạn đang cân nhắc biện pháp tránh thai hoặc phương pháp hiện tại không phù hợp với bạn, đừng ngần ngại nói chuyện với bác sĩ, nữ hộ sinh hoặc nhân viên y tế khác.',
    shareMessage: 'Hiểu về thuốc tránh thai — AWA',
  },
  uz: {
    badge: 'KONTRATSEPTIV TABLETKA',
    title: 'Kontratseptiv tabletkani\ntushunish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Tabletka qanday ishlaydi, uni kundalik hayotda qanday qabul qilish kerak va uning asosiy afzalliklari hamda cheklovlari.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Tabletka qanday ishlaydi',
      'Uni har kuni toʻgʻri qabul qilish',
      'Afzalliklar va cheklovlar',
      'Asosiy xulosalar',
    ],
    body1: 'Tabletkada turiga qarab estrogen va/yoki progestin gormonlari bor, ular asosan ovulyatsiyani oldini olish yoki toʻsish orqali ishlaydi. U bachadon boʻyni shilligini ham oʻzgartiradi, bu esa spermatozoidlarning oʻtishini qiyinlashtiradi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Tabletkaning bir necha turi bor, jumladan kombinatsiyalangan tabletkalar va faqat progestinli tabletkalar. Ularning tarkibi va qabul qilish usuli farq qilishi mumkin.',
    body2: 'Uni izchil qabul qilish muhim. Tabletka turiga qarab, dozani oʻtkazib yuborgandan keyin nima qilish farq qilishi mumkin — shuning uchun dorining qoʻllanma varaqasini tekshirish zarur.',
    routineTips: [
      'Eslab qolish oson boʻlgan kun vaqtini tanlang (ovqat, uxlash...)',
      'Kerak boʻlsa, eslatma yoki ilovadan foydalaning',
      'Shubha boʻlsa, qoʻllanma varaqasini yaqin joyda saqlang',
    ],
    sectionIntro: 'Har qanday kontratseptiv usul kabi, tabletkaning ham afzalliklari, shuningdek, tanlashdan oldin bilish kerak boʻlgan baʼzi cheklovlari bor.',
    advantagesTitle: 'Afzalliklar',
    advantagesSubtitle: 'U nimani taklif qilishi mumkin',
    advantages: [
      'Toʻgʻri ishlatilganda homiladorlik xavfini sezilarli kamaytiradi',
      'Hayzni muntazamroq va oldindan aytib boʻladigan qilishi mumkin',
      'Baʼzi odamlarda ogʻriq va qon ketishini kamaytirishi mumkin',
      'Sizga mos kelmasa, sozlash yoki almashtirish mumkin',
    ],
    limitationsTitle: 'Cheklovlar',
    limitationsSubtitle: 'Bilish kerak boʻlgan jihatlar',
    limitations: [
      'Tabletka turiga qarab muntazam qabul qilishni talab qiladi',
      'Oʻtkazib yuborilgan dozalar samaradorlikni kamaytirishi mumkin',
      'Baʼzi odamlarda nojoʻya taʼsirlar boʻlishi mumkin',
      'Jinsiy yoʻl bilan yuqadigan infeksiyalardan (JYYI) himoya qilmaydi',
    ],
    takeawayTitle: 'Tushunishga arziydigan usul',
    takeawayText: 'Tabletka toʻgʻri ishlatilganda samarali gormonal kontratseptiv usul. Uni izchil qabul qilish, mumkin boʻlgan nojoʻya taʼsirlar va JYYI dan himoya qilmasligi bilish muhim jihatlar.',
    finalTipText: 'Agar kontratseptsiyani oʻylayotgan boʻlsangiz yoki hozirgi usulingiz sizga mos kelmasa, shifokor, doya yoki boshqa sogʻliqni saqlash mutaxassisi bilan gaplashishdan tortinmang.',
    shareMessage: 'Kontratseptiv tabletkani tushunish — AWA',
  },
  az: {
    badge: 'KONTRASEPTİV HAP',
    title: 'Kontraseptiv hapı\nanlamaq',
    metaDuration: '7 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Hap necə işləyir, gündəlik necə qəbul edilir, əsas üstünlükləri və məhdudiyyətləri.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Hap necə işləyir',
      'Onu hər gün düzgün qəbul etmək',
      'Üstünlüklər və məhdudiyyətlər',
      'Əsas nəticələr',
    ],
    body1: 'Hapda növündən asılı olaraq östrogen və/və ya progestin hormonları var və onlar əsasən ovulyasiyanın qarşısını almaqla və ya onu bloklamaqla işləyir. O, həm də uşaqlıq boynu mukusunu dəyişir ki, bu da spermatozoidlərin keçməsini çətinləşdirir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Hapın bir neçə növü var, o cümlədən kombinə edilmiş hablar və yalnız progestinli hablar. Onların tərkibi və qəbul qaydası fərqli ola bilər.',
    body2: 'Müntəzəm qəbul vacibdir. Hapın növündən asılı olaraq, buraxılmış dozadan sonra nə etmək fərqli ola bilər — buna görə dərmanınızın təlimatını yoxlamaq vacibdir.',
    routineTips: [
      'Yadda saxlamaq asan olan vaxt seçin (yemək, yatmazdan əvvəl...)',
      'Lazım gələrsə, xatırlatma və ya tətbiqdən istifadə edin',
      'Şübhə olarsa, təlimatı əlinizin altında saxlayın',
    ],
    sectionIntro: 'İstənilən kontraseptiv üsul kimi, hapın da üstünlükləri, eləcə də seçməzdən əvvəl bilməli olduğunuz bəzi məhdudiyyətləri var.',
    advantagesTitle: 'Üstünlüklər',
    advantagesSubtitle: 'Nə təklif edə bilər',
    advantages: [
      'Düzgün istifadə edildikdə hamiləlik riskini xeyli azaldır',
      'Aybaşıları daha müntəzəm və proqnozlaşdırıla bilən edə bilər',
      'Bəzi insanlarda ağrını və qanaxmanı azalda bilər',
      'Sizə uyğun gəlmirsə, tənzimlənə və ya dəyişdirilə bilər',
    ],
    limitationsTitle: 'Məhdudiyyətlər',
    limitationsSubtitle: 'Bilməli olduğunuz məqamlar',
    limitations: [
      'Hapın növündən asılı olaraq müntəzəm qəbul tələb edir',
      'Buraxılmış dozalar onun təsirliliyini azalda bilər',
      'Bəzi insanlarda yan təsirlər ola bilər',
      'Cinsi yolla ötürülən infeksiyalardan (CYÖİ) qorumur',
    ],
    takeawayTitle: 'Anlamağa dəyər üsul',
    takeawayText: 'Hap düzgün istifadə edildikdə təsirli hormonal kontraseptiv üsuldur. Müntəzəm qəbul, mümkün yan təsirlər və CYÖİ-dən qorumaması bilinməli vacib məqamlardır.',
    finalTipText: 'Kontrasepsiya barədə düşünürsünüzsə və ya hazırkı üsulunuz sizə uyğun gəlmirsə, həkim, mama və ya digər tibb işçisi ilə danışmaqdan çəkinməyin.',
    shareMessage: 'Kontraseptiv hapı anlamaq — AWA',
  },
  ka: {
    badge: 'კონტრაცეპტიული აბი',
    title: 'კონტრაცეპტიული\nაბის გაგება',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'როგორ მუშაობს აბი, როგორ მივიღოთ ის ყოველდღიურად და რა არის მისი ძირითადი უპირატესობები და შეზღუდვები.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'როგორ მუშაობს აბი',
      'ყოველდღიურად სწორად მიღება',
      'უპირატესობები და შეზღუდვები',
      'მთავარი დასკვნები',
    ],
    body1: 'აბი შეიცავს ჰორმონებს — ესტროგენს და/ან პროგესტინს, ტიპის მიხედვით — რომლებიც ძირითადად ოვულაციის თავიდან აცილებით ან დაბლოკვით მოქმედებს. ის ცვლის საშვილოსნოს ყელის ლორწოსაც, რაც სპერმატოზოიდების გავლას ართულებს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'არსებობს აბის რამდენიმე ტიპი, მათ შორის კომბინირებული აბები და მხოლოდ პროგესტინის შემცველი აბები. მათი შემადგენლობა და მიღების წესი შეიძლება განსხვავდებოდეს.',
    body2: 'რეგულარული მიღება მნიშვნელოვანია. აბის ტიპის მიხედვით, გამოტოვებული დოზის შემდეგ გასაკეთებელი შეიძლება განსხვავდებოდეს — ამიტომ აუცილებელია თქვენი მედიკამენტის ინსტრუქციის გადამოწმება.',
    routineTips: [
      'აირჩიეთ დღის დრო, რომელიც ადვილად დასამახსოვრებელია (კვება, დაძინება...)',
      'საჭიროების შემთხვევაში გამოიყენეთ შეხსენება ან აპი',
      'ეჭვის შემთხვევისთვის ინსტრუქცია ხელთ გქონდეთ',
    ],
    sectionIntro: 'ნებისმიერი კონტრაცეპტიული მეთოდის მსგავსად, აბსაც აქვს უპირატესობები, ასევე გარკვეული შეზღუდვები, რომლებიც არჩევამდე უნდა იცოდეთ.',
    advantagesTitle: 'უპირატესობები',
    advantagesSubtitle: 'რისი შეთავაზება შეუძლია',
    advantages: [
      'სწორი გამოყენებისას ორსულობის რისკს მნიშვნელოვნად ამცირებს',
      'შეიძლება მენსტრუაცია უფრო რეგულარული და პროგნოზირებადი გახადოს',
      'ზოგისთვის შეიძლება ტკივილი და სისხლდენა შეამციროს',
      'შეიძლება მორგებულ ან შეცვლილ იქნეს, თუ არ გერგებათ',
    ],
    limitationsTitle: 'შეზღუდვები',
    limitationsSubtitle: 'საკითხები, რომლებიც უნდა გავითვალისწინოთ',
    limitations: [
      'აბის ტიპის მიხედვით რეგულარულ მიღებას მოითხოვს',
      'გამოტოვებულმა დოზებმა შეიძლება ეფექტიანობა შეამციროს',
      'ზოგს შეიძლება გვერდითი მოვლენები ჰქონდეს',
      'არ იცავს სქესობრივი გზით გადამდებ ინფექციებისგან (სგგი)',
    ],
    takeawayTitle: 'მეთოდი, რომლის გაგებაც ღირს',
    takeawayText: 'აბი სწორი გამოყენებისას ეფექტიანი ჰორმონული კონტრაცეპტიული მეთოდია. რეგულარული მიღება, შესაძლო გვერდითი მოვლენები და სგგი-სგან დაცვის არარსებობა მნიშვნელოვანი საკითხებია, რომლებიც უნდა იცოდეთ.',
    finalTipText: 'თუ კონტრაცეფციაზე ფიქრობთ ან თქვენი მიმდინარე მეთოდი არ გერგებათ, ნუ დააყოვნებთ ექიმთან, ბებიაქალთან ან სხვა ჯანდაცვის სპეციალისტთან საუბარს.',
    shareMessage: 'კონტრაცეპტიული აბის გაგება — AWA',
  },
  hy: {
    badge: 'ՀԱԿԱԲԵՂՄՆԱՎՈՐԻՉ ՀԱԲ',
    title: 'Հասկանալ\nհակաբեղմնավորիչ հաբը',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչպես է աշխատում հաբը, ինչպես ընդունել այն օրեցօր և դրա հիմնական առավելություններն ու սահմանափակումները:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչպես է աշխատում հաբը',
      'Ճիշտ ընդունել ամեն օր',
      'Առավելություններ և սահմանափակումներ',
      'Հիմնական եզրակացություններ',
    ],
    body1: 'Հաբը պարունակում է հորմոններ՝ էստրոգեն և/կամ պրոգեստին՝ կախված տեսակից, որոնք գործում են հիմնականում ձվազատումը կանխելով կամ արգելափակելով: Այն նաև փոխում է արգանդի վզիկի լորձը, ինչը դժվարացնում է սպերմատոզոիդների անցումը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Գոյություն ունեն հաբերի մի քանի տեսակներ, այդ թվում՝ համակցված հաբեր և միայն պրոգեստին պարունակող հաբեր: Դրանց կազմը և ընդունման եղանակը կարող են տարբերվել:',
    body2: 'Կանոնավոր ընդունումը կարևոր է: Կախված հաբի տեսակից՝ բաց թողնված դեղաչափից հետո անելիքը կարող է տարբերվել, ուստի էական է ստուգել ձեր դեղամիջոցի օգտագործման հրահանգը:',
    routineTips: [
      'Ընտրեք օրվա հեշտ հիշվող ժամ (ճաշ, քնելուց առաջ...)',
      'Անհրաժեշտության դեպքում օգտագործեք հիշեցում կամ հավելված',
      'Կասկածի դեպքում պահեք հրահանգը ձեռքի տակ',
    ],
    sectionIntro: 'Ինչպես հակաբեղմնավորման ցանկացած մեթոդ, հաբը ունի առավելություններ, սակայն նաև որոշ սահմանափակումներ, որոնք պետք է իմանալ ընտրելուց առաջ:',
    advantagesTitle: 'Առավելություններ',
    advantagesSubtitle: 'Ինչ կարող է առաջարկել',
    advantages: [
      'Ճիշտ օգտագործման դեպքում զգալիորեն նվազեցնում է հղիության վտանգը',
      'Կարող է դաշտանները դարձնել ավելի կանոնավոր և կանխատեսելի',
      'Որոշ մարդկանց մոտ կարող է նվազեցնել ցավը և արյունահոսությունը',
      'Կարելի է ճշգրտել կամ փոխել, եթե հարմար չէ',
    ],
    limitationsTitle: 'Սահմանափակումներ',
    limitationsSubtitle: 'Կետեր, որոնց պետք է ուշադրություն դարձնել',
    limitations: [
      'Կախված հաբի տեսակից՝ պահանջում է կանոնավոր ընդունում',
      'Բաց թողնված դեղաչափերը կարող են նվազեցնել արդյունավետությունը',
      'Որոշ մարդիկ կարող են զգալ կողմնակի ազդեցություններ',
      'Չի պաշտպանում սեռական ճանապարհով փոխանցվող վարակներից (ՍՃՓՎ)',
    ],
    takeawayTitle: 'Մեթոդ, որը արժե հասկանալ',
    takeawayText: 'Հաբը արդյունավետ հորմոնալ հակաբեղմնավորման մեթոդ է, երբ ճիշտ է օգտագործվում: Կանոնավոր ընդունումը, հնարավոր կողմնակի ազդեցությունները և ՍՃՓՎ-ներից պաշտպանության բացակայությունը կարևոր է իմանալ:',
    finalTipText: 'Եթե մտածում եք հակաբեղմնավորման մասին կամ ձեր ընթացիկ մեթոդը ձեզ հարմար չէ, մի տատանվեք խոսել բժշկի, մանկաբարձուհու կամ առողջապահության այլ մասնագետի հետ:',
    shareMessage: 'Հասկանալ հակաբեղմնավորիչ հաբը — AWA',
  },
  tg: {
    badge: 'ҲАБИ ПЕШГИРИ АЗ ҲОМИЛАДОРӢ',
    title: 'Фаҳмидани\nҳаби пешгирӣ аз ҳомиладорӣ',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ҳаб чӣ тавр кор мекунад, чӣ тавр ҳар рӯз қабул карда мешавад ва афзалиятҳо ва маҳдудиятҳои асосии он.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ҳаб чӣ тавр кор мекунад',
      'Дуруст қабул кардан ҳар рӯз',
      'Афзалиятҳо ва маҳдудиятҳо',
      'Хулосаҳои асосӣ',
    ],
    body1: 'Ҳаб гормонҳо — эстроген ва/ё прогестин, вобаста ба навъ — дорад, ки асосан бо пешгирӣ ё боздоштани овуляция амал мекунанд. Он инчунин шилимшиқи гардани бачадонро тағйир медиҳад, ки гузаштани сперматозоидҳоро душвортар мекунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Якчанд навъи ҳаб вуҷуд дорад, аз ҷумла ҳабҳои омехта ва ҳабҳои танҳо бо прогестин. Таркиб ва тарзи қабули онҳо метавонад гуногун бошад.',
    body2: 'Қабули мунтазам муҳим аст. Вобаста ба навъи ҳаб, коре ки пас аз қабул нашудани як миқдор бояд кард, метавонад гуногун бошад — аз ин рӯ санҷидани дастурамали доруи худ зарур аст.',
    routineTips: [
      'Вақти рӯзеро интихоб кунед, ки ба ёд мондан осон аст (хӯрок, хоб...)',
      'Дар сурати зарурат аз ёдоварӣ ё барнома истифода баред',
      'Дар сурати шубҳа дастурамалро дар дастрас нигоҳ доред',
    ],
    sectionIntro: 'Мисли ҳар усули пешгирӣ, ҳаб афзалиятҳо дорад, вале инчунин маҳдудиятҳое, ки пеш аз интихоб бояд донист.',
    advantagesTitle: 'Афзалиятҳо',
    advantagesSubtitle: 'Он чи пешниҳод карда метавонад',
    advantages: [
      'Хатари ҳомиладориро ҳангоми дуруст истифода шудан хеле кам мекунад',
      'Метавонад ҳайзро мунтазамтар ва пешгӯишавандатар кунад',
      'Метавонад барои баъзеҳо дард ва хунравиро кам кунад',
      'Агар ба шумо мувофиқ набошад, онро танзим ё иваз кардан мумкин аст',
    ],
    limitationsTitle: 'Маҳдудиятҳо',
    limitationsSubtitle: 'Нуктаҳое, ки бояд донист',
    limitations: [
      'Вобаста ба навъи ҳаб қабули мунтазамро талаб мекунад',
      'Қабул нашудани миқдорҳо метавонад самаранокии онро кам кунад',
      'Баъзеҳо метавонанд таъсироти манфӣ эҳсос кунанд',
      'Аз сироятҳои ба роҳи ҷинсӣ гузаранда (СРҶ) муҳофизат намекунад',
    ],
    takeawayTitle: 'Усуле, ки фаҳмидани он сазовор аст',
    takeawayText: 'Ҳаб ҳангоми дуруст истифода шудан усули самараноки гормонии пешгирӣ аз ҳомиладорӣ аст. Қабули мунтазам, таъсироти манфии эҳтимолӣ ва набудани муҳофизат аз СРҶ чизҳои муҳимест, ки бояд донист.',
    finalTipText: 'Агар пешгирӣ аз ҳомиладорӣ дар назар доред ё усули ҷории шумо ба шумо мувофиқ нест, ба табиб, доя ё мутахассиси дигари соҳаи тиб муроҷиат кардан шарм надоред.',
    shareMessage: 'Фаҳмидани ҳаби пешгирӣ аз ҳомиладорӣ — AWA',
  },
  ky: {
    badge: 'КОНТРАЦЕПТИВДИК ТАБЛЕТКА',
    title: 'Контрацептивдик\nтаблетканы түшүнүү',
    metaDuration: '7 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Таблетка кантип иштейт, аны күн сайын кантип ичүү керек жана анын негизги артыкчылыктары менен чектөөлөрү.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Таблетка кантип иштейт',
      'Аны күн сайын туура ичүү',
      'Артыкчылыктары жана чектөөлөрү',
      'Негизги жыйынтыктар',
    ],
    body1: 'Таблетка түрүнө жараша гормондорду — эстрогенди жана/же прогестинди — камтыйт, алар негизинен овуляцияны болтурбоо же бөгөттөө аркылуу иштейт. Ал жатын моюнчасынын былжырын да өзгөртөт, бул сперманын өтүшүн кыйындатат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Таблеткалардын бир нече түрү бар, анын ичинде айкалышкан таблеткалар жана жалгыз прогестиндүү таблеткалар. Алардын курамы жана кабыл алынышы айырмаланышы мүмкүн.',
    body2: 'Аны үзгүлтүксүз ичүү маанилүү. Таблетканын түрүнө жараша, дозаны өткөрүп жибергенде эмне кылуу керектиги айырмаланышы мүмкүн — ошондуктан дарыңыздын көрсөтмөсүн текшерүү зарыл.',
    routineTips: [
      'Эсиңизде калуу оңой болгон убакытты тандаңыз (тамак, уктоодон мурун...)',
      'Керек болсо эскертмени же колдонмону колдонуңуз',
      'Күмөн болгондо көрсөтмөнү жаныңызда сактаңыз',
    ],
    sectionIntro: 'Ар кандай контрацепция ыкмасы сыяктуу эле таблетканын да артыкчылыктары, ошондой эле аны тандоодон мурун билүүгө тийиш болгон айрым чектөөлөрү бар.',
    advantagesTitle: 'Артыкчылыктары',
    advantagesSubtitle: 'Эмнени сунуштай алат',
    advantages: [
      'Туура колдонулганда курсактуулук коркунучун бир кыйла азайтат',
      'Етек киримди туруктуураак жана болжолдонуучу кылышы мүмкүн',
      'Айрым адамдарда оорууну жана кан кетүүнү азайтышы мүмкүн',
      'Туура келбесе, тууралоого же алмаштырууга болот',
    ],
    limitationsTitle: 'Чектөөлөрү',
    limitationsSubtitle: 'Билүүгө тийиш болгон учурлар',
    limitations: [
      'Таблетканын түрүнө жараша үзгүлтүксүз кабыл алууну талап кылат',
      'Өткөрүлүп жиберилген дозалар анын таасирин азайтышы мүмкүн',
      'Айрым адамдарда терс таасирлер болушу мүмкүн',
      'Жыныстык жол менен берилүүчү инфекциялардан (ЖЖБИ) коргобойт',
    ],
    takeawayTitle: 'Түшүнүүгө татыктуу ыкма',
    takeawayText: 'Таблетка туура колдонулганда натыйжалуу гормондук контрацепция ыкмасы. Аны үзгүлтүксүз кабыл алуу, мүмкүн болгон терс таасирлери жана ЖЖБИден коргобогондугу билүүгө тийиш болгон маанилүү нерселер.',
    finalTipText: 'Контрацепцияны ойлонуп жатсаңыз же учурдагы ыкмаңыз туура келбесе, дарыгер, акушерка же башка ден соолук сактоо адиси менен сүйлөшүүдөн тартынбаңыз.',
    shareMessage: 'Контрацептивдик таблетканы түшүнүү — AWA',
  },
  tk: {
    badge: 'GÖWRELILIKDEN GORAÝJY TABLETKA',
    title: 'Göwrelilikden goraýjy\ntabletkany düşünmek',
    metaDuration: '7 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Tabletka nähili işleýär, ony her gün nähili içmeli we onuň esasy artykmaçlyklary bilen çäkleri.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Tabletka nähili işleýär',
      'Ony her gün dogry içmek',
      'Artykmaçlyklary we çäkleri',
      'Esasy netijeler',
    ],
    body1: 'Tabletka görnüşine görä gormonlary — estrogeni we/ýa-da progestini — öz içine alýar, olar esasan ovulýasiýanyň öňüni almak ýa-da petikläp goýmak arkaly işleýär. Ol ýatgy boýnunyň ýaňsyny hem üýtgedýär, bu spermanyň geçmegini kynlaşdyrýar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Tabletkalaryň birnäçe görnüşi bar, şol sanda utgaşdyrylan tabletkalar we ýeke progestinli tabletkalar. Olaryň düzümi we kabul edilişi tapawutlanyp biler.',
    body2: 'Ony yzygiderli içmek möhüm. Tabletkanyň görnüşine görä, dozany ötüren wagtyňyz näme etmelidigi tapawutlanyp biler — şonuň üçin dermanyňyzyň görkezmesini barlamak zerur.',
    routineTips: [
      'Ýadyňyzda galmagy aňsat wagty saýlaň (iýmit, ýatmazdan öň...)',
      'Gerek bolsa ýatlatma ýa-da programmany ulanyň',
      'Şübhe bolanda görkezmäni ýanyňyzda saklaň',
    ],
    sectionIntro: 'Islendik göwrelilikden goranyş usuly ýaly tabletkanyň hem artykmaçlyklary, şeýle hem ony saýlamazdan öň bilmeli käbir çäkleri bar.',
    advantagesTitle: 'Artykmaçlyklary',
    advantagesSubtitle: 'Nämäni teklip edip biler',
    advantages: [
      'Dogry ulanylanda göwrelilik howpuny ep-esli azaldýar',
      'Aýbaşyny has yzygiderli we çaklanylýan edip biler',
      'Käbir adamlarda agyryny we gan akmany azaldyp biler',
      'Ýaramasa, sazlamak ýa-da çalyşmak mümkin',
    ],
    limitationsTitle: 'Çäkleri',
    limitationsSubtitle: 'Bilmeli nokatlar',
    limitations: [
      'Tabletkanyň görnüşine görä yzygiderli kabul etmegi talap edýär',
      'Ötürilen dozalar onuň täsirini azaldyp biler',
      'Käbir adamlarda gaýry täsirler bolup biler',
      'Jynsy ýol bilen geçýän ýokançlyklardan (JÝGÝ) goramaýar',
    ],
    takeawayTitle: 'Düşünmäge mynasyp usul',
    takeawayText: 'Tabletka dogry ulanylanda täsirli gormon goranyş usuly. Ony yzygiderli kabul etmek, mümkin bolan gaýry täsirleri we JÝGÝ-den goramazlygy bilmeli möhüm zatlar.',
    finalTipText: 'Göwrelilikden goranyşy pikir edýän bolsaňyz ýa-da häzirki usulyňyz ýaramasa, lukman, akuşerka ýa-da başga saglyk hünärmeni bilen gürleşmekden çekinmäň.',
    shareMessage: 'Göwrelilikden goraýjy tabletkany düşünmek — AWA',
  },
} as const);

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
