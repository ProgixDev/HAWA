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
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenstruationPurityArticleScreen({
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
