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

const ID = 'fastingqadaa-dispense-et-rattrapage';

const HERO = require('../../assets/images/library/rules-hero.png');

const ART = {
  balance: require('../../assets/images/library/regular-cycle-balance.png'),
  pregnancy: require('../../assets/images/library/category-pregnancy.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('FastingQadaa', {
  fr: {
    badge: 'JEÛNE & QADAA',
    title: 'Jeûne et dispense :\nle rattrapage (Qadaa)',
    metaDuration: '6 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment et quand rattraper les jours de jeûne manqués, à son propre rythme et sans culpabilité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Quand rattraper les jours manqués ?',
      'Un délai courant : avant le Ramadan suivant',
      'Grossesse et allaitement',
      'À retenir',
    ],
    section1Body: 'Le Qadaa désigne le fait de rattraper, plus tard, les jours de jeûne manqués pendant le Ramadan — notamment en raison des règles. Ces jours doivent être rattrapés car le jeûne du Ramadan reste un pilier du mois, et les jours suspendus pour cause de règles sont comptés comme dus, sans qu’il s’agisse d’une faute de ta part.',
    section1Body2: 'Le rattrapage peut généralement commencer dès la fin du Ramadan, dès que ta situation le permet. Tu peux organiser ces jours selon ton propre rythme : certaines personnes préfèrent les regrouper rapidement après le Ramadan, d’autres les répartissent progressivement au fil des mois suivants.',
    noteTitle: 'À noter',
    noteText: 'Rattraper les jours de manière consécutive ou de façon répartie peut faire l’objet d’avis différents selon les écoles juridiques ; aucune des deux approches n’est présentée ici comme la seule valable.',
    recordTips: [
      'Noter le nombre total de jours à rattraper dès la fin du Ramadan',
      'Choisir une méthode simple : calendrier, application, carnet',
      'Cocher chaque jour rattrapé au fur et à mesure',
    ],
    section1Body3: 'Par exemple, une personne ayant 6 jours à rattraper peut choisir d’en jeûner un par semaine pendant six semaines, ou de les regrouper sur une même période si cela lui convient mieux.',
    section2Body: 'Il est courant de chercher à rattraper les jours manqués avant le Ramadan suivant. Cette pratique n’est pas systématiquement obligatoire dans tous les cas, mais elle facilite l’organisation et évite d’accumuler un nombre important de jours en attente.',
    visual1Title: 'Un rythme qui s’adapte à toi',
    visual1Text: 'Répartir les jours à rattraper selon ton emploi du temps permet d’avancer sereinement, sans pression.',
    section2Body2: 'Planifier à l’avance permet d’éviter le stress de dernière minute. Une astuce simple consiste à compter le nombre de jours restants avant le prochain Ramadan et à répartir les jours à rattraper sur les semaines ou mois disponibles.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Si une raison durable ou récurrente empêche de jeûner (un état de santé prolongé, par exemple), la situation peut relever d’un cadre différent ; il est alors particulièrement utile d’en parler avec un savant qualifié.',
    alert2Title: 'Information importante',
    alert2Text: 'Les modalités précises en cas de délai dépassé peuvent différer selon les interprétations. Pour toute situation compliquée, l’avis d’un savant ou d’une savante qualifiée reste la référence.',
    section2Body3: 'Par exemple, si le prochain Ramadan commence dans 8 mois et qu’il reste 6 jours à rattraper, une possibilité est de prévoir environ un jour par mois, avec de la flexibilité selon les imprévus.',
    section3Body: 'La grossesse et l’allaitement peuvent affecter la capacité à jeûner, notamment lorsque le jeûne présente un risque pour la santé de la mère ou de l’enfant. Le bien-être physique et la capacité réelle à jeûner sont des éléments importants à prendre en compte.',
    visual2Title: 'Une situation prise en compte',
    visual2Text: 'Ces circonstances sont reconnues par la tradition religieuse comme pouvant donner lieu à une dispense.',
    section3Body2: 'Les avis religieux concernant le jeûne non effectué pendant la grossesse ou l’allaitement peuvent varier selon les écoles, notamment sur la question de savoir si un simple rattrapage suffit ou si une compensation est également concernée. La raison précise de l’absence de jeûne et la situation personnelle peuvent influencer la réponse applicable.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Le Qadaa permet de rattraper sereinement les jours de jeûne manqués, à ton propre rythme. En cas de situation particulière (délai dépassé, grossesse, allaitement, empêchement durable), l’avis d’un savant qualifié reste la meilleure ressource.',
    shareMessage: 'Jeûne et dispense : le rattrapage (Qadaa) — AWA',
  },
  en: {
    badge: 'FASTING & QADAA',
    title: 'Fasting and exemption:\nthe make-up (Qadaa)',
    metaDuration: '6 min read',
    metaType: 'FAQ',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How and when to make up missed fasting days, at your own pace and without guilt.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'When to make up the missed days?',
      'A common timeframe: before the next Ramadan',
      'Pregnancy and breastfeeding',
      'Key takeaways',
    ],
    section1Body: 'Qadaa refers to making up, at a later time, the fasting days missed during Ramadan — notably because of menstruation. These days must be made up because the Ramadan fast remains a pillar of the month, and the days suspended due to menstruation are counted as owed, without this being any fault of yours.',
    section1Body2: 'The make-up can generally begin as soon as Ramadan ends, as soon as your situation allows it. You can organize these days at your own pace: some people prefer to group them together soon after Ramadan, while others spread them out gradually over the following months.',
    noteTitle: 'Please note',
    noteText: 'Making up the days consecutively or spreading them out may be viewed differently depending on the school of jurisprudence; neither approach is presented here as the only valid one.',
    recordTips: [
      'Write down the total number of days to make up as soon as Ramadan ends',
      'Choose a simple method: calendar, app, notebook',
      'Check off each day as it is made up',
    ],
    section1Body3: 'For example, a person with 6 days to make up can choose to fast one per week for six weeks, or group them into the same period if that suits them better.',
    section2Body: 'It is common to try to make up the missed days before the next Ramadan. This practice is not systematically mandatory in every case, but it makes organizing easier and avoids accumulating a large number of pending days.',
    visual1Title: 'A pace that adapts to you',
    visual1Text: 'Spreading out the days to make up according to your schedule lets you move forward calmly, without pressure.',
    section2Body2: 'Planning ahead helps avoid last-minute stress. A simple tip is to count the number of days remaining before the next Ramadan and spread the days to make up over the available weeks or months.',
    tip1Title: 'Good to know',
    tip1Text: 'If a lasting or recurring reason prevents fasting (a prolonged health condition, for example), the situation may fall under a different framework; it is then especially useful to discuss it with a qualified scholar.',
    alert2Title: 'Important information',
    alert2Text: 'The precise rules in case the timeframe is exceeded can differ depending on interpretation. For any complicated situation, the opinion of a qualified scholar remains the reference.',
    section2Body3: 'For example, if the next Ramadan begins in 8 months and 6 days remain to be made up, one possibility is to plan for about one day per month, with flexibility for unforeseen circumstances.',
    section3Body: 'Pregnancy and breastfeeding can affect the ability to fast, particularly when fasting poses a risk to the health of the mother or the child. Physical well-being and the real ability to fast are important factors to take into account.',
    visual2Title: 'A situation that is taken into account',
    visual2Text: 'These circumstances are recognized by religious tradition as potentially giving rise to an exemption.',
    section3Body2: 'Religious opinions regarding fasting not carried out during pregnancy or breastfeeding can vary depending on the school, particularly on the question of whether a simple make-up is sufficient or whether a compensation is also involved. The precise reason for not fasting and the personal situation can influence the applicable answer.',
    tip2Title: 'Good to know',
    tip2Text: 'Qadaa allows you to calmly make up the missed fasting days, at your own pace. In case of a particular situation (exceeded timeframe, pregnancy, breastfeeding, lasting impediment), the opinion of a qualified scholar remains the best resource.',
    shareMessage: 'Fasting and exemption: the make-up (Qadaa) — AWA',
  },
  es: {
    badge: 'AYUNO Y QADAA',
    title: 'Ayuno y dispensa:\nla recuperación (Qadaa)',
    metaDuration: '6 min de lectura',
    metaType: 'Preguntas frecuentes',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cómo y cuándo recuperar los días de ayuno no realizados, a tu propio ritmo y sin culpa.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Cuándo recuperar los días no realizados?',
      'Un plazo habitual: antes del siguiente Ramadán',
      'Embarazo y lactancia',
      'Para recordar',
    ],
    section1Body: 'El Qadaa designa el hecho de recuperar, más tarde, los días de ayuno no realizados durante el Ramadán, en particular a causa de la menstruación. Estos días deben recuperarse porque el ayuno del Ramadán sigue siendo un pilar del mes, y los días suspendidos por causa de la menstruación se cuentan como pendientes, sin que esto suponga ninguna falta por tu parte.',
    section1Body2: 'La recuperación puede comenzar generalmente desde el final del Ramadán, en cuanto tu situación lo permita. Puedes organizar estos días a tu propio ritmo: algunas personas prefieren agruparlos rápidamente después del Ramadán, otras los reparten progresivamente a lo largo de los meses siguientes.',
    noteTitle: 'Para tener en cuenta',
    noteText: 'Recuperar los días de forma consecutiva o de forma repartida puede ser objeto de opiniones distintas según las escuelas jurídicas; ninguno de los dos enfoques se presenta aquí como el único válido.',
    recordTips: [
      'Anotar el número total de días a recuperar desde el final del Ramadán',
      'Elegir un método sencillo: calendario, aplicación, cuaderno',
      'Marcar cada día recuperado a medida que avanzas',
    ],
    section1Body3: 'Por ejemplo, una persona con 6 días por recuperar puede elegir ayunar uno por semana durante seis semanas, o agruparlos en un mismo periodo si le resulta más conveniente.',
    section2Body: 'Es habitual tratar de recuperar los días no realizados antes del siguiente Ramadán. Esta práctica no es sistemáticamente obligatoria en todos los casos, pero facilita la organización y evita acumular un número importante de días pendientes.',
    visual1Title: 'Un ritmo que se adapta a ti',
    visual1Text: 'Repartir los días por recuperar según tu horario te permite avanzar con tranquilidad, sin presión.',
    section2Body2: 'Planificar con antelación ayuda a evitar el estrés de última hora. Un truco sencillo consiste en contar el número de días restantes antes del próximo Ramadán y repartir los días por recuperar entre las semanas o meses disponibles.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Si una razón duradera o recurrente impide ayunar (un estado de salud prolongado, por ejemplo), la situación puede corresponder a un marco diferente; en ese caso es especialmente útil hablarlo con un erudito cualificado.',
    alert2Title: 'Información importante',
    alert2Text: 'Las modalidades precisas en caso de plazo excedido pueden diferir según las interpretaciones. Para cualquier situación complicada, la opinión de un erudito o una erudita cualificada sigue siendo la referencia.',
    section2Body3: 'Por ejemplo, si el próximo Ramadán comienza dentro de 8 meses y quedan 6 días por recuperar, una posibilidad es prever aproximadamente un día por mes, con flexibilidad según los imprevistos.',
    section3Body: 'El embarazo y la lactancia pueden afectar a la capacidad de ayunar, en particular cuando el ayuno supone un riesgo para la salud de la madre o del bebé. El bienestar físico y la capacidad real de ayunar son elementos importantes a tener en cuenta.',
    visual2Title: 'Una situación tenida en cuenta',
    visual2Text: 'Estas circunstancias son reconocidas por la tradición religiosa como susceptibles de dar lugar a una dispensa.',
    section3Body2: 'Las opiniones religiosas sobre el ayuno no realizado durante el embarazo o la lactancia pueden variar según las escuelas, en particular sobre si basta con una simple recuperación o si también se contempla una compensación. La razón precisa de la ausencia de ayuno y la situación personal pueden influir en la respuesta aplicable.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'El Qadaa permite recuperar con tranquilidad los días de ayuno no realizados, a tu propio ritmo. En caso de situación particular (plazo excedido, embarazo, lactancia, impedimento duradero), la opinión de un erudito cualificado sigue siendo el mejor recurso.',
    shareMessage: 'Ayuno y dispensa: la recuperación (Qadaa) — AWA',
  },
  it: {
    badge: 'DIGIUNO E QADAA',
    title: 'Digiuno ed esenzione:\nil recupero (Qadaa)',
    metaDuration: '6 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Come e quando recuperare i giorni di digiuno saltati, con i tuoi tempi e senza sensi di colpa.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Quando recuperare i giorni saltati?',
      'Un termine comune: prima del Ramadan successivo',
      'Gravidanza e allattamento',
      'Punti chiave',
    ],
    section1Body: 'Il Qadaa indica il recupero, in un secondo momento, dei giorni di digiuno saltati durante il Ramadan, in particolare a causa delle mestruazioni. Questi giorni vanno recuperati perché il digiuno del Ramadan resta un pilastro del mese, e i giorni sospesi a causa delle mestruazioni sono considerati dovuti, senza che ciò sia una tua colpa.',
    section1Body2: 'Il recupero può in genere iniziare appena finisce il Ramadan, non appena la tua situazione lo permette. Puoi organizzare questi giorni con i tuoi tempi: alcune persone preferiscono raggrupparli poco dopo il Ramadan, altre li distribuiscono gradualmente nei mesi successivi.',
    noteTitle: 'Nota bene',
    noteText: 'Recuperare i giorni in modo consecutivo oppure distribuirli può essere visto in modo diverso a seconda della scuola giuridica; nessuno dei due approcci è presentato qui come l’unico valido.',
    recordTips: [
      'Annota il numero totale di giorni da recuperare non appena finisce il Ramadan',
      'Scegli un metodo semplice: calendario, app, quaderno',
      'Spunta ogni giorno man mano che lo recuperi',
    ],
    section1Body3: 'Ad esempio, una persona con 6 giorni da recuperare può scegliere di digiunare un giorno a settimana per sei settimane, oppure di raggrupparli nello stesso periodo se le è più comodo.',
    section2Body: 'È comune cercare di recuperare i giorni saltati prima del Ramadan successivo. Questa pratica non è obbligatoria in modo sistematico in ogni caso, ma facilita l’organizzazione ed evita di accumulare un gran numero di giorni in sospeso.',
    visual1Title: 'Un ritmo che si adatta a te',
    visual1Text: 'Distribuire i giorni da recuperare in base ai tuoi impegni ti permette di procedere con calma, senza pressione.',
    section2Body2: 'Pianificare in anticipo aiuta a evitare lo stress dell’ultimo minuto. Un consiglio semplice è contare il numero di giorni che mancano al Ramadan successivo e distribuire i giorni da recuperare sulle settimane o sui mesi disponibili.',
    tip1Title: 'Da sapere',
    tip1Text: 'Se un motivo duraturo o ricorrente impedisce di digiunare (ad esempio una condizione di salute prolungata), la situazione può rientrare in un quadro diverso; in questo caso è particolarmente utile parlarne con uno studioso qualificato.',
    alert2Title: 'Informazione importante',
    alert2Text: 'Le regole precise nel caso in cui il termine venga superato possono differire a seconda dell’interpretazione. Per qualsiasi situazione complicata, il parere di uno studioso qualificato resta il riferimento.',
    section2Body3: 'Ad esempio, se il prossimo Ramadan inizia tra 8 mesi e restano 6 giorni da recuperare, una possibilità è pianificare circa un giorno al mese, con flessibilità per gli imprevisti.',
    section3Body: 'La gravidanza e l’allattamento possono influire sulla capacità di digiunare, in particolare quando il digiuno comporta un rischio per la salute della madre o del bambino. Il benessere fisico e la reale capacità di digiunare sono fattori importanti da considerare.',
    visual2Title: 'Una situazione che viene presa in considerazione',
    visual2Text: 'Queste circostanze sono riconosciute dalla tradizione religiosa come potenziale motivo di esenzione.',
    section3Body2: 'I pareri religiosi sul digiuno non effettuato durante la gravidanza o l’allattamento possono variare a seconda della scuola, in particolare sulla questione se un semplice recupero sia sufficiente o se sia prevista anche una compensazione. Il motivo preciso per cui non si è digiunato e la situazione personale possono influenzare la risposta applicabile.',
    tip2Title: 'Da sapere',
    tip2Text: 'Il Qadaa ti permette di recuperare con calma i giorni di digiuno saltati, con i tuoi tempi. In caso di situazione particolare (termine superato, gravidanza, allattamento, impedimento duraturo), il parere di uno studioso qualificato resta la risorsa migliore.',
    shareMessage: 'Digiuno ed esenzione: il recupero (Qadaa) — AWA',
  },
  tr: {
    badge: 'ORUÇ VE KAZA',
    title: 'Oruç ve muafiyet:\nkaza (telafi)',
    metaDuration: '6 dk okuma',
    metaType: 'SSS',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Tutulamayan oruç günlerini nasıl ve ne zaman kaza edeceğin; kendi hızında ve suçluluk duymadan.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak doğrulanmalıdır. AWA fetva ya da kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Tutulamayan günler ne zaman kaza edilir?',
      'Sık görülen bir süre: bir sonraki Ramazan’dan önce',
      'Gebelik ve emzirme',
      'Akılda tutulacaklar',
    ],
    section1Body: 'Kaza, Ramazan’da özellikle adet nedeniyle tutulamayan oruç günlerinin daha sonra telafi edilmesi anlamına gelir. Ramazan orucu ayın bir direği olmaya devam ettiği için bu günlerin kaza edilmesi gerekir; adet nedeniyle askıya alınan günler borç sayılır, bu da senin bir kusurun değildir.',
    section1Body2: 'Kaza, durumun elverdiği ölçüde, genellikle Ramazan biter bitmez başlayabilir. Bu günleri kendi hızında düzenleyebilirsin: kimileri günleri Ramazan’dan hemen sonra topluca tutmayı tercih eder, kimileri ise sonraki aylara yayarak tutar.',
    noteTitle: 'Dikkat',
    noteText: 'Günleri art arda tutmak ya da yaymak, fıkıh mezhebine göre farklı değerlendirilebilir; burada hiçbir yaklaşım tek geçerli yol olarak sunulmamaktadır.',
    recordTips: [
      'Ramazan biter bitmez kaza edilecek toplam gün sayısını yaz',
      'Basit bir yöntem seç: takvim, uygulama, defter',
      'Kaza ettiğin her günü işaretle',
    ],
    section1Body3: 'Örneğin kaza edecek 6 günü olan biri, altı hafta boyunca haftada bir gün oruç tutmayı seçebilir ya da daha uygun gelirse günleri aynı dönemde toplu halde tutabilir.',
    section2Body: 'Tutulamayan günleri bir sonraki Ramazan’dan önce kaza etmeye çalışmak yaygındır. Bu uygulama her durumda sistematik olarak zorunlu değildir; ancak düzenlemeyi kolaylaştırır ve çok sayıda bekleyen günün birikmesini önler.',
    visual1Title: 'Sana uyum sağlayan bir tempo',
    visual1Text: 'Kaza edilecek günleri programına göre yaymak, baskı hissetmeden sakince ilerlemeni sağlar.',
    section2Body2: 'Önceden planlamak, son dakika stresinden kaçınmaya yardımcı olur. Basit bir ipucu: bir sonraki Ramazan’a kalan süreyi say ve kaza edilecek günleri mevcut haftalara ya da aylara dağıt.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Kalıcı ya da tekrarlayan bir neden oruç tutmanı engelliyorsa (örneğin uzun süreli bir sağlık durumu), durum farklı bir çerçeveye girebilir; bu durumda yetkin bir âlimle görüşmek özellikle faydalıdır.',
    alert2Title: 'Önemli bilgi',
    alert2Text: 'Sürenin aşılması hâlinde uygulanacak kesin kurallar yoruma göre farklılık gösterebilir. Karmaşık her durumda yetkin bir âlimin görüşü başvuru kaynağı olmaya devam eder.',
    section2Body3: 'Örneğin bir sonraki Ramazan 8 ay sonra başlıyorsa ve kaza edilecek 6 gün kalmışsa, öngörülemeyen durumlara esneklik bırakarak ayda yaklaşık bir gün planlamak bir olasılıktır.',
    section3Body: 'Gebelik ve emzirme, özellikle oruç annenin ya da çocuğun sağlığı için risk oluşturduğunda oruç tutma gücünü etkileyebilir. Bedensel iyi oluş ve gerçekten oruç tutabilme durumu dikkate alınması gereken önemli etkenlerdir.',
    visual2Title: 'Dikkate alınan bir durum',
    visual2Text: 'Bu durumların, dinî gelenek tarafından muafiyet doğurabilecek haller olarak kabul edildiği bilinir.',
    section3Body2: 'Gebelik ya da emzirme döneminde tutulamayan oruçla ilgili dinî görüşler mezhebe göre değişebilir; özellikle yalnızca kazanın yeterli olup olmadığı, yoksa ek olarak bir telafinin de söz konusu olup olmadığı konusunda. Oruç tutulmamasının kesin nedeni ve kişisel durum, geçerli cevabı etkileyebilir.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Kaza, tutulamayan oruç günlerini kendi hızında, sakince telafi etmeni sağlar. Özel bir durumda (aşılan süre, gebelik, emzirme, kalıcı engel) yetkin bir âlimin görüşü en iyi başvuru kaynağı olmaya devam eder.',
    shareMessage: 'Oruç ve muafiyet: kaza (telafi) — AWA',
  },
  ru: {
    badge: 'ПОСТ И КАЗА',
    title: 'Пост и освобождение:\nвосполнение (каза)',
    metaDuration: '6 мин чтения',
    metaType: 'Вопросы и ответы',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Как и когда восполнять пропущенные дни поста — в своём темпе и без чувства вины.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы должны подтверждаться компетентными учёными. AWA не выносит фетв и не даёт персональных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Когда восполнять пропущенные дни?',
      'Распространённый срок: до следующего Рамадана',
      'Беременность и грудное вскармливание',
      'Главное',
    ],
    section1Body: 'Каза — это восполнение позднее дней поста, пропущенных в Рамадан, в том числе из-за месячных. Эти дни необходимо восполнить, поскольку пост в Рамадан остаётся одним из столпов этого месяца, а дни, пропущенные из-за месячных, считаются подлежащими восполнению, и в этом нет вашей вины.',
    section1Body2: 'Как правило, восполнять можно начать сразу после окончания Рамадана, как только это позволяет ваше состояние. Вы можете распределить эти дни в своём темпе: одни предпочитают быстро объединить их после Рамадана, другие распределяют постепенно в течение следующих месяцев.',
    noteTitle: 'Обратите внимание',
    noteText: 'Восполнение дней подряд или с разделением на части может оцениваться по-разному в зависимости от богословско-правовой школы; ни один из подходов здесь не представлен как единственно верный.',
    recordTips: [
      'Записать общее число дней для восполнения сразу после окончания Рамадана',
      'Выбрать простой способ: календарь, приложение, блокнот',
      'Отмечать каждый восполненный день по мере выполнения',
    ],
    section1Body3: 'Например, если нужно восполнить 6 дней, можно поститься по одному дню в неделю в течение шести недель или объединить их в один период, если так удобнее.',
    section2Body: 'Принято стремиться восполнить пропущенные дни до наступления следующего Рамадана. Эта практика не является безусловно обязательной во всех случаях, но она облегчает планирование и позволяет не накапливать большое число неотработанных дней.',
    visual1Title: 'Ритм, который подстраивается под вас',
    visual1Text: 'Распределяя дни для восполнения с учётом вашего расписания, вы можете двигаться вперёд спокойно и без давления.',
    section2Body2: 'Планирование заранее помогает избежать стресса в последний момент. Простой приём — посчитать, сколько дней осталось до следующего Рамадана, и распределить дни для восполнения по доступным неделям или месяцам.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Если длительная или повторяющаяся причина мешает поститься (например, затяжное состояние здоровья), ситуация может относиться к другому порядку; в таком случае особенно полезно обсудить её с компетентным учёным.',
    alert2Title: 'Важная информация',
    alert2Text: 'Точные правила на случай, если срок пропущен, могут различаться в зависимости от толкований. В любой непростой ситуации ориентиром остаётся мнение компетентного учёного.',
    section2Body3: 'Например, если следующий Рамадан начнётся через 8 месяцев, а осталось восполнить 6 дней, можно запланировать примерно по одному дню в месяц, оставив запас на непредвиденные обстоятельства.',
    section3Body: 'Беременность и грудное вскармливание могут влиять на способность поститься, особенно когда пост создаёт риск для здоровья матери или ребёнка. Физическое самочувствие и реальная возможность поститься — важные факторы, которые необходимо учитывать.',
    visual2Title: 'Ситуация, которая принимается во внимание',
    visual2Text: 'Религиозная традиция признаёт, что эти обстоятельства могут служить основанием для освобождения от поста.',
    section3Body2: 'Религиозные мнения о посте, не соблюдённом во время беременности или грудного вскармливания, могут различаться в зависимости от школы, в частности по вопросу о том, достаточно ли простого восполнения или также предусмотрена компенсация. На применимый ответ могут влиять точная причина, по которой пост не соблюдался, и личная ситуация.',
    tip2Title: 'Полезно знать',
    tip2Text: 'Каза позволяет спокойно восполнить пропущенные дни поста в своём темпе. В особой ситуации (пропущенный срок, беременность, грудное вскармливание, длительное препятствие) лучшим источником остаётся мнение компетентного учёного.',
    shareMessage: 'Пост и освобождение: восполнение (каза) — AWA',
  },
  de: {
    badge: 'FASTEN & QADA',
    title: 'Fasten und Befreiung:\ndas Nachholen (Qada)',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Häufige Fragen',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wie und wann du verpasste Fastentage nachholen kannst – in deinem eigenen Tempo und ohne Schuldgefühle.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt dient ausschließlich der Bildung. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA spricht keine Fatwas oder persönlichen religiösen Urteile aus.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Wann sollten die verpassten Tage nachgeholt werden?',
      'Ein üblicher Zeitrahmen: vor dem nächsten Ramadan',
      'Schwangerschaft und Stillzeit',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Qada bedeutet, die im Ramadan verpassten Fastentage zu einem späteren Zeitpunkt nachzuholen – insbesondere wegen der Menstruation. Diese Tage müssen nachgeholt werden, weil das Fasten im Ramadan eine Säule des Monats bleibt und die wegen der Menstruation ausgesetzten Tage als geschuldet gelten, ohne dass dich daran eine Schuld trifft.',
    section1Body2: 'Das Nachholen kann in der Regel beginnen, sobald der Ramadan endet und deine Situation es zulässt. Du kannst diese Tage in deinem eigenen Tempo einteilen: Manche bevorzugen es, sie bald nach dem Ramadan zusammenzulegen, andere verteilen sie nach und nach über die folgenden Monate.',
    noteTitle: 'Bitte beachten',
    noteText: 'Ob die Tage hintereinander nachgeholt oder verteilt werden, wird je nach Rechtsschule unterschiedlich betrachtet; keine der beiden Vorgehensweisen wird hier als die einzig gültige dargestellt.',
    recordTips: [
      'Notiere die Gesamtzahl der nachzuholenden Tage, sobald der Ramadan endet',
      'Wähle eine einfache Methode: Kalender, App, Notizbuch',
      'Hake jeden nachgeholten Tag ab',
    ],
    section1Body3: 'Hat eine Person zum Beispiel 6 Tage nachzuholen, kann sie sich entscheiden, sechs Wochen lang einen Tag pro Woche zu fasten oder die Tage im selben Zeitraum zusammenzulegen, wenn ihr das besser passt.',
    section2Body: 'Es ist üblich, zu versuchen, die verpassten Tage vor dem nächsten Ramadan nachzuholen. Diese Praxis ist nicht in jedem Fall zwingend vorgeschrieben, erleichtert aber die Planung und verhindert, dass sich viele offene Tage ansammeln.',
    visual1Title: 'Ein Tempo, das sich dir anpasst',
    visual1Text: 'Wenn du die nachzuholenden Tage nach deinem Zeitplan verteilst, kommst du ruhig und ohne Druck voran.',
    section2Body2: 'Vorausplanen hilft, Stress in letzter Minute zu vermeiden. Ein einfacher Tipp: Zähle die Tage bis zum nächsten Ramadan und verteile die nachzuholenden Tage auf die verfügbaren Wochen oder Monate.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Verhindert ein dauerhafter oder wiederkehrender Grund das Fasten (zum Beispiel eine langwierige gesundheitliche Einschränkung), kann die Situation unter einen anderen Rahmen fallen; dann ist es besonders hilfreich, sie mit einem qualifizierten Gelehrten zu besprechen.',
    alert2Title: 'Wichtiger Hinweis',
    alert2Text: 'Die genauen Regeln für den Fall, dass der Zeitrahmen überschritten wird, können je nach Auslegung unterschiedlich sein. Bei jeder komplizierten Situation bleibt die Einschätzung eines qualifizierten Gelehrten maßgeblich.',
    section2Body3: 'Beginnt der nächste Ramadan zum Beispiel in 8 Monaten und sind noch 6 Tage nachzuholen, kann man etwa einen Tag pro Monat einplanen – mit Spielraum für Unvorhergesehenes.',
    section3Body: 'Schwangerschaft und Stillzeit können die Fähigkeit zu fasten beeinflussen, besonders wenn das Fasten ein Risiko für die Gesundheit der Mutter oder des Kindes darstellt. Das körperliche Wohlbefinden und die tatsächliche Fähigkeit zu fasten sind wichtige Faktoren, die berücksichtigt werden sollten.',
    visual2Title: 'Eine Situation, die berücksichtigt wird',
    visual2Text: 'Die religiöse Tradition erkennt an, dass diese Umstände möglicherweise eine Befreiung begründen können.',
    section3Body2: 'Religiöse Einschätzungen zum nicht eingehaltenen Fasten während Schwangerschaft oder Stillzeit können je nach Rechtsschule unterschiedlich ausfallen, insbesondere in der Frage, ob ein einfaches Nachholen genügt oder zusätzlich ein Ausgleich vorgesehen ist. Der genaue Grund für das Nichtfasten und die persönliche Situation können die maßgebliche Antwort beeinflussen.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Qada ermöglicht es dir, verpasste Fastentage in Ruhe und in deinem eigenen Tempo nachzuholen. In einer besonderen Situation (überschrittener Zeitrahmen, Schwangerschaft, Stillzeit, dauerhaftes Hindernis) bleibt die Einschätzung eines qualifizierten Gelehrten die beste Anlaufstelle.',
    shareMessage: 'Fasten und Befreiung: das Nachholen (Qada) — AWA',
  },
  zh: {
      badge: '斋戒与补斋',
      title: '斋戒与豁免：\n补斋（Qadaa）',
      metaDuration: '阅读约 6 分钟',
      metaType: '常见问题',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '如何以及何时补做错过的斋戒日，按你自己的节奏，不必有负担。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容仅供科普。宗教方面的问题应由有资质的学者确认。AWA 不发布法特瓦，也不提供针对个人的宗教裁断。',
      contentsTitle: '本文内容',
      topics: [
        '何时补做错过的日子？',
        '常见的时间安排：在下一个斋月之前',
        '怀孕与哺乳',
        '要点回顾',
      ],
      section1Body: '补斋（Qadaa）指在之后的时间补做斋月期间错过的斋戒日，尤其是因月经而错过的日子。这些日子需要补做，因为斋月的斋戒是这个月的一项支柱，因月经而中断的日子被视为亏欠的天数，而这并不是你的过错。',
      section1Body2: '补斋通常可以在斋月结束后，在你的情况允许时就开始。你可以按自己的节奏安排这些日子：有些人喜欢在斋月之后不久集中补完，也有些人会在之后的几个月里逐步分散进行。',
      noteTitle: '请注意',
      noteText: '连续补做还是分散补做，不同教法学派的看法可能不同；这里并不把任何一种方式视为唯一正确的做法。',
      recordTips: [
        '斋月一结束，就记下需要补做的总天数',
        '选择一种简单的方式：日历、应用或笔记本',
        '每补完一天就勾选一次',
      ],
      section1Body3: '例如，需要补 6 天的人，可以选择每周斋一天，连续六周，也可以把它们集中在同一时期，只要这样更合适。',
      section2Body: '人们通常会尽量在下一个斋月之前补完错过的日子。这种做法并非在所有情况下都一概必须，但它能让安排更轻松，也能避免积压大量待补的日子。',
      visual1Title: '适应你的节奏',
      visual1Text: '根据你的日程分散安排需要补做的日子，可以让你从容地推进，不必有压力。',
      section2Body2: '提前计划有助于避免临近时的紧张。一个简单的办法是，数一数距离下一个斋月还有多少时间，把需要补做的日子分摊到可用的几周或几个月里。',
      tip1Title: '小贴士',
      tip1Text: '如果存在长期或反复出现的原因而无法斋戒（例如持续较久的健康状况），这种情况可能适用不同的框架；此时尤其建议与有资质的学者讨论。',
      alert2Title: '重要提示',
      alert2Text: '如果超过了期限，具体的规定可能因解释不同而有差异。遇到任何复杂的情况，都应以有资质学者的意见为准。',
      section2Body3: '例如，如果距离下一个斋月还有 8 个月，还有 6 天需要补做，一种可能的做法是大约每月安排一天，并为意外情况留有余地。',
      section3Body: '怀孕和哺乳可能会影响斋戒的能力，尤其是当斋戒会对母亲或孩子的健康造成风险时。身体状况和实际能否斋戒是需要考虑的重要因素。',
      visual2Title: '一种被考虑在内的情况',
      visual2Text: '宗教传统承认，这些情形有可能构成豁免的理由。',
      section3Body2: '对于怀孕或哺乳期间未能斋戒的情况，不同学派的宗教意见可能有所不同，尤其是在仅补斋是否足够、是否还需要补偿这一问题上。未能斋戒的具体原因和个人情况，可能会影响适用的答案。',
      tip2Title: '小贴士',
      tip2Text: '补斋让你可以按自己的节奏，从容补做错过的斋戒日。遇到特殊情况（超过期限、怀孕、哺乳、长期障碍）时，有资质学者的意见始终是最好的参考。',
      shareMessage: '斋戒与豁免：补斋（Qadaa） — AWA',
    },
  id: {
    badge: 'PUASA & QADA',
    title: 'Puasa dan keringanan:\nmengganti puasa (Qada)',
    metaDuration: '6 menit baca',
    metaType: 'FAQ',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Bagaimana dan kapan mengganti hari puasa yang terlewat, dengan ritmemu sendiri dan tanpa rasa bersalah.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang kompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kapan mengganti hari yang terlewat?',
      'Batas waktu yang umum: sebelum Ramadan berikutnya',
      'Kehamilan dan menyusui',
      'Poin-poin penting',
    ],
    section1Body: 'Qada berarti mengganti, di waktu lain, hari-hari puasa yang terlewat selama Ramadan — terutama karena haid. Hari-hari ini harus diganti karena puasa Ramadan tetap menjadi rukun bulan tersebut, dan hari-hari yang ditangguhkan karena haid dihitung sebagai utang, tanpa itu menjadi kesalahanmu.',
    section1Body2: 'Penggantian umumnya bisa dimulai begitu Ramadan berakhir, selama kondisimu memungkinkan. Kamu bisa mengatur hari-hari ini dengan ritmemu sendiri: sebagian orang memilih mengumpulkannya tak lama setelah Ramadan, sementara yang lain menyebarkannya secara bertahap selama beberapa bulan berikutnya.',
    noteTitle: 'Harap diperhatikan',
    noteText: 'Mengganti hari-hari tersebut secara berturut-turut atau menyebarkannya bisa dipandang berbeda menurut mazhab fikih; tidak ada satu pun pendekatan yang di sini disajikan sebagai satu-satunya yang sah.',
    recordTips: [
      'Tuliskan jumlah total hari yang harus diganti begitu Ramadan berakhir',
      'Pilih cara yang sederhana: kalender, aplikasi, buku catatan',
      'Centang setiap hari yang sudah diganti',
    ],
    section1Body3: 'Misalnya, seseorang yang punya 6 hari untuk diganti bisa memilih berpuasa satu hari per minggu selama enam minggu, atau mengumpulkannya dalam periode yang sama jika itu lebih cocok baginya.',
    section2Body: 'Umumnya orang berusaha mengganti hari yang terlewat sebelum Ramadan berikutnya. Praktik ini tidak selalu wajib dalam setiap kasus, tetapi memudahkan pengaturan dan mencegah menumpuknya banyak hari yang belum diganti.',
    visual1Title: 'Ritme yang menyesuaikan dirimu',
    visual1Text: 'Menyebarkan hari-hari yang harus diganti sesuai jadwalmu membuatmu bisa maju dengan tenang, tanpa tekanan.',
    section2Body2: 'Merencanakan lebih awal membantu menghindari stres di menit terakhir. Tip sederhananya adalah menghitung jumlah hari yang tersisa sebelum Ramadan berikutnya, lalu membagi hari-hari yang harus diganti ke minggu atau bulan yang tersedia.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Jika ada alasan yang berlangsung lama atau berulang yang menghalangi puasa (misalnya kondisi kesehatan yang berkepanjangan), situasinya mungkin termasuk dalam kerangka yang berbeda; sebaiknya kamu membicarakannya dengan ulama yang kompeten.',
    alert2Title: 'Informasi penting',
    alert2Text: 'Aturan yang tepat jika batas waktu terlampaui bisa berbeda tergantung penafsiran. Untuk setiap situasi yang rumit, pendapat ulama yang kompeten tetap menjadi rujukan.',
    section2Body3: 'Misalnya, jika Ramadan berikutnya dimulai 8 bulan lagi dan masih ada 6 hari yang harus diganti, salah satu kemungkinannya adalah merencanakan sekitar satu hari per bulan, dengan keleluasaan untuk hal-hal tak terduga.',
    section3Body: 'Kehamilan dan menyusui dapat memengaruhi kemampuan berpuasa, terutama bila berpuasa membahayakan kesehatan ibu atau anak. Kesejahteraan fisik dan kemampuan nyata untuk berpuasa merupakan faktor penting yang perlu dipertimbangkan.',
    visual2Title: 'Situasi yang dipertimbangkan',
    visual2Text: 'Keadaan-keadaan ini diakui oleh tradisi keagamaan sebagai hal yang berpotensi memberikan keringanan.',
    section3Body2: 'Pendapat keagamaan tentang puasa yang tidak dijalankan saat hamil atau menyusui bisa berbeda menurut mazhab, terutama mengenai apakah cukup dengan mengganti saja atau juga disertai kompensasi. Alasan tidak berpuasa yang tepat dan situasi pribadi dapat memengaruhi jawaban yang berlaku.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Qada memungkinkanmu mengganti hari puasa yang terlewat dengan tenang, sesuai ritmemu sendiri. Dalam situasi tertentu (batas waktu terlampaui, kehamilan, menyusui, halangan yang berkepanjangan), pendapat ulama yang kompeten tetap menjadi sumber terbaik.',
    shareMessage: 'Puasa dan keringanan: mengganti puasa (Qada) — AWA',
  },
  hi: {
    badge: 'रोज़ा और क़ज़ा',
    title: 'रोज़ा और छूट:\nक़ज़ा रखना',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'अक्सर पूछे जाने वाले सवाल',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया लेख',
    intro: 'छूटे हुए रोज़ों की क़ज़ा कैसे और कब रखें, अपनी रफ़्तार से और बिना अपराधबोध के।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह लेख केवल जानकारी के लिए है। धार्मिक सवालों की पुष्टि योग्य उलमा से करवानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक निर्णय जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'छूटे हुए दिनों की क़ज़ा कब रखें?',
      'आम समय-सीमा: अगले रमज़ान से पहले',
      'गर्भावस्था और स्तनपान',
      'मुख्य बातें',
    ],
    section1Body: 'क़ज़ा का मतलब है रमज़ान में छूटे हुए रोज़ों को बाद में पूरा करना — ख़ासकर मासिक धर्म की वजह से छूटे रोज़ों को। इन दिनों की क़ज़ा रखनी होती है, क्योंकि रमज़ान का रोज़ा इस महीने का एक स्तंभ है, और मासिक धर्म के कारण रुके हुए दिन आप पर बाक़ी माने जाते हैं, इसमें आपकी कोई ग़लती नहीं है।',
    section1Body2: 'क़ज़ा आम तौर पर रमज़ान ख़त्म होते ही शुरू की जा सकती है, जैसे ही आपकी स्थिति इजाज़त दे। आप इन दिनों को अपनी रफ़्तार से तय कर सकती हैं: कुछ लोग रमज़ान के तुरंत बाद इन्हें एक साथ रखना पसंद करते हैं, तो कुछ अगले महीनों में धीरे-धीरे फैलाकर रखते हैं।',
    noteTitle: 'ध्यान दें',
    noteText: 'क़ज़ा के दिन लगातार रखे जाएँ या अलग-अलग, इस पर फ़िक़्ही मसलकों के अनुसार नज़रिया अलग हो सकता है; यहाँ किसी एक तरीके को ही अकेला मान्य बताकर पेश नहीं किया गया है।',
    recordTips: [
      'रमज़ान ख़त्म होते ही क़ज़ा के कुल दिनों की संख्या लिख लें',
      'कोई आसान तरीका चुनें: कैलेंडर, ऐप, नोटबुक',
      'जो दिन पूरा हो जाए, उस पर निशान लगा दें',
    ],
    section1Body3: 'उदाहरण के लिए, जिसके 6 दिन बाक़ी हों, वह छह हफ़्तों तक हर हफ़्ते एक रोज़ा रख सकती है, या अगर उसे सही लगे तो उन्हें एक ही अवधि में इकट्ठा रख सकती है।',
    section2Body: 'छूटे हुए दिनों की क़ज़ा अगले रमज़ान से पहले पूरी करने की कोशिश करना आम बात है। हर स्थिति में यह व्यवस्थित रूप से अनिवार्य नहीं है, लेकिन इससे योजना बनाना आसान होता है और बहुत सारे दिन जमा होने से बचाव होता है।',
    visual1Title: 'ऐसी रफ़्तार जो आपके अनुसार ढले',
    visual1Text: 'क़ज़ा के दिनों को अपने शेड्यूल के अनुसार फैलाने से आप बिना दबाव के आराम से आगे बढ़ सकती हैं।',
    section2Body2: 'पहले से योजना बनाने से आख़िरी वक़्त का तनाव कम होता है। एक आसान सुझाव यह है कि अगले रमज़ान तक बचे दिन गिन लें और क़ज़ा के दिनों को उपलब्ध हफ़्तों या महीनों में बाँट दें।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'अगर कोई लंबे समय या बार-बार रहने वाला कारण रोज़ा रखने से रोकता है (जैसे कोई लंबी बीमारी), तो वह स्थिति किसी अलग दायरे में आ सकती है; तब किसी योग्य आलिम/आलिमा से बात करना ख़ास तौर पर मददगार होता है।',
    alert2Title: 'ज़रूरी जानकारी',
    alert2Text: 'समय-सीमा बीत जाने की सूरत में सटीक नियम व्याख्या के अनुसार अलग हो सकते हैं। किसी भी पेचीदा स्थिति में, किसी योग्य आलिम/आलिमा की राय ही आधार रहती है।',
    section2Body3: 'उदाहरण के लिए, अगर अगला रमज़ान 8 महीने बाद शुरू होता है और 6 दिनों की क़ज़ा बाक़ी है, तो एक तरीका यह है कि लगभग हर महीने एक दिन की योजना बनाई जाए, और अचानक आई ज़रूरतों के लिए गुंजाइश रखी जाए।',
    section3Body: 'गर्भावस्था और स्तनपान रोज़ा रखने की क्षमता को प्रभावित कर सकते हैं, ख़ासकर जब रोज़ा माँ या बच्चे की सेहत के लिए जोखिम बने। शारीरिक सेहत और रोज़ा रखने की असली क्षमता, दोनों ध्यान में रखने योग्य अहम बातें हैं।',
    visual2Title: 'एक ऐसी स्थिति जिसे ध्यान में रखा जाता है',
    visual2Text: 'धार्मिक परंपरा इन हालात को छूट का संभावित आधार मानती है।',
    section3Body2: 'गर्भावस्था या स्तनपान के दौरान न रखे गए रोज़ों के बारे में धार्मिक राय मसलक के अनुसार अलग हो सकती है, ख़ासकर इस सवाल पर कि सिर्फ़ क़ज़ा काफ़ी है या उसके साथ कोई भरपाई भी शामिल है। रोज़ा न रखने का सटीक कारण और व्यक्तिगत स्थिति लागू होने वाले जवाब को प्रभावित कर सकती है।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'क़ज़ा आपको छूटे हुए रोज़े अपनी रफ़्तार से, आराम से पूरे करने का मौक़ा देती है। किसी ख़ास स्थिति में (समय-सीमा बीत जाना, गर्भावस्था, स्तनपान, लंबे समय की रुकावट), किसी योग्य आलिम/आलिमा की राय सबसे अच्छा सहारा है।',
    shareMessage: 'रोज़ा और छूट: क़ज़ा रखना — AWA',
  },
  sq: {
    badge: 'AGJËRIMI & KAZAJA',
    title: 'Agjërimi dhe përjashtimi:\nkompensimi (kazaja)',
    metaDuration: '6 min lexim',
    metaType: 'Pyetje të shpeshta',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Si dhe kur t’i kompensosh ditët e agjërimit të humbura, me ritmin tënd dhe pa ndjenjë faji.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhen vërtetuar nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Kur t’i kompensosh ditët e humbura?',
      'Një afat i zakonshëm: para Ramazanit të ardhshëm',
      'Shtatzënia dhe ushqyerja me gji',
      'Në pak fjalë',
    ],
    section1Body: 'Kazaja nënkupton kompensimin, më vonë, të ditëve të agjërimit të humbura gjatë Ramazanit — sidomos për shkak të menstruacionit. Këto ditë duhen kompensuar sepse agjërimi i Ramazanit mbetet një shtyllë e muajit dhe ditët e pezulluara për shkak të menstruacionit llogariten si detyrim, pa qenë kjo faji yt.',
    section1Body2: 'Kompensimi zakonisht mund të fillojë sapo të mbarojë Ramazani, sa herë që situata jote e lejon. Këto ditë mund t’i organizosh me ritmin tënd: disa preferojnë t’i grumbullojnë menjëherë pas Ramazanit, ndërsa të tjera i shpërndajnë gradualisht gjatë muajve në vijim.',
    noteTitle: 'Mos harro',
    noteText: 'Kompensimi i ditëve njëra pas tjetrës ose i shpërndarë mund të shihet ndryshe sipas shkollës së jurisprudencës; asnjëra nga qasjet nuk paraqitet këtu si e vetmja e vlefshme.',
    recordTips: [
      'Shëno numrin total të ditëve për t’u kompensuar sapo të mbarojë Ramazani',
      'Zgjidh një metodë të thjeshtë: kalendarin, aplikacionin ose një bllok shënimesh',
      'Shëno çdo ditë sapo ta kompensosh',
    ],
    section1Body3: 'Për shembull, një person që ka 6 ditë për të kompensuar mund të zgjedhë të agjërojë një ditë në javë për gjashtë javë, ose t’i grumbullojë në të njëjtën periudhë nëse i përshtatet më shumë.',
    section2Body: 'Është e zakonshme të përpiqesh t’i kompensosh ditët e humbura para Ramazanit të ardhshëm. Kjo praktikë nuk është e detyrueshme në mënyrë sistematike në çdo rast, por e lehtëson organizimin dhe shmang grumbullimin e shumë ditëve në pritje.',
    visual1Title: 'Një ritëm që përshtatet me ty',
    visual1Text: 'Shpërndarja e ditëve për t’u kompensuar sipas orarit tënd të lejon të ecësh me qetësi, pa presion.',
    section2Body2: 'Planifikimi paraprak ndihmon të shmangësh stresin e çastit të fundit. Një këshillë e thjeshtë është të numërosh sa ditë kanë mbetur deri te Ramazani i ardhshëm dhe t’i shpërndash ditët për t’u kompensuar gjatë javëve ose muajve në dispozicion.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Nëse një arsye e vazhdueshme ose e përsëritur të pengon të agjërosh (për shembull një gjendje shëndetësore e zgjatur), situata mund të bjerë nën një kuadër tjetër; atëherë është veçanërisht e dobishme ta diskutosh me një dijetar të kualifikuar.',
    alert2Title: 'Informacion i rëndësishëm',
    alert2Text: 'Rregullat e sakta në rast se afati tejkalohet mund të ndryshojnë sipas interpretimit. Për çdo situatë të ndërlikuar, mendimi i një dijetari të kualifikuar mbetet pika e referimit.',
    section2Body3: 'Për shembull, nëse Ramazani i ardhshëm fillon pas 8 muajsh dhe mbeten 6 ditë për t’u kompensuar, një mundësi është të planifikosh rreth një ditë në muaj, me fleksibilitet për rrethanat e paparashikuara.',
    section3Body: 'Shtatzënia dhe ushqyerja me gji mund të ndikojnë në aftësinë për të agjëruar, sidomos kur agjërimi përbën rrezik për shëndetin e nënës ose të fëmijës. Mirëqenia fizike dhe aftësia reale për të agjëruar janë faktorë të rëndësishëm që duhen marrë parasysh.',
    visual2Title: 'Një situatë që merret parasysh',
    visual2Text: 'Këto rrethana njihen nga tradita fetare si të afta të sjellin një përjashtim.',
    section3Body2: 'Mendimet fetare për agjërimin e pakryer gjatë shtatzënisë ose ushqyerjes me gji mund të ndryshojnë sipas shkollës, sidomos për çështjen nëse mjafton një kompensim i thjeshtë apo përfshihet edhe një kompensim shtesë. Arsyeja e saktë e mosagjërimit dhe situata personale mund të ndikojnë te përgjigjja e zbatueshme.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Kazaja të lejon t’i kompensosh me qetësi ditët e humbura të agjërimit, me ritmin tënd. Në rast të një situate të veçantë (afat i tejkaluar, shtatzëni, ushqyerje me gji, pengesë e vazhdueshme), mendimi i një dijetari të kualifikuar mbetet burimi më i mirë.',
    shareMessage: 'Agjërimi dhe përjashtimi: kompensimi (kazaja) — AWA',
  },
  ja: {
    badge: '断食とカダー',
    title: '断食と免除：\nカダー（後日の埋め合わせ）',
    metaDuration: '読了時間6分',
    metaType: 'よくある質問',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: 'できなかった断食の日を、いつ、どのように埋め合わせるか。ご自身のペースで、罪悪感なく進めるための解説です。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容は教育を目的としたものです。宗教上の疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出しません。',
    contentsTitle: 'この記事の内容',
    topics: [
      'できなかった日はいつ埋め合わせる？',
      'よくある目安：次のラマダーンまで',
      '妊娠と授乳',
      '重要なポイント',
    ],
    section1Body: 'カダーとは、ラマダーン中にできなかった断食の日を、後日に埋め合わせることです。とくに月経が理由の場合にあたります。ラマダーンの断食はこの月の柱であり続けるため、これらの日は埋め合わせなければなりません。月経で断食を中断した日は、負うべき日数として数えられますが、それはあなたの落ち度ではありません。',
    section1Body2: '埋め合わせは、一般的にラマダーンが終わったらすぐに、状況が許せば始めることができます。日数はご自身のペースで調整できます。ラマダーン後すぐにまとめて行う人もいれば、その後の数か月に少しずつ分けて行う人もいます。',
    noteTitle: 'ご注意ください',
    noteText: '続けて埋め合わせるか、分けて行うかは、法学派によって見方が異なることがあります。ここでは、どちらか一方だけが有効であるとは示していません。',
    recordTips: [
      'ラマダーンが終わったらすぐ、埋め合わせる日数の合計を書き留めましょう',
      'カレンダー、アプリ、ノートなど、簡単な方法を選びましょう',
      '埋め合わせた日ごとにチェックを入れましょう',
    ],
    section1Body3: 'たとえば、埋め合わせる日が6日ある人は、週に1日ずつ6週間かけて断食することも、そのほうが都合がよければ同じ時期にまとめて行うこともできます。',
    section2Body: '次のラマダーンまでに、できなかった日を埋め合わせようとするのは一般的です。この習慣はすべての場合に必ず義務というわけではありませんが、計画を立てやすくなり、残りの日数が大きくたまるのを防げます。',
    visual1Title: '自分に合わせて進めるペース',
    visual1Text: '埋め合わせる日をご自身の予定に合わせて分散させると、プレッシャーなく落ち着いて進められます。',
    section2Body2: '前もって計画しておくと、直前の焦りを避けられます。簡単な方法は、次のラマダーンまでの残り日数を数え、利用できる週や月に埋め合わせの日を振り分けることです。',
    tip1Title: '知っておきたいこと',
    tip1Text: '長く続く、または繰り返し起こる理由（たとえば長期にわたる健康状態）で断食ができない場合、状況は別の枠組みにあてはまることがあります。そのときは、資格のある学者に相談すると、とくに役立ちます。',
    alert2Title: '大切なお知らせ',
    alert2Text: '期限を過ぎた場合の具体的な規定は、解釈によって異なることがあります。複雑な状況では、資格のある学者の意見が基準となります。',
    section2Body3: 'たとえば、次のラマダーンが8か月後に始まり、埋め合わせる日が6日残っている場合、予定外のことにも余裕を持たせながら、月に1日ほどのペースで計画する方法があります。',
    section3Body: '妊娠や授乳は、断食ができるかどうかに影響することがあります。とくに、断食が母親や子どもの健康にリスクとなる場合です。体の状態と、実際に断食できるかどうかは、考慮すべき重要な要素です。',
    visual2Title: '考慮される状況',
    visual2Text: 'これらの状況は、宗教的な伝統において、免除の理由となりうるものとして認められています。',
    section3Body2: '妊娠中や授乳中にできなかった断食についての宗教上の見解は、学派によって異なることがあります。とくに、単純な埋め合わせで十分なのか、それとも何らかの代償も伴うのか、という点です。断食をしなかった具体的な理由や個人の状況が、あてはまる答えに影響することがあります。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'カダーによって、できなかった断食の日を、ご自身のペースで落ち着いて埋め合わせることができます。特別な状況（期限の超過、妊娠、授乳、長く続く支障）では、資格のある学者の意見が最も頼りになります。',
    shareMessage: '断食と免除：カダー（後日の埋め合わせ） — AWA',
  },
  ko: {
    badge: '금식과 카다',
    title: '금식과 면제:\n보충 금식(카다)',
    metaDuration: '6분 읽기',
    metaType: '자주 묻는 질문',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '놓친 금식일을 언제, 어떻게 보충할지 죄책감 없이 내 속도에 맞춰 알아봐요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 교육을 목적으로 해요. 종교적인 질문은 자격을 갖춘 학자에게 확인해야 해요. AWA는 파트와나 개인별 종교 판단을 내리지 않아요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '놓친 날은 언제 보충할까요?',
      '흔한 기한: 다음 라마단 전까지',
      '임신과 모유 수유',
      '핵심 정리',
    ],
    section1Body: '카다는 라마단 중에 놓친 금식일, 특히 월경 때문에 하지 못한 날을 나중에 보충하는 것을 말해요. 라마단 금식은 그 달의 기둥으로 남아 있고, 월경 때문에 중단된 날은 보충해야 할 날로 여겨지기 때문에 이 날들은 보충해야 해요. 이것은 결코 내 잘못이 아니에요.',
    section1Body2: '보충은 일반적으로 라마단이 끝나는 대로, 상황이 허락하는 대로 시작할 수 있어요. 이 날들을 내 속도에 맞춰 계획할 수 있어요. 라마단 직후에 한꺼번에 모아서 하는 사람도 있고, 이어지는 몇 달에 걸쳐 천천히 나누어 하는 사람도 있어요.',
    noteTitle: '참고해 주세요',
    noteText: '연달아 보충할지 나누어 보충할지는 법학파에 따라 다르게 보기도 해요. 여기서는 어느 쪽도 유일하게 옳은 방법으로 제시하지 않아요.',
    recordTips: [
      '라마단이 끝나는 대로 보충해야 할 총 일수를 적어 두어요',
      '캘린더, 앱, 노트처럼 간단한 방법을 골라요',
      '보충한 날마다 체크해요',
    ],
    section1Body3: '예를 들어 보충해야 할 날이 6일인 경우, 6주 동안 일주일에 하루씩 금식할 수도 있고, 그편이 더 맞는다면 같은 기간에 모아서 할 수도 있어요.',
    section2Body: '다음 라마단 전에 놓친 날을 보충하려고 하는 것이 일반적이에요. 모든 경우에 반드시 지켜야 하는 것은 아니지만, 이렇게 하면 계획을 세우기가 쉽고 밀린 날이 많이 쌓이는 것을 피할 수 있어요.',
    visual1Title: '나에게 맞춰지는 속도',
    visual1Text: '보충할 날을 일정에 맞춰 나누면 부담 없이 차분하게 나아갈 수 있어요.',
    section2Body2: '미리 계획하면 막판의 스트레스를 피할 수 있어요. 간단한 방법은 다음 라마단까지 남은 기간을 세고, 그 주나 달에 걸쳐 보충할 날을 나누는 거예요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '오래 이어지거나 반복되는 이유(예: 장기적인 건강 상태)로 금식할 수 없다면, 다른 기준이 적용되는 상황일 수 있어요. 이럴 때는 자격을 갖춘 학자와 이야기해 보는 것이 특히 도움이 돼요.',
    alert2Title: '중요한 안내',
    alert2Text: '기한을 넘긴 경우의 구체적인 규정은 해석에 따라 다를 수 있어요. 복잡한 상황에서는 자격을 갖춘 학자의 의견이 기준이 돼요.',
    section2Body3: '예를 들어 다음 라마단이 8개월 뒤에 시작하고 보충할 날이 6일 남았다면, 예기치 못한 일에 대비해 여유를 두고 한 달에 하루 정도로 계획하는 방법이 있어요.',
    section3Body: '임신과 모유 수유는 금식할 수 있는지에 영향을 줄 수 있어요. 특히 금식이 엄마나 아이의 건강에 위험이 될 때 그래요. 신체의 건강 상태와 실제로 금식할 수 있는 능력은 고려해야 할 중요한 요소예요.',
    visual2Title: '고려되는 상황',
    visual2Text: '이런 상황은 종교 전통에서 면제가 될 수 있는 경우로 인정돼요.',
    section3Body2: '임신이나 모유 수유 중에 하지 못한 금식에 관한 종교적 견해는 법학파에 따라 다를 수 있어요. 특히 단순한 보충으로 충분한지, 아니면 보상도 함께 필요한지에 대해 그래요. 금식하지 못한 구체적인 이유와 개인의 상황에 따라 적용되는 답이 달라질 수 있어요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: '카다를 통해 놓친 금식일을 내 속도에 맞춰 차분히 보충할 수 있어요. 기한을 넘겼거나, 임신이나 모유 수유 중이거나, 오래 이어지는 사유로 금식하기 어려운 것처럼 특별한 상황에서는 자격을 갖춘 학자의 의견이 가장 좋은 도움이 돼요.',
    shareMessage: '금식과 면제: 보충 금식(카다) — AWA',
  },
  'pt-PT': {
    badge: 'JEJUM E QADA',
    title: 'Jejum e dispensa:\na compensação (Qada)',
    metaDuration: '6 min de leitura',
    metaType: 'Perguntas frequentes',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Como e quando compensar os dias de jejum não cumpridos, ao seu ritmo e sem culpa.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Quando compensar os dias em falta?',
      'Um prazo comum: antes do próximo Ramadão',
      'Gravidez e amamentação',
      'Pontos essenciais',
    ],
    section1Body: 'A Qada designa a compensação, mais tarde, dos dias de jejum não cumpridos durante o Ramadão — nomeadamente por causa da menstruação. Estes dias devem ser compensados porque o jejum do Ramadão continua a ser um pilar do mês, e os dias suspensos por causa da menstruação são contados como devidos, sem que isso seja qualquer falta da sua parte.',
    section1Body2: 'A compensação pode, em geral, começar logo que o Ramadão termina, assim que a sua situação o permitir. Pode organizar estes dias ao seu ritmo: algumas pessoas preferem agrupá-los pouco depois do Ramadão, enquanto outras os distribuem gradualmente pelos meses seguintes.',
    noteTitle: 'Atenção',
    noteText: 'Compensar os dias de forma consecutiva ou distribuí-los pode ser visto de forma diferente consoante a escola jurídica; nenhuma das abordagens é aqui apresentada como a única válida.',
    recordTips: [
      'Anote o número total de dias a compensar logo que o Ramadão termina',
      'Escolha um método simples: calendário, aplicação, caderno',
      'Assinale cada dia à medida que é compensado',
    ],
    section1Body3: 'Por exemplo, uma pessoa com 6 dias a compensar pode optar por jejuar um por semana durante seis semanas, ou agrupá-los no mesmo período se isso lhe convier mais.',
    section2Body: 'É comum procurar compensar os dias em falta antes do próximo Ramadão. Esta prática não é obrigatória de forma sistemática em todos os casos, mas facilita a organização e evita acumular um grande número de dias pendentes.',
    visual1Title: 'Um ritmo que se adapta a si',
    visual1Text: 'Distribuir os dias a compensar de acordo com a sua agenda permite avançar com serenidade, sem pressão.',
    section2Body2: 'Planear com antecedência ajuda a evitar o stress de última hora. Uma dica simples é contar o número de dias que faltam para o próximo Ramadão e distribuir os dias a compensar pelas semanas ou meses disponíveis.',
    tip1Title: 'Bom saber',
    tip1Text: 'Se um motivo duradouro ou recorrente impedir o jejum (uma condição de saúde prolongada, por exemplo), a situação pode enquadrar-se noutro âmbito; é então particularmente útil falar com um sábio qualificado.',
    alert2Title: 'Informação importante',
    alert2Text: 'As regras precisas no caso de o prazo ser ultrapassado podem diferir consoante a interpretação. Em qualquer situação complicada, a opinião de um sábio qualificado continua a ser a referência.',
    section2Body3: 'Por exemplo, se o próximo Ramadão começar daqui a 8 meses e faltarem compensar 6 dias, uma possibilidade é planear cerca de um dia por mês, com flexibilidade para imprevistos.',
    section3Body: 'A gravidez e a amamentação podem afetar a capacidade de jejuar, em especial quando o jejum representa um risco para a saúde da mãe ou da criança. O bem-estar físico e a capacidade real de jejuar são fatores importantes a ter em conta.',
    visual2Title: 'Uma situação que é tida em conta',
    visual2Text: 'Estas circunstâncias são reconhecidas pela tradição religiosa como podendo dar lugar a uma dispensa.',
    section3Body2: 'As opiniões religiosas sobre o jejum não cumprido durante a gravidez ou a amamentação podem variar consoante a escola, em particular quanto a saber se uma simples compensação é suficiente ou se também há lugar a uma reparação. O motivo preciso para não jejuar e a situação pessoal podem influenciar a resposta aplicável.',
    tip2Title: 'Bom saber',
    tip2Text: 'A Qada permite-lhe compensar com calma os dias de jejum não cumpridos, ao seu ritmo. Numa situação particular (prazo ultrapassado, gravidez, amamentação, impedimento duradouro), a opinião de um sábio qualificado continua a ser o melhor recurso.',
    shareMessage: 'Jejum e dispensa: a compensação (Qada) — AWA',
  },
  bn: {
    badge: 'রোজা ও কাজা',
    title: 'রোজা ও অব্যাহতি:\nকাজা আদায়',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'প্রশ্নোত্তর',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'ছুটে যাওয়া রোজা কীভাবে ও কখন পূরণ করবেন, নিজের গতিতে এবং অপরাধবোধ ছাড়াই।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'ছুটে যাওয়া দিনগুলো কখন পূরণ করবেন?',
      'একটি প্রচলিত সময়সীমা: পরবর্তী রমজানের আগে',
      'গর্ভাবস্থা ও বুকের দুধ খাওয়ানো',
      'মূল কথা',
    ],
    section1Body: 'কাজা বলতে বোঝায় রমজানে ছুটে যাওয়া রোজার দিনগুলো পরে অন্য সময়ে পূরণ করা — বিশেষ করে মাসিকের কারণে। এই দিনগুলো পূরণ করতে হবে, কারণ রমজানের রোজা এই মাসের একটি স্তম্ভ, এবং মাসিকের কারণে স্থগিত থাকা দিনগুলো পাওনা হিসেবে গণ্য হয়, এতে আপনার কোনো দোষ নেই।',
    section1Body2: 'রমজান শেষ হওয়ার পর আপনার অবস্থা অনুমতি দিলেই সাধারণত কাজা শুরু করা যায়। এই দিনগুলো আপনি নিজের গতিতে সাজাতে পারেন: কেউ রমজানের পরপরই একসঙ্গে রাখতে পছন্দ করেন, আবার কেউ পরের মাসগুলোতে ধীরে ধীরে ছড়িয়ে রাখেন।',
    noteTitle: 'মনে রাখবেন',
    noteText: 'টানা দিনগুলো পূরণ করা বা ছড়িয়ে পূরণ করা ফিকহের মাযহাবভেদে ভিন্নভাবে দেখা হতে পারে; এখানে কোনো একটি পদ্ধতিকে একমাত্র বৈধ হিসেবে উপস্থাপন করা হয়নি।',
    recordTips: [
      'রমজান শেষ হওয়ামাত্র পূরণ করার মোট দিনের সংখ্যা লিখে রাখুন',
      'একটি সহজ পদ্ধতি বেছে নিন: ক্যালেন্ডার, অ্যাপ, খাতা',
      'প্রতিটি দিন পূরণ হলে তা টিক চিহ্ন দিয়ে রাখুন',
    ],
    section1Body3: 'উদাহরণস্বরূপ, যাঁর 6 দিন পূরণ করতে হবে, তিনি ছয় সপ্তাহ ধরে সপ্তাহে একটি করে রোজা রাখতে পারেন, অথবা সুবিধা হলে একই সময়ে একসঙ্গে রাখতে পারেন।',
    section2Body: 'পরবর্তী রমজানের আগে ছুটে যাওয়া দিনগুলো পূরণ করার চেষ্টা করা প্রচলিত। এই অভ্যাস সব ক্ষেত্রে অবধারিতভাবে বাধ্যতামূলক নয়, তবে এতে গুছিয়ে নেওয়া সহজ হয় এবং অনেক দিন জমে থাকা এড়ানো যায়।',
    visual1Title: 'আপনার সঙ্গে মানানসই গতি',
    visual1Text: 'আপনার সময়সূচি অনুযায়ী পূরণ করার দিনগুলো ছড়িয়ে নিলে চাপ ছাড়াই শান্তভাবে এগিয়ে যেতে পারবেন।',
    section2Body2: 'আগে থেকে পরিকল্পনা করলে শেষ মুহূর্তের দুশ্চিন্তা এড়ানো যায়। একটি সহজ পরামর্শ হলো পরবর্তী রমজান পর্যন্ত বাকি দিনের সংখ্যা গুনে নেওয়া এবং পূরণ করার দিনগুলো হাতে থাকা সপ্তাহ বা মাসগুলোতে ভাগ করে নেওয়া।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'কোনো স্থায়ী বা বারবার ঘটা কারণ রোজা রাখতে বাধা দিলে (যেমন দীর্ঘমেয়াদি স্বাস্থ্য সমস্যা), বিষয়টি ভিন্ন কাঠামোর আওতায় পড়তে পারে; তখন একজন যোগ্য আলেমের সঙ্গে আলোচনা করা বিশেষভাবে সহায়ক।',
    alert2Title: 'গুরুত্বপূর্ণ তথ্য',
    alert2Text: 'সময়সীমা পেরিয়ে গেলে সুনির্দিষ্ট বিধান ব্যাখ্যাভেদে ভিন্ন হতে পারে। যেকোনো জটিল পরিস্থিতিতে একজন যোগ্য আলেমের মতই মূল নির্ভরযোগ্য।',
    section2Body3: 'উদাহরণস্বরূপ, পরবর্তী রমজান যদি 8 মাস পরে শুরু হয় এবং 6 দিন পূরণ বাকি থাকে, তাহলে একটি সম্ভাবনা হলো মাসে প্রায় একদিন করে পরিকল্পনা করা, অপ্রত্যাশিত পরিস্থিতির জন্য নমনীয়তা রেখে।',
    section3Body: 'গর্ভাবস্থা ও বুকের দুধ খাওয়ানো রোজা রাখার সামর্থ্যকে প্রভাবিত করতে পারে, বিশেষ করে যখন রোজা মা বা শিশুর স্বাস্থ্যের জন্য ঝুঁকিপূর্ণ হয়। শারীরিক সুস্থতা এবং রোজা রাখার প্রকৃত সামর্থ্য বিবেচনায় নেওয়ার মতো গুরুত্বপূর্ণ বিষয়।',
    visual2Title: 'একটি বিবেচিত পরিস্থিতি',
    visual2Text: 'ধর্মীয় ঐতিহ্যে এই পরিস্থিতিগুলো অব্যাহতির কারণ হতে পারে বলে স্বীকৃত।',
    section3Body2: 'গর্ভাবস্থা বা বুকের দুধ খাওয়ানোর সময় না রাখা রোজা সম্পর্কে ধর্মীয় মত মাযহাবভেদে ভিন্ন হতে পারে, বিশেষ করে শুধু কাজা আদায় যথেষ্ট কি না, নাকি তার সঙ্গে ক্ষতিপূরণও যুক্ত, এই প্রশ্নে। রোজা না রাখার সুনির্দিষ্ট কারণ ও ব্যক্তিগত অবস্থা প্রযোজ্য উত্তরকে প্রভাবিত করতে পারে।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'কাজা আপনাকে নিজের গতিতে শান্তভাবে ছুটে যাওয়া রোজার দিনগুলো পূরণ করতে দেয়। কোনো বিশেষ পরিস্থিতিতে (সময়সীমা পেরিয়ে যাওয়া, গর্ভাবস্থা, বুকের দুধ খাওয়ানো, স্থায়ী প্রতিবন্ধকতা) একজন যোগ্য আলেমের মত সবচেয়ে ভালো সহায়ক।',
    shareMessage: 'রোজা ও অব্যাহতি: কাজা আদায় — AWA',
  },
  da: {
    badge: 'FASTE & QADAA-FASTE',
    title: 'Faste og fritagelse:\nQadaa-fasten',
    metaDuration: '6 min læsning',
    metaType: 'FAQ',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvordan og hvornår du indhenter missede fastedage, i dit eget tempo og uden skyld.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er rent uddannelsesmæssigt. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvornår indhentes de missede dage?',
      'Et almindeligt tidsrum: inden næste Ramadan',
      'Graviditet og amning',
      'Vigtige pointer',
    ],
    section1Body: 'Qadaa-faste refererer til at indhente, på et senere tidspunkt, de fastedage misset under Ramadan — særligt på grund af haidh (menstruation). Disse dage skal indhentes, fordi Ramadan-fasten forbliver en søjle i måneden, og de dage, der er suspenderet på grund af menstruation, tæller som skyldte, uden at dette er din skyld.',
    section1Body2: 'Indhentningen kan generelt begynde, så snart Ramadan slutter, så snart din situation tillader det. Du kan organisere disse dage i dit eget tempo: nogle foretrækker at samle dem kort efter Ramadan, mens andre spreder dem gradvist over de følgende måneder.',
    noteTitle: 'Bemærk venligst',
    noteText: 'At indhente dagene fortløbende eller at sprede dem ud kan ses forskelligt afhængigt af retsskolen; ingen af tilgangene præsenteres her som den eneste gyldige.',
    recordTips: [
      'Skriv det samlede antal dage, der skal indhentes, ned så snart Ramadan slutter',
      'Vælg en enkel metode: kalender, app, notesbog',
      'Sæt kryds ved hver dag, efterhånden som den indhentes',
    ],
    section1Body3: 'For eksempel kan en person med 6 dage, der skal indhentes som Qadaa-faste, vælge at faste én om ugen i seks uger eller samle dem i den samme periode, hvis det passer dem bedre.',
    section2Body: 'Det er almindeligt at forsøge at indhente de missede dage inden næste Ramadan. Denne praksis er ikke systematisk obligatorisk i alle tilfælde, men det gør organiseringen lettere og undgår at akkumulere et stort antal ventende dage.',
    visual1Title: 'Et tempo der tilpasser sig dig',
    visual1Text: 'At sprede de dage, der skal indhentes, i henhold til din tidsplan lader dig komme fremad roligt, uden pres.',
    section2Body2: 'At planlægge fremad hjælper med at undgå stress i sidste øjeblik. Et simpelt tip er at tælle antallet af dage, der er tilbage inden næste Ramadan, og sprede de dage, der skal indhentes, over de tilgængelige uger eller måneder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Hvis en vedvarende eller tilbagevendende årsag forhindrer faste (en langvarig helbredstilstand, for eksempel), kan situationen falde ind under en anden ramme; det er da særligt nyttigt at drøfte det med en kvalificeret lærd.',
    alert2Title: 'Vigtig information',
    alert2Text: 'De præcise regler i tilfælde af, at tidsrammen overskrides, kan afvige afhængigt af fortolkning. For enhver kompliceret situation forbliver meningen fra en kvalificeret lærd referencen.',
    section2Body3: 'For eksempel, hvis næste Ramadan begynder om 8 måneder og der er 6 dage tilbage at indhente, er én mulighed at planlægge ca. én dag om måneden, med fleksibilitet for uforudsete omstændigheder.',
    section3Body: 'Graviditet og amning kan påvirke evnen til at faste, særligt når faste udgør en risiko for moders eller barns helbred. Fysisk velvære og den faktiske evne til at faste er vigtige faktorer at tage i betragtning.',
    visual2Title: 'En situation der tages i betragtning',
    visual2Text: 'Disse omstændigheder er anerkendt af den religiøse tradition som potentielt givende anledning til en fritagelse.',
    section3Body2: 'Religiøse meninger om faste, der ikke er gennemført under graviditet eller amning, kan variere afhængigt af skolen, særligt om et simpelt indhentning er tilstrækkeligt, eller om en kompensation også er involveret. Den præcise årsag til at undlade at faste og den personlige situation kan påvirke det gældende svar.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Qadaa-faste giver dig mulighed for roligt at indhente de missede fastedage, i dit eget tempo. I tilfælde af en særlig situation (overskredet tidsramme, graviditet, amning, vedvarende forhindring), forbliver meningen fra en kvalificeret lærd den bedste ressource.',
    shareMessage: 'Faste og fritagelse: Qadaa-fasten — AWA',
  },
  sv: {
    badge: 'FASTE & QADAA-FASTE',
    title: 'Faste och fritagelse:\nQadaa-fasten',
    metaDuration: '6 min läsning',
    metaType: 'FAQ',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvordan och hvornår du indhenter missede fastedage, i ditt eget tempo och uden skyld.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvornår indhentes de missede dage?',
      'Et almindeligt tidsrum: inden näste Ramadan',
      'Graviditet och amning',
      'Vigtige pointer',
    ],
    section1Body: 'Qadaa-faste refererer till at indhente, på et senere tidspunkt, de fastedage misset under Ramadan — särligt på grund av haidh (menstruation). Disse dagar skal indhentes, fordi Ramadan-fasten forbliver en söjle i måneden, och de dagar, der ar suspenderet på grund av menstruation, täller som skyldte, uden at dette ar din skyld.',
    section1Body2: 'Indhentningen kan generelt begynde, så snart Ramadan slutter, så snart din situation tillader det. Du kan organisere disse dagar i ditt eget tempo: nogle foreträkker at samle dem kort efter Ramadan, mens andre spreder dem gradvist over de fölgende måneder.',
    noteTitle: 'Bemärk venligst',
    noteText: 'At indhente dagene fortlöbende eller at sprede dem ud kan ses forskelligt afhängigt av retsskolen; ingen av tilgangene präsenteres her som den eneste gyldige.',
    recordTips: [
      'Skriv det samlede antal dagar, der skal indhentes, ned så snart Ramadan slutter',
      'Välg en enkel metode: kalender, app, notesbog',
      'Sät kryds ved hver dag, efterhånden som den indhentes',
    ],
    section1Body3: 'For eksempel kan en person med 6 dagar, der skal indhentes som Qadaa-faste, välge at faste én om veckan i seks veckor eller samle dem i den samme periode, hvis det passer dem bedre.',
    section2Body: 'Det ar almindeligt at forsöge at indhente de missede dagar inden näste Ramadan. Denne praksis ar inte systematisk obligatorisk i alla tilfälde, men det gör organiseringen lettere och undgår at akkumulere et stort antal ventende dagar.',
    visual1Title: 'Et tempo der tilpasser sig dig',
    visual1Text: 'At sprede de dagar, der skal indhentes, i henhold till din tidsplan lader dig komme fremad roligt, uden pres.',
    section2Body2: 'At planlägge fremad hjälper med at undgå stress i sidste öjeblik. Et simpelt tip ar at tälle antallet av dagar, der ar tilbage inden näste Ramadan, och sprede de dagar, der skal indhentes, over de tilgängelige veckor eller måneder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Hvis en vedvarende eller tilbagevendende årsag forhindrer faste (en langvarig helbredstilstand, for eksempel), kan situationen falde ind under en anden ramme; det ar da särligt nyttigt at dröfte det med en kvalificeret lärd.',
    alert2Title: 'Vigtig information',
    alert2Text: 'De präcise regler i tilfälde av, at tidsrammen overskrides, kan afvige afhängigt av fortolkning. For enhver kompliceret situation forbliver meningen fran en kvalificeret lärd referencen.',
    section2Body3: 'For eksempel, hvis näste Ramadan begynder om 8 måneder och der ar 6 dagar tilbage at indhente, ar én mulighed at planlägge ca. én dag om måneden, med fleksibilitet for uforudsete omständigheder.',
    section3Body: 'Graviditet och amning kan påvirke evnen till at faste, särligt når faste udgör en risiko for moders eller barns helbred. Fysisk velväre och den faktiske evne till at faste ar vigtige faktorer at tage i betragtning.',
    visual2Title: 'En situation der tages i betragtning',
    visual2Text: 'Disse omständigheder ar anerkendt av den religiöse tradition som potentielt givende anledning till en fritagelse.',
    section3Body2: 'Religiöse meninger om faste, der inte ar gennemfört under graviditet eller amning, kan variere afhängigt av skolen, särligt om et simpelt indhentning ar tilsträkkeligt, eller om en kompensation også ar involveret. Den präcise årsag till at undlade at faste och den personlige situation kan påvirke det gäldende svar.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Qadaa-faste giver dig mulighed for roligt at indhente de missede fastedage, i ditt eget tempo. I tilfälde av en särlig situation (overskredet tidsramme, graviditet, amning, vedvarende forhindring), forbliver meningen fran en kvalificeret lärd den bedste ressource.',
    shareMessage: 'Faste och fritagelse: Qadaa-fasten — AWA',
  },
  nb: {
    badge: 'FASTE OG QADA',
    title: 'Faste og fritak:\nå ta igjen dager (qada)',
    metaDuration: '6 min lesing',
    metaType: 'Vanlige spørsmål',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvordan og når du tar igjen fastedager du har gått glipp av, i ditt eget tempo og uten skyldfølelse.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Når tar man igjen dagene man gikk glipp av?',
      'En vanlig frist: før neste ramadan',
      'Svangerskap og amming',
      'Det viktigste å huske',
    ],
    section1Body: 'Qada betyr å ta igjen, på et senere tidspunkt, fastedager som er gått glipp av under ramadan – blant annet på grunn av menstruasjon. Disse dagene må tas igjen fordi ramadanfasten er en pilar i måneden, og dagene som er suspendert på grunn av menstruasjon, regnes som skyldige, uten at det er din feil.',
    section1Body2: 'Innhentingen kan vanligvis begynne så snart ramadan er over, så snart situasjonen din tillater det. Du kan organisere disse dagene i ditt eget tempo: noen foretrekker å samle dem kort tid etter ramadan, mens andre sprer dem gradvis utover de følgende månedene.',
    noteTitle: 'Merk',
    noteText: 'Å ta igjen dagene etter hverandre eller spre dem kan vurderes forskjellig avhengig av rettsskole; ingen av tilnærmingene presenteres her som den eneste gyldige.',
    recordTips: [
      'Skriv ned det totale antallet dager som skal tas igjen, så snart ramadan er over',
      'Velg en enkel metode: kalender, app, notatbok',
      'Kryss av for hver dag etter hvert som den tas igjen',
    ],
    section1Body3: 'For eksempel kan en person med 6 dager som skal tas igjen, velge å faste én dag i uken i seks uker, eller samle dem i samme periode hvis det passer bedre.',
    section2Body: 'Det er vanlig å forsøke å ta igjen dagene man gikk glipp av, før neste ramadan. Denne praksisen er ikke systematisk obligatorisk i alle tilfeller, men den gjør organiseringen enklere og unngår at et stort antall dager hoper seg opp.',
    visual1Title: 'Et tempo som tilpasser seg deg',
    visual1Text: 'Å spre dagene som skal tas igjen, etter timeplanen din lar deg gå rolig fremover, uten press.',
    section2Body2: 'Å planlegge i forkant hjelper deg å unngå stress i siste liten. Et enkelt tips er å telle antall dager som gjenstår før neste ramadan, og spre dagene som skal tas igjen, over ukene eller månedene som er tilgjengelige.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Hvis en varig eller tilbakevendende grunn hindrer deg i å faste (for eksempel en langvarig helsetilstand), kan situasjonen falle inn under et annet rammeverk; da er det særlig nyttig å diskutere den med en kvalifisert lærd.',
    alert2Title: 'Viktig informasjon',
    alert2Text: 'De presise reglene dersom fristen overskrides, kan variere avhengig av tolkning. I enhver komplisert situasjon er uttalelsen fra en kvalifisert lærd fortsatt referansen.',
    section2Body3: 'Hvis for eksempel neste ramadan begynner om 8 måneder og det gjenstår 6 dager som skal tas igjen, er én mulighet å planlegge omtrent én dag i måneden, med fleksibilitet for uforutsette hendelser.',
    section3Body: 'Svangerskap og amming kan påvirke evnen til å faste, særlig når fasting utgjør en risiko for helsen til moren eller barnet. Fysisk velvære og den reelle evnen til å faste er viktige faktorer å ta hensyn til.',
    visual2Title: 'En situasjon det tas hensyn til',
    visual2Text: 'Disse omstendighetene er anerkjent av den religiøse tradisjonen som mulige grunner til fritak.',
    section3Body2: 'Religiøse synspunkter på faste som ikke er gjennomført under svangerskap eller amming, kan variere avhengig av rettsskole, særlig i spørsmålet om en enkel innhenting er nok eller om det også gjelder en erstatning. Den presise grunnen til at man ikke fastet, og den personlige situasjonen, kan påvirke hvilket svar som gjelder.',
    tip2Title: 'Godt å vite',
    tip2Text: 'Qada lar deg rolig ta igjen fastedagene du har gått glipp av, i ditt eget tempo. I en spesiell situasjon (overskredet frist, svangerskap, amming, varig hindring) er uttalelsen fra en kvalifisert lærd fortsatt den beste ressursen.',
    shareMessage: 'Faste og fritak: å ta igjen dager (qada) – AWA',
  },
  pl: {
    badge: 'POST I KADA',
    title: 'Post i zwolnienie:\nodrabianie (kada)',
    metaDuration: '6 min czytania',
    metaType: 'FAQ',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Jak i kiedy odrobić opuszczone dni postu, we własnym tempie i bez poczucia winy.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Kiedy odrabiać opuszczone dni?',
      'Częsty termin: przed następnym ramadanem',
      'Ciąża i karmienie piersią',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Kada oznacza odrobienie w późniejszym czasie dni postu opuszczonych w ramadanie — w szczególności z powodu menstruacji. Te dni należy odrobić, ponieważ post ramadanowy pozostaje filarem tego miesiąca, a dni zawieszone z powodu menstruacji są liczone jako należne, bez Twojej winy.',
    section1Body2: 'Odrabianie można zasadniczo zacząć zaraz po zakończeniu ramadanu, gdy tylko pozwoli na to Twoja sytuacja. Te dni możesz zorganizować we własnym tempie: niektóre osoby wolą zgrupować je krótko po ramadanie, inne rozkładają je stopniowo na kolejne miesiące.',
    noteTitle: 'Zwróć uwagę',
    noteText: 'Odrabianie dni kolejno lub rozłożone w czasie może być różnie postrzegane w zależności od szkoły prawa; żadne z tych podejść nie jest tu przedstawiane jako jedyne słuszne.',
    recordTips: [
      'Zapisz łączną liczbę dni do odrobienia zaraz po zakończeniu ramadanu',
      'Wybierz prostą metodę: kalendarz, aplikację, zeszyt',
      'Odhaczaj każdy odrobiony dzień',
    ],
    section1Body3: 'Na przykład osoba, która ma do odrobienia 6 dni, może zdecydować się pościć raz w tygodniu przez sześć tygodni lub zgrupować je w jednym okresie, jeśli bardziej jej to odpowiada.',
    section2Body: 'Często stara się odrobić opuszczone dni przed następnym ramadanem. Ta praktyka nie jest systematycznie obowiązkowa w każdym przypadku, ale ułatwia organizację i pozwala uniknąć gromadzenia dużej liczby zaległych dni.',
    visual1Title: 'Tempo, które dopasowuje się do Ciebie',
    visual1Text: 'Rozłożenie dni do odrobienia zgodnie z Twoim harmonogramem pozwala iść naprzód spokojnie, bez presji.',
    section2Body2: 'Planowanie z wyprzedzeniem pomaga uniknąć stresu w ostatniej chwili. Prostą wskazówką jest policzenie dni pozostałych do następnego ramadanu i rozłożenie dni do odrobienia na dostępne tygodnie lub miesiące.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Jeśli trwała lub nawracająca przyczyna uniemożliwia post (na przykład długotrwały stan zdrowia), sytuacja może podlegać innym zasadom; wtedy szczególnie warto omówić ją z wykwalifikowanym uczonym.',
    alert2Title: 'Ważna informacja',
    alert2Text: 'Dokładne zasady w przypadku przekroczenia terminu mogą się różnić w zależności od interpretacji. W każdej skomplikowanej sytuacji punktem odniesienia pozostaje opinia wykwalifikowanego uczonego.',
    section2Body3: 'Na przykład jeśli następny ramadan zacznie się za 8 miesięcy, a pozostało do odrobienia 6 dni, jedną z możliwości jest zaplanowanie około jednego dnia w miesiącu, z elastycznością na nieprzewidziane okoliczności.',
    section3Body: 'Ciąża i karmienie piersią mogą wpływać na zdolność do postu, zwłaszcza gdy post stwarza ryzyko dla zdrowia matki lub dziecka. Dobre samopoczucie fizyczne i rzeczywista zdolność do postu to ważne czynniki, które należy wziąć pod uwagę.',
    visual2Title: 'Sytuacja, która jest brana pod uwagę',
    visual2Text: 'Te okoliczności są uznawane przez tradycję religijną jako mogące stanowić podstawę zwolnienia.',
    section3Body2: 'Opinie religijne dotyczące postu niewykonanego w czasie ciąży lub karmienia piersią mogą się różnić w zależności od szkoły, zwłaszcza w kwestii, czy wystarcza zwykłe odrobienie, czy dochodzi także wynagrodzenie. Na obowiązującą odpowiedź może wpływać dokładny powód nieposzczenia i sytuacja osobista.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Kada pozwala spokojnie odrobić opuszczone dni postu, we własnym tempie. W szczególnej sytuacji (przekroczony termin, ciąża, karmienie piersią, trwała przeszkoda) najlepszym źródłem pozostaje opinia wykwalifikowanego uczonego.',
    shareMessage: 'Post i zwolnienie: odrabianie (kada) — AWA',
  },
  uk: {
    badge: 'ПІСТ І КАДА',
    title: 'Піст і звільнення:\nвідпрацювання (када)',
    metaDuration: '6 хв читання',
    metaType: 'Запитання',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Як і коли відпрацювати пропущені дні посту — у власному темпі та без почуття провини.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Коли відпрацьовувати пропущені дні?',
      'Поширений строк: до наступного Рамадану',
      'Вагітність і годування груддю',
      'Головні висновки',
    ],
    section1Body: 'Када означає відпрацювання пізніше днів посту, пропущених під час Рамадану, — зокрема через менструацію. Ці дні слід відпрацювати, бо піст Рамадану залишається стовпом цього місяця, а дні, призупинені через менструацію, рахуються як належні, без вашої вини.',
    section1Body2: 'Відпрацювання можна розпочати загалом одразу після завершення Рамадану, щойно ваша ситуація це дозволяє. Ви можете організувати ці дні у власному темпі: хтось воліє згрупувати їх невдовзі після Рамадану, а хтось розподіляє поступово протягом наступних місяців.',
    noteTitle: 'Зверніть увагу',
    noteText: 'Відпрацювання днів поспіль або з розподілом у часі можуть розглядати по-різному залежно від школи правознавства; жоден із цих підходів тут не подається як єдиний слушний.',
    recordTips: [
      'Запишіть загальну кількість днів для відпрацювання одразу після завершення Рамадану',
      'Оберіть простий метод: календар, застосунок, зошит',
      'Відзначайте кожен відпрацьований день',
    ],
    section1Body3: 'Наприклад, людина, яка має відпрацювати 6 днів, може вирішити постити один день на тиждень протягом шести тижнів або згрупувати їх в один період, якщо їй так зручніше.',
    section2Body: 'Часто намагаються відпрацювати пропущені дні до наступного Рамадану. Ця практика не є систематично обов’язковою в кожному випадку, але вона полегшує організацію й дозволяє уникнути накопичення великої кількості відкладених днів.',
    visual1Title: 'Темп, що підлаштовується під вас',
    visual1Text: 'Розподіл днів для відпрацювання відповідно до вашого розкладу дозволяє рухатися спокійно, без тиску.',
    section2Body2: 'Планування заздалегідь допомагає уникнути стресу в останню мить. Проста порада — порахувати кількість днів, що залишилися до наступного Рамадану, і розподілити дні для відпрацювання на доступні тижні чи місяці.',
    tip1Title: 'Варто знати',
    tip1Text: 'Якщо постійна чи повторювана причина перешкоджає посту (наприклад, тривалий стан здоров’я), ситуація може підпадати під інші правила; тоді особливо корисно обговорити її з кваліфікованим вченим.',
    alert2Title: 'Важлива інформація',
    alert2Text: 'Точні правила на випадок перевищення строку можуть відрізнятися залежно від тлумачення. У будь-якій складній ситуації орієнтиром залишається думка кваліфікованого вченого.',
    section2Body3: 'Наприклад, якщо наступний Рамадан розпочнеться через 8 місяців, а залишилося відпрацювати 6 днів, одна з можливостей — запланувати близько одного дня на місяць, залишивши гнучкість на непередбачені обставини.',
    section3Body: 'Вагітність і годування груддю можуть впливати на здатність постити, особливо коли піст створює ризик для здоров’я матері чи дитини. Фізичне благополуччя та реальна здатність постити — важливі чинники, які слід враховувати.',
    visual2Title: 'Ситуація, яку враховують',
    visual2Text: 'Релігійна традиція визнає ці обставини такими, що потенційно можуть бути підставою для звільнення.',
    section3Body2: 'Релігійні думки щодо посту, не виконаного під час вагітності чи годування груддю, можуть відрізнятися залежно від школи, зокрема в питанні, чи достатньо простого відпрацювання, чи передбачено також відшкодування. На застосовну відповідь можуть впливати точна причина непосту та особиста ситуація.',
    tip2Title: 'Варто знати',
    tip2Text: 'Када дозволяє спокійно відпрацювати пропущені дні посту у власному темпі. У разі особливої ситуації (перевищений строк, вагітність, годування груддю, тривала перешкода) найкращим джерелом залишається думка кваліфікованого вченого.',
    shareMessage: 'Піст і звільнення: відпрацювання (када) — AWA',
  },
  cs: {
    badge: 'PŮST A KADA',
    title: 'Půst a výjimka:\nnahrazení (kada)',
    metaDuration: '6 min čtení',
    metaType: 'Časté dotazy',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Jak a kdy nahradit vynechané dny půstu, vlastním tempem a bez pocitu viny.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Kdy vynechané dny nahradit?',
      'Běžný časový rámec: před dalším ramadánem',
      'Těhotenství a kojení',
      'Hlavní poznatky',
    ],
    section1Body: 'Kada označuje pozdější nahrazení dnů půstu vynechaných během ramadánu — zejména kvůli menstruaci. Tyto dny je třeba nahradit, protože půst v ramadánu zůstává pilířem tohoto měsíce, a dny pozastavené kvůli menstruaci se počítají jako dlužné, aniž by to byla vaše vina.',
    section1Body2: 'S nahrazováním lze obecně začít hned po skončení ramadánu, jakmile to vaše situace dovolí. Tyto dny si můžete zorganizovat vlastním tempem: někteří lidé je raději seskupí brzy po ramadánu, jiní je postupně rozloží do následujících měsíců.',
    noteTitle: 'Upozornění',
    noteText: 'Nahrazování dnů po sobě nebo jejich rozložení mohou jednotlivé právní školy vnímat různě; žádný z těchto přístupů zde není uváděn jako jediný platný.',
    recordTips: [
      'Zapište si celkový počet dnů k nahrazení hned po skončení ramadánu',
      'Zvolte jednoduchou metodu: kalendář, aplikaci, zápisník',
      'Každý nahrazený den odškrtněte',
    ],
    section1Body3: 'Například žena s 6 dny k nahrazení se může rozhodnout postit se jeden den týdně po dobu šesti týdnů, nebo je seskupit do jednoho období, pokud jí to vyhovuje víc.',
    section2Body: 'Je běžné snažit se vynechané dny nahradit před dalším ramadánem. Tato praxe není v každém případě systematicky povinná, ale usnadňuje organizaci a zabraňuje hromadění velkého počtu nevyřízených dnů.',
    visual1Title: 'Tempo, které se přizpůsobí vám',
    visual1Text: 'Rozložení dnů k nahrazení podle vašeho rozvrhu vám umožní postupovat klidně, bez tlaku.',
    section2Body2: 'Plánování předem pomáhá vyhnout se stresu na poslední chvíli. Jednoduchým tipem je spočítat počet dnů zbývajících do dalšího ramadánu a dny k nahrazení rozložit na dostupné týdny nebo měsíce.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Pokud půstu brání trvalý nebo opakující se důvod (například dlouhodobé zdravotní onemocnění), může situace spadat pod jiný rámec; pak je obzvlášť užitečné ji probrat s kvalifikovaným učencem.',
    alert2Title: 'Důležitá informace',
    alert2Text: 'Přesná pravidla pro případ překročení časového rámce se mohou lišit podle výkladu. Pro jakoukoli složitou situaci zůstává referencí názor kvalifikovaného učence.',
    section2Body3: 'Například pokud další ramadán začíná za 8 měsíců a zbývá nahradit 6 dnů, jednou z možností je naplánovat zhruba jeden den měsíčně, s flexibilitou pro nepředvídané okolnosti.',
    section3Body: 'Těhotenství a kojení mohou ovlivnit schopnost postit se, zejména pokud půst představuje riziko pro zdraví matky nebo dítěte. Tělesná pohoda a skutečná schopnost postit se jsou důležité faktory, které je třeba zohlednit.',
    visual2Title: 'Situace, která se zohledňuje',
    visual2Text: 'Tyto okolnosti jsou náboženskou tradicí uznávány jako potenciální důvod k výjimce.',
    section3Body2: 'Náboženské názory na půst, který nebyl vykonán během těhotenství nebo kojení, se mohou podle školy lišit, zejména v otázce, zda stačí prosté nahrazení, nebo zda jde také o kompenzaci. Přesný důvod nepostění se a osobní situace mohou ovlivnit platnou odpověď.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Kada vám umožňuje klidně nahradit vynechané dny půstu, vlastním tempem. V případě zvláštní situace (překročený časový rámec, těhotenství, kojení, trvalá překážka) zůstává nejlepším zdrojem názor kvalifikovaného učence.',
    shareMessage: 'Půst a výjimka: nahrazení (kada) — AWA',
  },
  sk: {
    badge: 'PÔST A KADA',
    title: 'Pôst a oslobodenie:\nnahradenie (kada)',
    metaDuration: '6 min čítania',
    metaType: 'Často kladené otázky',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Ako a kedy nahradiť vynechané dni pôstu, vlastným tempom a bez pocitu viny.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Kedy nahradiť vynechané dni?',
      'Bežný časový rámec: pred ďalším ramadánom',
      'Tehotenstvo a dojčenie',
      'Hlavné body',
    ],
    section1Body: 'Kada označuje nahradenie dní pôstu vynechaných počas ramadánu — najmä kvôli menštruácii — v neskoršom čase. Tieto dni sa musia nahradiť, pretože ramadánový pôst zostáva piliérom mesiaca a dni prerušené kvôli menštruácii sa počítajú ako dlžné, bez toho, aby to bola vaša chyba.',
    section1Body2: 'S nahrádzaním sa vo všeobecnosti môže začať hneď po skončení ramadánu, len čo to vaša situácia dovolí. Tieto dni si môžete zorganizovať vlastným tempom: niektoré ženy ich uprednostňujú zoskupiť krátko po ramadáne, iné ich rozložia postupne počas nasledujúcich mesiacov.',
    noteTitle: 'Upozornenie',
    noteText: 'Nahrádzanie dní za sebou alebo ich rozloženie sa môže podľa právnej školy posudzovať odlišne; ani jeden prístup tu nie je prezentovaný ako jediný platný.',
    recordTips: [
      'Hneď po skončení ramadánu si zapíšte celkový počet dní na nahradenie',
      'Zvoľte si jednoduchú metódu: kalendár, aplikáciu, zošit',
      'Každý nahradený deň odškrtnite',
    ],
    section1Body3: 'Napríklad žena so 6 dňami na nahradenie sa môže rozhodnúť postiť sa jeden deň týždenne počas šiestich týždňov, alebo ich zoskupiť do rovnakého obdobia, ak jej to viac vyhovuje.',
    section2Body: 'Je bežné snažiť sa vynechané dni nahradiť pred ďalším ramadánom. Táto prax nie je v každom prípade systematicky povinná, ale uľahčuje organizáciu a zabraňuje hromadeniu veľkého počtu nevybavených dní.',
    visual1Title: 'Tempo, ktoré sa prispôsobuje vám',
    visual1Text: 'Rozloženie dní na nahradenie podľa vášho rozvrhu vám umožňuje postupovať pokojne, bez tlaku.',
    section2Body2: 'Plánovanie vopred pomáha vyhnúť sa stresu na poslednú chvíľu. Jednoduchý tip je spočítať, koľko dní zostáva do ďalšieho ramadánu, a dni na nahradenie rozložiť na dostupné týždne alebo mesiace.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Ak pôstu bráni trvalý alebo opakujúci sa dôvod (napríklad dlhodobý zdravotný stav), situácia môže spadať pod iný rámec; vtedy je obzvlášť užitočné poradiť sa s kvalifikovaným učencom.',
    alert2Title: 'Dôležitá informácia',
    alert2Text: 'Presné pravidlá v prípade prekročenia časového rámca sa môžu podľa výkladu líšiť. Pri každej komplikovanej situácii zostáva referenciou názor kvalifikovaného učenca.',
    section2Body3: 'Napríklad ak ďalší ramadán začína o 8 mesiacov a zostáva nahradiť 6 dní, jednou z možností je naplánovať približne jeden deň mesačne s flexibilitou pre nepredvídané okolnosti.',
    section3Body: 'Tehotenstvo a dojčenie môžu ovplyvniť schopnosť postiť sa, najmä ak pôst predstavuje riziko pre zdravie matky alebo dieťaťa. Telesná pohoda a skutočná schopnosť postiť sa sú dôležité faktory, ktoré treba zohľadniť.',
    visual2Title: 'Situácia, ktorá sa zohľadňuje',
    visual2Text: 'Tieto okolnosti náboženská tradícia uznáva ako potenciálny dôvod oslobodenia.',
    section3Body2: 'Náboženské názory na pôst nevykonaný počas tehotenstva alebo dojčenia sa môžu podľa školy líšiť, najmä v otázke, či stačí jednoduché nahradenie, alebo ide aj o kompenzáciu. Presný dôvod nepostenia sa a osobná situácia môžu ovplyvniť platnú odpoveď.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Kada vám umožňuje pokojne nahradiť vynechané dni pôstu vlastným tempom. V osobitnej situácii (prekročený časový rámec, tehotenstvo, dojčenie, trvalá prekážka) zostáva najlepším zdrojom názor kvalifikovaného učenca.',
    shareMessage: 'Pôst a oslobodenie: nahradenie (kada) — AWA',
  },
  hu: {
    badge: 'BÖJT ÉS KADA',
    title: 'Böjt és felmentés:\na bepótlás (kada)',
    metaDuration: '6 perc olvasás',
    metaType: 'GYIK',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Hogyan és mikor pótold be a kihagyott böjtnapokat, a saját tempódban és bűntudat nélkül.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mikor pótold be a kihagyott napokat?',
      'Gyakori időkeret: a következő ramadán előtt',
      'Terhesség és szoptatás',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'A kada a ramadán alatt — különösen menstruáció miatt — kihagyott böjtnapok későbbi bepótlását jelenti. Ezeket a napokat be kell pótolni, mert a ramadáni böjt a hónap egyik pillére marad, és a menstruáció miatt felfüggesztett napok esedékesnek számítanak, anélkül, hogy ez a te hibád lenne.',
    section1Body2: 'A bepótlás általában a ramadán végétől megkezdhető, amint a helyzeted engedi. A napokat a saját tempódban szervezheted meg: egyesek a ramadán után hamarosan egyben pótolják be őket, mások fokozatosan szétosztják a következő hónapokra.',
    noteTitle: 'Figyelem',
    noteText: 'A napok egymás utáni vagy szétosztott bepótlását a jogi iskolától függően eltérően ítélhetik meg; itt egyik megközelítés sem szerepel az egyetlen érvényesként.',
    recordTips: [
      'A ramadán végén azonnal írd fel a bepótlandó napok teljes számát',
      'Válassz egyszerű módszert: naptár, alkalmazás, füzet',
      'Minden bepótolt napot pipálj ki',
    ],
    section1Body3: 'Például az a nő, akinek 6 napot kell bepótolnia, dönthet úgy, hogy hat héten át hetente egy napot böjtöl, vagy ha így jobban megfelel neki, ugyanabban az időszakban csoportosítja őket.',
    section2Body: 'Gyakori, hogy a kihagyott napokat a következő ramadán előtt igyekeznek bepótolni. Ez a gyakorlat nem minden esetben kötelező, de megkönnyíti a szervezést, és elkerüli a nagy számú függő nap felhalmozódását.',
    visual1Title: 'Hozzád igazodó tempó',
    visual1Text: 'A bepótlandó napok időbeosztásod szerinti szétosztása lehetővé teszi, hogy nyugodtan, nyomás nélkül haladj.',
    section2Body2: 'Az előre tervezés segít elkerülni az utolsó pillanatos stresszt. Egyszerű tipp: számold meg, hány nap van hátra a következő ramadánig, és oszd szét a bepótlandó napokat a rendelkezésre álló hetekre vagy hónapokra.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ha tartós vagy visszatérő ok akadályozza a böjtölést (például hosszan tartó egészségügyi állapot), a helyzet más keretbe eshet; ilyenkor különösen hasznos kvalifikált tudóssal megbeszélni.',
    alert2Title: 'Fontos információ',
    alert2Text: 'Az időkeret túllépése esetén érvényes pontos szabályok az értelmezéstől függően eltérhetnek. Bármilyen bonyolult helyzetben a kvalifikált tudós véleménye marad az irányadó.',
    section2Body3: 'Például ha a következő ramadán 8 hónap múlva kezdődik, és még 6 napot kell bepótolni, az egyik lehetőség, hogy havonta nagyjából egy napot tervezel, rugalmasságot hagyva a váratlan körülményeknek.',
    section3Body: 'A terhesség és a szoptatás befolyásolhatja a böjtölési képességet, különösen ha a böjt az anya vagy a gyermek egészségére kockázatot jelent. A testi jólét és a tényleges böjtölési képesség fontos figyelembe veendő tényezők.',
    visual2Title: 'Figyelembe vett helyzet',
    visual2Text: 'Ezeket a körülményeket a vallási hagyomány potenciális felmentési okként ismeri el.',
    section3Body2: 'A terhesség vagy a szoptatás alatt el nem végzett böjtre vonatkozó vallási vélemények iskolánként eltérhetnek, különösen abban a kérdésben, hogy elegendő-e az egyszerű bepótlás, vagy kárpótlás is szükséges. A böjt elmaradásának pontos oka és a személyes helyzet befolyásolhatja az érvényes választ.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A kada lehetővé teszi, hogy nyugodtan, a saját tempódban pótold be a kihagyott böjtnapokat. Különleges helyzetben (túllépett időkeret, terhesség, szoptatás, tartós akadály) a kvalifikált tudós véleménye marad a legjobb forrás.',
    shareMessage: 'Böjt és felmentés: a bepótlás (kada) — AWA',
  },
  ro: {
    badge: 'POST ȘI QADAA',
    title: 'Postul și scutirea:\nrecuperarea (Qadaa)',
    metaDuration: '6 min de citit',
    metaType: 'Întrebări frecvente',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Cum și când să recuperezi zilele de post ratate, în ritmul tău și fără vinovăție.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Când se recuperează zilele ratate?',
      'Un interval frecvent: înainte de următorul Ramadan',
      'Sarcina și alăptarea',
      'Ce să reții',
    ],
    section1Body: 'Qadaa desemnează recuperarea, la un moment ulterior, a zilelor de post ratate în timpul Ramadanului — în special din cauza menstruației. Aceste zile trebuie recuperate deoarece postul din Ramadan rămâne un pilon al lunii, iar zilele suspendate din cauza menstruației sunt socotite ca datorate, fără ca aceasta să fie vreo vină a ta.',
    section1Body2: 'Recuperarea poate începe, în general, imediat ce Ramadanul se încheie, de îndată ce situația ta o permite. Îți poți organiza aceste zile în ritmul tău: unele persoane preferă să le grupeze la scurt timp după Ramadan, în timp ce altele le răspândesc treptat în lunile următoare.',
    noteTitle: 'Atenție',
    noteText: 'Recuperarea zilelor consecutiv sau răspândit în timp poate fi privită diferit în funcție de școala de jurisprudență; niciuna dintre abordări nu este prezentată aici ca fiind singura validă.',
    recordTips: [
      'Notează numărul total de zile de recuperat imediat ce Ramadanul se încheie',
      'Alege o metodă simplă: calendar, aplicație, caiet',
      'Bifează fiecare zi pe măsură ce este recuperată',
    ],
    section1Body3: 'De exemplu, o persoană cu 6 zile de recuperat poate alege să postească una pe săptămână timp de șase săptămâni sau să le grupeze în aceeași perioadă, dacă i se potrivește mai bine.',
    section2Body: 'Este frecvent să se încerce recuperarea zilelor ratate înainte de următorul Ramadan. Această practică nu este obligatorie în mod sistematic în orice caz, dar ușurează organizarea și evită acumularea unui număr mare de zile restante.',
    visual1Title: 'Un ritm care se adaptează ție',
    visual1Text: 'Răspândirea zilelor de recuperat în funcție de programul tău îți permite să înaintezi liniștit, fără presiune.',
    section2Body2: 'Planificarea din timp ajută la evitarea stresului de ultim moment. Un sfat simplu este să numeri zilele rămase până la următorul Ramadan și să împarți zilele de recuperat pe săptămânile sau lunile disponibile.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Dacă un motiv durabil sau recurent împiedică postul (o afecțiune de sănătate prelungită, de exemplu), situația poate intra într-un alt cadru; este atunci deosebit de util să discuți cu un savant calificat.',
    alert2Title: 'Informație importantă',
    alert2Text: 'Regulile precise în cazul depășirii intervalului pot diferi în funcție de interpretare. Pentru orice situație complicată, părerea unui savant calificat rămâne referința.',
    section2Body3: 'De exemplu, dacă următorul Ramadan începe peste 8 luni și mai rămân 6 zile de recuperat, o posibilitate este să planifici aproximativ o zi pe lună, cu flexibilitate pentru situațiile neprevăzute.',
    section3Body: 'Sarcina și alăptarea pot afecta capacitatea de a posti, mai ales când postul prezintă un risc pentru sănătatea mamei sau a copilului. Starea de bine fizică și capacitatea reală de a posti sunt factori importanți de luat în calcul.',
    visual2Title: 'O situație care este luată în considerare',
    visual2Text: 'Aceste circumstanțe sunt recunoscute de tradiția religioasă ca putând da naștere unei scutiri.',
    section3Body2: 'Părerile religioase privind postul neefectuat în timpul sarcinii sau al alăptării pot varia în funcție de școală, în special în privința întrebării dacă o simplă recuperare este suficientă sau dacă intervine și o compensație. Motivul precis al nepostirii și situația personală pot influența răspunsul aplicabil.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Qadaa îți permite să recuperezi liniștit zilele de post ratate, în ritmul tău. În cazul unei situații particulare (interval depășit, sarcină, alăptare, impediment durabil), părerea unui savant calificat rămâne cea mai bună resursă.',
    shareMessage: 'Postul și scutirea: recuperarea (Qadaa) — AWA',
  },
  bg: {
    badge: 'ПОСТ И КЪДА',
    title: 'Постът и освобождаването:\nнаваксването (къда)',
    metaDuration: '6 мин четене',
    metaType: 'Чести въпроси',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Как и кога да наваксаш пропуснатите дни на пост, в твоето темпо и без вина.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Кога се наваксат пропуснатите дни?',
      'Често срещан срок: преди следващия Рамадан',
      'Бременност и кърмене',
      'Какво да запомниш',
    ],
    section1Body: 'Къда означава наваксване, по-късно, на дните на пост, пропуснати през Рамадан — по-специално заради менструация. Тези дни трябва да се наваксат, защото постът през Рамадан остава стълб на месеца, а дните, прекратени заради менструация, се считат за дължими, без това да е по твоя вина.',
    section1Body2: 'Наваксването обикновено може да започне веднага щом Рамадан приключи, щом ситуацията ти го позволява. Можеш да организираш тези дни в своето темпо: някои хора предпочитат да ги групират скоро след Рамадан, докато други ги разпределят постепенно през следващите месеци.',
    noteTitle: 'Обърни внимание',
    noteText: 'Наваксването на дните последователно или разпределено във времето може да се гледа различно според школата на правото; нито един от подходите не е представен тук като единствено валиден.',
    recordTips: [
      'Запиши общия брой дни за наваксване веднага щом Рамадан приключи',
      'Избери прост метод: календар, приложение, тетрадка',
      'Отбелязвай всеки ден, когато е навакснат',
    ],
    section1Body3: 'Например човек с 6 дни за наваксване може да избере да пости по един на седмица в продължение на шест седмици или да ги групира в един и същи период, ако така му е по-удобно.',
    section2Body: 'Често се опитват да наваксат пропуснатите дни преди следващия Рамадан. Тази практика не е систематично задължителна във всеки случай, но улеснява организацията и избягва натрупването на голям брой чакащи дни.',
    visual1Title: 'Ритъм, който се приспособява към теб',
    visual1Text: 'Разпределянето на дните за наваксване според графика ти ти позволява да напредваш спокойно, без натиск.',
    section2Body2: 'Планирането предварително помага да се избегне стресът в последния момент. Прост съвет е да преброиш оставащите дни до следващия Рамадан и да разпределиш дните за наваксване върху наличните седмици или месеци.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Ако трайна или повтаряща се причина пречи на поста (например продължително здравословно състояние), ситуацията може да попадне в друга рамка; тогава е особено полезно да обсъдиш това с квалифициран учен.',
    alert2Title: 'Важна информация',
    alert2Text: 'Точните правила при превишаване на срока могат да се различават според тълкуването. За всяка сложна ситуация мнението на квалифициран учен остава референцията.',
    section2Body3: 'Например ако следващият Рамадан започва след 8 месеца и остават 6 дни за наваксване, една възможност е да планираш приблизително един ден месечно, с гъвкавост за непредвидени обстоятелства.',
    section3Body: 'Бременността и кърменето могат да повлияят на способността да постиш, особено когато постът представлява риск за здравето на майката или детето. Физическото благосъстояние и реалната способност да постиш са важни фактори, които да се вземат предвид.',
    visual2Title: 'Ситуация, която се взема предвид',
    visual2Text: 'Тези обстоятелства са признати от религиозната традиция като такива, които могат да доведат до освобождаване.',
    section3Body2: 'Религиозните мнения относно неизвършения пост по време на бременност или кърмене могат да варират според школата, по-специално по въпроса дали е достатъчно просто наваксване или се включва и обезщетение. Точната причина за непостенето и личната ситуация могат да повлияят на приложимия отговор.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Къда ти позволява спокойно да наваксаш пропуснатите дни на пост, в своето темпо. При особена ситуация (надвишен срок, бременност, кърмене, трайно препятствие) мнението на квалифициран учен остава най-добрият ресурс.',
    shareMessage: 'Постът и освобождаването: наваксването (къда) — AWA',
  },
  sr: {
    badge: 'ПОСТ И КАДАА',
    title: 'Пост и ослобађање:\nнадокнада (кадаа)',
    metaDuration: '6 мин читања',
    metaType: 'Честа питања',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Како и када надокнадити пропуштене дане поста, својим темпом и без кривице.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Када надокнадити пропуштене дане?',
      'Уобичајени рок: пре следећег Рамазана',
      'Трудноћа и дојење',
      'Шта да запамтиш',
    ],
    section1Body: 'Кадаа означава накнадну надокнаду дана поста пропуштених током Рамазана — нарочито због менструације. Ови дани се морају надокнадити јер пост у Рамазану остаје стуб тог месеца, а дани преустављени због менструације рачунају се као дуговани, без икакве твоје кривице.',
    section1Body2: 'Надокнада обично може почети чим Рамазан заврши, чим ти ситуација то дозвољава. Ове дане можеш организовати својим темпом: неки радије групишу дане убрзо после Рамазана, док их други постепено распоређују током следећих месеци.',
    noteTitle: 'Обрати пажњу',
    noteText: 'Надокнађивање дана узастопно или њихово распоређивање може се различито гледати зависно од школе права; ниједан приступ се овде не представља као једини ваљан.',
    recordTips: [
      'Запиши укупан број дана за надокнаду чим Рамазан заврши',
      'Изабери једноставан метод: календар, апликација, свеска',
      'Означи сваки дан када га надокнадиш',
    ],
    section1Body3: 'На пример, особа са 6 дана за надокнаду може изабрати да пости по један недељно током шест недеља или да их групише у исти период ако јој то више одговара.',
    section2Body: 'Уобичајено је покушати да се пропуштени дани надокнаде пре следећег Рамазана. Ова пракса није системски обавезна у сваком случају, али олакшава организацију и избегава нагомилавање великог броја неиспуњених дана.',
    visual1Title: 'Темпо који се прилагођава теби',
    visual1Text: 'Распоређивање дана за надокнаду према твом распореду омогућава ти да напредујеш мирно, без притиска.',
    section2Body2: 'Планирање унапред помаже да се избегне стрес у последњем тренутку. Једноставан савет је да избројиш дане преостале до следећег Рамазана и распоредиш дане за надокнаду током доступних недеља или месеци.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ако трајан или понављајући разлог спречава пост (на пример дуготрајно здравствено стање), ситуација може спадати у другачији оквир; тада је посебно корисно разговарати са квалификованим учењаком.',
    alert2Title: 'Важна информација',
    alert2Text: 'Прецизна правила у случају прекорачења рока могу се разликовати зависно од тумачења. За сваку компликовану ситуацију мишљење квалификованог учењака остаје референца.',
    section2Body3: 'На пример, ако следећи Рамазан почиње за 8 месеци, а преостаје 6 дана за надокнаду, једна могућност је да планираш отприлике један дан месечно, уз флексибилност за непредвиђене околности.',
    section3Body: 'Трудноћа и дојење могу утицати на способност поста, нарочито када пост представља ризик за здравље мајке или детета. Физичко благостање и стварна способност поста су важни фактори које треба узети у обзир.',
    visual2Title: 'Ситуација која се узима у обзир',
    visual2Text: 'Верска традиција признаје ове околности као могући разлог за ослобађање.',
    section3Body2: 'Верска мишљења о посту који није извршен током трудноће или дојења могу се разликовати зависно од школе, нарочито по питању да ли је довољна једноставна надокнада или је укључена и накнада. Прецизан разлог непоштовања поста и лична ситуација могу утицати на одговарајући одговор.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Кадаа ти омогућава да мирно надокнадиш пропуштене дане поста, својим темпом. У случају посебне ситуације (прекорачен рок, трудноћа, дојење, трајна препрека), мишљење квалификованог учењака остаје најбољи извор.',
    shareMessage: 'Пост и ослобађање: надокнада (кадаа) — AWA',
  },
  hr: {
    badge: 'POST I KADA',
    title: 'Post i oslobođenje:\nnadoknada (kada)',
    metaDuration: '6 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako i kada nadoknaditi propuštene dane posta, svojim tempom i bez osjećaja krivnje.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kada nadoknaditi propuštene dane?',
      'Uobičajeni rok: prije sljedećeg Ramazana',
      'Trudnoća i dojenje',
      'Ključne poruke',
    ],
    section1Body: 'Kada označava naknadnu nadoknadu dana posta propuštenih tijekom Ramazana — osobito zbog menstruacije. Te se dane mora nadoknaditi jer post u Ramazanu ostaje stup tog mjeseca, a dani prekinuti zbog menstruacije računaju se kao dugovani, bez ikakve tvoje krivnje.',
    section1Body2: 'Nadoknada općenito može započeti čim Ramazan završi, čim ti situacija to dopusti. Te dane možeš organizirati svojim tempom: neke osobe ih radije grupiraju ubrzo nakon Ramazana, dok ih druge postupno raspoređuju tijekom sljedećih mjeseci.',
    noteTitle: 'Napomena',
    noteText: 'Nadoknada uzastopnih dana ili njihovo raspoređivanje može se različito promatrati ovisno o pravnoj školi; nijedan pristup ovdje se ne predstavlja kao jedini ispravan.',
    recordTips: [
      'Zapiši ukupan broj dana za nadoknadu čim Ramazan završi',
      'Odaberi jednostavnu metodu: kalendar, aplikaciju, bilježnicu',
      'Označi svaki dan kad ga nadoknadiš',
    ],
    section1Body3: 'Na primjer, osoba koja ima 6 dana za nadoknadu može odabrati postiti jedan dan tjedno tijekom šest tjedana ili ih grupirati u isto razdoblje ako joj tako više odgovara.',
    section2Body: 'Uobičajeno je nastojati nadoknaditi propuštene dane prije sljedećeg Ramazana. Ta praksa nije sustavno obvezna u svakom slučaju, ali olakšava organizaciju i sprječava nakupljanje velikog broja neodrađenih dana.',
    visual1Title: 'Tempo koji se prilagođava tebi',
    visual1Text: 'Raspoređivanje dana za nadoknadu prema tvom rasporedu omogućuje ti da mirno napreduješ, bez pritiska.',
    section2Body2: 'Planiranje unaprijed pomaže izbjeći stres u zadnji čas. Jednostavan savjet je izbrojiti koliko je dana ostalo do sljedećeg Ramazana i rasporediti dane za nadoknadu na raspoložive tjedne ili mjesece.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako te trajan ili ponavljajući razlog sprječava u postu (na primjer dugotrajno zdravstveno stanje), situacija može spadati u drugačiji okvir; tada je osobito korisno razgovarati s kvalificiranim učenjakom.',
    alert2Title: 'Važna informacija',
    alert2Text: 'Precizna pravila u slučaju prekoračenja roka mogu se razlikovati ovisno o tumačenju. Za svaku složenu situaciju mjerodavno ostaje mišljenje kvalificiranog učenjaka.',
    section2Body3: 'Na primjer, ako sljedeći Ramazan počinje za 8 mjeseci, a preostaje 6 dana za nadoknadu, jedna je mogućnost planirati otprilike jedan dan mjesečno, uz fleksibilnost za nepredviđene okolnosti.',
    section3Body: 'Trudnoća i dojenje mogu utjecati na sposobnost posta, osobito kada post predstavlja rizik za zdravlje majke ili djeteta. Tjelesna dobrobit i stvarna sposobnost posta važni su čimbenici koje treba uzeti u obzir.',
    visual2Title: 'Situacija koja se uzima u obzir',
    visual2Text: 'Vjerska tradicija prepoznaje te okolnosti kao moguć razlog za oslobođenje.',
    section3Body2: 'Vjerska mišljenja o postu neodrađenom tijekom trudnoće ili dojenja mogu se razlikovati ovisno o školi, osobito po pitanju je li dovoljna jednostavna nadoknada ili je uključena i naknada. Točan razlog neposta i osobna situacija mogu utjecati na primjenjiv odgovor.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Kada ti omogućuje da mirno nadoknadiš propuštene dane posta, svojim tempom. U slučaju posebne situacije (prekoračen rok, trudnoća, dojenje, trajna spriječenost) mišljenje kvalificiranog učenjaka ostaje najbolji izvor.',
    shareMessage: 'Post i oslobođenje: nadoknada (kada) — AWA',
  },
  bs: {
    badge: 'POST I KADA',
    title: 'Post i oslobođenje:\nnadoknada (kaza)',
    metaDuration: '6 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako i kada nadoknaditi propuštene dane posta, svojim tempom i bez osjećaja krivnje.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kada nadoknaditi propuštene dane?',
      'Uobičajeni rok: prije sljedećeg Ramazana',
      'Trudnoća i dojenje',
      'Ključne poruke',
    ],
    section1Body: 'Kaza označava naknadnu nadoknadu dana posta propuštenih tokom Ramazana — osobito zbog menstruacije. Te se dane mora nadoknaditi jer post u Ramazanu ostaje stup tog mjeseca, a dani prekinuti zbog menstruacije računaju se kao dugovani, bez ikakve tvoje krivnje.',
    section1Body2: 'Nadoknada općenito može započeti čim Ramazan završi, čim ti situacija to dopusti. Te dane možeš organizirati svojim tempom: neke osobe ih radije grupiraju ubrzo nakon Ramazana, dok ih druge postupno raspoređuju tokom sljedećih mjeseci.',
    noteTitle: 'Napomena',
    noteText: 'Nadoknada uzastopnih dana ili njihovo raspoređivanje može se različito promatrati ovisno o pravnoj školi; nijedan pristup ovdje se ne predstavlja kao jedini ispravan.',
    recordTips: [
      'Zapiši ukupan broj dana za nadoknadu čim Ramazan završi',
      'Odaberi jednostavnu metodu: kalendar, aplikaciju, bilježnicu',
      'Označi svaki dan kad ga nadoknadiš',
    ],
    section1Body3: 'Na primjer, osoba koja ima 6 dana za nadoknadu može odabrati postiti jedan dan sedmično tokom šest sedmica ili ih grupirati u isto razdoblje ako joj tako više odgovara.',
    section2Body: 'Uobičajeno je nastojati nadoknaditi propuštene dane prije sljedećeg Ramazana. Ta praksa nije sistemno obvezna u svakom slučaju, ali olakšava organizaciju i sprječava nakupljanje velikog broja neodrađenih dana.',
    visual1Title: 'Tempo koji se prilagođava tebi',
    visual1Text: 'Raspoređivanje dana za nadoknadu prema tvom rasporedu omogućuje ti da mirno napreduješ, bez pritiska.',
    section2Body2: 'Planiranje unaprijed pomaže izbjeći stres u zadnji čas. Jednostavan savjet je izbrojiti koliko je dana ostalo do sljedećeg Ramazana i rasporediti dane za nadoknadu na raspoložive sedmice ili mjesece.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako te trajan ili ponavljajući razlog sprječava u postu (na primjer dugotrajno zdravstveno stanje), situacija može spadati u drugačiji okvir; tada je osobito korisno razgovarati s kvalificiranim učenjakom.',
    alert2Title: 'Važna informacija',
    alert2Text: 'Precizna pravila u slučaju prekoračenja roka mogu se razlikovati ovisno o tumačenju. Za svaku složenu situaciju mjerodavno ostaje mišljenje kvalificiranog učenjaka.',
    section2Body3: 'Na primjer, ako sljedeći Ramazan počinje za 8 mjeseci, a preostaje 6 dana za nadoknadu, jedna je mogućnost planirati otprilike jedan dan mjesečno, uz fleksibilnost za nepredviđene okolnosti.',
    section3Body: 'Trudnoća i dojenje mogu utjecati na sposobnost posta, osobito kada post predstavlja rizik za zdravlje majke ili djeteta. Tjelesna dobrobit i stvarna sposobnost posta važni su čimbenici koje treba uzeti u obzir.',
    visual2Title: 'Situacija koja se uzima u obzir',
    visual2Text: 'Vjerska tradicija prepoznaje te okolnosti kao moguć razlog za oslobođenje.',
    section3Body2: 'Vjerska mišljenja o postu neodrađenom tokom trudnoće ili dojenja mogu se razlikovati ovisno o školi, osobito po pitanju je li dovoljna jednostavna nadoknada ili je uključena i naknada. Točan razlog neposta i osobna situacija mogu utjecati na primjenjiv odgovor.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Kaza ti omogućuje da mirno nadoknadiš propuštene dane posta, svojim tempom. U slučaju posebne situacije (prekoračen rok, trudnoća, dojenje, trajna spriječenost) mišljenje kvalificiranog učenjaka ostaje najbolji izvor.',
    shareMessage: 'Post i oslobođenje: nadoknada (kaza) — AWA',
  },
  sl: {
    badge: 'POST IN KADA',
    title: 'Post in oprostitev:\nnadomestitev (kada)',
    metaDuration: '6 min branja',
    metaType: 'Pogosta vprašanja',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Kako in kdaj nadomestiti zamujene dni posta, v svojem tempu in brez občutka krivde.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kdaj nadomestiti zamujene dni?',
      'Običajen rok: pred naslednjim ramazanom',
      'Nosečnost in dojenje',
      'Ključna sporočila',
    ],
    section1Body: 'Kada pomeni naknadno nadomestitev dni posta, zamujenih med ramazanom — zlasti zaradi menstruacije. Te dneve je treba nadomestiti, ker post v ramazanu ostaja steber tega meseca, dnevi, prekinjeni zaradi menstruacije, pa se štejejo kot dolgovani, brez kakršne koli tvoje krivde.',
    section1Body2: 'Nadomestitev se lahko na splošno začne, takoj ko se ramazan konča, takoj ko ti situacija to dopušča. Te dneve lahko organiziraš v svojem tempu: nekatere osebe jih raje združijo kmalu po ramazanu, druge jih postopoma razporedijo v naslednjih mesecih.',
    noteTitle: 'Opomba',
    noteText: 'Nadomestitev zaporednih dni ali njihovo razporejanje se lahko različno obravnava glede na pravno šolo; noben pristop tukaj ni predstavljen kot edini veljavni.',
    recordTips: [
      'Skupno število dni za nadomestitev zapiši, takoj ko se ramazan konča',
      'Izberi preprosto metodo: koledar, aplikacijo, zvezek',
      'Označi vsak dan, ko ga nadomestiš',
    ],
    section1Body3: 'Na primer, oseba, ki ima 6 dni za nadomestitev, lahko izbere post en dan na teden šest tednov ali jih združi v isto obdobje, če ji tako bolj ustreza.',
    section2Body: 'Običajno je prizadevanje za nadomestitev zamujenih dni pred naslednjim ramazanom. Ta praksa ni sistematično obvezna v vsakem primeru, vendar olajša organizacijo in prepreči kopičenje velikega števila neopravljenih dni.',
    visual1Title: 'Tempo, ki se prilagaja tebi',
    visual1Text: 'Razporeditev dni za nadomestitev glede na tvoj urnik ti omogoča, da mirno napreduješ, brez pritiska.',
    section2Body2: 'Načrtovanje vnaprej pomaga preprečiti stres v zadnjem trenutku. Preprost nasvet je prešteti, koliko dni je ostalo do naslednjega ramazana, in dneve za nadomestitev razporediti na razpoložljive tedne ali mesece.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Če te trajen ali ponavljajoč se razlog ovira pri postu (na primer dolgotrajno zdravstveno stanje), lahko situacija spada v drugačen okvir; takrat je še posebej koristno pogovoriti se s kvalificiranim učenjakom.',
    alert2Title: 'Pomembna informacija',
    alert2Text: 'Natančna pravila v primeru prekoračitve roka se lahko razlikujejo glede na razlago. Za vsako zapleteno situacijo ostaja merodajno mnenje kvalificiranega učenjaka.',
    section2Body3: 'Na primer, če se naslednji ramazan začne čez 8 mesecev in je za nadomestitev ostalo 6 dni, je ena možnost načrtovati približno en dan na mesec, z prožnostjo za nepredvidene okoliščine.',
    section3Body: 'Nosečnost in dojenje lahko vplivata na zmožnost posta, zlasti kadar post predstavlja tveganje za zdravje matere ali otroka. Telesno dobro počutje in dejanska zmožnost posta sta pomembna dejavnika, ki ju je treba upoštevati.',
    visual2Title: 'Situacija, ki se upošteva',
    visual2Text: 'Verska tradicija te okoliščine priznava kot možen razlog za oprostitev.',
    section3Body2: 'Verska mnenja o postu, neopravljenem med nosečnostjo ali dojenjem, se lahko razlikujejo glede na šolo, zlasti glede vprašanja, ali zadostuje preprosta nadomestitev ali je vključeno tudi nadomestilo. Natančen razlog za neposta in osebna situacija lahko vplivata na veljaven odgovor.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Kada ti omogoča, da mirno nadomestiš zamujene dni posta, v svojem tempu. V primeru posebne situacije (prekoračen rok, nosečnost, dojenje, trajna zadržanost) mnenje kvalificiranega učenjaka ostaja najboljši vir.',
    shareMessage: 'Post in oprostitev: nadomestitev (kada) — AWA',
  },
  ne: {
    badge: 'रोजा र कजा',
    title: 'रोजा र छुट:\nकजा गर्ने (कजा)',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'बारम्बार सोधिने प्रश्न',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'छुटेका रोजाका दिनहरू कसरी र कहिले कजा गर्ने, आफ्नै गतिमा र अपराधबोधबिना।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'छुटेका दिनहरू कहिले कजा गर्ने?',
      'सामान्य समयसीमा: अर्को रमजानअघि',
      'गर्भावस्था र स्तनपान',
      'मुख्य कुराहरू',
    ],
    section1Body: 'कजा भनेको रमजानमा छुटेका रोजाका दिनहरू — विशेष गरी महिनावारीका कारण — पछि पूरा गर्नु हो। यी दिनहरू कजा गर्नुपर्छ किनभने रमजानको रोजा महिनाको एक स्तम्भ रहन्छ, र महिनावारीका कारण स्थगित भएका दिनहरू बाँकी मानिन्छन्, यसमा तपाईंको कुनै दोष हुँदैन।',
    section1Body2: 'कजा सामान्यतया रमजान सकिनेबित्तिकै, तपाईंको अवस्थाले अनुमति दिनेबित्तिकै सुरु गर्न सकिन्छ। तपाईं यी दिनहरू आफ्नै गतिमा व्यवस्थित गर्न सक्नुहुन्छ: कसैले रमजानपछि चाँडै तिनलाई एकै ठाउँमा गर्न रुचाउँछन्, भने अरूले अघिल्ला महिनाहरूमा बिस्तारै छरेर।',
    noteTitle: 'कृपया ध्यान दिनुहोस्',
    noteText: 'दिनहरू लगातार कजा गर्ने वा छरेर गर्ने कुरालाई फिक्हको विचारधाराअनुसार फरक ढङ्गले हेरिन सक्छ; यहाँ कुनै पनि तरिकालाई एकमात्र मान्य रूपमा प्रस्तुत गरिएको छैन।',
    recordTips: [
      'रमजान सकिनेबित्तिकै कजा गर्नुपर्ने कुल दिनको सङ्ख्या लेख्नुहोस्',
      'एउटा सरल विधि छान्नुहोस्: पात्रो, एप, कापी',
      'हरेक दिन कजा हुँदा चिह्न लगाउनुहोस्',
    ],
    section1Body3: 'उदाहरणका लागि, कजा गर्नुपर्ने 6 दिन भएको व्यक्तिले छ हप्तासम्म हप्तामा एक रोजा राख्न वा तिनलाई एउटै अवधिमा समूहमा गर्न छान्न सक्छ, जुन उसलाई बढी मिल्छ।',
    section2Body: 'छुटेका दिनहरू अर्को रमजानअघि कजा गर्ने प्रयास गर्नु सामान्य कुरा हो। यो अभ्यास हरेक अवस्थामा व्यवस्थित रूपमा अनिवार्य होइन, तर यसले व्यवस्थित गर्न सजिलो बनाउँछ र धेरै बाँकी दिनहरू जम्मा हुनबाट जोगाउँछ।',
    visual1Title: 'तपाईंसँग मिल्ने गति',
    visual1Text: 'कजा गर्नुपर्ने दिनहरू आफ्नो तालिकाअनुसार छर्नाले तपाईंलाई दबाबबिना, शान्तिपूर्वक अघि बढ्न दिन्छ।',
    section2Body2: 'अगाडिदेखि योजना बनाउँदा अन्तिम क्षणको तनावबाट जोगिन मद्दत मिल्छ। एउटा सरल सुझाव अर्को रमजानअघि बाँकी दिनहरू गन्नु र कजा गर्नुपर्ने दिनहरू उपलब्ध हप्ता वा महिनाहरूमा छर्नु हो।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'कुनै स्थायी वा दोहोरिने कारणले रोजा राख्न रोक्छ भने (जस्तै लामो स्वास्थ्य अवस्था), त्यो अवस्था फरक ढाँचाअन्तर्गत पर्न सक्छ; त्यसबेला योग्य विद्वानसँग छलफल गर्नु विशेष रूपमा उपयोगी हुन्छ।',
    alert2Title: 'महत्त्वपूर्ण जानकारी',
    alert2Text: 'समयसीमा नाघेमा लागू हुने सही नियमहरू व्याख्याअनुसार फरक हुन सक्छन्। कुनै जटिल अवस्थाका लागि योग्य विद्वानको राय नै सन्दर्भ रहन्छ।',
    section2Body3: 'उदाहरणका लागि, अर्को रमजान 8 महिनापछि सुरु हुन्छ र कजा गर्न 6 दिन बाँकी छन् भने, एउटा सम्भावना अप्रत्याशित परिस्थितिका लागि लचिलोपनसहित महिनामा करिब एक दिनको योजना बनाउनु हो।',
    section3Body: 'गर्भावस्था र स्तनपानले रोजा राख्ने क्षमतालाई असर गर्न सक्छ, विशेष गरी रोजाले आमा वा बच्चाको स्वास्थ्यमा जोखिम ल्याउँदा। शारीरिक भलाइ र रोजा राख्ने वास्तविक क्षमता ध्यानमा राख्नुपर्ने महत्त्वपूर्ण कारकहरू हुन्।',
    visual2Title: 'ध्यानमा लिइने अवस्था',
    visual2Text: 'यी परिस्थितिहरूलाई धार्मिक परम्पराले सम्भावित छुटको कारण बन्न सक्ने रूपमा मान्यता दिएको छ।',
    section3Body2: 'गर्भावस्था वा स्तनपानको समयमा नराखिएको रोजाबारे धार्मिक रायहरू विचारधाराअनुसार फरक हुन सक्छन्, विशेष गरी साधारण कजा पर्याप्त छ कि क्षतिपूर्ति पनि सम्बद्ध छ भन्ने प्रश्नमा। रोजा नराख्नुको सही कारण र व्यक्तिगत अवस्थाले लागू हुने उत्तरलाई प्रभाव पार्न सक्छ।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'कजाले तपाईंलाई छुटेका रोजाका दिनहरू आफ्नै गतिमा शान्तिपूर्वक पूरा गर्न दिन्छ। कुनै विशेष अवस्था (नाघेको समयसीमा, गर्भावस्था, स्तनपान, स्थायी बाधा) मा योग्य विद्वानको राय नै सबैभन्दा राम्रो स्रोत रहन्छ।',
    shareMessage: 'रोजा र छुट: कजा गर्ने (कजा) — AWA',
  },
  si: {
    badge: 'උපවාසය සහ කදා',
    title: 'උපවාසය සහ නිදහස් කිරීම:\nපිරිමැසීම (කදා)',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'නිති අසන ප්‍රශ්න',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'මග හැරුණු උපවාස දින පිරිමැසිය යුත්තේ කෙසේද සහ කවදාද, ඔබේම වේගයෙන් සහ වරදකාරී හැඟීමකින් තොරව.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'මග හැරුණු දින පිරිමැසිය යුත්තේ කවදාද?',
      'පොදු කාල රාමුවක්: ඊළඟ රමළාන් පෙර',
      'ගර්භණී කාලය සහ මව්කිරි පෙවීම',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'කදා යනු රමළාන් කාලයේ, විශේෂයෙන් ඔසප් නිසා, මග හැරුණු උපවාස දින පසුව පිරිමැසීමයි. රමළාන් උපවාසය මාසයේ ස්ථම්භයක් ලෙස පවතින බැවින් සහ ඔසප් නිසා අත්හිටවූ දින ණයකට ගණන් ගන්නා බැවින් මෙම දින පිරිමැසිය යුතුයි, මෙය ඔබේ කිසිදු වරදක් නොවේ.',
    section1Body2: 'පිරිමැසීම සාමාන්‍යයෙන් රමළාන් අවසන් වූ විගස, ඔබේ තත්ත්වයට ඉඩ දෙන විගස ආරම්භ කළ හැක. ඔබට මෙම දින ඔබේම වේගයෙන් සංවිධානය කළ හැක: සමහරුන් රමළාන් පසු ඉක්මනින් ඒවා එකට කණ්ඩායම් කිරීමට කැමති අතර, තවත් අය ඉදිරි මාස පුරා ක්‍රමයෙන් ව්‍යාප්ත කරති.',
    noteTitle: 'කරුණාකර සටහන් කරන්න',
    noteText: 'දින අඛණ්ඩව පිරිමැසීම හෝ ඒවා ව්‍යාප්ත කිරීම නීති චින්තන ධාරාව අනුව වෙනස් ලෙස සැලකිය හැක; මෙහි කිසිදු ප්‍රවේශයක් එකම වලංගු එක ලෙස ඉදිරිපත් නොකෙරේ.',
    recordTips: [
      'රමළාන් අවසන් වූ විගස පිරිමැසිය යුතු මුළු දින ගණන ලියන්න',
      'සරල ක්‍රමයක් තෝරන්න: දින දර්ශනය, යෙදුම, සටහන් පොත',
      'සෑම දිනයක්ම පිරිමැසූ විට එය සලකුණු කරන්න',
    ],
    section1Body3: 'උදාහරණයක් ලෙස, පිරිමැසිය යුතු දින 6ක් ඇති පුද්ගලයෙකුට සති හයක් සඳහා සතියකට එකක් උපවාසය තබන්න තෝරා ගත හැකිය, නැතහොත් ඔවුන්ට වඩා ගැළපේ නම් ඒවා එකම කාලයකට කණ්ඩායම් කළ හැක.',
    section2Body: 'ඊළඟ රමළාන් පෙර මග හැරුණු දින පිරිමැසීමට උත්සාහ කිරීම සාමාන්‍යයි. මෙම පුරුද්ද සෑම අවස්ථාවකම ක්‍රමානුකූලව අනිවාර්ය නොවේ, නමුත් එය සංවිධානය කිරීම පහසු කරන අතර බොහෝ ඉතිරි දින රැස් වීම වළක්වයි.',
    visual1Title: 'ඔබට අනුවර්තනය වන වේගයක්',
    visual1Text: 'ඔබේ කාලසටහනට අනුව පිරිමැසිය යුතු දින ව්‍යාප්ත කිරීම ඔබට පීඩනයකින් තොරව, සන්සුන්ව ඉදිරියට යාමට ඉඩ දෙයි.',
    section2Body2: 'කල්තියා සැලසුම් කිරීම අවසාන මොහොතේ ආතතිය වළක්වා ගැනීමට උපකාරී වේ. සරල ඉඟියක් නම් ඊළඟ රමළාන් දක්වා ඉතිරි දින ගණන ගණන් කර, පිරිමැසිය යුතු දින ලබාගත හැකි සති හෝ මාස පුරා ව්‍යාප්ත කිරීමයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ස්ථිර හෝ පුනරාවර්තන හේතුවක් (උදාහරණයක් ලෙස දිගුකාලීන සෞඛ්‍ය තත්ත්වයක්) උපවාසය වළක්වන්නේ නම්, තත්ත්වය වෙනත් රාමුවක් යටතට වැටිය හැක; එවිට සුදුසුකම් ලත් විද්වතෙකු සමඟ එය සාකච්ඡා කිරීම විශේෂයෙන් ප්‍රයෝජනවත්.',
    alert2Title: 'වැදගත් තොරතුරු',
    alert2Text: 'කාල රාමුව ඉක්මවා ගියහොත් නිශ්චිත රීති අර්ථකථනය අනුව වෙනස් විය හැක. ඕනෑම සංකීර්ණ තත්ත්වයක් සඳහා, සුදුසුකම් ලත් විද්වතෙකුගේ මතය යොමුව ලෙස පවතී.',
    section2Body3: 'උදාහරණයක් ලෙස, ඊළඟ රමළාන් මාස 8කින් ආරම්භ වී පිරිමැසිය යුතු දින 6ක් ඉතිරිව ඇත්නම්, එක් හැකියාවක් නම් අනපේක්ෂිත අවස්ථා සඳහා නම්‍යශීලී බවකින් මසකට දිනක් පමණ සැලසුම් කිරීමයි.',
    section3Body: 'ගර්භණී කාලය සහ මව්කිරි පෙවීම උපවාස කිරීමේ හැකියාවට බලපෑ හැක, විශේෂයෙන් උපවාසය මවගේ හෝ දරුවාගේ සෞඛ්‍යයට අවදානමක් ඇති කරන විට. ශාරීරික යහපැවැත්ම සහ උපවාස කිරීමේ සැබෑ හැකියාව සැලකිල්ලට ගත යුතු වැදගත් සාධක වේ.',
    visual2Title: 'සැලකිල්ලට ගන්නා තත්ත්වයක්',
    visual2Text: 'මෙම තත්ත්වයන් ආගමික සම්ප්‍රදාය විසින් නිදහස් කිරීමකට හේතු විය හැකි බව පිළිගනු ලැබේ.',
    section3Body2: 'ගර්භණී කාලය හෝ මව්කිරි පෙවීම අතරතුර නොකළ උපවාසය සම්බන්ධයෙන් ආගමික මත ධාරාව අනුව වෙනස් විය හැක, විශේෂයෙන් සරල පිරිමැසීමක් ප්‍රමාණවත්ද නැතහොත් වන්දියක්ද ඇතුළත් වේද යන ප්‍රශ්නය සම්බන්ධයෙන්. උපවාසය නොකිරීමේ නිශ්චිත හේතුව සහ පෞද්ගලික තත්ත්වය අදාළ පිළිතුරට බලපෑ හැක.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'කදා ඔබට මග හැරුණු උපවාස දින ඔබේම වේගයෙන් සන්සුන්ව පිරිමැසීමට ඉඩ දෙයි. විශේෂ තත්ත්වයක් (ඉක්මවා ගිය කාල රාමුවක්, ගර්භණී කාලය, මව්කිරි පෙවීම, ස්ථිර බාධාවක්) තුළ, සුදුසුකම් ලත් විද්වතෙකුගේ මතය හොඳම සම්පතයි.',
    shareMessage: 'උපවාසය සහ නිදහස් කිරීම: පිරිමැසීම (කදා) — AWA',
  },
  th: {
    badge: 'การถือศีลอดและกอฎาอ์',
    title: 'การถือศีลอดและการยกเว้น:\nการชดเชย (กอฎาอ์)',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คำถามที่พบบ่อย',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ชดเชยวันถือศีลอดที่พลาดอย่างไรและเมื่อไร ตามจังหวะของคุณและโดยไม่รู้สึกผิด',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ควรชดเชยวันที่พลาดเมื่อไร?',
      'กรอบเวลาที่พบบ่อย: ก่อนรอมฎอนครั้งถัดไป',
      'การตั้งครรภ์และการให้นมแม่',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'กอฎาอ์หมายถึงการชดเชยในภายหลังซึ่งวันถือศีลอดที่พลาดในเดือนรอมฎอน — โดยเฉพาะเพราะมีประจำเดือน วันเหล่านี้ต้องชดเชยเพราะการถือศีลอดรอมฎอนยังคงเป็นเสาหลักของเดือน และวันที่ถูกระงับเพราะมีประจำเดือนนับเป็นวันที่ค้างอยู่ โดยไม่ใช่ความผิดของคุณแต่อย่างใด',
    section1Body2: 'โดยทั่วไปเริ่มชดเชยได้ทันทีที่รอมฎอนสิ้นสุด ทันทีที่สถานการณ์ของคุณเอื้ออำนวย คุณจัดวันเหล่านี้ตามจังหวะของคุณเองได้: บางคนชอบรวมไว้ในช่วงเดียวกันหลังรอมฎอนไม่นาน ขณะที่บางคนกระจายไปทีละน้อยตลอดหลายเดือนต่อมา',
    noteTitle: 'โปรดทราบ',
    noteText: 'การชดเชยวันติดต่อกันหรือกระจายออกไปอาจถูกมองต่างกันตามสำนักนิติศาสตร์ ที่นี่ไม่ได้นำเสนอวิธีใดเป็นวิธีเดียวที่ถูกต้อง',
    recordTips: [
      'จดจำนวนวันที่ต้องชดเชยทั้งหมดทันทีที่รอมฎอนสิ้นสุด',
      'เลือกวิธีง่าย ๆ: ปฏิทิน แอป สมุดบันทึก',
      'ทำเครื่องหมายแต่ละวันเมื่อชดเชยแล้ว',
    ],
    section1Body3: 'ตัวอย่างเช่น คนที่มี 6 วันต้องชดเชยเลือกถือศีลอดสัปดาห์ละหนึ่งวันเป็นเวลาหกสัปดาห์ หรือรวมไว้ในช่วงเดียวกันหากเหมาะกับตนเองมากกว่า',
    section2Body: 'เป็นเรื่องปกติที่จะพยายามชดเชยวันที่พลาดก่อนรอมฎอนครั้งถัดไป การปฏิบัตินี้ไม่ใช่ข้อบังคับเสมอไปในทุกกรณี แต่ช่วยให้จัดการง่ายขึ้นและหลีกเลี่ยงการสะสมวันที่ค้างอยู่เป็นจำนวนมาก',
    visual1Title: 'จังหวะที่ปรับตามคุณ',
    visual1Text: 'การกระจายวันที่ต้องชดเชยตามตารางของคุณช่วยให้คุณก้าวไปอย่างสงบ โดยไม่มีแรงกดดัน',
    section2Body2: 'การวางแผนล่วงหน้าช่วยหลีกเลี่ยงความเครียดในนาทีสุดท้าย เคล็ดลับง่าย ๆ คือนับจำนวนวันที่เหลือก่อนรอมฎอนครั้งถัดไป แล้วกระจายวันที่ต้องชดเชยตามสัปดาห์หรือเดือนที่มี',
    tip1Title: 'ควรรู้',
    tip1Text: 'หากมีเหตุผลที่ยาวนานหรือเกิดซ้ำที่ทำให้ไม่สามารถถือศีลอดได้ (เช่น ภาวะสุขภาพที่ยืดเยื้อ) สถานการณ์นั้นอาจอยู่ภายใต้กรอบที่ต่างออกไป จึงมีประโยชน์เป็นพิเศษที่จะปรึกษาผู้รู้ที่มีคุณวุฒิ',
    alert2Title: 'ข้อมูลสำคัญ',
    alert2Text: 'กฎที่แน่นอนในกรณีที่เกินกรอบเวลาอาจต่างกันตามการตีความ สำหรับสถานการณ์ที่ซับซ้อน ความเห็นของผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งอ้างอิง',
    section2Body3: 'ตัวอย่างเช่น หากรอมฎอนครั้งถัดไปเริ่มในอีก 8 เดือนและเหลือ 6 วันที่ต้องชดเชย ทางหนึ่งที่เป็นไปได้คือวางแผนประมาณเดือนละหนึ่งวัน โดยเผื่อความยืดหยุ่นสำหรับเหตุไม่คาดคิด',
    section3Body: 'การตั้งครรภ์และการให้นมแม่อาจส่งผลต่อความสามารถในการถือศีลอด โดยเฉพาะเมื่อการถือศีลอดเป็นความเสี่ยงต่อสุขภาพของแม่หรือเด็ก ความเป็นอยู่ทางกายและความสามารถที่แท้จริงในการถือศีลอดเป็นปัจจัยสำคัญที่ต้องคำนึงถึง',
    visual2Title: 'สถานการณ์ที่ได้รับการพิจารณา',
    visual2Text: 'ประเพณีทางศาสนายอมรับว่าสถานการณ์เหล่านี้อาจเป็นเหตุให้ได้รับการยกเว้น',
    section3Body2: 'ความเห็นทางศาสนาเกี่ยวกับการถือศีลอดที่ไม่ได้ทำระหว่างตั้งครรภ์หรือให้นมแม่อาจต่างกันตามสำนัก โดยเฉพาะประเด็นว่าการชดเชยอย่างเดียวเพียงพอหรือมีการชดใช้ด้วย เหตุผลที่แน่ชัดของการไม่ถือศีลอดและสถานการณ์ส่วนตัวอาจมีผลต่อคำตอบที่ใช้ได้',
    tip2Title: 'ควรรู้',
    tip2Text: 'กอฎาอ์ช่วยให้คุณชดเชยวันถือศีลอดที่พลาดอย่างสงบ ตามจังหวะของคุณ ในกรณีพิเศษ (เกินกรอบเวลา ตั้งครรภ์ ให้นมแม่ อุปสรรคที่ยาวนาน) ความเห็นของผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งที่ดีที่สุด',
    shareMessage: 'การถือศีลอดและการยกเว้น: การชดเชย (กอฎาอ์) — AWA',
  },
  vi: {
    badge: 'NHỊN ĂN & QADAA',
    title: 'Nhịn ăn và được miễn:\nbù lại các ngày (Qadaa)',
    metaDuration: '6 phút đọc',
    metaType: 'Câu hỏi thường gặp',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Cách thức và thời điểm bù lại những ngày nhịn ăn đã bỏ lỡ, theo nhịp của bạn và không mặc cảm.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Khi nào bù lại những ngày đã bỏ lỡ?',
      'Một khung thời gian phổ biến: trước Ramadan tiếp theo',
      'Thai kỳ và cho con bú',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Qadaa là việc bù lại, vào một thời điểm sau đó, những ngày nhịn ăn đã bỏ lỡ trong tháng Ramadan — đặc biệt do kinh nguyệt. Những ngày này phải được bù lại vì nhịn ăn Ramadan vẫn là một trụ cột của tháng này, và những ngày bị tạm ngưng do kinh nguyệt được tính là còn nợ, mà đó không phải là lỗi của bạn.',
    section1Body2: 'Việc bù thường có thể bắt đầu ngay khi Ramadan kết thúc, ngay khi hoàn cảnh của bạn cho phép. Bạn có thể sắp xếp những ngày này theo nhịp của riêng mình: một số người thích gom lại ngay sau Ramadan, trong khi người khác chia đều dần dần trong những tháng tiếp theo.',
    noteTitle: 'Xin lưu ý',
    noteText: 'Việc bù các ngày liên tiếp hay chia nhỏ có thể được nhìn nhận khác nhau tùy theo trường phái luật học; không cách nào được trình bày ở đây là cách duy nhất hợp lệ.',
    recordTips: [
      'Ghi lại tổng số ngày cần bù ngay khi Ramadan kết thúc',
      'Chọn một cách đơn giản: lịch, ứng dụng, sổ tay',
      'Đánh dấu từng ngày khi đã bù',
    ],
    section1Body3: 'Ví dụ, một người có 6 ngày cần bù có thể chọn nhịn một ngày mỗi tuần trong sáu tuần, hoặc gom lại trong cùng một khoảng thời gian nếu điều đó phù hợp hơn.',
    section2Body: 'Việc cố gắng bù lại những ngày đã bỏ lỡ trước Ramadan tiếp theo là phổ biến. Thực hành này không bắt buộc một cách hệ thống trong mọi trường hợp, nhưng nó giúp việc sắp xếp dễ dàng hơn và tránh dồn lại một số lượng lớn ngày còn nợ.',
    visual1Title: 'Một nhịp độ thích ứng với bạn',
    visual1Text: 'Chia nhỏ các ngày cần bù theo lịch trình của bạn giúp bạn tiến bước bình tĩnh, không áp lực.',
    section2Body2: 'Lên kế hoạch trước giúp tránh căng thẳng vào phút chót. Một mẹo đơn giản là đếm số ngày còn lại trước Ramadan tiếp theo và chia các ngày cần bù cho những tuần hoặc tháng có sẵn.',
    tip1Title: 'Nên biết',
    tip1Text: 'Nếu có lý do lâu dài hoặc lặp đi lặp lại khiến không thể nhịn ăn (ví dụ một tình trạng sức khỏe kéo dài), tình huống đó có thể thuộc một khuôn khổ khác; khi đó đặc biệt hữu ích khi trao đổi với một học giả có thẩm quyền.',
    alert2Title: 'Thông tin quan trọng',
    alert2Text: 'Các quy định cụ thể trong trường hợp vượt quá khung thời gian có thể khác nhau tùy theo cách diễn giải. Với mọi tình huống phức tạp, ý kiến của một học giả có thẩm quyền vẫn là tham chiếu.',
    section2Body3: 'Ví dụ, nếu Ramadan tiếp theo bắt đầu sau 8 tháng và còn 6 ngày cần bù, một khả năng là lên kế hoạch khoảng một ngày mỗi tháng, với sự linh hoạt cho những tình huống không lường trước.',
    section3Body: 'Thai kỳ và cho con bú có thể ảnh hưởng đến khả năng nhịn ăn, đặc biệt khi nhịn ăn gây rủi ro cho sức khỏe của người mẹ hoặc đứa trẻ. Sức khỏe thể chất và khả năng nhịn ăn thực tế là những yếu tố quan trọng cần cân nhắc.',
    visual2Title: 'Một tình huống được cân nhắc',
    visual2Text: 'Những hoàn cảnh này được truyền thống tôn giáo công nhận là có thể dẫn đến việc được miễn.',
    section3Body2: 'Ý kiến tôn giáo về việc không nhịn ăn trong thai kỳ hoặc khi cho con bú có thể khác nhau tùy theo trường phái, đặc biệt ở câu hỏi liệu chỉ cần bù đơn giản là đủ hay còn có thêm khoản bồi thường. Lý do cụ thể của việc không nhịn ăn và hoàn cảnh cá nhân có thể ảnh hưởng đến câu trả lời áp dụng.',
    tip2Title: 'Nên biết',
    tip2Text: 'Qadaa cho phép bạn bình tĩnh bù lại những ngày nhịn ăn đã bỏ lỡ, theo nhịp của riêng mình. Trong trường hợp đặc biệt (vượt quá khung thời gian, thai kỳ, cho con bú, trở ngại lâu dài), ý kiến của một học giả có thẩm quyền vẫn là nguồn tham khảo tốt nhất.',
    shareMessage: 'Nhịn ăn và được miễn: bù lại các ngày (Qadaa) — AWA',
  },
  uz: {
    badge: 'ROʻZA VA QAZO',
    title: 'Roʻza va ruxsat:\nqazo qilish (qazo)',
    metaDuration: '6 daq oʻqish',
    metaType: 'Savol-javob',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Oʻtkazib yuborilgan roʻza kunlarini qanday va qachon qazo qilish kerak — oʻz surʼatingizda va aybdorlik hissisiz.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Oʻtkazib yuborilgan kunlarni qachon qazo qilish kerak?',
      'Keng tarqalgan muddat: keyingi Ramazongacha',
      'Homiladorlik va emizish',
      'Asosiy xulosalar',
    ],
    section1Body: 'Qazo Ramazonda, xususan hayz sababli, oʻtkazib yuborilgan roʻza kunlarini keyinroq bajarishni bildiradi. Bu kunlar qazo qilinishi kerak, chunki Ramazon roʻzasi oyning ustuni boʻlib qoladi va hayz sababli toʻxtatilgan kunlar qarz hisoblanadi, bunda sizning hech qanday aybingiz yoʻq.',
    section1Body2: 'Qazo odatda Ramazon tugashi bilan, vaziyatingiz imkon berishi bilan boshlanishi mumkin. Bu kunlarni oʻz surʼatingizda tartibga solishingiz mumkin: baʼzilar ularni Ramazondan keyin tez orada jamlashni afzal koʻradi, boshqalari esa keyingi oylar davomida asta-sekin taqsimlaydi.',
    noteTitle: 'Eʼtibor bering',
    noteText: 'Kunlarni ketma-ket yoki taqsimlab qazo qilish fiqhiy maktabga qarab turlicha qaralishi mumkin; bu yerda hech bir yondashuv yagona toʻgʻri deb taqdim etilmaydi.',
    recordTips: [
      'Ramazon tugashi bilan qazo qilinadigan kunlarning umumiy sonini yozib qoʻying',
      'Oddiy usulni tanlang: taqvim, ilova, daftar',
      'Qazo qilingan har bir kunni belgilab boring',
    ],
    section1Body3: 'Masalan, qazo qilinadigan 6 kuni bor odam olti hafta davomida haftada bittadan roʻza tutishni yoki, agar unga mosroq boʻlsa, ularni bir davrga jamlashni tanlashi mumkin.',
    section2Body: 'Oʻtkazib yuborilgan kunlarni keyingi Ramazongacha qazo qilishga urinish keng tarqalgan. Bu amal har bir holatda tizimli ravishda majburiy emas, lekin tartibga solishni osonlashtiradi va koʻp sonli kutilayotgan kunlar toʻplanishining oldini oladi.',
    visual1Title: 'Sizga moslashadigan surʼat',
    visual1Text: 'Qazo qilinadigan kunlarni jadvalingizga qarab taqsimlash bosimsiz, xotirjam oldinga siljish imkonini beradi.',
    section2Body2: 'Oldindan rejalashtirish oxirgi daqiqadagi stressdan saqlaydi. Oddiy maslahat — keyingi Ramazongacha qolgan kunlar sonini sanash va qazo kunlarini mavjud haftalar yoki oylarga taqsimlash.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Agar uzoq muddatli yoki takrorlanuvchi sabab roʻza tutishga toʻsqinlik qilsa (masalan, uzoq davom etadigan sogʻliq holati), vaziyat boshqa doiraga kirishi mumkin; shunda malakali olim bilan muhokama qilish ayniqsa foydali.',
    alert2Title: 'Muhim maʼlumot',
    alert2Text: 'Muddat oshib ketgan holatda aniq qoidalar talqinga qarab farq qilishi mumkin. Har qanday murakkab vaziyat uchun malakali olimning fikri tayanch boʻlib qoladi.',
    section2Body3: 'Masalan, agar keyingi Ramazon 8 oydan keyin boshlansa va 6 kun qazo qilish qolgan boʻlsa, bir imkoniyat — kutilmagan holatlar uchun moslashuvchanlik bilan oyiga taxminan bir kun rejalashtirish.',
    section3Body: 'Homiladorlik va emizish roʻza tutish qobiliyatiga, ayniqsa roʻza ona yoki bola salomatligiga xavf tugʻdirganda, taʼsir qilishi mumkin. Jismoniy farovonlik va roʻza tutishning haqiqiy imkoniyati hisobga olinishi kerak boʻlgan muhim omillar.',
    visual2Title: 'Hisobga olinadigan vaziyat',
    visual2Text: 'Bu holatlar diniy anʼana tomonidan ruxsat berilishi mumkin deb tan olinadi.',
    section3Body2: 'Homiladorlik yoki emizish paytida tutilmagan roʻza haqidagi diniy fikrlar maktabga qarab farq qilishi mumkin, xususan, oddiy qazo yetarlimi yoki qoʻshimcha kompensatsiya ham koʻzda tutiladimi degan savolda. Roʻza tutmaslikning aniq sababi va shaxsiy vaziyat qoʻllaniladigan javobga taʼsir qilishi mumkin.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'Qazo oʻtkazib yuborilgan roʻza kunlarini oʻz surʼatingizda xotirjam bajarish imkonini beradi. Alohida vaziyatda (muddat oshib ketgan, homiladorlik, emizish, doimiy toʻsiq) malakali olimning fikri eng yaxshi manba boʻlib qoladi.',
    shareMessage: 'Roʻza va ruxsat: qazo qilish — AWA',
  },
  az: {
    badge: 'ORUC VƏ QƏZA',
    title: 'Oruc və azad olma:\nqəza (Qəza)',
    metaDuration: '6 dəq oxu',
    metaType: 'FAQ',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Buraxılmış oruc günlərini öz tempinizlə və günah hissi olmadan necə və nə vaxt qəza etmək olar.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Buraxılmış günləri nə vaxt qəza etmək lazımdır?',
      'Ümumi müddət: növbəti Ramazandan əvvəl',
      'Hamiləlik və əmizdirmə',
      'Əsas nəticələr',
    ],
    section1Body: 'Qəza Ramazanda, xüsusilə aybaşı səbəbilə buraxılmış oruc günlərini sonradan tamamlamağa deyilir. Bu günlər qəza edilməlidir, çünki Ramazan orucu ayın dayaqlarından olaraq qalır və aybaşı səbəbilə dayandırılan günlər borc sayılır, bu isə sizin heç bir günahınız deyil.',
    section1Body2: 'Qəza adətən vəziyyətiniz imkan verən kimi Ramazan bitdikdən dərhal sonra başlaya bilər. Bu günləri öz tempinizlə təşkil edə bilərsiniz: bəziləri onları Ramazandan dərhal sonra qruplaşdırmağa üstünlük verir, digərləri isə sonrakı aylar ərzində tədricən bölüşdürür.',
    noteTitle: 'Nəzərə alın',
    noteText: 'Günləri ardıcıl qəza etmək və ya bölüşdürmək hüquq məktəbindən asılı olaraq fərqli qiymətləndirilə bilər; burada heç bir yanaşma yeganə etibarlı yanaşma kimi təqdim edilmir.',
    recordTips: [
      'Ramazan bitən kimi qəza ediləcək günlərin ümumi sayını yazın',
      'Sadə üsul seçin: təqvim, tətbiq, dəftər',
      'Qəza edilən hər günü qeyd edin',
    ],
    section1Body3: 'Məsələn, qəza etməli 6 günü olan şəxs altı həftə ərzində həftədə bir gün oruc tutmağı seçə və ya bu ona daha uyğundursa, onları eyni dövrdə qruplaşdıra bilər.',
    section2Body: 'Buraxılmış günləri növbəti Ramazandan əvvəl qəza etməyə çalışmaq geniş yayılıb. Bu təcrübə hər halda sistematik olaraq məcburi deyil, lakin təşkilatı asanlaşdırır və çoxlu gözləyən günün yığılmasının qarşısını alır.',
    visual1Title: 'Sizə uyğunlaşan temp',
    visual1Text: 'Qəza ediləcək günləri cədvəlinizə uyğun bölüşdürmək təzyiqsiz, sakitcə irəliləməyə imkan verir.',
    section2Body2: 'Əvvəlcədən planlaşdırmaq son dəqiqə stressinin qarşısını almağa kömək edir. Sadə məsləhət növbəti Ramazana qədər qalan günlərin sayını hesablamaq və qəza ediləcək günləri mövcud həftələr və ya aylar arasında bölüşdürməkdir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Davamlı və ya təkrarlanan səbəb oruc tutmağa mane olarsa (məsələn, uzunmüddətli sağlamlıq vəziyyəti), vəziyyət fərqli çərçivəyə aid ola bilər; bu halda səlahiyyətli alimlə müzakirə etmək xüsusilə faydalıdır.',
    alert2Title: 'Vacib məlumat',
    alert2Text: 'Müddət keçildiyi halda dəqiq qaydalar şərhdən asılı olaraq fərqlənə bilər. İstənilən mürəkkəb vəziyyət üçün səlahiyyətli alimin fikri istinad olaraq qalır.',
    section2Body3: 'Məsələn, növbəti Ramazan 8 aydan sonra başlayırsa və qəza ediləcək 6 gün qalıbsa, bir imkan gözlənilməz hallar üçün çeviklik saxlamaqla ayda təxminən bir gün planlaşdırmaqdır.',
    section3Body: 'Hamiləlik və əmizdirmə oruc tutmaq qabiliyyətinə təsir edə bilər, xüsusilə oruc ananın və ya uşağın sağlamlığı üçün risk yaradanda. Fiziki rifah və oruc tutmaq üçün real imkan nəzərə alınmalı vacib amillərdir.',
    visual2Title: 'Nəzərə alınan vəziyyət',
    visual2Text: 'Bu şərait dini ənənə tərəfindən azad olma doğura bilən kimi tanınır.',
    section3Body2: 'Hamiləlik və ya əmizdirmə zamanı tutulmayan oruc barədə dini fikirlər məktəbdən asılı olaraq, xüsusilə sadə qəzanın kifayət olub-olmadığı və ya əlavə kompensasiyanın da söz mövzusu olub-olmadığı məsələsində dəyişə bilər. Oruc tutmamağın dəqiq səbəbi və şəxsi vəziyyət tətbiq olunan cavaba təsir edə bilər.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Qəza buraxılmış oruc günlərini öz tempinizlə sakitcə tamamlamağa imkan verir. Xüsusi vəziyyət halında (keçilmiş müddət, hamiləlik, əmizdirmə, davamlı maneə) səlahiyyətli alimin fikri ən yaxşı mənbə olaraq qalır.',
    shareMessage: 'Oruc və azad olma: qəza — AWA',
  },
  ka: {
    badge: 'მარხვა და კადაა',
    title: 'მარხვა და გათავისუფლება:\nანაზღაურება (კადაა)',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'ხშირი კითხვები',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'როგორ და როდის აანაზღაუროთ გამოტოვებული მარხვის დღეები, თქვენი ტემპით და დანაშაულის გრძნობის გარეშე.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'როდის უნდა აანაზღაუროთ გამოტოვებული დღეები?',
      'გავრცელებული ვადა: შემდეგ რამადანამდე',
      'ორსულობა და ძუძუთი კვება',
      'მთავარი დასკვნები',
    ],
    section1Body: 'კადაა ნიშნავს რამადანში გამოტოვებული მარხვის დღეების მოგვიანებით ანაზღაურებას — განსაკუთრებით მენსტრუაციის გამო. ეს დღეები უნდა აინაზღაუროს, რადგან რამადანის მარხვა თვის საყრდენად რჩება, ხოლო მენსტრუაციის გამო შეჩერებული დღეები ვალად ითვლება და ეს თქვენი რაიმე ბრალი არ არის.',
    section1Body2: 'ანაზღაურება ზოგადად შეიძლება დაიწყოს რამადანის დასრულებისთანავე, როგორც კი თქვენი სიტუაცია იძლევა საშუალებას. ამ დღეების მოწესრიგება თქვენი ტემპით შეგიძლიათ: ზოგს ურჩევნია რამადანის შემდეგ მალევე გაერთიანება, ზოგი კი მათ ეტაპობრივად ანაწილებს მომდევნო თვეებზე.',
    noteTitle: 'გაითვალისწინეთ',
    noteText: 'დღეების ზედიზედ ანაზღაურება ან განაწილება სამართლებრივი სკოლის მიხედვით შეიძლება განსხვავებულად განიხილებოდეს; არცერთი მიდგომა აქ ერთადერთ ვალიდურად არ არის წარმოდგენილი.',
    recordTips: [
      'ჩაიწერეთ ასანაზღაურებელი დღეების საერთო რაოდენობა რამადანის დასრულებისთანავე',
      'აირჩიეთ მარტივი მეთოდი: კალენდარი, აპი, რვეული',
      'მონიშნეთ თითოეული დღე ანაზღაურებისას',
    ],
    section1Body3: 'მაგალითად, ადამიანს, რომელსაც 6 დღის ანაზღაურება აქვს, შეუძლია ექვსი კვირის განმავლობაში კვირაში ერთი დღე იმარხულოს ან დღეები ერთ პერიოდში გააერთიანოს, თუ ეს უფრო მოუხდება.',
    section2Body: 'გავრცელებულია გამოტოვებული დღეების შემდეგ რამადანამდე ანაზღაურების მცდელობა. ეს პრაქტიკა ყველა შემთხვევაში სისტემურად სავალდებულო არ არის, მაგრამ ორგანიზებას ამარტივებს და არ აძლევს დიდი რაოდენობით მოლოდინში მყოფი დღეების დაგროვების საშუალებას.',
    visual1Title: 'ტემპი, რომელიც თქვენზე ერგება',
    visual1Text: 'ასანაზღაურებელი დღეების განაწილება თქვენი განრიგის მიხედვით საშუალებას გაძლევთ მშვიდად წახვიდეთ წინ, ზეწოლის გარეშე.',
    section2Body2: 'წინასწარ დაგეგმვა ბოლო წუთის სტრესის თავიდან აცილებაში გეხმარებათ. მარტივი რჩევაა, დათვალოთ შემდეგ რამადანამდე დარჩენილი დღეების რაოდენობა და ასანაზღაურებელი დღეები ხელმისაწვდომ კვირებსა თუ თვეებზე გაანაწილოთ.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თუ მარხვას გრძელვადიანი ან განმეორებადი მიზეზი უშლის ხელს (მაგალითად, ხანგრძლივი ჯანმრთელობის მდგომარეობა), სიტუაცია შეიძლება სხვა ჩარჩოში ექცეოდეს; ამ შემთხვევაში განსაკუთრებით სასარგებლოა კვალიფიციურ მეცნიერთან განხილვა.',
    alert2Title: 'მნიშვნელოვანი ინფორმაცია',
    alert2Text: 'ზუსტი წესები ვადის გადაცილების შემთხვევაში ინტერპრეტაციის მიხედვით შეიძლება განსხვავდებოდეს. ნებისმიერ რთულ სიტუაციაში კვალიფიციური მეცნიერის აზრი რჩება საორიენტაციო წყაროდ.',
    section2Body3: 'მაგალითად, თუ შემდეგი რამადანი 8 თვეში იწყება და 6 დღეა ასანაზღაურებელი, ერთი შესაძლებლობაა, დაგეგმოთ დაახლოებით ერთი დღე თვეში, გაუთვალისწინებელი გარემოებებისთვის მოქნილობით.',
    section3Body: 'ორსულობამ და ძუძუთი კვებამ შეიძლება მარხვის შესაძლებლობაზე იმოქმედოს, განსაკუთრებით მაშინ, როცა მარხვა დედის ან ბავშვის ჯანმრთელობისთვის რისკს წარმოადგენს. ფიზიკური კეთილდღეობა და მარხვის რეალური შესაძლებლობა გასათვალისწინებელი მნიშვნელოვანი ფაქტორებია.',
    visual2Title: 'გათვალისწინებული სიტუაცია',
    visual2Text: 'რელიგიური ტრადიცია ამ გარემოებებს აღიარებს, როგორც გათავისუფლების შესაძლო საფუძველს.',
    section3Body2: 'რელიგიური მოსაზრებები ორსულობისას ან ძუძუთი კვებისას შეუსრულებელი მარხვის შესახებ სკოლის მიხედვით შეიძლება განსხვავდებოდეს, განსაკუთრებით კითხვაზე, საკმარისია თუ არა მარტივი ანაზღაურება, თუ საქმე ასევე კომპენსაციასაც ეხება. მარხვის შეუსრულებლობის ზუსტმა მიზეზმა და პირადმა სიტუაციამ შეიძლება გავლენა მოახდინოს გამოსაყენებელ პასუხზე.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'კადაა საშუალებას გაძლევთ მშვიდად აანაზღაუროთ გამოტოვებული მარხვის დღეები, თქვენი ტემპით. განსაკუთრებული სიტუაციის შემთხვევაში (გადაცილებული ვადა, ორსულობა, ძუძუთი კვება, ხანგრძლივი დაბრკოლება) კვალიფიციური მეცნიერის აზრი რჩება საუკეთესო წყაროდ.',
    shareMessage: 'მარხვა და გათავისუფლება: ანაზღაურება (კადაა) — AWA',
  },
  hy: {
    badge: 'ՊԱՀՔ ԵՎ ԿԱԴԱ',
    title: 'Պահք և ազատում.\nփոխհատուցումը (կադա)',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'ՀՏՀ',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչպես և երբ փոխհատուցել բաց թողնված պահքի օրերը՝ ձեր տեմպով և առանց մեղքի զգացման:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ե՞րբ փոխհատուցել բաց թողնված օրերը:',
      'Տարածված ժամկետ. մինչև հաջորդ Ռամադանը',
      'Հղիություն և կրծքով կերակրում',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Կադան նշանակում է Ռամադանի ընթացքում բաց թողնված պահքի օրերի փոխհատուցում ավելի ուշ՝ մասնավորապես դաշտանի պատճառով: Այս օրերը պետք է փոխհատուցվեն, քանի որ Ռամադանի պահքը մնում է ամսվա հիմնասյուն, և դաշտանի պատճառով կասեցված օրերը համարվում են պարտք՝ առանց դա ձեր մեղքը լինելու:',
    section1Body2: 'Փոխհատուցումը սովորաբար կարող է սկսվել Ռամադանի ավարտից անմիջապես հետո՝ հենց ձեր իրավիճակը թույլ տա: Այս օրերը կարող եք կազմակերպել ձեր տեմպով. ոմանք նախընտրում են դրանք խմբավորել Ռամադանից անմիջապես հետո, մյուսները՝ աստիճանաբար տարածել հաջորդ ամիսների վրա:',
    noteTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    noteText: 'Օրերը անընդմեջ փոխհատուցելը կամ տարածելը կարող է տարբեր դիտվել՝ կախված իրավագիտական դպրոցից. այստեղ ոչ մի մոտեցում չի ներկայացվում որպես միակ վավերը:',
    recordTips: [
      'Գրեք փոխհատուցվելիք օրերի ընդհանուր թիվը Ռամադանի ավարտից անմիջապես հետո',
      'Ընտրեք պարզ մեթոդ. օրացույց, հավելված, տետր',
      'Նշեք յուրաքանչյուր օրը, երբ այն փոխհատուցվում է',
    ],
    section1Body3: 'Օրինակ՝ 6 օր փոխհատուցելու կարիք ունեցող անձը կարող է ընտրել շաբաթը մեկ օր պահել վեց շաբաթ շարունակ կամ խմբավորել դրանք նույն ժամանակահատվածում, եթե դա ավելի հարմար է:',
    section2Body: 'Տարածված է փորձել փոխհատուցել բաց թողնված օրերը մինչև հաջորդ Ռամադանը: Այս պրակտիկան ամեն դեպքում համակարգված կերպով պարտադիր չէ, սակայն հեշտացնում է կազմակերպումը և թույլ չի տալիս կուտակել մեծ թվով սպասող օրեր:',
    visual1Title: 'Ռիթմ, որը հարմարվում է ձեզ',
    visual1Text: 'Փոխհատուցվելիք օրերը ձեր ժամանակացույցին համապատասխան տարածելը թույլ է տալիս առաջ շարժվել հանգիստ՝ առանց ճնշման:',
    section2Body2: 'Նախօրոք պլանավորելը օգնում է խուսափել վերջին պահի սթրեսից: Պարզ խորհուրդ է հաշվել մինչև հաջորդ Ռամադանը մնացած օրերի քանակը և փոխհատուցվելիք օրերը տարածել հասանելի շաբաթների կամ ամիսների վրա:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Եթե երկարատև կամ կրկնվող պատճառ խանգարում է պահք պահել (օրինակ՝ երկարատև առողջական վիճակ), իրավիճակը կարող է ընկնել այլ շրջանակի տակ. այդ դեպքում հատկապես օգտակար է այն քննարկել որակավորված գիտնականի հետ:',
    alert2Title: 'Կարևոր տեղեկություն',
    alert2Text: 'Ժամկետը գերազանցելու դեպքում ճշգրիտ կանոնները կարող են տարբերվել՝ կախված մեկնաբանությունից: Ցանկացած բարդ իրավիճակի համար որակավորված գիտնականի կարծիքը մնում է հիմնական հղումը:',
    section2Body3: 'Օրինակ՝ եթե հաջորդ Ռամադանը սկսվում է 8 ամիս հետո, և փոխհատուցվելիք է մնացել 6 օր, հնարավորություններից մեկը ամսական մոտ մեկ օր պլանավորելն է՝ անսպասելի հանգամանքների համար ճկունությամբ:',
    section3Body: 'Հղիությունը և կրծքով կերակրումը կարող են ազդել պահք պահելու կարողության վրա, մասնավորապես երբ պահքը վտանգ է ներկայացնում մոր կամ երեխայի առողջության համար: Ֆիզիկական բարեկեցությունը և պահք պահելու իրական կարողությունը հաշվի առնելու կարևոր գործոններ են:',
    visual2Title: 'Իրավիճակ, որը հաշվի է առնվում',
    visual2Text: 'Այս հանգամանքները կրոնական ավանդույթում ճանաչվում են որպես հնարավոր ազատման հիմք:',
    section3Body2: 'Հղիության կամ կրծքով կերակրման ընթացքում չպահված պահքի վերաբերյալ կրոնական կարծիքները կարող են տարբերվել՝ կախված դպրոցից, մասնավորապես այն հարցում, թե արդյոք բավարար է պարզ փոխհատուցումը, թե նաև փոխհատուցող արարք է պահանջվում: Չպահելու ճշգրիտ պատճառը և անձնական իրավիճակը կարող են ազդել կիրառվող պատասխանի վրա:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Կադան թույլ է տալիս հանգիստ փոխհատուցել բաց թողնված պահքի օրերը՝ ձեր տեմպով: Հատուկ իրավիճակի դեպքում (գերազանցված ժամկետ, հղիություն, կրծքով կերակրում, երկարատև խոչընդոտ) որակավորված գիտնականի կարծիքը մնում է լավագույն ռեսուրսը:',
    shareMessage: 'Պահք և ազատում. փոխհատուցումը (կադա) — AWA',
  },
  tg: {
    badge: 'РӮЗА ВА ҚАЗО',
    title: 'Рӯза ва озодӣ:\nқазо кардан (Қазо)',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Саволу ҷавоб',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чӣ тавр ва кай рӯзаҳои аз даст рафтаро қазо кардан лозим аст, бо суръати худ ва бе гуноҳ.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Рӯзаҳои аз даст рафтаро кай қазо кардан лозим аст?',
      'Мӯҳлати маъмул: пеш аз Рамазони оянда',
      'Ҳомиладорӣ ва шири додан',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Қазо маънои дертар ҷуброн кардани рӯзаҳои дар Рамазон аз даст рафтаро дорад — аз ҷумла бо сабаби ҳайз. Ин рӯзҳоро бояд қазо кард, зеро рӯзаи Рамазон рукни моҳ боқӣ мемонад ва рӯзҳое, ки бо сабаби ҳайз қатъ шудаанд, қарз ҳисоб мешаванд, бидуни он ки ин айби шумо бошад.',
    section1Body2: 'Қазо одатан метавонад ҳамин ки Рамазон ба охир расад, ҳангоми имкони вазъияти шумо оғоз шавад. Шумо метавонед ин рӯзҳоро бо суръати худ ба тартиб оред: баъзеҳо афзал медонанд онҳоро пас аз Рамазон ба зудӣ гиранд, дигарон тадриҷан дар моҳҳои минбаъда паҳн мекунанд.',
    noteTitle: 'Таваҷҷӯҳ кунед',
    noteText: 'Пай дар пай қазо кардани рӯзҳо ё паҳн кардани онҳо вобаста ба мазҳаби фиқҳӣ метавонад гуногун баррасӣ шавад; дар ин ҷо ҳеҷ яке аз ин равишҳо ҳамчун ягона дуруст пешниҳод намешавад.',
    recordTips: [
      'Шумораи умумии рӯзҳои қазоро ҳамин ки Рамазон ба охир расад, нависед',
      'Усули оддиро интихоб кунед: тақвим, барнома, дафтар',
      'Ҳар рӯзро ҳангоми қазо шудан қайд кунед',
    ],
    section1Body3: 'Масалан, шахсе, ки 6 рӯз қазо дорад, метавонад интихоб кунад, ки ҳар ҳафта як рӯз рӯза гирад, шаш ҳафта, ё онҳоро дар як давра гирд оварад, агар ин ба ӯ мувофиқтар бошад.',
    section2Body: 'Маъмул аст, ки кӯшиш мекунанд рӯзҳои аз даст рафтаро пеш аз Рамазони оянда қазо кунанд. Ин амал дар ҳар ҳолат ба таври мунтазам ҳатмӣ нест, вале ташкилро осон мекунад ва аз ҷамъ шудани шумораи зиёди рӯзҳои интизор пешгирӣ мекунад.',
    visual1Title: 'Суръате, ки ба шумо мутобиқ мешавад',
    visual1Text: 'Паҳн кардани рӯзҳои қазо мувофиқи ҷадвали шумо ба шумо имкон медиҳад оромона пеш равед, бе фишор.',
    section2Body2: 'Пешакӣ банақшагирӣ кардан аз стресси лаҳзаи охир кумак мекунад. Маслиҳати оддӣ ин аст, ки шумораи рӯзҳои то Рамазони оянда боқимондаро ҳисоб кунед ва рӯзҳои қазоро дар ҳафта ё моҳҳои дастрас тақсим намоед.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Агар сабаби устувор ё такроршаванда аз рӯза монеъ шавад (масалан, ҳолати дарозмуддати саломатӣ), вазъият метавонад дар доираи дигаре қарор гирад; он гоҳ бо олими салоҳиятдор муҳокима кардани он махсусан муфид аст.',
    alert2Title: 'Маълумоти муҳим',
    alert2Text: 'Қоидаҳои дақиқ дар сурати аз мӯҳлат гузаштан метавонанд вобаста ба тафсир гуногун бошанд. Дар ҳар вазъияти мураккаб, назари олими салоҳиятдор манбаи асосӣ боқӣ мемонад.',
    section2Body3: 'Масалан, агар Рамазони оянда баъд аз 8 моҳ оғоз шавад ва 6 рӯз барои қазо монда бошад, як имконият ин аст, ки тақрибан як рӯз дар як моҳ банақша гирифта шавад, бо чандирӣ барои ҳолатҳои пешбининашуда.',
    section3Body: 'Ҳомиладорӣ ва шири додан метавонад ба имкони рӯза гирифтан таъсир расонад, хусусан вақте ки рӯза ба саломатии модар ё кӯдак хатар меорад. Некӯаҳволии ҷисмонӣ ва қобилияти воқеии рӯза гирифтан омилҳои муҳимест, ки бояд ба назар гирифта шаванд.',
    visual2Title: 'Вазъияте, ки ба назар гирифта мешавад',
    visual2Text: 'Ин ҳолатҳо аз ҷониби анъанаи динӣ ҳамчун сабаби эҳтимолии озодӣ шинохта мешаванд.',
    section3Body2: 'Назарҳои динӣ дар бораи рӯзаи дар вақти ҳомиладорӣ ё шири додан анҷом нашуда вобаста ба мазҳаб метавонанд гуногун бошанд, хусусан дар масъалаи он ки оё қазои оддӣ кифоя аст ё ҷуброн низ лозим аст. Сабаби дақиқи рӯза нагирифтан ва вазъияти шахсӣ метавонад ба посухи татбиқшаванда таъсир расонад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Қазо ба шумо имкон медиҳад рӯзҳои аз даст рафтаро оромона, бо суръати худ ҷуброн кунед. Дар ҳолати махсус (аз мӯҳлат гузаштан, ҳомиладорӣ, шири додан, монеаи устувор) назари олими салоҳиятдор беҳтарин манбаъ боқӣ мемонад.',
    shareMessage: 'Рӯза ва озодӣ: қазо кардан (Қазо) — AWA',
  },
  ky: {
    badge: 'ОРОЗО ЖАНА КАЗО',
    title: 'Орозо жана бошотуу:\nордун толтуруу (Казо)',
    metaDuration: '6 мүн окуу',
    metaType: 'КБС',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Өткөрүлгөн орозо күндөрүнүн ордун өз ылдамдыгыңызда жана күнөөсүз кантип жана качан толтуруу керек.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Өткөрүлгөн күндөрдүн ордун качан толтуруу керек?',
      'Кеңири таралган мөөнөт: кийинки Рамазанга чейин',
      'Курсактуулук жана эмчек эмизүү',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Казо — Рамазанда, атап айтканда етек кирим себебинен, өткөрүлгөн орозо күндөрүнүн ордун кийинчерээк толтуруу. Бул күндөрдүн ордун толтуруу керек, анткени Рамазан орозосу айдын тирөөчү бойдон калат, ал эми етек кирим себебинен токтотулган күндөр карыз деп эсептелет, бул сиздин күнөөңүз эмес.',
    section1Body2: 'Ордун толтурууну, адатта, Рамазан бүтөөрү менен, абалыңыз уруксат бергенде баштаса болот. Бул күндөрдү өз ылдамдыгыңызда уюштурсаңыз болот: айрымдар аларды Рамазандан кийин эле бириктиргенди жактырат, башкалары кийинки айларга акырындап бөлүштүрөт.',
    noteTitle: 'Көңүл буруңуз',
    noteText: 'Күндөрдүн ордун удаалаш толтуруу же бөлүп толтуруу фикх мектебине жараша ар кандай каралышы мүмкүн; бул жерде эч бир ыкма бирден-бир туура катары берилген эмес.',
    recordTips: [
      'Рамазан бүтөөрү менен казо кылына турган күндөрдүн жалпы санын жазып коюңуз',
      'Жөнөкөй ыкманы тандаңыз: календарь, колдонмо, дептер',
      'Ордун толтурулган ар бир күндү белгилеп коюңуз',
    ],
    section1Body3: 'Мисалы, казо кылына турган 6 күнү бар адам алты жума бою жумасына бир күн орозо кармоону же ага ылайыктуу болсо, аларды бир мезгилге бириктирүүнү тандай алат.',
    section2Body: 'Өткөрүлгөн күндөрдүн ордун кийинки Рамазанга чейин толтурууга аракет кылуу кеңири таралган. Бул практика ар бир учурда системалуу түрдө милдеттүү эмес, бирок ал уюштурууну жеңилдетет жана көп сандагы күтүп турган күндөрдүн топтолушуна жол бербейт.',
    visual1Title: 'Сизге ыңгайлашкан темп',
    visual1Text: 'Казо кылына турган күндөрдү графигиңизге жараша бөлүштүрүү кысымсыз, тынч алдыга жылууга мүмкүндүк берет.',
    section2Body2: 'Алдын ала пландоо акыркы мүнөттөгү стресстен сактайт. Жөнөкөй кеңеш: кийинки Рамазанга чейин калган күндөрдүн санын санап, казо кылына турган күндөрдү бар жумаларга же айларга бөлүштүрүңүз.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Эгер орозо кармоого туруктуу же кайталанган себеп тоскоол болсо (мисалы, узакка созулган ден соолук абалы), абал башка алкакка кириши мүмкүн; андыктан аны квалификациялуу окумуштуу менен талкуулоо өзгөчө пайдалуу.',
    alert2Title: 'Маанилүү маалымат',
    alert2Text: 'Мөөнөт ашып кеткен учурдагы так эрежелер чечмелөөгө жараша айырмаланышы мүмкүн. Ар кандай татаал абалда квалификациялуу окумуштуунун пикири шилтеме бойдон калат.',
    section2Body3: 'Мисалы, кийинки Рамазан 8 айдан кийин башталып, казо кылына турган 6 күн калса, бир мүмкүнчүлүк — күтүлбөгөн жагдайлар үчүн ийкемдүүлүк менен айына болжол менен бир күндү пландоо.',
    section3Body: 'Курсактуулук жана эмчек эмизүү орозо кармоо мүмкүнчүлүгүнө таасир этиши мүмкүн, айрыкча орозо эненин же баланын ден соолугуна коркунуч жаратканда. Физикалык жыргалчылык жана орозо кармоонун чыныгы мүмкүнчүлүгү эске алынууга тийиш маанилүү факторлор.',
    visual2Title: 'Эске алынган абал',
    visual2Text: 'Бул жагдайлар диний салт тарабынан бошотууга негиз болушу мүмкүн деп таанылган.',
    section3Body2: 'Курсактуулук же эмчек эмизүү убагында кармалбаган орозо боюнча диний пикирлер мектепке жараша айырмаланышы мүмкүн, айрыкча жөнөкөй казо жетиштүүбү же ошондой эле өтөмдүк да камтылабы деген маселеде. Орозо кармабагандын так себеби жана жеке абал колдонулуучу жоопко таасир этиши мүмкүн.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Казо өткөрүлгөн орозо күндөрүнүн ордун өз ылдамдыгыңызда тынч толтурууга мүмкүндүк берет. Өзгөчө абалда (ашып кеткен мөөнөт, курсактуулук, эмчек эмизүү, туруктуу тоскоолдук) квалификациялуу окумуштуунун пикири эң жакшы булак бойдон калат.',
    shareMessage: 'Орозо жана бошотуу: ордун толтуруу (Казо) — AWA',
  },
  tk: {
    badge: 'OROZA WE KAZO',
    title: 'Oraza we erkinlik:\nkazo (öwezini dolmak)',
    metaDuration: '6 min okamak',
    metaType: 'KBS',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Sypdyrylan oraza günlerini öz ritmiňizde, günäkärlik duýgusyz nähili we haçan dolmaly.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Sypdyrylan günleri haçan dolmaly?',
      'Umumy möhlet: indiki Remezandan öň',
      'Göwrelilik we emdirmek',
      'Esasy netijeler',
    ],
    section1Body: 'Kazo Remezanda sypdyrylan oraza günlerini, esasanam aýbaşy sebäpli, soňrak dolmagy aňladýar. Bu günleri dolmak gerek, sebäbi Remezan orazasy aýyň sütünidigine galýar we aýbaşy sebäpli togtadylan günler borç hasaplanýar, muňa siziň hiç hili günäňiz ýok.',
    section1Body2: 'Dolmak adatça Remezan gutarandan soň, ýagdaýyňyz rugsat berenden başlap bilner. Bu günleri öz ritmiňizde guramak mümkin: käbirleri olary Remezandan gös-göni soň bir ýere ýygnamagy makul görýär, beýlekileri bolsa indiki aýlara ýuwaş-ýuwaşdan paýlaýar.',
    noteTitle: 'Üns beriň',
    noteText: 'Günleri yzly-yzyna ýa-da paýlap dolmak mekdebe görä dürli bahalanyp bilner; bu ýerde ikisinden hiç biri ýeke-täk dogry diýlip görkezilmeýär.',
    recordTips: [
      'Remezan gutaran badyna dolmaly günleriň umumy sanyny ýazyp goýuň',
      'Ýönekeý usuly saýlaň: senenama, programma, depder',
      'Her dolunan güni belläň',
    ],
    section1Body3: 'Meselem, 6 günüň dolmasy gerek adam alty hepdäniň dowamynda hepdede bir gün oraza tutmagy ýa-da özüne laýyk bolsa olary şol bir döwre ýygnamagy saýlap biler.',
    section2Body: 'Sypdyrylan günleri indiki Remezandan öň dolmaga synanyşmak adaty zat. Bu tejribe her ýagdaýda yzygiderli borç däl, ýöne guramagy aňsatlaşdyrýar we köp sanly garaşylýan günüň ýygnanmagynyň öňüni alýar.',
    visual1Title: 'Size uýgunlaşýan ritm',
    visual1Text: 'Dolmaly günleri tertibiňize görä paýlamak asudalyk bilen, basyşsyz öňe gitmäge mümkinçilik berýär.',
    section2Body2: 'Öňünden meýilleşdirmek soňky minutdaky stresiň öňüni almaga kömek edýär. Ýönekeý maslahat — indiki Remezana çenli galan günleriň sanyny sanamak we dolmaly günleri bar bolan hepdelere ýa-da aýlara paýlamak.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Orazany saklamaga dowamly ýa-da gaýtalanýan sebäp päsgel berse (meselem, uzak dowam edýän saglyk ýagdaýy), ýagdaý başga çarçuwa girip biler; şonda bilimli alym bilen maslahatlaşmak aýratyn peýdaly.',
    alert2Title: 'Möhüm maglumat',
    alert2Text: 'Möhlet geçen ýagdaýynda takyk düzgünler düşündirişe görä tapawutlanyp biler. Islendik çylşyrymly ýagdaý üçin bilimli alymyň pikiri esasy çeşme bolup galýar.',
    section2Body3: 'Meselem, indiki Remezan 8 aýdan başlasa we 6 günüň dolmasy galan bolsa, mümkinçiliklerden biri garaşylmadyk ýagdaýlar üçin çeýelik bilen, aýda takmynan bir günlük meýilnama düzmek.',
    section3Body: 'Göwrelilik we emdirmek oraza tutmak ukybyna täsir edip biler, aýratyn-da oraza ene ýa-da çaga üçin howp döredende. Fiziki abadançylyk we oraza tutmagyň hakyky ukyby nazara alynmaly möhüm faktorlar.',
    visual2Title: 'Nazara alynýan ýagdaý',
    visual2Text: 'Bu ýagdaýlar dini däp tarapyndan erkinlige sebäp bolup biljek ýagdaýlar hökmünde ykrar edilýär.',
    section3Body2: 'Göwrelilik ýa-da emdirmek wagtynda tutulmadyk oraza barada dini pikirler mekdebe görä, esasanam ýönekeý dolmagyň ýeterlikdigi ýa-da ona goşmaça öwezini dolmagyň hem girýändigi soragy boýunça, tapawutlanyp biler. Orazany tutmazlygyň takyk sebäbi we şahsy ýagdaý degişli jogaba täsir edip biler.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Kazo sypdyrylan oraza günlerini öz ritmiňizde asudalyk bilen dolmaga mümkinçilik berýär. Aýratyn ýagdaýda (geçen möhlet, göwrelilik, emdirmek, dowamly päsgelçilik) bilimli alymyň pikiri iň gowy çeşme bolup galýar.',
    shareMessage: 'Oraza we erkinlik: kazo (öwezini dolmak) — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FastingQadaaArticleScreen({
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
            {content.section1Body}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.noteTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.noteText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.recordTips.map(item => (
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body3}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.balance}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.visual1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visual1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body2}
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
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alert2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body3}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.pregnancy}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.visual2Title}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visual2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

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
