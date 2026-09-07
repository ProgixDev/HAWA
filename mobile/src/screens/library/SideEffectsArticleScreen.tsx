import React, {useEffect, useMemo, useRef, useState} from 'react';
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

const ID = 'sideeffects-reconnaitre-les-effets-secondaires';

const HERO = require('../../assets/images/library/featured-pain.png');

const WORTH_MENTIONING = [
  'Des changements d’humeur marqués et persistants',
  'Une baisse de libido qui te gêne',
  'Des saignements irréguliers qui durent plus de 3 cycles',
  'Des nausées ou maux de tête qui restent gênants',
];

const COMMON_EFFECTS = [
  {
    icon: 'water-outline',
    title: 'Petits saignements',
    text: 'Des saignements irréguliers peuvent apparaître, notamment au début d’une nouvelle méthode.',
  },
  {
    icon: 'heart-outline',
    title: 'Sensibilité des seins',
    text: 'Une tension ou une sensibilité des seins peut être ressentie temporairement.',
  },
  {
    icon: 'emoticon-outline',
    title: 'Humeur',
    text: 'Certaines personnes remarquent des variations d’humeur ou une plus grande sensibilité émotionnelle.',
  },
  {
    icon: 'head-outline',
    title: 'Maux de tête',
    text: 'De légers maux de tête peuvent survenir pendant la période d’adaptation.',
  },
];

const QUESTIONS = [
  'Depuis quand ces symptômes ont-ils commencé ?',
  'Sont-ils apparus après le début ou le changement d’une contraception ?',
  'Sont-ils légers, gênants ou vraiment inhabituels pour toi ?',
  'S’améliorent-ils avec le temps ou deviennent-ils plus fréquents ?',
];

const URGENT_SIGNS = [
  'Douleur thoracique importante ou inhabituelle',
  'Difficulté soudaine à respirer',
  'Gonflement ou douleur inhabituelle d’une jambe',
  'Mal de tête brutal, très intense ou inhabituel',
  'Trouble soudain de la vision, de la parole ou de la force',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function SideEffectsArticleScreen({
  navigation,
}: Props): React.JSX.Element {
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
      message: 'Reconnaître les effets secondaires possibles — AWA',
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
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajouter aux favoris"
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
                accessibilityLabel="Partager"
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

        {/* ARTICLE HEADER */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EFFETS SECONDAIRES</Text>
          </View>

          <Text style={styles.title}>
            Reconnaître les effets{`\n`}secondaires possibles
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '8 min de lecture'],
              ['book-open-page-variant-outline', 'Article'],
              ['chart-bar', 'Intermédiaire'],
              ['shield-check-outline', 'Contenu validé'],
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
            Certains effets peuvent être fréquents et temporaires. D’autres
            nécessitent davantage d’attention. Apprends à distinguer les
            réactions habituelles des signes qui doivent être évalués.
          </Text>

          {/* CONTENTS */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Des effets courants et bénins',
              'Le temps d’adaptation du corps',
              'Observer ce qui change',
              'Quand demander un avis médical',
              'Quand consulter rapidement',
              'À retenir',
            ].map((item, index) => (
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

          <Text style={styles.h2}>1. Des effets courants et bénins</Text>

          <Text style={styles.body}>
            Lorsqu’une personne commence une nouvelle contraception hormonale,
            le corps peut avoir besoin d’un temps d’adaptation. De petits
            changements peuvent apparaître au niveau du cycle, de l’humeur ou
            du confort physique.
          </Text>

          <Text style={styles.body}>
            Ces manifestations sont souvent modérées et peuvent diminuer
            progressivement. Leur présence ne signifie pas automatiquement
            que la méthode est dangereuse ou qu’elle doit être arrêtée.
          </Text>

          <View style={styles.commonGrid}>
            {COMMON_EFFECTS.map(item => (
              <View key={item.title} style={styles.commonCard}>
                <View style={styles.commonIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.commonTitle}>{item.title}</Text>

                <Text style={styles.commonText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* SECTION 2 */}

          <Text style={styles.h2}>2. Le temps d’adaptation du corps</Text>

          <Text style={styles.body}>
            Les premières semaines ou les premiers cycles peuvent être
            différents de ce que tu connaissais auparavant. Le corps peut
            progressivement s’adapter au nouveau fonctionnement hormonal.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Un effet apparu peu après le début d’une méthode mérite d’être
                observé dans le temps. S’il devient gênant ou persiste,
                parle-en avec un professionnel de santé.
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Il peut être utile de noter les symptômes dans ton application
            afin de mieux voir leur évolution d’un cycle à l’autre.
          </Text>

          {/* TRACKING CARD */}

          <View style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <View style={styles.trackingIcon}>
                <MaterialDesignIcons
                  name="notebook-edit-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.trackingHeaderCopy}>
                <Text style={styles.trackingTitle}>Observe l’évolution</Text>

                <Text style={styles.trackingSubtitle}>
                  Quelques repères peuvent être utiles
                </Text>
              </View>
            </View>

            <View style={styles.trackingLine}>
              <MaterialDesignIcons
                name="check"
                size={17}
                color={theme.colors.success}
              />

              <Text style={styles.trackingText}>
                Note la date d’apparition du symptôme.
              </Text>
            </View>

            <View style={styles.trackingLine}>
              <MaterialDesignIcons
                name="check"
                size={17}
                color={theme.colors.success}
              />

              <Text style={styles.trackingText}>
                Indique son intensité et sa durée.
              </Text>
            </View>

            <View style={styles.trackingLine}>
              <MaterialDesignIcons
                name="check"
                size={17}
                color={theme.colors.success}
              />

              <Text style={styles.trackingText}>
                Observe s’il s’améliore ou s’aggrave.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>3. Observer ce qui change</Text>

          <Text style={styles.body}>
            Tous les symptômes ne sont pas forcément liés à la contraception.
            Le stress, le sommeil, l’alimentation, le cycle ou d’autres
            traitements peuvent également influencer la façon dont tu te
            sens.
          </Text>

          <Text style={styles.body}>
            Pour comprendre la situation, essaie de regarder le contexte
            général plutôt que de considérer un symptôme isolé.
          </Text>

          <View style={styles.checkList}>
            {WORTH_MENTIONING.map(item => (
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

          {/* QUESTIONS */}

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="help-circle-outline"
                size={23}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                Quelques questions utiles
              </Text>
            </View>

            {QUESTIONS.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionNumberCircle}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>

                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>4. Quand demander un avis médical</Text>

          <Text style={styles.body}>
            Même lorsqu’un symptôme n’est pas urgent, il peut être utile
            d’en parler si celui-ci devient gênant, persiste ou modifie
            réellement ta qualité de vie.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons
                name="stethoscope"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                Un avis peut être utile si…
              </Text>

              <Text style={styles.infoText}>
                les symptômes persistent, deviennent plus importants ou
                t’empêchent de vivre normalement.
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Un médecin, une sage-femme ou un pharmacien peut t’aider à
            déterminer si les symptômes peuvent être liés à la méthode
            utilisée et s’il est nécessaire de l’adapter.
          </Text>

          {/* SECTION 5 */}

          <Text style={styles.h2}>5. Quand consulter rapidement</Text>

          <Text style={styles.body}>
            Certains signes sont inhabituels et nécessitent une évaluation
            médicale rapide. Ils ne signifient pas forcément qu’une
            complication est présente, mais ils ne doivent pas être ignorés.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={25}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.alertTitle}>Consulter rapidement</Text>

              <Text style={styles.alertIntro}>
                Demande rapidement un avis médical si tu présentes notamment :
              </Text>

              {URGENT_SIGNS.map(item => (
                <View key={item} style={styles.alertRow}>
                  <View style={styles.alertDot} />

                  <Text style={styles.alertText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* EMERGENCY NOTE */}

          <View style={styles.emergencyCard}>
            <MaterialDesignIcons
              name="phone-alert-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.emergencyTitle}>En cas de situation sévère</Text>

              <Text style={styles.emergencyText}>
                Si les symptômes sont soudains, très importants ou
                s’accompagnent d’une difficulté à respirer, d’un malaise ou
                d’un autre signe grave, recherche une aide médicale urgente.
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>6. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>L’essentiel</Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Certains effets peuvent apparaître au début d’une nouvelle
                contraception hormonale.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Beaucoup de manifestations sont temporaires et peuvent
                diminuer avec le temps.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Un symptôme gênant ou persistant mérite d’être discuté avec
                un professionnel.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Certains signes inhabituels nécessitent un avis médical
                rapide.
              </Text>
            </View>
          </View>

          {/* FINAL TIP */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>

              <Text style={styles.tipText}>
                Écouter ton corps ne signifie pas forcément arrêter
                immédiatement une méthode. Note ce que tu ressens, observe
                son évolution et demande conseil lorsqu’un symptôme te
                préoccupe.
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
              Cet article a une vocation informative et ne remplace pas un
              avis médical personnalisé. En cas de symptôme important ou
              inhabituel, demande conseil à un professionnel de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={8}
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

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  commonGrid: {
    marginTop: 14,
    gap: 10,
  },

  commonCard: {
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  commonIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  commonTitle: {
    marginTop: 9,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  commonText: {
    marginTop: 4,
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

  trackingCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  trackingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  trackingHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  trackingTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  trackingSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  trackingLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },

  trackingText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  checkList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
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
    marginBottom: 14,
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

  questionNumberCircle: {
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

  infoCard: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  alert: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  alertTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  alertIntro: {
    marginTop: 5,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },

  alertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
    backgroundColor: theme.colors.warning,
  },

  alertText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  emergencyCard: {
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emergencyTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  emergencyText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
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
