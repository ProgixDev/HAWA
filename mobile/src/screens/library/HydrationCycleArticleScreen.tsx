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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'hydration-bien-shydrater';

const HERO = require('../../assets/images/library/spm-water.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral — only TEXT moves into the bilingual   */
/* CONTENT object below, keyed by index to stay aligned with these icons.    */
/* -------------------------------------------------------------------------- */

const PHASE_NEEDS_ICONS = ['water-outline', 'egg-outline', 'weather-cloudy'] as const;

const DAILY_DRINKS_ICONS = ['cup-water', 'tea', 'cup-outline'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — bilingual editorial content. Article identity (ID, images,      */
/* bookmark/progress keys, JSX structure) is untouched; only this object     */
/* changes per language. The French text below is byte-identical to the      */
/* original — never retyped, only moved into the `fr` key — so the app       */
/* remains fully bilingual rather than having French replaced by English.    */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'CYCLE MENSTRUEL • HYDRATATION',
    title: 'Bien s’hydrater\npendant le cycle',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Contre-intuitif mais vrai : bien t’hydrater aide ton corps à moins retenir d’eau, tout au long de ton cycle.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi l’hydratation compte',
      'Les besoins selon les phases du cycle',
      'Que boire au quotidien ?',
      'Signes d’une hydratation insuffisante',
      'Conseils pratiques',
      'Idées reçues',
      'À retenir',
    ],
    section1Body: 'Contre-intuitif mais vrai : bien s’hydrater aide le corps à moins retenir d’eau et réduit les ballonnements, notamment en fin de cycle.',
    infoTitle: 'Bon à savoir',
    infoText: 'Quand le corps manque d’eau, il a tendance à en stocker davantage par précaution. Boire suffisamment lui indique au contraire qu’il peut en relâcher plus facilement.',
    section2Body: 'Tes besoins en eau restent globalement stables, avec quelques nuances selon la phase :',
    phaseNeeds: [
      {title: 'Pendant les règles', text: 'Un peu plus d’eau aide à compenser les pertes et à limiter les ballonnements.'},
      {title: 'Autour de l’ovulation', text: 'Les besoins restent stables ; une légère hausse de la température corporelle peut augmenter la soif.'},
      {title: 'Phase prémenstruelle', text: 'Une bonne hydratation aide à limiter la sensation de gonflement souvent ressentie à cette période.'},
    ],
    section3Body: 'Vise environ 1,5 à 2 litres par jour, un peu plus pendant les règles pour compenser les pertes.',
    dailyDrinks: [
      {title: 'De l’eau, en priorité', text: 'Environ 1,5 à 2 litres par jour, un peu plus pendant les règles.'},
      {title: 'Des tisanes apaisantes', text: 'Gingembre ou camomille apportent une hydratation douce en période de crampes.'},
      {title: 'Sucre et caféine, avec modération', text: 'Limiter les boissons très sucrées ou caféinées peut aider en fin de cycle.'},
    ],
    warningTitle: 'À surveiller doucement',
    lowHydrationSigns: [
      'Une soif intense ou inhabituelle',
      'Des urines plus foncées que d’habitude',
      'Des maux de tête fréquents',
      'Une fatigue qui ne s’explique pas autrement',
    ],
    section5Body: 'Quelques habitudes simples suffisent souvent à mieux s’hydrater sans y penser :',
    practicalTips: [
      'Garder une bouteille d’eau à portée de main tout au long de la journée',
      'Associer un verre d’eau à une habitude déjà installée (réveil, chaque repas)',
      'Varier avec des infusions si l’eau seule te lasse',
    ],
    section5Body2: 'Pendant une activité physique, pense aussi à boire avant, pendant et après l’effort pour compenser la transpiration.',
    compareTitle1: 'Idée reçue',
    compareText1: '« Boire beaucoup me fait plus gonfler. »',
    compareTitle2: 'Plutôt le contraire',
    compareText2: 'Une bonne hydratation aide le corps à moins retenir d’eau.',
    tipTitle: 'Bon à savoir',
    tipText: 'Les tisanes de gingembre ou de camomille apportent aussi une hydratation apaisante en période de crampes.',
    summaryPoints: [
      'Bien s’hydrater aide le corps à moins retenir d’eau et réduit les ballonnements.',
      'Vise environ 1,5 à 2 litres par jour, un peu plus pendant les règles.',
      'Les tisanes de gingembre ou de camomille apaisent aussi en période de crampes.',
      'Une soif intense et persistante mérite d’être signalée à un professionnel de santé.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Bien s’hydrater pendant le cycle — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE • HYDRATION',
    title: 'Staying hydrated\nthrough your cycle',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Counterintuitive but true: staying well hydrated helps your body retain less water throughout your cycle.',
    contentsTitle: 'In this article',
    topics: [
      'Why hydration matters',
      'Needs across the phases of your cycle',
      'What to drink day to day',
      'Signs of insufficient hydration',
      'Practical tips',
      'Common misconceptions',
      'Key takeaways',
    ],
    section1Body: 'Counterintuitive but true: staying well hydrated helps the body retain less water and reduces bloating, especially toward the end of the cycle.',
    infoTitle: 'Good to know',
    infoText: 'When the body is short on water, it tends to store more of it as a precaution. Drinking enough tells it, on the contrary, that it can release water more easily.',
    section2Body: 'Your water needs stay fairly stable overall, with a few nuances depending on the phase:',
    phaseNeeds: [
      {title: 'During your period', text: 'A little extra water helps offset fluid loss and limit bloating.'},
      {title: 'Around ovulation', text: 'Needs stay stable; a slight rise in body temperature can increase thirst.'},
      {title: 'Premenstrual phase', text: 'Good hydration helps limit the feeling of puffiness often felt during this time.'},
    ],
    section3Body: 'Aim for about 1.5 to 2 liters a day, a little more during your period to offset fluid loss.',
    dailyDrinks: [
      {title: 'Water, first and foremost', text: 'About 1.5 to 2 liters a day, a little more during your period.'},
      {title: 'Soothing herbal teas', text: 'Ginger or chamomile offer gentle hydration during cramps.'},
      {title: 'Sugar and caffeine, in moderation', text: 'Limiting very sugary or caffeinated drinks can help toward the end of the cycle.'},
    ],
    warningTitle: 'Worth keeping an eye on',
    lowHydrationSigns: [
      'Intense or unusual thirst',
      'Urine darker than usual',
      'Frequent headaches',
      'Fatigue with no other obvious explanation',
    ],
    section5Body: 'A few simple habits are often enough to stay hydrated without even thinking about it:',
    practicalTips: [
      'Keep a water bottle within reach throughout the day',
      'Pair a glass of water with a habit you already have (waking up, each meal)',
      'Mix in herbal infusions if plain water gets dull',
    ],
    section5Body2: 'During physical activity, remember to drink before, during, and after exercise to make up for sweat loss.',
    compareTitle1: 'Common belief',
    compareText1: '"Drinking a lot makes me more bloated."',
    compareTitle2: 'Actually the opposite',
    compareText2: 'Good hydration helps the body retain less water.',
    tipTitle: 'Good to know',
    tipText: 'Ginger or chamomile teas also offer soothing hydration during cramps.',
    summaryPoints: [
      'Staying well hydrated helps the body retain less water and reduces bloating.',
      'Aim for about 1.5 to 2 liters a day, a little more during your period.',
      'Ginger or chamomile teas can also soothe during cramps.',
      'Intense, persistent thirst is worth mentioning to a healthcare professional.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Staying hydrated through your cycle — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function HydrationCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoTitle}</Text>
              <Text style={styles.infoText}>{content.infoText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.normalGrid}>
            {content.phaseNeeds.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={PHASE_NEEDS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.comfortCard}>
            {content.dailyDrinks.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.dailyDrinks.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={DAILY_DRINKS_ICONS[index] as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>{item.title}</Text>
                  <Text style={styles.comfortText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <Text style={styles.warningTitle}>{content.warningTitle}</Text>
            </View>

            {content.lowHydrationSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <View style={styles.checkList}>
            {content.practicalTips.map(item => (
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

          <Text style={styles.body}>{content.section5Body2}</Text>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <View style={styles.compareCard}>
            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>{content.compareTitle1}</Text>
              <Text style={styles.compareText}>{content.compareText1}</Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={21}
                  color={theme.colors.success}
                />
              </View>

              <Text style={styles.compareTitle}>{content.compareTitle2}</Text>
              <Text style={styles.compareText}>{content.compareText2}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>{content.tipText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>{content.topics[6]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 10},
  comfortTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  comfortText: {marginTop: 3, fontSize: 10.8, lineHeight: 16, color: theme.colors.textSecondary},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},

  compareCard: {
    marginTop: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compareColumn: {flex: 1},
  compareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  compareTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  compareText: {marginTop: 4, fontSize: 10.5, lineHeight: 15.5, color: theme.colors.textSecondary},
  compareDivider: {width: 1, marginHorizontal: 12, backgroundColor: theme.colors.border},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.text},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
