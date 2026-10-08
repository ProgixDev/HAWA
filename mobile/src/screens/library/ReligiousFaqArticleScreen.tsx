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
