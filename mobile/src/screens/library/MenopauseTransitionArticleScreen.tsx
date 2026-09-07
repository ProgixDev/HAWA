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

const ID = 'menopause-comprendre-la-transition';

const HERO = require('../../assets/images/library/spm-sleep.png');

const DAILY_HABITS = [
  ['bowl-mix-outline', 'Une alimentation riche en calcium et fibres'],
  ['shoe-sneaker', 'Une activité physique régulière'],
  ['weather-night', 'Une routine de sommeil stable'],
  ['meditation', 'Des moments de détente au quotidien'],
] as const;

const MYTHS = [
  'La ménopause « arrive d’un coup » — en réalité, elle est précédée de plusieurs années de transition (périménopause)',
  'Tous les symptômes sont sévères pour tout le monde — leur intensité varie énormément d’une femme à l’autre',
  'Rien ne peut être fait — de nombreuses solutions, hormonales ou non, existent pour soulager les symptômes gênants',
  'La vie intime s’arrête — elle évolue, mais reste tout à fait possible et épanouissante avec les bons ajustements',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenopauseTransitionArticleScreen({
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
      message: 'Comprendre la transition ménopausique — AWA',
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
            <Text style={styles.badgeText}>PÉRIMÉNOPAUSE & MÉNOPAUSE</Text>
          </View>

          <Text style={styles.title}>
            Comprendre la transition ménopausique
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '10 min de lecture'],
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
            Ce qui change progressivement, des années avant l’arrêt des
            règles, et comment aborder cette étape avec plus de clarté.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Périménopause et ménopause : les définitions',
              'Des cycles de plus en plus irréguliers',
              'Sommeil et humeur',
              'Vie intime et sécheresse vaginale',
              'Poids et métabolisme',
              'Idées reçues sur la ménopause',
              'Symptômes normaux et signaux à surveiller',
              'Conseils pratiques au quotidien',
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

          <Text style={styles.h2}>
            1. Périménopause et ménopause : les définitions
          </Text>

          <Text style={styles.body}>
            La périménopause désigne la période de transition hormonale qui
            précède la ménopause : elle peut débuter plusieurs années
            avant, généralement à partir de la quarantaine, avec des
            niveaux d’œstrogènes qui fluctuent de façon irrégulière.
          </Text>

          <Text style={styles.body}>
            La ménopause, elle, est un moment précis : elle est confirmée
            après 12 mois consécutifs sans règles, en l’absence d’autre
            cause. En France, elle survient en moyenne autour de 51 ans,
            mais cet âge varie naturellement d’une femme à l’autre.
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
                Chaque femme vit cette transition différemment, en durée
                comme en intensité des symptômes. En parler ouvertement
                aide à mieux l’anticiper.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>2. Des cycles de plus en plus irréguliers</Text>

          <Text style={styles.body}>
            L’un des premiers signes de la périménopause est souvent un
            changement dans le rythme des cycles : ils peuvent devenir plus
            courts, plus longs, plus espacés, ou avec un flux différent
            d’un mois à l’autre.
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
                Des saignements très abondants, très rapprochés, ou
                survenant après un an sans règles justifient un avis
                médical, car ils ne sont pas considérés comme un signe
                habituel de la transition.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. Sommeil et humeur</Text>

          <Text style={styles.body}>
            La baisse et les fluctuations d’œstrogènes et de progestérone
            peuvent perturber le sommeil (endormissement, réveils
            nocturnes) et s’accompagner d’une irritabilité, d’une anxiété
            ou de sautes d’humeur inhabituelles.
          </Text>

          <Text style={styles.body}>
            Ces changements ont une explication biologique réelle : ils ne
            traduisent ni un manque de volonté, ni un problème
            psychologique isolé.
          </Text>

          <Text style={styles.h2}>4. Vie intime et sécheresse vaginale</Text>

          <Text style={styles.body}>
            La baisse d’œstrogènes peut entraîner une sécheresse vaginale,
            parfois source d’inconfort ou de douleurs pendant les rapports.
            Le désir peut aussi évoluer, à la hausse comme à la baisse,
            selon les femmes.
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
                Des solutions simples existent (lubrifiants, hydratants
                vaginaux, traitements locaux) : en parler à un professionnel
                de santé permet de trouver une réponse adaptée, sans tabou.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>5. Poids et métabolisme</Text>

          <Text style={styles.body}>
            Le métabolisme peut ralentir légèrement pendant cette période,
            et la répartition des graisses a tendance à se déplacer vers
            l’abdomen. Ces changements sont courants et ne dépendent pas
            uniquement de la volonté.
          </Text>

          <Text style={styles.h2}>6. Idées reçues sur la ménopause</Text>

          <View style={styles.checkList}>
            {MYTHS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            7. Symptômes normaux et signaux à surveiller
          </Text>

          <Text style={styles.body}>
            La grande majorité des changements décrits ici sont des
            manifestations normales de la transition. Certains signes
            méritent en revanche une consultation plus rapide.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Consulter si</Text>
              <Text style={styles.tipText}>
                Saignements après la ménopause confirmée, douleurs
                pelviennes inhabituelles, symptômes qui perturbent
                fortement le quotidien, ou tout doute persistant.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>8. Conseils pratiques au quotidien</Text>

          <View style={styles.daily}>
            {DAILY_HABITS.map(([icon, label]) => (
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

          <Text style={styles.h2}>9. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                La périménopause et la ménopause sont des étapes naturelles,
                pas une maladie. De nombreuses solutions existent pour
                traverser cette transition avec plus de confort : un
                professionnel de santé reste la meilleure ressource pour
                les adapter à ta situation.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
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
