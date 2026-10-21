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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'ramadan-jeune-et-regles';

const HERO = CYCLE_PHASES_HERO;

const ART = {
  tracking: require('../../assets/images/library/featured-tracking-hero.png'),
};

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const SPIRITUAL_ACT_ICONS = [
  'hands-pray',
  'heart-outline',
  'headphones',
  'book-open-variant',
  'hand-heart-outline',
  'pot-steam-outline',
  'weather-night',
  'calendar-check-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('RamadanFasting', {
  fr: {
    badge: 'RAMADAN',
    title: 'Le jeûne pendant\nle Ramadan',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Conseils pratiques et repères éducatifs pour vivre le mois de Ramadan en période de règles, avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pendant les règles, le jeûne suspendu',
      'Vivre la spiritualité autrement',
      'Noter ses jours pour le rattrapage',
      'À retenir',
    ],
    section1Body1: 'Pendant les règles, le jeûne n’est pas requis : cette période place la femme dans un état où plusieurs actes d’adoration, dont le jeûne, sont temporairement suspendus. Cette suspension est reconnue comme une facilité, et non comme une interdiction ou une sanction.',
    section1Body2: 'Suspendre le jeûne pendant les règles ne signifie pas s’éloigner de sa pratique religieuse. Il est simplement mis en pause pour une durée limitée, puis repris normalement dès la fin des règles, sans qu’aucun acte de foi ne soit perdu. Les jours non jeûnés seront rattrapés plus tard (qadaa), en dehors du Ramadan.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Cette pause peut aussi être vécue comme un moment différent du mois, où la spiritualité continue de s’exprimer autrement, sans jeûne.',
    note1Title: 'À noter',
    note1Text: 'Cette situation ne doit pas être vécue avec culpabilité : elle fait partie du cycle naturel du corps et est prise en compte par la tradition religieuse elle-même.',
    section2Body: 'Ne pas jeûner ne signifie pas être coupée du mois de Ramadan. De nombreuses formes de spiritualité restent accessibles et permettent de continuer à vivre pleinement cette période.',
    spiritualActs: [
      'Dhikr (évocation de Dieu)',
      'Du’a (invocations)',
      'Écoute de contenus religieux',
      'Lecture de contenus éducatifs',
      'Charité et gestes de bienveillance',
      'Aider à préparer l’iftar',
      'Temps de réflexion personnelle',
      'Maintenir une routine spirituelle',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Ces gestes, même simples, permettent de rester pleinement connectée à l’esprit du mois, quelle que soit la situation.',
    section3Body: 'Garder une trace des jours de règles pendant le Ramadan facilite ensuite le calcul du nombre de jours à rattraper (qadaa), et évite d’avoir à s’en souvenir de mémoire une fois le mois terminé.',
    trackingTips: [
      'Noter la date de chaque jour non jeûné au fur et à mesure',
      'Utiliser un calendrier, une application ou un carnet dédié',
      'Faire un point rapide en fin de mois pour vérifier le total',
    ],
    visualTitle: 'Un suivi simplifié',
    visualText: 'AWA peut t’aider à suivre ton cycle au fil du Ramadan, pour retrouver facilement ces informations plus tard.',
    note2Title: 'À noter',
    note2Text: 'Les modalités exactes du rattrapage (délai, situations particulières comme la grossesse ou l’allaitement) peuvent varier selon les écoles juridiques. Pour toute situation spécifique ou complexe, l’avis d’un savant qualifié reste la référence.',
    tip3Title: 'Bon à savoir',
    tip3Text: 'Le jeûne suspendu pendant les règles est une facilité reconnue, non une rupture avec sa pratique religieuse. Vivre cette période autrement, garder une trace de ses jours, et demander conseil en cas de doute permettent de traverser le Ramadan avec sérénité.',
    shareMessage: 'Le jeûne pendant le Ramadan — AWA',
  },
  en: {
    badge: 'RAMADAN',
    title: 'Fasting during\nRamadan',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Practical tips and educational pointers for living through the month of Ramadan while on your period, with serenity.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Fasting suspended during your period',
      'Experiencing spirituality differently',
      'Keeping track of days for make-up fasting',
      'Key takeaways',
    ],
    section1Body1: 'During your period, fasting is not required: this time places a woman in a state in which several acts of worship, including fasting, are temporarily suspended. This suspension is recognized as a relief, not as a prohibition or a punishment.',
    section1Body2: 'Suspending the fast during your period does not mean stepping away from your religious practice. It is simply paused for a limited time, then resumed normally once your period ends, without any act of faith being lost. The days not fasted will be made up later (qadaa), outside of Ramadan.',
    tip1Title: 'Good to know',
    tip1Text: 'This pause can also be experienced as a different kind of time within the month, where spirituality continues to express itself in other ways, without fasting.',
    note1Title: 'Please note',
    note1Text: 'This situation should not be experienced with guilt: it is part of the body’s natural cycle and is accounted for by religious tradition itself.',
    section2Body: 'Not fasting does not mean being cut off from the month of Ramadan. Many forms of spirituality remain accessible and allow you to continue fully experiencing this time.',
    spiritualActs: [
      'Dhikr (remembrance of God)',
      'Du’a (supplications)',
      'Listening to religious content',
      'Reading educational content',
      'Charity and acts of kindness',
      'Helping prepare iftar',
      'Time for personal reflection',
      'Maintaining a spiritual routine',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'These small gestures, even simple ones, help you stay fully connected to the spirit of the month, whatever your situation.',
    section3Body: 'Keeping track of your period days during Ramadan makes it easier afterward to calculate the number of days to make up (qadaa), and avoids having to rely on memory once the month is over.',
    trackingTips: [
      'Note the date of each day not fasted as you go',
      'Use a calendar, an app, or a dedicated notebook',
      'Do a quick check at the end of the month to verify the total',
    ],
    visualTitle: 'Simplified tracking',
    visualText: 'AWA can help you track your cycle throughout Ramadan, so you can easily find this information again later.',
    note2Title: 'Please note',
    note2Text: 'The exact terms of making up missed days (timing, special situations such as pregnancy or breastfeeding) can vary according to the school of jurisprudence. For any specific or complex situation, the opinion of a qualified scholar remains the reference.',
    tip3Title: 'Good to know',
    tip3Text: 'Fasting suspended during your period is a recognized relief, not a break from your religious practice. Living through this time differently, keeping track of your days, and asking for guidance when in doubt all help you get through Ramadan with serenity.',
    shareMessage: 'Fasting during Ramadan — AWA',
  },
  es: {
    badge: 'RAMADÁN',
    title: 'El ayuno durante\nel Ramadán',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Consejos prácticos y referencias educativas para vivir el mes de Ramadán durante la menstruación, con serenidad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Durante la menstruación, el ayuno suspendido',
      'Vivir la espiritualidad de otra manera',
      'Anotar tus días para la recuperación',
      'Para recordar',
    ],
    section1Body1: 'Durante la menstruación, el ayuno no es obligatorio: este periodo sitúa a la mujer en un estado en el que varios actos de adoración, entre ellos el ayuno, quedan temporalmente suspendidos. Esta suspensión se reconoce como una facilidad, y no como una prohibición o una sanción.',
    section1Body2: 'Suspender el ayuno durante la menstruación no significa alejarse de la propia práctica religiosa. Simplemente se pone en pausa durante un tiempo limitado, y luego se reanuda con normalidad en cuanto termina la menstruación, sin que se pierda ningún acto de fe. Los días no ayunados se recuperarán más tarde (qadaa), fuera del Ramadán.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Esta pausa también puede vivirse como un momento diferente del mes, en el que la espiritualidad sigue expresándose de otra manera, sin ayuno.',
    note1Title: 'Para tener en cuenta',
    note1Text: 'Esta situación no debe vivirse con culpa: forma parte del ciclo natural del cuerpo y está contemplada por la propia tradición religiosa.',
    section2Body: 'No ayunar no significa estar desconectada del mes de Ramadán. Muchas formas de espiritualidad siguen siendo accesibles y permiten seguir viviendo plenamente este periodo.',
    spiritualActs: [
      'Dhikr (evocación de Dios)',
      'Dua (invocaciones)',
      'Escuchar contenidos religiosos',
      'Leer contenidos educativos',
      'Caridad y gestos de bondad',
      'Ayudar a preparar el iftar',
      'Tiempo de reflexión personal',
      'Mantener una rutina espiritual',
    ],
    tip2Title: 'Bueno saberlo',
    tip2Text: 'Estos gestos, aunque sean sencillos, permiten seguir plenamente conectada con el espíritu del mes, sea cual sea la situación.',
    section3Body: 'Llevar un registro de los días de menstruación durante el Ramadán facilita después el cálculo del número de días por recuperar (qadaa), y evita tener que recordarlo de memoria una vez terminado el mes.',
    trackingTips: [
      'Anotar la fecha de cada día no ayunado a medida que avanza',
      'Usar un calendario, una aplicación o un cuaderno dedicado',
      'Hacer un repaso rápido a final de mes para comprobar el total',
    ],
    visualTitle: 'Un seguimiento simplificado',
    visualText: 'AWA puede ayudarte a seguir tu ciclo a lo largo del Ramadán, para encontrar fácilmente esta información más tarde.',
    note2Title: 'Para tener en cuenta',
    note2Text: 'Las modalidades exactas de la recuperación (plazo, situaciones particulares como el embarazo o la lactancia) pueden variar según las escuelas jurídicas. Para cualquier situación específica o compleja, la opinión de un erudito cualificado sigue siendo la referencia.',
    tip3Title: 'Bueno saberlo',
    tip3Text: 'El ayuno suspendido durante la menstruación es una facilidad reconocida, no una ruptura con la propia práctica religiosa. Vivir este periodo de otra manera, llevar un registro de tus días y pedir consejo en caso de duda permiten atravesar el Ramadán con serenidad.',
    shareMessage: 'El ayuno durante el Ramadán — AWA',
  },
  it: {
    badge: 'RAMADAN',
    title: 'Il digiuno durante\nil Ramadan',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Consigli pratici e spunti educativi per vivere con serenità il mese di Ramadan durante il periodo mestruale.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il digiuno sospeso durante il periodo mestruale',
      'Vivere la spiritualità in modo diverso',
      'Tenere traccia dei giorni da recuperare',
      'Punti chiave',
    ],
    section1Body1: 'Durante il periodo mestruale il digiuno non è obbligatorio: questo momento pone la donna in uno stato in cui diversi atti di culto, tra cui il digiuno, sono temporaneamente sospesi. Questa sospensione è riconosciuta come un’agevolazione, non come un divieto né una punizione.',
    section1Body2: 'Sospendere il digiuno durante il periodo mestruale non significa allontanarsi dalla propria pratica religiosa. È semplicemente messa in pausa per un tempo limitato, poi ripresa normalmente alla fine del periodo mestruale, senza che alcun atto di fede vada perso. I giorni non digiunati saranno recuperati in seguito (qadaa), al di fuori del Ramadan.',
    tip1Title: 'Da sapere',
    tip1Text: 'Questa pausa si può vivere anche come un tempo diverso all’interno del mese, in cui la spiritualità continua a esprimersi in altri modi, senza il digiuno.',
    note1Title: 'Attenzione',
    note1Text: 'Questa situazione non va vissuta con senso di colpa: fa parte del ciclo naturale del corpo ed è presa in considerazione dalla stessa tradizione religiosa.',
    section2Body: 'Non digiunare non significa essere tagliate fuori dal mese di Ramadan. Molte forme di spiritualità restano accessibili e permettono di continuare a vivere pienamente questo tempo.',
    spiritualActs: [
      'Dhikr (ricordo di Dio)',
      'Du’a (suppliche)',
      'Ascolto di contenuti religiosi',
      'Lettura di contenuti educativi',
      'Carità e gesti di gentilezza',
      'Aiutare a preparare l’iftar',
      'Tempo per la riflessione personale',
      'Mantenere una routine spirituale',
    ],
    tip2Title: 'Da sapere',
    tip2Text: 'Questi piccoli gesti, anche semplici, ti aiutano a restare pienamente in sintonia con lo spirito del mese, qualunque sia la tua situazione.',
    section3Body: 'Tenere traccia dei giorni del periodo mestruale durante il Ramadan rende più facile, poi, calcolare il numero di giorni da recuperare (qadaa) e evita di dover contare sulla memoria una volta finito il mese.',
    trackingTips: [
      'Annota la data di ogni giorno non digiunato man mano che passa',
      'Usa un calendario, un’app o un quaderno dedicato',
      'Fai un rapido controllo a fine mese per verificare il totale',
    ],
    visualTitle: 'Un monitoraggio semplificato',
    visualText: 'AWA può aiutarti a seguire il tuo ciclo per tutto il Ramadan, così potrai ritrovare facilmente queste informazioni in seguito.',
    note2Title: 'Attenzione',
    note2Text: 'Le modalità esatte per recuperare i giorni persi (tempi, situazioni particolari come gravidanza o allattamento) possono variare secondo la scuola giuridica. Per qualsiasi situazione specifica o complessa, il parere di uno studioso qualificato resta il riferimento.',
    tip3Title: 'Da sapere',
    tip3Text: 'Il digiuno sospeso durante il periodo mestruale è un’agevolazione riconosciuta, non un’interruzione della tua pratica religiosa. Vivere questo momento in modo diverso, tenere traccia dei tuoi giorni e chiedere un parere in caso di dubbio ti aiutano ad attraversare il Ramadan con serenità.',
    shareMessage: 'Il digiuno durante il Ramadan — AWA',
  },
  tr: {
    badge: 'RAMAZAN',
    title: 'Ramazan’da\noruç',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adetli olduğun dönemde Ramazan ayını huzurla yaşamak için pratik ipuçları ve eğitici bilgiler.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak doğrulanmalıdır. AWA fetva ya da kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Adet döneminde askıya alınan oruç',
      'Maneviyatı farklı yaşamak',
      'Kaza orucu için günleri takip etmek',
      'Akılda tutulacaklar',
    ],
    section1Body1: 'Adet döneminde oruç tutmak gerekmez: bu dönem kadını, oruç dâhil birçok ibadetin geçici olarak askıya alındığı bir hâle sokar. Bu askıya alma bir yasak ya da ceza olarak değil, bir kolaylık olarak kabul edilir.',
    section1Body2: 'Adet döneminde orucun askıya alınması, dinî pratikten uzaklaşmak anlamına gelmez. Yalnızca sınırlı bir süre için ara verilir, adetin bittiğinde normal şekilde yeniden sürdürülür ve hiçbir iman eylemi kaybolmaz. Tutulmayan günler daha sonra, Ramazan dışında kaza edilir (kaza).',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bu ara, ay içinde farklı türden bir zaman olarak da yaşanabilir; maneviyat oruç olmadan başka şekillerde ifade edilmeye devam eder.',
    note1Title: 'Dikkat',
    note1Text: 'Bu durum suçluluk duyarak yaşanmamalıdır: bedenin doğal döngüsünün bir parçasıdır ve dinî gelenek tarafından da dikkate alınmıştır.',
    section2Body: 'Oruç tutmamak, Ramazan ayından kopmak anlamına gelmez. Pek çok manevi uygulama erişilebilir kalır ve bu zamanı tam anlamıyla yaşamaya devam etmeni sağlar.',
    spiritualActs: [
      'Zikir (Allah’ı anma)',
      'Dua (yakarışlar)',
      'Dinî içerik dinlemek',
      'Eğitici içerik okumak',
      'Sadaka ve iyilik davranışları',
      'İftar hazırlığına yardım etmek',
      'Kişisel düşünme zamanı',
      'Manevi bir rutini sürdürmek',
    ],
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Bu küçük davranışlar, basit olsalar bile, durumun ne olursa olsun ayın ruhuyla tam bağlantıda kalmana yardımcı olur.',
    section3Body: 'Ramazan boyunca adet günlerini takip etmek, sonrasında kaza edilecek gün sayısını hesaplamayı kolaylaştırır ve ay bittikten sonra hafızana güvenmek zorunda kalmanı önler.',
    trackingTips: [
      'Oruç tutulmayan her günün tarihini sırasıyla not et',
      'Bir takvim, bir uygulama ya da özel bir defter kullan',
      'Ay sonunda toplamı doğrulamak için kısa bir kontrol yap',
    ],
    visualTitle: 'Kolaylaşan takip',
    visualText: 'AWA, Ramazan boyunca döngünü takip etmene yardımcı olabilir; böylece bu bilgilere daha sonra kolayca ulaşabilirsin.',
    note2Title: 'Dikkat',
    note2Text: 'Tutulamayan günlerin kaza edilmesinin kesin koşulları (zamanlama, gebelik ya da emzirme gibi özel durumlar) fıkıh mezhebine göre değişebilir. Özel ya da karmaşık her durumda yetkin bir âlimin görüşü başvuru kaynağı olmaya devam eder.',
    tip3Title: 'Bilmekte fayda var',
    tip3Text: 'Adet döneminde askıya alınan oruç, kabul edilmiş bir kolaylıktır; dinî pratikten bir kopuş değildir. Bu zamanı farklı yaşamak, günlerini takip etmek ve kuşku duyduğunda rehberlik istemek, Ramazan’ı huzurla geçirmene yardımcı olur.',
    shareMessage: 'Ramazan’da oruç — AWA',
  },
  ru: {
    badge: 'РАМАДАН',
    title: 'Пост в течение\nРамадана',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Практические советы и образовательные ориентиры, которые помогут спокойно прожить месяц Рамадан во время месячных.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у квалифицированных учёных. AWA не выносит фетв и не даёт индивидуальных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Пост приостанавливается во время месячных',
      'Иное проживание духовности',
      'Учёт дней для восполнения поста',
      'Главные выводы',
    ],
    section1Body1: 'Во время месячных соблюдать пост не требуется: в этот период женщина находится в состоянии, при котором несколько видов поклонения, включая пост, временно приостанавливаются. Это приостановление признаётся облегчением, а не запретом или наказанием.',
    section1Body2: 'Приостановление поста во время месячных не означает отхода от религиозной практики. Она лишь приостанавливается на ограниченное время, а затем возобновляется в обычном порядке после окончания месячных, и ни один акт веры при этом не теряется. Дни, в которые вы не постились, будут восполнены позже (каза), вне Рамадана.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Эту паузу можно прожить и как особое время внутри месяца, когда духовность продолжает проявляться иными способами — без поста.',
    note1Title: 'Обратите внимание',
    note1Text: 'Не нужно переживать это с чувством вины: это часть естественного цикла организма, и сама религиозная традиция это учитывает.',
    section2Body: 'Не поститься не значит быть отрезанной от месяца Рамадан. Многие формы духовной практики остаются доступными и позволяют полноценно проживать это время.',
    spiritualActs: [
      'Зикр (поминание Бога)',
      'Дуа (мольбы)',
      'Слушать религиозные материалы',
      'Читать образовательные материалы',
      'Милостыня и добрые дела',
      'Помогать с приготовлением ифтара',
      'Время для личных размышлений',
      'Поддерживать духовный распорядок',
    ],
    tip2Title: 'Полезно знать',
    tip2Text: 'Эти небольшие, пусть и простые, действия помогают оставаться полноценно связанной с духом месяца, в какой бы ситуации вы ни находились.',
    section3Body: 'Если вы отмечаете дни месячных во время Рамадана, позже легче подсчитать, сколько дней нужно восполнить (каза), и не приходится полагаться на память после окончания месяца.',
    trackingTips: [
      'Отмечайте дату каждого дня без поста сразу же',
      'Используйте календарь, приложение или отдельный блокнот',
      'В конце месяца быстро проверьте итоговое количество',
    ],
    visualTitle: 'Упрощённый учёт',
    visualText: 'AWA поможет вам отслеживать цикл на протяжении Рамадана, чтобы вы могли легко найти эту информацию позже.',
    note2Title: 'Обратите внимание',
    note2Text: 'Точные условия восполнения пропущенных дней (сроки, особые ситуации, например беременность или грудное вскармливание) могут различаться в зависимости от школы права. В любой особой или сложной ситуации ориентиром остаётся мнение квалифицированного учёного.',
    tip3Title: 'Полезно знать',
    tip3Text: 'Пост, приостановленный во время месячных, — это признанное облегчение, а не разрыв с религиозной практикой. Иначе прожить это время, вести учёт дней и просить наставления в случае сомнений — всё это помогает спокойно пройти Рамадан.',
    shareMessage: 'Пост в течение Рамадана — AWA',
  },
  de: {
    badge: 'RAMADAN',
    title: 'Fasten im\nRamadan',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Praktische Tipps und bildende Hinweise, um den Monat Ramadan während deiner Periode gelassen zu erleben.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt ist rein bildend. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA erteilt keine Fatwas und keine persönlichen religiösen Urteile.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Fasten während der Periode ausgesetzt',
      'Spiritualität anders erleben',
      'Die Tage für das Nachfasten im Blick behalten',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Während deiner Periode ist das Fasten nicht verpflichtend: In dieser Zeit sind mehrere gottesdienstliche Handlungen, darunter das Fasten, vorübergehend ausgesetzt. Diese Aussetzung gilt als Erleichterung, nicht als Verbot oder Strafe.',
    section1Body2: 'Das Fasten während der Periode auszusetzen bedeutet nicht, sich von deiner religiösen Praxis zu entfernen. Sie ruht lediglich für eine begrenzte Zeit und wird nach dem Ende deiner Periode normal wieder aufgenommen, ohne dass eine Glaubenshandlung verloren geht. Die nicht gefasteten Tage werden später außerhalb des Ramadan nachgeholt (Qada).',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Diese Pause kann auch als eine andere Art von Zeit im Monat erlebt werden, in der sich Spiritualität auf andere Weise ausdrückt, ohne zu fasten.',
    note1Title: 'Bitte beachten',
    note1Text: 'Diese Situation sollte nicht mit Schuldgefühlen erlebt werden: Sie gehört zum natürlichen Zyklus des Körpers und wird von der religiösen Tradition selbst berücksichtigt.',
    section2Body: 'Nicht zu fasten bedeutet nicht, vom Monat Ramadan abgeschnitten zu sein. Viele Formen der Spiritualität bleiben zugänglich und erlauben dir, diese Zeit weiterhin voll zu erleben.',
    spiritualActs: [
      'Dhikr (Gottesgedenken)',
      'Du’a (Bittgebete)',
      'Religiöse Inhalte anhören',
      'Bildende Inhalte lesen',
      'Almosen und gute Taten',
      'Beim Zubereiten des Iftar helfen',
      'Zeit für persönliche Besinnung',
      'Eine spirituelle Routine beibehalten',
    ],
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Diese kleinen Gesten, auch einfache, helfen dir, dem Geist des Monats verbunden zu bleiben, was auch immer deine Situation ist.',
    section3Body: 'Wenn du deine Periodentage im Ramadan festhältst, kannst du danach leichter die Zahl der nachzuholenden Tage (Qada) berechnen und musst dich nach Ende des Monats nicht auf dein Gedächtnis verlassen.',
    trackingTips: [
      'Notiere das Datum jedes nicht gefasteten Tages direkt',
      'Nutze einen Kalender, eine App oder ein eigenes Notizbuch',
      'Mach am Ende des Monats einen kurzen Check, um die Summe zu überprüfen',
    ],
    visualTitle: 'Einfaches Nachverfolgen',
    visualText: 'AWA kann dir helfen, deinen Zyklus den ganzen Ramadan über festzuhalten, sodass du diese Informationen später leicht wiederfindest.',
    note2Title: 'Bitte beachten',
    note2Text: 'Die genauen Modalitäten des Nachholens versäumter Tage (Zeitpunkt, besondere Situationen wie Schwangerschaft oder Stillen) können je nach Rechtsschule variieren. Für jede besondere oder komplexe Situation bleibt die Auskunft einer qualifizierten Gelehrten oder eines qualifizierten Gelehrten maßgeblich.',
    tip3Title: 'Gut zu wissen',
    tip3Text: 'Das Fasten während der Periode auszusetzen ist eine anerkannte Erleichterung, kein Bruch mit deiner religiösen Praxis. Diese Zeit anders zu erleben, deine Tage festzuhalten und bei Zweifeln um Rat zu fragen – all das hilft dir, den Ramadan gelassen zu durchleben.',
    shareMessage: 'Fasten im Ramadan — AWA',
  },
  zh: {
      badge: '斋月',
      title: '斋月期间的\n斋戒',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '为你提供实用的建议和知识性的提示，帮助你在月经期间，平静地度过斋月。',
      disclaimerTitle: '重要信息',
      disclaimerText: '本内容纯属知识性介绍。宗教方面的问题应由具备资质的学者来确认。AWA 不发布法特瓦（fatwa），也不提供个人化的宗教裁断。',
      contentsTitle: '本文内容',
      topics: [
        '月经期间暂停斋戒',
        '以不同的方式体验灵修',
        '记录需要补斋的天数',
        '要点回顾',
      ],
      section1Body1: '月经期间无需斋戒：这段时间会让女性处于一种状态，其间包括斋戒在内的若干功修会被暂时免除。这种免除被视为一种宽免，既不是禁令，也不是惩罚。',
      section1Body2: '月经期间暂停斋戒，并不意味着远离你的宗教实践。它只是在有限的时间内暂停，月经结束后便正常恢复，任何一次信仰上的功修都不会因此丧失。未斋戒的天数将在斋月之外择日补斋（Qadaa）。',
      tip1Title: '小贴士',
      tip1Text: '这段暂停也可以被看作这个月中另一种不同的时光，灵修依然可以通过其他方式延续，而不必斋戒。',
      note1Title: '请注意',
      note1Text: '不必带着愧疚去度过这段时间：这是身体自然周期的一部分，宗教传统本身也已将其考虑在内。',
      section2Body: '不斋戒并不意味着与斋月隔绝。许多灵修的方式依然可以进行，让你继续完整地体验这段时光。',
      spiritualActs: [
        '赞念（Dhikr，记念真主）',
        '祈祷（Du’a）',
        '聆听宗教内容',
        '阅读知识性内容',
        '施舍与善行',
        '帮忙准备开斋饭',
        '留出时间自我反思',
        '保持灵修的日常习惯',
      ],
      tip2Title: '小贴士',
      tip2Text: '这些小小的举动，哪怕很简单，也能让你无论处于什么状态，都与斋月的精神保持紧密联系。',
      section3Body: '在斋月期间记录你的月经天数，之后计算需要补斋（Qadaa）的天数会更容易，也不必在斋月结束后只凭记忆。',
      trackingTips: [
        '随时记下每一天未斋戒的日期',
        '使用日历、应用或专门的笔记本',
        '月底快速核对一遍，确认总天数',
      ],
      visualTitle: '更简便的记录',
      visualText: 'AWA 可以帮助你在整个斋月期间记录你的周期，方便你之后轻松找回这些信息。',
      note2Title: '请注意',
      note2Text: '补斋的具体细则（时间、怀孕或哺乳等特殊情况）可能因法学学派而异。对于任何特殊或复杂的情况，仍以具备资质的学者的意见为准。',
      tip3Title: '小贴士',
      tip3Text: '月经期间暂停斋戒是一种被认可的宽免，并不是与宗教实践的中断。以不同的方式度过这段时间、记录好自己的天数，并在有疑问时寻求指导，都有助于你平静地度过斋月。',
      shareMessage: '斋月期间的斋戒 — AWA',
    },
  id: {
    badge: 'RAMADAN',
    title: 'Puasa di bulan\nRamadan',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tips praktis dan petunjuk edukatif untuk menjalani bulan Ramadan saat kamu sedang haid, dengan hati yang tenang.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang berkompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Puasa ditangguhkan saat haid',
      'Menjalani spiritualitas dengan cara yang berbeda',
      'Mencatat hari-hari untuk puasa qada',
      'Poin penting',
    ],
    section1Body1: 'Saat haid, puasa tidak diwajibkan: masa ini menempatkan seorang perempuan dalam keadaan yang membuat beberapa ibadah, termasuk puasa, ditangguhkan untuk sementara. Penangguhan ini dipahami sebagai keringanan, bukan larangan atau hukuman.',
    section1Body2: 'Menangguhkan puasa saat haid tidak berarti menjauh dari praktik keagamaanmu. Ibadah ini hanya dijeda untuk waktu yang terbatas, lalu dilanjutkan seperti biasa setelah haid selesai, tanpa ada amal yang hilang. Hari-hari yang tidak berpuasa akan diganti nanti (qada), di luar bulan Ramadan.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Jeda ini juga bisa dijalani sebagai waktu yang berbeda di dalam bulan Ramadan, ketika spiritualitas tetap bisa diungkapkan dengan cara lain, tanpa berpuasa.',
    note1Title: 'Harap diperhatikan',
    note1Text: 'Keadaan ini tidak perlu dijalani dengan rasa bersalah: ia bagian dari siklus alami tubuh dan sudah diperhitungkan oleh tradisi keagamaan itu sendiri.',
    section2Body: 'Tidak berpuasa tidak berarti terpisah dari bulan Ramadan. Banyak bentuk spiritualitas yang tetap bisa kamu jalani, sehingga kamu tetap dapat menghayati waktu ini sepenuhnya.',
    spiritualActs: [
      'Zikir (mengingat Allah)',
      'Doa (permohonan)',
      'Mendengarkan konten keagamaan',
      'Membaca konten edukatif',
      'Bersedekah dan berbuat baik',
      'Membantu menyiapkan hidangan berbuka',
      'Waktu untuk merenung secara pribadi',
      'Menjaga rutinitas spiritual',
    ],
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Tindakan-tindakan kecil ini, sesederhana apa pun, membantumu tetap terhubung dengan semangat bulan Ramadan, apa pun keadaanmu.',
    section3Body: 'Mencatat hari-hari haidmu selama Ramadan memudahkanmu menghitung jumlah hari yang harus diganti (qada) setelahnya, dan kamu tidak perlu mengandalkan ingatan begitu bulan itu berakhir.',
    trackingTips: [
      'Catat tanggal setiap hari yang tidak berpuasa selagi berjalan',
      'Gunakan kalender, aplikasi, atau buku catatan khusus',
      'Lakukan pengecekan singkat di akhir bulan untuk memastikan totalnya',
    ],
    visualTitle: 'Pencatatan yang lebih mudah',
    visualText: 'AWA bisa membantumu memantau siklusmu sepanjang Ramadan, sehingga kamu mudah menemukan kembali informasi ini nanti.',
    note2Title: 'Harap diperhatikan',
    note2Text: 'Ketentuan pasti dalam mengganti hari yang terlewat (waktu pelaksanaan, keadaan khusus seperti kehamilan atau menyusui) bisa berbeda menurut mazhab fikih. Untuk keadaan yang khusus atau rumit, pendapat ulama yang berkompeten tetap menjadi rujukan.',
    tip3Title: 'Perlu diketahui',
    tip3Text: 'Puasa yang ditangguhkan saat haid adalah keringanan yang diakui, bukan terputusnya praktik keagamaanmu. Menjalani masa ini dengan cara berbeda, mencatat hari-harimu, dan meminta bimbingan saat ragu, semuanya membantumu melewati Ramadan dengan tenang.',
    shareMessage: 'Puasa di bulan Ramadan — AWA',
  },
  hi: {
    badge: 'रमज़ान',
    title: 'रमज़ान में\nरोज़ा',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा की गई सामग्री',
    intro: 'पीरियड के दौरान रमज़ान के महीने को सुकून से बिताने के लिए कुछ व्यावहारिक सुझाव और जानकारी भरी बातें।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह सामग्री सिर्फ़ जानकारी के लिए है। धार्मिक सवालों की पुष्टि योग्य उलमा से करानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पीरियड में रोज़ा रुक जाना',
      'रूहानियत को अलग ढंग से जीना',
      'क़ज़ा रोज़ों के लिए दिनों का हिसाब रखना',
      'मुख्य बातें',
    ],
    section1Body1: 'पीरियड के दौरान रोज़ा रखना ज़रूरी नहीं है: यह समय औरत को ऐसी हालत में रखता है जिसमें रोज़े समेत कई इबादतें कुछ समय के लिए रुक जाती हैं। इस रुकावट को एक रियायत माना जाता है, मनाही या सज़ा नहीं।',
    section1Body2: 'पीरियड में रोज़ा रुक जाने का मतलब अपनी धार्मिक प्रैक्टिस से दूर हो जाना नहीं है। वह बस कुछ समय के लिए थमी रहती है, फिर पीरियड खत्म होते ही सामान्य रूप से दोबारा शुरू हो जाती है, और ईमान का कोई अमल ज़ाया नहीं होता। छूटे हुए रोज़ों की क़ज़ा बाद में, रमज़ान के बाहर की जाएगी।',
    tip1Title: 'जानने लायक',
    tip1Text: 'इस ठहराव को महीने के भीतर एक अलग तरह के समय के रूप में भी जिया जा सकता है, जहाँ रोज़े के बिना भी रूहानियत दूसरे तरीकों से ज़ाहिर होती रहती है।',
    note1Title: 'ध्यान दें',
    note1Text: 'इस स्थिति को अपराध-बोध के साथ नहीं जीना चाहिए: यह शरीर के प्राकृतिक चक्र का हिस्सा है और धार्मिक परंपरा में खुद इसका हिसाब रखा गया है।',
    section2Body: 'रोज़ा न रख पाने का मतलब रमज़ान के महीने से कट जाना नहीं है। रूहानियत के कई रूप अब भी आपके लिए खुले हैं और आप इस समय को पूरी तरह महसूस करती रह सकती हैं।',
    spiritualActs: [
      'ज़िक्र (अल्लाह को याद करना)',
      'दुआएँ',
      'धार्मिक बातें सुनना',
      'जानकारी भरी सामग्री पढ़ना',
      'सदक़ा और नेकी के काम',
      'इफ़्तार की तैयारी में हाथ बँटाना',
      'खुद के चिंतन के लिए समय',
      'रूहानी दिनचर्या बनाए रखना',
    ],
    tip2Title: 'जानने लायक',
    tip2Text: 'ये छोटे-छोटे काम, भले ही साधारण हों, आपकी हालत जो भी हो, आपको इस महीने की रूह से पूरी तरह जोड़े रखने में मदद करते हैं।',
    section3Body: 'रमज़ान के दौरान अपने पीरियड के दिनों का हिसाब रखने से बाद में क़ज़ा के दिन गिनना आसान हो जाता है, और महीना खत्म होने पर याददाश्त के भरोसे नहीं रहना पड़ता।',
    trackingTips: [
      'जिस दिन रोज़ा नहीं रखा, उसकी तारीख़ साथ-साथ नोट करती जाएँ',
      'कैलेंडर, ऐप या अलग से एक कॉपी का इस्तेमाल करें',
      'महीने के अंत में कुल दिनों को जाँचने के लिए एक बार जल्दी से देख लें',
    ],
    visualTitle: 'आसान ट्रैकिंग',
    visualText: 'AWA पूरे रमज़ान में आपके चक्र को ट्रैक करने में मदद कर सकता है, ताकि आप यह जानकारी बाद में आसानी से दोबारा देख सकें।',
    note2Title: 'ध्यान दें',
    note2Text: 'छूटे हुए दिनों की क़ज़ा के सटीक तरीके (समय, और गर्भावस्था या स्तनपान जैसी ख़ास हालतें) फ़िक़्ही मत (मदहब) के अनुसार अलग हो सकते हैं। किसी भी ख़ास या पेचीदा हालत में योग्य आलिम की राय ही सबसे भरोसेमंद सहारा है।',
    tip3Title: 'जानने लायक',
    tip3Text: 'पीरियड में रोज़े का रुक जाना एक मान्य रियायत है, धार्मिक प्रैक्टिस से अलगाव नहीं। इस समय को अलग ढंग से जीना, अपने दिनों का हिसाब रखना और शक होने पर रहनुमाई माँगना, ये सब रमज़ान को सुकून से गुज़ारने में मदद करते हैं।',
    shareMessage: 'रमज़ान में रोज़ा — AWA',
  },
  sq: {
    badge: 'RAMAZANI',
    title: 'Agjërimi gjatë\nRamazanit',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Këshilla praktike dhe pika edukative për ta jetuar muajin e Ramazanit me qetësi gjatë menstruacioneve.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhet të vërtetohen nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Agjërimi i pezulluar gjatë menstruacioneve',
      'Ta jetosh shpirtërisht ndryshe',
      'Mbajtja e ditëve për kazanë e agjërimit',
      'Pikat kryesore',
    ],
    section1Body1: 'Gjatë menstruacioneve, agjërimi nuk është i detyrueshëm: kjo kohë e vë gruan në një gjendje në të cilën disa vepra adhurimi, përfshirë agjërimin, pezullohen përkohësisht. Ky pezullim njihet si lehtësim, jo si ndalim apo ndëshkim.',
    section1Body2: 'Pezullimi i agjërimit gjatë menstruacioneve nuk do të thotë të largohesh nga praktika jote fetare. Ajo thjesht ndalet për një kohë të kufizuar, pastaj rifillon normalisht kur mbarojnë menstruacionet, pa humbur asnjë akt besimi. Ditët e pa agjëruara do të kompensohen më vonë (kaza), jashtë Ramazanit.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Këtë pauzë mund ta jetosh edhe si një kohë të një lloji tjetër brenda muajit, ku shpirtërorja vazhdon të shprehet në mënyra të tjera, pa agjërim.',
    note1Title: 'Vëre re',
    note1Text: 'Kjo situatë nuk duhet jetuar me ndjenjë faji: ajo është pjesë e ciklit natyror të trupit dhe vetë tradita fetare e merr parasysh.',
    section2Body: 'Të mos agjërosh nuk do të thotë të jesh e shkëputur nga muaji i Ramazanit. Shumë forma shpirtërore mbeten të arritshme dhe të lejojnë ta jetosh plotësisht këtë kohë.',
    spiritualActs: [
      'Dhikri (përmendja e Allahut)',
      'Dua (lutjet)',
      'Dëgjimi i përmbajtjeve fetare',
      'Leximi i përmbajtjeve edukative',
      'Bamirësia dhe veprat e mira',
      'Ndihma në përgatitjen e iftarit',
      'Kohë për reflektim personal',
      'Ruajtja e një rutine shpirtërore',
    ],
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Këto gjeste të vogla, edhe kur janë të thjeshta, të ndihmojnë të mbetesh plotësisht e lidhur me frymën e muajit, sido që të jetë situata jote.',
    section3Body: 'Mbajtja e ditëve të menstruacioneve gjatë Ramazanit e bën më të lehtë më pas llogaritjen e numrit të ditëve që duhen kompensuar (kaza) dhe shmang nevojën të mbështetesh te kujtesa kur të mbarojë muaji.',
    trackingTips: [
      'Shëno datën e çdo dite të pa agjëruar sa herë ndodh',
      'Përdor një kalendar, një aplikacion ose një fletore të dedikuar',
      'Bëj një kontroll të shpejtë në fund të muajit për të verifikuar totalin',
    ],
    visualTitle: 'Ndjekje e thjeshtuar',
    visualText: 'AWA mund të të ndihmojë të ndjekësh ciklin tënd gjatë gjithë Ramazanit, që këtë informacion ta gjesh lehtë më vonë.',
    note2Title: 'Vëre re',
    note2Text: 'Mënyra e saktë e kompensimit të ditëve që nuk u agjëruan (koha, raste të posaçme si shtatzënia ose ushqyerja me gji) mund të ndryshojë sipas medhhebit. Për çdo rast specifik ose të ndërlikuar, mendimi i një dijetari të kualifikuar mbetet referenca.',
    tip3Title: 'Mirë është ta dish',
    tip3Text: 'Agjërimi i pezulluar gjatë menstruacioneve është një lehtësim i njohur, jo një ndërprerje e praktikës sate fetare. Ta jetosh këtë kohë ndryshe, të mbash ditët e tua dhe të kërkosh udhëzim kur ke dyshime të ndihmon ta kalosh Ramazanin me qetësi.',
    shareMessage: 'Agjërimi gjatë Ramazanit — AWA',
  },
  ja: {
    badge: 'ラマダーン',
    title: 'ラマダーン中の\n断食',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: '生理中にラマダーンの月を穏やかに過ごすための、実用的なヒントと学びのポイントです。',
    disclaimerTitle: '重要なお知らせ',
    disclaimerText: 'このコンテンツは教育を目的としたものです。宗教に関する疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出すことはありません。',
    contentsTitle: 'この記事の内容',
    topics: [
      '生理中は断食が免除される',
      '信仰を別の形で過ごす',
      'カダーの断食のために日数を記録する',
      'ポイントのまとめ',
    ],
    section1Body1: '生理中は断食を行う必要がありません。この期間は、断食を含むいくつかの礼拝行為が一時的に免除される状態にあたります。この免除は、禁止や罰ではなく、軽減として受け止められています。',
    section1Body2: '生理中に断食をしないことは、信仰の実践から離れることを意味しません。限られた期間だけ一時的に休止し、生理が終わればふだんどおりに再開します。信仰上の行いが失われることはありません。断食できなかった日は、ラマダーンの期間外に後日埋め合わせます（カダー）。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'この休止は、月の中での別の種類の時間として過ごすこともできます。断食をしなくても、信仰は別の形で表すことができます。',
    note1Title: 'ご注意',
    note1Text: 'この状況を、罪悪感を持って過ごす必要はありません。これは体の自然な周期の一部であり、宗教的な伝統そのものにも考慮されています。',
    section2Body: '断食をしないことは、ラマダーンの月から切り離されることではありません。信仰を深めるさまざまな方法が引き続き可能で、この時間を十分に過ごすことができます。',
    spiritualActs: [
      'ズィクル（アッラーを想起すること）',
      'ドゥアー（祈願）',
      '宗教的な内容を聴く',
      '学びのための内容を読む',
      '施しや親切な行い',
      'イフタール（断食明けの食事）の準備を手伝う',
      '自分を見つめ直す時間',
      '信仰の習慣を保つ',
    ],
    tip2Title: '知っておきたいこと',
    tip2Text: 'こうした小さな行いは、ささやかなものであっても、どんな状況でもこの月の精神とつながり続ける助けになります。',
    section3Body: 'ラマダーン中の生理の日数を記録しておくと、あとでカダーの日数を計算しやすくなり、月が終わってから記憶に頼らずにすみます。',
    trackingTips: [
      '断食しなかった日の日付を、その都度書き留める',
      'カレンダーやアプリ、専用のノートを使う',
      '月の終わりに合計を簡単に確認する',
    ],
    visualTitle: 'かんたんな記録',
    visualText: 'AWAは、ラマダーンの期間を通して周期を記録する助けになります。あとから情報を簡単に見つけることができます。',
    note2Title: 'ご注意',
    note2Text: '断食できなかった日の埋め合わせの具体的な方法（時期や、妊娠中・授乳中などの特別な状況）は、法学派によって異なることがあります。特別な状況や複雑な状況については、資格のある学者の意見が基準となります。',
    tip3Title: '知っておきたいこと',
    tip3Text: '生理中に断食が免除されるのは認められた軽減であり、信仰の実践の中断ではありません。この時間を別の形で過ごすこと、日数を記録しておくこと、迷ったときは助言を求めることは、いずれもラマダーンを穏やかに過ごす助けになります。',
    shareMessage: 'ラマダーン中の断食 — AWA',
  },
  ko: {
    badge: '라마단',
    title: '라마단 기간의\n금식',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '생리 중에 라마단 달을 평온하게 보내기 위한 실용적인 팁과 교육용 안내예요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 순수하게 교육 목적이에요. 종교와 관련된 문제는 자격을 갖춘 학자의 확인을 받아야 해요. AWA는 파트와나 개인에게 맞춘 종교적 판단을 내리지 않아요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '생리 중 중단되는 금식',
      '다른 방식으로 누리는 영성',
      '카다 금식을 위해 날짜 기록하기',
      '핵심 정리',
    ],
    section1Body1: '생리 중에는 금식이 의무가 아니에요. 이 시기에는 금식을 비롯해 여러 예배 행위가 일시적으로 중단되는 상태가 돼요. 이 중단은 금지나 벌이 아니라 덜어 주는 배려로 받아들여져요.',
    section1Body2: '생리 중에 금식을 쉬는 것이 신앙 생활에서 멀어진다는 뜻은 아니에요. 한정된 기간 동안 잠시 멈추었다가 생리가 끝나면 다시 평소처럼 이어가며, 그 어떤 신앙 행위도 잃지 않아요. 금식하지 못한 날은 라마단이 아닌 때에 나중에 보충해요(카다).',
    tip1Title: '알아 두세요',
    tip1Text: '이 멈춤은 한 달 안에서 다른 결의 시간으로 보낼 수도 있어요. 금식은 하지 않지만 영성은 다른 방식으로 이어져요.',
    note1Title: '참고하세요',
    note1Text: '이 상황을 죄책감으로 겪을 필요는 없어요. 몸의 자연스러운 주기의 일부이고, 종교 전통에서도 이미 고려하고 있어요.',
    section2Body: '금식하지 않는다고 해서 라마단 달과 단절되는 것은 아니에요. 영성을 이어갈 수 있는 방법이 많이 열려 있어서 이 시간을 온전히 보낼 수 있어요.',
    spiritualActs: [
      '지크르(알라를 기억함)',
      '두아(간구)',
      '종교 콘텐츠 듣기',
      '교육용 콘텐츠 읽기',
      '자선과 선행',
      '이프타르 준비 돕기',
      '스스로를 돌아보는 시간',
      '영적인 루틴 이어가기',
    ],
    tip2Title: '알아 두세요',
    tip2Text: '이런 작은 실천은 간단하더라도 어떤 상황에서든 이 달의 정신과 이어져 있도록 도와줘요.',
    section3Body: '라마단 동안 생리한 날을 기록해 두면 나중에 보충할 일수(카다)를 계산하기 쉽고, 한 달이 끝난 뒤 기억에 의존하지 않아도 돼요.',
    trackingTips: [
      '금식하지 못한 날의 날짜를 그때그때 적어요',
      '캘린더, 앱 또는 전용 노트를 사용해요',
      '한 달이 끝나면 합계를 간단히 확인해요',
    ],
    visualTitle: '간편한 기록',
    visualText: 'AWA가 라마단 내내 주기를 기록하도록 도와줘서 나중에 이 정보를 쉽게 다시 찾을 수 있어요.',
    note2Title: '참고하세요',
    note2Text: '놓친 날을 보충하는 구체적인 방식(시기, 임신이나 모유 수유 같은 특별한 상황)은 법학파(마드합)에 따라 다를 수 있어요. 특별하거나 복잡한 상황에서는 자격을 갖춘 학자의 의견이 기준이 돼요.',
    tip3Title: '알아 두세요',
    tip3Text: '생리 중 중단되는 금식은 인정된 배려이며, 신앙 생활을 멈추는 것이 아니에요. 이 시간을 다르게 보내고, 날짜를 기록하고, 의문이 있을 때 안내를 구하는 것이 모두 라마단을 평온하게 보내는 데 도움이 돼요.',
    shareMessage: '라마단 기간의 금식 — AWA',
  },
  'pt-PT': {
    badge: 'RAMADÃO',
    title: 'O jejum durante\no Ramadão',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Dicas práticas e pontos de referência educativos para viver o mês de Ramadão durante o período, com serenidade.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Jejum suspenso durante o período',
      'Viver a espiritualidade de outra forma',
      'Registar os dias para o jejum de compensação',
      'Pontos-chave',
    ],
    section1Body1: 'Durante o período, o jejum não é obrigatório: este tempo coloca a mulher num estado em que vários atos de culto, incluindo o jejum, ficam temporariamente suspensos. Esta suspensão é reconhecida como uma facilidade, não como uma proibição nem como um castigo.',
    section1Body2: 'Suspender o jejum durante o período não significa afastar-se da prática religiosa. Ela fica simplesmente em pausa por um tempo limitado e é retomada normalmente quando o período termina, sem que nenhum ato de fé se perca. Os dias em que não jejuou serão compensados mais tarde (Qada), fora do Ramadão.',
    tip1Title: 'Bom saber',
    tip1Text: 'Esta pausa pode também ser vivida como um tempo de outra natureza dentro do mês, em que a espiritualidade continua a exprimir-se de outras formas, sem jejum.',
    note1Title: 'De notar',
    note1Text: 'Esta situação não deve ser vivida com culpa: faz parte do ciclo natural do corpo e é tida em conta pela própria tradição religiosa.',
    section2Body: 'Não jejuar não significa ficar à margem do mês de Ramadão. Muitas formas de espiritualidade continuam acessíveis e permitem continuar a viver plenamente este tempo.',
    spiritualActs: [
      'Dhikr (recordação de Deus)',
      'Dua (súplica)',
      'Ouvir conteúdos religiosos',
      'Ler conteúdos educativos',
      'Caridade e gestos de bondade',
      'Ajudar a preparar o iftar',
      'Tempo para reflexão pessoal',
      'Manter uma rotina espiritual',
    ],
    tip2Title: 'Bom saber',
    tip2Text: 'Estes pequenos gestos, mesmo simples, ajudam a manter-se plenamente ligada ao espírito do mês, seja qual for a sua situação.',
    section3Body: 'Registar os dias do período durante o Ramadão facilita, depois, o cálculo do número de dias a compensar (Qada) e evita ter de recorrer à memória quando o mês terminar.',
    trackingTips: [
      'Anote a data de cada dia em que não jejuou, à medida que acontece',
      'Use um calendário, uma aplicação ou um caderno dedicado',
      'Faça uma verificação rápida no final do mês para confirmar o total',
    ],
    visualTitle: 'Registo simplificado',
    visualText: 'A AWA pode ajudá-la a acompanhar o seu ciclo durante todo o Ramadão, para que possa encontrar facilmente esta informação mais tarde.',
    note2Title: 'De notar',
    note2Text: 'As modalidades exatas da compensação dos dias em falta (momento, situações especiais como a gravidez ou a amamentação) podem variar consoante a escola jurídica. Para qualquer situação específica ou complexa, o parecer de um sábio qualificado continua a ser a referência.',
    tip3Title: 'Bom saber',
    tip3Text: 'O jejum suspenso durante o período é uma facilidade reconhecida, não uma interrupção da prática religiosa. Viver este tempo de outra forma, registar os seus dias e pedir orientação em caso de dúvida ajudam a atravessar o Ramadão com serenidade.',
    shareMessage: 'O jejum durante o Ramadão — AWA',
  },
  bn: {
    badge: 'রমজান',
    title: 'রমজানে\nরোজা রাখা',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'মাসিক চলাকালীন রমজান মাসকে প্রশান্তির সঙ্গে অতিবাহিত করার জন্য কিছু ব্যবহারিক পরামর্শ ও শিক্ষামূলক দিকনির্দেশনা।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় রায় দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মাসিকের সময় রোজা স্থগিত থাকে',
      'আধ্যাত্মিকতাকে ভিন্নভাবে অনুভব করা',
      'কাজা রোজার জন্য দিনের হিসাব রাখা',
      'মূল কথা',
    ],
    section1Body1: 'মাসিকের সময় রোজা রাখা আবশ্যক নয়: এই সময় একজন নারীকে এমন অবস্থায় রাখে যেখানে রোজাসহ বেশ কিছু ইবাদত সাময়িকভাবে স্থগিত থাকে। এই স্থগিতাদেশকে একটি সহজতা হিসেবে গণ্য করা হয়, নিষেধাজ্ঞা বা শাস্তি হিসেবে নয়।',
    section1Body2: 'মাসিকের সময় রোজা স্থগিত থাকার অর্থ আপনার ধর্মচর্চা থেকে সরে যাওয়া নয়। এটি কেবল সীমিত সময়ের জন্য বিরতি, তারপর মাসিক শেষ হলে স্বাভাবিকভাবে আবার শুরু হয়, কোনো ঈমানি আমল হারিয়ে না গিয়েই। যে দিনগুলোতে রোজা রাখা হয়নি, সেগুলো পরে রমজানের বাইরে কাজা করা হবে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'এই বিরতিকে মাসের মধ্যে ভিন্ন ধরনের একটি সময় হিসেবেও অনুভব করা যেতে পারে, যেখানে রোজা ছাড়াই আধ্যাত্মিকতা অন্যভাবে প্রকাশ পেতে থাকে।',
    note1Title: 'অনুগ্রহ করে লক্ষ করুন',
    note1Text: 'এই অবস্থাকে অপরাধবোধের সঙ্গে অনুভব করা উচিত নয়: এটি শরীরের স্বাভাবিক চক্রের অংশ এবং ধর্মীয় ঐতিহ্য নিজেই এটিকে বিবেচনায় রেখেছে।',
    section2Body: 'রোজা না রাখার অর্থ রমজান মাস থেকে বিচ্ছিন্ন হয়ে পড়া নয়। আধ্যাত্মিকতার অনেক রূপ এখনও হাতের নাগালে থাকে এবং এই সময়কে পূর্ণভাবে অনুভব করা চালিয়ে যেতে সাহায্য করে।',
    spiritualActs: [
      'যিকির (আল্লাহর স্মরণ)',
      'দোয়া (প্রার্থনা)',
      'ধর্মীয় বিষয়বস্তু শোনা',
      'শিক্ষামূলক বিষয়বস্তু পড়া',
      'দান ও সদাচরণ',
      'ইফতার প্রস্তুতিতে সাহায্য করা',
      'ব্যক্তিগত চিন্তাভাবনার সময়',
      'আধ্যাত্মিক রুটিন বজায় রাখা',
    ],
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'এই ছোট ছোট কাজ, সহজ হলেও, আপনার পরিস্থিতি যা-ই হোক, মাসের চেতনার সঙ্গে পূর্ণভাবে যুক্ত থাকতে সাহায্য করে।',
    section3Body: 'রমজানে আপনার মাসিকের দিনগুলোর হিসাব রাখলে পরে কাজা করার দিনের সংখ্যা গণনা করা সহজ হয় এবং মাস শেষ হওয়ার পর স্মৃতির ওপর নির্ভর করতে হয় না।',
    trackingTips: [
      'রোজা না রাখা প্রতিটি দিনের তারিখ সঙ্গে সঙ্গে লিখে রাখুন',
      'ক্যালেন্ডার, অ্যাপ বা আলাদা একটি খাতা ব্যবহার করুন',
      'মাস শেষে মোট সংখ্যা মিলিয়ে দেখতে একবার দ্রুত যাচাই করুন',
    ],
    visualTitle: 'সহজ হিসাব রাখা',
    visualText: 'AWA রমজান জুড়ে আপনার চক্রের হিসাব রাখতে সাহায্য করতে পারে, যাতে পরে এই তথ্য সহজেই খুঁজে পান।',
    note2Title: 'অনুগ্রহ করে লক্ষ করুন',
    note2Text: 'ছুটে যাওয়া দিনগুলো কাজা করার সঠিক নিয়ম (সময়, গর্ভাবস্থা বা বুকের দুধ খাওয়ানোর মতো বিশেষ পরিস্থিতি) ফিকহের মাযহাব অনুযায়ী ভিন্ন হতে পারে। যেকোনো নির্দিষ্ট বা জটিল পরিস্থিতিতে যোগ্য আলেমের মতামতই নির্ভরযোগ্য সূত্র।',
    tip3Title: 'জেনে রাখা ভালো',
    tip3Text: 'মাসিকের সময় রোজা স্থগিত থাকা একটি স্বীকৃত সহজতা, ধর্মচর্চা থেকে বিরতি নয়। এই সময়কে ভিন্নভাবে অনুভব করা, নিজের দিনগুলোর হিসাব রাখা এবং সন্দেহ হলে দিকনির্দেশনা চাওয়া — এসবই রমজানকে প্রশান্তির সঙ্গে পার করতে সাহায্য করে।',
    shareMessage: 'রমজানে রোজা রাখা — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function RamadanFastingArticleScreen({
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
        <View style={styles.heroWrap}>
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

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

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.disclaimerTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.disclaimerText}</AwaText>
            </View>
          </AwaCard>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
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

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.note1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.note1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <View style={styles.daily}>
            {SPIRITUAL_ACT_ICONS.map((icon, index) => (
              <View key={content.spiritualActs[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.spiritualActs[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.trackingTips.map(item => (
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

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.tracking}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.visualTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visualText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.note2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.note2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip3Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

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
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  visualCard: {
    marginTop: 16,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualText: {marginTop: 4},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
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
  checkText: {flex: 1},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  });
}
