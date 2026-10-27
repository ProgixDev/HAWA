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

const ID = 'religiousfaq-questions-frequentes';

const HERO = require('../../assets/images/library/popular-flower.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('ReligiousFaq', {
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
  id: {
    badge: 'PERTANYAAN YANG SERING DIAJUKAN',
    title: 'Pertanyaan yang sering diajukan\ntentang fikih perempuan',
    metaDuration: '8 menit baca',
    metaType: 'FAQ',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Pertanyaan yang paling sering muncul tentang fikih perempuan, dikumpulkan di satu tempat beserta jawaban yang jelas.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya divalidasi oleh ulama yang berkompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang bersifat pribadi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Pertanyaan yang sering muncul',
      'Mazhab yang bisa berbeda pendapat',
      'Jika keraguan terus berlanjut',
      'Poin-poin penting',
    ],
    section1Body: 'Banyak pertanyaan tentang siklus, salat, dan puasa yang rutin muncul dari satu perempuan ke perempuan lain. Berikut jawaban umum untuk pertanyaan yang paling sering diajukan; untuk mendalaminya, setiap topik juga dibahas lebih lengkap dalam artikelnya sendiri.',
    faqItems: [
      [
        'Apa itu fikih perempuan?',
        'Fikih perempuan menghimpun aturan-aturan praktis yang secara khusus berkaitan dengan tubuh dan ibadah perempuan: siklus, kesucian, salat, puasa, nifas, dan istihadah.',
      ],
      [
        'Apa saja topik utama yang dibahas dalam fikih perempuan?',
        'Fikih perempuan membahas antara lain haid dan siklus, kesucian ritual, mandi wajib, salat dan puasa selama dan setelah haid, nifas, serta istihadah.',
      ],
      [
        'Apa perbedaan antara haid, nifas, dan perdarahan tidak teratur?',
        'Haid (hayd) mengikuti siklus yang biasa, nifas terjadi setelah melahirkan, dan istihadah merujuk pada perdarahan tidak teratur di luar siklus. Masing-masing memiliki status yang berbeda.',
      ],
      [
        'Apa yang terjadi pada salat selama haid?',
        'Salat ditiadakan selama masa ini: ini adalah keringanan yang diakui, dan sebaiknya dijalani tanpa rasa bersalah.',
      ],
      [
        'Apa yang terjadi pada puasa selama haid?',
        'Puasa juga ditiadakan; hari-hari yang tidak berpuasa diganti kemudian (qada), di luar bulan Ramadan.',
      ],
      [
        'Mengapa salat yang terlewat umumnya tidak diganti, berbeda dengan puasa?',
        'Perbedaan ini disebabkan oleh sifat kedua ibadah tersebut: salat dilakukan setiap hari dan berulang, sedangkan puasa dilakukan setahun sekali dan terpusat dalam satu bulan. Mengikuti keringanan ini merupakan bagian utuh dari pengamalan agama.',
      ],
      [
        'Kapan salat dimulai kembali setelah haid?',
        'Begitu haid berhenti dan mandi wajib telah dilakukan, salat dilanjutkan seperti biasa, tanpa ditunda.',
      ],
      [
        'Apa peran mandi wajib?',
        'Mandi wajib (ghusl) adalah mandi besar yang memungkinkan seseorang kembali ke keadaan suci secara ritual, yang dibutuhkan untuk melanjutkan salat dan ibadah lainnya.',
      ],
      [
        'Apa yang sebaiknya dilakukan jika kamu tidak yakin haidmu sudah berhenti?',
        'Mengamati tidak adanya perdarahan sama sekali dalam waktu yang cukup, alih-alih mengandalkan kesan sesaat, membantu memperjelas keadaan.',
      ],
      [
        'Bolehkah ibadah lain dilakukan selama haid?',
        'Boleh: zikir, doa, sedekah, menuntut ilmu agama, dan amal kebaikan lainnya tetap bisa dilakukan.',
      ],
      [
        'Mengapa sebagian jawaban bisa berbeda-beda tergantung situasinya?',
        'Fikih adalah bidang yang melibatkan penafsiran: pendapat bisa berbeda tergantung mazhab dan keadaan pribadi, tanpa ada satu pendapat pun yang mutlak dengan sendirinya.',
      ],
    ],
    section2Body1: 'Fikih Islam mencakup perbedaan penafsiran yang diakui pada beberapa hal yang bersifat rinci. Perbedaan ini sudah ada selama berabad-abad dan dianggap sah dalam tradisi keagamaan.',
    section2Body2: 'Tergantung sumber yang dirujuk, pertanyaan yang sama bisa mendapat jawaban yang sedikit berbeda. Ini tidak berarti salah satu jawaban otomatis keliru: perbedaan itu mencerminkan metodologi dan cara membaca yang berbeda terhadap sumber-sumber yang sama.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Konsisten mengikuti satu sumber yang berkompeten, alih-alih terus berganti pendapat sesuai jawaban yang kamu temukan, membantu menjaga pengamalanmu tetap jelas dan tenang.',
    section3Body: 'Beberapa situasi tetap sulit diputuskan hanya berdasarkan satu penjelasan umum. Hal ini terutama terjadi ketika:',
    doubtSituations: [
      'Ada ketidakpastian tentang kapan haid benar-benar berakhir',
      'Jenis perdarahan masih belum jelas (haid, istihadah, atau yang lain)',
      'Keraguan tentang perlunya mandi wajib terus berlanjut',
      'Pertanyaan tentang kapan salat dilanjutkan masih belum pasti',
      'Kamu menemukan informasi yang saling bertentangan di internet',
    ],
    alert2Title: 'Informasi penting',
    alert2Text: 'Ketika suatu situasi bersifat pribadi, rumit, atau terus berlanjut, situasi itu tidak bisa diselesaikan dengan informasi umum. Bertanya kepada ulama yang berkompeten, yang mampu mempertimbangkan keadaanmu secara khusus, tetap menjadi langkah terbaik dalam kasus seperti itu. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang bersifat pribadi.',
    keyPoints: [
      'Fikih perempuan mencakup banyak aspek pengamalan agama perempuan',
      'Sebagian detail bisa berbeda secara sah tergantung mazhab',
      'Informasi umum tidak menggantikan bimbingan keagamaan yang bersifat pribadi',
      'Keraguan yang terus berlanjut layak ditanyakan kepada ulama yang berkompeten',
      'Peran AWA bersifat edukatif, bukan mengeluarkan fatwa',
    ],
    shareMessage: 'Pertanyaan yang sering diajukan tentang fikih perempuan — AWA',
  },
  hi: {
    badge: 'अक्सर पूछे जाने वाले सवाल',
    title: 'महिलाओं के फ़िक़्ह\nपर अक्सर पूछे जाने वाले सवाल',
    metaDuration: '8 मिनट में पढ़ें',
    metaType: 'सवाल-जवाब',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'महिलाओं के फ़िक़्ह के बारे में सबसे आम सवाल, साफ़ जवाबों के साथ एक जगह।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह कंटेंट पूरी तरह शैक्षिक है। धार्मिक सवालों की पुष्टि योग्य उलमा से करानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'अक्सर उठने वाले सवाल',
      'फ़िक़्ही मत (मदहब) जो अलग हो सकते हैं',
      'लगातार संदेह होने पर',
      'मुख्य बातें',
    ],
    section1Body: 'चक्र, नमाज़ और रोज़े को लेकर कई सवाल एक महिला से दूसरी महिला के बीच बार-बार उठते हैं। यहाँ सबसे आम सवालों के सामान्य जवाब दिए गए हैं; और गहराई से जानने के लिए हर विषय पर अलग से अपना एक लेख भी है।',
    faqItems: [
      [
        'महिलाओं का फ़िक़्ह क्या है?',
        'महिलाओं का फ़िक़्ह उन व्यावहारिक नियमों को समेटता है जो खास तौर पर महिलाओं के शरीर और इबादत से जुड़े हैं: चक्र, पाकी, नमाज़, रोज़ा, निफ़ास और इस्तिहाज़ा।',
      ],
      [
        'महिलाओं के फ़िक़्ह के मुख्य विषय कौन-से हैं?',
        'इसमें खास तौर पर माहवारी और चक्र, पाकी, ग़ुस्ल, माहवारी के दौरान और उसके बाद नमाज़ और रोज़ा, निफ़ास और इस्तिहाज़ा शामिल हैं।',
      ],
      [
        'माहवारी, प्रसव के बाद का रक्तस्राव और अनियमित रक्तस्राव में क्या फ़र्क़ है?',
        'माहवारी सामान्य चक्र के अनुसार आती है, निफ़ास प्रसव के बाद होता है, और इस्तिहाज़ा उस अनियमित रक्तस्राव को कहते हैं जो चक्र से बाहर होता है। हर एक का हुक्म अलग होता है।',
      ],
      [
        'माहवारी के दौरान नमाज़ का क्या होता है?',
        'इस दौरान नमाज़ रुकी रहती है: यह एक मान्य छूट है, जिसे अपराधबोध के बिना निभाना चाहिए।',
      ],
      [
        'माहवारी के दौरान रोज़े का क्या होता है?',
        'रोज़ा भी रुका रहता है; जो दिन रोज़े नहीं रखे गए, उनकी क़ज़ा बाद में, रमज़ान के बाहर की जाती है।',
      ],
      [
        'छूटी हुई नमाज़ों की क़ज़ा आम तौर पर क्यों नहीं की जाती, जबकि रोज़े की की जाती है?',
        'यह फ़र्क़ दोनों इबादतों की प्रकृति की वजह से है: नमाज़ रोज़ की और बार-बार होने वाली इबादत है, जबकि रोज़ा साल में एक बार, एक ही महीने में होता है। छूट पर अमल करना भी दीन पर अमल का ही हिस्सा है।',
      ],
      [
        'माहवारी के बाद नमाज़ कब फिर शुरू होती है?',
        'माहवारी खत्म होते ही और ग़ुस्ल कर लेने के बाद नमाज़ बिना देरी के सामान्य रूप से फिर शुरू हो जाती है।',
      ],
      [
        'ग़ुस्ल की क्या भूमिका है?',
        'ग़ुस्ल पूरे शरीर को धोकर की जाने वाली बड़ी पाकी की क्रिया है, जिससे इंसान पाकी की उस हालत में लौटता है जो नमाज़ और इबादत के दूसरे कामों को फिर शुरू करने के लिए ज़रूरी है।',
      ],
      [
        'अगर पक्का न हो कि माहवारी खत्म हुई या नहीं, तो क्या करें?',
        'किसी एक पल के एहसास पर भरोसा करने के बजाय, काफ़ी देर तक रक्तस्राव का पूरी तरह न होना देखना स्थिति को साफ़ करने में मदद करता है।',
      ],
      [
        'क्या माहवारी के दौरान इबादत के दूसरे तरीके अपनाए जा सकते हैं?',
        'हाँ: ज़िक्र, दुआएँ, सदक़ा, दीनी इल्म सीखना और भलाई के दूसरे काम इस दौरान भी किए जा सकते हैं।',
      ],
      [
        'स्थिति के अनुसार कुछ जवाब अलग क्यों हो सकते हैं?',
        'फ़िक़्ह व्याख्या का क्षेत्र है: राय फ़िक़्ही मत (मदहब) और निजी हालात के अनुसार अलग हो सकती है, और कोई एक राय अपने आप में पूर्ण नहीं मानी जाती।',
      ],
    ],
    section2Body1: 'इस्लामी फ़िक़्ह में कुछ बारीक बातों पर व्याख्या के मान्य मतभेद हैं। ये मतभेद सदियों से रहे हैं और धार्मिक परंपरा के भीतर जायज़ माने जाते हैं।',
    section2Body2: 'इसलिए, जिस स्रोत से पूछा जाए, उसके अनुसार एक ही सवाल का जवाब थोड़ा अलग हो सकता है। इसका मतलब यह नहीं कि कोई जवाब अपने आप गलत है: यह एक ही स्रोतों को समझने के अलग तरीकों और पद्धतियों को दिखाता है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'जो जवाब जहाँ मिले उसके अनुसार बार-बार राय बदलने के बजाय, किसी योग्य स्रोत की लगातार पैरवी करना आपके अमल को साफ़ और शांत रखने में मदद करता है।',
    section3Body: 'कुछ स्थितियों को किसी एक सामान्य स्पष्टीकरण के आधार पर सुलझाना मुश्किल रहता है। खास तौर पर ऐसा तब होता है जब:',
    doubtSituations: [
      'यह तय न हो कि माहवारी असल में कब खत्म हुई',
      'रक्तस्राव की प्रकृति साफ़ न हो (माहवारी, इस्तिहाज़ा, या कुछ और)',
      'ग़ुस्ल की ज़रूरत को लेकर संदेह बना रहे',
      'नमाज़ फिर शुरू करने का सवाल अनिश्चित रहे',
      'इंटरनेट पर परस्पर विरोधी जानकारी मिली हो',
    ],
    alert2Title: 'ज़रूरी जानकारी',
    alert2Text: 'जब कोई स्थिति निजी, जटिल या लगातार बनी रहने वाली हो, तो उसे सामान्य जानकारी से नहीं सुलझाया जा सकता। ऐसे में किसी योग्य आलिम से पूछना सबसे अच्छा रास्ता है, जो आपकी खास स्थिति को ध्यान में रख सकें। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    keyPoints: [
      'महिलाओं का फ़िक़्ह महिलाओं के धार्मिक अमल के कई पहलुओं को समेटता है',
      'कुछ बारीकियाँ फ़िक़्ही मत (मदहब) के अनुसार जायज़ तौर पर अलग हो सकती हैं',
      'सामान्य जानकारी व्यक्तिगत धार्मिक मार्गदर्शन का विकल्प नहीं है',
      'लगातार बना रहने वाला संदेह किसी योग्य आलिम के सामने रखना चाहिए',
      'AWA की भूमिका शैक्षिक है, फ़तवे जारी करना नहीं',
    ],
    shareMessage: 'महिलाओं के फ़िक़्ह पर अक्सर पूछे जाने वाले सवाल — AWA',
  },
  sq: {
    badge: 'PYETJE TË SHPESHTA',
    title: 'Pyetje të shpeshta\nmbi fikhun e grave',
    metaDuration: '8 min lexim',
    metaType: 'Pyetje të shpeshta',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Pyetjet më të zakonshme mbi fikhun e grave, të mbledhura në një vend me përgjigje të qarta.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhet të vërtetohen nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pyetjet që shfaqen shpesh',
      'Shkollat juridike që mund të ndryshojnë',
      'Në rast dyshimi të vazhdueshëm',
      'Çfarë të mbash mend',
    ],
    section1Body: 'Shumë pyetje mbi ciklin, namazin dhe agjërimin shfaqen rregullisht nga një grua te tjetra. Ja përgjigjet e përgjithshme për më të shpeshtat; për të shkuar më tej, çdo temë trajtohet edhe më në thellësi në artikullin e vet të veçantë.',
    faqItems: [
      [
        'Çfarë është fikhu i grave?',
        'Fikhu i grave bashkon rregullat praktike që kanë të bëjnë posaçërisht me trupin dhe adhurimin e grave: ciklin, pastërtinë, namazin, agjërimin, nifasin dhe istihadanë.',
      ],
      [
        'Cilat janë temat kryesore që mbulon fikhu i grave?',
        'Ai mbulon veçanërisht menstruacionin dhe ciklin, pastërtinë rituale, guslin, namazin dhe agjërimin gjatë dhe pas menstruacionit, nifasin dhe istihadanë.',
      ],
      [
        'Cili është dallimi midis menstruacionit, gjakderdhjes pas lindjes dhe gjakderdhjes së parregullt?',
        'Menstruacioni (hajdi) ndjek ciklin e zakonshëm, nifasi ndodh pas lindjes, ndërsa istihadaja i referohet gjakderdhjes së parregullt, jashtë ciklit. Secila ndjek një status të ndryshëm.',
      ],
      [
        'Çfarë ndodh me namazin gjatë menstruacionit?',
        'Namazi pezullohet gjatë kësaj kohe: është një përjashtim i njohur, që duhet përjetuar pa fajësim.',
      ],
      [
        'Çfarë ndodh me agjërimin gjatë menstruacionit?',
        'Edhe agjërimi pezullohet; ditët e pa agjëruara kompensohen më vonë (kaza), jashtë Ramazanit.',
      ],
      [
        'Pse namazet e munguara në përgjithësi nuk kompensohen, ndryshe nga agjërimi?',
        'Ky dallim vjen nga natyra e dy akteve: namazi është i përditshëm dhe i përsëritur, ndërsa agjërimi është vjetor dhe i përqendruar brenda një muaji. Ndjekja e përjashtimit është plotësisht pjesë e praktikës fetare.',
      ],
      [
        'Kur rifillon namazi pas menstruacionit?',
        'Sapo menstruacioni ka mbaruar dhe është kryer gusli, namazi rifillon normalisht, pa vonesë.',
      ],
      [
        'Cili është roli i guslit?',
        'Gusli është larja e madhe që lejon të rikthehesh në gjendjen e pastërtisë rituale të nevojshme për të rifilluar namazin dhe akte të tjera adhurimi.',
      ],
      [
        'Çfarë duhet të bësh nëse nuk je e sigurt që menstruacioni ka mbaruar?',
        'Të vëzhgosh mungesën e plotë të gjakderdhjes për një kohë të mjaftueshme, në vend që të mbështetesh te një përshtypje e çastit, ndihmon ta sqarosh situatën.',
      ],
      [
        'A mund të praktikohen forma të tjera adhurimi gjatë menstruacionit?',
        'Po: dhikri, lutjet (dua), bamirësia, mësimi fetar dhe veprat e tjera të mira mbeten të arritshme.',
      ],
      [
        'Pse disa përgjigje mund të ndryshojnë sipas situatës?',
        'Fikhu është një fushë interpretimi: mendimet mund të ndryshojnë sipas shkollës juridike dhe rrethanave personale, pa qenë asnjë mendim i vetëm absolut në vetvete.',
      ],
    ],
    section2Body1: 'Fikhu islam përfshin dallime të njohura interpretimi në disa pika detajesh. Këto dallime kanë ekzistuar për shekuj dhe konsiderohen legjitime brenda traditës fetare.',
    section2Body2: 'Sipas burimit që konsultohet, e njëjta pyetje mund të marrë përgjigje paksa të ndryshme. Kjo nuk do të thotë se një përgjigje do të ishte automatikisht e gabuar: pasqyron metodologji dhe lexime të ndryshme të të njëjtave burime.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Të ndjekësh vazhdimisht një burim të kualifikuar, në vend që të ndryshosh mendim pa pushim sipas çdo përgjigjeje që gjen, ndihmon ta mbash praktikën tënde të qartë dhe të qetë.',
    section3Body: 'Disa situata mbeten të vështira për t’u zgjidhur me një shpjegim të vetëm të përgjithshëm. Kjo ndodh veçanërisht kur:',
    doubtSituations: [
      'Ka pasiguri për kohën kur ka mbaruar realisht menstruacioni',
      'Natyra e gjakderdhjes mbetet e pasigurt (menstruacion, istihadaja, tjetër)',
      'Dyshimi vazhdon për nevojën e kryerjes së guslit',
      'Pyetja e rifillimit të namazit mbetet e pasigurt',
      'Janë gjetur në internet informacione që kundërshtojnë njëri-tjetrin',
    ],
    alert2Title: 'Informacion i rëndësishëm',
    alert2Text: 'Kur një situatë është personale, komplekse ose e vazhdueshme, ajo nuk mund të zgjidhet me informacion të përgjithshëm. Drejtimi te një dijetar i kualifikuar, i aftë të marrë parasysh situatën tënde të veçantë, mbetet qasja më e mirë në atë rast. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    keyPoints: [
      'Fikhu i grave mbulon shumë aspekte të praktikës fetare të grave',
      'Disa detaje mund të ndryshojnë në mënyrë legjitime sipas shkollës juridike',
      'Informacioni i përgjithshëm nuk zëvendëson udhëzimin fetar të personalizuar',
      'Një dyshim i vazhdueshëm meriton t’i drejtohet një dijetari të kualifikuar',
      'Roli i AWA është edukativ, jo dhënia e fetvave',
    ],
    shareMessage: 'Pyetje të shpeshta mbi fikhun e grave — AWA',
  },
  ja: {
    badge: 'よくある質問',
    title: '女性のイスラーム法学\nに関するよくある質問',
    metaDuration: '読了まで8分',
    metaType: 'よくある質問',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '女性のイスラーム法学（フィクフ）についてよくある質問を、わかりやすい回答とともに1か所にまとめました。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容はあくまで教育を目的としたものです。宗教上の疑問は、資格のある学者に確認してください。AWAはファトワー（宗教的な見解）や、一人ひとりに合わせた宗教上の判断を示すことはありません。',
    contentsTitle: 'この記事の内容',
    topics: [
      'よくある質問',
      '法学派によって異なりうること',
      '疑問が消えないとき',
      '要点',
    ],
    section1Body: '周期、礼拝、断食についての疑問は、女性のあいだでたびたび話題になります。ここでは、とくに多い質問に一般的な回答を示します。さらに詳しく知りたい場合は、それぞれのテーマが専用の記事でより深く取り上げられています。',
    faqItems: [
      [
        '女性のイスラーム法学（フィクフ）とは何ですか？',
        '女性のイスラーム法学は、女性の体と信仰行為にとくに関わる実践上の規定をまとめたものです。周期、清浄、礼拝、断食、ニファース、イスティハーダが含まれます。',
      ],
      [
        '女性のイスラーム法学では、どのような主なテーマが扱われますか？',
        'とくに、月経と周期、儀礼上の清浄、グスル、月経中およびその後の礼拝と断食、ニファース、イスティハーダが扱われます。',
      ],
      [
        '月経、産後の出血、不規則な出血の違いは何ですか？',
        '月経（ハイド）はふだんの周期に沿ったもの、ニファースは出産の後に起こるもの、イスティハーダは周期とは別に起こる不規則な出血を指します。それぞれ異なる扱いになります。',
      ],
      [
        '月経中、礼拝はどうなりますか？',
        'この間、礼拝は免除されます。これは認められた免除であり、罪悪感を抱かずに過ごすものです。',
      ],
      [
        '月経中、断食はどうなりますか？',
        '断食も免除されます。断食しなかった日は、ラマダーン以外の時期に後日埋め合わせます（カダー）。',
      ],
      [
        '断食とは違い、できなかった礼拝は一般に埋め合わせないのはなぜですか？',
        'この違いは、2つの行為の性質によるものです。礼拝は毎日繰り返されるのに対し、断食は年に1回、1か月に集中して行われます。免除に従うことも、信仰の実践の大切な一部です。',
      ],
      [
        '月経の後、礼拝はいつ再開しますか？',
        '月経が終わり、グスルを行ったらすぐに、遅れることなく通常どおり礼拝を再開します。',
      ],
      [
        'グスルの役割は何ですか？',
        'グスルは全身を清める沐浴で、これによって、礼拝やそのほかの信仰行為を再開するために必要な、儀礼上の清浄の状態に戻ることができます。',
      ],
      [
        '月経が終わったかどうか確信が持てないときは、どうすればよいですか？',
        'その場限りの印象に頼るのではなく、出血がまったくない状態が十分な時間続いているかを確認すると、状況をはっきりさせる助けになります。',
      ],
      [
        '月経中でも、ほかの信仰行為を行えますか？',
        'はい。ズィクル、祈願、施し、宗教の学び、そのほかの善行は引き続き行えます。',
      ],
      [
        '状況によって回答が異なることがあるのはなぜですか？',
        'イスラーム法学は解釈の分野です。法学派や個人の事情によって見解が異なることがあり、1つの見解だけが絶対的であるわけではありません。',
      ],
    ],
    section2Body1: 'イスラーム法学には、細部のいくつかの点について、認められた解釈の違いがあります。こうした違いは何世紀も前から存在し、宗教的な伝統の中で正当なものと考えられています。',
    section2Body2: 'このため、参照する情報源によっては、同じ質問に対してわずかに異なる回答が示されることがあります。だからといって、ある回答が必ず誤りであるというわけではありません。同じ典拠に対する異なる方法論や読み方が反映されているのです。',
    tip1Title: '知っておくと役立つこと',
    tip1Text: '見つけた回答に合わせてその都度見解を変えるのではなく、資格のある情報源に一貫して従うことで、信仰の実践を明確で穏やかなものに保ちやすくなります。',
    section3Body: '一般的な説明だけでは決着をつけにくい状況もあります。とくに、次のような場合です。',
    doubtSituations: [
      '月経が実際にいつ終わったのか、はっきりしない',
      '出血の性質（月経、イスティハーダ、そのほか）がはっきりしない',
      'グスルを行う必要があるのか、疑問が消えない',
      '礼拝を再開するかどうか、はっきりしない',
      'インターネットで矛盾する情報を見つけた',
    ],
    alert2Title: '大切なお知らせ',
    alert2Text: '個人的で、複雑で、または長引く状況は、一般的な情報だけでは解決できません。そのような場合は、ご自身の具体的な状況を考慮できる資格のある学者に相談するのが最善です。AWAはファトワー（宗教的な見解）や、一人ひとりに合わせた宗教上の判断を示すことはありません。',
    keyPoints: [
      '女性のイスラーム法学は、女性の信仰の実践の多くの側面を扱っています',
      '細部のいくつかは、法学派によって正当に異なることがあります',
      '一般的な情報は、一人ひとりに合わせた宗教的な導きに代わるものではありません',
      '疑問が消えないときは、資格のある学者に相談する価値があります',
      'AWAの役割は教育であり、ファトワーを示すことではありません',
    ],
    shareMessage: '女性のイスラーム法学に関するよくある質問 — AWA',
  },
  ko: {
    badge: '자주 묻는 질문',
    title: '여성 이슬람 법학에 대해\n자주 묻는 질문',
    metaDuration: '8분 읽기',
    metaType: '자주 묻는 질문',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '여성 이슬람 법학에 대해 가장 많이 나오는 질문을 한곳에 모아 명확한 답변과 함께 정리했어요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 순수하게 교육용이에요. 종교적인 질문은 자격을 갖춘 학자(울라마)에게 확인받아야 해요. AWA는 파트와나 개인별 종교적 판단을 내리지 않아요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '자주 나오는 질문',
      '달라질 수 있는 법학파',
      '의문이 계속될 때',
      '핵심 정리',
    ],
    section1Body: '주기, 예배(살라트), 금식에 대한 많은 질문이 여성들 사이에서 자주 나와요. 가장 흔한 질문에 대한 일반적인 답변을 정리했어요. 더 깊이 알고 싶다면 각 주제를 별도의 아티클에서 더 자세히 다루고 있어요.',
    faqItems: [
      [
        '여성 이슬람 법학이란 무엇인가요?',
        '여성 이슬람 법학은 여성의 몸과 예배에 특히 관련된 실천 규정을 모은 것이에요. 주기, 정결, 예배, 금식, 니파스, 이스티하다가 여기에 해당해요.',
      ],
      [
        '여성 이슬람 법학에서 다루는 주요 주제는 무엇인가요?',
        '특히 월경과 주기, 의례적 정결, 구슬(전신 정화 목욕), 월경 중과 월경 후의 예배와 금식, 니파스, 이스티하다를 다뤄요.',
      ],
      [
        '월경, 산후 출혈, 불규칙한 출혈은 어떻게 다른가요?',
        '월경(하이드)은 평소 주기를 따르고, 니파스는 출산 후에 나타나며, 이스티하다는 주기 밖에서 나타나는 불규칙한 출혈을 가리켜요. 각각 다른 지위를 따라요.',
      ],
      [
        '월경 중에는 예배가 어떻게 되나요?',
        '이 기간에는 예배가 면제돼요. 인정된 면제이므로 죄책감 없이 지내면 돼요.',
      ],
      [
        '월경 중에는 금식이 어떻게 되나요?',
        '금식도 면제돼요. 금식하지 못한 날은 라마단이 아닌 때에 나중에 보충해요(카다).',
      ],
      [
        '금식과 달리 놓친 예배는 왜 일반적으로 보충하지 않나요?',
        '이 차이는 두 행위의 성격에서 비롯돼요. 예배는 매일 반복되지만, 금식은 한 달에 집중되는 연간 행위예요. 면제를 따르는 것도 신앙 실천의 온전한 일부예요.',
      ],
      [
        '월경이 끝난 뒤 예배는 언제 다시 시작하나요?',
        '월경이 끝나고 구슬(전신 정화 목욕)을 마치는 즉시, 지체 없이 평소처럼 예배를 다시 시작해요.',
      ],
      [
        '구슬(전신 정화 목욕)은 어떤 역할을 하나요?',
        '구슬은 대정화로, 예배와 그 밖의 예배 행위를 다시 하는 데 필요한 의식적 정결 상태로 돌아가게 해 줘요.',
      ],
      [
        '월경이 끝났는지 확신이 서지 않으면 어떻게 해야 하나요?',
        '한 순간의 느낌에 의존하기보다 충분한 시간 동안 출혈이 완전히 없는지 지켜보면 상황을 분명히 하는 데 도움이 돼요.',
      ],
      [
        '월경 중에도 다른 예배 행위를 할 수 있나요?',
        '네. 지크르, 두아(간구), 자선, 종교 공부, 그 밖의 선행은 계속할 수 있어요.',
      ],
      [
        '상황에 따라 답이 달라질 수 있는 이유는 무엇인가요?',
        '피크흐는 해석의 분야예요. 견해는 법학파와 개인의 상황에 따라 달라질 수 있으며, 어느 하나의 견해만이 그 자체로 절대적이지는 않아요.',
      ],
    ],
    section2Body1: '이슬람 법학(피크흐)에는 세부 사항에 대해 인정된 해석의 차이가 있어요. 이런 차이는 수 세기 동안 존재해 왔고 종교 전통 안에서 정당한 것으로 여겨져요.',
    section2Body2: '따라서 참고하는 출처에 따라 같은 질문에도 조금씩 다른 답이 나올 수 있어요. 그렇다고 해서 어떤 답이 저절로 틀렸다는 뜻은 아니에요. 같은 근거를 서로 다른 방법론과 해석으로 읽은 결과예요.',
    tip1Title: '알아 두세요',
    tip1Text: '눈에 띄는 답에 따라 계속 의견을 바꾸기보다 자격을 갖춘 출처를 꾸준히 따르면 실천을 분명하고 차분하게 이어 가는 데 도움이 돼요.',
    section3Body: '일부 상황은 하나의 일반적인 설명만으로는 판단하기 어려워요. 특히 다음과 같은 경우예요.',
    doubtSituations: [
      '월경이 실제로 언제 끝났는지 확실하지 않을 때',
      '출혈의 성격이 불확실할 때(월경, 이스티하다, 그 밖의 경우)',
      '구슬(전신 정화 목욕)을 해야 하는지 의문이 계속될 때',
      '예배를 다시 시작해도 되는지 확실하지 않을 때',
      '온라인에서 서로 상충하는 정보를 발견했을 때',
    ],
    alert2Title: '중요한 안내',
    alert2Text: '개인적이거나 복잡하거나 계속되는 상황은 일반적인 정보로 해결할 수 없어요. 그런 경우에는 내 구체적인 상황을 고려할 수 있는 자격을 갖춘 학자(울라마)를 찾는 것이 여전히 가장 좋은 방법이에요. AWA는 파트와나 개인별 종교적 판단을 내리지 않아요.',
    keyPoints: [
      '여성 이슬람 법학은 여성의 종교 실천에 관한 많은 측면을 다뤄요',
      '일부 세부 사항은 법학파에 따라 정당하게 달라질 수 있어요',
      '일반적인 정보는 개인별 종교 지도를 대신하지 않아요',
      '계속되는 의문은 자격을 갖춘 학자(울라마)에게 문의할 만해요',
      'AWA의 역할은 교육이며, 파트와를 내리는 것이 아니에요',
    ],
    shareMessage: '여성 이슬람 법학에 대해 자주 묻는 질문 — AWA',
  },
  'pt-PT': {
    badge: 'PERGUNTAS FREQUENTES',
    title: 'Perguntas frequentes\nsobre o fiqh feminino',
    metaDuration: '8 min de leitura',
    metaType: 'Perguntas frequentes',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'As perguntas mais comuns sobre o fiqh feminino, reunidas num só lugar com respostas claras.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Perguntas que surgem com frequência',
      'Escolas jurídicas que podem divergir',
      'Em caso de dúvida persistente',
      'Pontos essenciais',
    ],
    section1Body: 'Muitas questões sobre o ciclo, a oração e o jejum surgem regularmente entre as mulheres. Eis respostas gerais às mais frequentes; para ir mais longe, cada tema é também abordado com maior profundidade no seu próprio artigo.',
    faqItems: [
      [
        'O que é o fiqh feminino?',
        'O fiqh feminino reúne as regras práticas que dizem especificamente respeito ao corpo e ao culto das mulheres: o ciclo, a pureza, a oração, o jejum, o nifas e a istihada.',
      ],
      [
        'Quais são os principais temas abordados pelo fiqh feminino?',
        'Abrange, em particular, a menstruação e o ciclo, a pureza ritual, o ghusl, a oração e o jejum durante e após a menstruação, o nifas e a istihada.',
      ],
      [
        'Qual é a diferença entre a menstruação, o sangramento pós-parto e o sangramento irregular?',
        'A menstruação (hayd) segue o ciclo habitual, o nifas ocorre após o parto e a istihada designa o sangramento irregular, fora do ciclo. Cada um segue um estatuto diferente.',
      ],
      [
        'O que acontece à oração durante a menstruação?',
        'A oração fica suspensa durante este período: trata-se de uma dispensa reconhecida, a viver sem culpa.',
      ],
      [
        'O que acontece ao jejum durante a menstruação?',
        'O jejum também fica suspenso; os dias em que não se jejuou são compensados mais tarde (Qada), fora do Ramadão.',
      ],
      [
        'Porque é que as orações perdidas geralmente não são compensadas, ao contrário do jejum?',
        'Esta diferença deve-se à natureza dos dois atos: a oração é diária e repetida, enquanto o jejum é anual e concentrado num único mês. Seguir a dispensa faz plenamente parte da prática religiosa.',
      ],
      [
        'Quando se retoma a oração após a menstruação?',
        'Assim que a menstruação terminou e o ghusl foi realizado, a oração é retomada normalmente, sem demora.',
      ],
      [
        'Qual é o papel do ghusl?',
        'O ghusl é o banho ritual maior que permite regressar ao estado de pureza ritual necessário para retomar a oração e outros atos de culto.',
      ],
      [
        'O que fazer se não tiver a certeza de que a menstruação terminou?',
        'Observar a ausência total de sangramento durante um período de tempo suficiente, em vez de se basear numa impressão pontual, ajuda a esclarecer a situação.',
      ],
      [
        'Podem praticar-se outras formas de culto durante a menstruação?',
        'Sim: o dhikr, as súplicas, a caridade, a aprendizagem religiosa e outros atos de bondade continuam acessíveis.',
      ],
      [
        'Porque é que algumas respostas podem variar consoante a situação?',
        'O fiqh é um domínio de interpretação: as opiniões podem variar consoante a escola jurídica e as circunstâncias pessoais, sem que nenhuma opinião seja absoluta por si só.',
      ],
    ],
    section2Body1: 'O fiqh islâmico inclui diferenças de interpretação reconhecidas em certos pontos de pormenor. Estas diferenças existem há séculos e são consideradas legítimas dentro da tradição religiosa.',
    section2Body2: 'Consoante a fonte consultada, a mesma questão pode, assim, receber respostas ligeiramente diferentes. Isto não significa que uma resposta esteja automaticamente errada: reflete metodologias e leituras diferentes das mesmas fontes.',
    tip1Title: 'Bom saber',
    tip1Text: 'Seguir de forma consistente uma fonte qualificada, em vez de mudar constantemente de opinião consoante a resposta encontrada, ajuda a manter a sua prática clara e serena.',
    section3Body: 'Algumas situações continuam difíceis de resolver com base numa única explicação geral. É particularmente o caso quando:',
    doubtSituations: [
      'Existe incerteza sobre o momento em que a menstruação realmente terminou',
      'A natureza do sangramento continua incerta (menstruação, istihada, outro)',
      'Persiste a dúvida sobre a necessidade de realizar o ghusl',
      'A questão da retoma da oração continua incerta',
      'Foram encontradas informações contraditórias na internet',
    ],
    alert2Title: 'Informação importante',
    alert2Text: 'Quando uma situação é pessoal, complexa ou persistente, não pode ser resolvida com informação geral. Recorrer a um sábio qualificado, capaz de ter em conta a sua situação específica, continua a ser a melhor abordagem nesse caso. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    keyPoints: [
      'O fiqh feminino abrange muitos aspetos da prática religiosa das mulheres',
      'Alguns pormenores podem variar legitimamente consoante a escola jurídica',
      'A informação geral não substitui uma orientação religiosa personalizada',
      'Uma dúvida persistente merece ser colocada a um sábio qualificado',
      'O papel da AWA é educativo, e não emitir fatwas',
    ],
    shareMessage: 'Perguntas frequentes sobre o fiqh feminino — AWA',
  },
  bn: {
    badge: 'সচরাচর জিজ্ঞাসিত প্রশ্ন',
    title: 'নারীদের ফিকহ বিষয়ে\nসচরাচর জিজ্ঞাসিত প্রশ্ন',
    metaDuration: '8 মিনিটের পাঠ',
    metaType: 'প্রশ্নোত্তর',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'নারীদের ফিকহ সম্পর্কে সবচেয়ে প্রচলিত প্রশ্নগুলো, স্পষ্ট উত্তরসহ এক জায়গায় সংকলিত।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের বিষয়ে যোগ্য আলেমদের কাছ থেকে নিশ্চিত হওয়া উচিত। AWA ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত প্রদান করে না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'যেসব প্রশ্ন প্রায়ই ওঠে',
      'ফিকহের যেসব মাযহাবে পার্থক্য থাকতে পারে',
      'স্থায়ী সন্দেহের ক্ষেত্রে',
      'মূল বিষয়গুলো',
    ],
    section1Body: 'চক্র, নামাজ ও রোজা নিয়ে অনেক প্রশ্ন এক নারী থেকে আরেক নারীর কাছে নিয়মিতভাবেই ওঠে। এখানে সবচেয়ে প্রচলিত প্রশ্নগুলোর সাধারণ উত্তর দেওয়া হলো; আরও গভীরে জানতে প্রতিটি বিষয় তার নিজস্ব নিবন্ধেও আরও বিস্তারিতভাবে আলোচিত হয়েছে।',
    faqItems: [
      [
        'নারীদের ফিকহ কী?',
        'নারীদের ফিকহ নারীর শরীর ও ইবাদতের সঙ্গে বিশেষভাবে সম্পর্কিত ব্যবহারিক বিধানগুলো একত্র করে: চক্র, পবিত্রতা, নামাজ, রোজা, নিফাস ও ইস্তিহাযা।',
      ],
      [
        'নারীদের ফিকহের প্রধান আলোচ্য বিষয়গুলো কী কী?',
        'এতে বিশেষ করে ঋতুস্রাব ও চক্র, আনুষ্ঠানিক পবিত্রতা, গোসল, ঋতুস্রাবের সময় ও পরে নামাজ ও রোজা, নিফাস এবং ইস্তিহাযা অন্তর্ভুক্ত।',
      ],
      [
        'ঋতুস্রাব, প্রসবোত্তর রক্তস্রাব ও অনিয়মিত রক্তক্ষরণের মধ্যে পার্থক্য কী?',
        'ঋতুস্রাব (হায়েজ) স্বাভাবিক চক্র অনুসরণ করে, নিফাস সন্তান প্রসবের পর হয়, আর ইস্তিহাযা বলতে চক্রের বাইরে অনিয়মিত রক্তক্ষরণ বোঝায়। প্রতিটির বিধান আলাদা।',
      ],
      [
        'ঋতুস্রাবের সময় নামাজের কী হয়?',
        'এই সময়ে নামাজ স্থগিত থাকে: এটি একটি স্বীকৃত অব্যাহতি, যা অপরাধবোধ ছাড়াই পালন করা উচিত।',
      ],
      [
        'ঋতুস্রাবের সময় রোজার কী হয়?',
        'রোজাও স্থগিত থাকে; যে দিনগুলোর রোজা রাখা হয়নি তা পরে, রমজানের বাইরে, কাজা করা হয়।',
      ],
      [
        'রোজার বিপরীতে ছুটে যাওয়া নামাজ সাধারণত কেন কাজা করা হয় না?',
        'এই পার্থক্য দুটি ইবাদতের প্রকৃতির কারণে: নামাজ প্রতিদিনের ও বারবার আদায়যোগ্য, আর রোজা বার্ষিক এবং এক মাসের মধ্যে সীমিত। অব্যাহতি অনুসরণ করা ধর্মীয় চর্চারই পূর্ণ অংশ।',
      ],
      [
        'ঋতুস্রাবের পর কখন নামাজ আবার শুরু হয়?',
        'ঋতুস্রাব শেষ হওয়ার পর এবং গোসল করার সঙ্গে সঙ্গেই, দেরি না করে, নামাজ স্বাভাবিকভাবে আবার শুরু হয়।',
      ],
      [
        'গোসলের ভূমিকা কী?',
        'গোসল হলো বড় ধরনের পবিত্রতা অর্জনের ধর্মীয় প্রক্রিয়া, যা নামাজ ও অন্যান্য ইবাদত আবার শুরু করার জন্য প্রয়োজনীয় আনুষ্ঠানিক পবিত্রতার অবস্থায় ফিরে আসার সুযোগ দেয়।',
      ],
      [
        'ঋতুস্রাব শেষ হয়েছে কি না নিশ্চিত না হলে কী করবেন?',
        'কোনো সাময়িক অনুভূতির ওপর নির্ভর না করে যথেষ্ট সময় ধরে রক্তক্ষরণ পুরোপুরি না থাকার বিষয়টি পর্যবেক্ষণ করলে পরিস্থিতি স্পষ্ট হতে সাহায্য করে।',
      ],
      [
        'ঋতুস্রাবের সময় কি অন্যান্য ইবাদত পালন করা যায়?',
        'হ্যাঁ: যিকির, দোয়া, দান, ধর্মীয় জ্ঞান অর্জন এবং অন্যান্য ভালো কাজ করা সম্ভব থাকে।',
      ],
      [
        'পরিস্থিতিভেদে কিছু উত্তর কেন ভিন্ন হতে পারে?',
        'ফিকহ ব্যাখ্যার একটি ক্ষেত্র: মাযহাব ও ব্যক্তিগত পরিস্থিতি অনুযায়ী মতামত ভিন্ন হতে পারে, কোনো একটি মতই এককভাবে চূড়ান্ত নয়।',
      ],
    ],
    section2Body1: 'ইসলামি ফিকহে কিছু খুঁটিনাটি বিষয়ে ব্যাখ্যার স্বীকৃত পার্থক্য রয়েছে। এই পার্থক্যগুলো শত শত বছর ধরে আছে এবং ধর্মীয় ঐতিহ্যের মধ্যে বৈধ বলে গণ্য করা হয়।',
    section2Body2: 'কোন উৎস দেখা হচ্ছে তার ওপর নির্ভর করে একই প্রশ্নের কিছুটা ভিন্ন উত্তর হতে পারে। এর অর্থ এই নয় যে কোনো উত্তর স্বয়ংক্রিয়ভাবে ভুল: এটি একই উৎসের ভিন্ন পদ্ধতি ও ভিন্ন পাঠকে প্রতিফলিত করে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'যে উত্তর পাওয়া যায় তার ভিত্তিতে বারবার মত বদলানোর পরিবর্তে ধারাবাহিকভাবে একটি যোগ্য উৎস অনুসরণ করলে আপনার চর্চা স্পষ্ট ও শান্ত থাকতে সাহায্য করে।',
    section3Body: 'কিছু পরিস্থিতি একটিমাত্র সাধারণ ব্যাখ্যার ভিত্তিতে সমাধান করা কঠিন থাকে। বিশেষ করে এমন ক্ষেত্রে এটি ঘটে যখন:',
    doubtSituations: [
      'ঋতুস্রাব আসলে কখন শেষ হয়েছে তা নিয়ে অনিশ্চয়তা আছে',
      'রক্তক্ষরণের ধরন অনিশ্চিত থেকে যায় (ঋতুস্রাব, ইস্তিহাযা, অন্য কিছু)',
      'গোসল করার প্রয়োজন আছে কি না তা নিয়ে সন্দেহ থেকে যায়',
      'নামাজ আবার শুরু করার প্রশ্নটি অনিশ্চিত থেকে যায়',
      'অনলাইনে পরস্পরবিরোধী তথ্য পাওয়া গেছে',
    ],
    alert2Title: 'গুরুত্বপূর্ণ তথ্য',
    alert2Text: 'কোনো পরিস্থিতি ব্যক্তিগত, জটিল বা স্থায়ী হলে সাধারণ তথ্য দিয়ে তার সমাধান করা যায় না। সেক্ষেত্রে আপনার নির্দিষ্ট পরিস্থিতি বিবেচনায় নিতে সক্ষম একজন যোগ্য আলেমের শরণাপন্ন হওয়াই সর্বোত্তম পথ। AWA ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত প্রদান করে না।',
    keyPoints: [
      'নারীদের ফিকহ নারীদের ধর্মীয় চর্চার অনেক দিক জুড়ে রয়েছে',
      'মাযহাব অনুযায়ী কিছু খুঁটিনাটি বিষয় বৈধভাবে ভিন্ন হতে পারে',
      'সাধারণ তথ্য ব্যক্তিগত ধর্মীয় দিকনির্দেশনার বিকল্প নয়',
      'স্থায়ী সন্দেহ একজন যোগ্য আলেমের কাছে তোলার যোগ্য',
      'AWA-এর ভূমিকা শিক্ষামূলক, ফতোয়া প্রদান করা নয়',
    ],
    shareMessage: 'নারীদের ফিকহ বিষয়ে সচরাচর জিজ্ঞাসিত প্রশ্ন — AWA',
  },
  da: {
    badge: 'OFTE STILLEDE SPØRGSMÅL',
    title: 'Ofte stillede spørgsmål\nom kvinders fiqh',
    metaDuration: '8 min læsning',
    metaType: 'OSS',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'De mest almindelige spørgsmål om kvinders fiqh samlet på ét sted med klare svar.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er udelukkende til uddannelsesformål. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Spørgsmål der stilles ofte',
      'Lovsskoler der kan variere',
      'Ved vedvarende tvivl',
      'Vigtige pointer',
    ],
    section1Body: 'Mange spørgsmål om cyklus, bøn og faste dukker regelmæssigt op fra kvinde til kvinde. Her finder du generelle svar på de hyppigste; for at gå i dybden behandles hvert emne også mere indgående i sin egen dedikerede artikel.',
    faqItems: [
      [
        'Hvad er kvinders fiqh?',
        'Kvinders fiqh samler de praktiske regler, der specifikt vedrører kvinders krop og gudsdyrkelse: cyklus, renhed, bøn, faste, nifas og istihadha.',
      ],
      [
        'Hvad er de vigtigste emner inden for kvinders fiqh?',
        'Det dækker særligt menstruation og cyklus, rituel renhed, ghusl, bøn og faste under og efter menstruation, nifas og istihadha.',
      ],
      [
        'Hvad er forskellen på menstruation, blødning efter fødsel og uregelmæssig blødning?',
        'Menstruation (haidh) følger den sædvanlige cyklus, nifas opstår efter fødsel, og istihadha betegner uregelmæssig blødning uden for cyklussen. Hver type følger en forskellig status.',
      ],
      [
        'Hvad sker der med bønnen under menstruation?',
        'Bønnen (salat) udsættes i denne periode: det er en anerkendt fritagelse, som opleves uden skyld.',
      ],
      [
        'Hvad sker der med fasten under menstruation?',
        'Fasten udsættes også; de dage, der ikke er fastet, tages igen senere (qadaa), uden for ramadan.',
      ],
      [
        'Hvorfor genoptages udsatte bønner generelt ikke, i modsætning til fasten?',
        'Denne forskel skyldes de to handlingers natur: bønnen er daglig og gentagen, mens fasten er årlig og koncentreret inden for én måned. At følge fritagelsen er fuldt ud en del af den religiøse praksis.',
      ],
      [
        'Hvornår genoptages bønnen efter menstruation?',
        'Så snart menstruationen er slut og ghusl er udført, genoptages bønnen normalt uden forsinkelse.',
      ],
      [
        'Hvad er ghusls rolle?',
        'Ghusl er den store renselse, der gør det muligt at vende tilbage til den rituelle renhedstilstand, der er nødvendig for at genoptage bønnen og andre former for gudsdyrkelse.',
      ],
      [
        'Hvad gør man, hvis man ikke er sikker på, at menstruationen er slut?',
        'At observere den totale fravær af blødning over tilstrækkelig lang tid, frem for at stole på et øjeblikkeligt indtryk, hjælper med at afklare situationen.',
      ],
      [
        'Kan andre former for gudsdyrkelse praktiseres under menstruation?',
        'Ja: dhikr, bønner, velgørenhed, religiøs læring og andre gode gerninger forbliver tilgængelige.',
      ],
      [
        'Hvorfor kan nogle svar variere afhængigt af situationen?',
        'Islamisk jurisprudens (fiqh) er et fortolkningsfelt: meninger kan variere afhængigt af lovsskolen og personlige omstændigheder, uden at nogen enkelt mening i sig selv er absolut.',
      ],
    ],
    section2Body1: 'Islamisk jurisprudens (fiqh) indeholder anerkendte fortolkningsforskelle på visse detaljerede punkter. Disse forskelle har eksisteret i århundreder og betragtes som legitime inden for den religiøse tradition.',
    section2Body2: 'Afhængigt af den kilde der konsulteres, kan det samme spørgsmål derfor modtage lidt forskellige svar. Det betyder ikke, at et svar automatisk er forkert: det afspejler forskellige metoder og læsninger af de samme kilder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At følge en kvalificeret kilde konsekvent, frem for konstant at skifte mening baseret på det svar man finder, hjælper med at holde din praksis klar og rolig.',
    section3Body: 'Nogle situationer er fortsat svære at afklare ud fra en enkelt generel forklaring. Dette gælder særligt når:',
    doubtSituations: [
      'Der er usikkerhed om, hvornår menstruationen faktisk er slut',
      'Blødningens karakter fortsat er usikker (menstruation, istihadha, andet)',
      'Der fortsat er tvivl om behovet for at udføre ghusl',
      'Spørgsmålet om genoptagelse af bønnen fortsat er uklart',
      'Der er fundet modstridende information online',
    ],
    alert2Title: 'Vigtig information',
    alert2Text: 'Når en situation er personlig, kompleks eller vedvarende, kan den ikke løses med generel information. At henvende sig til en kvalificeret lærd, der er i stand til at tage højde for din specifikke situation, er stadig den bedste fremgangsmåde i så fald. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    keyPoints: [
      'Kvinders fiqh dækker mange aspekter af kvinders religiøse praksis',
      'Nogle detaljer kan variere legitimt afhængigt af lovsskolen',
      'Generel information erstatter ikke personaliseret religiøs vejledning',
      'Vedvarende tvivl fortjener at blive rejst med en kvalificeret lærd',
      'AWAs rolle er uddannelsesmæssig, ikke at udstede fatwas',
    ],
    shareMessage: 'Ofte stillede spørgsmål om kvinders islamiske jurisprudens — AWA',
  },
  sv: {
    badge: 'OFTE STILLEDE SPÖRGSMÅL',
    title: 'Ofte stillede spörgsmål\nom kvinders fiqh',
    metaDuration: '8 min läsning',
    metaType: 'OSS',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'De mest almindelige spörgsmål om kvinders fiqh samlet på ét sted med klare svar.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar udelukkende till uddannelsesformål. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Spörgsmål der stilles ofte',
      'Lovsskoler der kan variere',
      'Ved vedvarende tvivl',
      'Vigtige pointer',
    ],
    section1Body: 'Mange spörgsmål om cyklus, bön och faste dukker regelmässigt op fran kvinna till kvinde. Her finder du generelle svar på de hyppigste; for att gå i dybden behandles hvert emne også mere indgående i sin egen dedikerede artikel.',
    faqItems: [
      [
        'Hvad ar kvinders fiqh?',
        'Kvinders fiqh samler de praktiske regler, der specifikt vedrörer kvinders krop och gudsdyrkelse: cyklus, renhed, bön, faste, nifas och istihadha.',
      ],
      [
        'Hvad ar de vigtigste emner inden for kvinders fiqh?',
        'Det däkker särligt menstruation och cyklus, rituel renhed, ghusl, bön och faste under och efter menstruation, nifas och istihadha.',
      ],
      [
        'Hvad ar forskellen på menstruation, blödning efter födsel och uregelmässig blödning?',
        'Menstruation (haidh) fölger den sädvanlige cyklus, nifas opstår efter födsel, och istihadha betegner uregelmässig blödning uden for cyklussen. Hver type fölger en forskellig status.',
      ],
      [
        'Hvad sker der med bönnen under menstruation?',
        'Bönnen (salat) udsättes i denne periode: det ar en anerkendt fritagelse, som opleves uden skyld.',
      ],
      [
        'Hvad sker der med fasten under menstruation?',
        'Fasten udsättes også; de dagar, der inte ar fastet, tages igen senere (qadaa), uden for ramadan.',
      ],
      [
        'Hvorfor genoptages udsatte bönner generelt inte, i modsätning till fasten?',
        'Denne forskel skyldes de to handlingers natur: bönnen ar daglig och gentagen, mens fasten ar årlig och koncentreret inden for én måned. At fölge fritagelsen ar fuldt ud en del av den religiöse praksis.',
      ],
      [
        'Hvornår genoptages bönnen efter menstruation?',
        'Så snart menstruationen ar slut och ghusl ar udfört, genoptages bönnen normalt uden forsinkelse.',
      ],
      [
        'Hvad ar ghusls rolle?',
        'Ghusl ar den store renselse, der gör det muligt at vende tilbage till den rituelle renhedstilstand, der ar nödvendig for att genoptage bönnen och andre former for gudsdyrkelse.',
      ],
      [
        'Hvad gör man, hvis man inte ar sikker på, at menstruationen ar slut?',
        'At observere den totale fravär av blödning over tilsträkkelig lang tid, frem for att stole på et öjeblikkeligt indtryk, hjälper med at afklare situationen.',
      ],
      [
        'Kan andre former for gudsdyrkelse praktiseres under menstruation?',
        'Ja: dhikr, bönner, velgörenhed, religiös läring och andre gode gerninger forbliver tilgängelige.',
      ],
      [
        'Hvorfor kan nogle svar variere afhängigt av situationen?',
        'Islamisk jurisprudens (fiqh) ar et fortolkningsfelt: meninger kan variere afhängigt av lovsskolen och personlige omständigheder, uden at nogen enkelt mening i sig selv ar absolut.',
      ],
    ],
    section2Body1: 'Islamisk jurisprudens (fiqh) indeholder anerkendte fortolkningsforskelle på visse detaljerede punkter. Disse forskelle har eksisteret i århundreder och betragtes som legitime inden for den religiöse tradition.',
    section2Body2: 'Afhängigt av den kilde der konsulteres, kan det samme spörgsmål derfor modtage lite forskellige svar. Det betyder inte, at et svar automatisk ar forkert: det afspejler forskellige metoder och läsninger av de samme kilder.',
    tip1Title: 'Godt at vide',
    tip1Text: 'At fölge en kvalificeret kilde konsekvent, frem for konstant at skifte mening baseret på det svar man finder, hjälper med at holde din praksis klar och rolig.',
    section3Body: 'Nogle situationer ar fortsat sväre at afklare ud fran en enkelt generel forklaring. Dette gälder särligt når:',
    doubtSituations: [
      'Der ar usikkerhed om, hvornår menstruationen faktisk ar slut',
      'Blödningens karakter fortsat ar usikker (menstruation, istihadha, andet)',
      'Der fortsat ar tvivl om behovet for att udföre ghusl',
      'Spörgsmålet om genoptagelse av bönnen fortsat ar uklart',
      'Der ar fundet modstridende information online',
    ],
    alert2Title: 'Vigtig information',
    alert2Text: 'Når en situation ar personlig, kompleks eller vedvarende, kan den inte löses med generel information. At henvende sig till en kvalificeret lärd, der ar i stand till at tage höjde for din specifikke situation, ar fortfarande den bedste fremgangsmåde i så fald. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    keyPoints: [
      'Kvinders fiqh däkker mange aspekter av kvinders religiöse praksis',
      'Nogle detaljer kan variere legitimt afhängigt av lovsskolen',
      'Generel information erstatter inte personaliseret religiös vejledning',
      'Vedvarende tvivl fortjener at blive rejst med en kvalificeret lärd',
      'AWAs rolle ar uddannelsesmässig, inte at udstede fatwas',
    ],
    shareMessage: 'Ofte stillede spörgsmål om kvinders islamiske jurisprudens — AWA',
  },
  nb: {
    badge: 'OFTE STILTE SPØRSMÅL',
    title: 'Ofte stilte spørsmål\nom kvinners fiqh',
    metaDuration: '8 min lesing',
    metaType: 'Vanlige spørsmål',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'De vanligste spørsmålene om kvinners fiqh, samlet på ett sted med tydelige svar.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Spørsmål som ofte dukker opp',
      'Rettsskoler som kan variere',
      'Ved vedvarende tvil',
      'Det viktigste å huske',
    ],
    section1Body: 'Mange spørsmål om syklusen, bønn og faste dukker jevnlig opp fra en kvinne til en annen. Her er generelle svar på de vanligste; for å gå dypere behandles hvert tema også mer utførlig i sin egen artikkel.',
    faqItems: [
      [
        'Hva er kvinners fiqh?',
        'Kvinners fiqh samler de praktiske reglene som særlig gjelder kvinners kropp og gudstjeneste: syklusen, renhet, bønn, faste, nifas og istihada.',
      ],
      [
        'Hva er hovedtemaene i kvinners fiqh?',
        'Det omfatter særlig menstruasjon og syklusen, rituell renhet, ghusl, bønn og faste under og etter menstruasjon, nifas og istihada.',
      ],
      [
        'Hva er forskjellen mellom menstruasjon, blødning etter fødsel og uregelmessig blødning?',
        'Menstruasjon (hayd) følger den vanlige syklusen, nifas inntreffer etter fødselen, og istihada betegner uregelmessig blødning utenfor syklusen. Hver følger en ulik status.',
      ],
      [
        'Hva skjer med bønnen under menstruasjon?',
        'Bønnen er suspendert i denne tiden: det er et anerkjent fritak, som skal oppleves uten skyldfølelse.',
      ],
      [
        'Hva skjer med fasten under menstruasjon?',
        'Fasten er også suspendert; dagene man ikke fastet, tas igjen senere (qada), utenfor ramadan.',
      ],
      [
        'Hvorfor tas bønner man gikk glipp av vanligvis ikke igjen, i motsetning til faste?',
        'Denne forskjellen skyldes karakteren til de to handlingene: bønn er daglig og gjentas, mens faste er årlig og konsentrert i én måned. Å følge fritaket er en fullverdig del av religionsutøvelsen.',
      ],
      [
        'Når gjenopptas bønnen etter menstruasjon?',
        'Så snart menstruasjonen er over og ghusl er utført, gjenopptas bønnen normalt, uten forsinkelse.',
      ],
      [
        'Hva er ghuslens rolle?',
        'Ghusl er den store avvaskingen som gjør det mulig å vende tilbake til tilstanden av rituell renhet som trengs for å gjenoppta bønn og andre gudstjenestehandlinger.',
      ],
      [
        'Hva bør du gjøre hvis du ikke er sikker på at menstruasjonen er over?',
        'Å observere at blødningen er helt borte i tilstrekkelig lang tid, heller enn å støtte seg på et enkelt inntrykk, bidrar til å klargjøre situasjonen.',
      ],
      [
        'Kan andre former for gudstjeneste utøves under menstruasjon?',
        'Ja: dhikr, bønner, veldedighet, religiøs læring og andre vennlige handlinger er fortsatt tilgjengelige.',
      ],
      [
        'Hvorfor kan noen svar variere avhengig av situasjonen?',
        'Fiqh er et tolkningsfelt: meninger kan variere etter rettsskole og personlige omstendigheter, uten at noen enkelt mening alene er absolutt.',
      ],
    ],
    section2Body1: 'Islamsk fiqh omfatter anerkjente tolkningsforskjeller på visse detaljpunkter. Disse forskjellene har eksistert i århundrer og regnes som legitime innenfor den religiøse tradisjonen.',
    section2Body2: 'Avhengig av kilden man spør, kan det samme spørsmålet derfor få litt ulike svar. Dette betyr ikke at et svar automatisk er feil: det gjenspeiler ulike metodikker og tolkninger av de samme kildene.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Å konsekvent følge en kvalifisert kilde, heller enn stadig å bytte mening ut fra det svaret man finner, bidrar til å holde praksisen din tydelig og rolig.',
    section3Body: 'Noen situasjoner er fortsatt vanskelige å avgjøre ut fra én enkelt generell forklaring. Dette gjelder særlig når:',
    doubtSituations: [
      'Det er usikkerhet om når menstruasjonen faktisk tok slutt',
      'Blødningens karakter er fortsatt uklar (menstruasjon, istihada, annet)',
      'Tvilen vedvarer om behovet for å utføre ghusl',
      'Spørsmålet om å gjenoppta bønnen er fortsatt uklart',
      'Motstridende informasjon er funnet på nett',
    ],
    alert2Title: 'Viktig informasjon',
    alert2Text: 'Når en situasjon er personlig, kompleks eller vedvarende, kan den ikke løses med generell informasjon. Å henvende seg til en kvalifisert lærd, som kan ta hensyn til din spesifikke situasjon, er da fortsatt den beste tilnærmingen. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    keyPoints: [
      'Kvinners fiqh omfatter mange sider ved kvinners religionsutøvelse',
      'Noen detaljer kan legitimt variere etter rettsskole',
      'Generell informasjon erstatter ikke personlig religiøs veiledning',
      'En vedvarende tvil fortjener å tas opp med en kvalifisert lærd',
      'AWAs rolle er pedagogisk, ikke å utstede fatwaer',
    ],
    shareMessage: 'Ofte stilte spørsmål om kvinners fiqh – AWA',
  },
  pl: {
    badge: 'NAJCZĘŚCIEJ ZADAWANE PYTANIA',
    title: 'Najczęściej zadawane pytania\no fikh kobiet',
    metaDuration: '8 min czytania',
    metaType: 'FAQ',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Najczęstsze pytania o fikh kobiet, zebrane w jednym miejscu, z jasnymi odpowiedziami.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Pytania, które pojawiają się często',
      'Szkoły prawa, które mogą się różnić',
      'W razie uporczywych wątpliwości',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Wiele pytań o cykl, modlitwę i post regularnie pojawia się u różnych kobiet. Oto ogólne odpowiedzi na najczęstsze z nich; aby zgłębić temat, każde zagadnienie jest też szerzej omówione we własnym artykule.',
    faqItems: [
      [
        'Czym jest fikh kobiet?',
        'Fikh kobiet obejmuje praktyczne zasady dotyczące w szczególności ciała kobiety i kultu: cykl, czystość, modlitwę, post, nifas i istihadę.',
      ],
      [
        'Jakie są główne tematy fikh kobiet?',
        'Obejmuje w szczególności menstruację i cykl, rytualną czystość, gusl, modlitwę i post w czasie menstruacji i po niej, nifas oraz istihadę.',
      ],
      [
        'Jaka jest różnica między menstruacją, krwawieniem poporodowym a nieregularnym krwawieniem?',
        'Menstruacja (hajd) przebiega zgodnie ze zwykłym cyklem, nifas występuje po porodzie, a istihada oznacza nieregularne krwawienie, poza cyklem. Każde z nich ma inny status.',
      ],
      [
        'Co dzieje się z modlitwą podczas menstruacji?',
        'Modlitwa jest w tym czasie zawieszona: to uznane zwolnienie, które należy przeżywać bez poczucia winy.',
      ],
      [
        'Co dzieje się z postem podczas menstruacji?',
        'Post również jest zawieszony; dni nieposzczone odrabia się później (kada), poza ramadanem.',
      ],
      [
        'Dlaczego opuszczonych modlitw zasadniczo się nie odrabia, w przeciwieństwie do postu?',
        'Ta różnica wynika z natury obu aktów: modlitwa jest codzienna i powtarzana, a post jest roczny i skupiony w jednym miesiącu. Przestrzeganie zwolnienia w pełni stanowi część praktyki religijnej.',
      ],
      [
        'Kiedy wznawia się modlitwę po menstruacji?',
        'Gdy tylko menstruacja się skończy i zostanie wykonany gusl, modlitwa jest wznawiana normalnie, bez zwłoki.',
      ],
      [
        'Jaka jest rola gusl?',
        'Gusl to wielkie obmycie, które pozwala wrócić do stanu rytualnej czystości potrzebnego do wznowienia modlitwy i innych aktów kultu.',
      ],
      [
        'Co zrobić, jeśli nie jestem pewna, czy menstruacja się skończyła?',
        'Obserwowanie całkowitego braku krwawienia przez wystarczająco długi czas, zamiast opierania się na jednorazowym wrażeniu, pomaga wyjaśnić sytuację.',
      ],
      [
        'Czy podczas menstruacji można praktykować inne formy kultu?',
        'Tak: dhikr, prośby (dua), jałmużna, nauka religijna i inne akty życzliwości pozostają dostępne.',
      ],
      [
        'Dlaczego niektóre odpowiedzi mogą się różnić w zależności od sytuacji?',
        'Fikh jest dziedziną interpretacji: opinie mogą się różnić w zależności od szkoły prawa i osobistych okoliczności, a żadna z nich sama w sobie nie jest bezwzględna.',
      ],
    ],
    section2Body1: 'Fikh islamski zawiera uznane różnice interpretacji w niektórych kwestiach szczegółowych. Te różnice istnieją od wieków i są uznawane za uprawnione w ramach tradycji religijnej.',
    section2Body2: 'W zależności od konsultowanego źródła to samo pytanie może więc otrzymać nieco inne odpowiedzi. Nie oznacza to, że odpowiedź byłaby automatycznie błędna: odzwierciedla różne metodologie i odczytania tych samych źródeł.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Konsekwentne trzymanie się wykwalifikowanego źródła, zamiast ciągłej zmiany opinii w zależności od znalezionej odpowiedzi, pomaga zachować jasność i spokój w praktyce.',
    section3Body: 'Niektóre sytuacje trudno rozstrzygnąć na podstawie jednego ogólnego wyjaśnienia. Dotyczy to w szczególności sytuacji, gdy:',
    doubtSituations: [
      'Nie ma pewności, kiedy menstruacja faktycznie się skończyła',
      'Charakter krwawienia pozostaje niepewny (menstruacja, istihada, inne)',
      'Utrzymuje się wątpliwość co do konieczności wykonania gusl',
      'Kwestia wznowienia modlitwy pozostaje niepewna',
      'Znaleziono sprzeczne informacje w internecie',
    ],
    alert2Title: 'Ważna informacja',
    alert2Text: 'Gdy sytuacja jest osobista, złożona lub uporczywa, nie da się jej rozstrzygnąć ogólnymi informacjami. Zwrócenie się do wykwalifikowanego uczonego, który może uwzględnić Twoją konkretną sytuację, pozostaje w takim przypadku najlepszym podejściem. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    keyPoints: [
      'Fikh kobiet obejmuje wiele aspektów praktyki religijnej kobiet',
      'Niektóre szczegóły mogą zasadnie się różnić w zależności od szkoły prawa',
      'Ogólne informacje nie zastępują spersonalizowanych wskazówek religijnych',
      'Uporczywą wątpliwość warto przedstawić wykwalifikowanemu uczonemu',
      'Rola AWA jest edukacyjna, a nie wydawanie fatw',
    ],
    shareMessage: 'Najczęściej zadawane pytania o fikh kobiet — AWA',
  },
  uk: {
    badge: 'ПОШИРЕНІ ЗАПИТАННЯ',
    title: 'Поширені запитання\nпро жіночий фікх',
    metaDuration: '8 хв читання',
    metaType: 'Запитання',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Найчастіші запитання про жіночий фікх, зібрані в одному місці з чіткими відповідями.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Запитання, що виникають часто',
      'Школи правознавства, які можуть відрізнятися',
      'У разі стійких сумнівів',
      'Головні висновки',
    ],
    section1Body: 'Багато запитань про цикл, молитву та піст регулярно виникають у різних жінок. Ось загальні відповіді на найпоширеніші з них; щоб заглибитися, кожна тема також докладніше розглянута у власній статті.',
    faqItems: [
      [
        'Що таке жіночий фікх?',
        'Жіночий фікх охоплює практичні правила, що стосуються, зокрема, тіла жінки та богослужіння: цикл, чистоту, молитву, піст, ніфас та істихаду.',
      ],
      [
        'Які основні теми охоплює жіночий фікх?',
        'Він охоплює, зокрема, менструацію та цикл, ритуальну чистоту, гусль, молитву та піст під час менструації і після неї, ніфас та істихаду.',
      ],
      [
        'У чому різниця між менструацією, післяпологовою кровотечею та нерегулярною кровотечею?',
        'Менструація (хайд) відповідає звичайному циклу, ніфас настає після пологів, а істихада означає нерегулярну кровотечу поза циклом. Кожна має інший статус.',
      ],
      [
        'Що відбувається з молитвою під час менструації?',
        'Молитва в цей час призупиняється: це визнане звільнення, яке слід переживати без почуття провини.',
      ],
      [
        'Що відбувається з постом під час менструації?',
        'Піст також призупиняється; дні, у які ви не постили, відпрацьовуються пізніше (када), поза Рамаданом.',
      ],
      [
        'Чому пропущені молитви зазвичай не відпрацьовують, на відміну від посту?',
        'Ця різниця зумовлена природою двох актів: молитва щоденна та повторювана, а піст щорічний і зосереджений в одному місяці. Дотримання звільнення повною мірою є частиною релігійної практики.',
      ],
      [
        'Коли відновлюється молитва після менструації?',
        'Щойно менструація закінчилася й виконано гусль, молитва нормально відновлюється, без зволікання.',
      ],
      [
        'Яка роль гуслю?',
        'Гусль — велике обмивання, що дозволяє повернутися до стану ритуальної чистоти, потрібного для відновлення молитви та інших актів богослужіння.',
      ],
      [
        'Що робити, якщо я не впевнена, що менструація закінчилася?',
        'Спостереження повної відсутності кровотечі протягом достатнього часу, замість того, щоб покладатися на разове враження, допомагає прояснити ситуацію.',
      ],
      [
        'Чи можна практикувати інші форми богослужіння під час менструації?',
        'Так: зікр, прохання (дуа), милостиня, релігійне навчання та інші добрі вчинки залишаються доступними.',
      ],
      [
        'Чому деякі відповіді можуть відрізнятися залежно від ситуації?',
        'Фікх — сфера тлумачення: думки можуть різнитися залежно від школи правознавства та особистих обставин, і жодна з них сама по собі не є абсолютною.',
      ],
    ],
    section2Body1: 'Ісламський фікх містить визнані розбіжності в тлумаченні певних дрібних питань. Ці розбіжності існують століттями й вважаються законними в межах релігійної традиції.',
    section2Body2: 'Залежно від джерела, до якого звертаються, те саме запитання може тому отримати дещо різні відповіді. Це не означає, що відповідь автоматично хибна: вона відображає різні методології та прочитання одних і тих самих джерел.',
    tip1Title: 'Варто знати',
    tip1Text: 'Послідовне дотримання кваліфікованого джерела, замість постійної зміни думки залежно від знайденої відповіді, допомагає зберігати вашу практику ясною та спокійною.',
    section3Body: 'Деякі ситуації залишаються важкими для вирішення на основі одного загального пояснення. Це особливо стосується випадків, коли:',
    doubtSituations: [
      'Є невпевненість у тому, коли менструація справді закінчилася',
      'Характер кровотечі залишається невизначеним (менструація, істихада, інше)',
      'Зберігається сумнів щодо потреби виконувати гусль',
      'Питання відновлення молитви залишається невизначеним',
      'В інтернеті знайдено суперечливу інформацію',
    ],
    alert2Title: 'Важлива інформація',
    alert2Text: 'Коли ситуація особиста, складна чи стійка, її неможливо розв’язати загальною інформацією. Звернення до кваліфікованого вченого, здатного врахувати вашу конкретну ситуацію, залишається в такому разі найкращим підходом. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    keyPoints: [
      'Жіночий фікх охоплює багато аспектів релігійної практики жінок',
      'Деякі подробиці можуть слушно відрізнятися залежно від школи правознавства',
      'Загальна інформація не замінює персоналізованих релігійних настанов',
      'Стійкий сумнів варто висловити кваліфікованому вченому',
      'Роль AWA — навчальна, а не виносити фетви',
    ],
    shareMessage: 'Поширені запитання про жіночий фікх — AWA',
  },
  cs: {
    badge: 'ČASTO KLADENÉ OTÁZKY',
    title: 'Často kladené otázky\no fiqhu žen',
    metaDuration: '8 min čtení',
    metaType: 'Časté dotazy',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Nejčastější otázky o fiqhu žen shromážděné na jednom místě s jasnými odpověďmi.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Otázky, které se objevují často',
      'Právní školy, které se mohou lišit',
      'V případě přetrvávající pochybnosti',
      'Hlavní poznatky',
    ],
    section1Body: 'Mnoho otázek o cyklu, modlitbě a půstu se u jednotlivých žen pravidelně opakuje. Zde jsou obecné odpovědi na ty nejčastější; pro hlubší poznání je každé téma podrobněji zpracováno také ve vlastním článku.',
    faqItems: [
      [
        'Co je fiqh žen?',
        'Fiqh žen sdružuje praktická pravidla, která se konkrétně týkají ženského těla a bohoslužby: cyklus, čistotu, modlitbu, půst, nifás a istihadu.',
      ],
      [
        'Jaká jsou hlavní témata, kterými se fiqh žen zabývá?',
        'Zahrnuje zejména menstruaci a cyklus, rituální čistotu, ghusl, modlitbu a půst během menstruace a po ní, nifás a istihadu.',
      ],
      [
        'V čem se liší menstruace, poporodní krvácení a nepravidelné krvácení?',
        'Menstruace (hajd) následuje obvyklý cyklus, nifás nastává po porodu a istihada označuje nepravidelné krvácení mimo cyklus. Každé z nich má jiné postavení.',
      ],
      [
        'Co se děje s modlitbou během menstruace?',
        'Modlitba je v tomto období pozastavena: jde o uznané osvobození, které se má prožívat bez pocitu viny.',
      ],
      [
        'Co se děje s půstem během menstruace?',
        'Půst je také pozastaven; dny bez půstu se později nahradí (kada), mimo ramadán.',
      ],
      [
        'Proč se vynechané modlitby obecně nenahrazují, na rozdíl od půstu?',
        'Tento rozdíl vyplývá z povahy obou úkonů: modlitba je každodenní a opakovaná, zatímco půst je roční a soustředěný do jednoho měsíce. Dodržování osvobození je plnohodnotnou součástí náboženské praxe.',
      ],
      [
        'Kdy se modlitba po menstruaci obnoví?',
        'Jakmile menstruace skončí a provede se ghusl, modlitba se normálně obnoví, bez prodlení.',
      ],
      [
        'Jaká je role ghuslu?',
        'Ghusl je velká očista, která umožňuje vrátit se ke stavu rituální čistoty potřebné k obnovení modlitby a dalších úkonů bohoslužby.',
      ],
      [
        'Co dělat, když si nejste jistá, že menstruace skončila?',
        'Pozorování úplné nepřítomnosti krvácení po dostatečně dlouhou dobu, místo spoléhání na ojedinělý dojem, pomáhá situaci objasnit.',
      ],
      [
        'Lze během menstruace vykonávat jiné formy bohoslužby?',
        'Ano: dhikr, prosby, almužna, náboženské vzdělávání a další laskavé skutky zůstávají dostupné.',
      ],
      [
        'Proč se mohou některé odpovědi lišit podle situace?',
        'Fiqh je oblast výkladu: názory se mohou lišit podle právní školy a osobních okolností, aniž by některý názor byl sám o sobě absolutní.',
      ],
    ],
    section2Body1: 'Islámský fiqh zahrnuje uznané rozdíly ve výkladu v určitých detailních bodech. Tyto rozdíly existují po staletí a v rámci náboženské tradice se považují za legitimní.',
    section2Body2: 'Podle konzultovaného zdroje tak může stejná otázka dostat mírně odlišné odpovědi. Neznamená to, že by odpověď byla automaticky špatná: odráží různé metodologie a čtení týchž pramenů.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Důsledné sledování kvalifikovaného zdroje, místo neustálého střídání názorů podle toho, jaká odpověď se právě najde, pomáhá udržet vaši praxi jasnou a klidnou.',
    section3Body: 'Některé situace zůstává obtížné rozhodnout na základě jediného obecného vysvětlení. Platí to zejména tehdy, když:',
    doubtSituations: [
      'Panuje nejistota, kdy menstruace skutečně skončila',
      'Povaha krvácení zůstává nejistá (menstruace, istihada, jiné)',
      'Přetrvává pochybnost o nutnosti provést ghusl',
      'Otázka obnovení modlitby zůstává nejistá',
      'Na internetu byly nalezeny protichůdné informace',
    ],
    alert2Title: 'Důležitá informace',
    alert2Text: 'Pokud je situace osobní, složitá nebo přetrvávající, nelze ji vyřešit obecnými informacemi. V takovém případě zůstává nejlepším přístupem obrátit se na kvalifikovaného učence, který dokáže zohlednit vaši konkrétní situaci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    keyPoints: [
      'Fiqh žen pokrývá mnoho aspektů náboženské praxe žen',
      'Některé podrobnosti se mohou legitimně lišit podle právní školy',
      'Obecné informace nenahrazují personalizované náboženské vedení',
      'Přetrvávající pochybnost si zaslouží být předložena kvalifikovanému učenci',
      'Úlohou AWA je vzdělávat, nikoli vydávat fatwy',
    ],
    shareMessage: 'Často kladené otázky o fiqhu žen — AWA',
  },
  sk: {
    badge: 'ČASTO KLADENÉ OTÁZKY',
    title: 'Často kladené otázky\no fiqhu žien',
    metaDuration: '8 min čítania',
    metaType: 'Často kladené otázky',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Najčastejšie otázky o fiqhu žien zhromaždené na jednom mieste s jasnými odpoveďami.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Otázky, ktoré sa často objavujú',
      'Právne školy, ktoré sa môžu líšiť',
      'V prípade pretrvávajúcej pochybnosti',
      'Hlavné body',
    ],
    section1Body: 'Mnohé otázky o cykle, modlitbe a pôste sa u jednotlivých žien pravidelne opakujú. Tu sú všeobecné odpovede na tie najčastejšie; na ich hlbšie preskúmanie je každá téma podrobnejšie rozpracovaná aj vo vlastnom článku.',
    faqItems: [
      [
        'Čo je fiqh žien?',
        'Fiqh žien združuje praktické pravidlá, ktoré sa osobitne týkajú ženského tela a bohoslužby: cyklus, čistota, modlitba, pôst, nifás a istihada.',
      ],
      [
        'Aké sú hlavné témy, ktoré fiqh žien pokrýva?',
        'Zahŕňa najmä menštruáciu a cyklus, rituálnu čistotu, ghusl, modlitbu a pôst počas menštruácie a po nej, nifás a istihadu.',
      ],
      [
        'Aký je rozdiel medzi menštruáciou, popôrodným krvácaním a nepravidelným krvácaním?',
        'Menštruácia (hajd) sleduje obvyklý cyklus, nifás nastáva po pôrode a istihada označuje nepravidelné krvácanie mimo cyklu. Každé má iné postavenie.',
      ],
      [
        'Čo sa deje s modlitbou počas menštruácie?',
        'Modlitba je v tomto období pozastavená: ide o uznané oslobodenie, ktoré treba prežívať bez viny.',
      ],
      [
        'Čo sa deje s pôstom počas menštruácie?',
        'Pôst je tiež pozastavený; nepostené dni sa nahrádzajú neskôr (kada), mimo ramadánu.',
      ],
      [
        'Prečo sa vynechané modlitby vo všeobecnosti nenahrádzajú, na rozdiel od pôstu?',
        'Tento rozdiel vyplýva z povahy týchto dvoch úkonov: modlitba je každodenná a opakovaná, zatiaľ čo pôst je ročný a sústredený do jedného mesiaca. Dodržiavať oslobodenie je plnohodnotnou súčasťou náboženskej praxe.',
      ],
      [
        'Kedy sa modlitba po menštruácii obnoví?',
        'Hneď ako menštruácia skončí a vykoná sa ghusl, modlitba sa normálne obnoví, bez odkladu.',
      ],
      [
        'Aká je úloha ghuslu?',
        'Ghusl je veľké obmytie, ktoré umožňuje návrat do stavu rituálnej čistoty potrebného na obnovenie modlitby a ďalších úkonov bohoslužby.',
      ],
      [
        'Čo robiť, ak si nie ste istá, že menštruácia skončila?',
        'Pozorovanie úplnej absencie krvácania po dostatočne dlhý čas, namiesto spoliehania sa na jednorazový dojem, pomáha situáciu objasniť.',
      ],
      [
        'Dajú sa počas menštruácie praktizovať iné formy bohoslužby?',
        'Áno: dhikr, prosby, almužna, náboženské vzdelávanie a iné skutky láskavosti zostávajú prístupné.',
      ],
      [
        'Prečo sa niektoré odpovede môžu líšiť podľa situácie?',
        'Fiqh je oblasť výkladu: názory sa môžu líšiť podľa právnej školy a osobných okolností, pričom žiadny názor nie je sám osebe absolútny.',
      ],
    ],
    section2Body1: 'Islamský fiqh zahŕňa uznané rozdiely vo výklade v niektorých detailných bodoch. Tieto rozdiely existujú po stáročia a v rámci náboženskej tradície sa považujú za oprávnené.',
    section2Body2: 'V závislosti od konzultovaného zdroja tak môže tá istá otázka dostať mierne odlišné odpovede. To neznamená, že by odpoveď bola automaticky nesprávna: odráža odlišné metodológie a čítania tých istých prameňov.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Dôsledné nasledovanie kvalifikovaného zdroja, namiesto neustáleho striedania názoru podľa toho, aká odpoveď sa nájde, pomáha udržať vašu prax jasnú a pokojnú.',
    section3Body: 'Niektoré situácie zostávajú ťažko riešiteľné na základe jedného všeobecného vysvetlenia. Platí to najmä vtedy, keď:',
    doubtSituations: [
      'Existuje neistota, kedy menštruácia skutočne skončila',
      'Povaha krvácania zostáva neistá (menštruácia, istihada, iné)',
      'Pretrváva pochybnosť o potrebe vykonať ghusl',
      'Otázka obnovenia modlitby zostáva neistá',
      'Na internete ste našli protichodné informácie',
    ],
    alert2Title: 'Dôležitá informácia',
    alert2Text: 'Keď je situácia osobná, zložitá alebo pretrvávajúca, nedá sa vyriešiť všeobecnými informáciami. V takom prípade zostáva najlepším prístupom obrátiť sa na kvalifikovaného učenca, ktorý dokáže zohľadniť vašu konkrétnu situáciu. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    keyPoints: [
      'Fiqh žien pokrýva mnohé aspekty náboženskej praxe žien',
      'Niektoré podrobnosti sa môžu oprávnene líšiť podľa právnej školy',
      'Všeobecné informácie nenahrádzajú individuálne náboženské usmernenie',
      'Pretrvávajúca pochybnosť si zaslúži, aby ste ju predložili kvalifikovanému učencovi',
      'Úloha AWA je vzdelávacia, nie vydávať fatwy',
    ],
    shareMessage: 'Často kladené otázky o fiqhu žien — AWA',
  },
  hu: {
    badge: 'GYAKRAN ISMÉTELT KÉRDÉSEK',
    title: 'Gyakran ismételt kérdések\na nők fiqhjéről',
    metaDuration: '8 perc olvasás',
    metaType: 'GYIK',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A nők fiqhjével kapcsolatos leggyakoribb kérdések egy helyen, világos válaszokkal.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Gyakran felmerülő kérdések',
      'Jogi iskolák, amelyek eltérhetnek',
      'Tartós kétség esetén',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'A ciklussal, az imával és a böjttel kapcsolatos számos kérdés rendszeresen felmerül nőtől nőig. Íme általános válaszok a leggyakoribbakra; a további elmélyüléshez minden téma részletesebben szerepel a saját cikkében is.',
    faqItems: [
      [
        'Mi a nők fiqhje?',
        'A nők fiqhje azokat a gyakorlati szabályokat foglalja össze, amelyek kifejezetten a női testet és az istentiszteletet érintik: a ciklus, a tisztaság, az ima, a böjt, a nifász és az istihada.',
      ],
      [
        'Melyek a nők fiqhjének fő témái?',
        'Különösen a menstruációt és a ciklust, a rituális tisztaságot, a ghuslt, az imát és a böjtöt a menstruáció alatt és után, a nifászt és az istihadát foglalja magában.',
      ],
      [
        'Mi a különbség a menstruáció, a szülés utáni vérzés és a szabálytalan vérzés között?',
        'A menstruáció (hajd) a szokásos ciklust követi, a nifász szülés után jelentkezik, az istihada pedig a cikluson kívüli, szabálytalan vérzést jelöli. Mindegyik más státuszt követ.',
      ],
      [
        'Mi történik az imával a menstruáció alatt?',
        'Az ima ebben az időszakban fel van függesztve: ez elismert felmentés, amelyet bűntudat nélkül kell megélni.',
      ],
      [
        'Mi történik a böjttel a menstruáció alatt?',
        'A böjt is fel van függesztve; a nem böjtölt napokat később pótolják (kada), a ramadánon kívül.',
      ],
      [
        'Miért nem pótolják általában a kihagyott imákat, a böjttel ellentétben?',
        'Ez a különbség a két cselekmény természetéből adódik: az ima napi és ismétlődő, a böjt pedig éves és egy hónapra összpontosul. A felmentés követése a vallási gyakorlat teljes értékű része.',
      ],
      [
        'Mikor folytatódik az ima a menstruáció után?',
        'Amint a menstruáció véget ért, és a ghusl megtörtént, az ima halasztás nélkül normálisan folytatódik.',
      ],
      [
        'Mi a ghusl szerepe?',
        'A ghusl a nagy mosakodás, amely lehetővé teszi a rituális tisztasági állapotba való visszatérést, amely az ima és az istentisztelet más cselekményeinek folytatásához szükséges.',
      ],
      [
        'Mit tegyél, ha nem vagy biztos abban, hogy a menstruáció véget ért?',
        'A vérzés teljes hiányának kellően hosszú idő alatti megfigyelése, ahelyett hogy egyszeri benyomásra hagyatkoznál, segít tisztázni a helyzetet.',
      ],
      [
        'Gyakorolhatók-e az istentisztelet más formái a menstruáció alatt?',
        'Igen: a dhikr, a könyörgések, az adakozás, a vallási tanulás és más jócselekedetek elérhetők maradnak.',
      ],
      [
        'Miért térhetnek el egyes válaszok a helyzettől függően?',
        'A fiqh az értelmezés területe: a vélemények a jogi iskolától és a személyes körülményektől függően eltérhetnek, anélkül, hogy bármelyik vélemény önmagában abszolút lenne.',
      ],
    ],
    section2Body1: 'Az iszlám fiqh elismert értelmezési különbségeket tartalmaz bizonyos részletkérdésekben. Ezek a különbségek évszázadok óta léteznek, és a vallási hagyományon belül jogosnak tekintik őket.',
    section2Body2: 'A konzultált forrástól függően ugyanarra a kérdésre tehát kissé eltérő válaszok adhatók. Ez nem azt jelenti, hogy egy válasz automatikusan téves lenne: különböző módszertanokat és ugyanazon források eltérő olvasatait tükrözi.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Ha következetesen egy kvalifikált forrást követsz, ahelyett hogy a megtalált válasz alapján folyton véleményt váltanál, az segít a gyakorlatod világos és nyugodt megtartásában.',
    section3Body: 'Egyes helyzeteket nehéz egyetlen általános magyarázat alapján eldönteni. Ez különösen akkor van így, ha:',
    doubtSituations: [
      'Bizonytalan, hogy a menstruáció mikor ért ténylegesen véget',
      'A vérzés természete bizonytalan marad (menstruáció, istihada, egyéb)',
      'Tartós kétség áll fenn a ghusl elvégzésének szükségességéről',
      'Az ima folytatásának kérdése bizonytalan marad',
      'Ellentmondó információkat találtál az interneten',
    ],
    alert2Title: 'Fontos információ',
    alert2Text: 'Ha egy helyzet személyes, összetett vagy tartós, általános információkkal nem oldható meg. Ilyenkor a legjobb megközelítés egy kvalifikált tudóshoz fordulni, aki figyelembe tudja venni a konkrét helyzetedet. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    keyPoints: [
      'A nők fiqhje a nők vallási gyakorlatának számos aspektusát lefedi',
      'Egyes részletek a jogi iskolától függően jogosan eltérhetnek',
      'Az általános információ nem helyettesíti az egyéni vallási útmutatást',
      'A tartós kétséget érdemes kvalifikált tudós elé vinni',
      'Az AWA szerepe ismeretterjesztő, nem fatwák kiadása',
    ],
    shareMessage: 'Gyakran ismételt kérdések a nők fiqhjéről — AWA',
  },
  ro: {
    badge: 'ÎNTREBĂRI FRECVENTE',
    title: 'Întrebări frecvente\ndespre fiqh-ul femeii',
    metaDuration: '8 min de citit',
    metaType: 'Întrebări frecvente',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Cele mai frecvente întrebări despre fiqh-ul femeii, adunate într-un singur loc, cu răspunsuri clare.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Întrebări care apar des',
      'Școli de jurisprudență care pot varia',
      'În caz de îndoială persistentă',
      'Ce să reții',
    ],
    section1Body: 'Multe întrebări despre ciclu, rugăciune și post apar regulat de la o femeie la alta. Iată răspunsuri generale la cele mai frecvente; pentru a merge mai departe, fiecare subiect este tratat și mai aprofundat într-un articol dedicat.',
    faqItems: [
      [
        'Ce este fiqh-ul femeii?',
        'Fiqh-ul femeii reunește regulile practice care privesc în mod specific corpul femeii și cultul: ciclul, puritatea, rugăciunea, postul, nifas-ul și istihâda.',
      ],
      [
        'Care sunt principalele subiecte tratate de fiqh-ul femeii?',
        'El cuprinde în special menstruația și ciclul, puritatea rituală, ghusl, rugăciunea și postul în timpul și după menstruație, nifas-ul și istihâda.',
      ],
      [
        'Care este diferența dintre menstruație, sângerarea postnatală și sângerarea neregulată?',
        'Menstruația (hayd) urmează ciclul obișnuit, nifas-ul apare după naștere, iar istihâda desemnează o sângerare neregulată, în afara ciclului. Fiecare urmează un statut diferit.',
      ],
      [
        'Ce se întâmplă cu rugăciunea în timpul menstruației?',
        'Rugăciunea este suspendată în această perioadă: este o scutire recunoscută, de trăit fără vinovăție.',
      ],
      [
        'Ce se întâmplă cu postul în timpul menstruației?',
        'Postul este și el suspendat; zilele nepostite sunt recuperate mai târziu (qadaa), în afara Ramadanului.',
      ],
      [
        'De ce rugăciunile ratate nu se recuperează în general, spre deosebire de post?',
        'Această diferență se datorează naturii celor două acte: rugăciunea este zilnică și repetată, în timp ce postul este anual și concentrat într-o lună. Respectarea scutirii face pe deplin parte din practica religioasă.',
      ],
      [
        'Când se reia rugăciunea după menstruație?',
        'De îndată ce menstruația s-a încheiat și s-a efectuat ghusl, rugăciunea se reia normal, fără întârziere.',
      ],
      [
        'Care este rolul ghusl-ului?',
        'Ghusl este abluțiunea majoră care permite revenirea la starea de puritate rituală necesară pentru a relua rugăciunea și alte acte de cult.',
      ],
      [
        'Ce faci dacă nu ești sigură că menstruația s-a încheiat?',
        'Observarea absenței totale a sângerării o perioadă suficientă de timp, în loc de a te baza pe o impresie punctuală, ajută la clarificarea situației.',
      ],
      [
        'Pot fi practicate alte forme de cult în timpul menstruației?',
        'Da: dhikr, rugăciunile de cerere, caritatea, învățarea religioasă și alte gesturi de bunătate rămân accesibile.',
      ],
      [
        'De ce pot varia unele răspunsuri în funcție de situație?',
        'Fiqh-ul este un domeniu de interpretare: părerile pot varia în funcție de școala de jurisprudență și de circumstanțele personale, fără ca vreo părere să fie absolută în sine.',
      ],
    ],
    section2Body1: 'Fiqh-ul islamic include diferențe de interpretare recunoscute în anumite puncte de detaliu. Aceste diferențe există de secole și sunt considerate legitime în cadrul tradiției religioase.',
    section2Body2: 'În funcție de sursa consultată, aceeași întrebare poate primi deci răspunsuri ușor diferite. Aceasta nu înseamnă că un răspuns ar fi automat greșit: reflectă metodologii și lecturi diferite ale acelorași surse.',
    tip1Title: 'Bine de știut',
    tip1Text: 'A urma în mod constant o sursă calificată, în loc de a-ți schimba mereu părerea în funcție de orice răspuns găsit, ajută la menținerea unei practici clare și liniștite.',
    section3Body: 'Unele situații rămân greu de tranșat pe baza unei singure explicații generale. Este cazul în special atunci când:',
    doubtSituations: [
      'Există incertitudine cu privire la momentul în care menstruația s-a încheiat efectiv',
      'Natura sângerării rămâne incertă (menstruație, istihâda, altceva)',
      'Persistă îndoiala cu privire la necesitatea efectuării ghusl-ului',
      'Întrebarea reluării rugăciunii rămâne incertă',
      'Au fost găsite informații contradictorii online',
    ],
    alert2Title: 'Informație importantă',
    alert2Text: 'Când o situație este personală, complexă sau persistentă, ea nu poate fi rezolvată cu informații generale. Adresarea către un savant calificat, capabil să țină cont de situația ta specifică, rămâne în acest caz cea mai bună abordare. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    keyPoints: [
      'Fiqh-ul femeii cuprinde multe aspecte ale practicii religioase a femeii',
      'Unele detalii pot varia în mod legitim în funcție de școala de jurisprudență',
      'Informațiile generale nu înlocuiesc îndrumarea religioasă personalizată',
      'O îndoială persistentă merită adusă în discuție cu un savant calificat',
      'Rolul AWA este educativ, nu de a emite fatwa',
    ],
    shareMessage: 'Întrebări frecvente despre fiqh-ul femeii — AWA',
  },
  bg: {
    badge: 'ЧЕСТО ЗАДАВАНИ ВЪПРОСИ',
    title: 'Често задавани въпроси\nза женския фикх',
    metaDuration: '8 мин четене',
    metaType: 'Чести въпроси',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Най-честите въпроси за женския фикх, събрани на едно място с ясни отговори.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Въпроси, които се задават често',
      'Школи на правото, които могат да се различават',
      'При упорито съмнение',
      'Какво да запомниш',
    ],
    section1Body: 'Много въпроси за цикъла, молитвата и поста се задават редовно от една жена на друга. Ето общи отговори на най-честите от тях; за да навлезеш по-дълбоко, всяка тема е разгледана подробно и в собствена отделна статия.',
    faqItems: [
      [
        'Какво е женският фикх?',
        'Женският фикх обединява практическите правила, които се отнасят конкретно до женското тяло и богослужение: цикъла, чистотата, молитвата, поста, нифаса и истихада.',
      ],
      [
        'Кои са основните теми, обхванати от женския фикх?',
        'Той обхваща по-специално менструацията и цикъла, ритуалната чистота, гусла, молитвата и поста по време и след менструация, нифаса и истихада.',
      ],
      [
        'Каква е разликата между менструация, кървене след раждане и нередовно кървене?',
        'Менструацията (хайд) следва обичайния цикъл, нифасът настъпва след раждане, а истихада означава нередовно кървене извън цикъла. Всяко следва различен статус.',
      ],
      [
        'Какво се случва с молитвата по време на менструация?',
        'Молитвата е преустановена през това време: това е призната освободеност, която се преживява без чувство за вина.',
      ],
      [
        'Какво се случва с поста по време на менструация?',
        'Постът също е преустановен; непостените дни се наваксват по-късно (кадаа), извън Рамадан.',
      ],
      [
        'Защо пропуснатите молитви обикновено не се наваксват, за разлика от поста?',
        'Тази разлика се дължи на естеството на двата акта: молитвата е ежедневна и повтаряща се, докато постът е годишен и съсредоточен в един месец. Следването на освобождаването изцяло е част от религиозната практика.',
      ],
      [
        'Кога се възобновява молитвата след менструация?',
        'Веднага щом менструацията е свършила и е извършен гусл, молитвата се възобновява нормално, без забавяне.',
      ],
      [
        'Каква е ролята на гусла?',
        'Гуслът е голямото абдест, което позволява да се върнеш към състоянието на ритуална чистота, нужно за възобновяване на молитвата и другите актове на богослужение.',
      ],
      [
        'Какво да направиш, ако не си сигурна, че менструацията е свършила?',
        'Наблюдението на пълното отсъствие на кървене за достатъчно дълго време, вместо да се доверяваш на еднократно впечатление, помага да се изясни ситуацията.',
      ],
      [
        'Могат ли други форми на богослужение да се практикуват по време на менструация?',
        'Да: зикр, молби, милостиня, религиозно учене и други добри дела остават достъпни.',
      ],
      [
        'Защо някои отговори могат да варират според ситуацията?',
        'Фикхът е област на тълкуване: мненията могат да варират според школата на правото и личните обстоятелства, без нито едно мнение да е абсолютно само по себе си.',
      ],
    ],
    section2Body1: 'Ислямският фикх включва признати различия в тълкуването по някои въпроси на подробности. Тези различия съществуват от векове и се смятат за легитимни в рамките на религиозната традиция.',
    section2Body2: 'Според консултирания източник един и същ въпрос може следователно да получи леко различни отговори. Това не означава, че един отговор автоматично би бил грешен: то отразява различни методологии и четения на едни и същи източници.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Последователното следване на квалифициран източник, вместо постоянната смяна на мнение според първия намерен отговор, помага да поддържаш практиката си ясна и спокойна.',
    section3Body: 'Някои ситуации остават трудни за разрешаване с едно общо обяснение. Това е особено така, когато:',
    doubtSituations: [
      'Има несигурност кога менструацията действително е свършила',
      'Естеството на кървенето остава неясно (менструация, истихада, друго)',
      'Съмнението относно нуждата от гусл продължава',
      'Въпросът за възобновяването на молитвата остава несигурен',
      'В интернет е намерена противоречива информация',
    ],
    alert2Title: 'Важна информация',
    alert2Text: 'Когато ситуацията е лична, сложна или упорита, тя не може да се реши с обща информация. Обръщането към квалифициран учен, способен да вземе предвид конкретната ти ситуация, остава най-добрият подход в такъв случай. AWA не издава фетви и не дава персонализирани религиозни решения.',
    keyPoints: [
      'Женският фикх обхваща много аспекти от религиозната практика на жените',
      'Някои подробности могат легитимно да варират според школата на правото',
      'Общата информация не замества персонализираните религиозни насоки',
      'Упорито съмнение заслужава да бъде повдигнато пред квалифициран учен',
      'Ролята на AWA е образователна, а не да издава фетви',
    ],
    shareMessage: 'Често задавани въпроси за женския фикх — AWA',
  },
  sr: {
    badge: 'ЧЕСТО ПОСТАВЉАНА ПИТАЊА',
    title: 'Често постављана питања\nо женском фикху',
    metaDuration: '8 мин читања',
    metaType: 'Честа питања',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Најчешћа питања о женском фикху, сабрана на једном месту уз јасне одговоре.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Питања која се често постављају',
      'Правне школе које могу да се разликују',
      'При упорној сумњи',
      'Шта да запамтиш',
    ],
    section1Body: 'Многа питања о циклусу, молитви и посту редовно се постављају од једне жене до друге. Ево општих одговора на најчешћа; да сазнаш више, свака тема је детаљније обрађена и у посебном чланку.',
    faqItems: [
      [
        'Шта је женски фикх?',
        'Женски фикх обједињује практична правила која се посебно односе на женско тело и богослужење: циклус, чистоту, молитву, пост, нифас и истихаду.',
      ],
      [
        'Које су главне теме које обухвата женски фикх?',
        'Обухвата нарочито менструацију и циклус, ритуалну чистоту, гусл, молитву и пост током и после менструације, нифас и истихаду.',
      ],
      [
        'Каква је разлика између менструације, крварења после порођаја и нередовног крварења?',
        'Менструација (хајд) следи уобичајени циклус, нифас настаје после порођаја, а истихада означава нередовно крварење ван циклуса. Свако следи различит статус.',
      ],
      [
        'Шта се дешава са молитвом током менструације?',
        'Молитва је преустављена у овом периоду: то је призната изузетност која се проживљава без осећаја кривице.',
      ],
      [
        'Шта се дешава са постом током менструације?',
        'Пост је такође преустављен; непостени дани се касније надокнађују (кадаа), ван Рамазана.',
      ],
      [
        'Зашто се пропуштене молитве обично не надокнађују, за разлику од поста?',
        'Ова разлика је последица природе ова два дела: молитва је дневна и понављајућа, док је пост годишњи и усредсређен у један месец. Следити ослобађање у потпуности је део верске праксе.',
      ],
      [
        'Када се молитва наставља после менструације?',
        'Чим менструација заврши и изврши се гусл, молитва се нормално наставља, без одлагања.',
      ],
      [
        'Каква је улога гусла?',
        'Гусл је велико абдест које омогућава повратак у стање ритуалне чистоте потребно за настављање молитве и других дела богослужења.',
      ],
      [
        'Шта урадити ако нисам сигурна да је менструација завршила?',
        'Посматрање потпуног одсуства крварења током довољно времена, уместо ослањања на једнократан утисак, помаже да се ситуација разјасни.',
      ],
      [
        'Могу ли се други облици богослужења упражњавати током менструације?',
        'Да: зикр, молбе, милостиња, верско учење и друга добра дела остају доступни.',
      ],
      [
        'Зашто неки одговори могу варирати зависно од ситуације?',
        'Фикх је област тумачења: мишљења могу варирати зависно од правне школе и личних околности, без да је једно мишљење само по себи апсолутно.',
      ],
    ],
    section2Body1: 'Исламски фикх обухвата признате разлике у тумачењу по неким питањима детаља. Те разлике постоје вековима и сматрају се легитимним унутар верске традиције.',
    section2Body2: 'Зависно од консултованог извора, исто питање може стога добити благо различите одговоре. То не значи да би одговор аутоматски био погрешан: одражава различите методологије и тумачења истих извора.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Доследно праћење квалификованог извора, уместо сталне промене мишљења према првом пронађеном одговору, помаже да твоја пракса остане јасна и мирна.',
    section3Body: 'Неке ситуације остају тешке за решавање на основу једног општег објашњења. То је нарочито случај када:',
    doubtSituations: [
      'Постоји несигурност када је менструација заиста завршила',
      'Природа крварења остаје неизвесна (менструација, истихада, друго)',
      'Сумња у потребу за гуслом траје',
      'Питање настављања молитве остаје неизвесно',
      'На интернету је пронађена противуречна информација',
    ],
    alert2Title: 'Важна информација',
    alert2Text: 'Када је ситуација лична, сложена или упорна, она се не може решити општим информацијама. Обраћање квалификованом учењаку, способном да узме у обзир твоју конкретну ситуацију, у том случају остаје најбољи приступ. AWA не издаје фетве нити персонализоване верске пресуде.',
    keyPoints: [
      'Женски фикх обухвата многе аспекте верске праксе жена',
      'Неке појединости могу легитимно варирати зависно од правне школе',
      'Опште информације не замењују персонализоване верске смернице',
      'Упорну сумњу вреди изнети квалификованом учењаку',
      'Улога AWA је образовна, а не издавање фетви',
    ],
    shareMessage: 'Често постављана питања о женском фикху — AWA',
  },
  hr: {
    badge: 'ČESTA PITANJA',
    title: 'Često postavljana pitanja\no ženskom fikhu',
    metaDuration: '8 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Najčešća pitanja o ženskom fikhu, okupljena na jednom mjestu s jasnim odgovorima.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Pitanja koja se često javljaju',
      'Pravne škole koje se mogu razlikovati',
      'U slučaju trajne sumnje',
      'Ključne poruke',
    ],
    section1Body: 'Mnoga pitanja o ciklusu, molitvi i postu redovito se javljaju kod različitih žena. Evo općih odgovora na najčešća; za više pojedinosti svaka je tema detaljnije obrađena i u zasebnom članku.',
    faqItems: [
      [
        'Što je ženski fikh?',
        'Ženski fikh okuplja praktična pravila koja se posebno odnose na žensko tijelo i bogoslužje: ciklus, čistoću, molitvu, post, nifas i istihadu.',
      ],
      [
        'Koje glavne teme obuhvaća ženski fikh?',
        'Obuhvaća osobito menstruaciju i ciklus, ritualnu čistoću, gusl, molitvu i post tijekom i nakon menstruacije, nifas i istihadu.',
      ],
      [
        'Koja je razlika između menstruacije, poslijeporođajnog krvarenja i nepravilnog krvarenja?',
        'Menstruacija (hajd) slijedi uobičajeni ciklus, nifas nastupa nakon poroda, a istihada označava nepravilno krvarenje, izvan ciklusa. Svako slijedi drugačiji status.',
      ],
      [
        'Što se događa s molitvom tijekom menstruacije?',
        'Molitva je u tom razdoblju suspendirana: to je priznato oslobođenje koje treba proživjeti bez krivnje.',
      ],
      [
        'Što se događa s postom tijekom menstruacije?',
        'Post je također suspendiran; dani u kojima se nije postilo nadoknađuju se kasnije (kada), izvan Ramazana.',
      ],
      [
        'Zašto se propuštene molitve općenito ne nadoknađuju, za razliku od posta?',
        'Ta razlika proizlazi iz naravi dvaju čina: molitva je svakodnevna i ponavlja se, dok je post godišnji i usredotočen unutar jednog mjeseca. Slijeđenje oslobođenja puni je dio vjerske prakse.',
      ],
      [
        'Kada se molitva nastavlja nakon menstruacije?',
        'Čim menstruacija završi i obavi se gusl, molitva se normalno nastavlja, bez odgode.',
      ],
      [
        'Koja je uloga gusla?',
        'Gusl je veliko pranje koje omogućuje povratak u stanje ritualne čistoće potrebno za nastavak molitve i drugih bogoslužnih čina.',
      ],
      [
        'Što učiniti ako nisi sigurna da je menstruacija završila?',
        'Promatranje potpunog izostanka krvarenja tijekom dovoljno dugog vremena, umjesto oslanjanja na jednokratan dojam, pomaže razjasniti situaciju.',
      ],
      [
        'Mogu li se tijekom menstruacije prakticirati drugi oblici bogoslužja?',
        'Da: zikr, dove, dobročinstvo, vjersko učenje i druga djela dobrote ostaju dostupni.',
      ],
      [
        'Zašto se neki odgovori mogu razlikovati ovisno o situaciji?',
        'Fikh je područje tumačenja: mišljenja se mogu razlikovati ovisno o pravnoj školi i osobnim okolnostima, a nijedno mišljenje samo po sebi nije apsolutno.',
      ],
    ],
    section2Body1: 'Islamski fikh uključuje priznate razlike u tumačenju o nekim pojedinostima. Te razlike postoje stoljećima i smatraju se legitimnima unutar vjerske tradicije.',
    section2Body2: 'Ovisno o konzultiranom izvoru, isto pitanje može dobiti neznatno različite odgovore. To ne znači da bi odgovor automatski bio pogrešan: odražava različite metodologije i čitanja istih izvora.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Dosljedno slijeđenje kvalificiranog izvora, umjesto stalne promjene mišljenja prema svakom pronađenom odgovoru, pomaže održati tvoju praksu jasnom i mirnom.',
    section3Body: 'Neke situacije teško je razriješiti na temelju jednog općeg objašnjenja. To je osobito slučaj kada:',
    doubtSituations: [
      'Postoji neizvjesnost o tome kada je menstruacija doista završila',
      'Narav krvarenja ostaje neizvjesna (menstruacija, istihada, drugo)',
      'Sumnja ostaje oko potrebe za obavljanjem gusla',
      'Pitanje nastavka molitve ostaje neizvjesno',
      'Na internetu su pronađene proturječne informacije',
    ],
    alert2Title: 'Važna informacija',
    alert2Text: 'Kad je situacija osobna, složena ili dugotrajna, ne može se riješiti općim informacijama. Obraćanje kvalificiranom učenjaku, koji može uzeti u obzir tvoju konkretnu situaciju, tada ostaje najbolji pristup. AWA ne izdaje fetve niti individualne vjerske presude.',
    keyPoints: [
      'Ženski fikh obuhvaća mnoge aspekte ženske vjerske prakse',
      'Neke se pojedinosti mogu legitimno razlikovati ovisno o pravnoj školi',
      'Opće informacije ne zamjenjuju individualno vjersko vodstvo',
      'Trajnu sumnju vrijedi iznijeti kvalificiranom učenjaku',
      'Uloga AWA je edukativna, a ne izdavanje fetvi',
    ],
    shareMessage: 'Često postavljana pitanja o ženskom fikhu — AWA',
  },
  bs: {
    badge: 'ČESTA PITANJA',
    title: 'Često postavljana pitanja\no ženskom fikhu',
    metaDuration: '8 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Najčešća pitanja o ženskom fikhu, okupljena na jednom mjestu s jasnim odgovorima.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Pitanja koja se često javljaju',
      'Pravne škole koje se mogu razlikovati',
      'U slučaju trajne sumnje',
      'Ključne poruke',
    ],
    section1Body: 'Mnoga pitanja o ciklusu, molitvi i postu redovito se javljaju kod različitih žena. Evo općih odgovora na najčešća; za više pojedinosti svaka je tema detaljnije obrađena i u zasebnom članku.',
    faqItems: [
      [
        'Što je ženski fikh?',
        'Ženski fikh okuplja praktična pravila koja se posebno odnose na žensko tijelo i bogoslužje: ciklus, čistoću, molitvu, post, nifas i istihadu.',
      ],
      [
        'Koje glavne teme obuhvaća ženski fikh?',
        'Obuhvaća osobito menstruaciju i ciklus, ritualnu čistoću, gusl, molitvu i post tokom i nakon menstruacije, nifas i istihadu.',
      ],
      [
        'Koja je razlika između menstruacije, poslijeporođajnog krvarenja i nepravilnog krvarenja?',
        'Menstruacija (hajd) slijedi uobičajeni ciklus, nifas nastupa nakon porođaja, a istihada označava nepravilno krvarenje, izvan ciklusa. Svako slijedi drugačiji status.',
      ],
      [
        'Što se događa s molitvom tokom menstruacije?',
        'Molitva je u tom razdoblju suspendirana: to je priznato oslobođenje koje treba proživjeti bez krivnje.',
      ],
      [
        'Što se događa s postom tokom menstruacije?',
        'Post je također suspendiran; dani u kojima se nije postilo nadoknađuju se kasnije (kaza), izvan Ramazana.',
      ],
      [
        'Zašta se propuštene molitve općenito ne nadoknađuju, za razliku od posta?',
        'Ta razlika proizlazi iz naravi dvaju čina: molitva je svakodnevna i ponavlja se, dok je post godišnji i usredotočen unutar jednog mjeseca. Slijeđenje oslobođenja puni je dio vjerske prakse.',
      ],
      [
        'Kada se molitva nastavlja nakon menstruacije?',
        'Čim menstruacija završi i obavi se gusl, molitva se normalno nastavlja, bez odgode.',
      ],
      [
        'Koja je uloga gusla?',
        'Gusl je veliko pranje koje omogućuje povratak u stanje ritualne čistoće potrebno za nastavak molitve i drugih bogoslužnih čina.',
      ],
      [
        'Što učiniti ako nisi sigurna da je menstruacija završila?',
        'Promatranje potpunog izostanka krvarenja tokom dovoljno dugog vremena, umjesto oslanjanja na jednokratan dojam, pomaže razjasniti situaciju.',
      ],
      [
        'Mogu li se tokom menstruacije prakticirati drugi oblici bogoslužja?',
        'Da: zikr, dove, dobročinstvo, vjersko učenje i druga djela dobrote ostaju dostupni.',
      ],
      [
        'Zašta se neki odgovori mogu razlikovati ovisno o situaciji?',
        'Fikh je područje tumačenja: mišljenja se mogu razlikovati ovisno o pravnoj školi i osobnim okolnostima, a nijedno mišljenje samo po sebi nije apsolutno.',
      ],
    ],
    section2Body1: 'Islamski fikh uključuje priznate razlike u tumačenju o nekim pojedinostima. Te razlike postoje stoljećima i smatraju se legitimnima unutar vjerske tradicije.',
    section2Body2: 'Ovisno o konzultiranom izvoru, isto pitanje može dobiti neznatno različite odgovore. To ne znači da bi odgovor automatski bio pogrešan: odražava različite metodologije i čitanja istih izvora.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Dosljedno slijeđenje kvalificiranog izvora, umjesto stalne promjene mišljenja prema svakom pronađenom odgovoru, pomaže održati tvoju praksu jasnom i mirnom.',
    section3Body: 'Neke situacije teško je razriješiti na temelju jednog općeg objašnjenja. To je osobito slučaj kada:',
    doubtSituations: [
      'Postoji neizvjesnost o tome kada je menstruacija doista završila',
      'Narav krvarenja ostaje neizvjesna (menstruacija, istihada, drugo)',
      'Sumnja ostaje oko potrebe za obavljanjem gusla',
      'Pitanje nastavka molitve ostaje neizvjesno',
      'Na internetu su pronađene proturječne informacije',
    ],
    alert2Title: 'Važna informacija',
    alert2Text: 'Kad je situacija osobna, složena ili dugotrajna, ne može se riješiti općim informacijama. Obraćanje kvalificiranom učenjaku, koji može uzeti u obzir tvoju konkretnu situaciju, tada ostaje najbolji pristup. AWA ne izdaje fetve niti individualne vjerske presude.',
    keyPoints: [
      'Ženski fikh obuhvaća mnoge aspekte ženske vjerske prakse',
      'Neke se pojedinosti mogu legitimno razlikovati ovisno o pravnoj školi',
      'Opće informacije ne zamjenjuju individualno vjersko vodstvo',
      'Trajnu sumnju vrijedi iznijeti kvalificiranom učenjaku',
      'Uloga AWA je edukativna, a ne izdavanje fetvi',
    ],
    shareMessage: 'Često postavljana pitanja o ženskom fikhu — AWA',
  },
  sl: {
    badge: 'POGOSTA VPRAŠANJA',
    title: 'Pogosto zastavljena vprašanja\no ženskem fikhu',
    metaDuration: '8 min branja',
    metaType: 'Pogosta vprašanja',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Najpogostejša vprašanja o ženskem fikhu, zbrana na enem mestu z jasnimi odgovori.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Vprašanja, ki se pogosto pojavljajo',
      'Pravne šole, ki se lahko razlikujejo',
      'V primeru trajnega dvoma',
      'Ključna sporočila',
    ],
    section1Body: 'Mnoga vprašanja o ciklu, molitvi in postu se redno pojavljajo pri različnih ženskah. Tu so splošni odgovori na najpogostejša; za več podrobnosti je vsaka tema podrobneje obravnavana tudi v posebnem članku.',
    faqItems: [
      [
        'Kaj je ženski fikh?',
        'Ženski fikh združuje praktična pravila, ki se posebej nanašajo na žensko telo in bogoslužje: cikel, čistost, molitev, post, nifas in istihado.',
      ],
      [
        'Katere glavne teme obsega ženski fikh?',
        'Obsega zlasti menstruacijo in cikel, ritualno čistost, gusl, molitev in post med menstruacijo in po njej, nifas in istihado.',
      ],
      [
        'Kakšna je razlika med menstruacijo, poporodno krvavitvijo in nepravilno krvavitvijo?',
        'Menstruacija (hajd) sledi običajnemu ciklu, nifas nastopi po porodu, istihada pa pomeni nepravilno krvavitev, izven cikla. Vsaka sledi drugačnemu statusu.',
      ],
      [
        'Kaj se dogaja z molitvijo med menstruacijo?',
        'Molitev je v tem obdobju suspendirana: to je priznana oprostitev, ki jo je treba doživeti brez krivde.',
      ],
      [
        'Kaj se dogaja s postom med menstruacijo?',
        'Post je prav tako suspendiran; dnevi, ko se ni postilo, se nadomestijo pozneje (kada), izven ramazana.',
      ],
      [
        'Zakaj se zamujene molitve na splošno ne nadomeščajo, za razliko od posta?',
        'Ta razlika izhaja iz narave obeh dejanj: molitev je vsakodnevna in se ponavlja, medtem ko je post letni in osredotočen v enem mesecu. Sledenje oprostitvi je poln del verske prakse.',
      ],
      [
        'Kdaj se molitev nadaljuje po menstruaciji?',
        'Takoj ko se menstruacija konča in se opravi gusl, se molitev običajno nadaljuje, brez odlašanja.',
      ],
      [
        'Kakšna je vloga gusla?',
        'Gusl je veliko umivanje, ki omogoča vrnitev v stanje ritualne čistosti, potrebno za nadaljevanje molitve in drugih bogoslužnih dejanj.',
      ],
      [
        'Kaj storiti, če nisi prepričana, da se je menstruacija končala?',
        'Opazovanje popolne odsotnosti krvavitve dovolj dolgo časa, namesto zanašanja na enkraten vtis, pomaga razjasniti situacijo.',
      ],
      [
        'Ali se med menstruacijo lahko prakticirajo druge oblike bogoslužja?',
        'Da: zikr, dove, dobrodelnost, versko učenje in druga dobra dela ostajajo dostopni.',
      ],
      [
        'Zakaj se nekateri odgovori lahko razlikujejo glede na situacijo?',
        'Fikh je področje razlage: mnenja se lahko razlikujejo glede na pravno šolo in osebne okoliščine, nobeno mnenje samo po sebi ni absolutno.',
      ],
    ],
    section2Body1: 'Islamski fikh vključuje priznane razlike v razlagi pri nekaterih podrobnostih. Te razlike obstajajo stoletja in se štejejo za legitimne znotraj verske tradicije.',
    section2Body2: 'Glede na posvetovani vir lahko isto vprašanje dobi rahlo različne odgovore. To ne pomeni, da bi bil odgovor samodejno napačen: odraža različne metodologije in branja istih virov.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Dosledno sledenje kvalificiranemu viru, namesto nenehnega spreminjanja mnenja glede na vsak najden odgovor, pomaga ohranjati tvojo prakso jasno in mirno.',
    section3Body: 'Nekatere situacije je težko razrešiti na podlagi ene same splošne razlage. To je zlasti primer, kadar:',
    doubtSituations: [
      'Obstaja negotovost o tem, kdaj se je menstruacija res končala',
      'Narava krvavitve ostaja negotova (menstruacija, istihada, drugo)',
      'Dvom ostaja glede potrebe po opravljanju gusla',
      'Vprašanje nadaljevanja molitve ostaja negotovo',
      'Na spletu so bile najdene nasprotujoče si informacije',
    ],
    alert2Title: 'Pomembna informacija',
    alert2Text: 'Kadar je situacija osebna, zapletena ali dolgotrajna, je ni mogoče rešiti s splošnimi informacijami. Obrnitev na kvalificiranega učenjaka, ki lahko upošteva tvojo konkretno situacijo, tedaj ostaja najboljši pristop. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    keyPoints: [
      'Ženski fikh zajema mnoge vidike ženske verske prakse',
      'Nekatere podrobnosti se lahko legitimno razlikujejo glede na pravno šolo',
      'Splošne informacije ne nadomeščajo individualnega verskega vodstva',
      'Trajen dvom je vredno predstaviti kvalificiranemu učenjaku',
      'Vloga AWA je izobraževalna, ne izdajanje fetv',
    ],
    shareMessage: 'Pogosto zastavljena vprašanja o ženskem fikhu — AWA',
  },
  ne: {
    badge: 'बारम्बार सोधिने प्रश्नहरू',
    title: 'महिलाको फिक्हबारे\nबारम्बार सोधिने प्रश्नहरू',
    metaDuration: '8 मिनेट पढाइ',
    metaType: 'बारम्बार सोधिने प्रश्न',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'महिलाको फिक्हबारे सबैभन्दा सामान्य प्रश्नहरू, स्पष्ट उत्तरसहित एकै ठाउँमा।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'प्रायः आउने प्रश्नहरू',
      'फरक हुन सक्ने फिक्हका विचारधाराहरू',
      'लगातार शङ्का भएमा',
      'मुख्य कुराहरू',
    ],
    section1Body: 'चक्र, नमाज र रोजाबारे धेरै प्रश्नहरू एक महिलादेखि अर्कोमा नियमित रूपमा आउँछन्। सबैभन्दा बारम्बार आउनेहरूका सामान्य उत्तरहरू यहाँ छन्; थप गहिराइमा जान, हरेक विषयलाई आफ्नै समर्पित लेखमा पनि थप विस्तारमा समेटिएको छ।',
    faqItems: [
      [
        'महिलाको फिक्ह के हो?',
        'महिलाको फिक्हले महिलाको शरीर र इबादतसँग विशेष रूपमा सम्बन्धित व्यावहारिक नियमहरू एकै ठाउँमा ल्याउँछ: चक्र, पवित्रता, नमाज, रोजा, निफास र इस्तिहाजा।',
      ],
      [
        'महिलाको फिक्हले समेट्ने मुख्य विषयहरू के हुन्?',
        'यसले विशेष गरी महिनावारी र चक्र, अनुष्ठानिक पवित्रता, गुस्ल, महिनावारीको समयमा र पछि नमाज र रोजा, निफास र इस्तिहाजा समेट्छ।',
      ],
      [
        'महिनावारी, सुत्केरीपछिको रक्तस्राव र अनियमित रक्तस्रावबीच के फरक छ?',
        'महिनावारी (हैज) सामान्य चक्र पछ्याउँछ, निफास प्रसवपछि हुन्छ, र इस्तिहाजाले चक्रबाहिरको अनियमित रक्तस्रावलाई जनाउँछ। हरेकले फरक हैसियत पछ्याउँछ।',
      ],
      [
        'महिनावारीको समयमा नमाजको के हुन्छ?',
        'यस समयमा नमाज स्थगित हुन्छ: यो एउटा मान्यता प्राप्त छुट हो, जसलाई अपराधबोधबिना अनुभव गर्नुपर्छ।',
      ],
      [
        'महिनावारीको समयमा रोजाको के हुन्छ?',
        'रोजा पनि स्थगित हुन्छ; नराखिएका दिनहरू पछि (कजा), रमजानबाहिर, कजा गरिन्छन्।',
      ],
      [
        'रोजाको विपरीत, छुटेका नमाज सामान्यतया किन कजा गरिँदैनन्?',
        'यो भिन्नता दुई कार्यको प्रकृतिका कारण हो: नमाज दैनिक र दोहोरिने हो, जबकि रोजा वार्षिक हो र एउटा महिनामा केन्द्रित हुन्छ। छुटलाई पछ्याउनु धार्मिक अभ्यासको पूर्ण हिस्सा हो।',
      ],
      [
        'महिनावारीपछि नमाज कहिले फेरि सुरु हुन्छ?',
        'महिनावारी सकिएर गुस्ल गरिसकेपछि, नमाज ढिलाइबिना सामान्य रूपमा फेरि सुरु हुन्छ।',
      ],
      [
        'गुस्लको भूमिका के हो?',
        'गुस्ल ठूलो वुजु हो जसले नमाज र अन्य इबादतका कार्यहरू फेरि सुरु गर्न आवश्यक अनुष्ठानिक पवित्रताको अवस्थामा फर्कन दिन्छ।',
      ],
      [
        'महिनावारी सकियो कि भन्नेमा पक्का नभए के गर्ने?',
        'एक पटकको धारणामा भर पर्नुभन्दा पर्याप्त समयसम्म रक्तस्रावको पूर्ण अनुपस्थिति अवलोकन गर्नाले अवस्था स्पष्ट पार्न मद्दत गर्छ।',
      ],
      [
        'महिनावारीको समयमा इबादतका अन्य रूपहरू गर्न सकिन्छ?',
        'सकिन्छ: जिक्र, दुआ, दान, धार्मिक सिकाइ र दयालुताका अन्य कार्यहरू पहुँचयोग्य रहन्छन्।',
      ],
      [
        'केही उत्तरहरू अवस्थाअनुसार किन फरक हुन सक्छन्?',
        'फिक्ह व्याख्याको क्षेत्र हो: कुनै एक रायलाई आफैँमा निरपेक्ष नमानी, फिक्हको विचारधारा र व्यक्तिगत परिस्थितिअनुसार रायहरू फरक हुन सक्छन्।',
      ],
    ],
    section2Body1: 'इस्लामी फिक्हमा केही विवरणका विषयमा व्याख्याका मान्यता प्राप्त भिन्नताहरू छन्। यी भिन्नताहरू शताब्दीयौँदेखि अस्तित्वमा छन् र धार्मिक परम्पराभित्र जायज मानिन्छन्।',
    section2Body2: 'परामर्श गरिएको स्रोतअनुसार, एउटै प्रश्नले त्यसैले अलिकति फरक उत्तर पाउन सक्छ। यसको अर्थ कुनै उत्तर स्वतः गलत हुन्छ भन्ने होइन: यसले उही स्रोतहरूका फरक पद्धति र पठनलाई प्रतिबिम्बित गर्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'भेटिएको जुनसुकै उत्तरका आधारमा निरन्तर राय बदल्नुको सट्टा एउटा योग्य स्रोतलाई निरन्तर पछ्याउनाले तपाईंको अभ्यास स्पष्ट र शान्त राख्न मद्दत गर्छ।',
    section3Body: 'केही अवस्थाहरू एउटै सामान्य व्याख्याका आधारमा समाधान गर्न गाह्रो रहन्छन्। यो विशेष गरी तब हुन्छ जब:',
    doubtSituations: [
      'महिनावारी वास्तवमै कहिले सकियो भन्नेमा अनिश्चितता हुन्छ',
      'रक्तस्रावको प्रकृति अनिश्चित रहन्छ (महिनावारी, इस्तिहाजा, अन्य)',
      'गुस्ल गर्नुपर्ने आवश्यकताबारे शङ्का रहिरहन्छ',
      'नमाज फेरि सुरु गर्ने प्रश्न अनिश्चित रहन्छ',
      'अनलाइन विरोधाभासी जानकारी भेटिएको छ',
    ],
    alert2Title: 'महत्त्वपूर्ण जानकारी',
    alert2Text: 'कुनै अवस्था व्यक्तिगत, जटिल वा लगातार हुँदा, यसलाई सामान्य जानकारीले समाधान गर्न सकिँदैन। तपाईंको विशेष अवस्थालाई ध्यानमा राख्न सक्ने योग्य विद्वानतर्फ जानु त्यस अवस्थामा उत्तम दृष्टिकोण रहन्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    keyPoints: [
      'महिलाको फिक्हले महिलाको धार्मिक अभ्यासका धेरै पक्ष समेट्छ',
      'केही विवरणहरू फिक्हको विचारधाराअनुसार जायज रूपमा फरक हुन सक्छन्',
      'सामान्य जानकारीले व्यक्तिगत धार्मिक मार्गदर्शनको स्थान लिँदैन',
      'लगातार शङ्का योग्य विद्वानसँग उठाउन लायक छ',
      'AWA को भूमिका शैक्षिक हो, फतवा जारी गर्ने होइन',
    ],
    shareMessage: 'महिलाको फिक्हबारे बारम्बार सोधिने प्रश्नहरू — AWA',
  },
  si: {
    badge: 'නිතර අසන ප්‍රශ්න',
    title: 'කාන්තා ෆික්හ් පිළිබඳ\nනිතර අසන ප්‍රශ්න',
    metaDuration: 'කියවීමට මිනිත්තු 8',
    metaType: 'නිති අසන ප්‍රශ්න',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'කාන්තා ෆික්හ් පිළිබඳ වඩාත්ම පොදු ප්‍රශ්න, පැහැදිලි පිළිතුරු සහිතව එක් තැනක එක්රැස් කර ඇත.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'නිතර මතුවන ප්‍රශ්න',
      'වෙනස් විය හැකි නීති චින්තන ධාරා',
      'දිගටම පවතින සැකයකදී',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'චක්‍රය, සලාත් සහ උපවාසය පිළිබඳ බොහෝ ප්‍රශ්න එක් කාන්තාවකගෙන් තවත් කාන්තාවකට නිතිපතා මතු වේ. වඩාත්ම නිතර ඇසෙන ප්‍රශ්නවලට සාමාන්‍ය පිළිතුරු මෙන්න; තව දුරටත් යාමට, සෑම මාතෘකාවක්ම එහිම කැපවූ ලිපියක වඩාත් ගැඹුරින්ද ආවරණය කෙරේ.',
    faqItems: [
      [
        'කාන්තා ෆික්හ් යනු කුමක්ද?',
        'කාන්තා ෆික්හ් විශේෂයෙන් කාන්තාවන්ගේ ශරීරයට සහ නමස්කාරයට අදාළ ප්‍රායෝගික රීති එකට ගෙන එයි: චක්‍රය, පාරිශුද්ධ බව, සලාත්, උපවාසය, නිෆාස් සහ ඉස්තිහාදා.',
      ],
      [
        'කාන්තා ෆික්හ් විසින් ආවරණය කරන ප්‍රධාන මාතෘකා මොනවාද?',
        'එය විශේෂයෙන් ඔසප් සහ චක්‍රය, ආචාරික පාරිශුද්ධ බව, ගුස්ල්, ඔසප් කාලයේදී සහ ඉන් පසු සලාත් සහ උපවාසය, නිෆාස් සහ ඉස්තිහාදා ආවරණය කරයි.',
      ],
      [
        'ඔසප්, ප්‍රසූතියෙන් පසු ලේ ගැලීම සහ අක්‍රමවත් ලේ ගැලීම අතර වෙනස කුමක්ද?',
        'ඔසප් (හයිද්) සුපුරුදු චක්‍රය අනුගමනය කරයි, නිෆාස් ප්‍රසූතියෙන් පසු සිදුවේ, සහ ඉස්තිහාදා යනු චක්‍රයෙන් පිටත අක්‍රමවත් ලේ ගැලීමයි. සෑම එකක්ම වෙනස් තත්ත්වයක් අනුගමනය කරයි.',
      ],
      [
        'ඔසප් කාලයේදී සලාත්වලට කුමක් සිදුවේද?',
        'මෙම කාලය තුළ සලාත් අත්හිටුවනු ලැබේ: එය වරදකාරී හැඟීමකින් තොරව අත්විඳිය යුතු පිළිගත් නිදහස් කිරීමකි.',
      ],
      [
        'ඔසප් කාලයේදී උපවාසයට කුමක් සිදුවේද?',
        'උපවාසයද අත්හිටුවනු ලැබේ; උපවාසය නොකළ දින රමළාන් පිටත, පසුව පිරිමැසෙයි (කදා).',
      ],
      [
        'උපවාසයට වෙනස්ව, මග හැරුණු සලාත් සාමාන්‍යයෙන් පිරිමැසෙන්නේ නැත්තේ ඇයි?',
        'මෙම වෙනස ක්‍රියා දෙකේ ස්වභාවය නිසා වේ: සලාත් දෛනික සහ පුනරාවර්තන වන අතර, උපවාසය වාර්ෂික වන අතර එක් මාසයක් තුළ සංකේන්ද්‍රණය වේ. නිදහස් කිරීම අනුගමනය කිරීම සම්පූර්ණයෙන්ම ආගමික පුරුද්දේ කොටසකි.',
      ],
      [
        'ඔසප්වලින් පසු සලාත් නැවත ආරම්භ වන්නේ කවදාද?',
        'ඔසප් අවසන් වී ගුස්ල් ඉටු කළ විගස, සලාත් ප්‍රමාදයකින් තොරව සාමාන්‍ය ලෙස නැවත ආරම්භ වේ.',
      ],
      [
        'ගුස්ල්හි කාර්යභාරය කුමක්ද?',
        'ගුස්ල් යනු සලාත් සහ වෙනත් නමස්කාර ක්‍රියා නැවත ආරම්භ කිරීමට අවශ්‍ය ආචාරික පාරිශුද්ධ තත්ත්වයට නැවත පැමිණීමට ඉඩ සලසන ප්‍රධාන වුළූවයි.',
      ],
      [
        'ඔසප් අවසන් වී ඇතැයි ඔබට විශ්වාස නැති විට කුමක් කළ යුතුද?',
        'එක් අවස්ථාවක හැඟීමක් මත විශ්වාසය තැබීමට වඩා, ප්‍රමාණවත් කාලයක් සඳහා ලේ ගැලීම සම්පූර්ණයෙන්ම නොමැති බව නිරීක්ෂණය කිරීම තත්ත්වය පැහැදිලි කිරීමට උපකාරී වේ.',
      ],
      [
        'ඔසප් කාලයේදී වෙනත් නමස්කාර ආකාර ඉටු කළ හැකිද?',
        'ඔව්: ධික්ර්, ප්‍රාර්ථනා, දානය, ආගමික ඉගෙනීම සහ වෙනත් කරුණාවන්ත ක්‍රියා තවමත් ප්‍රවේශ්‍ය ලෙස පවතී.',
      ],
      [
        'සමහර පිළිතුරු තත්ත්වය අනුව වෙනස් විය හැක්කේ ඇයි?',
        'ෆික්හ් යනු අර්ථකථන ක්ෂේත්‍රයකි: මත නීති චින්තන ධාරාව සහ පෞද්ගලික තත්ත්වයන් අනුව වෙනස් විය හැකි අතර, එක් මතයක්වත් තනිවම නිරපේක්ෂ නොවේ.',
      ],
    ],
    section2Body1: 'ඉස්ලාමීය ෆික්හ් විස්තරවල සමහර කරුණු පිළිබඳ පිළිගත් අර්ථකථන වෙනස්කම් ඇතුළත් වේ. මෙම වෙනස්කම් සියවස් ගණනාවක් තිස්සේ පැවතෙන අතර ආගමික සම්ප්‍රදාය තුළ නීත්‍යානුකූල ලෙස සැලකේ.',
    section2Body2: 'විමසන මූලාශ්‍රය අනුව, එබැවින් එකම ප්‍රශ්නයට තරමක් වෙනස් පිළිතුරු ලැබිය හැක. එයින් පිළිතුරක් ස්වයංක්‍රීයව වැරදි වන බව අදහස් නොවේ: එය එකම මූලාශ්‍රවල වෙනස් ක්‍රමවේද සහ කියවීම් පිළිබිඹු කරයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'හමුවන ඕනෑම පිළිතුරක් මත පදනම්ව නිරන්තරයෙන් මතය වෙනස් කරනවාට වඩා, සුදුසුකම් ලත් මූලාශ්‍රයක් ස්ථාවරව අනුගමනය කිරීම ඔබේ පුරුද්ද පැහැදිලිව සහ සන්සුන්ව තබාගැනීමට උපකාරී වේ.',
    section3Body: 'සමහර තත්ත්වයන් තනි සාමාන්‍ය පැහැදිලි කිරීමක් මත පදනම්ව විසඳීමට අපහසුව පවතී. මෙය විශේෂයෙන් මෙවැනි විට සත්‍යයි:',
    doubtSituations: [
      'ඔසප් සැබවින්ම අවසන් වූයේ කවදාදැයි අවිනිශ්චිතභාවයක් ඇත',
      'ලේ ගැලීමේ ස්වභාවය අවිනිශ්චිතව පවතී (ඔසප්, ඉස්තිහාදා, වෙනත්)',
      'ගුස්ල් ඉටු කිරීමේ අවශ්‍යතාව පිළිබඳ සැකය දිගටම පවතී',
      'සලාත් නැවත ආරම්භ කිරීමේ ප්‍රශ්නය අවිනිශ්චිතව පවතී',
      'අන්තර්ජාලයේ පරස්පර විරෝධී තොරතුරු හමුවී ඇත',
    ],
    alert2Title: 'වැදගත් තොරතුරු',
    alert2Text: 'තත්ත්වයක් පෞද්ගලික, සංකීර්ණ හෝ දිගටම පවතින විට, එය සාමාන්‍ය තොරතුරු සමඟ විසඳිය නොහැක. ඔබේ නිශ්චිත තත්ත්වය සැලකිල්ලට ගත හැකි සුදුසුකම් ලත් විද්වතෙකු වෙත යොමු වීම එම අවස්ථාවේ හොඳම ප්‍රවේශය ලෙස පවතී. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    keyPoints: [
      'කාන්තා ෆික්හ් කාන්තාවන්ගේ ආගමික පුරුදුවල බොහෝ අංග ආවරණය කරයි',
      'සමහර විස්තර නීති චින්තන ධාරාව අනුව නීත්‍යානුකූලව වෙනස් විය හැක',
      'සාමාන්‍ය තොරතුරු පුද්ගලීකරණය කළ ආගමික මඟපෙන්වීම වෙනුවට නොපවතී',
      'දිගටම පවතින සැකයක් සුදුසුකම් ලත් විද්වතෙකු සමඟ මතු කිරීමට සුදුසුයි',
      'AWA හි කාර්යභාරය අධ්‍යාපනික වන අතර, ෆත්වා නිකුත් කිරීම නොවේ',
    ],
    shareMessage: 'කාන්තා ෆික්හ් පිළිබඳ නිතර අසන ප්‍රශ්න — AWA',
  },
  th: {
    badge: 'คำถามที่พบบ่อย',
    title: 'คำถามที่พบบ่อย\nเกี่ยวกับฟิกฮ์สำหรับสตรี',
    metaDuration: 'อ่าน 8 นาที',
    metaType: 'คำถามที่พบบ่อย',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'คำถามที่พบบ่อยที่สุดเกี่ยวกับฟิกฮ์สำหรับสตรี รวบรวมไว้ในที่เดียวพร้อมคำตอบที่ชัดเจน',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'คำถามที่เกิดขึ้นบ่อย',
      'สำนักนิติศาสตร์ที่อาจต่างกัน',
      'ในกรณีสงสัยต่อเนื่อง',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'คำถามมากมายเกี่ยวกับรอบเดือน การละหมาด และการถือศีลอดเกิดขึ้นเป็นประจำจากผู้หญิงคนหนึ่งไปอีกคนหนึ่ง นี่คือคำตอบทั่วไปสำหรับคำถามที่พบบ่อยที่สุด หากต้องการเจาะลึก แต่ละหัวข้อยังครอบคลุมอย่างละเอียดในบทความเฉพาะของตัวเอง',
    faqItems: [
      [
        'ฟิกฮ์สำหรับสตรีคืออะไร?',
        'ฟิกฮ์สำหรับสตรีรวบรวมกฎเชิงปฏิบัติที่เกี่ยวกับร่างกายและการประกอบศาสนกิจของสตรีโดยเฉพาะ: รอบเดือน ความสะอาด การละหมาด การถือศีลอด นิฟาส และอิสติฮาเฎาะฮ์',
      ],
      [
        'หัวข้อหลักที่ฟิกฮ์สำหรับสตรีครอบคลุมมีอะไรบ้าง?',
        'ครอบคลุมโดยเฉพาะประจำเดือนและรอบเดือน ความสะอาดตามพิธีกรรม ฆุสล์ การละหมาดและการถือศีลอดระหว่างและหลังมีประจำเดือน นิฟาส และอิสติฮาเฎาะฮ์',
      ],
      [
        'ประจำเดือน เลือดหลังคลอด และเลือดที่ออกผิดปกติต่างกันอย่างไร?',
        'ประจำเดือน (หัยฎ์) ตามรอบเดือนปกติ นิฟาสเกิดหลังคลอด และอิสติฮาเฎาะฮ์หมายถึงเลือดที่ออกผิดปกตินอกรอบเดือน แต่ละอย่างมีสถานะต่างกัน',
      ],
      [
        'การละหมาดเป็นอย่างไรระหว่างมีประจำเดือน?',
        'การละหมาดถูกระงับในช่วงนี้: เป็นการยกเว้นที่ได้รับการยอมรับ ควรเผชิญโดยไม่รู้สึกผิด',
      ],
      [
        'การถือศีลอดเป็นอย่างไรระหว่างมีประจำเดือน?',
        'การถือศีลอดก็ถูกระงับเช่นกัน วันที่ไม่ได้ถือศีลอดชดเชยภายหลัง (กอฎาอ์) นอกเดือนรอมฎอน',
      ],
      [
        'ทำไมการละหมาดที่พลาดโดยทั่วไปจึงไม่ต้องชดเชย ต่างจากการถือศีลอด?',
        'ความแตกต่างนี้มาจากลักษณะของศาสนกิจทั้งสอง: การละหมาดเป็นประจำวันและทำซ้ำ ขณะที่การถือศีลอดเป็นรายปีและเน้นในเดือนเดียว การปฏิบัติตามการยกเว้นเป็นส่วนหนึ่งของการปฏิบัติศาสนกิจอย่างสมบูรณ์',
      ],
      [
        'การละหมาดกลับมาเมื่อไรหลังมีประจำเดือน?',
        'ทันทีที่ประจำเดือนสิ้นสุดและทำฆุสล์แล้ว การละหมาดกลับมาตามปกติ โดยไม่ล่าช้า',
      ],
      [
        'ฆุสล์มีบทบาทอะไร?',
        'ฆุสล์คือการอาบน้ำชำระใหญ่ที่ทำให้กลับสู่สภาวะความสะอาดตามพิธีกรรมที่จำเป็นเพื่อกลับมาละหมาดและประกอบศาสนกิจอื่น',
      ],
      [
        'ควรทำอย่างไรหากไม่แน่ใจว่าประจำเดือนสิ้นสุดแล้ว?',
        'การสังเกตการไม่มีเลือดเลยโดยสิ้นเชิงเป็นเวลาพอสมควร แทนที่จะอาศัยความรู้สึกชั่วขณะ ช่วยทำให้สถานการณ์ชัดเจน',
      ],
      [
        'ปฏิบัติศาสนกิจรูปแบบอื่นระหว่างมีประจำเดือนได้หรือไม่?',
        'ได้: ซิกร์ การวิงวอน การบริจาคทาน การเรียนรู้ทางศาสนา และการกระทำที่ดีงามอื่น ๆ ยังเข้าถึงได้',
      ],
      [
        'ทำไมคำตอบบางอย่างจึงต่างกันตามสถานการณ์?',
        'ฟิกฮ์เป็นสาขาของการตีความ: ความเห็นอาจต่างกันตามสำนักนิติศาสตร์และสถานการณ์ส่วนตัว โดยไม่มีความเห็นใดเป็นสัมบูรณ์ด้วยตัวเอง',
      ],
    ],
    section2Body1: 'ฟิกฮ์อิสลามมีความแตกต่างในการตีความที่ได้รับการยอมรับในรายละเอียดบางประเด็น ความแตกต่างเหล่านี้มีมานานหลายศตวรรษและถือว่าชอบธรรมภายในประเพณีทางศาสนา',
    section2Body2: 'ตามแหล่งที่ปรึกษา คำถามเดียวกันจึงอาจได้คำตอบที่ต่างกันเล็กน้อย ไม่ได้หมายความว่าคำตอบหนึ่งจะผิดโดยอัตโนมัติ: สะท้อนระเบียบวิธีและการอ่านแหล่งอ้างอิงเดียวกันที่ต่างกัน',
    tip1Title: 'ควรรู้',
    tip1Text: 'การปฏิบัติตามแหล่งที่มีคุณวุฒิอย่างสม่ำเสมอ แทนที่จะเปลี่ยนความเห็นไปเรื่อย ๆ ตามคำตอบที่พบ ช่วยให้การปฏิบัติของคุณชัดเจนและสงบ',
    section3Body: 'บางสถานการณ์ยังตัดสินได้ยากจากคำอธิบายทั่วไปเพียงอย่างเดียว โดยเฉพาะเมื่อ:',
    doubtSituations: [
      'ไม่แน่ใจว่าประจำเดือนสิ้นสุดจริงเมื่อไร',
      'ลักษณะของเลือดที่ออกยังไม่แน่ใจ (ประจำเดือน อิสติฮาเฎาะฮ์ อื่น ๆ)',
      'ยังสงสัยว่าจำเป็นต้องทำฆุสล์หรือไม่',
      'คำถามเรื่องการกลับมาละหมาดยังไม่แน่ใจ',
      'พบข้อมูลที่ขัดแย้งกันทางออนไลน์',
    ],
    alert2Title: 'ข้อมูลสำคัญ',
    alert2Text: 'เมื่อสถานการณ์เป็นเรื่องส่วนตัว ซับซ้อน หรือต่อเนื่อง ไม่สามารถแก้ด้วยข้อมูลทั่วไปได้ การหันไปหาผู้รู้ที่มีคุณวุฒิ ซึ่งคำนึงถึงสถานการณ์เฉพาะของคุณได้ ยังคงเป็นแนวทางที่ดีที่สุดในกรณีนั้น AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    keyPoints: [
      'ฟิกฮ์สำหรับสตรีครอบคลุมหลายด้านของการปฏิบัติศาสนกิจของสตรี',
      'รายละเอียดบางอย่างอาจแตกต่างกันอย่างชอบธรรมตามสำนักนิติศาสตร์',
      'ข้อมูลทั่วไปไม่ได้ทดแทนคำแนะนำทางศาสนาเฉพาะบุคคล',
      'ความสงสัยที่ต่อเนื่องสมควรนำไปปรึกษาผู้รู้ที่มีคุณวุฒิ',
      'บทบาทของ AWA คือเพื่อการเรียนรู้ ไม่ใช่การออกฟัตวา',
    ],
    shareMessage: 'คำถามที่พบบ่อยเกี่ยวกับฟิกฮ์สำหรับสตรี — AWA',
  },
  vi: {
    badge: 'CÂU HỎI THƯỜNG GẶP',
    title: 'Câu hỏi thường gặp\nvề fiqh dành cho phụ nữ',
    metaDuration: '8 phút đọc',
    metaType: 'Câu hỏi thường gặp',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Những câu hỏi phổ biến nhất về fiqh dành cho phụ nữ, được tập hợp ở một nơi với câu trả lời rõ ràng.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Những câu hỏi thường xuất hiện',
      'Các trường phái luật học có thể khác nhau',
      'Trong trường hợp nghi ngờ kéo dài',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Nhiều câu hỏi về chu kỳ, cầu nguyện và nhịn ăn thường xuyên xuất hiện ở các phụ nữ. Sau đây là những câu trả lời chung cho những câu hỏi thường gặp nhất; để tìm hiểu sâu hơn, mỗi chủ đề cũng được trình bày chi tiết hơn trong bài viết riêng.',
    faqItems: [
      [
        'Fiqh dành cho phụ nữ là gì?',
        'Fiqh dành cho phụ nữ tập hợp các quy định thực tế liên quan riêng đến cơ thể và việc thờ phượng của phụ nữ: chu kỳ, sự thanh sạch, cầu nguyện, nhịn ăn, nifas và istihâda.',
      ],
      [
        'Fiqh dành cho phụ nữ bao gồm những chủ đề chính nào?',
        'Nó bao gồm đặc biệt kinh nguyệt và chu kỳ, sự thanh sạch nghi lễ, ghusl, cầu nguyện và nhịn ăn trong và sau kỳ kinh, nifas và istihâda.',
      ],
      [
        'Sự khác biệt giữa kinh nguyệt, ra máu sau sinh và ra máu bất thường là gì?',
        'Kinh nguyệt (hayd) theo chu kỳ thông thường, nifas xảy ra sau khi sinh, và istihâda chỉ việc ra máu bất thường, ngoài chu kỳ. Mỗi loại theo một tình trạng khác nhau.',
      ],
      [
        'Việc cầu nguyện thế nào trong kỳ kinh?',
        'Cầu nguyện được tạm ngưng trong thời gian này: đây là một sự miễn trừ được công nhận, cần được trải qua mà không mặc cảm.',
      ],
      [
        'Việc nhịn ăn thế nào trong kỳ kinh?',
        'Nhịn ăn cũng được tạm ngưng; những ngày không nhịn sẽ được bù lại sau (qadaa), ngoài tháng Ramadan.',
      ],
      [
        'Tại sao những buổi cầu nguyện bỏ lỡ nhìn chung không được bù lại, khác với nhịn ăn?',
        'Sự khác biệt này do bản chất của hai hành vi: cầu nguyện diễn ra hằng ngày và lặp lại, trong khi nhịn ăn diễn ra hằng năm và tập trung trong một tháng. Tuân theo sự miễn trừ là một phần trọn vẹn của thực hành tôn giáo.',
      ],
      [
        'Khi nào cầu nguyện tiếp tục sau kỳ kinh?',
        'Ngay khi kỳ kinh kết thúc và đã thực hiện ghusl, việc cầu nguyện tiếp tục bình thường, không chậm trễ.',
      ],
      [
        'Vai trò của ghusl là gì?',
        'Ghusl là nghi thức tắm gội lớn cho phép trở lại trạng thái thanh sạch nghi lễ cần thiết để tiếp tục cầu nguyện và các hành vi thờ phượng khác.',
      ],
      [
        'Nên làm gì nếu bạn không chắc kỳ kinh đã kết thúc?',
        'Quan sát việc hoàn toàn không còn ra máu trong một khoảng thời gian đủ, thay vì dựa vào một ấn tượng nhất thời, giúp làm rõ tình hình.',
      ],
      [
        'Có thể thực hành các hình thức thờ phượng khác trong kỳ kinh không?',
        'Có: dhikr, những lời cầu xin, từ thiện, học hỏi về tôn giáo và những hành động tử tế khác vẫn có thể thực hiện.',
      ],
      [
        'Tại sao một số câu trả lời có thể khác nhau tùy tình huống?',
        'Fiqh là một lĩnh vực diễn giải: các ý kiến có thể khác nhau tùy theo trường phái luật học và hoàn cảnh cá nhân, mà không có ý kiến nào là tuyệt đối tự thân.',
      ],
    ],
    section2Body1: 'Fiqh Hồi giáo bao gồm những khác biệt diễn giải được công nhận ở một số điểm chi tiết. Những khác biệt này đã tồn tại hàng thế kỷ và được coi là chính đáng trong truyền thống tôn giáo.',
    section2Body2: 'Tùy theo nguồn được tham khảo, cùng một câu hỏi vì vậy có thể nhận được những câu trả lời hơi khác nhau. Điều này không có nghĩa là một câu trả lời tự động là sai: nó phản ánh các phương pháp luận và cách đọc khác nhau của cùng những nguồn.',
    tip1Title: 'Nên biết',
    tip1Text: 'Luôn theo một nguồn có chuyên môn, thay vì liên tục đổi ý kiến theo bất cứ câu trả lời nào tìm được, giúp thực hành của bạn rõ ràng và bình thản.',
    section3Body: 'Một số tình huống vẫn khó giải quyết chỉ dựa trên một lời giải thích chung. Điều này đặc biệt đúng khi:',
    doubtSituations: [
      'Không chắc kỳ kinh thực sự đã kết thúc khi nào',
      'Bản chất của việc ra máu vẫn chưa rõ (kinh nguyệt, istihâda, khác)',
      'Còn nghi ngờ về việc có cần thực hiện ghusl không',
      'Câu hỏi về việc tiếp tục cầu nguyện vẫn chưa rõ',
      'Đã tìm thấy thông tin mâu thuẫn trên mạng',
    ],
    alert2Title: 'Thông tin quan trọng',
    alert2Text: 'Khi một tình huống mang tính cá nhân, phức tạp hoặc kéo dài, nó không thể được giải quyết bằng thông tin chung. Tìm đến một học giả có thẩm quyền, người có thể cân nhắc tình huống cụ thể của bạn, vẫn là cách tiếp cận tốt nhất trong trường hợp đó. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    keyPoints: [
      'Fiqh dành cho phụ nữ bao gồm nhiều khía cạnh của thực hành tôn giáo của phụ nữ',
      'Một số chi tiết có thể khác nhau một cách chính đáng tùy theo trường phái luật học',
      'Thông tin chung không thay thế sự hướng dẫn tôn giáo cá nhân hóa',
      'Một nghi ngờ kéo dài đáng được nêu với một học giả có thẩm quyền',
      'Vai trò của AWA là giáo dục, không phải đưa ra fatwa',
    ],
    shareMessage: 'Câu hỏi thường gặp về fiqh dành cho phụ nữ — AWA',
  },
  uz: {
    badge: 'KOʻP BERILADIGAN SAVOLLAR',
    title: 'Ayollar fiqhi boʻyicha\nkoʻp beriladigan savollar',
    metaDuration: '8 daq oʻqish',
    metaType: 'Savol-javob',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Ayollar fiqhi boʻyicha eng keng tarqalgan savollar, aniq javoblar bilan bir joyda toʻplangan.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Tez-tez tugʻiladigan savollar',
      'Farq qilishi mumkin boʻlgan fiqhiy maktablar',
      'Doimiy shubha boʻlsa',
      'Asosiy xulosalar',
    ],
    section1Body: 'Sikl, namoz va roʻza haqidagi koʻp savollar ayoldan ayolga muntazam tugʻiladi. Mana eng tez-tez uchraydiganlariga umumiy javoblar; batafsil bilish uchun har bir mavzu oʻzining maxsus maqolasida ham chuqurroq yoritilgan.',
    faqItems: [
      [
        'Ayollar fiqhi nima?',
        'Ayollar fiqhi ayollar tanasi va ibodatiga xos amaliy qoidalarni birlashtiradi: sikl, poklik, namoz, roʻza, nifos va istihoza.',
      ],
      [
        'Ayollar fiqhi qamrab oladigan asosiy mavzular qanday?',
        'U, xususan, hayz va sikl, ritual poklik, gʻusl, hayz paytida va undan keyin namoz va roʻza, nifos va istihozani qamrab oladi.',
      ],
      [
        'Hayz, tugʻruqdan keyingi qon ketishi va notekis qon ketishi oʻrtasida qanday farq bor?',
        'Hayz (haydʻ) odatiy sikldan keyin keladi, nifos tugʻruqdan keyin sodir boʻladi, istihoza esa sikldan tashqari notekis qon ketishini bildiradi. Har biri turli holatga amal qiladi.',
      ],
      [
        'Hayz paytida namozga nima boʻladi?',
        'Namoz bu vaqtda toʻxtatiladi: bu tan olingan ozodlik, uni aybdorlik hissisiz boshdan kechirish kerak.',
      ],
      [
        'Hayz paytida roʻzaga nima boʻladi?',
        'Roʻza ham toʻxtatiladi; tutilmagan kunlar keyinroq, Ramazondan tashqarida, qazo qilinadi.',
      ],
      [
        'Nima uchun oʻtkazib yuborilgan namozlar, roʻzadan farqli ravishda, odatda qazo qilinmaydi?',
        'Bu farq ikki ibodatning tabiatiga bogʻliq: namoz kundalik va takrorlanuvchi, roʻza esa yillik va bir oyga jamlangan. Ozodlikka amal qilish diniy amaliyotning toʻliq bir qismi.',
      ],
      [
        'Hayzdan keyin namoz qachon davom etadi?',
        'Hayz tugagan va gʻusl qilingan zahoti, namoz kechikishsiz odatdagidek davom etadi.',
      ],
      [
        'Gʻuslning roli nima?',
        'Gʻusl — namoz va boshqa ibodatlarni davom ettirish uchun zarur boʻlgan ritual poklik holatiga qaytish imkonini beruvchi katta tahorat.',
      ],
      [
        'Hayz tugaganiga ishonchingiz komil boʻlmasa nima qilish kerak?',
        'Bir martalik taassurotga tayanish oʻrniga, yetarli vaqt davomida qon ketishining toʻliq yoʻqligini kuzatish vaziyatni aniqlashtirishga yordam beradi.',
      ],
      [
        'Hayz paytida boshqa ibodat turlarini bajarish mumkinmi?',
        'Ha: zikr, duolar, sadaqa, diniy ilm olish va boshqa yaxshilik amallari mumkin boʻlib qoladi.',
      ],
      [
        'Nima uchun baʼzi javoblar vaziyatga qarab farq qilishi mumkin?',
        'Fiqh — talqin sohasi: fikrlar fiqhiy maktabga va shaxsiy holatlarga qarab farq qilishi mumkin, birorta fikr yakka oʻzi mutlaq emas.',
      ],
    ],
    section2Body1: 'Islom fiqhi baʼzi tafsilot masalalarida tan olingan talqin farqlarini oʻz ichiga oladi. Bu farqlar asrlar davomida mavjud boʻlgan va diniy anʼana doirasida qonuniy hisoblanadi.',
    section2Body2: 'Murojaat qilingan manbaga qarab, bir xil savol biroz boshqacha javob olishi mumkin. Bu javob avtomatik ravishda notoʻgʻri degani emas: u bir xil manbalarning turli metodologiyalari va oʻqishlarini aks ettiradi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Topilgan har qanday javobga qarab fikrni doimiy oʻzgartirish oʻrniga, malakali manbaga izchil amal qilish amaliyotingizni aniq va xotirjam saqlashga yordam beradi.',
    section3Body: 'Baʼzi vaziyatlarni yakka umumiy tushuntirish asosida hal qilish qiyin boʻlib qoladi. Bu, ayniqsa, quyidagi hollarda:',
    doubtSituations: [
      'Hayz haqiqatan qachon tugaganiga noaniqlik bor',
      'Qon ketishining xususiyati noaniq (hayz, istihoza, boshqa)',
      'Gʻusl qilish zarurati haqida shubha saqlanib qoladi',
      'Namozni qayta boshlash masalasi noaniq qoladi',
      'Internetda ziddiyatli maʼlumotlar topilgan',
    ],
    alert2Title: 'Muhim maʼlumot',
    alert2Text: 'Vaziyat shaxsiy, murakkab yoki doimiy boʻlsa, uni umumiy maʼlumot bilan hal qilib boʻlmaydi. Bunday holda sizning aniq vaziyatingizni hisobga ola oladigan malakali olimga murojaat qilish eng yaxshi yondashuv boʻlib qoladi. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    keyPoints: [
      'Ayollar fiqhi ayollar diniy amaliyotining koʻplab jihatlarini qamrab oladi',
      'Baʼzi tafsilotlar fiqhiy maktabga qarab qonuniy ravishda farq qilishi mumkin',
      'Umumiy maʼlumot shaxsiy diniy yoʻl-yoʻriqni almashtirmaydi',
      'Doimiy shubha malakali olim bilan muhokama qilinishga arziydi',
      'AWA ning roli taʼlimiy, fatvo chiqarish emas',
    ],
    shareMessage: 'Ayollar fiqhi boʻyicha koʻp beriladigan savollar — AWA',
  },
  az: {
    badge: 'TEZ-TEZ VERİLƏN SUALLAR',
    title: 'Qadın fiqhi üzrə tez-tez\nverilən suallar',
    metaDuration: '8 dəq oxu',
    metaType: 'FAQ',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Qadın fiqhi ilə bağlı ən çox verilən suallar, aydın cavablarla bir yerdə toplanıb.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Tez-tez yaranan suallar',
      'Dəyişə bilən hüquq məktəbləri',
      'Davamlı şübhə halında',
      'Əsas nəticələr',
    ],
    section1Body: 'Dövr, namaz və oruc haqqında bir çox sual qadından qadına müntəzəm yaranır. Budur ən tez-tez verilənlərə ümumi cavablar; daha dərindən öyrənmək üçün hər mövzu öz xüsusi məqaləsində də ətraflı işıqlandırılır.',
    faqItems: [
      [
        'Qadın fiqhi nədir?',
        'Qadın fiqhi qadın bədəni və ibadəti ilə xüsusilə bağlı praktik qaydaları birləşdirir: dövr, paklıq, namaz, oruc, nifas və istihaza.',
      ],
      [
        'Qadın fiqhində əhatə olunan əsas mövzular hansılardır?',
        'O, xüsusilə aybaşı və dövrü, ritual paklığı, qüslü, aybaşı zamanı və sonra namaz və orucu, nifası və istihazanı əhatə edir.',
      ],
      [
        'Aybaşı, doğuşdan sonrakı qanaxma və qeyri-müntəzəm qanaxma arasındakı fərq nədir?',
        'Aybaşı (heyz) adi dövrü izləyir, nifas doğuşdan sonra baş verir, istihaza isə dövrdən kənar qeyri-müntəzəm qanaxmaya deyilir. Hər biri fərqli statusa tabedir.',
      ],
      [
        'Aybaşı zamanı namaza nə olur?',
        'Namaz bu dövrdə dayandırılır: bu, günah hissi olmadan yaşanmalı tanınan azad olmadır.',
      ],
      [
        'Aybaşı zamanı oruca nə olur?',
        'Oruc da dayandırılır; tutulmayan günlər sonradan, Ramazandan kənarda qəza edilir.',
      ],
      [
        'Buraxılmış namazlar oructan fərqli olaraq nə üçün adətən qəza edilmir?',
        'Bu fərq iki ibadətin təbiəti ilə bağlıdır: namaz gündəlikdir və təkrarlanır, oruc isə illikdir və bir aya cəmlənib. Azad olmaya əməl etmək dini təcrübənin tam hissəsidir.',
      ],
      [
        'Aybaşıdan sonra namaz nə vaxt bərpa olunur?',
        'Aybaşı bitən və qüsl edilən kimi namaz gecikmədən normal bərpa olunur.',
      ],
      [
        'Qüslün rolu nədir?',
        'Qüsl namazı və digər ibadət aktlarını bərpa etmək üçün lazım olan ritual paklıq vəziyyətinə qayıtmağa imkan verən böyük dəstəmazdır.',
      ],
      [
        'Aybaşının bitdiyinə əmin deyilsinizsə, nə etmək lazımdır?',
        'Birdəfəlik təəssürata arxalanmaq əvəzinə kifayət qədər vaxt ərzində qanaxmanın tam olmamasını müşahidə etmək vəziyyəti aydınlaşdırmağa kömək edir.',
      ],
      [
        'Aybaşı zamanı ibadətin digər formaları ilə məşğul olmaq olarmı?',
        'Bəli: zikr, dualar, sədəqə, dini öyrənmə və digər xeyirxah əməllər əlçatan qalır.',
      ],
      [
        'Bəzi cavablar vəziyyətdən asılı olaraq nə üçün dəyişə bilər?',
        'Fiqh təfsir sahəsidir: fikirlər hüquq məktəbindən və şəxsi şəraitdən asılı olaraq dəyişə bilər, heç bir fikir tək başına mütləq deyil.',
      ],
    ],
    section2Body1: 'İslam fiqhi bəzi təfərrüat məsələlərində tanınan təfsir fərqlərini ehtiva edir. Bu fərqlər əsrlərdir mövcuddur və dini ənənə daxilində qanuni sayılır.',
    section2Body2: 'Müraciət edilən mənbədən asılı olaraq eyni suala bir qədər fərqli cavablar verilə bilər. Bu, cavabın avtomatik olaraq yanlış olduğu demək deyil: o, eyni mənbələrin fərqli metodologiyalarını və oxunuşlarını əks etdirir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Tapılan hər cavaba görə fikri daim dəyişmək əvəzinə səlahiyyətli mənbəyə ardıcıl əməl etmək təcrübənizi aydın və sakit saxlamağa kömək edir.',
    section3Body: 'Bəzi vəziyyətləri tək ümumi izahata əsasən həll etmək çətin qalır. Bu, xüsusilə aşağıdakı hallarda olur:',
    doubtSituations: [
      'Aybaşının həqiqətən nə vaxt bitdiyi barədə qeyri-müəyyənlik var',
      'Qanaxmanın xarakteri qeyri-müəyyən qalır (aybaşı, istihaza, digər)',
      'Qüsl etmək ehtiyacı ilə bağlı şübhə davam edir',
      'Namazın bərpası məsələsi qeyri-müəyyən qalır',
      'İnternetdə ziddiyyətli məlumat tapılıb',
    ],
    alert2Title: 'Vacib məlumat',
    alert2Text: 'Vəziyyət şəxsi, mürəkkəb və ya davamlı olduqda, onu ümumi məlumatla həll etmək olmaz. Konkret vəziyyətinizi nəzərə ala bilən səlahiyyətli alimə müraciət etmək bu halda ən yaxşı yanaşma olaraq qalır. AWA fətva və ya fərdi dini hökmlər vermir.',
    keyPoints: [
      'Qadın fiqhi qadınların dini təcrübəsinin bir çox aspektini əhatə edir',
      'Bəzi təfərrüatlar hüquq məktəbindən asılı olaraq qanuni şəkildə dəyişə bilər',
      'Ümumi məlumat fərdi dini istiqamətləndirməni əvəz etmir',
      'Davamlı şübhə səlahiyyətli alimlə müzakirə edilməyə layiqdir',
      'AWA-nın rolu təhsil xarakterlidir, fətva vermək deyil',
    ],
    shareMessage: 'Qadın fiqhi üzrə tez-tez verilən suallar — AWA',
  },
  ka: {
    badge: 'ხშირად დასმული კითხვები',
    title: 'ხშირად დასმული კითხვები\nქალთა ფიქჰის შესახებ',
    metaDuration: '8 წთ საკითხავი',
    metaType: 'ხშირი კითხვები',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ქალთა ფიქჰის შესახებ ყველაზე გავრცელებული კითხვები, ერთ ადგილას თავმოყრილი მკაფიო პასუხებით.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'კითხვები, რომლებიც ხშირად ჩნდება',
      'სამართლებრივი სკოლები, რომლებიც შეიძლება განსხვავდებოდეს',
      'გაგრძელებული ეჭვის შემთხვევაში',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ციკლის, ლოცვისა და მარხვის შესახებ ბევრი კითხვა რეგულარულად ჩნდება ერთი ქალიდან მეორესთან. აი, ზოგადი პასუხები ყველაზე ხშირ კითხვებზე; უფრო სიღრმისეულად გასაცნობად თითოეული თემა თავის სპეციალურ სტატიაშიც უფრო დაწვრილებით არის განხილული.',
    faqItems: [
      [
        'რა არის ქალთა ფიქჰი?',
        'ქალთა ფიქჰი აერთიანებს პრაქტიკულ წესებს, რომლებიც განსაკუთრებით ქალის სხეულსა და ღვთისმსახურებას ეხება: ციკლს, სისუფთავეს, ლოცვას, მარხვას, ნიფასსა და ისთიჰადას.',
      ],
      [
        'რა ძირითადი თემები შედის ქალთა ფიქჰში?',
        'ის მოიცავს განსაკუთრებით მენსტრუაციასა და ციკლს, რიტუალურ სისუფთავეს, ღუსლს, ლოცვასა და მარხვას მენსტრუაციის დროს და მის შემდეგ, ნიფასსა და ისთიჰადას.',
      ],
      [
        'რა განსხვავებაა მენსტრუაციას, მშობიარობის შემდგომ სისხლდენასა და არარეგულარულ სისხლდენას შორის?',
        'მენსტრუაცია (ჰაიდი) ჩვეულ ციკლს მისდევს, ნიფასი მშობიარობის შემდეგ ხდება, ისთიჰადა კი ციკლის გარეთ მიმდინარე არარეგულარულ სისხლდენას ნიშნავს. თითოეულს განსხვავებული სტატუსი აქვს.',
      ],
      [
        'რა ემართება ლოცვას მენსტრუაციის დროს?',
        'ლოცვა ამ დროს შეჩერებულია: ეს აღიარებული გათავისუფლებაა, რომელიც დანაშაულის გრძნობის გარეშე უნდა განიცადოთ.',
      ],
      [
        'რა ემართება მარხვას მენსტრუაციის დროს?',
        'მარხვაც შეჩერებულია; გამოტოვებული დღეები მოგვიანებით აინაზღაურება (კადაა), რამადანის გარეთ.',
      ],
      [
        'რატომ არ ანაზღაურდება გამოტოვებული ლოცვები ზოგადად, მარხვისგან განსხვავებით?',
        'ეს განსხვავება ორი აქტის ბუნებით აიხსნება: ლოცვა ყოველდღიური და განმეორებადია, მარხვა კი წლიურია და ერთ თვეზეა კონცენტრირებული. გათავისუფლების მიყოლა რელიგიური პრაქტიკის სრულფასოვანი ნაწილია.',
      ],
      [
        'როდის ახლდება ლოცვა მენსტრუაციის შემდეგ?',
        'როგორც კი მენსტრუაცია დასრულდა და ღუსლი შესრულდა, ლოცვა ნორმალურად ახლდება, დაგვიანების გარეშე.',
      ],
      [
        'რა არის ღუსლის როლი?',
        'ღუსლი დიდი აბდესტია, რომელიც საშუალებას იძლევა დავუბრუნდეთ რიტუალური სისუფთავის მდგომარეობას, რომელიც ლოცვისა და ღვთისმსახურების სხვა აქტების განახლებისთვის არის საჭირო.',
      ],
      [
        'რა გავაკეთოთ, თუ დარწმუნებული არ ვართ, რომ მენსტრუაცია დასრულდა?',
        'სისხლდენის სრული არარსებობის საკმარისი დროით დაკვირვება, ერთჯერად შთაბეჭდილებაზე დაყრდნობის ნაცვლად, სიტუაციის გარკვევაში გეხმარებათ.',
      ],
      [
        'შეიძლება თუ არა ღვთისმსახურების სხვა ფორმების პრაქტიკა მენსტრუაციის დროს?',
        'დიახ: ზიქრი, ლოცვითი თხოვნები, ქველმოქმედება, რელიგიური სწავლა და სიკეთის სხვა აქტები ხელმისაწვდომი რჩება.',
      ],
      [
        'რატომ შეიძლება ზოგი პასუხი სიტუაციის მიხედვით განსხვავდებოდეს?',
        'ფიქჰი ინტერპრეტაციის სფეროა: მოსაზრებები სამართლებრივი სკოლისა და პირადი გარემოებების მიხედვით შეიძლება განსხვავდებოდეს, ამასთან არცერთი მოსაზრება თავისთავად აბსოლუტური არ არის.',
      ],
    ],
    section2Body1: 'ისლამური ფიქჰი მოიცავს ინტერპრეტაციის აღიარებულ განსხვავებებს ზოგიერთ დეტალურ საკითხზე. ეს განსხვავებები საუკუნეებია არსებობს და რელიგიურ ტრადიციაში ლეგიტიმურად ითვლება.',
    section2Body2: 'გამოყენებული წყაროს მიხედვით, ერთსა და იმავე კითხვას ამიტომ შეიძლება ოდნავ განსხვავებული პასუხი მიეცეს. ეს არ ნიშნავს, რომ პასუხი ავტომატურად მცდარი იქნებოდა: ის ასახავს ერთი და იმავე წყაროების განსხვავებულ მეთოდოლოგიებსა და წაკითხვებს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'თანმიმდევრულად კვალიფიციური წყაროს მიყოლა, იმის ნაცვლად, რომ მუდმივად შეცვალოთ აზრი იმის მიხედვით, რა პასუხიც მოიძებნება, გეხმარებათ თქვენი პრაქტიკის მკაფიოდ და მშვიდად შენარჩუნებაში.',
    section3Body: 'ზოგი სიტუაციის გადაწყვეტა ერთი ზოგადი განმარტების საფუძველზე რთული რჩება. ეს განსაკუთრებით მაშინაა, როცა:',
    doubtSituations: [
      'გაურკვევლობაა იმაზე, როდის დასრულდა მენსტრუაცია ნამდვილად',
      'სისხლდენის ბუნება გაურკვეველი რჩება (მენსტრუაცია, ისთიჰადა, სხვა)',
      'ეჭვი რჩება ღუსლის შესრულების საჭიროებაზე',
      'ლოცვის განახლების საკითხი გაურკვეველი რჩება',
      'ინტერნეტში ურთიერთსაწინააღმდეგო ინფორმაცია მოიძებნა',
    ],
    alert2Title: 'მნიშვნელოვანი ინფორმაცია',
    alert2Text: 'როცა სიტუაცია პირადია, რთულია ან გრძელდება, ის ზოგადი ინფორმაციით ვერ გადაიჭრება. ამ შემთხვევაში საუკეთესო მიდგომად რჩება კვალიფიციურ მეცნიერთან მიმართვა, რომელსაც შეუძლია თქვენი კონკრეტული სიტუაციის გათვალისწინება. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    keyPoints: [
      'ქალთა ფიქჰი ქალთა რელიგიური პრაქტიკის ბევრ ასპექტს მოიცავს',
      'ზოგი დეტალი ლეგიტიმურად შეიძლება განსხვავდებოდეს სამართლებრივი სკოლის მიხედვით',
      'ზოგადი ინფორმაცია პერსონალიზებულ რელიგიურ მითითებას არ ანაცვლებს',
      'გაგრძელებული ეჭვი კვალიფიციურ მეცნიერთან განხილვას იმსახურებს',
      'AWA-ს როლი საგანმანათლებლოა და არა ფეტვების გაცემა',
    ],
    shareMessage: 'ხშირად დასმული კითხვები ქალთა ფიქჰის შესახებ — AWA',
  },
  hy: {
    badge: 'ՀԱՃԱԽԱԿԻ ՏՐՎՈՂ ՀԱՐՑԵՐ',
    title: 'Հաճախակի տրվող հարցեր\nկանանց ֆիքհի մասին',
    metaDuration: '8 ր կարդալու համար',
    metaType: 'ՀՏՀ',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Կանանց ֆիքհի մասին ամենատարածված հարցերը՝ մեկ տեղում, հստակ պատասխաններով:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հարցեր, որոնք հաճախ են առաջանում',
      'Իրավագիտական դպրոցներ, որոնք կարող են տարբերվել',
      'Շարունակական կասկածի դեպքում',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Ցիկլի, աղոթքի և պահքի մասին բազմաթիվ հարցեր կանոնավոր առաջանում են մի կնոջից մյուսի մոտ: Ահա ամենահաճախակիների ընդհանուր պատասխանները. ավելի խորանալու համար յուրաքանչյուր թեմա նաև ավելի մանրամասն ընդգրկված է իր հատուկ հոդվածում:',
    faqItems: [
      [
        'Ի՞նչ է կանանց ֆիքհը',
        'Կանանց ֆիքհը միավորում է գործնական կանոնները, որոնք հատուկ վերաբերում են կանանց մարմնին և պաշտամունքին. ցիկլը, մաքրությունը, աղոթքը, պահքը, նիֆասը և իսթիհադան:',
      ],
      [
        'Որո՞նք են կանանց ֆիքհի ընդգրկած հիմնական թեմաները',
        'Այն մասնավորապես ընդգրկում է դաշտանը և ցիկլը, ծիսական մաքրությունը, ղուսլը, աղոթքը և պահքը դաշտանի ընթացքում և դրանից հետո, նիֆասը և իսթիհադան:',
      ],
      [
        'Ո՞րն է տարբերությունը դաշտանի, հետծննդյան արյունահոսության և անկանոն արյունահոսության միջև',
        'Դաշտանը (հայդ) հետևում է սովորական ցիկլին, նիֆասը տեղի է ունենում ծննդաբերությունից հետո, իսկ իսթիհադան նշանակում է անկանոն արյունահոսություն՝ ցիկլից դուրս: Յուրաքանչյուրը հետևում է տարբեր կարգավիճակի:',
      ],
      [
        'Ի՞նչ է կատարվում աղոթքի հետ դաշտանի ընթացքում',
        'Աղոթքը կասեցվում է այս ժամանակահատվածում. դա ճանաչված ազատում է, որը պետք է ապրել առանց մեղքի զգացման:',
      ],
      [
        'Ի՞նչ է կատարվում պահքի հետ դաշտանի ընթացքում',
        'Պահքը նույնպես կասեցվում է. չպահված օրերը փոխհատուցվում են ավելի ուշ (կադա)՝ Ռամադանից դուրս:',
      ],
      [
        'Ինչու սովորաբար չեն փոխհատուցվում բաց թողնված աղոթքները, ի տարբերություն պահքի',
        'Այս տարբերությունը պայմանավորված է երկու գործողությունների բնույթով. աղոթքը օրական է և կրկնվող, իսկ պահքը տարեկան է և կենտրոնացած մեկ ամսվա մեջ: Ազատմանը հետևելը լիովին կրոնական պրակտիկայի մաս է:',
      ],
      [
        'Ե՞րբ է աղոթքը վերսկսվում դաշտանից հետո',
        'Հենց դաշտանն ավարտվի և ղուսլը կատարվի, աղոթքը նորմալ վերսկսվում է՝ առանց ուշացման:',
      ],
      [
        'Ո՞րն է ղուսլի դերը',
        'Ղուսլը մեծ աբդեստն է, որը թույլ է տալիս վերադառնալ ծիսական մաքրության վիճակին, որն անհրաժեշտ է աղոթքը և պաշտամունքի այլ գործողությունները վերսկսելու համար:',
      ],
      [
        'Ի՞նչ անել, եթե վստահ չեք, որ դաշտանն ավարտվել է',
        'Արյունահոսության լրիվ բացակայությունը բավարար ժամանակ դիտարկելը, այլ ոչ թե միանգամյա տպավորության վրա հիմնվելը, օգնում է պարզաբանել իրավիճակը:',
      ],
      [
        'Կարո՞ղ են պաշտամունքի այլ ձևեր կիրառվել դաշտանի ընթացքում',
        'Այո. զիքրը, աղոթագրերը, բարեգործությունը, կրոնական ուսուցումը և բարության այլ արարքները մնում են հասանելի:',
      ],
      [
        'Ինչու կարող են որոշ պատասխաններ տարբերվել՝ կախված իրավիճակից',
        'Ֆիքհը մեկնաբանության ոլորտ է. կարծիքները կարող են տարբերվել՝ կախված իրավագիտական դպրոցից և անձնական հանգամանքներից, ընդ որում ոչ մի կարծիք ինքնին բացարձակ չէ:',
      ],
    ],
    section2Body1: 'Իսլամական ֆիքհը ներառում է մեկնաբանության ճանաչված տարբերություններ որոշ մանրամասն կետերի շուրջ: Այս տարբերությունները գոյություն ունեն դարեր շարունակ և կրոնական ավանդույթում համարվում են օրինական:',
    section2Body2: 'Կախված դիմած աղբյուրից՝ նույն հարցը, հետևաբար, կարող է ստանալ մի փոքր տարբեր պատասխաններ: Սա չի նշանակում, որ պատասխանը ինքնաբերաբար սխալ կլինի. այն արտացոլում է նույն աղբյուրների տարբեր մեթոդաբանություններ և ընթերցումներ:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Հետևողականորեն հետևելը որակավորված աղբյուրին, այլ ոչ թե անընդհատ կարծիք փոխելը ըստ այն պատասխանի, որ հանդիպում եք, օգնում է պահպանել ձեր պրակտիկան հստակ և հանգիստ:',
    section3Body: 'Որոշ իրավիճակներ մնում են դժվար լուծելի՝ հիմնվելով մեկ ընդհանուր բացատրության վրա: Դա հատկապես այդպես է, երբ.',
    doubtSituations: [
      'Անորոշություն կա, թե երբ է դաշտանն իրականում ավարտվել',
      'Արյունահոսության բնույթը մնում է անորոշ (դաշտան, իսթիհադա, այլ)',
      'Շարունակվում է կասկածը ղուսլ կատարելու անհրաժեշտության վերաբերյալ',
      'Աղոթքի վերսկսման հարցը մնում է անորոշ',
      'Առցանց հակասական տեղեկություն է գտնվել',
    ],
    alert2Title: 'Կարևոր տեղեկություն',
    alert2Text: 'Երբ իրավիճակը անձնական է, բարդ կամ շարունակական, այն չի կարող լուծվել ընդհանուր տեղեկությամբ: Որակավորված գիտնականին դիմելը, որը կարող է հաշվի առնել ձեր կոնկրետ իրավիճակը, այդ դեպքում մնում է լավագույն մոտեցումը: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    keyPoints: [
      'Կանանց ֆիքհը ընդգրկում է կանանց կրոնական պրակտիկայի բազմաթիվ կողմեր',
      'Որոշ մանրամասներ կարող են օրինաչափորեն տարբերվել՝ կախված իրավագիտական դպրոցից',
      'Ընդհանուր տեղեկությունը չի փոխարինում անհատականացված կրոնական ուղղորդմանը',
      'Շարունակական կասկածը արժե քննարկել որակավորված գիտնականի հետ',
      'AWA-ի դերը կրթական է, այլ ոչ թե ֆեթվաներ տալը',
    ],
    shareMessage: 'Հաճախակի տրվող հարցեր կանանց ֆիքհի մասին — AWA',
  },
  tg: {
    badge: 'САВОЛҲОИ ЗУД-ЗУД ДОДАШАВАНДА',
    title: 'Саволҳои зуд-зуд додашаванда\nдар бораи фиқҳи занон',
    metaDuration: '8 дақ барои хондан',
    metaType: 'Саволу ҷавоб',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Маъмултарин саволҳо дар бораи фиқҳи занон, дар як ҷо бо посухҳои возеҳ ҷамъ шудаанд.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Саволҳое, ки зуд-зуд пайдо мешаванд',
      'Мазҳабҳои фиқҳӣ, ки метавонанд фарқ кунанд',
      'Дар сурати шубҳаи доимӣ',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Бисёр саволҳо дар бораи давра, намоз ва рӯза мунтазам аз як зан то зани дигар пайдо мешаванд. Инак посухҳои умумӣ ба маъмултаринашон; барои амиқтар рафтан, ҳар мавзӯъ инчунин дар мақолаи махсуси худ муфассалтар баррасӣ шудааст.',
    faqItems: [
      [
        'Фиқҳи занон чист?',
        'Фиқҳи занон қоидаҳои амалиро ҷамъ меорад, ки махсусан бадан ва ибодати занонро фаро мегиранд: давра, покӣ, намоз, рӯза, нифос ва истиҳоза.',
      ],
      [
        'Мавзӯъҳои асосии фиқҳи занон кадомҳоянд?',
        'Он махсусан ҳайз ва давра, покии маросимӣ, ғусл, намоз ва рӯза ҳангоми ҳайз ва пас аз он, нифос ва истиҳозаро фаро мегирад.',
      ],
      [
        'Фарқи байни ҳайз, хунравии баъдизоӣ ва хунравии номунтазам дар чист?',
        'Ҳайз (ҳайд) давраи одатиро пайравӣ мекунад, нифос пас аз таваллуд рух медиҳад ва истиҳоза хунравии номунтазам, берун аз давраро мефаҳмонад. Ҳар кадом мақоми гуногун дорад.',
      ],
      [
        'Намоз ҳангоми ҳайз чӣ мешавад?',
        'Намоз дар ин вақт қатъ мегардад: ин озодии эътирофшуда аст, ки бояд бидуни гуноҳ аз сар гузаронида шавад.',
      ],
      [
        'Рӯза ҳангоми ҳайз чӣ мешавад?',
        'Рӯза низ қатъ мегардад; рӯзҳои нагирифташуда баъдтар, берун аз Рамазон, қазо карда мешаванд (қазо).',
      ],
      [
        'Чаро намозҳои аз даст рафта одатан қазо намешаванд, бар хилофи рӯза?',
        'Ин фарқ ба табиати ду амал вобаста аст: намоз ҳаррӯза ва такроршаванда аст, дар ҳоле ки рӯза солона аст ва дар як моҳ тамаркуз дорад. Пайравӣ аз озодӣ ҷузъи пурраи амалияи динист.',
      ],
      [
        'Намоз пас аз ҳайз кай аз сар гирифта мешавад?',
        'Ҳамин ки ҳайз ба охир расид ва ғусл иҷро шуд, намоз ба таври муқаррарӣ, бе таъхир аз сар гирифта мешавад.',
      ],
      [
        'Нақши ғусл чист?',
        'Ғусл таҳорати калон аст, ки имкон медиҳад ба ҳолати покии маросимӣ, ки барои аз сар гирифтани намоз ва амалҳои дигари ибодат лозим аст, баргардед.',
      ],
      [
        'Агар мутмаин набошед, ки ҳайз ба охир расидааст, чӣ кор кардан лозим аст?',
        'Мушоҳидаи набудани комили хунравӣ дар муддати кофӣ, на такя ба таассуроти якдафъаина, ба равшан кардани вазъият кумак мекунад.',
      ],
      [
        'Оё шаклҳои дигари ибодатро ҳангоми ҳайз иҷро кардан мумкин аст?',
        'Бале: зикр, дуо, садақа, омӯзиши динӣ ва аъмоли нек дигар дастрас мемонанд.',
      ],
      [
        'Чаро баъзе посухҳо вобаста ба вазъият метавонанд гуногун бошанд?',
        'Фиқҳ соҳаи тафсир аст: назарҳо вобаста ба мазҳаби фиқҳӣ ва шароити шахсӣ метавонанд гуногун бошанд, бидуни он ки ягон назар худ ба худ мутлақ бошад.',
      ],
    ],
    section2Body1: 'Фиқҳи исломӣ фарқиятҳои эътирофшудаи тафсирро дар баъзе нуктаҳои тафсилотӣ дар бар мегирад. Ин фарқиятҳо садсолаҳо вуҷуд доранд ва дар доираи анъанаи динӣ қонунӣ ҳисоб мешаванд.',
    section2Body2: 'Вобаста ба манбаи муроҷиатшуда, як савол аз ин рӯ метавонад посухҳои андаке гуногун гирад. Ин маънои онро надорад, ки як посух худкор нодуруст аст: он методологияҳо ва қироатҳои гуногуни як манбаъҳоро инъикос мекунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Пайваста пайравӣ кардани манбаи салоҳиятдор, на ин ки доимо мувофиқи ҳар посухе, ки ёфта мешавад, назарро тағйир додан, ба равшан ва ором нигоҳ доштани амалияи шумо кумак мекунад.',
    section3Body: 'Баъзе вазъиятҳо дар асоси як шарҳи умумии ягона ҳал кардан душвор мемонанд. Ин махсусан вақте рост аст, ки:',
    doubtSituations: [
      'Номуайянӣ дар бораи он ки ҳайз воқеан кай ба охир расидааст, вуҷуд дорад',
      'Хусусияти хунравӣ номуайян мемонад (ҳайз, истиҳоза, дигар)',
      'Шубҳа дар бораи зарурати иҷрои ғусл идома меёбад',
      'Масъалаи аз сар гирифтани намоз номуайян мемонад',
      'Маълумоти мухолиф дар интернет ёфт шудааст',
    ],
    alert2Title: 'Маълумоти муҳим',
    alert2Text: 'Вақте ки вазъият шахсӣ, мураккаб ё доимӣ аст, онро бо маълумоти умумӣ ҳал кардан мумкин нест. Муроҷиат ба олими салоҳиятдор, ки вазъияти мушаххаси шуморо ба назар гирифта метавонад, дар он сурат беҳтарин равиш боқӣ мемонад. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    keyPoints: [
      'Фиқҳи занон ҷанбаҳои зиёди амалияи динии занонро фаро мегирад',
      'Баъзе тафсилот метавонанд вобаста ба мазҳаби фиқҳӣ ба таври қонунӣ гуногун бошанд',
      'Маълумоти умумӣ роҳнамоии шахсии диниро иваз намекунад',
      'Шубҳаи доимӣ сазовор аст, ки бо олими салоҳиятдор дар миён гузошта шавад',
      'Нақши AWA таълимист, на додани фатво',
    ],
    shareMessage: 'Саволҳои зуд-зуд додашаванда дар бораи фиқҳи занон — AWA',
  },
  ky: {
    badge: 'КӨП БЕРИЛҮҮЧҮ СУРООЛОР',
    title: 'Аялдардын фикхи боюнча\nкөп берилүүчү суроолор',
    metaDuration: '8 мүн окуу',
    metaType: 'КБС',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Аялдардын фикхи боюнча эң көп берилүүчү суроолор, даана жооптору менен бир жерде чогултулган.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Тез-тез берилүүчү суроолор',
      'Айырмаланышы мүмкүн болгон фикх мектептери',
      'Улана берген күмөн болгондо',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Цикл, намаз жана орозо боюнча көптөгөн суроолор аялдан аялга үзгүлтүксүз берилет. Мына эң көп берилгендерине жалпы жооптор; тереңирээк үйрөнүү үчүн ар бир тема өзүнүн атайын макаласында да кеңирирээк каралган.',
    faqItems: [
      [
        'Аялдардын фикхи деген эмне?',
        'Аялдардын фикхи аялдардын денесине жана ибадатына атайын тиешелүү практикалык эрежелерди бириктирет: цикл, тазалык, намаз, орозо, нифас жана истихаза.',
      ],
      [
        'Аялдардын фикхи кандай негизги темаларды камтыйт?',
        'Ал атап айтканда етек киримди жана циклди, ибадаттык тазалыкты, гусулду, етек кирим учурунда жана андан кийинки намазды жана орозону, нифасты жана истихазаны камтыйт.',
      ],
      [
        'Етек кирим, төрөттөн кийинки кан кетүү жана туура эмес кан кетүүнүн айырмасы эмнеде?',
        'Етек кирим (хайз) адаттагы циклди ээрчийт, нифас төрөттөн кийин болот, ал эми истихаза циклден тышкары туура эмес кан кетүүнү билдирет. Ар бири башка макамды ээрчийт.',
      ],
      [
        'Етек кирим учурунда намаз эмне болот?',
        'Намаз бул мезгилде токтотулат: бул таанылган бошотуу, аны күнөөсүз башынан өткөрүү керек.',
      ],
      [
        'Етек кирим учурунда орозо эмне болот?',
        'Орозо да токтотулат; кармалбаган күндөрдүн ордун кийин Рамазандан тышкары толтурушат (казо).',
      ],
      [
        'Орозодон айырмаланып, өткөрүлгөн намаздардын ордун эмне үчүн жалпысынан толтурушпайт?',
        'Бул айырмачылык эки ибадаттын табиятына байланыштуу: намаз күнүмдүк жана кайталануучу, ал эми орозо жылдык жана бир айга топтолгон. Бошотууну ээрчүү диний практиканын толук бөлүгү.',
      ],
      [
        'Етек киримден кийин намаз качан уланат?',
        'Етек кирим аяктап, гусул жасалганда, намаз кечиктирбестен кадимкидей уланат.',
      ],
      [
        'Гусулдун ролу эмнеде?',
        'Гусул — намазды жана башка ибадаттарды улантуу үчүн керектүү ибадаттык тазалык абалына кайтууга мүмкүндүк берген чоң даарат.',
      ],
      [
        'Етек кирим аяктаганына ишенбесеңиз эмне кылуу керек?',
        'Бир жолку таасирге таянбастан, кан кетүүнүн толук жоктугун жетиштүү убакыт бою байкоо абалды тактоого жардам берет.',
      ],
      [
        'Етек кирим учурунда ибадаттын башка түрлөрү менен алектенсе болобу?',
        'Ооба: зикир, дуалар, садака, диний билим алуу жана башка жакшылык иштер жеткиликтүү бойдон калат.',
      ],
      [
        'Эмне үчүн айрым жооптор абалга жараша айырмаланышы мүмкүн?',
        'Фикх — чечмелөө тармагы: пикирлер фикх мектебине жана жеке шарттарга жараша айырмаланышы мүмкүн, эч бир пикир өзү абсолюттук эмес.',
      ],
    ],
    section2Body1: 'Ислам фикхи айрым майда-чүйдө маселелерде таанылган чечмелөө айырмачылыктарын камтыйт. Бул айырмачылыктар кылымдар бою бар жана диний салттын алкагында мыйзамдуу деп эсептелет.',
    section2Body2: 'Кайрылган булакка жараша бир эле суроого бир аз башка жооптор берилиши мүмкүн. Бул жооптун автоматтык түрдө жаңылыш экенин билдирбейт: ал бир эле булактардын ар кандай методологиясын жана окулушун чагылдырат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Табылган ар бир жоопко жараша пикирди тынбай өзгөрткөндүн ордуна, квалификациялуу булакты туруктуу ээрчүү практикаңызды даана жана тынч сактоого жардам берет.',
    section3Body: 'Айрым абалдарды бир жалпы түшүндүрмөгө таянып чечүү кыйын бойдон калат. Бул айрыкча төмөнкү учурларда:',
    doubtSituations: [
      'Етек кирим чындап качан аяктаганы белгисиз',
      'Кан кетүүнүн мүнөзү белгисиз бойдон калат (етек кирим, истихаза, башка)',
      'Гусул жасоо зарылдыгы боюнча күмөн сакталат',
      'Намазды улантуу маселеси белгисиз бойдон калат',
      'Интернетте карама-каршы маалымат табылган',
    ],
    alert2Title: 'Маанилүү маалымат',
    alert2Text: 'Абал жеке, татаал же улана берген болгондо, аны жалпы маалымат менен чечүүгө болбойт. Бул учурда сиздин өзгөчө абалыңызды эске ала турган квалификациялуу окумуштууга кайрылуу эң жакшы ыкма бойдон калат. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    keyPoints: [
      'Аялдардын фикхи аялдардын диний практикасынын көптөгөн жактарын камтыйт',
      'Айрым майда-чүйдөлөр фикх мектебине жараша мыйзамдуу түрдө айырмаланышы мүмкүн',
      'Жалпы маалымат жекелештирилген диний жетекчиликти алмаштырбайт',
      'Улана берген күмөндү квалификациялуу окумуштуу менен талкуулоого татыйт',
      'AWA’нын ролу билим берүү, фатва чыгаруу эмес',
    ],
    shareMessage: 'Аялдардын фикхи боюнча көп берилүүчү суроолор — AWA',
  },
  tk: {
    badge: 'KÖP BERILÝÄN SORAGLAR',
    title: 'Aýal fikhy barada\nköp berilýän soraglar',
    metaDuration: '8 min okamak',
    metaType: 'KBS',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Aýal fikhy barada iň ýygy soraglar, aýdyň jogaplar bilen bir ýerde ýygnaldy.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Ýygy-ýygydan ýüze çykýan soraglar',
      'Tapawutlanyp biljek hukuk mekdepleri',
      'Dowamly şübhe ýagdaýynda',
      'Esasy netijeler',
    ],
    section1Body: 'Sikl, namaz we oraza barada köp soraglar aýaldan aýala yzygiderli ýüze çykýar. Iň ýygylaryna umumy jogaplar şu ýerde; has çuňňur öwrenmek üçin, her mowzuk hem öz aýratyn makalasynda has jikme-jik ýaýbaňlandyrylýar.',
    faqItems: [
      [
        'Aýal fikhy näme?',
        'Aýal fikhy aýal bedenine we ybadatyna aýratyn degişli amaly düzgünleri jemleýär: sikl, arassalyk, namaz, oraza, nifas we istihaza.',
      ],
      [
        'Aýal fikhynyň öz içine alýan esasy mowzuklary haýsylar?',
        'Ol aýratyn-da aýbaşyny we sikli, dini arassalygy, gusuly, aýbaşy wagtynda we soň namazy we orazany, nifasy we istihazany öz içine alýar.',
      ],
      [
        'Aýbaşy, dograndan soňky gan akma we düzgünsiz gan akmanyň arasyndaky tapawut näme?',
        'Aýbaşy (haýz) adaty sikli yzarlaýar, nifas dograndan soň bolýar, istihaza bolsa siklden daşdaky düzgünsiz gan akmany aňladýar. Her biri dürli ýagdaýa eýerýär.',
      ],
      [
        'Aýbaşy wagtynda namazyna näme bolýar?',
        'Namaz bu döwürde togtadylýar: bu ykrar edilen erkinlik, günäkärlik duýgusyz başdan geçirilmeli.',
      ],
      [
        'Aýbaşy wagtynda orazasyna näme bolýar?',
        'Oraza hem togtadylýar; tutulmadyk günler soňra (kazo), Remezandan daşda, dolunýar.',
      ],
      [
        'Sypdyrylan namazlar näme üçin orazadan tapawutlylykda, adatça dolulmaýar?',
        'Bu tapawut iki amalyň tebigatyndan gelip çykýar: namaz gündelik we gaýtalanýar, oraza bolsa ýyllyk we bir aýa jemlenen. Erkinlige eýermek doly dini tejribäniň bir bölegi.',
      ],
      [
        'Aýbaşydan soň namaz haçan täzeden başlaýar?',
        'Aýbaşy gutaran we gusul ýerine ýetirilen badyna, namaz gijikdirilmän, adaty ýagdaýda täzeden başlaýar.',
      ],
      [
        'Gusulyň roly näme?',
        'Gusul namazy we beýleki ybadatlary täzeden başlamak üçin zerur dini arassalyk ýagdaýyna gaýdyp gelmäge mümkinçilik berýän uly täret.',
      ],
      [
        'Aýbaşynyň gutarandygyna ynamsyz bolsaňyz näme etmeli?',
        'Wagtlaýyn duýga daýanmagyň ýerine, ýeterlik wagt dowamynda gan akmanyň doly ýoklugyny synlamak ýagdaýy aýdyňlaşdyrmaga kömek edýär.',
      ],
      [
        'Aýbaşy wagtynda beýleki ybadat görnüşlerini ýerine ýetirip bolýarmy?',
        'Hawa: zikir, dogalar, sadaka, dini bilim we beýleki ýagşylyk amallary elýeter bolup galýar.',
      ],
      [
        'Käbir jogaplar ýagdaýa görä näme üçin tapawutlanyp biler?',
        'Fikh düşündiriş ugry: pikirler hukuk mekdebine we şahsy ýagdaýlara görä tapawutlanyp biler, hiç bir ýeke pikir özbaşyna mutlak däl.',
      ],
    ],
    section2Body1: 'Yslam fikhy käbir jikme-jik nokatlarda ykrar edilen düşündiriş tapawutlaryny öz içine alýar. Bu tapawutlar asyrlar boýy bar we dini däp çäginde kanuny hasaplanýar.',
    section2Body2: 'Maslahatlaşylan çeşma görä, şol bir sorag şonuň üçin az-kem dürli jogap alyp biler. Bu jogabyň awtomatiki ýalňyşdygyny aňlatmaýar: ol şol bir çeşmeleriň dürli usulyýetlerini we okalyşlaryny görkezýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Tapylan jogaba görä pikiri hemişe üýtgetmegiň ýerine, yzygiderli bilimli çeşma eýermek tejribäňizi aýdyň we asuda saklamaga kömek edýär.',
    section3Body: 'Käbir ýagdaýlary ýeke umumy düşündiriş esasynda çözmek kyn bolup galýar. Bu aýratyn-da şu ýagdaýlarda:',
    doubtSituations: [
      'Aýbaşynyň hakykatdan haçan gutarandygy barada näbellilik bar',
      'Gan akmanyň häsiýeti näbelli galýar (aýbaşy, istihaza, beýleki)',
      'Gusul etmek zerurlygy barada şübhe dowam edýär',
      'Namazy täzeden başlamak soragy näbelli galýar',
      'Onlaýn gapma-garşy maglumat tapyldy',
    ],
    alert2Title: 'Möhüm maglumat',
    alert2Text: 'Ýagdaý şahsy, çylşyrymly ýa-da dowamly bolanda, ony umumy maglumat bilen çözüp bolmaýar. Şol ýagdaýda aýratyn ýagdaýyňyzy hasaba alyp biljek bilimli alyma ýüz tutmak iň gowy çemeleşme bolup galýar. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    keyPoints: [
      'Aýal fikhy aýallaryň dini tejribesiniň köp tarapyny öz içine alýar',
      'Käbir jikme-jiklikler hukuk mekdebine görä kanuny taýdan tapawutlanyp biler',
      'Umumy maglumat şahsylaşdyrylan dini ugrukdyrmany çalyşmaýar',
      'Dowamly şübhe bilimli alym bilen gürleşmäge mynasyp',
      'AWA-nyň roly bilim bermek, fatwa bermek däl',
    ],
    shareMessage: 'Aýal fikhy barada köp berilýän soraglar — AWA',
  },
} as const);

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

          <View style={styles.faqList}>
            {content.faqItems.map(([question, answer], index) => (
              <View
                key={question}
                style={[
                  styles.faqItem,
                  index === 0 && styles.faqItemFirst,
                ]}>
                <AwaText variant="titleSmall" emphasized>{question}</AwaText>
                <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.faqAnswer}>{answer}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body1}
          </AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.doubtSituations.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.keyPoints.map(item => (
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

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
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
  faqList: {marginTop: 4},
  faqItem: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  faqItemFirst: {marginTop: 16, paddingTop: 0, borderTopWidth: 0},
  faqAnswer: {
    marginTop: 4,
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
