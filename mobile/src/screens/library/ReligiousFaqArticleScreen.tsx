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

const ID = 'religiousfaq-questions-frequentes';

const HERO = require('../../assets/images/library/popular-flower.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'QUESTIONS FRÉQUENTES',
    title: 'Questions fréquentes\nde fiqh féminin',
    metaDuration: '8 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les interrogations les plus posées sur le fiqh féminin, réunies en un endroit avec des réponses claires.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les questions qui reviennent souvent',
      'Des écoles juridiques qui peuvent varier',
      'En cas de doute persistant',
      'Points clés à retenir',
    ],
    section1Body: 'De nombreuses questions autour du cycle, de la prière et du jeûne reviennent régulièrement d’une femme à l’autre. Voici des réponses générales aux plus fréquentes ; pour aller plus loin, chaque thème est aussi développé dans un article dédié.',
    faqItems: [
      [
        'Qu’est-ce que le fiqh féminin ?',
        'Le fiqh féminin regroupe les règles pratiques qui concernent spécifiquement le corps et le culte des femmes : cycle, pureté, prière, jeûne, nifas et istihâda.',
      ],
      [
        'Quels sont les grands sujets couverts par le fiqh féminin ?',
        'Il aborde notamment les règles et le cycle, la pureté rituelle, le ghusl, la prière et le jeûne pendant et après les règles, le nifas et l’istihâda.',
      ],
      [
        'Quelle est la différence entre règles, saignements post-partum et saignements irréguliers ?',
        'Les règles (hayd) suivent le cycle habituel, le nifas survient après l’accouchement, et l’Istihâda désigne un saignement irrégulier, hors cycle. Chacun suit un statut différent.',
      ],
      [
        'Qu’advient-il de la prière pendant les règles ?',
        'La prière est suspendue pendant cette période : il s’agit d’une dispense reconnue, à vivre sans culpabilité.',
      ],
      [
        'Qu’advient-il du jeûne pendant les règles ?',
        'Le jeûne est également suspendu ; les jours non jeûnés sont rattrapés plus tard (qadaa), en dehors du Ramadan.',
      ],
      [
        'Pourquoi les prières manquées ne sont-elles généralement pas rattrapées, contrairement au jeûne ?',
        'Cette différence tient à la nature des deux actes : la prière est quotidienne et répétée, tandis que le jeûne est annuel et concentré sur un mois. Suivre la dispense fait pleinement partie de la pratique religieuse.',
      ],
      [
        'Quand la prière reprend-elle après les règles ?',
        'Dès que les règles sont terminées et que le ghusl a été effectué, la prière reprend normalement, sans délai.',
      ],
      [
        'Quel est le rôle du ghusl ?',
        'Le ghusl est la grande ablution qui permet de retrouver l’état de pureté rituelle nécessaire pour reprendre la prière et d’autres actes d’adoration.',
      ],
      [
        'Que faire si on n’est pas sûre que les règles sont terminées ?',
        'Observer l’absence totale de saignement pendant un temps suffisant, plutôt que de se fier à une impression ponctuelle, aide à clarifier la situation.',
      ],
      [
        'Peut-on pratiquer d’autres formes d’adoration pendant les règles ?',
        'Oui : le dhikr, les invocations, la charité, l’apprentissage religieux et d’autres gestes de bienveillance restent accessibles.',
      ],
      [
        'Pourquoi certaines réponses peuvent-elles varier selon la situation ?',
        'Le fiqh est un champ d’interprétation : les avis peuvent varier selon les écoles juridiques et les circonstances personnelles, sans qu’un avis soit à lui seul absolu.',
      ],
    ],
    section2Body1: 'Le fiqh islamique comporte des différences d’interprétation reconnues sur certains points de détail. Ces différences existent depuis des siècles et sont considérées comme légitimes au sein de la tradition religieuse.',
    section2Body2: 'Selon la source consultée, une même question peut ainsi recevoir des réponses légèrement différentes. Cela ne signifie pas qu’une réponse serait automatiquement fausse : cela reflète des méthodologies et des lectures différentes des mêmes sources.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Suivre une source qualifiée de manière cohérente, plutôt que de changer constamment d’avis selon les réponses trouvées, aide à garder une pratique claire et sereine.',
    section3Body: 'Certaines situations restent difficiles à trancher à partir d’une seule explication générale. C’est notamment le cas lorsque :',
    doubtSituations: [
      'Il y a une incertitude sur la fin réelle des règles',
      'La nature d’un saignement reste incertaine (règles, istihâda, autre)',
      'Un doute persiste sur la nécessité d’effectuer le ghusl',
      'La question de la reprise de la prière reste incertaine',
      'Des informations contradictoires ont été trouvées en ligne',
    ],
    alert2Title: 'Information importante',
    alert2Text: 'Lorsqu’une situation est personnelle, complexe ou persistante, elle ne peut pas être résolue par une information générale. Le recours à un savant ou une savante qualifiée, capable de tenir compte de ta situation précise, reste alors la meilleure approche. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    keyPoints: [
      'Le fiqh féminin couvre de nombreux aspects de la pratique religieuse des femmes',
      'Certains détails peuvent légitimement varier selon les écoles',
      'Une information générale ne remplace pas un avis religieux personnalisé',
      'Un doute persistant mérite d’être posé à un savant qualifié',
      'Le rôle d’AWA est éducatif, non de délivrer des fatwas',
    ],
    shareMessage: 'Questions fréquentes de fiqh féminin — AWA',
  },
  en: {
    badge: 'FREQUENTLY ASKED QUESTIONS',
    title: 'Frequently asked questions\non women’s fiqh',
    metaDuration: '8 min read',
    metaType: 'FAQ',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The most common questions about women’s fiqh, gathered in one place with clear answers.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Questions that come up often',
      'Schools of jurisprudence that may vary',
      'In case of persistent doubt',
      'Key takeaways',
    ],
    section1Body: 'Many questions about the cycle, prayer, and fasting come up regularly from one woman to another. Here are general answers to the most frequent ones; to go further, each topic is also covered in more depth in its own dedicated article.',
    faqItems: [
      [
        'What is women’s fiqh?',
        'Women’s fiqh brings together the practical rules that specifically concern women’s bodies and worship: the cycle, purity, prayer, fasting, nifas, and istihâda.',
      ],
      [
        'What are the main topics covered by women’s fiqh?',
        'It covers in particular menstruation and the cycle, ritual purity, ghusl, prayer and fasting during and after menstruation, nifas, and istihâda.',
      ],
      [
        'What is the difference between menstruation, postpartum bleeding, and irregular bleeding?',
        'Menstruation (hayd) follows the usual cycle, nifas occurs after childbirth, and istihâda refers to irregular bleeding, outside the cycle. Each follows a different status.',
      ],
      [
        'What happens to prayer during menstruation?',
        'Prayer is suspended during this time: it is a recognized exemption, to be experienced without guilt.',
      ],
      [
        'What happens to fasting during menstruation?',
        'Fasting is also suspended; the days not fasted are made up later (qadaa), outside of Ramadan.',
      ],
      [
        'Why are missed prayers generally not made up, unlike fasting?',
        'This difference is due to the nature of the two acts: prayer is daily and repeated, while fasting is annual and concentrated within one month. Following the exemption is fully part of religious practice.',
      ],
      [
        'When does prayer resume after menstruation?',
        'As soon as menstruation has ended and ghusl has been performed, prayer resumes normally, without delay.',
      ],
      [
        'What is the role of ghusl?',
        'Ghusl is the major ablution that allows one to return to the state of ritual purity needed to resume prayer and other acts of worship.',
      ],
      [
        'What should you do if you’re not sure menstruation has ended?',
        'Observing the total absence of bleeding for a sufficient amount of time, rather than relying on a one-off impression, helps clarify the situation.',
      ],
      [
        'Can other forms of worship be practiced during menstruation?',
        'Yes: dhikr, supplications, charity, religious learning, and other acts of kindness remain accessible.',
      ],
      [
        'Why can some answers vary depending on the situation?',
        'Fiqh is a field of interpretation: opinions can vary depending on the school of jurisprudence and personal circumstances, without any single opinion being absolute on its own.',
      ],
    ],
    section2Body1: 'Islamic fiqh includes recognized differences of interpretation on certain points of detail. These differences have existed for centuries and are considered legitimate within the religious tradition.',
    section2Body2: 'Depending on the source consulted, the same question can therefore receive slightly different answers. This does not mean that an answer would automatically be wrong: it reflects different methodologies and readings of the same sources.',
    tip1Title: 'Good to know',
    tip1Text: 'Consistently following a qualified source, rather than constantly changing opinion based on whatever answer is found, helps keep your practice clear and calm.',
    section3Body: 'Some situations remain difficult to settle based on a single general explanation. This is particularly the case when:',
    doubtSituations: [
      'There is uncertainty about when menstruation has actually ended',
      'The nature of bleeding remains uncertain (menstruation, istihâda, other)',
      'Doubt persists about the need to perform ghusl',
      'The question of resuming prayer remains uncertain',
      'Conflicting information has been found online',
    ],
    alert2Title: 'Important information',
    alert2Text: 'When a situation is personal, complex, or persistent, it cannot be resolved with general information. Turning to a qualified scholar, able to take your specific situation into account, remains the best approach in that case. AWA does not issue fatwas or personalized religious rulings.',
    keyPoints: [
      'Women’s fiqh covers many aspects of women’s religious practice',
      'Some details may legitimately vary depending on the school of jurisprudence',
      'General information does not replace personalized religious guidance',
      'A persistent doubt deserves to be raised with a qualified scholar',
      'AWA’s role is educational, not to issue fatwas',
    ],
    shareMessage: 'Frequently asked questions on women’s fiqh — AWA',
  },
  es: {
    badge: 'PREGUNTAS FRECUENTES',
    title: 'Preguntas frecuentes\nde fiqh femenino',
    metaDuration: '8 min de lectura',
    metaType: 'Preguntas frecuentes',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las preguntas más frecuentes sobre el fiqh femenino, reunidas en un solo lugar con respuestas claras.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las preguntas que más se repiten',
      'Escuelas jurídicas que pueden variar',
      'En caso de duda persistente',
      'Puntos clave para recordar',
    ],
    section1Body: 'Muchas preguntas en torno al ciclo, la oración y el ayuno se repiten con regularidad de una mujer a otra. Aquí tienes respuestas generales a las más frecuentes; para profundizar, cada tema también se desarrolla en un artículo dedicado.',
    faqItems: [
      [
        '¿Qué es el fiqh femenino?',
        'El fiqh femenino reúne las normas prácticas que conciernen específicamente al cuerpo y al culto de las mujeres: ciclo, pureza, oración, ayuno, nifas e istihada.',
      ],
      [
        '¿Cuáles son los grandes temas abarcados por el fiqh femenino?',
        'Aborda en particular la menstruación y el ciclo, la pureza ritual, el gusl, la oración y el ayuno durante y después de la menstruación, el nifas y la istihada.',
      ],
      [
        '¿Cuál es la diferencia entre la menstruación, los sangrados posparto y los sangrados irregulares?',
        'La menstruación (hayd) sigue el ciclo habitual, el nifas se produce después del parto, y la Istihada designa un sangrado irregular, fuera del ciclo. Cada uno sigue un estatus diferente.',
      ],
      [
        '¿Qué ocurre con la oración durante la menstruación?',
        'La oración queda suspendida durante este periodo: se trata de una dispensa reconocida, que se vive sin culpa.',
      ],
      [
        '¿Qué ocurre con el ayuno durante la menstruación?',
        'El ayuno también queda suspendido; los días no ayunados se recuperan más tarde (qadaa), fuera del Ramadán.',
      ],
      [
        '¿Por qué las oraciones no realizadas generalmente no se recuperan, a diferencia del ayuno?',
        'Esta diferencia se debe a la naturaleza de los dos actos: la oración es diaria y repetida, mientras que el ayuno es anual y se concentra en un mes. Seguir la dispensa forma plenamente parte de la práctica religiosa.',
      ],
      [
        '¿Cuándo se reanuda la oración después de la menstruación?',
        'En cuanto termina la menstruación y se ha realizado el gusl, la oración se reanuda con normalidad, sin demora.',
      ],
      [
        '¿Cuál es la función del gusl?',
        'El gusl es la ablución mayor que permite recuperar el estado de pureza ritual necesario para reanudar la oración y otros actos de adoración.',
      ],
      [
        '¿Qué hacer si no se está segura de que la menstruación ha terminado?',
        'Observar la ausencia total de sangrado durante un tiempo suficiente, en lugar de fiarse de una impresión puntual, ayuda a aclarar la situación.',
      ],
      [
        '¿Se pueden practicar otras formas de adoración durante la menstruación?',
        'Sí: el dhikr, las invocaciones, la caridad, el aprendizaje religioso y otros gestos de bondad siguen siendo accesibles.',
      ],
      [
        '¿Por qué algunas respuestas pueden variar según la situación?',
        'El fiqh es un campo de interpretación: las opiniones pueden variar según las escuelas jurídicas y las circunstancias personales, sin que ninguna opinión sea por sí sola absoluta.',
      ],
    ],
    section2Body1: 'El fiqh islámico incluye diferencias de interpretación reconocidas en ciertos puntos de detalle. Estas diferencias existen desde hace siglos y se consideran legítimas dentro de la tradición religiosa.',
    section2Body2: 'Según la fuente consultada, una misma pregunta puede recibir así respuestas ligeramente diferentes. Esto no significa que una respuesta sea automáticamente errónea: refleja metodologías y lecturas diferentes de las mismas fuentes.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Seguir una fuente cualificada de manera coherente, en lugar de cambiar constantemente de opinión según las respuestas encontradas, ayuda a mantener una práctica clara y serena.',
    section3Body: 'Algunas situaciones siguen siendo difíciles de resolver a partir de una sola explicación general. Este es el caso, en particular, cuando:',
    doubtSituations: [
      'Existe incertidumbre sobre el fin real de la menstruación',
      'La naturaleza de un sangrado sigue siendo incierta (menstruación, istihada, otro)',
      'Persiste una duda sobre la necesidad de realizar el gusl',
      'La cuestión de la reanudación de la oración sigue siendo incierta',
      'Se ha encontrado información contradictoria en internet',
    ],
    alert2Title: 'Información importante',
    alert2Text: 'Cuando una situación es personal, compleja o persistente, no puede resolverse con información general. Recurrir a un erudito o una erudita cualificada, capaz de tener en cuenta tu situación precisa, sigue siendo entonces el mejor enfoque. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    keyPoints: [
      'El fiqh femenino abarca numerosos aspectos de la práctica religiosa de las mujeres',
      'Algunos detalles pueden variar legítimamente según las escuelas',
      'Una información general no sustituye un consejo religioso personalizado',
      'Una duda persistente merece plantearse a un erudito cualificado',
      'El papel de AWA es educativo, no el de emitir fatuas',
    ],
    shareMessage: 'Preguntas frecuentes de fiqh femenino — AWA',
  },
  it: {
    badge: 'DOMANDE FREQUENTI',
    title: 'Domande frequenti\nsul fiqh delle donne',
    metaDuration: '8 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Le domande più comuni sul fiqh delle donne, raccolte in un unico posto con risposte chiare.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Le domande che ricorrono spesso',
      'Scuole giuridiche che possono differire',
      'In caso di dubbio persistente',
      'I punti essenziali',
    ],
    section1Body: 'Molte domande sul ciclo, sulla preghiera e sul digiuno si ripresentano con regolarità da una donna all’altra. Ecco risposte generali alle più frequenti; per approfondire, ogni argomento è trattato più nel dettaglio anche in un articolo dedicato.',
    faqItems: [
      [
        'Che cos’è il fiqh delle donne?',
        'Il fiqh delle donne riunisce le regole pratiche che riguardano in modo specifico il corpo e il culto delle donne: il ciclo, la purezza, la preghiera, il digiuno, il nifas e l’istihâda.',
      ],
      [
        'Quali sono i principali argomenti trattati dal fiqh delle donne?',
        'Riguarda in particolare le mestruazioni e il ciclo, la purezza rituale, il ghusl, la preghiera e il digiuno durante e dopo le mestruazioni, il nifas e l’istihâda.',
      ],
      [
        'Qual è la differenza tra mestruazioni, sanguinamento post-partum e sanguinamento irregolare?',
        'Le mestruazioni (hayd) seguono il ciclo abituale, il nifas si verifica dopo il parto e l’istihâda indica un sanguinamento irregolare, al di fuori del ciclo. Ognuno segue uno status diverso.',
      ],
      [
        'Che cosa succede alla preghiera durante le mestruazioni?',
        'La preghiera è sospesa in questo periodo: è un’esenzione riconosciuta, da vivere senza sensi di colpa.',
      ],
      [
        'Che cosa succede al digiuno durante le mestruazioni?',
        'Anche il digiuno è sospeso; i giorni non digiunati vengono recuperati più tardi (qadaa), al di fuori del Ramadan.',
      ],
      [
        'Perché le preghiere perse in genere non si recuperano, a differenza del digiuno?',
        'Questa differenza dipende dalla natura dei due atti: la preghiera è quotidiana e ripetuta, mentre il digiuno è annuale e concentrato in un solo mese. Seguire l’esenzione fa pienamente parte della pratica religiosa.',
      ],
      [
        'Quando si riprende la preghiera dopo le mestruazioni?',
        'Non appena le mestruazioni sono terminate e il ghusl è stato eseguito, la preghiera riprende normalmente, senza ritardo.',
      ],
      [
        'Qual è il ruolo del ghusl?',
        'Il ghusl è l’abluzione maggiore che permette di tornare allo stato di purezza rituale necessario per riprendere la preghiera e gli altri atti di culto.',
      ],
      [
        'Che cosa fare se non sei sicura che le mestruazioni siano terminate?',
        'Osservare l’assenza totale di sanguinamento per un tempo sufficiente, anziché affidarsi a un’impressione isolata, aiuta a fare chiarezza sulla situazione.',
      ],
      [
        'Si possono praticare altre forme di culto durante le mestruazioni?',
        'Sì: dhikr, suppliche, carità, studio religioso e altri gesti di bontà restano accessibili.',
      ],
      [
        'Perché alcune risposte possono variare a seconda della situazione?',
        'Il fiqh è un campo di interpretazione: le opinioni possono variare a seconda della scuola giuridica e delle circostanze personali, senza che nessuna opinione sia assoluta di per sé.',
      ],
    ],
    section2Body1: 'Il fiqh islamico comprende differenze di interpretazione riconosciute su alcuni punti di dettaglio. Queste differenze esistono da secoli e sono considerate legittime all’interno della tradizione religiosa.',
    section2Body2: 'A seconda della fonte consultata, la stessa domanda può quindi ricevere risposte leggermente diverse. Ciò non significa che una risposta sia automaticamente sbagliata: riflette metodologie e letture diverse delle stesse fonti.',
    tip1Title: 'Da sapere',
    tip1Text: 'Seguire con costanza una fonte qualificata, anziché cambiare continuamente opinione in base alla risposta che si trova, aiuta a mantenere la tua pratica chiara e serena.',
    section3Body: 'Alcune situazioni restano difficili da risolvere sulla base di una sola spiegazione generale. È il caso in particolare quando:',
    doubtSituations: [
      'C’è incertezza su quando le mestruazioni siano effettivamente terminate',
      'La natura del sanguinamento resta incerta (mestruazioni, istihâda, altro)',
      'Persiste il dubbio sulla necessità di eseguire il ghusl',
      'La questione della ripresa della preghiera resta incerta',
      'Hai trovato informazioni contrastanti online',
    ],
    alert2Title: 'Informazione importante',
    alert2Text: 'Quando una situazione è personale, complessa o persistente, non può essere risolta con informazioni generali. Rivolgersi a uno studioso qualificato, in grado di tenere conto della tua situazione specifica, resta in tal caso l’approccio migliore. AWA non emette fatwa né pareri religiosi personalizzati.',
    keyPoints: [
      'Il fiqh delle donne riguarda molti aspetti della pratica religiosa delle donne',
      'Alcuni dettagli possono legittimamente variare a seconda della scuola giuridica',
      'Le informazioni generali non sostituiscono una guida religiosa personalizzata',
      'Un dubbio persistente merita di essere sottoposto a uno studioso qualificato',
      'Il ruolo di AWA è educativo, non emettere fatwa',
    ],
    shareMessage: 'Domande frequenti sul fiqh delle donne — AWA',
  },
  tr: {
    badge: 'SIKÇA SORULAN SORULAR',
    title: 'Kadın fıkhı hakkında\nsıkça sorulan sorular',
    metaDuration: '8 dk okuma',
    metaType: 'SSS',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Kadın fıkhına dair en sık sorulan sorular, açık yanıtlarla tek bir yerde.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî konular yetkin âlimler tarafından doğrulanmalıdır. AWA fetva ya da kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Sık sorulan sorular',
      'Farklılık gösterebilen fıkıh mezhepleri',
      'Süren bir tereddüt durumunda',
      'Önemli çıkarımlar',
    ],
    section1Body: 'Döngü, namaz ve oruçla ilgili birçok soru bir kadından diğerine düzenli olarak gündeme gelir. İşte en sık sorulanlara genel yanıtlar; daha derine inmek için her konu kendi özel makalesinde de daha ayrıntılı ele alınmaktadır.',
    faqItems: [
      [
        'Kadın fıkhı nedir?',
        'Kadın fıkhı, kadınların bedenini ve ibadetini özellikle ilgilendiren pratik kuralları bir araya getirir: döngü, temizlik, namaz, oruç, nifas ve istihaze.',
      ],
      [
        'Kadın fıkhının ele aldığı başlıca konular nelerdir?',
        'Özellikle adet ve döngüyü, ritüel temizliği, gusülü, adet sırasında ve sonrasında namaz ile orucu, nifası ve istihazeyi kapsar.',
      ],
      [
        'Adet, doğum sonrası kanama ve düzensiz kanama arasındaki fark nedir?',
        'Adet (hayız) olağan döngüyü izler, nifas doğumdan sonra görülür, istihaze ise döngü dışındaki düzensiz kanamayı ifade eder. Her birinin durumu farklıdır.',
      ],
      [
        'Adet sırasında namaza ne olur?',
        'Bu süre içinde namaz askıdadır: kabul edilmiş bir muafiyettir ve suçluluk duymadan yaşanmalıdır.',
      ],
      [
        'Adet sırasında oruca ne olur?',
        'Oruç da askıdadır; tutulmayan günler daha sonra, Ramazan dışında kaza edilir.',
      ],
      [
        'Kılınamayan namazlar neden genellikle oruç gibi kaza edilmez?',
        'Bu fark iki ibadetin doğasından kaynaklanır: namaz günlük ve tekrarlıdır, oruç ise yıllıktır ve bir ay içinde yoğunlaşır. Muafiyete uymak, dinî pratiğin tam bir parçasıdır.',
      ],
      [
        'Adetten sonra namaz ne zaman yeniden başlar?',
        'Adet sona erdiğinde ve gusül yapıldığında namaz, gecikmeden normal şekilde yeniden başlar.',
      ],
      [
        'Gusülün rolü nedir?',
        'Gusül, namaza ve diğer ibadetlere yeniden başlamak için gereken ritüel temizlik haline dönmeyi sağlayan büyük abdesttir.',
      ],
      [
        'Adetin bittiğinden emin değilsen ne yapmalısın?',
        'Anlık bir izlenime güvenmek yerine, yeterli bir süre boyunca kanamanın tamamen yokluğunu gözlemlemek durumu netleştirmeye yardımcı olur.',
      ],
      [
        'Adet sırasında başka ibadetler yapılabilir mi?',
        'Evet: zikir, dua, sadaka, dinî öğrenim ve diğer hayır işleri erişilebilir kalır.',
      ],
      [
        'Bazı yanıtlar duruma göre neden değişebilir?',
        'Fıkıh bir yorum alanıdır: görüşler fıkıh mezhebine ve kişisel koşullara göre değişebilir; hiçbir görüş tek başına mutlak değildir.',
      ],
    ],
    section2Body1: 'İslam fıkhı, bazı ayrıntı noktalarında kabul görmüş yorum farklılıkları içerir. Bu farklılıklar yüzyıllardır vardır ve dinî gelenek içinde meşru sayılır.',
    section2Body2: 'Bu nedenle, başvurulan kaynağa göre aynı soru biraz farklı yanıtlar alabilir. Bu, bir yanıtın otomatik olarak yanlış olduğu anlamına gelmez: aynı kaynakların farklı yöntemlerle ve farklı okumalarla ele alındığını yansıtır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bulunan her yanıta göre sürekli görüş değiştirmek yerine yetkin bir kaynağı tutarlı biçimde izlemek, pratiğini açık ve sakin tutmana yardımcı olur.',
    section3Body: 'Bazı durumları tek bir genel açıklamayla çözmek zor olabilir. Özellikle şu durumlarda böyledir:',
    doubtSituations: [
      'Adetin gerçekte ne zaman bittiği konusunda belirsizlik varsa',
      'Kanamanın niteliği belirsiz kalıyorsa (adet, istihaze, diğer)',
      'Gusül yapma gerekliliği konusunda şüphe sürüyorsa',
      'Namaza yeniden başlama konusu belirsiz kalıyorsa',
      'İnternette çelişkili bilgilerle karşılaşıldıysa',
    ],
    alert2Title: 'Önemli bilgi',
    alert2Text: 'Bir durum kişisel, karmaşık ya da süreğen olduğunda genel bilgilerle çözülemez. Böyle bir durumda, kendi özel durumunu dikkate alabilecek yetkin bir âlime başvurmak en iyi yol olmaya devam eder. AWA fetva ya da kişiye özel dinî hüküm vermez.',
    keyPoints: [
      'Kadın fıkhı, kadınların dinî pratiğinin birçok yönünü kapsar',
      'Bazı ayrıntılar fıkıh mezhebine göre meşru biçimde değişebilir',
      'Genel bilgiler kişiye özel dinî rehberliğin yerini tutmaz',
      'Süren bir tereddüt, yetkin bir âlime danışılmayı hak eder',
      'AWA’nın rolü eğiticidir, fetva vermek değildir',
    ],
    shareMessage: 'Kadın fıkhı hakkında sıkça sorulan sorular — AWA',
  },
  ru: {
    badge: 'ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ',
    title: 'Часто задаваемые вопросы\nо женском фикхе',
    metaDuration: '8 мин чтения',
    metaType: 'Вопросы и ответы',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Самые частые вопросы о женском фикхе, собранные в одном месте, с понятными ответами.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у квалифицированных учёных. AWA не выносит фетв и не даёт индивидуальных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Вопросы, которые возникают часто',
      'Школы права, мнения которых могут различаться',
      'Если сомнение не проходит',
      'Главные выводы',
    ],
    section1Body: 'Многие вопросы о цикле, намазе и посте регулярно возникают у разных женщин. Ниже даны общие ответы на самые частые из них; чтобы узнать больше, каждая тема также подробнее раскрыта в отдельной статье.',
    faqItems: [
      [
        'Что такое женский фикх?',
        'Женский фикх объединяет практические правила, которые касаются именно женского тела и богослужения: цикл, чистота, намаз, пост, нифас и истихада.',
      ],
      [
        'Какие основные темы охватывает женский фикх?',
        'Он охватывает, в частности, менструацию и цикл, ритуальную чистоту, гусль, намаз и пост во время менструации и после неё, нифас и истихаду.',
      ],
      [
        'В чём разница между менструацией, послеродовыми выделениями и нерегулярными кровотечениями?',
        'Менструация (хайд) приходится на обычный цикл, нифас бывает после родов, а истихада — это нерегулярные кровотечения вне цикла. У каждого из них свой статус.',
      ],
      [
        'Что происходит с намазом во время менструации?',
        'В этот период намаз не совершается: это признанное освобождение, которое следует принимать без чувства вины.',
      ],
      [
        'Что происходит с постом во время менструации?',
        'Пост также не соблюдается; пропущенные дни восполняются позже (каза), вне Рамадана.',
      ],
      [
        'Почему пропущенные намазы, как правило, не восполняются, в отличие от поста?',
        'Эта разница связана с характером двух видов поклонения: намаз ежедневный и повторяющийся, а пост ежегодный и сосредоточен в одном месяце. Следование освобождению — полноценная часть религиозной практики.',
      ],
      [
        'Когда возобновляется намаз после менструации?',
        'Как только менструация закончилась и совершён гусль, намаз возобновляется в обычном порядке, без промедления.',
      ],
      [
        'Какова роль гусля?',
        'Гусль — это полное омовение, которое позволяет вернуться в состояние ритуальной чистоты, необходимое для возобновления намаза и других видов поклонения.',
      ],
      [
        'Что делать, если вы не уверены, что менструация закончилась?',
        'Прояснить ситуацию помогает наблюдение за полным отсутствием выделений в течение достаточного времени, а не опора на единичное впечатление.',
      ],
      [
        'Можно ли совершать другие виды поклонения во время менструации?',
        'Да: зикр, мольбы, милостыня, получение религиозных знаний и другие добрые дела остаются доступными.',
      ],
      [
        'Почему ответы на некоторые вопросы могут различаться в зависимости от ситуации?',
        'Фикх — область толкования: мнения могут различаться в зависимости от школы права и личных обстоятельств, и ни одно мнение само по себе не является абсолютным.',
      ],
    ],
    section2Body1: 'Исламский фикх допускает признанные различия в толковании некоторых частных вопросов. Эти различия существуют веками и считаются допустимыми в рамках религиозной традиции.',
    section2Body2: 'Поэтому в зависимости от выбранного источника на один и тот же вопрос могут быть даны немного разные ответы. Это не означает, что ответ автоматически неверен: он отражает разные методологии и прочтения одних и тех же источников.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Если последовательно придерживаться одного квалифицированного источника, а не постоянно менять мнение в зависимости от найденного ответа, ваша практика остаётся ясной и спокойной.',
    section3Body: 'Некоторые ситуации сложно разрешить на основе одного общего объяснения. Это особенно так, когда:',
    doubtSituations: [
      'Есть неуверенность в том, когда именно закончилась менструация',
      'Природа выделений остаётся неясной (менструация, истихада, другое)',
      'Сомнение сохраняется в необходимости совершить гусль',
      'Вопрос о возобновлении намаза остаётся неясным',
      'В интернете найдена противоречивая информация',
    ],
    alert2Title: 'Важная информация',
    alert2Text: 'Если ситуация личная, сложная или затяжная, общая информация не может её разрешить. В этом случае лучше всего обратиться к квалифицированному учёному, способному учесть вашу конкретную ситуацию. AWA не выносит фетв и не даёт индивидуальных религиозных заключений.',
    keyPoints: [
      'Женский фикх охватывает многие аспекты религиозной практики женщины',
      'Некоторые детали могут допустимо различаться в зависимости от школы права',
      'Общая информация не заменяет индивидуального религиозного наставления',
      'Устойчивое сомнение стоит обсудить с квалифицированным учёным',
      'Роль AWA — образовательная, а не вынесение фетв',
    ],
    shareMessage: 'Часто задаваемые вопросы о женском фикхе — AWA',
  },
  de: {
    badge: 'HÄUFIGE FRAGEN',
    title: 'Häufige Fragen\nzum Fiqh der Frau',
    metaDuration: '8 Min. Lesezeit',
    metaType: 'Häufige Fragen',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Die häufigsten Fragen zum Fiqh der Frau, an einem Ort gesammelt und klar beantwortet.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt ist rein bildend. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA erteilt keine Fatwas und keine persönlichen religiösen Urteile.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Häufig gestellte Fragen',
      'Rechtsschulen, die abweichen können',
      'Bei anhaltender Unsicherheit',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Viele Fragen zu Zyklus, Gebet und Fasten stellen sich immer wieder, von Frau zu Frau. Hier findest du allgemeine Antworten auf die häufigsten; für mehr Tiefe wird jedes Thema auch in einem eigenen Artikel ausführlicher behandelt.',
    faqItems: [
      [
        'Was ist der Fiqh der Frau?',
        'Der Fiqh der Frau umfasst die praktischen Regeln, die speziell den Körper und den Gottesdienst der Frau betreffen: Zyklus, Reinheit, Gebet, Fasten, Nifas und Istihada.',
      ],
      [
        'Welche Hauptthemen behandelt der Fiqh der Frau?',
        'Er behandelt insbesondere die Menstruation und den Zyklus, die rituelle Reinheit, den Ghusl, Gebet und Fasten während und nach der Menstruation, Nifas und Istihada.',
      ],
      [
        'Was ist der Unterschied zwischen Menstruation, Wochenbettblutung und unregelmäßiger Blutung?',
        'Die Menstruation (Hayd) folgt dem gewohnten Zyklus, Nifas tritt nach der Geburt auf, und Istihada bezeichnet unregelmäßige Blutungen außerhalb des Zyklus. Jede hat einen eigenen Status.',
      ],
      [
        'Was geschieht mit dem Gebet während der Menstruation?',
        'Das Gebet ist in dieser Zeit ausgesetzt: Es handelt sich um eine anerkannte Befreiung, die ohne Schuldgefühle gelebt werden darf.',
      ],
      [
        'Was geschieht mit dem Fasten während der Menstruation?',
        'Auch das Fasten ist ausgesetzt; die nicht gefasteten Tage werden später außerhalb des Ramadan nachgeholt (Qada).',
      ],
      [
        'Warum werden versäumte Gebete im Allgemeinen nicht nachgeholt, das Fasten aber schon?',
        'Dieser Unterschied beruht auf der Natur der beiden Handlungen: Das Gebet ist täglich und wiederholt sich, das Fasten ist jährlich und auf einen Monat konzentriert. Die Befreiung in Anspruch zu nehmen gehört vollständig zur religiösen Praxis.',
      ],
      [
        'Wann wird das Gebet nach der Menstruation wieder aufgenommen?',
        'Sobald die Menstruation beendet ist und der Ghusl vollzogen wurde, wird das Gebet ohne Verzögerung wieder normal aufgenommen.',
      ],
      [
        'Welche Rolle spielt der Ghusl?',
        'Der Ghusl ist die große rituelle Waschung, durch die man in den Zustand ritueller Reinheit zurückkehrt, der für die Wiederaufnahme des Gebets und anderer Gottesdienste nötig ist.',
      ],
      [
        'Was tun, wenn du nicht sicher bist, ob die Menstruation beendet ist?',
        'Die vollständige Abwesenheit von Blutungen über ausreichend lange Zeit zu beobachten, statt sich auf einen einzelnen Eindruck zu verlassen, hilft, die Situation zu klären.',
      ],
      [
        'Kann man während der Menstruation andere Formen des Gottesdienstes ausüben?',
        'Ja: Dhikr, Bittgebete, Almosen, religiöses Lernen und andere gute Taten bleiben möglich.',
      ],
      [
        'Warum können manche Antworten je nach Situation unterschiedlich ausfallen?',
        'Der Fiqh ist ein Feld der Auslegung: Die Meinungen können je nach Rechtsschule und persönlichen Umständen variieren, ohne dass eine einzelne Meinung für sich allein absolut wäre.',
      ],
    ],
    section2Body1: 'Der islamische Fiqh kennt anerkannte Auslegungsunterschiede bei einzelnen Detailfragen. Diese Unterschiede bestehen seit Jahrhunderten und gelten innerhalb der religiösen Tradition als legitim.',
    section2Body2: 'Je nach konsultierter Quelle kann dieselbe Frage daher etwas unterschiedlich beantwortet werden. Das bedeutet nicht, dass eine Antwort automatisch falsch wäre: Es spiegelt unterschiedliche Methoden und Lesarten derselben Quellen wider.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Wenn du dich beständig an eine qualifizierte Quelle hältst, statt je nach gefundener Antwort ständig die Meinung zu wechseln, bleibt deine Praxis klar und ruhig.',
    section3Body: 'Manche Situationen lassen sich mit einer einzigen allgemeinen Erklärung nur schwer klären. Das ist besonders der Fall, wenn:',
    doubtSituations: [
      'Unsicherheit besteht, wann die Menstruation tatsächlich beendet ist',
      'Die Art der Blutung unklar bleibt (Menstruation, Istihada, anderes)',
      'Zweifel bleiben, ob ein Ghusl nötig ist',
      'Unklar bleibt, ob das Gebet wieder aufgenommen werden soll',
      'Widersprüchliche Informationen im Internet gefunden wurden',
    ],
    alert2Title: 'Wichtiger Hinweis',
    alert2Text: 'Wenn eine Situation persönlich, komplex oder anhaltend ist, lässt sie sich nicht mit allgemeinen Informationen klären. Dann bleibt es der beste Weg, sich an eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten zu wenden, die oder der deine konkrete Situation berücksichtigen kann. AWA erteilt keine Fatwas und keine persönlichen religiösen Urteile.',
    keyPoints: [
      'Der Fiqh der Frau umfasst viele Aspekte der religiösen Praxis der Frau',
      'Manche Details können je nach Rechtsschule legitimerweise abweichen',
      'Allgemeine Informationen ersetzen keine persönliche religiöse Beratung',
      'Ein anhaltender Zweifel sollte einer qualifizierten Gelehrten oder einem qualifizierten Gelehrten vorgelegt werden',
      'Die Rolle von AWA ist bildend, nicht das Erteilen von Fatwas',
    ],
    shareMessage: 'Häufige Fragen zum Fiqh der Frau — AWA',
  },
  zh: {
      badge: '常见问题',
      title: '女性教法学\n常见问题',
      metaDuration: '阅读约 8 分钟',
      metaType: '常见问题',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '关于女性教法学最常见的问题，集中在这里，并附上清晰的解答。',
      disclaimerTitle: '重要说明',
      disclaimerText: '本内容纯属教育性质。宗教问题应由合格的学者来确认。AWA 不发布法特瓦（fatwa），也不提供个人化的宗教裁定。',
      contentsTitle: '本文内容',
      topics: [
        '经常出现的问题',
        '可能存在差异的教法学派',
        '如果疑惑始终存在',
        '要点回顾',
      ],
      section1Body: '关于月经周期、礼拜和斋戒，许多女性都会经常遇到类似的问题。这里给出最常见问题的一般性解答；如果想了解更多，每个主题在各自的专题文章中也有更深入的介绍。',
      faqItems: [
        [
          '什么是女性教法学？',
          '女性教法学汇集了专门涉及女性身体与宗教功修的实践规定：月经周期、洁净、礼拜、斋戒、产后恶露期（Nifas）和伊斯提哈达（Istihada）。',
        ],
        [
          '女性教法学主要涉及哪些主题？',
          '它尤其涉及月经与月经周期、仪式性洁净、大净（Ghusl）、月经期间及之后的礼拜与斋戒、产后恶露期（Nifas）和伊斯提哈达（Istihada）。',
        ],
        [
          '月经、产后出血和不规则出血有什么区别？',
          '月经（hayd）遵循平常的月经周期，产后恶露期（Nifas）出现在分娩之后，而伊斯提哈达（Istihada）指的是周期之外的不规则出血。它们各自对应不同的状态。',
        ],
        [
          '月经期间礼拜怎么办？',
          '这段时间礼拜暂停：这是公认的豁免，应当坦然对待，不必自责。',
        ],
        [
          '月经期间斋戒怎么办？',
          '斋戒同样暂停；未能斋戒的日子在斋月之外补斋（Qadaa）。',
        ],
        [
          '为什么错过的礼拜一般不用补做，而斋戒需要补？',
          '这个差别源于两种功修的性质：礼拜每天都有、反复进行，而斋戒一年一次、集中在一个月内。遵循这项豁免，本身就是宗教实践的一部分。',
        ],
        [
          '月经之后什么时候恢复礼拜？',
          '月经一结束并完成大净（Ghusl），就可以照常恢复礼拜，无需拖延。',
        ],
        [
          '大净（Ghusl）有什么作用？',
          '大净（Ghusl）是大净仪式，使人回到恢复礼拜及其他功修所需的仪式性洁净状态。',
        ],
        [
          '如果不确定月经是否已经结束，该怎么办？',
          '与其凭一时的感觉判断，不如观察一段足够长的时间内是否完全没有出血，这有助于理清情况。',
        ],
        [
          '月经期间可以进行其他功修吗？',
          '可以：赞念（dhikr）、祈祷、施舍、学习宗教知识以及其他善行依然可以做。',
        ],
        [
          '为什么有些答案会因情况而异？',
          '教法学是一个需要解释的领域：不同学派和个人情况下，意见可能有所不同，没有任何一种意见本身是绝对的。',
        ],
      ],
      section2Body1: '伊斯兰教法学在某些细节问题上存在公认的解释差异。这些差异已存在数个世纪，在宗教传统中被视为合理的。',
      section2Body2: '因此，依据所参考的来源不同，同一个问题可能得到略有不同的答案。这并不意味着某个答案就一定是错的：它反映的是对同样的经典依据所采用的不同方法和解读。',
      tip1Title: '小贴士',
      tip1Text: '始终遵循一个合格的来源，而不是看到什么答案就不断更换意见，有助于让你的功修保持清晰而安心。',
      section3Body: '有些情况仅凭一个笼统的说明很难判定。尤其是在以下情形：',
      doubtSituations: [
        '不确定月经究竟是什么时候结束的',
        '出血的性质仍不确定（月经、伊斯提哈达（Istihada）或其他）',
        '对是否需要做大净（Ghusl）仍有疑惑',
        '是否可以恢复礼拜仍不确定',
        '在网上看到了相互矛盾的信息',
      ],
      alert2Title: '重要说明',
      alert2Text: '当情况涉及个人、复杂或持续存在时，一般性信息无法解决。此时，最好的做法仍是求助于合格的学者，他们能够结合你的具体情况来考虑。AWA 不发布法特瓦（fatwa），也不提供个人化的宗教裁定。',
      keyPoints: [
        '女性教法学涵盖女性宗教实践的许多方面',
        '某些细节可能因教法学派而有合理的差异',
        '一般性信息不能替代个性化的宗教指导',
        '持续存在的疑惑，值得向合格的学者请教',
        'AWA 的角色是教育，而不是发布法特瓦（fatwa）',
      ],
      shareMessage: '女性教法学常见问题 — AWA',
    },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReligiousFaqArticleScreen({
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

          <View style={styles.faqList}>
            {content.faqItems.map(([question, answer], index) => (
              <View
                key={question}
                style={[
                  styles.faqItem,
                  index === 0 && styles.faqItemFirst,
                ]}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Text style={styles.faqAnswer}>{answer}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.section2Body1}
          </Text>

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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.checkList}>
            {content.doubtSituations.map(item => (
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

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.checkList}>
            {content.keyPoints.map(item => (
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
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
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
  faqList: {marginTop: 4},
  faqItem: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  faqItemFirst: {marginTop: 16, paddingTop: 0, borderTopWidth: 0},
  faqQuestion: {fontSize: 14.5, lineHeight: 20, color: theme.colors.text, fontWeight: '800'},
  faqAnswer: {
    marginTop: 5,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
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
