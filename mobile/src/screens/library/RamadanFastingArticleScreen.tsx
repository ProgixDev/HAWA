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
const CONTENT = {
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
} as const;

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
