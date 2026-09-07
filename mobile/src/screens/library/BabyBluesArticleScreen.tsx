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

const ID = 'emotionalhealth-baby-blues';

/* -------------------------------------------------------------------------- */
/*                                    IMAGE                                   */
/* -------------------------------------------------------------------------- */

const HERO = require('../../assets/images/library/rules-hero.png');

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const META_ITEMS = [
  ['clock-outline', '10 min de lecture'],
  ['book-open-page-variant-outline', 'Article'],
  ['chart-bar', 'Débutant'],
  ['shield-check-outline', 'Contenu validé'],
] as const;

const CONTENTS = [
  'Comprendre le baby blues',
  'Les signes les plus fréquents',
  'Ce qui aide au quotidien',
  'Baby blues ou dépression post-partum ?',
  'Quand demander de l’aide',
  'À retenir',
] as const;

const COMMON_SIGNS = [
  [
    'emoticon-sad-outline',
    'Émotivité',
    'Pleurer plus facilement ou se sentir particulièrement sensible.',
  ],
  [
    'heart-outline',
    'Hypersensibilité',
    'Les émotions peuvent sembler plus fortes et changer rapidement.',
  ],
  [
    'weather-cloudy',
    'Variations d’humeur',
    'Un sentiment de fragilité peut alterner avec des moments de bien-être.',
  ],
  [
    'sleep',
    'Fatigue',
    'La fatigue des premiers jours peut amplifier les émotions.',
  ],
] as const;

const DAILY_SUPPORT = [
  [
    'sleep',
    'Se reposer',
    'Profiter des moments disponibles pour récupérer.',
  ],
  [
    'account-group-outline',
    'Accepter de l’aide',
    'Ne pas hésiter à demander du soutien autour de soi.',
  ],
  [
    'cup-water',
    'Boire régulièrement',
    'Garder une hydratation suffisante au cours de la journée.',
  ],
  [
    'food-apple-outline',
    'Manger suffisamment',
    'Privilégier des repas réguliers et simples.',
  ],
] as const;

const ATTENTION_SIGNS = [
  'Les symptômes durent plus de deux semaines.',
  'La tristesse ou l’angoisse devient plus intense.',
  'Il devient difficile de s’occuper de soi ou du bébé.',
  'Un sentiment de détresse important apparaît.',
] as const;

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function BabyBluesArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [saved, setSaved] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  /* ------------------------------------------------------------------------ */
  /*                              LOAD BOOKMARK                               */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /*                                BOOKMARK                                  */
  /* ------------------------------------------------------------------------ */

  const handleBookmark = () => {
    const nextValue = toggleBookmark(ID);
    setSaved(nextValue);
  };

  /* ------------------------------------------------------------------------ */
  /*                                  SHARE                                    */
  /* ------------------------------------------------------------------------ */

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Baby blues et santé émotionnelle post-partum',
        message:
          'Baby blues et santé émotionnelle post-partum — AWA\n\nUn guide pour comprendre les changements émotionnels fréquents après la naissance.',
      });
    } catch {
      // Le partage peut être annulé par l'utilisateur.
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                   */
  /* ------------------------------------------------------------------------ */

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
        scrollEventThrottle={200}
        onScroll={event => {
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          );
        }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          {/* HEADER */}

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={24}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved
                    ? 'Retirer des favoris'
                    : 'Ajouter aux favoris'
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
                accessibilityLabel="Partager"
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

        {/* ================================================================== */}
        {/* ARTICLE                                                            */}
        {/* ================================================================== */}

        <View style={styles.article}>
          {/* CATEGORY */}

          <View style={styles.badge}>
            <MaterialDesignIcons
              name="heart-outline"
              size={13}
              color={theme.colors.primary}
            />

            <Text style={styles.badgeText}>
              POST-PARTUM • SANTÉ ÉMOTIONNELLE
            </Text>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            Baby blues et santé{`\n`}
            émotionnelle post-partum
          </Text>

          {/* SUBTITLE */}

          <Text style={styles.subtitle}>
            Comprendre ce qui peut changer émotionnellement après
            la naissance et savoir quand demander du soutien.
          </Text>

          {/* ================================================================= */}
          {/* META                                                              */}
          {/* ================================================================= */}

          <View style={styles.metas}>
            {META_ITEMS.map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 && <View style={styles.metaDivider} />}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={16}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* ================================================================= */}
          {/* INTRODUCTION                                                      */}
          {/* ================================================================= */}

          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>
                À savoir
              </Text>

              <Text style={styles.introText}>
                Après une naissance, il est courant de traverser
                une période de grande sensibilité émotionnelle.
                Le baby blues est généralement temporaire, mais une
                souffrance qui persiste ou s’intensifie mérite une
                attention professionnelle.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* TABLE OF CONTENTS                                                 */}
          {/* ================================================================= */}

          <View style={styles.contents}>
            <View style={styles.contentsHeader}>
              <View>
                <Text style={styles.contentsEyebrow}>
                  GUIDE
                </Text>

                <Text style={styles.contentsTitle}>
                  Dans cet article
                </Text>
              </View>

              <View style={styles.contentsCount}>
                <Text style={styles.contentsCountText}>
                  {String(CONTENTS.length).padStart(2, '0')}
                </Text>
              </View>
            </View>

            {CONTENTS.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.contentRow,
                  index === CONTENTS.length - 1 &&
                    styles.contentRowLast,
                ]}>
                <View style={styles.contentLeft}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 01                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="01"
            kicker="COMPRENDRE"
            title="Qu’est-ce que le baby blues ?"
          />

          <Text style={styles.body}>
            Le baby blues correspond à une période de changements
            émotionnels qui peut survenir dans les premiers jours
            après la naissance. Les variations hormonales, la
            fatigue, le manque de sommeil et l’adaptation à cette
            nouvelle étape peuvent contribuer à cette sensibilité.
          </Text>

          <Text style={styles.body}>
            Ce n’est pas un échec et cela ne signifie pas que l’on
            est une mauvaise mère. Chaque personne vit les premiers
            jours du post-partum à sa manière.
          </Text>

          {/* STAT CARD */}

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.statCopy}>
              <Text style={styles.statTitle}>
                Un phénomène fréquent
              </Text>

              <Text style={styles.statText}>
                Le baby blues est fréquent après l’accouchement et
                tend à s’améliorer spontanément en quelques jours.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 02                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="02"
            kicker="LES SIGNES"
            title="Ce que l’on peut ressentir"
          />

          <Text style={styles.body}>
            Les manifestations sont variables. Certaines personnes
            ressentent surtout de la fatigue et de la sensibilité,
            tandis que d’autres peuvent avoir des changements
            d’humeur plus marqués.
          </Text>

          {/* SIGNS GRID */}

          <View style={styles.signGrid}>
            {COMMON_SIGNS.map(
              ([icon, title, description]) => (
                <View
                  key={title}
                  style={styles.signCard}>
                  <View style={styles.signIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.signTitle}>
                    {title}
                  </Text>

                  <Text style={styles.signDescription}>
                    {description}
                  </Text>
                </View>
              ),
            )}
          </View>

          {/* ================================================================= */}
          {/* SECTION 03                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="03"
            kicker="QUOTIDIEN"
            title="Ce qui peut aider"
          />

          <Text style={styles.body}>
            Pendant cette période, les besoins de récupération sont
            importants. De petites choses simples peuvent rendre
            les journées plus confortables.
          </Text>

          {/* SUPPORT LIST */}

          <View style={styles.supportList}>
            {DAILY_SUPPORT.map(
              ([icon, title, description], index) => (
                <View
                  key={title}
                  style={styles.supportRow}>
                  <View style={styles.supportIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={21}
                      color={theme.colors.success}
                    />
                  </View>

                  <View style={styles.supportCopy}>
                    <Text style={styles.supportTitle}>
                      {title}
                    </Text>

                    <Text style={styles.supportDescription}>
                      {description}
                    </Text>
                  </View>

                  <View style={styles.supportNumber}>
                    <Text style={styles.supportNumberText}>
                      {index + 1}
                    </Text>
                  </View>
                </View>
              ),
            )}
          </View>

          {/* QUOTE */}

          <View style={styles.quoteCard}>
            <View style={styles.quoteIcon}>
              <MaterialDesignIcons
                name="format-quote-open"
                size={25}
                color={theme.colors.primary}
              />
            </View>

            <Text style={styles.quoteText}>
              « Demander de l’aide pendant le post-partum est une
              façon de prendre soin de soi et de son bébé. »
            </Text>
          </View>

          {/* ================================================================= */}
          {/* SECTION 04                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="04"
            kicker="DIFFÉRENCIER"
            title="Baby blues ou dépression post-partum ?"
          />

          <Text style={styles.body}>
            Le baby blues est généralement bref et s’améliore
            progressivement. Une dépression post-partum est
            différente : elle peut être plus persistante, plus
            intense et avoir un impact important sur le quotidien.
          </Text>

          {/* COMPARISON */}

          <View style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <View style={styles.compareHeaderIcon}>
                <MaterialDesignIcons
                  name="compare-horizontal"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>
                Deux situations à distinguer
              </Text>
            </View>

            <View style={styles.compareItem}>
              <View style={styles.compareDotNormal} />

              <View style={styles.compareCopy}>
                <Text style={styles.compareItemTitle}>
                  Baby blues
                </Text>

                <Text style={styles.compareItemText}>
                  Souvent bref, avec une amélioration progressive au
                  fil des jours.
                </Text>
              </View>
            </View>

            <View style={styles.compareLine} />

            <View style={styles.compareItem}>
              <View style={styles.compareDotAttention} />

              <View style={styles.compareCopy}>
                <Text style={styles.compareItemTitle}>
                  Dépression post-partum
                </Text>

                <Text style={styles.compareItemText}>
                  Peut durer davantage, s’intensifier et nécessiter
                  un accompagnement professionnel.
                </Text>
              </View>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 05                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="05"
            kicker="VIGILANCE"
            title="Quand demander de l’aide ?"
          />

          <Text style={styles.body}>
            Il est important de parler à un professionnel de santé
            si la souffrance émotionnelle ne s’améliore pas, devient
            plus intense ou commence à compliquer le quotidien.
          </Text>

          {/* ATTENTION CARD */}

          <View style={styles.attentionCard}>
            <View style={styles.attentionHeader}>
              <View style={styles.attentionIcon}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={22}
                  color={theme.colors.warning}
                />
              </View>

              <View style={styles.attentionHeaderCopy}>
                <Text style={styles.attentionTitle}>
                  Signaux à surveiller
                </Text>

                <Text style={styles.attentionSubtitle}>
                  Parlez-en à un professionnel si…
                </Text>
              </View>
            </View>

            {ATTENTION_SIGNS.map((item, index) => (
              <View
                key={item}
                style={styles.attentionRow}>
                <View style={styles.attentionBullet}>
                  <Text style={styles.attentionBulletText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.attentionText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* PROFESSIONAL SUPPORT                                              */}
          {/* ================================================================= */}

          <View style={styles.professionalCard}>
            <View style={styles.professionalIcon}>
              <MaterialDesignIcons
                name="stethoscope"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.professionalCopy}>
              <Text style={styles.professionalTitle}>
                Un accompagnement est possible
              </Text>

              <Text style={styles.professionalText}>
                Une sage-femme, un médecin, un psychologue ou un
                autre professionnel de santé peut écouter, évaluer
                la situation et proposer un accompagnement adapté.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* GOOD TO KNOW                                                      */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <MaterialDesignIcons
                name="lightbulb-outline"
                size={23}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                Les émotions du post-partum ne sont pas une mesure
                de la qualité de ton rôle de mère. Tu as le droit
                d’avoir besoin de repos, d’écoute et de soutien.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 06                                                        */}
          {/* ================================================================= */}

          <SectionHeading
            styles={styles}
            number="06"
            kicker="ESSENTIEL"
            title="À retenir"
          />

          <View style={styles.takeawayList}>
            <Takeaway styles={styles} successColor={theme.colors.success} text="Le baby blues est fréquent après une naissance." />

            <Takeaway styles={styles} successColor={theme.colors.success} text="La fatigue et les changements hormonaux peuvent influencer l’humeur." />

            <Takeaway styles={styles} successColor={theme.colors.success} text="Le soutien de l’entourage peut faciliter cette période." />

            <Takeaway
              styles={styles}
              successColor={theme.colors.success}
              text="Une souffrance persistante ou importante mérite une évaluation professionnelle."
              last
            />
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                         */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              Cet article a une vocation informative et ne remplace
              pas un avis médical personnalisé. En cas de doute ou
              de souffrance importante, adresse-toi à un professionnel
              de santé.
            </Text>
          </View>

          {/* ================================================================= */}
          {/* END                                                                */}
          {/* ================================================================= */}

          <View style={styles.endMark}>
            <View style={styles.endLine} />

            <View style={styles.endIcon}>
              <MaterialDesignIcons
                name="heart-outline"
                size={18}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.endLine} />
          </View>

          <Text style={styles.endText}>
            Prendre soin de soi fait aussi partie du post-partum.
          </Text>
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={10}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             SECTION HEADING                                */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  styles,
  number,
  kicker,
  title,
}: {
  styles: ReturnType<typeof createStyles>;
  number: string;
  kicker: string;
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionKicker}>
          {kicker}
        </Text>

        <Text style={styles.h2}>
          {title}
        </Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                TAKEAWAY                                    */
/* -------------------------------------------------------------------------- */

function Takeaway({
  styles,
  successColor,
  text,
  last = false,
}: {
  styles: ReturnType<typeof createStyles>;
  successColor: string;
  text: string;
  last?: boolean;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.takeawayRow,
        last && styles.takeawayRowLast,
      ]}>
      <View style={styles.takeawayCheck}>
        <MaterialDesignIcons
          name="check"
          size={16}
          color={successColor}
        />
      </View>

      <Text style={styles.takeawayText}>
        {text}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                  */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                    */
  /* ------------------------------------------------------------------------ */

  heroWrap: {
    height: 265,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },


  /* ------------------------------------------------------------------------ */
  /* TOP BAR                                                                 */
  /* ------------------------------------------------------------------------ */

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadow,
  },

  pressed: {
    opacity: 0.72,
    transform: [{scale: 0.96}],
  },

  /* ------------------------------------------------------------------------ */
  /* HERO LABEL (currently unused, kept theme-safe for future use)           */
  /* ------------------------------------------------------------------------ */

  heroLabel: {
    position: 'absolute',
    left: 20,
    bottom: 31,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 7,

    borderRadius: 20,

    backgroundColor: withAlpha(theme.colors.text, 0.72),

    gap: 6,
  },

  heroLabelIcon: {
    width: 21,
    height: 21,
    borderRadius: 11,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: withAlpha(theme.colors.surface, 0.12),
  },

  heroLabelText: {
    color: theme.colors.surface,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                 */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -22,

    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 35,

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    backgroundColor: theme.colors.background,
  },

  /* ------------------------------------------------------------------------ */
  /* BADGE                                                                   */
  /* ------------------------------------------------------------------------ */

  badge: {
    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,

    backgroundColor: theme.colors.primarySoft,

    gap: 5,
  },

  badgeText: {
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.35,
  },

  /* ------------------------------------------------------------------------ */
  /* TITLE                                                                   */
  /* ------------------------------------------------------------------------ */

  title: {
    marginTop: 13,

    fontFamily: 'serif',
    fontSize: 29,
    lineHeight: 35,

    color: theme.colors.text,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 10,

    fontSize: 14,
    lineHeight: 21,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* META                                                                    */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 17,

    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',

    gap: 9,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 19,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* INTRO CARD                                                              */
  /* ------------------------------------------------------------------------ */

  introCard: {
    marginTop: 21,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 17,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  introIcon: {
    width: 41,
    height: 41,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  introCopy: {
    flex: 1,
    marginLeft: 11,
  },

  introTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  introText: {
    marginTop: 4,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* CONTENTS                                                                */
  /* ------------------------------------------------------------------------ */

  contents: {
    marginTop: 22,

    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 5,

    borderRadius: 18,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 6,
  },

  contentsEyebrow: {
    fontSize: 8.5,
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 1,
  },

  contentsTitle: {
    marginTop: 2,

    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentsCount: {
    width: 35,
    height: 35,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  contentsCountText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 48,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  contentRowLast: {
    borderBottomWidth: 0,
  },

  contentLeft: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
  },

  numberCircle: {
    width: 26,
    height: 26,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,

    marginRight: 10,
  },

  numberText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,

    fontSize: 12.2,
    lineHeight: 17,

    color: theme.colors.text,
  },

  /* ------------------------------------------------------------------------ */
  /* SECTION HEADING                                                         */
  /* ------------------------------------------------------------------------ */

  sectionHeading: {
    marginTop: 31,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  sectionNumber: {
    width: 39,
    height: 39,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  sectionNumberText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  sectionHeadingCopy: {
    flex: 1,

    marginLeft: 11,
    paddingTop: 1,
  },

  sectionKicker: {
    fontSize: 8.5,

    color: theme.colors.primary,
    fontWeight: '900',

    letterSpacing: 1,
  },

  h2: {
    marginTop: 2,

    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,

    color: theme.colors.text,
    fontWeight: '700',
  },

  /* ------------------------------------------------------------------------ */
  /* BODY                                                                    */
  /* ------------------------------------------------------------------------ */

  body: {
    marginTop: 11,

    fontSize: 14,
    lineHeight: 22,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* STAT CARD                                                               */
  /* ------------------------------------------------------------------------ */

  statCard: {
    marginTop: 17,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 16,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  statIcon: {
    width: 45,
    height: 45,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  statCopy: {
    flex: 1,
    marginLeft: 12,
  },

  statTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  statText: {
    marginTop: 4,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SIGNS                                                                    */
  /* ------------------------------------------------------------------------ */

  signGrid: {
    marginTop: 14,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',

    gap: 9,
  },

  signCard: {
    width: '48.3%',
    minHeight: 158,

    padding: 13,

    borderRadius: 16,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadow,
  },

  signIcon: {
    width: 37,
    height: 37,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  signTitle: {
    marginTop: 10,

    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  signDescription: {
    marginTop: 5,

    fontSize: 10.5,
    lineHeight: 15.5,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* SUPPORT                                                                  */
  /* ------------------------------------------------------------------------ */

  supportList: {
    marginTop: 14,
    gap: 9,
  },

  supportRow: {
    minHeight: 77,

    padding: 11,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 16,

    backgroundColor: withAlpha(theme.colors.success, 0.12),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  supportIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  supportCopy: {
    flex: 1,
    marginLeft: 11,
  },

  supportTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  supportDescription: {
    marginTop: 3,

    fontSize: 10.5,
    lineHeight: 15,

    color: theme.colors.textMuted,
  },

  supportNumber: {
    width: 25,
    height: 25,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  supportNumberText: {
    fontSize: 9,
    color: theme.colors.success,
    fontWeight: '900',
  },

  /* ------------------------------------------------------------------------ */
  /* QUOTE                                                                    */
  /* ------------------------------------------------------------------------ */

  quoteCard: {
    marginTop: 19,

    padding: 18,

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  quoteIcon: {
    width: 30,
    height: 30,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: theme.colors.surface,
  },

  quoteText: {
    marginTop: 8,

    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 23,

    color: theme.colors.text,
    fontStyle: 'italic',
  },

  /* ------------------------------------------------------------------------ */
  /* COMPARISON                                                               */
  /* ------------------------------------------------------------------------ */

  compareCard: {
    marginTop: 15,

    padding: 15,

    borderRadius: 18,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,

    ...theme.shadow,
  },

  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 13,
  },

  compareHeaderIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  compareTitle: {
    flex: 1,

    marginLeft: 10,

    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  compareItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // The two dots below are a genuine two-state legend (not decorative):
  // green = baby blues (mild, self-resolving), amber = postpartum
  // depression (needs professional evaluation). Both states map cleanly
  // onto the app's existing success/warning semantic tokens, so no fixed
  // hex value is needed here — this is not a documented exception.
  compareDotNormal: {
    width: 10,
    height: 10,

    borderRadius: 5,

    marginTop: 4,

    backgroundColor: theme.colors.success,
  },

  compareDotAttention: {
    width: 10,
    height: 10,

    borderRadius: 5,

    marginTop: 4,

    backgroundColor: theme.colors.warning,
  },

  compareCopy: {
    flex: 1,
    marginLeft: 10,
  },

  compareItemTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  compareItemText: {
    marginTop: 4,

    fontSize: 10.8,
    lineHeight: 16,

    color: theme.colors.textMuted,
  },

  compareLine: {
    height: 1,

    marginVertical: 14,

    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* ATTENTION                                                                */
  /* ------------------------------------------------------------------------ */

  attentionCard: {
    marginTop: 15,

    padding: 15,

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.warning, 0.12),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  attentionIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  attentionHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  attentionTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  attentionSubtitle: {
    marginTop: 3,

    fontSize: 10.5,
    color: theme.colors.warning,
  },

  attentionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginTop: 9,
  },

  attentionBullet: {
    width: 23,
    height: 23,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  attentionBulletText: {
    fontSize: 9,
    color: theme.colors.warning,
    fontWeight: '900',
  },

  attentionText: {
    flex: 1,

    marginLeft: 9,
    paddingTop: 2,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* PROFESSIONAL                                                             */
  /* ------------------------------------------------------------------------ */

  professionalCard: {
    marginTop: 16,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 18,

    backgroundColor: theme.colors.surfaceSecondary,

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  professionalIcon: {
    width: 43,
    height: 43,

    borderRadius: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  professionalCopy: {
    flex: 1,
    marginLeft: 11,
  },

  professionalTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  professionalText: {
    marginTop: 5,

    fontSize: 11,
    lineHeight: 16.5,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* TIP                                                                      */
  /* ------------------------------------------------------------------------ */

  tip: {
    marginTop: 17,

    padding: 15,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.primary, 0.08),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
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
    marginTop: 5,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* TAKEAWAYS                                                                */
  /* ------------------------------------------------------------------------ */

  takeawayList: {
    marginTop: 14,

    padding: 15,

    borderRadius: 18,

    backgroundColor: withAlpha(theme.colors.success, 0.12),

    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginBottom: 13,
  },

  takeawayRowLast: {
    marginBottom: 0,
  },

  takeawayCheck: {
    width: 27,
    height: 27,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.surface,
  },

  takeawayText: {
    flex: 1,

    marginLeft: 9,
    paddingTop: 3,

    fontSize: 11.5,
    lineHeight: 17,

    color: theme.colors.textSecondary,
  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 20,

    padding: 13,

    flexDirection: 'row',
    alignItems: 'flex-start',

    borderRadius: 14,

    backgroundColor: theme.colors.surfaceSecondary,
  },

  disclaimerText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 10,
    lineHeight: 15,

    color: theme.colors.textMuted,
  },

  /* ------------------------------------------------------------------------ */
  /* END                                                                      */
  /* ------------------------------------------------------------------------ */

  endMark: {
    marginTop: 29,

    flexDirection: 'row',
    alignItems: 'center',
  },

  endLine: {
    flex: 1,

    height: 1,

    backgroundColor: theme.colors.border,
  },

  endIcon: {
    width: 35,
    height: 35,

    marginHorizontal: 10,

    borderRadius: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: theme.colors.primarySoft,
  },

  endText: {
    marginTop: 10,

    textAlign: 'center',

    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 20,

    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  });
}
