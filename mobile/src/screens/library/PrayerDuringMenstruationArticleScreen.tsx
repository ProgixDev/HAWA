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
  nb: {
    badge: 'BØNN UNDER MENSTRUASJON',
    title: 'Bønn under\nmenstruasjon',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor den rituelle bønnen er suspendert i denne tiden, og hvordan du kan leve denne perioden med ro i sinnet.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Bønnen som er suspendert under menstruasjon',
      'Ingen innhenting av bønner som er gått glipp av, i motsetning til faste',
      'Andre former for gudstjeneste er fortsatt mulige',
      'Det viktigste å huske',
    ],
    section1Body1: 'Under menstruasjon er plikten til bønn (salat) suspendert: en kvinne er ikke pålagt å be i denne perioden. Denne suspensjonen er en integrert del av selve religionsutøvelsen, anerkjent av tradisjonen i lang tid.',
    section1Body2: 'Denne suspensjonen betyr på ingen måte en avstand fra troen eller et brudd i religionsutøvelsen. Det er et anerkjent fritak, som skal oppleves uten skyldfølelse: det er en del av det naturlige rammeverket for en kvinnes åndelige liv.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Denne tiden kan møtes med ro: den stiller verken verdien av troen eller regelmessigheten i religionsutøvelsen i tvil.',
    section1Body3: 'Hvis menstruasjonen begynner mens bønnen pågår, avbrytes den: den trenger ikke å fullføres eller tas igjen. Omvendt, når menstruasjonen er over, gjenopptas bønnen normalt etter ghusl (den store avvaskingen), som markerer tilbakekomsten til rituell renhet.',
    section2Body1: 'I motsetning til ramadanfasten, hvor dagene man gikk glipp av under menstruasjon tas igjen senere (qada), tas bønner man gikk glipp av av samme grunn vanligvis ikke igjen etterpå. Denne forskjellen forklares av selve karakteren til disse to gudstjenestehandlingene: bønn er en daglig handling som gjentas flere ganger om dagen, mens faste er årlig og konsentrert om en bestemt måned.',
    section2Body2: 'Dette skillet kan være overraskende når man først oppdager fiqh. Det betyr ikke at bønnen teller for mindre: å følge fritaket slik det er foreskrevet, er i seg selv en fullverdig del av religionsutøvelsen.',
    section3Body: 'Å ikke be under menstruasjon betyr ikke å være avskåret fra sin spiritualitet. Mange former for gudstjeneste og religiøst engasjement er fortsatt tilgjengelige i denne tiden.',
    worshipActs: [
      'Dhikr (påkallelse av Gud)',
      'Du‘a (bønner)',
      'Veldedighet',
      'Å hjelpe andre',
      'Religiøs læring',
      'Å lytte til religiøst innhold',
      'Refleksjon og takknemlighet',
      'Vennlige handlinger',
    ],
    noteTitle: 'Merk',
    noteText: 'Noen praksiser, som å resitere eller direkte berøre Koranen, kan være gjenstand for ulike meninger avhengig av rettsskolen. Å holde seg til uttalelsen du vanligvis følger, eller å søke råd hos en kvalifisert lærd, bidrar til å avklare disse tilfellene.',
    tip2Title: 'Godt å vite',
    tip2Text: 'Bønnen som er suspendert under menstruasjon, er et anerkjent fritak, som skal oppleves uten skyldfølelse. Mange former for spiritualitet er fortsatt tilgjengelige i denne tiden, og rådet fra en kvalifisert lærd er fortsatt referansen for ethvert spesifikt spørsmål.',
    shareMessage: 'Bønn under menstruasjon – AWA',
  },
  pl: {
    badge: 'MODLITWA PODCZAS MENSTRUACJI',
    title: 'Modlitwa podczas\nmenstruacji',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego modlitwa rytualna jest w tym czasie zawieszona i jak przeżywać ten okres ze spokojem.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zawieszona modlitwa podczas menstruacji',
      'Brak odrabiania opuszczonych modlitw, w przeciwieństwie do postu',
      'Inne formy kultu pozostają możliwe',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'Podczas menstruacji obowiązek modlitwy (salat) jest zawieszony: kobieta nie musi się modlić w tym okresie. To zawieszenie jest integralną częścią samej praktyki religijnej, od dawna uznawaną przez tradycję.',
    section1Body2: 'To zawieszenie w żaden sposób nie oznacza oddalenia się od wiary ani zaniedbania praktyki religijnej. Jest to uznane zwolnienie, które należy przeżywać bez poczucia winy: stanowi część naturalnych ram życia duchowego kobiety.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Ten czas można przeżywać ze spokojem: nie podważa on ani wartości wiary, ani regularności praktyki religijnej.',
    section1Body3: 'Jeśli menstruacja rozpocznie się w trakcie modlitwy, zostaje ona przerwana: nie trzeba jej dokańczać ani odrabiać. I odwrotnie, gdy menstruacja się kończy, modlitwa jest wznawiana normalnie po gusl (wielkim obmyciu), które oznacza powrót do stanu rytualnej czystości.',
    section2Body1: 'W przeciwieństwie do postu ramadanowego, którego dni opuszczone podczas menstruacji odrabia się później (kada), modlitw opuszczonych z tego samego powodu zasadniczo się potem nie odrabia. Ta różnica wynika z samej natury tych dwóch aktów kultu: modlitwa jest codziennym aktem powtarzanym kilka razy dziennie, a post jest roczny i skupiony na jednym miesiącu.',
    section2Body2: 'To rozróżnienie może zaskakiwać przy pierwszym poznawaniu fikh. Nie oznacza, że modlitwa liczy się mniej: przestrzeganie zwolnienia tak, jak zostało ono przepisane, samo w sobie w pełni stanowi część praktyki religijnej.',
    section3Body: 'Niemodlenie się podczas menstruacji nie oznacza odcięcia od własnej duchowości. Wiele form kultu i zaangażowania religijnego pozostaje w tym czasie dostępnych.',
    worshipActs: [
      'Dhikr (wspominanie Boga)',
      'Dua (prośby i modlitwy błagalne)',
      'Jałmużna',
      'Pomaganie innym',
      'Nauka religijna',
      'Słuchanie treści religijnych',
      'Refleksja i wdzięczność',
      'Akty życzliwości',
    ],
    noteTitle: 'Zwróć uwagę',
    noteText: 'Niektóre praktyki, takie jak recytowanie Koranu lub bezpośrednie dotykanie go, mogą podlegać różnym opiniom w zależności od szkoły prawa. Odwołanie się do opinii, której zwykle przestrzegasz, lub zasięgnięcie porady wykwalifikowanego uczonego pomaga wyjaśnić te przypadki.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Zawieszona modlitwa podczas menstruacji jest uznanym zwolnieniem, które należy przeżywać bez poczucia winy. Wiele form duchowości pozostaje w tym czasie dostępnych, a porada wykwalifikowanego uczonego pozostaje punktem odniesienia w każdej szczegółowej kwestii.',
    shareMessage: 'Modlitwa podczas menstruacji — AWA',
  },
  uk: {
    badge: 'МОЛИТВА ПІД ЧАС МЕНСТРУАЦІЇ',
    title: 'Молитва під час\nменструації',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому ритуальна молитва в цей час призупинена та як зі спокоєм прожити цей період.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Призупинена молитва під час менструації',
      'Без відпрацювання пропущених молитов, на відміну від посту',
      'Інші форми богослужіння залишаються можливими',
      'Головні висновки',
    ],
    section1Body1: 'Під час менструації обов’язок молитви (салят) призупиняється: жінка не зобов’язана молитися в цей період. Це призупинення є невід’ємною частиною самої релігійної практики, здавна визнаною традицією.',
    section1Body2: 'Це призупинення жодним чином не означає віддалення від віри чи порушення релігійної практики. Це визнане звільнення, яке слід переживати без почуття провини: воно є частиною природних рамок духовного життя жінки.',
    tip1Title: 'Варто знати',
    tip1Text: 'До цього періоду можна ставитися зі спокоєм: він не ставить під сумнів ні цінність віри, ні регулярність релігійної практики.',
    section1Body3: 'Якщо менструація починається під час молитви, її перериває: її не потрібно завершувати чи відпрацьовувати. І навпаки, коли менструація закінчується, молитва нормально відновлюється після гуслю (великого обмивання), що знаменує повернення до стану ритуальної чистоти.',
    section2Body1: 'На відміну від посту Рамадану, дні якого, пропущені під час менструації, відпрацьовують пізніше (када), молитви, пропущені з тієї самої причини, зазвичай потім не відпрацьовують. Ця різниця пояснюється самою природою цих двох актів богослужіння: молитва — щоденний акт, що повторюється кілька разів на день, а піст — щорічний і зосереджений на одному місяці.',
    section2Body2: 'Це розрізнення може здивувати при першому знайомстві з фікхом. Воно не означає, що молитва важить менше: дотримання звільнення так, як воно приписане, саме по собі є повноцінною частиною релігійної практики.',
    section3Body: 'Не молитися під час менструації не означає бути відрізаною від своєї духовності. Багато форм богослужіння та релігійної залученості залишаються доступними в цей час.',
    worshipActs: [
      'Зікр (згадування Бога)',
      'Дуа (прохання та благання)',
      'Милостиня',
      'Допомога іншим',
      'Релігійне навчання',
      'Слухання релігійного вмісту',
      'Роздуми та вдячність',
      'Добрі вчинки',
    ],
    noteTitle: 'Зверніть увагу',
    noteText: 'Деякі практики, як-от читання вголос чи безпосереднє торкання Корану, можуть бути предметом різних думок залежно від школи правознавства. Звернення до думки, якої ви зазвичай дотримуєтеся, або порада кваліфікованого вченого допомагає прояснити ці випадки.',
    tip2Title: 'Варто знати',
    tip2Text: 'Призупинена молитва під час менструації — визнане звільнення, яке слід переживати без почуття провини. Багато форм духовності залишаються доступними в цей час, а порада кваліфікованого вченого залишається орієнтиром у будь-якому конкретному питанні.',
    shareMessage: 'Молитва під час менструації — AWA',
  },
  cs: {
    badge: 'MODLITBA BĚHEM MENSTRUACE',
    title: 'Modlitba během\nmenstruace',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč je v tomto období rituální modlitba pozastavena a jak toto období prožít v klidu.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pozastavená modlitba během menstruace',
      'Vynechané modlitby se nenahrazují, na rozdíl od půstu',
      'Jiné formy bohoslužby zůstávají možné',
      'Hlavní poznatky',
    ],
    section1Body1: 'Během menstruace je povinnost modlitby (salát) pozastavena: žena se v tomto období modlit nemusí. Toto pozastavení je nedílnou součástí samotné náboženské praxe a tradice je již dlouho uznává.',
    section1Body2: 'Toto pozastavení v žádném případě neznamená odklon od víry ani opuštění náboženské praxe. Jde o uznané osvobození, které se má prožívat bez pocitu viny: je součástí přirozeného rámce ženského duchovního života.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'K tomuto období lze přistupovat s klidem: nezpochybňuje ani hodnotu víry, ani pravidelnost náboženské praxe.',
    section1Body3: 'Pokud menstruace začne během modlitby, modlitba se přeruší: není třeba ji dokončit ani nahrazovat. Naopak, když menstruace skončí, modlitba se po ghuslu (velké očistě), který označuje návrat ke stavu rituální čistoty, normálně obnoví.',
    section2Body1: 'Na rozdíl od půstu v ramadánu, jehož dny vynechané během menstruace se později nahrazují (kada), se modlitby vynechané ze stejného důvodu obecně dodatečně nenahrazují. Tento rozdíl vysvětluje samotná povaha obou bohoslužeb: modlitba je každodenní úkon opakovaný několikrát denně, zatímco půst je roční a soustředěný do určitého měsíce.',
    section2Body2: 'Tento rozdíl může být při prvním seznámení s fiqhem překvapivý. Neznamená to, že modlitba má menší hodnotu: dodržovat osvobození tak, jak je předepsáno, je samo o sobě plnohodnotnou součástí náboženské praxe.',
    section3Body: 'Nemodlit se během menstruace neznamená být odříznuta od své spirituality. V tomto období zůstává dostupných mnoho forem bohoslužby a náboženského zapojení.',
    worshipActs: [
      'Dhikr (vzpomínání na Boha)',
      'Prosby (du‘á)',
      'Almužna',
      'Pomoc druhým',
      'Náboženské vzdělávání',
      'Poslech náboženského obsahu',
      'Zamyšlení a vděčnost',
      'Laskavé skutky',
    ],
    noteTitle: 'Upozornění',
    noteText: 'Na některé praktiky, například recitaci nebo přímé držení Koránu, se mohou podle právní školy vyskytovat odlišné názory. Obrátit se na názor, který obvykle sledujete, nebo požádat o radu kvalifikovaného učence pomáhá tyto případy objasnit.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Pozastavená modlitba během menstruace je uznané osvobození, které se má prožívat bez pocitu viny. V tomto období zůstává dostupných mnoho forem spirituality a pro jakoukoli konkrétní otázku zůstává referencí rada kvalifikovaného učence.',
    shareMessage: 'Modlitba během menstruace — AWA',
  },
  sk: {
    badge: 'MODLITBA POČAS MENŠTRUÁCIE',
    title: 'Modlitba počas\nmenštruácie',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prečo je v tomto období rituálna modlitba pozastavená a ako toto obdobie prežívať s pokojom.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pozastavená modlitba počas menštruácie',
      'Vynechané modlitby sa nenahrádzajú, na rozdiel od pôstu',
      'Iné formy bohoslužby zostávajú možné',
      'Hlavné body',
    ],
    section1Body1: 'Počas menštruácie je povinnosť modlitby (saláh) pozastavená: žena sa v tomto období nemusí modliť. Toto pozastavenie je neoddeliteľnou súčasťou samotnej náboženskej praxe, od dávna uznávanou tradíciou.',
    section1Body2: 'Toto pozastavenie v žiadnom prípade neznamená odklon od viery ani zlyhanie náboženskej praxe. Je to uznané oslobodenie, ktoré treba prežívať bez viny: je súčasťou prirodzeného rámca duchovného života ženy.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'K tomuto obdobiu možno pristupovať s pokojom: nespochybňuje ani hodnotu viery, ani pravidelnosť náboženskej praxe.',
    section1Body3: 'Ak menštruácia začne počas modlitby, modlitba sa preruší: nemusí sa dokončiť ani nahrádzať. Naopak, keď menštruácia skončí, modlitba sa po ghusle (veľkom obmytí), ktorý označuje návrat do stavu rituálnej čistoty, normálne obnoví.',
    section2Body1: 'Na rozdiel od ramadánového pôstu, ktorého vynechané dni počas menštruácie sa neskôr nahrádzajú (kada), modlitby vynechané z rovnakého dôvodu sa vo všeobecnosti následne nenahrádzajú. Tento rozdiel vysvetľuje samotná povaha týchto dvoch úkonov bohoslužby: modlitba je každodenný úkon opakovaný niekoľkokrát denne, zatiaľ čo pôst je ročný a sústredený na konkrétny mesiac.',
    section2Body2: 'Tento rozdiel môže byť pri prvom objavovaní fiqhu prekvapujúci. Neznamená, že modlitba má menšiu hodnotu: dodržiavať oslobodenie tak, ako je predpísané, je samo osebe plnohodnotnou súčasťou náboženskej praxe.',
    section3Body: 'Nemodliť sa počas menštruácie neznamená byť odrezaná od svojej duchovnosti. Mnohé formy bohoslužby a náboženského zapojenia zostávajú v tomto období prístupné.',
    worshipActs: [
      'Dhikr (pripomínanie si Boha)',
      'Du‘á (prosby)',
      'Almužna',
      'Pomoc druhým',
      'Náboženské vzdelávanie',
      'Počúvanie náboženského obsahu',
      'Zamyslenie a vďačnosť',
      'Skutky láskavosti',
    ],
    noteTitle: 'Upozornenie',
    noteText: 'Niektoré praktiky, ako recitovanie Koránu alebo priamy dotyk s ním, môžu podliehať rozdielnym názorom podľa právnej školy. Vychádzanie z názoru, ktorý zvyčajne nasledujete, alebo rada kvalifikovaného učenca pomáha tieto prípady objasniť.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Pozastavená modlitba počas menštruácie je uznané oslobodenie, ktoré treba prežívať bez viny. Mnohé formy duchovnosti zostávajú v tomto období prístupné a rada kvalifikovaného učenca zostáva referenciou pre každú konkrétnu otázku.',
    shareMessage: 'Modlitba počas menštruácie — AWA',
  },
  hu: {
    badge: 'IMA A MENSTRUÁCIÓ ALATT',
    title: 'Ima a\nmenstruáció alatt',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért van felfüggesztve a rituális ima ebben az időszakban, és hogyan élheted meg nyugodtan ezt az időt.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A menstruáció alatt felfüggesztett ima',
      'A kihagyott imákat nem pótolják, a böjttel ellentétben',
      'Az istentisztelet más formái lehetségesek maradnak',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A menstruáció alatt az ima (szalát) kötelezettsége fel van függesztve: a nőnek ebben az időszakban nem kell imádkoznia. Ez a felfüggesztés a vallási gyakorlat szerves része, amelyet a hagyomány régóta elismer.',
    section1Body2: 'Ez a felfüggesztés semmiképpen nem jelent eltávolodást a hittől vagy a vallási gyakorlat hanyatlását. Elismert felmentés, amelyet bűntudat nélkül kell megélni: a nő spirituális életének természetes keretéhez tartozik.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ehhez az időszakhoz nyugodtan lehet közelíteni: sem a hit értékét, sem a vallási gyakorlat rendszerességét nem kérdőjelezi meg.',
    section1Body3: 'Ha a menstruáció ima közben kezdődik, az ima megszakad: nem kell befejezni vagy bepótolni. Ezzel szemben, amikor a menstruáció véget ér, az ima a ghusl (nagy mosakodás) után normálisan folytatódik, amely a rituális tisztasági állapotba való visszatérést jelzi.',
    section2Body1: 'A ramadáni böjttől eltérően, amelynek a menstruáció miatt kihagyott napjait később pótolják (kada), az ugyanezen okból kihagyott imákat általában nem pótolják utólag. Ez a különbség e két istentiszteleti cselekmény természetéből adódik: az ima napi, naponta többször ismétlődő cselekmény, míg a böjt éves, és egy meghatározott hónapra összpontosul.',
    section2Body2: 'Ez a megkülönböztetés meglepő lehet a fiqh első megismerésekor. Nem azt jelenti, hogy az imának kisebb az értéke: a felmentés előírt módon való követése önmagában is teljes értékű része a vallási gyakorlatnak.',
    section3Body: 'A menstruáció alatti imádkozás hiánya nem jelenti, hogy el lennél vágva a spiritualitásodtól. Az istentisztelet és a vallási elkötelezettség számos formája elérhető marad ebben az időszakban.',
    worshipActs: [
      'Dhikr (Isten emlegetése)',
      'Du‘á (könyörgések)',
      'Adakozás',
      'Mások segítése',
      'Vallási tanulás',
      'Vallási tartalmak hallgatása',
      'Elmélkedés és hála',
      'Jócselekedetek',
    ],
    noteTitle: 'Figyelem',
    noteText: 'Egyes gyakorlatok, például a Korán recitálása vagy közvetlen megérintése, a jogi iskolától függően eltérő véleményeknek lehetnek kitéve. A szokásosan követett véleményre való hivatkozás, vagy kvalifikált tudós tanácsának kérése segít tisztázni ezeket az eseteket.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A menstruáció alatt felfüggesztett ima elismert felmentés, amelyet bűntudat nélkül kell megélni. A spiritualitás számos formája elérhető marad ebben az időszakban, és bármely konkrét kérdésben a kvalifikált tudós tanácsa marad az irányadó.',
    shareMessage: 'Ima a menstruáció alatt — AWA',
  },
  ro: {
    badge: 'RUGĂCIUNEA ÎN TIMPUL MENSTRUAȚIEI',
    title: 'Rugăciunea în timpul\nmenstruației',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce rugăciunea rituală este suspendată în această perioadă și cum să trăiești acest timp cu seninătate.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Rugăciunea suspendată în timpul menstruației',
      'Fără recuperarea rugăciunilor ratate, spre deosebire de post',
      'Alte forme de cult rămân posibile',
      'Ce să reții',
    ],
    section1Body1: 'În timpul menstruației, obligația rugăciunii (salat) este suspendată: femeia nu este obligată să se roage în această perioadă. Această suspendare face parte integrantă din practica religioasă însăși, recunoscută de multă vreme de tradiție.',
    section1Body2: 'Această suspendare nu înseamnă în niciun fel o îndepărtare de credință sau o abatere de la practica religioasă. Este o scutire recunoscută, de trăit fără vinovăție: face parte din cadrul natural al vieții spirituale a femeii.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Această perioadă poate fi abordată cu seninătate: ea nu pune sub semnul întrebării nici valoarea credinței cuiva, nici regularitatea practicii sale religioase.',
    section1Body3: 'Dacă menstruația începe în timp ce rugăciunea este în curs, aceasta se întrerupe: nu trebuie nici terminată, nici recuperată. Invers, când menstruația se încheie, rugăciunea se reia normal după ghusl (abluțiunea majoră), care marchează revenirea la starea de puritate rituală.',
    section2Body1: 'Spre deosebire de postul din Ramadan, ale cărui zile ratate în timpul menstruației sunt recuperate mai târziu (qadaa), rugăciunile ratate din același motiv nu se recuperează în general ulterior. Această diferență se explică prin natura însăși a acestor două acte de cult: rugăciunea este un act zilnic, repetat de mai multe ori pe zi, în timp ce postul este anual și concentrat pe o lună precisă.',
    section2Body2: 'Această distincție poate surprinde la prima descoperire a fiqh-ului. Ea nu înseamnă că rugăciunea contează mai puțin: respectarea scutirii așa cum este prescrisă face, în sine, pe deplin parte din practica religioasă.',
    section3Body: 'A nu te ruga în timpul menstruației nu înseamnă a fi desprinsă de spiritualitatea ta. Multe forme de cult și de angajament religios rămân accesibile în această perioadă.',
    worshipActs: [
      'Dhikr (pomenirea lui Dumnezeu)',
      'Du’a (rugăciuni de cerere)',
      'Caritatea',
      'Ajutorarea altora',
      'Învățarea religioasă',
      'Ascultarea de conținut religios',
      'Reflecția și recunoștința',
      'Gesturile de bunătate',
    ],
    noteTitle: 'Atenție',
    noteText: 'Unele practici, precum recitarea sau atingerea directă a Coranului, pot face obiectul unor păreri diferite în funcție de școala de jurisprudență. Raportarea la părerea pe care o urmezi de obicei sau cererea sfatului unui savant calificat ajută la clarificarea acestor cazuri.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Rugăciunea suspendată în timpul menstruației este o scutire recunoscută, de trăit fără vinovăție. Multe forme de spiritualitate rămân accesibile în această perioadă, iar sfatul unui savant calificat rămâne referința pentru orice întrebare specifică.',
    shareMessage: 'Rugăciunea în timpul menstruației — AWA',
  },
  bg: {
    badge: 'МОЛИТВА ПО ВРЕМЕ НА МЕНСТРУАЦИЯ',
    title: 'Молитва по време на\nменструация',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо ритуалната молитва е преустановена през този период и как да преживееш това време със спокойствие.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Преустановената молитва по време на менструация',
      'Без наваксване на пропуснатите молитви, за разлика от поста',
      'Другите форми на богослужение остават възможни',
      'Какво да запомниш',
    ],
    section1Body1: 'По време на менструация задължението за молитва (салат) е преустановено: жената не е длъжна да се моли през този период. Това преустановяване е неразделна част от самата религиозна практика, отдавна призната от традицията.',
    section1Body2: 'Това преустановяване в никакъв случай не означава отдалечаване от вярата или прекъсване на религиозната практика. То е призната освободеност, която се преживява без чувство за вина: част е от естествената рамка на духовния живот на жената.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Това време може да бъде преживяно със спокойствие: то не поставя под въпрос нито стойността на вярата, нито редовността на религиозната практика.',
    section1Body3: 'Ако менструацията започне по време на молитва, тя се прекъсва: не е нужно да бъде довършена или наваксана. Обратно, когато менструацията свърши, молитвата се възобновява нормално след гусла (голямото абдест), който бележи връщането към състоянието на ритуална чистота.',
    section2Body1: 'За разлика от поста през Рамадан, чиито пропуснати по време на менструация дни се наваксват по-късно (кадаа), молитвите, пропуснати по същата причина, обикновено не се наваксват след това. Тази разлика се обяснява с самото естество на тези два акта на богослужение: молитвата е ежедневен акт, повтарящ се няколко пъти на ден, докато постът е годишен и съсредоточен в определен месец.',
    section2Body2: 'Това разграничение може да изненада при първото запознаване с фикха. То не означава, че молитвата струва по-малко: да следваш освобождаването така, както е предписано, само по себе си напълно е част от религиозната практика.',
    section3Body: 'Да не се молиш по време на менструация не означава да бъдеш отрязана от духовността си. Много форми на богослужение и религиозна ангажираност остават достъпни през това време.',
    worshipActs: [
      'Зикр (споменаване на Бога)',
      'Дуа (молби)',
      'Милостиня',
      'Помощ на другите',
      'Религиозно учене',
      'Слушане на религиозно съдържание',
      'Размишление и благодарност',
      'Добри дела',
    ],
    noteTitle: 'Обърни внимание',
    noteText: 'Някои практики, като рецитирането или директното докосване на Корана, могат да бъдат предмет на различни мнения според школата на правото. Позоваването на мнението, което обикновено следваш, или съветът от квалифициран учен помага да се изяснят тези случаи.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Преустановената молитва по време на менструация е призната освободеност, която се преживява без чувство за вина. Много форми на духовност остават достъпни през това време, а съветът на квалифициран учен остава референцията за всеки конкретен въпрос.',
    shareMessage: 'Молитва по време на менструация — AWA',
  },
  sr: {
    badge: 'МОЛИТВА ТОКОМ МЕНСТРУАЦИЈЕ',
    title: 'Молитва током\nменструације',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто је ритуална молитва у овом периоду преустављена и како да проживиш ово време мирно.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Преустављена молитва током менструације',
      'Без надокнаде пропуштених молитви, за разлику од поста',
      'Остали облици богослужења остају могући',
      'Шта да запамтиш',
    ],
    section1Body1: 'Током менструације обавеза молитве (салата) је преустављена: жена није дужна да се моли у овом периоду. Ово преустављање је саставни део саме верске праксе, одавно признате од традиције.',
    section1Body2: 'Ово преустављање ни у ком случају не значи удаљавање од вере или прекид верске праксе. То је призната изузетност која се проживљава без осећаја кривице: део је природног оквира духовног живота жене.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ово време се може проживети са спокојем: оно не доводи у питање ни вредност вере ни редовност верске праксе.',
    section1Body3: 'Ако менструација почне док је молитва у току, она се прекида: не мора се довршити нити надокнадити. Обрнуто, када менструација заврши, молитва се нормално наставља после гусла (великог абдеста), који означава повратак у стање ритуалне чистоте.',
    section2Body1: 'За разлику од поста у Рамазану, чији се пропуштени дани током менструације касније надокнађују (кадаа), молитве пропуштене из истог разлога обично се после не надокнађују. Ова разлика се објашњава самом природом ова два дела богослужења: молитва је дневни акт који се понавља неколико пута дневно, док је пост годишњи и усредсређен на одређени месец.',
    section2Body2: 'Ова разлика може изненадити при првом упознавању са фикхом. Она не значи да молитва вреди мање: следити ослобађање онако како је прописано само по себи је потпуно део верске праксе.',
    section3Body: 'Не молити се током менструације не значи бити одсечена од своје духовности. Многи облици богослужења и верске ангажованости остају доступни током овог времена.',
    worshipActs: [
      'Зикр (спомињање Бога)',
      'Дуа (молбе)',
      'Милостиња',
      'Помоћ другима',
      'Верско учење',
      'Слушање верског садржаја',
      'Размишљање и захвалност',
      'Добра дела',
    ],
    noteTitle: 'Обрати пажњу',
    noteText: 'Неке праксе, као што је рецитовање или директно додиривање Корана, могу бити предмет различитих мишљења зависно од правне школе. Позивање на мишљење које уобичајено пратиш или тражење савета од квалификованог учењака помаже да се ови случајеви разјасне.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Молитва преустављена током менструације је призната изузетност која се проживљава без осећаја кривице. Многи облици духовности остају доступни током овог времена, а савет квалификованог учењака остаје референца за свако конкретно питање.',
    shareMessage: 'Молитва током менструације — AWA',
  },
  hr: {
    badge: 'MOLITVA TIJEKOM MENSTRUACIJE',
    title: 'Molitva tijekom\nmenstruacije',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto je ritualna molitva u ovom razdoblju suspendirana i kako ga proživjeti mirno.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Suspendirana molitva tijekom menstruacije',
      'Propuštene molitve se ne nadoknađuju, za razliku od posta',
      'Drugi oblici bogoslužja ostaju mogući',
      'Ključne poruke',
    ],
    section1Body1: 'Tijekom menstruacije obveza molitve (salata) je suspendirana: žena nije dužna moliti u tom razdoblju. Ta je suspenzija sastavni dio same vjerske prakse, dugo priznat u tradiciji.',
    section1Body2: 'Ta suspenzija nipošto ne znači udaljavanje od vjere niti propust u vjerskoj praksi. To je priznato oslobođenje koje treba proživjeti bez krivnje: dio je prirodnog okvira ženskog duhovnog života.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ovom se razdoblju može pristupiti mirno: ono ne dovodi u pitanje ni vrijednost vjere ni redovitost vjerske prakse.',
    section1Body3: 'Ako menstruacija započne dok je molitva u tijeku, ona se prekida: ne treba je dovršiti niti nadoknaditi. Obrnuto, kad menstruacija završi, molitva se normalno nastavlja nakon gusla (velikog pranja), koji označava povratak u stanje ritualne čistoće.',
    section2Body1: 'Za razliku od posta u Ramazanu, čiji se dani propušteni tijekom menstruacije naknadno nadoknađuju (kada), molitve propuštene iz istog razloga općenito se ne nadoknađuju. Ta se razlika objašnjava samom prirodom ta dva bogoslužna čina: molitva je svakodnevni čin koji se ponavlja nekoliko puta dnevno, dok je post godišnji i usredotočen na određeni mjesec.',
    section2Body2: 'Ta razlika može iznenaditi pri prvom upoznavanju s fikhom. Ne znači da molitva vrijedi manje: slijediti oslobođenje onako kako je propisano i samo po sebi je puni dio vjerske prakse.',
    section3Body: 'Ne moliti tijekom menstruacije ne znači biti odsječena od svoje duhovnosti. Mnogi oblici bogoslužja i vjerskog angažmana ostaju dostupni u tom razdoblju.',
    worshipActs: [
      'Zikr (spominjanje Boga)',
      'Dove (molitve molbe)',
      'Dobročinstvo',
      'Pomaganje drugima',
      'Vjersko učenje',
      'Slušanje vjerskog sadržaja',
      'Promišljanje i zahvalnost',
      'Djela dobrote',
    ],
    noteTitle: 'Napomena',
    noteText: 'O nekim praksama, poput recitiranja ili izravnog dodirivanja Kur’ana, mogu postojati različita mišljenja ovisno o pravnoj školi. Oslanjanje na mišljenje koje obično slijediš ili traženje savjeta kvalificiranog učenjaka pomaže razjasniti te slučajeve.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Suspendirana molitva tijekom menstruacije priznato je oslobođenje koje treba proživjeti bez krivnje. Mnogi oblici duhovnosti ostaju dostupni u tom razdoblju, a savjet kvalificiranog učenjaka ostaje mjerodavan za svako konkretno pitanje.',
    shareMessage: 'Molitva tijekom menstruacije — AWA',
  },
  bs: {
    badge: 'MOLITVA TIJEKOM MENSTRUACIJE',
    title: 'Molitva tokom\nmenstruacije',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta je ritualna molitva u ovom razdoblju suspendirana i kako ga proživjeti mirno.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Suspendirana molitva tokom menstruacije',
      'Propuštene molitve se ne nadoknađuju, za razliku od posta',
      'Drugi oblici bogoslužja ostaju mogući',
      'Ključne poruke',
    ],
    section1Body1: 'Tokom menstruacije obveza molitve (salata) je suspendirana: žena nije dužna moliti u tom razdoblju. Ta je suspenzija sastavni dio same vjerske prakse, dugo priznat u tradiciji.',
    section1Body2: 'Ta suspenzija nipošta ne znači udaljavanje od vjere niti propust u vjerskoj praksi. To je priznato oslobođenje koje treba proživjeti bez krivnje: dio je prirodnog okvira ženskog duhovnog života.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ovom se razdoblju može pristupiti mirno: ono ne dovodi u pitanje ni vrijednost vjere ni redovitost vjerske prakse.',
    section1Body3: 'Ako menstruacija započne dok je molitva u toku, ona se prekida: ne treba je dovršiti niti nadoknaditi. Obrnuto, kad menstruacija završi, molitva se normalno nastavlja nakon gusla (velikog pranja), koji označava povratak u stanje ritualne čistoće.',
    section2Body1: 'Za razliku od posta u Ramazanu, čiji se dani propušteni tokom menstruacije naknadno nadoknađuju (kaza), molitve propuštene iz istog razloga općenito se ne nadoknađuju. Ta se razlika objašnjava samom prirodom ta dva bogoslužna čina: molitva je svakodnevni čin koji se ponavlja nekoliko puta dnevno, dok je post godišnji i usredotočen na određeni mjesec.',
    section2Body2: 'Ta razlika može iznenaditi pri prvom upoznavanju s fikhom. Ne znači da molitva vrijedi manje: slijediti oslobođenje onako kako je propisano i samo po sebi je puni dio vjerske prakse.',
    section3Body: 'Ne moliti tokom menstruacije ne znači biti odsječena od svoje duhovnosti. Mnogi oblici bogoslužja i vjerskog angažmana ostaju dostupni u tom razdoblju.',
    worshipActs: [
      'Zikr (spominjanje Boga)',
      'Dove (molitve molbe)',
      'Dobročinstvo',
      'Pomaganje drugima',
      'Vjersko učenje',
      'Slušanje vjerskog sadržaja',
      'Promišljanje i zahvalnost',
      'Djela dobrote',
    ],
    noteTitle: 'Napomena',
    noteText: 'O nekim praksama, poput recitiranja ili izravnog dodirivanja Kur’ana, mogu postojati različita mišljenja ovisno o pravnoj školi. Oslanjanje na mišljenje koje obično slijediš ili traženje savjeta kvalificiranog učenjaka pomaže razjasniti te slučajeve.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Suspendirana molitva tokom menstruacije priznato je oslobođenje koje treba proživjeti bez krivnje. Mnogi oblici duhovnosti ostaju dostupni u tom razdoblju, a savjet kvalificiranog učenjaka ostaje mjerodavan za svako konkretno pitanje.',
    shareMessage: 'Molitva tokom menstruacije — AWA',
  },
  sl: {
    badge: 'MOLITEV MED MENSTRUACIJO',
    title: 'Molitev med\nmenstruacijo',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj je ritualna molitev v tem obdobju suspendirana in kako ga preživeti mirno.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Suspendirana molitev med menstruacijo',
      'Zamujene molitve se ne nadomeščajo, za razliko od posta',
      'Druge oblike bogoslužja ostajajo mogoče',
      'Ključna sporočila',
    ],
    section1Body1: 'Med menstruacijo je obveznost molitve (salata) suspendirana: ženska v tem obdobju ni dolžna moliti. Ta suspenzija je sestavni del same verske prakse, dolgo priznan v tradiciji.',
    section1Body2: 'Ta suspenzija nikakor ne pomeni oddaljevanja od vere ali opustitve verske prakse. To je priznana oprostitev, ki jo je treba doživeti brez krivde: del je naravnega okvira ženskega duhovnega življenja.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Temu obdobju je mogoče pristopiti mirno: ne dvomi niti v vrednost vere niti v redovnost verske prakse.',
    section1Body3: 'Če se menstruacija začne, medtem ko je molitev v teku, se ta prekine: ni je treba dokončati ali nadomestiti. Nasprotno, ko se menstruacija konča, se molitev običajno nadaljuje po guslu (velikem umivanju), ki označuje vrnitev v stanje ritualne čistosti.',
    section2Body1: 'Za razliko od posta v ramazanu, katerega dnevi, zamujeni med menstruacijo, se naknadno nadomestijo (kada), se molitve, zamujene iz istega razloga, na splošno ne nadomeščajo. To razliko pojasnjuje sama narava teh dveh bogoslužnih dejanj: molitev je vsakodnevno dejanje, ki se ponavlja večkrat na dan, medtem ko je post letni in osredotočen na določen mesec.',
    section2Body2: 'Ta razlika lahko preseneti ob prvem spoznavanju fikha. Ne pomeni, da molitev velja manj: slediti oprostitvi, kot je predpisana, je že sam po sebi poln del verske prakse.',
    section3Body: 'Ne moliti med menstruacijo ne pomeni biti odrezana od svoje duhovnosti. Mnoge oblike bogoslužja in verske angažiranosti ostajajo dostopne v tem obdobju.',
    worshipActs: [
      'Zikr (spominjanje Boga)',
      'Dove (prošnje)',
      'Dobrodelnost',
      'Pomaganje drugim',
      'Versko učenje',
      'Poslušanje verske vsebine',
      'Razmišljanje in hvaležnost',
      'Dobra dela',
    ],
    noteTitle: 'Opomba',
    noteText: 'O nekaterih praksah, kot sta recitiranje ali neposredno dotikanje Kur’ana, lahko obstajajo različna mnenja glede na pravno šolo. Zanašanje na mnenje, ki mu običajno slediš, ali iskanje nasveta kvalificiranega učenjaka pomaga razjasniti te primere.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Suspendirana molitev med menstruacijo je priznana oprostitev, ki jo je treba doživeti brez krivde. Mnoge oblike duhovnosti ostajajo dostopne v tem obdobju, nasvet kvalificiranega učenjaka pa ostaja merodajen za vsako konkretno vprašanje.',
    shareMessage: 'Molitev med menstruacijo — AWA',
  },
  ne: {
    badge: 'महिनावारीमा नमाज',
    title: 'महिनावारीमा\nनमाज',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'यो अवधिमा अनुष्ठानिक नमाज किन स्थगित हुन्छ, र यो समयलाई शान्तिसँग कसरी बिताउने।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'महिनावारीमा स्थगित नमाज',
      'रोजाको विपरीत, छुटेका नमाज कजा गर्नु पर्दैन',
      'इबादतका अन्य रूपहरू सम्भव रहन्छन्',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'महिनावारीको समयमा, नमाज (सलात) को दायित्व स्थगित हुन्छ: यो अवधिमा महिलाले नमाज पढ्नुपर्दैन। यो स्थगन धार्मिक अभ्यासकै अभिन्न अङ्ग हो, जुन परम्पराले लामो समयदेखि मान्यता दिएको छ।',
    section1Body2: 'यो स्थगनको कुनै पनि हालतमा अर्थ आस्थाबाट टाढा हुनु वा धार्मिक अभ्यासमा चुक्नु होइन। यो मान्यता प्राप्त छुट हो, जसलाई अपराधबोधबिना अनुभव गर्नुपर्छ: यो महिलाको आध्यात्मिक जीवनको स्वाभाविक ढाँचाको हिस्सा हो।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'यो समयलाई शान्तिसँग सामना गर्न सकिन्छ: यसले न आस्थाको मूल्यमाथि न त धार्मिक अभ्यासको नियमिततामाथि प्रश्न उठाउँछ।',
    section1Body3: 'नमाज चलिरहँदा महिनावारी सुरु भएमा, यो रोकिन्छ: यसलाई पूरा गर्नु वा कजा गर्नु पर्दैन। उल्टो, महिनावारी सकिएपछि, गुस्ल (ठूलो वुजु) पछि नमाज सामान्य रूपमा फेरि सुरु हुन्छ, जसले अनुष्ठानिक पवित्रताको अवस्थामा फर्किएको चिह्नित गर्छ।',
    section2Body1: 'रमजानको रोजाको विपरीत, जसको महिनावारीमा छुटेका दिनहरू पछि कजा गरिन्छ (कजा), यही कारणले छुटेका नमाजहरू सामान्यतया पछि कजा गरिँदैनन्। यो भिन्नता यी दुई इबादतको प्रकृतिले नै व्याख्या गर्छ: नमाज दिनमा धेरै पटक दोहोरिने दैनिक कार्य हो, जबकि रोजा वार्षिक हो र एउटा विशेष महिनामा केन्द्रित हुन्छ।',
    section2Body2: 'फिक्ह पहिलो पटक पत्ता लगाउँदा यो भिन्नता आश्चर्यजनक हुन सक्छ। यसको अर्थ नमाजको मूल्य कम हो भन्ने होइन: छुटलाई तोकिएबमोजिम पछ्याउनु आफैँमा धार्मिक अभ्यासको पूर्ण हिस्सा हो।',
    section3Body: 'महिनावारीमा नमाज नपढ्नुको अर्थ आफ्नो आध्यात्मिकताबाट कटिनु होइन। इबादत र धार्मिक संलग्नताका धेरै रूप यस समयमा पहुँचयोग्य रहन्छन्।',
    worshipActs: [
      'जिक्र (अल्लाहको स्मरण)',
      'दुआहरू',
      'दान',
      'अरूलाई मद्दत गर्ने',
      'धार्मिक सिकाइ',
      'धार्मिक सामग्री सुन्ने',
      'चिन्तन र कृतज्ञता',
      'दयालुताका कार्यहरू',
    ],
    noteTitle: 'कृपया ध्यान दिनुहोस्',
    noteText: 'केही अभ्यासहरू, जस्तै कुरआनको पाठ वा सिधै छुने, फिक्हको विचारधाराअनुसार फरक रायका विषय हुन सक्छन्। तपाईंले सामान्यतया पछ्याउने रायलाई हेर्नु, वा योग्य विद्वानसँग सल्लाह लिनुले यी अवस्थाहरू स्पष्ट पार्न मद्दत गर्छ।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'महिनावारीमा स्थगित नमाज एउटा मान्यता प्राप्त छुट हो, जसलाई अपराधबोधबिना अनुभव गर्नुपर्छ। यस समयमा आध्यात्मिकताका धेरै रूप पहुँचयोग्य रहन्छन्, र कुनै विशेष प्रश्नका लागि योग्य विद्वानको सल्लाह नै सन्दर्भ रहन्छ।',
    shareMessage: 'महिनावारीमा नमाज — AWA',
  },
  si: {
    badge: 'ඔසප් කාලයේ සලාත්',
    title: 'ඔසප් කාලයේ\nසලාත්',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'මෙම කාලය තුළ ආචාරික සලාත් අත්හිටුවන්නේ ඇයි, සහ මෙම කාලය සන්සුන්කමින් අත්විඳින්නේ කෙසේද.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔසප් කාලයේ අත්හිටවූ සලාත්',
      'උපවාසය මෙන් නොව, මග හැරුණු සලාත් පිරිමැසීමක් නැත',
      'වෙනත් නමස්කාර ආකාර තවමත් හැකියි',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'ඔසප් කාලයේදී, සලාත්හි (සලාත්) බැඳීම අත්හිටුවනු ලැබේ: කාන්තාවක් මෙම කාලය තුළ සලාත් කිරීමට බැඳී නැත. මෙම අත්හිටුවීම ආගමික පුරුද්දේම අනිවාර්ය කොටසක් වන අතර, සම්ප්‍රදාය විසින් බොහෝ කලක සිට පිළිගෙන ඇත.',
    section1Body2: 'මෙම අත්හිටුවීමෙන් ඇදහිල්ලෙන් දුරස් වීමක් හෝ ආගමික පුරුද්දේ අඩුපාඩුවක් කිසිසේත් අදහස් නොවේ. එය පිළිගත් නිදහස් කිරීමක් වන අතර, වරදකාරී හැඟීමකින් තොරව අත්විඳිය යුතුයි: එය කාන්තාවකගේ ආධ්‍යාත්මික ජීවිතයේ ස්වාභාවික රාමුවේ කොටසකි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'මෙම කාලයට සන්සුන්කමින් ළඟා විය හැක: එය තමන්ගේ ඇදහිල්ලේ වටිනාකම හෝ තමන්ගේ ආගමික පුරුද්දේ නිතිපතා බව ප්‍රශ්න නොකරයි.',
    section1Body3: 'සලාත් කරමින් සිටියදී ඔසප් ආරම්භ වුවහොත්, එය බාධා වේ: එය අවසන් කිරීම හෝ පිරිමැසීම අවශ්‍ය නොවේ. අනෙක් අතට, ඔසප් අවසන් වූ විට, ආචාරික පාරිශුද්ධ තත්ත්වයට නැවත පැමිණීම සලකුණු කරන ගුස්ල් (ප්‍රධාන වුළූව) පසු සලාත් සාමාන්‍ය ලෙස නැවත ආරම්භ වේ.',
    section2Body1: 'ඔසප් කාලයේදී මග හැරුණු දින පසුව පිරිමැසෙන (කදා) රමළාන් උපවාසයට වෙනස්ව, මේ එකම හේතුව නිසා මග හැරුණු සලාත් සාමාන්‍යයෙන් පසුව පිරිමැසෙන්නේ නැත. මෙම වෙනස මෙම නමස්කාර ක්‍රියා දෙකේම ස්වභාවයෙන් පැහැදිලි කෙරේ: සලාත් යනු දිනකට කිහිප වතාවක් පුනරාවර්තනය වන දෛනික ක්‍රියාවක් වන අතර, උපවාසය වාර්ෂික වන අතර නිශ්චිත මාසයක් මත සංකේන්ද්‍රණය වේ.',
    section2Body2: 'ෆික්හ් පළමුවරට සොයාගන්නා විට මෙම වෙනස පුදුම සහගත විය හැක. එයින් අදහස් වන්නේ සලාත් අඩුවෙන් වැදගත් බව නොවේ: නිදහස් කිරීම නියම කර ඇති පරිදි අනුගමනය කිරීම එය සම්පූර්ණයෙන්ම ආගමික පුරුද්දේ කොටසකි.',
    section3Body: 'ඔසප් කාලයේ සලාත් නොකිරීම යනු තමන්ගේ ආධ්‍යාත්මිකතාවෙන් විසන්ධි වීම නොවේ. නමස්කාර සහ ආගමික නිරත වීමේ බොහෝ ආකාර මෙම කාලය තුළ ප්‍රවේශ්‍ය ලෙස පවතී.',
    worshipActs: [
      'ධික්ර් (දෙවියන් සිහි කිරීම)',
      'දුආ (ප්‍රාර්ථනා)',
      'දානය',
      'අන් අයට උදව් කිරීම',
      'ආගමික ඉගෙනීම',
      'ආගමික අන්තර්ගතයට සවන් දීම',
      'ආවර්ජනය සහ කෘතඥතාව',
      'කරුණාවන්ත ක්‍රියා',
    ],
    noteTitle: 'කරුණාකර සටහන් කරන්න',
    noteText: 'අල් කුර්ආනය කියවීම හෝ කෙලින්ම ස්පර්ශ කිරීම වැනි සමහර පුරුදු නීති චින්තන ධාරාව අනුව වෙනස් මත වලට යටත් විය හැක. ඔබ සාමාන්‍යයෙන් අනුගමනය කරන මතයට යොමු වීම, හෝ සුදුසුකම් ලත් විද්වතෙකුගෙන් උපදෙස් ලබා ගැනීම, මෙම අවස්ථා පැහැදිලි කිරීමට උපකාරී වේ.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'ඔසප් කාලයේ අත්හිටවූ සලාත් යනු වරදකාරී හැඟීමකින් තොරව අත්විඳිය යුතු පිළිගත් නිදහස් කිරීමකි. ආධ්‍යාත්මිකතාවේ බොහෝ ආකාර මෙම කාලය තුළ ප්‍රවේශ්‍ය ලෙස පවතින අතර, ඕනෑම විශේෂ ප්‍රශ්නයක් සඳහා සුදුසුකම් ලත් විද්වතෙකුගේ උපදෙස් යොමුව ලෙස පවතී.',
    shareMessage: 'ඔසප් කාලයේ සලාත් — AWA',
  },
  th: {
    badge: 'การละหมาดระหว่างมีประจำเดือน',
    title: 'การละหมาดระหว่าง\nมีประจำเดือน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมการละหมาดตามพิธีกรรมจึงถูกระงับในช่วงนี้ และผ่านช่วงเวลานี้ด้วยความสงบได้อย่างไร',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การละหมาดที่ถูกระงับระหว่างมีประจำเดือน',
      'ไม่ต้องชดเชยการละหมาดที่พลาด ต่างจากการถือศีลอด',
      'ศาสนกิจรูปแบบอื่นยังทำได้',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'ระหว่างมีประจำเดือน หน้าที่การละหมาด (ศอลาต) ถูกระงับ: สตรีไม่จำเป็นต้องละหมาดในช่วงนี้ การระงับนี้เป็นส่วนหนึ่งของการปฏิบัติศาสนกิจเอง ซึ่งประเพณีรับรู้มานาน',
    section1Body2: 'การระงับนี้ไม่ได้หมายถึงการห่างจากศรัทธาหรือการบกพร่องในการปฏิบัติศาสนกิจแต่อย่างใด เป็นการยกเว้นที่ได้รับการยอมรับ ซึ่งควรเผชิญโดยไม่รู้สึกผิด: เป็นส่วนหนึ่งของกรอบตามธรรมชาติของชีวิตทางจิตวิญญาณของสตรี',
    tip1Title: 'ควรรู้',
    tip1Text: 'ช่วงเวลานี้เผชิญได้ด้วยความสงบ: ไม่ได้ตั้งคำถามกับคุณค่าของศรัทธาหรือความสม่ำเสมอของการปฏิบัติศาสนกิจ',
    section1Body3: 'หากประจำเดือนเริ่มขณะละหมาดอยู่ การละหมาดจะถูกขัดจังหวะ: ไม่ต้องทำให้เสร็จหรือชดเชย ในทางกลับกัน เมื่อประจำเดือนสิ้นสุด การละหมาดกลับมาตามปกติหลังฆุสล์ (การอาบน้ำชำระใหญ่) ซึ่งเป็นการกลับสู่สภาวะความสะอาดตามพิธีกรรม',
    section2Body1: 'ต่างจากการถือศีลอดรอมฎอน ซึ่งวันที่พลาดระหว่างมีประจำเดือนต้องชดเชยภายหลัง (กอฎาอ์) การละหมาดที่พลาดด้วยเหตุผลเดียวกันโดยทั่วไปไม่ต้องชดเชยภายหลัง ความแตกต่างนี้อธิบายได้จากลักษณะของศาสนกิจทั้งสอง: การละหมาดเป็นการกระทำประจำวันที่ทำซ้ำหลายครั้งต่อวัน ขณะที่การถือศีลอดเป็นรายปีและเน้นในเดือนเฉพาะ',
    section2Body2: 'ความแตกต่างนี้อาจน่าประหลาดใจเมื่อเริ่มศึกษาฟิกฮ์ ไม่ได้หมายความว่าการละหมาดมีค่าน้อยกว่า: การปฏิบัติตามการยกเว้นตามที่กำหนดไว้เป็นส่วนหนึ่งของการปฏิบัติศาสนกิจอย่างสมบูรณ์ในตัวเอง',
    section3Body: 'การไม่ละหมาดระหว่างมีประจำเดือนไม่ได้หมายถึงการขาดจากจิตวิญญาณของตน ศาสนกิจและการมีส่วนร่วมทางศาสนาหลายรูปแบบยังเข้าถึงได้ในช่วงนี้',
    worshipActs: [
      'ซิกร์ (การระลึกถึงอัลลอฮ์)',
      'ดุอาอ์ (การวิงวอน)',
      'การบริจาคทาน',
      'การช่วยเหลือผู้อื่น',
      'การเรียนรู้ทางศาสนา',
      'ฟังเนื้อหาทางศาสนา',
      'การใคร่ครวญและความกตัญญู',
      'การกระทำที่ดีงาม',
    ],
    noteTitle: 'โปรดทราบ',
    noteText: 'การปฏิบัติบางอย่าง เช่น การอ่านหรือสัมผัสอัลกุรอานโดยตรง อาจมีความเห็นต่างกันตามสำนักนิติศาสตร์ การอ้างอิงความเห็นที่คุณปฏิบัติตามตามปกติหรือการขอคำแนะนำจากผู้รู้ที่มีคุณวุฒิ ช่วยทำให้กรณีเหล่านี้ชัดเจน',
    tip2Title: 'ควรรู้',
    tip2Text: 'การละหมาดที่ถูกระงับระหว่างมีประจำเดือนเป็นการยกเว้นที่ได้รับการยอมรับ ควรเผชิญโดยไม่รู้สึกผิด จิตวิญญาณหลายรูปแบบยังเข้าถึงได้ในช่วงนี้ และคำแนะนำของผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งอ้างอิงสำหรับคำถามเฉพาะใด ๆ',
    shareMessage: 'การละหมาดระหว่างมีประจำเดือน — AWA',
  },
  vi: {
    badge: 'CẦU NGUYỆN TRONG KỲ KINH',
    title: 'Cầu nguyện trong\nkỳ kinh',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao việc cầu nguyện nghi lễ được tạm ngưng trong thời gian này và cách trải qua giai đoạn này một cách thanh thản.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Việc cầu nguyện được tạm ngưng trong kỳ kinh',
      'Không bù lại những buổi cầu nguyện đã bỏ lỡ, khác với nhịn ăn',
      'Các hình thức thờ phượng khác vẫn có thể thực hiện',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'Trong kỳ kinh, nghĩa vụ cầu nguyện (salat) được tạm ngưng: người phụ nữ không bắt buộc phải cầu nguyện trong thời gian này. Sự tạm ngưng này là một phần không thể tách rời của chính thực hành tôn giáo, được truyền thống công nhận từ lâu.',
    section1Body2: 'Sự tạm ngưng này hoàn toàn không có nghĩa là xa rời đức tin hay thiếu sót trong thực hành tôn giáo. Đó là một sự miễn trừ được công nhận, cần được trải qua mà không mặc cảm: nó là một phần của khuôn khổ tự nhiên trong đời sống tâm linh của người phụ nữ.',
    tip1Title: 'Nên biết',
    tip1Text: 'Giai đoạn này có thể được đón nhận một cách thanh thản: nó không đặt dấu hỏi về giá trị đức tin cũng như sự đều đặn trong thực hành tôn giáo của một người.',
    section1Body3: 'Nếu kỳ kinh bắt đầu trong lúc đang cầu nguyện, buổi cầu nguyện bị gián đoạn: không cần hoàn thành hay bù lại. Ngược lại, khi kỳ kinh kết thúc, việc cầu nguyện tiếp tục bình thường sau ghusl (tắm gội nghi lễ lớn), đánh dấu sự trở lại trạng thái thanh sạch nghi lễ.',
    section2Body1: 'Khác với nhịn ăn Ramadan, nơi những ngày bỏ lỡ trong kỳ kinh được bù lại sau (qadaa), những buổi cầu nguyện bị bỏ lỡ vì cùng lý do này nhìn chung không được bù lại sau đó. Sự khác biệt này được giải thích bởi chính bản chất của hai hành vi thờ phượng này: cầu nguyện là hành vi hằng ngày lặp lại nhiều lần trong ngày, trong khi nhịn ăn diễn ra hằng năm và tập trung vào một tháng cụ thể.',
    section2Body2: 'Sự phân biệt này có thể gây ngạc nhiên khi lần đầu tìm hiểu fiqh. Nó không có nghĩa là cầu nguyện có giá trị thấp hơn: tuân theo sự miễn trừ như được quy định tự nó là một phần trọn vẹn của thực hành tôn giáo.',
    section3Body: 'Không cầu nguyện trong kỳ kinh không có nghĩa là bị tách khỏi đời sống tâm linh. Nhiều hình thức thờ phượng và sự gắn bó tôn giáo vẫn có thể thực hiện trong thời gian này.',
    worshipActs: [
      'Dhikr (tưởng nhớ Thượng Đế)',
      'Du’a (những lời cầu xin)',
      'Làm từ thiện',
      'Giúp đỡ người khác',
      'Học hỏi về tôn giáo',
      'Nghe nội dung tôn giáo',
      'Suy ngẫm và biết ơn',
      'Những hành động tử tế',
    ],
    noteTitle: 'Xin lưu ý',
    noteText: 'Một số thực hành, như đọc hoặc trực tiếp cầm Quran, có thể có những ý kiến khác nhau tùy theo trường phái luật học. Tham khảo ý kiến bạn thường theo, hoặc tìm lời khuyên từ một học giả có thẩm quyền, giúp làm rõ những trường hợp này.',
    tip2Title: 'Nên biết',
    tip2Text: 'Việc cầu nguyện được tạm ngưng trong kỳ kinh là một sự miễn trừ được công nhận, cần được trải qua mà không mặc cảm. Nhiều hình thức tâm linh vẫn có thể thực hiện trong thời gian này, và lời khuyên của một học giả có thẩm quyền vẫn là tham chiếu cho mọi câu hỏi cụ thể.',
    shareMessage: 'Cầu nguyện trong kỳ kinh — AWA',
  },
  uz: {
    badge: 'HAYZ PAYTIDA NAMOZ',
    title: 'Hayz paytida\nnamoz',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima uchun bu davrda ritual namoz toʻxtatiladi va bu vaqtni xotirjam qanday oʻtkazish kerak.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Hayz paytida toʻxtatilgan namoz',
      'Roʻzadan farqli ravishda oʻtkazib yuborilgan namozlar qazo qilinmaydi',
      'Boshqa ibodat turlari mumkin boʻlib qoladi',
      'Asosiy xulosalar',
    ],
    section1Body1: 'Hayz paytida namoz (salot) majburiyati toʻxtatiladi: ayol bu davrda namoz oʻqishi shart emas. Bu toʻxtatilish diniy amaliyotning oʻzining ajralmas qismi boʻlib, anʼana tomonidan uzoq vaqt tan olingan.',
    section1Body2: 'Bu toʻxtatilish hech qanday holatda imondan uzoqlashishni yoki diniy amaliyotdagi uzilishni bildirmaydi. Bu tan olingan ozodlik, uni aybdorlik hissisiz boshdan kechirish kerak: u ayol maʼnaviy hayotining tabiiy doirasining bir qismi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Bu vaqtga xotirjamlik bilan yondashish mumkin: u imoningiz qadrini ham, diniy amaliyotingiz muntazamligini ham shubha ostiga qoʻymaydi.',
    section1Body3: 'Agar namoz davomida hayz boshlansa, namoz toʻxtatiladi: uni tugatish yoki qazo qilish shart emas. Aksincha, hayz tugaganda, namoz gʻusldan (katta tahorat) keyin, yaʼni ritual poklik holatiga qaytishni bildiruvchi amaldan keyin odatdagidek davom etadi.',
    section2Body1: 'Hayz paytida oʻtkazib yuborilgan kunlari keyinroq qazo qilinadigan Ramazon roʻzasidan farqli ravishda, shu sabab bilan oʻtkazib yuborilgan namozlar odatda keyin qazo qilinmaydi. Bu farq ikki ibodatning tabiati bilan izohlanadi: namoz kuniga bir necha marta takrorlanadigan kundalik amal, roʻza esa yillik va muayyan oyga jamlangan.',
    section2Body2: 'Bu farq fiqh bilan birinchi marta tanishganda hayratlantirishi mumkin. Bu namoz kamroq ahamiyatga ega degani emas: ozodlikka u belgilanganidek amal qilishning oʻzi diniy amaliyotning toʻliq bir qismi.',
    section3Body: 'Hayz paytida namoz oʻqimaslik maʼnaviyatdan ajralib qolishni anglatmaydi. Koʻp ibodat turlari va diniy ishtirok shu vaqtda mumkin boʻlib qoladi.',
    worshipActs: [
      'Zikr (Allohni eslash)',
      'Duolar',
      'Sadaqa',
      'Boshqalarga yordam berish',
      'Diniy ilm olish',
      'Diniy kontentni tinglash',
      'Tafakkur va minnatdorchilik',
      'Yaxshilik amallari',
    ],
    noteTitle: 'Eʼtibor bering',
    noteText: 'Qurʼonni oʻqish yoki bevosita ushlash kabi baʼzi amallar fiqhiy maktabga qarab turlicha fikrlarga ega boʻlishi mumkin. Odatda amal qiladigan fikringizga murojaat qilish yoki malakali olimdan maslahat olish bu holatlarni aniqlashtirishga yordam beradi.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'Hayz paytida toʻxtatilgan namoz tan olingan ozodlik, uni aybdorlik hissisiz boshdan kechirish kerak. Koʻp maʼnaviyat shakllari shu vaqtda mumkin boʻlib qoladi, har qanday maxsus savol uchun malakali olimning maslahati tayanch boʻlib qoladi.',
    shareMessage: 'Hayz paytida namoz — AWA',
  },
  az: {
    badge: 'AYBAŞI ZAMANI NAMAZ',
    title: 'Aybaşı zamanı\nnamaz',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Ritual namaz bu dövrdə nə üçün dayandırılır və bu dövrü sakitliklə necə yaşamaq olar.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Aybaşı zamanı dayandırılan namaz',
      'Oructan fərqli olaraq buraxılmış namazlar qəza edilmir',
      'İbadətin digər formaları mümkün qalır',
      'Əsas nəticələr',
    ],
    section1Body1: 'Aybaşı zamanı namaz (salat) öhdəliyi dayandırılır: qadın bu dövrdə namaz qılmağa borclu deyil. Bu dayandırma ənənə tərəfindən çoxdan tanınan dini təcrübənin ayrılmaz hissəsidir.',
    section1Body2: 'Bu dayandırma heç bir halda imandan uzaqlaşma və ya dini təcrübənin pozulması demək deyil. Bu, günah hissi olmadan yaşanmalı tanınan azad olmadır: o, qadının mənəvi həyatının təbii çərçivəsinin bir hissəsidir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Bu dövrə sakitliklə yanaşmaq olar: o, nə imanın dəyərini, nə də dini təcrübənin müntəzəmliyini sual altına qoymur.',
    section1Body3: 'Namaz zamanı aybaşı başlayarsa, namaz kəsilir: onu tamamlamaq və ya qəza etmək lazım deyil. Əksinə, aybaşı bitəndə ritual paklıq vəziyyətinə qayıdışı bildirən qüsldən (böyük dəstəmaz) sonra namaz normal şəkildə bərpa olunur.',
    section2Body1: 'Aybaşı zamanı buraxılmış günləri sonradan qəza edilən Ramazan orucundan fərqli olaraq, eyni səbəbə görə buraxılmış namazlar adətən sonradan qəza edilmir. Bu fərq bu iki ibadətin təbiəti ilə izah olunur: namaz gündə bir neçə dəfə təkrarlanan gündəlik aktdır, oruc isə illikdir və konkret aya cəmlənib.',
    section2Body2: 'Bu fərq fiqhi ilk dəfə kəşf edərkən təəccüblü ola bilər. Bu, namazın daha az əhəmiyyətli olduğu demək deyil: azad olmaya təyin olunduğu kimi əməl etmək özlüyündə dini təcrübənin tam hissəsidir.',
    section3Body: 'Aybaşı zamanı namaz qılmamaq mənəviyyatdan ayrılmaq demək deyil. İbadətin və dini fəaliyyətin bir çox formaları bu dövrdə əlçatan qalır.',
    worshipActs: [
      'Zikr (Allahı yad etmə)',
      'Dualar',
      'Sədəqə',
      'Başqalarına kömək',
      'Dini öyrənmə',
      'Dini məzmuna qulaq asmaq',
      'Düşüncə və şükür',
      'Xeyirxah əməllər',
    ],
    noteTitle: 'Nəzərə alın',
    noteText: 'Quranı oxumaq və ya birbaşa əlinə almaq kimi bəzi təcrübələr hüquq məktəbindən asılı olaraq fərqli fikirlərə məruz qala bilər. Adətən əməl etdiyiniz fikrə müraciət etmək və ya səlahiyyətli alimdən məsləhət almaq bu halları aydınlaşdırmağa kömək edir.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Aybaşı zamanı dayandırılan namaz günah hissi olmadan yaşanmalı tanınan azad olmadır. Mənəviyyatın bir çox formaları bu dövrdə əlçatan qalır və hər hansı konkret sual üçün səlahiyyətli alimin məsləhəti istinad olaraq qalır.',
    shareMessage: 'Aybaşı zamanı namaz — AWA',
  },
  ka: {
    badge: 'ლოცვა მენსტრუაციის დროს',
    title: 'ლოცვა\nმენსტრუაციის დროს',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ ჩერდება რიტუალური ლოცვა ამ დროს და როგორ გავატაროთ ეს პერიოდი სიმშვიდით.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'შეჩერებული ლოცვა მენსტრუაციის დროს',
      'გამოტოვებული ლოცვების ანაზღაურების გარეშე, მარხვისგან განსხვავებით',
      'ღვთისმსახურების სხვა ფორმები რჩება შესაძლებელი',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'მენსტრუაციის დროს ლოცვის (სალათის) ვალდებულება შეჩერებულია: ქალი ამ პერიოდში ლოცვას არ არის ვალდებული. ეს შეჩერება თავად რელიგიური პრაქტიკის განუყოფელი ნაწილია, რომელიც ტრადიციით დიდი ხანია აღიარებულია.',
    section1Body2: 'ეს შეჩერება არავითარ შემთხვევაში არ ნიშნავს რწმენისგან დაშორებას ან რელიგიური პრაქტიკის შეწყვეტას. ეს აღიარებული გათავისუფლებაა, რომელიც დანაშაულის გრძნობის გარეშე უნდა განიცადოთ: ის ქალის სულიერი ცხოვრების ბუნებრივი ჩარჩოს ნაწილია.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ამ დროს სიმშვიდით შეიძლება მივუდგეთ: ის კითხვის ნიშნის ქვეშ არ აყენებს არც რწმენის ღირებულებას და არც რელიგიური პრაქტიკის რეგულარულობას.',
    section1Body3: 'თუ მენსტრუაცია ლოცვის დროს იწყება, ლოცვა წყდება: მისი დასრულება ან ანაზღაურება საჭირო არ არის. პირიქით, როცა მენსტრუაცია მთავრდება, ლოცვა ღუსლის (დიდი აბდესტის) შემდეგ ნორმალურად განახლდება, რაც რიტუალური სისუფთავის მდგომარეობაში დაბრუნებას აღნიშნავს.',
    section2Body1: 'რამადანის მარხვისგან განსხვავებით, რომლის მენსტრუაციის დროს გამოტოვებული დღეები მოგვიანებით აინაზღაურება (კადაა), ამავე მიზეზით გამოტოვებული ლოცვები ზოგადად შემდეგ არ აინაზღაურება. ეს განსხვავება ამ ორი ღვთისმსახურებრივი აქტის ბუნებით აიხსნება: ლოცვა ყოველდღიური აქტია, რომელიც დღეში რამდენჯერმე მეორდება, მარხვა კი წლიურია და კონკრეტულ თვეზეა კონცენტრირებული.',
    section2Body2: 'ეს განსხვავება შეიძლება გასაკვირი იყოს ფიქჰის პირველად გაცნობისას. ეს არ ნიშნავს, რომ ლოცვას ნაკლები მნიშვნელობა აქვს: გათავისუფლების მიყოლა ისე, როგორც ის არის დადგენილი, თავისთავად რელიგიური პრაქტიკის სრულფასოვანი ნაწილია.',
    section3Body: 'მენსტრუაციის დროს ლოცვის გარეშე ყოფნა არ ნიშნავს საკუთარი სულიერებისგან მოწყვეტას. ღვთისმსახურებისა და რელიგიური ჩართულობის ბევრი ფორმა ამ დროს ხელმისაწვდომი რჩება.',
    worshipActs: [
      'ზიქრი (ღმერთის მოხსენიება)',
      'დუა (ლოცვითი თხოვნები)',
      'ქველმოქმედება',
      'სხვების დახმარება',
      'რელიგიური სწავლა',
      'რელიგიური შინაარსის მოსმენა',
      'ფიქრი და მადლიერება',
      'სიკეთის აქტები',
    ],
    noteTitle: 'გაითვალისწინეთ',
    noteText: 'ზოგი პრაქტიკა, როგორიცაა ყურანის კითხვა ან პირდაპირი შეხება, შეიძლება სამართლებრივი სკოლის მიხედვით განსხვავებულ მოსაზრებებს ექვემდებარებოდეს. იმ მოსაზრებისადმი მიმართვა, რომელსაც ჩვეულებრივ მისდევთ, ან კვალიფიციური მეცნიერის რჩევის ძიება ამ შემთხვევების გარკვევაში გეხმარებათ.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'მენსტრუაციის დროს შეჩერებული ლოცვა აღიარებული გათავისუფლებაა, რომელიც დანაშაულის გრძნობის გარეშე უნდა განიცადოთ. სულიერების ბევრი ფორმა ამ დროს ხელმისაწვდომი რჩება, ხოლო კვალიფიციური მეცნიერის რჩევა ნებისმიერ კონკრეტულ კითხვაზე საორიენტაციო წყაროდ რჩება.',
    shareMessage: 'ლოცვა მენსტრუაციის დროს — AWA',
  },
  hy: {
    badge: 'ԱՂՈԹՔ ԴԱՇՏԱՆԻ ԸՆԹԱՑՔՈՒՄ',
    title: 'Աղոթք\nդաշտանի ընթացքում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու է ծիսական աղոթքը կասեցվում այս ընթացքում և ինչպես ապրել այս ժամանակահատվածը խաղաղությամբ:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Դաշտանի ընթացքում կասեցված աղոթքը',
      'Բաց թողնված աղոթքները չեն փոխհատուցվում, ի տարբերություն պահքի',
      'Պաշտամունքի այլ ձևերը մնում են հնարավոր',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'Դաշտանի ընթացքում աղոթքի (սալաթ) պարտավորությունը կասեցվում է. կինը պարտավոր չէ աղոթել այս ժամանակահատվածում: Այս կասեցումը հենց կրոնական պրակտիկայի անբաժանելի մասն է, որը վաղուց ճանաչված է ավանդույթով:',
    section1Body2: 'Այս կասեցումը ոչ մի կերպ չի նշանակում հավատքից հեռացում կամ կրոնական պրակտիկայի ընդհատում: Դա ճանաչված ազատում է, որը պետք է ապրել առանց մեղքի զգացման. այն կնոջ հոգևոր կյանքի բնական շրջանակի մասն է:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Այս ժամանակին կարելի է մոտենալ խաղաղությամբ. այն կասկածի տակ չի դնում ո՛չ հավատքի արժեքը, ո՛չ կրոնական պրակտիկայի կանոնավորությունը:',
    section1Body3: 'Եթե դաշտանը սկսվում է աղոթքի ընթացքում, այն ընդհատվում է. պետք չէ ավարտել կամ փոխհատուցել այն: Ընդհակառակը, երբ դաշտանն ավարտվում է, աղոթքը նորմալ վերսկսվում է ղուսլից (մեծ աբդեստ) հետո, որը նշում է ծիսական մաքրության վիճակի վերադարձը:',
    section2Body1: 'Ի տարբերություն Ռամադանի պահքի, որի դաշտանի պատճառով բաց թողնված օրերը փոխհատուցվում են ավելի ուշ (կադա), նույն պատճառով բաց թողնված աղոթքները սովորաբար հետագայում չեն փոխհատուցվում: Այս տարբերությունը բացատրվում է պաշտամունքի այս երկու գործողությունների բնույթով. աղոթքը օրական գործողություն է, որը կրկնվում է օրը մի քանի անգամ, մինչդեռ պահքը տարեկան է և կենտրոնացած է որոշակի ամսվա վրա:',
    section2Body2: 'Այս տարբերությունը կարող է զարմանալի լինել ֆիքհը նոր բացահայտելիս: Դա չի նշանակում, որ աղոթքը պակաս է հաշվվում. ազատմանը հետևելը, ինչպես որ սահմանված է, ինքնին լիովին կրոնական պրակտիկայի մաս է:',
    section3Body: 'Դաշտանի ընթացքում չաղոթելը չի նշանակում կտրվել սեփական հոգևորությունից: Պաշտամունքի և կրոնական ներգրավման բազմաթիվ ձևեր մնում են հասանելի այս ընթացքում:',
    worshipActs: [
      'Զիքր (Աստծո հիշատակում)',
      'Դուա (աղոթագրեր)',
      'Բարեգործություն',
      'Ուրիշներին օգնելը',
      'Կրոնական ուսուցում',
      'Կրոնական բովանդակություն լսելը',
      'Խորհրդածություն և երախտագիտություն',
      'Բարության արարքներ',
    ],
    noteTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    noteText: 'Որոշ պրակտիկաներ, օրինակ՝ Ղուրանի ընթերցումը կամ ուղղակի դիպչելը, կարող են ենթակա լինել տարբեր կարծիքների՝ կախված իրավագիտական դպրոցից: Սովորաբար հետևվող կարծիքին դիմելը կամ որակավորված գիտնականից խորհուրդ հարցնելը օգնում է պարզաբանել այս դեպքերը:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Դաշտանի ընթացքում կասեցված աղոթքը ճանաչված ազատում է, որը պետք է ապրել առանց մեղքի զգացման: Հոգևորության բազմաթիվ ձևեր մնում են հասանելի այս ընթացքում, և որակավորված գիտնականի խորհուրդը մնում է հիմնական հղումը ցանկացած կոնկրետ հարցի համար:',
    shareMessage: 'Աղոթք դաշտանի ընթացքում — AWA',
  },
  tg: {
    badge: 'НАМОЗ ҲАНГОМИ ҲАЙЗ',
    title: 'Намоз\nҳангоми ҳайз',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро намози маросимӣ дар ин вақт қатъ мешавад ва чӣ тавр ин давраро бо оромӣ аз сар гузаронидан мумкин аст.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Намози қатъшуда ҳангоми ҳайз',
      'Қазо накардани намозҳои аз даст рафта, бар хилофи рӯза',
      'Шаклҳои дигари ибодат имконпазир мемонанд',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'Ҳангоми ҳайз ӯҳдадории намоз (салот) қатъ мегардад: зан дар ин давра барои намоз хондан вазифадор нест. Ин қатъ ҷузъи ҷудонашавандаи худи амалияи динист, ки анъана аз қадим эътироф кардааст.',
    section1Body2: 'Ин қатъ ҳеҷ гуна дур шудан аз имон ё нуқсон дар амалияи динӣ нест. Ин озодии эътирофшуда аст, ки бояд бидуни гуноҳ аз сар гузаронида шавад: он қисми чорчӯбаи табиии зиндагии маънавии зан аст.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ба ин давра бо оромӣ наздик шудан мумкин аст: он на арзиши имон ва на мунтазамии амалияи диниро зери шубҳа мегузорад.',
    section1Body3: 'Агар ҳайз ҳангоми намоз оғоз шавад, намоз қатъ мегардад: онро ба анҷом расонидан ё қазо кардан лозим нест. Баръакс, вақте ки ҳайз ба охир мерасад, намоз пас аз ғусл (таҳорати калон), ки бозгашт ба ҳолати покии маросимиро нишон медиҳад, ба таври муқаррарӣ аз сар гирифта мешавад.',
    section2Body1: 'Бар хилофи рӯзаи Рамазон, ки рӯзҳои ҳангоми ҳайз аз даст рафтааш баъдтар қазо карда мешавад, намозҳои бо ҳамин сабаб аз даст рафта одатан баъдтар қазо намешаванд. Ин фарқ аз табиати худи ин ду амали ибодат шарҳ дода мешавад: намоз амали ҳаррӯзаест, ки дар як рӯз чанд маротиба такрор мешавад, дар ҳоле ки рӯза солона аст ва ба як моҳи мушаххас тамаркуз дорад.',
    section2Body2: 'Ин тафовут ҳангоми аввалин шиносоӣ бо фиқҳ метавонад ҳайратовар бошад. Ин маънои онро надорад, ки намоз камтар арзиш дорад: пайравӣ аз озодӣ тавре ки муқаррар шудааст, худ ба худ қисми пурраи амалияи динист.',
    section3Body: 'Намоз нахондан ҳангоми ҳайз маънои аз маънавиёти худ ҷудо шуданро надорад. Бисёр шаклҳои ибодат ва машғулияти динӣ дар ин давра дастрас мемонанд.',
    worshipActs: [
      'Зикр (ёди Худо)',
      'Дуо',
      'Садақа',
      'Кумак ба дигарон',
      'Омӯзиши динӣ',
      'Гӯш кардани мазмуни динӣ',
      'Андеша ва сипосгузорӣ',
      'Аъмоли нек',
    ],
    noteTitle: 'Таваҷҷӯҳ кунед',
    noteText: 'Баъзе амалҳо, аз қабили тиловат ё мустақим даст расонидан ба Қуръон, вобаста ба мазҳаби фиқҳӣ метавонанд мавриди назарҳои гуногун бошанд. Муроҷиат ба назаре, ки одатан пайравӣ мекунед, ё пурсидани маслиҳат аз олими салоҳиятдор ба равшан шудани ин ҳолатҳо кумак мекунад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Намози қатъшуда ҳангоми ҳайз озодии эътирофшуда аст, ки бояд бидуни гуноҳ аз сар гузаронида шавад. Бисёр шаклҳои маънавиёт дар ин давра дастрас мемонанд ва маслиҳати олими салоҳиятдор барои ҳар савол мушаххас манбаи асосӣ боқӣ мемонад.',
    shareMessage: 'Намоз ҳангоми ҳайз — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ УЧУРУНДАГЫ НАМАЗ',
    title: 'Етек кирим учурундагы\nнамаз',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Ибадаттык намаз бул мезгилде эмне үчүн токтотулат жана бул убакытты тынчтык менен кантип өткөрүү керек.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Етек кирим учурунда токтотулган намаз',
      'Орозодон айырмаланып, өткөрүлгөн намаздардын ордун толтурбоо',
      'Ибадаттын башка түрлөрү мүмкүн бойдон калат',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'Етек кирим учурунда намаздын (салат) милдети токтотулат: аял бул мезгилде намаз окууга милдеттүү эмес. Бул токтотуу диний практиканын өзүнүн ажырагыс бөлүгү, салт тарабынан эзелтен таанылган.',
    section1Body2: 'Бул токтотуу эч кандай ишенимден алыстоону же диний практиканын бузулушун билдирбейт. Бул таанылган бошотуу, аны күнөөсүз башынан өткөрүү керек: ал аялдын руханий жашоосунун табигый алкагынын бир бөлүгү.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Бул мезгилге тынчтык менен жакындаса болот: ал ишенимдин баалуулугуна да, диний практиканын үзгүлтүксүздүгүнө да шек келтирбейт.',
    section1Body3: 'Эгер етек кирим намаз жүрүп жатканда башталса, ал үзүлөт: аны бүтүрүүнүн же ордун толтуруунун кереги жок. Тескерисинче, етек кирим аяктаганда, намаз ибадаттык тазалык абалына кайтууну белгилеген гусулдан (чоң даарат) кийин кадимкидей уланат.',
    section2Body1: 'Етек кирим учурунда өткөрүлгөн күндөрдүн ордун кийин толтура турган (казо) Рамазан орозосунан айырмаланып, ушул эле себептен өткөрүлгөн намаздардын ордун жалпысынан кийин толтурушпайт. Бул айырмачылык бул эки ибадаттын табиятына байланыштуу: намаз күнүнө бир нече жолу кайталанган күнүмдүк аракет, ал эми орозо жыл сайын жана белгилүү бир айга топтолгон.',
    section2Body2: 'Бул айырмачылык фикхти алгач таанып жатканда таң калтырышы мүмкүн. Ал намаз азыраак маанилүү дегенди билдирбейт: бошотууну белгиленгендей ээрчүү өзү диний практиканын толук бөлүгү.',
    section3Body: 'Етек кирим учурунда намаз окубоо руханийлигиңизден ажырап калуу дегенди билдирбейт. Ибадаттын жана диний катышуунун көптөгөн түрлөрү бул мезгилде жеткиликтүү бойдон калат.',
    worshipActs: [
      'Зикир (Аллахты эскерүү)',
      'Дуалар',
      'Садака',
      'Башкаларга жардам берүү',
      'Диний билим алуу',
      'Диний мазмунду угуу',
      'Ой жүгүртүү жана ыраазычылык',
      'Жакшылык иштер',
    ],
    noteTitle: 'Көңүл буруңуз',
    noteText: 'Айрым практикалар, мисалы Куранды окуу же түз кармоо, фикх мектебине жараша ар кандай пикирлерге ээ болушу мүмкүн. Адатта ээрчип жүргөн пикириңизге кайрылуу же квалификациялуу окумуштуудан кеңеш сурап көрүү бул учурларды тактоого жардам берет.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Етек кирим учурунда токтотулган намаз — таанылган бошотуу, аны күнөөсүз башынан өткөрүү керек. Руханийликтин көптөгөн түрлөрү бул мезгилде жеткиликтүү бойдон калат, ал эми ар кандай өзгөчө суроо үчүн квалификациялуу окумуштуунун кеңеши шилтеме бойдон калат.',
    shareMessage: 'Етек кирим учурундагы намаз — AWA',
  },
  tk: {
    badge: 'AÝBAŞY WAGTYNDA NAMAZ',
    title: 'Aýbaşy wagtynda\nnamaz',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ritual namaz bu döwürde näme üçin togtadylýar we bu döwri asudalyk bilen nähili başdan geçirmeli.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Aýbaşy wagtynda togtadylan namaz',
      'Orazadan tapawutlylykda, sypdyrylan namazlary dolmak ýok',
      'Beýleki ybadat görnüşleri mümkin bolup galýar',
      'Esasy netijeler',
    ],
    section1Body1: 'Aýbaşy wagtynda namaz (salat) borjy togtadylýar: aýal bu döwürde namaz okamaga borçly däl. Bu togtadyş dini tejribäniň aýrylmaz bölegi, däp tarapyndan uzak wagt bäri ykrar edilen.',
    section1Body2: 'Bu togtadyş imandan daşlaşmagy ýa-da dini tejribede ýalňyşlygy hiç hili aňlatmaýar. Bu ykrar edilen erkinlik, günäkärlik duýgusyz başdan geçirilmeli: ol aýalyň ruhy durmuşynyň tebigy çarçuwasynyň bir bölegi.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Bu döwre asudalyk bilen ýakynlaşyp bolýar: ol ne imanyň gymmatyny, ne-de dini tejribäniň yzygiderliligini şübheli etmeýär.',
    section1Body3: 'Aýbaşy namaz dowam edýärkä başlasa, ol kesilýär: ony tamamlamaga ýa-da dolmaga zerurlyk ýok. Tersine, aýbaşy gutarandan soň, namaz dini arassalyk ýagdaýyna gaýdyp gelmegi belleýän gusuldan (uly täretden) soň adaty ýagdaýda täzeden başlaýar.',
    section2Body1: 'Aýbaşy wagtynda sypdyrylan günleri soňra dolulýan (kazo) Remezan orazasyndan tapawutlylykda, şol bir sebäp bilen sypdyrylan namazlar adatça soňra dolulmaýar. Bu tapawut bu iki ybadatyň tebigatyndan gelip çykýar: namaz günde birnäçe gezek gaýtalanýan gündelik amal, oraza bolsa ýyllyk we belli bir aýa jemlenen.',
    section2Body2: 'Bu tapawut fikhi ilkinji gezek açanyňyzda geň galdyryjy bolup biler. Bu namazyň az manysy bardygyny aňlatmaýar: erkinligi bellenilişi ýaly ýerine ýetirmek özi doly dini tejribäniň bir bölegi.',
    section3Body: 'Aýbaşy wagtynda namaz okamazlyk ruhy durmuşdan aýrylmagy aňlatmaýar. Köp ybadat we dini gatnaşyk görnüşleri bu döwürde elýeter bolup galýar.',
    worshipActs: [
      'Zikir (Hudaýy ýatlamak)',
      'Dua (doga)',
      'Sadaka',
      'Başgalara kömek etmek',
      'Dini bilim almak',
      'Dini mazmuny diňlemek',
      'Oýlanma we minnetdarlyk',
      'Ýagşylyk amallary',
    ],
    noteTitle: 'Üns beriň',
    noteText: 'Gurhany okamak ýa-da göni elde tutmak ýaly käbir tejribeler hukuk mekdebine görä dürli pikirlere sezewar bolup biler. Adatça eýerýän pikiriňize ýüz tutmak ýa-da bilimli alymdan maslahat soramak bu ýagdaýlary aýdyňlaşdyrmaga kömek edýär.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Aýbaşy wagtynda togtadylan namaz ykrar edilen erkinlik, günäkärlik duýgusyz başdan geçirilmeli. Ruhy durmuşyň köp görnüşi bu döwürde elýeter bolup galýar we bilimli alymyň maslahaty islendik aýratyn sorag üçin esasy çeşme bolup galýar.',
    shareMessage: 'Aýbaşy wagtynda namaz — AWA',
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