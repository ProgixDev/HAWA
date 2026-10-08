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

const ID = 'istihada-comprendre-les-saignements';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

const ART = {
  observe: require('../../assets/images/library/flow-texture-creamy.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
//
// RELIGIOUS CONTENT: "Istihâda" is kept untranslated in both languages
// (it is an Islamic jurisprudence term, not a generic word for bleeding).
// Every hedge ("généralement" / "generally", "selon les écoles
// juridiques" / "according to the schools of jurisprudence", "parfois" /
// "sometimes") and every scholarly-attribution phrase is preserved as-is
// across languages — no ruling is stated more strongly in English than in
// the French source.
const CONTENT = {
  fr: {
    badge: 'ISTIHÂDA',
    title: 'Comprendre l’Istihâda',
    metaDuration: '7 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Distinguer un saignement irrégulier des règles habituelles, avec des repères généraux pour t’orienter.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que l’Istihâda ?',
      'Pourquoi peut-elle être difficile à identifier ?',
      'Les différences entre menstruation et Istihâda',
      'Comment observer les saignements ?',
      'Prière et jeûne pendant l’Istihâda',
      'Que faire en cas de doute ?',
      'À retenir',
    ],
    section1Body: 'L’Istihâda désigne un saignement qui survient en dehors du cycle menstruel habituel, ou qui se prolonge au-delà de la durée des règles reconnue par la tradition islamique. Contrairement aux règles (hayd) ou au nifas (saignement après l’accouchement), elle n’a pas le même statut rituel : elle est généralement considérée comme un saignement de nature différente, parfois lié à une cause médicale.',
    note1Title: 'À noter',
    note1Text: 'Ce contenu explique le concept de manière générale ; il ne permet pas de déterminer si un saignement précis correspond à une Istihâda dans ta situation personnelle.',
    section2Body: 'Il peut être difficile de distinguer l’Istihâda des règles ou d’un cycle irrégulier, car les saignements peuvent parfois se ressembler, varier en intensité, ou se prolonger de façon inhabituelle. Cette difficulté est reconnue par les savants eux-mêmes, ce qui explique l’existence de plusieurs approches pour l’identifier.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il est normal de ne pas savoir immédiatement à quoi correspond un saignement inhabituel ; ce doute est une situation courante, pas une erreur de ta part.',
    section3Body: 'Certains éléments peuvent aider à orienter la réflexion, sans constituer des règles universelles, car les repères précis varient selon les écoles juridiques.',
    differences: [
      ['calendar-clock-outline', 'Durée par rapport à ton cycle habituel'],
      ['repeat-variant', 'Régularité ou caractère inhabituel du saignement'],
      ['water-outline', 'Évolution du saignement dans le temps'],
      ['clipboard-pulse-outline', 'Présence éventuelle d’une cause médicale connue'],
    ],
    note2Title: 'À noter',
    note2Text: 'Ces éléments sont des repères généraux et non des critères absolus : ils peuvent être interprétés différemment selon les savants et les écoles juridiques.',
    section4Body: 'Prendre le temps d’observer ses saignements sur plusieurs jours, sans précipitation, aide à mieux comprendre sa propre situation avant d’en tirer une conclusion.',
    checkList1Title: 'Quelques repères pratiques',
    observeTips: [
      'Noter la date de début et, si possible, la durée habituelle de tes cycles',
      'Observer si le saignement suit une évolution proche de tes règles précédentes',
      'Ne pas te baser uniquement sur une seule journée isolée',
      'Consigner ces observations si tu prévois de consulter un savant ou un professionnel de santé',
    ],
    section5Body: 'Dans le cas de l’Istihâda, la prière et le jeûne restent généralement obligatoires, à la différence des règles. Des précautions d’hygiène (comme des protections adaptées) sont alors recommandées pour permettre la pratique du culte, selon les modalités enseignées par les différentes écoles juridiques.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Les précautions précises (comme le renouvellement des ablutions) peuvent varier selon l’école juridique suivie ; se référer à l’avis habituellement suivi ou à un savant qualifié aide à les appliquer correctement.',
    section6Body: 'Un doute persistant sur la nature d’un saignement est une situation fréquente, qui ne doit pas être source d’inquiétude excessive.',
    doubtSteps: [
      'Te référer à la durée et au rythme habituels de tes propres règles',
      'Consulter un professionnel de santé si le saignement est inhabituel ou prolongé',
      'Demander l’avis d’un savant ou d’une savante qualifiée pour la dimension religieuse',
      'Garder à l’esprit qu’une réponse générale ne remplace pas un avis adapté à ta situation',
    ],
    alert2Title: 'Information importante',
    alert2Text: 'Ce contenu reste éducatif et général : il ne constitue pas une fatwa ni une décision religieuse individuelle. Pour toute situation personnelle, en particulier en cas de doute prolongé, l’avis d’un savant qualifié reste la référence.',
    tip3Title: 'Bon à savoir',
    tip3Text: 'L’Istihâda est un concept qui distingue un saignement inhabituel des règles ou du nifas, avec des implications spécifiques sur la prière et le jeûne. En cas de doute, l’observation attentive et l’avis d’un savant qualifié restent les meilleures ressources.',
    shareMessage: 'Comprendre l’Istihâda — AWA',
  },
  en: {
    badge: 'ISTIHÂDA',
    title: 'Understanding Istihâda',
    metaDuration: '7 min read',
    metaType: 'FAQ',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'Distinguishing irregular bleeding from your usual period, with general markers to help guide you.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'What is Istihâda?',
      'Why can it be difficult to identify?',
      'Differences between menstruation and Istihâda',
      'How to observe the bleeding?',
      'Prayer and fasting during Istihâda',
      'What to do in case of doubt?',
      'Key takeaways',
    ],
    section1Body: 'Istihâda refers to bleeding that occurs outside the usual menstrual cycle, or that continues beyond the duration of menstruation recognized by Islamic tradition. Unlike menstruation (hayd) or nifas (bleeding after childbirth), it does not have the same ritual status: it is generally considered to be bleeding of a different nature, sometimes linked to a medical cause.',
    note1Title: 'Please note',
    note1Text: 'This content explains the concept in general terms; it does not allow you to determine whether a specific instance of bleeding corresponds to Istihâda in your personal situation.',
    section2Body: 'It can be difficult to distinguish Istihâda from menstruation or an irregular cycle, because the bleeding can sometimes look similar, vary in intensity, or continue in an unusual way. This difficulty is recognized by scholars themselves, which explains why several approaches exist to identify it.',
    tip1Title: 'Good to know',
    tip1Text: 'It is normal not to know right away what unusual bleeding corresponds to; this uncertainty is a common situation, not a mistake on your part.',
    section3Body: 'Certain elements can help guide your thinking, without being universal rules, since the precise markers vary according to the schools of jurisprudence.',
    differences: [
      ['calendar-clock-outline', 'Duration compared to your usual cycle'],
      ['repeat-variant', 'Regularity or unusual nature of the bleeding'],
      ['water-outline', 'How the bleeding evolves over time'],
      ['clipboard-pulse-outline', 'Possible presence of a known medical cause'],
    ],
    note2Title: 'Please note',
    note2Text: 'These elements are general markers, not absolute criteria: they may be interpreted differently by scholars and schools of jurisprudence.',
    section4Body: 'Taking the time to observe your bleeding over several days, without rushing, helps you better understand your own situation before drawing a conclusion.',
    checkList1Title: 'Some practical pointers',
    observeTips: [
      'Note the start date and, if possible, the usual length of your cycles',
      'Observe whether the bleeding follows a pattern close to your previous periods',
      'Do not rely on a single isolated day alone',
      'Record these observations if you plan to consult a scholar or a healthcare professional',
    ],
    section5Body: 'In the case of Istihâda, prayer and fasting generally remain obligatory, unlike during menstruation. Hygiene precautions (such as suitable protection) are then recommended to allow worship to continue, according to the methods taught by the different schools of jurisprudence.',
    tip2Title: 'Good to know',
    tip2Text: 'The precise precautions (such as renewing ablutions) may vary depending on the school of jurisprudence followed; referring to the opinion you usually follow or to a qualified scholar helps you apply them correctly.',
    section6Body: 'Persistent doubt about the nature of bleeding is a common situation, and should not be a source of excessive worry.',
    doubtSteps: [
      'Refer to the usual duration and rhythm of your own periods',
      'Consult a healthcare professional if the bleeding is unusual or prolonged',
      'Ask a qualified scholar for their opinion on the religious dimension',
      'Keep in mind that a general answer does not replace guidance suited to your situation',
    ],
    alert2Title: 'Important information',
    alert2Text: 'This content remains educational and general: it does not constitute a fatwa or an individual religious ruling. For any personal situation, especially in case of prolonged doubt, the opinion of a qualified scholar remains the reference.',
    tip3Title: 'Good to know',
    tip3Text: 'Istihâda is a concept that distinguishes unusual bleeding from menstruation or nifas, with specific implications for prayer and fasting. In case of doubt, careful observation and the opinion of a qualified scholar remain the best resources.',
    shareMessage: 'Understanding Istihâda — AWA',
  },
  es: {
    badge: 'ISTIHADA',
    title: 'Comprender la Istihada',
    metaDuration: '7 min de lectura',
    metaType: 'Preguntas frecuentes',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Distinguir un sangrado irregular de la menstruación habitual, con referencias generales para orientarte.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la Istihada?',
      '¿Por qué puede ser difícil de identificar?',
      'Las diferencias entre la menstruación y la Istihada',
      '¿Cómo observar el sangrado?',
      'Oración y ayuno durante la Istihada',
      '¿Qué hacer en caso de duda?',
      'Para recordar',
    ],
    section1Body: 'La Istihada designa un sangrado que se produce fuera del ciclo menstrual habitual, o que se prolonga más allá de la duración de la menstruación reconocida por la tradición islámica. A diferencia de la menstruación (hayd) o del nifas (sangrado después del parto), no tiene el mismo estatus ritual: se considera generalmente un sangrado de naturaleza diferente, a veces vinculado a una causa médica.',
    note1Title: 'Para tener en cuenta',
    note1Text: 'Este contenido explica el concepto de manera general; no permite determinar si un sangrado concreto corresponde a una Istihada en tu situación personal.',
    section2Body: 'Puede resultar difícil distinguir la Istihada de la menstruación o de un ciclo irregular, porque los sangrados a veces pueden parecerse, variar en intensidad o prolongarse de forma inusual. Esta dificultad es reconocida por los propios eruditos, lo que explica que existan varios enfoques para identificarla.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Es normal no saber de inmediato a qué corresponde un sangrado inusual; esta duda es una situación habitual, no un error por tu parte.',
    section3Body: 'Algunos elementos pueden ayudar a orientar la reflexión, sin constituir reglas universales, ya que las referencias precisas varían según las escuelas jurídicas.',
    differences: [
      ['calendar-clock-outline', 'Duración en comparación con tu ciclo habitual'],
      ['repeat-variant', 'Regularidad o carácter inusual del sangrado'],
      ['water-outline', 'Evolución del sangrado a lo largo del tiempo'],
      ['clipboard-pulse-outline', 'Posible presencia de una causa médica conocida'],
    ],
    note2Title: 'Para tener en cuenta',
    note2Text: 'Estos elementos son referencias generales y no criterios absolutos: pueden interpretarse de forma diferente según los eruditos y las escuelas jurídicas.',
    section4Body: 'Tomarse el tiempo de observar el sangrado durante varios días, sin precipitarse, ayuda a comprender mejor la propia situación antes de sacar una conclusión.',
    checkList1Title: 'Algunas pautas prácticas',
    observeTips: [
      'Anotar la fecha de inicio y, si es posible, la duración habitual de tus ciclos',
      'Observar si el sangrado sigue una evolución cercana a la de tus menstruaciones anteriores',
      'No basarte únicamente en un solo día aislado',
      'Registrar estas observaciones si prevés consultar a un erudito o a un profesional de la salud',
    ],
    section5Body: 'En el caso de la Istihada, la oración y el ayuno siguen siendo generalmente obligatorios, a diferencia de la menstruación. Entonces se recomiendan precauciones de higiene (como protecciones adecuadas) para permitir la práctica del culto, según las modalidades enseñadas por las distintas escuelas jurídicas.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'Las precauciones precisas (como la renovación de las abluciones) pueden variar según la escuela jurídica seguida; referirse a la opinión que se suele seguir o a un erudito cualificado ayuda a aplicarlas correctamente.',
    section6Body: 'Una duda persistente sobre la naturaleza de un sangrado es una situación frecuente, que no debe ser motivo de preocupación excesiva.',
    doubtSteps: [
      'Referirte a la duración y al ritmo habituales de tu propia menstruación',
      'Consultar a un profesional de la salud si el sangrado es inusual o prolongado',
      'Pedir la opinión de un erudito o una erudita cualificada para la dimensión religiosa',
      'Tener presente que una respuesta general no sustituye un consejo adaptado a tu situación',
    ],
    alert2Title: 'Información importante',
    alert2Text: 'Este contenido sigue siendo educativo y general: no constituye una fatua ni una decisión religiosa individual. Para cualquier situación personal, en particular en caso de duda prolongada, la opinión de un erudito cualificado sigue siendo la referencia.',
    tip3Title: 'Bueno saberlo',
    tip3Text: 'La Istihada es un concepto que distingue un sangrado inusual de la menstruación o del nifas, con implicaciones específicas en la oración y el ayuno. En caso de duda, la observación atenta y la opinión de un erudito cualificado siguen siendo los mejores recursos.',
    shareMessage: 'Comprender la Istihada — AWA',
  },
  it: {
    badge: 'ISTIHADA',
    title: 'Capire l’Istihâda',
    metaDuration: '7 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Distinguere un sanguinamento irregolare dalle tue mestruazioni abituali, con alcuni riferimenti generali che possono orientarti.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’Istihâda?',
      'Perché può essere difficile riconoscerla?',
      'Differenze tra mestruazioni e Istihâda',
      'Come osservare il sanguinamento?',
      'Preghiera e digiuno durante l’Istihâda',
      'Cosa fare in caso di dubbio?',
      'Punti chiave',
    ],
    section1Body: 'L’Istihâda indica un sanguinamento che si verifica al di fuori del normale ciclo mestruale, oppure che continua oltre la durata delle mestruazioni riconosciuta dalla tradizione islamica. A differenza delle mestruazioni (hayd) o del nifas (sanguinamento dopo il parto), non ha lo stesso status rituale: è generalmente considerata un sanguinamento di natura diversa, talvolta legato a una causa medica.',
    note1Title: 'Attenzione',
    note1Text: 'Questo contenuto spiega il concetto in termini generali; non permette di stabilire se uno specifico sanguinamento corrisponda a Istihâda nella tua situazione personale.',
    section2Body: 'Può essere difficile distinguere l’Istihâda dalle mestruazioni o da un ciclo irregolare, perché il sanguinamento può talvolta sembrare simile, variare di intensità o proseguire in modo insolito. Questa difficoltà è riconosciuta dagli stessi studiosi, il che spiega perché esistono diversi approcci per individuarla.',
    tip1Title: 'Da sapere',
    tip1Text: 'È normale non sapere subito a cosa corrisponda un sanguinamento insolito; questa incertezza è una situazione comune, non un tuo errore.',
    section3Body: 'Alcuni elementi possono aiutarti a orientare la tua riflessione, senza essere regole universali, poiché i riferimenti precisi variano a seconda delle scuole giuridiche.',
    differences: [
      [
        'calendar-clock-outline',
        'Durata rispetto al tuo ciclo abituale',
      ],
      [
        'repeat-variant',
        'Regolarità o carattere insolito del sanguinamento',
      ],
      [
        'water-outline',
        'Come evolve il sanguinamento nel tempo',
      ],
      [
        'clipboard-pulse-outline',
        'Possibile presenza di una causa medica nota',
      ],
    ],
    note2Title: 'Attenzione',
    note2Text: 'Questi elementi sono riferimenti generali, non criteri assoluti: possono essere interpretati in modo diverso dagli studiosi e dalle scuole giuridiche.',
    section4Body: 'Prenderti il tempo di osservare il sanguinamento per diversi giorni, senza fretta, ti aiuta a comprendere meglio la tua situazione prima di trarre una conclusione.',
    checkList1Title: 'Alcuni consigli pratici',
    observeTips: [
      'Annota la data di inizio e, se possibile, la durata abituale dei tuoi cicli',
      'Osserva se il sanguinamento segue un andamento simile a quello delle tue mestruazioni precedenti',
      'Non basarti su un solo giorno isolato',
      'Registra queste osservazioni se prevedi di consultare uno studioso o un professionista sanitario',
    ],
    section5Body: 'In caso di Istihâda, la preghiera e il digiuno restano generalmente obbligatori, a differenza di quanto avviene durante le mestruazioni. Si raccomandano allora precauzioni igieniche (come una protezione adeguata) per poter continuare il culto, secondo le modalità insegnate dalle diverse scuole giuridiche.',
    tip2Title: 'Da sapere',
    tip2Text: 'Le precauzioni precise (come rinnovare le abluzioni) possono variare a seconda della scuola giuridica seguita; fare riferimento al parere che segui abitualmente o a uno studioso qualificato ti aiuta ad applicarle correttamente.',
    section6Body: 'Un dubbio persistente sulla natura di un sanguinamento è una situazione comune e non dovrebbe essere motivo di eccessiva preoccupazione.',
    doubtSteps: [
      'Fai riferimento alla durata e al ritmo abituali delle tue mestruazioni',
      'Consulta un professionista sanitario se il sanguinamento è insolito o prolungato',
      'Chiedi il parere di uno studioso qualificato sulla dimensione religiosa',
      'Ricorda che una risposta generale non sostituisce una guida adatta alla tua situazione',
    ],
    alert2Title: 'Informazione importante',
    alert2Text: 'Questo contenuto resta educativo e generale: non costituisce una fatwa né un parere religioso individuale. Per qualsiasi situazione personale, soprattutto in caso di dubbio prolungato, il parere di uno studioso qualificato resta il riferimento.',
    tip3Title: 'Da sapere',
    tip3Text: 'L’Istihâda è un concetto che distingue un sanguinamento insolito dalle mestruazioni o dal nifas, con implicazioni specifiche per la preghiera e il digiuno. In caso di dubbio, un’osservazione attenta e il parere di uno studioso qualificato restano le risorse migliori.',
    shareMessage: 'Capire l’Istihâda — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function IstihadaArticleScreen({
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

          <Text style={styles.title}>{content.title}</Text>

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

          <Text style={styles.intro}>{content.intro}</Text>

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

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.note1Title}</Text>
              <Text style={styles.tipText}>{content.note1Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>{content.tip1Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.daily}>
            {content.differences.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{label}</Text>
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
              <Text style={styles.tipTitle}>{content.note2Title}</Text>
              <Text style={styles.tipText}>{content.note2Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <Image
            source={ART.observe}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>{content.checkList1Title}</Text>

            {content.observeTips.map(item => (
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

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>{content.tip2Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <Text style={styles.body}>{content.section6Body}</Text>

          <View style={styles.checkList}>
            {content.doubtSteps.map(item => (
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
              <Text style={styles.tipText}>{content.alert2Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>7. {content.topics[6]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip3Title}</Text>
              <Text style={styles.tipText}>{content.tip3Text}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
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
  wideImage: {width: '100%', height: 120, marginTop: 14, borderRadius: 12},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 13,
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
