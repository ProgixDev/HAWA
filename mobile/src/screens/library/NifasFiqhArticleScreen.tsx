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

const ID = 'nifasfiqh-repere-fiqh';

const HERO = require('../../assets/images/library/nifas-fiqh-hero.png');

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const STEPS = [
  'Observer la fin des pertes',
  'Effectuer la purification rituelle',
  'Reprendre les actes d’adoration concernés',
];

const FAQ = [
  {
    q: 'Le nifas dure-t-il toujours 40 jours ?',
    a: 'Non. 40 jours est une référence fréquemment utilisée, mais les références juridiques peuvent différer.',
  },
  {
    q: 'Que faire si les pertes s’arrêtent avant 40 jours ?',
    a: 'La reprise des actes d’adoration dépend des signes observés et de la référence religieuse suivie.',
  },
  {
    q: 'Et si les saignements continuent longtemps ?',
    a: 'S’ils dépassent la durée maximale retenue, leur statut religieux peut changer : demande un avis qualifié.',
  },
  {
    q: 'AWA peut-elle dire exactement si mes pertes sont encore du nifas ?',
    a: 'Non. AWA donne des repères éducatifs généraux et ne délivre ni fatwa ni décision personnalisée.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function NifasFiqhArticleScreen({
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
      message: 'Le nifas en pratique religieuse — AWA',
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
            <Text style={styles.badgeText}>NIFAS (FIQH)</Text>
          </View>

          <Text style={styles.title}>
            Le nifas en{`\n`}pratique religieuse
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'FAQ'],
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
            Comprendre le nifas, sa durée, la prière, le jeûne et la reprise
            des adorations après l’accouchement.
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
              'Qu’est-ce que le nifas ?',
              'Sa durée selon les références juridiques',
              'Prière pendant le nifas',
              'Jeûne pendant le nifas',
              'Purification et reprise des adorations',
              'Questions fréquentes',
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

          <Text style={styles.h2}>1. Qu’est-ce que le nifas ?</Text>

          <Text style={styles.body}>
            Le nifas désigne, dans la pratique religieuse, la période liée
            aux pertes de sang après l’accouchement. Les lochies décrivent
            l’aspect médical et physiologique de ces pertes ; le nifas est
            leur classification religieuse. Ces deux notions ne doivent pas
            être confondues.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>
              <Text style={styles.tipText}>
                AWA sépare volontairement les informations médicales sur les
                lochies des repères religieux sur le nifas.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            2. Sa durée selon les références juridiques
          </Text>

          <Text style={styles.question}>Combien de temps dure le nifas ?</Text>

          <Text style={styles.body}>
            La durée maximale peut varier selon l’école juridique ou la
            référence religieuse suivie. 40 jours est une référence
            fréquemment retenue, sans être présentée comme une règle
            universelle par AWA.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-star"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Repère souvent utilisé</Text>
              <Text style={styles.tipText}>
                Une référence fréquemment retenue est de 40 jours, mais AWA
                ne présente pas ce chiffre comme une vérité unique pour
                toutes les écoles juridiques. Suis la référence religieuse
                que tu as choisie.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. Prière pendant le nifas</Text>

          <Text style={styles.question}>Dois-je prier pendant le nifas ?</Text>

          <Text style={styles.body}>
            Pendant une période reconnue comme nifas selon la référence
            suivie, la prière rituelle est suspendue. AWA ne classe pas
            automatiquement les saignements et ne fournit pas de décision
            personnalisée. Aucun compteur de prières manquées n’est ajouté
            pour cette période.
          </Text>

          <Text style={styles.h2}>4. Jeûne pendant le nifas</Text>

          <Text style={styles.question}>Puis-je jeûner pendant le nifas ?</Text>

          <Text style={styles.body}>
            Le jeûne obligatoire n’est pas accompli pendant une période
            reconnue comme nifas. Les jours concernés sont ensuite traités
            par le rattrapage approprié, selon la référence suivie.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-refresh-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Organiser, sans décider</Text>
              <Text style={styles.tipText}>
                AWA peut t’aider à mémoriser ou organiser les jours
                concernés, sans émettre de décision religieuse personnalisée.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            5. Purification et reprise des adorations
          </Text>

          <Text style={styles.body}>
            La reprise dépend des signes observés et de la référence
            religieuse suivie.
          </Text>

          <View style={styles.checkList}>
            {STEPS.map((label, index) => (
              <View key={label} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>
                  {index + 1}. {label}
                </Text>
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
              <Text style={styles.tipTitle}>En cas de doute</Text>
              <Text style={styles.tipText}>
                Si les saignements persistent au-delà de la durée maximale
                retenue par la référence suivie, leur statut religieux peut
                changer. Un avis qualifié est recommandé.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. Questions fréquentes</Text>

          {FAQ.map(item => (
            <View key={item.q} style={styles.faqItem}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.body}>{item.a}</Text>
            </View>
          ))}

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Un repère, pas une fatwa</Text>
              <Text style={styles.tipText}>
                Les situations personnelles peuvent être différentes. En cas
                de doute, rapproche-toi d’un savant qualifié ou d’une
                organisation religieuse reconnue.
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
  question: {marginTop: 14, fontSize: 14, color: theme.colors.text, fontWeight: '800'},
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
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
  faqItem: {marginBottom: 4},
  });
}
