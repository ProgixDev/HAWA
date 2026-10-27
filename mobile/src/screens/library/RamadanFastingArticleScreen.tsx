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
  da: {
    badge: 'RAMADAN',
    title: 'Faste under\nRamadan',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Praktiske tips og uddannelsesmæssige anvisninger til at leve Ramadan-måneden, mens du har menstruation, med ro.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er rent uddannelsesmæssigt. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Faste suspenderet under din menstruation',
      'At opleve spiritualitet anderledes',
      'At holde styr på dage til Qadaa-faste',
      'Vigtige pointer',
    ],
    section1Body1: 'Under din menstruation er faste ikke påkrævet: denne tid placerer en kvinde i en tilstand, hvori flere gudsdyrkelseshandlinger, herunder faste, er midlertidigt suspenderet. Denne suspension er anerkendt som en lettelse, ikke som et forbud eller en straf.',
    section1Body2: 'At suspendere fasten under din menstruation betyder ikke at træde tilbage fra din religiøse praksis. Den er simpelthen sat på pause i en begrænset tid, derefter genoptaget normalt, når din menstruation slutter, uden at nogen troens handling går tabt. De ikke-fastede dage vil blive indhentet som Qadaa-faste, uden for Ramadan.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Denne pause kan også opleves som en anderledes tid inden for måneden, hvor spiritualiteten fortsætter med at udtrykke sig på andre måder, uden faste.',
    note1Title: 'Bemærk venligst',
    note1Text: 'Denne situation bør ikke opleves med skyld: den er en del af kroppens naturlige cyklus og er taget i betragtning af den religiøse tradition selv.',
    section2Body: 'At undlade at faste betyder ikke at være afskåret fra Ramadan-måneden. Mange former for spiritualitet forbliver tilgængelige og giver dig mulighed for fortsat fuldt ud at opleve denne tid.',
    spiritualActs: [
      'Dhikr (ihukommelse af Gud)',
      'Du\'a (bønsmålinger)',
      'At lytte til religiøst indhold',
      'At læse uddannelsesmæssigt indhold',
      'Velgørenhed og venlige handlinger',
      'At hjælpe med at forberede iftar',
      'Tid til personlig refleksion',
      'At opretholde en åndelig rutine',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Disse små bevægelser, selv enkle, hjælper dig med at forblive fuldt forbundet til månedensånd, uanset din situation.',
    section3Body: 'At holde styr på dine menstruationsdage under Ramadan gør det lettere bagefter at beregne antallet af dage, der skal indhentes som Qadaa-faste, og undgår at skulle stole på hukommelsen, når måneden er ovre.',
    trackingTips: [
      'Notér datoen for hver ikke-fastet dag løbende',
      'Brug en kalender, en app eller en dedikeret notesbog',
      'Lav en hurtig kontrol ved månedets slutning for at bekræfte det samlede antal',
    ],
    visualTitle: 'Forenklet registrering',
    visualText: 'AWA kan hjælpe dig med at spore din cyklus gennem Ramadan, så du nemt kan finde disse oplysninger igen senere.',
    note2Title: 'Bemærk venligst',
    note2Text: 'De præcise regler for indhentning af missede dage (tidspunkt, særlige situationer såsom graviditet eller amning) kan variere i henhold til retsskolen. For enhver specifik eller kompleks situation forbliver meningen fra en kvalificeret lærd referencen.',
    tip3Title: 'Godt at vide',
    tip3Text: 'Faste suspenderet under din menstruation er en anerkendt lettelse, ikke et brud i din religiøse praksis. At leve denne tid anderledes, at holde styr på dine dage og at bede om vejledning i tvivlstilfælde — alt dette hjælper dig med at komme igennem Ramadan med ro.',
    shareMessage: 'Faste under Ramadan — AWA',
  },
  sv: {
    badge: 'RAMADAN',
    title: 'Faste under\nRamadan',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Praktiske tips och uddannelsesmässige anvisninger till at leve Ramadan-måneden, mens du har menstruation, med ro.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Faste suspenderet under din menstruation',
      'At opleve spiritualitet anderledes',
      'At holde styr på dagar till Qadaa-faste',
      'Vigtige pointer',
    ],
    section1Body1: 'Under din menstruation ar faste inte påkrävet: denne tid placerer en kvinna i en tilstand, hvori flere gudsdyrkelseshandlinger, herunder faste, ar midlertidigt suspenderet. Denne suspension ar anerkendt som en lettelse, inte som et forbud eller en straf.',
    section1Body2: 'At suspendere fasten under din menstruation betyder inte at träde tilbage fran din religiöse praksis. Den ar simpelthen sat på pause i en begränset tid, derefter genoptaget normalt, når din menstruation slutter, uden at nogen troens handling går tabt. De ikke-fastede dagar vil blive indhentet som Qadaa-faste, uden for Ramadan.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Denne pause kan også opleves som en anderledes tid inden for måneden, hvor spiritualiteten fortsätter med at udtrykke sig på andre måder, uden faste.',
    note1Title: 'Bemärk venligst',
    note1Text: 'Denne situation bör inte opleves med skyld: den ar en del av kroppens naturlige cyklus och ar taget i betragtning av den religiöse tradition selv.',
    section2Body: 'At undlade at faste betyder inte at väre afskåret fran Ramadan-måneden. Mange former for spiritualitet forbliver tilgängelige och giver dig mulighed for fortsat fuldt ud at opleve denne tid.',
    spiritualActs: [
      'Dhikr (ihukommelse av Gud)',
      'Du\'a (bönsmålinger)',
      'At lytte till religiöst indhold',
      'At läse uddannelsesmässigt indhold',
      'Velgörenhed och venlige handlinger',
      'At hjälpe med at forberede iftar',
      'Tid till personlig refleksion',
      'At opretholde en åndelig rutine',
    ],
    tip2Title: 'Godt at vide',
    tip2Text: 'Disse små bevägelser, selv enkle, hjälper dig med at forblive fuldt forbundet till månedensånd, uanset din situation.',
    section3Body: 'At holde styr på dina menstruationsdage under Ramadan gör det lettere bagefter at beregne antallet av dagar, der skal indhentes som Qadaa-faste, och undgår at skulle stole på hukommelsen, når måneden ar ovre.',
    trackingTips: [
      'Notér datoen for hver ikke-fastet dag löbende',
      'Brug en kalender, en app eller en dedikeret notesbog',
      'Lav en hurtig kontrol ved månedets slutning for att bekräfte det samlede antal',
    ],
    visualTitle: 'Forenklet registrering',
    visualText: 'AWA kan hjälpe dig med at spore din cyklus gennem Ramadan, så du nemt kan finde disse oplysninger igen senere.',
    note2Title: 'Bemärk venligst',
    note2Text: 'De präcise regler for indhentning av missede dagar (tidspunkt, särlige situationer såsom graviditet eller amning) kan variere i henhold till retsskolen. For enhver specifik eller kompleks situation forbliver meningen fran en kvalificeret lärd referencen.',
    tip3Title: 'Godt at vide',
    tip3Text: 'Faste suspenderet under din menstruation ar en anerkendt lettelse, inte et brud i din religiöse praksis. At leve denne tid anderledes, at holde styr på dina dagar och at bede om vejledning i tvivlstilfälde — alt dette hjälper dig med at komme igennem Ramadan med ro.',
    shareMessage: 'Faste under Ramadan — AWA',
  },
  nb: {
    badge: 'RAMADAN',
    title: 'Faste under\nramadan',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Praktiske råd og pedagogiske holdepunkter for å leve gjennom ramadan-måneden mens du har mens, med ro i sinnet.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Fasten er suspendert under mensen',
      'Oppleve spiritualitet på en annen måte',
      'Holde oversikt over dager som skal tas igjen',
      'Det viktigste å huske',
    ],
    section1Body1: 'Under mensen er faste ikke pålagt: denne tiden setter en kvinne i en tilstand der flere gudstjenestehandlinger, blant annet faste, er midlertidig suspendert. Denne suspensjonen anerkjennes som en lettelse, ikke som et forbud eller en straff.',
    section1Body2: 'Å suspendere fasten under mensen betyr ikke å trekke seg bort fra religionsutøvelsen. Den settes rett og slett på pause for en begrenset tid, og gjenopptas deretter normalt når mensen er over, uten at noen troshandling går tapt. Dagene man ikke fastet, tas igjen senere (qada), utenfor ramadan.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Denne pausen kan også oppleves som en annerledes tid i måneden, der spiritualiteten fortsetter å uttrykke seg på andre måter, uten faste.',
    note1Title: 'Merk',
    note1Text: 'Denne situasjonen bør ikke oppleves med skyldfølelse: den er en del av kroppens naturlige syklus og er tatt hensyn til av selve den religiøse tradisjonen.',
    section2Body: 'Å ikke faste betyr ikke å være avskåret fra ramadan-måneden. Mange former for spiritualitet er fortsatt tilgjengelige og lar deg fortsette å leve fullt ut i denne tiden.',
    spiritualActs: [
      'Dhikr (påkallelse av Gud)',
      'Du‘a (bønner)',
      'Å lytte til religiøst innhold',
      'Å lese pedagogisk innhold',
      'Veldedighet og vennlige handlinger',
      'Å hjelpe til med å lage iftar',
      'Tid til personlig refleksjon',
      'Å opprettholde en åndelig rutine',
    ],
    tip2Title: 'Godt å vite',
    tip2Text: 'Disse små gestene, selv enkle, hjelper deg å forbli fullt forbundet med månedens ånd, uansett situasjon.',
    section3Body: 'Å holde oversikt over menstruasjonsdagene dine under ramadan gjør det lettere å beregne antall dager som skal tas igjen (qada) etterpå, og unngår at du må stole på hukommelsen når måneden er over.',
    trackingTips: [
      'Noter datoen for hver dag du ikke fastet, etter hvert',
      'Bruk en kalender, en app eller en egen notatbok',
      'Gjør en rask kontroll på slutten av måneden for å verifisere summen',
    ],
    visualTitle: 'Forenklet sporing',
    visualText: 'AWA kan hjelpe deg å følge syklusen din gjennom hele ramadan, slik at du lett finner denne informasjonen igjen senere.',
    note2Title: 'Merk',
    note2Text: 'De nøyaktige vilkårene for å ta igjen dager man gikk glipp av (tidspunkt, spesielle situasjoner som svangerskap eller amming), kan variere etter rettsskole. For enhver spesifikk eller kompleks situasjon er uttalelsen fra en kvalifisert lærd fortsatt referansen.',
    tip3Title: 'Godt å vite',
    tip3Text: 'Fasten som er suspendert under mensen, er en anerkjent lettelse, ikke et brudd i religionsutøvelsen. Å leve gjennom denne tiden annerledes, holde oversikt over dagene dine og be om veiledning ved tvil hjelper alt sammen deg å komme gjennom ramadan med ro i sinnet.',
    shareMessage: 'Faste under ramadan – AWA',
  },
  pl: {
    badge: 'RAMADAN',
    title: 'Post w czasie\nramadanu',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Praktyczne wskazówki i informacje edukacyjne, jak ze spokojem przeżyć miesiąc ramadanu podczas miesiączki.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Post zawieszony podczas miesiączki',
      'Inne przeżywanie duchowości',
      'Prowadzenie rachunku dni do odrobienia',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'Podczas miesiączki post nie jest obowiązkowy: ten czas stawia kobietę w stanie, w którym kilka aktów kultu, w tym post, jest czasowo zawieszonych. To zawieszenie jest uznawane za ulgę, a nie za zakaz czy karę.',
    section1Body2: 'Zawieszenie postu podczas miesiączki nie oznacza oddalenia się od praktyki religijnej. Jest ona po prostu wstrzymana na ograniczony czas, a następnie normalnie wznawiana po zakończeniu miesiączki, bez utraty żadnego aktu wiary. Dni nieposzczone zostaną odrobione później (kada), poza ramadanem.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Tę przerwę można też przeżywać jako inny rodzaj czasu w miesiącu, w którym duchowość nadal wyraża się na inne sposoby, bez postu.',
    note1Title: 'Zwróć uwagę',
    note1Text: 'Tej sytuacji nie należy przeżywać z poczuciem winy: jest częścią naturalnego cyklu ciała i uwzględnia ją sama tradycja religijna.',
    section2Body: 'Nieposzczenie nie oznacza odcięcia od miesiąca ramadanu. Wiele form duchowości pozostaje dostępnych i pozwala w pełni przeżywać ten czas.',
    spiritualActs: [
      'Dhikr (wspominanie Boga)',
      'Dua (prośby i modlitwy błagalne)',
      'Słuchanie treści religijnych',
      'Czytanie treści edukacyjnych',
      'Jałmużna i akty życzliwości',
      'Pomoc w przygotowaniu iftaru',
      'Czas na osobistą refleksję',
      'Utrzymanie duchowej rutyny',
    ],
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Te drobne gesty, nawet proste, pomagają pozostać w pełni związaną z duchem tego miesiąca, niezależnie od Twojej sytuacji.',
    section3Body: 'Prowadzenie rachunku dni miesiączki w czasie ramadanu ułatwia później obliczenie liczby dni do odrobienia (kada) i pozwala nie polegać na pamięci po zakończeniu miesiąca.',
    trackingTips: [
      'Zapisuj datę każdego dnia bez postu na bieżąco',
      'Użyj kalendarza, aplikacji lub specjalnego zeszytu',
      'Na koniec miesiąca zrób szybką kontrolę, aby sprawdzić łączną liczbę',
    ],
    visualTitle: 'Uproszczone śledzenie',
    visualText: 'AWA może pomóc Ci śledzić cykl przez cały ramadan, abyś później łatwo odnalazła te informacje.',
    note2Title: 'Zwróć uwagę',
    note2Text: 'Dokładne zasady odrabiania opuszczonych dni (termin, szczególne sytuacje, takie jak ciąża lub karmienie piersią) mogą się różnić w zależności od szkoły prawa. W każdej szczególnej lub złożonej sytuacji punktem odniesienia pozostaje opinia wykwalifikowanego uczonego.',
    tip3Title: 'Warto wiedzieć',
    tip3Text: 'Post zawieszony podczas miesiączki jest uznaną ulgą, a nie przerwą w praktyce religijnej. Inne przeżywanie tego czasu, prowadzenie rachunku dni i proszenie o wskazówki w razie wątpliwości pomagają przejść przez ramadan ze spokojem.',
    shareMessage: 'Post w czasie ramadanu — AWA',
  },
  uk: {
    badge: 'РАМАДАН',
    title: 'Піст під час\nРамадану',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Практичні поради та навчальні орієнтири, щоб зі спокоєм пережити місяць Рамадан під час менструації.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Піст, призупинений під час менструації',
      'Інше проживання духовності',
      'Облік днів для відпрацювання посту',
      'Головні висновки',
    ],
    section1Body1: 'Під час менструації піст не є обов’язковим: цей час ставить жінку в стан, у якому кілька актів богослужіння, зокрема піст, тимчасово призупиняються. Це призупинення визнається полегшенням, а не забороною чи покаранням.',
    section1Body2: 'Призупинення посту під час менструації не означає відходу від релігійної практики. Вона просто ставиться на паузу на обмежений час, а потім нормально відновлюється після завершення менструації, без втрати жодного акту віри. Дні, у які ви не постили, будуть відпрацьовані пізніше (када), поза Рамаданом.',
    tip1Title: 'Варто знати',
    tip1Text: 'Цю паузу можна також переживати як інший вид часу протягом місяця, коли духовність продовжує виражатися іншими способами, без посту.',
    note1Title: 'Зверніть увагу',
    note1Text: 'Цю ситуацію не слід переживати з почуттям провини: вона є частиною природного циклу тіла й враховується самою релігійною традицією.',
    section2Body: 'Не постити не означає бути відрізаною від місяця Рамадан. Багато форм духовності залишаються доступними й дозволяють повноцінно переживати цей час.',
    spiritualActs: [
      'Зікр (згадування Бога)',
      'Дуа (прохання та благання)',
      'Слухання релігійного вмісту',
      'Читання навчального вмісту',
      'Милостиня та добрі вчинки',
      'Допомога в приготуванні іфтару',
      'Час для особистих роздумів',
      'Підтримка духовної рутини',
    ],
    tip2Title: 'Варто знати',
    tip2Text: 'Ці маленькі жести, навіть прості, допомагають залишатися повною мірою пов’язаною з духом місяця, незалежно від вашої ситуації.',
    section3Body: 'Облік днів вашої менструації під час Рамадану полегшує подальший підрахунок кількості днів для відпрацювання (када) і дозволяє не покладатися на пам’ять після завершення місяця.',
    trackingTips: [
      'Занотовуйте дату кожного дня без посту в міру їх настання',
      'Використовуйте календар, застосунок або спеціальний зошит',
      'Наприкінці місяця зробіть швидку перевірку, щоб звірити загальну суму',
    ],
    visualTitle: 'Спрощене відстеження',
    visualText: 'AWA може допомогти вам відстежувати цикл протягом усього Рамадану, щоб ви легко могли знайти цю інформацію пізніше.',
    note2Title: 'Зверніть увагу',
    note2Text: 'Точні умови відпрацювання пропущених днів (строки, особливі ситуації, як-от вагітність чи годування груддю) можуть відрізнятися залежно від школи правознавства. У будь-якій особливій чи складній ситуації орієнтиром залишається думка кваліфікованого вченого.',
    tip3Title: 'Варто знати',
    tip3Text: 'Піст, призупинений під час менструації, — визнане полегшення, а не перерва в релігійній практиці. Інше проживання цього часу, облік днів і прохання про настанови в разі сумнівів допомагають пройти Рамадан зі спокоєм.',
    shareMessage: 'Піст під час Рамадану — AWA',
  },
  cs: {
    badge: 'RAMADÁN',
    title: 'Půst během\nramadánu',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Praktické rady a vzdělávací orientační body, jak prožít měsíc ramadán během menstruace, v klidu.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Půst pozastavený během menstruace',
      'Jiné prožívání spirituality',
      'Sledování dnů k nahrazení půstu',
      'Hlavní poznatky',
    ],
    section1Body1: 'Během menstruace není půst povinný: v tomto období je žena ve stavu, ve kterém je několik úkonů bohoslužby, včetně půstu, dočasně pozastaveno. Toto pozastavení je uznáváno jako úleva, nikoli jako zákaz nebo trest.',
    section1Body2: 'Pozastavení půstu během menstruace neznamená odklon od náboženské praxe. Je jen na omezenou dobu pozastavena a po skončení menstruace se normálně obnoví, aniž by se jakýkoli úkon víry ztratil. Dny, ve kterých jste se nepostila, se později nahradí (kada), mimo ramadán.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Tuto pauzu lze prožívat také jako jiný druh času v rámci měsíce, kdy se spiritualita dál projevuje jinými způsoby, bez půstu.',
    note1Title: 'Upozornění',
    note1Text: 'Tuto situaci by se nemělo prožívat s pocitem viny: je součástí přirozeného cyklu těla a samotná náboženská tradice s ní počítá.',
    section2Body: 'Nepostit se neznamená být odříznuta od měsíce ramadánu. Zůstává dostupných mnoho forem spirituality, které vám umožňují toto období dál plně prožívat.',
    spiritualActs: [
      'Dhikr (vzpomínání na Boha)',
      'Prosby (du‘á)',
      'Poslech náboženského obsahu',
      'Čtení vzdělávacího obsahu',
      'Almužna a laskavé skutky',
      'Pomoc s přípravou iftáru',
      'Čas na osobní zamyšlení',
      'Udržování duchovní rutiny',
    ],
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Tato malá gesta, i jednoduchá, vám pomáhají zůstat plně spojena s duchem měsíce, ať je vaše situace jakákoli.',
    section3Body: 'Sledování dnů menstruace během ramadánu usnadňuje následně výpočet počtu dnů k nahrazení (kada) a ušetří vás spoléhání na paměť po skončení měsíce.',
    trackingTips: [
      'Průběžně si zapisujte datum každého dne bez půstu',
      'Použijte kalendář, aplikaci nebo vyhrazený zápisník',
      'Na konci měsíce proveďte rychlou kontrolu celkového počtu',
    ],
    visualTitle: 'Zjednodušené sledování',
    visualText: 'AWA vám může pomoci sledovat cyklus po celý ramadán, abyste tyto informace později snadno našla.',
    note2Title: 'Upozornění',
    note2Text: 'Přesné podmínky nahrazování vynechaných dnů (načasování, zvláštní situace jako těhotenství nebo kojení) se mohou lišit podle právní školy. Pro jakoukoli konkrétní nebo složitou situaci zůstává referencí názor kvalifikovaného učence.',
    tip3Title: 'Stojí za to vědět',
    tip3Text: 'Půst pozastavený během menstruace je uznaná úleva, nikoli přerušení vaší náboženské praxe. Prožít toto období jinak, sledovat své dny a v případě pochybností požádat o vedení, to vše vám pomůže projít ramadánem v klidu.',
    shareMessage: 'Půst během ramadánu — AWA',
  },
  sk: {
    badge: 'RAMADÁN',
    title: 'Pôst počas\nramadánu',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Praktické tipy a vzdelávacie orientačné body, ako prežiť mesiac ramadán počas menštruácie, s pokojom.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pôst pozastavený počas menštruácie',
      'Prežívanie duchovnosti inak',
      'Sledovanie dní na nahradenie pôstu',
      'Hlavné body',
    ],
    section1Body1: 'Počas menštruácie sa pôst nevyžaduje: toto obdobie uvádza ženu do stavu, v ktorom je niekoľko úkonov bohoslužby, vrátane pôstu, dočasne pozastavených. Toto pozastavenie je uznané ako úľava, nie ako zákaz alebo trest.',
    section1Body2: 'Pozastavenie pôstu počas menštruácie neznamená odklon od náboženskej praxe. Je jednoducho na obmedzený čas prerušená a po skončení menštruácie sa normálne obnoví, bez straty akéhokoľvek úkonu viery. Nepostené dni sa nahradia neskôr (kada), mimo ramadánu.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Túto pauzu možno prežívať aj ako iný druh času v rámci mesiaca, v ktorom sa duchovnosť naďalej prejavuje inými spôsobmi, bez pôstu.',
    note1Title: 'Upozornenie',
    note1Text: 'Túto situáciu by ste nemali prežívať s vinou: je súčasťou prirodzeného cyklu tela a samotná náboženská tradícia s ňou počíta.',
    section2Body: 'Nepostiť sa neznamená byť odrezaná od mesiaca ramadánu. Mnohé formy duchovnosti zostávajú prístupné a umožňujú vám naďalej plne prežívať toto obdobie.',
    spiritualActs: [
      'Dhikr (pripomínanie si Boha)',
      'Du‘á (prosby)',
      'Počúvanie náboženského obsahu',
      'Čítanie vzdelávacieho obsahu',
      'Almužna a skutky láskavosti',
      'Pomoc pri príprave iftáru',
      'Čas na osobné zamyslenie',
      'Udržiavanie duchovnej rutiny',
    ],
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Tieto malé gestá, aj jednoduché, vám pomáhajú zostať plne spojená s duchom mesiaca, nech je vaša situácia akákoľvek.',
    section3Body: 'Sledovanie dní menštruácie počas ramadánu neskôr uľahčuje výpočet počtu dní na nahradenie (kada) a zbavuje vás potreby spoliehať sa na pamäť po skončení mesiaca.',
    trackingTips: [
      'Priebežne si poznačte dátum každého neposteného dňa',
      'Použite kalendár, aplikáciu alebo vyhradený zošit',
      'Na konci mesiaca urobte rýchlu kontrolu a overte celkový počet',
    ],
    visualTitle: 'Zjednodušené sledovanie',
    visualText: 'AWA vám môže pomôcť sledovať cyklus počas celého ramadánu, aby ste tieto informácie neskôr ľahko našli.',
    note2Title: 'Upozornenie',
    note2Text: 'Presné podmienky nahrádzania vynechaných dní (načasovanie, osobitné situácie ako tehotenstvo alebo dojčenie) sa môžu líšiť podľa právnej školy. Pri každej konkrétnej alebo zložitej situácii zostáva referenciou názor kvalifikovaného učenca.',
    tip3Title: 'Stojí za to vedieť',
    tip3Text: 'Pôst pozastavený počas menštruácie je uznaná úľava, nie prerušenie vašej náboženskej praxe. Prežívať toto obdobie inak, sledovať svoje dni a v prípade pochybností požiadať o usmernenie, to všetko vám pomáha prejsť ramadánom s pokojom.',
    shareMessage: 'Pôst počas ramadánu — AWA',
  },
  hu: {
    badge: 'RAMADÁN',
    title: 'Böjt a\nramadán alatt',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Praktikus tippek és ismeretterjesztő támpontok a ramadán hónap menstruáció alatti nyugodt megéléséhez.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A menstruáció alatt felfüggesztett böjt',
      'A spiritualitás másként való megélése',
      'A bepótlandó böjtnapok nyomon követése',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A menstruáció alatt a böjt nem kötelező: ez az időszak olyan állapotba helyezi a nőt, amelyben az istentisztelet több cselekménye, köztük a böjt is, átmenetileg fel van függesztve. Ez a felfüggesztés könnyítésként ismert el, nem tiltásként vagy büntetésként.',
    section1Body2: 'A böjt felfüggesztése a menstruáció alatt nem jelenti a vallási gyakorlattól való eltávolodást. Egyszerűen korlátozott időre szünetel, majd a menstruáció végével normálisan folytatódik, anélkül, hogy bármilyen hitbéli cselekmény elveszne. A nem böjtölt napokat később pótolják (kada), a ramadánon kívül.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ezt a szünetet a hónapon belül egy másfajta időnek is megélheted, amelyben a spiritualitás továbbra is más módokon fejeződik ki, böjt nélkül.',
    note1Title: 'Figyelem',
    note1Text: 'Ezt a helyzetet nem szabad bűntudattal megélni: a test természetes ciklusának része, és maga a vallási hagyomány is számol vele.',
    section2Body: 'A böjtölés elmaradása nem jelenti, hogy el lennél vágva a ramadán hónaptól. A spiritualitás számos formája elérhető marad, és lehetővé teszi, hogy továbbra is teljesen megéld ezt az időt.',
    spiritualActs: [
      'Dhikr (Isten emlegetése)',
      'Du‘á (könyörgések)',
      'Vallási tartalmak hallgatása',
      'Ismeretterjesztő tartalmak olvasása',
      'Adakozás és jócselekedetek',
      'Segítség az iftár előkészítésében',
      'Idő a személyes elmélkedésre',
      'Spirituális rutin fenntartása',
    ],
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Ezek az apró, akár egyszerű gesztusok segítenek teljesen kapcsolatban maradni a hónap szellemével, bármi is a helyzeted.',
    section3Body: 'A ramadán alatti menstruációs napjaid nyomon követése megkönnyíti a bepótlandó napok (kada) számának utólagos kiszámítását, és megkímél attól, hogy a hónap végén az emlékezetedre kelljen hagyatkoznod.',
    trackingTips: [
      'Jegyezd fel menet közben minden nem böjtölt nap dátumát',
      'Használj naptárat, alkalmazást vagy külön füzetet',
      'A hónap végén végezz gyors ellenőrzést, hogy megerősítsd az összesített számot',
    ],
    visualTitle: 'Egyszerűsített követés',
    visualText: 'Az AWA segíthet követni a ciklusodat a ramadán során, hogy később könnyen megtaláld ezeket az információkat.',
    note2Title: 'Figyelem',
    note2Text: 'A kihagyott napok bepótlásának pontos feltételei (időzítés, különleges helyzetek, például terhesség vagy szoptatás) a jogi iskolától függően eltérhetnek. Bármely konkrét vagy összetett helyzetben a kvalifikált tudós véleménye marad az irányadó.',
    tip3Title: 'Érdemes tudni',
    tip3Text: 'A menstruáció alatt felfüggesztett böjt elismert könnyítés, nem a vallási gyakorlatod megszakítása. Ennek az időnek más módon való megélése, a napjaid követése és kétség esetén az útmutatás kérése mind segít, hogy nyugodtan átvészeld a ramadánt.',
    shareMessage: 'Böjt a ramadán alatt — AWA',
  },
  ro: {
    badge: 'RAMADAN',
    title: 'Postul în timpul\nRamadanului',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Sfaturi practice și repere educative pentru a trăi luna Ramadan în timpul menstruației, cu seninătate.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Postul suspendat în timpul menstruației',
      'Trăirea spiritualității altfel',
      'Evidența zilelor pentru postul de recuperat',
      'Ce să reții',
    ],
    section1Body1: 'În timpul menstruației, postul nu este obligatoriu: această perioadă plasează femeia într-o stare în care mai multe acte de cult, inclusiv postul, sunt suspendate temporar. Această suspendare este recunoscută ca o ușurare, nu ca o interdicție sau o pedeapsă.',
    section1Body2: 'Suspendarea postului în timpul menstruației nu înseamnă a te îndepărta de practica ta religioasă. Ea este pur și simplu pusă pe pauză pentru o perioadă limitată, apoi reluată normal odată ce menstruația se încheie, fără ca vreun act de credință să se piardă. Zilele nepostite vor fi recuperate mai târziu (qadaa), în afara Ramadanului.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Această pauză poate fi trăită și ca un alt fel de timp în cadrul lunii, în care spiritualitatea continuă să se exprime în alte moduri, fără post.',
    note1Title: 'Atenție',
    note1Text: 'Această situație nu trebuie trăită cu vinovăție: face parte din ciclul natural al corpului și este luată în considerare de tradiția religioasă însăși.',
    section2Body: 'A nu posti nu înseamnă a fi desprinsă de luna Ramadan. Multe forme de spiritualitate rămân accesibile și îți permit să continui să trăiești pe deplin această perioadă.',
    spiritualActs: [
      'Dhikr (pomenirea lui Dumnezeu)',
      'Du’a (rugăciuni de cerere)',
      'Ascultarea de conținut religios',
      'Citirea de conținut educativ',
      'Caritatea și gesturile de bunătate',
      'Ajutor la pregătirea iftarului',
      'Timp pentru reflecție personală',
      'Menținerea unei rutine spirituale',
    ],
    tip2Title: 'Bine de știut',
    tip2Text: 'Aceste mici gesturi, chiar și simple, te ajută să rămâi pe deplin conectată la spiritul lunii, oricare ar fi situația ta.',
    section3Body: 'Evidența zilelor de menstruație din timpul Ramadanului face mai ușor, după aceea, calcularea numărului de zile de recuperat (qadaa) și evită să te bazezi pe memorie după încheierea lunii.',
    trackingTips: [
      'Notează data fiecărei zile nepostite pe măsură ce trece',
      'Folosește un calendar, o aplicație sau un caiet dedicat',
      'Fă o scurtă verificare la sfârșitul lunii pentru a controla totalul',
    ],
    visualTitle: 'O urmărire simplificată',
    visualText: 'AWA te poate ajuta să-ți urmărești ciclul pe tot parcursul Ramadanului, astfel încât să regăsești ușor aceste informații mai târziu.',
    note2Title: 'Atenție',
    note2Text: 'Modalitățile exacte de recuperare a zilelor ratate (momentul, situații speciale precum sarcina sau alăptarea) pot varia în funcție de școala de jurisprudență. Pentru orice situație specifică sau complexă, părerea unui savant calificat rămâne referința.',
    tip3Title: 'Bine de știut',
    tip3Text: 'Postul suspendat în timpul menstruației este o ușurare recunoscută, nu o ruptură de practica ta religioasă. Trăirea acestei perioade altfel, evidența zilelor tale și cererea de îndrumare în caz de îndoială te ajută toate să treci cu seninătate prin Ramadan.',
    shareMessage: 'Postul în timpul Ramadanului — AWA',
  },
  bg: {
    badge: 'РАМАДАН',
    title: 'Постът през\nРамадан',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Практични съвети и образователни ориентири, за да преживееш месец Рамадан със спокойствие, докато имаш менструация.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Постът е преустановен по време на менструация',
      'Преживяване на духовността по различен начин',
      'Следене на дните за наваксване на поста',
      'Какво да запомниш',
    ],
    section1Body1: 'По време на менструация постът не е задължителен: това време поставя жената в състояние, в което няколко акта на богослужение, включително постът, са временно преустановени. Това преустановяване е признато като облекчение, а не като забрана или наказание.',
    section1Body2: 'Преустановяването на поста по време на менструация не означава отдалечаване от религиозната ти практика. Тя просто е прекъсната за ограничено време, след което се възобновява нормално, щом менструацията свърши, без да се губи какъвто и да е акт на вярата. Непостените дни ще бъдат наваксани по-късно (кадаа), извън Рамадан.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Тази пауза може да се преживее и като различен вид време в рамките на месеца, в което духовността продължава да се изразява по други начини, без пост.',
    note1Title: 'Обърни внимание',
    note1Text: 'Тази ситуация не бива да се преживява с чувство за вина: тя е част от естествения цикъл на тялото и е взета предвид от самата религиозна традиция.',
    section2Body: 'Да не постиш не означава да бъдеш отрязана от месец Рамадан. Много форми на духовност остават достъпни и ти позволяват да продължиш да преживяваш пълноценно това време.',
    spiritualActs: [
      'Зикр (споменаване на Бога)',
      'Дуа (молби)',
      'Слушане на религиозно съдържание',
      'Четене на образователно съдържание',
      'Милостиня и добри дела',
      'Помощ при приготвянето на ифтара',
      'Време за лично размишление',
      'Поддържане на духовна рутина',
    ],
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Тези малки жестове, дори прости, ти помагат да останеш напълно свързана с духа на месеца, независимо от ситуацията ти.',
    section3Body: 'Следенето на дните на менструацията ти през Рамадан улеснява по-късното изчисляване на броя дни за наваксване (кадаа) и избягва нуждата да разчиташ на паметта си, след като месецът свърши.',
    trackingTips: [
      'Отбелязвай датата на всеки непостен ден, докато минават',
      'Използвай календар, приложение или специална тетрадка',
      'Направи бърза проверка в края на месеца, за да потвърдиш общия брой',
    ],
    visualTitle: 'Опростено проследяване',
    visualText: 'AWA може да ти помогне да следиш цикъла си през целия Рамадан, за да можеш лесно да намериш тази информация по-късно.',
    note2Title: 'Обърни внимание',
    note2Text: 'Точните условия за наваксване на пропуснатите дни (срок, специални ситуации като бременност или кърмене) могат да варират според школата на правото. За всяка конкретна или сложна ситуация мнението на квалифициран учен остава референцията.',
    tip3Title: 'Добре е да знаеш',
    tip3Text: 'Постът, преустановен по време на менструация, е призната облекчена възможност, а не прекъсване на религиозната ти практика. Преживяването на това време по различен начин, следенето на дните ти и търсенето на насоки при съмнение ти помагат да преминеш Рамадан със спокойствие.',
    shareMessage: 'Постът през Рамадан — AWA',
  },
  sr: {
    badge: 'РАМАЗАН',
    title: 'Пост током\nРамазана',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Практични савети и образовни оријентири да мирно проживиш месец Рамазан током менструације.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Пост је преустављен током менструације',
      'Другачије проживљавање духовности',
      'Праћење дана за надокнаду поста',
      'Шта да запамтиш',
    ],
    section1Body1: 'Током менструације пост није обавезан: ово време ставља жену у стање у којем је неколико дела богослужења, укључујући пост, привремено преустављено. Ово преустављање се признаје као олакшање, а не као забрана или казна.',
    section1Body2: 'Преустављање поста током менструације не значи удаљавање од твоје верске праксе. Она је једноставно паузирана на ограничено време, а затим се нормално наставља када менструација заврши, без губљења било ког дела вере. Непостени дани биће надокнађени касније (кадаа), ван Рамазана.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ова пауза се може проживети и као другачија врста времена унутар месеца, у којој се духовност и даље изражава на друге начине, без поста.',
    note1Title: 'Обрати пажњу',
    note1Text: 'Ову ситуацију не би требало проживљавати са осећајем кривице: она је део природног циклуса тела и узета је у обзир од саме верске традиције.',
    section2Body: 'Не постити не значи бити одсечена од месеца Рамазана. Многи облици духовности остају доступни и омогућавају ти да наставиш у потпуности проживљавати ово време.',
    spiritualActs: [
      'Зикр (спомињање Бога)',
      'Дуа (молбе)',
      'Слушање верског садржаја',
      'Читање образовног садржаја',
      'Милостиња и добра дела',
      'Помоћ у припреми ифтара',
      'Време за лично размишљање',
      'Одржавање духовне рутине',
    ],
    tip2Title: 'Добро је знати',
    tip2Text: 'Ови мали гестови, чак и једноставни, помажу ти да останеш потпуно повезана са духом месеца, без обзира на твоју ситуацију.',
    section3Body: 'Праћење дана твоје менструације током Рамазана олакшава касније израчунавање броја дана за надокнаду (кадаа) и избегава потребу да се ослањаш на сећање пошто месец заврши.',
    trackingTips: [
      'Бележи датум сваког непостеног дана како пролазе',
      'Користи календар, апликацију или посебну свеску',
      'Направи брзу проверу на крају месеца да потврдиш укупан број',
    ],
    visualTitle: 'Поједностављено праћење',
    visualText: 'AWA ти може помоћи да пратиш свој циклус током целог Рамазана, да би ове информације лако пронашла касније.',
    note2Title: 'Обрати пажњу',
    note2Text: 'Прецизни услови надокнаде пропуштених дана (рок, посебне ситуације као што су трудноћа или дојење) могу варирати зависно од правне школе. За сваку посебну или сложену ситуацију мишљење квалификованог учењака остаје референца.',
    tip3Title: 'Добро је знати',
    tip3Text: 'Пост преустављен током менструације је призната олакшица, а не прекид твоје верске праксе. Проживљавање овог времена на другачији начин, праћење дана и тражење смерница при сумњи помажу ти да спокојно прођеш Рамазан.',
    shareMessage: 'Пост током Рамазана — AWA',
  },
  hr: {
    badge: 'RAMAZAN',
    title: 'Post tijekom\nRamazana',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Praktični savjeti i edukativne smjernice za mirno proživljavanje mjeseca Ramazana tijekom menstruacije.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Post suspendiran tijekom menstruacije',
      'Drugačije proživljavanje duhovnosti',
      'Praćenje dana za nadoknadu posta',
      'Ključne poruke',
    ],
    section1Body1: 'Tijekom menstruacije post nije obvezan: to razdoblje stavlja ženu u stanje u kojem je nekoliko bogoslužnih čina, uključujući post, privremeno suspendirano. Ta se suspenzija priznaje kao olakšica, a ne kao zabrana ili kazna.',
    section1Body2: 'Suspenzija posta tijekom menstruacije ne znači udaljavanje od vjerske prakse. Ona je jednostavno pauzirana na ograničeno vrijeme, a zatim se normalno nastavlja kad menstruacija završi, bez gubitka ijednog čina vjere. Dani u kojima se nije postilo nadoknadit će se kasnije (kada), izvan Ramazana.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ta se stanka može proživjeti i kao drugačija vrsta vremena unutar mjeseca, u kojem se duhovnost nastavlja izražavati na druge načine, bez posta.',
    note1Title: 'Napomena',
    note1Text: 'Tu situaciju ne treba proživljavati s krivnjom: dio je prirodnog ciklusa tijela, a uzima je u obzir i sama vjerska tradicija.',
    section2Body: 'Ne postiti ne znači biti odsječena od mjeseca Ramazana. Mnogi oblici duhovnosti ostaju dostupni i omogućuju ti da i dalje u potpunosti proživljavaš ovo vrijeme.',
    spiritualActs: [
      'Zikr (spominjanje Boga)',
      'Dove (molitve molbe)',
      'Slušanje vjerskog sadržaja',
      'Čitanje edukativnog sadržaja',
      'Dobročinstvo i djela dobrote',
      'Pomaganje u pripremi iftara',
      'Vrijeme za osobno promišljanje',
      'Održavanje duhovne rutine',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Ove male geste, čak i jednostavne, pomažu ti ostati u potpunosti povezana s duhom mjeseca, bez obzira na tvoju situaciju.',
    section3Body: 'Praćenje dana menstruacije tijekom Ramazana naknadno olakšava izračun broja dana za nadoknadu (kada) i izbjegava oslanjanje na pamćenje nakon što mjesec završi.',
    trackingTips: [
      'Bilježi datum svakog dana u kojem nisi postila dok ide mjesec',
      'Koristi kalendar, aplikaciju ili posebnu bilježnicu',
      'Na kraju mjeseca brzo provjeri ukupan broj',
    ],
    visualTitle: 'Pojednostavljeno praćenje',
    visualText: 'AWA ti može pomoći pratiti ciklus tijekom cijelog Ramazana kako bi te informacije kasnije lako pronašla.',
    note2Title: 'Napomena',
    note2Text: 'Točni uvjeti nadoknade propuštenih dana (rokovi, posebne situacije poput trudnoće ili dojenja) mogu se razlikovati ovisno o pravnoj školi. Za svaku posebnu ili složenu situaciju mjerodavno ostaje mišljenje kvalificiranog učenjaka.',
    tip3Title: 'Dobro je znati',
    tip3Text: 'Post suspendiran tijekom menstruacije priznata je olakšica, a ne prekid vjerske prakse. Drugačije proživljavanje tog vremena, praćenje dana i traženje vodstva u slučaju nedoumice pomažu ti mirno proći kroz Ramazan.',
    shareMessage: 'Post tijekom Ramazana — AWA',
  },
  bs: {
    badge: 'RAMAZAN',
    title: 'Post tokom\nRamazana',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Praktični savjeti i edukativne smjernice za mirno proživljavanje mjeseca Ramazana tokom menstruacije.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Post suspendiran tokom menstruacije',
      'Drugačije proživljavanje duhovnosti',
      'Praćenje dana za nadoknadu posta',
      'Ključne poruke',
    ],
    section1Body1: 'Tokom menstruacije post nije obvezan: to razdoblje stavlja ženu u stanje u kojem je nekoliko bogoslužnih čina, uključujući post, privremeno suspendirano. Ta se suspenzija priznaje kao olakšica, a ne kao zabrana ili kazna.',
    section1Body2: 'Suspenzija posta tokom menstruacije ne znači udaljavanje od vjerske prakse. Ona je jednostavno pauzirana na ograničeno vrijeme, a zatim se normalno nastavlja kad menstruacija završi, bez gubitka ijednog čina vjere. Dani u kojima se nije postilo nadoknadit će se kasnije (kaza), izvan Ramazana.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ta se stanka može proživjeti i kao drugačija vrsta vremena unutar mjeseca, u kojem se duhovnost nastavlja izražavati na druge načine, bez posta.',
    note1Title: 'Napomena',
    note1Text: 'Tu situaciju ne treba proživljavati s krivnjom: dio je prirodnog ciklusa tijela, a uzima je u obzir i sama vjerska tradicija.',
    section2Body: 'Ne postiti ne znači biti odsječena od mjeseca Ramazana. Mnogi oblici duhovnosti ostaju dostupni i omogućuju ti da i dalje u potpunosti proživljavaš ovo vrijeme.',
    spiritualActs: [
      'Zikr (spominjanje Boga)',
      'Dove (molitve molbe)',
      'Slušanje vjerskog sadržaja',
      'Čitanje edukativnog sadržaja',
      'Dobročinstvo i djela dobrote',
      'Pomaganje u pripremi iftara',
      'Vrijeme za osobno promišljanje',
      'Održavanje duhovne rutine',
    ],
    tip2Title: 'Dobro je znati',
    tip2Text: 'Ove male geste, čak i jednostavne, pomažu ti ostati u potpunosti povezana s duhom mjeseca, bez obzira na tvoju situaciju.',
    section3Body: 'Praćenje dana menstruacije tokom Ramazana naknadno olakšava izračun broja dana za nadoknadu (kaza) i izbjegava oslanjanje na pamćenje nakon što mjesec završi.',
    trackingTips: [
      'Bilježi datum svakog dana u kojem nisi postila dok ide mjesec',
      'Koristi kalendar, aplikaciju ili posebnu bilježnicu',
      'Na kraju mjeseca brzo provjeri ukupan broj',
    ],
    visualTitle: 'Pojednostavljeno praćenje',
    visualText: 'AWA ti može pomoći pratiti ciklus tokom cijelog Ramazana kako bi te informacije kasnije lako pronašla.',
    note2Title: 'Napomena',
    note2Text: 'Tačni uslovi nadoknade propuštenih dana (rokovi, posebne situacije poput trudnoće ili dojenja) mogu se razlikovati ovisno o pravnoj školi. Za svaku posebnu ili složenu situaciju mjerodavno ostaje mišljenje kvalificiranog učenjaka.',
    tip3Title: 'Dobro je znati',
    tip3Text: 'Post suspendiran tokom menstruacije priznata je olakšica, a ne prekid vjerske prakse. Drugačije proživljavanje tog vremena, praćenje dana i traženje vodstva u slučaju nedoumice pomažu ti mirno proći kroz Ramazan.',
    shareMessage: 'Post tokom Ramazana — AWA',
  },
  sl: {
    badge: 'RAMAZAN',
    title: 'Post med\nramazanom',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Praktični nasveti in izobraževalne smernice za mirno doživljanje meseca ramazana med menstruacijo.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Post, suspendiran med menstruacijo',
      'Drugačno doživljanje duhovnosti',
      'Spremljanje dni za nadomestitev posta',
      'Ključna sporočila',
    ],
    section1Body1: 'Med menstruacijo post ni obvezen: to obdobje postavlja žensko v stanje, v katerem je več bogoslužnih dejanj, vključno s postom, začasno suspendiranih. Ta suspenzija se priznava kot olajšava, ne kot prepoved ali kazen.',
    section1Body2: 'Suspenzija posta med menstruacijo ne pomeni oddaljevanja od verske prakse. Je preprosto začasno ustavljena za omejen čas, nato pa se običajno nadaljuje, ko se menstruacija konča, brez izgube katerega koli dejanja vere. Dnevi, ko nisi postila, bodo nadomeščeni pozneje (kada), izven ramazana.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Ta premor se lahko doživlja tudi kot drugačna vrsta časa znotraj meseca, v katerem se duhovnost še naprej izraža na druge načine, brez posta.',
    note1Title: 'Opomba',
    note1Text: 'Te situacije ne bi smeli doživljati s krivdo: je del naravnega ciklusa telesa, upošteva pa jo tudi sama verska tradicija.',
    section2Body: 'Ne postiti ne pomeni biti odrezana od meseca ramazana. Mnoge oblike duhovnosti ostajajo dostopne in ti omogočajo, da še naprej polno doživljaš ta čas.',
    spiritualActs: [
      'Zikr (spominjanje Boga)',
      'Dove (prošnje)',
      'Poslušanje verske vsebine',
      'Branje izobraževalne vsebine',
      'Dobrodelnost in dobra dela',
      'Pomoč pri pripravi iftarja',
      'Čas za osebno razmišljanje',
      'Ohranjanje duhovne rutine',
    ],
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Te majhne geste, tudi preproste, ti pomagajo ostati polno povezana z duhom meseca, ne glede na tvojo situacijo.',
    section3Body: 'Spremljanje dni menstruacije med ramazanom naknadno olajša izračun števila dni za nadomestitev (kada) in preprečuje zanašanje na spomin, ko se mesec konča.',
    trackingTips: [
      'Sproti zapiši datum vsakega dne, ko nisi postila',
      'Uporabi koledar, aplikacijo ali posebni zvezek',
      'Ob koncu meseca hitro preveri skupno število',
    ],
    visualTitle: 'Poenostavljeno spremljanje',
    visualText: 'AWA ti lahko pomaga spremljati cikel skozi ves ramazan, da te informacije pozneje zlahka najdeš.',
    note2Title: 'Opomba',
    note2Text: 'Natančni pogoji nadomestitve zamujenih dni (roki, posebne situacije, kot sta nosečnost ali dojenje) se lahko razlikujejo glede na pravno šolo. Za vsako posebno ali zapleteno situacijo ostaja merodajno mnenje kvalificiranega učenjaka.',
    tip3Title: 'Vredno vedeti',
    tip3Text: 'Post, suspendiran med menstruacijo, je priznana olajšava, ne prekinitev verske prakse. Drugačno doživljanje tega časa, spremljanje dni in iskanje vodstva v primeru dvoma ti pomagajo mirno prebroditi ramazan.',
    shareMessage: 'Post med ramazanom — AWA',
  },
  ne: {
    badge: 'रमजान',
    title: 'रमजानमा\nरोजा',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'महिनावारीको अवस्थामा शान्तिसँग रमजानको महिना बिताउन व्यावहारिक सुझावहरू र शैक्षिक सङ्केतहरू।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'महिनावारीमा स्थगित रोजा',
      'आध्यात्मिकता फरक ढङ्गले जिउने',
      'कजा रोजाका लागि दिनहरूको हिसाब राख्ने',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'महिनावारीको समयमा, रोजा अनिवार्य हुँदैन: यो समयले महिलालाई यस्तो अवस्थामा राख्छ जहाँ रोजा सहित धेरै इबादतका कार्यहरू अस्थायी रूपमा स्थगित हुन्छन्। यो स्थगन राहतका रूपमा मान्यता दिइएको छ, निषेध वा सजायका रूपमा होइन।',
    section1Body2: 'महिनावारीको समयमा रोजा स्थगित गर्नुको अर्थ आफ्नो धार्मिक अभ्यासबाट टाढा हुनु होइन। यो सीमित समयका लागि रोकिन्छ, त्यसपछि महिनावारी सकिएपछि सामान्य रूपमा फेरि सुरु हुन्छ, आस्थाको कुनै कार्य नगुमाई। नराखिएका दिनहरू पछि (कजा), रमजानबाहिर, कजा गरिनेछन्।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'यो विरामलाई महिनाभित्रको फरक प्रकारको समयका रूपमा पनि अनुभव गर्न सकिन्छ, जहाँ आध्यात्मिकता रोजाबिना अन्य तरिकाले व्यक्त हुन जारी रहन्छ।',
    note1Title: 'कृपया ध्यान दिनुहोस्',
    note1Text: 'यो अवस्थालाई अपराधबोधसहित अनुभव गर्नु हुँदैन: यो शरीरको स्वाभाविक चक्रको हिस्सा हो र धार्मिक परम्परा आफैँले यसलाई ध्यानमा राखेको छ।',
    section2Body: 'रोजा नराख्नुको अर्थ रमजानको महिनाबाट कटिनु होइन। आध्यात्मिकताका धेरै रूपहरू पहुँचयोग्य रहन्छन् र तपाईंलाई यो समय पूर्ण रूपमा जिउन जारी राख्न दिन्छन्।',
    spiritualActs: [
      'जिक्र (अल्लाहको स्मरण)',
      'दुआहरू',
      'धार्मिक सामग्री सुन्ने',
      'शैक्षिक सामग्री पढ्ने',
      'दान र दयालुताका कार्यहरू',
      'इफ्तार तयार गर्न मद्दत गर्ने',
      'व्यक्तिगत चिन्तनको समय',
      'आध्यात्मिक दिनचर्या कायम राख्ने',
    ],
    tip2Title: 'जान्न लायक',
    tip2Text: 'यी साना कार्यहरूले, सरल भए पनि, तपाईंको अवस्था जे भए पनि, महिनाको भावनासँग पूर्ण रूपमा जोडिएको रहन मद्दत गर्छन्।',
    section3Body: 'रमजानमा आफ्नो महिनावारीका दिनहरूको हिसाब राख्नाले पछि कजा गर्नुपर्ने दिनहरूको सङ्ख्या गणना गर्न सजिलो बनाउँछ, र महिना सकिएपछि सम्झनामा भर पर्नुपर्ने अवस्थाबाट जोगाउँछ।',
    trackingTips: [
      'रोजा नराखिएको हरेक दिनको मिति बित्दै जाँदा टिप्नुहोस्',
      'पात्रो, एप वा समर्पित कापी प्रयोग गर्नुहोस्',
      'कुल सङ्ख्या प्रमाणित गर्न महिनाको अन्त्यमा छिटो जाँच गर्नुहोस्',
    ],
    visualTitle: 'सरलीकृत अनुगमन',
    visualText: 'AWA ले रमजानभरि तपाईंको चक्र अनुगमन गर्न मद्दत गर्न सक्छ, ताकि तपाईं पछि यो जानकारी सजिलै फेला पार्न सक्नुहोस्।',
    note2Title: 'कृपया ध्यान दिनुहोस्',
    note2Text: 'छुटेका दिनहरू कजा गर्ने सही सर्तहरू (समय, गर्भावस्था वा स्तनपान जस्ता विशेष अवस्थाहरू) फिक्हको विचारधाराअनुसार फरक हुन सक्छन्। कुनै विशेष वा जटिल अवस्थाका लागि, योग्य विद्वानको राय नै सन्दर्भ रहन्छ।',
    tip3Title: 'जान्न लायक',
    tip3Text: 'महिनावारीमा स्थगित रोजा मान्यता प्राप्त राहत हो, तपाईंको धार्मिक अभ्यासबाट विराम होइन। यो समयलाई फरक ढङ्गले जिउनु, आफ्ना दिनहरूको हिसाब राख्नु, र शङ्का भएमा मार्गदर्शन माग्नुले तपाईंलाई शान्तिसँग रमजान पार गर्न मद्दत गर्छ।',
    shareMessage: 'रमजानमा रोजा — AWA',
  },
  si: {
    badge: 'රමළාන්',
    title: 'රමළාන් කාලයේ\nඋපවාසය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ ඔසප් කාලයේදී රමළාන් මාසය සන්සුන්කමින් ගත කිරීම සඳහා ප්‍රායෝගික ඉඟි සහ අධ්‍යාපනික යොමු ලක්ෂ්‍ය.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඔබේ ඔසප් කාලයේදී අත්හිටවූ උපවාසය',
      'ආධ්‍යාත්මිකතාව වෙනස් ආකාරයකට අත්විඳීම',
      'පිරිමැසිය යුතු උපවාස සඳහා දින නිරීක්ෂණය කිරීම',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'ඔබේ ඔසප් කාලයේදී, උපවාසය අනිවාර්ය නොවේ: මෙම කාලය කාන්තාවක් උපවාසය ඇතුළු නමස්කාර ක්‍රියා කිහිපයක් තාවකාලිකව අත්හිටුවන තත්ත්වයක පත් කරයි. මෙම අත්හිටුවීම තහනමක් හෝ දඬුවමක් ලෙස නොව සහනයක් ලෙස පිළිගනු ලැබේ.',
    section1Body2: 'ඔබේ ඔසප් කාලයේදී උපවාසය අත්හිටුවීම ඔබේ ආගමික පුරුද්දෙන් ඉවත් වීමක් අදහස් නොවේ. එය සීමිත කාලයක් සඳහා විරාම කර, ඔබේ ඔසප් අවසන් වූ පසු සාමාන්‍ය ලෙස නැවත ආරම්භ කෙරේ, ඇදහිල්ලේ කිසිදු ක්‍රියාවක් නැති නොවී. උපවාසය නොකළ දින රමළාන් පිටත, පසුව පිරිමැසෙනු ඇත (කදා).',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'මෙම විරාමය මාසය තුළ වෙනස් ආකාරයක කාලයක් ලෙසද අත්විඳිය හැක, එහිදී ආධ්‍යාත්මිකතාව උපවාසයකින් තොරව අනෙක් ආකාරවලින් ප්‍රකාශ වීම දිගටම කරගෙන යයි.',
    note1Title: 'කරුණාකර සටහන් කරන්න',
    note1Text: 'මෙම තත්ත්වය වරදකාරී හැඟීමකින් අත්විඳිය යුතු නැත: එය ශරීරයේ ස්වාභාවික චක්‍රයේ කොටසක් වන අතර ආගමික සම්ප්‍රදාය විසින්ම සැලකිල්ලට ගනු ලැබේ.',
    section2Body: 'උපවාසය නොකිරීම යනු රමළාන් මාසයෙන් විසන්ධි වීම නොවේ. ආධ්‍යාත්මිකතාවේ බොහෝ ආකාර ප්‍රවේශ්‍ය ලෙස පවතින අතර මෙම කාලය සම්පූර්ණයෙන් අත්විඳීම දිගටම කරගෙන යාමට ඉඩ සලසයි.',
    spiritualActs: [
      'ධික්ර් (දෙවියන් සිහි කිරීම)',
      'දුආ (ප්‍රාර්ථනා)',
      'ආගමික අන්තර්ගතයට සවන් දීම',
      'අධ්‍යාපනික අන්තර්ගතය කියවීම',
      'දානය සහ කරුණාවන්ත ක්‍රියා',
      'ඉෆ්තාර් සූදානම් කිරීමට උදව් කිරීම',
      'පෞද්ගලික ආවර්ජනය සඳහා කාලය',
      'ආධ්‍යාත්මික පුරුද්දක් පවත්වා ගැනීම',
    ],
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'මෙම කුඩා ක්‍රියා, සරල වුවද, ඔබේ තත්ත්වය කුමක් වුවත්, මාසයේ ආත්මයට සම්පූර්ණයෙන්ම සම්බන්ධව සිටීමට ඔබට උපකාරී වේ.',
    section3Body: 'රමළාන් කාලයේ ඔබේ ඔසප් දින නිරීක්ෂණය කිරීම පසුව පිරිමැසිය යුතු දින ගණන (කදා) ගණනය කිරීම පහසු කරන අතර, මාසය අවසන් වූ පසු මතකය මත විශ්වාසය තැබීමේ අවශ්‍යතාව වළක්වයි.',
    trackingTips: [
      'උපවාසය නොකළ සෑම දිනයක දිනයම ඔබ ඉදිරියට යන විට සටහන් කරන්න',
      'දින දර්ශනයක්, යෙදුමක්, හෝ කැපවූ සටහන් පොතක් භාවිතා කරන්න',
      'මුළු ගණන තහවුරු කිරීමට මාසය අවසානයේ ඉක්මන් පරීක්ෂාවක් කරන්න',
    ],
    visualTitle: 'සරල කළ නිරීක්ෂණය',
    visualText: 'AWA ට රමළාන් පුරා ඔබේ චක්‍රය නිරීක්ෂණය කිරීමට උදව් කළ හැකි බැවින්, ඔබට මෙම තොරතුරු පසුව පහසුවෙන් නැවත සොයාගත හැක.',
    note2Title: 'කරුණාකර සටහන් කරන්න',
    note2Text: 'මග හැරුණු දින පිරිමැසීමේ නිශ්චිත කොන්දේසි (කාලය, ගර්භණී කාලය හෝ මව්කිරි පෙවීම වැනි විශේෂ තත්ත්වයන්) නීති චින්තන ධාරාව අනුව වෙනස් විය හැක. ඕනෑම විශේෂ හෝ සංකීර්ණ තත්ත්වයක් සඳහා, සුදුසුකම් ලත් විද්වතෙකුගේ මතය යොමුව ලෙස පවතී.',
    tip3Title: 'දැනගත යුතු දේ',
    tip3Text: 'ඔබේ ඔසප් කාලයේදී අත්හිටවූ උපවාසය පිළිගත් සහනයක් මිස, ඔබේ ආගමික පුරුද්දෙන් විරාමයක් නොවේ. මෙම කාලය වෙනස් ලෙස ගත කිරීම, ඔබේ දින නිරීක්ෂණය කිරීම සහ සැකයක් ඇති විට මඟපෙන්වීම ඉල්ලීම සියල්ලම රමළාන් සන්සුන්කමින් ගත කිරීමට ඔබට උපකාරී වේ.',
    shareMessage: 'රමළාන් කාලයේ උපවාසය — AWA',
  },
  th: {
    badge: 'รอมฎอน',
    title: 'การถือศีลอดใน\nเดือนรอมฎอน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'คำแนะนำเชิงปฏิบัติและแนวทางเพื่อการเรียนรู้สำหรับการผ่านเดือนรอมฎอนระหว่างมีประจำเดือนอย่างสงบ',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การถือศีลอดที่ถูกระงับระหว่างมีประจำเดือน',
      'ใช้ชีวิตทางจิตวิญญาณในแบบที่ต่างออกไป',
      'ติดตามวันสำหรับการถือศีลอดชดเชย',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'ระหว่างมีประจำเดือน ไม่จำเป็นต้องถือศีลอด: ช่วงเวลานี้ทำให้สตรีอยู่ในสภาวะที่ศาสนกิจหลายอย่าง รวมถึงการถือศีลอด ถูกระงับชั่วคราว การระงับนี้ได้รับการยอมรับว่าเป็นการผ่อนปรน ไม่ใช่ข้อห้ามหรือการลงโทษ',
    section1Body2: 'การระงับการถือศีลอดระหว่างมีประจำเดือนไม่ได้หมายถึงการถอยห่างจากการปฏิบัติศาสนกิจ เป็นเพียงการหยุดไว้ชั่วเวลาจำกัด แล้วกลับมาตามปกติเมื่อประจำเดือนสิ้นสุด โดยไม่มีการกระทำแห่งศรัทธาใดสูญเสียไป วันที่ไม่ได้ถือศีลอดจะชดเชยภายหลัง (กอฎาอ์) นอกเดือนรอมฎอน',
    tip1Title: 'ควรรู้',
    tip1Text: 'การหยุดพักนี้ยังเผชิญได้เป็นช่วงเวลาอีกแบบหนึ่งในเดือน ที่จิตวิญญาณยังคงแสดงออกในรูปแบบอื่น โดยไม่มีการถือศีลอด',
    note1Title: 'โปรดทราบ',
    note1Text: 'ไม่ควรเผชิญสถานการณ์นี้ด้วยความรู้สึกผิด: เป็นส่วนหนึ่งของรอบตามธรรมชาติของร่างกายและประเพณีทางศาสนาเองก็คำนึงถึง',
    section2Body: 'การไม่ถือศีลอดไม่ได้หมายถึงการขาดจากเดือนรอมฎอน จิตวิญญาณหลายรูปแบบยังเข้าถึงได้และช่วยให้คุณใช้ช่วงเวลานี้ได้อย่างเต็มที่ต่อไป',
    spiritualActs: [
      'ซิกร์ (การระลึกถึงอัลลอฮ์)',
      'ดุอาอ์ (การวิงวอน)',
      'ฟังเนื้อหาทางศาสนา',
      'อ่านเนื้อหาเพื่อการเรียนรู้',
      'การบริจาคทานและการกระทำที่ดีงาม',
      'ช่วยเตรียมอิฟตาร',
      'เวลาสำหรับการใคร่ครวญส่วนตัว',
      'รักษากิจวัตรทางจิตวิญญาณ',
    ],
    tip2Title: 'ควรรู้',
    tip2Text: 'การกระทำเล็ก ๆ เหล่านี้ แม้เรียบง่าย ช่วยให้คุณเชื่อมต่อกับจิตวิญญาณของเดือนได้อย่างเต็มที่ ไม่ว่าสถานการณ์ของคุณจะเป็นอย่างไร',
    section3Body: 'การติดตามวันที่มีประจำเดือนในเดือนรอมฎอนทำให้คำนวณจำนวนวันที่ต้องชดเชย (กอฎาอ์) ภายหลังได้ง่ายขึ้น และไม่ต้องพึ่งความจำเมื่อสิ้นเดือน',
    trackingTips: [
      'จดวันที่ของแต่ละวันที่ไม่ได้ถือศีลอดเมื่อเกิดขึ้น',
      'ใช้ปฏิทิน แอป หรือสมุดบันทึกโดยเฉพาะ',
      'ตรวจสอบอย่างรวดเร็วเมื่อสิ้นเดือนเพื่อยืนยันยอดรวม',
    ],
    visualTitle: 'การติดตามแบบง่าย',
    visualText: 'AWA ช่วยคุณติดตามรอบเดือนตลอดรอมฎอน เพื่อให้คุณหาข้อมูลนี้พบได้ง่ายภายหลัง',
    note2Title: 'โปรดทราบ',
    note2Text: 'เงื่อนไขที่แน่ชัดในการชดเชยวันที่พลาด (เวลา สถานการณ์พิเศษ เช่น ตั้งครรภ์หรือให้นมแม่) อาจต่างกันตามสำนักนิติศาสตร์ สำหรับสถานการณ์เฉพาะหรือซับซ้อน ความเห็นของผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งอ้างอิง',
    tip3Title: 'ควรรู้',
    tip3Text: 'การถือศีลอดที่ถูกระงับระหว่างมีประจำเดือนเป็นการผ่อนปรนที่ได้รับการยอมรับ ไม่ใช่การหยุดพักจากการปฏิบัติศาสนกิจ การผ่านช่วงเวลานี้ในแบบที่ต่างออกไป การติดตามวันของคุณ และการขอคำแนะนำเมื่อสงสัย ล้วนช่วยให้คุณผ่านรอมฎอนอย่างสงบ',
    shareMessage: 'การถือศีลอดในเดือนรอมฎอน — AWA',
  },
  vi: {
    badge: 'RAMADAN',
    title: 'Nhịn ăn trong\ntháng Ramadan',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Lời khuyên thực tế và các mốc giáo dục để trải qua tháng Ramadan trong kỳ kinh một cách thanh thản.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Nhịn ăn được tạm ngưng trong kỳ kinh',
      'Trải nghiệm tâm linh theo cách khác',
      'Theo dõi các ngày cần nhịn bù',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'Trong kỳ kinh, nhịn ăn không bắt buộc: thời gian này đặt người phụ nữ vào một trạng thái mà nhiều hành vi thờ phượng, bao gồm nhịn ăn, tạm thời được tạm ngưng. Sự tạm ngưng này được công nhận là một sự nới lỏng, không phải một điều cấm hay hình phạt.',
    section1Body2: 'Tạm ngưng nhịn ăn trong kỳ kinh không có nghĩa là rời xa thực hành tôn giáo của bạn. Nó chỉ đơn giản được tạm dừng trong một thời gian giới hạn, rồi tiếp tục bình thường khi kỳ kinh kết thúc, mà không có hành vi đức tin nào bị mất. Những ngày không nhịn sẽ được bù lại sau (qadaa), ngoài tháng Ramadan.',
    tip1Title: 'Nên biết',
    tip1Text: 'Khoảng dừng này cũng có thể được trải qua như một loại thời gian khác trong tháng, nơi đời sống tâm linh tiếp tục được thể hiện theo những cách khác, không có nhịn ăn.',
    note1Title: 'Xin lưu ý',
    note1Text: 'Tình huống này không nên được trải qua với cảm giác tội lỗi: nó là một phần của chu kỳ tự nhiên của cơ thể và chính truyền thống tôn giáo cũng đã tính đến.',
    section2Body: 'Không nhịn ăn không có nghĩa là bị tách khỏi tháng Ramadan. Nhiều hình thức tâm linh vẫn có thể thực hiện và cho phép bạn tiếp tục trải nghiệm trọn vẹn thời gian này.',
    spiritualActs: [
      'Dhikr (tưởng nhớ Thượng Đế)',
      'Du’a (những lời cầu xin)',
      'Nghe nội dung tôn giáo',
      'Đọc nội dung giáo dục',
      'Làm từ thiện và những hành động tử tế',
      'Giúp chuẩn bị bữa iftar',
      'Thời gian suy ngẫm cá nhân',
      'Duy trì một thói quen tâm linh',
    ],
    tip2Title: 'Nên biết',
    tip2Text: 'Những cử chỉ nhỏ này, dù đơn giản, giúp bạn luôn kết nối trọn vẹn với tinh thần của tháng, bất kể hoàn cảnh của bạn.',
    section3Body: 'Theo dõi các ngày có kinh trong tháng Ramadan giúp việc tính số ngày cần bù (qadaa) sau đó dễ dàng hơn, và tránh phải dựa vào trí nhớ khi tháng đã kết thúc.',
    trackingTips: [
      'Ghi lại ngày của mỗi ngày không nhịn ngay khi nó xảy ra',
      'Dùng lịch, ứng dụng hoặc một cuốn sổ riêng',
      'Kiểm tra nhanh vào cuối tháng để xác nhận tổng số',
    ],
    visualTitle: 'Theo dõi đơn giản hóa',
    visualText: 'AWA có thể giúp bạn theo dõi chu kỳ trong suốt tháng Ramadan, để bạn dễ dàng tìm lại thông tin này sau.',
    note2Title: 'Xin lưu ý',
    note2Text: 'Các điều khoản cụ thể của việc bù lại những ngày đã bỏ lỡ (thời điểm, các tình huống đặc biệt như thai kỳ hay cho con bú) có thể khác nhau tùy theo trường phái luật học. Với mọi tình huống cụ thể hoặc phức tạp, ý kiến của một học giả có thẩm quyền vẫn là tham chiếu.',
    tip3Title: 'Nên biết',
    tip3Text: 'Việc nhịn ăn được tạm ngưng trong kỳ kinh là một sự nới lỏng được công nhận, không phải sự gián đoạn trong thực hành tôn giáo của bạn. Trải qua thời gian này theo cách khác, theo dõi các ngày của mình và xin hướng dẫn khi nghi ngờ đều giúp bạn đi qua tháng Ramadan một cách thanh thản.',
    shareMessage: 'Nhịn ăn trong tháng Ramadan — AWA',
  },
  uz: {
    badge: 'RAMAZON',
    title: 'Ramazonda\nroʻza tutish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Ramazon oyini hayz davrida xotirjam oʻtkazish uchun amaliy maslahatlar va taʼlimiy tayanch nuqtalar.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Hayz paytida toʻxtatilgan roʻza',
      'Maʼnaviyatni boshqacha boshdan kechirish',
      'Qazo roʻza kunlarini hisobga olish',
      'Asosiy xulosalar',
    ],
    section1Body1: 'Hayz paytida roʻza tutish shart emas: bu vaqt ayolni roʻzani oʻz ichiga olgan bir nechta ibodat vaqtincha toʻxtatiladigan holatga qoʻyadi. Bu toʻxtatilish taqiq yoki jazo emas, yengillik sifatida tan olinadi.',
    section1Body2: 'Hayz paytida roʻzani toʻxtatish diniy amaliyotdan uzoqlashishni anglatmaydi. U shunchaki cheklangan vaqtga toʻxtatiladi, hayz tugagandan keyin esa odatdagidek davom etadi, hech bir imon amali yoʻqolmaydi. Tutilmagan kunlar keyinroq, Ramazondan tashqarida, qazo qilinadi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Bu pauzani oy ichida boshqacha vaqt sifatida ham boshdan kechirish mumkin, bunda maʼnaviyat roʻzasiz boshqa yoʻllar bilan namoyon boʻlishda davom etadi.',
    note1Title: 'Eʼtibor bering',
    note1Text: 'Bu vaziyatni aybdorlik hissi bilan boshdan kechirmaslik kerak: bu tananing tabiiy siklining bir qismi va diniy anʼana tomonidan hisobga olingan.',
    section2Body: 'Roʻza tutmaslik Ramazon oyidan ajralib qolishni anglatmaydi. Koʻp maʼnaviyat shakllari mumkin boʻlib qoladi va bu vaqtni toʻliq boshdan kechirishda davom etish imkonini beradi.',
    spiritualActs: [
      'Zikr (Allohni eslash)',
      'Duolar',
      'Diniy kontentni tinglash',
      'Taʼlimiy kontentni oʻqish',
      'Sadaqa va yaxshilik amallari',
      'Iftorlikni tayyorlashga yordam berish',
      'Shaxsiy tafakkur uchun vaqt',
      'Maʼnaviy tartibni saqlash',
    ],
    tip2Title: 'Bilish foydali',
    tip2Text: 'Bu kichik amallar, hatto oddiy boʻlsa ham, vaziyatingizdan qatʼi nazar, oyning ruhi bilan toʻliq bogʻliq qolishga yordam beradi.',
    section3Body: 'Ramazonda hayz kunlaringizni hisobga olib borish keyinroq qazo qilinadigan kunlar sonini hisoblashni osonlashtiradi va oy tugagandan keyin xotiraga tayanish zaruratidan qutqaradi.',
    trackingTips: [
      'Tutilmagan har bir kun sanasini borishi bilan yozib qoʻying',
      'Taqvim, ilova yoki maxsus daftardan foydalaning',
      'Umumiy sonni tekshirish uchun oy oxirida tezkor tekshiruv qiling',
    ],
    visualTitle: 'Soddalashtirilgan kuzatuv',
    visualText: 'AWA Ramazon davomida siklingizni kuzatishga yordam beradi, shunda bu maʼlumotni keyinroq oson topasiz.',
    note2Title: 'Eʼtibor bering',
    note2Text: 'Oʻtkazib yuborilgan kunlarni qazo qilishning aniq shartlari (vaqti, homiladorlik yoki emizish kabi maxsus holatlar) fiqhiy maktabga qarab farq qilishi mumkin. Har qanday maxsus yoki murakkab vaziyat uchun malakali olimning fikri tayanch boʻlib qoladi.',
    tip3Title: 'Bilish foydali',
    tip3Text: 'Hayz paytida toʻxtatilgan roʻza tan olingan yengillik, diniy amaliyotdan tanaffus emas. Bu vaqtni boshqacha boshdan kechirish, kunlaringizni hisobga olish va shubha boʻlganda yoʻl-yoʻriq soʻrash — barchasi Ramazonni xotirjam oʻtkazishga yordam beradi.',
    shareMessage: 'Ramazonda roʻza tutish — AWA',
  },
  az: {
    badge: 'RAMAZAN',
    title: 'Ramazanda\noruc',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Aybaşı zamanı Ramazan ayını sakitliklə yaşamaq üçün praktik məsləhətlər və təhsil göstəriciləri.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Aybaşı zamanı dayandırılan oruc',
      'Mənəviyyatı fərqli yaşamaq',
      'Qəza orucu üçün günləri izləmək',
      'Əsas nəticələr',
    ],
    section1Body1: 'Aybaşı zamanı oruc tutmaq tələb olunmur: bu dövr qadını oruc da daxil olmaqla bir neçə ibadət aktının müvəqqəti dayandırıldığı vəziyyətə qoyur. Bu dayandırma qadağa və ya cəza kimi deyil, yüngüllük kimi tanınır.',
    section1Body2: 'Aybaşı zamanı orucu dayandırmaq dini təcrübədən uzaqlaşmaq demək deyil. O, sadəcə məhdud müddətə dayandırılır, sonra aybaşı bitdikdən sonra heç bir iman aktı itirilmədən normal bərpa olunur. Tutulmayan günlər sonradan, Ramazandan kənarda qəza ediləcək.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Bu fasilə həm də ayın içində fərqli bir vaxt kimi yaşana bilər, burada mənəviyyat oruc olmadan digər yollarla özünü ifadə etməyə davam edir.',
    note1Title: 'Nəzərə alın',
    note1Text: 'Bu vəziyyət günah hissi ilə yaşanmamalıdır: o, bədənin təbii dövrünün bir hissəsidir və dini ənənənin özü tərəfindən nəzərə alınıb.',
    section2Body: 'Oruc tutmamaq Ramazan ayından ayrılmaq demək deyil. Mənəviyyatın bir çox formaları əlçatan qalır və bu vaxtı tam yaşamağa davam etməyə imkan verir.',
    spiritualActs: [
      'Zikr (Allahı yad etmə)',
      'Dualar',
      'Dini məzmuna qulaq asmaq',
      'Təhsil məzmununu oxumaq',
      'Sədəqə və xeyirxah əməllər',
      'İftarın hazırlanmasına kömək',
      'Şəxsi düşüncə üçün vaxt',
      'Mənəvi rutini saxlamaq',
    ],
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Bu kiçik jestlər, hətta sadə olsa belə, vəziyyətinizdən asılı olmayaraq ayın ruhu ilə tam əlaqədə qalmağa kömək edir.',
    section3Body: 'Ramazan zamanı aybaşı günlərinizi izləmək sonradan qəza ediləcək günlərin sayını hesablamağı asanlaşdırır və ay bitdikdən sonra yaddaşa arxalanmağın qarşısını alır.',
    trackingTips: [
      'Tutulmayan hər günün tarixini həmin gün qeyd edin',
      'Təqvimdən, tətbiqdən və ya xüsusi dəftərdən istifadə edin',
      'Ümumi sayı yoxlamaq üçün ayın sonunda qısa yoxlama aparın',
    ],
    visualTitle: 'Sadələşdirilmiş izləmə',
    visualText: 'AWA Ramazan boyu dövrünüzü izləməyə kömək edə bilər ki, bu məlumatı sonradan asanlıqla tapa biləsiniz.',
    note2Title: 'Nəzərə alın',
    note2Text: 'Buraxılmış günlərin qəza edilməsinin dəqiq şərtləri (vaxt, hamiləlik və ya əmizdirmə kimi xüsusi vəziyyətlər) hüquq məktəbinə görə dəyişə bilər. İstənilən konkret və ya mürəkkəb vəziyyət üçün səlahiyyətli alimin fikri istinad olaraq qalır.',
    tip3Title: 'Bilmək faydalıdır',
    tip3Text: 'Aybaşı zamanı dayandırılan oruc tanınan yüngüllükdür, dini təcrübədən fasilə deyil. Bu vaxtı fərqli yaşamaq, günlərinizi izləmək və şübhə olarsa, istiqamətləndirmə istəmək Ramazanı sakitliklə keçirməyə kömək edir.',
    shareMessage: 'Ramazanda oruc — AWA',
  },
  ka: {
    badge: 'რამადანი',
    title: 'მარხვა\nრამადანში',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'პრაქტიკული რჩევები და საგანმანათლებლო მინიშნებები, რომ რამადანის თვე მენსტრუაციის დროს სიმშვიდით გაატაროთ.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'მარხვა შეჩერებულია მენსტრუაციის დროს',
      'სულიერების განსხვავებულად განცდა',
      'ასანაზღაურებელი მარხვის დღეების აღრიცხვა',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'მენსტრუაციის დროს მარხვა სავალდებულო არ არის: ეს დრო ქალს ისეთ მდგომარეობაში აყენებს, როცა რამდენიმე ღვთისმსახურებრივი აქტი, მათ შორის მარხვა, დროებით შეჩერებულია. ეს შეჩერება აღიარებულია შვებად და არა აკრძალვად ან სასჯელად.',
    section1Body2: 'მენსტრუაციის დროს მარხვის შეჩერება არ ნიშნავს რელიგიური პრაქტიკისგან განდგომას. ის უბრალოდ შეზღუდული დროით ჩერდება, შემდეგ კი მენსტრუაციის დასრულების შემდეგ ნორმალურად გრძელდება, რწმენის არცერთი აქტის დაკარგვის გარეშე. შეუსრულებელი დღეები მოგვიანებით აინაზღაურება (კადაა), რამადანის გარეთ.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ეს პაუზა შეიძლება ასევე განვიცადოთ, როგორც განსხვავებული სახის დრო თვის განმავლობაში, სადაც სულიერება მარხვის გარეშე სხვა გზებით აგრძელებს გამოხატვას.',
    note1Title: 'გაითვალისწინეთ',
    note1Text: 'ეს სიტუაცია დანაშაულის გრძნობით არ უნდა განიცადოთ: ის სხეულის ბუნებრივი ციკლის ნაწილია და თავად რელიგიური ტრადიციით არის გათვალისწინებული.',
    section2Body: 'მარხვის გარეშე ყოფნა არ ნიშნავს რამადანის თვისგან მოწყვეტას. სულიერების ბევრი ფორმა ხელმისაწვდომი რჩება და საშუალებას იძლევა ამ დროს სრულად განვიცადოთ.',
    spiritualActs: [
      'ზიქრი (ღმერთის მოხსენიება)',
      'დუა (ლოცვითი თხოვნები)',
      'რელიგიური შინაარსის მოსმენა',
      'საგანმანათლებლო შინაარსის კითხვა',
      'ქველმოქმედება და სიკეთის აქტები',
      'იფთარის მომზადებაში დახმარება',
      'დრო პირადი ფიქრისთვის',
      'სულიერი რუტინის შენარჩუნება',
    ],
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ეს პატარა ჟესტები, თუნდაც მარტივი, გეხმარებათ თვის სულისკვეთებასთან სრულად დაკავშირებული დარჩეთ, თქვენი სიტუაციის მიუხედავად.',
    section3Body: 'რამადანში თქვენი მენსტრუაციის დღეების აღრიცხვა შემდეგ ამარტივებს ასანაზღაურებელი დღეების (კადაა) რაოდენობის გამოთვლას და თავიდან გაგარიდებთ მეხსიერებაზე დაყრდნობას თვის დასრულების შემდეგ.',
    trackingTips: [
      'აღნიშნეთ თითოეული გამოტოვებული დღის თარიღი მიმდინარეობისას',
      'გამოიყენეთ კალენდარი, აპი ან სპეციალური რვეული',
      'თვის ბოლოს სწრაფად გადაამოწმეთ ჯამი',
    ],
    visualTitle: 'გამარტივებული კონტროლი',
    visualText: 'AWA-ს შეუძლია დაგეხმაროთ თქვენი ციკლის კონტროლში რამადანის განმავლობაში, რომ ეს ინფორმაცია მოგვიანებით ადვილად იპოვოთ.',
    note2Title: 'გაითვალისწინეთ',
    note2Text: 'გამოტოვებული დღეების ანაზღაურების ზუსტი პირობები (დრო, განსაკუთრებული სიტუაციები, როგორიცაა ორსულობა ან ძუძუთი კვება) სამართლებრივი სკოლის მიხედვით შეიძლება განსხვავდებოდეს. ნებისმიერი კონკრეტული ან რთული სიტუაციისთვის კვალიფიციური მეცნიერის აზრი რჩება საორიენტაციო წყაროდ.',
    tip3Title: 'კარგია ვიცოდეთ',
    tip3Text: 'მენსტრუაციის დროს შეჩერებული მარხვა აღიარებული შვებაა და არა რელიგიური პრაქტიკისგან შესვენება. ამ დროის განსხვავებულად გატარება, დღეების აღრიცხვა და ეჭვის შემთხვევაში მითითების თხოვნა ყველა ეხმარება რამადანის სიმშვიდით გავლაში.',
    shareMessage: 'მარხვა რამადანში — AWA',
  },
  hy: {
    badge: 'ՌԱՄԱԴԱՆ',
    title: 'Պահք\nՌամադանի ընթացքում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Գործնական խորհուրդներ և կրթական ուղենիշներ՝ Ռամադան ամիսը դաշտանի ժամանակ խաղաղությամբ ապրելու համար:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Դաշտանի ընթացքում կասեցված պահքը',
      'Հոգևորությունը ապրել այլ կերպ',
      'Փոխհատուցվող պահքի օրերին հետևելը',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'Դաշտանի ընթացքում պահքը պարտադիր չէ. այս ժամանակը կնոջը դնում է վիճակում, որտեղ պաշտամունքի մի քանի գործողություններ, այդ թվում՝ պահքը, ժամանակավորապես կասեցվում են: Այս կասեցումը ճանաչվում է որպես թեթևացում, ոչ թե արգելք կամ պատիժ:',
    section1Body2: 'Դաշտանի ընթացքում պահքի կասեցումը չի նշանակում հեռանալ ձեր կրոնական պրակտիկայից: Այն պարզապես դադար է սահմանափակ ժամանակով, ապա նորմալ վերսկսվում է դաշտանի ավարտից հետո՝ առանց հավատքի որևէ արարքի կորստի: Չպահված օրերը կփոխհատուցվեն ավելի ուշ (կադա)՝ Ռամադանից դուրս:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Այս դադարը կարելի է նաև ապրել որպես ամսվա մեջ այլ տեսակի ժամանակ, որտեղ հոգևորությունը շարունակում է արտահայտվել այլ կերպ՝ առանց պահքի:',
    note1Title: 'Խնդրում ենք ուշադրություն դարձնել',
    note1Text: 'Այս իրավիճակը չպետք է ապրել մեղքի զգացումով. այն մարմնի բնական ցիկլի մաս է և հաշվի է առնվում հենց կրոնական ավանդույթի կողմից:',
    section2Body: 'Չպահելը չի նշանակում կտրվել Ռամադան ամսից: Հոգևորության բազմաթիվ ձևեր մնում են հասանելի և թույլ են տալիս շարունակել լիարժեք ապրել այս ժամանակը:',
    spiritualActs: [
      'Զիքր (Աստծո հիշատակում)',
      'Դուա (աղոթագրեր)',
      'Կրոնական բովանդակություն լսելը',
      'Կրթական բովանդակություն կարդալը',
      'Բարեգործություն և բարության արարքներ',
      'Իֆթարի պատրաստմանը օգնելը',
      'Անձնական խորհրդածության ժամանակ',
      'Հոգևոր ռեժիմի պահպանում',
    ],
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Այս փոքր ժեստերը, նույնիսկ պարզ, օգնում են մնալ լիովին կապված ամսվա ոգուն՝ անկախ ձեր իրավիճակից:',
    section3Body: 'Ռամադանի ընթացքում ձեր դաշտանի օրերին հետևելը հետագայում հեշտացնում է փոխհատուցվելիք օրերի (կադա) քանակի հաշվարկը և թույլ չի տալիս հիմնվել հիշողության վրա՝ ամսվա ավարտից հետո:',
    trackingTips: [
      'Գրանցեք յուրաքանչյուր չպահված օրվա ամսաթիվը հենց դրանք լինեն',
      'Օգտագործեք օրացույց, հավելված կամ հատուկ տետր',
      'Ամսվա վերջում կատարեք արագ ստուգում՝ ընդհանուր թիվը հաստատելու համար',
    ],
    visualTitle: 'Պարզեցված հետևում',
    visualText: 'AWA-ն կարող է օգնել հետևել ձեր ցիկլին ողջ Ռամադանի ընթացքում, որպեսզի հետագայում հեշտությամբ գտնեք այս տեղեկությունը:',
    note2Title: 'Խնդրում ենք ուշադրություն դարձնել',
    note2Text: 'Բաց թողնված օրերի փոխհատուցման ճշգրիտ պայմանները (ժամկետ, հատուկ իրավիճակներ, ինչպիսիք են հղիությունը կամ կրծքով կերակրումը) կարող են տարբերվել՝ կախված իրավագիտական դպրոցից: Ցանկացած կոնկրետ կամ բարդ իրավիճակի համար որակավորված գիտնականի կարծիքը մնում է հիմնական հղումը:',
    tip3Title: 'Լավ է իմանալ',
    tip3Text: 'Դաշտանի ընթացքում կասեցված պահքը ճանաչված թեթևացում է, ոչ թե ընդմիջում ձեր կրոնական պրակտիկայում: Այս ժամանակը այլ կերպ ապրելը, ձեր օրերին հետևելը և կասկածի դեպքում ուղղորդում խնդրելը օգնում են խաղաղությամբ անցնել Ռամադանը:',
    shareMessage: 'Պահք Ռամադանի ընթացքում — AWA',
  },
  tg: {
    badge: 'РАМАЗОН',
    title: 'Рӯза гирифтан\nдар Рамазон',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Маслиҳатҳои амалӣ ва нуқтаҳои таълимӣ барои аз сар гузаронидани моҳи Рамазон ҳангоми ҳайз, бо оромӣ.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Рӯзаи қатъшуда ҳангоми ҳайз',
      'Тарзи дигари зиндагии маънавият',
      'Пайгирии рӯзҳо барои рӯзаи қазо',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'Ҳангоми ҳайз рӯза гирифтан лозим нест: ин вақт занро дар ҳолате қарор медиҳад, ки якчанд амали ибодат, аз ҷумла рӯза, муваққатан қатъ мегардад. Ин қатъ ҳамчун сабукӣ шинохта мешавад, на ҳамчун манъ ё ҷазо.',
    section1Body2: 'Қатъи рӯза ҳангоми ҳайз маънои канор рафтан аз амалияи динии шуморо надорад. Он танҳо барои муддати маҳдуд таваққуф мекунад, сипас пас аз анҷоми ҳайз ба таври муқаррарӣ аз сар гирифта мешавад, бидуни он ки ягон амали имон аз даст равад. Рӯзҳои нагирифташуда баъдтар, берун аз Рамазон, қазо карда мешаванд (қазо).',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Ин таваққуфро инчунин метавон ҳамчун замони дигар дар дохили моҳ аз сар гузаронид, ки дар он маънавият бо роҳҳои дигар, бидуни рӯза, худро баён карданро идома медиҳад.',
    note1Title: 'Таваҷҷӯҳ кунед',
    note1Text: 'Ин вазъиятро набояд бо эҳсоси гуноҳ аз сар гузаронид: он қисми давраи табиии бадан аст ва худи анъанаи динӣ онро ба назар гирифтааст.',
    section2Body: 'Рӯза нагирифтан маънои аз моҳи Рамазон канор шуданро надорад. Бисёр шаклҳои маънавият дастрас мемонанд ва ба шумо имкон медиҳанд ин вақтро пурра аз сар гузаронед.',
    spiritualActs: [
      'Зикр (ёди Худо)',
      'Дуо',
      'Гӯш кардани мазмуни динӣ',
      'Хондани мазмуни таълимӣ',
      'Садақа ва аъмоли нек',
      'Кумак дар тайёр кардани ифтор',
      'Вақт барои андешаи шахсӣ',
      'Нигоҳ доштани тартиби маънавӣ',
    ],
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Ин ишораҳои хурд, ҳатто оддӣ, ба шумо кумак мекунанд бо рӯҳи моҳ комилан пайваст бимонед, новобаста аз вазъияти шумо.',
    section3Body: 'Пайгирии рӯзҳои ҳайз ҳангоми Рамазон баъдан ҳисоб кардани шумораи рӯзҳои қазоро (қазо) осонтар мекунад ва аз такя кардан ба хотира пас аз анҷоми моҳ пешгирӣ менамояд.',
    trackingTips: [
      'Санаи ҳар рӯзи нагирифташударо ҳангоми гузаштан қайд кунед',
      'Тақвим, барнома ё дафтари махсусро истифода баред',
      'Дар охири моҳ санҷиши зудро барои тасдиқи ҷамъ анҷом диҳед',
    ],
    visualTitle: 'Пайгирии соддакардашуда',
    visualText: 'AWA метавонад ба шумо кумак кунад давраи худро дар тамоми Рамазон пайгирӣ кунед, то ин маълумотро баъдтар ба осонӣ ёбед.',
    note2Title: 'Таваҷҷӯҳ кунед',
    note2Text: 'Шартҳои дақиқи қазои рӯзҳои аз даст рафта (вақт, вазъиятҳои махсус ба монанди ҳомиладорӣ ё шири додан) вобаста ба мазҳаби фиқҳӣ метавонанд гуногун бошанд. Барои ҳар вазъияти мушаххас ё мураккаб, назари олими салоҳиятдор манбаи асосӣ боқӣ мемонад.',
    tip3Title: 'Донистан хуб аст',
    tip3Text: 'Рӯзаи ҳангоми ҳайз қатъшуда сабукии эътирофшуда аст, на танаффуси амалияи динии шумо. Ин вақтро ба таври дигар аз сар гузаронидан, рӯзҳои худро пайгирӣ кардан ва дар сурати шубҳа роҳнамоӣ пурсидан ҳама ба шумо кумак мекунанд Рамазонро бо оромӣ гузаронед.',
    shareMessage: 'Рӯза гирифтан дар Рамазон — AWA',
  },
  ky: {
    badge: 'РАМАЗАН',
    title: 'Рамазанда\nорозо кармоо',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Рамазан айын етек кирим учурунда тынчтык менен өткөрүү үчүн практикалык кеңештер жана билим берүүчү таяныч чекиттер.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Етек кирим учурунда токтотулган орозо',
      'Руханийликти башкача башынан өткөрүү',
      'Казо орозо үчүн күндөрдү эсептөө',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'Етек кирим учурунда орозо кармоо милдеттүү эмес: бул мезгил аялды орозо кошо бир нече ибадат убактылуу токтотулган абалга коёт. Бул токтотуу тыюу салуу же жаза катары эмес, жеңилдик катары таанылат.',
    section1Body2: 'Етек кирим учурунда орозону токтотуу диний практикадан алыстоону билдирбейт. Ал жөн гана чектелген убакытка токтойт, андан кийин етек кирим аяктаганда кадимкидей уланат, эч бир ишеним аракети жоголбостон. Кармалбаган күндөрдүн ордун Рамазандан тышкары кийин толтурушат (казо).',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Бул тыныгууну ай ичиндеги башка түрдөгү убакыт катары да башынан өткөрсө болот, мында руханийлик орозосуз башка жолдор менен көрүнүүнү улантат.',
    note1Title: 'Көңүл буруңуз',
    note1Text: 'Бул абалды күнөө сезими менен башынан өткөрбөө керек: ал дененин табигый циклинин бир бөлүгү жана диний салттын өзү тарабынан эске алынган.',
    section2Body: 'Орозо кармабоо Рамазан айынан ажыроо дегенди билдирбейт. Руханийликтин көптөгөн түрлөрү жеткиликтүү бойдон калат жана бул убакытты толугу менен башынан өткөрүүнү улантууга мүмкүндүк берет.',
    spiritualActs: [
      'Зикир (Аллахты эскерүү)',
      'Дуалар',
      'Диний мазмунду угуу',
      'Билим берүүчү мазмунду окуу',
      'Садака жана жакшылык иштер',
      'Ифтар даярдоого жардам берүү',
      'Жеке ой жүгүртүү убактысы',
      'Руханий тартипти сактоо',
    ],
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Бул кичинекей жаңсоолор, жөнөкөй болсо да, абалыңыз кандай болбосун айдын руху менен толук байланышта болууга жардам берет.',
    section3Body: 'Рамазанда етек кирим күндөрүн эсептеп туруу кийин казо кылына турган күндөрдүн санын эсептөөнү жеңилдетет жана ай бүткөндөн кийин эстутумга таянуудан сактайт.',
    trackingTips: [
      'Орозо кармалбаган ар бир күндүн датасын жолуна жазып коюңуз',
      'Календарды, колдонмону же атайын дептерди колдонуңуз',
      'Жалпы санды текшерүү үчүн айдын аягында тез текшерүү жасаңыз',
    ],
    visualTitle: 'Жөнөкөйлөштүрүлгөн көзөмөл',
    visualText: 'AWA Рамазан бою циклиңизди көзөмөлдөөгө жардам бере алат, ошондо бул маалыматты кийин оңой таба аласыз.',
    note2Title: 'Көңүл буруңуз',
    note2Text: 'Өткөрүлгөн күндөрдүн ордун толтуруунун так шарттары (убактысы, курсактуулук же эмчек эмизүү сыяктуу өзгөчө абалдар) фикх мектебине жараша айырмаланышы мүмкүн. Ар кандай өзгөчө же татаал абал үчүн квалификациялуу окумуштуунун пикири шилтеме бойдон калат.',
    tip3Title: 'Билүү пайдалуу',
    tip3Text: 'Етек кирим учурунда токтотулган орозо — таанылган жеңилдик, диний практикадан тыныгуу эмес. Бул убакытты башкача башынан өткөрүү, күндөрүңүздү эсептеп туруу жана күмөн болгондо жетекчилик сурап кайрылуу Рамазандан тынчтык менен өтүүгө жардам берет.',
    shareMessage: 'Рамазанда орозо кармоо — AWA',
  },
  tk: {
    badge: 'REMEZAN',
    title: 'Remezan wagtynda\noraza',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Aýbaşy wagtynda Remezan aýyny asudalyk bilen başdan geçirmek üçin amaly maslahatlar we bilim beriji görkezmeler.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Aýbaşy wagtynda togtadylan oraza',
      'Ruhy durmuşy başgaça başdan geçirmek',
      'Kazo orazasy üçin günleri yzarlamak',
      'Esasy netijeler',
    ],
    section1Body1: 'Aýbaşy wagtynda oraza tutmak talap edilmeýär: bu döwür aýaly oraza ýaly birnäçe ybadatyň wagtlaýyn togtadylýan ýagdaýyna goýýar. Bu togtadyş gadaganlyk ýa-da jeza däl, eýsem ýeňillik hökmünde ykrar edilýär.',
    section1Body2: 'Aýbaşy wagtynda orazany togtatmak dini tejribeden daşlaşmagy aňlatmaýar. Ol diňe çäkli wagt üçin duruzylýar, soňra aýbaşy gutarandan soň adaty ýagdaýda täzeden başlanýar, hiç bir iman amaly ýitirilmän. Tutulmadyk günler soňra (kazo), Remezandan daşda dolunar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Bu aralyk aýyň içinde başga bir wagt hökmünde hem başdan geçirilip bilner, bu ýerde ruhy durmuş orazasyz başga usullar bilen ýüze çykmagyny dowam etdirýär.',
    note1Title: 'Üns beriň',
    note1Text: 'Bu ýagdaý günäkärlik duýgusy bilen başdan geçirilmeli däl: ol bedeniň tebigy sikliniň bir bölegi we dini däbiň özi tarapyndan hasaba alynýar.',
    section2Body: 'Oraza tutmazlyk Remezan aýyndan aýrylmagy aňlatmaýar. Ruhy durmuşyň köp görnüşi elýeter bolup galýar we bu wagty doly başdan geçirmäge mümkinçilik berýär.',
    spiritualActs: [
      'Zikir (Hudaýy ýatlamak)',
      'Dua (doga)',
      'Dini mazmuny diňlemek',
      'Bilim beriji mazmuny okamak',
      'Sadaka we ýagşylyk amallary',
      'Iftar taýýarlamaga kömek etmek',
      'Şahsy oýlanma wagty',
      'Ruhy tertibi saklamak',
    ],
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Bu kiçijik hereketler, hatda ýönekeý bolsa-da, ýagdaýyňyza garamazdan aýyň ruhy bilen doly baglanyşykda galmaga kömek edýär.',
    section3Body: 'Remezan wagtynda aýbaşy günleriňizi yzarlamak soňra dolmaly günleriň (kazo) sanyny hasaplamagy aňsatlaşdyrýar we aý gutarandan soň ýada daýanmak zerurlygyndan gaça durýar.',
    trackingTips: [
      'Tutulmadyk her günüň senesini barşyna belläň',
      'Senenama, programma ýa-da aýratyn depder ulanyň',
      'Umumy sany barlamak üçin aýyň ahyrynda çalt barlag ediň',
    ],
    visualTitle: 'Ýönekeýleşdirilen yzarlama',
    visualText: 'AWA Remezan dowamynda sikliňizi yzarlamaga kömek edip biler, şeýlelik bilen bu maglumaty soňra aňsat tapyp bilersiňiz.',
    note2Title: 'Üns beriň',
    note2Text: 'Sypdyrylan günleri dolmagyň takyk şertleri (wagt, göwrelilik ýa-da emdirmek ýaly aýratyn ýagdaýlar) hukuk mekdebine görä tapawutlanyp biler. Islendik aýratyn ýa-da çylşyrymly ýagdaý üçin bilimli alymyň pikiri esasy çeşme bolup galýar.',
    tip3Title: 'Bilmek peýdaly',
    tip3Text: 'Aýbaşy wagtynda togtadylan oraza ykrar edilen ýeňillik, dini tejribeden arakesme däl. Bu döwri başgaça başdan geçirmek, günleriňizi yzarlamak we şübhe bolanda ugrukdyrma soramak Remezany asudalyk bilen geçirmäge kömek edýär.',
    shareMessage: 'Remezan wagtynda oraza — AWA',
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
