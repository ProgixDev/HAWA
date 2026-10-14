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
const CONTENT = {
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
} as const;

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

          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>
              {content.checkList1Title}
            </Text>

            {content.duringPeriod.map(item => (
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

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.process}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.visual1Title}</Text>

              <Text style={styles.visualText}>
                {content.visual1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.ghusl}
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

          <Text style={styles.h2}>
            5. {content.topics[4]}
          </Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>{content.checkList2Title}</Text>

            {content.doubtMarkers.map(item => (
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

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

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
    marginTop: 15,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  checkListTitle: {marginBottom: 9, fontSize: 13, color: theme.colors.text, fontWeight: '800'},
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
