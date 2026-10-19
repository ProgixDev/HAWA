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

const ID = 'returningtoprayer-le-ghusl-et-le-retour';

const HERO = require('../../assets/images/library/category-spiritual.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
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
} as const;

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
