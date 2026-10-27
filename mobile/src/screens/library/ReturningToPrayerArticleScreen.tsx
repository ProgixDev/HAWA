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

const ID = 'returningtoprayer-le-ghusl-et-le-retour';

const HERO = require('../../assets/images/library/category-spiritual.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('ReturningToPrayer', {
  fr: {
    badge: 'RETOUR À LA PRIÈRE',
    title: 'Le ghusl et le\nretour à la prière',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les étapes générales pour reprendre la prière après les règles, avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le ghusl, retour à la pureté rituelle',
      'Une méthode qui peut varier selon l’école',
      'La reprise de la prière, sans rattrapage',
      'Points pratiques à retenir',
    ],
    section1Body1: 'Le ghusl est une grande ablution rituelle : elle consiste à laver l’intégralité du corps avec l’intention de retrouver l’état de pureté rituelle (tahara), nécessaire à l’accomplissement de la prière et d’autres actes d’adoration.',
    section1Body2: 'Avant d’effectuer le ghusl, il est important de s’assurer que les règles sont réellement terminées : le ghusl doit suivre, et non précéder, la certitude que le saignement s’est arrêté. De manière générale, cette fin se reconnaît à l’arrêt total du saignement, observé sur une durée suffisante pour écarter tout doute — un point détaillé dans l’article dédié à la pureté rituelle.',
    section1Body3: 'C’est cette purification qui permet de renouer avec les moments d’adoration suspendus pendant les règles.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il n’y a pas d’urgence à ressentir : le ghusl peut être effectué dès que tu es prête, sans pression, une fois la fin des règles constatée avec certitude.',
    section2Body: 'Le ghusl repose sur des principes généraux communs : l’intention de se purifier, et le lavage complet du corps, y compris les cheveux et la peau. Les détails précis de la méthode peuvent en revanche varier selon les écoles juridiques suivies.',
    alertTitle: 'Note importante',
    alertText: 'Aucune méthode particulière n’est présentée ici comme la seule valable : se référer à l’école ou à l’avis suivi habituellement, ou demander conseil à un savant qualifié, permet de connaître les modalités précises adaptées à ta situation.',
    section3Body1: 'Une fois les règles terminées et le ghusl effectué, la prière reprend normalement, sans délai particulier ni condition supplémentaire.',
    section3Body2: 'Il est utile de distinguer deux situations qui suivent des règles différentes : les prières non accomplies pendant les règles ne sont généralement pas rattrapées, alors que les jours de jeûne manqués pendant le Ramadan doivent, eux, être rattrapés plus tard (qadaa).',
    section3Body3: 'Par exemple, une femme ayant eu ses règles pendant 6 jours reprend la prière normalement après le ghusl, sans avoir à rattraper les prières de ces 6 jours. Les 6 jours de jeûne correspondants, en revanche, seront rattrapés après le Ramadan.',
    practicalPoints: [
      'Reconnaître la fin des règles avec certitude',
      'Effectuer le ghusl (grande ablution) pour retrouver la pureté rituelle',
      'Reprendre la prière normalement, sans délai',
      'Savoir que les prières manquées pendant les règles ne sont généralement pas rattrapées',
      'Demander conseil à un savant qualifié pour toute situation particulière ou un doute persistant',
    ],
    shareMessage: 'Le ghusl et le retour à la prière — AWA',
  },
  en: {
    badge: 'RETURN TO PRAYER',
    title: 'Ghusl and the\nreturn to prayer',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The general steps for resuming prayer after menstruation, with peace of mind.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Ghusl, return to ritual purity',
      'A method that can vary by school',
      'Resuming prayer, without making up missed prayers',
      'Practical points to remember',
    ],
    section1Body1: 'Ghusl is a major ritual ablution: it consists of washing the entire body with the intention of returning to the state of ritual purity (tahara), necessary for performing prayer and other acts of worship.',
    section1Body2: 'Before performing the ghusl, it’s important to make sure that menstruation has truly ended: the ghusl should follow, not precede, the certainty that the bleeding has stopped. Generally speaking, this end is recognized by the total stopping of bleeding, observed over a sufficient period of time to rule out any doubt — a point covered in detail in the article dedicated to ritual purity.',
    section1Body3: 'This purification is what allows you to reconnect with the moments of worship suspended during menstruation.',
    tip1Title: 'Good to know',
    tip1Text: 'There’s no need to feel rushed: the ghusl can be performed as soon as you’re ready, without pressure, once the end of menstruation has been confirmed with certainty.',
    section2Body: 'The ghusl is based on shared general principles: the intention to purify oneself, and the complete washing of the body, including the hair and skin. The precise details of the method, however, can vary according to the school of jurisprudence followed.',
    alertTitle: 'Important note',
    alertText: 'No particular method is presented here as the only valid one: referring to the school or opinion you usually follow, or seeking advice from a qualified scholar, will help you learn the precise details suited to your situation.',
    section3Body1: 'Once menstruation has ended and the ghusl has been performed, prayer resumes normally, with no particular delay or additional condition.',
    section3Body2: 'It’s helpful to distinguish between two situations that follow different rules: prayers not performed during menstruation are generally not made up, whereas fasting days missed during Ramadan must be made up later (qadaa).',
    section3Body3: 'For example, a woman who has had her period for 6 days resumes prayer normally after the ghusl, without having to make up the prayers from those 6 days. The corresponding 6 days of fasting, however, will be made up after Ramadan.',
    practicalPoints: [
      'Recognizing the end of menstruation with certainty',
      'Performing the ghusl (major ablution) to return to ritual purity',
      'Resuming prayer normally, without delay',
      'Knowing that prayers missed during menstruation are generally not made up',
      'Seeking advice from a qualified scholar for any particular situation or persistent doubt',
    ],
    shareMessage: 'Ghusl and the return to prayer — AWA',
  },
  es: {
    badge: 'REGRESO A LA ORACIÓN',
    title: 'El gusl y el\nregreso a la oración',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Los pasos generales para reanudar la oración después de la menstruación, con serenidad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'El gusl, regreso a la pureza ritual',
      'Un método que puede variar según la escuela',
      'La reanudación de la oración, sin recuperación',
      'Puntos prácticos para recordar',
    ],
    section1Body1: 'El gusl es una ablución ritual mayor: consiste en lavar todo el cuerpo con la intención de recuperar el estado de pureza ritual (tahara), necesario para realizar la oración y otros actos de adoración.',
    section1Body2: 'Antes de realizar el gusl, es importante asegurarse de que la menstruación ha terminado realmente: el gusl debe seguir, y no preceder, a la certeza de que el sangrado se ha detenido. De manera general, este fin se reconoce por el cese total del sangrado, observado durante un tiempo suficiente para descartar cualquier duda, un punto detallado en el artículo dedicado a la pureza ritual.',
    section1Body3: 'Es esta purificación la que permite retomar los momentos de adoración suspendidos durante la menstruación.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'No hay ninguna urgencia que sentir: el gusl puede realizarse en cuanto estés lista, sin presión, una vez constatado con certeza el fin de la menstruación.',
    section2Body: 'El gusl se basa en principios generales comunes: la intención de purificarse y el lavado completo del cuerpo, incluidos el cabello y la piel. Los detalles precisos del método, en cambio, pueden variar según las escuelas jurídicas seguidas.',
    alertTitle: 'Nota importante',
    alertText: 'Ningún método concreto se presenta aquí como el único válido: referirse a la escuela o a la opinión que se suele seguir, o pedir consejo a un erudito cualificado, permite conocer las modalidades precisas adaptadas a tu situación.',
    section3Body1: 'Una vez terminada la menstruación y realizado el gusl, la oración se reanuda con normalidad, sin ningún plazo particular ni condición adicional.',
    section3Body2: 'Es útil distinguir dos situaciones que siguen reglas diferentes: las oraciones no realizadas durante la menstruación generalmente no se recuperan, mientras que los días de ayuno no realizados durante el Ramadán sí deben recuperarse más tarde (qadaa).',
    section3Body3: 'Por ejemplo, una mujer que ha tenido la menstruación durante 6 días reanuda la oración con normalidad después del gusl, sin tener que recuperar las oraciones de esos 6 días. Los 6 días de ayuno correspondientes, en cambio, se recuperarán después del Ramadán.',
    practicalPoints: [
      'Reconocer el fin de la menstruación con certeza',
      'Realizar el gusl (ablución mayor) para recuperar la pureza ritual',
      'Reanudar la oración con normalidad, sin demora',
      'Saber que las oraciones no realizadas durante la menstruación generalmente no se recuperan',
      'Pedir consejo a un erudito cualificado para cualquier situación particular o duda persistente',
    ],
    shareMessage: 'El gusl y el regreso a la oración — AWA',
  },
  it: {
    badge: 'RIPRESA DELLA PREGHIERA',
    title: 'Il ghusl e la\nripresa della preghiera',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'I passaggi generali per riprendere la preghiera dopo le mestruazioni, con serenità.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il ghusl, il ritorno alla purezza rituale',
      'Un metodo che può variare a seconda della scuola',
      'Riprendere la preghiera, senza recuperare quelle perse',
      'Punti pratici da ricordare',
    ],
    section1Body1: 'Il ghusl è un’abluzione rituale maggiore: consiste nel lavare tutto il corpo con l’intenzione di tornare allo stato di purezza rituale (tahara), necessario per eseguire la preghiera e gli altri atti di culto.',
    section1Body2: 'Prima di eseguire il ghusl, è importante assicurarsi che le mestruazioni siano davvero terminate: il ghusl deve seguire, e non precedere, la certezza che il sanguinamento sia cessato. In generale, questa fine si riconosce dall’arresto totale del sanguinamento, osservato per un tempo sufficiente a escludere ogni dubbio — un punto trattato nel dettaglio nell’articolo dedicato alla purezza rituale.',
    section1Body3: 'Questa purificazione è ciò che ti permette di ritrovare i momenti di culto sospesi durante le mestruazioni.',
    tip1Title: 'Da sapere',
    tip1Text: 'Non c’è bisogno di sentirsi di fretta: il ghusl può essere eseguito non appena sei pronta, senza pressione, una volta confermata con certezza la fine delle mestruazioni.',
    section2Body: 'Il ghusl si basa su principi generali condivisi: l’intenzione di purificarsi e il lavaggio completo del corpo, inclusi capelli e pelle. I dettagli precisi del metodo, però, possono variare a seconda della scuola giuridica seguita.',
    alertTitle: 'Nota importante',
    alertText: 'Nessun metodo particolare è presentato qui come l’unico valido: fare riferimento alla scuola o all’opinione che segui abitualmente, oppure chiedere consiglio a uno studioso qualificato, ti aiuterà a conoscere i dettagli precisi adatti alla tua situazione.',
    section3Body1: 'Una volta terminate le mestruazioni ed eseguito il ghusl, la preghiera riprende normalmente, senza alcun ritardo né condizione aggiuntiva particolare.',
    section3Body2: 'È utile distinguere due situazioni che seguono regole diverse: le preghiere non eseguite durante le mestruazioni in genere non si recuperano, mentre i giorni di digiuno saltati durante il Ramadan devono essere recuperati più tardi (qadaa).',
    section3Body3: 'Per esempio, una donna che ha avuto il periodo mestruale per 6 giorni riprende normalmente la preghiera dopo il ghusl, senza dover recuperare le preghiere di quei 6 giorni. I 6 giorni di digiuno corrispondenti, invece, saranno recuperati dopo il Ramadan.',
    practicalPoints: [
      'Riconoscere con certezza la fine delle mestruazioni',
      'Eseguire il ghusl (abluzione maggiore) per tornare alla purezza rituale',
      'Riprendere normalmente la preghiera, senza ritardo',
      'Sapere che le preghiere perse durante le mestruazioni in genere non si recuperano',
      'Chiedere consiglio a uno studioso qualificato per qualsiasi situazione particolare o dubbio persistente',
    ],
    shareMessage: 'Il ghusl e la ripresa della preghiera — AWA',
  },
  tr: {
    badge: 'NAMAZA DÖNÜŞ',
    title: 'Gusül ve\nnamaza dönüş',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adetten sonra namaza yeniden başlamanın genel adımları, içinin rahatlığıyla.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğiticidir. Dinî sorular nitelikli âlimlere danışılarak doğrulanmalıdır. AWA fetva veya kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Gusül, ritüel temizliğe dönüş',
      'Mezhebe göre değişebilen bir yöntem',
      'Kılınamayan namazları kaza etmeden namaza yeniden başlamak',
      'Akılda tutulacak pratik noktalar',
    ],
    section1Body1: 'Gusül, büyük bir ritüel temizliktir: namaz kılmak ve diğer ibadetleri yapmak için gerekli olan ritüel temizlik (taharet) haline dönme niyetiyle bütün bedenin yıkanmasından oluşur.',
    section1Body2: 'Gusül almadan önce adetin gerçekten sona erdiğinden emin olmak önemlidir: gusül, kanamanın durduğundan emin olunmasından önce değil, sonra gelmelidir. Genel olarak bu son, her türlü şüpheyi ortadan kaldıracak yeterli bir süre boyunca gözlemlenen, kanamanın tamamen durmasıyla anlaşılır — bu nokta, ritüel temizliğe ayrılmış makalede ayrıntılı olarak ele alınmıştır.',
    section1Body3: 'Bu arınma, adet boyunca askıya alınan ibadet anlarına yeniden bağlanmana olanak tanır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Acele etmene gerek yok: adetin sona erdiği kesin olarak teyit edildikten sonra, hazır olduğunda, baskı hissetmeden gusül alabilirsin.',
    section2Body: 'Gusül, ortak genel ilkelere dayanır: arınma niyeti ve saç ile cilt dahil bedenin tamamen yıkanması. Ancak yöntemin kesin ayrıntıları, uyulan fıkıh mezhebine göre değişebilir.',
    alertTitle: 'Önemli not',
    alertText: 'Burada hiçbir yöntem tek geçerli yöntem olarak sunulmuyor: genellikle uyduğun mezhebe ya da görüşe başvurmak veya nitelikli bir âlimden görüş almak, durumuna uygun kesin ayrıntıları öğrenmene yardımcı olur.',
    section3Body1: 'Adet sona erip gusül alındıktan sonra namaza, belirli bir gecikme ya da ek bir şart olmaksızın normal şekilde yeniden başlanır.',
    section3Body2: 'Farklı kurallara tabi iki durumu ayırt etmek faydalıdır: adet sırasında kılınmayan namazlar genellikle kaza edilmez; buna karşılık Ramazan’da tutulamayan oruç günleri daha sonra kaza edilmelidir.',
    section3Body3: 'Örneğin, 6 gün adet görmüş bir kadın gusülden sonra namaza normal şekilde yeniden başlar; o 6 günün namazlarını kaza etmesi gerekmez. Buna karşılık, karşılık gelen 6 günlük oruç Ramazan’dan sonra kaza edilir.',
    practicalPoints: [
      'Adetin sona erdiğini kesin olarak fark etmek',
      'Ritüel temizliğe dönmek için gusül (büyük abdest) almak',
      'Gecikmeden namaza normal şekilde yeniden başlamak',
      'Adet sırasında kılınamayan namazların genellikle kaza edilmediğini bilmek',
      'Herhangi bir özel durum veya süregelen tereddüt için nitelikli bir âlimden görüş almak',
    ],
    shareMessage: 'Gusül ve namaza dönüş — AWA',
  },
  ru: {
    badge: 'ВОЗВРАЩЕНИЕ К НАМАЗУ',
    title: 'Гусль и\nвозвращение к намазу',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Общие шаги для возобновления намаза после менструации — спокойно и уверенно.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у квалифицированных богословов. AWA не выносит фетв и не даёт персональных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Гусль — возвращение к ритуальной чистоте',
      'Способ, который может различаться в зависимости от мазхаба',
      'Возобновление намаза без восполнения пропущенных',
      'Практические моменты, которые стоит запомнить',
    ],
    section1Body1: 'Гусль — это полное ритуальное омовение: оно заключается в омовении всего тела с намерением вернуться в состояние ритуальной чистоты (тахара), необходимое для совершения намаза и других богослужений.',
    section1Body2: 'Прежде чем совершать гусль, важно убедиться, что менструация действительно закончилась: гусль должен следовать за уверенностью в том, что кровотечение прекратилось, а не предшествовать ей. Как правило, окончание определяется полным прекращением выделений, наблюдаемым в течение достаточного времени, чтобы исключить любые сомнения, — этот вопрос подробно рассмотрен в статье, посвящённой ритуальной чистоте.',
    section1Body3: 'Именно это очищение позволяет вернуться к богослужениям, приостановленным на время менструации.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Торопиться не нужно: гусль можно совершить, как только вы будете готовы, без спешки, когда окончание менструации подтверждено с уверенностью.',
    section2Body: 'Гусль основан на общих принципах: намерение очиститься и полное омовение тела, включая волосы и кожу. Точные детали способа, однако, могут различаться в зависимости от мазхаба, которого вы придерживаетесь.',
    alertTitle: 'Важное замечание',
    alertText: 'Ни один способ здесь не представлен как единственно верный: обратившись к мазхабу или мнению, которого вы обычно придерживаетесь, либо к квалифицированному богослову, вы сможете узнать точные детали, подходящие для вашей ситуации.',
    section3Body1: 'Когда менструация закончилась и гусль совершён, намаз возобновляется в обычном порядке — без особой отсрочки и дополнительных условий.',
    section3Body2: 'Полезно различать две ситуации, для которых действуют разные правила: намазы, не совершённые во время менструации, как правило, не восполняются, тогда как дни поста, пропущенные в Рамадан, нужно восполнить позже (каза).',
    section3Body3: 'Например, женщина, у которой месячные длились 6 дней, возобновляет намаз в обычном порядке после гусля, не восполняя намазы за эти 6 дней. Соответствующие 6 дней поста, однако, будут восполнены после Рамадана.',
    practicalPoints: [
      'С уверенностью определить окончание менструации',
      'Совершить гусль (полное омовение), чтобы вернуться к ритуальной чистоте',
      'Возобновить намаз в обычном порядке, без отсрочки',
      'Знать, что намазы, пропущенные во время менструации, как правило, не восполняются',
      'Обратиться за советом к квалифицированному богослову в любой особой ситуации или при сохраняющихся сомнениях',
    ],
    shareMessage: 'Гусль и возвращение к намазу — AWA',
  },
  de: {
    badge: 'RÜCKKEHR ZUM GEBET',
    title: 'Ghusl und die\nRückkehr zum Gebet',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Die allgemeinen Schritte, um das Gebet nach der Menstruation in Ruhe wieder aufzunehmen.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt dient ausschließlich der Bildung. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA spricht keine Fatwas und keine persönlichen religiösen Urteile aus.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Ghusl, die Rückkehr zur rituellen Reinheit',
      'Eine Methode, die je nach Rechtsschule variieren kann',
      'Das Gebet wieder aufnehmen, ohne Versäumtes nachzuholen',
      'Praktische Punkte zum Merken',
    ],
    section1Body1: 'Ghusl ist die große rituelle Waschung: Dabei wird der gesamte Körper mit der Absicht gewaschen, in den Zustand der rituellen Reinheit (Tahara) zurückzukehren, der für das Gebet und andere Gottesdienste erforderlich ist.',
    section1Body2: 'Bevor du das Ghusl durchführst, ist es wichtig sicherzugehen, dass die Menstruation wirklich beendet ist: Das Ghusl soll auf die Gewissheit folgen, dass die Blutung aufgehört hat, und ihr nicht vorausgehen. Im Allgemeinen erkennt man dieses Ende daran, dass die Blutung vollständig aufgehört hat – beobachtet über einen ausreichend langen Zeitraum, um jeden Zweifel auszuschließen. Dieser Punkt wird im Artikel über die rituelle Reinheit ausführlich behandelt.',
    section1Body3: 'Diese Reinigung ermöglicht es dir, wieder an die Zeiten des Gottesdienstes anzuknüpfen, die während der Menstruation ausgesetzt waren.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Du musst dich nicht hetzen: Das Ghusl kann durchgeführt werden, sobald du bereit bist – ohne Druck –, nachdem das Ende der Menstruation mit Gewissheit feststeht.',
    section2Body: 'Das Ghusl beruht auf gemeinsamen allgemeinen Grundsätzen: der Absicht, sich zu reinigen, und der vollständigen Waschung des Körpers, einschließlich Haare und Haut. Die genauen Einzelheiten der Methode können jedoch je nach befolgter Rechtsschule variieren.',
    alertTitle: 'Wichtiger Hinweis',
    alertText: 'Hier wird keine bestimmte Methode als die einzig gültige dargestellt: Wenn du dich an die Rechtsschule oder Meinung hältst, der du üblicherweise folgst, oder eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten um Rat fragst, erfährst du die genauen Einzelheiten, die zu deiner Situation passen.',
    section3Body1: 'Sobald die Menstruation beendet und das Ghusl durchgeführt ist, wird das Gebet ganz normal wieder aufgenommen – ohne besondere Wartezeit und ohne zusätzliche Bedingung.',
    section3Body2: 'Es hilft, zwei Situationen zu unterscheiden, für die unterschiedliche Regeln gelten: Gebete, die während der Menstruation nicht verrichtet wurden, werden im Allgemeinen nicht nachgeholt, während im Ramadan versäumte Fastentage später nachgeholt werden müssen (Qada).',
    section3Body3: 'Ein Beispiel: Eine Frau, die 6 Tage lang ihre Periode hatte, nimmt das Gebet nach dem Ghusl ganz normal wieder auf, ohne die Gebete dieser 6 Tage nachholen zu müssen. Die entsprechenden 6 Fastentage werden dagegen nach dem Ramadan nachgeholt.',
    practicalPoints: [
      'Das Ende der Menstruation mit Gewissheit erkennen',
      'Das Ghusl (große Waschung) durchführen, um zur rituellen Reinheit zurückzukehren',
      'Das Gebet ohne Verzögerung ganz normal wieder aufnehmen',
      'Wissen, dass während der Menstruation versäumte Gebete im Allgemeinen nicht nachgeholt werden',
      'Bei besonderen Situationen oder anhaltenden Zweifeln eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten um Rat fragen',
    ],
    shareMessage: 'Ghusl und die Rückkehr zum Gebet – AWA',
  },
  zh: {
      badge: '恢复礼拜',
      title: '大净（Ghusl）与\n恢复礼拜',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '月经结束后恢复礼拜的一般步骤，让你安心从容。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容仅供科普。宗教方面的问题应由有资质的学者确认。AWA 不发布法特瓦，也不提供针对个人的宗教裁断。',
      contentsTitle: '本文内容',
      topics: [
        '大净：恢复仪式性洁净',
        '做法可能因学派而异',
        '恢复礼拜，无需补做错过的礼拜',
        '需要记住的实用要点',
      ],
      section1Body1: '大净（Ghusl）是一种全身性的仪式净浴：带着恢复仪式性洁净状态（tahara）的意念清洗全身，这一状态是进行礼拜和其他功修所必需的。',
      section1Body2: '在进行大净之前，务必确认月经已经真正结束：大净应当在确定出血已经停止之后进行，而不是在此之前。一般而言，这个结束的标志是出血完全停止，并经过足够长时间的观察以排除任何疑虑——这一点在专门介绍仪式性洁净的文章中有详细说明。',
      section1Body3: '这种净化让你能够重新回到月经期间暂停的功修之中。',
      tip1Title: '小贴士',
      tip1Text: '不必感到匆忙：只要确定月经已经结束，你准备好了就可以进行大净，没有压力。',
      section2Body: '大净建立在共同的一般原则之上：净化自己的意念，以及完整地清洗身体，包括头发和皮肤。不过，具体做法的细节可能因所遵循的教法学派而异。',
      alertTitle: '重要说明',
      alertText: '这里不把任何特定的做法视为唯一正确的：参考你通常遵循的学派或观点，或请教有资质的学者，会帮助你了解适合你情况的具体细节。',
      section3Body1: '月经结束并完成大净之后，礼拜便可正常恢复，没有特别的延迟或额外条件。',
      section3Body2: '区分两种遵循不同规则的情况会有帮助：月经期间未做的礼拜通常无需补做，而斋月期间错过的斋戒日则需要在之后补做（补斋，qadaa）。',
      section3Body3: '例如，经期持续了 6 天的女性，在大净之后正常恢复礼拜，无需补做这 6 天的礼拜；而对应的 6 天斋戒，则需要在斋月之后补做。',
      practicalPoints: [
        '确定地认识到月经已经结束',
        '进行大净（全身大净），恢复仪式性洁净',
        '正常恢复礼拜，不必拖延',
        '了解月经期间错过的礼拜通常无需补做',
        '遇到任何特殊情况或持续的疑虑，请教有资质的学者',
      ],
      shareMessage: '大净（Ghusl）与恢复礼拜 — AWA',
    },
  id: {
    badge: 'KEMBALI SALAT',
    title: 'Mandi wajib dan\nkembali salat',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Langkah-langkah umum untuk kembali salat setelah menstruasi, dengan hati yang tenang.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang berkompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mandi wajib, kembali ke keadaan suci',
      'Tata cara yang bisa berbeda menurut mazhab',
      'Kembali salat, tanpa mengganti salat yang terlewat',
      'Hal-hal praktis yang perlu diingat',
    ],
    section1Body1: 'Mandi wajib (ghusl) adalah mandi ritual besar: yaitu membasuh seluruh tubuh dengan niat kembali ke keadaan suci secara ritual (tahara), yang diperlukan untuk melaksanakan salat dan ibadah lainnya.',
    section1Body2: 'Sebelum mandi wajib, penting memastikan bahwa menstruasi benar-benar sudah berakhir: mandi wajib dilakukan setelah, bukan sebelum, adanya kepastian bahwa darah sudah berhenti. Secara umum, berakhirnya menstruasi dikenali dari berhentinya darah secara total, yang diamati selama waktu yang cukup untuk menyingkirkan segala keraguan — hal yang dibahas lebih rinci dalam artikel khusus tentang bersuci.',
    section1Body3: 'Penyucian inilah yang memungkinkanmu kembali menjalani waktu-waktu ibadah yang ditangguhkan selama menstruasi.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Tidak perlu merasa terburu-buru: mandi wajib bisa dilakukan begitu kamu siap, tanpa tekanan, setelah berakhirnya menstruasi dipastikan dengan yakin.',
    section2Body: 'Mandi wajib berdasarkan prinsip-prinsip umum yang disepakati: niat untuk bersuci, dan membasuh tubuh secara menyeluruh, termasuk rambut dan kulit. Namun, rincian tata caranya bisa berbeda menurut mazhab fikih yang diikuti.',
    alertTitle: 'Catatan penting',
    alertText: 'Tidak ada tata cara tertentu yang disajikan di sini sebagai satu-satunya yang sah: merujuk pada mazhab atau pendapat yang biasa kamu ikuti, atau meminta saran ulama yang berkompeten, akan membantumu mempelajari rincian yang tepat sesuai keadaanmu.',
    section3Body1: 'Setelah menstruasi berakhir dan mandi wajib dilakukan, salat dilanjutkan seperti biasa, tanpa penundaan tertentu atau syarat tambahan.',
    section3Body2: 'Penting untuk membedakan dua keadaan yang mengikuti aturan berbeda: salat yang tidak dikerjakan saat menstruasi pada umumnya tidak diganti, sedangkan hari-hari puasa yang terlewat di bulan Ramadan harus diganti kemudian (qada).',
    section3Body3: 'Contohnya, seorang perempuan yang haid selama 6 hari kembali salat seperti biasa setelah mandi wajib, tanpa harus mengganti salat dari 6 hari tersebut. Namun, 6 hari puasa yang terlewat akan diganti setelah Ramadan.',
    practicalPoints: [
      'Mengenali berakhirnya menstruasi dengan yakin',
      'Melakukan mandi wajib (ghusl) untuk kembali ke keadaan suci secara ritual',
      'Kembali salat seperti biasa, tanpa menunda',
      'Mengetahui bahwa salat yang terlewat saat menstruasi pada umumnya tidak diganti',
      'Meminta saran ulama yang berkompeten untuk setiap keadaan khusus atau keraguan yang berlanjut',
    ],
    shareMessage: 'Mandi wajib dan kembali salat — AWA',
  },
  hi: {
    badge: 'नमाज़ की ओर वापसी',
    title: 'ग़ुस्ल और\nनमाज़ की ओर वापसी',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा की गई सामग्री',
    intro: 'माहवारी के बाद नमाज़ दोबारा शुरू करने के आम कदम, इत्मीनान के साथ।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह सामग्री सिर्फ़ जानकारी के लिए है। धार्मिक सवालों की पुष्टि योग्य उलमा से करानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'ग़ुस्ल, पाकी की ओर वापसी',
      'तरीका जो मसलक के हिसाब से अलग हो सकता है',
      'छूटी नमाज़ों की क़ज़ा के बिना नमाज़ दोबारा शुरू करना',
      'याद रखने लायक व्यावहारिक बातें',
    ],
    section1Body1: 'ग़ुस्ल एक बड़ी रस्मी सफ़ाई है: इसमें पाकी (तहारत) की हालत में लौटने की नीयत से पूरे बदन को धोया जाता है, जो नमाज़ और दूसरी इबादतों के लिए ज़रूरी है।',
    section1Body2: 'ग़ुस्ल करने से पहले यह यक़ीन कर लेना ज़रूरी है कि माहवारी सचमुच खत्म हो चुकी है: ग़ुस्ल इस यक़ीन के बाद आना चाहिए कि ख़ून रुक चुका है, उससे पहले नहीं। आम तौर पर यह खत्म होना ख़ून के पूरी तरह रुक जाने से पहचाना जाता है, जिसे इतने समय तक देखा जाए कि कोई शक न रहे — इस बात की विस्तार से चर्चा पाकी पर समर्पित लेख में की गई है।',
    section1Body3: 'यही पाकी आपको माहवारी में रुकी हुई इबादत के पलों से दोबारा जुड़ने देती है।',
    tip1Title: 'जानने लायक',
    tip1Text: 'जल्दबाज़ी महसूस करने की ज़रूरत नहीं: माहवारी खत्म होने की यक़ीनी पुष्टि के बाद, जब आप तैयार हों, बिना किसी दबाव के ग़ुस्ल किया जा सकता है।',
    section2Body: 'ग़ुस्ल कुछ साझा आम उसूलों पर टिका है: खुद को पाक करने की नीयत, और बालों व त्वचा समेत पूरे बदन को पूरी तरह धोना। तरीके की सटीक बारीकियाँ, हालाँकि, उस मसलक के अनुसार अलग हो सकती हैं जिसे आप मानती हैं।',
    alertTitle: 'ज़रूरी बात',
    alertText: 'यहाँ किसी एक तरीके को अकेला सही बताकर पेश नहीं किया गया है: जिस मसलक या राय पर आप आमतौर पर चलती हैं उसे देखना, या किसी योग्य आलिम से सलाह लेना, आपकी हालत के हिसाब से सटीक बारीकियाँ जानने में मदद करेगा।',
    section3Body1: 'माहवारी खत्म होने और ग़ुस्ल कर लेने के बाद नमाज़ सामान्य रूप से दोबारा शुरू हो जाती है, किसी ख़ास देरी या अतिरिक्त शर्त के बिना।',
    section3Body2: 'दो स्थितियों का फ़र्क समझना मददगार है, जिनके नियम अलग हैं: माहवारी में न पढ़ी गई नमाज़ों की क़ज़ा आमतौर पर नहीं की जाती, जबकि रमज़ान में छूटे रोज़ों की क़ज़ा बाद में करनी होती है।',
    section3Body3: 'मिसाल के तौर पर, जिस औरत को 6 दिन पीरियड आया, वह ग़ुस्ल के बाद नमाज़ सामान्य रूप से दोबारा शुरू करती है, उन 6 दिनों की नमाज़ों की क़ज़ा किए बिना। उन्हीं 6 दिनों के रोज़ों की क़ज़ा, हालाँकि, रमज़ान के बाद की जाएगी।',
    practicalPoints: [
      'माहवारी के खत्म होने को यक़ीन के साथ पहचानना',
      'पाकी की हालत में लौटने के लिए ग़ुस्ल (बड़ी रस्मी सफ़ाई) करना',
      'बिना देर किए नमाज़ सामान्य रूप से दोबारा शुरू करना',
      'यह जानना कि माहवारी में छूटी नमाज़ों की क़ज़ा आमतौर पर नहीं की जाती',
      'किसी ख़ास हालत या लगातार बने शक में योग्य आलिम से सलाह लेना',
    ],
    shareMessage: 'ग़ुस्ल और नमाज़ की ओर वापसी — AWA',
  },
  sq: {
    badge: 'KTHIMI TE NAMAZI',
    title: 'Gusli dhe kthimi\nte namazi',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Hapat e përgjithshëm për të rifilluar namazin pas menstruacionit, me shpirt të qetë.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhet të vërtetohen nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Gusli, kthimi në pastërti rituale',
      'Një metodë që mund të ndryshojë sipas medhhebit',
      'Rifillimi i namazit, pa kompensuar namazet e munguara',
      'Pika praktike për t’i mbajtur mend',
    ],
    section1Body1: 'Gusli është një larje e madhe rituale: konsiston në larjen e të gjithë trupit me synimin e kthimit në gjendjen e pastërtisë rituale (tahara), të nevojshme për të falur namazin dhe për akte të tjera adhurimi.',
    section1Body2: 'Para se ta kryesh guslin, është e rëndësishme të sigurohesh që menstruacioni ka mbaruar vërtet: gusli duhet të vijë pas, jo para, sigurisë se gjakderdhja ka pushuar. Në përgjithësi, ky fund njihet nga pushimi i plotë i gjakderdhjes, i vërejtur gjatë një kohe të mjaftueshme për të përjashtuar çdo dyshim — një pikë e trajtuar në detaje te artikulli i dedikuar pastërtisë rituale.',
    section1Body3: 'Ky pastrim është ajo që të lejon të rilidhesh me momentet e adhurimit të pezulluara gjatë menstruacionit.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Nuk ka nevojë të ndihesh e ngutur: gusli mund të kryhet sapo të jesh gati, pa presion, pasi mbarimi i menstruacionit të jetë konfirmuar me siguri.',
    section2Body: 'Gusli bazohet në parime të përgjithshme të përbashkëta: synimi për t’u pastruar dhe larja e plotë e trupit, përfshirë flokët dhe lëkurën. Detajet e sakta të metodës, megjithatë, mund të ndryshojnë sipas medhhebit që ndiqet.',
    alertTitle: 'Shënim i rëndësishëm',
    alertText: 'Këtu nuk paraqitet asnjë metodë të veçantë si e vetmja e vlefshme: t’i referohesh medhhebit ose mendimit që zakonisht ndjek, ose të kërkosh këshillë nga një dijetar i kualifikuar, do të të ndihmojë të mësosh detajet e sakta që i përshtaten situatës sate.',
    section3Body1: 'Pasi ka mbaruar menstruacioni dhe është kryer gusli, namazi rifillon normalisht, pa asnjë vonesë të veçantë ose kusht shtesë.',
    section3Body2: 'Ndihmon të dallosh dy situata që ndjekin rregulla të ndryshme: namazet që nuk janë falur gjatë menstruacionit në përgjithësi nuk kompensohen, ndërsa ditët e agjërimit të munguara gjatë Ramazanit duhet të kompensohen më vonë (kaza).',
    section3Body3: 'Për shembull, një grua që ka pasur menstruacione për 6 ditë rifillon namazin normalisht pas guslit, pa pasur nevojë të kompensojë namazet e atyre 6 ditëve. Megjithatë, 6 ditët përkatëse të agjërimit do të kompensohen pas Ramazanit.',
    practicalPoints: [
      'Ta njohësh mbarimin e menstruacionit me siguri',
      'Të kryesh guslin (larjen e madhe) për t’u kthyer në pastërti rituale',
      'Të rifillosh namazin normalisht, pa vonesë',
      'Të dish se namazet e munguara gjatë menstruacionit në përgjithësi nuk kompensohen',
      'Të kërkosh këshillë nga një dijetar i kualifikuar për çdo situatë të veçantë ose dyshim të vazhdueshëm',
    ],
    shareMessage: 'Gusli dhe kthimi te namazi — AWA',
  },
  ja: {
    badge: '礼拝への復帰',
    title: 'グスルと\n礼拝への復帰',
    metaDuration: '読了時間5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: '生理のあと、安心して礼拝を再開するための一般的な流れです。',
    disclaimerTitle: '重要なお知らせ',
    disclaimerText: 'このコンテンツは教育を目的としたものです。宗教に関する疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出すことはありません。',
    contentsTitle: 'この記事の内容',
    topics: [
      'グスル、清浄への回復',
      '法学派によって異なりうる方法',
      '埋め合わせをせずに礼拝を再開する',
      '覚えておきたい実践のポイント',
    ],
    section1Body1: 'グスルは儀礼としての全身の清めです。礼拝やその他の信仰行為を行うために必要な清浄（タハーラ）の状態に戻る意図をもって、全身を洗うことを指します。',
    section1Body2: 'グスルを行う前に、生理が本当に終わったことを確かめておくことが大切です。グスルは、出血が止まったという確信のあとに行うもので、その前に行うものではありません。一般に、この終わりは、疑いを除くのに十分な時間にわたって出血が完全に止まっていることで確認されます。この点は、清浄に関する専用の記事で詳しく説明しています。',
    section1Body3: 'この清めによって、生理中に免除されていた信仰の時間に再びつながることができます。',
    tip1Title: '知っておきたいこと',
    tip1Text: '急かされる必要はありません。生理が終わったことを確信できたら、準備ができたときに、焦らずグスルを行うことができます。',
    section2Body: 'グスルには、共通する一般的な原則があります。清める意図を持つことと、髪や肌も含めて体全体を洗うことです。ただし、具体的な方法の細部は、従っている法学派によって異なることがあります。',
    alertTitle: '大切なお知らせ',
    alertText: 'ここでは、特定の方法だけが正しいものとして示されているわけではありません。ふだん従っている法学派や意見を参照するか、資格のある学者に助言を求めると、ご自身の状況に合った具体的な細部を学ぶことができます。',
    section3Body1: '生理が終わってグスルを行ったあとは、特別な遅れや追加の条件なしに、ふだんどおり礼拝を再開します。',
    section3Body2: '異なる規則に従う2つの場合を区別しておくと役立ちます。生理中に行わなかった礼拝は一般に埋め合わせませんが、ラマダーン中にできなかった断食の日は、あとで埋め合わせなければなりません（カダー）。',
    section3Body3: 'たとえば、生理が6日間続いた女性は、グスルのあとふだんどおり礼拝を再開し、その6日間の礼拝を埋め合わせる必要はありません。一方、それに対応する6日間の断食は、ラマダーンのあとに埋め合わせます。',
    practicalPoints: [
      '生理が終わったことを確信をもって見極める',
      '清浄に戻るためにグスル（全身を清める沐浴）を行う',
      '遅れることなく、ふだんどおり礼拝を再開する',
      '生理中にできなかった礼拝は、一般に埋め合わせないことを知っておく',
      '特別な状況や迷いが続くときは、資格のある学者に助言を求める',
    ],
    shareMessage: 'グスルと礼拝への復帰 — AWA',
  },
  ko: {
    badge: '예배로 돌아가기',
    title: '구슬과\n예배로의 복귀',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '월경이 끝난 뒤 예배를 다시 시작하는 일반적인 단계를 마음 편히 알아봐요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 순수하게 교육 목적이에요. 종교와 관련된 문제는 자격을 갖춘 학자의 확인을 받아야 해요. AWA는 파트와나 개인에게 맞춘 종교적 판단을 내리지 않아요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '구슬, 의례적 정결로 돌아가기',
      '법학파에 따라 달라질 수 있는 방법',
      '놓친 예배를 보충하지 않고 예배 다시 시작하기',
      '기억해 둘 실용적인 포인트',
    ],
    section1Body1: '구슬은 전신 의례 정화예요. 예배와 다른 예배 행위를 드리는 데 필요한 의례적 정결 상태(타하라)로 돌아가겠다는 의도를 가지고 온몸을 씻는 것을 말해요.',
    section1Body2: '구슬을 하기 전에 월경이 정말 끝났는지 확인하는 것이 중요해요. 구슬은 출혈이 멈췄다는 확신이 선 뒤에 하는 것이지, 그 전에 하는 것이 아니에요. 일반적으로 월경이 끝났는지는 의심의 여지가 없을 만큼 충분한 시간 동안 출혈이 완전히 멈춘 것으로 확인해요. 이 부분은 의례적 정결을 다루는 아티클에서 자세히 설명해요.',
    section1Body3: '이 정화를 통해 월경 중에 중단되었던 예배의 시간과 다시 이어질 수 있어요.',
    tip1Title: '알아 두세요',
    tip1Text: '서두를 필요는 없어요. 월경이 끝났다는 것을 확실히 확인했다면, 준비가 되었을 때 부담 없이 구슬을 하면 돼요.',
    section2Body: '구슬은 공통된 일반 원칙에 바탕을 두어요. 스스로를 정화하겠다는 의도, 그리고 머리카락과 피부를 포함해 몸 전체를 빠짐없이 씻는 것이에요. 다만 세부적인 방법은 따르는 법학파에 따라 다를 수 있어요.',
    alertTitle: '중요한 참고',
    alertText: '여기서는 어떤 특정한 방법도 유일하게 옳은 방법으로 제시하지 않아요. 평소 따르는 법학파나 의견을 참고하거나 자격을 갖춘 학자에게 조언을 구하면 상황에 맞는 구체적인 방법을 알 수 있어요.',
    section3Body1: '월경이 끝나고 구슬을 마치면 예배는 특별한 지연이나 추가 조건 없이 평소처럼 다시 시작돼요.',
    section3Body2: '서로 다른 규칙이 적용되는 두 가지 경우를 구분하면 도움이 돼요. 월경 중에 드리지 못한 예배는 일반적으로 보충하지 않지만, 라마단에 놓친 금식 일수는 나중에 보충해야 해요(카다).',
    section3Body3: '예를 들어 6일 동안 생리를 한 여성은 구슬을 한 뒤 평소처럼 예배를 다시 시작하며, 그 6일 동안의 예배를 보충할 필요가 없어요. 하지만 이에 해당하는 6일의 금식은 라마단이 끝난 뒤에 보충해요.',
    practicalPoints: [
      '월경이 끝난 것을 확실히 알아차려요',
      '의례적 정결로 돌아가기 위해 구슬(전신 정화 목욕)을 해요',
      '지체 없이 예배를 평소처럼 다시 시작해요',
      '월경 중에 놓친 예배는 일반적으로 보충하지 않는다는 점을 알아 두어요',
      '특별한 상황이나 계속되는 의문이 있을 때는 자격을 갖춘 학자에게 조언을 구해요',
    ],
    shareMessage: '구슬과 예배로의 복귀 — AWA',
  },
  'pt-PT': {
    badge: 'REGRESSO À ORAÇÃO',
    title: 'O ghusl e o\nregresso à oração',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Os passos gerais para retomar a oração após a menstruação, com tranquilidade.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O ghusl, regresso à pureza ritual',
      'Um método que pode variar consoante a escola',
      'Retomar a oração, sem compensar as orações em falta',
      'Pontos práticos a reter',
    ],
    section1Body1: 'O ghusl é um banho ritual maior: consiste em lavar o corpo inteiro com a intenção de regressar ao estado de pureza ritual (tahara), necessário para realizar a oração e outros atos de culto.',
    section1Body2: 'Antes de realizar o ghusl, é importante certificar-se de que a menstruação terminou verdadeiramente: o ghusl deve seguir-se à certeza de que o sangramento parou, e não precedê-la. De um modo geral, este fim é reconhecido pela cessação total do sangramento, observada durante um período suficiente para afastar qualquer dúvida — um ponto tratado em pormenor no artigo dedicado à pureza ritual.',
    section1Body3: 'Esta purificação é o que permite retomar os momentos de culto suspensos durante a menstruação.',
    tip1Title: 'Bom saber',
    tip1Text: 'Não é preciso sentir-se apressada: o ghusl pode ser realizado assim que estiver pronta, sem pressão, depois de o fim da menstruação ter sido confirmado com certeza.',
    section2Body: 'O ghusl assenta em princípios gerais comuns: a intenção de se purificar e a lavagem completa do corpo, incluindo o cabelo e a pele. Os pormenores precisos do método podem, no entanto, variar consoante a escola jurídica seguida.',
    alertTitle: 'Nota importante',
    alertText: 'Nenhum método em particular é aqui apresentado como o único válido: recorrer à escola ou ao parecer que costuma seguir, ou pedir conselho a um sábio qualificado, ajudará a conhecer os pormenores precisos adequados à sua situação.',
    section3Body1: 'Uma vez terminada a menstruação e realizado o ghusl, a oração é retomada normalmente, sem atraso particular nem condição adicional.',
    section3Body2: 'É útil distinguir duas situações que seguem regras diferentes: as orações não realizadas durante a menstruação não são, em geral, compensadas, ao passo que os dias de jejum em falta durante o Ramadão devem ser compensados mais tarde (Qada).',
    section3Body3: 'Por exemplo, uma mulher que teve o período durante 6 dias retoma a oração normalmente após o ghusl, sem ter de compensar as orações desses 6 dias. Os 6 dias de jejum correspondentes, porém, serão compensados depois do Ramadão.',
    practicalPoints: [
      'Reconhecer com certeza o fim da menstruação',
      'Realizar o ghusl (banho ritual maior) para regressar à pureza ritual',
      'Retomar a oração normalmente, sem demora',
      'Saber que as orações em falta durante a menstruação não são, em geral, compensadas',
      'Pedir conselho a um sábio qualificado perante qualquer situação particular ou dúvida persistente',
    ],
    shareMessage: 'O ghusl e o regresso à oração — AWA',
  },
  bn: {
    badge: 'নামাজে ফিরে আসা',
    title: 'গোসল ও\nনামাজে ফিরে আসা',
    metaDuration: '5 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'মাসিকের পর মনের শান্তি নিয়ে নামাজ আবার শুরু করার সাধারণ ধাপগুলো।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় রায় দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'গোসল, পবিত্রতায় ফিরে আসা',
      'মাযহাব অনুযায়ী ভিন্ন হতে পারে এমন পদ্ধতি',
      'ছুটে যাওয়া নামাজ কাজা না করে নামাজ আবার শুরু করা',
      'মনে রাখার মতো ব্যবহারিক বিষয়',
    ],
    section1Body1: 'গোসল হলো একটি বড় ধর্মীয় পবিত্রতা অর্জনের প্রক্রিয়া (ফরজ গোসল): এতে নামাজ ও অন্যান্য ইবাদত করার জন্য প্রয়োজনীয় পবিত্রতার (তাহারাত) অবস্থায় ফিরে আসার নিয়তে পুরো শরীর ধোয়া হয়।',
    section1Body2: 'গোসল করার আগে নিশ্চিত হওয়া গুরুত্বপূর্ণ যে মাসিক সত্যিই শেষ হয়েছে: রক্তস্রাব বন্ধ হয়েছে এই নিশ্চয়তার পরে গোসল করা উচিত, আগে নয়। সাধারণভাবে, এই সমাপ্তি চেনা যায় রক্তস্রাব সম্পূর্ণ বন্ধ হওয়ার মাধ্যমে, যা যেকোনো সন্দেহ দূর করার মতো পর্যাপ্ত সময় ধরে পর্যবেক্ষণ করা হয় — এই বিষয়টি পবিত্রতা বিষয়ে আলাদা নিবন্ধে বিস্তারিত আলোচিত হয়েছে।',
    section1Body3: 'এই পবিত্রতা অর্জনই আপনাকে মাসিকের সময় স্থগিত থাকা ইবাদতের মুহূর্তগুলোতে আবার ফিরে আসতে দেয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'তাড়াহুড়া করার দরকার নেই: মাসিক যে নিশ্চিতভাবে শেষ হয়েছে তা জানার পর আপনি প্রস্তুত হলেই, কোনো চাপ ছাড়াই গোসল করা যায়।',
    section2Body: 'গোসলের কিছু সাধারণ নীতি সবার ক্ষেত্রে এক: নিজেকে পবিত্র করার নিয়ত এবং চুল ও ত্বকসহ শরীরের সম্পূর্ণ ধৌতকরণ। তবে পদ্ধতির সুনির্দিষ্ট খুঁটিনাটি অনুসৃত ফিকহের মাযহাব অনুযায়ী ভিন্ন হতে পারে।',
    alertTitle: 'গুরুত্বপূর্ণ নোট',
    alertText: 'এখানে কোনো একটি নির্দিষ্ট পদ্ধতিকে একমাত্র বৈধ পদ্ধতি হিসেবে উপস্থাপন করা হচ্ছে না: আপনি সাধারণত যে মাযহাব বা মত অনুসরণ করেন তা দেখে নেওয়া, অথবা যোগ্য আলেমের পরামর্শ নেওয়া আপনার পরিস্থিতির উপযোগী সুনির্দিষ্ট খুঁটিনাটি জানতে সাহায্য করবে।',
    section3Body1: 'মাসিক শেষ হয়ে গেলে এবং গোসল সম্পন্ন হলে নামাজ স্বাভাবিকভাবে আবার শুরু হয়, কোনো বিশেষ বিলম্ব বা অতিরিক্ত শর্ত ছাড়াই।',
    section3Body2: 'দুটি পরিস্থিতির মধ্যে পার্থক্য বোঝা সহায়ক, যেগুলো ভিন্ন নিয়ম অনুসরণ করে: মাসিকের সময় যে নামাজ পড়া হয়নি তা সাধারণত কাজা করা হয় না, অথচ রমজানে ছুটে যাওয়া রোজার দিনগুলো পরে কাজা করতে হয়।',
    section3Body3: 'উদাহরণস্বরূপ, যে নারীর 6 দিন মাসিক ছিল, তিনি গোসলের পর নামাজ স্বাভাবিকভাবে আবার শুরু করেন, সেই 6 দিনের নামাজ কাজা না করেই। তবে সংশ্লিষ্ট 6 দিনের রোজা রমজানের পরে কাজা করা হবে।',
    practicalPoints: [
      'মাসিকের সমাপ্তি নিশ্চিতভাবে চিনে নেওয়া',
      'পবিত্রতায় ফিরে আসতে গোসল (ফরজ গোসল) করা',
      'বিলম্ব না করে নামাজ স্বাভাবিকভাবে আবার শুরু করা',
      'জেনে রাখা যে মাসিকের সময় ছুটে যাওয়া নামাজ সাধারণত কাজা করা হয় না',
      'কোনো বিশেষ পরিস্থিতি বা স্থায়ী সন্দেহে যোগ্য আলেমের পরামর্শ নেওয়া',
    ],
    shareMessage: 'গোসল ও নামাজে ফিরে আসা — AWA',
  },
  da: {
    badge: 'TILBAGEVENDEN TIL BØN',
    title: 'Ghusl og\ntilbagevenden til bøn',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'De generelle skridt til at genoptage salat/bøn efter menstruation, med ro i sindet.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er rent uddannelsesmæssigt. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Ghusl, tilbagevenden til rituel renhed',
      'En metode der kan variere fra skole til skole',
      'Genoptagelse af salat/bøn, uden at indhente missede bønner',
      'Praktiske punkter at huske',
    ],
    section1Body1: 'Ghusl er en stor rituel ablution: den består i at vaske hele kroppen med intentionen om at vende tilbage til tilstanden af rituel renhed (tahara), som er nødvendig for at udføre salat/bøn og andre gudsdyrkelseshandlinger.',
    section1Body2: 'Inden ghuslen udføres, er det vigtigt at sikre, at menstruationen virkelig er slut: ghuslen bør følge efter, ikke foregå, visheden om, at blødningen er stoppet. Generelt set erkendes denne afslutning ved den totale standsning af blødningen, observeret over en tilstrækkelig periode for at udelukke enhver tvivl — et punkt, der dækkes detaljeret i artiklen dedikeret til rituel renhed.',
    section1Body3: 'Denne renselse er det, der giver dig mulighed for at genoprette forbindelsen til de gudsdyrkelsesøjeblikke, der var suspenderet under menstruationen.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Der er ingen grund til at føle sig forhastet: ghuslen kan udføres, så snart du er klar, uden pres, når afslutningen af menstruationen er bekræftet med sikkerhed.',
    section2Body: 'Ghuslen bygger på fælles generelle principper: intentionen om at rense sig og den fuldstændige vask af kroppen, herunder hår og hud. De præcise detaljer om metoden kan dog variere i henhold til den fulgte retsskole.',
    alertTitle: 'Vigtig note',
    alertText: 'Ingen særlig metode præsenteres her som den eneste gyldige: at henvise til den skole eller mening, du sædvanligvis følger, eller at søge råd fra en kvalificeret lærd, vil hjælpe dig med at lære de præcise detaljer tilpasset din situation.',
    section3Body1: 'Når menstruationen er slut og ghuslen er udført, genoptages salat/bøn normalt, uden særlig forsinkelse eller yderligere betingelse.',
    section3Body2: 'Det er nyttigt at skelne mellem to situationer, der følger forskellige regler: bønner, der ikke er udført under menstruation, indhentes generelt ikke, hvorimod fastedage misset under Ramadan skal indhentes senere (qadaa-faste).',
    section3Body3: 'For eksempel genoptager en kvinde, der har haft menstruation i 6 dage, salat/bøn normalt efter ghuslen, uden at skulle indhente bønnerne fra disse 6 dage. De tilsvarende 6 fastedage indhentes dog efter Ramadan.',
    practicalPoints: [
      'At genkende afslutningen på menstruation med sikkerhed',
      'At udføre ghuslen (den store ablution) for at vende tilbage til rituel renhed',
      'At genoptage salat/bøn normalt, uden forsinkelse',
      'At vide, at bønner misset under menstruation generelt ikke indhentes',
      'At søge råd fra en kvalificeret lærd for enhver særlig situation eller vedvarende tvivl',
    ],
    shareMessage: 'Ghusl og tilbagevenden til bøn — AWA',
  },
  sv: {
    badge: 'TILBAGEVENDEN TIL BÖN',
    title: 'Ghusl og\ntilbagevenden till bön',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'De generelle skridt till at genoptage salat/bön efter menstruation, med ro i sindet.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Ghusl, tilbagevenden till rituel renhed',
      'En metode der kan variere fran skole till skole',
      'Genoptagelse av salat/bön, uden at indhente missede bönner',
      'Praktiske punkter at huske',
    ],
    section1Body1: 'Ghusl ar en stor rituel ablution: den består i at vaske hele kroppen med intentionen om at vende tilbage till tilstanden av rituel renhed (tahara), som ar nödvendig for att udföre salat/bön och andre gudsdyrkelseshandlinger.',
    section1Body2: 'Inden ghuslen udföres, ar det vigtigt at sikre, at menstruationen virkelig ar slut: ghuslen bör fölge efter, inte foregå, visheden om, at blödningen ar stoppet. Generelt set erkendes denne afslutning ved den totale standsning av blödningen, observeret over en tilsträkkelig periode for att udelukke enhver tvivl — et punkt, der däkkes detaljeret i artiklen dedikeret till rituel renhed.',
    section1Body3: 'Denne renselse ar det, der giver dig mulighed for att genoprette forbindelsen till de gudsdyrkelsesöjeblikke, der var suspenderet under menstruationen.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Der ar ingen grund till at föle sig forhastet: ghuslen kan udföres, så snart du ar klar, uden pres, når afslutningen av menstruationen ar bekräftet med sikkerhed.',
    section2Body: 'Ghuslen bygger på fälles generelle principper: intentionen om at rense sig och den fuldständige vask av kroppen, herunder hår och hud. De präcise detaljer om metoden kan dog variere i henhold till den fulgte retsskole.',
    alertTitle: 'Vigtig note',
    alertText: 'Ingen särlig metode präsenteres her som den eneste gyldige: at henvise till den skole eller mening, du sädvanligvis fölger, eller at söge råd fran en kvalificeret lärd, vil hjälpe dig med at läre de präcise detaljer tilpasset din situation.',
    section3Body1: 'Når menstruationen ar slut och ghuslen ar udfört, genoptages salat/bön normalt, uden särlig forsinkelse eller yderligere betingelse.',
    section3Body2: 'Det ar nyttigt at skelne mellem to situationer, der fölger forskellige regler: bönner, der inte ar udfört under menstruation, indhentes generelt inte, hvorimod fastedage misset under Ramadan skal indhentes senere (qadaa-faste).',
    section3Body3: 'For eksempel genoptager en kvinde, der har haft menstruation i 6 dagar, salat/bön normalt efter ghuslen, uden at skulle indhente bönnerne fran disse 6 dagar. De tilsvarende 6 fastedage indhentes dog efter Ramadan.',
    practicalPoints: [
      'At genkende afslutningen på menstruation med sikkerhed',
      'At udföre ghuslen (den store ablution) for att vende tilbage till rituel renhed',
      'At genoptage salat/bön normalt, uden forsinkelse',
      'At vide, at bönner misset under menstruation generelt inte indhentes',
      'At söge råd fran en kvalificeret lärd for enhver särlig situation eller vedvarende tvivl',
    ],
    shareMessage: 'Ghusl och tilbagevenden till bön — AWA',
  },
  nb: {
    badge: 'TILBAKE TIL BØNNEN',
    title: 'Ghusl og\ntilbakevending til bønnen',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'De generelle trinnene for å gjenoppta bønnen etter menstruasjon, med ro i sinnet.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Ghusl, tilbakekomst til rituell renhet',
      'En metode som kan variere etter rettsskole',
      'Gjenoppta bønnen, uten å ta igjen bønner man gikk glipp av',
      'Praktiske punkter å huske',
    ],
    section1Body1: 'Ghusl er en stor rituell avvasking: den består i å vaske hele kroppen med hensikt om å vende tilbake til tilstanden av rituell renhet (tahara), nødvendig for å utføre bønn og andre gudstjenestehandlinger.',
    section1Body2: 'Før du utfører ghusl, er det viktig å forsikre seg om at menstruasjonen virkelig er over: ghusl bør følge etter, ikke gå foran, sikkerheten om at blødningen har stoppet. Generelt anerkjennes denne slutten av at blødningen helt har stoppet, observert over tilstrekkelig lang tid til å utelukke enhver tvil – et punkt som er behandlet i detalj i artikkelen om rituell renhet.',
    section1Body3: 'Denne renselsen er det som lar deg knytte deg til øyeblikkene av gudstjeneste som var suspendert under menstruasjonen.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Du trenger ikke føle deg hastet: ghusl kan utføres så snart du er klar, uten press, når slutten på menstruasjonen er bekreftet med sikkerhet.',
    section2Body: 'Ghusl bygger på felles generelle prinsipper: hensikten om å rense seg, og fullstendig vask av kroppen, inkludert håret og huden. De presise detaljene i metoden kan imidlertid variere etter rettsskolen som følges.',
    alertTitle: 'Viktig merknad',
    alertText: 'Ingen bestemt metode presenteres her som den eneste gyldige: å holde seg til rettsskolen eller uttalelsen du vanligvis følger, eller å søke råd hos en kvalifisert lærd, hjelper deg å lære de presise detaljene som passer din situasjon.',
    section3Body1: 'Når menstruasjonen er over og ghusl er utført, gjenopptas bønnen normalt, uten noen spesiell forsinkelse eller ekstra betingelse.',
    section3Body2: 'Det er nyttig å skille mellom to situasjoner som følger ulike regler: bønner som ikke ble utført under menstruasjon, tas vanligvis ikke igjen, mens fastedager man gikk glipp av under ramadan, må tas igjen senere (qada).',
    section3Body3: 'For eksempel gjenopptar en kvinne som har hatt mens i 6 dager, bønnen normalt etter ghusl, uten å måtte ta igjen bønnene fra disse 6 dagene. De tilsvarende 6 fastedagene skal imidlertid tas igjen etter ramadan.',
    practicalPoints: [
      'Å kjenne igjen slutten på menstruasjonen med sikkerhet',
      'Å utføre ghusl (den store avvaskingen) for å vende tilbake til rituell renhet',
      'Å gjenoppta bønnen normalt, uten forsinkelse',
      'Å vite at bønner man gikk glipp av under menstruasjon, vanligvis ikke tas igjen',
      'Å søke råd hos en kvalifisert lærd ved enhver spesiell situasjon eller vedvarende tvil',
    ],
    shareMessage: 'Ghusl og tilbakevending til bønnen – AWA',
  },
  pl: {
    badge: 'POWRÓT DO MODLITWY',
    title: 'Gusl i\npowrót do modlitwy',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Ogólne kroki wznowienia modlitwy po menstruacji, ze spokojem.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Gusl, powrót do rytualnej czystości',
      'Metoda, która może różnić się w zależności od szkoły',
      'Wznowienie modlitwy bez odrabiania opuszczonych modlitw',
      'Praktyczne punkty do zapamiętania',
    ],
    section1Body1: 'Gusl to wielkie rytualne obmycie: polega na umyciu całego ciała z intencją powrotu do stanu rytualnej czystości (tahara), niezbędnej do odprawiania modlitwy i innych aktów kultu.',
    section1Body2: 'Przed wykonaniem gusl ważne jest upewnienie się, że menstruacja naprawdę się zakończyła: gusl powinien następować po pewności, że krwawienie ustało, a nie jej poprzedzać. Zasadniczo ten koniec rozpoznaje się po całkowitym ustaniu krwawienia, obserwowanym przez wystarczająco długi czas, by wykluczyć wszelkie wątpliwości — kwestia omówiona szczegółowo w artykule poświęconym rytualnej czystości.',
    section1Body3: 'To oczyszczenie pozwala Ci wrócić do chwil kultu zawieszonych w czasie menstruacji.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Nie trzeba się spieszyć: gusl można wykonać, gdy tylko będziesz gotowa, bez presji, gdy koniec menstruacji zostanie potwierdzony z pewnością.',
    section2Body: 'Gusl opiera się na wspólnych zasadach ogólnych: intencji oczyszczenia oraz całkowitym umyciu ciała, w tym włosów i skóry. Dokładne szczegóły metody mogą się jednak różnić w zależności od szkoły prawa, której się przestrzega.',
    alertTitle: 'Ważna uwaga',
    alertText: 'Żadna konkretna metoda nie jest tu przedstawiana jako jedyna słuszna: odwołanie się do szkoły lub opinii, której zwykle przestrzegasz, albo zasięgnięcie porady wykwalifikowanego uczonego pomoże Ci poznać dokładne szczegóły odpowiednie dla Twojej sytuacji.',
    section3Body1: 'Gdy menstruacja się zakończy i wykonasz gusl, modlitwa jest wznawiana normalnie, bez szczególnej zwłoki ani dodatkowych warunków.',
    section3Body2: 'Warto odróżnić dwie sytuacje, które podlegają różnym zasadom: modlitw niewykonanych w czasie menstruacji zasadniczo się nie odrabia, natomiast dni postu opuszczone w ramadanie trzeba odrobić później (kada).',
    section3Body3: 'Na przykład kobieta, która miała miesiączkę przez 6 dni, wznawia modlitwę normalnie po gusl, bez odrabiania modlitw z tych 6 dni. Odpowiadające im 6 dni postu zostaną jednak odrobione po ramadanie.',
    practicalPoints: [
      'Rozpoznanie z pewnością końca menstruacji',
      'Wykonanie gusl (wielkiego obmycia) w celu powrotu do rytualnej czystości',
      'Normalne wznowienie modlitwy, bez zwłoki',
      'Świadomość, że modlitw opuszczonych w czasie menstruacji zasadniczo się nie odrabia',
      'Zasięgnięcie porady wykwalifikowanego uczonego w każdej szczególnej sytuacji lub przy uporczywych wątpliwościach',
    ],
    shareMessage: 'Gusl i powrót do modlitwy — AWA',
  },
  uk: {
    badge: 'ПОВЕРНЕННЯ ДО МОЛИТВИ',
    title: 'Гусль і\nповернення до молитви',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Загальні кроки для відновлення молитви після менструації — зі спокоєм.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Гусль — повернення до ритуальної чистоти',
      'Метод, що може відрізнятися залежно від школи',
      'Відновлення молитви без відпрацювання пропущених молитов',
      'Практичні моменти, які варто пам’ятати',
    ],
    section1Body1: 'Гусль — це велике ритуальне обмивання: воно полягає в омиванні всього тіла з наміром повернутися до стану ритуальної чистоти (тахара), необхідного для виконання молитви та інших актів богослужіння.',
    section1Body2: 'Перш ніж виконувати гусль, важливо переконатися, що менструація справді закінчилася: гусль має слідувати за певністю, що кровотеча припинилася, а не передувати їй. Загалом цей кінець розпізнають за повним припиненням кровотечі, що спостерігається протягом достатнього часу, щоб виключити будь-який сумнів — питання, докладно розглянуте в статті про ритуальну чистоту.',
    section1Body3: 'Це очищення дозволяє вам повернутися до моментів богослужіння, призупинених під час менструації.',
    tip1Title: 'Варто знати',
    tip1Text: 'Не потрібно поспішати: гусль можна виконати, щойно ви будете готові, без тиску, коли кінець менструації підтверджено з певністю.',
    section2Body: 'Гусль ґрунтується на спільних загальних принципах: намір очиститися та повне омивання тіла, зокрема волосся й шкіри. Точні подробиці методу можуть, однак, відрізнятися залежно від школи правознавства, якої дотримуються.',
    alertTitle: 'Важлива примітка',
    alertText: 'Жоден конкретний метод тут не подається як єдиний слушний: звернення до школи чи думки, якої ви зазвичай дотримуєтеся, або порада кваліфікованого вченого допоможе вам дізнатися точні подробиці, відповідні вашій ситуації.',
    section3Body1: 'Щойно менструація закінчилася й гусль виконано, молитва відновлюється нормально, без особливого зволікання чи додаткових умов.',
    section3Body2: 'Корисно розрізняти дві ситуації, що підпорядковані різним правилам: молитви, не виконані під час менструації, зазвичай не відпрацьовують, тоді як дні посту, пропущені під час Рамадану, слід відпрацювати пізніше (када).',
    section3Body3: 'Наприклад, жінка, у якої менструація тривала 6 днів, нормально відновлює молитву після гуслю, не відпрацьовуючи молитви цих 6 днів. Відповідні 6 днів посту, однак, будуть відпрацьовані після Рамадану.',
    practicalPoints: [
      'Розпізнати кінець менструації з певністю',
      'Виконати гусль (велике обмивання), щоб повернутися до ритуальної чистоти',
      'Нормально відновити молитву, без зволікання',
      'Знати, що молитви, пропущені під час менструації, зазвичай не відпрацьовують',
      'Шукати поради кваліфікованого вченого у будь-якій особливій ситуації чи стійких сумнівах',
    ],
    shareMessage: 'Гусль і повернення до молитви — AWA',
  },
  cs: {
    badge: 'NÁVRAT K MODLITBĚ',
    title: 'Ghusl a\nnávrat k modlitbě',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Obecné kroky k obnovení modlitby po skončení menstruace, v klidu.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Ghusl, návrat k rituální čistotě',
      'Metoda, která se může lišit podle školy',
      'Obnovení modlitby bez nahrazování vynechaných modliteb',
      'Praktické body k zapamatování',
    ],
    section1Body1: 'Ghusl je velká rituální očista: spočívá v omytí celého těla se záměrem vrátit se ke stavu rituální čistoty (tahára), nezbytnému k vykonávání modlitby a dalších úkonů bohoslužby.',
    section1Body2: 'Před provedením ghuslu je důležité se ujistit, že menstruace skutečně skončila: ghusl má následovat po jistotě, že krvácení ustalo, nikoli jí předcházet. Obecně se tento konec rozpoznává úplným ukončením krvácení, pozorovaným po dostatečně dlouhou dobu, aby se vyloučila jakákoli pochybnost — což je bod podrobně rozebraný v článku věnovaném rituální čistotě.',
    section1Body3: 'Právě tato očista vám umožňuje znovu se napojit na chvíle bohoslužby pozastavené během menstruace.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Není třeba se cítit pod tlakem: ghusl lze provést, jakmile jste připravena, bez spěchu, jakmile je konec menstruace s jistotou potvrzen.',
    section2Body: 'Ghusl vychází ze společných obecných zásad: záměru očistit se a úplného omytí těla, včetně vlasů a pokožky. Přesné podrobnosti postupu se však mohou lišit podle právní školy, kterou se řídíte.',
    alertTitle: 'Důležitá poznámka',
    alertText: 'Žádná konkrétní metoda zde není předkládána jako jediná platná: obrátit se na školu nebo názor, který obvykle sledujete, nebo požádat o radu kvalifikovaného učence vám pomůže naučit se přesné podrobnosti vhodné pro vaši situaci.',
    section3Body1: 'Jakmile menstruace skončila a ghusl byl proveden, modlitba se normálně obnoví, bez zvláštního odkladu ani dalších podmínek.',
    section3Body2: 'Je užitečné rozlišovat dvě situace, které se řídí různými pravidly: modlitby, které nebyly vykonány během menstruace, se obecně nenahrazují, zatímco dny půstu vynechané v ramadánu se musí později nahradit (kada).',
    section3Body3: 'Například žena, která měla menstruaci 6 dní, po ghuslu normálně obnoví modlitbu, aniž by musela nahrazovat modlitby z těchto 6 dnů. Odpovídajících 6 dnů půstu se však nahradí po ramadánu.',
    practicalPoints: [
      'S jistotou rozpoznat konec menstruace',
      'Provést ghusl (velkou očistu) pro návrat k rituální čistotě',
      'Normálně obnovit modlitbu, bez prodlení',
      'Vědět, že modlitby vynechané během menstruace se obecně nenahrazují',
      'Pro jakoukoli zvláštní situaci nebo přetrvávající pochybnost požádat o radu kvalifikovaného učence',
    ],
    shareMessage: 'Ghusl a návrat k modlitbě — AWA',
  },
  sk: {
    badge: 'NÁVRAT K MODLITBE',
    title: 'Ghusl a\nnávrat k modlitbe',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Všeobecné kroky na obnovenie modlitby po menštruácii, s pokojom.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Ghusl, návrat k rituálnej čistote',
      'Metóda, ktorá sa môže líšiť podľa školy',
      'Obnovenie modlitby bez nahrádzania vynechaných modlitieb',
      'Praktické body na zapamätanie',
    ],
    section1Body1: 'Ghusl je veľké rituálne obmytie: spočíva v umytí celého tela s úmyslom vrátiť sa do stavu rituálnej čistoty (tahára), potrebného na vykonávanie modlitby a ďalších úkonov bohoslužby.',
    section1Body2: 'Pred vykonaním ghuslu je dôležité uistiť sa, že menštruácia skutočne skončila: ghusl by mal nasledovať po istote, že krvácanie prestalo, nie jej predchádzať. Vo všeobecnosti sa tento koniec rozpoznáva podľa úplného zastavenia krvácania, pozorovaného po dostatočne dlhý čas, aby sa vylúčila akákoľvek pochybnosť — bod podrobne rozpracovaný v článku venovanom rituálnej čistote.',
    section1Body3: 'Táto očista vám umožňuje opäť nadviazať na chvíle bohoslužby pozastavené počas menštruácie.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Netreba sa cítiť ponáhľaná: ghusl možno vykonať, len čo ste pripravená, bez tlaku, keď bol koniec menštruácie s istotou potvrdený.',
    section2Body: 'Ghusl vychádza zo spoločných všeobecných zásad: úmysel očistiť sa a úplné umytie tela vrátane vlasov a pokožky. Presné podrobnosti metódy sa však môžu líšiť podľa nasledovanej právnej školy.',
    alertTitle: 'Dôležitá poznámka',
    alertText: 'Žiadna konkrétna metóda tu nie je prezentovaná ako jediná platná: vychádzanie zo školy alebo názoru, ktorý zvyčajne nasledujete, alebo rada kvalifikovaného učenca vám pomôže naučiť sa presné podrobnosti vhodné pre vašu situáciu.',
    section3Body1: 'Keď menštruácia skončila a ghusl bol vykonaný, modlitba sa normálne obnoví, bez osobitného odkladu alebo dodatočnej podmienky.',
    section3Body2: 'Je užitočné rozlišovať dve situácie, ktoré sa riadia odlišnými pravidlami: modlitby nevykonané počas menštruácie sa vo všeobecnosti nenahrádzajú, zatiaľ čo dni pôstu vynechané počas ramadánu sa musia neskôr nahradiť (kada).',
    section3Body3: 'Napríklad žena, ktorá mala menštruáciu 6 dní, po ghusle normálne obnoví modlitbu, bez potreby nahrádzať modlitby z týchto 6 dní. Zodpovedajúcich 6 dní pôstu sa však nahradí po ramadáne.',
    practicalPoints: [
      'S istotou rozpoznať koniec menštruácie',
      'Vykonať ghusl (veľké obmytie) na návrat k rituálnej čistote',
      'Normálne obnoviť modlitbu, bez odkladu',
      'Vedieť, že modlitby vynechané počas menštruácie sa vo všeobecnosti nenahrádzajú',
      'Pri každej osobitnej situácii alebo pretrvávajúcej pochybnosti vyhľadať radu kvalifikovaného učenca',
    ],
    shareMessage: 'Ghusl a návrat k modlitbe — AWA',
  },
  hu: {
    badge: 'VISSZATÉRÉS AZ IMÁHOZ',
    title: 'A ghusl és a\nvisszatérés az imához',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Az általános lépések az ima menstruáció utáni folytatásához, nyugodt szívvel.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Ghusl, visszatérés a rituális tisztasághoz',
      'Az iskolától függően eltérhető módszer',
      'Az ima folytatása a kihagyott imák bepótlása nélkül',
      'Praktikus tudnivalók',
    ],
    section1Body1: 'A ghusl nagy rituális mosakodás: az egész test megmosásából áll a rituális tisztasági állapotba (tahára) való visszatérés szándékával, amely az ima és az istentisztelet más cselekményeinek végzéséhez szükséges.',
    section1Body2: 'A ghusl elvégzése előtt fontos meggyőződni arról, hogy a menstruáció valóban véget ért: a ghuslnak a vérzés megszűnésének bizonyossága után kell következnie, nem megelőznie azt. Általában ezt a véget a vérzés teljes megszűnése jelzi, kellően hosszú ideig megfigyelve ahhoz, hogy minden kétség kizárható legyen — ezt a pontot a rituális tisztaságnak szentelt cikk részletesen tárgyalja.',
    section1Body3: 'Ez a megtisztulás teszi lehetővé, hogy újra kapcsolatba lépj a menstruáció alatt felfüggesztett istentiszteleti pillanatokkal.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Nem kell sietned: a ghusl akkor végezhető el, amikor készen állsz, nyomás nélkül, miután a menstruáció végét biztosan megerősítetted.',
    section2Body: 'A ghusl közös általános elveken alapul: a megtisztulási szándékon és a test — a hajat és a bőrt is beleértve — teljes megmosásán. A módszer pontos részletei azonban a követett jogi iskolától függően eltérhetnek.',
    alertTitle: 'Fontos megjegyzés',
    alertText: 'Itt egyetlen módszer sem szerepel az egyetlen érvényesként: a szokásosan követett iskolára vagy véleményre hivatkozás, illetve egy kvalifikált tudós tanácsa segít megtanulni a helyzetedhez illő pontos részleteket.',
    section3Body1: 'Miután a menstruáció véget ért, és a ghusl megtörtént, az ima normálisan folytatódik, különösebb halasztás vagy további feltétel nélkül.',
    section3Body2: 'Hasznos megkülönböztetni két helyzetet, amelyek eltérő szabályokat követnek: a menstruáció alatt el nem végzett imákat általában nem pótolják, míg a ramadán alatt kihagyott böjtnapokat később be kell pótolni (kada).',
    section3Body3: 'Például az a nő, akinek 6 napig volt menstruációja, a ghusl után normálisan folytatja az imát, anélkül, hogy a 6 nap imáit be kellene pótolnia. A megfelelő 6 nap böjtöt azonban a ramadán után pótolják be.',
    practicalPoints: [
      'A menstruáció végének biztos felismerése',
      'A ghusl (nagy mosakodás) elvégzése a rituális tisztaságba való visszatéréshez',
      'Az ima normális, halasztás nélküli folytatása',
      'Annak tudása, hogy a menstruáció alatt kihagyott imákat általában nem pótolják',
      'Minden különleges helyzetben vagy tartós kétség esetén kvalifikált tudós tanácsának kérése',
    ],
    shareMessage: 'A ghusl és a visszatérés az imához — AWA',
  },
  ro: {
    badge: 'REVENIREA LA RUGĂCIUNE',
    title: 'Ghusl și\nreluarea rugăciunii',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Pașii generali pentru a relua rugăciunea după menstruație, cu liniște sufletească.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ghusl, revenirea la puritatea rituală',
      'O metodă care poate varia în funcție de școală',
      'Reluarea rugăciunii, fără recuperarea celor ratate',
      'Puncte practice de reținut',
    ],
    section1Body1: 'Ghusl este o abluțiune rituală majoră: constă în spălarea întregului corp cu intenția de a reveni la starea de puritate rituală (tahara), necesară pentru îndeplinirea rugăciunii și a altor acte de cult.',
    section1Body2: 'Înainte de a efectua ghusl, este important să te asiguri că menstruația s-a încheiat cu adevărat: ghusl trebuie să urmeze, nu să preceadă, certitudinea că sângerarea s-a oprit. În general, acest sfârșit este recunoscut prin oprirea totală a sângerării, observată pe o perioadă suficientă de timp pentru a exclude orice îndoială — un punct tratat în detaliu în articolul dedicat purității rituale.',
    section1Body3: 'Această purificare este ceea ce îți permite să te reconectezi cu momentele de cult suspendate în timpul menstruației.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Nu e nevoie să te simți grăbită: ghusl poate fi efectuat de îndată ce ești pregătită, fără presiune, odată ce sfârșitul menstruației a fost confirmat cu certitudine.',
    section2Body: 'Ghusl se bazează pe principii generale comune: intenția de a te purifica și spălarea completă a corpului, inclusiv a părului și a pielii. Detaliile precise ale metodei pot varia totuși în funcție de școala de jurisprudență urmată.',
    alertTitle: 'Notă importantă',
    alertText: 'Nicio metodă anume nu este prezentată aici ca fiind singura validă: raportarea la școala sau la părerea pe care o urmezi de obicei, sau cererea sfatului unui savant calificat, te va ajuta să afli detaliile precise potrivite situației tale.',
    section3Body1: 'Odată ce menstruația s-a încheiat și ghusl a fost efectuat, rugăciunea se reia normal, fără nicio întârziere sau condiție suplimentară deosebită.',
    section3Body2: 'Este util să distingi între două situații care urmează reguli diferite: rugăciunile neefectuate în timpul menstruației nu se recuperează în general, în timp ce zilele de post ratate în Ramadan trebuie recuperate mai târziu (qadaa).',
    section3Body3: 'De exemplu, o femeie care a avut menstruație timp de 6 zile reia rugăciunea normal după ghusl, fără a trebui să recupereze rugăciunile din acele 6 zile. Cele 6 zile de post corespunzătoare vor fi însă recuperate după Ramadan.',
    practicalPoints: [
      'Recunoașterea cu certitudine a sfârșitului menstruației',
      'Efectuarea ghusl (abluțiunea majoră) pentru a reveni la puritatea rituală',
      'Reluarea normală a rugăciunii, fără întârziere',
      'Știința că rugăciunile ratate în timpul menstruației nu se recuperează în general',
      'Cererea sfatului unui savant calificat pentru orice situație particulară sau îndoială persistentă',
    ],
    shareMessage: 'Ghusl și reluarea rugăciunii — AWA',
  },
  bg: {
    badge: 'ВРЪЩАНЕ КЪМ МОЛИТВАТА',
    title: 'Гусл и\nвръщане към молитвата',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Общите стъпки за възобновяване на молитвата след менструация, със спокойствие.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Гусл, връщане към ритуалната чистота',
      'Метод, който може да варира според школата',
      'Възобновяване на молитвата, без наваксване на пропуснатите молитви',
      'Практически точки, които да запомниш',
    ],
    section1Body1: 'Гуслът е голямо ритуално измиване: състои се в измиване на цялото тяло с намерението да се върнеш към състоянието на ритуална чистота (тахара), необходимо за извършване на молитвата и други актове на богослужение.',
    section1Body2: 'Преди да извършиш гусла, важно е да се увериш, че менструацията наистина е свършила: гуслът трябва да следва, а не да предхожда сигурността, че кървенето е спряло. Най-общо този край се разпознава по пълното спиране на кървенето, наблюдавано в продължение на достатъчно дълъг период, за да се отстрани всяко съмнение — точка, разгледана подробно в статията за ритуалната чистота.',
    section1Body3: 'Това очистване е онова, което ти позволява да се свържеш отново с моментите на богослужение, преустановени по време на менструация.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Не е нужно да се чувстваш притисната: гуслът може да се извърши веднага щом си готова, без натиск, след като краят на менструацията е потвърден със сигурност.',
    section2Body: 'Гуслът се основава на общи принципи: намерението да се очистиш и пълното измиване на тялото, включително косата и кожата. Точните подробности на метода обаче могат да варират според следваната школа на правото.',
    alertTitle: 'Важна забележка',
    alertText: 'Никой конкретен метод не се представя тук като единствено валиден: позоваването на школата или мнението, което обикновено следваш, или съветът от квалифициран учен ще ти помогне да научиш точните подробности, подходящи за ситуацията ти.',
    section3Body1: 'След като менструацията е свършила и гуслът е извършен, молитвата се възобновява нормално, без особено забавяне или допълнително условие.',
    section3Body2: 'Полезно е да се разграничат две ситуации, които следват различни правила: молитвите, неизвършени по време на менструация, обикновено не се наваксват, докато дните на пост, пропуснати през Рамадан, трябва да се наваксат по-късно (кадаа).',
    section3Body3: 'Например жена, която е имала менструация 6 дни, възобновява молитвата нормално след гусла, без да трябва да навакса молитвите от тези 6 дни. Съответните 6 дни пост обаче ще бъдат наваксани след Рамадан.',
    practicalPoints: [
      'Разпознаване на края на менструацията със сигурност',
      'Извършване на гусла (голямото абдест), за да се върнеш към ритуалната чистота',
      'Нормално възобновяване на молитвата, без забавяне',
      'Знание, че молитвите, пропуснати по време на менструация, обикновено не се наваксват',
      'Търсене на съвет от квалифициран учен за всяка особена ситуация или упорито съмнение',
    ],
    shareMessage: 'Гусл и връщане към молитвата — AWA',
  },
  sr: {
    badge: 'ПОВРАТАК МОЛИТВИ',
    title: 'Гусл и\nповратак молитви',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Општи кораци за настављање молитве после менструације, са спокојем.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Гусл, повратак ритуалној чистоти',
      'Метод који може варирати према школи',
      'Настављање молитве, без надокнаде пропуштених молитви',
      'Практичне тачке за памћење',
    ],
    section1Body1: 'Гусл је велико ритуално умивање: састоји се у прању целог тела са намером повратка у стање ритуалне чистоте (тахара), потребно за обављање молитве и других дела богослужења.',
    section1Body2: 'Пре извођења гусла важно је уверити се да је менструација заиста завршила: гусл треба да следи, а не да претходи сигурности да је крварење престало. Најопштије, овај крај се препознаје по потпуном престанку крварења, посматраном током довољно дугог периода да се отклони свака сумња — тачка детаљно разматрана у чланку посвећеном ритуалној чистоти.',
    section1Body3: 'Ово очишћење је оно што ти омогућава да се поново повежеш са тренуцима богослужења преустављеним током менструације.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Нема потребе да се осећаш притиснута: гусл се може извршити чим си спремна, без притиска, пошто је крај менструације потврђен са сигурношћу.',
    section2Body: 'Гусл се заснива на заједничким општим принципима: намера да се очистиш и потпуно прање тела, укључујући косу и кожу. Прецизне појединости метода, међутим, могу варирати зависно од правне школе коју пратиш.',
    alertTitle: 'Важна напомена',
    alertText: 'Ниједан одређени метод се овде не представља као једини ваљан: позивање на школу или мишљење које уобичајено пратиш, или тражење савета од квалификованог учењака, помоћи ће ти да научиш прецизне појединости прилагођене твојој ситуацији.',
    section3Body1: 'Када менструација заврши и гусл буде извршен, молитва се нормално наставља, без посебног одлагања или додатног услова.',
    section3Body2: 'Корисно је разликовати две ситуације које следе различита правила: молитве које нису извршене током менструације обично се не надокнађују, док се дани поста пропуштени током Рамазана морају надокнадити касније (кадаа).',
    section3Body3: 'На пример, жена која је имала менструацију 6 дана нормално наставља молитву после гусла, без потребе да надокнади молитве из тих 6 дана. Одговарајућих 6 дана поста, међутим, биће надокнађено после Рамазана.',
    practicalPoints: [
      'Препознавање краја менструације са сигурношћу',
      'Извођење гусла (великог абдеста) ради повратка у ритуалну чистоту',
      'Нормално настављање молитве, без одлагања',
      'Знање да се молитве пропуштене током менструације обично не надокнађују',
      'Тражење савета од квалификованог учењака за сваку посебну ситуацију или упорну сумњу',
    ],
    shareMessage: 'Гусл и повратак молитви — AWA',
  },
  hr: {
    badge: 'POVRATAK MOLITVI',
    title: 'Gusl i\npovratak molitvi',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Opći koraci za nastavak molitve nakon menstruacije, s mirom u duši.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Gusl, povratak ritualne čistoće',
      'Metoda koja se može razlikovati prema školi',
      'Nastavak molitve, bez nadoknade propuštenih molitvi',
      'Praktične točke koje treba zapamtiti',
    ],
    section1Body1: 'Gusl je veliko ritualno pranje: sastoji se od pranja cijelog tijela s namjerom povratka u stanje ritualne čistoće (tahara), potrebno za obavljanje molitve i drugih bogoslužnih čina.',
    section1Body2: 'Prije obavljanja gusla važno je biti sigurna da je menstruacija doista završila: gusl treba slijediti, a ne prethoditi sigurnosti da je krvarenje prestalo. Općenito se taj kraj prepoznaje po potpunom prestanku krvarenja, promatranom tijekom dovoljno dugog razdoblja da se isključi svaka sumnja — točka koja je detaljno obrađena u članku posvećenom ritualnoj čistoći.',
    section1Body3: 'To je pročišćenje ono što ti omogućuje ponovno povezivanje s trenucima bogoslužja suspendiranima tijekom menstruacije.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Nema potrebe osjećati žurbu: gusl se može obaviti čim budeš spremna, bez pritiska, nakon što je kraj menstruacije sa sigurnošću potvrđen.',
    section2Body: 'Gusl se temelji na zajedničkim općim načelima: namjeri pročišćenja i potpunom pranju tijela, uključujući kosu i kožu. Točne pojedinosti metode mogu se, međutim, razlikovati ovisno o pravnoj školi koja se slijedi.',
    alertTitle: 'Važna napomena',
    alertText: 'Nijedna posebna metoda ovdje se ne predstavlja kao jedina valjana: oslanjanje na školu ili mišljenje koje obično slijediš ili traženje savjeta kvalificiranog učenjaka pomoći će ti naučiti točne pojedinosti prilagođene tvojoj situaciji.',
    section3Body1: 'Nakon što menstruacija završi i gusl se obavi, molitva se normalno nastavlja, bez posebne odgode ili dodatnog uvjeta.',
    section3Body2: 'Korisno je razlikovati dvije situacije koje slijede različita pravila: molitve neobavljene tijekom menstruacije općenito se ne nadoknađuju, dok se dani posta propušteni tijekom Ramazana moraju nadoknaditi kasnije (kada).',
    section3Body3: 'Na primjer, žena koja je imala menstruaciju 6 dana nastavlja molitvu normalno nakon gusla, bez obveze nadoknade molitvi tih 6 dana. Odgovarajućih 6 dana posta, međutim, nadoknadit će se nakon Ramazana.',
    practicalPoints: [
      'Sa sigurnošću prepoznati kraj menstruacije',
      'Obaviti gusl (veliko pranje) radi povratka ritualne čistoće',
      'Normalno nastaviti molitvu, bez odgode',
      'Znati da se molitve propuštene tijekom menstruacije općenito ne nadoknađuju',
      'Zatražiti savjet kvalificiranog učenjaka za svaku posebnu situaciju ili trajnu sumnju',
    ],
    shareMessage: 'Gusl i povratak molitvi — AWA',
  },
  bs: {
    badge: 'POVRATAK MOLITVI',
    title: 'Gusl i\npovratak molitvi',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Opći koraci za nastavak molitve nakon menstruacije, s mirom u duši.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Gusl, povratak ritualne čistoće',
      'Metoda koja se može razlikovati prema školi',
      'Nastavak molitve, bez nadoknade propuštenih molitvi',
      'Praktične tačke koje treba zapamtiti',
    ],
    section1Body1: 'Gusl je veliko ritualno pranje: sastoji se od pranja cijelog tijela s namjerom povratka u stanje ritualne čistoće (tahara), potrebno za obavljanje molitve i drugih bogoslužnih čina.',
    section1Body2: 'Prije obavljanja gusla važno je biti sigurna da je menstruacija doista završila: gusl treba slijediti, a ne prethoditi sigurnosti da je krvarenje prestalo. Općenito se taj kraj prepoznaje po potpunom prestanku krvarenja, promatranom tokom dovoljno dugog razdoblja da se isključi svaka sumnja — tačka koja je detaljno obrađena u članku posvećenom ritualnoj čistoći.',
    section1Body3: 'To je pročišćenje ono što ti omogućuje ponovno povezivanje s trenucima bogoslužja suspendiranima tokom menstruacije.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Nema potrebe osjećati žurbu: gusl se može obaviti čim budeš spremna, bez pritiska, nakon što je kraj menstruacije sa sigurnošću potvrđen.',
    section2Body: 'Gusl se temelji na zajedničkim općim načelima: namjeri pročišćenja i potpunom pranju tijela, uključujući kosu i kožu. Tačne pojedinosti metode mogu se, međutim, razlikovati ovisno o pravnoj školi koja se slijedi.',
    alertTitle: 'Važna napomena',
    alertText: 'Nijedna posebna metoda ovdje se ne predstavlja kao jedina valjana: oslanjanje na školu ili mišljenje koje obično slijediš ili traženje savjeta kvalificiranog učenjaka pomoći će ti naučiti tačne pojedinosti prilagođene tvojoj situaciji.',
    section3Body1: 'Nakon što menstruacija završi i gusl se obavi, molitva se normalno nastavlja, bez posebne odgode ili dodatnog uslova.',
    section3Body2: 'Korisno je razlikovati dvije situacije koje slijede različita pravila: molitve neobavljene tokom menstruacije općenito se ne nadoknađuju, dok se dani posta propušteni tokom Ramazana moraju nadoknaditi kasnije (kaza).',
    section3Body3: 'Na primjer, žena koja je imala menstruaciju 6 dana nastavlja molitvu normalno nakon gusla, bez obveze nadoknade molitvi tih 6 dana. Odgovarajućih 6 dana posta, međutim, nadoknadit će se nakon Ramazana.',
    practicalPoints: [
      'Sa sigurnošću prepoznati kraj menstruacije',
      'Obaviti gusl (veliko pranje) radi povratka ritualne čistoće',
      'Normalno nastaviti molitvu, bez odgode',
      'Znati da se molitve propuštene tokom menstruacije općenito ne nadoknađuju',
      'Zatražiti savjet kvalificiranog učenjaka za svaku posebnu situaciju ili trajnu sumnju',
    ],
    shareMessage: 'Gusl i povratak molitvi — AWA',
  },
  sl: {
    badge: 'VRNITEV K MOLITVI',
    title: 'Gusl in\nvrnitev k molitvi',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Splošni koraki za nadaljevanje molitve po menstruaciji, z mirom v duši.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Gusl, vrnitev ritualne čistosti',
      'Metoda, ki se lahko razlikuje glede na šolo',
      'Nadaljevanje molitve, brez nadomestitve zamujenih molitev',
      'Praktične točke, ki si jih je treba zapomniti',
    ],
    section1Body1: 'Gusl je veliko ritualno umivanje: sestoji iz umivanja celotnega telesa z namenom vrnitve v stanje ritualne čistosti (tahara), potrebno za opravljanje molitve in drugih bogoslužnih dejanj.',
    section1Body2: 'Pred opravljanjem gusla je pomembno biti prepričana, da se je menstruacija res končala: gusl mora slediti gotovosti, ne pa je prehitevati, da je krvavitev prenehala. Na splošno se ta konec prepozna po popolnem prenehanju krvavitve, opaženem dovolj dolgo, da se izključi vsak dvom — točka, ki je podrobno obravnavana v članku, posvečenem ritualni čistosti.',
    section1Body3: 'To očiščenje ti omogoča, da se ponovno povežeš s trenutki bogoslužja, suspendiranimi med menstruacijo.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Ni treba čutiti naglice: gusl se lahko opravi, takoj ko si pripravljena, brez pritiska, ko je konec menstruacije z gotovostjo potrjen.',
    section2Body: 'Gusl temelji na skupnih splošnih načelih: namenu očiščenja in popolnem umivanju telesa, vključno z lasmi in kožo. Natančne podrobnosti metode se lahko vendarle razlikujejo glede na pravno šolo, ki ji slediš.',
    alertTitle: 'Pomembna opomba',
    alertText: 'Nobena posebna metoda tukaj ni predstavljena kot edina veljavna: zanašanje na šolo ali mnenje, ki mu običajno slediš, ali iskanje nasveta kvalificiranega učenjaka ti bo pomagalo spoznati natančne podrobnosti, prilagojene tvoji situaciji.',
    section3Body1: 'Ko se menstruacija konča in se gusl opravi, se molitev običajno nadaljuje, brez posebnega odlašanja ali dodatnega pogoja.',
    section3Body2: 'Koristno je razlikovati dve situaciji, ki sledita različnim pravilom: molitve, neopravljene med menstruacijo, se na splošno ne nadomeščajo, medtem ko se dnevi posta, zamujeni med ramazanom, morajo nadomestiti pozneje (kada).',
    section3Body3: 'Na primer, ženska, ki je imela menstruacijo 6 dni, po guslu običajno nadaljuje molitev, brez obveze nadomestitve molitev teh 6 dni. Ustreznih 6 dni posta pa bo nadomeščenih po ramazanu.',
    practicalPoints: [
      'Z gotovostjo prepoznati konec menstruacije',
      'Opraviti gusl (veliko umivanje) za vrnitev ritualne čistosti',
      'Običajno nadaljevati molitev, brez odlašanja',
      'Vedeti, da se molitve, zamujene med menstruacijo, na splošno ne nadomeščajo',
      'Poiskati nasvet kvalificiranega učenjaka za vsako posebno situacijo ali trajen dvom',
    ],
    shareMessage: 'Gusl in vrnitev k molitvi — AWA',
  },
  ne: {
    badge: 'नमाजमा फर्कनु',
    title: 'गुस्ल र\nनमाजमा फर्कनु',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'महिनावारीपछि मनको शान्तिसँग नमाज फेरि सुरु गर्ने सामान्य चरणहरू।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'गुस्ल, अनुष्ठानिक पवित्रतामा फिर्ती',
      'विचारधाराअनुसार फरक हुन सक्ने विधि',
      'छुटेका नमाज कजा नगरी नमाज फेरि सुरु गर्ने',
      'सम्झनुपर्ने व्यावहारिक बुँदाहरू',
    ],
    section1Body1: 'गुस्ल ठूलो अनुष्ठानिक वुजु हो: यसमा नमाज र अन्य इबादतका कार्यहरू गर्न आवश्यक अनुष्ठानिक पवित्रता (तहारा) को अवस्थामा फर्कने नियतसहित सम्पूर्ण शरीर धुइन्छ।',
    section1Body2: 'गुस्ल गर्नुअघि, महिनावारी वास्तवमै सकिएको छ भन्ने निश्चित गर्नु महत्त्वपूर्ण छ: रक्तस्राव रोकिएको निश्चितता पछि गुस्ल आउनुपर्छ, अघि होइन। सामान्यतया, यो अन्त्य रक्तस्राव पूर्ण रूपमा रोकिएबाट चिनिन्छ, कुनै शङ्का हटाउन पर्याप्त समयसम्म अवलोकन गरिएको — अनुष्ठानिक पवित्रतालाई समर्पित लेखमा विस्तारमा समेटिएको बुँदा।',
    section1Body3: 'यही शुद्धीकरणले तपाईंलाई महिनावारीको समयमा स्थगित भएका इबादतका क्षणहरूसँग फेरि जोडिन दिन्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'हतार महसुस गर्नु पर्दैन: महिनावारीको अन्त्य निश्चितताका साथ पुष्टि भएपछि, तपाईं तयार हुनेबित्तिकै, कुनै दबाबबिना गुस्ल गर्न सकिन्छ।',
    section2Body: 'गुस्ल साझा सामान्य सिद्धान्तहरूमा आधारित छ: आफूलाई शुद्ध पार्ने नियत, र कपाल र छालासहित शरीरको पूर्ण धुलाइ। तथापि, विधिका सही विवरणहरू पछ्याइएको फिक्हको विचारधाराअनुसार फरक हुन सक्छन्।',
    alertTitle: 'महत्त्वपूर्ण टिप्पणी',
    alertText: 'यहाँ कुनै विशेष विधिलाई एकमात्र मान्य रूपमा प्रस्तुत गरिएको छैन: तपाईंले सामान्यतया पछ्याउने विचारधारा वा रायलाई हेर्नु, वा योग्य विद्वानसँग सल्लाह लिनुले तपाईंको अवस्थाअनुकूल सही विवरणहरू सिक्न मद्दत गर्नेछ।',
    section3Body1: 'महिनावारी सकिएर गुस्ल गरिसकेपछि, कुनै विशेष ढिलाइ वा अतिरिक्त सर्तबिना नमाज सामान्य रूपमा फेरि सुरु हुन्छ।',
    section3Body2: 'फरक नियम पछ्याउने दुई अवस्थाबीच भिन्नता छुट्ट्याउनु उपयोगी हुन्छ: महिनावारीको समयमा नपढिएका नमाजहरू सामान्यतया कजा गरिँदैनन्, जबकि रमजानमा छुटेका रोजाका दिनहरू पछि कजा गर्नुपर्छ (कजा)।',
    section3Body3: 'उदाहरणका लागि, 6 दिन महिनावारी भएकी महिलाले गुस्लपछि ती 6 दिनका नमाजहरू कजा गर्नुपर्ने आवश्यकताबिना नमाज सामान्य रूपमा फेरि सुरु गर्छिन्। तथापि, सम्बन्धित 6 दिनका रोजा रमजानपछि कजा गरिनेछन्।',
    practicalPoints: [
      'महिनावारीको अन्त्य निश्चितताका साथ चिन्ने',
      'अनुष्ठानिक पवित्रतामा फर्कन गुस्ल (ठूलो वुजु) गर्ने',
      'ढिलाइबिना नमाज सामान्य रूपमा फेरि सुरु गर्ने',
      'महिनावारीमा छुटेका नमाजहरू सामान्यतया कजा गरिँदैनन् भन्ने जान्ने',
      'कुनै विशेष अवस्था वा लगातार शङ्काका लागि योग्य विद्वानसँग सल्लाह लिने',
    ],
    shareMessage: 'गुस्ल र नमाजमा फर्कनु — AWA',
  },
  si: {
    badge: 'සලාත් වෙත නැවත පැමිණීම',
    title: 'ගුස්ල් සහ\nසලාත් වෙත නැවත පැමිණීම',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔසප්වලින් පසු සන්සුන් සිතින් සලාත් නැවත ආරම්භ කිරීමේ සාමාන්‍ය පියවර.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ගුස්ල්, ආචාරික පාරිශුද්ධ බවට නැවත පැමිණීම',
      'ධාරාව අනුව වෙනස් විය හැකි ක්‍රමයක්',
      'මග හැරුණු සලාත් පිරිමැසීමකින් තොරව, සලාත් නැවත ආරම්භ කිරීම',
      'මතක තබාගත යුතු ප්‍රායෝගික කරුණු',
    ],
    section1Body1: 'ගුස්ල් යනු ප්‍රධාන ආචාරික වුළූවකි: එය සලාත් සහ වෙනත් නමස්කාර ක්‍රියා ඉටු කිරීමට අවශ්‍ය ආචාරික පාරිශුද්ධ තත්ත්වයට (තහාරා) නැවත පැමිණීමේ අභිප්‍රායෙන් මුළු ශරීරයම සේදීමෙන් සමන්විත වේ.',
    section1Body2: 'ගුස්ල් ඉටු කිරීමට පෙර, ඔසප් සැබවින්ම අවසන් වී ඇති බවට සහතික වීම වැදගත්: ගුස්ල් ලේ ගැලීම නතර වී ඇති බව පිළිබඳ සහතිකයට පසුව විය යුතුයි, පෙර නොවේ. සාමාන්‍යයෙන් කිවහොත්, මෙම අවසානය හඳුනාගනු ලබන්නේ ඕනෑම සැකයක් බැහැර කිරීමට ප්‍රමාණවත් කාලයක් පුරා නිරීක්ෂණය කළ ලේ ගැලීම සම්පූර්ණයෙන් නතර වීමෙනි — ආචාරික පාරිශුද්ධ බවට කැපවූ ලිපියේ සවිස්තරව ආවරණය කළ කරුණකි.',
    section1Body3: 'මෙම පිරිසිදු කිරීම ඔසප් කාලයේදී අත්හිටවූ නමස්කාර මොහොතවලට නැවත සම්බන්ධ වීමට ඔබට ඉඩ සලසයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ඉක්මන් වීමට අවශ්‍ය නැත: ඔසප්වල අවසානය නිසැකව තහවුරු කළ පසු, ඔබ සූදානම් වූ විගස, පීඩනයකින් තොරව ගුස්ල් ඉටු කළ හැක.',
    section2Body: 'ගුස්ල් පදනම් වන්නේ බෙදාගත් සාමාන්‍ය මූලධර්ම මතය: පිරිසිදු වීමේ අභිප්‍රාය සහ කෙස් සහ සම ඇතුළුව ශරීරය සම්පූර්ණයෙන් සේදීම. කෙසේ වෙතත්, ක්‍රමයේ නිශ්චිත විස්තර අනුගමනය කරන නීති චින්තන ධාරාව අනුව වෙනස් විය හැක.',
    alertTitle: 'වැදගත් සටහන',
    alertText: 'මෙහි කිසිදු විශේෂ ක්‍රමයක් එකම වලංගු එක ලෙස ඉදිරිපත් නොකෙරේ: ඔබ සාමාන්‍යයෙන් අනුගමනය කරන ධාරාවට හෝ මතයට යොමු වීම, හෝ සුදුසුකම් ලත් විද්වතෙකුගෙන් උපදෙස් ඉල්ලීම, ඔබේ තත්ත්වයට ගැළපෙන නිශ්චිත විස්තර ඉගෙන ගැනීමට ඔබට උපකාරී වනු ඇත.',
    section3Body1: 'ඔසප් අවසන් වී ගුස්ල් ඉටු කළ පසු, සලාත් සාමාන්‍ය ලෙස නැවත ආරම්භ වේ, කිසිදු විශේෂ ප්‍රමාදයක් හෝ අමතර කොන්දේසියක් නොමැතිව.',
    section3Body2: 'වෙනස් රීති අනුගමනය කරන තත්ත්වයන් දෙකක් වෙන්කර හඳුනාගැනීම ප්‍රයෝජනවත්: ඔසප් කාලයේදී ඉටු නොකළ සලාත් සාමාන්‍යයෙන් පිරිමැසෙන්නේ නැති අතර, රමළාන් කාලයේ මග හැරුණු උපවාස දින පසුව පිරිමැසිය යුතුයි (කදා).',
    section3Body3: 'උදාහරණයක් ලෙස, දින 6ක් ඔසප් වූ කාන්තාවක් ගුස්ල් පසු සලාත් සාමාන්‍ය ලෙස නැවත ආරම්භ කරන අතර, එම දින 6හි සලාත් පිරිමැසීමට අවශ්‍ය නැත. කෙසේ වෙතත්, අනුරූප උපවාස දින 6 රමළාන් පසු පිරිමැසෙනු ඇත.',
    practicalPoints: [
      'ඔසප්වල අවසානය නිසැකව හඳුනාගැනීම',
      'ආචාරික පාරිශුද්ධ බවට නැවත පැමිණීමට ගුස්ල් (ප්‍රධාන වුළූව) ඉටු කිරීම',
      'ප්‍රමාදයකින් තොරව, සලාත් සාමාන්‍ය ලෙස නැවත ආරම්භ කිරීම',
      'ඔසප් කාලයේදී මග හැරුණු සලාත් සාමාන්‍යයෙන් පිරිමැසෙන්නේ නැති බව දැනගැනීම',
      'ඕනෑම විශේෂ තත්ත්වයක් හෝ දිගටම පවතින සැකයක් සඳහා සුදුසුකම් ලත් විද්වතෙකුගෙන් උපදෙස් ඉල්ලීම',
    ],
    shareMessage: 'ගුස්ල් සහ සලාත් වෙත නැවත පැමිණීම — AWA',
  },
  th: {
    badge: 'การกลับมาละหมาด',
    title: 'ฆุสล์และ\nการกลับมาละหมาด',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ขั้นตอนทั่วไปในการกลับมาละหมาดหลังมีประจำเดือน อย่างสบายใจ',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ฆุสล์ การกลับสู่ความสะอาดตามพิธีกรรม',
      'วิธีที่อาจต่างกันตามสำนัก',
      'กลับมาละหมาด โดยไม่ชดเชยการละหมาดที่พลาด',
      'ประเด็นเชิงปฏิบัติที่ควรจำ',
    ],
    section1Body1: 'ฆุสล์คือการอาบน้ำชำระตามพิธีกรรมครั้งใหญ่: คือการล้างทั้งร่างกายด้วยเจตนาเพื่อกลับสู่สภาวะความสะอาดตามพิธีกรรม (ฏอฮาเราะฮ์) ซึ่งจำเป็นสำหรับการละหมาดและศาสนกิจอื่น',
    section1Body2: 'ก่อนทำฆุสล์ สิ่งสำคัญคือต้องแน่ใจว่าประจำเดือนสิ้นสุดจริง ๆ: ฆุสล์ควรตามหลัง ไม่ใช่นำหน้า ความแน่ใจว่าเลือดหยุดแล้ว โดยทั่วไปการสิ้นสุดนี้รับรู้ได้จากการที่เลือดหยุดโดยสิ้นเชิง สังเกตเป็นเวลาพอที่จะตัดความสงสัยใด ๆ — ประเด็นที่อธิบายโดยละเอียดในบทความเรื่องความสะอาดตามพิธีกรรม',
    section1Body3: 'การชำระล้างนี้คือสิ่งที่ทำให้คุณกลับมาเชื่อมต่อกับช่วงเวลาของศาสนกิจที่ถูกระงับระหว่างมีประจำเดือน',
    tip1Title: 'ควรรู้',
    tip1Text: 'ไม่จำเป็นต้องรู้สึกถูกเร่ง: ทำฆุสล์ได้ทันทีที่คุณพร้อม โดยไม่กดดัน เมื่อยืนยันการสิ้นสุดของประจำเดือนอย่างแน่ใจแล้ว',
    section2Body: 'ฆุสล์อิงหลักการทั่วไปที่ใช้ร่วมกัน: เจตนาที่จะชำระตน และการล้างร่างกายให้ทั่ว รวมถึงเส้นผมและผิวหนัง อย่างไรก็ตาม รายละเอียดที่แน่ชัดของวิธีอาจต่างกันตามสำนักนิติศาสตร์ที่ปฏิบัติตาม',
    alertTitle: 'หมายเหตุสำคัญ',
    alertText: 'ที่นี่ไม่ได้นำเสนอวิธีใดวิธีหนึ่งเป็นวิธีเดียวที่ถูกต้อง: การอ้างอิงสำนักหรือความเห็นที่คุณปฏิบัติตามตามปกติ หรือการขอคำแนะนำจากผู้รู้ที่มีคุณวุฒิ จะช่วยให้คุณเรียนรู้รายละเอียดที่แน่ชัดที่เหมาะกับสถานการณ์ของคุณ',
    section3Body1: 'เมื่อประจำเดือนสิ้นสุดและทำฆุสล์แล้ว การละหมาดกลับมาตามปกติ โดยไม่มีความล่าช้าหรือเงื่อนไขเพิ่มเติมเป็นพิเศษ',
    section3Body2: 'ควรแยกสองสถานการณ์ที่เป็นไปตามกฎต่างกัน: การละหมาดที่ไม่ได้ทำระหว่างมีประจำเดือนโดยทั่วไปไม่ต้องชดเชย ขณะที่วันถือศีลอดที่พลาดในเดือนรอมฎอนต้องชดเชยภายหลัง (กอฎาอ์)',
    section3Body3: 'ตัวอย่างเช่น สตรีที่มีประจำเดือน 6 วันกลับมาละหมาดตามปกติหลังฆุสล์ โดยไม่ต้องชดเชยการละหมาดของ 6 วันนั้น แต่ 6 วันถือศีลอดที่เกี่ยวข้องจะชดเชยหลังรอมฎอน',
    practicalPoints: [
      'รับรู้การสิ้นสุดของประจำเดือนอย่างแน่ใจ',
      'ทำฆุสล์ (การอาบน้ำชำระใหญ่) เพื่อกลับสู่ความสะอาดตามพิธีกรรม',
      'กลับมาละหมาดตามปกติ โดยไม่ล่าช้า',
      'รู้ว่าการละหมาดที่พลาดระหว่างมีประจำเดือนโดยทั่วไปไม่ต้องชดเชย',
      'ขอคำแนะนำจากผู้รู้ที่มีคุณวุฒิสำหรับสถานการณ์เฉพาะใด ๆ หรือความสงสัยที่ต่อเนื่อง',
    ],
    shareMessage: 'ฆุสล์และการกลับมาละหมาด — AWA',
  },
  vi: {
    badge: 'TRỞ LẠI CẦU NGUYỆN',
    title: 'Ghusl và việc\ntrở lại cầu nguyện',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Các bước chung để tiếp tục cầu nguyện sau kỳ kinh một cách yên tâm.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Ghusl, trở lại sự thanh sạch nghi lễ',
      'Một phương pháp có thể khác nhau tùy trường phái',
      'Tiếp tục cầu nguyện, mà không bù những buổi đã bỏ lỡ',
      'Những điểm thực tế cần nhớ',
    ],
    section1Body1: 'Ghusl là nghi thức tắm gội lớn: nó bao gồm việc rửa toàn thân với ý định trở lại trạng thái thanh sạch nghi lễ (tahara), cần thiết để thực hiện cầu nguyện và các hành vi thờ phượng khác.',
    section1Body2: 'Trước khi thực hiện ghusl, điều quan trọng là phải chắc chắn rằng kỳ kinh thực sự đã kết thúc: ghusl nên đến sau, không phải trước, sự chắc chắn rằng việc ra máu đã dừng. Nói chung, sự kết thúc này được nhận biết khi việc ra máu dừng hoàn toàn, được quan sát trong một khoảng thời gian đủ để loại trừ mọi nghi ngờ — một điểm được trình bày chi tiết trong bài viết dành riêng cho sự thanh sạch nghi lễ.',
    section1Body3: 'Sự thanh tẩy này là điều cho phép bạn kết nối lại với những khoảnh khắc thờ phượng đã bị tạm ngưng trong kỳ kinh.',
    tip1Title: 'Nên biết',
    tip1Text: 'Không cần cảm thấy bị thúc ép: ghusl có thể được thực hiện ngay khi bạn sẵn sàng, không áp lực, sau khi sự kết thúc của kỳ kinh đã được xác nhận chắc chắn.',
    section2Body: 'Ghusl dựa trên các nguyên tắc chung được chia sẻ: ý định thanh tẩy bản thân và việc rửa toàn bộ cơ thể, bao gồm cả tóc và da. Tuy nhiên, các chi tiết cụ thể của phương pháp có thể khác nhau tùy theo trường phái luật học được theo.',
    alertTitle: 'Lưu ý quan trọng',
    alertText: 'Không có phương pháp cụ thể nào được trình bày ở đây là cách duy nhất hợp lệ: tham khảo trường phái hoặc ý kiến bạn thường theo, hoặc tìm lời khuyên từ một học giả có thẩm quyền, sẽ giúp bạn biết các chi tiết cụ thể phù hợp với tình huống của mình.',
    section3Body1: 'Khi kỳ kinh đã kết thúc và đã thực hiện ghusl, việc cầu nguyện tiếp tục bình thường, không có sự chậm trễ hay điều kiện bổ sung đặc biệt nào.',
    section3Body2: 'Sẽ hữu ích khi phân biệt hai tình huống theo những quy tắc khác nhau: những buổi cầu nguyện không thực hiện trong kỳ kinh nhìn chung không được bù lại, trong khi những ngày nhịn ăn bị bỏ lỡ trong tháng Ramadan phải được bù lại sau (qadaa).',
    section3Body3: 'Ví dụ, một người phụ nữ có kỳ kinh 6 ngày tiếp tục cầu nguyện bình thường sau ghusl, mà không phải bù những buổi cầu nguyện của 6 ngày đó. Tuy nhiên, 6 ngày nhịn ăn tương ứng sẽ được bù lại sau Ramadan.',
    practicalPoints: [
      'Nhận biết sự kết thúc của kỳ kinh một cách chắc chắn',
      'Thực hiện ghusl (tắm gội nghi lễ lớn) để trở lại sự thanh sạch nghi lễ',
      'Tiếp tục cầu nguyện bình thường, không chậm trễ',
      'Biết rằng những buổi cầu nguyện bị bỏ lỡ trong kỳ kinh nhìn chung không được bù lại',
      'Tìm lời khuyên từ một học giả có thẩm quyền cho bất kỳ tình huống đặc biệt hay nghi ngờ kéo dài nào',
    ],
    shareMessage: 'Ghusl và việc trở lại cầu nguyện — AWA',
  },
  uz: {
    badge: 'NAMOZGA QAYTISH',
    title: 'Gʻusl va\nnamozga qaytish',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Hayzdan keyin namozni davom ettirishning umumiy bosqichlari, xotirjamlik bilan.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Gʻusl, ritual poklikka qaytish',
      'Maktabga qarab farq qilishi mumkin boʻlgan usul',
      'Oʻtkazib yuborilgan namozlarni qazo qilmasdan namozni davom ettirish',
      'Esda tutish kerak boʻlgan amaliy nuqtalar',
    ],
    section1Body1: 'Gʻusl — katta ritual tahorat: u namoz va boshqa ibodatlarni bajarish uchun zarur boʻlgan ritual poklik (tahorat) holatiga qaytish niyati bilan butun tanani yuvishdan iborat.',
    section1Body2: 'Gʻusl qilishdan oldin hayz haqiqatan tugaganiga ishonch hosil qilish muhim: gʻusl qon ketishi toʻxtaganiga ishonchdan keyin kelishi kerak, undan oldin emas. Umuman olganda, bu tugash qon ketishining toʻliq toʻxtashi bilan tan olinadi, bu har qanday shubhani istisno qilish uchun yetarli vaqt davomida kuzatiladi — bu ritual poklikka bagʻishlangan maqolada batafsil yoritilgan.',
    section1Body3: 'Aynan shu poklanish hayz paytida toʻxtatilgan ibodat lahzalariga qaytishga imkon beradi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Shoshilish shart emas: hayz tugaganiga aniq ishonch hosil qilingandan keyin, tayyor boʻlganingizda, bosimsiz gʻusl qilish mumkin.',
    section2Body: 'Gʻusl umumiy tamoyillarga asoslanadi: poklanish niyati va tanani, jumladan sochni va terini, toʻliq yuvish. Biroq usulning aniq tafsilotlari amal qilinadigan fiqhiy maktabga qarab farq qilishi mumkin.',
    alertTitle: 'Muhim eslatma',
    alertText: 'Bu yerda hech bir usul yagona toʻgʻri deb taqdim etilmaydi: odatda amal qiladigan maktab yoki fikringizga murojaat qilish yoki malakali olimdan maslahat olish vaziyatingizga mos aniq tafsilotlarni oʻrganishga yordam beradi.',
    section3Body1: 'Hayz tugagandan va gʻusl qilingandan keyin namoz hech qanday alohida kechikish yoki qoʻshimcha shartsiz odatdagidek davom etadi.',
    section3Body2: 'Turli qoidalarga amal qiladigan ikki vaziyatni farqlash foydali: hayz paytida bajarilmagan namozlar odatda qazo qilinmaydi, Ramazonda oʻtkazib yuborilgan roʻza kunlari esa keyinroq qazo qilinishi kerak.',
    section3Body3: 'Masalan, 6 kun hayz koʻrgan ayol gʻusldan keyin namozni odatdagidek davom ettiradi, shu 6 kunning namozlarini qazo qilmaydi. Tegishli 6 kunlik roʻza esa Ramazondan keyin qazo qilinadi.',
    practicalPoints: [
      'Hayzning tugashini aniq ishonch bilan tanish',
      'Ritual poklikka qaytish uchun gʻusl (katta tahorat) qilish',
      'Namozni kechiktirmasdan odatdagidek davom ettirish',
      'Hayz paytida oʻtkazib yuborilgan namozlar odatda qazo qilinmasligini bilish',
      'Har qanday maxsus vaziyat yoki doimiy shubha uchun malakali olimdan maslahat olish',
    ],
    shareMessage: 'Gʻusl va namozga qaytish — AWA',
  },
  az: {
    badge: 'NAMAZA QAYIDIŞ',
    title: 'Qüsl və\nnamaza qayıdış',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Aybaşıdan sonra namazı bərpa etmək üçün ümumi addımlar — arxayınlıqla.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Qüsl, ritual paklığa qayıdış',
      'Məktəbə görə dəyişə bilən üsul',
      'Buraxılmış namazları qəza etmədən namazı bərpa etmək',
      'Yadda saxlamalı praktik məqamlar',
    ],
    section1Body1: 'Qüsl böyük ritual dəstəmazdır: o, namaz və digər ibadət aktlarını yerinə yetirmək üçün zəruri olan ritual paklıq (təharət) vəziyyətinə qayıtmaq niyyəti ilə bütün bədənin yuyulmasından ibarətdir.',
    section1Body2: 'Qüsl etməzdən əvvəl aybaşının həqiqətən bitdiyinə əmin olmaq vacibdir: qüsl qanaxmanın dayandığına əminlikdən sonra gəlməli, ondan əvvəl olmamalıdır. Ümumiyyətlə, bu son hər hansı şübhəni istisna etmək üçün kifayət qədər müddət ərzində müşahidə olunan qanaxmanın tam dayanması ilə tanınır — ritual paklığa həsr olunmuş məqalədə ətraflı işıqlandırılan məqam.',
    section1Body3: 'Bu paklanma aybaşı zamanı dayandırılmış ibadət anları ilə yenidən əlaqə qurmağa imkan verən şeydir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Tələsmək lazım deyil: aybaşının sonu əminliklə təsdiqləndikdən sonra qüsl təzyiqsiz, hazır olan kimi edilə bilər.',
    section2Body: 'Qüsl ortaq ümumi prinsiplərə əsaslanır: özünü paklamaq niyyəti və saç və dəri də daxil olmaqla bədənin tam yuyulması. Lakin üsulun dəqiq təfərrüatları əməl edilən hüquq məktəbindən asılı olaraq dəyişə bilər.',
    alertTitle: 'Vacib qeyd',
    alertText: 'Burada heç bir xüsusi üsul yeganə etibarlı kimi təqdim edilmir: adətən əməl etdiyiniz məktəbə və ya fikrə müraciət etmək yaxud səlahiyyətli alimdən məsləhət almaq vəziyyətinizə uyğun dəqiq təfərrüatları öyrənməyə kömək edəcək.',
    section3Body1: 'Aybaşı bitdikdən və qüsl edildikdən sonra namaz heç bir xüsusi gecikmə və ya əlavə şərt olmadan normal bərpa olunur.',
    section3Body2: 'Fərqli qaydalara tabe olan iki vəziyyəti ayırd etmək faydalıdır: aybaşı zamanı qılınmayan namazlar adətən qəza edilmir, Ramazanda buraxılmış oruc günləri isə sonradan qəza edilməlidir.',
    section3Body3: 'Məsələn, 6 gün aybaşı olmuş qadın qüsldən sonra həmin 6 günün namazlarını qəza etmədən namazı normal bərpa edir. Müvafiq 6 oruc günü isə Ramazandan sonra qəza ediləcək.',
    practicalPoints: [
      'Aybaşının sonunu əminliklə tanımaq',
      'Ritual paklığa qayıtmaq üçün qüsl (böyük dəstəmaz) etmək',
      'Namazı gecikmədən normal bərpa etmək',
      'Aybaşı zamanı buraxılmış namazların adətən qəza edilmədiyini bilmək',
      'İstənilən xüsusi vəziyyət və ya davamlı şübhə üçün səlahiyyətli alimdən məsləhət almaq',
    ],
    shareMessage: 'Qüsl və namaza qayıdış — AWA',
  },
  ka: {
    badge: 'ლოცვაზე დაბრუნება',
    title: 'ღუსლი და\nლოცვაზე დაბრუნება',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ზოგადი ნაბიჯები მენსტრუაციის შემდეგ ლოცვის განსაახლებლად, სიმშვიდით.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ღუსლი, რიტუალურ სისუფთავეში დაბრუნება',
      'მეთოდი, რომელიც სკოლის მიხედვით შეიძლება განსხვავდებოდეს',
      'ლოცვის განახლება, გამოტოვებული ლოცვების ანაზღაურების გარეშე',
      'პრაქტიკული საკითხები დასამახსოვრებლად',
    ],
    section1Body1: 'ღუსლი დიდი რიტუალური აბდესტია: ის მოიცავს მთელი სხეულის დაბანას რიტუალურ სისუფთავეში (თაჰარა) დაბრუნების განზრახვით, რაც ლოცვისა და ღვთისმსახურების სხვა აქტების შესასრულებლად არის საჭირო.',
    section1Body2: 'ღუსლის შესრულებამდე მნიშვნელოვანია დარწმუნდეთ, რომ მენსტრუაცია ნამდვილად დასრულდა: ღუსლი უნდა მოჰყვეს და არა წინ უსწრებდეს იმის დარწმუნებას, რომ სისხლდენა შეწყდა. ზოგადად, ეს დასასრული სისხლდენის სრული შეწყვეტით ამოიცნობა, ეჭვის გამორიცხვისთვის საკმარის პერიოდში დაკვირვებული — საკითხი, რომელიც რიტუალურ სისუფთავისადმი მიძღვნილ სტატიაში დაწვრილებით არის განხილული.',
    section1Body3: 'სწორედ ეს განწმენდა გაძლევთ საშუალებას მენსტრუაციის დროს შეჩერებულ ღვთისმსახურების მომენტებს დაუბრუნდეთ.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'აჩქარება არ არის საჭირო: ღუსლი შეიძლება შესრულდეს როგორც კი მზად იქნებით, ზეწოლის გარეშე, მას შემდეგ რაც მენსტრუაციის დასრულება დანამდვილებით დადასტურდება.',
    section2Body: 'ღუსლი საერთო ზოგად პრინციპებს ეფუძნება: საკუთარი თავის განწმენდის განზრახვა და სხეულის სრული დაბანა, თმისა და კანის ჩათვლით. მეთოდის ზუსტი დეტალები, თუმცა, მიყოლილი სამართლებრივი სკოლის მიხედვით შეიძლება განსხვავდებოდეს.',
    alertTitle: 'მნიშვნელოვანი შენიშვნა',
    alertText: 'არცერთი კონკრეტული მეთოდი აქ ერთადერთ ვალიდურად არ არის წარმოდგენილი: იმ სკოლისადმი ან მოსაზრებისადმი მიმართვა, რომელსაც ჩვეულებრივ მისდევთ, ან კვალიფიციური მეცნიერის რჩევის ძიება დაგეხმარებათ თქვენს სიტუაციაზე მორგებული ზუსტი დეტალების შესწავლაში.',
    section3Body1: 'მას შემდეგ, რაც მენსტრუაცია დასრულდა და ღუსლი შესრულდა, ლოცვა ნორმალურად ახლდება, განსაკუთრებული დაგვიანებისა თუ დამატებითი პირობის გარეშე.',
    section3Body2: 'სასარგებლოა ორი სიტუაციის გარჩევა, რომლებიც განსხვავებულ წესებს მისდევს: მენსტრუაციის დროს შეუსრულებელი ლოცვები ზოგადად არ აინაზღაურება, ხოლო რამადანში გამოტოვებული მარხვის დღეები მოგვიანებით უნდა აინაზღაუროს (კადაა).',
    section3Body3: 'მაგალითად, ქალი, რომელსაც მენსტრუაცია 6 დღე ჰქონდა, ღუსლის შემდეგ ლოცვას ნორმალურად განაახლებს, იმ 6 დღის ლოცვების ანაზღაურების გარეშე. შესაბამისი 6 დღის მარხვა, თუმცა, რამადანის შემდეგ აინაზღაურება.',
    practicalPoints: [
      'მენსტრუაციის დასრულების დანამდვილებით ამოცნობა',
      'ღუსლის (დიდი აბდესტის) შესრულება რიტუალურ სისუფთავეში დასაბრუნებლად',
      'ლოცვის ნორმალურად განახლება, დაგვიანების გარეშე',
      'იმის ცოდნა, რომ მენსტრუაციის დროს გამოტოვებული ლოცვები ზოგადად არ აინაზღაურება',
      'ნებისმიერი განსაკუთრებული სიტუაციისა თუ გაგრძელებული ეჭვის შემთხვევაში კვალიფიციური მეცნიერის რჩევის ძიება',
    ],
    shareMessage: 'ღუსლი და ლოცვაზე დაბრუნება — AWA',
  },
  hy: {
    badge: 'ՎԵՐԱԴԱՐՁ ԱՂՈԹՔԻՆ',
    title: 'Ղուսլը և\nվերադարձը աղոթքին',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ընդհանուր քայլերը՝ դաշտանից հետո աղոթքը վերսկսելու համար՝ հանգիստ սրտով:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ղուսլ, վերադարձ ծիսական մաքրությանը',
      'Մեթոդ, որը կարող է տարբերվել դպրոցներով',
      'Աղոթքի վերսկսում՝ առանց բաց թողնվածները փոխհատուցելու',
      'Գործնական կետեր, որոնք պետք է հիշել',
    ],
    section1Body1: 'Ղուսլը մեծ ծիսական լվացում է. այն բաղկացած է ամբողջ մարմինը լվանալուց՝ ծիսական մաքրության վիճակին (թահարա) վերադառնալու մտադրությամբ, որն անհրաժեշտ է աղոթք և պաշտամունքի այլ գործողություններ կատարելու համար:',
    section1Body2: 'Ղուսլը կատարելուց առաջ կարևոր է համոզվել, որ դաշտանն իրոք ավարտվել է. ղուսլը պետք է հաջորդի, այլ ոչ թե նախորդի այն վստահությանը, որ արյունահոսությունը դադարել է: Ընդհանուր առմամբ, այս ավարտը ճանաչվում է արյունահոսության լրիվ դադարով՝ դիտարկված բավարար ժամանակահատվածի ընթացքում՝ ցանկացած կասկածը բացառելու համար. կետ, որն մանրամասն ընդգրկված է ծիսական մաքրությանը նվիրված հոդվածում:',
    section1Body3: 'Այս մաքրագործումն է, որ թույլ է տալիս վերակապվել դաշտանի ընթացքում կասեցված պաշտամունքի պահերի հետ:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Շտապելու կարիք չկա. ղուսլը կարելի է կատարել հենց պատրաստ լինեք՝ առանց ճնշման, երբ դաշտանի ավարտը հաստատված է վստահությամբ:',
    section2Body: 'Ղուսլը հիմնվում է ընդհանուր սկզբունքների վրա. մաքրվելու մտադրություն և մարմնի լիակատար լվացում, ներառյալ մազերը և մաշկը: Մեթոդի ճշգրիտ մանրամասները, սակայն, կարող են տարբերվել՝ կախված հետևվող իրավագիտական դպրոցից:',
    alertTitle: 'Կարևոր նշում',
    alertText: 'Այստեղ ոչ մի կոնկրետ մեթոդ չի ներկայացվում որպես միակ վավերը. ձեր սովորաբար հետևվող դպրոցին կամ կարծիքին դիմելը կամ որակավորված գիտնականից խորհուրդ հարցնելը կօգնի ձեզ սովորել ձեր իրավիճակին համապատասխան ճշգրիտ մանրամասները:',
    section3Body1: 'Երբ դաշտանն ավարտվել է և ղուսլը կատարվել է, աղոթքը նորմալ վերսկսվում է՝ առանց հատուկ ուշացման կամ լրացուցիչ պայմանի:',
    section3Body2: 'Օգտակար է տարբերակել երկու իրավիճակ, որոնք հետևում են տարբեր կանոնների. դաշտանի ընթացքում չկատարված աղոթքները սովորաբար չեն փոխհատուցվում, մինչդեռ Ռամադանի ընթացքում բաց թողնված պահքի օրերը պետք է փոխհատուցվեն ավելի ուշ (կադա):',
    section3Body3: 'Օրինակ՝ կինը, որի դաշտանը տևել է 6 օր, աղոթքը նորմալ վերսկսում է ղուսլից հետո՝ առանց այդ 6 օրվա աղոթքները փոխհատուցելու անհրաժեշտության: Պահքի համապատասխան 6 օրը, սակայն, կփոխհատուցվի Ռամադանից հետո:',
    practicalPoints: [
      'Վստահությամբ ճանաչել դաշտանի ավարտը',
      'Կատարել ղուսլը (մեծ աբդեստ)՝ ծիսական մաքրությանը վերադառնալու համար',
      'Աղոթքը նորմալ վերսկսել՝ առանց ուշացման',
      'Իմանալ, որ դաշտանի ընթացքում բաց թողնված աղոթքները սովորաբար չեն փոխհատուցվում',
      'Խորհուրդ հարցնել որակավորված գիտնականից ցանկացած հատուկ իրավիճակի կամ շարունակական կասկածի համար',
    ],
    shareMessage: 'Ղուսլը և վերադարձը աղոթքին — AWA',
  },
  tg: {
    badge: 'БОЗГАШТ БА НАМОЗ',
    title: 'Ғусл ва\nбозгашт ба намоз',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Қадамҳои умумӣ барои аз сар гирифтани намоз пас аз ҳайз, бо оромии хотир.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ғусл, бозгашт ба покии маросимӣ',
      'Усуле, ки вобаста ба мазҳаб метавонад гуногун бошад',
      'Аз сар гирифтани намоз, бе қазои намозҳои аз даст рафта',
      'Нуктаҳои амалӣ барои ба ёд мондан',
    ],
    section1Body1: 'Ғусл таҳорати калони маросимист: он иборат аз шустани тамоми бадан бо нияти бозгашт ба ҳолати покии маросимӣ (таҳорат) аст, ки барои иҷрои намоз ва амалҳои дигари ибодат зарур аст.',
    section1Body2: 'Пеш аз иҷрои ғусл муҳим аст, ки мутмаин шавед, ки ҳайз воқеан ба охир расидааст: ғусл бояд пас аз яқин шудан ба қатъи хунравӣ бошад, на пеш аз он. Умуман, ин анҷом бо қатъи комили хунравӣ, ки дар давоми муддати кофӣ барои истисно кардани ҳар гуна шубҳа мушоҳида шудааст, шинохта мешавад — нуктаи дар мақолаи махсус ба покии маросимӣ муфассал баррасишуда.',
    section1Body3: 'Ин покшавӣ он аст, ки ба шумо имкон медиҳад ба лаҳзаҳои ибодати ҳангоми ҳайз қатъшуда боз пайваст шавед.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Шитоб кардан лозим нест: ғусл метавонад ҳамин ки омода бошед, бидуни фишор иҷро шавад, пас аз он ки анҷоми ҳайз бо яқин тасдиқ шуд.',
    section2Body: 'Ғусл ба принсипҳои умумии муштарак такя мекунад: нияти покшавӣ ва шустани комили бадан, аз ҷумла мӯй ва пӯст. Бо вуҷуди ин, тафсилоти дақиқи усул вобаста ба мазҳаби фиқҳии пайравишаванда метавонад гуногун бошад.',
    alertTitle: 'Қайди муҳим',
    alertText: 'Дар ин ҷо ягон усули мушаххас ҳамчун ягона дуруст пешниҳод намешавад: муроҷиат ба мазҳаб ё назаре, ки одатан пайравӣ мекунед, ё пурсидани маслиҳат аз олими салоҳиятдор ба шумо кумак мекунад тафсилоти дақиқи мувофиқ ба вазъияти худро омӯзед.',
    section3Body1: 'Пас аз он ки ҳайз ба охир расид ва ғусл иҷро шуд, намоз ба таври муқаррарӣ, бе таъхири махсус ё шарти иловагӣ аз сар гирифта мешавад.',
    section3Body2: 'Муфид аст, ки ду вазъиятро фарқ кунед, ки қоидаҳои гуногун доранд: намозҳое, ки ҳангоми ҳайз иҷро нашудаанд, одатан қазо намешаванд, дар ҳоле ки рӯзҳои дар Рамазон аз даст рафта баъдтар бояд қазо карда шаванд (қазо).',
    section3Body3: 'Масалан, зане, ки 6 рӯз ҳайз дошт, пас аз ғусл намозро ба таври муқаррарӣ аз сар мегирад, бидуни он ки намозҳои он 6 рӯзро қазо кунад. 6 рӯзи рӯзаи мувофиқ бошад, пас аз Рамазон қазо карда мешавад.',
    practicalPoints: [
      'Бо яқин шинохтани анҷоми ҳайз',
      'Иҷрои ғусл (таҳорати калон) барои бозгашт ба покии маросимӣ',
      'Аз сар гирифтани намоз ба таври муқаррарӣ, бе таъхир',
      'Донистан, ки намозҳои ҳангоми ҳайз аз даст рафта одатан қазо намешаванд',
      'Пурсидани маслиҳат аз олими салоҳиятдор барои ҳар вазъияти махсус ё шубҳаи доимӣ',
    ],
    shareMessage: 'Ғусл ва бозгашт ба намоз — AWA',
  },
  ky: {
    badge: 'НАМАЗГА КАЙТУУ',
    title: 'Гусул жана\nнамазга кайтуу',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Етек киримден кийин намазды тынчтык менен улантуунун жалпы кадамдары.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Гусул, ибадаттык тазалыкка кайтуу',
      'Мектепке жараша айырмаланышы мүмкүн болгон ыкма',
      'Намазды улантуу, өткөрүлгөн намаздардын ордун толтурбай',
      'Эстен чыгарбоого тийиш болгон практикалык учурлар',
    ],
    section1Body1: 'Гусул — чоң ибадаттык даарат: ал намазды жана башка ибадаттарды аткаруу үчүн зарыл болгон ибадаттык тазалык абалына (тахара) кайтуу ниети менен бүт денени жуудан турат.',
    section1Body2: 'Гусул жасоодон мурун етек кирим чындап аяктаганына ишенүү маанилүү: гусул кан кетүү токтогонуна ишеним пайда болгондон кийин келиши керек, мурун эмес. Жалпысынан бул аякташ кан кетүүнүн толук токтошу менен таанылат, ар кандай күмөндү жокко чыгаруу үчүн жетиштүү убакыт бою байкалат — бул маселе ибадаттык тазалыкка арналган макалада кеңири каралган.',
    section1Body3: 'Бул тазалануу етек кирим учурунда токтотулган ибадат учурларына кайра кошулууга мүмкүндүк берет.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Шашуунун кереги жок: етек киримдин аякташы так ырасталгандан кийин, даяр болгондо, кысымсыз гусул жасаса болот.',
    section2Body: 'Гусул жалпы принциптерге негизделген: өзүн тазалоо ниети жана денени, анын ичинде чач менен терини толук жуу. Ыкманын так чоо-жайы ээрчилген фикх мектебине жараша айырмаланышы мүмкүн.',
    alertTitle: 'Маанилүү эскертүү',
    alertText: 'Бул жерде эч бир ыкма бирден-бир туура катары берилген эмес: адатта ээрчип жүргөн мектебиңизге же пикириңизге кайрылуу же квалификациялуу окумуштуудан кеңеш сурап көрүү абалыңызга ылайыктуу так чоо-жайды үйрөнүүгө жардам берет.',
    section3Body1: 'Етек кирим аяктап, гусул жасалгандан кийин, намаз өзгөчө кечиктирүүсүз же кошумча шартсыз кадимкидей уланат.',
    section3Body2: 'Ар башка эрежелерди ээрчиген эки абалды айырмалоо пайдалуу: етек кирим учурунда окулбаган намаздардын ордун жалпысынан толтурушпайт, ал эми Рамазанда өткөрүлгөн орозо күндөрүнүн ордун кийин толтуруу керек (казо).',
    section3Body3: 'Мисалы, етек кирими 6 күн болгон аял гусулдан кийин намазды кадимкидей улантат, ошол 6 күндүн намаздарынын ордун толтурбастан. Бирок тиешелүү 6 күндүк орозонун ордун Рамазандан кийин толтурат.',
    practicalPoints: [
      'Етек киримдин аякташын так таануу',
      'Ибадаттык тазалыкка кайтуу үчүн гусул (чоң даарат) жасоо',
      'Намазды кечиктирбестен кадимкидей улантуу',
      'Етек кирим учурунда өткөрүлгөн намаздардын ордун жалпысынан толтурбасын билүү',
      'Ар кандай өзгөчө абал же улана берген күмөн үчүн квалификациялуу окумуштуудан кеңеш сураш',
    ],
    shareMessage: 'Гусул жана намазга кайтуу — AWA',
  },
  tk: {
    badge: 'NAMAZA GAÝTMAK',
    title: 'Gusul we\nnamaza gaýtmak',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Aýbaşydan soň namazy asudalyk bilen täzeden başlamagyň umumy ädimleri.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Gusul, dini arassalyga gaýdyp gelmek',
      'Mekdebe görä tapawutlanyp biljek usul',
      'Namazy sypdyrylanlary dolman täzeden başlamak',
      'Ýatda saklamaly amaly nokatlar',
    ],
    section1Body1: 'Gusul uly dini täret: ol namaz we beýleki ybadatlary ýerine ýetirmek üçin zerur dini arassalyk (tahara) ýagdaýyna gaýdyp gelmek niýeti bilen bütin bedeni ýuwmakdan ybarat.',
    section1Body2: 'Gusul etmezden öň aýbaşynyň hakykatdan gutarandygyna göz ýetirmek möhüm: gusul gan akmanyň kesilendigine ynamdan soň gelmeli, öň däl. Umuman, bu ahyr ýeterlik wagt dowamynda synlanylan gan akmanyň doly kesilmegi bilen ykrar edilýär, islendik şübhäni aýyrmak üçin — bu nokat dini arassalyga bagyşlanan makalada jikme-jik ýaýbaňlandyrylýar.',
    section1Body3: 'Bu arassalanmak aýbaşy wagtynda togtadylan ybadat pursatlaryna täzeden birleşmäge mümkinçilik berýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Howlukmak hökman däl: gusul aýbaşynyň gutarandygy ynam bilen tassyklanandan soň, taýýar bolanyňyzda, basyşsyz ýerine ýetirilip bilner.',
    section2Body: 'Gusul umumy ýörelgelere esaslanýar: arassalanmak niýeti we saçy hem deri bilen birlikde bedeniň doly ýuwulmagy. Usulyň takyk jikme-jiklikleri eýerilýän hukuk mekdebine görä tapawutlanyp biler.',
    alertTitle: 'Möhüm bellik',
    alertText: 'Hiç bir aýratyn usul bu ýerde ýeke-täk dogry diýlip görkezilmeýär: adatça eýerýän mekdebiňize ýa-da pikiriňize ýüz tutmak ýa-da bilimli alymdan maslahat soramak ýagdaýyňyza laýyk takyk jikme-jiklikleri öwrenmäge kömek eder.',
    section3Body1: 'Aýbaşy gutarandan we gusul ýerine ýetirilenden soň, namaz hiç hili aýratyn gijikdirmesiz ýa-da goşmaça şertsiz adaty ýagdaýda täzeden başlaýar.',
    section3Body2: 'Dürli düzgünlere eýerýän iki ýagdaýy tapawutlandyrmak peýdaly: aýbaşy wagtynda ýerine ýetirilmedik namazlar adatça dolulmaýar, Remezanda sypdyrylan oraza günleri bolsa soňra (kazo) dolulmaly.',
    section3Body3: 'Meselem, 6 gün aýbaşy bolan aýal gusuldan soň şol 6 günüň namazlaryny dolman, namazy adaty ýagdaýda täzeden başlaýar. Degişli 6 günlük oraza bolsa Remezandan soň dolunar.',
    practicalPoints: [
      'Aýbaşynyň gutarandygyny ynam bilen tanamak',
      'Dini arassalyga gaýdyp gelmek üçin gusul (uly täret) ýerine ýetirmek',
      'Namazy gijikdirmän, adaty ýagdaýda täzeden başlamak',
      'Aýbaşy wagtynda sypdyrylan namazlaryň adatça dolulmaýandygyny bilmek',
      'Islendik aýratyn ýagdaý ýa-da dowamly şübhe üçin bilimli alymdan maslahat soramak',
    ],
    shareMessage: 'Gusul we namaza gaýtmak — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReturningToPrayerArticleScreen({
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
            {content.section1Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body3}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body3}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.practicalPoints.map(item => (
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
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
