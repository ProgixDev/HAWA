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

const ID = 'istihada-comprendre-les-saignements';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

const ART = {
  observe: require('../../assets/images/library/flow-texture-creamy.png'),
};

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const DIFFERENCES = [
  ['calendar-clock-outline', 'Durée par rapport à ton cycle habituel'],
  ['repeat-variant', 'Régularité ou caractère inhabituel du saignement'],
  ['water-outline', 'Évolution du saignement dans le temps'],
  ['clipboard-pulse-outline', 'Présence éventuelle d’une cause médicale connue'],
] as const;

const OBSERVE_TIPS = [
  'Noter la date de début et, si possible, la durée habituelle de tes cycles',
  'Observer si le saignement suit une évolution proche de tes règles précédentes',
  'Ne pas te baser uniquement sur une seule journée isolée',
  'Consigner ces observations si tu prévois de consulter un savant ou un professionnel de santé',
];

const DOUBT_STEPS = [
  'Te référer à la durée et au rythme habituels de tes propres règles',
  'Consulter un professionnel de santé si le saignement est inhabituel ou prolongé',
  'Demander l’avis d’un savant ou d’une savante qualifiée pour la dimension religieuse',
  'Garder à l’esprit qu’une réponse générale ne remplace pas un avis adapté à ta situation',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function IstihadaArticleScreen({
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
      message: 'Comprendre l’Istihâda — AWA',
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
            <Text style={styles.badgeText}>ISTIHÂDA</Text>
          </View>

          <Text style={styles.title}>Comprendre l’Istihâda</Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'FAQ'],
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
            Distinguer un saignement irrégulier des règles habituelles, avec
            des repères généraux pour t’orienter.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Information importante</Text>
              <Text style={styles.tipText}>{RELIGIOUS_DISCLAIMER}</Text>
            </View>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Qu’est-ce que l’Istihâda ?',
              'Pourquoi peut-elle être difficile à identifier ?',
              'Les différences entre menstruation et Istihâda',
              'Comment observer les saignements ?',
              'Prière et jeûne pendant l’Istihâda',
              'Que faire en cas de doute ?',
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

          <Text style={styles.h2}>1. Qu’est-ce que l’Istihâda ?</Text>

          <Text style={styles.body}>
            L’Istihâda désigne un saignement qui survient en dehors du cycle
            menstruel habituel, ou qui se prolonge au-delà de la durée des
            règles reconnue par la tradition islamique. Contrairement aux
            règles (hayd) ou au nifas (saignement après l’accouchement),
            elle n’a pas le même statut rituel : elle est généralement
            considérée comme un saignement de nature différente, parfois
            lié à une cause médicale.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Ce contenu explique le concept de manière générale ; il ne
                permet pas de déterminer si un saignement précis correspond
                à une Istihâda dans ta situation personnelle.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            2. Pourquoi peut-elle être difficile à identifier ?
          </Text>

          <Text style={styles.body}>
            Il peut être difficile de distinguer l’Istihâda des règles ou
            d’un cycle irrégulier, car les saignements peuvent parfois se
            ressembler, varier en intensité, ou se prolonger de façon
            inhabituelle. Cette difficulté est reconnue par les savants
            eux-mêmes, ce qui explique l’existence de plusieurs approches
            pour l’identifier.
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
                Il est normal de ne pas savoir immédiatement à quoi
                correspond un saignement inhabituel ; ce doute est une
                situation courante, pas une erreur de ta part.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            3. Les différences entre menstruation et Istihâda
          </Text>

          <Text style={styles.body}>
            Certains éléments peuvent aider à orienter la réflexion, sans
            constituer des règles universelles, car les repères précis
            varient selon les écoles juridiques.
          </Text>

          <View style={styles.daily}>
            {DIFFERENCES.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{label}</Text>
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
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Ces éléments sont des repères généraux et non des critères
                absolus : ils peuvent être interprétés différemment selon
                les savants et les écoles juridiques.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. Comment observer les saignements ?</Text>

          <Text style={styles.body}>
            Prendre le temps d’observer ses saignements sur plusieurs jours,
            sans précipitation, aide à mieux comprendre sa propre situation
            avant d’en tirer une conclusion.
          </Text>

          <Image
            source={ART.observe}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>Quelques repères pratiques</Text>

            {OBSERVE_TIPS.map(item => (
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

          <Text style={styles.h2}>5. Prière et jeûne pendant l’Istihâda</Text>

          <Text style={styles.body}>
            Dans le cas de l’Istihâda, la prière et le jeûne restent
            généralement obligatoires, à la différence des règles. Des
            précautions d’hygiène (comme des protections adaptées) sont
            alors recommandées pour permettre la pratique du culte, selon
            les modalités enseignées par les différentes écoles juridiques.
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
                Les précautions précises (comme le renouvellement des
                ablutions) peuvent varier selon l’école juridique suivie ;
                se référer à l’avis habituellement suivi ou à un savant
                qualifié aide à les appliquer correctement.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. Que faire en cas de doute ?</Text>

          <Text style={styles.body}>
            Un doute persistant sur la nature d’un saignement est une
            situation fréquente, qui ne doit pas être source d’inquiétude
            excessive.
          </Text>

          <View style={styles.checkList}>
            {DOUBT_STEPS.map(item => (
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
              <Text style={styles.tipTitle}>Information importante</Text>
              <Text style={styles.tipText}>
                Ce contenu reste éducatif et général : il ne constitue pas
                une fatwa ni une décision religieuse individuelle. Pour
                toute situation personnelle, en particulier en cas de doute
                prolongé, l’avis d’un savant qualifié reste la référence.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>7. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                L’Istihâda est un concept qui distingue un saignement
                inhabituel des règles ou du nifas, avec des implications
                spécifiques sur la prière et le jeûne. En cas de doute,
                l’observation attentive et l’avis d’un savant qualifié
                restent les meilleures ressources.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
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
  wideImage: {width: '100%', height: 120, marginTop: 14, borderRadius: 12},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
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
  checkList: {
    marginTop: 13,
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
