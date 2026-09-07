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

const ID = 'flow-colors-textures';

const HERO = require('../../assets/images/library/flow-colors-hero.png');
const WARNING = require('../../assets/images/library/flow-colors-warning.png');

// fixed: these hex values are real educational flow-color swatches (this
// article's actual subject matter), not generic UI chrome — they must stay
// literal regardless of theme so the color example itself is accurate.
const COLORS = [
  [
    '#C42031',
    'Rouge vif',
    'Flux frais, nouveau sang. Fréquent en début de règles.',
  ],
  [
    '#7F2D31',
    'Rouge foncé',
    'Sang plus ancien, normal en milieu de cycle.',
  ],
  [
    '#9E7462',
    'Marron',
    'Sang oxydé, souvent en fin de règles.',
  ],
  [
    '#E66770',
    'Rose',
    'Peut indiquer un flux léger ou un changement hormonal.',
  ],
  [
    '#F47B2A',
    'Orange',
    'Peut être lié à une infection ou à un déséquilibre.',
  ],
] as const;

const TEXTURES = [
  [
    'Fluide',
    'Flux liquide, sans grumeaux.',
    require('../../assets/images/library/flow-texture-fluid.png'),
  ],
  [
    'Crémeux',
    'Texture épaisse et homogène.',
    require('../../assets/images/library/flow-texture-creamy.png'),
  ],
  [
    'Caillots',
    'Petits ou gros caillots de sang.',
    require('../../assets/images/library/flow-texture-clots.png'),
  ],
  [
    'Filaire / Mucus',
    'Élastique, transparent ou blanchâtre.',
    require('../../assets/images/library/flow-texture-mucus.png'),
  ],
  [
    'Tissus',
    'Morceaux de tissu ou de muqueuse.',
    require('../../assets/images/library/flow-texture-tissue.png'),
  ],
] as const;

// fixed: same reasoning as COLORS above — these dots illustrate the actual
// flow-color meanings discussed in the text, not decorative UI chrome.
const MEANINGS = [
  [
    '#B8182D',
    'Rouge vif à foncé',
    'Cycle normal. Ton corps élimine la muqueuse utérine.',
  ],
  [
    '#A97864',
    'Marron',
    'Sang plus ancien, rien d’inquiétant.',
  ],
  [
    '#E45F6B',
    'Rose',
    'Peut survenir en cas de début/fin de règles ou de déséquilibre hormonal.',
  ],
  [
    '#F47B2A',
    'Orange',
    'Surveille si accompagné d’odeur forte, démangeaisons ou douleurs.',
  ],
] as const;

const ADVICE = [
  [
    'calendar-month-outline',
    'Observe ton flux',
    'Note les changements chaque mois.',
  ],
  [
    'shield-cross-outline',
    'Choisis la protection adaptée',
    'Selon ton flux et ton confort.',
  ],
  [
    'heart-outline',
    'Écoute ton corps',
    'Il te donne des signaux précieux.',
  ],
  [
    'doctor',
    'En cas de doute',
    'Parle-en à un·e professionnel·le de santé.',
  ],
] as const;

const CONTENTS = [
  'Les couleurs du flux menstruel',
  'Les textures du flux',
  'Ce que chaque couleur peut indiquer',
  'Quand faut-il s’inquiéter ?',
  'Nos conseils pour mieux te connaître',
] as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function FlowColorsTexturesArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let active = true;

    loadLibraryState().then(() => {
      if (active) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleBookmark = () => {
    setSaved(toggleBookmark(ID));
  };

  const handleShare = () => {
    Share.share({
      message:
        'Flux menstruel : comprendre les couleurs et textures — AWA',
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

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
                accessibilityLabel="Favori"
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              CYCLE & BIEN-ÊTRE
            </Text>
          </View>

          <Text style={styles.title}>
            Flux menstruel : comprendre{`\n`}
            les couleurs et textures
          </Text>

          {/* MÉTADONNÉES */}
          <View style={styles.metas}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="clock-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  4 min de lecture
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="book-open-page-variant-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  Guide
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="chart-bar"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  Débutant
                </Text>
              </View>
            </View>

            <View style={styles.metaValidatedRow}>
              <MaterialDesignIcons
                name="shield-check-outline"
                size={19}
                color={theme.colors.textMuted}
              />
              <Text style={styles.metaText}>
                Contenu validé
              </Text>
            </View>
          </View>

          <Text style={styles.intro}>
            La couleur et la texture de tes règles
            en disent long sur ta santé hormonale.
            Apprends à les décrypter pour mieux
            comprendre ton cycle.
          </Text>

          {/* SOMMAIRE */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {CONTENTS.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
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
          <Text style={styles.sectionTitle}>
            1. Les couleurs du flux menstruel
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}>
            {COLORS.map(([color, name, text]) => (
              <View
                key={name}
                style={styles.smallCard}>
                <View style={styles.dropIcon}>
                  <MaterialDesignIcons
                    name="water"
                    size={34}
                    color={color}
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {name}
                </Text>

                <Text style={styles.cardText}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 2 */}
          <Text style={styles.sectionTitle}>
            2. Les textures du flux
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}>
            {TEXTURES.map(([name, text, image]) => (
              <View
                key={name}
                style={styles.smallCard}>
                <Image
                  source={image}
                  resizeMode="cover"
                  style={styles.textureImage}
                />

                <Text style={styles.cardTitle}>
                  {name}
                </Text>

                <Text style={styles.cardText}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 3 */}
          <Text style={styles.sectionTitle}>
            3. Ce que chaque couleur peut indiquer
          </Text>

          <View style={styles.meanings}>
            {MEANINGS.map(([color, name, text]) => (
              <View
                key={name}
                style={styles.meaning}>
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: color},
                  ]}
                />

                <View style={styles.meaningCopy}>
                  <Text style={styles.meaningName}>
                    {name}
                  </Text>

                  <Text style={styles.meaningText}>
                    {text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}
          <Text style={styles.sectionTitle}>
            4. Quand faut-il s’inquiéter ?
          </Text>

          <View style={styles.warning}>
            <Image
              source={WARNING}
              resizeMode="cover"
              style={styles.warningImage}
            />

            <View style={styles.warningOverlay}>
              <View style={styles.warningHeader}>
                <View style={styles.warningIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningTitle}>
                  Signes à surveiller
                </Text>
              </View>

              <View style={styles.warningList}>
                {[
                  'Saignements très abondants (changer de protection toutes les 1–2 h)',
                  'Présence de très gros caillots régulièrement',
                  'Mauvaise odeur persistante ou démangeaisons',
                  'Douleurs intenses inhabituelles',
                ].map(item => (
                  <View
                    key={item}
                    style={styles.warningRow}>
                    <View style={styles.warningBullet} />
                    <Text style={styles.warningText}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* SECTION 5 */}
          <Text style={styles.sectionTitle}>
            5. Nos conseils pour mieux te connaître
          </Text>

          <View style={styles.advice}>
            {ADVICE.map(([icon, name, text]) => (
              <View
                key={name}
                style={styles.adviceCard}>
                <View style={styles.adviceIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.adviceTitle}>
                  {name}
                </Text>

                <Text style={styles.adviceText}>
                  {text}
                </Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={4}
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
    paddingBottom: 26,
  },

  heroWrap: {
    height: 255,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
  },

  pressed: {
    opacity: 0.72,
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
    fontSize: 10.5,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  title: {
    marginTop: 12,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
  },

  metas: {
    marginTop: 15,
  },

  metaTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 11,
    backgroundColor: theme.colors.border,
  },

  metaValidatedRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  intro: {
    marginTop: 17,
    color: theme.colors.text,
    fontSize: 13.5,
    lineHeight: 20,
  },

  contents: {
    marginTop: 19,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 36,
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
    width: 23,
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 16,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 11,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
  },

  cards: {
    gap: 9,
    paddingRight: 8,
    paddingBottom: 3,
  },

  smallCard: {
    width: 136,
    minHeight: 178,
    padding: 11,
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  dropIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  textureImage: {
    width: 84,
    height: 68,
    borderRadius: 10,
  },

  cardTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  cardText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
  },

  meanings: {
    gap: 7,
  },

  meaning: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  dot: {
    width: 23,
    height: 23,
    borderRadius: 12,
    marginRight: 11,
  },

  meaningCopy: {
    flex: 1,
  },

  meaningName: {
    color: theme.colors.text,
    fontSize: 11.5,
    fontWeight: '800',
  },

  meaningText: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  warning: {
    marginTop: 3,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  warningImage: {
    width: '100%',
    height: 120,
  },

  warningOverlay: {
    padding: 13,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  warningIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.18),
  },

  warningTitle: {
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  warningList: {
    marginTop: 10,
    gap: 7,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  warningBullet: {
    width: 5,
    height: 5,
    marginTop: 6,
    marginRight: 8,
    borderRadius: 3,
    backgroundColor: theme.colors.warning,
  },

  warningText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 10.8,
    lineHeight: 16,
  },

  advice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  adviceCard: {
    width: '48.7%',
    minHeight: 124,
    padding: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  adviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  adviceTitle: {
    marginTop: 7,
    color: theme.colors.text,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  adviceText: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  });
}
