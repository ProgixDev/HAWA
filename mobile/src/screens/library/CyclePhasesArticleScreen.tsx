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
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import ReadingControls from '../../components/articles/ReadingControls';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

const ARTICLE_ID = 'cycle-phases-expliquees';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');
const DIAGRAM = require('../../assets/images/library/cycle-phases-diagram.png');

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

const BODY_CHANGES = [
  {
    icon: 'water-outline',
    title: 'Pendant les règles',
    text: 'Ton énergie peut être plus basse et ton corps peut avoir besoin de davantage de repos.',
  },
  {
    icon: 'leaf',
    title: 'Phase folliculaire',
    text: 'L’énergie remonte progressivement et tu peux te sentir plus dynamique.',
  },
  {
    icon: 'white-balance-sunny',
    title: 'Autour de l’ovulation',
    text: 'Certaines femmes ressentent davantage d’énergie, de motivation et de confiance.',
  },
  {
    icon: 'weather-night',
    title: 'Phase lutéale',
    text: 'La fatigue, les ballonnements ou les variations d’humeur peuvent apparaître.',
  },
] as const;

const WHY_ITEMS = [
  {
    icon: 'heart-pulse',
    text: 'Mieux comprendre les signaux de ton corps',
  },
  {
    icon: 'calendar-check-outline',
    text: 'Anticiper tes règles et tes différentes phases',
  },
  {
    icon: 'emoticon-happy-outline',
    text: 'Comprendre certaines variations d’humeur',
  },
  {
    icon: 'lightning-bolt',
    text: 'Adapter ton activité selon ton niveau d’énergie',
  },
  {
    icon: 'notebook-edit-outline',
    text: 'Améliorer ton suivi quotidien',
  },
] as const;

const FAQ = [
  {
    question:
      'Est-ce normal que mon cycle ne dure pas exactement 28 jours ?',
    answer:
      'Oui. La durée d’un cycle peut varier d’une personne à l’autre et même légèrement d’un mois à l’autre.',
  },
  {
    question:
      'L’ovulation a-t-elle toujours lieu au jour 14 ?',
    answer:
      'Non. Le jour 14 est une estimation courante pour un cycle de 28 jours, mais l’ovulation peut survenir plus tôt ou plus tard.',
  },
  {
    question:
      'Pourquoi mes symptômes changent-ils selon les phases ?',
    answer:
      'Les variations hormonales au cours du cycle peuvent influencer l’énergie, l’humeur, le sommeil et certaines sensations physiques.',
  },
  {
    question:
      'Est-ce utile de suivre mes symptômes ?',
    answer:
      'Oui. Les noter régulièrement peut t’aider à reconnaître tes propres tendances et à mieux comprendre ton rythme.',
  },
] as const;

function CyclePhasesArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [bookmarked, setBookmarked] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(
    null,
  );
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setBookmarked(
          isArticleBookmarked(ARTICLE_ID),
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleShare = () => {
    Share.share({
      message:
        'Les différentes phases du cycle expliquées — AWA',
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
        showsVerticalScrollIndicator={false}
        onScroll={event =>
          saveScrollPosition(
            ARTICLE_ID,
            event.nativeEvent.contentOffset.y,
          )
        }
        scrollEventThrottle={200}
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.topBar,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}>
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() =>
                navigation.goBack()
              }
              style={({pressed}) => [
                styles.circleButton,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.text}
                name="chevron-left"
                size={23}
              />
            </Pressable>

            <View style={styles.topActions}>
              <Pressable
                accessibilityLabel="Favori"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() =>
                  setBookmarked(
                    toggleBookmark(ARTICLE_ID),
                  )
                }
                style={({pressed}) => [
                  styles.circleButton,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name={
                    bookmarked
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                />
              </Pressable>

              <Pressable
                accessibilityLabel="Partager"
                accessibilityRole="button"
                hitSlop={10}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circleButton,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="share-variant-outline"
                  size={20}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Cycle menstruel
            </Text>
          </View>

          <Text style={styles.title}>
            Les différentes phases{`\n`}
            du cycle expliquées
          </Text>

          <View style={styles.metaRow}>
            {[
              [
                'clock-outline',
                '6 min de lecture',
              ],
              [
                'shield-check-outline',
                'Contenu validé',
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View
                    style={styles.metaDivider}
                  />
                ) : null}

                <View style={styles.meta}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={14}
                    color={theme.colors.textMuted}
                  />

                  <Text style={styles.metaText}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            Ton cycle menstruel se compose de
            plusieurs phases, chacune ayant un rôle
            essentiel dans ton équilibre hormonal et
            ta santé.
          </Text>

          {/* SOMMAIRE */}
          <View style={styles.contentsCard}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Les 4 phases du cycle',
              'Comment ton corps change',
              'Pourquoi comprendre ton cycle est important',
              'Questions fréquentes',
            ].map((text, index) => (
              <View
                key={text}
                style={styles.contentsRow}>
                <View style={styles.contentsLeft}>
                  <Text
                    style={styles.contentsNumber}>
                    {index + 1}.
                  </Text>

                  <Text
                    style={styles.contentsText}>
                    {text}
                  </Text>
                </View>

                {/* Kept as textMuted (not the dominant accent): this chevron
                    was already a distinct muted gray in the original design,
                    not the PURPLE accent used for contentsNumber. */}
                <MaterialDesignIcons
                  name="chevron-right"
                  color={theme.colors.textMuted}
                  size={19}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}
          <Text style={styles.sectionTitle}>
            1. Les 4 phases du cycle
          </Text>

          <Text style={styles.body}>
            Ton cycle est généralement divisé en
            quatre phases principales. Leur durée
            peut varier d’une personne à l’autre :
            chaque corps possède son propre rythme.
          </Text>

          <View style={styles.diagramCard}>
            <View style={styles.phaseRow}>
              <View style={styles.phaseCopy}>
                <Text style={styles.phaseName}>
                  Phase menstruelle
                </Text>

                <Text style={styles.phaseDays}>
                  Jours 1 à 5
                </Text>
              </View>

              <View style={styles.phaseCopy}>
                <Text
                  style={[
                    styles.phaseName,
                    styles.right,
                  ]}>
                  Phase folliculaire
                </Text>

                <Text
                  style={[
                    styles.phaseDays,
                    styles.right,
                  ]}>
                  Jours 1 à 13
                </Text>
              </View>
            </View>

            <Image
              source={DIAGRAM}
              style={styles.diagram}
              resizeMode="cover"
            />

            <View style={styles.phaseRow}>
              <View style={styles.phaseCopy}>
                <Text style={styles.phaseName}>
                  Phase lutéale
                </Text>

                <Text style={styles.phaseDays}>
                  Jours 15 à 28
                </Text>
              </View>

              <View style={styles.phaseCopy}>
                <Text
                  style={[
                    styles.phaseName,
                    styles.right,
                  ]}>
                  Phase ovulatoire
                </Text>

                <Text
                  style={[
                    styles.phaseDays,
                    styles.right,
                  ]}>
                  Autour du jour 14
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="lightbulb-outline"
              size={24}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                Chaque femme est unique : observe
                ton corps et apprends à connaître
                ton propre rythme.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.sectionTitle}>
            2. Comment ton corps change
          </Text>

          <Text style={styles.body}>
            Les variations hormonales peuvent
            influencer ton énergie, ton humeur, ton
            sommeil et certaines sensations
            physiques tout au long du cycle.
          </Text>

          <View style={styles.changeGrid}>
            {BODY_CHANGES.map(item => (
              <View
                key={item.title}
                style={styles.changeCard}>
                <View style={styles.changeIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.changeTitle}>
                  {item.title}
                </Text>

                <Text style={styles.changeText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.softTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Écoute ton corps
              </Text>

              <Text style={styles.tipText}>
                Il n’existe pas une seule façon de
                vivre chaque phase. Tes sensations
                personnelles restent le meilleur
                repère.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.sectionTitle}>
            3. Pourquoi comprendre ton cycle est important
          </Text>

          <Text style={styles.body}>
            Mieux connaître ton cycle peut t’aider à
            anticiper certaines périodes et à
            comprendre les changements que tu
            observes dans ton quotidien.
          </Text>

          <View style={styles.whyCard}>
            {WHY_ITEMS.map((item, index) => (
              <View
                key={item.text}
                style={[
                  styles.whyRow,
                  index <
                    WHY_ITEMS.length - 1 &&
                    styles.whyDivider,
                ]}>
                <View style={styles.whyIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.whyText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}
          <Text style={styles.sectionTitle}>
            4. Questions fréquentes
          </Text>

          <Text style={styles.body}>
            Voici quelques réponses aux questions
            souvent posées sur les différentes
            phases du cycle.
          </Text>

          <View style={styles.faqList}>
            {FAQ.map((item, index) => {
              const opened = openFaq === index;

              return (
                <Pressable
                  key={item.question}
                  onPress={() =>
                    setOpenFaq(
                      opened ? null : index,
                    )
                  }
                  style={({pressed}) => [
                    styles.faqCard,
                    opened &&
                      styles.faqCardOpen,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.faqHeader}>
                    <Text
                      style={styles.faqQuestion}>
                      {item.question}
                    </Text>

                    <View
                      style={[
                        styles.faqChevron,
                        opened &&
                          styles.faqChevronOpen,
                      ]}>
                      <MaterialDesignIcons
                        name={
                          opened
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={18}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>

                  {opened ? (
                    <Text style={styles.faqAnswer}>
                      {item.answer}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.endCard}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.endCopy}>
              <Text style={styles.endTitle}>
                Ton cycle, ton rythme
              </Text>

              <Text style={styles.endText}>
                Plus tu observes ton cycle, plus tu
                peux comprendre ce qui est habituel
                pour toi.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ARTICLE_ID}
        durationMinutes={6}
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
      height: 270,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    hero: {
      width: '100%',
      height: '100%',
    },

    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    topActions: {
      flexDirection: 'row',
      gap: 8,
    },

    circleButton: {
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
      opacity: 0.72,
    },

    article: {
      marginTop: -14,
      paddingHorizontal: 19,
      paddingTop: 20,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },

    title: {
      marginTop: 12,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 25,
      lineHeight: 30,
      fontWeight: '700',
    },

    metaRow: {
      marginTop: 13,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 12,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaDivider: {
      width: 1,
      height: 18,
      backgroundColor: theme.colors.border,
    },

    metaText: {
      color: theme.colors.textMuted,
      fontSize: 10,
    },

    intro: {
      marginTop: 17,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 21,
    },

    contentsCard: {
      marginTop: 18,
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    contentsTitle: {
      marginBottom: 7,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    contentsRow: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    contentsLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    contentsNumber: {
      width: 23,
      color: theme.colors.primary,
      fontSize: 11.5,
      fontWeight: '800',
    },

    contentsText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
    },

    sectionTitle: {
      marginTop: 24,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 21,
      lineHeight: 27,
      fontWeight: '700',
    },

    body: {
      marginTop: 9,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 21,
    },

    diagramCard: {
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    diagram: {
      alignSelf: 'center',
      width: 220,
      height: 220,
      borderRadius: 110,
    },

    phaseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    phaseCopy: {
      width: '46%',
    },

    phaseName: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
    },

    phaseDays: {
      marginTop: 3,
      color: theme.colors.textMuted,
      fontSize: 9.5,
    },

    right: {
      textAlign: 'right',
    },

    tip: {
      marginTop: 17,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    softTip: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    tipCopy: {
      flex: 1,
      marginLeft: 12,
    },

    tipTitle: {
      color: theme.colors.primary,
      fontSize: 12.5,
      fontWeight: '800',
    },

    tipText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11.5,
      lineHeight: 17,
    },

    changeGrid: {
      marginTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    changeCard: {
      width: '48.7%',
      minHeight: 142,
      padding: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    changeIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    changeTitle: {
      marginTop: 9,
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
    },

    changeText: {
      marginTop: 5,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    whyCard: {
      marginTop: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    whyRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
    },

    whyDivider: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },

    whyIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    whyText: {
      flex: 1,
      marginLeft: 11,
      color: theme.colors.text,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '600',
    },

    faqList: {
      marginTop: 14,
      gap: 8,
    },

    faqCard: {
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    faqCardOpen: {
      borderColor: theme.colors.primary,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    faqQuestion: {
      flex: 1,
      paddingRight: 10,
      color: theme.colors.text,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '700',
    },

    faqChevron: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    faqChevronOpen: {
      backgroundColor: withAlpha(theme.colors.primary, 0.18),
    },

    faqAnswer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth:
        StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 17,
    },

    endCard: {
      marginTop: 18,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
    },

    endCopy: {
      flex: 1,
      marginLeft: 12,
    },

    endTitle: {
      color: theme.colors.text,
      fontSize: 12.5,
      fontWeight: '800',
    },

    endText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16,
    },
  });
}

export default CyclePhasesArticleScreen;
