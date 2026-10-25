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
  da: {
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
