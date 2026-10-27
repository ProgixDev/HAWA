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

const ID = 'menstruationpurity-statut-de-purete';

const HERO = require('../../assets/images/library/spm-water.png');

const ART = {
  process: require('../../assets/images/library/rules-process.png'),
  ghusl: require('../../assets/images/library/tip-water.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('MenstruationPurity', {
  fr: {
    badge: 'RÈGLES & PURETÉ',
    title: 'Statut de pureté :\nles bases',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comprendre le lien entre le cycle et l’état de pureté rituelle, pour aborder cette période avec plus de clarté.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre ce que signifie la pureté rituelle',
      'Règles et dispense d’adoration',
      'Après les règles : reconnaître le retour à la pureté',
      'Le ghusl : comprendre son rôle',
      'Que faire lorsqu’on n’est pas sûre ?',
      'À retenir',
    ],
    section1Body: 'Dans la tradition islamique, la pureté rituelle (tahara) désigne l’état requis pour accomplir certains actes d’adoration, comme la prière. Elle ne renvoie pas à une notion de propreté au sens courant, mais à un état spécifique reconnu par le fiqh, qui évolue selon les étapes du cycle féminin.',
    section2Body: 'Pendant les règles, la femme est dispensée de certains actes d’adoration, en particulier la prière et le jeûne du Ramadan, qui pourra être rattrapé plus tard. Cette dispense est reconnue comme une facilité, et non comme une sanction.',
    checkList1Title: 'Ce qui reste accessible pendant les règles',
    duringPeriod: [
      'Le dhikr (évocation de Dieu) et les invocations (du’a)',
      'L’écoute ou la lecture de contenus éducatifs et spirituels',
      'Le soutien à la pratique religieuse de ses proches',
      'La réflexion et l’apprentissage religieux',
    ],
    noteTitle: 'À noter',
    noteText: 'Certains détails (comme la lecture directe du Coran ou l’accès à la mosquée) peuvent varier selon les écoles juridiques ; mieux vaut se référer à l’avis suivi habituellement ou à un savant qualifié pour ces cas précis.',
    section3Body: 'La fin des règles marque le retour progressif vers l’état de pureté rituelle. Sur le plan physique, cela correspond à l’arrêt du saignement, un repère que différentes traditions savantes peuvent définir avec des nuances légèrement différentes.',
    visual1Title: 'Un processus physiologique',
    visual1Text: 'Comprendre les étapes du cycle aide à mieux repérer le moment où les règles se terminent réellement.',
    section3Body2: 'Une fois ce repère observé, le ghusl (grande ablution) permet de renouer avec la pureté rituelle et de reprendre les actes d’adoration suspendus.',
    section4Body: 'Le ghusl est une grande ablution rituelle qui consiste à laver l’intégralité du corps avec l’intention de se purifier. Il marque la fin de l’état de dispense et permet de reprendre la prière normalement, sans qu’il soit nécessaire de rattraper les prières manquées pendant les règles.',
    visual2Title: 'Un rituel de purification',
    visual2Text: 'Le déroulement précis du ghusl peut varier légèrement selon les écoles juridiques suivies.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Si tu ne connais pas les étapes précises suivies dans ton école, une personne de confiance ou un savant qualifié pourra te les expliquer clairement.',
    section5Body: 'Il est fréquent de ressentir un doute sur la fin réelle des règles, notamment lorsque le saignement diminue progressivement plutôt que de s’arrêter net.',
    checkList2Title: 'Quelques repères utiles',
    doubtMarkers: [
      'Observer l’absence totale de saignement, et non une simple diminution',
      'Laisser passer un temps suffisant avant de conclure à la fin des règles',
      'Se baser sur une observation claire plutôt que sur une simple impression',
      'Tenir compte de ton propre rythme habituel, qui peut varier d’un cycle à l’autre',
    ],
    alert2Title: 'Information importante',
    alert2Text: 'En cas de saignements prolongés, irréguliers, ou de doute persistant, ces situations méritent d’être évoquées avec un savant qualifié, qui pourra t’orienter selon ta situation personnelle. Ce contenu reste informatif et ne remplace pas un avis religieux individualisé.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Ces repères sont des rappels éducatifs généraux. Chaque situation peut avoir ses particularités : en cas de doute, le dialogue avec un savant ou une savante qualifiée reste la meilleure ressource pour une réponse adaptée.',
    shareMessage: 'Statut de pureté : les bases — AWA',
  },
  en: {
    badge: 'PERIOD & PURITY',
    title: 'Purity status:\nthe basics',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Understanding the link between the cycle and ritual purity status, to approach this time with more clarity.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding what ritual purity means',
      'Menstruation and exemption from worship',
      'After menstruation: recognizing the return to purity',
      'Ghusl: understanding its role',
      'What to do when you’re not sure?',
      'Key takeaways',
    ],
    section1Body: 'In Islamic tradition, ritual purity (tahara) refers to the state required to perform certain acts of worship, such as prayer. It does not refer to cleanliness in the everyday sense, but to a specific state recognized by fiqh, which changes according to the stages of the female cycle.',
    section2Body: 'During menstruation, a woman is exempted from certain acts of worship, in particular prayer and the Ramadan fast, which can be made up later. This exemption is recognized as a relief, not as a punishment.',
    checkList1Title: 'What remains accessible during menstruation',
    duringPeriod: [
      'Dhikr (remembrance of God) and supplications (du’a)',
      'Listening to or reading educational and spiritual content',
      'Supporting the religious practice of those close to you',
      'Religious reflection and learning',
    ],
    noteTitle: 'Please note',
    noteText: 'Some details (such as direct reading of the Quran or access to the mosque) may vary depending on the school of jurisprudence; it is best to refer to the opinion you usually follow or to a qualified scholar for these specific cases.',
    section3Body: 'The end of menstruation marks the gradual return to the state of ritual purity. Physically, this corresponds to the stopping of the bleeding, a marker that different scholarly traditions may define with slightly different nuances.',
    visual1Title: 'A physiological process',
    visual1Text: 'Understanding the stages of the cycle helps you better identify the moment when menstruation actually ends.',
    section3Body2: 'Once this marker has been observed, the ghusl (major ablution) allows one to return to ritual purity and resume the acts of worship that had been suspended.',
    section4Body: 'Ghusl is a major ritual ablution that involves washing the entire body with the intention of purifying oneself. It marks the end of the exemption and allows prayer to resume normally, without it being necessary to make up the prayers missed during menstruation.',
    visual2Title: 'A purification ritual',
    visual2Text: 'The precise way ghusl is carried out may vary slightly depending on the school of jurisprudence followed.',
    tip1Title: 'Good to know',
    tip1Text: 'If you don’t know the precise steps followed in your school, someone you trust or a qualified scholar will be able to explain them to you clearly.',
    section5Body: 'It is common to feel doubt about when menstruation has truly ended, especially when the bleeding decreases gradually rather than stopping abruptly.',
    checkList2Title: 'Some useful markers',
    doubtMarkers: [
      'Observe the total absence of bleeding, not just a decrease',
      'Allow enough time to pass before concluding that menstruation has ended',
      'Rely on a clear observation rather than a mere impression',
      'Take into account your own usual rhythm, which can vary from one cycle to another',
    ],
    alert2Title: 'Important information',
    alert2Text: 'In cases of prolonged or irregular bleeding, or persistent doubt, these situations deserve to be discussed with a qualified scholar, who can guide you according to your personal situation. This content remains informational and does not replace individualized religious guidance.',
    tip2Title: 'Good to know',
    tip2Text: 'These markers are general educational reminders. Each situation can have its own particularities: in case of doubt, dialogue with a qualified scholar remains the best resource for an answer suited to your situation.',
    shareMessage: 'Purity status: the basics — AWA',
  },
  es: {
    badge: 'MENSTRUACIÓN Y PUREZA',
    title: 'Estatus de pureza:\nlo esencial',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Comprender la relación entre el ciclo y el estado de pureza ritual, para vivir este periodo con más claridad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Comprender qué significa la pureza ritual',
      'Menstruación y dispensa de adoración',
      'Después de la menstruación: reconocer el regreso a la pureza',
      'El gusl: comprender su función',
      '¿Qué hacer cuando no se está segura?',
      'Para recordar',
    ],
    section1Body: 'En la tradición islámica, la pureza ritual (tahara) designa el estado necesario para realizar ciertos actos de adoración, como la oración. No se refiere a una noción de limpieza en el sentido habitual, sino a un estado específico reconocido por el fiqh, que cambia según las etapas del ciclo femenino.',
    section2Body: 'Durante la menstruación, la mujer está dispensada de ciertos actos de adoración, en particular la oración y el ayuno del Ramadán, que podrá recuperarse más tarde. Esta dispensa se reconoce como una facilidad, y no como una sanción.',
    checkList1Title: 'Lo que sigue estando accesible durante la menstruación',
    duringPeriod: [
      'El dhikr (evocación de Dios) y las invocaciones (dua)',
      'Escuchar o leer contenidos educativos y espirituales',
      'Apoyar la práctica religiosa de las personas cercanas',
      'La reflexión y el aprendizaje religioso',
    ],
    noteTitle: 'Para tener en cuenta',
    noteText: 'Algunos detalles (como la lectura directa del Corán o el acceso a la mezquita) pueden variar según las escuelas jurídicas; es preferible referirse a la opinión que se suele seguir o a un erudito cualificado para estos casos concretos.',
    section3Body: 'El fin de la menstruación marca el regreso progresivo al estado de pureza ritual. En el plano físico, esto corresponde al cese del sangrado, una referencia que distintas tradiciones eruditas pueden definir con matices ligeramente diferentes.',
    visual1Title: 'Un proceso fisiológico',
    visual1Text: 'Comprender las etapas del ciclo ayuda a identificar mejor el momento en que la menstruación termina realmente.',
    section3Body2: 'Una vez observada esta referencia, el gusl (ablución mayor) permite retomar la pureza ritual y reanudar los actos de adoración suspendidos.',
    section4Body: 'El gusl es una ablución ritual mayor que consiste en lavar todo el cuerpo con la intención de purificarse. Marca el fin del estado de dispensa y permite reanudar la oración con normalidad, sin que sea necesario recuperar las oraciones no realizadas durante la menstruación.',
    visual2Title: 'Un ritual de purificación',
    visual2Text: 'El desarrollo preciso del gusl puede variar ligeramente según las escuelas jurídicas seguidas.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Si no conoces los pasos exactos que se siguen en tu escuela, una persona de confianza o un erudito cualificado podrá explicártelos con claridad.',
    section5Body: 'Es frecuente sentir dudas sobre el fin real de la menstruación, sobre todo cuando el sangrado disminuye progresivamente en lugar de detenerse de golpe.',
    checkList2Title: 'Algunas referencias útiles',
    doubtMarkers: [
      'Observar la ausencia total de sangrado, y no una simple disminución',
      'Dejar pasar un tiempo suficiente antes de concluir que la menstruación ha terminado',
      'Basarte en una observación clara en lugar de en una simple impresión',
      'Tener en cuenta tu propio ritmo habitual, que puede variar de un ciclo a otro',
    ],
    alert2Title: 'Información importante',
    alert2Text: 'En caso de sangrados prolongados, irregulares o de duda persistente, estas situaciones merecen comentarse con un erudito cualificado, que podrá orientarte según tu situación personal. Este contenido sigue siendo informativo y no sustituye un consejo religioso individualizado.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'Estas referencias son recordatorios educativos generales. Cada situación puede tener sus particularidades: en caso de duda, el diálogo con un erudito o una erudita cualificada sigue siendo el mejor recurso para obtener una respuesta adaptada.',
    shareMessage: 'Estatus de pureza: lo esencial — AWA',
  },
  it: {
    badge: 'MESTRUAZIONI E PUREZZA',
    title: 'Stato di purezza:\nle basi',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Capire il legame tra il ciclo e lo stato di purezza rituale, per affrontare questo momento con più chiarezza.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire cosa significa purezza rituale',
      'Mestruazioni ed esenzione dal culto',
      'Dopo le mestruazioni: riconoscere il ritorno alla purezza',
      'Il ghusl: capirne il ruolo',
      'Cosa fare quando non sei sicura?',
      'Punti chiave da ricordare',
    ],
    section1Body: 'Nella tradizione islamica, la purezza rituale (tahara) indica lo stato richiesto per compiere determinati atti di culto, come la preghiera. Non si riferisce alla pulizia nel senso quotidiano, ma a uno stato specifico riconosciuto dal fiqh, che cambia a seconda delle fasi del ciclo femminile.',
    section2Body: 'Durante le mestruazioni, la donna è esentata da alcuni atti di culto, in particolare dalla preghiera e dal digiuno di Ramadan, che possono essere recuperati in seguito. Questa esenzione è riconosciuta come un’agevolazione, non come una punizione.',
    checkList1Title: 'Cosa resta accessibile durante le mestruazioni',
    duringPeriod: [
      'Il dhikr (ricordo di Dio) e le suppliche (du’a)',
      'Ascoltare o leggere contenuti educativi e spirituali',
      'Sostenere la pratica religiosa delle persone a te vicine',
      'Riflessione e apprendimento religioso',
    ],
    noteTitle: 'Attenzione',
    noteText: 'Alcuni dettagli (come la lettura diretta del Corano o l’accesso alla moschea) possono variare a seconda della scuola giuridica; per questi casi specifici è preferibile fare riferimento al parere che segui abitualmente o a uno studioso qualificato.',
    section3Body: 'La fine delle mestruazioni segna il graduale ritorno allo stato di purezza rituale. Dal punto di vista fisico, corrisponde alla cessazione del sanguinamento, un riferimento che le diverse tradizioni di studio possono definire con sfumature leggermente diverse.',
    visual1Title: 'Un processo fisiologico',
    visual1Text: 'Capire le fasi del ciclo ti aiuta a individuare meglio il momento in cui le mestruazioni finiscono davvero.',
    section3Body2: 'Una volta osservato questo riferimento, il ghusl (abluzione maggiore) permette di tornare alla purezza rituale e di riprendere gli atti di culto che erano stati sospesi.',
    section4Body: 'Il ghusl è un’abluzione rituale maggiore che consiste nel lavare tutto il corpo con l’intenzione di purificarsi. Segna la fine dell’esenzione e permette di riprendere normalmente la preghiera, senza che sia necessario recuperare le preghiere saltate durante le mestruazioni.',
    visual2Title: 'Un rituale di purificazione',
    visual2Text: 'Il modo preciso in cui si compie il ghusl può variare leggermente a seconda della scuola giuridica seguita.',
    tip1Title: 'Bene a sapersi',
    tip1Text: 'Se non conosci i passaggi precisi seguiti nella tua scuola, una persona di cui ti fidi o uno studioso qualificato potrà spiegarteli chiaramente.',
    section5Body: 'È comune avere dubbi su quando le mestruazioni siano davvero finite, soprattutto quando il sanguinamento diminuisce gradualmente invece di fermarsi all’improvviso.',
    checkList2Title: 'Alcuni riferimenti utili',
    doubtMarkers: [
      'Osservare la totale assenza di sanguinamento, non solo una diminuzione',
      'Lasciar passare abbastanza tempo prima di concludere che le mestruazioni sono finite',
      'Basarsi su un’osservazione chiara piuttosto che su una semplice impressione',
      'Tenere conto del tuo ritmo abituale, che può variare da un ciclo all’altro',
    ],
    alert2Title: 'Informazione importante',
    alert2Text: 'In caso di sanguinamento prolungato o irregolare, o di dubbio persistente, queste situazioni meritano di essere discusse con uno studioso qualificato, che potrà guidarti in base alla tua situazione personale. Questo contenuto resta informativo e non sostituisce una guida religiosa individuale.',
    tip2Title: 'Bene a sapersi',
    tip2Text: 'Questi riferimenti sono promemoria educativi generali. Ogni situazione può avere le sue particolarità: in caso di dubbio, il confronto con uno studioso qualificato resta la risorsa migliore per una risposta adatta alla tua situazione.',
    shareMessage: 'Stato di purezza: le basi — AWA',
  },
  tr: {
    badge: 'ADET VE TEMİZLİK',
    title: 'Temizlik durumu:\ntemel bilgiler',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bu döneme daha net bir bakışla yaklaşmak için döngü ile manevi temizlik durumu arasındaki bağı anlamak.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak doğrulanmalıdır. AWA fetva veya kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Manevi temizliğin ne anlama geldiğini kavramak',
      'Adet ve ibadetten muafiyet',
      'Adetten sonra: temizliğe dönüşü fark etmek',
      'Gusül: rolünü anlamak',
      'Emin olmadığında ne yapmalı?',
      'Öne çıkan noktalar',
    ],
    section1Body: 'İslam geleneğinde manevi temizlik (taharet), namaz gibi bazı ibadetleri yerine getirmek için gereken durumu ifade eder. Günlük anlamdaki temizliği değil, fıkıhta tanınan ve kadın döngüsünün evrelerine göre değişen belirli bir durumu anlatır.',
    section2Body: 'Adet sırasında kadın, başta namaz ve Ramazan orucu olmak üzere bazı ibadetlerden muaf tutulur; oruç daha sonra kaza edilebilir. Bu muafiyet bir ceza olarak değil, bir kolaylık olarak kabul edilir.',
    checkList1Title: 'Adet sırasında yapılabilecekler',
    duringPeriod: [
      'Zikir (Allah’ı anma) ve dualar',
      'Eğitici ve manevi içerikleri dinlemek veya okumak',
      'Yakınlarının dinî pratiğine destek olmak',
      'Dinî düşünme ve öğrenme',
    ],
    noteTitle: 'Dikkat',
    noteText: 'Bazı ayrıntılar (Kur’an’ı doğrudan okumak veya camiye girmek gibi) mezhebe göre değişebilir; bu özel durumlar için genellikle uyduğun görüşe ya da yetkin bir âlime başvurmak en doğrusudur.',
    section3Body: 'Adetin bitişi, manevi temizlik durumuna kademeli dönüşü işaret eder. Fiziksel olarak bu, kanamanın durmasına karşılık gelir; farklı âlimlik gelenekleri bu işareti birbirinden biraz farklı nüanslarla tanımlayabilir.',
    visual1Title: 'Fizyolojik bir süreç',
    visual1Text: 'Döngünün evrelerini anlamak, adetin gerçekte ne zaman bittiğini daha iyi fark etmene yardımcı olur.',
    section3Body2: 'Bu işaret gözlemlendikten sonra gusül (büyük boy abdesti), manevi temizliğe dönmeyi ve askıya alınmış ibadetlere yeniden başlamayı sağlar.',
    section4Body: 'Gusül, temizlenme niyetiyle bütün bedenin yıkanmasını içeren büyük bir ritüel temizliktir. Muafiyetin sona erdiğini gösterir ve adet sırasında kılınamayan namazların kaza edilmesi gerekmeksizin namazın normal şekilde yeniden başlamasına imkân verir.',
    visual2Title: 'Bir arınma ritüeli',
    visual2Text: 'Gusülün tam olarak nasıl yapıldığı, uyulan mezhebe göre biraz farklılık gösterebilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Mezhebinde izlenen adımları tam olarak bilmiyorsan, güvendiğin biri ya da yetkin bir âlim bunları sana açıkça anlatabilir.',
    section5Body: 'Özellikle kanama aniden kesilmek yerine yavaş yavaş azaldığında, adetin gerçekten ne zaman bittiği konusunda tereddüt yaşamak yaygındır.',
    checkList2Title: 'Bazı yararlı işaretler',
    doubtMarkers: [
      'Yalnızca azalmaya değil, kanamanın tamamen kesilmesine bak',
      'Adetin bittiği sonucuna varmadan önce yeterli zaman tanı',
      'Sadece bir izlenime değil, net bir gözleme dayan',
      'Bir döngüden diğerine değişebilen kendi olağan ritmini dikkate al',
    ],
    alert2Title: 'Önemli bilgi',
    alert2Text: 'Uzayan veya düzensiz kanama durumlarında ya da süren tereddütte, bu durumları kişisel durumuna göre sana yol gösterebilecek yetkin bir âlimle konuşmak yerinde olur. Bu içerik bilgilendirme amaçlıdır ve kişiye özel dinî rehberliğin yerini tutmaz.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Bu işaretler genel ve eğitici hatırlatmalardır. Her durumun kendine özgü yönleri olabilir: tereddüt halinde yetkin bir âlimle görüşmek, durumuna uygun yanıt için en iyi kaynak olmaya devam eder.',
    shareMessage: 'Temizlik durumu: temel bilgiler — AWA',
  },
  ru: {
    badge: 'МЕСЯЧНЫЕ И ЧИСТОТА',
    title: 'Состояние чистоты:\nосновы',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Как понять связь между циклом и состоянием ритуальной чистоты, чтобы относиться к этому времени яснее.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у квалифицированных богословов. AWA не выносит фетв и не даёт индивидуальных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что означает ритуальная чистота',
      'Менструация и освобождение от поклонения',
      'После менструации: как понять возвращение к чистоте',
      'Гусль: его роль',
      'Что делать, если вы не уверены?',
      'Главное',
    ],
    section1Body: 'В исламской традиции ритуальная чистота (тахара) означает состояние, необходимое для совершения некоторых богослужебных действий, например намаза. Речь не о чистоте в бытовом смысле, а об особом состоянии, признаваемом фикхом, которое меняется в зависимости от этапов женского цикла.',
    section2Body: 'Во время менструации женщина освобождается от некоторых богослужебных действий, в частности от намаза и поста в Рамадан, который можно восполнить позже. Это освобождение признаётся облегчением, а не наказанием.',
    checkList1Title: 'Что остаётся доступным во время менструации',
    duringPeriod: [
      'Зикр (поминание Всевышнего) и мольбы (дуа)',
      'Прослушивание или чтение образовательных и духовных материалов',
      'Поддержка религиозной практики близких',
      'Размышления и религиозное обучение',
    ],
    noteTitle: 'Обратите внимание',
    noteText: 'Некоторые детали (например, чтение Корана напрямую или посещение мечети) могут различаться в зависимости от богословско-правовой школы; в таких частных случаях лучше обратиться к мнению, которого вы обычно придерживаетесь, или к квалифицированному богослову.',
    section3Body: 'Окончание менструации знаменует постепенное возвращение к состоянию ритуальной чистоты. С физической точки зрения это соответствует прекращению кровотечения — ориентиру, который разные богословские традиции могут определять с немного различающимися нюансами.',
    visual1Title: 'Физиологический процесс',
    visual1Text: 'Понимание этапов цикла помогает точнее определить момент, когда менструация действительно заканчивается.',
    section3Body2: 'После того как этот ориентир замечен, гусль (полное омовение) позволяет вернуться к ритуальной чистоте и возобновить приостановленные богослужебные действия.',
    section4Body: 'Гусль — это полное ритуальное омовение, при котором моется всё тело с намерением очищения. Оно знаменует окончание периода освобождения и позволяет нормально возобновить намаз, при этом пропущенные во время менструации намазы восполнять не требуется.',
    visual2Title: 'Ритуал очищения',
    visual2Text: 'Точный порядок совершения гусля может немного различаться в зависимости от богословско-правовой школы.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Если вы не знаете точных шагов, принятых в вашей школе, вам ясно объяснит их человек, которому вы доверяете, или квалифицированный богослов.',
    section5Body: 'Нередко возникают сомнения, действительно ли менструация закончилась, особенно когда кровотечение постепенно уменьшается, а не прекращается внезапно.',
    checkList2Title: 'Некоторые полезные ориентиры',
    doubtMarkers: [
      'Убедитесь в полном отсутствии кровотечения, а не просто в его уменьшении',
      'Дайте пройти достаточному времени, прежде чем заключить, что менструация закончилась',
      'Опирайтесь на ясное наблюдение, а не на простое впечатление',
      'Учитывайте свой обычный ритм, который может меняться от цикла к циклу',
    ],
    alert2Title: 'Важная информация',
    alert2Text: 'В случае длительных или нерегулярных кровотечений либо стойких сомнений такие ситуации стоит обсудить с квалифицированным богословом, который сможет подсказать вам с учётом вашей личной ситуации. Этот материал носит информационный характер и не заменяет индивидуального религиозного наставления.',
    tip2Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip2Text: 'Эти ориентиры — общие образовательные напоминания. У каждой ситуации могут быть свои особенности: при сомнениях беседа с квалифицированным богословом остаётся лучшим источником ответа, подходящего именно вам.',
    shareMessage: 'Состояние чистоты: основы — AWA',
  },
  de: {
    badge: 'PERIODE & REINHEIT',
    title: 'Rituelle Reinheit:\ndie Grundlagen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Den Zusammenhang zwischen Zyklus und ritueller Reinheit verstehen, um diese Zeit mit mehr Klarheit anzugehen.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt ist rein bildend. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA erteilt keine Fatwas oder persönlichen religiösen Urteile.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Verstehen, was rituelle Reinheit bedeutet',
      'Menstruation und Befreiung vom Gottesdienst',
      'Nach der Menstruation: die Rückkehr zur Reinheit erkennen',
      'Ghusl: seine Bedeutung verstehen',
      'Was tun, wenn du unsicher bist?',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'In der islamischen Tradition bezeichnet die rituelle Reinheit (Tahara) den Zustand, der für bestimmte gottesdienstliche Handlungen wie das Gebet erforderlich ist. Gemeint ist nicht Sauberkeit im alltäglichen Sinn, sondern ein bestimmter, im Fiqh anerkannter Zustand, der sich je nach den Phasen des weiblichen Zyklus ändert.',
    section2Body: 'Während der Menstruation ist eine Frau von bestimmten gottesdienstlichen Handlungen befreit, insbesondere vom Gebet und vom Fasten im Ramadan, das später nachgeholt werden kann. Diese Befreiung gilt als Erleichterung, nicht als Strafe.',
    checkList1Title: 'Was während der Menstruation weiterhin möglich bleibt',
    duringPeriod: [
      'Dhikr (Gottesgedenken) und Bittgebete (Du\'a)',
      'Bildende und spirituelle Inhalte anhören oder lesen',
      'Die religiöse Praxis deiner Angehörigen unterstützen',
      'Religiöse Reflexion und Lernen',
    ],
    noteTitle: 'Bitte beachten',
    noteText: 'Einige Einzelheiten (etwa das direkte Lesen des Korans oder der Zugang zur Moschee) können je nach Rechtsschule variieren; für diese besonderen Fälle orientierst du dich am besten an der Meinung, der du üblicherweise folgst, oder fragst eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten.',
    section3Body: 'Das Ende der Menstruation markiert die schrittweise Rückkehr in den Zustand ritueller Reinheit. Körperlich entspricht dies dem Aufhören der Blutung, einem Merkmal, das verschiedene Gelehrtentraditionen mit leicht unterschiedlichen Nuancen definieren können.',
    visual1Title: 'Ein physiologischer Vorgang',
    visual1Text: 'Wenn du die Phasen des Zyklus verstehst, kannst du den Zeitpunkt, an dem die Menstruation tatsächlich endet, besser erkennen.',
    section3Body2: 'Sobald dieses Merkmal festgestellt wurde, ermöglicht der Ghusl (die große rituelle Waschung) die Rückkehr zur rituellen Reinheit und die Wiederaufnahme der ausgesetzten gottesdienstlichen Handlungen.',
    section4Body: 'Der Ghusl ist eine große rituelle Waschung, bei der der ganze Körper mit der Absicht der Reinigung gewaschen wird. Er beendet die Befreiung und ermöglicht es, das Gebet wieder normal zu verrichten, ohne dass die während der Menstruation versäumten Gebete nachgeholt werden müssen.',
    visual2Title: 'Ein Reinigungsritual',
    visual2Text: 'Die genaue Durchführung des Ghusl kann je nach befolgter Rechtsschule leicht variieren.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Wenn du die genauen Schritte deiner Rechtsschule nicht kennst, kann dir eine Vertrauensperson oder eine qualifizierte Gelehrte bzw. ein qualifizierter Gelehrter sie klar erklären.',
    section5Body: 'Es ist normal, unsicher zu sein, wann die Menstruation wirklich zu Ende ist, besonders wenn die Blutung allmählich nachlässt, statt abrupt aufzuhören.',
    checkList2Title: 'Einige hilfreiche Anhaltspunkte',
    doubtMarkers: [
      'Beobachte, ob die Blutung vollständig aufgehört hat, nicht nur nachgelassen',
      'Lass ausreichend Zeit vergehen, bevor du davon ausgehst, dass die Menstruation beendet ist',
      'Verlass dich auf eine klare Beobachtung statt auf einen bloßen Eindruck',
      'Berücksichtige deinen eigenen üblichen Rhythmus, der von Zyklus zu Zyklus variieren kann',
    ],
    alert2Title: 'Wichtiger Hinweis',
    alert2Text: 'Bei lang anhaltenden oder unregelmäßigen Blutungen oder anhaltender Unsicherheit sollten solche Situationen mit einer qualifizierten Gelehrten oder einem qualifizierten Gelehrten besprochen werden, die oder der dich entsprechend deiner persönlichen Situation anleiten kann. Dieser Inhalt bleibt informativ und ersetzt keine individuelle religiöse Beratung.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Diese Anhaltspunkte sind allgemeine Erinnerungen zur Bildung. Jede Situation kann ihre Besonderheiten haben: Im Zweifelsfall bleibt das Gespräch mit einer qualifizierten Gelehrten oder einem qualifizierten Gelehrten die beste Quelle für eine Antwort, die zu deiner Situation passt.',
    shareMessage: 'Rituelle Reinheit: die Grundlagen — AWA',
  },
  zh: {
      badge: '月经与洁净',
      title: '洁净状态：\n基础知识',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '了解月经周期与仪式性洁净状态之间的关系，让你更清楚地面对这段时间。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容仅供科普。宗教方面的问题应由有资质的学者确认。AWA 不发布法特瓦，也不提供针对个人的宗教裁断。',
      contentsTitle: '本文内容',
      topics: [
        '了解仪式性洁净的含义',
        '月经与功修的豁免',
        '月经之后：如何认识洁净的恢复',
        '大净（Ghusl）：了解它的作用',
        '不确定时怎么办？',
        '要点回顾',
      ],
      section1Body: '在伊斯兰传统中，仪式性洁净（tahara）指进行某些功修（如礼拜）所需具备的状态。它并非日常意义上的清洁，而是教法所认可的一种特定状态，会随女性周期的不同阶段而变化。',
      section2Body: '月经期间，女性可以免除某些功修，尤其是礼拜和斋月的斋戒，其中斋戒可以在之后补做。这种豁免被视为一种宽容，而不是惩罚。',
      checkList1Title: '月经期间仍然可以做的事',
      duringPeriod: [
        '赞念（dhikr，即记念真主）与祈祷（du’a）',
        '聆听或阅读教育性和心灵类内容',
        '支持身边人的宗教实践',
        '宗教方面的思考与学习',
      ],
      noteTitle: '请注意',
      noteText: '有些细节（例如直接诵读《古兰经》或进入清真寺）可能因教法学派而异；遇到这些具体情况，最好参考你通常遵循的观点，或请教有资质的学者。',
      section3Body: '月经结束标志着逐渐恢复仪式性洁净状态。从身体层面看，这对应于出血停止，不同学术传统对这一标志的界定可能存在细微差别。',
      visual1Title: '一个生理过程',
      visual1Text: '了解周期的各个阶段，有助于你更好地辨别月经究竟何时结束。',
      section3Body2: '观察到这一标志之后，通过大净（ghusl，即全身大净）便可恢复仪式性洁净，并重新进行此前暂停的功修。',
      section4Body: '大净是一种全身性的仪式净浴，需带着净化自己的意念清洗全身。它标志着豁免的结束，使你可以正常恢复礼拜，而无需补做月经期间错过的礼拜。',
      visual2Title: '一种净化的仪式',
      visual2Text: '大净的具体做法可能因所遵循的教法学派而略有不同。',
      tip1Title: '小贴士',
      tip1Text: '如果你不清楚自己所遵循学派的具体步骤，可以请教你信任的人或有资质的学者，他们会为你清楚地讲解。',
      section5Body: '对于月经是否真正结束感到疑惑是很常见的，尤其是出血逐渐减少而不是突然停止的时候。',
      checkList2Title: '一些有用的参考标志',
      doubtMarkers: [
        '观察是否完全没有出血，而不只是出血减少',
        '在断定月经结束之前，留出足够的时间',
        '依据明确的观察，而不是单凭感觉',
        '考虑你自己通常的节奏，它在不同周期之间可能有所变化',
      ],
      alert2Title: '重要提示',
      alert2Text: '如果出血时间较长或不规律，或者疑虑一直存在，这些情况值得与有资质的学者讨论，他们可以根据你的个人情况给予指导。本内容仅供参考，不能替代针对个人的宗教指导。',
      tip2Title: '小贴士',
      tip2Text: '这些标志只是一般性的科普提示。每个人的情况可能各有特点：遇到疑问时，与有资质的学者交流始终是获得契合你情况的答案的最佳途径。',
      shareMessage: '洁净状态：基础知识 — AWA',
    },
  id: {
    badge: 'HAID & KESUCIAN',
    title: 'Status kesucian:\nhal-hal dasar',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Memahami kaitan antara siklus dan status kesucian ritual, agar kamu bisa menjalani masa ini dengan lebih jelas.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang kompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami arti kesucian ritual',
      'Haid dan keringanan dari ibadah',
      'Setelah haid: mengenali kembalinya kesucian',
      'Mandi wajib: memahami perannya',
      'Apa yang dilakukan saat tidak yakin?',
      'Poin-poin penting',
    ],
    section1Body: 'Dalam tradisi Islam, kesucian ritual (tahara) merujuk pada keadaan yang disyaratkan untuk melakukan ibadah tertentu, seperti salat. Kesucian ini bukan kebersihan dalam arti sehari-hari, melainkan keadaan khusus yang diakui oleh fikih, yang berubah sesuai tahapan siklus perempuan.',
    section2Body: 'Selama haid, perempuan mendapat keringanan dari beberapa ibadah, terutama salat dan puasa Ramadan, yang puasanya dapat diganti di kemudian hari. Keringanan ini diakui sebagai kemudahan, bukan hukuman.',
    checkList1Title: 'Yang tetap bisa dilakukan saat haid',
    duringPeriod: [
      'Zikir (mengingat Allah) dan doa',
      'Mendengarkan atau membaca konten edukatif dan spiritual',
      'Mendukung ibadah orang-orang terdekatmu',
      'Merenung dan belajar tentang agama',
    ],
    noteTitle: 'Harap diperhatikan',
    noteText: 'Beberapa rincian (seperti membaca Al-Qur\'an secara langsung atau memasuki masjid) bisa berbeda menurut mazhab fikih; sebaiknya rujuklah pendapat yang biasa kamu ikuti atau tanyakan kepada ulama yang kompeten untuk kasus-kasus khusus ini.',
    section3Body: 'Berakhirnya haid menandai kembalinya keadaan suci secara bertahap. Secara fisik, hal ini berarti berhentinya perdarahan, sebuah penanda yang bisa didefinisikan dengan nuansa yang sedikit berbeda oleh berbagai tradisi keulamaan.',
    visual1Title: 'Proses fisiologis',
    visual1Text: 'Memahami tahapan siklus membantumu mengenali dengan lebih baik saat haid benar-benar berakhir.',
    section3Body2: 'Setelah penanda ini teramati, mandi wajib (ghusl) memungkinkan seseorang kembali suci dan melanjutkan ibadah yang sempat ditangguhkan.',
    section4Body: 'Mandi wajib (ghusl) adalah mandi ritual besar yang dilakukan dengan membasuh seluruh tubuh disertai niat untuk bersuci. Mandi ini menandai berakhirnya keringanan dan memungkinkan salat dilakukan kembali seperti biasa, tanpa perlu mengganti salat yang terlewat selama haid.',
    visual2Title: 'Ritual penyucian',
    visual2Text: 'Tata cara mandi wajib yang tepat bisa sedikit berbeda menurut mazhab fikih yang diikuti.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Jika kamu belum tahu langkah-langkah yang tepat menurut mazhabmu, orang yang kamu percaya atau ulama yang kompeten dapat menjelaskannya dengan jelas kepadamu.',
    section5Body: 'Wajar jika kamu merasa ragu kapan haid benar-benar berakhir, terutama ketika perdarahan berkurang perlahan, bukan berhenti mendadak.',
    checkList2Title: 'Beberapa penanda yang berguna',
    doubtMarkers: [
      'Amati apakah perdarahan benar-benar tidak ada lagi, bukan hanya berkurang',
      'Beri waktu yang cukup berlalu sebelum menyimpulkan bahwa haid telah berakhir',
      'Andalkan pengamatan yang jelas, bukan sekadar kesan',
      'Perhatikan ritmemu sendiri yang biasa, yang bisa berbeda dari satu siklus ke siklus lain',
    ],
    alert2Title: 'Informasi penting',
    alert2Text: 'Dalam kasus perdarahan yang berkepanjangan atau tidak teratur, atau keraguan yang menetap, situasi tersebut sebaiknya dibicarakan dengan ulama yang kompeten, yang dapat membimbingmu sesuai situasi pribadimu. Konten ini tetap bersifat informatif dan tidak menggantikan bimbingan keagamaan yang individual.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Penanda ini adalah pengingat edukatif yang umum. Setiap situasi bisa memiliki kekhususannya sendiri: jika ragu, berdialog dengan ulama yang kompeten tetap menjadi sumber terbaik untuk jawaban yang sesuai dengan situasimu.',
    shareMessage: 'Status kesucian: hal-hal dasar — AWA',
  },
  hi: {
    badge: 'पीरियड और पाकी',
    title: 'पाकी की स्थिति:\nबुनियादी बातें',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया लेख',
    intro: 'चक्र और धार्मिक पाकी की स्थिति के बीच का संबंध समझना, ताकि आप इस समय को ज़्यादा स्पष्टता से जी सकें।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह लेख केवल जानकारी के लिए है। धार्मिक सवालों की पुष्टि योग्य उलमा से करवानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक निर्णय जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'धार्मिक पाकी का मतलब समझना',
      'मासिक धर्म और इबादत से छूट',
      'मासिक धर्म के बाद: पाकी की वापसी को पहचानना',
      'ग़ुस्ल: इसकी भूमिका समझना',
      'अगर आपको पक्का न पता हो तो क्या करें?',
      'मुख्य बातें',
    ],
    section1Body: 'इस्लामी परंपरा में धार्मिक पाकी (तहारत) उस स्थिति को कहते हैं जो नमाज़ जैसी कुछ इबादतों के लिए ज़रूरी है। इसका मतलब रोज़मर्रा की साफ़-सफ़ाई नहीं है, बल्कि फ़िक़्ह में मान्य एक ख़ास स्थिति है, जो महिला के चक्र के पड़ावों के अनुसार बदलती है।',
    section2Body: 'मासिक धर्म के दौरान महिला को कुछ इबादतों से छूट मिलती है, ख़ासकर नमाज़ और रमज़ान के रोज़े से, जिनमें से रोज़े की क़ज़ा बाद में रखी जा सकती है। इस छूट को एक राहत के रूप में माना गया है, सज़ा के रूप में नहीं।',
    checkList1Title: 'मासिक धर्म के दौरान क्या संभव रहता है',
    duringPeriod: [
      'ज़िक्र (अल्लाह की याद) और दुआएँ',
      'शैक्षिक और आध्यात्मिक सामग्री सुनना या पढ़ना',
      'अपने क़रीबी लोगों की धार्मिक इबादत में सहयोग देना',
      'धार्मिक चिंतन और सीखना',
    ],
    noteTitle: 'ध्यान दें',
    noteText: 'कुछ बातें (जैसे क़ुरआन को सीधे पढ़ना या मस्जिद में जाना) फ़िक़्ही मसलक के अनुसार अलग हो सकती हैं; ऐसे ख़ास मामलों में बेहतर है कि आप जिस राय का पालन करती हैं उसे देखें या किसी योग्य आलिम/आलिमा से पूछें।',
    section3Body: 'मासिक धर्म का अंत धार्मिक पाकी की स्थिति में धीरे-धीरे वापसी का संकेत है। शारीरिक रूप से यह रक्तस्राव के रुक जाने से जुड़ा है, एक ऐसा निशान जिसे अलग-अलग उलमाई परंपराएँ थोड़े अलग बारीक अंतर के साथ परिभाषित कर सकती हैं।',
    visual1Title: 'एक शारीरिक प्रक्रिया',
    visual1Text: 'चक्र के पड़ावों को समझने से आप उस पल को बेहतर पहचान पाती हैं जब मासिक धर्म सचमुच ख़त्म होता है।',
    section3Body2: 'जब यह निशान देख लिया जाए, तो ग़ुस्ल (पूरा स्नान) धार्मिक पाकी में लौटने और रुकी हुई इबादतें दोबारा शुरू करने का ज़रिया बनता है।',
    section4Body: 'ग़ुस्ल एक बड़ा धार्मिक स्नान है, जिसमें पाक होने की नीयत से पूरा शरीर धोया जाता है। यह छूट के अंत का संकेत है और नमाज़ को सामान्य रूप से दोबारा शुरू करने की इजाज़त देता है, और मासिक धर्म के दौरान छूटी नमाज़ों की क़ज़ा ज़रूरी नहीं होती।',
    visual2Title: 'पाक होने की एक रस्म',
    visual2Text: 'ग़ुस्ल करने का सटीक तरीका आप जिस फ़िक़्ही मसलक का पालन करती हैं, उसके अनुसार थोड़ा अलग हो सकता है।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'अगर आपको अपने मसलक में अपनाए जाने वाले सटीक चरण नहीं पता, तो आपका कोई भरोसेमंद व्यक्ति या कोई योग्य आलिम/आलिमा उन्हें आपको साफ़ तौर पर समझा सकती/सकता है।',
    section5Body: 'यह शक होना आम बात है कि मासिक धर्म सचमुच कब ख़त्म हुआ, ख़ासकर जब रक्तस्राव अचानक रुकने के बजाय धीरे-धीरे कम होता है।',
    checkList2Title: 'कुछ काम के संकेत',
    doubtMarkers: [
      'रक्तस्राव का पूरी तरह न होना देखें, सिर्फ़ उसका कम होना नहीं',
      'यह नतीजा निकालने से पहले कि मासिक धर्म ख़त्म हो गया है, पर्याप्त समय बीतने दें',
      'सिर्फ़ अंदाज़े के बजाय साफ़ अवलोकन पर भरोसा करें',
      'अपनी सामान्य लय को ध्यान में रखें, जो एक चक्र से दूसरे चक्र में बदल सकती है',
    ],
    alert2Title: 'ज़रूरी जानकारी',
    alert2Text: 'लंबे या अनियमित रक्तस्राव, या लगातार संदेह की स्थिति में, इन मामलों पर किसी योग्य आलिम/आलिमा से चर्चा करनी चाहिए, जो आपकी व्यक्तिगत स्थिति के अनुसार मार्गदर्शन कर सकती/सकता है। यह लेख केवल जानकारी के लिए है और व्यक्तिगत धार्मिक मार्गदर्शन की जगह नहीं लेता।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'ये संकेत सामान्य शैक्षिक याद-दिहानियाँ हैं। हर स्थिति की अपनी ख़ासियतें हो सकती हैं: संदेह की सूरत में, आपकी स्थिति के अनुसार जवाब पाने के लिए किसी योग्य आलिम/आलिमा से बात करना सबसे अच्छा सहारा है।',
    shareMessage: 'पाकी की स्थिति: बुनियादी बातें — AWA',
  },
  sq: {
    badge: 'MENSTRUACIONET & PASTËRTIA',
    title: 'Statusi i pastërtisë:\nbazat',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Të kuptosh lidhjen midis ciklit dhe statusit të pastërtisë rituale, për ta përballuar këtë kohë me më shumë qartësi.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhen vërtetuar nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Të kuptojmë çfarë do të thotë pastërtia rituale',
      'Menstruacioni dhe përjashtimi nga adhurimi',
      'Pas menstruacionit: si ta dallosh kthimin në pastërti',
      'Gusli: të kuptojmë rolin e tij',
      'Çfarë të bësh kur nuk je e sigurt?',
      'Në pak fjalë',
    ],
    section1Body: 'Në traditën islame, pastërtia rituale (tahara) nënkupton gjendjen e kërkuar për kryerjen e disa akteve të adhurimit, si namazi. Ajo nuk i referohet pastërtisë në kuptimin e përditshëm, por një gjendjeje të veçantë të njohur nga fikhu, që ndryshon sipas fazave të ciklit femëror.',
    section2Body: 'Gjatë menstruacionit, gruaja përjashtohet nga disa akte adhurimi, në veçanti nga namazi dhe agjërimi i Ramazanit, që mund të kompensohen më vonë. Ky përjashtim njihet si lehtësim, jo si ndëshkim.',
    checkList1Title: 'Çfarë mbetet e arritshme gjatë menstruacionit',
    duringPeriod: [
      'Dhikri (përmendja e Zotit) dhe lutjet (dua)',
      'Dëgjimi ose leximi i përmbajtjeve edukative dhe shpirtërore',
      'Mbështetja e praktikës fetare të të afërmve të tu',
      'Reflektimi fetar dhe të mësuarit',
    ],
    noteTitle: 'Mos harro',
    noteText: 'Disa detaje (si leximi i drejtpërdrejtë i Kuranit ose hyrja në xhami) mund të ndryshojnë sipas shkollës së jurisprudencës; për këto raste të veçanta më mirë t’i referohesh mendimit që ndjek zakonisht ose një dijetari të kualifikuar.',
    section3Body: 'Fundi i menstruacionit shënon kthimin gradual në gjendjen e pastërtisë rituale. Fizikisht, kjo përkon me ndalimin e gjakderdhjes, një shenjë që traditat e ndryshme dijetare mund ta përcaktojnë me nuanca paksa të ndryshme.',
    visual1Title: 'Një proces fiziologjik',
    visual1Text: 'Të kuptuarit e fazave të ciklit të ndihmon ta dallosh më mirë çastin kur menstruacioni mbaron realisht.',
    section3Body2: 'Pasi kjo shenjë të jetë vërejtur, gusli (larja e madhe rituale) lejon kthimin në pastërtinë rituale dhe rifillimin e akteve të adhurimit që ishin pezulluar.',
    section4Body: 'Gusli është një larje e madhe rituale që konsiston në larjen e të gjithë trupit me synimin e pastrimit. Ai shënon fundin e përjashtimit dhe lejon rifillimin normal të namazit, pa qenë e nevojshme të kompensohen namazet e humbura gjatë menstruacionit.',
    visual2Title: 'Një ritual pastrimi',
    visual2Text: 'Mënyra e saktë e kryerjes së guslit mund të ndryshojë paksa sipas shkollës së jurisprudencës që ndiqet.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Nëse nuk i di hapat e saktë që ndiqen në shkollën tënde, dikush që i beson ose një dijetar i kualifikuar do të mund t’ia shpjegojë qartë.',
    section5Body: 'Është e zakonshme të ndjesh dyshim se kur ka mbaruar vërtet menstruacioni, sidomos kur gjakderdhja pakësohet gradualisht në vend që të ndalojë befas.',
    checkList2Title: 'Disa shenja të dobishme',
    doubtMarkers: [
      'Vëzhgo mungesën e plotë të gjakderdhjes, jo vetëm pakësimin',
      'Lër të kalojë kohë e mjaftueshme përpara se të konkludosh se menstruacioni ka mbaruar',
      'Mbështetu te një vëzhgim i qartë, jo te një përshtypje e thjeshtë',
      'Merr parasysh ritmin tënd të zakonshëm, që mund të ndryshojë nga një cikël te tjetri',
    ],
    alert2Title: 'Informacion i rëndësishëm',
    alert2Text: 'Në raste gjakderdhjeje të zgjatur ose të parregullt, ose dyshimi të vazhdueshëm, këto situata vlen të diskutohen me një dijetar të kualifikuar, që mund të të udhëzojë sipas situatës tënde personale. Kjo përmbajtje mbetet informuese dhe nuk zëvendëson udhëzimin fetar të individualizuar.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Këto shenja janë kujtesa të përgjithshme edukative. Çdo situatë mund të ketë veçoritë e veta: në rast dyshimi, dialogu me një dijetar të kualifikuar mbetet burimi më i mirë për një përgjigje të përshtatur me situatën tënde.',
    shareMessage: 'Statusi i pastërtisë: bazat — AWA',
  },
  ja: {
    badge: '生理と清浄',
    title: '清浄の状態：\n基本',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: '周期と儀礼上の清浄の状態との関係を理解し、この時期をより明確な見通しで迎えるための解説です。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容は教育を目的としたものです。宗教上の疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出しません。',
    contentsTitle: 'この記事の内容',
    topics: [
      '儀礼上の清浄とは',
      '月経と礼拝の免除',
      '月経のあと：清浄に戻ったことを見分ける',
      'グスル：その役割を理解する',
      'わからないときはどうすればよいでしょうか？',
      '重要なポイント',
    ],
    section1Body: 'イスラームの伝統では、儀礼上の清浄（タハーラ）とは、礼拝などの信仰上の行為を行うために求められる状態のことです。日常的な意味での清潔さではなく、イスラーム法学（フィクフ）で認められた特定の状態を指し、女性の周期の段階に応じて変わります。',
    section2Body: '月経中の女性は、礼拝とラマダーンの断食など、特定の信仰上の行為を免除されます。断食は後日に埋め合わせることができます。この免除は、罰ではなく軽減として認められています。',
    checkList1Title: '月経中にできること',
    duringPeriod: [
      'ズィクル（神を想うこと）とドゥアー（祈願）',
      '学びになる内容や精神的な内容を聞いたり読んだりすること',
      '身近な人の宗教的な実践を支えること',
      '宗教についての思索と学び',
    ],
    noteTitle: 'ご注意ください',
    noteText: 'クルアーンを直接読むことやモスクに入ることなど、細部は法学派によって異なることがあります。こうした個別の場合は、普段従っている見解や、資格のある学者に確認するのがよいでしょう。',
    section3Body: '月経の終わりは、儀礼上の清浄の状態へ徐々に戻ることを意味します。身体的には出血が止まることにあたり、この目安は、学問の伝統によって細かな違いをもって定義されることがあります。',
    visual1Title: '生理的な過程',
    visual1Text: '周期の段階を理解すると、月経が実際に終わった時点をより見分けやすくなります。',
    section3Body2: 'この目安が確認できたら、グスル（全身を清める沐浴）によって儀礼上の清浄に戻り、中断していた信仰上の行為を再開できます。',
    section4Body: 'グスルは、清める意図をもって全身を洗う、大きな儀礼的な清めです。免除の終わりを示し、礼拝を通常どおり再開することを可能にします。月経中にできなかった礼拝を埋め合わせる必要はありません。',
    visual2Title: '清めの儀礼',
    visual2Text: 'グスルを行う正確な方法は、従っている法学派によって多少異なることがあります。',
    tip1Title: '知っておきたいこと',
    tip1Text: '従っている学派での具体的な手順がわからない場合は、信頼できる人や資格のある学者が、わかりやすく教えてくれます。',
    section5Body: '月経が本当に終わったのがいつなのか迷うのはよくあることです。とくに、出血が突然止まるのではなく、徐々に減っていく場合です。',
    checkList2Title: '役立つ目安',
    doubtMarkers: [
      '出血が減っただけではなく、まったくなくなったことを確認しましょう',
      '月経が終わったと結論づける前に、十分な時間を置きましょう',
      '単なる印象ではなく、はっきりした観察に基づきましょう',
      '周期ごとに異なることもある、ご自身のいつものリズムを考慮しましょう',
    ],
    alert2Title: '大切なお知らせ',
    alert2Text: '出血が長引く場合や不規則な場合、疑問が続く場合は、資格のある学者に相談するとよいでしょう。ご自身の状況に応じた助言を受けられます。この内容は情報提供であり、個別の宗教的な導きの代わりにはなりません。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'これらの目安は、一般的な教育上の注意点です。状況にはそれぞれ固有の事情があります。迷ったときは、資格のある学者との対話が、ご自身の状況に合った答えを得るうえで最も頼りになります。',
    shareMessage: '清浄の状態：基本 — AWA',
  },
  ko: {
    badge: '생리와 정결',
    title: '정결 상태:\n기본 이해',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '주기와 의례상의 정결 상태가 어떤 관련이 있는지 이해하고, 이 시기를 더 분명하게 맞이해 봐요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 교육을 목적으로 해요. 종교적인 질문은 자격을 갖춘 학자에게 확인해야 해요. AWA는 파트와나 개인별 종교 판단을 내리지 않아요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '의례상의 정결이 의미하는 것',
      '월경과 예배의 면제',
      '월경 후: 정결로 돌아오는 때를 알아보기',
      '구슬: 그 역할 이해하기',
      '확신이 서지 않을 때는 어떻게 할까요?',
      '핵심 정리',
    ],
    section1Body: '이슬람 전통에서 의례상의 정결(타하라)은 예배와 같은 특정 예배 행위를 하기 위해 필요한 상태를 가리켜요. 일상적인 의미의 청결을 뜻하는 것이 아니라 이슬람 법학(피크흐)이 인정하는 특정한 상태를 말하며, 여성 주기의 단계에 따라 달라져요.',
    section2Body: '월경 중에는 일부 예배 행위, 특히 예배와 라마단 금식이 면제되며, 이는 나중에 보충할 수 있어요. 이 면제는 벌이 아니라 배려로 인정돼요.',
    checkList1Title: '월경 중에도 할 수 있는 것',
    duringPeriod: [
      '지크르(알라를 기억함)와 두아(간구)',
      '교육적이고 영적인 콘텐츠를 듣거나 읽기',
      '주변 사람들의 신앙생활 응원하기',
      '종교적인 성찰과 배움',
    ],
    noteTitle: '참고해 주세요',
    noteText: '꾸란을 직접 읽는 것이나 모스크 출입처럼 일부 세부 사항은 법학파에 따라 다를 수 있어요. 이런 특정한 경우에는 평소 따르는 견해를 참고하거나 자격을 갖춘 학자에게 물어보는 것이 좋아요.',
    section3Body: '월경이 끝나면 의례상의 정결 상태로 서서히 돌아와요. 신체적으로는 출혈이 멈추는 것에 해당하며, 학자들의 전통에 따라 이 기준을 조금씩 다르게 정의하기도 해요.',
    visual1Title: '생리적인 과정',
    visual1Text: '주기의 단계를 이해하면 월경이 실제로 끝나는 시점을 더 잘 알아보는 데 도움이 돼요.',
    section3Body2: '이 기준을 확인하고 나면 구슬(전신 정화 목욕)을 통해 의례상의 정결로 돌아가 중단했던 예배 행위를 다시 할 수 있어요.',
    section4Body: '구슬은 정화하려는 의도를 가지고 온몸을 씻는 전신 정화 목욕이에요. 면제가 끝났음을 알리며, 월경 중에 놓친 예배를 보충하지 않아도 예배를 평소처럼 다시 할 수 있게 해요.',
    visual2Title: '정화 의식',
    visual2Text: '구슬을 행하는 구체적인 방법은 따르는 법학파에 따라 조금씩 다를 수 있어요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '내가 따르는 법학파의 구체적인 절차를 모른다면, 믿을 수 있는 사람이나 자격을 갖춘 학자가 알기 쉽게 설명해 줄 수 있어요.',
    section5Body: '특히 출혈이 갑자기 멈추지 않고 서서히 줄어들 때, 월경이 정말 끝났는지 의문이 드는 것은 흔한 일이에요.',
    checkList2Title: '참고할 만한 기준',
    doubtMarkers: [
      '출혈이 줄어든 정도가 아니라 완전히 없는지 살펴봐요',
      '월경이 끝났다고 결론 내리기 전에 충분한 시간을 두어요',
      '막연한 느낌보다는 분명한 관찰에 의지해요',
      '주기마다 달라질 수 있는 내 평소 리듬도 고려해요',
    ],
    alert2Title: '중요한 안내',
    alert2Text: '출혈이 오래 이어지거나 불규칙하거나 의문이 계속될 때는 자격을 갖춘 학자와 상의하는 것이 좋아요. 학자가 개인의 상황에 맞게 안내해 줄 수 있어요. 이 콘텐츠는 정보 제공을 위한 것이며 개인별 종교 안내를 대신하지 않아요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: '이 기준들은 교육을 위한 일반적인 안내예요. 상황마다 고유한 특징이 있을 수 있어요. 확신이 서지 않을 때는 자격을 갖춘 학자와 대화하는 것이 내 상황에 맞는 답을 얻는 가장 좋은 방법이에요.',
    shareMessage: '정결 상태: 기본 이해 — AWA',
  },
  'pt-PT': {
    badge: 'PERÍODO E PUREZA',
    title: 'Estado de pureza:\nas bases',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Compreender a relação entre o ciclo e o estado de pureza ritual, para encarar este momento com mais clareza.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Compreender o que significa a pureza ritual',
      'Menstruação e dispensa do culto',
      'Após a menstruação: reconhecer o regresso à pureza',
      'Ghusl: compreender o seu papel',
      'O que fazer quando não tem a certeza?',
      'Pontos essenciais',
    ],
    section1Body: 'Na tradição islâmica, a pureza ritual (tahara) designa o estado exigido para realizar certos atos de culto, como a oração. Não se refere à limpeza no sentido do quotidiano, mas a um estado específico reconhecido pelo fiqh, que muda consoante as etapas do ciclo feminino.',
    section2Body: 'Durante a menstruação, a mulher está dispensada de certos atos de culto, em particular da oração e do jejum do Ramadão, que poderá compensar mais tarde. Esta dispensa é reconhecida como um alívio, não como um castigo.',
    checkList1Title: 'O que continua acessível durante a menstruação',
    duringPeriod: [
      'O dhikr (recordação de Deus) e as súplicas (dua)',
      'Ouvir ou ler conteúdos educativos e espirituais',
      'Apoiar a prática religiosa das pessoas próximas',
      'A reflexão e a aprendizagem religiosas',
    ],
    noteTitle: 'Atenção',
    noteText: 'Alguns pormenores (como a leitura direta do Alcorão ou o acesso à mesquita) podem variar consoante a escola jurídica; o melhor é recorrer à opinião que habitualmente segue ou a um sábio qualificado para estes casos específicos.',
    section3Body: 'O fim da menstruação marca o regresso gradual ao estado de pureza ritual. Fisicamente, corresponde à cessação do sangramento, uma referência que as diferentes tradições de sábios podem definir com nuances ligeiramente diferentes.',
    visual1Title: 'Um processo fisiológico',
    visual1Text: 'Compreender as etapas do ciclo ajuda a identificar melhor o momento em que a menstruação termina realmente.',
    section3Body2: 'Uma vez observada esta referência, o ghusl (banho ritual maior) permite regressar à pureza ritual e retomar os atos de culto que estavam suspensos.',
    section4Body: 'O ghusl é um banho ritual maior que consiste em lavar todo o corpo com a intenção de se purificar. Marca o fim da dispensa e permite retomar a oração normalmente, sem ser necessário compensar as orações não realizadas durante a menstruação.',
    visual2Title: 'Um ritual de purificação',
    visual2Text: 'A forma precisa de realizar o ghusl pode variar ligeiramente consoante a escola jurídica seguida.',
    tip1Title: 'Bom saber',
    tip1Text: 'Se não conhece os passos precisos seguidos na sua escola, uma pessoa da sua confiança ou um sábio qualificado poderá explicar-lhos com clareza.',
    section5Body: 'É comum sentir dúvidas sobre quando a menstruação terminou verdadeiramente, sobretudo quando o sangramento diminui gradualmente em vez de parar de forma abrupta.',
    checkList2Title: 'Algumas referências úteis',
    doubtMarkers: [
      'Observe a ausência total de sangramento, e não apenas uma diminuição',
      'Deixe passar tempo suficiente antes de concluir que a menstruação terminou',
      'Baseie-se numa observação clara e não numa mera impressão',
      'Tenha em conta o seu próprio ritmo habitual, que pode variar de um ciclo para outro',
    ],
    alert2Title: 'Informação importante',
    alert2Text: 'Em caso de sangramento prolongado ou irregular, ou de dúvida persistente, estas situações merecem ser conversadas com um sábio qualificado, que a poderá orientar de acordo com a sua situação pessoal. Este conteúdo permanece informativo e não substitui uma orientação religiosa individualizada.',
    tip2Title: 'Bom saber',
    tip2Text: 'Estas referências são lembretes educativos gerais. Cada situação pode ter as suas particularidades: em caso de dúvida, o diálogo com um sábio qualificado continua a ser o melhor recurso para uma resposta adequada à sua situação.',
    shareMessage: 'Estado de pureza: as bases — AWA',
  },
  bn: {
    badge: 'মাসিক ও পবিত্রতা',
    title: 'পবিত্রতার অবস্থা:\nমৌলিক বিষয়',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'চক্র ও আনুষ্ঠানিক পবিত্রতার অবস্থার মধ্যকার সম্পর্ক বোঝা, যাতে এই সময়টি আরও স্পষ্টভাবে মোকাবিলা করতে পারেন।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'আনুষ্ঠানিক পবিত্রতার অর্থ বোঝা',
      'মাসিক ও ইবাদত থেকে অব্যাহতি',
      'মাসিকের পর: পবিত্রতায় ফিরে আসা চেনা',
      'গোসল: এর ভূমিকা বোঝা',
      'নিশ্চিত না হলে কী করবেন?',
      'মূল কথা',
    ],
    section1Body: 'ইসলামি ঐতিহ্যে আনুষ্ঠানিক পবিত্রতা (তাহারাত) বলতে বোঝায় নামাজের মতো কিছু ইবাদত পালনের জন্য প্রয়োজনীয় অবস্থা। এটি দৈনন্দিন অর্থে পরিচ্ছন্নতা নয়, বরং ফিকহ-স্বীকৃত একটি নির্দিষ্ট অবস্থা, যা নারীর চক্রের ধাপ অনুযায়ী বদলায়।',
    section2Body: 'মাসিকের সময় একজন নারী কিছু ইবাদত থেকে অব্যাহতি পান, বিশেষ করে নামাজ এবং রমজানের রোজা থেকে, যা পরে পূরণ করা যায়। এই অব্যাহতি একটি সহজীকরণ হিসেবে স্বীকৃত, শাস্তি হিসেবে নয়।',
    checkList1Title: 'মাসিকের সময় যা করা সম্ভব থাকে',
    duringPeriod: [
      'যিকির (আল্লাহর স্মরণ) ও দোয়া',
      'শিক্ষামূলক ও আধ্যাত্মিক বিষয়বস্তু শোনা বা পড়া',
      'আপনার কাছের মানুষদের ধর্মীয় অনুশীলনে সহায়তা করা',
      'ধর্মীয় চিন্তাভাবনা ও শিক্ষা',
    ],
    noteTitle: 'মনে রাখবেন',
    noteText: 'কিছু খুঁটিনাটি (যেমন কুরআন সরাসরি পড়া বা মসজিদে প্রবেশ) ফিকহের মাযহাবভেদে ভিন্ন হতে পারে; এসব নির্দিষ্ট ক্ষেত্রে আপনি যে মত সাধারণত অনুসরণ করেন সেটি দেখে নেওয়া বা কোনো যোগ্য আলেমের কাছে জানা ভালো।',
    section3Body: 'মাসিক শেষ হওয়া মানে ধীরে ধীরে আনুষ্ঠানিক পবিত্রতার অবস্থায় ফিরে আসা। শারীরিকভাবে এটি রক্তক্ষরণ বন্ধ হওয়ার সঙ্গে মিলে যায়, একটি নির্দেশক যা বিভিন্ন বিদ্বান-ঐতিহ্য সামান্য ভিন্ন সূক্ষ্মতায় সংজ্ঞায়িত করতে পারে।',
    visual1Title: 'একটি শারীরবৃত্তীয় প্রক্রিয়া',
    visual1Text: 'চক্রের ধাপগুলো বুঝলে মাসিক আসলে কখন শেষ হয়, সেই মুহূর্ত আরও ভালোভাবে চিনতে পারবেন।',
    section3Body2: 'এই নির্দেশকটি পর্যবেক্ষণ করার পর গোসল (ফরজ গোসল) আনুষ্ঠানিক পবিত্রতায় ফিরে আসতে এবং স্থগিত থাকা ইবাদত আবার শুরু করতে সুযোগ দেয়।',
    section4Body: 'গোসল একটি বড় আনুষ্ঠানিক পবিত্রতা অর্জন, যাতে নিজেকে পবিত্র করার নিয়তে পুরো শরীর ধোয়া হয়। এটি অব্যাহতির সমাপ্তি চিহ্নিত করে এবং নামাজ স্বাভাবিকভাবে আবার শুরু করতে দেয়, মাসিকের সময় ছুটে যাওয়া নামাজ পূরণ করার প্রয়োজন ছাড়াই।',
    visual2Title: 'একটি পবিত্রতা অর্জনের রীতি',
    visual2Text: 'গোসল ঠিক কীভাবে করা হয় তা আপনি যে মাযহাব অনুসরণ করেন তার ওপর নির্ভর করে সামান্য ভিন্ন হতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'আপনার মাযহাবে অনুসৃত সুনির্দিষ্ট ধাপগুলো যদি আপনার জানা না থাকে, তাহলে আপনার বিশ্বস্ত কেউ বা একজন যোগ্য আলেম আপনাকে স্পষ্টভাবে বুঝিয়ে দিতে পারবেন।',
    section5Body: 'মাসিক সত্যিই কখন শেষ হয়েছে, তা নিয়ে সন্দেহ হওয়া সাধারণ, বিশেষ করে যখন রক্তক্ষরণ হঠাৎ বন্ধ না হয়ে ধীরে ধীরে কমে।',
    checkList2Title: 'কিছু কার্যকর নির্দেশক',
    doubtMarkers: [
      'শুধু কমে যাওয়া নয়, রক্তক্ষরণ সম্পূর্ণ না থাকা পর্যবেক্ষণ করুন',
      'মাসিক শেষ হয়েছে সিদ্ধান্তে পৌঁছানোর আগে যথেষ্ট সময় অতিবাহিত হতে দিন',
      'নিছক ধারণার বদলে স্পষ্ট পর্যবেক্ষণের ওপর নির্ভর করুন',
      'আপনার নিজের স্বাভাবিক ছন্দ বিবেচনা করুন, যা এক চক্র থেকে আরেক চক্রে ভিন্ন হতে পারে',
    ],
    alert2Title: 'গুরুত্বপূর্ণ তথ্য',
    alert2Text: 'দীর্ঘস্থায়ী বা অনিয়মিত রক্তক্ষরণ, বা স্থায়ী সন্দেহের ক্ষেত্রে, এসব পরিস্থিতি একজন যোগ্য আলেমের সঙ্গে আলোচনা করা উচিত, যিনি আপনার ব্যক্তিগত অবস্থা অনুযায়ী আপনাকে পথ দেখাতে পারবেন। এই বিষয়বস্তু তথ্যমূলক থাকে এবং ব্যক্তিগত ধর্মীয় দিকনির্দেশনার বিকল্প নয়।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'এই নির্দেশকগুলো সাধারণ শিক্ষামূলক স্মারক। প্রতিটি পরিস্থিতির নিজস্ব বিশেষত্ব থাকতে পারে: সন্দেহ হলে আপনার অবস্থার উপযোগী উত্তরের জন্য একজন যোগ্য আলেমের সঙ্গে আলাপই সবচেয়ে ভালো উপায়।',
    shareMessage: 'পবিত্রতার অবস্থা: মৌলিক বিষয় — AWA',
  },
  da: {
    badge: 'MENSTRUATION & RENHED',
    title: 'Renhedsstatus:\ndet grundlæggende',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Forståelse af forbindelsen mellem cyklussen og rituel renhedsstatus, for at nærme sig denne tid med større klarhed.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er rent uddannelsesmæssigt. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forståelse af, hvad rituel renhed betyder',
      'Menstruation og fritagelse fra gudsdyrkelse',
      'Efter menstruation: at genkende hjemkomsten til renhed',
      'Ghusl: forståelse af dens rolle',
      'Hvad gør du, når du ikke er sikker?',
      'Vigtige pointer',
    ],
    section1Body: 'I islamisk tradition refererer rituel renhed (tahara) til den tilstand, der kræves for at udføre visse gudsdyrkelseshandlinger, såsom salat/bøn. Det refererer ikke til renlighed i hverdagslig forstand, men til en specifik tilstand anerkendt af fiqh, som ændrer sig i henhold til det kvindelige cyklusforløb.',
    section2Body: 'Under haidh (menstruation) er en kvinde fritaget fra visse gudsdyrkelseshandlinger, særligt salat/bøn og Ramadan-fasten, som kan indhentes senere. Denne fritagelse er anerkendt som en lettelse, ikke som en straf.',
    checkList1Title: 'Hvad forbliver tilgængeligt under menstruation',
    duringPeriod: [
      'Dhikr (ihukommelse af Gud) og bønsmålinger (du\'a)',
      'At lytte til eller læse uddannelsesmæssigt og åndeligt indhold',
      'At støtte de næres religiøse praksis',
      'Religiøs refleksion og læring',
    ],
    noteTitle: 'Bemærk venligst',
    noteText: 'Visse detaljer (såsom direkte læsning af Koranen eller adgang til moskéen) kan variere afhængigt af retsskolen; det er bedst at henvise til den mening, du sædvanligvis følger, eller en kvalificeret lærd for disse specifikke tilfælde.',
    section3Body: 'Menstruationens afslutning markerer den gradvise tilbagevenden til tilstanden af rituel renhed. Fysisk svarer dette til ophøret af blødningen, et tegn, som forskellige lærdetraditioner kan definere med let forskellige nuancer.',
    visual1Title: 'En fysiologisk proces',
    visual1Text: 'Forståelse af cyklussens stadier hjælper dig med bedre at identificere det øjeblik, hvor menstruationen faktisk slutter.',
    section3Body2: 'Når dette tegn er observeret, giver ghuslen (den store ablution) mulighed for at vende tilbage til rituel renhed og genoptage de gudsdyrkelseshandlinger, der var suspenderet.',
    section4Body: 'Ghusl er en stor rituel ablution, der indebærer at vaske hele kroppen med intentionen om at rense sig. Den markerer afslutningen på fritagelsen og giver mulighed for at genoptage salat/bøn normalt, uden at det er nødvendigt at indhente de bønner, der gik tabt under menstruationen.',
    visual2Title: 'Et renselsesritual',
    visual2Text: 'Den præcise måde, ghuslen udføres på, kan variere lidt afhængigt af den fulgte retsskole.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Hvis du ikke kender de præcise trin i din skole, vil en person, du stoler på, eller en kvalificeret lærd kunne forklare dem klart for dig.',
    section5Body: 'Det er almindeligt at tvivle på, hvornår menstruationen virkelig er slut, især når blødningen aftager gradvist frem for at stoppe brat.',
    checkList2Title: 'Nogle nyttige tegn',
    doubtMarkers: [
      'Observer den totale fravær af blødning, ikke blot en aftagen',
      'Lad tilstrækkelig tid gå, inden du konkluderer, at menstruationen er slut',
      'Støt dig til en klar observation snarere end blot en fornemmelse',
      'Tag højde for din egen sædvanlige rytme, som kan variere fra cyklus til cyklus',
    ],
    alert2Title: 'Vigtig information',
    alert2Text: 'I tilfælde af langvarig eller uregelmæssig blødning, eller vedvarende tvivl, fortjener disse situationer at blive drøftet med en kvalificeret lærd, som kan vejlede dig i henhold til din personlige situation. Dette indhold er informativt og erstatter ikke individuel religiøs vejledning.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Disse tegn er generelle uddannelsesmæssige påmindelser. Enhver situation kan have sine egne særegenheder: i tilfælde af tvivl forbliver dialog med en kvalificeret lærd den bedste ressource for et svar tilpasset din situation.',
    shareMessage: 'Renhedsstatus: det grundlæggende — AWA',
  },
  sv: {
    badge: 'MENSTRUATION & RENHED',
    title: 'Renhedsstatus:\ndet grundläggende',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Forståelse av forbindelsen mellem cyklussen och rituel renhedsstatus, for att närme sig denne tid med större klarhed.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forståelse av, hvad rituel renhed betyder',
      'Menstruation och fritagelse fran gudsdyrkelse',
      'Efter menstruation: at genkende hjemkomsten till renhed',
      'Ghusl: forståelse av dens rolle',
      'Hvad gör du, når du inte ar sikker?',
      'Vigtige pointer',
    ],
    section1Body: 'I islamisk tradition refererer rituel renhed (tahara) till den tilstand, der kräves for att udföre visse gudsdyrkelseshandlinger, såsom salat/bön. Det refererer inte till renlighed i hverdagslig forstand, men till en specifik tilstand anerkendt av fiqh, som ändrer sig i henhold till det kvindelige cyklusforlöb.',
    section2Body: 'Under haidh (menstruation) ar en kvinna fritaget fran visse gudsdyrkelseshandlinger, särligt salat/bön och Ramadan-fasten, som kan indhentes senere. Denne fritagelse ar anerkendt som en lettelse, inte som en straf.',
    checkList1Title: 'Hvad forbliver tilgängeligt under menstruation',
    duringPeriod: [
      'Dhikr (ihukommelse av Gud) och bönsmålinger (du\'a)',
      'At lytte till eller läse uddannelsesmässigt och åndeligt indhold',
      'At stötte de näres religiöse praksis',
      'Religiös refleksion och läring',
    ],
    noteTitle: 'Bemärk venligst',
    noteText: 'Visse detaljer (såsom direkte läsning av Koranen eller adgang till moskéen) kan variere afhängigt av retsskolen; det ar bedst at henvise till den mening, du sädvanligvis fölger, eller en kvalificeret lärd for disse specifikke tilfälde.',
    section3Body: 'Menstruationens afslutning markerer den gradvise tilbagevenden till tilstanden av rituel renhed. Fysisk svarer dette till ophöret av blödningen, et tegn, som forskellige lärdetraditioner kan definere med let forskellige nuancer.',
    visual1Title: 'En fysiologisk proces',
    visual1Text: 'Forståelse av cyklussens stadier hjälper dig med bedre at identificere det öjeblik, hvor menstruationen faktisk slutter.',
    section3Body2: 'Når dette tegn ar observeret, giver ghuslen (den store ablution) mulighed for att vende tilbage till rituel renhed och genoptage de gudsdyrkelseshandlinger, der var suspenderet.',
    section4Body: 'Ghusl ar en stor rituel ablution, der indebärer at vaske hele kroppen med intentionen om at rense sig. Den markerer afslutningen på fritagelsen och giver mulighed for att genoptage salat/bön normalt, uden at det ar nödvendigt at indhente de bönner, der gik tabt under menstruationen.',
    visual2Title: 'Et renselsesritual',
    visual2Text: 'Den präcise måde, ghuslen udföres på, kan variere lite afhängigt av den fulgte retsskole.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Hvis du inte kender de präcise trin i din skole, vil en person, du stoler på, eller en kvalificeret lärd kunne forklare dem klart for dig.',
    section5Body: 'Det ar almindeligt at tvivle på, hvornår menstruationen virkelig ar slut, isär når blödningen aftager gradvist frem for att stoppe brat.',
    checkList2Title: 'Nogle nyttige tegn',
    doubtMarkers: [
      'Observer den totale fravär av blödning, inte blot en aftagen',
      'Lad tilsträkkelig tid gå, inden du konkluderer, at menstruationen ar slut',
      'Stöt dig till en klar observation snarere end blot en fornemmelse',
      'Tag höjde for din egen sädvanlige rytme, som kan variere fran cyklus till cyklus',
    ],
    alert2Title: 'Vigtig information',
    alert2Text: 'I tilfälde av langvarig eller uregelmässig blödning, eller vedvarende tvivl, fortjener disse situationer at blive dröftet med en kvalificeret lärd, som kan vejlede dig i henhold till din personlige situation. Dette indhold ar informativt och erstatter inte individuel religiös vejledning.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Disse tegn ar generelle uddannelsesmässige påmindelser. Enhver situation kan have sine egne säregenheder: i tilfälde av tvivl forbliver dialog med en kvalificeret lärd den bedste ressource for et svar tilpasset din situation.',
    shareMessage: 'Renhedsstatus: det grundläggende — AWA',
  },
  nb: {
    badge: 'MENS OG RENHET',
    title: 'Renhetsstatus:\ndet grunnleggende',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Forstå sammenhengen mellom syklusen og rituell renhetsstatus, for å møte denne tiden med mer klarhet.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forstå hva rituell renhet betyr',
      'Menstruasjon og fritak fra gudstjeneste',
      'Etter menstruasjonen: kjenne igjen tilbakekomsten til renhet',
      'Ghusl: forstå dens rolle',
      'Hva gjør du når du er usikker?',
      'Det viktigste å huske',
    ],
    section1Body: 'I den islamske tradisjonen betegner rituell renhet (tahara) tilstanden som kreves for å utføre visse gudstjenestehandlinger, som bønn. Det viser ikke til renslighet i hverdagslig forstand, men til en bestemt tilstand anerkjent av fiqh, som endrer seg etter fasene i den kvinnelige syklusen.',
    section2Body: 'Under menstruasjon er en kvinne fritatt fra visse gudstjenestehandlinger, særlig bønn og ramadanfasten, som kan tas igjen senere. Dette fritaket anerkjennes som en lettelse, ikke som en straff.',
    checkList1Title: 'Hva som fortsatt er tilgjengelig under menstruasjon',
    duringPeriod: [
      'Dhikr (påkallelse av Gud) og bønner (du‘a)',
      'Å lytte til eller lese pedagogisk og åndelig innhold',
      'Å støtte de nærmestes religiøse praksis',
      'Religiøs refleksjon og læring',
    ],
    noteTitle: 'Merk',
    noteText: 'Noen detaljer (som direkte lesing av Koranen eller tilgang til moskeen) kan variere avhengig av rettsskole; det er best å holde seg til uttalelsen du vanligvis følger eller til en kvalifisert lærd i disse spesifikke tilfellene.',
    section3Body: 'Slutten på menstruasjonen markerer den gradvise tilbakekomsten til rituell renhet. Fysisk tilsvarer dette at blødningen stopper, en markør som ulike lærde tradisjoner kan definere med litt forskjellige nyanser.',
    visual1Title: 'En fysiologisk prosess',
    visual1Text: 'Å forstå fasene i syklusen hjelper deg å bedre kjenne igjen øyeblikket da menstruasjonen faktisk tar slutt.',
    section3Body2: 'Når denne markøren er observert, gjør ghusl (den store avvaskingen) det mulig å vende tilbake til rituell renhet og gjenoppta gudstjenestehandlingene som var suspendert.',
    section4Body: 'Ghusl er en stor rituell avvasking som innebærer å vaske hele kroppen med hensikt om å rense seg. Den markerer slutten på fritaket og lar bønnen gjenopptas normalt, uten at det er nødvendig å ta igjen bønnene som ble gått glipp av under menstruasjonen.',
    visual2Title: 'Et renselsesritual',
    visual2Text: 'Den presise måten ghusl utføres på, kan variere litt avhengig av rettsskolen som følges.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Hvis du ikke kjenner de presise trinnene som følges i din rettsskole, kan noen du stoler på eller en kvalifisert lærd forklare dem tydelig for deg.',
    section5Body: 'Det er vanlig å kjenne tvil om når menstruasjonen virkelig er over, særlig når blødningen avtar gradvis i stedet for å stoppe brått.',
    checkList2Title: 'Noen nyttige markører',
    doubtMarkers: [
      'Observer at blødningen er helt borte, ikke bare redusert',
      'La det gå nok tid før du konkluderer med at menstruasjonen er over',
      'Støtt deg på en tydelig observasjon heller enn et enkelt inntrykk',
      'Ta hensyn til din egen vanlige rytme, som kan variere fra en syklus til en annen',
    ],
    alert2Title: 'Viktig informasjon',
    alert2Text: 'Ved langvarig eller uregelmessig blødning, eller vedvarende tvil, fortjener disse situasjonene å tas opp med en kvalifisert lærd, som kan veilede deg ut fra din personlige situasjon. Dette innholdet er fortsatt informativt og erstatter ikke individuell religiøs veiledning.',
    tip2Title: 'Godt å vite',
    tip2Text: 'Disse markørene er generelle pedagogiske påminnelser. Hver situasjon kan ha sine egne særtrekk: ved tvil er dialog med en kvalifisert lærd fortsatt den beste ressursen for et svar tilpasset din situasjon.',
    shareMessage: 'Renhetsstatus: det grunnleggende – AWA',
  },
  pl: {
    badge: 'MIESIĄCZKA I CZYSTOŚĆ',
    title: 'Stan czystości:\npodstawy',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Zrozumieć związek między cyklem a stanem rytualnej czystości, by z większą jasnością podejść do tego czasu.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zrozumieć, co oznacza rytualna czystość',
      'Menstruacja i zwolnienie z kultu',
      'Po menstruacji: rozpoznanie powrotu do czystości',
      'Gusl: zrozumieć jego rolę',
      'Co zrobić, gdy nie masz pewności?',
      'Najważniejsze wnioski',
    ],
    section1Body: 'W tradycji islamskiej rytualna czystość (tahara) oznacza stan wymagany do wykonywania niektórych aktów kultu, takich jak modlitwa. Nie chodzi o czystość w codziennym znaczeniu, lecz o określony stan uznawany przez fikh, który zmienia się w zależności od etapów cyklu kobiety.',
    section2Body: 'Podczas menstruacji kobieta jest zwolniona z niektórych aktów kultu, w szczególności z modlitwy i postu ramadanowego, który można odrobić później. To zwolnienie jest uznawane za ulgę, a nie za karę.',
    checkList1Title: 'Co pozostaje dostępne podczas menstruacji',
    duringPeriod: [
      'Dhikr (wspominanie Boga) i prośby (dua)',
      'Słuchanie lub czytanie treści edukacyjnych i duchowych',
      'Wspieranie praktyki religijnej bliskich',
      'Refleksja religijna i nauka',
    ],
    noteTitle: 'Zwróć uwagę',
    noteText: 'Niektóre szczegóły (takie jak bezpośrednie czytanie Koranu lub wstęp do meczetu) mogą się różnić w zależności od szkoły prawa; w tych szczególnych przypadkach najlepiej odwołać się do opinii, której zwykle przestrzegasz, lub do wykwalifikowanego uczonego.',
    section3Body: 'Koniec menstruacji oznacza stopniowy powrót do stanu rytualnej czystości. Fizycznie odpowiada to ustaniu krwawienia, co różne tradycje uczone mogą definiować z nieco odmiennymi niuansami.',
    visual1Title: 'Proces fizjologiczny',
    visual1Text: 'Zrozumienie etapów cyklu pomaga lepiej rozpoznać moment, w którym menstruacja rzeczywiście się kończy.',
    section3Body2: 'Gdy ten znacznik zostanie zaobserwowany, gusl (wielkie obmycie) pozwala wrócić do rytualnej czystości i wznowić zawieszone akty kultu.',
    section4Body: 'Gusl to wielkie rytualne obmycie, polegające na umyciu całego ciała z intencją oczyszczenia. Oznacza koniec zwolnienia i pozwala normalnie wznowić modlitwę, bez konieczności odrabiania modlitw opuszczonych w czasie menstruacji.',
    visual2Title: 'Rytuał oczyszczenia',
    visual2Text: 'Dokładny sposób wykonywania gusl może się nieznacznie różnić w zależności od przestrzeganej szkoły prawa.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Jeśli nie znasz dokładnych kroków stosowanych w Twojej szkole, zaufana osoba lub wykwalifikowany uczony wyjaśni Ci je jasno.',
    section5Body: 'Często pojawiają się wątpliwości, kiedy menstruacja naprawdę się skończyła, zwłaszcza gdy krwawienie słabnie stopniowo, a nie ustaje nagle.',
    checkList2Title: 'Kilka pomocnych wskazówek',
    doubtMarkers: [
      'Zaobserwuj całkowity brak krwawienia, a nie tylko jego osłabienie',
      'Poczekaj wystarczająco długo, zanim uznasz, że menstruacja się skończyła',
      'Opieraj się na wyraźnej obserwacji, a nie na samym wrażeniu',
      'Uwzględnij swój zwykły rytm, który może się różnić w poszczególnych cyklach',
    ],
    alert2Title: 'Ważna informacja',
    alert2Text: 'W przypadku przedłużającego się lub nieregularnego krwawienia albo uporczywych wątpliwości takie sytuacje warto omówić z wykwalifikowanym uczonym, który może pokierować Cię zgodnie z Twoją osobistą sytuacją. Ta treść pozostaje informacyjna i nie zastępuje indywidualnych wskazówek religijnych.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Te znaczniki to ogólne przypomnienia edukacyjne. Każda sytuacja może mieć swoje szczególne cechy: w razie wątpliwości rozmowa z wykwalifikowanym uczonym pozostaje najlepszym źródłem odpowiedzi dopasowanej do Twojej sytuacji.',
    shareMessage: 'Stan czystości: podstawy — AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЦІЯ І ЧИСТОТА',
    title: 'Стан чистоти:\nоснови',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Розуміння зв’язку між циклом і станом ритуальної чистоти, щоб із більшою ясністю підходити до цього часу.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Розуміння, що означає ритуальна чистота',
      'Менструація та звільнення від богослужіння',
      'Після менструації: розпізнавання повернення до чистоти',
      'Гусль: розуміння його ролі',
      'Що робити, коли ви не впевнені?',
      'Головні висновки',
    ],
    section1Body: 'В ісламській традиції ритуальна чистота (тахара) означає стан, потрібний для виконання певних актів богослужіння, як-от молитва. Йдеться не про чистоту в повсякденному розумінні, а про певний стан, визнаний фікхом, що змінюється залежно від етапів жіночого циклу.',
    section2Body: 'Під час менструації жінка звільняється від певних актів богослужіння, зокрема від молитви та посту Рамадану, який можна відпрацювати пізніше. Це звільнення визнається полегшенням, а не покаранням.',
    checkList1Title: 'Що залишається доступним під час менструації',
    duringPeriod: [
      'Зікр (згадування Бога) та прохання (дуа)',
      'Слухання або читання навчального й духовного вмісту',
      'Підтримка релігійної практики близьких',
      'Релігійні роздуми та навчання',
    ],
    noteTitle: 'Зверніть увагу',
    noteText: 'Деякі подробиці (як-от безпосереднє читання Корану чи вхід до мечеті) можуть відрізнятися залежно від школи правознавства; у цих конкретних випадках найкраще звернутися до думки, якої ви зазвичай дотримуєтеся, або до кваліфікованого вченого.',
    section3Body: 'Завершення менструації означає поступове повернення до стану ритуальної чистоти. Фізично це відповідає припиненню кровотечі — орієнтиру, який різні вчені традиції можуть визначати з дещо відмінними нюансами.',
    visual1Title: 'Фізіологічний процес',
    visual1Text: 'Розуміння етапів циклу допомагає краще визначити момент, коли менструація справді закінчується.',
    section3Body2: 'Щойно цей орієнтир спостережено, гусль (велике обмивання) дозволяє повернутися до ритуальної чистоти й відновити призупинені акти богослужіння.',
    section4Body: 'Гусль — велике ритуальне обмивання, що полягає в омиванні всього тіла з наміром очиститися. Він знаменує кінець звільнення й дозволяє нормально відновити молитву, без потреби відпрацьовувати молитви, пропущені під час менструації.',
    visual2Title: 'Ритуал очищення',
    visual2Text: 'Точний спосіб виконання гуслю може трохи відрізнятися залежно від школи правознавства, якої дотримуються.',
    tip1Title: 'Варто знати',
    tip1Text: 'Якщо ви не знаєте точних кроків, яких дотримуються у вашій школі, довірена людина або кваліфікований вчений зможе чітко їх пояснити.',
    section5Body: 'Поширені сумніви щодо того, коли менструація справді закінчилася, особливо коли кровотеча поступово слабшає, а не припиняється раптово.',
    checkList2Title: 'Кілька корисних орієнтирів',
    doubtMarkers: [
      'Спостерігайте повну відсутність кровотечі, а не лише її зменшення',
      'Дайте достатньо часу, перш ніж робити висновок, що менструація закінчилася',
      'Спирайтеся на чітке спостереження, а не лише на враження',
      'Враховуйте власний звичний ритм, який може відрізнятися від циклу до циклу',
    ],
    alert2Title: 'Важлива інформація',
    alert2Text: 'У разі тривалої чи нерегулярної кровотечі або стійких сумнівів такі ситуації варто обговорити з кваліфікованим вченим, який зможе спрямувати вас відповідно до вашої особистої ситуації. Цей вміст залишається інформаційним і не замінює індивідуальних релігійних настанов.',
    tip2Title: 'Варто знати',
    tip2Text: 'Ці орієнтири — загальні навчальні нагадування. Кожна ситуація може мати свої особливості: у разі сумнівів діалог із кваліфікованим вченим залишається найкращим джерелом відповіді, що відповідає вашій ситуації.',
    shareMessage: 'Стан чистоти: основи — AWA',
  },
  cs: {
    badge: 'MENSTRUACE A ČISTOTA',
    title: 'Stav čistoty:\nzáklady',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Pochopení souvislosti mezi cyklem a stavem rituální čistoty, abyste k tomuto období přistupovala s větší jasností.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopení, co rituální čistota znamená',
      'Menstruace a osvobození od bohoslužby',
      'Po menstruaci: rozpoznání návratu k čistotě',
      'Ghusl: pochopení jeho role',
      'Co dělat, když si nejste jistá?',
      'Hlavní poznatky',
    ],
    section1Body: 'V islámské tradici označuje rituální čistota (tahára) stav požadovaný k vykonávání určitých úkonů bohoslužby, například modlitby. Nejde o čistotu v běžném smyslu, ale o specifický stav uznávaný fiqhem, který se mění podle fází ženského cyklu.',
    section2Body: 'Během menstruace je žena osvobozena od určitých úkonů bohoslužby, zejména od modlitby a ramadánského půstu, který lze později nahradit. Toto osvobození je uznáváno jako úleva, nikoli jako trest.',
    checkList1Title: 'Co zůstává dostupné během menstruace',
    duringPeriod: [
      'Dhikr (vzpomínání na Boha) a prosby (du‘á)',
      'Poslech nebo čtení vzdělávacího a duchovního obsahu',
      'Podpora náboženské praxe svých blízkých',
      'Náboženské zamyšlení a učení',
    ],
    noteTitle: 'Upozornění',
    noteText: 'Některé podrobnosti (například přímé čtení Koránu nebo přístup do mešity) se mohou lišit podle právní školy; pro tyto konkrétní případy je nejlepší obrátit se na názor, který obvykle sledujete, nebo na kvalifikovaného učence.',
    section3Body: 'Konec menstruace označuje postupný návrat do stavu rituální čistoty. Fyzicky odpovídá ukončení krvácení, což je ukazatel, který různé učenecké tradice mohou vymezovat s mírně odlišnými nuancemi.',
    visual1Title: 'Fyziologický proces',
    visual1Text: 'Porozumění fázím cyklu vám pomáhá lépe rozpoznat okamžik, kdy menstruace skutečně končí.',
    section3Body2: 'Jakmile je tento ukazatel pozorován, ghusl (velká očista) umožňuje vrátit se ke stavu rituální čistoty a obnovit úkony bohoslužby, které byly pozastaveny.',
    section4Body: 'Ghusl je velká rituální očista, při které se omyje celé tělo se záměrem očistit se. Označuje konec osvobození a umožňuje normálně obnovit modlitbu, aniž by bylo nutné nahrazovat modlitby vynechané během menstruace.',
    visual2Title: 'Očistný rituál',
    visual2Text: 'Přesný způsob provedení ghuslu se může mírně lišit podle zvolené právní školy.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Pokud neznáte přesné kroky dodržované ve své škole, může vám je jasně vysvětlit někdo, komu důvěřujete, nebo kvalifikovaný učenec.',
    section5Body: 'Je běžné pochybovat, kdy menstruace skutečně skončila, zejména když krvácení postupně slábne, místo aby náhle ustalo.',
    checkList2Title: 'Několik užitečných orientačních bodů',
    doubtMarkers: [
      'Sledujte úplnou nepřítomnost krvácení, nikoli pouhé zeslabení',
      'Nechte uplynout dostatek času, než usoudíte, že menstruace skončila',
      'Spoléhejte na jasné pozorování místo pouhého dojmu',
      'Zohledněte svůj vlastní obvyklý rytmus, který se může cyklus od cyklu lišit',
    ],
    alert2Title: 'Důležitá informace',
    alert2Text: 'V případě dlouhodobého nebo nepravidelného krvácení či přetrvávající pochybnosti si tyto situace zaslouží rozhovor s kvalifikovaným učencem, který vás může vést podle vaší osobní situace. Tento obsah zůstává informativní a nenahrazuje individuální náboženské vedení.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Tyto orientační body jsou obecnými vzdělávacími připomenutími. Každá situace může mít svá specifika: v případě pochybností zůstává nejlepším zdrojem pro odpověď přizpůsobenou vaší situaci dialog s kvalifikovaným učencem.',
    shareMessage: 'Stav čistoty: základy — AWA',
  },
  sk: {
    badge: 'MENŠTRUÁCIA A ČISTOTA',
    title: 'Stav čistoty:\nzáklady',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Pochopenie vzťahu medzi cyklom a stavom rituálnej čistoty, aby ste toto obdobie prežívali s väčšou jasnosťou.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopenie, čo znamená rituálna čistota',
      'Menštruácia a oslobodenie od bohoslužby',
      'Po menštruácii: rozpoznanie návratu k čistote',
      'Ghusl: pochopenie jeho úlohy',
      'Čo robiť, keď si nie ste istá?',
      'Hlavné body',
    ],
    section1Body: 'V islamskej tradícii rituálna čistota (tahára) označuje stav požadovaný na vykonávanie určitých úkonov bohoslužby, ako je modlitba. Nejde o čistotu v bežnom zmysle, ale o osobitný stav uznaný fiqhom, ktorý sa mení podľa etáp ženského cyklu.',
    section2Body: 'Počas menštruácie je žena oslobodená od určitých úkonov bohoslužby, najmä od modlitby a ramadánového pôstu, ktorý sa dá neskôr nahradiť. Toto oslobodenie sa uznáva ako úľava, nie ako trest.',
    checkList1Title: 'Čo zostáva počas menštruácie prístupné',
    duringPeriod: [
      'Dhikr (pripomínanie si Boha) a prosby (du‘á)',
      'Počúvanie alebo čítanie vzdelávacieho a duchovného obsahu',
      'Podpora náboženskej praxe vašich blízkych',
      'Náboženské zamyslenie a učenie sa',
    ],
    noteTitle: 'Upozornenie',
    noteText: 'Niektoré podrobnosti (ako priame čítanie Koránu alebo vstup do mešity) sa môžu líšiť podľa právnej školy; v týchto konkrétnych prípadoch je najlepšie vychádzať z názoru, ktorý zvyčajne nasledujete, alebo sa poradiť s kvalifikovaným učencom.',
    section3Body: 'Koniec menštruácie označuje postupný návrat do stavu rituálnej čistoty. Fyzicky to zodpovedá zastaveniu krvácania, orientačnému bodu, ktorý môžu rôzne učenecké tradície definovať s mierne odlišnými nuansami.',
    visual1Title: 'Fyziologický proces',
    visual1Text: 'Pochopenie etáp cyklu vám pomáha lepšie určiť okamih, kedy menštruácia skutočne končí.',
    section3Body2: 'Keď je tento orientačný bod pozorovaný, ghusl (veľké obmytie) umožňuje návrat k rituálnej čistote a obnovenie úkonov bohoslužby, ktoré boli prerušené.',
    section4Body: 'Ghusl je veľké rituálne obmytie, pri ktorom sa umýva celé telo s úmyslom očistiť sa. Označuje koniec oslobodenia a umožňuje normálne obnoviť modlitbu, pričom nie je potrebné nahrádzať modlitby vynechané počas menštruácie.',
    visual2Title: 'Očistný rituál',
    visual2Text: 'Presný spôsob vykonania ghuslu sa môže mierne líšiť podľa nasledovanej právnej školy.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Ak nepoznáte presné kroky dodržiavané vo vašej škole, osoba, ktorej dôverujete, alebo kvalifikovaný učenec vám ich jasne vysvetlí.',
    section5Body: 'Je bežné pociťovať pochybnosť o tom, kedy menštruácia skutočne skončila, najmä keď krvácanie postupne slabne, namiesto aby sa náhle zastavilo.',
    checkList2Title: 'Niekoľko užitočných orientačných bodov',
    doubtMarkers: [
      'Sledujte úplnú absenciu krvácania, nielen jeho zmenšenie',
      'Nechajte uplynúť dostatok času, kým usúdite, že menštruácia skončila',
      'Spoliehajte sa na jasné pozorovanie, nie na obyčajný dojem',
      'Zohľadnite svoj vlastný obvyklý rytmus, ktorý sa môže z cyklu na cyklus líšiť',
    ],
    alert2Title: 'Dôležitá informácia',
    alert2Text: 'V prípade dlhotrvajúceho alebo nepravidelného krvácania, alebo pretrvávajúcej pochybnosti si tieto situácie zaslúžia rozhovor s kvalifikovaným učencom, ktorý vás môže usmerniť podľa vašej osobnej situácie. Tento obsah zostáva informatívny a nenahrádza individuálne náboženské usmernenie.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Tieto orientačné body sú všeobecné vzdelávacie pripomienky. Každá situácia môže mať svoje osobitosti: v prípade pochybností zostáva dialóg s kvalifikovaným učencom najlepším zdrojom odpovede vhodnej pre vašu situáciu.',
    shareMessage: 'Stav čistoty: základy — AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓ ÉS TISZTASÁG',
    title: 'A tisztasági állapot:\naz alapok',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A ciklus és a rituális tisztasági állapot közötti kapcsolat megértése, hogy világosabban közelíthess ehhez az időszakhoz.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A rituális tisztaság jelentésének megértése',
      'Menstruáció és felmentés az istentisztelet alól',
      'A menstruáció után: a tisztasághoz való visszatérés felismerése',
      'A ghusl: a szerepének megértése',
      'Mit tegyél, ha nem vagy biztos?',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'Az iszlám hagyományban a rituális tisztaság (tahára) az istentisztelet egyes cselekményeinek, például az imának a végzéséhez szükséges állapotot jelöli. Nem a hétköznapi értelemben vett tisztaságot jelenti, hanem a fiqh által elismert sajátos állapotot, amely a női ciklus szakaszai szerint változik.',
    section2Body: 'A menstruáció alatt a nő felmentést kap az istentisztelet bizonyos cselekményei alól, különösen az ima és a ramadáni böjt alól, utóbbit később be lehet pótolni. Ez a felmentés könnyítésként ismert el, nem büntetésként.',
    checkList1Title: 'Ami a menstruáció alatt elérhető marad',
    duringPeriod: [
      'Dhikr (Isten emlegetése) és könyörgések (du‘á)',
      'Ismeretterjesztő és spirituális tartalmak hallgatása vagy olvasása',
      'A hozzád közel állók vallási gyakorlatának támogatása',
      'Vallási elmélkedés és tanulás',
    ],
    noteTitle: 'Figyelem',
    noteText: 'Egyes részletek (például a Korán közvetlen olvasása vagy a mecsetbe való belépés) a jogi iskolától függően eltérhetnek; ezekben a konkrét esetekben a legjobb a szokásosan követett véleményre vagy egy kvalifikált tudósra hagyatkozni.',
    section3Body: 'A menstruáció vége a rituális tisztasági állapothoz való fokozatos visszatérést jelzi. Fizikailag ez a vérzés megszűnésének felel meg — ezt a támpontot a különböző tudósi hagyományok kissé eltérő árnyalatokkal határozhatják meg.',
    visual1Title: 'Élettani folyamat',
    visual1Text: 'A ciklus szakaszainak megértése segít jobban azonosítani azt a pillanatot, amikor a menstruáció ténylegesen véget ér.',
    section3Body2: 'Miután ezt a támpontot megfigyelted, a ghusl (nagy mosakodás) lehetővé teszi a rituális tisztasághoz való visszatérést és a felfüggesztett istentiszteleti cselekmények folytatását.',
    section4Body: 'A ghusl nagy rituális mosakodás, amelynek során az egész testet megmossák a megtisztulás szándékával. Jelzi a felmentés végét, és lehetővé teszi az ima normális folytatását, anélkül, hogy a menstruáció alatt kihagyott imákat be kellene pótolni.',
    visual2Title: 'Megtisztulási rituálé',
    visual2Text: 'A ghusl pontos elvégzési módja a követett jogi iskolától függően kissé eltérhet.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ha nem ismered az iskolád által követett pontos lépéseket, egy megbízható személy vagy egy kvalifikált tudós világosan el tudja magyarázni őket.',
    section5Body: 'Gyakori a kétség arról, hogy a menstruáció valóban véget ért-e, különösen akkor, ha a vérzés fokozatosan csökken, ahelyett hogy hirtelen megszűnne.',
    checkList2Title: 'Néhány hasznos támpont',
    doubtMarkers: [
      'Figyeld a vérzés teljes hiányát, ne csak a csökkenését',
      'Hagyj elegendő időt, mielőtt arra a következtetésre jutsz, hogy a menstruáció véget ért',
      'Támaszkodj világos megfigyelésre, ne puszta benyomásra',
      'Vedd figyelembe a saját szokásos ritmusodat, amely ciklusról ciklusra eltérhet',
    ],
    alert2Title: 'Fontos információ',
    alert2Text: 'Hosszan tartó vagy szabálytalan vérzés, illetve tartós kétség esetén ezeket a helyzeteket érdemes egy kvalifikált tudóssal megbeszélni, aki a személyes helyzeted szerint tud eligazítani. Ez a tartalom tájékoztató jellegű marad, és nem helyettesíti az egyéni vallási útmutatást.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'Ezek a támpontok általános ismeretterjesztő emlékeztetők. Minden helyzetnek lehetnek sajátosságai: kétség esetén a kvalifikált tudóssal folytatott párbeszéd marad a legjobb forrás a helyzetedhez illő válaszhoz.',
    shareMessage: 'A tisztasági állapot: az alapok — AWA',
  },
  ro: {
    badge: 'MENSTRUAȚIE ȘI PURITATE',
    title: 'Starea de puritate:\nnoțiuni de bază',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Înțelegerea legăturii dintre ciclu și starea de puritate rituală, pentru a aborda această perioadă cu mai multă claritate.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Înțelegerea a ceea ce înseamnă puritatea rituală',
      'Menstruația și scutirea de la cult',
      'După menstruație: recunoașterea revenirii la puritate',
      'Ghusl: înțelegerea rolului său',
      'Ce faci când nu ești sigură?',
      'Ce să reții',
    ],
    section1Body: 'În tradiția islamică, puritatea rituală (tahara) desemnează starea necesară pentru a îndeplini anumite acte de cult, precum rugăciunea. Ea nu se referă la curățenie în sensul obișnuit, ci la o stare specifică recunoscută de fiqh, care se schimbă în funcție de etapele ciclului feminin.',
    section2Body: 'În timpul menstruației, femeia este scutită de anumite acte de cult, în special de rugăciune și de postul din Ramadan, care pot fi recuperate mai târziu. Această scutire este recunoscută ca o ușurare, nu ca o pedeapsă.',
    checkList1Title: 'Ce rămâne accesibil în timpul menstruației',
    duringPeriod: [
      'Dhikr (pomenirea lui Dumnezeu) și rugăciunile de cerere (du’a)',
      'Ascultarea sau citirea de conținut educativ și spiritual',
      'Sprijinirea practicii religioase a celor apropiați',
      'Reflecția religioasă și învățarea',
    ],
    noteTitle: 'Atenție',
    noteText: 'Unele detalii (precum citirea directă a Coranului sau accesul la moschee) pot varia în funcție de școala de jurisprudență; este mai bine să te raportezi la părerea pe care o urmezi de obicei sau la un savant calificat pentru aceste cazuri specifice.',
    section3Body: 'Sfârșitul menstruației marchează revenirea treptată la starea de puritate rituală. Fizic, aceasta corespunde opririi sângerării, un reper pe care diferitele tradiții savante îl pot defini cu nuanțe ușor diferite.',
    visual1Title: 'Un proces fiziologic',
    visual1Text: 'Înțelegerea etapelor ciclului te ajută să identifici mai bine momentul în care menstruația se încheie efectiv.',
    section3Body2: 'Odată ce acest reper a fost observat, ghusl (abluțiunea majoră) permite revenirea la puritatea rituală și reluarea actelor de cult care fuseseră suspendate.',
    section4Body: 'Ghusl este o abluțiune rituală majoră care constă în spălarea întregului corp cu intenția de a te purifica. Ea marchează sfârșitul scutirii și permite reluarea normală a rugăciunii, fără a fi necesar să recuperezi rugăciunile ratate în timpul menstruației.',
    visual2Title: 'Un ritual de purificare',
    visual2Text: 'Modul precis în care se efectuează ghusl poate varia ușor în funcție de școala de jurisprudență urmată.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Dacă nu cunoști pașii preciși urmați în școala ta, o persoană în care ai încredere sau un savant calificat ți-i va putea explica clar.',
    section5Body: 'Este frecvent să simți îndoială cu privire la momentul în care menstruația s-a încheiat cu adevărat, mai ales când sângerarea scade treptat în loc să se oprească brusc.',
    checkList2Title: 'Câteva repere utile',
    doubtMarkers: [
      'Observă absența totală a sângerării, nu doar o scădere',
      'Lasă să treacă suficient timp înainte de a concluziona că menstruația s-a încheiat',
      'Bazează-te pe o observație clară, nu pe o simplă impresie',
      'Ține cont de propriul tău ritm obișnuit, care poate varia de la un ciclu la altul',
    ],
    alert2Title: 'Informație importantă',
    alert2Text: 'În cazul sângerărilor prelungite sau neregulate ori al unei îndoieli persistente, aceste situații merită discutate cu un savant calificat, care te poate îndruma în funcție de situația ta personală. Acest conținut rămâne informativ și nu înlocuiește o îndrumare religioasă individualizată.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Aceste repere sunt amintiri educative generale. Fiecare situație poate avea particularitățile ei: în caz de îndoială, dialogul cu un savant calificat rămâne cea mai bună resursă pentru un răspuns adaptat situației tale.',
    shareMessage: 'Starea de puritate: noțiuni de bază — AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЦИЯ И ЧИСТОТА',
    title: 'Състояние на чистота:\nосновите',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Разбиране на връзката между цикъла и състоянието на ритуална чистота, за да подходиш към това време с повече яснота.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Разбиране на значението на ритуалната чистота',
      'Менструацията и освобождаването от богослужение',
      'След менструацията: разпознаване на връщането към чистота',
      'Гусл: разбиране на ролята му',
      'Какво да направиш, когато не си сигурна?',
      'Какво да запомниш',
    ],
    section1Body: 'В ислямската традиция ритуалната чистота (тахара) означава състоянието, необходимо за извършване на определени актове на богослужение, като молитвата. Тя не се отнася до чистотата в ежедневния смисъл, а до специфично състояние, признато от фикха, което се променя според етапите на женския цикъл.',
    section2Body: 'По време на менструация жената е освободена от определени актове на богослужение, по-специално от молитвата и поста през Рамадан, които могат да се наваксат по-късно. Това освобождаване е признато като облекчение, а не като наказание.',
    checkList1Title: 'Какво остава достъпно по време на менструация',
    duringPeriod: [
      'Зикр (споменаване на Бога) и молитви за молба (дуа)',
      'Слушане или четене на образователно и духовно съдържание',
      'Подкрепа на религиозната практика на близките',
      'Религиозно размишление и учене',
    ],
    noteTitle: 'Обърни внимание',
    noteText: 'Някои подробности (като директното четене на Корана или достъпът до джамията) могат да варират според школата на правото; най-добре е за тези конкретни случаи да се позовеш на мнението, което обикновено следваш, или на квалифициран учен.',
    section3Body: 'Краят на менструацията бележи постепенното връщане към състоянието на ритуална чистота. Физически това съответства на спирането на кървенето, ориентир, който различните учени традиции могат да определят с леко различни нюанси.',
    visual1Title: 'Физиологичен процес',
    visual1Text: 'Разбирането на етапите на цикъла ти помага да определиш по-добре момента, в който менструацията наистина приключва.',
    section3Body2: 'След като този ориентир е наблюдаван, гуслът (големият абдест) позволява да се върнеш към ритуалната чистота и да възобновиш актовете на богослужение, които са били прекратени.',
    section4Body: 'Гуслът е голямо ритуално измиване, което се състои в измиване на цялото тяло с намерението да се очистиш. Той бележи края на освобождаването и позволява молитвата да се възобнови нормално, без да е необходимо да наваксваш молитвите, пропуснати по време на менструацията.',
    visual2Title: 'Ритуал на очистване',
    visual2Text: 'Точният начин, по който се извършва гуслът, може леко да варира според следваната школа на правото.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Ако не знаеш точните стъпки, следвани в твоята школа, човек, на когото се доверяваш, или квалифициран учен ще може да ти ги обясни ясно.',
    section5Body: 'Често е да изпитваш съмнение кога менструацията наистина е приключила, особено когато кървенето намалява постепенно, вместо да спре внезапно.',
    checkList2Title: 'Някои полезни ориентири',
    doubtMarkers: [
      'Наблюдавай пълното отсъствие на кървене, а не само намаляване',
      'Остави да мине достатъчно време, преди да заключиш, че менструацията е приключила',
      'Разчитай на ясно наблюдение, а не на просто впечатление',
      'Вземи предвид собствения си обичаен ритъм, който може да варира от цикъл на цикъл',
    ],
    alert2Title: 'Важна информация',
    alert2Text: 'При продължително или нередовно кървене или упорито съмнение тези ситуации заслужават да бъдат обсъдени с квалифициран учен, който може да те насочи според личната ти ситуация. Това съдържание остава информативно и не замества индивидуализирани религиозни насоки.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Тези ориентири са общи образователни напомняния. Всяка ситуация може да има своите особености: при съмнение диалогът с квалифициран учен остава най-добрият ресурс за отговор, подходящ за ситуацията ти.',
    shareMessage: 'Състояние на чистота: основите — AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЦИЈА И ЧИСТОТА',
    title: 'Стање чистоте:\nоснове',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Разумевање везе између циклуса и стања ритуалне чистоте, да овом времену приђеш са више јасноће.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Разумевање значења ритуалне чистоте',
      'Менструација и ослобађање од богослужења',
      'После менструације: препознавање повратка чистоте',
      'Гусл: разумевање његове улоге',
      'Шта урадити када ниси сигурна?',
      'Шта да запамтиш',
    ],
    section1Body: 'У исламској традицији ритуална чистота (тахара) означава стање потребно за обављање одређених дела богослужења, као што је молитва. Она се не односи на чистоћу у свакодневном смислу, већ на посебно стање које признаје фикх и које се мења према фазама женског циклуса.',
    section2Body: 'Током менструације жена је ослобођена одређених дела богослужења, нарочито молитве и поста у Рамазану, који се могу накнадно надокнадити. Ово ослобађање се признаје као олакшање, а не као казна.',
    checkList1Title: 'Шта остаје доступно током менструације',
    duringPeriod: [
      'Зикр (спомињање Бога) и молбе (дуа)',
      'Слушање или читање образовног и духовног садржаја',
      'Подржавање верске праксе људи око тебе',
      'Верско размишљање и учење',
    ],
    noteTitle: 'Обрати пажњу',
    noteText: 'Неке појединости (као што су директно читање Корана или приступ џамији) могу варирати зависно од правне школе; за ове посебне случајеве најбоље је обратити се мишљењу које уобичајено пратиш или квалификованом учењаку.',
    section3Body: 'Крај менструације означава постепени повратак у стање ритуалне чистоте. Физички то одговара престанку крварења, ознаци коју различите учењачке традиције могу одређивати са благо различитим нијансама.',
    visual1Title: 'Физиолошки процес',
    visual1Text: 'Разумевање фаза циклуса помаже ти да боље одредиш тренутак када менструација заиста престаје.',
    section3Body2: 'Када се ова ознака уочи, гусл (велико абдест) омогућава повратак у ритуалну чистоту и настављање дела богослужења која су била преустављена.',
    section4Body: 'Гусл је велико ритуално умивање које се састоји у прању целог тела са намером очишћења. Он означава крај ослобађања и омогућава да се молитва нормално настави, без потребе да се надокнађују молитве пропуштене током менструације.',
    visual2Title: 'Ритуал очишћења',
    visual2Text: 'Прецизан начин извођења гусла може се благо разликовати зависно од правне школе коју пратиш.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Ако не знаш прецизне кораке који се прате у твојој школи, особа којој верујеш или квалификовани учењак моћи ће ти их јасно објаснити.',
    section5Body: 'Уобичајено је осећати сумњу када је менструација заиста престала, нарочито када се крварење постепено смањује уместо да изненада стане.',
    checkList2Title: 'Неке корисне ознаке',
    doubtMarkers: [
      'Посматрај потпуно одсуство крварења, а не само смањење',
      'Остави довољно времена пре него што закључиш да је менструација престала',
      'Ослони се на јасно запажање, а не на пуки утисак',
      'Узми у обзир сопствени уобичајени ритам, који може варирати од циклуса до циклуса',
    ],
    alert2Title: 'Важна информација',
    alert2Text: 'У случајевима дуготрајног или нередовног крварења или упорне сумње, ове ситуације заслужују да се размотре са квалификованим учењаком, који те може усмерити према твојој личној ситуацији. Овај садржај остаје информативан и не замењује индивидуализоване верске смернице.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Ове ознаке су опште образовне подсетнице. Свака ситуација може имати своје посебности: при сумњи, дијалог са квалификованим учењаком остаје најбољи ресурс за одговор прилагођен твојој ситуацији.',
    shareMessage: 'Стање чистоте: основе — AWA',
  },
  hr: {
    badge: 'MENSTRUACIJA I ČISTOĆA',
    title: 'Stanje čistoće:\nosnove',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Razumijevanje veze između ciklusa i stanja ritualne čistoće, kako bi tom razdoblju pristupila s više jasnoće.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje značenja ritualne čistoće',
      'Menstruacija i oslobođenje od bogoslužja',
      'Nakon menstruacije: prepoznavanje povratka čistoće',
      'Gusl: razumijevanje njegove uloge',
      'Što učiniti kad nisi sigurna?',
      'Ključne poruke',
    ],
    section1Body: 'U islamskoj tradiciji ritualna čistoća (tahara) označava stanje potrebno za obavljanje određenih bogoslužnih čina, poput molitve. Ne odnosi se na čistoću u svakodnevnom smislu, nego na određeno stanje koje priznaje fikh, a koje se mijenja prema fazama ženskog ciklusa.',
    section2Body: 'Tijekom menstruacije žena je oslobođena određenih bogoslužnih čina, osobito molitve i posta u Ramazanu, koji se može nadoknaditi kasnije. To se oslobođenje priznaje kao olakšica, a ne kao kazna.',
    checkList1Title: 'Što ostaje dostupno tijekom menstruacije',
    duringPeriod: [
      'Zikr (spominjanje Boga) i dove (molitve molbe)',
      'Slušanje ili čitanje edukativnog i duhovnog sadržaja',
      'Podupiranje vjerske prakse ljudi oko sebe',
      'Vjersko promišljanje i učenje',
    ],
    noteTitle: 'Napomena',
    noteText: 'Neke pojedinosti (poput izravnog čitanja Kur’ana ili ulaska u džamiju) mogu se razlikovati ovisno o pravnoj školi; u tim je posebnim slučajevima najbolje oslanjati se na mišljenje koje obično slijediš ili na kvalificiranog učenjaka.',
    section3Body: 'Kraj menstruacije označava postupan povratak u stanje ritualne čistoće. Fizički to odgovara prestanku krvarenja, pokazatelju koji različite učenjačke tradicije mogu definirati s neznatno različitim nijansama.',
    visual1Title: 'Fiziološki proces',
    visual1Text: 'Razumijevanje faza ciklusa pomaže ti bolje prepoznati trenutak kad menstruacija zaista završava.',
    section3Body2: 'Nakon što je taj pokazatelj uočen, gusl (veliko pranje) omogućuje povratak u stanje ritualne čistoće i nastavak bogoslužnih čina koji su bili prekinuti.',
    section4Body: 'Gusl je veliko ritualno pranje koje uključuje pranje cijelog tijela s namjerom čišćenja. Označava kraj oslobođenja i omogućuje normalan nastavak molitve, bez potrebe da se nadoknade molitve propuštene tijekom menstruacije.',
    visual2Title: 'Ritual pročišćenja',
    visual2Text: 'Točan način izvođenja gusla može se neznatno razlikovati ovisno o pravnoj školi koja se slijedi.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako ne znaš točne korake koji se slijede u tvojoj školi, osoba kojoj vjeruješ ili kvalificirani učenjak jasno će ti ih objasniti.',
    section5Body: 'Uobičajeno je sumnjati kada je menstruacija doista završila, osobito kad se krvarenje postupno smanjuje umjesto da naglo prestane.',
    checkList2Title: 'Neki korisni pokazatelji',
    doubtMarkers: [
      'Promatraj potpuni izostanak krvarenja, a ne samo smanjenje',
      'Ostavi dovoljno vremena prije zaključka da je menstruacija završila',
      'Oslanjaj se na jasno opažanje, a ne na puki dojam',
      'Uzmi u obzir vlastiti uobičajeni ritam, koji se može razlikovati od ciklusa do ciklusa',
    ],
    alert2Title: 'Važna informacija',
    alert2Text: 'U slučaju dugotrajnog ili nepravilnog krvarenja ili trajne sumnje, o tim situacijama vrijedi razgovarati s kvalificiranim učenjakom, koji te može usmjeriti prema tvojoj osobnoj situaciji. Ovaj sadržaj ostaje informativan i ne zamjenjuje individualno vjersko vodstvo.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Ti su pokazatelji opći edukativni podsjetnici. Svaka situacija može imati svoje posebnosti: u slučaju sumnje, dijalog s kvalificiranim učenjakom ostaje najbolji izvor odgovora prilagođenog tvojoj situaciji.',
    shareMessage: 'Stanje čistoće: osnove — AWA',
  },
  bs: {
    badge: 'MENSTRUACIJA I ČISTOĆA',
    title: 'Stanje čistoće:\nosnove',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Razumijevanje veze između ciklusa i stanja ritualne čistoće, kako bi tom razdoblju pristupila s više jasnoće.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje značenja ritualne čistoće',
      'Menstruacija i oslobođenje od bogoslužja',
      'Nakon menstruacije: prepoznavanje povratka čistoće',
      'Gusl: razumijevanje njegove uloge',
      'Što učiniti kad nisi sigurna?',
      'Ključne poruke',
    ],
    section1Body: 'U islamskoj tradiciji ritualna čistoća (tahara) označava stanje potrebno za obavljanje određenih bogoslužnih čina, poput molitve. Ne odnosi se na čistoću u svakodnevnom smislu, nego na određeno stanje koje priznaje fikh, a koje se mijenja prema fazama ženskog ciklusa.',
    section2Body: 'Tokom menstruacije žena je oslobođena određenih bogoslužnih čina, osobito molitve i posta u Ramazanu, koji se može nadoknaditi kasnije. To se oslobođenje priznaje kao olakšica, a ne kao kazna.',
    checkList1Title: 'Što ostaje dostupno tokom menstruacije',
    duringPeriod: [
      'Zikr (spominjanje Boga) i dove (molitve molbe)',
      'Slušanje ili čitanje edukativnog i duhovnog sadržaja',
      'Podupiranje vjerske prakse ljudi oko sebe',
      'Vjersko promišljanje i učenje',
    ],
    noteTitle: 'Napomena',
    noteText: 'Neke pojedinosti (poput izravnog čitanja Kur’ana ili ulaska u džamiju) mogu se razlikovati ovisno o pravnoj školi; u tim je posebnim slučajevima najbolje oslanjati se na mišljenje koje obično slijediš ili na kvalificiranog učenjaka.',
    section3Body: 'Kraj menstruacije označava postupan povratak u stanje ritualne čistoće. Fizički to odgovara prestanku krvarenja, pokazatelju koji različite učenjačke tradicije mogu definirati s neznatno različitim nijansama.',
    visual1Title: 'Fiziološki proces',
    visual1Text: 'Razumijevanje faza ciklusa pomaže ti bolje prepoznati trenutak kad menstruacija zaista završava.',
    section3Body2: 'Nakon što je taj pokazatelj uočen, gusl (veliko pranje) omogućuje povratak u stanje ritualne čistoće i nastavak bogoslužnih čina koji su bili prekinuti.',
    section4Body: 'Gusl je veliko ritualno pranje koje uključuje pranje cijelog tijela s namjerom čišćenja. Označava kraj oslobođenja i omogućuje normalan nastavak molitve, bez potrebe da se nadoknade molitve propuštene tokom menstruacije.',
    visual2Title: 'Ritual pročišćenja',
    visual2Text: 'Točan način izvođenja gusla može se neznatno razlikovati ovisno o pravnoj školi koja se slijedi.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Ako ne znaš tačne korake koji se slijede u tvojoj školi, osoba kojoj vjeruješ ili kvalificirani učenjak jasno će ti ih objasniti.',
    section5Body: 'Uobičajeno je sumnjati kada je menstruacija doista završila, osobito kad se krvarenje postupno smanjuje umjesto da naglo prestane.',
    checkList2Title: 'Neki korisni pokazatelji',
    doubtMarkers: [
      'Promatraj potpuni izostanak krvarenja, a ne samo smanjenje',
      'Ostavi dovoljno vremena prije zaključka da je menstruacija završila',
      'Oslanjaj se na jasno opažanje, a ne na puki dojam',
      'Uzmi u obzir vlastiti uobičajeni ritam, koji se može razlikovati od ciklusa do ciklusa',
    ],
    alert2Title: 'Važna informacija',
    alert2Text: 'U slučaju dugotrajnog ili nepravilnog krvarenja ili trajne sumnje, o tim situacijama vrijedi razgovarati s kvalificiranim učenjakom, koji te može usmjeriti prema tvojoj osobnoj situaciji. Ovaj sadržaj ostaje informativan i ne zamjenjuje individualno vjersko vodstvo.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Ti su pokazatelji opći edukativni podsjetnici. Svaka situacija može imati svoje posebnosti: u slučaju sumnje, dijalog s kvalificiranim učenjakom ostaje najbolji izvor odgovora prilagođenog tvojoj situaciji.',
    shareMessage: 'Stanje čistoće: osnove — AWA',
  },
  sl: {
    badge: 'MENSTRUACIJA IN ČISTOST',
    title: 'Stanje čistosti:\nosnove',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Razumevanje povezave med ciklom in stanjem ritualne čistosti, da temu obdobju pristopiš z več jasnosti.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Razumevanje pomena ritualne čistosti',
      'Menstruacija in oprostitev bogoslužja',
      'Po menstruaciji: prepoznavanje vrnitve čistosti',
      'Gusl: razumevanje njegove vloge',
      'Kaj storiti, kadar nisi prepričana?',
      'Ključna sporočila',
    ],
    section1Body: 'V islamski tradiciji ritualna čistost (tahara) pomeni stanje, potrebno za opravljanje nekaterih bogoslužnih dejanj, kot je molitev. Ne nanaša se na čistost v vsakdanjem smislu, ampak na določeno stanje, ki ga priznava fikh in se spreminja glede na faze ženskega cikla.',
    section2Body: 'Med menstruacijo je ženska oproščena nekaterih bogoslužnih dejanj, zlasti molitve in posta v ramazanu, ki ga je mogoče nadomestiti pozneje. Ta oprostitev se priznava kot olajšava, ne kot kazen.',
    checkList1Title: 'Kaj ostaja dostopno med menstruacijo',
    duringPeriod: [
      'Zikr (spominjanje Boga) in dove (prošnje)',
      'Poslušanje ali branje izobraževalne in duhovne vsebine',
      'Podpiranje verske prakse bližnjih',
      'Versko razmišljanje in učenje',
    ],
    noteTitle: 'Opomba',
    noteText: 'Nekatere podrobnosti (kot sta neposredno branje Kur’ana ali vstop v džamijo) se lahko razlikujejo glede na pravno šolo; v teh posebnih primerih je najbolje zanašati se na mnenje, ki mu običajno slediš, ali na kvalificiranega učenjaka.',
    section3Body: 'Konec menstruacije pomeni postopno vrnitev v stanje ritualne čistosti. Fizično to ustreza prenehanju krvavitve, kazalniku, ki ga različne učenjaške tradicije lahko opredelijo z rahlo različnimi niansami.',
    visual1Title: 'Fiziološki proces',
    visual1Text: 'Razumevanje faz cikla ti pomaga bolje prepoznati trenutek, ko se menstruacija res konča.',
    section3Body2: 'Ko je ta kazalnik opažen, gusl (veliko umivanje) omogoča vrnitev v stanje ritualne čistosti in nadaljevanje bogoslužnih dejanj, ki so bila prekinjena.',
    section4Body: 'Gusl je veliko ritualno umivanje, ki vključuje umivanje celotnega telesa z namenom očiščenja. Označuje konec oprostitve in omogoča običajno nadaljevanje molitve, brez potrebe po nadomestitvi molitev, zamujenih med menstruacijo.',
    visual2Title: 'Obred očiščenja',
    visual2Text: 'Natančen način izvajanja gusla se lahko rahlo razlikuje glede na pravno šolo, ki ji slediš.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Če ne poznaš natančnih korakov, ki se upoštevajo v tvoji šoli, ti jih bo jasno razložila oseba, ki ji zaupaš, ali kvalificirani učenjak.',
    section5Body: 'Običajno je dvomiti, kdaj se je menstruacija res končala, zlasti kadar se krvavitev postopoma zmanjšuje, namesto da bi nenadoma prenehala.',
    checkList2Title: 'Nekateri koristni kazalniki',
    doubtMarkers: [
      'Opazuj popolno odsotnost krvavitve, ne le zmanjšanje',
      'Pusti dovolj časa, preden skleneš, da se je menstruacija končala',
      'Zanašaj se na jasno opazovanje, ne na golo vtis',
      'Upoštevaj svoj običajni ritem, ki se lahko razlikuje od cikla do cikla',
    ],
    alert2Title: 'Pomembna informacija',
    alert2Text: 'V primeru dolgotrajne ali nepravilne krvavitve ali trajnega dvoma je o teh situacijah vredno govoriti s kvalificiranim učenjakom, ki te lahko usmeri glede na tvojo osebno situacijo. Ta vsebina ostaja informativna in ne nadomešča individualnega verskega vodenja.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Ti kazalniki so splošni izobraževalni opomniki. Vsaka situacija ima lahko svoje posebnosti: v primeru dvoma ostaja dialog s kvalificiranim učenjakom najboljši vir odgovora, prilagojenega tvoji situaciji.',
    shareMessage: 'Stanje čistosti: osnove — AWA',
  },
  ne: {
    badge: 'महिनावारी र पवित्रता',
    title: 'पवित्रताको अवस्था:\nआधारभूत कुराहरू',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'यो समयलाई थप स्पष्टतासाथ सामना गर्न, चक्र र अनुष्ठानिक पवित्रताको अवस्थाबीचको सम्बन्ध बुझ्ने।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'अनुष्ठानिक पवित्रताको अर्थ बुझ्ने',
      'महिनावारी र इबादतबाट छुट',
      'महिनावारीपछि: पवित्रता फर्किएको चिन्ने',
      'गुस्ल: यसको भूमिका बुझ्ने',
      'पक्का नहुँदा के गर्ने?',
      'मुख्य कुराहरू',
    ],
    section1Body: 'इस्लामी परम्परामा, अनुष्ठानिक पवित्रता (तहारा) ले नमाज जस्ता केही इबादतका कार्यहरू गर्न आवश्यक अवस्थालाई जनाउँछ। यसले दैनिक अर्थमा सरसफाइलाई जनाउँदैन, तर फिक्हले मान्यता दिएको एउटा विशेष अवस्थालाई जनाउँछ, जुन महिला चक्रका चरणहरूअनुसार बदलिन्छ।',
    section2Body: 'महिनावारीको समयमा, महिलालाई केही इबादतका कार्यहरू, विशेष गरी नमाज र रमजानको रोजाबाट छुट हुन्छ, जुन पछि कजा गर्न सकिन्छ। यो छुटलाई राहतका रूपमा मान्यता दिइएको छ, सजायका रूपमा होइन।',
    checkList1Title: 'महिनावारीमा के सुलभ रहन्छ',
    duringPeriod: [
      'जिक्र (अल्लाहको स्मरण) र दुआहरू',
      'शैक्षिक र आध्यात्मिक सामग्री सुन्ने वा पढ्ने',
      'आफ्ना नजिकका मानिसको धार्मिक अभ्यासमा साथ दिने',
      'धार्मिक चिन्तन र सिकाइ',
    ],
    noteTitle: 'कृपया ध्यान दिनुहोस्',
    noteText: 'केही विवरणहरू (जस्तै कुरआनको सिधै पाठ वा मस्जिदमा प्रवेश) फिक्हको विचारधाराअनुसार फरक हुन सक्छन्; यी विशेष अवस्थाहरूका लागि तपाईंले सामान्यतया पछ्याउने रायलाई वा योग्य विद्वानलाई हेर्नु राम्रो हुन्छ।',
    section3Body: 'महिनावारीको अन्त्यले अनुष्ठानिक पवित्रताको अवस्थामा क्रमिक फिर्ती चिह्नित गर्छ। शारीरिक रूपमा, यो रक्तस्राव रोकिनुसँग मेल खान्छ, एउटा सूचक जसलाई विभिन्न विद्वत् परम्पराहरूले केही फरक सूक्ष्मतासहित परिभाषित गर्न सक्छन्।',
    visual1Title: 'एउटा शारीरिक प्रक्रिया',
    visual1Text: 'चक्रका चरणहरू बुझ्नाले महिनावारी वास्तवमा कहिले सकिन्छ त्यो क्षण राम्ररी पहिचान गर्न मद्दत गर्छ।',
    section3Body2: 'यो सूचक अवलोकन गरिएपछि, गुस्ल (ठूलो वुजु) ले अनुष्ठानिक पवित्रतामा फर्कन र स्थगित भएका इबादतका कार्यहरू फेरि सुरु गर्न दिन्छ।',
    section4Body: 'गुस्ल एउटा ठूलो अनुष्ठानिक वुजु हो जसमा पवित्र हुने नियतसहित सम्पूर्ण शरीर धुइन्छ। यसले छुटको अन्त्य चिह्नित गर्छ र महिनावारीमा छुटेका नमाजहरू कजा गर्नुपर्ने आवश्यकताबिना नमाज सामान्य रूपमा फेरि सुरु गर्न दिन्छ।',
    visual2Title: 'एउटा शुद्धीकरणको अनुष्ठान',
    visual2Text: 'गुस्ल गर्ने सही तरिका पछ्याइएको फिक्हको विचारधाराअनुसार अलिकति फरक हुन सक्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'तपाईंको विचारधारामा पछ्याइने सही चरणहरू थाहा छैन भने, तपाईंले विश्वास गर्ने कसैले वा योग्य विद्वानले तिनलाई स्पष्ट रूपमा बुझाउन सक्नेछन्।',
    section5Body: 'महिनावारी वास्तवमै कहिले सकियो भन्नेबारे शङ्का लाग्नु सामान्य हो, विशेष गरी रक्तस्राव अचानक नरोकिई बिस्तारै घट्दा।',
    checkList2Title: 'केही उपयोगी सूचकहरू',
    doubtMarkers: [
      'केवल घटाइ होइन, रक्तस्रावको पूर्ण अनुपस्थिति अवलोकन गर्नुहोस्',
      'महिनावारी सकियो भनेर निष्कर्षमा पुग्नुअघि पर्याप्त समय बित्न दिनुहोस्',
      'केवल धारणामा होइन, स्पष्ट अवलोकनमा भर पर्नुहोस्',
      'एक चक्रदेखि अर्कोमा फरक हुन सक्ने आफ्नै सामान्य लयलाई ध्यानमा राख्नुहोस्',
    ],
    alert2Title: 'महत्त्वपूर्ण जानकारी',
    alert2Text: 'लामो वा अनियमित रक्तस्राव, वा लगातार शङ्काको अवस्थामा, यी अवस्थाहरू योग्य विद्वानसँग छलफल गर्न लायक छन्, जसले तपाईंको व्यक्तिगत अवस्थाअनुसार तपाईंलाई मार्गदर्शन गर्न सक्छन्। यो सामग्री जानकारीमूलक नै रहन्छ र व्यक्तिगत धार्मिक मार्गदर्शनको स्थान लिँदैन।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'यी सूचकहरू सामान्य शैक्षिक सम्झनाहरू हुन्। हरेक अवस्थाका आफ्नै विशेषता हुन सक्छन्: शङ्का भएमा, योग्य विद्वानसँगको संवाद तपाईंको अवस्थाअनुकूल उत्तरका लागि सबैभन्दा राम्रो स्रोत रहन्छ।',
    shareMessage: 'पवित्रताको अवस्था: आधारभूत कुराहरू — AWA',
  },
  si: {
    badge: 'ඔසප් සහ පාරිශුද්ධ බව',
    title: 'පාරිශුද්ධ තත්ත්වය:\nමූලික කරුණු',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'මෙම කාලයට වඩා පැහැදිලි බවකින් ළඟා වීමට, චක්‍රය සහ ආචාරික පාරිශුද්ධ තත්ත්වය අතර සම්බන්ධය තේරුම් ගැනීම.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ආචාරික පාරිශුද්ධ බව යනු කුමක්දැයි තේරුම් ගැනීම',
      'ඔසප් සහ නමස්කාරයෙන් නිදහස් කිරීම',
      'ඔසප්වලින් පසු: පාරිශුද්ධ බවට නැවත පැමිණීම හඳුනාගැනීම',
      'ගුස්ල්: එහි කාර්යභාරය තේරුම් ගැනීම',
      'ඔබට විශ්වාස නැති විට කළ යුත්තේ කුමක්ද?',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'ඉස්ලාමීය සම්ප්‍රදායේ, ආචාරික පාරිශුද්ධ බව (තහාරා) යනු සලාත් වැනි සමහර නමස්කාර ක්‍රියා ඉටු කිරීමට අවශ්‍ය තත්ත්වය දක්වයි. එය එදිනෙදා අර්ථයෙන් පිරිසිදු බව ගැන නොව, ස්ත්‍රී චක්‍රයේ අවධි අනුව වෙනස් වන ෆික්හ් විසින් පිළිගත් නිශ්චිත තත්ත්වයක් ගැනයි.',
    section2Body: 'ඔසප් කාලයේදී, කාන්තාවක් සමහර නමස්කාර ක්‍රියාවලින්, විශේෂයෙන් සලාත් සහ රමළාන් උපවාසයෙන්, නිදහස් කෙරේ, ඒවා පසුව පිරිමැසිය හැක. මෙම නිදහස් කිරීම දඬුවමක් ලෙස නොව සහනයක් ලෙස පිළිගනු ලැබේ.',
    checkList1Title: 'ඔසප් කාලයේදී ප්‍රවේශ්‍ය ව පවතින දේ',
    duringPeriod: [
      'ධික්ර් (දෙවියන් සිහි කිරීම) සහ ප්‍රාර්ථනා (දුආ)',
      'අධ්‍යාපනික සහ ආධ්‍යාත්මික අන්තර්ගතයට සවන් දීම හෝ කියවීම',
      'ඔබට සමීප අයගේ ආගමික පුරුදුවලට සහාය වීම',
      'ආගමික ආවර්ජනය සහ ඉගෙනීම',
    ],
    noteTitle: 'කරුණාකර සටහන් කරන්න',
    noteText: 'සමහර විස්තර (අල් කුර්ආනය කෙලින්ම කියවීම හෝ පල්ලියට ප්‍රවේශය වැනි) නීති චින්තන ධාරාව අනුව වෙනස් විය හැක; මෙම විශේෂ අවස්ථා සඳහා ඔබ සාමාන්‍යයෙන් අනුගමනය කරන මතයට හෝ සුදුසුකම් ලත් විද්වතෙකුට යොමු වීම වඩා හොඳයි.',
    section3Body: 'ඔසප් අවසානය ආචාරික පාරිශුද්ධ තත්ත්වයට ක්‍රමයෙන් නැවත පැමිණීම සලකුණු කරයි. කායිකව, මෙය ලේ ගැලීම නතර වීමට අනුරූප වේ, විවිධ විද්වත් සම්ප්‍රදායන් තරමක් වෙනස් සූක්ෂ්මතා සහිතව අර්ථ දැක්විය හැකි සලකුණකි.',
    visual1Title: 'කායික ක්‍රියාවලියක්',
    visual1Text: 'චක්‍රයේ අවධි තේරුම් ගැනීම, ඔසප් සැබවින්ම අවසන් වන මොහොත වඩා හොඳින් හඳුනාගැනීමට ඔබට උපකාරී වේ.',
    section3Body2: 'මෙම සලකුණ නිරීක්ෂණය කළ පසු, ගුස්ල් (ප්‍රධාන වුළූව) ආචාරික පාරිශුද්ධ බවට නැවත පැමිණීමට සහ අත්හිටවූ නමස්කාර ක්‍රියා නැවත ආරම්භ කිරීමට ඉඩ සලසයි.',
    section4Body: 'ගුස්ල් යනු පිරිසිදු වීමේ අභිප්‍රායෙන් මුළු ශරීරයම සේදීම ඇතුළත් ප්‍රධාන ආචාරික වුළූවකි. එය නිදහස් කිරීමේ අවසානය සලකුණු කරන අතර, ඔසප් කාලයේදී මග හැරුණු සලාත් පිරිමැසීම අවශ්‍ය නොවී සලාත් සාමාන්‍ය ලෙස නැවත ආරම්භ කිරීමට ඉඩ සලසයි.',
    visual2Title: 'පිරිසිදු කිරීමේ චාරිත්‍රයක්',
    visual2Text: 'ගුස්ල් ඉටු කරන නිශ්චිත ආකාරය අනුගමනය කරන නීති චින්තන ධාරාව අනුව තරමක් වෙනස් විය හැක.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'ඔබේ ධාරාවේ අනුගමනය කරන නිශ්චිත පියවර ඔබ නොදන්නේ නම්, ඔබ විශ්වාස කරන කෙනෙකුට හෝ සුදුසුකම් ලත් විද්වතෙකුට ඒවා ඔබට පැහැදිලිව පැහැදිලි කළ හැක.',
    section5Body: 'ඔසප් සැබවින්ම අවසන් වූයේ කවදාදැයි සැකයක් දැනීම සාමාන්‍යයි, විශේෂයෙන් ලේ ගැලීම හදිසියේ නතර වනවාට වඩා ක්‍රමයෙන් අඩු වන විට.',
    checkList2Title: 'ප්‍රයෝජනවත් සලකුණු කිහිපයක්',
    doubtMarkers: [
      'අඩු වීමක් පමණක් නොව, ලේ ගැලීම සම්පූර්ණයෙන්ම නොමැති බව නිරීක්ෂණය කරන්න',
      'ඔසප් අවසන් වී ඇතැයි නිගමනය කිරීමට පෙර ප්‍රමාණවත් කාලයක් ගතවීමට ඉඩ දෙන්න',
      'හුදු හැඟීමකට වඩා පැහැදිලි නිරීක්ෂණයක් මත විශ්වාසය තබන්න',
      'චක්‍රයෙන් චක්‍රයට වෙනස් විය හැකි ඔබේම සුපුරුදු රිද්මය සැලකිල්ලට ගන්න',
    ],
    alert2Title: 'වැදගත් තොරතුරු',
    alert2Text: 'දිගුකාලීන හෝ අක්‍රමවත් ලේ ගැලීමේදී, හෝ දිගටම පවතින සැකයකදී, මෙම තත්ත්වයන් ඔබේ පෞද්ගලික තත්ත්වයට අනුව ඔබට මඟපෙන්විය හැකි සුදුසුකම් ලත් විද්වතෙකු සමඟ සාකච්ඡා කිරීම වටී. මෙම අන්තර්ගතය තොරතුරු පමණක් ලෙස පවතින අතර පුද්ගලීකරණය කළ ආගමික මඟපෙන්වීම වෙනුවට නොපවතී.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'මෙම සලකුණු සාමාන්‍ය අධ්‍යාපනික සිහිකැඳවීම් වේ. සෑම තත්ත්වයකටම තමන්ගේම විශේෂතා තිබිය හැක: සැකයක් ඇති විට, සුදුසුකම් ලත් විද්වතෙකු සමඟ සංවාදය ඔබේ තත්ත්වයට ගැළපෙන පිළිතුරක් සඳහා හොඳම සම්පතයි.',
    shareMessage: 'පාරිශුද්ධ තත්ත්වය: මූලික කරුණු — AWA',
  },
  th: {
    badge: 'ประจำเดือนและความสะอาด',
    title: 'สถานะความสะอาด:\nพื้นฐาน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำความเข้าใจความเชื่อมโยงระหว่างรอบเดือนกับสถานะความสะอาดตามพิธีกรรม เพื่อรับมือช่วงเวลานี้ด้วยความชัดเจนยิ่งขึ้น',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำความเข้าใจความหมายของความสะอาดตามพิธีกรรม',
      'ประจำเดือนและการยกเว้นจากการประกอบศาสนกิจ',
      'หลังประจำเดือน: การสังเกตการกลับสู่ความสะอาด',
      'ฆุสล์: ทำความเข้าใจบทบาทของมัน',
      'ควรทำอย่างไรเมื่อไม่แน่ใจ?',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'ในประเพณีอิสลาม ความสะอาดตามพิธีกรรม (ฏอฮาเราะฮ์) หมายถึงสภาวะที่จำเป็นเพื่อประกอบศาสนกิจบางอย่าง เช่น การละหมาด ไม่ได้หมายถึงความสะอาดในความหมายทั่วไปในชีวิตประจำวัน แต่หมายถึงสภาวะเฉพาะที่ฟิกฮ์ยอมรับ ซึ่งเปลี่ยนไปตามระยะต่าง ๆ ของรอบเดือนของสตรี',
    section2Body: 'ระหว่างมีประจำเดือน สตรีได้รับการยกเว้นจากศาสนกิจบางอย่าง โดยเฉพาะการละหมาดและการถือศีลอดรอมฎอน ซึ่งชดเชยภายหลังได้ การยกเว้นนี้ได้รับการยอมรับว่าเป็นการผ่อนปรน ไม่ใช่การลงโทษ',
    checkList1Title: 'สิ่งที่ยังทำได้ระหว่างมีประจำเดือน',
    duringPeriod: [
      'ซิกร์ (การระลึกถึงอัลลอฮ์) และดุอาอ์ (การวิงวอน)',
      'ฟังหรืออ่านเนื้อหาเพื่อการเรียนรู้และทางจิตวิญญาณ',
      'สนับสนุนการปฏิบัติศาสนกิจของคนใกล้ชิด',
      'การใคร่ครวญและการเรียนรู้ทางศาสนา',
    ],
    noteTitle: 'โปรดทราบ',
    noteText: 'รายละเอียดบางอย่าง (เช่น การอ่านอัลกุรอานโดยตรงหรือการเข้าสู่มัสยิด) อาจต่างกันตามสำนักนิติศาสตร์ ควรอ้างอิงความเห็นที่คุณปฏิบัติตามตามปกติหรือผู้รู้ที่มีคุณวุฒิสำหรับกรณีเฉพาะเหล่านี้',
    section3Body: 'การสิ้นสุดของประจำเดือนเป็นจุดเริ่มต้นของการกลับสู่สภาวะความสะอาดตามพิธีกรรมทีละน้อย ในทางกายภาพ ตรงกับการที่เลือดหยุดออก ซึ่งเป็นเครื่องหมายที่ธรรมเนียมของผู้รู้ต่าง ๆ อาจนิยามด้วยความแตกต่างเล็กน้อย',
    visual1Title: 'กระบวนการทางสรีรวิทยา',
    visual1Text: 'การเข้าใจระยะต่าง ๆ ของรอบเดือนช่วยให้คุณระบุช่วงเวลาที่ประจำเดือนสิ้นสุดจริง ๆ ได้ดียิ่งขึ้น',
    section3Body2: 'เมื่อสังเกตเครื่องหมายนี้แล้ว ฆุสล์ (การอาบน้ำชำระใหญ่) ทำให้กลับสู่ความสะอาดตามพิธีกรรมและกลับมาประกอบศาสนกิจที่ถูกระงับไว้ได้',
    section4Body: 'ฆุสล์คือการอาบน้ำชำระตามพิธีกรรมครั้งใหญ่ ซึ่งเกี่ยวข้องกับการล้างทั้งร่างกายด้วยเจตนาเพื่อทำให้ตนบริสุทธิ์ เป็นจุดสิ้นสุดของการยกเว้นและทำให้กลับมาละหมาดได้ตามปกติ โดยไม่จำเป็นต้องชดเชยการละหมาดที่พลาดระหว่างมีประจำเดือน',
    visual2Title: 'พิธีชำระล้าง',
    visual2Text: 'วิธีที่แน่ชัดในการทำฆุสล์อาจแตกต่างเล็กน้อยตามสำนักนิติศาสตร์ที่ปฏิบัติตาม',
    tip1Title: 'ควรรู้',
    tip1Text: 'หากคุณไม่ทราบขั้นตอนที่แน่ชัดของสำนักของคุณ คนที่คุณไว้ใจหรือผู้รู้ที่มีคุณวุฒิจะอธิบายให้คุณอย่างชัดเจนได้',
    section5Body: 'เป็นเรื่องปกติที่จะรู้สึกสงสัยว่าประจำเดือนสิ้นสุดจริงเมื่อไร โดยเฉพาะเมื่อเลือดค่อย ๆ ลดลงแทนที่จะหยุดทันที',
    checkList2Title: 'เครื่องหมายที่เป็นประโยชน์บางประการ',
    doubtMarkers: [
      'สังเกตการไม่มีเลือดเลยโดยสิ้นเชิง ไม่ใช่เพียงการลดลง',
      'ปล่อยให้เวลาผ่านไปมากพอก่อนสรุปว่าประจำเดือนสิ้นสุดแล้ว',
      'อาศัยการสังเกตที่ชัดเจนแทนความรู้สึกเพียงอย่างเดียว',
      'คำนึงถึงจังหวะปกติของคุณเอง ซึ่งอาจต่างกันในแต่ละรอบเดือน',
    ],
    alert2Title: 'ข้อมูลสำคัญ',
    alert2Text: 'ในกรณีเลือดออกยาวนานหรือไม่สม่ำเสมอ หรือสงสัยต่อเนื่อง สถานการณ์เหล่านี้ควรนำไปปรึกษาผู้รู้ที่มีคุณวุฒิ ซึ่งนำทางคุณตามสถานการณ์ส่วนตัวได้ เนื้อหานี้ยังคงเป็นข้อมูลและไม่ได้ทดแทนคำแนะนำทางศาสนาเฉพาะบุคคล',
    tip2Title: 'ควรรู้',
    tip2Text: 'เครื่องหมายเหล่านี้เป็นการเตือนความจำเพื่อการเรียนรู้โดยทั่วไป แต่ละสถานการณ์อาจมีลักษณะเฉพาะของตัวเอง: เมื่อสงสัย การปรึกษาผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งที่ดีที่สุดสำหรับคำตอบที่เหมาะกับสถานการณ์ของคุณ',
    shareMessage: 'สถานะความสะอาด: พื้นฐาน — AWA',
  },
  vi: {
    badge: 'KỲ KINH & THANH SẠCH',
    title: 'Tình trạng thanh sạch:\nnhững điều cơ bản',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Hiểu mối liên hệ giữa chu kỳ và tình trạng thanh sạch nghi lễ, để đón nhận giai đoạn này rõ ràng hơn.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Hiểu thanh sạch nghi lễ có nghĩa là gì',
      'Kinh nguyệt và việc được miễn thờ phượng',
      'Sau kỳ kinh: nhận biết sự trở lại thanh sạch',
      'Ghusl: hiểu vai trò của nó',
      'Nên làm gì khi bạn không chắc chắn?',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Trong truyền thống Hồi giáo, sự thanh sạch nghi lễ (tahara) chỉ trạng thái cần có để thực hiện một số hành vi thờ phượng, như cầu nguyện. Nó không nói về sự sạch sẽ theo nghĩa thông thường hằng ngày, mà về một trạng thái cụ thể được fiqh công nhận, thay đổi theo các giai đoạn của chu kỳ nữ giới.',
    section2Body: 'Trong kỳ kinh, người phụ nữ được miễn một số hành vi thờ phượng, đặc biệt là cầu nguyện và nhịn ăn Ramadan, những điều này có thể được bù lại sau. Sự miễn trừ này được công nhận là một sự nới lỏng, không phải một hình phạt.',
    checkList1Title: 'Những gì vẫn có thể thực hiện trong kỳ kinh',
    duringPeriod: [
      'Dhikr (tưởng nhớ Thượng Đế) và những lời cầu xin (du’a)',
      'Nghe hoặc đọc nội dung giáo dục và tâm linh',
      'Hỗ trợ việc thực hành tôn giáo của những người thân quanh bạn',
      'Suy ngẫm và học hỏi về tôn giáo',
    ],
    noteTitle: 'Xin lưu ý',
    noteText: 'Một số chi tiết (như đọc trực tiếp Quran hoặc vào nhà thờ Hồi giáo) có thể khác nhau tùy theo trường phái luật học; với những trường hợp cụ thể này, tốt nhất nên tham khảo ý kiến bạn thường theo hoặc một học giả có thẩm quyền.',
    section3Body: 'Sự kết thúc của kỳ kinh đánh dấu sự trở lại dần dần của trạng thái thanh sạch nghi lễ. Về mặt thể chất, điều này tương ứng với việc ngừng ra máu, một dấu mốc mà các truyền thống học thuật khác nhau có thể định nghĩa với sắc thái hơi khác.',
    visual1Title: 'Một quá trình sinh lý',
    visual1Text: 'Hiểu các giai đoạn của chu kỳ giúp bạn nhận biết rõ hơn thời điểm kỳ kinh thực sự kết thúc.',
    section3Body2: 'Khi dấu mốc này đã được quan sát thấy, ghusl (tắm gội nghi lễ lớn) cho phép trở lại trạng thái thanh sạch nghi lễ và tiếp tục các hành vi thờ phượng đã bị tạm ngưng.',
    section4Body: 'Ghusl là nghi thức tắm gội lớn bao gồm việc rửa toàn thân với ý định thanh tẩy bản thân. Nó đánh dấu sự kết thúc của sự miễn trừ và cho phép cầu nguyện tiếp tục bình thường, mà không cần phải bù những buổi cầu nguyện đã bỏ lỡ trong kỳ kinh.',
    visual2Title: 'Một nghi thức thanh tẩy',
    visual2Text: 'Cách thực hiện cụ thể ghusl có thể hơi khác nhau tùy theo trường phái luật học mà bạn theo.',
    tip1Title: 'Nên biết',
    tip1Text: 'Nếu bạn không biết các bước cụ thể được theo trong trường phái của mình, một người bạn tin tưởng hoặc một học giả có thẩm quyền sẽ có thể giải thích rõ ràng cho bạn.',
    section5Body: 'Cảm thấy nghi ngờ về thời điểm kỳ kinh thực sự đã kết thúc là điều phổ biến, đặc biệt khi lượng máu giảm dần chứ không dừng đột ngột.',
    checkList2Title: 'Một số mốc hữu ích',
    doubtMarkers: [
      'Quan sát hoàn toàn không còn ra máu, chứ không chỉ giảm bớt',
      'Để đủ thời gian trôi qua trước khi kết luận rằng kỳ kinh đã kết thúc',
      'Dựa vào một quan sát rõ ràng thay vì chỉ một ấn tượng',
      'Cân nhắc nhịp điệu thông thường của chính bạn, vốn có thể khác nhau giữa các chu kỳ',
    ],
    alert2Title: 'Thông tin quan trọng',
    alert2Text: 'Trong trường hợp ra máu kéo dài hoặc không đều, hay còn nghi ngờ dai dẳng, những tình huống này đáng được trao đổi với một học giả có thẩm quyền, người có thể hướng dẫn bạn theo hoàn cảnh cá nhân. Nội dung này vẫn mang tính thông tin và không thay thế sự hướng dẫn tôn giáo cá nhân hóa.',
    tip2Title: 'Nên biết',
    tip2Text: 'Những mốc này là lời nhắc giáo dục chung. Mỗi tình huống có thể có những đặc thù riêng: khi nghi ngờ, đối thoại với một học giả có thẩm quyền vẫn là nguồn tốt nhất để có câu trả lời phù hợp với tình huống của bạn.',
    shareMessage: 'Tình trạng thanh sạch: những điều cơ bản — AWA',
  },
  uz: {
    badge: 'HAYZ VA POKLIK',
    title: 'Poklik holati:\nasoslar',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Bu davrga aniqroq yondashish uchun sikl va ritual poklik holati oʻrtasidagi bogʻliqlikni tushunish.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Ritual poklik nimani anglatishini tushunish',
      'Hayz va ibodatdan ozod boʻlish',
      'Hayzdan keyin: poklikka qaytishni tanish',
      'Gʻusl: uning rolini tushunish',
      'Ishonchingiz komil boʻlmasa nima qilish kerak?',
      'Asosiy xulosalar',
    ],
    section1Body: 'Islom anʼanasida ritual poklik (tahorat) namoz kabi baʼzi ibodatlarni bajarish uchun zarur boʻlgan holatni bildiradi. U kundalik maʼnodagi tozalikni emas, balki fiqh tan oladigan va ayol sikli bosqichlariga qarab oʻzgaradigan muayyan holatni bildiradi.',
    section2Body: 'Hayz paytida ayol baʼzi ibodatlardan, xususan, namoz va Ramazon roʻzasidan ozod boʻladi, roʻzani keyinroq qazo qilish mumkin. Bu ozodlik jazo emas, yengillik sifatida tan olinadi.',
    checkList1Title: 'Hayz paytida nima mumkin boʻlib qoladi',
    duringPeriod: [
      'Zikr (Allohni eslash) va duolar',
      'Taʼlimiy va maʼnaviy kontentni tinglash yoki oʻqish',
      'Yaqinlaringizning diniy amaliyotini qoʻllab-quvvatlash',
      'Diniy mulohaza va oʻrganish',
    ],
    noteTitle: 'Eʼtibor bering',
    noteText: 'Baʼzi tafsilotlar (masalan, Qurʼonni bevosita oʻqish yoki masjidga kirish) fiqhiy maktabga qarab farq qilishi mumkin; bu maxsus holatlar uchun odatda amal qiladigan fikringizga yoki malakali olimga murojaat qilgan maʼqul.',
    section3Body: 'Hayzning tugashi ritual poklik holatiga asta-sekin qaytishni bildiradi. Jismonan bu qon ketishining toʻxtashiga mos keladi, turli ilmiy anʼanalar bu belgini biroz farqli nozikliklar bilan belgilashi mumkin.',
    visual1Title: 'Fiziologik jarayon',
    visual1Text: 'Sikl bosqichlarini tushunish hayz haqiqatan qachon tugashini yaxshiroq aniqlashga yordam beradi.',
    section3Body2: 'Bu belgi kuzatilgandan keyin gʻusl (katta tahorat) ritual poklikka qaytishga va toʻxtatilgan ibodatlarni davom ettirishga imkon beradi.',
    section4Body: 'Gʻusl — poklanish niyati bilan butun tanani yuvishni oʻz ichiga olgan katta ritual tahorat. U ozodlik tugaganini bildiradi va hayz paytida oʻtkazib yuborilgan namozlarni qazo qilish shart boʻlmasdan, namozni odatdagidek davom ettirishga imkon beradi.',
    visual2Title: 'Poklanish marosimi',
    visual2Text: 'Gʻuslning aniq bajarilish usuli amal qilinadigan fiqhiy maktabga qarab biroz farq qilishi mumkin.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Agar mazhabingizda amal qilinadigan aniq bosqichlarni bilmasangiz, ishongan kishingiz yoki malakali olim ularni sizga aniq tushuntirib bera oladi.',
    section5Body: 'Hayz haqiqatan qachon tugaganiga shubha qilish keng tarqalgan, ayniqsa qon ketishi birdan toʻxtamay, asta-sekin kamayganda.',
    checkList2Title: 'Baʼzi foydali belgilar',
    doubtMarkers: [
      'Faqat kamayishni emas, qon ketishining toʻliq yoʻqligini kuzating',
      'Hayz tugagan degan xulosaga kelishdan oldin yetarli vaqt oʻtishiga imkon bering',
      'Oddiy taassurotga emas, aniq kuzatuvga tayaning',
      'Sikldan sikliga farq qilishi mumkin boʻlgan oʻz odatiy ritmingizni hisobga oling',
    ],
    alert2Title: 'Muhim maʼlumot',
    alert2Text: 'Uzoq davom etgan yoki notekis qon ketishi yoki doimiy shubha holatlarini malakali olim bilan muhokama qilish kerak, u sizni shaxsiy vaziyatingizga qarab yoʻnaltira oladi. Bu kontent maʼlumot uchun qoladi va individual diniy yoʻl-yoʻriqni almashtirmaydi.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'Bu belgilar umumiy taʼlimiy eslatmalar. Har bir vaziyatning oʻz xususiyatlari boʻlishi mumkin: shubha boʻlsa, malakali olim bilan muloqot vaziyatingizga mos javob uchun eng yaxshi manba boʻlib qoladi.',
    shareMessage: 'Poklik holati: asoslar — AWA',
  },
  az: {
    badge: 'AYBAŞI VƏ PAKLIQ',
    title: 'Paklıq statusu:\nəsaslar',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bu dövrə daha aydın yanaşmaq üçün dövr ilə ritual paklıq statusu arasındakı əlaqəni anlamaq.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Ritual paklığın nə demək olduğunu anlamaq',
      'Aybaşı və ibadətdən azad olma',
      'Aybaşıdan sonra: paklığa qayıdışı tanımaq',
      'Qüsl: onun rolunu anlamaq',
      'Əmin olmadıqda nə etmək lazımdır?',
      'Əsas nəticələr',
    ],
    section1Body: 'İslam ənənəsində ritual paklıq (təharət) namaz kimi bəzi ibadət aktlarını yerinə yetirmək üçün tələb olunan vəziyyətə işarə edir. O, gündəlik mənada təmizliyə deyil, fiqh tərəfindən tanınan, qadın dövrünün mərhələlərinə görə dəyişən konkret vəziyyətə aiddir.',
    section2Body: 'Aybaşı zamanı qadın bəzi ibadət aktlarından, xüsusilə namazdan və sonradan qəza edilə bilən Ramazan orucundan azad olur. Bu azad olma cəza kimi deyil, yüngüllük kimi tanınır.',
    checkList1Title: 'Aybaşı zamanı nə əlçatan qalır',
    duringPeriod: [
      'Zikr (Allahı yad etmə) və dualar',
      'Təhsil və mənəvi məzmuna qulaq asmaq və ya onu oxumaq',
      'Yaxınların dini təcrübəsini dəstəkləmək',
      'Dini düşüncə və öyrənmə',
    ],
    noteTitle: 'Nəzərə alın',
    noteText: 'Bəzi təfərrüatlar (məsələn, Quranın birbaşa oxunması və ya məscidə giriş) hüquq məktəbindən asılı olaraq dəyişə bilər; bu xüsusi hallar üçün adətən əməl etdiyiniz fikrə və ya səlahiyyətli alimə müraciət etmək daha yaxşıdır.',
    section3Body: 'Aybaşının sonu ritual paklıq vəziyyətinə tədricən qayıdışı bildirir. Fiziki baxımdan bu, qanaxmanın dayanmasına uyğun gəlir; müxtəlif elmi ənənələr bu göstəricini bir qədər fərqli nüanslarla müəyyən edə bilər.',
    visual1Title: 'Fizioloji proses',
    visual1Text: 'Dövrün mərhələlərini anlamaq aybaşının həqiqətən nə vaxt bitdiyini daha yaxşı müəyyən etməyə kömək edir.',
    section3Body2: 'Bu göstərici müşahidə edildikdən sonra qüsl (böyük dəstəmaz) ritual paklığa qayıtmağa və dayandırılmış ibadət aktlarını bərpa etməyə imkan verir.',
    section4Body: 'Qüsl paklanmaq niyyəti ilə bütün bədənin yuyulmasından ibarət böyük ritual dəstəmazdır. O, azad olmanın sonunu bildirir və aybaşı zamanı buraxılmış namazları qəza etməyə ehtiyac olmadan namazın normal şəkildə bərpasına imkan verir.',
    visual2Title: 'Paklanma ritualı',
    visual2Text: 'Qüslün dəqiq aparılma qaydası əməl edilən hüquq məktəbindən asılı olaraq bir qədər dəyişə bilər.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Məktəbinizdə izlənilən dəqiq addımları bilmirsinizsə, etibar etdiyiniz biri və ya səlahiyyətli alim bunları sizə aydın şəkildə izah edə bilər.',
    section5Body: 'Aybaşının həqiqətən nə vaxt bitdiyinə şübhə etmək, xüsusilə qanaxma qəfildən dayanmaq əvəzinə tədricən azaldıqda, geniş yayılıb.',
    checkList2Title: 'Bəzi faydalı göstəricilər',
    doubtMarkers: [
      'Yalnız azalmanı deyil, qanaxmanın tam olmamasını müşahidə edin',
      'Aybaşının bitdiyi nəticəsinə gəlməzdən əvvəl kifayət qədər vaxtın keçməsinə icazə verin',
      'Sadə təəssürat əvəzinə aydın müşahidəyə əsaslanın',
      'Bir dövrdən digərinə dəyişə bilən öz adi ritminizi nəzərə alın',
    ],
    alert2Title: 'Vacib məlumat',
    alert2Text: 'Uzunmüddətli və ya qeyri-müntəzəm qanaxma və ya davamlı şübhə hallarında bu vəziyyətlər sizi şəxsi vəziyyətinizə görə istiqamətləndirə bilən səlahiyyətli alimlə müzakirə olunmağa layiqdir. Bu məzmun məlumat xarakterli qalır və fərdi dini istiqamətləndirməni əvəz etmir.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Bu göstəricilər ümumi təhsil xatırlatmalarıdır. Hər vəziyyətin özünəməxsus xüsusiyyətləri ola bilər: şübhə olarsa, səlahiyyətli alimlə dialoq vəziyyətinizə uyğun cavab üçün ən yaxşı mənbə olaraq qalır.',
    shareMessage: 'Paklıq statusu: əsaslar — AWA',
  },
  ka: {
    badge: 'მენსტრუაცია და სისუფთავე',
    title: 'სისუფთავის სტატუსი:\nსაფუძვლები',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ციკლსა და რიტუალური სისუფთავის სტატუსს შორის კავშირის გაგება, რომ ეს დრო უფრო ნათლად აღიქვათ.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'იმის გაგება, რას ნიშნავს რიტუალური სისუფთავე',
      'მენსტრუაცია და ღვთისმსახურებისგან გათავისუფლება',
      'მენსტრუაციის შემდეგ: სისუფთავის დაბრუნების ამოცნობა',
      'ღუსლი: მისი როლის გაგება',
      'რა გავაკეთოთ, როცა დარწმუნებული არ ხართ?',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ისლამურ ტრადიციაში რიტუალური სისუფთავე (თაჰარა) ნიშნავს მდგომარეობას, რომელიც გარკვეული ღვთისმსახურების აქტების, როგორიცაა ლოცვა, შესასრულებლად არის საჭირო. ის არ ნიშნავს სისუფთავეს ყოველდღიური გაგებით, არამედ ფიქჰის მიერ აღიარებულ კონკრეტულ მდგომარეობას, რომელიც ქალის ციკლის ეტაპების მიხედვით იცვლება.',
    section2Body: 'მენსტრუაციის დროს ქალი გათავისუფლებულია გარკვეული ღვთისმსახურების აქტებისგან, კერძოდ ლოცვისა და რამადანის მარხვისგან, რომელიც მოგვიანებით შეიძლება აინაზღაუროს. ეს გათავისუფლება აღიარებულია შვებად და არა სასჯელად.',
    checkList1Title: 'რა რჩება ხელმისაწვდომი მენსტრუაციის დროს',
    duringPeriod: [
      'ზიქრი (ღმერთის მოხსენიება) და ლოცვითი თხოვნები (დუა)',
      'საგანმანათლებლო და სულიერი შინაარსის მოსმენა ან კითხვა',
      'თქვენი ახლობლების რელიგიური პრაქტიკის მხარდაჭერა',
      'რელიგიური განსჯა და სწავლა',
    ],
    noteTitle: 'გაითვალისწინეთ',
    noteText: 'ზოგი დეტალი (მაგალითად, ყურანის პირდაპირი კითხვა ან მეჩეთზე წვდომა) სამართლებრივი სკოლის მიხედვით შეიძლება განსხვავდებოდეს; ამ კონკრეტული შემთხვევებისთვის უმჯობესია მიმართოთ მოსაზრებას, რომელსაც ჩვეულებრივ მისდევთ, ან კვალიფიციურ მეცნიერს.',
    section3Body: 'მენსტრუაციის დასრულება რიტუალური სისუფთავის მდგომარეობაში ეტაპობრივი დაბრუნების აღმნიშვნელია. ფიზიკურად ეს სისხლდენის შეწყვეტას შეესაბამება, მარკერს, რომელსაც სხვადასხვა სამეცნიერო ტრადიცია ოდნავ განსხვავებული ნიუანსებით განსაზღვრავს.',
    visual1Title: 'ფიზიოლოგიური პროცესი',
    visual1Text: 'ციკლის ეტაპების გაგება გეხმარებათ უკეთ დაადგინოთ მომენტი, როცა მენსტრუაცია რეალურად მთავრდება.',
    section3Body2: 'ამ მარკერის დაფიქსირების შემდეგ ღუსლი (დიდი აბდესტი) საშუალებას იძლევა რიტუალურ სისუფთავეში დავბრუნდეთ და შეჩერებული ღვთისმსახურების აქტები განვაახლოთ.',
    section4Body: 'ღუსლი დიდი რიტუალური დაბანაა, რომელიც მოიცავს მთელი სხეულის დაბანას განწმენდის განზრახვით. ის გათავისუფლების დასასრულს აღნიშნავს და ლოცვის ნორმალურად განახლების საშუალებას იძლევა, მენსტრუაციის დროს გამოტოვებული ლოცვების ანაზღაურების საჭიროების გარეშე.',
    visual2Title: 'განწმენდის რიტუალი',
    visual2Text: 'ღუსლის ზუსტი შესრულების წესი შეიძლება მცირედ განსხვავდებოდეს მიყოლილი სამართლებრივი სკოლის მიხედვით.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თუ არ იცით თქვენს სკოლაში დაცული ზუსტი ნაბიჯები, ადამიანი, ვისაც ენდობით, ან კვალიფიციური მეცნიერი მკაფიოდ აგიხსნით მათ.',
    section5Body: 'ხშირია ეჭვი იმაზე, როდის დასრულდა მენსტრუაცია ნამდვილად, განსაკუთრებით მაშინ, როცა სისხლდენა მკვეთრად კი არა, ეტაპობრივად მცირდება.',
    checkList2Title: 'რამდენიმე სასარგებლო მარკერი',
    doubtMarkers: [
      'დააკვირდით სისხლდენის სრულ არარსებობას და არა მხოლოდ შემცირებას',
      'დაუთმეთ საკმარისი დრო, სანამ დაასკვნით, რომ მენსტრუაცია დასრულდა',
      'დაეყრდენით მკაფიო დაკვირვებას და არა უბრალო შთაბეჭდილებას',
      'გაითვალისწინეთ თქვენი საკუთარი ჩვეული რიტმი, რომელიც ერთი ციკლიდან მეორეზე შეიძლება განსხვავდებოდეს',
    ],
    alert2Title: 'მნიშვნელოვანი ინფორმაცია',
    alert2Text: 'გაგრძელებული ან არარეგულარული სისხლდენის ან მუდმივი ეჭვის შემთხვევაში ეს სიტუაციები კვალიფიციურ მეცნიერთან განხილვას იმსახურებს, რომელსაც შეუძლია თქვენი პირადი სიტუაციის მიხედვით წარგმართოთ. ეს შინაარსი რჩება საინფორმაციო და ინდივიდუალურ რელიგიურ მითითებას არ ანაცვლებს.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ეს მარკერები ზოგადი საგანმანათლებლო შეხსენებებია. თითოეულ სიტუაციას საკუთარი თავისებურებები შეიძლება ჰქონდეს: ეჭვის შემთხვევაში კვალიფიციურ მეცნიერთან დიალოგი რჩება საუკეთესო წყაროდ თქვენს სიტუაციაზე მორგებული პასუხისთვის.',
    shareMessage: 'სისუფთავის სტატუსი: საფუძვლები — AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆ ԵՎ ՄԱՔՐՈՒԹՅՈՒՆ',
    title: 'Մաքրության կարգավիճակ.\nհիմունքները',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Հասկանալ ցիկլի և ծիսական մաքրության կարգավիճակի կապը՝ այս ժամանակահատվածին ավելի հստակությամբ մոտենալու համար:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հասկանալ, թե ինչ է նշանակում ծիսական մաքրությունը',
      'Դաշտան և պաշտամունքից ազատում',
      'Դաշտանից հետո. մաքրության վերադարձի ճանաչումը',
      'Ղուսլ. հասկանալ նրա դերը',
      'Ի՞նչ անել, երբ վստահ չեք',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Իսլամական ավանդույթում ծիսական մաքրությունը (թահարա) նշանակում է որոշ պաշտամունքային գործողություններ, օրինակ՝ աղոթք, կատարելու համար պահանջվող վիճակը: Այն չի վերաբերում մաքրությանը առօրյա իմաստով, այլ ֆիքհով ճանաչված հատուկ վիճակի, որը փոխվում է կանացի ցիկլի փուլերին համապատասխան:',
    section2Body: 'Դաշտանի ընթացքում կինն ազատվում է որոշ պաշտամունքային գործողություններից, մասնավորապես աղոթքից և Ռամադանի պահքից, որը կարելի է փոխհատուցել ավելի ուշ: Այս ազատումը ճանաչվում է որպես թեթևացում, այլ ոչ թե պատիժ:',
    checkList1Title: 'Ինչն է մնում հասանելի դաշտանի ընթացքում',
    duringPeriod: [
      'Զիքր (Աստծո հիշատակում) և աղոթագրեր (դուա)',
      'Կրթական և հոգևոր բովանդակություն լսելը կամ կարդալը',
      'Ձեզ մոտիկների կրոնական պրակտիկայի աջակցումը',
      'Կրոնական խորհրդածություն և ուսուցում',
    ],
    noteTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    noteText: 'Որոշ մանրամասներ (օրինակ՝ Ղուրանի ուղղակի ընթերցումը կամ մզկիթ մուտք գործելը) կարող են տարբերվել՝ կախված իրավագիտական դպրոցից. այս կոնկրետ դեպքերի համար լավագույնն է դիմել այն կարծիքին, որին սովորաբար հետևում եք, կամ որակավորված գիտնականին:',
    section3Body: 'Դաշտանի ավարտը նշում է ծիսական մաքրության վիճակի աստիճանական վերադարձը: Ֆիզիկապես դա համապատասխանում է արյունահոսության դադարին՝ ուղենիշ, որը գիտական տարբեր ավանդույթներ կարող են սահմանել մի փոքր տարբեր նրբերանգներով:',
    visual1Title: 'Ֆիզիոլոգիական գործընթաց',
    visual1Text: 'Ցիկլի փուլերը հասկանալը օգնում է ավելի լավ որոշել այն պահը, երբ դաշտանն իրականում ավարտվում է:',
    section3Body2: 'Երբ այս ուղենիշը նկատվել է, ղուսլը (մեծ աբդեստ) թույլ է տալիս վերադառնալ ծիսական մաքրության և վերսկսել կասեցված պաշտամունքային գործողությունները:',
    section4Body: 'Ղուսլը մեծ ծիսական լվացում է, որը ներառում է ամբողջ մարմինը լվանալը՝ մաքրվելու մտադրությամբ: Այն նշում է ազատման ավարտը և թույլ է տալիս աղոթքը նորմալ վերսկսել՝ առանց դաշտանի ժամանակ բաց թողնված աղոթքները փոխհատուցելու անհրաժեշտության:',
    visual2Title: 'Մաքրագործման ծես',
    visual2Text: 'Ղուսլի կատարման ճշգրիտ եղանակը կարող է մի փոքր տարբերվել՝ կախված հետևվող իրավագիտական դպրոցից:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Եթե չգիտեք ձեր դպրոցում հետևվող ճշգրիտ քայլերը, ձեր վստահած մարդը կամ որակավորված գիտնականը կկարողանա դրանք հստակ բացատրել ձեզ:',
    section5Body: 'Տարածված է կասկած զգալ, թե երբ է դաշտանն իրականում ավարտվել, հատկապես երբ արյունահոսությունը աստիճանաբար նվազում է, այլ ոչ թե հանկարծակի դադարում:',
    checkList2Title: 'Մի քանի օգտակար ուղենիշ',
    doubtMarkers: [
      'Դիտարկեք արյունահոսության լրիվ բացակայությունը, ոչ թե միայն նվազումը',
      'Թողեք բավարար ժամանակ անցնի՝ նախքան եզրակացնելը, որ դաշտանն ավարտվել է',
      'Հիմնվեք հստակ դիտարկման վրա, այլ ոչ թե պարզ տպավորության',
      'Հաշվի առեք ձեր սեփական սովորական ռիթմը, որը կարող է տարբերվել մի ցիկլից մյուսը',
    ],
    alert2Title: 'Կարևոր տեղեկություն',
    alert2Text: 'Երկարատև կամ անկանոն արյունահոսության կամ շարունակական կասկածի դեպքում այս իրավիճակները արժե քննարկել որակավորված գիտնականի հետ, որը կարող է ուղղորդել ձեզ՝ ըստ ձեր անձնական իրավիճակի: Այս բովանդակությունը մնում է տեղեկատվական և չի փոխարինում անհատականացված կրոնական ուղղորդմանը:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Այս ուղենիշները ընդհանուր կրթական հիշեցումներ են: Յուրաքանչյուր իրավիճակ կարող է ունենալ իր առանձնահատկությունները. կասկածի դեպքում որակավորված գիտնականի հետ երկխոսությունը մնում է լավագույն ռեսուրսը՝ ձեր իրավիճակին համապատասխան պատասխանի համար:',
    shareMessage: 'Մաքրության կարգավիճակ. հիմունքները — AWA',
  },
  tg: {
    badge: 'ҲАЙЗ ВА ПОКӢ',
    title: 'Ҳолати покӣ:\nасосҳо',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Фаҳмидани робитаи байни давра ва ҳолати покии маросимӣ, барои бо возеҳии бештар наздик шудан ба ин давра.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаҳмидани маънои покии маросимӣ',
      'Ҳайз ва озодӣ аз ибодат',
      'Пас аз ҳайз: шинохтани бозгашт ба покӣ',
      'Ғусл: фаҳмидани нақши он',
      'Вақте мутмаин нестед, чӣ кор кардан лозим аст?',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Дар анъанаи исломӣ покии маросимӣ (таҳорат) ҳолатеро мефаҳмонад, ки барои иҷрои баъзе амалҳои ибодат, аз қабили намоз, лозим аст. Он покизагиро ба маънои ҳаррӯза нишон намедиҳад, балки ҳолати мушаххасеро, ки фиқҳ мешиносад ва вобаста ба марҳилаҳои давраи занона тағйир меёбад.',
    section2Body: 'Ҳангоми ҳайз зан аз баъзе амалҳои ибодат, махсусан намоз ва рӯзаи Рамазон, ки баъдтар қазо карда мешавад, озод аст. Ин озодӣ ҳамчун сабукӣ шинохта мешавад, на ҳамчун ҷазо.',
    checkList1Title: 'Чӣ ҳангоми ҳайз дастрас мемонад',
    duringPeriod: [
      'Зикр (ёди Худо) ва дуо',
      'Гӯш кардан ё хондани мазмуни таълимӣ ва маънавӣ',
      'Дастгирии амалияи динии наздикон',
      'Андеша ва омӯзиши динӣ',
    ],
    noteTitle: 'Таваҷҷӯҳ кунед',
    noteText: 'Баъзе тафсилот (масалан, хондани мустақими Қуръон ё ворид шудан ба масҷид) вобаста ба мазҳаби фиқҳӣ метавонад гуногун бошад; барои ин ҳолатҳои мушаххас беҳтар аст ба назаре, ки одатан пайравӣ мекунед, ё олими салоҳиятдор муроҷиат намоед.',
    section3Body: 'Анҷоми ҳайз бозгашти тадриҷӣ ба ҳолати покии маросимиро нишон медиҳад. Аз ҷиҳати ҷисмонӣ ин ба қатъи хунравӣ мувофиқ аст, нишонае, ки анъанаҳои гуногуни илмӣ метавонанд бо нозукиҳои андак фарқкунанда муайян кунанд.',
    visual1Title: 'Раванди физиологӣ',
    visual1Text: 'Фаҳмидани марҳилаҳои давра ба шумо кумак мекунад лаҳзаеро, ки ҳайз воқеан ба охир мерасад, беҳтар муайян кунед.',
    section3Body2: 'Пас аз он ки ин нишона мушоҳида шуд, ғусл (таҳорати калон) имкон медиҳад ба покии маросимӣ баргардед ва амалҳои ибодатеро, ки қатъ шуда буданд, аз сар гиред.',
    section4Body: 'Ғусл таҳорати калони маросимист, ки шустани тамоми бадан бо нияти покӣ иборат аст. Он анҷоми озодиро нишон медиҳад ва имкон медиҳад намоз ба таври муқаррарӣ аз сар гирифта шавад, бидуни он ки намозҳои дар вақти ҳайз аз даст рафта қазо карда шаванд.',
    visual2Title: 'Маросими покшавӣ',
    visual2Text: 'Тарзи дақиқи иҷрои ғусл вобаста ба мазҳаби фиқҳии пайравишаванда метавонад андаке фарқ кунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Агар қадамҳои дақиқи мазҳаби худро намедонед, шахси боэътимод ё олими салоҳиятдор онҳоро ба шумо ба таври возеҳ шарҳ дода метавонад.',
    section5Body: 'Маъмул аст, ки дар бораи он ки ҳайз воқеан кай ба охир расидааст, шубҳа эҳсос шавад, хусусан вақте ки хунравӣ тадриҷан кам мешавад, на ногаҳон қатъ мегардад.',
    checkList2Title: 'Чанд нишонаи муфид',
    doubtMarkers: [
      'Набудани комили хунравиро мушоҳида кунед, на танҳо камшавии онро',
      'Пеш аз хулоса баровардан дар бораи анҷоми ҳайз вақти кофӣ гузаронед',
      'Ба мушоҳидаи равшан такя кунед, на ба таассуроти оддӣ',
      'Суръати одатии худро, ки аз давра то давра фарқ карда метавонад, ба назар гиред',
    ],
    alert2Title: 'Маълумоти муҳим',
    alert2Text: 'Дар сурати хунравии дарозмуддат ё номунтазам, ё шубҳаи доимӣ, ин вазъиятҳо сазоворанд, ки бо олими салоҳиятдор муҳокима шаванд, ки метавонад шуморо мувофиқи вазъияти шахсиатон роҳнамоӣ кунад. Ин мазмун иттилоотӣ мемонад ва роҳнамоии инфиродии диниро иваз намекунад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Ин нишонаҳо ёдоварии умумии таълимӣ мебошанд. Ҳар вазъият метавонад хусусиятҳои худро дошта бошад: дар сурати шубҳа, гуфтугӯ бо олими салоҳиятдор беҳтарин манбаъ барои посухи мувофиқ ба вазъияти шумо боқӣ мемонад.',
    shareMessage: 'Ҳолати покӣ: асосҳо — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ ЖАНА ТАЗАЛЫК',
    title: 'Тазалык абалы:\nнегиздер',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Бул мезгилге даанараак жакындоо үчүн цикл менен ибадаттык тазалык абалынын ортосундагы байланышты түшүнүү.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Ибадаттык тазалык эмнени билдирерин түшүнүү',
      'Етек кирим жана ибадаттан бошотуу',
      'Етек киримден кийин: тазалыкка кайтууну таануу',
      'Гусул: анын ролун түшүнүү',
      'Ишенбегенде эмне кылуу керек?',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Ислам салтында ибадаттык тазалык (тахара) намаз сыяктуу айрым ибадаттарды аткаруу үчүн талап кылынган абалды билдирет. Ал күнүмдүк мааниде тазалыкты эмес, фикх тааныган жана аял циклинин этаптарына жараша өзгөргөн белгилүү абалды билдирет.',
    section2Body: 'Етек кирим учурунда аял айрым ибадаттардан, атап айтканда намаздан жана Рамазан орозосунан бошотулат, аларды кийин толтурса болот. Бул бошотуу жеңилдик катары таанылат, жаза катары эмес.',
    checkList1Title: 'Етек кирим учурунда эмне жеткиликтүү бойдон калат',
    duringPeriod: [
      'Зикир (Аллахты эскерүү) жана дуалар',
      'Билим берүүчү жана руханий мазмунду угуу же окуу',
      'Жакындарыңыздын диний практикасын колдоо',
      'Диний ой жүгүртүү жана үйрөнүү',
    ],
    noteTitle: 'Көңүл буруңуз',
    noteText: 'Айрым чоо-жайлар (мисалы, Куранды түз окуу же мечитке кирүү) фикх мектебине жараша айырмаланышы мүмкүн; бул өзгөчө учурлар үчүн адатта ээрчип жүргөн пикириңизге же квалификациялуу окумуштууга кайрылган жакшы.',
    section3Body: 'Етек киримдин аякташы ибадаттык тазалык абалына акырындап кайтууну белгилейт. Физикалык жактан бул кан кетүүнүн токтошуна туура келет, бул белгини ар кандай окумуштуулук салттар бир аз ар башка нюанстар менен аныкташы мүмкүн.',
    visual1Title: 'Физиологиялык процесс',
    visual1Text: 'Циклдин этаптарын түшүнүү етек кирим чындап аяктаган учурду жакшыраак аныктоого жардам берет.',
    section3Body2: 'Бул белги байкалгандан кийин, гусул (чоң даарат) ибадаттык тазалыкка кайтууга жана токтотулган ибадаттарды улантууга мүмкүндүк берет.',
    section4Body: 'Гусул — өзүн тазалоо ниети менен бүт денени жуууну камтыган чоң ибадаттык даарат. Ал бошотуунун аякташын белгилейт жана етек кирим учурунда өткөрүлгөн намаздардын ордун толтуруунун кереги жок, намазды кадимкидей улантууга мүмкүндүк берет.',
    visual2Title: 'Тазалануу ырымы',
    visual2Text: 'Гусулдун так аткарылышы ээрчилген фикх мектебине жараша бир аз айырмаланышы мүмкүн.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Эгер өз мектебиңизде ээрчилген так кадамдарды билбесеңиз, ишенген адамыңыз же квалификациялуу окумуштуу аларды сизге даана түшүндүрүп бере алат.',
    section5Body: 'Етек кирим чындап качан аяктаганына күмөн саноо кеңири таралган, айрыкча кан кетүү капыстан токтобостон акырындап азайганда.',
    checkList2Title: 'Бир нече пайдалуу белги',
    doubtMarkers: [
      'Кан кетүүнүн толук жоктугун байкаңыз, жөн гана азайганын эмес',
      'Етек кирим аяктады деген жыйынтык чыгарардан мурун жетиштүү убакыт өтүшүнө мүмкүнчүлүк бериңиз',
      'Жөн гана таасирге эмес, даана байкоого таянңыз',
      'Циклден циклге өзгөрүшү мүмкүн болгон өзүңүздүн адаттагы ритмиңизди эске алыңыз',
    ],
    alert2Title: 'Маанилүү маалымат',
    alert2Text: 'Узакка созулган же туура эмес кан кетүү же улана берген күмөн учурларында бул абалдарды жеке абалыңызга ылайык багыт бере турган квалификациялуу окумуштуу менен талкуулоого татыйт. Бул мазмун маалымат берүүчү бойдон калат жана жекелештирилген диний жетекчиликти алмаштырбайт.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Бул белгилер жалпы билим берүүчү эскертүүлөр. Ар бир абалдын өз өзгөчөлүктөрү болушу мүмкүн: күмөн болсо, квалификациялуу окумуштуу менен диалог абалыңызга ылайык жооп алуу үчүн эң жакшы булак бойдон калат.',
    shareMessage: 'Тазалык абалы: негиздер — AWA',
  },
  tk: {
    badge: 'AÝBAŞY WE ARASSALYK',
    title: 'Arassalyk ýagdaýy:\nesaslar',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Bu döwre has aýdyňlyk bilen ýakynlaşmak üçin sikl bilen dini arassalyk ýagdaýynyň arasyndaky baglanyşygy düşünmek.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Dini arassalygyň nämäni aňladýandygyny düşünmek',
      'Aýbaşy we ybadatdan erkinlik',
      'Aýbaşydan soň: arassalyga gaýdyp gelmegi tanamak',
      'Gusul: onuň rolunu düşünmek',
      'Ynamsyz bolanyňyzda näme etmeli?',
      'Esasy netijeler',
    ],
    section1Body: 'Yslam däbinde dini arassalyk (tahara) namaz ýaly käbir ybadatlary ýerine ýetirmek üçin zerur ýagdaýy aňladýar. Ol gündelik manydaky arassaçylygy däl, eýsem aýal sikliniň tapgyrlaryna görä üýtgeýän, fikh tarapyndan ykrar edilen belli bir ýagdaýy aňladýar.',
    section2Body: 'Aýbaşy wagtynda aýal käbir ybadatlardan, aýratyn-da namazdan we soňra dolup boljak Remezan orazasyndan, erkin edilýär. Bu erkinlik jeza hökmünde däl, eýsem ýeňillik hökmünde ykrar edilýär.',
    checkList1Title: 'Aýbaşy wagtynda näme elýeter bolup galýar',
    duringPeriod: [
      'Zikir (Hudaýy ýatlamak) we dogalar (dua)',
      'Bilim beriji we ruhy mazmuny diňlemek ýa-da okamak',
      'Ýakynlaryňyzyň dini tejribesine goldaw bermek',
      'Dini oýlanma we öwrenmek',
    ],
    noteTitle: 'Üns beriň',
    noteText: 'Käbir jikme-jiklikler (meselem, Gurhany göni okamak ýa-da metjide girmek) hukuk mekdebine görä tapawutlanyp biler; bu aýratyn ýagdaýlar üçin adatça eýerýän pikiriňize ýa-da bilimli alyma ýüz tutmak has gowy.',
    section3Body: 'Aýbaşynyň ahyry dini arassalyk ýagdaýyna ýuwaş-ýuwaşdan gaýdyp gelmegi bellemek. Fiziki taýdan bu gan akmanyň kesilmegine gabat gelýär, dürli alymlar däpleri bu belligi az-kem dürli nuanslar bilen kesgitläp biler.',
    visual1Title: 'Fiziologik proses',
    visual1Text: 'Sikliň tapgyrlaryny düşünmek aýbaşynyň hakykatdan haçan gutarýandygyny has gowy kesgitlemäge kömek edýär.',
    section3Body2: 'Bu bellik görlenden soň, gusul (uly täret) dini arassalyga gaýdyp gelmäge we togtadylan ybadatlary täzeden başlamaga mümkinçilik berýär.',
    section4Body: 'Gusul — arassalanmak niýeti bilen bütin bedeni ýuwmagy öz içine alýan uly dini täret. Ol erkinligiň gutarýandygyny belleýär we aýbaşy wagtynda sypdyrylan namazlary dolmaga zerurlyk bolmazdan, namazyň adaty ýagdaýda dowam etmegine mümkinçilik berýär.',
    visual2Title: 'Arassalanmak ritualy',
    visual2Text: 'Gusulyň takyk ýerine ýetirilişi eýerilýän hukuk mekdebine görä az-kem tapawutlanyp biler.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Mekdebiňizde eýerilýän takyk ädimleri bilmeseňiz, ynanýan adamyňyz ýa-da bilimli alym olary size aýdyň düşündirip biler.',
    section5Body: 'Aýbaşynyň haçan hakykatdan gutarandygy barada şübhe etmek, aýratyn-da gan akma birden kesilmän, ýuwaş-ýuwaşdan azalanda, adaty zat.',
    checkList2Title: 'Käbir peýdaly bellikler',
    doubtMarkers: [
      'Diňe azalmagy däl, gan akmanyň doly ýoklugyny synlaň',
      'Aýbaşynyň gutarandygy barada netije çykarmazdan öň ýeterlik wagt geçmegine ýol beriň',
      'Ýönekeý duýgy däl-de, aýdyň synlamaga daýanyň',
      'Sikldan sika üýtgäp biljek öz adaty ritmiňizi hasaba alyň',
    ],
    alert2Title: 'Möhüm maglumat',
    alert2Text: 'Uzak dowam edýän ýa-da düzgünsiz gan akma ýa-da dowamly şübhe ýagdaýynda, bu ýagdaýlar şahsy ýagdaýyňyza görä size ugur görkezip biljek bilimli alym bilen maslahatlaşmaga mynasyp. Bu mazmun maglumat berýän bolup galýar we aýry-aýry dini ugrukdyrmany çalyşmaýar.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Bu bellikler umumy bilim beriji ýatlatmalar. Her ýagdaýyň öz aýratynlyklary bolup biler: şübhe bolanda, bilimli alym bilen söhbetdeşlik ýagdaýyňyza laýyk jogap üçin iň gowy çeşme bolup galýar.',
    shareMessage: 'Arassalyk ýagdaýy: esaslar — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenstruationPurityArticleScreen({
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            <AwaText variant="titleSmall" emphasized style={styles.checkListTitle}>
              {content.checkList1Title}
            </AwaText>

            {content.duringPeriod.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.process}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>{content.visual1Title}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visual1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.ghusl}
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
            5. {content.topics[4]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            <AwaText variant="titleSmall" emphasized style={styles.checkListTitle}>{content.checkList2Title}</AwaText>

            {content.doubtMarkers.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

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
    marginTop: 16,
    padding: 12,
  },
  checkListTitle: {marginBottom: 8},
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
