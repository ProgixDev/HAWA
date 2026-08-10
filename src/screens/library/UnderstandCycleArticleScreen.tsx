import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ReadingControls from '../../components/articles/ReadingControls';
import type {RootStackParamList} from '../../navigation/AppNavigator';
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

const ARTICLE_ID = 'cycle-comprendre-ton-cycle';

const INK = '#282238';
const INK_SOFT = '#4A4357';
const PURPLE = '#5B43A5';
const BORDER = '#E8E4EC';
const SURFACE = '#FFFFFF';
const BACKGROUND = '#FAF9FB';
const MUTED = '#756F7E';
const PINK = '#C96F83';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

const STATS = [
  {icon: 'water', title: 'Durée moyenne', text: '28 jours'},
  {icon: 'calendar-range', title: 'Durée normale', text: '21 à 35 jours'},
  {icon: 'circle-slice-4', title: '4 grandes phases', text: 'dans ton cycle'},
  {icon: 'heart-pulse', title: 'Chaque cycle', text: 'est unique'},
] as const;

const PHASES = [
  {
    number: '01',
    icon: 'water',
    color: '#B95C73',
    title: 'Les règles',
    days: 'Jours 1 à 5',
    text: 'Ton corps se libère de la muqueuse utérine.',
  },
  {
    number: '02',
    icon: 'leaf',
    color: '#6B8D6B',
    title: 'Phase folliculaire',
    days: 'Jours 6 à 13',
    text: 'Ton corps se prépare à l’ovulation.',
  },
  {
    number: '03',
    icon: 'white-balance-sunny',
    color: '#A87A32',
    title: 'Ovulation',
    days: 'Jour 14 environ',
    text: 'L’ovule est libéré. C’est la période la plus fertile.',
  },
  {
    number: '04',
    icon: 'flower-tulip-outline',
    color: '#71569A',
    title: 'Phase lutéale',
    days: 'Jours 15 à 28',
    text: 'Ton corps se prépare à une éventuelle grossesse.',
  },
] as const;

const REASONS = [
  {icon: 'emoticon-happy-outline', label: 'Mieux comprendre ton corps'},
  {icon: 'lightning-bolt', label: 'Adapter ton énergie'},
  {icon: 'heart-outline', label: 'Anticiper ton humeur'},
  {icon: 'shield-outline', label: 'Prendre soin de ta santé'},
  {icon: 'calendar-month-outline', label: 'Suivre ton cycle facilement'},
] as const;

function UnderstandCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (!mounted) {
        return;
      }

      setBookmarked(isArticleBookmarked(ARTICLE_ID));
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    saveScrollPosition(ARTICLE_ID, event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={80}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        <View style={styles.header}>
          <Pressable
            onPress={navigation.goBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({pressed}) => [
              styles.circle,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              name="chevron-left"
              size={25}
              color={INK}
            />
          </Pressable>

          <View style={styles.actions}>
            <Pressable
              onPress={() =>
                setBookmarked(
                  toggleBookmark(ARTICLE_ID),
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Favori"
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name={
                  bookmarked
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                size={19}
                color={PURPLE}
              />
            </Pressable>

            <Pressable
              onPress={() =>
                Share.share({
                  title:
                    'Comprendre ton cycle menstruel',
                  message:
                    'Comprendre ton cycle menstruel · AWA',
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Partager"
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="share-variant-outline"
                size={19}
                color={PURPLE}
              />
            </Pressable>
          </View>
        </View>

        <LinearGradient
          colors={['#F7F3FB', '#F5EFFA', '#F2EBF9']}
          start={{x: 0, y: 0.55}}
          end={{x: 1, y: 0.45}}
          style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.pill}>
              <MaterialDesignIcons
                name="feather"
                size={12}
                color={PURPLE}
              />
              <Text style={styles.pillText}>
                Comprendre son cycle
              </Text>
            </View>

            <Text style={styles.title}>
              Comprendre ton cycle menstruel
            </Text>

            <View style={styles.metaContainer}>
              <View style={styles.metaTopRow}>
                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="clock-outline"
                    size={14}
                    color={MUTED}
                  />
                  <Text style={styles.metaText}>
                    6 min de lecture
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="book-open-page-variant-outline"
                    size={14}
                    color={MUTED}
                  />
                  <Text style={styles.metaText}>
                    Guide
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name="chart-bar"
                    size={14}
                    color={MUTED}
                  />
                  <Text style={styles.metaText}>
                    Débutant
                  </Text>
                </View>
              </View>

              <View style={styles.metaValidatedRow}>
                <MaterialDesignIcons
                  name="shield-check-outline"
                  size={14}
                  color={MUTED}
                />
                <Text style={styles.metaText}>
                  Contenu validé
                </Text>
              </View>
            </View>

            <Text style={styles.summary}>
              Les grandes étapes de ton cycle,
              expliquées simplement.
            </Text>
          </View>

          <View style={styles.heroImageWrap}>
            <Image
              source={require('../../assets/images/understand-cycle-hero.png')}
              resizeMode="cover"
              style={styles.heroImage}
            />
          </View>
        </LinearGradient>

        <View style={styles.statsCard}>
          {STATS.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.stat,
                index < STATS.length - 1 &&
                  styles.statBorder,
              ]}>
              <MaterialDesignIcons
                name={item.icon}
                size={20}
                color={PURPLE}
              />
              <Text style={styles.statTitle}>
                {item.title}
              </Text>
              <Text style={styles.statText}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              PHASES DU CYCLE
            </Text>
            <Text style={styles.sectionTitle}>
              Les 4 grandes phases
            </Text>
          </View>

          <Text style={styles.sectionIntro}>
            Chaque phase a un rôle important dans
            ton corps et peut influencer ton
            énergie, ton humeur et tes symptômes.
          </Text>

          <View style={styles.phaseList}>
            {PHASES.map((phase, index) => (
              <View
                key={phase.title}
                style={[
                  styles.phaseRow,
                  index < PHASES.length - 1 &&
                    styles.phaseDivider,
                ]}>
                <View style={styles.phaseNumberBox}>
                  <Text style={styles.phaseNumber}>
                    {phase.number}
                  </Text>
                </View>

                <View style={styles.phaseCopy}>
                  <View style={styles.phaseTitleRow}>
                    <MaterialDesignIcons
                      name={phase.icon}
                      size={17}
                      color={phase.color}
                    />
                    <Text
                      style={[
                        styles.phaseTitle,
                        {color: phase.color},
                      ]}>
                      {phase.title}
                    </Text>
                  </View>

                  <Text style={styles.phaseDays}>
                    {phase.days}
                  </Text>

                  <Text style={styles.phaseText}>
                    {phase.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['#F3F0F8', '#FAF8FC']}
          style={styles.knowCard}>
          <View style={styles.knowIcon}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={19}
              color={PURPLE}
            />
          </View>

          <View style={styles.knowCopy}>
            <Text style={styles.knowTitle}>
              À savoir
            </Text>
            <Text style={styles.knowText}>
              Ton cycle peut varier d’un mois à
              l’autre. Stress, sommeil,
              alimentation ou maladie peuvent
              influencer sa durée et son rythme.
            </Text>
          </View>

          <Image
            source={require('../../assets/images/understand-cycle-journal.png')}
            resizeMode="cover"
            style={styles.journalImage}
          />
        </LinearGradient>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              POURQUOI LE SUIVRE
            </Text>
            <Text style={styles.sectionTitle}>
              Mieux comprendre ton cycle
            </Text>
          </View>

          <View style={styles.reasonsList}>
            {REASONS.map((reason, index) => (
              <View
                key={reason.label}
                style={[
                  styles.reasonRow,
                  index < REASONS.length - 1 &&
                    styles.reasonDivider,
                ]}>
                <MaterialDesignIcons
                  name={reason.icon}
                  size={18}
                  color={PURPLE}
                />
                <Text style={styles.reasonText}>
                  {reason.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['#F8F4F5', '#FCFAFA']}
          style={styles.wellbeing}>
          <View style={styles.wellIcon}>
            <MaterialDesignIcons
              name="heart-outline"
              size={19}
              color={PINK}
            />
          </View>

          <View style={styles.wellCopy}>
            <Text style={styles.wellTitle}>
              Conseil bien-être
            </Text>
            <Text style={styles.wellText}>
              Écoute ton corps, reste attentive à
              tes ressentis et note ce qui change
              au fil des jours.
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>

      <ReadingControls
        articleId={ARTICLE_ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

const shadow = {
  shadowColor: '#211B2A',
  shadowOffset: {width: 0, height: 3},
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  content: {
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
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
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  pressed: {
    opacity: 0.72,
    transform: [{scale: 0.98}],
  },

  hero: {
    minHeight: 232,
    marginTop: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE2F4',
    paddingLeft: 16,
    paddingVertical: 16,
    ...shadow,
  },

  heroCopy: {
    width: '65%',
    zIndex: 2,
    paddingTop: 0,
    paddingRight: 7,
  },

  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(91,67,165,0.20)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.58)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  pillText: {
    color: PURPLE,
    fontSize: 10.5,
    fontWeight: '700',
  },

  title: {
    marginTop: 10,
    maxWidth: '100%',
    color: INK,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 21.5,
    fontWeight: '700',
  },

  metaContainer: {
    marginTop: 11,
    alignItems: 'flex-start',
  },

  metaTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 6,
    backgroundColor: '#D8D2DC',
  },

  metaValidatedRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    color: MUTED,
    fontSize: 9.2,
    lineHeight: 12,
  },

  summary: {
    marginTop: 11,
    color: INK_SOFT,
    fontSize: 10.8,
    lineHeight: 15.5,
  },

  heroImageWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '38%',
    overflow: 'hidden',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'transparent',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  statsCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: SURFACE,
    paddingVertical: 12,
    ...shadow,
  },

  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  statBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: BORDER,
  },

  statTitle: {
    marginTop: 7,
    color: INK,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  statText: {
    marginTop: 3,
    color: MUTED,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },

  sectionCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    backgroundColor: SURFACE,
    padding: 14,
    ...shadow,
  },

  sectionHeader: {
    marginBottom: 8,
  },

  sectionEyebrow: {
    color: MUTED,
    fontSize: 9.5,
    letterSpacing: 1.1,
    fontWeight: '700',
  },

  sectionTitle: {
    marginTop: 4,
    color: INK,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '800',
  },

  sectionIntro: {
    color: INK_SOFT,
    fontSize: 11,
    lineHeight: 16,
  },

  phaseList: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },

  phaseRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },

  phaseDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  phaseNumberBox: {
    width: 38,
    paddingTop: 1,
  },

  phaseNumber: {
    color: '#A39CA9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  phaseCopy: {
    flex: 1,
    minWidth: 0,
  },

  phaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  phaseTitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 15.5,
    fontWeight: '800',
  },

  phaseDays: {
    marginTop: 4,
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
  },

  phaseText: {
    marginTop: 5,
    color: INK_SOFT,
    fontSize: 10.5,
    lineHeight: 15,
  },

  knowCard: {
    marginTop: 16,
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E0EC',
    borderRadius: 16,
    padding: 15,
  },

  knowIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCD5E8',
    borderRadius: 12,
    backgroundColor: '#F8F6FA',
  },

  knowCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 72,
  },

  knowTitle: {
    color: INK,
    fontSize: 12.5,
    fontWeight: '800',
  },

  knowText: {
    marginTop: 5,
    color: INK_SOFT,
    fontSize: 10.5,
    lineHeight: 15,
  },

  journalImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 78,
    height: 82,
    opacity: 0.9,
    borderRadius: 14,
  },

  reasonsList: {
    marginTop: 8,
  },

  reasonRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
  },

  reasonDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  reasonText: {
    flex: 1,
    color: INK_SOFT,
    fontSize: 11,
    lineHeight: 15.5,
    fontWeight: '600',
  },

  wellbeing: {
    marginTop: 16,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderColor: '#ECE1E4',
    borderRadius: 16,
    padding: 15,
  },

  wellIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8D5DA',
    borderRadius: 12,
    backgroundColor: '#FBF7F8',
  },

  wellCopy: {
    flex: 1,
    minWidth: 0,
  },

  wellTitle: {
    color: INK,
    fontSize: 12.5,
    fontWeight: '800',
  },

  wellText: {
    marginTop: 5,
    color: INK_SOFT,
    fontSize: 10.5,
    lineHeight: 15,
  },

});

export default UnderstandCycleArticleScreen;