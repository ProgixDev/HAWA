import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
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
const CONTENT = {
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
} as const;

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

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

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.disclaimerTitle}</Text>
              <Text style={styles.tipText}>{content.disclaimerText}</Text>
            </View>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.noteTitle}</Text>
              <Text style={styles.tipText}>
                {content.noteText}
              </Text>
            </View>
          </View>

          <View style={styles.checkList}>
            {content.recordTips.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.section1Body3}
          </Text>

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.balance}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                {content.visual1Title}
              </Text>

              <Text style={styles.visualText}>
                {content.visual1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {content.section2Body2}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert2Title}</Text>
              <Text style={styles.tipText}>
                {content.alert2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {content.section2Body3}
          </Text>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.pregnancy}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.visual2Title}</Text>

              <Text style={styles.visualText}>
                {content.visual2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>
                {content.tip2Text}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},
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
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {opacity: 0.74},
  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  badgeText: {fontSize: 11, color: theme.colors.primary, fontWeight: '800'},
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },
  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 10, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '500',
  },
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24, color: theme.colors.primary, fontSize: 12, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
  visualCard: {
    marginTop: 15,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800'},
  visualText: {marginTop: 4, color: theme.colors.textMuted, fontSize: 11, lineHeight: 16},
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textMuted},
  });
}
