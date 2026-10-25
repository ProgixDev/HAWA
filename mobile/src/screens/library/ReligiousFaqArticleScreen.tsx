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
  da: {
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
