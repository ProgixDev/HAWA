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

const ID = 'religiousfaq-reperes-apres-une-perte';

const HERO = require('../../assets/images/library/spm-woman.png');

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est éducatif. Les questions religieuses précises doivent être vérifiées auprès d’un savant ou d’une savante qualifiée. AWA ne délivre pas de fatwas personnalisées.';

const GENTLE_STEPS = [
  'Prendre le temps de vivre son chagrin',
  'S’entourer de personnes bienveillantes',
  'Conserver de petits gestes spirituels si cela apporte du réconfort',
  'Demander conseil pour toute question religieuse précise',
  'Chercher du soutien si le chagrin devient trop difficile à porter',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReligiousFaqAfterLossArticleScreen({
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
      message: 'Repères spirituels après une perte — AWA',
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
          {/* HEADER */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>REPÈRES SPIRITUELS</Text>
          </View>

          <Text style={styles.title}>
            Repères spirituels{`\n`}après une perte
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '5 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu éducatif'],
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
            Quelques repères spirituels pour traverser une perte avec
            douceur, patience et bienveillance.
          </Text>

          {/* DISCLAIMER */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Information importante</Text>
              <Text style={styles.tipText}>
                {RELIGIOUS_DISCLAIMER}
              </Text>
            </View>
          </View>

          {/* CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Une épreuve reconnue',
              'Un statut selon la situation',
              'Patience et espérance',
              'Quelques repères pour avancer',
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
          <Text style={styles.h2}>1. Une épreuve reconnue</Text>

          <Text style={styles.body}>
            Une perte de grossesse peut être une épreuve profondément
            douloureuse. La tristesse, le silence, la confusion ou le
            besoin de prendre du recul sont des réactions humaines
            naturelles.
          </Text>

          <Text style={styles.body}>
            Ressentir ces émotions ne signifie pas manquer de foi. Chacune
            peut vivre son deuil à son propre rythme.
          </Text>

          {/* SIMPLE VISUAL */}
          <View style={styles.visualCard}>
            <View style={styles.visualIcon}>
              <MaterialDesignIcons
                name="heart-outline"
                size={30}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.visualText}>
              <Text style={styles.visualTitle}>Accueillir ses émotions</Text>
              <Text style={styles.visualBody}>
                Tristesse • besoin de repos • silence • soutien
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. Un statut qui peut varier selon la situation
          </Text>

          <Text style={styles.body}>
            Après une perte, les règles religieuses peuvent dépendre de la
            situation et de la nature des saignements.
          </Text>

          <Text style={styles.body}>
            Il peut notamment être nécessaire de distinguer différents
            types de saignements avant de déterminer les pratiques
            religieuses à suivre.
          </Text>

          {/* SCHEMA */}
          <View style={styles.schema}>
            <Text style={styles.schemaTitle}>Le principe général</Text>

            <View style={styles.schemaRow}>
              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <Text style={styles.schemaNumber}>1</Text>
                </View>
                <Text style={styles.schemaLabel}>
                  Situation
                </Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.primary}
              />

              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <Text style={styles.schemaNumber}>2</Text>
                </View>
                <Text style={styles.schemaLabel}>
                  Nature du saignement
                </Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.primary}
              />

              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <Text style={styles.schemaNumber}>3</Text>
                </View>
                <Text style={styles.schemaLabel}>
                  Avis adapté
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>En cas de doute</Text>
              <Text style={styles.tipText}>
                Une situation personnelle peut nécessiter une réponse
                différente. Il est préférable de demander conseil à une
                personne qualifiée.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. Patience et espérance</Text>

          <Text style={styles.body}>
            La patience (sabr) ne signifie pas ne pas pleurer ou ne pas
            ressentir de douleur. Elle peut simplement accompagner le
            cheminement avec foi et espérance.
          </Text>

          <Text style={styles.body}>
            De petits gestes peuvent aider à retrouver progressivement un
            sentiment d’apaisement : une invocation, un moment de dhikr,
            une écoute spirituelle ou la présence d’un proche.
          </Text>

          {/* SPIRITUALITY VISUAL */}
          <View style={styles.spiritualCard}>
            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="heart-outline"
                size={23}
                color={theme.colors.primary}
              />
              <Text style={styles.spiritualText}>Invocation</Text>
            </View>

            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="hands-pray"
                size={23}
                color={theme.colors.primary}
              />
              <Text style={styles.spiritualText}>Dhikr</Text>
            </View>

            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={23}
                color={theme.colors.primary}
              />
              <Text style={styles.spiritualText}>Soutien</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>
              <Text style={styles.tipText}>
                La guérison prend du temps. Il n’existe pas de rythme
                universel pour traverser une perte.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. Quelques repères pour avancer</Text>

          <Text style={styles.body}>
            Il n’est pas nécessaire de tout faire à la fois. Choisis ce
            qui correspond à ton état et à tes besoins du moment.
          </Text>

          <View style={styles.checkList}>
            {GENTLE_STEPS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* FINAL MESSAGE */}
          <View style={styles.finalCard}>
            <MaterialDesignIcons
              name="flower-outline"
              size={28}
              color={theme.colors.primary}
            />

            <Text style={styles.finalTitle}>Un chemin à ton rythme</Text>

            <Text style={styles.finalText}>
              Prendre soin de soi, chercher du soutien et conserver
              l’espérance peuvent accompagner progressivement le chemin
              vers l’apaisement.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
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
    color: theme.colors.text,
    fontWeight: '500',
  },

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
    marginTop: 24,
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
    color: theme.colors.textMuted,
  },

  visualCard: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  visualIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  visualText: {
    flex: 1,
    marginLeft: 12,
  },

  visualTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },

  visualBody: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },

  schema: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  schemaTitle: {
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },

  schemaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  schemaStep: {
    flex: 1,
    alignItems: 'center',
  },

  schemaCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  schemaLabel: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },

  spiritualCard: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  spiritualItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  spiritualText: {
    marginTop: 7,
    fontSize: 11,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
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
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  finalCard: {
    marginTop: 18,
    padding: 18,
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  finalTitle: {
    marginTop: 8,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  finalText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  });
}