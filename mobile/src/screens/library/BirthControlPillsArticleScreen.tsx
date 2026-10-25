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
  da: {
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
