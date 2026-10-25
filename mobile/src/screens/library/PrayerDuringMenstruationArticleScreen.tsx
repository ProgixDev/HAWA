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
const CONTENT = withBrazilianPortuguese('PrayerDuringMenstruation', {
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
  hi: {
    badge: 'माहवारी के दौरान नमाज़',
    title: 'माहवारी के दौरान\nनमाज़',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा की गई सामग्री',
    intro: 'इस समय नमाज़ क्यों रुक जाती है, और इस दौर को सुकून के साथ कैसे जिया जाए।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह सामग्री सिर्फ़ जानकारी के लिए है। धार्मिक सवालों की पुष्टि योग्य उलमा से करानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'माहवारी में नमाज़ का रुक जाना',
      'छूटी नमाज़ों की क़ज़ा नहीं, रोज़े से अलग',
      'इबादत के दूसरे रूप अब भी मुमकिन हैं',
      'मुख्य बातें',
    ],
    section1Body1: 'माहवारी के दौरान नमाज़ (सलात) की पाबंदी रुक जाती है: औरत पर इस दौरान नमाज़ पढ़ना ज़रूरी नहीं है। यह रुकावट खुद धार्मिक प्रैक्टिस का हिस्सा है, जिसे परंपरा में लंबे समय से मान्यता मिली हुई है।',
    section1Body2: 'इस रुकावट का मतलब ईमान से दूरी या धार्मिक प्रैक्टिस में कमी बिल्कुल नहीं है। यह एक मान्य रियायत है, जिसे अपराध-बोध के बिना जीना चाहिए: यह औरत की रूहानी ज़िंदगी के प्राकृतिक ढाँचे का हिस्सा है।',
    tip1Title: 'जानने लायक',
    tip1Text: 'इस समय को सुकून के साथ लिया जा सकता है: इससे न किसी के ईमान की क़द्र पर सवाल उठता है, न उसकी धार्मिक प्रैक्टिस की नियमितता पर।',
    section1Body3: 'अगर नमाज़ के दौरान माहवारी शुरू हो जाए, तो नमाज़ वहीं रुक जाती है: उसे पूरा करने या बाद में पढ़ने की ज़रूरत नहीं होती। इसके उलट, माहवारी खत्म होने पर ग़ुस्ल (बड़ी रस्मी सफ़ाई) के बाद नमाज़ सामान्य रूप से दोबारा शुरू हो जाती है, जो पाकी की हालत में लौटने की निशानी है।',
    section2Body1: 'रमज़ान के रोज़े से अलग, जिसके माहवारी में छूटे दिनों की क़ज़ा बाद में की जाती है, इसी वजह से छूटी नमाज़ों की क़ज़ा आमतौर पर बाद में नहीं की जाती। यह फ़र्क इन दोनों इबादतों की प्रकृति से समझ आता है: नमाज़ रोज़ाना की इबादत है जो दिन में कई बार दोहराई जाती है, जबकि रोज़ा सालाना है और एक ख़ास महीने में सिमटा हुआ है।',
    section2Body2: 'फ़िक़्ह को पहली बार जानते समय यह फ़र्क हैरान कर सकता है। इसका मतलब यह नहीं कि नमाज़ की अहमियत कम है: जैसे रियायत दी गई है उसी तरह उस पर चलना खुद धार्मिक प्रैक्टिस का पूरा हिस्सा है।',
    section3Body: 'माहवारी में नमाज़ न पढ़ने का मतलब अपनी रूहानियत से कट जाना नहीं है। इस दौरान इबादत और धार्मिक जुड़ाव के कई रूप अब भी मुमकिन हैं।',
    worshipActs: [
      'ज़िक्र (अल्लाह को याद करना)',
      'दुआएँ',
      'सदक़ा',
      'दूसरों की मदद करना',
      'दीनी इल्म सीखना',
      'धार्मिक बातें सुनना',
      'चिंतन और शुक्र',
      'नेकी के काम',
    ],
    noteTitle: 'ध्यान दें',
    noteText: 'कुछ चीज़ों में, जैसे क़ुरआन की तिलावत करना या उसे सीधे हाथ लगाना, फ़िक़्ही मत (मदहब) के अनुसार अलग-अलग राय हो सकती हैं। जिस राय पर आप आमतौर पर चलती हैं उसे देखना, या किसी योग्य आलिम से सलाह लेना, ऐसे मामलों को साफ़ करने में मदद करता है।',
    tip2Title: 'जानने लायक',
    tip2Text: 'माहवारी में नमाज़ का रुक जाना एक मान्य रियायत है, जिसे अपराध-बोध के बिना जीना चाहिए। इस दौरान रूहानियत के कई रूप खुले रहते हैं, और किसी भी ख़ास सवाल के लिए योग्य आलिम की सलाह ही सबसे भरोसेमंद सहारा है।',
    shareMessage: 'माहवारी के दौरान नमाज़ — AWA',
  },
  sq: {
    badge: 'NAMAZI GJATË MENSTRUACIONIT',
    title: 'Namazi gjatë\nmenstruacionit',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pse namazi ritual pezullohet në këtë kohë dhe si ta jetosh këtë periudhë me qetësi.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhet të vërtetohen nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Namazi i pezulluar gjatë menstruacionit',
      'Nuk kompensohen namazet e munguara, ndryshe nga agjërimi',
      'Format e tjera të adhurimit mbeten të mundshme',
      'Pikat kryesore',
    ],
    section1Body1: 'Gjatë menstruacionit, detyrimi i namazit (salat) pezullohet: gruaja nuk është e detyruar të falet gjatë kësaj periudhe. Ky pezullim është pjesë përbërëse e vetë praktikës fetare, i njohur prej kohësh nga tradita.',
    section1Body2: 'Ky pezullim nuk do të thotë aspak largim nga besimi apo lëshim i praktikës fetare. Është një përjashtim i njohur, që duhet jetuar pa ndjenjë faji: ai është pjesë e kornizës natyrore të jetës shpirtërore të gruas.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Këtë kohë mund ta përqafosh me qetësi: ajo nuk vë në pikëpyetje as vlerën e besimit, as rregullsinë e praktikës fetare.',
    section1Body3: 'Nëse menstruacioni fillon ndërsa namazi është në vazhdim, ai ndërpritet: nuk ka nevojë të përfundohet apo të kompensohet. Anasjelltas, kur mbaron menstruacioni, namazi rifillon normalisht pas guslit (larja e plotë rituale), që shënon kthimin në gjendjen e pastërtisë rituale.',
    section2Body1: 'Ndryshe nga agjërimi i Ramazanit, ditët e munguara të të cilit gjatë menstruacionit kompensohen më vonë (kaza), namazet e munguara për të njëjtën arsye në përgjithësi nuk kompensohen më pas. Ky ndryshim shpjegohet me vetë natyrën e këtyre dy akteve të adhurimit: namazi është një akt i përditshëm që përsëritet disa herë në ditë, ndërsa agjërimi është vjetor dhe i përqendruar në një muaj të caktuar.',
    section2Body2: 'Ky dallim mund të duket i çuditshëm kur e zbulon për herë të parë fikhun. Ai nuk do të thotë se namazi vlen më pak: të ndjekësh përjashtimin ashtu siç është përcaktuar është, në vetvete, plotësisht pjesë e praktikës fetare.',
    section3Body: 'Të mos falesh gjatë menstruacionit nuk do të thotë të shkëputesh nga shpirtërorja jote. Shumë forma adhurimi dhe angazhimi fetar mbeten të arritshme gjatë kësaj kohe.',
    worshipActs: [
      'Dhikri (përmendja e Allahut)',
      'Dua (lutjet)',
      'Bamirësia',
      'Ndihma për të tjerët',
      'Mësimi fetar',
      'Dëgjimi i përmbajtjeve fetare',
      'Reflektimi dhe mirënjohja',
      'Veprat e mira',
    ],
    noteTitle: 'Vëre re',
    noteText: 'Disa praktika, si recitimi ose prekja e drejtpërdrejtë e Kuranit, mund të jenë objekt mendimesh të ndryshme sipas medhhebit. T’i referohesh mendimit që zakonisht ndjek, ose të kërkosh këshillë nga një dijetar i kualifikuar, ndihmon t’i qartësosh këto raste.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Namazi i pezulluar gjatë menstruacionit është një përjashtim i njohur, që duhet jetuar pa ndjenjë faji. Shumë forma shpirtërore mbeten të arritshme gjatë kësaj kohe, dhe këshilla e një dijetari të kualifikuar mbetet referenca për çdo pyetje të veçantë.',
    shareMessage: 'Namazi gjatë menstruacionit — AWA',
  },
  ja: {
    badge: '生理中の礼拝',
    title: '生理中の\n礼拝',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: 'この期間に儀礼としての礼拝が免除される理由と、この時期を穏やかに過ごす方法についてです。',
    disclaimerTitle: '重要なお知らせ',
    disclaimerText: 'このコンテンツは教育を目的としたものです。宗教に関する疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出すことはありません。',
    contentsTitle: 'この記事の内容',
    topics: [
      '生理中に免除される礼拝',
      '断食とは違い、できなかった礼拝の埋め合わせはしない',
      'ほかの信仰行為は続けられる',
      'ポイントのまとめ',
    ],
    section1Body1: '生理中は、礼拝（サラート）の義務が免除されます。女性は、この期間に礼拝を行う必要がありません。この免除は宗教的な実践そのものの一部であり、伝統の中で古くから認められてきました。',
    section1Body2: 'この免除は、信仰から離れることや、宗教的な実践を怠ることを意味するものではありません。認められた免除であり、罪悪感を持たずに受け止められるものです。女性の信仰生活の自然な枠組みの一部です。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'この時間は、穏やかな気持ちで過ごすことができます。信仰の価値も、宗教的な実践の規則正しさも、問い直されることはありません。',
    section1Body3: '礼拝の途中で生理が始まった場合、礼拝はそこで中断されます。最後まで行う必要も、あとで埋め合わせる必要もありません。反対に、生理が終わったときは、清浄（タハーラ）の状態に戻ることを示すグスル（全身を清める沐浴）のあと、ふだんどおりに礼拝を再開します。',
    section2Body1: 'ラマダーンの断食では、生理中にできなかった日をあとでカダーとして埋め合わせますが、同じ理由でできなかった礼拝は、一般にあとから埋め合わせません。この違いは、2つの信仰行為の性質によって説明されます。礼拝は1日に何度も繰り返される日々の行為であり、断食は年に1度、特定の月に集中して行われるものです。',
    section2Body2: 'イスラーム法学（フィクフ）にはじめて触れるとき、この違いは意外に感じられるかもしれません。これは礼拝の価値が低いという意味ではありません。定められたとおりに免除に従うことは、それ自体が宗教的な実践の一部です。',
    section3Body: '生理中に礼拝をしないことは、信仰から切り離されることではありません。この時期にも、さまざまな信仰行為や宗教的な取り組みを続けることができます。',
    worshipActs: [
      'ズィクル（アッラーを想起すること）',
      'ドゥアー（祈願）',
      '施し',
      '人を助けること',
      '宗教の学び',
      '宗教的な内容を聴く',
      '内省と感謝',
      '親切な行い',
    ],
    noteTitle: 'ご注意',
    noteText: 'クルアーンを唱えることや直接手に取ることなど、一部の事柄については、法学派によって意見が分かれることがあります。ふだん従っている意見を参照するか、資格のある学者に助言を求めると、こうした場合を明確にする助けになります。',
    tip2Title: '知っておきたいこと',
    tip2Text: '生理中に礼拝が免除されるのは認められた免除であり、罪悪感を持たずに受け止められるものです。この時期にも、さまざまな信仰の形が続けられます。特定の疑問については、資格のある学者の助言が基準となります。',
    shareMessage: '生理中の礼拝 — AWA',
  },
  ko: {
    badge: '월경 중의 예배',
    title: '월경 중의\n예배',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '이 시기에 의례 예배가 중단되는 이유와, 이 시간을 평온하게 보내는 방법이에요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 순수하게 교육 목적이에요. 종교와 관련된 문제는 자격을 갖춘 학자의 확인을 받아야 해요. AWA는 파트와나 개인에게 맞춘 종교적 판단을 내리지 않아요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '월경 중 중단되는 예배',
      '금식과 달리 놓친 예배는 보충하지 않아요',
      '다른 형태의 예배는 계속할 수 있어요',
      '핵심 정리',
    ],
    section1Body1: '월경 중에는 예배(살라트)의 의무가 중단돼요. 이 기간에는 예배를 드리지 않아도 돼요. 이 중단은 종교 생활 자체의 한 부분이며, 오래전부터 전통에서 인정되어 왔어요.',
    section1Body2: '이 중단은 신앙에서 멀어진다거나 종교 생활이 끊긴다는 뜻이 결코 아니에요. 인정된 면제이므로 죄책감 없이 보내면 되고, 여성의 영적 생활이 가진 자연스러운 틀의 일부예요.',
    tip1Title: '알아 두세요',
    tip1Text: '이 시간은 평온하게 받아들일 수 있어요. 신앙의 가치도, 종교 생활의 꾸준함도 의심받지 않아요.',
    section1Body3: '예배 도중에 월경이 시작되면 예배는 중단되고, 끝까지 마치거나 나중에 보충할 필요가 없어요. 반대로 월경이 끝나면 의례적 정결 상태로 돌아가는 표시인 구슬(전신 정화 목욕)을 한 뒤 예배를 평소처럼 다시 시작해요.',
    section2Body1: '라마단 금식은 월경 중에 놓친 날을 나중에 보충하지만(카다), 같은 이유로 놓친 예배는 일반적으로 나중에 보충하지 않아요. 이 차이는 두 예배 행위의 성격에서 비롯돼요. 예배는 하루에 여러 번 반복되는 일상의 행위이고, 금식은 한 해에 한 번 특정한 달에 집중되어 있어요.',
    section2Body2: '이슬람 법학(피크흐)을 처음 접하면 이런 구분이 낯설게 느껴질 수 있어요. 그렇다고 예배의 가치가 덜하다는 뜻은 아니에요. 정해진 대로 면제를 따르는 것 자체가 종교 생활의 온전한 일부예요.',
    section3Body: '월경 중에 예배를 드리지 않는다고 해서 영성과 단절되는 것은 아니에요. 이 시기에도 할 수 있는 예배와 신앙 활동이 많이 열려 있어요.',
    worshipActs: [
      '지크르(알라를 기억함)',
      '두아(간구)',
      '자선',
      '다른 사람 돕기',
      '종교 공부',
      '종교 콘텐츠 듣기',
      '성찰과 감사',
      '선행',
    ],
    noteTitle: '참고하세요',
    noteText: '꾸란을 낭송하거나 직접 만지는 것 같은 일부 실천은 법학파(마드합)에 따라 의견이 다를 수 있어요. 평소 따르는 의견을 참고하거나 자격을 갖춘 학자에게 조언을 구하면 이런 경우를 분명히 하는 데 도움이 돼요.',
    tip2Title: '알아 두세요',
    tip2Text: '월경 중에 중단되는 예배는 인정된 면제이며 죄책감 없이 보내면 돼요. 이 시기에도 영성을 이어갈 수 있는 방법이 많이 열려 있고, 구체적인 질문이 있을 때는 자격을 갖춘 학자의 조언이 기준이 돼요.',
    shareMessage: '월경 중의 예배 — AWA',
  },
  'pt-PT': {
    badge: 'ORAÇÃO DURANTE A MENSTRUAÇÃO',
    title: 'A oração durante\na menstruação',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque é que a oração ritual fica suspensa nesta altura e como viver este período com serenidade.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'A oração suspensa durante a menstruação',
      'Sem compensar as orações em falta, ao contrário do jejum',
      'Outras formas de culto continuam possíveis',
      'Pontos-chave',
    ],
    section1Body1: 'Durante a menstruação, a obrigação da oração (salá) fica suspensa: a mulher não é obrigada a orar durante este período. Esta suspensão faz parte da própria prática religiosa, reconhecida há muito pela tradição.',
    section1Body2: 'Esta suspensão não significa de modo algum um afastamento da fé ou uma falha na prática religiosa. É uma dispensa reconhecida, a viver sem culpa: faz parte do enquadramento natural da vida espiritual da mulher.',
    tip1Title: 'Bom saber',
    tip1Text: 'Este tempo pode ser vivido com serenidade: não põe em causa nem o valor da fé nem a regularidade da prática religiosa.',
    section1Body3: 'Se a menstruação começar durante a oração, esta é interrompida: não é necessário terminá-la nem compensá-la. Inversamente, quando a menstruação termina, a oração é retomada normalmente após o ghusl (banho ritual), que marca o regresso ao estado de pureza ritual.',
    section2Body1: 'Ao contrário do jejum do Ramadão, cujos dias em falta durante a menstruação são compensados mais tarde (Qada), as orações em falta pela mesma razão não são, em geral, compensadas depois. Esta diferença explica-se pela própria natureza destes dois atos de culto: a oração é um ato diário repetido várias vezes ao dia, enquanto o jejum é anual e concentrado num mês específico.',
    section2Body2: 'Esta distinção pode surpreender quando se descobre o fiqh pela primeira vez. Não significa que a oração valha menos: seguir a dispensa tal como está prescrita faz, por si só, plenamente parte da prática religiosa.',
    section3Body: 'Não orar durante a menstruação não significa ficar separada da sua espiritualidade. Muitas formas de culto e de compromisso religioso continuam acessíveis durante este tempo.',
    worshipActs: [
      'Dhikr (recordação de Deus)',
      'Dua (súplica)',
      'Caridade',
      'Ajudar os outros',
      'Aprendizagem religiosa',
      'Ouvir conteúdos religiosos',
      'Reflexão e gratidão',
      'Gestos de bondade',
    ],
    noteTitle: 'De notar',
    noteText: 'Algumas práticas, como recitar ou tocar diretamente no Alcorão, podem ser objeto de opiniões divergentes consoante a escola jurídica. Recorrer ao parecer que costuma seguir, ou pedir conselho a um sábio qualificado, ajuda a esclarecer estes casos.',
    tip2Title: 'Bom saber',
    tip2Text: 'A oração suspensa durante a menstruação é uma dispensa reconhecida, a viver sem culpa. Muitas formas de espiritualidade continuam acessíveis durante este tempo, e o conselho de um sábio qualificado continua a ser a referência para qualquer questão específica.',
    shareMessage: 'A oração durante a menstruação — AWA',
  },
  bn: {
    badge: 'মাসিকের সময় নামাজ',
    title: 'মাসিকের সময়\nনামাজ',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'এই সময়ে ধর্মীয় নামাজ কেন স্থগিত থাকে এবং এই সময়কে কীভাবে প্রশান্তির সঙ্গে অতিবাহিত করবেন।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় রায় দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মাসিকের সময় স্থগিত নামাজ',
      'রোজার বিপরীতে ছুটে যাওয়া নামাজ কাজা করতে হয় না',
      'অন্যান্য ইবাদত করা সম্ভব থাকে',
      'মূল কথা',
    ],
    section1Body1: 'মাসিকের সময় নামাজের (সালাত) বাধ্যবাধকতা স্থগিত থাকে: এই সময়ে একজন নারীর নামাজ পড়া আবশ্যক নয়। এই স্থগিতাদেশ ধর্মচর্চার নিজস্ব কাঠামোরই অবিচ্ছেদ্য অংশ, যা ঐতিহ্যে দীর্ঘদিন ধরে স্বীকৃত।',
    section1Body2: 'এই স্থগিতাদেশের অর্থ কোনোভাবেই ঈমান থেকে দূরে সরে যাওয়া বা ধর্মচর্চায় ত্রুটি নয়। এটি একটি স্বীকৃত অব্যাহতি, যা অপরাধবোধ ছাড়াই অনুভব করা উচিত: এটি একজন নারীর আধ্যাত্মিক জীবনের স্বাভাবিক কাঠামোর অংশ।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'এই সময়কে প্রশান্তির সঙ্গে গ্রহণ করা যায়: এটি কারও ঈমানের মূল্য বা ধর্মচর্চার নিয়মিততা কোনোটাকেই প্রশ্নবিদ্ধ করে না।',
    section1Body3: 'নামাজ চলাকালীন মাসিক শুরু হলে নামাজ থেমে যায়: তা শেষ করতে বা কাজা করতে হয় না। আবার, মাসিক শেষ হলে গোসলের (ফরজ গোসল) পর নামাজ স্বাভাবিকভাবে আবার শুরু হয়, যা পবিত্রতার (তাহারাত) অবস্থায় ফিরে আসাকে চিহ্নিত করে।',
    section2Body1: 'রমজানের রোজার মতো নয়, যার মাসিকের কারণে ছুটে যাওয়া দিনগুলো পরে কাজা করা হয়, একই কারণে ছুটে যাওয়া নামাজ সাধারণত পরে কাজা করা হয় না। এই পার্থক্যের ব্যাখ্যা এই দুটি ইবাদতের প্রকৃতিতেই নিহিত: নামাজ দৈনিক ইবাদত যা দিনে কয়েকবার পুনরাবৃত্ত হয়, আর রোজা বার্ষিক এবং একটি নির্দিষ্ট মাসে কেন্দ্রীভূত।',
    section2Body2: 'ফিকহের সঙ্গে প্রথম পরিচয়ের সময় এই পার্থক্য বিস্ময়কর মনে হতে পারে। এর অর্থ এই নয় যে নামাজের গুরুত্ব কম: অব্যাহতিটি যেভাবে নির্ধারিত হয়েছে সেভাবে মেনে চলাও নিজেই ধর্মচর্চার পূর্ণ অংশ।',
    section3Body: 'মাসিকের সময় নামাজ না পড়ার অর্থ নিজের আধ্যাত্মিকতা থেকে বিচ্ছিন্ন হয়ে পড়া নয়। এই সময়েও ইবাদত ও ধর্মীয় সম্পৃক্ততার অনেক রূপ হাতের নাগালে থাকে।',
    worshipActs: [
      'যিকির (আল্লাহর স্মরণ)',
      'দোয়া (প্রার্থনা)',
      'দান',
      'অন্যকে সাহায্য করা',
      'ধর্মীয় জ্ঞান অর্জন',
      'ধর্মীয় বিষয়বস্তু শোনা',
      'চিন্তাভাবনা ও কৃতজ্ঞতা',
      'সদাচরণ',
    ],
    noteTitle: 'অনুগ্রহ করে লক্ষ করুন',
    noteText: 'কিছু আমল, যেমন কুরআন তিলাওয়াত করা বা সরাসরি স্পর্শ করা, ফিকহের মাযহাব অনুযায়ী ভিন্ন মতের বিষয় হতে পারে। আপনি সাধারণত যে মত অনুসরণ করেন তা দেখে নেওয়া, অথবা যোগ্য আলেমের পরামর্শ নেওয়া এসব ক্ষেত্র স্পষ্ট করতে সাহায্য করে।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'মাসিকের সময় নামাজ স্থগিত থাকা একটি স্বীকৃত অব্যাহতি, যা অপরাধবোধ ছাড়াই অনুভব করা উচিত। এই সময়েও আধ্যাত্মিকতার অনেক রূপ হাতের নাগালে থাকে, এবং যেকোনো নির্দিষ্ট প্রশ্নে যোগ্য আলেমের পরামর্শই নির্ভরযোগ্য সূত্র।',
    shareMessage: 'মাসিকের সময় নামাজ — AWA',
  },
  da: {
    badge: 'BØN UNDER MENSTRUATION',
    title: 'Salat/bøn under\nmenstruation',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor den rituelle salat/bøn er suspenderet i denne tid, og hvordan du kan opleve denne periode med ro.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er rent uddannelsesmæssigt. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Den suspenderede salat/bøn under menstruation',
      'Ingen indhentning af missede bønner, i modsætning til faste',
      'Andre former for gudsdyrkelse forbliver mulige',
      'Vigtige pointer',
    ],
    section1Body1: 'Under haidh (menstruation) er forpligtelsen til salat/bøn suspenderet: en kvinde er ikke forpligtet til at bede i denne periode. Denne suspension er en integreret del af den religiøse praksis selv, der længe er anerkendt af traditionen.',
    section1Body2: 'Denne suspension betyder på ingen måde en distancering fra tro eller et brud i religiøs praksis. Det er en anerkendt fritagelse, som bør opleves uden skyld: det er en del af den naturlige ramme for en kvindes åndelige liv.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Denne tid kan tilgås med ro: den sætter hverken ens tros værdi eller regelmæssighed i ens religiøse praksis i tvivl.',
    section1Body3: 'Hvis menstruationen begynder, mens salat/bøn er i gang, afbrydes den: den behøver ikke afsluttes eller indhentes. Omvendt, når menstruationen slutter, genoptages bønnen normalt efter ghuslen (den store ablution), som markerer tilbagekomsten til tilstanden af rituel renhed.',
    section2Body1: 'I modsætning til Ramadan-fasten, hvis missede dage under menstruation indhentes senere (qadaa-faste), indhentes bønner, der er misset af samme årsag, generelt ikke bagefter. Denne forskel forklares af selve karakteren af disse to gudsdyrkelseshandlinger: salat/bøn er en daglig handling, der gentages flere gange om dagen, mens faste er årlig og koncentreret om en bestemt måned.',
    section2Body2: 'Denne sondring kan være overraskende, når man første gang opdager fiqh. Det betyder ikke, at salat/bøn tæller for mindre: at følge fritagelsen som foreskrevet er i sig selv fuldt ud en del af religiøs praksis.',
    section3Body: 'At undlade at bede under menstruation betyder ikke at være afskåret fra sin spiritualitet. Mange former for gudsdyrkelse og religiøst engagement forbliver tilgængelige i denne tid.',
    worshipActs: [
      'Dhikr (ihukommelse af Gud)',
      'Du\'a (bønsmålinger)',
      'Velgørenhed',
      'At hjælpe andre',
      'Religiøs læring',
      'At lytte til religiøst indhold',
      'Refleksion og taknemmelighed',
      'Venlige handlinger',
    ],
    noteTitle: 'Bemærk venligst',
    noteText: 'Visse praksisser, såsom at recitere eller direkte håndtere Koranen, kan være genstand for divergerende meninger afhængigt af retsskolen. At henvise til den mening, du sædvanligvis følger, eller at søge råd fra en kvalificeret lærd, hjælper med at afklare disse tilfælde.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Den suspenderede salat/bøn under menstruation er en anerkendt fritagelse, der bør opleves uden skyld. Mange former for spiritualitet forbliver tilgængelige i denne tid, og rådet fra en kvalificeret lærd forbliver referencen for ethvert specifikt spørgsmål.',
    shareMessage: 'Salat/bøn under menstruation — AWA',
  },
  da: {
    badge: 'BÖN UNDER MENSTRUATION',
    title: 'Salat/bön under\nmenstruation',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor den rituelle salat/bön ar suspenderet i denne tid, och hvordan du kan opleve denne periode med ro.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Den suspenderede salat/bön under menstruation',
      'Ingen indhentning av missede bönner, i modsätning till faste',
      'Andre former for gudsdyrkelse forbliver mulige',
      'Vigtige pointer',
    ],
    section1Body1: 'Under haidh (menstruation) ar forpligtelsen till salat/bön suspenderet: en kvinna ar inte forpligtet till at bede i denne periode. Denne suspension ar en integreret del av den religiöse praksis selv, der länge ar anerkendt av traditionen.',
    section1Body2: 'Denne suspension betyder på ingen måde en distancering fran tro eller et brud i religiös praksis. Det ar en anerkendt fritagelse, som bör opleves uden skyld: det ar en del av den naturlige ramme for en kvindes åndelige liv.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Denne tid kan tilgås med ro: den sätter hverken ens tros värdi eller regelmässighed i ens religiöse praksis i tvivl.',
    section1Body3: 'Hvis menstruationen begynder, mens salat/bön ar i gang, afbrydes den: den behöver inte afsluttes eller indhentes. Omvendt, når menstruationen slutter, genoptages bönnen normalt efter ghuslen (den store ablution), som markerer tilbagekomsten till tilstanden av rituel renhed.',
    section2Body1: 'I modsätning till Ramadan-fasten, hvis missede dagar under menstruation indhentes senere (qadaa-faste), indhentes bönner, der ar misset av samme årsag, generelt inte bagefter. Denne forskel forklares av selve karakteren av disse to gudsdyrkelseshandlinger: salat/bön ar en daglig handling, der gentages flere gange om dagen, mens faste ar årlig och koncentreret om en bestemt måned.',
    section2Body2: 'Denne sondring kan väre overraskende, når man förste gang opdager fiqh. Det betyder inte, at salat/bön täller for mindre: at fölge fritagelsen som foreskrevet ar i sig selv fuldt ud en del av religiös praksis.',
    section3Body: 'At undlade at bede under menstruation betyder inte at väre afskåret fran sin spiritualitet. Mange former for gudsdyrkelse och religiöst engagement forbliver tilgängelige i denne tid.',
    worshipActs: [
      'Dhikr (ihukommelse av Gud)',
      'Du\'a (bönsmålinger)',
      'Velgörenhed',
      'At hjälpe andre',
      'Religiös läring',
      'At lytte till religiöst indhold',
      'Refleksion och taknemmelighed',
      'Venlige handlinger',
    ],
    noteTitle: 'Bemärk venligst',
    noteText: 'Visse praksisser, såsom at recitere eller direkte håndtere Koranen, kan väre genstand for divergerende meninger afhängigt av retsskolen. At henvise till den mening, du sädvanligvis fölger, eller at söge råd fran en kvalificeret lärd, hjälper med at afklare disse tilfälde.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Den suspenderede salat/bön under menstruation ar en anerkendt fritagelse, der bör opleves uden skyld. Mange former for spiritualitet forbliver tilgängelige i denne tid, och rådet fran en kvalificeret lärd forbliver referencen for ethvert specifikt spörgsmål.',
    shareMessage: 'Salat/bön under menstruation — AWA',
  },
  sv: {
    badge: 'BÖN UNDER MENSTRUATION',
    title: 'Salat/bön under\nmenstruation',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor den rituelle salat/bön ar suspenderet i denne tid, och hvordan du kan opleve denne periode med ro.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Den suspenderede salat/bön under menstruation',
      'Ingen indhentning av missede bönner, i modsätning till faste',
      'Andre former for gudsdyrkelse forbliver mulige',
      'Vigtige pointer',
    ],
    section1Body1: 'Under haidh (menstruation) ar forpligtelsen till salat/bön suspenderet: en kvinna ar inte forpligtet till at bede i denne periode. Denne suspension ar en integreret del av den religiöse praksis selv, der länge ar anerkendt av traditionen.',
    section1Body2: 'Denne suspension betyder på ingen måde en distancering fran tro eller et brud i religiös praksis. Det ar en anerkendt fritagelse, som bör opleves uden skyld: det ar en del av den naturlige ramme for en kvindes åndelige liv.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Denne tid kan tilgås med ro: den sätter hverken ens tros värdi eller regelmässighed i ens religiöse praksis i tvivl.',
    section1Body3: 'Hvis menstruationen begynder, mens salat/bön ar i gang, afbrydes den: den behöver inte afsluttes eller indhentes. Omvendt, når menstruationen slutter, genoptages bönnen normalt efter ghuslen (den store ablution), som markerer tilbagekomsten till tilstanden av rituel renhed.',
    section2Body1: 'I modsätning till Ramadan-fasten, hvis missede dagar under menstruation indhentes senere (qadaa-faste), indhentes bönner, der ar misset av samme årsag, generelt inte bagefter. Denne forskel forklares av selve karakteren av disse to gudsdyrkelseshandlinger: salat/bön ar en daglig handling, der gentages flere gange om dagen, mens faste ar årlig och koncentreret om en bestemt måned.',
    section2Body2: 'Denne sondring kan väre overraskende, når man förste gang opdager fiqh. Det betyder inte, at salat/bön täller for mindre: at fölge fritagelsen som foreskrevet ar i sig selv fuldt ud en del av religiös praksis.',
    section3Body: 'At undlade at bede under menstruation betyder inte at väre afskåret fran sin spiritualitet. Mange former for gudsdyrkelse och religiöst engagement forbliver tilgängelige i denne tid.',
    worshipActs: [
      'Dhikr (ihukommelse av Gud)',
      'Du\'a (bönsmålinger)',
      'Velgörenhed',
      'At hjälpe andre',
      'Religiös läring',
      'At lytte till religiöst indhold',
      'Refleksion och taknemmelighed',
      'Venlige handlinger',
    ],
    noteTitle: 'Bemärk venligst',
    noteText: 'Visse praksisser, såsom at recitere eller direkte håndtere Koranen, kan väre genstand for divergerende meninger afhängigt av retsskolen. At henvise till den mening, du sädvanligvis fölger, eller at söge råd fran en kvalificeret lärd, hjälper med at afklare disse tilfälde.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Den suspenderede salat/bön under menstruation ar en anerkendt fritagelse, der bör opleves uden skyld. Mange former for spiritualitet forbliver tilgängelige i denne tid, och rådet fran en kvalificeret lärd forbliver referencen for ethvert specifikt spörgsmål.',
    shareMessage: 'Salat/bön under menstruation — AWA',
  },
} as const);

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