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

const ID = 'pcos-acne-hormonale';

const HERO = require('../../assets/images/library/featured-cycle.png');

const RECOGNIZE_SIGNS = [
  ['map-marker-outline', 'Bas du visage : mâchoire, menton'],
  ['circle-outline', 'Boutons plus profonds, parfois douloureux'],
  ['calendar-refresh', 'Réapparition souvent aux mêmes endroits'],
  ['palette-outline', 'Rougeurs ou marques qui persistent'],
] as const;

const CARE_HABITS = [
  ['face-woman-outline', 'Nettoyer la peau en douceur, matin et soir'],
  ['water-off-outline', 'Éviter les produits agressifs ou décapants'],
  ['weather-sunny', 'Protéger sa peau du soleil au quotidien'],
  ['hand-back-left-outline', 'Ne pas percer ou triturer les boutons'],
] as const;

const CONSULT_REASONS = [
  ['clock-alert-outline', 'Acné qui persiste malgré des soins adaptés'],
  ['emoticon-sad-outline', 'Boutons douloureux ou profonds (nodules, kystes)'],
  ['alert-circle-outline', 'Acné sévère ou qui s’aggrave rapidement'],
  ['blur', 'Marques ou cicatrices qui s’installent'],
] as const;

const KEY_POINTS = [
  'L’acné hormonale a une cause identifiable, liée aux androgènes.',
  'Elle touche souvent le bas du visage et peut s’aggraver avant les règles.',
  'Ce n’est ni un manque d’hygiène, ni une fatalité.',
  'Des soins doux et, si besoin, un traitement adapté peuvent l’améliorer.',
  'Un dermatologue ou un gynécologue peut t’accompagner en cas de persistance.',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosHormonalAcneArticleScreen({
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
      message: 'Comprendre l’acné hormonale — AWA',
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
          {/* HEADER */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SOPK • ACNÉ HORMONALE</Text>
          </View>

          <Text style={styles.title}>
            Comprendre{`\n`}l’acné hormonale
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
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
            Pourquoi l’acné hormonale peut apparaître avec le SOPK, comment
            la reconnaître et quelles solutions peuvent aider à la prendre
            en charge.
          </Text>

          <Text style={styles.introSecondary}>
            Elle touche de nombreuses femmes et n’est ni un manque
            d’hygiène, ni une fatalité : comprendre son origine aide à
            mieux la prendre en charge.
          </Text>

          {/* CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Qu’est-ce que l’acné hormonale ?',
              'Pourquoi le SOPK peut provoquer de l’acné ?',
              'Comment reconnaître l’acné hormonale',
              'Acné hormonale et cycle menstruel',
              'Ce qui peut aider',
              'Quand consulter ?',
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

          {/* 1 */}
          <Text style={styles.h2}>1. Qu’est-ce que l’acné hormonale ?</Text>

          <Text style={styles.body}>
            L’acné hormonale est une forme d’acné directement liée aux
            fluctuations ou à un déséquilibre des hormones, notamment des
            androgènes. Contrairement à l’acné plus classique de
            l’adolescence, elle touche souvent des femmes adultes et peut
            persister ou apparaître après cette période.
          </Text>

          <Text style={styles.body}>
            Elle se distingue aussi par sa localisation, sa profondeur et
            sa tendance à réapparaître aux mêmes endroits malgré des soins
            habituels bien suivis.
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
                L’acné hormonale n’est pas liée à un manque d’hygiène : se
                laver davantage le visage ne la fait pas disparaître, et
                peut même irriter la peau.
              </Text>
            </View>
          </View>

          {/* 2 */}
          <Text style={styles.h2}>
            2. Pourquoi le SOPK peut provoquer de l’acné ?
          </Text>

          <Text style={styles.body}>
            Dans le SOPK, un excès relatif d’androgènes stimule les glandes
            sébacées, qui produisent alors plus de sébum. Certaines peaux
            sont aussi plus sensibles à ces hormones, ce qui explique
            pourquoi l’acné peut être marquée même sans déséquilibre majeur
            mesuré en laboratoire.
          </Text>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>
              Ce n’est pas une question de volonté : cette sensibilité
              varie d’une personne à l’autre et ne dépend pas de tes
              habitudes de vie.
            </Text>
          </View>

          {/* 3 */}
          <Text style={styles.h2}>
            3. Comment reconnaître l’acné hormonale
          </Text>

          <Text style={styles.body}>
            Certaines caractéristiques reviennent souvent, sans être
            systématiques :
          </Text>

          <View style={styles.daily}>
            {RECOGNIZE_SIGNS.map(([icon, label]) => (
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

          {/* 4 */}
          <Text style={styles.h2}>4. Acné hormonale et cycle menstruel</Text>

          <Text style={styles.body}>
            L’acné hormonale peut fluctuer au fil du cycle. Beaucoup de
            femmes remarquent une poussée dans les jours précédant les
            règles, lorsque la progestérone augmente puis chute
            brutalement, stimulant temporairement la production de sébum.
          </Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>Suivre ses poussées</Text>

              <Text style={styles.highlightText}>
                Noter les dates d’apparition des boutons par rapport à ton
                cycle peut t’aider, toi et ton dermatologue, à mieux
                comprendre le lien hormonal.
              </Text>
            </View>
          </View>

          {/* 5 */}
          <Text style={styles.h2}>5. Ce qui peut aider</Text>

          <Text style={styles.body}>
            Certaines habitudes de soin simples peuvent limiter les
            poussées, sans les faire disparaître complètement à elles
            seules :
          </Text>

          <View style={styles.daily}>
            {CARE_HABITS.map(([icon, label]) => (
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

          <Text style={styles.body}>
            Selon la situation, un dermatologue ou un gynécologue peut
            proposer des traitements locaux (crèmes, gels) ou, si
            nécessaire, un traitement hormonal adapté.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons name="doctor" size={24} color={theme.colors.warning} />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Pas d’automédication</Text>
              <Text style={styles.tipText}>
                Les traitements contre l’acné hormonale (locaux ou
                hormonaux) doivent être prescrits et suivis par un
                professionnel de santé, en particulier en cas de désir de
                grossesse.
              </Text>
            </View>
          </View>

          {/* 6 */}
          <Text style={styles.h2}>6. Quand consulter ?</Text>

          <Text style={styles.body}>
            Un avis médical est particulièrement utile dans certaines
            situations :
          </Text>

          <View style={styles.consultCard}>
            {CONSULT_REASONS.map(([icon, text]) => (
              <View key={text} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* 7 */}
          <Text style={styles.h2}>7. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>Les points essentiels</Text>
            </View>

            {KEY_POINTS.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons name="check" size={17} color={theme.colors.success} />
                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* FINAL NOTE */}
          <View style={styles.finalNote}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={23}
              color={theme.colors.textMuted}
            />

            <View style={styles.finalNoteCopy}>
              <Text style={styles.finalNoteTitle}>
                Un guide pour mieux comprendre
              </Text>

              <Text style={styles.finalNoteText}>
                Cet article est destiné à l’information générale et ne
                remplace pas une consultation médicale. En cas de doute ou
                de symptômes persistants, demande conseil à un
                professionnel de santé.
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
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  introSecondary: {
    marginTop: 9,
    fontSize: 13.5,
    lineHeight: 20.5,
    color: theme.colors.textMuted,
  },
  contents: {
    marginTop: 20,
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
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 25,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},
  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  neutralBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  neutralText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
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
  highlightBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlightCopy: {flex: 1, marginLeft: 10},
  highlightTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  highlightText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  consultCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  summaryCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  summaryTitle: {color: theme.colors.text, fontSize: 15, fontWeight: '800'},
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  summaryText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  finalNote: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  finalNoteCopy: {flex: 1, marginLeft: 10},
  finalNoteTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  finalNoteText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16.5,
  },
  });
}
