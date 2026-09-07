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
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';

const ID = 'hormonaltreatments-panorama';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

const METHODS = [
  {
    icon: 'pill',
    title: 'Pilule',
    frequency: 'Chaque jour',
    duration: 'À prendre régulièrement',
    profile: 'Idéale si tu veux gérer toi-même ta contraception',
  },
  {
    icon: 'bandage',
    title: 'Patch',
    frequency: 'Chaque semaine',
    duration: '3 semaines sur 4',
    profile: 'Pratique si tu préfères éviter une prise quotidienne',
  },
  {
    icon: 'circle-outline',
    title: 'Anneau vaginal',
    frequency: 'Toutes les 3 semaines',
    duration: 'Avec une semaine de pause',
    profile: 'Une option discrète avec peu de gestes au quotidien',
  },
  {
    icon: 'needle',
    title: 'Implant',
    frequency: 'Plusieurs années',
    duration: 'Sans prise quotidienne',
    profile: 'Adapté si tu souhaites une contraception longue durée',
  },
  {
    icon: 'record-circle-outline',
    title: 'Stérilet hormonal',
    frequency: 'Plusieurs années',
    duration: 'Placé par un professionnel',
    profile: 'Une solution longue durée nécessitant très peu d’entretien',
  },
] as const;

const CHOICE_CRITERIA = [
  {
    icon: 'calendar-clock-outline',
    title: 'Ton quotidien',
    text: 'Certaines méthodes demandent une action quotidienne, tandis que d’autres fonctionnent pendant plusieurs semaines ou années.',
  },
  {
    icon: 'heart-pulse',
    title: 'Ta tolérance',
    text: 'Les effets ressentis peuvent varier selon la méthode. Une discussion avec un professionnel permet d’évaluer ce qui te convient.',
  },
  {
    icon: 'baby-face-outline',
    title: 'Tes projets',
    text: 'Si tu souhaites une grossesse prochainement ou plus tard, la durée et la réversibilité de la méthode peuvent guider ton choix.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Tes priorités',
    text: 'Discrétion, simplicité, absence de prise quotidienne ou durée prolongée : tes priorités comptent dans la décision.',
  },
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function HormonalTreatmentsPanoramaArticleScreen({
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
      message: 'Panorama des traitements hormonaux contraceptifs — AWA',
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
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
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

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>TRAITEMENTS HORMONAUX</Text>
          </View>

          <Text style={styles.title}>
            Panorama des traitements hormonaux contraceptifs
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
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
            Pilule, patch, anneau, implant, stérilet hormonal : ce qui les
            distingue et comment réfléchir à la méthode qui correspond le
            mieux à ton quotidien.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Un principe d’action commun',
              'Les différentes méthodes',
              'Comment orienter son choix',
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
          <Text style={styles.h2}>1. Un principe d’action commun</Text>

          <Text style={styles.body}>
            Les méthodes hormonales utilisent des hormones pour prévenir une
            grossesse. Selon la méthode, elles peuvent principalement empêcher
            l’ovulation, épaissir la glaire cervicale et modifier
            l’environnement de l’utérus.
          </Text>

          <View style={styles.actionDiagram}>
            <View style={styles.diagramHeader}>
              <View style={styles.diagramHeaderIcon}>
                <MaterialDesignIcons
                  name="shield-check-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.diagramHeaderCopy}>
                <Text style={styles.diagramTitle}>
                  Comment agit la contraception hormonale ?
                </Text>

                <Text style={styles.diagramSubtitle}>
                  Plusieurs mécanismes peuvent participer à la protection.
                </Text>
              </View>
            </View>

            <View style={styles.diagramLine} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>

              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Ovulation</Text>

                <Text style={styles.stepText}>
                  Certaines méthodes empêchent ou inhibent la libération de
                  l’ovule.
                </Text>
              </View>
            </View>

            <View style={styles.diagramConnector} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>

              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Glaire cervicale</Text>

                <Text style={styles.stepText}>
                  La glaire peut devenir plus épaisse, ce qui rend le passage
                  des spermatozoïdes plus difficile.
                </Text>
              </View>
            </View>

            <View style={styles.diagramConnector} />

            <View style={styles.diagramStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>

              <View style={styles.stepCopy}>
                <Text style={styles.stepTitle}>Protection contraceptive</Text>

                <Text style={styles.stepText}>
                  L’association de ces mécanismes contribue à réduire le risque
                  de grossesse.
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. Les différentes méthodes</Text>

          <Text style={styles.body}>
            Toutes les méthodes ne demandent pas le même niveau d’implication.
            Le principal point de différence est la fréquence à laquelle tu
            dois penser à ta contraception.
          </Text>

          <View style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <View>
                <Text style={styles.comparisonTitle}>
                  Comparer les méthodes
                </Text>

                <Text style={styles.comparisonSubtitle}>
                  Du geste quotidien à la protection longue durée
                </Text>
              </View>

              <View style={styles.comparisonIcon}>
                <MaterialDesignIcons
                  name="scale-balance"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>
            </View>

            <View style={styles.frequencyScale}>
              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <Text style={styles.scaleText}>Quotidien</Text>
              </View>

              <View style={styles.scaleLine} />

              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <Text style={styles.scaleText}>Hebdomadaire</Text>
              </View>

              <View style={styles.scaleLine} />

              <View style={styles.scalePoint}>
                <View style={styles.scaleDot} />
                <Text style={styles.scaleText}>Longue durée</Text>
              </View>
            </View>

            <View style={styles.methodList}>
              {METHODS.map((method, index) => (
                <View
                  key={method.title}
                  style={[
                    styles.methodCard,
                    index === METHODS.length - 1 && styles.methodCardLast,
                  ]}>
                  <View style={styles.methodIcon}>
                    <MaterialDesignIcons
                      name={method.icon as never}
                      size={23}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.methodMain}>
                    <View style={styles.methodTitleRow}>
                      <Text style={styles.methodTitle}>{method.title}</Text>

                      <View style={styles.frequencyBadge}>
                        <Text style={styles.frequencyBadgeText}>
                          {method.frequency}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.methodDuration}>
                      {method.duration}
                    </Text>

                    <Text style={styles.methodProfile}>
                      {method.profile}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.highlightBox}>
            <View style={styles.highlightIcon}>
              <MaterialDesignIcons
                name="clock-check-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Le point commun à retenir
              </Text>

              <Text style={styles.highlightText}>
                Plus une méthode réduit les gestes à effectuer au quotidien,
                moins tu as besoin d’y penser régulièrement. Cela peut être
                intéressant si tu sais que tu risques d’oublier une prise ou
                un changement.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. Comment orienter son choix</Text>

          <Text style={styles.body}>
            Il n’existe pas une méthode idéale pour tout le monde. Le meilleur
            choix dépend de ton quotidien, de tes préférences, de ta tolérance
            et de tes projets.
          </Text>

          <View style={styles.criteriaGrid}>
            {CHOICE_CRITERIA.map(criterion => (
              <View key={criterion.title} style={styles.criteriaCard}>
                <View style={styles.criteriaIcon}>
                  <MaterialDesignIcons
                    name={criterion.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.criteriaTitle}>{criterion.title}</Text>

                <Text style={styles.criteriaText}>{criterion.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.choiceDiagram}>
            <View style={styles.choiceDiagramHeader}>
              <MaterialDesignIcons
                name="compass-outline"
                size={23}
                color={theme.colors.primary}
              />

              <Text style={styles.choiceDiagramTitle}>
                Une petite question pour t’orienter
              </Text>
            </View>

            <Text style={styles.questionText}>
              « Est-ce que je préfère penser à ma contraception tous les jours,
              toutes les semaines, ou seulement quelques fois par an ? »
            </Text>

            <View style={styles.choiceOptions}>
              <View style={styles.choiceOption}>
                <Text style={styles.choiceOptionTitle}>Souvent</Text>
                <Text style={styles.choiceOptionText}>
                  Pilule ou méthode nécessitant un suivi régulier
                </Text>
              </View>

              <View style={styles.choiceOption}>
                <Text style={styles.choiceOptionTitle}>Moins souvent</Text>
                <Text style={styles.choiceOptionText}>
                  Patch ou anneau selon le rythme choisi
                </Text>
              </View>

              <View style={styles.choiceOption}>
                <Text style={styles.choiceOptionTitle}>Très rarement</Text>
                <Text style={styles.choiceOptionText}>
                  Implant ou stérilet hormonal longue durée
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>

              <Text style={styles.tipText}>
                Le choix d’une contraception hormonale doit tenir compte de ta
                situation personnelle et médicale. Un professionnel de santé
                peut t’aider à comparer les bénéfices, les risques,
                contre-indications et effets indésirables possibles.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <MaterialDesignIcons
                  name="check-decagram-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.summaryHeaderCopy}>
                <Text style={styles.summaryTitle}>L’essentiel</Text>

                <Text style={styles.summarySubtitle}>
                  Les points importants à garder en tête
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Les méthodes hormonales utilisent différentes combinaisons
                d’hormones et différents rythmes d’utilisation.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Pilule, patch et anneau demandent une implication régulière,
                tandis que l’implant et le stérilet hormonal sont des méthodes
                longue durée.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Le choix doit être adapté à ton quotidien, tes préférences,
                ta tolérance et tes projets.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check-circle-outline"
                size={19}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Aucune méthode n’est universellement « meilleure » : elle doit
                surtout être compatible avec tes besoins et ta situation.
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
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Prendre le temps de comparer les méthodes avec un professionnel
                de santé permet de choisir une contraception que tu peux
                utiliser sereinement et régulièrement.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 23,
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
    marginTop: 26,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /*
   * ACTION DIAGRAM
   */

  actionDiagram: {
    marginTop: 15,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  diagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  diagramHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  diagramHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  diagramTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.text,
    fontWeight: '800',
  },

  diagramSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  diagramLine: {
    height: 1,
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: theme.colors.border,
  },

  diagramStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },

  stepNumberText: {
    color: onPrimaryTextColor(theme),
    fontSize: 12,
    fontWeight: '800',
  },

  stepCopy: {
    flex: 1,
    marginLeft: 10,
  },

  stepTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  stepText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  diagramConnector: {
    width: 1,
    height: 17,
    marginLeft: 14,
    backgroundColor: theme.colors.border,
  },

  /*
   * COMPARISON
   */

  comparisonCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  comparisonTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comparisonSubtitle: {
    marginTop: 3,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  comparisonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  frequencyScale: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scalePoint: {
    alignItems: 'center',
  },

  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  scaleText: {
    marginTop: 5,
    fontSize: 8.5,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },

  scaleLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 7,
    marginBottom: 14,
    backgroundColor: theme.colors.border,
  },

  methodList: {
    marginTop: 16,
  },

  methodCard: {
    flexDirection: 'row',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  methodCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },

  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  methodMain: {
    flex: 1,
    marginLeft: 11,
  },

  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  methodTitle: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  frequencyBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
  },

  frequencyBadgeText: {
    fontSize: 8.5,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  methodDuration: {
    marginTop: 4,
    fontSize: 10.5,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  methodProfile: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  highlightBox: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  highlightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 10,
  },

  highlightTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /*
   * CHOICE CRITERIA
   */

  criteriaGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  criteriaCard: {
    width: '48.5%',
    minHeight: 165,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  criteriaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  criteriaTitle: {
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  criteriaText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  /*
   * CHOICE DIAGRAM
   */

  choiceDiagram: {
    marginTop: 14,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  choiceDiagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  choiceDiagramTitle: {
    flex: 1,
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  questionText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  choiceOptions: {
    marginTop: 12,
    gap: 8,
  },

  choiceOption: {
    padding: 11,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  choiceOptionTitle: {
    fontSize: 11.5,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  choiceOptionText: {
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },

  /*
   * ALERT
   */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /*
   * SUMMARY
   */

  summaryCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  summaryHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summarySubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  summaryDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /*
   * TIP
   */

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
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
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
