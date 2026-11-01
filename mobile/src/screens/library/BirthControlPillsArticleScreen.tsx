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
  ms: {
    badge: 'PIL PERANCANG KELAHIRAN',
    title: 'Memahami\npil perancang kelahiran',
    metaDuration: '7 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Bagaimana pil berfungsi, cara mengambilnya dari hari ke hari, serta kelebihan dan batasan utamanya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Bagaimana pil berfungsi',
      'Mengambilnya dengan betul setiap hari',
      'Kelebihan dan batasan',
      'Perkara penting untuk diingat',
    ],
    body1: 'Pil mengandungi hormon — estrogen dan/atau progestin, bergantung pada jenisnya — yang berfungsi terutamanya dengan mencegah atau menyekat ovulasi. Ia juga mengubah lendir serviks, yang menyukarkan sperma untuk melaluinya.',
    tip1Title: 'Elok diketahui',
    tip1Text: 'Terdapat beberapa jenis pil, termasuk pil kombinasi dan pil progestin sahaja. Komposisi dan cara mengambilnya boleh berbeza.',
    body2: 'Mengambilnya secara konsisten adalah penting. Bergantung pada jenis pil, apa yang perlu dilakukan selepas terlepas satu dos boleh berbeza — jadi adalah penting untuk menyemak risalah dalam kotak ubat anda.',
    routineTips: [
      'Pilih waktu dalam sehari yang mudah diingat (waktu makan, waktu tidur...)',
      'Gunakan peringatan atau aplikasi jika perlu',
      'Simpan risalah dalam kotak ubat berdekatan sekiranya ragu-ragu',
    ],
    sectionIntro: 'Seperti kaedah kontraseptif yang lain, pil mempunyai kelebihan tetapi juga beberapa batasan yang perlu diketahui sebelum memilihnya.',
    advantagesTitle: 'Kelebihan',
    advantagesSubtitle: 'Apa yang boleh ditawarkannya',
    advantages: [
      'Sangat mengurangkan risiko kehamilan apabila digunakan dengan betul',
      'Mungkin menjadikan haid lebih teratur dan boleh diramal',
      'Mungkin mengurangkan sakit dan pendarahan bagi sesetengah orang',
      'Boleh dilaraskan atau ditukar jika tidak sesuai dengan anda',
    ],
    limitationsTitle: 'Batasan',
    limitationsSubtitle: 'Perkara yang perlu diketahui',
    limitations: [
      'Memerlukan pengambilan secara tetap bergantung pada jenis pil',
      'Dos yang terlepas boleh mengurangkan keberkesanannya',
      'Sesetengah orang mungkin mengalami kesan sampingan',
      'Tidak melindungi daripada jangkitan kelamin (STI)',
    ],
    takeawayTitle: 'Kaedah yang patut difahami',
    takeawayText: 'Pil ialah kaedah kontraseptif hormon yang berkesan apabila digunakan dengan betul. Mengambilnya secara konsisten, kemungkinan kesan sampingannya dan ketiadaan perlindungan daripada STI ialah perkara penting untuk diketahui.',
    finalTipText: 'Jika anda sedang mempertimbangkan kontraseptif atau kaedah semasa anda tidak sesuai dengan anda, jangan teragak-agak berbincang dengan doktor, bidan atau pengamal penjagaan kesihatan lain.',
    shareMessage: 'Memahami pil perancang kelahiran — AWA',
  },
  so: {
    badge: 'KINIINKA KA HORTAGGA UURKA',
    title: 'Fahamka\nkiniinka ka hortagga uurka',
    metaDuration: '7 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Sida kiniinku u shaqeeyo, sida loo qaato maalin kasta, iyo faa’iidooyinkiisa iyo xaddidaaddiisa ugu muhiimsan.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Sida kiniinku u shaqeeyo',
      'Qaadashada saxda ah maalin kasta',
      'Faa’iidooyin iyo xaddidaado',
      'Qodobbada muhiimka ah',
    ],
    body1: 'Kiniinku wuxuu ka kooban yahay hormoonno — estrogen iyo/ama progestin, iyadoo ku xiran nooca — kuwaas oo inta badan ka shaqeeya iyagoo ka hortaga ama xannibaya ukun-sii-deynta. Wuxuu sidoo kale beddelaa dheecaanka afka ilmo-galeenka, taasoo ka dhigaysa mid ka adag in shahwadu ka gudubto.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text: 'Waxaa jira dhowr nooc oo kiniin ah, oo ay ku jiraan kiniinnada isku-dhafka ah iyo kuwa progestin oo keliya ah. Isku-dhisiddooda iyo sida loo qaato way kala duwanaan karaan.',
    body2: 'Qaadashada joogtada ahi waa muhiim. Iyadoo ku xiran nooca kiniinka, waxa la sameeyo marka qiyaas la iloobo way kala duwanaan kartaa — sidaa darteed waa lagama maarmaan in la hubiyo warqadda macluumaadka daawadaada.',
    routineTips: [
      'Dooro waqti maalinta ah oo fudud in la xasuusto (cunto, wakhtiga seexashada...)',
      'Isticmaal xasuusin ama app haddii loo baahdo',
      'Warqadda macluumaadka gacanta ku hay haddii shaki jiro',
    ],
    sectionIntro: 'Sida hab kasta oo ka hortagga uurka, kiniinku wuxuu leeyahay faa’iidooyin laakiin sidoo kale xaddidaado qaar oo la ogaado ka hor doorashada.',
    advantagesTitle: 'Faa’iidooyin',
    advantagesSubtitle: 'Waxa uu bixin karo',
    advantages: [
      'Aad ayuu u yareeyaa khatarta uurka marka si sax ah loo isticmaalo',
      'Wuxuu caadooyinka ka dhigi karaa kuwo joogto ah oo la saadaalin karo',
      'Wuxuu yareyn karaa xanuunka iyo dhiigbaxa dadka qaar',
      'Waa la hagaajin karaa ama la beddeli karaa haddii uusan ku habboonayn',
    ],
    limitationsTitle: 'Xaddidaado',
    limitationsSubtitle: 'Qodobbo la ogaado',
    limitations: [
      'Wuxuu u baahan yahay qaadasho joogto ah iyadoo ku xiran nooca kiniinka',
      'Qiyaasaha la iloobo waxay yareyn karaan waxtarkiisa',
      'Dadka qaar waxay la kulmi karaan saameyn dhinac',
      'Ma ilaaliyo cudurrada dhex-galmada ku faafa (STI)',
    ],
    takeawayTitle: 'Hab mudan in la fahmo',
    takeawayText: 'Kiniinku waa hab hormoon ah oo waxtar leh oo ka hortagga uurka marka si sax ah loo isticmaalo. Qaadashada joogtada ah, saameynta dhinac ee suurtagalka ah, iyo ilaalin la’aanta STI waa waxyaabo muhiim ah oo la ogaado.',
    finalTipText: 'Haddii aad ka fikirayso ka hortagga uurka ama habkaaga hadda uusan kuu habboonayn, ha ka waaban inaad la hadasho dhakhtar, umulis, ama xirfadle kale oo caafimaad.',
    shareMessage: 'Fahamka kiniinka ka hortagga uurka — AWA',
  },
  sw: {
    badge: 'KIDONGE CHA UZAZI WA MPANGO',
    title: 'Kuelewa\nkidonge cha uzazi wa mpango',
    metaDuration: 'Dakika 7 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Jinsi kidonge kinavyofanya kazi, jinsi ya kukitumia kila siku, na faida na mapungufu yake makuu.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Jinsi kidonge kinavyofanya kazi',
      'Kukitumia ipasavyo kila siku',
      'Faida na mapungufu',
      'Mambo muhimu ya kukumbuka',
    ],
    body1: 'Kidonge kina homoni — estrojeni na/au projestini, kulingana na aina — zinazofanya kazi hasa kwa kuzuia au kuzima utoaji wa yai. Pia hubadilisha ute wa shingo ya kizazi, jambo linalofanya iwe vigumu kwa mbegu za kiume kupita.',
    tip1Title: 'Vyema kujua',
    tip1Text: 'Kuna aina kadhaa za vidonge, zikiwemo vidonge vilivyochanganywa na vidonge vya projestini pekee. Muundo wake na jinsi ya kuvitumia vinaweza kutofautiana.',
    body2: 'Kukitumia kila mara ni muhimu. Kulingana na aina ya kidonge, cha kufanya baada ya kusahau dozi kinaweza kutofautiana — kwa hiyo ni muhimu kusoma maelezo yaliyomo kwenye kifurushi cha dawa yako.',
    routineTips: [
      'Chagua wakati wa siku ambao ni rahisi kukumbuka (mlo, wakati wa kulala...)',
      'Tumia kikumbusho au programu inapohitajika',
      'Weka maelezo ya kifurushi karibu endapo utakuwa na shaka',
    ],
    sectionIntro: 'Kama njia nyingine yoyote ya uzazi wa mpango, kidonge kina faida lakini pia mapungufu fulani ya kujua kabla ya kukichagua.',
    advantagesTitle: 'Faida',
    advantagesSubtitle: 'Kinachoweza kutoa',
    advantages: [
      'Hupunguza sana hatari ya ujauzito kinapotumiwa ipasavyo',
      'Kinaweza kufanya hedhi iwe ya mpangilio zaidi na inayotabirika',
      'Kinaweza kupunguza maumivu na kutokwa damu kwa baadhi ya watu',
      'Kinaweza kurekebishwa au kubadilishwa ikiwa hakikufai',
    ],
    limitationsTitle: 'Mapungufu',
    limitationsSubtitle: 'Mambo ya kuzingatia',
    limitations: [
      'Kinahitaji kutumiwa mara kwa mara kulingana na aina ya kidonge',
      'Kusahau dozi kunaweza kupunguza ufanisi wake',
      'Baadhi ya watu wanaweza kupata madhara ya pembeni',
      'Hakilindi dhidi ya magonjwa ya zinaa (STI)',
    ],
    takeawayTitle: 'Njia inayostahili kueleweka',
    takeawayText: 'Kidonge ni njia madhubuti ya homoni ya uzazi wa mpango kinapotumiwa ipasavyo. Kukitumia kila mara, madhara yake ya pembeni yanayowezekana, na kukosa ulinzi dhidi ya magonjwa ya zinaa ni mambo muhimu ya kujua.',
    finalTipText: 'Ikiwa unafikiria kutumia uzazi wa mpango au njia yako ya sasa haikufai, usisite kuzungumza na daktari, mkunga, au mtaalamu mwingine wa afya.',
    shareMessage: 'Kuelewa kidonge cha uzazi wa mpango — AWA',
  },
  kk: {
    badge: 'КОНТРАЦЕПТИВТІК ТАБЛЕТКА',
    title: 'Контрацептивтік\nтаблетканы түсіну',
    metaDuration: '7 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Таблетка қалай жұмыс істейді, оны күнделікті қалай қабылдау керек және оның негізгі артықшылықтары мен шектеулері.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Таблетка қалай жұмыс істейді',
      'Күн сайын дұрыс қабылдау',
      'Артықшылықтары мен шектеулері',
      'Негізгі қорытындылар',
    ],
    body1: 'Таблеткада гормондар — түріне байланысты эстроген және/немесе прогестин — бар, олар негізінен овуляцияны болдырмау немесе бөгеу арқылы жұмыс істейді. Ол жатыр мойны шырышын да өзгертеді, бұл сперматозоидтардың өтуін қиындатады.',
    tip1Title: 'Білуге тиісті',
    tip1Text: 'Таблеткалардың бірнеше түрі бар, соның ішінде біріктірілген таблеткалар және тек прогестинді таблеткалар. Олардың құрамы мен қабылдау тәсілі әртүрлі болуы мүмкін.',
    body2: 'Тұрақты қабылдау маңызды. Таблетканың түріне байланысты, доза өткізіп алғаннан кейін не істеу керектігі әртүрлі болуы мүмкін — сондықтан дәрі қаптамасындағы нұсқаулықты қарау өте маңызды.',
    routineTips: [
      'Есте сақтауға оңай күннің уақытын таңдаңыз (тамақ ішу, ұйықтар алдында...)',
      'Қажет болса, еске салғышты немесе қолданбаны пайдаланыңыз',
      'Күмән туындаса, қаптамадағы нұсқаулықты қолда ұстаңыз',
    ],
    sectionIntro: 'Кез келген контрацепция әдісі сияқты, таблетканың артықшылықтары бар, бірақ оны таңдамас бұрын білу керек белгілі бір шектеулері де бар.',
    advantagesTitle: 'Артықшылықтары',
    advantagesSubtitle: 'Не ұсына алады',
    advantages: [
      'Дұрыс қолданғанда жүктілік қаупін айтарлықтай азайтады',
      'Етеккірді тұрақтырақ және болжамдырақ ете алады',
      'Кейбір адамдарда ауыру мен қан кетуді азайта алады',
      'Сізге сәйкес келмесе, түзетуге немесе ауыстыруға болады',
    ],
    limitationsTitle: 'Шектеулері',
    limitationsSubtitle: 'Назар аударатын мәселелер',
    limitations: [
      'Таблетканың түріне байланысты тұрақты қабылдауды қажет етеді',
      'Дозаны өткізіп алу оның тиімділігін төмендетуі мүмкін',
      'Кейбір адамдарда жанама әсерлер болуы мүмкін',
      'Жыныстық жолмен берілетін инфекциялардан (ЖЖБИ) қорғамайды',
    ],
    takeawayTitle: 'Түсінуге тұрарлық әдіс',
    takeawayText: 'Таблетка дұрыс қолданғанда тиімді гормондық контрацепция әдісі болып табылады. Оны тұрақты қабылдау, ықтимал жанама әсерлері және ЖЖБИ-ден қорғамайтыны білуге маңызды нәрселер.',
    finalTipText: 'Контрацепцияны ойластырып жатсаңыз немесе қазіргі әдісіңіз сізге сәйкес келмесе, дәрігермен, акушермен немесе басқа медицина маманымен сөйлесуден тартынбаңыз.',
    shareMessage: 'Контрацептивтік таблетканы түсіну — AWA',
  },
  wo: {
    badge: 'PILUL ŊÀBBAL ËMB',
    title: 'Xam\npilul ŋàbbal ëmb',
    metaDuration: '7 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Naka pilul bi di dem, naka ñuy naan ko bés bu nekk, ak njariñ ak dayo yu mag yi.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Naka pilul bi di dem',
      'Naan ko bu jub bés bu nekk',
      'Njariñ ak dayo',
      'Li am solo',
    ],
    body1: 'Pilul bi am na hormon — estrojen ak/walla progestin, ci xeet bi — yu di tëj walla bañ ovilasiyoŋ. Dafay soppi itam ndox mu bërëb jëmm, ba tax sperm yi jafe a jàll.',
    tip1Title: 'Lu baax a xam',
    tip1Text: 'Pilul yi wuute nañu ci xeet, boole na pilul yu ñuy boole ak yu progestin rekk. Seen jëmm ak naka ñuy naan leen mën nañu wuute.',
    body2: 'Naan ko bu sax am solo na. Ci xeetu pilul bi, li war a def ginnaaw bu ñu fàttee mën na wuute — kon am solo na nga seet nduumu garab bi.',
    routineTips: [
      'Tànn benn waxtu bu yomb a fàttaliku (lekk, nelaw...)',
      'Jëfandikoo benn fàttali walla appli bu ko soxlaa',
      'Denc nduumu garab bi ci sa wet bu am xel-ñaar',
    ],
    sectionIntro: 'Ni anam bu ŋàbbal ëmb bu nekk, pilul bi am na njariñ waaye am na itam yenn dayo yu war a xam balaa nga ko tànn.',
    advantagesTitle: 'Njariñ',
    advantagesSubtitle: 'Li mu mën a joxe',
    advantages: [
      'Dafay wàññi lool ndiggalu ëmb bu ñu ko jëfandikoo ak teg',
      'Mën na def sa règle yi gën a jub te gën a xamsi',
      'Mën na wàññi metit ak deret ci yenn nit',
      'Mën nañu ko soppi walla wuutu bu mu la méngoowul',
    ],
    limitationsTitle: 'Dayo',
    limitationsSubtitle: 'Li war a xam',
    limitations: [
      'Soxla naan bu sax ci xeetu pilul bi',
      'Naan yu ñu fàtte mën nañu wàññi kàttanam',
      'Yenn nit mën nañu am lu ñuy gis ginnaaw',
      'Du aar ci feebar yu jaam (IST)',
    ],
    takeawayTitle: 'Benn anam bu war a xam',
    takeawayText: 'Pilul bi benn anam bu ŋàbbal ëmb bu hormon la bu am kàttan bu ñu ko jëfandikoo ak teg. Naan ko bu sax, li ñuy gis ginnaaw ak amul aar ci IST yi, yu am solo lañu war a xam.',
    finalTipText: 'Bu nga di xalaat ŋàbbal ëmb walla sa anam bu tey méngoowul la, bu ñaaw a wax ak benn doktoor, ndey-jur walla beneen liggéeykatu wér.',
    shareMessage: 'Xam pilul ŋàbbal ëmb — AWA',
  },
  ha: {
    badge: 'KWAYAR HANA HAIHUWA',
    title: 'Fahimtar\nkwayar hana haihuwa',
    metaDuration: 'karatun minti 7',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Yadda kwayar ke aiki, yadda ake shan ta kullum, da muhimman fa’idodinta da iyakokinta.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Yadda kwayar ke aiki',
      'Shanta daidai kullum',
      'Fa’idodi da iyaka',
      'Muhimman abubuwa',
    ],
    body1: 'Kwayar tana ɗauke da hormone — estrogen da/ko progestin, bisa nau’i — waɗanda galibi suke aiki ta hanyar hana ko toshe fitar ƙwai. Tana kuma sauya majinar mahaifa, wanda ke sa wucewar maniyyi ta yi wahala.',
    tip1Title: 'Abin da ya kamata ki sani',
    tip1Text: 'Akwai nau’ikan kwayoyi da dama, har da kwayoyin da aka haɗa da kwayoyin progestin kaɗai. Abin da ke cikinsu da yadda ake shansu na iya bambanta.',
    body2: 'Shan ta akai-akai yana da muhimmanci. Bisa nau’in kwayar, abin da za a yi bayan manta ɗaya na iya bambanta — don haka yana da muhimmanci a duba takardar bayanin maganinki.',
    routineTips: [
      'Zaɓi lokaci na rana da ke da sauƙin tunawa (abinci, kwanciya...)',
      'Yi amfani da tunatarwa ko manhaja idan ya zama dole',
      'Ajiye takardar bayanin a hannu idan akwai shakka',
    ],
    sectionIntro: 'Kamar kowace hanyar hana haihuwa, kwayar tana da fa’idodi amma kuma wasu iyakoki da ya kamata a sani kafin a zaɓe ta.',
    advantagesTitle: 'Fa’idodi',
    advantagesSubtitle: 'Abin da za ta iya bayarwa',
    advantages: [
      'Tana rage haɗarin ciki sosai idan aka yi amfani da ita daidai',
      'Tana iya sa haila ta zama mai tsari da sauƙin hasashe',
      'Tana iya rage ciwo da zubar jini ga wasu mutane',
      'Ana iya daidaita ta ko canza ta idan ba ta dace da ke ba',
    ],
    limitationsTitle: 'Iyaka',
    limitationsSubtitle: 'Abubuwan da ya kamata a sani',
    limitations: [
      'Tana bukatar shan ta akai-akai bisa nau’in kwayar',
      'Mantawa na iya rage tasirinta',
      'Wasu mutane na iya samun illoli',
      'Ba ta kare daga cututtukan jima’i (STIs)',
    ],
    takeawayTitle: 'Hanya da ya dace a fahimta',
    takeawayText: 'Kwayar hanya ce mai tasiri ta hana haihuwa ta hormone idan aka yi amfani da ita daidai. Shan ta akai-akai, illolinta, da rashin kariya daga STIs muhimman abubuwa ne da ya kamata a sani.',
    finalTipText: 'Idan kina tunanin hana haihuwa ko hanyarki ta yanzu ba ta dace da ke ba, kada ki yi jinkirin yin magana da likita, ungozoma, ko wani ma’aikacin lafiya.',
    shareMessage: 'Fahimtar kwayar hana haihuwa — AWA',
  },
  am: {
    badge: 'የእርግዝና መከላከያ ኪኒን',
    title: 'የእርግዝና መከላከያ\nኪኒንን መረዳት',
    metaDuration: '7 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ኪኒኑ እንዴት እንደሚሠራ፣ በየቀኑ እንዴት እንደሚወሰድ፣ እና ዋና ዋና ጥቅሞቹና ገደቦቹ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ኪኒኑ እንዴት እንደሚሠራ',
      'በየቀኑ በትክክል መውሰድ',
      'ጥቅሞች እና ገደቦች',
      'ዋና ዋና ነጥቦች',
    ],
    body1: 'ኪኒኑ እንደ ዓይነቱ ኢስትሮጅን እና/ወይም ፕሮጄስቲን የተባሉ ሆርሞኖችን ይይዛል፣ እነዚህም በዋናነት እንቁላል መልቀቅን በመከላከል ወይም በማገድ ይሠራሉ። የማህፀን በር ንፋጭንም ይለውጣል፣ ይህም የወንድ ዘር እንዳያልፍ ያደርጋል።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text: 'የተደባለቁ ኪኒኖችንና ፕሮጄስቲን ብቻ ያላቸውን ጨምሮ በርካታ የኪኒን ዓይነቶች አሉ። ይዘታቸውና አወሳሰዳቸው ሊለያይ ይችላል።',
    body2: 'በተከታታይ መውሰድ አስፈላጊ ነው። እንደ ኪኒኑ ዓይነት፣ መጠን ከተረሳ በኋላ ምን ማድረግ እንዳለብሽ ሊለያይ ይችላል — ስለዚህ የመድኃኒትሽን መመሪያ ወረቀት መመልከት አስፈላጊ ነው።',
    routineTips: [
      'ለማስታወስ ቀላል የሆነ የቀኑን ሰዓት ምረጪ (ምግብ፣ ከመተኛት በፊት...)',
      'ካስፈለገ ማስታወሻ ወይም መተግበሪያ ተጠቀሚ',
      'ጥርጣሬ ሲኖር የመመሪያ ወረቀቱን በእጅሽ ይኑር',
    ],
    sectionIntro: 'እንደ ማንኛውም የእርግዝና መከላከያ ዘዴ፣ ኪኒኑ ጥቅሞች አሉት ነገር ግን ከመምረጥሽ በፊት ማወቅ የሚገቡ አንዳንድ ገደቦችም አሉት።',
    advantagesTitle: 'ጥቅሞች',
    advantagesSubtitle: 'ምን ሊሰጥ እንደሚችል',
    advantages: [
      'በትክክል ሲወሰድ የእርግዝና አደጋን በእጅጉ ይቀንሳል',
      'የወር አበባን ይበልጥ ወጥ እና ሊተነበይ የሚችል ሊያደርግ ይችላል',
      'ለአንዳንድ ሰዎች ህመምንና ደም መፍሰስን ሊቀንስ ይችላል',
      'ካልተስማማሽ ሊስተካከል ወይም ሊቀየር ይችላል',
    ],
    limitationsTitle: 'ገደቦች',
    limitationsSubtitle: 'ልብ ሊባሉ የሚገቡ ነጥቦች',
    limitations: [
      'እንደ ኪኒኑ ዓይነት በየጊዜው መውሰድ ይጠይቃል',
      'የተረሱ መጠኖች ውጤታማነቱን ሊቀንሱ ይችላሉ',
      'አንዳንድ ሰዎች የጎንዮሽ ጉዳቶች ሊያጋጥማቸው ይችላል',
      'ከግብረ ሥጋ ግንኙነት ከሚተላለፉ ኢንፌክሽኖች (STIs) አይከላከልም',
    ],
    takeawayTitle: 'መረዳት የሚገባው ዘዴ',
    takeawayText: 'ኪኒኑ በትክክል ሲወሰድ ውጤታማ የሆርሞን የእርግዝና መከላከያ ዘዴ ነው። በተከታታይ መውሰድ፣ ሊኖሩ የሚችሉ የጎንዮሽ ጉዳቶቹ፣ እና ከSTIs አለመከላከሉ ማወቅ አስፈላጊ ነገሮች ናቸው።',
    finalTipText: 'የእርግዝና መከላከያን እያሰብሽ ከሆነ ወይም አሁን ያለው ዘዴሽ ካልተስማማሽ፣ ከሐኪም፣ ከሚድዋይፍ ወይም ከሌላ የጤና ባለሙያ ጋር ለመነጋገር አትዘገዪ።',
    shareMessage: 'የእርግዝና መከላከያ ኪኒንን መረዳት — AWA',
  },
  nl: {
    badge: 'ANTICONCEPTIEPIL',
    title: 'De anticonceptiepil\nbegrijpen',
    metaDuration: '7 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Hoe de pil werkt, hoe je hem dagelijks inneemt en wat de belangrijkste voordelen en beperkingen zijn.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Hoe de pil werkt',
      'Hem elke dag correct innemen',
      'Voordelen en beperkingen',
      'Belangrijkste punten',
    ],
    body1: 'De pil bevat hormonen — oestrogeen en/of progestageen, afhankelijk van het type — die vooral werken door de eisprong te voorkomen of te blokkeren. Ze verandert ook het baarmoederhalsslijm, waardoor zaadcellen er moeilijker doorheen komen.',
    tip1Title: 'Goed om te weten',
    tip1Text: 'Er bestaan meerdere soorten pillen, waaronder gecombineerde pillen en pillen met alleen progestageen. De samenstelling en de manier van innemen kunnen verschillen.',
    body2: 'Consequent innemen is belangrijk. Afhankelijk van het type pil kan wat je moet doen na een vergeten dosis verschillen — daarom is het essentieel om de bijsluiter van je medicijn te raadplegen.',
    routineTips: [
      'Kies een moment van de dag dat je makkelijk onthoudt (een maaltijd, bedtijd...)',
      'Gebruik zo nodig een herinnering of een app',
      'Houd de bijsluiter bij de hand voor het geval je twijfelt',
    ],
    sectionIntro: 'Zoals elke anticonceptiemethode heeft de pil voordelen, maar ook bepaalde beperkingen die je moet kennen voordat je kiest.',
    advantagesTitle: 'Voordelen',
    advantagesSubtitle: 'Wat ze kan bieden',
    advantages: [
      'Verkleint het risico op zwangerschap sterk bij correct gebruik',
      'Kan de menstruatie regelmatiger en voorspelbaarder maken',
      'Kan voor sommige mensen pijn en bloedverlies verminderen',
      'Kan worden aangepast of gewijzigd als ze niet bij je past',
    ],
    limitationsTitle: 'Beperkingen',
    limitationsSubtitle: 'Punten om rekening mee te houden',
    limitations: [
      'Vereist regelmatige inname, afhankelijk van het type pil',
      'Vergeten doses kunnen de werking verminderen',
      'Sommige mensen kunnen bijwerkingen ervaren',
      'Beschermt niet tegen seksueel overdraagbare aandoeningen (soa’s)',
    ],
    takeawayTitle: 'Een methode die het waard is te begrijpen',
    takeawayText: 'De pil is een effectieve hormonale anticonceptiemethode bij correct gebruik. Consequent innemen, de mogelijke bijwerkingen en het ontbreken van bescherming tegen soa’s zijn belangrijke dingen om te weten.',
    finalTipText: 'Als je anticonceptie overweegt of je huidige methode niet goed bij je past, aarzel dan niet om met een huisarts, verloskundige of andere zorgverlener te praten.',
    shareMessage: 'De anticonceptiepil begrijpen — AWA',
  },
  fi: {
    badge: 'EHKÄISYPILLERI',
    title: 'Ehkäisypillerin\nymmärtäminen',
    metaDuration: '7 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Miten pilleri toimii, miten sitä otetaan päivittäin ja mitkä ovat sen tärkeimmät edut ja rajoitukset.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Miten pilleri toimii',
      'Oikea otto joka päivä',
      'Edut ja rajoitukset',
      'Tärkeimmät asiat',
    ],
    body1: 'Pilleri sisältää hormoneja — tyypistä riippuen estrogeenia ja/tai progestiinia — jotka toimivat pääasiassa estämällä tai pysäyttämällä ovulaation. Ne muuttavat myös kohdunkaulan limaa, mikä vaikeuttaa siittiöiden pääsyä läpi.',
    tip1Title: 'Hyvä tietää',
    tip1Text: 'Pillereitä on useita tyyppejä, muun muassa yhdistelmäpillerit ja pelkkää progestiinia sisältävät pillerit. Niiden koostumus ja ottotapa voivat vaihdella.',
    body2: 'Säännöllinen otto on tärkeää. Pillerityypistä riippuen toimintaohje unohtuneen annoksen jälkeen voi vaihdella — siksi lääkkeesi pakkausselostetta on tärkeää tarkistaa.',
    routineTips: [
      'Valitse vuorokaudenaika, jonka on helppo muistaa (ateria, nukkumaanmeno...)',
      'Käytä tarvittaessa muistutusta tai sovellusta',
      'Pidä pakkausseloste käden ulottuvilla epäselvissä tilanteissa',
    ],
    sectionIntro: 'Kuten jokaisella ehkäisymenetelmällä, pillerillä on etuja mutta myös tiettyjä rajoituksia, jotka kannattaa tuntea ennen valintaa.',
    advantagesTitle: 'Edut',
    advantagesSubtitle: 'Mitä se voi tarjota',
    advantages: [
      'Vähentää raskauden riskiä huomattavasti, kun sitä käytetään oikein',
      'Voi tehdä kuukautisista säännöllisemmät ja ennustettavammat',
      'Voi vähentää kipua ja vuotoa joillakin',
      'Sitä voi säätää tai vaihtaa, jos se ei sovi sinulle',
    ],
    limitationsTitle: 'Rajoitukset',
    limitationsSubtitle: 'Huomioitavat asiat',
    limitations: [
      'Vaatii säännöllistä ottoa pillerityypistä riippuen',
      'Unohtuneet annokset voivat heikentää sen tehoa',
      'Joillakin voi esiintyä sivuvaikutuksia',
      'Ei suojaa sukupuolitaudeilta',
    ],
    takeawayTitle: 'Menetelmä, jonka ymmärtäminen kannattaa',
    takeawayText: 'Pilleri on tehokas hormonaalinen ehkäisymenetelmä, kun sitä käytetään oikein. Säännöllinen otto, mahdolliset sivuvaikutukset ja suojan puuttuminen sukupuolitaudeilta ovat tärkeitä tietää.',
    finalTipText: 'Jos harkitset ehkäisyä tai nykyinen menetelmäsi ei toimi sinulle, älä epäröi puhua lääkärin, kätilön tai muun terveydenhuollon ammattilaisen kanssa.',
    shareMessage: 'Ehkäisypillerin ymmärtäminen — AWA',
  },
  el: {
    badge: 'ΑΝΤΙΣΥΛΛΗΠΤΙΚΟ ΧΑΠΙ',
    title: 'Κατανοώντας\nτο αντισυλληπτικό χάπι',
    metaDuration: '7 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Πώς λειτουργεί το χάπι, πώς να το παίρνεις καθημερινά και ποια είναι τα κύρια πλεονεκτήματα και τα όριά του.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Πώς λειτουργεί το χάπι',
      'Σωστή λήψη κάθε ημέρα',
      'Πλεονεκτήματα και περιορισμοί',
      'Βασικά συμπεράσματα',
    ],
    body1: 'Το χάπι περιέχει ορμόνες — οιστρογόνο ή/και προγεσταγόνο, ανάλογα με τον τύπο — που δρουν κυρίως αποτρέποντας ή αναστέλλοντας την ωορρηξία. Αλλάζει επίσης την τραχηλική βλέννα, κάτι που δυσκολεύει τη διέλευση των σπερματοζωαρίων.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text: 'Υπάρχουν διάφοροι τύποι χαπιών, μεταξύ των οποίων τα συνδυασμένα χάπια και τα χάπια μόνο με προγεσταγόνο. Η σύνθεσή τους και ο τρόπος λήψης τους μπορεί να διαφέρουν.',
    body2: 'Η συνεπής λήψη έχει σημασία. Ανάλογα με τον τύπο του χαπιού, το τι πρέπει να κάνεις μετά από μια δόση που παραλείφθηκε μπορεί να διαφέρει — γι’ αυτό είναι απαραίτητο να ελέγχεις το φύλλο οδηγιών του φαρμάκου σου.',
    routineTips: [
      'Διάλεξε μια ώρα της ημέρας που είναι εύκολο να θυμάσαι (ένα γεύμα, την ώρα του ύπνου...)',
      'Χρησιμοποίησε μια υπενθύμιση ή μια εφαρμογή αν χρειάζεται',
      'Κράτα το φύλλο οδηγιών πρόχειρο σε περίπτωση αμφιβολίας',
    ],
    sectionIntro: 'Όπως κάθε αντισυλληπτική μέθοδος, το χάπι έχει πλεονεκτήματα αλλά και ορισμένους περιορισμούς που πρέπει να γνωρίζεις πριν το επιλέξεις.',
    advantagesTitle: 'Πλεονεκτήματα',
    advantagesSubtitle: 'Τι μπορεί να προσφέρει',
    advantages: [
      'Μειώνει σημαντικά τον κίνδυνο εγκυμοσύνης όταν χρησιμοποιείται σωστά',
      'Μπορεί να κάνει τις περιόδους πιο κανονικές και προβλέψιμες',
      'Μπορεί να μειώσει τον πόνο και την αιμορραγία σε ορισμένες γυναίκες',
      'Μπορεί να προσαρμοστεί ή να αλλάξει αν δεν σου ταιριάζει',
    ],
    limitationsTitle: 'Περιορισμοί',
    limitationsSubtitle: 'Σημεία που πρέπει να γνωρίζεις',
    limitations: [
      'Απαιτεί τακτική λήψη ανάλογα με τον τύπο του χαπιού',
      'Οι δόσεις που παραλείπονται μπορούν να μειώσουν την αποτελεσματικότητά του',
      'Ορισμένες γυναίκες μπορεί να παρουσιάσουν παρενέργειες',
      'Δεν προστατεύει από τις σεξουαλικά μεταδιδόμενες λοιμώξεις (ΣΜΛ)',
    ],
    takeawayTitle: 'Μια μέθοδος που αξίζει να κατανοήσεις',
    takeawayText: 'Το χάπι είναι μια αποτελεσματική ορμονική αντισυλληπτική μέθοδος όταν χρησιμοποιείται σωστά. Η συνεπής λήψη, οι πιθανές παρενέργειες και η έλλειψη προστασίας από τις ΣΜΛ είναι σημαντικά πράγματα που πρέπει να γνωρίζεις.',
    finalTipText: 'Αν σκέφτεσαι να ξεκινήσεις αντισύλληψη ή η τρέχουσα μέθοδός σου δεν σου ταιριάζει, μην διστάσεις να μιλήσεις με έναν γιατρό, μια μαία ή άλλον επαγγελματία υγείας.',
    shareMessage: 'Κατανοώντας το αντισυλληπτικό χάπι — AWA',
  },
  fil: {
    badge: 'BIRTH CONTROL PILL',
    title: 'Pag-unawa sa\nbirth control pill',
    metaDuration: '7 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Paano gumagana ang pill, paano ito inumin araw-araw, at ang mga pangunahing kalamangan at limitasyon nito.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Paano gumagana ang pill',
      'Tamang pag-inom araw-araw',
      'Mga kalamangan at limitasyon',
      'Mahahalagang tandaan',
    ],
    body1: 'May hormone ang pill — estrogen at/o progestin, depende sa uri — na pangunahing gumagana sa pamamagitan ng pagpigil o pagharang sa obulasyon. Binabago rin nito ang cervical mucus, na nagpapahirap sa pagdaan ng tamud.',
    tip1Title: 'Mabuting malaman',
    tip1Text: 'May ilang uri ng pill, kabilang ang pinagsamang pill at pill na progestin lamang. Maaaring magkaiba ang kanilang komposisyon at paraan ng pag-inom.',
    body2: 'Mahalaga ang pare-parehong pag-inom. Depende sa uri ng pill, maaaring magkaiba ang gagawin pagkatapos ng nalimutang dose — kaya mahalagang suriin ang leaflet ng iyong gamot.',
    routineTips: [
      'Pumili ng oras ng araw na madaling tandaan (isang pagkain, oras ng pagtulog...)',
      'Gumamit ng paalala o app kung kinakailangan',
      'Itabi ang leaflet kung sakaling magduda',
    ],
    sectionIntro: 'Tulad ng anumang paraan ng contraception, may mga kalamangan ang pill ngunit may ilang limitasyon ding dapat malaman bago ito piliin.',
    advantagesTitle: 'Mga kalamangan',
    advantagesSubtitle: 'Ang maaari nitong ialok',
    advantages: [
      'Lubos na binabawasan ang panganib ng pagbubuntis kapag tama ang paggamit',
      'Maaaring gawing mas regular at predictable ang mga regla',
      'Maaaring magbawas ng sakit at pagdurugo sa ilang babae',
      'Maaaring ayusin o palitan kung hindi ito akma sa iyo',
    ],
    limitationsTitle: 'Mga limitasyon',
    limitationsSubtitle: 'Mga puntong dapat malaman',
    limitations: [
      'Nangangailangan ng regular na pag-inom depende sa uri ng pill',
      'Maaaring bumaba ang bisa kapag may nalimutang dose',
      'May ilang babaeng maaaring makaranas ng mga side effect',
      'Hindi nagpoprotekta laban sa mga sexually transmitted infection (STI)',
    ],
    takeawayTitle: 'Isang paraang dapat unawain',
    takeawayText: 'Mabisang hormonal na paraan ng contraception ang pill kapag tama ang paggamit. Mahalagang malaman ang pare-parehong pag-inom, ang mga posibleng side effect, at ang kawalan ng proteksyon laban sa mga STI.',
    finalTipText: 'Kung iniisip mong magsimula ng contraception o hindi akma sa iyo ang kasalukuyan mong paraan, huwag mag-atubiling kausapin ang doktor, komadrona, o ibang propesyonal sa kalusugan.',
    shareMessage: 'Pag-unawa sa birth control pill — AWA',
  },
  ta: {
    badge: 'கருத்தடை மாத்திரை',
    title: 'கருத்தடை மாத்திரையைப்\nபுரிந்துகொள்ளுதல்',
    metaDuration: '7 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'மாத்திரை எப்படிச் செயல்படுகிறது, அன்றாடம் அதை எப்படி எடுத்துக்கொள்வது, அதன் முக்கிய நன்மைகளும் வரம்புகளும்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'மாத்திரை எப்படிச் செயல்படுகிறது',
      'தினமும் சரியாக எடுத்துக்கொள்ளுதல்',
      'நன்மைகளும் வரம்புகளும்',
      'முக்கியக் குறிப்புகள்',
    ],
    body1: 'மாத்திரையில் ஹார்மோன்கள் உள்ளன — வகையைப் பொறுத்து ஈஸ்ட்ரோஜன் மற்றும்/அல்லது புரோஜெஸ்டின் — அவை முக்கியமாக அண்டவிடுப்பைத் தடுப்பதன் மூலமோ முடக்குவதன் மூலமோ செயல்படுகின்றன. இது கருப்பைவாய் சளியையும் மாற்றுகிறது, இதனால் விந்தணுக்கள் கடந்து செல்வது கடினமாகிறது.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text: 'கூட்டு மாத்திரைகள் மற்றும் புரோஜெஸ்டின் மட்டும் கொண்ட மாத்திரைகள் உட்பட பல வகை மாத்திரைகள் உள்ளன. அவற்றின் கலவையும் எடுத்துக்கொள்ளும் முறையும் மாறுபடலாம்.',
    body2: 'தொடர்ந்து எடுத்துக்கொள்வது முக்கியம். மாத்திரையின் வகையைப் பொறுத்து, ஓர் அளவு தவறிய பின் என்ன செய்வது என்பது வேறுபடலாம் — எனவே உங்கள் மருந்தின் பெட்டியில் உள்ள துண்டுச் சீட்டைச் சரிபார்ப்பது அவசியம்.',
    routineTips: [
      'நினைவில் வைத்துக்கொள்ள எளிதான நாளின் ஒரு நேரத்தைத் தேர்ந்தெடுங்கள் (ஒரு உணவு, படுக்கை நேரம்...)',
      'தேவைப்பட்டால் ஒரு நினைவூட்டலையோ செயலியையோ பயன்படுத்துங்கள்',
      'சந்தேகம் ஏற்பட்டால் துண்டுச் சீட்டை கைவசம் வைத்திருங்கள்',
    ],
    sectionIntro: 'எந்தக் கருத்தடை முறையையும் போலவே, மாத்திரைக்கும் நன்மைகள் உண்டு, ஆனால் தேர்ந்தெடுக்கும் முன் அறிய வேண்டிய சில வரம்புகளும் உண்டு.',
    advantagesTitle: 'நன்மைகள்',
    advantagesSubtitle: 'அது வழங்கக்கூடியவை',
    advantages: [
      'சரியாகப் பயன்படுத்தும்போது கர்ப்பத்தின் அபாயத்தை பெரிதும் குறைக்கிறது',
      'மாதவிடாய்களை மேலும் ஒழுங்கானதாகவும் கணிக்கக்கூடியதாகவும் ஆக்கலாம்',
      'சிலருக்கு வலியையும் இரத்தப்போக்கையும் குறைக்கலாம்',
      'உங்களுக்குப் பொருந்தாவிட்டால் சரிசெய்யலாம் அல்லது மாற்றலாம்',
    ],
    limitationsTitle: 'வரம்புகள்',
    limitationsSubtitle: 'அறிந்திருக்க வேண்டிய புள்ளிகள்',
    limitations: [
      'மாத்திரையின் வகையைப் பொறுத்து தொடர்ந்து எடுத்துக்கொள்ள வேண்டும்',
      'தவறிய அளவுகள் அதன் செயல்திறனைக் குறைக்கலாம்',
      'சிலருக்குப் பக்கவிளைவுகள் ஏற்படலாம்',
      'பாலியல் தொற்றுகளிலிருந்து (STI) பாதுகாக்காது',
    ],
    takeawayTitle: 'புரிந்துகொள்ளத் தகுந்த ஒரு முறை',
    takeawayText: 'சரியாகப் பயன்படுத்தும்போது மாத்திரை ஒரு பயனுள்ள ஹார்மோன் கருத்தடை முறை. தொடர்ந்து எடுத்துக்கொள்வது, அதன் சாத்தியமான பக்கவிளைவுகள், STI-களிலிருந்து பாதுகாப்பு இல்லாமை ஆகியவை அறிந்திருக்க வேண்டிய முக்கிய விஷயங்கள்.',
    finalTipText: 'நீங்கள் கருத்தடையைப் பரிசீலித்தால் அல்லது உங்கள் தற்போதைய முறை உங்களுக்குப் பொருந்தவில்லை என்றால், ஒரு மருத்துவர், மருத்துவச்சி அல்லது பிற சுகாதார நிபுணரிடம் பேசத் தயங்காதீர்கள்.',
    shareMessage: 'கருத்தடை மாத்திரையைப் புரிந்துகொள்ளுதல் — AWA',
  },
  te: {
    badge: 'గర్భనిరోధక మాత్ర',
    title: 'గర్భనిరోధక మాత్రను\nఅర్థం చేసుకోవడం',
    metaDuration: '7 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మాత్ర ఎలా పనిచేస్తుంది, రోజువారీగా దాన్ని ఎలా వేసుకోవాలి, దాని ప్రధాన ప్రయోజనాలు, పరిమితులు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'మాత్ర ఎలా పనిచేస్తుంది',
      'ప్రతి రోజూ సరిగ్గా వేసుకోవడం',
      'ప్రయోజనాలు, పరిమితులు',
      'ముఖ్యాంశాలు',
    ],
    body1: 'మాత్రలో హార్మోన్లు ఉంటాయి — రకాన్ని బట్టి ఈస్ట్రోజెన్ మరియు/లేదా ప్రొజెస్టిన్ — ఇవి ప్రధానంగా అండోత్సర్గాన్ని నిరోధించడం లేదా అడ్డుకోవడం ద్వారా పనిచేస్తాయి. ఇది గర్భాశయ ముఖద్వార స్రావాన్ని కూడా మారుస్తుంది, దీనివల్ల శుక్రకణాలు దాటడం కష్టమవుతుంది.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text: 'కలిపి ఉండే మాత్రలు, ప్రొజెస్టిన్ మాత్రమే ఉండే మాత్రలతో సహా అనేక రకాల మాత్రలు ఉన్నాయి. వాటి సమ్మేళనం, వేసుకునే విధానం మారవచ్చు.',
    body2: 'క్రమం తప్పకుండా వేసుకోవడం ముఖ్యం. మాత్ర రకాన్ని బట్టి, ఒక మోతాదు మర్చిపోయిన తర్వాత ఏం చేయాలనేది భిన్నంగా ఉండవచ్చు — కాబట్టి మీ మందు ప్యాకేజీ లోపలి కరపత్రాన్ని సరిచూసుకోవడం తప్పనిసరి.',
    routineTips: [
      'గుర్తుంచుకోవడానికి సులభమైన రోజులో ఒక సమయాన్ని ఎంచుకోండి (భోజనం, పడుకునే సమయం...)',
      'అవసరమైతే రిమైండర్ లేదా యాప్‌ను ఉపయోగించండి',
      'సందేహం వస్తే కరపత్రాన్ని అందుబాటులో ఉంచుకోండి',
    ],
    sectionIntro: 'ఏ గర్భనిరోధక పద్ధతిలాగే, మాత్రకు ప్రయోజనాలు ఉన్నాయి, అలాగే ఎంచుకునే ముందు తెలుసుకోవాల్సిన కొన్ని పరిమితులు కూడా ఉన్నాయి.',
    advantagesTitle: 'ప్రయోజనాలు',
    advantagesSubtitle: 'అది ఏమి అందించగలదు',
    advantages: [
      'సరిగ్గా ఉపయోగిస్తే గర్భధారణ ప్రమాదాన్ని చాలా తగ్గిస్తుంది',
      'నెలసరులను మరింత క్రమబద్ధంగా, ఊహించదగినవిగా చేయవచ్చు',
      'కొందరిలో నొప్పిని, రక్తస్రావాన్ని తగ్గించవచ్చు',
      'మీకు సరిపోకపోతే సర్దుబాటు చేయవచ్చు లేదా మార్చవచ్చు',
    ],
    limitationsTitle: 'పరిమితులు',
    limitationsSubtitle: 'గమనించాల్సిన అంశాలు',
    limitations: [
      'మాత్ర రకాన్ని బట్టి క్రమం తప్పకుండా వేసుకోవాలి',
      'మర్చిపోయిన మోతాదులు దాని ప్రభావాన్ని తగ్గించవచ్చు',
      'కొందరికి దుష్ప్రభావాలు ఉండవచ్చు',
      'లైంగికంగా సంక్రమించే ఇన్ఫెక్షన్ల (STI) నుండి రక్షించదు',
    ],
    takeawayTitle: 'అర్థం చేసుకోదగిన ఒక పద్ధతి',
    takeawayText: 'మాత్ర సరిగ్గా ఉపయోగిస్తే ప్రభావవంతమైన హార్మోన్ గర్భనిరోధక పద్ధతి. క్రమం తప్పకుండా వేసుకోవడం, దాని సాధ్యమైన దుష్ప్రభావాలు, STIల నుండి రక్షణ లేకపోవడం తెలుసుకోవాల్సిన ముఖ్య విషయాలు.',
    finalTipText: 'మీరు గర్భనిరోధకం గురించి ఆలోచిస్తున్నా లేదా మీ ప్రస్తుత పద్ధతి మీకు సరిపోకపోయినా, ఒక వైద్యులతో, మంత్రసానితో లేదా మరో ఆరోగ్య నిపుణుడితో మాట్లాడటానికి వెనుకాడకండి.',
    shareMessage: 'గర్భనిరోధక మాత్రను అర్థం చేసుకోవడం — AWA',
  },
  mr: {
    badge: 'गर्भनिरोधक गोळी',
    title: 'गर्भनिरोधक गोळी\nसमजून घेणे',
    metaDuration: '7 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'गोळी कशी काम करते, रोज ती कशी घ्यावी आणि तिचे मुख्य फायदे व मर्यादा.',
    contentsTitle: 'या लेखात',
    topics: [
      'गोळी कशी काम करते',
      'रोज ती योग्य प्रकारे घेणे',
      'फायदे आणि मर्यादा',
      'मुख्य मुद्दे',
    ],
    body1: 'गोळीमध्ये हार्मोन्स — प्रकारानुसार इस्ट्रोजेन आणि/किंवा प्रोजेस्टिन — असतात, जे प्रामुख्याने बीजोत्सर्जन रोखून किंवा अडवून काम करतात. ती गर्भाशयमुखाचा स्रावही बदलते, ज्यामुळे शुक्राणूंना आत जाणे कठीण होते.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text: 'गोळ्यांचे अनेक प्रकार आहेत, ज्यात संयुक्त गोळ्या आणि फक्त प्रोजेस्टिनच्या गोळ्यांचा समावेश आहे. त्यांची रचना आणि त्या घेण्याची पद्धत वेगवेगळी असू शकते.',
    body2: 'ती नियमित घेणे महत्त्वाचे आहे. गोळीच्या प्रकारानुसार, एखादी मात्रा चुकल्यानंतर काय करावे ते वेगळे असू शकते — म्हणून तुमच्या औषधाचे माहितीपत्रक तपासणे आवश्यक आहे.',
    routineTips: [
      'दिवसातील लक्षात ठेवायला सोपी वेळ निवडा (जेवण, झोपण्याची वेळ...)',
      'गरज असल्यास स्मरण किंवा अ‍ॅप वापरा',
      'शंका आल्यास माहितीपत्रक जवळ ठेवा',
    ],
    sectionIntro: 'कोणत्याही गर्भनिरोधक पद्धतीप्रमाणे, गोळीचे फायदे आहेत पण निवडण्यापूर्वी माहीत असायला हव्यात अशा काही मर्यादाही आहेत.',
    advantagesTitle: 'फायदे',
    advantagesSubtitle: 'ती काय देऊ शकते',
    advantages: [
      'योग्य प्रकारे वापरल्यास गर्भधारणेचा धोका मोठ्या प्रमाणात कमी करते',
      'पाळी अधिक नियमित आणि अंदाज लावता येण्याजोगी करू शकते',
      'काहींसाठी वेदना आणि रक्तस्राव कमी करू शकते',
      'ती तुम्हाला न जुळल्यास समायोजित किंवा बदलता येते',
    ],
    limitationsTitle: 'मर्यादा',
    limitationsSubtitle: 'लक्षात ठेवायचे मुद्दे',
    limitations: [
      'गोळीच्या प्रकारानुसार नियमित सेवन आवश्यक असते',
      'चुकलेल्या मात्रा तिची परिणामकारकता कमी करू शकतात',
      'काहींना दुष्परिणाम जाणवू शकतात',
      'लैंगिक संसर्गांपासून (STI) संरक्षण देत नाही',
    ],
    takeawayTitle: 'समजून घेण्यासारखी एक पद्धत',
    takeawayText: 'योग्य प्रकारे वापरल्यास गोळी ही एक परिणामकारक हार्मोनल गर्भनिरोधक पद्धत आहे. ती नियमित घेणे, तिचे संभाव्य दुष्परिणाम आणि लैंगिक संसर्गांपासून संरक्षण नसणे या महत्त्वाच्या गोष्टी जाणून घेणे गरजेचे आहे.',
    finalTipText: 'तुम्ही गर्भनिरोधनाचा विचार करत असाल किंवा तुमची सध्याची पद्धत तुम्हाला जुळत नसेल, तर डॉक्टर, दाई किंवा इतर आरोग्य व्यावसायिकाशी बोलायला संकोच करू नका.',
    shareMessage: 'गर्भनिरोधक गोळी समजून घेणे — AWA',
  },
  gu: {
    badge: 'ગર્ભનિરોધક ગોળી',
    title: 'ગર્ભનિરોધક ગોળીને\nસમજવી',
    metaDuration: '7 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'ગોળી કેવી રીતે કામ કરે છે, રોજ કેવી રીતે લેવી, અને તેના મુખ્ય ફાયદા તથા મર્યાદાઓ.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'ગોળી કેવી રીતે કામ કરે છે',
      'દરરોજ યોગ્ય રીતે લેવી',
      'ફાયદા અને મર્યાદાઓ',
      'મુખ્ય મુદ્દા',
    ],
    body1: 'ગોળીમાં હોર્મોન હોય છે — પ્રકાર પ્રમાણે એસ્ટ્રોજન અને/અથવા પ્રોજેસ્ટિન — જે મુખ્યત્વે અંડોત્સર્જનને અટકાવીને કે રોકીને કામ કરે છે. તે ગર્ભાશયમુખના સ્રાવમાં પણ ફેરફાર કરે છે, જેથી શુક્રાણુઓ માટે પસાર થવું વધુ મુશ્કેલ બને છે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text: 'ગોળીના ઘણા પ્રકારો છે, જેમાં સંયુક્ત ગોળીઓ અને માત્ર પ્રોજેસ્ટિનવાળી ગોળીઓનો સમાવેશ થાય છે. તેમની રચના અને લેવાની રીત અલગ હોઈ શકે છે.',
    body2: 'નિયમિત રીતે લેવી મહત્વપૂર્ણ છે. ગોળીના પ્રકાર પ્રમાણે, ગોળી ચૂકી જાઓ ત્યારે શું કરવું તે અલગ હોઈ શકે છે — તેથી તમારી દવાની પત્રિકા તપાસવી જરૂરી છે.',
    routineTips: [
      'દિવસનો એવો સમય પસંદ કરો જે યાદ રાખવો સહેલો હોય (ભોજન, સૂવાનો સમય...)',
      'જરૂર પડે તો રિમાઇન્ડર કે એપનો ઉપયોગ કરો',
      'શંકા થાય તો જોવા માટે પત્રિકા હાથવગી રાખો',
    ],
    sectionIntro: 'કોઈ પણ ગર્ભનિરોધન પદ્ધતિની જેમ, ગોળીના ફાયદા છે પણ તેને પસંદ કરતાં પહેલાં જાણવા જેવી કેટલીક મર્યાદાઓ પણ છે.',
    advantagesTitle: 'ફાયદા',
    advantagesSubtitle: 'તે શું આપી શકે',
    advantages: [
      'યોગ્ય રીતે વાપરવાથી ગર્ભાવસ્થાનું જોખમ ઘણું ઘટાડે છે',
      'માસિકને વધુ નિયમિત અને અનુમાનિત બનાવી શકે',
      'કેટલીક સ્ત્રીઓમાં દુખાવો અને સ્રાવ ઘટાડી શકે',
      'તમને અનુકૂળ ન આવે તો ગોઠવી કે બદલી શકાય',
    ],
    limitationsTitle: 'મર્યાદાઓ',
    limitationsSubtitle: 'જાણવા જેવા મુદ્દા',
    limitations: [
      'ગોળીના પ્રકાર પ્રમાણે નિયમિત લેવી પડે છે',
      'ચૂકેલી ગોળીઓ તેની અસરકારકતા ઘટાડી શકે',
      'કેટલીક સ્ત્રીઓને આડઅસરો થઈ શકે',
      'જાતીય સંક્રમિત ચેપ (STI) સામે રક્ષણ આપતી નથી',
    ],
    takeawayTitle: 'સમજવા જેવી પદ્ધતિ',
    takeawayText: 'યોગ્ય રીતે વાપરવામાં આવે ત્યારે ગોળી એક અસરકારક હોર્મોનલ ગર્ભનિરોધન પદ્ધતિ છે. નિયમિત લેવી, તેની સંભવિત આડઅસરો અને STI સામે રક્ષણના અભાવ વિશે જાણવું મહત્વપૂર્ણ છે.',
    finalTipText: 'જો તમે ગર્ભનિરોધન વિશે વિચારી રહ્યાં હો અથવા તમારી હાલની પદ્ધતિ તમને અનુકૂળ ન આવતી હોય, તો ડૉક્ટર, મિડવાઇફ કે અન્ય આરોગ્ય વ્યાવસાયિક સાથે વાત કરવામાં અચકાશો નહીં.',
    shareMessage: 'ગર્ભનિરોધક ગોળીને સમજવી — AWA',
  },
  pa: {
    badge: 'ਗਰਭ ਨਿਰੋਧਕ ਗੋਲੀ',
    title: 'ਗਰਭ ਨਿਰੋਧਕ ਗੋਲੀ ਨੂੰ\nਸਮਝਣਾ',
    metaDuration: '7 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਗੋਲੀ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ, ਇਸ ਨੂੰ ਰੋਜ਼ ਕਿਵੇਂ ਲੈਣਾ ਹੈ, ਅਤੇ ਇਸ ਦੇ ਮੁੱਖ ਫ਼ਾਇਦੇ ਤੇ ਸੀਮਾਵਾਂ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਗੋਲੀ ਕਿਵੇਂ ਕੰਮ ਕਰਦੀ ਹੈ',
      'ਹਰ ਰੋਜ਼ ਸਹੀ ਢੰਗ ਨਾਲ ਲੈਣਾ',
      'ਫ਼ਾਇਦੇ ਅਤੇ ਸੀਮਾਵਾਂ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    body1: 'ਗੋਲੀ ਵਿੱਚ ਹਾਰਮੋਨ ਹੁੰਦੇ ਹਨ — ਕਿਸਮ ਅਨੁਸਾਰ ਐਸਟ੍ਰੋਜਨ ਅਤੇ/ਜਾਂ ਪ੍ਰੋਜੈਸਟੀਨ — ਜੋ ਮੁੱਖ ਤੌਰ ’ਤੇ ਓਵੂਲੇਸ਼ਨ ਨੂੰ ਰੋਕ ਕੇ ਜਾਂ ਬਲਾਕ ਕਰਕੇ ਕੰਮ ਕਰਦੇ ਹਨ। ਇਹ ਬੱਚੇਦਾਨੀ ਦੇ ਮੂੰਹ ਦੇ ਰਿਸਾਅ ਨੂੰ ਵੀ ਬਦਲਦੀ ਹੈ, ਜਿਸ ਨਾਲ ਸ਼ੁਕਰਾਣੂਆਂ ਦਾ ਲੰਘਣਾ ਔਖਾ ਹੋ ਜਾਂਦਾ ਹੈ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text: 'ਗੋਲੀਆਂ ਦੀਆਂ ਕਈ ਕਿਸਮਾਂ ਹਨ, ਜਿਨ੍ਹਾਂ ਵਿੱਚ ਮਿਲੀਆਂ-ਜੁਲੀਆਂ ਗੋਲੀਆਂ ਅਤੇ ਸਿਰਫ਼ ਪ੍ਰੋਜੈਸਟੀਨ ਵਾਲੀਆਂ ਗੋਲੀਆਂ ਸ਼ਾਮਲ ਹਨ। ਇਨ੍ਹਾਂ ਦੀ ਬਣਤਰ ਅਤੇ ਲੈਣ ਦਾ ਢੰਗ ਵੱਖ-ਵੱਖ ਹੋ ਸਕਦਾ ਹੈ।',
    body2: 'ਨਿਯਮਿਤ ਤੌਰ ’ਤੇ ਲੈਣਾ ਮਹੱਤਵਪੂਰਨ ਹੈ। ਗੋਲੀ ਦੀ ਕਿਸਮ ਅਨੁਸਾਰ, ਗੋਲੀ ਛੁੱਟ ਜਾਣ ਤੋਂ ਬਾਅਦ ਕੀ ਕਰਨਾ ਹੈ, ਇਹ ਵੱਖਰਾ ਹੋ ਸਕਦਾ ਹੈ — ਇਸ ਲਈ ਆਪਣੀ ਦਵਾਈ ਦੇ ਪੈਕੇਟ ਵਿੱਚ ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਪਰਚੀ ਨੂੰ ਜ਼ਰੂਰ ਦੇਖੋ।',
    routineTips: [
      'ਦਿਨ ਦਾ ਅਜਿਹਾ ਸਮਾਂ ਚੁਣੋ ਜੋ ਯਾਦ ਰੱਖਣਾ ਸੌਖਾ ਹੋਵੇ (ਖਾਣੇ ਦਾ ਸਮਾਂ, ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ...)',
      'ਲੋੜ ਪੈਣ ’ਤੇ ਯਾਦ-ਦਹਾਨੀ ਜਾਂ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰੋ',
      'ਸ਼ੱਕ ਹੋਣ ’ਤੇ ਦੇਖਣ ਲਈ ਜਾਣਕਾਰੀ ਪਰਚੀ ਕੋਲ ਰੱਖੋ',
    ],
    sectionIntro: 'ਹਰ ਗਰਭ ਨਿਰੋਧ ਵਿਧੀ ਵਾਂਗ, ਗੋਲੀ ਦੇ ਫ਼ਾਇਦੇ ਹਨ ਪਰ ਕੁਝ ਸੀਮਾਵਾਂ ਵੀ ਹਨ ਜਿਨ੍ਹਾਂ ਨੂੰ ਚੁਣਨ ਤੋਂ ਪਹਿਲਾਂ ਜਾਣਨਾ ਚਾਹੀਦਾ ਹੈ।',
    advantagesTitle: 'ਫ਼ਾਇਦੇ',
    advantagesSubtitle: 'ਇਹ ਕੀ ਦੇ ਸਕਦੀ ਹੈ',
    advantages: [
      'ਸਹੀ ਢੰਗ ਨਾਲ ਵਰਤਣ ’ਤੇ ਗਰਭ ਦੇ ਖ਼ਤਰੇ ਨੂੰ ਬਹੁਤ ਘਟਾਉਂਦੀ ਹੈ',
      'ਮਾਹਵਾਰੀ ਨੂੰ ਵਧੇਰੇ ਨਿਯਮਿਤ ਅਤੇ ਅਨੁਮਾਨਯੋਗ ਬਣਾ ਸਕਦੀ ਹੈ',
      'ਕੁਝ ਔਰਤਾਂ ਵਿੱਚ ਦਰਦ ਅਤੇ ਖ਼ੂਨ ਵਹਿਣ ਨੂੰ ਘਟਾ ਸਕਦੀ ਹੈ',
      'ਜੇ ਇਹ ਤੁਹਾਨੂੰ ਰਾਸ ਨਾ ਆਵੇ ਤਾਂ ਇਸ ਨੂੰ ਬਦਲਿਆ ਜਾਂ ਸੋਧਿਆ ਜਾ ਸਕਦਾ ਹੈ',
    ],
    limitationsTitle: 'ਸੀਮਾਵਾਂ',
    limitationsSubtitle: 'ਧਿਆਨ ਰੱਖਣ ਵਾਲੀਆਂ ਗੱਲਾਂ',
    limitations: [
      'ਗੋਲੀ ਦੀ ਕਿਸਮ ਅਨੁਸਾਰ ਨਿਯਮਿਤ ਤੌਰ ’ਤੇ ਲੈਣ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ',
      'ਗੋਲੀ ਛੁੱਟਣ ਨਾਲ ਇਸ ਦੀ ਅਸਰਦਾਇਕਤਾ ਘੱਟ ਸਕਦੀ ਹੈ',
      'ਕੁਝ ਔਰਤਾਂ ਨੂੰ ਮਾੜੇ ਪ੍ਰਭਾਵ ਹੋ ਸਕਦੇ ਹਨ',
      'ਜਿਨਸੀ ਸੰਚਾਰਿਤ ਲਾਗਾਂ (STI) ਤੋਂ ਬਚਾਅ ਨਹੀਂ ਕਰਦੀ',
    ],
    takeawayTitle: 'ਇੱਕ ਅਜਿਹੀ ਵਿਧੀ ਜਿਸ ਨੂੰ ਸਮਝਣਾ ਚਾਹੀਦਾ ਹੈ',
    takeawayText: 'ਸਹੀ ਢੰਗ ਨਾਲ ਵਰਤਣ ’ਤੇ ਗੋਲੀ ਇੱਕ ਅਸਰਦਾਇਕ ਹਾਰਮੋਨਲ ਗਰਭ ਨਿਰੋਧਕ ਵਿਧੀ ਹੈ। ਨਿਯਮਿਤ ਤੌਰ ’ਤੇ ਲੈਣਾ, ਇਸ ਦੇ ਸੰਭਾਵੀ ਮਾੜੇ ਪ੍ਰਭਾਵ ਅਤੇ STI ਤੋਂ ਬਚਾਅ ਦਾ ਨਾ ਹੋਣਾ ਜਾਣਨ ਵਾਲੀਆਂ ਅਹਿਮ ਗੱਲਾਂ ਹਨ।',
    finalTipText: 'ਜੇ ਤੁਸੀਂ ਗਰਭ ਨਿਰੋਧ ਬਾਰੇ ਸੋਚ ਰਹੇ ਹੋ ਜਾਂ ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਵਿਧੀ ਤੁਹਾਨੂੰ ਠੀਕ ਨਹੀਂ ਬੈਠ ਰਹੀ, ਤਾਂ ਡਾਕਟਰ, ਮਿਡਵਾਈਫ਼ ਜਾਂ ਕਿਸੇ ਹੋਰ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨ ਵਿੱਚ ਝਿਜਕ ਨਾ ਕਰੋ।',
    shareMessage: 'ਗਰਭ ਨਿਰੋਧਕ ਗੋਲੀ ਨੂੰ ਸਮਝਣਾ — AWA',
  },
  my: {
    badge: 'ကိုယ်ဝန်တားဆေးပြား',
    title: 'ကိုယ်ဝန်တားဆေးပြားကို\nနားလည်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 7 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'ဆေးပြားအလုပ်လုပ်ပုံ၊ နေ့စဉ်သောက်သုံးပုံနှင့် အဓိကအကျိုးကျေးဇူးများနှင့် ကန့်သတ်ချက်များ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ဆေးပြား အလုပ်လုပ်ပုံ',
      'နေ့စဉ် မှန်ကန်စွာ သောက်သုံးခြင်း',
      'အကျိုးကျေးဇူးများနှင့် ကန့်သတ်ချက်များ',
      'အဓိကအချက်များ',
    ],
    body1: 'ဆေးပြားတွင် အမျိုးအစားပေါ်မူတည်၍ အက်စ်ထရိုဂျင်နှင့်/သို့မဟုတ် ပရိုဂျက်စတင် ဟူသော ဟော်မုန်းများ ပါဝင်ပြီး အဓိကအားဖြင့် မျိုးဥကြွေခြင်းကို တားဆီးခြင်း သို့မဟုတ် ပိတ်ဆို့ခြင်းဖြင့် အလုပ်လုပ်သည်။ ၎င်းသည် သားအိမ်ခေါင်းအချွဲကိုလည်း ပြောင်းလဲစေပြီး သုတ်ပိုးများ ဖြတ်သန်းရန် ပိုခက်ခဲစေသည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text: 'ပေါင်းစပ်ဆေးပြားများနှင့် ပရိုဂျက်စတင်သီးသန့်ဆေးပြားများအပါအဝင် ဆေးပြားအမျိုးအစား အများအပြား ရှိသည်။ ၎င်းတို့၏ ပါဝင်ပစ္စည်းနှင့် သောက်သုံးပုံ ကွာခြားနိုင်သည်။',
    body2: 'ပုံမှန်မပျက်ကွက်ဘဲ သောက်သုံးခြင်းသည် အရေးကြီးသည်။ ဆေးပြားအမျိုးအစားပေါ်မူတည်၍ ဆေးတစ်ကြိမ် မေ့သွားပါက ဆောင်ရွက်ရမည့်အရာ ကွဲပြားနိုင်သဖြင့် သင့်ဆေး၏ ဆေးအညွှန်းစာကို စစ်ဆေးရန် မရှိမဖြစ်လိုအပ်သည်။',
    routineTips: [
      'မှတ်မိရလွယ်သော နေ့စဉ်အချိန်ကို ရွေးပါ (အစားအသောက်၊ အိပ်ရာဝင်ချိန်...)',
      'လိုအပ်ပါက သတိပေးချက် သို့မဟုတ် အက်ပ်တစ်ခု အသုံးပြုပါ',
      'သံသယရှိပါက ဆေးအညွှန်းစာကို လက်လှမ်းမီရာတွင် ထားပါ',
    ],
    sectionIntro: 'ကိုယ်ဝန်တားနည်းလမ်းတိုင်းကဲ့သို့ပင် ဆေးပြားတွင် အကျိုးကျေးဇူးများ ရှိသလို မရွေးချယ်မီ သိထားသင့်သော ကန့်သတ်ချက်အချို့လည်း ရှိသည်။',
    advantagesTitle: 'အကျိုးကျေးဇူးများ',
    advantagesSubtitle: 'ပေးစွမ်းနိုင်သည့်အရာများ',
    advantages: [
      'မှန်ကန်စွာ သုံးစွဲပါက ကိုယ်ဝန်ရနိုင်ခြေကို အလွန်လျော့ကျစေသည်',
      'ရာသီလာခြင်းကို ပိုမိုပုံမှန်ဖြစ်စေပြီး ကြိုတင်ခန့်မှန်းရလွယ်စေနိုင်သည်',
      'လူအချို့တွင် နာကျင်မှုနှင့် သွေးထွက်ပမာဏကို လျော့ကျစေနိုင်သည်',
      'မသင့်တော်ပါက ညှိနှိုင်းခြင်း သို့မဟုတ် ပြောင်းလဲခြင်း ပြုလုပ်နိုင်သည်',
    ],
    limitationsTitle: 'ကန့်သတ်ချက်များ',
    limitationsSubtitle: 'သတိပြုရမည့်အချက်များ',
    limitations: [
      'ဆေးပြားအမျိုးအစားပေါ်မူတည်၍ ပုံမှန်သောက်သုံးရန် လိုအပ်သည်',
      'ဆေးမေ့သွားခြင်းသည် ထိရောက်မှုကို လျော့ကျစေနိုင်သည်',
      'လူအချို့တွင် ဘေးထွက်ဆိုးကျိုးများ ဖြစ်ပေါ်နိုင်သည်',
      'လိင်မှတစ်ဆင့်ကူးစက်သောရောဂါ (STI) များမှ မကာကွယ်ပေးပါ',
    ],
    takeawayTitle: 'နားလည်ထားသင့်သော နည်းလမ်း',
    takeawayText: 'ဆေးပြားသည် မှန်ကန်စွာ သုံးစွဲပါက ထိရောက်သော ဟော်မုန်းကိုယ်ဝန်တားနည်းလမ်း ဖြစ်သည်။ ပုံမှန်သောက်သုံးခြင်း၊ ဖြစ်နိုင်သော ဘေးထွက်ဆိုးကျိုးများနှင့် လိင်မှတစ်ဆင့်ကူးစက်သောရောဂါ (STI) များမှ အကာအကွယ်မရှိခြင်းတို့မှာ သိထားရန် အရေးကြီးသည်။',
    finalTipText: 'ကိုယ်ဝန်တားခြင်းကို စဉ်းစားနေပါက သို့မဟုတ် လက်ရှိနည်းလမ်း သင့်အတွက် မအဆင်ပြေပါက ဆရာဝန်၊ သားဖွားဆရာမ သို့မဟုတ် အခြားကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုရန် မတွန့်တိုပါနှင့်။',
    shareMessage: 'ကိုယ်ဝန်တားဆေးပြားကို နားလည်ခြင်း — AWA',
  },
  km: {
    badge: 'ថ្នាំគ្រាប់ពន្យារកំណើត',
    title: 'ស្វែងយល់ពី\nថ្នាំគ្រាប់ពន្យារកំណើត',
    metaDuration: 'អាន 7 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'របៀបដែលថ្នាំគ្រាប់ដំណើរការ របៀបលេបប្រចាំថ្ងៃ និងអត្ថប្រយោជន៍ព្រមទាំងដែនកំណត់សំខាន់ៗរបស់វា។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'របៀបដែលថ្នាំគ្រាប់ដំណើរការ',
      'លេបឱ្យត្រឹមត្រូវរៀងរាល់ថ្ងៃ',
      'អត្ថប្រយោជន៍ និងដែនកំណត់',
      'ចំណុចសំខាន់ៗ',
    ],
    body1: 'ថ្នាំគ្រាប់មានអរម៉ូន — អ៊ែស្ត្រូសែន និង/ឬប្រូសេស្តិន អាស្រ័យលើប្រភេទ — ដែលដំណើរការជាសំខាន់ដោយការទប់ស្កាត់ ឬរារាំងការបញ្ចេញពងអូវុល។ វាក៏ផ្លាស់ប្តូរទឹករំអិលមាត់ស្បូនផងដែរ ដែលធ្វើឱ្យមេជីវិតឈ្មោលឆ្លងកាត់បានពិបាកជាងមុន។',
    tip1Title: 'គួរដឹង',
    tip1Text: 'មានថ្នាំគ្រាប់ច្រើនប្រភេទ រួមទាំងថ្នាំគ្រាប់បញ្ចូលគ្នា និងថ្នាំគ្រាប់មានតែប្រូសេស្តិន។ សមាសភាព និងរបៀបលេបរបស់វាអាចខុសគ្នា។',
    body2: 'ការលេបឱ្យទៀងទាត់មានសារៈសំខាន់។ អាស្រ័យលើប្រភេទថ្នាំគ្រាប់ អ្វីដែលត្រូវធ្វើបន្ទាប់ពីភ្លេចលេបអាចខុសគ្នា — ដូច្នេះវាចាំបាច់ត្រូវពិនិត្យលើក្រដាសណែនាំក្នុងកញ្ចប់ថ្នាំរបស់អ្នក។',
    routineTips: [
      'ជ្រើសរើសពេលវេលាក្នុងមួយថ្ងៃដែលងាយចងចាំ (អាហារមួយពេល ពេលចូលដំណេក...)',
      'ប្រើការរំលឹក ឬកម្មវិធីប្រសិនបើចាំបាច់',
      'រក្សាក្រដាសណែនាំទុកក្បែរខ្លួនក្នុងករណីមានការសង្ស័យ',
    ],
    sectionIntro: 'ដូចវិធីសាស្ត្រពន្យារកំណើតផ្សេងទៀតដែរ ថ្នាំគ្រាប់មានអត្ថប្រយោជន៍ ប៉ុន្តែក៏មានដែនកំណត់មួយចំនួនដែលគួរដឹងមុនពេលជ្រើសរើស។',
    advantagesTitle: 'អត្ថប្រយោជន៍',
    advantagesSubtitle: 'អ្វីដែលវាអាចផ្តល់ឱ្យ',
    advantages: [
      'កាត់បន្ថយហានិភ័យនៃការមានផ្ទៃពោះយ៉ាងច្រើន នៅពេលប្រើត្រឹមត្រូវ',
      'អាចធ្វើឱ្យរដូវទៀងទាត់ និងអាចទាយទុកបានជាងមុន',
      'អាចកាត់បន្ថយការឈឺ និងបរិមាណឈាមសម្រាប់មនុស្សមួយចំនួន',
      'អាចកែសម្រួល ឬប្តូរបានប្រសិនបើវាមិនសមស្របនឹងអ្នក',
    ],
    limitationsTitle: 'ដែនកំណត់',
    limitationsSubtitle: 'ចំណុចដែលត្រូវដឹង',
    limitations: [
      'ត្រូវលេបឱ្យទៀងទាត់ អាស្រ័យលើប្រភេទថ្នាំគ្រាប់',
      'ការភ្លេចលេបអាចកាត់បន្ថយប្រសិទ្ធភាពរបស់វា',
      'មនុស្សមួយចំនួនអាចមានផលប៉ះពាល់',
      'មិនការពារពីការឆ្លងជំងឺតាមការរួមភេទ (ជំងឺកាមរោគ (STI)) ទេ',
    ],
    takeawayTitle: 'វិធីសាស្ត្រដែលគួរយល់ដឹង',
    takeawayText: 'ថ្នាំគ្រាប់គឺជាវិធីសាស្ត្រពន្យារកំណើតដោយអរម៉ូនដែលមានប្រសិទ្ធភាព នៅពេលប្រើត្រឹមត្រូវ។ ការលេបឱ្យទៀងទាត់ ផលប៉ះពាល់ដែលអាចកើតមាន និងការខ្វះការការពារពីជំងឺកាមរោគ (STI) គឺជារឿងសំខាន់ដែលត្រូវដឹង។',
    finalTipText: 'ប្រសិនបើអ្នកកំពុងពិចារណាអំពីការពន្យារកំណើត ឬវិធីសាស្ត្របច្ចុប្បន្នរបស់អ្នកមិនសមស្រប សូមកុំស្ទាក់ស្ទើរក្នុងការនិយាយជាមួយវេជ្ជបណ្ឌិត ឆ្មប ឬអ្នកជំនាញសុខាភិបាលផ្សេងទៀត។',
    shareMessage: 'ស្វែងយល់ពីថ្នាំគ្រាប់ពន្យារកំណើត — AWA',
  },
  lo: {
    badge: 'ຢາຄຸມກຳເນີດ',
    title: 'ເຂົ້າໃຈ\nຢາຄຸມກຳເນີດ',
    metaDuration: 'ອ່ານ 7 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ຢາຄຸມກຳເນີດເຮັດວຽກແນວໃດ, ກິນໃນແຕ່ລະວັນແນວໃດ ແລະ ຂໍ້ດີ ກັບ ຂໍ້ຈຳກັດຫຼັກຂອງມັນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ຢາຄຸມກຳເນີດເຮັດວຽກແນວໃດ',
      'ກິນໃຫ້ຖືກຕ້ອງທຸກມື້',
      'ຂໍ້ດີ ແລະ ຂໍ້ຈຳກັດ',
      'ຈຸດສຳຄັນ',
    ],
    body1: 'ຢາຄຸມກຳເນີດມີຮໍໂມນ — ເອສໂຕຣເຈັນ ແລະ/ຫຼື ໂປຣເຈສຕິນ ຂຶ້ນກັບຊະນິດ — ເຊິ່ງເຮັດວຽກຫຼັກໂດຍປ້ອງກັນ ຫຼື ຂັດຂວາງການຕົກໄຂ່. ມັນຍັງປ່ຽນເມືອກປາກມົດລູກ ເຮັດໃຫ້ເຊື້ອອະສຸຈິຜ່ານໄດ້ຍາກຂຶ້ນ.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text: 'ຢາຄຸມກຳເນີດມີຫຼາຍຊະນິດ ລວມທັງຢາແບບປະສົມ ແລະ ຢາທີ່ມີສະເພາະໂປຣເຈສຕິນ. ສ່ວນປະກອບ ແລະ ວິທີກິນອາດແຕກຕ່າງກັນ.',
    body2: 'ການກິນຢ່າງສະໝ່ຳສະເໝີສຳຄັນ. ຂຶ້ນກັບຊະນິດຂອງຢາ ສິ່ງທີ່ຄວນເຮັດຫຼັງລືມກິນຢາອາດແຕກຕ່າງກັນ — ສະນັ້ນຈຳເປັນຕ້ອງກວດເອກະສານກຳກັບຢາຂອງທ່ານ.',
    routineTips: [
      'ເລືອກເວລາໃນແຕ່ລະວັນທີ່ຈື່ງ່າຍ (ມື້ອາຫານ, ກ່ອນນອນ...)',
      'ໃຊ້ການເຕືອນ ຫຼື ແອັບ ຖ້າຈຳເປັນ',
      'ເກັບເອກະສານກຳກັບຢາໄວ້ໃກ້ມື ໃນກໍລະນີສົງໄສ',
    ],
    sectionIntro: 'ຄືກັບວິທີຄຸມກຳເນີດທຸກຢ່າງ ຢາຄຸມກຳເນີດມີຂໍ້ດີ ແຕ່ກໍມີຂໍ້ຈຳກັດບາງຢ່າງທີ່ຄວນຮູ້ກ່ອນເລືອກ.',
    advantagesTitle: 'ຂໍ້ດີ',
    advantagesSubtitle: 'ສິ່ງທີ່ມັນສາມາດໃຫ້ໄດ້',
    advantages: [
      'ຫຼຸດຄວາມສ່ຽງຂອງການຖືພາໄດ້ຫຼາຍ ເມື່ອໃຊ້ຢ່າງຖືກຕ້ອງ',
      'ອາດເຮັດໃຫ້ປະຈຳເດືອນມາສະໝ່ຳສະເໝີ ແລະ ຄາດເດົາໄດ້ຂຶ້ນ',
      'ອາດຫຼຸດອາການເຈັບ ແລະ ເລືອດອອກໃນບາງຄົນ',
      'ສາມາດປັບ ຫຼື ປ່ຽນໄດ້ ຖ້າບໍ່ເໝາະກັບທ່ານ',
    ],
    limitationsTitle: 'ຂໍ້ຈຳກັດ',
    limitationsSubtitle: 'ຈຸດທີ່ຄວນຮູ້',
    limitations: [
      'ຕ້ອງກິນຢ່າງສະໝ່ຳສະເໝີ ຂຶ້ນກັບຊະນິດຂອງຢາ',
      'ການລືມກິນຢາອາດຫຼຸດປະສິດທິພາບ',
      'ບາງຄົນອາດມີຜົນຂ້າງຄຽງ',
      'ບໍ່ປ້ອງກັນພະຍາດຕິດຕໍ່ທາງເພດສຳພັນ (STI)',
    ],
    takeawayTitle: 'ວິທີທີ່ຄຸ້ມຄ່າທີ່ຈະເຂົ້າໃຈ',
    takeawayText: 'ຢາຄຸມກຳເນີດເປັນວິທີຄຸມກຳເນີດດ້ວຍຮໍໂມນທີ່ມີປະສິດທິພາບ ເມື່ອໃຊ້ຢ່າງຖືກຕ້ອງ. ການກິນຢ່າງສະໝ່ຳສະເໝີ, ຜົນຂ້າງຄຽງທີ່ອາດເກີດຂຶ້ນ ແລະ ການບໍ່ປ້ອງກັນ STI ເປັນສິ່ງສຳຄັນທີ່ຄວນຮູ້.',
    finalTipText: 'ຖ້າທ່ານກຳລັງພິຈາລະນາການຄຸມກຳເນີດ ຫຼື ວິທີທີ່ໃຊ້ຢູ່ບໍ່ເໝາະກັບທ່ານ ຢ່າລັງເລທີ່ຈະປຶກສາແພດ, ໝໍຕຳແຍ ຫຼື ຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບຄົນອື່ນ.',
    shareMessage: 'ເຂົ້າໃຈຢາຄຸມກຳເນີດ — AWA',
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
