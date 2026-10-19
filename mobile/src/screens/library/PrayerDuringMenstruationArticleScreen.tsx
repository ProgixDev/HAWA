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

const ID = 'prayerduringmenstruation-la-priere-suspendue';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const WORSHIP_ICONS = [
  'hands-pray',
  'heart-outline',
  'hand-heart-outline',
  'account-heart-outline',
  'book-open-variant',
  'headphones',
  'weather-night',
  'emoticon-happy-outline',
] as const;

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
//
// RELIGIOUS CONTENT — this article is fiqh-adjacent (the suspended prayer
// during menstruation). The English translation preserves every hedge
// ("généralement", "peuvent faire l'objet d'avis différents selon les
// écoles juridiques") and scholarly-referral exactly, states no ruling
// more strongly than the French, and never attributes a position to a
// specific madhhab that the French itself does not attribute.
const CONTENT = {
  fr: {
    badge: 'PRIÈRE PENDANT LES RÈGLES',
    title: 'La prière pendant\nles règles',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi la prière rituelle est suspendue durant cette période, et comment vivre ce moment avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'La prière suspendue pendant les règles',
      'Pas de rattrapage, contrairement au jeûne',
      'Les autres formes d’adoration restent possibles',
      'À retenir',
    ],
    section1Body1: 'Pendant les règles, l’obligation de la prière (salat) est suspendue : la femme n’est pas tenue de prier durant cette période. Cette suspension fait partie intégrante de la pratique religieuse elle-même, reconnue de longue date par la tradition.',
    section1Body2: 'Cette suspension ne signifie en rien un éloignement de la foi ou un relâchement dans la pratique religieuse. Il s’agit d’une dispense reconnue, à vivre sans culpabilité : elle fait partie du cadre naturel de la vie spirituelle d’une femme.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Cette période peut être abordée avec sérénité : elle ne remet en cause ni la valeur de la foi, ni la régularité de la pratique religieuse.',
    section1Body3: 'Si les règles commencent pendant que la prière est en cours, celle-ci est interrompue : elle n’a pas besoin d’être terminée ni rattrapée. À l’inverse, lorsque les règles se terminent, la prière reprend normalement après le ghusl (grande ablution), qui marque le retour à l’état de pureté rituelle.',
    section2Body1: 'Contrairement au jeûne du Ramadan, dont les jours manqués pendant les règles sont rattrapés plus tard (qadaa), les prières manquées pour cette même raison ne sont généralement pas rattrapées après. Cette différence s’explique par la nature même de ces deux actes d’adoration : la prière est un acte quotidien répété plusieurs fois par jour, tandis que le jeûne est annuel et concentré sur un mois précis.',
    section2Body2: 'Cette distinction peut surprendre lorsqu’on découvre le fiqh pour la première fois. Elle ne signifie pas que la prière compte moins : suivre la dispense telle qu’elle est prescrite fait, en soi, pleinement partie de la pratique religieuse.',
    section3Body: 'Ne pas prier pendant les règles ne signifie pas être coupée de sa spiritualité. De nombreuses formes d’adoration et d’engagement religieux restent accessibles durant cette période.',
    worshipActs: [
      'Dhikr (évocation de Dieu)',
      'Du’a (invocations)',
      'Charité',
      'Aider les autres',
      'Apprentissage religieux',
      'Écoute de contenus religieux',
      'Réflexion et gratitude',
      'Gestes de bienveillance',
    ],
    noteTitle: 'À noter',
    noteText: 'Certaines pratiques, comme la récitation ou la manipulation directe du Coran, peuvent faire l’objet d’avis différents selon les écoles juridiques. Se référer à l’avis suivi habituellement, ou demander conseil à un savant qualifié, aide à clarifier ces cas.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'La prière suspendue pendant les règles est une dispense reconnue, à vivre sans culpabilité. De nombreuses formes de spiritualité restent accessibles durant cette période, et l’avis d’un savant qualifié reste la référence pour toute question précise.',
    shareMessage: 'La prière pendant les règles — AWA',
  },
  en: {
    badge: 'PRAYER DURING MENSTRUATION',
    title: 'Prayer during\nmenstruation',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why ritual prayer is suspended during this time, and how to experience this period with serenity.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'The suspended prayer during menstruation',
      'No making up missed prayers, unlike fasting',
      'Other forms of worship remain possible',
      'Key takeaways',
    ],
    section1Body1: 'During menstruation, the obligation of prayer (salat) is suspended: a woman is not required to pray during this period. This suspension is an integral part of religious practice itself, long recognized by tradition.',
    section1Body2: 'This suspension in no way means a distancing from faith or a lapse in religious practice. It is a recognized exemption, to be experienced without guilt: it is part of the natural framework of a woman’s spiritual life.',
    tip1Title: 'Good to know',
    tip1Text: 'This time can be approached with serenity: it calls into question neither the value of one’s faith nor the regularity of one’s religious practice.',
    section1Body3: 'If menstruation begins while prayer is in progress, it is interrupted: it does not need to be finished or made up. Conversely, when menstruation ends, prayer resumes normally after the ghusl (major ablution), which marks the return to the state of ritual purity.',
    section2Body1: 'Unlike the Ramadan fast, whose missed days during menstruation are made up later (qadaa), prayers missed for this same reason are generally not made up afterward. This difference is explained by the very nature of these two acts of worship: prayer is a daily act repeated several times a day, while fasting is annual and concentrated on a specific month.',
    section2Body2: 'This distinction can be surprising when first discovering fiqh. It does not mean that prayer counts for less: following the exemption as it is prescribed is, in itself, fully part of religious practice.',
    section3Body: 'Not praying during menstruation does not mean being cut off from one’s spirituality. Many forms of worship and religious engagement remain accessible during this time.',
    worshipActs: [
      'Dhikr (remembrance of God)',
      'Du’a (supplications)',
      'Charity',
      'Helping others',
      'Religious learning',
      'Listening to religious content',
      'Reflection and gratitude',
      'Acts of kindness',
    ],
    noteTitle: 'Please note',
    noteText: 'Some practices, such as reciting or directly handling the Quran, may be subject to differing opinions depending on the school of jurisprudence. Referring to the opinion you usually follow, or seeking advice from a qualified scholar, helps clarify these cases.',
    tip2Title: 'Good to know',
    tip2Text: 'The suspended prayer during menstruation is a recognized exemption, to be experienced without guilt. Many forms of spirituality remain accessible during this time, and the advice of a qualified scholar remains the reference for any specific question.',
    shareMessage: 'Prayer during menstruation — AWA',
  },
  es: {
    badge: 'ORACIÓN DURANTE LA MENSTRUACIÓN',
    title: 'La oración durante\nla menstruación',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué la oración ritual queda suspendida durante este periodo, y cómo vivirlo con serenidad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'La oración suspendida durante la menstruación',
      'Sin recuperación, a diferencia del ayuno',
      'Otras formas de adoración siguen siendo posibles',
      'Para recordar',
    ],
    section1Body1: 'Durante la menstruación, la obligación de la oración (salat) queda suspendida: la mujer no está obligada a rezar durante este periodo. Esta suspensión forma parte integral de la propia práctica religiosa, reconocida desde hace mucho tiempo por la tradición.',
    section1Body2: 'Esta suspensión no supone en absoluto un alejamiento de la fe ni un relajamiento en la práctica religiosa. Se trata de una dispensa reconocida, que se vive sin culpa: forma parte del marco natural de la vida espiritual de una mujer.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Este periodo puede vivirse con serenidad: no pone en duda ni el valor de la fe ni la regularidad de la práctica religiosa.',
    section1Body3: 'Si la menstruación comienza mientras la oración está en curso, esta se interrumpe: no es necesario terminarla ni recuperarla. A la inversa, cuando la menstruación termina, la oración se reanuda con normalidad después del gusl (ablución mayor), que marca el regreso al estado de pureza ritual.',
    section2Body1: 'A diferencia del ayuno del Ramadán, cuyos días no realizados durante la menstruación se recuperan más tarde (qadaa), las oraciones no realizadas por este mismo motivo generalmente no se recuperan después. Esta diferencia se explica por la propia naturaleza de estos dos actos de adoración: la oración es un acto diario que se repite varias veces al día, mientras que el ayuno es anual y se concentra en un mes concreto.',
    section2Body2: 'Esta distinción puede sorprender cuando se descubre el fiqh por primera vez. No significa que la oración cuente menos: seguir la dispensa tal y como está prescrita forma, en sí misma, plenamente parte de la práctica religiosa.',
    section3Body: 'No rezar durante la menstruación no significa estar desconectada de la propia espiritualidad. Muchas formas de adoración y de compromiso religioso siguen siendo accesibles durante este periodo.',
    worshipActs: [
      'Dhikr (evocación de Dios)',
      'Dua (invocaciones)',
      'Caridad',
      'Ayudar a los demás',
      'Aprendizaje religioso',
      'Escuchar contenidos religiosos',
      'Reflexión y gratitud',
      'Gestos de bondad',
    ],
    noteTitle: 'Para tener en cuenta',
    noteText: 'Algunas prácticas, como la recitación o la manipulación directa del Corán, pueden ser objeto de opiniones distintas según las escuelas jurídicas. Referirse a la opinión que se suele seguir, o pedir consejo a un erudito cualificado, ayuda a aclarar estos casos.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'La oración suspendida durante la menstruación es una dispensa reconocida, que se vive sin culpa. Muchas formas de espiritualidad siguen siendo accesibles durante este periodo, y la opinión de un erudito cualificado sigue siendo la referencia para cualquier pregunta concreta.',
    shareMessage: 'La oración durante la menstruación — AWA',
  },
  it: {
    badge: 'PREGHIERA DURANTE LE MESTRUAZIONI',
    title: 'La preghiera durante\nle mestruazioni',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché la preghiera rituale è sospesa in questo periodo e come viverlo con serenità.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'La preghiera sospesa durante le mestruazioni',
      'Le preghiere perse non si recuperano, a differenza del digiuno',
      'Altre forme di culto restano possibili',
      'Punti chiave',
    ],
    section1Body1: 'Durante le mestruazioni l’obbligo della preghiera (salat) è sospeso: una donna non è tenuta a pregare in questo periodo. Questa sospensione fa parte della pratica religiosa stessa, da lungo tempo riconosciuta dalla tradizione.',
    section1Body2: 'Questa sospensione non significa in alcun modo un allontanamento dalla fede né una mancanza nella pratica religiosa. È un’esenzione riconosciuta, da vivere senza senso di colpa: fa parte del quadro naturale della vita spirituale di una donna.',
    tip1Title: 'Da sapere',
    tip1Text: 'Questo periodo si può vivere con serenità: non mette in discussione né il valore della propria fede né la regolarità della propria pratica religiosa.',
    section1Body3: 'Se le mestruazioni iniziano mentre la preghiera è in corso, questa viene interrotta: non occorre terminarla né recuperarla. Al contrario, quando le mestruazioni finiscono, la preghiera riprende normalmente dopo il ghusl (abluzione maggiore), che segna il ritorno allo stato di purezza rituale.',
    section2Body1: 'A differenza del digiuno di Ramadan, i cui giorni persi durante le mestruazioni vengono recuperati in seguito (qadaa), le preghiere perse per lo stesso motivo in genere non si recuperano. Questa differenza si spiega con la natura stessa dei due atti di culto: la preghiera è un atto quotidiano ripetuto più volte al giorno, mentre il digiuno è annuale e concentrato in un mese preciso.',
    section2Body2: 'Questa distinzione può sorprendere quando si scopre per la prima volta il fiqh. Non significa che la preghiera valga di meno: seguire l’esenzione così come è prescritta fa pienamente parte, di per sé, della pratica religiosa.',
    section3Body: 'Non pregare durante le mestruazioni non significa essere tagliate fuori dalla propria spiritualità. Molte forme di culto e di impegno religioso restano accessibili in questo periodo.',
    worshipActs: [
      'Dhikr (ricordo di Dio)',
      'Du’a (suppliche)',
      'Carità',
      'Aiutare gli altri',
      'Studio religioso',
      'Ascolto di contenuti religiosi',
      'Riflessione e gratitudine',
      'Gesti di gentilezza',
    ],
    noteTitle: 'Attenzione',
    noteText: 'Alcune pratiche, come recitare o toccare direttamente il Corano, possono essere oggetto di pareri diversi a seconda della scuola giuridica. Fare riferimento al parere che segui abitualmente, o chiedere consiglio a uno studioso qualificato, aiuta a chiarire questi casi.',
    tip2Title: 'Da sapere',
    tip2Text: 'La preghiera sospesa durante le mestruazioni è un’esenzione riconosciuta, da vivere senza senso di colpa. Molte forme di spiritualità restano accessibili in questo periodo, e il consiglio di uno studioso qualificato resta il riferimento per qualsiasi questione specifica.',
    shareMessage: 'La preghiera durante le mestruazioni — AWA',
  },
  tr: {
    badge: 'ADET SIRASINDA NAMAZ',
    title: 'Adet sırasında\nnamaz',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bu dönemde ritüel namazın neden askıya alındığı ve bu süreci huzurla nasıl yaşayabileceğin.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak doğrulanmalıdır. AWA fetva veya kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Adet sırasında askıya alınan namaz',
      'Oruçtan farklı olarak kılınamayan namazlar kaza edilmez',
      'Diğer ibadet biçimleri mümkün olmaya devam eder',
      'Öne çıkan noktalar',
    ],
    section1Body1: 'Adet sırasında namaz (salat) yükümlülüğü askıya alınır: kadının bu dönemde namaz kılması gerekmez. Bu askıya alma, dinî pratiğin kendi içinde yer alan ve gelenekte uzun zamandır kabul gören bir parçasıdır.',
    section1Body2: 'Bu askıya alma, imandan uzaklaşmak ya da dinî pratikte bir eksiklik anlamına hiçbir şekilde gelmez. Suçluluk duymadan yaşanması gereken, tanınmış bir muafiyettir: kadının manevi hayatının doğal çerçevesinin bir parçasıdır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bu döneme huzurla yaklaşılabilir: imanın değerini de, dinî pratiğin düzenini de sorgulamaz.',
    section1Body3: 'Namaz sırasında adet başlarsa namaz kesilir: tamamlanması ya da kaza edilmesi gerekmez. Buna karşılık adet bittiğinde, manevi temizliğe dönüşü işaret eden gusülden (büyük boy abdesti) sonra namaz normal şekilde yeniden başlar.',
    section2Body1: 'Adet sırasında tutulamayan günleri sonradan kaza edilen Ramazan orucunun aksine, aynı sebeple kılınamayan namazlar genellikle sonradan kaza edilmez. Bu fark, bu iki ibadetin doğasıyla açıklanır: namaz günde birkaç kez tekrarlanan günlük bir ibadettir, oruç ise yıllıktır ve belirli bir aya yoğunlaşır.',
    section2Body2: 'Bu ayrım, fıkhı yeni keşfederken şaşırtıcı gelebilir. Namazın daha az değer taşıdığı anlamına gelmez: muafiyete öngörüldüğü şekilde uymak, başlı başına dinî pratiğin tam bir parçasıdır.',
    section3Body: 'Adet sırasında namaz kılmamak, maneviyatından kopmak anlamına gelmez. Pek çok ibadet biçimi ve dinî bağlılık şekli bu dönemde de erişilebilir olmaya devam eder.',
    worshipActs: [
      'Zikir (Allah’ı anma)',
      'Dualar',
      'Sadaka',
      'Başkalarına yardım etmek',
      'Dinî öğrenme',
      'Dinî içerikleri dinlemek',
      'Düşünme ve şükretme',
      'İyilik ve nezaket davranışları',
    ],
    noteTitle: 'Dikkat',
    noteText: 'Kur’an’ı okumak veya doğrudan ona dokunmak gibi bazı uygulamalar, mezhebe göre farklı görüşlere konu olabilir. Genellikle uyduğun görüşe başvurmak ya da yetkin bir âlimden görüş almak bu durumları netleştirmeye yardımcı olur.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Adet sırasında namazın askıya alınması, suçluluk duymadan yaşanması gereken, tanınmış bir muafiyettir. Bu dönemde maneviyatın pek çok biçimi erişilebilir kalır; belirli bir soru için yetkin bir âlimin görüşü başvurulacak kaynak olmaya devam eder.',
    shareMessage: 'Adet sırasında namaz — AWA',
  },
  ru: {
    badge: 'НАМАЗ ВО ВРЕМЯ МЕНСТРУАЦИИ',
    title: 'Намаз во время\nменструации',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему обязательный намаз приостанавливается в этот период и как прожить это время спокойно.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. По религиозным вопросам следует обращаться к квалифицированным учёным. AWA не выносит фетв и индивидуальных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Приостановка намаза во время менструации',
      'Пропущенные намазы не восполняются, в отличие от поста',
      'Другие формы поклонения остаются доступными',
      'Главное',
    ],
    section1Body1: 'Во время менструации обязанность совершать намаз (салят) приостанавливается: женщина не обязана молиться в этот период. Эта приостановка является неотъемлемой частью самой религиозной практики и давно признана традицией.',
    section1Body2: 'Эта приостановка ни в коем случае не означает отдаления от веры или упущения в религиозной практике. Это признанное освобождение, которое следует переживать без чувства вины: оно входит в естественные рамки духовной жизни женщины.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'К этому времени можно относиться спокойно: оно не ставит под сомнение ни ценность веры, ни постоянство религиозной практики.',
    section1Body3: 'Если менструация начинается во время намаза, он прерывается: его не нужно ни завершать, ни восполнять. И наоборот, когда менструация заканчивается, намаз возобновляется в обычном порядке после гусля (полного омовения), который отмечает возвращение в состояние ритуальной чистоты.',
    section2Body1: 'В отличие от поста в Рамадан, дни которого, пропущенные во время менструации, восполняются позже (каза), намазы, пропущенные по этой же причине, как правило, потом не восполняются. Эта разница объясняется самой природой этих двух видов поклонения: намаз — ежедневное действие, повторяющееся несколько раз в день, тогда как пост совершается раз в год и приходится на определённый месяц.',
    section2Body2: 'Это различие может удивлять при первом знакомстве с фикхом. Оно не означает, что намаз значит меньше: следование освобождению в том виде, в каком оно предписано, само по себе полностью входит в религиозную практику.',
    section3Body: 'Не совершать намаз во время менструации не значит быть отрезанной от своей духовности. В это время остаются доступными многие формы поклонения и религиозной деятельности.',
    worshipActs: [
      'Зикр (поминание Аллаха)',
      'Дуа (мольбы)',
      'Милостыня',
      'Помощь другим',
      'Изучение религии',
      'Прослушивание религиозных материалов',
      'Размышление и благодарность',
      'Добрые дела',
    ],
    noteTitle: 'Обратите внимание',
    noteText: 'Некоторые практики, например чтение вслух Корана или прикосновение к нему напрямую, могут быть предметом различных мнений в зависимости от мазхаба. Обратиться к мнению, которого вы обычно придерживаетесь, или к совету квалифицированного учёного — значит прояснить такие случаи.',
    tip2Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip2Text: 'Приостановка намаза во время менструации — признанное освобождение, которое следует переживать без чувства вины. В это время остаются доступными многие формы духовной жизни, а совет квалифицированного учёного остаётся ориентиром для любого конкретного вопроса.',
    shareMessage: 'Намаз во время менструации — AWA',
  },
  de: {
    badge: 'GEBET WÄHREND DER MENSTRUATION',
    title: 'Gebet während\nder Menstruation',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum das rituelle Gebet in dieser Zeit ausgesetzt ist und wie du diese Phase gelassen erleben kannst.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt dient ausschließlich der Bildung. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA erlässt keine Fatwas und keine persönlichen religiösen Rechtsgutachten.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Das ausgesetzte Gebet während der Menstruation',
      'Versäumte Gebete werden nicht nachgeholt, anders als beim Fasten',
      'Andere Formen der Anbetung bleiben möglich',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Während der Menstruation ist die Verpflichtung zum Gebet (Salat) ausgesetzt: Eine Frau muss in dieser Zeit nicht beten. Diese Aussetzung ist selbst fester Bestandteil der religiösen Praxis und wird seit jeher von der Tradition anerkannt.',
    section1Body2: 'Diese Aussetzung bedeutet keineswegs, dass man sich vom Glauben entfernt oder die religiöse Praxis vernachlässigt. Es ist eine anerkannte Befreiung, die ohne Schuldgefühle erlebt werden darf: Sie gehört zum natürlichen Rahmen des spirituellen Lebens einer Frau.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Du kannst diese Zeit gelassen angehen: Sie stellt weder den Wert deines Glaubens noch die Regelmäßigkeit deiner religiösen Praxis infrage.',
    section1Body3: 'Beginnt die Menstruation während des Gebets, wird es unterbrochen: Es muss weder zu Ende gebracht noch nachgeholt werden. Wenn die Menstruation endet, wird das Gebet dagegen nach dem Ghusl (große rituelle Waschung) normal wieder aufgenommen, der die Rückkehr in den Zustand ritueller Reinheit markiert.',
    section2Body1: 'Anders als beim Fasten im Ramadan, dessen wegen der Menstruation versäumte Tage später nachgeholt werden (Qada), werden aus demselben Grund versäumte Gebete im Allgemeinen nicht nachgeholt. Dieser Unterschied erklärt sich aus dem Wesen der beiden Gottesdienste: Das Gebet ist eine tägliche, mehrmals wiederholte Handlung, während das Fasten jährlich stattfindet und sich auf einen bestimmten Monat konzentriert.',
    section2Body2: 'Diese Unterscheidung kann beim ersten Kennenlernen des Fiqh überraschen. Sie bedeutet nicht, dass das Gebet weniger zählt: Die Befreiung so zu befolgen, wie sie vorgesehen ist, ist selbst voll und ganz Teil der religiösen Praxis.',
    section3Body: 'In der Menstruation nicht zu beten heißt nicht, von der eigenen Spiritualität abgeschnitten zu sein. Viele Formen der Anbetung und des religiösen Engagements bleiben in dieser Zeit zugänglich.',
    worshipActs: [
      'Dhikr (Gottesgedenken)',
      'Du’a (Bittgebete)',
      'Wohltätigkeit',
      'Anderen helfen',
      'Religiöses Lernen',
      'Religiöse Inhalte anhören',
      'Besinnung und Dankbarkeit',
      'Gute Taten',
    ],
    noteTitle: 'Bitte beachte',
    noteText: 'Bei manchen Praktiken, etwa dem Rezitieren des Korans oder dem direkten Berühren des Korans, können je nach Rechtsschule unterschiedliche Meinungen bestehen. Dich an die Meinung zu halten, der du üblicherweise folgst, oder eine qualifizierte Gelehrte bzw. einen qualifizierten Gelehrten um Rat zu fragen, hilft, solche Fälle zu klären.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Das ausgesetzte Gebet während der Menstruation ist eine anerkannte Befreiung, die ohne Schuldgefühle erlebt werden darf. Viele Formen der Spiritualität bleiben in dieser Zeit zugänglich, und der Rat einer qualifizierten Gelehrten oder eines qualifizierten Gelehrten bleibt die Referenz für jede konkrete Frage.',
    shareMessage: 'Gebet während der Menstruation – AWA',
  },
  zh: {
      badge: '月经期间的礼拜',
      title: '月经期间的\n礼拜',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '为什么这段时间礼拜会被暂停，以及如何平静地度过这段时期。',
      disclaimerTitle: '重要信息',
      disclaimerText: '本内容纯属知识性介绍。宗教方面的问题应由具备资质的学者来确认。AWA 不发布法特瓦（fatwa），也不提供个人化的宗教裁断。',
      contentsTitle: '本文内容',
      topics: [
        '月经期间暂停的礼拜',
        '与斋戒不同，错过的礼拜无需补做',
        '其他形式的功修依然可以进行',
        '要点回顾',
      ],
      section1Body1: '月经期间，礼拜（Salah）的义务被暂停：女性在这段时间无需礼拜。这种暂停本身就是宗教实践的一部分，长期以来为传统所认可。',
      section1Body2: '这种暂停绝不意味着远离信仰，也不意味着宗教实践的中断。这是一种被认可的宽免，应当不带愧疚地度过：它是女性灵修生活自然框架的一部分。',
      tip1Title: '小贴士',
      tip1Text: '可以平静地看待这段时间：它既不会动摇信仰的价值，也不会影响宗教实践的规律性。',
      section1Body3: '如果礼拜进行中月经来潮，礼拜即告中断：无需完成，也无需补做。反过来，月经结束后，在完成大净（Ghusl，即全身净浴）、回到仪式性洁净的状态之后，礼拜便正常恢复。',
      section2Body1: '与斋月斋戒不同，月经期间错过的斋戒日之后需要补斋（Qadaa），而因同样原因错过的礼拜，通常事后无需补做。这一差别源于这两种功修本身的性质：礼拜是每天重复多次的日常功修，而斋戒则是每年集中在特定月份进行。',
      section2Body2: '初次接触教法学（fiqh）时，这一区别可能令人意外。这并不意味着礼拜的分量更轻：按规定遵循这一宽免，本身就完全属于宗教实践。',
      section3Body: '月经期间不礼拜，并不意味着与自己的灵修隔绝。许多功修和宗教参与的方式，在这段时间依然可以进行。',
      worshipActs: [
        '赞念（Dhikr，记念真主）',
        '祈祷（Du’a）',
        '施舍',
        '帮助他人',
        '宗教知识的学习',
        '聆听宗教内容',
        '反思与感恩',
        '善行',
      ],
      noteTitle: '请注意',
      noteText: '有些做法，例如诵读或直接触碰《古兰经》，可能因法学学派不同而存在不同意见。参照你通常遵循的意见，或向具备资质的学者请教，有助于厘清这些情况。',
      tip2Title: '小贴士',
      tip2Text: '月经期间暂停礼拜是一种被认可的宽免，应当不带愧疚地度过。这段时间里，许多灵修的方式依然可以进行；对于任何具体的问题，仍以具备资质的学者的建议为准。',
      shareMessage: '月经期间的礼拜 — AWA',
    },
  id: {
    badge: 'SALAT SAAT MENSTRUASI',
    title: 'Salat saat\nmenstruasi',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa salat ditangguhkan pada masa ini, dan bagaimana menjalani masa ini dengan hati yang tenang.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang berkompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Salat yang ditangguhkan saat menstruasi',
      'Salat yang terlewat tidak diganti, berbeda dengan puasa',
      'Ibadah lain tetap bisa dilakukan',
      'Poin penting',
    ],
    section1Body1: 'Saat menstruasi, kewajiban salat ditangguhkan: seorang perempuan tidak diwajibkan salat selama masa ini. Penangguhan ini merupakan bagian dari praktik keagamaan itu sendiri, yang sudah lama diakui oleh tradisi.',
    section1Body2: 'Penangguhan ini sama sekali tidak berarti menjauh dari iman atau lalai dalam praktik keagamaan. Ini adalah keringanan yang diakui, yang dijalani tanpa rasa bersalah: ia bagian dari kerangka alami kehidupan spiritual seorang perempuan.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Masa ini bisa dijalani dengan tenang: ia tidak mempersoalkan nilai imanmu maupun keteraturan praktik keagamaanmu.',
    section1Body3: 'Jika menstruasi dimulai saat salat sedang berlangsung, salat itu terhenti: tidak perlu diselesaikan atau diganti. Sebaliknya, ketika menstruasi berakhir, salat dilanjutkan seperti biasa setelah mandi wajib (ghusl), yang menandai kembalinya keadaan suci secara ritual.',
    section2Body1: 'Berbeda dengan puasa Ramadan, yang hari-harinya terlewat saat menstruasi lalu diganti kemudian (qada), salat yang terlewat karena alasan yang sama pada umumnya tidak diganti setelahnya. Perbedaan ini dijelaskan oleh sifat kedua ibadah tersebut: salat adalah ibadah harian yang diulang beberapa kali sehari, sedangkan puasa dilakukan setahun sekali dan terpusat pada satu bulan tertentu.',
    section2Body2: 'Perbedaan ini bisa terasa mengejutkan saat pertama kali mengenal fikih. Ini tidak berarti salat bernilai lebih rendah: mengikuti keringanan sebagaimana yang ditetapkan adalah bagian penuh dari praktik keagamaan itu sendiri.',
    section3Body: 'Tidak salat saat menstruasi tidak berarti terputus dari spiritualitasmu. Banyak bentuk ibadah dan kegiatan keagamaan yang tetap bisa dijalani pada masa ini.',
    worshipActs: [
      'Zikir (mengingat Allah)',
      'Doa (permohonan)',
      'Bersedekah',
      'Membantu sesama',
      'Belajar agama',
      'Mendengarkan konten keagamaan',
      'Merenung dan bersyukur',
      'Berbuat baik',
    ],
    noteTitle: 'Harap diperhatikan',
    noteText: 'Beberapa amalan, seperti membaca atau menyentuh langsung Al-Qur\'an, bisa menjadi bahan perbedaan pendapat menurut mazhab fikih. Merujuk pada pendapat yang biasa kamu ikuti, atau meminta saran ulama yang berkompeten, membantu memperjelas hal-hal ini.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Salat yang ditangguhkan saat menstruasi adalah keringanan yang diakui, yang dijalani tanpa rasa bersalah. Banyak bentuk spiritualitas yang tetap bisa dijalani pada masa ini, dan saran ulama yang berkompeten tetap menjadi rujukan untuk setiap pertanyaan khusus.',
    shareMessage: 'Salat saat menstruasi — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PrayerDuringMenstruationArticleScreen({
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

        {/* ARTICLE */}
        <View style={styles.article}>
          {/* CATEGORY */}
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          {/* TITLE */}
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

          {/* INTRODUCTION */}
          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* DISCLAIMER */}
          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.disclaimerTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.disclaimerText}
              </AwaText>
            </View>
          </AwaCard>

          {/* TABLE OF CONTENTS */}
          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>
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
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          {/* TIP */}
          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body3}
          </AwaText>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body2}
          </AwaText>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          {/* WORSHIP GRID */}
          <View style={styles.daily}>
            {content.worshipActs.map((label, index) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={WORSHIP_ICONS[index] as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>
                  {label}
                </AwaText>
              </View>
            ))}
          </View>

          {/* ONLY NECESSARY "À NOTER" */}
          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.noteTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.noteText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tip2Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}
      <ReadingControls
        articleId={ID}
        durationMinutes={6}
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

  /* HERO */
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



  /* ARTICLE */
  article: {
    marginTop: -16,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.background,
  },

  /* BADGE */
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },


  /* TITLE */
  title: {
    marginTop: 12,
  },

  /* METADATA */
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


  /* INTRO */
  intro: {
    marginTop: 16,
  },

  /* ALERT */
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* TABLE OF CONTENTS */
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

  /* SECTION TITLES */
  h2: {
    marginTop: 24,
  },

  /* BODY */
  body: {
    marginTop: 8,
  },

  /* WORSHIP GRID */
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
  },

  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },

  /* TIP */
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 3,
  },
  });
}