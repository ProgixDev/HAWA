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

const ID = 'prayerduringmenstruation-la-priere-suspendue';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const WORSHIP_ACTS = [
  ['hands-pray', 'Dhikr (évocation de Dieu)'],
  ['heart-outline', 'Du’a (invocations)'],
  ['hand-heart-outline', 'Charité'],
  ['account-heart-outline', 'Aider les autres'],
  ['book-open-variant', 'Apprentissage religieux'],
  ['headphones', 'Écoute de contenus religieux'],
  ['weather-night', 'Réflexion et gratitude'],
  ['emoticon-happy-outline', 'Gestes de bienveillance'],
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PrayerDuringMenstruationArticleScreen({
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
      message: 'La prière pendant les règles — AWA',
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

        {/* ARTICLE */}
        <View style={styles.article}>
          {/* CATEGORY */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              PRIÈRE PENDANT LES RÈGLES
            </Text>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>
            La prière pendant{`\n`}les règles
          </Text>

          {/* METADATA */}
          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
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

          {/* INTRODUCTION */}
          <Text style={styles.intro}>
            Pourquoi la prière rituelle est suspendue durant cette période,
            et comment vivre ce moment avec sérénité.
          </Text>

          {/* DISCLAIMER */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Information importante
              </Text>

              <Text style={styles.tipText}>
                {RELIGIOUS_DISCLAIMER}
              </Text>
            </View>
          </View>

          {/* TABLE OF CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'La prière suspendue pendant les règles',
              'Pas de rattrapage, contrairement au jeûne',
              'Les autres formes d’adoration restent possibles',
              'À retenir',
            ].map((item, index) => (
              <View key={item} style={styles.contentRow}>
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
          <Text style={styles.h2}>
            1. La prière suspendue pendant les règles
          </Text>

          <Text style={styles.body}>
            Pendant les règles, l’obligation de la prière (salat) est
            suspendue : la femme n’est pas tenue de prier durant cette
            période. Cette suspension fait partie intégrante de la pratique
            religieuse elle-même, reconnue de longue date par la tradition.
          </Text>

          <Text style={styles.body}>
            Cette suspension ne signifie en rien un éloignement de la foi
            ou un relâchement dans la pratique religieuse. Il s’agit d’une
            dispense reconnue, à vivre sans culpabilité : elle fait partie
            du cadre naturel de la vie spirituelle d’une femme.
          </Text>

          {/* TIP */}
          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                Cette période peut être abordée avec sérénité : elle ne
                remet en cause ni la valeur de la foi, ni la régularité de
                la pratique religieuse.
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Si les règles commencent pendant que la prière est en cours,
            celle-ci est interrompue : elle n’a pas besoin d’être terminée
            ni rattrapée. À l’inverse, lorsque les règles se terminent, la
            prière reprend normalement après le ghusl (grande ablution), qui
            marque le retour à l’état de pureté rituelle.
          </Text>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. Pas de rattrapage, contrairement au jeûne
          </Text>

          <Text style={styles.body}>
            Contrairement au jeûne du Ramadan, dont les jours manqués
            pendant les règles sont rattrapés plus tard (qadaa), les
            prières manquées pour cette même raison ne sont généralement
            pas rattrapées après. Cette différence s’explique par la nature
            même de ces deux actes d’adoration : la prière est un acte
            quotidien répété plusieurs fois par jour, tandis que le jeûne
            est annuel et concentré sur un mois précis.
          </Text>

          <Text style={styles.body}>
            Cette distinction peut surprendre lorsqu’on découvre le fiqh
            pour la première fois. Elle ne signifie pas que la prière compte
            moins : suivre la dispense telle qu’elle est prescrite fait,
            en soi, pleinement partie de la pratique religieuse.
          </Text>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. Les autres formes d’adoration restent possibles
          </Text>

          <Text style={styles.body}>
            Ne pas prier pendant les règles ne signifie pas être coupée de
            sa spiritualité. De nombreuses formes d’adoration et
            d’engagement religieux restent accessibles durant cette
            période.
          </Text>

          {/* WORSHIP GRID */}
          <View style={styles.daily}>
            {WORSHIP_ACTS.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* ONLY NECESSARY "À NOTER" */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                À noter
              </Text>

              <Text style={styles.tipText}>
                Certaines pratiques, comme la récitation ou la manipulation
                directe du Coran, peuvent faire l’objet d’avis différents
                selon les écoles juridiques. Se référer à l’avis suivi
                habituellement, ou demander conseil à un savant qualifié,
                aide à clarifier ces cas.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. À retenir
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                La prière suspendue pendant les règles est une dispense
                reconnue, à vivre sans culpabilité. De nombreuses formes de
                spiritualité restent accessibles durant cette période, et
                l’avis d’un savant qualifié reste la référence pour toute
                question précise.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}
      <ReadingControls
        articleId={ID}
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

  /* HERO */
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

  /* ARTICLE */
  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  /* BADGE */
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

  /* TITLE */
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },

  /* METADATA */
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

  /* INTRO */
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '500',
  },

  /* ALERT */
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* TABLE OF CONTENTS */
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

  /* SECTION TITLES */
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  /* BODY */
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /* WORSHIP GRID */
  daily: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

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

  /* TIP */
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
  });
}