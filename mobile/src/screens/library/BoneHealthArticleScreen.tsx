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

const ID = 'bones-sante-osseuse';

const HERO = require('../../assets/images/library/food-magnesium.png');

const PREVENTION_HABITS = [
  ['bowl-mix-outline', 'Calcium (produits laitiers, légumes verts)'],
  ['weather-sunny', 'Vitamine D (soleil modéré, alimentation)'],
  ['shoe-sneaker', 'Exercices porteurs de poids (marche, renforcement)'],
  ['smoking-off', 'Limiter tabac et alcool'],
] as const;

const RISK_FACTORS = [
  'Des antécédents familiaux d’ostéoporose',
  'Une ménopause précoce (avant 45 ans)',
  'Un tabagisme actuel ou passé',
  'Une corpulence très mince ou une activité physique très faible',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BoneHealthArticleScreen({
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
      message: 'Prendre soin de sa santé osseuse — AWA',
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
            <Text style={styles.badgeText}>SANTÉ OSSEUSE</Text>
          </View>

          <Text style={styles.title}>
            Prendre soin de{`\n`}sa santé osseuse
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
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
            Pourquoi la ménopause augmente le risque d’ostéoporose, et
            comment protéger ses os au quotidien.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Pourquoi la ménopause fragilise les os',
              'Ostéopénie et ostéoporose',
              'Le dépistage par ostéodensitométrie',
              'Les piliers de la prévention',
              'Facteurs qui augmentent le risque',
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

          <Text style={styles.h2}>1. Pourquoi la ménopause fragilise les os</Text>

          <Text style={styles.body}>
            Les œstrogènes protègent naturellement la densité osseuse en
            freinant le renouvellement osseux. Leur baisse pendant la
            ménopause accélère la perte osseuse, surtout durant les
            premières années suivant l’arrêt des règles.
          </Text>

          <Text style={styles.h2}>2. Ostéopénie et ostéoporose</Text>

          <Text style={styles.body}>
            L’ostéopénie désigne une densité osseuse plus basse que la
            normale, sans atteindre le seuil de l’ostéoporose. L’ostéoporose
            correspond à une fragilité osseuse plus marquée, qui augmente le
            risque de fracture, notamment en cas de chute.
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
                Ces deux termes décrivent une perte de densité osseuse, pas
                une fracture déjà présente : ils invitent à la prévention,
                pas à l’inquiétude.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. Le dépistage par ostéodensitométrie</Text>

          <Text style={styles.body}>
            Cet examen indolore mesure la densité minérale osseuse. Il peut
            être proposé selon ton âge, tes antécédents personnels et
            familiaux, ou d’autres facteurs de risque identifiés avec ton
            médecin.
          </Text>

          <Text style={styles.h2}>4. Les piliers de la prévention</Text>

          <View style={styles.daily}>
            {PREVENTION_HABITS.map(([icon, label]) => (
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

          <Text style={styles.h2}>5. Facteurs qui augmentent le risque</Text>

          <View style={styles.checkList}>
            {RISK_FACTORS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
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
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Avoir un ou plusieurs de ces facteurs ne signifie pas
                développer une ostéoporose : ils aident surtout à orienter
                la discussion avec ton médecin sur un éventuel dépistage.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Calcium, vitamine D et activité physique porteuse de poids
                restent les gestes les plus utiles au quotidien pour
                préserver la solidité de tes os sur le long terme.
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
    color: theme.colors.textSecondary,
    fontWeight: '500',
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
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
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  });
}
