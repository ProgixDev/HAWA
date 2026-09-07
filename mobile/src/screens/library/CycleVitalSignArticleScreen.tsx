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

const ID = 'cycle-signe-vital';

const HERO = require('../../assets/images/library/regular-cycle-heartbeat.png');

// Section 1 — what to observe day to day.
const OBSERVE = [
  ['calendar-range', 'Durée du cycle'],
  ['calendar-clock', 'Durée des règles'],
  ['water-outline', 'Flux menstruel'],
  ['heart-pulse', 'Douleurs'],
  ['opacity', 'Pertes vaginales'],
  ['emoticon-outline', 'Humeur'],
  ['flash-outline', 'Énergie / fatigue'],
  ['clipboard-pulse-outline', 'Autres symptômes récurrents'],
] as const;

// Section 4 — factors that can influence the cycle. Same icon vocabulary as
// the reference "Cycle régulier ou irrégulier" article's own CAUSES list,
// for visual/editorial consistency across the family.
const FACTORS = [
  ['head-heart-outline', 'Stress'],
  ['weather-night', 'Manque de sommeil'],
  ['scale-bathroom', 'Changements de poids importants'],
  ['shoe-sneaker', 'Activité physique très intense'],
  ['molecule', 'Changements hormonaux'],
  ['pill', 'Contraception'],
  ['hospital-box-outline', 'Certaines conditions médicales'],
] as const;

const CHANGES_TO_WATCH = [
  'Un changement marqué dans la régularité du cycle',
  'Des règles nettement plus abondantes qu’à l’habitude',
  'Des douleurs inhabituellement fortes ou persistantes',
  'Une absence prolongée de règles',
  'Des saignements entre les règles',
  'Un changement important qui se répète sur plusieurs cycles',
];

const WHEN_TO_ASK = [
  'Des changements importants qui persistent sur plusieurs cycles',
  'Des douleurs qui empêchent de suivre tes activités habituelles',
  'Des règles très abondantes',
  'Une absence prolongée de règles',
  'Des saignements inhabituels',
  'Tout symptôme persistant qui t’inquiète',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function CycleVitalSignArticleScreen({
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
      message: 'Ton cycle, un excellent indicateur de santé — AWA',
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
            <Text style={styles.badgeText}>CYCLE & RÈGLES</Text>
          </View>

          <Text style={styles.title}>
            Ton cycle, un excellent{`\n`}indicateur de santé
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
            Pourquoi le cycle est parfois appelé le « cinquième signe
            vital ».
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Ton cycle : un reflet de ton corps',
              'Qu’est-ce qu’un cycle « normal » ?',
              'Les changements à surveiller',
              'Que peuvent révéler ces changements ?',
              'Suivre son cycle pour mieux se connaître',
              'Quand demander conseil ?',
              'Bon à savoir',
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

          <Text style={styles.h2}>1. Ton cycle : un reflet de ton corps</Text>

          <Text style={styles.body}>
            Le cycle menstruel est influencé par l’activité hormonale du
            corps tout au long du mois. Apprendre à l’observer peut t’aider
            à mieux comprendre ton propre fonctionnement, sans qu’il soit
            nécessaire de tout analyser en détail.
          </Text>

          <Text style={styles.body}>
            Voici les éléments les plus utiles à remarquer :
          </Text>

          <View style={styles.daily}>
            {OBSERVE.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={theme.colors.primary} size={25} />
                <Text style={styles.dailyText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. Qu’est-ce qu’un cycle « normal » ?</Text>

          <Text style={styles.body}>
            Il n’existe pas un seul cycle parfait : chaque corps a son propre
            rythme, et ce rythme peut aussi varier légèrement d’un mois à
            l’autre. Un cycle est généralement considéré comme régulier
            lorsque sa durée se situe entre 21 et 35 jours, et les règles
            durent le plus souvent de 3 à 7 jours.
          </Text>

          <Image
            source={require('../../assets/images/library/regular-cycle-balance.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <Text style={styles.body}>
            Ces repères restent des moyennes : de légères variations restent
            tout à fait normales, surtout après la puberté, un accouchement
            ou à l’approche de la ménopause.
          </Text>

          <Text style={styles.h2}>3. Les changements à surveiller</Text>

          <Text style={styles.body}>
            Certains changements méritent d’être observés avec un peu plus
            d’attention, notamment :
          </Text>

          <View style={styles.alertList}>
            {CHANGES_TO_WATCH.map(item => (
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

          <Text style={styles.body}>
            Un cycle inhabituel, isolé, ne signifie pas automatiquement un
            problème de santé : le corps peut réagir ponctuellement à de
            nombreux facteurs.
          </Text>

          <Text style={styles.h2}>4. Que peuvent révéler ces changements ?</Text>

          <Text style={styles.body}>
            Ces changements peuvent parfois être liés à plusieurs facteurs,
            sans qu’il s’agisse forcément d’un problème :
          </Text>

          <View style={styles.daily}>
            {FACTORS.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={theme.colors.primary} size={25} />
                <Text style={styles.dailyText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            Ce ne sont que des pistes possibles parmi d’autres : elles ne
            remplacent jamais l’avis d’un professionnel de santé.
          </Text>

          <Text style={styles.h2}>
            5. Suivre son cycle pour mieux se connaître
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={require('../../assets/images/library/regular-cycle-calendar.png')}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                Observer ton propre rythme
              </Text>

              <Text style={styles.visualText}>
                Noter tes dates, ton flux ou ton ressenti t’aide à mieux
                connaître tes habitudes, mois après mois.
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Le premier jour des règles, leur durée, le flux, les douleurs,
            l’humeur, l’énergie ou encore les pertes vaginales sont autant
            d’éléments que tu peux noter au fil du temps. L’objectif n’est
            pas de comparer ton cycle à celui d’une autre personne, mais de
            mieux repérer ce qui est habituel pour toi, et ce qui s’en
            écarte.
          </Text>

          <Text style={styles.h2}>6. Quand demander conseil ?</Text>

          <Text style={styles.body}>
            Il est tout à fait normal de se poser des questions sur son
            cycle. Demander un avis médical peut être utile dans certaines
            situations, par exemple :
          </Text>

          <Image
            source={require('../../assets/images/library/regular-cycle-consult.png')}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.checkList}>
            {WHEN_TO_ASK.map(item => (
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

          <Text style={styles.body}>
            En parler à un professionnel de santé permet d’être rassurée ou,
            si besoin, d’être accompagnée — ce n’est jamais un motif
            d’inquiétude en soi.
          </Text>

          <Text style={styles.h2}>7. Bon à savoir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Un cycle n’a pas besoin d’être parfaitement régulier pour
                être normal. Connaître ton propre rythme habituel est
                souvent plus utile que de chercher une durée idéale.
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Ton cycle menstruel est l’un des nombreux indicateurs de ta
            santé. Le suivre régulièrement peut t’aider à mieux comprendre
            ton corps et à repérer, avec le temps, les changements qui
            méritent une attention particulière.
          </Text>
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
    body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.text},
    wideImage: {width: '100%', height: 120, marginTop: 14, borderRadius: 12},
    visualCard: {
      marginTop: 15,
      minHeight: 98,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    visualImage: {width: 72, height: 72, borderRadius: 12},
    visualCopy: {flex: 1, marginLeft: 12},
    visualTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800'},
    visualText: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16},
    daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
    dailyItem: {
      width: '48.7%',
      minHeight: 108,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.primarySoft,
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
    alertList: {
      marginTop: 13,
      padding: 13,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 9,
    },
    checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
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
