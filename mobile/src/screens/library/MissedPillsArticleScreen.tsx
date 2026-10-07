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

const ID = 'missedpills-que-faire-en-cas-doubli';

const HERO = require('../../assets/images/library/regular-cycle-consult.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CHECK_ICONS = [
  'clock-outline',
  'file-document-outline',
  'shield-check-outline',
] as const;

const SITUATION_ICONS = ['pill', 'calendar-alert', 'help-circle-outline'] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    shareMessage: 'Oubli de pilule : que faire ? — AWA',
    badge: 'OUBLI DE PILULE',
    title: 'Oubli de pilule :\nque faire ?',
    metaDuration: '7 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Un oubli de pilule peut arriver à tout le monde. La conduite à tenir dépend principalement du délai depuis l’oubli, du type de pilule et du moment où celui-ci survient dans la plaquette.',
    importantTitle: 'Le point essentiel',
    importantText: 'Ne panique pas. Vérifie d’abord le type exact de ta pilule et consulte sa notice pour connaître la conduite recommandée.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Moins de 12 heures de retard',
      'Plus de 12 heures de retard',
      'Les situations qui demandent plus d’attention',
      'La notice reste la référence',
      'Quand demander conseil',
      'À retenir',
    ],
    body1: 'Pour certaines pilules, un retard inférieur à 12 heures ne compromet généralement pas la protection contraceptive. Dans ce cas, la recommandation habituelle est de prendre le comprimé oublié dès que possible puis de poursuivre la plaquette à l’heure habituelle.',
    step1Title: 'Prends le comprimé',
    step1Text: 'Prends le comprimé dès que tu constates le retard.',
    step2Title: 'Continue normalement',
    step2Text: 'Reprends ensuite ton rythme habituel pour les comprimés suivants.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Si tu as pris le comprimé oublié puis celui prévu à l’heure habituelle, il peut arriver que deux comprimés soient pris le même jour.',
    body2: 'Lorsque le retard dépasse le délai prévu pour ta pilule, la protection peut être diminuée. La conduite à tenir dépend alors du type de pilule, du nombre de comprimés oubliés et de l’emplacement de l’oubli dans la plaquette.',
    alertTitle: 'Attention',
    alertText: 'Ne te fie pas uniquement au nombre d’heures indiqué ici : certaines pilules ont des consignes différentes. Consulte toujours la notice de ton médicament.',
    reflexesTitle: 'Les premiers réflexes',
    checkPoints: [
      {title: 'Réagir rapidement', text: 'Plus tu réagis rapidement après avoir constaté l’oubli, plus il est facile de suivre les recommandations adaptées.'},
      {title: 'Vérifier la notice', text: 'Les consignes peuvent varier selon le type exact de pilule et le nombre de comprimés oubliés.'},
      {title: 'Prévoir une protection complémentaire', text: 'Dans certaines situations, un préservatif peut être recommandé pendant une période donnée.'},
    ],
    body3: 'Toutes les situations ne se ressemblent pas. Certains oublis nécessitent une vérification plus précise des recommandations.',
    situations: [
      {title: 'Un seul comprimé oublié', text: 'La conduite à tenir dépend principalement du délai depuis l’heure habituelle de prise.'},
      {title: 'Plusieurs comprimés oubliés', text: 'La situation nécessite une attention particulière et il est préférable de vérifier précisément la notice.'},
      {title: 'Doute sur la conduite à tenir', text: 'Une pharmacie ou un professionnel de santé peut t’aider rapidement à identifier la bonne conduite.'},
    ],
    body4: 'La notice de ta pilule donne les consignes précises correspondant au médicament que tu prends. Les recommandations peuvent être différentes selon qu’il s’agit d’une pilule combinée ou d’une pilule progestative seule.',
    referenceTitle: 'Vérifications utiles',
    referenceTips: [
      'Garder la notice accessible (photo dans le téléphone, par exemple)',
      'Contacter une pharmacienne en cas de doute rapide',
      'Consulter si l’oubli se répète souvent',
    ],
    guideTitle: 'Pourquoi le moment de l’oubli compte ?',
    guideText: 'Le moment où survient l’oubli dans la plaquette peut modifier la conduite à tenir. C’est pourquoi la notice précise souvent des recommandations différentes selon la semaine de prise.',
    body5: 'Si tu ne sais pas quelle conduite adopter, mieux vaut demander conseil plutôt que de rester dans le doute. Une pharmacie, une sage-femme ou un médecin peut t’aider à vérifier les recommandations adaptées à ta situation.',
    questionTitle: 'Les informations à préparer',
    questions: [
      'Quel type de pilule est-ce exactement ?',
      'Combien de temps s’est écoulé depuis l’heure habituelle ?',
      'Combien de comprimés ont été oubliés ?',
      'À quel moment de la plaquette l’oubli a-t-il eu lieu ?',
      'Y a-t-il eu un rapport sexuel non protégé récemment ?',
    ],
    proTipTitle: 'Bon à savoir',
    proTipText: 'Si un rapport sexuel non protégé a eu lieu autour de la période de l’oubli, demande rapidement conseil à un professionnel afin de connaître les options possibles.',
    repeatTitle: 'Si les oublis se répètent',
    body6: 'Des oublis fréquents peuvent être le signe que le mode de prise quotidien ne correspond pas parfaitement à ton rythme de vie. N’hésite pas à en parler avec un professionnel de santé afin d’explorer d’autres options contraceptives.',
    methodTipTitle: 'Une autre méthode ?',
    methodTipText: 'Si prendre un comprimé chaque jour est difficile à maintenir, il existe d’autres méthodes avec une fréquence d’utilisation différente.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Réagis dès que tu constates l’oubli.',
      'Vérifie le type exact de ta pilule.',
      'Consulte la notice pour connaître la conduite précise.',
      'Utilise une protection complémentaire si la notice le recommande.',
      'Demande conseil en cas de doute ou de rapport à risque.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'Un oubli ne signifie pas automatiquement que ta contraception ne fonctionne plus. La bonne conduite dépend du type de pilule et des circonstances de l’oubli. En cas de doute, vérifie la notice et demande conseil rapidement.',
    disclaimerText: 'Cet article est fourni à titre informatif et ne remplace pas la notice de ton médicament ni un avis médical personnalisé. Les recommandations peuvent varier selon le type de pilule.',
  },
  en: {
    shareMessage: 'Missed pill: what to do? — AWA',
    badge: 'MISSED PILL',
    title: 'Missed pill:\nwhat to do?',
    metaDuration: '7 min read',
    metaType: 'FAQ',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'A missed pill can happen to anyone. What to do mainly depends on how long ago you missed it, the type of pill, and when in the pack it happens.',
    importantTitle: 'The key point',
    importantText: 'Don’t panic. First check the exact type of your pill and check its package insert to find out the recommended course of action.',
    contentsTitle: 'In this article',
    topics: [
      'Less than 12 hours late',
      'More than 12 hours late',
      'Situations that need extra attention',
      'The package insert is your reference',
      'When to ask for advice',
      'Key takeaways',
    ],
    body1: 'For some pills, a delay of less than 12 hours generally doesn’t compromise contraceptive protection. In this case, the usual recommendation is to take the missed pill as soon as possible and then continue the pack at the usual time.',
    step1Title: 'Take the pill',
    step1Text: 'Take the pill as soon as you notice you’re late.',
    step2Title: 'Continue as usual',
    step2Text: 'Then go back to your usual schedule for the following pills.',
    tip1Title: 'Good to know',
    tip1Text: 'If you take the missed pill and then the one scheduled for the usual time, it can happen that two pills are taken on the same day.',
    body2: 'When the delay exceeds the time allowed for your pill, protection may be reduced. What to do then depends on the type of pill, the number of pills missed, and where in the pack the missed pill falls.',
    alertTitle: 'Warning',
    alertText: 'Don’t rely only on the number of hours given here: some pills have different instructions. Always check your medication’s package insert.',
    reflexesTitle: 'First things to do',
    checkPoints: [
      {title: 'React quickly', text: 'The more quickly you react after noticing the missed pill, the easier it is to follow the appropriate recommendations.'},
      {title: 'Check the package insert', text: 'The instructions can vary depending on the exact type of pill and the number of pills missed.'},
      {title: 'Plan for backup protection', text: 'In some situations, a condom may be recommended for a given period.'},
    ],
    body3: 'Not all situations are alike. Some missed pills call for a more precise check of the recommendations.',
    situations: [
      {title: 'Only one pill missed', text: 'What to do mainly depends on the time elapsed since the usual time of taking it.'},
      {title: 'More than one pill missed', text: 'This situation needs particular attention, and it’s best to check the package insert precisely.'},
      {title: 'Not sure what to do', text: 'A pharmacist or healthcare professional can quickly help you identify the right course of action.'},
    ],
    body4: 'Your pill’s package insert gives the precise instructions for the medication you’re taking. Recommendations can differ depending on whether it’s a combined pill or a progestin-only pill.',
    referenceTitle: 'Useful things to check',
    referenceTips: [
      'Keep the package insert handy (a photo on your phone, for example)',
      'Contact a pharmacist if you have a quick question',
      'See a doctor if it happens often',
    ],
    guideTitle: 'Why does the timing of the missed pill matter?',
    guideText: 'When the missed pill falls in the pack can change what to do. That’s why the package insert often gives different recommendations depending on the week of the pack.',
    body5: 'If you don’t know what to do, it’s better to ask for advice than to stay in doubt. A pharmacist, midwife, or doctor can help you check the recommendations suited to your situation.',
    questionTitle: 'Information to have ready',
    questions: [
      'What exact type of pill is it?',
      'How much time has passed since the usual time?',
      'How many pills were missed?',
      'At what point in the pack did the missed pill happen?',
      'Has there been unprotected sex recently?',
    ],
    proTipTitle: 'Good to know',
    proTipText: 'If unprotected sex happened around the time of the missed pill, ask a professional for advice quickly to find out what options are available.',
    repeatTitle: 'If you keep missing pills',
    body6: 'Frequent missed pills can be a sign that the daily routine doesn’t quite fit your lifestyle. Don’t hesitate to talk to a healthcare professional to explore other contraceptive options.',
    methodTipTitle: 'A different method?',
    methodTipText: 'If taking a pill every day is hard to keep up, other methods exist with a different frequency of use.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'React as soon as you notice the missed pill.',
      'Check the exact type of your pill.',
      'Check the package insert to find out the precise course of action.',
      'Use backup protection if the package insert recommends it.',
      'Ask for advice if in doubt or after a risky encounter.',
    ],
    finalTipTitle: 'Key takeaways',
    finalTipText: 'A missed pill doesn’t automatically mean your contraception has stopped working. The right course of action depends on the type of pill and the circumstances of the missed dose. If in doubt, check the package insert and ask for advice quickly.',
    disclaimerText: 'This article is provided for informational purposes only and does not replace your medication’s package insert or personalized medical advice. Recommendations may vary depending on the type of pill.',
  },
  es: {
    shareMessage: 'Olvido de la píldora: ¿qué hacer? — AWA',
    badge: 'OLVIDO DE PÍLDORA',
    title: 'Olvido de la píldora:\n¿qué hacer?',
    metaDuration: '7 min de lectura',
    metaType: 'FAQ',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Un olvido de píldora puede pasarle a cualquiera. La actuación a seguir depende principalmente del tiempo transcurrido desde el olvido, del tipo de píldora y del momento en que este se produce dentro del blíster.',
    importantTitle: 'El punto esencial',
    importantText: 'No entres en pánico. Primero comprueba el tipo exacto de tu píldora y consulta su prospecto para conocer la actuación recomendada.',
    contentsTitle: 'En este artículo',
    topics: [
      'Menos de 12 horas de retraso',
      'Más de 12 horas de retraso',
      'Las situaciones que requieren más atención',
      'El prospecto sigue siendo la referencia',
      'Cuándo pedir consejo',
      'Lo esencial',
    ],
    body1: 'En algunas píldoras, un retraso inferior a 12 horas generalmente no compromete la protección anticonceptiva. En ese caso, la recomendación habitual es tomar el comprimido olvidado lo antes posible y luego continuar el blíster a la hora habitual.',
    step1Title: 'Toma el comprimido',
    step1Text: 'Toma el comprimido en cuanto detectes el retraso.',
    step2Title: 'Continúa con normalidad',
    step2Text: 'Retoma después tu ritmo habitual para los comprimidos siguientes.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Si tomaste el comprimido olvidado y luego el previsto para la hora habitual, puede ocurrir que se tomen dos comprimidos el mismo día.',
    body2: 'Cuando el retraso supera el plazo previsto para tu píldora, la protección puede disminuir. La actuación a seguir depende entonces del tipo de píldora, del número de comprimidos olvidados y del momento del olvido dentro del blíster.',
    alertTitle: 'Atención',
    alertText: 'No te bases únicamente en el número de horas indicado aquí: algunas píldoras tienen instrucciones diferentes. Consulta siempre el prospecto de tu medicamento.',
    reflexesTitle: 'Los primeros reflejos',
    checkPoints: [
      {title: 'Reaccionar rápidamente', text: 'Cuanto más rápido reacciones después de notar el olvido, más fácil será seguir las recomendaciones adecuadas.'},
      {title: 'Comprobar el prospecto', text: 'Las instrucciones pueden variar según el tipo exacto de píldora y el número de comprimidos olvidados.'},
      {title: 'Prever una protección complementaria', text: 'En algunas situaciones, puede recomendarse el uso de un preservativo durante un período determinado.'},
    ],
    body3: 'No todas las situaciones son iguales. Algunos olvidos requieren una comprobación más precisa de las recomendaciones.',
    situations: [
      {title: 'Un solo comprimido olvidado', text: 'La actuación a seguir depende principalmente del tiempo transcurrido desde la hora habitual de la toma.'},
      {title: 'Varios comprimidos olvidados', text: 'La situación requiere una atención especial y es preferible comprobar con precisión el prospecto.'},
      {title: 'Duda sobre la actuación a seguir', text: 'Una farmacia o un profesional de la salud puede ayudarte rápidamente a identificar la actuación correcta.'},
    ],
    body4: 'El prospecto de tu píldora da las instrucciones precisas correspondientes al medicamento que tomas. Las recomendaciones pueden diferir según se trate de una píldora combinada o de una píldora de progestágeno solo.',
    referenceTitle: 'Comprobaciones útiles',
    referenceTips: [
      'Guarda el prospecto accesible (por ejemplo, una foto en el teléfono)',
      'Contacta con una farmacéutica en caso de duda rápida',
      'Consulta si el olvido se repite con frecuencia',
    ],
    guideTitle: '¿Por qué importa el momento del olvido?',
    guideText: 'El momento en que ocurre el olvido dentro del blíster puede modificar la actuación a seguir. Por eso el prospecto suele indicar recomendaciones diferentes según la semana de toma.',
    body5: 'Si no sabes qué actuación adoptar, es mejor pedir consejo que quedarte con la duda. Una farmacia, una matrona o un médico puede ayudarte a comprobar las recomendaciones adaptadas a tu situación.',
    questionTitle: 'La información que debes preparar',
    questions: [
      '¿Qué tipo de píldora es exactamente?',
      '¿Cuánto tiempo ha pasado desde la hora habitual?',
      '¿Cuántos comprimidos se han olvidado?',
      '¿En qué momento del blíster se produjo el olvido?',
      '¿Ha habido alguna relación sexual sin protección recientemente?',
    ],
    proTipTitle: 'DATO ÚTIL',
    proTipText: 'Si ha habido una relación sexual sin protección alrededor del período del olvido, pide consejo rápidamente a un profesional para conocer las opciones posibles.',
    repeatTitle: 'Si los olvidos se repiten',
    body6: 'Los olvidos frecuentes pueden ser una señal de que la forma de toma diaria no se ajusta bien a tu ritmo de vida. No dudes en hablarlo con un profesional de la salud para explorar otras opciones anticonceptivas.',
    methodTipTitle: '¿Otro método?',
    methodTipText: 'Si tomar un comprimido cada día resulta difícil de mantener, existen otros métodos con una frecuencia de uso diferente.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'Reacciona en cuanto detectes el olvido.',
      'Comprueba el tipo exacto de tu píldora.',
      'Consulta el prospecto para conocer la actuación precisa.',
      'Usa una protección complementaria si el prospecto lo recomienda.',
      'Pide consejo en caso de duda o de relación de riesgo.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText: 'Un olvido no significa automáticamente que tu anticoncepción haya dejado de funcionar. La actuación correcta depende del tipo de píldora y de las circunstancias del olvido. En caso de duda, consulta el prospecto y pide consejo rápidamente.',
    disclaimerText: 'Este artículo se ofrece con fines informativos y no sustituye el prospecto de tu medicamento ni un consejo médico personalizado. Las recomendaciones pueden variar según el tipo de píldora.',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MissedPillsArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'fr' ? 'fr' : i18n.language === 'es' ? 'es' : 'en';
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
        {/* HERO */}

        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
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

        {/* ARTICLE */}

        <View style={styles.article}>
          {/* CATEGORY */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* METADATA */}

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

          {/* INTRO */}

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* IMPORTANT */}

          <View style={styles.importantCard}>
            <View style={styles.importantIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.importantCopy}>
              <Text style={styles.importantTitle}>{content.importantTitle}</Text>

              <Text style={styles.importantText}>
                {content.importantText}
              </Text>
            </View>
          </View>

          {/* TABLE OF CONTENTS */}

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

          {/* SECTION 1 */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>

              <Text style={styles.stepTitle}>{content.step1Title}</Text>
            </View>

            <Text style={styles.stepText}>
              {content.step1Text}
            </Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>

              <Text style={styles.stepTitle}>{content.step2Title}</Text>
            </View>

            <Text style={styles.stepText}>
              {content.step2Text}
            </Text>
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

          {/* SECTION 2 */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={25}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>

              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          {/* QUICK GUIDE */}

          <Text style={styles.h3}>{content.reflexesTitle}</Text>

          <View style={styles.checkList}>
            {content.checkPoints.map((item, index) => (
              <View key={item.title} style={styles.checkRow}>
                <View style={styles.checkIcon}>
                  <MaterialDesignIcons
                    name={CHECK_ICONS[index] as never}
                    size={18}
                    color={theme.colors.success}
                  />
                </View>

                <View style={styles.checkCopy}>
                  <Text style={styles.checkTitle}>{item.title}</Text>

                  <Text style={styles.checkText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.situationList}>
            {content.situations.map((item, index) => (
              <View key={item.title} style={styles.situationCard}>
                <View style={styles.situationIcon}>
                  <MaterialDesignIcons
                    name={SITUATION_ICONS[index] as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.situationCopy}>
                  <Text style={styles.situationTitle}>{item.title}</Text>

                  <Text style={styles.situationText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.referenceCard}>
            <View style={styles.referenceHeader}>
              <MaterialDesignIcons
                name="file-document-check-outline"
                size={23}
                color={theme.colors.primary}
              />

              <Text style={styles.referenceTitle}>
                {content.referenceTitle}
              </Text>
            </View>

            {content.referenceTips.map((item, index) => (
              <View key={item} style={styles.referenceRow}>
                <View style={styles.referenceNumber}>
                  <Text style={styles.referenceNumberText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.referenceText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* MINI GUIDE */}

          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <MaterialDesignIcons
                name="compass-outline"
                size={23}
                color={theme.colors.primary}
              />

              <Text style={styles.guideTitle}>
                {content.guideTitle}
              </Text>
            </View>

            <Text style={styles.guideText}>
              {content.guideText}
            </Text>
          </View>

          {/* SECTION 5 */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>
            {content.body5}
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={23}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                {content.questionTitle}
              </Text>
            </View>

            {content.questions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>

                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.proTipTitle}</Text>

              <Text style={styles.tipText}>
                {content.proTipText}
              </Text>
            </View>
          </View>

          {/* REPEATED FORGETTING */}

          <Text style={styles.h3}>{content.repeatTitle}</Text>

          <Text style={styles.body}>
            {content.body6}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-sync-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.methodTipTitle}</Text>

              <Text style={styles.tipText}>
                {content.methodTipText}
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryItems[0]}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryItems[1]}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryItems[2]}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryItems[3]}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                {content.summaryItems[4]}
              </Text>
            </View>
          </View>

          {/* FINAL MESSAGE */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>

              <Text style={styles.tipText}>
                {content.finalTipText}
              </Text>
            </View>
          </View>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

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

  pressed: {
    opacity: 0.74,
  },

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

  badgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  importantCard: {
    marginTop: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  importantIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  importantCopy: {
    flex: 1,
    marginLeft: 11,
  },

  importantTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  importantText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 24,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  h3: {
    marginTop: 22,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '800',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  stepCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  stepNumberText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  stepTitle: {
    marginLeft: 10,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  stepText: {
    marginTop: 8,
    marginLeft: 40,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkList: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  checkCopy: {
    flex: 1,
    marginLeft: 10,
  },

  checkTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  checkText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  situationList: {
    marginTop: 14,
    gap: 10,
  },

  situationCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  situationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  situationCopy: {
    flex: 1,
    marginLeft: 11,
  },

  situationTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  situationText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  referenceCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  referenceTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  referenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  referenceNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  referenceNumberText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  referenceText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  guideCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  guideTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '800',
  },

  guideText: {
    marginTop: 9,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  questionTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  questionNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  professionalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
  });
}
